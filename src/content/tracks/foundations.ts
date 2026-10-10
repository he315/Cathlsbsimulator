import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Module 1 — The heart for the operator
// ===========================================================================
const heart: Module = {
  id: "fnd-heart",
  title: "The heart for the operator",
  stage: 1,
  summary:
    "Where the heart sits, what it looks like under fluoroscopy, how the chambers, valves and conduction system are arranged, and how pressure and volume change through a single beat.",
  objectives: [
    "Describe the position and orientation of the heart and name the structures that form each border of the cardiac silhouette.",
    "Identify LAO, RAO, cranial and caudal projections from the spine, ribs and diaphragm, and state what each oblique separates.",
    "Trace blood through the chambers and valves and locate the coronary ostia in the aortic sinuses.",
    "Describe the conduction system and its arterial supply, and predict the heart block that follows inferior and anterior infarction.",
    "Read a Wiggers diagram and quote approximate normal pressures for each chamber and great vessel.",
    "Explain preload, afterload, contractility and compliance using the pressure–volume loop.",
  ],
  lessons: [
    {
      id: "fnd-heart-position",
      title: "Position, orientation and the fluoroscopic silhouette",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Every image in the cath lab is a shadow: a three-dimensional heart projected onto a flat detector. Before you can name an artery on the screen you need a stable mental model of where the heart sits, which way it faces, and how changing the C-arm angle changes what you see.",
        },
        { kind: "h", text: "How the heart sits in the chest" },
        {
          kind: "p",
          text: "The heart lies in the middle mediastinum, behind the sternum and resting on the diaphragm, wrapped in pericardium. Its long axis runs from the base (up, right and back) to the apex (down, left and forward). It is also rotated about that axis, so the right ventricle faces the front of the chest and the left atrium faces the spine. In practice, structures at the front of an angiogram belong mostly to the right ventricle and the LAD, while the left atrium and the circumflex in its groove are the most posterior.",
        },
        {
          kind: "table",
          caption: "Surfaces and borders of the heart",
          head: ["Surface or border", "Main chamber", "Relevance in the lab"],
          rows: [
            ["Anterior (sternocostal) surface", "Right ventricle", "The LAD runs on this surface in the anterior interventricular groove; RV branches of the RCA cross it."],
            ["Inferior (diaphragmatic) surface", "Left ventricle, with part of the right ventricle", "Supplied by the PDA and posterolateral branches; this is the wall involved in 'inferior' infarction."],
            ["Left border", "Left ventricle, with the left atrial appendage higher up", "Obtuse marginal branches of the circumflex run down this border."],
            ["Right border", "Right atrium, with the SVC above it", "The RCA runs in the right AV groove close to this border."],
            ["Acute margin", "Right ventricle", "The sharp lower right edge between the anterior and inferior surfaces; acute marginal branches of the RCA follow it."],
            ["Base (posterior surface)", "Left atrium", "The most posterior chamber, directly in front of the oesophagus; reached by transseptal puncture."],
          ],
        },
        { kind: "h", text: "The silhouette on fluoroscopy" },
        {
          kind: "p",
          text: "In a straight frontal (PA) projection the right heart border is formed by the right atrium, with the superior vena cava above it. The left border, from top to bottom, is formed by the aortic knuckle, the pulmonary trunk, the left atrial appendage (normally flat) and the left ventricle. The lower border sits on the diaphragm. The coronary arteries are invisible until filled with contrast, so learn the landmarks you can see on plain fluoroscopy: spine, ribs and diaphragm; calcium in the coronaries or valves; sternal wires and surgical clips that mark bypass grafts; prosthetic valves; and pacing leads in the right atrium and ventricle.",
        },
        { kind: "h", text: "Naming the projection" },
        {
          kind: "p",
          text: "Views are named by where the image detector (the flat panel above the patient) sits relative to the patient. In a left anterior oblique (LAO) view the detector has moved towards the patient's left; in a right anterior oblique (RAO) view, towards the patient's right. Cranial means the detector is tilted towards the head and caudal towards the feet. The X-ray tube is always on the opposite side, beneath the table.",
        },
        {
          kind: "figure",
          id: "views-compass",
          caption: "C-arm angulation. The view name describes the detector position: LAO or RAO for rotation, cranial or caudal for tilt.",
        },
        {
          kind: "table",
          caption: "Identifying the view from landmarks",
          head: ["Clue on the image", "Projection", "Comment"],
          rows: [
            ["Spine on the left of the image", "RAO", "The single most useful clue; check it on every run."],
            ["Spine on the right of the image", "LAO", "In steep LAO the spine may overlap the heart, especially with cranial tilt."],
            ["Diaphragm dome overlying the heart", "Cranial", "Cranial tilt projects the diaphragm upwards over the cardiac shadow."],
            ["Diaphragm absent, or only at the bottom edge", "Caudal", "Caudal tilt drops the diaphragm out of the field."],
            ["Ribs sloping down towards your right hand", "RAO", "A quick confirmation when the spine is hard to see."],
          ],
        },
        {
          kind: "p",
          text: "Each oblique separates different structures. RAO looks into the atrioventricular grooves and separates the atria from the ventricles. LAO looks along the interventricular septum and separates the right heart from the left. An RAO view therefore tells you whether a branch heads to an atrium or a ventricle, and an LAO view tells you which side of the heart it reaches.",
        },
        {
          kind: "keypoints",
          items: [
            "Identify the projection first from the spine, ribs and diaphragm; only then identify the arteries.",
            "Spine on the left of the screen means RAO; spine on the right means LAO.",
            "Diaphragm over the heart means cranial; diaphragm out of the field means caudal.",
            "RAO separates atria from ventricles; LAO separates the right heart from the left.",
            "The view name is the detector position. The tube sits underneath, on the opposite side.",
          ],
        },
        {
          kind: "pearl",
          text: "Heart orientation changes which views work. In a horizontal heart (often in short or obese patients) caudal views lay the left main bifurcation out well. In a vertical heart (often in tall, thin or emphysematous patients) caudal views look along the bifurcation and foreshorten it, and cranial views may show it better.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "Identify ten random projections using only the spine, ribs and diaphragm. Say the view out loud before you look at any vessel.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-medmastery"],
    },
    {
      id: "fnd-heart-chambers",
      title: "Chambers, valves and the aortic root",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Blood returns from the body through the superior and inferior venae cavae into the right atrium, crosses the tricuspid valve into the right ventricle, and is pumped through the pulmonary valve into the lungs. Oxygenated blood returns through four pulmonary veins to the left atrium, crosses the mitral valve into the left ventricle, and leaves through the aortic valve. The coronary arteries are the first branches of the aorta.",
        },
        {
          kind: "table",
          caption: "The four chambers from an operator's point of view",
          head: ["Chamber", "Structure and pressure", "Why it matters in the lab"],
          rows: [
            ["Right atrium", "Thin-walled, low pressure; receives the venae cavae and the coronary sinus", "Entered from the femoral or jugular vein for right heart catheterisation and temporary pacing."],
            ["Right ventricle", "Crescent-shaped, thin free wall, low pressure", "Easily perforated by stiff wires or pacing leads; infarcts with proximal RCA occlusion."],
            ["Left atrium", "Posterior; receives the pulmonary veins; carries the left atrial appendage", "Its pressure is estimated by the wedge pressure; reached by transseptal puncture for mitral and appendage procedures."],
            ["Left ventricle", "Thick-walled (roughly 1 cm), high pressure", "Entered with a pigtail catheter to measure LVEDP and perform ventriculography; the main consumer of coronary flow."],
          ],
        },
        {
          kind: "table",
          caption: "The four valves",
          head: ["Valve", "Between", "Leaflets", "Interventional relevance"],
          rows: [
            ["Tricuspid", "RA and RV", "Three", "Crossed by pacing leads and right heart catheters; a target for transcatheter repair."],
            ["Pulmonary", "RV and pulmonary artery", "Three", "Crossed during right heart catheterisation."],
            ["Mitral", "LA and LV", "Two (anterior and posterior)", "The anterior leaflet is continuous with the aortic valve; the target of edge-to-edge repair."],
            ["Aortic", "LV and aorta", "Three cusps: right, left and non-coronary", "The coronary ostia sit above the right and left cusps; the target of TAVI."],
          ],
        },
        { kind: "h", text: "The aortic root and the coronary ostia" },
        {
          kind: "p",
          text: "Above each aortic cusp the root bulges outwards as a sinus of Valsalva. The left main stem arises from the left sinus and the right coronary artery from the right sinus, which faces forwards. The non-coronary sinus gives rise to no artery and sits posteriorly, next to the atrial septum. The ostia usually lie a little below the sinotubular junction, the ridge where the root meets the tubular ascending aorta. A dilated or unfolded root changes the distance and angle the catheter must cover, which is why catheter curve size is matched to the root.",
        },
        {
          kind: "p",
          text: "Normal variants are common and must not be mistaken for disease: separate ostia for the LAD and circumflex in the left sinus, a high or anterior RCA origin, and a conus artery with its own ostium (in about a third of people). True anomalies are found in roughly 1–2% of patients having angiography. The most dangerous is a coronary artery that runs between the aorta and the pulmonary trunk, where it can be compressed during exertion.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling the circumflex 'occluded' when it is simply absent from the left sinus. Look for an anomalous origin from the right sinus or proximal RCA before concluding.",
            "Missing an ostial lesion because the catheter tip sits beyond it. If in doubt, inject with the tip just outside the ostium (a non-selective cusp injection).",
            "Assuming a missing conus branch is occluded; it frequently has a separate ostium.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Right coronary from the right (anterior) sinus; left main from the left sinus; no artery from the non-coronary sinus.",
            "The anterior mitral leaflet and the aortic valve share a fibrous continuity.",
            "Separate LAD and LCx ostia, an anterior RCA origin and a separate conus ostium are normal variants.",
            "An artery running between the aorta and pulmonary trunk is the anomaly that matters most.",
          ],
        },
        {
          kind: "pearl",
          text: "The His bundle runs just beneath the membranous septum, close to the junction of the non-coronary and right coronary cusps. This is why a transcatheter aortic valve implanted too deep can cause left bundle branch block or complete heart block.",
        },
      ],
      refs: ["supplied-oxford", "supplied-eh-views", "supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "fnd-heart-conduction",
      title: "The conduction system and its blood supply",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Each heartbeat starts in the sinoatrial (SA) node, a cluster of pacemaker cells at the junction of the superior vena cava and right atrium. The impulse spreads across both atria to the atrioventricular (AV) node in the lower interatrial septum, near the opening of the coronary sinus (the triangle of Koch). The AV node slows conduction so that the ventricles fill after atrial contraction. The impulse then passes through the His bundle, which pierces the fibrous skeleton, and divides into the right bundle branch and the left bundle branch with its anterior and posterior fascicles, ending in the Purkinje network.",
        },
        {
          kind: "table",
          caption: "Conduction tissue and its usual arterial supply",
          head: ["Structure", "Location", "Usual arterial supply", "What you may see in the lab"],
          rows: [
            ["SA node", "RA at the SVC junction", "SA nodal artery: from the proximal RCA in about 60%, from the proximal circumflex in about 40%", "Sinus slowing or pauses during RCA injection, or when the nodal artery is compromised."],
            ["AV node", "Low interatrial septum (triangle of Koch)", "AV nodal artery from the dominant artery at the crux (the RCA in about 90%)", "AV block in inferior infarction or transiently during RCA injection."],
            ["His bundle", "Membranous septum", "AV nodal artery, with a contribution from LAD septal branches", "Rarely ischaemic in isolation because of this dual supply."],
            ["Bundle branches", "Ventricular septum", "Mainly LAD septal branches; the posterior fascicle also receives PDA supply", "New bundle branch or fascicular block in proximal LAD occlusion signals a large infarct."],
          ],
        },
        { kind: "h", text: "Heart block after infarction: inferior versus anterior" },
        {
          kind: "p",
          text: "The level of the block determines how it behaves. Inferior infarction affects the AV node through the AV nodal artery and through increased vagal tone. Anterior infarction damages the bundle branches below the node, which happens only when a large area of septum is lost.",
        },
        {
          kind: "table",
          head: ["Feature", "Inferior infarction", "Anterior infarction"],
          rows: [
            ["Level of block", "AV node", "Below the node (His–Purkinje system)"],
            ["Escape rhythm", "Narrow complex, often 40–60/min", "Broad complex, slow and unreliable"],
            ["Response to atropine", "Often improves", "Usually none; may even worsen the block"],
            ["Usual course", "Often resolves within days, especially after reperfusion", "Frequently persistent"],
            ["What it tells you", "Usually manageable; be ready to pace if compromised", "A large infarct with a poor prognosis; pacing is usually needed"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "The SA node is supplied by the RCA in about 60% and by the circumflex in about 40%, independent of dominance.",
            "The AV node is supplied by the dominant artery at the crux, usually the RCA.",
            "AV nodal block in inferior infarction is usually narrow-complex, atropine-responsive and transient.",
            "Infranodal block in anterior infarction is broad-complex and ominous; plan for pacing.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting primary PCI for an inferior STEMI with bradycardia without external pacing pads in place.",
            "Repeating atropine for a broad-complex escape rhythm in anterior infarction instead of pacing.",
            "Passing a right heart catheter in a patient with left bundle branch block without pacing back-up: bruising the right bundle can cause complete heart block.",
          ],
        },
        {
          kind: "pearl",
          text: "Contrast in the RCA often slows the heart for a few beats because it reaches the SA and AV nodal arteries. Asking the patient to cough after the injection clears the contrast and usually restores the rate.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "hanna-pcm"],
    },
    {
      id: "fnd-heart-cycle",
      title: "The cardiac cycle, normal pressures and the pressure–volume loop",
      minutes: 11,
      blocks: [
        {
          kind: "p",
          text: "A Wiggers diagram stacks pressure, volume, the ECG and the heart sounds on a single time axis. It is the key to reading every pressure trace you will record in the lab.",
        },
        {
          kind: "figure",
          id: "wiggers",
          caption: "Wiggers diagram: aortic, left ventricular and left atrial pressures, LV volume, ECG and heart sounds through one cycle.",
        },
        {
          kind: "steps",
          title: "One cardiac cycle on the left side",
          items: [
            { title: "Atrial contraction", detail: "Follows the P wave. Tops up ventricular filling and produces the a wave in atrial pressure. It matters most in a stiff ventricle and is lost in atrial fibrillation." },
            { title: "Isovolumic contraction", detail: "Starts with the QRS. LV pressure rises above atrial pressure and the mitral valve closes (first heart sound). All valves are shut, so volume stays constant while pressure climbs." },
            { title: "Ejection", detail: "When LV pressure exceeds aortic diastolic pressure the aortic valve opens. Without aortic stenosis, LV and aortic systolic pressures are almost identical." },
            { title: "Isovolumic relaxation", detail: "The aortic valve closes as LV pressure falls (second heart sound; the dicrotic notch on the aortic trace). Pressure drops with all valves closed." },
            { title: "Rapid filling", detail: "When LV pressure falls below LA pressure the mitral valve opens and blood rushes in. Relaxation uses energy and is one of the first functions impaired by ischaemia." },
            { title: "Diastasis", detail: "Slow late filling. This is the phase that shortens most as the heart rate rises." },
          ],
        },
        {
          kind: "table",
          caption: "Approximate resting values in adults (mmHg). Laboratories quote slightly different ranges.",
          head: ["Site", "Systolic", "Diastolic or end-diastolic", "Mean"],
          rows: [
            ["Right atrium", "–", "–", "2–8 (a and v waves)"],
            ["Right ventricle", "15–30", "2–8 (end-diastolic)", "–"],
            ["Pulmonary artery", "15–30", "4–12", "≤20"],
            ["Pulmonary capillary wedge", "–", "–", "6–12"],
            ["Left ventricle", "100–140", "3–12 (end-diastolic)", "–"],
            ["Aorta", "100–140", "60–90", "70–105"],
          ],
        },
        { kind: "h", text: "Pressure and volume together" },
        {
          kind: "p",
          text: "Plotting LV pressure against LV volume through one beat gives the pressure–volume loop. The bottom right corner is end-diastole (largest volume; the pressure here is the LVEDP), and the top left corner is end-systole. The width of the loop is the stroke volume. The loop shifts predictably when loading conditions or contractility change, which is how inotropes, vasodilators and mechanical support devices exert their effects.",
        },
        {
          kind: "table",
          head: ["Term", "Meaning", "Increased by", "Decreased by"],
          rows: [
            ["Preload", "Ventricular stretch at end-diastole (end-diastolic volume; LVEDP is a pressure surrogate)", "IV fluid, venous return, volume overload", "Dehydration, venodilators such as nitrates, haemorrhage"],
            ["Afterload", "The load the ventricle ejects against (aortic pressure, aortic stenosis, wall stress)", "Hypertension, aortic stenosis, vasoconstrictors", "Vasodilators, intra-aortic balloon counterpulsation"],
            ["Contractility", "Intrinsic strength of contraction, independent of loading", "Inotropes, sympathetic drive", "Ischaemia, infarction, beta-blockade"],
            ["Compliance", "Volume gained per unit rise in diastolic pressure", "Normal active relaxation", "Hypertrophy, ischaemia, ageing, pericardial constraint"],
          ],
        },
        { kind: "formula", name: "Stroke volume", expr: "SV = EDV − ESV" },
        { kind: "formula", name: "Ejection fraction", expr: "EF (%) = SV / EDV × 100" },
        { kind: "formula", name: "Cardiac output", expr: "CO = SV × HR", note: "Normal resting cardiac output in adults is roughly 4–8 L/min." },
        { kind: "formula", name: "Mean arterial pressure (estimate)", expr: "MAP ≈ DBP + (SBP − DBP) / 3" },
        {
          kind: "p",
          text: "The Frank–Starling relationship states that, within limits, a ventricle stretched more in diastole ejects more in systole. A failing ventricle sits on a flatter curve: extra filling raises LVEDP and causes pulmonary congestion with little gain in stroke volume.",
        },
        {
          kind: "keypoints",
          items: [
            "Read LVEDP just after the a wave, immediately before the steep systolic upstroke; normal resting values are up to about 12 mmHg.",
            "Ischaemia impairs relaxation before contraction, so LVEDP rises early.",
            "Without a valve gradient, LV and aortic systolic pressures match on pullback.",
          ],
        },
        {
          kind: "pearl",
          text: "Record LVEDP before any contrast-heavy step. A high value warns you that a ventriculogram or a large contrast load may tip the patient into pulmonary oedema, and it helps you decide how much intravenous fluid is safe.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Pull back from the left ventricle to the aorta. Mark the LVEDP, confirm there is no systolic gradient across the aortic valve and identify the dicrotic notch.",
        },
      ],
      refs: ["hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-heart-01",
      stem: "A run shows the spine on the right side of the image and the dome of the diaphragm projected over the lower cardiac shadow. Which projection is this?",
      options: ["RAO caudal", "LAO cranial", "LAO caudal", "RAO cranial", "PA caudal"],
      answer: 1,
      explanation:
        "Spine on the right of the image indicates an LAO projection, and a diaphragm overlying the heart indicates cranial tilt, so this is LAO cranial. LAO caudal is the tempting alternative because the spine position fits, but in a caudal view the diaphragm drops out of the field or appears only at the lower edge.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "fnd-q-heart-02",
      stem: "Which chamber forms most of the anterior (sternocostal) surface of the heart?",
      options: ["Left ventricle", "Left atrium", "Right atrium", "Right ventricle"],
      answer: 3,
      explanation:
        "The heart is rotated about its long axis, so the right ventricle lies directly behind the sternum and forms most of the anterior surface. The left ventricle is tempting because the apex points forwards and left, but it forms the left border and much of the inferior surface rather than the front.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-heart-03",
      stem: "Ninety minutes into an inferior STEMI, a patient develops complete heart block with a narrow-complex escape rhythm at 45/min. Which statement is most accurate?",
      options: [
        "The block is usually below the AV node, has a broad escape and is likely to be permanent",
        "The block is usually nodal, often responds to atropine and frequently resolves after reperfusion",
        "It indicates an extensive anterior infarct with septal necrosis involving both bundle branches",
        "A permanent pacemaker should be implanted before primary PCI is attempted, to protect the rhythm",
        "It is caused by occlusion of the first septal branch of the LAD, which supplies the AV node",
      ],
      answer: 1,
      explanation:
        "In inferior infarction the AV node is affected through the AV nodal artery and increased vagal tone, giving a narrow escape rhythm that often responds to atropine and usually recovers, particularly after reperfusion. Infranodal, often permanent block with a broad escape rhythm is the pattern of large anterior infarcts, so the infranodal, permanent option describes the wrong territory.",
      difficulty: 2,
      refs: ["supplied-eh-views", "hanna-pcm"],
    },
    {
      id: "fnd-q-heart-04",
      stem: "In a right-dominant circulation, which vessel usually supplies the AV node?",
      options: [
        "First septal perforator of the LAD",
        "SA nodal artery",
        "AV nodal artery arising from the RCA near the crux",
        "Conus branch",
        "First obtuse marginal branch",
      ],
      answer: 2,
      explanation:
        "The AV nodal artery arises from the dominant artery at the crux, which is the RCA in about 90% of people. The SA nodal artery is the usual distractor: it supplies the sinus node, arises proximally from the RCA or circumflex, and its origin does not depend on dominance.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "fnd-q-heart-05",
      stem: "What does the dicrotic notch on an aortic pressure trace mark?",
      options: [
        "Aortic valve closure at the end of ejection",
        "Mitral valve closure at the onset of ventricular systole",
        "Atrial contraction late in ventricular diastole",
        "Opening of the aortic valve as ejection begins",
        "Peak ventricular filling during early diastole",
      ],
      answer: 0,
      explanation:
        "The dicrotic notch (incisura) is the brief dip in aortic pressure as the aortic valve closes at the end of ejection, coinciding with the second heart sound. Mitral closure is tempting because it is also a valve closure, but it occurs at the start of systole and is not visible on the aortic trace.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-heart-06",
      stem: "Where on a left ventricular pressure trace is the LVEDP read?",
      options: [
        "At the peak of systolic pressure, once the ventricle has finished ejecting",
        "At the lowest point in early diastole, just after the mitral valve opens",
        "Just after the a wave, immediately before the systolic upstroke",
        "At the dicrotic notch, when the aortic valve closes",
        "At the midpoint of diastasis, before atrial contraction begins",
      ],
      answer: 2,
      explanation:
        "LVEDP is the pressure at the end of filling, after atrial contraction and just before isovolumic contraction. The early diastolic nadir is the common mistake: it reflects ventricular relaxation and suction and sits below the true end-diastolic filling pressure.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-heart-07",
      stem: "Before a planned left ventriculogram, a breathless 74-year-old has an LVEDP of 28 mmHg. What is the most appropriate response?",
      options: [
        "Proceed with a standard ventriculogram as planned",
        "Give 1 litre of saline to protect the kidneys, then perform the ventriculogram",
        "Omit the ventriculogram and assess LV function by echocardiography",
        "Give intravenous adenosine to lower the filling pressure",
        "Repeat the measurement after a test injection of contrast",
      ],
      answer: 2,
      explanation:
        "A very high LVEDP means the patient is already close to pulmonary oedema, and a ventriculogram adds a large contrast and volume load for information that echocardiography can provide. Fluid loading for renal protection is tempting but would worsen congestion; in such patients hydration should be reduced or guided by the LVEDP.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-heart-08",
      stem: "Which projection looks into the atrioventricular grooves and therefore separates the atria from the ventricles?",
      options: ["PA cranial", "LAO", "Left lateral", "RAO"],
      answer: 3,
      explanation:
        "RAO looks along the AV grooves, so branches heading to the atria and to the ventricles diverge; this is how the SA nodal artery is told apart from RV branches. LAO is the distractor: it looks along the interventricular septum and separates the right heart from the left instead.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
  ],
  sims: [
    { sim: "views", task: "Name twenty projections from landmarks alone (spine, ribs, diaphragm) with at least 90% accuracy before moving on." },
    { sim: "haemo", task: "Record an LV-to-aorta pullback and label LVEDP, aortic systolic and diastolic pressures and the dicrotic notch." },
  ],
};

// ===========================================================================
// Module 2 — Coronary anatomy
// ===========================================================================
const coronaryAnatomy: Module = {
  id: "fnd-coronary-anatomy",
  title: "Coronary anatomy",
  stage: 1,
  summary:
    "The left and right coronary systems branch by branch, dominance, segment numbering, myocardial territories with their ECG leads, collaterals and the variants that catch beginners out.",
  objectives: [
    "Name the branches of the left main, LAD, circumflex and RCA in order and state the territory each supplies.",
    "Define coronary dominance and give approximate frequencies of each pattern.",
    "Distinguish a true dominant RCA from a large acute marginal branch, and septal branches from diagonal branches.",
    "Number coronary segments using the AHA/SYNTAX scheme and describe a lesion in a structured way.",
    "Predict the culprit artery from the distribution of ST changes.",
    "List the main collateral pathways and grade collateral filling.",
  ],
  lessons: [
    {
      id: "fnd-cor-left",
      title: "The left coronary system",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "The coronary arteries run on the surface of the heart (they are epicardial), embedded in fat within the grooves between the chambers, and send branches inwards into the muscle. Angiography shows these epicardial vessels down to roughly half a millimetre. The microcirculation beneath is invisible but still governs physiology and complications such as no-reflow.",
        },
        { kind: "figure", id: "coronary-tree", caption: "The left and right coronary systems and their main branches." },
        { kind: "h", text: "Left main stem" },
        {
          kind: "p",
          text: "The left main stem (LMS) arises from the left sinus of Valsalva, passes behind the pulmonary trunk and divides into the left anterior descending (LAD) and left circumflex (LCx) arteries. When a third vessel arises between them it is called the ramus intermedius, and the left main is said to trifurcate. Left main length varies widely, and separate LAD and LCx ostia with no left main at all is a normal variant. Because the left main supplies most of the left ventricle, any interruption to its flow is poorly tolerated.",
        },
        { kind: "h", text: "Left anterior descending" },
        {
          kind: "p",
          text: "The LAD runs down the anterior interventricular groove towards the apex and, in many people, wraps around it to supply the inferior apex as well. It has two families of branches. Septal perforators leave at right angles and dive into the septum, supplying roughly its anterior two-thirds and much of the conducting system. Diagonal branches run over the anterolateral surface of the left ventricle.",
        },
        { kind: "h", text: "Left circumflex" },
        {
          kind: "p",
          text: "The LCx runs posteriorly in the left atrioventricular groove. Its obtuse marginal (OM) branches run down the lateral wall. In roughly one person in twelve it is dominant and continues to the crux to give the posterior descending artery. Atrial branches also arise from it, including the SA nodal artery in about 40% of people.",
        },
        {
          kind: "table",
          caption: "Left coronary branches and territories",
          head: ["Vessel", "Course", "Territory"],
          rows: [
            ["Left main stem", "From the left sinus, behind the pulmonary trunk, to its bifurcation", "Combined LAD and LCx territory: usually most of the LV"],
            ["LAD", "Anterior interventricular groove to the apex", "Anterior wall, anterior two-thirds of the septum, apex"],
            ["Diagonal branches", "Over the anterolateral surface", "Anterolateral wall"],
            ["Septal perforators", "Straight into the septum", "Anterior septum and bundle branches"],
            ["Ramus intermedius", "Between the LAD and LCx when the left main trifurcates", "Anterolateral or lateral wall, behaving like a diagonal or an OM"],
            ["LCx", "Left AV groove, running posteriorly", "Lateral and inferolateral wall; the inferior wall too if dominant"],
            ["Obtuse marginal branches", "Down the left border", "Lateral wall"],
          ],
        },
        { kind: "h", text: "Telling the left-sided vessels apart" },
        {
          kind: "list",
          items: [
            "On a left coronary injection the circumflex is usually the vessel closest to the spine, curving in the AV groove.",
            "The LAD runs through the middle of the cardiac shadow towards the apex. A vessel running along the border of the silhouette is usually a diagonal or an OM, not the LAD.",
            "Septal perforators stay relatively straight in systole because they lie inside the septum; branches of an epicardial diagonal bend and shorten with each contraction.",
            "In LAO cranial, septals leave one side of the LAD and diagonals the other. If both families are visible with no trunk between them, suspect an occluded LAD.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a large diagonal running down the middle of the heart in RAO caudal as the LAD. When the LAD is occluded this is a classic trap.",
            "Missing an occluded OM or circumflex because the remaining vessels fill the space. Ask which part of the lateral wall has no supply.",
            "Judging the left main bifurcation from one view. It needs a caudal view, usually LAO caudal (the 'spider'); the left main ostium is best seen in LAO or shallow cranial views and is foreshortened in RAO.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Left main divides into LAD and LCx, sometimes with a ramus intermedius between them.",
            "LAD branches: septals into the septum, diagonals over the anterolateral wall.",
            "LCx branches: obtuse marginals to the lateral wall; PDA as well in left dominance.",
            "The LCx hugs the spine on left injections; border vessels are usually diagonals or OMs.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the left coronary and acquire RAO caudal, LAO caudal and LAO cranial. In each view, name the left main, LAD, circumflex, first diagonal and first OM before checking the labels.",
        },
      ],
      refs: ["supplied-oxford", "supplied-eh-views", "supplied-angio-atlas", "supplied-medmastery"],
    },
    {
      id: "fnd-cor-right",
      title: "The right coronary artery and dominance",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "The right coronary artery arises from the right sinus of Valsalva, which faces forwards, and runs in the right atrioventricular groove around the acute margin of the heart to the crux, where the AV groove meets the posterior interventricular groove. In an LAO projection its course looks like the letter C.",
        },
        {
          kind: "steps",
          title: "RCA branches from proximal to distal",
          items: [
            { title: "Conus branch", detail: "Usually the first branch, supplying the right ventricular outflow tract. It has its own aortic ostium in about a third of people. Selective cannulation or forceful injection into it can trigger ventricular fibrillation, so a damped trace on RCA engagement may mean the tip is in the conus." },
            { title: "SA nodal artery", detail: "Typically the second branch, running upwards and backwards towards the SVC–RA junction. It arises from the RCA in about 60% of people." },
            { title: "Right ventricular branches", detail: "Run forwards over the RV free wall. Occluding one during PCI can cause transient ST elevation in V1–V2." },
            { title: "Acute marginal branch", detail: "Runs along the acute margin towards the apex. A large one can look like the continuation of the RCA." },
            { title: "Crux and AV nodal artery", detail: "At the crux a dominant RCA makes a short bend from which the AV nodal artery arises." },
            { title: "Posterior descending artery (PDA)", detail: "Runs in the posterior interventricular groove and sends small septal branches to the inferior third of the septum." },
            { title: "Posterolateral branches (PLV)", detail: "Continue beyond the crux to the inferolateral wall of the left ventricle." },
          ],
        },
        { kind: "h", text: "Dominance" },
        {
          kind: "p",
          text: "Dominance describes which artery reaches the crux to supply the PDA and posterolateral branches. It does not describe which artery supplies the most muscle: even in a right-dominant heart, the left coronary system usually supplies most of the left ventricle.",
        },
        {
          kind: "table",
          caption: "Frequencies vary between series; these are the figures most often quoted.",
          head: ["Pattern", "PDA arises from", "Approximate frequency", "Practical consequence"],
          rows: [
            ["Right dominant", "RCA", "About 85%", "RCA occlusion causes inferior infarction; the AV node is supplied from the RCA."],
            ["Left dominant", "LCx", "About 8%", "Small RCA; circumflex occlusion causes inferior infarction; the left main supplies almost the whole LV."],
            ["Co-dominant", "Both RCA and LCx", "About 7%", "Inferior wall supply is shared between the two systems."],
          ],
        },
        { kind: "h", text: "True RCA or acute marginal?" },
        {
          kind: "p",
          text: "Treating a large acute marginal as if it were the main RCA is a dangerous error. In LAO a dominant RCA has two bends: one as it rounds the acute margin and a second, sharper one at the crux before the PDA. A vessel that runs smoothly down the margin with no second bend is probably an acute marginal, and the true distal RCA may be occluded or hidden. Confirm in RAO, where the acute marginal stays on the RV margin while the true RCA loops back towards the crux. Look also at the left injection: collateral filling of the distal RCA from the left, or a circumflex that reaches the crux, settles the question.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting a smooth, straight 'RCA' in LAO without confirming it is not an acute marginal. Poor distal runoff predisposes to stent thrombosis.",
            "Calling a small RCA diseased or occluded in a left-dominant system. Check whether the circumflex supplies the PDA.",
            "Injecting through a damped trace on RCA engagement: the tip may be in the conus or against the vessel wall.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "RCA branch order: conus, SA nodal, RV branches, acute marginal, AV nodal at the crux, PDA, posterolateral branches.",
            "Dominance is defined by the origin of the PDA: right about 85%, left about 8%, co-dominant about 7%.",
            "A dominant RCA shows two bends in LAO; a smooth straight vessel is an acute marginal until proven otherwise.",
            "LAO for the RCA body; add cranial angulation (LAO cranial or PA cranial) to open the crux.",
          ],
        },
        {
          kind: "pearl",
          text: "Use the left system to understand the right. A small RCA that stops at the acute margin, with a large circumflex wrapping the crux, is left dominance rather than RCA disease.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA with a JR4 in LAO 30–40°, then add cranial angulation to open the crux. Label the conus, acute marginal, PDA and posterolateral branches.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas", "supplied-medmastery"],
    },
    {
      id: "fnd-cor-segments",
      title: "Segment numbering and describing a lesion",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Angiography reports, heart team discussions and scores such as SYNTAX describe lesions by numbered segment. The scheme in common use is the American Heart Association system as modified for the SYNTAX score. Learn it early: it forces you to say exactly where a lesion lies relative to the branches that define each segment.",
        },
        { kind: "figure", id: "aha-segments", caption: "AHA/SYNTAX segment numbering of the coronary tree." },
        {
          kind: "table",
          caption: "Summary of the SYNTAX modification of the AHA scheme. Check the published SYNTAX definitions for edge cases.",
          head: ["Segment", "Name", "Boundaries (summarised)"],
          rows: [
            ["1", "Proximal RCA", "Ostium to half the distance to the acute margin"],
            ["2", "Mid RCA", "End of segment 1 to the acute margin"],
            ["3", "Distal RCA", "Acute margin to the origin of the PDA"],
            ["4", "Right PDA", "Posterior descending artery arising from the RCA"],
            ["16, 16a–c", "Right posterolateral", "Posterolateral branch and its divisions arising from the RCA"],
            ["5", "Left main", "Ostium to the bifurcation or trifurcation"],
            ["6", "Proximal LAD", "Left main to, and including, the first major septal"],
            ["7", "Mid LAD", "From segment 6 to the point where the LAD angles in RAO (or halfway to the apex if no angle is seen)"],
            ["8", "Apical LAD", "Terminal portion of the LAD"],
            ["9, 9a", "First diagonal", "First diagonal and its branch"],
            ["10, 10a", "Second diagonal", "Second diagonal and its branch"],
            ["11", "Proximal circumflex", "Left main to, and including, the origin of the first OM"],
            ["12", "Intermediate (ramus)", "Branch arising between the LAD and circumflex"],
            ["12a, 12b", "Obtuse marginals", "First and second obtuse marginal branches"],
            ["13", "Distal circumflex", "Circumflex beyond the last OM in the AV groove"],
            ["14, 14a–b", "Left posterolateral", "Posterolateral branches arising from the circumflex"],
            ["15", "Left PDA", "Posterior descending artery arising from the circumflex (left dominance)"],
          ],
        },
        { kind: "h", text: "Describing a lesion" },
        {
          kind: "table",
          head: ["Element", "What to state", "Example"],
          rows: [
            ["Location", "Vessel, segment and relation to branches", "Mid LAD (segment 7), just after the second diagonal"],
            ["Severity", "Visual diameter stenosis in the worst view", "About 80% diameter stenosis"],
            ["Length", "Approximate length", "About 15 mm"],
            ["Branch involvement", "Whether a side branch arises from the diseased segment", "Involves the origin of D2"],
            ["Character", "Calcification, thrombus, ulceration, tortuosity", "Moderately calcified, no thrombus"],
            ["Flow", "TIMI flow grade", "TIMI 3"],
            ["Collaterals", "Source and grade, if present", "Septal collaterals from the LAD, Rentrop 2"],
          ],
        },
        {
          kind: "p",
          text: "Visual grading is usually reported as mild (up to about 30%), moderate (about 30–70%) or severe (over 70%) diameter stenosis. A stenosis is generally considered angiographically significant above 70% in a major epicardial vessel or above 50% in the left main. Visual estimates differ between observers by up to about 20 percentage points, especially for moderate lesions, and the 'normal' reference segment is often diffusely diseased. Moderate lesions are therefore assessed with pressure-wire physiology or intravascular imaging rather than by eye alone.",
        },
        {
          kind: "p",
          text: "The SYNTAX score combines segment location, dominance and lesion features into a single measure of anatomical complexity. Scores of 22 or less are usually called low, 23–32 intermediate and 33 or more high. Together with clinical factors it informs heart team discussions about PCI versus surgery in multivessel and left main disease.",
        },
        {
          kind: "pitfalls",
          items: [
            "Quoting a percentage without making clear it is an angiographic diameter stenosis.",
            "Grading a lesion from a single projection. Every potentially significant lesion needs two, ideally orthogonal, views.",
            "Grading a foreshortened segment, where overlapping contrast columns can hide a stenosis or exaggerate it.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Segments 1–3 RCA, 4 right PDA, 5 left main, 6–8 LAD, 9–10 diagonals, 11 and 13 circumflex, 12 ramus and OMs, 14 left posterolateral, 15 left PDA, 16 right posterolateral.",
            "Describe location, severity, length, branch involvement, character, flow and collaterals.",
            "Angiographic significance: over 70% in an epicardial vessel, over 50% in the left main.",
          ],
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "supplied-eh-views", "syntax-2009", "esc-revasc-2018", "austen-aha-segments-1975", "sianos-syntax-score-2005"],
    },
    {
      id: "fnd-cor-territories",
      title: "Territories, ECG leads, collaterals and variants",
      minutes: 11,
      blocks: [
        {
          kind: "p",
          text: "Knowing which artery feeds which wall lets you predict the culprit from the ECG before the first injection, and check afterwards that the angiogram explains the presentation.",
        },
        {
          kind: "table",
          caption: "Usual relationships in a right-dominant heart. Individual anatomy varies.",
          head: ["Artery", "Territory", "Leads with ST elevation", "Typical reciprocal change"],
          rows: [
            ["LAD (proximal)", "Anterior wall, anterior septum, apex", "V1–V4, often extending to V5–V6, I and aVL", "Inferior leads in very proximal occlusion"],
            ["Diagonal", "Anterolateral (high lateral) wall", "I and aVL, sometimes V5–V6", "III and aVF"],
            ["LCx or OM", "Lateral and inferolateral wall", "I, aVL, V5–V6; often subtle or absent", "V1–V3 depression if the posterior wall is involved"],
            ["Posterolateral branches (LCx or RCA)", "Posterior (inferobasal) wall", "V7–V9", "V1–V3 depression with upright T waves"],
            ["RCA", "Inferior wall, inferior septum, right ventricle", "II, III, aVF; V4R (and sometimes V1) if the RV is involved", "I and aVL"],
          ],
        },
        {
          kind: "p",
          text: "Inferior infarction is usually caused by the RCA and less often by the circumflex. ST elevation greater in III than in II, with ST depression in I and aVL, favours the RCA. ST elevation in I, aVL or V5–V6 without depression in I and aVL favours the circumflex. ST elevation in V4R points to an RCA occlusion proximal to the RV branches.",
        },
        {
          kind: "p",
          text: "The circumflex is the electrically quiet artery. Its territory is poorly seen by the standard 12 leads, so a circumflex occlusion can produce little or no ST elevation. Posterior leads and echocardiography help, and ongoing ischaemic pain should not be dismissed because the ECG looks unremarkable.",
        },
        { kind: "h", text: "Collaterals" },
        {
          kind: "p",
          text: "Collaterals are small pre-existing connections between arteries that enlarge when one of them becomes severely narrowed or blocked. They form between neighbouring territories:",
        },
        {
          kind: "list",
          items: [
            "LAD septals to PDA septals through the interventricular septum.",
            "Distal circumflex to the distal RCA continuation in the AV groove.",
            "Distal OMs to RCA posterolateral branches across the inferolateral wall.",
            "Apical LAD to the distal PDA around the apex.",
            "Conus branch to the LAD over the RV outflow tract (Vieussens' ring), and atrial branches to the AV nodal artery (Kugel's artery).",
          ],
        },
        {
          kind: "table",
          caption: "Rentrop grading of collateral filling",
          head: ["Grade", "Appearance of the recipient artery"],
          rows: [
            ["0", "No collateral filling"],
            ["1", "Side branches fill, but the epicardial vessel itself does not"],
            ["2", "Partial filling of the epicardial vessel"],
            ["3", "Complete filling of the epicardial vessel"],
          ],
        },
        {
          kind: "p",
          text: "Well-developed (grade 3) collaterals generally take more than about two weeks to form, so they suggest a chronic occlusion. Collaterals that grew in response to a long-standing severe stenosis can, however, already be present when that stenosis finally occludes.",
        },
        {
          kind: "pearl",
          text: "If the LAD is occluded and the anterior wall still contracts, yet neither selective injection shows collaterals, suspect a conus artery with a separate ostium feeding the LAD through Vieussens' ring. A non-selective injection in the right sinus will show it.",
        },
        { kind: "h", text: "Anomalies and myocardial bridges" },
        {
          kind: "p",
          text: "Anomalous origins appear in about 1–2% of angiograms. The most common is a circumflex arising from the right sinus or the proximal RCA and running behind the aorta; suspect it whenever the left injection shows no supply to the lateral wall. The most dangerous course is between the aorta and the pulmonary trunk. A myocardial bridge, most often in the mid LAD, is a segment that tunnels through the muscle and narrows in systole but opens in diastole.",
        },
        {
          kind: "keypoints",
          items: [
            "Inferior STEMI: III > II with depression in I and aVL suggests the RCA; lateral involvement suggests the circumflex.",
            "Circumflex occlusion can be nearly silent on the 12-lead ECG.",
            "Rentrop 0–3 grades collateral filling; grade 3 usually implies chronicity.",
            "A missing circumflex is an anomaly to search for, not an occlusion to assume.",
          ],
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "rentrop-1985", "supplied-medmastery", "hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-cor-01",
      stem: "Which branch is usually the first branch of the right coronary artery?",
      options: ["SA nodal artery", "Acute marginal branch", "Right ventricular branch", "Conus branch", "AV nodal artery"],
      answer: 3,
      explanation:
        "The conus branch arises first, at or near the RCA ostium, and supplies the RV outflow tract; in about a third of people it has its own aortic ostium. The SA nodal artery is the tempting answer but is typically the second branch, heading up towards the SVC–RA junction.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "fnd-q-cor-02",
      stem: "Coronary dominance is defined by which artery:",
      options: [
        "Supplies the largest mass of left ventricular muscle",
        "Gives rise to the posterior descending artery",
        "Has the largest diameter at its ostium",
        "Supplies the sinoatrial node",
        "Gives rise to the left main stem",
      ],
      answer: 1,
      explanation:
        "Dominance refers to the artery that reaches the crux and supplies the PDA (and posterolateral branches). It is a common misconception that the dominant artery supplies the most muscle; even in right dominance, the left system usually supplies most of the LV.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "fnd-q-cor-03",
      stem: "In LAO 40°, the 'RCA' runs smoothly down the margin of the heart with no sharp bend near the crux and appears to end there. What is the most important next step?",
      options: [
        "Accept that this is the RCA and size a stent for any lesion seen along its course",
        "Diagnose congenital absence of the PDA and document a small non-dominant right system",
        "Suspect an acute marginal; find the true distal RCA in other views and on the left injection",
        "Inject with a larger, more forceful bolus so that contrast fills the distal vessel beyond the apparent end",
        "Change to a JL4 catheter, which gives better coaxial filling of a dominant right coronary",
      ],
      answer: 2,
      explanation:
        "A dominant RCA shows two bends in LAO, the second sharper one at the crux; a smooth straight vessel is an acute marginal until proven otherwise. Treating it as the RCA risks stenting a branch with poor runoff while missing an occluded true RCA. A bigger injection does not answer the anatomical question and adds contrast.",
      difficulty: 3,
      refs: ["supplied-eh-views"],
    },
    {
      id: "fnd-q-cor-04",
      stem: "An inferior STEMI shows more ST elevation in III than in II, with ST depression in I and aVL. Which artery is most likely occluded?",
      options: ["Right coronary artery", "Left circumflex", "Left anterior descending", "First diagonal", "Left main stem"],
      answer: 0,
      explanation:
        "ST elevation greatest in III with reciprocal depression in I and aVL is the typical pattern of RCA occlusion. The circumflex is the main alternative cause of inferior infarction, but it tends to give ST elevation extending to I, aVL or V5–V6 and less reciprocal change in the high lateral leads.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-cor-05",
      stem: "In the AHA/SYNTAX numbering scheme, what is segment 6?",
      options: ["Mid LAD", "Left main stem", "First diagonal", "Proximal circumflex", "Proximal LAD"],
      answer: 4,
      explanation:
        "Segment 6 is the proximal LAD, from the left main to and including the first major septal. Segment 5 is the left main and segment 7 the mid LAD; confusing adjacent numbers is the usual error.",
      difficulty: 2,
      refs: ["syntax-2009", "austen-aha-segments-1975", "sianos-syntax-score-2005"],
    },
    {
      id: "fnd-q-cor-06",
      stem: "On a left coronary injection, which vessel usually runs closest to the spine?",
      options: ["Left anterior descending", "Left circumflex", "First diagonal", "First septal perforator"],
      answer: 1,
      explanation:
        "The circumflex runs in the posterior AV groove and is typically the vessel nearest the spine on left injections. The LAD is the tempting choice as the largest vessel, but it runs through the middle of the cardiac shadow towards the apex.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "fnd-q-cor-07",
      stem: "A patient has an occluded proximal LAD but normal anterior wall motion on echocardiography. Selective injections of the left system and the RCA show no collaterals to the LAD. What is the best explanation and action?",
      options: [
        "The occlusion must be hyperacute; proceed directly to PCI",
        "Echocardiography is wrong; repeat it",
        "Suspect a separate conus artery supplying the LAD through Vieussens' ring; perform a non-selective injection in the right sinus",
        "Collaterals are never visible angiographically; no further imaging is needed",
        "Perform a left ventriculogram",
      ],
      answer: 2,
      explanation:
        "Preserved anterior function with an occluded LAD implies a collateral supply. The conus artery has a separate ostium in about a third of people, so a selective RCA injection can miss a conus-to-LAD (Vieussens') collateral; a non-selective cusp injection or selective conus engagement reveals it. Assuming a hyperacute occlusion ignores the normal wall motion.",
      difficulty: 3,
      refs: ["supplied-eh-views"],
    },
    {
      id: "fnd-q-cor-08",
      stem: "Which statement about septal perforator branches is correct?",
      options: [
        "They supply roughly the anterior two-thirds of the septum and stay relatively straight during systole",
        "They arise from the circumflex and supply the lateral wall",
        "They run along the left border of the cardiac silhouette",
        "They are best separated from diagonals in the RAO caudal view",
        "They supply the SA node",
      ],
      answer: 0,
      explanation:
        "LAD septal perforators run inside the septum, supply roughly its anterior two-thirds and do not bend much with contraction, unlike branches of an epicardial diagonal. RAO caudal is a poor view for separating septals from diagonals; LAO cranial separates them, with septals on one side of the LAD and diagonals on the other.",
      difficulty: 2,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Complete a full left and right coronary study and write a segment-by-segment description of every vessel, including dominance." },
    { sim: "views", task: "For each of the six standard left coronary views, state which segments are best seen and which are foreshortened." },
  ],
  caseIds: ["fnd-case-inferior-rv"],
};

// ===========================================================================
// Module 3 — Coronary physiology and the biology of ischaemia
// ===========================================================================
const physiology: Module = {
  id: "fnd-physiology",
  title: "Coronary physiology, atherosclerosis and infarction",
  stage: 1,
  summary:
    "How coronary flow is regulated, why ischaemia happens, how plaques form and fail, how myocardial infarction is defined and classified, and what MINOCA means.",
  objectives: [
    "List the determinants of myocardial oxygen supply and demand and calculate coronary perfusion pressure.",
    "Explain why the left ventricle is perfused mainly in diastole and why the subendocardium is most vulnerable.",
    "Describe autoregulation and the relationship between stenosis severity, resting flow and maximal flow.",
    "Outline the development of atherosclerotic plaque and contrast plaque rupture, plaque erosion and calcified nodule.",
    "Define myocardial injury and myocardial infarction and describe the types in the Universal Definition.",
    "Define MINOCA and list its main causes and mimics.",
  ],
  lessons: [
    {
      id: "fnd-phys-flow",
      title: "Coronary blood flow and the supply–demand balance",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "The heart extracts about three-quarters of the oxygen delivered to it even at rest, far more than most organs. It therefore has little scope to extract more, so when demand rises coronary flow must rise with it. Ischaemia is what happens when supply cannot keep up.",
        },
        {
          kind: "table",
          head: ["Side of the balance", "Main determinants", "Clinical examples"],
          rows: [
            ["Demand (oxygen consumption)", "Heart rate, contractility, wall stress (pressure and cavity size)", "Tachycardia, hypertension, aortic stenosis, a dilated ventricle, inotropes"],
            ["Supply (oxygen delivery)", "Perfusion pressure, time spent in diastole, coronary resistance (epicardial stenosis and microvascular tone), blood oxygen content", "Hypotension, high LVEDP, tachycardia, stenosis or thrombus, spasm, anaemia, hypoxia"],
          ],
        },
        {
          kind: "formula",
          name: "Coronary perfusion pressure (left ventricle)",
          expr: "CPP ≈ aortic diastolic pressure − LVEDP",
          note: "LV perfusion occurs mainly in diastole. Hypotension and a high LVEDP both reduce it.",
        },
        {
          kind: "formula",
          name: "Wall stress (Laplace)",
          expr: "σ ≈ (P × r) / (2 × h)",
          note: "P = cavity pressure, r = cavity radius, h = wall thickness. A dilated, pressurised ventricle has high wall stress and high oxygen demand.",
        },
        { kind: "h", text: "Why the left ventricle is perfused in diastole" },
        {
          kind: "p",
          text: "In systole the contracting LV squeezes the vessels running through its wall, especially in the inner layers, so most LV perfusion happens in diastole. The subendocardium is the most vulnerable layer: it is compressed hardest and lies furthest from the epicardial arteries. Demand ischaemia therefore starts in the subendocardium, which is why it typically produces ST depression rather than ST elevation. The right ventricle generates much lower pressures and receives a larger share of its flow during systole.",
        },
        {
          kind: "p",
          text: "Tachycardia is doubly harmful: it raises oxygen demand and shortens diastole, the period when the LV is perfused.",
        },
        { kind: "h", text: "Resistance, autoregulation and reserve" },
        {
          kind: "p",
          text: "In a healthy artery the large epicardial vessel offers little resistance. Most resistance lies in the arterioles of the microcirculation, which continually adjust their tone (autoregulation) to match flow to demand across a wide range of perfusion pressures. When an epicardial stenosis develops, the arterioles downstream dilate to compensate, using up part of the reserve normally available for exercise. Below the lower limit of autoregulation, flow falls passively with pressure.",
        },
        {
          kind: "p",
          text: "Classic experimental work showed that resting flow is preserved until a stenosis is very severe (roughly 80–90% diameter), whereas maximal achievable flow starts to fall at around 50%. A patient with a moderate stenosis can therefore be comfortable at rest yet develop angina on exertion, which is why stress testing and hyperaemic pressure-wire measurements are needed to judge moderate lesions.",
        },
        {
          kind: "formula",
          name: "Resistance in a tube (Poiseuille)",
          expr: "R = (8 × η × L) / (π × r⁴)",
          note: "η = viscosity, L = length, r = radius. Radius dominates: halving it raises resistance about sixteen-fold. Real stenoses lose further energy through turbulence and flow separation.",
        },
        {
          kind: "keypoints",
          items: [
            "Myocardial oxygen extraction is near-maximal at rest, so supply depends on flow.",
            "LV perfusion is mainly diastolic; CPP is roughly aortic diastolic pressure minus LVEDP.",
            "The subendocardium is the first layer to become ischaemic.",
            "Arterioles control resistance and autoregulate; a stenosis consumes their reserve.",
            "Maximal flow is limited from about 50% diameter stenosis; resting flow only at about 80–90%.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Letting a patient with left main or severe multivessel disease stay hypotensive in the lab. Falling perfusion pressure causes ischaemia, which depresses the LV and lowers pressure further. Treat hypotension early.",
            "Labelling tachycardia-related ST depression in sepsis, bleeding or anaemia as a primary coronary event. Correct the cause first.",
          ],
        },
        {
          kind: "pearl",
          text: "Every physiological measurement you will make in the lab (FFR, resting pressure ratios, coronary flow reserve) rests on two ideas: flow equals pressure divided by resistance, and the microcirculation controls resistance. Hold on to them.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Record simultaneous aortic and LV pressures, read the aortic diastolic pressure and the LVEDP, and estimate the coronary perfusion pressure.",
        },
      ],
      refs: ["hanna-pcm", "supplied-medmastery", "gould-stenosis-flow-1974"],
    },
    {
      id: "fnd-phys-athero",
      title: "Atherosclerosis, plaque rupture and erosion",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Atherosclerosis is a chronic inflammatory disease of the arterial wall driven by lipoproteins. It develops over decades and is usually silent until a plaque either narrows the lumen enough to limit flow on exertion or becomes complicated by thrombus.",
        },
        {
          kind: "steps",
          title: "From healthy wall to complex plaque",
          items: [
            { title: "Endothelial dysfunction", detail: "Risk factors (raised LDL cholesterol, smoking, hypertension, diabetes) impair the endothelium and increase its permeability." },
            { title: "Lipid retention", detail: "LDL particles enter the intima, are retained and become oxidised." },
            { title: "Inflammation and foam cells", detail: "Monocytes enter, become macrophages and ingest lipid to become foam cells, forming a fatty streak." },
            { title: "Fibrous cap", detail: "Smooth muscle cells migrate and lay down collagen, forming a cap over the lipid." },
            { title: "Necrotic core", detail: "Dying foam cells release lipid and debris, producing a soft necrotic core (a fibroatheroma)." },
            { title: "Calcification", detail: "Calcium deposits begin as specks and can grow into sheets that make the vessel rigid and hard to dilate." },
          ],
        },
        {
          kind: "p",
          text: "Early in the disease the artery enlarges outwards (positive remodelling), preserving the lumen until plaque occupies roughly 40% of the area inside the internal elastic lamina. An angiogram shows only the lumen, so it underestimates the true plaque burden. A 'mild' angiographic lesion may hide a large plaque.",
        },
        { kind: "h", text: "How plaques cause acute coronary syndromes" },
        {
          kind: "table",
          head: ["Mechanism", "What happens", "Typical setting", "Intracoronary imaging"],
          rows: [
            ["Plaque rupture", "A thin fibrous cap breaks over a lipid-rich necrotic core; the thrombogenic core meets blood and thrombus forms", "The most common substrate of ACS; the precursor is a thin-cap fibroatheroma (cap under about 65 µm)", "Cap discontinuity with an empty cavity on OCT"],
            ["Plaque erosion", "Endothelium is lost over an intact, often fibrous plaque; platelet-rich thrombus forms on the surface", "More frequent in younger patients, women and smokers; underlying stenosis often less severe", "Thrombus on an intact cap on OCT"],
            ["Calcified nodule", "Calcified nodules erupt through the cap and trigger thrombus", "Least common; older patients with heavily calcified, tortuous vessels", "Protruding calcium with overlying thrombus"],
          ],
        },
        {
          kind: "p",
          text: "Thrombus formed in fast-flowing arteries is rich in platelets (white thrombus); where flow is slow it contains more fibrin and red cells (red thrombus). ACS is fundamentally plaque disruption plus platelet-rich thrombus, sometimes with embolisation downstream, which is why antiplatelet therapy is the backbone of its treatment. Embolised material can obstruct the microcirculation and cause no-reflow after the artery is opened.",
        },
        {
          kind: "p",
          text: "Many culprit plaques were not severely narrowing before the event, and non-occlusive ruptures can heal silently, adding a new layer to the plaque and narrowing the lumen stepwise. This is why risk-factor treatment matters as much as treating the tightest lesion.",
        },
        { kind: "h", text: "Stable angina and the ischaemic cascade" },
        {
          kind: "steps",
          title: "Order of events when supply falls short of demand",
          items: [
            { title: "Perfusion heterogeneity", detail: "Flow is redistributed away from the subendocardium in the affected territory." },
            { title: "Metabolic change", detail: "Anaerobic metabolism begins." },
            { title: "Diastolic dysfunction", detail: "Relaxation slows and filling pressure rises." },
            { title: "Systolic dysfunction", detail: "A regional wall-motion abnormality appears." },
            { title: "ECG change", detail: "ST depression in demand ischaemia." },
            { title: "Angina", detail: "Symptoms are the last step, and some patients never feel them." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Positive remodelling hides plaque from the angiogram.",
            "Rupture of a thin-cap fibroatheroma is the commonest cause of ACS; erosion is the next most common.",
            "ACS thrombus is platelet-rich: antiplatelet therapy is central.",
            "Symptoms come last in the ischaemic cascade.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Equating a mild angiographic lesion with low risk. Plaque burden is hidden by remodelling.",
            "Assuming every ACS needs a stent. Erosion with a non-obstructive residual lesion and good flow is sometimes managed with antithrombotic therapy alone after imaging, as an individual decision.",
          ],
        },
      ],
      refs: ["hanna-pcm", "supplied-medmastery", "supplied-oxford", "glagov-remodelling-1987"],
    },
    {
      id: "fnd-phys-mi",
      title: "Myocardial injury, infarction types and MINOCA",
      minutes: 11,
      blocks: [
        {
          kind: "p",
          text: "Cardiac troponin is the biochemical marker of myocardial injury. Myocardial injury is present when troponin is above the 99th percentile upper reference limit; it is acute when values rise or fall. Myocardial infarction (MI) is acute myocardial injury together with clinical evidence of acute ischaemia. Troponin alone does not make the diagnosis.",
        },
        {
          kind: "list",
          items: [
            "Symptoms of myocardial ischaemia.",
            "New ischaemic ECG changes.",
            "Development of pathological Q waves.",
            "Imaging evidence of new loss of viable myocardium or a new regional wall-motion abnormality in an ischaemic pattern.",
            "Coronary thrombus identified at angiography or autopsy (for type 1 MI).",
          ],
        },
        {
          kind: "table",
          caption: "Types of MI in the Fourth Universal Definition (2018), summarised",
          head: ["Type", "Mechanism", "Relevance in the lab"],
          rows: [
            ["1", "Atherothrombosis: plaque rupture or erosion with thrombus", "The classic ACS; treated with antithrombotic therapy and, usually, revascularisation of the culprit"],
            ["2", "Supply–demand mismatch without acute atherothrombosis (for example tachyarrhythmia, severe anaemia, hypotension, hypoxia); the 2018 definition also grouped spasm, microvascular dysfunction and spontaneous coronary dissection here. The fifth universal definition (2026) renames this setting secondary MI and moves SCAD, vasospasm and coronary embolism to primary MI (see hb-background-mi)", "Treat the cause; angiography is not automatic"],
            ["3", "Cardiac death with features suggesting ischaemia before troponin could be measured", "Mostly a classification for registries"],
            ["4a", "Related to PCI, within 48 h: troponin above 5 times the reference limit (with normal baseline) plus new evidence of ischaemia", "Periprocedural MI, for example from side-branch occlusion or no-reflow"],
            ["4b", "Stent or scaffold thrombosis", "Usually a dramatic acute occlusion"],
            ["4c", "Restenosis after PCI", "Usually presents more gradually"],
            ["5", "Related to CABG: troponin above 10 times the reference limit plus new evidence such as Q waves or graft occlusion", "Surgical"],
          ],
        },
        { kind: "h", text: "What happens to muscle after occlusion" },
        {
          kind: "p",
          text: "After complete occlusion, irreversible injury begins within roughly 20–40 minutes, starting in the subendocardium and spreading towards the epicardium over several hours. Collaterals and intermittent reperfusion slow this wavefront. The earlier flow is restored, the more muscle is saved, which is the basis of reperfusion time targets.",
        },
        {
          kind: "table",
          head: ["State", "Blood flow", "Function", "Recovery"],
          rows: [
            ["Stunning", "Restored after a period of ischaemia", "Reduced despite normal flow", "Spontaneous over days to weeks"],
            ["Hibernation", "Chronically reduced", "Down-regulated to match supply", "Possible after revascularisation, although benefit is not guaranteed"],
            ["Infarction", "Variable", "Lost", "None; replaced by scar"],
          ],
        },
        { kind: "h", text: "MINOCA" },
        {
          kind: "p",
          text: "MINOCA (myocardial infarction with non-obstructive coronary arteries) describes a patient who meets the criteria for acute MI but has no stenosis of 50% or more in any major epicardial vessel and no clinically obvious alternative diagnosis. The 2023 ESC guideline treats MINOCA as a working diagnosis that should prompt a search for the mechanism, with cardiac magnetic resonance central to that search.",
        },
        {
          kind: "table",
          head: ["Cause", "Clue", "How it is confirmed"],
          rows: [
            ["Plaque disruption without severe stenosis", "Hazy or irregular mild lesion", "Intravascular imaging (IVUS or OCT)"],
            ["Epicardial coronary spasm", "Rest angina, smokers, transient ST elevation", "Provocation testing in experienced centres"],
            ["Coronary microvascular dysfunction", "Angina with unobstructed arteries", "Invasive coronary function testing"],
            ["Coronary embolism or thrombosis", "Atrial fibrillation, prosthetic valve, PFO, thrombophilia", "Angiographic appearance, echocardiography, thrombophilia screen"],
            ["Spontaneous coronary artery dissection", "Younger women, long smooth narrowing, tortuous vessels", "Careful angiographic review; imaging only if the diagnosis is unclear"],
            ["Supply–demand mismatch", "Tachyarrhythmia, anaemia, hypotension", "Clinical context"],
          ],
        },
        {
          kind: "p",
          text: "Non-ischaemic conditions such as myocarditis and Takotsubo syndrome can mimic MINOCA. Once one of them is identified, the patient no longer has MINOCA but that specific diagnosis.",
        },
        {
          kind: "pearl",
          text: "Before writing 'unobstructed coronaries', look again for spontaneous coronary artery dissection: a long, smooth narrowing in a younger woman, often distal or in a tortuous vessel. Missing it changes management and follow-up.",
        },
        {
          kind: "pitfalls",
          items: [
            "Equating every troponin rise with type 1 MI and sending the patient for angiography.",
            "Stopping the investigation at 'normal coronaries' without seeking the mechanism of a MINOCA presentation.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "MI requires acute myocardial injury plus clinical evidence of ischaemia.",
            "Fourth definition (2018): type 1 is atherothrombotic, type 2 is supply–demand mismatch, and types 4 and 5 relate to procedures. The fifth definition (2026) uses primary, secondary and procedure-related MI instead (hb-background-mi).",
            "Necrosis spreads from subendocardium to epicardium over hours: time is muscle.",
            "MINOCA is a working diagnosis; cardiac MR and careful angiographic review find the cause.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "scad-esc-2018", "supplied-eh-views", "hanna-pcm", "thygesen-4udmi-2018", "mills-5udmi-2026"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-phys-01",
      stem: "Why is the subendocardium the first layer of the left ventricle to become ischaemic?",
      options: [
        "It receives most of its flow during systole",
        "It has a lower oxygen demand than the epicardium",
        "It is supplied only by septal perforators",
        "It is compressed most during systole and lies furthest from the epicardial arteries",
        "It has no capacity for autoregulation",
      ],
      answer: 3,
      explanation:
        "The inner layer experiences the highest intramyocardial pressure during systole and is at the end of the supply line from the epicardial vessels, so it depends heavily on diastolic flow. The claim that it receives most of its flow in systole reverses the truth: the LV, and especially its subendocardium, is perfused mainly in diastole.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-phys-02",
      stem: "A patient in the lab has aortic pressure 90/50 mmHg and an LVEDP of 25 mmHg. What is the approximate coronary perfusion pressure to the left ventricle?",
      options: ["25 mmHg", "40 mmHg", "50 mmHg", "65 mmHg", "75 mmHg"],
      answer: 0,
      explanation:
        "Coronary perfusion pressure is approximately aortic diastolic pressure minus LVEDP: 50 − 25 = 25 mmHg. Subtracting LVEDP from systolic pressure (giving 65) is the common error; LV perfusion happens mainly in diastole, so diastolic pressure is the relevant driving pressure.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-phys-03",
      stem: "According to classic stenosis–flow studies, from roughly what diameter stenosis does maximal (hyperaemic) coronary flow begin to fall?",
      options: ["20%", "50%", "70%", "90%", "Only at total occlusion"],
      answer: 1,
      explanation:
        "Maximal flow begins to be limited from about 50% diameter stenosis, whereas resting flow is maintained until roughly 80–90%. Choosing 90% confuses the resting and maximal flow thresholds, and explains why many lesions cause exertional angina while resting flow is normal.",
      difficulty: 2,
      refs: ["hanna-pcm", "gould-stenosis-flow-1974"],
    },
    {
      id: "fnd-q-phys-04",
      stem: "A 38-year-old female smoker has an anterior NSTEMI. OCT of a 40% LAD lesion shows thrombus overlying an intact fibrous cap. What is the most likely mechanism?",
      options: ["Plaque rupture", "Calcified nodule", "Stent thrombosis", "Plaque erosion", "Type 2 MI from anaemia"],
      answer: 3,
      explanation:
        "Thrombus on an intact cap is the hallmark of plaque erosion, which is relatively more common in younger patients, women and smokers and often sits on a less severe stenosis. Rupture is the commonest mechanism overall but shows a broken cap with an underlying cavity.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-phys-05",
      stem: "Which statement best describes positive (outward) remodelling?",
      options: [
        "The lumen narrows as soon as plaque begins to form",
        "Stented segments enlarge over time",
        "The artery enlarges to preserve the lumen, so angiography underestimates plaque burden",
        "Collaterals enlarge in response to occlusion",
        "Calcium is resorbed from the plaque",
      ],
      answer: 2,
      explanation:
        "In early atherosclerosis the vessel expands outward so the lumen is preserved until plaque occupies roughly 40% of the area within the internal elastic lamina; the angiogram, which shows only the lumen, therefore underestimates disease. Immediate narrowing of the lumen as plaque forms is the opposite of what happens early in the disease.",
      difficulty: 1,
      refs: ["supplied-medmastery", "supplied-oxford", "glagov-remodelling-1987"],
    },
    {
      id: "fnd-q-phys-06",
      stem: "A 76-year-old with pneumonia and fast atrial fibrillation (rate 150/min) has a modest troponin rise and ST depression that resolves with rate control. Echocardiography shows no new wall-motion abnormality. Which classification is most appropriate?",
      options: [
        "Type 1 MI from acute plaque rupture triggered by the infection",
        "Type 3 MI, because the troponin rise preceded the ECG change",
        "Type 4a MI related to a recent coronary procedure",
        "MINOCA due to spontaneous coronary artery dissection",
        "Type 2 MI or demand-related myocardial injury",
      ],
      answer: 4,
      explanation:
        "The setting is supply–demand mismatch driven by tachyarrhythmia and infection, so under the 2018 definition this is type 2 MI (possible secondary MI under the 2026 fifth definition, which needs obstructive disease without acute pathology, or new wall-motion or viability loss, to confirm it), or myocardial injury if ischaemic criteria are not met; management focuses on the cause rather than urgent angiography. Type 1 is tempting because troponin is raised, but nothing suggests acute atherothrombosis.",
      difficulty: 2,
      refs: ["esc-acs-2023", "thygesen-4udmi-2018", "mills-5udmi-2026"],
    },
    {
      id: "fnd-q-phys-07",
      stem: "Which finding is required for a working diagnosis of MINOCA?",
      options: [
        "Acute MI criteria, no stenosis of 50% or more and no overt alternative cause",
        "A raised troponin alone, in any clinical setting, with unobstructed coronaries",
        "A normal cardiac MR scan within the first week after the presentation",
        "ST elevation on the presenting ECG together with a stenosis below 70%",
        "A confirmed diagnosis of myocarditis on cardiac MR or endomyocardial biopsy",
      ],
      answer: 0,
      explanation:
        "MINOCA requires the criteria for acute MI, non-obstructive coronaries (no stenosis of 50% or more) and no clinically overt specific cause. A confirmed diagnosis such as myocarditis replaces MINOCA with that diagnosis, so it cannot be a requirement.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-phys-08",
      stem: "After successful primary PCI, a patient's anterior wall is akinetic on day 1 but contracts normally three weeks later. What best explains this?",
      options: ["Hibernation", "Completed transmural infarction", "Myocardial stunning", "Reperfusion injury causing scar", "Restenosis"],
      answer: 2,
      explanation:
        "Stunning is reversible dysfunction after restored flow that recovers over days to weeks without further intervention. Hibernation is tempting but describes chronic down-regulation with persistently reduced flow, which needs revascularisation to have any chance of recovery.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
  ],
  sims: [
    { sim: "haemo", task: "Measure aortic diastolic pressure and LVEDP in a patient with heart failure and calculate the coronary perfusion pressure." },
  ],
};

// ===========================================================================
// Module 4 — The ECG for the cath lab
// ===========================================================================
const ecg: Module = {
  id: "fnd-ecg",
  title: "The ECG for the cath lab",
  stage: 1,
  summary:
    "STEMI criteria and territories, the occlusions that hide (posterior, right ventricular, bundle branch block, STEMI equivalents), pericarditis and other mimics, and the arrhythmias you will meet on the table.",
  objectives: [
    "Apply the ESC/Universal Definition ST-elevation thresholds, including posterior and right-sided leads.",
    "Localise the culprit artery from the ECG and use reciprocal change to support the diagnosis.",
    "Recognise posterior MI, RV infarction, de Winter T waves, Wellens pattern and diffuse ST depression with aVR elevation.",
    "Apply Sgarbossa-type criteria and current guidance to chest pain with bundle branch block or paced rhythm.",
    "Distinguish acute pericarditis and other mimics from STEMI.",
    "Recognise and manage vagal reactions, reperfusion arrhythmias, heart block and VF in the lab.",
  ],
  lessons: [
    {
      id: "fnd-ecg-stemi",
      title: "STEMI criteria, territories and reciprocal change",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Each ECG lead is a viewpoint. II, III and aVF look at the inferior wall; I, aVL, V5 and V6 at the lateral wall; V1–V2 at the septum; V3–V4 at the anterior wall. aVR looks into the cavity from the right shoulder, so it records ST elevation when there is widespread subendocardial ischaemia. No standard lead faces the posterior wall or the right ventricle directly.",
        },
        {
          kind: "table",
          caption: "ST-elevation thresholds at the J point in at least two contiguous leads (ESC, based on the Fourth Universal Definition). They assume no LVH or LBBB; 1 mm = 0.1 mV.",
          head: ["Leads", "Group", "Threshold"],
          rows: [
            ["All leads except V2–V3", "Everyone", "≥1 mm"],
            ["V2–V3", "Men aged 40 or over", "≥2 mm"],
            ["V2–V3", "Men under 40", "≥2.5 mm"],
            ["V2–V3", "Women of any age", "≥1.5 mm"],
            ["V7–V9 (posterior)", "Everyone (men under 40: ≥1 mm)", "≥0.5 mm"],
            ["V3R–V4R (right-sided)", "Everyone (men under 30: ≥1 mm)", "≥0.5 mm"],
          ],
        },
        {
          kind: "p",
          text: "Contiguous means neighbouring leads that look at the same region: II, III and aVF; I and aVL; or adjacent chest leads. A first ECG should be recorded and read within 10 minutes of first medical contact, and the STEMI diagnosis on that ECG starts the reperfusion clock.",
        },
        { kind: "h", text: "How the ECG evolves" },
        {
          kind: "p",
          text: "The earliest sign of an occluded artery may be hyperacute T waves: broad-based, tall and symmetrical relative to the QRS. ST elevation follows, and later Q waves and T-wave inversion develop. An early ECG can be non-diagnostic. If symptoms continue, repeat the ECG every few minutes and compare it with any previous tracing.",
        },
        { kind: "h", text: "Reciprocal change" },
        {
          kind: "p",
          text: "ST depression in leads facing the opposite wall (reciprocal change) supports a true occlusion and argues against mimics such as pericarditis or early repolarisation. In inferior STEMI, ST depression in aVL is an early and sensitive reciprocal sign. In proximal LAD occlusion, the inferior leads may show reciprocal depression.",
        },
        {
          kind: "table",
          head: ["Pattern", "Suggests"],
          rows: [
            ["ST elevation V1–V4 with inferior ST depression", "Proximal LAD occlusion"],
            ["ST elevation V1–V4 plus I and aVL", "LAD occlusion proximal to the first diagonal"],
            ["Anterior plus inferior ST elevation", "A 'wraparound' LAD supplying the inferior apex, or a distal LAD occlusion"],
            ["ST elevation III > II, depression in I and aVL", "RCA occlusion"],
            ["Inferior elevation with lateral (I, aVL, V5–V6) elevation", "Circumflex or a dominant circumflex system"],
            ["Inferior elevation with V4R elevation", "Proximal RCA with RV involvement"],
          ],
        },
        {
          kind: "pitfalls",
          title: "Common STEMI mimics",
          items: [
            "Left ventricular hypertrophy with strain.",
            "Early repolarisation, particularly in young men.",
            "Left bundle branch block and ventricular pacing.",
            "Acute pericarditis.",
            "Persistent ST elevation with Q waves from an old LV aneurysm.",
            "Takotsubo syndrome (needs angiography to separate from anterior STEMI).",
            "Hyperkalaemia and Brugada pattern.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "ECG within 10 minutes of first medical contact; the STEMI diagnosis starts the clock.",
            "Know the V2–V3 thresholds by age and sex, and the 0.5 mm thresholds for posterior and right-sided leads.",
            "Reciprocal ST depression supports a true occlusion.",
            "Repeat the ECG when symptoms persist and the first tracing is non-diagnostic.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "hanna-pcm", "thygesen-4udmi-2018"],
    },
    {
      id: "fnd-ecg-hidden",
      title: "Hidden occlusions: posterior, right ventricular, bundle branch block and STEMI equivalents",
      minutes: 13,
      blocks: [
        {
          kind: "p",
          text: "Some acute occlusions do not produce classic ST elevation on the standard 12 leads. These patients benefit from immediate reperfusion just as much, and missing them is a frequent cause of delay.",
        },
        { kind: "h", text: "Posterior infarction" },
        {
          kind: "p",
          text: "No standard lead faces the posterior (inferobasal) wall, so V1–V3 show its mirror image: horizontal ST depression with upright T waves, later followed by tall, broad R waves. Record posterior leads at the level of V6: V7 in the posterior axillary line, V8 at the tip of the scapula and V9 beside the spine. ST elevation of 0.5 mm or more in V7–V9 confirms posterior involvement. The culprit is usually the circumflex or posterolateral branches of a dominant RCA. Isolated posterior MI with ongoing symptoms is managed as STEMI.",
        },
        { kind: "h", text: "Right ventricular infarction" },
        {
          kind: "p",
          text: "Occlusion of the RCA proximal to its RV branches infarcts the right ventricle as well as the inferior wall. The classic clinical picture is hypotension, a raised jugular venous pressure and clear lungs. Record V4R (right fifth intercostal space, mid-clavicular line) in every inferior STEMI: ST elevation of 0.5 mm or more (1 mm in men under 30) indicates RV involvement. The changes can fade within hours, so record it early. ST elevation in V1 alongside inferior elevation is another clue.",
        },
        {
          kind: "list",
          items: [
            "The infarcted RV depends on preload: avoid nitrates and diuretics.",
            "If hypotensive with clear lungs, give cautious IV fluid boluses and reassess.",
            "AV block is common: have pacing ready and preserve AV synchrony where possible.",
            "Reperfuse early; persistent shock may need inotropes or mechanical support.",
          ],
        },
        { kind: "h", text: "Left bundle branch block and paced rhythm" },
        {
          kind: "p",
          text: "In LBBB and ventricular pacing, the ST segment normally moves opposite to the main QRS deflection (appropriate discordance), which hides or mimics ischaemia. Sgarbossa's criteria identify changes that are not explained by the conduction abnormality.",
        },
        {
          kind: "table",
          caption: "Sgarbossa criteria. A score of 3 or more is highly specific for acute MI but misses many occlusions.",
          head: ["Criterion", "Points"],
          rows: [
            ["Concordant ST elevation ≥1 mm in any lead with a positive QRS", "5"],
            ["Concordant ST depression ≥1 mm in V1, V2 or V3", "3"],
            ["Discordant ST elevation ≥5 mm in a lead with a negative QRS", "2"],
          ],
        },
        {
          kind: "p",
          text: "The Smith modification replaces the fixed 5 mm rule with a proportion: discordant ST elevation that is at least a quarter of the depth of the preceding S wave is considered abnormal. This improves sensitivity.",
        },
        {
          kind: "p",
          text: "The 2023 ESC guideline advises that patients with symptoms suggesting ongoing ischaemia and bundle branch block (left or right) or a ventricular paced rhythm are managed with a primary PCI strategy, as for STEMI. A positive Sgarbossa-type criterion strengthens the case, but a negative score does not exclude occlusion, and a known old LBBB does not make the presentation safe. A pain-free, stable patient with LBBB and no ischaemic features follows the usual troponin-based pathway instead.",
        },
        { kind: "h", text: "STEMI equivalents and high-risk patterns" },
        {
          kind: "table",
          head: ["Pattern", "ECG", "Meaning and action"],
          rows: [
            ["De Winter T waves", "Upsloping ST depression of 1–3 mm at the J point in the precordial leads running into tall, symmetrical T waves; often slight ST elevation in aVR", "Acute proximal LAD occlusion: treat as STEMI"],
            ["Wellens pattern", "In a pain-free patient after recent angina: biphasic (type A) or deep symmetrical inverted (type B) T waves in V2–V3, preserved R waves, little or no ST elevation", "Critical proximal LAD stenosis that has reperfused; high risk of anterior MI. Arrange early angiography and avoid exercise stress testing"],
            ["Diffuse ST depression with ST elevation in aVR (with or without V1)", "ST depression in many leads, maximal in the lateral and inferior leads, with aVR elevation", "Left main or severe multivessel ischaemia, or global subendocardial ischaemia from other causes. With ongoing ischaemia or instability, urgent angiography"],
            ["Hyperacute T waves", "Broad-based, tall T waves out of proportion to the QRS", "Earliest sign of occlusion: repeat the ECG within minutes"],
            ["Isolated posterior MI", "ST depression V1–V3 with upright T waves; ST elevation in V7–V9", "Treat as STEMI"],
          ],
        },
        {
          kind: "pearl",
          text: "Widespread ST depression with aVR elevation in an acute presentation should make you careful at the left main ostium. Watch the pressure trace for damping as you engage, and have a plan ready if the first injection shows severe left main disease.",
        },
        {
          kind: "pitfalls",
          items: [
            "Recording V4R hours into an inferior STEMI, when the RV changes have already resolved.",
            "Dismissing ST depression in V1–V3 as 'anterior ischaemia' without recording posterior leads.",
            "Waiting for troponin in a patient with ongoing pain and bundle branch block.",
            "Sending a patient with a Wellens pattern for an exercise test.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Posterior MI: ST depression V1–V3, confirm with V7–V9.",
            "RV infarction: hypotension, raised JVP, clear lungs, ST elevation in V4R; avoid nitrates.",
            "Ongoing ischaemia with bundle branch block or paced rhythm: primary PCI strategy (ESC 2023).",
            "De Winter and Wellens patterns both point to the proximal LAD.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "hanna-pcm", "supplied-medmastery", "thygesen-4udmi-2018", "sgarbossa-lbbb-1996", "smith-modified-sgarbossa-2012", "de-winter-2008", "de-zwaan-wellens-1982"],
    },
    {
      id: "fnd-ecg-mimics",
      title: "Pericarditis and other mimics",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Acute pericarditis inflames the epicardial surface of the whole heart, so its ST changes are widespread rather than territorial. The ESC pericardial guideline diagnoses it when at least two of the following are present: typical pleuritic chest pain relieved by sitting forward, a pericardial rub, new widespread ST elevation or PR depression, and a new or worsening pericardial effusion.",
        },
        {
          kind: "table",
          head: ["Feature", "Acute pericarditis", "STEMI"],
          rows: [
            ["Distribution", "Widespread, not confined to one coronary territory", "Territorial, in contiguous leads"],
            ["ST shape", "Concave upwards", "Often straight or convex, though early STEMI can be concave"],
            ["Reciprocal ST depression", "Absent, except in aVR and sometimes V1", "Common"],
            ["PR segment", "Depressed (elevated in aVR)", "Usually normal"],
            ["Q waves", "Absent", "May develop"],
            ["T-wave inversion", "Appears after the ST segment has returned to baseline", "Can appear while ST is still elevated"],
            ["Echocardiography", "Normal wall motion, with or without effusion", "Regional wall-motion abnormality"],
          ],
        },
        {
          kind: "p",
          text: "A distal or apical LAD occlusion, particularly a 'wraparound' LAD, can produce ST elevation in many leads and be mistaken for pericarditis. Clues that favour STEMI include ST elevation in V1, ST elevation maximal in V2–V4, ST segments as tall as or taller than the QRS, and any reciprocal depression outside aVR. When doubt remains in a patient with ongoing pain, urgent echocardiography and a discussion with the primary PCI team are appropriate; angiography is the final arbiter.",
        },
        {
          kind: "list",
          items: [
            "Early repolarisation: notched or slurred J point, mainly in young men, stable over time.",
            "LV aneurysm: persistent ST elevation with deep Q waves after an old anterior MI; compare with previous ECGs.",
            "Takotsubo syndrome: can mimic anterior STEMI, usually after emotional or physical stress; requires angiography.",
            "Hyperkalaemia: peaked T waves, broad QRS, flattened P waves.",
            "Brugada pattern: coved ST elevation in V1–V2.",
          ],
        },
        {
          kind: "steps",
          title: "A systematic approach to uncertain ST elevation",
          items: [
            { title: "Is it territorial?", detail: "ST elevation confined to contiguous leads that match one coronary territory favours occlusion." },
            { title: "Is there reciprocal change?", detail: "ST depression outside aVR and V1 strongly favours occlusion." },
            { title: "Compare with an old ECG", detail: "Stable, unchanged ST elevation suggests early repolarisation or an old aneurysm." },
            { title: "Look at the heart", detail: "A bedside echo showing a regional wall-motion abnormality in the matching territory supports occlusion; an effusion with normal wall motion supports pericarditis." },
            { title: "Repeat and escalate", detail: "Repeat the ECG every few minutes while pain persists, and discuss early with the primary PCI team rather than waiting for certainty." },
          ],
        },
        {
          kind: "pearl",
          text: "A type A aortic dissection can extend into the RCA ostium and present as an inferior STEMI. Back pain, a blood pressure difference between the arms, a new aortic regurgitant murmur or neurological signs should make you pause before giving antithrombotic drugs.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling pericarditis in the presence of reciprocal ST depression.",
            "Ignoring myopericarditis: a raised troponin with pericarditic ECG changes still needs careful assessment.",
            "Diagnosing an old aneurysm without an old ECG to compare.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Pericarditis: diffuse concave ST elevation, PR depression, no reciprocal change outside aVR.",
            "Apical STEMI can mimic pericarditis; ST elevation in V1 favours STEMI.",
            "Consider aortic dissection in inferior STEMI with atypical features.",
          ],
        },
      ],
      refs: ["esc-pericardial-2015", "esc-acs-2023", "supplied-eh-views"],
    },
    {
      id: "fnd-ecg-arrhythmias",
      title: "Arrhythmias in the cath lab",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Arrhythmias are common during catheterisation. Most are brief and predictable from what you are doing at the time. Your job is to anticipate them, recognise them instantly on the monitor and respond as a team.",
        },
        {
          kind: "table",
          caption: "Drug doses are typical adult values for orientation; follow current resuscitation guidance and local protocol.",
          head: ["Rhythm", "Usual trigger", "Immediate response"],
          rows: [
            ["Sinus slowing or transient AV block", "Contrast in the RCA reaching the SA and AV nodal arteries", "Pause; ask the patient to cough; atropine if it persists"],
            ["Vasovagal reaction (bradycardia with hypotension)", "Pain, anxiety, arterial puncture, sheath removal, femoral compression", "Stop the stimulus, lie flat and raise the legs, IV fluid, atropine (typically 0.5 mg IV, repeated to a maximum of 3 mg); exclude bleeding, tamponade and anaphylaxis"],
            ["Ventricular ectopics or short runs of VT", "Catheter or wire in the LV, pigtail against the septum", "Reposition the catheter"],
            ["Ventricular fibrillation or pulseless VT", "Injection into the conus, deep engagement with a damped trace, contrast pooling, balloon or no-reflow ischaemia, reperfusion", "Defibrillate immediately; up to three stacked shocks in a monitored lab; then advanced life support"],
            ["Accelerated idioventricular rhythm", "Reperfusion of an occluded artery", "Usually benign and self-limiting; do not suppress it"],
            ["Bradycardia and hypotension at RCA reperfusion", "Bezold–Jarisch reflex from the inferior wall", "Atropine and fluid; temporary pacing if persistent"],
            ["Complete heart block", "Inferior MI (AV node), anterior MI (infranodal), right heart catheter in pre-existing LBBB", "Atropine for nodal block; transcutaneous then transvenous pacing if compromised or infranodal"],
            ["Atrial fibrillation or SVT", "Wire or catheter irritating the atrium, ischaemia", "Usually transient; rate or rhythm control; cardiovert if unstable"],
          ],
        },
        {
          kind: "steps",
          title: "VF on the table",
          items: [
            { title: "Recognise", detail: "The monitor shows VF and the patient loses consciousness within seconds. Call it out loudly." },
            { title: "Make the coronary safe", detail: "Withdraw the catheter from the ostium so that movement during the shock or CPR does not injure the artery." },
            { title: "Shock without delay", detail: "In a witnessed, monitored arrest in the lab, deliver up to three quick successive shocks before starting CPR." },
            { title: "Continue advanced life support", detail: "If VF persists, start CPR and follow the ALS algorithm." },
            { title: "Find the cause", detail: "Check the last injection and the pressure trace: conus injection, dissection, air, no-reflow, occlusion by a balloon or stent." },
          ],
        },
        {
          kind: "p",
          text: "Accelerated idioventricular rhythm (AIVR) is a regular broad-complex rhythm at a rate close to the sinus rate (commonly quoted as about 50–110/min). It often marks successful reperfusion and needs no treatment unless it compromises the circulation.",
        },
        {
          kind: "pearl",
          text: "In high-risk cases (STEMI, cardiogenic shock, left main disease, severe LV dysfunction) apply defibrillator pads before the patient is draped. Placing them afterwards, in a hurry, is much harder.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting contrast through a damped or ventricularised pressure trace.",
            "Treating AIVR after reperfusion with amiodarone or lidocaine.",
            "Attributing hypotension and bradycardia to a vagal reaction without excluding bleeding, tamponade and anaphylaxis.",
            "Forgetting that unconscious patients move: guide catheters, wires and sterility can be lost during a shock.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA while watching the pressure trace. Whenever it damps or ventricularises, withdraw slightly and restore a normal trace before injecting.",
        },
      ],
      refs: ["supplied-medmastery", "supplied-oxford", "hanna-pcm", "rcuk-als-2021"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-ecg-01",
      stem: "A 35-year-old man has chest pain and ST elevation in V2 and V3. What is the minimum ST elevation at the J point in these leads that meets the STEMI criterion?",
      options: ["1 mm", "1.5 mm", "2 mm", "2.5 mm", "3 mm"],
      answer: 3,
      explanation:
        "For V2–V3 the threshold is 2.5 mm in men under 40, 2 mm in men aged 40 or over and 1.5 mm in women. 2 mm is the tempting answer but applies to older men; young men have more ST elevation at baseline in these leads.",
      difficulty: 2,
      refs: ["esc-acs-2023", "thygesen-4udmi-2018"],
    },
    {
      id: "fnd-q-ecg-02",
      stem: "A patient with 40 minutes of ongoing chest pain has 2 mm horizontal ST depression in V1–V3 with upright T waves and no ST elevation elsewhere. What is the most appropriate next step?",
      options: [
        "Treat as NSTE-ACS and await troponin",
        "Record posterior leads V7–V9",
        "Arrange an exercise ECG",
        "Record right-sided leads only",
        "Repeat the ECG tomorrow",
      ],
      answer: 1,
      explanation:
        "ST depression confined to V1–V3 with upright T waves may be the mirror image of posterior ST elevation; ST elevation of 0.5 mm or more in V7–V9 confirms posterior MI, which is managed as STEMI. Treating it as NSTE-ACS and waiting for troponin delays reperfusion of an occluded artery.",
      difficulty: 2,
      refs: ["esc-acs-2023", "thygesen-4udmi-2018"],
    },
    {
      id: "fnd-q-ecg-03",
      stem: "A patient with inferior STEMI has BP 85/55 mmHg, a raised JVP and clear lungs. V4R shows 1 mm ST elevation. Which intervention is most likely to cause harm?",
      options: [
        "Sublingual or IV nitrate for pain",
        "A cautious IV fluid bolus",
        "Applying external pacing pads",
        "Atropine for symptomatic bradycardia",
        "Immediate transfer for primary PCI",
      ],
      answer: 0,
      explanation:
        "This is RV infarction: the right ventricle depends on preload, and nitrate-induced venodilatation can cause profound hypotension. A cautious fluid bolus is the appropriate response to hypotension with clear lungs, so it is not the harmful option.",
      difficulty: 1,
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
    {
      id: "fnd-q-ecg-04",
      stem: "At a primary PCI centre, a 70-year-old with 1 hour of severe chest pain has LBBB with 2 mm of ST elevation in V5–V6, concordant with positive QRS complexes. An ECG from last year also shows LBBB. What should happen?",
      options: [
        "Activate the primary PCI pathway",
        "Wait for a high-sensitivity troponin at 0 and 1 hour",
        "Give fibrinolysis in the emergency department",
        "Treat as pericarditis",
        "Repeat the ECG in 6 hours",
      ],
      answer: 0,
      explanation:
        "Concordant ST elevation of 1 mm or more in a lead with a positive QRS is a strong Sgarbossa criterion, and ESC 2023 advises a primary PCI strategy for ongoing ischaemic symptoms with bundle branch block whether or not the block is old. Waiting for troponin is the tempting error: it delays reperfusion of a probable occlusion.",
      difficulty: 2,
      refs: ["esc-acs-2023", "sgarbossa-lbbb-1996"],
    },
    {
      id: "fnd-q-ecg-05",
      stem: "A 56-year-old who had chest pain yesterday is now pain-free. His ECG shows deep symmetrical T-wave inversion in V2–V4 with preserved R waves and no ST elevation. Troponin is mildly raised. What is the best plan?",
      options: [
        "Exercise ECG before discharge to look for inducible ischaemia",
        "Early invasive coronary angiography; avoid stress testing",
        "Discharge with GP follow-up and a repeat ECG in two weeks",
        "Immediate fibrinolysis for a presumed occluded LAD",
        "Cardiac MR in 6 weeks to assess viability before deciding",
      ],
      answer: 1,
      explanation:
        "This is a Wellens pattern, indicating a critical proximal LAD stenosis that has reperfused; the risk of a large anterior MI is high, so early angiography is needed. An exercise test is the classic mistake: it can provoke occlusion and adds nothing to the diagnosis.",
      difficulty: 2,
      refs: ["hanna-pcm", "de-zwaan-wellens-1982"],
    },
    {
      id: "fnd-q-ecg-06",
      stem: "Which ECG feature best supports acute pericarditis rather than STEMI?",
      options: [
        "ST elevation greater in III than in II",
        "Diffuse concave ST elevation with PR depression and no reciprocal change outside aVR",
        "ST elevation in V1 with ST depression in II, III and aVF",
        "New Q waves in V1–V3",
        "ST elevation as tall as the QRS complex",
      ],
      answer: 1,
      explanation:
        "Widespread concave ST elevation with PR depression and reciprocal change only in aVR is the pericarditis pattern. ST elevation in III greater than II, reciprocal inferior depression, Q waves and very tall ST segments all point towards a coronary occlusion instead.",
      difficulty: 1,
      refs: ["esc-pericardial-2015"],
    },
    {
      id: "fnd-q-ecg-07",
      stem: "Seconds after an occluded RCA is opened, the monitor shows a regular broad-complex rhythm at 75/min. Blood pressure is stable. What should you do?",
      options: [
        "Give IV amiodarone to suppress ventricular tachycardia",
        "Deliver a synchronised shock before the rhythm degenerates",
        "Observe: this is accelerated idioventricular rhythm",
        "Give IV lidocaine because reperfusion VT often recurs",
        "Abandon the procedure and transfer to coronary care",
      ],
      answer: 2,
      explanation:
        "A regular broad-complex rhythm at about the sinus rate immediately after reperfusion is AIVR, a marker of reperfusion that is usually self-limiting and benign. Suppressing it with amiodarone or lidocaine is the tempting error; it is not ventricular tachycardia and suppression can remove the only effective rhythm.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-ecg-08",
      stem: "A patient with known LBBB is having right heart catheterisation. As the catheter crosses the tricuspid valve, complete heart block develops. What is the most likely mechanism?",
      options: [
        "A vasovagal reaction to the catheter, with sinus slowing that becomes complete block",
        "Catheter trauma causing right bundle branch block on top of the existing LBBB",
        "Air embolism to the RCA from the venous sheath, through a patent foramen ovale",
        "Contrast-induced AV nodal block from a test injection in the right ventricle",
        "Anaphylaxis to the local anaesthetic, with conduction failure and hypotension",
      ],
      answer: 1,
      explanation:
        "Mechanical irritation of the right bundle by a catheter in the RV is usually trivial, but when the left bundle is already blocked it removes the last conducting pathway and causes complete heart block. A vagal reaction slows the sinus rate and lowers blood pressure but does not usually cause complete block at this moment.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-ecg-09",
      stem: "During a left coronary injection the monitor shows VF and the patient becomes unresponsive. What is the correct immediate action?",
      options: [
        "Start chest compressions for 2 minutes before the first shock is delivered",
        "Give IV adrenaline 1 mg straight away and repeat it every 3–5 minutes",
        "Withdraw the catheter from the ostium and defibrillate immediately",
        "Give a precordial thump and wait for the rhythm to recover on its own",
        "Inject intracoronary nitrate through the catheter to relieve vasospasm",
      ],
      answer: 2,
      explanation:
        "In a witnessed, monitored arrest in the lab, early defibrillation is the most effective treatment and up to three successive shocks are given before CPR. Starting with 2 minutes of CPR is the standard out-of-hospital sequence and wastes the advantage of immediate recognition.",
      difficulty: 1,
      refs: ["supplied-medmastery", "rcuk-als-2021"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage both coronaries ten times, calling out the pressure waveform each time (normal, damped or ventricularised) before any injection." },
  ],
  caseIds: ["fnd-case-inferior-rv", "fnd-case-lbbb"],
};

// ===========================================================================
// Module 5 — Pharmacology for the lab
// ===========================================================================
const pharmacology: Module = {
  id: "fnd-pharmacology",
  title: "Pharmacology for the cath lab",
  stage: 1,
  summary:
    "Antiplatelet and anticoagulant drugs, their monitoring and reversal, the vasodilators and rescue drugs used on the table, sedation, and the special situations of oral anticoagulation, contrast allergy and interacting medicines.",
  objectives: [
    "Explain the mechanism, onset and key cautions of aspirin, clopidogrel, prasugrel, ticagrelor, cangrelor and GP IIb/IIIa inhibitors.",
    "Describe heparin dosing, ACT monitoring and protamine reversal, and the roles of bivalirudin, enoxaparin and fondaparinux.",
    "Use intracoronary nitrate, verapamil, adenosine and atropine appropriately and recognise their contraindications.",
    "Give safe conscious sedation and analgesia and know how to reverse it.",
    "Plan for patients on oral anticoagulants, with previous contrast reactions or taking interacting medicines.",
  ],
  lessons: [
    {
      id: "fnd-pharm-antiplatelets",
      title: "Antiplatelet drugs",
      minutes: 12,
      blocks: [
        {
          kind: "p",
          text: "Arterial thrombus in ACS and on stents is driven by platelets. Three pathways are targeted: thromboxane A2 production (blocked by aspirin), ADP signalling through the P2Y12 receptor (blocked by P2Y12 inhibitors), and the final common pathway in which glycoprotein IIb/IIIa receptors bind fibrinogen to link platelets together (blocked by GP IIb/IIIa inhibitors). Dual antiplatelet therapy (DAPT) combines aspirin with a P2Y12 inhibitor.",
        },
        {
          kind: "table",
          caption: "Typical adult doses for orientation only. Follow your local protocol and the product information, and adjust for age, weight, renal function and bleeding risk.",
          head: ["Drug", "Mechanism", "Typical loading dose", "Typical maintenance", "Points to know"],
          rows: [
            ["Aspirin", "Irreversible COX-1 inhibition (thromboxane A2)", "150–300 mg orally", "75 mg daily (UK)", "Continued long term after ACS or PCI unless contraindicated; true allergy is rare and desensitisation is possible."],
            ["Clopidogrel", "Irreversible P2Y12 blockade; prodrug activated in the liver (CYP2C19)", "300–600 mg (600 mg before PCI)", "75 mg daily", "Slower and more variable effect; default P2Y12 inhibitor for elective PCI and when combined with an oral anticoagulant."],
            ["Prasugrel", "Irreversible P2Y12 blockade; prodrug, more efficiently activated", "60 mg", "10 mg daily (5 mg if aged 75 or over or under 60 kg)", "Contraindicated after stroke or TIA. For ACS patients proceeding to PCI, ESC 2023 favours it over ticagrelor (a weaker recommendation)."],
            ["Ticagrelor", "Reversible P2Y12 blockade; active drug, not a prodrug", "180 mg", "90 mg twice daily", "Dyspnoea and bradyarrhythmias; avoid with strong CYP3A4 inhibitors or inducers; twice-daily dosing challenges adherence."],
            ["Cangrelor", "Intravenous reversible P2Y12 blockade; effect within minutes, gone within about an hour of stopping", "IV bolus then infusion during PCI (per product information)", "Not applicable", "For P2Y12-naive patients having PCI, or when oral drugs cannot be absorbed (intubated, vomiting, after large opioid doses)."],
            ["GP IIb/IIIa inhibitors (tirofiban, eptifibatide)", "Block fibrinogen binding at the final common pathway", "IV bolus with or without infusion (per product information)", "Not applicable", "Mainly bail-out for large thrombus burden, no-reflow or thrombotic complications; increase bleeding; can cause thrombocytopenia, so check the platelet count."],
          ],
        },
        {
          kind: "p",
          text: "When switching from cangrelor to an oral P2Y12 inhibitor, ticagrelor can be given before, during or after the infusion. Clopidogrel and prasugrel should be given at or after the end of the infusion, because cangrelor occupies the receptor and stops their active metabolites binding.",
        },
        { kind: "h", text: "Pre-treatment and duration" },
        {
          kind: "p",
          text: "In the 2023 ESC guideline, routine pre-treatment with a P2Y12 inhibitor is not recommended for NSTE-ACS patients when the anatomy is unknown and early invasive angiography (within 24 hours) is planned; the drug is given once the anatomy is known and PCI is chosen. Pre-treatment may be considered in STEMI patients heading for primary PCI. After ACS, the default duration of DAPT is 12 months, with shorter or de-escalated regimens for patients at high bleeding risk. After elective PCI for chronic coronary syndrome, the 2024 ESC guideline sets a default of aspirin plus clopidogrel for up to 6 months, shortened to 1–3 months in high bleeding risk.",
        },
        {
          kind: "pitfalls",
          items: [
            "Loading prasugrel in a patient with a previous stroke or TIA.",
            "Expecting full platelet inhibition from an oral P2Y12 inhibitor given to an intubated, vomiting or opioid-treated STEMI patient; absorption is delayed.",
            "Stopping DAPT early for a minor procedure without discussion; premature cessation is a major cause of stent thrombosis.",
            "Forgetting to recheck the platelet count after starting a GP IIb/IIIa inhibitor.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Aspirin plus a P2Y12 inhibitor is the foundation of ACS and stent therapy.",
            "Clopidogrel needs hepatic activation and has a variable effect; prasugrel and ticagrelor are faster and stronger.",
            "Cangrelor is IV, works within minutes and wears off within about an hour.",
            "GP IIb/IIIa inhibitors are now mainly bail-out drugs for thrombotic complications.",
            "DAPT defaults: 12 months after ACS; up to 6 months after elective PCI (shorter in high bleeding risk).",
          ],
        },
      ],
      refs: ["esc-acs-2023", "esc-ccs-2024", "supplied-medmastery", "brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "fnd-pharm-anticoag",
      title: "Anticoagulation in the lab and its reversal",
      minutes: 11,
      blocks: [
        {
          kind: "p",
          text: "Catheters, wires and stents are foreign surfaces that activate coagulation, so every PCI needs anticoagulation. For diagnostic radial procedures, a dose of heparin also reduces the risk of radial artery occlusion. Unfractionated heparin (UFH) remains the standard in most UK labs because it is cheap, can be monitored at the bedside and can be reversed.",
        },
        {
          kind: "table",
          caption: "Typical adult regimens for orientation only; follow local protocol.",
          head: ["Agent", "How it works", "Typical use in the lab", "Monitoring and reversal"],
          rows: [
            ["Unfractionated heparin", "Potentiates antithrombin against thrombin and factor Xa", "PCI: 70–100 units/kg IV (50–70 units/kg if a GP IIb/IIIa inhibitor is used). Radial diagnostic: often a fixed 2,500–5,000 units or about 50 units/kg", "ACT; reversed by protamine; risk of heparin-induced thrombocytopenia"],
            ["Enoxaparin", "Low-molecular-weight heparin, mainly anti-Xa", "An alternative to UFH at PCI (ESC: 0.5 mg/kg IV in primary PCI); if the patient is on subcutaneous enoxaparin, the need for an extra dose depends on timing of the last dose", "ACT does not reflect its effect; only partly reversed by protamine; renally cleared"],
            ["Bivalirudin", "Direct thrombin inhibitor with a short half-life (about 25 minutes)", "Alternative to UFH, notably in heparin-induced thrombocytopenia; IV bolus then infusion", "ACT rises; no specific antidote, so stop the infusion; renally cleared"],
            ["Fondaparinux", "Indirect factor Xa inhibitor (via antithrombin)", "Used in the medical phase of NSTE-ACS; not adequate alone during PCI, so give a UFH bolus at the procedure", "Not reversed by protamine"],
          ],
        },
        { kind: "h", text: "The activated clotting time" },
        {
          kind: "p",
          text: "The ACT is a point-of-care whole-blood clotting test that reflects UFH and bivalirudin effect. Check it about 5–10 minutes after the bolus. A common target during PCI without a GP IIb/IIIa inhibitor is 250–350 seconds, with lower targets when one is used. Recheck roughly every 30 minutes in long procedures and give more heparin when needed; ask a team member to set a timer, because it is easy to lose track during a complex case. ACT values differ between machines, so learn your lab's device and protocol.",
        },
        {
          kind: "p",
          text: "Femoral sheaths are usually removed once the ACT has fallen below a local threshold (below 180 seconds in Brilakis's manual; below 150–200 seconds, or after 3–4 hours, in the Oxford handbook; below 175 seconds in the Medmastery handbook), unless a closure device is used. Radial sheaths are removed at the end of the case with a compression band regardless of ACT.",
        },
        { kind: "h", text: "Protamine" },
        {
          kind: "formula",
          name: "Protamine dose (approximate)",
          expr: "1 mg protamine per 100 units of heparin estimated to remain in the circulation",
          note: "Usually no more than 50 mg in a single dose, given slowly IV. UFH has a dose-dependent half-life of around an hour at PCI doses, so base the estimate on the dose given and the time elapsed. Follow local protocol.",
        },
        {
          kind: "p",
          text: "Protamine binds heparin and neutralises it. It can cause hypotension, bradycardia, pulmonary hypertension and anaphylactoid reactions, especially if given quickly. Risk is higher in patients previously exposed to protamine, including those using protamine-containing (isophane) insulin, and in those with fish allergy or previous vasectomy. In the lab it is used for bleeding complications such as perforation or haemorrhagic stroke. Reversing anticoagulation while equipment remains in a coronary artery risks thrombosis, so the timing is a senior decision.",
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring the ACT immediately after the heparin bolus, before it has taken effect.",
            "Forgetting to redose heparin during a long procedure, inviting thrombus in the guide catheter.",
            "Using the ACT to monitor enoxaparin.",
            "Proceeding to PCI on fondaparinux without an additional UFH bolus.",
            "Giving heparin to a patient with a history of heparin-induced thrombocytopenia: check the record and use bivalirudin.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "UFH 70–100 units/kg for PCI is typical; check ACT after 5–10 minutes and every 30 minutes.",
            "Protamine reverses UFH (about 1 mg per 100 units remaining), only partly reverses enoxaparin and does not reverse bivalirudin or fondaparinux.",
            "Fondaparinux-treated patients need UFH at PCI.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "esc-acs-2023", "brilakis-manual-pci"],
    },
    {
      id: "fnd-pharm-lab-drugs",
      title: "Vasodilators, atropine and sedation",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "A small group of drugs is used in almost every case. Know their indications, typical doses and, above all, when not to give them.",
        },
        {
          kind: "table",
          caption: "Typical adult doses for orientation only. Follow local protocol and product information.",
          head: ["Drug", "Use in the lab", "Typical dose", "Cautions"],
          rows: [
            ["Glyceryl trinitrate (intracoronary)", "Exclude or treat spasm; dilate the vessel before sizing and before physiology", "100–250 µg IC bolus, repeated as blood pressure allows", "Hypotension; avoid after PDE5 inhibitors, in RV infarction and when systolic pressure is low; caution in severe aortic stenosis"],
            ["Verapamil (intra-arterial)", "Prevent or treat radial spasm, usually with a nitrate", "Commonly 2.5–5 mg diluted in blood through the radial sheath", "Hypotension, bradycardia, AV block"],
            ["Verapamil, adenosine or nitroprusside (intracoronary)", "No-reflow, given distally through a microcatheter", "Small boluses per local protocol", "Hypotension; adenosine causes transient AV block"],
            ["Adenosine (IV)", "Maximal hyperaemia for pressure-wire studies", "140 µg/kg/min infusion", "Dyspnoea, chest tightness, flushing, transient AV block; caution in severe bronchospasm. Warn the patient beforehand."],
            ["Atropine", "Symptomatic bradycardia, vagal reactions, nodal heart block", "0.5 mg IV, repeated to a maximum of 3 mg", "Tachycardia raises oxygen demand; ineffective in infranodal block"],
            ["Lidocaine (local)", "Anaesthesia at the access site", "1–2% infiltration, a few mL for radial access", "Stay within the maximum dose for body weight; check for allergy"],
          ],
        },
        {
          kind: "p",
          text: "Nitrates are dangerous after phosphodiesterase-5 inhibitors used for erectile dysfunction or pulmonary hypertension. Ask every patient. Avoid nitrates within 24 hours of sildenafil and 48 hours of tadalafil; verapamil alone can be used for radial spasm prevention instead.",
        },
        { kind: "h", text: "Sedation and analgesia" },
        {
          kind: "p",
          text: "Most angiography and PCI is done under local anaesthesia with light conscious sedation. The patient must stay responsive enough to follow instructions, hold their breath for imaging, cough on request and report chest pain. Typical agents are small titrated doses of a short-acting benzodiazepine (such as midazolam) and an opioid (such as fentanyl), with smaller doses in older patients and those with lung disease or sleep apnoea. Monitor oxygen saturation, blood pressure, ECG and conscious level. Reversal agents (flumazenil for benzodiazepines, naloxone for opioids) must be immediately available.",
        },
        {
          kind: "p",
          text: "Opioids slow gastric emptying and delay the absorption and action of oral P2Y12 inhibitors in ACS. Use the smallest effective dose.",
        },
        {
          kind: "pearl",
          text: "Talk before you sedate. Explaining in advance the warmth of contrast, the need to hold the breath and the pressure at the puncture site reduces anxiety, vagal reactions and the need for drugs.",
        },
        {
          kind: "pitfalls",
          items: [
            "Over-sedating an older patient, who then cannot hold their breath, hypoventilates and desaturates.",
            "Giving intracoronary nitrate to a hypotensive patient or one who took tadalafil yesterday.",
            "Starting adenosine without warning the patient, who then panics and moves.",
            "Repeating atropine for broad-complex escape rhythms instead of pacing.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Intracoronary GTN separates spasm from fixed stenosis and should precede vessel sizing.",
            "Ask about PDE5 inhibitors before any nitrate.",
            "Atropine 0.5 mg IV, repeated to 3 mg, for symptomatic bradycardia.",
            "Conscious sedation should leave the patient able to cooperate; keep reversal agents ready.",
          ],
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "fnd-pharm-special",
      title: "Special situations: oral anticoagulants, contrast allergy and other medicines",
      minutes: 10,
      blocks: [
        { kind: "h", text: "Patients taking oral anticoagulants" },
        {
          kind: "table",
          head: ["Situation", "Typical approach (check local policy)"],
          rows: [
            ["Elective angiography on warfarin", "Radial access. Some centres proceed if the INR is within a locally agreed range; others withhold warfarin beforehand. Bridging is rarely needed."],
            ["Elective angiography on a DOAC", "Commonly withheld before the procedure, for a period that depends on the drug, renal function and bleeding risk; restarted once haemostasis is secure."],
            ["ACS on any oral anticoagulant", "Do not delay an urgent procedure; use radial access. ESC guidance advises additional parenteral anticoagulation during PCI regardless of the timing of the last DOAC dose, and in warfarin-treated patients when the INR is below about 2.5."],
            ["After PCI in a patient with AF needing anticoagulation", "Default (ESC): a short period of triple therapy (oral anticoagulant, aspirin and clopidogrel, up to about a week), then anticoagulant plus clopidogrel to 12 months after ACS or 6 months after elective PCI, then anticoagulant alone. Prefer a DOAC to warfarin; avoid prasugrel and ticagrelor in triple therapy."],
          ],
        },
        { kind: "h", text: "Previous reaction to iodinated contrast" },
        {
          kind: "p",
          text: "Immediate contrast reactions range from mild (limited urticaria, itch) through moderate (widespread urticaria, bronchospasm without hypoxia) to severe (anaphylaxis with airway compromise, hypoxia or shock). A previous moderate or severe reaction is the strongest predictor of another. Establish what actually happened and which agent was used; nausea, warmth and vagal faints are not allergy.",
        },
        {
          kind: "list",
          items: [
            "Use a different contrast agent from the one that caused the reaction.",
            "Make the whole team aware, involve anaesthetic support for previous severe reactions and have adrenaline and resuscitation equipment ready before starting.",
            "Corticosteroid and antihistamine premedication is widely used after previous reactions, but evidence that it prevents severe reactions is weak, breakthrough reactions occur, and accelerated regimens given only shortly before the procedure have little supporting evidence. UK radiology guidance is more sceptical than North American guidance; follow local policy.",
            "Never delay a time-critical procedure to complete a premedication regimen.",
            "Shellfish allergy and reactions to topical iodine antiseptics do not predict reactions to iodinated contrast.",
          ],
        },
        { kind: "h", text: "Other medicines to review" },
        {
          kind: "table",
          head: ["Medicine", "Issue", "Typical action"],
          rows: [
            ["Metformin", "Lactic acidosis if contrast-associated kidney injury occurs", "Withhold after contrast in patients with significantly reduced eGFR or acute kidney injury, and restart once renal function is confirmed stable (commonly 48 hours), per local policy"],
            ["PDE5 inhibitors", "Severe hypotension with nitrates", "Ask about use; avoid nitrates within 24 hours (sildenafil) or 48 hours (tadalafil)"],
            ["NSAIDs and diuretics", "Add to kidney injury risk", "Consider withholding around contrast exposure in high-risk patients"],
            ["Insulin and sulfonylureas", "Hypoglycaemia during fasting", "Adjust doses according to local fasting guidance"],
            ["Heparin history", "Previous heparin-induced thrombocytopenia", "Use a non-heparin anticoagulant such as bivalirudin"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating a reported 'iodine allergy' as a contraindication without finding out what happened.",
            "Relying on premedication and not preparing to treat anaphylaxis.",
            "Forgetting that a patient on a DOAC still needs parenteral anticoagulation during urgent PCI.",
            "Using prasugrel or ticagrelor in triple therapy.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Radial access for anticoagulated patients; follow local rules on when to withhold warfarin or DOACs.",
            "AF plus PCI: short triple therapy, then anticoagulant plus clopidogrel, then anticoagulant alone.",
            "Previous contrast reaction: change agent, prepare the team, consider premedication per policy, do not delay urgent care.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "esc-af-2024", "esc-ccs-2024", "supplied-medmastery"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-pharm-01",
      stem: "Which P2Y12 inhibitor is an active drug that binds the receptor reversibly and does not need hepatic activation?",
      options: ["Clopidogrel", "Prasugrel", "Ticagrelor", "Aspirin", "Tirofiban"],
      answer: 2,
      explanation:
        "Ticagrelor is a direct-acting, reversible P2Y12 inhibitor. Clopidogrel and prasugrel are tempting because they are also P2Y12 inhibitors, but both are prodrugs that need hepatic activation and bind the receptor irreversibly.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-pharm-02",
      stem: "A 66-year-old with NSTEMI is about to have PCI. He had a transient ischaemic attack two years ago. Which P2Y12 inhibitor is contraindicated?",
      options: ["Clopidogrel", "Ticagrelor", "Prasugrel", "Cangrelor"],
      answer: 2,
      explanation:
        "Prasugrel is contraindicated after stroke or TIA because of excess intracranial bleeding in that group. Ticagrelor is the main alternative for ACS and is not contraindicated by a previous TIA, although bleeding risk should still be weighed.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-pharm-03",
      stem: "Ten minutes after 70 units/kg of UFH during an elective PCI without a GP IIb/IIIa inhibitor, the ACT is 190 seconds. What should you do?",
      options: [
        "Proceed; any ACT over 175 seconds is adequate for PCI",
        "Give more heparin and recheck the ACT before wiring",
        "Give protamine, because the ACT suggests a heparin overdose",
        "Switch to fondaparinux as the sole procedural anticoagulant",
        "Start a GP IIb/IIIa inhibitor instead of giving more heparin",
      ],
      answer: 1,
      explanation:
        "A common PCI target without a GP IIb/IIIa inhibitor is 250–350 seconds, so 190 seconds is subtherapeutic and more heparin is needed before equipment goes into the coronary. Figures of about 175–180 seconds are thresholds for femoral sheath removal (175 seconds in the Medmastery handbook, 180 seconds in Brilakis's manual), not targets for PCI.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-pharm-04",
      stem: "A patient needs heparin reversal after a coronary perforation. Which history most increases the risk of a severe reaction to protamine?",
      options: [
        "Previous use of isophane (protamine-containing) insulin",
        "Penicillin allergy with a documented rash after amoxicillin",
        "Previous radial artery spasm needing intra-arterial verapamil",
        "Treatment with ticagrelor started at the time of the ACS",
        "Type 2 diabetes treated with metformin and dietary advice only",
      ],
      answer: 0,
      explanation:
        "Previous exposure to protamine, as in isophane insulin, can sensitise patients and increases the risk of anaphylactoid reactions; fish allergy and vasectomy are also cited risk factors. Penicillin allergy does not cross-react with protamine.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-pharm-05",
      stem: "Before right radial angiography, a patient mentions he took tadalafil 30 hours ago. How should radial spasm prophylaxis be adjusted?",
      options: [
        "Give the standard verapamil and nitrate cocktail",
        "Double the nitrate dose",
        "Cancel the procedure for 7 days",
        "Omit the nitrate and use verapamil alone",
        "Give intra-arterial adenosine instead",
      ],
      answer: 3,
      explanation:
        "Nitrates should be avoided for 48 hours after tadalafil because of the risk of profound hypotension; verapamil alone can still reduce spasm. The standard cocktail is the tempting option but includes the nitrate. Cancelling for a week is unnecessary.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-pharm-06",
      stem: "A patient has been on a cangrelor infusion during PCI. When should clopidogrel be given?",
      options: [
        "Two hours before stopping the infusion",
        "At or immediately after the end of the infusion",
        "Only the next day",
        "It cannot be used after cangrelor",
        "Halfway through the infusion",
      ],
      answer: 1,
      explanation:
        "Cangrelor occupies the P2Y12 receptor and prevents the active metabolites of clopidogrel and prasugrel from binding, so these drugs are given at or after the end of the infusion. Ticagrelor is different and can be given during the infusion, which is why giving clopidogrel early is a tempting but wrong extrapolation.",
      difficulty: 3,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-pharm-07",
      stem: "What is the main contemporary role of GP IIb/IIIa inhibitors in PCI?",
      options: [
        "Bail-out for large thrombus, no-reflow or thrombotic complications",
        "Routine use in every elective PCI, started before the first balloon",
        "Replacement for heparin as the procedural anticoagulant during PCI",
        "Long-term oral antiplatelet therapy for a year after ACS",
        "Reversal of excessive anticoagulation when the ACT is very high",
      ],
      answer: 0,
      explanation:
        "With potent oral P2Y12 inhibitors, GP IIb/IIIa inhibitors are mainly reserved for bail-out in thrombotic situations. Routine use in all PCI was common in the past but increases bleeding without benefit in most contemporary patients.",
      difficulty: 1,
      refs: ["supplied-medmastery", "esc-acs-2023"],
    },
    {
      id: "fnd-q-pharm-08",
      stem: "In which bradyarrhythmia is atropine least likely to help?",
      options: [
        "Sinus bradycardia during a vagal reaction",
        "Complete heart block with a narrow escape in inferior MI",
        "Complete heart block with a broad escape in anterior MI",
        "Transient sinus slowing after RCA injection",
      ],
      answer: 2,
      explanation:
        "Atropine acts on vagally innervated tissue (the SA and AV nodes); infranodal block in anterior MI is below that level, so atropine is usually ineffective and pacing is needed. Nodal block in inferior MI is the tempting distractor, but it often responds to atropine.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-pharm-09",
      stem: "A patient with NSTE-ACS treated with fondaparinux is going for PCI. What is required in the lab?",
      options: [
        "Nothing further; fondaparinux covers the procedure",
        "Protamine to reverse fondaparinux first",
        "Enoxaparin 1 mg/kg subcutaneously",
        "A GP IIb/IIIa inhibitor in every case",
        "A bolus of unfractionated heparin at the time of PCI",
      ],
      answer: 4,
      explanation:
        "Fondaparinux alone was associated with catheter thrombosis during PCI, so a UFH bolus is given at the procedure. Protamine does not reverse fondaparinux, and reversing anticoagulation before PCI would be the wrong direction in any case.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
  ],
  sims: [
    { sim: "physiology", task: "Run a pressure-wire study with IV adenosine at 140 µg/kg/min. Warn the patient first, then note the expected symptoms and the fall in aortic pressure during hyperaemia." },
  ],
  caseIds: ["fnd-case-contrast-reaction"],
};

// ===========================================================================
// Module 6 — Radiation, contrast and allergy
// ===========================================================================
const safety: Module = {
  id: "fnd-safety",
  title: "Radiation, contrast and allergy",
  stage: 1,
  summary:
    "How X-rays harm patients and staff, which dose numbers matter, how to cut dose in everyday practice, how to protect the kidneys from contrast, and how to recognise and treat anaphylaxis.",
  objectives: [
    "Distinguish deterministic from stochastic radiation effects and match each to the right dose metric.",
    "Interpret fluoroscopy time, reference air kerma and kerma–area product.",
    "Apply time, distance, shielding and geometry to reduce patient and operator dose, including in pregnancy.",
    "List the risk factors for contrast-associated acute kidney injury and the components of the Mehran score.",
    "Plan kidney protection before angiography.",
    "Recognise contrast reactions and manage anaphylaxis according to current UK guidance.",
  ],
  lessons: [
    {
      id: "fnd-safety-rad-principles",
      title: "Radiation effects and how dose is measured",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "X-rays are ionising radiation: they damage DNA directly and through free radicals. The patient receives the primary beam. Staff receive mainly scattered radiation, which comes off the patient, is strongest where the beam enters the body, and falls rapidly with distance.",
        },
        {
          kind: "table",
          head: ["Effect", "Mechanism", "Threshold", "Examples", "Best dose metric"],
          rows: [
            ["Deterministic (tissue reactions)", "Cell killing; severity rises with dose", "Yes: skin effects from about 2 Gy; lens opacities from about 0.5 Gy", "Erythema, hair loss, desquamation, ulceration; cataract", "Peak skin dose, approximated by reference air kerma"],
            ["Stochastic", "DNA damage leading to cancer or heritable change; probability rises with dose, severity does not", "None assumed (linear no-threshold model)", "Malignancy years later", "Effective dose (mSv), estimated from kerma–area product"],
          ],
        },
        {
          kind: "table",
          caption: "Dose quantities shown on the lab console",
          head: ["Metric", "Unit", "What it tells you", "Limitation"],
          rows: [
            ["Fluoroscopy time", "Minutes", "How long fluoroscopy ran", "Ignores cine, frame rate, patient size and angulation; a poor dose surrogate"],
            ["Reference air kerma (cumulative air kerma)", "mGy or Gy", "Air kerma at the interventional reference point, 15 cm from the isocentre towards the tube", "A proxy for skin dose; ignores how the dose was spread across different skin areas"],
            ["Kerma–area product (dose–area product)", "Gy·cm² (or µGy·m²)", "Air kerma multiplied by beam area: the total radiation delivered", "Best proxy for stochastic risk and for operator scatter; does not show where skin dose was concentrated"],
            ["Peak skin dose", "Gy", "Highest dose at any single skin point", "Needs mapping software or estimation"],
            ["Effective dose", "mSv", "Whole-body equivalent risk estimate", "A population measure, not an individual risk"],
          ],
        },
        {
          kind: "p",
          text: "Many labs set trigger levels for patient follow-up. A cumulative reference air kerma of about 5 Gy is a widely used threshold to document the dose, tell the patient and arrange a skin check. Skin injury may only appear weeks after the procedure and is often misdiagnosed, so the patient and their GP need to know what to look for.",
        },
        {
          kind: "p",
          text: "Diagnostic coronary angiography typically delivers an effective dose of a few millisieverts; PCI usually more, and complex PCI considerably more. For context, average annual exposure in the UK from all sources is roughly 2–3 mSv.",
        },
        { kind: "h", text: "Staff dose limits" },
        {
          kind: "table",
          caption: "Annual dose limits for employees in the UK (Ionising Radiations Regulations 2017).",
          head: ["Tissue", "Annual limit"],
          rows: [
            ["Whole body (effective dose)", "20 mSv"],
            ["Lens of the eye", "20 mSv"],
            ["Skin and extremities", "500 mSv"],
            ["Fetus of a pregnant worker (after the employer is informed)", "1 mSv for the remainder of the pregnancy"],
          ],
        },
        { kind: "h", text: "Pregnancy in patients" },
        {
          kind: "p",
          text: "Ask about pregnancy in every patient of childbearing potential, following your trust's procedure. If a pregnant patient needs an essential procedure such as primary PCI, proceed: use radial access, minimise fluoroscopy and cine, collimate tightly and keep the abdomen out of the primary beam. Fetal dose from coronary procedures is low because the abdomen lies outside the beam; most of what reaches the fetus is scatter generated inside the patient, which an external lead apron on the abdomen does little to reduce.",
        },
        {
          kind: "keypoints",
          items: [
            "Deterministic effects have thresholds and track reference air kerma; stochastic effects have no threshold and track kerma–area product.",
            "Fluoroscopy time alone is a poor measure of dose.",
            "A cumulative reference air kerma of about 5 Gy commonly triggers skin follow-up.",
            "UK staff limits: 20 mSv effective, 20 mSv to the lens, 500 mSv to skin and extremities.",
          ],
        },
      ],
      refs: ["radiation-consensus-2018", "supplied-eh-views", "ncrp-168-2010", "icrp-118-2012", "irr-2017", "hse-l121-2018"],
    },
    {
      id: "fnd-safety-rad-practice",
      title: "Radiation protection in practice",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "ALARA (as low as reasonably achievable) is a set of habits rather than a slogan. Most dose reduction comes from small decisions repeated on every run.",
        },
        {
          kind: "steps",
          title: "Everyday habits",
          items: [
            { title: "Justify each run", detail: "Every acquisition should answer a question. Plan your views before you press the pedal." },
            { title: "Time", detail: "Use fluoroscopy only while looking at the screen. Use low pulse rates (many labs use 7.5–15 pulses per second for fluoroscopy), last-image hold, and stored fluoroscopy instead of cine when image quality allows." },
            { title: "Distance", detail: "Dose falls with the square of distance: doubling your distance from the patient cuts your dose to about a quarter. Step back during cine runs whenever possible." },
            { title: "Shielding", detail: "Wear a well-fitting apron and thyroid collar, use lead glasses, keep the ceiling-mounted screen close to the patient and between you and the beam entry point, and use the table skirt." },
            { title: "Geometry", detail: "Keep the detector close to the patient and the tube as far from the patient as practical. Collimate to the area of interest and avoid unnecessary magnification." },
            { title: "Angulation", detail: "Steep angulations lengthen the beam's path through the patient and raise dose. Steep LAO and LAO cranial views put the beam entry side next to the operator and give the highest operator scatter." },
            { title: "Spread the skin dose", detail: "In long procedures, vary the projection so the same patch of skin is not irradiated throughout." },
            { title: "Hands out of the beam", detail: "Your hands should never appear on the image." },
          ],
        },
        {
          kind: "table",
          head: ["Change", "Patient dose", "Operator dose"],
          rows: [
            ["Detector lowered towards the patient", "Lower", "Lower"],
            ["Tighter collimation", "Lower", "Lower (less scatter)"],
            ["Magnification increased", "Higher", "Higher"],
            ["Pulse or frame rate halved", "Roughly halved", "Roughly halved"],
            ["Steep LAO or LAO cranial angulation", "Higher", "Higher (entry side next to the operator)"],
            ["Obese patient", "Higher", "Higher"],
            ["Operator steps back from 50 cm to 100 cm", "No change", "About a quarter"],
          ],
        },
        {
          kind: "p",
          text: "Wear your dosimeters exactly as your radiation protection adviser instructs (commonly one under the apron and one at collar level outside it) and review your results. Eye dosimetry is increasingly used for interventional staff because the lens is radiosensitive and its limit is low.",
        },
        {
          kind: "pearl",
          text: "Scatter is strongest where the beam enters the patient. With the tube under the table, most scatter goes downwards towards your legs, which is why the table skirt matters. In steep LAO, the entry side is beside you, so pull the ceiling screen in and step back for cine.",
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the ceiling screen parked away from the patient.",
            "Using magnification to compensate for poor positioning.",
            "Long cine runs while panning to find the vessel; use fluoroscopy to position first.",
            "Wearing an apron that does not wrap around when you turn to the trolley.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Time, distance, shielding and geometry: apply all four on every case.",
            "Inverse square law: twice the distance, a quarter of the dose.",
            "Collimate, avoid magnification, keep the detector close to the patient.",
            "Steep LAO cranial views give the highest operator dose.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Complete a full left coronary study using the fewest cine runs that answer every anatomical question. Collimate to the heart and avoid magnification.",
        },
      ],
      refs: ["radiation-consensus-2018", "supplied-eh-views"],
    },
    {
      id: "fnd-safety-contrast",
      title: "Contrast media and kidney protection",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Coronary contrast agents are iodinated compounds that absorb X-rays. Agents are classed by osmolality relative to blood: high-osmolar ionic agents are no longer used for intravascular cardiac work; low-osmolar non-ionic agents (such as iohexol, iopamidol and iomeprol) are standard; and iodixanol is iso-osmolar. Expected physiological effects include a feeling of warmth, nausea, transient bradycardia during RCA injection and a volume load.",
        },
        { kind: "h", text: "Contrast-associated acute kidney injury" },
        {
          kind: "p",
          text: "Contrast-associated acute kidney injury (CA-AKI) is usually defined using KDIGO criteria: a rise in creatinine of at least 26.5 µmol/L (0.3 mg/dL) within 48 hours, or to 1.5 times baseline within 7 days. Older studies used a 25% or 44 µmol/L (0.5 mg/dL) rise at 48–72 hours. Creatinine typically peaks a few days after exposure. Most cases recover, but CA-AKI is associated with longer admissions and worse outcomes, and a small minority need dialysis. 'Contrast-associated' acknowledges that hypotension, cholesterol emboli and nephrotoxic drugs often contribute.",
        },
        {
          kind: "table",
          head: ["Patient factors", "Procedural factors"],
          rows: [
            ["Pre-existing chronic kidney disease (the strongest factor)", "Contrast volume"],
            ["Diabetes, especially with CKD", "Repeated contrast exposure within a few days"],
            ["Heart failure or low ejection fraction", "Emergency procedures"],
            ["Hypotension or cardiogenic shock; need for an intra-aortic balloon pump", "Haemodynamic instability during the case"],
            ["Older age, anaemia, volume depletion, nephrotoxic drugs", "Long or complex procedures"],
          ],
        },
        {
          kind: "p",
          text: "The Mehran score, developed in PCI patients, adds points for eight variables: hypotension, intra-aortic balloon pump, congestive heart failure, age over 75, anaemia, diabetes, contrast volume and renal function (creatinine or eGFR). The total places the patient in one of four risk categories for CA-AKI and dialysis. Scoring the risk before the procedure supports an informed consent discussion and a prevention plan.",
        },
        {
          kind: "steps",
          title: "Kidney protection plan",
          items: [
            { title: "Identify risk", detail: "Check a recent eGFR in every patient and score risk in those with CKD or other risk factors." },
            { title: "Review medicines", detail: "Consider withholding NSAIDs, diuretics and metformin around the procedure according to local policy." },
            { title: "Hydrate appropriately", detail: "In moderate to severe CKD, give IV isotonic saline before and after the procedure. One ESC-endorsed regimen is 1 mL/kg/h for 12 hours before and 24 hours after (0.5 mL/kg/h if the ejection fraction is 35% or less or there is significant heart failure). LVEDP-guided rates are an alternative." },
            { title: "Minimise contrast", detail: "Set a contrast budget relative to renal function, plan views, avoid ventriculography when echocardiography is available, use small test injections and consider intravascular imaging to guide PCI." },
            { title: "Choose the agent", detail: "Use a low- or iso-osmolar agent." },
            { title: "Space exposures", detail: "Avoid repeat contrast within a few days where possible; stage elective procedures." },
            { title: "Follow up", detail: "Recheck creatinine at 48–72 hours in high-risk patients." },
          ],
        },
        {
          kind: "p",
          text: "Neither N-acetylcysteine nor sodium bicarbonate has shown benefit over saline in large randomised testing, and neither is recommended for this purpose.",
        },
        {
          kind: "pearl",
          text: "In STEMI and very-high-risk ACS, renal function should not delay reperfusion. Protect the kidneys by minimising contrast and supporting the circulation, not by postponing the procedure.",
        },
        {
          kind: "pitfalls",
          items: [
            "Running a fixed high-rate saline infusion in a patient with a high LVEDP or heart failure.",
            "Performing a routine ventriculogram in a patient with CKD who has had a recent echocardiogram.",
            "Not rechecking renal function before discharge after a large contrast load in a high-risk patient.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "CKD is the strongest risk factor for CA-AKI.",
            "Mehran score variables: hypotension, IABP, heart failure, age over 75, anaemia, diabetes, contrast volume, renal function.",
            "Isotonic saline hydration and contrast minimisation are the effective measures.",
          ],
        },
      ],
      refs: ["mehran-cin-2004", "esc-revasc-2018", "supplied-medmastery", "supplied-oxford", "kdigo-aki-2012", "preserve-2018"],
    },
    {
      id: "fnd-safety-allergy",
      title: "Contrast reactions and anaphylaxis",
      minutes: 9,
      blocks: [
        {
          kind: "table",
          caption: "Immediate reactions to contrast",
          head: ["Severity", "Features", "Usual management"],
          rows: [
            ["Mild", "Limited urticaria, itch, nasal congestion, sneezing", "Observe; oral or IV non-sedating antihistamine if troublesome"],
            ["Moderate", "Widespread urticaria, facial swelling without airway compromise, bronchospasm without hypoxia", "Treat promptly; bronchodilator; low threshold for adrenaline"],
            ["Severe (anaphylaxis)", "Airway swelling, bronchospasm with hypoxia, hypotension or shock, cardiac arrest", "Adrenaline and resuscitation (see steps)"],
          ],
        },
        {
          kind: "p",
          text: "Delayed reactions, usually a rash appearing hours to days later, are also recognised. Not every adverse event is allergic: warmth, nausea and vagal reactions are physiological. In the lab, a vagal reaction typically gives bradycardia with hypotension, whereas anaphylaxis usually gives tachycardia, hypotension and skin or airway signs. Other triggers in the lab include chlorhexidine, latex, antibiotics and protamine.",
        },
        {
          kind: "steps",
          title: "Managing anaphylaxis in the lab (Resuscitation Council UK, 2021)",
          items: [
            { title: "Stop and call", detail: "Stop contrast and any other suspected trigger. Call for help, including an anaesthetist." },
            { title: "Position", detail: "Lie the patient flat with legs raised; allow sitting up if breathing is the main problem and blood pressure allows." },
            { title: "Adrenaline", detail: "Give IM adrenaline 0.5 mg (0.5 mL of 1 mg/mL) into the anterolateral thigh and repeat after 5 minutes if there is no improvement. In a monitored lab, IV adrenaline in small titrated boluses or by infusion is given only by clinicians experienced in its use." },
            { title: "Oxygen", detail: "High-flow oxygen." },
            { title: "Fluids", detail: "Rapid IV crystalloid bolus (500–1,000 mL in adults), repeated as needed." },
            { title: "Refractory anaphylaxis", detail: "If there is no improvement after two doses of IM adrenaline, start an adrenaline infusion with expert critical care support." },
            { title: "After stabilisation", detail: "Non-sedating antihistamine for skin symptoms. Corticosteroids are no longer recommended routinely in the initial treatment." },
            { title: "Mast cell tryptase", detail: "Take a sample as soon as resuscitation allows, a second at about 1–2 hours (no later than 4 hours), and a third at 24 hours or later (or at follow-up)." },
            { title: "Document and refer", detail: "Record the agent and reaction in the notes and alert system, inform the patient and GP, and refer to an allergy service." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Giving 1 mg IV adrenaline (the cardiac arrest dose) to a patient who has a pulse.",
            "Treating hypotension and wheeze with antihistamine and steroid alone.",
            "Missing chlorhexidine or latex as the trigger and re-exposing the patient next time.",
            "Recording 'iodine allergy' instead of the specific agent and reaction.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "IM adrenaline 0.5 mg is the first-line treatment for anaphylaxis in adults; repeat after 5 minutes.",
            "Fluids and oxygen support adrenaline; antihistamines and steroids are not first-line.",
            "Three timed tryptase samples support the diagnosis.",
            "Bradycardia suggests a vagal reaction; tachycardia with skin or airway signs suggests anaphylaxis.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "rcuk-anaphylaxis-2021"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-safety-01",
      stem: "Which displayed dose quantity is the best surrogate for a patient's stochastic (cancer) risk from a procedure?",
      options: ["Fluoroscopy time", "Reference air kerma", "Number of cine runs", "Kerma–area product", "Peak tube voltage"],
      answer: 3,
      explanation:
        "Kerma–area product reflects the total radiation delivered into the patient and is used to estimate effective dose, the measure of stochastic risk. Fluoroscopy time is tempting because it is easy to read, but it ignores cine, frame rate, patient size and field size.",
      difficulty: 2,
      refs: ["radiation-consensus-2018"],
    },
    {
      id: "fnd-q-safety-02",
      stem: "After a long CTO procedure the cumulative reference air kerma is 6.2 Gy. What is the main concern and the appropriate action?",
      options: [
        "Stochastic cancer risk; no specific action is needed after the case",
        "Skin injury: document the dose, inform the patient, arrange follow-up",
        "Cataract in the patient; arrange ophthalmology review for tomorrow morning",
        "Contrast nephropathy from the long case; recheck creatinine at 48 hours",
        "Operator dose; stop the operator working in the lab for a month",
      ],
      answer: 1,
      explanation:
        "Reference air kerma approximates skin dose, the driver of deterministic skin injury, and values around 5 Gy commonly trigger documentation, patient information and follow-up. Cancer risk is better tracked by kerma–area product and cannot be addressed by follow-up of this kind.",
      difficulty: 2,
      refs: ["radiation-consensus-2018", "ncrp-168-2010"],
    },
    {
      id: "fnd-q-safety-03",
      stem: "Which change in projection is likely to increase the operator's scatter dose the most?",
      options: [
        "Moving from LAO 45° cranial 25° to RAO 30° caudal 20°",
        "Moving from RAO 30° caudal 20° to LAO 50° cranial 25°",
        "Lowering the detector towards the patient",
        "Tightening collimation",
        "Halving the fluoroscopy pulse rate",
      ],
      answer: 1,
      explanation:
        "Steep LAO cranial angulation lengthens the beam path and puts the beam entry side, where scatter is greatest, next to the operator. Moving from LAO cranial to RAO caudal is the reverse move and would reduce operator dose; the remaining options all reduce dose.",
      difficulty: 2,
      refs: ["supplied-eh-views", "radiation-consensus-2018"],
    },
    {
      id: "fnd-q-safety-04",
      stem: "You step back from 50 cm to 100 cm from the scattering patient. Approximately how much does your dose rate change?",
      options: ["It falls to about a quarter", "It halves", "It falls to about a tenth", "No change", "It doubles"],
      answer: 0,
      explanation:
        "By the inverse square law, doubling the distance reduces dose rate to about one quarter. Halving is the intuitive but wrong answer because dose spreads over an area that grows with the square of distance.",
      difficulty: 1,
      refs: ["radiation-consensus-2018"],
    },
    {
      id: "fnd-q-safety-05",
      stem: "A patient booked for angiography reports a shellfish allergy. No previous contrast exposure is recorded. What is the appropriate approach?",
      options: [
        "Cancel and arrange CT coronary angiography, which avoids the risk",
        "Give a 13-hour steroid and antihistamine premedication regimen first",
        "Proceed normally: shellfish allergy does not predict contrast reactions",
        "Use gadolinium instead of iodinated contrast for the coronary injections",
        "Perform skin-prick testing with contrast before booking the procedure",
      ],
      answer: 2,
      explanation:
        "Shellfish allergy is caused by protein allergens, not iodine, and does not meaningfully predict reactions to iodinated contrast. Premedicating on that basis alone is the tempting but unnecessary option; CT angiography uses the same class of contrast and solves nothing.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-safety-06",
      stem: "What is the strongest single patient risk factor for contrast-associated acute kidney injury?",
      options: [
        "Pre-existing chronic kidney disease",
        "Male sex, independent of renal function",
        "Long-standing treated hypertension",
        "Previous CABG with vein grafts in place",
        "Radial rather than femoral access",
      ],
      answer: 0,
      explanation:
        "Reduced baseline renal function is the dominant risk factor, and it carries the most weight in risk scores such as the Mehran score. Diabetes and heart failure add risk mainly on top of CKD; hypertension and previous CABG are weaker or indirect factors.",
      difficulty: 1,
      refs: ["mehran-cin-2004"],
    },
    {
      id: "fnd-q-safety-07",
      stem: "Two minutes after contrast injection a patient develops widespread urticaria, wheeze and BP 70/40 mmHg with HR 125/min. What is the first drug to give?",
      options: [
        "IV chlorphenamine",
        "IV hydrocortisone",
        "IM adrenaline 0.5 mg",
        "IV atropine 0.5 mg",
        "IV adrenaline 1 mg bolus",
      ],
      answer: 2,
      explanation:
        "This is anaphylaxis, and IM adrenaline 0.5 mg is the first-line treatment, repeated after 5 minutes if needed. Antihistamines and steroids are tempting but do not treat shock or bronchospasm quickly; a 1 mg IV bolus is the arrest dose and is dangerous in a patient with a pulse.",
      difficulty: 1,
      refs: ["supplied-medmastery", "rcuk-anaphylaxis-2021"],
    },
    {
      id: "fnd-q-safety-08",
      stem: "A patient with eGFR 28 mL/min/1.73 m² and an LVEDP of 26 mmHg needs PCI. How should IV hydration be managed?",
      options: [
        "A fixed 1 mL/kg/h saline infusion for 24 hours, whatever the filling pressure",
        "No fluid at all, because the raised LVEDP shows established heart failure",
        "A reduced or LVEDP-guided rate, close monitoring and minimal contrast",
        "Sodium bicarbonate infusion instead of saline, which protects the kidney better",
        "Oral N-acetylcysteine alone, so that no intravenous volume load is given",
      ],
      answer: 2,
      explanation:
        "This patient is at high risk of both kidney injury and pulmonary oedema, so hydration must be tailored, for example a reduced rate or one guided by LVEDP, with strict contrast limits. A fixed full-rate infusion is the tempting protocol answer but risks overload; bicarbonate and N-acetylcysteine have not outperformed saline.",
      difficulty: 3,
      refs: ["esc-revasc-2018", "mehran-cin-2004", "preserve-2018"],
    },
    {
      id: "fnd-q-safety-09",
      stem: "What is the annual dose limit for the lens of the eye for radiation workers in the UK?",
      options: ["150 mSv", "50 mSv", "6 mSv", "20 mSv", "1 mSv"],
      answer: 3,
      explanation:
        "The Ionising Radiations Regulations 2017 set the lens limit at 20 mSv per year, reduced from the previous 150 mSv after evidence that cataract occurs at lower doses. 150 mSv is the outdated figure and a common error.",
      difficulty: 2,
      refs: ["radiation-consensus-2018", "icrp-118-2012", "irr-2017", "hse-l121-2018"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Repeat a standard diagnostic study and aim to reduce the total cine runs by a third without losing any diagnostic information." },
  ],
  caseIds: ["fnd-case-contrast-reaction"],
};

// ===========================================================================
// Module 7 — The cath lab: team, room, sterility, consent, day one
// ===========================================================================
const lab: Module = {
  id: "fnd-lab",
  title: "Working in the cath lab",
  stage: 1,
  summary:
    "Who does what in the lab, what the equipment is for, how to scrub and keep the field safe, how to take consent and run the safety checklist, and how to make yourself useful from your first day.",
  objectives: [
    "Describe the roles of each team member and communicate with them using closed-loop language.",
    "Name the main items of lab equipment and their purpose, including the transducer and manifold.",
    "Scrub, gown, glove and maintain a sterile field, and follow the routines that prevent air and thrombus embolism.",
    "Obtain valid consent under UK law and professional guidance, including in emergencies.",
    "Run the sign-in, time-out and sign-out checks.",
    "Prepare a patient for angiography and write a structured report.",
  ],
  lessons: [
    {
      id: "fnd-lab-team-room",
      title: "The team and the room",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "A cath lab procedure is a team activity. Each member watches something different, and the most common contribution a new fellow can make is to listen, speak clearly and act on warnings from others.",
        },
        {
          kind: "table",
          head: ["Role", "Main responsibilities", "What they need from you"],
          rows: [
            ["Operator(s)", "Decisions, access, catheter and wire work, interpretation; leads the time-out", "Clear plans shared before the case"],
            ["Scrub nurse or practitioner", "Sterile field, preparing and passing equipment, assisting at the table", "Early equipment requests with size, length and shape"],
            ["Circulating nurse", "Patient care and comfort, drugs, fetching equipment, documentation", "Drug orders with name, dose and route, and confirmation when given"],
            ["Cardiac physiologist", "ECG and pressure monitoring, transducer zeroing, recording system, measurements, IVUS and pressure-wire consoles, temporary pacing box", "Attention when they call out a rhythm or pressure change"],
            ["Radiographer", "C-arm and table, image quality, dose monitoring, radiation protection, image archiving", "Notice of the next view and of panning needs"],
            ["Others on call", "Anaesthetist, operating department practitioner, perfusionist, imaging specialists", "Early warning when a case is becoming unstable"],
          ],
        },
        {
          kind: "p",
          text: "Use closed-loop communication for every drug and critical action. 'Heparin 7,000 units IV, please' is answered by 'Heparin 7,000 units IV given'. Anyone in the room should feel able to stop the procedure if they see a safety problem, and you should thank them when they do.",
        },
        { kind: "h", text: "The room" },
        {
          kind: "table",
          head: ["Equipment", "Purpose", "Your first-week task"],
          rows: [
            ["C-arm", "X-ray tube beneath the table and flat-panel detector above; rotates about the isocentre for LAO, RAO, cranial and caudal views", "Learn the controls and how to place the heart at the isocentre"],
            ["Table", "Floating top moves the patient under the beam", "Learn to pan smoothly with fluoroscopy, not cine"],
            ["Monitors", "Live image, reference (roadmap) image, haemodynamics, IVUS and physiology", "Know which screen shows what"],
            ["Recording system", "ECG, pressure waveforms, event log, measurements, report", "Learn how events are logged"],
            ["Pressure transducers", "Convert pressure to an electrical signal", "Watch them zeroed to air and levelled at mid-chest"],
            ["Manifold", "Connects the catheter to pressure, contrast and flush lines", "Set one up, de-air it and inject safely"],
            ["Contrast delivery", "Hand syringe on the manifold or an automated injector (set volume, rate and pressure limit)", "Learn the injector's settings for each vessel"],
            ["Defibrillator and crash trolley", "Resuscitation", "Find them, check them and know how to attach pads"],
            ["Emergency kit", "Pericardiocentesis set, temporary pacing wire and box, covered stents, snares, mechanical support", "Know where each item is kept"],
            ["Radiation protection", "Aprons, ceiling screen, table skirt", "Position the screen before you start"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Know every team member's name and role before the first case.",
            "Closed-loop communication for every drug and critical step.",
            "The physiologist's warning about a pressure or rhythm change is a reason to stop and look.",
            "Know where the defibrillator, pericardiocentesis set and pacing kit are.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Before your first injection in the simulator, name the function of every screen and control you can see.",
        },
      ],
      refs: ["supplied-medmastery", "eapci-curriculum"],
    },
    {
      id: "fnd-lab-sterile",
      title: "Scrubbing, the sterile field and safe handling",
      minutes: 9,
      blocks: [
        {
          kind: "steps",
          title: "Scrubbing, gowning and gloving",
          items: [
            { title: "Prepare", detail: "Remove jewellery and watches, put on a hat and mask as your lab requires, and position your lead and thyroid collar before scrubbing." },
            { title: "Surgical hand antisepsis", detail: "Use the scrub solution or alcohol hand rub technique your trust specifies, covering hands and forearms systematically." },
            { title: "Dry and gown", detail: "Dry with a sterile towel, put on the gown without touching its outer surface and have an assistant tie it." },
            { title: "Glove", detail: "Use closed gloving so bare hands never touch the outside of the gloves. Many operators double-glove." },
            { title: "Stay sterile", detail: "Keep your hands above waist level and in front of you. Anything below the table edge, and the outside of the C-arm unless draped, is not sterile." },
          ],
        },
        {
          kind: "steps",
          title: "Preparing the patient",
          items: [
            { title: "Skin preparation", detail: "Clip hair if needed (do not shave). Apply chlorhexidine in alcohol to both planned access sites and allow it to dry completely; do not let it pool under the patient." },
            { title: "Draping", detail: "Drape to expose the planned access sites, plus an alternative site if the case may need it." },
            { title: "Table set-up", detail: "Flush catheters with heparinised saline, wet hydrophilic wires, keep wires coiled in their hoops on the table and never let a wire end drop over the edge." },
          ],
        },
        { kind: "h", text: "Air and clot: the invisible hazards" },
        {
          kind: "p",
          text: "Air and thrombus injected into a coronary or carotid artery cause infarction or stroke. Preventing them depends on routine, performed every time a wire comes out of a catheter.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "After removing the wire, let the catheter back-bleed or aspirate until free-flowing blood returns.",
            "Discard the aspirated blood, then flush with saline.",
            "Check the manifold and syringe for bubbles; hold the syringe tip-down so any bubble rises away from the tip.",
            "Confirm a normal pressure trace before injecting.",
            "Use a small test injection before a full cine run.",
          ],
        },
        {
          kind: "p",
          text: "If you cannot aspirate blood, the tip may be against the vessel wall or deeply wedged in an artery. Do not flush or inject. Withdraw slightly and try again; if blood still will not come back, remove the catheter and flush it outside the body.",
        },
        {
          kind: "pearl",
          text: "Before every injection, look in three places: the syringe, the manifold and the pressure trace.",
        },
        {
          kind: "pitfalls",
          items: [
            "Touching the non-sterile control panel or detector with a gloved hand and carrying on.",
            "Letting a hydrophilic wire dry on the table, so it becomes sticky and loses its coating properties.",
            "Flushing a catheter that will not aspirate.",
            "Allowing chlorhexidine to pool beneath the patient, which can cause skin injury.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Aspirate, discard, flush, check the trace, then inject.",
            "No backflow means no injection.",
            "Wires stay wet, coiled and on the table.",
          ],
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery"],
    },
    {
      id: "fnd-lab-consent-checklist",
      title: "Consent and the safety checklist",
      minutes: 11,
      blocks: [
        { kind: "h", text: "Consent in UK practice" },
        {
          kind: "p",
          text: "Valid consent must be informed, given voluntarily and given by a person with capacity. Since the Montgomery judgment (2015), UK law requires doctors to tell patients about material risks: those a reasonable person in the patient's position would consider significant, and those the doctor knows or should know this particular patient would consider significant. GMC guidance on decision making and consent (2020) frames consent as a dialogue about options, including doing nothing.",
        },
        {
          kind: "list",
          items: [
            "The person taking consent should be able to perform the procedure or be trained to consent for it.",
            "Give information in a form the patient understands, verbally and in writing, with time to think and ask questions.",
            "In England and Wales, capacity under the Mental Capacity Act 2005 means the person can understand the information, retain it, use or weigh it, and communicate a decision.",
            "Consent can be withdrawn at any time, including on the table.",
            "The operator should confirm consent with the patient before starting and check for new questions or concerns.",
            "If the patient is unsure, defer, discuss and document.",
          ],
        },
        {
          kind: "table",
          caption: "Topics for the consent discussion. Quote your own unit's audited complication rates where available.",
          head: ["Topic", "Diagnostic angiography", "PCI (in addition)"],
          rows: [
            ["Common and minor", "Bruising or haematoma, access-site discomfort, radial artery spasm or occlusion", "As for diagnostic angiography"],
            ["Contrast", "Allergic reactions; kidney injury, individualised by risk scoring", "Higher contrast volumes"],
            ["Serious but rare", "Death, stroke, myocardial infarction, emergency surgery and serious vascular injury, each rare in elective diagnostic studies", "More frequent than with diagnostic angiography: periprocedural MI, coronary dissection or perforation, emergency CABG, bleeding on dual antiplatelet therapy"],
            ["Later issues", "None specific", "Stent thrombosis, restenosis, need for adherence to antiplatelet therapy"],
            ["Radiation", "A small additional lifetime cancer risk; skin injury only with very high doses", "Longer procedures mean higher doses"],
            ["Alternatives", "CT coronary angiography, functional testing, medical therapy", "Medical therapy, bypass surgery"],
          ],
        },
        {
          kind: "p",
          text: "In primary PCI the patient is often in pain, frightened and has received opioids. A brief explanation of what is proposed and why, with the main risks, and verbal agreement is usually all that is possible and is appropriate; document it. If a patient lacks capacity, act in their best interests and record your reasoning.",
        },
        { kind: "h", text: "The safety checklist" },
        {
          kind: "p",
          text: "UK labs use local safety standards for invasive procedures (LocSSIPs) built on the national standards (NatSSIPs), adapted from the WHO surgical safety checklist. The checklist works only if the whole team stops and takes part.",
        },
        {
          kind: "table",
          head: ["Phase", "Key checks"],
          rows: [
            ["Sign in (on arrival, before sedation)", "Identity with two identifiers; procedure; consent present and current; allergies (contrast, latex, chlorhexidine, drugs); anticoagulant and antiplatelet status; blood results (haemoglobin, platelets, creatinine and eGFR, potassium, INR if relevant); pregnancy status; diabetes and fasting plan; IV access; planned access site and pulses; previous procedures and bypass graft details"],
            ["Time out (before the first puncture)", "Whole team present and introduced; patient, procedure and access route confirmed; anticipated critical steps; equipment and devices available; antithrombotic plan; contrast and radiation considerations; defibrillator pads in high-risk cases"],
            ["Sign out (before the patient leaves)", "Procedure and findings recorded; implanted devices and lot numbers recorded; sharps, wire and swab count correct; haemostasis plan; antiplatelet and anticoagulant plan; monitoring and escalation plan handed over"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Consent taken by someone who could not answer the patient's questions about the procedure.",
            "Relying on a consent form signed weeks ago when the clinical picture has changed.",
            "Running the time-out while half the team is busy elsewhere.",
            "Skipping the sign-out, so the ward never learns the antiplatelet plan.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Material risks are those this patient, or a reasonable person in their position, would want to know.",
            "Capacity: understand, retain, use or weigh, communicate.",
            "Emergency consent is brief but still informed; document it.",
            "Sign in, time out and sign out, with the whole team.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "mehran-cin-2004", "gmc-consent-2020", "montgomery-2015", "natssips2-2023"],
    },
    {
      id: "fnd-lab-day-one",
      title: "Your first days in the lab",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "In your first weeks you will not be expected to run cases, but you will be expected to prepare patients properly, keep the field safe, notice problems and write a good report. Doing these well earns you hands-on time.",
        },
        {
          kind: "steps",
          title: "Before the list",
          items: [
            { title: "Read the referral", detail: "What is the question? Is the indication sound (see the pathways module)?" },
            { title: "Review the data", detail: "ECG, echocardiogram, stress test or CT, previous angiograms and, after CABG, the operation note with the graft list." },
            { title: "Check bloods and medicines", detail: "Haemoglobin, platelets, creatinine and eGFR, potassium, INR if on warfarin; antiplatelets, anticoagulants, metformin, PDE5 inhibitors, insulin." },
            { title: "Allergies", detail: "Contrast, latex, chlorhexidine, drugs; establish what actually happened." },
            { title: "Examine the access", detail: "Radial pulses on both sides, femoral pulses, previous access problems, any arteriovenous fistula." },
            { title: "Agree the plan", detail: "Access route, catheters and views with your supervisor; flag high-risk features early." },
          ],
        },
        {
          kind: "steps",
          title: "In the room",
          items: [
            { title: "Introduce yourself", detail: "Learn names and roles; tell the team what you will be doing." },
            { title: "Locate the safety kit", detail: "Defibrillator, crash trolley, pericardiocentesis set, pacing box, snares and covered stents." },
            { title: "Learn the manifold", detail: "Set it up, de-air it, and practise aspirate, flush and inject." },
            { title: "Watch the pressure trace", detail: "Call out damping or ventricularisation every time you see it." },
            { title: "Protect yourself", detail: "Apron, collar, glasses, screen position and distance." },
          ],
        },
        {
          kind: "steps",
          title: "After the case",
          items: [
            { title: "Haemostasis", detail: "Apply the radial band or femoral closure per protocol and check distal perfusion." },
            { title: "Report", detail: "Indication, access, catheters, dominance, findings by vessel and segment, LV function or LVEDP, contrast volume, radiation dose metrics, complications, conclusion and plan." },
            { title: "Hand over", detail: "Antiplatelet and anticoagulant plan, observations, access-site checks, follow-up and who to call." },
          ],
        },
        {
          kind: "table",
          caption: "Example structure for a diagnostic angiography report",
          head: ["Section", "Content"],
          rows: [
            ["Indication", "Clinical question and presentation"],
            ["Procedure", "Access site and sheath size, catheters, drugs given, contrast volume, dose metrics"],
            ["Haemodynamics", "Aortic pressure, LVEDP"],
            ["Anatomy", "Dominance; left main, LAD, circumflex, RCA and grafts, each with segment, severity, length and character of lesions"],
            ["LV assessment", "Ventriculography or reference to echocardiography"],
            ["Complications", "None, or a factual description"],
            ["Conclusion and plan", "Diagnosis, recommended management and who will act on it"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Arriving in the lab without knowing the indication, the creatinine or the anticoagulant status.",
            "Missing a bypass operation note, then searching blindly for grafts.",
            "Staying silent when you see something wrong because you are new. Say what you see.",
            "Writing a report that lists percentages without segments, dominance or a plan.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep a personal log from the first day: procedure, your role, access, complications and what you learned. It feeds your training portfolio and shows you, and your supervisors, when you are ready for the next step.",
        },
        {
          kind: "keypoints",
          items: [
            "Prepare the patient as if you were the operator.",
            "Know where the emergency kit is before you need it.",
            "Never inject on a damped trace or without backflow.",
            "A clear report and handover are part of the procedure.",
          ],
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Complete the full sequence from radial puncture to engaging both coronaries, saying each safety check aloud: aspirate, flush, pressure trace, test injection.",
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-lab-01",
      stem: "Which team member is usually responsible for zeroing the pressure transducers and alerting the operator to changes in the pressure waveform?",
      options: ["Radiographer", "Scrub nurse", "Cardiac physiologist", "Circulating nurse", "Anaesthetist"],
      answer: 2,
      explanation:
        "In UK labs the cardiac physiologist runs the haemodynamic recording system, zeroes the transducers and watches the ECG and pressures. The radiographer is a tempting answer as another technical role, but their focus is the imaging chain and radiation protection.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-lab-02",
      stem: "At what level should a fluid-filled pressure transducer be placed for accurate intracardiac pressures in a supine patient?",
      options: [
        "At the level of the sternal angle",
        "At mid-chest level, roughly the level of the atria",
        "At the level of the access site",
        "At the top of the drip stand",
        "At the level of the operator's waist",
      ],
      answer: 1,
      explanation:
        "The transducer is levelled at mid-chest (the phlebostatic level, roughly the atria) so that hydrostatic error is minimised. The sternal angle is tempting but sits several centimetres above the atria, so it would systematically underestimate pressures.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "fnd-q-lab-03",
      stem: "Under the Mental Capacity Act 2005, which set of abilities defines capacity to make a decision?",
      options: [
        "Understands, retains, uses or weighs the information, and communicates a choice",
        "Orientated to time, place and person, with normal attention and conversation",
        "Agrees with the medical recommendation after the options have been explained",
        "Scores above the threshold on a validated bedside cognitive screening test",
        "Has a close relative present who confirms that the decision is in keeping with their character",
      ],
      answer: 0,
      explanation:
        "Capacity is decision-specific and rests on these four functional abilities. Orientation is often used as a shortcut, but a person can be disorientated and still have capacity for a specific decision, or orientated and lack it.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-lab-04",
      stem: "Following the Montgomery judgment, which risks must a doctor disclose when obtaining consent in the UK?",
      options: [
        "Only risks that occur in more than 1% of procedures of this type",
        "Risks that a responsible body of medical opinion would normally disclose to a patient like this",
        "Risks a reasonable person in the patient's position, or this patient, would find significant",
        "Only the risk of death, because lesser complications are expected and accepted",
        "Whatever is printed on the standard consent form for the procedure being done",
      ],
      answer: 2,
      explanation:
        "Montgomery replaced the doctor-centred standard with a patient-centred test of materiality. The 'responsible body of doctors' option is the older Bolam-based approach, no longer the test for disclosure of risks.",
      difficulty: 2,
      refs: ["supplied-medmastery", "montgomery-2015"],
    },
    {
      id: "fnd-q-lab-05",
      stem: "After removing the J-wire from a diagnostic catheter in the aortic root, you cannot aspirate any blood. What should you do?",
      options: [
        "Flush firmly with saline to clear whatever is blocking the catheter lumen",
        "Inject a small test dose of contrast to see exactly where the tip now lies in the root",
        "Do not flush or inject; withdraw and re-aspirate, or flush it outside the body",
        "Advance the catheter further into the root and inject once it moves freely",
        "Connect the pressure line and inject through the manifold to confirm position",
      ],
      answer: 2,
      explanation:
        "Failure to aspirate means the tip may be against the wall or the catheter contains air or clot; flushing or injecting could cause air embolism or dissection. Flushing firmly is the instinctive response and exactly the wrong one.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
    {
      id: "fnd-q-lab-06",
      stem: "When should the procedural time-out take place?",
      options: [
        "When the patient is booked, so that equipment can be ordered",
        "After the diagnostic images are acquired and before any PCI starts",
        "At the end of the procedure, before the patient leaves the room",
        "Before the first arterial puncture, with the whole team present",
        "Only for PCI and structural cases, not for diagnostic angiograms",
      ],
      answer: 3,
      explanation:
        "The time-out is the final team check immediately before the procedure starts, so the access route, plan, equipment and critical steps can still be changed. Checks at the end form the sign-out, which serves a different purpose.",
      difficulty: 1,
      refs: ["supplied-medmastery", "natssips2-2023"],
    },
    {
      id: "fnd-q-lab-07",
      stem: "A patient with an anterior STEMI is in severe pain and has received IV morphine. What is the appropriate approach to consent for primary PCI?",
      options: [
        "Delay until the opioid has worn off so that full written consent can be taken",
        "Proceed without any explanation, because it is an emergency and time matters",
        "Briefly explain the procedure and main risks, get verbal agreement, document it",
        "Obtain consent from the next of kin by telephone before starting the procedure",
        "Ask the patient to sign the standard elective consent form despite the morphine",
      ],
      answer: 2,
      explanation:
        "In time-critical procedures, a brief informed discussion with verbal agreement is appropriate and should be documented. Delaying for full written consent costs myocardium, while proceeding with no explanation ignores the patient's right to be informed when they are able to engage.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "fnd-q-lab-08",
      stem: "On engaging the RCA, the aortic pressure trace becomes damped. What is the correct action?",
      options: [
        "Inject contrast quickly to see what is happening at the tip",
        "Flush the catheter forcefully to clear any clot from the lumen",
        "Advance the catheter deeper into the vessel for more stability",
        "Ask the patient to take a deep breath and then inject as usual, filming throughout",
        "Do not inject; reposition the catheter until the trace normalises",
      ],
      answer: 4,
      explanation:
        "A damped trace means the tip is obstructing flow, wedged against the wall or in a small branch such as the conus; injecting can cause dissection or VF. Injecting to 'see what is happening' is the tempting and dangerous response.",
      difficulty: 1,
      refs: ["supplied-oxford", "supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Run the full radial access sequence twice, narrating the aspirate–flush–trace–test-injection routine at every catheter exchange." },
    { sim: "cathlab", task: "Practise asking the radiographer for each standard view by name and angle before you acquire it." },
  ],
};

// ===========================================================================
// Module 8 — Pathways: who needs angiography, and when
// ===========================================================================
const pathways: Module = {
  id: "fnd-pathways",
  title: "Pathways: who needs angiography, and when",
  stage: 2,
  summary:
    "The ACS spectrum and the STEMI reperfusion pathway, timing of invasive angiography in NSTE-ACS, the investigation of chronic coronary syndromes, and situations in which angiography is not indicated.",
  objectives: [
    "Describe the ACS spectrum and the working-diagnosis approach of the 2023 ESC guideline.",
    "Apply STEMI reperfusion time targets and choose between primary PCI and fibrinolysis.",
    "Assign NSTE-ACS patients to immediate, early or selective invasive strategies.",
    "Outline the 2024 ESC approach to suspected chronic coronary syndrome, including when invasive angiography is first-line.",
    "Recognise situations in which angiography is not indicated or should be deferred.",
  ],
  lessons: [
    {
      id: "fnd-path-stemi",
      title: "The ACS spectrum and the STEMI pathway",
      minutes: 12,
      blocks: [
        {
          kind: "p",
          text: "The 2023 ESC guideline treats acute coronary syndromes as a spectrum. Patients first receive a working diagnosis based on the ECG: ST-elevation ACS or non-ST-elevation ACS. The final diagnosis (STEMI, NSTEMI or unstable angina) follows troponin results and angiography.",
        },
        {
          kind: "table",
          head: ["Entity", "ECG", "Troponin", "Pathway"],
          rows: [
            ["STEMI", "Persistent ST elevation or an equivalent pattern", "Rises, often not yet at presentation", "Immediate reperfusion"],
            ["NSTEMI", "No persistent ST elevation; may show ST depression, T inversion or be normal", "Raised with a rise or fall", "Risk-stratified invasive strategy"],
            ["Unstable angina", "No persistent ST elevation", "Not raised", "Risk-based; less common since high-sensitivity assays"],
          ],
        },
        { kind: "h", text: "STEMI reperfusion" },
        {
          kind: "steps",
          title: "From first medical contact to an open artery",
          items: [
            { title: "Diagnose", detail: "Record and interpret the ECG within 10 minutes of first medical contact. The STEMI diagnosis starts the clock." },
            { title: "Choose the strategy", detail: "Primary PCI is preferred if the expected time from diagnosis to PCI-mediated reperfusion (wire crossing) is 120 minutes or less. If not, give fibrinolysis within 10 minutes of diagnosis, provided there is no contraindication, and transfer to a PCI centre." },
            { title: "Meet the targets", detail: "ESC targets are 60 minutes or less from diagnosis to wire crossing for patients presenting to a PCI centre, and 90 minutes or less for patients transferred from elsewhere." },
            { title: "After fibrinolysis", detail: "Assess at 60–90 minutes. Failed reperfusion (less than 50% ST-segment resolution, ongoing pain or instability) needs rescue PCI. After successful lysis, angiography follows within 2–24 hours." },
            { title: "In the lab", detail: "Radial access by default; treat the culprit; manage thrombus; plan complete revascularisation of other significant lesions in stable patients." },
          ],
        },
        {
          kind: "table",
          caption: "Primary PCI by time from symptom onset (ESC 2023, summarised)",
          head: ["Time from onset", "Situation", "Recommendation"],
          rows: [
            ["Under 12 hours", "Persistent ST elevation or equivalent", "Primary PCI"],
            ["Over 12 hours", "Ongoing symptoms, haemodynamic instability or life-threatening arrhythmia", "Primary PCI"],
            ["12–48 hours", "Stable, asymptomatic", "Primary PCI should be considered"],
            ["Over 48 hours", "Stable, asymptomatic, occluded infarct-related artery", "Routine PCI of the occluded artery is not recommended"],
          ],
        },
        {
          kind: "p",
          text: "In haemodynamically stable patients with multivessel disease, complete revascularisation is recommended, either during the index procedure or within 45 days. In cardiogenic shock, PCI of the culprit lesion only is performed at the index procedure, based on the CULPRIT-SHOCK trial.",
        },
        {
          kind: "p",
          text: "After resuscitated cardiac arrest, patients with persistent ST elevation or an equivalent follow the primary PCI pathway. In haemodynamically stable patients without ST elevation, routine immediate angiography is not recommended, based on trials such as COACT and TOMAHAWK; decisions are individualised.",
        },
        {
          kind: "pitfalls",
          items: [
            "Waiting for troponin before activating the STEMI pathway.",
            "Activating for ST elevation without considering mimics such as an old LV aneurysm, when the history does not fit.",
            "Delaying fibrinolysis while hoping a distant PCI centre will accept the patient quickly enough.",
            "Performing multivessel PCI at the index procedure in cardiogenic shock.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "ECG within 10 minutes; diagnosis starts the clock.",
            "Primary PCI if achievable within 120 minutes of diagnosis; otherwise fibrinolysis within 10 minutes.",
            "Targets: 60 minutes to wire crossing at a PCI centre, 90 minutes if transferred.",
            "Rescue PCI for failed lysis; angiography 2–24 hours after successful lysis.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "complete-2019", "culprit-shock-2017", "tomahawk-2021", "coact-2019", "matrix-2015", "oat-2006"],
    },
    {
      id: "fnd-path-nste",
      title: "NSTE-ACS: risk and timing of angiography",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Patients without persistent ST elevation are assessed with serial high-sensitivity troponin using a validated rapid algorithm (such as the ESC 0/1-hour or 0/2-hour pathways), the ECG, symptoms and a risk score such as GRACE. The timing of angiography depends on risk.",
        },
        { kind: "h", text: "Rapid troponin algorithms" },
        {
          kind: "p",
          text: "These algorithms use assay-specific cut-offs applied to a sample on arrival and a second one or two hours later. Patients fall into three groups: rule-out (very low values with no meaningful change), rule-in (high values or a significant rise) and an observe zone in between, who need a further sample at about three hours and often echocardiography. A single very low value on arrival can rule out MI only if symptoms began more than about three hours earlier. The cut-offs differ between assays, so use those validated for your laboratory's test.",
        },
        {
          kind: "table",
          caption: "Invasive strategy in NSTE-ACS (ESC 2023, summarised)",
          head: ["Strategy", "Timing", "Triggers"],
          rows: [
            ["Immediate invasive", "Within 2 hours", "Haemodynamic instability or cardiogenic shock; recurrent or refractory chest pain despite medical treatment; life-threatening arrhythmias; mechanical complications of MI; acute heart failure clearly related to ACS; recurrent dynamic ST or T changes, particularly intermittent ST elevation"],
            ["Early invasive (should be considered)", "Within 24 hours", "NSTEMI confirmed by troponin; dynamic ST or T changes; transient ST elevation; GRACE score above 140"],
            ["Selective invasive", "During the admission, guided by risk and testing", "Patients without high-risk features, in whom non-invasive testing or clinical judgement decides the need for angiography"],
          ],
        },
        {
          kind: "p",
          text: "Before angiography, consider the alternative causes of chest pain with a raised troponin. Most can be suspected from the history, examination, ECG and echocardiography.",
        },
        {
          kind: "table",
          head: ["Alternative diagnosis", "Clues", "Next test"],
          rows: [
            ["Aortic dissection", "Abrupt tearing pain radiating to the back, pulse or blood pressure difference between arms, new aortic regurgitation, neurological signs", "CT aortogram before any antithrombotic escalation"],
            ["Pulmonary embolism", "Pleuritic pain, breathlessness, hypoxia, tachycardia, signs of RV strain", "CT pulmonary angiography"],
            ["Myopericarditis", "Viral prodrome, positional pleuritic pain, diffuse ST elevation or PR depression", "Echocardiography, cardiac MR"],
            ["Takotsubo syndrome", "Preceding emotional or physical stress, often a post-menopausal woman, apical ballooning", "Angiography to exclude coronary occlusion, then imaging"],
            ["Type 2 MI or non-ischaemic injury", "Tachyarrhythmia, anaemia, sepsis, hypotension, renal failure", "Treat the cause; angiography only if the picture suggests type 1 MI"],
          ],
        },
        {
          kind: "steps",
          title: "What the angiogram has to decide",
          items: [
            { title: "Is there obstructive disease?", detail: "If not, the patient enters the MINOCA pathway or an alternative diagnosis is pursued." },
            { title: "Which lesion is the culprit?", detail: "Look for thrombus, ulceration, haziness or an abrupt cut-off, and match it to the ECG changes and the wall-motion abnormality on echocardiography." },
            { title: "How should it be treated?", detail: "PCI of the culprit at the same sitting in most cases; heart team discussion when the anatomy favours surgery (for example complex multivessel or left main disease); medical therapy when neither is appropriate." },
            { title: "What else needs doing?", detail: "Plan treatment of non-culprit disease, the duration of antiplatelet therapy and secondary prevention." },
          ],
        },
        {
          kind: "pearl",
          text: "A patient with NSTE-ACS and any very-high-risk feature should be handled with STEMI logistics: call the lab now, not on tomorrow's list.",
        },
        {
          kind: "pitfalls",
          items: [
            "Routine P2Y12 pre-treatment before angiography planned within 24 hours, which ESC 2023 does not recommend for NSTE-ACS.",
            "Placing a patient with refractory pain on a routine next-day list.",
            "Sending every troponin rise for angiography without considering type 2 MI and non-ischaemic injury.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Very high risk: immediate (within 2 hours).",
            "High risk: early (within 24 hours) should be considered.",
            "Otherwise: selective, risk- and test-guided.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "thygesen-4udmi-2018"],
    },
    {
      id: "fnd-path-ccs",
      title: "Chronic coronary syndromes and when angiography is not indicated",
      minutes: 11,
      blocks: [
        {
          kind: "p",
          text: "For stable symptoms, the 2024 ESC guideline starts with the clinical likelihood of obstructive coronary disease, estimated from symptoms, age, sex and risk factors and refined by findings such as ECG changes, LV dysfunction or coronary calcium. The likelihood band guides the first test.",
        },
        {
          kind: "table",
          caption: "Initial testing by clinical likelihood (ESC 2024, summarised; see the guideline for the full model and recommendations)",
          head: ["Clinical likelihood", "Approach"],
          rows: [
            ["Very low (5% or less)", "Defer further testing; consider other causes of symptoms"],
            ["Low (over 5–15%)", "CT coronary angiography is the preferred first test"],
            ["Moderate (over 15–50%)", "CT coronary angiography or functional imaging, chosen by patient characteristics and local expertise"],
            ["High (over 50–85%)", "Functional imaging; invasive angiography if high-risk features are present"],
            ["Very high (over 85%)", "Invasive angiography with the facility for invasive physiological assessment, especially with severe symptoms or high-risk features"],
          ],
        },
        {
          kind: "list",
          items: [
            "Severe symptoms despite medical therapy, or angina at a low workload.",
            "High-risk findings on non-invasive testing, such as significant left main or proximal multivessel disease on CT, or a large area of inducible ischaemia (for example about 10% or more of the LV on perfusion imaging).",
            "Suspected ischaemic LV dysfunction when revascularisation is being considered.",
            "Survivors of cardiac arrest or sustained ventricular arrhythmia without another clear cause.",
          ],
        },
        {
          kind: "p",
          text: "These are the usual reasons to go directly to invasive angiography. Intermediate lesions found at angiography should be assessed with pressure-wire physiology before deciding on revascularisation.",
        },
        {
          kind: "p",
          text: "Trial evidence shapes these choices. In ISCHEMIA, an initial invasive strategy did not reduce death or MI overall in stable patients with moderate or severe ischaemia (excluding significant left main disease, an ejection fraction below 35%, recent ACS and unacceptable angina), although it improved angina-related quality of life in patients with angina. In REVIVED, PCI added to medical therapy did not reduce death or heart failure hospitalisation in ischaemic LV dysfunction. In chronic coronary syndrome, revascularisation is mainly for symptoms despite medical therapy and, in selected anatomy such as significant left main disease, for prognosis.",
        },
        { kind: "h", text: "When angiography is not indicated" },
        {
          kind: "list",
          items: [
            "Screening of asymptomatic people.",
            "Very low clinical likelihood of obstructive disease.",
            "Chest pain that is clearly non-cardiac.",
            "Patients who would not accept or are unsuitable for revascularisation, and whose management would not change.",
            "Troponin rises with a clear non-ischaemic cause, such as sepsis, pulmonary embolism or confirmed myocarditis.",
            "Stable, asymptomatic patients more than 48 hours after STEMI with an occluded infarct-related artery, for the purpose of opening it.",
            "Haemodynamically stable patients after cardiac arrest without ST elevation, as a routine immediate procedure.",
          ],
        },
        {
          kind: "table",
          caption: "Common reasons to defer an elective study",
          head: ["Problem", "Why it matters"],
          rows: [
            ["Acute kidney injury or unstable renal function", "Higher risk of further kidney injury"],
            ["Active bleeding or uncorrected coagulopathy", "Access and antithrombotic risk"],
            ["Decompensated heart failure", "Patient cannot lie flat; contrast adds volume"],
            ["Uncontrolled hypertension", "Bleeding and access complications"],
            ["Active infection or fever", "Risk of infection; confounds troponin and symptoms"],
            ["Severe electrolyte disturbance or digoxin toxicity", "Arrhythmia risk"],
            ["Severe anaemia", "Ischaemia and bleeding risk"],
            ["Previous severe contrast reaction without a plan", "Needs preparation"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "CCS testing is driven by clinical likelihood: CTCA for low to moderate likelihood, functional imaging for moderate to high, invasive angiography for very high likelihood or high-risk features.",
            "ISCHEMIA: no reduction in death or MI with routine initial invasive management; symptom benefit in those with angina.",
            "Angiography should answer a question whose answer will change management.",
          ],
        },
      ],
      refs: ["esc-ccs-2024", "ischemia-2020", "revived-2022", "fame-2009", "fame2-2012", "supplied-medmastery", "spertus-ischemia-qol-2020"],
    },
  ],
  quiz: [
    {
      id: "fnd-q-path-01",
      stem: "A patient with an anterior STEMI presents to a non-PCI hospital. The nearest PCI centre can achieve wire crossing in an estimated 150 minutes from diagnosis. There are no contraindications to fibrinolysis. What is the best strategy?",
      options: [
        "Transfer for primary PCI regardless of delay",
        "Give fibrinolysis within 10 minutes, then transfer to the PCI centre",
        "Give fibrinolysis and keep the patient locally with no angiography",
        "Wait for troponin and then decide",
        "Give a GP IIb/IIIa inhibitor and transfer",
      ],
      answer: 1,
      explanation:
        "When primary PCI cannot be achieved within 120 minutes of diagnosis, fibrinolysis is given promptly and the patient is transferred for rescue PCI if it fails, or for angiography within 2–24 hours if it succeeds. Transferring regardless of delay is tempting because primary PCI is generally preferred, but the benefit is lost when the delay is this long.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-path-02",
      stem: "Ninety minutes after fibrinolysis, a patient still has chest pain and ST-segment resolution is under 50%. What is indicated?",
      options: [
        "A second dose of fibrinolytic",
        "Elective angiography in 24 hours",
        "Observation and repeat ECG in 6 hours",
        "Rescue PCI",
        "Intravenous nitrate only",
      ],
      answer: 3,
      explanation:
        "Failed reperfusion after fibrinolysis is an indication for immediate rescue PCI. Repeating the fibrinolytic is tempting but has not been shown to help and increases bleeding.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-path-03",
      stem: "A patient with NSTE-ACS has ongoing chest pain despite IV nitrate, aspirin and anticoagulation, with dynamic ST depression. When should angiography be performed?",
      options: [
        "Immediately (within 2 hours)",
        "Early, within 24 hours of admission",
        "Within 72 hours, on the next list",
        "After a stress test confirms ischaemia",
        "At outpatient review once pain-free",
      ],
      answer: 0,
      explanation:
        "Refractory ischaemic pain despite medical therapy is a very-high-risk feature that calls for an immediate invasive strategy. Within 24 hours is the early strategy for high-risk patients without very-high-risk features, which is why it is a tempting but insufficient answer.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-path-04",
      stem: "A haemodynamically stable, pain-free patient has NSTEMI confirmed by high-sensitivity troponin and a GRACE score of 152. What timing of angiography should be considered?",
      options: [
        "Immediate, within 2 hours",
        "Only if a stress test is positive",
        "Early, within 24 hours",
        "Not at all",
        "Within 7 days",
      ],
      answer: 2,
      explanation:
        "Confirmed NSTEMI and a GRACE score above 140 are high-risk features for which an early invasive strategy within 24 hours should be considered. Immediate angiography is reserved for very-high-risk features such as instability or refractory pain, which this patient does not have.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "fnd-q-path-05",
      stem: "A 61-year-old is resuscitated from a VF arrest. After return of spontaneous circulation, the ECG shows no ST elevation or equivalent, and he is haemodynamically stable. What is the most appropriate approach to angiography?",
      options: [
        "Immediate angiography in all resuscitated patients, whatever the ECG shows",
        "Never perform angiography after cardiac arrest because of the bleeding risk",
        "Fibrinolysis in the emergency department followed by angiography within 24 hours",
        "No routine immediate angiography; decide on timing individually",
        "CT coronary angiography only, with invasive angiography reserved for survivors",
      ],
      answer: 3,
      explanation:
        "Trials such as COACT and TOMAHAWK did not show benefit from routine immediate angiography in stable patients without ST elevation after cardiac arrest, so timing is individualised. Immediate angiography for everyone is tempting because coronary disease is common in this group, but it did not improve outcomes.",
      difficulty: 3,
      refs: ["esc-acs-2023", "coact-2019", "tomahawk-2021"],
    },
    {
      id: "fnd-q-path-06",
      stem: "A 48-year-old woman with exertional chest tightness has an estimated clinical likelihood of obstructive coronary disease of about 12%. What is the preferred first test under the 2024 ESC guideline?",
      options: [
        "CT coronary angiography",
        "Invasive coronary angiography",
        "No testing at all",
        "Exercise ECG as the definitive test",
        "Cardiac MR with late gadolinium only",
      ],
      answer: 0,
      explanation:
        "In the low likelihood band (over 5–15%), CT coronary angiography is the preferred first test because it can reliably exclude obstructive disease. Invasive angiography is tempting as the 'definitive' test but exposes a low-likelihood patient to procedural risk with a low diagnostic yield.",
      difficulty: 2,
      refs: ["esc-ccs-2024"],
    },
    {
      id: "fnd-q-path-07",
      stem: "A patient presents 60 hours after the onset of an inferior STEMI. He is pain-free and haemodynamically stable. Angiography shows an occluded RCA. What is the recommendation for routine PCI of the occluded artery?",
      options: [
        "Primary PCI is mandatory",
        "Fibrinolysis should be given",
        "PCI should be performed only if the RCA is dominant",
        "CABG is mandatory",
        "Routine PCI of the occluded artery is not recommended",
      ],
      answer: 4,
      explanation:
        "In stable, asymptomatic patients presenting more than 48 hours after symptom onset, routine PCI of an occluded infarct-related artery is not recommended. Primary PCI is tempting because the artery is occluded, but late opening has not shown benefit when the patient is stable and symptom-free.",
      difficulty: 3,
      refs: ["esc-acs-2023", "oat-2006"],
    },
    {
      id: "fnd-q-path-08",
      stem: "What was the main finding of the ISCHEMIA trial?",
      options: [
        "Routine invasive management reduced all-cause mortality at 5 years in stable patients",
        "No overall reduction in death or MI, but better angina-related quality of life with angina",
        "PCI was harmful in all patients, with more periprocedural MI and no symptom benefit",
        "Medical therapy alone was associated with more strokes and more heart failure admissions at follow-up",
        "CT coronary angiography should be avoided before randomisation in stable chest pain",
      ],
      answer: 1,
      explanation:
        "ISCHEMIA found no overall reduction in death or MI with an initial invasive strategy in stable patients with moderate or severe ischaemia, with symptom benefit in those who had angina. A mortality reduction is what many expected before the trial, which is why it is a tempting misreading.",
      difficulty: 2,
      refs: ["ischemia-2020", "spertus-ischemia-qol-2020"],
    },
  ],
  caseIds: ["fnd-case-lbbb", "fnd-case-contrast-reaction"],
};

// ===========================================================================
// Cases (synthetic)
// ===========================================================================
const cases: CaseStudy[] = [
  {
    id: "fnd-case-inferior-rv",
    title: "Inferior STEMI with right ventricular involvement",
    trackId: "foundations",
    stage: 1,
    provenance: { kind: "synthetic" },
    summary:
      "A 64-year-old man with inferior ST elevation, hypotension and bradycardia. Recognise RV involvement, avoid harmful drugs, manage heart block and recognise reperfusion phenomena.",
    presentation:
      "A 64-year-old man with hypertension and type 2 diabetes called an ambulance after 90 minutes of central chest pressure radiating to the jaw, with sweating and nausea. The paramedic ECG showed inferior ST elevation and he has been brought directly to your primary PCI centre.",
    findings: [
      "HR 52/min, sinus rhythm; BP 94/62 mmHg; SpO2 96% on air; respiratory rate 20/min.",
      "JVP raised to the earlobes; chest clear; no murmurs.",
      "ECG: ST elevation 3 mm in III, 2 mm in II and aVF; 1 mm ST elevation in V1; ST depression 1.5 mm in I and aVL.",
      "Aspirin 300 mg given by the ambulance crew; no other drugs yet.",
    ],
    steps: [
      {
        id: "rv-check",
        prompt: "He arrives while the lab is being prepared. What is the most useful additional test now?",
        options: [
          {
            text: "Record posterior leads V7–V9",
            acceptable: true,
            feedback:
              "Posterior leads help when V1–V3 show ST depression, but here V1 shows elevation. The question that changes management now is RV involvement, which needs right-sided leads.",
            next: "rv-confirmed",
          },
          {
            text: "Record right-sided chest leads, including V4R",
            best: true,
            feedback:
              "Correct. ST elevation greater in III than II, ST elevation in V1, hypotension, a raised JVP and clear lungs all suggest a proximal RCA occlusion with RV involvement. V4R confirms it and changes immediate management, and the changes can fade within hours, so record it now.",
            next: "rv-confirmed",
          },
          {
            text: "Wait for the first high-sensitivity troponin before confirming the lab",
            feedback:
              "Troponin has no role in deciding on primary PCI for STEMI and waiting only costs myocardium. The ECG diagnosis has already started the reperfusion clock.",
            next: "rv-confirmed",
          },
          {
            text: "Arrange a CT aortogram before going to the lab",
            feedback:
              "Consider aortic dissection clinically (pain character, pulses, arm blood pressures, neurology). Without suggestive features, routine CT before primary PCI delays reperfusion.",
            next: "rv-confirmed",
          },
        ],
      },
      {
        id: "rv-confirmed",
        prompt: "His pain is 8/10. A colleague suggests sublingual GTN. How do you manage pain and blood pressure?",
        info: "V4R shows 1.5 mm ST elevation. BP is now 90/58 mmHg; lungs remain clear.",
        options: [
          {
            text: "Give IV furosemide for the raised JVP",
            feedback:
              "The raised JVP reflects a failing right ventricle, not fluid overload; the lungs are clear. A diuretic would reduce preload and worsen hypotension.",
            next: "chb",
          },
          {
            text: "Give sublingual GTN because he is still in pain",
            feedback:
              "Nitrates venodilate and can cause severe hypotension in RV infarction, particularly with a systolic pressure already around 90 mmHg. Use opioid analgesia and reperfuse.",
            next: "rv-gtn-hypotension", stateDelta: {"stability": -15, "flags": ["nitrate-hypotension"]} },
          {
            text: "Avoid nitrates; give titrated IV opioid with an antiemetic, and give a cautious IV fluid bolus (for example 250 mL) if blood pressure falls, reassessing after each bolus",
            best: true,
            feedback:
              "Correct. The infarcted right ventricle depends on preload. Nitrates reduce venous return and can cause profound hypotension. Small fluid boluses with reassessment support filling without overloading the left side.",
            next: "chb",
          },
          {
            text: "Start a noradrenaline infusion now",
            feedback:
              "Vasopressor or inotropic support is used if hypotension persists despite adequate filling. It is not the first step in a patient who has not yet had a fluid challenge.",
            next: "chb",
          },
        ],
      },
      {
        id: "chb",
        prompt: "On the lab table, before arterial puncture, his rhythm changes. What is the best immediate management?",
        info: "P waves are dissociated from narrow QRS complexes at 38/min. BP 78/50 mmHg. He is pale and drowsy but responds to voice.",
        options: [
          {
            text: "Ignore the rhythm because nodal block in inferior MI is usually transient",
            feedback:
              "It usually is transient, but he is hypotensive and drowsy now. Symptomatic bradycardia needs treatment while you reperfuse.",
            next: "anticoag",
          },
          {
            text: "Insert a temporary transvenous pacing wire first, before any other action",
            acceptable: true,
            feedback:
              "A temporary wire may be needed if atropine fails and he remains compromised, and some operators place one through the femoral vein in the same sitting. Atropine and pads act faster, and delaying reperfusion to place a wire in a responsive patient is not ideal.",
            next: "anticoag",
          },
          {
            text: "Give atropine 0.5 mg IV (repeated as needed per ALS guidance), apply transcutaneous pacing pads and prepare for temporary transvenous pacing, while proceeding to reperfusion without delay",
            best: true,
            feedback:
              "Correct. Complete heart block in inferior MI is usually at the AV node and often responds to atropine. Pads give an immediate fallback, and reperfusion is the definitive treatment that most often restores conduction.",
            next: "anticoag",
          },
          {
            text: "Give IV adrenaline 1 mg",
            feedback:
              "That is the cardiac arrest dose. In a patient with a pulse it can cause dangerous hypertension, arrhythmia and ischaemia.",
            next: "chb-adrenaline-vt", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "anticoag",
        prompt: "Which antithrombotic plan is most appropriate for the procedure?",
        info: "After atropine his rate rises to 58/min and BP to 92/60 mmHg. Right radial access is obtained. Angiography shows a thrombotic occlusion of the proximal RCA before the RV branches (TIMI 0); the left system has mild disease only.",
        options: [
          {
            text: "Give heparin only after the stent has been deployed",
            feedback:
              "Anticoagulation must be established before equipment enters the coronary artery, or thrombus can form on the wire and in the guide catheter.",
            next: "reperfusion",
          },
          {
            text: "No heparin because aspirin has already been given",
            feedback:
              "Aspirin alone does not prevent thrombus forming on catheters, wires and stents. Every PCI needs anticoagulation.",
            next: "reperfusion",
          },
          {
            text: "Give a full-dose fibrinolytic on the table before wiring",
            feedback:
              "Fibrinolysis is the alternative when primary PCI cannot be delivered in time. Given in the lab immediately before PCI, it adds bleeding risk without benefit.",
            next: "reperfusion",
          },
          {
            text: "Unfractionated heparin about 70–100 units/kg IV with an ACT check, an oral P2Y12 inhibitor per the local primary PCI protocol, and a GP IIb/IIIa inhibitor kept for bail-out",
            best: true,
            feedback:
              "Correct. This is a standard approach: aspirin is already given, heparin covers the procedure, a potent P2Y12 inhibitor completes DAPT and a GP IIb/IIIa inhibitor is available if thrombus or no-reflow becomes a problem.",
            next: "reperfusion",
          },
        ],
      },
      {
        id: "reperfusion",
        prompt: "What is happening, and what do you do?",
        info: "The wire crosses and a small balloon restores flow. Over the next minute the monitor shows a regular broad-complex rhythm at 80/min, followed by sinus bradycardia at 45/min with BP 75/45 mmHg. He yawns and feels sick.",
        options: [
          {
            text: "These are reperfusion phenomena: accelerated idioventricular rhythm (leave it) followed by a Bezold–Jarisch reflex. Give atropine and fluid, check that coronary flow is preserved, and continue",
            best: true,
            feedback:
              "Correct. AIVR is a marker of reperfusion and needs no suppression. Bradycardia, hypotension, yawning and nausea after opening the RCA are typical of the Bezold–Jarisch reflex, which responds to atropine and fluid. Check the angiogram to exclude no-reflow or a new occlusion.",
            next: "after",
          },
          {
            text: "Treat the broad-complex rhythm with IV amiodarone",
            feedback:
              "The broad-complex rhythm at about the sinus rate straight after reperfusion is AIVR. Suppressing it is unnecessary and may leave him with no effective rhythm during a period of bradycardia.",
            next: "after",
          },
          {
            text: "Assume no-reflow and give intracoronary adenosine immediately",
            feedback:
              "No-reflow can cause hypotension, so look at the flow, but the sequence of AIVR and vagal symptoms is typical of reperfusion. Adenosine would also worsen the bradycardia.",
            next: "after",
          },
          {
            text: "Withdraw all equipment and abandon the procedure",
            feedback:
              "These events are expected and treatable. Abandoning the procedure would leave an unstented, thrombotic artery at high risk of re-occlusion.",
            next: "after",
          },
        ],
      },
      {
        id: "after",
        prompt: "Which statement about his care over the next few days is most accurate?",
        info: "A stent is deployed with TIMI 3 flow. Sinus rhythm at 72/min returns and BP rises to 108/70 mmHg. He is comfortable on the ward the next morning.",
        options: [
          {
            text: "Aspirin can be stopped after 1 month because the stent is drug-eluting",
            feedback:
              "Aspirin continues long term, and the default DAPT duration after ACS is 12 months. Premature discontinuation risks stent thrombosis.",
          },
          {
            text: "He needs a permanent pacemaker because he had complete heart block",
            feedback:
              "AV nodal block in inferior MI usually resolves, especially after reperfusion. Permanent pacing is considered only if high-grade block persists beyond the expected recovery period.",
          },
          {
            text: "Avoid nitrates and diuretics until RV function recovers, monitor for recurrent AV block, continue DAPT (12 months by default) and arrange echocardiography",
            best: true,
            feedback:
              "Correct. RV function usually recovers over days after reperfusion, but he remains preload-dependent meanwhile. Heart block can recur, so keep him monitored. DAPT and secondary prevention follow standard ACS practice.",
          },
          {
            text: "He can go home today without echocardiography",
            feedback:
              "He has had RV infarction and complete heart block. He needs monitoring and an assessment of LV and RV function before discharge.",
          },
        ],
      },
      {
        "id": "rv-gtn-hypotension",
        "kind": "consequence",
        "info": "Four minutes after the GTN: BP 64/38 mmHg, HR 50/min, grey, clammy and nauseated. Lungs still clear.",
        "prompt": "The nitrate has dropped his preload. What do you do now?",
        "options": [
          {
            "text": "Lie him flat, give a 250 mL crystalloid bolus (repeated if needed), no more nitrate, and reassess",
            "best": true,
            "feedback": "Correct: the RV is preload-dependent, so volume restores output; avoiding further venodilators prevents a repeat.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Start noradrenaline straight away without giving fluid first",
            "acceptable": true,
            "feedback": "A vasopressor may be needed, but in RV infarction with clear lungs a fluid challenge comes first.",
            "stateDelta": {
              "stability": -3
            }
          },
          {
            "text": "Give IV furosemide because the JVP is raised",
            "feedback": "The raised JVP reflects RV failure, not fluid overload; a diuretic removes the preload the RV depends on.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "chb-adrenaline-vt",
        "kind": "consequence",
        "info": "Within a minute the monitor shows a regular broad-complex tachycardia at 190/min. He is barely responsive; BP 60/30 mmHg with a weak pulse.",
        "prompt": "He is peri-arrest with a pulse. What is the immediate treatment?",
        "options": [
          {
            "text": "Synchronised DC cardioversion under brief sedation, then treat the underlying block with atropine and pacing pads",
            "best": true,
            "feedback": "Unstable VT with a pulse needs synchronised cardioversion; the original problem, complete heart block, still has to be managed afterwards.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "IV amiodarone 300 mg over 10–20 minutes and observe",
            "acceptable": true,
            "feedback": "Amiodarone is used for stable VT; with shock and reduced consciousness, electrical cardioversion comes first.",
            "stateDelta": {
              "stability": -8
            }
          },
          {
            "text": "A further 1 mg of adrenaline to support the blood pressure",
            "feedback": "More adrenaline drives the arrhythmia that it caused; it is reserved for cardiac arrest.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "Reperfusion of the proximal RCA restored AV conduction within an hour. Echocardiography showed inferior hypokinesia with a mildly impaired right ventricle that recovered over 48 hours. He was discharged on day 3 on aspirin, a P2Y12 inhibitor, a high-intensity statin and other secondary prevention, with referral to cardiac rehabilitation.",
    outcomeVariants: [
      {
        "flag": "nitrate-hypotension",
        "text": "The GTN-induced hypotension delayed the start of the procedure by twenty minutes; in RV infarction, nitrates and diuretics are avoided until the RV has recovered."
      }
    ],
    learningPoints: [
      "Record V4R in every inferior STEMI, early, before the changes fade.",
      "RV infarction: hypotension, raised JVP, clear lungs. Avoid nitrates and diuretics; give cautious fluid.",
      "AV nodal block in inferior MI is usually atropine-responsive and transient; have pads on and pacing ready.",
      "AIVR and Bezold–Jarisch bradycardia are expected reperfusion phenomena.",
      "Anticoagulation must be in place before equipment enters the coronary artery.",
    ],
    refs: ["esc-acs-2023", "supplied-eh-views", "supplied-medmastery", "hanna-pcm"],
  },
  {
    id: "fnd-case-lbbb",
    title: "Chest pain with left bundle branch block",
    trackId: "foundations",
    stage: 2,
    provenance: { kind: "synthetic" },
    summary:
      "A 72-year-old woman with ongoing chest pain and long-standing LBBB. Interpret the ECG, decide whether to activate the primary PCI pathway and recognise why the culprit was electrically subtle.",
    presentation:
      "A 72-year-old woman with hypertension presents to the emergency department of your PCI centre with 50 minutes of severe central chest tightness and breathlessness. She is clammy and frightened.",
    findings: [
      "HR 96/min; BP 112/74 mmHg; SpO2 94% on air; bibasal crackles.",
      "ECG: sinus rhythm with LBBB (QRS 150 ms); 2 mm ST elevation in V5 and V6, concordant with positive QRS complexes.",
      "An ECG from a clinic visit 18 months ago also shows LBBB, without ST elevation in V5–V6.",
      "Radial pulses equal; no back pain; no neurological deficit.",
    ],
    steps: [
      {
        id: "interpret",
        prompt: "How do you interpret the ST changes in V5 and V6?",
        options: [
          {
            text: "LBBB makes the ECG uninterpretable for ischaemia",
            feedback:
              "LBBB makes interpretation harder but not impossible. Sgarbossa-type criteria identify changes that the bundle branch block cannot explain.",
            next: "decide",
          },
          {
            text: "These are the expected secondary repolarisation changes of LBBB",
            feedback:
              "Expected LBBB changes are discordant: ST depression where the QRS is positive. Concordant elevation is not expected and points to acute occlusion.",
            next: "decide",
          },
          {
            text: "Concordant ST elevation of 1 mm or more in leads with a positive QRS is a specific sign of acute coronary occlusion in LBBB",
            best: true,
            feedback:
              "Correct. In LBBB the ST segment normally moves opposite to the main QRS deflection. Elevation in the same direction is the highest-scoring Sgarbossa criterion and is not explained by the conduction abnormality.",
            next: "decide",
          },
        ],
      },
      {
        id: "decide",
        prompt: "The registrar points out that her LBBB is old. What should happen next?",
        options: [
          {
            text: "Repeat the ECG in 15 minutes and activate only if it changes",
            feedback:
              "Serial ECGs help when the first is non-diagnostic, but this one already shows concordant ST elevation in a patient with ongoing pain. Waiting costs myocardium.",
            next: "lbbb-delay", stateDelta: {"stability": -15, "flags": ["activation-delay"]} },
          {
            text: "Activate the primary PCI pathway now",
            best: true,
            feedback:
              "Correct. Under the 2023 ESC guideline, ongoing ischaemic symptoms with bundle branch block warrant a primary PCI strategy whether or not the block is new, and here there is also a positive Sgarbossa criterion.",
            next: "prep",
          },
          {
            text: "Send a high-sensitivity troponin and decide at 1 hour",
            feedback:
              "Troponin pathways are for patients without an occlusion pattern. A probable acute occlusion needs reperfusion now, not a troponin result.",
            next: "prep",
          },
          {
            text: "Give fibrinolysis in the emergency department",
            feedback:
              "At a PCI centre with the lab available, primary PCI is the preferred reperfusion strategy and can be delivered well within the target time.",
            next: "prep",
          },
        ],
      },
      {
        id: "prep",
        prompt: "While the lab team assembles, which set of actions is most appropriate?",
        options: [
          {
            text: "Delay transfer until a formal echocardiogram has been performed",
            feedback:
              "A quick bedside echo can help if it does not delay anything, but a formal study should never hold up primary PCI.",
            next: "lab",
          },
          {
            text: "IV furosemide and a nitrate infusion for her crackles, then transfer",
            acceptable: true,
            feedback:
              "Reasonable for pulmonary congestion if her blood pressure allows and it does not delay transfer. It does not replace the antithrombotic and safety checks.",
            next: "lbbb-nitrate-drop", stateDelta: {"stability": -10} },
          {
            text: "High-flow oxygen for all patients with suspected MI",
            feedback:
              "Oxygen is given for hypoxaemia (SpO2 below 90%). Routine high-flow oxygen in normoxic patients has not shown benefit.",
            next: "lab",
          },
          {
            text: "Aspirin, analgesia, check renal function and allergies, look for features of aortic dissection, and give P2Y12 and anticoagulant therapy per the local primary PCI protocol; oxygen only if SpO2 falls below 90%",
            best: true,
            feedback:
              "Correct. These steps take minutes and run in parallel with the team's arrival. Routine oxygen without hypoxaemia brings no benefit; the ESC threshold is SpO2 below 90%.",
            next: "lab",
          },
        ],
      },
      {
        id: "lab",
        prompt: "Before ventriculography, LVEDP is 30 mmHg. What do you do?",
        info: "Right radial angiography: mild LAD disease; a dominant circumflex occluded just after the first obtuse marginal with fresh thrombus (TIMI 0); a small non-dominant RCA.",
        options: [
          {
            text: "Perform a standard ventriculogram first to document LV function",
            feedback:
              "With an LVEDP of 30 mmHg, a large contrast bolus can precipitate pulmonary oedema, and it delays reperfusion.",
            next: "silent",
          },
          {
            text: "Omit the ventriculogram, treat the culprit circumflex with minimal contrast, treat congestion and assess LV function by echocardiography afterwards",
            best: true,
            feedback:
              "Correct. A very high LVEDP in a breathless patient means a ventriculogram adds risk for information echocardiography can provide. The priority is reperfusion of the culprit.",
            next: "silent",
          },
          {
            text: "Give a 500 mL saline bolus to protect the kidneys before PCI",
            feedback:
              "Fluid loading is wrong in a congested patient with a high LVEDP. Protect the kidneys by limiting contrast.",
            next: "silent",
          },
        ],
      },
      {
        id: "silent",
        prompt: "At the debrief, a student asks why this large infarct produced so little ST elevation. What is the best explanation?",
        info: "The circumflex is opened and stented with TIMI 3 flow. Her pain settles.",
        options: [
          {
            text: "LBBB only affects the inferior leads",
            feedback:
              "LBBB alters repolarisation across most leads, especially V1–V3 and the lateral leads.",
          },
          {
            text: "Circumflex occlusions never cause ST changes",
            feedback:
              "They often do, particularly in I, aVL, V5–V6 or the posterior leads. They are subtle, not invisible.",
          },
          {
            text: "The circumflex territory is poorly represented by the standard 12 leads, so its occlusion is often electrically subtle, and LBBB masks the changes further",
            best: true,
            feedback:
              "Correct. The lateral and posterior walls are seen poorly by standard leads. Posterior leads and echocardiography help, and ongoing ischaemic symptoms should drive the decision.",
          },
          {
            text: "Because the RCA is non-dominant, the infarct cannot be large",
            feedback:
              "The opposite applies: with a dominant circumflex, an occlusion can jeopardise the lateral, posterior and inferior walls.",
          },
        ],
      },
      {
        "id": "lbbb-delay",
        "kind": "consequence",
        "info": "Fifteen minutes later the repeat ECG is unchanged, but she is now grey with BP 86/54 mmHg, HR 112/min and new basal crackles.",
        "prompt": "The ECG has not changed but she has deteriorated. What now?",
        "options": [
          {
            "text": "Activate the primary PCI pathway immediately and start supportive treatment while the team assembles",
            "best": true,
            "feedback": "Concordant ST elevation already met the criteria; haemodynamic deterioration makes activation more urgent, not less.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Send a troponin and wait for the result before deciding",
            "feedback": "Troponin does not decide reperfusion in suspected acute occlusion; every minute of waiting costs myocardium.",
            "next": "lbbb-nitrate-drop",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give fibrinolysis in the emergency department because the lab will take time",
            "acceptable": true,
            "feedback": "Fibrinolysis is an option only if PCI cannot be delivered within the target time; in a PCI centre, activation is the right call.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "lbbb-nitrate-drop",
        "kind": "consequence",
        "info": "After IV furosemide and a nitrate infusion her BP falls to 78/48 mmHg; she is drowsy and her lactate is 4.2 mmol/L.",
        "prompt": "She is now in cardiogenic shock. How do you respond?",
        "options": [
          {
            "text": "Stop the nitrate, support the pressure with noradrenaline, and take her to the lab immediately for reperfusion with shock support planned",
            "best": true,
            "feedback": "Reperfusion of the culprit is the treatment for ischaemic shock; vasodilators are stopped and pressure supported on the way.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Give a large fluid bolus to restore the blood pressure",
            "feedback": "With crackles and a high filling pressure, a large bolus worsens pulmonary oedema.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Transfer to the coronary care unit for stabilisation before angiography",
            "feedback": "Delaying reperfusion in ischaemic shock increases mortality; she needs the lab now.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
    ],
    outcome:
      "Door-to-wire time was 52 minutes. Echocardiography the next day showed lateral and inferolateral hypokinesia with an ejection fraction of about 45%. She was treated for heart failure, started on DAPT and secondary prevention, and referred for cardiac rehabilitation.",
    outcomeVariants: [
      {
        "flag": "activation-delay",
        "text": "Waiting for the repeat ECG added time to an already long door-to-balloon interval, and the infarct was larger for it."
      }
    ],
    learningPoints: [
      "Ongoing ischaemic symptoms with bundle branch block or a paced rhythm call for a primary PCI strategy, even if the block is old.",
      "Concordant ST elevation of 1 mm or more in a lead with a positive QRS is the strongest Sgarbossa criterion.",
      "A negative Sgarbossa score does not exclude occlusion; the clinical picture drives the decision.",
      "Circumflex occlusion is often electrically subtle.",
      "Skip the ventriculogram when LVEDP is very high; use echocardiography.",
    ],
    refs: ["esc-acs-2023", "hanna-pcm", "sgarbossa-lbbb-1996"],
  },
  {
    id: "fnd-case-contrast-reaction",
    title: "Urgent angiography after previous contrast anaphylaxis",
    trackId: "foundations",
    stage: 2,
    provenance: { kind: "synthetic" },
    summary:
      "A 58-year-old man with very-high-risk NSTE-ACS reports a previous severe reaction to iodinated contrast. Plan a safe procedure without delaying it, then manage anaphylaxis on the table.",
    presentation:
      "A 58-year-old man with diabetes and hyperlipidaemia was admitted with recurrent rest chest pain. Despite aspirin, fondaparinux, a beta-blocker and IV nitrate, he has a further episode with dynamic ST depression in V2–V5, and his high-sensitivity troponin is rising. Three years ago he collapsed during a contrast-enhanced abdominal CT and was given adrenaline; the discharge letter records anaphylaxis to iohexol.",
    findings: [
      "HR 88/min; BP 132/80 mmHg; SpO2 97% on air.",
      "Pain 6/10 despite IV nitrate.",
      "eGFR 68 mL/min/1.73 m²; Hb 141 g/L; platelets 230 × 10⁹/L.",
      "Fondaparinux 2.5 mg given subcutaneously at 08:00 today.",
      "No other recorded allergies; no known latex or chlorhexidine reactions.",
    ],
    steps: [
      {
        id: "timing",
        prompt: "What is the most appropriate plan for angiography?",
        options: [
          {
            text: "Postpone angiography for 13 hours to complete an oral corticosteroid premedication regimen",
            feedback:
              "Delaying a very-high-risk patient for half a day exposes him to infarction, and the evidence that premedication prevents severe reactions is weak.",
            next: "contrast-premed-delay", stateDelta: {"stability": -15} },
          {
            text: "Immediate invasive angiography (within 2 hours), with a prepared plan for his contrast allergy",
            best: true,
            feedback:
              "Correct. Refractory ischaemic pain with dynamic ST changes is a very-high-risk feature that calls for an immediate invasive strategy. The allergy changes how you prepare, not whether you proceed.",
            next: "prepare",
          },
          {
            text: "Arrange CT coronary angiography instead because it uses less contrast",
            feedback:
              "CT angiography uses the same class of iodinated contrast and cannot treat the culprit lesion. It is not appropriate in very-high-risk ACS.",
            next: "prepare",
          },
          {
            text: "Give fibrinolysis because contrast is contraindicated",
            feedback:
              "Fibrinolysis has no role in NSTE-ACS, and a previous contrast reaction is not an absolute contraindication to angiography.",
            next: "prepare",
          },
        ],
      },
      {
        id: "prepare",
        prompt: "How should you prepare for the procedure?",
        options: [
          {
            text: "Use iohexol again because he will be premedicated",
            feedback:
              "Re-exposing a patient to the agent that caused anaphylaxis is avoidable risk. Choose a different agent.",
            next: "anticoag",
          },
          {
            text: "Give steroid and antihistamine premedication, then treat the case as routine",
            feedback:
              "Breakthrough reactions occur despite premedication. The team must be ready to treat anaphylaxis regardless.",
            next: "anticoag",
          },
          {
            text: "Use a gadolinium-based agent as the coronary contrast",
            feedback:
              "Gadolinium agents give poor coronary opacification at safe doses and are not a substitute for iodinated contrast in coronary angiography.",
            next: "anticoag",
          },
          {
            text: "Brief the whole team and an anaesthetist, use a different iodinated agent from iohexol, have adrenaline drawn up and resuscitation equipment ready, and give premedication only if local policy supports it and it causes no delay",
            best: true,
            feedback:
              "Correct. Changing the agent and preparing the team to treat anaphylaxis are the measures that matter most. Premedication may be used per local policy but must not delay the procedure or replace readiness.",
            next: "anticoag",
          },
        ],
      },
      {
        id: "anticoag",
        prompt: "He received fondaparinux this morning. What anticoagulation is needed for PCI?",
        options: [
          {
            text: "A bolus of unfractionated heparin at the time of PCI",
            best: true,
            feedback:
              "Correct. Fondaparinux alone was associated with catheter thrombosis during PCI, so a UFH bolus is given in the lab.",
            next: "reaction",
          },
          {
            text: "Bivalirudin bolus and infusion instead of heparin",
            acceptable: true,
            feedback:
              "Bivalirudin is an acceptable alternative anticoagulant for PCI, but there is no reason here to avoid heparin, which is the standard and reversible choice.",
            next: "reaction",
          },
          {
            text: "No further anticoagulation because fondaparinux covers the procedure",
            feedback:
              "Fondaparinux does not provide adequate protection against thrombus on catheters and wires. An additional UFH bolus is needed.",
            next: "reaction",
          },
          {
            text: "Reverse fondaparinux with protamine before starting",
            feedback:
              "Protamine does not reverse fondaparinux, and reversing anticoagulation before PCI would be the wrong direction.",
            next: "reaction",
          },
        ],
      },
      {
        id: "reaction",
        prompt: "What is your immediate management?",
        info: "Two minutes after the first left coronary injections (with iodixanol) he develops widespread urticaria, a hoarse voice and wheeze. HR 128/min, BP 72/40 mmHg, SpO2 89%.",
        options: [
          {
            text: "Give a 1 mg IV adrenaline bolus",
            feedback:
              "That is the cardiac arrest dose. In a patient with a pulse it can cause severe hypertension, arrhythmia and myocardial ischaemia, which is particularly dangerous during an ACS.",
            next: "after-reaction",
          },
          {
            text: "Give IV chlorphenamine and hydrocortisone and observe",
            feedback:
              "Antihistamines and steroids act slowly and do not treat shock or airway oedema. They are not first-line in anaphylaxis.",
            next: "contrast-slow-treatment", stateDelta: {"stability": -20} },
          {
            text: "Stop contrast, call for help, give IM adrenaline 0.5 mg (or titrated IV adrenaline by an experienced clinician), high-flow oxygen, lie him flat with legs raised and give a rapid IV crystalloid bolus",
            best: true,
            feedback:
              "Correct. This is anaphylaxis with airway, breathing and circulation involvement. Adrenaline is the key drug, with oxygen, positioning and fluid. Repeat IM adrenaline after 5 minutes if there is no improvement.",
            next: "after-reaction",
          },
          {
            text: "Treat it as a vasovagal reaction with atropine",
            feedback:
              "He is tachycardic, with skin and airway signs. A vagal reaction causes bradycardia. Atropine will not treat anaphylaxis.",
            next: "after-reaction",
          },
        ],
      },
      {
        id: "after-reaction",
        prompt: "Which follow-up action is correct?",
        info: "After a second IM adrenaline dose and 1 litre of crystalloid, BP is 110/70 mmHg and the wheeze settles. The angiogram already shows a 95% proximal LAD stenosis with haziness.",
        options: [
          {
            text: "A single tryptase sample at 24 hours is enough",
            feedback:
              "Tryptase peaks early and falls over hours. A 24-hour sample alone serves only as the baseline for comparison.",
          },
          {
            text: "Take mast cell tryptase samples as soon as feasible, at about 1–2 hours and at 24 hours or later; record both agents and the reaction; and refer him to an allergy service",
            best: true,
            feedback:
              "Correct. Timed tryptase samples support the diagnosis. Precise documentation of the agents involved and allergy referral guide future procedures.",
          },
          {
            text: "No further action is needed because the reaction resolved",
            feedback:
              "A severe reaction to a second agent changes his future care. It must be documented, investigated and communicated.",
          },
          {
            text: "Record 'iodine allergy' and advise him to avoid shellfish",
            feedback:
              "Iodine is not the allergen, and shellfish is irrelevant. Record the specific agents and the nature of the reaction.",
          },
        ],
      },
      {
        "id": "contrast-premed-delay",
        "kind": "consequence",
        "info": "Four hours into the steroid regimen he has recurrent pain at rest with new dynamic ST depression in V2–V5 despite IV nitrate.",
        "prompt": "He has refractory ischaemia while you wait for premedication. What now?",
        "options": [
          {
            "text": "Abandon the waiting period and take him for immediate angiography with the prepared allergy plan",
            "best": true,
            "feedback": "Refractory ischaemia is a very-high-risk feature; premedication must not delay angiography, and a prepared team manages any reaction.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Increase the nitrate and complete the remaining nine hours of premedication",
            "feedback": "Premedication has weak evidence and does not justify delaying treatment of ongoing ischaemia.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give fibrinolysis because angiography cannot be done yet",
            "feedback": "Fibrinolysis is not indicated in NSTE-ACS and adds bleeding risk without benefit.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "contrast-slow-treatment",
        "kind": "consequence",
        "info": "Five minutes after antihistamine and steroid: BP 58/30 mmHg, SpO2 86%, audible stridor.",
        "prompt": "Anaphylaxis is progressing. What is the priority?",
        "options": [
          {
            "text": "IM adrenaline 0.5 mg now (repeat at 5 minutes), high-flow oxygen, rapid fluid, call the anaesthetist for the airway and consider an adrenaline infusion",
            "best": true,
            "feedback": "Adrenaline is the only first-line drug for anaphylaxis; antihistamines and steroids do not treat airway or circulatory collapse.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "A second dose of chlorphenamine and hydrocortisone",
            "feedback": "These act too slowly and do not reverse shock or airway oedema.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Nebulised salbutamol for the wheeze",
            "acceptable": true,
            "feedback": "Bronchodilators may help residual wheeze but only after adrenaline has been given.",
            "stateDelta": {
              "stability": -8
            }
          }
        ]
      },
    ],
    outcome:
      "With anaesthetic support, the senior operator completed PCI to the proximal LAD using minimal additional contrast. Tryptase was raised on the first sample and back to baseline at 24 hours. His records were updated with both agents and the reaction, and he was referred to the allergy clinic before discharge on DAPT and secondary prevention.",
    learningPoints: [
      "A previous contrast reaction changes how you prepare, not whether a very-high-risk patient gets urgent angiography.",
      "Change the contrast agent, brief the team and have adrenaline ready; premedication is optional and never a reason for delay.",
      "Anaphylaxis: IM adrenaline 0.5 mg, oxygen, fluid and positioning; antihistamines and steroids are not first-line.",
      "Fondaparinux-treated patients need a UFH bolus at PCI.",
      "Take timed tryptase samples, document the agents and refer to an allergy service.",
    ],
    refs: ["esc-acs-2023", "supplied-medmastery", "rcuk-anaphylaxis-2021"],
  },
];

// ===========================================================================
// Track export
// ===========================================================================
export const foundations: Track = {
  id: "foundations",
  order: 0,
  title: "Foundations",
  tagline: "From zero: the heart, the coronaries and the cath lab",
  description:
    "For doctors who have never done cardiology. The heart and coronary anatomy as an operator sees them, coronary physiology, the ECG in acute care, lab pharmacology, radiation and contrast safety, how the cath lab works, and the pathways that decide who needs angiography and when.",
  stage: 1,
  modules: [heart, coronaryAnatomy, physiology, ecg, pharmacology, safety, lab, pathways],
  cases,
};
