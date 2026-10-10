import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Track 7 — Acute care and mechanical circulatory support (prefix "mcs-").
// STEMI and primary PCI, NSTE-ACS timing, cardiac arrest, cardiogenic shock,
// IABP, microaxial flow pumps (Impella), VA-ECMO, RV support and bridging.
// ===========================================================================

// ---------------------------------------------------------------------------
// Module 1 — STEMI and primary PCI
// ---------------------------------------------------------------------------
const stemi: Module = {
  id: "mcs-stemi",
  title: "STEMI and primary PCI",
  stage: 4,
  summary:
    "Reperfusion systems and time targets, primary PCI technique, thrombus, non-culprit disease, RV infarction, posterior MI, MINOCA, mechanical complications, late presenters and failed fibrinolysis.",
  objectives: [
    "Apply the 2023 ESC time targets to choose between primary PCI and fibrinolysis.",
    "Run a primary PCI: access, culprit identification, thrombus strategy, stent sizing and no-reflow management.",
    "Plan complete revascularisation in multivessel STEMI and recognise when to stop at the culprit.",
    "Recognise RV infarction, posterior MI and MINOCA and adapt management.",
    "Recognise ventricular septal rupture, papillary muscle rupture and free-wall rupture and arrange definitive treatment.",
    "Manage failed fibrinolysis, the pharmaco-invasive strategy and late presenters.",
  ],
  lessons: [
    {
      id: "mcs-stemi-reperfusion",
      title: "Reperfusion strategy, networks and time targets",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "ST-elevation myocardial infarction (STEMI) is usually caused by thrombotic occlusion of an epicardial coronary artery after plaque rupture or erosion. Necrosis spreads from the subendocardium outwards, so the amount of myocardium that can be salvaged falls with every minute the artery stays shut. A STEMI pathway exists to shorten total ischaemic time, from symptom onset to restored flow.",
        },
        { kind: "h", text: "Making the diagnosis" },
        {
          kind: "p",
          text: "The ECG diagnosis rests on new ST elevation at the J point in at least two contiguous leads. Under the fourth universal definition of MI the threshold is 1 mm in most leads but higher in V2–V3: 2 mm in men aged 40 or over, 2.5 mm in men under 40 and 1.5 mm in women. Do not wait for troponin. STEMI is an ECG and clinical diagnosis; the troponin result adds delay without changing the decision.",
        },
        {
          kind: "keypoints",
          title: "Presentations that follow a primary PCI pathway without classic ST elevation",
          items: [
            "Isolated posterior MI: ST depression in V1–V3 with dominant R waves. Record V7–V9; ST elevation of 0.5 mm or more there supports the diagnosis.",
            "Left or right bundle branch block, or a paced rhythm, with symptoms suggesting ongoing ischaemia.",
            "Haemodynamic or electrical instability, or refractory pain, with a convincing history even if the ECG is non-diagnostic.",
            "ST depression in many leads with ST elevation in aVR: suggests left main or multivessel ischaemia and is very high risk, particularly with haemodynamic compromise.",
          ],
        },
        {
          kind: "pitfalls",
          title: "Conditions that mimic STEMI",
          items: [
            "Acute pericarditis and perimyocarditis: widespread concave ST elevation, PR depression, no reciprocal change.",
            "Aortic dissection involving a coronary ostium (usually the right): fibrinolysis or potent antithrombotics can be fatal. Ask about tearing pain, check pulses and look at the mediastinum.",
            "Persistent ST elevation from an old LV aneurysm, early repolarisation, LV hypertrophy, Brugada pattern, hyperkalaemia and Takotsubo syndrome.",
          ],
        },
        { kind: "h", text: "Choosing the reperfusion strategy" },
        {
          kind: "p",
          text: "Primary PCI is the preferred reperfusion strategy within 12 hours of symptom onset, provided it can be delivered promptly. The 2023 ESC guideline sets time zero as the moment of STEMI diagnosis (when the ECG is interpreted), not first contact or arrival at hospital.",
        },
        {
          kind: "table",
          caption: "STEMI time targets measured from diagnosis (2023 ESC)",
          head: ["Interval", "Target"],
          rows: [
            ["Diagnosis to wire crossing, patient presenting to a PCI centre", "60 min or less"],
            ["Diagnosis to wire crossing, patient transferred from a non-PCI centre", "90 min or less"],
            ["Expected diagnosis-to-PCI delay above which fibrinolysis is preferred", "More than 120 min"],
            ["Diagnosis to fibrinolytic bolus, when fibrinolysis is chosen", "10 min or less"],
            ["Start of fibrinolysis to assessment of success", "60–90 min"],
            ["Start of successful fibrinolysis to routine angiography", "2–24 h"],
          ],
        },
        {
          kind: "list",
          items: [
            "Pre-hospital ECG acquisition and transmission, so the decision is made before arrival.",
            "Ambulance bypass of the emergency department straight to the catheter laboratory of a primary PCI centre (a heart attack centre in UK networks).",
            "Single-call activation of a 24/7 cath lab team, with agreed pathways for transfers from non-PCI hospitals.",
            "Continuous audit of call-to-balloon and diagnosis-to-wire times; in the UK this is collected through the national MI audit (MINAP).",
          ],
        },
        { kind: "h", text: "Fibrinolysis, rescue PCI and the pharmaco-invasive strategy" },
        {
          kind: "p",
          text: "When primary PCI cannot be achieved within 120 minutes of diagnosis, a fibrin-specific lytic (tenecteplase, alteplase or reteplase) is given within 12 hours of symptom onset, ideally within 10 minutes of diagnosis. In patients aged 75 or over, a half-dose tenecteplase regimen is advised to limit intracranial bleeding. Dosing follows the local protocol. Every lysed patient is then transferred to a PCI centre.",
        },
        {
          kind: "steps",
          title: "After fibrinolysis",
          items: [
            {
              title: "Assess at 60–90 minutes",
              detail: "Look for at least 50% resolution of ST elevation in the lead with the greatest initial elevation, relief of pain and haemodynamic stability.",
            },
            {
              title: "Failed lysis: rescue PCI",
              detail: "Less than 50% ST resolution, ongoing pain, haemodynamic or electrical instability or worsening heart failure mean immediate angiography and rescue PCI. Repeat fibrinolysis has not been shown to help and is not a substitute.",
            },
            {
              title: "Successful lysis: routine early angiography",
              detail: "Angiography, with PCI of the infarct-related artery if needed, 2–24 hours after the start of lysis (the pharmaco-invasive strategy). Immediate routine PCI after full-dose lysis ('facilitated PCI') was associated with harm in older trials.",
            },
            {
              title: "Shock or recurrent ischaemia at any point",
              detail: "Immediate angiography, regardless of the time since lysis.",
            },
          ],
        },
        {
          kind: "keypoints",
          title: "Absolute contraindications to fibrinolysis (summary; check the local protocol)",
          items: [
            "Previous intracranial haemorrhage, or stroke of unknown origin, at any time.",
            "Ischaemic stroke in the preceding 6 months.",
            "Central nervous system damage, neoplasm or arteriovenous malformation.",
            "Recent major trauma, surgery or head injury (within about a month).",
            "Gastrointestinal bleeding within the past month; known bleeding disorder.",
            "Aortic dissection.",
            "Non-compressible punctures in the previous 24 hours (for example liver biopsy or lumbar puncture).",
          ],
        },
        { kind: "h", text: "Late presenters" },
        {
          kind: "table",
          caption: "Time from symptom onset and strategy (2023 ESC)",
          head: ["Time from onset", "Situation", "Approach"],
          rows: [
            ["Under 12 h", "Any STEMI", "Primary PCI, or fibrinolysis if PCI is not possible within 120 min of diagnosis"],
            ["Over 12 h", "Ongoing ischaemia, heart failure, shock or life-threatening arrhythmia", "Primary PCI strategy, exactly as for an early presenter"],
            ["12–48 h", "Asymptomatic and stable", "Routine primary PCI should be considered"],
            ["Over 48 h", "Asymptomatic and stable with an occluded infarct artery", "Routine PCI of the occluded artery is not recommended; assess ischaemia and viability and treat medically"],
          ],
        },
        {
          kind: "pearl",
          text: "Late presenters carry the highest risk of mechanical complications. A patient who had chest pain three days ago and is now breathless with a new murmur needs an echo before the cath lab.",
        },
      ],
      refs: ["esc-acs-2023", "supplied-medmastery", "hanna-pcm", "thygesen-4udmi-2018", "oat-2006", "stream-2013"],
    },
    {
      id: "mcs-stemi-ppci",
      title: "Primary PCI in the lab",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "A primary PCI is a time-critical procedure in a frightened patient who has often had opioids and potent antithrombotics. Consent is usually brief verbal assent covering the essentials: the aim (open the artery), the main risks (bleeding, stroke, emergency surgery, death) and that there is an alternative. Document it afterwards.",
        },
        { kind: "h", text: "Before the first puncture" },
        {
          kind: "list",
          items: [
            "Aspirin loading dose, if not already given.",
            "A potent P2Y12 inhibitor (prasugrel or ticagrelor) in preference to clopidogrel. The 2023 ESC guideline favours prasugrel over ticagrelor in patients proceeding to PCI, unless contraindicated (for example previous stroke). Pretreatment before angiography may be considered in STEMI but is optional.",
            "Opioids slow the absorption of oral P2Y12 inhibitors. Crushed tablets or intravenous cangrelor in a P2Y12-naive patient are options.",
            "Unfractionated heparin is the default anticoagulant in the lab: weight-based bolus per local protocol, guided by the activated clotting time.",
            "Oxygen only if SpO2 is below 90%.",
          ],
        },
        { kind: "h", text: "Access" },
        {
          kind: "p",
          text: "Radial access is the default in STEMI (Class I in the 2023 ESC guideline); MATRIX showed less bleeding and lower mortality with radial access in ACS. In a patient who may need mechanical support, a radial approach for the coronary work leaves both groins free for a device, and any femoral puncture is ultrasound-guided and planned.",
        },
        { kind: "h", text: "Sequence and identifying the culprit" },
        {
          kind: "steps",
          items: [
            {
              title: "Look at the presumed non-culprit artery first (common, optional)",
              detail: "Many operators image the non-infarct artery with a diagnostic catheter, then engage the culprit with the guide. This shows collaterals, left main disease and multivessel disease before you commit. In a very unstable patient go straight to the culprit.",
            },
            {
              title: "Correlate three sources",
              detail: "ECG territory, angiography and regional wall motion (echo or LV angiogram) should agree. When they do not, pause before stenting.",
            },
            {
              title: "Recognise culprit features",
              detail: "Abrupt occlusion, a hazy or ragged edge, a filling defect (thrombus), contrast staining or ulceration, and reduced TIMI flow. A tapered stump with bridging or well-developed collaterals suggests a chronic total occlusion, not the culprit.",
            },
            {
              title: "If still uncertain",
              detail: "Intravascular imaging (OCT or IVUS) can show plaque rupture or thrombus. Consider spontaneous coronary artery dissection, embolism or spasm. Do not stent a lesion that may not be the cause.",
            },
            {
              title: "Wire, restore flow, then size",
              detail: "A soft workhorse wire usually crosses a fresh thrombotic occlusion easily. Restoring flow with the wire or a small balloon reveals the distal vessel so that stent length and diameter can be judged.",
            },
          ],
        },
        { kind: "h", text: "Thrombus and stenting" },
        {
          kind: "keypoints",
          items: [
            "Routine manual thrombus aspiration is not recommended. In TOTAL it did not reduce cardiovascular death, reinfarction, shock or severe heart failure, and strokes were more frequent. Keep aspiration for bail-out when large thrombus persists after wiring or balloon dilatation.",
            "If you aspirate: advance slowly through the thrombus, keep suction on while withdrawing, keep the guide well engaged so thrombus is not lost into the aorta, and let the haemostatic valve bleed back afterwards to clear air and debris.",
            "Use drug-eluting stents. Routine deferred stenting is not recommended.",
            "Give intracoronary nitrate before sizing. Vessels in STEMI are often constricted, and undersizing promotes malapposition and stent thrombosis.",
            "Direct stenting where feasible, and avoiding aggressive or repeated post-dilatation, limits distal embolisation in thrombus-laden vessels.",
            "Glycoprotein IIb/IIIa inhibitors are reserved for bail-out: no-reflow or thrombotic complications. Check the platelet count when they are used.",
          ],
        },
        { kind: "h", text: "No-reflow" },
        {
          kind: "p",
          text: "No-reflow is poor or absent myocardial run-off despite an open epicardial artery, caused by embolised thrombus and debris, microvascular spasm and oedema. It announces itself with recurrent pain and ST elevation after balloon or stent, and is commonest with heavy thrombus and after over-dilatation.",
        },
        {
          kind: "steps",
          title: "Responding to no-reflow",
          items: [
            { title: "Exclude a mechanical cause", detail: "Check for dissection, residual thrombus, distal wire injury or a guide damping the ostium before calling it no-reflow." },
            { title: "Deliver drugs distally", detail: "Pass a microcatheter or over-the-wire balloon into the distal vessel and give vasodilators there (adenosine, verapamil or nitroprusside are commonly used). Drugs injected through the guide will not reach a microcirculation with no flow." },
            { title: "Support the circulation", detail: "Treat hypotension and bradycardia. Consider a glycoprotein IIb/IIIa inhibitor if thrombus is the driver, and mechanical support if the patient is shocked." },
            { title: "Stop dilating", detail: "Further balloon inflations rarely help and add embolisation." },
          ],
        },
        { kind: "h", text: "Non-culprit disease" },
        {
          kind: "p",
          text: "Roughly half of STEMI patients have significant disease in another artery. In stable patients, COMPLETE showed that staged PCI of significant non-culprit lesions reduced cardiovascular death or new MI compared with culprit-only PCI. The 2023 ESC guideline recommends complete revascularisation at the index procedure or within 45 days, with non-culprit lesions in STEMI judged on angiographic severity; acute-phase physiology can be distorted by microvascular dysfunction.",
        },
        {
          kind: "table",
          caption: "Managing non-culprit lesions",
          head: ["Situation", "Approach"],
          rows: [
            ["Stable STEMI with multivessel disease", "Complete revascularisation at the index procedure or staged within 45 days"],
            ["Cardiogenic shock", "Culprit-only PCI at the index procedure; consider staged non-culprit PCI after recovery (CULPRIT-SHOCK)"],
            ["Long index procedure, high contrast load, renal impairment or an uncertain lesion", "Stage the non-culprit PCI"],
            ["Chronic total occlusion in a non-culprit artery", "Not treated at the index procedure; assess viability and symptoms later"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating the wrong lesion: stenting a severe but chronic lesion while the real culprit (for example a flush occlusion of an obtuse marginal) is missed.",
            "Giving nitrates to an inferior STEMI with hypotension: it may be RV infarction.",
            "Pressing on when the RCA ostium looks unusual in a patient with tearing pain. Stop and image the aorta.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Inferior STEMI: image the left system with minimal views, then engage the RCA, identify the culprit and grade TIMI flow before wiring.",
        },
      ],
      refs: ["esc-acs-2023", "total-2015", "complete-2019", "matrix-2015", "culprit-shock-2017", "supplied-medmastery", "brilakis-manual-pci", "timi-1985", "multistars-ami-2023", "danami3-defer-2016", "isar-react5-2019"],
    },
    {
      id: "mcs-stemi-rv-minoca",
      title: "Inferior, RV and posterior MI, and MINOCA",
      minutes: 9,
      blocks: [
        { kind: "h", text: "Localising inferior STEMI" },
        {
          kind: "table",
          caption: "Inferior STEMI: right coronary or circumflex?",
          head: ["Feature", "Favours RCA", "Favours circumflex"],
          rows: [
            ["Limb leads", "ST elevation in III greater than II; reciprocal ST depression in I and aVL", "ST elevation in II equal to or greater than III; I and aVL isoelectric or elevated"],
            ["Right-sided leads", "ST elevation in V4R indicates proximal RCA occlusion with RV involvement", "V4R usually unremarkable"],
            ["Posterior and lateral leads", "Possible", "ST depression in V1–V3, elevation in V5–V6 and V7–V9 more typical"],
            ["Conduction", "AV block more common (the AV nodal artery usually arises from the RCA)", "Less common"],
          ],
        },
        { kind: "h", text: "Right ventricular infarction" },
        {
          kind: "p",
          text: "RV infarction complicates a proximal RCA occlusion (above the RV marginal branches) and, less often, occlusion of a dominant circumflex. The RV is thin-walled and perfused in both systole and diastole, so it often recovers well once reperfused. In the acute phase, though, a stunned RV can cause profound low output because the LV can only eject what the RV delivers.",
        },
        {
          kind: "keypoints",
          title: "Recognition",
          items: [
            "Classic triad in an inferior STEMI: hypotension, clear lung fields and a raised JVP.",
            "Record V4R in every inferior STEMI. ST elevation there indicates RV involvement (the fourth universal definition uses 0.5 mm, or 1 mm in men under 30).",
            "Echo: dilated, hypokinetic RV, septal flattening and often tricuspid regurgitation.",
            "Haemodynamics: raised RA pressure with a normal or low PCWP. A high RA:PCWP ratio and a low pulmonary artery pulsatility index (PAPi) point to RV-predominant failure.",
            "Bradycardia and AV block are common and poorly tolerated.",
          ],
        },
        {
          kind: "table",
          caption: "Management of RV infarction",
          head: ["Problem", "Action", "Avoid"],
          rows: [
            ["Preload dependence", "A cautious fluid challenge if not congested, judged by the response", "Nitrates, diuretics and large doses of opioids"],
            ["Bradycardia or AV block", "Atropine, then temporary pacing; AV-sequential pacing helps when atrial transport matters", "Ignoring it: the infarcted RV depends on heart rate and atrial contraction"],
            ["Over-distended RV", "Stop giving fluid once the RA pressure is high; consider diuresis", "Repeated boluses because the blood pressure is still low"],
            ["Low output despite adequate preload", "Inotrope (for example dobutamine), vasopressor to maintain MAP, prompt reperfusion", "Pure vasoconstriction without addressing output"],
            ["Refractory RV shock", "Right-sided mechanical support (percutaneous RV pump) or VA-ECMO", "A left-sided pump alone: it cannot fill if the RV fails"],
          ],
        },
        {
          kind: "pearl",
          text: "Ventricular interdependence: the RV and LV share the septum and the pericardium. Over-filling a failing RV pushes the septum into the LV, reduces LV filling and lowers output. More fluid is not always more output.",
        },
        { kind: "h", text: "Posterior MI" },
        {
          kind: "p",
          text: "Occlusion of the circumflex or a posterolateral branch can infarct the posterior and lateral walls with little ST elevation on the standard 12 leads, because no standard lead faces that wall directly. Look for horizontal ST depression in V1–V3 with tall R waves, and record V7–V9. Circumflex occlusions are the occlusions most often missed or delayed; once posterior leads confirm ST elevation, manage as STEMI.",
        },
        { kind: "h", text: "MINOCA" },
        {
          kind: "p",
          text: "Myocardial infarction with non-obstructive coronary arteries (MINOCA) is a working diagnosis. The patient meets the universal definition of MI, angiography shows no stenosis of 50% or more in a major epicardial artery, and no other overt cause is evident. It is the start of an investigation, not a final diagnosis, and it carries a real risk of recurrent events.",
        },
        {
          kind: "table",
          caption: "MINOCA: causes to look for",
          head: ["Cause", "Clues", "Tests"],
          rows: [
            ["Plaque disruption (rupture, erosion, calcified nodule)", "Mild plaque in the artery matching the ECG territory", "Intravascular imaging (OCT or IVUS) at the time of angiography"],
            ["Coronary spasm", "Rest or nocturnal pain, transient ST elevation", "Provocation testing in experienced centres"],
            ["Coronary embolism", "Atrial fibrillation, prosthetic valve, endocarditis, PFO; abrupt distal cut-off", "Echo or TOE, rhythm monitoring, targeted thrombophilia testing"],
            ["Spontaneous coronary artery dissection (SCAD)", "Young or middle-aged woman, peripartum, fibromuscular dysplasia; long smooth narrowing", "Careful review of the angiogram; intravascular imaging only if it will change management"],
            ["Microvascular dysfunction", "Diagnosis of exclusion", "Coronary function testing"],
            ["Non-ischaemic mimics (not MINOCA)", "Myocarditis, Takotsubo syndrome", "Cardiac MRI separates these"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Cardiac MRI is central: subendocardial or transmural late gadolinium enhancement in a coronary territory confirms infarction, while patterns of myocarditis or Takotsubo point elsewhere.",
            "SCAD is usually managed conservatively when flow is preserved. PCI in SCAD carries a high risk of propagating the dissection and is reserved for ongoing ischaemia or instability.",
            "Secondary prevention in MINOCA follows the underlying cause, so pursue it.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Calling it MINOCA after missing a flush occlusion of a small branch (an obtuse marginal or diagonal). Review every branch in at least two views.",
            "Stopping the work-up at 'normal coronaries' without cardiac MRI.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "scad-esc-2018", "hanna-pcm", "thygesen-4udmi-2018", "korabathina-papi-2012"],
    },
    {
      id: "mcs-stemi-mechanical",
      title: "Mechanical complications of MI",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Mechanical complications are rarer in the primary PCI era but remain highly lethal. They cluster in late presenters, the elderly, women and first infarcts, and typically appear within the first week, often in the first few days. Suspect one whenever a patient deteriorates suddenly after apparently successful reperfusion, or arrives late in shock.",
        },
        {
          kind: "table",
          caption: "The three mechanical complications",
          head: ["Feature", "Ventricular septal rupture (VSR)", "Papillary muscle rupture", "Free-wall rupture"],
          rows: [
            ["Typical setting", "Anterior MI (apical defect, usually simpler) or inferior MI (basal inferoseptal defect, often more complex)", "Often a small inferior or posterolateral infarct; the posteromedial muscle (single blood supply from the posterior descending artery) ruptures far more often than the anterolateral (dual supply)", "Often a first, transmural MI with late or no reperfusion"],
            ["Presentation", "Sudden shock and pulmonary oedema; new loud pansystolic murmur, often with a thrill", "Flash pulmonary oedema and shock; the murmur may be soft or absent", "Sudden pulseless electrical activity from tamponade, or a subacute course with effusion and hypotension"],
            ["Key test", "Echo with colour Doppler", "Echo (TOE if transthoracic views are unclear): flail leaflet with attached muscle head", "Echo: pericardial effusion, often with clot"],
            ["Catheter clue", "Oxygen saturation step-up at RV or PA level; high Qp:Qs", "Giant v waves on the PCWP trace", "Equalised diastolic pressures"],
            ["Bridge", "Afterload reduction; IABP, or VA-ECMO with LV unloading", "Afterload reduction; IABP or other mechanical support", "Pericardiocentesis only to temporise"],
            ["Definitive", "Surgical repair; transcatheter closure in selected patients", "Emergency surgery; transcatheter edge-to-edge repair has been used in selected inoperable patients", "Emergency surgery"],
          ],
        },
        {
          kind: "pearl",
          text: "In papillary muscle rupture the murmur can be quiet because LV and LA pressures equalise quickly. A shocked patient with pulmonary oedema, a hyperdynamic LV and a small infarct has acute severe mitral regurgitation until proven otherwise.",
        },
        { kind: "h", text: "Mechanical support as a bridge" },
        {
          kind: "p",
          text: "An IABP lowers afterload and can reduce both the left-to-right shunt in VSR and the regurgitant volume in acute mitral regurgitation. The 2023 ESC guideline still supports its use for mechanical complications, unlike routine use in shock. VA-ECMO restores perfusion but raises LV afterload, which can worsen shunting or regurgitation, so it is usually combined with an LV unloading strategy. Microaxial flow pumps have been used in selected patients, but septal defects and right-heart physiology complicate their use. Device choice is individual and made with the surgical team.",
        },
        {
          kind: "keypoints",
          title: "Timing of surgery",
          items: [
            "Patients who cannot be stabilised need emergency surgery; there is no safe long-term bridge without repair.",
            "In VSR that has been stabilised, delaying surgery allows the infarcted tissue to become less friable. Observational series report better surgical results with delayed repair, partly because only survivors reach delayed surgery.",
            "Mechanical support can buy that time. The decision is shared between interventional cardiology, cardiac surgery and intensive care.",
          ],
        },
        { kind: "h", text: "Other post-MI problems to recognise" },
        {
          kind: "list",
          items: [
            "LV thrombus after large anterior MI: look on echo (contrast or MRI if uncertain) and anticoagulate if present.",
            "Pericarditis early after MI, and late post-infarct pericarditis.",
            "True LV aneurysm (wide neck, dyskinetic wall) versus pseudoaneurysm (contained rupture, narrow neck), which needs surgery.",
            "Arrhythmias: early VF, AF, and AV block, particularly with inferior MI.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Taking a patient with a new murmur to the lab before an echo. The answer is often surgical, and an echo takes minutes.",
            "Treating tamponade from free-wall rupture with pericardiocentesis alone: it is a temporising step on the way to theatre.",
            "Missing VSR because no oximetry was done. When a shocked post-MI patient has a PA catheter, sample SVC, RA, RV and PA saturations.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-stemi-lysis-delay",
      stem: "A 58-year-old man has had chest pain for 2 hours. Anterior STEMI is diagnosed at a hospital without PCI. The nearest PCI centre estimates that wire crossing could be achieved 150 minutes after diagnosis. What is the best reperfusion strategy?",
      options: [
        "Transfer for primary PCI and accept the delay",
        "Fibrinolysis within 10 minutes of diagnosis, then immediate transfer to the PCI centre",
        "Fibrinolysis and observation locally, with angiography only if symptoms recur",
        "Dual antiplatelet therapy and heparin, with angiography the next day",
        "Wait for a high-sensitivity troponin before deciding",
      ],
      answer: 1,
      explanation:
        "When the expected delay from diagnosis to PCI exceeds 120 minutes, fibrinolysis within 12 hours of symptom onset is preferred, ideally within 10 minutes of diagnosis. Every lysed patient is transferred to a PCI centre for rescue PCI if lysis fails or routine angiography at 2–24 hours if it succeeds. Transferring for primary PCI accepts a delay beyond the 120-minute threshold, and observing locally omits the transfer that the pharmaco-invasive strategy requires.",
      difficulty: 1,
      refs: ["esc-acs-2023", "stream-2013"],
    },
    {
      id: "mcs-q-stemi-failed-lysis",
      stem: "Ninety minutes after tenecteplase for inferior STEMI, the patient still has pain and the ST elevation has fallen by 30% in the lead with the greatest elevation. What is the next step?",
      options: [
        "Repeat the fibrinolytic",
        "Immediate transfer for rescue PCI",
        "Angiography 24 hours after lysis as part of the pharmaco-invasive strategy",
        "Start a glycoprotein IIb/IIIa infusion and reassess at 3 hours",
        "Intravenous nitrate and repeat the ECG in an hour",
      ],
      answer: 1,
      explanation:
        "Less than 50% ST resolution at 60–90 minutes with ongoing pain defines failed fibrinolysis, which needs immediate angiography and rescue PCI. Routine angiography at 2–24 hours applies only after successful lysis. Repeat fibrinolysis has not been shown to help and delays mechanical reperfusion.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "mcs-q-stemi-aspiration",
      stem: "During primary PCI for a thrombotic RCA occlusion with TIMI 0 flow, which statement about routine manual thrombus aspiration is best supported by evidence?",
      options: [
        "It reduces cardiovascular death at 6 months and should be used in every TIMI 0 occlusion",
        "Not routinely: in TOTAL it did not reduce major events and stroke was more frequent",
        "It removes the need for stenting once antegrade flow has been restored by aspiration",
        "It is contraindicated even as a bail-out technique because of the stroke risk",
        "It is recommended whenever a glycoprotein IIb/IIIa inhibitor is not being used",
      ],
      answer: 1,
      explanation:
        "TOTAL randomised over 10,000 STEMI patients and found no reduction in cardiovascular death, reinfarction, shock or severe heart failure with routine manual thrombectomy, and more strokes at 30 days. The 2023 ESC guideline therefore advises against routine aspiration. It remains a bail-out option for large residual thrombus, so calling it absolutely contraindicated is also wrong.",
      difficulty: 2,
      refs: ["total-2015", "esc-acs-2023"],
    },
    {
      id: "mcs-q-stemi-complete",
      stem: "A haemodynamically stable patient has primary PCI to an occluded proximal LAD. There is a 90% stenosis in the proximal circumflex. What is the recommended approach to the circumflex lesion?",
      options: [
        "Leave it on medical therapy unless the angina returns after discharge",
        "Treat it at the index procedure or staged within 45 days",
        "Treat it only if a stress test at 3 months shows inducible ischaemia",
        "Refer for coronary bypass grafting to the circumflex as a separate case",
        "Treat it immediately in the same sitting, as you would in cardiogenic shock",
      ],
      answer: 1,
      explanation:
        "In stable STEMI with multivessel disease, complete revascularisation reduced cardiovascular death or new MI compared with culprit-only PCI in COMPLETE. The 2023 ESC guideline recommends it at the index procedure or within 45 days. The 'shock' option is the trap: in cardiogenic shock the opposite applies, and culprit-only PCI is recommended (CULPRIT-SHOCK).",
      difficulty: 1,
      refs: ["complete-2019", "esc-acs-2023", "culprit-shock-2017", "multistars-ami-2023"],
    },
    {
      id: "mcs-q-stemi-rv-nitrate",
      stem: "A patient with inferior STEMI has BP 78/50 mmHg, clear lung fields, a raised JVP and 1 mm ST elevation in V4R. Which drug should be avoided?",
      options: ["Aspirin", "Glyceryl trinitrate", "Unfractionated heparin", "Atropine", "Noradrenaline"],
      answer: 1,
      explanation:
        "This is RV infarction. The failing RV is preload-dependent, and venodilators such as nitrates can cause profound hypotension. Atropine is appropriate for bradycardia, and noradrenaline may be needed to support MAP while reperfusion and cautious volume loading are delivered.",
      difficulty: 1,
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
    {
      id: "mcs-q-stemi-pmr",
      stem: "A 70-year-old woman presented late with a small inferior MI from an occluded posterior descending artery. On day 3 she develops sudden pulmonary oedema and BP 82/50 mmHg. There is a soft systolic murmur. Bedside echo shows a hyperdynamic LV. A PA catheter shows giant v waves on the wedge trace and no saturation step-up between RA and PA. What is the most likely diagnosis?",
      options: [
        "Ventricular septal rupture with a left-to-right shunt",
        "Posteromedial papillary muscle rupture",
        "Free-wall rupture with tamponade and equalised pressures",
        "Stent thrombosis of the LAD with new anterior ischaemia",
        "RV infarction with a low output state",
      ],
      answer: 1,
      explanation:
        "The posteromedial papillary muscle usually depends on a single artery (the posterior descending), so it ruptures after small inferior infarcts. Acute severe MR causes flash pulmonary oedema, a hyperdynamic LV and giant v waves, and the murmur may be soft because LA and LV pressures equalise. VSR can also produce large v waves, but it causes a saturation step-up at RV or PA level and usually a loud murmur with a thrill.",
      difficulty: 3,
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
    {
      id: "mcs-q-stemi-late",
      stem: "A stable, pain-free patient attends 4 days after an episode of chest pain. The ECG shows inferior Q waves, and angiography shows an occluded mid RCA with no other disease. What is the recommended approach to the RCA?",
      options: [
        "Immediate PCI of the occluded RCA during this procedure",
        "No routine PCI; medical therapy, then test ischaemia and viability",
        "Intravenous fibrinolysis to reopen the occluded artery",
        "Emergency coronary bypass grafting to the distal RCA today",
        "IABP insertion followed by PCI of the RCA once the balloon is running",
      ],
      answer: 1,
      explanation:
        "In asymptomatic, stable patients presenting more than 48 hours after onset with an occluded infarct artery, routine PCI is not recommended because trial evidence showed no clinical benefit. Ischaemia testing and viability assessment guide any later revascularisation. Immediate PCI would be right if he had ongoing ischaemia, heart failure, shock or arrhythmia.",
      difficulty: 2,
      refs: ["esc-acs-2023", "oat-2006"],
    },
    {
      id: "mcs-q-stemi-noreflow",
      stem: "After stenting a proximal LAD in STEMI, flow falls to TIMI 1 and the pain returns. There is no dissection and the guide is not damping. What is the best next step?",
      options: [
        "Inject adenosine through the guide catheter into the left main",
        "Give a vasodilator through a microcatheter in the distal vessel",
        "Post-dilate the stent at high pressure with a non-compliant balloon",
        "Place a second stent distally to cover any hidden edge dissection",
        "Repeated manual aspiration of the stented segment and distal vessel",
      ],
      answer: 1,
      explanation:
        "No-reflow is microvascular obstruction. Vasodilators (adenosine, verapamil or nitroprusside) need to reach the microcirculation, so they are delivered distally through a microcatheter or over-the-wire balloon. Drugs injected through the guide mostly run into other vessels when the affected artery has no flow. More balloon inflations add embolisation and make no-reflow worse.",
      difficulty: 3,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "mcs-q-stemi-time-zero",
      stem: "In the 2023 ESC guideline, from which point are STEMI reperfusion time targets measured?",
      options: [
        "Symptom onset as reported",
        "First medical contact by the paramedics",
        "STEMI diagnosis (ECG read)",
        "Arrival at the PCI centre door",
        "Arterial puncture in the lab",
      ],
      answer: 2,
      explanation:
        "Time zero for system targets is the STEMI diagnosis, the moment the ECG is interpreted. Symptom onset still matters for total ischaemic time and the 12-hour window, but it is not the start of the system clock. Using arrival at the PCI centre would hide pre-hospital and transfer delays.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "mcs-q-stemi-posterior",
      stem: "A patient with ongoing chest pain has horizontal ST depression in V1–V3 with tall R waves. What is the most useful next step?",
      options: [
        "Treat as NSTEMI with angiography within 24 hours of admission",
        "Record V7–V9; ST elevation there means the primary PCI pathway",
        "Repeat the troponin in 3 hours and decide on the trend",
        "Start fibrinolysis immediately even though this is a PCI centre",
        "Arrange cardiac MRI to look for posterior wall oedema first",
      ],
      answer: 1,
      explanation:
        "ST depression in V1–V3 with dominant R waves suggests posterior MI, usually from circumflex occlusion. Posterior leads (V7–V9) showing ST elevation confirm it, and the patient should follow the primary PCI pathway. Treating as NSTEMI with angiography within 24 hours is the tempting error that leaves an occluded artery untreated for hours.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
  ],
  sims: [
    {
      sim: "cathlab",
      task: "Inferior STEMI drill: image the non-culprit left system quickly, then engage the RCA and decide which projection shows the culprit occlusion best.",
    },
  ],
  caseIds: ["mcs-case-anterior-stemi-shock"],
};

// ---------------------------------------------------------------------------
// Module 2 — NSTE-ACS timing and cardiac arrest
// ---------------------------------------------------------------------------
const arrestNste: Module = {
  id: "mcs-arrest-nste",
  title: "NSTE-ACS timing and cardiac arrest",
  stage: 4,
  summary:
    "When to take NSTE-ACS patients to the lab, which resuscitated patients need emergency angiography, how to run a cardiac arrest in the catheter laboratory, and the principles of extracorporeal CPR.",
  objectives: [
    "Allocate NSTE-ACS patients to immediate, early, inpatient or selective invasive pathways.",
    "Decide which resuscitated out-of-hospital arrest patients need emergency angiography, using COACT and TOMAHAWK.",
    "Lead or support a cardiac arrest in the lab, including stacked shocks, mechanical CPR and lab-specific causes.",
    "Explain ECPR selection principles and the system it requires.",
  ],
  lessons: [
    {
      id: "mcs-nste-timing",
      title: "NSTE-ACS: when to go to the lab",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Non-ST-elevation ACS (NSTE-ACS) covers NSTEMI and unstable angina. The culprit artery is usually open or subtotally occluded, so urgency is driven by risk rather than by the clock of evolving transmural necrosis. The exception is the patient whose artery is in fact occluded but whose ECG does not show it, often the circumflex. Ongoing pain or instability makes that patient a STEMI equivalent whatever the ECG says.",
        },
        {
          kind: "table",
          caption: "Invasive timing in NSTE-ACS (2023 ESC)",
          head: ["Pathway", "Criteria (any one)", "Timing"],
          rows: [
            ["Immediate", "Haemodynamic instability or cardiogenic shock; recurrent or refractory chest pain despite medical treatment; life-threatening arrhythmia; mechanical complication of MI; acute heart failure clearly related to ischaemia; recurrent dynamic ST changes, especially intermittent ST elevation", "Within 2 hours"],
            ["Early", "NSTEMI confirmed by a high-sensitivity troponin algorithm; dynamic ST or T-wave changes; transient ST elevation; GRACE score above 140", "Within 24 hours (a 'should be considered' recommendation)"],
            ["Inpatient", "Other high-risk features, or high suspicion of unstable angina", "During the admission"],
            ["Selective", "Low risk: troponin negative, no recurrent symptoms", "Non-invasive testing first; invasive if ischaemia is shown"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "In 2023 the early (<24 h) invasive recommendation became weaker than before. Trials have not shown a clear mortality benefit for very early angiography in stable patients, although earlier angiography shortens admission and may reduce recurrent ischaemia.",
            "Routine P2Y12 pretreatment is not recommended when coronary anatomy is unknown and early invasive management is planned.",
            "Radial access, drug-eluting stents and complete revascularisation follow the same principles as in STEMI. Identifying the culprit is harder in NSTE-ACS, and intravascular imaging helps when angiography is ambiguous.",
          ],
        },
        {
          kind: "steps",
          title: "In the lab: what is different in NSTE-ACS",
          items: [
            { title: "Find the culprit", detail: "Look for ulceration, haziness, a filling defect or a lesion that matches the ECG and the wall-motion abnormality. With several candidate lesions and no clear culprit, correlate with echo and use intravascular imaging rather than guessing." },
            { title: "Time the P2Y12 inhibitor", detail: "When early angiography is planned, give the P2Y12 inhibitor once the anatomy is known and PCI is chosen. If angiography will be delayed beyond 24 hours, pretreatment may be considered." },
            { title: "Consider surgery", detail: "Left main or complex three-vessel disease, especially with diabetes, goes to heart team discussion. In a stable NSTE-ACS patient there is usually time for it." },
            { title: "Plan the rest", detail: "Treat the culprit, then plan the remaining significant disease. Complete revascularisation remains the aim, with the timing chosen for the individual patient." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Labelling an occluded circumflex as NSTEMI and sending the patient to the next day's list. Persistent pain, haemodynamic compromise or a regional wall-motion abnormality with ongoing symptoms should trigger immediate angiography.",
            "Delaying the lab for a second troponin when the clinical picture is already very high risk.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask 'is the artery closed right now?' rather than 'is there ST elevation?'. The first question finds the patients who need the lab tonight.",
        },
      ],
      refs: ["esc-acs-2023", "supplied-medmastery"],
    },
    {
      id: "mcs-ohca",
      title: "After out-of-hospital cardiac arrest",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Coronary disease is the commonest cause of out-of-hospital cardiac arrest (OHCA) in adults, especially when the first rhythm is shockable. Angiography is only part of post-resuscitation care, however. In comatose survivors the main determinant of outcome is hypoxic brain injury, not the coronary anatomy.",
        },
        { kind: "h", text: "Who needs emergency angiography?" },
        {
          kind: "table",
          caption: "Angiography after resuscitated OHCA",
          head: ["Post-ROSC ECG and condition", "Approach (2023 ESC)", "Basis"],
          rows: [
            ["Persistent ST elevation", "Emergency angiography, with primary PCI if indicated", "High prevalence of acute occlusion"],
            ["No ST elevation, haemodynamically stable", "Routine immediate angiography is not recommended; angiography later or selectively", "COACT and TOMAHAWK"],
            ["No ST elevation but ongoing ischaemia, shock, recurrent arrhythmia or strong suspicion of acute occlusion", "Urgent angiography is reasonable, decided case by case", "Clinical judgement"],
          ],
        },
        {
          kind: "p",
          text: "COACT randomised patients resuscitated from shockable-rhythm OHCA without ST elevation to immediate or delayed angiography: survival at 90 days did not differ. TOMAHAWK included all initial rhythms and found that immediate angiography did not reduce 30-day mortality; the composite of death or severe neurological deficit was numerically more frequent with the immediate strategy.",
        },
        {
          kind: "keypoints",
          title: "Why immediate angiography did not help without ST elevation",
          items: [
            "Many arrests without ST elevation are not caused by acute coronary occlusion: primary arrhythmia, respiratory or neurological causes, pulmonary embolism and haemorrhage all occur.",
            "Death is driven mainly by hypoxic brain injury and the post-cardiac arrest syndrome.",
            "A trip to the lab can delay CT, temperature control and intensive care.",
          ],
        },
        {
          kind: "steps",
          title: "Early assessment after ROSC (lab-relevant points)",
          items: [
            { title: "Repeat the 12-lead ECG", detail: "An ECG recorded in the first minutes after defibrillation and adrenaline has more false-positive ST changes. Repeat it before deciding." },
            { title: "Look for non-coronary causes", detail: "Echo for tamponade, RV dilatation (pulmonary embolism), LV function and valve disease. CT of head and chest when the cause is uncertain: intracranial haemorrhage, aortic dissection or pulmonary embolism change everything." },
            { title: "Protect the brain", detail: "Avoid hypotension and hypoxia, aim for normocapnia and follow the ICU blood pressure targets." },
            { title: "Temperature control", detail: "Actively prevent fever in patients who remain comatose (the 2023 ESC guideline uses a threshold of 37.7°C)." },
            { title: "Defer prognosis", detail: "Neurological prognostication is multimodal and is not made in the lab or in the first hours; formal assessment is deferred to at least 72 hours after admission." },
          ],
        },
        {
          kind: "pearl",
          text: "Unfavourable resuscitation features (unwitnessed arrest, no bystander CPR, long low-flow time, non-shockable rhythm, very high lactate) do not make angiography wrong, but they should shape both the decision and the early conversation with the family.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming every arrest is coronary and anticoagulating an intracranial bleed or an aortic dissection.",
            "Treating an ECG recorded immediately after shocks and adrenaline as diagnostic.",
            "Making prognostic statements to the family in the first hours.",
          ],
        },
      ],
      refs: ["esc-acs-2023", "coact-2019", "tomahawk-2021", "erc-esicm-post-resuscitation-2021"],
    },
    {
      id: "mcs-lab-arrest",
      title: "Cardiac arrest in the cath lab and ECPR",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Arrests in the lab are witnessed, monitored and often caused by something the operator can fix: a damping catheter, air, a closed artery, a perforation. That changes the algorithm. The priorities are immediate defibrillation for shockable rhythms, compressions that do not stop the operator treating the cause, and clear leadership.",
        },
        {
          kind: "steps",
          title: "Shockable rhythm on the table",
          items: [
            { title: "Confirm and call it", detail: "VF or pulseless VT on the monitor with loss of the arterial trace. Say it aloud; the arterial line is your pulse check." },
            { title: "Up to three stacked shocks", detail: "For a monitored, witnessed arrest with pads already on, give up to three shocks in quick succession before starting compressions (Resuscitation Council UK and ERC guidance). A conscious patient in VT may need a few seconds to lose consciousness first." },
            { title: "Then the ALS algorithm", detail: "If the rhythm persists, start CPR and follow the standard algorithm, counting the stacked shocks as the first shock." },
            { title: "Fix the cause", detail: "Check the guide position and pressure trace (damping), coronary flow (occlusion, dissection, air, no-reflow) and the pericardium (perforation)." },
          ],
        },
        {
          kind: "table",
          caption: "Lab-specific reversible causes",
          head: ["Cause", "Clue", "Action"],
          rows: [
            ["Damped or wedged catheter", "Ventricularised or damped pressure before VF", "Disengage, defibrillate, re-engage carefully"],
            ["Air embolism", "Air seen in the artery, ST elevation, bradycardia then VF", "Defibrillate, CPR, 100% oxygen; inject saline or contrast to push air distally; be prepared for prolonged CPR"],
            ["Acute vessel closure (dissection, thrombus, no-reflow)", "Loss of flow on angiography", "Restore flow: wire, balloon, stent; consider mechanical support"],
            ["Tamponade (perforation, wire exit)", "Rising RA pressure, falling BP, effusion on echo, contrast staining", "Pericardiocentesis, seal the perforation, review anticoagulation"],
            ["Vagal reaction", "Bradycardia and hypotension, often at sheath insertion or removal", "Atropine, fluids, pacing if needed"],
            ["Severe contrast reaction", "Hypotension, bronchospasm, rash", "Adrenaline per the anaphylaxis protocol"],
            ["Haemorrhage", "Unexplained hypotension, groin swelling, flank or back pain", "Volume, blood, control the source; think retroperitoneal"],
          ],
        },
        { kind: "h", text: "Mechanical CPR and team roles" },
        {
          kind: "p",
          text: "Manual compressions in the lab are hard to sustain, expose the compressor to radiation and make imaging and PCI almost impossible. A mechanical CPR device delivers consistent compressions and frees hands. The piston obscures part of the image, so angled views (steep LAO or RAO) are used to work around it. Randomised OHCA trials did not show mechanical CPR to be superior to good manual CPR; its value in the lab is practical. Practise fitting the device as a team so that the pause in compressions is brief.",
        },
        {
          kind: "table",
          caption: "Example team roles",
          head: ["Role", "Who (example)", "Responsibilities"],
          rows: [
            ["Team leader", "A senior clinician who is not scrubbed", "Runs the algorithm and timings, makes decisions, calls for help"],
            ["Operator", "Interventionalist at the table", "Treats the cause: wire, balloon, stent, pericardiocentesis, access for support"],
            ["Compressions", "Nursing and radiography staff", "Manual CPR, then fitting the mechanical device"],
            ["Airway", "Anaesthetist or ODP", "Airway, ventilation, waveform capnography"],
            ["Rhythm and defibrillation", "Cardiac physiologist", "Rhythm calls, shocks, pacing"],
            ["Drugs", "Nurse", "Prepares and gives drugs on instruction"],
            ["Scribe and timekeeper", "Any team member", "Records times, drugs and shocks"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "End-tidal CO2 reflects compression quality; a sudden rise can signal return of circulation.",
            "Patients who lose consciousness may move, sit up or pull at drapes: guide catheters, wires and stents can be displaced, and sterility lost.",
            "Lead and shielding stay in place. An arrest does not suspend radiation protection.",
          ],
        },
        { kind: "h", text: "Extracorporeal CPR (ECPR)" },
        {
          kind: "p",
          text: "ECPR means establishing VA-ECMO during ongoing CPR when conventional resuscitation is failing. ECMO takes over the circulation and gas exchange and buys time to treat the cause, most often coronary occlusion, pulmonary embolism or a drug-induced arrhythmia. It is resource-heavy and only works inside an organised system that can cannulate quickly.",
        },
        {
          kind: "keypoints",
          title: "Typical ECPR selection principles (programmes differ)",
          items: [
            "Witnessed arrest with immediate bystander or professional CPR (a short no-flow time).",
            "Initial shockable rhythm, or another presumed reversible cause.",
            "A short interval from arrest to ECMO flow; programmes aim for well under an hour.",
            "Signs of life or favourable markers during CPR, such as gasping or a reasonable end-tidal CO2.",
            "No known life-limiting illness, and age and physiological reserve within local criteria.",
          ],
        },
        {
          kind: "p",
          text: "Randomised ECPR trials have produced mixed results. Benefit has been seen in highly selected patients treated by experienced teams, whereas trials in broader systems did not show a clear improvement in neurologically favourable survival. ECPR is a system decision agreed before the patient arrives, not an improvised procedure.",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting ECPR after a long unwitnessed arrest without bystander CPR: neurologically intact survival is very unlikely and the resource is lost to the next patient.",
            "Dilating a femoral cannula tract without confirming that the arterial wire is in the descending aorta and the venous wire is well into the superior vena cava. A wire left in the right atrium can slip back, and the cannula can then be pushed against an intracardiac structure.",
          ],
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Simulated ECPR: during mechanical CPR, confirm on fluoroscopy that the venous wire lies well into the superior vena cava and the arterial wire in the descending aorta before dilating, then establish VA-ECMO flow.",
        },
      ],
      refs: ["esc-acs-2023", "supplied-medmastery", "elso-va-2021", "seattle-complications-2020", "rcuk-als-2021", "erc-special-circumstances-2021", "linc-2014", "paramedic-2015", "brilakis-manual-pci"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-nste-refractory",
      stem: "A patient with NSTEMI has recurrent chest pain despite nitrates and a beta-blocker. He is haemodynamically stable with dynamic ST depression. When should angiography be performed?",
      options: ["Within 2 hours", "Within 24 hours", "Within 72 hours", "Before discharge, if a stress test is positive", "As an outpatient"],
      answer: 0,
      explanation:
        "Refractory or recurrent pain despite medical treatment is a very-high-risk criterion that mandates an immediate invasive strategy (within 2 hours). The 24-hour pathway is for high-risk but pain-free and stable patients, such as a confirmed NSTEMI or a GRACE score above 140.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "mcs-q-nste-grace",
      stem: "A pain-free, stable 72-year-old has NSTEMI confirmed by a high-sensitivity troponin algorithm and a GRACE score of 156. What timing of invasive management does the 2023 ESC guideline suggest?",
      options: ["Immediately, within 2 hours", "Within 24 hours", "Only if ischaemia is shown on non-invasive testing", "No invasive strategy at his age", "Within 7 days as an elective case"],
      answer: 1,
      explanation:
        "High-risk features (confirmed NSTEMI, GRACE above 140, dynamic ST changes or transient ST elevation) support angiography within 24 hours, which the 2023 guideline frames as 'should be considered'. The immediate pathway is reserved for very-high-risk features such as shock, refractory pain or life-threatening arrhythmia, none of which he has. Age alone is not a reason to withhold an invasive strategy.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "mcs-q-ohca-nostemi",
      stem: "A 64-year-old is resuscitated from out-of-hospital VF. After ROSC he is comatose but haemodynamically stable on low-dose noradrenaline, and a repeat ECG shows no ST elevation. What is the best approach to coronary angiography?",
      options: [
        "Immediate angiography on arrival, before he is transferred to intensive care",
        "No routine immediate angiography; ICU care, seek other causes, image later",
        "No angiography during this admission under any circumstances, whatever happens",
        "Fibrinolysis in the emergency department, then angiography within 24 hours",
        "Immediate CT coronary angiography in place of invasive angiography",
      ],
      answer: 1,
      explanation:
        "COACT (shockable rhythms) and TOMAHAWK (all rhythms) found no survival benefit from immediate angiography in resuscitated patients without ST elevation, and the 2023 ESC guideline advises against routine immediate angiography in stable patients. Angiography is still done when there is ongoing ischaemia, instability or a strong suspicion of acute occlusion, and often later in the admission, so 'never' is wrong.",
      difficulty: 2,
      refs: ["coact-2019", "tomahawk-2021", "esc-acs-2023"],
    },
    {
      id: "mcs-q-ohca-stemi",
      stem: "After ROSC from out-of-hospital VF, a patient's repeat ECG shows persistent ST elevation in V1–V4. What should happen next?",
      options: [
        "Emergency coronary angiography with primary PCI if indicated",
        "ICU admission and angiography after neurological assessment at 72 hours",
        "Fibrinolysis in the emergency department",
        "CT head first in every case, then angiography the next day",
        "Echo, and angiography only if there is a regional wall-motion abnormality",
      ],
      answer: 0,
      explanation:
        "Persistent ST elevation after ROSC indicates a high likelihood of acute coronary occlusion, and the 2023 ESC guideline recommends emergency angiography with primary PCI if indicated. Waiting for neurological prognostication would delay reperfusion of a closed artery; prognostication is a separate process. CT head is added when the history suggests a neurological cause, but not to delay a STEMI pathway routinely.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "mcs-q-lab-vf",
      stem: "During an RCA injection the pressure trace becomes ventricularised and the patient develops VF. Defibrillator pads are on. What is the best immediate action?",
      options: [
        "Two minutes of chest compressions before the first shock is delivered",
        "Defibrillate now (up to three stacked shocks); withdraw the catheter",
        "Amiodarone 300 mg intravenously first, then a single shock",
        "Atropine and a fluid bolus while the defibrillator pads are checked",
        "Inject intracoronary nitrate through the catheter to relieve spasm",
      ],
      answer: 1,
      explanation:
        "A witnessed, monitored VF arrest with pads already on is treated with immediate defibrillation, using up to three stacked shocks before starting compressions. The cause here is a damping catheter, so it is withdrawn from the ostium at the same time. Starting with two minutes of CPR is the out-of-hospital approach and wastes the window in which a shock is most likely to work.",
      difficulty: 2,
      refs: ["supplied-medmastery", "rcuk-als-2021", "erc-special-circumstances-2021"],
    },
    {
      id: "mcs-q-ecpr-candidate",
      stem: "Which patient is the most appropriate candidate for ECPR?",
      options: [
        "A 52-year-old with a witnessed VF arrest, immediate bystander CPR and refractory VF, arriving 25 minutes after collapse",
        "An 84-year-old found in asystole after an unknown downtime",
        "A 60-year-old with metastatic cancer in PEA arrest",
        "A 45-year-old with an unwitnessed arrest, no bystander CPR and asystole for 70 minutes",
        "A 70-year-old with a do-not-attempt-CPR decision in place",
      ],
      answer: 0,
      explanation:
        "ECPR selection favours a witnessed arrest, immediate CPR, a shockable rhythm or presumed reversible cause, and a short time to ECMO flow. The 52-year-old meets all of these. The 45-year-old is young, which is tempting, but an unwitnessed arrest with no bystander CPR and prolonged asystole makes neurologically intact survival very unlikely.",
      difficulty: 3,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-mech-cpr",
      stem: "Which statement best describes mechanical CPR devices in the catheter laboratory?",
      options: [
        "Randomised trials showed better survival than manual CPR in all settings, including the lab",
        "Consistent compressions while the operator treats the cause; part of the image is hidden",
        "They remove the need for defibrillation because coronary and cerebral perfusion are maintained",
        "They allow pauses of 30 seconds or more for imaging without any harm to the patient",
        "They should only be used once ECMO is running and the cannulas are secured",
      ],
      answer: 1,
      explanation:
        "In the lab, the value of mechanical CPR is practical: consistent compressions, fewer people exposed to radiation, and hands freed so the operator can treat the cause. The piston hides part of the field, so angled projections are used. Large randomised OHCA trials did not show superiority over good manual CPR, so the claim of better survival in all settings overstates the evidence.",
      difficulty: 2,
      refs: ["supplied-medmastery", "linc-2014", "paramedic-2015"],
    },
    {
      id: "mcs-q-tomahawk",
      stem: "What did TOMAHAWK show for patients resuscitated from OHCA without ST elevation?",
      options: [
        "Immediate angiography reduced 30-day mortality",
        "Immediate angiography did not reduce 30-day mortality compared with a delayed or selective strategy",
        "Immediate angiography reduced the rate of severe neurological deficit",
        "Delayed angiography increased reinfarction",
        "Only patients with shockable rhythms were included",
      ],
      answer: 1,
      explanation:
        "TOMAHAWK found no reduction in 30-day all-cause mortality with immediate angiography, and the composite of death or severe neurological deficit was numerically more frequent in the immediate group. It included both shockable and non-shockable rhythms; COACT was the trial restricted to shockable rhythms.",
      difficulty: 2,
      refs: ["tomahawk-2021", "coact-2019"],
    },
  ],
  sims: [
    {
      sim: "ecmo",
      task: "ECPR drill: cannulate femoro-femorally during simulated mechanical CPR, check both wire positions before dilating, and start flow.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 — Cardiogenic shock
// ---------------------------------------------------------------------------
const shock: Module = {
  id: "mcs-shock",
  title: "Cardiogenic shock",
  stage: 5,
  summary:
    "Definitions and SCAI staging, causes, invasive haemodynamic phenotyping, early revascularisation, vasoactive drugs, the shock team, choosing mechanical support, de-escalation and goals of care.",
  objectives: [
    "Define cardiogenic shock clinically and haemodynamically and assign a SCAI stage.",
    "Phenotype shock (LV, RV or biventricular; congested or not) using lactate, cardiac power output, PAPi and filling pressures.",
    "Apply SHOCK and CULPRIT-SHOCK to revascularisation decisions.",
    "Choose and titrate vasopressors and inotropes.",
    "Summarise the randomised evidence for IABP, VA-ECMO and microaxial flow pumps, and decide when to escalate or de-escalate support.",
  ],
  lessons: [
    {
      id: "mcs-shock-definitions",
      title: "Definitions, SCAI stages and causes",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Cardiogenic shock is critical end-organ hypoperfusion caused by primary cardiac dysfunction. Blood pressure is only part of it: a patient can be normotensive on vasopressors, or hypotensive yet well perfused. Perfusion is what matters.",
        },
        {
          kind: "table",
          caption: "A classic trial definition (as used in SHOCK and IABP-SHOCK II)",
          head: ["Domain", "Criteria"],
          rows: [
            ["Hypotension", "Systolic BP below 90 mmHg for at least 30 minutes, or vasopressors needed to keep it at 90 or above"],
            ["Congestion", "Pulmonary congestion clinically or radiologically, or raised filling pressures"],
            ["Hypoperfusion", "At least one of: altered mental state, cold clammy skin and peripheries, oliguria (below 30 mL/h), lactate above 2 mmol/L"],
            ["Haemodynamics, if measured", "Cardiac index 2.2 L/min/m² or less with PCWP of 15 mmHg or more"],
          ],
        },
        { kind: "h", text: "SCAI shock stages" },
        {
          kind: "p",
          text: "The SCAI classification (2019, updated 2022) describes shock as a spectrum. Stage the patient at presentation and again after each intervention: patients move between stages, and each step up is associated with higher mortality.",
        },
        {
          kind: "table",
          caption: "SCAI SHOCK stages (summary)",
          head: ["Stage", "Name", "Typical picture"],
          rows: [
            ["A", "At risk", "No shock yet, but at risk: for example a large acute MI or acutely decompensated heart failure. Normal blood pressure and perfusion."],
            ["B", "Beginning", "Relative hypotension (systolic below 90, MAP below 60, or a fall of more than 30 mmHg from baseline) or tachycardia, without hypoperfusion; lactate normal."],
            ["C", "Classic", "Hypoperfusion needing an intervention beyond fluid (vasopressor, inotrope or mechanical support); lactate 2 mmol/L or more; often congested."],
            ["D", "Deteriorating", "Failing to respond to initial measures: haemodynamics or lactate worsening despite treatment, so support has to be escalated."],
            ["E", "Extremis", "Circulatory collapse: refractory cardiac arrest with ongoing CPR or ECMO, or multiple simultaneous interventions failing."],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Cardiac arrest is a modifier that raises risk at every stage, particularly when the patient remains comatose after return of circulation.",
            "Contemporary frameworks combine severity (stage), phenotype and cause, and patient-level risk modifiers such as age, arrest and comorbidity.",
            "The lactate trend and urine output are the most practical bedside markers of response.",
          ],
        },
        { kind: "h", text: "Causes" },
        {
          kind: "table",
          caption: "Aetiologies of cardiogenic shock",
          head: ["Group", "Examples", "Practical relevance"],
          rows: [
            ["Acute MI (AMI-CS)", "Large anterior MI, left main or multivessel ischaemia, RV infarction, mechanical complications", "Emergency angiography and revascularisation"],
            ["Heart failure-related (HF-CS)", "Acute decompensation of a chronic cardiomyopathy", "Revascularisation is rarely the answer; support as a bridge to recovery, durable VAD or transplant"],
            ["Other myocardial", "Fulminant myocarditis, Takotsubo syndrome, peripartum cardiomyopathy, post-cardiotomy, drug toxicity", "Often recoverable: a strong case for support as a bridge to recovery"],
            ["Valvular and mechanical", "Acute severe aortic or mitral regurgitation, critical aortic stenosis, prosthetic valve thrombosis, ventricular septal rupture", "Determines which devices are safe; often needs a surgical or transcatheter fix"],
            ["Arrhythmic", "Incessant VT, extreme bradycardia", "Rhythm control or pacing first"],
            ["Obstructive mimics", "Tamponade, massive pulmonary embolism, tension pneumothorax", "Different treatment: drain, reperfuse, decompress"],
          ],
        },
        {
          kind: "p",
          text: "In contemporary registries, heart failure-related shock is at least as common as AMI-related shock, yet almost all randomised evidence comes from AMI-CS. Be careful when extrapolating trial results to other causes.",
        },
        {
          kind: "pitfalls",
          items: [
            "Waiting for hypotension. A tachycardic, cool, normotensive patient (SCAI B) is the window in which to act.",
            "Starting inotropes in Takotsubo syndrome with LV outflow tract obstruction: they increase the gradient. Echo first.",
            "Missing mixed shock. A febrile patient with a low systemic vascular resistance may have sepsis on top of cardiac failure.",
          ],
        },
      ],
      refs: ["scai-shock-2022", "shock-1999", "iabp-shock-ii-2012", "esc-hf-2021", "esc-acs-2023"],
    },
    {
      id: "mcs-shock-phenotyping",
      title: "Haemodynamic phenotyping",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Two patients with the same blood pressure can need opposite treatments. Phenotyping asks four questions: is perfusion adequate, is the patient congested, which ventricle is failing, and is the vasculature constricted or dilated? A pulmonary artery (PA) catheter answers most of them; echo and lactate answer the rest.",
        },
        {
          kind: "table",
          caption: "Bedside profiles",
          head: ["Profile", "Perfusion", "Congestion", "Typical situation"],
          rows: [
            ["Cold and wet", "Poor", "Present", "Classic AMI-CS; the commonest profile"],
            ["Cold and dry", "Poor", "Absent", "Relative hypovolaemia on top of ventricular dysfunction, for example after diuresis or vomiting"],
            ["Warm and wet", "Preserved or vasodilated", "Present", "Mixed or vasodilatory shock: systemic inflammation, sepsis overlap"],
            ["Warm and dry", "Adequate", "Absent", "Compensated; not shock"],
          ],
        },
        { kind: "h", text: "Key measurements" },
        {
          kind: "formula",
          name: "Cardiac power output (CPO)",
          expr: "CPO (W) = MAP (mmHg) × CO (L/min) ÷ 451",
          note: "Combines pressure and flow into the heart's hydraulic output. A CPO below about 0.6 W has been associated with high mortality in AMI-related shock.",
        },
        {
          kind: "formula",
          name: "Pulmonary artery pulsatility index (PAPi)",
          expr: "PAPi = (PA systolic − PA diastolic) ÷ RA pressure",
          note: "Relates RV pulse generation to its filling pressure. Low values indicate RV failure. Thresholds depend on context: values below roughly 0.9 have been linked to severe RV dysfunction in acute inferior MI, while higher cut-offs (around 1.85) are used in other settings such as LVAD assessment.",
        },
        {
          kind: "formula",
          name: "Systemic vascular resistance (SVR)",
          expr: "SVR (dyn·s·cm⁻⁵) = 80 × (MAP − RA pressure) ÷ CO",
          note: "Normal approximately 800–1200. High in classic cold shock, low in vasodilated or mixed shock.",
        },
        {
          kind: "formula",
          name: "Cardiac index (CI)",
          expr: "CI (L/min/m²) = CO ÷ body surface area",
          note: "Normal approximately 2.5–4.0. A value of 2.2 or less supports cardiogenic shock in the right clinical context.",
        },
        {
          kind: "formula",
          name: "RA:PCWP ratio",
          expr: "RA pressure ÷ PCWP",
          note: "Normally well below 1 (around 0.5). A ratio approaching or above 0.8 suggests disproportionate RV failure.",
        },
        {
          kind: "table",
          caption: "Phenotype by haemodynamics",
          head: ["Phenotype", "RA", "PCWP", "PAPi", "Practical implication"],
          rows: [
            ["LV-dominant", "Normal or mildly raised", "High", "Preserved", "Direct LV unloading (for example a microaxial pump) is logical if support is needed"],
            ["RV-dominant", "High", "Normal or low", "Low", "Careful volume, inotropes, pulmonary vasodilators, RV support; a left-sided pump alone will fail"],
            ["Biventricular", "High", "High", "Low", "Needs support for both sides: VA-ECMO with LV unloading, or left and right pumps"],
            ["Vasodilated or mixed", "Variable", "Variable", "Variable", "Low SVR: look for sepsis or systemic inflammation; vasopressor needs dominate"],
          ],
        },
        {
          kind: "keypoints",
          title: "Perfusion markers",
          items: [
            "Lactate above 2 mmol/L indicates hypoperfusion in this setting; the trend over hours tells you more than a single value.",
            "Mixed venous saturation (SvO2) from the PA catheter falls when oxygen delivery is inadequate; normal is approximately 65–75%.",
            "Urine output, creatinine, liver enzymes and mental state track end-organ perfusion.",
          ],
        },
        {
          kind: "p",
          text: "Measure early. A full set (RA, RV, PA and wedge pressures, cardiac output by thermodilution or Fick, and SvO2) can be obtained in minutes at the time of angiography through a femoral, brachial or internal jugular venous sheath. It sets the baseline against which every later decision is judged.",
        },
        {
          kind: "pitfalls",
          items: [
            "Thermodilution is unreliable with severe tricuspid regurgitation or intracardiac shunts, and Fick with an assumed oxygen consumption is approximate. Use both, and follow the trend.",
            "The wedge pressure overestimates LV filling when giant v waves from mitral regurgitation are read at their peak, and is distorted by high PEEP. Read at end-expiration and at the right point of the waveform.",
            "Treating a number in isolation: always ask how the measurement fits the clinical picture and echo.",
          ],
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Right heart study in a hypotensive post-MI patient: record RA, PA and wedge pressures, measure cardiac output, then calculate CPO and PAPi and classify the phenotype as LV-dominant, RV-dominant or biventricular.",
        },
      ],
      refs: ["scai-shock-2022", "esc-hf-2021", "hanna-pcm", "fincke-cpo-2004", "korabathina-papi-2012"],
    },
    {
      id: "mcs-shock-management",
      title: "Revascularisation, drugs and the shock team",
      minutes: 9,
      blocks: [
        { kind: "h", text: "Revascularise the culprit early" },
        {
          kind: "p",
          text: "SHOCK (1999) randomised AMI-CS patients to emergency revascularisation (PCI or CABG) or initial medical stabilisation. Mortality at 30 days was not significantly different, but by 6 months survival was significantly better with early revascularisation, and the benefit persisted at long-term follow-up. Emergency revascularisation of the culprit remains the intervention in AMI-CS with the strongest randomised support.",
        },
        {
          kind: "p",
          text: "CULPRIT-SHOCK compared culprit-only PCI (with optional staged revascularisation later) against immediate multivessel PCI. Culprit-only PCI reduced the 30-day composite of death or severe renal failure needing renal replacement therapy, mainly through lower mortality; the mortality difference narrowed by one year. The 2023 ESC guideline recommends culprit-only PCI at the index procedure in cardiogenic shock.",
        },
        {
          kind: "keypoints",
          items: [
            "If the anatomy is unsuitable for PCI, or there is a mechanical complication, emergency surgery is the alternative.",
            "If primary PCI is not available within 120 minutes and mechanical complications have been excluded, fibrinolysis should be considered (2023 ESC).",
            "Radial access for the coronary work; ultrasound-guided femoral access planned for devices.",
            "Chronic total occlusions in non-culprit arteries are not attempted at the index procedure.",
          ],
        },
        { kind: "h", text: "Vasoactive drugs" },
        {
          kind: "table",
          caption: "Vasoactive drugs in cardiogenic shock",
          head: ["Drug", "Main action", "Role", "Cautions"],
          rows: [
            ["Noradrenaline", "α1 vasoconstriction with some β1 effect", "First-line vasopressor to restore MAP (commonly to about 65 mmHg)", "Raises afterload; does not fix low output on its own"],
            ["Dobutamine", "β1 inotropy with β2 vasodilation", "First-line inotrope for low output once MAP is adequate", "Tachycardia, arrhythmias, more myocardial oxygen demand, hypotension"],
            ["Milrinone", "Phosphodiesterase-3 inhibitor: inotropy and vasodilation", "Alternative to dobutamine; useful with beta-blockade or raised pulmonary vascular resistance", "Hypotension; accumulates in renal failure"],
            ["Levosimendan", "Calcium sensitiser with vasodilation", "Used in some centres, including to aid weaning", "Hypotension; long-acting active metabolite"],
            ["Adrenaline", "β1, β2 and α effects", "Not a routine first-line choice in AMI-CS", "Tachycardia, lactic acidosis; more refractory shock than noradrenaline in a randomised comparison"],
            ["Dopamine", "Dose-dependent mixed effects", "Generally avoided", "More arrhythmias than noradrenaline, with worse outcomes in the shock subgroup of a large comparative trial"],
            ["Vasopressin", "V1 vasoconstriction", "Add-on when vasodilatation is prominent", "Less effect on pulmonary vascular resistance than catecholamines"],
          ],
        },
        {
          kind: "p",
          text: "Milrinone and dobutamine performed similarly in a randomised comparison in cardiogenic shock (DOREMI), so the choice rests on blood pressure, renal function, rhythm and whether the patient is beta-blocked. Doses follow local protocols.",
        },
        {
          kind: "pearl",
          text: "Every increase in vasoactive dose costs myocardial oxygen and arrhythmic risk. Rising doses without a falling lactate are the signal to reconsider the phenotype and mechanical support, not just to add another drug.",
        },
        { kind: "h", text: "The shock team and networks" },
        {
          kind: "list",
          items: [
            "A single call activates a multidisciplinary team: interventional cardiologist, heart failure cardiologist, cardiac surgeon, intensivist or cardiac anaesthetist, and perfusionist.",
            "Standardised protocols cover early recognition, early invasive haemodynamics, revascularisation and defined triggers for escalation.",
            "Hub-and-spoke networks: spoke hospitals recognise, stabilise and transfer; hubs provide mechanical support, surgery, and transplant and durable VAD assessment.",
            "Observational data associate shock teams and protocols with better survival; randomised evidence is lacking.",
          ],
        },
        {
          kind: "steps",
          title: "A practical sequence for AMI-CS",
          items: [
            { title: "Recognise", detail: "Stage early (SCAI), measure lactate, perform an echo and exclude mechanical complications." },
            { title: "Revascularise", detail: "Culprit-only PCI, radial where possible, with femoral access planned under ultrasound." },
            { title: "Measure", detail: "Right heart catheterisation in the lab: CPO, PAPi and filling pressures." },
            { title: "Support", detail: "Noradrenaline for MAP; add dobutamine if output remains low; ventilation and renal support as needed." },
            { title: "Reassess at short intervals", detail: "If lactate rises and drug requirements escalate (SCAI D), convene the shock team to discuss mechanical support." },
            { title: "Define the exit", detail: "Recovery, bridge to durable VAD or transplant, or palliation. Every device decision needs an exit strategy." },
          ],
        },
      ],
      refs: ["shock-1999", "culprit-shock-2017", "esc-acs-2023", "esc-hf-2021", "scai-shock-2022", "doremi-2021", "optimacc-2018"],
    },
    {
      id: "mcs-shock-mcs-choice",
      title: "When to use mechanical support",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Temporary mechanical circulatory support (MCS) can raise perfusion, lower filling pressures and rest the myocardium. It also brings large-bore access, bleeding, limb ischaemia, haemolysis and stroke. The evidence base has changed considerably in the last decade, and each device has a different trial story.",
        },
        {
          kind: "table",
          caption: "Randomised evidence in AMI-related cardiogenic shock",
          head: ["Trial", "Comparison", "Main finding (direction)", "Lesson"],
          rows: [
            ["IABP-SHOCK II (2012)", "IABP versus no IABP, with early revascularisation", "No reduction in 30-day mortality, and no benefit at longer follow-up", "Routine IABP in AMI-CS is not recommended"],
            ["ECLS-SHOCK (2023)", "Early routine VA-ECMO versus medical therapy, with early revascularisation", "No reduction in 30-day mortality; more bleeding and peripheral vascular complications", "Routine early VA-ECMO in AMI-CS is not supported; selective use continues"],
            ["DanGer Shock (2024)", "Microaxial flow pump (Impella CP) plus standard care versus standard care, in STEMI-related shock", "Lower all-cause mortality at 180 days; more adverse events including bleeding, limb ischaemia and renal replacement therapy", "Selected LV-dominant STEMI shock in patients who are not comatose may benefit; the complications are real"],
          ],
        },
        {
          kind: "p",
          text: "DanGer Shock enrolled patients with STEMI, raised lactate and reduced LV function, and excluded patients who remained comatose after out-of-hospital arrest and those with predominant RV failure. Its result should not be extrapolated to all shock. The 2023 ESC ACS guideline predates it: it advises against routine IABP and makes short-term MCS a weak recommendation for severe or refractory shock. The 2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS guideline, as summarised by one of its authors, gives a microaxial flow pump a Class IIa recommendation in selected patients with refractory MI-related shock on the basis of DanGer Shock, and rates routine IABP and routine ECMO as Class III.",
        },
        {
          kind: "table",
          caption: "Matching support to phenotype (principles)",
          head: ["Scenario", "Logical support", "Why"],
          rows: [
            ["LV-dominant AMI-CS, adequate oxygenation, not comatose", "Microaxial flow pump", "Unloads the LV directly and adds forward flow"],
            ["Biventricular failure, severe hypoxaemia or refractory arrest", "VA-ECMO, usually with an LV unloading strategy", "Supports both circulations and gas exchange"],
            ["RV-dominant failure", "Percutaneous RV support (for example a right-sided microaxial pump) or VA-ECMO", "A left-sided pump cannot fill when the RV fails"],
            ["Mechanical complication awaiting surgery", "IABP, or VA-ECMO or a microaxial pump chosen case by case", "Afterload reduction as a bridge to theatre"],
            ["Moderate or severe aortic regurgitation, LV thrombus, or severe aorto-iliac disease", "Avoid transaortic pumps; consider other devices or access routes", "Device-specific contraindications"],
          ],
        },
        {
          kind: "keypoints",
          title: "Triggers to discuss mechanical support with the shock team",
          items: [
            "SCAI C not stabilising after revascularisation and first-line drugs, or SCAI D.",
            "Rising lactate, low or falling CPO, rising filling pressures, escalating vasoactive doses.",
            "A plausible exit strategy and no contraindication to the device.",
            "If support is used, starting before multi-organ failure is more plausible than salvage in extremis. Observational data favour earlier use, but this has not been proven.",
          ],
        },
        { kind: "h", text: "Escalation, de-escalation and goals of care" },
        {
          kind: "p",
          text: "Escalation means adding or upgrading support, for example from a microaxial pump to VA-ECMO, or adding RV support. De-escalation starts as soon as perfusion stabilises: wean vasoactive drugs first, then device support, guided by lactate, CPO, filling pressures and echo. Every day on a device carries complication risk.",
        },
        {
          kind: "pitfalls",
          items: [
            "A device without a destination: a patient who cannot recover and is not a candidate for durable VAD or transplant is on a 'bridge to nowhere'.",
            "Deciding on mechanical support in extremis without involving the family. Discuss realistic outcomes and agree a time-limited trial with review points.",
            "Using mechanical support to postpone the culprit decision: revascularisation comes first.",
          ],
        },
        {
          kind: "pearl",
          text: "Frame support to families as a time-limited trial: 'We will support the heart for a few days to see whether it recovers. If the organs keep failing despite support, we will talk again about what can be achieved.'",
        },
      ],
      refs: ["iabp-shock-ii-2012", "ecls-shock-2023", "danger-shock-2024", "esc-acs-2023", "scai-shock-2022", "elso-va-2021", "rao-acs-guideline-2025", "restrepo-acs-guideline-review-2026"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-shock-scai-c",
      stem: "After primary PCI to an occluded LAD, a patient has HR 112, BP 92/60 mmHg on noradrenaline 0.08 µg/kg/min, cool peripheries and lactate 3.6 mmol/L. Over the next hour lactate falls to 2.9 mmol/L and urine output improves on the same dose. Which SCAI stage best describes him?",
      options: ["Stage A", "Stage B", "Stage C", "Stage D", "Stage E"],
      answer: 2,
      explanation:
        "Hypoperfusion (raised lactate, cool peripheries) needing a vasopressor beyond fluid is stage C. He is responding to that first intervention, so he is not deteriorating (stage D), which would require worsening despite initial treatment and escalation of support. Stage B has hypotension or tachycardia without hypoperfusion.",
      difficulty: 1,
      refs: ["scai-shock-2022"],
    },
    {
      id: "mcs-q-shock-cpo",
      stem: "A patient in cardiogenic shock has MAP 60 mmHg and cardiac output 3.0 L/min. What is the cardiac power output?",
      options: ["0.18 W", "0.40 W", "0.66 W", "1.20 W", "180 W"],
      answer: 1,
      explanation:
        "CPO = MAP × CO ÷ 451 = 60 × 3.0 ÷ 451 ≈ 0.40 W. This is well below the approximately 0.6 W level associated with poor outcomes in AMI-related shock. Forgetting the constant gives 180, which is not a power in watts; the factor 451 converts mmHg × L/min into watts.",
      difficulty: 2,
      refs: ["scai-shock-2022", "fincke-cpo-2004"],
    },
    {
      id: "mcs-q-shock-papi",
      stem: "After an inferior MI, a hypotensive patient has PA pressure 30/18 mmHg, RA pressure 16 mmHg and PCWP 12 mmHg. What is the PAPi and what does it suggest?",
      options: [
        "0.75, suggesting significant RV dysfunction",
        "1.00, suggesting normal RV function",
        "1.88, suggesting normal RV function",
        "2.50, suggesting LV-dominant failure",
        "0.25, suggesting volume depletion",
      ],
      answer: 0,
      explanation:
        "PAPi = (PA systolic − PA diastolic) ÷ RA = (30 − 18) ÷ 16 = 0.75. A low PAPi with an RA pressure higher than the wedge (RA:PCWP 1.3) indicates RV-predominant failure, as expected in RV infarction. A value of 1.00 comes from dividing by the wedge pressure (12) instead of the RA pressure, a common error that hides RV failure.",
      difficulty: 2,
      refs: ["hanna-pcm", "korabathina-papi-2012"],
    },
    {
      id: "mcs-q-shock-culprit",
      stem: "A patient in cardiogenic shock has PCI to an occluded LAD with TIMI 3 flow restored. There is also an 85% RCA stenosis and a chronic total occlusion of the circumflex. What is the best strategy for the other lesions?",
      options: [
        "Treat the RCA now and attempt the circumflex occlusion in the same sitting",
        "Treat the RCA now and leave the circumflex occlusion for a later decision",
        "Stop after the culprit; consider staged treatment once he has recovered",
        "Refer for emergency CABG of the RCA and circumflex straight from the lab",
        "Insert an IABP and then treat all lesions while the balloon supports him",
      ],
      answer: 2,
      explanation:
        "In CULPRIT-SHOCK, culprit-only PCI reduced the 30-day composite of death or severe renal failure compared with immediate multivessel PCI, and the 2023 ESC guideline recommends culprit-only PCI at the index procedure. Treating the RCA immediately is the tempting option but is exactly the multivessel strategy that performed worse. Non-culprit lesions can be reassessed and staged after recovery.",
      difficulty: 1,
      refs: ["culprit-shock-2017", "esc-acs-2023"],
    },
    {
      id: "mcs-q-shock-iabp2",
      stem: "What did IABP-SHOCK II show in AMI-related cardiogenic shock treated with early revascularisation?",
      options: [
        "IABP reduced 30-day mortality",
        "IABP did not reduce mortality at 30 days or at longer follow-up",
        "IABP increased stroke and was stopped early for harm",
        "IABP improved survival only in anterior MI",
        "IABP was superior to VA-ECMO",
      ],
      answer: 1,
      explanation:
        "IABP-SHOCK II randomised about 600 patients and found no reduction in 30-day mortality, with no benefit at longer follow-up. This led to the recommendation against routine IABP in AMI-CS. The trial did not show harm or stop early, and it did not compare IABP with VA-ECMO.",
      difficulty: 2,
      refs: ["iabp-shock-ii-2012", "esc-acs-2023"],
    },
    {
      id: "mcs-q-shock-danger",
      stem: "For which patient is the evidence from DanGer Shock least applicable?",
      options: [
        "An awake patient with anterior STEMI, lactate 4 mmol/L and LVEF 25%",
        "A patient who remains comatose after out-of-hospital arrest, with STEMI and shock",
        "A patient with inferolateral STEMI, LV-dominant shock and lactate 3 mmol/L",
        "A patient with STEMI and shock who has had culprit PCI and needs escalating noradrenaline",
        "A patient with STEMI and shock with preserved RV function on echo",
      ],
      answer: 1,
      explanation:
        "DanGer Shock excluded patients who remained comatose after out-of-hospital arrest (and those with predominant RV failure), so its survival benefit cannot be assumed for them. The other patients resemble the enrolled population: STEMI, raised lactate, reduced LV function and LV-dominant shock.",
      difficulty: 3,
      refs: ["danger-shock-2024"],
    },
    {
      id: "mcs-q-shock-pressor",
      stem: "After culprit PCI, a patient has MAP 58 mmHg, cardiac index 1.7 L/min/m², PCWP 26 mmHg and lactate 4.1 mmol/L. Which drug strategy is most appropriate first?",
      options: [
        "Noradrenaline to restore MAP, then add dobutamine for low output",
        "Dopamine as a single agent at an escalating inotropic dose",
        "Adrenaline as first-line monotherapy for pressure and output",
        "A 1 litre fluid bolus to raise preload before any drug is started",
        "Intravenous furosemide alone to offload the congested ventricle",
      ],
      answer: 0,
      explanation:
        "Noradrenaline is the preferred first-line vasopressor to restore perfusion pressure, and dobutamine is added for low output once MAP is adequate. Adrenaline produced more refractory shock than noradrenaline in a randomised comparison, and dopamine causes more arrhythmias. With a PCWP of 26 mmHg, a fluid bolus would worsen congestion.",
      difficulty: 2,
      refs: ["esc-hf-2021", "optimacc-2018"],
    },
    {
      id: "mcs-q-shock-rv-device",
      stem: "Despite reperfusion of an RCA occlusion, inotropes and optimised filling, a patient remains in shock with RA 22 mmHg, PCWP 10 mmHg, PAPi 0.6, good LV function on echo and adequate oxygenation. Which mechanical support is most logical?",
      options: [
        "A left-sided microaxial flow pump across the aortic valve",
        "Percutaneous RV support, such as a right-sided pump",
        "An intra-aortic balloon pump at 1:1 augmentation",
        "VV-ECMO to support gas exchange through the femoral veins",
        "No device; increase the noradrenaline and add vasopressin",
      ],
      answer: 1,
      explanation:
        "This is RV-dominant shock: high RA pressure, low wedge, low PAPi and a good LV. A right-sided pump moves blood from the venous system into the pulmonary artery and bypasses the failing RV; VA-ECMO is the alternative. A left-sided pump is the tempting distractor, but it would empty an underfilled LV and trigger suction. VV-ECMO supports gas exchange only.",
      difficulty: 3,
      refs: ["scai-shock-2022", "hanna-pcm", "korabathina-papi-2012"],
    },
    {
      id: "mcs-q-shock-ecls",
      stem: "What did ECLS-SHOCK show about early routine VA-ECMO in AMI-related cardiogenic shock?",
      options: [
        "Lower 30-day mortality with fewer complications than medical therapy",
        "No fall in 30-day mortality; more bleeding and vascular complications",
        "Lower mortality only in the subgroup resuscitated from cardiac arrest",
        "Higher mortality with ECMO, which led to early termination of the trial",
        "Better neurological outcomes at 30 days but no change in overall survival",
      ],
      answer: 1,
      explanation:
        "ECLS-SHOCK found no difference in 30-day all-cause mortality between early routine VA-ECMO and medical therapy, while moderate or severe bleeding and peripheral vascular complications needing intervention were more frequent with ECMO. Most enrolled patients had been resuscitated before randomisation, so the trial does not suggest a benefit confined to that group.",
      difficulty: 2,
      refs: ["ecls-shock-2023"],
    },
  ],
  sims: [
    {
      sim: "haemo",
      task: "Shock phenotyping: obtain RA, PA and wedge pressures, thermodilution output and SvO2, then calculate CPO, PAPi and SVR and state the phenotype.",
    },
  ],
  caseIds: ["mcs-case-anterior-stemi-shock"],
};

// ---------------------------------------------------------------------------
// Module 4 — Intra-aortic balloon pump
// ---------------------------------------------------------------------------
const iabp: Module = {
  id: "mcs-iabp",
  title: "Intra-aortic balloon pump",
  stage: 4,
  summary:
    "Counterpulsation physiology, indications and contraindications, sizing, insertion and tip position, timing and the four timing errors, triggers and ratios, troubleshooting, weaning, complications and evidence.",
  objectives: [
    "Explain how diastolic inflation and pre-systolic deflation change coronary perfusion and LV afterload.",
    "Size, insert and position an IABP and confirm the tip position.",
    "Recognise the four timing errors on a 1:2 arterial trace and correct them.",
    "Choose triggers and ratios, troubleshoot alarms, wean and remove the device safely.",
    "State the contraindications, complications and evidence base, including where the IABP still fits.",
  ],
  lessons: [
    {
      id: "mcs-iabp-physiology",
      title: "Counterpulsation: how the balloon works",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "An intra-aortic balloon pump (IABP) is a catheter carrying a long, sausage-shaped balloon that sits in the descending thoracic aorta. A console shuttles helium in and out in time with the cardiac cycle: the balloon inflates in diastole and deflates just before systole. This is counterpulsation, with the balloon working out of phase with the ventricle.",
        },
        {
          kind: "table",
          caption: "What inflation and deflation do",
          head: ["Phase", "Event", "Effect"],
          rows: [
            ["Inflation at aortic valve closure (the dicrotic notch)", "Blood in the aorta is displaced towards the arch and towards the legs", "Diastolic aortic pressure rises (diastolic augmentation), increasing coronary perfusion pressure and perfusion of the arch vessels"],
            ["Deflation just before the next systole", "A sudden fall in aortic volume", "Aortic end-diastolic pressure falls, so the LV ejects against a lower pressure: lower afterload, wall stress and myocardial oxygen demand"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Helium is used because its low density allows rapid inflation and deflation through a long, narrow catheter.",
            "The IABP is a pressure device, not a flow pump. It increases cardiac output only modestly, typically well under 1 L/min, and the gain depends on native LV function.",
            "It needs a native rhythm and some LV ejection to work. In VF or asystole it does nothing useful.",
            "LV myocardium is perfused mainly in diastole, which is why diastolic augmentation can help ischaemic myocardium; the effect is smaller beyond a severe fixed stenosis.",
          ],
        },
        {
          kind: "table",
          caption: "Where the IABP sits in contemporary practice",
          head: ["Situation", "Status"],
          rows: [
            ["Mechanical complications of MI (VSR, acute mitral regurgitation) as a bridge to surgery", "Supported by the 2023 ESC guideline"],
            ["Routine use in AMI-related cardiogenic shock", "Not recommended (IABP-SHOCK II)"],
            ["Refractory ischaemia awaiting revascularisation", "Occasional use; limited evidence"],
            ["High-risk PCI with poor LV function", "Selective use; no randomised mortality benefit for routine use"],
            ["Heart failure-related shock as a bridge to decision, VAD or transplant", "Used in some centres; evidence evolving"],
            ["LV unloading during VA-ECMO", "One of several venting options"],
          ],
        },
        {
          kind: "pitfalls",
          title: "Contraindications",
          items: [
            "Moderate or severe aortic regurgitation: diastolic inflation increases the regurgitant volume.",
            "Aortic dissection.",
            "Significant thoracic or abdominal aortic aneurysm, or an aortic stent graft (relative).",
            "Severe aorto-iliac or peripheral arterial disease (relative; consider another access route).",
            "Uncontrolled bleeding or coagulopathy, and sepsis (relative).",
          ],
        },
        { kind: "h", text: "Sizing and insertion" },
        {
          kind: "p",
          text: "Balloon volume is chosen from the manufacturer's height-based chart, so that the inflated balloon nearly (not completely) occludes the aorta and spans from just below the left subclavian artery to above the renal arteries. Adult balloons commonly range from about 25 to 50 mL, with 40 mL the commonest choice for adults of average height; check the device's instructions for use. Contemporary catheters are about 7–8 Fr and can be inserted through a sheath or sheathless, which reduces the occlusive footprint in the femoral artery.",
        },
        {
          kind: "steps",
          title: "Femoral insertion",
          items: [
            { title: "Access", detail: "Ultrasound-guided common femoral puncture on the side with the better pulse. If the iliac anatomy is unknown, a short angiogram through the sheath shows tortuosity and disease." },
            { title: "Prepare the balloon", detail: "Apply vacuum to the balloon through the one-way valve as the manufacturer describes, keep it wrapped until insertion, and flush the central lumen." },
            { title: "Advance under fluoroscopy", detail: "Take the guidewire to the aortic arch and advance the balloon over it. Never advance against resistance." },
            { title: "Position", detail: "The radio-opaque tip should sit 1–2 cm below the origin of the left subclavian artery, roughly at the level of the carina on a chest X-ray. The lower end should lie above the renal arteries." },
            { title: "Connect and start", detail: "Zero and connect the central-lumen pressure line, connect the gas line, choose a trigger, start at 1:2 to check timing, then move to 1:1." },
            { title: "Secure and check", detail: "Suture and dress; check both legs, the left radial pulse and urine output; document baseline limb observations. Check the position on a chest X-ray, and again after transfers." },
          ],
        },
        {
          kind: "pitfalls",
          title: "Malposition",
          items: [
            "Too high: may obstruct the left subclavian artery (loss of the left radial pulse or trace) or impinge on the arch vessels.",
            "Too low: may cover the renal or mesenteric arteries (falling urine output, rising creatinine, abdominal pain, acidosis) and gives less augmentation.",
            "Balloon not fully unwrapped from its sheath: poor augmentation and pressure alarms.",
          ],
        },
      ],
      refs: ["iabp-shock-ii-2012", "esc-acs-2023", "hanna-pcm", "supplied-medmastery"],
    },
    {
      id: "mcs-iabp-timing",
      title: "Timing, triggers and the four errors",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Timing is judged on the arterial waveform, ideally from the balloon's own central lumen in the aorta. Set the pump to 1:2 to assess it, because that shows an assisted beat beside an unassisted one, and every judgement is a comparison between the two.",
        },
        {
          kind: "figure",
          id: "iabp-timing",
          caption: "Correct IABP timing on a 1:2 trace compared with early and late inflation and early and late deflation.",
        },
        {
          kind: "table",
          caption: "A correctly timed 1:2 trace",
          head: ["Landmark", "What you should see"],
          rows: [
            ["Inflation point", "At the dicrotic notch, producing a sharp V where the notch was"],
            ["Diastolic augmentation", "Peak diastolic pressure rises, ideally to or above the unassisted systolic pressure"],
            ["Assisted aortic end-diastolic pressure", "Lower than the unassisted end-diastolic pressure"],
            ["Assisted systolic pressure (the beat after the balloon)", "Lower than the unassisted systolic pressure, because the LV ejects against less resistance"],
          ],
        },
        {
          kind: "table",
          caption: "The four timing errors",
          head: ["Error", "Waveform", "Consequence", "Correction"],
          rows: [
            ["Early inflation", "Inflation before the dicrotic notch; augmentation merges into the end of the systolic waveform and the notch disappears", "Premature aortic valve closure, lower stroke volume, higher LV end-diastolic volume and pressure, possible aortic regurgitation, more oxygen demand", "Move inflation later, to the notch"],
            ["Late inflation", "The dicrotic notch is visible before augmentation begins; no sharp V", "Less diastolic augmentation and therefore less coronary perfusion", "Move inflation earlier"],
            ["Early deflation", "Augmentation falls away sharply, with a U-shaped dip before the next systole; assisted end-diastolic pressure equal to or below unassisted, and assisted systole not reduced", "Little afterload reduction and shorter augmentation; possible retrograde coronary and carotid flow, which may provoke angina", "Move deflation later"],
            ["Late deflation", "Assisted end-diastolic pressure equal to or higher than unassisted; augmentation looks widened; the next systolic upstroke is slow", "The balloon is still inflated as the LV starts to eject: higher afterload, more oxygen demand, impeded ejection", "Move deflation earlier"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Early inflation and late deflation are the dangerous errors: both make the LV work against an inflated balloon.",
            "Late inflation and early deflation waste the benefit but do not usually load the ventricle.",
            "Recheck timing after any change in heart rate or rhythm, and whenever the augmentation looks different.",
          ],
        },
        { kind: "h", text: "Triggers" },
        {
          kind: "table",
          caption: "Trigger modes",
          head: ["Trigger", "How it works", "Use when", "Caveat"],
          rows: [
            ["ECG", "The R wave marks deflation; inflation is timed to the end of the T wave", "Default with a clean ECG signal", "Interference, low-voltage QRS, diathermy"],
            ["Arterial pressure", "The systolic upstroke is used as the trigger", "The ECG is unreliable; also used during CPR on many consoles", "Needs adequate pulse pressure; a damped line misleads"],
            ["Pacer", "The pacing spike is used", "Paced rhythms", "Must match the pacing mode (atrial, ventricular or dual-chamber)"],
            ["Internal (asynchronous)", "Fixed rate, independent of the patient", "No cardiac output, to keep the balloon moving", "Never with an intrinsic rhythm: inflation will collide with systole"],
          ],
        },
        {
          kind: "p",
          text: "Modern consoles set timing automatically and include algorithms for atrial fibrillation, in which deflation is triggered by the R wave. Automatic timing reduces errors but does not abolish them, so you still need to read the trace.",
        },
        { kind: "h", text: "Ratios and augmentation" },
        {
          kind: "list",
          items: [
            "1:1: every beat assisted; full support.",
            "1:2: every second beat assisted; used to check timing and as a weaning step.",
            "1:3 (or lower, console-dependent): a further weaning step.",
            "Augmentation volume can also be reduced as a weaning method.",
          ],
        },
        {
          kind: "pearl",
          text: "Fast or irregular rhythms shorten and vary diastole, which reduces augmentation. Treat the rhythm where possible, use the console's arrhythmia mode, and look at the trace rather than trusting the settings.",
        },
        {
          kind: "sim",
          sim: "iabp",
          task: "At 1:2 with deliberately mistimed settings, identify each of the four timing errors from the waveform, then adjust inflation and deflation until both the assisted end-diastolic pressure and the assisted systolic pressure are below their unassisted values.",
        },
      ],
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-iabp-management",
      title: "Troubleshooting, weaning, complications and evidence",
      minutes: 8,
      blocks: [
        {
          kind: "table",
          caption: "Alarms and problems",
          head: ["Problem", "Likely cause", "Action"],
          rows: [
            ["Blood or brown flecks in the gas line", "Balloon perforation or rupture (often against a calcified aorta)", "Stop pumping, clamp the gas line and remove the balloon promptly, because blood clotting inside it can entrap it; insert a new one if support is still needed"],
            ["Poor augmentation", "Low stroke volume, hypovolaemia, tachycardia, balloon too small, not unwrapped, or poorly positioned", "Check rhythm, filling, position on X-ray and volume setting"],
            ["Trigger loss", "Poor ECG signal, lead off, arrhythmia", "Change lead or switch to pressure trigger"],
            ["Gas loss or leak alarm", "Kinked tubing, loose connection, leak", "Check connections; suspect rupture if blood is seen"],
            ["Falling urine output", "Balloon covering the renal arteries, or low cardiac output", "Check the position on X-ray or fluoroscopy"],
            ["Loss of left radial pulse or trace", "Balloon too high, obstructing the left subclavian artery", "Withdraw slightly under imaging"],
            ["Cold, pale or painful leg", "Limb ischaemia from the catheter or sheath", "Urgent assessment; remove the sheath if possible, involve vascular surgery, consider removing or relocating the device"],
          ],
        },
        {
          kind: "keypoints",
          title: "Anticoagulation and the stationary balloon",
          items: [
            "Practice on systemic anticoagulation varies. Many centres give heparin; some omit it at 1:1 in patients at high bleeding risk. Follow the local protocol.",
            "Do not leave a balloon motionless in the aorta: thrombus forms on a static balloon. If pumping has to stop, follow the console and local guidance (for example periodic manual inflation) and remove the balloon if it will not be restarted soon.",
          ],
        },
        {
          kind: "steps",
          title: "Weaning and removal",
          items: [
            { title: "Decide support is no longer needed", detail: "Stable MAP on low or no vasoactive drugs, normal or falling lactate, adequate urine output and no ongoing ischaemia." },
            { title: "Reduce support", detail: "Step down the ratio (1:1 to 1:2 to 1:3) or reduce augmentation volume, reassessing haemodynamics, lactate and symptoms at each step." },
            { title: "Stop and remove", detail: "Stop heparin according to protocol, switch off and disconnect, aspirate the balloon fully, then withdraw the balloon and sheath together. Do not pull a balloon back through its sheath." },
            { title: "Haemostasis", detail: "Firm manual compression above the puncture site for an adequate time, then check distal pulses and the groin repeatedly." },
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Notes"],
          rows: [
            ["Limb ischaemia", "The commonest major complication; risk is higher in women, people with diabetes or peripheral arterial disease, and small vessels"],
            ["Bleeding and vascular injury", "Haematoma, pseudoaneurysm, retroperitoneal bleeding, dissection"],
            ["Thrombocytopenia", "Mechanical platelet consumption; also consider heparin-induced thrombocytopenia"],
            ["Haemolysis", "Usually mild"],
            ["Balloon rupture and gas embolism", "Rare; recognise blood in the gas line"],
            ["Malposition", "Renal, mesenteric or subclavian compromise; stroke"],
            ["Infection", "With prolonged use"],
            ["Cholesterol embolism", "From a diseased aorta"],
          ],
        },
        { kind: "h", text: "Evidence in brief" },
        {
          kind: "p",
          text: "IABP-SHOCK II randomised patients with AMI-related shock undergoing early revascularisation to IABP or no IABP and found no reduction in mortality at 30 days or at longer follow-up. The 2023 ESC guideline therefore advises against routine IABP in AMI-related shock, while keeping it as an option for mechanical complications. Its practical attractions remain: small bore, quick insertion, familiarity and low cost.",
        },
        {
          kind: "pearl",
          text: "If you use an IABP in shock, state what improvement you expect (lactate, urine output, filling pressures) and by when. If it does not happen, escalate rather than wait.",
        },
      ],
      refs: ["iabp-shock-ii-2012", "esc-acs-2023", "hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-iabp-inflate",
      stem: "At which point in the cardiac cycle should an IABP inflate?",
      options: [
        "At the R wave of the ECG",
        "At aortic valve closure, marked by the dicrotic notch",
        "At the peak of the arterial systolic pressure",
        "Just before the systolic upstroke",
        "At the P wave",
      ],
      answer: 1,
      explanation:
        "Inflation at aortic valve closure (the dicrotic notch) raises diastolic pressure and coronary perfusion without loading the ventricle. Just before the systolic upstroke is the deflation point; inflating there would leave the balloon inflated as the LV ejects. The R wave is used to trigger deflation on ECG trigger.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-late-deflation",
      stem: "On a 1:2 trace the unassisted end-diastolic pressure is 52 mmHg and the assisted end-diastolic pressure is 58 mmHg. The augmentation looks widened and the next systolic upstroke is slow. What is the error and its main consequence?",
      options: [
        "Early inflation: premature aortic valve closure",
        "Late inflation: reduced coronary perfusion",
        "Early deflation: retrograde coronary flow",
        "Late deflation: increased afterload as the LV ejects against a still-inflated balloon",
        "Correct timing with good augmentation",
      ],
      answer: 3,
      explanation:
        "An assisted end-diastolic pressure equal to or higher than the unassisted value means the balloon is still inflated when the LV begins to eject, which is late deflation. It increases afterload and myocardial oxygen demand. Early deflation is the opposite: the assisted end-diastolic pressure falls to or below the unassisted value with a U-shaped dip.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-early-inflation",
      stem: "On a 1:2 trace, augmentation begins before the dicrotic notch and merges with the end of the systolic waveform; the notch can no longer be seen. What is the main haemodynamic consequence?",
      options: [
        "Early aortic valve closure, lower stroke volume and raised LVEDP",
        "Reduced coronary perfusion only, with no effect on the ventricle",
        "Retrograde carotid flow during diastole and a risk of stroke",
        "No consequence; augmentation is maximised by inflating earlier",
        "Balloon rupture from inflating against the ejecting ventricle",
      ],
      answer: 0,
      explanation:
        "This is early inflation. Inflating before the aortic valve closes forces it shut early, cutting stroke volume and raising LV volume, pressure and oxygen demand; it can also cause aortic regurgitation. The higher-looking augmentation is the trap: it comes at the cost of loading the ventricle.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-position",
      stem: "Where should the tip of a correctly positioned IABP lie?",
      options: [
        "In the ascending aorta just above the aortic valve, for maximum coronary flow",
        "About 1–2 cm below the left subclavian origin, near the carina",
        "At the level of the renal arteries, below the diaphragm on the X-ray",
        "At the aortic bifurcation, so the balloon fills the abdominal aorta",
        "In the left subclavian artery, just beyond its origin from the arch",
      ],
      answer: 1,
      explanation:
        "The tip sits in the proximal descending thoracic aorta, about 1–2 cm below the left subclavian origin (around the carina on a chest X-ray), with the lower end above the renal arteries. A tip at the renal level means the balloon is too low, covering the renal and mesenteric arteries and giving less augmentation.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-contra",
      stem: "Which of the following is a contraindication to IABP insertion?",
      options: [
        "Acute ventricular septal rupture",
        "Moderate to severe aortic regurgitation",
        "Acute severe mitral regurgitation from papillary muscle rupture",
        "Sinus tachycardia at 110 beats per minute",
        "Recent primary PCI",
      ],
      answer: 1,
      explanation:
        "Diastolic inflation raises aortic diastolic pressure and increases the regurgitant volume in aortic regurgitation, so moderate or severe AR is a contraindication. VSR and acute mitral regurgitation are, by contrast, situations in which an IABP is still used as a bridge to surgery, because afterload reduction reduces the shunt or the regurgitant volume.",
      difficulty: 1,
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-rupture",
      stem: "A nurse notices brown flecks in the helium tubing of an IABP and the console shows a gas-loss alarm. What should be done?",
      options: [
        "Flush the gas line with saline to clear the blood and then restart pumping",
        "Reduce to 1:3 augmentation and monitor the gas alarm closely",
        "Stop pumping, clamp the gas line and remove the balloon promptly",
        "Leave the balloon in place, switched off, until the next day's list",
        "Increase the balloon volume to compensate for the gas leak",
      ],
      answer: 2,
      explanation:
        "Blood in the gas line means the balloon has perforated. Continuing to pump risks gas embolism, and blood clotting inside a stationary balloon can entrap it, so it is stopped, clamped and removed promptly. Leaving it switched off in place is the tempting option, but it combines thrombus formation with entrapment risk.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-renal",
      stem: "A day after IABP insertion, urine output falls to 10 mL/h. Haemodynamics are unchanged, and the chest X-ray shows the tip marker several centimetres below the carina. What is the most likely cause?",
      options: [
        "Contrast nephropathy from the coronary angiogram the day before",
        "The balloon has migrated distally over the renal arteries",
        "Balloon rupture with helium embolism to the kidneys",
        "Heparin-induced thrombocytopenia with renal artery thrombosis",
        "Late deflation increasing afterload and reducing renal perfusion",
      ],
      answer: 1,
      explanation:
        "A low-lying balloon can obstruct the renal arteries during inflation, causing an abrupt fall in urine output, and the X-ray confirms distal migration. Reposition under fluoroscopy. Contrast nephropathy is possible after angiography, but it would not explain the timing with a migrated balloon and unchanged haemodynamics.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-trigger",
      stem: "During emergency surgery, diathermy repeatedly interferes with the ECG and the IABP keeps losing its trigger. The patient has a good arterial trace. What is the best trigger choice?",
      options: ["Internal (asynchronous) trigger", "Arterial pressure trigger", "Pacer trigger", "Stop the IABP until surgery ends", "Reduce to 1:3"],
      answer: 1,
      explanation:
        "With an unreliable ECG but a good arterial waveform, the pressure trigger keeps the balloon synchronised with the patient's own cycle. Internal mode ignores the patient's rhythm and would inflate during systole in a beating heart; it is only for situations with no cardiac output. Stopping the IABP leaves a stationary balloon in the aorta.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-iabp-early-deflation",
      stem: "On a 1:2 trace the augmentation drops sharply after its peak, with a U-shaped dip before the next systole. The assisted end-diastolic pressure equals the unassisted value, and the assisted systolic pressure is not lower than the unassisted. What should you change?",
      options: [
        "Move inflation earlier",
        "Move inflation later",
        "Move deflation later",
        "Move deflation earlier",
        "Increase the ratio to 1:3",
      ],
      answer: 2,
      explanation:
        "This is early deflation: the balloon empties too early in diastole, so afterload is not reduced when the LV ejects and augmentation is cut short, with possible retrograde coronary flow. Move deflation later, closer to the onset of systole. Moving deflation earlier would make it worse, and changing inflation does not address the problem.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
  ],
  sims: [
    {
      sim: "iabp",
      task: "Timing workshop: correct early and late inflation and early and late deflation at 1:2, switch trigger when the ECG is lost, then wean from 1:1 to 1:3.",
    },
  ],
  caseIds: ["mcs-case-iabp-timing"],
};

// ---------------------------------------------------------------------------
// Module 5 — Microaxial flow pumps (Impella)
// ---------------------------------------------------------------------------
const impella: Module = {
  id: "mcs-impella",
  title: "Microaxial flow pumps (Impella)",
  stage: 5,
  summary:
    "The left- and right-sided microaxial pump family, LV unloading physiology, insertion and positioning, console signals and alarms, suction, haemolysis, purge, anticoagulation, limb ischaemia, weaning and the evidence.",
  objectives: [
    "Describe the left- and right-sided microaxial flow pumps, their access routes and approximate flows.",
    "Explain how a transvalvular pump unloads the LV and changes the pressure–volume loop.",
    "Insert and position a percutaneous pump and confirm its position with echo, fluoroscopy and console signals.",
    "Troubleshoot suction, position alarms, haemolysis, purge problems and RV failure.",
    "Wean and remove the pump, and distinguish the shock evidence (DanGer Shock) from the protected-PCI question.",
  ],
  lessons: [
    {
      id: "mcs-impella-devices",
      title: "The device family and unloading physiology",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "A microaxial flow pump is a catheter with a miniature rotary pump (working on the Archimedes screw principle) near its tip. The left-sided devices sit across the aortic valve: blood enters an inlet in the LV and leaves through an outlet in the ascending aorta. Flow is continuous and runs in series with the native ventricle, taking blood straight out of the LV and delivering it into the aorta.",
        },
        {
          kind: "table",
          caption: "The Impella family (approximate figures; check the instructions for use for current specifications)",
          head: ["Device", "Access", "Approximate maximum flow", "Typical use"],
          rows: [
            ["Impella 2.5", "Percutaneous femoral artery, about 13 Fr sheath", "Up to about 2.5 L/min", "Largely superseded by CP-class devices"],
            ["Impella CP", "Percutaneous femoral artery, about 14 Fr sheath", "About 3.5–4 L/min", "Cardiogenic shock (the DanGer Shock device) and protected PCI"],
            ["Impella 5.0 / 5.5", "Surgical cut-down or axillary artery graft", "About 5–5.5 L/min", "Fuller and longer LV support; bridge to decision, recovery or durable therapy"],
            ["Impella RP family", "Percutaneous femoral vein; inflow in the IVC or right atrium, outflow in the pulmonary artery", "Above 4 L/min", "Right ventricular failure"],
          ],
        },
        { kind: "h", text: "Physiology of LV unloading" },
        {
          kind: "keypoints",
          items: [
            "The pump lowers LV volume and pressure (end-diastolic volume and pressure), which reduces wall stress and myocardial oxygen demand.",
            "It adds forward flow, raising MAP and cardiac output, and therefore raises coronary perfusion pressure (aortic diastolic pressure minus LV end-diastolic pressure).",
            "On a pressure–volume loop, the loop shifts left towards smaller volumes and loses its isovolumic phases, becoming more triangular, because the pump empties the LV throughout the cycle.",
            "Pump flow depends on the pressure difference across it (aortic minus LV pressure) and on adequate LV filling. High afterload reduces flow; an empty LV causes suction.",
            "A left-sided pump depends on the RV to deliver blood to the left heart. Unmasked RV failure is a common reason for falling flow.",
          ],
        },
        {
          kind: "table",
          caption: "Microaxial pump compared with IABP and VA-ECMO",
          head: ["Feature", "IABP", "Microaxial pump (left-sided)", "VA-ECMO"],
          rows: [
            ["Mechanism", "Counterpulsation (pressure)", "Active LV-to-aorta flow", "Venous-to-arterial bypass with an oxygenator"],
            ["Output added", "Small", "About 2.5–5.5 L/min depending on device", "Up to full cardiac output"],
            ["Effect on LV load", "Afterload reduced", "LV unloaded directly", "Afterload increased"],
            ["Gas exchange", "No", "No", "Yes"],
            ["Dependence on native heart", "Needs rhythm and some ejection", "Needs adequate RV output", "Independent of native output"],
            ["Arterial access", "About 7–8 Fr", "About 13–14 Fr for CP-class devices", "Large venous and arterial cannulas"],
            ["Main risks", "Limb ischaemia", "Bleeding, limb ischaemia, haemolysis", "Bleeding, limb ischaemia, stroke, LV distension"],
          ],
        },
        {
          kind: "pitfalls",
          title: "Typical contraindications (check the instructions for use)",
          items: [
            "LV thrombus: the inlet can draw it in and embolise it.",
            "Mechanical aortic valve; moderate or severe aortic regurgitation.",
            "Severe aortic stenosis or a heavily calcified valve (relative).",
            "Severe peripheral arterial disease that precludes large-bore access (consider another route).",
            "Septal defects, including post-infarct VSR: lowering LV pressure can promote right-to-left shunting (relative).",
            "Aortic dissection or significant aortic disease.",
          ],
        },
      ],
      refs: ["danger-shock-2024", "hanna-pcm", "esc-hf-2021"],
    },
    {
      id: "mcs-impella-insertion",
      title: "Insertion and positioning",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Large-bore arterial access is where most of the morbidity comes from. Plan it as you would TAVI access, even in an emergency.",
        },
        {
          kind: "steps",
          title: "Access",
          items: [
            { title: "Image the vessels", detail: "Ultrasound the common femoral artery and, where possible, perform an iliofemoral angiogram (or review a CT) to check calibre, calcification and tortuosity." },
            { title: "Puncture well", detail: "Ultrasound- and fluoroscopy-guided anterior-wall puncture of the common femoral artery over the femoral head, above the bifurcation and below the inferior epigastric artery." },
            { title: "Pre-close", detail: "If percutaneous removal is planned, deploy suture-mediated closure devices (commonly two) before upsizing." },
            { title: "Upsize", detail: "Serial dilators, then the large-bore introducer. Give heparin." },
          ],
        },
        {
          kind: "steps",
          title: "Crossing and positioning (CP-class device)",
          items: [
            { title: "Cross the aortic valve", detail: "Use a diagnostic catheter (for example a pigtail or Amplatz left) and a standard wire to enter the LV." },
            { title: "Exchange for the placement wire", detail: "Exchange for the device-specific 0.018-inch placement guidewire, shaped and positioned in the LV apex." },
            { title: "Advance the pump", detail: "Load the pump over the wire and advance it under fluoroscopy around the arch and across the valve, keeping the pigtail tip free in the LV cavity." },
            { title: "Position", detail: "Aim for an inlet about 3.5 cm below the aortic annulus with the outlet clearly above the valve in the ascending aorta. Remove the wire, start the pump at a low level and confirm the position with echo." },
            { title: "Increase support", detail: "Increase the performance level stepwise while watching flow, position signals, MAP and suction alarms." },
            { title: "Secure", detail: "Fix the catheter, note its depth mark at the skin, and recheck the position with echo daily and after any patient move." },
          ],
        },
        {
          kind: "figure",
          id: "impella-position",
          caption: "Correct position: inlet in the LV about 3.5 cm below the aortic annulus, outlet in the ascending aorta, pigtail free in the LV cavity away from the mitral apparatus.",
        },
        {
          kind: "table",
          caption: "Confirming position",
          head: ["Tool", "Correct", "Too deep", "Too shallow (in the aorta)"],
          rows: [
            ["Echo (parasternal long axis)", "Inlet about 3.5 cm below the annulus, clear of the mitral apparatus", "Inlet near the apex or tangled in the mitral apparatus; ectopy; suction", "Inlet at or above the annulus"],
            ["Fluoroscopy", "Cannula straddling the valve plane", "Outlet close to or below the valve plane", "Inlet close to or above the valve plane"],
            ["Motor current", "Pulsatile", "Flattens when inlet and outlet are both in the LV", "Flattens when inlet and outlet are both in the aorta"],
            ["Placement signal (pressure near the outlet)", "Aortic waveform", "Ventricular waveform", "Aortic waveform; use the motor current to tell this apart from correct position"],
          ],
        },
        {
          kind: "p",
          text: "Newer consoles derive pressure from a sensor near the outlet and estimate LV pressures, but the logic is the same: the pump must straddle the valve, with a pulsatile pressure difference across it. Device-specific depths and minimum performance levels differ, so learn the instructions for the system in your lab.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pump migration after transfers or repositioning the patient: recheck with echo after any move.",
            "A pigtail caught in the mitral chordae, causing mitral regurgitation, suction and haemolysis.",
            "Inserting a large-bore sheath into a small, calcified iliac artery without imaging it first.",
          ],
        },
        {
          kind: "sim",
          sim: "impella",
          task: "Advance the pump across the aortic valve, set the inlet about 3.5 cm below the annulus, confirm a pulsatile motor current and an aortic placement waveform, then correct the position when the console shows a ventricular placement signal.",
        },
      ],
      refs: ["danger-shock-2024", "hanna-pcm"],
    },
    {
      id: "mcs-impella-management",
      title: "Running the pump: alarms, suction, haemolysis and purge",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "The console reports the performance level (P-level), estimated flow, motor current, a placement signal or derived pressures, and purge pressure and flow. Most problems announce themselves as falling flow, an alarm or dark urine.",
        },
        {
          kind: "table",
          caption: "Common problems",
          head: ["Problem", "Signs", "Causes", "Response"],
          rows: [
            ["Suction", "Suction alarm, fluctuating or falling flow, ventricular ectopy, small LV on echo, haemolysis", "Hypovolaemia, RV failure, tamponade, pump too deep or against the wall, P-level too high", "Reduce the P-level, echo, correct the position, give volume if underfilled, treat RV failure, exclude tamponade and bleeding"],
            ["Position alarm", "Flat motor current or ventricular placement waveform", "Migration, too deep or out into the aorta", "Reduce the P-level and reposition under echo"],
            ["Haemolysis", "Dark urine, rising plasma free haemoglobin and LDH, falling haptoglobin and haemoglobin", "Suction, malposition, high P-level, thrombus in the pump", "Check position and suction, use the lowest effective P-level, check pump function, consider exchange"],
            ["High purge pressure", "Purge alarm", "Kinked line, viscous purge solution, pump thrombosis", "Check the line; follow the instructions for use"],
            ["Low purge pressure or leak", "Purge alarm, fluid at the connections", "Leak or disconnection", "Check connections; a failing purge lets blood enter the motor"],
            ["Low flow without suction", "Falling flow with high aortic pressure", "High afterload, malposition, pump thrombosis", "Reduce afterload, check the position, assess the pump"],
          ],
        },
        { kind: "h", text: "Purge and anticoagulation" },
        {
          kind: "p",
          text: "A purge solution is pumped continuously through the motor towards the blood path to keep blood out of the motor. Traditionally it is a dextrose solution containing heparin. Some systems are approved for a bicarbonate-based purge as an alternative, for example when heparin must be avoided; check the instructions for use. Heparin in the purge adds to systemic anticoagulation, so include it when you set infusion rates.",
        },
        {
          kind: "keypoints",
          items: [
            "Systemic anticoagulation with heparin is usual, to ACT, aPTT or anti-Xa targets set by local protocol and the device instructions. Targets are lower than during PCI.",
            "Heparin-induced thrombocytopenia needs a non-heparin purge and a systemic alternative such as bivalirudin or argatroban, according to protocol.",
            "Bleeding is the commonest major complication; access-site and gastrointestinal bleeding dominate.",
          ],
        },
        { kind: "h", text: "Limb ischaemia and access care" },
        {
          kind: "list",
          items: [
            "Check distal pulses or Doppler signals, colour, temperature, sensation and movement frequently in the first hours; some units use near-infrared spectroscopy of the calf.",
            "If the leg is ischaemic, options include an antegrade distal perfusion sheath fed from an arterial source, or relocating support to another access.",
            "Keep the leg straight and follow positioning restrictions to prevent kinking and migration.",
          ],
        },
        { kind: "h", text: "The right ventricle" },
        {
          kind: "p",
          text: "As the pump increases LV output, venous return to the right heart rises and a marginal RV may fail. The signs are rising RA pressure, falling PAPi, falling pump flow with suction alarms, and a small LV with a dilated RV on echo. Treat with inotropes, correction of hypoxia, hypercapnia and acidosis, pulmonary vasodilators and cautious volume. If that fails, add RV support (a right-sided pump, giving 'BiPella' support) or change to VA-ECMO.",
        },
        {
          kind: "pearl",
          text: "A suction alarm is information, not a nuisance. It means the pump wants more blood than the LV can supply. Find out why before turning the P-level down and walking away.",
        },
      ],
      refs: ["danger-shock-2024", "hanna-pcm"],
    },
    {
      id: "mcs-impella-weaning-evidence",
      title: "Weaning, removal and the evidence",
      minutes: 8,
      blocks: [
        {
          kind: "steps",
          title: "Weaning and removal",
          items: [
            { title: "Prerequisites", detail: "Perfusion restored: normal lactate, adequate urine output, low or falling vasoactive doses and a stable rhythm." },
            { title: "Step down", detail: "Reduce the P-level in steps over hours, checking MAP, CPO, filling pressures or estimated LV end-diastolic pressure, echo LV size and function, and lactate at each step." },
            { title: "Observe at minimal support", detail: "Do not leave the pump across the valve at a level that allows backflow from aorta to LV; the instructions specify the minimum level while the pump is in the ventricle." },
            { title: "Remove", detail: "Follow the instructions for use: reduce to the removal level, withdraw the pump into the aorta, stop it and remove it. Close the access with the pre-placed sutures, another closure device, or surgical repair." },
          ],
        },
        {
          kind: "keypoints",
          title: "Failure to wean",
          items: [
            "Return of high filling pressures, falling CPO, rising lactate or ventricular arrhythmias as support is reduced.",
            "Repeated failure should prompt the longer-term conversation: escalation to a larger device, durable LVAD or transplant assessment, or palliation.",
          ],
        },
        { kind: "h", text: "Evidence" },
        {
          kind: "p",
          text: "DanGer Shock randomised patients with STEMI-related cardiogenic shock to a microaxial flow pump (Impella CP) plus standard care or standard care alone. All-cause mortality at 180 days was lower with the pump. The price was more adverse events, including severe bleeding, limb ischaemia, haemolysis and renal replacement therapy. The trial excluded comatose post-arrest patients and RV-dominant shock, and it was conducted in experienced centres.",
        },
        {
          kind: "table",
          caption: "Interpreting the evidence",
          head: ["Question", "State of the evidence"],
          rows: [
            ["Selected STEMI shock (LV-dominant, not comatose)", "Randomised survival benefit (DanGer Shock), at the cost of more complications"],
            ["All AMI shock, including comatose post-arrest patients", "Not established; observational comparisons are heavily confounded"],
            ["Heart failure-related shock", "Limited randomised data; used as a bridge to recovery or decision"],
            ["Protected high-risk PCI in patients without shock", "A different question. PROTECT II did not show a significant difference from IABP in its primary endpoint, and randomised evidence that routine support improves hard outcomes has been lacking; further trials are under way"],
          ],
        },
        {
          kind: "p",
          text: "Protected PCI is a judgement for the heart team: severe LV dysfunction, a large jeopardised territory (unprotected left main or last remaining vessel), complex technique such as atherectomy, and the patient's likely tolerance of ischaemia. Surgical options should be considered, and access planned before the day.",
        },
        {
          kind: "pitfalls",
          items: [
            "Extrapolating DanGer Shock to the patients it excluded.",
            "Leaving a pump in 'just in case' after recovery: bleeding, haemolysis and limb complications accumulate with time.",
            "Removing the pump without a plan for the large-bore access site. Check that pre-placed sutures are still usable, have a closure device or surgical repair available, and examine the leg and groin afterwards for bleeding, pseudoaneurysm and ischaemia.",
          ],
        },
      ],
      refs: ["danger-shock-2024", "esc-acs-2023", "brilakis-manual-pci", "hanna-pcm", "protect-ii-2012"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-impella-depth",
      stem: "Where should the inlet of a CP-class microaxial pump sit?",
      options: [
        "At the level of the aortic annulus, just across the valve",
        "About 3.5 cm below the annulus, clear of the mitral valve",
        "At the LV apex, as deep as the cannula will reach",
        "In the ascending aorta just above the sinotubular junction, outlet free",
        "In the left atrium after crossing the mitral valve",
      ],
      answer: 1,
      explanation:
        "The inlet should lie about 3.5 cm below the annulus with the outlet above the valve in the ascending aorta, confirmed by echo. Placing it at the apex is the tempting 'deeper is safer' error, which causes suction, ectopy, entanglement in the mitral apparatus and haemolysis.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-deep",
      stem: "The console shows a flat motor current and a ventricular waveform on the placement signal. What is the most likely position problem?",
      options: [
        "The pump is too deep, with both inlet and outlet in the LV",
        "The pump is entirely in the aorta",
        "The pump is correctly positioned",
        "The purge line is kinked",
        "The pump has thrombosed",
      ],
      answer: 0,
      explanation:
        "The motor current is pulsatile only when the pump straddles the valve. A flat current with a ventricular placement waveform means the outlet area is in the LV, so the pump is too deep and should be withdrawn under echo. A pump entirely in the aorta also gives a flat current, but the placement signal would show an aortic waveform.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-suction",
      stem: "Six hours after pump insertion for anterior STEMI shock, flow fluctuates with suction alarms. RA pressure has risen from 9 to 19 mmHg, PAPi has fallen to 0.5, and echo shows a small LV, a dilated RV and a correctly positioned inlet. What is the best response?",
      options: [
        "Increase the P-level to restore flow and overcome the suction",
        "Treat RV failure: lower the P-level a little, inotropy, consider RV support",
        "Withdraw the pump 2 cm so that the inlet sits clear of the septum",
        "Give repeated large fluid boluses until the suction alarm stops sounding altogether",
        "Remove the pump and continue with inotropes and vasopressors alone",
      ],
      answer: 1,
      explanation:
        "Rising RA pressure, low PAPi, an underfilled LV and a dilated RV mean the RV cannot deliver enough blood to the pump. Treat the RV (inotrope, correct hypoxia, hypercapnia and acidosis, pulmonary vasodilators) and escalate to RV support if needed. Increasing the P-level is the tempting reflex but pulls harder on an empty LV, worsening suction and haemolysis.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-contra",
      stem: "Which echo finding is a contraindication to a left-sided transaortic microaxial pump?",
      options: [
        "LVEF of 20%",
        "Mobile apical LV thrombus",
        "Moderate functional mitral regurgitation",
        "A small pericardial effusion",
        "Regional wall motion abnormality in the LAD territory",
      ],
      answer: 1,
      explanation:
        "An LV thrombus can be drawn into the inlet and embolised, so it is a contraindication. Severe LV dysfunction and functional mitral regurgitation are typical features of the patients who need the device, not reasons to avoid it.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-danger",
      stem: "Which statement best summarises DanGer Shock?",
      options: [
        "The microaxial pump did not change mortality but reduced complications",
        "Mortality at 180 days was lower with the pump, but adverse events including bleeding, limb ischaemia and renal replacement therapy were more frequent",
        "The pump reduced mortality in all forms of cardiogenic shock, including comatose post-arrest patients",
        "The pump was compared with IABP and was superior",
        "The trial was stopped early for harm",
      ],
      answer: 1,
      explanation:
        "In STEMI-related shock, the microaxial pump plus standard care lowered 180-day all-cause mortality compared with standard care, at the cost of more complications. The trial excluded comatose post-arrest patients and RV-dominant shock, so a benefit 'in all forms of shock' is an over-extrapolation. The comparator was standard care, not IABP.",
      difficulty: 3,
      refs: ["danger-shock-2024"],
    },
    {
      id: "mcs-q-impella-pvloop",
      stem: "How does effective support with a left-sided microaxial pump change the LV pressure–volume loop?",
      options: [
        "The loop shifts right to larger volumes and becomes taller",
        "It shifts left and loses its isovolumic phases, becoming triangular",
        "The loop is unchanged in shape; only the aortic pressure changes",
        "The loop widens because the native stroke volume rises with support",
        "End-systolic pressure rises with no change in end-systolic volume",
      ],
      answer: 1,
      explanation:
        "Because the pump removes blood from the LV throughout the cycle, there are no true isovolumic periods and the loop becomes triangular, shifted to lower volumes and pressures. A rightward shift with higher pressures is what happens when the LV is loaded, as with peripheral VA-ECMO without venting.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-haemolysis",
      stem: "On day 2 of pump support, the urine is dark and plasma free haemoglobin and LDH are rising. Which first step is most appropriate?",
      options: [
        "Increase the P-level to shorten each red cell's transit time through the pump",
        "Check position and suction on echo; run at the lowest effective P-level",
        "Stop heparin to reduce red cell damage in the pump",
        "Transfuse red cells and continue support unchanged",
        "Switch the purge solution to saline without heparin",
      ],
      answer: 1,
      explanation:
        "Haemolysis with microaxial pumps is usually caused by malposition, suction or high speed, so the first steps are an echo to check position and LV filling and a reduction to the lowest effective P-level. Increasing the P-level increases shear stress. Persisting haemolysis despite correct position raises the possibility of pump thrombosis and exchange.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-impella-protected",
      stem: "Which statement about microaxial pump support for elective high-risk PCI (protected PCI) is most accurate?",
      options: [
        "DanGer Shock proved that routine support improves survival in protected PCI as well",
        "A different question from shock; routine benefit is unproven; the team decides",
        "PROTECT II showed a large mortality benefit for the microaxial pump over IABP",
        "Protected PCI support is mandatory for every patient undergoing left main PCI",
        "Support should be avoided in all patients with an LVEF below 35% because of risk",
      ],
      answer: 1,
      explanation:
        "DanGer Shock studied STEMI patients in cardiogenic shock, not stable patients undergoing complex PCI, so its results do not transfer. PROTECT II did not show a significant difference from IABP in its primary endpoint. Protected PCI is chosen case by case on LV function, jeopardised myocardium and technique.",
      difficulty: 3,
      refs: ["danger-shock-2024", "brilakis-manual-pci", "protect-ii-2012"],
    },
  ],
  sims: [
    {
      sim: "impella",
      task: "Position the pump at about 3.5 cm below the annulus, confirm the signals, then manage a suction alarm caused by RV failure and a position alarm after the patient is moved.",
    },
  ],
  caseIds: ["mcs-case-anterior-stemi-shock"],
};

// ---------------------------------------------------------------------------
// Module 6 — VA-ECMO
// ---------------------------------------------------------------------------
const ecmo: Module = {
  id: "mcs-ecmo",
  title: "VA-ECMO",
  stage: 5,
  summary:
    "VA versus VV ECMO, the circuit and femoro-femoral cannulation, the physiology of retrograde flow, LV distension and venting, differential hypoxaemia, sweep and FdO2, anticoagulation, complications, weaning, ECPR and the evidence.",
  objectives: [
    "Distinguish VA from VV ECMO and describe each component of the circuit.",
    "Plan femoro-femoral cannulation, including a distal perfusion cannula.",
    "Recognise LV distension and choose a venting strategy.",
    "Detect and manage differential hypoxaemia.",
    "Adjust sweep and FdO2, manage anticoagulation and complications, and run a weaning trial.",
  ],
  lessons: [
    {
      id: "mcs-ecmo-circuit",
      title: "VA versus VV, the circuit and cannulation",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Extracorporeal membrane oxygenation (ECMO) drains venous blood, passes it through a pump and a membrane oxygenator, and returns it to the patient. Where the blood is returned defines the mode.",
        },
        {
          kind: "table",
          caption: "VA versus VV ECMO",
          head: ["Feature", "VA-ECMO", "VV-ECMO"],
          rows: [
            ["Drains from", "Venous system (IVC and right atrium)", "Venous system"],
            ["Returns to", "Arterial system (femoral artery and aorta, or centrally)", "Venous system (right atrium)"],
            ["Supports", "Circulation and gas exchange", "Gas exchange only"],
            ["Needs native cardiac function", "No", "Yes"],
            ["Typical indication", "Refractory cardiogenic shock; refractory cardiac arrest (ECPR)", "Severe respiratory failure"],
            ["Effect on LV afterload", "Increases it", "No direct effect"],
          ],
        },
        {
          kind: "figure",
          id: "ecmo-circuit",
          caption: "Femoro-femoral VA-ECMO: venous drainage cannula to the right atrium, centrifugal pump, membrane oxygenator with gas blender, arterial return cannula to the distal aorta, and a distal perfusion cannula to the leg.",
        },
        {
          kind: "table",
          caption: "Circuit components",
          head: ["Component", "Function", "What to watch"],
          rows: [
            ["Drainage (venous) cannula", "Long multistage cannula from the femoral vein, tip at the IVC–right atrial junction or in the right atrium", "Line 'chatter' and very negative drainage pressure (underfilling or malposition)"],
            ["Centrifugal pump", "Generates flow; flow depends on pump speed, preload and afterload", "Flow falling at constant speed means less preload or more afterload"],
            ["Membrane oxygenator", "Adds oxygen and removes CO2; an integrated heat exchanger controls temperature", "Rising pressure drop across the membrane, falling post-oxygenator PO2, visible clot"],
            ["Gas blender", "Sets sweep gas flow (CO2 removal) and FdO2 (oxygenation)", "Settings, and post-oxygenator blood gases"],
            ["Return (arterial) cannula", "Short cannula in the femoral artery, tip in the iliac artery or distal aorta", "Limb perfusion, bleeding"],
            ["Distal perfusion cannula", "Small antegrade sheath in the superficial femoral artery fed from the return line", "Leg perfusion (Doppler, near-infrared spectroscopy)"],
          ],
        },
        {
          kind: "keypoints",
          title: "Percutaneous femoro-femoral cannulation",
          items: [
            "Ultrasound-guided access to both vessels. Many teams use the right femoral vein, which gives a straighter path to the right atrium.",
            "Confirm wire positions before dilating: the venous wire through the IVC into the right atrium or SVC, the arterial wire in the descending aorta, on fluoroscopy or TOE.",
            "Adult cannulas are typically about 21–25 Fr for drainage and 15–19 Fr for return, chosen by vessel size and the flow needed.",
            "Place a distal perfusion cannula (commonly 6–8 Fr) at the time of cannulation or soon after; limb ischaemia is common without one.",
            "Give a heparin bolus before cannulation unless active bleeding makes this unsafe, as can happen in some ECPR situations.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Dilating over a wire that has gone into the wrong vessel: an arterial dilator in the vein or a venous dilator in the artery. Check both wires on imaging first.",
            "Venous wire passing into the contralateral iliac vein, a lumbar vein or a hepatic vein instead of the right atrium.",
            "Air in the circuit: the perfusionist primes and de-airs, and every connection is checked before flow starts.",
          ],
        },
      ],
      refs: ["elso-va-2021", "hanna-pcm"],
    },
    {
      id: "mcs-ecmo-lv",
      title: "Retrograde flow, LV distension and venting",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Peripheral VA-ECMO returns blood up the aorta against the direction of native ejection. That restores perfusion, but it raises the pressure the LV must exceed to open its aortic valve. A recovering ventricle copes; a stunned one may not.",
        },
        {
          kind: "table",
          caption: "What happens to a failing LV on peripheral VA-ECMO",
          head: ["Step", "Mechanism", "What you see"],
          rows: [
            ["Afterload rises", "Retrograde aortic flow raises aortic pressure", "Higher MAP with a narrower pulse pressure"],
            ["The LV cannot eject", "LV pressure fails to exceed aortic pressure", "Aortic valve stays closed; the arterial trace becomes almost flat"],
            ["The LV distends", "Blood still enters the LV (bronchial and Thebesian venous return, aortic regurgitation, incomplete right atrial drainage)", "Rising LV end-diastolic, LA and wedge pressures; dilated LV; worsening mitral regurgitation"],
            ["Pulmonary oedema", "High LA pressure", "Hypoxaemia, pink frothy secretions, bilateral shadowing on chest X-ray"],
            ["Stasis", "No ejection", "Spontaneous echo contrast ('smoke') in the LV and aortic root; thrombus; embolic risk when ejection resumes"],
            ["Ischaemia and arrhythmia", "High wall stress and poor subendocardial perfusion", "Ventricular arrhythmias; lower chance of recovery"],
          ],
        },
        {
          kind: "keypoints",
          title: "Monitoring for distension",
          items: [
            "Arterial pulse pressure: a pulse pressure falling towards zero means little or no LV ejection.",
            "Echo at least daily and after every change: aortic valve opening, LV size, mitral regurgitation, smoke.",
            "PA catheter: wedge pressure, or PA diastolic pressure as a surrogate for LA pressure.",
            "Chest X-ray and the ventilator: rising oxygen requirement and secretions.",
          ],
        },
        { kind: "h", text: "First-line measures" },
        {
          kind: "list",
          items: [
            "Lower ECMO flow to the minimum that maintains perfusion; this lowers afterload.",
            "Add an inotrope (for example dobutamine) to help the LV eject.",
            "Lower systemic pressure with a vasodilator, or reduce vasopressor, if MAP is higher than needed.",
            "Increase PEEP to limit pulmonary oedema.",
            "Treat contributors such as arrhythmia or aortic regurgitation.",
          ],
        },
        { kind: "h", text: "Venting (unloading) strategies" },
        {
          kind: "table",
          caption: "LV unloading options on VA-ECMO",
          head: ["Strategy", "How it unloads", "Advantages", "Disadvantages"],
          rows: [
            ["IABP", "Lowers afterload in each cycle and may help the valve open", "Small bore, quick, familiar", "Modest effect; may be insufficient"],
            ["Microaxial pump ('ECPELLA')", "Pumps blood directly from the LV to the aorta", "Strong, direct unloading; adds forward flow through the root", "Second large-bore arterial access; haemolysis and bleeding"],
            ["Atrial septostomy", "Creates a left-to-right atrial shunt so the LA drains to the right heart and the circuit", "Decompresses the LA and lungs without extra arterial access", "LV may still not eject, so stasis can persist; leaves a defect that may need closure"],
            ["Transseptal LA drainage cannula", "Drains the LA directly into the venous limb", "Effective LA decompression", "Technically demanding"],
            ["Surgical vent (LV apex or via a pulmonary vein)", "Direct drainage", "Effective", "Needs surgery; bleeding"],
          ],
        },
        {
          kind: "p",
          text: "Observational studies associate LV unloading during VA-ECMO with lower mortality, but they are affected by selection, and randomised data on routine early unloading have not shown a clear benefit. Most teams vent when distension appears, and some unload pre-emptively in patients at high risk, such as those with a non-ejecting LV from the outset.",
        },
        {
          kind: "pearl",
          text: "On VA-ECMO the arterial trace is a window into the LV. A pulse pressure that narrows to a few mmHg while PA pressures rise is LV distension until proven otherwise.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "On VA-ECMO at 4 L/min, watch the pulse pressure narrow and the wedge pressure rise. Reduce flow and add an inotrope, then add an LV vent and confirm that the aortic valve opens again and the pulse pressure returns.",
        },
      ],
      refs: ["elso-va-2021", "ecls-shock-2023", "hanna-pcm"],
    },
    {
      id: "mcs-ecmo-running",
      title: "Oxygenation, differential hypoxaemia, anticoagulation and complications",
      minutes: 9,
      blocks: [
        { kind: "h", text: "Sweep and FdO2" },
        {
          kind: "keypoints",
          items: [
            "Blood flow through the circuit mainly determines oxygen delivery; sweep gas flow through the oxygenator mainly determines CO2 removal.",
            "FdO2 (the oxygen fraction of the sweep gas) sets the post-oxygenator PO2. Avoid unnecessary extreme hyperoxia.",
            "Avoid a rapid fall in PaCO2 when ECMO starts; abrupt drops have been associated with neurological injury. Start the sweep cautiously and titrate to blood gases.",
            "Post-oxygenator gases check the membrane. Patient gases from the right radial artery show what the heart and brain receive.",
          ],
        },
        { kind: "h", text: "Differential hypoxaemia (north–south or harlequin syndrome)" },
        {
          kind: "p",
          text: "With femoral VA-ECMO, oxygenated circuit blood travels up the aorta and meets blood ejected by the native LV. The meeting point, the mixing zone, moves towards the legs as the heart recovers. If the LV is ejecting but the lungs are not oxygenating, the native output is desaturated, and it reaches the coronary arteries and the first arch branches before ECMO blood does. The upper body, including heart and brain, becomes hypoxaemic while the lower body is well oxygenated.",
        },
        {
          kind: "steps",
          title: "Detect and manage",
          items: [
            { title: "Monitor in the right place", detail: "Use a right radial arterial line and right-hand or ear oximetry. The brachiocephalic artery is the first branch reached by native output and the last reached by ECMO blood." },
            { title: "Compare the gases", detail: "A low right radial PaO2 with a high post-oxygenator PO2 (and a high femoral PaO2) confirms differential hypoxaemia rather than oxygenator failure." },
            { title: "Optimise the lungs", detail: "Increase FiO2 and PEEP, treat pulmonary oedema (which may itself come from LV distension) and clear secretions." },
            { title: "Adjust flow", detail: "Increasing ECMO flow moves the mixing zone towards the heart but raises afterload; it is usually a temporary measure." },
            { title: "Reconfigure", detail: "Add a return limb into the internal jugular vein (V-AV ECMO) so that oxygenated blood reaches the right heart and pulmonary circulation, move arterial return to the axillary artery or centrally, or convert to VV-ECMO if the heart has recovered." },
          ],
        },
        {
          kind: "table",
          caption: "Choosing a configuration when heart and lungs both matter",
          head: ["Situation", "Option"],
          rows: [
            ["Heart recovering, lungs failing", "Convert to VV-ECMO, or V-AV while the heart recovers further"],
            ["Heart still failing, lungs failing", "V-AV (hybrid) configuration, or upper-body arterial return"],
            ["Heart failing, lungs adequate", "Continue VA; watch for LV distension"],
          ],
        },
        { kind: "h", text: "Anticoagulation" },
        {
          kind: "list",
          items: [
            "Unfractionated heparin is standard, monitored by anti-Xa, aPTT or ACT according to protocol; targets balance circuit thrombosis against bleeding.",
            "In major bleeding, short periods without heparin are sometimes tolerated with modern circuits; this is a team decision.",
            "Bivalirudin or argatroban are used for heparin-induced thrombocytopenia or heparin resistance.",
            "Track platelets, fibrinogen, plasma free haemoglobin and D-dimer, which rises with circuit thrombus.",
          ],
        },
        {
          kind: "table",
          caption: "Complications",
          head: ["Complication", "Clues", "Response"],
          rows: [
            ["Bleeding", "Cannula sites, gastrointestinal tract, airway, intracranial", "Local measures, correct coagulopathy, adjust anticoagulation, imaging"],
            ["Limb ischaemia or compartment syndrome", "Cold, mottled leg; falling NIRS; tense calf", "Check the distal perfusion cannula; vascular surgery; fasciotomy"],
            ["Stroke", "Neurological change, pupil asymmetry", "CT; may be ischaemic or haemorrhagic"],
            ["Haemolysis", "Dark urine, raised plasma free haemoglobin", "Check the pump, drainage pressures and circuit thrombus"],
            ["Circuit or oxygenator thrombosis", "Visible clot, rising pressure drop across the membrane, falling post-oxygenator PO2", "Oxygenator or circuit change"],
            ["Drainage problems (chatter)", "Shaking venous line, falling flow at the same speed", "Volume, check cannula position, exclude tamponade or raised abdominal pressure, reduce pump speed"],
            ["Air entry", "Air in the circuit", "Clamp, stop the pump and de-air according to the emergency protocol"],
            ["Infection", "Fever can be masked by the heat exchanger", "Cultures, line care"],
            ["Acute kidney injury", "Falling urine output", "Renal replacement therapy, which some centres connect to the circuit"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Taking arterial gases from the left radial or femoral line on femoral VA-ECMO: they can look reassuring while the brain is hypoxaemic.",
            "Answering chatter by increasing pump speed: it worsens the suction and haemolysis.",
          ],
        },
      ],
      refs: ["elso-va-2021", "hanna-pcm"],
    },
    {
      id: "mcs-ecmo-weaning",
      title: "Weaning, ECPR and the evidence",
      minutes: 8,
      blocks: [
        {
          kind: "steps",
          title: "Weaning trial",
          items: [
            { title: "Look for recovery", detail: "Return of pulsatility, aortic valve opening on every beat, improving LV function on echo, normal lactate, low vasoactive doses and adequate gas exchange on safe ventilator settings." },
            { title: "Reduce flow", detail: "Reduce flow in steps (often about 0.5–1 L/min at a time) towards a low level such as 1–1.5 L/min, keeping the circuit anticoagulated because thrombosis is more likely at low flow." },
            { title: "Assess at low flow", detail: "Echo (LVEF, LV outflow tract velocity–time integral, RV function), MAP, CVP, PA pressures, lactate and gases. Commonly used favourable markers include an LVEF above roughly 20–25% and an LVOT velocity–time integral of about 10 cm or more; criteria vary by centre." },
            { title: "Decannulate", detail: "In theatre or the lab: surgical repair or percutaneous closure of the artery; the venous cannula is removed with a purse-string or figure-of-eight suture and compression." },
            { title: "Plan for failure", detail: "If the trial fails, choose between continued support, a longer-term device, or a discussion about goals of care." },
          ],
        },
        {
          kind: "keypoints",
          title: "Weaning cautions",
          items: [
            "Assess the RV carefully before decannulation; RV failure is a common reason for failure after ECMO is removed.",
            "With an LV microaxial pump in place, many teams wean and remove ECMO first and keep the pump as step-down support.",
          ],
        },
        { kind: "h", text: "ECPR" },
        {
          kind: "p",
          text: "ECPR is VA-ECMO started during refractory cardiac arrest. Selection, low-flow time and system readiness are covered in the cardiac arrest module. In the lab, mechanical CPR, ultrasound and fluoroscopy allow rapid cannulation, and once flow is established the coronary cause can be treated.",
        },
        { kind: "h", text: "Evidence and guidance" },
        {
          kind: "p",
          text: "ECLS-SHOCK randomised patients with AMI-related shock planned for early revascularisation to early VA-ECMO plus usual care or usual care alone. Mortality at 30 days did not differ, while moderate or severe bleeding and peripheral vascular complications were more frequent with ECMO. Most enrolled patients had been resuscitated before randomisation. The trial argues against routine early VA-ECMO in AMI-related shock; it does not settle selective use in profound shock, biventricular failure, refractory arrest or non-ischaemic shock.",
        },
        {
          kind: "p",
          text: "The 2021 ELSO interim guidelines for VA-ECMO in adult cardiac patients cover indications, cannulation, anticoagulation, LV unloading, weaning and complications, and are a useful framework for unit protocols.",
        },
        {
          kind: "table",
          caption: "Typical contraindications to VA-ECMO (mostly relative)",
          head: ["Category", "Examples"],
          rows: [
            ["No exit strategy", "A heart that cannot recover in a patient who is not a candidate for durable VAD or transplant"],
            ["Severe irreversible neurological injury", "Prolonged unwitnessed arrest without CPR"],
            ["Aortic disease", "Unrepaired aortic dissection; severe aortic regurgitation, which worsens LV distension"],
            ["Bleeding", "Contraindication to anticoagulation, active major haemorrhage"],
            ["Life-limiting comorbidity", "Advanced malignancy, severe frailty"],
          ],
        },
        {
          kind: "pearl",
          text: "Before cannulating, say the exit aloud: recovery, bridge to durable VAD or transplant, or bridge to decision with a defined review point.",
        },
      ],
      refs: ["ecls-shock-2023", "elso-va-2021"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-ecmo-va-vv",
      stem: "What is the key difference between VA-ECMO and VV-ECMO?",
      options: [
        "VA-ECMO supports gas exchange only, while VV-ECMO also supports the circulation",
        "VA returns blood to the arteries and supports circulation; VV only oxygenates",
        "VV-ECMO requires an arterial return cannula in addition to a venous drainage cannula",
        "VA-ECMO reduces LV afterload, which is why it helps a failing left ventricle",
        "VV-ECMO is the configuration used for cardiogenic shock with preserved lungs",
      ],
      answer: 1,
      explanation:
        "VA-ECMO drains venous blood and returns it to the arterial system, bypassing heart and lungs. VV-ECMO returns blood to the venous system, so it relies on the native heart for circulation. VA-ECMO increases rather than reduces LV afterload, which is the basis of LV distension.",
      difficulty: 1,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-right-radial",
      stem: "A patient on femoro-femoral VA-ECMO with recovering LV function and severe lung injury may have differential hypoxaemia. Where should arterial blood be sampled to assess oxygenation of the heart and brain?",
      options: ["Left radial artery", "Femoral artery on the contralateral side", "Right radial artery", "Post-oxygenator port", "Dorsalis pedis artery"],
      answer: 2,
      explanation:
        "The brachiocephalic artery is the first branch reached by native LV output and the last reached by retrograde ECMO blood, so right radial gases best reflect what the coronary and cerebral circulations receive. The left radial artery comes off the left subclavian, which may be reached by ECMO blood first and can look falsely reassuring.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-sweep",
      stem: "On VA-ECMO, the patient's PaCO2 is 7.8 kPa with satisfactory oxygenation. Which adjustment most directly lowers PaCO2?",
      options: ["Increase FdO2", "Increase sweep gas flow", "Increase pump speed", "Decrease sweep gas flow", "Add a distal perfusion cannula"],
      answer: 1,
      explanation:
        "Sweep gas flow through the oxygenator mainly controls CO2 removal, so increasing it lowers PaCO2; it should be done gradually. FdO2 controls oxygenation, not CO2. Increasing pump speed raises blood flow, which mainly affects oxygen delivery and afterload.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-distension",
      stem: "On day 1 of VA-ECMO for fulminant myocarditis, the arterial pulse pressure is 4 mmHg, PCWP has risen to 30 mmHg, the aortic valve is not opening and there is smoke in the LV. Oxygenation is worsening. Which statement is correct?",
      options: [
        "Increase ECMO flow to improve oxygenation and systemic perfusion",
        "LV distension: lowest adequate flow, inotropy, and unloading if it persists",
        "This is oxygenator failure; change the oxygenator and recheck the blood gases",
        "This is tamponade from cannulation; perform pericardiocentesis",
        "This is expected on VA-ECMO and needs no action at this stage",
      ],
      answer: 1,
      explanation:
        "A near-flat pulse pressure, closed aortic valve, smoke and rising wedge pressure mean the LV cannot eject against retrograde ECMO flow. Lower the flow, add an inotrope and vent (microaxial pump, IABP, septostomy) if that is not enough. Increasing flow is the tempting reflex for hypoxaemia, but it raises afterload and worsens distension and pulmonary oedema.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-harlequin",
      stem: "On femoro-femoral VA-ECMO, the LV is recovering (pulse pressure 22 mmHg) but the lungs are still badly injured. Right radial PaO2 is 6.8 kPa, femoral PaO2 is 32 kPa and post-oxygenator PO2 is 50 kPa. What is the best definitive management?",
      options: [
        "Increase ECMO flow to the maximum the cannulas will allow",
        "Optimise ventilation and add a jugular return limb (V-AV ECMO)",
        "Change the oxygenator, which is no longer transferring oxygen",
        "Stop the inotrope so that native ejection is suppressed completely",
        "Accept it, because the femoral blood gas shows normal oxygenation",
      ],
      answer: 1,
      explanation:
        "This is differential hypoxaemia: the recovering LV ejects desaturated blood from injured lungs into the coronary and cerebral circulations. Reconfiguring to V-AV delivers oxygenated blood to the right heart and lungs, so native output carries oxygen. Increasing ECMO flow can push the mixing zone back temporarily but raises afterload on a recovering LV. The oxygenator is working, as the post-oxygenator PO2 shows.",
      difficulty: 3,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-chatter",
      stem: "The venous drainage line is shaking ('chattering') and flow has fallen from 4.0 to 3.1 L/min at the same pump speed. What is the most appropriate first response?",
      options: [
        "Increase pump speed to restore the target flow",
        "Look for low preload: volume, cannula position, tamponade, bleeding",
        "Increase sweep gas flow through the oxygenator",
        "Clamp the distal perfusion cannula to the leg temporarily to divert more flow back",
        "Change the oxygenator because its resistance has risen",
      ],
      answer: 1,
      explanation:
        "Chatter with falling flow means the drainage cannula is collapsing the vein: hypovolaemia, bleeding, malposition, tamponade or raised abdominal pressure. Treat the cause and reduce speed. Increasing speed is the tempting option but intensifies the negative pressure, worsening chatter and haemolysis.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-ecls",
      stem: "Which statement best reflects ECLS-SHOCK?",
      options: [
        "Early routine VA-ECMO reduced 30-day mortality in AMI-related shock",
        "Early routine VA-ECMO did not reduce 30-day mortality and increased bleeding and vascular complications",
        "VA-ECMO was compared with a microaxial pump",
        "The trial excluded resuscitated patients",
        "VA-ECMO reduced the need for renal replacement therapy",
      ],
      answer: 1,
      explanation:
        "ECLS-SHOCK found no reduction in 30-day mortality with early routine VA-ECMO compared with usual care in AMI-related shock, and more bleeding and peripheral vascular complications. Most patients had been resuscitated before randomisation, so the statement that resuscitated patients were excluded is wrong; the comparator was usual care, not a microaxial pump.",
      difficulty: 2,
      refs: ["ecls-shock-2023"],
    },
    {
      id: "mcs-q-ecmo-dpc",
      stem: "What is the purpose of a distal perfusion cannula in femoro-femoral VA-ECMO?",
      options: [
        "To drain additional venous blood",
        "To perfuse the leg distal to the arterial return cannula and prevent limb ischaemia",
        "To vent the LV",
        "To sample blood for differential hypoxaemia",
        "To deliver the heparin infusion",
      ],
      answer: 1,
      explanation:
        "The arterial return cannula can occlude flow to the leg below it. A small antegrade sheath in the superficial femoral artery, fed from the return line, perfuses the limb. It has no role in venting, which needs a device or shunt acting on the left heart.",
      difficulty: 1,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-ecmo-wean",
      stem: "Which finding during a low-flow weaning trial most supports readiness for VA-ECMO decannulation?",
      options: [
        "A lactate of 3.5 mmol/L that is rising during the trial",
        "LVEF about 35%, LVOT VTI 14 cm and stable MAP on low inotrope",
        "Aortic valve opening on alternate beats only at the lowest flow",
        "Escalating noradrenaline needed to keep the MAP at 65 mmHg",
        "RA pressure rising to 20 mmHg with a dilated RV on echo",
      ],
      answer: 1,
      explanation:
        "Recovery markers include reasonable LV function (above roughly 20–25%), an LVOT velocity–time integral of about 10 cm or more, stable pressure on low support and normal lactate. A rising RA pressure with a dilated RV is a warning sign: RV failure is a common reason for failure after decannulation.",
      difficulty: 3,
      refs: ["elso-va-2021"],
    },
  ],
  sims: [
    {
      sim: "ecmo",
      task: "Run VA-ECMO: adjust sweep and FdO2 to target gases, recognise and vent LV distension, then detect differential hypoxaemia on the right radial line and reconfigure.",
    },
  ],
  caseIds: ["mcs-case-ecmo-lv-distension"],
};

// ---------------------------------------------------------------------------
// Module 7 — RV support, bridges and decisions
// ---------------------------------------------------------------------------
const rvBridges: Module = {
  id: "mcs-rv-bridges",
  title: "RV support, bridges and decisions",
  stage: 5,
  summary:
    "Recognising and supporting the failing right ventricle, biventricular configurations, bridge strategies to recovery, decision, durable LVAD or transplant, and the ethics of time-limited mechanical support.",
  objectives: [
    "Recognise acute RV failure and apply medical and mechanical support.",
    "Choose between percutaneous RV support options and biventricular configurations.",
    "Describe bridge strategies and the INTERMACS profiles.",
    "Lead goals-of-care conversations around time-limited mechanical support.",
  ],
  lessons: [
    {
      id: "mcs-rv-support",
      title: "Supporting the failing right ventricle",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "The RV is a thin-walled volume pump built for a low-resistance circulation. It tolerates volume better than pressure. When it fails it dilates, the tricuspid valve leaks, the septum shifts left and LV filling falls. Acute RV failure is seen with RV infarction, massive pulmonary embolism, after LVAD or left-sided pump implantation, after cardiac surgery, and with acute lung disease or high ventilator pressures.",
        },
        {
          kind: "table",
          caption: "Recognising RV failure",
          head: ["Domain", "Findings"],
          rows: [
            ["Clinical", "Raised JVP, hypotension, clear lungs unless the LV is also failing, hepatic congestion, falling urine output"],
            ["Echo", "RV larger than the LV, reduced longitudinal function (low TAPSE), septal flattening giving a D-shaped LV, tricuspid regurgitation, plethoric IVC"],
            ["Haemodynamics", "High RA pressure, high RA:PCWP ratio, low PAPi, low cardiac output"],
            ["On a left-sided pump", "Falling pump flow and suction alarms, with a small LV and a dilated RV"],
          ],
        },
        {
          kind: "table",
          caption: "Medical support",
          head: ["Target", "Measures"],
          rows: [
            ["Preload", "Moderate filling: avoid both hypovolaemia and over-distension; diuresis or renal replacement if the RA pressure is very high"],
            ["Afterload (pulmonary vascular resistance)", "Correct hypoxia, hypercapnia and acidosis; lung-protective ventilation with modest PEEP; inhaled pulmonary vasodilators such as nitric oxide where available"],
            ["Contractility", "Dobutamine, milrinone or levosimendan"],
            ["Systemic pressure", "Noradrenaline to maintain RV coronary perfusion; vasopressin as an adjunct"],
            ["Rhythm", "Restore sinus rhythm; AV-sequential pacing for heart block"],
            ["Cause", "Reperfuse RV infarction; reperfusion therapy for massive pulmonary embolism"],
          ],
        },
        { kind: "h", text: "Mechanical RV support" },
        {
          kind: "table",
          caption: "Percutaneous RV support options",
          head: ["Option", "Circuit", "Notes"],
          rows: [
            ["Right-sided microaxial pump", "IVC or right atrium to pulmonary artery", "Bypasses the RV; no oxygenator; needs adequate LV function and a patent pulmonary circulation"],
            ["Extracorporeal right atrium-to-PA pump", "Drains the right atrium and returns to the PA (dual-lumen or two cannulas); an oxygenator can be added", "Supports the RV and, with an oxygenator, gas exchange"],
            ["VA-ECMO", "Right atrium to the systemic arterial circulation", "Bypasses both RV and lungs; raises LV afterload"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "RV support pushes more blood into the left heart. A weak LV may then decompensate, so watch the wedge pressure and the lungs.",
            "Biventricular options: left- and right-sided microaxial pumps together ('BiPella'), VA-ECMO with LV unloading ('ECPELLA'), or surgical biventricular support.",
            "In massive pulmonary embolism with arrest or refractory shock, VA-ECMO can bridge to reperfusion by surgical embolectomy, catheter-directed therapy or systemic thrombolysis.",
          ],
        },
        {
          kind: "pearl",
          text: "In RV failure the target is not a CVP number but a well-filled, not over-distended RV. Watch the septum on echo as you give or remove fluid.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "RV failure after inferior MI: measure RA, PA and wedge pressures, calculate PAPi and the RA:PCWP ratio, then judge whether a fluid challenge, inotrope or RV support is the next step.",
        },
      ],
      refs: ["esc-acs-2023", "esc-hf-2021", "esc-ph-2022", "hanna-pcm", "korabathina-papi-2012"],
    },
    {
      id: "mcs-bridges-ethics",
      title: "Bridges, exits and goals of care",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Temporary mechanical support buys days to weeks. From the first hour the question is: a bridge to what?",
        },
        {
          kind: "table",
          caption: "Bridge strategies",
          head: ["Strategy", "Meaning", "Example"],
          rows: [
            ["Bridge to recovery", "Support until the myocardium recovers", "Stunned myocardium after reperfusion, fulminant myocarditis, Takotsubo syndrome"],
            ["Bridge to decision", "Support while neurological status, organ function and candidacy are clarified", "A post-arrest patient whose neurological outcome is unknown"],
            ["Bridge to bridge", "Move from a short-term device to a longer-term temporary device", "VA-ECMO to a larger microaxial pump or a surgical temporary VAD"],
            ["Bridge to durable LVAD", "Long-term implantable pump", "Non-recovering LV with adequate RV function in a suitable candidate"],
            ["Bridge to transplant", "Support until a donor heart is available", "A listed patient; UK allocation prioritises patients on temporary support (check current NHS Blood and Transplant criteria)"],
            ["Bridge to palliation", "Time for family to gather and for decisions to be made", "When recovery and advanced therapies are not possible"],
          ],
        },
        {
          kind: "keypoints",
          title: "INTERMACS profiles (selected)",
          items: [
            "Profile 1: critical cardiogenic shock ('crash and burn').",
            "Profile 2: progressive decline despite inotropes ('sliding on inotropes').",
            "Profile 3: stable but dependent on inotropes.",
            "Profiles 4–7: ambulatory advanced heart failure of decreasing severity.",
          ],
        },
        {
          kind: "keypoints",
          title: "Durable LVAD candidacy considerations",
          items: [
            "Adequate RV function, or a credible plan to support it.",
            "Recoverable end-organ function and acceptable neurological status.",
            "Ability to manage the device, with social support.",
            "No prohibitive comorbidity, such as active malignancy.",
          ],
        },
        { kind: "h", text: "Ethics and communication" },
        {
          kind: "list",
          items: [
            "Discuss goals early, ideally before or at the time of escalation, with the patient if possible and with the family.",
            "Describe mechanical support as a time-limited trial with review points and explicit criteria for success or failure.",
            "UK professional guidance does not draw an ethical distinction between withdrawing and not starting a treatment that no longer offers overall benefit. Decisions rest on the patient's best interests and, where known, their wishes.",
            "Involve palliative care early; it helps with symptom control and family support, not only at the end of life.",
            "Device withdrawal is a planned procedure: agree who, when, how symptoms will be managed and whether family will be present.",
            "ECMO and long-term devices are finite resources; decisions should follow agreed criteria rather than urgency alone.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting support without discussing the exit, then finding no route to recovery or advanced therapy.",
            "Letting a technical crisis, such as a failing circuit at 3 am, force an unplanned end-of-life decision.",
            "Using jargon with families. 'The machine is doing the work of the heart' is clearer than 'flows are 4 litres'.",
          ],
        },
        {
          kind: "pearl",
          text: "A useful question at every daily review: if this patient were not already on the device, would we start it today?",
        },
      ],
      refs: ["elso-va-2021", "esc-hf-2021", "scai-shock-2022"],
    },
  ],
  quiz: [
    {
      id: "mcs-q-rv-device",
      stem: "After reperfusion of a proximal RCA occlusion, a patient remains in shock despite optimised filling and dobutamine. RA pressure is 20 mmHg, PCWP 9 mmHg, the LV is small and hyperdynamic, and oxygenation is good. Which support bypasses the problem most directly?",
      options: [
        "A left-sided microaxial pump across the aortic valve",
        "A right-sided microaxial pump from the IVC to the PA",
        "An intra-aortic balloon pump at 1:1 augmentation",
        "VV-ECMO through femoral and jugular venous cannulas",
        "Balloon atrial septostomy to decompress the right atrium",
      ],
      answer: 1,
      explanation:
        "This is isolated RV failure with a good LV and good oxygenation. A right-sided pump moves venous blood into the pulmonary artery and bypasses the RV; VA-ECMO is an alternative if gas exchange or the LV also fails. A left-sided pump would suck on an underfilled LV, and VV-ECMO provides gas exchange without circulatory support.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-rv-intermacs",
      stem: "What does INTERMACS profile 1 describe?",
      options: [
        "Stable on oral therapy",
        "Critical cardiogenic shock ('crash and burn')",
        "Stable but inotrope-dependent",
        "Recurrent advanced heart failure with frequent admissions",
        "Ambulatory with exertion-limited symptoms",
      ],
      answer: 1,
      explanation:
        "Profile 1 is critical cardiogenic shock with life-threatening hypotension and worsening perfusion despite escalating support. Inotrope dependence with stability is profile 3, and progressive decline despite inotropes is profile 2.",
      difficulty: 1,
      refs: ["esc-hf-2021"],
    },
    {
      id: "mcs-q-rv-bridge-decision",
      stem: "A 50-year-old is placed on VA-ECMO after a witnessed in-hospital arrest. His neurological status is unknown, his renal function is deteriorating and his transplant candidacy has not been assessed. Which term best describes this use of support?",
      options: ["Bridge to recovery", "Bridge to decision", "Bridge to durable LVAD", "Bridge to transplant", "Destination therapy"],
      answer: 1,
      explanation:
        "When the key facts (neurological outcome, organ recovery, candidacy) are not yet known, support is a bridge to decision. Labelling it a bridge to recovery or transplant at this stage presumes an outcome that has not been established and can mislead the family.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-rv-medical",
      stem: "A ventilated patient with acute RV failure has PaCO2 8.5 kPa, pH 7.21 and SpO2 88%. Which measure most directly lowers RV afterload?",
      options: [
        "A 1 litre fluid bolus",
        "Correcting hypoxia, hypercapnia and acidosis through ventilator adjustment",
        "Increasing PEEP to 18 cmH2O",
        "Adding a beta-blocker to slow the heart rate",
        "Starting an intravenous nitrate infusion",
      ],
      answer: 1,
      explanation:
        "Hypoxia, hypercapnia and acidosis all raise pulmonary vascular resistance; correcting them lowers RV afterload. A large fluid bolus is the tempting reflex for hypotension, but it can over-distend the RV and shift the septum into the LV. Very high PEEP also raises pulmonary vascular resistance.",
      difficulty: 2,
      refs: ["esc-ph-2022", "hanna-pcm"],
    },
    {
      id: "mcs-q-rv-lv-unmask",
      stem: "After a right-sided microaxial pump is started for RV failure, the PCWP rises from 12 to 28 mmHg and the patient develops pulmonary oedema. What is the most likely explanation?",
      options: [
        "Pump malposition, with the inlet lying in the right ventricle",
        "More blood reaching the left heart has overwhelmed a weak LV",
        "Tricuspid regurgitation has resolved, raising left atrial filling",
        "A pulmonary embolism from thrombus formed on the pump",
        "Over-anticoagulation with bleeding into the lung parenchyma",
      ],
      answer: 1,
      explanation:
        "RV support increases flow through the lungs to the left heart. If the LV is also impaired, LA and wedge pressures rise and pulmonary oedema follows. Options include reducing RV pump flow, LV inotropy and LV unloading or biventricular support. Malposition would more typically reduce flow, not cause left-sided congestion.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
    {
      id: "mcs-q-rv-ethics",
      stem: "The family of a patient on day 2 of VA-ECMO ask what happens if the heart does not recover. He is not a candidate for transplant or a durable LVAD. Which approach is most appropriate?",
      options: [
        "Reassure them that ECMO can continue indefinitely until the heart finally recovers",
        "A time-limited trial: agree review points and involve palliative care early",
        "Avoid any discussion of this until the patient actually deteriorates",
        "State that ECMO cannot ethically be withdrawn once it has been started",
        "Ask the family to decide alone whether support should continue each day",
      ],
      answer: 1,
      explanation:
        "When there is no route to durable therapy, support is a time-limited trial towards recovery, and honest early discussion with defined review points prevents a 'bridge to nowhere'. UK professional guidance does not distinguish ethically between withdrawing and withholding treatment that no longer offers overall benefit, so 'cannot be withdrawn' is wrong. Decisions are shared with families, but the clinical responsibility is not handed to them.",
      difficulty: 2,
      refs: ["elso-va-2021"],
    },
    {
      id: "mcs-q-rv-pe-ecmo",
      stem: "A patient with massive pulmonary embolism arrests in the emergency department and does not achieve sustained ROSC despite thrombolysis. The hospital has an ECPR programme. What is the role of VA-ECMO here?",
      options: [
        "None: VA-ECMO is contraindicated in pulmonary embolism after thrombolysis",
        "A bridge restoring circulation and gas exchange while reperfusion is completed",
        "A replacement for reperfusion therapy, because ECMO dissolves the clot over time",
        "Only useful if the patient has a shockable rhythm at the time of cannulation",
        "It should be delayed until 24 hours after thrombolysis to limit bleeding",
      ],
      answer: 1,
      explanation:
        "VA-ECMO bypasses the obstructed pulmonary circulation and the failing RV, supporting circulation and oxygenation while the clot is dealt with, for example by surgical embolectomy or catheter-directed therapy. Recent thrombolysis increases bleeding risk but does not make ECMO categorically contraindicated; the decision is individual. ECMO does not remove the clot, so it does not replace reperfusion.",
      difficulty: 3,
      refs: ["elso-va-2021"],
    },
  ],
  sims: [
    {
      sim: "haemo",
      task: "Distinguish RV-dominant from biventricular failure using RA, wedge pressure, PAPi and cardiac output, and choose the matching support.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
const caseStemiShock: CaseStudy = {
  id: "mcs-case-anterior-stemi-shock",
  title: "Anterior STEMI sliding into shock",
  trackId: "acute-mcs",
  stage: 5,
  provenance: { kind: "synthetic" },
  summary:
    "A 61-year-old with anterior STEMI who moves from SCAI stage C to D: culprit-only PCI, invasive phenotyping, a microaxial pump decision, unmasked RV failure and weaning.",
  presentation:
    "A 61-year-old man with type 2 diabetes and hypertension calls an ambulance after 3 hours of central chest pain. The pre-hospital ECG shows anterior ST elevation and he is taken directly to the cath lab of the regional heart attack centre. On arrival he is grey and clammy.",
  findings: [
    "HR 112 bpm (sinus tachycardia), BP 86/58 mmHg (MAP 67), SpO2 93% on 4 L/min oxygen, RR 26",
    "Bibasal crackles; cool hands and feet; capillary refill 4 seconds",
    "ECG: ST elevation V1–V5, I and aVL",
    "Venous blood gas: lactate 3.4 mmol/L",
    "Point-of-care echo: severe anterior and apical hypokinesia, LVEF about 25%, no septal defect, no significant mitral regurgitation, RV normal size",
    "Aspirin given by the ambulance crew",
  ],
  steps: [
    {
      id: "access",
      prompt: "He is on the table. What is your access plan?",
      info: "Radial pulses are weak but palpable. Both femoral pulses are present.",
      options: [
        {
          text: "Right radial for the coronary work, with ultrasound-guided femoral arterial and venous access planned for haemodynamics and possible support",
          best: true,
          feedback:
            "Radial access reduces bleeding. In a shocked patient, planned ultrasound-guided femoral access (a single anterior puncture of the common femoral artery) keeps a clean route for a device, and a venous sheath allows a right heart study.",
          next: "angio",
        },
        {
          text: "Femoral arterial access with an 8 Fr sheath by palpation only, so that everything goes through one groin",
          acceptable: true,
          feedback:
            "Femoral access is reasonable in shock, but a blind puncture risks a high or low stick that makes later large-bore access dangerous. Use ultrasound and decide in advance which groin will carry a device.",
          next: "angio",
        },
        {
          text: "Insert an IABP before angiography to stabilise him",
          feedback:
            "Routine IABP did not improve survival in AMI-related shock (IABP-SHOCK II), and inserting it first delays reperfusion. Open the artery first.",
          next: "angio",
        },
        {
          text: "Start fibrinolysis while the lab is set up",
          feedback:
            "He is already in a primary PCI centre. Fibrinolysis adds bleeding risk, including at the access sites, without benefit when PCI is immediately available.",
          next: "angio",
        },
      ],
    },
    {
      id: "angio",
      prompt: "Angiography is complete. What do you do?",
      info: "Proximal LAD occluded (TIMI 0) with thrombus. Dominant RCA with an 85% mid-vessel stenosis. Mid circumflex chronic total occlusion, filled by collaterals from the RCA. Noradrenaline 0.1 µg/kg/min has been started; BP 90/60 mmHg.",
      options: [
        {
          text: "PCI to the LAD culprit only with a drug-eluting stent; leave the RCA and circumflex for a later decision",
          best: true,
          feedback:
            "CULPRIT-SHOCK showed that culprit-only PCI reduced the 30-day composite of death or renal replacement therapy compared with immediate multivessel PCI. The RCA lesion and the occlusion can be reconsidered once he has recovered.",
          next: "post-pci",
        },
        {
          text: "PCI to the LAD and then the RCA in the same sitting, because the RCA supplies collaterals to the circumflex territory",
          feedback:
            "A tempting argument, but immediate multivessel PCI in shock performed worse than culprit-only PCI in CULPRIT-SHOCK. Treat the RCA now only if it becomes clearly unstable or ischaemic.",
          next: "angio-multivessel-shock", stateDelta: {"stability": -20, "flags": ["multivessel"]} },
        {
          text: "PCI to the LAD and RCA, and an attempt to open the circumflex occlusion",
          feedback:
            "Prolonged multivessel and CTO work in shock adds contrast, time and ischaemic risk without benefit. CULPRIT-SHOCK argues firmly against it.",
          next: "post-pci",
        },
        {
          text: "Refer for emergency CABG",
          feedback:
            "Emergency surgery is the option when the culprit cannot be treated by PCI or there is a mechanical complication. Here the LAD occlusion is straightforward to treat and time matters.",
          next: "post-pci",
        },
      ],
    },
    {
      id: "post-pci",
      prompt: "The LAD is stented with TIMI 3 flow. Thirty minutes later he remains hypotensive. What next?",
      info: "BP 84/56 mmHg (MAP 65) on noradrenaline 0.2 µg/kg/min. HR 118 bpm. Lactate 4.6 mmol/L (was 3.4). Urine output 15 mL in the last hour.",
      options: [
        {
          text: "Right heart catheterisation now to phenotype the shock: RA, PA and wedge pressures, cardiac output and SvO2",
          best: true,
          feedback:
            "He is now SCAI stage D, deteriorating despite revascularisation and a vasopressor. Measurements take minutes in the lab and determine which support makes sense.",
          next: "haemo",
        },
        {
          text: "Add dobutamine and reassess in the lab with an echo after 15 minutes",
          acceptable: true,
          feedback:
            "Reasonable for low output, but MAP is marginal and lactate is rising. Measuring first makes the decision more precise and wastes less time.",
          next: "haemo",
        },
        {
          text: "Add adrenaline as a second vasopressor and transfer to the ICU",
          feedback:
            "Adrenaline produced more refractory shock than noradrenaline in a randomised comparison, and leaving the lab without measurements loses the best moment to decide on support.",
          next: "haemo",
        },
        {
          text: "Give a 1 litre fluid bolus",
          feedback:
            "He has crackles and an LVEF of 25%. Without evidence of low filling pressures, a large bolus is likely to worsen pulmonary oedema.",
          next: "haemo",
        },
      ],
    },
    {
      id: "haemo",
      prompt: "What do these haemodynamics show, and what is the best support?",
      info: "RA 9 mmHg, PA 44/26 mmHg, PCWP 27 mmHg, cardiac output 3.1 L/min (CI 1.6 L/min/m²), SvO2 48%, MAP 64 mmHg. CPO = 64 × 3.1 ÷ 451 ≈ 0.44 W. PAPi = (44 − 26) ÷ 9 = 2.0. He is awake and oriented. No aortic regurgitation or LV thrombus; iliofemoral vessels of good size on angiography.",
      options: [
        {
          text: "LV-dominant shock: insert a CP-class microaxial flow pump through the prepared femoral access",
          best: true,
          feedback:
            "Low CPO, high wedge pressure, preserved RV (PAPi 2.0, RA 9) and no coma: this matches the population in which DanGer Shock showed lower 180-day mortality, at the cost of more bleeding, limb ischaemia and renal replacement therapy. Plan limb checks and anticoagulation from the start.",
          next: "suction",
        },
        {
          text: "Insert an IABP",
          feedback:
            "Quick and small-bore, but IABP-SHOCK II showed no survival benefit in AMI-related shock, and the small output gain will not rescue a CPO of 0.44 W.",
          next: "haemo-iabp-inadequate", stateDelta: {"stability": -10} },
        {
          text: "Start peripheral VA-ECMO",
          feedback:
            "VA-ECMO would restore perfusion but raises afterload on an LV that already has a wedge pressure of 27 mmHg, and routine early ECMO did not reduce mortality in ECLS-SHOCK. It is kept for biventricular failure, severe hypoxaemia or arrest.",
          next: "suction",
        },
        {
          text: "Increase noradrenaline and add vasopressin",
          feedback:
            "More vasoconstriction raises afterload on a failing LV without improving output, and lactate is already rising.",
          next: "suction",
        },
      ],
    },
    {
      id: "suction",
      prompt: "Six hours later the pump alarms repeatedly. What is happening, and what do you do?",
      info: "Flow was 3.3 L/min; it now fluctuates between 1.8 and 2.6 L/min with suction alarms. MAP 62 mmHg. RA 19 mmHg (was 9), PA 30/20 mmHg, PAPi ≈ 0.5. Echo: small, underfilled LV; dilated, hypokinetic RV; pump inlet correctly about 3.5 cm below the annulus; no pericardial effusion. Haemoglobin stable.",
      options: [
        {
          text: "RV failure unmasked by LV unloading: lower the P-level slightly, start an inotrope, correct factors raising pulmonary vascular resistance, and involve the shock team about RV support if there is no rapid improvement",
          best: true,
          feedback:
            "Rising RA pressure, falling PAPi, an empty LV and a dilated RV mean the RV cannot deliver enough blood to the pump. Inotropy and RV afterload reduction come first; a right-sided pump or conversion to VA-ECMO follows if needed.",
          next: "wean",
        },
        {
          text: "Increase the P-level to restore flow",
          feedback: "Higher speed pulls harder on an empty LV, worsening suction, ectopy and haemolysis.",
          next: "suction-higher-p", stateDelta: {"stability": -15} },
        {
          text: "Give repeated large fluid boluses until the alarms stop",
          feedback:
            "A small, cautious challenge can be tried, but an RA pressure of 19 mmHg means the RV is already distended. More volume pushes the septum into the LV and reduces LV filling further.",
          next: "wean",
        },
        {
          text: "Pull the pump back by 2 cm",
          feedback: "Echo shows a correct position. Moving a well-placed pump will not fix an RV problem and risks pulling it into the aorta.",
          next: "wean",
        },
      ],
    },
    {
      id: "wean",
      prompt: "The RV improved with dobutamine and ventilator adjustment, without an RV device. On day 3, how do you proceed?",
      info: "Off noradrenaline; dobutamine 2.5 µg/kg/min. Lactate 1.1 mmol/L, urine output 80 mL/h, MAP 75 mmHg. LVEF about 35% at the current support level. Right foot warm with Doppler signals present.",
      options: [
        {
          text: "Wean the pump stepwise over hours with echo, haemodynamic and lactate checks at each step, then remove it and close the access",
          best: true,
          feedback:
            "Recovery markers are present, and every extra day adds bleeding, haemolysis and limb risk. Step down, reassess, remove.",
        },
        {
          text: "Remove the pump now without a weaning trial",
          acceptable: true,
          feedback:
            "Some patients tolerate abrupt removal, but a stepwise wean identifies those who would fail while support can still be increased again.",
        },
        {
          text: "Keep full support for another week to rest the heart",
          feedback: "There is no evidence that prolonged support after recovery helps, and complications accumulate with time.",
        },
        {
          text: "Stop the pump and leave it across the valve for 24 hours to see whether he tolerates it",
          feedback:
            "A stopped pump across the aortic valve allows backflow from the aorta into the LV and risks thrombosis. Weaning is done with the pump running.",
        },
      ],
    },
    {
      "id": "angio-multivessel-shock",
      "kind": "consequence",
      "info": "During RCA stenting his BP falls to 68/40 mmHg, lactate rises to 6.1 mmol/L and contrast use passes 250 mL. The RCA result is good.",
      "prompt": "Immediate multivessel PCI has added ischaemia, contrast and time. What now?",
      "options": [
        {
          "text": "Stop further PCI, phenotype the shock with a right heart catheter and escalate support",
          "best": true,
          "feedback": "CULPRIT-SHOCK favoured culprit-only PCI; now the priority is haemodynamic assessment and support.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Attempt the circumflex occlusion while you are there",
          "feedback": "A CTO attempt in shock adds ischaemia, contrast and time with no benefit.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Add adrenaline and finish quickly",
          "acceptable": true,
          "feedback": "Adrenaline may buy pressure but increases oxygen demand; the shock needs phenotyping and appropriate support.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
    {
      "id": "suction-higher-p",
      "kind": "consequence",
      "info": "At a higher P-level the suction alarms become continuous, plasma free haemoglobin rises and the RA pressure is 22 mmHg.",
      "prompt": "Higher speed has made things worse. What now?",
      "options": [
        {
          "text": "Lower the P-level, treat the RV (inotrope, ventilation, pulmonary vasodilators) and consider RV mechanical support",
          "best": true,
          "feedback": "The problem is RV delivery to an empty LV; pulling harder causes suction and haemolysis.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Give repeated large fluid boluses",
          "feedback": "A failing RV with an RA of 22 mmHg cannot use more volume.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Remove the pump",
          "feedback": "The LV still needs support; the RV needs treating.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "haemo-iabp-inadequate",
      "kind": "consequence",
      "info": "Two hours after IABP insertion: MAP 60 mmHg on noradrenaline, CI 1.5 L/min/m², lactate 5.3 mmol/L, urine output 10 mL/h.",
      "prompt": "The IABP has not reversed the shock. What now?",
      "options": [
        {
          "text": "Escalate to a microaxial flow pump (or VA-ECMO if oxygenation or biventricular failure demands it) through the prepared femoral access",
          "best": true,
          "feedback": "IABP-SHOCK II showed no survival benefit from routine IABP; LV-dominant shock with falling perfusion needs more support.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Increase noradrenaline and wait",
          "feedback": "Escalating vasopressors in worsening shock increases afterload and organ injury.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Switch the IABP to 1:1 with maximal volume",
          "feedback": "An IABP gives modest support; it cannot rescue severe LV failure.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "The pump was weaned and removed on day 4 with percutaneous closure. Staged PCI to the RCA was performed before discharge after heart team discussion; the circumflex occlusion was left on medical therapy pending viability assessment. LVEF at 3 months was 40%.",
  outcomeVariants: [
    {
      "flag": "multivessel",
      "text": "Immediate multivessel PCI in shock added ischaemic time and contrast, and the renal function took a week to recover."
    }
  ],
  learningPoints: [
    "In AMI-related shock, revascularise the culprit only and consider staged treatment of other lesions after recovery.",
    "When shock persists after PCI, measure haemodynamics in the lab: CPO and PAPi define the phenotype.",
    "A microaxial pump fits LV-dominant STEMI shock in an awake patient; DanGer Shock showed lower mortality with more complications.",
    "Falling pump flow with suction, rising RA pressure and a low PAPi indicate RV failure, not a pump fault.",
    "Wean and remove devices as soon as perfusion has recovered.",
  ],
  refs: ["culprit-shock-2017", "danger-shock-2024", "iabp-shock-ii-2012", "ecls-shock-2023", "scai-shock-2022", "esc-acs-2023", "fincke-cpo-2004", "korabathina-papi-2012", "optimacc-2018"],
};

const caseEcmoDistension: CaseStudy = {
  id: "mcs-case-ecmo-lv-distension",
  title: "VA-ECMO and a silent arterial line",
  trackId: "acute-mcs",
  stage: 5,
  provenance: { kind: "synthetic" },
  summary:
    "A patient on femoro-femoral VA-ECMO for fulminant myocarditis develops LV distension, needs venting, and later develops differential hypoxaemia as the heart recovers before the lungs.",
  presentation:
    "A 49-year-old woman with suspected fulminant myocarditis developed refractory cardiogenic shock with recurrent VT and was placed on femoro-femoral VA-ECMO 14 hours ago, with a distal perfusion cannula in the left leg. She is sedated and ventilated in the cardiac ICU. You are called because her ventilatory requirements are rising.",
  findings: [
    "ECMO flow 4.5 L/min; sweep 4 L/min; FdO2 1.0",
    "Right radial arterial line: 82/78 mmHg (pulse pressure 4 mmHg)",
    "PA catheter: PA 38/30 mmHg; PCWP 30 mmHg (18 mmHg at cannulation)",
    "Pink frothy secretions in the endotracheal tube; chest X-ray shows bilateral perihilar oedema",
    "Ventilator: FiO2 0.8, PEEP 8 cmH2O",
    "Noradrenaline 0.05 µg/kg/min; no inotrope",
  ],
  steps: [
    {
      id: "interpret",
      prompt: "What is the most likely problem?",
      info: "Bedside echo: dilated LV with severe global hypokinesia, aortic valve not opening on consecutive beats, dense spontaneous echo contrast in the LV and aortic root, moderate mitral regurgitation. Only a small pericardial rim.",
      options: [
        {
          text: "LV distension: the LV cannot eject against the afterload of retrograde ECMO flow",
          best: true,
          feedback:
            "A near-flat pulse pressure, a closed aortic valve, smoke, a rising wedge pressure and pulmonary oedema form the classic picture of an LV that cannot open its valve on peripheral VA-ECMO.",
          next: "first-measures",
        },
        {
          text: "Primary lung injury needing more PEEP only",
          feedback: "The lungs are wet because LA pressure is high. PEEP may help a little but does not address the cause.",
          next: "first-measures",
        },
        {
          text: "Cardiac tamponade",
          feedback:
            "There is only a small rim. Tamponade on ECMO usually reduces venous drainage (chatter, falling flow) and compresses the chambers rather than dilating the LV.",
          next: "first-measures",
        },
        {
          text: "Oxygenator failure",
          feedback: "Post-oxygenator gases should be checked, but oxygenator failure would not explain a closed aortic valve and a rising wedge pressure.",
          next: "first-measures",
        },
      ],
    },
    {
      id: "first-measures",
      prompt: "What are your first measures while you prepare for definitive action?",
      info: "Post-oxygenator PO2 52 kPa (the oxygenator is working). Lactate 2.1 mmol/L. MAP 80 mmHg.",
      options: [
        {
          text: "Reduce ECMO flow to the lowest level that maintains perfusion, start dobutamine, wean noradrenaline if MAP allows, and check on echo whether the valve opens",
          best: true,
          feedback:
            "Less retrograde flow and lower MAP reduce afterload, and inotropy helps the LV eject. These are the right first steps, although they are often not enough for a severely stunned ventricle.",
          next: "vent",
        },
        {
          text: "Increase ECMO flow to 5.5 L/min to improve oxygenation",
          feedback: "More flow raises afterload further and worsens distension and pulmonary oedema.",
          next: "first-flow-up", stateDelta: {"stability": -20, "flags": ["lv-distension"]} },
        {
          text: "Increase noradrenaline to reach a MAP of 90 mmHg",
          feedback: "Raising MAP increases the pressure the LV must exceed to open the valve. This moves in the wrong direction.",
          next: "vent",
        },
        {
          text: "Give furosemide and review tomorrow",
          feedback:
            "Diuresis may help volume status, but it will not open a closed aortic valve. Stasis, thrombus risk and lung injury continue.",
          next: "vent",
        },
      ],
    },
    {
      id: "vent",
      prompt: "Thirty minutes later the aortic valve opens only intermittently and the PCWP is 28 mmHg. Which unloading strategy?",
      info: "The left common femoral artery carries the ECMO return cannula and distal perfusion cannula. The right common femoral artery measures 7.5 mm on ultrasound, without significant calcification. No LV thrombus; structurally normal aortic valve.",
      options: [
        {
          text: "Insert a microaxial flow pump through the right femoral artery to unload the LV (ECPELLA)",
          best: true,
          feedback:
            "Direct LV unloading lowers LV pressure and volume, restores forward flow through the aortic root and reduces stasis. It needs a second large-bore arterial access and close attention to haemolysis, bleeding and anticoagulation.",
          next: "hypoxaemia",
        },
        {
          text: "Insert an IABP",
          acceptable: true,
          feedback:
            "A reasonable smaller-bore option that lowers afterload and can help the valve open, but its unloading effect may be insufficient with a wedge pressure of 28 mmHg and a barely ejecting LV.",
          next: "hypoxaemia",
        },
        {
          text: "Balloon atrial septostomy",
          acceptable: true,
          feedback:
            "Decompresses the LA and lungs, but if the LV still does not eject, stasis in the LV and aortic root persists. Useful when arterial access for a pump is not possible.",
          next: "hypoxaemia",
        },
        {
          text: "Continue the current measures and recheck in 12 hours",
          feedback: "Persisting distension with smoke risks LV thrombus and worsening lung injury. Act now.",
          next: "first-flow-up", stateDelta: {"stability": -15, "flags": ["lv-distension"]} },
      ],
    },
    {
      id: "hypoxaemia",
      prompt: "Two days later the LV is recovering, but the right radial gases are worsening. What is happening?",
      info: "Pulse pressure now 22 mmHg; microaxial pump at moderate support; ECMO flow 3.0 L/min. Right radial gas: PaO2 6.8 kPa, SaO2 84%. Right ear SpO2 85%. Femoral arterial gas: PaO2 32 kPa. Post-oxygenator PO2 50 kPa. Chest X-ray: improving but persistent bilateral consolidation.",
      options: [
        {
          text: "Differential hypoxaemia: the recovering LV ejects desaturated blood from injured lungs into the coronary and arch vessels",
          best: true,
          feedback:
            "The right radial artery reflects what the brain and heart receive, while the femoral line samples ECMO blood. As native output rises, the mixing zone moves towards the legs.",
          next: "manage-hypoxaemia",
        },
        {
          text: "Oxygenator failure",
          feedback: "A post-oxygenator PO2 of 50 kPa shows that the oxygenator is working.",
          next: "manage-hypoxaemia",
        },
        {
          text: "An arterial line error; trust the femoral gas",
          feedback: "Here the femoral gas is the misleading one: it samples well-oxygenated ECMO blood that does not reach the arch.",
          next: "manage-hypoxaemia",
        },
        {
          text: "Recirculation",
          feedback:
            "Recirculation, where returned blood is drawn straight back into the drainage cannula, is a VV-ECMO problem. Upper-body hypoxaemia with good femoral gases on VA-ECMO is differential hypoxaemia.",
          next: "manage-hypoxaemia",
        },
      ],
    },
    {
      id: "manage-hypoxaemia",
      prompt: "What is the best management?",
      info: "Echo: LVEF about 30% with the microaxial pump at moderate support; fair RV function. The ECMO team discuss the options.",
      options: [
        {
          text: "Optimise ventilation (PEEP, FiO2, secretion clearance) and reconfigure to V-AV ECMO with a jugular venous return limb, while planning ECMO weaning",
          best: true,
          feedback:
            "Returning oxygenated blood to the right heart raises the oxygen content of native output. As the heart recovers, ECMO can be weaned with the microaxial pump kept as step-down LV support.",
          next: "deescalate",
        },
        {
          text: "Increase ECMO flow to 5 L/min",
          acceptable: true,
          feedback:
            "This can push the mixing zone back towards the heart for a while, but it raises afterload on a recovering LV and works against the unloading you have just achieved.",
          next: "deescalate",
        },
        {
          text: "Stop the microaxial pump to reduce native ejection",
          feedback: "That trades hypoxaemia for recurrent LV distension.",
          next: "hypox-pump-stopped", stateDelta: {"stability": -15} },
        {
          text: "Accept the saturations because the femoral gas is normal",
          feedback: "The brain and myocardium are hypoxaemic. This is not acceptable.",
          next: "deescalate",
        },
      ],
    },
    {
      id: "deescalate",
      prompt: "Day 6: how do you sequence de-escalation?",
      info: "Lactate 1.0 mmol/L, off noradrenaline, LVEF about 40%, pulse pressure 35 mmHg, VT suppressed, lungs improving (FiO2 0.4, PEEP 8 cmH2O).",
      options: [
        {
          text: "Wean and decannulate ECMO first, keeping the microaxial pump as step-down support, then wean the pump",
          best: true,
          feedback:
            "Stepwise de-escalation keeps LV unloading in place while the heart takes on the full circulation, and it avoids leaving ECMO running without a vent.",
        },
        {
          text: "Remove both devices on the same day",
          feedback: "Possible in some patients, but it removes the safety net in one step. Stepwise de-escalation is safer.",
        },
        {
          text: "Remove the microaxial pump first and continue ECMO",
          feedback: "Removing the vent while retrograde ECMO flow continues risks recurrent distension.",
        },
        {
          text: "Keep both devices for another week",
          feedback: "Recovery is evident, and bleeding, haemolysis and limb complications accumulate with time.",
        },
      ],
    },
    {
      "id": "first-flow-up",
      "kind": "consequence",
      "info": "PCWP 34 mmHg, frothy secretions from the endotracheal tube, aortic valve closed on every beat, PaO2 falling.",
      "prompt": "The LV is distending into pulmonary oedema. What now?",
      "options": [
        {
          "text": "Reduce ECMO flow to the lowest adequate level, add inotropy and unload the LV now (microaxial pump or septostomy)",
          "best": true,
          "feedback": "Retrograde ECMO flow raises afterload; the LV must be offloaded before stasis and oedema become irreversible.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Increase PEEP and FiO2 only",
          "acceptable": true,
          "feedback": "Ventilator changes support oxygenation but do not remove the cause.",
          "stateDelta": {
            "stability": -5
          }
        },
        {
          "text": "Increase ECMO flow further to oxygenate",
          "feedback": "More flow means more afterload and more distension.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "hypox-pump-stopped",
      "kind": "consequence",
      "info": "With the microaxial pump off, the LV distends again: pulse pressure 6 mmHg, PCWP 30 mmHg and smoke in the LV.",
      "prompt": "Stopping the vent has brought back distension. What now?",
      "options": [
        {
          "text": "Restart the microaxial pump and reconfigure ECMO to V-AV to treat the hypoxaemia",
          "best": true,
          "feedback": "The vent is needed while ECMO is running; differential hypoxaemia is solved by reconfiguration, not by stopping the vent.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Leave it off and accept the distension",
          "feedback": "LV stasis risks thrombus and pulmonary oedema.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Increase ECMO flow to maximum",
          "feedback": "This worsens afterload and distension.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
  ],
  outcome:
    "ECMO was weaned and decannulated on day 6 with surgical arterial repair, and the microaxial pump was removed on day 8. Endomyocardial biopsy confirmed lymphocytic myocarditis. She was extubated on day 9 and discharged with an LVEF of 45%.",
  outcomeVariants: [
    {
      "flag": "lv-distension",
      "text": "Delaying LV unloading allowed pulmonary oedema and a longer period of ventilation."
    }
  ],
  learningPoints: [
    "On peripheral VA-ECMO, a pulse pressure approaching zero with a closed aortic valve and rising wedge pressure means LV distension.",
    "First measures: lower ECMO flow, add inotropy and avoid excess MAP; if distension persists, vent with a microaxial pump, IABP or septostomy.",
    "Monitor right radial gases on femoral VA-ECMO: differential hypoxaemia appears when the heart recovers before the lungs.",
    "V-AV reconfiguration delivers oxygenated blood to the pulmonary circulation and therefore to the native output.",
    "De-escalate stepwise: ECMO first, then the LV pump.",
  ],
  refs: ["elso-va-2021", "ecls-shock-2023", "hanna-pcm"],
};

const caseIabpTiming: CaseStudy = {
  id: "mcs-case-iabp-timing",
  title: "Reading the balloon",
  trackId: "acute-mcs",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "An IABP used as a bridge to surgery for post-infarct ventricular septal rupture: recognising and correcting timing errors, a trigger problem, malposition and balloon rupture.",
  presentation:
    "A 74-year-old woman presented 4 days after the onset of chest pain with breathlessness and hypotension. Echo showed an apical ventricular septal rupture after an anterior MI, and angiography showed an occluded mid LAD. The surgeons plan repair once she is stabilised. An IABP sized from the manufacturer's height chart has been inserted through the right femoral artery and she is in the coronary care unit.",
  findings: [
    "HR 98 bpm, sinus rhythm; BP before the IABP 84/52 mmHg",
    "Harsh pansystolic murmur with a thrill at the left sternal edge",
    "Oximetry: RA saturation 58%, PA saturation 82% (step-up); estimated Qp:Qs about 2.4",
    "Lactate 2.8 mmol/L",
    "Chest X-ray: pulmonary oedema; IABP tip marker at the level of the carina",
    "Noradrenaline 0.06 µg/kg/min and dobutamine 5 µg/kg/min",
  ],
  steps: [
    {
      id: "late-deflation",
      prompt: "The nurse prints a 1:2 trace. What do you see, and what do you do?",
      info: "Unassisted beat: systolic 92 mmHg, end-diastolic 54 mmHg. Augmentation starts at the dicrotic notch and peaks at 104 mmHg. Assisted end-diastolic pressure 58 mmHg; the following systolic upstroke is slow and the augmentation looks wide.",
      options: [
        {
          text: "Late deflation: move deflation earlier until the assisted end-diastolic pressure is below the unassisted value",
          best: true,
          feedback:
            "An assisted end-diastolic pressure (58) above the unassisted value (54) means the balloon is still inflated as the LV starts to eject. That raises afterload, which in VSR also increases the left-to-right shunt.",
          next: "early-inflation",
        },
        {
          text: "Early inflation: move inflation later",
          feedback: "Augmentation begins at the notch, so inflation timing is correct.",
          next: "early-inflation",
        },
        {
          text: "Early deflation: move deflation later",
          feedback:
            "Early deflation lowers the assisted end-diastolic pressure to or below the unassisted value, with a U-shaped dip. Here it is higher, so moving deflation later would make things worse.",
          next: "early-inflation",
        },
        {
          text: "Timing is fine; increase the balloon volume",
          feedback: "The end-diastolic comparison shows a timing error, and changing volume does not correct timing.",
          next: "late-deflation-volume", stateDelta: {"stability": -10} },
      ],
    },
    {
      id: "early-inflation",
      prompt: "After deflation is corrected, a colleague also adjusts inflation. What does the new trace show?",
      info: "Augmentation now begins before the dicrotic notch and merges with the end of the systolic waveform; the notch is no longer visible. Assisted end-diastolic pressure 46 mmHg, unassisted 54 mmHg.",
      options: [
        {
          text: "Early inflation: move inflation later, back to the dicrotic notch",
          best: true,
          feedback:
            "Inflating before aortic valve closure forces the valve shut early, reduces stroke volume, raises LV end-diastolic pressure and can cause aortic regurgitation. Deflation is now correct.",
          next: "af",
        },
        {
          text: "Late inflation: move inflation earlier",
          feedback: "With late inflation the notch is visible before augmentation begins. Here the notch has disappeared because the balloon inflates before it.",
          next: "af",
        },
        {
          text: "This is ideal because augmentation is maximised",
          feedback: "Augmentation that encroaches on systole loads the ventricle. It is not ideal, whatever the peak looks like.",
          next: "af",
        },
        {
          text: "Switch to 1:3",
          feedback: "Changing the ratio does not fix timing. Correct the timing at 1:2, then return to 1:1.",
          next: "af",
        },
      ],
    },
    {
      id: "af",
      prompt: "Overnight she develops atrial fibrillation at 130 bpm and augmentation becomes erratic. What is the best step?",
      info: "ECG trigger in use. Several beats show inflation colliding with the next systole.",
      options: [
        {
          text: "Treat the AF (rate or rhythm control) and use the console's AF mode with R-wave deflation, checking the trace",
          best: true,
          feedback:
            "R-wave deflation ensures the balloon deflates with each QRS whatever the R–R interval, and treating the rhythm restores diastolic time.",
          next: "urine",
        },
        {
          text: "Switch to the arterial pressure trigger",
          acceptable: true,
          feedback: "An alternative when the ECG signal is poor, but in irregular rhythms R-wave deflation is generally more reliable.",
          next: "urine",
        },
        {
          text: "Switch to the internal (asynchronous) trigger",
          feedback: "Internal mode ignores the patient's rhythm and will inflate during systole. It is only for situations with no cardiac output.",
          next: "urine",
        },
        {
          text: "Stop the IABP until the AF resolves",
          feedback: "A stationary balloon promotes thrombus, and she still needs the support.",
          next: "urine",
        },
      ],
    },
    {
      id: "urine",
      prompt: "The next morning, urine output has fallen to 10 mL/h and creatinine is rising. Haemodynamics are unchanged. What do you check first?",
      info: "Today's chest X-ray shows the radio-opaque tip about 6 cm below the carina.",
      options: [
        {
          text: "Balloon position: it has migrated distally and may be covering the renal arteries; reposition under fluoroscopy",
          best: true,
          feedback: "A low-lying balloon can occlude the renal arteries with each inflation. The timing of the change with the X-ray finding makes this the first thing to correct.",
          next: "rupture",
        },
        {
          text: "Give a fluid bolus and start furosemide",
          feedback: "Treat volume status after excluding a mechanical cause. The X-ray shows migration.",
          next: "urine-fluid", stateDelta: {"stability": -15} },
        {
          text: "Attribute it to contrast nephropathy and observe",
          feedback: "Contrast nephropathy is possible after angiography, but it would not explain an abrupt change coinciding with balloon migration.",
          next: "rupture",
        },
        {
          text: "Stop the IABP permanently",
          feedback: "She still needs a bridge to surgery. Reposition the balloon rather than lose the support.",
          next: "rupture",
        },
      ],
    },
    {
      id: "rupture",
      prompt: "On the morning of surgery, the nurse sees brown flecks in the helium tubing and the console shows a gas-loss alarm. What do you do?",
      info: "Augmentation has fallen. The pump is at 1:1.",
      options: [
        {
          text: "Stop pumping, clamp the gas line and remove the balloon promptly; insert a new IABP through the other groin if support is still needed",
          best: true,
          feedback:
            "Blood in the gas line means the balloon has perforated. Continuing risks gas embolism, and blood clotting inside the balloon can entrap it, so removal is urgent.",
        },
        {
          text: "Flush the gas line and restart",
          feedback: "Restarting a perforated balloon pushes helium into the circulation and delays removal.",
        },
        {
          text: "Reduce to 1:3 until theatre",
          feedback: "A perforated balloon must not be pumped at any ratio.",
        },
        {
          text: "Leave the balloon in place, switched off, for the surgeon to remove in theatre",
          feedback: "A stationary, perforated balloon can thrombose and become entrapped. Remove it now.", next: "rupture-left-in", stateDelta: {"stability": -20, "flags": ["iabp-entrapment"]} },
      ],
    },
    {
      "id": "late-deflation-volume",
      "kind": "consequence",
      "info": "With more balloon volume, the assisted end-diastolic pressure rises further above the unassisted value and the patient's lactate climbs.",
      "prompt": "Why has more volume made things worse?",
      "options": [
        {
          "text": "The timing error is late deflation: the balloon is still inflated as the LV ejects; move deflation earlier",
          "best": true,
          "feedback": "Late deflation increases afterload; volume does not correct timing.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "The balloon is too small; upsize it",
          "feedback": "Size is not the problem; timing is.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Switch to 1:3 to reduce the effect",
          "feedback": "This reduces support without fixing the error.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
    {
      "id": "urine-fluid",
      "kind": "consequence",
      "info": "After fluid and furosemide, urine output stays at 10 mL/h; the chest X-ray still shows the tip 6 cm below the carina.",
      "prompt": "The renal problem persists. What has been missed?",
      "options": [
        {
          "text": "The balloon has migrated and covers the renal arteries; reposition it under fluoroscopy",
          "best": true,
          "feedback": "A low balloon occludes the renal arteries during inflation.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Contrast nephropathy; start renal replacement therapy",
          "feedback": "The timing and the X-ray point to malposition.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "More furosemide",
          "feedback": "Diuretics cannot overcome an occluded renal artery.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
    {
      "id": "rupture-left-in",
      "kind": "consequence",
      "info": "In theatre, the surgeon cannot withdraw the balloon: clotted blood inside it has formed a hard mass that will not pass through the sheath.",
      "prompt": "The ruptured balloon is entrapped. What now?",
      "options": [
        {
          "text": "Involve vascular surgery for controlled retrieval (sometimes with thrombolytic instilled into the balloon by specialists), and support the patient",
          "best": true,
          "feedback": "Entrapment is the reason a ruptured balloon is removed promptly; now it needs specialist retrieval.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Pull harder through the sheath",
          "feedback": "Force can tear the femoral or iliac artery.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Leave it in permanently",
          "feedback": "A retained, thrombosed balloon threatens limb and embolic complications.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
  ],
  outcome:
    "The balloon was removed and a new one inserted through the left femoral artery. She underwent surgical patch repair of the septal rupture with a graft to the LAD the same day. The IABP was weaned on the second postoperative day and she was discharged on day 18.",
  outcomeVariants: [
    {
      "flag": "iabp-entrapment",
      "text": "Leaving the ruptured balloon in place led to entrapment and a vascular repair."
    }
  ],
  learningPoints: [
    "Judge IABP timing on a 1:2 trace, comparing assisted with unassisted beats.",
    "Late deflation: assisted end-diastolic pressure equal to or above unassisted. Early inflation: augmentation starts before the notch. Both increase LV work.",
    "In irregular rhythms, treat the rhythm and use R-wave deflation; the internal trigger is only for situations with no cardiac output.",
    "Falling urine output with a balloon that has migrated distally suggests renal artery coverage.",
    "Blood in the gas line means rupture: stop, clamp, remove.",
    "Despite IABP-SHOCK II, the IABP remains a guideline-supported bridge for mechanical complications of MI.",
  ],
  refs: ["esc-acs-2023", "iabp-shock-ii-2012", "hanna-pcm"],
};

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------
export const acuteMcs: Track = {
  id: "acute-mcs",
  order: 7,
  title: "Acute Care & Mechanical Support",
  tagline: "STEMI, cardiac arrest, cardiogenic shock, IABP, Impella and ECMO",
  description:
    "From the STEMI call to the shocked patient on mechanical support: primary PCI systems and technique, NSTE-ACS timing, cardiac arrest in and out of the lab, cardiogenic shock phenotyping and management, and the practical running of IABP, microaxial flow pumps and VA-ECMO, finishing with RV support, bridging decisions and goals of care.",
  stage: 4,
  modules: [stemi, arrestNste, shock, iabp, impella, ecmo, rvBridges],
  cases: [caseStemiShock, caseEcmoDistension, caseIabpTiming],
};
