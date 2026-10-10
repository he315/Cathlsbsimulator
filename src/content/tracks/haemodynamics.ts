import type { Track } from "../schema";

export const haemodynamics: Track = {
  id: "haemodynamics",
  order: 2,
  title: "Haemodynamics",
  tagline: "Right and left heart catheterisation, waveforms, valves and shunts",
  description:
    "How to acquire clean pressure and saturation data, read every waveform from the right atrium to the aorta, calculate output, resistance, shunts and valve areas, and use haemodynamics to separate constriction from restriction, recognise tamponade and HOCM, and profile shock.",
  stage: 2,
  modules: [
    // =====================================================================
    // MODULE 1 — BASICS
    // =====================================================================
    {
      id: "hd-basics",
      title: "Pressure systems, catheters and a safe right heart study",
      stage: 2,
      summary:
        "How a fluid-filled system converts pressure into a waveform, how to zero, level and test it, which catheters and access routes to use, and how to run a right heart study in a fixed, safe sequence.",
      objectives: [
        "Distinguish zeroing from levelling and estimate the error introduced by a misplaced transducer.",
        "Use the fast-flush test to recognise over- and under-damping and correct the cause.",
        "Choose catheters and venous access for right and combined right and left heart catheterisation.",
        "Perform a right heart study in a reproducible sequence and avoid its main complications.",
      ],
      lessons: [
        {
          id: "hd-basics-transducers",
          title: "From pressure to waveform: transducers, zeroing and levelling",
          minutes: 7,
          refs: ["hanna-pcm", "esc-ph-2022"],
          blocks: [
            {
              kind: "p",
              text: "Every pressure you record in the catheter laboratory travels from the catheter tip along a column of saline to a transducer. Inside the transducer a diaphragm deforms in proportion to the pressure applied, and a strain gauge turns that deformation into an electrical signal that is amplified, filtered and displayed. Each link in the chain can add error, so a haemodynamic study is only as good as its set-up.",
            },
            { kind: "h", text: "The fluid-filled system" },
            {
              kind: "table",
              caption: "Components of a fluid-filled pressure system and how each fails",
              head: ["Component", "Role", "Typical failure"],
              rows: [
                ["Catheter", "Transmits pressure from the tip (end hole or side holes)", "Kinking, clot, tip against a wall, contrast left in the lumen"],
                ["Pressure tubing", "Carries the pressure wave to the transducer", "Soft or overly long tubing damps or rings"],
                ["Manifold and stopcocks", "Allow flushing, sampling and contrast injection", "Air bubbles, loose connections, partially turned taps"],
                ["Transducer", "Converts pressure into an electrical signal", "Wrong height, not zeroed, drift over time"],
                ["Amplifier and display", "Scales and filters the signal", "Wrong scale, inappropriate filtering that hides artefact"],
              ],
            },
            { kind: "h", text: "Zeroing: removing atmospheric pressure" },
            {
              kind: "p",
              text: "Zeroing tells the recorder what atmospheric pressure looks like, so that every intravascular value is expressed relative to the air around the patient. Turn the transducer stopcock off to the patient and open to air, press zero, then close the port and restore the column to the patient. Re-zero whenever the transducer has been disconnected or moved, before any critical measurement, and periodically in long studies, because transducers drift.",
            },
            { kind: "h", text: "Levelling: removing hydrostatic error" },
            {
              kind: "p",
              text: "Levelling is a separate step. The air–fluid interface of the transducer must sit at the height of the chamber of interest, conventionally the left atrium. In a supine patient the traditional landmark is the phlebostatic axis (fourth intercostal space in the mid-axillary line). The 2022 ESC/ERS pulmonary hypertension guideline recommends the mid-thoracic level, halfway between the front of the sternum and the table surface, which approximates the left atrium in most adults.",
            },
            {
              kind: "formula",
              name: "Hydrostatic offset",
              expr: "Error (mmHg) ≈ height difference (cm) × 0.74",
              note: "1 mmHg ≈ 1.36 cmH2O. A transducer 10 cm below the left atrium adds about 7 mmHg to every reading; 10 cm above subtracts about 7 mmHg.",
            },
            {
              kind: "p",
              text: "Hydrostatic error is a fixed offset added to every value. It barely matters in the aorta but is decisive at right-heart pressures: a transducer 7 cm too low turns a wedge pressure of 13 mmHg into about 18 mmHg and can move a patient from pre-capillary to post-capillary pulmonary hypertension.",
            },
            { kind: "h", text: "Two transducers at once" },
            {
              kind: "p",
              text: "Simultaneous recordings (left ventricle with aorta, wedge with left ventricle, left with right ventricle) need two transducers zeroed and levelled together. Before you trust a gradient, prove that both channels read the same pressure from the same chamber, for example with both catheters in the ascending aorta before one crosses the valve. A mismatch of a few mmHg at that stage becomes a fictitious gradient later.",
            },
            {
              kind: "keypoints",
              items: [
                "Zeroing removes atmospheric pressure; levelling removes hydrostatic offset. They are different steps and both are required.",
                "Level to the left atrium: the mid-thoracic level in a supine patient.",
                "Each centimetre of height error is roughly 0.75 mmHg; low-pressure measurements suffer most.",
                "Match simultaneous transducers in a common chamber before measuring any gradient.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "A pole-mounted transducer does not move with the table. Raising or lowering the table after zeroing introduces an offset; re-level after every height change.",
                "Contrast or blood left in the catheter or manifold alters transmission. Flush with saline before recording.",
                "Recording right-heart pressures on an arterial scale hides a, v and y deflections. Use a low scale (for example 0–40 or 0–50 mmHg).",
              ],
            },
            {
              kind: "pearl",
              text: "When a right-heart value does not fit the clinical picture, check the transducer height before you re-examine the patient. It is the commonest single cause of a wrong wedge pressure.",
            },
          ],
        },
        {
          id: "hd-basics-damping",
          title: "Damping, resonance and the fast-flush test",
          minutes: 7,
          refs: ["hanna-pcm"],
          blocks: [
            {
              kind: "p",
              text: "A fluid-filled system behaves like a spring. It has a natural frequency (how fast it oscillates when disturbed) and a damping coefficient (how quickly those oscillations die away). A faithful waveform needs a natural frequency well above the frequencies contained in the pressure wave and an intermediate amount of damping. Air bubbles, clot, kinks and compliant tubing add damping; long tubing lowers the natural frequency so that the system starts to resonate with the pressure wave.",
            },
            {
              kind: "steps",
              title: "The fast-flush (square-wave) test",
              items: [
                { title: "Set a fast sweep", detail: "Display the trace at a sweep speed that resolves individual oscillations." },
                { title: "Flush briefly", detail: "Activate the fast-flush device for about a second. The trace rises to a plateau and drops sharply when released." },
                { title: "Count the oscillations", detail: "An optimally damped system shows one or two rapid oscillations around baseline before the waveform resumes." },
                { title: "Interpret", detail: "No oscillation and a slow return mean over-damping. Several persistent oscillations mean under-damping." },
                { title: "Correct and repeat", detail: "Find and remove the cause, then repeat the test before accepting any numbers." },
              ],
            },
            {
              kind: "table",
              caption: "Damping states and their effects",
              head: ["State", "Fast-flush response", "Effect on the waveform", "Common causes"],
              rows: [
                ["Optimal", "1–2 oscillations, quick return", "Faithful systolic, diastolic and mean values", "Well-prepared, short, stiff system"],
                ["Over-damped", "No oscillation, sluggish return", "Systolic under-read, diastolic over-read, notches and small waves lost; mean roughly preserved", "Air bubbles, clot, kinks, soft tubing, loose connection, contrast in the line, tip against a wall"],
                ["Under-damped (resonant)", "Several oscillations, slow decay", "Systolic overshoot, diastolic under-read, spiky ringing; mean roughly preserved", "Long or multiple connected lines, catheter whip, tachycardia"],
              ],
            },
            {
              kind: "p",
              text: "Mean pressure is relatively protected from both errors, which is one reason pulmonary hypertension definitions are built on mean values. Pulse pressure, gradients and waveform morphology are not protected, so valve and constriction studies demand an optimally damped system.",
            },
            { kind: "h", text: "Other artefacts to recognise" },
            {
              kind: "list",
              items: [
                "Catheter whip (fling): a mobile catheter in a vigorously contracting heart adds high-frequency noise, often in the pulmonary artery.",
                "Catheter entrapment: an end-hole catheter buried in trabeculae records spuriously high systolic pressure with an odd, late-peaking contour.",
                "Ventricularisation or damping of a coronary catheter: the tip obstructs the ostium; the trace loses its dicrotic notch and diastolic pressure falls.",
                "Peripheral amplification: systolic pressure and pulse pressure increase as the wave travels distally, so a femoral or radial trace is not the same as central aortic pressure.",
              ],
            },
            {
              kind: "p",
              text: "When precision matters (constriction studies, research), high-fidelity micromanometer catheters with the sensor at the tip avoid fluid-column artefact altogether, at higher cost and with more careful handling.",
            },
            {
              kind: "keypoints",
              items: [
                "Perform a fast-flush test on every channel before recording data you will act on.",
                "Over-damping narrows the pulse pressure; under-damping widens it. Both leave the mean roughly intact.",
                "Fix the cause (bubble, clot, kink, connection); do not hide it with display filters.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Accepting a damped aortic trace while measuring a valve gradient or a pressure-wire ratio.",
                "Assuming a smooth trace is a good trace: a damped right atrial tracing looks tidy because the a and v waves have disappeared.",
              ],
            },
            {
              kind: "pearl",
              text: "If the right atrial trace shows no a wave in sinus rhythm, flush the line and repeat the fast-flush test before you report it.",
            },
          ],
        },
        {
          id: "hd-basics-catheters-access",
          title: "Catheters, access and the sequence of a right heart study",
          minutes: 9,
          refs: ["hanna-pcm", "esc-ph-2022", "oxford-cath-handbook", "williams-arm-right-heart-2014"],
          blocks: [
            {
              kind: "table",
              caption: "Catheters used in haemodynamic studies",
              head: ["Catheter", "Design", "Main uses", "Practical notes"],
              rows: [
                ["Balloon flotation thermodilution (pulmonary artery) catheter", "Balloon at the tip, distal end hole, proximal injectate port, thermistor near the tip", "Right-heart pressures, wedge, thermodilution output, mixed venous sampling", "Flow-directed and soft; may need a guidewire in a dilated RV or with severe TR. Check balloon volume in the instructions for use."],
                ["Balloon end-hole (wedge) catheter", "Balloon tip and end hole, no thermistor", "Pressures and saturations when output is measured by Fick", "Simpler and cheaper"],
                ["Multipurpose", "Gently angled tip, end hole with or without side holes", "Torque-directed right-heart study, wedge, LV pressure, oximetry", "Stiffer: more ectopy and perforation risk in the right heart; useful when flotation fails"],
                ["Pigtail", "Coiled tip with several side holes over the distal few centimetres", "LV pressure, ventriculography, aortography", "Side holes can straddle an intracavity or subvalvar gradient, so it cannot localise one"],
                ["Dual-lumen pigtail, or two separate catheters", "Two pressure ports separated along the catheter", "Simultaneous LV and aortic pressure in aortic stenosis", "Avoids pullback and peripheral-sheath artefacts"],
                ["Angiographic balloon catheter (Berman type)", "Balloon at the tip, side holes, no end hole", "Right-heart angiography", "Cannot record a wedge pressure"],
              ],
            },
            {
              kind: "table",
              caption: "Venous access for right heart catheterisation",
              head: ["Route", "Advantages", "Disadvantages"],
              rows: [
                ["Antecubital (basilic or brachial) vein", "Pairs naturally with radial arterial access; minimal bleeding; early mobilisation", "Venospasm, small veins; the cephalic route often fails at the shoulder"],
                ["Internal jugular vein", "Direct course to the PA, easy wedge; suits biopsy and repeated studies", "Carotid puncture and pneumothorax (both uncommon with ultrasound)"],
                ["Femoral vein", "Large calibre; allows large catheters and transseptal access", "Usually needs a loop in the RA to reach the PA; harder with a dilated RA or severe TR; bed rest"],
              ],
            },
            {
              kind: "p",
              text: "Use ultrasound for every venous puncture. Combined right and left heart studies can be done entirely from the arm, through an antecubital fossa vein and the radial artery (in one prospective series of 58 procedures the arm vein gave right heart access in 93%); the femoral vein remains standard when transseptal access or large-bore equipment is needed.",
            },
            {
              kind: "steps",
              title: "Sequence of a right heart study",
              items: [
                { title: "Plan", detail: "Know the question. If a shunt or valve calculation is possible, plan saturation samples and a simultaneous left-heart recording in advance. Check rhythm (pre-existing LBBB), anticoagulation and haemoglobin." },
                { title: "Prepare the system", detail: "Zero and level, perform fast-flush tests, set a low scale for right-heart pressures." },
                { title: "Advance with the balloon inflated", detail: "Inflate in the RA and float through the tricuspid valve, RV outflow tract and pulmonary valve under fluoroscopy, recording each chamber." },
                { title: "Record pressures", detail: "RA (mean, a, v), RV (systolic, end-diastolic), PA (systolic, diastolic, mean) at end-expiration over several beats." },
                { title: "Wedge", detail: "Allow the inflated balloon to wedge. Confirm a and v waves, a mean below the PA diastolic, stable position, and, if in doubt, a wedge sample with saturation close to arterial (commonly 95% or more)." },
                { title: "Deflate and sample", detail: "Deflate, confirm the PA trace returns, draw a PA (mixed venous) sample and a systemic arterial sample; add an SVC sample if a shunt is possible." },
                { title: "Measure flow", detail: "Thermodilution in at least triplicate and/or Fick." },
                { title: "Additional manoeuvres", detail: "Vasoreactivity, fluid challenge, exercise or simultaneous left-heart recordings as the question requires." },
                { title: "Withdraw safely", detail: "Always deflate before withdrawing; record a pullback if gradients matter." },
              ],
            },
            {
              kind: "pitfalls",
              title: "Complications and how to avoid them",
              items: [
                "Pulmonary artery rupture: rare but often fatal. Risk rises with pulmonary hypertension, older age, anticoagulation, a distal catheter position and balloon over-inflation. Inflate slowly while watching the trace, stop once it wedges, never flush a wedged catheter, never leave the balloon inflated.",
                "Complete heart block: the catheter can cause transient right bundle branch block; with pre-existing LBBB this means complete heart block. Have pacing immediately available.",
                "Ventricular ectopy or non-sustained VT, usually from the RV outflow tract; it settles once the catheter moves on.",
                "Looping or knotting in a dilated RV: do not keep advancing a catheter that is not progressing; reshape the approach or use a wire.",
                "Air embolism: if a right-to-left shunt is possible, inflate the balloon with carbon dioxide rather than air.",
                "Relative contraindications: right-heart thrombus or tumour, mechanical tricuspid or pulmonary prosthesis, recently implanted pacing or defibrillator leads.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Zero and level both transducers, run a fast-flush test, then float a balloon catheter from the antecubital vein through RA, RV and PA to wedge, recording each pressure at end-expiration. Deflate and confirm that the PA trace returns.",
            },
            {
              kind: "pearl",
              text: "Write the plan on the whiteboard before you start: which pressures, which saturations, which output method and which manoeuvres. A missed SVC sample cannot be recovered once the catheter is out.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-basics-1",
          stem: "After the table is raised, a pole-mounted transducer sits 10 cm below the patient's left atrium. What will a pulmonary artery wedge pressure that is truly 12 mmHg read?",
          options: ["About 19 mmHg", "About 5 mmHg", "About 22 mmHg", "12 mmHg, because the system was zeroed", "12 mmHg, but the a and v waves will be exaggerated"],
          answer: 0,
          explanation:
            "A transducer below the reference level sees the weight of an extra 10 cm column of fluid, about 7 mmHg (10 × 0.74), added to every value, so 12 reads about 19. Zeroing does not protect you: it removes atmospheric pressure, whereas levelling removes hydrostatic offset, and this offset appeared after zeroing. 22 mmHg assumes 1 cm equals 1 mmHg, which overstates the error.",
          difficulty: 1,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-basics-2",
          stem: "A fast-flush test on the arterial line shows a slow return to baseline with no oscillation. Which pattern of error do you expect?",
          options: [
            "Systolic under-read, diastolic over-read, mean roughly preserved",
            "Systolic over-read, diastolic under-read, mean roughly preserved",
            "All values over-read by the same constant amount, mean included",
            "All values under-read by the same constant amount, mean included",
            "Mean falsely high, with accurate systolic and diastolic pressures",
          ],
          answer: 0,
          explanation:
            "No oscillation and a sluggish return indicate over-damping, which narrows the pulse pressure: systolic reads low, diastolic reads high and the mean is relatively spared. Systolic over-reading with diastolic under-reading describes under-damping, which shows several oscillations after the flush. A constant offset in every value is the signature of a zeroing or levelling error, not damping.",
          difficulty: 1,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-basics-3",
          stem: "A patient with long-standing left bundle branch block needs right heart catheterisation. Which complication is specifically more likely in this patient?",
          options: ["Complete heart block", "Pulmonary artery rupture", "Pneumothorax", "Air embolism", "Tricuspid valve injury"],
          answer: 0,
          explanation:
            "A catheter passing through the RV can bruise the right bundle and cause transient right bundle branch block. With pre-existing LBBB, conduction then fails in both bundles and complete heart block follows, so pacing must be available. Pulmonary artery rupture is a serious risk of every right heart study but is related to pulmonary hypertension, age, anticoagulation and balloon handling, not to the bundle branch pattern.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-basics-4",
          stem: "Which catheter cannot be used to record a pulmonary artery wedge pressure?",
          options: [
            "A balloon-tipped angiographic catheter with side holes and no end hole",
            "A balloon flotation thermodilution catheter",
            "A balloon-tipped end-hole wedge catheter",
            "A multipurpose end-hole catheter advanced into a distal pulmonary branch",
          ],
          answer: 0,
          explanation:
            "A wedge pressure must be sensed beyond the point of occlusion. An angiographic balloon catheter has its side holes proximal to the balloon, so it continues to record pulmonary artery pressure. A multipurpose end-hole catheter can wedge by being advanced into a distal branch until it occludes it, although this requires more care than flotation.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-basics-5",
          stem: "Which practice most reduces the risk of pulmonary artery injury when obtaining a wedge pressure?",
          options: [
            "Inflate slowly while watching the trace and stop as soon as it wedges",
            "Advance the deflated catheter into a distal branch until the trace damps, then inflate fully",
            "Flush the catheter in the wedge position to sharpen a damped trace before reading",
            "Leave the balloon inflated between measurements so the wedge position is not lost",
            "Use a little more than the rated balloon volume to guarantee complete occlusion",
          ],
          answer: 0,
          explanation:
            "Gradual inflation under pressure monitoring uses only the volume needed to occlude the vessel. The hazard arises when a deflated catheter has migrated distally and is then fully inflated in a small branch, which is exactly what advancing the deflated catheter until it damps and then inflating fully does; withdraw to a proximal position before re-inflating. Flushing a wedged catheter and prolonged inflation also risk vessel injury or infarction.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-basics-6",
          stem: "Which venous access route most often requires a loop to be formed in the right atrium before a flow-directed catheter will enter the pulmonary artery?",
          options: ["Femoral vein", "Right internal jugular vein", "Antecubital basilic vein", "Left subclavian vein"],
          answer: 0,
          explanation:
            "From the inferior vena cava the catheter enters the right atrium pointing away from the RV outflow, so a loop (or a wire) is often needed to direct it through the tricuspid valve and up into the pulmonary artery. From the jugular, subclavian or arm veins the natural curve carries the catheter across the tricuspid valve towards the outflow tract, which is why the internal jugular route gives an easy wedge.",
          difficulty: 1,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-basics-7",
          stem: "Pulmonary hypertension definitions are based on mean pressures. Which property of a fluid-filled system best supports this choice?",
          options: [
            "Mean pressure is relatively insensitive to over- or under-damping",
            "Mean pressure is not affected by the height of the transducer above the heart",
            "Mean pressure does not vary with the respiratory cycle at all",
            "Mean pressure is not affected by a zeroing error in the system",
          ],
          answer: 0,
          explanation:
            "Damping errors move systolic and diastolic values in opposite directions, so the mean is largely preserved. The claim that mean pressure is unaffected by transducer height is tempting but wrong: a levelling error adds a constant offset to every value, including the mean, and so does a zeroing error. Mean pressures also vary with respiration, which is why they are measured at end-expiration.",
          difficulty: 3,
          refs: ["esc-ph-2022"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Set up two transducers, zero and level them at the mid-thoracic level, run fast-flush tests and correct an over-damped channel before recording." },
        { sim: "haemo", task: "Perform a complete right heart study from the arm: RA, RV, PA and wedge pressures at end-expiration, PA and arterial saturations, and triplicate thermodilution." },
      ],
    },

    // =====================================================================
    // MODULE 2 — WAVEFORMS
    // =====================================================================
    {
      id: "hd-waveforms",
      title: "Waveforms from the right atrium to the aorta",
      stage: 2,
      summary:
        "Read each pressure waveform against the ECG, know the normal values, measure at the right point in the respiratory cycle, and recognise the abnormal waves that point to specific diagnoses.",
      objectives: [
        "Label the a, c and v waves and the x and y descents in atrial and wedge tracings.",
        "Distinguish RV from PA and wedge from PA traces by their diastolic behaviour.",
        "Quote normal resting values for each chamber and measure them at end-expiration.",
        "Link abnormal waveforms (cannon a, giant v, absent a, steep or blunted y) to their causes.",
      ],
      lessons: [
        {
          id: "hd-waveforms-right",
          title: "The cardiac cycle and the right-sided waveforms",
          minutes: 8,
          refs: ["hanna-pcm"],
          blocks: [
            {
              kind: "p",
              text: "Pressure waveforms only make sense against the ECG and the cardiac cycle. Electrical events come first; mechanical events follow after a short delay; and a pressure transmitted through a fluid column or a capillary bed arrives later still. Always record the ECG alongside every pressure and label the deflections by timing, not by size.",
            },
            {
              kind: "figure",
              id: "wiggers",
              caption: "The Wiggers diagram: aortic, LV and atrial pressures against the ECG, ventricular volume and heart sounds. Use it to time each wave in the tracings that follow.",
            },
            { kind: "h", text: "Right atrium" },
            {
              kind: "table",
              caption: "Components of the atrial waveform",
              head: ["Deflection", "Mechanical event", "Timing against the ECG"],
              rows: [
                ["a wave", "Atrial contraction", "Just after the P wave, around the PR interval"],
                ["c wave", "Closed tricuspid valve bulges back towards the atrium as the ventricle starts to contract", "Just after the QRS; often small or merged with a"],
                ["x descent", "Atrial relaxation and descent of the valve ring during ventricular systole", "During systole, after the c wave"],
                ["v wave", "Atrial filling from the venae cavae against a closed tricuspid valve", "Peaks near the end of the T wave"],
                ["y descent", "Tricuspid valve opens and the atrium empties rapidly into the ventricle", "Early diastole, after the v wave"],
              ],
            },
            {
              kind: "p",
              text: "In the right atrium the a wave is usually equal to or slightly larger than the v wave. Mean RA pressure falls on inspiration as intrathoracic pressure falls and venous return rises. A failure to fall (Kussmaul sign) is abnormal.",
            },
            { kind: "h", text: "Right ventricle" },
            {
              kind: "p",
              text: "The RV trace has a rapid systolic upstroke, a rounded peak and a rapid fall to an early diastolic minimum. Through diastole the pressure then rises gradually as the ventricle fills, with a small a wave at end-diastole. RV end-diastolic pressure is read at the end of that a wave, just before the systolic upstroke.",
            },
            { kind: "h", text: "Pulmonary artery" },
            {
              kind: "p",
              text: "On entering the pulmonary artery the systolic peak is similar to the RV, but the diastolic pressure steps up and then falls gradually through diastole as blood runs off into the lungs. A dicrotic notch marks pulmonary valve closure. With a normal pulmonary vascular resistance and a moderate heart rate, PA diastolic pressure approximates the wedge pressure.",
            },
            {
              kind: "figure",
              id: "rhc-waveforms",
              caption: "Right heart sequence: RA, RV, PA and wedge. Note the diastolic step-up from RV to PA and the return of atrial-type a and v waves in the wedge position.",
            },
            {
              kind: "keypoints",
              items: [
                "Time every wave against the ECG: a follows the P wave, v peaks near the end of the T wave.",
                "RV diastolic pressure rises through diastole; PA diastolic pressure falls through diastole.",
                "The dicrotic notch identifies an arterial (PA or aortic) trace.",
                "In the RA, a is normally at least as large as v.",
              ],
            },
            {
              kind: "pearl",
              text: "To tell RV from PA at a glance, watch diastole. If pressure falls through diastole you are in an artery; if it rises, you are in a ventricle.",
            },
            {
              kind: "pitfalls",
              items: [
                "Labelling waves by size: in tricuspid regurgitation the v wave can dwarf the a wave and be mistaken for a ventricular trace.",
                "Reading RVEDP at the early diastolic nadir rather than at the end of the a wave underestimates it.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Advance through RA, RV and PA and label a, c, v, x and y on the atrial trace, RVEDP on the ventricular trace and the dicrotic notch on the PA trace.",
            },
          ],
        },
        {
          id: "hd-waveforms-left",
          title: "Wedge, left ventricle, aorta and normal values",
          minutes: 9,
          refs: ["hanna-pcm", "esc-ph-2022", "oxford-cath-handbook"],
          blocks: [
            { kind: "h", text: "Pulmonary artery wedge pressure" },
            {
              kind: "p",
              text: "When the balloon occludes a pulmonary branch, flow stops in that segment and a static column of blood connects the catheter tip, through the capillaries, to the pulmonary veins and left atrium. The wedge trace therefore reflects left atrial pressure, delayed and slightly damped by the capillary bed. Its a wave appears around the QRS and its v wave after the T wave. In the left atrium, unlike the right, the v wave is usually larger than the a wave.",
            },
            {
              kind: "list",
              items: [
                "Characteristic a and v waves (no a wave in atrial fibrillation).",
                "Mean wedge lower than PA diastolic pressure.",
                "Stable catheter position on fluoroscopy, with the PA trace returning on deflation.",
                "If doubt remains, a sample drawn in the wedge position with saturation close to arterial.",
              ],
            },
            {
              kind: "table",
              caption: "When wedge pressure does not equal LV end-diastolic pressure",
              head: ["Situation", "Relationship", "Reason"],
              rows: [
                ["Mitral stenosis", "Wedge higher than LVEDP", "Gradient across the mitral valve"],
                ["Large v waves (mitral regurgitation, stiff left atrium)", "Mean wedge higher than LVEDP", "The v wave inflates the mean"],
                ["Stiff LV with a vigorous atrial kick", "LVEDP higher than mean wedge", "The a wave raises end-diastolic pressure above the atrial mean"],
                ["Acute severe aortic regurgitation", "LVEDP higher than wedge", "Regurgitant filling closes the mitral valve early"],
                ["Pulmonary veno-occlusive disease", "Wedge often normal despite post-capillary obstruction", "The static column ends downstream of the diseased small veins"],
                ["Large respiratory swings", "Wedge unreliable", "Intrathoracic pressure contaminates the reading"],
              ],
            },
            {
              kind: "p",
              text: "When wedge pressure is borderline, damped or implausible, measure LVEDP directly. The 2022 ESC/ERS guideline accepts LVEDP when a reliable wedge cannot be obtained.",
            },
            { kind: "h", text: "Left ventricle" },
            {
              kind: "p",
              text: "LV pressure rises steeply in isovolumic contraction, peaks in mid-systole and falls steeply after aortic valve closure to an early diastolic minimum. LVEDP is read after the a wave, at the onset of the systolic upstroke, roughly at the R wave. A pigtail catheter with side holes is standard (Oxford), although during ventriculography its loop can still catch in the papillary muscles; gentle rotation and withdrawal usually frees it.",
            },
            { kind: "h", text: "Aorta" },
            {
              kind: "p",
              text: "The central aortic trace has a sharp upstroke, a rounded peak, a clear dicrotic notch (the incisura, aortic valve closure) and diastolic run-off. As the wave travels peripherally, reflected waves add to it: systolic pressure and pulse pressure rise, the upstroke is delayed and the notch becomes less distinct, while mean pressure falls slightly. A femoral or radial sheath trace is therefore not a substitute for central aortic pressure when measuring a valve gradient.",
            },
            { kind: "h", text: "Measure at end-expiration" },
            {
              kind: "p",
              text: "Intrathoracic pressure swings with breathing and is transmitted to every intrathoracic chamber. At end-expiration it is closest to atmospheric, so the 2022 ESC/ERS guideline recommends reading all pressures at end-expiration without a breath-hold. In spontaneous breathing, inspiration lowers the trace, so end-expiration is the higher point; with positive-pressure ventilation the pattern reverses. In patients with very large swings (obesity, COPD, breathlessness) state the method you used.",
            },
            {
              kind: "table",
              caption: "Typical resting values in adults (approximate; laboratories vary)",
              head: ["Site", "Pressure (mmHg)", "Comment"],
              rows: [
                ["Right atrium", "Mean 2–6", "a usually ≥ v"],
                ["Right ventricle", "Systolic 15–30, end-diastolic 2–8", "RVEDP read after the a wave"],
                ["Pulmonary artery", "Systolic 15–30, diastolic 4–12, mean about 14 (upper limit 20)", "mPAP above 20 defines pulmonary hypertension (ESC/ERS 2022)"],
                ["Wedge / left atrium", "Mean 4–12", "Above 15 indicates post-capillary physiology"],
                ["Left ventricle", "Systolic 100–140, end-diastolic 3–12", ""],
                ["Aorta", "Systolic 100–140, diastolic 60–90, mean 70–105", "Central trace has a sharp notch"],
                ["Cardiac output / index", "4–8 L/min; 2.5–4.0 L/min/m²", ""],
                ["Mixed venous saturation", "About 65–75%", "Sampled from the PA"],
                ["Pulmonary vascular resistance", "2 WU or less", "ESC/ERS 2022 threshold"],
                ["Systemic vascular resistance", "About 800–1200 dyn·s·cm⁻⁵ (10–15 WU)", ""],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Wedge reflects left atrial pressure, not LVEDP; know the situations in which they diverge.",
                "In the left atrium and wedge, v is normally larger than a.",
                "Read every pressure at end-expiration and over several beats.",
                "Use central aortic, not peripheral, pressure for gradients.",
              ],
            },
            {
              kind: "pearl",
              text: "If the wedge mean is higher than the PA diastolic pressure, the catheter is probably not wedged properly (over-wedged or partially wedged) or there is a giant v wave. Reposition before you report it.",
            },
          ],
        },
        {
          id: "hd-waveforms-abnormal",
          title: "Abnormal waveforms and what they mean",
          minutes: 8,
          refs: ["hanna-pcm", "esc-pericardial-2015"],
          blocks: [
            {
              kind: "p",
              text: "Abnormal waveforms are clues, not diagnoses. Most have more than one cause and several are mimicked by artefact. Find the a wave first using the P wave; the rest of the venous trace then labels itself.",
            },
            {
              kind: "table",
              caption: "Venous and atrial abnormalities",
              head: ["Finding", "Mechanism", "Common causes"],
              rows: [
                ["Large a wave", "Atrium contracts against a stiff ventricle or a stenotic valve", "Tricuspid stenosis; RV hypertrophy from pulmonary stenosis or pulmonary hypertension"],
                ["Cannon a waves", "Atrium contracts against a closed tricuspid valve", "AV dissociation: complete heart block, VT, ventricular pacing; regular cannon waves in junctional rhythm"],
                ["Absent a wave", "No coordinated atrial contraction", "Atrial fibrillation"],
                ["Giant v wave in the RA, small x descent", "Systolic regurgitation into the atrium", "Severe tricuspid regurgitation (the RA trace becomes ventricularised)"],
                ["Giant v wave in the wedge", "Regurgitant or increased flow into a small or stiff left atrium", "Mitral regurgitation, ventricular septal defect, non-compliant left atrium"],
                ["Steep y descent", "Rapid early filling that stops abruptly", "Constriction, restrictive cardiomyopathy, severe TR, RV failure"],
                ["Blunted or absent y descent", "Pericardial pressure impedes filling throughout diastole", "Tamponade (the x descent is preserved)"],
                ["Kussmaul sign", "Mean RA pressure fails to fall, or rises, on inspiration", "Constriction, restrictive cardiomyopathy, RV infarction, severe RV failure"],
              ],
            },
            {
              kind: "table",
              caption: "Ventricular and arterial abnormalities",
              head: ["Finding", "Mechanism", "Common causes"],
              rows: [
                ["Dip-and-plateau (square root) diastolic ventricular trace", "Rapid early filling halted by a rigid limit", "Constriction, restrictive cardiomyopathy"],
                ["Pulsus paradoxus (inspiratory fall in systolic pressure over 10 mmHg)", "Exaggerated ventricular interdependence", "Tamponade, severe asthma or COPD, massive PE, RV infarction; less often constriction"],
                ["Pulsus alternans", "Alternating stroke volume", "Severe LV systolic dysfunction"],
                ["Pulsus parvus et tardus", "Slow-rising, low-amplitude arterial pulse", "Severe aortic stenosis"],
                ["Spike-and-dome arterial trace", "Brisk early ejection interrupted by mid-systolic obstruction", "Hypertrophic obstructive cardiomyopathy"],
                ["Bisferiens pulse (two systolic peaks)", "Large stroke volume with rapid run-off, or dynamic obstruction", "Aortic regurgitation (with or without stenosis), HOCM"],
                ["Wide pulse pressure with low diastolic", "Diastolic run-off", "Aortic regurgitation, arteriovenous fistula, PDA, sepsis"],
                ["Ventricularised coronary catheter pressure", "Catheter obstructs the ostium", "Ostial stenosis, deep or non-coaxial engagement, catheter-induced spasm"],
              ],
            },
            {
              kind: "p",
              text: "Atrial fibrillation removes the a wave and the x descent becomes shallow, leaving a dominant c–v wave. In AF, average several beats and avoid the beats after long or short cycles when measuring gradients.",
            },
            {
              kind: "keypoints",
              items: [
                "Cannon a waves mean AV dissociation; absent a waves usually mean AF.",
                "A steep y descent suggests constriction or restriction; a blunted y with a preserved x suggests tamponade.",
                "A giant v wave in the wedge is not specific for mitral regurgitation.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Calling a giant wedge v wave 'severe MR' without checking oximetry for a ventricular septal defect.",
                "Mistaking a ventricularised RA trace in severe TR for the RV: the timing of the upstroke and the absence of a diastolic rise give it away.",
                "Reporting an absent y descent from an over-damped trace.",
                "Absence of a large v wave does not exclude severe MR: a large, compliant left atrium can absorb the regurgitant volume.",
              ],
            },
            {
              kind: "pearl",
              text: "When a waveform surprises you, check three things in order: the ECG timing, the fast-flush test and the catheter position. Only then interpret it.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-wave-1",
          stem: "In a right atrial tracing recorded in sinus rhythm, which deflection immediately follows the P wave?",
          options: ["The a wave", "The c wave", "The v wave", "The y descent", "The x descent"],
          answer: 0,
          explanation:
            "The a wave is produced by atrial contraction, which follows atrial depolarisation (the P wave). The c wave follows the QRS, as the closed tricuspid valve bulges back at the start of ventricular systole; the v wave peaks near the end of the T wave.",
          difficulty: 1,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-wave-2",
          stem: "Intermittent very large a waves are seen in the jugular venous trace of a patient with a broad-complex rhythm at 70 bpm. Which mechanism explains them?",
          options: [
            "Atrial contraction against a closed tricuspid valve in AV dissociation",
            "Severe tricuspid regurgitation with a large systolic wave on each beat",
            "Constrictive pericarditis with a steep y descent after every beat",
            "Atrial fibrillation with irregular, chaotic atrial activity",
            "Tricuspid stenosis obstructing atrial emptying in late diastole",
          ],
          answer: 0,
          explanation:
            "Cannon a waves occur when the atrium happens to contract while the tricuspid valve is shut, which is intermittent in AV dissociation (complete heart block, VT). Tricuspid stenosis also gives a large a wave, but it is present on every beat rather than intermittently. Atrial fibrillation abolishes the a wave altogether.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-wave-3",
          stem: "While you advance a flotation catheter, the systolic pressure stays at about 45 mmHg but the diastolic pressure now steps up to 20 mmHg and falls gradually through diastole, and a dicrotic notch appears. Where is the tip?",
          options: ["Pulmonary artery", "Right ventricle", "Wedge position", "Right atrium", "Right ventricular outflow tract below the valve"],
          answer: 0,
          explanation:
            "A diastolic step-up with pressure falling through diastole and a dicrotic notch identifies an arterial trace: the pulmonary artery. In the right ventricle, including its outflow tract, diastolic pressure starts near zero and rises through diastole as the chamber fills.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-wave-4",
          stem: "In which condition does the mean wedge pressure exceed LV end-diastolic pressure because of a fixed gradient between the left atrium and the ventricle?",
          options: ["Mitral stenosis", "Acute severe aortic regurgitation", "Stiff LV with a vigorous atrial contraction", "Pulmonary veno-occlusive disease", "Hypertrophic cardiomyopathy without obstruction"],
          answer: 0,
          explanation:
            "Mitral stenosis creates a diastolic gradient from left atrium to ventricle, so wedge (left atrial) pressure is higher than LVEDP. Acute aortic regurgitation does the opposite: regurgitant filling raises LVEDP above left atrial pressure and can close the mitral valve early. A stiff LV with a strong atrial kick also raises LVEDP above the atrial mean.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-wave-5",
          stem: "A spontaneously breathing patient with COPD has a wedge pressure that swings from 22 mmHg to 8 mmHg with each breath. According to the 2022 ESC/ERS guideline, which value should be reported?",
          options: [
            "The value at end-expiration, without a breath-hold",
            "The lowest value, at end-inspiration",
            "The value during a held deep inspiration",
            "The electronic mean over a single beat at any point in the cycle",
          ],
          answer: 0,
          explanation:
            "The guideline recommends measuring all pressures at end-expiration without a breath-hold, when intrathoracic pressure is closest to atmospheric. The inspiratory nadir reflects the negative intrathoracic pressure of a forceful breath, not left atrial pressure. In patients with very large swings, record and state the method used.",
          difficulty: 2,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-wave-6",
          stem: "Five days after an anterior STEMI a patient develops a new pansystolic murmur and hypotension. The wedge trace shows v waves of 45 mmHg. Which additional finding best distinguishes a ventricular septal rupture from papillary muscle rupture?",
          options: [
            "An oxygen saturation step-up from right atrium to right ventricle",
            "The height of the wedge v wave relative to the mean wedge pressure",
            "A raised LV end-diastolic pressure measured before the ventriculogram",
            "Hypotension with a raised heart rate despite inotropic support",
            "A raised pulmonary artery systolic pressure above 50 mmHg",
          ],
          answer: 0,
          explanation:
            "Both lesions can produce giant wedge v waves, hypotension and pulmonary hypertension, so the v wave does not discriminate. A left-to-right shunt at ventricular level raises saturation in the RV compared with the RA, which identifies a septal rupture. Echocardiography will usually confirm the diagnosis.",
          difficulty: 3,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-wave-7",
          stem: "Compared with the ascending aorta, how does a femoral arterial trace typically differ?",
          options: [
            "Higher systolic pressure, wider pulse pressure and a delayed upstroke",
            "Lower systolic pressure and narrower pulse pressure",
            "Identical systolic pressure with an earlier upstroke",
            "Higher mean pressure and a sharper dicrotic notch",
          ],
          answer: 0,
          explanation:
            "Wave reflection amplifies the pulse as it travels peripherally, raising systolic pressure and pulse pressure, and the upstroke arrives later; the notch becomes less distinct and mean pressure falls slightly. This is why a femoral sheath trace distorts an aortic stenosis gradient. A lower systolic and narrower pulse pressure would be the opposite of amplification.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Identify each chamber from its waveform alone during a blinded advance from RA to wedge, then measure RA mean, RVEDP, PA pressures and wedge at end-expiration." },
        { sim: "haemo", task: "Review a set of abnormal traces and assign cannon a waves, giant v waves, a steep y descent and a blunted y descent to their causes." },
      ],
    },

    // =====================================================================
    // MODULE 3 — FLOW AND RESISTANCE
    // =====================================================================
    {
      id: "hd-flow-resistance",
      title: "Cardiac output, resistance and pulmonary hypertension",
      stage: 2,
      summary:
        "Measure cardiac output by Fick and thermodilution, know when each fails, calculate systemic and pulmonary vascular resistance, and apply the 2022 ESC/ERS haemodynamic definitions of pulmonary hypertension and vasoreactivity testing.",
      objectives: [
        "Calculate oxygen content and Fick cardiac output, and explain the error introduced by assumed oxygen consumption.",
        "Perform thermodilution correctly and list its pitfalls.",
        "Calculate PVR, SVR, TPG and DPG, and convert between Wood units and dyn·s·cm⁻⁵.",
        "Classify pulmonary hypertension haemodynamically using the 2022 ESC/ERS definitions and perform vasoreactivity testing in the right patients.",
      ],
      lessons: [
        {
          id: "hd-flow-fick",
          title: "Cardiac output by the Fick principle",
          minutes: 7,
          refs: ["esc-ph-2022", "hanna-pcm"],
          blocks: [
            {
              kind: "p",
              text: "The Fick principle states that the uptake of a substance by an organ equals blood flow multiplied by the difference in its concentration between the blood entering and leaving that organ. Applied to the lungs and oxygen: oxygen consumption equals pulmonary blood flow multiplied by the difference between arterial (pulmonary venous) and mixed venous oxygen content. Without a shunt, pulmonary flow equals systemic flow, the cardiac output.",
            },
            {
              kind: "formula",
              name: "Oxygen content",
              expr: "O₂ content (mL/L) = 1.36 × Hb (g/dL) × saturation (fraction) × 10",
              note: "Some laboratories use 1.34 or 1.39 mL O₂ per gram of haemoglobin; be consistent. Dissolved oxygen (0.003 mL/dL per mmHg PO₂) is negligible on room air but not on high-flow oxygen.",
            },
            {
              kind: "formula",
              name: "Fick cardiac output",
              expr: "CO (L/min) = VO₂ (mL/min) ÷ [1.36 × Hb × 10 × (SaO₂ − SvO₂)]",
              note: "SaO₂ from a systemic arterial sample by co-oximetry; SvO₂ from the pulmonary artery.",
            },
            {
              kind: "table",
              caption: "Worked example",
              head: ["Input", "Value", "Working"],
              rows: [
                ["VO₂", "250 mL/min", "Measured"],
                ["Haemoglobin", "14 g/dL", "Oxygen capacity = 1.36 × 14 × 10 = 190 mL/L"],
                ["SaO₂ / SvO₂", "98% / 70%", "Difference 0.28; A–V content difference = 190 × 0.28 = 53 mL/L"],
                ["Cardiac output", "4.7 L/min", "250 ÷ 53"],
              ],
            },
            { kind: "h", text: "Measured versus assumed oxygen consumption" },
            {
              kind: "p",
              text: "Direct Fick uses VO₂ measured at steady state with a metabolic hood or breath-by-breath analysis; it is the reference method. Indirect Fick uses an assumed value, commonly 125 mL/min/m² of body surface area (lower values are often used for older patients). Assumed values can differ from measured ones by 25% or more in individual patients, especially with obesity, sepsis, fever, anxiety or sedation. The 2022 ESC/ERS guideline therefore prefers thermodilution to indirect Fick.",
            },
            {
              kind: "steps",
              title: "Getting Fick right",
              items: [
                { title: "Steady state", detail: "Patient settled, no change in oxygen, sedation or infusion during sampling." },
                { title: "Known inspired oxygen", detail: "Ideally room air. On supplemental oxygen, include dissolved oxygen or the output will be wrong." },
                { title: "True mixed venous blood", detail: "Sample from the pulmonary artery with the balloon deflated. RA blood is poorly mixed and is not mixed venous." },
                { title: "Co-oximetry", detail: "Measure arterial saturation on a blood sample, not from the pulse oximeter, and measure haemoglobin at the same time." },
                { title: "Timing", detail: "Draw arterial and venous samples close together and analyse promptly, with no air in the syringe." },
              ],
            },
            {
              kind: "formula",
              name: "Cardiac index",
              expr: "CI (L/min/m²) = CO ÷ body surface area",
            },
            {
              kind: "keypoints",
              items: [
                "Fick output is inversely proportional to the arteriovenous oxygen content difference.",
                "A narrow A–V difference (high SvO₂) means high output, a shunt or a sampling error.",
                "Indirect Fick inherits the error of the assumed VO₂.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "A PA sample drawn with the balloon inflated is partly arterialised wedge blood and falsely raises SvO₂, inflating the output.",
                "In a left-to-right shunt, PA saturation is not mixed venous saturation; Fick then gives pulmonary flow, not systemic flow (see the shunts module).",
                "Small errors matter most when the A–V difference is small: a 2% saturation error alters output by roughly 10% if the difference is 20%.",
              ],
            },
            {
              kind: "pearl",
              text: "A mixed venous saturation is a free monitor of global oxygen delivery. A falling SvO₂ in a stable-looking patient on the table is a warning, not a curiosity.",
            },
          ],
        },
        {
          id: "hd-flow-thermodilution",
          title: "Thermodilution and its pitfalls",
          minutes: 6,
          refs: ["esc-ph-2022", "hanna-pcm"],
          blocks: [
            {
              kind: "p",
              text: "Thermodilution is an indicator-dilution method. A known volume of saline below body temperature is injected through the proximal port into the right atrium; the thermistor near the catheter tip records the temperature change in the pulmonary artery. By the Stewart–Hamilton relationship, cardiac output is inversely proportional to the area under the temperature–time curve: high flow washes the cold bolus past quickly, producing a small curve.",
            },
            {
              kind: "steps",
              title: "Technique",
              items: [
                { title: "Check position", detail: "Thermistor in the main or proximal branch PA (not wedged); proximal port in the RA (not in the sheath or the RV)." },
                { title: "Enter constants", detail: "Injectate volume, temperature and catheter computation constant as specified for the system." },
                { title: "Inject briskly and smoothly", detail: "Use the specified volume (commonly 10 mL) in a single smooth push over a few seconds, at the same phase of respiration." },
                { title: "Repeat", detail: "At least three injections; accept values within about 10% of each other and average them." },
                { title: "Inspect the curves", detail: "A smooth rapid upstroke and exponential decay; discard curves with irregular shapes." },
              ],
            },
            {
              kind: "table",
              caption: "When thermodilution misleads",
              head: ["Situation", "Usual effect", "Reason"],
              rows: [
                ["Significant tricuspid regurgitation", "Traditionally taught to underestimate output", "Indicator recirculates across the valve, prolonging the curve. In pulmonary hypertension cohorts the error versus direct Fick appears smaller than once thought."],
                ["Very low output", "May overestimate output", "The slow bolus warms through the vessel walls, shrinking the curve"],
                ["Intracardiac shunt", "Invalid", "Early recirculation (left-to-right) or loss of indicator (right-to-left); use Fick"],
                ["AF or frequent ectopy", "Scatter", "Beat-to-beat variation in stroke volume; take more measurements"],
                ["Less volume or warmer injectate than entered", "Overestimates output", "Less cold delivered than the computer assumes"],
                ["Slow or interrupted injection", "Distorted curve", "Indicator not delivered as a bolus"],
              ],
            },
            {
              kind: "p",
              text: "The 2022 ESC/ERS guideline recommends thermodilution as the preferred clinical method in pulmonary hypertension, ahead of indirect Fick, and states that it performs acceptably even with low output or severe TR. Direct Fick remains the reference when it is available. With an intracardiac shunt, use Fick and calculate pulmonary and systemic flows separately.",
            },
            {
              kind: "keypoints",
              items: [
                "Thermodilution measures right-sided (pulmonary) flow over a few beats.",
                "Inject the specified volume smoothly, at the same point in the respiratory cycle, at least three times.",
                "Shunts invalidate thermodilution; TR and very low output are classical sources of error.",
              ],
            },
            {
              kind: "pearl",
              text: "When thermodilution and Fick disagree substantially, find out why before you accept either. The usual culprits are an assumed VO₂, a contaminated PA sample, injectate errors or an unsuspected shunt.",
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Perform three thermodilution injections, reject an outlier from a slow injection, and compare the averaged output with a Fick output calculated from measured saturations.",
            },
          ],
        },
        {
          id: "hd-flow-resistance-ph",
          title: "Vascular resistance, pulmonary hypertension definitions and vasoreactivity",
          minutes: 9,
          refs: ["esc-ph-2022", "hanna-pcm"],
          blocks: [
            {
              kind: "p",
              text: "Resistance is calculated by analogy with Ohm's law: the pressure drop across a vascular bed divided by the flow through it. It is a derived number, so it inherits every error in the pressures and the output used to compute it.",
            },
            {
              kind: "formula",
              name: "Pulmonary vascular resistance",
              expr: "PVR (WU) = (mPAP − PAWP) ÷ CO",
              note: "Wood units = mmHg·min/L. Multiply by 80 for dyn·s·cm⁻⁵. Indexed PVR uses cardiac index.",
            },
            {
              kind: "formula",
              name: "Systemic vascular resistance",
              expr: "SVR (WU) = (MAP − RAP) ÷ CO;  SVR (dyn·s·cm⁻⁵) = 80 × (MAP − RAP) ÷ CO",
            },
            {
              kind: "formula",
              name: "Transpulmonary and diastolic pressure gradients",
              expr: "TPG = mPAP − PAWP;  DPG = PA diastolic − PAWP",
              note: "Older classifications used TPG and DPG to identify a pre-capillary component. The 2022 ESC/ERS guideline uses PVR instead because DPG is less reproducible.",
            },
            {
              kind: "table",
              caption: "Haemodynamic definitions of pulmonary hypertension (2022 ESC/ERS)",
              head: ["Category", "Definition"],
              rows: [
                ["Pulmonary hypertension", "mPAP > 20 mmHg"],
                ["Pre-capillary PH", "mPAP > 20, PAWP ≤ 15, PVR > 2 WU"],
                ["Isolated post-capillary PH", "mPAP > 20, PAWP > 15, PVR ≤ 2 WU"],
                ["Combined post- and pre-capillary PH", "mPAP > 20, PAWP > 15, PVR > 2 WU"],
                ["Exercise PH", "mPAP/CO slope between rest and exercise > 3 mmHg/L/min"],
                ["Unclassified (high-flow) PH", "mPAP > 20 with PAWP ≤ 15 and PVR ≤ 2 WU, for example with a shunt or high output"],
              ],
            },
            {
              kind: "table",
              caption: "Worked examples",
              head: ["mPAP", "PAWP", "CO", "PVR", "Classification"],
              rows: [
                ["40", "10", "4.0", "(40 − 10) ÷ 4.0 = 7.5 WU (600 dyn·s·cm⁻⁵)", "Pre-capillary PH"],
                ["34", "22", "5.0", "(34 − 22) ÷ 5.0 = 2.4 WU", "Combined post- and pre-capillary PH"],
                ["28", "19", "5.5", "(28 − 19) ÷ 5.5 = 1.6 WU", "Isolated post-capillary PH"],
              ],
            },
            {
              kind: "p",
              text: "The PAWP threshold of 15 mmHg is a hard boundary in this classification, which is why the levelling, end-expiration and wedge-confirmation rules from earlier lessons matter. When PAWP is borderline in a patient with risk factors for left heart disease, a fluid challenge or exercise can unmask post-capillary physiology; use the protocol and thresholds in the current guideline.",
            },
            { kind: "h", text: "Acute vasoreactivity testing" },
            {
              kind: "p",
              text: "Vasoreactivity testing identifies the small group of patients with pulmonary arterial hypertension who may respond to high-dose calcium-channel blockers. It is indicated only in idiopathic, heritable and drug- or toxin-associated PAH. Inhaled nitric oxide or inhaled iloprost are the usual agents (intravenous epoprostenol is an alternative), given per local protocol with continuous monitoring.",
            },
            {
              kind: "keypoints",
              title: "Positive vasoreactivity response",
              items: [
                "Fall in mPAP of at least 10 mmHg,",
                "to an absolute mPAP of 40 mmHg or less,",
                "with cardiac output unchanged or increased.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Testing patients with left heart disease: pulmonary vasodilatation increases flow into a left atrium that cannot accept it and can precipitate pulmonary oedema.",
                "Calling a fall in mPAP 'positive' when cardiac output also fell: the pressure fell because flow fell, not because the vessels relaxed.",
                "Using thermodilution or systemic flow to calculate PVR in a patient with a shunt. PVR must use pulmonary flow (Qp).",
                "Calculating PVR from an assumed VO₂ without saying so.",
              ],
            },
            {
              kind: "pearl",
              text: "Write PVR with its ingredients (mPAP, PAWP, CO and the method used for CO). A PVR of 3 WU from an assumed-VO₂ Fick output is a different quality of evidence from the same value obtained by triplicate thermodilution.",
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "From a recorded right heart study, calculate TPG, DPG and PVR, classify the pulmonary hypertension using the 2022 definitions, then run inhaled nitric oxide and judge whether the response is positive.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-flow-1",
          stem: "Measured VO₂ is 240 mL/min, Hb 12 g/dL, arterial saturation 96% and PA saturation 66%. What is the Fick cardiac output (using 1.36 mL O₂/g Hb)?",
          options: ["4.9 L/min", "3.6 L/min", "6.2 L/min", "8.0 L/min", "2.9 L/min"],
          answer: 0,
          explanation:
            "Oxygen capacity is 1.36 × 12 × 10 = 163 mL/L. The A–V saturation difference is 0.30, so the content difference is 163 × 0.30 = 49 mL/L. Output = 240 ÷ 49 ≈ 4.9 L/min. Forgetting the factor of 10 (using mL/dL against L/min) gives answers ten times too large or small; using saturations as percentages without converting gives a meaningless result.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-flow-2",
          stem: "In which of these patients is thermodilution cardiac output invalid and Fick required?",
          options: [
            "A ventricular septal defect with a left-to-right shunt",
            "Sinus rhythm at 100 bpm with frequent atrial ectopic beats",
            "Idiopathic PAH with a pulmonary vascular resistance of 6 WU",
            "Mild tricuspid regurgitation seen on the screening echocardiogram",
            "A haemoglobin of 9 g/dL from chronic gastrointestinal blood loss",
          ],
          answer: 0,
          explanation:
            "An intracardiac shunt causes early recirculation of the indicator (or loss of indicator in right-to-left shunts), so the curve no longer reflects a single flow; use Fick and calculate Qp and Qs separately. Mild TR is not a meaningful source of error, and even severe TR is no longer considered an absolute barrier in pulmonary hypertension practice.",
          difficulty: 2,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-flow-3",
          stem: "In a patient with very low cardiac output, how is thermodilution classically expected to err?",
          options: [
            "Overestimate output, because the slow bolus warms before reaching the thermistor",
            "Underestimate output, because the curve is prolonged by recirculation",
            "No systematic error, only scatter",
            "Underestimate output, because the injectate is diluted in a large RA",
          ],
          answer: 0,
          explanation:
            "At very low flow the cold bolus spends longer in transit and loses cold to the surrounding tissues, so less temperature change reaches the thermistor; the smaller curve area is read as higher flow. Underestimation from a prolonged curve is the classical teaching for significant tricuspid regurgitation, not for low output.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-flow-4",
          stem: "mPAP is 32 mmHg, PAWP 19 mmHg and cardiac output 3.7 L/min. How is the pulmonary hypertension classified under the 2022 ESC/ERS definitions?",
          options: [
            "Combined post- and pre-capillary PH",
            "Isolated post-capillary PH",
            "Pre-capillary PH",
            "Unclassified PH",
            "Not pulmonary hypertension",
          ],
          answer: 0,
          explanation:
            "mPAP exceeds 20 and PAWP exceeds 15, so the PH is post-capillary. PVR = (32 − 19) ÷ 3.7 ≈ 3.5 WU, which is above 2, so there is an added pre-capillary component: combined post- and pre-capillary PH. Isolated post-capillary PH would require PVR of 2 WU or less.",
          difficulty: 2,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-flow-5",
          stem: "mPAP is 45 mmHg, PAWP 12 mmHg and cardiac output 3.3 L/min. What is the PVR?",
          options: ["10 WU (800 dyn·s·cm⁻⁵)", "13.6 WU (1090 dyn·s·cm⁻⁵)", "3.6 WU (290 dyn·s·cm⁻⁵)", "1.25 WU (100 dyn·s·cm⁻⁵)", "10 dyn·s·cm⁻⁵"],
          answer: 0,
          explanation:
            "PVR = (45 − 12) ÷ 3.3 = 10 WU; multiplied by 80 this is 800 dyn·s·cm⁻⁵. Dividing mPAP alone by output (45 ÷ 3.3 ≈ 13.6) ignores the downstream pressure and overstates resistance. Quoting 10 dyn·s·cm⁻⁵ confuses the units.",
          difficulty: 1,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-flow-6",
          stem: "A patient with idiopathic PAH undergoes vasoreactivity testing with inhaled nitric oxide. Which response meets the criteria for a positive test?",
          options: [
            "mPAP 52 → 40 mmHg with CO 4.0 → 4.3 L/min",
            "mPAP 52 → 44 mmHg with CO 4.0 → 4.6 L/min",
            "mPAP 38 → 30 mmHg with CO 4.0 → 4.0 L/min",
            "mPAP 52 → 40 mmHg with CO 4.0 → 3.1 L/min",
            "PVR falls by 20% with mPAP 52 → 47 mmHg",
          ],
          answer: 0,
          explanation:
            "A positive response requires a fall in mPAP of at least 10 mmHg to an absolute value of 40 mmHg or less with unchanged or increased output: 52 → 40 with output rising qualifies. The response 52 → 40 mmHg with output falling to 3.1 L/min reaches the same pressures, but the pressure drop reflects reduced flow rather than vasodilatation. The fall from 38 to 30 mmHg is only 8 mmHg.",
          difficulty: 3,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-flow-7",
          stem: "Which statement about indirect Fick (assumed VO₂) is correct?",
          options: [
            "Assumed VO₂ can be 25% or more out; the 2022 guideline prefers thermodilution",
            "It is the reference method for measuring cardiac output in pulmonary hypertension",
            "It is accurate in sepsis because oxygen consumption is fixed at a standard value",
            "It is unaffected by errors in haemoglobin, which cancel out of the calculation",
          ],
          answer: 0,
          explanation:
            "Assumed oxygen consumption ignores individual variation from body composition, fever, sepsis, anxiety and sedation; errors of 25% or more are common, and the 2022 guideline ranks thermodilution above indirect Fick. Direct Fick, with measured VO₂, is the reference method. Haemoglobin enters the oxygen content calculation directly, so its errors propagate.",
          difficulty: 2,
          refs: ["esc-ph-2022"],
        },
        {
          id: "hd-q-flow-8",
          stem: "In which patient should acute vasoreactivity testing be avoided?",
          options: [
            "PH from heart failure with preserved EF (PAWP 22 mmHg)",
            "Idiopathic PAH with a PVR of 8 WU and a normal wedge",
            "Heritable PAH with a BMPR2 mutation and a normal wedge",
            "Drug-associated PAH after exposure to an anorexigen",
          ],
          answer: 0,
          explanation:
            "Vasoreactivity testing is indicated only in idiopathic, heritable and drug- or toxin-associated PAH. In left heart disease a pulmonary vasodilator increases flow into a left heart that cannot accommodate it, which can cause pulmonary oedema, and a positive result has no therapeutic consequence.",
          difficulty: 2,
          refs: ["esc-ph-2022"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Calculate Fick and thermodilution outputs in the same patient, explain a 20% discrepancy, then derive PVR and SVR and classify the PH." },
      ],
    },

    // =====================================================================
    // MODULE 4 — SHUNTS
    // =====================================================================
    {
      id: "hd-shunts",
      title: "Shunt detection and quantification",
      stage: 3,
      summary:
        "Perform a reliable oximetry run, recognise a significant step-up, choose the right mixed venous saturation, calculate Qp:Qs and pulmonary resistance in a shunt, and recognise the patterns of ASD, VSD, PDA, anomalous pulmonary venous drainage and Eisenmenger physiology.",
      objectives: [
        "Perform an oximetry run with correct sampling sites, timing and technique.",
        "Identify a significant step-up and its level using classical oximetric criteria.",
        "Calculate mixed venous saturation (Flamm), Qp, Qs and Qp:Qs, and PVR in the presence of a shunt.",
        "Recognise the oximetric and pressure patterns of common shunts and of Eisenmenger physiology.",
      ],
      lessons: [
        {
          id: "hd-shunts-oximetry",
          title: "The oximetry run",
          minutes: 7,
          refs: ["esc-achd-2020", "hanna-pcm", "grossman-baim-2014"],
          blocks: [
            {
              kind: "p",
              text: "A left-to-right shunt adds oxygenated blood to the right heart, so saturation rises (steps up) at the level where the shunt enters. An oximetry run samples blood sequentially along the venous side of the circulation to find that level. Oximetry is simple and robust for moderate and large shunts but is insensitive to small ones.",
            },
            {
              kind: "list",
              items: [
                "PA saturation above about 80% on room air, or unexpectedly high cardiac output.",
                "Unexplained pulmonary hypertension or RV dilatation.",
                "Known or suspected congenital or post-infarct shunt.",
                "A screening comparison of SVC and PA saturation: a difference of roughly 8% or more warrants a full run.",
              ],
            },
            {
              kind: "table",
              caption: "Sampling sites in a full run",
              head: ["Region", "Sites"],
              rows: [
                ["Superior vena cava", "High (near the innominate junction) and low (SVC–RA junction)"],
                ["Inferior vena cava", "At the diaphragm (IVC saturation varies along its length: renal veins are well saturated, hepatic veins poorly)"],
                ["Right atrium", "High, mid and low"],
                ["Right ventricle", "Inflow, mid-cavity and outflow"],
                ["Pulmonary artery", "Main PA, and right or left PA"],
                ["Left heart and aorta", "Pulmonary vein or left atrium if accessible (for example across a PFO or ASD), LV, aorta; distal aorta if a PDA is suspected"],
              ],
            },
            {
              kind: "steps",
              title: "Technique",
              items: [
                { title: "Steady state on known oxygen", detail: "Ideally room air; record the inspired oxygen. Avoid changes in sedation or oxygen during the run." },
                { title: "Work quickly", detail: "Use an end-hole or multipurpose catheter, start in the PA and pull back through the sites, completing the run within a few minutes." },
                { title: "Discard dead space", detail: "Withdraw and discard the catheter dead-space volume before each sample." },
                { title: "Duplicate key sites", detail: "Take duplicates where a step-up is suspected; repeat the run if values are inconsistent." },
                { title: "Arterial sample", detail: "Draw a systemic arterial sample during the run." },
                { title: "Analyse by co-oximetry", detail: "Promptly, with no air in the syringes." },
              ],
            },
            {
              kind: "table",
              caption: "Classical oximetric criteria for a significant left-to-right step-up (Grossman/Dexter-derived; use as a guide)",
              head: ["Level", "Compare with", "Mean of multiple samples", "Highest single samples", "Usual causes"],
              rows: [
                ["Atrial", "SVC/IVC (mixed venous)", "≥ 7%", "≥ 11%", "ASD, anomalous pulmonary venous drainage, ruptured sinus of Valsalva, LV-to-RA shunt, VSD with TR"],
                ["Ventricular", "Right atrium", "≥ 5%", "≥ 10%", "VSD, PDA with pulmonary regurgitation, primum ASD with LV-to-RA flow"],
                ["Great vessel", "Right ventricle", "≥ 5%", "≥ 5%", "PDA, aortopulmonary window, anomalous coronary origin from the PA"],
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "A slow run is a non-steady-state run: changing output alters every saturation.",
                "On high-flow oxygen, dissolved oxygen becomes significant and saturations alone mislead.",
                "Streaming in the RA means a single RA sample can be falsely high or low; take several.",
                "A small shunt (Qp:Qs below about 1.3) may not produce a detectable step-up.",
              ],
            },
            {
              kind: "pearl",
              text: "Run the oximetry before you leave the right heart. A PA saturation of 80% or more with a normal or high output is a shunt until proved otherwise.",
            },
          ],
        },
        {
          id: "hd-shunts-calculation",
          title: "Mixed venous saturation, Qp:Qs and resistance in shunts",
          minutes: 8,
          refs: ["esc-achd-2020", "hanna-pcm", "grossman-baim-2014", "flamm-mixed-venous-1969"],
          blocks: [
            {
              kind: "p",
              text: "The Fick principle can be applied separately to the pulmonary and systemic circulations. Pulmonary flow (Qp) uses the content difference across the lungs; systemic flow (Qs) uses the content difference across the body. Because the same VO₂ and haemoglobin appear in both, the ratio simplifies to saturations alone.",
            },
            {
              kind: "formula",
              name: "Mixed venous saturation for atrial-level shunts (Flamm)",
              expr: "MVO₂ = (3 × SVC + 1 × IVC) ÷ 4",
              note: "Used when the RA is contaminated by the shunt. For ventricular and great-vessel shunts, use the chamber immediately proximal to the step-up (RA for a VSD, RV for a PDA).",
            },
            {
              kind: "formula",
              name: "Pulmonary to systemic flow ratio",
              expr: "Qp:Qs = (SaO₂ − MVO₂) ÷ (PVO₂ − PAO₂)",
              note: "If pulmonary venous blood is not sampled, use systemic arterial saturation if it is 95% or more; if arterial saturation is lower and a right-to-left shunt is present, assume about 98%.",
            },
            {
              kind: "formula",
              name: "Pulmonary and systemic flows",
              expr: "Qp = VO₂ ÷ [1.36 × Hb × 10 × (PVO₂ − PAO₂)];  Qs = VO₂ ÷ [1.36 × Hb × 10 × (SaO₂ − MVO₂)]",
            },
            {
              kind: "table",
              caption: "Worked example (secundum ASD)",
              head: ["Sample", "Saturation", "Working"],
              rows: [
                ["SVC", "68%", ""],
                ["IVC", "74%", "MVO₂ = (3 × 68 + 74) ÷ 4 = 69.5%"],
                ["RA (mid)", "83%", "Atrial step-up of about 13%"],
                ["PA", "82%", ""],
                ["Aorta", "96%", "PV assumed 98%"],
                ["Qp:Qs", "1.7", "(96 − 69.5) ÷ (98 − 82) = 26.5 ÷ 16"],
              ],
            },
            {
              kind: "table",
              caption: "Interpreting Qp:Qs",
              head: ["Qp:Qs", "Meaning"],
              rows: [
                ["Below 1.0", "Net right-to-left shunt"],
                ["1.0–1.5", "Small left-to-right shunt"],
                ["1.5 or more", "Haemodynamically significant (the traditional threshold supporting closure when there is volume overload)"],
                ["2.0 or more", "Large shunt"],
              ],
            },
            {
              kind: "p",
              text: "Current ACHD practice weighs Qp:Qs together with ventricular volume overload and pulmonary vascular resistance rather than using any single number. Resistance must be calculated with pulmonary flow: PVR = (mPAP − PAWP or LA mean) ÷ Qp. Using systemic flow or thermodilution exaggerates PVR when Qp is high.",
            },
            {
              kind: "keypoints",
              items: [
                "Mixed venous saturation comes from the chamber just upstream of the step-up; Flamm for atrial shunts.",
                "Qp:Qs needs only saturations; Qp and Qs individually need VO₂ and haemoglobin.",
                "Use Qp for PVR in left-to-right shunts.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "When PA saturation is high, the denominator (PV − PA) is small and an error of 1–2% in either sample swings the ratio considerably. Duplicate the key samples.",
                "Using an SVC sample contaminated by anomalous pulmonary venous drainage in the Flamm formula underestimates the shunt.",
                "Assuming PV saturation equals arterial saturation in a patient with a right-to-left shunt.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Perform an oximetry run, identify the level of the step-up, choose the correct mixed venous saturation and calculate Qp:Qs and PVR using Qp.",
            },
          ],
        },
        {
          id: "hd-shunts-patterns",
          title: "ASD, VSD, PDA and Eisenmenger physiology",
          minutes: 8,
          refs: ["esc-achd-2020", "hanna-pcm", "esc-ph-2022", "flamm-mixed-venous-1969"],
          blocks: [
            {
              kind: "table",
              caption: "Shunt patterns in the catheter laboratory",
              head: ["Lesion", "Step-up level", "Pressure findings", "Notes"],
              rows: [
                ["Secundum ASD", "RA (against Flamm MVO₂)", "LA and RA means similar; PA pressure often normal or mildly raised; RV volume load", "Catheter may cross into the LA; transcatheter closure if anatomy suits"],
                ["Superior sinus venosus defect", "SVC (high-to-low SVC) or SVC–RA junction", "As for ASD", "Usually with anomalous right upper pulmonary venous drainage; often missed on transthoracic echo; needs CMR or CT; not suitable for standard septal occluders"],
                ["Partial anomalous pulmonary venous drainage", "Wherever the veins drain (SVC, innominate, RA, IVC)", "As for ASD", "Can coexist with an intact septum"],
                ["Primum ASD (partial AVSD)", "RA, sometimes RV", "Associated left AV valve regurgitation", "Surgical repair"],
                ["VSD", "RV", "RV and PA systolic pressures raised if non-restrictive; wedge v waves can be large", "Restrictive (small, high gradient) versus non-restrictive"],
                ["PDA", "PA", "Wide aortic pulse pressure; PA pressure raised if large", "Catheter may pass from the PA through the duct into the descending aorta"],
                ["Coronary fistula, ruptured sinus of Valsalva", "Variable (RA, RV or PA)", "Variable", "Confirm with angiography"],
              ],
            },
            { kind: "h", text: "Eisenmenger physiology" },
            {
              kind: "p",
              text: "A large, unrestricted post-tricuspid shunt (VSD, PDA) exposes the pulmonary circulation to systemic pressure and high flow. Over time the pulmonary vasculature remodels and PVR rises until it approaches or exceeds systemic resistance. The shunt becomes bidirectional and then right-to-left, with cyanosis and secondary erythrocytosis. Pre-tricuspid shunts (ASD) reach this stage less often and later.",
            },
            {
              kind: "keypoints",
              title: "Recognising Eisenmenger physiology",
              items: [
                "Systemic-level PA pressures with PVR approaching systemic resistance.",
                "Systemic arterial desaturation, worse with exercise.",
                "With a PDA, differential cyanosis: lower-limb saturation lower than right-arm saturation, and toe clubbing without finger clubbing.",
                "Shunt closure is contraindicated; management is in expert ACHD and pulmonary hypertension centres.",
              ],
            },
            { kind: "h", text: "When the numbers support closure" },
            {
              kind: "p",
              text: "For ASD, the 2020 ESC ACHD guideline recommends closure in patients with RV volume overload and PVR below 3 WU, regardless of symptoms. Between about 3 and 5 WU, closure is considered only when there is still a significant left-to-right shunt (Qp:Qs above 1.5). Above 5 WU, closure is reserved for selected patients in expert centres (for example after targeted PAH therapy has lowered PVR), and it is not recommended in Eisenmenger physiology. Check the current guideline for exact wording before applying these thresholds to a patient.",
            },
            {
              kind: "pitfalls",
              items: [
                "Catheterising a cyanotic patient without air filters on intravenous lines: any venous air can reach the systemic circulation.",
                "Allowing hypotension or dehydration in Eisenmenger physiology: systemic vasodilatation increases right-to-left shunting.",
                "Assuming a normal transthoracic echo excludes a sinus venosus defect or anomalous pulmonary veins.",
              ],
            },
            {
              kind: "pearl",
              text: "When the step-up appears within the SVC rather than at RA level, think of anomalous pulmonary venous drainage and a superior sinus venosus defect.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-shunt-1",
          stem: "SVC saturation is 66% and IVC saturation 78%. What is the mixed venous saturation by the Flamm formula?",
          options: ["69%", "72%", "75%", "66%", "78%"],
          answer: 0,
          explanation:
            "Flamm weights the SVC three times: (3 × 66 + 78) ÷ 4 = 276 ÷ 4 = 69%. A simple average (72%) over-weights the IVC, whose saturation is raised by well-saturated renal venous blood and whose contribution at rest is smaller than a simple average implies.",
          difficulty: 1,
          refs: ["hanna-pcm", "flamm-mixed-venous-1969"],
        },
        {
          id: "hd-q-shunt-2",
          stem: "Aortic saturation is 95%, mixed venous 70%, PA 85%, and pulmonary venous saturation is assumed to be 98%. What is Qp:Qs?",
          options: ["1.9", "1.3", "2.5", "0.9", "1.5"],
          answer: 0,
          explanation:
            "Qp:Qs = (SaO₂ − MVO₂) ÷ (PVO₂ − PAO₂) = (95 − 70) ÷ (98 − 85) = 25 ÷ 13 ≈ 1.9. Inverting the fraction gives about 0.5; using arterial instead of pulmonary venous saturation in the denominator (95 − 85) gives 2.5.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-shunt-3",
          stem: "Using the mean of multiple samples, which step-up between the venae cavae (mixed venous) and the right atrium is classically considered significant?",
          options: ["7% or more", "3% or more", "15% or more", "1% or more"],
          answer: 0,
          explanation:
            "Classical criteria require a mean atrial-level step-up of 7% or more (11% or more if comparing the highest single samples), because RA streaming makes atrial samples variable. A threshold of 3% would be within normal sampling variation; ventricular and great-vessel levels use 5% for mean values.",
          difficulty: 2,
          refs: ["hanna-pcm", "grossman-baim-2014"],
        },
        {
          id: "hd-q-shunt-4",
          stem: "A step-up is found between the RV and the pulmonary artery, consistent with a PDA. Which saturation should be used as mixed venous in the Qp:Qs calculation?",
          options: [
            "Right ventricle",
            "The Flamm SVC/IVC value",
            "Pulmonary artery",
            "Superior vena cava alone",
            "Systemic arterial",
          ],
          answer: 0,
          explanation:
            "Mixed venous saturation is taken from the chamber immediately upstream of the step-up, here the RV, which contains fully mixed venous blood uncontaminated by the shunt. The Flamm formula is used for atrial-level shunts, where the RA itself is contaminated and the venae cavae are the last clean samples.",
          difficulty: 2,
          refs: ["hanna-pcm", "flamm-mixed-venous-1969"],
        },
        {
          id: "hd-q-shunt-5",
          stem: "A 30-year-old with a known large PDA has right-hand saturation of 96% and toe saturation of 84%. What does this indicate?",
          options: [
            "Reversal of ductal flow (Eisenmenger physiology) with desaturated blood entering the descending aorta",
            "Coarctation of the aorta proximal to the left subclavian artery",
            "A left-to-right ductal shunt with high pulmonary flow",
            "Peripheral arterial disease of the legs",
          ],
          answer: 0,
          explanation:
            "The duct joins the aorta beyond the left subclavian origin, so when PVR exceeds systemic resistance desaturated pulmonary arterial blood flows right-to-left into the descending aorta, producing differential cyanosis. A left-to-right shunt adds no desaturated blood to the systemic side and would not lower toe saturation.",
          difficulty: 3,
          refs: ["esc-achd-2020"],
        },
        {
          id: "hd-q-shunt-6",
          stem: "In a patient with an ASD, Qp is 9.0 L/min and Qs 4.5 L/min. mPAP is 30 mmHg and mean LA pressure 10 mmHg. What is the PVR?",
          options: ["2.2 WU", "4.4 WU", "3.3 WU", "6.7 WU"],
          answer: 0,
          explanation:
            "PVR uses the flow through the lungs: (30 − 10) ÷ 9.0 ≈ 2.2 WU. Using systemic flow, (30 − 10) ÷ 4.5 ≈ 4.4 WU, doubles the apparent resistance and could wrongly suggest that closure is unsafe.",
          difficulty: 2,
          refs: ["esc-achd-2020"],
        },
        {
          id: "hd-q-shunt-7",
          stem: "Saturations: high SVC 69%, low SVC 84%, IVC 75%, RA 84%, RV 84%, PA 84%, aorta 97%. What is the most likely lesion?",
          options: [
            "Superior sinus venosus defect with anomalous pulmonary venous drainage into the SVC",
            "Secundum ASD",
            "Perimembranous VSD",
            "Patent ductus arteriosus",
            "No shunt: the right-heart saturations are uniform",
          ],
          answer: 0,
          explanation:
            "The step-up occurs within the SVC, between its high and low portions, before blood reaches the RA. That locates the entry of oxygenated blood to the SVC, typical of anomalous right pulmonary veins with a superior sinus venosus defect. A secundum ASD would show a step-up at RA level with an unremarkable SVC. Uniform RA, RV and PA values only look normal if you forget to compare them with true mixed venous blood.",
          difficulty: 3,
          refs: ["esc-achd-2020"],
        },
        {
          id: "hd-q-shunt-8",
          stem: "According to the 2020 ESC ACHD guideline, which secundum ASD patient should have closure recommended regardless of symptoms?",
          options: [
            "RV volume overload with PVR below 3 WU",
            "Eisenmenger physiology with exercise desaturation",
            "PVR 6 WU despite targeted PAH therapy",
            "A small defect with Qp:Qs of 1.1 and normal RV size",
          ],
          answer: 0,
          explanation:
            "Closure is recommended when there is evidence of RV volume overload and PVR is below 3 WU, irrespective of symptoms. Closure is not recommended in Eisenmenger physiology or when PVR remains at or above 5 WU despite therapy. A small shunt without volume overload does not need closure on haemodynamic grounds.",
          difficulty: 2,
          refs: ["esc-achd-2020"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Complete a full oximetry run in a patient with an unexplained high PA saturation, localise the step-up, and calculate Qp:Qs and PVR." },
      ],
      caseIds: ["hd-case-sinus-venosus"],
    },

    // =====================================================================
    // MODULE 5 — VALVES
    // =====================================================================
    {
      id: "hd-valves",
      title: "Valve haemodynamics",
      stage: 3,
      summary:
        "Measure and interpret gradients and valve areas in aortic and mitral stenosis, assess regurgitant lesions, work through low-flow low-gradient aortic stenosis with dobutamine, and recognise pulmonary stenosis on pullback.",
      objectives: [
        "Distinguish peak-to-peak, mean and peak instantaneous gradients and explain why Doppler and catheter values differ.",
        "Calculate aortic and mitral valve areas with the Gorlin and Hakki formulas and know their limitations.",
        "Run and interpret a dobutamine study in low-flow low-gradient aortic stenosis.",
        "Recognise the haemodynamic signatures of mitral stenosis, mitral and aortic regurgitation and pulmonary stenosis.",
      ],
      lessons: [
        {
          id: "hd-valves-as-gradients",
          title: "Aortic stenosis: measuring the gradient",
          minutes: 8,
          refs: ["esc-vhd-2021", "hanna-pcm", "nishimura-carabello-haemodynamics-2012", "carabello-pullback-1979"],
          blocks: [
            {
              kind: "p",
              text: "Echocardiography is the primary tool for grading aortic stenosis. The 2021 ESC/EACTS valve guideline reserves invasive assessment for patients in whom non-invasive tests are inconclusive or conflict with the clinical picture, because retrograde crossing of a stenotic valve carries a risk of cerebral embolism. When you do measure it invasively, do it properly.",
            },
            {
              kind: "table",
              caption: "Three different 'gradients'",
              head: ["Gradient", "Definition", "How obtained", "Relationship"],
              rows: [
                ["Peak-to-peak", "LV peak minus aortic peak; the two peaks occur at different moments", "Simultaneous traces or catheter pullback", "Not a physiological instantaneous value; usually lower than peak instantaneous"],
                ["Peak instantaneous", "Largest pressure difference at any single moment", "Simultaneous LV and aortic traces; corresponds to Doppler peak gradient", "Always at least as large as peak-to-peak"],
                ["Mean", "Pressure difference integrated over the systolic ejection period", "Planimetry of simultaneous traces", "The value used to grade severity and in the Gorlin formula; correlates best with Doppler mean"],
              ],
            },
            {
              kind: "steps",
              title: "Methods, from best to least reliable",
              items: [
                { title: "Simultaneous LV and ascending aorta", detail: "A dual-lumen pigtail, or two catheters (one in the LV, one just above the valve), on matched transducers. This gives a true mean gradient." },
                { title: "Pressure wire in the LV", detail: "A pressure wire crossed through a catheter in the aortic root measures LV pressure while the catheter records aortic pressure; useful when two arterial catheters are undesirable." },
                { title: "LV with femoral sheath", detail: "Acceptable only with awareness of delay and peripheral amplification; shifting the femoral trace in time corrects the delay but not the amplification." },
                { title: "Single-catheter pullback", detail: "Gives peak-to-peak only, compares different beats, and is unreliable in AF or with changing loading." },
              ],
            },
            { kind: "h", text: "Crossing the valve" },
            {
              kind: "p",
              text: "Give anticoagulation per protocol, then cross with a straight-tip wire supported by an Amplatz left or Judkins right catheter (or a dedicated crossing catheter), limiting the number of attempts and the time spent. Exchange for a pigtail in the LV. Do not persist indefinitely: if non-invasive data are concordant, invasive crossing adds risk without information.",
            },
            { kind: "h", text: "Carabello sign" },
            {
              kind: "p",
              text: "In very severe aortic stenosis the catheter itself occupies a meaningful part of the residual orifice. When it is withdrawn from the LV, aortic systolic pressure rises, classically by at least 5 mmHg. This rise suggests a critically small valve area (in the original description, about 0.6 cm² or less).",
            },
            { kind: "h", text: "Why Doppler and catheter gradients differ" },
            {
              kind: "list",
              items: [
                "Different quantities: Doppler peak gradient is a peak instantaneous value; the catheter often reports peak-to-peak.",
                "Pressure recovery: Doppler measures at the vena contracta, where pressure is lowest; some pressure is recovered downstream where the catheter sits. Recovery is greatest in a small ascending aorta.",
                "Non-simultaneous measurements under different loading, heart rate and sedation.",
                "Malalignment of the Doppler beam (underestimates) or a mistaken MR jet (overestimates).",
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Grade aortic stenosis with the mean gradient from simultaneous LV and central aortic traces.",
                "Peak-to-peak is a convenient pullback number, not a physiological one.",
                "A rise in aortic pressure on LV catheter withdrawal (Carabello sign) indicates a critically small orifice.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Comparing LV pressure with a femoral sheath without accounting for delay and amplification.",
                "Measuring the gradient with an unmatched or differently levelled pair of transducers.",
                "Measuring a gradient with an over-damped aortic trace.",
                "Using a post-ectopic beat, which exaggerates the gradient.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Match two transducers in the aorta, cross the aortic valve, then measure peak-to-peak, peak instantaneous and mean gradients from simultaneous LV and ascending aortic traces.",
            },
          ],
        },
        {
          id: "hd-valves-as-area",
          title: "Aortic valve area, low-flow low-gradient stenosis and dobutamine",
          minutes: 9,
          refs: ["esc-vhd-2021", "gorlin-1951", "hanna-pcm", "grossman-baim-2014", "hakki-valve-formula-1981"],
          blocks: [
            {
              kind: "formula",
              name: "Gorlin formula (aortic valve)",
              expr: "AVA (cm²) = CO (mL/min) ÷ [HR × SEP (s/beat) × 44.3 × √(mean gradient, mmHg)]",
              note: "SEP is the systolic ejection period per beat. CO in mL/min. HR × SEP is the total systolic ejection time per minute.",
            },
            {
              kind: "formula",
              name: "Hakki simplification",
              expr: "Valve area (cm²) ≈ CO (L/min) ÷ √(gradient, mmHg)",
              note: "Works because HR × SEP × 44.3 is close to 1000 at ordinary heart rates. Less accurate with tachycardia or bradycardia.",
            },
            {
              kind: "table",
              caption: "Worked example",
              head: ["Input", "Value"],
              rows: [
                ["Cardiac output", "5.0 L/min (5000 mL/min)"],
                ["Heart rate", "70 bpm"],
                ["Systolic ejection period", "0.33 s/beat"],
                ["Mean gradient", "50 mmHg (√50 ≈ 7.07)"],
                ["Gorlin AVA", "5000 ÷ (70 × 0.33 × 44.3 × 7.07) = 5000 ÷ 7235 ≈ 0.69 cm²"],
                ["Hakki estimate", "5.0 ÷ 7.07 ≈ 0.71 cm²"],
              ],
            },
            {
              kind: "pitfalls",
              title: "Limitations of the Gorlin formula",
              items: [
                "Flow dependence: at low flow the calculated area tends to be smaller than the true anatomical area, which is exactly the setting where you most need it.",
                "Aortic regurgitation: forward cardiac output underestimates true transvalvular flow, so AVA is underestimated.",
                "Errors in CO (thermodilution in low output, assumed VO₂) propagate directly into the area.",
                "The square root of the gradient blunts gradient errors, but small gradients are still measured imprecisely.",
              ],
            },
            {
              kind: "table",
              caption: "Severe aortic stenosis (2021 ESC/EACTS criteria; check the 2025 update for changes)",
              head: ["Parameter", "Severe"],
              rows: [
                ["Aortic valve area", "< 1.0 cm²"],
                ["Indexed AVA", "< 0.6 cm²/m²"],
                ["Mean gradient", "≥ 40 mmHg"],
                ["Peak velocity (echo)", "≥ 4.0 m/s"],
              ],
            },
            { kind: "h", text: "Low-flow low-gradient aortic stenosis" },
            {
              kind: "table",
              caption: "Categories when AVA is under 1.0 cm² but the gradient is under 40 mmHg",
              head: ["Category", "Definition", "Next step"],
              rows: [
                ["Classical low-flow low-gradient", "LVEF < 50%, stroke volume index ≤ 35 mL/m²", "Dobutamine stress (echo, or invasive if echo is non-diagnostic)"],
                ["Paradoxical low-flow low-gradient", "LVEF ≥ 50%, stroke volume index ≤ 35 mL/m²", "Careful integrated assessment, including CT valve calcium scoring"],
                ["Normal-flow low-gradient", "LVEF ≥ 50%, stroke volume index > 35 mL/m²", "Usually moderate stenosis; recheck measurements"],
              ],
            },
            {
              kind: "steps",
              title: "Invasive dobutamine study (follow local protocol)",
              items: [
                { title: "Set up", detail: "Simultaneous LV and ascending aortic pressures on matched transducers plus a right heart catheter for output." },
                { title: "Baseline", detail: "Record output, heart rate, systolic ejection period, mean gradient and AVA." },
                { title: "Low-dose dobutamine", detail: "Increase stepwise (for example 5, then 10, up to 20 micrograms/kg/min) every few minutes, repeating measurements at each stage." },
                { title: "Stop early", detail: "Mean gradient reaches 40 mmHg or more, marked tachycardia, arrhythmia, hypotension, or symptoms." },
              ],
            },
            {
              kind: "table",
              caption: "Interpreting the dobutamine response",
              head: ["Finding", "Interpretation"],
              rows: [
                ["Stroke volume rises by 20% or more (flow reserve present); mean gradient reaches ≥ 40 mmHg with AVA remaining ≤ 1.0 cm²", "True severe aortic stenosis"],
                ["Flow reserve present; AVA rises above 1.0 cm² and the gradient stays below 40 mmHg", "Pseudo-severe stenosis: the valve opened more with more flow"],
                ["Stroke volume rises by less than 20%", "No flow reserve: indeterminate; use CT calcium scoring. Prognosis is worse, but intervention may still benefit if the stenosis is severe."],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "In low-flow states, a low gradient does not mean mild stenosis, and a small Gorlin area does not prove severe stenosis.",
                "Dobutamine increases flow; true severe stenosis responds with a rising gradient and a fixed small area.",
                "When there is no flow reserve, CT aortic valve calcium scoring (with sex-specific thresholds) helps decide.",
              ],
            },
            {
              kind: "pearl",
              text: "Write the dobutamine stage, heart rate, output, mean gradient and AVA in a single table as you go. The decision rests on how those numbers move together, not on any one of them.",
            },
          ],
        },
        {
          id: "hd-valves-mitral",
          title: "Mitral stenosis and mitral regurgitation",
          minutes: 8,
          refs: ["esc-vhd-2021", "gorlin-1951", "hanna-pcm", "sellers-1964"],
          blocks: [
            { kind: "h", text: "Mitral stenosis" },
            {
              kind: "p",
              text: "The mitral gradient is measured from simultaneous left atrial (or wedge) and LV diastolic pressures. Echocardiography usually suffices; catheterisation is used when echo is inconclusive or discordant, and around balloon mitral commissurotomy.",
            },
            {
              kind: "list",
              items: [
                "Wedge pressure is delayed relative to true LA pressure. Shift the wedge trace earlier (typically by a few tens of milliseconds, aligning the v-wave peak with the LV pressure downstroke) before measuring the gradient.",
                "Even after shifting, wedge-to-LV comparisons tend to overestimate the gradient. Transseptal LA pressure is the reference, and is preferred with prosthetic mitral valves.",
                "The mean gradient depends on flow and on diastolic filling time: tachycardia and AF with fast rates raise it for the same valve area.",
                "Exercise or dobutamine can unmask severity in a symptomatic patient with a modest resting gradient.",
              ],
            },
            {
              kind: "formula",
              name: "Gorlin formula (mitral valve)",
              expr: "MVA (cm²) = CO (mL/min) ÷ [HR × DFP (s/beat) × 37.7 × √(mean gradient, mmHg)]",
              note: "DFP is the diastolic filling period per beat. 37.7 = 44.3 × 0.85, an empirical correction from the original derivation.",
            },
            {
              kind: "table",
              caption: "Worked example",
              head: ["Input", "Value"],
              rows: [
                ["Cardiac output", "4.5 L/min"],
                ["Heart rate", "80 bpm"],
                ["Diastolic filling period", "0.40 s/beat"],
                ["Mean gradient", "10 mmHg (√10 ≈ 3.16)"],
                ["MVA", "4500 ÷ (80 × 0.40 × 37.7 × 3.16) = 4500 ÷ 3815 ≈ 1.2 cm²"],
              ],
            },
            {
              kind: "p",
              text: "The 2021 ESC/EACTS guideline defines clinically significant mitral stenosis as a valve area of 1.5 cm² or less. Significant mitral regurgitation makes the Gorlin area unreliable, because forward output underestimates transmitral flow.",
            },
            { kind: "h", text: "Mitral regurgitation" },
            {
              kind: "p",
              text: "The haemodynamic hallmark is a large v wave in the wedge or LA trace. Its size depends on the regurgitant volume and on left atrial compliance: in acute MR into a small, stiff atrium the v wave can be very large, whereas chronic severe MR into a large compliant atrium may produce only a modest v wave. A v wave roughly twice the mean wedge pressure is classically regarded as suggestive of significant MR, but it is neither sensitive nor specific.",
            },
            {
              kind: "table",
              caption: "Left ventriculographic grading of MR (Sellers)",
              head: ["Grade", "Appearance"],
              rows: [
                ["1+", "Contrast enters the LA but clears with each beat; the LA is never fully opacified"],
                ["2+", "Faint opacification of the whole LA after several beats, less dense than the LV"],
                ["3+", "LA opacified to the same density as the LV"],
                ["4+", "LA denser than the LV within one beat, with contrast refluxing into the pulmonary veins"],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Correct the wedge time delay, or use transseptal LA pressure, before measuring a mitral gradient.",
                "The mitral Gorlin constant is 37.7 and uses the diastolic filling period.",
                "A giant v wave suggests MR but also occurs with a VSD or a stiff LA; its absence does not exclude severe MR.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Measuring a mitral gradient in fast AF without averaging several cycles.",
                "Reading the mean wedge pressure as LVEDP when there is a giant v wave.",
                "Ventricular ectopy during ventriculography produces spurious MR; discard the ectopic beats.",
              ],
            },
          ],
        },
        {
          id: "hd-valves-ar-ps",
          title: "Aortic regurgitation and pulmonary stenosis",
          minutes: 6,
          refs: ["esc-vhd-2021", "esc-achd-2020", "hanna-pcm", "sellers-1964", "sinning-ari-2012"],
          blocks: [
            { kind: "h", text: "Aortic regurgitation" },
            {
              kind: "list",
              items: [
                "Chronic severe AR: wide aortic pulse pressure with low diastolic pressure, a brisk upstroke and sometimes a bisferiens contour. The LV dilates, and LVEDP stays near normal until decompensation.",
                "Acute severe AR: the non-dilated LV fills rapidly from the aorta, so LVEDP rises steeply and can approach aortic diastolic pressure (diastolic equalisation). The mitral valve may close early, making LVEDP higher than wedge pressure.",
                "Aortographic grading (Sellers 1+ to 4+) mirrors the MR scale: from faint LV opacification that clears with each beat to an LV denser than the aorta within the first beat.",
              ],
            },
            {
              kind: "formula",
              name: "Aortic regurgitation index (used after TAVI)",
              expr: "AR index = (aortic diastolic pressure − LVEDP) ÷ aortic systolic pressure × 100",
              note: "Lower values indicate a more significant leak; values below about 25 have been associated with worse outcomes after TAVI.",
            },
            {
              kind: "p",
              text: "Place the pigtail for aortography a little above the valve and away from the leaflets: a catheter sitting on or across the valve can create apparent regurgitation.",
            },
            {
              kind: "formula",
              name: "Regurgitant fraction (angiographic method)",
              expr: "RF = (angiographic stroke volume − forward stroke volume) ÷ angiographic stroke volume",
              note: "Angiographic stroke volume from LV end-diastolic minus end-systolic volume on ventriculography; forward stroke volume from Fick or thermodilution output divided by heart rate. Applies to aortic or mitral regurgitation, but not both at once.",
            },
            {
              kind: "pitfalls",
              items: [
                "Grading regurgitation from a run with ectopic beats or a catheter interfering with the valve.",
                "Using too small a contrast volume or injection rate for a large, dilated chamber, which under-grades the leak.",
                "Measuring a pulmonary stenosis gradient during a fast pullback through an irregular rhythm; record several stable beats in each chamber.",
              ],
            },
            { kind: "h", text: "Pulmonary stenosis" },
            {
              kind: "p",
              text: "Pulmonary stenosis is diagnosed on pullback from the PA into the RV. The location of the systolic pressure change localises the obstruction.",
            },
            {
              kind: "table",
              caption: "Pullback patterns",
              head: ["Level", "Pullback finding"],
              rows: [
                ["Valvar", "Abrupt rise in systolic pressure as the catheter crosses the valve from PA to RV"],
                ["Infundibular (subvalvar)", "An intermediate chamber with systolic pressure close to the PA but a ventricular (low) diastolic pressure, followed by a second systolic rise on entering the RV body"],
                ["Supravalvar or branch", "Systolic step within the PA or its branches, above the valve"],
              ],
            },
            {
              kind: "p",
              text: "For congenital valvar stenosis, the 2020 ESC ACHD guideline grades severity primarily by Doppler (severe when peak velocity exceeds 4 m/s, a peak gradient above about 64 mmHg). Balloon valvuloplasty is the usual treatment for suitable valvar stenosis. A similar intermediate-chamber pattern occurs on LV-to-aorta pullback in hypertrophic obstructive cardiomyopathy, covered in the next module.",
            },
            {
              kind: "keypoints",
              items: [
                "Acute severe AR raises LVEDP towards aortic diastolic pressure; chronic AR widens the pulse pressure.",
                "On RV pullback, an intermediate chamber with ventricular diastolic pressure means subvalvar obstruction.",
              ],
            },
            {
              kind: "pearl",
              text: "Whenever a pullback crosses a stenosis, ask which chamber you are in by its diastolic pressure. A ventricular diastolic contour with an arterial systolic level means you are in a subvalvar chamber.",
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Perform a slow PA-to-RV pullback and localise the obstruction from the systolic and diastolic pressure changes.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-valve-1",
          stem: "Echo shows a peak aortic gradient of 70 mmHg. At catheterisation the pullback peak-to-peak gradient is 45 mmHg. Which explanation is most accurate?",
          options: [
            "Doppler gives peak instantaneous gradient, at least peak-to-peak; pressure recovery adds more",
            "The echo is wrong, because Doppler always overestimates gradients across a stenotic aortic valve",
            "The catheter is wrong, because peak-to-peak always overestimates the true valve gradient",
            "Peak-to-peak and peak instantaneous gradients are the same quantity measured two ways",
          ],
          answer: 0,
          explanation:
            "Peak-to-peak compares two peaks that occur at different moments and is less than the peak instantaneous gradient that Doppler estimates. Pressure recovery downstream of the vena contracta lowers the pressure difference seen by the catheter further. Neither method is simply wrong; they measure different things. The mean gradient from simultaneous traces is the value to compare with Doppler mean.",
          difficulty: 2,
          refs: ["esc-vhd-2021"],
        },
        {
          id: "hd-q-valve-2",
          stem: "CO 4.8 L/min, HR 72 bpm, systolic ejection period 0.33 s/beat and mean aortic gradient 36 mmHg. What is the Gorlin aortic valve area?",
          options: ["0.76 cm²", "1.05 cm²", "0.52 cm²", "1.30 cm²", "0.45 cm²"],
          answer: 0,
          explanation:
            "AVA = 4800 ÷ (72 × 0.33 × 44.3 × √36) = 4800 ÷ (23.76 × 44.3 × 6) = 4800 ÷ 6315 ≈ 0.76 cm². Using the mitral constant (37.7) instead of 44.3 gives about 0.89; using the gradient without the square root gives a much smaller area.",
          difficulty: 2,
          refs: ["gorlin-1951"],
        },
        {
          id: "hd-q-valve-3",
          stem: "As the pigtail catheter is withdrawn from the LV into the aorta, the aortic systolic pressure rises by 12 mmHg. What does this suggest?",
          options: [
            "A critically small aortic orifice partly obstructed by the catheter",
            "Hypertrophic obstructive cardiomyopathy with a mid-cavity gradient",
            "Significant aortic regurgitation widening the aortic pulse pressure",
            "An over-damped aortic transducer under-reading systolic pressure",
            "Catheter entrapment in the LV trabeculae during the pullback",
          ],
          answer: 0,
          explanation:
            "This is the Carabello sign: in very severe aortic stenosis the catheter occupies a meaningful fraction of the residual orifice, so removing it lets aortic pressure rise. HOCM is suggested by a gradient within the LV cavity and by a fall in aortic pulse pressure after an ectopic beat, not by a rise in aortic pressure on catheter withdrawal.",
          difficulty: 2,
          refs: ["hanna-pcm", "carabello-pullback-1979"],
        },
        {
          id: "hd-q-valve-4",
          stem: "In classical low-flow low-gradient aortic stenosis, dobutamine increases stroke volume by 10%; mean gradient rises from 26 to 30 mmHg and AVA stays at 0.8 cm². What is the best interpretation?",
          options: [
            "No flow reserve: the study is indeterminate and CT calcium scoring should help",
            "True severe aortic stenosis, because the valve area stayed at 0.8 cm²",
            "Pseudo-severe aortic stenosis, because the gradient rose only a little",
            "Moderate aortic stenosis: no intervention needed while the gradient is below 40 mmHg",
          ],
          answer: 0,
          explanation:
            "Flow reserve requires a stroke volume rise of at least 20%. Without it, flow has not increased enough to test the valve, so the study cannot classify the stenosis; CT valve calcium scoring is the next step. Calling it true severe stenosis would require the gradient to reach 40 mmHg with a fixed small area; pseudo-severe stenosis would require the area to rise above 1.0 cm².",
          difficulty: 3,
          refs: ["esc-vhd-2021"],
        },
        {
          id: "hd-q-valve-5",
          stem: "Why does a mitral gradient measured from simultaneous wedge and LV pressures tend to overestimate the true gradient?",
          options: [
            "The wedge trace is delayed and damped relative to left atrial pressure",
            "Wedge pressure always underestimates left atrial pressure",
            "LV diastolic pressure is overestimated by pigtail catheters",
            "The Gorlin constant for the mitral valve is 44.3",
          ],
          answer: 0,
          explanation:
            "Transmission through the capillary bed delays the wedge trace, so without correction the wedge y descent lags behind the LV pressure fall and the area between the curves is exaggerated. Shifting the wedge trace earlier helps; transseptal LA pressure removes the problem. The mitral Gorlin constant is 37.7, not 44.3.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-valve-6",
          stem: "On PA-to-RV pullback the catheter passes through a zone with systolic pressure 28 mmHg (PA systolic 26 mmHg) but diastolic pressure of 4 mmHg, before systolic pressure rises to 80 mmHg in the RV body. Where is the obstruction?",
          options: ["Infundibular (subvalvar)", "Pulmonary valve", "Supravalvar pulmonary artery", "Branch pulmonary artery", "Tricuspid valve"],
          answer: 0,
          explanation:
            "The intermediate zone has an arterial-level systolic pressure but a ventricular diastolic pressure, so the catheter is already below the pulmonary valve in a subvalvar chamber; the systolic rise occurs on entering the RV body. In valvar stenosis the systolic rise happens abruptly at the valve, with no intermediate ventricular-type chamber.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-valve-7",
          stem: "A patient has aortic stenosis with moderate-to-severe aortic regurgitation. How will the Gorlin aortic valve area calculated with thermodilution output be affected?",
          options: [
            "Underestimated, because forward output is less than total transvalvular flow",
            "Overestimated, because regurgitation increases the gradient",
            "Unaffected, because regurgitation occurs in diastole",
            "Overestimated, because thermodilution overestimates output in AR",
          ],
          answer: 0,
          explanation:
            "In systole the valve carries forward flow plus the volume that will regurgitate in diastole. Using forward output alone in the numerator understates the flow that generated the gradient, so the calculated area is too small. Regurgitation does raise the gradient, but because the true flow is also higher, the formula does not overestimate the area.",
          difficulty: 3,
          refs: ["gorlin-1951"],
        },
        {
          id: "hd-q-valve-8",
          stem: "Cardiac output is 5.0 L/min and the aortic gradient is 64 mmHg. What does the Hakki formula estimate the valve area to be?",
          options: ["0.63 cm²", "0.08 cm²", "1.25 cm²", "0.32 cm²"],
          answer: 0,
          explanation:
            "Hakki: area ≈ CO (L/min) ÷ √gradient = 5.0 ÷ 8 ≈ 0.63 cm². Dividing by the gradient instead of its square root gives 0.08 cm². The approximation works because HR × SEP × 44.3 is close to 1000 at ordinary heart rates; it becomes less reliable at extremes of rate.",
          difficulty: 1,
          refs: ["hanna-pcm", "hakki-valve-formula-1981"],
        },
        {
          id: "hd-q-valve-9",
          stem: "During left ventriculography the left atrium becomes denser than the LV within the first beat and contrast refluxes into the pulmonary veins. What Sellers grade of MR is this?",
          options: ["4+", "3+", "2+", "1+"],
          answer: 0,
          explanation:
            "Grade 4+ is an LA denser than the LV within one beat with pulmonary venous reflux. In grade 3+ the LA reaches the same density as the LV, without exceeding it in the first beat. Discard ectopic beats, which cause spurious regurgitation.",
          difficulty: 1,
          refs: ["hanna-pcm", "sellers-1964"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Measure the mean aortic gradient from simultaneous LV and ascending aortic traces and calculate AVA with Gorlin and Hakki; repeat during a dobutamine infusion." },
        { sim: "haemo", task: "Record simultaneous wedge and LV pressures in mitral stenosis, correct the wedge delay, and calculate the mitral valve area." },
      ],
      caseIds: ["hd-case-lflg-as"],
    },

    // =====================================================================
    // MODULE 6 — PERICARDIAL, MYOCARDIAL AND SHOCK
    // =====================================================================
    {
      id: "hd-pericardial-myocardial",
      title: "Pericardial and myocardial haemodynamics, and shock",
      stage: 3,
      summary:
        "Separate constriction from restriction using ventricular interdependence, recognise tamponade and effusive-constrictive disease, demonstrate dynamic LVOT obstruction in HOCM, and profile shock with cardiac power output and right ventricular indices.",
      objectives: [
        "Plan and interpret a simultaneous LV–RV study to separate constrictive pericarditis from restrictive cardiomyopathy.",
        "Recognise the haemodynamics of tamponade, pulsus paradoxus and effusive-constrictive pericarditis.",
        "Measure and provoke an LVOT gradient in HOCM and identify the Brockenbrough–Braunwald–Morrow sign.",
        "Classify shock haemodynamically and calculate cardiac power output, PAPi and the RA:PCWP ratio.",
      ],
      lessons: [
        {
          id: "hd-pm-constriction",
          title: "Constriction versus restriction",
          minutes: 9,
          refs: ["esc-myopericardial-2025", "esc-pericardial-2015", "hanna-pcm", "nishimura-carabello-haemodynamics-2012", "hurrell-constriction-1996", "talreja-constriction-2008"],
          blocks: [
            {
              kind: "p",
              text: "Constrictive pericarditis and restrictive cardiomyopathy both present with right-sided congestion, preserved systolic function and raised filling pressures with a dip-and-plateau ventricular trace. The distinction matters: constriction can be cured by pericardiectomy, restriction cannot. In the UK, previous cardiac surgery, radiotherapy and idiopathic or post-viral pericarditis are common causes of constriction; amyloid is the commonest cause of restriction.",
            },
            {
              kind: "list",
              items: [
                "Constriction: a rigid pericardial shell fixes the total cardiac volume. The heart is isolated from intrathoracic pressure changes, and the two ventricles compete for the same space (exaggerated ventricular interdependence).",
                "Restriction: the myocardium is stiff, the pericardium is normal, intrathoracic pressure changes are transmitted to the heart, and both ventricles behave in parallel.",
              ],
            },
            {
              kind: "steps",
              title: "Setting up the study",
              items: [
                { title: "Two matched transducers", detail: "Simultaneous LV and RV pressures, zeroed and levelled together, displayed on the same scale. High-fidelity catheters are ideal; fluid-filled systems need optimal damping." },
                { title: "Also record", detail: "RA, PA and wedge pressures, and cardiac output." },
                { title: "Respiration", detail: "Quiet spontaneous breathing, no breath-hold, over several respiratory cycles at a slow sweep speed." },
                { title: "Volume", detail: "If the patient has been diuresed and pressures are only modestly raised, give a rapid fluid challenge (per local protocol) to unmask the physiology." },
              ],
            },
            {
              kind: "table",
              caption: "Distinguishing features (approximate thresholds)",
              head: ["Feature", "Constriction", "Restrictive cardiomyopathy"],
              rows: [
                ["Diastolic equalisation (LVEDP − RVEDP)", "≤ 5 mmHg", "Often > 5 mmHg, especially with volume or exercise"],
                ["RVEDP ÷ RVSP", "> 1/3", "< 1/3"],
                ["PA systolic pressure", "Usually < 50–55 mmHg", "Often > 50–55 mmHg"],
                ["RA waveform", "Raised, M or W shape with steep x and y", "Raised, steep y"],
                ["Inspiratory change in mean RA (Kussmaul)", "No fall or a rise", "Variable"],
                ["LV and RV systolic peaks with inspiration", "Discordant: RV rises, LV falls", "Concordant: both fall"],
                ["Systolic area index", "> 1.1", "≤ 1.1"],
                ["Wedge–LV early diastolic gradient with inspiration", "Falls (dissociation of intrathoracic and intracardiac pressures)", "Little change"],
              ],
            },
            {
              kind: "formula",
              name: "Systolic area index",
              expr: "SAI = (RV area ÷ LV area) in inspiration ÷ (RV area ÷ LV area) in expiration",
              note: "Areas under the systolic portions of the simultaneous RV and LV pressure curves. A ratio above about 1.1 indicates enhanced interdependence and favours constriction.",
            },
            {
              kind: "p",
              text: "The static criteria (equalisation, RVEDP/RVSP, PA systolic pressure) overlap considerably between the two conditions. The dynamic respiratory criteria, which test ventricular interdependence directly, are more discriminating. Integrate them with imaging (pericardial thickening or calcification on CT, pericardial inflammation on CMR, septal bounce and annulus reversus on echo) and with natriuretic peptides, which tend to be lower in constriction than in restriction.",
            },
            {
              kind: "keypoints",
              items: [
                "Discordance of LV and RV systolic pressures with respiration is the key haemodynamic marker of constriction.",
                "Diuresed patients may hide the physiology; load with fluid before concluding.",
                "Pericardial inflammation on imaging or a raised CRP suggests transient constriction, which can reverse with anti-inflammatory treatment; the 2025 ESC guideline advises a 3–6 month trial of anti-inflammatory therapy first.",
                "Constriction that fails medical therapy, or constriction without pericarditis, is referred for pericardiectomy without delay (2025 ESC).",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Breath-holding or sequential (non-simultaneous) LV and RV recordings abolish the respiratory analysis.",
                "AF with variable cycle lengths produces beat-to-beat changes that mimic or mask respiratory effects; compare beats with similar preceding cycle lengths.",
                "Tachycardia shortens diastole and can hide the plateau.",
                "Mixed disease after radiotherapy (constriction plus myocardial fibrosis) gives intermediate results.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Record simultaneous LV and RV pressures over six respiratory cycles, compare inspiratory and expiratory systolic peaks, and decide between constriction and restriction.",
            },
          ],
        },
        {
          id: "hd-pm-tamponade",
          title: "Tamponade and effusive-constrictive pericarditis",
          minutes: 7,
          refs: ["esc-pericardial-2015", "hanna-pcm", "sagrista-effusive-constrictive-2004"],
          blocks: [
            {
              kind: "p",
              text: "In tamponade, pericardial pressure rises until it matches the diastolic pressures in the cardiac chambers. Transmural filling pressure falls, stroke volume falls and heart rate rises. Because pericardial pressure acts throughout the cardiac cycle, every chamber's diastolic pressure settles at about the pericardial pressure.",
            },
            {
              kind: "keypoints",
              title: "Haemodynamic signature of tamponade",
              items: [
                "Raised and equalised diastolic pressures: RA ≈ RVEDP ≈ PA diastolic ≈ wedge ≈ pericardial pressure.",
                "Preserved x descent with a blunted or absent y descent, because early diastolic filling is impeded.",
                "Pulsus paradoxus: inspiratory fall in systolic arterial pressure of more than 10 mmHg.",
                "Kussmaul sign is usually absent.",
              ],
            },
            {
              kind: "table",
              caption: "Tamponade compared with constriction",
              head: ["Feature", "Tamponade", "Constriction"],
              rows: [
                ["y descent", "Blunted or absent", "Steep"],
                ["Dip-and-plateau", "Absent", "Present"],
                ["Pulsus paradoxus", "Usual", "Less common"],
                ["Kussmaul sign", "Usually absent", "Often present"],
                ["Inspiratory RV–LV discordance", "Present", "Present"],
              ],
            },
            {
              kind: "p",
              text: "Pulsus paradoxus reflects exaggerated interdependence: inspiration increases right-sided filling, the septum shifts left in a fixed space, and LV stroke volume falls. It can be absent despite tamponade when the LV cannot respond to the septal shift or when right-sided filling does not increase with inspiration.",
            },
            {
              kind: "list",
              items: [
                "Conditions that can mask pulsus paradoxus: severe aortic regurgitation, large ASD, markedly raised LVEDP from LV dysfunction, positive-pressure ventilation, RV hypertrophy, and regional (loculated) tamponade after cardiac surgery.",
                "Low-pressure tamponade: in hypovolaemia (dialysis, bleeding) filling pressures may be only modestly raised; the diagnosis relies on echo and the response to drainage.",
              ],
            },
            { kind: "h", text: "Effusive-constrictive pericarditis" },
            {
              kind: "p",
              text: "In effusive-constrictive disease the visceral pericardium is itself constricting the heart underneath an effusion. Recording pericardial and RA pressures simultaneously during pericardiocentesis makes the diagnosis: after drainage brings pericardial pressure to near zero, RA pressure remains raised (classically failing to fall by 50% or to below 10 mmHg), and the RA trace takes on a constrictive pattern with a steep y descent.",
            },
            {
              kind: "steps",
              title: "Haemodynamic monitoring during pericardiocentesis",
              items: [
                { title: "Before drainage", detail: "Right heart catheter in the RA (or a PA catheter) and an arterial line, both zeroed and levelled. Record RA, wedge if available, and arterial pressure with respiration to document pulsus paradoxus." },
                { title: "Enter the pericardium", detail: "Once the needle or drain is in the pericardial space, connect it to a transducer and record pericardial pressure simultaneously with RA pressure. In tamponade the two are nearly identical." },
                { title: "Drain", detail: "Remove fluid while watching both traces. Pericardial pressure falls towards zero, RA pressure should fall with it, the y descent should reappear and pulsus paradoxus should resolve." },
                { title: "Reassess", detail: "If RA pressure stays high once pericardial pressure is near zero, think of effusive-constrictive disease, RV failure or volume overload, and compare with echo." },
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Assuming equalised diastolic pressures always mean tamponade: constriction and severe biventricular failure can also equalise them; the y descent and imaging separate them.",
                "Missing regional tamponade after cardiac surgery because the classical signs are absent.",
                "Draining an effusion without monitoring RA pressure and so missing effusive-constrictive disease.",
              ],
            },
            {
              kind: "pearl",
              text: "Before pericardiocentesis in a stable patient, connect a transducer to the pericardial needle or drain and record RA pressure on a second channel. It costs a minute and answers the effusive-constrictive question for good.",
            },
          ],
        },
        {
          id: "hd-pm-hocm",
          title: "Hypertrophic obstructive cardiomyopathy",
          minutes: 7,
          refs: ["hanna-pcm", "nishimura-carabello-haemodynamics-2012", "brockenbrough-1961", "esc-cardiomyopathy-2023"],
          blocks: [
            {
              kind: "p",
              text: "In hypertrophic obstructive cardiomyopathy, systolic anterior motion of the mitral valve and septal hypertrophy produce a dynamic left ventricular outflow tract (LVOT) obstruction. The gradient increases when preload or afterload falls or contractility rises, and decreases when they move the other way. Echocardiography, including exercise echo, is the first-line test; invasive measurement is used when echo is inconclusive and during alcohol septal ablation.",
            },
            {
              kind: "steps",
              title: "Measuring the gradient",
              items: [
                { title: "Use an end-hole catheter", detail: "A multipurpose or dedicated end-hole catheter in the LV, or a transseptal approach to the LV inflow. A pigtail's side holes straddle the gradient and cannot localise it." },
                { title: "Record simultaneous aortic pressure", detail: "From a second arterial catheter or sheath, matched and levelled." },
                { title: "Slow pullback", detail: "From apex to LVOT to aorta. The systolic pressure drop occurs below the aortic valve; the subaortic chamber has aortic-level systolic pressure with ventricular diastolic pressure." },
                { title: "Exclude entrapment", detail: "A catheter trapped in a small cavity or trabeculae records a high, late-peaking systolic pressure. Reposition and check against echo." },
                { title: "Provoke if the resting gradient is low", detail: "Valsalva strain, a post-ectopic beat, or another protocol-approved provocation. Dobutamine is generally avoided for this purpose because it is non-physiological and poorly tolerated." },
              ],
            },
            {
              kind: "table",
              caption: "Brockenbrough–Braunwald–Morrow sign: the beat after a premature ventricular contraction",
              head: ["Measurement", "HOCM (dynamic obstruction)", "Fixed aortic stenosis"],
              rows: [
                ["LV systolic pressure", "Rises", "Rises"],
                ["LV–aortic gradient", "Rises markedly", "Rises"],
                ["Aortic systolic pressure", "Falls or fails to rise", "Rises"],
                ["Aortic pulse pressure", "Falls", "Rises"],
              ],
            },
            {
              kind: "p",
              text: "Post-extrasystolic potentiation increases contractility. In fixed stenosis this produces a larger stroke volume and a wider aortic pulse pressure. In HOCM the stronger contraction worsens the obstruction, so stroke volume and aortic pulse pressure fall despite a higher LV pressure. The aortic trace often shows a spike-and-dome contour.",
            },
            { kind: "h", text: "Haemodynamics during alcohol septal ablation" },
            {
              kind: "p",
              text: "During alcohol septal ablation the LVOT gradient is monitored continuously with an LV catheter and simultaneous aortic pressure, at rest and after provocation, before and after each step. A temporary pacing wire is placed beforehand because the septal infarct can damage the conducting system and cause complete heart block. Echo contrast injected into the candidate septal branch confirms that it supplies the septum at the point of mitral contact before any alcohol is given. The gradient often falls immediately, may partly recur over the next few days, and then declines further over weeks to months as the septum thins and remodels, so the laboratory value is not the final result.",
            },
            {
              kind: "keypoints",
              items: [
                "An LVOT gradient of 30 mmHg or more at rest or with provocation defines obstruction; 50 mmHg or more is the conventional threshold for considering septal reduction in symptomatic patients on optimal therapy.",
                "The gradient is dynamic: always report the conditions (rest, Valsalva, post-ectopic).",
                "A falling aortic pulse pressure after an ectopic beat identifies dynamic obstruction.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Using a pigtail to localise the gradient.",
                "Mistaking catheter entrapment for an intracavity gradient.",
                "Treating hypotension with inotropes in obstructive physiology: they worsen the gradient. Use fluid and vasoconstrictors, and avoid vasodilators.",
              ],
            },
            {
              kind: "pearl",
              text: "Induce one ventricular ectopic beat with the LV catheter and watch the aortic pulse pressure on the next beat. It is the quickest way to tell dynamic from fixed obstruction.",
            },
          ],
        },
        {
          id: "hd-pm-shock",
          title: "Haemodynamic profiling of shock",
          minutes: 8,
          refs: ["scai-shock-2022", "esc-hf-2021", "hanna-pcm", "fincke-cpo-2004", "korabathina-papi-2012"],
          blocks: [
            {
              kind: "p",
              text: "A pulmonary artery catheter is not needed in every patient in shock, but it earns its place when the mechanism is unclear, when shock is not responding to treatment, when the right ventricle may be failing, and when selecting or weaning mechanical circulatory support. The goal is to answer four questions: is output low, are the filling pressures high, which ventricle is failing, and is vascular tone low or high.",
            },
            {
              kind: "table",
              caption: "Haemodynamic profiles (typical patterns)",
              head: ["Shock type", "Cardiac index", "Wedge", "RA", "SVR", "SvO₂"],
              rows: [
                ["Cardiogenic, LV-predominant", "Low", "High", "Normal or high", "High", "Low"],
                ["Cardiogenic, RV-predominant", "Low", "Normal or low", "High", "High", "Low"],
                ["Hypovolaemic", "Low", "Low", "Low", "High", "Low"],
                ["Distributive (for example septic, after resuscitation)", "Normal or high", "Low or normal", "Low or normal", "Low", "Normal or high"],
                ["Obstructive: tamponade", "Low", "High, equalised", "High, equalised", "High", "Low"],
                ["Obstructive: massive pulmonary embolism", "Low", "Low or normal", "High", "High", "Low"],
              ],
            },
            {
              kind: "p",
              text: "Commonly used haemodynamic criteria for cardiogenic shock include a cardiac index below about 2.2 L/min/m² on support (or about 1.8 without) with a wedge pressure above about 15 mmHg, alongside hypotension and evidence of hypoperfusion. Mixed pictures are common: an infarct-related shock can become vasodilatory as inflammation develops.",
            },
            {
              kind: "formula",
              name: "Cardiac power output",
              expr: "CPO (W) = MAP (mmHg) × CO (L/min) ÷ 451",
              note: "Combines pressure and flow. Values below about 0.6 W have been associated with high mortality in cardiogenic shock.",
            },
            {
              kind: "formula",
              name: "Pulmonary artery pulsatility index",
              expr: "PAPi = (PA systolic − PA diastolic) ÷ RA pressure",
              note: "A low PAPi indicates a failing RV that cannot generate pulsatile flow against its filling pressure. Thresholds depend on the setting (about 0.9 in acute inferior MI; higher values in advanced heart failure cohorts).",
            },
            {
              kind: "formula",
              name: "RA to wedge ratio",
              expr: "RA:PCWP = mean RA pressure ÷ mean wedge pressure",
              note: "A raised ratio (above about 0.6, and especially approaching 1) suggests disproportionate RV dysfunction.",
            },
            {
              kind: "table",
              caption: "Worked example: inferior STEMI with hypotension",
              head: ["Measurement", "Value", "Interpretation"],
              rows: [
                ["MAP", "62 mmHg", ""],
                ["Cardiac output", "3.2 L/min", ""],
                ["CPO", "62 × 3.2 ÷ 451 = 0.44 W", "Low"],
                ["PA pressure", "28/18 mmHg", ""],
                ["RA", "17 mmHg", ""],
                ["PAPi", "(28 − 18) ÷ 17 = 0.59", "Low: RV failure"],
                ["Wedge", "14 mmHg", "RA:PCWP = 1.2, RV-predominant"],
              ],
            },
            {
              kind: "table",
              caption: "SCAI SHOCK stages (2022 update)",
              head: ["Stage", "Description"],
              rows: [
                ["A: At risk", "Not in shock but at risk (for example large acute MI)"],
                ["B: Beginning", "Hypotension or tachycardia without hypoperfusion"],
                ["C: Classic", "Hypoperfusion requiring intervention beyond volume (inotropes, vasopressors or mechanical support)"],
                ["D: Deteriorating", "Failing to respond to initial interventions"],
                ["E: Extremis", "Circulatory collapse, often with ongoing CPR or ECMO"],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Profile shock with output, filling pressures on both sides, SVR and SvO₂.",
                "CPO integrates pressure and flow and tracks prognosis better than either alone.",
                "A low PAPi and a high RA:PCWP ratio identify RV failure, which changes the choice of support.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Interpreting SvO₂ without haemoglobin, arterial saturation and oxygen consumption: anaemia and hypoxaemia also lower it.",
                "Reading wedge pressure in a patient on high PEEP without considering transmitted intrathoracic pressure.",
                "Assuming a normal wedge excludes cardiogenic shock: RV-predominant shock has a normal or low wedge.",
              ],
            },
            {
              kind: "sim",
              sim: "haemo",
              task: "Profile three shocked patients from their RA, PA, wedge, output and SvO₂; calculate CPO, PAPi and RA:PCWP and state which ventricle is failing.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "hd-q-pm-1",
          stem: "Simultaneous LV and RV traces in a patient with right heart failure after cardiac surgery show that, on inspiration, RV systolic pressure rises while LV systolic pressure falls. What does this indicate?",
          options: [
            "Enhanced ventricular interdependence, favouring constriction",
            "Concordance of LV and RV systolic pressures, favouring restriction",
            "Normal respiratory variation seen in any spontaneously breathing patient",
            "Severe tricuspid regurgitation with a large v wave in the RA trace",
            "Hypovolaemia after diuresis, with exaggerated respiratory swings",
          ],
          answer: 0,
          explanation:
            "Discordant systolic changes show that inspiratory filling of the RV occurs at the expense of the LV within a fixed pericardial volume: the hallmark of constriction. In restriction the pericardium is normal and both ventricles fall together on inspiration (concordance).",
          difficulty: 2,
          refs: ["esc-pericardial-2015", "hurrell-constriction-1996"],
        },
        {
          id: "hd-q-pm-2",
          stem: "Which RA waveform pattern is most typical of cardiac tamponade?",
          options: [
            "Raised pressure with a preserved x descent and a blunted or absent y descent",
            "Raised pressure with steep x and y descents (M or W pattern)",
            "Giant v waves with an absent x descent",
            "Cannon a waves",
            "Normal pressure with prominent y descent",
          ],
          answer: 0,
          explanation:
            "In tamponade, pericardial pressure impedes filling throughout diastole, so the early-diastolic y descent is blunted, whereas the systolic x descent is preserved. The M or W pattern with a steep y descent is characteristic of constriction, where early filling is rapid until the rigid pericardium halts it.",
          difficulty: 2,
          refs: ["esc-pericardial-2015"],
        },
        {
          id: "hd-q-pm-3",
          stem: "During pericardiocentesis, pericardial pressure falls from 18 to 1 mmHg, but RA pressure falls only from 20 to 16 mmHg and develops a steep y descent. What is the diagnosis?",
          options: [
            "Effusive-constrictive pericarditis",
            "Incomplete drainage",
            "Restrictive cardiomyopathy",
            "Simple tamponade, now resolved",
            "Pulmonary hypertension",
          ],
          answer: 0,
          explanation:
            "With pericardial pressure near zero, RA pressure should fall substantially in simple tamponade. Failure to fall by 50% or to below 10 mmHg, with a new constrictive RA pattern, indicates that the visceral pericardium is still constraining the heart: effusive-constrictive pericarditis. Incomplete drainage is excluded because pericardial pressure is already near zero.",
          difficulty: 3,
          refs: ["esc-pericardial-2015", "sagrista-effusive-constrictive-2004"],
        },
        {
          id: "hd-q-pm-4",
          stem: "In the beat after a ventricular ectopic, LV systolic pressure rises from 180 to 220 mmHg and aortic pulse pressure falls from 50 to 35 mmHg. What does this indicate?",
          options: [
            "Dynamic LVOT obstruction (Brockenbrough–Braunwald–Morrow sign)",
            "Severe fixed aortic stenosis with a heavily calcified and immobile valve",
            "Severe aortic regurgitation with a widened pulse pressure",
            "Catheter entrapment in the LV outflow tract during the beat",
            "Normal post-extrasystolic potentiation in a healthy ventricle",
          ],
          answer: 0,
          explanation:
            "Post-ectopic potentiation increases contractility. In dynamic obstruction this worsens the obstruction, so despite a higher LV pressure the stroke volume and aortic pulse pressure fall. In fixed aortic stenosis the stronger beat ejects more and aortic pulse pressure rises.",
          difficulty: 2,
          refs: ["hanna-pcm", "brockenbrough-1961"],
        },
        {
          id: "hd-q-pm-5",
          stem: "A patient in cardiogenic shock has MAP 62 mmHg and cardiac output 3.4 L/min. What is the cardiac power output?",
          options: ["0.47 W", "0.62 W", "1.05 W", "0.21 W", "2.1 W"],
          answer: 0,
          explanation:
            "CPO = MAP × CO ÷ 451 = 62 × 3.4 ÷ 451 ≈ 0.47 W, below the level of about 0.6 W associated with poor outcomes. Using a constant of 200 instead of 451 gives about 1.05 W, a common slip.",
          difficulty: 2,
          refs: ["scai-shock-2022", "fincke-cpo-2004"],
        },
        {
          id: "hd-q-pm-6",
          stem: "After an inferior STEMI: PA 28/18 mmHg, RA 17 mmHg, wedge 12 mmHg, cardiac index 1.7 L/min/m². What best describes the haemodynamics?",
          options: [
            "RV-predominant cardiogenic shock (PAPi about 0.6, RA:PCWP about 1.4)",
            "LV-predominant cardiogenic shock with a low wedge after diuresis",
            "Hypovolaemic shock from bleeding at the femoral access site after the primary PCI",
            "Distributive shock from sepsis complicating the infarct",
            "Tamponade from free-wall rupture with equalised diastolic pressures",
          ],
          answer: 0,
          explanation:
            "PAPi = (28 − 18) ÷ 17 ≈ 0.6 and RA exceeds wedge (ratio about 1.4): the RV cannot generate pulsatile flow despite a high filling pressure, while left-sided filling is not raised. LV-predominant shock would show a high wedge. Tamponade would equalise RA and wedge at a high level.",
          difficulty: 2,
          refs: ["scai-shock-2022", "korabathina-papi-2012"],
        },
        {
          id: "hd-q-pm-7",
          stem: "A hypotensive patient has cardiac index 4.6 L/min/m², wedge 8 mmHg, RA 5 mmHg, SVR 520 dyn·s·cm⁻⁵ and SvO₂ 80%. Which shock profile fits?",
          options: ["Distributive", "Cardiogenic", "Hypovolaemic", "Obstructive (massive PE)"],
          answer: 0,
          explanation:
            "High output, low SVR, low filling pressures and a high SvO₂ describe distributive shock, for example sepsis. Hypovolaemic shock also has low filling pressures but with low output, high SVR and a low SvO₂.",
          difficulty: 1,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-pm-8",
          stem: "Which catheter should be used to localise an intracavity or LVOT gradient in suspected HOCM?",
          options: [
            "An end-hole catheter (for example multipurpose) pulled back slowly",
            "A pigtail catheter pulled back from the apex to the ascending aorta",
            "A balloon flotation catheter advanced from the right heart",
            "An angiographic balloon catheter with multiple side holes near the tip",
          ],
          answer: 0,
          explanation:
            "An end-hole catheter samples pressure at a single point, so a slow pullback shows where the pressure drop occurs. A pigtail has side holes over several centimetres that can straddle the obstruction and record a blended pressure.",
          difficulty: 2,
          refs: ["hanna-pcm"],
        },
        {
          id: "hd-q-pm-9",
          stem: "Which static finding favours constrictive pericarditis over restrictive cardiomyopathy?",
          options: [
            "RVEDP more than one-third of RV systolic pressure",
            "A PA systolic pressure of 65 mmHg at rest",
            "LVEDP exceeding RVEDP by 10 mmHg or more",
            "A dip-and-plateau pattern in the LV diastolic trace",
          ],
          answer: 0,
          explanation:
            "In constriction RVEDP is high relative to a modest RV systolic pressure, so the ratio usually exceeds one-third. A high PA systolic pressure and a large LVEDP–RVEDP difference favour restriction. Dip-and-plateau occurs in both and does not discriminate. Remember that static criteria overlap; the dynamic respiratory criteria are stronger.",
          difficulty: 1,
          refs: ["esc-pericardial-2015"],
        },
      ],
      sims: [
        { sim: "haemo", task: "Run a simultaneous LV–RV study before and after a fluid challenge and calculate the systolic area index." },
        { sim: "haemo", task: "Profile a patient in cardiogenic shock and decide whether the RV, the LV or both need support." },
      ],
      caseIds: ["hd-case-constriction"],
    },
  ],

  // =======================================================================
  // CASES
  // =======================================================================
  cases: [
    {
      id: "hd-case-constriction",
      title: "Right heart failure after cardiac surgery: constriction or restriction?",
      trackId: "haemodynamics",
      stage: 3,
      provenance: { kind: "synthetic", basedOn: "Composite of typical post-surgical constrictive pericarditis presentations" },
      summary:
        "A man develops right heart failure two years after CABG and mitral annuloplasty. Echocardiography is equivocal. You plan, perform and interpret a simultaneous left and right heart study.",
      presentation:
        "A 67-year-old man had CABG (LIMA to LAD, vein graft to an obtuse marginal) and mitral annuloplasty two years ago. Over eight months he has developed exertional breathlessness (NYHA III), abdominal swelling and leg oedema despite furosemide 80 mg daily. The JVP is at the earlobe and rises on inspiration. BP 104/68 mmHg, HR 92 bpm in sinus rhythm, SpO₂ 96% on air. He has ascites and pitting oedema to the knees.",
      findings: [
        "ECG: sinus tachycardia, low-voltage limb leads, non-specific T-wave flattening.",
        "Echo: LVEF 55%, normal wall thickness, septal bounce, dilated non-collapsing IVC, mitral inflow respiratory variation about 20% (equivocal), medial e′ preserved.",
        "Bloods: NT-proBNP 620 ng/L, creatinine 128 µmol/L, CRP 4 mg/L, albumin 31 g/L.",
        "CT chest: pericardium up to 4 mm thick with patchy calcification over the RV.",
      ],
      steps: [
        {
          id: "s1",
          prompt: "The heart team requests invasive haemodynamics. How should the study be set up?",
          options: [
            {
              text: "Sequential RV and then LV pressures on one transducer, each recorded during a breath-hold at end-expiration",
              feedback:
                "Breath-holding abolishes the respiratory changes you need, and sequential recordings cannot show discordance between the ventricles. End-expiration without breath-hold is right for single values, not for this study.",
              next: "s1-sequential-limits", stateDelta: {"stability": -10} },
            {
              text: "Simultaneous LV and RV pressures on two matched transducers on the same scale, slow sweep, quiet spontaneous breathing over several cycles, plus RA, PA, wedge and cardiac output",
              best: true,
              feedback:
                "Correct. The key discriminator is the respiratory behaviour of simultaneous LV and RV systolic pressures, which requires matched channels, a common scale and normal breathing without breath-holding.",
              next: "s2",
            },
            {
              text: "Right heart study only, with a fluid challenge",
              acceptable: true,
              feedback:
                "This can show raised, equalised right-sided pressures and a constrictive RA pattern, but without simultaneous LV pressure you cannot test ventricular interdependence, the most discriminating criterion.",
              next: "s2",
            },
            {
              text: "Coronary angiography and left ventriculography only",
              feedback:
                "Graft patency may be worth checking, but angiography does not address the question. You need simultaneous ventricular pressures.",
              next: "s2",
            },
          ],
        },
        {
          id: "s2",
          prompt: "How do you interpret these resting values?",
          info:
            "Right radial 5 Fr pigtail in the LV; right femoral vein multipurpose catheter in the RV. Fast-flush tests satisfactory. He received an extra 80 mg of IV furosemide yesterday and appears dry. End-expiratory values: RA mean 9 mmHg; RV 32/8 mmHg; PA 32/12 mmHg (mean 19); wedge 10 mmHg; LV 112/11 mmHg. Thermodilution CO 4.0 L/min.",
          options: [
            {
              text: "Constriction is excluded because RA pressure is below 10 mmHg",
              feedback:
                "A diuresed patient with constriction can have near-normal resting pressures. Absolute values do not exclude it; the pattern under adequate filling matters.",
              next: "s2-false-exclusion", stateDelta: {"stability": -15, "flags": ["missed-constriction"]} },
            {
              text: "Restrictive cardiomyopathy is confirmed because LVEDP exceeds RVEDP",
              feedback:
                "The difference is 3 mmHg, within the equalisation range, and in any case static criteria overlap. This does not confirm restriction.",
              next: "s3",
            },
            {
              text: "Filling pressures are only modestly raised after aggressive diuresis; give a rapid fluid challenge before drawing conclusions",
              best: true,
              feedback:
                "Correct. Diuresis can lower filling pressures enough to hide equalisation and the dip-and-plateau pattern. A rapid fluid challenge (per local protocol) unmasks the physiology.",
              next: "s3",
            },
            {
              text: "Reduce diuretics and repeat the study in a few weeks",
              acceptable: true,
              feedback:
                "Reasonable if a fluid challenge were unsafe, but it exposes the patient to a second procedure when the question can be answered now.",
              next: "s3",
            },
          ],
        },
        {
          id: "s3",
          prompt: "After the fluid challenge, what do these values show?",
          info:
            "After 1000 mL of saline over about 8 minutes: RA mean 19 mmHg with an M-shaped trace (prominent x and steep y descents), rising to 21 mmHg on inspiration; RV 38/19 mmHg with dip-and-plateau; LV 108/21 mmHg with dip-and-plateau; wedge 20 mmHg; PA 38/20 mmHg.",
          options: [
            {
              text: "Diastolic equalisation (LVEDP − RVEDP 2 mmHg), RVEDP/RVSP 0.5, PA systolic below 50 mmHg and a Kussmaul sign: consistent with constriction, but restriction is not yet excluded",
              best: true,
              feedback:
                "Correct. All the static criteria point to constriction, but they overlap with restriction. The dynamic respiratory analysis is the stronger test.",
              next: "s4",
            },
            {
              text: "This is diagnostic of constriction: proceed to pericardiectomy",
              feedback:
                "The static criteria favour constriction, but they are not specific. Complete the respiratory analysis before recommending major surgery.",
              next: "s4",
            },
            {
              text: "Dip-and-plateau in both ventricles confirms restrictive cardiomyopathy",
              feedback:
                "Dip-and-plateau occurs in both constriction and restriction and does not discriminate.",
              next: "s4",
            },
            {
              text: "Equalised diastolic pressures indicate tamponade",
              feedback:
                "There is no effusion on imaging, and tamponade blunts the y descent; here it is steep, which points to constriction or restriction.",
              next: "s4",
            },
          ],
        },
        {
          id: "s4",
          prompt: "What is your conclusion from the respiratory analysis?",
          info:
            "Over six respiratory cycles, RV systolic peak rises from 36 to 42 mmHg on inspiration while LV systolic peak falls from 112 to 98 mmHg. The systolic area index is 1.4. The wedge–LV early diastolic gradient falls from 8 mmHg in expiration to 2 mmHg in inspiration.",
          options: [
            {
              text: "Ventricular discordance with enhanced interdependence and dissociation of intrathoracic and intracardiac pressures: constrictive pericarditis",
              best: true,
              feedback:
                "Correct. Discordant systolic changes, a systolic area index above 1.1 and an inspiratory fall in the wedge–LV gradient all indicate a fixed pericardial constraint.",
              next: "s5",
            },
            {
              text: "Concordant changes indicating restrictive cardiomyopathy",
              feedback:
                "The ventricles move in opposite directions on inspiration. That is discordance, the hallmark of constriction.",
              next: "s5",
            },
            {
              text: "Non-diagnostic because of the sinus tachycardia",
              feedback:
                "Tachycardia can shorten the plateau, but it does not prevent respiratory analysis in sinus rhythm with stable cycle lengths. The findings here are clear.",
              next: "s5",
            },
          ],
        },
        {
          id: "s5",
          prompt: "What is the most appropriate next step?",
          info:
            "CMR: pericardial thickening up to 5 mm without pericardial late gadolinium enhancement or oedema; no myocardial late enhancement. CRP remains normal.",
          options: [
            {
              text: "A two to three month trial of anti-inflammatory therapy",
              acceptable: true,
              feedback:
                "This is appropriate when CRP is raised or CMR shows pericardial inflammation, because transient constriction can resolve. Neither is present here, so the chance of benefit is low and surgery is delayed.",
            },
            {
              text: "Discuss at a multidisciplinary meeting and refer for pericardiectomy at a centre experienced in pericardial surgery",
              best: true,
              feedback:
                "Correct. This is chronic constriction without markers of active inflammation, so it is unlikely to resolve with anti-inflammatory treatment. Pericardiectomy is the definitive treatment and outcomes are best in experienced centres.",
            },
            {
              text: "Increase diuretics and review in six months",
              feedback:
                "Diuretics are only palliative. Delay allows myocardial atrophy and fibrosis, which worsen surgical outcomes.",
            },
            {
              text: "Endomyocardial biopsy to exclude amyloid",
              feedback:
                "The haemodynamics and imaging point clearly to constriction with a normal myocardium on CMR. Biopsy adds risk without changing management.",
            },
          ],
        },
        {
          "id": "s1-sequential-limits",
          "kind": "consequence",
          "info": "The sequential recordings show similar diastolic pressures, but the RV and LV traces come from different breaths and cannot be compared beat by beat.",
          "prompt": "The respiratory criteria cannot be assessed. What now?",
          "options": [
            {
              "text": "Add a second transducer and record simultaneous LV and RV pressures on the same scale during quiet breathing",
              "best": true,
              "feedback": "Ventricular interdependence can only be judged on simultaneous traces over several breaths.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Report the study as consistent with restriction",
              "feedback": "Without simultaneous traces the dynamic criteria are unassessable; a label now would be a guess.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Ask the patient to hold his breath at end-expiration for every recording",
              "feedback": "Breath-holding abolishes exactly the respiratory variation you need to see.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
        {
          "id": "s2-false-exclusion",
          "kind": "consequence",
          "info": "The report says 'no constriction'. Three months later he is readmitted with worsening ascites and oedema despite high-dose diuretics.",
          "prompt": "What went wrong, and what do you do now?",
          "options": [
            {
              "text": "Repeat the study with a fluid challenge if the filling pressures are low, and assess the respiratory criteria on simultaneous traces",
              "best": true,
              "feedback": "Over-diuresis can mask constriction; volume loading and dynamic criteria unmask it.",
              "stateDelta": {
                "stability": 0
              }
            },
            {
              "text": "Increase diuretics further",
              "feedback": "Diuretics worsen output in constriction and the underlying diagnosis remains unaddressed.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Refer for transplant assessment",
              "acceptable": true,
              "feedback": "Premature: a potentially curable pericardial cause has not been excluded properly.",
              "stateDelta": {
                "stability": -5
              }
            }
          ]
        },
      ],
      outcome:
        "He underwent pericardiectomy at a high-volume centre; dense adhesions were found over the RV. At six months he was in NYHA class I on a low dose of diuretic.",
      outcomeVariants: [
        {
          "flag": "missed-constriction",
          "text": "A falsely reassuring first study, done after aggressive diuresis without a fluid challenge, delayed the diagnosis by months."
        }
      ],
      learningPoints: [
        "Prior cardiac surgery is a common cause of constrictive pericarditis.",
        "Diuresed patients can hide constrictive physiology; give a fluid challenge before concluding.",
        "Static criteria (equalisation, RVEDP/RVSP, PA systolic pressure) overlap with restriction; respiratory discordance of LV and RV systolic pressures is more discriminating.",
        "Simultaneous, matched LV and RV recordings during quiet breathing without breath-hold are essential.",
        "Absence of inflammatory markers on blood tests and CMR favours surgery over an anti-inflammatory trial.",
      ],
      refs: ["esc-pericardial-2015", "hanna-pcm", "hurrell-constriction-1996", "talreja-constriction-2008"],
    },
    {
      id: "hd-case-sinus-venosus",
      title: "Unexplained pulmonary hypertension: running the oximetry",
      trackId: "haemodynamics",
      stage: 3,
      provenance: { kind: "synthetic", basedOn: "Typical presentation of a superior sinus venosus defect with anomalous pulmonary venous drainage" },
      summary:
        "A woman referred for pulmonary hypertension work-up has an unexpectedly high PA saturation. The oximetry run, choice of mixed venous sample and use of pulmonary flow decide the diagnosis and management.",
      presentation:
        "A 41-year-old woman has two years of progressive exertional breathlessness. Transthoracic echo: dilated RA and RV, normal LV, estimated PA systolic pressure 48 mmHg; no shunt seen on colour Doppler, but windows were poor. V/Q scan normal. She is referred for right heart catheterisation. BSA 1.70 m², Hb 13.5 g/dL.",
      findings: [
        "ECG: sinus rhythm, incomplete right bundle branch block.",
        "SpO₂ 97% on air at rest.",
        "NT-proBNP 240 ng/L.",
        "Lung function and high-resolution CT: normal.",
      ],
      steps: [
        {
          id: "s1",
          prompt: "What stands out, and what do you do next?",
          info:
            "Antecubital venous access. RA mean 7 mmHg; RV 48/8 mmHg; PA 48/18 mmHg (mean 30); wedge 11 mmHg; thermodilution CO 7.6 L/min; HR 78 bpm. PA saturation 84%, arterial saturation 97% (room air).",
          options: [
            {
              text: "A PA saturation of 84% with a high output is unexpected: perform a full oximetry run before leaving the right heart",
              best: true,
              feedback:
                "Correct. A mixed venous saturation this high with a high output suggests a left-to-right shunt. The run must be done now, while the catheter is in place.",
              next: "s2",
            },
            {
              text: "Calculate PVR from the thermodilution output (about 2.5 WU), classify as pre-capillary PH and refer for targeted therapy",
              feedback:
                "Thermodilution is unreliable in the presence of a shunt, and this approach misses a treatable diagnosis. Check the shunt first.",
              next: "s1-wrong-pah", stateDelta: {"stability": -15, "flags": ["mislabelled-pah"]} },
            {
              text: "Proceed to vasoreactivity testing with inhaled nitric oxide",
              feedback:
                "Vasoreactivity testing is for idiopathic, heritable or drug-associated PAH. A shunt has not been excluded.",
              next: "s2",
            },
            {
              text: "Finish the study and arrange a transoesophageal echo",
              acceptable: true,
              feedback:
                "TOE will be needed, but you lose the chance to quantify the shunt and localise it while the catheter is already in the heart.",
              next: "s2",
            },
          ],
        },
        {
          id: "s2",
          prompt: "How should the oximetry run be performed?",
          options: [
            {
              text: "Sample over 20 minutes while giving 4 L/min of oxygen for comfort",
              feedback:
                "A slow run is not at steady state, and supplemental oxygen raises dissolved oxygen and distorts the calculation.",
              next: "s3",
            },
            {
              text: "Sample only the IVC and PA",
              feedback:
                "Two samples cannot localise a step-up and give no SVC value for the Flamm formula.",
              next: "s3",
            },
            {
              text: "On room air at steady state, rapidly sample high and low SVC, IVC at the diaphragm, high, mid and low RA, RV, PA and a systemic arterial sample, with duplicates at key sites, analysed by co-oximetry",
              best: true,
              feedback:
                "Correct. A rapid, steady-state run with high and low SVC samples is needed to find where oxygenated blood enters.",
              next: "s3",
            },
          ],
        },
        {
          id: "s3",
          prompt: "Where is the step-up and what does it suggest?",
          info:
            "Saturations: high SVC (innominate junction) 70%; low SVC (SVC–RA junction) 85%; IVC 74%; high RA 85%; mid RA 84%; low RA 82%; RV 84%; PA 84%; aorta 97%.",
          options: [
            {
              text: "Step-up from the IVC to the RA: secundum ASD",
              feedback:
                "The high RA matches the low SVC; the saturation rise has already happened within the SVC. A secundum ASD would show a clean SVC with a step-up in the RA.",
              next: "s4",
            },
            {
              text: "Step-up between high and low SVC: anomalous pulmonary venous drainage into the SVC, typical of a superior sinus venosus defect",
              best: true,
              feedback:
                "Correct. Oxygenated blood enters before the RA, within the SVC. That localises anomalous pulmonary venous drainage, usually the right upper pulmonary vein with a superior sinus venosus defect.",
              next: "s4",
            },
            {
              text: "No significant step-up because RA, RV and PA saturations are the same",
              feedback:
                "They are uniform because the shunted blood has already mixed in. Compare with uncontaminated venous blood (high SVC, IVC), not with each other.",
              next: "s4",
            },
            {
              text: "Ventricular-level step-up: VSD",
              feedback: "RV saturation is no higher than RA saturation, so there is no ventricular-level step-up.",
              next: "s4",
            },
          ],
        },
        {
          id: "s4",
          prompt: "Which mixed venous saturation should you use, and what is Qp:Qs? (Assume pulmonary venous saturation 98%.)",
          options: [
            {
              text: "Use the uncontaminated high SVC in the Flamm formula: MVO₂ = (3 × 70 + 74) ÷ 4 ≈ 71%; Qp:Qs = (97 − 71) ÷ (98 − 84) ≈ 1.9",
              best: true,
              feedback:
                "Correct. The low SVC already contains pulmonary venous blood, so it cannot represent systemic venous return. Use the SVC above the anomalous entry.",
              next: "s5",
            },
            {
              text: "Use the low SVC: MVO₂ = (3 × 85 + 74) ÷ 4 ≈ 82%; Qp:Qs ≈ 1.1",
              feedback:
                "The low SVC is contaminated by the shunt. Using it hides most of the shunt and could lead you to dismiss a significant lesion.",
              next: "s5",
            },
            {
              text: "Use the PA saturation as mixed venous: Qp:Qs = 1.0",
              feedback:
                "PA blood is downstream of the shunt. Using it as mixed venous assumes there is no shunt.",
              next: "s4-pa-as-mixed", stateDelta: {"stability": -10} },
          ],
        },
        {
          id: "s5",
          prompt: "How do you calculate PVR, and what does it mean?",
          info:
            "Assumed VO₂ 125 mL/min/m² × 1.70 = 213 mL/min. Oxygen capacity 1.36 × 13.5 × 10 ≈ 184 mL/L. Qp = 213 ÷ (184 × 0.14) ≈ 8.3 L/min. Qs = 213 ÷ (184 × 0.26) ≈ 4.5 L/min.",
          options: [
            {
              text: "Use Qs: PVR = (30 − 11) ÷ 4.5 ≈ 4.3 WU, so repair is risky",
              feedback:
                "Systemic flow does not pass through the lungs in this shunt. Using it nearly doubles the apparent PVR and could wrongly deny repair.",
              next: "s6",
            },
            {
              text: "Use the thermodilution output: PVR = (30 − 11) ÷ 7.6 = 2.5 WU",
              feedback:
                "The number happens to be close, but thermodilution is unreliable with a shunt. Use Fick-derived Qp and report the method.",
              next: "s6",
            },
            {
              text: "Use Qp: PVR = (30 − 11) ÷ 8.3 ≈ 2.3 WU. The pulmonary hypertension is largely flow-driven and PVR is below 3 WU, so repair is appropriate",
              best: true,
              feedback:
                "Correct. In a left-to-right shunt the pulmonary bed carries Qp. With RV volume overload and PVR below 3 WU, the 2020 ESC ACHD guideline supports repair. Note that the absolute flows depend on an assumed VO₂; the Qp:Qs does not.",
              next: "s6",
            },
          ],
        },
        {
          id: "s6",
          prompt: "What is the next step?",
          options: [
            {
              text: "Start PAH-targeted therapy and repeat catheterisation in three months",
              feedback:
                "The pulmonary hypertension is largely flow-driven with a modest PVR. Targeted therapy does not treat the cause.",
            },
            {
              text: "CMR or CT to define the defect and every pulmonary vein, then ACHD multidisciplinary review for surgical repair (or transcatheter covered-stent repair in selected anatomy at an expert centre)",
              best: true,
              feedback:
                "Correct. Sinus venosus defects need anatomical definition of the anomalous veins. Surgery is the standard; covered-stent repair is an option in selected anatomy at experienced centres.",
            },
            {
              text: "Close the defect with a standard septal occluder",
              feedback:
                "Septal occluders are designed for secundum defects with adequate rims. A sinus venosus defect lies outside the fossa ovalis and the anomalous veins need redirection.",
            },
          ],
        },
        {
          "id": "s1-wrong-pah",
          "kind": "consequence",
          "info": "Before you leave the lab the nurse points out that a PA saturation of 84% with an output of 7.6 L/min is unusual for pulmonary arterial hypertension.",
          "prompt": "Do you revisit your conclusion?",
          "options": [
            {
              "text": "Yes: re-advance the catheter and perform a full oximetry run before labelling the patient",
              "best": true,
              "feedback": "A high PA saturation and high output suggest a left-to-right shunt that must be looked for before diagnosing PAH.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "No: the PVR is above 2 WU, which defines pre-capillary PH",
              "feedback": "A PVR from total output ignores the shunt; flow-driven PH has a different treatment.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Arrange a repeat study in three months on targeted therapy",
              "feedback": "Starting PAH therapy on a missed shunt delays the curative treatment.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
        {
          "id": "s4-pa-as-mixed",
          "kind": "consequence",
          "info": "Using the PA saturation as the mixed venous value gives a Qp:Qs of 1.0, which contradicts the obvious SVC step-up.",
          "prompt": "How do you reconcile this?",
          "options": [
            {
              "text": "Recognise that PA blood is downstream of the shunt; use the uncontaminated high SVC in the Flamm formula",
              "best": true,
              "feedback": "Mixed venous saturation must be sampled upstream of any left-to-right shunt.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Conclude that the step-up was a sampling error",
              "feedback": "A reproducible step-up with high output is real; the calculation, not the sample, is wrong.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Average all the right-sided saturations as the mixed venous value",
              "feedback": "Averaging contaminated samples still underestimates the shunt.",
              "stateDelta": {
                "stability": -8
              }
            }
          ]
        },
      ],
      outcome:
        "CMR confirmed a superior sinus venosus defect with the right upper and middle pulmonary veins draining to the SVC. She underwent surgical repair with redirection of the pulmonary veins. At one year her RV size had decreased and the estimated PA systolic pressure was 30 mmHg.",
      outcomeVariants: [
        {
          "flag": "mislabelled-pah",
          "text": "Labelling the patient as PAH before running the oximetry nearly committed her to lifelong targeted therapy for a surgically correctable shunt."
        }
      ],
      learningPoints: [
        "A high PA saturation or unexpectedly high output demands an oximetry run before the catheter is withdrawn.",
        "Always sample high and low SVC: a step-up within the SVC indicates anomalous pulmonary venous drainage.",
        "Mixed venous saturation must come from uncontaminated blood upstream of the shunt.",
        "Calculate PVR with pulmonary flow (Qp), not systemic flow or thermodilution.",
        "Transthoracic echo often misses sinus venosus defects; CMR or CT defines the anatomy.",
      ],
      refs: ["esc-achd-2020", "esc-ph-2022", "hanna-pcm", "flamm-mixed-venous-1969"],
    },
    {
      id: "hd-case-lflg-as",
      title: "Low-flow, low-gradient aortic stenosis: is it truly severe?",
      trackId: "haemodynamics",
      stage: 3,
      provenance: { kind: "synthetic", basedOn: "Classical low-flow low-gradient aortic stenosis with reduced ejection fraction" },
      summary:
        "A man with ischaemic cardiomyopathy has a small aortic valve area but a low gradient. Dobutamine echo is non-diagnostic. You perform an invasive dobutamine study.",
      presentation:
        "A 78-year-old man with ischaemic cardiomyopathy (previous anterior MI and LAD stent) has NYHA class III breathlessness. Transthoracic echo: LVEF 30%, calcified aortic valve with restricted opening, peak velocity 3.3 m/s, mean gradient 26 mmHg, AVA (continuity) 0.8 cm², stroke volume index 28 mL/m². Dobutamine stress echo was non-diagnostic because of poor windows and frequent ectopy. CT aortic valve calcium score is intermediate for a man. BSA 1.95 m².",
      findings: [
        "BP 112/66 mmHg, HR 78 bpm in sinus rhythm.",
        "NT-proBNP 3100 ng/L; creatinine 118 µmol/L.",
        "Recent coronary angiography: patent LAD stent, no new significant disease.",
      ],
      steps: [
        {
          id: "s1",
          prompt: "How should the invasive study be set up?",
          options: [
            {
              text: "Single pigtail pullback from LV to aorta at each stage",
              feedback:
                "Pullback gives peak-to-peak gradients from different beats, while heart rate and loading are changing. It cannot provide the mean gradient you need.",
              next: "s1-pullback-only", stateDelta: {"stability": -10} },
            {
              text: "LV pigtail compared with the femoral sheath side-arm",
              acceptable: true,
              feedback:
                "Workable if alternatives are not possible, but peripheral delay and amplification distort the mean gradient. Correct for the delay and interpret with caution.",
              next: "s2",
            },
            {
              text: "Right heart catheter for output, plus simultaneous LV and ascending aortic pressures (dual-lumen pigtail or two catheters), transducers matched in the aorta before crossing",
              best: true,
              feedback:
                "Correct. Each dobutamine stage needs a reliable output and a true mean gradient from simultaneous central pressures.",
              next: "s2",
            },
            {
              text: "Aortography to grade the stenosis",
              feedback: "Aortography grades regurgitation, not stenosis.",
              next: "s2",
            },
          ],
        },
        {
          id: "s2",
          prompt: "Calculate the baseline Gorlin aortic valve area.",
          info:
            "Baseline: HR 78 bpm; thermodilution CO 4.2 L/min (stroke volume 54 mL, index 28 mL/m²); mean gradient 24 mmHg; systolic ejection period 0.32 s/beat; LV 136/24 mmHg; aorta 110/62 mmHg.",
          options: [
            {
              text: "About 0.78 cm²",
              best: true,
              feedback:
                "Correct: 4200 ÷ (78 × 0.32 × 44.3 × √24) = 4200 ÷ (24.96 × 44.3 × 4.90) ≈ 4200 ÷ 5418 ≈ 0.78 cm². The area is small but the gradient is low: classical low-flow low-gradient physiology.",
              next: "s3",
            },
            {
              text: "About 1.10 cm²",
              feedback: "Recheck the calculation: the denominator is about 5418 and the output must be in mL/min (4200).",
              next: "s3",
            },
            {
              text: "About 0.45 cm²",
              feedback: "This is too small. Check that you used the square root of the gradient (4.9), not a larger value.",
              next: "s3",
            },
            {
              text: "About 0.91 cm² (using the mitral constant 37.7)",
              feedback: "The aortic Gorlin constant is 44.3. The mitral constant (37.7) applies to diastolic filling.",
              next: "s3",
            },
          ],
        },
        {
          id: "s3",
          prompt: "Which dobutamine protocol do you use?",
          options: [
            {
              text: "High-dose dobutamine up to 40 micrograms/kg/min with atropine, as for ischaemia testing",
              feedback:
                "Ischaemia-testing doses risk arrhythmia and hypotension in severe stenosis with a poor ventricle and are not needed to assess flow reserve.",
              next: "s3-high-dose-ischaemia", stateDelta: {"stability": -20} },
            {
              text: "An intravenous fluid bolus to increase flow",
              feedback: "Volume loading does not reliably increase stroke volume in a failing ventricle and risks pulmonary oedema.",
              next: "s4",
            },
            {
              text: "A sodium nitroprusside infusion",
              feedback: "Vasodilators lower afterload and can cause dangerous hypotension in fixed outflow obstruction. They do not test flow reserve.",
              next: "s4",
            },
            {
              text: "Low-dose dobutamine in stepwise increments (for example 5, 10, up to 20 micrograms/kg/min every few minutes) with output and simultaneous gradients at each stage; stop early for a mean gradient of 40 mmHg or more, marked tachycardia, arrhythmia, hypotension or symptoms",
              best: true,
              feedback:
                "Correct. The aim is to increase flow, not to provoke ischaemia. Low-dose increments with measurements at every stage show how gradient and area behave as flow rises.",
              next: "s4",
            },
          ],
        },
        {
          id: "s4",
          prompt: "How do you interpret the dobutamine response?",
          info:
            "At 20 micrograms/kg/min: HR 88 bpm; CO 5.9 L/min (stroke volume 67 mL, a 24% increase); mean gradient 44 mmHg; systolic ejection period 0.30 s/beat; LV 172/22 mmHg; aorta 128/64 mmHg; no arrhythmia. AVA = 5900 ÷ (88 × 0.30 × 44.3 × √44) ≈ 0.76 cm².",
          options: [
            {
              text: "Pseudo-severe stenosis, because the area stayed below 1.0 cm²",
              feedback:
                "Pseudo-severe stenosis is diagnosed when the area increases above 1.0 cm² with flow and the gradient remains low. The opposite happened here.",
              next: "s5",
            },
            {
              text: "Flow reserve is present (stroke volume +24%) and the mean gradient reached 44 mmHg with a fixed AVA of about 0.76 cm²: true severe aortic stenosis",
              best: true,
              feedback:
                "Correct. With adequate flow the gradient rose above 40 mmHg while the area stayed below 1.0 cm². The valve, not the ventricle, limits flow.",
              next: "s5",
            },
            {
              text: "No flow reserve: the result is indeterminate",
              feedback: "Stroke volume rose by 24%, above the 20% threshold for flow reserve.",
              next: "s5",
            },
            {
              text: "Severe stenosis cannot be diagnosed because the resting gradient was below 40 mmHg",
              feedback:
                "That is the whole point of the dobutamine study: at low flow the gradient underestimates severity.",
              next: "s5",
            },
          ],
        },
        {
          id: "s5",
          prompt: "What is the next step?",
          options: [
            {
              text: "Heart team discussion for aortic valve intervention, with transcatheter replacement likely to be favoured given his age and comorbidity",
              best: true,
              feedback:
                "Correct. True severe aortic stenosis with flow reserve in a patient with reduced ejection fraction is an indication for intervention, and LV function often improves afterwards.",
            },
            {
              text: "Medical therapy only, because the ejection fraction is 30%",
              feedback:
                "Reduced ejection fraction with flow reserve and true severe stenosis is not a reason to withhold intervention; it is a reason to intervene.",
            },
            {
              text: "Balloon aortic valvuloplasty as a bridge",
              acceptable: true,
              feedback:
                "Valvuloplasty is an option as a bridge in unstable or decompensated patients, or when candidacy is uncertain. He is stable, so definitive treatment is preferred.",
            },
          ],
        },
        {
          "id": "s1-pullback-only",
          "kind": "consequence",
          "info": "At each dobutamine stage the pullback gradient changes with heart rate and the catheter crossing the valve triggers ectopics, so the stage values are inconsistent.",
          "prompt": "The data are unreliable. How do you fix the set-up?",
          "options": [
            {
              "text": "Switch to simultaneous LV and ascending aortic pressures with a right heart catheter for output at every stage",
              "best": true,
              "feedback": "Simultaneous pressures and a measured output are needed to calculate valve area at each flow state.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Use the femoral sheath side-arm instead of the aorta",
              "acceptable": true,
              "feedback": "Peripheral amplification and delay distort the gradient; acceptable only with care.",
              "stateDelta": {
                "stability": -3
              }
            },
            {
              "text": "Report the highest gradient seen",
              "feedback": "A single peak value from an unstable recording does not classify the stenosis.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
        {
          "id": "s3-high-dose-ischaemia",
          "kind": "consequence",
          "info": "At 30 micrograms/kg/min with atropine: HR 132 bpm, BP 88/50 mmHg, 3 mm ST depression in V4–V6 and runs of non-sustained VT.",
          "prompt": "The ischaemic protocol has provoked ischaemia. What now?",
          "options": [
            {
              "text": "Stop the infusion, let the drug wear off, treat the arrhythmia and repeat later with a low-dose stepwise protocol",
              "best": true,
              "feedback": "Flow reserve testing uses low doses (up to 20 micrograms/kg/min); high-dose protocols are for ischaemia testing and are dangerous here.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Continue to 40 micrograms/kg/min to complete the protocol",
              "feedback": "Pushing on in severe AS with ischaemia and VT risks arrest.",
              "stateDelta": {
                "stability": -20
              }
            },
            {
              "text": "Give a beta-blocker bolus and continue at the same dose",
              "feedback": "Combining a beta-blocker with dobutamine defeats the test and adds hypotension.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
      ],
      outcome:
        "The heart team recommended transfemoral TAVI, which was uncomplicated. At three months he was in NYHA class II and his LVEF had improved to 38%.",
      learningPoints: [
        "In low-flow states, a low gradient does not exclude severe aortic stenosis.",
        "Invasive assessment needs simultaneous LV and central aortic pressures and a reliable output at each stage.",
        "Use low-dose dobutamine to increase flow; flow reserve means a stroke volume rise of at least 20%.",
        "True severe stenosis: gradient rises to 40 mmHg or more while AVA stays at or below 1.0 cm². Pseudo-severe: AVA rises above 1.0 cm².",
        "Without flow reserve, CT valve calcium scoring helps to decide.",
      ],
      refs: ["esc-vhd-2021", "gorlin-1951", "hanna-pcm"],
    },
  ],
};
