// Module pm-support-devices: inserting and running support devices (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 14.2, 14.3 (balloon pump), 14.4 (microaxial pump) and 14.5 (VA-ECMO), with
// the support passages of 3.6, 4.4, 14.1, 22.1, 28.1 and 30.1; Oxford Handbook of Cardiac Catheterization and
// Coronary Intervention, chapter 9 (intra-aortic balloon pump, Impella, extracorporeal membrane oxygenation), with the
// balloon pump passages of chapters 2, 3 and 4. Running VA-ECMO beyond the manuals (venting, differential hypoxaemia,
// weaning) and haemolysis on a microaxial pump draw on PubMed-checked reviews listed in `refs` below.
// Every claim is listed with its page in docs/curriculum/evidence/pm-support-devices.md.
// Neighbouring modules: pm-support-choice (whether to support and which device; weaning criteria in shock; TandemHeart),
// pm-access (large-bore femoral access, the double-suture pre-close and limb protection), pm-closure (closing the
// arteriotomy). Academy lessons this module builds on: mcs-iabp-physiology, mcs-iabp-timing, mcs-iabp-management,
// mcs-impella-insertion, mcs-impella-management, mcs-impella-weaning-evidence, mcs-ecmo-circuit, mcs-ecmo-lv,
// mcs-ecmo-running, mcs-ecmo-weaning.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];
const OXFORD = ["oxford-cath-handbook"];

export const module: Module = {
  id: "pm-support-devices",
  title: "Inserting and running support devices",
  stage: 4,
  summary:
    "The hands-on side of haemodynamic support: preparing, inserting, positioning and starting an intra-aortic balloon pump, reading and troubleshooting its trace and weaning it; inserting a microaxial pump across the aortic valve step by step, running it through the alarms, haemolysis and the end of the case; cannulating for VA-ECMO from the groins with limb perfusion and an air-free circuit; and running VA-ECMO through left ventricular loading, venting, differential hypoxaemia and the weaning trial.",
  objectives: [
    "Choose the balloon size from the height chart, prepare the balloon under vacuum, insert it over the kit wire to the correct level, connect it and start counterpulsation, and say where the two manuals differ on sizing and tip position.",
    "Read a 1:2 balloon pump trace landmark by landmark, list the causes of poor augmentation and poor afterload reduction, run the balloon without anticoagulation safely, handle pump failure and migration, wean and remove it.",
    "Insert a microaxial pump step by step: valve crossing with a pigtail, the long stiff wire, loading the pump, rapid passage through the sheath, the inlet depth, starting it, and the bail-outs for a stenotic valve, a lost loading tube and resistant iliac arteries.",
    "Run a microaxial pump during PCI: recognise a ventricular waveform, a pump pulled back into the aorta, suction and a stopped pump, link position to haemolysis, and finish the case by removing the pump or converting to continued support.",
    "Cannulate for femoro-femoral VA-ECMO in the order Brilakis teaches: groins, antegrade limb perfusion, heparin, venous then arterial cannula, an air-free connection, start, and the distal perfusion line, with each step's bail-outs.",
    "Recognise and treat left ventricular distension on VA-ECMO, choose a venting strategy, detect and manage differential hypoxaemia, and run a weaning trial, knowing which parts rest on the manuals and which on later reviews.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-iabp-insert",
      title: "Inserting a balloon pump, step by step",
      minutes: 14,
      topics: ["mcs-iabp-insertion"],
      sources: [
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "14.3" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A balloon pump often has to go in at short notice and in an unstable patient, and Oxford expects every PCI laboratory to have one immediately available, so the steps have to be automatic: pick the right balloon, keep it collapsed until it is in the aorta, park its tip at the right level, and connect the two lumens to the right ports. How counterpulsation works is taught in the Academy lesson on the balloon pump; this lesson is the insertion itself.",
        },
        { kind: "h", text: "Before the patient arrives" },
        {
          kind: "list",
          items: [
            "**The kit and the console.** In Oxford's team chapter the cardiac physiologist checks that the balloon pump works and is stocked, and helps the operator set up counterpulsation; the console settings go into the procedure record.",
            "**The groin.** For anticoagulated patients Oxford advises the radial route and keeps the femoral route for emergencies such as inserting a balloon pump, and it notes that some operators prepare the right groin in radial cases in case one is needed. Brilakis inserts the pump through a femoral sheath, which comes in the pump kit.",
            "**The size of the hole.** Brilakis gives 7–8 Fr in his device table and 7–9 Fr in his equipment chapter, adding that the pump can go in without a sheath; Oxford says these catheters are usually 7.5 F or larger and can be placed with or without a sheath.",
          ],
        },
        { kind: "h", text: "Choosing the balloon" },
        {
          kind: "table",
          caption: "Balloon volume by the patient's height: the two manuals use different charts",
          head: ["Balloon", "Height in Brilakis Table 14.2", "Height in Oxford (one manufacturer's recommendation)"],
          rows: [
            ["25 mL", "Not in the chart", "Below 152 cm"],
            ["30 cc", "147–162 cm", "Not in the chart"],
            ["34 mL", "Not in the chart", "152–163 cm"],
            ["40 mL (40 cc)", "162–182 cm", "164–183 cm"],
            ["50 mL (50 cc)", "Above 182 cm", "Above 183 cm"],
          ],
        },
        {
          kind: "p",
          text: "Both books size by height, and both put most adults of average height on the 40 mL balloon. They part company for shorter patients, where Brilakis's chart jumps from 30 to 40 cc and the manufacturer chart quoted by Oxford has 25 and 34 mL steps. The chart supplied with the balloons in your laboratory decides. A balloon that is too small for the aorta is one of Brilakis's causes of poor augmentation (next lesson).",
        },
        { kind: "tip", id: "mcs-iabp-size-height" },
        {
          kind: "check",
          stem: "A woman 158 cm tall needs a balloon pump. Which statement about the balloon size is correct?",
          options: [
            "Brilakis's chart gives 30 cc and Oxford's chart 34 mL, so follow the chart for your device",
            "Brilakis's chart gives 40 cc and Oxford's 34 mL, so the larger Brilakis balloon is preferred",
            "Brilakis's chart gives 30 cc and Oxford's 25 mL, so the smaller Oxford balloon is the safe one",
            "Both charts give 40 mL at this height, since 40 mL covers every adult taller than 150 cm",
          ],
          answer: 0,
          explanation:
            "At 158 cm Brilakis's Table 14.2 (147–162 cm) gives 30 cc, whereas the manufacturer chart in Oxford (152–163 cm) gives 34 mL; the charts differ, so the one supplied with your balloons decides. Neither chart gives 40 mL at 158 cm (Brilakis starts it at 162 cm, Oxford at 164 cm), Oxford's 25 mL balloon is only for patients under 152 cm, and neither book prefers a balloon because it is larger.",
        },
        { kind: "h", text: "Insertion, step by step" },
        {
          kind: "steps",
          title: "From the puncture to counterpulsation (Brilakis 14.3, with Oxford's insertion tips for one manufacturer's system)",
          items: [
            {
              title: "1. Femoral access",
              detail:
                "Puncture the common femoral artery as for any femoral case (pm-access): Seldinger technique, then the dilator over the wire, and the sheath from the pump kit if you are using one.",
            },
            {
              title: "2. Prepare the balloon while it is still in its tray",
              detail:
                "Fit the one-way valve to the gas (helium) lumen and pull a vacuum on the balloon with the syringe supplied; take the syringe off but leave the valve on, and leave it there until the balloon is in position in the aorta. Lift the catheter out of the tray only when you are ready to insert it. Pull the stylet out of the central wire lumen and flush that lumen with saline. Connect the fibre-optic pressure cable to the console and zero the fluid transducer.",
            },
            {
              title: "3. Take the kit wire to the arch",
              detail:
                "Use the 0.025 inch wire from the balloon pump kit and advance it to the aortic arch under fluoroscopy. Oxford stresses why: it is thinner than a standard exchange wire, and the standard wire will not pass down the balloon's lumen. If the wire will not advance, use the same manoeuvres as for any catheter or wire in tortuous iliac arteries or aorta (pm-to-the-root).",
            },
            {
              title: "4. Advance the balloon to its level",
              detail:
                "Under fluoroscopy, advance the balloon over the wire. Brilakis stops when the catheter tip lies level with the tracheal bifurcation (the carina); Oxford stops with the tip just beyond the origin of the left subclavian artery, confirmed on X-ray screening where available. Oxford describes the balloon's place as the proximal descending aorta; the two books give different landmarks for the tip and do not say whether they coincide.",
            },
            {
              title: "5. Secure it",
              detail:
                "If a sheath was used, push the sheath seal into its hub (Oxford). Secure the catheter to the leg; Brilakis sutures the pump after insertion because a catheter that is accidentally pulled back migrates downwards.",
            },
            {
              title: "6. Connect the two lumens and start",
              detail:
                "Take the wire out. Oxford then aspirates 3 mL of blood and flushes the central lumen so that no blood stays trapped in it, before attaching the pressure line. Connect the central lumen to arterial pressure monitoring and the helium port, through its extender, to the console (Oxford removes the yellow insert of the one-way valve at this point). The yellow insert and the extender belong to the system Oxford describes, so check your own device's instructions for use. Start counterpulsation, then check timing at 1:2 (next lesson).",
            },
          ],
        },
        { kind: "tip", id: "mcs-iabp-vacuum-valve" },
        { kind: "tip", id: "mcs-iabp-kit-wire" },
        { kind: "tip", id: "mcs-iabp-tip-carina" },
        {
          kind: "check",
          stem: "You have pulled a vacuum on the balloon. Your assistant asks whether the one-way valve on the gas lumen can come off now that the syringe is removed. What is the answer?",
          options: [
            "Yes, the valve is only there to hold the syringe while the vacuum is applied",
            "No, it stays on until the balloon is in position in the aorta",
            "Yes, but only after the balloon has passed the sheath into the iliac artery",
            "No, it stays on for the whole period of pumping and is never removed",
          ],
          answer: 1,
          explanation:
            "Brilakis leaves the valve on until the balloon sits in the aorta; Oxford removes its insert just before connecting the balloon to the extender and pump. Brilakis gives the rule without a reason; presumably the valve holds the vacuum that keeps the balloon collapsed while it is inserted. It cannot stay on during pumping, because the gas line has to be connected to the console.",
        },
        {
          kind: "table",
          caption: "Two lumens, two destinations",
          head: ["Lumen", "During insertion", "Once in position"],
          rows: [
            ["Central (wire) lumen", "Stylet removed, flushed; carries the 0.025 inch kit wire", "Wire out; Oxford aspirates and flushes it; connected to arterial pressure monitoring"],
            ["Gas lumen", "One-way valve on, balloon under vacuum", "Valve insert removed; connected through the extender to the console's helium supply"],
          ],
        },
        {
          kind: "check",
          stem: "The balloon is advanced and fluoroscopy shows its tip level with the carina. What is the next sequence?",
          options: [
            "Leave the wire in to protect the lumen, connect only the helium line and start pumping",
            "Pull the balloon back to the level of the renal arteries before connecting it to the console",
            "Remove the wire, clear and connect the central lumen to pressure, connect helium, then start",
            "Connect the helium line, start pumping at 1:1 and remove the wire once augmentation appears",
          ],
          answer: 2,
          explanation:
            "Brilakis's step 5 is wire out, central lumen to arterial pressure, helium port to the console, then counterpulsation; Oxford adds aspirating and flushing the central lumen first. The wire cannot stay in the lumen that will carry the pressure trace, and the carina level is the target, not a reason to pull the balloon down to the renal arteries.",
        },
        { kind: "h", text: "Working with the balloon in place" },
        {
          kind: "p",
          text: "Diagnostic and guide catheters can be exchanged past an inflating balloon, as Oxford's illustration of left coronary angiography during pumping shows, so PCI continues with the pump running. Do not draw arterial blood samples from the balloon's pressure line: Oxford points out that it is narrow and blocks easily once blood contaminates it.",
        },
        {
          kind: "steps",
          title: "Transferring a patient with a balloon pump (Oxford)",
          items: [
            { title: "Vehicle", detail: "An ambulance or aircraft able to load and secure the patient and the equipment." },
            { title: "Crew", detail: "Staff trained to run a balloon pump during the journey." },
            { title: "Power", detail: "Enough battery for the journey, with a spare battery." },
            { title: "Receiving centre", detail: "A pump ready to switch to, and a plan for returning your console." },
            { title: "Advice", detail: "Telephone contact available during the transfer." },
          ],
        },
        { kind: "tip", id: "mcs-iabp-transfer" },
        { kind: "h", text: "Taking it out" },
        {
          kind: "p",
          text: "A used balloon usually will not fold back into its sheath. Oxford's method is to withdraw the catheter slowly until the balloon meets the sheath and you feel resistance, then pull sheath and catheter out together as one unit and hold pressure as for any arterial line; because these catheters are 7.5 F or larger, expect a long compression. Weaning before removal is taught in the next lesson; holding pressure and closure are in pm-closure.",
        },
        { kind: "tip", id: "mcs-iabp-remove-together" },
        {
          kind: "pitfalls",
          items: [
            "Using a standard exchange wire: it will not go through the balloon's lumen.",
            "Taking the balloon out of its tray early, or removing the one-way valve before the balloon is in the aorta.",
            "Positioning by feel: the tip level (carina, just past the left subclavian origin) needs fluoroscopy.",
            "Not securing the catheter, so that a pull on the line lets it migrate down the aorta.",
            "Sampling blood from the balloon's pressure lumen.",
            "Pulling the used balloon back through its sheath instead of removing both together.",
            "Taking the size from memory when the two manuals' charts differ for shorter patients.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the two lumens aloud as you connect them: the central lumen is the patient's pressure, the gas lumen is the console's helium. Two easy errors are confusing the two lumens and removing the one-way valve at the wrong moment.",
        },
        {
          kind: "sim",
          sim: "iabp",
          task: "Before you start the console, state the insertion sequence in order: size from height, vacuum with the one-way valve on, kit wire to the arch, tip at the carina, secure, wire out, central lumen to pressure, helium to the console. Then start at 1:2 and check that the assisted end-diastolic pressure is below the unassisted one.",
        },
        { kind: "video", id: "BXRpJS8jtFM", note: "Elias Hanna on axillary balloon pump insertion (with a microaxial pump): step-by-step access, exchange, closure and complications." },
        {
          kind: "keypoints",
          items: [
            "Oxford expects every PCI laboratory to have a balloon pump immediately available; the physiologist checks the kit and helps set it up.",
            "Size by height from your device's chart: Brilakis 30, 40 or 50 cc; the manufacturer chart in Oxford 25, 34, 40 or 50 mL.",
            "Vacuum through a one-way valve on the gas lumen, left on until the balloon is in the aorta; out of the tray only just before insertion; stylet out, wire lumen flushed, transducer zeroed.",
            "The 0.025 inch kit wire to the arch; a standard exchange wire will not fit.",
            "Tip at the carina (Brilakis), just beyond the left subclavian origin (Oxford), on fluoroscopy; then secure it.",
            "Wire out, central lumen cleared and connected to pressure, helium to the console, start and check timing at 1:2.",
            "Remove a used balloon and its sheath together, then expect a prolonged compression (7.5 F or larger).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-iabp-run",
      title: "Running the balloon pump: the trace, the problems and the wean",
      minutes: 14,
      topics: ["mcs-iabp-timing"],
      sources: [
        { book: "brilakis-pci", loc: "14.3" },
        { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
        { book: "oxford-cath", loc: "ch 4: Left heart pressures and waveforms" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A balloon pump that is in the right place can still do nothing useful, or harm, if the trace is not read. Brilakis's monitoring step asks four things of you: check the timing at 1:2, watch the systemic pressure, watch the balloon's position, and keep the patient anticoagulated. The Academy lesson on timing shows the four timing errors; this lesson turns the reading into a routine, then works through the problems the manuals list and how the pump is weaned.",
        },
        { kind: "h", text: "Reading a 1:2 trace, landmark by landmark" },
        {
          kind: "p",
          text: "At 1:2 every second beat is assisted, so each assisted beat sits next to an unassisted one. Oxford labels five points on the aortic trace, and naming them is the quickest way to judge it. Consoles can freeze the trace so you can study it, and the screen also shows the trigger source, the heart rate, the augmented pressure, the battery and the helium supply.",
        },
        {
          kind: "table",
          caption: "Oxford's five landmarks (A to E) and what a well-timed beat shows",
          head: ["Label", "What it is", "Well timed"],
          rows: [
            ["A", "End-diastolic pressure of an unassisted beat", "The reference for D"],
            ["B", "Systolic peak of an unassisted beat", "The reference for C and E"],
            ["C", "Diastolic augmentation (the balloon's peak)", "Starts at the dicrotic notch; Brilakis wants the augmented peak higher than the unassisted peak"],
            ["D", "End-diastolic pressure of an assisted beat", "Lower than A"],
            ["E", "Systolic peak of the next, assisted beat", "Lower than B (Oxford Fig 9.13), reflecting the afterload reduction from deflation just before systole"],
          ],
        },
        {
          kind: "steps",
          title: "The reading routine",
          items: [
            { title: "1. Set 1:2 and freeze", detail: "Freeze a run with clear assisted and unassisted beats side by side." },
            {
              title: "2. Find the dicrotic notch",
              detail:
                "The notch on the downstroke marks aortic valve closure; Oxford's haemodynamics chapter uses it as the moment inflation should begin. Inflation should start immediately after it.",
            },
            { title: "3. Compare C with B", detail: "The augmented diastolic peak should stand above the unassisted systolic peak (Brilakis Fig 14.4)." },
            {
              title: "4. Compare D with A",
              detail: "The pressure at the end of an assisted diastole should be lower than at the end of an unassisted one (Brilakis Fig 14.4): that is the afterload reduction. Deflation belongs just before systole, at the R wave on ECG timing.",
            },
            { title: "5. Compare E with B", detail: "On a well-timed cycle the assisted systolic peak is lower than the unassisted one (Oxford)." },
            {
              title: "6. Then set the running ratio",
              detail:
                "Brilakis pairs 1:2 with the timing check and names 1:1 as the ratio when anticoagulation cannot be given (below). Oxford's wean starts from inflation on every beat and moves to every second and then every third, which implies 1:1 as the running ratio, and the Academy lesson on balloon pump physiology moves to 1:1 once the timing is confirmed. Follow your unit's practice for the running ratio.",
            },
          ],
        },
        {
          kind: "table",
          caption: "The four timing errors in landmark terms (Oxford Figs 9.14 to 9.17)",
          head: ["Error", "What the landmarks show", "Consequence Oxford gives"],
          rows: [
            ["Early inflation", "C begins before the notch and runs into B", "Early aortic valve closure, aortic regurgitation, a higher LVEDP and more myocardial oxygen demand"],
            ["Late inflation", "C starts after the notch", "Less augmentation than there should be"],
            ["Early deflation", "A sharp fall from C to D, well before the next systole", "Possible retrograde flow and more myocardial oxygen demand"],
            ["Late deflation", "C is prolonged, D is close to A, and E is prolonged", "Little or no afterload reduction; the ventricle may work harder because it contracts against the balloon"],
          ],
        },
        { kind: "tip", id: "mcs-iabp-read-1to2" },
        {
          kind: "check",
          stem: "On a frozen 1:2 trace the augmentation is wide, the assisted end-diastolic pressure (D) is almost the same as the unassisted one (A), and the assisted systolic beat (E) looks drawn out. What is wrong and what do you change?",
          options: [
            "Early inflation: move inflation later, to the dicrotic notch",
            "Late inflation: move inflation earlier, to the dicrotic notch",
            "Early deflation: move deflation later, towards the R wave",
            "Late deflation: move deflation earlier, to just before systole",
          ],
          answer: 3,
          explanation:
            "A prolonged C, a D close to A and a prolonged E are Oxford's picture of late deflation: the balloon is still up as the valve opens, so afterload is barely reduced and the ventricle contracts against it. Deflation must move earlier, to just before systole. Early inflation shows C running into B, and early deflation shows a sharp, early fall from C to D rather than a prolonged augmentation.",
        },
        { kind: "h", text: "When the pump is not doing its job (Brilakis 14.3.6)" },
        {
          kind: "table",
          caption: "Two problems, their causes and their prevention",
          head: ["Problem", "Causes Brilakis lists", "Prevention"],
          rows: [
            [
              "Poor augmentation (the mean pressure does not rise)",
              "Hypovolaemia; balloon too low; balloon too small for this aorta; low systemic vascular resistance; wrong timing; kinked catheter; too little volume delivered",
              "Right size, right place, right inflation volume and timing",
            ],
            [
              "Poor afterload reduction",
              "Balloon not filling to its full volume; a compliant aortic wall; balloon in the wrong position; partly blocked gas lumen; wrong timing",
              "Right size, right place, right inflation timing and volume",
            ],
          ],
        },
        {
          kind: "p",
          text: "For both, Brilakis's treatment is to find and correct the cause. Work through the list in an order you can check at the bedside: the timing on a frozen 1:2 trace, the position on fluoroscopy, the catheter and gas line for kinks, the volume setting, and then the patient's filling and vascular tone.",
        },
        { kind: "tip", id: "mcs-iabp-poor-augmentation" },
        {
          kind: "check",
          stem: "Twenty minutes after insertion the mean pressure has not risen with pumping. The timing on a frozen 1:2 trace is correct and the gas line is not kinked. Fluoroscopy shows the tip well below the carina, and the line at the groin is looser than when it was placed. What next?",
          options: [
            "Reposition the balloon to the carina level under fluoroscopy, then secure it",
            "Change to 1:3 so that each assisted beat gets a longer diastole to augment",
            "Exchange for the 50 mL balloon, which will fill the aorta at this lower level",
            "Increase the heparin, because thrombus on the balloon is stopping it inflating",
          ],
          answer: 0,
          explanation:
            "A low balloon is one of Brilakis's causes of poor augmentation, and a catheter that has been pulled back is his cause of migration; the treatment is to reposition and then secure it (he sutures it after insertion to prevent this). A bigger balloon is chosen by height, not to compensate for position, and 1:3 is a weaning step that gives less support, not more.",
        },
        { kind: "h", text: "Anticoagulation, rhythm and pump failure" },
        {
          kind: "list",
          items: [
            "**Anticoagulate.** Brilakis gives therapeutic anticoagulation; most patients in Oxford receive intravenous heparin, with the platelet count watched if the infusion is prolonged.",
            "**No anticoagulation?** If it cannot be given, or has to stop (for example for retroperitoneal bleeding), Brilakis runs the balloon at 1:1 to lower the risk of thrombus forming on it.",
            "**Fast or irregular rhythms.** Oxford finds the pump less effective in tachycardia, especially when the rhythm is irregular, and suggests triggering from the aortic pressure rather than the ECG in these patients.",
            "**The pump stops.** Balloon rupture, an empty helium supply or loss of the ECG trigger: pumping has to restart within 10–15 minutes or the balloon comes out, because a motionless balloon can grow clot and embolise downstream (Oxford).",
            "**Limbs and kidneys.** Mark the distal pulses and check them regularly. Oxford warns that the pump may sometimes reduce renal blood flow, and that ischaemia usually affects the leg on the side of insertion but can affect the other one; a cold, pale, painful leg with weaker pulses needs specialist help at once.",
          ],
        },
        { kind: "tip", id: "mcs-iabp-no-heparin-1to1" },
        { kind: "tip", id: "mcs-iabp-static-balloon" },
        { kind: "tip", id: "mcs-iabp-irregular-rhythm" },
        {
          kind: "check",
          stem: "An hour after a balloon pump was placed during high-risk PCI, and left at 1:2 since the timing check, the patient becomes hypotensive with back pain and a falling haemoglobin; CT shows a retroperitoneal haematoma and the team stops heparin. The pump is still needed. What do you change on the console?",
          options: [
            "Reduce to 1:3 so that the balloon is moving less often against the aortic wall",
            "Run at 1:1 so that the balloon moves on every beat while there is no anticoagulation",
            "Switch the pump off until the bleeding is controlled, then restart it at 1:2",
            "Keep 1:2, because the ratio has no bearing on thrombus formation on the balloon",
          ],
          answer: 1,
          explanation:
            "Brilakis treats retroperitoneal bleeding by stopping anticoagulation when needed and then running the balloon at 1:1 to minimise thrombus on it. Slower ratios leave the balloon still for longer between inflations, and switching the pump off leaves a motionless balloon in the aorta, which Oxford allows for only 10–15 minutes before it must come out.",
        },
        { kind: "h", text: "Weaning and the complications" },
        {
          kind: "p",
          text: "Oxford weans by spacing the inflations out: every second cardiac cycle, then every third. Neither manual gives more of a weaning protocol than that; Brilakis's monitoring list asks you to watch the systemic pressure throughout, and that applies at each step. Removal follows the technique in the previous lesson. Brilakis lists the other things that can go wrong: access-site problems (limb ischaemia and retroperitoneal bleeding, from the access technique and from anticoagulation), aortic dissection, thromboembolism from clot on the balloon, and entrapment of the balloon catheter. An ischaemic leg usually recovers once the pump and its sheath are out and haemostasis is achieved by hand, but sometimes needs surgical or endovascular treatment.",
        },
        { kind: "tip", id: "mcs-iabp-wean-ratio" },
        { kind: "tip", id: "mcs-iabp-limb" },
        {
          kind: "pitfalls",
          items: [
            "Judging the timing at 1:1, where there is no unassisted beat to compare with.",
            "Accepting a mean pressure that does not rise without going through the causes: timing, position, size, kinks, volume, filling and vascular tone.",
            "Stopping heparin and leaving the balloon at 1:2 or 1:3.",
            "Leaving a stopped balloon in the aorta for more than 10–15 minutes.",
            "Trusting ECG triggering in fast atrial fibrillation instead of trying the pressure trigger.",
            "Forgetting the legs and the urine output once the trace looks good.",
          ],
        },
        {
          kind: "pearl",
          text: "Read every trace in the same order, A to E: notch, C above B, D below A, E below B. Four comparisons take ten seconds, and each wrong answer narrows the cause.",
        },
        {
          kind: "sim",
          sim: "iabp",
          task: "With the timing deliberately wrong, freeze a 1:2 trace and name A to E aloud. Decide which of the four errors is present from the landmarks, correct inflation and deflation until C is above B, D is below A and E is below B, then step the ratio down from 1:1 to 1:2 and 1:3 as if weaning.",
        },
        { kind: "video", id: "ULgjuhBgP9U", note: "Elias Hanna on balloon pump haemodynamics, troubleshooting and technical tips." },
        {
          kind: "keypoints",
          items: [
            "Brilakis's four monitoring tasks: timing at 1:2, systemic pressure, balloon position, anticoagulation.",
            "Landmarks: inflation at the notch; augmented peak (C) above the unassisted peak (B); assisted end-diastolic pressure (D) below unassisted (A); assisted systole (E) below unassisted (B).",
            "Poor augmentation: hypovolaemia, low position, small balloon, low vascular resistance, timing, kink, low delivered volume.",
            "Poor afterload reduction: incomplete filling, compliant aorta, position, partly blocked gas lumen, timing.",
            "No anticoagulation: run at 1:1. A stopped balloon must restart within 10–15 minutes or come out.",
            "Irregular tachycardia: consider the pressure trigger. Wean 1:2 then 1:3.",
            "Watch for limb ischaemia (either leg), reduced renal blood flow, dissection, thromboembolism and entrapment.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-impella-insert",
      title: "Inserting a microaxial pump, step by step",
      minutes: 16,
      topics: ["mcs-impella-insertion"],
      sources: [
        { book: "brilakis-pci", loc: "14.4" },
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "4.4" },
        { book: "oxford-cath", loc: "ch 9: Impella" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "riley-ivl-impella-2019"],
      blocks: [
        {
          kind: "p",
          text: "The microaxial pump is a catheter-mounted rotary pump that sits across the aortic valve: blood enters an inlet in the left ventricle and leaves through an outlet in the ascending aorta. Oxford adds that a pigtail at its tip lets it rest in the ventricle without injuring it, and that the device draws blood out of the ventricle and moves it into the ascending aorta, so it sits across the valve plane with the inlet below and the outlet above (Brilakis puts the inlet about 3.5 cm below the valve). Getting it there safely is a sequence of twelve steps in Brilakis; the large-bore access part (steps 1 to 4) is taught in detail in pm-access and summarised here, and this lesson concentrates on crossing the valve, loading, advancing, positioning and starting the pump.",
        },
        { kind: "h", text: "Steps 1 to 4: the route in (summary)" },
        {
          kind: "steps",
          items: [
            { title: "1. Access and a femoral angiogram", detail: "A 5–6 Fr sheath first, then an angiogram to confirm the artery is big enough and free of significant disease for the pump sheath." },
            { title: "2. Pre-close", detail: "Two suture devices at 10 and 2 o'clock, left untied in gauze or insulin syringes." },
            {
              title: "3. The pump sheath",
              detail: "Over the stiff wire from the pump kit, pass and remove 8, 10 and 12 Fr dilators, then the peel-away sheath (short, 13 cm, or long, 25 cm), or a 14 Fr sheath of another make; repeat the angiogram to make sure the leg is not ischaemic.",
            },
            {
              title: "4. Heparin",
              detail: "Usually unfractionated heparin, to the ACT above 250 seconds Brilakis recommends (typical; follow local protocol); only then take out the sheath's dilator and aspirate and flush the sheath.",
            },
          ],
        },
        { kind: "tip", id: "mcs-largebore-angiogram-first" },
        { kind: "tip", id: "mcs-preclose-two-sutures" },
        { kind: "h", text: "Step 5: cross the aortic valve and leave a stiff wire in the ventricle" },
        {
          kind: "steps",
          items: [
            {
              title: "Choose a pigtail",
              detail:
                "Take a pigtail catheter to the aortic root. Brilakis prefers it to an Amplatz or multipurpose catheter because its curl is less likely to slip behind a papillary muscle, and a pump that ends up under the papillary muscles is one of his causes of suction later.",
            },
            { title: "Enter the ventricle", detail: "Cross the aortic valve with the pigtail into the left ventricle." },
            {
              title: "Place the long stiff wire",
              detail: "Through the pigtail, advance a 260 cm stiff 0.014 or 0.018 inch wire into the ventricle. The pump will travel over a 0.018 inch wire.",
            },
            { title: "Remove the pigtail", detail: "Withdraw the pigtail and leave the wire in the ventricle." },
          ],
        },
        {
          kind: "p",
          text: "**If the pigtail will not cross.** Aortic stenosis is the cause Brilakis gives. Stiffening the pigtail with a 0.035 inch J-wire inside it can let it pass; when the valve is stenotic, balloon dilation of the valve may be needed. Remember where the line is drawn: Oxford lists severe aortic stenosis among the contraindications to the pump.",
        },
        { kind: "tip", id: "mcs-impella-cross-pigtail" },
        {
          kind: "check",
          stem: "You are crossing the aortic valve for a microaxial pump. A colleague offers an AL1, which crossed easily in the last case. Why does Brilakis use a pigtail instead?",
          options: [
            "The AL1 cannot accept a 0.018 inch wire, so the pump wire would not pass",
            "A pigtail is less likely to slip behind a papillary muscle, a cause of later suction",
            "The pigtail's side holes let you inject contrast to measure the valve area first",
            "An AL1 cannot be used in the left ventricle without a second arterial access",
          ],
          answer: 1,
          explanation:
            "Brilakis chooses the pigtail rather than an Amplatz or multipurpose shape because its curl seldom slips behind a papillary muscle, and his suction-alarm prevention includes crossing with a pigtail for exactly that reason. The other options are not reasons he gives: the wire size and access questions are unrelated to the catheter shape.",
        },
        { kind: "h", text: "Step 6: the pump is prepared in parallel" },
        {
          kind: "p",
          text: "While you obtain access and pre-close, the catheter laboratory technician usually connects the pump to its controller and purges it, following the device's instructions for use. Working in parallel means the pump is ready by the time the access is.",
        },
        { kind: "h", text: "Step 7: load the pump on the wire" },
        {
          kind: "steps",
          items: [
            { title: "Straighten the wire tip", detail: "Then put the 0.018 inch wire into the red loading lumen at the tip of the pump's pigtail." },
            { title: "Advance until it exits", detail: "Push the wire on until it comes out of the red lumen near the label." },
            { title: "Remove the red lumen completely", detail: "Pull the red loading tube right out before the pump goes in." },
          ],
        },
        {
          kind: "table",
          caption: "Loading problems (Brilakis 14.4.7)",
          head: ["Problem", "Why it happens", "What to do"],
          rows: [
            [
              "No red loading lumen to use",
              "It was taken off by mistake, or the pump had to be removed and reinserted",
              "Backload the pump onto the back end of the 0.018 inch wire; the wire must come out at the outlet, on the inner curve of the cannula, lined up with the catheter's straight black line",
            ],
            [
              "Part of the red tube left inside the pump",
              "Faulty preparation, or the tube fractured",
              "The pump may not work. Prevent it by checking the tube is fully out before insertion; if it happens, remove the pump, remove the tube and use a new pump",
            ],
          ],
        },
        { kind: "tip", id: "mcs-impella-loading-lumen" },
        { kind: "h", text: "Step 8: advance the pump into the ventricle" },
        {
          kind: "steps",
          items: [
            { title: "Your assistant holds the wire", detail: "The 0.018 inch wire must not move while the pump travels over it." },
            {
              title: "Go through the sheath briskly",
              detail: "Use quick, short pushes. While the inlet is inside the sheath and the outlet is outside it, blood pours out through the pump, so this phase should be brief.",
            },
            {
              title: "Track it under fluoroscopy",
              detail: "Follow the pump through the iliac arteries, around the arch and across the aortic valve into the ventricle.",
            },
            {
              title: "Set the depth",
              detail:
                "Aim for an inlet about 3.5 cm beneath the valve. When the valve is hard to see, mark it with a pigtail passed through a second access and parked in a coronary cusp.",
            },
            { title: "Remove the wire", detail: "Withdraw the 0.018 inch wire once the pump is positioned." },
          ],
        },
        {
          kind: "table",
          caption: "The pump will not pass the iliac arteries (Brilakis 14.4.8)",
          head: ["", "What Brilakis advises"],
          rows: [
            ["Causes", "Iliofemoral stenoses; tortuous, calcified iliofemoral arteries"],
            ["Prevention", "Use the less diseased femoral artery"],
            ["Treatment", "The long peel-away sheath (though in a tortuous or diseased iliac the short sheath is sometimes the better choice); balloon angioplasty of the iliac artery; intravascular lithotripsy of a heavily calcified iliac artery"],
            ["Elsewhere in the manual", "If the femoral route is poor or the pump will not advance, axillary or transcaval access in experienced hands (pm-access, pm-support-choice)"],
          ],
        },
        {
          kind: "p",
          text: "The lithotripsy option comes from a single case report Brilakis cites, in which intravascular lithotripsy of calcified plaque allowed a 14 Fr sheath to be delivered for the pump before high-risk PCI. It shows that the technique can open the route, not how often it works.",
        },
        { kind: "tip", id: "mcs-impella-iliac-resistance" },
        { kind: "tip", id: "mcs-impella-brisk-advance" },
        {
          kind: "check",
          stem: "The pump stops advancing in a tortuous, calcified right external iliac artery with the short peel-away sheath in place. The left iliac was more diseased on the angiogram. Which option is in Brilakis's list?",
          options: [
            "Push harder with the wire pinned, since the pump's pigtail tip protects the vessel",
            "Exchange for the long peel-away sheath, or treat the iliac with angioplasty or lithotripsy",
            "Withdraw the 0.018 inch wire a little so the pump tip is more flexible in the bend",
            "Switch to the left iliac artery, because the side does not change pump delivery",
          ],
          answer: 1,
          explanation:
            "For a pump that will not pass the iliacs Brilakis lists the long peel-away sheath (sometimes the short one), iliac balloon angioplasty and intravascular lithotripsy for heavy calcium. Prevention is the less diseased side, which you already chose. Forcing the pump risks the vessel, pulling back the wire loses the rail, and the more diseased side is the wrong way round.",
        },
        { kind: "h", text: "Step 9: start the pump" },
        {
          kind: "steps",
          title: "A pre-start checklist",
          items: [
            { title: "Position", detail: "Inlet about 3.5 cm below the aortic valve, inside the ventricle." },
            { title: "Wire", detail: "The 0.018 inch wire is out." },
            { title: "Waveform", detail: "The controller is showing an aortic waveform." },
            { title: "Start", detail: "Press the start button and watch the flow." },
            { title: "Mode", detail: "In the laboratory the automatic support setting is usually chosen; Brilakis notes that after 3 hours the device defaults to performance level P9 (controller behaviour varies between console generations; the device's instructions for use are the authority)." },
          ],
        },
        { kind: "tip", id: "mcs-impella-start-check" },
        {
          kind: "figure",
          id: "impella-position",
          caption: "Target position: inlet in the ventricle about 3.5 cm below the aortic valve, outlet in the ascending aorta, pigtail free in the cavity.",
        },
        { kind: "h", text: "Step 11: the guide through the pump sheath" },
        {
          kind: "p",
          text: "The pump's shaft is 9 Fr inside a 14 Fr sheath, leaving room for a sheath of up to 7 Fr beside it, so the guide can share the pump's arteriotomy and a second arterial puncture is avoided. The technique (a micropuncture needle through the sheath valve, 0.018 then 0.035 inch wires, a 7 Fr sheath, 100 or 125 cm guides) is taught in pm-access. The point for this lesson: hold the pump and watch it on fluoroscopy while the second sheath goes in, because pushing the pump forward can injure the ventricle.",
        },
        { kind: "tip", id: "mcs-impella-hold-pump" },
        {
          kind: "pitfalls",
          items: [
            "Crossing with an Amplatz or multipurpose catheter, which can leave the wire, and then the pump, behind a papillary muscle.",
            "Forcing a pigtail through a stenotic valve without stiffening it, or forgetting that severe aortic stenosis contraindicates the pump (Oxford).",
            "Inserting the pump with part of the red loading tube still inside it.",
            "Advancing slowly through the sheath while blood pours out of the pump.",
            "Setting the depth without seeing the valve; a pigtail in a cusp from a second access marks it.",
            "Starting the pump with the wire still in, or without an aortic waveform on the controller.",
            "Letting the pump move forward while a second sheath is pushed through its sheath.",
          ],
        },
        {
          kind: "pearl",
          text: "Divide the insertion into a quiet half and a fast half. Access, crossing, wire and loading can be careful and unhurried; once the pump enters the sheath, move quickly through the bleeding phase, then slow down again for the depth.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "Position the pump with the inlet about 3.5 cm below the valve, confirm that the wire is out and that the controller shows an aortic waveform, then start it (Brilakis usually selects automatic support in the laboratory). Before you begin, say the order of steps 5 to 9 aloud: pigtail across the valve, 260 cm stiff wire, pigtail out, pump loaded and red tube removed, brisk passage through the sheath, depth, wire out, start.",
        },
        { kind: "video", id: "5lDjuvQruZ0", note: "Brilakis: the microaxial pump step by step (Manual of PCI, chapter 14)." },
        { kind: "video", id: "WFn91e2qA08", note: "Brilakis case 194: trifurcation PCI supported by a microaxial pump." },
        { kind: "video", id: "BXRpJS8jtFM", note: "Elias Hanna on axillary access for a balloon pump or microaxial pump: access, exchange, closure and complications." },
        {
          kind: "keypoints",
          items: [
            "Access: 5–6 Fr sheath and angiogram, two pre-close sutures at 10 and 2 o'clock, 8–10–12 Fr dilators, peel-away sheath (13 or 25 cm), limb angiogram, ACT above 250 seconds.",
            "Cross the valve with a pigtail (less likely to go behind a papillary muscle), place a 260 cm stiff 0.014 or 0.018 inch wire, remove the pigtail.",
            "Stenotic valve: stiffen the pigtail with a 0.035 inch J-wire; balloon dilation may be needed; severe stenosis contraindicates the pump (Oxford).",
            "Load through the red lumen and remove it completely; if it is gone, backload with the wire leaving the outlet on the inner curve, along the black line.",
            "Wire held, brisk passage through the sheath, fluoroscopy through the iliacs and valve, inlet about 3.5 cm below the valve.",
            "Iliac resistance: long (sometimes short) peel-away sheath, iliac angioplasty, lithotripsy; prevent by using the less diseased side.",
            "Start only with the wire out and an aortic waveform on the controller; hold the pump when anything else goes through its sheath.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-impella-run",
      title: "Running a microaxial pump: position, alarms, haemolysis, purge and the end of the case",
      minutes: 15,
      topics: ["mcs-impella-management"],
      sources: [
        { book: "brilakis-pci", loc: "14.4" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "24.2" },
        { book: "oxford-cath", loc: "ch 9: Impella" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "van-edom-impella-bleeding-haemolysis-2023", "balthazar-impella-position-2023", "basir-ncsi-2019"],
      blocks: [
        {
          kind: "p",
          text: "Once the pump is running, Brilakis asks you to watch two things throughout the PCI: the flow and the pressure waveform on the controller. The problems Brilakis lists during the case (a pump pulled back into the aorta, suction, a pump that stops) show themselves in the flow, the waveform or the alarms. The Academy lesson on running the pump covers the console in intensive care; this lesson follows Brilakis's problems during the case and the decisions at its end.",
        },
        { kind: "h", text: "What you watch" },
        {
          kind: "list",
          items: [
            "**Flow.** Brilakis monitors it from the moment the pump is started.",
            "**The waveform.** It should be aortic. A ventricular waveform means the pump has gone too deep: pull it back.",
          ],
        },
        { kind: "tip", id: "mcs-impella-ventricular-waveform" },
        { kind: "h", text: "What goes wrong during the case (Brilakis 14.4.10 and 14.4.11)" },
        {
          kind: "table",
          caption: "Four problems, with causes, prevention and treatment",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            [
              "Pump pulled back into the aorta",
              "The patient moved; the pump was not sutured securely",
              "Good sedation; secure the pump at the groin",
              "Try to re-advance it into the ventricle, preferably under fluoroscopy; if that fails, take it out and repeat steps 5 to 10",
            ],
            [
              "Suction alarm",
              "Hypovolaemia; right ventricular failure; cannula lying under the papillary muscles",
              "Optimise volume while keeping the RA pressure below 10 mmHg; keep the pump still; cross the valve with a pigtail",
              "Lower the performance level by 1 or 2; fluid if hypovolaemic; check and correct the position; support the right ventricle if needed",
            ],
            [
              "The pump stops",
              "Device malfunction; the battery runs out; thrombus",
              "Keep the console plugged into the mains; anticoagulate properly",
              "Try to restart it; if it will not restart, pull it out of the ventricle so that it does not leave the valve regurgitant",
            ],
            [
              "Pump pushed forward while a sheath is inserted through its sheath",
              "The pump was not held still",
              "Hold the pump and watch it on fluoroscopy",
              "Brilakis gives prevention only: the danger is injury to the left ventricle",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Other causes of an empty ventricle.** Brilakis lists three causes of suction. The Academy lesson on running the pump adds tamponade and bleeding, both of which leave the ventricle underfilled; during PCI that means looking for a coronary perforation on the angiogram and an effusion on echo, and checking the haemoglobin, before blaming volume alone.",
        },
        { kind: "tip", id: "mcs-impella-suction" },
        { kind: "tip", id: "mcs-impella-pulled-back" },
        { kind: "tip", id: "mcs-impella-stopped" },
        {
          kind: "check",
          stem: "During a protected left main PCI the pump gives a suction alarm and the flow falls. The RA pressure is 4 mmHg, the arterial pressure is falling, and on fluoroscopy the pump has not moved. What does Brilakis's treatment list say to do first?",
          options: [
            "Raise the performance level by two steps to restore the pump's flow",
            "Pull the pump back into the aorta until the alarm stops, then continue the PCI",
            "Lower the performance level by one or two steps and give fluid for hypovolaemia",
            "Start right ventricular support at once, since suction always means RV failure",
          ],
          answer: 2,
          explanation:
            "Suction means the pump is asking for more blood than it can get. Brilakis's treatment is to reduce the performance level by 1 or 2, give fluid if the patient is hypovolaemic (an RA pressure of 4 mmHg fits), check and correct the position, and support the RV only if it is failing. Raising the level makes suction worse; a pump pulled into the aorta no longer unloads the ventricle.",
        },
        {
          kind: "check",
          stem: "The pump stops during the PCI and will not restart. Why does Brilakis tell you to withdraw it from the ventricle?",
          options: [
            "A stopped pump across the valve lets blood leak back from the aorta into the ventricle",
            "A stopped pump in the ventricle will be ejected into the aorta by the next contraction",
            "A stopped pump blocks the coronary ostia and causes global ischaemia",
            "A stopped pump in the ventricle triggers ventricular fibrillation within minutes",
          ],
          answer: 0,
          explanation:
            "Brilakis removes a pump that will not restart from the ventricle to avoid aortic regurgitation: the cannula holds the valve open while nothing is being pumped forward. The other mechanisms are not the reason he gives.",
        },
        { kind: "h", text: "Position, haemolysis and bleeding" },
        {
          kind: "p",
          text: "Both manuals list haemolysis among the pump's complications; Brilakis grades its risk above the balloon pump's, and Oxford's list of pump complications runs from haemolysis and thrombosis of the device through migration, stroke and infection to limb ischaemia and vascular trauma. The shock protocol Brilakis reproduces (Fig 24.8, taught in pm-support-choice) already asks the intensive care team to watch for haemolysis and adjust the pump's position as indicated, alongside a daily haemodynamic assessment that includes a detailed vascular examination; two later reviews explain the link. A practical review of bleeding and haemolysis on these pumps names them as the two commonest complications and attributes most haemolysis to pump instability, from patient or device factors, recommending an echo assessment at the outset, frequent monitoring and prompt correction. A review of pump positioning stresses both the insertion depth and the rotation of the cannula: a cannula turned towards the mitral valve can cause suction alarms, haemolysis, aortic regurgitation and poor support, and suction from malposition has to be told apart from suction caused by the haemodynamics.",
        },
        { kind: "tip", id: "mcs-impella-haemolysis-position" },
        {
          kind: "p",
          text: "**How it compares with the balloon pump (Oxford).** The microaxial pump does not depend on the ventricle's own systolic pulsation, so it becomes more useful the worse the left ventricle is. The price is larger vascular access, and with it more access-site complications, prolonged anticoagulation, a higher cost and a longer learning curve.",
        },
        { kind: "h", text: "Purge and anticoagulation" },
        {
          kind: "list",
          items: [
            "**Purge.** The pump is connected to its controller and purged during preparation, following its instructions for use. Neither manual describes the purge solution or its alarms; the Academy lesson on running the pump does, and the device's instructions for use are the authority.",
            "**Anticoagulation.** Brilakis gives heparin to an ACT above 250 seconds before the sheath is opened (typical; local protocol applies), and lists thrombus as a cause of the pump stopping, prevented by proper anticoagulation. Oxford adds that the pump needs prolonged anticoagulation, and lists a contraindication to anticoagulation among the reasons not to use it.",
            "**Bleeding.** Brilakis grades the pump's bleeding risk above the balloon pump's; his device table lists a high bleeding risk as a contraindication to every support device, the balloon pump included.",
          ],
        },
        { kind: "h", text: "The end of the PCI: remove it or keep it (Brilakis 14.4.12)" },
        {
          kind: "steps",
          title: "If support is no longer needed",
          items: [
            { title: "1. Wean in the laboratory", detail: "Slowly reduce support to level P2 and check that the patient tolerates it." },
            { title: "2. Into the aorta", detail: "Pull the pump back out of the ventricle into the aorta." },
            { title: "3. Off", detail: "Stop the pump and disconnect it from the controller." },
            { title: "4. Out quickly", detail: "Remove it through the peel-away sheath without pausing: bleeding is heavy during the moment when the outlet has left the sheath but the inlet has not." },
            {
              title: "5. Close",
              detail: "Take the sheath out and tighten the pre-placed sutures; a balloon passed into the iliac artery from the other groin reduces bleeding and helps haemostasis.",
            },
          ],
        },
        {
          kind: "steps",
          title: "If support continues after the PCI",
          items: [
            { title: "1. Swap sheaths", detail: "Take out the peel-away sheath while you advance the pump's repositioning sheath into the artery." },
            {
              title: "2. Peel only outside the body",
              detail: "With an assistant pressing on the groin, draw the peel-away sheath back until it is entirely outside; splitting it while part is still in the artery can tear the artery and cause bleeding that is hard to control.",
            },
            { title: "3. Split it", detail: "Bend the two wings back and peel until the sheath is completely off the pump catheter." },
            { title: "4. Advance the repositioning sheath", detail: "Flush its side arm, then advance it into the femoral artery." },
            { title: "5. Snug the sutures", detail: "Partly tighten the pre-placed sutures to limit oozing around the repositioning sheath." },
            { title: "6. Angle and fix", detail: "Gauze under the catheter keeps a 45° entry angle; suture the repositioning sheath and the pump to the skin so the pump cannot move." },
          ],
        },
        { kind: "tip", id: "mcs-largebore-removal-sutures" },
        { kind: "tip", id: "mcs-impella-peel-outside" },
        {
          kind: "check",
          stem: "The PCI is finished but the patient still needs support overnight. The peel-away sheath is half out of the groin. What is the next move?",
          options: [
            "Split the peel-away sheath now so the repositioning sheath can follow it in",
            "Leave the peel-away sheath in overnight and remove it with the pump the next day",
            "Tie the pre-placed sutures fully around the pump catheter to stop the oozing",
            "Withdraw it fully outside the body under groin pressure, then split it",
          ],
          answer: 3,
          explanation:
            "Brilakis withdraws the peel-away sheath completely out of the body, with an assistant pressing on the groin, before peeling it, because splitting it inside the artery can injure the artery and cause bleeding that is hard to control. The sutures are only partly tightened around the repositioning sheath, not tied, and the peel-away sheath is not the sheath for continued support.",
        },
        {
          kind: "p",
          text: "**Weaning later, in shock.** The decision to remove a pump after a period of support in cardiogenic shock (off all vasopressors and inotropes, with cardiac power output above 0.6 W and PAPi above 0.9 in the shock protocol from Basir and colleagues that Brilakis reproduces as Fig 24.8) is taught in pm-support-choice. **When VA-ECMO is added**, Brilakis notes that a pump already in place is often kept to vent the left ventricle (lesson 6).",
        },
        { kind: "tip", id: "mcs-wean-criteria" },
        {
          kind: "pitfalls",
          items: [
            "Ignoring a ventricular waveform on the controller: the pump is too deep.",
            "Turning the performance level up for a suction alarm.",
            "Giving fluid for suction without looking at the RA pressure and the right ventricle.",
            "Leaving a pump that will not restart across the valve.",
            "A poorly sedated, poorly secured patient, then a pump in the aorta mid-case.",
            "Assuming haemolysis is inevitable instead of checking the depth and rotation on echo.",
            "Splitting the peel-away sheath while it is still in the artery.",
          ],
        },
        {
          kind: "pearl",
          text: "When the pump alarms, ask the same questions every time: where is it (fluoroscopy or echo), is the left ventricle full enough (RA pressure, echo), and is the right ventricle delivering (RA pressure, PAPi)? If the ventricle looks empty, add a fourth: could this be tamponade or bleeding (echo, haemoglobin, a perforation on the angiogram)? Then change one thing.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "In the suction scenario, read the RA pressure and the placement signal before acting. Lower the performance level by one or two steps, give fluid only if the RA pressure is low, correct the depth if the placement signal is ventricular, and state when you would support the right ventricle. Then wean to P2 and describe the removal sequence.",
        },
        { kind: "video", id: "pIdQ-P8Ekpc", note: "Brilakis case 36: challenges in PCI supported by a microaxial pump." },
        { kind: "video", id: "FF9C5VxIJZM", note: "Elias Hanna on the microaxial pump: concepts, troubleshooting scenarios, weaning and sheath management." },
        {
          kind: "keypoints",
          items: [
            "Watch flow and waveform; the waveform should be aortic, and a ventricular one means pull back.",
            "Pulled back into the aorta: re-advance under fluoroscopy if possible, otherwise remove and repeat steps 5 to 10; prevent with sedation and a secure fixation.",
            "Suction: hypovolaemia, RV failure or a cannula under the papillary muscles; lower the level by 1–2, fluid if dry, correct the position, support the RV.",
            "Stopped pump: restart; if it will not, withdraw it from the ventricle to avoid aortic regurgitation.",
            "Haemolysis is mostly driven by pump instability, and alarms and haemolysis can follow malposition, including rotation towards the mitral valve; check depth and rotation on echo, and watch for haemolysis in intensive care (Fig 24.8).",
            "Purge per the instructions for use; ACT above 250 seconds at insertion; the pump needs prolonged anticoagulation.",
            "End of PCI: wean to P2, into the aorta, off, out quickly, tighten sutures; or convert to the repositioning sheath, peeling the old sheath only outside the body.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-ecmo-cannulate",
      title: "VA-ECMO cannulation, step by step",
      minutes: 16,
      topics: ["mcs-ecmo-cannulation"],
      sources: [
        { book: "brilakis-pci", loc: "14.5" },
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "3.6" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "22.1" },
        { book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "patton-rivera-nirs-ecmo-2018",
        "ecls-shock-2023",
        "marbach-ecmo-limb-ischaemia-2022",
        "juo-distal-perfusion-2017",
        "ortoleva-vaecmo-review-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "VA-ECMO drains venous blood, passes it through a centrifugal pump and a membrane oxygenator, and returns it to the arterial tree, so it supports both the circulation and gas exchange. Oxford calls it probably the most used form of extracorporeal support in the laboratory because it is relatively simple to insert, while warning that the access is large and often needs a surgical cut-down. In Brilakis the situations in which you will be cannulating include cardiac arrest, where he calls VA-ECMO essential to prevent death (including arrest during PCI that does not respond promptly to CPR); refractory arrhythmias; refractory shock; cardiogenic shock with hypoxaemia, because the circuit supports oxygenation as well as the circulation; and biventricular failure, where VA-ECMO is the usual choice. He also recommends having it available during PCI of spontaneous coronary artery dissection, where abrupt closure is a high risk. Routine early VA-ECMO did not lower 30-day mortality in infarct-related shock and caused more bleeding and peripheral vascular complications (ECLS-SHOCK), so selection matters; it is taught in pm-support-choice. Brilakis describes a percutaneous, femoro-femoral sequence in eight steps; the circuit itself is managed by a perfusionist.",
        },
        {
          kind: "table",
          caption: "Cannula sizes and flows: check your circuit's instructions, because the sources differ",
          head: ["", "Brilakis 14.5 (the step-by-step)", "Brilakis Table 14.1 and 30.1", "Oxford"],
          rows: [
            ["Venous (drainage)", "25 Fr in most patients", "21–25 Fr (Table 14.1); 25 Fr (30.1)", "18–21 F"],
            ["Arterial (return)", "15 Fr for most women, 17 Fr for most men, occasionally larger", "15–19 Fr", "14–16 F"],
            ["Cardiac output support", "Not given", "An increase in cardiac output of 4–5 L/min, depending on arterial cannula size (Table 14.1)", "3–7 L/min of cardiac output"],
          ],
        },
        {
          kind: "p",
          text: "For comparison, a 2026 review (Ortoleva) gives the usual adult sizes for peripheral VA-ECMO as arterial 15–19 Fr, venous 21–25 Fr and a distal perfusion catheter of 5–8 Fr, in line with Brilakis's device table; Oxford's figures are smaller.",
        },
        { kind: "h", text: "The eight steps (Brilakis 14.5)" },
        {
          kind: "steps",
          title: "Steps 1 to 3: groins, limb and heparin",
          items: [
            {
              title: "1. Arterial and venous access, with an arterial angiogram",
              detail:
                "Put the venous access in the right common femoral vein, from which the cannula reaches the right atrium more easily, and use the left common femoral artery for the arterial side. Brilakis advises against putting both in one groin, because a large arterial cannula next to the femoral vein can compress it and congest the leg. (In an ELSO registry analysis that Ortoleva reports, same-side cannulation did not change limb ischaemia needing intervention, but bleeding, vessel repair and in-hospital mortality were lower with the cannulae on opposite sides after adjustment.) Unless it is an emergency, take an angiogram of the femoral artery to make sure it is big enough and free of significant disease for the cannula.",
            },
            {
              title: "2. Antegrade access for the leg",
              detail:
                "The arterial cannula can make the leg ischaemic, so place an antegrade sheath in the common or superficial femoral artery, ideally under ultrasound with a micropuncture needle. Do it before the arterial cannula if you can, because the cannula can get in the way; in an urgent case it can wait until the circuit is running. Brilakis usually uses a 6 Fr, 24 cm reinforced sheath, which resists kinking. With smaller (15–17 Fr) arterial cannulae it may not be needed: near-infrared spectroscopy decides, and a tissue saturation below 50%, or more than 15% below the other leg, calls for one. In the pilot study behind these numbers, brief dips below 50% (under four minutes) did not mean ischaemia, so the 50% threshold applies to a sustained reading. Observational meta-analyses link a distal perfusion catheter with less limb ischaemia (a prophylactic catheter had an odds ratio of 0.31 in one; 9.7% against 25.4% with and without a catheter in the other), the ELSO interim guideline that Ortoleva reports recommends one for arterial cannulae larger than 17 Fr, and the Academy lesson on the circuit places one at or soon after cannulation. With smaller cannulae Brilakis and the ELSO guidance accept close monitoring of the leg instead; the NIRS thresholds behind that monitoring come from a 25-patient pilot.",
            },
            {
              title: "3. Anticoagulate",
              detail: "Unfractionated heparin, 70–100 units/kg in Brilakis (typical; follow local protocol), to prevent thrombus in the cannulae and the circuit.",
            },
          ],
        },
        { kind: "tip", id: "mcs-ecmo-groins" },
        { kind: "tip", id: "mcs-ecmo-antegrade-sheath" },
        {
          kind: "check",
          stem: "You are about to cannulate a patient in refractory shock for VA-ECMO. A colleague suggests putting both cannulae in the right groin so that the left stays free. What does Brilakis advise?",
          options: [
            "Both in the right groin is preferred, as one sterile field is quicker in an emergency",
            "Both in the left groin is preferred, because the left iliac vein is straighter",
            "Venous in the right femoral vein and arterial in the left femoral artery",
            "Arterial in the right femoral artery and venous in the left femoral vein",
          ],
          answer: 2,
          explanation:
            "Brilakis puts the venous cannula in the right common femoral vein, from which it reaches the right atrium more easily, and the arterial cannula in the left common femoral artery. He keeps them in different groins because a large arterial cannula can compress the adjacent femoral vein and congest the leg.",
        },
        {
          kind: "steps",
          title: "Step 4: the venous cannula",
          items: [
            {
              title: "Wire into the superior vena cava",
              detail:
                "Advance a stiff guidewire (an extra-stiff exchange wire) from the right femoral vein into the superior vena cava, and make sure it sits distally there. A wire that falls back into the right atrium can steer the cannula into an intracardiac structure and perforate it.",
            },
            { title: "Open the skin", detail: "Spread the skin entry with a haemostat." },
            {
              title: "Advance the cannula",
              detail: "A 25 Fr cannula in most patients, advanced under fluoroscopy into the right atrium. The best position for its tip is the junction of the superior vena cava and right atrium. Stop if you feel resistance.",
            },
            { title: "Clamp", detail: "Clamp the back end of the cannula." },
          ],
        },
        {
          kind: "table",
          caption: "Venous cannula problems (Brilakis 14.5.4)",
          head: ["Problem", "What to do"],
          rows: [
            ["The cannula is hard to advance", "Usually resistance at the skin: dilate the entry further first"],
            ["Venous thrombosis", "Use the other femoral vein, or the internal jugular vein"],
            ["Inferior vena cava filter", "Use the internal jugular vein"],
            ["Laceration of the vein as the cannula advances", "Advance only under fluoroscopy, with the wire confirmed in the superior vena cava; stop at any resistance"],
            ["Cannula tip lying against the atrial septum", "Usually the result of a wire that was not far enough into the superior vena cava; reposition"],
            ["Leg ischaemia", "Listed among what can go wrong at this step; watch the leg (step 2)"],
          ],
        },
        { kind: "tip", id: "mcs-ecmo-venous-wire-svc" },
        {
          kind: "check",
          stem: "Before advancing the 25 Fr venous cannula you see on fluoroscopy that the stiff wire has dropped back and is curled in the right atrium. What do you do?",
          options: [
            "Advance the cannula anyway; its tip will settle at the junction once flow starts",
            "Reposition the wire distally in the superior vena cava before advancing the cannula",
            "Switch to the left femoral vein, as a wire that falls back cannot be repositioned",
            "Advance the cannula slowly over the curled wire so that the cannula straightens it",
          ],
          answer: 1,
          explanation:
            "Brilakis insists on a distal SVC wire position because a wire that migrates into the right atrium can lead the cannula into an intracardiac structure and perforate it; poor distal wire position is also his explanation for a cannula lying against the septum. Reposition the wire first, then advance under fluoroscopy and stop at resistance.",
        },
        {
          kind: "steps",
          title: "Step 5: the arterial cannula",
          items: [
            { title: "Wire into the thoracic aorta", detail: "Pass a stiff guidewire through the common femoral artery up into the thoracic aorta." },
            { title: "Open the skin", detail: "Spread the skin entry with a haemostat." },
            {
              title: "Insert the cannula",
              detail:
                "15 Fr for most women and 17 Fr for most men, occasionally larger for a larger patient, inserted under fluoroscopy over the stiff wire. Do not push the wider proximal part of the cannula through the skin.",
            },
            { title: "Clamp", detail: "Clamp the back end of the cannula." },
          ],
        },
        {
          kind: "list",
          items: [
            "**If it will not advance:** check that the wire is where it should be and that it has not kinked or prolapsed; forcing the cannula can perforate the vessel.",
            "**What can go wrong:** a displaced arterial cannula can cause massive bleeding or a haematoma; blood can ooze around it; the vessel can be perforated.",
          ],
        },
        { kind: "tip", id: "mcs-ecmo-arterial-cannula" },
        {
          kind: "steps",
          title: "Steps 6 to 8: connect, start, perfuse the leg",
          items: [
            {
              title: "6. Make an air-free connection",
              detail:
                "Bring each cannula and its circuit tube together. An assistant runs saline over the joint so that cannula and tube are completely full, and you check that the connection holds no bubbles.",
            },
            { title: "7. Start", detail: "Remove the clamps, start the pump and watch the flows." },
            {
              title: "8. Feed the antegrade sheath",
              detail:
                "Clamp the circuit to prevent bleeding, let the antegrade sheath back-bleed to clear air from it, join it with a male-to-male connector to the arterial cannula's side port, then unclamp and restart.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Bubbles in the tubing (Brilakis 14.5.6)",
          head: ["", "What Brilakis advises"],
          rows: [
            ["Cause", "An imperfect connection"],
            ["Prevention", "Connect under a continuous dribble of saline; do not squeeze the tubing hard while connecting (air can enter when it is released); do not tighten the connections until all air is out"],
            ["Bubbles on the arterial side", "Remove them through the side port"],
            ["Bubbles on the venous side", "Small ones are cleared by the circuit; for larger ones, disconnect from the pump tubing and reconnect"],
            ["What can go wrong", "Thromboembolism; air embolism if connections are not secure and sealed; clotting of the circuit"],
          ],
        },
        { kind: "tip", id: "mcs-ecmo-wet-connection" },
        { kind: "tip", id: "mcs-ecmo-bubbles" },
        {
          kind: "check",
          stem: "As the arterial cannula is connected, you see a bubble in the arterial side of the joint. What does Brilakis advise?",
          options: [
            "Start the pump; the oxygenator will trap the bubble before it reaches the patient",
            "Remove the bubble through the side port before the clamps come off",
            "Tighten the connection hard so that no more air can enter, then start",
            "Squeeze the tubing firmly to push the bubble back towards the pump head",
          ],
          answer: 1,
          explanation:
            "Arterial-side bubbles are removed through the side port; only small venous-side bubbles are left for the circuit to clear. Tightening before the air is out and squeezing the tubing are exactly what his prevention advice says to avoid, and an arterial bubble goes to the patient, with the risk of air embolism.",
        },
        {
          kind: "p",
          text: "**Where Oxford differs.** Oxford describes VA-ECMO as one cannula in the femoral artery and one in the inferior vena cava through the femoral vein, whereas Brilakis takes the venous cannula tip up to the junction of the superior vena cava and right atrium over a wire in the superior vena cava. Oxford also separates VA-ECMO, which supports both heart and lungs, from veno-venous ECMO, with both cannulae in veins, which only oxygenates and is meant for isolated lung failure.",
        },
        {
          kind: "p",
          text: "**The evidence behind the limb rule.** Brilakis's thresholds come from a pilot study of 25 patients on femoral VA-ECMO monitored with leg near-infrared spectroscopy: all six with clinical leg ischaemia had saturations below 50% for more than four minutes, while five patients whose saturation dipped below 50% for less than four minutes had no ischaemia, so the threshold describes a sustained reading; and a difference of more than 15% between the legs was seen in every patient whose cannula obstructed flow to the leg and in none without obstruction. One false positive came from a very low venous saturation, so the number supports, but does not replace, examining the leg.",
        },
        { kind: "tip", id: "mcs-ecmo-leg-rescue" },
        {
          kind: "pitfalls",
          items: [
            "Both cannulae in one groin, congesting the leg.",
            "Skipping the femoral angiogram when there is time for it.",
            "Leaving limb perfusion until the leg is already ischaemic, or placing the antegrade sheath after the cannula when it could have gone first.",
            "A venous wire that has fallen back into the right atrium.",
            "Advancing a cannula against resistance, or without fluoroscopy.",
            "Pushing the wide proximal part of the arterial cannula through the skin.",
            "Dry connections, squeezed tubing and connections tightened before the air is out.",
          ],
        },
        {
          kind: "pearl",
          text: "Cannulate in the order that protects the patient later: the leg's perfusion sheath before the arterial cannula, the wire high in the superior vena cava before the venous cannula, and saline running over every joint before any clamp comes off.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Start the VA-ECMO scenario, then check the leg: read the leg NIRS against the other leg, and add the distal perfusion cannula if it is below 50% or more than 15% lower. State the cannulation order you would have used (right femoral vein, left femoral artery, antegrade sheath, heparin, venous then arterial cannula, wet connections, start, feed the antegrade sheath).",
        },
        { kind: "video", id: "7vfM7zRRmTk", note: "Brilakis: VA-ECMO cannulation (Manual of PCI, chapter 14)." },
        { kind: "video", id: "L6lKm8VZy4w", note: "Brilakis CTO case 29: retrograde CTO PCI with VA-ECMO support." },
        {
          kind: "keypoints",
          items: [
            "Venous access in the right femoral vein, arterial in the left femoral artery; avoid both in one groin (Brilakis), because the arterial cannula can compress the vein and congest the leg; femoral angiogram unless an emergency.",
            "Antegrade perfusion sheath (6 Fr, 24 cm) in the common or superficial femoral artery, before the arterial cannula when possible; ELSO recommends one above 17 Fr, and the Academy lesson places one at cannulation; without one, a sustained NIRS below 50% or more than 15% below the other leg calls for one.",
            "Heparin 70–100 units/kg (typical; local protocol).",
            "Venous: stiff wire distal in the SVC, 25 Fr cannula under fluoroscopy, tip at the SVC–right atrial junction; IJ route for thrombosis or an IVC filter.",
            "Arterial: stiff wire into the thoracic aorta, 15 Fr (women) or 17 Fr (men), wide proximal part outside the skin.",
            "Wet, bubble-free connections; arterial bubbles out through the side port; then clamps off, pump on, antegrade sheath connected to the arterial side port.",
            "Sizes differ between the sources (Oxford: venous 18–21 F, arterial 14–16 F, 3–7 L/min of cardiac output; Ortoleva's review: arterial 15–19 Fr, venous 21–25 Fr, distal perfusion catheter 5–8 Fr).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-devices-ecmo-run",
      title: "Running VA-ECMO: the loaded ventricle, venting, differential hypoxaemia and weaning",
      minutes: 18,
      topics: ["mcs-ecmo-management"],
      sources: [
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.5" },
        { book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "lusebrink-ecmo-venting-2023",
        "torre-harlequin-ecmo-2025",
        "ortoleva-vaecmo-review-2026",
        "geller-aha-tmcs-2022",
        "kim-early-unload-2023",
        "lim-early-unload-1year-2025",
        "park-evolve-ecmo-2023",
      ],
      blocks: [
        {
          kind: "p",
          text: "Both manuals stop at the start of the circuit. Brilakis warns that VA-ECMO raises left ventricular end-diastolic pressure and volume, and so myocardial oxygen demand, which could hinder recovery, and that it needs a perfusionist. Oxford sets out its drawbacks: the coronary arteries are poorly perfused, the ventricle can distend, systemic thromboembolism is more likely, anticoagulation has to be continuous, and management is more complex and needs a dedicated ECMO team. Its complications are listed in section 4 below. What follows the start, recognising and venting the loaded ventricle, differential hypoxaemia and the weaning trial, comes from three reviews checked for this module, two small randomised trials of early venting and the AHA statement as one review reports it; most of it rests on observational data and expert opinion, and your ECMO team's protocol decides the details.",
        },
        { kind: "h", text: "1. The loaded left ventricle" },
        {
          kind: "p",
          text: "Femoral VA-ECMO returns blood up the aorta towards the aortic valve. A ventricle with some function copes by raising its filling pressure and contracting harder. A badly damaged one cannot: its end-diastolic pressure rises, it dilates, mitral regurgitation and left atrial pressure increase, and pulmonary congestion follows. If its systolic pressure cannot exceed the aortic pressure the circuit produces, the aortic valve stops opening on every beat, and blood standing in the ventricle and aortic root can clot. A distended ventricle is prone to arrhythmia and to ischaemia of its inner wall, recovers less well and is harder to wean (venting review).",
        },
        {
          kind: "table",
          caption: "Signs that the ventricle is loaded (venting review; Ortoleva review)",
          head: ["Where to look", "Warning sign"],
          rows: [
            ["Arterial line", "Little or no pulsatility: Ortoleva calls for aggressive management at a pulse pressure of 10 mmHg or less and gives the usual target as above 10–15 mmHg. Low pulsatility can also be hypovolaemia, and the pulmonary artery catheter tells the two apart (low filling pressures point to volume, high ones to a failing ventricle)"],
            ["Echo", "Aortic valve not opening, left atrium or ventricle dilating, blood stasis in the cavity; the ECLS-SHOCK protocol also used an LV outflow tract velocity-time integral below 10 cm"],
            ["Pulmonary artery catheter", "Rising pulmonary artery or wedge pressure"],
            ["Chest X-ray and ventilator", "Pulmonary congestion or oedema"],
            ["Monitor", "Arrhythmias thought to come from the distension"],
          ],
        },
        {
          kind: "steps",
          title: "Treating it, least invasive first",
          items: [
            {
              title: "1. Lowest acceptable flow",
              detail: "Turn the circuit flow down to the lowest level that keeps the organs perfused, and remove fluid with diuretics or renal replacement therapy where needed (venting review). Ortoleva notes that for most patients on VA-ECMO, with or without a balloon pump, more circuit flow lowers the wedge by reducing preload; in one study it rose in only 6%. So not every patient needs a vent, but watch the ventricle that is already distending.",
            },
            {
              title: "2. Inotrope and PEEP",
              detail: "Ortoleva lists the prompt actions that arterial and pulmonary artery monitoring of a failing ventricle should trigger: volume removal, starting an inotrope, positive end-expiratory pressure (PEEP), and then mechanical unloading.",
            },
            {
              title: "3. Vent if the signs persist",
              detail:
                "Ortoleva vents when oedema persists after the less invasive measures, when the pulse pressure stays at 10 mmHg or below even with an inotrope and optimal filling, or when distension appears to be driving arrhythmias. A wedge of 18–20 mmHg seems a reasonable trigger, after less invasive measures; validated haemodynamic thresholds do not exist.",
            },
          ],
        },
        { kind: "tip", id: "mcs-ecmo-loaded-lv" },
        {
          kind: "check",
          stem: "Twelve hours into femoral VA-ECMO at 4.5 L/min after anterior infarction, the arterial pulse pressure is 4 mmHg, echo shows a dilating ventricle with the aortic valve no longer opening, and the wedge has risen to 27 mmHg. Dobutamine is not yet running. What is the most appropriate sequence?",
          options: [
            "Raise the circuit flow to 5.5 L/min so that the organs are protected from the low pulse pressure",
            "Lower flow to the minimum that perfuses, optimise volume, add an inotrope, then vent if it persists",
            "Stop the circuit for ten minutes to let the ventricle eject, then restart at the same flow",
            "Convert to veno-venous ECMO, which unloads the ventricle while still giving oxygen",
          ],
          answer: 1,
          explanation:
            "The ventricle is loaded: no pulsatility, a closed valve, dilation and a high wedge. The reviews put less invasive measures first (the lowest flow that perfuses, fluid removal, an inotrope, PEEP), with mechanical unloading when the signs persist. Raising flow lowers the wedge in most patients on VA-ECMO (Ortoleva), but in a ventricle that is already distending with a closed aortic valve more retrograde flow adds afterload (venting review), which is why the lowest flow that perfuses comes first here; stopping the circuit removes the support the patient depends on, and veno-venous ECMO provides no circulatory support at all.",
        },
        { kind: "h", text: "2. Choosing the vent" },
        {
          kind: "table",
          caption: "Venting options (venting review; Ortoleva Table 5)",
          head: ["Option", "How it unloads", "Points for", "Points against"],
          rows: [
            [
              "Balloon pump",
              "Indirectly, by lowering afterload in each cycle",
              "Small arteriotomy, can go in at the bedside, high-dose anticoagulation not needed, no LV-thrombus contraindication",
              "Needs some ventricular activity; its own pulsatility can make you think the valve is opening when it is not; contraindicated with dissection or significant aortic regurgitation",
            ],
            [
              "Microaxial pump (ECMO plus pump)",
              "Pumps blood directly from the ventricle into the aorta",
              "More powerful unloading; works without residual cardiac activity; Brilakis notes a pump already in place is often kept as the vent",
              "14 Fr arteriotomy; contraindicated with LV thrombus, a mechanical aortic valve, septal defects, significant aortic regurgitation or severe aortic stenosis; more haemolysis and bleeding",
            ],
            [
              "Transseptal left atrial drainage cannula",
              "Drains the left atrium into the venous limb",
              "No arterial access; usable with LV thrombus",
              "Transseptal puncture risks (effusion, perforation); needs reliable flow to avoid thrombosis",
            ],
            [
              "Atrial septostomy",
              "Passively lets the left atrium decompress into the right",
              "No arterial access; usable with LV thrombus",
              "Variable unloading; tamponade is a recognised complication; a defect remains and must be repaired at or before durable LVAD implantation (risk of right-to-left shunt), so avoid it in a patient being bridged to an LVAD",
            ],
            [
              "Pulmonary artery drainage",
              "Reduces blood returning to the left atrium",
              "No left atrial or ventricular manipulation, an option with LV thrombus",
              "Little comparative data",
            ],
            [
              "Ventricular drainage (pigtail across the valve, or surgical apical cannula)",
              "Drains the ventricle directly",
              "Surgical cannulae give high drainage flow",
              "A pigtail drains little; surgery means bleeding and thrombosis risks",
            ],
          ],
        },
        {
          kind: "p",
          text: "**How good is the evidence?** Two small randomised trials have tested routine early left atrial venting against venting only when distension appeared. EARLY-UNLOAD (116 patients) found no difference in 30-day mortality (46.6% against 44.8%) or at one year, and half of its conventional group needed rescue venting; EVOLVE-ECMO (60 patients) found no difference in successful weaning (70.0% against 76.7%). Pulmonary congestion cleared faster with early venting in both. No trial has tested the balloon pump or the microaxial pump as a vent. In an ELSO registry analysis Ortoleva cites (12,734 patients, 2010–2019), 26.7% were unloaded, 82.9% of them with a balloon pump; mortality was slightly lower with unloading (56.6% against 59.3%) but cannula-site bleeding and haemolysis were more frequent, and mortality did not differ between balloon pump and microaxial pump, the pump causing more bleeding and haemolysis. The propensity-matched analysis the venting review calls the best available evidence (255 pairs) found lower 30-day mortality with ECMO plus a microaxial pump than with ECMO alone (56.9% against 63.5%). Selection bias affects the registry analyses. Together the evidence supports venting when it is indicated rather than routinely, and choosing the vent from the patient's anatomy and bleeding risk, with the ECMO team.",
        },
        { kind: "tip", id: "mcs-ecmo-vent-choice" },
        {
          kind: "check",
          stem: "A patient on VA-ECMO after anterior infarction needs venting. Echo shows an apical left ventricular thrombus. Which vent is ruled out by that finding?",
          options: [
            "A balloon pump in the descending aorta",
            "A microaxial pump across the aortic valve",
            "A transseptal left atrial drainage cannula",
            "Drainage from the pulmonary artery",
          ],
          answer: 1,
          explanation:
            "LV thrombus contraindicates the microaxial pump (Oxford, Brilakis, and Ortoleva's table). The venting review notes that the balloon pump lacks that contraindication, which matters because anterior infarction carries the greatest risk of LV thrombus, and that left atrial and pulmonary artery drainage avoid manipulating the ventricle.",
        },
        { kind: "h", text: "3. Differential hypoxaemia" },
        {
          kind: "p",
          text: "With femoral cannulation, oxygenated circuit blood travels up the aorta and meets blood ejected by the patient's own ventricle at a mixing zone. If the lungs are failing, the native output is desaturated, and because the coronary arteries and the first arch branch are closest to the valve, the heart and brain receive that blood while the lower body gets well-oxygenated circuit blood. The mixing zone moves towards the legs as the ventricle recovers and as circuit flow is reduced. A microaxial pump ejecting into the ascending aorta acts like a stronger native ventricle and can make it worse (Harlequin review).",
        },
        {
          kind: "p",
          text: "**How low is too low?** The Harlequin review notes that an upper-body arterial saturation of about 80% has not been shown to harm cognition at long-term follow-up, provided circuit flow and haemoglobin are adequate. The fulminant form, with upper-body saturations of 30–50% or below the pre-oxygenator saturation, is the emergency. Act on lower or falling values, falling forehead NIRS, or signs of cerebral or myocardial ischaemia (agitation, seizures, arrhythmia, ST elevation, rising lactate).",
        },
        {
          kind: "steps",
          title: "Detect and manage (Harlequin review; Ortoleva)",
          items: [
            {
              title: "Monitor where the brain is supplied",
              detail:
                "A right radial arterial line and right-hand pulse oximetry, because the brachiocephalic trunk is the first arch branch after the coronary ostia; forehead near-infrared spectroscopy adds a continuous measure of cerebral oxygenation. Ortoleva also recommends a pulmonary artery catheter. A reassuring right radial value does not exclude coronary hypoxaemia: if the mixing zone lies proximal to the right subclavian origin, only the coronary arteries receive the desaturated blood. Ortoleva suggests considering this, as a diagnosis of exclusion, when the ventricle is not recovering despite reassuring right-arm values in a patient with lung disease; one possible check is to drop the circuit flow to 1–2 L/min for less than a minute, which moves the mixing zone beyond the right subclavian, and draw an arterial gas.",
            },
            {
              title: "Confirm it",
              detail: "Right radial saturation and PO2 lower than the left radial and femoral values. Echo can help show where the mixing zone lies and how the ventricle is recovering.",
            },
            {
              title: "Temporise",
              detail:
                "Increase circuit flow to push the mixing zone towards the heart (the Harlequin review's table aims for 4.5–5 L/min where possible); optimise the ventilator (inspired oxygen, PEEP, recruitment), remembering that high inspired oxygen risks ventilator-induced lung injury and oxygen toxicity; reduce the competing output (lower the inotropes, give a negative inotrope such as a beta-blocker, or turn down the microaxial pump's flow in ECMO plus pump). These are holding measures: more flow raises afterload, and prolonged use may impair recovery.",
            },
            {
              title: "Reconfigure if it persists",
              detail:
                "Add a return cannula into the superior vena cava through the jugular vein (veno-arteriovenous ECMO), move drainage to the superior vena cava, use central or subclavian arterial return, or convert to veno-venous ECMO once the heart has recovered.",
            },
          ],
        },
        { kind: "tip", id: "mcs-ecmo-right-radial" },
        {
          kind: "check",
          stem: "On day 3 of femoral VA-ECMO the ventricle is ejecting again. The right radial saturation has fallen over the morning from 90% to 74%, with the left radial at 93% and the femoral arterial at 99%; forehead NIRS is falling and the chest X-ray shows widespread oedema. What is happening and what is the first step?",
          options: [
            "Oxygenator failure: change the oxygenator before anything else",
            "Lung failure with native ejection: optimise ventilation and raise circuit flow for now",
            "A faulty right radial line: resite it, since the femoral saturation is normal",
            "Recirculation through the venous cannula: pull the venous cannula back",
          ],
          answer: 1,
          explanation:
            "A right radial value far below the left radial and femoral values, with a recovering ventricle and oedematous lungs, is differential hypoxaemia: the native output is desaturated and supplies the brachiocephalic trunk first. The holding measures are ventilator optimisation and more circuit flow to move the mixing zone proximally; persisting hypoxaemia leads to reconfiguration such as a jugular return cannula. A failing oxygenator would desaturate the femoral blood too. A value around 80% with adequate flow and haemoglobin would not by itself need action; here it is lower, still falling and accompanied by falling cerebral oximetry.",
        },
        { kind: "h", text: "4. The circuit and anticoagulation" },
        {
          kind: "list",
          items: [
            "**Gas settings.** Sweep gas flow (generally 1–10 L/min) removes carbon dioxide; the delivered oxygen fraction can be set from 0.21 to 1.0. Avoid rapid swings in carbon dioxide, which have been linked to neurological complications (Ortoleva).",
            "**Oxygenator checks.** Pre- and post-oxygenator gases should show the oxygen rising and carbon dioxide falling across it; watch the pressure drop across the oxygenator and look for clot. Failure of either oxygenation or carbon dioxide removal is a reason to change it (Ortoleva).",
            "**Anticoagulation.** Ortoleva reports an ELSO recommendation of unfractionated heparin to an anti-Xa level of 0.3–0.7 units/mL; your unit's protocol decides. Oxford lists continuous anticoagulation as a requirement and a contraindication to it as a contraindication to ECMO. Brilakis notes that VA-ECMO, like the balloon pump, can be run without anticoagulation for a short time in a patient who is actively bleeding.",
            "**Complications to look for every day.** From Oxford's list: bleeding; limb ischaemia and compartment syndrome; vascular trauma; haemolysis; acute kidney injury; infection; thrombus and air embolism; neurological injury.",
          ],
        },
        { kind: "h", text: "5. The weaning trial" },
        {
          kind: "steps",
          title: "One approach, from Ortoleva's review, with the AHA scientific statement (Geller and colleagues) as the review reports it",
          items: [
            {
              title: "1. Is the cause fixed?",
              detail:
                "Wean only once the cause of shock has been addressed (revascularisation, volume optimisation, treatment of myocarditis and so on) and recovery is seen on invasive haemodynamics and echo on low vasoactive doses. A negative fluid balance in the days before is recommended, and the AHA statement asks for suitability for weaning to be assessed every day once the haemodynamics are stable.",
            },
            {
              title: "2. Are the lungs ready?",
              detail: "Adequate gases with inspired oxygen of 60% or less and lung-protective settings; the AHA statement asks for a PaO2:FiO2 ratio of at least 200.",
            },
            {
              title: "3. Anticoagulate for low flow",
              detail: "Low circuit flow increases the risk of thrombosis, so increase anticoagulation according to the institutional protocol before turning down.",
            },
            {
              title: "4. Step the flow down",
              detail:
                "The AHA statement reduces flow by 0.5–1 L/min at a time until 1–2 L/min, either quickly (every 5–15 minutes) or gradually (every 2–4 hours). One strategy holds 2 L/min for several hours, then 1 L/min for 10–15 minutes while haemodynamics and respiratory function are assessed, then restores flow.",
            },
            {
              title: "5. Judge the trial",
              detail:
                "At minimal flow, the AHA targets are a CVP below 10–15 mmHg, a wedge below 18 mmHg, a MAP of at least 65 mmHg and a lactate of 2 mmol/L or less on minimal vasoactive support. Other published cut-offs include a cardiac index of 2.2 L/min/m² with a CVP of 12 mmHg or less at a circuit flow of no more than 1 L/min for at least 10 minutes, and a wedge of 15 mmHg or less on no more than one inotrope or vasopressor at moderate doses. Practice varies, and some patients, for example with chronic heart failure, are weaned at different values.",
            },
            {
              title: "6. Decide together",
              detail: "Decannulation is a joint decision; a balloon pump or microaxial pump already in place is usually continued, or escalated, through the wean. For a tenuous patient Ortoleva describes keeping the circuit recirculating on itself, with the cannulae flushed, so that flow can be restarted at once if the patient deteriorates.",
            },
          ],
        },
        { kind: "tip", id: "mcs-ecmo-wean-trial" },
        {
          kind: "check",
          stem: "During a weaning trial at 1.5 L/min on low-dose noradrenaline, a patient has a MAP of 70 mmHg, CVP 9 mmHg, wedge 24 mmHg and lactate 1.6 mmol/L, with a PaO2:FiO2 ratio of 260. Which value fails the AHA targets?",
          options: ["The MAP", "The CVP", "The wedge pressure", "The lactate"],
          answer: 2,
          explanation:
            "The AHA statement (as reported in the review) aims for a CVP below 10–15 mmHg, a wedge below 18 mmHg, a MAP of at least 65 mmHg and a lactate of 2 mmol/L or less on minimal support, with a PaO2:FiO2 of at least 200. A wedge of 24 mmHg means the left side is not yet coping at low flow.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading gases from the left radial or femoral line in femoral VA-ECMO, which can look reassuring while the brain is hypoxaemic; and taking a normal right radial value as proof that the coronary arteries are well oxygenated.",
            "Raising circuit flow to fix a low pulse pressure in a ventricle that is already distending.",
            "Venting every patient by reflex: more flow lowers the wedge in most patients (it rose in only 6% in one study), routine early venting did not improve outcomes in two small trials, and vents add bleeding and haemolysis.",
            "Choosing a microaxial pump as the vent in a patient with LV thrombus.",
            "Taking the balloon pump's artificial pulsatility as proof that the aortic valve is opening.",
            "Turning the flow down for a weaning trial without first increasing anticoagulation.",
          ],
        },
        {
          kind: "pearl",
          text: "Every shift on VA-ECMO, ask three questions in order: is the ventricle ejecting (pulse pressure, echo), is the upper body oxygenated (right radial), and is the leg perfused (NIRS)? Each has its own fix, and each can be missed while the circuit flow looks perfect.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Run the LV distension scenario: note the pulse pressure, wedge and LVEDP, reduce circuit flow to the lowest that keeps the MAP up, then add a vent and confirm that the pulse pressure returns. Then, in the lung failure scenario, compare the right radial and femoral saturations, name differential hypoxaemia, and state the holding measures and the reconfiguration you would ask for.",
        },
        { kind: "video", id: "8EVIE9opOy0", note: "Brilakis CTO case 67: CTO PCI supported by VA-ECMO." },
        {
          kind: "keypoints",
          items: [
            "VA-ECMO raises LV end-diastolic pressure and volume and oxygen demand (Brilakis); Oxford lists poor coronary perfusion and ventricular distension among its drawbacks.",
            "Loaded LV: pulse pressure of 10 mmHg or less, closed aortic valve, dilating LV or LA, stasis, rising wedge or PA pressure, oedema, arrhythmia.",
            "Least invasive first: lowest perfusing flow, fluid removal, inotrope, PEEP; then vent (wedge 18–20 mmHg a reasonable trigger after these).",
            "Vents: balloon pump (commonest, no LV-thrombus contraindication), microaxial pump (strongest, more haemolysis and bleeding), left atrial drainage, septostomy, PA drainage, LV drainage; routine early left atrial venting did not help in two small RCTs, so vent when indicated.",
            "Differential hypoxaemia: right radial low, femoral high; about 80% with adequate flow and haemoglobin is tolerated; ventilate, raise flow, reduce competing output for now; reconfigure (jugular return, SVC drainage, central return, or VV once the heart recovers). A normal right radial does not exclude coronary hypoxaemia.",
            "Oxford's ECMO complications: bleeding, haemolysis, AKI, infection, neurological injury, thrombus or air embolism, vascular trauma, limb ischaemia and compartment syndrome.",
            "Wean once the cause is fixed and lungs allow: more anticoagulation, steps of 0.5–1 L/min to 1–2 L/min, targets CVP below 10–15, wedge below 18, MAP 65 or more, lactate 2 or less.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-support-devices-q1",
      stem: "A 190 cm man needs a balloon pump. Which statement agrees with both manuals?",
      options: [
        "A 40 mL balloon, the size the two manuals give for all adults whatever their height",
        "A 50 mL balloon; both charts give it above 182–183 cm, but use the device's own chart",
        "A 34 mL balloon, because a smaller balloon avoids covering the renal arteries in tall men",
        "A 25 mL balloon, as balloon volume is chosen by body weight rather than by height",
      ],
      answer: 1,
      explanation:
        "Brilakis's Table 14.2 gives 50 cc above 182 cm and the manufacturer chart in Oxford gives 50 mL above 183 cm; both size by height, and the chart supplied with your balloons is the final word. 40 mL is for average heights in both charts; 34 and 25 mL are for shorter patients in Oxford's chart.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-support-devices-q2",
      stem: "Brilakis lists causes of poor augmentation (the mean pressure does not rise) and of poor afterload reduction. Which cause appears only in the afterload list?",
      options: [
        "Wrong inflation timing for the patient's heart rate",
        "A balloon that is in the wrong position in the aorta",
        "A partly obstructed gas lumen in the catheter",
        "Hypovolaemia with a small left ventricular stroke volume",
      ],
      answer: 2,
      explanation:
        "His poor-afterload list is incomplete filling of the balloon, a compliant aortic wall, malposition, a partly obstructed gas lumen and timing. Timing and position appear in both lists (as low position and timing under augmentation); hypovolaemia appears only under poor augmentation.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-devices-q3",
      stem: "A patient with a balloon pump develops a retroperitoneal bleed and heparin is stopped. The ECG trigger then fails and pumping stops. How long can the balloon stay still in the aorta?",
      options: [
        "Up to 10–15 minutes: if pumping cannot restart by then, the balloon must come out",
        "Up to about 2 hours, provided the balloon is fully deflated while it is stationary",
        "As long as it takes to restart, because a deflated balloon cannot form any clot",
        "Up to 30 minutes, since stopping heparin has made thrombus on the balloon less likely",
      ],
      answer: 0,
      explanation:
        "Oxford gives 10–15 minutes to resume pumping after a failure, otherwise the balloon is removed, because a static balloon can form clot and embolise distally. Once pumping restarts without heparin, Brilakis runs it at 1:1 to reduce thrombus formation. Stopping heparin increases the thrombus risk, it does not lower it.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-support-devices-q4",
      stem: "Crossing the aortic valve for a microaxial pump, the pigtail will not pass a calcified, stenotic valve. Which step is in Brilakis's troubleshooting?",
      options: [
        "Exchange the pigtail for a straight-tipped multipurpose catheter and probe with a hydrophilic wire",
        "Stiffen the pigtail with a 0.035 inch J-wire; balloon dilation of the valve may be needed",
        "Load the pump on a 0.014 inch wire left in the aortic root and let the pump cross by itself",
        "Abandon the femoral route and insert the pump through the axillary artery at the same sitting",
      ],
      answer: 1,
      explanation:
        "For aortic stenosis Brilakis stiffens the pigtail with a 0.035 inch J-wire and notes that balloon dilation of a stenotic valve may be needed. He prefers the pigtail over Amplatz or multipurpose catheters for crossing, and the pump travels over a wire already in the ventricle. Oxford reminds you that severe aortic stenosis contraindicates the pump.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-support-devices-q5",
      stem: "The red loading lumen of the microaxial pump was thrown away before loading. How does Brilakis load the pump on the 0.018 inch wire?",
      options: [
        "Thread the wire into the pigtail tip without the lumen, advancing it until it exits near the label",
        "Backload it so the wire exits the outlet on the cannula's inner curve, in line with the black line",
        "Take a new pump, because a pump cannot be loaded at all without its red loading lumen",
        "Load it on a 0.035 inch wire instead, which is stiff enough to pass through the pigtail tip",
      ],
      answer: 1,
      explanation:
        "When the red lumen is missing (removed by mistake, or a pump being reinserted), Brilakis backloads the pump onto the back end of the wire, which has to emerge at the outlet on the inner radius of the cannula, aligned with the straight black line. A new pump is his remedy for a different problem: a fractured red tube left inside the device.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-devices-q6",
      stem: "Midway through a protected PCI the microaxial pump controller shows a ventricular waveform. What does this mean and what do you do?",
      options: [
        "The pump has migrated into the aorta; advance it under fluoroscopy",
        "The pump is too deep in the ventricle; pull it back",
        "The patient is hypovolaemic; reduce the level by one or two steps and give fluid",
        "The right ventricle is failing; start right-sided support",
      ],
      answer: 1,
      explanation:
        "Brilakis expects an aortic waveform on the controller; a ventricular waveform means the catheter should be pulled back. A pump that has come out into the aorta does not give a ventricular waveform, and hypovolaemia or RV failure show themselves as suction alarms.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-devices-q7",
      stem: "Which of these is NOT one of Brilakis's three causes of a suction alarm on a microaxial pump?",
      options: [
        "Hypovolaemia",
        "Right ventricular failure",
        "The cannula lying under the papillary muscles",
        "A battery that is running out",
      ],
      answer: 3,
      explanation:
        "Suction comes from hypovolaemia, RV failure or a cannula under the papillary muscles. A failing battery is among the causes of the pump stopping, with device malfunction and thrombus; prevention there is to keep the console plugged in.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-devices-q8",
      stem: "During femoral VA-ECMO cannulation, why does Brilakis place the venous cannula from the right femoral vein and the arterial cannula in the left femoral artery?",
      options: [
        "The left femoral artery is larger, and the right vein avoids crossing the right iliac artery",
        "The right vein gives an easier path to the right atrium, and separate groins avoid venous congestion",
        "The left artery allows a shorter cannula to reach the aortic arch than the right artery would",
        "Separate groins let both cannulae be removed at once without interrupting circuit flow",
      ],
      answer: 1,
      explanation:
        "Brilakis uses the right femoral vein because the venous cannula advances more easily to the right atrium, and he keeps the arterial cannula in the other groin because a large arterial cannula can collapse the adjacent femoral vein and congest the leg.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-devices-q9",
      stem: "A patient is on femoral VA-ECMO through a 17 Fr arterial cannula with no antegrade sheath. Leg NIRS reads 55% on the cannulated side and 74% on the other. What does Brilakis's rule say?",
      options: [
        "No sheath is needed, because the cannulated leg is above 50%",
        "Place an antegrade perfusion sheath, because the difference is more than 15%",
        "Exchange for a 15 Fr cannula, which never needs an antegrade sheath",
        "Raise the circuit flow until the cannulated leg reads above 60%",
      ],
      answer: 1,
      explanation:
        "Brilakis calls for an antegrade perfusion catheter if the tissue saturation is below 50% or more than 15% lower than the uncannulated leg. Here the absolute value is above 50% but the gap is 19 percentage points, so a sheath is needed. Smaller cannulae may not need one, but the reading decides, and the study behind the rule found a gap of more than 15% in every patient whose cannula obstructed flow to the leg.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "patton-rivera-nirs-ecmo-2018"],
    },
    {
      id: "pm-support-devices-q10",
      stem: "A patient on femoral VA-ECMO with a microaxial pump as the LV vent has severe lung injury. The right radial saturation falls as the pump's flow is increased. Why?",
      options: [
        "The pump draws oxygenated circuit blood out of the aortic root and back into the ventricle",
        "The pump ejects desaturated ventricular blood into the ascending aorta, supplying the arch first",
        "The pump causes haemolysis, and free haemoglobin lowers the oximeter reading falsely",
        "The pump lowers the left atrial pressure, which reduces flow through the oedematous lungs",
      ],
      answer: 1,
      explanation:
        "Like a recovering native ventricle, the pump ejects blood that has passed through failing lungs into the ascending aorta, where the coronary arteries and brachiocephalic trunk receive it before retrograde circuit blood. More pump flow pushes the mixing zone further from the heart. The Harlequin review lists reducing the pump's flow as a temporising measure, with reconfiguration if hypoxaemia persists.",
      difficulty: 3,
      refs: ["torre-harlequin-ecmo-2025"],
    },
    {
      id: "pm-support-devices-q11",
      stem: "On femoral VA-ECMO the arterial pulse pressure is 6 mmHg despite dobutamine and optimised volume, and pulmonary oedema is worsening. Echo shows no LV thrombus. Which statement fits the evidence on venting?",
      options: [
        "Vent with any device: randomised trials have shown that venting lowers mortality on VA-ECMO",
        "Vent: registry data link unloading to slightly lower mortality but more bleeding and haemolysis",
        "Do not vent: after infarction venting reduces coronary perfusion and so harms the recovering LV",
        "Do not vent: raise the circuit flow instead, because a higher flow always lowers the wedge pressure",
      ],
      answer: 1,
      explanation:
        "A pulse pressure of 10 mmHg or less despite inotropes and volume, with oedema that cannot be handled less invasively, meets Ortoleva's indications. In the ELSO registry most unloading used a balloon pump, mortality was slightly lower with unloading but bleeding and haemolysis were more frequent, and small randomised trials of routine early venting showed no mortality benefit, which supports venting when it is indicated, as here. More flow lowers the wedge in most patients, but not in all, and in a ventricle already failing to eject it adds afterload.",
      difficulty: 3,
      refs: ["ortoleva-vaecmo-review-2026", "lusebrink-ecmo-venting-2023", "kim-early-unload-2023", "park-evolve-ecmo-2023"],
    },
  ],
  sims: [
    { sim: "iabp", task: "Name the 1:2 landmarks A to E, correct the timing until C is above B, D below A and E below B, then wean from 1:1 to 1:2 and 1:3." },
    { sim: "impella", task: "Position the inlet about 3.5 cm below the valve with an aortic placement signal, then handle a suction alarm by lowering the level, judging volume from the RA pressure and correcting the position." },
    { sim: "ecmo", task: "Check the leg NIRS and add a distal perfusion cannula when indicated; recognise LV distension and vent; recognise differential hypoxaemia on the right radial saturation." },
  ],
  caseIds: ["pm-support-devices-case-impella", "pm-support-devices-case-ecmo"],
};

export const cases: CaseStudy[] = [
  {
    id: "pm-support-devices-case-impella",
    title: "Putting in and running a microaxial pump for left main PCI",
    trackId: "pci-manual",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 14.4 (inserting a microaxial pump), 14.1 and 14.2; Oxford Handbook, chapter 9 (Impella)",
    },
    summary: "Inserting a microaxial pump for protected left main PCI: crossing a calcified valve, a lost loading tube, iliac resistance, a suction alarm, a ventricular waveform and the end of the case.",
    presentation:
      "A 76-year-old man with an ejection fraction of 25% and a distal left main bifurcation lesion. The heart team has chosen PCI with upfront support by a microaxial pump. Echo shows a calcified aortic valve with mild-to-moderate stenosis, no LV thrombus and no aortic regurgitation. The 14 Fr peel-away sheath is in the right femoral artery after a pre-close with two sutures, the leg angiogram is satisfactory and the ACT is 280 seconds.",
    findings: [
      "Blood pressure 104/66 mmHg, heart rate 88/min, sinus rhythm",
      "RA pressure 7 mmHg, wedge 24 mmHg",
      "Femoral angiogram: right common femoral artery 7 mm; moderate tortuosity and calcification of the right external iliac artery; the left iliac system more diseased",
    ],
    steps: [
      {
        id: "s1",
        prompt: "You need a stiff wire in the left ventricle for the pump. How do you cross the aortic valve?",
        options: [
          {
            text: "A pigtail into the root and across the valve, then a 260 cm stiff 0.018 inch wire into the ventricle",
            best: true,
            feedback: "Brilakis crosses with a pigtail because it is less likely than an Amplatz or multipurpose catheter to go behind a papillary muscle, then leaves a long stiff 0.014 or 0.018 inch wire in the ventricle.",
          },
          {
            text: "An AL1 and a straight wire, which crossed quickly in your last valve case",
            next: "c-subvalvular",
            feedback: "It crosses, but Brilakis prefers a pigtail because Amplatz and multipurpose catheters can take the wire behind a papillary muscle, and a pump there causes suction.",
            stateDelta: { stability: -5, flags: ["subpapillary"] },
          },
        ],
      },
      {
        id: "c-subvalvular",
        kind: "consequence",
        prompt: "Fluoroscopy and echo suggest the wire has gone between the papillary muscles rather than into the open cavity. What now?",
        options: [
          {
            text: "Withdraw, recross with a pigtail and replace the wire through it",
            best: true,
            feedback: "Recrossing with a pigtail gives the pump a path into the open cavity; a cannula under the papillary muscles is one of Brilakis's three causes of suction.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept the wire and load the pump; position can be adjusted later",
            feedback: "Correcting the position later means moving a running pump; the suction it causes will cost flow when you need it most.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The pigtail catches on the calcified valve and will not cross into the ventricle. What does Brilakis suggest?",
        options: [
          {
            text: "Stiffen the pigtail with a 0.035 inch J-wire inside it and try again",
            best: true,
            feedback: "That is his treatment for difficulty crossing a stenotic valve with the pigtail; balloon dilation of the valve may be needed if it is stenotic enough. Oxford reminds you that severe stenosis contraindicates the pump, which is not the case here.",
          },
          {
            text: "Push the pump itself across over a wire left in the aortic root",
            feedback: "The pump travels over a wire already in the ventricle; pushing it against a calcified valve without a rail risks the valve and the aorta.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Abandon the pump and use a balloon pump instead",
            acceptable: true,
            feedback: "Reasonable if crossing truly fails, but Brilakis's first step is to stiffen the pigtail; the balloon pump gives much less support for this procedure.",
          },
        ],
      },
      {
        id: "s3",
        prompt: "The technician has purged the pump. As you are about to load it, you see that the red loading lumen has already been pulled out and discarded. What do you do?",
        options: [
          {
            text: "Backload the pump on the back end of the wire, with the wire leaving the outlet on the inner curve along the black line",
            best: true,
            feedback: "Brilakis's remedy when the red lumen is unavailable is to backload, with the wire exiting the outlet on the inner radius of the cannula, along the straight black line.",
          },
          {
            text: "Thread the wire into the pigtail tip without the lumen",
            feedback: "Brilakis backloads instead.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Open a new pump",
            acceptable: true,
            feedback: "It works but costs a device; Brilakis reserves a new pump for a red tube fractured and retained inside the pump.",
          },
        ],
      },
      {
        id: "s4",
        prompt: "The assistant holds the wire and you pass the pump briskly through the sheath. In the right external iliac artery it stops advancing.",
        options: [
          {
            text: "Do not force it: exchange for the long peel-away sheath, or treat the iliac with angioplasty or lithotripsy",
            best: true,
            feedback: "Brilakis's options for iliac resistance are the long peel-away sheath (sometimes the short one), iliac balloon angioplasty and intravascular lithotripsy for heavy calcium. You already used the less diseased side.",
          },
          {
            text: "Push harder: the pump's pigtail protects the vessel wall",
            next: "c-iliac",
            feedback: "Forcing a large device through a calcified, tortuous iliac artery risks dissection or perforation.",
            stateDelta: { stability: -20, flags: ["iliac-injury"] },
          },
        ],
      },
      {
        id: "c-iliac",
        kind: "consequence",
        prompt: "The pump passes with a jolt. A contrast injection through the sheath side arm shows a dissection flap in the external iliac artery with preserved flow. The blood pressure is stable.",
        options: [
          {
            text: "Stop, involve the vascular team, and treat the iliac before continuing",
            best: true,
            feedback: "Forcing a large device through a diseased iliac risks dissection or perforation (Brilakis gives the same warning for VA-ECMO cannulae). Involving the vascular team and treating the iliac before the coronary work is local practice; neither manual covers an iliac dissection under the pump.",
          },
          {
            text: "Carry on with the PCI and look at the iliac at the end",
            feedback: "An evolving iliac injury under a large sheath in an anticoagulated patient can bleed or occlude while your attention is on the left main.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The pump is in. Before pressing start, what do you confirm?",
        variants: [{ flag: "iliac-injury", info: "The iliac injury has been treated by the vascular team and flow down the leg is preserved." }],
        options: [
          {
            text: "Inlet about 3.5 cm below the valve, the 0.018 inch wire out, and an aortic waveform on the controller",
            best: true,
            feedback: "Brilakis's step 9: position, wire removed, aortic waveform, then start and watch the flow (automatic mode is usually used in the laboratory).",
          },
          {
            text: "Only that flow appears once it starts; the waveform can be checked later",
            feedback: "Starting with the wire in or the pump in the wrong place defeats the purpose; the checks take seconds.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "During the second balloon inflation in the left main, the pump alarms for suction and the flow falls. RA pressure is 3 mmHg; fluoroscopy shows no change in pump position.",
        variants: [{ flag: "subpapillary", info: "Echo now suggests the inlet is close to the papillary muscles." }],
        options: [
          {
            text: "Lower the performance level by one or two steps, give fluid, check and correct the position",
            best: true,
            feedback: "Brilakis's treatment for suction: reduce the level by 1 or 2, fluid for hypovolaemia (an RA of 3 mmHg fits), correct the position, and support the RV if it is failing.",
          },
          {
            text: "Increase the performance level to restore the flow",
            next: "c-suction",
            feedback: "More speed with too little blood in the ventricle worsens suction.",
            stateDelta: { stability: -15, flags: ["suction-worse"] },
          },
        ],
      },
      {
        id: "c-suction",
        kind: "consequence",
        prompt: "The alarm becomes continuous, the flow drops further and runs of ventricular ectopy appear. What now?",
        options: [
          {
            text: "Turn the level down, give fluid, and check the position on fluoroscopy and echo",
            best: true,
            feedback: "Back to Brilakis's sequence. Prevention next time: optimise volume while keeping the RA pressure below 10 mmHg.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Start right-sided support",
            feedback: "The RA pressure is low: this is underfilling, not RV failure.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "After the final kissing inflation the controller shows a ventricular waveform.",
        options: [
          {
            text: "Pull the pump back under fluoroscopy until the waveform is aortic",
            best: true,
            feedback: "A ventricular waveform means the pump is too deep; Brilakis pulls it back.",
          },
          {
            text: "Advance the pump, as it has probably slipped out into the aorta",
            feedback: "A pump in the aorta does not show a ventricular waveform; advancing makes it worse.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s8",
        prompt: "The result is good and the patient is stable at the end of the PCI. Support is no longer needed. How do you remove the pump?",
        options: [
          {
            text: "Wean slowly to P2, pull into the aorta, stop and disconnect, remove it quickly, then take the sheath out and tighten the sutures",
            best: true,
            feedback: "Brilakis's step 12. Speed matters when the outlet leaves the sheath with the inlet still inside; a balloon in the iliac from the other groin can help haemostasis while you tie.",
          },
          {
            text: "Stop the pump in the ventricle and pull pump and sheath out together",
            next: "c-removal",
            feedback: "A stopped pump left across the valve allows regurgitation, and the pump is removed through the sheath before the sheath comes out over the pre-placed sutures.",
            stateDelta: { stability: -10, flags: ["removal-bleed"] },
          },
        ],
      },
      {
        id: "c-removal",
        kind: "consequence",
        prompt: "As pump and sheath come out together, the groin bleeds briskly and the blood pressure falls to 86/54 mmHg.",
        options: [
          {
            text: "Hold pressure, tighten the pre-placed sutures, and inflate a balloon in the iliac artery from the other groin if bleeding continues",
            best: true,
            feedback: "Brilakis tightens the pre-close sutures after the sheath is out and uses a contralateral iliac balloon to reduce bleeding and help haemostasis.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give fluid and wait for the bleeding to slow by itself",
            feedback: "A large-bore arteriotomy will not seal by itself in an anticoagulated patient; the sutures and, if needed, an iliac balloon control it.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The left main bifurcation was treated with the pump running, the pump was removed in the laboratory and the pre-placed sutures gave haemostasis. The leg was well perfused on the ward.",
    outcomeVariants: [
      { flag: "iliac-injury", text: "The iliac dissection caused by forcing the pump needed treatment by the vascular team and lengthened the procedure." },
      { flag: "suction-worse", text: "Raising the performance level during suction caused ventricular ectopy and a period of low flow during left main ischaemia." },
      { flag: "removal-bleed", text: "Pulling pump and sheath out together caused a brisk groin bleed that needed the sutures and an iliac balloon to control." },
    ],
    learningPoints: [
      "Cross the valve with a pigtail and leave a 260 cm stiff 0.014 or 0.018 inch wire in the ventricle; stiffen the pigtail with a 0.035 inch J-wire for a stenotic valve.",
      "If the red loading lumen is gone, backload with the wire leaving the outlet on the inner curve along the black line.",
      "Iliac resistance: long (or short) peel-away sheath, angioplasty or lithotripsy, never force.",
      "Start only with the inlet about 3.5 cm below the valve, the wire out and an aortic waveform.",
      "Suction: level down by 1–2, fluid if dry, correct the position, support the RV if failing. A ventricular waveform: pull back.",
      "Removal: wean to P2, into the aorta, off, out quickly, tighten the sutures.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-support-devices-case-ecmo",
    title: "VA-ECMO in the laboratory: cannulation to weaning",
    trackId: "pci-manual",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 14.5 (cannulating for VA-ECMO), 14.2 and 28.1; Oxford Handbook, chapter 9 (ECMO); with the venting, differential hypoxaemia and VA-ECMO reviews cited in this module",
    },
    summary: "Femoral VA-ECMO for refractory shock after anterior infarction: groins, limb perfusion, the venous wire, an air-free connection, the loaded ventricle, differential hypoxaemia and the weaning trial.",
    presentation:
      "A 58-year-old woman with anterior STEMI. After PCI of a proximal LAD occlusion she remains in shock despite noradrenaline and dobutamine, with recurrent ventricular tachycardia. The shock team decides on femoral VA-ECMO in the laboratory. She is intubated; a perfusionist is present and the circuit is primed.",
    findings: [
      "Blood pressure 72/50 mmHg on two drugs, lactate 7.8 mmol/L",
      "Echo: severely impaired LV, no LV thrombus, no aortic regurgitation",
      "Both femoral arteries 7 mm on ultrasound",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Where do you place the cannulae?",
        options: [
          {
            text: "Venous from the right femoral vein, arterial in the left femoral artery",
            best: true,
            feedback: "Brilakis: the right femoral vein gives an easier path to the right atrium, and separate groins avoid compression of the vein by the arterial cannula.",
          },
          {
            text: "Both in the right groin to keep one sterile field",
            next: "c-same-groin",
            feedback: "A large arterial cannula next to the femoral vein can collapse it and congest the leg.",
            stateDelta: { stability: -10, flags: ["same-groin"] },
          },
        ],
      },
      {
        id: "c-same-groin",
        kind: "consequence",
        prompt: "The attending stops you before the arterial cannula goes in beside the venous sheath. What do you change?",
        options: [
          {
            text: "Move the arterial access to the left common femoral artery",
            best: true,
            feedback: "Separate groins, as Brilakis teaches.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep both in the right groin and use a smaller arterial cannula",
            feedback: "A smaller cannula does not remove the problem of compressing the adjacent vein.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "She is unstable but not in arrest. When do you place the antegrade perfusion sheath for the left leg?",
        options: [
          {
            text: "Now, before the arterial cannula, under ultrasound with a micropuncture needle",
            best: true,
            feedback: "Brilakis prefers it before the arterial cannula, which can get in the way; in more urgent cases it can follow once the circuit runs.",
          },
          {
            text: "Only if the leg looks ischaemic later",
            next: "c-leg",
            feedback: "Waiting turns prevention into rescue; NIRS can tell you early.",
            stateDelta: { stability: -10, flags: ["leg-ischaemia"] },
          },
        ],
      },
      {
        id: "c-leg",
        kind: "consequence",
        prompt: "Two hours after starting ECMO, the left leg NIRS has read 38% for the last 20 minutes against 69% on the right, and the foot is cold.",
        options: [
          {
            text: "Place an antegrade perfusion sheath and connect it to the arterial cannula's side port",
            best: true,
            feedback: "A sustained reading below 50%, or more than 15% lower than the other leg, calls for an antegrade perfusion catheter (Brilakis, from the NIRS pilot study he cites).",
            stateDelta: { stability: 10 },
          },
          {
            text: "Raise the circuit flow to perfuse the leg better",
            feedback: "The problem is the cannula obstructing flow down the leg; Brilakis's remedy is an antegrade perfusion catheter, not more circuit flow.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Heparin 70–100 units/kg has been given. On fluoroscopy, the stiff venous wire has dropped back and is curled in the right atrium.",
        options: [
          {
            text: "Reposition it distally in the superior vena cava, then advance the 25 Fr cannula under fluoroscopy",
            best: true,
            feedback: "A wire in the atrium can lead the cannula into an intracardiac structure; Brilakis wants it distal in the SVC and the cannula tip at the SVC–atrial junction.",
          },
          {
            text: "Advance the cannula; it will find its way",
            next: "c-septum",
            feedback: "Brilakis links a cannula against the atrial septum to poor distal wire position, and warns of perforation.",
            stateDelta: { stability: -15, flags: ["septum"] },
          },
        ],
      },
      {
        id: "c-septum",
        kind: "consequence",
        prompt: "Echo shows the venous cannula tip pressed against the interatrial septum.",
        options: [
          {
            text: "Withdraw it, put the wire back high in the SVC and readvance under fluoroscopy",
            best: true,
            feedback: "Correct the wire, then the cannula, stopping at any resistance.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Leave it; drainage will pull it free",
            feedback: "A malpositioned cannula drains poorly and risks injuring the atrium.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "As you join the arterial cannula to the circuit under a saline dribble, you see a bubble on the arterial side of the connection.",
        options: [
          {
            text: "Remove it through the side port before unclamping",
            best: true,
            feedback: "Arterial-side bubbles come out through the side port; only small venous-side bubbles are left for the circuit.",
          },
          {
            text: "Tighten the connection and start; the oxygenator will catch it",
            feedback: "Arterial-side air goes to the patient: Brilakis lists air embolism when connections are not air-free and sealed.",
            stateDelta: { stability: -20, flags: ["air"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Day 1, flow 4.5 L/min. Pulse pressure 5 mmHg, the aortic valve no longer opens, the LV is dilating, the wedge is 26 mmHg and oedema is worsening on dobutamine.",
        options: [
          {
            text: "Reduce flow to the lowest that perfuses, optimise volume and arrange LV unloading now",
            best: true,
            feedback: "Dobutamine is already running, so the less invasive steps are largely used up: pulsatility of 10 mmHg or less despite an inotrope, with worsening oedema, meets the indications for unloading. No LV thrombus, so a balloon pump or a microaxial pump are both options.",
          },
          {
            text: "Increase the flow to 5.5 L/min to improve perfusion",
            next: "c-distension",
            feedback: "In a ventricle that is failing to eject, more retrograde flow adds afterload and worsens distension.",
            stateDelta: { stability: -15, flags: ["distension"] },
          },
        ],
      },
      {
        id: "c-distension",
        kind: "consequence",
        prompt: "Two hours later the wedge is 31 mmHg, pink secretions fill the endotracheal tube and runs of ventricular tachycardia appear. Echo shows spontaneous contrast (blood stasis) in the ventricle. What now?",
        options: [
          {
            text: "Reduce the flow to the lowest that perfuses and vent the ventricle now",
            best: true,
            feedback: "Oedema that cannot be managed less invasively, absent pulsatility and arrhythmia from distension are all indications for unloading; stasis adds the risk of thrombus. Echo still shows no LV thrombus, so either a balloon pump or a microaxial pump can be used.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Increase the flow further to clear the lactate",
            feedback: "More retrograde flow keeps the aortic valve shut and the ventricle distending.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Day 3 with a microaxial pump as the vent. The LV is ejecting again. The right radial saturation has fallen through the day to 75%, left radial 94%, femoral 99%; forehead NIRS is falling and the lungs remain oedematous.",
        options: [
          {
            text: "Differential hypoxaemia: optimise ventilation, raise circuit flow and reduce pump flow for now, and plan a jugular return cannula if it persists",
            best: true,
            feedback: "The native and pump output, oxygenated by failing lungs, reaches the brachiocephalic trunk first. Around 80% with adequate flow and haemoglobin would be tolerable; a value below that, still falling, with falling cerebral oximetry is not. These are temporising measures; reconfiguration (veno-arteriovenous ECMO) is the durable fix.",
          },
          {
            text: "Change the oxygenator, which must be failing",
            feedback: "The femoral blood is 99% saturated, so the oxygenator is working; the problem is the blood the heart ejects.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "Day 6. The lungs have cleared (PaO2:FiO2 280 on 40% oxygen) and she is on low-dose noradrenaline. How do you run the weaning trial?",
        options: [
          {
            text: "Increase anticoagulation, step the flow down by 0.5–1 L/min to 1–2 L/min, and judge CVP, wedge, MAP, lactate and echo",
            best: true,
            feedback: "Low flow raises the thrombosis risk, so anticoagulation goes up first. Targets in the AHA statement: CVP below 10–15, wedge below 18, MAP 65 or more and lactate 2 or less on minimal support.",
          },
          {
            text: "Clamp the circuit for an hour and see whether she copes",
            feedback: "Clamping without stepwise reduction and anticoagulation risks circuit thrombosis and gives no graded information.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "She was decannulated on day 7 with the microaxial pump continued as step-down support, and the pump was weaned two days later.",
    outcomeVariants: [
      { flag: "leg-ischaemia", text: "The delayed antegrade sheath left a period of leg ischaemia that needed vascular review." },
      { flag: "septum", text: "The malpositioned venous cannula had to be repositioned, delaying full flow." },
      { flag: "air", text: "Air entering the arterial line was a near miss for systemic air embolism." },
      { flag: "distension", text: "Raising the flow worsened the distension and pulmonary oedema before a vent was placed." },
    ],
    learningPoints: [
      "Venous right femoral vein, arterial left femoral artery, separate groins.",
      "Antegrade perfusion sheath before the arterial cannula when possible (ELSO recommends one above 17 Fr, and the Academy lesson places one at cannulation); without one, a sustained NIRS below 50% or more than 15% below the other leg calls for one.",
      "Venous wire distal in the SVC; cannula tip at the SVC–atrial junction; stop at resistance.",
      "Wet connections; arterial bubbles out through the side port.",
      "Loaded LV: lowest perfusing flow, volume, inotrope, then vent; check for LV thrombus before choosing a microaxial pump.",
      "Differential hypoxaemia: right radial low, femoral high; ventilation and flow for now, reconfiguration if it persists.",
      "Weaning: more anticoagulation, stepwise flow reduction, defined haemodynamic targets.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "patton-rivera-nirs-ecmo-2018", "lusebrink-ecmo-venting-2023", "torre-harlequin-ecmo-2025", "ortoleva-vaecmo-review-2026", "marbach-ecmo-limb-ischaemia-2022"],
  },
];

export const tips: LabTip[] = [
  // Balloon pump: insertion
  {
    id: "mcs-iabp-size-height",
    lab: "mcs",
    when: { phase: ["select", "insert"], procedure: ["iabp"] },
    title: "Size the balloon from the height chart",
    text: "Choose the balloon volume from the patient's height using the chart supplied with your balloons. Brilakis's chart gives 30, 40 or 50 cc; the manufacturer chart in Oxford gives 25, 34, 40 or 50 mL, so the two disagree for shorter patients.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-vacuum-valve",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["iabp"] },
    title: "Vacuum on, valve on, until it is in the aorta",
    text: "Fit the one-way valve to the gas lumen, pull a vacuum with the supplied syringe and leave the valve on until the balloon is in position. Take the catheter out of its tray only just before insertion, remove the stylet, flush the wire lumen and zero the transducer.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-kit-wire",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["iabp"] },
    title: "Use the wire from the balloon pump kit",
    text: "Advance the 0.025 inch kit wire to the aortic arch under fluoroscopy. A standard exchange wire is thicker and will not pass down the balloon's lumen.",
    tone: "caution",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-tip-carina",
    lab: "mcs",
    when: { phase: ["position"], procedure: ["iabp"] },
    title: "Tip level with the carina",
    text: "Advance the balloon under fluoroscopy until its tip is level with the tracheal bifurcation (Brilakis), just beyond the left subclavian origin (Oxford). Then secure it: a catheter that is pulled back migrates downwards.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-transfer",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["iabp"] },
    title: "Before transferring a patient on a balloon pump",
    text: "Check that the vehicle can secure patient and console, the crew can run a balloon pump, the battery will last (bring a spare), the receiving centre has a pump to switch to, the console's return is arranged and telephone advice is available.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [{ book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" }],
    refs: OXFORD,
  },
  {
    id: "mcs-iabp-remove-together",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["iabp"] },
    title: "Remove balloon and sheath as one unit",
    text: "A used balloon will not fold back into its sheath. Withdraw the catheter until the balloon meets resistance at the sheath, remove both together and compress for longer than usual, because the hole is 7.5 F or larger.",
    tone: "caution",
    lessonId: "pm-support-devices-iabp-insert",
    sources: [{ book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" }],
    refs: OXFORD,
  },
  // Balloon pump: running
  {
    id: "mcs-iabp-read-1to2",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["iabp"] },
    title: "Read the 1:2 trace from A to E",
    text: "At 1:2, freeze the trace: inflation at the dicrotic notch, augmented peak (C) above the unassisted systolic peak (B), assisted end-diastolic pressure (D) below unassisted (A), and assisted systole (E) below unassisted (B). Each failed comparison points first to a timing error; if the timing is right, work through Brilakis's other causes (position, size, kinks, volume, filling, vascular tone).",
    tone: "do",
    lessonId: "pm-support-devices-iabp-run",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-poor-augmentation",
    lab: "mcs",
    when: { phase: ["manage"], event: ["hypotension"], procedure: ["iabp"] },
    title: "Mean pressure not rising: go through the causes",
    text: "Check timing on a frozen 1:2 trace, the balloon's level on fluoroscopy, kinks in the catheter or gas line, and the delivered volume; then consider hypovolaemia, low vascular resistance and a balloon too small for the aorta.",
    tone: "bailout",
    lessonId: "pm-support-devices-iabp-run",
    sources: [{ book: "brilakis-pci", loc: "14.3" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-iabp-no-heparin-1to1",
    lab: "mcs",
    when: { phase: ["manage"], event: ["bleeding"], procedure: ["iabp"] },
    title: "No anticoagulation: pump every beat",
    text: "If anticoagulation cannot be given or has to stop, for example for retroperitoneal bleeding, run the balloon at 1:1 to reduce the risk of thrombus forming on it.",
    tone: "caution",
    lessonId: "pm-support-devices-iabp-run",
    sources: [{ book: "brilakis-pci", loc: "14.3" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-iabp-static-balloon",
    lab: "mcs",
    when: { phase: ["complication"], procedure: ["iabp"] },
    title: "A stopped balloon has 10–15 minutes",
    text: "After balloon rupture, an empty helium supply or loss of the ECG trigger, restart pumping within 10–15 minutes or remove the balloon: a motionless balloon can grow clot and embolise downstream.",
    tone: "bailout",
    lessonId: "pm-support-devices-iabp-run",
    sources: [{ book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" }],
    refs: OXFORD,
  },
  {
    id: "mcs-iabp-irregular-rhythm",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["iabp"] },
    title: "Fast or irregular rhythm: try the pressure trigger",
    text: "The balloon pump is less effective in tachycardia, especially when the rhythm is irregular. Review the timing and consider triggering from the aortic pressure instead of the surface ECG.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-run",
    sources: [{ book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" }],
    refs: OXFORD,
  },
  {
    id: "mcs-iabp-wean-ratio",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["iabp"] },
    title: "Wean by spacing the inflations",
    text: "Reduce the inflations to every second beat and later every third (Oxford), keeping the systemic pressure under watch as Brilakis's monitoring list asks, before removing the balloon.",
    tone: "do",
    lessonId: "pm-support-devices-iabp-run",
    sources: [
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
      { book: "brilakis-pci", loc: "14.3" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-iabp-limb",
    lab: "mcs",
    when: { phase: ["manage", "complication"], event: ["limb-ischaemia"], procedure: ["iabp"] },
    title: "Cold, pale, painful leg on a balloon pump",
    text: "Ischaemia usually affects the leg on the insertion side but can affect the other; it needs specialist help at once. It usually recovers after the pump and sheath are removed with manual haemostasis, but may need surgical or endovascular treatment.",
    tone: "bailout",
    lessonId: "pm-support-devices-iabp-run",
    sources: [
      { book: "brilakis-pci", loc: "14.3" },
      { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
    ],
    refs: BOOKS,
  },
  // Microaxial pump: insertion
  {
    id: "mcs-impella-cross-pigtail",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["impella"] },
    title: "Cross the valve with a pigtail",
    text: "Cross into the ventricle with a pigtail rather than an Amplatz or multipurpose catheter, which can slip behind a papillary muscle, then leave a 260 cm stiff 0.014 or 0.018 inch wire. If a stenotic valve resists, stiffen the pigtail with a 0.035 inch J-wire.",
    tone: "do",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-loading-lumen",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["impella"] },
    title: "Red loading lumen: in, through, then completely out",
    text: "Pass the straightened 0.018 inch wire through the red lumen until it exits near the label, then remove the red tube entirely; a retained fragment stops the pump working. If the lumen is gone, backload with the wire leaving the outlet on the inner curve, along the black line.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-brisk-advance",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["impella"] },
    title: "Move briskly through the sheath",
    text: "With the assistant holding the wire, advance the pump through the sheath in quick, short pushes: blood pours out while the inlet is in the sheath and the outlet outside it.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-iliac-resistance",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["impella"] },
    title: "Pump stuck in the iliac: do not force it",
    text: "Use the least diseased femoral artery. If the pump will not pass, try the long peel-away sheath (sometimes the short one is better), iliac balloon angioplasty, or intravascular lithotripsy for heavy calcium.",
    tone: "bailout",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: ["brilakis-manual-pci", "riley-ivl-impella-2019"],
  },
  {
    id: "mcs-impella-start-check",
    lab: "mcs",
    when: { phase: ["position"], procedure: ["impella"] },
    title: "Three checks before you press start",
    text: "Inlet about 3.5 cm below the aortic valve (a pigtail in a cusp from a second access marks the valve if you cannot see it), the 0.018 inch wire out, and an aortic waveform on the controller. Then start and watch the flow.",
    tone: "do",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-hold-pump",
    lab: "mcs",
    when: { phase: ["insert", "manage"], procedure: ["impella"] },
    title: "Hold the pump when anything shares its sheath",
    text: "When a guide sheath is passed through the pump's sheath, hold the pump and watch it on fluoroscopy: pushing it forward can injure the left ventricle.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-insert",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  // Microaxial pump: running
  {
    id: "mcs-impella-ventricular-waveform",
    lab: "mcs",
    when: { phase: ["position", "manage"], procedure: ["impella"] },
    title: "Ventricular waveform: pull back",
    text: "The controller should show an aortic waveform. A ventricular waveform means the pump is too deep; pull it back until the aortic waveform returns.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-run",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-suction",
    lab: "mcs",
    when: { phase: ["manage"], event: ["hypotension"], procedure: ["impella"] },
    title: "Suction alarm: level down, fill, reposition",
    text: "Reduce the performance level by 1 or 2, give fluid if the patient is hypovolaemic, check and correct the position, and support the right ventricle if it is failing. Prevent it by keeping volume optimal with the RA pressure below 10 mmHg and the pump still.",
    tone: "bailout",
    lessonId: "pm-support-devices-impella-run",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-pulled-back",
    lab: "mcs",
    when: { phase: ["complication"], procedure: ["impella"] },
    title: "Pump in the aorta: re-advance or reinsert",
    text: "Try to re-advance it into the ventricle, preferably with fluoroscopy; if it will not go, take it out and repeat the insertion from the valve crossing. Prevent it with good sedation and secure fixation at the groin.",
    tone: "bailout",
    lessonId: "pm-support-devices-impella-run",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-stopped",
    lab: "mcs",
    when: { phase: ["complication"], event: ["hypotension"], procedure: ["impella"] },
    title: "Pump stopped: restart or withdraw it",
    text: "Try to restart it. If it will not restart, pull it out of the ventricle so that it does not hold the aortic valve open and regurgitant. Keep the console on mains power and the patient properly anticoagulated.",
    tone: "bailout",
    lessonId: "pm-support-devices-impella-run",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-impella-haemolysis-position",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["impella"] },
    title: "Haemolysis or repeated suction: check depth and rotation",
    text: "Haemolysis on the pump is mostly driven by pump instability, from patient or device factors. Check the insertion depth and the cannula's rotation on echo: a cannula turned towards the mitral valve can cause suction, haemolysis, aortic regurgitation and poor support.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-run",
    sources: [
      { book: "oxford-cath", loc: "ch 9: Impella" },
      { book: "brilakis-pci", loc: "24.2" },
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci", "van-edom-impella-bleeding-haemolysis-2023", "balthazar-impella-position-2023"],
  },
  {
    id: "mcs-impella-peel-outside",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["impella"] },
    title: "Peel the sheath only outside the body",
    text: "To continue support, advance the repositioning sheath as the peel-away sheath comes out; with pressure on the groin, draw the peel-away sheath fully outside before splitting it. Partly tighten the sutures, keep a 45° angle with gauze, and suture both to the skin.",
    tone: "caution",
    lessonId: "pm-support-devices-impella-run",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: BRILAKIS,
  },
  // VA-ECMO: cannulation
  {
    id: "mcs-ecmo-groins",
    lab: "mcs",
    when: { phase: ["select", "insert"], procedure: ["ecmo"] },
    title: "Right femoral vein, left femoral artery",
    text: "Put the venous cannula in the right femoral vein (an easier path to the right atrium) and the arterial cannula in the left femoral artery. Avoid both in one groin: the arterial cannula can compress the vein and congest the leg.",
    tone: "do",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-ecmo-antegrade-sheath",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["ecmo"] },
    title: "Protect the leg with an antegrade sheath",
    text: "Place a 6 Fr, 24 cm reinforced sheath antegradely in the common or superficial femoral artery, before the arterial cannula when possible. Brilakis says it may not be needed with 15–17 Fr cannulae and places one if leg NIRS stays below 50% or is more than 15% below the other leg; ELSO recommends one above 17 Fr, and the Academy lesson places one at cannulation.",
    tone: "do",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: ["brilakis-manual-pci", "patton-rivera-nirs-ecmo-2018", "marbach-ecmo-limb-ischaemia-2022", "juo-distal-perfusion-2017", "ortoleva-vaecmo-review-2026"],
  },
  {
    id: "mcs-ecmo-leg-rescue",
    lab: "mcs",
    when: { phase: ["manage", "complication"], event: ["limb-ischaemia"], procedure: ["ecmo"] },
    title: "Leg NIRS low on VA-ECMO: feed the leg",
    text: "A leg saturation that stays below 50%, or sits more than 15% below the other leg, suggests that the arterial cannula is limiting flow to the leg; examine the leg, because a very low venous saturation can give a false low reading. Place an antegrade perfusion sheath, let it back-bleed to clear air, and connect it to the arterial cannula's side port.",
    tone: "bailout",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: ["brilakis-manual-pci", "patton-rivera-nirs-ecmo-2018"],
  },
  {
    id: "mcs-ecmo-venous-wire-svc",
    lab: "mcs",
    when: { phase: ["insert", "position"], procedure: ["ecmo"] },
    title: "Venous wire high in the SVC before the cannula",
    text: "Keep the stiff wire distal in the superior vena cava. A wire that falls back into the right atrium can lead the cannula into the septum or perforate the heart. Advance the cannula under fluoroscopy to the SVC–atrial junction and stop at any resistance.",
    tone: "caution",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-ecmo-arterial-cannula",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["ecmo"] },
    title: "Arterial cannula over a stiff wire in the thoracic aorta",
    text: "Put the stiff wire into the thoracic aorta and insert the cannula under fluoroscopy: 15 Fr for most women, 17 Fr for most men. Keep the wide proximal part outside the skin, and if it will not advance check the wire for kinking or prolapse rather than forcing it.",
    tone: "do",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-ecmo-wet-connection",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["ecmo"] },
    title: "Connect wet, tighten last",
    text: "Join each cannula to its tubing under a continuous saline dribble, without squeezing the tubing hard, and tighten only once all the air is out. Check the joint for bubbles before any clamp comes off.",
    tone: "caution",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-ecmo-bubbles",
    lab: "mcs",
    when: { phase: ["insert", "manage"], event: ["air"], procedure: ["ecmo"] },
    title: "Bubbles: arterial side out, venous side depends on size",
    text: "Remove bubbles on the arterial side through the side port. On the venous side the circuit clears small bubbles; for larger ones, disconnect from the pump tubing and reconnect.",
    tone: "bailout",
    lessonId: "pm-support-devices-ecmo-cannulate",
    sources: [{ book: "brilakis-pci", loc: "14.5" }],
    refs: BRILAKIS,
  },
  // VA-ECMO: running
  {
    id: "mcs-ecmo-loaded-lv",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["ecmo"] },
    title: "Pulse pressure gone, wedge rising: the ventricle is loaded",
    text: "A pulse pressure of 10 mmHg or less with a rising wedge, a closed aortic valve and a dilating ventricle means distension; a low pulse pressure with low filling pressures points to hypovolaemia instead. Lower the flow to the least that perfuses, remove fluid, use an inotrope and PEEP; if it persists, vent the ventricle.",
    tone: "caution",
    lessonId: "pm-support-devices-ecmo-run",
    sources: [{ book: "brilakis-pci", loc: "14.2" }],
    refs: ["brilakis-manual-pci", "lusebrink-ecmo-venting-2023", "ortoleva-vaecmo-review-2026"],
  },
  {
    id: "mcs-ecmo-vent-choice",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["ecmo"] },
    title: "Choose the vent from the anatomy",
    text: "A balloon pump is small and has no LV-thrombus contraindication but needs some ventricular activity; a microaxial pump unloads more strongly but is excluded by LV thrombus and causes more haemolysis and bleeding. Left atrial or pulmonary artery drainage avoids touching the ventricle.",
    tone: "do",
    lessonId: "pm-support-devices-ecmo-run",
    sources: [
      { book: "brilakis-pci", loc: "14.1" },
      { book: "oxford-cath", loc: "ch 9: Impella" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "lusebrink-ecmo-venting-2023", "ortoleva-vaecmo-review-2026"],
  },
  {
    id: "mcs-ecmo-right-radial",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["ecmo"] },
    title: "Watch the right radial on femoral VA-ECMO",
    text: "The brachiocephalic trunk gets native output first, so monitor right radial gases and right-hand oximetry. A low, falling right radial with a high femoral saturation is differential hypoxaemia: optimise ventilation and raise flow for now, and reconfigure (for example a jugular return cannula) if it persists. A normal right radial does not exclude coronary hypoxaemia (Ortoleva). Separately, Oxford lists poor coronary perfusion among VA-ECMO's drawbacks.",
    tone: "caution",
    lessonId: "pm-support-devices-ecmo-run",
    sources: [{ book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" }],
    refs: ["oxford-cath-handbook", "torre-harlequin-ecmo-2025", "ortoleva-vaecmo-review-2026"],
  },
  {
    id: "mcs-ecmo-wean-trial",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["ecmo"] },
    title: "Weaning trial: anticoagulate, then step down",
    text: "Wean only when the cause is treated and the lungs allow it. Increase anticoagulation, reduce flow by 0.5–1 L/min at a time to 1–2 L/min, and judge CVP, wedge, MAP, lactate and echo against your protocol's targets. Decide on decannulation with the dedicated ECMO team that Oxford says VA-ECMO needs.",
    tone: "do",
    lessonId: "pm-support-devices-ecmo-run",
    sources: [{ book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" }],
    refs: ["oxford-cath-handbook", "ortoleva-vaecmo-review-2026", "geller-aha-tmcs-2022"],
  },
];

export const refs: Reference[] = [
  {
    id: "kim-early-unload-2023",
    kind: "trial",
    citation:
      "Kim MC, Lim Y, Lee SH, et al. Early left ventricular unloading or conventional approach after venoarterial extracorporeal membrane oxygenation: the EARLY-UNLOAD randomized clinical trial. Circulation. 2023;148:1570–1581.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.123.066179",
    note: "PMID: 37850383. Checked on PubMed: authors, title, journal, year, volume 148, issue 20, pages 1570–1581. Abstract used: single centre, 116 patients with cardiogenic shock on VA-ECMO, early routine transseptal left atrial cannulation within 12 hours versus conventional strategy with rescue cannulation; 30-day mortality 46.6% vs 44.8% (HR 1.02); 29 of 58 (50%) in the conventional group crossed over to rescue venting; pulmonary congestion resolved sooner with early unloading.",
    verified: true,
  },
  {
    id: "lim-early-unload-1year-2025",
    kind: "trial",
    citation:
      "Lim Y, Kim MC, Lee SH, et al. Early left ventricular unloading after venoarterial extracorporeal membrane oxygenation: 1-year outcomes of the EARLY-UNLOAD randomized clinical trial. Eur Heart J Acute Cardiovasc Care. 2025;14:203–211.",
    url: "https://doi.org/10.1093/ehjacc/zuae150",
    note: "PMID: 39749912. Checked on PubMed: authors, title, journal, year, volume 14, issue 4, pages 203–211. Abstract used: at 1 year all-cause death 56.9% vs 57.1% (HR 0.97); no difference in heart failure rehospitalisation or the composite.",
    verified: true,
  },
  {
    id: "park-evolve-ecmo-2023",
    kind: "trial",
    citation:
      "Park H, Yang JH, Ahn JM, et al. Early left atrial venting versus conventional treatment for left ventricular decompression during venoarterial extracorporeal membrane oxygenation support: the EVOLVE-ECMO randomized clinical trial. Eur J Heart Fail. 2023;25:2037–2046.",
    url: "https://doi.org/10.1002/ejhf.3014",
    note: "PMID: 37642192. Checked on PubMed: authors, title, journal, year, volume 25, issue 11, pages 2037–2046. Abstract used: 60 patients at two centres, early percutaneous transseptal left atrial venting at ECMO insertion versus conventional strategy; VA-ECMO weaning 70.0% vs 76.7% (RR 0.91), survival to discharge 53.3% vs 50.0%; pulmonary congestion improved at 48 hours only with early venting.",
    verified: true,
  },
  {
    id: "marbach-ecmo-limb-ischaemia-2022",
    kind: "paper",
    citation:
      "Marbach JA, Faugno AJ, Pacifici S, et al. Strategies to reduce limb ischemia in peripheral venoarterial extracorporeal membrane oxygenation: a systematic review and meta-analysis. Int J Cardiol. 2022;361:77–84.",
    url: "https://doi.org/10.1016/j.ijcard.2022.04.084",
    note: "PMID: 35523371. Checked on PubMed: authors, title, journal, year, volume 361, pages 77–84. Abstract used: 22 studies; limb ischaemia reduced with a prophylactic distal perfusion catheter (OR 0.31, 95% CI 0.21–0.47) and with a small (<17 Fr) arterial cannula (OR 0.40); no significant mortality difference.",
    verified: true,
  },
  {
    id: "juo-distal-perfusion-2017",
    kind: "paper",
    citation:
      "Juo YY, Skancke M, Sanaiha Y, et al. Efficacy of distal perfusion cannulae in preventing limb ischemia during extracorporeal membrane oxygenation: a systematic review and meta-analysis. Artif Organs. 2017;41:E263–E273.",
    url: "https://doi.org/10.1111/aor.12942",
    note: "PMID: 28762511. Checked on PubMed: authors, title, journal, year, volume 41, issue 11, pages E263–E273. Abstract used: 22 retrospective observational studies, 779 patients; limb ischaemia 9.74% with versus 25.42% without a distal perfusion cannula (RR 0.41); no significant mortality difference; no consensus on indications.",
    verified: true,
  },
  {
    id: "geller-aha-tmcs-2022",
    kind: "consensus",
    citation:
      "Geller BJ, Sinha SS, Kapur NK, et al. Escalating and de-escalating temporary mechanical circulatory support in cardiogenic shock: a scientific statement from the American Heart Association. Circulation. 2022;146:e50–e68.",
    url: "https://doi.org/10.1161/CIR.0000000000001076",
    note: "PMID: 35862152. Checked on PubMed: authors, title, journal, year, volume 146, issue 6, pages e50–e68. The full text could not be opened (publisher page refused access, not in PMC), so the VA-ECMO weaning values in this module are quoted as ortoleva-vaecmo-review-2026 reports them, not checked against the statement itself.",
    verified: true,
  },
  {
    id: "patton-rivera-nirs-ecmo-2018",
    kind: "paper",
    citation:
      "Patton-Rivera K, Beck J, Fung K, et al. Using near-infrared reflectance spectroscopy (NIRS) to assess distal-limb perfusion on venoarterial (V-A) extracorporeal membrane oxygenation (ECMO) patients with femoral cannulation. Perfusion. 2018;33:618–623.",
    url: "https://doi.org/10.1177/0267659118777670",
    note: "PMID: 29848162. Checked on PubMed: authors, title, journal, year, volume 33, issue 8, pages 618–623. Pilot study of 25 patients on femoral V-A ECMO: all 6 with clinical limb ischaemia had StO2 below 50% for more than 4 minutes; StO2 differential above 15% in all with cannula-related obstruction and in none without; one false positive from venous saturation below 30%. Cited by Brilakis (14.5, reference 10) for the NIRS thresholds.",
    verified: true,
  },
  {
    id: "riley-ivl-impella-2019",
    kind: "case",
    citation: "Riley RF, Corl JD, Kereiakes DJ. Intravascular lithotripsy-assisted Impella insertion: a case report. Catheter Cardiovasc Interv. 2019;93:1317–1319.",
    url: "https://doi.org/10.1002/ccd.28168",
    note: "PMID: 30811781. Checked on PubMed: authors, title, journal, year, volume 93, issue 7, pages 1317–1319. Case of intravascular lithotripsy used to deliver a 14 Fr sheath for a microaxial pump before high-risk PCI. Cited by Brilakis (14.4, reference 8).",
    verified: true,
  },
  {
    id: "van-edom-impella-bleeding-haemolysis-2023",
    kind: "paper",
    citation:
      "Van Edom CJ, Gramegna M, Baldetti L, et al. Management of bleeding and hemolysis during percutaneous microaxial flow pump support: a practical approach. JACC Cardiovasc Interv. 2023;16:1707–1720.",
    url: "https://doi.org/10.1016/j.jcin.2023.05.043",
    note: "PMID: 37495347. Checked on PubMed: authors, title, journal, year, volume 16, issue 14, pages 1707–1720. Abstract used only: bleeding and haemolysis are the two most frequent complications; haemolysis risk mostly influenced by pump instability from patient- or device-related factors; upfront echo assessment, frequent monitoring and prompt intervention essential.",
    verified: true,
  },
  {
    id: "balthazar-impella-position-2023",
    kind: "paper",
    citation:
      "Balthazar T, Van Mieghem NM, Raes M, Van Loo I, Verbrugge FH. Short-term percutaneous mechanical circulatory support: no promise without positioning! Eur Heart J Acute Cardiovasc Care. 2023;12:869–877.",
    url: "https://doi.org/10.1093/ehjacc/zuad097",
    note: "PMID: 37607271. Checked on PubMed: authors, title, journal, year, volume 12, issue 12, pages 869–877. Abstract used only: correct insertion depth and rotational angle; mal-rotation towards the mitral valve may cause suction alarms, haemolysis, aortic regurgitation and inadequate support; a bedside approach to discern suction from malposition versus haemodynamic problems.",
    verified: true,
  },
  {
    id: "lusebrink-ecmo-venting-2023",
    kind: "paper",
    citation:
      "Lüsebrink E, Binzenhöfer L, Kellnar A, et al. Venting during venoarterial extracorporeal membrane oxygenation. Clin Res Cardiol. 2023;112:464–505.",
    url: "https://doi.org/10.1007/s00392-022-02069-0",
    note: "PMID: 35986750; PMC10050067 (epub 20 August 2022). Checked on PubMed: authors, title, journal, volume 112, issue 4, pages 464–505. Full text read in PMC: mechanism of LV loading (raised afterload, LVEDP, mitral regurgitation, LA pressure, stasis and thrombus, arrhythmia, subendocardial ischaemia); flow titration and fluid removal; ECLS-SHOCK protocol venting triggers (no pulsatility, no aortic valve opening, LVOT VTI below 10 cm, LV distension); classification of active and passive venting; ECMELLA propensity-matched 255 pairs, 30-day mortality 56.9% vs 63.5%; more haemolysis and bleeding; IABP lacks the LV-thrombus contraindication; PA venting an option with LV thrombus; septostomy complications including tamponade and persistent shunt; no RCTs; expert-consensus triggers for venting.",
    verified: true,
  },
  {
    id: "torre-harlequin-ecmo-2025",
    kind: "paper",
    citation:
      "Torre DE, Pirri C. Harlequin syndrome in venoarterial ECMO and ECPELLA: when ECMO and native or Impella circulations collide. A comprehensive review. Rev Cardiovasc Med. 2025;26(8):39992.",
    url: "https://doi.org/10.31083/RCM39992",
    note: "PMID: 40927093; PMC12415751. Checked on PubMed: authors, title, journal, year, volume 26, issue 8, article 39992. Full text read in PMC: mechanism and mixing zone, which moves distally with recovering contractility and lower ECMO flow; right radial and right upper limb monitoring because the brachiocephalic trunk is the first branch after the coronary ostia; frontal NIRS; short-term measures (raise ECMO flow, optimise FiO2 and PEEP, reduce native or Impella output) as temporising only; long-term options (V-AV ECMO with SVC return via the jugular vein, SVC drainage, subclavian or central return, conversion to V-V ECMO after myocardial recovery); ECPELLA can exacerbate differential hypoxia.",
    verified: true,
  },
  {
    id: "ortoleva-vaecmo-review-2026",
    kind: "paper",
    citation:
      "Ortoleva J, Wieruszewski PM, French A, et al. Venoarterial extracorporeal membrane oxygenation in adults with cardiogenic shock. Front Cardiovasc Med. 2026;13:1851908.",
    url: "https://doi.org/10.3389/fcvm.2026.1851908",
    note: "PMID: 42428484; PMC13346054. Checked on PubMed: authors, title, journal, year, volume 13, article 1851908. Full text read in PMC: sweep 1–10 L/min and FdO2 0.21–1.0; oxygenator monitoring and exchange; avoid rapid PCO2 swings; right upper extremity arterial line and PA catheter; anti-Xa 0.3–0.7 per ELSO; unloading indications (oedema not manageable less invasively, pulsatility 10 mmHg or less despite inotropes and volume, arrhythmia from distension; PCWP 18–20 mmHg reasonable after less invasive steps); only 6% had a rise in PCWP with higher flow in one study; ELSO registry 12,734 patients, 26.7% unloaded (82.9% IABP), mortality 56.6% vs 59.3%, more bleeding and haemolysis, IABP vs pump no mortality difference; Table 5 of unloading options; weaning (cause addressed, negative fluid balance, FiO2 60% or less, anticoagulation increased, 2 L/min then 1 L/min for 10–15 minutes; CI 2.2 with CVP 12 or less at 1 L/min for 10 minutes and PCWP 15 or less) and the AHA statement's recommendations as reported (daily evaluation, PaO2:FiO2 at least 200, steps of 0.5–1 L/min to 1–2 L/min every 5–15 minutes or 2–4 hours, CVP below 10–15, PCWP below 18, MAP at least 65, lactate 2 or less); other devices continued or escalated during the wean.",
    verified: true,
  },
];
