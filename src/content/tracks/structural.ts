import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Module 1 — Structural imaging and transseptal puncture
// ===========================================================================
const imagingTransseptal: Module = {
  id: "sh-imaging-transseptal",
  title: "Structural imaging and transseptal puncture",
  stage: 4,
  summary:
    "How the structural heart team works, which imaging modality answers which question, the TOE views used every day in the structural lab, and how to perform a safe, procedure-specific transseptal puncture.",
  objectives: [
    "Describe the roles in a structural heart team and the purpose of the Heart Team meeting.",
    "Match TTE, TOE, ICE, CT and fluoroscopy to the questions each answers best.",
    "Recognise the mid-oesophageal and transgastric TOE views used during structural procedures and state what each view shows.",
    "Describe the anatomy of the fossa ovalis and its relations to the aortic root and the free atrial walls.",
    "Perform a stepwise transseptal puncture, using TOE to set superior–inferior position, anterior–posterior position and height.",
    "Recognise and manage aortic puncture, free-wall perforation, air embolism and tamponade.",
  ],
  lessons: [
    {
      id: "sh-team-imaging",
      title: "The structural heart team and its imaging tools",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Structural heart intervention treats valves, septa and the left atrial appendage rather than coronary arteries. The targets are soft tissue, so the procedures are guided by imaging first and fluoroscopy second. This changes the culture of the lab: the operator works inside a team in which the imager often decides whether a device is in the right place.",
        },
        { kind: "h", text: "Who is in the team" },
        {
          kind: "table",
          head: ["Role", "Contribution"],
          rows: [
            ["Interventional cardiologists", "Access, device delivery and procedural decisions; large-bore cases usually have two operators."],
            ["Cardiac surgeon", "Heart Team decision on surgical versus transcatheter treatment; bail-out for annular rupture, ventricular device embolisation or bleeding not controlled percutaneously."],
            ["Imaging cardiologist", "Pre-procedural echo and CT interpretation; intraprocedural TOE or ICE guidance; final assessment of the result."],
            ["Anaesthetist", "General anaesthesia for TOE-guided procedures; sedation for most transfemoral TAVI; haemodynamic support."],
            ["Physiologists, radiographers, nurses", "Haemodynamic recording, temporary pacing, radiation protection, device preparation and counting."],
            ["Heart failure, electrophysiology, stroke and elderly-care colleagues", "Patient selection: optimised therapy before secondary MR treatment, anticoagulation decisions before LAAO, stroke work-up before PFO closure, frailty assessment before TAVI."],
          ],
        },
        {
          kind: "p",
          text: "The Heart Team meeting reviews each case before the procedure: the indication, the competing options (surgery, transcatheter treatment, medical therapy), anatomy, access and the patient's own goals. The ESC/EACTS valvular guidelines make a Heart Team decision a formal recommendation for valve intervention, and the same model is used for LAAO and PFO closure with the relevant specialties.",
        },
        { kind: "h", text: "Which modality answers which question" },
        {
          kind: "table",
          head: ["Modality", "Strengths", "Limitations", "Typical structural use"],
          rows: [
            ["TTE", "Non-invasive and repeatable; gradients, LV and RV function, regurgitation screening", "Poor views of posterior structures in many patients (LAA, septal detail, mitral leaflets)", "Diagnosis and grading; post-TAVI paravalvular leak and gradients; follow-up"],
            ["TOE", "High-resolution views of the LA, LAA, interatrial septum and mitral valve; 3D en-face views", "Needs sedation or general anaesthesia; oesophageal injury; acoustic shadowing from prostheses and calcium", "Transseptal guidance, TEER, LAAO, ASD and PFO closure, paravalvular leak closure"],
            ["ICE (intracardiac echo)", "Operator-controlled probe from a femoral vein; avoids general anaesthesia", "Fewer views; limited 3D; extra venous access; learning curve", "Transseptal puncture, PFO and ASD closure, LAAO in many centres"],
            ["ECG-gated CT", "3D anatomy; annulus, root and appendage dimensions; coronary heights; calcium; access vessels; predicted fluoroscopic angles", "Contrast and radiation; motion and calcium blooming artefact", "TAVI planning (reference standard for annular sizing), LAAO sizing, prediction of LVOT obstruction before TMVR, paravalvular leak localisation"],
            ["Fluoroscopy and angiography", "Real-time wire and device position; aortography; coronary angiography", "Soft tissue invisible; parallax; 2D projection of 3D anatomy", "Every procedure; deployment views"],
            ["Fusion imaging", "Overlays echo or CT landmarks onto live fluoroscopy", "Registration error when the table, C-arm or probe moves", "Transseptal puncture, TEER, LAAO, paravalvular leak closure"],
          ],
        },
        {
          kind: "p",
          text: "Think in three dimensions. Fluoroscopy is a shadow and echo is a slice. Errors happen when one modality is asked a question that only the other can answer: judging LAA device compression on fluoroscopy alone, or judging TAVI implant depth on echo alone when the frame is foreshortened.",
        },
        {
          kind: "keypoints",
          items: [
            "CT is the planning tool for TAVI and increasingly for LAAO; TOE is the guiding tool for left atrial and mitral procedures.",
            "ICE moves imaging control to the operator and avoids general anaesthesia, at the cost of fewer views.",
            "Fusion imaging marks landmarks such as the fossa ovalis or the annular plane on fluoroscopy; it supplements echo, it does not replace it.",
            "If the imager says a device is not safe to release, that outranks the fluoroscopic impression.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a single echo plane as proof of position: confirm in at least two orthogonal planes or with biplane (x-plane) imaging.",
            "Measuring the aortic annulus on non-gated CT: the annulus changes shape through the cardiac cycle and must be measured on ECG-gated images.",
            "Forgetting the probe: long TOE-guided procedures with repeated flexion carry a real risk of oesophageal injury.",
          ],
        },
        {
          kind: "pearl",
          text: "Agree a shared vocabulary before the case. 'Anterior' and 'superior' point in different screen directions on a rotated TOE image and on an LAO fluoroscopic view. Name structures (aorta, SVC, mitral annulus) rather than screen directions.",
        },
      ],
      refs: ["esc-vhd-2021", "scct-tavi-2019", "hanna-pcm"],
    },
    {
      id: "sh-toe-views",
      title: "TOE views used in the structural lab",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "You do not need to drive the probe, but you must recognise the standard views and know which question each one answers. The multiplane angles below are approximate starting points; the imager adjusts them for each patient.",
        },
        {
          kind: "table",
          caption: "Core TOE views for structural intervention",
          head: ["View", "Approximate angle", "What it shows", "Used for"],
          rows: [
            ["Mid-oesophageal four-chamber", "0–10°", "Both atria and ventricles; mitral and tricuspid valves", "Height of the transseptal puncture above the mitral annular plane; MR and TR; posterior and AV-valve rims of an ASD"],
            ["Mid-oesophageal aortic valve short-axis", "About 30–60°", "Aortic valve in cross-section; interatrial septum with the aorta anterior", "Anterior–posterior position of transseptal tenting; aortic and posterior ASD rims; location of paravalvular jets"],
            ["Mid-oesophageal bicaval", "About 90–110°", "SVC, IVC and the interatrial septum between them", "Superior–inferior position of transseptal tenting; SVC and IVC rims of an ASD; PFO tunnel"],
            ["Mid-oesophageal mitral commissural", "About 50–70°", "Medial (P3), central (A2) and lateral (P1) segments", "Medial–lateral position of a TEER device"],
            ["Mid-oesophageal long-axis (LVOT view)", "About 120–140°", "LVOT, aortic valve, A2 and P2", "Anterior–posterior TEER alignment; leaflet grasping and insertion"],
            ["Left atrial appendage sweep", "0°, 45°, 90°, 135°", "LAA ostium, landing zone, depth, lobes, thrombus", "LAAO sizing and release checks"],
            ["Transgastric basal short-axis", "About 0–20°", "Mitral valve from below, line of coaptation", "Orienting TEER device arms perpendicular to the coaptation line"],
            ["3D en-face mitral ('surgeon's view')", "3D", "Valve as seen from the LA, conventionally with the aorta at 12 o'clock", "TEER trajectory and orientation; planning the number and position of devices"],
          ],
        },
        { kind: "h", text: "Biplane and 3D imaging" },
        {
          kind: "p",
          text: "Matrix-array probes allow x-plane (biplane) imaging: two orthogonal planes on screen at once, for example bicaval and short-axis views during transseptal puncture, or commissural and LVOT views during TEER. 3D en-face views show a whole valve or septum from one side and make orientation intuitive, but they have lower frame rate and spatial resolution than 2D. Use 3D to orient and 2D to confirm detail.",
        },
        { kind: "h", text: "Linking echo to fluoroscopy" },
        {
          kind: "list",
          items: [
            "Classical fluoroscopic landmarks for transseptal puncture are the SVC–RA junction, a pigtail in the non-coronary sinus (marking the aortic root) and, in some labs, a coronary sinus catheter.",
            "Echo determines where on the fossa the needle tents; fluoroscopy shows the needle's direction and the 'jumps' during pull-down.",
            "Fusion systems can place a marker on the echo-defined puncture site and display it on fluoroscopy; the marker becomes misleading if the table, C-arm or probe moves after registration.",
          ],
        },
        {
          kind: "keypoints",
          title: "The transseptal triad",
          items: [
            "Bicaval view: superior versus inferior.",
            "Aortic short-axis view: anterior versus posterior (the aorta is anterior).",
            "Four-chamber view: height above the mitral annular plane.",
            "For TEER: commissural view for medial–lateral, LVOT view for anterior–posterior and leaflet insertion, transgastric or 3D en-face for arm orientation.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Shadowing from a prosthetic valve, annular calcium or pacing leads can hide regurgitant jets and devices; ask for an alternative window (deep transgastric, off-axis) rather than assuming there is no jet.",
            "3D gain settings can create apparent holes (dropout) or hide real ones; confirm defects and leaks with 2D colour Doppler.",
            "Mislabelling medial and lateral on a 3D image that has been rotated: agree the orientation (aorta at 12 o'clock) before you use it.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask the imager to say the view and angle aloud each time a new image appears. It trains you, and it stops both of you misreading a rotated plane at a critical step.",
        },
      ],
      refs: ["hanna-pcm", "laao-consensus-2020"],
    },
    {
      id: "sh-transseptal",
      title: "Transseptal puncture",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Transseptal puncture gives venous access to the left atrium. It is the gateway to mitral TEER, LAAO, mitral commissurotomy, transseptal mitral valve-in-valve, antegrade paravalvular leak closure and AF ablation. A well-chosen site makes the procedure easy; a poor one can make it impossible or cause tamponade.",
        },
        { kind: "h", text: "Anatomy" },
        {
          kind: "p",
          text: "The true interatrial septum is small. The fossa ovalis is a thin membranous floor (the remnant of septum primum) surrounded by a muscular rim, the limbus. Much of what looks like septum around it is infolded atrial wall with epicardial fat between the layers: a needle passing through it can leave the heart. Know what lies in each direction from the fossa.",
        },
        {
          kind: "table",
          head: ["Direction from the fossa", "Relation", "Risk if punctured"],
          rows: [
            ["Anterior and superior", "Aortic root (non-coronary sinus), seen as a bulge on the septum", "Aortic puncture"],
            ["Posterior", "Posterior free wall of the atria and the pericardial space", "Free-wall perforation and tamponade"],
            ["Inferior", "IVC orifice and coronary sinus ostium", "Coronary sinus or inferior free-wall perforation"],
            ["Superior", "Infolding between the SVC and the right upper pulmonary vein", "Exit into the pericardium (transverse sinus)"],
          ],
        },
        { kind: "h", text: "Choose the site for the procedure" },
        {
          kind: "p",
          text: "The puncture site sets the angle and the height from which the device approaches its target. Fix it before you cross: a large-bore sheath through a poor site cannot be corrected without a second puncture.",
        },
        {
          kind: "table",
          head: ["Procedure", "Preferred site", "Reason"],
          rows: [
            ["Mitral TEER", "Posterior and mid-to-superior; at least about 4 cm above the mitral annular plane in degenerative MR (four-chamber view), with lower heights (about 3–3.5 cm) acceptable in secondary MR", "Room to steer down onto the valve. A prolapsing or flail segment, with coaptation above the annulus, needs more height; tethered secondary MR, with a deep coaptation point below the annulus, tolerates less."],
            ["LAAO", "Inferior and posterior", "The appendage points anteriorly and superiorly; a low posterior entry gives a coaxial approach."],
            ["Mitral commissurotomy (Inoue)", "Mid-fossa, avoiding a high or anterior site", "The balloon must cross the mitral valve and stay stable."],
            ["AF ablation", "Variable, often mid-to-inferior", "Reach to all four pulmonary veins."],
          ],
        },
        {
          kind: "p",
          text: "These are commonly taught targets. Device manufacturers and individual operators vary, so check device-specific guidance for height targets.",
        },
        {
          kind: "steps",
          title: "Needle technique from the right femoral vein",
          items: [
            { title: "Access and wire", detail: "Ultrasound-guided right femoral venous access; advance a J-tipped wire into the SVC. The right femoral route gives the natural curve to the septum." },
            { title: "Sheath and dilator to the SVC", detail: "Advance the transseptal sheath and dilator over the wire into the SVC. Remove the wire, aspirate and flush." },
            { title: "Needle in", detail: "Advance the transseptal needle inside the dilator, letting it rotate freely through the curves, and stop with the tip just inside the dilator tip. Connect pressure monitoring and flush." },
            { title: "Orient", detail: "Rotate the needle, dilator and sheath together so the needle's direction indicator points posteromedially (often described as about 4 to 5 o'clock viewed from below, with 12 o'clock anterior). From now on move them as one unit." },
            { title: "Pull down", detail: "Withdraw the assembly slowly under fluoroscopy and echo. Expect two leftward jumps: the first as the tip leaves the SVC into the right atrium, the second as it drops off the limbus into the fossa." },
            { title: "Tent and check", detail: "Advance gently until echo shows tenting. Confirm superior–inferior position in the bicaval view, anterior–posterior position in the short-axis view and height in the four-chamber view. To change position, withdraw to the SVC and repeat the pull-down rather than dragging the tip across the septum." },
            { title: "Cross", detail: "Advance the needle out of the dilator. Confirm left atrial position with an LA pressure waveform, oxygenated blood on aspiration, and contrast or saline bubbles appearing in the LA on echo." },
            { title: "Secure", detail: "Advance the dilator, then the sheath, over the needle into the LA, keeping the needle tip inside the dilator once across. Many operators then pass a wire into the left upper pulmonary vein before exchanging to the procedural sheath." },
            { title: "Anticoagulate", detail: "Give unfractionated heparin per local protocol, commonly immediately before or after crossing, and keep the ACT in the target range (often at least 250 seconds for left atrial procedures). Flush and aspirate every left-sided catheter." },
          ],
        },
        { kind: "h", text: "When the septum resists" },
        {
          kind: "list",
          items: [
            "Thick, fibrotic or lipomatous septum (after previous punctures or surgery): radiofrequency (RF) transseptal needles or RF-tipped wires cross with little force and avoid a sudden jump towards the lateral LA wall.",
            "Aneurysmal or very mobile septum: tenting becomes extreme before the needle crosses; RF energy or a sharp-tipped wire limits the excursion.",
            "Previous septal occluder or patch: puncture through native septum beside the device if possible; plan with CT or TOE.",
            "Distorted anatomy (dilated aortic root, large RA, kyphoscoliosis): echo guidance becomes essential rather than optional.",
          ],
        },
        {
          kind: "pitfalls",
          title: "Complications and responses",
          items: [
            "Aortic puncture: do not advance the dilator or sheath while in doubt. Once aortic puncture is confirmed, pull nothing back and call the surgeon before planning further steps; if the patient becomes unstable, exclude tamponade first. A needle-only puncture is usually tolerated if the sheath is not advanced; if the dilator and sheath have entered the aorta, massive haemopericardium may occur, and occluder closure has been described.",
            "Free-wall perforation and tamponade: recognise hypotension and a new effusion early; pericardiocentesis, reversal of heparin with protamine where appropriate, and surgical back-up.",
            "Air embolism: from inadequate flushing or a sheath left open to a low-pressure LA. In a supine patient air tends to enter the right coronary artery, giving inferior ST elevation, bradycardia and hypotension.",
            "Thromboembolism: aspirate and flush all LA catheters and keep the ACT in range.",
            "Iatrogenic ASD: expected after large-bore sheaths; usually small with left-to-right flow and rarely needs closure.",
          ],
        },
        {
          kind: "pearl",
          text: "Never push a needle through resistance unless echo shows tenting at the intended site. If you cannot see where the tip is tenting, you do not know where it will cross.",
        },
      ],
      refs: ["laao-consensus-2020", "esc-pericardial-2015", "hanna-pcm", "russo-transseptal-2021", "brilakis-manual-pci"],
    },
  ],
  quiz: [
    {
      id: "shq-toe-bicaval",
      stem: "During transseptal puncture, which TOE view best shows whether the needle is tenting the superior or the inferior part of the fossa ovalis?",
      options: [
        "Mid-oesophageal bicaval view (about 90–110°)",
        "Mid-oesophageal aortic valve short-axis view (about 30–60°)",
        "Mid-oesophageal four-chamber view (0°)",
        "Transgastric basal short-axis view",
        "Left atrial appendage view at 135°",
      ],
      answer: 0,
      explanation:
        "The bicaval view lays the septum out between the SVC and the IVC, so it shows superior versus inferior position directly. The short-axis view is the tempting distractor: it shows anterior versus posterior position relative to the aorta, not superior versus inferior. The four-chamber view is used for height above the mitral annulus.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-ts-anterior",
      stem: "In the aortic short-axis TOE view, the transseptal needle is tenting the septum immediately beside the aortic root. What is the main danger of crossing here?",
      options: [
        "Puncture of the aortic root",
        "Perforation of the posterior free wall into the pericardium",
        "Perforation of the coronary sinus",
        "Injury to the right upper pulmonary vein",
        "Perforation of the anterior mitral leaflet",
      ],
      answer: 0,
      explanation:
        "The aortic root (non-coronary sinus) lies anterior and superior to the fossa, so anterior tenting next to the aorta risks aortic puncture. Posterior free-wall perforation is a real risk of transseptal puncture, but it follows a posterior site, which is the opposite of what is shown.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-ts-teer-height",
      stem: "You are planning TEER for secondary MR with tethered leaflets and a deep coaptation point. Which transseptal site is most appropriate?",
      options: [
        "Inferior and anterior, about 2 cm above the mitral annular plane",
        "Superior and posterior, at the high end of the usual range (4–4.5 cm)",
        "Mid-fossa and anterior, close to the aortic root, to aim at the valve",
        "Inferior and posterior, the same site as for an LAAO procedure",
        "Any site will do, because the steerable guide compensates for puncture height",
      ],
      answer: 1,
      explanation:
        "TEER needs a superior, posterior puncture with enough height to steer down onto the valve, and a deep tethered coaptation point needs more height. An inferior posterior site suits LAAO, where the appendage points anteriorly and superiorly, but leaves too little room for TEER. The steerable guide cannot fully make up for a low puncture.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-ts-laao-site",
      stem: "Which transseptal puncture site generally gives the most coaxial approach to the left atrial appendage?",
      options: [
        "Superior and anterior",
        "Superior and posterior",
        "Inferior and posterior",
        "Mid-fossa and anterior",
      ],
      answer: 2,
      explanation:
        "The LAA arises anterolaterally and points anteriorly and superiorly, so an inferior posterior puncture lines the sheath up with its axis. A superior posterior site is the TEER puncture and makes the sheath approach the appendage at an angle, making coaxial deployment harder.",
      difficulty: 1,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "shq-ts-aortic-sheath",
      stem: "After a difficult transseptal puncture, pressure from the dilator tip shows an arterial waveform and contrast outlines the ascending aorta. The dilator and sheath have been advanced over the needle. What is the most appropriate immediate action?",
      options: [
        "Withdraw the sheath quickly and give protamine",
        "Leave the dilator and sheath in place, stop further anticoagulation and arrange surgical or percutaneous closure",
        "Withdraw the sheath slowly into the right atrium while injecting contrast",
        "Proceed with the planned procedure through a second puncture and remove the first sheath at the end",
        "Give additional heparin to prevent thrombus on the sheath",
      ],
      answer: 1,
      explanation:
        "A needle-only aortic puncture is usually tolerated after withdrawal, but once a dilator or sheath has entered the aorta, removing it can cause rapid haemorrhage into the pericardium. Leaving it in place as a plug while closure is arranged is safer. Withdrawing quickly is the tempting reflex but converts a controlled problem into tamponade.",
      difficulty: 3,
      refs: ["esc-pericardial-2015", "hanna-pcm"],
    },
    {
      id: "shq-ice-advantage",
      stem: "What is the main practical advantage of intracardiac echocardiography (ICE) over TOE for guiding PFO closure or LAAO?",
      options: [
        "Better 3D imaging of the mitral valve and septum than TOE provides",
        "No general anaesthesia, and the operator controls the probe",
        "It removes the need for fluoroscopy during device positioning",
        "It eliminates the need for any additional venous access",
        "It gives more and better views of the LAA than TOE does in most patients",
      ],
      answer: 1,
      explanation:
        "ICE is placed from a femoral vein and steered by the operator, so procedures can be done under local anaesthesia or light sedation. Its weaknesses are fewer views and limited 3D compared with TOE, so the 3D option is the wrong way round. It needs extra venous access and does not replace fluoroscopy.",
      difficulty: 1,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "shq-air-rca",
      stem: "Shortly after exchanging catheters through a left atrial sheath, the patient develops bradycardia, hypotension and inferior ST elevation. Echo shows no new effusion. What is the most likely cause?",
      options: [
        "Air embolism to the right coronary artery",
        "Tamponade from free-wall perforation",
        "Vasovagal reaction",
        "Anaphylaxis to contrast",
        "Thrombus embolism to the left anterior descending artery",
      ],
      answer: 0,
      explanation:
        "Air entering a left-sided sheath rises to the most anterior structures in a supine patient, and the right coronary ostium is anterior, so inferior ST elevation with bradycardia is typical. Tamponade causes hypotension but an effusion would be visible and ST elevation would not be the leading sign. An LAD embolus would give anterior changes.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
  ],
};

// ===========================================================================
// Module 2 — TAVI: indications and planning
// ===========================================================================
const taviPlanning: Module = {
  id: "sh-tavi-planning",
  title: "TAVI: indications and planning",
  stage: 5,
  summary:
    "Grading aortic stenosis, deciding between TAVI and surgery with the Heart Team, reading a TAVI planning CT (annulus, root, coronary heights, calcium, bicuspid anatomy, access) and choosing between valve designs.",
  objectives: [
    "Grade aortic stenosis, including low-flow low-gradient phenotypes, using the 2021 ESC/EACTS criteria.",
    "State the 2021 ESC/EACTS indications for intervention and the factors that favour TAVI or surgery.",
    "Describe how the aortic annulus is defined and measured on gated CT, and explain the oversizing principle.",
    "Identify CT features that predict coronary obstruction, annular injury, conduction disturbance and access failure.",
    "Compare balloon-expandable and self-expanding, intra-annular and supra-annular valve designs.",
    "Choose an alternative access route when transfemoral access is unsuitable.",
  ],
  lessons: [
    {
      id: "sh-as-severity",
      title: "Aortic stenosis: severity and indications",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Aortic stenosis (AS) in adults is usually calcific degeneration of a tricuspid valve or, in younger patients, of a bicuspid valve. Symptoms (exertional breathlessness, angina, presyncope or syncope) mark a steep rise in risk. Echocardiography grades severity; CT calcium scoring, stress echo and occasionally invasive measurement resolve discordant results.",
        },
        {
          kind: "table",
          caption: "Echocardiographic criteria for severe AS (2021 ESC/EACTS)",
          head: ["Parameter", "Severe AS"],
          rows: [
            ["Peak velocity (Vmax)", "≥4.0 m/s"],
            ["Mean gradient", "≥40 mmHg"],
            ["Aortic valve area (AVA)", "<1.0 cm²"],
            ["Indexed AVA", "<0.6 cm²/m²"],
            ["Velocity ratio (LVOT VTI ÷ aortic VTI)", "<0.25"],
          ],
        },
        { kind: "h", text: "Discordant grading" },
        {
          kind: "p",
          text: "When the AVA is below 1.0 cm² but the mean gradient is below 40 mmHg, first look for measurement error. Underestimating the LVOT diameter is the commonest, and because the area depends on the square of the diameter, a small error produces a large one in AVA. Then classify by flow (stroke volume index, SVi) and ejection fraction.",
        },
        {
          kind: "table",
          head: ["Phenotype", "Definition", "How severity is confirmed"],
          rows: [
            ["High-gradient AS", "Mean gradient ≥40 mmHg, Vmax ≥4.0 m/s", "Severe regardless of LVEF or flow"],
            ["Classical low-flow low-gradient, reduced EF", "LVEF <50%, SVi ≤35 mL/m², mean gradient <40 mmHg", "Low-dose dobutamine echo. True severe AS: AVA stays ≤1.0 cm² while the gradient rises to ≥40 mmHg. Pseudo-severe AS: AVA rises above 1.0 cm². No flow reserve (stroke volume rises by less than 20%): the test is inconclusive and CT calcium scoring helps."],
            ["Paradoxical low-flow low-gradient, preserved EF", "LVEF ≥50%, SVi ≤35 mL/m², mean gradient <40 mmHg", "Integrated assessment: small hypertrophied LV, typical patient profile, measurement checks, CT calcium score"],
            ["Normal-flow low-gradient, preserved EF", "LVEF ≥50%, SVi >35 mL/m², mean gradient <40 mmHg", "Usually moderate AS; re-check measurements"],
          ],
        },
        {
          kind: "table",
          caption: "CT aortic valve calcium score (Agatston units) in the 2021 ESC/EACTS guideline",
          head: ["Likelihood of severe AS", "Men", "Women"],
          rows: [
            ["Highly likely", "≥3000", "≥1600"],
            ["Likely", "≥2000", "≥1200"],
            ["Unlikely", "<1600", "<800"],
          ],
        },
        {
          kind: "p",
          text: "Women have less valve calcium than men for the same haemodynamic severity, so the thresholds are sex-specific. A calcium score is a non-contrast scan and does not replace the contrast CT needed for TAVI planning.",
        },
        { kind: "h", text: "When to intervene (2021 ESC/EACTS)" },
        {
          kind: "list",
          items: [
            "Symptomatic severe high-gradient AS: intervention recommended.",
            "Symptomatic low-flow low-gradient AS with reduced EF and flow reserve: intervention recommended. Without flow reserve, intervention should be considered when CT calcium scoring confirms severe AS.",
            "Symptomatic low-flow low-gradient AS with preserved EF: intervention should be considered after careful confirmation of severity.",
            "Asymptomatic severe AS with LVEF below 50% not explained by another cause, or symptoms unmasked on exercise testing: intervention recommended.",
            "Asymptomatic severe AS at low procedural risk with high-risk features (LVEF below 55%, very severe AS, markedly raised natriuretic peptide, rapid progression, or a fall in blood pressure during exercise testing): intervention should be considered.",
            "Intervention is not recommended when severe comorbidity makes improvement in quality of life or survival unlikely.",
          ],
        },
        {
          kind: "p",
          text: "Version note: this lesson describes the 2021 ESC/EACTS guideline. Randomised trials of early intervention in asymptomatic severe AS have reported since then, and the 2025 ESC/EACTS update revisited several of these recommendations. Check the current version before quoting class-level detail.",
        },
        {
          kind: "keypoints",
          items: [
            "Confirm severity with more than one parameter, and check the LVOT diameter first when results are discordant.",
            "In low-flow states, dobutamine echo (reduced EF) or CT calcium scoring (either EF) separates true severe from pseudo-severe AS.",
            "Calcium thresholds are sex-specific: women have lower values for equal severity.",
            "Symptoms, LV dysfunction and high-risk markers drive the timing of intervention.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Calling moderate AS in a patient with a low gradient without checking the stroke volume index.",
            "Grading AS during uncontrolled hypertension: high afterload can lower the measured gradient; reassess once blood pressure is controlled.",
            "Attributing breathlessness to AS without considering coexisting coronary, pulmonary or mitral disease.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "esc-vhd-2025", "hanna-pcm"],
    },
    {
      id: "sh-tavi-vs-savr",
      title: "TAVI or surgery: the Heart Team decision",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "TAVI began as a treatment for patients who could not have surgery and has since been tested in progressively lower-risk populations. In low-risk patients, PARTNER 3 (a balloon-expandable valve) found TAVI superior to surgery for a composite of death, stroke and rehospitalisation at one year, and Evolut Low Risk (a self-expanding valve) found TAVI non-inferior to surgery for death or disabling stroke. Longer follow-up continues to accumulate; durability in younger patients remains the central uncertainty.",
        },
        {
          kind: "table",
          caption: "Mode of intervention in the 2021 ESC/EACTS guideline",
          head: ["Patient group", "Recommended approach"],
          rows: [
            ["Age 75 years or older, or high surgical risk (STS-PROM or EuroSCORE II above 8%), or unsuitable for surgery", "TAVI"],
            ["Age below 75 years and low surgical risk (STS-PROM or EuroSCORE II below 4%)", "Surgical AVR (SAVR)"],
            ["Operable but unsuitable for transfemoral TAVI", "SAVR"],
            ["All other patients", "SAVR or TAVI according to individual clinical, anatomical and procedural factors, decided by the Heart Team"],
            ["Inoperable and unsuitable for transfemoral TAVI", "Non-transfemoral TAVI may be considered"],
          ],
        },
        {
          kind: "p",
          text: "Version note: the 2025 ESC/EACTS update revised this age- and risk-based framework. Its text now recommends TAVI as the primary treatment in patients aged 70 or over with a tricuspid valve, suitable anatomy and feasible transfemoral access, and prefers surgery under 70 when surgical risk is low; other candidates are decided by the Heart Team (taught in hb-tavi-candidate). The principle is unchanged: age and life expectancy, surgical risk, anatomy and the patient's preference are weighed together, and transfemoral TAVI is the default transcatheter route.",
        },
        {
          kind: "table",
          caption: "Factors in the Heart Team discussion",
          head: ["Favours TAVI", "Favours SAVR"],
          rows: [
            ["Older age, limited life expectancy", "Younger age, long life expectancy (durability and lifetime management)"],
            ["Frailty, restricted mobility", "Need for other cardiac surgery: complex coronary disease for CABG, severe primary MR, severe TR, aortic aneurysm, septal myectomy"],
            ["Previous cardiac surgery, especially patent grafts at risk at resternotomy", "Inadequate access for transfemoral TAVI"],
            ["Porcelain aorta, sequelae of chest radiation, severe chest deformity", "Annulus outside the range of available transcatheter valves"],
            ["Small annulus with expected patient–prosthesis mismatch after surgery", "High risk of coronary obstruction (low ostia, narrow sinuses, bulky leaflets)"],
            ["Feasible transfemoral access", "Bicuspid valve with unfavourable anatomy, heavy LVOT calcium, LV thrombus, active endocarditis"],
          ],
        },
        { kind: "h", text: "Lifetime management" },
        {
          kind: "p",
          text: "A 65-year-old may outlive the first bioprosthesis. Plan the second and third procedures at the first: a surgical valve large enough for later valve-in-valve, or a transcatheter valve whose frame height and commissural orientation will allow coronary access and a later TAV-in-TAV without sealing off the sinuses. Younger patients with bicuspid valves and a dilated ascending aorta are often better served by surgery that treats both.",
        },
        {
          kind: "keypoints",
          items: [
            "The decision is shared between the Heart Team and the patient, with the options documented.",
            "Transfemoral TAVI is the default transcatheter route; alternative access narrows the margin of benefit over surgery.",
            "In a small annulus, TAVI (particularly with a supra-annular valve) avoids the patient–prosthesis mismatch a small surgical valve may cause.",
            "Frailty and cognition determine whether the patient benefits as much as the valve haemodynamics do.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating the valve and ignoring frailty, cognitive impairment or comorbidity that will limit recovery.",
            "Choosing TAVI for a young patient with a bicuspid valve and dilated aorta without a surgical opinion.",
            "Ignoring significant coronary disease in planning: decide whether and when it needs treatment.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "esc-vhd-2025", "partner3-2019", "evolut-low-risk-2019"],
    },
    {
      id: "sh-tavi-ct",
      title: "Reading a TAVI planning CT",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "CT is the reference standard for annular sizing and for predicting procedural risk. The SCCT expert consensus describes acquisition and measurement. The protocol combines an ECG-gated acquisition of the aortic root, measured in systole when the annulus is largest, with a CT angiogram of the aorta and iliofemoral arteries down to the femoral heads.",
        },
        { kind: "h", text: "The annulus" },
        {
          kind: "p",
          text: "The 'annulus' used for TAVI is a virtual ring through the basal hinge points (nadirs) of the three cusps. It is usually oval, so a single diameter misrepresents it. Measure area, perimeter, minimum and maximum diameters, and the mean diameters derived from area and perimeter.",
        },
        {
          kind: "p",
          text: "Each valve's instructions for use (IFU) map these measurements to valve sizes. Balloon-expandable valves are usually sized by area and self-expanding valves by perimeter. The aim is modest oversizing: enough radial force to anchor the frame and seal paravalvular gaps, not so much that the annulus or LVOT tears or the conduction system is compressed. When a measurement falls between sizes, weigh calcium distribution, LVOT shape, sinus size and coronary height. The IFU sets the ranges, and they change between device generations.",
        },
        {
          kind: "table",
          caption: "Root measurements and why they matter",
          head: ["Measurement", "What it predicts"],
          rows: [
            ["Annulus area and perimeter", "Valve size. Undersizing leads to paravalvular leak and embolisation; oversizing to annular rupture and conduction disturbance."],
            ["Coronary heights (annular plane to the lower edge of each ostium)", "Coronary obstruction; low heights (commonly cited as below about 10–12 mm) raise the risk."],
            ["Sinus of Valsalva diameters", "Space for the displaced leaflets; narrow sinuses (mean diameter below about 30 mm) raise obstruction risk."],
            ["Sino-tubular junction (STJ) height and diameter", "Sinus sequestration if displaced leaflets seal a low, narrow STJ; interaction with tall self-expanding frames."],
            ["Leaflet length and bulk", "Whether a displaced leaflet can reach above a coronary ostium."],
            ["Calcium volume and distribution (leaflets, annulus, LVOT)", "Paravalvular leak from bulky nodules; annular rupture with LVOT calcium, particularly with balloon-expandable valves."],
            ["Membranous septum length", "A short membranous septum combined with a deep implant predicts conduction disturbance and pacemaker need."],
            ["Ascending aorta diameter and angulation", "Associated aortopathy (bicuspid); delivery and coaxial alignment."],
            ["Predicted coplanar angles", "Fluoroscopic projections in which the three hinge points line up, reducing contrast and time on the table."],
          ],
        },
        { kind: "h", text: "Bicuspid anatomy" },
        {
          kind: "p",
          text: "Bicuspid valves are commonly classified (Sievers) by the number of raphes: type 0 with no raphe and two true sinuses, type 1 with one raphe (most often fusing the left and right coronary cusps), and type 2 with two raphes. For TAVI they bring larger and more elliptical annuli, calcified raphes, asymmetric calcium and associated aortopathy. Frames may expand asymmetrically and the narrowest point can lie above the annulus, so some centres also assess dimensions at the level of the commissures or raphe. Results are best in carefully selected anatomy, and younger patients or those with dilated aortas should have a surgical opinion.",
        },
        { kind: "h", text: "Access" },
        {
          kind: "p",
          text: "Assess the entire iliofemoral course: minimal luminal diameter, calcification (especially circumferential calcium), tortuosity, and the common femoral puncture zone (above the femoral bifurcation, below the inferior epigastric artery, with an anterior wall free of calcium). Compare the minimal luminal diameter with the outer diameter of the planned sheath from the IFU. A sheath larger than the vessel (sheath-to-femoral artery ratio above about 1.05) has been associated with more major vascular complications, and calcified vessels tolerate less mismatch than soft ones.",
        },
        {
          kind: "table",
          caption: "Alternative access",
          head: ["Route", "Notes"],
          rows: [
            ["Trans-subclavian or trans-axillary", "Percutaneous or surgical cut-down; check vessel size and, on the left, a patent LIMA graft"],
            ["Transcarotid", "Short, direct route; needs assessment of the cerebral circulation"],
            ["Transcaval", "Femoral vein to abdominal aorta crossing, closed with an occluder; specialised centres"],
            ["Direct aortic and transapical", "Surgical approaches; transapical TAVI has largely been abandoned in many centres because of higher morbidity"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "The annulus is a virtual ring through the cusp nadirs, measured on systolic gated images; report area, perimeter and diameters.",
            "Low coronary height, narrow sinuses and long bulky leaflets together predict coronary obstruction better than any one alone.",
            "LVOT calcium combined with balloon-expandable oversizing is the classical setting for annular rupture.",
            "Access is planned on CT; ultrasound guides the puncture.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring in the wrong phase or in an oblique plane that misses a hinge point, which makes the annulus appear larger or smaller than it is.",
            "Reading coronary height alone and ignoring sinus width and leaflet length.",
            "Sizing from memory: device ranges change between generations, so check the current IFU for every case.",
          ],
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "On the CT planning screen, define the annular plane through the three hinge points, record area and perimeter, measure both coronary heights and the sinus widths, then choose a valve size from the sizing chart and state why.",
        },
      ],
      refs: ["scct-tavi-2019", "esc-vhd-2021", "sievers-bav-2007", "hayashida-vascular-2011"],
    },
    {
      id: "sh-tavi-valves",
      title: "Transcatheter valve designs",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "All transcatheter valves are bioprostheses (animal pericardial leaflets) mounted in a metal frame that anchors by radial force against the calcified annulus. The two main families differ in how they expand and where the leaflets sit.",
        },
        {
          kind: "table",
          head: ["Feature", "Balloon-expandable (intra-annular)", "Self-expanding (mostly supra-annular)"],
          rows: [
            ["Frame", "Short cobalt–chromium frame expanded by a balloon", "Nitinol frame that expands at body temperature; supra-annular designs have a tall frame reaching into the ascending aorta"],
            ["Leaflet position", "Within the annulus", "Above the annulus (supra-annular) or within it (intra-annular self-expanding designs)"],
            ["Deployment", "Single inflation under rapid pacing; cannot be repositioned once inflation starts", "Gradual controlled release; most can be recaptured and repositioned before full release, within IFU limits"],
            ["Haemodynamics", "Good; gradients can be higher in small annuli", "Larger effective orifice and lower gradients, especially in small annuli and valve-in-valve"],
            ["Conduction disturbance", "Lower pacemaker rates in most series", "Higher pacemaker rates in most series, related to depth and radial force"],
            ["Annular rupture", "Higher risk, particularly with LVOT calcium and oversizing", "Lower risk"],
            ["Later coronary access", "Usually easier (short frame)", "Can be harder, especially if commissures are not aligned"],
            ["Examples", "SAPIEN family, Myval", "Evolut family (supra-annular), Navitor (intra-annular)"],
          ],
        },
        {
          kind: "p",
          text: "Device portfolios change and some designs have been withdrawn from the market. Check what is available locally and use the current IFU.",
        },
        { kind: "h", text: "Commissural alignment" },
        {
          kind: "p",
          text: "If the neo-commissures of the new valve land in front of the coronary ostia, a commissural post and leaflet sit directly in front of the coronary, making later angiography, PCI or redo-TAVI harder. Most current systems have a marker or a recommended delivery-system orientation that improves alignment with the native commissures. Treat alignment as a planning step, not an afterthought.",
        },
        { kind: "h", text: "Haemodynamic terms you will meet" },
        {
          kind: "table",
          head: ["Term", "Meaning"],
          rows: [
            ["Effective orifice area (EOA)", "The functional opening of the new valve, calculated on echo by the continuity equation"],
            ["Patient–prosthesis mismatch (PPM)", "EOA too small for the patient's body size, judged on the EOA indexed to body surface area; associated with higher gradients and less symptomatic benefit. Standardised (VARC-3) thresholds grade it moderate or severe and use lower cut-offs in obese patients."],
            ["Structural valve deterioration", "Intrinsic leaflet degeneration (calcification, thickening, tears) leading to stenosis or regurgitation over years"],
            ["Bioprosthetic valve dysfunction", "A broader term that includes structural deterioration, non-structural problems (PVL, PPM), thrombosis and endocarditis"],
          ],
        },
        {
          kind: "p",
          text: "Randomised follow-up beyond five years, mostly in older patients, has not shown worse durability for transcatheter valves than for surgical bioprostheses, but long-term behaviour in younger patients remains less certain. This is one reason lifetime planning matters.",
        },
        {
          kind: "keypoints",
          items: [
            "Small annulus and need for a low gradient: supra-annular self-expanding valves.",
            "Heavy LVOT calcium: avoid aggressive balloon-expandable oversizing.",
            "Wish to assess before committing (for example coronary risk): a recapturable valve.",
            "Plan coronary access and the second valve from the start, particularly in younger patients.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming any valve suits any annulus: each design has its own sizing table and anatomical limits.",
            "Treating recapturability as protection against every problem: coronary obstruction or embolisation can still occur after full release.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask 'what will the second valve be?' before choosing the first.",
        },
      ],
      refs: ["scct-tavi-2019", "partner3-2019", "evolut-low-risk-2019", "esc-vhd-2021", "genereux-varc3-2021"],
    },
  ],
  quiz: [
    {
      id: "shq-as-lflg",
      stem: "A 76-year-old man has LVEF 30%, AVA 0.8 cm², mean gradient 28 mmHg and SVi 28 mL/m². On low-dose dobutamine echo, stroke volume rises by 30%, mean gradient rises to 44 mmHg and AVA is 0.9 cm². What is the interpretation?",
      options: [
        "True severe AS with flow reserve",
        "Pseudo-severe AS",
        "Severe AS without flow reserve; dobutamine result inconclusive",
        "Moderate AS with LV dysfunction from another cause",
        "Normal-flow low-gradient AS",
      ],
      answer: 0,
      explanation:
        "Stroke volume rose by more than 20% (flow reserve present), the gradient reached 40 mmHg or more and the AVA stayed at or below 1.0 cm², which defines true severe AS. Pseudo-severe AS is the tempting answer, but in that case the AVA would rise above 1.0 cm² as flow increased while the gradient stayed low.",
      difficulty: 2,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-as-calcium",
      stem: "A 79-year-old woman with LVEF 62%, SVi 31 mL/m², mean gradient 32 mmHg and AVA 0.8 cm² has a CT aortic valve calcium score of 1800 Agatston units. Using the 2021 ESC/EACTS thresholds, how is this interpreted?",
      options: [
        "Severe AS highly likely",
        "Severe AS unlikely because the score is below 2000",
        "Severe AS unlikely because the gradient is below 40 mmHg",
        "Indeterminate; invasive measurement is mandatory",
      ],
      answer: 0,
      explanation:
        "For women the threshold for severe AS being highly likely is 1600 Agatston units, so 1800 supports severe paradoxical low-flow low-gradient AS. The distractor of 2000 applies the male 'likely' threshold; using male thresholds in women underestimates severity.",
      difficulty: 2,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-tavi-mode",
      stem: "An 80-year-old man with symptomatic severe AS has EuroSCORE II 3%, a tricuspid valve, good transfemoral access and no other cardiac disease needing surgery. Following the 2021 ESC/EACTS guideline, which approach is recommended?",
      options: [
        "Transfemoral TAVI",
        "SAVR because surgical risk is low",
        "Either, with no guideline preference",
        "Balloon aortic valvuloplasty then reassess",
        "Medical therapy until symptoms worsen",
      ],
      answer: 0,
      explanation:
        "In the 2021 guideline, age 75 or older is enough to favour TAVI when transfemoral access is feasible, whatever the surgical risk score. Low risk alone points to SAVR only in patients younger than 75. Later guideline versions revised the thresholds, so check the current one.",
      difficulty: 1,
      refs: ["esc-vhd-2021", "esc-vhd-2025"],
    },
    {
      id: "shq-annulus-def",
      stem: "How is the aortic 'annulus' defined for TAVI sizing on CT?",
      options: [
        "The narrowest point of the left ventricular outflow tract",
        "A virtual ring joining the basal hinge points (nadirs) of the three cusps",
        "The level of the sino-tubular junction",
        "The line joining the three commissures",
        "The level of the coronary ostia",
      ],
      answer: 1,
      explanation:
        "The TAVI annulus is the virtual basal ring through the lowest hinge points of the three cusps, measured in systole on gated CT. The line through the commissures sits much higher, at the top of the leaflets near the STJ, and is not the sizing plane.",
      difficulty: 1,
      refs: ["scct-tavi-2019"],
    },
    {
      id: "shq-coro-risk",
      stem: "Which CT combination carries the highest risk of coronary obstruction during native-valve TAVI?",
      options: [
        "Left main height 15 mm, mean sinus diameter 34 mm, short thin leaflets, tricuspid valve",
        "Left main height 9 mm, sinus diameter 27 mm, long bulky calcified left leaflet",
        "Left main height 13 mm, mean sinus diameter 32 mm, heavy LVOT calcium below the annulus",
        "Right coronary height 14 mm, mean sinus diameter 31 mm, bicuspid valve with a raphe",
      ],
      answer: 1,
      explanation:
        "Low coronary height, narrow sinuses and a long, bulky leaflet that can be pushed up in front of the ostium together define the high-risk root. Heavy LVOT calcium is a real risk factor, but for annular rupture and paravalvular leak rather than coronary obstruction.",
      difficulty: 2,
      refs: ["scct-tavi-2019", "ribeiro-coronary-obstruction-2013"],
    },
    {
      id: "shq-rupture-risk",
      stem: "Which combination most increases the risk of annular rupture during TAVI?",
      options: [
        "Self-expanding valve, mild undersizing, no LVOT calcium",
        "Balloon-expandable valve, generous area oversizing, bulky LVOT calcium",
        "Self-expanding valve, deep implant, pre-existing RBBB",
        "Balloon-expandable valve, high implant, large sinuses",
      ],
      answer: 1,
      explanation:
        "Annular rupture is mainly a balloon-expandable problem, made more likely by oversizing and by calcium in the LVOT that concentrates force on the tissue. Deep implant and RBBB are risk factors for conduction disturbance, not rupture.",
      difficulty: 2,
      refs: ["scct-tavi-2019"],
    },
    {
      id: "shq-small-annulus",
      stem: "A 78-year-old woman with a small annulus is being planned for TAVI. Which design is most likely to give the lowest residual transvalvular gradient?",
      options: [
        "A supra-annular self-expanding valve",
        "An intra-annular balloon-expandable valve deliberately oversized by two sizes",
        "Surgical replacement with the smallest available stented valve",
        "Balloon aortic valvuloplasty alone",
      ],
      answer: 0,
      explanation:
        "Supra-annular leaflets sit above the narrow annulus, giving a larger effective orifice and lower gradients in small annuli. Oversizing a balloon-expandable valve by two sizes does not solve the problem and greatly raises the risk of annular rupture. A small surgical valve risks patient–prosthesis mismatch.",
      difficulty: 2,
      refs: ["scct-tavi-2019", "esc-vhd-2021"],
    },
    {
      id: "shq-access-ct",
      stem: "CT shows a minimal iliac luminal diameter smaller than the outer diameter of the planned sheath, with circumferential calcium. What is the most appropriate plan?",
      options: [
        "Proceed transfemorally as planned; the sheath will dilate the artery as it goes in",
        "Heart Team review beforehand: alternative access or planned iliac treatment",
        "Use the same side but choose a longer sheath that reaches beyond the stenosis",
        "Proceed on that side and keep a covered stent of the right size in the room",
      ],
      answer: 1,
      explanation:
        "A sheath larger than a circumferentially calcified vessel risks rupture or dissection, so the route should be changed or the vessel prepared as a planned decision before the day. Having a covered stent ready is good practice for any case, but it is a bail-out, not a plan that justifies a predictable injury.",
      difficulty: 2,
      refs: ["scct-tavi-2019"],
    },
  ],
  caseIds: ["sh-case-tavi-low-left-main"],
  sims: [
    {
      sim: "tavi",
      task: "Plan a TAVI from CT: define the annulus, measure coronary heights and sinus widths, check iliofemoral diameters against the sheath size, and choose valve type and size.",
    },
  ],
};

// ===========================================================================
// Module 3 — TAVI: the procedure step by step
// ===========================================================================
const taviProcedure: Module = {
  id: "sh-tavi-procedure",
  title: "TAVI: the procedure step by step",
  stage: 5,
  summary:
    "Transfemoral TAVI from access to closure: large-bore access and pre-closure, pacing, crossing the stenotic valve, the stiff LV wire, selective predilatation, deployment projections, rapid pacing, implant depth, post-deployment assessment and antithrombotic therapy afterwards.",
  objectives: [
    "Plan and obtain large-bore femoral access with a closure and bail-out strategy.",
    "Set up temporary pacing and confirm capture before it is needed.",
    "Cross a stenotic aortic valve safely and place a pre-shaped stiff wire in the LV.",
    "Select and confirm the coplanar three-cusp and cusp-overlap deployment views.",
    "Deploy at the intended depth with appropriate pacing and assess the result haemodynamically and with imaging.",
    "Prescribe antithrombotic therapy after TAVI according to the 2021 ESC/EACTS guideline.",
  ],
  lessons: [
    {
      id: "sh-tavi-setup",
      title: "Access, pacing and crossing the valve",
      minutes: 8,
      blocks: [
        {
          kind: "steps",
          title: "Setting up a transfemoral TAVI",
          items: [
            { title: "Pre-procedure checks", detail: "Heart Team decision documented; CT plan in the lab (valve type and size, coplanar angles, coronary risk, access side); consent; antibiotic prophylaxis; blood group and save; anaesthetic plan (local anaesthesia with or without sedation for most transfemoral cases)." },
            { title: "Secondary arterial access", detail: "Radial or contralateral femoral access for a pigtail catheter in the non-coronary sinus, used for aortography and as a marker of the annular plane. A femoral secondary access also allows crossover angiography and bail-out of the main access." },
            { title: "Main access", detail: "Ultrasound-guided anterior-wall puncture of the common femoral artery on the planned side, above the bifurcation and below the inferior epigastric artery, confirmed with crossover angiography or fluoroscopic landmarks." },
            { title: "Closure strategy", detail: "Pre-close with two suture-based devices placed at different angles before dilating the artery, or plan a plug-based closure device. Then dilate serially and insert the large-bore sheath over a stiff wire." },
            { title: "Anticoagulation", detail: "Unfractionated heparin per local protocol, commonly to an ACT of at least 250 seconds. Many centres reverse with protamine at the end." },
            { title: "Pacing", detail: "Either a temporary wire in the RV via a femoral or jugular vein, or pacing through the stiff LV wire (pacing lead clipped to the wire, return electrode on the skin). Test capture and the blood pressure response before the delivery system enters the patient." },
            { title: "Cross the valve", detail: "Use an Amplatz left (AL1 or AL2) or similar catheter with a straight-tip 0.035-inch wire, probing the orifice with small advances and rotations. An AL1 or right Judkins often suits a vertical root and an AL2 a horizontal one. Never force the wire: leaflet perforation and root dissection are possible." },
            { title: "Exchange", detail: "Advance the catheter into the LV, exchange for a pigtail over an exchange-length J-wire, and record LV and aortic pressures if needed. Then place the pre-shaped stiff wire." },
          ],
        },
        {
          kind: "p",
          text: "The stiff LV wire carries the whole delivery system. Its curve should sit at the apex without pushing into it, spreading the force and keeping the system coaxial. Check its position in two views. A wire trapped in the mitral chords has a curve that does not move freely with the heart and can cause severe MR or chordal rupture.",
        },
        { kind: "h", text: "Predilatation" },
        {
          kind: "p",
          text: "Balloon predilatation was routine in early TAVI and is now selective. Common reasons are a critically stenotic or heavily calcified valve that the delivery system cannot cross, bicuspid anatomy (to see how the leaflets open), and assessment of coronary-obstruction risk: balloon inflation with simultaneous root aortography shows whether the displaced leaflet comes close to the coronary ostium. Predilatation is performed under rapid pacing and can cause acute severe aortic regurgitation, so the valve should be ready to deploy promptly.",
        },
        {
          kind: "keypoints",
          items: [
            "Two arterial accesses: the main valve access and a secondary access for the pigtail, crossover angiography and bail-out.",
            "Test the pacing system before you need it.",
            "A stable, atraumatic stiff-wire curve at the apex is the foundation of a controlled deployment.",
            "Predilatation is a tool for specific problems, not a routine step.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Losing LV wire position with the delivery system in the aorta: the wire is the safety line for every later step.",
            "A high femoral puncture above the inguinal ligament cannot be compressed or reliably closed and causes retroperitoneal bleeding.",
            "Ventricular ectopy from the wire tip during deployment can displace a balloon-expandable valve; reshape or reposition the wire first.",
          ],
        },
      ],
      refs: ["scct-tavi-2019", "esc-vhd-2021", "hanna-pcm"],
    },
    {
      id: "sh-tavi-deploy",
      title: "Deployment views, pacing and implant depth",
      minutes: 9,
      blocks: [
        { kind: "h", text: "Projections" },
        {
          kind: "p",
          text: "Predicted angles come from the planning CT and are confirmed with an aortogram through the pigtail. Two views are used.",
        },
        {
          kind: "table",
          head: ["View", "Appearance", "Main use"],
          rows: [
            ["Coplanar three-cusp view", "All three cusp nadirs in one line: non-coronary cusp on the left, right coronary cusp in the middle, left coronary cusp on the right (usually an LAO projection with some cranial or caudal angulation)", "Classical deployment view, showing the annular plane without parallax"],
            ["Cusp-overlap view", "Right and left coronary cusps superimposed, non-coronary cusp isolated (usually RAO caudal)", "Elongates the LVOT and removes parallax of the delivery catheter. Depth is read on the non-coronary side, close to the membranous septum. Widely used for self-expanding valves."],
          ],
        },
        {
          kind: "p",
          text: "Keep the pigtail resting at the floor of the non-coronary sinus. It then marks the annular level throughout deployment.",
        },
        { kind: "h", text: "Pacing during deployment" },
        {
          kind: "table",
          head: ["Valve type", "Typical pacing", "Purpose"],
          rows: [
            ["Balloon-expandable", "Rapid ventricular pacing during inflation (commonly about 160–200 beats/min), fast enough to drop systolic pressure to a low level (often below about 60 mmHg) with loss of pulsatility", "Stops forward ejection that would push the balloon and valve into the aorta"],
            ["Self-expanding", "Often moderate-rate pacing (around 100–120 beats/min) during the early, critical phase of release, depending on device and operator", "Reduces motion while the frame first contacts the annulus"],
          ],
        },
        {
          kind: "p",
          text: "These are typical figures; follow your institution's protocol and the device IFU. Stop pacing only once a balloon-expandable valve is fully expanded and the balloon deflated, or once a self-expanding valve is stable, and let the blood pressure recover before the next manoeuvre.",
        },
        {
          kind: "figure",
          id: "tavi-depth",
          caption: "Implant depth is measured from the annular plane (the line through the cusp nadirs, marked by the pigtail in the non-coronary sinus) to the ventricular end of the frame, on both the non-coronary and the left coronary side.",
        },
        { kind: "h", text: "Implant depth" },
        {
          kind: "table",
          head: ["Position", "Consequences"],
          rows: [
            ["Too high (aortic)", "Embolisation into the aorta; paravalvular leak beneath the sealing skirt; coronary obstruction from displaced leaflets; difficult coronary access"],
            ["Optimal", "Sealing skirt across the annulus; stable anchoring; minimal contact with the membranous septum and anterior mitral leaflet"],
            ["Too low (ventricular)", "Conduction disturbance from compression of the membranous septum and conduction tissue; paravalvular leak above the sealing zone; interference with the anterior mitral leaflet; embolisation into the LV"],
          ],
        },
        {
          kind: "p",
          text: "The target differs by design and is defined in each IFU. For self-expanding supra-annular valves, the target is a few millimetres below the annulus (commonly quoted as about 3–5 mm), read in the cusp-overlap view. For balloon-expandable valves, the IFU specifies alignment of a balloon or frame marker with the annular plane; contemporary practice tends towards a slightly higher position than early practice to reduce conduction disturbance. Check the current IFU for the exact target.",
        },
        {
          kind: "steps",
          title: "Balloon-expandable deployment (outline)",
          items: [
            { title: "Position", detail: "Cross the native valve with the delivery system and align the valve with the annulus in the coplanar view using the frame and balloon markers." },
            { title: "Check", detail: "Confirm the stiff wire is stable and that pacing captures." },
            { title: "Pace and inflate", detail: "Start rapid pacing; once pressure has fallen and pulsatility is lost, inflate slowly and steadily to the full volume." },
            { title: "Deflate", detail: "Hold briefly, deflate fully, then stop pacing." },
            { title: "Reassess", detail: "Withdraw the balloon into the aorta and assess position, regurgitation and haemodynamics." },
          ],
        },
        {
          kind: "steps",
          title: "Self-expanding deployment (outline)",
          items: [
            { title: "Position", detail: "Set the cusp-overlap view and place the valve at the planned depth, confirmed with a contrast injection." },
            { title: "Begin release", detail: "Unsheathe slowly; consider moderate pacing as the frame reaches the annulus." },
            { title: "Pause at annular contact", detail: "Check depth and stability on aortography before the point of no recapture." },
            { title: "Correct if needed", detail: "If too deep or too high, recapture and reposition within the IFU limits." },
            { title: "Release", detail: "Complete release and confirm that the delivery system disengages cleanly without pulling the valve." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Coplanar three-cusp view: NCC left, RCC middle, LCC right. Cusp-overlap view: NCC isolated, RCC and LCC superimposed.",
            "The pigtail at the floor of the NCC is the annular marker.",
            "Too high risks embolisation and coronary obstruction; too low risks conduction disturbance, paravalvular leak and mitral interference.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stopping rapid pacing before a balloon-expandable valve is fully expanded: the valve can be ejected into the aorta.",
            "Loss of capture during inflation has the same effect; confirm capture beforehand and watch the pressure trace throughout.",
            "Judging depth in a view with parallax, where the two edges of the frame are not superimposed, under- or overestimates depth.",
          ],
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "Set the cusp-overlap view, position a self-expanding valve with its inflow about 3 mm below the annular plane, pause at annular contact to check depth on aortography, then complete release.",
        },
      ],
      refs: ["scct-tavi-2019", "esc-vhd-2021"],
    },
    {
      id: "sh-tavi-assess",
      title: "Assessing the result, closure and aftercare",
      minutes: 8,
      blocks: [
        { kind: "h", text: "Immediate assessment" },
        {
          kind: "table",
          head: ["Check", "How", "What to act on"],
          rows: [
            ["Paravalvular regurgitation", "Root aortography in the deployment view; TTE or TOE colour Doppler for location and extent; haemodynamics", "More than mild: find the cause (undersizing, malposition, underexpansion, calcium) and correct it"],
            ["Haemodynamics", "Simultaneous LV and aortic pressures: gradient, LVEDP, aortic diastolic pressure", "Low aortic diastolic pressure with a high LVEDP suggests significant regurgitation"],
            ["Valve function", "Echo gradient and leaflet motion", "A raised gradient suggests underexpansion, malposition, thrombus or patient–prosthesis mismatch"],
            ["Coronary flow", "Aortography, ECG, regional wall motion", "Any doubt: selective coronary angiography"],
            ["Conduction", "ECG and rhythm strip once pacing stops", "New LBBB or high-degree AV block: keep the pacing wire and monitor"],
            ["Pericardium", "Echo", "New effusion: consider annular rupture or LV or RV perforation"],
            ["Mitral valve", "Echo", "New MR from a deep frame contacting the anterior leaflet"],
          ],
        },
        {
          kind: "formula",
          name: "Aortic regurgitation index",
          expr: "ARI = (aortic diastolic pressure − LVEDP) ÷ aortic systolic pressure × 100",
          note: "Lower values indicate more regurgitation; values below about 25 have been associated with worse outcomes. Use it alongside imaging, not on its own.",
        },
        { kind: "h", text: "Correcting paravalvular regurgitation" },
        {
          kind: "list",
          items: [
            "Underexpanded frame with a leak: post-dilate with a balloon sized to the annulus, avoiding oversizing where there is LVOT calcium.",
            "Valve too low or too high with a leak: a second valve inside the first (valve-in-valve) to move or extend the sealing zone.",
            "Leak beside a calcium nodule: post-dilatation may help; accept mild residual leak rather than risk rupture.",
            "Persistent significant leak at follow-up: percutaneous plug closure is possible in selected patients.",
          ],
        },
        {
          kind: "steps",
          title: "Finishing and closure",
          items: [
            { title: "Remove the stiff wire", detail: "Withdraw it under fluoroscopy, ideally after advancing a pigtail or catheter over it so the curve does not snag the new valve." },
            { title: "Decide on the pacing wire", detail: "Remove it if conduction is normal and stable; leave it if there is new conduction disturbance or a high-risk baseline ECG such as RBBB." },
            { title: "Remove the sheath", detail: "Withdraw the large-bore sheath over a wire with crossover access ready, and close with the pre-placed sutures or the plug device." },
            { title: "Check the access", detail: "Crossover angiography of the access site: look for extravasation, dissection, stenosis or occlusion. Keep a balloon and covered stent available." },
            { title: "Finish", detail: "Reverse heparin if your protocol does so and close the secondary access." },
          ],
        },
        { kind: "h", text: "Antithrombotic therapy after TAVI (2021 ESC/EACTS)" },
        {
          kind: "table",
          head: ["Situation", "Recommended approach"],
          rows: [
            ["No other indication for anticoagulation", "Lifelong single antiplatelet therapy"],
            ["Another indication for anticoagulation (for example AF)", "Lifelong oral anticoagulation alone"],
            ["Recent PCI or another coronary indication", "Antiplatelet therapy as the coronary indication requires, keeping combination therapy as short as possible"],
            ["Routine anticoagulation without another indication", "Not recommended"],
          ],
        },
        {
          kind: "p",
          text: "These recommendations reflect randomised trials in which single antiplatelet therapy caused less bleeding than dual therapy, anticoagulation alone caused less bleeding than anticoagulation plus clopidogrel, and a routine anticoagulant-based strategy in patients without an anticoagulation indication was harmful. Subclinical leaflet thickening on CT is common after TAVI; routine CT screening is not recommended, but clinical valve thrombosis (rising gradients, symptoms, embolism) is treated with anticoagulation.",
        },
        {
          kind: "keypoints",
          items: [
            "Assess paravalvular leak with more than one modality and correct the cause, not just the jet.",
            "Close the access under angiographic control with a bail-out plan ready.",
            "After TAVI: single antiplatelet therapy if there is no anticoagulation indication; anticoagulation alone if there is.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Aggressive post-dilatation of a balloon-expandable valve in a calcified LVOT: the rupture risk outweighs a small reduction in leak.",
            "Removing the pacing wire on the table in a patient with baseline RBBB and a new conduction change.",
            "Adding clopidogrel to anticoagulation 'for the valve' in a patient with AF: more bleeding without benefit.",
          ],
        },
        {
          kind: "pearl",
          text: "Write down the baseline PR and QRS intervals before you start. Post-procedure pacing decisions depend on the change from baseline, not on the final ECG alone.",
        },
      ],
      refs: ["esc-vhd-2021", "esc-pacing-2021", "scct-tavi-2019", "popular-tavi-a-2020", "popular-tavi-b-2020", "sinning-ari-2012"],
    },
  ],
  quiz: [
    {
      id: "shq-cusp-overlap",
      stem: "What does the cusp-overlap view used for self-expanding TAVI deployment show?",
      options: [
        "The right and left coronary cusps superimposed with the non-coronary cusp isolated",
        "All three cusps in a line with the right coronary cusp in the middle",
        "The left and non-coronary cusps superimposed with the right coronary cusp isolated",
        "The valve en face as a circle",
        "The coronary ostia in profile with the annulus foreshortened",
      ],
      answer: 0,
      explanation:
        "The cusp-overlap view, usually RAO caudal, superimposes the right and left coronary cusps and isolates the non-coronary cusp, elongating the LVOT and removing delivery-catheter parallax. The three cusps in a line with the right coronary cusp in the middle describes the standard coplanar three-cusp view.",
      difficulty: 1,
      refs: ["scct-tavi-2019"],
    },
    {
      id: "shq-rapid-pacing",
      stem: "Why is rapid ventricular pacing used during deployment of a balloon-expandable TAVI valve?",
      options: [
        "To stop forward ejection so the balloon and valve are not pushed into the aorta",
        "To reduce myocardial oxygen demand during the period of balloon occlusion",
        "To prevent complete heart block as the frame compresses the conduction tissue below",
        "To increase cardiac output and protect cerebral perfusion during deployment",
        "To test whether a permanent pacemaker will be needed after the procedure",
      ],
      answer: 0,
      explanation:
        "Rapid pacing drops stroke volume and pressure so that the inflating balloon is not ejected and the valve lands where it was positioned. Reducing oxygen demand is a tempting distractor, but rapid pacing reduces coronary perfusion and is kept as short as possible; its purpose is stability.",
      difficulty: 1,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-depth-low",
      stem: "After TAVI, the frame is found to sit considerably deeper in the LVOT than planned. Which complication is most directly linked to this?",
      options: [
        "New conduction disturbance needing pacing",
        "Coronary obstruction by a displaced leaflet",
        "Embolisation of the valve into the ascending aorta",
        "Sinus sequestration with diffuse ischaemia",
        "Iliac artery rupture on sheath removal",
      ],
      answer: 0,
      explanation:
        "A deep frame compresses the membranous septum and the conduction tissue beneath it, causing LBBB and AV block. Coronary obstruction and aortic embolisation are associated with a high implant, the opposite position.",
      difficulty: 1,
      refs: ["esc-pacing-2021", "scct-tavi-2019"],
    },
    {
      id: "shq-ari",
      stem: "After TAVI deployment, aortic pressure is 120/50 mmHg and LVEDP is 22 mmHg. What is the aortic regurgitation index and its implication?",
      options: [
        "About 23, suggesting significant regurgitation",
        "About 35, suggesting no significant regurgitation",
        "About 42, suggesting no significant regurgitation",
        "About 58, suggesting significant regurgitation",
        "About 18, suggesting no significant regurgitation",
      ],
      answer: 0,
      explanation:
        "ARI = (50 − 22) ÷ 120 × 100 ≈ 23. Values below about 25 suggest significant regurgitation and have been linked to worse outcomes, so look for a paravalvular leak with imaging. A common error is using systolic minus diastolic pressure, which gives a much higher value.",
      difficulty: 2,
      refs: ["esc-vhd-2021", "sinning-ari-2012"],
    },
    {
      id: "shq-antithrombotic-af",
      stem: "A patient with permanent AF on apixaban has an uncomplicated TAVI. They have had no recent PCI. What antithrombotic regimen does the 2021 ESC/EACTS guideline recommend long term?",
      options: [
        "Oral anticoagulation alone",
        "Oral anticoagulation plus clopidogrel for 3–6 months, then anticoagulation alone",
        "Aspirin plus clopidogrel for 6 months, then aspirin",
        "Aspirin alone, stopping the anticoagulant",
        "Oral anticoagulation plus aspirin lifelong",
      ],
      answer: 0,
      explanation:
        "When there is another indication for anticoagulation, anticoagulation alone is recommended after TAVI. Adding clopidogrel is the tempting choice but increased bleeding without reducing thrombotic events in randomised data.",
      difficulty: 2,
      refs: ["esc-vhd-2021", "popular-tavi-b-2020"],
    },
    {
      id: "shq-antithrombotic-noaf",
      stem: "A patient in sinus rhythm with no other indication for anticoagulation has an uncomplicated TAVI. Which long-term regimen is recommended?",
      options: [
        "Lifelong single antiplatelet therapy",
        "Rivaroxaban plus aspirin for 3 months, then aspirin",
        "Warfarin for 3 months, then aspirin",
        "Dual antiplatelet therapy for 12 months",
        "No antithrombotic therapy",
      ],
      answer: 0,
      explanation:
        "Lifelong single antiplatelet therapy is recommended, and routine anticoagulation is not recommended in patients without another indication: a rivaroxaban-based strategy caused harm in a randomised trial. Dual antiplatelet therapy increased bleeding without clear benefit.",
      difficulty: 1,
      refs: ["esc-vhd-2021", "popular-tavi-a-2020"],
    },
    {
      id: "shq-predil",
      stem: "Which is the best reason to perform balloon predilatation during a contemporary TAVI?",
      options: [
        "To test coronary obstruction risk with root aortography in a high-risk root",
        "As a routine step in all patients, to reduce paravalvular leak after implantation",
        "To reduce the risk of stroke by breaking up calcium before the valve crosses",
        "To reduce the need for a permanent pacemaker by limiting frame pressure",
        "To measure the annulus with the balloon instead of relying on CT sizing",
      ],
      answer: 0,
      explanation:
        "Predilatation is selective. Inflating a balloon while injecting contrast in the root shows how close the displaced leaflet comes to the coronary ostium, which helps in high-risk roots. It is no longer routine, and balloon manipulation in a calcified valve does not reduce stroke.",
      difficulty: 2,
      refs: ["scct-tavi-2019"],
    },
  ],
  sims: [
    {
      sim: "tavi",
      task: "Perform a full transfemoral deployment: confirm pacing capture, cross the valve, place the stiff wire, select the deployment view from CT angles, deploy at the target depth and assess paravalvular leak and the aortic regurgitation index.",
    },
  ],
};

// ===========================================================================
// Module 4 — TAVI complications
// ===========================================================================
const taviComplications: Module = {
  id: "sh-tavi-complications",
  title: "TAVI complications",
  stage: 5,
  summary:
    "Recognising, preventing and managing the complications of TAVI: paravalvular leak, conduction disturbance, coronary obstruction, annular rupture, valve embolisation, perforation and tamponade, stroke, vascular injury, and the specific problems of valve-in-valve.",
  objectives: [
    "List the causes of paravalvular leak and the options for correcting it.",
    "State the risk factors for conduction disturbance and the 2021 ESC pacing recommendations after TAVI.",
    "Identify roots at risk of coronary obstruction and describe coronary protection, chimney stenting and leaflet laceration.",
    "Recognise annular rupture, valve embolisation, LV or RV perforation and vascular rupture, and give the first steps of management.",
    "Summarise the evidence on cerebral embolic protection.",
    "Plan a valve-in-valve procedure, including assessment of residual gradient and coronary risk.",
  ],
  lessons: [
    {
      id: "sh-tavi-pvl-conduction",
      title: "Paravalvular leak and conduction disturbance",
      minutes: 8,
      blocks: [
        { kind: "h", text: "Paravalvular leak" },
        {
          kind: "p",
          text: "Paravalvular leak (PVL) is regurgitation between the frame and the annulus. In the early TAVI trials even moderate PVL was associated with higher mortality, so the aim is none or trace. Outer sealing skirts on current valves have reduced it considerably.",
        },
        {
          kind: "table",
          head: ["Cause", "Mechanism", "Prevention or correction"],
          rows: [
            ["Undersizing", "Gaps between the frame and an oval annulus", "CT-based sizing; post-dilatation or valve-in-valve"],
            ["Malposition", "Sealing skirt above or below the annulus", "Correct depth; a second valve to extend the seal"],
            ["Underexpansion", "Frame not reaching the annular wall", "Post-dilatation if safe"],
            ["Calcium nodules", "Bulky calcium holds the frame off the wall", "Anticipate on CT; choose the design accordingly; accept mild residual leak rather than risk rupture"],
            ["Elliptical or bicuspid annulus", "Asymmetric frame expansion", "Sizing at the right level; device choice"],
          ],
        },
        {
          kind: "p",
          text: "Grade PVL with standardised (VARC-3) definitions where possible. On echo, the circumferential extent of paravalvular jets in the short-axis view is a key parameter, together with jet width, vena contracta and holodiastolic flow reversal in the descending aorta. Angiographic grading compares contrast density in the LV with the root. Invasive haemodynamics (aortic regurgitation index, a rising LVEDP) add information.",
        },
        { kind: "h", text: "Conduction disturbance" },
        {
          kind: "p",
          text: "The left bundle branch emerges just below the membranous septum, between the non-coronary and right coronary cusps, close to where the TAVI frame sits. New LBBB is common after TAVI, and high-degree AV block needing a permanent pacemaker occurs in a minority of patients, more often with most self-expanding designs.",
        },
        {
          kind: "table",
          head: ["Risk factor", "Comment"],
          rows: [
            ["Pre-existing RBBB", "The strongest predictor: a new LBBB on top of RBBB means complete heart block"],
            ["Deep implant", "Especially when the depth exceeds the length of the membranous septum"],
            ["Short membranous septum on CT", "Less tissue between the annulus and the conduction system"],
            ["Valve design", "Higher rates with most self-expanding valves"],
            ["Oversizing and high radial force", "More compression of the septum"],
            ["LVOT calcium beneath the non-coronary and right coronary cusps", "Pushes the frame onto the conduction tissue"],
            ["Baseline first-degree AV block or left anterior fascicular block", "Existing conduction disease"],
          ],
        },
        { kind: "h", text: "Pacing after TAVI (2021 ESC pacing guideline)" },
        {
          kind: "list",
          items: [
            "Complete or high-degree AV block persisting for 24–48 hours after TAVI: permanent pacing recommended.",
            "New alternating bundle branch block after TAVI: permanent pacing recommended.",
            "Pre-existing RBBB with any further conduction disturbance during or immediately after TAVI: early permanent pacing should be considered.",
            "New LBBB with QRS above 150 ms or PR above 240 ms that does not progress further over 48 hours: ambulatory ECG monitoring or an electrophysiology study should be considered.",
          ],
        },
        {
          kind: "p",
          text: "Units turn these into local pathways, for example early discharge with ambulatory monitoring for patients without new conduction change, and continued in-hospital monitoring with the pacing wire for those with new conduction disease.",
        },
        {
          kind: "keypoints",
          items: [
            "Prevent PVL with CT sizing and correct depth; treat it by correcting the mechanism.",
            "Baseline RBBB plus a deep implant is the classic route to complete heart block.",
            "Cusp-overlap deployment at a controlled depth reduces interaction with the conduction system.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Calling a leak 'mild' on one aortogram without echo and haemodynamic correlation.",
            "Discharging a patient with new LBBB and progressive PR prolongation without monitoring: delayed high-degree AV block occurs.",
          ],
        },
      ],
      refs: ["esc-pacing-2021", "esc-vhd-2021", "scct-tavi-2019", "genereux-varc3-2021", "sinning-ari-2012"],
    },
    {
      id: "sh-tavi-coronary",
      title: "Coronary obstruction",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Coronary obstruction occurs when the displaced native or bioprosthetic leaflet is pushed against a coronary ostium, or when displaced leaflets seal the sinus at the sino-tubular junction. It is uncommon in native-valve TAVI (under 1% in large registries) but several times more frequent in valve-in-valve procedures, and mortality is high. The left main is affected more often than the right coronary artery.",
        },
        {
          kind: "table",
          head: ["Risk factor", "Why it matters"],
          rows: [
            ["Low coronary height (commonly below about 10–12 mm)", "The displaced leaflet reaches above the ostium"],
            ["Narrow sinus of Valsalva (mean diameter below about 30 mm)", "No room for the leaflet inside the sinus"],
            ["Long, bulky, calcified leaflet, longer than the coronary height", "The leaflet acts as a curtain in front of the ostium"],
            ["Low, narrow STJ", "Sinus sequestration: displaced leaflets seal the STJ and cut off flow to the whole sinus"],
            ["Valve-in-valve, especially stentless valves or leaflets mounted outside the stent posts", "The surgical leaflets are held up by the new frame"],
            ["Small virtual transcatheter valve-to-coronary distance (VTC below about 4 mm) in valve-in-valve", "The simulated new frame lies close to the ostium"],
            ["Female sex, no previous CABG", "Smaller roots; no graft supply to the territory"],
          ],
        },
        { kind: "h", text: "Recognition" },
        {
          kind: "list",
          items: [
            "Hypotension that does not recover after pacing stops.",
            "ST change, ventricular arrhythmia or a new regional wall motion abnormality.",
            "Aortography showing absent or delayed filling of a coronary.",
            "Delayed obstruction hours or days later is described, particularly after valve-in-valve.",
          ],
        },
        { kind: "h", text: "Prevention and bail-out" },
        {
          kind: "table",
          head: ["Strategy", "How", "Notes"],
          rows: [
            ["Choose surgery", "SAVR instead of TAVI", "Consider in operable patients with a very high-risk root"],
            ["Coronary protection", "Before deployment, place a guide in the at-risk coronary, a wire in the distal vessel and an undeployed stent (with or without a balloon) in the proximal vessel", "If flow is compromised, pull the stent back so its proximal end extends above the valve frame and deploy it ('chimney' or 'snorkel' stenting). If flow is preserved, remove the stent and wire."],
            ["Leaflet laceration (BASILICA)", "An electrified wire crosses and splits the leaflet in front of the coronary so that it parts rather than covering the ostium", "Specialised technique; also used before valve-in-valve"],
            ["Device choice", "Recapturable valve to assess before full release; commissural alignment; a short frame for later access", "Reduces, but does not abolish, the risk"],
            ["Balloon valvuloplasty with aortography", "Shows how the leaflet moves towards the ostium", "Helpful but not fully predictive"],
          ],
        },
        {
          kind: "p",
          text: "Chimney stents restore flow but leave a stent running between the valve frame and the aortic wall, with concerns about late compression or deformation, stent thrombosis and very difficult future re-access. Patients need antiplatelet therapy appropriate for a coronary stent, and the procedure report should state exactly what was done.",
        },
        {
          kind: "keypoints",
          items: [
            "Risk comes from the combination of coronary height, sinus width, leaflet length and STJ geometry.",
            "Protection must be in place before deployment; once a leaflet covers the ostium, wiring the coronary may be impossible.",
            "Chimney stenting is a bail-out with long-term consequences, not a free insurance policy.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Removing the protection wire to take a clearer aortogram after deployment, then being unable to re-cross.",
            "Attributing hypotension after deployment to slow recovery from rapid pacing while a coronary is occluded.",
            "Assuming adequate coronary height protects against obstruction when the STJ is low and narrow.",
          ],
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "In a root with a left main height of 9 mm and narrow sinuses, set up left main protection with a wire and undeployed stent before deployment, then decide from post-deployment aortography whether to deploy a chimney stent or remove the protection.",
        },
      ],
      refs: ["scct-tavi-2019", "esc-vhd-2021", "ribeiro-coronary-obstruction-2013", "khan-basilica-2018"],
    },
    {
      id: "sh-tavi-catastrophes",
      title: "Rupture, embolisation, perforation, stroke and vascular injury",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Most catastrophic TAVI complications declare themselves as sudden hypotension. Have a mental list and a rapid way to work through it: pacing and rhythm, valve position and regurgitation on aortography, coronary filling, the pericardium on echo, and the access site on crossover angiography.",
        },
        {
          kind: "table",
          head: ["Complication", "Clues", "Immediate management"],
          rows: [
            ["Annular or root rupture", "Sudden hypotension during or after balloon inflation or post-dilatation; new effusion; contrast outside the root; periaortic haematoma", "Pericardiocentesis with autotransfusion, reversal of heparin, surgical opinion; small contained ruptures are sometimes managed conservatively"],
            ["Valve embolisation into the aorta", "Valve seen above the annulus; severe regurgitation", "Keep the wire through the valve so it cannot flip; move it to a safe segment of the descending aorta and deploy or secure it there, then implant a second valve at the annulus"],
            ["Valve embolisation into the LV", "Valve seen below the annulus", "Usually surgical retrieval"],
            ["LV perforation", "Effusion and tamponade, usually from the stiff wire tip", "Pericardiocentesis, reversal of heparin; surgery is often needed"],
            ["RV perforation by the pacing wire", "Effusion, sometimes delayed", "Pericardiocentesis; reposition the wire or pace via the LV wire"],
            ["Aortic dissection", "Chest or back pain, new flap, new regurgitation", "TOE or CT; surgical opinion"],
            ["Stroke", "New neurological deficit, sometimes noticed only after sedation wears off", "Immediate stroke team assessment and imaging; thrombectomy pathway where appropriate"],
            ["Iliofemoral rupture or dissection", "Hypotension (often when the sheath is removed), abdominal or back pain, extravasation on crossover angiography", "Keep the wire across; inflate an occlusion balloon from the contralateral side; covered stent; surgery if needed"],
            ["Closure failure", "Haematoma or bleeding at the access site", "Manual compression, balloon tamponade from the contralateral side, an additional closure device, covered stent"],
          ],
        },
        { kind: "h", text: "Stroke and cerebral embolic protection" },
        {
          kind: "p",
          text: "Most periprocedural strokes are embolic, from the aortic arch or from valve debris during crossing, predilatation, deployment and post-dilatation; later strokes are related to AF and other factors. Cerebral embolic protection devices place filters in the brachiocephalic and left common carotid arteries. In PROTECTED TAVR, routine use of a filter device did not significantly reduce overall stroke at 72 hours or discharge compared with no protection; disabling stroke was numerically lower, but this was a secondary finding. A large UK randomised trial (BHF PROTECT-TAVI) also did not show a reduction in stroke with routine use. Most centres therefore use embolic protection selectively, if at all.",
        },
        { kind: "h", text: "Vascular complications" },
        {
          kind: "steps",
          title: "Suspected iliac rupture on sheath removal",
          items: [
            { title: "Do not remove the wire", detail: "Keep a wire across the injured segment; re-advance the sheath or a dilator if that stops bleeding." },
            { title: "Control from the other side", detail: "Through the crossover access, inflate a compliant or peripheral balloon proximal to the injury to stop flow." },
            { title: "Resuscitate", detail: "Fluids and blood, vasopressors, call the vascular surgeon." },
            { title: "Seal", detail: "Deploy a covered stent across the tear, or convert to surgical repair." },
            { title: "Confirm", detail: "Repeat angiography and monitor for compartment syndrome and limb ischaemia." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Sudden hypotension: check rhythm, valve position and regurgitation, coronary flow, pericardium and the access site.",
            "Never lose the LV wire after aortic embolisation: it keeps the valve coaxial and stops it flipping.",
            "Routine cerebral embolic protection has not reduced overall stroke in randomised trials.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Removing the large-bore sheath without crossover access or a wire in place.",
            "Repeated aggressive post-dilatation to chase a small leak in a calcified LVOT.",
            "Snaring an embolised valve into the arch near the head and neck vessels.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first deployment, rehearse aloud who does what if the pressure collapses: who drains the pericardium, who controls the access, who calls the surgeon and the anaesthetist.",
        },
      ],
      refs: ["protected-tavr-2022", "esc-vhd-2021", "esc-pericardial-2015", "scct-tavi-2019", "protect-tavi-2025"],
    },
    {
      id: "sh-viv",
      title: "Valve-in-valve TAVI",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Surgical bioprostheses degenerate through leaflet calcification, tears or pannus. Valve-in-valve (ViV) TAVI places a transcatheter valve inside the failed surgical valve. The 2021 ESC/EACTS guideline supports aortic ViV as an option depending on anatomy, the features of the prosthesis and operative risk, decided by the Heart Team.",
        },
        {
          kind: "table",
          caption: "Know the surgical valve before sizing",
          head: ["Feature", "Why it matters"],
          rows: [
            ["Label size versus true internal diameter", "The label size is not the internal diameter; sizing uses the true internal diameter from manufacturer data or reference charts"],
            ["Stented or stentless", "Stentless valves lack fluoroscopic landmarks and carry higher coronary-obstruction risk"],
            ["Leaflets inside or outside the stent posts", "Externally mounted leaflets raise coronary-obstruction risk"],
            ["Radiopaque markers", "Identify many models on fluoroscopy and act as the positioning reference"],
            ["Whether the ring can be fractured", "Some surgical frames can be cracked with a high-pressure balloon; others cannot"],
          ],
        },
        { kind: "h", text: "Specific problems" },
        {
          kind: "list",
          items: [
            "High residual gradients in small surgical valves (label size 21 mm or smaller): supra-annular self-expanding valves and a higher implant position reduce gradients; bioprosthetic valve fracture (for fracturable designs) enlarges the orifice.",
            "Coronary obstruction: a VTC below about 4 mm on CT indicates high risk; consider leaflet laceration or coronary protection.",
            "Malposition: position relative to the surgical frame and its markers rather than the native annulus.",
            "Leaflet thrombosis: more frequent after ViV; image early if the gradient rises.",
            "Redo TAVI (TAV-in-TAV): the first valve's leaflets are pinned upwards and can seal a low STJ (sinus sequestration); plan with CT and consider leaflet modification.",
          ],
        },
        {
          kind: "steps",
          title: "Aortic valve-in-valve: what differs from native TAVI",
          items: [
            { title: "Identify the valve", detail: "Confirm model and label size from the operation note, then the true internal diameter and fracturability from reference data; review CT for VTC, sinus height and STJ." },
            { title: "Crossing", detail: "Cross through the centre of the surgical valve, not between a stent post and the sewing ring; confirm the wire is inside the frame in two views." },
            { title: "Position", detail: "Use the sewing ring (the radiopaque base of the surgical frame) as the reference plane rather than the native cusps; a slightly higher position usually gives lower gradients." },
            { title: "Protect the coronaries if needed", detail: "Wire and stent protection or leaflet laceration when VTC is small." },
            { title: "Fracture if planned", detail: "For a small fracturable valve, a high-pressure non-compliant balloon is inflated under rapid pacing, before or after the transcatheter valve depending on strategy, to crack the ring and enlarge the orifice." },
            { title: "Assess", detail: "Measure the gradient directly; a high residual gradient may justify fracture or post-dilatation." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Size to the true internal diameter, not the label.",
            "Gradient and coronary risk are the two main ViV problems; both are predictable from the valve model and CT.",
            "A higher position and a supra-annular design help the gradient.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Attempting fracture of a surgical ring that is not designed to fracture.",
            "Deploying ViV in a stentless valve without a coronary plan.",
          ],
        },
        {
          kind: "pearl",
          text: "Widely used reference apps and charts list the true internal diameter and fluoroscopic appearance of most surgical valves; check them for every ViV case.",
        },
      ],
      refs: ["esc-vhd-2021", "scct-tavi-2019", "khan-basilica-2018"],
    },
  ],
  quiz: [
    {
      id: "shq-ppm-predictor",
      stem: "Which baseline finding is the strongest predictor of needing a permanent pacemaker after TAVI?",
      options: [
        "Right bundle branch block",
        "Left bundle branch block",
        "Atrial fibrillation",
        "Left ventricular hypertrophy",
        "First-degree AV block alone",
      ],
      answer: 0,
      explanation:
        "TAVI commonly injures the left bundle branch; a patient who already has RBBB then develops complete heart block. Pre-existing LBBB is less predictive because the left bundle is already diseased and new right-sided block from TAVI is uncommon.",
      difficulty: 1,
      refs: ["esc-pacing-2021"],
    },
    {
      id: "shq-chb-persist",
      stem: "Complete heart block develops during TAVI and persists 48 hours later. According to the 2021 ESC pacing guideline, what is recommended?",
      options: [
        "Permanent pacemaker implantation",
        "Continue temporary pacing for 2 weeks before deciding",
        "Ambulatory ECG monitoring after discharge",
        "Electrophysiology study before any decision",
        "Isoprenaline infusion and reassess at 7 days",
      ],
      answer: 0,
      explanation:
        "Complete or high-degree AV block persisting for 24–48 hours after TAVI is a class I indication for permanent pacing. Ambulatory monitoring or an electrophysiology study is suggested for new LBBB with marked QRS or PR prolongation without further progression, not for persistent complete block.",
      difficulty: 1,
      refs: ["esc-pacing-2021"],
    },
    {
      id: "shq-coronary-chimney",
      stem: "Before TAVI in a high-risk root, a wire is placed in the LAD with an undeployed stent in the left main. After valve deployment, BP falls to 70/40 mmHg, ST depression appears and the left main fills poorly. What is the most appropriate next step?",
      options: [
        "Pull the stent back so its proximal end extends above the valve frame and deploy it",
        "Start vasopressors and wait for recovery from rapid pacing",
        "Remove the coronary wire to obtain a clearer aortogram",
        "Snare the valve and pull it into the ascending aorta",
        "Post-dilate the valve to push the leaflet further out",
      ],
      answer: 0,
      explanation:
        "This is coronary obstruction, and the protection was set up for exactly this situation: deploy a chimney stent from the left main into the aorta beyond the frame. Waiting for 'pacing recovery' wastes time while the left main is occluded, and removing the wire may make re-crossing impossible.",
      difficulty: 2,
      refs: ["scct-tavi-2019"],
    },
    {
      id: "shq-rupture-mgmt",
      stem: "During post-dilatation of a balloon-expandable valve in a patient with LVOT calcium, BP collapses and echo shows a rapidly enlarging pericardial effusion. What is the immediate priority?",
      options: [
        "Pericardiocentesis with autotransfusion, heparin reversal, call the surgeon",
        "Repeat post-dilatation with a larger balloon to seal the paravalvular gap fully",
        "Implant a second valve inside the first to cover the area of the tear",
        "Remove all sheaths and apply manual compression to the access sites",
        "Give a fluid bolus and observe while the effusion is measured on echo",
      ],
      answer: 0,
      explanation:
        "This picture suggests annular rupture with tamponade. Drain the pericardium (autotransfusing the blood), reverse anticoagulation and involve the surgeon. A second valve treats malposition and leak, not rupture.",
      difficulty: 2,
      refs: ["esc-pericardial-2015", "esc-vhd-2021"],
    },
    {
      id: "shq-embol-aorta",
      stem: "A balloon-expandable valve embolises into the ascending aorta when pacing capture is lost during inflation. What is the first principle of management?",
      options: [
        "Keep the stiff wire through the valve so that it cannot flip, then move it to a safe aortic segment",
        "Withdraw the wire to allow the valve to settle",
        "Pull the valve into the aortic arch beside the head and neck vessels",
        "Proceed immediately to surgery without further manipulation",
        "Inflate a second balloon inside the valve in the ascending aorta",
      ],
      answer: 0,
      explanation:
        "The wire through the valve keeps it coaxial and prevents it flipping and obstructing the aorta. The valve is moved to the descending aorta and secured, and a second valve is implanted at the annulus. Removing the wire is the most dangerous mistake.",
      difficulty: 2,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-cep",
      stem: "What did the PROTECTED TAVR trial show about routine cerebral embolic protection?",
      options: [
        "No significant reduction in overall periprocedural stroke versus no protection",
        "A significant reduction in all stroke and in mortality at 30 days with protection",
        "A significant increase in stroke caused by manipulating the device in the arch",
        "A significant reduction in vascular complications because of radial access",
      ],
      answer: 0,
      explanation:
        "Routine use of a filter device did not significantly reduce the primary endpoint of stroke at 72 hours or discharge. Disabling stroke was numerically lower, but that was a secondary finding and does not establish benefit.",
      difficulty: 1,
      refs: ["protected-tavr-2022"],
    },
    {
      id: "shq-iliac",
      stem: "On removing the large-bore TAVI sheath, the patient becomes hypotensive and complains of back pain. Crossover angiography shows contrast extravasation from the external iliac artery. What is the best immediate step?",
      options: [
        "Inflate an occlusion balloon above the tear from the other side; keep the wire",
        "Apply firm manual pressure in the groin over the access site for 20 minutes",
        "Give protamine to reverse the heparin and observe the blood pressure closely in recovery",
        "Remove the crossover access to reduce the number of bleeding sites",
        "Arrange CT angiography to define the injury before any intervention",
      ],
      answer: 0,
      explanation:
        "Balloon occlusion from above controls the bleeding while a covered stent or surgery is arranged; keeping the wire across makes stenting possible. The external iliac artery lies above the inguinal ligament, so groin pressure cannot control it, and leaving to scan delays control of a life-threatening bleed.",
      difficulty: 2,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-viv-vtc",
      stem: "CT before aortic valve-in-valve shows a virtual transcatheter valve-to-coronary distance (VTC) of 3 mm for the left main. How should this be interpreted?",
      options: [
        "High obstruction risk: plan leaflet laceration or coronary protection, or rethink",
        "Low risk; a VTC below 4 mm is reassuring and needs no further planning",
        "Irrelevant to the coronaries; VTC only predicts paravalvular leak after implantation",
        "High risk of annular rupture during post-dilatation of the new valve frame",
      ],
      answer: 0,
      explanation:
        "A VTC below about 4 mm means the new frame, and the surgical leaflets it pushes outwards, will sit very close to the ostium, so obstruction risk is high. VTC is a measure of coronary risk, not of leak or rupture.",
      difficulty: 3,
      refs: ["scct-tavi-2019", "khan-basilica-2018"],
    },
  ],
  caseIds: ["sh-case-tavi-low-left-main"],
  sims: [
    {
      sim: "tavi",
      task: "Work through a TAVI with complications: manage coronary obstruction with a chimney stent, recognise PVL from aortography and the aortic regurgitation index, and choose post-dilatation or a second valve.",
    },
  ],
};

// ===========================================================================
// Module 5 — Mitral and tricuspid transcatheter therapy
// ===========================================================================
const mitralTricuspid: Module = {
  id: "sh-mitral-tricuspid",
  title: "Mitral and tricuspid transcatheter therapy",
  stage: 5,
  summary:
    "Mechanisms and grading of mitral regurgitation, primary versus secondary MR, the COAPT and MITRA-FR trials and the proportionality concept, mitral TEER from selection to release, tricuspid TEER and an overview of transcatheter valve replacement.",
  objectives: [
    "Classify MR by Carpentier type and distinguish primary from secondary MR.",
    "Grade MR severity with an integrated echo approach.",
    "State the 2021 ESC/EACTS indications for intervention in primary and secondary MR, including the place of TEER.",
    "Explain why COAPT and MITRA-FR reached different conclusions, using the proportionate versus disproportionate MR concept.",
    "Assess anatomical suitability for TEER and describe the procedure step by step, including the checks before release.",
    "Recognise TEER complications and summarise the evidence and challenges of tricuspid TEER and transcatheter replacement.",
  ],
  lessons: [
    {
      id: "sh-mr-mechanisms",
      title: "Mitral regurgitation: mechanisms, severity and indications",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "The mitral valve is an apparatus: the saddle-shaped annulus, the anterior and posterior leaflets (each divided into three segments, A1–A3 and P1–P3, from lateral to medial), the chordae, the papillary muscles and the LV wall that supports them. MR results from failure of any part.",
        },
        {
          kind: "table",
          caption: "Carpentier classification by leaflet motion",
          head: ["Type", "Leaflet motion", "Typical causes"],
          rows: [
            ["I", "Normal", "Annular dilatation (atrial functional MR in long-standing AF, dilated LV), leaflet perforation from endocarditis, cleft leaflet"],
            ["II", "Excessive (prolapse or flail)", "Degenerative disease (fibroelastic deficiency, Barlow disease), ruptured chordae, papillary muscle rupture"],
            ["IIIa", "Restricted in systole and diastole", "Rheumatic disease, radiation, drug-induced valve disease"],
            ["IIIb", "Restricted in systole only", "Ischaemic or dilated cardiomyopathy: LV remodelling displaces the papillary muscles and tethers the leaflets"],
          ],
        },
        {
          kind: "table",
          head: ["", "Primary (degenerative) MR", "Secondary (functional) MR"],
          rows: [
            ["Problem", "The leaflets or chordae", "The ventricle (ventricular secondary MR) or the atrium and annulus (atrial secondary MR)"],
            ["Typical Carpentier type", "II (sometimes I or IIIa)", "IIIb (ventricular), I (atrial)"],
            ["Effect of fixing the valve", "Cures the disease if done before LV damage", "Removes a volume load but leaves the LV disease"],
            ["First-line treatment", "Surgery, with repair preferred", "Guideline-directed medical therapy, CRT where indicated, revascularisation where indicated"],
          ],
        },
        { kind: "h", text: "Grading severity" },
        {
          kind: "table",
          caption: "Features of severe MR (integrated assessment)",
          head: ["Parameter", "Severe MR"],
          rows: [
            ["Vena contracta width", "≥7 mm"],
            ["Effective regurgitant orifice area (EROA, PISA)", "≥40 mm² (0.40 cm²). In secondary MR with an elliptical orifice or low flow, the 2021 guideline notes that around 30 mm² may already indicate severe MR."],
            ["Regurgitant volume", "≥60 mL (lower values may be severe in low-flow states)"],
            ["Pulmonary vein flow", "Systolic flow reversal"],
            ["Supportive", "Flail leaflet or ruptured papillary muscle; large central jet; dense continuous-wave signal; dilated LA and LV in chronic MR"],
          ],
        },
        { kind: "h", text: "Indications (2021 ESC/EACTS)" },
        {
          kind: "table",
          head: ["Setting", "Summary of recommendations"],
          rows: [
            ["Severe primary MR, symptomatic, operable", "Surgery, with repair preferred when a durable result is likely"],
            ["Severe primary MR, asymptomatic", "Surgery if LV dysfunction (LVESD ≥40 mm or LVEF ≤60%); earlier surgery considered in low-risk patients with AF, pulmonary hypertension or marked LA dilatation when durable repair is likely"],
            ["Severe primary MR, high surgical risk or inoperable, suitable anatomy", "TEER may be considered after Heart Team review, if not futile"],
            ["Severe secondary MR, symptomatic despite optimised therapy (including CRT where indicated)", "Intervention only after therapy has been optimised. Surgery when CABG or other cardiac surgery is needed. TEER should be considered in selected patients not eligible for surgery who meet criteria suggesting a greater chance of response; it may be considered for symptom relief in others after evaluating advanced heart failure therapies."],
          ],
        },
        {
          kind: "p",
          text: "Version note: these are the 2021 ESC/EACTS recommendations; the 2025 update revised some of them. Secondary MR decisions are made with the heart failure team, using the current ESC heart failure guideline for medical and device therapy.",
        },
        {
          kind: "keypoints",
          items: [
            "Primary MR is a valve disease; secondary MR is a ventricular or atrial disease with a valve consequence.",
            "Grade with several parameters; no single number decides severity.",
            "In secondary MR, optimise medical therapy and CRT first, then reassess MR.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Grading MR during acute decompensation or uncontrolled hypertension, when it is often worse than at baseline.",
            "Using a single-frame PISA in secondary MR where the orifice is elliptical and the jet varies through systole.",
            "Missing atrial functional MR in AF with a normal-sized LV: the mechanism (annular dilatation) differs from ventricular secondary MR.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "esc-vhd-2025", "esc-hf-2021", "hanna-pcm"],
    },
    {
      id: "sh-coapt-mitrafr",
      title: "Secondary MR: COAPT, MITRA-FR and proportionality",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Two randomised trials published in 2018 tested TEER plus medical therapy against medical therapy alone in heart failure with reduced EF and severe secondary MR. They reached opposite conclusions, and understanding why is central to patient selection.",
        },
        {
          kind: "table",
          head: ["Feature", "MITRA-FR", "COAPT"],
          rows: [
            ["Population", "Symptomatic HFrEF with severe secondary MR", "Similar, with stricter central confirmation that medical therapy was maximally tolerated before entry"],
            ["MR severity at baseline", "Less severe on average (mean EROA about 0.31 cm²)", "More severe on average (mean EROA about 0.41 cm²)"],
            ["LV size at baseline", "More dilated (mean LVEDV index about 135 mL/m²)", "Less dilated (mean LVEDV index about 101 mL/m²)"],
            ["Residual MR after TEER", "Higher rate of residual significant MR", "Lower rate of residual significant MR"],
            ["Result", "No difference in death or unplanned heart failure hospitalisation at 12 months", "Fewer heart failure hospitalisations over 24 months with TEER; all-cause mortality was also lower"],
          ],
        },
        { kind: "h", text: "Proportionate and disproportionate MR" },
        {
          kind: "p",
          text: "A dilated LV of a given volume generates a predictable regurgitant orifice through leaflet tethering and annular dilatation. If the EROA is about what the LV size predicts (proportionate MR), the MR is a marker of LV disease and treating the valve adds little to treating the ventricle. If the EROA is larger than the LV size predicts (disproportionate MR), the regurgitation itself drives volume overload and symptoms, and reducing it is more likely to help. COAPT enrolled more patients with disproportionate MR, which is one proposed explanation of the different results, along with differences in medical therapy and procedural results. The framework is a way of thinking, not a validated selection score.",
        },
        { kind: "h", text: "Selecting patients in practice" },
        {
          kind: "p",
          text: "The 2021 ESC/EACTS guideline uses COAPT-like features to identify patients with a greater chance of benefiting from TEER:",
        },
        {
          kind: "list",
          items: [
            "Persistent symptoms despite guideline-directed medical therapy and CRT where indicated.",
            "LVEF roughly between 20% and 50%.",
            "LVESD of 70 mm or less.",
            "Systolic pulmonary artery pressure of 70 mmHg or less.",
            "No more than mild-to-moderate RV dysfunction and no severe TR.",
            "Haemodynamic stability.",
          ],
        },
        {
          kind: "p",
          text: "Patients with very dilated ventricles, severe RV failure or advanced disease are less likely to benefit and should be assessed for advanced heart failure therapies (mechanical support or transplantation) or palliative care.",
        },
        {
          kind: "keypoints",
          items: [
            "COAPT: TEER plus optimal medical therapy reduced heart failure hospitalisation and mortality in selected patients.",
            "MITRA-FR: no benefit in patients with less severe MR relative to more dilated ventricles.",
            "Disproportionate MR with a moderately dilated LV is the profile most likely to benefit.",
            "A good procedural result (little residual MR) is part of the benefit.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Referring for TEER before medical therapy and CRT have been optimised: both can reduce secondary MR on their own.",
            "Treating the valve in end-stage cardiomyopathy and expecting the LV to recover.",
          ],
        },
      ],
      refs: ["coapt-2018", "mitra-fr-2018", "esc-vhd-2021", "esc-hf-2021", "grayburn-proportionate-mr-2019"],
    },
    {
      id: "sh-teer-procedure",
      title: "Mitral TEER: suitability and procedure",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Transcatheter edge-to-edge repair (TEER) reproduces the surgical edge-to-edge stitch: a device grasps the anterior and posterior leaflets and holds them together, creating a double-orifice valve. Clip-based and spacer-based systems (for example MitraClip and PASCAL) both use a femoral venous, transseptal approach under general anaesthesia with TOE guidance.",
        },
        {
          kind: "table",
          caption: "Anatomical suitability (classical criteria, extended by newer devices and experience)",
          head: ["Feature", "Favourable", "Challenging or unfavourable"],
          rows: [
            ["Location of pathology", "Central (A2–P2)", "Commissural (A1–P1, A3–P3) or multiple segments"],
            ["Leaflet tissue", "Thin and mobile, no calcium in the grasping zone", "Calcium in the grasping zone, rheumatic thickening, perforation or cleft"],
            ["Mitral valve area and gradient", "Area comfortably above about 4 cm², low baseline gradient", "Small area or raised baseline gradient (risk of iatrogenic stenosis)"],
            ["Posterior leaflet length", "About 10 mm or more", "Short (below about 7 mm), hard to grasp"],
            ["Coaptation depth (secondary MR)", "Less than about 11 mm", "Deeper tethering"],
            ["Flail gap and width (primary MR)", "Gap below about 10 mm, width below about 15 mm", "Larger flail"],
          ],
        },
        {
          kind: "p",
          text: "These are the classical criteria from the early randomised trial era. Devices with independent leaflet grasping and different arm sizes have extended treatment to more complex anatomy, but anatomical suitability remains the strongest predictor of a good result.",
        },
        {
          kind: "steps",
          title: "Procedure",
          items: [
            { title: "Set-up", detail: "General anaesthesia, TOE, femoral venous access. Heparin to the target ACT per protocol around the time of transseptal puncture." },
            { title: "Transseptal puncture", detail: "Superior and posterior, with a height of about 3.5–4.5 cm above the mitral annular plane in the four-chamber view, adjusted to the level of the coaptation point." },
            { title: "Guide", detail: "Dilate the septum and advance the large-bore steerable guide into the LA over a stiff wire in the left upper pulmonary vein. De-air carefully." },
            { title: "Steer", detail: "Advance the delivery system and flex it down towards the valve. Use the commissural view (medial–lateral) and the LVOT view (anterior–posterior) to centre it above the target jet." },
            { title: "Align", detail: "Open the arms and rotate until they are perpendicular to the line of coaptation, confirmed in the transgastric short-axis or 3D en-face view." },
            { title: "Enter the LV", detail: "Advance below the leaflet tips with the arms open and recheck orientation, which can rotate in the LV. If the device catches chordae, close or invert the arms and return to the LA before trying again." },
            { title: "Grasp", detail: "Pull back until both leaflets lie on the arms, lower the grippers (together or independently) and close the device." },
            { title: "Check before release", detail: "Leaflet insertion on both sides in the LVOT and commissural views; residual MR (colour Doppler, pulmonary vein flow); mean transmitral gradient (commonly aiming for about 5 mmHg or less); stability. If any check fails, open, release the leaflets and regrasp." },
            { title: "Release and decide", detail: "Release, then decide whether a second device medial or lateral to the first will reduce residual MR without raising the gradient too much." },
            { title: "Finish", detail: "Withdraw the system; assess the iatrogenic ASD (size and shunt direction); close the venous access." },
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Recognition", "Response"],
          rows: [
            ["Single-leaflet device attachment (SLDA)", "The device is attached to one leaflet only; MR recurs", "Further device or surgical referral; prevented by careful insertion checks"],
            ["Leaflet tear or perforation", "New or recurrent jet", "May prevent further TEER; consider surgery"],
            ["Chordal entanglement", "The device does not move freely in the LV", "Close or invert the arms and manipulate gently; avoid force"],
            ["Iatrogenic mitral stenosis", "Gradient rises after a device", "Avoid further devices; accept some residual MR"],
            ["Iatrogenic ASD", "Shunt after guide removal", "Usually observe; close if there is significant right-to-left shunting with hypoxia or right heart failure"],
            ["Tamponade", "New effusion, hypotension", "Pericardiocentesis; consider transseptal or LA perforation"],
            ["Air or thromboembolism", "Neurological deficit, ST elevation", "Prevent with de-airing, flushing and therapeutic ACT"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Height and position of the transseptal puncture determine how easily the device reaches the valve.",
            "Perpendicular arms, central position and adequate leaflet insertion predict a durable result.",
            "Every grasp is followed by four checks: insertion, MR, gradient, stability.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Releasing after checking MR but not the gradient: severe residual MR may be replaced by iatrogenic stenosis.",
            "Assuming the arm orientation set in the LA is unchanged after entering the LV.",
            "Adding devices to chase trace residual MR at the cost of a rising gradient.",
          ],
        },
        {
          kind: "pearl",
          text: "Before grasping, ask the imager to show both leaflets resting on the arms in two planes. If you cannot see both, you are not ready to close.",
        },
        {
          kind: "sim",
          sim: "teer",
          task: "Align the device arms perpendicular to the coaptation line in the transgastric short-axis view, advance into the LV in the LVOT view, grasp, then check leaflet insertion, residual MR and mean gradient before release.",
        },
      ],
      refs: ["esc-vhd-2021", "coapt-2018", "hanna-pcm", "everest2-2011"],
    },
    {
      id: "sh-tricuspid-tmvr",
      title: "Tricuspid TEER and transcatheter valve replacement",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Severe tricuspid regurgitation (TR) is common, causes right heart failure and was historically undertreated because isolated tricuspid surgery carries high risk. Most TR is secondary: RV and annular dilatation from left heart disease, pulmonary hypertension or long-standing AF (atrial functional TR). Leads of pacemakers and defibrillators can also cause or worsen TR.",
        },
        {
          kind: "p",
          text: "Because many patients treated in transcatheter studies had TR well beyond conventional 'severe', an extended grading scheme adding 'massive' and 'torrential' grades has been proposed and is used in trials. Severity is assessed with vena contracta, EROA, regurgitant volume and hepatic vein flow, with 3D imaging for anatomy.",
        },
        { kind: "h", text: "Tricuspid TEER" },
        {
          kind: "list",
          items: [
            "Approach: femoral vein and IVC, with TOE (often supplemented by ICE) guidance.",
            "Target: the valve usually has three leaflets (anterior, posterior, septal); the anteroseptal coaptation gap is commonly treated first, then further devices as needed.",
            "Challenges: the valve lies far from the oesophagus and is harder to image; pacing leads cause shadowing and can interfere with grasping; large coaptation gaps and dense chordae; awkward angles from the IVC.",
          ],
        },
        {
          kind: "p",
          text: "In TRILUMINATE Pivotal, tricuspid TEER plus medical therapy improved a hierarchical composite endpoint compared with medical therapy alone. The benefit was driven by better quality of life; TR severity fell substantially, but there was no significant difference in death or heart failure hospitalisation at one year.",
        },
        { kind: "h", text: "Transcatheter tricuspid replacement" },
        {
          kind: "p",
          text: "Orthotopic transcatheter tricuspid valves anchor within the native valve and abolish TR more completely than TEER in anatomy unsuitable for repair. Randomised data have shown improved symptoms and quality of life compared with medical therapy. Recognised issues are conduction disturbance and pacemaker need, bleeding related to anticoagulation, and acute RV afterload mismatch when a failing RV suddenly loses its low-pressure 'pop-off' into the RA. Heterotopic caval valves (placed in the IVC and SVC) reduce venous congestion in selected inoperable patients but do not treat the tricuspid valve itself.",
        },
        {
          kind: "p",
          text: "Selection matters as much as technique. Patients with end-stage RV dysfunction or severe pre-capillary pulmonary hypertension are unlikely to benefit. Right heart catheterisation clarifies pulmonary pressures and resistance when echo is uncertain. The 2021 ESC/EACTS guideline states that transcatheter treatment of symptomatic severe secondary TR may be considered in inoperable patients at an experienced Heart Valve Centre; the field has moved quickly since, so check the current guideline.",
        },
        { kind: "h", text: "Transcatheter mitral valve replacement (overview)" },
        {
          kind: "table",
          head: ["Setting", "Key points"],
          rows: [
            ["Mitral valve-in-valve (failed surgical bioprosthesis)", "Usually transseptal; the most established TMVR setting; size to the surgical valve's true internal diameter"],
            ["Valve-in-ring (failed repair)", "Less predictable anchoring and sealing than valve-in-valve; incomplete or flexible rings are less suitable"],
            ["Valve in mitral annular calcification", "High risk of LVOT obstruction and embolisation; specialised centres"],
            ["Native-valve TMVR with dedicated devices", "Large D-shaped saddle annulus with little calcium to anchor on; transapical or transseptal delivery; anticoagulation needed afterwards"],
          ],
        },
        {
          kind: "p",
          text: "The defining risk of TMVR is LVOT obstruction: the new valve pushes the anterior mitral leaflet towards the septum. CT simulates the new valve and predicts the remaining 'neo-LVOT' area; a small predicted neo-LVOT is a contraindication unless the anterior leaflet is lacerated (LAMPOON technique) or the septum is reduced beforehand.",
        },
        {
          kind: "keypoints",
          items: [
            "Tricuspid TEER improves quality of life; mortality and hospitalisation benefit have not been shown in the pivotal trial at one year.",
            "Advanced RV failure and severe pre-capillary pulmonary hypertension predict poor response to any tricuspid intervention.",
            "TMVR planning is CT-driven, centred on predicted neo-LVOT area.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Abolishing TR in a severely impaired RV without considering afterload mismatch.",
            "Assuming a pacing lead is innocent: lead impingement may be the mechanism and changes the treatment plan.",
          ],
        },
      ],
      refs: ["triluminate-2023", "esc-vhd-2021", "esc-ph-2022", "triscend2-2025"],
    },
  ],
  quiz: [
    {
      id: "shq-carpentier",
      stem: "A patient with a previous inferior MI has MR caused by tethering of the posterior leaflet, which cannot reach the coaptation point in systole. Which Carpentier type is this?",
      options: ["Type I", "Type II", "Type IIIa", "Type IIIb"],
      answer: 3,
      explanation:
        "Restricted leaflet motion in systole only, caused by LV remodelling displacing the papillary muscles, is type IIIb, typical of ischaemic secondary MR. Type IIIa is restriction in both systole and diastole, as in rheumatic disease.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-coapt-diff",
      stem: "Which baseline difference between the COAPT and MITRA-FR populations is most often used to explain their different results?",
      options: [
        "COAPT patients had more severe MR relative to less dilated ventricles",
        "COAPT patients had primary rather than secondary MR",
        "MITRA-FR patients had preserved ejection fraction",
        "MITRA-FR used surgical repair as the comparator",
        "COAPT excluded patients on medical therapy",
      ],
      answer: 0,
      explanation:
        "COAPT enrolled patients with larger regurgitant orifices and smaller LV volumes (disproportionate MR), with medical therapy optimised before entry. Both trials studied secondary MR in reduced EF against medical therapy alone, so the primary MR and surgical comparator options are wrong.",
      difficulty: 2,
      refs: ["coapt-2018", "mitra-fr-2018", "grayburn-proportionate-mr-2019"],
    },
    {
      id: "shq-proportionate",
      stem: "A patient with dilated cardiomyopathy has LVEDV index 180 mL/m², LVEF 22% and secondary MR with EROA 0.25 cm², on incompletely titrated medical therapy. What is the most appropriate approach?",
      options: [
        "Optimise medical therapy and CRT, assess for advanced therapies; MR is proportionate",
        "Urgent TEER, because any degree of secondary MR in HFrEF should be treated promptly",
        "Surgical mitral valve replacement with chordal preservation at the next available list",
        "Tricuspid TEER first, because right-sided failure drives the symptoms here",
        "Repeat the echocardiogram in 2 years and continue the current treatment unchanged",
      ],
      answer: 0,
      explanation:
        "A modest EROA in a very large ventricle suggests proportionate MR, a marker of LV disease that is unlikely to respond to TEER, and medical therapy has not been optimised. The tempting TEER option ignores both the guideline requirement to optimise therapy first and the MITRA-FR-like profile.",
      difficulty: 2,
      refs: ["esc-vhd-2021", "mitra-fr-2018", "esc-hf-2021", "grayburn-proportionate-mr-2019"],
    },
    {
      id: "shq-teer-suitability",
      stem: "Which TOE finding is least favourable for mitral TEER?",
      options: [
        "Central A2–P2 prolapse with a single jet",
        "Posterior leaflet length 12 mm in the grasping zone",
        "Valve area 3.0 cm² with a baseline mean gradient of 5 mmHg",
        "Flail gap of 6 mm with a flail width of 10 mm on the posterior leaflet",
        "No calcium in the grasping zone on either leaflet",
      ],
      answer: 2,
      explanation:
        "A small valve area with an already raised gradient means any device will cause significant iatrogenic stenosis. The other findings are all favourable features: central pathology, adequate leaflet length, a small flail gap and no calcium where the device grasps.",
      difficulty: 2,
      refs: ["esc-vhd-2021", "everest2-2011"],
    },
    {
      id: "shq-teer-arms",
      stem: "During TEER, which TOE view is used to confirm that the device arms are perpendicular to the line of coaptation?",
      options: [
        "Transgastric basal short-axis or 3D en-face view",
        "Bicaval view",
        "Aortic valve short-axis view",
        "Mid-oesophageal four-chamber view only",
        "LAA view at 90°",
      ],
      answer: 0,
      explanation:
        "The transgastric short-axis and 3D en-face views look at the valve face-on, so the arm orientation relative to the coaptation line can be seen directly. The bicaval and aortic short-axis views guide the transseptal puncture, not device orientation.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-teer-checks",
      stem: "After grasping during TEER, MR is reduced to mild. Besides leaflet insertion and stability, which measurement must be checked before release?",
      options: [
        "Mean transmitral gradient",
        "Aortic valve peak velocity",
        "Left atrial appendage emptying velocity",
        "Tricuspid annular plane systolic excursion",
        "Pulmonary vascular resistance",
      ],
      answer: 0,
      explanation:
        "Edge-to-edge repair narrows the mitral orifice, so the mean gradient must be checked (commonly aiming for about 5 mmHg or less) to avoid exchanging regurgitation for stenosis. The other measurements do not change with the grasp.",
      difficulty: 1,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-slda",
      stem: "What is single-leaflet device attachment (SLDA) after TEER?",
      options: [
        "The device holds one leaflet but has lost, or never held, the other; MR recurs",
        "Deliberate grasping of a single flail segment to reduce a focal regurgitant jet only",
        "Embolisation of the device from the valve into the left ventricular cavity",
        "Attachment of the device to the interatrial septum during guide withdrawal",
        "A device placed deliberately at a commissure to treat a commissural jet",
      ],
      answer: 0,
      explanation:
        "SLDA means the device holds only one leaflet, usually because insertion of the other was inadequate, and MR returns. It is not embolisation, because the device is still attached to the valve, and it is prevented by careful insertion checks before release.",
      difficulty: 1,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-triluminate",
      stem: "What did TRILUMINATE Pivotal show for tricuspid TEER compared with medical therapy?",
      options: [
        "Benefit on a composite driven by quality of life, no difference in death or HF admission",
        "A significant reduction in all-cause mortality at one year compared with medical therapy",
        "No reduction in TR severity, although symptoms and quality of life still improved",
        "Harm from increased heart failure hospitalisation in the first year after TEER",
      ],
      answer: 0,
      explanation:
        "TEER substantially reduced TR and improved quality of life, which drove the composite result; death and heart failure hospitalisation were not significantly different at one year. The mortality option is the most common misremembering of the trial.",
      difficulty: 2,
      refs: ["triluminate-2023"],
    },
  ],
  caseIds: ["sh-case-teer-secondary-mr"],
  sims: [
    {
      sim: "teer",
      task: "Perform a TEER for central secondary MR: steer to A2–P2, align the arms, grasp, run the four checks (insertion, MR, gradient, stability) and decide whether a second device is justified.",
    },
  ],
};

// ===========================================================================
// Module 6 — Left atrial appendage occlusion
// ===========================================================================
const laao: Module = {
  id: "sh-laao",
  title: "Left atrial appendage occlusion",
  stage: 5,
  summary:
    "Why and for whom the left atrial appendage is occluded, what the trials show, how the appendage is imaged and sized, how lobe-only and lobe-and-disc devices are implanted and checked before release, the complications, and antithrombotic therapy afterwards.",
  objectives: [
    "Explain the rationale for LAAO and state its place in the 2024 ESC AF guideline.",
    "Summarise the direction of the randomised evidence, including PRAGUE-17, and its limitations.",
    "Size the appendage with TOE and CT and explain why measurements differ by device family.",
    "Describe the implant steps and apply release criteria (position, anchoring, compression, seal).",
    "Recognise and manage effusion, embolisation, peri-device leak and device-related thrombus.",
    "Outline post-implant antithrombotic strategies and imaging follow-up.",
  ],
  lessons: [
    {
      id: "sh-laao-rationale",
      title: "Rationale, indications and evidence",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "In non-valvular AF, the large majority of left atrial thrombi found at TOE or surgery lie in the left atrial appendage (LAA). Occluding the appendage aims to remove the main source of cardioembolism without lifelong anticoagulation. It does not address other thrombus sources, so it is no substitute for anticoagulation when there is another reason to anticoagulate (for example a mechanical valve or venous thromboembolism).",
        },
        {
          kind: "table",
          head: ["Patient group", "Role of LAAO"],
          rows: [
            ["AF with a contraindication to long-term anticoagulation (for example recurrent major bleeding from an untreatable source, or intracranial haemorrhage with high recurrence risk)", "The main indication. The 2024 ESC AF guideline states that percutaneous LAAO may be considered in this group (class IIb)."],
            ["AF on anticoagulation with high bleeding risk but no contraindication", "Studied in trials such as PRAGUE-17; a shared decision, not first-line in guidelines"],
            ["AF patients undergoing cardiac surgery", "Surgical LAA occlusion as an adjunct to anticoagulation"],
            ["Stroke despite anticoagulation", "Investigate the mechanism first (adherence, dosing, other sources); evidence for LAAO here is limited"],
          ],
        },
        {
          kind: "p",
          text: "The 2024 ESC AF guideline uses CHA2DS2-VA (sex removed from the score) to assess thromboembolic risk. Bleeding risk is assessed by identifying and treating modifiable factors rather than by a score alone.",
        },
        { kind: "h", text: "Evidence" },
        {
          kind: "p",
          text: "Early randomised trials compared a lobe-only device with warfarin. Long-term follow-up supported the concept, with fewer haemorrhagic strokes and less non-procedural bleeding, at the cost of procedural complications. PRAGUE-17 compared LAAO with direct oral anticoagulants in high-risk AF patients (previous significant bleeding, a cardioembolic event on anticoagulation, or high thromboembolic and bleeding risk scores) and found LAAO non-inferior for a composite of cardiovascular, neurological and bleeding events. Further trials comparing LAAO with direct oral anticoagulants in other populations have reported since, with results that need careful reading. The group in whom LAAO is used most often, those who cannot take any anticoagulation, is the group least represented in randomised trials.",
        },
        { kind: "h", text: "Before referral" },
        {
          kind: "list",
          items: [
            "Is the contraindication real and long term? Involve the relevant specialists (gastroenterology, neurology, haematology).",
            "Has the bleeding source been treated and have modifiable factors (blood pressure, interacting drugs, alcohol) been addressed?",
            "Can the patient take some antithrombotic therapy for a short period after implant? Almost all regimens need it.",
            "Is there another indication for anticoagulation that LAAO would not remove?",
            "Is life expectancy long enough to benefit?",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "LAAO removes the main, not the only, source of AF-related thromboembolism.",
            "2024 ESC AF guideline: may be considered (IIb) when long-term anticoagulation is contraindicated.",
            "PRAGUE-17: non-inferior to DOACs in high-risk patients for a combined net clinical endpoint.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Offering LAAO to a patient with a mechanical valve or recurrent venous thromboembolism: anticoagulation is still needed.",
            "Using LAAO to avoid a conversation about adherence or correct dosing of anticoagulation.",
          ],
        },
      ],
      refs: ["esc-af-2024", "laao-consensus-2020", "prague17-2020", "reddy-laao-5y-2017"],
    },
    {
      id: "sh-laao-imaging",
      title: "Imaging and sizing the appendage",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "The LAA is a trabeculated, often multilobed pouch arising from the anterolateral LA, between the mitral annulus and the left upper pulmonary vein, from which it is separated by a ridge of tissue. Its shape varies widely; common descriptive types are chicken-wing (an early sharp bend), windsock, cactus and cauliflower. The circumflex artery runs close to the ostium.",
        },
        {
          kind: "table",
          head: ["Modality", "Strengths", "Limitations"],
          rows: [
            ["TOE", "Excludes thrombus; real-time guidance; measurements at 0°, 45°, 90° and 135°; 3D", "Often measures smaller than CT; operator-dependent; needs sedation or anaesthesia"],
            ["Cardiac CT", "3D morphology, ostium and landing zone, lobes, relation to the circumflex; planning of transseptal site and fluoroscopic angles; follow-up for leak and device-related thrombus", "Contrast; incomplete filling can mimic thrombus (a delayed acquisition helps)"],
            ["ICE", "Intraprocedural guidance without general anaesthesia", "Fewer views; best images often need the probe in the LA"],
            ["LAA angiography", "RAO caudal and RAO cranial projections show the ostium, neck and depth", "2D projection of a 3D, often oval structure"],
          ],
        },
        { kind: "h", text: "Measurements depend on the device family" },
        {
          kind: "table",
          head: ["", "Lobe-only device", "Lobe-and-disc device"],
          rows: [
            ["Principle", "A single body sits at or just inside the ostium and seals it", "A lobe anchors inside the neck; a separate disc covers the ostium from the LA side"],
            ["Where to measure", "Maximum ostial diameter and the usable depth along the axis the sheath will follow", "Landing zone for the lobe (about 10–12 mm inside the ostium) and the ostium for the disc"],
            ["Depth requirement", "Enough depth for the device; newer generations need less than earlier ones (check the IFU)", "Enough depth for the lobe; the disc sits outside"],
            ["Sizing", "To the maximum diameter, aiming for compression within the IFU range", "Lobe sized to the maximum landing-zone diameter per the IFU table"],
            ["Examples", "Watchman FLX family", "Amulet"],
          ],
        },
        {
          kind: "p",
          text: "Measure in every plane and size to the maximum diameter: the ostium is usually oval. Measure depth along the axis the sheath will take, not to the deepest point of a curved lobe.",
        },
        {
          kind: "keypoints",
          items: [
            "Exclude thrombus first; dense spontaneous echo contrast or sludge in the appendage is a reason to pause.",
            "Use more than one modality where available and compare the measurements.",
            "Chicken-wing appendages with an early bend can be shallow along the usable axis; choose a device whose depth requirement fits (lobe-and-disc devices and newer lobe-only devices need less depth than early designs).",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring a dehydrated, fasted patient: low LA pressure makes the appendage smaller and leads to undersizing. The 2020 EHRA/EAPCI consensus confirms sizing with a mean LA pressure above 12 mmHg and suggests a fluid challenge (250–1,000 mL, according to LV function and heart failure history) when it is below 11–12 mmHg.",
            "Sizing to the smaller of two oval diameters.",
          ],
        },
      ],
      refs: ["laao-consensus-2020"],
    },
    {
      id: "sh-laao-procedure",
      title: "Implant, release criteria and complications",
      minutes: 9,
      blocks: [
        {
          kind: "steps",
          title: "Implant steps",
          items: [
            { title: "Anaesthesia and imaging", detail: "General anaesthesia with TOE, or sedation with ICE, depending on local practice." },
            { title: "Transseptal puncture", detail: "Inferior and posterior, for a coaxial approach to the anteriorly and superiorly directed appendage." },
            { title: "Anticoagulation", detail: "Unfractionated heparin to the target ACT (commonly at least 250 seconds), per protocol." },
            { title: "Access sheath", detail: "Exchange over a stiff wire in the left upper pulmonary vein for the device access sheath; de-air carefully." },
            { title: "Appendage angiography", detail: "Advance a pigtail into the appendage and inject in RAO caudal and RAO cranial projections." },
            { title: "Choose the size", detail: "Compare TOE, CT and angiographic measurements and choose the size from the IFU table." },
            { title: "Position the sheath", detail: "Advance the sheath over the pigtail to the depth required for the chosen device, gently: the appendage wall is thin." },
            { title: "Deploy", detail: "Lobe-only devices are deployed by withdrawing the sheath (unsheathing) rather than pushing the device forward. Lobe-and-disc devices deploy the lobe first, then the disc." },
            { title: "Check release criteria", detail: "Position, anchoring, compression and seal on TOE in several planes and on fluoroscopy with a contrast injection through the sheath." },
            { title: "Release and confirm", detail: "Release, then image again for position, leak and any new pericardial effusion." },
          ],
        },
        {
          kind: "table",
          caption: "Release checks",
          head: ["Check", "Lobe-only device (PASS-type)", "Lobe-and-disc device"],
          rows: [
            ["Position", "At or just distal to the ostium, covering all lobes", "Lobe in the landing zone, disc covering the ostium, lobe axis in line with the neck"],
            ["Anchor", "Tug test: gentle retraction moves the device and appendage together", "Tug test; lobe stable"],
            ["Size and compression", "Compression within the IFU range in every plane (the 2020 EHRA/EAPCI consensus gives a minimum of 8% for the earlier-generation device it describes; follow the current device's instructions for use)", "Lobe visibly compressed (tyre-shaped); separation between lobe and disc; disc concave towards the LA"],
            ["Seal", "All lobes covered; little or no peri-device flow on colour Doppler", "Disc seals the ostium; little or no leak"],
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Notes", "Management"],
          rows: [
            ["Pericardial effusion and tamponade", "The most important acute complication; from transseptal puncture, sheath or pigtail manipulation in the thin-walled appendage, or device anchors. Can be delayed.", "Echo, pericardiocentesis, reversal of heparin, surgical back-up"],
            ["Device embolisation", "Linked to undersizing or poor anchoring; device may lodge in the LA, LV or aorta", "Snare retrieval or surgery"],
            ["Air embolism", "Usually to the right coronary artery in a supine patient", "Supportive care, high-flow oxygen, atropine or pacing for bradycardia; in severe cases a coronary catheter can be used to aspirate or disperse the air"],
            ["Peri-device leak", "Historically a jet of up to 5 mm was accepted; any residual leak is increasingly regarded as undesirable", "Observe and image; in selected cases a plug or second device"],
            ["Device-related thrombus (DRT)", "Risk factors include previous stroke or TIA, permanent AF, low LVEF, a large appendage, hypercoagulability, and a deep implant leaving an uncovered ridge", "Intensify antithrombotic therapy (often anticoagulation for a limited period) and re-image"],
            ["Stroke, vascular complications", "As for other transseptal procedures", "Standard pathways"],
          ],
        },
        { kind: "h", text: "After the implant" },
        {
          kind: "p",
          text: "Regimens vary with the device, the trial evidence and the patient's bleeding risk; the 2020 EHRA/EAPCI consensus discusses the options. Typical patterns are: short-term anticoagulation with aspirin followed by antiplatelet therapy in patients who can tolerate it (as in the early trials); dual antiplatelet therapy for one to six months followed by long-term single antiplatelet therapy in patients who cannot take anticoagulation; and shorter or single antiplatelet regimens in those at the highest bleeding risk. Follow-up TOE or CT, usually within the first few months, checks for leak and DRT before therapy is stepped down. All of these must follow local protocol.",
        },
        {
          kind: "keypoints",
          items: [
            "Deploy by unsheathing, then check position, anchoring, compression and seal before release.",
            "Tamponade is the complication to watch for during and after the procedure.",
            "Plan the antithrombotic regimen and imaging follow-up before the procedure, not after.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing the device forward out of the sheath instead of withdrawing the sheath: the device can perforate the appendage.",
            "Releasing a device that moves on tug testing because the leak looks small.",
            "Implanting deep in the appendage and leaving the ostial ridge uncovered, a recognised setting for DRT.",
          ],
        },
        {
          kind: "pearl",
          text: "Check all four release criteria in all four TOE planes and say each one aloud. Under-compression in one plane is the most common reason a device later moves or leaks.",
        },
        {
          kind: "sim",
          sim: "laao",
          task: "Measure the landing zone at 0°, 45°, 90° and 135°, choose a device size that gives compression within the IFU range, deploy by unsheathing, then perform a tug test and a colour Doppler leak check before release.",
        },
      ],
      refs: ["laao-consensus-2020", "esc-af-2024", "esc-pericardial-2015"],
    },
  ],
  quiz: [
    {
      id: "shq-laao-indication",
      stem: "According to the 2024 ESC AF guideline, in which patient may percutaneous LAAO be considered?",
      options: [
        "A patient with AF and a contraindication to long-term anticoagulation",
        "A patient with AF and a mechanical mitral valve",
        "Any patient with AF who prefers not to take anticoagulation, as first-line therapy",
        "A patient with AF and recurrent pulmonary emboli",
        "A patient with AF and CHA2DS2-VA score of 0",
      ],
      answer: 0,
      explanation:
        "The guideline gives LAAO a class IIb recommendation for patients with contraindications to long-term anticoagulation. A mechanical valve or recurrent pulmonary emboli require anticoagulation regardless of the appendage, and patients at low thromboembolic risk do not need stroke prevention.",
      difficulty: 1,
      refs: ["esc-af-2024"],
    },
    {
      id: "shq-prague17",
      stem: "What did PRAGUE-17 show?",
      options: [
        "LAAO was non-inferior to DOACs for a net composite of CV, neurological and bleeding events",
        "LAAO was superior to warfarin for ischaemic stroke prevention in patients at high bleeding risk",
        "LAAO increased mortality compared with direct oral anticoagulants over four years",
        "Direct oral anticoagulants were superior to LAAO for every efficacy and safety endpoint",
      ],
      answer: 0,
      explanation:
        "PRAGUE-17 compared LAAO with DOACs (not warfarin) in high-risk patients and found non-inferiority for a broad net clinical composite. It did not show superiority for ischaemic stroke or any mortality difference.",
      difficulty: 1,
      refs: ["prague17-2020"],
    },
    {
      id: "shq-laao-ts",
      stem: "Which transseptal puncture site is preferred for LAAO?",
      options: ["Inferior and posterior", "Superior and posterior", "Superior and anterior", "Mid-fossa and anterior"],
      answer: 0,
      explanation:
        "The appendage points anteriorly and superiorly, so an inferior posterior puncture gives a coaxial sheath. Superior and posterior is the TEER site and gives an angled approach to the appendage.",
      difficulty: 1,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "shq-laao-compression",
      stem: "A lobe-only device is deployed. TOE shows 5–7% compression in all planes and the device shifts relative to the appendage on tug testing. There is a 2 mm leak. What should you do?",
      options: [
        "Recapture and redeploy a larger device, then repeat all checks",
        "Release, because the leak is under 5 mm",
        "Push the device deeper into the appendage",
        "Release and start full anticoagulation to treat the leak",
        "Abandon the procedure",
      ],
      answer: 0,
      explanation:
        "Compression is below the IFU range and the anchor check has failed, so the device is undersized and at risk of embolisation. The small leak is a distraction: a stable, well-compressed device is the priority, and pushing the device deeper does not fix undersizing.",
      difficulty: 2,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "shq-laao-fluid",
      stem: "Before final LAA measurements under general anaesthesia, the mean LA pressure is 6 mmHg. Why might you give intravenous fluid first?",
      options: [
        "Low LA pressure makes the appendage smaller and leads to undersizing",
        "To reduce the risk of air embolism through the sheath and nothing more",
        "To lower the ACT before the device is released from its cable",
        "To make a successful transseptal puncture more likely on the first attempt",
        "Fluid is never appropriate during LAAO because of the risk of oedema",
      ],
      answer: 0,
      explanation:
        "The appendage is compliant; at low filling pressures it measures smaller and the device may be undersized. The 2020 EHRA/EAPCI consensus aims for a mean LA pressure above 12 mmHg before final measurements. Adequate filling also helps reduce air entry, but that is not the main reason here.",
      difficulty: 2,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "shq-laao-effusion",
      stem: "Which is the most important acute complication to monitor for during and after LAAO?",
      options: [
        "Pericardial effusion and tamponade",
        "Complete heart block needing pacing",
        "Coronary obstruction by the device",
        "New aortic regurgitation from the sheath",
        "Mitral stenosis from device impingement",
      ],
      answer: 0,
      explanation:
        "The appendage wall is thin and the procedure involves transseptal puncture and manipulation inside the appendage, so effusion and tamponade are the main acute risks, sometimes delayed. Heart block and coronary obstruction are TAVI complications.",
      difficulty: 1,
      refs: ["laao-consensus-2020", "esc-pericardial-2015"],
    },
    {
      id: "shq-laao-drt",
      stem: "Which implant feature is a recognised risk factor for device-related thrombus after LAAO?",
      options: [
        "A deep implant that leaves the ostial ridge uncovered",
        "An implant sitting flush with the appendage ostium",
        "Device compression within the manufacturer's IFU range",
        "An inferior and posterior transseptal puncture site",
        "Use of intracardiac echo rather than TOE for guidance",
      ],
      answer: 0,
      explanation:
        "A deep implant leaves a pouch of uncovered tissue at the ostium where thrombus can form on or beside the device. Flush ostial coverage with adequate compression is the target; the transseptal site and imaging modality are not DRT risk factors.",
      difficulty: 2,
      refs: ["laao-consensus-2020"],
    },
  ],
  caseIds: ["sh-case-laao-gi-bleeding"],
  sims: [
    {
      sim: "laao",
      task: "Size and implant a device in a chicken-wing appendage: optimise LA pressure, measure in four planes, choose a size, deploy and apply the four release checks.",
    },
  ],
};

// ===========================================================================
// Module 7 — PFO and ASD closure
// ===========================================================================
const pfoAsd: Module = {
  id: "sh-pfo-asd",
  title: "PFO and ASD closure",
  stage: 5,
  summary:
    "Patent foramen ovale and stroke (RoPE, the closure trials and the European position paper), PFO closure technique and aftercare, and secundum ASD: indications, oximetry, rims, balloon sizing, erosion and the pulmonary hypertension caveat.",
  objectives: [
    "Explain the mechanisms linking PFO to stroke and the work-up needed before attributing a stroke to a PFO.",
    "Calculate the RoPE score and interpret it alongside PFO anatomy.",
    "Summarise the direction of findings of CLOSE, REDUCE and RESPECT and the 2019 European position paper recommendations.",
    "Describe PFO closure technique, aftercare and complications, especially AF.",
    "Classify ASDs and state the 2020 ESC ACHD indications and contraindications for closure.",
    "Calculate Qp:Qs from an oximetry run and describe rim assessment, balloon sizing and erosion risk.",
  ],
  lessons: [
    {
      id: "sh-pfo-stroke",
      title: "PFO and cryptogenic stroke",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "In fetal life the foramen ovale lets oxygenated placental blood bypass the lungs. After birth, rising LA pressure presses the septum primum against the septum secundum. In about a quarter of adults the two never fuse, leaving a flap-like channel, the patent foramen ovale (PFO), which opens when right atrial pressure exceeds left (on release of a Valsalva manoeuvre, coughing or straining).",
        },
        {
          kind: "p",
          text: "Proposed stroke mechanisms are paradoxical embolism of venous thrombus, thrombus forming within the PFO tunnel or an atrial septal aneurysm, and atrial arrhythmia. Because PFO is so common, finding one in a patient with stroke does not prove that it caused the stroke.",
        },
        { kind: "h", text: "Diagnosis" },
        {
          kind: "list",
          items: [
            "TTE bubble study with Valsalva: agitated saline appearing in the LA within about three cardiac cycles of right atrial opacification suggests an intracardiac shunt; later appearance suggests a pulmonary shunt.",
            "Shunt size is graded by the number of bubbles; definitions vary, and a large shunt is commonly defined as more than about 20–30 microbubbles.",
            "TOE defines anatomy: tunnel length, atrial septal aneurysm (septal excursion commonly 10 mm or more beyond the midline), Eustachian valve or Chiari network, other defects.",
            "Transcranial Doppler is sensitive for right-to-left shunt but does not show its location.",
          ],
        },
        { kind: "h", text: "RoPE score" },
        {
          kind: "table",
          caption: "Risk of Paradoxical Embolism (RoPE) score",
          head: ["Characteristic", "Points"],
          rows: [
            ["No history of hypertension", "1"],
            ["No history of diabetes", "1"],
            ["No history of stroke or TIA", "1"],
            ["Non-smoker", "1"],
            ["Cortical infarct on imaging", "1"],
            ["Age 18–29", "5"],
            ["Age 30–39", "4"],
            ["Age 40–49", "3"],
            ["Age 50–59", "2"],
            ["Age 60–69", "1"],
            ["Age 70 or over", "0"],
          ],
        },
        {
          kind: "p",
          text: "The maximum is 10. Higher scores mean the PFO is more likely to be causal, because conventional vascular risk factors are less likely to explain the stroke. RoPE was derived before the closure trials; later analyses combined it with PFO anatomy (large shunt, atrial septal aneurysm) to estimate how likely a patient is to benefit from closure.",
        },
        { kind: "h", text: "The closure trials" },
        {
          kind: "table",
          head: ["Trial", "Population", "Main finding (direction)"],
          rows: [
            ["CLOSE", "Younger adults (up to 60) with cryptogenic stroke and a PFO with atrial septal aneurysm or large shunt", "Closure plus antiplatelet therapy reduced recurrent stroke compared with antiplatelet therapy alone; AF was more frequent after closure"],
            ["REDUCE", "Cryptogenic stroke with PFO", "Closure plus antiplatelet therapy reduced recurrent ischaemic stroke compared with antiplatelet therapy alone; AF or flutter was more frequent after closure"],
            ["RESPECT (extended follow-up)", "Cryptogenic stroke with PFO", "Closure reduced recurrent ischaemic stroke of undetermined cause over long-term follow-up; venous thromboembolism was more frequent in the closure group"],
          ],
        },
        {
          kind: "p",
          text: "The 2019 European position paper recommends closure for patients aged 18–65 with a confirmed cryptogenic stroke, TIA or systemic embolism and a high estimated probability that the PFO is causal, after a thorough work-up by a neurologist and cardiologist working together. In patients who are not closed, antithrombotic therapy is chosen individually.",
        },
        {
          kind: "list",
          items: [
            "Brain MRI: an embolic-appearing (typically cortical or non-lacunar) infarct.",
            "Imaging of the head and neck arteries: exclude large-artery disease and dissection.",
            "Prolonged rhythm monitoring for AF, particularly in older patients.",
            "TTE with bubble study and TOE for septal anatomy and other cardiac sources.",
            "Selective thrombophilia testing (for example antiphospholipid antibodies) and venous imaging where indicated.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "A PFO is common; causality is a judgement based on age, stroke pattern, risk factors and PFO anatomy.",
            "Benefit from closure is concentrated in younger patients with embolic-appearing strokes and high-risk anatomy.",
            "AF is more common after closure, mostly early and transient.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Closing a PFO in a patient with a lacunar infarct and long-standing hypertension, where small-vessel disease is the likely cause.",
            "Skipping prolonged rhythm monitoring in an older patient and missing paroxysmal AF.",
          ],
        },
      ],
      refs: ["rope-2013", "close-2017", "reduce-2017", "respect-2017", "pfo-position-2019", "kent-pascal-2021"],
    },
    {
      id: "sh-pfo-closure",
      title: "PFO closure: technique and aftercare",
      minutes: 7,
      blocks: [
        {
          kind: "steps",
          title: "Procedure",
          items: [
            { title: "Imaging", detail: "TOE under sedation or anaesthesia, or ICE; some centres use TTE and fluoroscopy for straightforward anatomy." },
            { title: "Access", detail: "Right femoral venous access; heparin per protocol." },
            { title: "Cross", detail: "Cross the PFO with a multipurpose catheter and a soft wire, usually directed towards the superior part of the fossa, and place the wire in the left upper pulmonary vein." },
            { title: "Assess the anatomy", detail: "Tunnel length, thickness of septum secundum, atrial septal aneurysm. Balloon sizing is not routine for PFO but some operators use it in complex anatomy." },
            { title: "Choose the device", detail: "A double-disc occluder; larger sizes are used for aneurysmal septa, thick septum secundum or long tunnels, within IFU guidance." },
            { title: "Deploy", detail: "Advance the de-aired delivery sheath into the LA; open the left atrial disc in the mid-LA, pull it back against the septum, then open the right atrial disc." },
            { title: "Check", detail: "Both discs on the correct sides, with septum primum and secundum held between them; stable on a push–pull test; no contact with the aortic root or valves; colour Doppler and, if needed, a bubble injection." },
            { title: "Release and finish", detail: "Release, image for effusion and position, and achieve venous haemostasis." },
          ],
        },
        {
          kind: "table",
          caption: "After closure (typical practice; follow local protocol)",
          head: ["Item", "Typical approach"],
          rows: [
            ["Antiplatelet therapy", "Dual antiplatelet therapy for one to several months, then single antiplatelet therapy for longer (several years in the trial protocols)"],
            ["Endocarditis prevention", "Good dental hygiene; antibiotic prophylaxis according to the current endocarditis guideline and local policy for the months after device implantation"],
            ["Follow-up imaging", "Echo with bubble study at about six months to check for residual shunt"],
            ["Activity", "Avoid strenuous activity for a short period"],
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Notes"],
          rows: [
            ["Atrial fibrillation", "The most frequent; usually within the first weeks and transient"],
            ["Residual shunt", "Usually small; larger residual shunts may justify a second device in selected patients"],
            ["Device thrombus", "Uncommon; treated with anticoagulation"],
            ["Embolisation, tamponade", "Rare; snare retrieval or surgery; pericardiocentesis"],
            ["Erosion", "Very rare with PFO devices"],
            ["Nickel hypersensitivity", "Rare; chest discomfort, palpitations or rash in the first weeks"],
          ],
        },
        { kind: "h", text: "Anatomical challenges" },
        {
          kind: "table",
          head: ["Feature", "Problem", "Approach"],
          rows: [
            ["Long tunnel or thick septum secundum", "Discs splay or fail to sit flat", "Choose a device suited to tunnel anatomy; some operators perform a transseptal puncture through the septum primum to shorten the tunnel"],
            ["Atrial septal aneurysm", "A floppy septum lets the device move and leaves residual shunt", "A larger device to cover the mobile septum, within IFU limits"],
            ["Prominent Eustachian valve or Chiari network", "Catheter or device entanglement", "Careful wire and sheath handling; image before releasing"],
            ["Additional fenestrations", "Residual shunt", "Identify on TOE before choosing the device"],
          ],
        },
        {
          kind: "p",
          text: "Closure is also discussed in other settings, such as recurrent decompression illness in divers and platypnoea–orthodeoxia, which are addressed in separate consensus documents. Closure for migraine is not an established indication.",
        },
        {
          kind: "keypoints",
          items: [
            "Confirm both discs are on the correct sides of the septum in two planes before release.",
            "Warn patients about palpitations: AF after closure is common enough to discuss at consent.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Releasing when part of the right atrial disc has prolapsed through the tunnel into the LA.",
            "Missing an additional defect (fenestration or separate ASD) that leaves a shunt after closure.",
          ],
        },
      ],
      refs: ["pfo-position-2019", "close-2017", "reduce-2017", "respect-2017", "esc-endocarditis-2023"],
    },
    {
      id: "sh-asd",
      title: "Secundum ASD",
      minutes: 9,
      blocks: [
        {
          kind: "table",
          caption: "Types of atrial septal defect",
          head: ["Type", "Location and associations", "Device closure?"],
          rows: [
            ["Secundum (the large majority)", "Within the fossa ovalis", "Yes, if size and rims are suitable"],
            ["Primum (partial atrioventricular septal defect)", "Lower septum next to the AV valves; often a cleft mitral leaflet", "No: surgery"],
            ["Superior sinus venosus", "Near the SVC entry; often anomalous drainage of the right upper pulmonary vein", "Surgery (covered-stent techniques in selected centres)"],
            ["Inferior sinus venosus", "Near the IVC entry", "Surgery"],
            ["Coronary sinus (unroofed)", "Between the coronary sinus and the LA", "Surgery"],
          ],
        },
        {
          kind: "p",
          text: "A left-to-right shunt at atrial level causes volume overload of the RA, RV and pulmonary circulation. Over decades it can lead to RV dilatation and dysfunction, atrial arrhythmias, paradoxical embolism and, in a minority, pulmonary arterial hypertension.",
        },
        { kind: "h", text: "Indications (2020 ESC ACHD guideline)" },
        {
          kind: "list",
          items: [
            "RV volume overload without pulmonary arterial hypertension (PVR below 3 Wood units): closure recommended regardless of symptoms.",
            "Device closure is the method of choice for secundum ASD when technically suitable.",
            "Suspected paradoxical embolism, with other causes excluded: closure should be considered, provided there is no pulmonary hypertension or LV disease.",
            "PVR 3–5 Wood units: closure should be considered when there is a significant left-to-right shunt (Qp:Qs above 1.5).",
            "PVR 5 Wood units or more: fenestrated closure may be considered only if PVR falls below 5 Wood units with targeted pulmonary hypertension therapy and the shunt remains significant.",
            "Eisenmenger physiology, PVR 5 Wood units or more despite treatment, or desaturation on exercise: closure not recommended.",
            "LV disease (common in older patients): perform balloon test occlusion and weigh the benefit of closure against the rise in LA pressure it may cause.",
          ],
        },
        {
          kind: "p",
          text: "The PVR thresholds above come from the 2020 ACHD guideline. The 2022 ESC/ERS pulmonary hypertension guideline lowered the haemodynamic definition of pulmonary hypertension (including a PVR threshold above 2 Wood units for pre-capillary PH); interpret borderline values with a specialist pulmonary hypertension and ACHD team.",
        },
        { kind: "h", text: "Oximetry and shunt calculation" },
        {
          kind: "formula",
          name: "Pulmonary-to-systemic flow ratio",
          expr: "Qp:Qs = (SaO2 − SmvO2) ÷ (SpvO2 − SpaO2)",
          note: "SaO2 systemic arterial, SmvO2 mixed venous, SpvO2 pulmonary venous, SpaO2 pulmonary arterial saturation. For an ASD the mixed venous sample must come from proximal to the shunt; it is commonly estimated as (3 × SVC + 1 × IVC) ÷ 4 (Flamm formula). If pulmonary venous blood is not sampled and there is no right-to-left shunt, systemic arterial saturation is often used as a substitute.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Run a saturation series (SVC, IVC, high and low RA, RV, PA, aorta) in a patient with a secundum ASD, identify the step-up, and calculate Qp:Qs using the Flamm mixed venous estimate.",
        },
        { kind: "h", text: "Anatomy for device closure: the rims" },
        {
          kind: "table",
          head: ["Rim", "Direction", "Notes"],
          rows: [
            ["Aortic (anterosuperior)", "Towards the aortic root", "Often deficient and generally acceptable, but a deficient aortic rim combined with an oversized device is linked to erosion"],
            ["Superior (SVC)", "Towards the SVC", "Needed for stability"],
            ["Posterosuperior", "Towards the right upper pulmonary vein", "Needed"],
            ["Posterior", "Towards the posterior atrial wall", "Needed"],
            ["Inferior (IVC)", "Towards the IVC", "A deficient IVC rim usually precludes device closure"],
            ["Atrioventricular valve (anteroinferior)", "Towards the mitral and tricuspid valves", "Needed to avoid valve interference"],
          ],
        },
        {
          kind: "p",
          text: "Rims of about 5 mm or more (other than the aortic rim) are generally considered adequate. Deficient IVC or posterior rims, very large defects relative to the total septal length, and multiple widely separated fenestrations favour surgery.",
        },
        {
          kind: "steps",
          title: "Sizing and deployment",
          items: [
            { title: "Imaging and access", detail: "TOE or ICE; femoral venous access; heparin." },
            { title: "Cross", detail: "Cross the defect and place a stiff wire in the left upper pulmonary vein." },
            { title: "Size", detail: "Inflate a compliant sizing balloon across the defect until colour flow stops (the 'stop-flow' diameter), measured on echo and fluoroscopy. Some centres size from 3D TOE without a balloon." },
            { title: "Choose the device", detail: "A self-centring double-disc occluder whose waist matches the stop-flow diameter, avoiding gross oversizing." },
            { title: "Deploy and check", detail: "Open the left atrial disc, the waist and the right atrial disc. Confirm that all rims are captured between the discs, that there is no AV valve interference, and that the device is stable on push–pull before release." },
          ],
        },
        { kind: "h", text: "Erosion" },
        {
          kind: "p",
          text: "Erosion of an ASD device through the atrial wall or aortic root is rare but can cause tamponade or an aorto-atrial fistula, sometimes months after implantation. It is associated with deficient aortic and superior rims, oversized devices and devices that deform against the aortic root. Avoid oversizing, and tell patients to seek urgent assessment for chest pain, collapse or breathlessness after closure.",
        },
        {
          kind: "keypoints",
          items: [
            "Only secundum ASDs are suitable for device closure; sinus venosus defects need anomalous pulmonary veins excluded.",
            "RV volume overload is the indication; fixed pulmonary vascular disease is the contraindication.",
            "Size to the stop-flow diameter; oversizing increases erosion risk.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Closing an ASD in established pulmonary vascular disease: the defect may be acting as a pop-off for a failing RV.",
            "Closing an ASD in an older patient with stiff LV without test occlusion, leading to pulmonary oedema.",
            "Missing a sinus venosus defect on TTE: TOE, CT or MRI is needed when RV dilatation is unexplained.",
          ],
        },
      ],
      refs: ["esc-achd-2020", "esc-ph-2022", "hanna-pcm", "flamm-mixed-venous-1969"],
    },
  ],
  quiz: [
    {
      id: "shq-rope",
      stem: "A 52-year-old with treated hypertension, no diabetes, no previous stroke or TIA, who has never smoked, has a cortical infarct and a PFO. What is the RoPE score?",
      options: ["4", "5", "6", "7", "8"],
      answer: 2,
      explanation:
        "Age 50–59 scores 2; no diabetes 1, no previous stroke or TIA 1, non-smoker 1, cortical infarct 1; hypertension scores 0. Total 6. A common error is to award the hypertension point, which is given only for the absence of hypertension.",
      difficulty: 2,
      refs: ["rope-2013"],
    },
    {
      id: "shq-close-pop",
      stem: "Which PFO population did the CLOSE trial enrol?",
      options: [
        "Adults up to 60 years with cryptogenic stroke and a PFO with atrial septal aneurysm or large shunt",
        "Adults over 70 with lacunar stroke",
        "Patients with migraine and PFO",
        "Patients with PFO and atrial fibrillation",
      ],
      answer: 0,
      explanation:
        "CLOSE deliberately selected younger patients with high-risk PFO anatomy, which helps explain its clear benefit. Lacunar strokes in older patients are usually small-vessel disease and are not the target of PFO closure.",
      difficulty: 1,
      refs: ["close-2017"],
    },
    {
      id: "shq-pfo-af",
      stem: "Which complication is consistently more frequent after PFO closure than with medical therapy in the randomised trials?",
      options: [
        "Atrial fibrillation, usually early and transient",
        "Device erosion",
        "Complete heart block",
        "Infective endocarditis",
        "Aortic regurgitation",
      ],
      answer: 0,
      explanation:
        "New AF was more frequent in the closure arms, mostly in the first weeks and often self-limiting. Device erosion is very rare with PFO devices and is more of a concern with oversized ASD devices.",
      difficulty: 1,
      refs: ["reduce-2017", "close-2017"],
    },
    {
      id: "shq-asd-sinus-venosus",
      stem: "TOE shows a superior sinus venosus defect with the right upper pulmonary vein draining to the SVC–RA junction. What is the usual treatment?",
      options: [
        "Surgical repair",
        "Standard double-disc device closure",
        "PFO occluder",
        "Medical therapy only",
      ],
      answer: 0,
      explanation:
        "Sinus venosus defects lie outside the fossa and are commonly associated with anomalous pulmonary venous drainage, which a septal occluder cannot correct. Standard device closure is suitable only for secundum ASDs; covered-stent techniques are offered in a few specialist centres.",
      difficulty: 1,
      refs: ["esc-achd-2020"],
    },
    {
      id: "shq-asd-pvr",
      stem: "A 45-year-old with a large secundum ASD has PVR 7 Wood units despite targeted pulmonary hypertension therapy and desaturates on exercise. What does the 2020 ESC ACHD guideline advise?",
      options: [
        "ASD closure is not recommended",
        "Device closure is recommended",
        "Surgical closure is recommended",
        "Fenestrated closure is recommended",
        "Closure is recommended if Qp:Qs exceeds 1.5",
      ],
      answer: 0,
      explanation:
        "PVR of 5 Wood units or more despite treatment, or exercise desaturation, is a contraindication to closure. Fenestrated closure is reserved for patients whose PVR falls below 5 Wood units with treatment and who still have a significant left-to-right shunt.",
      difficulty: 2,
      refs: ["esc-achd-2020", "esc-ph-2022"],
    },
    {
      id: "shq-qpqs",
      stem: "In a patient with an ASD: aortic saturation 96%, SVC 70%, IVC 78%, PA 85%, pulmonary vein 98%. Using the Flamm estimate for mixed venous saturation, what is Qp:Qs?",
      options: ["About 1.2", "About 1.5", "About 1.8", "About 2.4", "About 3.0"],
      answer: 2,
      explanation:
        "Mixed venous = (3 × 70 + 78) ÷ 4 = 72%. Qp:Qs = (96 − 72) ÷ (98 − 85) = 24 ÷ 13 ≈ 1.8. Using the PA saturation as the mixed venous value is the classic error: the PA sample lies downstream of the shunt.",
      difficulty: 2,
      refs: ["esc-achd-2020", "flamm-mixed-venous-1969"],
    },
    {
      id: "shq-asd-rim",
      stem: "Which TOE finding most clearly makes a secundum ASD unsuitable for device closure?",
      options: [
        "Absent IVC rim",
        "Deficient aortic rim with all other rims adequate",
        "Defect diameter 14 mm",
        "Qp:Qs of 1.8",
        "Dilated right ventricle",
      ],
      answer: 0,
      explanation:
        "A deficient inferior (IVC) rim leaves nothing for the device to hold inferiorly and usually means surgery. A deficient aortic rim is common and generally acceptable, although it increases erosion risk if the device is oversized. RV dilatation and Qp:Qs above 1.5 are indications, not contraindications.",
      difficulty: 2,
      refs: ["esc-achd-2020"],
    },
    {
      id: "shq-asd-erosion",
      stem: "Which combination most increases the risk of ASD device erosion?",
      options: [
        "Deficient aortic rim and an oversized device",
        "Adequate rims and a device matched to the stop-flow diameter",
        "Small defect closed with a PFO occluder",
        "Deficient IVC rim treated surgically",
      ],
      answer: 0,
      explanation:
        "Erosion is associated with deficient aortic and superior rims and with oversized devices that press on the aortic root. Matching the device waist to the stop-flow diameter is the preventive strategy.",
      difficulty: 2,
      refs: ["esc-achd-2020"],
    },
  ],
  caseIds: ["sh-case-pfo-cryptogenic-stroke"],
  sims: [
    {
      sim: "haemo",
      task: "Perform an oximetry run for a suspected ASD, identify the atrial step-up and calculate Qp:Qs and PVR to decide whether closure is indicated.",
    },
  ],
};

// ===========================================================================
// Module 8 — Other structural procedures
// ===========================================================================
const otherStructural: Module = {
  id: "sh-other",
  title: "Valvuloplasty, septal ablation and other procedures",
  stage: 5,
  summary:
    "Balloon aortic valvuloplasty, alcohol septal ablation for obstructive hypertrophic cardiomyopathy, percutaneous mitral commissurotomy, paravalvular leak closure, and a brief overview of pulmonary valve interventions.",
  objectives: [
    "State the limited role of balloon aortic valvuloplasty in adults and perform it safely.",
    "Select patients for alcohol septal ablation, measure the LVOT gradient invasively and choose the septal branch with myocardial contrast echocardiography.",
    "Assess suitability for percutaneous mitral commissurotomy with the Wilkins score and contraindications, and size an Inoue balloon.",
    "Describe the indications, approach and pitfalls of paravalvular leak closure.",
    "Outline balloon pulmonary valvuloplasty and transcatheter pulmonary valve implantation, including coronary compression testing.",
  ],
  lessons: [
    {
      id: "sh-bav",
      title: "Balloon aortic valvuloplasty",
      minutes: 6,
      blocks: [
        {
          kind: "p",
          text: "Balloon aortic valvuloplasty (BAV) dilates a stenotic valve by cracking calcium and separating fused commissures. In adults with calcific AS the gain in valve area is modest and restenosis usually follows within months, so it rarely provides lasting benefit on its own.",
        },
        {
          kind: "list",
          items: [
            "Bridge to TAVI or surgery in haemodynamically unstable patients (the 2021 ESC/EACTS guideline: may be considered).",
            "Before urgent high-risk non-cardiac surgery in a patient with symptomatic severe AS (may be considered).",
            "Occasionally as a test of whether symptoms are due to AS when comorbidity confuses the picture, or as palliation.",
            "Part of a TAVI (predilatation) or to assess coronary-obstruction risk with simultaneous aortography.",
          ],
        },
        {
          kind: "steps",
          title: "Technique",
          items: [
            { title: "Access", detail: "Retrograde femoral arterial access with a sheath sized for the balloon (some centres use radial access with low-profile balloons); venous access or LV-wire pacing." },
            { title: "Cross and wire", detail: "Cross the valve as for TAVI and place a pre-shaped stiff wire at the LV apex." },
            { title: "Choose the balloon", detail: "Size to the annulus from CT or echo, choosing a diameter that does not exceed it; start smaller if in doubt." },
            { title: "Inflate under rapid pacing", detail: "Inflate quickly once pressure has fallen, deflate fully, then stop pacing." },
            { title: "Reassess", detail: "Measure the gradient and check for new aortic regurgitation; repeat or upsize only with care." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "An oversized balloon causes severe aortic regurgitation or annular rupture.",
            "Without rapid pacing or a stiff wire, the balloon slips out of the valve during inflation.",
            "Large-bore arterial access in frail patients: bleeding and vascular complications are a major source of harm.",
            "Stroke from calcific debris; keep manipulation in the valve to a minimum.",
          ],
        },
        { kind: "h", text: "Assessing the result" },
        {
          kind: "p",
          text: "Record simultaneous LV and aortic pressures before and after dilatation. A useful result is a clear fall in the mean gradient and a rise in cardiac output without new significant aortic regurgitation. Watch the aortic diastolic pressure and the LVEDP after each inflation: a falling diastolic pressure with a rising LVEDP is the haemodynamic signature of acute regurgitation, which is poorly tolerated by a small, stiff, hypertrophied ventricle.",
        },
        {
          kind: "table",
          head: ["Situation", "What BAV can and cannot do"],
          rows: [
            ["Cardiogenic shock from critical AS", "Can stabilise as a bridge to definitive treatment; mortality remains high"],
            ["Uncertain contribution of AS to symptoms in a patient with lung disease", "Symptomatic improvement after BAV supports the decision to proceed to TAVI"],
            ["Urgent non-cardiac surgery", "Temporarily reduces anaesthetic risk; the valve will need definitive treatment later"],
            ["Definitive therapy", "Not appropriate when TAVI or surgery is possible: restenosis is expected"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "BAV is a bridge or a test, not a durable treatment, in calcific AS.",
            "Balloon no larger than the annulus, rapid pacing and a stiff apical wire.",
            "Plan the definitive treatment at the time of BAV.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "hanna-pcm"],
    },
    {
      id: "sh-asa",
      title: "Alcohol septal ablation for obstructive HCM",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "In obstructive hypertrophic cardiomyopathy (HCM), the thickened basal septum and systolic anterior motion (SAM) of the mitral valve obstruct the LVOT. Septal reduction therapy, either surgical myectomy or alcohol septal ablation (ASA), is offered to patients with a resting or provoked LVOT gradient of 50 mmHg or more who remain significantly symptomatic despite maximally tolerated medical therapy (beta-blockers, non-dihydropyridine calcium channel blockers, disopyramide and, more recently, cardiac myosin inhibitors). It should be done in experienced centres.",
        },
        {
          kind: "table",
          head: ["Favours surgical myectomy", "Favours alcohol septal ablation"],
          rows: [
            ["Very thick septum (around 30 mm or more), where ASA is less effective", "Older age, comorbidity, high surgical risk"],
            ["Mitral or papillary muscle abnormality needing repair", "Patient preference after informed discussion"],
            ["Need for other cardiac surgery (CABG, valve surgery)", "Suitable septal branch supplying the contact area"],
            ["No suitable septal artery", "Moderate septal thickness"],
          ],
        },
        { kind: "h", text: "Haemodynamics in the lab" },
        {
          kind: "p",
          text: "Measure the LV–aortic gradient with a catheter in the LV body or apex whose holes are only at its distal end (Rigopoulos and Seggewiss use a distal-hole pigtail), positioned away from the obstruction to avoid entrapment artefact, with simultaneous aortic pressure. Side holes that straddle the obstruction would mix pressures from above and below it. Provoke with a Valsalva manoeuvre or a post-extrasystolic beat. In the Brockenbrough–Braunwald–Morrow sign, the beat after a premature ventricular contraction shows a larger LV–aortic gradient and a smaller aortic pulse pressure; in fixed valvular AS the aortic pulse pressure rises instead.",
        },
        {
          kind: "steps",
          title: "Procedure",
          items: [
            { title: "Pacing", detail: "Place a temporary pacing wire in the RV: complete heart block is a recognised complication." },
            { title: "Access and baseline", detail: "Two arterial accesses (guide catheter and LV catheter) and a baseline gradient at rest and after provocation." },
            { title: "Choose the septal branch", detail: "Coronary angiography to identify the septal perforators; the target is usually a proximal septal branch supplying the basal septum at the point of SAM–septal contact." },
            { title: "Occlude", detail: "Wire the septal branch and inflate a short over-the-wire balloon sized to the branch. Confirm with contrast through the guide that the LAD remains open, and through the balloon lumen that there is no reflux into the LAD." },
            { title: "Myocardial contrast echo", detail: "Inject echo contrast through the balloon lumen. The opacified area must be the basal septum at the SAM contact point, not the papillary muscles, RV free wall, LV free wall or distal septum. If the territory is wrong, choose another branch." },
            { title: "Inject alcohol", detail: "Inject a small volume of dehydrated alcohol slowly through the inflated balloon (commonly in the order of 1–3 mL, per local protocol), watching the rhythm and gradient." },
            { title: "Wait and withdraw", detail: "Keep the balloon inflated for several minutes, then deflate and withdraw. Angiography confirms an occluded septal branch and an intact LAD." },
            { title: "Monitor", detail: "Coronary care monitoring for at least 48 hours (Rigopoulos and Seggewiss) with the pacing wire in place, removing it the next day only if there is no AV block, with serial ECGs and echo." },
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Notes"],
          rows: [
            ["Complete heart block", "Permanent pacing is needed in a minority (roughly one in ten in many series). RBBB is common after ASA, so pre-existing LBBB raises the risk of complete block."],
            ["Alcohol escaping into the LAD or other territory", "Large anterior infarction; prevented by balloon position checks and slow injection"],
            ["Ventricular arrhythmia", "Monitor; scar may be arrhythmogenic"],
            ["Coronary dissection", "From wiring a small septal branch"],
            ["Ventricular septal defect", "Rare; more likely in thinner septa"],
            ["Tamponade", "Usually from the pacing wire"],
          ],
        },
        {
          kind: "p",
          text: "The gradient often falls immediately, may rise again over the following days as stunning resolves, then falls further over months as the septum thins.",
        },
        {
          kind: "keypoints",
          items: [
            "Pace before you ablate.",
            "Myocardial contrast echo decides the branch; angiography alone is not enough.",
            "Judge the result over months, not just on the table.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Ablating a branch that also supplies a papillary muscle or the RV free wall.",
            "Measuring an apparent gradient caused by catheter entrapment in a small hypertrophied cavity.",
          ],
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Record simultaneous LV and aortic pressures in obstructive HCM, provoke a post-extrasystolic beat and identify the Brockenbrough–Braunwald–Morrow sign.",
        },
      ],
      refs: ["hanna-pcm", "brockenbrough-1961", "esc-cardiomyopathy-2023", "rigopoulos-asa-2016"],
    },
    {
      id: "sh-pmc",
      title: "Percutaneous mitral commissurotomy",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Rheumatic mitral stenosis (MS) remains common worldwide and is seen in UK practice, particularly in patients who grew up where rheumatic fever is endemic. Percutaneous mitral commissurotomy (PMC) splits the fused commissures with a balloon passed transseptally; the Inoue balloon technique is the most widely used.",
        },
        { kind: "h", text: "Indications (2021 ESC/EACTS)" },
        {
          kind: "list",
          items: [
            "Clinically significant MS is a valve area of 1.5 cm² or less.",
            "PMC is recommended in symptomatic patients without unfavourable characteristics for PMC.",
            "PMC is recommended in symptomatic patients with a contraindication to, or high risk for, surgery.",
            "Surgery is recommended in symptomatic patients who are not suitable for PMC.",
            "PMC should be considered in asymptomatic patients without unfavourable characteristics who have a high thromboembolic risk or a high risk of haemodynamic decompensation (for example planned pregnancy).",
          ],
        },
        {
          kind: "table",
          caption: "Contraindications to PMC (2021 ESC/EACTS)",
          head: ["Contraindication", "Reason"],
          rows: [
            ["Valve area above 1.5 cm²", "Little to gain"],
            ["Left atrial thrombus", "Embolisation during the procedure"],
            ["More than mild MR", "Likely to worsen"],
            ["Severe or bicommissural calcification", "Commissures will not split; tearing more likely"],
            ["No commissural fusion", "The mechanism PMC relies on is absent"],
            ["Severe aortic disease, or severe combined tricuspid stenosis and regurgitation, needing surgery", "Surgery treats all lesions"],
            ["Coronary disease needing CABG", "Surgery treats both"],
          ],
        },
        {
          kind: "table",
          caption: "Wilkins echo score (each feature graded 1 to 4; total 4–16)",
          head: ["Feature", "Grade 1", "Grade 4"],
          rows: [
            ["Leaflet mobility", "Highly mobile; only the tips restricted", "Little or no forward movement in diastole"],
            ["Leaflet thickening", "Close to normal thickness", "Marked thickening of all leaflet tissue"],
            ["Calcification", "A single bright area", "Extensive brightness through most of the leaflet"],
            ["Subvalvular thickening", "Minimal, just below the leaflets", "Extensive thickening and shortening down to the papillary muscles"],
          ],
        },
        {
          kind: "p",
          text: "A total of 8 or less predicts a good result. The score does not capture commissural calcification, which matters independently, and other scores combine echo and fluoroscopic findings. Exclude LA and LAA thrombus with TOE before the procedure.",
        },
        {
          kind: "formula",
          name: "Inoue balloon reference size",
          expr: "Reference diameter (mm) = height (cm) ÷ 10 + 10",
          note: "Inflation is stepwise, usually starting a few millimetres below the reference size and increasing in 1-mm steps with echo assessment between inflations.",
        },
        {
          kind: "formula",
          name: "Gorlin mitral valve area",
          expr: "MVA (cm²) = [CO (mL/min) ÷ (HR × diastolic filling period (s/beat))] ÷ (37.7 × √mean gradient (mmHg))",
          note: "37.7 is the empirical constant (44.3 × 0.85) for the mitral valve. The formula is unreliable at low output and with significant MR.",
        },
        {
          kind: "steps",
          title: "Procedure outline",
          items: [
            { title: "Transseptal puncture", detail: "Mid-fossa, avoiding a high or anterior site, so that the balloon can be steered across the mitral valve." },
            { title: "Baseline", detail: "LA pressure and transmitral gradient; heparin per protocol." },
            { title: "Prepare the septum", detail: "Pass a coiled stiff wire into the LA and dilate the septum." },
            { title: "Cross", detail: "Advance the balloon into the LA and steer it across the mitral valve with a stylet, usually in the RAO view." },
            { title: "Inflate", detail: "Inflate the distal part, pull back against the valve, then inflate fully; withdraw into the LA." },
            { title: "Assess", detail: "After each inflation: gradient, valve area, commissural splitting and MR on echo." },
            { title: "Stop", detail: "Stop when the result is adequate (commonly a valve area above about 1.5 cm² with no more than moderate MR) or when MR increases." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Proceeding without TOE exclusion of LAA thrombus.",
            "Upsizing after MR has increased: severe MR from a leaflet tear needs surgery.",
            "A transseptal puncture too high or too anterior makes crossing the mitral valve difficult.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Commissural fusion is what PMC splits; without it, PMC does not work.",
            "Wilkins 8 or less, no LA thrombus and no more than mild MR predict success.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "gorlin-1951", "hanna-pcm", "wilkins-score-1988"],
    },
    {
      id: "sh-pvl-pulmonary",
      title: "Paravalvular leak closure and pulmonary valve interventions",
      minutes: 7,
      blocks: [
        { kind: "h", text: "Paravalvular leak after surgical valve replacement" },
        {
          kind: "p",
          text: "Paravalvular leaks occur when the sewing ring separates from the annulus, often because of annular calcification, friable tissue or previous endocarditis. They are more common around mitral than aortic prostheses. Patients present with heart failure from regurgitation, haemolysis (anaemia with raised LDH, low haptoglobin and fragmented red cells), or both. The 2021 ESC/EACTS guideline supports percutaneous closure of clinically significant leaks in patients at high surgical risk, decided by the Heart Team.",
        },
        {
          kind: "table",
          head: ["Step", "Detail"],
          rows: [
            ["Localise", "3D TOE with a clock-face description relative to fixed landmarks (aortic valve, LAA); CT where echo is limited"],
            ["Exclude contraindications", "Active endocarditis; an unstable, rocking prosthesis from extensive dehiscence (needs surgery); LA thrombus"],
            ["Approach", "Aortic leaks: retrograde from the aorta. Mitral leaks: antegrade transseptal, retrograde through the aortic valve, or transapical"],
            ["Support", "Difficult leaks may need a wire rail (an arteriovenous or transapical loop) to deliver the device"],
            ["Device", "Occluders or vascular plugs chosen to fit the defect; crescent-shaped leaks may need more than one device"],
            ["Check before release", "Prosthetic leaflet or disc motion unimpaired (critical with mechanical valves); residual leak; no new gradient"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Releasing a plug that interferes with a mechanical disc: it can jam the valve.",
            "Leaving a small high-velocity residual jet in a patient referred for haemolysis: haemolysis can persist or worsen.",
            "Attempting closure of a large dehiscence with a rocking prosthesis instead of referring for surgery.",
          ],
        },
        { kind: "h", text: "Pulmonary valve interventions (brief)" },
        {
          kind: "p",
          text: "Valvular pulmonary stenosis is usually congenital. Balloon pulmonary valvuloplasty is the treatment of choice for a dome-shaped, non-dysplastic valve, using a balloon somewhat larger than the annulus; dysplastic valves (for example in Noonan syndrome) respond less well. The 2020 ESC ACHD guideline uses a peak Doppler gradient above about 64 mmHg (velocity above 4 m/s) as the usual threshold for intervention when RV function is preserved.",
        },
        {
          kind: "p",
          text: "Transcatheter pulmonary valve implantation (TPVI) treats dysfunctional RV-to-pulmonary artery conduits and failed bioprosthetic pulmonary valves, most often after repair of tetralogy of Fallot, and increasingly native, previously patched outflow tracts with dedicated self-expanding valves.",
        },
        {
          kind: "list",
          items: [
            "Coronary compression testing: before stenting or valve implantation, inflate a balloon in the outflow tract while performing coronary angiography (or aortic root injection) to make sure an expanded conduit will not compress a coronary artery. Compression is a contraindication at that site.",
            "Conduit rupture: calcified conduits can tear during pre-stenting or balloon dilatation; have covered stents ready.",
            "Pre-stenting provides a landing zone and reduces stent fracture.",
            "Endocarditis after TPVI is a recognised long-term risk; patients need clear advice on dental hygiene and early presentation with fever.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "PVL closure: localise precisely, exclude endocarditis and dehiscence, protect prosthetic leaflet motion.",
            "TPVI: test for coronary compression before committing.",
          ],
        },
      ],
      refs: ["esc-vhd-2021", "esc-achd-2020", "esc-endocarditis-2023"],
    },
  ],
  quiz: [
    {
      id: "shq-bav-role",
      stem: "What is the main role of balloon aortic valvuloplasty in adults with calcific AS?",
      options: [
        "A bridge to TAVI or surgery in unstable patients, or before urgent high-risk non-cardiac surgery",
        "Definitive treatment for elderly patients unsuitable for TAVI, with durable results",
        "First-line treatment for asymptomatic severe AS",
        "Treatment of choice for bicuspid AS in young adults",
        "Prevention of sudden death in moderate AS",
      ],
      answer: 0,
      explanation:
        "BAV produces a modest and short-lived increase in valve area in calcific AS, so it is used as a bridge or temporising measure. Restenosis within months means it is not durable treatment. In young adults with non-calcified congenital stenosis valvuloplasty plays a different role, but that is not calcific AS.",
      difficulty: 1,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "shq-bbm-sign",
      stem: "During catheterisation, the beat after a ventricular ectopic shows a larger LV–aortic gradient and a smaller aortic pulse pressure. What does this indicate?",
      options: [
        "Dynamic LVOT obstruction, as in obstructive HCM",
        "Fixed valvular aortic stenosis with a calcified valve",
        "Severe aortic regurgitation with a wide pulse pressure",
        "Constrictive pericarditis with ventricular interdependence",
        "Catheter entrapment in the LV trabeculae alone",
      ],
      answer: 0,
      explanation:
        "This is the Brockenbrough–Braunwald–Morrow sign: post-extrasystolic potentiation increases dynamic obstruction, so aortic pulse pressure falls. In fixed AS the stronger beat raises aortic pulse pressure. Entrapment can create a false gradient, but would not explain the fall in aortic pulse pressure.",
      difficulty: 2,
      refs: ["hanna-pcm", "brockenbrough-1961"],
    },
    {
      id: "shq-asa-mce",
      stem: "During alcohol septal ablation, what is the purpose of injecting echo contrast through the inflated balloon in the septal branch?",
      options: [
        "To confirm the branch supplies the basal septum at the SAM contact point only",
        "To measure the LVOT gradient before and after the balloon is inflated",
        "To check for a patent foramen ovale before any alcohol is injected",
        "To dissolve thrombus in the septal branch so the alcohol reaches the tissue",
        "To estimate the volume of alcohol needed from the size of the LV cavity on echo",
      ],
      answer: 0,
      explanation:
        "Myocardial contrast echo shows exactly which myocardium the branch supplies. If it opacifies papillary muscles, the RV or a remote territory, alcohol there would cause harm without relieving obstruction. The gradient is measured with catheters, not with contrast echo.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-asa-lbbb",
      stem: "Why does pre-existing LBBB increase the risk of complete heart block after alcohol septal ablation?",
      options: [
        "ASA often causes RBBB, so with LBBB no bundle is left intact",
        "LBBB indicates a thinner septum that is more easily over-ablated",
        "LBBB increases alcohol leakage back into the LAD during injection",
        "LBBB prevents temporary pacing from the right ventricular apex",
      ],
      answer: 0,
      explanation:
        "The septal branches supply the right bundle, and RBBB is a frequent result of ASA. With pre-existing LBBB, new RBBB produces complete heart block. LBBB does not change septal thickness or alcohol leakage.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-pmc-suitable",
      stem: "A 34-year-old woman has symptomatic rheumatic MS with valve area 1.1 cm², Wilkins score 7, trivial MR and no LA thrombus on TOE. What is the preferred treatment?",
      options: [
        "Percutaneous mitral commissurotomy",
        "Surgical mitral valve replacement",
        "Mitral TEER",
        "Medical therapy alone indefinitely",
        "Transcatheter mitral valve replacement",
      ],
      answer: 0,
      explanation:
        "Symptomatic significant MS with favourable anatomy (Wilkins 8 or less, no more than mild MR, no thrombus) is the classic indication for PMC. Surgery is for patients unsuitable for PMC. TEER treats regurgitation, not stenosis.",
      difficulty: 1,
      refs: ["esc-vhd-2021", "wilkins-score-1988"],
    },
    {
      id: "shq-pmc-contra",
      stem: "Which finding is a contraindication to percutaneous mitral commissurotomy?",
      options: [
        "Thrombus in the left atrial appendage",
        "Wilkins score of 7",
        "Valve area of 1.0 cm²",
        "Atrial fibrillation",
        "Pulmonary artery systolic pressure of 55 mmHg",
      ],
      answer: 0,
      explanation:
        "LA or LAA thrombus can embolise during transseptal and balloon manipulation and is a contraindication. AF and pulmonary hypertension are common in MS and are not contraindications; a valve area of 1.0 cm² and a Wilkins score of 7 favour PMC.",
      difficulty: 1,
      refs: ["esc-vhd-2021", "wilkins-score-1988"],
    },
    {
      id: "shq-inoue",
      stem: "Using the usual formula, what is the Inoue balloon reference size for a patient 170 cm tall?",
      options: ["17 mm", "24 mm", "27 mm", "30 mm", "34 mm"],
      answer: 2,
      explanation:
        "Reference size = height (cm) ÷ 10 + 10 = 17 + 10 = 27 mm. Inflation starts a few millimetres below this and increases stepwise with echo assessment. Using the height ÷ 10 alone (17 mm) forgets the added 10.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "shq-tpvi-coronary",
      stem: "Before transcatheter pulmonary valve implantation in a stenotic RV-to-PA conduit, a balloon is inflated in the conduit during coronary angiography. Why?",
      options: [
        "To check that expanding the conduit will not compress a coronary",
        "To measure the conduit gradient while the balloon is inflated",
        "To test whether the conduit will rupture at the planned diameter",
        "To assess pulmonary regurgitation before the valve is implanted",
        "To size the femoral sheath needed for the valve delivery system",
      ],
      answer: 0,
      explanation:
        "Coronary arteries can run close to the RV outflow tract, particularly after congenital repair, and an expanded stent or valve can compress them. Compression testing before implantation detects this; conduit rupture is a separate risk managed with covered stents.",
      difficulty: 2,
      refs: ["esc-achd-2020"],
    },
  ],
  sims: [
    {
      sim: "haemo",
      task: "In a patient with mitral stenosis, record simultaneous LA (or wedge) and LV pressures, measure the mean gradient and calculate the valve area with the Gorlin formula; repeat after a simulated commissurotomy.",
    },
  ],
};

// ===========================================================================
// Cases
// ===========================================================================
const cases: CaseStudy[] = [
  {
    id: "sh-case-tavi-low-left-main",
    title: "TAVI with a low left main",
    trackId: "structural",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "An 84-year-old woman with severe symptomatic aortic stenosis whose planning CT shows a low left main ostium, narrow sinuses and a bulky calcified leaflet.",
    presentation:
      "An 84-year-old woman presents with NYHA class III breathlessness and one episode of exertional presyncope. She lives alone and walks with a stick. Background: hypertension, chronic kidney disease (eGFR 52 mL/min/1.73 m²), osteoarthritis. Clinical Frailty Scale 5. She wants to stay independent at home.",
    findings: [
      "TTE: Vmax 4.6 m/s, mean gradient 52 mmHg, AVA 0.6 cm², LVEF 60%, mild MR.",
      "CT coronary angiography: no significant coronary disease.",
      "EuroSCORE II 4.8%.",
      "ECG: sinus rhythm, PR 180 ms, QRS 96 ms.",
      "Gated CT: tricuspid valve; annulus area 3.6 cm², perimeter 68 mm; left main height 8 mm; right coronary height 13 mm; mean sinus of Valsalva diameter 27 mm; left coronary leaflet length 12 mm with a bulky calcium nodule; STJ height 17 mm; minimal iliofemoral diameters 6.5 mm (right) and 6.2 mm (left) with mild calcium.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The Heart Team meets. What is the most appropriate treatment plan?",
        options: [
          {
            text: "Transfemoral TAVI, with a specific plan for the risk of coronary obstruction",
            best: true,
            feedback:
              "At 84 with frailty and feasible transfemoral access, TAVI is favoured (2021 ESC/EACTS: age 75 or older). The root anatomy does not rule TAVI out, but it must be planned for, not discovered on the table.",
            next: "s2",
          },
          {
            text: "Surgical AVR because the coronary anatomy is unfavourable",
            acceptable: true,
            feedback:
              "Low coronary ostia favour surgery in operable patients, and this is a legitimate option to discuss. At 84 with frailty, however, recovery from sternotomy is a major concern. After discussion she declines surgery, and the team proceeds to TAVI planning.",
            next: "s2",
          },
          {
            text: "Balloon aortic valvuloplasty as definitive treatment",
            feedback:
              "BAV gives a modest, short-lived improvement in calcific AS and is a bridge, not a destination. She has a clear indication for valve replacement.",
            next: "s2",
          },
          {
            text: "Medical therapy and review in 6 months",
            feedback:
              "Symptomatic severe AS carries a poor prognosis without intervention, and nothing here makes intervention futile. Delay risks sudden death or decompensation.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "Reviewing the CT, which procedural risk dominates the plan?",
        options: [
          {
            text: "Obstruction of the left main by the displaced left coronary leaflet",
            best: true,
            feedback:
              "Left main height 8 mm, narrow sinuses (27 mm) and a 12 mm bulky leaflet that is longer than the coronary height together define a high-risk root.",
            next: "s3",
          },
          {
            text: "Annular rupture",
            feedback:
              "Rupture is linked to LVOT calcium and balloon-expandable oversizing. Neither is the dominant feature here.",
            next: "s3",
          },
          {
            text: "Complete heart block",
            feedback:
              "Conduction disturbance is always possible, but her baseline ECG is normal with no RBBB. It is not the dominant risk in this root.",
            next: "s3",
          },
          {
            text: "Iliofemoral rupture",
            feedback:
              "Her iliofemoral vessels are adequate for contemporary sheaths with only mild calcium. Access is not the main concern.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "How should the coronary risk be managed?",
        info: "Balloon valvuloplasty with simultaneous root aortography, performed as part of planning in the lab, shows the calcified left coronary leaflet swinging to within 1–2 mm of the left main ostium during inflation.",
        options: [
          {
            text: "Protect the left main before deployment: guide catheter in the left main, a wire in the distal LAD and an undeployed stent parked in the proximal vessel",
            best: true,
            feedback:
              "This keeps access to the vessel. If the leaflet occludes the ostium, the stent can be pulled back and deployed as a chimney; if flow is preserved, the stent and wire are removed.",
            next: "s4",
          },
          {
            text: "Leaflet laceration (BASILICA) of the left coronary cusp before TAVI",
            acceptable: true,
            feedback:
              "A reasonable strategy in experienced centres, and it preserves future coronary access better than a chimney stent. It needs specific expertise, and many teams would still protect the left main.",
            next: "s4",
          },
          {
            text: "Choose a valve one size larger to push the leaflet harder against the sinus wall",
            feedback:
              "Oversizing does not prevent the leaflet covering the ostium in a narrow sinus and adds the risk of annular injury and conduction disturbance.",
            next: "s4",
          },
          {
            text: "Proceed without protection and wire the left main only if obstruction occurs",
            feedback:
              "Once a leaflet covers the ostium, re-wiring through the frame and past the leaflet can be impossible, and the patient may arrest while you try.",
            next: "s3-unprotected-occlusion", stateDelta: {"stability": -25, "flags": ["lm-occlusion"]} },
        ],
      },
      {
        id: "s4",
        prompt: "Which valve feature is most useful in this situation?",
        options: [
          {
            text: "A recapturable self-expanding valve, so that coronary flow can be checked on aortography before full release",
            best: true,
            feedback:
              "Partial deployment with aortography allows the valve to be recaptured if the left main is compromised. Her small annulus also favours a supra-annular design for a lower gradient. Aim for commissural alignment to help future coronary access.",
            next: "s5",
          },
          {
            text: "A balloon-expandable valve with a short frame",
            acceptable: true,
            feedback:
              "A short frame makes chimney stenting and later coronary access easier, but deployment cannot be reversed. Reasonable with left main protection in place.",
            next: "s5",
          },
          {
            text: "Any valve, deliberately implanted deep in the LVOT",
            feedback:
              "Leaflet displacement depends mainly on leaflet length and sinus geometry. A deep implant raises the risk of conduction disturbance and mitral interference without reliably preventing obstruction.",
            next: "s4-deep-implant", stateDelta: {"stability": -10} },
        ],
      },
      {
        id: "s5",
        prompt: "What do you do now?",
        info: "With a wire in the LAD and a 4.0 × 15 mm stent parked in the proximal left main and LAD, the valve is positioned in the cusp-overlap view. Aortography at partial deployment shows left main filling. After full release, blood pressure falls from 130/60 to 70/40 mmHg and does not recover; ST depression appears in I, aVL and V4–V6. Aortography shows faint, delayed filling of the left main.",
        options: [
          {
            text: "Pull the parked stent back so its proximal end extends above the valve frame into the aorta, deploy it, and post-dilate",
            best: true,
            feedback:
              "This is coronary obstruction after full release, and the protection was set up for exactly this. A chimney stent restores flow. Alert the surgeon and the mechanical support team in parallel.",
            next: "s6",
          },
          {
            text: "Start noradrenaline and wait for recovery from pacing",
            feedback:
              "Pacing has stopped; persistent hypotension with lateral ST depression and poor left main filling is obstruction. Waiting allows a large infarct or arrest.",
            next: "s6",
          },
          {
            text: "Remove the coronary wire to obtain a clearer aortogram",
            feedback:
              "The wire is your only route into the left main. Removing it may make re-crossing impossible behind the displaced leaflet.",
            next: "s5-wire-removed", stateDelta: {"stability": -20, "flags": ["lm-occlusion"]} },
          {
            text: "Snare the valve and pull it into the ascending aorta",
            feedback:
              "Deliberately displacing a fully released valve risks embolisation, aortic injury and severe regurgitation; chimney stenting is the established bail-out.",
            next: "s6",
          },
          {
            text: "Proceed directly to emergency sternotomy as the first step",
            feedback:
              "Surgery is the back-up, but restoring flow percutaneously takes minutes with the protection already in place. Call the surgeon while you deploy the stent.",
            next: "s6",
          },
        ],
      },
      {
        id: "s6",
        prompt: "What antithrombotic therapy should she receive after the procedure?",
        info: "The chimney stent is deployed and post-dilated with a non-compliant balloon. Flow is TIMI 3, blood pressure 125/60 mmHg and the ST changes resolve. Echo: trace paravalvular leak, mean gradient 8 mmHg. ECG: sinus rhythm, new LBBB with QRS 138 ms and PR 196 ms, unchanged over 48 hours. She has no indication for anticoagulation.",
        options: [
          {
            text: "Dual antiplatelet therapy for the coronary stent, with duration tailored to her bleeding risk, then lifelong single antiplatelet therapy",
            best: true,
            feedback:
              "The coronary stent sets the antiplatelet requirement; after that, lifelong single antiplatelet therapy covers the TAVI. Her age and kidney function argue for the shortest appropriate dual therapy.",
          },
          {
            text: "Single antiplatelet therapy only, from day one",
            feedback:
              "Appropriate for an uncomplicated TAVI, but she now has a stent in a high-risk position where thrombosis would be catastrophic.",
          },
          {
            text: "Oral anticoagulation plus aspirin",
            feedback:
              "Routine anticoagulation after TAVI without another indication is not recommended and increases bleeding.",
          },
          {
            text: "No antithrombotic therapy because of her age",
            feedback:
              "A newly implanted coronary stent without antiplatelet therapy carries a high risk of stent thrombosis.",
          },
        ],
      },
      {
        "id": "s3-unprotected-occlusion",
        "kind": "consequence",
        "info": "After valve release she becomes hypotensive with anterior ST elevation; aortography shows no flow in the left main. No wire is in the coronary.",
        "prompt": "The left main is occluded without protection. What now?",
        "options": [
          {
            "text": "Start support, try to wire the left main through the valve frame and place a chimney stent; prepare for emergency mechanical support",
            "best": true,
            "feedback": "Wiring after occlusion is much harder than protection beforehand, but it is the fastest route to reperfusion.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Wait for recovery from rapid pacing",
            "feedback": "Occlusion does not resolve with time.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Emergency sternotomy as the first step",
            "acceptable": true,
            "feedback": "Surgery may be needed if wiring fails, but percutaneous reperfusion is faster.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s5-wire-removed",
        "kind": "consequence",
        "info": "With the protection wire out, the left main cannot be re-engaged through the struts and the ST elevation worsens.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Re-wire through the frame with a shaped hydrophilic wire and microcatheter support, then deploy the chimney stent",
            "best": true,
            "feedback": "Protection only works if the wire stays in until the result is secure.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Start VA-ECMO and plan surgery",
            "acceptable": true,
            "feedback": "Support may be needed, but reperfusion is the goal.",
            "stateDelta": {
              "stability": -5
            }
          },
          {
            "text": "Repeat aortography to confirm the occlusion",
            "feedback": "The diagnosis is clear; every minute counts.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-deep-implant",
        "kind": "consequence",
        "info": "The valve is implanted deep; the leaflet still swings close to the left main, and the ECG shows new LBBB.",
        "prompt": "What has the deep implant changed?",
        "options": [
          {
            "text": "It does not remove the coronary risk and adds conduction risk; continue with left main protection and monitor for AV block",
            "best": true,
            "feedback": "Implant depth does not solve leaflet displacement in a narrow sinus; a deep frame injures the conduction system.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "The coronary risk is now gone",
            "feedback": "The displaced leaflet still sits in front of the ostium.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Implant a permanent pacemaker immediately",
            "feedback": "New LBBB needs monitoring; pacing depends on the course.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
    ],
    outcome:
      "She was discharged on day 4 on dual antiplatelet therapy for a limited period followed by single antiplatelet therapy. Her new LBBB did not meet the criteria for monitoring or pacing in the 2021 ESC pacing guideline, and she had a clinic ECG at 4 weeks. At 30 days she was in NYHA class I. The procedure report recorded the chimney stent and the expected difficulty of future left coronary access.",
    outcomeVariants: [
      {
        "flag": "lm-occlusion",
        "text": "Coronary occlusion without secured protection caused prolonged ischaemia and a larger rise in troponin."
      }
    ],
    learningPoints: [
      "Coronary obstruction risk comes from a combination of features: low coronary height, narrow sinuses, a leaflet longer than the coronary height, and STJ geometry.",
      "Protection (guide, wire and undeployed stent) must be in place before deployment; once the ostium is covered, access may be lost.",
      "Recapturable valves allow assessment, but obstruction can still declare itself after full release.",
      "Chimney stenting restores flow but leaves long-term issues: stent thrombosis, deformation and difficult re-access.",
      "Antithrombotic therapy follows the coronary stent indication first, then the TAVI default of single antiplatelet therapy.",
    ],
    refs: ["scct-tavi-2019", "esc-vhd-2021", "esc-pacing-2021", "ribeiro-coronary-obstruction-2013", "khan-basilica-2018"],
  },
  {
    id: "sh-case-teer-secondary-mr",
    title: "Secondary MR in ischaemic cardiomyopathy",
    trackId: "structural",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "A 68-year-old man with ischaemic cardiomyopathy and severe secondary MR: optimising therapy first, judging proportionality, then performing TEER.",
    presentation:
      "A 68-year-old man had an anterior STEMI treated with LAD PCI four years ago. He now has NYHA class III breathlessness and two heart failure admissions in the past year. He takes bisoprolol 2.5 mg daily, ramipril 2.5 mg daily and furosemide 40 mg daily. Blood pressure 118/70 mmHg, heart rate 72 beats/min in sinus rhythm.",
    findings: [
      "ECG: sinus rhythm, LBBB, QRS 160 ms.",
      "TTE: LVEF 30%, LVEDV index 98 mL/m², LVESD 54 mm; severe secondary MR with EROA 0.42 cm² and regurgitant volume 62 mL; central jet from tethered leaflets; coaptation depth 9 mm.",
      "Estimated systolic PA pressure 48 mmHg; TAPSE 18 mm; mild TR.",
      "Coronary angiography 6 months ago: patent LAD stent, no new significant disease.",
      "eGFR 58 mL/min/1.73 m², potassium 4.6 mmol/L. EuroSCORE II 7.2%.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What is the most appropriate next step?",
        options: [
          {
            text: "Optimise guideline-directed medical therapy and refer for CRT, then reassess MR",
            best: true,
            feedback:
              "Valve intervention for secondary MR is recommended only when symptoms persist despite optimised medical therapy, including CRT where indicated. His beta-blocker and ACE inhibitor doses are low, he is not on an MRA or SGLT2 inhibitor, and LBBB with QRS 160 ms is a strong CRT indication. CRT and medical therapy can both reduce MR.",
            next: "s2",
          },
          {
            text: "Refer directly for TEER",
            feedback:
              "Premature. The guideline requirement to optimise therapy first exists because MR often improves with it, and the trial evidence for TEER is in patients on optimised therapy.",
            next: "s1-premature-teer", stateDelta: {"stability": -10} },
          {
            text: "Surgical mitral repair",
            feedback:
              "He needs no revascularisation, and isolated surgery for secondary MR has limited evidence. Therapy has not yet been optimised.",
            next: "s2",
          },
          {
            text: "Increase the diuretic and review in a year",
            feedback:
              "Diuretics relieve congestion but do not modify the disease. He has untreated indications for prognostic therapy and CRT.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you interpret his MR now?",
        info: "Three months later he takes sacubitril/valsartan, bisoprolol 10 mg, spironolactone and dapagliflozin, and a CRT-D has been implanted. He remains in NYHA class III and has had another heart failure admission. TTE: LVEF 32%, LVEDV index 95 mL/m², LVESD 53 mm, EROA 0.40 cm², regurgitant volume 60 mL, systolic PA pressure 50 mmHg, TAPSE 18 mm.",
        options: [
          {
            text: "Severe secondary MR that is disproportionate to a modestly dilated LV, a COAPT-like profile likely to benefit from MR reduction",
            best: true,
            feedback:
              "EROA 0.40 cm² in a ventricle with LVEDV index 95 mL/m² is more regurgitation than the LV size predicts. LVEF 32%, LVESD 53 mm, PA pressure 50 mmHg and preserved RV function all fit the COAPT-like criteria used in the 2021 guideline.",
            next: "s3",
          },
          {
            text: "Proportionate MR, fully explained by LV dilatation, so valve treatment will add little",
            feedback:
              "Proportionate MR is a modest EROA in a very large ventricle (MITRA-FR-like). His LV is only moderately dilated relative to a large orifice.",
            next: "s3",
          },
          {
            text: "Moderate MR not needing intervention",
            feedback:
              "EROA 0.40 cm² and regurgitant volume 60 mL meet the thresholds for severe MR.",
            next: "s3",
          },
          {
            text: "End-stage cardiomyopathy: TEER is futile",
            feedback:
              "Nothing here suggests end-stage disease: the LVEF is 32%, the RV is preserved and he is haemodynamically stable.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "What does the Heart Team recommend?",
        options: [
          {
            text: "Mitral TEER",
            best: true,
            feedback:
              "In the 2021 ESC/EACTS guideline, TEER should be considered in patients with secondary MR who are not eligible for surgery and who meet criteria suggesting a greater chance of response. With no need for CABG and a EuroSCORE II of 7.2%, he fits.",
            next: "s4",
          },
          {
            text: "Isolated mitral valve surgery",
            acceptable: true,
            feedback:
              "Surgery can be considered in selected patients with secondary MR, but without a need for CABG and with his risk profile, a transcatheter approach is generally preferred.",
            next: "s4",
          },
          {
            text: "Assessment for transplantation or a left ventricular assist device first",
            feedback:
              "Appropriate in advanced heart failure or when TEER is unlikely to help. He has a profile likely to benefit from TEER, so this can be revisited if he does not improve.",
            next: "s4",
          },
          {
            text: "Continue medical therapy alone",
            feedback:
              "He remains symptomatic with recurrent admissions despite optimised therapy and CRT. COAPT showed fewer heart failure hospitalisations and lower mortality with TEER in this profile.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "Is the anatomy suitable for TEER?",
        info: "TOE: central A2–P2 jet; posterior leaflet length 11 mm; mitral valve area (planimetry) 4.6 cm²; baseline mean gradient 2 mmHg; no calcium in the grasping zone; coaptation depth 9 mm; normal interatrial septum.",
        options: [
          {
            text: "Suitable: central pathology, adequate leaflet length and valve area, no calcium in the grasping zone",
            best: true,
            feedback:
              "These features meet the classical favourable criteria; the coaptation depth of 9 mm is below the 11 mm threshold.",
            next: "s5",
          },
          {
            text: "Unsuitable because of the coaptation depth",
            feedback:
              "A depth of 9 mm is within the classical favourable range (below about 11 mm).",
            next: "s5",
          },
          {
            text: "Unsuitable because the valve area is below 5 cm²",
            feedback:
              "The concern is an area below about 4 cm² or a raised baseline gradient. 4.6 cm² with a 2 mmHg gradient leaves room for one or two devices.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "What do you do?",
        info: "Under TOE, the needle tents the mid-fossa in the bicaval view and is posterior in the short-axis view. In the four-chamber view the tenting point is 2.8 cm above the mitral annular plane.",
        options: [
          {
            text: "Withdraw to the SVC and repeat the pull-down to tent more superiorly, aiming for about 4 cm of height, before crossing",
            best: true,
            feedback:
              "Tethered secondary MR has a deep coaptation point, so the device needs more height to steer down onto the valve. A low puncture leaves too little room to align the device.",
            next: "s6",
          },
          {
            text: "Cross here; the steerable guide will compensate",
            feedback:
              "Steering cannot fully make up for a low puncture. You risk being unable to align the device or reach the coaptation line without pushing the system into the LV.",
            next: "s5-low-puncture", stateDelta: {"stability": -15} },
          {
            text: "Move anteriorly towards the aorta to gain height",
            feedback:
              "An anterior site risks aortic puncture and gives a poor trajectory for TEER. Height comes from a superior and posterior position.",
            next: "s6",
          },
          {
            text: "Abandon the procedure",
            feedback:
              "Nothing prevents a correctly placed puncture; simply reposition.",
            next: "s6",
          },
        ],
      },
      {
        id: "s6",
        prompt: "What is the best next step?",
        info: "The first device is placed at A2–P2. Both leaflets are well inserted in the LVOT and commissural views and the device is stable. MR has fallen from severe to moderate with a residual medial jet. Mean gradient 2 mmHg at 70 beats/min; pulmonary vein systolic flow is blunted.",
        options: [
          {
            text: "Release the first device and place a second device medial to it, checking the gradient after grasping and before release",
            best: true,
            feedback:
              "Moderate residual MR is associated with a worse outcome than mild, and the low gradient leaves room for a second device at the site of the residual jet.",
            next: "s7",
          },
          {
            text: "Release and finish, accepting moderate residual MR",
            feedback:
              "A lower rate of residual significant MR was one of the differences between COAPT and MITRA-FR. With a gradient of 2 mmHg, there is room to improve the result safely.",
            next: "s7",
          },
          {
            text: "Place a second device lateral to the first",
            feedback:
              "The residual jet is medial. A lateral device would raise the gradient without treating the leak.",
            next: "s6-lateral-second", stateDelta: {"stability": -10} },
        ],
      },
      {
        id: "s7",
        prompt: "What should you do about the interatrial septum?",
        info: "After the second device, MR is mild, the mean gradient is 4 mmHg at 72 beats/min and both devices are stable. After the guide is removed, colour Doppler shows a 6 mm iatrogenic ASD with left-to-right flow. SpO2 97%.",
        options: [
          {
            text: "Leave it and reassess at follow-up echo",
            best: true,
            feedback:
              "Most iatrogenic ASDs after TEER are small, shunt left to right and shrink or close. Closure is reserved for significant right-to-left shunting with hypoxia or RV failure.",
          },
          {
            text: "Close it now with a septal occluder",
            feedback:
              "Not indicated for a small left-to-right shunt and would block future transseptal access.",
          },
          {
            text: "Add a third mitral device to abolish the mild MR",
            feedback:
              "Mild residual MR is a good result. A third device would raise the gradient and risk iatrogenic stenosis.",
          },
        ],
      },
      {
        "id": "s1-premature-teer",
        "kind": "consequence",
        "info": "TEER is booked. At the procedure the TOE shows moderate MR only; he was on a low dose of ramipril and no beta-blocker, and has LBBB.",
        "prompt": "What went wrong?",
        "options": [
          {
            "text": "MR in HFrEF must be reassessed after optimised medical therapy and CRT; postpone TEER and optimise first",
            "best": true,
            "feedback": "Guideline-directed therapy and CRT often reduce secondary MR; TEER is for MR that persists.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Proceed anyway because he was referred",
            "feedback": "Treating moderate MR exposes him to risk without benefit.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Refer for surgery instead",
            "feedback": "The issue is timing and medical therapy, not the choice of procedure.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s5-low-puncture",
        "kind": "consequence",
        "info": "After crossing low, the device cannot be steered down onto the valve with enough height; it sits too close to the annulus and the grasp is shallow.",
        "prompt": "The puncture is too low. What now?",
        "options": [
          {
            "text": "Withdraw, consider a repeat higher, posterior transseptal puncture, and re-attempt with adequate height",
            "best": true,
            "feedback": "A deep coaptation point needs height; repuncture is safer than a poor grasp.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Release the device with the shallow grasp",
            "feedback": "A shallow grasp risks single-leaflet attachment.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Abandon the procedure",
            "feedback": "The problem is fixable with a better puncture.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s6-lateral-second",
        "kind": "consequence",
        "info": "After a lateral second device, residual MR remains medial and the mean gradient is 5 mmHg.",
        "prompt": "What should guide where the second device goes?",
        "options": [
          {
            "text": "The location of the residual jet: place it where the jet is (here medial), checking the gradient before release",
            "best": true,
            "feedback": "Device position follows the residual jet; gradient checks prevent iatrogenic stenosis.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Always lateral to the first device",
            "feedback": "There is no fixed side; the jet decides.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Add a third device",
            "feedback": "With a gradient already 5 mmHg, more devices risk stenosis.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He was discharged on day 2. At 6 months he was in NYHA class II with no further heart failure admissions; echo showed mild MR, a stable mean gradient and closure of the iatrogenic ASD. Medical therapy and CRT continued unchanged.",
    learningPoints: [
      "Optimise medical therapy and CRT before considering TEER for secondary MR.",
      "Interpret MR severity against LV size: disproportionate MR with a moderately dilated LV is the profile most likely to benefit.",
      "COAPT-like features (LVEF about 20–50%, LVESD 70 mm or less, PA systolic pressure 70 mmHg or less, preserved RV) guide selection.",
      "For tethered secondary MR, puncture superiorly and posteriorly with enough height.",
      "After each device, check insertion, residual MR, gradient and stability; a second device is justified when MR is still significant and the gradient allows.",
    ],
    refs: ["coapt-2018", "mitra-fr-2018", "esc-vhd-2021", "esc-hf-2021", "grayburn-proportionate-mr-2019"],
  },
  {
    id: "sh-case-laao-gi-bleeding",
    title: "LAAO after recurrent gastrointestinal bleeding",
    trackId: "structural",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "A 79-year-old woman with AF and recurrent major gastrointestinal bleeding on anticoagulation: selection, sizing, release criteria and device-related thrombus.",
    presentation:
      "A 79-year-old woman with permanent AF, hypertension, type 2 diabetes and a TIA three years ago takes apixaban. Over 18 months she has had three admissions with melaena from small-bowel angiodysplasia, needing nine units of red cells in total. Two endoscopic treatments have not prevented recurrence.",
    findings: [
      "CHA2DS2-VA score 6.",
      "Haemoglobin 92 g/L; eGFR 48 mL/min/1.73 m².",
      "TTE: LVEF 55%, moderately dilated LA, no significant valve disease.",
      "Gastroenterology opinion: further bleeding is likely and no definitive treatment is available.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How should stroke prevention be approached?",
        options: [
          {
            text: "Multidisciplinary review with gastroenterology and the patient, considering LAAO because long-term anticoagulation is now contraindicated",
            best: true,
            feedback:
              "She has a high thromboembolic risk and a recurrent, untreatable bleeding source despite endoscopic therapy. This is the population in which the 2024 ESC AF guideline says LAAO may be considered.",
            next: "s2",
          },
          {
            text: "Stop apixaban and start aspirin",
            feedback:
              "Aspirin gives little protection against AF-related stroke and still causes gastrointestinal bleeding.",
            next: "s2",
          },
          {
            text: "Switch to warfarin",
            feedback:
              "Warfarin does not reduce gastrointestinal bleeding from angiodysplasia compared with apixaban and adds monitoring burden.",
            next: "s2",
          },
          {
            text: "Stop all antithrombotic therapy permanently",
            feedback:
              "Her stroke risk is high (CHA2DS2-VA 6 with a previous TIA). Doing nothing leaves that risk unaddressed when a mechanical option exists.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "What imaging is needed before the procedure?",
        options: [
          {
            text: "Cardiac CT or TOE to exclude appendage thrombus and define size and morphology",
            best: true,
            feedback:
              "Thrombus must be excluded, and the ostium, landing zone, depth and lobes measured in several planes. CT also helps plan the transseptal site and fluoroscopic angles.",
            next: "s3",
          },
          {
            text: "TTE measurements are sufficient",
            feedback:
              "TTE cannot reliably show the appendage or exclude thrombus.",
            next: "s2-tte-only", stateDelta: {"stability": -10} },
          {
            text: "Measure with angiography at the start of the procedure only",
            feedback:
              "A 2D projection of an oval, often multilobed structure underestimates or misrepresents it, and does not exclude thrombus beforehand.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "Which post-implant antithrombotic plan best fits her?",
        info: "CT: chicken-wing appendage with an early bend; maximum ostial diameter 22 mm; usable depth along the expected sheath axis 21 mm; no thrombus.",
        options: [
          {
            text: "A short course of antiplatelet therapy chosen with gastroenterology, with imaging at a few months to check for leak and device-related thrombus before stepping down",
            best: true,
            feedback:
              "Patients who cannot take anticoagulation commonly receive dual antiplatelet therapy for a limited period, or a single agent if bleeding risk is prohibitive, then long-term single antiplatelet therapy. Imaging follow-up guides de-escalation.",
            next: "s4",
          },
          {
            text: "Apixaban plus aspirin for 45 days, as in early trials",
            feedback:
              "That regimen was designed for patients who could take short-term anticoagulation. Her bleeding history is the reason for LAAO.",
            next: "s4",
          },
          {
            text: "No antithrombotic therapy at all",
            feedback:
              "The device surface needs time to endothelialise. Without any antithrombotic therapy the risk of device-related thrombus rises.",
            next: "s4",
          },
          {
            text: "Lifelong full-dose anticoagulation after implantation",
            feedback:
              "This defeats the purpose of LAAO in a patient who cannot tolerate anticoagulation.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "Where should the transseptal puncture be?",
        options: [
          {
            text: "Inferior and posterior",
            best: true,
            feedback:
              "The appendage points anteriorly and superiorly; a low posterior puncture gives a coaxial sheath, which matters with an early-bending chicken-wing appendage.",
            next: "s5",
          },
          {
            text: "Superior and posterior",
            feedback:
              "That is the TEER site. The sheath would approach the appendage at an angle, making coaxial deployment difficult.",
            next: "s4-superior-puncture", stateDelta: {"stability": -10} },
          {
            text: "Superior and anterior",
            feedback:
              "Close to the aortic root, with a risk of aortic puncture and a poor angle.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "What do you do now?",
        info: "Under TOE, the mean LA pressure is 7 mmHg; after 500 mL of saline it is 12 mmHg, and the maximum ostial diameter now measures 24 mm. A lobe-only device is deployed. Compression is 6–8% in all four planes; on the tug test the device moves relative to the appendage wall; a 3 mm leak is seen inferiorly.",
        options: [
          {
            text: "Recapture and redeploy a larger device to achieve compression within the IFU range, then repeat all checks",
            best: true,
            feedback:
              "Compression is below range and the anchor check has failed, so the device is undersized. The appendage measured larger once LA pressure was restored, which is why fluid before final sizing matters.",
            next: "s6",
          },
          {
            text: "Release, because the leak is under 5 mm",
            feedback:
              "The leak is not the main problem. A device that moves on tug testing risks embolisation.",
            next: "s5-released-leak", stateDelta: {"stability": -15, "flags": ["peridevice-leak"]} },
          {
            text: "Push the device deeper into the appendage",
            feedback:
              "Pushing does not correct undersizing, risks perforating the thin appendage wall and leaves the ostium uncovered.",
            next: "s6",
          },
        ],
      },
      {
        id: "s6",
        prompt: "How should this finding be managed?",
        info: "The larger device shows 18–22% compression in all planes, is stable on tug testing, covers all lobes at the ostium and has no leak. It is released and there is no effusion. Eight weeks later, on clopidogrel alone without further bleeding, TOE shows a 6 × 4 mm mobile echodensity on the atrial surface of the device, consistent with device-related thrombus. There is no leak.",
        options: [
          {
            text: "Time-limited anticoagulation agreed with gastroenterology (for example low-molecular-weight heparin or a DOAC), with repeat imaging in about 6–8 weeks",
            best: true,
            feedback:
              "Device-related thrombus is associated with stroke. Short-term anticoagulation usually resolves it, and a limited course with close gastrointestinal surveillance is a reasonable balance in this patient.",
          },
          {
            text: "Add aspirin to clopidogrel and re-image",
            acceptable: true,
            feedback:
              "Intensifying antiplatelet therapy is sometimes chosen when anticoagulation is very high risk, but anticoagulation is more commonly used to resolve device-related thrombus.",
          },
          {
            text: "Take no action because the device is well seated",
            feedback:
              "Mobile device-related thrombus carries embolic risk and needs treatment and follow-up imaging.",
          },
          {
            text: "Refer for surgical removal of the device",
            feedback:
              "Surgery is not the first-line treatment for device-related thrombus; most resolve with antithrombotic therapy.",
          },
        ],
      },
      {
        "id": "s2-tte-only",
        "kind": "consequence",
        "info": "In the lab, TOE before the puncture shows a thrombus in the appendage tip that TTE could not see.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Abort the implant, review anticoagulation options with gastroenterology, and re-image after treatment",
            "best": true,
            "feedback": "Implanting over thrombus risks embolisation; pre-procedure CT or TOE prevents this surprise.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Implant anyway; the device will cover the thrombus",
            "feedback": "Manipulation in the appendage can dislodge thrombus.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Start full anticoagulation lifelong and abandon LAAO",
            "acceptable": true,
            "feedback": "Treatment is needed now, but the bleeding history is why LAAO was chosen; re-image after a time-limited course.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s5-released-leak",
        "kind": "consequence",
        "info": "At 45 days, TOE shows a 4 mm peri-device leak at the lower edge and early device-related thrombus on the left atrial face.",
        "prompt": "How do you manage this?",
        "options": [
          {
            "text": "Time-limited anticoagulation agreed with gastroenterology and re-imaging; consider leak closure if it persists",
            "best": true,
            "feedback": "Undersized devices leak and are associated with DRT; this is managed actively.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "No action; leaks under 5 mm are irrelevant",
            "feedback": "Leaks and DRT are both associated with later stroke.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Stop all antithrombotic therapy",
            "feedback": "This leaves the thrombus untreated.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s4-superior-puncture",
        "kind": "consequence",
        "info": "From a superior puncture the sheath points away from the appendage axis and the device lands off-axis with incomplete lobe coverage.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Recapture; consider a repeat inferior, posterior puncture to align with the appendage",
            "best": true,
            "feedback": "Coaxial alignment needs an inferior, posterior puncture for LAAO.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Release off-axis",
            "feedback": "Off-axis devices leak and embolise.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Push harder to seat it",
            "feedback": "Force in the thin appendage risks perforation.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
    ],
    outcome:
      "After six weeks of low-molecular-weight heparin with gastrointestinal surveillance, repeat TOE showed resolution of the thrombus. She continued single antiplatelet therapy with no further major bleeding and no stroke at one year.",
    outcomeVariants: [
      {
        "flag": "peridevice-leak",
        "text": "Releasing an undersized device left a peri-device leak and needed further anticoagulation she could ill afford."
      }
    ],
    learningPoints: [
      "LAAO is considered when long-term anticoagulation is contraindicated, after the bleeding source and modifiable risks have been addressed.",
      "Exclude thrombus and size in several planes; restore LA pressure before final measurement.",
      "Release only when position, anchoring, compression and seal are all satisfactory.",
      "Plan the antithrombotic regimen and imaging follow-up before the procedure.",
      "Device-related thrombus is treated, usually with time-limited anticoagulation, and re-imaged.",
    ],
    refs: ["laao-consensus-2020", "esc-af-2024", "prague17-2020"],
  },
  {
    id: "sh-case-pfo-cryptogenic-stroke",
    title: "Cryptogenic stroke and PFO in a 45-year-old",
    trackId: "structural",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "A 45-year-old man with a cortical stroke and a PFO with atrial septal aneurysm: work-up, RoPE, the closure decision, the procedure and post-closure AF.",
    presentation:
      "A 45-year-old man who has never smoked, with no hypertension, diabetes or previous stroke, develops sudden expressive dysphasia and right hand weakness after lifting heavy boxes. His symptoms improve over 48 hours. MRI shows an acute cortical infarct in a branch of the left middle cerebral artery.",
    findings: [
      "Blood pressure 124/78 mmHg, heart rate 64 beats/min in sinus rhythm, BMI 26.",
      "CT angiography of head and neck: no stenosis, dissection or significant atheroma.",
      "ECG and 24-hour Holter: sinus rhythm throughout.",
      "LDL cholesterol 2.9 mmol/L; HbA1c 36 mmol/mol.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What further work-up is needed before attributing the stroke to a PFO?",
        options: [
          {
            text: "TTE with bubble study, TOE for septal anatomy, prolonged rhythm monitoring, selective thrombophilia testing and venous assessment if indicated, reviewed jointly by neurology and cardiology",
            best: true,
            feedback:
              "A PFO is common, so other causes must be excluded and the anatomy defined before it is called causal. This is the approach of the 2019 European position paper.",
            next: "s2",
          },
          {
            text: "A bubble study alone, then closure if positive",
            feedback:
              "A positive bubble study proves a shunt, not causation, and gives no anatomical detail.",
            next: "s1-incomplete-workup", stateDelta: {"stability": -10} },
          {
            text: "No further tests; start lifelong anticoagulation",
            feedback:
              "Neither the diagnosis nor the treatment is established, and lifelong anticoagulation carries bleeding risk for decades.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "What is his RoPE score?",
        info: "TTE bubble study: more than 30 microbubbles in the LA within three cycles after Valsalva release. TOE: PFO with a 12 mm tunnel, atrial septal aneurysm with 14 mm excursion, no thrombus, no other defect. 14-day ambulatory ECG: no AF. Antiphospholipid antibodies negative.",
        options: [
          {
            text: "6",
            feedback: "Recount: each absent risk factor and the cortical infarct score a point, and age 40–49 scores 3.",
            next: "s3",
          },
          {
            text: "7",
            feedback: "One point short: check that you have included the cortical infarct.",
            next: "s3",
          },
          {
            text: "8",
            best: true,
            feedback:
              "Age 40–49 scores 3; no hypertension 1, no diabetes 1, no previous stroke or TIA 1, non-smoker 1, cortical infarct 1. Total 8: a high probability that the PFO is related to the stroke.",
            next: "s3",
          },
          {
            text: "9",
            feedback: "Age 40–49 scores 3, not 4.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "What do you recommend?",
        options: [
          {
            text: "PFO closure followed by antiplatelet therapy",
            best: true,
            feedback:
              "He is young, the infarct is embolic-appearing, the RoPE score is high and the anatomy is high-risk (large shunt, atrial septal aneurysm): the profile that benefited most in CLOSE, REDUCE and RESPECT.",
            next: "s4",
          },
          {
            text: "Antiplatelet therapy alone",
            acceptable: true,
            feedback:
              "Reasonable for a patient who declines closure after informed discussion, but the trials showed a lower recurrence rate with closure in patients like him.",
            next: "s4",
          },
          {
            text: "Long-term anticoagulation instead of closure",
            feedback:
              "An option for some patients who are not closed, but the trials did not establish it as equivalent to closure, and decades of anticoagulation carry a cumulative bleeding risk.",
            next: "s4",
          },
          {
            text: "No antithrombotic therapy",
            feedback:
              "He has had an ischaemic stroke; secondary prevention is needed.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "When consenting him, which procedure-related risk is most important to discuss?",
        options: [
          {
            text: "New atrial fibrillation, usually in the first weeks and often transient",
            best: true,
            feedback:
              "AF was consistently more frequent after closure in the trials. Patients should know to report palpitations.",
            next: "s5",
          },
          {
            text: "Device erosion, which is common",
            feedback:
              "Erosion is very rare with PFO devices; it is mainly a concern with oversized ASD devices.",
            next: "s5",
          },
          {
            text: "Complete heart block needing a pacemaker",
            feedback:
              "Not a typical complication of PFO closure.",
            next: "s5",
          },
          {
            text: "Coronary obstruction",
            feedback:
              "A TAVI complication, not a PFO closure risk.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "What do you do?",
        info: "Under ICE, the PFO is crossed and a double-disc occluder sized for the aneurysmal septum is opened. The left atrial disc lies flat against the septum primum, but the superior part of the right atrial disc has prolapsed through the tunnel and lies on the left atrial side of the septum secundum. On push–pull the device shifts.",
        options: [
          {
            text: "Recapture and redeploy, considering a different device size or delivery angle",
            best: true,
            feedback:
              "Both discs must sit on the correct sides of the septum and the device must be stable before release. A malpositioned disc risks embolisation and residual shunt.",
            next: "s6",
          },
          {
            text: "Release; it will settle as it endothelialises",
            feedback:
              "A disc on the wrong side of the septum does not correct itself and the device may embolise.",
            next: "s5-malposed-release", stateDelta: {"stability": -20, "flags": ["device-problem"]} },
          {
            text: "Push the delivery cable forward to seat the right atrial disc",
            feedback:
              "Pushing moves the whole device into the LA; the disc needs to be recaptured and redeployed.",
            next: "s6",
          },
        ],
      },
      {
        id: "s6",
        prompt: "How should this be managed?",
        info: "The device is redeployed with both discs correctly positioned and stable, and released. He is discharged on dual antiplatelet therapy. On day 18 he presents with palpitations: ECG shows AF at 110 beats/min; he is haemodynamically stable. TTE shows a well-seated device with no thrombus.",
        options: [
          {
            text: "Manage as new AF (rate or rhythm control as needed), consider anticoagulation while it persists, and reassess; most AF after closure is early and self-limiting",
            best: true,
            feedback:
              "Post-closure AF is common in the first weeks and usually resolves. Treat it on its merits, including a decision on anticoagulation, and reassess with monitoring.",
          },
          {
            text: "Remove the device surgically",
            feedback:
              "Early AF after closure is not an indication to remove a well-seated device.", next: "s6-surgery", stateDelta: {"stability": -10} },
          {
            text: "Start lifelong anticoagulation because AF must have caused the original stroke",
            feedback:
              "His pre-closure monitoring showed no AF; this AF is a recognised early consequence of the device. Long-term anticoagulation decisions should follow reassessment, not be made immediately.",
          },
          {
            text: "Reassure him and take no action",
            feedback:
              "AF needs rate or rhythm management and an explicit decision about anticoagulation while it lasts.",
          },
        ],
      },
      {
        "id": "s1-incomplete-workup",
        "kind": "consequence",
        "info": "Before closure, a 14-day monitor arranged by the stroke team shows paroxysmal atrial fibrillation.",
        "prompt": "What does this change?",
        "options": [
          {
            "text": "AF is an alternative cause of the stroke: anticoagulate and do not close the PFO",
            "best": true,
            "feedback": "Closure is for strokes where the PFO is the likely mechanism after other causes are excluded.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Close the PFO anyway and add aspirin",
            "feedback": "This does not treat the AF-related stroke risk.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Nothing; AF on a monitor is incidental",
            "feedback": "Paroxysmal AF carries stroke risk and needs anticoagulation.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s5-malposed-release",
        "kind": "consequence",
        "info": "Two hours after release, echo shows the right atrial disc prolapsing through the defect; the device is unstable.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Arrange percutaneous retrieval in the lab with surgical backup, then re-plan sizing",
            "best": true,
            "feedback": "An unstable device must be retrieved before it embolises.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Observe; it will settle",
            "feedback": "A prolapsing disc can embolise at any time.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Anticoagulate and repeat echo in a month",
            "feedback": "Anticoagulation does not fix an unstable device.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s6-surgery",
        "kind": "consequence",
        "info": "The surgeons review him and decline: the device is well seated and AF after closure is usually transient.",
        "prompt": "What is the right management?",
        "options": [
          {
            "text": "Treat the AF (rate or rhythm control), consider anticoagulation while it persists, and reassess",
            "best": true,
            "feedback": "Post-closure AF is common in the first weeks and usually settles.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Insist on device removal",
            "feedback": "Surgery for transient AF exposes him to unnecessary risk.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Stop all antithrombotic therapy",
            "feedback": "He still needs antiplatelet therapy after closure.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He reverted to sinus rhythm with a short course of rate control and anticoagulation, and 4 weeks of ambulatory monitoring showed no recurrence. At six months, a bubble study showed no residual shunt. He continued single antiplatelet therapy and returned to work.",
    outcomeVariants: [
      {
        "flag": "device-problem",
        "text": "Releasing a malpositioned occluder led to a second procedure to retrieve it."
      }
    ],
    learningPoints: [
      "Finding a PFO does not prove causation; complete the work-up with neurology.",
      "RoPE combined with PFO anatomy (large shunt, atrial septal aneurysm) estimates the likelihood that closure will help.",
      "CLOSE, REDUCE and RESPECT favoured closure in selected younger patients; AF was more common after closure.",
      "Release only when both discs are on the correct sides of the septum and the device is stable.",
      "Post-closure AF is usually early and transient but needs active management.",
    ],
    refs: ["rope-2013", "close-2017", "reduce-2017", "respect-2017", "pfo-position-2019", "kent-pascal-2021"],
  },
];

// ===========================================================================
// Track
// ===========================================================================
export const structural: Track = {
  id: "structural",
  order: 8,
  title: "Structural Interventions",
  tagline: "TAVI, TEER, LAAO, PFO/ASD, valvuloplasty and septal ablation",
  description:
    "Image-guided structural heart intervention for the fellow moving beyond PCI: the structural team, TOE and CT, transseptal puncture, TAVI planning, deployment and complications, mitral and tricuspid TEER, left atrial appendage occlusion, PFO and ASD closure, valvuloplasty, alcohol septal ablation and paravalvular leak closure.",
  stage: 5,
  modules: [
    imagingTransseptal,
    taviPlanning,
    taviProcedure,
    taviComplications,
    mitralTricuspid,
    laao,
    pfoAsd,
    otherStructural,
  ],
  cases,
};
