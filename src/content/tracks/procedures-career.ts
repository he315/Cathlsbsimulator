import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Module 1 — Temporary pacing
// ===========================================================================
const pacing: Module = {
  id: "bed-pacing",
  title: "Temporary cardiac pacing",
  stage: 4,
  summary:
    "When to pace, how to place a temporary transvenous wire under fluoroscopy, how to set and troubleshoot the box, and when to use transcutaneous or temporary-permanent pacing instead.",
  objectives: [
    "List the indications for temporary pacing, including AV block in inferior and anterior MI and peri-TAVI use.",
    "Choose an access route and a lead type, and position the lead in the right ventricle under fluoroscopy.",
    "Measure capture threshold and sensing, and set output and sensitivity with an adequate safety margin.",
    "Troubleshoot loss of capture, undersensing and oversensing.",
    "Recognise complications and use transcutaneous and temporary-permanent pacing appropriately.",
  ],
  lessons: [
    {
      id: "bed-pacing-indications",
      title: "Indications for temporary pacing",
      minutes: 7,
      refs: ["esc-pacing-2021", "esc-acs-2023", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "A temporary pacing wire is an electrode passed through a vein into the right ventricle and connected to an external pulse generator. It is a bridge: to recovery of conduction, to correction of a reversible cause, or to a permanent device. The 2021 ESC pacing guideline is clear that temporary transvenous pacing has real complications and should be avoided where possible, used for as short a time as possible, and reserved mainly for haemodynamically compromising bradycardia that does not respond to intravenous chronotropic drugs.",
        },
        {
          kind: "table",
          caption: "Common indications",
          head: ["Setting", "When to pace", "Comment"],
          rows: [
            ["Symptomatic bradycardia (complete heart block, Mobitz II, sinus arrest)", "Haemodynamic compromise despite atropine or other chronotropes", "Bridge to a permanent pacemaker if the cause is irreversible"],
            ["Inferior MI with AV block", "Only if haemodynamically compromised despite atropine and reperfusion", "Usually AV nodal, with a narrow escape rhythm that often responds to atropine; usually resolves within days"],
            ["Anterior MI with AV block", "Lower threshold to pace", "Usually infranodal, with a slow wide escape rhythm; reflects extensive infarction and carries a worse prognosis"],
            ["TAVI and balloon aortic valvuloplasty", "Rapid pacing during balloon inflation or valve deployment; protection against new high-degree AV block", "Many centres pace through the left ventricular guidewire; a venous wire may be left in higher-risk patients after the procedure per local protocol"],
            ["Drug toxicity or metabolic causes", "Compromising bradycardia from beta-blocker, calcium-channel blocker or digoxin toxicity, or hyperkalaemia", "Treat the cause first (for example the potassium); pacing may fail to capture in severe hyperkalaemia"],
            ["Pause-dependent polymorphic VT (torsade de pointes)", "Overdrive pacing when drugs and correction of electrolytes fail", "Shortens the QT and suppresses pauses"],
            ["Infected device removal", "Pacing-dependent patient awaiting reimplantation", "A temporary-permanent system is preferred for longer durations"],
          ],
        },
        {
          kind: "keypoints",
          title: "AV block after myocardial infarction",
          items: [
            "Reperfusion is the most important treatment; conduction often recovers once the artery is open.",
            "In inferior MI, give atropine first; pace only if hypotension or symptoms persist.",
            "Do not rush to a permanent pacemaker. The 2021 ESC pacing guideline advises waiting several days (at least 5) for AV block to resolve before deciding.",
            "Right ventricular infarction often accompanies inferior MI with heart block; give fluid, avoid nitrates, and remember that the loss of atrial contribution is poorly tolerated.",
          ],
        },
        {
          kind: "pitfalls",
          title: "Situations where a wire is not the answer",
          items: [
            "Asymptomatic bradycardia with a stable escape rhythm.",
            "Easily reversible causes, such as a vagal reaction or excess beta-blockade in a stable patient.",
            "Bundle branch block alone without high-grade AV block.",
            "Delaying primary PCI to insert a wire on the coronary care unit, when it can be placed in the lab under fluoroscopy at the start of the procedure.",
          ],
        },
        {
          kind: "pearl",
          text: "In the cath lab, a patient who becomes bradycardic during an RCA injection or after verapamil or adenosine can often be supported for a few seconds by asking them to cough forcefully while you correct the cause. Keep atropine drawn up and pacing kit nearby.",
        },
      ],
    },
    {
      id: "bed-pacing-insertion",
      title: "Access, lead choice and positioning under fluoroscopy",
      minutes: 8,
      refs: ["esc-pacing-2021", "hanna-pcm"],
      blocks: [
        {
          kind: "table",
          caption: "Venous access routes",
          head: ["Route", "Advantages", "Disadvantages"],
          rows: [
            ["Right internal jugular", "Short, direct path to the right ventricle; stable; patient can sit up; leaves the subclavian veins for a permanent device", "Needs ultrasound guidance; risk of carotid puncture"],
            ["Femoral vein", "Fast and familiar in the cath lab; compressible; no pneumothorax risk", "Less stable; higher infection and venous thrombosis risk; immobilises the patient"],
            ["Subclavian vein", "Stable", "Pneumothorax risk, non-compressible in anticoagulated patients; avoid the side planned for a permanent device (usually the left)"],
            ["Brachial or antecubital vein", "Easily compressible", "Unstable; the wire moves with the arm"],
          ],
        },
        {
          kind: "table",
          caption: "Lead types",
          head: ["Lead", "Features", "Use"],
          rows: [
            ["Balloon-tipped (flotation) bipolar", "Soft; the inflated balloon floats with blood flow into the right ventricle", "Can be placed with limited fluoroscopy; less stable once positioned"],
            ["Semi-rigid bipolar", "Stiffer; steerable with torque", "Placed under fluoroscopy; more stable; higher perforation risk if pushed hard"],
          ],
        },
        {
          kind: "steps",
          title: "Positioning under fluoroscopy",
          items: [
            { title: "Into the right atrium", detail: "Advance the lead into the right atrium. For a balloon-tipped lead, inflate the balloon in the IVC or right atrium and deflate it before final positioning." },
            { title: "Cross the tricuspid valve", detail: "Form a gentle loop against the lateral atrial wall and rotate the tip so it points towards the ventricle, or let the balloon float across. From the femoral route, a loop in the atrium is often needed." },
            { title: "Avoid the coronary sinus", detail: "A lead in the coronary sinus runs along the AV groove and points posteriorly towards the spine in the RAO or lateral view; it may capture the atrium or the left ventricle. Withdraw and redirect anteriorly." },
            { title: "Seat the tip", detail: "Place the tip at the right ventricular apex or low septum. In RAO the tip points anteriorly towards the apex; confirm in a second view (LAO) that it lies to the left of the spine near the apex." },
            { title: "Leave the right amount of slack", detail: "A gentle curve (a 'heel') in the right atrium keeps the tip in contact during deep inspiration. Too little slack and it pulls back; too much and it may perforate or prolapse into the outflow tract." },
            { title: "Test stability", detail: "Ask the patient to breathe deeply and cough while watching capture." },
            { title: "Secure and document", detail: "Suture the sheath, use a sterile sleeve, record threshold and settings, and obtain a 12-lead ECG and chest X-ray." },
          ],
        },
        {
          kind: "keypoints",
          title: "Reading the paced ECG",
          items: [
            "Right ventricular pacing produces a left bundle branch block pattern, with a superior axis from the apex.",
            "A right bundle branch block pattern suggests left ventricular capture: coronary sinus position, septal perforation, or a lead that has crossed a PFO or entered an artery.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing a semi-rigid lead against resistance; this is how the right ventricle is perforated.",
            "Accepting intermittent capture with the tip in the outflow tract or coronary sinus.",
            "Inserting a subclavian wire on the left in a patient who will need a left-sided permanent pacemaker.",
          ],
        },
        { kind: "sim", sim: "pacing", task: "From the right femoral vein, cross the tricuspid valve, avoid the coronary sinus and seat the lead at the right ventricular apex. Confirm the position in RAO and LAO and check that the paced QRS has a left bundle branch block pattern." },
      ],
    },
    {
      id: "bed-pacing-settings",
      title: "Threshold, sensing, troubleshooting and alternatives",
      minutes: 9,
      refs: ["esc-pacing-2021", "hanna-pcm"],
      blocks: [
        {
          kind: "steps",
          title: "Capture threshold",
          items: [
            { title: "Pace above the intrinsic rate", detail: "Set the rate 10 to 20 beats per minute above the patient's own rhythm so that every beat is paced." },
            { title: "Reduce the output", detail: "Lower the output (in mA) step by step while watching the ECG until capture is lost; the lowest output that still captures is the threshold." },
            { title: "Judge the threshold", detail: "A threshold below about 1 mA indicates good tip contact; a higher value suggests a poor position." },
            { title: "Set a safety margin", detail: "Set output at two to three times the threshold, many units using three times. Thresholds rise over the first days as the tissue reacts, so recheck at least daily." },
          ],
        },
        {
          kind: "steps",
          title: "Sensing",
          items: [
            { title: "Allow intrinsic beats", detail: "If the patient has an adequate underlying rhythm, reduce the pacing rate below it." },
            { title: "Find the sensing threshold", detail: "Increase the sensitivity number (in mV, making the box less sensitive) until the sense indicator stops flashing with each intrinsic beat and pacing begins." },
            { title: "Set the margin", detail: "Set the sensitivity to about half that value, making the box twice as sensitive as the minimum required." },
            { title: "Use demand mode", detail: "VVI pacing inhibits when an intrinsic beat is sensed. Asynchronous pacing (VOO) can deliver a spike on the T wave and trigger VF; use it only briefly when oversensing threatens a pacing-dependent patient." },
          ],
        },
        {
          kind: "table",
          caption: "Troubleshooting",
          head: ["Problem", "ECG appearance", "Likely causes", "Actions"],
          rows: [
            ["Loss of capture", "Spikes without a following QRS", "Displacement, rising threshold (oedema, ischaemia, hyperkalaemia, acidosis, drugs), perforation, loose connection", "Increase output to maximum; check connections and battery; 12-lead ECG and chest X-ray; reposition; echo if perforation suspected"],
            ["Undersensing", "Spikes at inappropriate times, including on T waves", "Poor contact, low intrinsic signal, sensitivity set too high in mV", "Make the box more sensitive (lower mV); reposition if needed"],
            ["Oversensing", "Pauses with no spike when pacing is expected", "Sensing T waves, muscle activity or interference", "Make the box less sensitive (higher mV); asynchronous mode briefly if pacing-dependent"],
            ["No output", "No spikes at all", "Disconnection, lead fracture, battery failure, oversensing", "Check every connection and the battery; transcutaneous backup; replace cable or box"],
            ["Diaphragmatic or chest-wall pacing, new chest pain or rub", "Hiccups or twitching with each spike", "Perforation or a lead near the phrenic nerve", "Reduce output; echo for effusion; reposition"],
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Group", "Examples"],
          rows: [
            ["Access", "Arterial puncture, haematoma, pneumothorax (subclavian or jugular)"],
            ["Lead", "Displacement, right ventricular perforation and tamponade, knotting, ventricular arrhythmia during manipulation"],
            ["Time-dependent", "Infection (higher with femoral access and longer duration), venous thrombosis"],
          ],
        },
        { kind: "h", text: "Transcutaneous pacing" },
        {
          kind: "p",
          text: "Transcutaneous pacing delivers current through adhesive pads (anterior-posterior or anterolateral). It is a bridge for minutes to hours until transvenous pacing or recovery. It is painful, so give analgesia and sedation. Increase the current until each spike is followed by a broad QRS and T wave, then confirm mechanical capture by feeling the femoral pulse or watching the arterial or oximetry trace; skeletal muscle twitching makes the carotid pulse unreliable.",
        },
        { kind: "h", text: "Temporary-permanent pacing" },
        {
          kind: "p",
          text: "When pacing will be needed for more than a short period, an active-fixation permanent lead can be screwed into the right ventricle (usually via the internal jugular vein) and connected to an external permanent pulse generator secured to the skin. Dislodgement is much less likely than with a standard temporary wire and patients can mobilise. The 2021 ESC pacing guideline supports this approach for prolonged temporary pacing.",
        },
        {
          kind: "pearl",
          text: "Every morning, ask three questions of a patient with a temporary wire: does it still capture with a safe margin, does it sense properly, and do they still need it?",
        },
        { kind: "sim", sim: "pacing", task: "Measure the capture threshold by lowering the output until capture is lost, set output at three times threshold, then find the sensing threshold and set sensitivity to half that value in VVI mode." },
      ],
    },
  ],
  quiz: [
    {
      id: "bed-q-pace-1",
      stem: "A man with an inferior STEMI has complete heart block with a narrow-complex escape at 44 bpm and BP 108/66 mmHg. He is alert. What is the most appropriate management?",
      options: [
        "Insert a temporary pacing wire on the coronary care unit before angiography",
        "Go straight to primary PCI, atropine ready and pads on; pace if compromised",
        "Implant a permanent pacemaker immediately after the PCI is completed",
        "Start an isoprenaline infusion and delay angiography until the rate improves",
        "Give IV verapamil to slow the escape rhythm and reduce oxygen demand",
      ],
      answer: 1,
      explanation:
        "AV block in inferior MI is usually nodal, with a narrow escape that often responds to atropine and resolves after reperfusion. A stable patient needs prompt reperfusion with backup ready, not a delay for a prophylactic wire. Permanent pacing decisions are deferred for several days to allow recovery.",
      difficulty: 2,
      refs: ["esc-pacing-2021", "esc-acs-2023"],
    },
    {
      id: "bed-q-pace-2",
      stem: "Why is AV block complicating anterior MI more concerning than AV block in inferior MI?",
      options: [
        "It always responds promptly to atropine and so rarely needs pacing",
        "Usually infranodal, with a slow, wide escape and a large infarct",
        "It is always transient and resolves within hours of reperfusion",
        "It never requires temporary pacing, whatever the escape rate",
        "It is caused by vagal overactivity arising from the infarcted anterior wall",
      ],
      answer: 1,
      explanation:
        "Anterior MI damages the septum and conducting system below the AV node, so the escape rhythm is slow, wide and unreliable, and the infarct is large. Vagally mediated, atropine-responsive, usually transient block is characteristic of inferior MI.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-pace-3",
      stem: "After placing a temporary wire, the paced QRS shows a right bundle branch block pattern. What does this suggest?",
      options: [
        "An ideal right ventricular apical position with stable capture",
        "LV capture, for example from a coronary sinus lead or perforation",
        "Atrial capture from a lead lying in the right atrial appendage",
        "Normal right ventricular outflow tract pacing from a high septal position",
        "Lead fracture with intermittent capture through the insulation",
      ],
      answer: 1,
      explanation:
        "Right ventricular pacing produces a left bundle branch block morphology. A right bundle branch block pattern means the left ventricle is depolarised first, which happens with a lead in the coronary sinus, a septal perforation, or a lead in the left heart. Check position in two views.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-pace-4",
      stem: "The capture threshold of a newly placed wire is 0.7 mA. What output is most appropriate?",
      options: ["0.7 mA", "1.0 mA", "About 2 to 3 mA (two to three times threshold)", "20 mA", "Turn output off and rely on sensing"],
      answer: 2,
      explanation:
        "Output should be set at two to three times the threshold to allow for its rise over the following days. Setting it at or just above threshold risks loss of capture as the threshold rises. Maximum output is unnecessary and may cause diaphragmatic or chest-wall stimulation.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-pace-5",
      stem: "A pacing-dependent patient has pauses on the monitor with no pacing spikes. Connections and battery are intact, and the pauses coincide with arm movement. What is the most likely problem and fix?",
      options: [
        "Loss of capture; increase the output until every spike captures",
        "Oversensing of muscle activity; make the box less sensitive",
        "Undersensing of intrinsic beats; make the box more sensitive",
        "Lead perforation through the RV wall; remove the wire",
        "Battery failure in the external box; replace the generator",
      ],
      answer: 1,
      explanation:
        "Absent spikes when pacing is expected mean the box is inhibited, here by sensing myopotentials. Raising the mV setting reduces sensitivity; asynchronous mode is a brief rescue if the patient is compromised. Increasing output does nothing when no spikes are delivered.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-pace-6",
      stem: "During transcutaneous pacing, the monitor shows a broad complex after each spike. How should mechanical capture be confirmed?",
      options: [
        "Palpate the carotid pulse during pacing",
        "Feel the femoral pulse or watch the arterial or oximetry trace",
        "Assume mechanical capture from the paced ECG complexes",
        "Increase the current to the maximum the transcutaneous unit can deliver",
        "Ask the patient whether they can feel each paced impulse",
      ],
      answer: 1,
      explanation:
        "Muscle twitching from transcutaneous pacing can mimic a carotid pulse, so the femoral pulse or a pressure or oximetry trace is more reliable. Electrical capture on the ECG does not guarantee effective cardiac contraction.",
      difficulty: 1,
      refs: ["esc-pacing-2021"],
    },
    {
      id: "bed-q-pace-7",
      stem: "A pacing-dependent patient needs pacing for about 10 days after extraction of an infected permanent system. What is the preferred approach?",
      options: [
        "A femoral balloon-tipped temporary wire, replaced if it dislodges",
        "Transcutaneous pacing with sedation until the infection clears",
        "Active-fixation lead via the jugular vein on an external generator",
        "An isoprenaline infusion titrated to keep the rate above 50 bpm",
        "Immediate implantation of a new permanent system on the same side as before",
      ],
      answer: 2,
      explanation:
        "For prolonged temporary pacing, an active-fixation lead connected to an external generator is much more stable than a standard temporary wire and allows mobilisation. A femoral wire for 10 days carries high dislodgement, infection and thrombosis risks, and a new permanent system should wait until infection is cleared.",
      difficulty: 2,
      refs: ["esc-pacing-2021"],
    },
  ],
  sims: [
    { sim: "pacing", task: "Place a temporary wire from the femoral vein at the right ventricular apex, then test threshold and sensing and set a safe VVI configuration." },
    { sim: "pacing", task: "Troubleshoot: the patient shows spikes without capture. Work through output, connections, position and threshold until reliable capture returns." },
  ],
  caseIds: ["bed-case-chb-inferior-stemi"],
};

// ===========================================================================
// Module 2 — Pericardiocentesis
// ===========================================================================
const pericardiocentesis: Module = {
  id: "bed-pericardiocentesis",
  title: "Pericardiocentesis",
  stage: 4,
  summary:
    "Recognising tamponade, choosing the approach, performing a safe echo- or fluoroscopy-guided drainage, managing the drain, and handling tamponade in the lab after perforation.",
  objectives: [
    "Recognise tamponade clinically and on echo, and state the indications and contraindications for pericardiocentesis.",
    "Choose between subxiphoid, apical and parasternal approaches.",
    "Perform the procedure step by step and confirm intrapericardial position before dilating.",
    "Anticipate and manage complications, including right ventricular puncture and coronary or internal mammary laceration.",
    "Manage a pericardial drain and in-lab tamponade after coronary perforation.",
  ],
  lessons: [
    {
      id: "bed-peri-indications-echo",
      title: "Tamponade: recognition and indications",
      minutes: 7,
      refs: ["esc-pericardial-2015", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "The pericardium holds a small volume of fluid. Because its pressure-volume relation is steep once its reserve is used up, the rate of accumulation matters more than the volume: a slowly growing effusion can reach over a litre before causing tamponade, whereas 100 to 200 mL of blood from an acute perforation can cause collapse. Tamponade occurs when pericardial pressure rises enough to impair filling of the heart, first the low-pressure right-sided chambers.",
        },
        {
          kind: "table",
          caption: "Clinical and echo features of tamponade",
          head: ["Domain", "Features"],
          rows: [
            ["Clinical", "Tachycardia, hypotension, raised JVP, pulsus paradoxus (an inspiratory fall in systolic pressure of more than 10 mmHg), muffled heart sounds; Beck's triad is often incomplete"],
            ["Haemodynamic", "Raised and equalised diastolic pressures in the right atrium, right ventricle and pulmonary capillary wedge"],
            ["Echo chamber collapse", "Right atrial collapse (prolonged collapse is more specific), right ventricular diastolic collapse"],
            ["Echo flow and veins", "Exaggerated respiratory variation in mitral and tricuspid inflow; dilated IVC with little respiratory collapse"],
            ["Echo effusion size (ESC 2015 semi-quantitative)", "Small under 10 mm, moderate 10 to 20 mm, large over 20 mm of end-diastolic echo-free space"],
          ],
        },
        {
          kind: "pearl",
          text: "Tamponade is a clinical and haemodynamic diagnosis supported by echo. A small effusion can cause tamponade if it accumulates quickly, and a large chronic effusion may not.",
        },
        {
          kind: "p",
          text: "Pulsus paradoxus reflects ventricular interdependence. With the heart confined by a tense pericardium, the inspiratory increase in right ventricular filling pushes the septum towards the left ventricle, reducing left ventricular filling and stroke volume. On an arterial line this appears as a clear fall in systolic pressure with each inspiration.",
        },
        {
          kind: "table",
          caption: "Common causes of effusion seen by cardiologists",
          head: ["Setting", "Examples"],
          rows: [
            ["Iatrogenic", "Coronary perforation, pacing or biopsy perforation, structural and electrophysiology procedures, after cardiac surgery"],
            ["Inflammatory and infective", "Viral or idiopathic pericarditis, bacterial (including tuberculosis), autoimmune disease"],
            ["Neoplastic", "Lung and breast cancer, lymphoma, mesothelioma"],
            ["Other", "Renal failure, hypothyroidism, after myocardial infarction, aortic dissection"],
          ],
        },
        {
          kind: "keypoints",
          title: "Indications (ESC 2015)",
          items: [
            "Cardiac tamponade.",
            "Symptomatic moderate to large effusions not responding to medical therapy.",
            "Suspected bacterial or neoplastic effusion where fluid analysis will guide treatment.",
          ],
        },
        {
          kind: "table",
          caption: "Contraindications and special situations",
          head: ["Situation", "Guidance"],
          rows: [
            ["Aortic dissection with haemopericardium", "A major contraindication: drainage can accelerate bleeding; emergency surgery"],
            ["Free-wall rupture after MI", "Surgery; drainage only as a bridge if needed to survive transfer"],
            ["Uncorrected coagulopathy, anticoagulation, platelets below about 50 × 10⁹/L", "Relative contraindications; correct where possible unless life-threatening"],
            ["Small, posterior or loculated effusions", "Relative contraindications; percutaneous access may be unsafe; consider surgical drainage"],
            ["Purulent pericarditis", "Drainage plus surgical input; may need a surgical window"],
          ],
        },
        {
          kind: "list",
          items: [
            "Regional tamponade after cardiac surgery: a loculated collection can compress a single chamber, so echo may look unimpressive while the patient is shocked. Consider transoesophageal echo or CT.",
            "Low-pressure tamponade in hypovolaemia: jugular pressure may not be raised. Fluid resuscitation can unmask it.",
            "The ESC 2015 guideline proposes a scoring system to triage the urgency of drainage when the patient is not in extremis.",
          ],
        },
      ],
    },
    {
      id: "bed-peri-technique",
      title: "Approaches and technique",
      minutes: 8,
      refs: ["esc-pericardial-2015", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Pericardiocentesis should be guided by echo or fluoroscopy, and ideally both in the cath lab. Blind landmark-guided drainage is reserved for peri-arrest situations where no imaging is available.",
        },
        {
          kind: "table",
          caption: "Approaches",
          head: ["Approach", "Entry", "Advantages", "Risks"],
          rows: [
            ["Subxiphoid", "Between the xiphoid and left costal margin, needle at a shallow angle towards the left shoulder", "Extrapleural; familiar; good under fluoroscopy in the lab", "Right ventricular puncture, liver injury; longer path in obese patients"],
            ["Apical", "Near the cardiac apex, where echo shows the largest fluid pocket", "Short path when fluid collects apically", "Left ventricular puncture, pneumothorax"],
            ["Parasternal", "Left parasternal intercostal space where echo shows fluid", "Short path for anterior effusions", "Internal mammary artery laceration (it runs roughly 1 to 2 cm from the sternal edge), pneumothorax"],
          ],
        },
        {
          kind: "pearl",
          text: "With echo guidance, choose the entry point where the fluid is deepest and closest to the skin with no lung or liver in between, and note the angle of the probe; the needle follows the same trajectory.",
        },
        {
          kind: "steps",
          title: "Procedure",
          items: [
            { title: "Prepare", detail: "Consent where possible; monitoring; aseptic technique; local anaesthetic; correct coagulopathy if time allows. Have atropine and a defibrillator ready." },
            { title: "Plan with imaging", detail: "Echo to mark the site and depth; in the lab, a lateral or LAO view shows the cardiac border." },
            { title: "Advance the needle", detail: "Advance slowly with gentle continuous aspiration. Pass over the upper border of the rib for intercostal approaches to avoid the neurovascular bundle under the rib above." },
            { title: "Confirm position before dilating", detail: "Agitated saline injected through the needle appears in the pericardial space on echo, not inside a chamber. On fluoroscopy, a soft J-wire should loop around the cardiac silhouette outside the heart borders, rather than heading into the right ventricular outflow tract or pulmonary artery. A small contrast injection pools and layers in the pericardium rather than washing out." },
            { title: "Place the drain", detail: "Advance the wire well into the pericardium, dilate over it, and place a pigtail drain (commonly 6 to 8 Fr). Remove the wire." },
            { title: "Drain and measure", detail: "Aspirate, recording volume and appearance; send fluid for analysis. Measure intrapericardial and right atrial pressures before and after if a diagnostic question exists." },
            { title: "Secure", detail: "Suture the drain, attach a closed drainage system and repeat the echo." },
          ],
        },
        {
          kind: "keypoints",
          title: "Fluid analysis when the cause is unknown",
          items: [
            "Cell count, protein, LDH and glucose; Gram stain and culture, including tuberculosis studies; cytology.",
            "If bloody, compare the haematocrit with venous blood; a near-identical value raises concern for intracardiac aspiration or brisk active bleeding.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Dilating before confirming the wire is in the pericardium; dilating into the right ventricle can be catastrophic.",
            "Using a steep needle angle from the subxiphoid approach, which heads towards the liver or diaphragm.",
            "Relying on whether bloody fluid clots to decide its origin; fresh haemopericardium from perforation can clot.",
            "Draining a very large chronic effusion rapidly; pericardial decompression syndrome is rare but serious, and many units drain about 1 litre initially and the remainder gradually.",
          ],
        },
        { kind: "sim", sim: "pericardiocentesis", task: "Choose an echo-guided entry site for a large circumferential effusion, advance the needle with continuous aspiration, confirm intrapericardial position with agitated saline, and place a pigtail drain over a wire." },
      ],
    },
    {
      id: "bed-peri-complications-lab",
      title: "Complications, drain care and tamponade in the lab",
      minutes: 8,
      refs: ["esc-pericardial-2015", "brilakis-manual-pci", "seattle-complications-2020"],
      blocks: [
        {
          kind: "table",
          caption: "Complications of pericardiocentesis",
          head: ["Complication", "Prevention", "Management"],
          rows: [
            ["Right ventricular puncture or laceration", "Imaging guidance; confirm position before dilating", "If only the needle entered, withdraw; if a dilator or drain is in the ventricle, leave it in place and call the surgeon"],
            ["Coronary artery or vein laceration", "Avoid steep, deep approaches; stop once fluid is reached", "Echo for reaccumulation; surgery if bleeding continues"],
            ["Internal mammary artery injury", "Parasternal entry away from the artery; colour Doppler can identify it", "Compression is ineffective; may need embolisation or surgery"],
            ["Pneumothorax", "Echo to exclude lung in the path", "Chest drain if significant"],
            ["Arrhythmia", "Gentle technique", "Vagal bradycardia: atropine; VT: withdraw and treat"],
            ["Liver or abdominal organ injury", "Shallow subxiphoid angle", "Surgical review if bleeding"],
            ["Pericardial decompression syndrome", "Gradual drainage of large chronic effusions", "Supportive care"],
          ],
        },
        { kind: "h", text: "Drain care" },
        {
          kind: "list",
          items: [
            "Record output regularly; aspirate or allow free drainage according to local protocol.",
            "Keep the drain until output falls to a small volume over 24 hours (commonly below about 25 to 30 mL) and echo shows no significant reaccumulation.",
            "Prolonged drainage reduces recurrence in some aetiologies, but each extra day adds infection risk.",
            "Repeat echo after removal, and again before discharge.",
          ],
        },
        { kind: "h", text: "Tamponade in the lab after coronary perforation" },
        {
          kind: "p",
          text: "Tamponade from perforation is fast, the patient is fully anticoagulated, and the effusion is blood. The lab is the best place in the hospital to deal with it: fluoroscopy, echo, haemodynamic monitoring and an arterial line are already in place.",
        },
        {
          kind: "steps",
          title: "Sequence",
          items: [
            { title: "Control the source if it is known", detail: "If the perforation is still being treated, keep the balloon inflated over it while draining." },
            { title: "Drain", detail: "Subxiphoid puncture under fluoroscopy (lateral or LAO view) with echo if available; confirm with wire course or a contrast puff." },
            { title: "Keep the drain in", detail: "Ongoing output tells you whether the leak is sealed." },
            { title: "Autotransfusion", detail: "Where local practice allows, aspirated pericardial blood can be returned through a femoral venous sheath, reducing the need for transfusion while the leak is sealed." },
            { title: "Find and seal the source", detail: "Angiography of all vessels instrumented, including distal wire positions and collaterals; covered stent, coils or other embolisation as appropriate." },
            { title: "Escalate", detail: "Persistent bleeding despite these measures needs surgery." },
          ],
        },
        {
          kind: "pearl",
          text: "Late hypotension after a clean-looking case, including on the ward hours later, is a distal wire perforation until echo says otherwise.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming prior CABG protects against tamponade; loculated collections may not be drainable percutaneously.",
            "Removing the drain in the lab once the patient stabilises, losing the monitor of ongoing bleeding.",
            "Giving protamine with retrograde CTO equipment still in a donor vessel.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "bed-q-peri-1",
      stem: "Which echo finding is most specific for haemodynamically significant tamponade?",
      options: [
        "A 15 mm posterior effusion in diastole",
        "Right ventricular diastolic collapse",
        "A small anterior epicardial fat pad",
        "Mild mitral regurgitation on colour Doppler",
        "Concentric left ventricular hypertrophy",
      ],
      answer: 1,
      explanation:
        "Right ventricular diastolic collapse shows that pericardial pressure exceeds right ventricular diastolic pressure. Effusion size alone does not define tamponade, because the rate of accumulation matters. An epicardial fat pad can mimic an effusion but has no haemodynamic significance.",
      difficulty: 1,
      refs: ["esc-pericardial-2015"],
    },
    {
      id: "bed-q-peri-2",
      stem: "A patient with chest pain, hypotension and a pericardial effusion is found to have a type A aortic dissection. What is the correct management?",
      options: [
        "Immediate pericardiocentesis with full drainage of the effusion",
        "Emergency surgery; pericardiocentesis is a major contraindication",
        "Pericardiocentesis to stabilise the patient, followed by CT",
        "Intravenous thrombolysis for a presumed acute coronary artery occlusion",
        "Observation in the coronary care unit with serial echo",
      ],
      answer: 1,
      explanation:
        "Haemopericardium from aortic dissection is treated surgically. Draining the pericardium can raise aortic pressure and accelerate bleeding, which is why the ESC guideline lists dissection as a major contraindication. Observation risks death.",
      difficulty: 2,
      refs: ["esc-pericardial-2015"],
    },
    {
      id: "bed-q-peri-3",
      stem: "During subxiphoid pericardiocentesis in the lab, blood is aspirated through the needle. What should you do before passing a dilator?",
      options: [
        "Dilate at once, since aspirated blood confirms the pericardial space",
        "Confirm position: wire looping round the heart, or bubbles in the effusion",
        "Wait a few minutes to see whether the aspirated blood clots in the syringe or not",
        "Advance the needle a little further to be sure it is well inside the sac",
        "Inject 20 mL of contrast rapidly through the needle and film it",
      ],
      answer: 1,
      explanation:
        "Blood can come from the pericardium or a cardiac chamber, so position must be confirmed before dilating. A wire looping outside the heart borders or bubbles in the pericardial space confirm it. Clotting is unreliable, especially in acute haemopericardium.",
      difficulty: 1,
      refs: ["esc-pericardial-2015"],
    },
    {
      id: "bed-q-peri-4",
      stem: "Which structure is most at risk with a left parasternal approach close to the sternal edge?",
      options: ["Liver", "Internal mammary artery", "Inferior vena cava", "Left atrial appendage", "Phrenic nerve"],
      answer: 1,
      explanation:
        "The internal mammary artery runs about 1 to 2 cm lateral to the sternal edge and can be lacerated by a parasternal needle. The liver is the main organ at risk from a subxiphoid approach.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-peri-5",
      stem: "A pericardial drain placed for tamponade after coronary perforation continues to drain blood briskly. What does this mean and what should you do?",
      options: [
        "This is normal post-drainage output; remove the drain and repeat echo",
        "The leak is not sealed: find and seal it, autotransfuse, involve surgeons",
        "Give a second dose of heparin to keep the drain from clotting off",
        "Clamp the drain so that the pericardium tamponades the bleeding vessel from outside",
        "Send the patient to the ward and repeat the echocardiogram tomorrow",
      ],
      answer: 1,
      explanation:
        "Ongoing brisk output shows active bleeding, so the source must be found and sealed with a covered stent, embolisation or surgery. Clamping the drain simply recreates tamponade, and removing it loses your monitor.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "seattle-complications-2020"],
    },
    {
      id: "bed-q-peri-6",
      stem: "When is it generally appropriate to remove a pericardial drain?",
      options: [
        "Immediately after the first aspiration, once the pressure has fallen",
        "When 24-hour output is small and echo shows no reaccumulation",
        "After exactly 7 days, regardless of the output from the drain",
        "When the patient is pain-free and mobilising around the ward",
        "When the drained fluid becomes clear rather than blood-stained",
      ],
      answer: 1,
      explanation:
        "Drains are removed when output is minimal (commonly below about 25 to 30 mL per 24 hours) and echo confirms no reaccumulation. Fixed durations ignore the clinical picture and add infection risk, and early removal risks recurrence.",
      difficulty: 1,
      refs: ["esc-pericardial-2015"],
    },
    {
      id: "bed-q-peri-7",
      stem: "Six weeks after CABG, a patient is hypotensive. Transthoracic echo shows only a small posterior collection, but there is compression of the left atrium. What is the best interpretation?",
      options: [
        "Tamponade is excluded because the effusion is small on the transthoracic study",
        "Regional (loculated) tamponade is possible; consider TOE or CT and surgery",
        "Immediate subxiphoid pericardiocentesis is the safest and quickest option",
        "This is low-pressure tamponade and needs only intravenous fluid",
        "The finding is an imaging artefact from the sternal wires",
      ],
      answer: 1,
      explanation:
        "After cardiac surgery, adhesions can confine blood to a pocket that compresses a single chamber, causing regional tamponade with a small-looking effusion. Small posterior loculated collections are often unsafe to approach percutaneously, so surgical drainage is usually needed.",
      difficulty: 3,
      refs: ["esc-pericardial-2015"],
    },
  ],
  sims: [
    { sim: "pericardiocentesis", task: "Perform a subxiphoid pericardiocentesis under fluoroscopy in a hypotensive patient after coronary perforation: confirm the wire loops around the cardiac silhouette, place a pigtail drain and follow the blood pressure as you aspirate." },
  ],
  caseIds: ["bed-case-cto-tamponade"],
};

// ===========================================================================
// Module 3 — Large-bore access and closure
// ===========================================================================
const accessClosure: Module = {
  id: "bed-access-closure",
  title: "Large-bore access and vascular closure",
  stage: 4,
  summary:
    "Planning and obtaining large-bore femoral access, choosing and using closure devices including pre-close, rescuing failed closure, and achieving patent radial haemostasis.",
  objectives: [
    "Plan large-bore access with CT and ultrasound, and puncture the common femoral artery precisely.",
    "Describe how collagen-plug, suture-mediated and large-bore plug closure devices work and when not to use them.",
    "Perform the pre-close technique and set up for bailout with a crossover wire.",
    "Manage closure failure with balloon tamponade, covered stents or surgery.",
    "Achieve patent radial haemostasis and reduce radial artery occlusion.",
  ],
  lessons: [
    {
      id: "bed-largebore-planning",
      title: "Planning and obtaining large-bore access",
      minutes: 8,
      refs: ["scct-tavi-2019", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Large-bore access usually means arterial sheaths of roughly 12 Fr and above (some definitions start at 10 Fr), as used for TAVI, microaxial flow pumps, VA-ECMO and some complex PCI. The arteriotomy is too large to close by compression alone, and vascular complications are a leading cause of morbidity after these procedures. Most can be prevented at the planning stage.",
        },
        {
          kind: "table",
          caption: "What to assess before large-bore access",
          head: ["Feature", "Why it matters", "How to assess"],
          rows: [
            ["Minimal lumen diameter along the iliofemoral route", "A sheath larger than the vessel stretches or ruptures it; complications rise when the sheath's outer diameter exceeds the vessel's minimal diameter", "CT angiography (centreline measurements)"],
            ["Calcification", "Circumferential or anterior-wall calcium prevents closure devices working and resists dilatation", "CT; ultrasound at the puncture site"],
            ["Tortuosity", "Kinks can straighten with stiff wires, but severe tortuosity with calcium is risky", "CT"],
            ["Height of the femoral bifurcation and the inguinal ligament", "Defines the safe landing zone for puncture", "CT; ultrasound; fluoroscopy of the femoral head"],
            ["Depth of the artery", "Deep arteries make closure and compression harder", "CT; ultrasound"],
          ],
        },
        {
          kind: "steps",
          title: "Precise common femoral puncture",
          items: [
            { title: "Locate the femoral head", detail: "Fluoroscopy marks the middle of the femoral head; the common femoral artery usually overlies it, below the inguinal ligament and above the bifurcation." },
            { title: "Use ultrasound", detail: "Identify the common femoral artery, its bifurcation and any anterior-wall calcium. Puncture the anterior wall in a healthy segment, avoiding the back wall." },
            { title: "Micropuncture", detail: "A small-gauge needle and 0.018-inch wire limit damage if the first pass is not ideal." },
            { title: "Confirm with angiography", detail: "A femoral angiogram through the micropuncture sheath or the first sheath in an ipsilateral oblique view separates the superficial femoral and profunda arteries and shows the puncture height. Move if the puncture is high, low or at the bifurcation." },
            { title: "Prepare for bailout", detail: "Place a crossover wire from the contralateral femoral or a radial artery into the access-side iliac system, so that a balloon or covered stent can be delivered quickly if closure fails." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Pre-close with suture devices before dilating to the large sheath (see the next lesson).",
            "Dilate sequentially over a stiff wire; never force a sheath against resistance.",
            "Check distal limb perfusion while large-bore sheaths are in place, especially for prolonged mechanical support; a distal perfusion cannula may be needed.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing by surface landmarks alone; the inguinal crease is a poor guide, particularly in obese patients.",
            "Accepting a puncture at the bifurcation, which makes closure devices unreliable.",
            "Forgetting the access plan until the end of the case.",
          ],
        },
        { kind: "sim", sim: "procedure", task: "Using fluoroscopy, mark the middle of the femoral head, puncture the common femoral artery with a micropuncture needle, and confirm on angiography that the puncture is below the inferior epigastric artery and above the bifurcation." },
      ],
    },
    {
      id: "bed-closure-devices",
      title: "Closure devices and the pre-close technique",
      minutes: 8,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "oxford-cath-handbook"],
      blocks: [
        {
          kind: "p",
          text: "Femoral sheaths can be removed with manual or mechanical compression once the ACT has fallen (below 180 seconds in Brilakis's manual; below 150–200 seconds, or after 3–4 hours, in the Oxford handbook; below 175 seconds in the Medmastery handbook; by local protocol), but this is slow and keeps the patient flat. Closure devices allow earlier mobilisation and are essential for large-bore access. Each device needs specific training, initially on a model and then under supervision.",
        },
        {
          kind: "table",
          caption: "Closure device families (principles; check each device's instructions for use for sizes and restrictions)",
          head: ["Family", "How it works", "Points to note"],
          rows: [
            ["Collagen plug", "An intra-arterial anchor and an extravascular collagen plug sandwich the arteriotomy, held by a suture", "Used for standard small-bore sheaths; the anchor stays in the vessel until absorbed, so check the instructions for re-puncture restrictions; can rarely cause occlusion or embolisation of the anchor in small or diseased arteries"],
            ["Suture-mediated", "Needles deploy a suture through the arterial wall around the arteriotomy; a knot is pushed down to close it", "Leaves no intravascular material; can be used before the sheath is upsized (pre-close); immediate re-access possible"],
            ["Large-bore plug", "An intravascular toggle and an extravascular collagen plug designed for large arteriotomies", "Used at the end of large-bore procedures as an alternative to pre-close; needs a depth measurement"],
          ],
        },
        {
          kind: "steps",
          title: "Pre-close for large-bore access",
          items: [
            { title: "Place a small sheath first", detail: "After confirming puncture height, place a standard sheath and exchange it over a wire for the first suture device." },
            { title: "Deploy two sutures", detail: "Deploy one suture device rotated about 30 degrees to one side and a second rotated about 30 degrees to the other (often described as 10 and 2 o'clock). Leave the sutures untied and secured outside the field." },
            { title: "Upsize", detail: "Reinsert the wire, then dilate and insert the large-bore sheath." },
            { title: "Close", detail: "At the end, withdraw the sheath over a wire and tie down the sutures one after the other while keeping the wire in place. Remove the wire only when haemostasis is secure; if it fails, reinsert a sheath over the wire and use a further device or bailout." },
          ],
        },
        {
          kind: "keypoints",
          title: "When not to use a closure device",
          items: [
            "Puncture at or below the bifurcation. Above the inguinal ligament (a high stick) avoid the collagen plug: Brilakis's closure algorithm prefers a suture device there, although in another section he advises avoiding any closure device after a high stick.",
            "Heavy calcification or significant disease at the puncture site.",
            "A small artery relative to the device.",
            "Suspected infection at the site.",
            "Always look at the femoral angiogram first.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep a wire in the artery until you are certain the arteriotomy is closed. A wire is the difference between a simple reinsertion and an emergency.",
        },
        {
          kind: "steps",
          title: "Manual compression of a standard femoral sheath",
          items: [
            { title: "Wait for the ACT", detail: "Remove the sheath once the ACT has fallen to your unit's threshold." },
            { title: "Compress the arterial puncture", detail: "The arterial hole lies above (cranial to) the skin puncture. Press firmly with the fingertips over the artery, against the femoral head." },
            { title: "Hold long enough", detail: "Maintain occlusive then gradually lighter pressure, typically for at least 10 to 20 minutes for a standard sheath and longer for larger sheaths or anticoagulated patients." },
            { title: "Check the leg", detail: "Confirm distal pulses during and after compression, then apply a dressing and follow local bed-rest guidance." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Compressing over the skin puncture rather than the arterial puncture, which lies higher.",
            "Deploying a closure device without first checking the femoral angiogram.",
            "Removing the wire before haemostasis is confirmed after pre-close.",
          ],
        },
      ],
    },
    {
      id: "bed-closure-failure-radial",
      title: "Closure failure and radial haemostasis",
      minutes: 7,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "matrix-2015", "pancholy-compression-duration-2012"],
      blocks: [
        { kind: "h", text: "When closure fails" },
        {
          kind: "steps",
          title: "Escalating bailout",
          items: [
            { title: "Compress", detail: "Manual compression above the arteriotomy while you plan; for large-bore holes this only buys time." },
            { title: "Add a device", detail: "If a wire is still in place, an additional suture or plug device may complete closure." },
            { title: "Balloon tamponade from above", detail: "Through the crossover wire, inflate a peripheral balloon in the iliac or common femoral artery at low pressure proximal to the arteriotomy. This stops bleeding immediately ('dry' field) and may allow sutures to be tightened or the hole to seal." },
            { title: "Covered stent", detail: "Seal persistent bleeding or a dissection with a covered stent in the external iliac or common femoral artery, avoiding the femoral bifurcation where possible." },
            { title: "Surgery", detail: "Open repair if endovascular options fail, if the vessel is occluded, or when stenting the common femoral artery would compromise future access." },
          ],
        },
        {
          kind: "table",
          caption: "Recognising closure-related problems",
          head: ["Problem", "Clues", "Action"],
          rows: [
            ["Bleeding", "Ooze or pulsatile bleeding, expanding haematoma, falling blood pressure", "Compression, balloon tamponade, extra device, covered stent"],
            ["Vessel narrowing or occlusion", "Cold or pulseless leg, loss of distal Doppler signal", "Angiography; balloon angioplasty or stent; surgery"],
            ["Retroperitoneal bleed", "Hypotension, back or flank pain, falling haemoglobin", "CT; balloon tamponade and covered stent"],
          ],
        },
        {
          kind: "p",
          text: "Large-bore venous access (for example for transcatheter mitral or tricuspid procedures, or ECMO cannulae) is often closed with a subcutaneous figure-of-eight suture or with suture-mediated devices, according to local practice.",
        },
        { kind: "h", text: "Patent radial haemostasis" },
        {
          kind: "p",
          text: "Radial access is the default for most coronary work because it reduces bleeding. The main long-term complication is radial artery occlusion, which removes the artery as a future access route, dialysis fistula site or bypass conduit. Occlusion is largely preventable.",
        },
        {
          kind: "steps",
          title: "Radial band technique",
          items: [
            { title: "Position the band", detail: "Place the compression cushion over the arterial puncture, which lies slightly proximal to the skin puncture. Too distal a position does not compress the arteriotomy." },
            { title: "Inflate and remove the sheath", detail: "Inflate to the volume advised by the manufacturer as the sheath is withdrawn." },
            { title: "Deflate to patency", detail: "Release air until bleeding just stays controlled and a pulse or plethysmography trace returns distal to the band; this is patent haemostasis." },
            { title: "Deflate early and gradually", detail: "Reduce pressure in stages and take the band off within 1–2 hours (Brilakis limits radial compression to 2 hours or less to lower the risk of radial artery occlusion), following local protocol and checking for bleeding each time." },
            { title: "Check patency", detail: "Before discharge, confirm radial flow, for example with plethysmography while compressing the ulnar artery." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Adequate heparin during the procedure reduces radial occlusion.",
            "A left radial band designed for the right arm may need to be placed upside down.",
            "If bleeding persists despite the band, apply a manual blood-pressure cuff proximally inflated above systolic briefly to stop inflow while the band is repositioned, then elevate the arm.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the band fully inflated for hours 'to be safe', occluding the artery.",
            "Discharging without checking radial flow.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "bed-q-acc-1",
      stem: "On pre-TAVI CT, the minimal lumen diameter of the right common iliac artery is smaller than the outer diameter of the planned sheath, with circumferential calcification. What is the best response?",
      options: [
        "Proceed via the right side with sequential dilatation",
        "Consider the contralateral side or alternative access, or vessel preparation, in the heart team",
        "Use a larger sheath for better support",
        "Proceed and close with a collagen plug",
        "Ignore calcification if the diameter is borderline",
      ],
      answer: 1,
      explanation:
        "A sheath larger than a heavily calcified vessel risks rupture or dissection. The plan should change: the other side, an alternative route, or planned vessel preparation such as lithotripsy, decided in advance. Sequential dilatation does not make a calcified ring stretch safely.",
      difficulty: 2,
      refs: ["scct-tavi-2019"],
    },
    {
      id: "bed-q-acc-2",
      stem: "Where should the common femoral artery ideally be punctured for large-bore access?",
      options: [
        "At the inguinal skin crease, which marks the femoral head",
        "Over the mid femoral head, below the epigastric, above the bifurcation",
        "At the femoral bifurcation, where the vessel is widest",
        "Just above the inguinal ligament in the external iliac artery, where it is larger",
        "In the superficial femoral artery below the bifurcation",
      ],
      answer: 1,
      explanation:
        "The common femoral artery over the femoral head can be compressed against bone and is wide enough for closure devices. A high puncture risks retroperitoneal bleeding, and a low one risks pseudoaneurysm, fistula and failed closure. The skin crease is an unreliable landmark.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "bed-q-acc-3",
      stem: "In the pre-close technique, when are the suture-mediated devices deployed?",
      options: [
        "After the large-bore sheath is removed at the end of the case, over a wire",
        "Before dilating up to the large sheath, usually two devices",
        "Only if manual compression fails after the large-bore sheath is out",
        "After the patient returns to the ward, once the ACT has fallen",
        "Before the femoral puncture, through a separate skin incision",
      ],
      answer: 1,
      explanation:
        "Pre-close places the sutures while the hole is still small, then leaves them untied while the large sheath is used; they are tied at the end over a wire. Deploying a suture device after large-bore sheath removal is not how the system is designed and usually fails.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "bed-q-acc-4",
      stem: "After a TAVI, the sutures are tied but there is brisk pulsatile bleeding from the femoral site. A crossover wire is in place from the contralateral side. What is the best immediate step?",
      options: [
        "Pull the crossover wire out and apply firm manual compression to both groins",
        "Inflate a low-pressure balloon above the arteriotomy via the crossover wire",
        "Give protamine to reverse the heparin and wait for the bleeding to slow",
        "Send the patient to the ward with a pressure dressing and hourly observations",
        "Immediate open surgical repair in the lab without any further imaging",
      ],
      answer: 1,
      explanation:
        "Balloon tamponade from above stops bleeding at once and creates time for an additional device, a covered stent or a planned surgical repair. Removing the crossover wire throws away the bailout route, and a pressure dressing alone will not control a large-bore arterial bleed.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "bed-q-acc-5",
      stem: "Which practice most reduces radial artery occlusion after transradial PCI?",
      options: [
        "Maximal band inflation for 6 hours to guarantee haemostasis",
        "Patent haemostasis with distal flow kept, plus adequate heparin",
        "Avoiding heparin altogether to reduce bleeding at the puncture",
        "Using the largest sheath available so that the vessel stays dilated",
        "Manual compression for 30 minutes after removing the radial band",
      ],
      answer: 1,
      explanation:
        "Maintaining flow through the radial artery during haemostasis and giving adequate anticoagulation are the main preventive measures. Prolonged occlusive compression and large sheaths increase occlusion, and avoiding heparin increases thrombosis.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "bed-q-acc-6",
      stem: "A femoral angiogram before closure shows the sheath entering at the bifurcation of the superficial femoral and profunda arteries. What is the best plan?",
      options: [
        "Use a collagen-plug closure device as usual and check the pulse",
        "No closure device; compress manually once the ACT allows, then monitor",
        "Deploy two suture-mediated devices to ensure the puncture is sealed",
        "Leave the sheath in place for 48 hours until the artery heals around it",
        "Place a covered stent across the bifurcation to seal the arteriotomy",
      ],
      answer: 1,
      explanation:
        "Closure devices are unreliable and can cause vessel compromise when the puncture is at the bifurcation, so manual compression after the ACT has fallen is safer. A low puncture also raises pseudoaneurysm risk, so the site needs monitoring. Prolonged sheath dwell increases complications.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Obtain femoral access for a large-bore case: fluoroscopy to the femoral head, micropuncture of the common femoral artery, and a sheath angiogram confirming suitability for pre-close." },
  ],
};

// ===========================================================================
// Module 4 — Endomyocardial biopsy and foreign-body retrieval
// ===========================================================================
const biopsyRetrieval: Module = {
  id: "bed-biopsy-retrieval",
  title: "Endomyocardial biopsy and foreign-body retrieval",
  stage: 4,
  summary:
    "When and how to take an endomyocardial biopsy safely, and the principles and tools for retrieving embolised devices and fragments.",
  objectives: [
    "State the clinical scenarios where endomyocardial biopsy changes management.",
    "Describe right ventricular septal biopsy technique and sample handling.",
    "Recognise and manage biopsy complications, especially perforation.",
    "Choose retrieval tools (snares, baskets, forceps, balloon and twisted-wire techniques) for intravascular foreign bodies.",
    "Apply the principle of creating and grasping a free end.",
  ],
  lessons: [
    {
      id: "bed-emb",
      title: "Endomyocardial biopsy",
      minutes: 8,
      refs: ["esc-hf-2021", "hanna-pcm", "cooper-emb-2007"],
      blocks: [
        {
          kind: "p",
          text: "Endomyocardial biopsy obtains small fragments of myocardium, usually from the right ventricular side of the interventricular septum, using a bioptome passed through a vein. It is the only way to make some diagnoses with certainty, but it is invasive and samples only a few millimetres of a heart that may be patchily affected. The 2021 ESC heart failure guideline supports considering biopsy in rapidly progressive heart failure despite standard therapy when a specific diagnosis can only be confirmed in myocardial tissue.",
        },
        {
          kind: "table",
          caption: "When biopsy is most likely to change management",
          head: ["Scenario", "Diagnoses sought", "Why it matters"],
          rows: [
            ["New-onset heart failure over days to a few weeks with haemodynamic compromise", "Fulminant lymphocytic myocarditis, giant cell myocarditis, eosinophilic myocarditis", "Giant cell and eosinophilic myocarditis need specific immunosuppression and early consideration of mechanical support or transplant"],
            ["Heart failure over weeks to months with a dilated ventricle and new ventricular arrhythmias, high-grade AV block or no response to treatment", "Giant cell myocarditis, cardiac sarcoidosis", "Specific therapy and device decisions"],
            ["Heart transplant", "Rejection surveillance and investigation of graft dysfunction", "Guides immunosuppression"],
            ["Suspected infiltrative or storage disease when non-invasive tests are inconclusive", "Amyloidosis (including typing), sarcoidosis, Fabry disease, haemochromatosis", "Different treatments by type; non-invasive imaging has reduced the need for biopsy in many cases"],
            ["Suspected cardiac tumour", "Tissue type", "Selected cases where it changes management"],
          ],
        },
        {
          kind: "steps",
          title: "Right ventricular septal biopsy",
          items: [
            { title: "Access", detail: "Right internal jugular vein under ultrasound (the classic route), or the femoral vein with a long, pre-shaped sheath directed across the tricuspid valve. Continuous ECG and blood-pressure monitoring." },
            { title: "Cross into the right ventricle", detail: "Advance the bioptome (or sheath) into the right atrium and across the tricuspid valve under fluoroscopy, keeping clear of the chordae." },
            { title: "Direct the tip at the septum", detail: "Orient the jaws towards the interventricular septum, away from the thin free wall and the apex. Confirm orientation in two projections or with echo." },
            { title: "Take the sample", detail: "Open the jaws just short of the wall, advance to gentle contact (ventricular ectopy is common), close the jaws, and withdraw with a gentle tug." },
            { title: "Repeat", detail: "Take several fragments (commonly at least four or five) from different septal sites to reduce sampling error." },
            { title: "Handle samples correctly", detail: "Agree in advance with the pathologist: formalin for light microscopy, and other fixatives or frozen samples for electron microscopy, molecular or viral studies as the question requires." },
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Notes"],
          rows: [
            ["Perforation and tamponade", "The most serious; avoid the free wall and apex; have echo and a pericardiocentesis set ready"],
            ["Arrhythmia", "Ventricular ectopy and brief VT are common during sampling; bundle branch block or AV block occasionally"],
            ["Tricuspid valve injury", "Chordal damage causing tricuspid regurgitation, more likely with repeated biopsies after transplant"],
            ["Access complications", "Carotid puncture, pneumothorax, haematoma"],
            ["Embolism", "A particular concern with left ventricular biopsy"],
          ],
        },
        {
          kind: "p",
          text: "Left ventricular biopsy, taken retrogradely across the aortic valve, is used in some centres for disease predominantly affecting the left ventricle. It carries additional risks of systemic embolism and is best done where there is experience.",
        },
        {
          kind: "pearl",
          text: "Before you biopsy, know exactly what question the sample must answer and how it must be fixed. A technically perfect biopsy placed in the wrong medium is a wasted procedure.",
        },
      ],
    },
    {
      id: "bed-foreign-body",
      title: "Foreign-body retrieval",
      minutes: 7,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Intravascular foreign bodies include lost stents, guidewire fragments, fractured central venous or port catheters, embolised septal or appendage occluders, filter components and pacing lead fragments. Most should be removed if this can be done safely, because they can cause thrombosis, embolism, arrhythmia, perforation or infection. Very small distal coronary fragments are sometimes better left or pinned with a stent.",
        },
        {
          kind: "table",
          caption: "Retrieval tools",
          head: ["Tool", "Best for", "Notes"],
          rows: [
            ["Single-loop snare", "Grasping a free end in a straight segment", "Loop at right angles to the shaft; choose a diameter close to the vessel"],
            ["Multi-loop snare", "Objects in larger vessels or chambers", "Interlaced loops increase the chance of capture when alignment is poor"],
            ["Retrieval basket", "Compact objects without a free end", "Less common in coronary work"],
            ["Forceps or bioptome", "Grasping fragments in the right heart", "Risk of injury to the wall and valves"],
            ["Balloon technique", "Objects still on a wire, such as a lost stent", "Inflate a small balloon beyond or within the object and withdraw"],
            ["Twisted wires", "Coronary objects when a snare fails", "Two or three wires rotated together entangle the object"],
            ["Pigtail or deflectable catheter", "Repositioning a fragment to expose a free end", "Hook the object and drag it into a better position for snaring"],
          ],
        },
        {
          kind: "steps",
          title: "General approach",
          items: [
            { title: "Locate and characterise", detail: "Fluoroscopy, sometimes CT or echo: where is it, how long is it, does it have a free end, is it embedded?" },
            { title: "Choose the route", detail: "Venous objects (right heart, pulmonary arteries) through the femoral vein; arterial objects through the femoral artery. Use a sheath large enough to accept the object, usually larger than the routine sheath." },
            { title: "Create a free end if necessary", detail: "If both ends are lodged, use a pigtail or deflectable catheter to pull the object into a position with an exposed end." },
            { title: "Grasp near the end", detail: "Snare close to the free end so the object folds neatly into the sheath, rather than grasping the middle and forming a wide loop." },
            { title: "Withdraw into the sheath", detail: "Pull the snare and object into the sheath together; if it will not enter, remove the sheath with the object and secure haemostasis." },
            { title: "Check for injury", detail: "Repeat imaging of the path the object took." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling a snare through the tricuspid valve apparatus and entangling the chordae.",
            "Trying to withdraw a large object through a small radial sheath.",
            "Losing track of an object's position between runs; keep fluoroscopy on during manipulation.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the exit before you grasp: the sheath must be large enough, close enough and in a straight enough line for the object to come out.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "bed-q-bx-1",
      stem: "A 35-year-old develops heart failure over 10 days with cardiogenic shock, a non-dilated left ventricle and new ventricular tachycardia. Coronary angiography is normal. Why is endomyocardial biopsy valuable?",
      options: [
        "To confirm coronary artery disease that the angiogram has missed",
        "To find giant cell or eosinophilic myocarditis needing specific treatment",
        "To measure left ventricular pressure directly through the bioptome",
        "To rule out pericarditis as the cause of the ventricular tachycardia",
        "Biopsy has no role in this scenario because it will not change management",
      ],
      answer: 1,
      explanation:
        "Fulminant heart failure with ventricular arrhythmia raises concern for giant cell or eosinophilic myocarditis, which are treated with specific immunosuppression and may need mechanical support or transplant. Biopsy is the only way to confirm them. The normal angiogram has already excluded coronary disease.",
      difficulty: 2,
      refs: ["esc-hf-2021", "cooper-emb-2007"],
    },
    {
      id: "bed-q-bx-2",
      stem: "From which site is a right heart endomyocardial biopsy normally taken?",
      options: ["Right ventricular free wall", "Right ventricular apex", "Interventricular septum", "Right atrial appendage", "Right ventricular outflow tract"],
      answer: 2,
      explanation:
        "The septum is thicker and safer to sample than the free wall or apex, where perforation is more likely. Directing the bioptome towards the septum and confirming orientation in two views or on echo is the key safety step.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-bx-3",
      stem: "Which is the most serious acute complication of endomyocardial biopsy?",
      options: [
        "Frequent ventricular ectopy during sampling",
        "RV perforation with tamponade",
        "Transient right bundle branch block after the bioptome",
        "A vasovagal reaction with bradycardia",
        "A small neck haematoma at the puncture",
      ],
      answer: 1,
      explanation:
        "Perforation with tamponade can be fatal and is why echo and a pericardiocentesis set should be available. Ventricular ectopy is common and usually harmless, and transient conduction changes are minor by comparison.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-bx-4",
      stem: "A transplant recipient has had many surveillance biopsies and now has new severe tricuspid regurgitation. What is the most likely mechanism?",
      options: ["Rejection of the tricuspid valve", "Chordal injury from repeated bioptome passage", "Pulmonary embolism", "Endocarditis is the only possibility", "Left ventricular dysfunction"],
      answer: 1,
      explanation:
        "Repeated passage of the bioptome across the tricuspid valve can tear chordae and cause flail leaflets with significant regurgitation. Endocarditis should be considered, but iatrogenic chordal damage is the characteristic complication of repeated biopsy.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "bed-q-bx-5",
      stem: "A fractured port catheter fragment lies across the right atrium into the right ventricle, with neither end free. What is the best first step towards retrieval?",
      options: [
        "Snare the middle of the fragment and pull it straight back to the sheath",
        "Hook and move it with a pigtail so one end is free, then snare that end",
        "Leave it permanently in all cases, because retrieval risks are high",
        "Retrieve it through a radial artery approach with a long snare",
        "Pull it out with forceps through the tricuspid valve without imaging",
      ],
      answer: 1,
      explanation:
        "Snares need a free end. Repositioning the fragment with a pigtail or deflectable catheter creates one, and grasping near the end lets it fold into the sheath. Grasping the middle forms a wide loop that is hard to withdraw, and a venous fragment is approached from the femoral vein, not the radial artery.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "bed-q-bx-6",
      stem: "A snared embolised stent will not enter the 6 Fr femoral sheath. What should you do?",
      options: [
        "Pull harder on the snare until the stent folds into the sheath",
        "Remove sheath and snared stent together, or upsize the sheath over a wire",
        "Release the stent into the iliac artery and leave it there permanently as it is",
        "Inflate a balloon inside the sheath to trap the stent against its wall",
        "Cut the snare at the hub and leave it attached to the stent",
      ],
      answer: 1,
      explanation:
        "If an object will not enter the sheath, remove the sheath and object together, or upsize the sheath, rather than forcing it, which can strip the object or damage the vessel. Releasing it creates a second embolisation problem.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
  ],
};

// ===========================================================================
// Module 5 — Becoming an independent operator
// ===========================================================================
const independence: Module = {
  id: "bed-independence",
  title: "Becoming an independent operator",
  stage: 4,
  summary:
    "The road from supervised trainee to independent interventionalist: curriculum and logbook, decision-making and consent, knowing when to stop, radiation protection and ergonomics, human factors, reflection and wellbeing.",
  objectives: [
    "Describe a competency-based progression from supervised to independent practice, as set out in the EAPCI core curriculum.",
    "Use a logbook and structured case progression to build experience deliberately.",
    "Make and document sound decisions with the heart team, and take valid consent under UK law and GMC guidance.",
    "Set stopping rules and recognise when to call for help.",
    "Protect yourself and your team from radiation and musculoskeletal injury.",
    "Use checklists, team communication and reflective practice, and look after your own wellbeing.",
  ],
  lessons: [
    {
      id: "bed-ind-curriculum",
      title: "From supervised trainee to independent operator",
      minutes: 7,
      refs: ["eapci-curriculum", "supplied-medmastery", "oxford-cath-handbook"],
      blocks: [
        {
          kind: "p",
          text: "Interventional training is competency-based. The EAPCI core curriculum sets out the knowledge, technical skills and professional behaviours expected of an interventional cardiologist, and expects progression to be supervised, assessed and documented rather than measured only in years or case numbers. In practice you move through stages of entrustment, from observing to operating with a trainer scrubbed, to operating with a trainer available, to independent practice.",
        },
        {
          kind: "table",
          caption: "A typical training pathway (not the EAPCI levels; the app's Competencies section uses the EAPCI 2020 levels I to V, taught in hb-the-operator-entrustment)",
          head: ["Stage", "What the trainee does", "Supervision"],
          rows: [
            ["1 Foundations", "Learns anatomy, physiology, equipment and lab safety; assists", "Direct"],
            ["2 Diagnostic operator", "Performs diagnostic angiography and right heart catheterisation", "Direct, moving to indirect"],
            ["3 PCI under supervision", "First operator in PCI with the trainer scrubbed", "Direct"],
            ["4 Independent PCI", "Performs routine elective and acute PCI, including on-call primary PCI", "Trainer available, not scrubbed"],
            ["5 Complex PCI, structural, MCS", "Left main, CTO, atherectomy, mechanical support, structural procedures", "Further subspecialty training"],
          ],
        },
        {
          kind: "table",
          caption: "A typical case progression",
          head: ["Phase", "Typical cases"],
          rows: [
            ["Early", "Diagnostic angiography via radial access; simple single-lesion elective PCI; pressure-wire studies"],
            ["Middle", "NSTEMI culprit PCI; staged multivessel PCI; provisional bifurcation stenting; primary PCI with a consultant"],
            ["Late", "Calcium modification; imaging-guided optimisation; protected left main under supervision; complication management with a trainer"],
            ["Subspecialty", "CTO, mechanical circulatory support, structural interventions"],
          ],
        },
        {
          kind: "keypoints",
          title: "The logbook",
          items: [
            "Record every case: date, role (first or second operator), indication, access, lesion complexity, devices, result, complications and outcome.",
            "Keep it anonymised and secure; never store patient-identifiable data outside approved systems.",
            "Review it with your trainer regularly to identify gaps (for example no bifurcation or no femoral access cases) and plan exposure.",
            "EAPCI certification has a theoretical Part A (a written multiple-choice test on the core curriculum) and a practical Part B; check current national and EAPCI requirements.",
          ],
        },
        {
          kind: "list",
          items: [
            "Workplace-based assessments such as directly observed procedural skills and case-based discussions document competence and provide feedback.",
            "Simulation, including this app, builds procedural rehearsal and complication drills that are hard to obtain safely on patients.",
            "Independence is maintained, not achieved once: regular activity, participation in national audit, and continuing education keep skills current.",
          ],
        },
        {
          kind: "keypoints",
          title: "What a competent interventionalist must cover",
          items: [
            "Patient selection, indications and appropriateness, including heart-team working.",
            "Pharmacology of antithrombotic and vasoactive drugs.",
            "Imaging and physiology: angiographic interpretation, pressure-wire assessment, intravascular imaging.",
            "Devices and techniques, from access to stent optimisation.",
            "Recognition and management of complications.",
            "Radiation protection for patients and staff.",
            "Communication, consent, teamwork, audit and professional behaviour.",
          ],
        },
        {
          kind: "pearl",
          text: "Volume is necessary but not sufficient. Fifty thoughtfully debriefed cases teach more than a hundred done on autopilot. After each case, ask what you would do differently.",
        },
      ],
    },
    {
      id: "bed-ind-decisions-consent",
      title: "Decision-making, the heart team and consent",
      minutes: 8,
      refs: ["esc-revasc-2018", "esc-ccs-2024", "supplied-medmastery", "gmc-consent-2020", "montgomery-2015"],
      blocks: [
        {
          kind: "p",
          text: "Technical skill matters only if it is applied to the right patient. Every PCI decision should rest on a clear indication (symptoms, ischaemia or prognosis), an anatomical assessment, the patient's comorbidity and frailty, and the patient's own goals. When there is a reasonable surgical or medical alternative, the decision belongs to the heart team and the patient, not to the operator alone.",
        },
        {
          kind: "table",
          caption: "Ad hoc PCI or heart-team discussion?",
          head: ["Reasonable to proceed ad hoc", "Discuss with the heart team first"],
          rows: [
            ["Clear indication with simple anatomy suited to PCI", "Left main or complex multivessel disease"],
            ["Patient informed beforehand that PCI may follow angiography and has consented", "Diabetes with multivessel disease where surgery may offer better outcomes"],
            ["Acute coronary syndrome culprit lesion", "Uncertain indication or borderline benefit"],
            ["Plan agreed in advance with the patient and, where needed, the heart team", "Patient not prepared for, or not consented to, PCI at the same sitting"],
          ],
        },
        { kind: "h", text: "Consent in UK practice" },
        {
          kind: "p",
          text: "Since the Montgomery judgment (2015), doctors in the UK must take reasonable care to ensure patients are aware of any material risks and of reasonable alternatives, including no treatment. A risk is material if a reasonable person in the patient's position would attach significance to it, or if the doctor should reasonably know that this particular patient would. GMC guidance on decision making and consent (2020) frames consent as a dialogue rather than a signature.",
        },
        {
          kind: "steps",
          title: "Taking consent for PCI",
          items: [
            { title: "Right person, right time", detail: "Consent should be taken by someone able to perform the procedure or trained to consent for it, ideally in advance so the patient has time to think and ask questions." },
            { title: "Check capacity", detail: "If the patient lacks capacity, act in their best interests under the relevant legislation and involve those close to them." },
            { title: "Explain purpose and options", detail: "Why PCI is proposed, what it is expected to achieve, and the alternatives: medical therapy, surgery, or no treatment." },
            { title: "Discuss material risks", detail: "Death, myocardial infarction, stroke, bleeding, damage to the coronary or access arteries, emergency surgery, contrast reaction, contrast-associated kidney injury and radiation, plus procedure-specific risks (for example perforation in CTO or atherectomy). Quote your unit's audited figures where possible; for elective PCI the risks of death, stroke and emergency surgery are each well under 1%." },
            { title: "Anticipate extensions", detail: "If you might treat additional lesions or use particular devices, discuss this in advance." },
            { title: "Confirm and document", detail: "Reconfirm on the day, invite final questions, and document the discussion as well as the form." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "In emergencies such as primary PCI, consent is necessarily brief; a clear explanation and verbal agreement are usually all that is possible.",
            "If the patient has reservations, defer, discuss and document. Never hurry a patient into consent.",
            "A patient may withdraw consent at any point, including on the table.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Consenting a sedated patient on the table for an extended procedure that was never discussed.",
            "Quoting generic risks that do not reflect the patient's own risk (for example CTO perforation or kidney injury in severe CKD).",
            "Treating the signature as the consent.",
          ],
        },
      ],
    },
    {
      id: "bed-ind-stop-help",
      title: "Knowing when to stop and when to call for help",
      minutes: 6,
      refs: ["cto-consensus-2019", "brilakis-manual-pci", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Stopping is a decision, not a failure. The patient came for a benefit; once the risks of continuing outweigh the likely gain, the right result is to stop safely and plan again. Deciding the stopping rules before the case removes the pressure to make that judgement while tired and invested.",
        },
        {
          kind: "table",
          caption: "Common prompts to stop or pause",
          head: ["Domain", "Prompt"],
          rows: [
            ["Patient", "Haemodynamic instability, persistent ischaemia, a complication, distress or inability to lie still"],
            ["Contrast", "Volume approaching your pre-set ceiling, often expressed as a multiple of eGFR (for example two to three times, with CTO operators sometimes using about 3.7 times), especially in CKD"],
            ["Radiation", "Reference air kerma approaching about 5 Gy, unless success is imminent"],
            ["Time and fatigue", "Very long procedures, operator or team fatigue, end-of-list pressure"],
            ["Progress", "No meaningful progress after a change of strategy"],
            ["Risk shift", "Findings that change the balance, such as a dissection threatening a large branch"],
          ],
        },
        {
          kind: "keypoints",
          title: "When to call for help",
          items: [
            "Any complication you have not managed independently before.",
            "Haemodynamic deterioration or arrest.",
            "When you need a technique you have not yet performed alone.",
            "When you are uncertain; a second opinion is cheap.",
            "Who: a senior interventionalist, the anaesthetist, the cardiac surgeon, the imaging team. Call early and say clearly what you need.",
          ],
        },
        {
          kind: "list",
          items: [
            "Failing safely means leaving the patient no worse off: no dissection extended into a large branch, no unsealed perforation, no excessive contrast or radiation.",
            "A staged second attempt, referral to an operator with more experience, or a surgical opinion are all legitimate outcomes.",
            "Treat each procedure as part of the patient's long-term care, not as a contest.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Sunk-cost reasoning: 'we have used so much contrast already, we must finish'.",
            "Continuing because stopping feels like a public failure.",
            "Doing a case for the logbook rather than for the patient.",
          ],
        },
        {
          kind: "steps",
          title: "Stopping well",
          items: [
            { title: "Leave the vessel safe", detail: "Take final injections in several views with a wide field: no extending dissection, no perforation, no compromised side branch, and every wire tip accounted for." },
            { title: "Hand over clearly", detail: "Tell the recovery team what was attempted, what was found, and what to watch for (for example a late effusion after CTO work)." },
            { title: "Explain to the patient", detail: "Describe what was achieved and why you stopped, and what happens next." },
            { title: "Plan the next step", detail: "Review the films with colleagues; consider a different strategy, a more experienced operator, intravascular imaging, surgery or medical therapy." },
          ],
        },
        {
          kind: "pearl",
          text: "Before scrubbing, say the stopping rules aloud to the team: maximum contrast, maximum radiation, the point at which you will call for help. The team will remind you when you reach them.",
        },
      ],
    },
    {
      id: "bed-ind-radiation-ergonomics",
      title: "Operator radiation protection and ergonomics",
      minutes: 8,
      refs: ["radiation-consensus-2018", "supplied-medmastery", "icrp-118-2012", "irr-2017", "klein-occupational-hazards-2015"],
      blocks: [
        {
          kind: "p",
          text: "The operator's dose comes almost entirely from radiation scattered by the patient. Scatter is greatest on the side where the X-ray tube is and falls with the square of the distance from the patient. Every measure that reduces patient dose also reduces staff dose.",
        },
        {
          kind: "formula",
          name: "Inverse square law",
          expr: "Dose at distance d ∝ 1 / d²",
          note: "Moving from 0.5 m to 1 m from the scatter source cuts the dose to about a quarter.",
        },
        {
          kind: "pearl",
          text: "The habits that protect your eyes and thyroid are the same habits that protect the patient's skin: collimate, keep the detector close, use low frame rates, and do not run cine when fluoroscopy will do.",
        },
        {
          kind: "table",
          caption: "Reducing operator dose",
          head: ["Principle", "Practical measures"],
          rows: [
            ["Time", "Minimise fluoroscopy and cine; low frame rates; use stored fluoroscopy or last-image hold instead of cine where adequate"],
            ["Distance", "Step back during cine; extension tubing or an injector; double the distance and scatter falls to about a quarter"],
            ["Shielding", "Ceiling-suspended shield positioned close to the patient; table-mounted lead skirt; radiation-absorbing drapes; apron and thyroid collar; lead glasses with side shields"],
            ["Geometry", "Tube under the table; detector close to the patient; tight collimation; minimal magnification; avoid steep LAO and steep angulations where possible, because they bring the tube and its scatter towards the operator's side"],
            ["Monitoring", "Wear dosimeters as instructed (typically one under the apron and one at collar level); review your doses"],
          ],
        },
        {
          kind: "keypoints",
          title: "Long-term risks",
          items: [
            "Cataract: radiation-induced lens opacities, typically posterior subcapsular, are well documented in interventional staff. The occupational lens dose limit is 20 mSv per year (ICRP recommendation adopted in UK regulations).",
            "Cancer risk is stochastic; reports of left-sided brain tumours in interventionalists have raised concern although causation is not established.",
            "Pregnant staff should declare their pregnancy; the fetal dose must be kept below 1 mSv for the remainder of the pregnancy, and the radiation protection adviser will help plan work and monitoring.",
          ],
        },
        { kind: "h", text: "Ergonomics" },
        {
          kind: "p",
          text: "Years of standing in heavy lead cause neck, back, hip and knee problems: in a 2014 survey of US interventional cardiologists, 49.4% reported at least one orthopaedic injury and 9.3% had had a health-related period of absence.",
        },
        {
          kind: "list",
          items: [
            "Use well-fitted, two-piece aprons that load the hips rather than the shoulders; lighter composite materials reduce weight.",
            "Set the table at a height that lets you work with a straight back; put the monitors directly in front at eye level.",
            "Avoid prolonged twisting; reposition yourself rather than your spine.",
            "Take short breaks between long cases; core strength and fitness help.",
            "Where available, suspended radiation protection systems remove the load of the apron.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the ceiling shield parked at the side of the room.",
            "Standing close to the patient during cine runs when you do not need to.",
            "Leaving dosimeters in the locker.",
          ],
        },
      ],
    },
    {
      id: "bed-ind-human-factors-wellbeing",
      title: "Checklists, reflection and wellbeing",
      minutes: 7,
      refs: ["eapci-curriculum", "natssips2-2023", "lobo-sleep-survey-2019"],
      blocks: [
        {
          kind: "p",
          text: "Safe labs depend on reliable systems as much as on skilled operators. In the UK, the National Safety Standards for Invasive Procedures (NatSSIPs) require local standards for every invasive procedure, built around team briefing, sign in, time out, sign out and debriefing.",
        },
        {
          kind: "table",
          caption: "What a cath lab checklist should capture",
          head: ["Moment", "Items"],
          rows: [
            ["Team brief", "The list, the plan for each case, anticipated difficulties and complications, equipment needed, stopping rules"],
            ["Sign in", "Identity, consent, allergies (including contrast), renal function, anticoagulant and antiplatelet status, access plan"],
            ["Time out", "Procedure, side and site, devices and implants available in the right sizes, complication kit located, radiation plan"],
            ["Sign out", "Procedure performed, implants recorded, specimens labelled, closure, post-procedure instructions including antiplatelet plan"],
            ["Debrief", "What went well, what did not, equipment or system issues to report"],
          ],
        },
        {
          kind: "keypoints",
          title: "Team behaviours",
          items: [
            "Structured handover and requests (for example SBAR: situation, background, assessment, recommendation).",
            "Closed-loop communication for drugs and critical actions.",
            "Graded assertiveness so any team member can escalate concern, for example: 'I'm concerned... I'm uncomfortable... this is a safety issue.'",
            "Keep conversation to the task during critical steps such as stent or valve deployment.",
          ],
        },
        { kind: "h", text: "Morbidity and mortality, reflection and candour" },
        {
          kind: "list",
          items: [
            "Morbidity and mortality meetings exist for learning, not blame. Present the facts, the decisions and the system factors, and agree actions with named owners.",
            "Write reflective entries after significant cases and complications; focus on what you learned and what you will change.",
            "Every clinician has a professional duty of candour: tell the patient openly when something has gone wrong, apologise, explain what will happen next and record the conversation. In England there is also a statutory organisational duty.",
          ],
        },
        { kind: "h", text: "Wellbeing" },
        {
          kind: "p",
          text: "A serious complication affects the operator as well as the patient. Distress, intrusive replay of the event and loss of confidence are common reactions, sometimes described as the second-victim experience. Talk to a trusted colleague or mentor, use peer support, and do not judge yourself only by your worst case.",
        },
        {
          kind: "list",
          items: [
            "Protect sleep around on-call primary PCI rotas; in one survey of cardiovascular staff (7.2% response), 58% of respondents linked sleep deprivation with difficulty concentrating and 8.6% reported an adverse event they thought was likely related.",
            "Eat and drink during long lists.",
            "Find a mentor who will tell you the truth about your cases and your career.",
            "Recognise burnout early in yourself and others, and use occupational health and confidential support services.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating the checklist as a box-ticking exercise read by one person while others carry on working.",
            "Skipping the debrief when the list overruns; it is often the only chance to capture what went wrong.",
            "Operating again immediately after a major complication while still shaken; hand over or take a pause if you can.",
          ],
        },
        {
          kind: "pearl",
          text: "Independence is not working alone. The best independent operators are those who ask for help early, debrief honestly and keep learning from their own cases.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "bed-q-ind-1",
      stem: "What best describes the approach to interventional training in the EAPCI core curriculum?",
      options: [
        "A fixed number of years in training, after which the trainee is independent",
        "Competency-based progression with supervised, assessed, documented skills",
        "A minimum number of cases logged, which on its own confirms competence",
        "Self-certification by the trainee once they feel confident to operate alone",
        "Simulation alone, with real cases reserved for after certification",
      ],
      answer: 1,
      explanation:
        "The curriculum describes competencies across knowledge, skills and professional behaviours and expects supervised, assessed and documented progression. Case numbers and time in training matter, but on their own they do not demonstrate competence.",
      difficulty: 1,
      refs: ["eapci-curriculum"],
    },
    {
      id: "bed-q-ind-2",
      stem: "A 64-year-old with diabetes and three-vessel disease including the proximal LAD is found at diagnostic angiography for stable angina. He has not discussed revascularisation options. What is most appropriate?",
      options: [
        "Proceed with ad hoc multivessel PCI while he is on the table",
        "Stop after angiography and discuss in the heart team, then with the patient",
        "Stent the proximal LAD now and discuss the rest later",
        "Refer directly for CABG without discussion",
        "Discharge on medical therapy without follow-up",
      ],
      answer: 1,
      explanation:
        "Multivessel disease with diabetes is a scenario where surgery may offer better outcomes, so a heart-team discussion and an informed patient decision should come before revascularisation. Ad hoc PCI here bypasses that process and the patient's consent to the alternatives.",
      difficulty: 2,
      refs: ["esc-revasc-2018"],
    },
    {
      id: "bed-q-ind-3",
      stem: "Under the Montgomery judgment, which risks must be discussed when consenting for PCI?",
      options: [
        "Only risks that occur in more than 1% of PCI procedures in the unit's audit",
        "Risks a reasonable person in the patient's position, or this patient, would see as significant",
        "Only the risk of death, because lesser complications are expected and accepted",
        "Whatever a responsible body of interventional cardiologists would normally disclose to a patient",
        "None at all, provided the patient signs the standard printed consent form",
      ],
      answer: 1,
      explanation:
        "Montgomery replaced the doctor-centred standard with a patient-centred test of materiality, which includes rare but serious risks and those of particular importance to the individual. A fixed percentage threshold and the older professional-practice standard are no longer the test in UK law.",
      difficulty: 2,
      refs: ["montgomery-2015"],
    },
    {
      id: "bed-q-ind-4",
      stem: "Two hours into a CTO attempt, the contrast volume is approaching three times the eGFR and the reference air kerma is 4.8 Gy. There has been no progress since changing strategy. What is the best decision?",
      options: [
        "Continue, because so much has been invested already",
        "Stop, document, and plan a staged attempt or referral",
        "Switch to a stiffer wire and continue for another hour",
        "Increase the frame rate to see better",
        "Give more heparin and continue",
      ],
      answer: 1,
      explanation:
        "Contrast and radiation are near common stopping thresholds and there is no progress, so the balance favours stopping and planning again. Continuing because of what has already been spent is sunk-cost reasoning and exposes the patient to kidney injury and radiation skin injury.",
      difficulty: 2,
      refs: ["cto-consensus-2019"],
    },
    {
      id: "bed-q-ind-5",
      stem: "Which projection change most increases scatter dose to an operator standing on the patient's right?",
      options: [
        "Moving from steep LAO to RAO",
        "Moving to steep LAO angulation",
        "Raising the table",
        "Bringing the detector closer to the patient",
        "Collimating tightly",
      ],
      answer: 1,
      explanation:
        "In steep LAO, the X-ray tube moves towards the patient's right, the side where the operator stands, so scatter towards the operator increases. Bringing the detector closer, raising the table and collimating all reduce dose.",
      difficulty: 2,
      refs: ["radiation-consensus-2018"],
    },
    {
      id: "bed-q-ind-6",
      stem: "What is the occupational dose limit for the lens of the eye recommended by ICRP and adopted in UK regulations?",
      options: ["1 mSv per year", "6 mSv per year", "20 mSv per year", "150 mSv per year", "500 mSv per year"],
      answer: 2,
      explanation:
        "The limit was reduced to 20 mSv per year after evidence that lens opacities occur at lower doses than previously thought. 150 mSv per year was the older limit, which is why older guidance can mislead. 1 mSv relates to the fetal dose for the remainder of a declared pregnancy.",
      difficulty: 2,
      refs: ["radiation-consensus-2018", "icrp-118-2012", "irr-2017"],
    },
    {
      id: "bed-q-ind-7",
      stem: "During a busy list, a nurse notices that the patient's documented contrast allergy has not been mentioned. In a well-functioning lab, when should this have been identified?",
      options: [
        "After the procedure, at sign out",
        "At sign in or time out, before the procedure starts",
        "Only if the patient reacts",
        "At the morbidity and mortality meeting",
        "It is the patient's responsibility to mention it",
      ],
      answer: 1,
      explanation:
        "Allergies are checked at sign in and confirmed at time out so that prophylaxis, an alternative agent and resuscitation readiness can be arranged before contrast is given. Discovering it at sign out or after a reaction is too late.",
      difficulty: 1,
      refs: ["natssips2-2023"],
    },
    {
      id: "bed-q-ind-8",
      stem: "After a perforation that required a covered stent and pericardial drainage, what is the operator's most appropriate next step with the patient?",
      options: [
        "Avoid discussing it unless the patient or family ask about it directly",
        "Explain openly what happened, apologise, set out next steps, document it",
        "Ask a junior colleague to explain it to the patient later in the day",
        "Wait until the morbidity and mortality meeting before saying anything",
        "Tell the patient it was a routine part of the procedure and nothing more",
      ],
      answer: 1,
      explanation:
        "The professional duty of candour requires openness, an apology, an explanation of what happens next and documentation. Minimising or delaying disclosure undermines trust and breaches professional standards.",
      difficulty: 1,
    },
  ],
};

// ===========================================================================
// Cases
// ===========================================================================
const caseChbInferior: CaseStudy = {
  id: "bed-case-chb-inferior-stemi",
  title: "Complete heart block after inferior STEMI",
  trackId: "procedures-career",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "Inferior STEMI with right ventricular involvement and complete heart block unresponsive to atropine, needing temporary transvenous pacing in the lab, troubleshooting of capture, and patience before any permanent pacing decision.",
  presentation:
    "A 71-year-old man presents 2 hours after the onset of central chest pain. ECG shows inferior ST elevation with ST elevation in V4R and complete heart block with a narrow junctional escape. He is pale and clammy. The primary PCI team has been activated.",
  findings: [
    "HR 36 bpm, complete heart block, narrow escape rhythm",
    "BP 76/42 mmHg, cool peripheries, alert",
    "ST elevation II, III, aVF and V4R (right ventricular involvement)",
    "Chest clear, JVP raised",
  ],
  steps: [
    {
      id: "s1",
      prompt: "In the emergency department, what is your immediate management?",
      options: [
        { text: "Atropine 500 micrograms IV (repeat if needed), IV fluid bolus for right ventricular infarction, apply pacing-defibrillator pads, and transfer straight to the lab", best: true, feedback: "Correct. Atropine may help a nodal block, fluid supports right ventricular preload, pads allow transcutaneous pacing at once if he deteriorates, and reperfusion is the definitive treatment.", next: "s2" },
        { text: "Sublingual nitrate for his chest pain", feedback: "Nitrates are hazardous in right ventricular infarction with hypotension; they reduce preload and can cause profound hypotension.", next: "s1-nitrate-collapse", stateDelta: {"stability": -15} },
        { text: "Insert a temporary wire on the coronary care unit before transfer", feedback: "This delays reperfusion. A wire can be placed in the lab under fluoroscopy within minutes if needed.", next: "s2" },
        { text: "Start a beta-blocker to reduce myocardial oxygen demand", feedback: "Beta-blockade is contraindicated with heart block and hypotension.", next: "s2" },
      ],
    },
    {
      id: "s2",
      prompt: "In the lab, after 1.5 mg of atropine in total, he remains in complete heart block at 34 bpm with BP 70/40 mmHg. What do you do?",
      options: [
        { text: "Start transcutaneous pacing as a bridge with analgesia, obtain femoral venous access and place a temporary pacing wire under fluoroscopy, then proceed to PCI", best: true, feedback: "Correct. Haemodynamically compromising block refractory to atropine needs pacing. In the lab the femoral route under fluoroscopy is fast, and transcutaneous pacing covers the minutes it takes.", next: "s3" },
        { text: "Proceed directly with PCI and accept the rhythm", acceptable: true, feedback: "Reperfusion often restores conduction, but at BP 70/40 with no pacing backup, reperfusion arrhythmias or asystole during RCA wiring could be fatal. Securing pacing first is safer.", next: "s3" },
        { text: "Start an isoprenaline infusion and wait for it to work before angiography", feedback: "Isoprenaline increases myocardial oxygen demand and can provoke arrhythmias in acute ischaemia; waiting also delays reperfusion.", next: "s3" },
        { text: "Insert a subclavian temporary wire", feedback: "In an anticoagulated patient the subclavian vein is non-compressible and carries a pneumothorax risk; the femoral vein is the obvious choice in the lab.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "The wire captures intermittently. On fluoroscopy the tip runs along the AV groove and points posteriorly towards the spine in RAO. The paced QRS shows a right bundle branch block pattern. What is happening and what do you do?",
      info: "Threshold at this position is 3.5 mA and unstable.",
      options: [
        { text: "The wire is in the coronary sinus; withdraw and redirect it anteriorly across the tricuspid valve to the right ventricular apex or low septum, confirming in two views", best: true, feedback: "Correct. A posteriorly directed tip along the AV groove with left ventricular capture (right bundle branch block pattern) indicates a coronary sinus position. A right ventricular position gives a left bundle branch block pattern and a low threshold.", next: "s4" },
        { text: "Accept the position because it captures at high output", feedback: "Coronary sinus positions are unstable with high thresholds; capture will fail when the patient moves.", next: "s3-cs-accepted", stateDelta: {"stability": -15, "flags": ["wire-problem"]} },
        { text: "Increase the output to maximum and leave it", feedback: "This masks a poor position and risks phrenic or diaphragmatic stimulation; capture will still be unreliable.", next: "s4" },
        { text: "Push the wire further in", feedback: "Advancing in the coronary sinus risks perforation of the vein and tamponade.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "The wire is now at the right ventricular apex with a left bundle branch block paced QRS. The threshold is 0.6 mA. How do you set the box before the PCI?",
      options: [
        { text: "VVI demand mode, rate about 70 to 80 bpm, output about two to three times threshold, and sensitivity set to about half the measured sensing threshold", best: true, feedback: "Correct. Demand pacing avoids competing with his own beats, the output margin allows for a rising threshold, and appropriate sensitivity prevents both undersensing and oversensing.", next: "s5" },
        { text: "Asynchronous VOO at 5 mA", feedback: "Asynchronous pacing can drop a spike on the T wave of an intrinsic or reperfusion beat and trigger VF; use it only as a brief rescue.", next: "s5" },
        { text: "VVI with output equal to the threshold (0.6 mA)", feedback: "With no margin, capture will be lost as the threshold rises or the tip moves slightly.", next: "s4-threshold-output", stateDelta: {"stability": -15, "flags": ["wire-problem"]} },
        { text: "VVI at a rate of 40 bpm", feedback: "A rate of 40 would provide little haemodynamic support in a hypotensive patient.", next: "s5" },
      ],
    },
    {
      id: "s5",
      prompt: "The occluded RCA is stented with TIMI 3 flow. The next morning on the coronary care unit, the monitor shows intermittent pacing spikes without capture during periods of 2:1 block. He is comfortable, BP 112/68 mmHg. What do you do?",
      options: [
        { text: "Increase the output, check connections and battery, recheck the threshold, and get a 12-lead ECG and chest X-ray to look for displacement; reposition if needed", best: true, feedback: "Correct. Loss of capture is usually displacement or a rising threshold. Secure capture first, then find the cause. Also consider whether pacing is still needed as conduction recovers.", next: "s6" },
        { text: "Remove the wire now because he looks well", feedback: "He still has intermittent 2:1 block; removing the wire before conduction is stable leaves him unprotected.", next: "s6" },
        { text: "Reduce the output to save the battery", feedback: "Reducing output makes loss of capture worse.", next: "s6" },
        { text: "Arrange a permanent pacemaker today", feedback: "AV block after inferior MI usually resolves. The 2021 ESC pacing guideline advises waiting at least 5 days before deciding on permanent pacing.", next: "s6" },
      ],
    },
    {
      id: "s6",
      prompt: "By day 3 he has been in sinus rhythm with 1:1 AV conduction (PR interval 220 ms) for 24 hours, with the pacing rate set below his own rate and no paced beats. What next?",
      options: [
        { text: "Remove the temporary wire and continue rhythm monitoring; no permanent pacemaker is indicated at present", best: true, feedback: "Correct. Conduction has recovered, as is typical after reperfused inferior MI. Prompt removal reduces infection and thrombosis risk; continued monitoring will detect any recurrence.", },
        { text: "Implant a permanent pacemaker before discharge because of the first-degree block", feedback: "Mild first-degree AV block after recovery of conduction is not an indication for permanent pacing." },
        { text: "Keep the wire for another week as a precaution", feedback: "Every extra day increases infection, thrombosis and displacement risk without benefit when conduction has recovered." },
      ],
    },
    {
      "id": "s1-nitrate-collapse",
      "kind": "consequence",
      "info": "After the nitrate, BP falls to 58/30 mmHg and he becomes drowsy; the rate is still 34 bpm.",
      "prompt": "What now?",
      "options": [
        {
          "text": "Lie flat, rapid fluid for the RV infarct, repeat atropine, start transcutaneous pacing and expedite the lab",
          "best": true,
          "feedback": "Nitrates are dangerous in RV infarction; restore preload and rate.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Start noradrenaline only",
          "acceptable": true,
          "feedback": "Pressure support may help, but preload and rate are the main problems.",
          "stateDelta": {
            "stability": -5
          }
        },
        {
          "text": "Give more nitrate for the ongoing pain",
          "feedback": "This deepens the shock.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
    {
      "id": "s3-cs-accepted",
      "kind": "consequence",
      "info": "During PCI the wire loses capture repeatedly; each pause is 4–6 seconds with near-syncope.",
      "prompt": "What has happened?",
      "options": [
        {
          "text": "The coronary sinus position is unstable: reposition the wire to the RV under fluoroscopy, with transcutaneous backup",
          "best": true,
          "feedback": "A coronary sinus wire gives an RBBB pattern and unstable, high thresholds.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Increase the output to maximum and continue",
          "feedback": "High output does not stabilise a poor position.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Stop the PCI and transfer him to the ward",
          "feedback": "The rhythm problem is fixable now; the culprit still needs treating.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s4-threshold-output",
      "kind": "consequence",
      "info": "As the RCA balloon is inflated the threshold rises and pacing at 0.6 mA no longer captures; he has a 6-second pause.",
      "prompt": "Why did this happen, and what now?",
      "options": [
        {
          "text": "There is no safety margin; increase the output to two to three times threshold (or more during ischaemia) and recheck",
          "best": true,
          "feedback": "Thresholds rise with ischaemia and drugs; the output needs a margin.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Switch to VOO at the same output",
          "feedback": "Asynchronous mode does not help if the output does not capture.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Remove the wire",
          "feedback": "He is pacing-dependent.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
  ],
  outcome:
    "After temporary pacing and RCA stenting, AV conduction recovered within 72 hours. The wire was removed on day 3 and he was discharged on day 5 without a permanent pacemaker, with outpatient rhythm follow-up.",
  outcomeVariants: [
    {
      "flag": "wire-problem",
      "text": "Problems with the temporary wire caused pauses during the procedure; position and safety margin are checked before relying on it."
    }
  ],
  learningPoints: [
    "AV block in inferior MI is usually nodal and transient; reperfusion is the key treatment.",
    "Pace when bradycardia is haemodynamically compromising despite atropine; in the lab, the femoral route under fluoroscopy is quick.",
    "A coronary sinus position gives a posteriorly directed tip, a high threshold and a right bundle branch block paced QRS.",
    "Set output at two to three times threshold and use demand mode; recheck daily.",
    "Wait several days before deciding on permanent pacing, and remove temporary wires as soon as they are no longer needed.",
  ],
  refs: ["esc-pacing-2021", "esc-acs-2023", "hanna-pcm"],
};

const caseCtoTamponade: CaseStudy = {
  id: "bed-case-cto-tamponade",
  title: "Tamponade in the lab after CTO PCI",
  trackId: "procedures-career",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "After a long retrograde RCA CTO procedure, the patient becomes hypotensive while access is being closed, from tamponade caused by a distal wire perforation, needing drainage and embolisation.",
  presentation:
    "A 66-year-old man with refractory angina and a viable inferior wall undergoes PCI of a chronic total occlusion of the RCA. Access is right femoral 8 Fr (RCA guide) and right radial 7 Fr (left main guide). After 3 hours the occlusion is crossed retrogradely via a septal collateral and the RCA is stented. Contrast 280 mL, reference air kerma 3.8 Gy, ACT 320 seconds. Final injections look satisfactory; equipment is removed.",
  findings: [
    "No prior cardiac surgery",
    "eGFR 70 mL/min/1.73 m²",
    "Long procedure with multiple wire exchanges, including stiff polymer-jacketed wires",
    "BP 128/76 mmHg at the end of the procedure",
  ],
  steps: [
    {
      id: "s1",
      prompt: "Ten minutes later, while the femoral closure device is being prepared, BP falls to 82/50 mmHg and HR rises to 108 bpm. He feels breathless. What is your first step?",
      options: [
        { text: "Bedside echo now, while giving fluid and keeping arterial and venous access", best: true, feedback: "Correct. After complex PCI, hypotension with tachycardia is a perforation with tamponade until proven otherwise; echo answers the question in a minute.", next: "s2" },
        { text: "Atropine for a vasovagal reaction", feedback: "A vagal reaction causes bradycardia, not tachycardia. Treating it as vagal would delay the diagnosis.", next: "s1-atropine-delay", stateDelta: {"stability": -15, "flags": ["tamponade-delay"]} },
        { text: "CT of the abdomen for retroperitoneal bleeding", feedback: "Bleeding must be considered, but leaving the lab for CT before an echo risks arrest from undiagnosed tamponade.", next: "s2" },
        { text: "Vasopressors and observe", feedback: "Vasopressors may support him briefly but do not diagnose or treat the likely mechanical problem.", next: "s2" },
      ],
    },
    {
      id: "s2",
      prompt: "Echo shows a 15 mm circumferential effusion with right ventricular diastolic collapse. BP 72/40 mmHg. What next?",
      options: [
        { text: "Immediate pericardiocentesis in the lab, subxiphoid under fluoroscopy and echo, while the team prepares to find the source", best: true, feedback: "Correct. This is tamponade with shock; drainage is life-saving and the lab is the best place to do it.", next: "s3" },
        { text: "Give protamine and wait for the effusion to settle", feedback: "Protamine may help later but will not relieve tamponade, and he is shocked now.", next: "s3" },
        { text: "Arrange CT to define the effusion", feedback: "Echo has already made the diagnosis; transfer to CT in a shocked patient risks arrest.", next: "s3" },
        { text: "Call for emergency surgery and wait", feedback: "Surgery may be needed if bleeding cannot be controlled, but drainage must happen now.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "The needle aspirates blood. Before dilating, how do you confirm that you are in the pericardial space?",
      options: [
        { text: "Advance a J-wire and confirm on fluoroscopy that it loops around the cardiac silhouette outside the heart borders (agitated saline in the pericardial space on echo is an alternative)", best: true, feedback: "Correct. The wire course is the most reliable check in the lab. A wire heading to the right ventricular outflow tract or pulmonary artery means you are in the right ventricle.", next: "s4" },
        { text: "Inject a small amount of contrast and check that it pools and layers rather than washing out", acceptable: true, feedback: "This also works and is widely used, but confirm with the wire course before dilating.", next: "s4" },
        { text: "Blood was aspirated, so dilate", feedback: "Blood can come from a cardiac chamber; dilating into the right ventricle can be fatal.", next: "s3-dilated-in-rv", stateDelta: {"stability": -20} },
        { text: "Wait to see whether the aspirated blood clots", feedback: "Acute haemopericardium can clot, and waiting wastes time; clotting is not a reliable test.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "A pigtail drain is placed and 300 mL of blood is aspirated. BP rises to 118/70 mmHg. Over the next 10 minutes the drain produces another 100 mL. What now?",
      options: [
        { text: "Find the source: re-engage both coronaries and image every vessel and wire position instrumented, including the distal RCA branches and collaterals; consider autotransfusion through a venous sheath", best: true, feedback: "Correct. Brisk ongoing output means the leak is not sealed. A distal wire exit or a collateral leak is likely after CTO PCI.", next: "s5" },
        { text: "Give protamine and observe the drain", acceptable: true, feedback: "With equipment out, partial reversal is reasonable, but brisk bleeding still needs the source found and sealed.", next: "s5" },
        { text: "Remove the drain now that BP has recovered", feedback: "The drain is decompressing the pericardium and showing ongoing bleeding; removing it would let tamponade recur.", next: "s4-drain-removed", stateDelta: {"stability": -20, "flags": ["tamponade-delay"]} },
        { text: "Transfer to the ward with the drain on free drainage", feedback: "Active bleeding of this rate needs control in the lab, not observation on the ward.", next: "s5" },
      ],
    },
    {
      id: "s5",
      prompt: "Angiography shows contrast extravasating from a small distal posterolateral branch of the RCA, where an antegrade polymer-jacketed wire had been parked. How do you seal it?",
      options: [
        { text: "Inflate a small balloon proximal to the branch to stop inflow, then embolise the branch through a microcatheter with coils or autologous fat", best: true, feedback: "Correct. Distal wire perforations are sealed by occluding the small branch; balloon occlusion buys time and embolisation provides the permanent seal.", },
        { text: "Implant a covered stent in the distal branch", feedback: "Covered stents cannot be delivered into or sized for tiny distal branches; embolisation is the treatment." },
        { text: "Rely on protamine alone", feedback: "Reversal may help, but a persistent leak with ongoing drain output needs mechanical sealing." },
        { text: "Send immediately for surgery", feedback: "Surgery is the backup if percutaneous sealing fails; the leak is accessible to embolisation now." },
      ],
    },
    {
      "id": "s1-atropine-delay",
      "kind": "consequence",
      "info": "After atropine, HR is 120 bpm and BP 66/38 mmHg; he is drowsy with distended neck veins.",
      "prompt": "This is not vagal. What now?",
      "options": [
        {
          "text": "Bedside echo immediately, prepare for pericardiocentesis and keep the access",
          "best": true,
          "feedback": "Tachycardic hypotension with raised neck veins after CTO PCI is tamponade until proven otherwise.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Fluids and a CT of the abdomen",
          "feedback": "Leaving the lab for CT with tamponade risks arrest.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Start adrenaline and observe",
          "feedback": "Inotropes cannot overcome tamponade.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s4-drain-removed",
      "kind": "consequence",
      "info": "Twenty minutes after the drain is removed, BP falls to 70/40 mmHg and echo shows reaccumulation.",
      "prompt": "What now?",
      "options": [
        {
          "text": "Redrain, then find and seal the bleeding source angiographically",
          "best": true,
          "feedback": "Ongoing drainage means active bleeding; the drain is also your monitor.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Give protamine and wait",
          "acceptable": true,
          "feedback": "Reversal helps but does not seal an arterial bleed.",
          "stateDelta": {
            "stability": -5
          }
        },
        {
          "text": "Transfer to the ward on inotropes",
          "feedback": "Recurrent tamponade needs drainage and source control.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
    {
      "id": "s3-dilated-in-rv",
      "kind": "consequence",
      "info": "After dilatation, the drain fills with bright blood at high pressure and BP falls further; the wire is seen within the cardiac silhouette.",
      "prompt": "The dilator has entered the RV. What now?",
      "options": [
        {
          "text": "Leave the dilator or sheath in place to tamponade the hole, drain the pericardium through a second puncture, and call the surgeons",
          "best": true,
          "feedback": "Removing a large-bore device from the RV opens the hole; surgery is usually needed.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Remove the dilator and apply pressure",
          "feedback": "This turns a contained injury into torrential bleeding.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Advance a larger drain through the same track",
          "feedback": "This enlarges the RV injury.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
  ],
  outcome:
    "The branch was sealed with a coil after balloon occlusion; drain output fell to a trickle. After partial heparin reversal, the drain was removed the next day once echo showed no reaccumulation. He was discharged on day 3 on dual antiplatelet therapy, with the event explained to him and reviewed at the department meeting.",
  outcomeVariants: [
    {
      "flag": "tamponade-delay",
      "text": "Delayed recognition or premature drain removal prolonged the tamponade and the period of shock."
    }
  ],
  learningPoints: [
    "Hypotension after complex PCI, even after equipment has been removed, is tamponade until echo says otherwise.",
    "Drain in the lab under fluoroscopy and echo, confirming wire position before dilating.",
    "Ongoing drain output means the leak is still open; find it with angiography of every vessel instrumented.",
    "Distal wire perforations are sealed by balloon occlusion and embolisation, not covered stents.",
    "Keep track of every wire tip, especially stiff and polymer-jacketed wires, throughout long procedures.",
  ],
  refs: ["esc-pericardial-2015", "brilakis-manual-cto", "seattle-complications-2020", "brilakis-manual-pci"],
};

// ===========================================================================
// Track
// ===========================================================================
export const proceduresCareer: Track = {
  id: "procedures-career",
  order: 9,
  title: "Bedside Procedures & Independence",
  tagline: "Temporary pacing, pericardiocentesis, closure devices and judgement",
  description:
    "The procedures every interventionalist must be able to do on demand (temporary pacing, pericardiocentesis, large-bore access and closure, biopsy and foreign-body retrieval), and the judgement, safety habits and self-care that turn a supervised trainee into an independent operator.",
  stage: 4,
  modules: [pacing, pericardiocentesis, accessClosure, biopsyRetrieval, independence],
  cases: [caseChbInferior, caseCtoTamponade],
};
