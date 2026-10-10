import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Module 1 — Principles
// ===========================================================================
const principles: Module = {
  id: "comp-principles",
  title: "Complication principles: prevent, recognise, treat",
  stage: 4,
  summary:
    "The mindset, taxonomy, team behaviours and equipment that turn a complication from a catastrophe into a managed event.",
  objectives: [
    "Apply the prevent → recognise early → treat decisively framework to any PCI complication.",
    "Classify complications as coronary, cardiac or other (non-cardiac) and name the first action for each.",
    "Lead a crisis with closed-loop communication, clear role allocation and early escalation.",
    "Locate and check the complications kit (protamine, covered stents, coils, snares, pericardiocentesis set) before you need it.",
    "Recognise the human-factors traps that make complications worse.",
  ],
  lessons: [
    {
      id: "comp-principles-doctrine",
      title: "The complication mindset",
      minutes: 7,
      refs: ["brilakis-manual-pci", "seattle-complications-2020", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Every operator who does enough PCI will have complications. What separates a good outcome from a bad one is rarely the complication itself; it is how early it was spotted, how prepared the team was, and how quickly the operator moved from surprise to a plan. The doctrine used throughout this track has three linked parts: prevent what you can, recognise early what you could not prevent, and treat decisively once recognised.",
        },
        {
          kind: "keypoints",
          title: "Four habits that underpin the doctrine",
          items: [
            "Be prepared: before every case ask what is most likely to go wrong with this patient and this lesion, and whether the bailout kit for that problem is in the room.",
            "Have a plan: for each likely complication, know your first move, your second move and your escape route (including surgery).",
            "Communicate: announce what you see and what you need, in plain words, and confirm the team heard you.",
            "Know your bailout: be able to perform the core rescue techniques (balloon tamponade, covered stent, coil, snare, pericardiocentesis) without having to think about how.",
          ],
        },
        { kind: "h", text: "Prevent, recognise, treat" },
        {
          kind: "table",
          caption: "The three phases of complication management",
          head: ["Phase", "What it means in practice", "Examples"],
          rows: [
            [
              "Prevent",
              "Choices made before and during the case that reduce the chance of harm",
              "Radial-first access; appropriate case selection and heart-team review; lesion preparation before stenting; balloon sizing 1:1 to the reference vessel; intravascular imaging; ACT checks every 30 minutes in long cases; meticulous flushing and de-airing",
            ],
            [
              "Recognise early",
              "Detecting the problem in seconds rather than minutes",
              "Watching the pressure trace for damping or ventricularisation; noticing new chest pain, ST change or hypotension; looking at the whole field (guide tip, wire tip, distal vessel) on every run; on-table echo for unexplained hypotension",
            ],
            [
              "Treat decisively",
              "A rehearsed first move that buys time, then a definitive fix",
              "Inflating a balloon over a perforation; rewiring and stenting an occlusive dissection; delivering vasodilator distally for no-reflow; draining tamponade",
            ],
          ],
        },
        { kind: "h", text: "A working taxonomy" },
        {
          kind: "p",
          text: "Grouping complications by where they arise makes it easier to run a mental checklist when a patient deteriorates. Coronary complications happen in the treated vessel; cardiac complications affect the heart as a whole; other (non-cardiac) complications involve the access site, the brain, the kidneys, the skin or the immune system.",
        },
        {
          kind: "table",
          caption: "Coronary, cardiac and other complications with the first action",
          head: ["Group", "Complication", "First action"],
          rows: [
            ["Coronary", "Acute vessel closure (dissection, thrombus, spasm, side-branch loss)", "Keep the wire in; identify the cause (nitrate, ACT, angiography in two views, imaging); restore flow"],
            ["Coronary", "Slow flow or no-reflow", "Exclude a mechanical cause, then deliver vasodilator distally via microcatheter"],
            ["Coronary", "Perforation", "Inflate a balloon at or just proximal to the leak; call for help; echo"],
            ["Coronary", "Equipment loss or entrapment", "Stop pulling; keep the wire; plan retrieval with snare or balloon"],
            ["Cardiac", "Tamponade", "Echo; pericardiocentesis; find and seal the source"],
            ["Cardiac", "Arrhythmia (VF, VT, bradycardia, heart block)", "Defibrillate or pace; correct the trigger (deep guide, contrast hang-up, ischaemia)"],
            ["Cardiac", "Hypotension or shock", "Look for perforation, tamponade, bleeding, ischaemia, vagal reaction, anaphylaxis"],
            ["Other", "Access-site bleeding, retroperitoneal haemorrhage", "Compress; stop or reverse anticoagulation as appropriate; image; endovascular or surgical repair"],
            ["Other", "Stroke", "Stop; examine; urgent brain imaging; stroke team"],
            ["Other", "Contrast reaction, contrast-associated AKI, radiation skin injury, cholesterol embolisation", "Treat per protocol; document; arrange follow-up"],
          ],
        },
        {
          kind: "pearl",
          text: "When a patient deteriorates during or after PCI, assume the procedure caused it until proven otherwise. Check, in order: the pressure trace, the angiogram of the treated and non-treated vessels with a wide field, the access site, and an echo. Most missed complications are found by looking where you did not want to look.",
        },
        {
          kind: "pitfalls",
          items: [
            "Fixating on finishing the stent while the patient becomes hypotensive.",
            "Accepting a damped or ventricularised trace and injecting anyway.",
            "Imaging only the stented segment and missing a distal wire perforation or guide-induced ostial dissection.",
            "Treating each warning sign as an isolated nuisance instead of asking what single problem explains them all.",
          ],
        },
      ],
    },
    {
      id: "comp-principles-team",
      title: "Leading the team in a crisis",
      minutes: 7,
      refs: ["seattle-complications-2020", "brilakis-manual-pci", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Complications are team events. The physiologist watching the trace, the nurse at the trolley, the radiographer and the anaesthetist all see things the operator cannot. A crisis is managed well when the operator turns those observers into a coordinated team, and badly when everyone works in parallel without a shared picture.",
        },
        {
          kind: "steps",
          title: "A crisis sequence you can rehearse",
          items: [
            { title: "Stop and stabilise", detail: "Stop advancing equipment. Keep the guidewire across the lesion; it is your lifeline. Apply the immediate temporising manoeuvre (balloon inflation, defibrillation, pacing)." },
            { title: "Declare the problem", detail: "Say it aloud in one sentence: 'We have an Ellis III perforation of the mid LAD; balloon is up.' Naming the problem converts individual worry into team focus." },
            { title: "Call for help early", detail: "Ask for a second operator, the anaesthetist, echo and, where relevant, the cardiac surgeon. Calling early costs nothing; calling late can cost the patient." },
            { title: "Assign roles by name", detail: "'Sarah, please get the echo machine. Tom, open a covered stent 3.0 by 16 and check it fits a 6 French guide. Priya, record the time and the blood pressure every two minutes.'" },
            { title: "Close every loop", detail: "Each instruction is repeated back and confirmed when done: 'Protamine 25 mg drawn up, not yet given.' 'Thank you, hold it.'" },
            { title: "Step back and reassess", detail: "Every few minutes summarise aloud: what happened, what has been done, what is next. Invite anyone who disagrees to say so." },
          ],
        },
        { kind: "h", text: "Closed-loop and situational callouts" },
        {
          kind: "table",
          caption: "Useful phrases in the lab",
          head: ["Situation", "Callout", "Why it matters"],
          rows: [
            ["Handing over equipment", "'I have the wire.' / 'Do you have the wire?'", "Prevents a wire being dropped or pulled back when two people are handling it"],
            ["Opening the haemostatic valve", "'Valve open wide.'", "The physiologist knows why the pressure trace has disappeared and will not chase a false hypotension"],
            ["Anticoagulation", "'Heparin given at 10:42; please remind me at 11:12 for ACT.'", "In long cases it is easy to lose track of time and of the ACT"],
            ["Drug orders", "'Adrenaline 100 micrograms intracoronary, please read back.'", "Prevents tenfold errors and wrong-route errors"],
            ["Escalation", "'I am concerned. The pressure has fallen by 30. Can we stop and look?'", "Graded assertiveness gives any team member a legitimate way to halt the case"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Name a scribe to record times, drugs and observations; this protects the patient and helps the debrief.",
            "Anyone in the room can call a pause. Make this explicit at the team brief.",
            "Ask an experienced colleague to come in early. There is no shame in phoning a friend; the outcome for the patient is what matters.",
            "After the event, run a short structured debrief: what went well, what did not, what will we change.",
          ],
        },
        {
          kind: "pearl",
          text: "In a crisis, slow your speech and lower your voice. The team copies the operator's tone. Calm, specific instructions are executed faster than urgent, vague ones.",
        },
        {
          kind: "pitfalls",
          items: [
            "Giving instructions to 'someone' rather than to a named person.",
            "Assuming a drug was given because it was asked for.",
            "Allowing several conversations at once; the operator loses the thread and the team loses the plan.",
            "Delaying a call to the surgeon because it feels like admitting failure.",
          ],
        },
      ],
    },
    {
      id: "comp-principles-kit",
      title: "The complications kit and human factors",
      minutes: 8,
      refs: ["brilakis-manual-pci", "seattle-complications-2020", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Rescue techniques fail when the equipment is missing, expired, incompatible with the guide in use, or locked in a cupboard nobody can find. Every lab should keep a dedicated complications trolley, and every operator should know exactly where it is and what is on it before they start operating independently.",
        },
        {
          kind: "table",
          caption: "Core complications kit",
          head: ["Item", "Used for", "Check in advance"],
          rows: [
            ["Protamine", "Reversal of unfractionated heparin in perforation or bleeding", "Location in the lab, and that it is drawn up only when the operator asks"],
            ["Covered stents (range of diameters and lengths)", "Sealing large-vessel perforation; some access-vessel perforations", "Which guide size each fits; older sandwich designs are bulkier than single-layer designs. Check the device's instructions for use"],
            ["Embolisation coils and a compatible microcatheter", "Sealing distal or collateral perforations", "Which coils pass through which microcatheter; not every microcatheter is suitable for coil delivery"],
            ["Snares (single-loop and multi-loop, several sizes)", "Retrieving lost stents, wire fragments, other foreign bodies", "Sizes stocked and the sheath or guide needed to withdraw them"],
            ["Pericardiocentesis set and echo machine", "Tamponade", "Needle, wire, pigtail drain and a drainage bag; echo available within minutes"],
            ["Temporary pacing wire and box", "Bradycardia, heart block", "Battery, connecting cable, a venous sheath size that fits"],
            ["Guide extension, aspiration catheter, microcatheters, extra guides and sheaths", "Second access, block-and-deliver, retrieval, no-reflow drug delivery", "Stock levels and sizes"],
            ["Drugs for no-reflow and resuscitation", "Adenosine, verapamil, nitroprusside, adrenaline, atropine, vasopressors, anaphylaxis drugs", "Local protocol for preparation and dilution"],
            ["Mechanical support and defibrillator", "Shock, VF, high-risk rescue", "How quickly an IABP or other device can be in the room"],
          ],
        },
        {
          kind: "pearl",
          text: "Rehearse the plan against the kit. If the case involves atherectomy in a calcified vessel, confirm before you start that a covered stent of the right size will pass through the guide you have chosen. If it will not, choose a larger guide or plan a second access route now, not in the middle of a perforation.",
        },
        { kind: "h", text: "Human factors" },
        {
          kind: "p",
          text: "Most serious complications involve a technical event amplified by a human one. Under stress, attention narrows (tunnel vision), people persist with a failing plan (fixation error), and junior staff stop speaking up (steep hierarchy). Fatigue late in a long list and pressure to finish ad hoc cases add to the load.",
        },
        {
          kind: "table",
          caption: "Common traps and countermeasures",
          head: ["Trap", "What it looks like", "Countermeasure"],
          rows: [
            ["Fixation error", "Repeated attempts to cross with the same wire while contrast and radiation climb", "Set stopping rules before the case; ask a colleague for a fresh view"],
            ["Task saturation", "Operator managing wires, drugs and haemodynamics alone", "Delegate drugs and monitoring by name; bring in a second operator"],
            ["Normalisation of deviance", "Routinely tolerating damped traces or skipped ACT checks because nothing went wrong last time", "Hold the standard every case; use checklists"],
            ["Hierarchy gradient", "Nurse notices falling blood pressure but waits to be asked", "Brief the team that anyone may call a pause; use graded assertiveness"],
            ["Plan continuation bias", "Pressing on with a complex result to avoid 'failing'", "Remember that stopping is a valid and often the safest outcome"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "A pre-case huddle covering the plan, the likely complication and its bailout takes under a minute.",
            "Taking ten seconds to think before acting often saves ten minutes of misdirected effort.",
            "Debrief after every significant complication; share the learning at morbidity and mortality meetings without blame.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-principles-1",
      stem: "During a straightforward RCA PCI the patient becomes hypotensive (BP 78/40 mmHg) and tachycardic. The stent result looks good on the working view. What should you do first?",
      options: [
        "Give a fluid bolus, finish the procedure and then reassess the patient on the ward",
        "Look for a procedural cause: trace, wide run with wire tip, access site, echo",
        "Give intracoronary nitrate for presumed spasm and repeat the run in the working view",
        "Remove all the equipment immediately and close the access site before anything else",
        "Start an IV vasopressor infusion and continue with the case as planned",
      ],
      answer: 1,
      explanation:
        "Unexplained hypotension during PCI should be assumed to be procedural until proven otherwise, so a systematic search for perforation, tamponade, bleeding, ischaemia or a reaction is the right first step. Fluids or vasopressors alone may be needed as support, but continuing without looking risks missing a distal wire perforation or tamponade. Nitrate would worsen hypotension.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-principles-2",
      stem: "Which of the following is best classified as a 'cardiac' rather than 'coronary' complication of PCI?",
      options: ["No-reflow", "Stent loss", "Pericardial tamponade", "Side-branch occlusion", "Guide-induced ostial dissection"],
      answer: 2,
      explanation:
        "Tamponade affects the heart as a whole and is managed with echo and pericardiocentesis, so it sits in the cardiac group even though its source is often a coronary perforation. No-reflow, stent loss, side-branch occlusion and guide dissection all arise within the treated coronary system and are classed as coronary complications.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "comp-q-principles-3",
      stem: "You ask for protamine during a perforation. Which response best reflects closed-loop communication?",
      options: [
        "The nurse nods and walks to the drug cupboard",
        "'Protamine 25 mg drawn up, ready, not yet given.' The operator replies, 'Thank you, hold it until I ask.'",
        "Two nurses both prepare protamine to save time",
        "The physiologist records that protamine was requested",
        "The operator repeats the request louder after a minute",
      ],
      answer: 1,
      explanation:
        "Closed-loop communication means the instruction is acknowledged, the action and its status are reported back, and the sender confirms. A nod gives no information about dose, status or timing. Duplicate preparation risks a double dose and is a symptom of an unassigned task, not a closed loop.",
      difficulty: 1,
      refs: ["seattle-complications-2020"],
    },
    {
      id: "comp-q-principles-4",
      stem: "You plan rotational atherectomy of a heavily calcified mid LAD through a 6 Fr guide. The lab stocks a sandwich-design covered stent that requires a larger guide. What is the best preparation?",
      options: [
        "Proceed with the 6 Fr guide; a covered stent is rarely needed in rotational atherectomy",
        "Choose a guide that takes the covered stent, or plan a second access for a second guide",
        "Ask the lab to order a smaller covered stent from the supplier if a perforation occurs",
        "Use a larger burr so that the atherectomy is finished faster and with fewer runs",
        "Give protamine prophylactically at the end of the case to seal any small leak",
      ],
      answer: 1,
      explanation:
        "Preparation means matching the bailout kit to the case before you start. If the covered stent available will not fit the planned guide, either upsize the guide or plan a second access for a block-and-deliver approach. Waiting until a perforation occurs wastes the minutes that decide outcome; a larger burr increases perforation risk.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "seattle-complications-2020"],
    },
    {
      id: "comp-q-principles-5",
      stem: "Thirty minutes into repeated unsuccessful attempts to cross a lesion with the same wire, the contrast volume is high and the operator insists 'one more try'. Which human-factors trap is most evident?",
      options: ["Hierarchy gradient", "Fixation error", "Normalisation of deviance", "Confirmation of capture", "Automation bias"],
      answer: 1,
      explanation:
        "Persisting with a failing approach despite mounting cost is fixation error; the countermeasure is predefined stopping rules and asking a colleague for a fresh perspective. A hierarchy gradient describes others not speaking up, which may coexist, but the defining behaviour here is the operator's fixation on one plan.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "comp-q-principles-6",
      stem: "In a complication, which first move best fits the principle of 'treat decisively'?",
      options: [
        "Remove the guidewire so that the vessel can be reassessed cleanly",
        "A rehearsed temporising move, such as balloon tamponade, while help is called",
        "Wait for the cardiac surgeon to arrive and examine the films before acting",
        "Take further angiographic runs in several views until the diagnosis is certain",
        "Reverse all anticoagulation immediately with full-dose protamine",
      ],
      answer: 1,
      explanation:
        "Decisive treatment starts with a temporising move that stops the deterioration and buys time for definitive therapy. Removing the wire throws away access to the vessel, and waiting or taking repeated runs lets the problem progress. Immediate full reversal of anticoagulation can cause thrombosis of the vessel and equipment and is not the universal first step.",
      difficulty: 1,
      refs: ["seattle-complications-2020"],
    },
    {
      id: "comp-q-principles-7",
      stem: "Which practice most directly reduces the risk of losing track of anticoagulation in a long complex PCI?",
      options: [
        "Giving a double heparin dose at the start so that levels stay therapeutic for longer",
        "A team member sets a timer after heparin and prompts an ACT check every 30 minutes",
        "Switching to bivalirudin in every complex case so that no ACT checks are needed",
        "Checking the ACT only if thrombus is seen on the guide or on the angiogram",
        "Relying on the operator to remember when the last bolus was given",
      ],
      answer: 1,
      explanation:
        "A delegated timer with a regular ACT check is a simple system fix that does not depend on the operator's memory during a demanding case. Checking only when thrombus is seen is reactive, and a double initial dose increases bleeding risk without guaranteeing therapeutic levels later.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
  ],
};

// ===========================================================================
// Module 2 — Perforation
// ===========================================================================
const perforation: Module = {
  id: "comp-perforation",
  title: "Coronary perforation",
  stage: 4,
  summary:
    "Classifying perforation, the first two minutes, sealing large-vessel tears with covered stents, and closing distal and collateral leaks.",
  objectives: [
    "Classify a perforation using the Ellis scheme, including cavity spilling, and by location (large vessel, distal, collateral).",
    "Perform the immediate sequence: balloon tamponade, call for help, echo, pericardiocentesis if needed.",
    "Explain when and how to reverse heparin, and the caveats.",
    "Describe covered-stent delivery including the dual-guide block-and-deliver technique.",
    "Choose between coils, fat, thrombin and other options for distal and collateral perforation, and recognise the special risks after CABG.",
  ],
  lessons: [
    {
      id: "comp-perf-classification",
      title: "Classification and mechanisms",
      minutes: 7,
      refs: ["ellis-1994", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "A coronary perforation is a breach of the full thickness of the arterial wall, allowing contrast and blood to escape into the myocardium, the pericardium or a cardiac chamber. It is uncommon in routine PCI but more frequent with complex work: calcified vessels, atherectomy, chronic total occlusions and aggressive post-dilatation. Because a large leak can produce tamponade within minutes, recognising the grade instantly decides how fast you must act.",
        },
        { kind: "figure", id: "ellis", caption: "Ellis classification of coronary perforation: crater (I), blush (II), frank streaming (III) and cavity spilling." },
        {
          kind: "table",
          caption: "Ellis classification (paraphrased)",
          head: ["Type", "Angiographic appearance", "Typical course"],
          rows: [
            ["I", "A crater or ulcer extending beyond the lumen, without contrast leaking out", "Often benign; watch closely, avoid further high-pressure inflation there"],
            ["II", "Contrast blush into the myocardium or pericardium, without a jet; small exit point", "May seal with prolonged balloon inflation; can progress, so monitor with echo"],
            ["III", "Frank streaming or jet of contrast through a larger exit hole (about 1 mm or more)", "High risk of rapid tamponade, emergency surgery and death; needs immediate tamponade with a balloon and usually a covered stent"],
            ["Cavity spilling", "Contrast passing into a chamber (for example the left ventricle) or the coronary sinus rather than the pericardium", "Usually does not cause tamponade; many are managed conservatively, but large fistulous leaks may still need sealing"],
          ],
        },
        { kind: "h", text: "Location matters as much as grade" },
        {
          kind: "table",
          caption: "Perforation by location",
          head: ["Location", "Usual mechanism", "Usual definitive treatment"],
          rows: [
            ["Large (main) vessel", "Oversized balloon or stent, high-pressure post-dilatation, atherectomy, cutting or scoring balloon, balloon rupture", "Covered stent"],
            ["Distal vessel (wire exit)", "Stiff or polymer-jacketed wire migrating into a small distal branch", "Prolonged balloon occlusion, then coils, autologous fat, thrombin or similar"],
            ["Collateral (CTO)", "Wire or microcatheter crossing a septal or epicardial collateral", "Septal: usually observe. Epicardial: coil, often from both sides"],
          ],
        },
        {
          kind: "keypoints",
          title: "Risk factors to recognise before you start",
          items: [
            "Patient: older age, female sex, prior CABG (different consequences, discussed later).",
            "Lesion: heavy calcification, tortuosity, chronic total occlusion, small or diffusely diseased vessels.",
            "Technique: balloon or stent to artery ratio above about 1.1 to 1.2; high-pressure post-dilatation with a non-compliant balloon outside the stent; atherectomy, particularly on a bend with wire bias; hydrophilic or stiff wires left distally without attention.",
          ],
        },
        {
          kind: "pearl",
          text: "Watch the distal wire tip every time you advance a balloon or stent. Forward wire migration into a tiny branch is the classic cause of the delayed tamponade that presents on the ward hours later, when the cause is no longer on screen.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling a contrast stain 'just a dissection' without checking whether it persists outside the vessel and spreads after the injection clears.",
            "Repeating the same high-pressure inflation that caused an Ellis I crater.",
            "Imaging only the working view: a distal exit can be invisible in the projection used for stenting.",
          ],
        },
        { kind: "sim", sim: "pci-bench", task: "Size a non-compliant balloon for post-dilatation of a stent in a 3.0 mm vessel. Choose a diameter and pressure that expand the stent fully while keeping the balloon-to-artery ratio close to 1:1 and the balloon inside the stent edges." },
      ],
    },
    {
      id: "comp-perf-immediate",
      title: "The first minutes: tamponade, echo and anticoagulation",
      minutes: 8,
      refs: ["seattle-complications-2020", "supplied-medmastery", "brilakis-manual-pci", "esc-pericardial-2015"],
      blocks: [
        {
          kind: "p",
          text: "The aim of the first minute is to stop the bleeding mechanically. Everything else (echo, drainage, covered stent, reversal) follows once the leak is controlled by a balloon.",
        },
        {
          kind: "steps",
          title: "Immediate sequence for a significant perforation",
          items: [
            { title: "Inflate a balloon", detail: "Inflate a balloon at, or just proximal to, the perforation at low pressure, enough to stop flow. The balloon already in the vessel, sized about 1:1, is usually quickest. Confirm with a gentle injection that the leak has stopped." },
            { title: "Declare and call for help", detail: "Announce the perforation and its grade. Call a second operator and ask for echo. Alert the cardiac surgeon early if the leak is large." },
            { title: "Echo", detail: "Look for a pericardial effusion and signs of tamponade (right atrial and right ventricular diastolic collapse, a plethoric IVC). A baseline echo also shows whether the effusion is growing." },
            { title: "Drain if needed", detail: "If the patient is hypotensive with an effusion, perform pericardiocentesis while the balloon stays inflated. Keep the drain in; it doubles as a monitor of ongoing bleeding." },
            { title: "Support the circulation", detail: "IV fluid to maintain right-sided filling; vasopressors as required; consider autotransfusion of drained pericardial blood through a venous sheath if bleeding is brisk and local practice allows." },
            { title: "Plan the definitive fix", detail: "Large vessel: covered stent. Distal or collateral: embolisation. If percutaneous options fail, surgery." },
          ],
        },
        {
          kind: "pearl",
          text: "Hypotension that starts minutes or hours after a 'clean' case is a perforation until proven otherwise. Get an echo at once. If the patient is too unstable to wait, drain immediately; in the lab this can often be done under X-ray guidance, because leaked contrast outlines the pericardial sac (Brilakis 26.2).",
        },
        { kind: "h", text: "Recognising tamponade" },
        {
          kind: "list",
          items: [
            "Falling arterial pressure with a rising heart rate (vagal bradycardia can occur).",
            "Rising right atrial pressure and equalisation of diastolic pressures if a right heart catheter is in place.",
            "Pulsus paradoxus on the arterial trace.",
            "Fluoroscopy: reduced excursion of the cardiac border, sometimes a contrast halo in the pericardium.",
            "Echo: effusion with chamber collapse; the definitive bedside test.",
          ],
        },
        { kind: "h", text: "Reversing anticoagulation: when and with what caveats" },
        {
          kind: "p",
          text: "Heparin reversal with protamine can help a small leak seal, but it is not automatic. Approximately 1 mg of protamine neutralises 100 units of heparin; the amount needed falls as heparin is metabolised, so titrate to the ACT and follow local protocol. Give it slowly.",
        },
        {
          kind: "table",
          caption: "Anticoagulant reversal in perforation",
          head: ["Agent", "Reversal", "Caveats"],
          rows: [
            ["Unfractionated heparin", "Protamine, titrated to ACT", "Hypotension and anaphylactoid reactions, especially with prior protamine-containing insulin or previous exposure. Risk of thrombosis of the guide, of stagnant equipment and of the treated vessel"],
            ["Bivalirudin", "No specific antidote", "Stop the infusion; short half-life (around 25 minutes with normal renal function), longer in renal impairment"],
            ["Glycoprotein IIb/IIIa inhibitors", "Stop the infusion", "Platelet transfusion has a role mainly for agents with prolonged platelet binding"],
          ],
        },
        {
          kind: "pitfalls",
          title: "Protamine traps",
          items: [
            "Reversing heparin while a retrograde CTO system sits in a donor vessel or collateral: the donor vessel can thrombose, converting a perforation into a large infarct. Remove equipment first.",
            "Reversing before a covered stent has been delivered in a large-vessel tear: the guide and wires are still in the coronary and can thrombose.",
            "Giving protamine for a large-vessel perforation that has already been sealed by a covered stent: often unnecessary, and the new stent becomes a thrombosis risk.",
            "Assuming protamine alone will seal an Ellis III leak. It will not; the mechanical fix is what matters.",
          ],
        },
        { kind: "sim", sim: "pericardiocentesis", task: "Drain an acute haemopericardium in the lab: confirm the effusion on echo, perform a subxiphoid puncture with fluoroscopic confirmation, place a pigtail drain and track the blood pressure as the effusion is aspirated." },
      ],
    },
    {
      id: "comp-perf-large-vessel",
      title: "Large-vessel perforation: covered stents and block-and-deliver",
      minutes: 7,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "seattle-complications-2020"],
      blocks: [
        {
          kind: "p",
          text: "A perforation of a main epicardial vessel usually needs a covered stent: a stent carrying a membrane that seals the hole. Prolonged balloon inflation alone seals some smaller tears (particularly Ellis I or II), so keep a semi-compliant balloon the size of the vessel inflated at low pressure (no more than 8–10 atm) for at least 10–15 minutes (Brilakis 26.2) while the stent is prepared, provided the patient tolerates the ischaemia.",
        },
        {
          kind: "table",
          caption: "Covered stent design (general principles; check the device's instructions for use)",
          head: ["Design", "Construction", "Practical implication"],
          rows: [
            ["Sandwich", "A membrane held between two metal stent layers", "Bulky; poorer deliverability; may need a larger guide"],
            ["Single layer", "A single stent with a thin membrane on its outer surface", "More deliverable; often compatible with smaller guides"],
          ],
        },
        {
          kind: "keypoints",
          title: "Covered stent essentials",
          items: [
            "Covered stents jail and usually occlude side branches; accept this when the alternative is tamponade.",
            "They are less flexible and harder to deliver, so a guide extension or extra support may be needed.",
            "Expand them well (consider intravascular imaging once stable): covered stents carry a higher risk of thrombosis and restenosis than conventional stents.",
            "Leave the covered stent on the trolley until the balloon is controlling the leak; then prepare it while you plan delivery.",
          ],
        },
        { kind: "h", text: "Delivering through a single guide" },
        {
          kind: "p",
          text: "If the guide is large enough to accommodate the tamponading balloon and the covered stent side by side, a second wire can be passed alongside the inflated balloon, brief deflation allowing it past the tear. The covered stent is then loaded on the second wire, the balloon deflated and withdrawn, and the covered stent advanced and deployed as quickly as possible.",
        },
        { kind: "h", text: "The dual-guide block-and-deliver technique" },
        {
          kind: "steps",
          title: "When the guide is too small for both devices",
          items: [
            { title: "Second arterial access", detail: "Obtain another arterial access (contralateral radial or a femoral) and engage the same coronary ostium with a second guide. The first guide is slightly disengaged to make room, while its balloon stays inflated at the perforation." },
            { title: "Pass the second wire", detail: "Advance a wire through the second guide to the tamponading balloon. Deflate the balloon briefly, advance the wire past it and the tear, then reinflate immediately." },
            { title: "Bring up the covered stent", detail: "Advance the covered stent on the second wire to just proximal to the inflated balloon." },
            { title: "Swap", detail: "On a clear count, deflate and pull back the tamponading balloon, advance the covered stent across the tear and deploy it at once. The time the vessel bleeds is reduced to seconds." },
            { title: "Check the seal", detail: "Inject; if a leak persists, post-dilate with a non-compliant balloon or add a second covered stent. Recheck the pericardial drain output and the echo." },
          ],
        },
        {
          kind: "pearl",
          text: "Sometimes called the ping-pong technique, block-and-deliver is the reason a second access site is worth preparing in any high-risk calcified or atherectomy case.",
        },
        {
          kind: "pitfalls",
          items: [
            "Deflating the tamponading balloon to 'have a look' before the covered stent is ready.",
            "Undersizing the covered stent; an incompletely apposed membrane may continue to leak.",
            "Forgetting dual antiplatelet therapy planning: covered stents need full DAPT and careful follow-up.",
          ],
        },
      ],
    },
    {
      id: "comp-perf-distal-collateral",
      title: "Distal, collateral and post-CABG perforation",
      minutes: 8,
      refs: ["brilakis-manual-pci", "brilakis-manual-cto", "cto-consensus-2019", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Distal perforations are usually wire-related. The leak is small but persistent, and because the vessel is tiny a covered stent is not an option. The aim is to occlude the bleeding branch, accepting the loss of a small territory of myocardium.",
        },
        {
          kind: "table",
          caption: "Options for sealing distal and small-branch perforations",
          head: ["Option", "How it works", "Points to watch"],
          rows: [
            ["Prolonged balloon occlusion", "Small balloon inflated proximal to the exit to stop inflow and allow clotting", "First step; may suffice for small leaks"],
            ["Microcatheter suction", "Aspirating through a microcatheter advanced to the exit point to collapse the small branch", "Described as a simple early option; success is variable"],
            ["Coils", "Metal coils delivered through a microcatheter to plug the branch permanently", "Check coil-microcatheter compatibility; pushable and detachable types exist"],
            ["Autologous fat", "Small pieces of the patient's subcutaneous fat injected through a microcatheter", "Cheap and always available; harvest under sterile conditions"],
            ["Thrombin", "Small volume of diluted thrombin injected through a microcatheter wedged distally", "Risk of reflux causing thrombosis of the proximal vessel; use with the microcatheter wedged"],
            ["Other materials", "Clotted autologous blood, gelatin sponge particles and similar", "Depends on local availability and experience"],
          ],
        },
        {
          kind: "pearl",
          text: "Keep the tamponading balloon inflated proximally while the microcatheter is positioned beyond it using a second guide or wire if necessary, so that the vessel does not bleed while you work.",
        },
        { kind: "h", text: "Collateral perforation in CTO PCI" },
        {
          kind: "list",
          items: [
            "Septal collateral perforation usually causes a contained stain or a septal haematoma and rarely tamponade. It is usually observed; rarely, a large septal haematoma compresses the ventricles.",
            "Epicardial collateral perforation is dangerous: it bleeds straight into the pericardium and it is fed from both ends (donor and recipient vessels). Sealing usually needs coils or other embolisation from both sides.",
            "Do not reverse heparin while retrograde equipment remains in the donor vessel or collateral.",
          ],
        },
        { kind: "h", text: "Perforation after prior CABG" },
        {
          kind: "p",
          text: "It was once assumed that patients with prior bypass surgery were 'protected' from tamponade because the pericardium is scarred. This is wrong. Bleeding can collect in a loculated pocket, often posteriorly, compressing a single chamber such as the left or right atrium. Echo may underestimate it, standard subxiphoid drainage may not reach it, and haemodynamic collapse can be abrupt.",
        },
        {
          kind: "keypoints",
          items: [
            "Seal the leak early and completely; you may not be able to drain the effusion.",
            "Use echo from several windows and consider CT if the haemodynamics do not fit the echo.",
            "Involve the cardiac surgeon early; surgical or image-guided drainage may be needed.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving a stiff or polymer-jacketed wire unattended in a small distal branch.",
            "Treating a distal perforation by sealing only one end of an epicardial collateral.",
            "Discharging a patient after a 'small' Ellis II leak without a follow-up echo.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-perf-1",
      stem: "After post-dilatation of a mid-LAD stent, an injection shows a jet of contrast streaming from the vessel into the pericardial space through a visible exit. How is this classified?",
      options: ["Ellis type I", "Ellis type II", "Ellis type III", "Ellis cavity spilling", "NHLBI type C dissection"],
      answer: 2,
      explanation:
        "Frank streaming through a sizeable exit hole is Ellis type III, the grade with the highest risk of tamponade and death. Type II shows a blush into the myocardium or pericardium without a jet. An NHLBI type C dissection is an extraluminal cap of persisting contrast without free extravasation into the pericardium.",
      difficulty: 1,
      refs: ["ellis-1994", "supplied-medmastery"],
    },
    {
      id: "comp-q-perf-2",
      stem: "A perforation drains contrast into the left ventricular cavity rather than the pericardium. Which statement is most accurate?",
      options: [
        "It always requires a covered stent to seal the communication",
        "It is classed as cavity spilling and often does not cause tamponade",
        "It is an Ellis type I perforation, an extraluminal crater without extravasation",
        "Immediate pericardiocentesis is mandatory before any further treatment",
        "Protamine is contraindicated because blood is returning to the circulation",
      ],
      answer: 1,
      explanation:
        "Perforation into a cardiac chamber or the coronary sinus is cavity spilling. Because blood returns into the circulation rather than the pericardium, tamponade is uncommon and many are observed. A covered stent may be needed if the leak is large, but it is not automatic; pericardiocentesis is only needed if an effusion and tamponade develop.",
      difficulty: 2,
      refs: ["ellis-1994", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-perf-3",
      stem: "An Ellis III perforation occurs in a proximal RCA. What is the single best immediate action?",
      options: [
        "Give protamine",
        "Inflate a balloon at or just proximal to the perforation to stop the leak",
        "Perform pericardiocentesis",
        "Withdraw the wire to prevent further injury",
        "Request an emergency CT",
      ],
      answer: 1,
      explanation:
        "Mechanical control of the leak with a balloon is the first and most effective step; it buys time for echo, drainage and a covered stent. Protamine alone will not seal an Ellis III leak and may cause thrombosis of in-situ equipment. Withdrawing the wire loses the route for the balloon and covered stent.",
      difficulty: 1,
      refs: ["seattle-complications-2020", "supplied-medmastery"],
    },
    {
      id: "comp-q-perf-4",
      stem: "During a retrograde CTO procedure an epicardial collateral perforates. The retrograde microcatheter is still in the collateral and the donor LAD is wired. Which action is most likely to cause harm?",
      options: [
        "Echo straight away to look for a pericardial effusion",
        "Coil embolisation of the collateral from both ends of the channel",
        "Full protamine reversal with the retrograde kit in place",
        "Preparing a pericardiocentesis set and calling for it to be opened",
        "Calling a second operator to help manage the leak",
      ],
      answer: 2,
      explanation:
        "Reversing heparin while equipment occupies the donor vessel and collateral risks thrombosis of the donor vessel, which may cause a large infarct. Equipment should be removed first, and reversal considered afterwards. Coil embolisation (often from both sides) is an appropriate way to seal an epicardial collateral.",
      difficulty: 3,
      refs: ["brilakis-manual-cto", "cto-consensus-2019"],
    },
    {
      id: "comp-q-perf-5",
      stem: "Why is an epicardial collateral perforation often sealed from both ends?",
      options: [
        "Coils are only effective in pairs, one from each guide catheter",
        "Donor and recipient both feed a collateral, so one end keeps bleeding",
        "To prevent a septal haematoma spreading into the ventricular septum",
        "To allow protamine to be avoided while the donor vessel is still wired",
        "Because covered stents cannot be used in vessels as small as collaterals",
      ],
      answer: 1,
      explanation:
        "A collateral connects two arterial systems, so blood reaches the tear from both directions. Occluding only the donor side leaves retrograde filling from the recipient side. The fact that covered stents cannot be used in small collaterals is true but does not explain the need for two-sided occlusion.",
      difficulty: 2,
      refs: ["brilakis-manual-cto"],
    },
    {
      id: "comp-q-perf-6",
      stem: "A large-vessel perforation is controlled with a balloon in a 6 Fr guide. The available covered stent needs more space than the guide allows alongside the balloon. What technique allows delivery with minimal bleeding time?",
      options: [
        "Deflate the balloon, withdraw it, then advance the covered stent through the same guide",
        "Dual-guide block-and-deliver: second access, second guide, wire passed during brief deflation, then swap balloon for covered stent",
        "Coil embolisation of the main vessel",
        "Fat embolisation through the balloon lumen",
        "Leave the balloon inflated for an hour",
      ],
      answer: 1,
      explanation:
        "Block-and-deliver keeps the vessel occluded while a second guide brings the covered stent to the tear, so the vessel bleeds only for the seconds of the swap. Deflating and withdrawing first allows uncontrolled bleeding during the whole delivery. Coiling a main vessel would sacrifice a large territory and is not the treatment for a large-vessel tear.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-perf-7",
      stem: "A patient with prior CABG suffers a distal wire perforation. Which statement is correct?",
      options: [
        "Prior sternotomy prevents haemodynamic compromise from pericardial bleeding",
        "Blood may loculate over one chamber, beyond reach of a standard drain",
        "Echo reliably excludes all clinically important effusions after CABG",
        "Protamine is contraindicated after CABG because it causes graft thrombosis",
        "Covered stents are first-line for distal wire perforation after CABG",
      ],
      answer: 1,
      explanation:
        "After CABG, adhesions can confine blood to a pocket that compresses one chamber, causing localised tamponade that echo may underestimate and subxiphoid drainage may not reach. The belief that these patients are protected is a dangerous myth. Covered stents are not used for distal wire exits; embolisation is.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "comp-q-perf-8",
      stem: "A patient on bivalirudin has a distal perforation that continues to leak after balloon occlusion. What is true about reversal?",
      options: [
        "Give protamine at the standard heparin-reversal dose",
        "No specific antidote: stop it and seal the leak mechanically",
        "Give vitamin K intravenously to restore clotting factors",
        "Give a platelet transfusion as the first-line reversal of its effect",
        "Double the infusion rate to stabilise the clot that is forming over the perforation",
      ],
      answer: 1,
      explanation:
        "Bivalirudin has no specific reversal agent but a short half-life with normal renal function, so stopping it and sealing the leak mechanically is the approach. Protamine reverses heparin, not bivalirudin. Vitamin K reverses warfarin and is irrelevant in the lab.",
      difficulty: 2,
      refs: ["seattle-complications-2020"],
    },
  ],
  sims: [
    { sim: "pericardiocentesis", task: "Manage acute haemopericardium after an Ellis III perforation: confirm on echo, drain via the subxiphoid route under fluoroscopy, and leave a pigtail drain to monitor ongoing bleeding." },
    { sim: "pci-bench", task: "Post-dilate an underexpanded stent with a non-compliant balloon sized 1:1 to the vessel, avoiding inflation of the balloon beyond the stent edges." },
  ],
  caseIds: ["comp-case-ellis3-perforation"],
};

// ===========================================================================
// Module 3 — Dissection, abrupt closure and flow problems
// ===========================================================================
const dissectionFlow: Module = {
  id: "comp-dissection-flow",
  title: "Dissection, abrupt closure and flow problems",
  stage: 4,
  summary:
    "NHLBI dissection types, guide-induced ostial and aortic dissection, side-branch loss, slow flow and no-reflow, air embolism and intraprocedural thrombosis.",
  objectives: [
    "Grade a coronary dissection using NHLBI types A to F and decide which need stenting.",
    "Work through the differential of abrupt vessel closure while protecting wire position.",
    "Manage guide-induced ostial dissection, including extension into the aortic root.",
    "Recognise and treat slow flow and no-reflow with distal drug delivery and appropriate agents.",
    "Prevent and treat coronary air embolism and intraprocedural thrombosis.",
  ],
  lessons: [
    {
      id: "comp-dissection-nhlbi",
      title: "Coronary dissection and abrupt closure",
      minutes: 8,
      refs: ["nhlbi-dissection-1991", "supplied-medmastery", "brilakis-manual-pci", "seattle-complications-2020"],
      blocks: [
        {
          kind: "p",
          text: "A dissection is a tear in the intima that lets blood track into the vessel wall. Some degree of dissection is expected after balloon dilatation, especially of calcified or fibrotic plaque, and most small ones are covered by the stent. The danger is propagation: blood enters a false lumen, an intramural haematoma expands and compresses the true lumen, and the vessel closes abruptly.",
        },
        { kind: "figure", id: "nhlbi-dissection", caption: "NHLBI dissection types A to F, from minor intraluminal lucency to total occlusion." },
        {
          kind: "table",
          caption: "NHLBI classification (paraphrased) and practical response",
          head: ["Type", "Appearance", "Practical response"],
          rows: [
            ["A", "Small radiolucent area in the lumen; no contrast persists once the dye clears (Brilakis Fig. 6.5; the Oxford handbook words types A and B differently)", "Usually covered by the planned stent; otherwise observe"],
            ["B", "Parallel channels or double lumen separated by a lucent line; no persistence of dye (Brilakis Fig. 6.5)", "Usually stented if in the treated segment"],
            ["C", "Contrast outside the lumen (an extraluminal cap) that persists after the injection clears", "Stent; higher risk of closure"],
            ["D", "Spiral (barber's pole) filling defects, often with staining of the false lumen", "Stent the full length; high risk of closure"],
            ["E", "New persistent filling defect in the lumen", "Stent; consider thrombus as well; imaging helps"],
            ["F", "Total occlusion without distal antegrade flow", "Emergency: restore flow, usually with stenting"],
          ],
        },
        {
          kind: "pearl",
          text: "Do not lose the wire. While a wire lies in the true lumen beyond a dissection, you can almost always restore flow with balloons and stents. Once it is pulled back, rewiring may enter the false lumen, extend the dissection and leave the vessel occluded.",
        },
        { kind: "h", text: "Abrupt closure: think before you stent" },
        {
          kind: "table",
          caption: "Differential of sudden loss of flow during PCI",
          head: ["Cause", "Clues", "Fix"],
          rows: [
            ["Dissection", "Flap, double lumen, staining, spiral defect", "Low-pressure prolonged inflation to tack the flap, then stent; imaging to confirm true-lumen wire"],
            ["Thrombus", "Hazy or rounded filling defect; check the ACT", "More heparin if ACT low; aspiration; glycoprotein IIb/IIIa inhibitor or cangrelor; treat the trigger"],
            ["Spasm", "Smooth tapering, often near guide tip or wire", "Intracoronary nitrate; pull the guide back"],
            ["Pseudolesion", "Concertina folds in a tortuous vessel straightened by a stiff wire", "Withdraw the stiff part of the wire or change to a softer wire; folds disappear"],
            ["Slow flow or no-reflow", "Vessel open to the end of the stent but contrast stagnates distally", "Vasodilators delivered distally (see later lesson)"],
            ["Side-branch occlusion", "Branch lost after main-vessel stent", "Rewire and balloon the branch if large"],
            ["Air", "Sudden occlusion after injection; bubble may be visible", "Oxygen, aspiration, forceful flush, supportive care"],
            ["Guide-induced", "Damped trace; ostial staining", "Disengage; treat ostial dissection"],
          ],
        },
        {
          kind: "steps",
          title: "Managing an occlusive dissection",
          items: [
            { title: "Keep the wire", detail: "Fix the wire; avoid any manoeuvre that pulls it back." },
            { title: "Protect the patient", detail: "Analgesia, atropine or pacing for bradycardia, vasopressor support for hypotension." },
            { title: "Tack the flap", detail: "Inflate a balloon at low pressure for longer than usual over the dissection to press the flap back and stop further blood entering the false lumen." },
            { title: "Confirm the wire is in the true lumen", detail: "Intravascular ultrasound is ideal because it does not need contrast injection, which can extend the dissection." },
            { title: "Stent", detail: "Cover the entry point and the full length of the dissection, usually working distal to proximal so that blood in the false lumen is not pushed further downstream." },
            { title: "If the wire is lost", detail: "Rewire gently with a soft wire, confirm the true lumen distally with IVUS, an injection into a collateral donor vessel, or by advancing a workhorse wire through a microcatheter and feeling for resistance (it runs freely in the true lumen). Avoid microcatheter tip injections: if the wire is subintimal they enlarge the false space and make re-entry harder. An experienced CTO operator may use re-entry techniques. Consider mechanical support or surgery if a large territory is ischaemic and flow cannot be restored." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Repeated forceful contrast injections into a dissected vessel, pressurising the false lumen.",
            "Stenting only the proximal entry and leaving a long distal spiral dissection uncovered.",
            "Assuming every occlusion is a dissection without checking the ACT.",
          ],
        },
      ],
    },
    {
      id: "comp-dissection-ostial-sidebranch",
      title: "Guide-induced ostial dissection and side-branch loss",
      minutes: 7,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "supplied-oxford", "dunning-aortocoronary-dissection-2000"],
      blocks: [
        {
          kind: "p",
          text: "Guide catheters can dissect the ostium of the vessel they are seated in. The risk rises with deep or non-coaxial engagement, aggressive guide shapes, large or stiff catheters, sheathless systems, forceful injection against a damped trace, and abnormal or diseased ostia. A left main dissection is immediately life-threatening; an RCA ostial dissection is more likely to extend retrogradely into the aortic root.",
        },
        {
          kind: "keypoints",
          title: "Prevention",
          items: [
            "Watch the pressure trace on every engagement. A damped or ventricularised trace means stop, withdraw slightly and reassess before injecting.",
            "Aim for coaxial engagement; avoid pushing the guide deep without a wire in the vessel.",
            "Look at the ostium at the start and end of the case with the guide disengaged.",
          ],
        },
        {
          kind: "steps",
          title: "Managing an ostial dissection",
          items: [
            { title: "Stop injecting", detail: "Each injection can extend the dissection along the vessel and into the aorta." },
            { title: "Secure true-lumen wire position", detail: "If a wire is already down the vessel, keep it. If not, wire gently with a soft wire; confirm the true lumen with imaging if available." },
            { title: "Stent the ostium", detail: "Seal the entry point with a stent placed precisely at the ostium, with slight protrusion into the aorta for an aorto-ostial RCA lesion so that the entry is covered." },
            { title: "Assess the aorta", detail: "Echo for pericardial effusion and aortic regurgitation; CT aortography if the stain extends up the ascending aorta." },
            { title: "Decide on surgery", detail: "Dissections confined to the coronary sinus usually heal once the coronary entry is sealed. Extension well up the ascending aorta (some classifications use roughly 4 cm as the threshold) or haemodynamic compromise needs cardiothoracic input." },
          ],
        },
        {
          kind: "pearl",
          text: "With a left main dissection, speed matters more than elegance. Wire the LAD (and the circumflex if it is threatened), and stent from the LM into the most important branch while calling for help, mechanical support and surgical backup.",
        },
        { kind: "h", text: "Side-branch occlusion" },
        {
          kind: "p",
          text: "When a main-vessel stent crosses a branch, plaque or the carina can shift and close the branch. The patient usually becomes symptomatic if the branch supplies viable myocardium: chest pain, ST elevation, ventricular arrhythmia or haemodynamic compromise in patients with poor ventricular function.",
        },
        {
          kind: "table",
          caption: "Side-branch protection and rescue",
          head: ["Step", "Action"],
          rows: [
            ["Before stenting", "Decide whether the branch matters (size, territory). If yes, leave a jailed wire in it; it maintains access and marks the ostium."],
            ["If the branch closes", "Analgesia; monitor rhythm and blood pressure; rewire through the stent struts (the jailed wire guides you)."],
            ["Reopen", "Balloon the branch ostium, then a kissing inflation or proximal optimisation as appropriate; stent the branch if the result remains poor."],
            ["If rewiring fails", "Consider the jailed-wire balloon technique or accept loss if the branch is small; involve an experienced bifurcation operator for large branches."],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting the jailed wire in place with a high-pressure post-dilatation and then struggling to remove it. Remove a jailed wire with gentle, constant traction, never a hard pull; before jailing, make sure the tip is straight, keep the radiopaque segment out of the stent and jail only a short length. Whether polymer-jacketed wires should be jailed is debated, because the jacket may strip on withdrawal.",
            "Assuming a lost diagonal is 'small' without checking the territory it supplies.",
          ],
        },
      ],
    },
    {
      id: "comp-noreflow",
      title: "Slow flow and no-reflow",
      minutes: 8,
      refs: ["supplied-medmastery", "seattle-complications-2020", "brilakis-manual-pci", "timi-1985"],
      blocks: [
        {
          kind: "p",
          text: "No-reflow means that the epicardial artery is open, with no residual mechanical obstruction, yet contrast does not run off into the distal bed. Slow flow is the milder form (TIMI 2). Both reflect obstruction at the microvascular level: embolised thrombus and plaque debris plug small vessels, and vasoactive substances released from the disrupted plaque cause microvascular spasm. Oedema and reperfusion injury add to it in STEMI.",
        },
        {
          kind: "table",
          caption: "TIMI flow grades",
          head: ["Grade", "Description"],
          rows: [
            ["TIMI 0", "No flow beyond the occlusion"],
            ["TIMI 1", "Contrast passes the lesion but does not fill the distal vessel"],
            ["TIMI 2", "The distal vessel fills, but slowly"],
            ["TIMI 3", "Normal, prompt filling and clearance"],
          ],
        },
        {
          kind: "keypoints",
          title: "High-risk settings",
          items: [
            "Degenerated saphenous vein grafts, which contain friable atheroma and thrombus.",
            "STEMI and other thrombus-rich ACS lesions, especially with late presentation.",
            "Rotational or orbital atherectomy, which releases particulate debris.",
            "Aggressive or repeated balloon dilatation, oversized stents and high-pressure post-dilatation in soft, lipid-rich plaque.",
          ],
        },
        {
          kind: "steps",
          title: "Treatment sequence",
          items: [
            { title: "Exclude a mechanical cause", detail: "Look carefully for dissection, residual thrombus, spasm or stent edge problems; consider imaging. Check the ACT. Mechanical obstruction needs a mechanical fix, not drugs." },
            { title: "Deliver drugs distally", detail: "Place a microcatheter, aspiration catheter or over-the-wire balloon lumen as far down the affected vessel as possible and inject through it. Drugs given into the guide simply reflux into the aorta when the vessel is not flowing." },
            { title: "Choose agents by haemodynamics", detail: "Use a direct microvascular vasodilator such as nicardipine, adenosine, verapamil or nitroprusside. Brilakis prefers nicardipine because it lowers the blood pressure less than nitroprusside or verapamil and wears off sooner, which matters most in a hypotensive patient; he adds intracoronary adrenaline when no-reflow is refractory. Doses are small intracoronary microgram boluses repeated as needed; follow your local protocol." },
            { title: "Treat thrombus", detail: "Consider a glycoprotein IIb/IIIa inhibitor or cangrelor if thrombus burden is high and bleeding risk acceptable; aspiration in selected cases." },
            { title: "Support", detail: "Vasopressors, temporary pacing for bradycardia and, in severe cases with shock, mechanical support while the microcirculation recovers." },
          ],
        },
        {
          kind: "table",
          caption: "Intracoronary agents for no-reflow (typical options; use per local protocol)",
          head: ["Agent", "Mechanism", "Main caution"],
          rows: [
            ["Adenosine", "Direct arteriolar vasodilator; very short acting", "Transient AV block and bradycardia; bronchospasm in reactive airways disease"],
            ["Verapamil", "Calcium-channel blocker; relaxes microvascular smooth muscle", "Bradycardia, AV block and negative inotropy; have pacing available"],
            ["Sodium nitroprusside", "Nitric oxide donor acting on resistance vessels", "Systemic hypotension"],
            ["Adrenaline (epinephrine)", "Beta-2 mediated microvascular dilatation plus inotropy and pressor effect", "Tachyarrhythmia; useful when no-reflow coexists with hypotension"],
            ["Nitroglycerin", "Mainly dilates epicardial vessels", "Limited effect on the microvasculature; worsens hypotension"],
          ],
        },
        {
          kind: "keypoints",
          title: "Prevention",
          items: [
            "In vein graft PCI consider distal embolic protection when the anatomy allows, direct stenting and modest stent sizing.",
            "In thrombus-rich STEMI avoid repeated high-pressure post-dilatation; adequate antiplatelet loading and, in selected cases, adjunctive antithrombotic therapy reduce embolisation.",
            "During atherectomy use short runs and pauses, and keep perfusion pressure up.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Giving all the vasodilator through the guide into a non-flowing vessel.",
            "Giving verapamil to a patient with marked bradycardia or heart block without pacing back-up.",
            "Calling it no-reflow and missing a distal dissection or occlusive thrombus.",
          ],
        },
        { kind: "sim", sim: "cathlab", task: "Review a post-stent injection in which contrast stagnates distally. Identify the TIMI flow grade, confirm the stent edges are free of dissection, then describe where you would place a microcatheter to deliver vasodilator." },
      ],
    },
    {
      id: "comp-air-thrombus",
      title: "Air embolism and intraprocedural thrombosis",
      minutes: 7,
      refs: ["supplied-medmastery", "supplied-oxford", "brilakis-manual-pci"],
      blocks: [
        { kind: "h", text: "Coronary air embolism" },
        {
          kind: "p",
          text: "Air in a coronary artery blocks the microcirculation abruptly. Small bubbles cause transient chest pain and ST elevation; larger volumes cause hypotension, bradycardia, VF or arrest. Nearly all air embolism is preventable.",
        },
        {
          kind: "keypoints",
          title: "How air gets in, and how to stop it",
          items: [
            "Inadequate flushing and de-airing of the guide, manifold or devices. Aspirate from the guide and confirm free blood flow before every injection.",
            "Withdrawing a balloon, stent or other device quickly through a tight haemostatic valve creates a vacuum and draws air in, especially in smaller guides. Open the valve adequately, withdraw in a controlled way, then let blood back-bleed before closing.",
            "Aspirating with the haemostatic valve not properly closed, or through a loose connection.",
            "Balloon rupture of a balloon that was not prepared to remove air.",
          ],
        },
        {
          kind: "steps",
          title: "Treatment",
          items: [
            { title: "High-flow 100% oxygen", detail: "Speeds absorption of nitrogen-containing bubbles." },
            { title: "Remove or disperse the air", detail: "Aspirate through the guide if air is still in it. Once the guide and manifold have been aspirated and cleared, repeated forceful saline injections can help break up the bubbles (Brilakis 5.5); do not inject contrast until the source has been found. Aspiration through a catheter in the vessel can remove a large bubble." },
            { title: "Support", detail: "Atropine or pacing for bradycardia, vasopressors for hypotension, defibrillation and CPR if needed. Be ready for prolonged resuscitation; most cases improve as the air is absorbed." },
            { title: "Look for the source", detail: "Check every connection and the manifold before injecting again." },
          ],
        },
        { kind: "h", text: "Intraprocedural thrombosis" },
        {
          kind: "p",
          text: "New thrombus during PCI may form on the guide, wire, balloon or freshly implanted stent, or embolise from the culprit lesion. It is suspected when hazy or rounded filling defects appear, or a stent that looked good suddenly occludes.",
        },
        {
          kind: "table",
          caption: "Causes and responses",
          head: ["Cause", "Response"],
          rows: [
            ["Inadequate anticoagulation (heparin forgotten, under-dosed, given into a non-flowing line, or worn off in a long case)", "Check ACT now; give more heparin; aim for the target range used by your lab (often 250–350 seconds for PCI with heparin alone)"],
            ["Stasis in the guide or in a damped vessel", "Aspirate and flush the guide; avoid long periods of wedged or damped engagement"],
            ["Mechanical substrate: dissection, underexpansion, poor outflow", "Image and correct the mechanical problem"],
            ["High thrombus burden in ACS", "Aspiration in selected cases; glycoprotein IIb/IIIa inhibitor or cangrelor"],
            ["Heparin-induced thrombocytopenia (rare)", "Suspect if there is unexplained resistance to heparin with recent exposure; switch to a non-heparin anticoagulant such as bivalirudin and seek haematology advice"],
            ["Premature heparin reversal", "Do not give protamine while equipment remains in the coronary unless the situation demands it"],
          ],
        },
        {
          kind: "pearl",
          text: "When a new filling defect appears, the first question is 'what is the ACT?' and the second is 'what in the vessel is making flow stagnate?'",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting through a guide from which you could not aspirate blood.",
            "Pulling a large device out of a 6 Fr guide at speed with the valve half closed.",
            "Assuming the ACT is adequate because heparin was given an hour ago.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-diss-1",
      stem: "After balloon pre-dilatation, angiography shows a spiral filling defect along the vessel with staining of the false lumen and preserved distal flow. What NHLBI type is this?",
      options: ["Type A", "Type B", "Type C", "Type D", "Type F"],
      answer: 3,
      explanation:
        "A spiral (barber's pole) filling defect is NHLBI type D, which carries a high risk of abrupt closure and needs stenting along its length. Type C is a persisting extraluminal cap without the spiral pattern, and type F implies total occlusion, which is not present here.",
      difficulty: 1,
      refs: ["nhlbi-dissection-1991", "supplied-medmastery"],
    },
    {
      id: "comp-q-diss-2",
      stem: "During PCI an occlusive dissection develops in the mid RCA. The wire is still distal. What is the most important principle?",
      options: [
        "Withdraw the wire and re-wire to be certain of the true lumen",
        "Keep the wire in place, tack the flap with low-pressure prolonged inflation, confirm the true lumen and stent the dissection",
        "Give protamine to reduce intramural haematoma",
        "Perform repeated forceful injections to define the dissection",
        "Abandon PCI and refer immediately for surgery",
      ],
      answer: 1,
      explanation:
        "A wire in the true lumen beyond a dissection is the key to rescue, so it must be kept while the flap is tacked and stented. Withdrawing it risks re-entering the false lumen and permanent occlusion. Forceful injections pressurise the false lumen and extend the dissection.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-diss-3",
      stem: "A JR4 guide engages the RCA with a damped pressure trace. After an injection, contrast stains the ostium and tracks a short distance up the right coronary sinus. What is the best next step?",
      options: [
        "Repeat a larger injection in two views to define the full extent of the stain",
        "Stop injecting, wire the true lumen, seal the ostium with a stent; echo or CT",
        "Withdraw everything and arrange emergency surgery for aortic dissection",
        "Give intracoronary nitrate and repeat the injection once the trace improves",
        "Change to an Amplatz guide for better support before injecting again",
      ],
      answer: 1,
      explanation:
        "Guide-induced RCA ostial dissection with limited aortic extension is usually managed by sealing the coronary entry with an ostial stent, after which the aortic component usually heals; echo and CT define the extent. Further injection extends the dissection. Surgery is considered when the dissection extends well up the ascending aorta or the patient is unstable, not as the default for a limited sinus stain.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "dunning-aortocoronary-dissection-2000"],
    },
    {
      id: "comp-q-diss-4",
      stem: "After stenting a degenerated vein graft, the graft is widely patent but contrast does not run off into the distal native vessel. BP is 82/50 mmHg. There is no dissection on two views. Which approach is best?",
      options: [
        "Give nitroglycerin 200 micrograms into the guide",
        "Deliver intracoronary adrenaline through a microcatheter placed distally in the graft",
        "Post-dilate the stent at high pressure",
        "Give intravenous verapamil",
        "Implant a second stent distally",
      ],
      answer: 1,
      explanation:
        "This is no-reflow with hypotension, so a vasodilator that also supports blood pressure, delivered distally where the microcirculation is, fits best; adrenaline is commonly used in this situation. Nitroglycerin acts mainly on epicardial vessels and would worsen hypotension, and given via the guide it would not reach the target. Further dilatation releases more debris.",
      difficulty: 2,
      refs: ["seattle-complications-2020", "supplied-medmastery"],
    },
    {
      id: "comp-q-diss-5",
      stem: "Why should no-reflow drugs be delivered through a microcatheter positioned distally rather than through the guide?",
      options: [
        "Microcatheters dilute the drug to a safer concentration",
        "With no forward flow, drug given via the guide refluxes into the aorta",
        "Delivery through the guide causes air embolism down the vessel",
        "Drugs given through the guide cause a dissection at the coronary ostium",
        "Microcatheter delivery avoids the need for any further heparin during the case",
      ],
      answer: 1,
      explanation:
        "The target of no-reflow therapy is the microvasculature, and with little forward flow, drug in the proximal vessel washes back into the aorta. Distal delivery puts drug where it is needed. Air embolism and dissection are not the reasons for distal delivery.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-diss-6",
      stem: "A balloon is withdrawn rapidly from a 6 Fr guide with the haemostatic valve only partially open. On the next injection, the patient develops chest pain, ST elevation and bradycardia. What is the most appropriate immediate management?",
      options: [
        "Give thrombolysis for presumed thrombus embolised from the balloon",
        "Oxygen, aspirate the guide, flush saline to disperse air, support",
        "Immediately stent the vessel at the site where the flow stopped",
        "Give protamine to reverse heparin in case of a perforation",
        "Inject more contrast to check for a dissection at the ostium of the vessel",
      ],
      answer: 1,
      explanation:
        "Rapid withdrawal through a tight valve draws air into the guide, so this is coronary air embolism. Treatment is oxygen, removal or dispersal of air and supportive care. More contrast injected through a guide that may still contain air risks further embolism, and stenting does not treat air.",
      difficulty: 2,
      refs: ["supplied-medmastery", "supplied-oxford"],
    },
    {
      id: "comp-q-diss-7",
      stem: "Ninety minutes into a complex PCI a new rounded filling defect appears in a freshly placed stent. Which is the most useful first test?",
      options: ["Troponin", "ACT", "Platelet function assay", "Fibrinogen", "Echocardiogram"],
      answer: 1,
      explanation:
        "Thrombus forming during a long case most often reflects heparin that has worn off, so the ACT should be checked immediately and heparin topped up if low. Platelet function testing is not a bedside emergency test, and troponin takes hours and does not change immediate management.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-diss-8",
      stem: "A large first diagonal occludes after LAD stenting. A jailed wire was left in the diagonal. The patient has chest pain and new ST elevation. What is the best next step?",
      options: [
        "Remove the jailed wire immediately so that the side branch is freed",
        "Rewire the diagonal through the struts, guided by the jailed wire, then balloon",
        "Give IV opioid for the pain and observe the ECG for an hour",
        "Post-dilate the LAD stent at high pressure to push the carina back across the ostium",
        "Implant a second LAD stent across the diagonal origin",
      ],
      answer: 1,
      explanation:
        "A large, symptomatic branch occlusion should be reopened; the jailed wire marks the ostium and helps you rewire through the struts, after which ostial balloon dilatation usually restores flow. Analgesia is appropriate but not sufficient on its own. Removing the jailed wire first throws away the marker, and further LAD dilatation can worsen carina shift.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage the RCA and watch the pressure trace: when it damps, withdraw slightly to restore a normal waveform before injecting. Identify ostial staining that would suggest guide-induced dissection." },
  ],
  caseIds: ["comp-case-svg-noreflow"],
};

// ===========================================================================
// Module 4 — Equipment complications
// ===========================================================================
const equipment: Module = {
  id: "comp-equipment",
  title: "Equipment loss and entrapment",
  stage: 4,
  summary:
    "Lost and dislodged stents, wire fracture and entrapment, burr entrapment, guide kinking and knotting, balloon rupture and devices that will not cross or will not come back.",
  objectives: [
    "Prevent stent loss through lesion preparation and safe withdrawal technique.",
    "Choose between the small-balloon technique, snaring, twisted wires, deploying or crushing a lost stent.",
    "Manage wire entrapment and fracture, burr entrapment and guide kinking.",
    "Recognise balloon rupture and its consequences.",
    "Use a snare safely and select the right size and route.",
  ],
  lessons: [
    {
      id: "comp-equip-stent-loss",
      title: "Stent loss and dislodgement",
      minutes: 8,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "seattle-complications-2020"],
      blocks: [
        {
          kind: "p",
          text: "A stent that comes off its delivery balloon before deployment is uncommon but frightening. Most stent losses happen for one reason: the stent was pushed against a lesion or bend that was not adequately prepared, the guide backed out, and the operator then tried to pull the stent back into the guide at an angle, stripping it from the balloon.",
        },
        {
          kind: "keypoints",
          title: "Prevention",
          items: [
            "Prepare the lesion: pre-dilate, and debulk or modify calcium before trying to deliver a stent through it.",
            "Never force a stent that will not cross. Withdraw it carefully and improve preparation or support.",
            "Improve support with a better guide, a buddy wire, an anchor balloon or a guide extension rather than more push.",
            "When withdrawing an undeployed stent, make the guide coaxial first and watch the stent enter the guide on fluoroscopy. If it catches at the guide tip, do not keep pulling; withdraw guide, stent and wire together as one unit.",
            "Inspect the stent before loading and confirm it is still on the balloon when it comes out of the patient.",
            "Be cautious passing a new stent through a freshly deployed stent; the struts can catch the leading edge.",
          ],
        },
        { kind: "h", text: "First questions when a stent is lost" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Where is it: in the coronary, at the ostium, in the aorta, or embolised to the periphery?",
            "Is it still on the guidewire? Keep the wire in place at all costs if it is.",
            "Is it partly expanded or deformed?",
            "Is coronary flow maintained, and is the patient stable?",
          ],
        },
        {
          kind: "table",
          caption: "Options when the stent is still on the wire",
          head: ["Technique", "How", "Best when"],
          rows: [
            ["Small-balloon technique", "Pass a very small balloon through the stent, inflate it just distal to (or within) the stent and pull back to drag the stent into the guide", "Stent on the wire, undamaged and not wedged"],
            ["Deploy in place", "Pass a small balloon into the stent and expand it, then follow with sequentially larger balloons", "Position is acceptable and the stent can safely reach the vessel diameter without fracturing"],
            ["Crush", "Pass a second wire alongside, inflate a balloon at high pressure to press the stent into the wall, then cover it with a new stent", "Stent cannot be retrieved or deployed, in a non-critical segment"],
            ["Snare", "Grasp the proximal end of the stent (or the wire just behind it) with a snare and withdraw", "Stent protrudes from the ostium into the aorta, or sits in a large proximal segment"],
            ["Twisted wires", "Pass two or three wires beyond the stent and rotate them together so they wrap around it, then withdraw everything", "Snare unavailable or unsuccessful"],
            ["Guide extension", "Advance a guide extension to the stent and draw the stent into it", "Stent close to the guide tip in a straight segment"],
          ],
        },
        {
          kind: "pearl",
          text: "A stent cannot be safely expanded far beyond its design limit. A small-diameter stent lost in a large vessel such as the left main should not be deployed there; it will fracture or remain malapposed. Retrieval is the better choice.",
        },
        { kind: "h", text: "Stent off the wire or embolised" },
        {
          kind: "p",
          text: "If the stent has left the wire, find it with fluoroscopy, starting at the aortic root and working down to the legs. Embolised stents often lodge in the iliac or femoral arteries and can usually be snared through a femoral sheath. A stent lodged in a small peripheral branch without ischaemia may be left. Cerebral embolisation needs urgent neurointerventional or stroke-team input. Surgery is occasionally needed to retrieve a stent or to treat the coronary disease that could not be stented.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling a stuck stent back hard against a non-coaxial guide tip.",
            "Removing the wire to 'reset', leaving a free stent in the coronary.",
            "Forgetting to check the vessel after retrieval; dragging a stent out can strip the intima and need another stent.",
            "Withdrawing a retrieved stent through a small radial sheath where it catches; upsize the sheath or remove sheath and stent together.",
          ],
        },
      ],
    },
    {
      id: "comp-equip-wire-burr-guide",
      title: "Wire, burr and guide entrapment",
      minutes: 8,
      refs: ["brilakis-manual-pci", "supplied-medmastery", "seattle-complications-2020"],
      blocks: [
        { kind: "h", text: "Wire entrapment and fracture" },
        {
          kind: "p",
          text: "Wires become trapped when the tip is caught in calcium or a CTO cap, when a wire is jailed behind a stent and squeezed by high-pressure inflation, or when two wires wrap around each other. Fracture usually follows continued rotation while the tip cannot turn, or forceful traction.",
        },
        {
          kind: "keypoints",
          title: "Prevention",
          items: [
            "If the tip stops moving, stop torquing. Count turns and reverse them rather than spinning further in one direction.",
            "Which wire to jail is debated: polymer-jacketed wires may shed coating on withdrawal, yet in one microscopy study they were damaged far less often than non-polymer wires. Jail with a straight tip, keep the radiopaque segment out of the stent and jail only a short length.",
            "Keep externalised wires separated and labelled to prevent wire wrap.",
            "With a filter embolic protection device, remove any buddy wire as soon as the filter has been delivered; stenting over it can trap the filter.",
          ],
        },
        {
          kind: "steps",
          title: "Freeing a trapped wire",
          items: [
            { title: "Advance a support catheter", detail: "Run a microcatheter or small over-the-wire balloon over the trapped wire to just short of the entrapment. This focuses traction at the tip and protects the proximal vessel." },
            { title: "Gentle traction only", detail: "Pull gently and steadily, never hard: a hard pull can fracture or unravel the wire and draw the guide deep into the artery. A guide extension can be used in place of the microcatheter." },
            { title: "Release the trap", detail: "If that fails, advance a small balloon as far as possible over the trapped wire, inflate it and pull gently again (repeat the POT afterwards if the wire was jailed). Only if that also fails, pass a second wire beside the trapped one and inflate a balloon alongside it." },
            { title: "If it fractures", detail: "Assess the fragment's position and length. Options are snaring, twisted-wire retrieval, pinning it against the wall with a stent, or leaving a small distal fragment. A long fragment trailing into the aorta or left main usually needs retrieval, sometimes surgery." },
          ],
        },
        { kind: "h", text: "Rotational atherectomy burr entrapment" },
        {
          kind: "p",
          text: "A burr can pass through a tight calcified lesion and then fail to come back, because its non-abrasive back surface catches on the lesion. Brilakis lists four causes: forceful advancement with large decelerations, small burrs (above all the 1.25 mm burr, which can slip through and then fail to come back), ablation inside previously placed stents, and very tortuous vessels.",
        },
        {
          kind: "table",
          caption: "Burr entrapment: prevention and rescue",
          head: ["Phase", "Approach"],
          rows: [
            ["Prevention", "Use a burr of 1.5 mm or more, at a burr-to-artery ratio of 0.5 or lower; advance gently with short pecking contacts and short runs; avoid large drops in rotational speed; never stop the burr beyond the lesion, and never start or stop it inside the lesion (Brilakis 19.9.5.7.3)"],
            ["Gentle traction", "Steady traction on the drive shaft while advancing the guide for counter-traction; some operators activate the burr at low speed during traction, according to manufacturer guidance"],
            ["Second wire and balloon", "Pass a second wire beyond the burr and inflate a small balloon alongside it to enlarge the channel; needs a larger guide or a second guide"],
            ["Guide extension or child catheter", "After cutting the drive-shaft system per the manufacturer's method, advance a guide extension or small catheter over it to the burr to give coaxial counter-traction"],
            ["Surgery", "If percutaneous options fail"],
          ],
        },
        { kind: "h", text: "Guide catheter kinking and knotting" },
        {
          kind: "p",
          text: "Excessive torque, particularly with small catheters in tortuous subclavian or radial anatomy, can kink or knot a guide. A kinked guide damps the pressure trace and cannot pass devices.",
        },
        {
          kind: "steps",
          title: "Management",
          items: [
            { title: "Stop torquing in the same direction", detail: "Gently counter-rotate while watching the kink on fluoroscopy." },
            { title: "Pass a wire through the kink", detail: "A hydrophilic wire advanced through the kinked segment straightens it and allows rotation and removal." },
            { title: "Fix the tip", detail: "If the knot will not undo, a snare from another access site (usually femoral) can hold the guide tip while it is untwisted." },
            { title: "Remove as a unit", detail: "If the knot cannot pass through the sheath, remove sheath and guide together, secure haemostasis and use alternative access." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Torquing a guide without a wire inside it in tortuous anatomy.",
            "Pulling a knotted guide hard through a radial artery, risking avulsion of the vessel.",
          ],
        },
      ],
    },
    {
      id: "comp-equip-balloon-snare",
      title: "Balloon rupture, uncrossable lesions and snares",
      minutes: 7,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        { kind: "h", text: "Balloon rupture" },
        {
          kind: "p",
          text: "The rated burst pressure of a balloon is the pressure at which, with 95% confidence, 99.9% of balloons will not rupture. Above it, failure is increasingly likely, especially against calcified plaque or stent struts. Suspect rupture if pressure falls suddenly, the indeflator cannot hold pressure, the balloon visibly collapses or contrast puffs into the vessel, or blood appears in the inflation lumen.",
        },
        {
          kind: "steps",
          items: [
            { title: "Deflate fully", detail: "Pull the indeflator to full negative at once." },
            { title: "Withdraw and inspect", detail: "Remove the balloon and check that it is intact; a circumferential tear can leave fragments or bunch the balloon so that it catches in the guide." },
            { title: "Look at the vessel", detail: "A high-pressure jet can dissect or perforate the vessel; inject in two views." },
            { title: "Consider air", detail: "If the balloon was not fully de-aired, rupture can release air into the coronary." },
          ],
        },
        { kind: "h", text: "The uncrossable lesion and the entrapped device" },
        {
          kind: "table",
          caption: "Escalation when a balloon will not cross",
          head: ["Problem", "Options"],
          rows: [
            ["Inadequate support", "Larger or better-shaped guide; deeper engagement; guide extension; buddy wire; anchor balloon in a proximal side branch"],
            ["Device profile", "Smallest available balloon; microcatheter to dilate the channel"],
            ["Calcium", "Rotational or orbital atherectomy (after exchanging to the dedicated wire); laser where available; intravascular lithotripsy once a balloon can cross"],
            ["Wire position", "Ensure the wire is in the true lumen and the distal tip is not in a tiny branch"],
          ],
        },
        {
          kind: "p",
          text: "A balloon, microcatheter or guide extension may become caught in a stent strut, calcium or a CTO. The same principles apply as for a trapped wire: support close to the trap, counter-traction from the guide, enlarge the channel with a second wire and small balloon, and avoid brute force.",
        },
        { kind: "h", text: "Using a snare" },
        {
          kind: "table",
          caption: "Snare types",
          head: ["Type", "Features", "Typical use"],
          rows: [
            ["Single loop", "One loop set at right angles to the shaft", "Grasping a free end in a straight vessel or the aorta"],
            ["Multi-loop", "Several interlaced loops opening into a basket-like shape", "Capturing objects in larger vessels where alignment is difficult"],
          ],
        },
        {
          kind: "steps",
          title: "Snaring technique",
          items: [
            { title: "Size and route", detail: "Choose a loop close to the vessel diameter. Use a guide or sheath large enough to withdraw the object, usually via the femoral artery for large items." },
            { title: "Open next to the target", detail: "Advance the snare in its catheter, open the loop beside the free end and manoeuvre it over the end." },
            { title: "Close the loop against the catheter tip", detail: "Either draw the snare back into its catheter until the object is held against the catheter tip, or, as Brilakis describes for a stent in a coronary artery, hold the snare wire still and advance the catheter over the loop. Make sure the object is gripped before anything is withdrawn." },
            { title: "Withdraw as a unit", detail: "Pull snare, catheter and object together into the sheath under fluoroscopy." },
          ],
        },
        {
          kind: "pearl",
          text: "A free end is what a snare needs. If the stent is still on the wire, snaring the wire just proximal to the stent, or threading the snare over the wire, can bring the stent back without crushing it.",
        },
        {
          kind: "pitfalls",
          items: [
            "Repeated high-pressure inflations beyond rated burst pressure in undilatable calcium instead of changing strategy.",
            "Snaring the middle of a stent and deforming it so it cannot enter the guide.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-equip-1",
      stem: "What is the most common underlying cause of stent loss during PCI?",
      options: [
        "Manufacturing defects in the way the stent is crimped onto its delivery balloon",
        "Poor lesion preparation, forced advancement and stripping on withdrawal",
        "Excessive heparin making the balloon surface slippery",
        "Use of radial access with a smaller guide catheter",
        "Using a drug-eluting rather than a bare-metal stent",
      ],
      answer: 1,
      explanation:
        "Stents are usually lost when pushed into an inadequately prepared lesion and then pulled back non-coaxially into the guide. Better lesion preparation and support prevent most cases. Manufacturing defects are rare.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-equip-2",
      stem: "A 2.5 mm stent comes off its balloon and lies, still on the wire, in a 4.5 mm proximal vessel. Which option is least appropriate?",
      options: [
        "Small-balloon technique to drag it back into the guide",
        "Snare the stent's proximal end",
        "Deploy it in place with sequentially larger balloons up to 4.5 mm",
        "Twisted-wire technique",
        "Advance a guide extension and draw the stent into it",
      ],
      answer: 2,
      explanation:
        "A 2.5 mm stent cannot be safely expanded to 4.5 mm; it would fracture or be malapposed, so deploying it in place is inappropriate. The retrieval options are all reasonable depending on position. Deploying in place is only suitable when the stent can reach the vessel size and the position is acceptable.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-equip-3",
      stem: "The stent is lost and the operator immediately removes the guidewire 'to start again'. Why is this a mistake?",
      options: [
        "It increases contrast use, because the vessel must be re-imaged",
        "Without the wire, most rescues are lost and the stent may embolise",
        "It prolongs radiation time while the lesion is crossed a second time",
        "It causes air embolism when the wire is pulled out through the valve",
        "It requires heparin reversal before the vessel can be rewired safely again",
      ],
      answer: 1,
      explanation:
        "A wire running through the lost stent gives you control and a route for balloons, snares and other retrieval devices. Once the wire is removed the stent is free in the vessel, and retrieval becomes much harder with a real risk of embolisation.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-equip-4",
      stem: "A rotational atherectomy burr has crossed a calcified lesion and will not come back. What is the most appropriate initial step?",
      options: [
        "Pull hard on the drive shaft with the burr spinning at maximum speed",
        "Steady traction against the guide; then a second wire and small balloon",
        "Give protamine to reverse heparin before attempting any retrieval",
        "Advance the burr further distally to free it from the calcified segment",
        "Immediately cut the drive shaft and leave the burr in the vessel permanently",
      ],
      answer: 1,
      explanation:
        "The initial approach is controlled traction with counter-traction, escalating to a second wire and balloon to enlarge the channel, or a guide extension advanced to the burr. Forceful pulling risks avulsing the vessel or breaking the system. Cutting the drive shaft is a step used to allow a guide extension to be advanced, not a way of abandoning the burr.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "comp-q-equip-5",
      stem: "During balloon inflation at 22 atm in a calcified lesion the pressure suddenly drops and contrast puffs into the vessel. What should you do first?",
      options: [
        "Reinflate to confirm that the balloon has ruptured",
        "Deflate fully, withdraw and inspect it, then image the vessel",
        "Inflate a larger balloon to finish dilating the calcium",
        "Give intracoronary nitrate for the spasm caused by the contrast jet",
        "Leave the balloon in place to tamponade any injury",
      ],
      answer: 1,
      explanation:
        "These are signs of balloon rupture. Full deflation and removal, inspection of the balloon for missing fragments and angiography for vessel injury are the immediate steps. Reinflating a ruptured balloon in the vessel can jet contrast into the wall and worsen injury.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-equip-6",
      stem: "When tightening a snare around an object, what is the correct manoeuvre?",
      options: [
        "Pull the snare wire back into its catheter to close the loop",
        "Advance the snare catheter over the loop, holding the snare still",
        "Rotate the snare repeatedly until the loop grips the object firmly",
        "Inject contrast through the snare catheter to tighten the loop",
        "Withdraw the guide catheter slightly so that the loop closes on its own",
      ],
      answer: 1,
      explanation:
        "Advancing the catheter over the loop closes it in place around the object. Pulling the snare back tends to drag the loop off the target before it closes. Rotation and contrast injection do not tighten the loop.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "comp-q-equip-7",
      stem: "A small, thin guide catheter becomes kinked in a tortuous subclavian artery during attempts to engage the left coronary. What is the best initial step?",
      options: [
        "Continue torquing in the same direction until the catheter tip engages",
        "Counter-rotate gently and pass a hydrophilic wire through the kink",
        "Pull the catheter out forcefully before the kink becomes a knot",
        "Inject contrast through the catheter to see the shape of the kink",
        "Inflate a balloon inside the kink to straighten the catheter shaft",
      ],
      answer: 1,
      explanation:
        "Counter-rotation and passing a slippery wire through the kink usually straighten the catheter so it can be withdrawn safely. Continued torque tightens the kink or creates a knot, and forceful withdrawal can injure the artery. A snare from another access is reserved for knots that cannot be undone.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Plan lesion preparation for a calcified, angulated segment before stenting: choose a non-compliant balloon diameter and pressure that fully expand the lesion, then size the stent to the reference vessel." },
  ],
  caseIds: ["comp-case-lm-stent-loss"],
};

// ===========================================================================
// Module 5 — Access and systemic complications
// ===========================================================================
const systemicAccess: Module = {
  id: "comp-systemic-access",
  title: "Access-site and systemic complications",
  stage: 4,
  summary:
    "Radial and femoral access complications, major bleeding, contrast reactions, contrast-associated AKI, stroke, arrhythmia, cholesterol embolisation and radiation skin injury.",
  objectives: [
    "Prevent, recognise and treat radial spasm, occlusion, haematoma and forearm compartment syndrome.",
    "Recognise retroperitoneal haemorrhage early and manage femoral pseudoaneurysm, AV fistula and limb ischaemia.",
    "Grade and manage major bleeding while weighing stent thrombosis risk.",
    "Treat anaphylactoid contrast reactions and reduce the risk of contrast-associated AKI.",
    "Respond to stroke, arrhythmia, cholesterol embolisation and high radiation dose.",
  ],
  lessons: [
    {
      id: "comp-access-radial",
      title: "Radial access complications",
      minutes: 7,
      refs: ["supplied-medmastery", "matrix-2015", "brilakis-manual-pci", "bertrand-forearm-2010"],
      blocks: [
        {
          kind: "p",
          text: "Radial access is the default in UK practice because it reduces access-site bleeding and, in randomised trials in acute coronary syndromes such as MATRIX, was associated with fewer bleeding events and lower mortality than femoral access. Its complications are usually minor but must be recognised: spasm, occlusion, haematoma and, rarely, forearm compartment syndrome.",
        },
        {
          kind: "table",
          caption: "Radial complications at a glance",
          head: ["Complication", "Recognition", "Management"],
          rows: [
            ["Spasm", "Pain, resistance to catheter movement or rotation, 'gripping' of the catheter", "Intra-arterial vasodilator cocktail (commonly a nitrate with verapamil, per local protocol), analgesia and sedation, patience; smaller or hydrophilic-coated catheters; never force withdrawal"],
            ["Radial artery occlusion (RAO)", "Absent radial pulse or flat plethysmography trace with ulnar compression; often asymptomatic", "Prevent with adequate heparin, patent haemostasis and short compression; early ipsilateral ulnar compression may restore flow; anticoagulation is used by some for symptomatic or early occlusion"],
            ["Perforation during wiring", "Wire takes an unusual course, forearm pain, contrast extravasation on radial angiogram", "Cross with a soft wire and leave a long sheath or the guide across the tear; it usually seals. Bleeding may appear only after the catheter is removed"],
            ["Forearm haematoma", "Swelling, bruising, pain", "Firm local compression; elevation; consider a blood-pressure cuff inflated proximally to stop inflow while repositioning the band; ultrasound if pulsatile"],
            ["Compartment syndrome (rare)", "Pain out of proportion, pain on passive finger extension, a tense forearm, paraesthesia; pulses may still be present", "Urgent surgical review; fasciotomy if confirmed"],
            ["Pseudoaneurysm, AV fistula, nerve injury", "Pulsatile mass, bruit, sensory change", "Compression or surgical repair; specialist review"],
          ],
        },
        {
          kind: "p",
          text: "Forearm haematomas are often graded using the EASY scale, from a small local haematoma (grade I) through haematomas extending below (III) and above (IV) the elbow to grade V, any haematoma threatening the circulation to the hand. Grading helps the team communicate severity and escalate early.",
        },
        {
          kind: "keypoints",
          title: "Preventing radial occlusion",
          items: [
            "Give adequate anticoagulation even for diagnostic procedures (heparin per local protocol).",
            "Use patent haemostasis: after sheath removal, inflate the band until bleeding stops, then let air out until a pulse or plethysmography trace just returns distal to the band.",
            "Keep compression time as short as safely possible.",
            "Match sheath size to the artery; consider distal radial access, which is associated with good long-term patency.",
            "Check radial patency before discharge.",
          ],
        },
        {
          kind: "pearl",
          text: "A radial perforation is often 'tamponaded' by the catheter during the case and bleeds only when it is withdrawn in an anticoagulated patient. Watch the forearm closely after removal and be ready to compress and elevate.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling a catheter forcefully against severe spasm; this can avulse or evert the artery.",
            "Placing the compression band too distal to the puncture, so the arteriotomy is not compressed.",
            "Accepting a tense, painful forearm as 'just a bruise'.",
          ],
        },
      ],
    },
    {
      id: "comp-access-femoral",
      title: "Femoral access complications",
      minutes: 8,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Femoral access remains essential for large-bore devices, mechanical support and some complex PCI, but its complications are more frequent and more serious than radial ones. Most arise from where the artery was punctured. The target is the common femoral artery over the middle of the femoral head, below the inguinal ligament and above the bifurcation, where it can be compressed against bone.",
        },
        {
          kind: "table",
          caption: "Puncture site and the complication it invites",
          head: ["Puncture", "Typical consequence"],
          rows: [
            ["Too high (above the inguinal ligament, marked angiographically by the lowest point of the inferior epigastric artery)", "Retroperitoneal haemorrhage; the vessel cannot be compressed against bone"],
            ["Back-wall or double-wall puncture", "Bleeding from the posterior hole, including retroperitoneal"],
            ["Too low (superficial femoral or profunda)", "Pseudoaneurysm, AV fistula, haematoma; closure devices less reliable"],
            ["Through a diseased or calcified segment", "Dissection, occlusion, failed closure"],
          ],
        },
        {
          kind: "keypoints",
          title: "Safer femoral access",
          items: [
            "Use fluoroscopy to locate the femoral head and ultrasound to see the artery and its bifurcation.",
            "Use a micropuncture needle and wire, particularly in obese or anticoagulated patients.",
            "Perform a femoral angiogram through the sheath in an ipsilateral oblique view to confirm puncture height before closure.",
          ],
        },
        { kind: "h", text: "Retroperitoneal haemorrhage" },
        {
          kind: "p",
          text: "This is the femoral complication most likely to kill, because it is hidden. Blood tracks behind the peritoneum, so the groin may look normal.",
        },
        {
          kind: "steps",
          title: "Recognise and act",
          items: [
            { title: "Suspect it", detail: "Hypotension or tachycardia after femoral access, especially with flank, back, lower abdominal or groin pain, a falling haemoglobin, or a vagal-type bradycardia. Abdominal pain on straight-leg raise may be present. Flank or periumbilical bruising appears late." },
            { title: "Resuscitate", detail: "Large-bore IV access, fluid and blood products; group and cross-match." },
            { title: "Stop the bleeding drivers", detail: "Stop anticoagulant infusions; consider protamine for heparin; discuss antiplatelet therapy with a senior." },
            { title: "Image", detail: "CT of the abdomen and pelvis (CT angiography if stable enough) confirms the diagnosis and shows active extravasation." },
            { title: "Control the source if bleeding continues", detail: "Endovascular: contralateral access, balloon inflation across the bleeding point, then a covered stent if needed. Surgical repair if endovascular options fail or are unavailable." },
          ],
        },
        { kind: "h", text: "Pseudoaneurysm, AV fistula and limb ischaemia" },
        {
          kind: "table",
          caption: "Other femoral complications",
          head: ["Complication", "Clues", "Management"],
          rows: [
            ["Haematoma", "Groin swelling and bruising", "Compression, analgesia, rest; ultrasound if large, tender or pulsatile"],
            ["Pseudoaneurysm", "Pulsatile swelling, pain, bruit", "Duplex ultrasound. Small ones may thrombose spontaneously. Ultrasound-guided compression or thrombin injection when the neck is narrow; surgery if large, expanding, infected, compromising the skin or unsuitable for thrombin. Surgery is best avoided early on dual antiplatelet therapy where possible"],
            ["AV fistula", "Continuous (machinery) bruit; occasionally limb swelling", "Duplex; many small fistulae close or remain harmless; repair if enlarging or symptomatic"],
            ["Dissection, thrombosis or occlusion", "Cold, pale, painful or pulseless leg", "Urgent duplex or angiography; endovascular or surgical repair; check closure device position"],
            ["Limb ischaemia with large-bore sheaths", "Mottled leg distal to an MCS cannula", "Distal perfusion cannula; remove device when possible"],
          ],
        },
        {
          kind: "pearl",
          text: "Shock with no obvious external bleeding after femoral access is a retroperitoneal bleed until shown otherwise. An unstable patient goes straight to the catheter laboratory or theatre; CT is for the patient who is stable. Do not be reassured by a soft groin or a slow pulse.",
        },
        {
          kind: "pitfalls",
          items: [
            "Attributing post-procedure hypotension to sedation or vasodilators without checking the haemoglobin and the abdomen.",
            "Injecting thrombin into a wide-necked pseudoaneurysm, risking arterial thrombosis.",
            "Using a closure device without first confirming puncture height on a femoral angiogram.",
          ],
        },
        { kind: "sim", sim: "procedure", task: "Puncture the common femoral artery over the middle of the femoral head under fluoroscopic guidance, then confirm on a sheath angiogram that the puncture lies below the inferior epigastric artery and above the bifurcation." },
      ],
    },
    {
      id: "comp-bleeding-contrast-aki",
      title: "Major bleeding, contrast reactions and contrast-associated AKI",
      minutes: 9,
      refs: ["mehran-cin-2004", "esc-revasc-2018", "esc-acs-2023", "supplied-medmastery", "hanna-pcm", "mehran-barc-2011", "kdigo-aki-2012", "rcuk-anaphylaxis-2021", "preserve-2018", "brilakis-manual-pci", "gurm-contrast-dose-2011", "ellis-retroperitoneal-2006"],
      blocks: [
        { kind: "h", text: "Major bleeding" },
        {
          kind: "p",
          text: "Bleeding after PCI is associated with higher mortality, partly directly and partly because it forces interruption of antiplatelet therapy. Sources include the access site, the retroperitoneum, the gastrointestinal tract and, most dangerously, the brain. The Bleeding Academic Research Consortium (BARC) scale standardises severity.",
        },
        {
          kind: "table",
          caption: "BARC bleeding types (simplified)",
          head: ["Type", "Description"],
          rows: [
            ["1", "Minor bleeding not prompting medical review"],
            ["2", "Overt bleeding needing medical attention but not meeting type 3 criteria"],
            ["3a", "Overt bleeding with a haemoglobin fall of 3 to under 5 g/dL, or any transfusion for overt bleeding"],
            ["3b", "Haemoglobin fall of 5 g/dL or more, tamponade, bleeding needing surgical control or IV vasoactive drugs"],
            ["3c", "Intracranial or intraocular bleeding compromising vision"],
            ["4", "Bleeding related to CABG"],
            ["5", "Fatal bleeding"],
          ],
        },
        {
          kind: "keypoints",
          title: "Managing major bleeding",
          items: [
            "Resuscitate and find the source. In a stable patient image early (CT for retroperitoneal, endoscopy for gastrointestinal); take an unstable patient with a suspected retroperitoneal bleed straight back to the catheter laboratory or to theatre.",
            "Stop anticoagulants; reverse heparin with protamine where appropriate.",
            "Decisions about antiplatelet therapy must weigh bleeding against stent thrombosis. Shortly after stenting, stopping both agents is dangerous; involve senior cardiology and the treating specialty and document the plan.",
            "Prevention: radial access, weight-adjusted heparin, avoiding routine glycoprotein IIb/IIIa inhibitors, and gastric protection with a proton-pump inhibitor in patients on dual antiplatelet therapy.",
          ],
        },
        { kind: "h", text: "Anaphylactoid contrast reactions" },
        {
          kind: "table",
          caption: "Severity and response",
          head: ["Severity", "Features", "Response"],
          rows: [
            ["Mild", "Limited urticaria, itching, nausea, flushing", "Observe; oral or IV antihistamine for skin symptoms"],
            ["Moderate", "Diffuse urticaria, facial oedema, mild bronchospasm", "Oxygen; treat bronchospasm; adrenaline if progressing"],
            ["Severe (anaphylaxis)", "Hypotension with tachycardia, laryngeal oedema, severe bronchospasm, arrest", "Stop contrast; call for help; IM adrenaline 0.5 mg (500 micrograms) for an adult, repeated after 5 minutes if no improvement; IV fluid; oxygen; refractory cases need an adrenaline infusion under expert supervision (Resuscitation Council UK)"],
          ],
        },
        {
          kind: "pearl",
          text: "Separate anaphylaxis from a vasovagal reaction: both cause hypotension, but a vagal reaction brings bradycardia, pallor and sweating and responds to atropine and fluid, whereas anaphylaxis brings tachycardia, flushing, urticaria or wheeze. In the lab, also rule out tamponade and bleeding.",
        },
        {
          kind: "list",
          items: [
            "Shellfish or topical iodine allergy does not predict contrast reactions; do not withhold contrast on that basis.",
            "After a previous reaction, document it, consider a different contrast agent and follow local premedication policy; the evidence for premedication is limited, so be ready to treat regardless.",
          ],
        },
        { kind: "h", text: "Contrast-associated acute kidney injury" },
        {
          kind: "p",
          text: "Contrast-associated AKI is usually defined with KDIGO criteria: a rise in creatinine of at least 26.5 micromol/L (0.3 mg/dL) within 48 hours, or to at least 1.5 times baseline within 7 days. Older studies used a 25% or 44 micromol/L rise. Most cases are non-oliguric and recover, but AKI is associated with worse outcomes.",
        },
        {
          kind: "table",
          caption: "Risk factors (several feature in the Mehran score)",
          head: ["Patient", "Procedure"],
          rows: [
            ["Chronic kidney disease (the strongest)", "Large contrast volume"],
            ["Diabetes", "Hypotension during the procedure"],
            ["Heart failure, low ejection fraction", "Intra-aortic balloon pump or other haemodynamic support"],
            ["Older age, anaemia", "Repeat contrast exposure within a short interval"],
            ["Volume depletion, nephrotoxic drugs", "Emergency procedures"],
          ],
        },
        {
          kind: "keypoints",
          title: "Prevention",
          items: [
            "Assess risk formally before the procedure and include it in consent.",
            "Hydrate with isotonic saline in patients at increased risk, adjusted to volume status and ventricular function.",
            "Minimise contrast: small injections, fewer runs, biplane imaging, intravascular imaging and physiology instead of repeated angiography. Gurm's registry analysis suggests planning below three, and preferably two, times the calculated creatinine clearance; Brilakis stops before 3.7 × GFR in general and, in advanced CKD (eGFR below 30), aims to give less contrast than the creatinine clearance.",
            "Withhold nephrotoxins where possible; manage metformin according to local guidance.",
            "N-acetylcysteine and sodium bicarbonate have not shown benefit over saline hydration.",
            "Check creatinine 48 to 72 hours after the procedure in at-risk patients.",
          ],
        },
      ],
    },
    {
      id: "comp-stroke-arrhythmia-radiation",
      title: "Stroke, arrhythmia, cholesterol embolisation and radiation injury",
      minutes: 9,
      refs: ["supplied-medmastery", "radiation-consensus-2018", "brilakis-manual-pci", "hanna-pcm", "rcuk-als-2021", "ncrp-168-2010"],
      blocks: [
        { kind: "h", text: "Stroke during or after PCI" },
        {
          kind: "p",
          text: "Stroke is uncommon but devastating. Most are embolic: atheroma scraped from the aortic arch by catheters, thrombus formed in catheters, or air. Haemorrhagic strokes relate to antithrombotic therapy. Risk is higher in older patients, in emergency and STEMI procedures, with prior stroke, and with extensive catheter manipulation in a diseased arch.",
        },
        {
          kind: "steps",
          title: "Response",
          items: [
            { title: "Stop and examine", detail: "Facial droop, limb weakness, speech disturbance, visual field loss, reduced consciousness. Record the time of onset." },
            { title: "Call the stroke team", detail: "Urgent CT with CT angiography to distinguish haemorrhage from ischaemia and to look for a large-vessel occlusion." },
            { title: "Haemorrhagic stroke", detail: "Reverse heparin guided by the ACT, stop antiplatelets, and consider platelet transfusion if bleeding continues or neurosurgery is planned." },
            { title: "Ischaemic stroke", detail: "Mechanical thrombectomy for large-vessel occlusion is the main option; thrombolysis decisions after recent arterial puncture and heparin belong to the stroke team." },
          ],
        },
        {
          kind: "p",
          text: "Transient neurological symptoms after contrast exposure, such as cortical blindness, confusion or visual disturbance, may reflect contrast neurotoxicity, especially after large contrast loads or internal mammary injections. It usually resolves within hours to days, but it is a diagnosis of exclusion: image first.",
        },
        { kind: "h", text: "Arrhythmias" },
        {
          kind: "table",
          caption: "Common lab arrhythmias",
          head: ["Rhythm", "Usual triggers", "Response"],
          rows: [
            ["VF or pulseless VT", "Deep or damped engagement, contrast injected into the conus or a small branch, contrast hang-up, ischaemia, reperfusion", "Immediate defibrillation; in a monitored, witnessed lab arrest up to three stacked shocks may be given before CPR. Correct the trigger: disengage the guide, restore flow"],
            ["Bradycardia, AV block, asystole", "RCA injection, vagal reaction, inferior ischaemia, adenosine or verapamil", "Ask the patient to cough, atropine, temporary pacing"],
            ["Accelerated idioventricular rhythm", "Reperfusion", "Usually benign and self-limiting"],
            ["Atrial fibrillation", "Ischaemia, atrial stretch, catheter irritation", "Rate or rhythm control; anticoagulation decisions later"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Repeated injections when contrast is not clearing; contrast hang-up provokes VF and may be pressurising a dissection.",
            "Losing guide and wire position when a patient moves or sits up during an arrest; secure equipment and keep the wire.",
          ],
        },
        { kind: "h", text: "Cholesterol embolisation" },
        {
          kind: "p",
          text: "Catheters passing through an atheromatous aorta can dislodge cholesterol crystals that lodge in small arteries. Signs may appear days to weeks later: livedo reticularis, painful blue toes with palpable pedal pulses, a slowly rising creatinine, abdominal pain, and retinal cholesterol plaques. Eosinophilia and low complement support the diagnosis. Treatment is supportive, with statins and avoidance of further aortic instrumentation where possible.",
        },
        { kind: "h", text: "Radiation skin injury" },
        {
          kind: "p",
          text: "Long, complex procedures can deliver a peak skin dose high enough to cause deterministic injury, usually on the back where the beam enters. Transient erythema becomes possible above about 2 Gy, and serious injury (desquamation, ulceration, necrosis) needs considerably higher doses, roughly 10 Gy and above. Injury appears weeks later and may be mistaken for a rash or burn from another cause.",
        },
        {
          kind: "keypoints",
          items: [
            "Reduce dose: low frame rates, short runs, tight collimation, the detector close to the patient, minimal magnification and avoidance of steep angulation.",
            "Vary the projection in long cases so the same skin field is not irradiated throughout.",
            "Record the reference air kerma and dose-area product for every case. Many labs trigger patient notification and skin follow-up above about 5 Gy reference air kerma.",
            "Remember cumulative dose from recent procedures over the same area.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-sys-1",
      stem: "Three hours after femoral PCI a patient has back pain, BP 88/52 mmHg, HR 112 bpm and a soft, non-tender groin. Haemoglobin has fallen from 135 to 101 g/L. What is the most likely diagnosis?",
      options: [
        "Delayed vasovagal reaction",
        "Retroperitoneal haemorrhage",
        "Femoral pseudoaneurysm with leak",
        "Cardiac tamponade from wire perforation",
        "Late contrast reaction",
      ],
      answer: 1,
      explanation:
        "Hypotension, tachycardia, back pain and a falling haemoglobin with a normal-looking groin after femoral access point to retroperitoneal haemorrhage, typically from a high puncture. A vagal reaction does not explain a falling haemoglobin (and a slow pulse would not exclude a retroperitoneal bleed, which often causes bradycardia too); a pseudoaneurysm produces a pulsatile groin swelling. Tamponade should still be excluded with echo, but the haemoglobin fall points to bleeding.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "ellis-retroperitoneal-2006"],
    },
    {
      id: "comp-q-sys-2",
      stem: "Which femoral puncture site most predisposes to retroperitoneal haemorrhage?",
      options: [
        "Over the middle of the femoral head",
        "Above the lowest point of the inferior epigastric artery",
        "Just above the femoral bifurcation, over the lower femoral head",
        "The superficial femoral artery below the bifurcation",
        "The profunda femoris close to its origin",
      ],
      answer: 1,
      explanation:
        "A puncture above the inguinal ligament, marked by the inferior epigastric artery's lowest point, enters the external iliac artery, which cannot be compressed against bone and bleeds into the retroperitoneum. Low punctures in the superficial femoral or profunda arteries predispose to pseudoaneurysm and AV fistula instead.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-sys-3",
      stem: "A day after femoral PCI a patient has a pulsatile groin mass with a bruit. Duplex shows a 2.5 cm pseudoaneurysm with a long, narrow neck. Which treatment is usually first-line?",
      options: [
        "Immediate open surgical repair",
        "Ultrasound-guided thrombin injection",
        "Stop all antiplatelet therapy",
        "Observation only, with no follow-up",
        "Covered stent in the common femoral artery",
      ],
      answer: 1,
      explanation:
        "A pseudoaneurysm with a narrow neck is well suited to ultrasound-guided thrombin injection, which is minimally invasive and avoids surgery in a patient on dual antiplatelet therapy. Surgery is reserved for large, expanding, infected or wide-necked lesions. Stopping antiplatelets risks stent thrombosis and is not needed.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "comp-q-sys-4",
      stem: "Two hours after radial PCI the forearm is swollen and tense, and the patient has severe pain on passive extension of the fingers. The radial pulse is palpable. What is the correct action?",
      options: [
        "Reassure: a palpable radial pulse excludes compartment syndrome",
        "Treat as compartment syndrome: compress, elevate, stop anticoagulant, call surgeons",
        "Inflate the radial band to maximum pressure and leave it in place for 6 hours",
        "Give oral analgesia and review the arm on the consultant ward round the next morning",
        "Start heparin to prevent radial artery occlusion and elevate the arm on pillows",
      ],
      answer: 1,
      explanation:
        "Pain on passive stretch and a tense forearm suggest compartment syndrome, and pulses are often preserved, so a palpable pulse does not exclude it. Urgent surgical review is needed in case fasciotomy is required. Waiting until morning risks permanent muscle and nerve damage.",
      difficulty: 2,
      refs: ["supplied-medmastery", "bertrand-forearm-2010"],
    },
    {
      id: "comp-q-sys-5",
      stem: "A patient develops hypotension, tachycardia, widespread urticaria and wheeze shortly after contrast injection. What is the first drug to give?",
      options: [
        "IV hydrocortisone 200 mg as a slow bolus",
        "IM adrenaline 0.5 mg (500 micrograms)",
        "IV chlorphenamine 10 mg",
        "IV atropine 600 micrograms",
        "Nebulised salbutamol alone, repeated as needed",
      ],
      answer: 1,
      explanation:
        "This is anaphylaxis, and IM adrenaline is the first-line treatment, repeated after 5 minutes if there is no improvement. Steroids and antihistamines act too slowly to treat the life-threatening features. Atropine treats a vasovagal reaction, which causes bradycardia rather than tachycardia.",
      difficulty: 1,
      refs: ["supplied-medmastery", "rcuk-anaphylaxis-2021"],
    },
    {
      id: "comp-q-sys-6",
      stem: "Which measure has the best support for reducing contrast-associated AKI in a patient with an eGFR of 28 mL/min/1.73 m² undergoing PCI?",
      options: [
        "Oral N-acetylcysteine before and after the procedure",
        "IV sodium bicarbonate in place of saline hydration",
        "Isotonic saline hydration and minimal contrast volume",
        "Routine haemodialysis immediately after the procedure",
        "Withholding all antiplatelet therapy for 24 hours",
      ],
      answer: 2,
      explanation:
        "Hydration with isotonic saline and limiting contrast volume are the established preventive measures. N-acetylcysteine and bicarbonate have not proved superior to saline. Prophylactic dialysis does not prevent AKI and is not recommended.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "mehran-cin-2004", "preserve-2018"],
    },
    {
      id: "comp-q-sys-7",
      stem: "During engagement of the RCA, the patient develops VF. The trace was damped just before. What should happen first?",
      options: [
        "Start chest compressions for two minutes before any shock is delivered",
        "Defibrillate at once (stacked shocks allowed) and disengage the guide",
        "Give amiodarone 300 mg intravenously before the first shock",
        "Inject contrast to look for a dissection as the cause of the arrest",
        "Insert a temporary pacing wire through the femoral vein",
      ],
      answer: 1,
      explanation:
        "VF in a monitored lab should be shocked immediately, and up to three stacked shocks may be given in a witnessed arrest before CPR. Disengaging the damped guide removes the likely trigger. Delaying the shock for CPR or drugs lowers the chance of success, and more contrast may worsen the problem.",
      difficulty: 1,
      refs: ["supplied-medmastery", "rcuk-als-2021"],
    },
    {
      id: "comp-q-sys-8",
      stem: "Three weeks after a long CTO procedure with a reference air kerma of 7 Gy, a patient reports a painful red patch on the upper back. What is the most likely explanation?",
      options: [
        "Contact dermatitis from the defibrillator electrode pads",
        "Deterministic radiation skin injury at the beam entry site",
        "Cholesterol embolisation to the skin of the back",
        "Shingles unrelated to the procedure, in a thoracic dermatome",
        "A pressure sore from lying on the table for the long case",
      ],
      answer: 1,
      explanation:
        "A delayed painful erythematous patch on the back after a high-dose procedure fits radiation skin injury at the posterior entry site; the dose exceeds common follow-up thresholds. Cholesterol embolisation causes livedo and blue toes rather than a localised back lesion. Recognition matters because these lesions can progress and need specialist follow-up.",
      difficulty: 2,
      refs: ["radiation-consensus-2018", "ncrp-168-2010"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Obtain femoral access under fluoroscopy: identify the femoral head, puncture the common femoral artery at its middle, and confirm the puncture height on a sheath angiogram before choosing a closure strategy." },
  ],
  caseIds: ["comp-case-retroperitoneal"],
};

// ===========================================================================
// Module 6 — Stent failure
// ===========================================================================
const stentFailure: Module = {
  id: "comp-stent-failure",
  title: "Stent failure: thrombosis and restenosis",
  stage: 4,
  summary:
    "ARC definitions and timing of stent thrombosis, its mechanical and antiplatelet causes including poor runoff, emergency management, and the mechanisms and treatment of in-stent restenosis.",
  objectives: [
    "Classify stent thrombosis by certainty (definite, probable, possible) and timing.",
    "List the mechanical causes of stent thrombosis and how imaging reveals them.",
    "Explain why stents need adequate runoff, using the acute-marginal and long-LAD examples.",
    "Manage stent thrombosis as an emergency and correct its cause.",
    "Describe the mechanisms and patterns of in-stent restenosis and its treatment options.",
  ],
  lessons: [
    {
      id: "comp-st-definitions",
      title: "Stent thrombosis: definitions and timing",
      minutes: 6,
      refs: ["esc-acs-2023", "hanna-pcm", "brilakis-manual-pci", "cutlip-arc-2007", "garcia-garcia-arc2-2018"],
      blocks: [
        {
          kind: "p",
          text: "Stent thrombosis is the sudden thrombotic occlusion (or near-occlusion) of a stented segment. It usually presents as STEMI and carries high mortality and a substantial risk of recurrence, so prevention through good implantation and reliable antiplatelet therapy matters far more than treatment. Contemporary drug-eluting stents have made it uncommon, but not rare enough to forget.",
        },
        {
          kind: "table",
          caption: "Academic Research Consortium (ARC) certainty categories",
          head: ["Category", "Definition (paraphrased)"],
          rows: [
            ["Definite", "Thrombus in the stent or within a few millimetres of its edges confirmed by angiography with an acute ischaemic clinical picture, or confirmed at autopsy or on examination of tissue retrieved by thrombectomy"],
            ["Probable", "Any unexplained death within 30 days of the procedure, or a myocardial infarction in the territory of the stent without angiographic confirmation and without another obvious cause"],
            ["Possible", "Any unexplained death more than 30 days after the procedure (in the original ARC scheme; the 2018 ARC-2 update gives this category little weight)"],
          ],
        },
        {
          kind: "table",
          caption: "Timing",
          head: ["Term", "Interval after implantation"],
          rows: [
            ["Acute", "Within 24 hours (intraprocedural events are often recorded separately)"],
            ["Subacute", "24 hours to 30 days"],
            ["Late", "30 days to 1 year"],
            ["Very late", "More than 1 year"],
          ],
        },
        {
          kind: "keypoints",
          title: "Why timing matters",
          items: [
            "Early (acute and subacute) stent thrombosis is dominated by mechanical problems at implantation and by inadequate or interrupted antiplatelet therapy.",
            "Late and very late stent thrombosis are more often linked to delayed healing, uncovered struts, late-acquired malapposition, neoatherosclerosis or stent fracture.",
            "In every case, ask two questions: was the stent well implanted, and was the patient taking effective antiplatelet therapy?",
          ],
        },
        { kind: "h", text: "Presentation" },
        {
          kind: "p",
          text: "Most patients present with sudden chest pain and ST elevation in the territory of the stented vessel. Some present with cardiac arrest or sudden death, which is why unexplained early deaths are counted as probable stent thrombosis. A smaller group present with NSTEMI when the occlusion is incomplete or collaterals supply the territory. Intraprocedural stent thrombosis appears as new thrombus within or at the edges of a stent during the case, often with chest pain and loss of flow.",
        },
        {
          kind: "table",
          caption: "Distinguishing stent thrombosis from in-stent restenosis",
          head: ["Feature", "Stent thrombosis", "In-stent restenosis"],
          rows: [
            ["Onset", "Sudden", "Gradual, over months"],
            ["Typical presentation", "STEMI, cardiac arrest", "Recurrent stable angina, sometimes ACS"],
            ["Substrate", "Thrombus on the stent", "Neointimal tissue or neoatherosclerosis"],
            ["Urgency", "Emergency primary PCI", "Usually planned assessment and treatment"],
          ],
        },
        {
          kind: "keypoints",
          title: "Who is at higher risk",
          items: [
            "Procedural: underexpanded or malapposed stents, residual edge dissection, long stented segments, small vessels, bifurcation stenting, poor runoff.",
            "Clinical: ACS at presentation, diabetes, chronic kidney disease, low ejection fraction, malignancy.",
            "Drug-related: premature interruption of dual antiplatelet therapy, poor adherence, reduced clopidogrel response.",
          ],
        },
        {
          kind: "pearl",
          text: "A patient with chest pain and ST elevation days after PCI has stent thrombosis until proven otherwise. Activate the primary PCI pathway; do not wait for troponin.",
        },
      ],
    },
    {
      id: "comp-st-mechanisms",
      title: "Mechanisms of stent thrombosis, including poor runoff",
      minutes: 9,
      refs: ["supplied-eh-views", "eapci-imaging-2018", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Thrombosis needs a thrombogenic surface, slow flow and insufficient platelet inhibition. In the stented vessel these map onto exposed metal and injured wall, poor inflow or outflow, and antiplatelet failure. Most early events have more than one contributor.",
        },
        {
          kind: "table",
          caption: "Mechanical causes",
          head: ["Cause", "What it is", "How to detect and prevent"],
          rows: [
            ["Underexpansion", "The stent has not reached an adequate minimal area, often because of calcium or low deployment pressure; the most important mechanical predictor", "Imaging: compare minimal stent area with reference lumen; prepare calcium before stenting; post-dilate with non-compliant balloons"],
            ["Malapposition", "Struts not in contact with the vessel wall, often in tapering or ectatic segments", "Imaging; post-dilate with an appropriately sized balloon, particularly proximally. Small malapposition in a well-expanded stent seems less important than underexpansion"],
            ["Edge dissection", "A flap at the stent margin that limits flow or exposes thrombogenic tissue", "Inspect edges angiographically and with imaging; treat significant dissections with an additional stent"],
            ["Geographic miss", "The stent does not cover the whole diseased or balloon-injured segment", "Stent from healthy to healthy segment; avoid inflating balloons outside the stented length"],
            ["Inflow or outflow disease, poor runoff", "Significant untreated disease beyond the stent, or a stent ending in a vessel too small to carry adequate flow", "Assess the whole vessel; do not end a long stent in a tiny distal vessel"],
            ["Stent fracture or crush deformity", "Loss of scaffold continuity, more common with long or overlapping stents at hinge points", "Imaging; avoid unnecessary overlap and very long stents"],
          ],
        },
        { kind: "figure", id: "stent-compliance", caption: "Balloon and stent diameter against inflation pressure. Reaching the target diameter needs adequate pressure and, often, post-dilatation with a non-compliant balloon." },
        { kind: "h", text: "Runoff: two cautionary examples" },
        {
          kind: "p",
          text: "A stent needs outflow. Flow through the stent washes away activated platelets and thrombogenic material; if the stented segment drains into a small territory, flow stagnates and thrombus forms. Two scenarios from teaching practice show how this happens.",
        },
        {
          kind: "list",
          items: [
            "Stenting the wrong branch: in an inferior STEMI with VF and right ventricular shock, an operator stented a vessel that ran a smooth, straight course in the LAO view. It was a large acute marginal branch, not the RCA itself. The true distal RCA, which in LAO makes two bends (at the acute margin and again at the crux before giving off the PDA), remained untreated, and the stent in the small marginal territory thrombosed during the procedure.",
            "Stenting to the tip: a patient with stable angina received a very long series of overlapping stents in the LAD, the distal end landing in a tiny apical territory with little flow. Two days later the entire stented segment thrombosed, causing a large anterior infarction in a patient who had started with stable symptoms.",
          ],
        },
        {
          kind: "keypoints",
          title: "Lessons on runoff",
          items: [
            "A smooth, straight vessel arising from the RCA in LAO is an acute marginal until proven otherwise. Confirm the anatomy in RAO and look for the true RCA behind it.",
            "Do not land a long stent in a small-calibre distal vessel supplying little myocardium.",
            "Before treating, ask how much myocardium the stented segment will feed.",
          ],
        },
        { kind: "figure", id: "coronary-tree", caption: "Right coronary anatomy: the true RCA continues in the AV groove to the crux, whereas acute marginal branches run over the right ventricle." },
        { kind: "h", text: "Antiplatelet and patient causes" },
        {
          kind: "table",
          caption: "Non-mechanical contributors",
          head: ["Factor", "Comment"],
          rows: [
            ["Premature cessation or poor adherence", "The strongest clinical predictor of early stent thrombosis; includes interruption for surgery or dental work and cost or side-effect related stopping"],
            ["Reduced response to clopidogrel", "Genetic variation in drug activation and drug interactions; prasugrel or ticagrelor are preferred in ACS when bleeding risk allows"],
            ["Delayed oral absorption", "Opioids, vomiting and shock slow absorption of oral P2Y12 inhibitors in STEMI; consider intravenous options in high-thrombus cases"],
            ["Prothrombotic states", "Acute coronary syndrome, malignancy, heparin-induced thrombocytopenia"],
            ["Low-flow states", "Severe left ventricular dysfunction, hypotension"],
          ],
        },
        { kind: "sim", sim: "pci-bench", task: "Deploy a stent in a calcified segment and image it. Measure the minimal stent area against the reference lumen, identify underexpansion, and correct it with a non-compliant balloon sized to the vessel." },
      ],
    },
    {
      id: "comp-st-management-restenosis",
      title: "Managing stent thrombosis and in-stent restenosis",
      minutes: 8,
      refs: ["esc-acs-2023", "esc-revasc-2018", "eapci-imaging-2018", "brilakis-manual-pci", "hanna-pcm", "mehran-isr-1999"],
      blocks: [
        {
          kind: "steps",
          title: "Stent thrombosis: emergency management",
          items: [
            { title: "Primary PCI pathway", detail: "Treat as STEMI: immediate transfer to the lab, heparin, and a potent P2Y12 inhibitor if not already on one (or a switch from clopidogrel when appropriate)." },
            { title: "Restore flow", detail: "Wire the stent, then balloon dilatation; aspiration thrombectomy in selected high-thrombus cases. Glycoprotein IIb/IIIa inhibitors or cangrelor for bailout." },
            { title: "Image before adding metal", detail: "Use IVUS or OCT to find the mechanism: underexpansion, malapposition, edge dissection, inflow or outflow disease, fracture, or none." },
            { title: "Fix the cause", detail: "High-pressure non-compliant dilatation for underexpansion (with calcium modification if needed); an additional stent only for an edge problem, geographic miss or new disease." },
            { title: "Fix the drugs", detail: "Establish adherence and interruptions; review the choice and duration of antiplatelet therapy; consider platelet-function or genetic testing in selected cases; check the platelet count." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Implanting another stent inside an underexpanded one without correcting the original underexpansion.",
            "Assuming non-adherence without checking for a mechanical cause, or vice versa.",
            "Discharging the patient on the same antiplatelet regimen without review.",
          ],
        },
        { kind: "h", text: "In-stent restenosis" },
        {
          kind: "p",
          text: "Restenosis is gradual re-narrowing of a stented segment. It usually presents as recurrent angina months after PCI, but can present as an acute coronary syndrome, especially when caused by neoatherosclerosis. Drug-eluting stents have made it much less common than in the bare-metal era, but treated restenosis has a higher recurrence rate than a first lesion.",
        },
        {
          kind: "table",
          caption: "Mechanisms of in-stent restenosis",
          head: ["Mechanism", "Comment"],
          rows: [
            ["Neointimal hyperplasia", "Smooth-muscle proliferation; the dominant mechanism with bare-metal stents, suppressed by drug elution"],
            ["Stent underexpansion", "A major mechanical cause with drug-eluting stents; the lumen was never adequate"],
            ["Stent fracture", "Loss of scaffolding and drug delivery at the fracture site"],
            ["Geographic miss and edge injury", "Untreated disease or balloon injury beyond the stent edges"],
            ["Neoatherosclerosis", "New atheroma within the neointima years after implantation; can rupture and cause ACS or very late thrombosis"],
            ["Gaps between stents and local drug or polymer reactions", "Uncovered segments or exaggerated healing responses"],
          ],
        },
        {
          kind: "table",
          caption: "Angiographic patterns (Mehran classification, simplified)",
          head: ["Pattern", "Description"],
          rows: [
            ["I (focal)", "10 mm or less, at a stent edge, gap or body, or multifocal"],
            ["II (diffuse intrastent)", "Longer than 10 mm, confined within the stent"],
            ["III (diffuse proliferative)", "Longer than 10 mm and extending beyond the stent edges"],
            ["IV (occlusive)", "Total occlusion of the stent"],
          ],
        },
        {
          kind: "keypoints",
          title: "Treating restenosis",
          items: [
            "Image first: the mechanism determines the treatment, and underexpansion needs correcting before anything else.",
            "Prepare the lesion with non-compliant, scoring or cutting balloons; intravascular lithotripsy is an option for underexpansion caused by calcium behind the stent.",
            "Then treat with either a new drug-eluting stent or a drug-coated balloon; both are recommended options in the 2018 ESC/EACTS revascularisation guideline.",
            "For recurrent, multilayer restenosis, discuss surgery or other options in the heart team.",
          ],
        },
        {
          kind: "pearl",
          text: "Stent failure is often born on the day of implantation. A well-prepared lesion, a correctly sized and well-expanded stent with good inflow and outflow, and reliable antiplatelet therapy prevent most of what this module describes.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "comp-q-st-1",
      stem: "A patient is readmitted with anterior STEMI 10 days after LAD stenting, and angiography confirms thrombotic occlusion of the stent. How is this classified?",
      options: [
        "Definite, acute stent thrombosis",
        "Definite, subacute stent thrombosis",
        "Probable, late stent thrombosis",
        "Possible, subacute stent thrombosis",
        "Definite, late stent thrombosis",
      ],
      answer: 1,
      explanation:
        "Angiographic confirmation makes it definite, and 10 days falls between 24 hours and 30 days, which is subacute. Acute is within 24 hours and late is between 30 days and 1 year. Probable applies when there is no angiographic or pathological confirmation.",
      difficulty: 1,
      refs: ["hanna-pcm", "cutlip-arc-2007"],
    },
    {
      id: "comp-q-st-2",
      stem: "Which mechanical factor is the strongest predictor of early stent thrombosis?",
      options: ["Small acute malapposition in a well-expanded stent", "Stent underexpansion", "Use of a thin-strut stent", "Direct stenting", "Stent length under 15 mm"],
      answer: 1,
      explanation:
        "Underexpansion, a small minimal stent area relative to the reference, is the most consistent mechanical predictor of stent thrombosis and restenosis. Small acute malapposition in an otherwise well-expanded stent appears much less important, which is why imaging-guided optimisation focuses first on expansion.",
      difficulty: 2,
      refs: ["eapci-imaging-2018"],
    },
    {
      id: "comp-q-st-3",
      stem: "In an inferior STEMI, the stented vessel takes a smooth, straight course in LAO with no sharp distal bend, and the stent thromboses during the case. What is the most likely error?",
      options: [
        "An undersized stent in the true RCA, leaving it malapposed",
        "An acute marginal was stented instead of the true RCA",
        "Inadequate heparin during a long primary PCI procedure",
        "A guide-induced dissection at the RCA ostium",
        "Air embolism from the guide during the stent run",
      ],
      answer: 1,
      explanation:
        "The true dominant RCA has two bends in LAO, at the acute margin and at the crux. A smooth straight vessel is an acute marginal until proven otherwise; stenting it leaves the true territory untreated and drains the stent into a small bed, predisposing it to thrombosis. Heparin should still be checked, but the anatomical clue points to the wrong vessel.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "comp-q-st-4",
      stem: "Why is a long series of stents ending in a tiny distal LAD territory at high risk of thrombosis?",
      options: [
        "Longer stents release more drug, which delays endothelial healing",
        "Poor outflow means slow flow through the stent, so thrombus forms",
        "Distal stents are always malapposed in the small tapering vessel",
        "Small distal vessels cannot be stented with current platforms",
        "Overlapping stents block the septal perforators and slow the flow",
      ],
      answer: 1,
      explanation:
        "Stents depend on brisk flow to wash away activated platelets and fibrin; a stent ending in a small territory has low flow and is prone to thrombosis. Drug elution and septal perforator jailing do not explain the risk.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "comp-q-st-5",
      stem: "After restoring flow in a thrombosed stent, IVUS shows a minimal stent area well below the reference lumen area, with circumferential calcium behind the struts. What is the best next step?",
      options: [
        "Implant a second stent inside the first at nominal pressure to cover the thrombus",
        "Expand the stent first: non-compliant balloon at high pressure or lithotripsy",
        "Leave the result as it is and intensify the antiplatelet therapy only",
        "Give intravenous thrombolysis to clear any residual thrombus in the stent",
        "Perform rotational atherectomy of the stent as the first-line treatment",
      ],
      answer: 1,
      explanation:
        "The mechanism is calcific underexpansion, so the stent must be expanded; calcium modification such as intravascular lithotripsy or high-pressure non-compliant dilatation addresses it. A second stent inside an underexpanded one leaves the problem in place. Antiplatelet review is needed but does not fix the mechanical cause.",
      difficulty: 3,
      refs: ["eapci-imaging-2018", "brilakis-manual-pci"],
    },
    {
      id: "comp-q-st-6",
      stem: "Which is the most important clinical predictor of early stent thrombosis?",
      options: [
        "Premature discontinuation of dual antiplatelet therapy",
        "Use of a proton-pump inhibitor alongside clopidogrel in the first month",
        "Radial access with a 6 Fr sheath for the PCI",
        "Statin therapy started at the time of the procedure",
        "A long history of treated systemic hypertension",
      ],
      answer: 0,
      explanation:
        "Stopping dual antiplatelet therapy early, through non-adherence or interruption, is the strongest clinical predictor of early stent thrombosis. Proton-pump inhibitors are recommended with DAPT to reduce bleeding, and radial access does not predict thrombosis.",
      difficulty: 1,
      refs: ["supplied-medmastery", "esc-acs-2023"],
    },
    {
      id: "comp-q-st-7",
      stem: "Angiography shows in-stent restenosis 15 mm long, extending beyond both stent edges. Which Mehran pattern is this?",
      options: ["Pattern I (focal)", "Pattern II (diffuse intrastent)", "Pattern III (diffuse proliferative)", "Pattern IV (occlusive)"],
      answer: 2,
      explanation:
        "Restenosis longer than 10 mm that extends beyond the stent edges is the diffuse proliferative pattern III. Pattern II is longer than 10 mm but confined within the stent, and pattern IV is a total occlusion. Higher patterns predict higher recurrence after treatment.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "mehran-isr-1999"],
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Optimise a stent with intravascular imaging: confirm full lesion coverage from healthy to healthy segment, correct underexpansion with a non-compliant balloon, and check both edges for dissection." },
  ],
};

// ===========================================================================
// Cases
// ===========================================================================
const caseEllis3: CaseStudy = {
  id: "comp-case-ellis3-perforation",
  title: "Ellis III perforation after post-dilatation",
  trackId: "complications",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "A calcified mid-LAD lesion is stented and post-dilated with an oversized non-compliant balloon, causing an Ellis III perforation, tamponade and the need for a covered stent.",
  presentation:
    "A 74-year-old woman with CCS class III angina despite two anti-anginal drugs and anterior ischaemia on stress perfusion imaging undergoes elective PCI via the right radial artery with a 6 Fr EBU 3.5 guide. Heparin 70 units/kg has been given; ACT 290 seconds. A heavily calcified 85% mid-LAD stenosis was pre-dilated with a 2.5 mm non-compliant balloon and stented with a 3.0 × 22 mm drug-eluting stent. The distal stent looked underexpanded, so it was post-dilated with a 3.5 mm non-compliant balloon at 22 atm, although the distal reference vessel measures about 3.0 mm.",
  findings: [
    "Age 74, female, eGFR 52 mL/min/1.73 m²",
    "Heavily calcified mid LAD; distal reference about 3.0 mm",
    "6 Fr guide via right radial artery",
    "Post-dilatation balloon-to-artery ratio about 1.17 distally at high pressure",
  ],
  steps: [
    {
      id: "s1",
      prompt: "The next injection shows a jet of contrast streaming from the distal stent edge into the pericardial space. BP has fallen from 118/64 to 104/60 mmHg; HR 88 bpm. What is your first action?",
      info: "Ellis III perforation at the distal stent edge. The 3.5 mm NC balloon is still on the wire in the guide.",
      options: [
        { text: "Immediately reinflate a balloon across the perforation at low pressure, just enough to stop flow", best: true, feedback: "Correct. Mechanical control of the leak is the first move and buys time for everything else. Use low pressure; the aim is occlusion, not dilatation.", next: "s2" },
        { text: "Give protamine 50 mg IV straight away", feedback: "Protamine will not seal an Ellis III leak, and with the guide, wire and a fresh stent in the LAD it risks thrombosis. Control the leak with a balloon first.", next: "s2" },
        { text: "Perform pericardiocentesis before doing anything else", feedback: "Drainage may soon be needed, but while the vessel is still bleeding freely the effusion will keep reaccumulating. Seal the leak with a balloon first, then drain if there is tamponade.", next: "s2" },
        { text: "Withdraw the balloon and wire to assess the vessel cleanly", feedback: "Removing the wire loses your route for the tamponading balloon and the covered stent. Never give up wire position in a perforation.", next: "s1-lost-control", stateDelta: {"stability": -25, "flags": ["tamponade"]} },
      ],
    },
    {
      id: "s2",
      prompt: "A balloon is inflated at 4 atm across the perforation. A gentle injection shows no further extravasation. She has chest pain; BP 96/58 mmHg, HR 102 bpm. What next?",
      options: [
        { text: "Declare the perforation, call a second operator and echo, ask for a covered stent and check its guide compatibility, and alert the cardiac surgeon", best: true, feedback: "Correct. With the leak controlled, organise the team: echo to assess for effusion, the definitive device prepared and checked against the guide, and surgical backup informed early.", next: "s3" },
        { text: "Deflate the balloon every 30 seconds to see whether the leak has stopped", feedback: "Frequent deflation lets the vessel bleed each time and gives the hole no chance to seal. Keep the balloon up while you prepare the definitive treatment.", next: "s2-deflation-leak", stateDelta: {"stability": -15, "flags": ["tamponade"]} },
        { text: "Give a full reversing dose of protamine now", feedback: "Full reversal with a guide and wire in the LAD and a newly implanted stent risks thrombosis. Reversal may have a role later once the plan is clear, but it is not the next step.", next: "s3" },
        { text: "Give IV fluid and wait to see whether her blood pressure recovers", acceptable: true, feedback: "Fluid is reasonable support, but on its own it is passive. Use the time the balloon has bought to get echo, the covered stent and help in the room.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "Echo shows a 12 mm circumferential pericardial effusion with right ventricular diastolic collapse. BP 78/45 mmHg, HR 118 bpm. The balloon remains inflated. What do you do?",
      info: "Echo: 12 mm effusion, RV diastolic collapse, plethoric IVC.",
      options: [
        { text: "Perform pericardiocentesis now (subxiphoid, with echo or fluoroscopic guidance) while the balloon stays inflated, and leave a pigtail drain", best: true, feedback: "Correct. Tamponade with hypotension needs immediate drainage. The drain also monitors ongoing bleeding and, where local practice allows, the blood can be autotransfused through a venous sheath.", next: "s4" },
        { text: "Deflate the balloon and deploy a covered stent as quickly as possible", feedback: "The covered stent is not yet in position and deflating now would let the vessel bleed into a heart that is already tamponaded. Drain first, keep the balloon up.", next: "s4" },
        { text: "Start a vasopressor and observe", acceptable: true, feedback: "A vasopressor may support her for a few minutes, but tamponade is a mechanical problem and needs drainage.", next: "s4" },
        { text: "Transfer her immediately to theatre without draining", feedback: "Transfer of a tamponaded, hypotensive patient risks arrest on the way. Drain in the lab first; surgery remains a backup.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "250 mL of blood is drained and BP recovers to 112/70 mmHg. A single-layer covered stent 3.0 × 16 mm is available, but it will not pass through the 6 Fr guide alongside the tamponading balloon. How will you deliver it?",
      options: [
        { text: "Block-and-deliver: obtain second arterial access, engage the left coronary with a second guide, pass a wire past the tear during brief deflation, bring the covered stent up, then swap balloon for covered stent", best: true, feedback: "Correct. This keeps the vessel occluded until the covered stent is in position, so the vessel bleeds for seconds rather than minutes.", next: "s5" },
        { text: "Deflate and withdraw the balloon, then deliver the covered stent through the same guide", acceptable: true, feedback: "This can work, especially with the drain in place, but the vessel bleeds freely during the whole delivery, which may be prolonged in a calcified LAD. A dual-guide approach is safer.", next: "s2-deflation-leak", stateDelta: {"stability": -10, "flags": ["tamponade"]} },
        { text: "Continue intermittent balloon inflations for an hour, hoping it seals", feedback: "A period of prolonged inflation is reasonable while preparing a covered stent, but an Ellis III leak from oversizing rarely seals, and prolonged LAD occlusion causes infarction.", next: "s5" },
        { text: "Coil the LAD at the perforation site", feedback: "Coils are for distal or collateral perforations. Coiling the mid LAD would sacrifice a large territory.", next: "s5" },
      ],
    },
    {
      id: "s5",
      prompt: "The covered stent is deployed across the perforation. Injection shows no extravasation and TIMI 3 flow; a small diagonal has been jailed and lost. The drain produces 20 mL over 15 minutes and BP is stable. ACT is 310 seconds. How do you finish?",
      options: [
        { text: "Confirm the covered stent is well expanded (post-dilate or image), remove equipment, keep the drain, repeat echo, and continue dual antiplatelet therapy; no routine full protamine now the leak is sealed", best: true, feedback: "Correct. The leak is sealed mechanically. Covered stents carry a higher thrombosis risk, so good expansion and uninterrupted DAPT matter, and routine full reversal is unnecessary. The drain stays until output is minimal and echo shows no reaccumulation.", },
        { text: "Give full-dose protamine with the wires still in the LAD", feedback: "Full reversal with equipment in the vessel and a new covered stent invites thrombosis, and the bleeding has already been controlled mechanically." },
        { text: "Remove the pericardial drain before leaving the lab", feedback: "The drain is your early warning of rebleeding. Remove it later once output is minimal and echo is satisfactory." },
        { text: "Stop dual antiplatelet therapy because of the bleeding", feedback: "Stopping DAPT after a covered stent risks stent thrombosis, which is likely to be catastrophic. The bleeding source has been sealed." },
      ],
    },
    {
      "id": "s1-lost-control",
      "kind": "consequence",
      "info": "With wire and balloon out, the leak is uncontrolled: BP 70/40 mmHg, HR 124 bpm, and echo shows a rapidly enlarging effusion.",
      "prompt": "You have lost access to the perforated vessel. What now?",
      "options": [
        {
          "text": "Pericardiocentesis immediately, while a colleague rewires the LAD to place a balloon and then a covered stent",
          "best": true,
          "feedback": "Drain the tamponade and regain the vessel; the wire should never have come out.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Give protamine and wait for the leak to seal",
          "feedback": "An Ellis III perforation will not seal with reversal alone.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Send the patient straight to theatre without drainage",
          "feedback": "Untreated tamponade during transfer is often fatal.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
    {
      "id": "s2-deflation-leak",
      "kind": "consequence",
      "info": "Each deflation shows a fresh jet and the effusion grows. BP 84/50 mmHg.",
      "prompt": "Repeated deflations are feeding the effusion. What do you do?",
      "options": [
        {
          "text": "Keep the balloon inflated, drain the pericardium if needed, and proceed to a covered stent (block-and-deliver if the guide is too small)",
          "best": true,
          "feedback": "Continuous tamponade until definitive sealing; repeated test deflations only add blood to the pericardium.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Continue deflating every 30 seconds to check",
          "feedback": "This keeps the leak going.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Give full-dose protamine with the wires in place",
          "feedback": "Reversal with equipment in the vessel risks thrombosis; seal first.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "The perforation was sealed with a covered stent after drainage of tamponade. A small diagonal branch was lost with a modest troponin rise. The drain was removed the next day after minimal output and a stable echo, and she was discharged on dual antiplatelet therapy with outpatient review.",
  outcomeVariants: [
    {
      "flag": "tamponade",
      "text": "Loss of control of the perforation allowed a larger tamponade and a longer period of hypotension."
    }
  ],
  learningPoints: [
    "Oversized post-dilatation at high pressure in a calcified vessel is a classic cause of large-vessel perforation; size non-compliant balloons close to 1:1.",
    "The first move is always a balloon across the leak; the team, echo, drainage and covered stent follow.",
    "Tamponade with hypotension needs drainage in the lab, with the balloon still inflated.",
    "Block-and-deliver through a second guide minimises bleeding time when the covered stent and balloon cannot share one guide.",
    "Once sealed mechanically, routine full heparin reversal is unnecessary and may cause thrombosis of the new covered stent.",
  ],
  refs: ["ellis-1994", "seattle-complications-2020", "supplied-medmastery", "brilakis-manual-pci"],
};

const caseSvgNoReflow: CaseStudy = {
  id: "comp-case-svg-noreflow",
  title: "No-reflow after vein graft stenting",
  trackId: "complications",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "Direct stenting of a degenerated saphenous vein graft causes no-reflow with hypotension, managed by excluding mechanical causes and delivering intracoronary drugs distally.",
  presentation:
    "A 79-year-old man who had CABG 14 years ago (LIMA to LAD, vein grafts to the obtuse marginal and RCA) presents with an NSTEMI. Angiography shows a patent LIMA, an occluded native circumflex, and a degenerated vein graft to the obtuse marginal with a hazy, thrombus-containing 90% mid-graft stenosis. LVEF is 40%. He is loaded with aspirin and ticagrelor; a 6 Fr right radial approach is used; heparin given, ACT 280 seconds.",
  findings: [
    "Degenerated, friable vein graft to OM with thrombus",
    "Native circumflex occluded; LIMA to LAD patent",
    "LVEF 40%",
    "BP 128/72 mmHg, HR 72 bpm at the start",
  ],
  steps: [
    {
      id: "s1",
      prompt: "How will you approach PCI of this degenerated vein graft?",
      options: [
        { text: "Use distal embolic protection if there is a suitable landing zone, direct stent with modest sizing, avoid aggressive post-dilatation, and have a microcatheter and vasodilators ready", best: true, feedback: "Correct. Vein grafts are prone to distal embolisation; protection where feasible, direct stenting, modest sizing and preparation for no-reflow are the main preventive measures.", next: "s2" },
        { text: "Pre-dilate with a balloon larger than the graft, stent, then post-dilate at high pressure", feedback: "Aggressive dilatation of friable graft atheroma releases debris and makes no-reflow more likely.", next: "s2-postdilated", stateDelta: {"stability": -15, "flags": ["more-embolisation"]} },
        { text: "Routine aspiration thrombectomy then stent without other precautions", feedback: "Aspiration has a limited role and does not replace the other preventive measures. Plan for no-reflow before you start.", next: "s2" },
        { text: "Refer for redo CABG instead", feedback: "Redo surgery with a patent LIMA carries substantial risk and is rarely the first choice for a single culprit vein graft lesion. PCI with precautions is reasonable here.", next: "s2" },
      ],
    },
    {
      id: "s2",
      prompt: "The distal anastomosis is too close for a filter. The lesion is direct stented with a 4.0 × 18 mm stent. The graft is now widely patent, but contrast stagnates and the native OM barely fills. He has chest pain and lateral ST elevation; BP 92/58 mmHg, HR 64 bpm. What is your first step?",
      info: "TIMI 1 flow beyond the graft. No obvious filling defect in the stent on the working view.",
      options: [
        { text: "Exclude a mechanical cause: check stent edges and the distal graft in two views for dissection or thrombus, and check the ACT", best: true, feedback: "Correct. No-reflow is a diagnosis made once dissection, thrombus and other mechanical obstruction have been excluded. Mechanical problems need mechanical fixes.", next: "s3" },
        { text: "Post-dilate the stent at high pressure", feedback: "Further dilatation releases more debris and worsens no-reflow.", next: "s2-postdilated", stateDelta: {"stability": -15, "flags": ["more-embolisation"]} },
        { text: "Give intracoronary nitroglycerin 200 micrograms through the guide", feedback: "Nitroglycerin acts mainly on epicardial vessels, will drop his blood pressure further, and given into a non-flowing graft through the guide will mostly reflux into the aorta.", next: "s3" },
        { text: "Implant a second stent distally", feedback: "There is no lesion to stent; more metal will not restore microvascular flow.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "No dissection or thrombus is seen, the stent is well expanded and the ACT is 275 seconds. How will you deliver treatment?",
      options: [
        { text: "Advance a microcatheter to the distal graft near the anastomosis and inject drugs through it", best: true, feedback: "Correct. Distal delivery puts the drug where the microvascular obstruction is; without forward flow, proximal injections wash back into the aorta.", next: "s4" },
        { text: "Inject drugs through the guide", feedback: "With little forward flow, drug injected at the graft ostium refluxes and never reaches the microcirculation.", next: "s3-guide-drugs", stateDelta: {"stability": -10} },
        { text: "Give intravenous vasodilators", feedback: "Systemic vasodilators lower blood pressure without delivering an effective dose to the affected microcirculation.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "The microcatheter is in the distal graft. BP has drifted to 84/50 mmHg; HR 58 bpm. Which agent is the best first choice?",
      options: [
        { text: "Intracoronary adrenaline in small microgram boluses per local protocol", best: true, feedback: "Correct. Adrenaline dilates the microvasculature through beta-2 effects while supporting blood pressure, which suits hypotensive no-reflow.", next: "s5" },
        { text: "Intracoronary adenosine boluses", acceptable: true, feedback: "Adenosine is a reasonable microvascular vasodilator and short-acting, but it can cause transient AV block and a fall in pressure in an already hypotensive, slightly bradycardic patient.", next: "s5" },
        { text: "Intracoronary verapamil", feedback: "Verapamil can worsen bradycardia, cause AV block and depress contractility; with HR 58 and BP 84/50 it is a poor first choice without pacing back-up.", next: "s5" },
        { text: "Intracoronary nitroprusside", feedback: "Nitroprusside is effective on resistance vessels but will lower systemic pressure further at a time when he is already hypotensive.", next: "s5" },
      ],
    },
    {
      id: "s5",
      prompt: "After two boluses flow improves to TIMI 2, and with further vasodilator it reaches TIMI 3. BP 108/64 mmHg; the ST elevation is resolving. How do you finish?",
      options: [
        { text: "Stop: no further balloon inflations, remove equipment, continue antiplatelet therapy, check troponin and echo, and document the event", best: true, feedback: "Correct. The aim now is to avoid releasing more debris. Monitor for infarct size and left ventricular function.", },
        { text: "Post-dilate to improve stent apposition before finishing", feedback: "In a vein graft that has just had no-reflow, further dilatation is likely to cause a recurrence." },
        { text: "Stop ticagrelor because of the no-reflow", feedback: "No-reflow is not a reason to stop antiplatelet therapy; stopping it increases the risk of stent thrombosis." },
      ],
    },
    {
      "id": "s2-postdilated",
      "kind": "consequence",
      "info": "After the high-pressure inflation, the distal graft fills even less and the patient's ST elevation worsens. BP 82/48 mmHg.",
      "prompt": "More balloon work has embolised more debris. What now?",
      "options": [
        {
          "text": "Stop balloon work; microcatheter to the distal graft and give adrenaline (if hypotensive) and vasodilators distally",
          "best": true,
          "feedback": "The microvasculature is the problem; deliver drugs there.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Implant another stent distally",
          "feedback": "No mechanical lesion has been found; more stents release more debris.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Start a GP IIb/IIIa inhibitor and finish",
          "acceptable": true,
          "feedback": "May help with platelet-rich material but does not treat microvascular obstruction from debris.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
    {
      "id": "s3-guide-drugs",
      "kind": "consequence",
      "info": "After 200 micrograms of adenosine through the guide, BP falls and the native OM still barely fills; contrast refluxes into the aorta.",
      "prompt": "Why did it not work, and what next?",
      "options": [
        {
          "text": "With no forward flow the drug refluxed; deliver it through a microcatheter in the distal graft",
          "best": true,
          "feedback": "Distal delivery puts drug where it is needed.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Double the dose through the guide",
          "feedback": "Larger doses reflux too and cause systemic hypotension.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Give an intravenous vasodilator",
          "feedback": "Systemic vasodilators drop pressure without reaching the obstructed bed.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "Flow was restored with distally delivered adrenaline and adenosine. Peak troponin was moderately raised, with a small new lateral wall-motion abnormality on echo. He was discharged on dual antiplatelet therapy.",
  outcomeVariants: [
    {
      "flag": "more-embolisation",
      "text": "Aggressive balloon work in a degenerated vein graft worsened the embolisation and the infarct."
    }
  ],
  learningPoints: [
    "Degenerated vein grafts are a high-risk substrate for no-reflow; plan prevention and treatment before stenting.",
    "Exclude a mechanical cause before treating no-reflow with drugs.",
    "Deliver vasodilators distally through a microcatheter, not through the guide.",
    "Choose the agent according to haemodynamics: adrenaline when hypotensive, caution with verapamil in bradycardia.",
    "After no-reflow resolves, stop dilating.",
  ],
  refs: ["supplied-medmastery", "seattle-complications-2020", "brilakis-manual-pci", "timi-1985"],
};

const caseRetroperitoneal: CaseStudy = {
  id: "comp-case-retroperitoneal",
  title: "Falling haemoglobin and back pain after femoral PCI",
  trackId: "complications",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "After a high femoral puncture, a patient becomes hypotensive on the ward with back pain and a falling haemoglobin from a retroperitoneal bleed that needs endovascular control.",
  presentation:
    "A 64-year-old woman (BMI 21) with an NSTEMI underwent PCI of the RCA with one drug-eluting stent. Right radial access failed because of severe spasm, so a 6 Fr right femoral sheath was placed using surface landmarks without fluoroscopy or ultrasound. Heparin 100 units/kg was given. The sheath was removed at the end with a collagen-plug closure device without a femoral angiogram. She is on aspirin and ticagrelor. Three hours later the ward nurse calls.",
  findings: [
    "Low body weight, female",
    "Landmark-guided femoral puncture, no sheath angiogram",
    "Full heparin dose, dual antiplatelet therapy",
    "Pre-procedure haemoglobin 128 g/L",
  ],
  steps: [
    {
      id: "s1",
      prompt: "HR 112 bpm, BP 86/50 mmHg. She complains of right-sided back and flank pain. The groin is soft with no haematoma. Haemoglobin is 98 g/L. What do you do first?",
      options: [
        { text: "Call for help, insert two large-bore cannulas, give fluid, send a cross-match, stop any anticoagulant, and get an ECG and bedside echo while treating this as a probable retroperitoneal bleed", best: true, feedback: "Correct. Resuscitate and think of the hidden bleed. ECG and echo quickly exclude reinfarction and tamponade.", next: "s2" },
        { text: "Give IV metoprolol for the tachycardia", feedback: "The tachycardia is compensatory; a beta-blocker could precipitate cardiovascular collapse in a bleeding patient.", next: "s2" },
        { text: "Treat as a vasovagal reaction with atropine", feedback: "Vagal reactions cause bradycardia, not tachycardia, and do not lower the haemoglobin.", next: "s2" },
        { text: "Arrange a groin ultrasound for the morning", feedback: "Delaying assessment of a hypotensive patient with a falling haemoglobin risks death from occult haemorrhage.", next: "s1-missed-bleed", stateDelta: {"stability": -20, "flags": ["bleed-delay"]} },
      ],
    },
    {
      id: "s2",
      prompt: "The ECG is unchanged and echo shows no pericardial effusion. After 1 litre of fluid, BP is 114/70 mmHg and HR 96 bpm, and she stays stable on repeated checks. What is the next investigation?",
      options: [
        { text: "Urgent CT angiography of the abdomen and pelvis", best: true, feedback: "Correct. She is now haemodynamically stable, so CT is the route: it confirms the retroperitoneal haematoma and shows whether there is active extravasation and from where. Had she stayed hypotensive, she would have gone straight to the catheter laboratory or theatre rather than waiting for a scan, because delays for CT have preceded deaths.", next: "s3" },
        { text: "Groin duplex ultrasound only", feedback: "Duplex is good for pseudoaneurysm and fistula but poor at assessing the retroperitoneum.", next: "s2-duplex-only", stateDelta: {"stability": -10} },
        { text: "Repeat coronary angiography", feedback: "Nothing points to a coronary cause; the falling haemoglobin points to bleeding.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "CT shows a large right retroperitoneal haematoma with active extravasation from the external iliac artery just above the inguinal ligament. Despite 2 units of red cells, BP is 84/48 mmHg. What about antithrombotic therapy?",
      info: "The puncture was above the lowest point of the inferior epigastric artery: a high puncture.",
      options: [
        { text: "Reverse residual heparin with protamine, continue transfusion, arrange immediate source control, and make antiplatelet decisions with senior input, aiming not to stop both agents hours after stenting", best: true, feedback: "Correct. Remove the reversible drug and control the source. Stopping both antiplatelet agents within hours of stenting carries a high stent thrombosis risk; if the bleeding can be controlled mechanically that may not be needed.", next: "s4" },
        { text: "Stop aspirin and ticagrelor indefinitely", feedback: "Stopping both agents hours after stent implantation risks stent thrombosis. The answer is to control the bleeding point.", next: "s4" },
        { text: "Give platelets and stop all antiplatelet drugs before anything else", feedback: "Platelet transfusion may have a role in uncontrolled life-threatening bleeding, but source control is the priority and blanket withdrawal risks stent thrombosis.", next: "s4" },
        { text: "Continue heparin to protect the new stent", feedback: "Ongoing anticoagulation in an actively bleeding, hypotensive patient is dangerous, and heparin is not required after uncomplicated PCI.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "How will you control the bleeding?",
      options: [
        { text: "Endovascular: contralateral access, cross over, inflate a balloon across the bleeding point, and place a covered stent if extravasation persists", best: true, feedback: "Correct. Balloon tamponade controls bleeding immediately, and a covered stent seals the external iliac tear without open surgery.", next: "s5" },
        { text: "Manual compression of the groin", feedback: "The bleeding point is above the inguinal ligament in the external iliac artery, which cannot be compressed against bone.", next: "s4-compression-futile", stateDelta: {"stability": -15} },
        { text: "Open surgical repair as first-line", acceptable: true, feedback: "Surgery is a valid option if endovascular expertise is unavailable or fails, but in a patient on dual antiplatelet therapy endovascular control is usually faster and less invasive.", next: "s5" },
        { text: "Continue conservative management with transfusion only", feedback: "Active extravasation with persistent hypotension despite transfusion needs source control.", next: "s5" },
      ],
    },
    {
      id: "s5",
      prompt: "Balloon tamponade for 10 minutes reduces but does not stop the leak; a covered stent seals it. BP 118/70 mmHg; haemoglobin stable at 86 g/L after transfusion. What else should happen before discharge?",
      options: [
        { text: "Explain openly to the patient what happened, continue dual antiplatelet therapy with a proton-pump inhibitor, monitor haemoglobin and the limb, and review the case: radial-first, fluoroscopy and ultrasound-guided puncture, sheath angiogram before closure", best: true, feedback: "Correct. Open disclosure, safe ongoing antiplatelet therapy and a team review of how the puncture height went unchecked are all part of good practice.", },
        { text: "Discharge the next day without follow-up", feedback: "After a major bleed with transfusion and a covered stent she needs haemoglobin and limb monitoring and follow-up." },
        { text: "Switch ticagrelor to no P2Y12 inhibitor and aspirin alone for the next year", feedback: "Antiplatelet changes after a bleed should be deliberate and individualised; dropping the P2Y12 inhibitor entirely soon after an NSTEMI stent increases ischaemic risk." },
      ],
    },
    {
      "id": "s1-missed-bleed",
      "kind": "consequence",
      "info": "Overnight she becomes confused with BP 68/38 mmHg and haemoglobin 71 g/L.",
      "prompt": "Waiting for the morning scan has cost time. What now?",
      "options": [
        {
          "text": "Major haemorrhage protocol, stop antithrombotics, urgent CT angiography and interventional radiology",
          "best": true,
          "feedback": "Resuscitate and find the source in parallel.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Fluids and a groin ultrasound now",
          "feedback": "The groin is soft; the bleed is retroperitoneal and needs CT.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Noradrenaline infusion and recheck the haemoglobin in four hours",
          "feedback": "Masking hypovolaemia with pressors delays control.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s2-duplex-only",
      "kind": "consequence",
      "info": "The groin duplex shows no pseudoaneurysm or haematoma. BP 86/50 mmHg after a second litre of fluid.",
      "prompt": "The duplex is normal. What do you do?",
      "options": [
        {
          "text": "Urgent CT angiography of the abdomen and pelvis: a normal groin does not exclude a retroperitoneal bleed",
          "best": true,
          "feedback": "High punctures bleed into the retroperitoneum, out of sight of a groin scan.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Reassure and continue observation",
          "feedback": "Ongoing hypotension with a falling haemoglobin is bleeding until proven otherwise.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Repeat coronary angiography to exclude stent thrombosis",
          "feedback": "The picture is haemorrhagic, not ischaemic.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
    {
      "id": "s4-compression-futile",
      "kind": "consequence",
      "info": "After 20 minutes of groin pressure, BP is 74/40 mmHg and the patient needs a third unit of blood.",
      "prompt": "Compression is failing. Why, and what next?",
      "options": [
        {
          "text": "The bleed is from the external iliac above the ligament; proceed to endovascular balloon tamponade and a covered stent",
          "best": true,
          "feedback": "There is no bony backstop above the ligament; endovascular control is needed.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Compress for longer with a mechanical device",
          "feedback": "The bleeding point cannot be reached by external pressure.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Give protamine and platelets and wait",
          "acceptable": true,
          "feedback": "Correcting coagulation helps, but active arterial bleeding needs source control.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
  ],
  outcome:
    "The external iliac bleed was sealed with a covered stent. She received three units of red cells in total, recovered without limb ischaemia, and was discharged on dual antiplatelet therapy with a proton-pump inhibitor. The event was discussed at the departmental morbidity and mortality meeting.",
  outcomeVariants: [
    {
      "flag": "bleed-delay",
      "text": "Delayed recognition of the retroperitoneal bleed led to more transfusion and organ dysfunction."
    }
  ],
  learningPoints: [
    "Retroperitoneal haemorrhage is hidden: hypotension, back or flank pain and a falling haemoglobin with a normal groin should prompt it.",
    "High puncture above the inferior epigastric artery is the main risk factor; use fluoroscopy, ultrasound and a sheath angiogram.",
    "CT confirms the diagnosis and shows active bleeding.",
    "Endovascular balloon tamponade and covered stenting control external iliac bleeding effectively.",
    "Antiplatelet decisions after bleeding soon after stenting must weigh stent thrombosis risk and involve senior input.",
  ],
  refs: ["supplied-medmastery", "brilakis-manual-pci", "matrix-2015", "ellis-retroperitoneal-2006"],
};

const caseLmStentLoss: CaseStudy = {
  id: "comp-case-lm-stent-loss",
  title: "Stent lost in the left main",
  trackId: "complications",
  stage: 4,
  provenance: { kind: "synthetic" },
  summary:
    "An undeployed stent is stripped from its balloon at the guide tip after forceful attempts to cross a poorly prepared calcified circumflex lesion, and is retrieved with the small-balloon technique.",
  presentation:
    "A 68-year-old man with stable angina undergoes PCI of a calcified 80% proximal circumflex stenosis just beyond an angulated left main bifurcation. The left main is large (about 4.5 mm) and disease-free. Access is right radial with a 6 Fr EBU 3.5 guide. The lesion was pre-dilated only with a 2.0 mm semi-compliant balloon. A 2.75 × 15 mm stent would not pass the proximal bend; after repeated pushing, the guide backed out of the left main. As the operator pulled the stent back non-coaxially, it caught on the guide tip and came off the balloon.",
  findings: [
    "Stent undeployed, still on the guidewire",
    "Stent lying in the left main, its proximal end at the ostium and partly in the aorta",
    "TIMI 3 flow in the LAD and circumflex",
    "BP 132/78 mmHg, HR 74 bpm, no chest pain",
  ],
  steps: [
    {
      id: "s1",
      prompt: "The stent is off its balloon, on the wire, sitting in the left main and protruding into the aorta. What is your first action?",
      options: [
        { text: "Stop pulling, keep the wire exactly where it is, declare the problem and call for help; check the ACT", best: true, feedback: "Correct. The wire through the stent is your control. Stop, stabilise, tell the team and get help before choosing a retrieval technique.", next: "s2" },
        { text: "Remove the wire and guide to start again", feedback: "Removing the wire frees the stent, which may embolise to the brain or periphery or lodge across the left main bifurcation.", next: "s1-wire-removed", stateDelta: {"stability": -25, "flags": ["stent-embolised"]} },
        { text: "Deploy the stent where it is with a 2.75 mm balloon", feedback: "A 2.75 mm stent cannot be expanded safely to the 4.5 mm left main; it would be malapposed or fracture, and it sits partly in the aorta.", next: "s2" },
        { text: "Crush it against the left main wall with a large balloon", feedback: "Crushing a stent in the left main would leave metal across the bifurcation and threaten both the LAD and circumflex ostia.", next: "s2" },
      ],
    },
    {
      id: "s2",
      prompt: "Which retrieval technique would you try first?",
      options: [
        { text: "Small-balloon technique: pass a very small balloon through the stent on the same wire, inflate it just distal to the stent at low pressure and pull back gently", best: true, feedback: "Correct. It uses the existing wire, is quick and is the least traumatic first option when the stent remains on the wire.", next: "s3" },
        { text: "Snare the protruding proximal end via a femoral sheath", acceptable: true, feedback: "Reasonable, since snaring works best when the stent hangs out of an ostium, but it needs extra access and kit; the small-balloon technique is a simpler first attempt.", next: "s3" },
        { text: "Twisted-wire technique with two additional wires", acceptable: true, feedback: "A valid fallback, but more complex than the small-balloon technique for a stent still on the wire.", next: "s3" },
        { text: "Leave it and finish the circumflex PCI", feedback: "An undeployed stent at the left main ostium protruding into the aorta is a thrombotic and embolic hazard and blocks further work.", next: "s3" },
      ],
    },
    {
      id: "s3",
      prompt: "A 1.5 mm balloon passes through the stent and is inflated distally at 4 atm. On traction the stent moves back to the guide tip but will not enter the 6 Fr guide; it now sits at the guide tip in the ascending aorta. What next?",
      options: [
        { text: "Keep the balloon inflated and withdraw guide, wire, balloon and stent together as one unit under fluoroscopy; if it catches in the arm, snare it via a femoral sheath", best: true, feedback: "Correct. Moving the whole assembly as a unit keeps the stent trapped on the balloon. If it will not pass a narrow arm artery, femoral snaring with a larger sheath is the backup.", next: "s4" },
        { text: "Deflate the balloon and pull the wire back", feedback: "This releases the stent into the aorta, where it may embolise to the brain or legs.", next: "s3-deflated-lost", stateDelta: {"stability": -15, "flags": ["stent-embolised"]} },
        { text: "Push the stent back into the left main and deploy it", feedback: "Deploying an undersized stent in the left main is not acceptable, and repeated manipulation at the ostium risks dissection.", next: "s4" },
      ],
    },
    {
      id: "s4",
      prompt: "The assembly comes back to the radial sheath, where the stent catches. Sheath and assembly are removed together, the stent is retrieved intact and radial haemostasis is achieved. What now?",
      options: [
        { text: "Re-establish access (for example femoral or left radial) and image the left main in several views, with IVUS if any doubt, to exclude injury from the retrieval", best: true, feedback: "Correct. Dragging a stent across the ostium can strip intima or dissect the left main; check before doing anything else.", next: "s5" },
        { text: "End the procedure without further imaging", feedback: "A retrieval across the left main ostium can cause injury that must be detected now, not when the patient deteriorates.", next: "s5" },
        { text: "Immediately retry the same stent through the same preparation", feedback: "Nothing has changed: the lesion is still poorly prepared and support still inadequate.", next: "s4-retry-same", stateDelta: {"stability": -10} },
      ],
    },
    {
      id: "s5",
      prompt: "The left main is undamaged on angiography and IVUS. How do you complete the circumflex PCI?",
      options: [
        { text: "Improve lesion preparation (non-compliant or scoring balloon, calcium modification if needed) and support (guide extension or stronger guide) before attempting a stent again, or stop and return another day", best: true, feedback: "Correct. Stent loss was caused by inadequate preparation and support; correcting both is the only safe way to deliver a stent. Stopping is also a sound choice after a stressful complication.", },
        { text: "Push a stent harder with a buddy wire alone", feedback: "More force without better preparation is how the stent was lost in the first place." },
        { text: "Leave the lesion untreated and never revisit it", feedback: "The indication has not changed. Deferring is reasonable, but the patient still needs a plan for symptomatic disease." },
      ],
    },
    {
      "id": "s1-wire-removed",
      "kind": "consequence",
      "info": "With the wire out, the stent is no longer seen at the left main. Fluoroscopy of the abdomen and legs shows it lodged in the right common iliac artery.",
      "prompt": "The stent has embolised peripherally. What now?",
      "options": [
        {
          "text": "Check the left main and the patient; then retrieve the stent from the iliac with a snare via femoral access, or deploy it against the wall if retrieval fails",
          "best": true,
          "feedback": "Peripheral embolisation is usually manageable; keeping the wire would have prevented it.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Ignore it; peripheral stents cause no harm",
          "feedback": "An unsecured stent can migrate or cause thrombosis.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Refer for surgical retrieval immediately",
          "acceptable": true,
          "feedback": "Surgery is a backup if percutaneous retrieval fails.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
    {
      "id": "s3-deflated-lost",
      "kind": "consequence",
      "info": "After deflating the balloon, the stent slides off the wire tip into the aorta and is lost from view.",
      "prompt": "What now?",
      "options": [
        {
          "text": "Image the aorta and peripheral arteries to find it, then snare it from a femoral approach",
          "best": true,
          "feedback": "Locate first, then retrieve; the inflated balloon should have stayed up during withdrawal.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Continue the circumflex PCI and look for the stent later",
          "feedback": "An embolised stent must be located and dealt with promptly.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Assume it has dissolved",
          "feedback": "Metal stents do not dissolve.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s4-retry-same",
      "kind": "consequence",
      "info": "The same type of stent again stops at the calcified circumflex segment and starts to deform on the guide tip.",
      "prompt": "What should change?",
      "options": [
        {
          "text": "Withdraw it into the guide carefully, prepare the lesion properly (NC, scoring or calcium modification) and add support",
          "best": true,
          "feedback": "The cause was poor preparation; repeating the same attempt repeats the risk.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Push harder",
          "feedback": "Forcing a stent into an unprepared lesion is how it was lost the first time.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Deploy it where it stops",
          "feedback": "A stent deployed short of the lesion helps nobody.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "The stent was retrieved intact and the left main was undamaged. After cutting-balloon and non-compliant balloon preparation, a guide extension allowed easy delivery of a new stent. He was discharged the next day.",
  outcomeVariants: [
    {
      "flag": "stent-embolised",
      "text": "Losing control of the stent turned a retrieval into a search of the arterial tree."
    }
  ],
  learningPoints: [
    "Stent loss usually follows forcing a stent through a poorly prepared lesion and pulling it back non-coaxially into the guide.",
    "Keep the wire through a lost stent; it is the key to retrieval.",
    "Do not deploy an undersized stent in a large vessel such as the left main.",
    "The small-balloon technique is a simple first option; snaring and twisted wires are backups.",
    "Always image the vessel after retrieval for injury.",
  ],
  refs: ["supplied-medmastery", "brilakis-manual-pci", "seattle-complications-2020"],
};

// ===========================================================================
// Track
// ===========================================================================
export const complications: Track = {
  id: "complications",
  order: 6,
  title: "Complications",
  tagline: "Prevent, recognise early, treat decisively",
  description:
    "How to prevent, recognise and manage the complications of PCI: perforation, dissection and abrupt closure, no-reflow, equipment loss, access and systemic complications, and stent failure. Built around a simple doctrine: be prepared, have a plan, communicate, and know your bailout.",
  stage: 4,
  modules: [principles, perforation, dissectionFlow, equipment, systemicAccess, stentFailure],
  cases: [caseEllis3, caseSvgNoReflow, caseRetroperitoneal, caseLmStentLoss],
};
