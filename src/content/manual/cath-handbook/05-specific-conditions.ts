// Module hb-specific-conditions: valves, pericardium, cardiomyopathy and pulmonary embolism
// (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 5 (aortic stenosis,
// aortic regurgitation, mitral stenosis, mitral regurgitation, pulmonary valve, tricuspid valve, pulmonary
// embolism, pulmonary angiography, constrictive pericarditis, pericardial tamponade, cardiomyopathy), with the
// chapter 4 sections it cross-refers to (accessing the left and right heart, waveforms, calculations,
// ventriculography, aortography), chapter 1 (coronary angiography during valve assessment), chapter 3 (venous
// access), chapter 8 (pressure wire cautions) and chapter 9 (balloon pump and microaxial pump
// contraindications); Brilakis, Manual of PCI, sections 1.5, 3.2, 3.6, 5.6, 6.6, 14.1, 14.4, 24.1 and 28.1,
// where valve disease and hypertrophic cardiomyopathy change a coronary procedure. Neither manual covers these
// subjects at length, so verified references fill specific gaps (cerebral embolism after crossing a stenotic
// valve, catheter criteria for constriction, the complications of pulmonary angiography, current ESC (2025 valve and pericardial,
// 2023 cardiomyopathy, 2019 pulmonary embolism) and AHA/ACC (2026 pulmonary embolism) guidance). Every claim is listed with its page or reference in docs/curriculum/evidence/hb-specific-conditions.md.
// Neighbouring modules: hb-cardiac-catheterisation (right and left heart technique, waveforms, cardiac output,
// shunts, ventriculography and aortography as procedures), hb-additional-procedures (balloon valvuloplasty,
// alcohol septal ablation, PFO and ASD closure), hb-tavi (TAVI work-up and procedure), hb-mitral-tricuspid-laa
// (transcatheter mitral and tricuspid repair), pm-support-choice (choosing mechanical support).
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OX = ["oxford-cath-handbook"];
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });

export const module: Module = {
  id: "hb-specific-conditions",
  title: "Valves, pericardium, cardiomyopathy and pulmonary embolism",
  stage: 3,
  summary:
    "How specific conditions change a catheter study: when to cross a stenotic aortic valve and how to do it safely, measuring aortic and mitral gradients and valve areas, grading regurgitation on angiography, the pulmonary and tricuspid valves on a right heart pullback, telling constriction from restriction and tamponade, demonstrating and provoking a dynamic outflow gradient in hypertrophic obstructive cardiomyopathy, and the catheter's limited but real role in pulmonary embolism, with the coronary-procedure hazards each condition brings.",
  objectives: [
    "Decide whether a stenotic aortic valve needs to be crossed, cross it with the Oxford technique when it does, measure the gradient by the most accurate method available, and explain why the Gorlin area misleads at low and high output.",
    "Record and calculate a mitral gradient and valve area from wedge and LV pressures, recognise the giant v wave of mitral regurgitation and its mimics, and grade regurgitation on a ventriculogram without being fooled by the catheter.",
    "Grade aortic regurgitation on an aortogram, measure pulmonary and tricuspid stenosis with the right catheters, and recognise tricuspid regurgitation on the right atrial trace.",
    "Set up a simultaneous LV and RV study, list the haemodynamic features of constriction, and separate constriction from restrictive cardiomyopathy and tamponade.",
    "Demonstrate and provoke a dynamic LV outflow gradient, use the beat after an ectopic to separate it from fixed aortic stenosis, and manage hypotension in obstructive physiology.",
    "Plan venous access, monitoring and contrast delivery for pulmonary angiography, know when it is contraindicated, and place it within current management of high-risk pulmonary embolism.",
    "Anticipate how severe valve disease and hypertrophic cardiomyopathy change coronary engagement, opacification, physiology and the choice of mechanical support.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-as",
      title: "Aortic stenosis in the lab: to cross or not, gradients and valve area",
      minutes: 16,
      topics: ["hd-aortic-stenosis"],
      sources: [
        O("ch 5: Aortic stenosis"),
        O("ch 5: TAVI work-up"),
        O("ch 4: Accessing the left heart"),
        O("ch 4: Calculations"),
        O("ch 4: Ventriculography"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 8: Pressure wire"),
        O("ch 9: Microaxial pump"),
        B("1.5"),
        B("5.6"),
        B("6.6"),
        B("14.4"),
        B("24.1"),
      ],
      refs: [...BOOKS, "omran-aortic-crossing-emboli-2003", "esc-vhd-2021", "esc-vhd-2025", "gorlin-1951"],
      blocks: [
        {
          kind: "p",
          text: "By the time a patient with aortic stenosis reaches the lab, echocardiography should already have given a mean and a peak gradient and an estimate of the valve area. The catheter study is therefore usually about the coronary arteries, and the haemodynamic question arises only when the non-invasive answer is unreliable. This lesson is about that decision, the technique when crossing is justified, and how each measurement can mislead. The basic gradient definitions, the Hakki shortcut and the dobutamine protocol are in the Academy lessons hd-valves-as-gradients and hd-valves-as-area; read them first.",
        },
        { kind: "h", text: "What you should know before the patient is on the table" },
        {
          kind: "table",
          caption: "Severity bands Oxford asks you to have from non-invasive testing before the study",
          head: ["Category", "Valve area (cm²)", "Peak gradient (mmHg)", "Mean gradient (mmHg)"],
          rows: [
            ["Mild", "Above 1.4", "Below 35", "Below 20"],
            ["Moderate", "1.0–1.4", "35–65", "20–40"],
            ["Severe", "Below 1.0", "Above 65", "Above 40"],
          ],
        },
        {
          kind: "p",
          text: "The 2025 ESC/EACTS valve guideline, unchanged from 2021 on this point, calls high-gradient stenosis severe at a valve area of 1.0 cm² or less (0.6 cm²/m² or less when indexed) with a mean gradient of 40 mmHg or more and a Doppler peak velocity of at least 4.0 m/s. Oxford's severe row and the guideline therefore differ only at the boundaries: Oxford writes below 1.0 cm² and above 40 mmHg. The peak figure in this table comes from the non-invasive study: a Doppler peak is an instantaneous value (hd-valves-as-gradients), not the peak-to-peak number a catheter pullback produces.",
        },
        {
          kind: "list",
          items: [
            "**Coronary angiography is the usual reason for the study.** Oxford explains that coronary disease is hard to diagnose non-invasively when valve disease is significant, so angiography is routinely considered in symptomatic patients being assessed for valve surgery. Its reasoning is that the small added risk of the angiogram is outweighed by the cost of missing severe coronary disease, and the result feeds the overall surgical risk assessment: adding bypass grafting to an aortic valve replacement in an older patient raises the operative risk considerably.",
            "**Oxford's practical guide for who needs it,** noting that practice varies between institutions: patients over 40 with one or more cardiac risk factors (such as diabetes, hypertension or a family history), asymptomatic patients in whom ischaemia is suspected, and those with LV systolic dysfunction. In endocarditis, angiography before surgery is reserved for patients with multiple risk factors or evidence of coronary embolisation.",
            "**CT is now an alternative.** The 2025 ESC/EACTS guideline recommends coronary CT angiography as an alternative to invasive angiography to rule out coronary disease in patients at low or moderate risk of obstructive disease, and in TAVI candidates advises considering leaving out the invasive study when the work-up CT is of good enough quality to exclude relevant disease. The coronary assessment before TAVI is taught in hb-tavi.",
            "**Check the notes before any attempt on the valve.** Oxford's first step when the aortic valve is hard to cross is to check in the notes that significant aortic stenosis has been excluded, before any of the usual crossing manoeuvres are tried.",
          ],
        },
        { kind: "h", text: "Deciding whether to cross" },
        {
          kind: "p",
          text: "Oxford is direct: diagnostic crossing of a severely stenotic valve is now rarely done, because the extra data seldom change management and the manoeuvre is hazardous. Echocardiography should be treated as the reference standard for most patients. The hazard has been measured. In a randomised study of 152 patients with valvular aortic stenosis, 101 had the valve crossed retrogradely and 51 did not; on diffusion-weighted MRI within 48 hours, 22 of the 101 (22%) had new focal lesions in an embolic pattern, and 3 of those 22 (3% of the crossed group) had a clinically apparent neurological deficit, so about 19% had lesions without symptoms. No patient without valve passage showed embolism, and neither did any of 32 controls without aortic stenosis who had coronary angiography and ventriculography. The authors concluded that crossing should be reserved for patients whose echo findings are unclear and in whom the extra information will change management, and that patients should be told of the risk.",
        },
        {
          kind: "steps",
          title: "When crossing is justified",
          items: [
            {
              title: "1. Name the question the gradient will answer",
              detail:
                "Cross only when the information is needed. Oxford gives two examples of that need: symptoms that do not match the non-invasive data, and the TAVI work-up when the haemodynamics are needed. The 2025 ESC/EACTS guideline advises against LV catheterisation unless there are symptoms and signs of severe stenosis and the non-invasive tests are inconclusive. If echo and symptoms agree, do not cross.",
            },
            {
              title: "2. Include the stroke risk in the consent",
              detail: "The randomised data above give a concrete figure: about one patient in five had a new embolic lesion on MRI, most without symptoms, and about one in thirty a clinical deficit.",
            },
            {
              title: "3. Plan the measurement before you cross",
              detail:
                "Decide in advance whether you will have a second arterial catheter or a dual-lumen catheter for simultaneous pressures (the most accurate method), so the valve is crossed once and the recording is done properly the first time.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 74-year-old man has exertional breathlessness. Transthoracic echo is of good quality and shows a valve area of 0.8 cm² and a mean gradient of 48 mmHg; his symptoms fit. He is referred for coronary angiography before valve surgery. The registrar suggests crossing the valve 'to confirm the gradient'. What is the best response?",
          options: [
            "Cross with a pigtail and a J wire, because the gradient must be confirmed invasively before surgery",
            "Do coronary angiography only: concordant echo and symptoms make crossing add risk without changing management",
            "Cross only if the femoral sheath gradient is below 40 mmHg, to exclude pseudo-severe stenosis",
            "Perform a left ventriculogram instead of crossing, to estimate the gradient from the contraction",
          ],
          answer: 1,
          explanation:
            "Oxford regards echocardiography as the gold standard for most patients and crossing as hazardous and rarely management-changing; the 2025 ESC/EACTS guideline advises against LV catheterisation unless symptoms and signs point to severe stenosis and non-invasive tests are inconclusive. Omran's randomised data showed new embolic lesions on MRI in 22% of crossed patients (clinically apparent in 3%). Here echo and symptoms agree, so only the coronary question remains. A femoral sheath cannot measure an LV-to-aorta gradient without an LV catheter, and critical aortic stenosis is one of Oxford's relative contraindications to ventriculography.",
        },
        { kind: "h", text: "Crossing the stenotic valve" },
        {
          kind: "steps",
          title: "Oxford's technique",
          items: [
            {
              title: "1. Aortogram if the orifice is hard to find",
              detail:
                "An aortogram can help identify where the leaflets open. Oxford calls this landmark the 'Prussian helmet sign' (its Fig 5.2) and uses it as a visual target for the wire.",
            },
            {
              title: "2. Catheter and wire",
              detail: "Take a 5 F AL1 and a hydrophilic wire with a straight tip. The catheter tip points the wire at the orifice; the wire does the crossing.",
            },
            {
              title: "3. Controlled wire movement",
              detail:
                "Oxford stresses great care and controlled manipulation of the wire. Omran's data show that passing the valve itself carries the embolic risk: lesions appeared only in patients whose valve was crossed.",
            },
            {
              title: "4. Follow with the catheter, then exchange",
              detail:
                "Once the wire is across, advance the AL1 into the ventricle, remove the wire and confirm an LV trace. Then pass an exchange-length J wire and swap the AL1 for a pigtail, which sits safely in the cavity for pressure recording.",
            },
          ],
        },
        { kind: "tip", id: "haemo-as-cross-only-if-discordant" },
        { kind: "tip", id: "haemo-as-al1-straight-wire" },
        {
          kind: "p",
          text: "**When the valve is not severely stenotic but still hard to cross,** Oxford's general sequence applies: reintroduce the wire to stiffen the catheter, then use the wire itself to cross with the catheter tip setting the angle, change to a Judkins right 4 or Amplatz left catheter to help direct the wire, and try a straight or hydrophilic wire; once across, advance the catheter, remove the wire and exchange over a long wire for a pigtail if a ventriculogram is planned. Brilakis meets the same problem when placing a microaxial pump: a pigtail may not advance through a stenotic valve, a 0.035 in. J wire inside it can stiffen it enough, and balloon dilation of the valve may be needed.",
        },
        { kind: "h", text: "Measuring the gradient" },
        {
          kind: "table",
          caption: "Methods Oxford describes",
          head: ["Method", "What it gives", "Why it falls short"],
          rows: [
            [
              "Simultaneous LV and aortic pressures (two catheters, or a dual-lumen catheter in the LV)",
              "The true pressure difference throughout systole; the mean gradient is the shaded area between the curves",
              "Needs a second arterial catheter or a special catheter; the most accurate method",
            ],
            [
              "LV catheter with femoral arterial pressure",
              "An approximation",
              "Oxford calls it less accurate; the Academy lesson hd-valves-as-gradients explains why (a peripheral trace is delayed and amplified)",
            ],
            [
              "LV-to-aorta pullback, peak-to-peak",
              "The difference between the LV peak and the aortic peak on successive recordings",
              "The two peaks do not occur at the same moment, and the catheter itself interferes with leaflet opening and closure",
            ],
          ],
        },
        {
          kind: "p",
          text: "In practice the pullback is how most gradients are obtained, so know its weaknesses. In Oxford's figure the peak-to-peak arrow joins two peaks separated in time, whereas the mean gradient is the whole area between simultaneous curves. A pullback gradient is a reasonable screening number; a mean gradient from simultaneous traces is the number to compare with Doppler. Oxford also ends every left ventriculogram with a pullback from LV to aorta on pressure, which gives an estimate of any outflow gradient: that is the moment to notice a gradient nobody expected.",
        },
        {
          kind: "p",
          text: "**Check the recording system before you trust a gradient.** Oxford reminds you that a fluid-filled catheter carries the pressure a long way to the transducer, which delays the signal and damps it a little. It names three artefacts as well: the end-pressure artefact from a high-velocity jet striking the catheter tip, the catheter impact artefact when the tip hits a wall or a valve, and catheter whip as the catheter moves in the chamber. Any of these can distort a transvalvular gradient, so flush the system and look at the shape of each trace before you take a number from it.",
        },
        { kind: "tip", id: "haemo-as-simultaneous-gradient" },
        { kind: "tip", id: "haemo-as-slow-rise-not-damping" },
        { kind: "h", text: "Valve area: the Gorlin formula and why it fell out of use" },
        {
          kind: "formula",
          name: "Gorlin aortic valve area",
          expr: "AVA (cm²) = CO (mL/min) ÷ [44.3 × systolic ejection period (s/beat) × HR (beats/min) × √(mean gradient, mmHg)]",
          note: "Oxford lists the inputs as cardiac output, mean gradient and systolic ejection time. CO must be in mL/min for the constant 44.3 to give cm².",
        },
        {
          kind: "table",
          caption: "Worked example",
          head: ["Input", "Value"],
          rows: [
            ["Cardiac output", "4.2 L/min = 4200 mL/min"],
            ["Heart rate", "75 beats/min"],
            ["Systolic ejection period", "0.32 s/beat"],
            ["Mean gradient", "49 mmHg (square root 7)"],
            ["Denominator", "44.3 × 0.32 × 75 × 7 ≈ 7442"],
            ["AVA", "4200 ÷ 7442 ≈ 0.56 cm²: severe"],
          ],
        },
        {
          kind: "p",
          text: "**The flow problem.** Oxford explains that the result hinges on how much blood is moving forward across the valve: with a high output the calculated area comes out too large, and with a low output too small. That second error is the trap in a patient with a poor ventricle, where a small calculated area can reflect a valve that a weak ventricle cannot open fully rather than a fixed severe stenosis. This flow dependence, the inaccuracy of invasive output measurement and other practical limitations are why Oxford describes the Gorlin calculation as having disappeared from routine practice.",
        },
        {
          kind: "check",
          stem: "A man with an LVEF of 25% has a cardiac output of 2.6 L/min. The mean gradient is 22 mmHg and the Gorlin area 0.7 cm². Which statement best reflects Oxford's teaching on the formula?",
          options: [
            "The area is reliable because the square root of the gradient cancels out the effect of flow",
            "The area may be falsely small, because the formula underestimates valve area at low cardiac output",
            "The area is falsely large, because the formula overestimates valve area whenever the gradient is low",
            "The area is reliable as long as the systolic ejection period was measured on a simultaneous trace",
          ],
          answer: 1,
          explanation:
            "Oxford states the Gorlin formula depends on forward flow, overestimating the area at high output and underestimating it at low output. With an output of 2.6 L/min and a weak ventricle, the small area may reflect a valve that is not being opened fully, so this is the low-flow low-gradient situation in which the stenosis has to be tested at higher flow (hd-valves-as-area). The square root dampens gradient errors but does not remove flow dependence, and measuring the ejection period precisely does not fix it either.",
        },
        { kind: "h", text: "Low-flow low-gradient stenosis: the decision sequence" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Recognise the pattern",
              detail:
                "A valve area of 1.0 cm² or less with a mean gradient below 40 mmHg is discordant. The 2025 ESC/EACTS guideline (unchanged from 2021 here) calls flow low when the stroke volume index is 35 mL/m² or less, and separates low-flow low-gradient stenosis with a reduced ejection fraction (LVEF below 50%) from the form with a preserved ejection fraction (50% or more).",
            },
            {
              title: "2. Test the valve at higher flow, non-invasively first",
              detail:
                "With a reduced ejection fraction the guideline uses low-dose dobutamine stress echocardiography to tell true severe from pseudo-severe stenosis, and defines flow reserve as a rise in stroke volume of at least 20%. The Academy lesson hd-valves-as-area adds an invasive dobutamine study as an alternative when echo is non-diagnostic, and gives the protocol and how to read the response.",
            },
            {
              title: "3. Add CT calcium scoring of the valve",
              detail:
                "The guideline treats CT calcium scoring of the valve as important supporting information in low-flow low-gradient stenosis whatever the ejection fraction, complementary to dobutamine echo when it is reduced; with a preserved ejection fraction it asks for careful confirmation that the stenosis is severe before intervention. Scores above 2000 Agatston units in men or 1200 in women indicate severe stenosis, the higher thresholds of 3000 and 1600 are very specific, and below 1600 in men or 800 in women severe stenosis becomes unlikely. The guideline asks for caution where severe stenosis can occur without much calcium, such as a bicuspid valve, amyloidosis or fibrotic stenosis, so a low score does not rule it out there.",
            },
            {
              title: "4. In the lab, report the conditions",
              detail:
                "If you do measure, write down output, heart rate, ejection period, mean gradient and area together, because Oxford's warning about flow dependence means the area is only interpretable alongside the flow that produced it.",
            },
          ],
        },
        { kind: "h", text: "How severe aortic stenosis changes the coronary procedure" },
        {
          kind: "table",
          head: ["Step", "What changes", "Source"],
          rows: [
            ["Planning engagement", "Aortic stenosis or regurgitation may come with a dilated ascending aorta, which can need larger catheter curves", "Brilakis 1.5"],
            ["Pressure trace", "A slow, low aortic pulse (parvus et tardus) can look damped when it is not; side-hole catheters can hide true damping", "Brilakis 5.6"],
            ["Opacification", "High coronary flow can defeat a small catheter: use a larger lumen without side holes and a firmer injection, and call the run non-diagnostic if it still will not fill", "Brilakis 6.6"],
            ["Ventriculography", "Critical aortic stenosis is a relative contraindication", "Oxford ch 4"],
            ["Physiology", "Oxford lists aortic stenosis among the settings with limited FFR validation; Brilakis notes FFR falls significantly after TAVI as hyperaemic flow rises while iFR does not change, so FFR may underestimate a stenosis while the valve is still tight", "Oxford ch 8; Brilakis 24.1"],
            ["Support devices", "Oxford lists severe aortic stenosis as a contraindication to the microaxial pump and significant aortic stenosis as a contraindication to the balloon pump", "Oxford ch 9"],
          ],
        },
        { kind: "tip", id: "diag-as-high-flow-fill" },
        {
          kind: "pitfalls",
          items: [
            "Crossing a severely stenotic valve when echo and symptoms already agree: Omran found new embolic brain lesions in 22% of patients after crossing.",
            "Uncontrolled wire manipulation at a calcified valve instead of Oxford's planned, controlled approach with an AL1 and a straight hydrophilic wire.",
            "Reporting a pullback peak-to-peak gradient as if it were the Doppler peak gradient: one compares peaks at different moments, the other is instantaneous.",
            "Trusting a Gorlin area at low output without recognising that the formula underestimates area when flow is low.",
            "Mistaking the slow aortic upstroke of severe stenosis for a damped catheter, or a high-flow streaming artery for disease.",
            "Performing a left ventriculogram in critical aortic stenosis.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the question on the whiteboard before you open the AL1: 'What will the invasive gradient change?' If nobody can answer, the patient keeps an intact brain and you go straight to the coronary injections.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open the 'Exertional syncope with an ejection systolic murmur' scenario. Before recording anything, state why invasive assessment is justified here (poor echo images, discordant Doppler). Record simultaneous LV and aortic pressures, measure the mean gradient and the peak-to-peak difference, and calculate the Gorlin area from the output, heart rate and ejection period shown.",
        },
        { kind: "video", id: "7l5kBea_XIk", note: "Elias Hanna on technical tips for the haemodynamic assessment of aortic stenosis." },
        { kind: "video", id: "y-JO26kM4CI", note: "Elias Hanna on the haemodynamics of low-gradient aortic stenosis with a normal ejection fraction." },
        { kind: "video", id: "VMePFUh9P4U", note: "Elias Hanna on valve area equations and the pitfalls of guideline cut-offs for aortic and mitral stenosis." },
        {
          kind: "keypoints",
          items: [
            "Echo should already have graded the stenosis; the study is usually for the coronary arteries.",
            "Cross a severely stenotic valve only when the information is needed, for example discordant symptoms and imaging or a TAVI work-up that needs it: crossing was followed by new embolic brain lesions in 22% and clinical deficits in 3% in a randomised study.",
            "Oxford's crossing kit: 5 F AL1, straight hydrophilic wire moved with control, then an exchange-length J wire to swap for a pigtail; an aortogram's Prussian helmet sign shows the orifice.",
            "Simultaneous LV and aortic pressures give the true mean gradient; femoral pressure is less accurate and pullback peak-to-peak compares peaks at different times.",
            "The Gorlin area overestimates at high output and underestimates at low output, so a small area in a weak ventricle needs testing at higher flow.",
            "Severe stenosis brings a dilated root, a parvus et tardus trace, high-flow streaming, unreliable FFR and contraindications to ventriculography and some support devices.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-mitral",
      title: "Mitral stenosis and mitral regurgitation: wedge, LV and the ventriculogram",
      minutes: 14,
      topics: ["hd-mitral"],
      sources: [
        O("ch 5: Mitral stenosis"),
        O("ch 5: Mitral regurgitation"),
        O("ch 4: Cardiac catheterization"),
        O("ch 4: Left heart pressures and waveforms"),
        O("ch 4: Right heart pressures and waveforms"),
        O("ch 4: Calculations"),
        O("ch 4: Ventriculography"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 9: Intra-aortic balloon pump"),
        B("28.1"),
      ],
      refs: [...BOOKS, "esc-vhd-2021", "esc-vhd-2025", "gorlin-1951"],
      blocks: [
        {
          kind: "p",
          text: "Mitral disease is the classic indication for a simultaneous left and right heart study: the gradient across the mitral valve is the difference between left atrial and LV pressure in diastole, and the wedge pressure stands in for the atrium. In regurgitation the same wedge trace shows the leak as a large v wave, and the ventriculogram shows it as contrast filling the atrium. Each of these is easy to misread, so this lesson works through the set-up and the traps. The wedge time-shift and Sellers grading are in hd-valves-mitral.",
        },
        { kind: "h", text: "Mitral stenosis: setting up the study" },
        {
          kind: "steps",
          title: "Oxford's sequence",
          items: [
            {
              title: "1. Right heart catheter to the main pulmonary artery",
              detail: "Use a catheter such as an MPA2 or a balloon flotation catheter and record the PA systolic pressure, the first measurement in Oxford's list for this study.",
            },
            {
              title: "2. Advance to the wedge position",
              detail:
                "The wedge pressure is your surrogate for left atrial pressure. Oxford's right heart section advises advancing as the patient breathes in until gentle resistance is felt.",
            },
            {
              title: "3. Pigtail in the body of the LV",
              detail: "Record LV pressure and the LVEDP. Oxford gives normal LVEDP as 3–12 mmHg.",
            },
            {
              title: "4. Record both together and measure the area between them",
              detail:
                "The mean mitral gradient is the area enclosed between the wedge curve and the LV diastolic curve. In Oxford's illustration the wedge stays well above LV pressure through diastole, the shaded area being the gradient.",
            },
            {
              title: "5. Average enough beats",
              detail: "Heart rate changes the mean gradient, particularly in atrial fibrillation, so Oxford asks for an average of at least 10 beats.",
            },
            {
              title: "6. Consider a ventriculogram at the end",
              detail:
                "Oxford mentions occasional left ventriculography after the pressures to look at calcification of the valve, leaflet movement and the degree of regurgitation. Coronary angiography is usually added if surgery is being considered.",
            },
          ],
        },
        {
          kind: "p",
          text: "**The wedge is not the atrium.** Oxford notes that in mitral stenosis the wedge probably reads 2–3 mmHg higher than the true left atrial pressure, so a gradient from wedge and LV traces tends to read high. The Academy lesson hd-valves-mitral describes the time delay of the wedge trace and the correction for it, and the transseptal measurement that avoids the problem.",
        },
        { kind: "tip", id: "haemo-ms-wedge-lv-ten-beats" },
        {
          kind: "table",
          caption: "Oxford's severity bands for mitral stenosis",
          head: ["Category", "Valve area (cm²)", "Mean gradient (mmHg)"],
          rows: [
            ["Normal", "4–6", "Not applicable"],
            ["Mild", "Above 1.5", "Below 5"],
            ["Moderate", "1.0–1.5", "Variable"],
            ["Severe", "Below 1.0", "Above 10"],
          ],
        },
        {
          kind: "p",
          text: "The ESC/EACTS guideline uses a different line. The 2025 edition, keeping the 2021 threshold, manages rheumatic mitral stenosis as clinically severe once the valve area is 1.5 cm² or less (the 2021 edition called the same range clinically significant), which takes in Oxford's whole moderate band. When you read a referral, check which scale the writer is using. The moderate row's mean gradient is listed as variable, a reminder that the gradient depends on heart rate (Oxford) and should be read together with the area.",
        },
        {
          kind: "formula",
          name: "Gorlin mitral valve area",
          expr: "MVA (cm²) = CO (mL/min) ÷ [37.7 × diastolic filling period (s/beat) × HR (beats/min) × √(mean gradient, mmHg)]",
          note: "Same structure as the aortic formula, with the diastolic filling period and the constant 37.7. Oxford calls it error-prone and now rarely used.",
        },
        {
          kind: "table",
          caption: "Worked example",
          head: ["Input", "Value"],
          rows: [
            ["Cardiac output", "4.0 L/min = 4000 mL/min"],
            ["Heart rate", "70 beats/min"],
            ["Diastolic filling period", "0.45 s/beat"],
            ["Mean gradient", "12 mmHg (square root ≈ 3.46)"],
            ["Denominator", "37.7 × 0.45 × 70 × 3.46 ≈ 4109"],
            ["MVA", "4000 ÷ 4109 ≈ 0.97 cm²: severe on Oxford's scale"],
          ],
        },
        {
          kind: "check",
          stem: "In a patient with mitral stenosis and atrial fibrillation at 110 beats/min, the fellow measures a mean gradient of 16 mmHg from a single long cycle. What is the main problem?",
          options: [
            "Nothing: one clean cycle is enough if both traces are on matched transducers",
            "The mean gradient varies with heart rate in AF, so at least 10 beats should be averaged",
            "The mitral gradient should be measured from LV and aortic pressures, not the wedge",
            "The gradient should be taken from the peak of the v wave to the LVEDP only",
          ],
          answer: 1,
          explanation:
            "Oxford stresses that mean mitral gradients depend on heart rate, especially in AF, and asks for an average of at least 10 beats. A single long cycle gives more filling time and a lower, unrepresentative gradient, while a short cycle overstates it. Aortic pressure has nothing to do with the mitral gradient, which is the diastolic area between the wedge (left atrial surrogate) and LV curves, not a single point-to-point difference.",
        },
        { kind: "h", text: "Mitral regurgitation: the v wave" },
        {
          kind: "p",
          text: "In regurgitation the right heart catheter shows large v waves on the wedge trace. Oxford describes them as LV pressure transmitted back through the leaking valve; they peak as the LV pressure is falling at the end of systole. In the normal left atrial trace, by contrast, the v wave is only slightly taller than the a wave.",
        },
        {
          kind: "list",
          items: [
            "**Not specific.** Other conditions that raise left atrial pressure can also produce large v waves; Oxford names a ventricular septal defect and infiltrative myocardial disease as examples.",
            "**Confirm the leak another way:** echo, the ventriculogram, or oximetry when a septal defect is possible.",
          ],
        },
        { kind: "tip", id: "haemo-v-wave-not-specific" },
        { kind: "h", text: "Grading regurgitation on the ventriculogram" },
        {
          kind: "table",
          caption: "Oxford's grades, judged by how the left atrium fills compared with the LV",
          head: ["Grade", "Left atrial opacification"],
          rows: [
            ["I", "Minimal; clears quickly with every beat"],
            ["II", "Moderate; clears over the following beats"],
            ["III", "Intense; reaches the density of the LV"],
            ["IV", "Intense and denser than the LV, often persisting over the following beats"],
          ],
        },
        {
          kind: "steps",
          title: "Getting a gradable ventriculogram",
          items: [
            {
              title: "1. Check it is safe",
              detail:
                "Oxford's relative contraindications include an LVEDP above 35 mmHg and pulmonary oedema. With impaired function or an LVEDP above 25 mmHg, reduce the injection, for example to 30 mL at 10 mL/s. Its pressure section adds that pulmonary oedema becomes likely once the LVEDP is above 30 mmHg, and that a high LVEDP calls for as little contrast as possible and no ventriculogram.",
            },
            {
              title: "2. Position the pigtail",
              detail: "Mid-cavity, away from the mitral apparatus and where it provokes the fewest ectopics.",
            },
            {
              title: "3. Inject",
              detail: "Oxford's usual run is 30–35 mL delivered at 10–15 mL/s. A rise time of 0.1–0.5 s can limit catheter whip.",
            },
            {
              title: "4. View",
              detail:
                "Judge regurgitation in 30° RAO, panning over to include the left atrium; LAO 60° with 20° cranial angulation is an alternative.",
            },
            {
              title: "5. Grade on clean beats",
              detail:
                "Discard ectopic beats and make sure the pigtail is not pushing against the mitral apparatus: both create regurgitation that is not really there. A brief run of ectopics as the injection starts is common, so keep acquiring until you have recorded a satisfactory cycle free of ectopy. The run may also show the cause, such as a flail leaflet or annular calcification.",
            },
          ],
        },
        { kind: "tip", id: "diag-lvgram-catheter-induced-mr" },
        {
          kind: "check",
          stem: "During a ventriculogram the left atrium opacifies densely, but the first three beats are a run of ventricular ectopics and the pigtail tip is seen flicking against the posterior wall near the valve. What should you report?",
          options: [
            "Grade IV regurgitation, because the atrium became denser than the ventricle",
            "That the run cannot be graded: reposition the catheter and judge clean sinus beats",
            "Grade II regurgitation, because ectopic beats always halve the true severity",
            "No regurgitation, because ectopic regurgitation proves the valve is normal",
          ],
          answer: 1,
          explanation:
            "Oxford warns that regurgitation produced by the catheter pushing on the mitral apparatus, or by ventricular ectopics, must not be reported as real. Here both confounders are present, so the grade is unknown, not severe, not mild and not absent. Reposition to the mid-cavity, repeat if needed, and grade only sinus beats, or rely on echo.",
        },
        { kind: "h", text: "Mitral disease and the rest of the case" },
        {
          kind: "list",
          items: [
            "**Coronary disease may be the cause.** Oxford points out that undiagnosed coronary disease can be the mechanism behind mitral regurgitation, one reason coronary angiography is considered before valve surgery.",
            "**Acute regurgitation is poorly tolerated.** Brilakis lists acute mitral regurgitation among the valve causes of hypotension during a procedure: vasodilators may help but it often needs urgent surgery, and a balloon pump can improve the haemodynamics in the meantime. Oxford lists severe mitral regurgitation with cardiac failure among the balloon pump indications.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Taking the wedge as exact left atrial pressure: in mitral stenosis it probably reads 2–3 mmHg high.",
            "Measuring the mean gradient in AF over fewer than 10 beats.",
            "Calling a large v wave proof of mitral regurgitation when a VSD or infiltrative disease can do the same.",
            "Grading regurgitation from ectopic beats or with the pigtail on the valve apparatus.",
            "Injecting a full ventriculogram into a patient with an LVEDP above 35 mmHg or pulmonary oedema.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the ventriculogram, look at the LVEDP you have just recorded. It decides whether you inject 30–35 mL, a reduced 30 mL at 10 mL/s, or nothing at all.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In 'Breathlessness and palpitations, previous rheumatic fever', record the PA and wedge pressures, place the LV catheter, display LV and wedge simultaneously, and measure the mean mitral gradient over several beats. Calculate the valve area with the Gorlin mitral formula and say which of Oxford's bands it falls in. Then open 'Flash pulmonary oedema after an inferolateral infarct' and identify the v wave on the wedge trace.",
        },
        { kind: "video", id: "1_8lFiWvrPc", note: "Elias Hanna on valve area calculation and the haemodynamics of mitral stenosis and regurgitation." },
        { kind: "video", id: "VMePFUh9P4U", note: "Elias Hanna on valve area equations and guideline cut-offs for aortic and mitral stenosis." },
        { kind: "video", id: "UYH8XJaH9k8", note: "Elias Hanna's valve haemodynamics case studies." },
        {
          kind: "keypoints",
          items: [
            "Mitral stenosis study: right heart catheter to the PA for PA systolic pressure, wedge as the left atrial surrogate, pigtail in the LV, simultaneous traces.",
            "The mean gradient is the diastolic area between wedge and LV curves; average at least 10 beats in AF.",
            "In mitral stenosis the wedge probably reads 2–3 mmHg above true left atrial pressure.",
            "Oxford's severe stenosis: area below 1.0 cm², mean gradient above 10 mmHg; the 2025 ESC/EACTS guideline, like 2021, treats rheumatic stenosis of 1.5 cm² or less as clinically severe.",
            "Gorlin mitral formula: constant 37.7 and the diastolic filling period; error-prone and rarely used.",
            "Large v waves are transmitted LV pressure in regurgitation but also occur with a VSD or infiltrative disease.",
            "Grade regurgitation I–IV by left atrial density against the LV, never on ectopic beats or with the catheter on the valve.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-ar-right",
      title: "Aortic regurgitation, and the pulmonary and tricuspid valves",
      minutes: 12,
      topics: ["hd-ar-right-valves"],
      sources: [
        O("ch 5: Aortic regurgitation"),
        O("ch 5: Pulmonary valve"),
        O("ch 5: Tricuspid valve"),
        O("ch 4: Aortography"),
        O("ch 4: Accessing the right heart"),
        O("ch 4: Right heart pressures and waveforms"),
        O("ch 4: Ventriculography"),
        O("ch 9: Intra-aortic balloon pump"),
        O("ch 9: Microaxial pump"),
        B("1.5"),
        B("14.1"),
        B("28.1"),
      ],
      refs: [...BOOKS, "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "These lesions share one thing in the lab: the catheter answers a narrow question that echo usually answers first. Aortic regurgitation is graded by watching the LV fill on an aortogram; pulmonary stenosis is measured by pulling a catheter back across the valve; tricuspid stenosis needs two catheters because a tiny gradient matters; tricuspid regurgitation shows itself on the right atrial trace. The chronic and acute pressure patterns of aortic regurgitation and the pullback patterns that localise right-sided obstruction are in hd-valves-ar-ps.",
        },
        { kind: "h", text: "Aortic regurgitation on the aortogram" },
        {
          kind: "steps",
          title: "Oxford's aortogram",
          items: [
            {
              title: "1. Catheter",
              detail: "A pigtail with side holes, taken over a wire under screening to the proximal ascending aorta.",
            },
            {
              title: "2. Keep off the leaflets",
              detail: "Check that the pigtail does not interfere with the valve opening or closing; a catheter that holds a leaflet open creates regurgitation.",
            },
            {
              title: "3. Prepare and connect",
              detail: "Remove the wire, aspirate the catheter and connect the pressure injector.",
            },
            {
              title: "4. Acquire",
              detail: "During a breath-hold, inject 40–60 mL of contrast at 20 mL/s in an LAO projection.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Grading by how densely the LV fills compared with the aorta",
          head: ["Grade", "Left ventricular opacification"],
          rows: [
            ["I", "Minimal regurgitation that clears quickly with each beat"],
            ["II", "LV less dense than the aorta"],
            ["III", "LV becoming as dense as the aorta"],
            ["IV", "LV intensely opacified, denser than the aorta, often persisting over later beats"],
          ],
        },
        {
          kind: "p",
          text: "**A slip in the handbook.** Oxford's printed grade III reads 'becoming equal to the left ventricle', which compares the ventricle with itself. Its own grades II and IV are defined against the aorta, so grade III must mean LV density equal to the aorta, as in the table above. Both grading scales in the handbook also carry the same caveat: the appearance depends on the regurgitant volume and on the function of the ventricle, so a large, poorly contracting LV can make a leak look different from the same leak into a small, vigorous one.",
        },
        { kind: "tip", id: "diag-aortogram-ar-grading" },
        {
          kind: "check",
          stem: "On an aortogram the LV fills progressively over three beats and reaches the same density as the ascending aorta, without exceeding it. The pigtail sits 2 cm above the valve. What grade is this?",
          options: ["Grade I", "Grade II", "Grade III", "Grade IV"],
          answer: 2,
          explanation:
            "LV density equal to the aorta is grade III (reading Oxford's grade III against the aorta, as its grades II and IV are). Grade II is an LV less dense than the aorta; grade IV is an LV denser than the aorta, often persisting. A pigtail well above the valve makes catheter-induced regurgitation unlikely.",
        },
        { kind: "h", text: "Aortic regurgitation and the coronary procedure" },
        {
          kind: "list",
          items: [
            "**Dilated root.** Brilakis flags aortic stenosis or regurgitation at the planning stage because a dilated ascending aorta may need larger catheter curves to engage the coronaries.",
            "**The catheter can cause it.** Amplatz guides, and deeply curved extra back-up guides, can lever a cusp open, and the sudden leak drops the blood pressure; Brilakis notes that simply repositioning the guide corrects it at once.",
            "**Acute regurgitation is poorly tolerated** and often needs urgent or emergency surgery (Brilakis 28.1).",
            "**It rules out support devices.** Brilakis lists severe aortic regurgitation as a contraindication to the microaxial pump, the balloon pump and VA-ECMO. Oxford lists significant regurgitation against the balloon pump and moderate to severe regurgitation against the microaxial pump.",
          ],
        },
        { kind: "tip", id: "diag-hypo-amplatz-valve" },
        { kind: "h", text: "Pulmonary stenosis and regurgitation" },
        {
          kind: "steps",
          title: "Measuring pulmonary stenosis",
          items: [
            {
              title: "1. Cross into the main PA",
              detail:
                "From the RV, ease the catheter off the apex, turn the tip upwards and advance into the PA (Oxford's right heart technique); a guide wire or a deep breath can help.",
            },
            {
              title: "2. Pull back with continuous pressure recording",
              detail:
                "Withdraw slowly from the PA into the RV while recording. The systolic pressure step marks the stenosis. Oxford's table gives RV systolic 20–25 mmHg and PA systolic 20–25 mmHg (PA diastolic 4–8 mmHg); the Academy's reference ranges in hd-waveforms are wider, with RV systolic 15–30 mmHg and an RV end-diastolic pressure of 2–8 mmHg. What matters here is the systolic step between PA and RV.",
            },
            {
              title: "3. Confirm which chamber you are in",
              detail:
                "Name the chamber from the shape of its diastolic trace as well as its systolic level: hd-valves-ar-ps shows how an intermediate chamber with an arterial systolic level but a ventricular diastolic contour identifies subvalvar obstruction.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Pulmonary regurgitation** is assessed with a pulmonary angiogram (the technique is in the pulmonary angiography lesson of this module), which also shows whether the PA is dilated. Oxford's example is a patient with complex congenital heart disease.",
        },
        { kind: "tip", id: "haemo-ps-continuous-pullback" },
        { kind: "h", text: "Tricuspid stenosis" },
        {
          kind: "list",
          items: [
            "**Rare, and rarely alone:** it usually accompanies mitral valve disease, and the catheter is seldom the only test used to diagnose it.",
            "**Small numbers matter:** a gradient as small as 5 mmHg can cause significant symptoms.",
            "**So measure simultaneously:** record with a matched pair of catheters, RA and RV at the same time, rather than a single pullback, whose beat-to-beat variation could swamp a 5 mmHg difference.",
            "**The atrial trace:** Oxford describes prominent a waves with a muted y descent, the atrium pushing against an obstructed valve and emptying slowly.",
          ],
        },
        { kind: "tip", id: "haemo-ts-two-matched-catheters" },
        { kind: "h", text: "Tricuspid regurgitation" },
        {
          kind: "p",
          text: "Blood forced back into the right atrium in systole produces large v waves on the right atrial trace. Oxford's waveform description adds large c waves and loss of the x descent. Normally the right atrial v wave is a little lower than the a wave, so a v wave towering over it stands out. Note also that atrial fibrillation removes the a wave altogether, and that complete heart block or a junctional rhythm produces cannon a waves as the atrium contracts against a closed tricuspid valve, so read the rhythm before you read the waves. Right ventriculography, not commonly done, is one of the ways Oxford lists for assessing tricuspid regurgitation.",
        },
        { kind: "tip", id: "haemo-tr-ra-v-wave" },
        {
          kind: "check",
          stem: "A right atrial trace in sinus rhythm with 1:1 atrioventricular conduction shows a mean pressure of 14 mmHg, a tall wave that peaks in systole and no x descent. What is the most likely valve lesion?",
          options: [
            "Tricuspid stenosis, which produces prominent a waves with a slow y descent",
            "Tricuspid regurgitation, with large systolic c and v waves and loss of the x descent",
            "Pulmonary stenosis, which is diagnosed from the right atrial v wave",
            "Complete heart block, with cannon a waves from the atrium contracting on a closed valve",
          ],
          answer: 1,
          explanation:
            "Oxford describes tricuspid regurgitation as large c and v waves with loss of the x descent, the systolic regurgitant jet filling the atrium. Tricuspid stenosis gives prominent a waves (atrial systole, not ventricular systole) with a muted y descent. Cannon a waves need the atrium to contract against a closed tricuspid valve, as in complete heart block (atrioventricular dissociation) or a junctional rhythm; with 1:1 conduction they cannot occur, and they would peak with atrial, not ventricular, systole. Pulmonary stenosis is measured on PA-to-RV pullback.",
        },
        {
          kind: "pitfalls",
          items: [
            "Grading aortic regurgitation with the pigtail touching or crossing the leaflets.",
            "Taking Oxford's printed grade III literally: it should read LV density equal to the aorta.",
            "Missing guide-induced acute regurgitation when an Amplatz or deep extra back-up guide drops the pressure.",
            "Choosing a balloon pump, microaxial pump or VA-ECMO in severe aortic regurgitation.",
            "Measuring a possible tricuspid stenosis with a single pullback when 5 mmHg is the difference that matters.",
            "Reading a large right atrial wave without first checking the rhythm.",
          ],
        },
        {
          kind: "pearl",
          text: "For any right-sided pullback, decide before you start how slowly you will withdraw and how many stable beats you will record in each chamber. The step you are looking for is often smaller than the noise of a hurried pullback.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In 'Tearing chest pain and a diastolic murmur', record the aortic and LV pressures and describe what the acute regurgitation has done to the LV diastolic pressure. Then, on any right heart scenario, practise the PA-to-RV pullback slowly with continuous recording and name each chamber from its diastolic pressure.",
        },
        { kind: "video", id: "DFbsXsNeqzw", note: "Elias Hanna's haemodynamic cases of tricuspid regurgitation and aortic and pulmonic insufficiency." },
        { kind: "video", id: "gcsqWvUe0wQ", note: "Elias Hanna on additional valve haemodynamics." },
        {
          kind: "keypoints",
          items: [
            "Aortogram for regurgitation: pigtail in the proximal ascending aorta clear of the leaflets, 40–60 mL of contrast at 20 mL/s, LAO, breath-hold.",
            "Grades I–IV compare LV density with the aorta; Oxford's grade III wording contains a slip and means equal to the aorta.",
            "Amplatz and deep extra back-up guides can open a cusp and cause acute regurgitation; reposition at once.",
            "Severe aortic regurgitation contraindicates the balloon pump, microaxial pump and VA-ECMO (Brilakis); Oxford's thresholds are significant and moderate to severe.",
            "Pulmonary stenosis: slow PA-to-RV pullback with continuous recording; regurgitation and PA dilatation on pulmonary angiography.",
            "Tricuspid stenosis: a 5 mmHg gradient can matter, so use matched catheters in the RA and RV.",
            "Tricuspid regurgitation: large c and v waves on the RA trace with loss of the x descent.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-constriction",
      title: "Constriction, restriction and tamponade: reading the simultaneous study",
      minutes: 14,
      topics: ["hd-constriction-restriction"],
      sources: [
        O("ch 5: Constrictive pericarditis"),
        O("ch 5: Pericardial tamponade"),
        O("ch 5: Cardiomyopathy"),
        O("ch 4: Cardiac catheterization"),
        O("ch 4: Right heart pressures and waveforms"),
        O("ch 4: Equipment"),
      ],
      refs: [...OX, "hurrell-constriction-1996", "talreja-constriction-2008", "esc-myopericardial-2025", "esc-pericardial-2015", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Constrictive pericarditis, restrictive cardiomyopathy and tamponade all raise and equalise diastolic pressures, so the static numbers look alike. What separates them is how the two ventricles behave together through the respiratory cycle, and that can only be seen on a simultaneous recording made properly. Oxford lists suspected constriction among the standard indications for a simultaneous left and right heart study. The Academy lesson hd-pm-constriction gives the full table of thresholds and the systolic area index; this lesson builds the study step by step and works through how to read it.",
        },
        { kind: "h", text: "The haemodynamic picture of constriction (Oxford)" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Hypotension.",
            "Tachycardia.",
            "Right atrial pressure that rises on inspiration (Kussmaul's sign) instead of falling.",
            "An M- or W-shaped right atrial trace: a steep y descent with a smaller x descent.",
            "A dip and plateau in the ventricular diastolic trace: rapid early filling stopped abruptly by the rigid pericardium (the 'square-root sign').",
            "Raised diastolic pressures that are equal in all four chambers.",
            "LV and RV diastolic pressures that stay matched through respiration.",
          ],
        },
        {
          kind: "p",
          text: "**Why Kussmaul's sign is abnormal.** Oxford's waveform section explains the normal pattern: in spontaneous breathing, right atrial pressure falls on inspiration as intrathoracic pressure falls, and rises on expiration; under mechanical ventilation the direction reverses. A rigid pericardium stops the heart from feeling the fall, so the inspiratory rise in venous return has nowhere to go and the pressure climbs. Because ventilation reverses the normal swings, every respiratory sign in this lesson is interpreted for a spontaneously breathing patient.",
        },
        {
          kind: "p",
          text: "Note a small difference between sources: Oxford describes the M or W trace with a steep y and a smaller x descent, while the Academy's hd-pm-constriction table describes steep x and y descents. Both agree that the y descent is steep, and that is the part that separates constriction from tamponade.",
        },
        { kind: "h", text: "Setting up the study" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Two ventricular catheters",
              detail: "One in the LV (arterial access) and one in the RV (venous access), both on transducers zeroed with the port open to air at mid-chest level, as Oxford describes for any manifold.",
            },
            {
              title: "2. Same scale, same screen",
              detail: "Display LV and RV together so diastolic pressures can be compared beat by beat; Oxford's figure shows the two diastolic traces superimposed, with dip and plateau.",
            },
            {
              title: "3. Breathe normally",
              detail: "Record over several breaths with the patient breathing quietly and spontaneously, so that inspiratory and expiratory beats can be compared.",
            },
            {
              title: "4. Add the right atrium",
              detail: "Look for Kussmaul's sign and the M or W shape.",
            },
            {
              title: "5. Fidelity matters",
              detail:
                "The two studies that defined the dynamic criteria used high-fidelity manometer-tipped catheters, and Hurrell's group recorded respiration as well. Oxford points out that a standard fluid-filled system delays the signal and damps it slightly because of the long column between tip and transducer, and that catheter impact against a wall and catheter whip in the chamber add artefacts. Flush the system, free it of air, and check both traces for damping and whip before you interpret small respiratory differences.",
            },
          ],
        },
        { kind: "tip", id: "haemo-constriction-simultaneous-lv-rv" },
        { kind: "h", text: "Why the static criteria are not enough" },
        {
          kind: "p",
          text: "Oxford says restrictive and infiltrative cardiomyopathies give catheter findings similar to constriction. Talreja notes that early rapid filling and equalised end-diastolic pressures occur in both. The catheter evidence agrees that this overlap is real. In Hurrell's study of 36 patients (15 with surgically proven constriction, 21 with heart failure from other causes), the equalisation criteria neither detected nor excluded constriction reliably and did not tell the two groups apart. In Talreja's series of 100 consecutive patients (59 with surgically documented constriction, 41 with restrictive myocardial disease), the conventional criteria differed statistically between groups, but none reached a predictive accuracy of 75%.",
        },
        { kind: "h", text: "The dynamic sign: ventricular interdependence" },
        {
          kind: "p",
          text: "In constriction the pericardial shell fixes the total volume of the heart and insulates it from the swings of intrathoracic pressure. On inspiration more blood enters the right heart, and because the shell cannot expand, the LV must give up room: RV systolic pressure rises while LV systolic pressure falls. Hurrell found that this discordance accurately separated constriction from other causes of heart failure. Talreja quantified it as the systolic area index, the ratio of RV to LV systolic pressure-time area in inspiration compared with expiration. The index picked up 97% of the surgically confirmed cases, and the authors report its predictive accuracy as 100%. In restrictive disease the pericardium is normal, the ventricles are not forced to compete, and their systolic pressures move in the same direction with breathing.",
        },
        {
          kind: "table",
          caption: "Reading the traces",
          head: ["Feature", "Constriction", "Restrictive cardiomyopathy", "Tamponade"],
          rows: [
            ["Diastolic pressures", "Raised and equal in all chambers", "Raised; similar to constriction (Oxford)", "Raised (Oxford: findings similar to constriction)"],
            ["Ventricular diastolic contour", "Dip and plateau", "Rapid early filling with raised end-diastolic pressure (Talreja)", "Not described by Oxford"],
            ["Right atrial trace", "M or W shape, steep y descent; rises on inspiration", "Not specified by Oxford", "Raised and blunted"],
            [
              "Systolic LV and RV peaks with inspiration",
              "Discordant: RV up, LV down",
              "Concordant",
              "Also discordant: exaggerated interdependence underlies pulsus paradoxus (hd-pm-tamponade)",
            ],
            ["Systemic pressure with inspiration", "Hypotension is listed, not a set inspiratory fall", "Not specified", "Usually falls by more than 10 mmHg (pulsus paradoxus)"],
            ["Role of the catheter", "Simultaneous left and right study (an Oxford indication)", "The same study, to separate it from constriction", "Not needed for diagnosis: echo gives it at once"],
          ],
        },
        {
          kind: "p",
          text: "**A sentence in Oxford to read with care.** Oxford's restriction section names respiratory variation between the LV and RV traces as a discriminator and says it does not occur in constriction. As printed, this runs against the catheter studies: Hurrell and Talreja found respiratory discordance of the ventricular pressures in constriction, with concordant changes in restrictive disease. Follow the catheter evidence: on inspiration the RV systolic peak rises while the LV peak falls in constriction, and the two move together in restriction.",
        },
        {
          kind: "check",
          stem: "Simultaneous LV and RV traces in a spontaneously breathing patient show equal diastolic pressures of 22 mmHg with a dip and plateau in both. On inspiration the RV systolic peak rises from 38 to 44 mmHg while the LV systolic peak falls from 112 to 100 mmHg. What does this indicate?",
          options: [
            "Restrictive cardiomyopathy, because equal diastolic pressures and dip and plateau are its defining signs",
            "Constriction: discordant inspiratory systolic changes show enhanced ventricular interdependence",
            "Normal physiology, because all systolic pressures fall on inspiration in healthy hearts",
            "Tamponade, because a dip and plateau means the pericardium is full of fluid",
          ],
          answer: 1,
          explanation:
            "Equalised diastolic pressures and the dip and plateau occur in both constriction and restriction, so they cannot decide it. The RV rising while the LV falls on inspiration is the discordance Hurrell found accurate for constriction and Talreja quantified as the systolic area index. In restriction both peaks move together. Oxford does not give tamponade a dip and plateau; its tamponade signs are pulsus paradoxus and a blunted right atrial trace, and echo makes that diagnosis at once.",
        },
        { kind: "h", text: "Tamponade: similar numbers, different trace" },
        {
          kind: "list",
          items: [
            "**Echo first.** Oxford: echocardiography gives the diagnosis instantly; you should not need the catheter to make it. Oxford's echo example shows a large effusion around the heart with small right-sided chambers and collapse of the right atrium.",
            "**Pulsus paradoxus.** Systemic pressure usually falls by more than 10 mmHg on inspiration.",
            "**Right atrium.** Generally raised and blunted, in contrast to the steep y descent of constriction.",
            "**What to do.** Drainage is taught with pericardiocentesis (the Academy lesson hd-pm-tamponade covers monitoring during drainage and effusive-constrictive disease).",
          ],
        },
        {
          kind: "check",
          stem: "A patient with raised, equal diastolic pressures has a right atrial trace with a blunted contour and no clear y descent, and the arterial systolic pressure falls by 18 mmHg on inspiration. What is the most likely diagnosis, and what should confirm it?",
          options: [
            "Constriction; confirm with the systolic area index",
            "Restrictive cardiomyopathy; confirm with endomyocardial biopsy",
            "Tamponade; confirm with echocardiography straight away",
            "Normal physiology; no further test is needed",
          ],
          answer: 2,
          explanation:
            "A blunted right atrial trace and an inspiratory fall in systemic pressure of more than 10 mmHg are Oxford's tamponade features; constriction gives a steep y descent with an M or W shape. Oxford says echo gives the diagnosis instantly, so do not prolong the catheter study. A normal heart does not have raised, equalised diastolic pressures.",
        },
        { kind: "tip", id: "haemo-constriction-check-ventilation" },
        {
          kind: "p",
          text: "**After the diagnosis.** The 2025 ESC guideline on myocarditis and pericarditis, which replaces the 2015 pericardial guideline, separates two paths. Transient constriction is constriction with ongoing pericardial inflammation that can reverse with anti-inflammatory treatment, so it advises a trial of anti-inflammatory therapy (3–6 months) first, using C-reactive protein and multimodality imaging, including cardiac MRI, to detect the inflammation. When medical therapy fails, or when there is constriction without pericarditis, the patient is referred for pericardiectomy without delay.",
        },
        {
          kind: "pitfalls",
          items: [
            "Diagnosing constriction from equalised diastolic pressures and a dip and plateau alone: restriction shares them.",
            "Recording LV and RV one after the other, or with a breath-hold, which removes the respiratory comparison.",
            "Interpreting respiratory signs in a ventilated patient as if breathing were spontaneous: ventilation reverses the normal swings.",
            "Taking Oxford's restriction sentence to mean that respiratory discordance is a sign of restriction: the catheter evidence places it in constriction.",
            "Prolonging a catheter study for suspected tamponade instead of looking with echo.",
          ],
        },
        {
          kind: "pearl",
          text: "Mark inspiration on the recording as you go (ask the patient to breathe in on your word, or watch the chest). When you analyse later, the question is simply: on the marked inspiratory beats, did the RV peak go up while the LV peak went down?",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open 'Ascites and oedema after cardiac surgery years ago' and 'Breathlessness with thick ventricular walls and low voltages'. In each, record simultaneous LV and RV pressures with respiration and the RA trace. Compare the inspiratory change in the two systolic peaks, look for Kussmaul's sign, and decide which patient has constriction. Then open 'Hypotension two hours after a complex PCI' and name the tamponade features.",
        },
        { kind: "video", id: "Ty0ucFCRiHs", note: "Elias Hanna on constrictive pericarditis cases, mechanisms and technical tips." },
        { kind: "video", id: "AafsNxAyADk", note: "Elias Hanna's practice cases and tracings on constriction versus myocardial disease." },
        { kind: "video", id: "0sXHIb1pjzs", note: "Elias Hanna's constrictive pericarditis case studies." },
        { kind: "video", id: "NX81MYPpbtQ", note: "Elias Hanna on tamponade, asymptomatic effusion, pericardiocentesis and constriction." },
        {
          kind: "keypoints",
          items: [
            "Oxford's constriction features: hypotension, tachycardia, Kussmaul's sign, M or W right atrial trace with steep y descent, dip and plateau, raised equal diastolic pressures, LV and RV diastolic pressures matched through respiration.",
            "Restriction shares the raised, equal pressures and rapid early filling; static criteria had predictive accuracy below 75% in Talreja's series.",
            "The decisive sign is discordance of LV and RV systolic peaks on inspiration (Hurrell); the systolic area index had 97% sensitivity (Talreja). Discordance separates constriction from restriction, not from tamponade.",
            "Record LV and RV simultaneously, on matched zeroed transducers, over several spontaneous breaths.",
            "Ventilation reverses normal respiratory pressure swings; interpret accordingly.",
            "Tamponade: pulsus paradoxus over 10 mmHg, blunted right atrial trace, diagnosed by echo.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-hocm",
      title: "Hypertrophic obstructive cardiomyopathy: finding, provoking and respecting the gradient",
      minutes: 13,
      topics: ["hd-hocm"],
      sources: [
        O("ch 5: Cardiomyopathy"),
        O("ch 4: Ventriculography"),
        O("ch 8: Pressure wire"),
        O("ch 9: Intra-aortic balloon pump"),
        B("3.2"),
        B("3.6"),
        B("5.6"),
        B("6.6"),
      ],
      refs: [...BOOKS, "esc-cardiomyopathy-2023", "brockenbrough-1961", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "In hypertrophic cardiomyopathy with outflow obstruction, the gradient between the LV and the aorta is dynamic: it lies below the valve, changes from beat to beat, and grows when the ventricle is emptier or contracts harder. The catheter can show where the gradient is, make it appear when it is hidden at rest, and separate it from fixed valve stenosis with one ectopic beat. The same physiology makes some routine lab drugs and devices dangerous. The Academy lesson hd-pm-hocm covers the subaortic chamber, catheter entrapment and the haemodynamics of alcohol septal ablation; the ablation procedure itself is in hb-additional-procedures.",
        },
        { kind: "h", text: "Demonstrating the gradient" },
        {
          kind: "steps",
          title: "Oxford's pullback",
          items: [
            {
              title: "1. Catheter in the body of the LV",
              detail: "Oxford places a pigtail in the LV body and withdraws it slowly with continuous pressure recording.",
            },
            {
              title: "2. Second catheter in the aorta",
              detail: "Ideally a second arterial catheter records aortic pressure at the same time, so each beat can be compared directly with the LV.",
            },
            {
              title: "3. Watch where the pressure falls",
              detail:
                "In obstruction the pressure difference lies between apex and outflow tract: during withdrawal, systolic pressure drops while the catheter is still below the valve, before it crosses into the aorta. In fixed valve stenosis the drop occurs only as the catheter crosses the valve.",
            },
          ],
        },
        {
          kind: "p",
          text: "**The routine pullback can find it first.** In Oxford's ventriculography sequence, once the images are acquired the catheter is pulled back from the LV to the aorta on pressure to estimate any gradient through the outflow tract. In a patient not known to have obstruction, this is the moment an unexpected gradient appears; when it does, set up the formal study above rather than reading a diagnosis from one quick withdrawal.",
        },
        {
          kind: "p",
          text: "**Which catheter?** Oxford describes the pullback with a pigtail. A pigtail has side holes along its curve, and Brilakis warns that side holes mean the pressure recorded is not purely the pressure at the tip (in his context they can mask damping or ventricularisation). For the same reason the Academy lesson hd-pm-hocm prefers an end-hole catheter when the aim is to localise a gradient within the ventricle; whichever you use, a gradient that appears below the valve on a slow pullback with a second aortic catheter is the finding you are looking for.",
        },
        { kind: "tip", id: "haemo-hocm-pullback-second-catheter" },
        {
          kind: "check",
          stem: "During a slow pullback from the LV apex with simultaneous aortic pressure, LV systolic pressure is 190 mmHg at the apex and 120 mmHg in the outflow tract below the valve; aortic systolic pressure is 118 mmHg. Where is the obstruction?",
          options: [
            "At the aortic valve, because the gradient is between LV and aorta",
            "In the LV outflow tract below the valve, because the pressure falls before the valve is crossed",
            "Nowhere: a 70 mmHg difference inside the ventricle is catheter artefact by definition",
            "Above the valve, in the ascending aorta",
          ],
          answer: 1,
          explanation:
            "The pressure falls from 190 to 120 mmHg while the catheter is still in the ventricle, and the outflow tract pressure is close to aortic pressure, so the obstruction lies between the apex and the outflow tract, as Oxford describes for obstructive hypertrophic cardiomyopathy. Valvar stenosis would keep the full LV pressure right up to the valve. Entrapment can mimic a cavity gradient (hd-pm-hocm), but that calls for repositioning and comparison with echo, not automatic dismissal.",
        },
        { kind: "h", text: "Provoking a gradient that is small at rest" },
        {
          kind: "list",
          items: [
            "**Valsalva manoeuvre:** Oxford's first provocation. The strain reduces the return of blood to the heart, so the LV fills less and the obstruction worsens.",
            "**A vasodilator such as sublingual GTN:** Oxford's second. Brilakis explains why it works: nitroglycerin reduces both filling and arterial pressure, and each of these narrows the outflow tract further.",
            "**Report the conditions** of every gradient: at rest, with Valsalva, after a vasodilator. The 2023 ESC cardiomyopathy guideline defines obstruction as a peak instantaneous Doppler LVOT gradient of 30 mmHg or more, at rest or with provocation, and treats 50 mmHg as haemodynamically important, the usual threshold for invasive treatment. Echo with provocation is the primary test and the catheter is used when echo is inconclusive (hd-pm-hocm); a catheter peak-to-peak gradient is not directly interchangeable with the Doppler number.",
          ],
        },
        {
          kind: "p",
          text: "**The two manuals pull in different directions on nitroglycerin, and both are right in context.** Oxford uses a vasodilator deliberately, in a monitored haemodynamic study, to unmask the gradient. Brilakis, writing about nitroglycerin during coronary procedures, lists hypertrophic obstructive cardiomyopathy as a cause of nitroglycerin-induced hypotension and says not to give it to these patients. In practice: when the diagnosis is known and the aim is a coronary procedure, leave nitroglycerin out; if a vasodilator is used as a provocation, it is a planned step with pressures displayed and a pure vasoconstrictor ready.",
        },
        { kind: "tip", id: "haemo-hocm-provoke-valsalva-gtn" },
        { kind: "h", text: "The beat after an ectopic (Brockenbrough sign)" },
        {
          kind: "table",
          caption: "The sinus beat that follows a premature ventricular complex",
          head: ["", "Fixed aortic stenosis", "Obstructive hypertrophic cardiomyopathy"],
          rows: [
            ["LV pressure and gradient", "Rise (Oxford)", "Rise (hd-pm-hocm; Oxford states only the stenosis column)"],
            ["Systemic (aortic) pressure", "Rises compared with the beat before (Oxford)", "Usually lower than on the beat before the ectopic (Oxford); hd-pm-hocm: the systolic pressure falls or fails to rise"],
            ["Aortic pulse pressure", "Rises", "Narrows (hd-pm-hocm)"],
          ],
        },
        {
          kind: "p",
          text: "After a pause the next beat is more forceful. With a fixed valve, more force simply ejects more blood, so aortic pressure rises with the gradient. With dynamic obstruction, a stronger contraction narrows the outflow tract further, so LV pressure and the gradient rise (hd-pm-hocm) while the aortic pressure on that beat is usually lower, which is Oxford's discriminator. The sign carries the names of Brockenbrough, Braunwald and Morrow; the description used in hd-pm-hocm is a narrower aortic pulse pressure on the post-ectopic beat, with a systolic pressure that falls or fails to rise. Look at the aortic trace on the beat after the ectopic and compare its systolic and pulse pressures with the beat before it.",
        },
        { kind: "tip", id: "haemo-hocm-post-ectopic-aorta" },
        {
          kind: "check",
          stem: "A ventricular ectopic occurs during simultaneous LV and aortic recording. On the next sinus beat the LV systolic pressure rises from 180 to 230 mmHg and the aortic systolic pressure falls from 115 to 100 mmHg. How do you interpret this?",
          options: [
            "Fixed aortic stenosis, because the gradient across the valve increased after the ectopic",
            "Dynamic outflow obstruction, because the aortic pressure fell on the post-ectopic beat",
            "Damping of the aortic catheter, which always under-reads the beat after an ectopic",
            "Normal post-extrasystolic potentiation, which tells you nothing about the outflow tract",
          ],
          answer: 1,
          explanation:
            "LV pressure and the gradient rise after an ectopic in both conditions (Oxford for fixed stenosis, hd-pm-hocm for obstruction), so that alone cannot separate them. The aortic pressure decides: in fixed stenosis it rises with the stronger beat; in obstructive hypertrophic cardiomyopathy it is usually lower than on the beat before, as here, classically with a narrower pulse pressure. Normal potentiation would raise aortic pressure, and damping would not selectively lower one beat.",
        },
        { kind: "h", text: "Hypertrophic cardiomyopathy in the coronary and support labs" },
        {
          kind: "table",
          head: ["Situation", "What to do", "Source"],
          rows: [
            [
              "Hypotension",
              "Use a pure vasopressor: Brilakis makes phenylephrine the vasopressor of choice in hypertrophic cardiomyopathy because any added contractility makes the obstruction inside the cavity worse; vasopressin is the other pure vasopressor he lists. Do not give nitroglycerin",
              "Brilakis 3.6, 3.2",
            ],
            ["Choosing support", "Oxford lists obstructive hypertrophic cardiomyopathy with a significant gradient as a contraindication to the balloon pump", "Oxford ch 9"],
            ["Opacification", "High coronary flow, which Brilakis lists for hypertrophic obstructive and dilated cardiomyopathy as well as aortic stenosis, can prevent a small catheter filling the artery", "Brilakis 6.6"],
            ["Physiology", "Oxford lists hypertrophic cardiomyopathy among the settings in which FFR has limited validation", "Oxford ch 8"],
          ],
        },
        {
          kind: "steps",
          title: "Hypotension after nitroglycerin (Brilakis 3.2), in a patient with outflow obstruction",
          items: [
            {
              title: "1. No more nitrate",
              detail: "Give no further doses. Brilakis gives the half-life of nitroglycerin as 1.5 to 7.5 minutes, so the effect wears off quickly.",
            },
            {
              title: "2. Normal saline",
              detail: "Give normal saline, Brilakis's second treatment step.",
            },
            {
              title: "3. Wait briefly",
              detail: "Brilakis notes that nitroglycerin hypotension often settles within a few minutes.",
            },
            {
              title: "4. Vasopressor if extreme or persistent",
              detail:
                "Brilakis's general advice names norepinephrine or phenylephrine; with outflow obstruction choose phenylephrine, the pure vasopressor (typical dosing in Brilakis 3.6: 50–100 mcg IV bolus, then an infusion of 0.5–1.4 mcg/kg/min; follow local protocol). If the pressure stays low, look for another cause, such as bleeding.",
            },
          ],
        },
        { kind: "tip", id: "haemo-hocm-hypotension-phenylephrine" },
        {
          kind: "pitfalls",
          items: [
            "Pulling back without a second aortic catheter, so beats cannot be compared directly.",
            "Missing a gradient that is small at rest because no provocation was tried.",
            "Giving nitroglycerin routinely during a coronary procedure in a patient with known obstruction.",
            "Treating hypotension in obstruction with an inotrope, which worsens the obstruction.",
            "Inserting a balloon pump in obstructive hypertrophic cardiomyopathy with a significant gradient.",
            "Calling the post-ectopic rise in gradient diagnostic: it rises in fixed stenosis too; the aortic pressure is the discriminator.",
          ],
        },
        {
          kind: "pearl",
          text: "Before any provocation, have phenylephrine drawn up and named aloud to the team. Provocation works by making the ventricle smaller, and the price of success can be a sudden fall in pressure.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open 'Exertional syncope in a young man with a loud murmur'. Record simultaneous LV and aortic pressures, pull back slowly and say where the pressure falls. Trigger an ectopic and compare the aortic pressure on the beats before and after it. Repeat in 'Exertional syncope with an ejection systolic murmur' and explain why the post-ectopic aortic pressure behaves differently.",
        },
        { kind: "video", id: "azHS4z4gllQ", note: "Elias Hanna on combined aortic stenosis and HOCM: cases, echo and catheter haemodynamics." },
        { kind: "video", id: "gcsqWvUe0wQ", note: "Elias Hanna on additional valve and HOCM haemodynamics." },
        { kind: "video", id: "UYH8XJaH9k8", note: "Elias Hanna's valve haemodynamics and hypertrophic cardiomyopathy case studies." },
        {
          kind: "keypoints",
          items: [
            "Slow pullback from the LV body with a second catheter in the aorta: in obstruction the pressure falls below the valve, from apex to outflow tract.",
            "Provoke with the Valsalva manoeuvre or a vasodilator such as sublingual GTN, and report each gradient with its conditions.",
            "ESC 2023: a peak instantaneous Doppler gradient of 30 mmHg or more, at rest or provoked, defines obstruction; 50 mmHg or more is haemodynamically important. A catheter peak-to-peak value is not the same number.",
            "After an ectopic, LV pressure and the gradient rise in both lesions; aortic pressure rises in fixed stenosis but is usually lower in obstructive hypertrophic cardiomyopathy, classically with a narrower pulse pressure.",
            "In coronary procedures avoid nitroglycerin; for hypotension use a pure vasopressor such as phenylephrine, not an inotrope.",
            "A balloon pump is contraindicated with a significant gradient; FFR has limited validation; high flow can defeat small catheters.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-specific-conditions-pe",
      title: "Pulmonary embolism and pulmonary angiography",
      minutes: 12,
      topics: ["dx-pulmonary-angiography"],
      sources: [
        O("ch 5: Pulmonary embolism"),
        O("ch 5: Pulmonary angiography"),
        O("ch 4: Cardiac catheterization"),
        O("ch 4: Accessing the right heart"),
        O("ch 3: How to obtain venous access"),
        O("ch 3: Internal jugular vein access"),
        O("ch 9: Microaxial pump"),
      ],
      refs: [...OX, "esc-pe-2019", "aha-acc-pe-2026", "stein-pioped-angiography-1992"],
      blocks: [
        {
          kind: "p",
          text: "Invasive pulmonary angiography used to be how pulmonary embolism was diagnosed. CT pulmonary angiography has largely replaced it, and the 2019 ESC pulmonary embolism guideline makes CT the imaging method of choice for suspected embolism. The catheter still has a place when the embolism is massive and removing clot is being considered, and Oxford lists acute RV failure from massive embolism among the uses of a right-sided microaxial pump (ch 9). This lesson covers what to check before you start, how to get there safely, and how the pictures are taken.",
        },
        { kind: "h", text: "Where the catheter fits today" },
        {
          kind: "list",
          items: [
            "**Diagnosis:** CT pulmonary angiography (Oxford; 2019 ESC guideline).",
            "**High-risk (haemodynamically unstable) embolism:** the 2019 ESC guideline recommends systemic thrombolysis; where thrombolysis is contraindicated or has failed, it recommends surgical embolectomy, and percutaneous catheter-directed treatment should be considered as an alternative.",
            "**A newer guideline.** The 2026 AHA/ACC multisociety guideline on acute pulmonary embolism introduces its own clinical categories for grading severity and guiding treatment, and makes its own recommendations on advanced interventional therapy. Check it, and your local pulmonary embolism response pathway, alongside the 2019 ESC guideline; this lesson does not quote its classes of recommendation.",
            "**Oxford's example of a catheter study** in proven or suspected embolism is massive embolism when embolectomy is being considered.",
            "**Right ventricular support:** Oxford lists acute RV failure from massive pulmonary embolism among the uses of the right-sided microaxial pump. It goes in through the femoral vein and sits in the main PA, so the same clot-aware access planning applies.",
          ],
        },
        { kind: "h", text: "Before you start" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Choose the venous access with the clot in mind",
              detail:
                "Oxford warns that femoral venous access can dislodge iliofemoral clot, so the access site needs careful thought. Its venous access section lists the internal jugular route for pulmonary angiography when there is thrombus in the inferior vena cava or another obstruction such as a caval filter.",
            },
            {
              title: "2. Monitor continuously",
              detail: "Record PA pressure and systemic arterial pressure throughout, not just at the start.",
            },
            {
              title: "3. Check the PA systolic pressure before injecting",
              detail:
                "Oxford regards a PA systolic pressure above 60 mmHg as a contraindication to pulmonary angiography unless the operator is very experienced.",
            },
          ],
        },
        { kind: "tip", id: "haemo-pe-venous-access-clot" },
        { kind: "tip", id: "haemo-pe-pa-pressure-limit" },
        {
          kind: "check",
          stem: "A patient with massive pulmonary embolism is brought to the lab while embolectomy is considered. Duplex shows thrombus in the right common femoral and iliac veins, and an IVC filter was placed last year. Which venous access does Oxford's teaching point to?",
          options: [
            "Right femoral vein, because it is the usual route for a right heart study",
            "Left femoral vein, because the thrombus is on the right",
            "Internal jugular vein, avoiding the iliofemoral clot and the caval filter",
            "No venous access: pulmonary angiography is never done in massive embolism",
          ],
          answer: 2,
          explanation:
            "Oxford warns that femoral access may dislodge iliofemoral clot and lists the internal jugular route for pulmonary angiography when the IVC contains thrombus or a filter. The left femoral route still passes through the caval filter. Oxford's own example of a catheter study in embolism is massive embolism when embolectomy is considered, so 'never' is wrong.",
        },
        { kind: "h", text: "Getting to the pulmonary artery" },
        {
          kind: "steps",
          title: "From Oxford's right heart technique",
          items: [
            {
              title: "1. Into the RV",
              detail: "The catheter sometimes passes straight across the tricuspid valve; often a loop formed in the right atrium prolapses it through. Ventricular ectopy tells you it is in the RV.",
            },
            {
              title: "2. Off the apex and up",
              detail: "Ease the catheter back off the apex, turn it so the tip faces upwards, then advance into the main PA. A guide wire helps in difficult cases, and a deep breath can guide the catheter into the PA.",
            },
            {
              title: "3. Branches",
              detail: "To enter each branch, turn and advance with a light hand while screening.",
            },
            {
              title: "4. Gently",
              detail: "Vigorous manipulation in the RV causes ventricular arrhythmias, which a failing RV tolerates badly.",
            },
          ],
        },
        { kind: "h", text: "Taking the pictures" },
        {
          kind: "table",
          caption: "Oxford's pulmonary angiography protocol",
          head: ["Element", "Detail"],
          rows: [
            ["Projection", "AP"],
            ["Catheter", "Pigtail in the main pulmonary artery"],
            ["Power injection", "30–40 mL of contrast at 12–20 mL/s if PA pressures are normal"],
            ["Subtraction", "Digital subtraction angiography if the patient can hold their breath"],
            ["Selective runs", "Hand injections of 10 mL into PA branches can show filling defects"],
          ],
        },
        { kind: "tip", id: "haemo-pulmonary-angiography-protocol" },
        {
          kind: "p",
          text: "**What the angiogram shows.** An embolus appears as a filling defect within the contrast column; Oxford's example is a selective right PA injection with several defects in keeping with multiple emboli. The same angiogram shows pulmonary regurgitation and PA dilatation when that is the question (pulmonary valve section of this module).",
        },
        {
          kind: "check",
          stem: "In a patient with normal PA pressures and good breath-holding, how would Oxford set up the main-PA run?",
          options: [
            "Pigtail in the main PA, AP projection, 30–40 mL at 12–20 mL/s, digital subtraction with a breath-hold",
            "Pigtail in the main PA, LAO projection, 40–60 mL at 20 mL/s, digital subtraction with a breath-hold",
            "End-hole catheter in the right PA, AP projection, 30–40 mL at 12–20 mL/s, power injection, subtraction",
            "Pigtail in the main PA, AP projection, a 10 mL hand injection, no subtraction despite the breath-hold",
          ],
          answer: 0,
          explanation:
            "Oxford images the pulmonary tree in AP with a pigtail in the main PA, injecting 30–40 mL of contrast at 12–20 mL/s when pressures are normal, with subtraction if the patient can hold their breath. 40–60 mL at 20 mL/s in LAO is Oxford's aortogram, not its pulmonary run. Oxford's 10 mL hand injections are selective branch injections for filling defects, not the main-PA run, and it does not describe power-injecting a branch through an end-hole catheter.",
        },
        { kind: "h", text: "How risky is it?" },
        {
          kind: "p",
          text: "The best-known series is the angiography arm of PIOPED, 1,111 patients. Five died (0.5%), nine had major non-fatal complications (1%) and 60 had minor ones (5%). Major and fatal complications were more frequent in patients from the medical intensive care unit (5 of 122, 4%) than in others (9 of 989, 1%). Renal dysfunction followed in 13 (1%), and those patients were older. Angiograms were non-diagnostic in 3% and incomplete in 1%, and after a negative angiogram only 4 of 675 patients (0.6%) were later found to have embolism. Consensus reading gave an unchallenged diagnosis in 96%, incomplete studies were usually stopped by a complication, and the authors judged the risk low enough to justify angiography in the right clinical setting. Complication rates were no different with higher PA pressure, larger contrast volumes or confirmed embolism.",
        },
        {
          kind: "p",
          text: "**Two messages that sit side by side.** Oxford's 60 mmHg rule is a handbook safety threshold; PIOPED did not find PA pressure to be a significant predictor of complications in its population. The handbook's caution is the one to follow in your lab, but understand that the strongest risk signal in PIOPED was how sick the patient was (intensive care), which is exactly the patient with massive embolism. PIOPED's authors judged that the clinician's overall assessment of the patient matters most when weighing the risk.",
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing the femoral vein on the side of a known iliofemoral thrombus.",
            "Starting without continuous PA and systemic arterial pressure monitoring.",
            "Power-injecting the main PA when the PA systolic pressure is above 60 mmHg without very experienced hands.",
            "Rough manipulation in the RV of a patient whose RV is already failing.",
            "Treating a negative invasive angiogram as a reason to ignore CT, or a CT as needing invasive confirmation: CT is now the diagnostic test.",
          ],
        },
        {
          kind: "pearl",
          text: "When the call comes for a catheter in massive embolism, ask two questions before you scrub: where is the clot in the legs and the cava, and what is the PA systolic pressure on echo? The answers choose your vein and decide whether a main-PA power injection is on the table at all.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "On the 'Atypical chest pain, breathless on exertion' scenario, practise the right heart route Oxford describes: loop in the RA, cross into the RV, pull back off the apex, rotate cranially and advance into the main PA, then enter the right and left PA. Record the PA systolic pressure and say whether a main-PA power injection would be allowed under Oxford's 60 mmHg rule.",
        },
        {
          kind: "keypoints",
          items: [
            "CT pulmonary angiography is the diagnostic test; invasive angiography is now mainly part of treatment planning in massive embolism.",
            "High-risk embolism: thrombolysis; if contraindicated or failed, surgical embolectomy, with catheter-directed treatment as an alternative (2019 ESC); read the 2026 AHA/ACC guideline and local pathway alongside it.",
            "Choose venous access to avoid iliofemoral clot; use the internal jugular route with caval thrombus or a filter.",
            "Monitor PA and systemic arterial pressure continuously; PA systolic above 60 mmHg contraindicates angiography unless very experienced.",
            "Protocol: pigtail in the main PA, AP, 30–40 mL of contrast at 12–20 mL/s with normal pressures, subtraction with breath-hold, 10 mL selective hand injections for filling defects.",
            "PIOPED: death 0.5%, major complications 1%, minor 5%; sicker (intensive care) patients carried more risk.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-specific-conditions-q1",
      stem: "In a randomised study of retrograde catheterisation in valvular aortic stenosis, what did diffusion-weighted MRI show after the valve was crossed?",
      options: [
        "New embolic lesions in 22% of crossed patients and clinical deficits in 3%; none without crossing",
        "New embolic lesions in 3% of crossed patients and clinical deficits in 0.5%; similar without crossing",
        "No difference in embolic lesions between crossed patients and those with coronary angiography only",
        "New embolic lesions in about half of all patients, whether or not the valve was crossed during the study",
      ],
      answer: 0,
      explanation:
        "Omran randomised 152 patients: 22 of 101 who had the valve crossed (22%) developed focal diffusion abnormalities in an embolic pattern and 3 (3%) had apparent neurological deficits; none of the 51 without valve passage, and none of the 32 controls, showed embolism. The 3 with deficits were among the 22, so about 19% had lesions without symptoms. This is why Oxford calls diagnostic crossing hazardous and keeps it for when the information is needed, for example discordant findings or a TAVI work-up.",
      difficulty: 2,
      refs: ["omran-aortic-crossing-emboli-2003", "oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q2",
      stem: "Crossing is justified in a patient with discordant echo and symptoms. Which equipment and sequence follow Oxford's technique?",
      options: [
        "5 F AL1 with a straight hydrophilic wire, then exchange to a pigtail over an exchange-length J wire",
        "6 F pigtail pushed across the valve on its own, then a second pigtail placed in the aorta for pressure",
        "5 F JL4 with a stiff J wire looped against the leaflets, then the wire left in the LV for recording",
        "Balloon-tipped flotation catheter advanced retrogradely, then wedged against the leaflets to cross",
      ],
      answer: 0,
      explanation:
        "Oxford's choice is a 5 F AL1 with a straight hydrophilic wire, moved with control; once the catheter is in the ventricle it is swapped for a pigtail over an exchange-length J wire. A pigtail alone rarely crosses a stenotic orifice, and looping a stiff wire against calcified leaflets runs contrary to Oxford's call for controlled wire manipulation.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q3",
      stem: "A patient with severe LV impairment has an output of 2.4 L/min, a mean aortic gradient of 24 mmHg and a Gorlin area of 0.65 cm². Which conclusion is most defensible?",
      options: [
        "Severe stenosis is proven, because the Gorlin area is well below 1.0 cm² and the formula is exact",
        "The stenosis is moderate, because a mean gradient under 40 mmHg excludes severe stenosis at any flow",
        "The area may be underestimated at this low output, so the valve must be assessed at higher flow",
        "The area is overestimated at low output, so the true valve is even tighter than 0.65 cm²",
      ],
      answer: 2,
      explanation:
        "Oxford states the Gorlin formula overestimates area at high output and underestimates it at low output. A small area with a low gradient in a weak ventricle is low-flow low-gradient stenosis with a reduced ejection fraction; the 2025 ESC/EACTS guideline tests it with low-dose dobutamine stress echo, with CT calcium scoring of the valve as complementary information (the Academy's hd-valves-as-area adds an invasive dobutamine study when echo is non-diagnostic). Neither a low gradient nor a small area settles it on its own, and the error at low flow runs towards too small an area, not too large.",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "esc-vhd-2025", "hanna-pcm"],
    },
    {
      id: "hb-specific-conditions-q4",
      stem: "Output 4.5 L/min, heart rate 75 beats/min, diastolic filling period 0.40 s/beat, mean mitral gradient (wedge against LV) 25 mmHg. What is the Gorlin mitral valve area, and where does it sit?",
      options: [
        "About 0.80 cm², severe on Oxford's scale (below 1.0 cm²) and within the ESC 1.5 cm² line",
        "About 1.2 cm², moderate on Oxford's scale (1.0–1.5 cm²) but within the ESC 1.5 cm² line",
        "About 1.6 cm², mild on Oxford's scale (above 1.5 cm²) and outside the ESC 1.5 cm² line",
        "About 0.16 cm², critical on any scale, using the mean gradient without taking its square root",
      ],
      answer: 0,
      explanation:
        "MVA = 4500 ÷ (37.7 × 0.40 × 75 × √25) = 4500 ÷ (1131 × 5) = 4500 ÷ 5655 ≈ 0.80 cm²: severe on Oxford's scale (below 1.0 cm²) and within the ESC 1.5 cm² line (clinically severe rheumatic stenosis in the 2025 ESC/EACTS guideline, clinically significant in 2021). Omitting the square root gives 4500 ÷ 28275 ≈ 0.16 cm². Oxford notes the wedge probably overestimates left atrial pressure by 2–3 mmHg, so the true gradient is likely 22–23 mmHg and the area about 0.83–0.85 cm², still severe.",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "gorlin-1951", "esc-vhd-2021", "esc-vhd-2025"],
    },
    {
      id: "hb-specific-conditions-q5",
      stem: "Giant v waves appear on the wedge trace of a breathless man four days after an infarct. Which statement is correct?",
      options: [
        "They prove severe mitral regurgitation, so a ventriculogram adds nothing further to the diagnosis",
        "They also occur with a VSD or infiltrative disease, so confirm the cause with echo or oximetry",
        "They are an artefact of the balloon flotation catheter and disappear once it is withdrawn",
        "They indicate tricuspid regurgitation, because v waves reflect right ventricular systole",
      ],
      answer: 1,
      explanation:
        "Oxford describes large wedge v waves as transmitted LV pressure in mitral regurgitation but warns they are not specific: other conditions that raise left atrial pressure can produce them, and Oxford names a ventricular septal defect and infiltrative myocardial disease. After an infarct a septal rupture is a real possibility, so oximetry and echo matter. Tricuspid regurgitation produces v waves on the right atrial trace, not the wedge.",
      difficulty: 2,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q6",
      stem: "On an aortogram the LV becomes denser than the ascending aorta and stays opacified over the next beats. During an elective PCI two weeks later, the same patient becomes hypotensive as an Amplatz guide is advanced deep into the left coronary. What best links the two findings?",
      options: [
        "Grade III regurgitation; the hypotension is a vagal reaction unrelated to where the guide is sitting",
        "Grade IV regurgitation; the guide may be holding a cusp open, so reposition it, and avoid a balloon pump",
        "Grade II regurgitation; insert a balloon pump at once to support the blood pressure for the rest of the PCI",
        "Grade IV regurgitation; give more nitroglycerin to offload the LV and then continue the PCI as planned",
      ],
      answer: 1,
      explanation:
        "An LV denser than the aorta that persists over subsequent beats is Oxford's grade IV. Brilakis warns that an Amplatz or deep extra back-up guide can lever a cusp open, producing sudden regurgitation and hypotension that repositioning corrects at once. Severe aortic regurgitation is a contraindication to the balloon pump (Brilakis 14.1; Oxford lists significant regurgitation), so reaching for one would be wrong.",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "brilakis-manual-pci"],
    },
    {
      id: "hb-specific-conditions-q7",
      stem: "Why does Oxford ask for a matched pair of catheters recording the RA and RV together when tricuspid stenosis is suspected?",
      options: [
        "Because a gradient as small as 5 mmHg can cause significant symptoms",
        "Because a single catheter cannot cross the tricuspid valve in stenosis",
        "Because the wedge pressure must be subtracted from the RA pressure",
        "Because tricuspid stenosis is always more severe than mitral stenosis",
      ],
      answer: 0,
      explanation:
        "Oxford notes that small gradients, around 5 mmHg, can produce significant symptoms, so accurate simultaneous recordings from matched catheters in the right atrium and RV are needed; a single-catheter pullback compares different beats and can hide a difference that small. Tricuspid stenosis usually accompanies mitral disease and is uncommon, but it is not always the worse lesion.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q8",
      stem: "In Talreja's series of 100 patients investigated for constriction or restrictive myocardial disease, how did the systolic area index perform compared with the conventional catheter criteria?",
      options: [
        "Systolic area index: 97% sensitivity, 100% predictive accuracy; conventional criteria all below 75%",
        "Systolic area index: 75% sensitivity; the conventional equalisation criteria: 97% sensitivity and 100% accuracy",
        "Both performed equally, each with a predictive accuracy of about 90% for surgical constriction",
        "Neither separated the groups; only endomyocardial biopsy achieved a predictive accuracy above 75%",
      ],
      answer: 0,
      explanation:
        "Talreja studied 59 patients with surgically documented constriction and 41 with restrictive myocardial disease using high-fidelity catheters. The conventional criteria differed statistically between groups but none reached 75% predictive accuracy, whereas the systolic area index, which measures enhanced ventricular interaction, had 97% sensitivity and 100% predictive accuracy. Biopsy was not the comparator.",
      difficulty: 3,
      refs: ["talreja-constriction-2008"],
    },
    {
      id: "hb-specific-conditions-q9",
      stem: "A ventilated patient after cardiac surgery is studied for possible constriction. The right atrial pressure rises on each mechanical inspiration. What is the correct interpretation?",
      options: [
        "Kussmaul's sign is present, which confirms constriction in this patient without further testing",
        "Positive-pressure inspiration normally raises RA pressure, so this cannot be read as Kussmaul's sign",
        "The transducer is incorrectly zeroed, because RA pressure cannot rise on inspiration in any patient",
        "Tamponade is present, because an RA pressure that rises on inspiration is its defining catheter sign",
      ],
      answer: 1,
      explanation:
        "Oxford explains that in spontaneous breathing RA pressure falls on inspiration and rises on expiration, and that the reverse is seen with mechanical ventilation. Kussmaul's sign, an inspiratory rise in RA pressure, is abnormal only in a spontaneously breathing patient. Oxford's tamponade signs are pulsus paradoxus and a raised, blunted RA trace, not an inspiratory rise.",
      difficulty: 3,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q10",
      stem: "During diagnostic angiography in a patient with obstructive hypertrophic cardiomyopathy, the blood pressure falls to 78/50 mmHg. Which drug choice follows the manuals?",
      options: [
        "Sublingual GTN, because Oxford uses it during haemodynamic studies of hypertrophic cardiomyopathy",
        "Phenylephrine, a pure vasopressor that adds no inotropic effect to worsen the obstruction",
        "Dobutamine, because an inotrope will raise the output across the narrowed outflow tract",
        "A balloon pump, because it unloads the LV and raises the diastolic pressure in the aorta",
      ],
      answer: 1,
      explanation:
        "Brilakis makes phenylephrine the vasopressor of choice in hypertrophic cardiomyopathy because added contractility makes the obstruction worse, and says nitroglycerin should not be given in HOCM, since reducing filling and arterial pressure narrows the outflow further. Oxford mentions a vasodilator only as a way of accentuating the gradient, not as a treatment, and lists obstructive cardiomyopathy with a significant gradient as a contraindication to the balloon pump.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "hb-specific-conditions-q11",
      stem: "In the PIOPED angiography series of 1,111 patients, which factor was associated with more fatal or major non-fatal complications?",
      options: [
        "Higher pulmonary artery pressure, with a significant rise in events above 60 mmHg",
        "Larger contrast volume, with most deaths after more than 200 mL of contrast",
        "Referral from the medical intensive care unit (4% against 1% elsewhere)",
        "The presence of pulmonary embolism, which doubled the major complication rate",
      ],
      answer: 2,
      explanation:
        "Fatal or major non-fatal complications occurred in 5 of 122 medical intensive care patients (4%) against 9 of 989 others (1%). In PIOPED, complication rates were no different with higher PA pressure, larger contrast volumes or confirmed embolism. Oxford still treats a PA systolic pressure above 60 mmHg as a contraindication unless the operator is very experienced; that is the handbook's caution, not a PIOPED finding.",
      difficulty: 3,
      refs: ["stein-pioped-angiography-1992", "oxford-cath-handbook"],
    },
  ],
  sims: [
    { sim: "haemo", task: "Aortic stenosis scenario: record simultaneous LV and aortic pressures, measure mean and peak-to-peak gradients, and calculate the Gorlin area." },
    { sim: "haemo", task: "Mitral stenosis scenario: display wedge and LV together, average the mean gradient over several beats and calculate the Gorlin mitral area." },
    { sim: "haemo", task: "Constriction and restriction scenarios: record LV and RV simultaneously with respiration and decide which shows discordant systolic peaks." },
    { sim: "haemo", task: "HOCM scenario: pull back slowly with a second aortic catheter, find where the pressure falls, and compare the aortic pressure before and after an ectopic." },
  ],
  caseIds: ["hb-specific-conditions-case-syncope", "hb-specific-conditions-case-pe"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "hb-specific-conditions-case-syncope",
    title: "Exertional syncope: valve, outflow tract, or both?",
    trackId: "cath-handbook",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Oxford Handbook ch 5 (aortic stenosis; cardiomyopathy, Brockenbrough sign) and ch 4 (accessing the left heart, ventriculography); Brilakis 3.2, 3.6 and 6.6",
    },
    summary:
      "A patient with exertional syncope and a systolic murmur comes for angiography with discordant echo findings. Decide whether to cross the valve, cross it safely, measure the gradient properly, localise it, provoke it, and manage hypotension in obstructive physiology.",
    presentation:
      "A 67-year-old man has had two episodes of syncope while climbing stairs. He has an ejection systolic murmur. Transthoracic echo windows were poor: the aortic valve looks calcified and the septum thick, and the Doppler mean gradient was recorded as 28 mmHg with a valve area that could not be measured reliably. Transoesophageal echo and CT calcium scoring of the valve were also inconclusive. He is referred for coronary angiography and invasive assessment.",
    findings: [
      "Blood pressure 128/74 mmHg, heart rate 68 beats/min, sinus rhythm",
      "Creatinine normal; no contraindication to contrast",
      "Echo: calcified aortic valve, septal thickening, poor windows; LVEF preserved",
      "Right radial and right femoral arterial access available; the team has a second arterial sheath ready",
    ],
    steps: [
      {
        id: "plan",
        prompt: "Before the coronary injections, what is the plan for the aortic valve?",
        info: "The coronary arteries are being studied first. The question is whether to cross the valve.",
        options: [
          {
            text: "Cross it: symptoms and imaging are discordant and the non-invasive tests could not answer the question, so an invasive gradient will change management",
            best: true,
            feedback:
              "Right. A discrepancy between symptoms and non-invasive testing is one of Oxford's examples of a need to cross (a TAVI work-up is the other), and the 2025 ESC/EACTS guideline accepts LV catheterisation when symptoms and signs suggest severe stenosis and non-invasive tests are inconclusive. Here echo, TOE and CT all failed to settle it. Include the embolic risk in the consent: in Omran's study 22% of crossed patients had new embolic lesions, 3% with a clinical deficit (so about 19% silent).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Never cross a calcified aortic valve; report the coronaries and send him home",
            feedback:
              "Too absolute. Crossing is hazardous, but this is exactly the discordant situation in which Oxford and the ESC guideline accept it, and without it the cause of his syncope remains unknown.",
            stateDelta: { stability: -5 },
            next: "plan-wait",
          },
          {
            text: "Do a left ventriculogram first to see whether the valve opens well",
            feedback:
              "Critical aortic stenosis is one of Oxford's relative contraindications to ventriculography, and a ventriculogram does not measure the gradient. Plan the crossing properly instead.",
            stateDelta: { stability: -10, flags: ["early-lvgram"] },
            next: "lvgram",
          },
        ],
      },
      {
        id: "plan-wait",
        kind: "consequence",
        prompt: "Three weeks later he has a third syncope and is readmitted. A repeat echo is still non-diagnostic. What now?",
        options: [
          {
            text: "Bring him back for invasive assessment with a planned, controlled crossing",
            best: true,
            feedback: "The question was always going to need the catheter. Plan it once, properly.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Repeat the transthoracic echo a third time with the same windows",
            feedback: "The windows have not changed; a third identical study will not answer the question either.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "lvgram",
        kind: "consequence",
        prompt: "The ventriculogram triggers a run of ectopics and the pressure falls to 88/56 mmHg before recovering. What do you take from this?",
        options: [
          {
            text: "Stop: do not repeat it, let the pressure recover, and plan a controlled crossing for the gradient",
            best: true,
            feedback:
              "Right. A large contrast load in the LV of a patient who may have critical stenosis is a risk without diagnostic return. Measure what matters: the gradient.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Repeat the ventriculogram with a larger volume to get a cleaner run",
            feedback: "That doubles the risk for a picture that still will not measure the gradient.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "cross",
        prompt: "How do you cross?",
        options: [
          {
            text: "5 F AL1 with a straight hydrophilic wire, moved with control; an aortogram first if the orifice is unclear; then an exchange-length J wire to swap the AL1 for a pigtail",
            best: true,
            feedback:
              "Oxford's technique exactly. The aortogram's Prussian helmet sign shows where the leaflets open; the AL1 aims, the wire crosses, and the pigtail sits safely in the cavity for recording.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push a pigtail on a standard J wire against the valve for as long as it takes",
            feedback:
              "A pigtail rarely finds a stenotic orifice, and uncontrolled manipulation at a calcified valve is what Oxford warns against; crossing itself carried a 22% embolic lesion rate in Omran's study. Oxford asks for controlled wire manipulation with an AL1 and a straight hydrophilic wire.",
            stateDelta: { stability: -15, flags: ["prolonged-crossing"] },
            next: "neuro",
          },
          {
            text: "JR4 and a stiff straight wire, probing firmly until it passes",
            feedback:
              "A Judkins right 4 can help direct a wire in Oxford's general 'difficult valve' sequence, but firm probing with a stiff wire is not the controlled technique a stenotic valve needs. Oxford's choice for severe stenosis is the AL1 with a hydrophilic straight wire.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "neuro",
        kind: "consequence",
        prompt: "After 15 minutes the wire crosses and the pigtail is placed in the LV. A few minutes later, still on the table, he develops slurred speech. What do you do now?",
        options: [
          {
            text: "Stop further manipulation, call the stroke team now for urgent assessment and imaging, and limit the rest of the study to what is essential, with no provocation",
            best: true,
            feedback:
              "A new focal deficit during or just after crossing is a possible cerebral embolus until proved otherwise, and it fits the embolic risk of crossing: Omran found new embolic lesions in 22% of crossed patients, with a clinically apparent deficit in 3%. Get the stroke team now rather than finishing the planned study.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Reassure him, finish the full planned study including provocation, and review him in recovery",
            feedback: "Crossing the valve does cause cerebral embolism: the randomised MRI data show both silent and clinically apparent lesions. Delaying assessment to finish the study, and adding provocation, is the wrong order of priorities.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "measure",
        prompt: "The pigtail is in the LV. How do you measure the gradient?",
        variants: [
          {
            flag: "prolonged-crossing",
            info: "After the neurological event the study was cut short: only one simultaneous LV and aortic recording is made before the catheters come out. The steps that follow take place at a planned repeat study after his neurological recovery.",
          },
        ],
        options: [
          {
            text: "Second catheter in the ascending aorta through the spare sheath, both on matched transducers, and record simultaneous LV and aortic pressures before any pullback",
            best: true,
            feedback:
              "Oxford's most accurate method: simultaneous LV and aortic pressures give the true mean gradient. The slow pullback can follow, so the gradient can be localised.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull straight back from the LV to the aorta and take the peak-to-peak difference",
            acceptable: true,
            feedback:
              "It is how many gradients are obtained, but Oxford points out that the two peaks occur at different times and the catheter interferes with the leaflets. With a spare sheath ready, simultaneous recording is better.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Compare the LV pressure with the radial arterial pressure as the reference",
            feedback:
              "Oxford calls a femoral reference less accurate, and a radial trace is a peripheral pressure with the same problems of delay and amplification (hd-valves-as-gradients). Use an ascending aortic catheter.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "localise",
        info: "For the pullback, the pigtail has been exchanged over a J wire for an end-hole multipurpose catheter; the second catheter stays in the aorta.",
        variants: [
          {
            flag: "prolonged-crossing",
            info: "These traces come from the planned repeat study after his neurological recovery, at which the valve was crossed once with the AL1 and a hydrophilic wire.",
          },
        ],
        prompt:
          "Simultaneous traces: LV systolic 196 mmHg, aortic systolic 120 mmHg. On a slow pullback, LV systolic pressure falls to 128 mmHg while the catheter is still below the valve, then to 122 mmHg as it crosses into the aorta. After a ventricular ectopic, the next beat has an LV systolic pressure of 240 mmHg and an aortic systolic pressure of 104 mmHg. What is the diagnosis?",
        options: [
          {
            text: "Dynamic LV outflow obstruction with at most a small valve gradient: the drop is below the valve and aortic pressure fell after the ectopic",
            best: true,
            feedback:
              "Right. Most of the gradient (196 to 128 mmHg) lies in the outflow tract, leaving about 6 mmHg across the valve. The post-ectopic beat clinches it: in fixed stenosis aortic pressure rises after an ectopic, whereas in obstructive hypertrophic cardiomyopathy it is usually lower than on the beat before. An end-hole catheter is used for this pullback because a pigtail's side holes straddle the gradient and cannot localise it (hd-pm-hocm).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Severe aortic stenosis: the LV-to-aorta gradient is 76 mmHg and rose after the ectopic",
            feedback:
              "The total gradient is large, but the pullback puts most of it below the valve, and a rising gradient after an ectopic occurs in both conditions. Aortic pressure fell, which fixed stenosis does not do.",
            stateDelta: { stability: -10, flags: ["missed-hocm"] },
            next: "wrong-dx",
          },
        ],
      },
      {
        id: "wrong-dx",
        kind: "consequence",
        prompt: "The team plans aortic valve intervention. A colleague asks you to look at the pullback again. What do you see?",
        options: [
          {
            text: "The pressure drop occurs below the valve and the post-ectopic aortic pressure falls: the main lesion is dynamic outflow obstruction, which needs a different treatment plan",
            best: true,
            feedback: "Good recovery. Treating the valve alone would leave the outflow obstruction, the main source of the gradient, untouched.",
            stateDelta: { stability: 5 },
          },
          {
            text: "The gradient is large, so the location within the LV does not matter",
            feedback: "Location is everything: valve and outflow-tract obstruction are treated differently.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "provoke",
        prompt:
          "The team wants to know how the gradient behaves with provocation. What do you do first?",
        variants: [
          {
            flag: "prolonged-crossing",
            info: "This is the repeat study. No provocation was attempted on the day of the neurological event.",
          },
        ],
        options: [
          {
            text: "Ask him to perform a Valsalva manoeuvre while recording, with phenylephrine drawn up before any vasodilator is considered",
            best: true,
            feedback:
              "Oxford's first provocation is the Valsalva manoeuvre; a vasodilator such as sublingual GTN is the second. Because provocation works by emptying the ventricle, have the pure vasopressor ready first.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give sublingual GTN straight away, without preparing a vasopressor",
            feedback:
              "Oxford does list a vasodilator as a provocation, but Brilakis warns that nitroglycerin causes hypotension in HOCM by lowering preload and afterload. Using it without a vasopressor ready invites trouble.",
            stateDelta: { stability: -10, flags: ["gtn-unprepared"] },
            next: "hypotension",
          },
          {
            text: "Give a fluid bolus to provoke the gradient",
            feedback: "Oxford's provocations, the Valsalva manoeuvre and a vasodilator, both reduce the filling of the ventricle (Brilakis explains nitroglycerin's effect through lower preload and afterload). Adding volume moves the loading the other way and will not unmask the gradient.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "hypotension",
        kind: "consequence",
        prompt: "Two minutes after the GTN his pressure is 78/48 mmHg and he feels faint. What do you give?",
        options: [
          {
            text: "Phenylephrine and normal saline; no more nitrate",
            best: true,
            feedback:
              "Brilakis treats nitroglycerin hypotension by giving no further doses (its half-life is 1.5 to 7.5 minutes), giving normal saline, waiting briefly because it often resolves within minutes, and adding a vasopressor when it is extreme or persistent, as it is here with presyncope. In hypertrophic cardiomyopathy phenylephrine is his vasopressor of choice because it has no inotropic effect to worsen the obstruction (typically 50–100 mcg IV, then an infusion; follow local protocol).",
            stateDelta: { stability: 10 },
          },
          {
            text: "Dobutamine to raise the output",
            feedback: "An inotrope worsens intracavitary obstruction (Brilakis 3.6); the pressure may fall further.",
            stateDelta: { stability: -20, flags: ["inotrope-hocm"] },
          },
          {
            text: "Insert a balloon pump",
            feedback: "Oxford lists obstructive hypertrophic cardiomyopathy with a significant gradient as a contraindication to the balloon pump.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "coronary",
        prompt: "During the coronary injections with a 5 F catheter, the LAD fills patchily with streaming despite a firm injection. What is your interpretation?",
        options: [
          {
            text: "Probably high coronary flow from the hypertrophied ventricle: use a larger catheter without side holes and a firmer injection, and report the run as non-diagnostic if it still will not fill",
            best: true,
            feedback:
              "Brilakis lists high coronary flow in hypertrophic obstructive cardiomyopathy and severe aortic stenosis among the causes of incomplete filling, and prefers a non-diagnostic report to a false diagnosis.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Report diffuse LAD disease and refer for bypass grafting",
            feedback: "Streaming from incomplete opacification is a classic false positive. Fix the injection before reading the vessel.",
            stateDelta: { stability: -10, flags: ["false-lad"] },
          },
        ],
      },
    ],
    outcome:
      "The study showed a dynamic outflow tract gradient that rose with Valsalva, with only a small valve gradient and unobstructed coronary arteries once a 6 F catheter without side holes was used. He was referred to the cardiomyopathy service with the resting and provoked gradients documented.",
    outcomeVariants: [
      {
        flag: "prolonged-crossing",
        text: "The uncontrolled crossing was followed on the table by slurred speech. Manipulation stopped, the stroke team assessed him at once, the study was cut short with no provocation, and the full assessment was completed at a planned repeat study after his recovery. The event was discussed at the department's morbidity meeting.",
      },
      { flag: "missed-hocm", text: "The initial misreading of the pullback nearly led to treatment aimed at the valve alone; the review of the trace corrected the plan." },
      { flag: "inotrope-hocm", text: "Dobutamine deepened the hypotension until phenylephrine was given." },
      { flag: "false-lad", text: "The LAD report was withdrawn after a repeat injection with a larger catheter showed a normal vessel." },
    ],
    learningPoints: [
      "Cross a calcified aortic valve only when the information is needed, for example when symptoms and non-invasive data disagree or for a TAVI work-up, and include the embolic risk in consent.",
      "A new neurological deficit during or after crossing means stopping manipulation and calling the stroke team at once, not finishing the study.",
      "Use Oxford's kit: 5 F AL1, straight hydrophilic wire with controlled movement, then an exchange-length J wire to place a pigtail.",
      "Simultaneous LV and aortic pressures give the true gradient; a slow pullback then shows where it lies.",
      "A pressure drop below the valve and a fall in aortic pressure after an ectopic mean dynamic outflow obstruction.",
      "Provoke with Valsalva first; have phenylephrine ready before any vasodilator; never treat the hypotension with an inotrope or a balloon pump.",
      "High coronary flow can make a normal artery look diseased with a small catheter.",
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci", "omran-aortic-crossing-emboli-2003", "esc-vhd-2025", "hanna-pcm"],
  },
  {
    id: "hb-specific-conditions-case-pe",
    title: "Massive pulmonary embolism: when the lab is asked to help",
    trackId: "cath-handbook",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Oxford Handbook ch 5 (pulmonary embolism, pulmonary angiography), ch 4 (accessing the right heart), ch 3 (venous access) and ch 9 (microaxial pump); 2019 ESC pulmonary embolism guideline and the 2026 AHA/ACC multisociety pulmonary embolism guideline",
    },
    summary:
      "A patient with high-risk pulmonary embolism and a contraindication to thrombolysis is brought to the lab. Plan the access around the clot, monitor properly, respect the PA pressure limit for angiography, navigate the right heart gently and choose the treatment route.",
    presentation:
      "A 61-year-old woman had abdominal surgery six days ago. She had a left leg deep vein thrombosis three years ago and has been increasingly breathless on exertion over the past six months. Today she collapsed with breathlessness. CT pulmonary angiography shows extensive bilateral central emboli and a dilated RV. Blood pressure is 84/56 mmHg despite fluid and a noradrenaline infusion. The surgeons consider systemic thrombolysis contraindicated so soon after the operation. The cardiology team is asked to take her to the lab while embolectomy options are considered.",
    findings: [
      "Heart rate 118 beats/min, sinus tachycardia; oxygen saturation 90% on high-flow oxygen",
      "Echo: dilated, hypokinetic RV; estimated PA systolic pressure 65 mmHg",
      "Duplex: thrombus in the left common femoral and external iliac veins; IVC clear",
      "Arterial line in the right radial artery",
    ],
    steps: [
      {
        id: "access",
        prompt: "Which venous access will you use?",
        options: [
          {
            text: "Right internal jugular vein, or the right femoral vein after confirming the right iliofemoral veins and IVC are clear; never the left femoral",
            best: true,
            feedback:
              "Oxford warns that femoral venous access can dislodge iliofemoral clot, so choose the site with the duplex in hand. The thrombus is on the left; the internal jugular route avoids the leg veins altogether.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Left femoral vein, because it is closest to the operator's side",
            feedback: "That is the side with the iliofemoral thrombus. Oxford's warning about dislodging clot applies exactly here.",
            stateDelta: { stability: -20, flags: ["clot-dislodged"] },
            next: "dislodged",
          },
        ],
      },
      {
        id: "dislodged",
        kind: "consequence",
        prompt: "As the sheath goes in, her saturation falls to 82% and the pressure to 70/40 mmHg. What has probably happened, and what now?",
        options: [
          {
            text: "Further clot may have embolised from the iliofemoral thrombus: call for help, support the circulation and move rapidly to definitive clot treatment",
            best: true,
            feedback: "Recognise it, escalate, and do not lose time. The access choice was the avoidable step.",
            stateDelta: { stability: 0 },
          },
          {
            text: "It is a vagal reaction; give atropine and carry on",
            feedback: "In a patient with iliofemoral thrombus and massive embolism, a sudden fall in saturation after a femoral puncture is embolism until proved otherwise.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "monitor",
        prompt: "The catheter is in. What monitoring does Oxford ask for?",
        options: [
          {
            text: "Continuous PA pressure and continuous systemic arterial pressure throughout",
            best: true,
            feedback: "Oxford asks for both to be recorded continuously in this setting.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A single PA pressure reading at the start, then ECG monitoring only",
            feedback: "A single reading misses deterioration. Oxford asks for continuous PA and systemic pressures.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "navigate",
        prompt: "The catheter is in the RV and keeps provoking runs of ectopics as you try to reach the PA. What do you do?",
        options: [
          {
            text: "Ease back off the apex, turn the tip to face upwards and advance; use a wire or a deep breath if needed, and avoid vigorous manipulation",
            best: true,
            feedback: "Oxford's right heart technique. Vigorous manipulation in the RV causes ventricular arrhythmias, which this failing RV will tolerate badly.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pushing firmly towards the outflow tract until the catheter passes",
            feedback: "Forceful manipulation in the RV provokes ventricular arrhythmias. Oxford's approach is to come off the apex and point the tip cranially.",
            stateDelta: { stability: -15, flags: ["vt-run"] },
            next: "vt",
          },
        ],
      },
      {
        id: "vt",
        kind: "consequence",
        prompt: "A run of ventricular tachycardia drops the pressure to 60 mmHg systolic before stopping. What now?",
        options: [
          {
            text: "Withdraw the catheter into the right atrium, let the rhythm settle, then use the gentle cranial-rotation technique",
            best: true,
            feedback: "Remove the trigger first, then go back with the right technique.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Carry on pushing, because you are nearly in the PA",
            feedback: "The next run may not stop by itself.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "angio",
        prompt: "The PA pressure is 66/30 mmHg. The CT has already made the diagnosis. Someone suggests a main-PA power injection of 40 mL at 20 mL/s 'to see the clot'. What do you say?",
        options: [
          {
            text: "No: a PA systolic pressure above 60 mmHg is a contraindication to pulmonary angiography unless the operator is very experienced, and the CT has already answered the diagnostic question",
            best: true,
            feedback:
              "Oxford's rule. Its 30–40 mL of contrast at 12–20 mL/s protocol is for normal PA pressures. Any imaging needed for treatment is for the experienced operator delivering it to decide.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Yes, inject: PIOPED found no link between PA pressure and complications",
            feedback:
              "PIOPED did not find PA pressure to be a significant predictor, but it did find more serious complications in sicker intensive care patients, and Oxford's 60 mmHg threshold is the handbook's safety rule. With the diagnosis already made, there is nothing to gain.",
            stateDelta: { stability: -10, flags: ["risky-injection"] },
            next: "after-injection",
          },
        ],
      },
      {
        id: "after-injection",
        kind: "consequence",
        prompt: "The run shows the same central clot that the CT showed, and her pressure dips briefly during the injection. What do you take from it?",
        options: [
          {
            text: "It added nothing to the CT, at a PA pressure Oxford treats as a contraindication; leave any further imaging to the operator delivering treatment",
            best: true,
            feedback: "Right. The diagnostic question was already answered, and the patient carried the risk for no new information.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Repeat the main-PA run in a second projection to map the clot better",
            feedback: "A second power injection repeats the risk, again without a diagnostic question to answer.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "treat",
        prompt: "She remains hypotensive on noradrenaline. Thrombolysis is contraindicated. What does the 2019 ESC guideline support?",
        options: [
          {
            text: "Surgical embolectomy, with percutaneous catheter-directed treatment considered as an alternative, decided with the surgical team now",
            best: true,
            feedback:
              "For high-risk embolism when thrombolysis is contraindicated or has failed, the guideline recommends surgical embolectomy and says catheter-directed treatment should be considered as an alternative. If the RV fails despite this, Oxford lists massive embolism among the uses of a right-sided microaxial pump, which goes in through the femoral vein into the main PA, so the clot in her left leg veins decides the side here too. The 2026 AHA/ACC multisociety guideline makes its own recommendations on advanced therapy; check it and your local pathway as well.",
            stateDelta: { stability: 10 },
          },
          {
            text: "A left-sided balloon pump to raise coronary perfusion",
            feedback: "The failing chamber is the RV, obstructed by clot. A left-sided balloon pump does not remove the obstruction.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Full-dose systemic thrombolysis despite the surgeons' advice",
            feedback: "The guideline offers embolectomy and catheter-directed treatment precisely for patients in whom thrombolysis is contraindicated.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "Access was taken away from the iliofemoral thrombus, pressures were monitored continuously, no diagnostic angiogram was attempted at a PA systolic pressure of 66 mmHg, and the patient went on to clot removal agreed between the cardiology and surgical teams. Her pressure improved once the central clot was cleared.",
    outcomeVariants: [
      { flag: "clot-dislodged", text: "The femoral puncture on the side of the thrombus was followed by further embolism and a period of profound hypotension before treatment." },
      { flag: "vt-run", text: "A run of ventricular tachycardia during forceful RV manipulation briefly worsened her haemodynamics." },
      { flag: "risky-injection", text: "A main-PA power injection was performed at a PA systolic pressure above 60 mmHg without adding diagnostic information." },
    ],
    learningPoints: [
      "CT pulmonary angiography makes the diagnosis; the lab's role in massive embolism is in treatment planning and delivery.",
      "Choose venous access away from iliofemoral clot; the internal jugular vein is the route when the IVC holds thrombus or a filter.",
      "Record PA and systemic arterial pressure continuously.",
      "Reach the PA gently: off the apex, tip cranial, advance; vigorous RV manipulation causes arrhythmias.",
      "PA systolic pressure above 60 mmHg contraindicates pulmonary angiography unless the operator is very experienced.",
      "High-risk embolism with thrombolysis contraindicated: surgical embolectomy, with catheter-directed treatment as an alternative (2019 ESC).",
    ],
    refs: ["oxford-cath-handbook", "esc-pe-2019", "aha-acc-pe-2026", "stein-pioped-angiography-1992"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "haemo-as-cross-only-if-discordant",
    lab: "haemo",
    when: { phase: ["valves"], requires: ["aortic-stenosis"] },
    title: "Severe aortic stenosis: cross only when the answer will change management",
    text: "Cross a stenotic aortic valve only when the information is needed, for example when symptoms and non-invasive data disagree or a TAVI work-up needs the haemodynamics. In a randomised MRI study, 22% of crossed patients had new embolic brain lesions and 3% a clinical deficit.",
    tone: "caution",
    lessonId: "hb-specific-conditions-as",
    sources: [O("ch 5: Aortic stenosis")],
    refs: ["oxford-cath-handbook", "omran-aortic-crossing-emboli-2003"],
  },
  {
    id: "haemo-as-al1-straight-wire",
    lab: "haemo",
    when: { phase: ["valves", "left-heart"], requires: ["aortic-stenosis"] },
    title: "Crossing a stenotic valve: AL1, straight hydrophilic wire, then pigtail",
    text: "Use a 5 F AL1 to aim a straight-tipped hydrophilic wire at the orifice and move the wire with control; an aortogram's Prussian helmet sign shows where the leaflets open. Once the AL1 is in the LV, exchange it for a pigtail over an exchange-length J wire.",
    tone: "do",
    lessonId: "hb-specific-conditions-as",
    sources: [O("ch 5: Aortic stenosis")],
    refs: OX,
  },
  {
    id: "haemo-as-simultaneous-gradient",
    lab: "haemo",
    when: { phase: ["valves"], requires: ["aortic-stenosis"] },
    title: "Aortic gradient: simultaneous LV and aorta beats a pullback",
    text: "Record LV and aortic pressures at the same time with two catheters or a dual-lumen catheter to get the true mean gradient. Femoral pressure is less accurate, and a pullback's peak-to-peak gradient compares peaks at different moments while the catheter disturbs the leaflets.",
    tone: "do",
    lessonId: "hb-specific-conditions-as",
    sources: [O("ch 5: Aortic stenosis")],
    refs: OX,
  },
  {
    id: "haemo-ms-wedge-lv-ten-beats",
    lab: "haemo",
    when: { phase: ["valves"], requires: ["mitral-stenosis"] },
    title: "Mitral gradient: wedge and LV together, average 10 beats in AF",
    text: "Measure the mean mitral gradient as the diastolic area between simultaneous wedge and LV traces. Heart rate changes it, so average at least 10 beats in atrial fibrillation, and remember the wedge probably reads 2–3 mmHg above left atrial pressure in mitral stenosis.",
    tone: "do",
    lessonId: "hb-specific-conditions-mitral",
    sources: [O("ch 5: Mitral stenosis")],
    refs: OX,
  },
  {
    id: "diag-lvgram-catheter-induced-mr",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"] },
    title: "Ventriculogram: do not grade catheter-induced regurgitation",
    text: "Sit the pigtail mid-cavity, clear of the mitral apparatus, and grade regurgitation only on clean sinus beats. A catheter pressing on the valve apparatus or a run of ectopics creates regurgitation that is not really there.",
    tone: "caution",
    lessonId: "hb-specific-conditions-mitral",
    sources: [O("ch 5: Mitral regurgitation"), O("ch 4: Ventriculography")],
    refs: OX,
  },
  {
    id: "diag-aortogram-ar-grading",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"] },
    title: "Aortogram for regurgitation: clear of the leaflets, grade against the aorta",
    text: "Place the pigtail in the proximal ascending aorta where it does not hold the leaflets open, then inject 40–60 mL of contrast at 20 mL/s in LAO during a breath-hold. Grade by LV density compared with the aorta: less dense is grade II, equal is grade III, denser and persisting is grade IV.",
    tone: "do",
    lessonId: "hb-specific-conditions-ar-right",
    sources: [O("ch 4: Aortography"), O("ch 5: Aortic regurgitation")],
    refs: OX,
  },
  {
    id: "haemo-ps-continuous-pullback",
    lab: "haemo",
    when: { phase: ["right-heart"], requires: ["pulmonary-stenosis"] },
    title: "Pulmonary stenosis: slow PA-to-RV pullback with continuous recording",
    text: "Cross into the main PA, then withdraw slowly into the RV with the pressure recording running. The systolic step marks the stenosis; the shape of the diastolic trace tells you whether you are in an arterial or a ventricular chamber.",
    tone: "do",
    lessonId: "hb-specific-conditions-ar-right",
    sources: [O("ch 5: Pulmonary valve"), O("ch 4: Right heart pressures and waveforms")],
    refs: ["oxford-cath-handbook", "hanna-pcm"],
  },
  {
    id: "haemo-ts-two-matched-catheters",
    lab: "haemo",
    when: { phase: ["right-heart", "valves"], requires: ["tricuspid-stenosis"] },
    title: "Tricuspid stenosis: two matched catheters, because 5 mmHg matters",
    text: "A tricuspid gradient as small as 5 mmHg can cause significant symptoms, so record the right atrium and RV at the same time with two matched catheters. A single pullback compares different beats and can hide it.",
    tone: "do",
    lessonId: "hb-specific-conditions-ar-right",
    sources: [O("ch 5: Tricuspid valve")],
    refs: OX,
  },
  {
    id: "haemo-tr-ra-v-wave",
    lab: "haemo",
    when: { phase: ["right-heart"], requires: ["tricuspid-regurgitation"] },
    title: "Large RA v waves: think tricuspid regurgitation, but read the rhythm first",
    text: "Tricuspid regurgitation gives large c and v waves on the right atrial trace with loss of the x descent; normally the RA v wave is a little smaller than the a wave. Check the rhythm before reading the waves: AF removes the a wave, and complete heart block or a junctional rhythm produces cannon a waves.",
    tone: "caution",
    lessonId: "hb-specific-conditions-ar-right",
    sources: [O("ch 5: Tricuspid valve"), O("ch 4: Right heart pressures and waveforms")],
    refs: OX,
  },
  {
    id: "haemo-constriction-simultaneous-lv-rv",
    lab: "haemo",
    when: { phase: ["left-heart", "right-heart"], event: ["constriction", "restriction"] },
    title: "Suspected constriction: LV and RV together, through several breaths",
    text: "Record LV and RV pressures simultaneously on matched, zeroed transducers while the patient breathes quietly. Equal diastolic pressures and a dip and plateau occur in restriction too; the deciding sign is the RV systolic peak rising while the LV peak falls on inspiration.",
    tone: "do",
    lessonId: "hb-specific-conditions-constriction",
    sources: [O("ch 5: Constrictive pericarditis"), O("ch 5: Cardiomyopathy")],
    refs: ["oxford-cath-handbook", "hurrell-constriction-1996", "talreja-constriction-2008"],
  },
  {
    id: "haemo-constriction-check-ventilation",
    lab: "haemo",
    when: { phase: ["right-heart"], requires: ["constriction"] },
    title: "Before calling Kussmaul's sign, check how the patient is breathing",
    text: "In spontaneous breathing RA pressure normally falls on inspiration; under mechanical ventilation the pattern reverses. An inspiratory rise in RA pressure is Kussmaul's sign only in a spontaneously breathing patient.",
    tone: "caution",
    lessonId: "hb-specific-conditions-constriction",
    sources: [O("ch 4: Right heart pressures and waveforms"), O("ch 5: Constrictive pericarditis")],
    refs: OX,
  },
  {
    id: "haemo-hocm-pullback-second-catheter",
    lab: "haemo",
    when: { phase: ["left-heart", "valves"], event: ["hocm", "aortic-stenosis"] },
    title: "Outflow gradient: slow pullback with a second catheter in the aorta",
    text: "Withdraw slowly from the LV body with continuous recording while a second arterial catheter records aortic pressure. In obstructive hypertrophic cardiomyopathy the pressure falls while the catheter is still below the valve; in valve stenosis it falls only as the valve is crossed.",
    tone: "do",
    lessonId: "hb-specific-conditions-hocm",
    sources: [O("ch 5: Cardiomyopathy")],
    refs: OX,
  },
  {
    id: "haemo-hocm-provoke-valsalva-gtn",
    lab: "haemo",
    when: { phase: ["left-heart", "valves"], requires: ["hocm"] },
    title: "Small resting outflow gradient: provoke it, with a vasopressor ready",
    text: "Ask for a Valsalva manoeuvre while recording; a vasodilator such as sublingual GTN is the second option. Both work by emptying the ventricle, so draw up phenylephrine first and report each gradient with its condition.",
    tone: "do",
    lessonId: "hb-specific-conditions-hocm",
    sources: [O("ch 5: Cardiomyopathy"), B("3.2"), B("3.6")],
    refs: BOOKS,
  },
  {
    id: "haemo-hocm-post-ectopic-aorta",
    lab: "haemo",
    when: { phase: ["left-heart", "valves"], event: ["hocm", "aortic-stenosis"] },
    title: "After an ectopic, watch the aortic pressure, not the gradient",
    text: "On the sinus beat after a premature ventricular complex, LV pressure and the gradient rise in both fixed aortic stenosis and obstructive hypertrophic cardiomyopathy. Aortic pressure rises in fixed stenosis but is usually lower than on the previous beat in dynamic obstruction, classically with a narrower pulse pressure.",
    tone: "do",
    lessonId: "hb-specific-conditions-hocm",
    sources: [O("ch 5: Cardiomyopathy")],
    refs: ["oxford-cath-handbook", "brockenbrough-1961", "hanna-pcm"],
  },
  {
    id: "haemo-hocm-hypotension-phenylephrine",
    lab: "haemo",
    when: { event: ["hypotension"], phase: ["left-heart", "valves"], requires: ["hocm"] },
    title: "Hypotension with outflow obstruction: phenylephrine, not an inotrope",
    text: "Stop any nitrate and give normal saline; nitroglycerin hypotension often settles within minutes. If it is extreme or persists, give a pure vasopressor such as phenylephrine (typically 50–100 mcg IV, then an infusion; follow local protocol). Inotropes worsen intracavitary obstruction, and a balloon pump is contraindicated when the gradient is significant.",
    tone: "bailout",
    lessonId: "hb-specific-conditions-hocm",
    sources: [B("3.6"), B("3.2"), O("ch 9: Intra-aortic balloon pump")],
    refs: BOOKS,
  },
  {
    id: "haemo-pe-venous-access-clot",
    lab: "haemo",
    when: { phase: ["setup"], requires: ["pulmonary-embolism"] },
    title: "Pulmonary embolism: choose the vein away from the clot",
    text: "Femoral venous access can dislodge iliofemoral thrombus, so check where the clot is before you puncture. With thrombus in the IVC or a caval filter in place, use the internal jugular vein.",
    tone: "caution",
    lessonId: "hb-specific-conditions-pe",
    sources: [O("ch 5: Pulmonary embolism"), O("ch 3: Internal jugular vein access")],
    refs: OX,
  },
  {
    id: "haemo-pe-pa-pressure-limit",
    lab: "haemo",
    when: { phase: ["right-heart"], requires: ["pulmonary-embolism"] },
    title: "PA systolic above 60 mmHg: no pulmonary angiogram without an expert",
    text: "Record PA and systemic arterial pressures continuously. Oxford treats a PA systolic pressure above 60 mmHg as a contraindication to pulmonary angiography unless the operator is very experienced.",
    tone: "caution",
    lessonId: "hb-specific-conditions-pe",
    sources: [O("ch 5: Pulmonary embolism")],
    refs: OX,
  },
  {
    id: "haemo-pulmonary-angiography-protocol",
    lab: "haemo",
    when: { phase: ["right-heart"], catheter: ["PIG"], requires: ["pulmonary-embolism"] },
    title: "Pulmonary angiogram: pigtail in the main PA, AP, 30–40 mL",
    text: "With normal PA pressures, inject 30–40 mL of contrast at 12–20 mL/s through a pigtail in the main PA in the AP projection, using subtraction if the patient can hold their breath. Selective 10 mL hand injections into the branches can show filling defects.",
    tone: "do",
    lessonId: "hb-specific-conditions-pe",
    sources: [O("ch 5: Pulmonary angiography")],
    refs: OX,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed in this session)
// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "omran-aortic-crossing-emboli-2003",
    kind: "trial",
    citation:
      "Omran H, Schmidt H, Hackenbroch M, et al. Silent and apparent cerebral embolism after retrograde catheterisation of the aortic valve in valvular stenosis: a prospective, randomised study. Lancet. 2003;361:1241–1246.",
    url: "https://doi.org/10.1016/S0140-6736(03)12978-9",
    note: "PMID: 12699950. Authors, title, journal, year, volume (361, issue 9365) and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "stein-pioped-angiography-1992",
    kind: "paper",
    citation: "Stein PD, Athanasoulis C, Alavi A, et al. Complications and validity of pulmonary angiography in acute pulmonary embolism. Circulation. 1992;85:462–468.",
    url: "https://doi.org/10.1161/01.cir.85.2.462",
    note: "PMID: 1735144. Authors, title, journal, year, volume (85, issue 2) and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "esc-pe-2019",
    kind: "guideline",
    citation:
      "Konstantinides SV, Meyer G, Becattini C, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the European Respiratory Society (ERS). Eur Heart J. 2020;41:543–603.",
    url: "https://doi.org/10.1093/eurheartj/ehz405",
    note: "PMID: 31504429. Authors, title, journal, year, volume (41, issue 4) and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "esc-myopericardial-2025",
    kind: "guideline",
    citation:
      "Schulz-Menger J, Collini V, Gröschel J, et al. 2025 ESC Guidelines for the management of myocarditis and pericarditis. Eur Heart J. 2025;46:3952–4041.",
    url: "https://doi.org/10.1093/eurheartj/ehaf192",
    note: "PMID: 40878297. Authors, title, journal, year, volume (46, issue 40) and pages checked on PubMed; constriction sections (4.5.5, 4.5.6) read on the publisher page. Replaces the 2015 ESC pericardial guideline.",
    verified: true,
  },
  {
    id: "aha-acc-pe-2026",
    kind: "guideline",
    citation:
      "Creager MA, Barnes GD, Giri J, et al. 2026 AHA/ACC/ACCP/ACEP/CHEST/SCAI/SHM/SIR/SVM/SVN Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults: A Report of the American College of Cardiology/American Heart Association Joint Committee on Clinical Practice Guidelines. Circulation. 2026;153:e977–e1051.",
    url: "https://doi.org/10.1161/CIR.0000000000001415",
    note: "PMID: 41712677. Authors, title, journal, year, volume (153, issue 12) and pages checked on PubMed; abstract read. Also published in J Am Coll Cardiol. 2026;87:1626–1710 (PMID: 41712898).",
    verified: true,
  },
];
