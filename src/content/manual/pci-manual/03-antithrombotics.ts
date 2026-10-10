// Module pm-antithrombotics: anticoagulants and antiplatelet drugs (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.3, 1.4, 2.3, 2.8, 3.1, 3.4, 3.5, 4.1, 4.2, 4.3, 5.5, 7.2, 11.1, 11.2, 18.3, 20.3, 20.9,
// 21.3, 22.1, 25.2, 26.2, 26.4, 29.1, 30.3; Oxford Handbook of Cardiac Catheterization and Coronary Intervention,
// chapters 1, 2, 3, 4, 8, 9, 10, 11. Eleven new references, checked on PubMed or DailyMed (see refs below).
// Every claim is listed with its page in docs/curriculum/evidence/pm-antithrombotics.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-antithrombotics",
  title: "Anticoagulants and antiplatelet drugs",
  stage: 3,
  summary:
    "The antithrombotic side of every PCI, taught as a sequence of decisions: how much heparin and when, how to run and read the ACT on your lab's machine, what to do when it is low, how and when to reverse it; when heparin cannot be used and what replaces it; how to bring a patient on warfarin or a DOAC safely to the lab; which oral antiplatelet agent, at what dose and when to load it, and how to switch; and when to reach for, and when to avoid, a GP IIb/IIIa inhibitor or cangrelor.",
  objectives: [
    "Choose an unfractionated heparin dose for the procedure in front of you, time and interpret the ACT against the target for your device, and correct a low ACT before any device enters the coronary artery.",
    "Decide when to reverse heparin with protamine, calculate a dose within the manuals' limits, give it safely and recognise a protamine reaction.",
    "Use bivalirudin correctly, including its renal dosing, ACT targets and lack of an antidote; recognise the two types of heparin-induced thrombocytopenia; and explain where low-molecular-weight heparin and fondaparinux fit.",
    "Plan the anticoagulant hold, bridging and access route for a patient taking warfarin or a DOAC, comparing the two manuals' rules.",
    "Select and load aspirin and a P2Y12 inhibitor for stable and acute presentations, screen for contraindications, apply the pretreatment rules, and switch between agents correctly.",
    "Use GP IIb/IIIa inhibitors and cangrelor as bail-out agents with the right heparin dose, know the settings in which they cause harm, and convert from cangrelor to an oral P2Y12 inhibitor.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-antithrombotics-heparin",
      title: "Unfractionated heparin: the dose, the ACT and reversal",
      minutes: 16,
      topics: ["ph-heparin-act"],
      sources: [
        { book: "brilakis-pci", loc: "3.4" },
        { book: "brilakis-pci", loc: "2.8" },
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "11.2" },
        { book: "brilakis-pci", loc: "20.3" },
        { book: "brilakis-pci", loc: "21.3" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "26.2" },
        { book: "brilakis-pci", loc: "30.3" },
        { book: "oxford-cath", loc: "ch 8: Anticoagulation therapy" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "oxford-cath", loc: "ch 2: The cardiologist" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 10: Cardiac tamponade" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Every sheath, guide, wire, balloon and stent you put into an artery is a surface on which clot can grow. Brilakis gives heparin two jobs: to stop thrombus forming in the coronary artery and on that equipment, and, when you work from the wrist, to lower the chance that the radial artery occludes afterwards. Oxford describes how it works: heparin activates antithrombin III, which then inactivates thrombin and other procoagulant proteases, factor Xa among them. The headline doses are in the foundation lessons; this lesson follows the drug through a case, one decision at a time.",
        },
        { kind: "h", text: "Step 1: choose the dose for this procedure" },
        {
          kind: "table",
          caption: "Typical unfractionated heparin doses in the manuals. Orientation only: follow your local protocol.",
          head: ["Situation", "Typical dose", "Where it comes from"],
          rows: [
            ["PCI with no GP IIb/IIIa inhibitor and no cangrelor", "70–100 units/kg as a bolus", "Brilakis 3.4 and 20.3. Oxford gives the same range, at the operator's discretion, and describes it given intra-arterially"],
            ["PCI with a GP IIb/IIIa inhibitor or cangrelor", "50–70 units/kg", "Brilakis 3.4 and 20.3: the lower dose matches a lower ACT target (step 3)"],
            ["Diagnostic study from the radial artery", "Usually 50 units/kg, to a maximum of 5000 units, given IV; Brilakis notes that 100 units/kg may protect the radial artery better", "Brilakis 4.3, sheath step 9. Oxford gives an example cocktail, injected into the radial artery before catheterisation, of heparin 2500 IU with verapamil 2.5 mg and GTN 200–400 µg, and stresses that regimens vary"],
            ["Renal failure", "No dose change", "Brilakis 3.4"],
          ],
        },
        {
          kind: "p",
          text: "**Why the dose fades unevenly.** Brilakis puts the half-life of unfractionated heparin at 1–2 hours, but it lengthens as the dose rises: roughly 30 minutes after a 25 units/kg bolus, 60 minutes after 100 units/kg and 150 minutes after 400 units/kg. Oxford, in its protamine section, uses 60–90 minutes. The practical point is that the protection you start with is not the protection you have an hour later, and only a measurement tells you where you are.",
        },
        {
          kind: "p",
          text: "**A timing decision at the wrist.** If the radial or subclavian route is extremely tortuous, Brilakis may hold the heparin until the catheter has actually reached the aortic root. The reason is the next step: engagement through such an arm can fail, and puncturing the femoral artery after the patient has been anticoagulated (radial-to-femoral crossover) carries a higher bleeding risk and needs meticulous technique (Brilakis 4.1).",
        },
        { kind: "tip", id: "access-radial-heparin-timing" },
        { kind: "tip", id: "diag-delay-heparin-tortuous-arm" },
        { kind: "h", text: "Step 2: from bolus to wire" },
        {
          kind: "steps",
          title: "Getting to a therapeutic ACT before the coronary is wired",
          items: [
            {
              title: "Give the bolus through a line you trust",
              detail:
                "Note the time. Brilakis lists three causes of a low ACT, without ranking them: a drug that never reached the circulation (for example because the IV cannula has failed or tissued), a dose that was too low, and reduced antithrombin III. A working line and a weight-based dose prevent the first two.",
            },
            {
              title: "Measure the ACT about 5 minutes later",
              detail:
                "Brilakis checks it 5 minutes after the anticoagulant is given, to confirm adequate anticoagulation before PCI proceeds; the foundation lesson on anticoagulation in the lab checks at about 10 minutes. Read it against the target for your machine (step 3).",
            },
            {
              title: "If it is below target, top up and measure again",
              detail:
                "Give more anticoagulant (through the arterial sheath if you doubt the IV line) and repeat the ACT. Until the value is in range, no guidewire, balloon or stent goes into the coronary artery: Brilakis is explicit that this is how coronary thrombotic complications are avoided.",
            },
            {
              title: "Recheck every 20–30 minutes",
              detail:
                "Brilakis's interval for both monitoring and bleeding prevention. Oxford shares the job out: the cardiologist is responsible for regular ACT control, the circulating nurse makes sure ACTs are measured and heparin is redosed on time, and the cardiac physiologist tracks the time since the last heparin dose and last ACT and tells the operator when the next is due.",
            },
            {
              title: "Carry the ACT through every hand-over",
              detail:
                "When a diagnostic study becomes an ad hoc PCI, the heparin given at the start may be well past its peak. Treat the move to PCI as a new decision: what dose has been given, when, and what is the ACT now?",
            },
          ],
        },
        { kind: "tip", id: "pci-act-before-coronary-devices" },
        { kind: "h", text: "Step 3: the target depends on the machine and the case" },
        {
          kind: "table",
          caption: "ACT goals in the manuals (seconds)",
          head: ["Setting", "Goal", "Source"],
          rows: [
            ["Heparin alone, Hemochron device", "300–350", "Brilakis 2.8 and 3.4"],
            ["Heparin alone, HemoTec device", "250–300", "Brilakis 3.4"],
            ["With a GP IIb/IIIa inhibitor or cangrelor", "200–250", "Brilakis 3.4 and 3.5 name no device; 2.8 and 20.3 give it as the Hemochron goal. Neither manual gives a HemoTec figure for this situation"],
            ["Antegrade CTO PCI, Hemochron", "Above 300 (some operators accept above 250)", "Brilakis 21.3"],
            ["Retrograde CTO PCI, Hemochron", "Above 350 (some accept above 300, but then check very often)", "Brilakis 2.8, 3.4 and 21.3"],
            ["Oxford's general figure", "Kept above 250–300, by operators who use the ACT", "Oxford ch 8"],
          ],
        },
        {
          kind: "p",
          text: "The same blood gives a higher number on a Hemochron than on a HemoTec (Brilakis 25.2), which is why the two targets differ by about 50 seconds. A value that is adequate on one machine can be subtherapeutic on the other: know which device your lab uses before you interpret a number. The foundation lesson on anticoagulation in the lab gives a broader, device-agnostic range of 250–350 seconds for heparin alone; on a Hemochron, Brilakis wants at least 300 seconds, so a value in the 250s is low there.",
        },
        { kind: "tip", id: "pci-act-device-targets" },
        {
          kind: "check",
          stem: "Your lab uses a Hemochron. Six minutes after 80 units/kg of heparin for an elective LAD PCI (no GP IIb/IIIa inhibitor planned), the ACT is 262 seconds. What do you do?",
          options: [
            "Proceed to wire the LAD: 262 seconds lies within the 250–300 second goal",
            "Give a further heparin dose and repeat the ACT before any device enters the coronary",
            "Start a GP IIb/IIIa inhibitor, because its lower ACT goal of 200–250 seconds is already met",
            "Wire the vessel now and repeat the ACT in 20–30 minutes as part of routine monitoring",
          ],
          answer: 1,
          explanation:
            "On a Hemochron, Brilakis's goal with heparin alone is 300–350 seconds, so 262 seconds is low. Top up and remeasure before wiring. The tempting first option uses the HemoTec range; Hemochron values run higher, so that range does not apply. The foundation lesson's 250–350 second range is device-agnostic; on a Hemochron Brilakis wants at least 300 seconds, which is why 262 seconds is low here. A GP IIb/IIIa inhibitor is not a way to fix a low ACT: it is a bail-out drug with its own risks (lesson 5).",
        },
        { kind: "h", text: "When the ACT is low or thrombus appears" },
        {
          kind: "table",
          caption: "Why heparin fails (Brilakis 3.4)",
          head: ["Cause", "What to do"],
          rows: [
            ["The dose never reached the blood (failed or tissued IV line)", "Check the line; give the next dose through the arterial sheath if needed; remeasure"],
            ["The dose was too low", "Dose by weight and remeasure"],
            ["Low antithrombin III, inherited or acquired (heparin resistance)", "Consider it once a working line and a full dose have been confirmed; neither manual gives a specific remedy, so this module does not teach one"],
            ["A defective batch of heparin or bivalirudin", "Think of it when an apparently correct dose does nothing"],
            ["Heparin-induced thrombocytopenia", "Check the platelet count before the case; see lesson 2"],
          ],
        },
        {
          kind: "p",
          text: "If thrombus forms during the case, Brilakis's response is to give more anticoagulant until the ACT is therapeutic and to manage the thrombus as in acute coronary syndromes (the module on ACS and thrombus). In his algorithm for acute vessel closure (Figure 25.1), checking the ACT and considering a GP IIb/IIIa inhibitor or cangrelor come early. Two situations deserve extra vigilance: a guide extension, which leaves a lumen 1–2 French smaller than the guide and so calls for close attention to damping and to the ACT (Brilakis 30.3), and a long procedure, where the last ACT may be an hour old.",
        },
        { kind: "tip", id: "pci-low-act-redose" },
        { kind: "tip", id: "pci-thrombus-check-act-first" },
        { kind: "tip", id: "pci-guide-extension-watch-act" },
        {
          kind: "check",
          stem: "Fifty minutes into a difficult circumflex PCI, a new hazy filling defect appears on the wire beside a guide extension. The last ACT, 40 minutes ago, was 318 seconds on a Hemochron. What is your first step?",
          options: [
            "Measure the ACT now and give more heparin if it has fallen below target",
            "Give protamine, since the defect may be a contained haematoma rather than clot",
            "Post-dilate at high pressure to compress the filling defect into the wall",
            "Remove the guide extension and finish the case with the guide alone",
          ],
          answer: 0,
          explanation:
            "Forty minutes is beyond the 20–30 minute recheck interval, a guide extension narrows the lumen and calls for attention to the ACT, and heparin's effect fades through a long case. Brilakis's first moves when thrombus appears are to make the ACT therapeutic and then manage the thrombus. Protamine would make thrombosis more likely, not less.",
        },
        {
          kind: "p",
          text: "**Bleeding is the other failure.** Brilakis names three causes of bleeding around the anticoagulant: too much of it, a complication at the access site, and hypertension. He prevents it by avoiding high anticoagulant doses and by keeping the 20–30 minute ACT schedule. Oxford notes that heparin practice has moved over the years towards lower doses, to cut bleeding while keeping anticoagulation adequate.",
        },
        { kind: "h", text: "Reversal with protamine" },
        {
          kind: "steps",
          title: "Deciding on, dosing and giving protamine",
          items: [
            {
              title: "Is reversal needed?",
              detail:
                "Brilakis reverses heparin with protamine to treat bleeding, alongside treatment aimed at the bleeding site, and notes that in some patients it allows earlier femoral sheath removal. Oxford considers it in tamponade and coronary perforation, and lists heparin reversal among the measures for a forearm haematoma and for retroperitoneal bleeding.",
            },
            {
              title: "Is all the coronary equipment out?",
              detail:
                "Brilakis reverses only once every intracoronary device has been removed, because stents just implanted can thrombose. After a perforation he delays reversal further in most cases, until the equipment is out and blood has been drained from the pericardium, because reversing early risks guide and vessel thrombosis and can clot the pericardial blood so that it can no longer be aspirated (the perforation module covers this sequence).",
            },
            {
              title: "Work out the dose",
              detail:
                "See the formula below. Every version in the two manuals caps a dose at 50 mg.",
            },
            {
              title: "Give it slowly and watch",
              detail:
                "Slow administration lowers the risk of hypersensitivity and anaphylaxis. Brilakis's perforation chapter limits the rate to 5 mg per minute; Oxford gives it as an infusion over 10 minutes. A reaction typically comes 5–10 minutes after the dose: severe systemic hypotension with relative pulmonary hypertension from pulmonary vasoconstriction. Brilakis notes that methylene blue may help recovery.",
            },
            {
              title: "Know who is at risk",
              detail:
                "Brilakis 3.4 lists earlier exposure to NPH (isophane) or protamine zinc insulin, an allergy to fish, a vasectomy, severely impaired left ventricular function, and pulmonary haemodynamics that were already abnormal before the procedure. Oxford singles out diabetic patients who have received isophane insulin.",
            },
          ],
        },
        {
          kind: "formula",
          name: "Protamine dose (Brilakis 3.4)",
          expr: "1–1.5 mg of protamine for every 100 units of heparin, never more than 50 mg",
          note: "Brilakis's perforation chapter (26.2) uses 1 mg per 100 units, maximum 50 mg, at no more than 5 mg/min. Oxford: 1 mg neutralises 80–100 units when given within 15 minutes of the heparin; because heparin is cleared quickly, use less when more time has passed, and remember that protamine in high doses is itself an anticoagulant. Typical figures only: follow local protocol.",
        },
        {
          kind: "check",
          stem: "All equipment is out after a femoral PCI and a groin haematoma is expanding. The patient received 8000 units of heparin 12 minutes ago. Using Brilakis's section 3.4, what protamine do you give?",
          options: [
            "80–120 mg, given promptly as a single IV push to reverse it all at once",
            "50 mg, given slowly, while compressing the groin and treating the bleeding site",
            "No protamine at all, because reversal is contraindicated once a stent is implanted",
            "25 mg, because protamine is only ever used to partly reverse heparin's effect",
          ],
          answer: 1,
          explanation:
            "The ratio gives 80–120 mg, but Brilakis caps the dose at 50 mg, and protamine must be given slowly to limit reactions; local treatment of the bleeding site continues alongside. Reversal after stenting is allowed once all intracoronary equipment has been removed, with the stent-thrombosis risk accepted. A fast, uncapped dose invites hypotension, pulmonary vasoconstriction and, in high doses, an anticoagulant effect of its own.",
        },
        { kind: "h", text: "The ACT and the sheath" },
        {
          kind: "p",
          text: "The two manuals use different femoral thresholds. Brilakis waits for an ACT below 180 seconds before pulling a femoral sheath and holding pressure; Oxford waits for an ACT below 150–200 seconds or for 3–4 hours to pass, depending on local protocol. Brilakis allows a closure device at a high ACT, though perhaps not above 300 seconds. Radial sheaths are different: Brilakis removes them at the end of the procedure whatever the ACT, even with a GP IIb/IIIa inhibitor or cangrelor running, and if one must stay in, it is flushed and connected to a pressure line so that clot cannot form and embolise. The closure module teaches haemostasis itself.",
        },
        { kind: "tip", id: "access-femoral-sheath-act" },
        { kind: "tip", id: "pci-protamine-only-after-equipment-out" },
        { kind: "tip", id: "pci-bleeding-reverse-correctly" },
        {
          kind: "pitfalls",
          items: [
            "Reading a Hemochron value against the HemoTec range, or the reverse.",
            "Treating a low ACT with more and more heparin without checking that the IV line actually works.",
            "Wiring the coronary on the promise of an ACT that has not yet been measured.",
            "Losing track of time in a long case: a 20–30 minute recheck interval slips easily when attention is on the lesion.",
            "Giving protamine with a wire or balloon still in the coronary, or (in most cases) before the pericardium has been drained after a perforation.",
            "Pushing protamine quickly, or exceeding 50 mg, in a patient who has used isophane insulin.",
            "Forgetting that the lower ACT goal of 200–250 seconds applies only when a GP IIb/IIIa inhibitor or cangrelor is actually being given.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the heparin out loud: dose, time and route when it is given, and the ACT with its time when it comes back. Oxford gives the physiologist and the nurse the job of tracking the interval; make it easy for them by announcing both.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, run a radial diagnostic study through to the hand-over to PCI. Give the access heparin and note its time; at the hand-over, decide the PCI dose from the weight and what has already been given, then measure the ACT and do not let any coronary device leave the guide until it is in range for the device your lab uses.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (focal mid-LAD), check the ACT before advancing the first device, then keep a 20–30 minute recheck schedule. If the lab reports a new filling defect on the equipment, check the ACT before anything else.",
        },
        { kind: "video", id: "cf0NjN55w4s", note: "Manual of PCI chapter video on anticoagulation (section 3.4)." },
        { kind: "video", id: "9fk5vzmGVdo", note: "Manual of PCI case 224: protamine." },
        {
          kind: "keypoints",
          items: [
            "UFH for PCI: 70–100 units/kg, or 50–70 units/kg with a GP IIb/IIIa inhibitor or cangrelor; no renal adjustment; typical doses, follow local protocol.",
            "Check the ACT about 5 minutes after the bolus and every 20–30 minutes; no coronary device before it is therapeutic.",
            "Targets depend on the machine: with heparin alone, Hemochron 300–350 s and HemoTec 250–300 s; with IV antiplatelet agents 200–250 s (a Hemochron figure; no HemoTec equivalent is given); higher for CTO PCI.",
            "A low ACT may be a failed IV line, too small a dose or low antithrombin III: redose (through the arterial sheath if needed) and remeasure.",
            "Protamine 1–1.5 mg per 100 units (Brilakis 3.4), never above 50 mg, given slowly, and only after all coronary equipment is out.",
            "Watch for hypotension and pulmonary vasoconstriction 5–10 minutes after protamine, especially after isophane insulin, fish allergy or vasectomy.",
            "Femoral sheaths wait for the ACT to fall (Brilakis below 180 s; Oxford below 150–200 s or 3–4 h); radial sheaths come out at the end of the case.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-antithrombotics-alternatives",
      title: "When heparin is not the answer: bivalirudin, LMWH, fondaparinux and HIT",
      minutes: 13,
      topics: ["ph-alt-anticoag"],
      sources: [
        { book: "brilakis-pci", loc: "3.4" },
        { book: "brilakis-pci", loc: "21.3" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "oxford-cath", loc: "ch 8: Anticoagulation therapy" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
        { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "brilakis-pci", loc: "2.11" },
        { book: "brilakis-pci", loc: "4.2" },
      ],
      refs: [...BOOKS, "montalescot-atoll-2011", "yusuf-oasis5-2006", "steg-futura-oasis8-2010", "li-bright4-2022", "esc-acs-2023", "cuker-ash-hit-2018"],
      blocks: [
        {
          kind: "p",
          text: "Unfractionated heparin is the default for good reasons: it is the most widely used PCI anticoagulant (Brilakis), Oxford names it the standard during and after primary PCI on the strength of the MATRIX and HEAT-PPCI trials, and, unlike bivalirudin, it can be reversed. You need the alternatives for three situations: the patient who must not have heparin, the patient who arrives already anticoagulated with something else, and the operator who has a reason to prefer another drug. This lesson takes each in turn.",
        },
        { kind: "h", text: "Bivalirudin" },
        {
          kind: "table",
          caption: "Bivalirudin in Brilakis 3.4 (typical doses; follow local protocol and the product information). Brilakis gives the 4-hour run-on only with the normal-renal-function regimen; for renal failure he gives rates without a duration.",
          head: ["Item", "Detail"],
          rows: [
            ["What it is", "Direct thrombin inhibitor; it cannot cause HIT"],
            ["Bolus", "0.75 mg/kg IV, whatever the renal function"],
            ["Infusion, normal kidneys", "1.75 mg/kg/h, which may run on for as long as 4 hours once the case ends"],
            ["Infusion, creatinine clearance 30–59 mL/min", "1.75 mg/kg/h (unchanged)"],
            ["Infusion, creatinine clearance below 30 mL/min", "1 mg/kg/h"],
            ["Infusion, haemodialysis", "0.25 mg/kg/h"],
            ["Half-life", "25 minutes"],
            ["ACT goal", "300–350 s without, 200–250 s with, a GP IIb/IIIa inhibitor or cangrelor"],
            ["Reversal", "None: the infusion is stopped and the effect wears off"],
          ],
        },
        {
          kind: "p",
          text: "**Where the books stand.** Brilakis judges bivalirudin to give outcomes similar to heparin, so he uses it rarely, except in heparin-induced thrombocytopenia, where it is his anticoagulant of choice. Oxford reports data showing efficacy equal to heparin with GP IIb/IIIa inhibitors in elective and acute PCI with fewer bleeds; it is usually given alone but can be combined with a GP IIb/IIIa inhibitor, and in primary PCI it is an alternative to heparin rather than the default.",
        },
        {
          kind: "p",
          text: "**What has changed since.** In BRIGHT-4 (Li 2022), 6016 STEMI patients having primary PCI, 93% of them from the radial artery, were randomised to bivalirudin with a high-dose infusion for 2–4 hours after the PCI or to heparin alone. Death or BARC type 3–5 bleeding at 30 days was 3.06% with bivalirudin and 4.39% with heparin, and stent thrombosis was also less frequent with bivalirudin (0.37% versus 1.10%). The 2023 ESC ACS guideline keeps unfractionated heparin as the standard anticoagulant for primary PCI, accepts intravenous enoxaparin or bivalirudin with a full-dose infusion after the PCI as alternatives, and advises against fondaparinux for primary PCI.",
        },
        {
          kind: "p",
          text: "**Where to avoid it.** In CTO PCI, Brilakis prefers heparin because it can be reversed if a severe perforation occurs, and he advises against bivalirudin: it cannot be reversed, and he knows of unreported cases in which the guide catheter clotted during long bivalirudin procedures. The same logic applies to any case with a high perforation risk.",
        },
        { kind: "tip", id: "pci-cto-anticoagulant-choice" },
        {
          kind: "check",
          stem: "You are planning a retrograde CTO PCI on a Hemochron lab. Which anticoagulant plan fits Brilakis's advice?",
          options: [
            "Unfractionated heparin to an ACT above 350 seconds, checked every 20–30 minutes",
            "Bivalirudin bolus and infusion, because it has a short half-life and no HIT risk",
            "Heparin to an ACT of 200–250 seconds with a GP IIb/IIIa inhibitor once the CTO is crossed",
            "Heparin to an ACT of 250–300 seconds, the usual goal for a HemoTec machine",
          ],
          answer: 0,
          explanation:
            "Heparin is preferred for CTO PCI because it can be reversed after a severe perforation; the retrograde goal on a Hemochron is above 350 seconds, rechecked every 20–30 minutes once therapeutic. Bivalirudin cannot be reversed. GP IIb/IIIa inhibitors and cangrelor are not given in CTO PCI, even after success: a small wire exit that looked sealed can bleed again into the pericardium after the case.",
        },
        { kind: "h", text: "Low-molecular-weight heparin and fondaparinux" },
        {
          kind: "p",
          text: "The manuals say little here. Oxford mentions data suggesting that bleeding during PCI may be lower with low-molecular-weight heparins and with fondaparinux, a factor Xa antagonist, and says that a patient on subcutaneous low-molecular-weight heparin may skip the dose due on the morning of the case. Three trials fill in what you will meet in practice:",
        },
        {
          kind: "table",
          caption: "Trials behind the alternatives (checked on PubMed)",
          head: ["Trial", "What was compared", "What it showed"],
          rows: [
            [
              "ATOLL (Montalescot 2011)",
              "In 910 STEMI patients, an IV bolus of 0.5 mg/kg of enoxaparin versus unfractionated heparin before primary PCI",
              "The primary composite (death, complication of MI, procedure failure or major bleeding at 30 days) was 28% versus 34%, not statistically significant (P = 0.06). Major bleeding did not differ; the main secondary ischaemic composite was lower with enoxaparin",
            ],
            [
              "OASIS-5 (Yusuf 2006)",
              "In 20,078 ACS patients, fondaparinux 2.5 mg daily versus enoxaparin 1 mg/kg twice daily",
              "Ischaemic events at 9 days were similar (5.8% versus 5.7%); major bleeding at 9 days was roughly halved (2.2% versus 4.1%); fewer patients died with fondaparinux by 30 days (295 versus 352, P = 0.02) and by 180 days (574 versus 638, P = 0.05)",
            ],
            [
              "FUTURA/OASIS-8 (2010)",
              "In 2026 fondaparinux-treated NSTE-ACS patients having PCI, all of whom received IV heparin at the procedure: low dose (50 units/kg whether or not a GP IIb/IIIa inhibitor was used) versus standard dose (85 units/kg, or 60 units/kg with a GP IIb/IIIa inhibitor, adjusted by ACT)",
              "The primary composite of major bleeding, minor bleeding or major access-site complications at 48 hours was 4.7% versus 5.8% (P = 0.27), and major bleeding did not differ. Minor bleeding alone was lower with the low dose (0.7% versus 1.7%, P = 0.04). The key secondary composite of major bleeding, death, MI or target vessel revascularisation was 5.8% with low dose and 3.9% with standard dose (P = 0.05). Catheter thrombus was rare in both arms",
            ],
          ],
        },
        {
          kind: "p",
          text: "The practical reading of FUTURA/OASIS-8: every fondaparinux-pretreated patient in the trial still received heparin at the PCI, and cutting it to a low dose (50 units/kg) did not reduce the primary bleeding and access-site composite or major bleeding. Minor bleeding was lower, but the composite of major bleeding, death, MI or revascularisation was higher (5.8% versus 3.9%, P = 0.05). Use the standard, ACT-guided heparin regimen of your protocol. As noted above, the 2023 ESC guideline advises against fondaparinux as the anticoagulant for primary PCI.",
        },
        { kind: "tip", id: "pci-fondaparinux-add-heparin" },
        { kind: "h", text: "Heparin-induced thrombocytopenia" },
        {
          kind: "table",
          caption: "The two types of HIT (Brilakis 3.4)",
          head: ["", "Type 1", "Type 2"],
          rows: [
            ["When", "Within the first 2 days of heparin", "Usually 4–10 days after heparin is started"],
            ["Mechanism", "A direct effect of heparin activating platelets", "Immune-mediated"],
            ["Course", "Platelets recover even if heparin continues", "Can cause life-threatening venous and arterial thromboembolism"],
            ["Management", "Nothing specific", "Stop all heparin and anticoagulate with a non-heparin agent such as bivalirudin or argatroban"],
          ],
        },
        {
          kind: "steps",
          title: "Protecting the patient from HIT in the lab",
          items: [
            {
              title: "Look at the platelet trend before the case",
              detail:
                "Brilakis checks the platelet count before the procedure specifically to catch a fall that could be HIT. Oxford adds that the platelet count should be followed in patients on prolonged heparin infusions, such as those supported by an intra-aortic balloon pump.",
            },
            {
              title: "Match the timing to the type",
              detail:
                "A count that falls in the first 2 days and recovers on heparin fits type 1. A fall several days into heparin treatment raises type 2, the dangerous form.",
            },
            {
              title: "Estimate the probability and test",
              detail:
                "Brilakis teaches HIT by timing and mechanism only. The ASH 2018 guideline adds a step before treatment: it strongly recommends estimating the pretest probability with the 4Ts score rather than by clinical impression, and advises against HIT laboratory testing and against empirical HIT treatment when the 4Ts score is low. When the score is not low, the laboratory test looks for the antibodies against platelet factor 4–heparin complexes that cause HIT, and the patient is managed as suspected type 2 HIT (next step) under local haematology protocol.",
            },
            {
              title: "If type 2 is suspected, heparin stops completely",
              detail:
                "Every heparin product is stopped and a non-heparin anticoagulant is used. For PCI, Brilakis's choice is bivalirudin. In the lab, 'all heparin' includes the hidden sources: both manuals flush sheaths and catheters with heparinised saline, Oxford's flush infusion is usually heparinised, and its radial cocktail contains heparin. Use heparin-free saline and leave heparin out of the cocktail.",
            },
            {
              title: "Dose bivalirudin for the kidneys and plan for no antidote",
              detail:
                "Use the renal infusion rates above and the ACT goals for bivalirudin. Because it cannot be reversed, radial access and careful haemostasis matter even more.",
            },
            {
              title: "Keep anticoagulating after the PCI",
              detail:
                "Brilakis treats type 2 HIT by stopping heparin and anticoagulating with a non-heparin agent such as bivalirudin or argatroban. That treatment is for the HIT, not for the stent, so it does not end when the post-PCI bivalirudin run-on ends: continue a non-heparin anticoagulant afterwards, chosen and dosed with haematology under local protocol. ASH 2018 lists argatroban, bivalirudin, danaparoid, fondaparinux and the DOACs as the options for acute HIT.",
            },
            {
              title: "Remember HIT when thrombus appears",
              detail:
                "Brilakis lists HIT among the causes of thrombosis during PCI and of acute vessel closure.",
            },
          ],
        },
        { kind: "tip", id: "pci-hit-use-bivalirudin" },
        {
          kind: "check",
          stem: "A man admitted with NSTEMI has received heparin since admission. On day 6, before his angiogram, his platelet count has fallen from 240 to 105 × 10⁹/L. Which plan is right?",
          options: [
            "Type 1 HIT: continue heparin, since the count will recover on its own",
            "Suspected type 2 HIT: stop all heparin and plan PCI with bivalirudin",
            "Suspected type 2 HIT: switch to a low-molecular-weight heparin for the PCI",
            "No HIT is possible this late: proceed with standard heparin to the usual ACT",
          ],
          answer: 1,
          explanation:
            "A fall several days after starting heparin fits the timing of type 2 HIT (usually 4–10 days), which is immune-mediated and can cause arterial and venous thrombosis. Brilakis stops all heparin and uses a non-heparin agent, with bivalirudin his choice for PCI. Type 1 occurs within the first 2 days. A low-molecular-weight heparin is still a heparin.",
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing bivalirudin for a CTO or another high-perforation-risk case, then having no antidote when the perforation comes.",
            "Using the normal bivalirudin infusion rate when creatinine clearance is below 30 mL/min or the patient is on dialysis.",
            "Waving through a falling platelet count on day 5 of heparin as 'probably type 1'.",
            "Replacing heparin with another heparin product in suspected type 2 HIT, or forgetting the heparinised flush, pressure-line saline and radial cocktail.",
            "Stopping all anticoagulation when the post-PCI bivalirudin run-on ends in a patient with HIT, who still needs a non-heparin anticoagulant.",
            "Reducing the heparin dose at PCI because the patient has had fondaparinux.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you choose an anticoagulant, ask one question: if this vessel perforates, can I switch the drug off? With heparin you can; with bivalirudin you can only stop the infusion and wait.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, review the drug chart and blood results before the case. If the platelet count has fallen during heparin treatment, decide whether this could be HIT before ordering any anticoagulant, and say which agent and dose you would use instead.",
        },
        { kind: "video", id: "cf0NjN55w4s", note: "Manual of PCI chapter video on anticoagulation, including bivalirudin." },
        { kind: "video", id: "YBqCYV_PJYE", note: "Elias Hanna on NSTEMI pharmacotherapy: antiplatelets, anticoagulants and other therapies." },
        {
          kind: "keypoints",
          items: [
            "Bivalirudin: 0.75 mg/kg bolus, 1.75 mg/kg/h (1 mg/kg/h below 30 mL/min, 0.25 mg/kg/h on dialysis), half-life 25 minutes, no antidote.",
            "Bivalirudin uses the same ACT goals as heparin (300–350 s, or 200–250 s with IV antiplatelet agents).",
            "Brilakis keeps bivalirudin mainly for HIT and avoids it in CTO PCI, where reversibility matters.",
            "Type 1 HIT: first 2 days, benign. Type 2 HIT: usually days 4–10, immune, thrombotic; stop all heparin (flushes included) and use bivalirudin or argatroban, continuing a non-heparin anticoagulant after the PCI.",
            "Check the platelet trend before every case; score the 4Ts before testing or treating for HIT (ASH 2018).",
            "After fondaparinux, give standard ACT-guided heparin at PCI: in FUTURA/OASIS-8, 50 units/kg did not reduce major bleeding or access-site complications, and ischaemic-plus-bleeding events were higher.",
            "2023 ESC: heparin is standard in primary PCI; enoxaparin or bivalirudin with a full-dose post-PCI infusion are alternatives; no fondaparinux for primary PCI.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-antithrombotics-oac",
      title: "Patients taking warfarin or a DOAC: hold, bridge and choose the access",
      minutes: 14,
      topics: ["ph-oral-anticoag-patients"],
      sources: [
        { book: "brilakis-pci", loc: "1.3" },
        { book: "brilakis-pci", loc: "1.4" },
        { book: "brilakis-pci", loc: "3.4" },
        { book: "brilakis-pci", loc: "3.5" },
        { book: "brilakis-pci", loc: "4.1" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "oxford-cath", loc: "ch 3: Anticoagulation issues" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
        { book: "oxford-cath", loc: "ch 8: Antiplatelet therapy" },
        { book: "oxford-cath", loc: "ch 11: Discharge plans" },
      ],
      refs: [...BOOKS, "lopes-augustus-2019", "douketis-bridge-2015", "esc-acs-2023", "esc-af-2024"],
      blocks: [
        {
          kind: "p",
          text: "A patient on long-term anticoagulation brings two risks into the lab: bleeding from the arterial puncture if the drug is still working, and a thrombotic event, a stroke or valve thrombosis, if it has been stopped. Oxford frames the decision exactly that way: weigh the risk of interrupting the anticoagulant against the bleeding risk of the puncture, for this patient, within local policy. This lesson works through the decisions in the order you meet them: the drug, the hold, the bridge, the access and what follows the PCI.",
        },
        { kind: "h", text: "Step 1: know the drug and its numbers" },
        {
          kind: "list",
          items: [
            "Which anticoagulant, at what dose, and for what indication (atrial fibrillation and its risk profile, a prosthetic valve, venous thromboembolism, intracardiac thrombus).",
            "For warfarin: the INR. Oxford asks for anticoagulation status in every patient who has been taking warfarin, and Brilakis measures the INR on the procedure day.",
            "For a DOAC: the last dose and the creatinine clearance, which set how long the drug must be held (Brilakis's table points to a Cockcroft–Gault calculator).",
            "The platelet count: Brilakis notes that a high INR and a low platelet count both favour radial access.",
          ],
        },
        { kind: "h", text: "Step 2: warfarin, stop or continue?" },
        {
          kind: "table",
          caption: "Oxford's lists for elective procedures (guidance only; local policy rules)",
          head: ["Warfarin can stop 3–5 days ahead, with an INR that morning", "Warfarin continued, or the patient admitted and switched to IV unfractionated heparin"],
          rows: [
            ["Atrial fibrillation at low risk: normal left ventricular function and no previous stroke", "Atrial fibrillation at moderate or high risk: poor left ventricular function, previous stroke or diabetes"],
            ["A poorly contracting left ventricle with laminar thrombus at the apex (keep catheters out of the ventricle)", "Prosthetic heart valves, particularly mechanical ones"],
            ["Recurrent deep vein thrombosis or pulmonary embolism", "Rheumatic mitral valve disease"],
            ["Arterial access impossible from either arm", "Intracardiac thrombus that is not laminar"],
          ],
        },
        {
          kind: "p",
          text: "Where warfarin is replaced by IV heparin (bridging), Oxford stops the infusion immediately before the procedure and restarts it straight afterwards; its patient-preparation section, using the mechanical mitral valve as the example, stops it 2 hours before. When warfarin is stopped, it may be restarted on the evening after the procedure if there has been no bleeding. **The manuals differ on the hold:** Brilakis stops warfarin 5 days before an elective procedure, Oxford 3–5 days. On the INR, Oxford reports that most operators are comfortable below 2, and that the femoral route is generally safer when the INR is under 2.0.",
        },
        {
          kind: "p",
          text: "**Bridging in atrial fibrillation: what has changed.** Oxford's continue-or-bridge list includes moderate- and high-risk AF, but the BRIDGE trial (Douketis 2015) has since tested bridging in AF directly. In 1884 patients with AF whose warfarin was stopped 5 days before an elective operation or invasive procedure, a placebo instead of low-molecular-weight heparin bridging was noninferior for arterial thromboembolism (0.4% versus 0.3%) and cut major bleeding (1.3% versus 3.2%, P = 0.005). So in AF, bridging is no longer routine: either continue warfarin and work from the wrist (Oxford's approach for the fully anticoagulated patient) or interrupt it without bridging (BRIDGE). BRIDGE enrolled only patients with AF; it does not answer the question for mechanical valves, rheumatic mitral disease or intracardiac thrombus, where Oxford's continue-or-bridge rule remains the manual's position.",
        },
        {
          kind: "check",
          stem: "A 66-year-old with a mechanical mitral valve on warfarin needs elective coronary angiography. Following Oxford, what is the plan?",
          options: [
            "Stop warfarin 5 days before and proceed once the INR is below 2.0, without cover",
            "Continue warfarin, or admit and bridge with IV unfractionated heparin stopped just before the procedure",
            "Stop warfarin 3 days before and give no heparin, because the procedure is purely diagnostic",
            "Switch to a DOAC for a week, then hold it for 24 hours before the angiogram",
          ],
          answer: 1,
          explanation:
            "Prosthetic valves, particularly mechanical ones, are on Oxford's list of patients in whom warfarin is not simply stopped: it is continued, or the patient is admitted and switched to IV heparin, which is stopped just before the procedure (2 hours before in Oxford's mechanical mitral example) and restarted afterwards. Radial access suits a fully anticoagulated patient. Stopping without cover is the tempting wrong answer: a short procedure does not make valve thrombosis less dangerous.",
        },
        { kind: "h", text: "Step 3: DOACs, how long to hold" },
        {
          kind: "table",
          caption: "Days to hold a DOAC before an elective catheterisation, by creatinine clearance (Brilakis Table 1.2). The table has no rows for a creatinine clearance below 15 mL/min, or above 95 mL/min for edoxaban.",
          head: ["Drug", "Creatinine clearance", "Hold"],
          rows: [
            ["Apixaban", "Not stratified by creatinine clearance", "2 days"],
            ["Edoxaban", "50–95 mL/min", "2 days"],
            ["Edoxaban", "15–49 mL/min", "3 days"],
            ["Rivaroxaban", "50 mL/min or more", "2 days"],
            ["Rivaroxaban", "15–49 mL/min", "3 days"],
            ["Dabigatran", "Above 80 mL/min", "2 days"],
            ["Dabigatran", "50–79 mL/min", "3 days"],
            ["Dabigatran", "30–49 mL/min", "4 days"],
            ["Dabigatran", "15–29 mL/min", "5 days"],
          ],
        },
        {
          kind: "p",
          text: "**Oxford is shorter.** It withholds a DOAC for 24 hours before elective catheterisation or PCI, except for dabigatran in renal impairment, which it holds for 72 hours, and it usually restarts the DOAC on the evening after the procedure, particularly when there has been no bleeding or the radial route was used. Know both positions and follow your local protocol. For subcutaneous low-molecular-weight heparin, Oxford simply leaves out the morning dose.",
        },
        {
          kind: "check",
          stem: "A 74-year-old on rivaroxaban with a creatinine clearance of 40 mL/min is listed for elective PCI. What do the two manuals advise about the hold?",
          options: [
            "Both hold it for 24 hours, because rivaroxaban is a factor Xa inhibitor",
            "Brilakis holds it for 3 days; Oxford for 24 hours, keeping 72 hours for dabigatran in renal impairment",
            "Brilakis holds it for 2 days; Oxford for 72 hours, because renal function is reduced",
            "Neither holds it, because radial access makes any interruption unnecessary",
          ],
          answer: 1,
          explanation:
            "Brilakis's table gives rivaroxaban 3 days when creatinine clearance is 15–49 mL/min (2 days at 50 mL/min or more). Oxford's general rule is 24 hours, with the 72-hour exception reserved for dabigatran in renal impairment. Radial access lowers bleeding risk but does not remove the reason to hold before an elective case.",
        },
        { kind: "h", text: "Step 4: choose the access" },
        {
          kind: "steps",
          title: "Access in the anticoagulated patient",
          items: [
            {
              title: "Run the earlier steps of the access algorithm first",
              detail:
                "Brilakis's algorithm (Figure 4.1) asks two questions before the anticoagulant. Step 1 excludes sites that are unavailable or unsuitable (a harvested radial artery, known occlusion, a dialysis shunt in the arm, earlier failure to engage from that site, strong patient preference). Step 2: after CABG with patent grafts, femoral access is usually preferred, and strongly so when both internal mammary arteries were used. Later, step 4 often adds a femoral access for complex PCI, and step 5 changes site after failure.",
            },
            {
              title: "Otherwise, default to the radial artery",
              detail:
                "Step 3 of the algorithm sends patients on warfarin or a DOAC, and those likely to bleed (a body mass index at either extreme, renal failure, anaemia or a low platelet count), to the radial artery. Oxford also sends fully anticoagulated patients to the wrist, where puncture bleeding is less frequent.",
            },
            {
              title: "If the femoral artery is needed, guide the puncture",
              detail:
                "Oxford keeps the femoral route for emergencies, such as inserting an intra-aortic balloon pump, when anticoagulation cannot be stopped. For a femoral puncture in an anticoagulated patient it advises considering fluoroscopy and ultrasound guidance, with compression or a closure device afterwards to reduce bleeding; Brilakis's femoral technique uses both fluoroscopy and ultrasound for every femoral access.",
            },
            {
              title: "Respect the crossover risk",
              detail:
                "Brilakis warns that obtaining femoral access in a patient already anticoagulated, after a failed radial approach, carries a higher bleeding risk and demands meticulous technique.",
            },
            {
              title: "In an emergency, do not wait",
              detail:
                "Oxford accepts that there is not always time to stop the anticoagulant, for example in an emergency, and Brilakis stops oral anticoagulation before procedures unless they are emergent. Neither manual gives a rule for extra heparin when the oral drug is still active; the foundation lesson on special situations summarises the ESC position, and your local protocol decides.",
            },
          ],
        },
        { kind: "tip", id: "access-anticoagulated-go-radial" },
        { kind: "tip", id: "access-crossover-anticoagulated-care" },
        { kind: "h", text: "Step 5: the antiplatelet plan once a stent is in" },
        {
          kind: "p",
          text: "Brilakis's default after PCI in a patient on warfarin or a DOAC is to stop aspirin after the procedure, or after a period that ranges from 1–4 weeks to 6 months, and to continue clopidogrel with the anticoagulant. He avoids prasugrel and ticagrelor in these patients because of their bleeding risk, shortens aspirin, and gives a proton pump inhibitor routinely to patients on dual antiplatelet therapy. Oxford's Table 8.10 sets the regimen by the balance of risks. When ischaemic risk outweighs bleeding risk, aspirin, clopidogrel and the anticoagulant are given for the first month and may continue to 6 months, before one antiplatelet agent (aspirin or clopidogrel) with the anticoagulant up to 12 months. When bleeding risk is moderate, the triple combination lasts one month, then one antiplatelet agent with the anticoagulant. When bleeding risk is high, clopidogrel and the anticoagulant are used from the start. In every group the anticoagulant continues alone after 12 months.",
        },
        {
          kind: "p",
          text: "**Oxford's table predates current guidance.** The 2023 ESC ACS and 2024 ESC AF guidelines make the triple combination much shorter by default: up to 1 week, extended to up to 1 month only when ischaemic risk clearly outweighs bleeding risk; then the anticoagulant with clopidogrel to 12 months after ACS, or 6 months after elective PCI; then the anticoagulant alone. The PCI pharmacology lesson on oral anticoagulation teaches this pathway in full.",
        },
        {
          kind: "p",
          text: "Oxford also points to AUGUSTUS (Lopes 2019): in 4614 patients with atrial fibrillation after ACS or PCI who were planning to take a P2Y12 inhibitor, treated for 6 months, apixaban caused less major or clinically relevant bleeding than a vitamin K antagonist (10.5% versus 14.7%) and also reduced death or hospitalisation (23.5% versus 27.4%), while aspirin caused more bleeding than placebo (16.1% versus 9.0%), with no significant difference in ischaemic events. Current ESC durations are in the PCI pharmacology lesson on oral anticoagulation and in the module on what happens after the procedure.",
        },
        {
          kind: "p",
          text: "Before discharge, a patient restarting anticoagulation needs to know when to have blood tests repeated (Oxford), and the restart time should be written down.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stopping warfarin without cover in a patient with a mechanical valve, rheumatic mitral disease or non-laminar intracardiac thrombus.",
            "Bridging an interrupted warfarin course in AF by habit: in BRIDGE it added major bleeding without reducing arterial thromboembolism.",
            "Holding every DOAC for the same time regardless of the drug and the creatinine clearance.",
            "Passing a pigtail into a left ventricle that contains apical thrombus.",
            "Puncturing the femoral artery blind in an anticoagulated patient after a failed radial attempt.",
            "Adding prasugrel or ticagrelor to an oral anticoagulant and aspirin.",
            "Leaving the ward without a clear restart time for the anticoagulant.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the anticoagulant plan as three times: when the last dose was taken, when the next one is due, and what covers the gap. If you cannot fill in all three before the patient arrives, the plan is not finished.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, take a patient on an oral anticoagulant: before the case, state the drug, its last dose, the INR or creatinine clearance, and your hold or bridge plan; choose radial access unless there is a reason not to, and if the femoral artery is needed, use ultrasound and fluoroscopy for the puncture.",
        },
        { kind: "video", id: "TM16o0Vxh7I", note: "Novel oral anticoagulants (Dallas CVI 2016 lecture)." },
        { kind: "video", id: "ggykHH5RGkY", note: "Atrial fibrillation: anticoagulation strategies (Dallas CVI 2015 lecture)." },
        {
          kind: "keypoints",
          items: [
            "Weigh the thrombotic risk of stopping against the bleeding risk of the puncture, patient by patient, within local policy.",
            "Warfarin: Brilakis holds 5 days, Oxford 3–5 days, with the INR checked on the day; most operators want an INR below 2.",
            "Mechanical valves, rheumatic mitral disease, non-laminar thrombus: continue warfarin or bridge (Oxford). AF: continue it, or interrupt without bridging (BRIDGE).",
            "DOACs: Brilakis holds 2–5 days by drug and creatinine clearance; Oxford 24 hours (72 hours for dabigatran in renal impairment).",
            "Radial access for anticoagulated and high-bleeding-risk patients, after the algorithm's earlier checks; a femoral puncture should be guided by ultrasound and fluoroscopy (Oxford: consider; Brilakis uses both for every femoral access), and crossover after heparin needs great care.",
            "Oxford's Table 8.10 triple therapy is longer than current ESC guidance (triple up to 1 week by default, then anticoagulant with clopidogrel).",
            "After PCI: clopidogrel with the anticoagulant, aspirin short or omitted, no prasugrel or ticagrelor, and a proton pump inhibitor.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-antithrombotics-oral",
      title: "Aspirin and the oral P2Y12 inhibitors: choice, loading, pretreatment and switching",
      minutes: 17,
      topics: ["ph-oral-p2y12"],
      sources: [
        { book: "brilakis-pci", loc: "3.5" },
        { book: "brilakis-pci", loc: "1.3" },
        { book: "brilakis-pci", loc: "3.1" },
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "oxford-cath", loc: "ch 8: Antiplatelet therapy" },
        { book: "oxford-cath", loc: "ch 8: Stent thrombosis" },
        { book: "oxford-cath", loc: "ch 8: PCI in acute myocardial infarction" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
      ],
      refs: [...BOOKS, "esc-acs-2023", "isar-react5-2019", "gimbel-popular-age-2020"],
      blocks: [
        {
          kind: "p",
          text: "PCI is a thrombogenic act. Oxford explains why: inflating a balloon tears the intima and exposes the lipid core of the plaque, tissue factor and von Willebrand factor, all of which switch platelets on; the equipment in the artery attracts thrombus; and a stent can occlude if antithrombotic cover is inadequate. Dual antiplatelet therapy (DAPT), aspirin with a P2Y12 inhibitor, has two goals in Brilakis's words: to prevent stent thrombosis and to prevent further acute coronary syndromes.",
        },
        { kind: "h", text: "The drugs" },
        {
          kind: "table",
          caption: "Oral antiplatelet agents in the two manuals (typical doses; follow local protocol and the product information)",
          head: ["Drug", "How it acts", "Brilakis 3.5", "Oxford ch 8", "Cautions"],
          rows: [
            [
              "Aspirin",
              "Blocks platelet cyclooxygenase-1, so thromboxane A2 is not made",
              "325 mg load, then 81–100 mg daily",
              "300 mg load, then 75 mg daily indefinitely; it has reduced procedural MI since the first balloon angioplasties",
              "Allergy: identify the culprit; aspirin desensitisation is possible",
            ],
            [
              "Clopidogrel",
              "A thienopyridine prodrug that blocks the P2Y12 ADP receptor once the liver has activated it",
              "600 mg load, ideally at least 6 hours before PCI in stable patients, then 75 mg daily",
              "300 mg at least 72 hours before PCI, or 600 mg when there is less time, then 75 mg daily; preloading of 300–600 mg follows local policy",
              "Response varies between patients, mainly through cytochrome P450 genetics. Very rarely, thrombotic thrombocytopenic purpura",
            ],
            [
              "Prasugrel",
              "A third-generation thienopyridine, metabolised more efficiently: faster and stronger, with far fewer poor responders than clopidogrel",
              "60 mg load, then 10 mg daily; 5 mg daily if under 60 kg or over 75 years",
              "60 mg load, 10 mg daily; not recommended over 75 years, under 60 kg, or with active bleeding or previous stroke or TIA",
              "Contraindicated after TIA or stroke",
            ],
            [
              "Ticagrelor",
              "Binds the P2Y12 receptor reversibly at a site separate from ADP and stops ADP activating it; no inter-individual variability",
              "180 mg load, then 90 mg twice daily",
              "180 mg load, then 90 mg twice daily",
              "Contraindicated after intracranial haemorrhage. Avoid with strong CYP3A inhibitors (for example ketoconazole, clarithromycin, ritonavir) or inducers (for example rifampicin, phenytoin, carbamazepine), and with simvastatin or lovastatin above 40 mg daily. Dyspnoea and bradycardia",
            ],
          ],
        },
        {
          kind: "p",
          text: "**The trials Oxford cites.** In TRITON-TIMI 38, prasugrel with aspirin reduced ischaemic events compared with clopidogrel in ACS patients treated with PCI, but at the cost of more major and fatal bleeding. TRILOGY ACS found no advantage of prasugrel in ACS managed medically, so Oxford suggests prasugrel for patients whose anatomy is known or who are not candidates for surgery. In PLATO, ticagrelor reduced ischaemic events against clopidogrel in ACS without a significant increase in bleeding, and this translated into lower mortality. Oxford reports dyspnoea, not severe, in as many as 15% of patients during the first week of ticagrelor, thought to come from higher circulating adenosine because the drug slows its clearance.",
        },
        { kind: "h", text: "Choosing the P2Y12 inhibitor, step by step" },
        {
          kind: "steps",
          title: "Four questions before you write the load",
          items: [
            {
              title: "1. Does the patient also need an oral anticoagulant?",
              detail:
                "Then clopidogrel: Brilakis avoids the potent agents in patients on warfarin or a DOAC (previous lesson).",
            },
            {
              title: "2. Is there a contraindication?",
              detail:
                "Previous intracranial haemorrhage rules out ticagrelor; previous stroke or TIA rules out prasugrel. Age over 75 years or weight under 60 kg means a 5 mg prasugrel maintenance dose for Brilakis and makes Oxford advise against prasugrel. Strong CYP3A inhibitors or inducers, or high-dose simvastatin or lovastatin, steer away from ticagrelor.",
            },
            {
              title: "3. Stable disease or ACS?",
              detail:
                "Brilakis uses clopidogrel for stable coronary disease and prasugrel or ticagrelor for ACS, unless contraindicated. Oxford, in 2020, still saw only a small first-line role for prasugrel because of its bleeding profile, using it mainly after stent thrombosis on other agents.",
            },
            {
              title: "4. Prasugrel or ticagrelor in ACS?",
              detail:
                "Brilakis does not rank them. Oxford (2020) leans away from first-line prasugrel because of its bleeding profile and credits ticagrelor in PLATO with fewer ischaemic events, no significant increase in bleeding and lower mortality. The 2023 ESC ACS guideline now advises that prasugrel be considered in preference to ticagrelor for ACS patients proceeding to PCI, a position based largely on ISAR-REACT 5, which compared the two in ACS patients planned for invasive management.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 79-year-old woman, 58 kg, with a TIA two years ago is having PCI for NSTEMI. She takes no anticoagulant and has never had an intracranial bleed. Which P2Y12 inhibitor fits the manuals?",
          options: [
            "Prasugrel 60 mg, then 5 mg daily because of her age and weight",
            "Ticagrelor 180 mg, then 90 mg twice daily",
            "Prasugrel 60 mg, then 10 mg daily, because it is now preferred in ACS",
            "No P2Y12 inhibitor, because of her previous TIA",
          ],
          answer: 1,
          explanation:
            "A previous TIA contraindicates prasugrel at any dose; the 5 mg maintenance dose is for older or lighter patients who have no such history. Ticagrelor is contraindicated after intracranial haemorrhage, not after TIA, so it is the potent agent left for this ACS. The ESC preference for prasugrel applies only when prasugrel can be used. A potent agent is not mandatory: if her bleeding risk is judged high, clopidogrel is a reasonable alternative, since Brilakis avoids potent P2Y12 inhibitors at high bleeding risk and in POPular AGE (patients aged 70 or over with NSTE-ACS) clopidogrel caused less bleeding than ticagrelor and was noninferior for net clinical benefit.",
        },
        { kind: "h", text: "Pretreatment: loading before the anatomy is known" },
        {
          kind: "table",
          caption: "When to load (pretreatment) in the manuals, with the current ESC position",
          head: ["Presentation", "Brilakis 3.5", "Oxford", "2023 ESC ACS guideline"],
          rows: [
            [
              "Stable disease",
              "Not given before a diagnostic angiogram; given when PCI is planned (clopidogrel 600 mg ideally 6 hours or more before)",
              "Clopidogrel 300–600 mg is usually given beforehand to anyone due for PCI, as local policy directs",
              "Outside this guideline: chronic coronary syndromes have their own 2024 ESC guideline, not summarised in this lesson",
            ],
            [
              "NSTE-ACS",
              "No pretreatment",
              "No separate NSTE-ACS rule; its general rule preloads clopidogrel 300–600 mg in patients due or expected to have PCI, per local policy",
              "Routine pretreatment is not recommended when early invasive angiography is planned",
            ],
            [
              "STEMI",
              "Yes: ticagrelor 180 mg or prasugrel 60 mg, before the procedure and no later than the PCI itself",
              "Initial care includes aspirin and a clopidogrel or ticagrelor loading dose",
              "Pretreatment may be considered (a weaker position than Brilakis's firm yes)",
            ],
          ],
        },
        {
          kind: "p",
          text: "Pretreatment has costs. Brilakis points out that STEMI patients loaded before angiography bleed more if they turn out to need emergency CABG. Oxford's interruption table shows how long an operation would wait: prasugrel stopped 7 days before surgery, clopidogrel 5 days and ticagrelor 3 days, each restarted on day 1–4 afterwards, while aspirin is not stopped (a case-by-case decision). Oxford adds that when surgery forces antiplatelet therapy to stop, there is no evidence that heparin or low-molecular-weight heparin protects the stent in the meantime.",
        },
        {
          kind: "p",
          text: "**Opioids slow everything down.** Brilakis notes that opioids delay gastric emptying and so the absorption of oral P2Y12 inhibitors, which can lead to thrombotic complications. He avoids opioids in STEMI unless they are really needed, and when the oral drug is unlikely to be working in time, uses an intravenous agent, cangrelor or a GP IIb/IIIa inhibitor (lesson 5). Oxford still lists pain relief with opioids or a benzodiazepine in the initial care of STEMI, so if an opioid has been given, expect the oral P2Y12 inhibitor to be absorbed late.",
        },
        { kind: "tip", id: "pci-check-oral-loading" },
        {
          kind: "check",
          stem: "A patient with NSTEMI is booked for angiography tomorrow morning. The admitting team asks whether to load ticagrelor tonight. What do you advise?",
          options: [
            "Load ticagrelor 180 mg now so that platelets are inhibited by the time of PCI",
            "Load clopidogrel 600 mg now as a safer compromise before the anatomy is known",
            "Give aspirin now and load the P2Y12 inhibitor once the anatomy shows that PCI is the plan",
            "Give no antiplatelet drug at all until the angiogram has been reported",
          ],
          answer: 2,
          explanation:
            "Brilakis does not pretreat NSTE-ACS, and the 2023 ESC guideline recommends against routine pretreatment when early invasive angiography is planned. Aspirin is still given, and the P2Y12 inhibitor is loaded when PCI is chosen. Oxford's older general rule, preloading clopidogrel 300–600 mg in anyone expected to have PCI, would favour the second option; the answer follows Brilakis and the 2023 ESC guideline. Loading early adds bleeding and, if the anatomy needs surgery, delays it by days (3 for ticagrelor, 5 for clopidogrel).",
        },
        { kind: "h", text: "Switching between oral P2Y12 inhibitors" },
        {
          kind: "p",
          text: "Brilakis's Figure 3.4, from an expert consensus, frames switching as escalation or de-escalation from the guideline default (clopidogrel in stable patients, prasugrel or ticagrelor in ACS). Most patients stay on that default; escalation or de-escalation is only occasionally considered. Moving up to a potent agent after elective PCI can make sense when the danger of thrombosis exceeds the danger of bleeding; stepping down to clopidogrel after ACS PCI, when the balance runs the other way. The decision rests on clinical and procedural features and socioeconomic factors, and platelet function testing or genotyping can help guide it.",
        },
        {
          kind: "steps",
          title: "How to switch (Brilakis Fig 3.5, from the 2017 international consensus)",
          items: [
            {
              title: "Early phase: within 30 days of the event",
              detail:
                "Switch with a loading dose, given 24 hours after the last dose of the previous drug. Escalating from clopidogrel to prasugrel 60 mg or ticagrelor 180 mg is the exception: load at once, whatever the timing and dose of the clopidogrel.",
            },
            {
              title: "Late phase: beyond 30 days",
              detail:
                "Switch with a maintenance dose 24 hours after the last dose. Two exceptions: for ticagrelor to prasugrel a 60 mg load should be considered, and ticagrelor to clopidogrel takes a 600 mg load, each 24 hours after the last ticagrelor.",
            },
            {
              title: "De-escalating because of bleeding or a bleeding concern",
              detail:
                "At any stage, consider clopidogrel 75 mg maintenance without a load, 24 hours after the last prasugrel or ticagrelor dose.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Oxford's Table 8.7 sorts the same switches differently**, by stable disease versus ACS rather than by time since the event. Its ACS column uses a reload for every switch, like the consensus in the early phase. Its stable-disease column differs when escalating from clopidogrel: ticagrelor 90 mg or prasugrel 10 mg, as a maintenance dose 24 hours after the last clopidogrel. The consensus loads at once in the first 30 days but also uses a maintenance dose later, so on this switch the two differ only in the early phase. Both sources load clopidogrel 600 mg, 24 hours after the last dose, when coming off ticagrelor (outside the consensus's bleeding exception).",
        },
        {
          kind: "check",
          stem: "Three weeks after PCI for ACS, a man on ticagrelor has troublesome dyspnoea. Heart failure and lung disease have been excluded, he has not bled, and the team decides to change to clopidogrel. How?",
          options: [
            "Clopidogrel 75 mg the next morning, with no loading dose",
            "Clopidogrel 600 mg 24 hours after the last ticagrelor dose, then 75 mg daily",
            "Clopidogrel 600 mg taken together with the next ticagrelor dose, then 75 mg daily",
            "Stop ticagrelor and leave him on aspirin alone until his 12-month review",
          ],
          answer: 1,
          explanation:
            "Within 30 days, switching uses a loading dose 24 hours after the last dose of the previous drug, and ticagrelor to clopidogrel needs the 600 mg load. Clopidogrel 75 mg without a load is reserved for de-escalation because of bleeding or bleeding concerns. For ticagrelor dyspnoea, Brilakis first looks for other causes and, if it persists, replaces ticagrelor with prasugrel or clopidogrel; he does not leave the patient on aspirin alone.",
        },
        { kind: "h", text: "When things go wrong" },
        {
          kind: "table",
          head: ["Problem", "Prevention", "Treatment"],
          rows: [
            [
              "Bleeding",
              "Shorter aspirin with an anticoagulant; tailor the P2Y12 duration to the predicted bleeding risk; avoid potent agents at high bleeding risk; routine proton pump inhibitor on DAPT",
              "Local control of the bleeding site; de-escalate to clopidogrel. For life-threatening bleeding on an irreversible agent (aspirin, clopidogrel, prasugrel), platelet transfusion; it may not work with ticagrelor because its binding is reversible. Brilakis (2020) notes that a specific ticagrelor reversal agent was then in development",
            ],
            [
              "Dyspnoea on ticagrelor",
              "None specific",
              "Look for heart failure and lung disease. Caffeine, aminophylline and theophylline were under study. If it persists without another cause, change to prasugrel or clopidogrel",
            ],
            [
              "Allergy",
              "None specific",
              "Find out which drug caused it. Replace a culprit P2Y12 inhibitor with another; for aspirin, desensitise (Brilakis reproduces a nasal ketorolac and oral aspirin challenge protocol, complete after a 325 mg dose)",
            ],
            [
              "Stent thrombosis",
              "Adherence: Oxford lists premature stopping of DAPT, or of clopidogrel alone, first among its predisposing factors",
              "Managed as acute thrombus (complications modules)",
            ],
          ],
        },
        { kind: "h", text: "How long DAPT continues, in the two manuals" },
        {
          kind: "p",
          text: "Brilakis sets the duration case by case, trading fewer ischaemic events against more bleeding, and uses two scores to do it (his Figure 3.6): PRECISE-DAPT for bleeding risk and the DAPT score for the benefit of going beyond a year. Oxford gives a minimum for clopidogrel by stent type, at least 4 weeks after a bare-metal stent and at least 6 months after a drug-eluting stent, and notes that many centres now use 12 months or longer, particularly after complex PCI.",
        },
        {
          kind: "table",
          caption: "DAPT duration after PCI (Brilakis 3.5; Oxford Table 8.8). The books predate the current ESC guidelines, which the post-procedure module teaches.",
          head: ["Situation", "Brilakis 3.5", "Oxford Table 8.8"],
          rows: [
            ["Stable disease, bleeding risk not high", "6 months", "Aspirin with clopidogrel, 6 months"],
            ["Stable disease, high bleeding risk", "Shortened to 3 months when PRECISE-DAPT is 25 or more", "Aspirin with clopidogrel, 3 months; the table also shows a period under 1 month"],
            ["ACS, bleeding risk not high", "12 months", "Aspirin with ticagrelor, clopidogrel or prasugrel, 12 months"],
            ["ACS, high bleeding risk", "Shortened to 6 months when PRECISE-DAPT is 25 or more", "Aspirin with clopidogrel or ticagrelor, 6 months"],
            ["Beyond 12 months", "Considered when bleeding risk is not high and ischaemic risk is; a DAPT score of 2 or more favours it", "Not in the table; many centres continue clopidogrel 12 months or longer after complex PCI"],
            ["Dropping aspirin early", "TWILIGHT: aspirin stopped after 3 months, ticagrelor continued alone, with less bleeding and no rise in major adverse events", "Not covered"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's Table 8.8 also covers CABG (no DAPT indication after surgery for stable disease; after surgery for ACS, the same 12 months, or 6 months at high bleeding risk, as after PCI), and its Table 8.9 covers ACS managed medically: aspirin with ticagrelor, clopidogrel or prasugrel for 12 months, or aspirin with clopidogrel for more than 1 month at high bleeding risk, and no DAPT indication in stable disease. The PCI pharmacology lesson on DAPT duration and the module on what happens after the procedure give the current ESC durations.",
        },
        {
          kind: "check",
          stem: "A 71-year-old has a drug-eluting stent implanted electively for stable angina. His PRECISE-DAPT score is 31 and he takes no anticoagulant. Following Brilakis, how long should aspirin and clopidogrel continue together?",
          options: [
            "1 month, then clopidogrel alone, because any score above 25 forbids longer DAPT",
            "3 months, the shortened course for stable patients at high bleeding risk",
            "6 months, the standard duration for stable disease whatever the score",
            "12 months, because a drug-eluting stent always needs a full year of DAPT",
          ],
          answer: 1,
          explanation:
            "Brilakis's standard after PCI for stable disease is 6 months, shortened to 3 months when PRECISE-DAPT is 25 or more; Oxford's Table 8.8 also gives 3 months for stable disease at high bleeding risk. Six months ignores the bleeding score, and 12 months is the ACS default. Oxford's table shows a period under 1 month as an option, but neither book makes it the rule at this score.",
        },
        {
          kind: "p",
          text: "In the lab, Oxford's nurse records whether a loading dose has been given in the lab or still needs to be given on the ward, documents the need for and duration of DAPT, and teaches the patient why missed doses matter.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming a patient has had aspirin: Brilakis's planning list asks the question every time.",
            "Prasugrel after a TIA, or at full maintenance dose in a 78-year-old (Brilakis 5 mg; Oxford advises against it).",
            "Ticagrelor with clarithromycin, ritonavir, rifampicin or carbamazepine, or alongside simvastatin above 40 mg.",
            "Expecting a P2Y12 load given after morphine to be working by the time of STEMI PCI.",
            "Switching from ticagrelor to clopidogrel with a maintenance dose when there is neither bleeding nor a bleeding concern.",
            "Treating ticagrelor dyspnoea as harmless before heart failure has been excluded.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every PCI ask three things aloud: aspirin given, which P2Y12 inhibitor and when, and anything that forbids the one you plan. It takes ten seconds and catches the errors this lesson describes.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, at the hand-over to PCI, confirm that aspirin has been given and choose a P2Y12 inhibitor and loading dose for the presentation, after screening the chart for age, weight, previous stroke, TIA or intracranial bleeding, an oral anticoagulant and interacting drugs. State when the load should be given relative to the PCI.",
        },
        { kind: "video", id: "CcvacbwmOAE", note: "Manual of PCI chapter video on antiplatelet agents (section 3.5)." },
        { kind: "video", id: "w-HJDwkCZe4", note: "Elias Hanna on antiplatelet therapy around PCI: acute and long-term management." },
        { kind: "video", id: "zeuA7znJ1XY", note: "Elias Hanna: antiplatelet therapy updates." },
        { kind: "video", id: "MBly5CGsQeo", note: "Antiplatelet therapies, state of the art (Dallas CVI 2016 lecture)." },
        {
          kind: "keypoints",
          items: [
            "Aspirin 300 mg load and 75 mg daily (Oxford; Brilakis gives the US 325 mg and 81–100 mg).",
            "Clopidogrel for stable disease, with an oral anticoagulant and as an option at high bleeding risk; prasugrel or ticagrelor for ACS; the 2023 ESC guideline says prasugrel should be considered in preference to ticagrelor when PCI follows (class IIa).",
            "Prasugrel: never after stroke or TIA; 5 mg maintenance (Brilakis) or avoid (Oxford) over 75 years or under 60 kg. Ticagrelor: never after intracranial haemorrhage; beware CYP3A drugs.",
            "Pretreat for planned elective PCI and, optionally, STEMI; not routinely in NSTE-ACS heading for early angiography.",
            "Opioids delay oral absorption: use an IV agent if the oral drug cannot work in time.",
            "Switch with a load in the first 30 days, a maintenance dose later; ticagrelor to clopidogrel takes 600 mg unless the reason is bleeding or a bleeding concern, and for ticagrelor to prasugrel a 60 mg load should be considered in the late phase too.",
            "DAPT duration: Brilakis 6 months (stable) or 12 months (ACS), shortened to 3 or 6 months when PRECISE-DAPT is 25 or more, longer than 12 months considered with a DAPT score of 2 or more.",
            "Surgery: stop prasugrel 7, clopidogrel 5, ticagrelor 3 days before; aspirin usually continues; heparin bridging gives no proven stent protection.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-antithrombotics-iv",
      title: "Intravenous antiplatelet agents: GP IIb/IIIa inhibitors and cangrelor",
      minutes: 14,
      topics: ["ph-iv-antiplatelet"],
      sources: [
        { book: "brilakis-pci", loc: "3.5" },
        { book: "brilakis-pci", loc: "3.1" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "11.2" },
        { book: "brilakis-pci", loc: "18.3" },
        { book: "brilakis-pci", loc: "20.3" },
        { book: "brilakis-pci", loc: "20.9" },
        { book: "brilakis-pci", loc: "21.3" },
        { book: "brilakis-pci", loc: "22.1" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "26.4" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "oxford-cath", loc: "ch 8: Anticoagulation therapy" },
        { book: "oxford-cath", loc: "ch 8: Vein graft PCI" },
        { book: "oxford-cath", loc: "ch 8: The no-reflow phenomenon" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI" },
        { book: "oxford-cath", loc: "ch 10: Coronary perforation" },
        { book: "oxford-cath", loc: "ch 10: Vascular complications" },
      ],
      refs: [...BOOKS, "esc-acs-2023", "dailymed-eptifibatide-2024", "melloni-eptifibatide-renal-2011", "schror-gpi-pharmacology-2003"],
      blocks: [
        {
          kind: "p",
          text: "Intravenous antiplatelet agents act within minutes, which is exactly why they are kept for moments when minutes matter: thrombus growing in front of you, or oral drugs that cannot be absorbed in time. Brilakis gives them two goals, to stop thrombus propagating when there is large intracoronary thrombus or no-reflow, and to prevent stent thrombosis. Their price is bleeding, so the skill is knowing when to start, how to adjust everything else, and when to leave them alone.",
        },
        { kind: "h", text: "The agents" },
        {
          kind: "table",
          caption: "Intravenous antiplatelet agents (Brilakis 3.5; Oxford ch 8). Typical doses for orientation; follow local protocol and the product information. Oxford: bleeding is common with GP IIb/IIIa inhibitors and may need platelet infusion, especially after abciximab.",
          head: ["Agent", "How it acts", "Dose with normal renal function", "Renal adjustment", "Offset"],
          rows: [
            [
              "Cangrelor",
              "Short-acting intravenous P2Y12 inhibitor",
              "30 µg/kg IV bolus, then 4 µg/kg/min for at least 2 hours or for the length of the procedure, whichever is longer",
              "None, in renal or hepatic impairment",
              "Short half-life: platelet function returns quickly if bleeding occurs, its advantage over GP IIb/IIIa inhibitors",
            ],
            [
              "Eptifibatide",
              "Small-molecule GP IIb/IIIa inhibitor: competitive, reversible block of aggregation during the infusion",
              "Two boluses of 180 µg/kg, 10 minutes apart, then 2.0 µg/kg/min, running at most 18 hours",
              "Brilakis halves the infusion to 1 µg/kg/min at a creatinine clearance of 60 mL/min or less. The US product information (and the EARLY ACS protocol) halves it below 50 mL/min and contraindicates eptifibatide in patients dependent on dialysis: follow the product information",
              "Oxford gives a half-life under 1 hour; a pharmacology review puts the plasma half-life nearer 2 hours, with the antiplatelet effect following it (Schrör 2003)",
            ],
            [
              "Tirofiban",
              "Small-molecule GP IIb/IIIa inhibitor, as above",
              "25 µg/kg over 3 minutes, then 0.15 µg/kg/min for up to 18 hours",
              "Creatinine clearance 60 mL/min or less: infusion halved to 0.075 µg/kg/min",
              "Oxford gives a half-life under 1 hour; a pharmacology review puts the plasma half-life nearer 2 hours, with the antiplatelet effect following it (Schrör 2003)",
            ],
            [
              "Abciximab (Oxford only; Brilakis lists only eptifibatide, tirofiban and cangrelor as available in the United States)",
              "Monoclonal antibody fragment: non-competitive, irreversible platelet blockade",
              "Weight-adjusted IV (or intracoronary) bolus, then a 12-hour infusion",
              "Not stated",
              "Irreversible blockade (see the caption note on platelet infusion)",
            ],
          ],
        },
        {
          kind: "p",
          text: "Oxford adds that blocking the GP IIb/IIIa receptor not only prevents aggregation but may break up platelets that have already clumped, and that these drugs are given with heparin. Brilakis lists only eptifibatide, tirofiban and cangrelor as available in the United States.",
        },
        { kind: "h", text: "When to reach for one" },
        {
          kind: "list",
          items: [
            "**Large thrombus burden in ACS, or bail-out for a thrombotic complication** (Brilakis 20.3), in a patient whose bleeding risk is acceptable (3.5).",
            "**Acute vessel closure from thrombus:** Brilakis's algorithm checks the ACT and considers a GP IIb/IIIa inhibitor or cangrelor (25.2).",
            "**Embolised plaque or thrombus:** anticoagulation plus an intravenous antiplatelet agent, thrombectomy for large visible thrombus, and intracoronary vasodilators (Brilakis 5.5).",
            "**Oral P2Y12 inhibitor not absorbed in time**, typically after opioids in STEMI (Brilakis 3.1).",
            "**Large residual thrombus once flow is restored:** Brilakis describes deferring further intervention for 24–48 hours of intense antithrombotic therapy, which may include an intravenous platelet inhibitor, then repeating angiography. Oxford reports that a deferred-stenting strategy in STEMI did not improve outcomes in DANAMI-DEFER and is not recommended by guidelines; the two manuals are discussing overlapping but not identical situations (see the ACS and thrombus module).",
            "**No-reflow prevention:** Oxford notes that pretreatment with GP IIb/IIIa inhibitors may reduce thromboembolisation in vulnerable lesions.",
          ],
        },
        {
          kind: "p",
          text: "**Then and now.** Oxford describes GP IIb/IIIa inhibitors as established in the medical management of NSTEMI and in PCI for ACS and complex disease, particularly with thrombus, and suggests considering them in insulin-treated diabetics. Brilakis already confines them to selected patients with large thrombus or thrombotic complications. The 2023 ESC ACS guideline takes the narrower view: GP IIb/IIIa inhibitors are kept for bail-out when there is no-reflow or a thrombotic complication, and cangrelor may be considered in patients having PCI who have not received a P2Y12 inhibitor.",
        },
        { kind: "tip", id: "pci-gpi-cangrelor-bailout" },
        {
          kind: "check",
          stem: "During primary PCI for an inferior STEMI, the patient (who received morphine in the ambulance and then vomited) has a large thrombus burden; after the wire, TIMI 1 flow becomes TIMI 2 with residual thrombus. ACT is 310 s on a Hemochron with heparin alone. Bleeding risk is acceptable. You start eptifibatide. What else changes?",
          options: [
            "Nothing: the heparin and the ACT goal stay exactly as they were",
            "The ACT goal becomes 200–250 seconds, so no further heparin is given for now",
            "Give protamine to bring the ACT down to 200–250 seconds before the bolus",
            "Stop heparin altogether, because eptifibatide replaces it as the anticoagulant",
          ],
          answer: 1,
          explanation:
            "With a GP IIb/IIIa inhibitor or cangrelor, Brilakis aims for an ACT of 200–250 seconds (and 50–70 units/kg of heparin) to limit bleeding; the current ACT is above that, so you do not add heparin. You do not reverse heparin to reach a lower number, and GP IIb/IIIa inhibitors are given with heparin, not instead of it.",
        },
        { kind: "h", text: "Running the infusion safely" },
        {
          kind: "steps",
          items: [
            {
              title: "Adjust the heparin",
              detail: "50–70 units/kg if the IV antiplatelet agent is planned from the start, and an ACT goal of 200–250 seconds (Brilakis 3.4 and 3.5).",
            },
            {
              title: "Dose by weight and kidney function",
              detail: "Halve the tirofiban infusion at a creatinine clearance of 60 mL/min or less, and the eptifibatide infusion below 50 mL/min as its product information directs (Brilakis uses 60 for both); do not give eptifibatide to a patient dependent on dialysis. Cangrelor needs no change.",
            },
            {
              title: "Remember the platelets",
              detail:
                "Brilakis lists thrombocytopenia caused by GP IIb/IIIa inhibitors among the causes of bleeding on these drugs, alongside their antiplatelet effect.",
            },
            {
              title: "Handle the access",
              detail:
                "Oxford notes that patients who have had GP IIb/IIIa inhibitors are at higher risk of access-site bleeding, and Brilakis lists them, with cangrelor, among the causes of femoral bleeding. A radial sheath still comes out at the end of the case, even while the infusion runs (Brilakis 11.2).",
            },
            {
              title: "If bleeding occurs",
              detail:
                "Eptifibatide, tirofiban and cangrelor have no antidote: switch the infusion off and platelet function recovers over time. Oxford notes that bleeding on GP IIb/IIIa inhibitors is common and may need platelet infusion, especially after abciximab.",
            },
          ],
        },
        { kind: "h", text: "When not to give one" },
        {
          kind: "table",
          head: ["Setting", "Advice", "Why"],
          rows: [
            ["CTO PCI", "Not given, even after successful crossing and stenting (Brilakis 21.3)", "A small wire exit that seemed sealed can bleed again into the pericardium after the case"],
            ["Coronary perforation", "Stop any GP IIb/IIIa inhibitor or cangrelor (Brilakis 26.2); after a distal wire perforation, monitor closely and do not start one (26.4)", "Ongoing bleeding into the pericardium (26.2 gives no further reason); after a distal perforation, tamponade may appear hours later (26.4)"],
            ["Spontaneous coronary artery dissection", "Generally avoided (Brilakis 22.1)", "Risk of extending the intramural haematoma"],
            ["Saphenous vein graft PCI", "Not used routinely: Brilakis says they can cause harm; Oxford finds no proven benefit", "Despite the thrombus burden of graft lesions"],
            ["High bleeding risk", "Selective use only (Brilakis 3.5)", "Bleeding from the drug and from thrombocytopenia"],
          ],
        },
        { kind: "tip", id: "pci-perforation-stop-iv-antiplatelet" },
        { kind: "tip", id: "pci-svg-no-routine-gpi" },
        { kind: "h", text: "Cangrelor and the oral P2Y12 inhibitors" },
        {
          kind: "p",
          text: "Cangrelor stops clopidogrel and prasugrel binding to platelets. So Brilakis gives ticagrelor at any time, before, during or after the infusion, but gives the clopidogrel or prasugrel loading dose immediately after cangrelor is stopped. Get this wrong and the patient leaves the lab with the infusion off and the oral drug unable to act.",
        },
        { kind: "tip", id: "pci-cangrelor-to-oral" },
        {
          kind: "check",
          stem: "A P2Y12-naive patient has PCI under cangrelor because he could not take oral drugs reliably. The team now wants him on prasugrel. When is the 60 mg load given?",
          options: [
            "At once, during the infusion, so that the two drugs overlap",
            "Immediately after the cangrelor infusion is stopped",
            "At least 24 hours after the infusion has been stopped",
            "Only once platelet function testing confirms full recovery",
          ],
          answer: 1,
          explanation:
            "Cangrelor blocks the binding of clopidogrel and prasugrel, so their loading dose is given immediately after the infusion is stopped. Overlap works only for ticagrelor, which can be given at any time. Waiting 24 hours would leave the patient without P2Y12 inhibition just after stenting.",
        },
        {
          kind: "pitfalls",
          items: [
            "Keeping the ACT at 300–350 seconds after starting a GP IIb/IIIa inhibitor or cangrelor.",
            "Giving a GP IIb/IIIa inhibitor after a CTO PCI 'to protect the stents'.",
            "Leaving an infusion running after a perforation, or starting one after a distal wire perforation that seemed to seal.",
            "Using GP IIb/IIIa inhibitors in SCAD or routinely in vein graft PCI.",
            "Forgetting the renal halving of eptifibatide and tirofiban infusions, or giving eptifibatide to a patient on dialysis.",
            "Loading clopidogrel or prasugrel during a cangrelor infusion.",
          ],
        },
        {
          kind: "pearl",
          text: "Before starting an IV antiplatelet agent, check two things: is the ACT the reason for the thrombus, and could this vessel have a perforation you have not yet seen? If either answer is yes, the infusion can wait.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (LCx STEMI), when thrombus or slow flow appears, check the ACT first, then decide whether a GP IIb/IIIa inhibitor is justified and how the heparin target changes. In a case with a wire perforation, stop any IV antiplatelet agent.",
        },
        { kind: "video", id: "CcvacbwmOAE", note: "Manual of PCI chapter video on antiplatelet agents, including the intravenous ones." },
        {
          kind: "keypoints",
          items: [
            "Cangrelor: 30 µg/kg bolus, 4 µg/kg/min for at least 2 h or the procedure; no renal change; fast offset.",
            "Eptifibatide: 180 µg/kg twice, 10 min apart, then 2.0 µg/kg/min; tirofiban: 25 µg/kg over 3 min, then 0.15 µg/kg/min; halve tirofiban at creatinine clearance 60 mL/min or less and eptifibatide below 50 mL/min (Brilakis uses 60 for both); no eptifibatide on dialysis.",
            "With any of them: heparin 50–70 units/kg and an ACT of 200–250 seconds.",
            "Use them selectively, as bail-out for large thrombus, thrombotic complications or embolism, or when oral drugs cannot act in time.",
            "Avoid them in CTO PCI, SCAD and routine vein graft PCI; stop them in perforation.",
            "No reversal agents: stop the infusion; Oxford may give platelets for GP IIb/IIIa inhibitor bleeding, especially after abciximab (an agent Brilakis does not list as available in the US).",
            "After cangrelor: ticagrelor at any time; clopidogrel or prasugrel immediately after it stops.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-antithrombotics-q1",
      stem: "Your lab measures the ACT with a HemoTec device. For an elective PCI with heparin alone, which reading meets Brilakis's goal?",
      options: ["210 seconds", "245 seconds", "275 seconds", "380 seconds"],
      answer: 2,
      explanation:
        "On a HemoTec the goal with heparin alone is 250–300 seconds, so 275 seconds is in range. The 300–350 second goal belongs to the Hemochron, which reads higher for the same blood. 210 and 245 seconds are too low for heparin alone; 210 falls in the 200–250 second goal Brilakis gives only when a GP IIb/IIIa inhibitor or cangrelor is running (a figure he states for the Hemochron). 380 seconds is above the HemoTec range for heparin alone; Brilakis's only goal above 350 seconds is for retrograde CTO PCI on a Hemochron.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q2",
      stem: "Five minutes after 7000 units of heparin, the ACT is 135 seconds, barely above baseline. The IV cannula in the left forearm is swollen. What is the best next step?",
      options: [
        "Give a further heparin dose through the arterial sheath and repeat the ACT before wiring",
        "Start bivalirudin, because a flat response to heparin implies antithrombin III deficiency",
        "Proceed with wiring, as heparin takes about 30 minutes to reach its peak effect",
        "Give a GP IIb/IIIa inhibitor bolus, which works without needing any heparin effect",
      ],
      answer: 0,
      explanation:
        "A tissued line means the drug probably never reached the circulation, one of the three causes of a low ACT that Brilakis lists. He gives the next dose through the arterial sheath when the IV line is in doubt and repeats the ACT before any device enters the coronary. Antithrombin III deficiency is another listed cause, but an obviously failed line is the one to deal with first here; wiring now invites thrombus.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q3",
      stem: "A 70-year-old diabetic who has used isophane insulin for years develops a large groin haematoma after PCI. All coronary equipment is out; 9000 units of heparin were given 10 minutes ago. Which protamine plan follows the manuals?",
      options: [
        "90–135 mg (1–1.5 mg per 100 units), pushed quickly to stop the bleeding sooner",
        "50 mg given slowly, with the team ready for hypotension in the next 5–10 minutes",
        "No protamine, because isophane insulin is an absolute contraindication to its use",
        "10 mg as a test dose, then 80 mg if no reaction has appeared within 2 minutes",
      ],
      answer: 1,
      explanation:
        "The ratio gives 90–135 mg but every version in the manuals caps the dose at 50 mg, given slowly. Isophane insulin raises the risk of a reaction (typically severe hypotension and pulmonary vasoconstriction 5–10 minutes later) but is a reason for caution, not a contraindication. A fast push of a large dose is the scenario most likely to provoke a reaction, and high doses of protamine are themselves anticoagulant.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "pm-antithrombotics-q4",
      stem: "A patient on haemodialysis with suspected type 2 HIT needs urgent PCI. Which bivalirudin regimen does Brilakis give?",
      options: [
        "0.75 mg/kg bolus, then 0.25 mg/kg/h",
        "0.75 mg/kg bolus, then 1.75 mg/kg/h",
        "0.5 mg/kg bolus, then 1 mg/kg/h",
        "No bolus, then 1 mg/kg/h",
      ],
      answer: 0,
      explanation:
        "The bolus is 0.75 mg/kg regardless of renal function; the infusion is 0.25 mg/kg/h on haemodialysis, 1 mg/kg/h below a creatinine clearance of 30 mL/min, and 1.75 mg/kg/h otherwise. Bivalirudin has no antidote, so the lower rate matters: an overdose cannot be reversed, only stopped.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q5",
      stem: "An operator proposes bivalirudin for a long retrograde CTO PCI, arguing that its short half-life makes it safer. Which reply reflects Brilakis's teaching?",
      options: [
        "Agree: with a 25-minute half-life, a perforation can be managed simply by stopping the infusion",
        "Prefer heparin: protamine can reverse it after a perforation, and bivalirudin has caused guide thrombosis",
        "Agree, provided a GP IIb/IIIa inhibitor is added once the occlusion has been crossed and stented",
        "Prefer low-molecular-weight heparin, because in a long case it needs no ACT monitoring at all",
      ],
      answer: 1,
      explanation:
        "Brilakis prefers unfractionated heparin for CTO PCI because protamine can reverse it after a severe perforation; bivalirudin cannot be reversed, and he mentions unpublished cases of guide thrombosis during long procedures. GP IIb/IIIa inhibitors and cangrelor are not given in CTO PCI, even after success, because wire perforations can reopen later.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q6",
      stem: "A 58-year-old with low-risk atrial fibrillation (normal LV, no stroke) takes dabigatran; creatinine clearance is 45 mL/min. He is booked for elective radial PCI. Which statement about the hold is correct?",
      options: [
        "Brilakis holds dabigatran for 2 days at this clearance, and Oxford holds it for 24 hours",
        "Brilakis holds it 4 days; Oxford holds dabigatran 72 hours in renal impairment",
        "Both manuals hold it for 5 days, the longest interval anywhere in Brilakis's DOAC table",
        "Neither manual holds it, because his AF is low risk and the planned access is radial",
      ],
      answer: 1,
      explanation:
        "Brilakis's table gives dabigatran 4 days at a creatinine clearance of 30–49 mL/min (2 days above 80, 3 days at 50–79, 5 days at 15–29). Oxford's usual DOAC hold is 24 hours, with dabigatran in renal impairment the exception at 72 hours. Radial access reduces bleeding but does not remove the hold before an elective case.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "pm-antithrombotics-q7",
      stem: "Which patient on warfarin does Oxford list among those in whom warfarin can be interrupted for 3–5 days ahead of an elective angiogram?",
      options: [
        "Atrial fibrillation with poor left ventricular function and diabetes",
        "Impaired left ventricular function with a laminar apical thrombus",
        "Rheumatic mitral valve disease in sinus rhythm",
        "A mechanical mitral valve prosthesis in sinus rhythm",
      ],
      answer: 1,
      explanation:
        "Oxford allows warfarin to be stopped in impaired LV function with laminar apical thrombus, provided catheters are not passed into the left ventricle, as well as in low-risk AF, recurrent DVT or PE, and when no arm offers arterial access. Moderate or high-risk AF, prosthetic valves (particularly mechanical ones, such as a mechanical mitral valve) and rheumatic mitral disease are on the continue-or-bridge list. For AF, BRIDGE has since shown that interruption without bridging is safe, but the question asks for Oxford's list.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "douketis-bridge-2015"],
    },
    {
      id: "pm-antithrombotics-q8",
      stem: "Ten days after PCI for NSTEMI, a patient on prasugrel has a minor but persistent gastrointestinal bleed, and the team decides to de-escalate to clopidogrel because of it. How should the switch be made?",
      options: [
        "Clopidogrel 600 mg at once, without waiting, because the patient is still within 30 days",
        "Clopidogrel 75 mg daily, starting 24 hours after the last prasugrel dose, with no load",
        "Clopidogrel 600 mg 24 hours after the last prasugrel dose, then 75 mg daily thereafter",
        "Stop prasugrel and give no P2Y12 inhibitor until the bleeding has fully settled",
      ],
      answer: 1,
      explanation:
        "In the early phase, switching normally uses a loading dose 24 hours after the last dose, but de-escalation because of bleeding or bleeding concerns is the exception: Brilakis's figure suggests clopidogrel 75 mg maintenance, 24 hours after the last prasugrel or ticagrelor dose. Stopping all P2Y12 inhibition ten days after stenting risks stent thrombosis; Oxford lists premature discontinuation first among its causes.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q9",
      stem: "Which patient should not be given a GP IIb/IIIa inhibitor according to Brilakis?",
      options: [
        "Primary PCI with a large thrombus burden and acceptable bleeding risk",
        "Thrombotic acute vessel closure after balloon angioplasty, with a therapeutic ACT",
        "Spontaneous coronary artery dissection needing a stent in the LAD",
        "Embolisation of thrombus into a distal branch during PCI of a culprit lesion",
      ],
      answer: 2,
      explanation:
        "In SCAD, Brilakis generally avoids GP IIb/IIIa inhibitors and cangrelor because they may extend the intramural haematoma. Large thrombus in ACS, thrombotic acute closure and embolised thrombus are the settings in which he uses an intravenous antiplatelet agent, provided bleeding risk is acceptable.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q10",
      stem: "An 80 kg patient with creatinine clearance 50 mL/min is started on tirofiban for bail-out during PCI. Which regimen matches Brilakis's table?",
      options: [
        "25 µg/kg over 3 minutes, then 0.075 µg/kg/min",
        "25 µg/kg over 3 minutes, then 0.15 µg/kg/min",
        "180 µg/kg twice, 10 minutes apart, then 1 µg/kg/min",
        "30 µg/kg bolus, then 4 µg/kg/min for at least 2 hours",
      ],
      answer: 0,
      explanation:
        "Tirofiban's bolus is 25 µg/kg over 3 minutes and the infusion is 0.15 µg/kg/min, halved to 0.075 µg/kg/min when creatinine clearance is 60 mL/min or less, as here. The double 180 µg/kg bolus is eptifibatide, and 30 µg/kg then 4 µg/kg/min is cangrelor.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-antithrombotics-q11",
      stem: "A patient pretreated with fondaparinux for NSTE-ACS comes to PCI. What did the FUTURA/OASIS-8 trial show about heparin at the procedure?",
      options: [
        "Heparin could be omitted altogether, because catheter thrombus was no more frequent without it",
        "A 50 units/kg dose did not reduce major bleeding or access complications versus standard dosing",
        "A low dose of 50 units/kg halved major bleeding and should be used whenever fondaparinux has been given",
        "Bivalirudin proved safer than any heparin regimen in patients already treated with fondaparinux",
      ],
      answer: 1,
      explanation:
        "Every patient in FUTURA/OASIS-8 received IV heparin at PCI. Low-dose heparin (50 units/kg) did not reduce major peri-PCI bleeding or access-site complications compared with standard dosing (85 units/kg, or 60 with a GP IIb/IIIa inhibitor, adjusted by ACT). Minor bleeding alone was lower with the low dose (0.7% versus 1.7%), but the key secondary composite of major bleeding with death, MI or revascularisation was 5.8% versus 3.9% (P = 0.05). The trial did not test omitting heparin or using bivalirudin.",
      difficulty: 3,
      refs: ["steg-futura-oasis8-2010"],
    },
  ],
  sims: [
    {
      sim: "procedure",
      task: "Run a full case on a patient with an antithrombotic history: plan the anticoagulant hold or bridge and the access, give and time the heparin, check the ACT before the hand-over to PCI, and confirm aspirin and the right P2Y12 inhibitor before stenting.",
    },
    {
      sim: "pci-bench",
      task: "Before deploying a stent, state the patient's current ACT, the target for your lab's device, and whether a GP IIb/IIIa inhibitor or cangrelor is running.",
    },
  ],
  caseIds: ["pm-antithrombotics-case-doac", "pm-antithrombotics-case-hit"],
};

// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "pm-antithrombotics-case-doac",
    title: "Elective PCI in a patient taking rivaroxaban",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 1.3 (Table 1.2), 3.4, 3.5, 4.1, 4.2, 11.2, 25.2 and 30.3; Oxford Handbook, chapter 1 (patient preparation), chapter 3 (anticoagulation issues) and chapter 8 (antiplatelet therapy)",
    },
    summary:
      "A man with atrial fibrillation on rivaroxaban and moderate renal impairment comes for elective PCI of the LAD: the DOAC hold, the access, antiplatelet loading, the heparin dose, a low ACT from a failed cannula, thrombus in a long case and the antithrombotic plan at discharge.",
    presentation:
      "A 72-year-old man, 84 kg, with exertional angina despite medical therapy and a severe proximal LAD stenosis on a recent CT coronary angiogram. He has atrial fibrillation (no previous stroke, normal LV function) and takes rivaroxaban and a statin. Creatinine clearance 42 mL/min. Platelets 210 × 10⁹/L.",
    findings: [
      "Elective PCI planned for a stable patient",
      "Rivaroxaban for atrial fibrillation; creatinine clearance 42 mL/min",
      "Taking no antiplatelet drug",
    ],
    steps: [
      {
        id: "s1",
        prompt: "At the pre-assessment clinic, how long should the rivaroxaban be held before the procedure, following Brilakis's table?",
        options: [
          {
            text: "3 days, because creatinine clearance is between 15 and 49 mL/min",
            best: true,
            feedback:
              "Brilakis holds rivaroxaban 2 days at a creatinine clearance of 50 mL/min or more and 3 days at 15–49 mL/min. Oxford's general rule is shorter (24 hours), so check which one your unit follows.",
          },
          {
            text: "24 hours, as for any DOAC",
            acceptable: true,
            feedback: "This is Oxford's general rule (with 72 hours for dabigatran in renal impairment). It is a recognised position, but Brilakis would hold rivaroxaban for 3 days at this clearance.",
          },
          {
            text: "Do not hold it: the PCI will be radial",
            next: "c-nohold",
            feedback: "Radial access reduces bleeding, but both manuals stop a DOAC before an elective procedure.",
            stateDelta: { stability: -10, flags: ["doac-active"] },
          },
        ],
      },
      {
        id: "c-nohold",
        kind: "consequence",
        prompt: "He arrives having taken rivaroxaban this morning. The case is elective. What now?",
        options: [
          {
            text: "Postpone the elective PCI and rebook with a clear hold plan",
            best: true,
            feedback: "Nothing about a stable patient forces you to anticoagulate on top of an active DOAC. Rebook with the hold written down.",
          },
          {
            text: "Proceed and give the full heparin dose as usual",
            feedback: "Stacking full-dose heparin on an active DOAC for an elective case adds bleeding risk for no benefit; the manuals stop the DOAC first.",
            stateDelta: { stability: -10, flags: ["bleeding-risk"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "He has held rivaroxaban as planned. Which access do you choose?",
        options: [
          {
            text: "Right radial",
            best: true,
            feedback: "Brilakis's algorithm sends patients on oral anticoagulants or at high bleeding risk to radial access, and Oxford does the same for anticoagulated patients.",
          },
          {
            text: "Right femoral with ultrasound and fluoroscopic guidance",
            acceptable: true,
            feedback: "Possible if there were a reason to avoid the radial, and guided puncture is right if you do go femoral, but nothing here argues against radial access.",
          },
          {
            text: "Right femoral by palpation alone, since the DOAC is off",
            feedback: "Even off the DOAC, he is an older man with renal impairment who will be fully heparinised; Oxford advises considering fluoroscopic and ultrasound guidance for a femoral puncture in an anticoagulated patient, and Brilakis uses both for every femoral access.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2b",
        prompt: "He takes no antiplatelet drug, and the PCI is planned for this afternoon. What do you order beforehand?",
        options: [
          {
            text: "An aspirin loading dose and clopidogrel 600 mg, ideally 6 hours or more before the PCI",
            best: true,
            feedback:
              "Brilakis pretreats stable patients once PCI is planned, with clopidogrel 600 mg ideally at least 6 hours before, and asks before every planned PCI whether aspirin and a P2Y12 inhibitor have been given. With an oral anticoagulant, Brilakis stops aspirin after the procedure or after a period of 1–4 weeks to 6 months; current ESC guidance keeps it to about a week by default (step s7). Typical doses: aspirin 300 mg (Oxford) or 325 mg (Brilakis's US figure); follow local protocol.",
          },
          {
            text: "An aspirin load and clopidogrel 300 mg, as Oxford's preload when there are 72 hours to spare",
            stateDelta: { stability: -5, flags: ["slow-preload"] },
            feedback:
              "Oxford preloads clopidogrel 300 mg at least 72 hours before PCI, or 600 mg when less time is available, and 300–600 mg according to local policy. With the case this afternoon, 300 mg leaves too little time to act; 600 mg is the dose that fits.",
          },
          {
            text: "An aspirin load with ticagrelor 180 mg, for faster and more reliable platelet inhibition",
            feedback:
              "Brilakis avoids prasugrel and ticagrelor in patients taking warfarin or a DOAC because of their bleeding risk; clopidogrel is the P2Y12 inhibitor to combine with an oral anticoagulant.",
            stateDelta: { stability: -10, flags: ["potent-with-oac"] },
          },
          {
            text: "No antiplatelet drug before the case; start clopidogrel after the stent is in",
            feedback:
              "For planned PCI, Brilakis wants the P2Y12 inhibitor given beforehand, ideally at least 6 hours ahead, and pretreatment is part of his prevention of acute vessel closure. Stenting without platelet inhibition invites stent thrombosis.",
            stateDelta: { stability: -10, flags: ["no-preload"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The radial sheath is in and the guide is at the LAD. No GP IIb/IIIa inhibitor or cangrelor is planned. What heparin do you give?",
        options: [
          {
            text: "70–100 units/kg IV, then an ACT about 5 minutes later",
            best: true,
            feedback: "The PCI dose without an IV antiplatelet agent, with no renal adjustment, and an ACT before any device enters the coronary (typical dose; follow local protocol).",
          },
          {
            text: "50 units/kg, the usual radial diagnostic dose, to limit bleeding",
            next: "c-lowact",
            feedback: "That is a diagnostic dose. Under-anticoagulated PCI invites thrombus on the equipment.",
            stateDelta: { stability: -10, flags: ["underdosed"] },
          },
          {
            text: "No heparin, because he has been on an anticoagulant until recently",
            next: "c-lowact",
            feedback: "The DOAC has been held; PCI needs its own anticoagulation.",
            stateDelta: { stability: -20, flags: ["underdosed"] },
          },
        ],
      },
      {
        id: "c-lowact",
        kind: "consequence",
        prompt: "As the wire crosses, a hazy filling defect appears on it at the lesion. The ACT comes back at 190 seconds on the lab's Hemochron. What do you do?",
        options: [
          {
            text: "Give more heparin to a therapeutic ACT, then manage the thrombus before going further",
            best: true,
            feedback: "Brilakis's response to thrombus during PCI: additional anticoagulant to a therapeutic ACT, then manage the thrombus as in ACS.",
          },
          {
            text: "Deploy the stent over the thrombus to trap it against the wall",
            feedback: "Stenting into fresh thrombus without correcting the ACT risks embolisation and stent thrombosis.",
            stateDelta: { stability: -15, flags: ["thrombus"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Five minutes after the full heparin dose, the ACT is 140 seconds. The nurse notices that the forearm around the IV cannula is swollen. What next?",
        info: "Lab device: Hemochron. Baseline ACT 125 seconds.",
        options: [
          {
            text: "Give a further dose through the arterial sheath and repeat the ACT before wiring",
            best: true,
            feedback: "The drug probably never reached the circulation. Brilakis redoses through the arterial sheath when the IV line is doubtful and repeats the ACT before any device enters the coronary.",
          },
          {
            text: "Wire the LAD now; the ACT will rise as the heparin takes effect",
            next: "c-lowact",
            feedback: "The heparin went into the forearm tissues, not the blood. Devices go in only once the ACT is therapeutic.",
            stateDelta: { stability: -15, flags: ["underdosed"] },
          },
          {
            text: "Assume heparin resistance and switch to bivalirudin",
            feedback: "Antithrombin III deficiency is possible, but an obviously failed line is the first explanation to deal with.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The ACT is now 330 seconds. The LAD is long and calcified, and after 45 minutes you are delivering a stent through a guide extension. The trace damps slightly. What is the priority?",
        options: [
          {
            text: "Check the ACT, which was last measured more than 30 minutes ago, and watch the damping closely",
            best: true,
            feedback: "A guide extension makes the lumen 1–2 French smaller, so Brilakis asks for special attention to damping and to the ACT; the recheck interval is 20–30 minutes.",
          },
          {
            text: "Push on: the earlier ACT of 330 seconds covers the rest of the case",
            next: "c-lowact",
            feedback: "Heparin wears off through a long case; 45 minutes without a recheck is too long.",
            stateDelta: { stability: -10, flags: ["late-act"] },
          },
          {
            text: "Start a GP IIb/IIIa inhibitor to protect the guide extension",
            feedback: "GP IIb/IIIa inhibitors are bail-out drugs for large thrombus or thrombotic complications, not routine cover for equipment, and they add bleeding risk in a patient about to resume an anticoagulant.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Two stents are deployed with a good result. How do you finish at the access site?",
        options: [
          {
            text: "Remove the radial sheath now and apply a compression band, without protamine",
            best: true,
            feedback: "Brilakis removes radial sheaths immediately after the procedure whatever the ACT, so protamine is not needed for the sheath, and reversing heparin after fresh stents carries a stent-thrombosis risk.",
          },
          {
            text: "Give protamine first to bring the ACT down, then remove the sheath",
            feedback: "Reversal after fresh stents carries a stent-thrombosis risk and is not needed for a radial sheath.",
            stateDelta: { stability: -10, flags: ["reversal"] },
          },
          {
            text: "Leave the sheath in until the ACT falls below 180 seconds",
            feedback: "That is Brilakis's rule for femoral sheaths. A radial sheath left in must be flushed and transduced to stop thrombus forming, so remove it.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "What antithrombotic plan do you write for discharge?",
        options: [
          {
            text: "Restart rivaroxaban when haemostasis allows, with clopidogrel; keep aspirin short and add a proton pump inhibitor",
            best: true,
            feedback: "Brilakis continues clopidogrel with the oral anticoagulant, stops aspirin after a short period, avoids potent P2Y12 inhibitors and gives a proton pump inhibitor. Oxford restarts a DOAC on the evening after the procedure if there is no bleeding, particularly after radial access. His aspirin was started only for the PCI; with an anticoagulant it is kept short (current ESC default: triple therapy up to 1 week, then rivaroxaban with clopidogrel to 6 months after elective PCI, then rivaroxaban alone; PCI pharmacology lesson on oral anticoagulation).",
          },
          {
            text: "Rivaroxaban with aspirin and ticagrelor for 12 months",
            feedback: "Potent P2Y12 inhibitors are avoided with an oral anticoagulant, and long triple therapy multiplies bleeding.",
            stateDelta: { stability: -15, flags: ["triple-potent"] },
          },
          {
            text: "Aspirin and clopidogrel only; leave the rivaroxaban off for 6 months",
            feedback: "His atrial fibrillation still needs anticoagulation; stopping it exposes him to stroke.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "The LAD was stented from the radial artery after a 3-day rivaroxaban hold, with aspirin and clopidogrel 600 mg loaded beforehand. A failed cannula was recognised and corrected before any wire went in, the ACT was rechecked during the long guide-extension delivery, and he went home on rivaroxaban and clopidogrel with a short course of aspirin and a proton pump inhibitor.",
    outcomeVariants: [
      { flag: "underdosed", text: "Thrombus formed on the equipment because the coronary was wired before the ACT was therapeutic." },
      { flag: "late-act", text: "Thrombus developed late in the case because the ACT had not been rechecked." },
      { flag: "triple-potent", text: "He was readmitted with gastrointestinal bleeding on rivaroxaban, aspirin and ticagrelor." },
      { flag: "potent-with-oac", text: "Ticagrelor was loaded although he takes an oral anticoagulant, adding bleeding risk that clopidogrel would have avoided." },
      { flag: "no-preload", text: "He reached the stent without a P2Y12 inhibitor on board, unprotected against early stent thrombosis." },
    ],
    learningPoints: [
      "DOAC holds depend on the drug and creatinine clearance (Brilakis 2–5 days); Oxford's general rule is 24 hours.",
      "Radial access for patients on oral anticoagulants; guide any femoral puncture.",
      "Planned PCI: load aspirin and clopidogrel 600 mg beforehand, ideally 6 hours or more (Brilakis); with an oral anticoagulant, clopidogrel, never a potent P2Y12 inhibitor, and aspirin only briefly.",
      "Heparin 70–100 units/kg for PCI without IV antiplatelet agents; check the ACT about 5 minutes later and every 20–30 minutes.",
      "A low ACT with a swollen cannula means the drug did not reach the blood: redose through the arterial sheath.",
      "Guide extensions call for close attention to damping and the ACT.",
      "Radial sheaths out at the end; protamine only for bleeding and only after the coronary equipment is out.",
      "With an oral anticoagulant: clopidogrel, short aspirin, no prasugrel or ticagrelor, and a proton pump inhibitor.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "esc-af-2024"],
  },
  {
    id: "pm-antithrombotics-case-hit",
    title: "NSTEMI with a falling platelet count",
    trackId: "pci-manual",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 3.4, 3.5, 20.3 and 25.2; Oxford Handbook, chapters 3 and 4 (radial cocktail, flush infusion) and 8 (antiplatelet therapy, anticoagulation therapy); ASH 2018 HIT guideline",
    },
    summary:
      "An older woman with NSTEMI whose angiogram is delayed develops a falling platelet count on heparin: recognising HIT, PCI with renally dosed bivalirudin, choosing a P2Y12 inhibitor after a TIA at very high bleeding risk, thrombus from a disconnected infusion, bleeding without an antidote, and anticoagulation for the HIT after the PCI.",
    presentation:
      "A 77-year-old woman, 62 kg, admitted with NSTEMI. A TIA three years ago; no intracranial haemorrhage. Creatinine clearance 26 mL/min. She has received heparin since admission and aspirin 75 mg daily. Angiography was delayed by a chest infection.",
    findings: [
      "NSTEMI, haemodynamically stable",
      "Platelets 230 × 10⁹/L on admission",
      "Creatinine clearance 26 mL/min",
      "Previous TIA",
    ],
    steps: [
      {
        id: "s1",
        prompt: "On day 7, before her angiogram, the platelet count is 98 × 10⁹/L. What is your assessment?",
        options: [
          {
            text: "Suspected type 2 HIT: stop all heparin and change to a non-heparin anticoagulant",
            best: true,
            feedback: "A fall several days into heparin fits type 2 HIT (usually 4–10 days), which is immune-mediated and causes arterial and venous thrombosis. Brilakis stops all heparin and uses bivalirudin or argatroban. Score the 4Ts (ASH 2018) and, since the score here is not low, send the HIT antibody test. 'All heparin' includes heparinised flushes, pressure-line saline and any heparin in a radial cocktail: tell the lab team to use heparin-free saline.",
          },
          {
            text: "Type 1 HIT: continue heparin, since the count will recover",
            next: "c-thrombosis",
            feedback: "Type 1 develops within the first 2 days. Continuing heparin in type 2 HIT risks thrombosis.",
            stateDelta: { stability: -25, flags: ["hit-missed"] },
          },
          {
            text: "Switch the heparin to a low-molecular-weight heparin",
            next: "c-thrombosis",
            feedback: "That is still a heparin; Brilakis stops all heparin in type 2 HIT.",
            stateDelta: { stability: -20, flags: ["hit-missed"] },
          },
        ],
      },
      {
        id: "c-thrombosis",
        kind: "consequence",
        prompt: "The next morning her left leg is swollen and the platelet count is 70 × 10⁹/L. What now?",
        options: [
          {
            text: "Stop every heparin source and start a non-heparin anticoagulant at once",
            best: true,
            feedback: "Type 2 HIT causes venous and arterial thrombosis; every heparin source must stop and a non-heparin anticoagulant must be running, and it continues as treatment for the HIT.",
          },
          {
            text: "Give a platelet transfusion and continue the heparin",
            feedback: "The problem is immune-mediated thrombosis driven by heparin; heparin must stop.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Angiography shows a severe thrombotic mid-RCA lesion, and PCI is planned. Which bivalirudin regimen?",
        options: [
          {
            text: "0.75 mg/kg bolus, then 1 mg/kg/h",
            best: true,
            feedback: "Creatinine clearance below 30 mL/min: the bolus is unchanged and the infusion is reduced to 1 mg/kg/h (typical doses; follow local protocol).",
          },
          {
            text: "0.75 mg/kg bolus, then 1.75 mg/kg/h",
            next: "c-bleed",
            feedback: "That rate is for a creatinine clearance of 30 mL/min or more. With no antidote, an overdose can only be stopped and waited out.",
            stateDelta: { stability: -10, flags: ["overdose"] },
          },
          {
            text: "Unfractionated heparin 70 units/kg, because it can be reversed",
            next: "c-thrombosis",
            feedback: "Reversibility is a good reason in CTO PCI, but not in suspected type 2 HIT, where heparin itself is the danger.",
            stateDelta: { stability: -25, flags: ["hit-missed"] },
          },
        ],
      },
      {
        id: "c-bleed",
        kind: "consequence",
        prompt: "Near the end of the case a forearm haematoma is enlarging at the radial site. What do you do about the anticoagulant?",
        options: [
          {
            text: "Stop the bivalirudin infusion and control the haematoma locally",
            best: true,
            feedback: "There is no reversal agent for bivalirudin: stop the infusion and compress. With her creatinine clearance of 26 mL/min the drug is cleared more slowly than the usual 25-minute half-life suggests (clearance falls by about a quarter in severe renal impairment), so expect a longer offset. Because she has HIT, discuss with haematology how and when to restart a non-heparin anticoagulant once the bleeding is controlled.",
          },
          {
            text: "Give protamine 50 mg slowly",
            feedback: "Protamine reverses heparin, not bivalirudin, and brings its own risk of reactions.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "What ACT goal applies during the PCI, with bivalirudin alone?",
        options: [
          {
            text: "300–350 seconds",
            best: true,
            feedback: "Brilakis's bivalirudin goal without a GP IIb/IIIa inhibitor or cangrelor.",
          },
          {
            text: "200–250 seconds",
            feedback: "That goal applies only when a GP IIb/IIIa inhibitor or cangrelor is being given.",
            stateDelta: { stability: -5 },
          },
          {
            text: "No ACT is needed with bivalirudin",
            feedback: "Brilakis monitors bivalirudin with the ACT, just like heparin.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The anatomy is known and PCI is going ahead. Which P2Y12 inhibitor do you load?",
        options: [
          {
            text: "Clopidogrel 600 mg",
            best: true,
            feedback: "Her TIA rules out prasugrel, and with a creatinine clearance below 30 mL/min, platelets below 100 × 10⁹/L and age 77 she is at very high bleeding risk (severe renal impairment and a platelet count below 100 × 10⁹/L are both major ARC-HBR criteria, and age 75 or over a minor one); she will also stay on an anticoagulant for her HIT. Brilakis avoids potent P2Y12 inhibitors at high bleeding risk and with anticoagulants, and POPular AGE found clopidogrel caused less bleeding than ticagrelor in NSTE-ACS patients aged 70 or over, with noninferior net clinical benefit.",
          },
          {
            text: "Ticagrelor 180 mg",
            acceptable: true,
            feedback: "Not contraindicated (that needs a previous intracranial haemorrhage) and the usual ACS choice when prasugrel cannot be used, but here it trades a little ischaemic protection for more bleeding in a patient with very high bleeding risk who will remain anticoagulated.",
          },
          {
            text: "Prasugrel 60 mg with 5 mg daily maintenance for her age",
            feedback: "The 5 mg dose is for older or lighter patients without a history of stroke or TIA; her TIA rules prasugrel out.",
            stateDelta: { stability: -15, flags: ["prasugrel-tia"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After the wire crosses, a new filling defect appears and flow slows. The ACT, which was 320 seconds, is now 205 seconds. The nurse finds the bivalirudin infusion line disconnected under the drapes. What next?",
        options: [
          {
            text: "Reconnect the infusion, give a repeat bolus and recheck the ACT before going further",
            best: true,
            feedback: "An anticoagulant that has not reached the circulation is listed by Brilakis among the causes of a low ACT and of thrombosis. With a half-life of 25 minutes, bivalirudin falls quickly once the infusion stops. The repeat bolus is the module's application of the rule that more anticoagulant is given until the ACT is therapeutic.",
          },
          {
            text: "Start eptifibatide to deal with the thrombus",
            next: "c-bleed",
            feedback: "The cause is a disconnected anticoagulant, not a failure of platelet inhibition. She is also thrombocytopenic with poor renal function, which makes a GP IIb/IIIa inhibitor riskier.",
            stateDelta: { stability: -10, flags: ["gpi-thrombocytopenia"] },
          },
          {
            text: "Deploy the stent quickly to restore flow",
            feedback: "Stenting into fresh thrombus before anticoagulation is restored risks embolisation and stent thrombosis.",
            stateDelta: { stability: -15, flags: ["thrombus"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The RCA is stented with good flow. What anticoagulation does she have after the case?",
        options: [
          {
            text: "Continue a non-heparin anticoagulant for the HIT, chosen and dosed with haematology",
            best: true,
            feedback: "Brilakis treats type 2 HIT by stopping all heparin and anticoagulating with a non-heparin agent such as bivalirudin or argatroban; that treatment does not end with the PCI. Keep her on a non-heparin anticoagulant at a dose for treating HIT, not at the PCI infusion rate, which is set for an ACT of 300–350 seconds. If bivalirudin is kept, haematology sets a far lower dose titrated to the aPTT (Tsu and Dager 2011); otherwise change to another non-heparin agent (ASH 2018 lists argatroban, bivalirudin, danaparoid, fondaparinux and DOACs for acute HIT), under local haematology protocol. No heparin of any kind.",
          },
          {
            text: "Run the bivalirudin on for up to 4 hours after the case, then stop all anticoagulation",
            next: "c-thrombosis",
            feedback: "Brilakis's 4-hour run-on is the PCI regimen for normal renal function, not HIT treatment. Acute HIT still needs a non-heparin anticoagulant; stopping everything leaves her exposed to venous and arterial thrombosis.",
            stateDelta: { stability: -20, flags: ["hit-untreated"] },
          },
          {
            text: "Stop the bivalirudin now and start heparin on the ward",
            feedback: "Heparin is exactly what she must not have.",
            stateDelta: { stability: -20, flags: ["hit-missed"] },
          },
        ],
      },
    ],
    outcome:
      "Type 2 HIT was suspected from the timing of the platelet fall, all heparin (flushes included) was stopped, and the RCA was stented under renally dosed bivalirudin. A disconnected infusion was found when the ACT fell. Her TIA ruled out prasugrel and her very high bleeding risk favoured clopidogrel, and non-heparin anticoagulation for the HIT continued after the PCI under haematology guidance.",
    outcomeVariants: [
      { flag: "hit-missed", text: "Continued heparin exposure led to venous thrombosis before the HIT was recognised." },
      { flag: "overdose", text: "The full infusion rate, given despite her renal function, caused an access-site haematoma that could only be managed by stopping the drug." },
      { flag: "prasugrel-tia", text: "Prasugrel was given despite her previous TIA, exposing her to the excess intracranial bleeding risk behind that contraindication." },
      { flag: "hit-untreated", text: "All anticoagulation stopped when the bivalirudin run-on ended, and untreated HIT went on to cause venous thrombosis." },
    ],
    learningPoints: [
      "A platelet fall 4–10 days into heparin fits type 2 HIT: stop all heparin, flushes included, and use a non-heparin anticoagulant (Brilakis); score the 4Ts before testing (ASH 2018).",
      "Bivalirudin: 0.75 mg/kg bolus; infusion 1.75, 1 or 0.25 mg/kg/h by renal function; Brilakis allows up to 4 hours after the procedure at the normal-renal-function rate.",
      "In acute HIT, anticoagulation continues with a non-heparin agent after the PCI; the post-PCI run-on is only the start.",
      "Bivalirudin uses the same ACT goals as heparin and has no antidote; severe renal impairment slows its clearance.",
      "A low ACT and new thrombus: check that the anticoagulant is actually reaching the patient.",
      "Previous TIA rules out prasugrel; previous intracranial haemorrhage rules out ticagrelor; at very high bleeding risk, clopidogrel.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "cuker-ash-hit-2018", "robson-bivalirudin-renal-2002", "tsu-bivalirudin-hit-2011", "urban-arc-hbr-2019", "gimbel-popular-age-2020"],
  },
];

// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "pci-act-before-coronary-devices",
    lab: "pci",
    when: { phase: ["wire"] },
    title: "No coronary device before a therapeutic ACT",
    text: "Check the ACT about 5 minutes after the heparin bolus and read it against your machine's target. Until it is in range, keep the wire, balloon and stent out of the coronary artery.",
    tone: "do",
    lessonId: "pm-antithrombotics-heparin",
    sources: [{ book: "brilakis-pci", loc: "3.4" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-act-device-targets",
    lab: "pci",
    when: { phase: ["plan", "guide"] },
    title: "Know your ACT machine and target",
    text: "With heparin alone, aim for 300–350 s on a Hemochron or 250–300 s on a HemoTec. With a GP IIb/IIIa inhibitor or cangrelor, Brilakis's goal is 200–250 s, a figure he gives for the Hemochron; neither manual gives a HemoTec equivalent. Retrograde CTO PCI needs more than 350 s on a Hemochron. Recheck every 20–30 minutes.",
    tone: "do",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "2.8" },
      { book: "brilakis-pci", loc: "3.4" },
      { book: "brilakis-pci", loc: "21.3" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-low-act-redose",
    lab: "pci",
    when: { event: ["low-act"] },
    title: "Low ACT: check the line, redose, remeasure",
    text: "Causes include a failed IV line, too small a dose and low antithrombin III. Give more anticoagulant, through the arterial sheath if the IV line is doubtful, and repeat the ACT before any device goes further.",
    tone: "bailout",
    lessonId: "pm-antithrombotics-heparin",
    sources: [{ book: "brilakis-pci", loc: "3.4" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-thrombus-check-act-first",
    lab: "pci",
    when: { event: ["thrombus", "acute-closure"] },
    title: "New thrombus: check the ACT before anything else",
    text: "Bring the ACT back into the therapeutic range with more anticoagulant, then treat the thrombus. If thrombus persists despite a therapeutic ACT and bleeding risk is acceptable, consider a GP IIb/IIIa inhibitor or cangrelor.",
    tone: "bailout",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "3.4" },
      { book: "brilakis-pci", loc: "25.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-guide-extension-watch-act",
    lab: "pci",
    when: { event: ["stent-uncrossable", "poor-guide-support"] },
    title: "Guide extension in: watch damping and the ACT",
    text: "A guide extension leaves a lumen 1–2 French smaller than the guide. Watch the pressure trace for damping and keep the ACT in range while it is in place.",
    tone: "caution",
    lessonId: "pm-antithrombotics-heparin",
    sources: [{ book: "brilakis-pci", loc: "30.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-protamine-only-after-equipment-out",
    lab: "pci",
    when: { event: ["bleeding", "perforation", "haematoma"] },
    title: "Protamine only once the coronary is empty",
    text: "If heparin must be reversed for bleeding, do it only after every wire, balloon and catheter is out of the coronary, because fresh stents can thrombose; after a perforation, in most cases also wait until the pericardium is drained. Give 1–1.5 mg per 100 units of heparin, never more than 50 mg, slowly, and watch for hypotension in the next 5–10 minutes.",
    tone: "caution",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "3.4" },
      { book: "brilakis-pci", loc: "26.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-bleeding-reverse-correctly",
    lab: "pci",
    when: { event: ["bleeding"] },
    title: "Bleeding: reverse what can be reversed",
    text: "Heparin can be reversed with protamine once the coronary equipment is out. Bivalirudin, eptifibatide, tirofiban and cangrelor have no antidote: stop the infusion and treat the bleeding site.",
    tone: "bailout",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "3.4" },
      { book: "brilakis-pci", loc: "3.5" },
      { book: "brilakis-pci", loc: "29.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-heparin-timing",
    lab: "access",
    when: { phase: ["radial"] },
    title: "Radial heparin: dose and timing",
    text: "For a diagnostic radial study, heparin is usually 50 units/kg, capped at 5000 units, to protect the artery; Brilakis notes that 100 units/kg may be more effective. If the arm is very tortuous, consider holding it until the catheter reaches the aortic root, in case you must cross over to the femoral artery.",
    tone: "do",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "4.3" },
      { book: "brilakis-pci", loc: "4.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-delay-heparin-tortuous-arm",
    lab: "diagnostic",
    when: { event: ["subclavian-tortuosity", "radial-loop"] },
    title: "Extremely tortuous arm: heparin may wait for the root",
    text: "When the radial or subclavian route is extremely tortuous, engagement may fail and femoral crossover may be needed, and femoral puncture after heparin bleeds more. Brilakis allows the heparin to be held until the catheter is in the aortic root; then give it, because it protects the radial artery from occlusion.",
    tone: "caution",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "4.3" },
      { book: "brilakis-pci", loc: "4.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-sheath-act",
    lab: "access",
    when: { phase: ["closure"], route: ["femoral"] },
    title: "Sheath out: femoral waits for the ACT, radial does not",
    text: "Pull a femoral sheath and hold pressure once the ACT is below 180 s (Brilakis) or below 150–200 s or after 3–4 hours (Oxford). A radial sheath comes out at the end of the case whatever the ACT, even with a GP IIb/IIIa inhibitor or cangrelor running.",
    tone: "do",
    lessonId: "pm-antithrombotics-heparin",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "brilakis-pci", loc: "11.2" },
      { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-cto-anticoagulant-choice",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "CTO PCI: heparin you can reverse, no IV antiplatelet",
    text: "For a CTO, use unfractionated heparin, not bivalirudin, so that a perforation can be reversed, aiming above 300 s (antegrade) or 350 s (retrograde) on a Hemochron. Do not give a GP IIb/IIIa inhibitor or cangrelor, even after success.",
    tone: "caution",
    lessonId: "pm-antithrombotics-alternatives",
    sources: [{ book: "brilakis-pci", loc: "21.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-fondaparinux-add-heparin",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "On fondaparinux: still give heparin at PCI",
    text: "A patient pretreated with fondaparinux still receives heparin at the procedure. In FUTURA/OASIS-8 a low dose of 50 units/kg did not reduce major bleeding or access-site complications, and ischaemic-plus-bleeding events were higher, so use your standard ACT-guided regimen.",
    tone: "do",
    lessonId: "pm-antithrombotics-alternatives",
    sources: [{ book: "oxford-cath", loc: "ch 8: Anticoagulation therapy" }],
    refs: ["steg-futura-oasis8-2010"],
  },
  {
    id: "pci-hit-use-bivalirudin",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Falling platelets on heparin: think HIT",
    text: "Check the platelet trend before the case. A fall several days into heparin treatment suggests type 2 HIT: score the 4Ts, stop all heparin, including heparinised flushes and the radial cocktail, and use bivalirudin (0.75 mg/kg, then an infusion adjusted for renal function), remembering it cannot be reversed. Non-heparin anticoagulation continues after the case.",
    tone: "caution",
    lessonId: "pm-antithrombotics-alternatives",
    sources: [
      { book: "brilakis-pci", loc: "3.4" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "cuker-ash-hit-2018"],
  },
  {
    id: "access-anticoagulated-go-radial",
    lab: "access",
    when: { phase: ["plan"] },
    title: "On an oral anticoagulant: go radial",
    text: "Unless an earlier step of the access algorithm (unsuitable sites, prior CABG) decides otherwise, patients on warfarin or a DOAC, and those at high bleeding risk, go radial. If the femoral artery is unavoidable, guide the puncture with ultrasound and fluoroscopy (Oxford: consider it; Brilakis uses both for every femoral access) and plan compression or a closure device.",
    tone: "do",
    lessonId: "pm-antithrombotics-oac",
    sources: [
      { book: "brilakis-pci", loc: "4.1" },
      { book: "brilakis-pci", loc: "4.2" },
      { book: "oxford-cath", loc: "ch 3: Anticoagulation issues" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "access-crossover-anticoagulated-care",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Femoral crossover after heparin: meticulous technique",
    text: "Puncturing the femoral artery in a patient already anticoagulated, after a failed radial approach, carries a higher bleeding risk. Use ultrasound and fluoroscopy and take extreme care with the puncture.",
    tone: "caution",
    lessonId: "pm-antithrombotics-oac",
    sources: [
      { book: "brilakis-pci", loc: "4.1" },
      { book: "oxford-cath", loc: "ch 3: Anticoagulation issues" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-check-oral-loading",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Before PCI: aspirin, P2Y12 and contraindications",
    text: "Confirm that aspirin has been given and which P2Y12 inhibitor was loaded, when. No prasugrel after stroke or TIA, no ticagrelor after intracranial haemorrhage, and clopidogrel if the patient takes an oral anticoagulant. After opioids, oral absorption is delayed.",
    tone: "do",
    lessonId: "pm-antithrombotics-oral",
    sources: [
      { book: "brilakis-pci", loc: "1.3" },
      { book: "brilakis-pci", loc: "3.5" },
      { book: "brilakis-pci", loc: "3.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-gpi-cangrelor-bailout",
    lab: "pci",
    when: { event: ["thrombus", "no-reflow", "slow-flow"] },
    title: "IV antiplatelet bail-out: lower the ACT target",
    text: "For a large thrombus burden or a thrombotic complication, with acceptable bleeding risk, consider a GP IIb/IIIa inhibitor or cangrelor. With either, the ACT goal is 200–250 s, so do not add heparin above that. Halve the tirofiban infusion at a creatinine clearance of 60 mL/min or less and the eptifibatide infusion below 50 mL/min (Brilakis uses 60 for both); no eptifibatide on dialysis.",
    tone: "bailout",
    lessonId: "pm-antithrombotics-iv",
    sources: [
      { book: "brilakis-pci", loc: "3.5" },
      { book: "brilakis-pci", loc: "20.3" },
    ],
    refs: ["brilakis-manual-pci", "dailymed-eptifibatide-2024"],
  },
  {
    id: "pci-perforation-stop-iv-antiplatelet",
    lab: "pci",
    when: { event: ["perforation"] },
    title: "Perforation: stop GP IIb/IIIa inhibitors and cangrelor",
    text: "Stop any GP IIb/IIIa inhibitor or cangrelor as soon as a perforation is seen, and do not start one after a distal wire perforation, because tamponade can appear hours later. In most cases, hold protamine until the equipment is out and the pericardium is drained.",
    tone: "caution",
    lessonId: "pm-antithrombotics-iv",
    sources: [
      { book: "brilakis-pci", loc: "26.2" },
      { book: "brilakis-pci", loc: "26.4" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-cangrelor-to-oral",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Leaving cangrelor: time the oral load",
    text: "If cangrelor is running: ticagrelor can be given at any time during or after the infusion, but clopidogrel or prasugrel must be loaded immediately after it stops, because cangrelor blocks their binding.",
    tone: "do",
    lessonId: "pm-antithrombotics-iv",
    sources: [{ book: "brilakis-pci", loc: "3.5" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-svg-no-routine-gpi",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], vessel: ["SVG"] },
    title: "Vein graft PCI: no routine GP IIb/IIIa inhibitor",
    text: "Despite the thrombus in vein graft lesions, GP IIb/IIIa inhibitors are not used routinely: Brilakis warns they can cause harm, and Oxford finds no proven benefit.",
    tone: "caution",
    lessonId: "pm-antithrombotics-iv",
    sources: [
      { book: "brilakis-pci", loc: "18.3" },
      { book: "oxford-cath", loc: "ch 8: Vein graft PCI" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "tsu-bivalirudin-hit-2011",
    kind: "paper",
    citation:
      "Tsu LV, Dager WE. Bivalirudin dosing adjustments for reduced renal function with or without hemodialysis in the management of heparin-induced thrombocytopenia. Ann Pharmacother. 2011;45:1185–1192.",
    url: "https://doi.org/10.1345/aph.1Q177",
    note: "PMID: 21881032. Checked on PubMed: authors, title, journal, year, volume 45, issue 10, pages 1185–92. Retrospective series of 135 patients given bivalirudin for HIT, dose adjusted to an aPTT goal; median needs 0.13, 0.08 and 0.05 mg/kg/h with CrCl >60, 30–60 and <30 mL/min.",
    verified: true,
  },
  {
    id: "montalescot-atoll-2011",
    kind: "trial",
    citation:
      "Montalescot G, Zeymer U, Silvain J, et al. Intravenous enoxaparin or unfractionated heparin in primary percutaneous coronary intervention for ST-elevation myocardial infarction: the international randomised open-label ATOLL trial. Lancet. 2011;378:693–703.",
    url: "https://doi.org/10.1016/S0140-6736(11)60876-3",
    note: "PMID: 21856483. Checked on PubMed: authors, title, journal, year, volume 378, issue 9792, pages 693–703.",
    verified: true,
  },
  {
    id: "yusuf-oasis5-2006",
    kind: "trial",
    citation:
      "Yusuf S, Mehta SR, Chrolavicius S, et al. Comparison of fondaparinux and enoxaparin in acute coronary syndromes. N Engl J Med. 2006;354:1464–1476.",
    url: "https://doi.org/10.1056/NEJMoa055443",
    note: "PMID: 16537663. The OASIS-5 trial (Fifth Organization to Assess Strategies in Acute Ischemic Syndromes Investigators). Checked on PubMed: authors, title, journal, year, volume 354, issue 14, pages 1464–76.",
    verified: true,
  },
  {
    id: "steg-futura-oasis8-2010",
    kind: "trial",
    citation:
      "FUTURA/OASIS-8 Trial Group; Steg PG, Jolly SS, Mehta SR, et al. Low-dose vs standard-dose unfractionated heparin for percutaneous coronary intervention in acute coronary syndromes treated with fondaparinux: the FUTURA/OASIS-8 randomized trial. JAMA. 2010;304:1339–1349.",
    url: "https://doi.org/10.1001/jama.2010.1320",
    note: "PMID: 20805623. Checked on PubMed: group author and named authors, title, journal, year, volume 304, issue 12, pages 1339–49.",
    verified: true,
  },
  {
    id: "lopes-augustus-2019",
    kind: "trial",
    citation:
      "Lopes RD, Heizer G, Aronson R, et al. Antithrombotic therapy after acute coronary syndrome or PCI in atrial fibrillation. N Engl J Med. 2019;380:1509–1524.",
    url: "https://doi.org/10.1056/NEJMoa1817083",
    note: "PMID: 30883055. The AUGUSTUS trial. Checked on PubMed: authors, title, journal, year, volume 380, issue 16, pages 1509–1524. Also listed as further reading in Oxford chapter 8 (antiplatelet therapy).",
    verified: true,
  },
  {
    id: "douketis-bridge-2015",
    kind: "trial",
    citation:
      "Douketis JD, Spyropoulos AC, Kaatz S, et al. Perioperative bridging anticoagulation in patients with atrial fibrillation. N Engl J Med. 2015;373:823–833.",
    url: "https://doi.org/10.1056/NEJMoa1501035",
    note: "PMID: 26095867. The BRIDGE trial. Checked on PubMed: authors, title, journal, year, volume 373, issue 9, pages 823–33.",
    verified: true,
  },
  {
    id: "gimbel-popular-age-2020",
    kind: "trial",
    citation:
      "Gimbel M, Qaderdan K, Willemsen L, et al. Clopidogrel versus ticagrelor or prasugrel in patients aged 70 years or older with non-ST-elevation acute coronary syndrome (POPular AGE): the randomised, open-label, non-inferiority trial. Lancet. 2020;395:1374–1381.",
    url: "https://doi.org/10.1016/S0140-6736(20)30325-1",
    note: "PMID: 32334703. Checked on PubMed: authors, title, journal, year, volume 395, issue 10233, pages 1374–1381.",
    verified: true,
  },
  {
    id: "li-bright4-2022",
    kind: "trial",
    citation:
      "Li Y, Liang Z, Qin L, et al. Bivalirudin plus a high-dose infusion versus heparin monotherapy in patients with ST-segment elevation myocardial infarction undergoing primary percutaneous coronary intervention: a randomised trial. Lancet. 2022;400:1847–1857.",
    url: "https://doi.org/10.1016/S0140-6736(22)01999-7",
    note: "PMID: 36351459. The BRIGHT-4 trial. Checked on PubMed: authors, title, journal, year, volume 400, issue 10366, pages 1847–1857.",
    verified: true,
  },
  {
    id: "cuker-ash-hit-2018",
    kind: "guideline",
    citation:
      "Cuker A, Arepally GM, Chong BH, et al. American Society of Hematology 2018 guidelines for management of venous thromboembolism: heparin-induced thrombocytopenia. Blood Adv. 2018;2:3360–3392.",
    url: "https://doi.org/10.1182/bloodadvances.2018024489",
    note: "PMID: 30482768. PMCID: PMC6258919. Checked on PubMed: authors, title, journal, year, volume 2, issue 22, pages 3360–3392. Statements in the module are limited to what the abstract states (4Ts score; no testing or empirical treatment at low 4Ts probability; non-heparin anticoagulant options for acute HIT).",
    verified: true,
  },
  {
    id: "melloni-eptifibatide-renal-2011",
    kind: "paper",
    citation:
      "Melloni C, James SK, White JA, et al. Safety and efficacy of adjusted-dose eptifibatide in patients with acute coronary syndromes and reduced renal function. Am Heart J. 2011;162:884–892.e1.",
    url: "https://doi.org/10.1016/j.ahj.2011.08.020",
    note: "PMID: 22093205. EARLY ACS analysis: adjusted eptifibatide infusion 1 µg/kg/min for estimated creatinine clearance below 50 mL/min per protocol. Checked on PubMed: authors, title, journal, year, volume 162, issue 5, pages 884–892.e1.",
    verified: true,
  },
  {
    id: "robson-bivalirudin-renal-2002",
    kind: "paper",
    citation:
      "Robson R, White H, Aylward P, Frampton C. Bivalirudin pharmacokinetics and pharmacodynamics: effect of renal function, dose, and gender. Clin Pharmacol Ther. 2002;71:433–439.",
    url: "https://doi.org/10.1067/mcp.2002.124522",
    note: "PMID: 12087346. Plasma clearance 21% lower in moderate and 24% lower in severe renal impairment. Checked on PubMed: authors, title, journal, year, volume 71, issue 6, pages 433–9.",
    verified: true,
  },
  {
    id: "dailymed-eptifibatide-2024",
    kind: "web",
    citation:
      "Eptifibatide injection: US prescribing information (Baxter Healthcare). DailyMed, US National Library of Medicine; label revised May 2024.",
    url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5f46b76b-5c83-49b9-ada8-4ad5cf81a38c",
    note: "Checked on DailyMed (October 2026): infusion reduced to 1 mcg/kg/min when creatinine clearance is less than 50 mL/min; dependency on renal dialysis is a contraindication.",
    verified: true,
  },
];
