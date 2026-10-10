// Module pm-to-the-root: set-up, catheter choice and reaching the aortic root (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.4, 1.5, 2.11, 4.1-4.3, 5.1-5.5, 20.4, 25.2, 29.1, 29.2, 30.1, 30.2, 30.7;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapters 1, 3, 4, 6, 7, 10.
// Every claim is listed with its page in docs/curriculum/evidence/pm-to-the-root.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-to-the-root",
  title: "Set-up, catheter choice and reaching the aortic root",
  stage: 2,
  summary:
    "Everything between the sheath and the first look at the aortic trace: preparing the manifold, flush, wires, sheath and catheters so that no air or debris reaches the patient; choosing a diagnostic or guide catheter for the access route, the target vessel and the size of the root; carrying a catheter to the root over a leading wire, then clearing and connecting it; and the stepwise answers when the wire or catheter will not advance from the radial or the femoral artery.",
  objectives: [
    "Prepare the manifold, flush, wires, sheath and catheters in an order that keeps air and debris out of the patient, and recognise an air-in-line fault before the first injection.",
    "Choose diagnostic and guide catheters for the access route, the target vessel, the size of the aortic root and any bypass grafts, and explain how a diagnostic catheter differs from a guide.",
    "Advance a 0.035 or 0.038 inch wire and a catheter to the aortic root with the wire always leading, keep the wire out of the left ventricle, then aspirate, back-bleed and connect without trapping air.",
    "Apply Brilakis's two four-step algorithms for resistance to wire and to catheter advancement: transduce, image, treat the cause, change access.",
    "Get past radial loops, brachial and subclavian tortuosity and spasm with the right wire, balloon-assisted tracking, a deep breath or a long sheath, and know when arteria lusoria or extreme tortuosity means changing artery.",
    "Get past iliac tortuosity, iliac stenosis, aortic aneurysm and a root that is too far away from the femoral route with long sheaths, the parallel sheath technique, longer catheters and guide extensions, and recognise peripheral dissection and perforation.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-to-the-root-table",
      title: "Setting up the table: manifold, flush, wires, sheath and catheters",
      minutes: 13,
      topics: ["dx-table-setup"],
      sources: [
        { book: "brilakis-pci", loc: "2.11" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "brilakis-pci", loc: "30.7" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
        { book: "oxford-cath", loc: "ch 4: Catheters" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 10: Air embolism" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Everything that will enter a coronary artery passes across the table first: the flush, the contrast, the lumen of each catheter and the sheath it travels through. Air and debris reach the patient from here, so most of the protection against embolism is built before the first puncture and rebuilt at every connection. Oxford reports coronary air embolism in roughly 0.4% of coronary angiography procedures and notes that it depends on training; Brilakis counts stroke from systemic embolism among the complications of catheterisation that operators fear most. This lesson builds the table in the order you will use it. Zeroing and levelling the transducer, and keeping the field clean during the case, are taught in full in the monitoring module.",
        },
        {
          kind: "steps",
          title: "Before the first puncture (Oxford, chapter 1)",
          items: [
            { title: "Venous access", detail: "Make sure an intravenous line is in place before the case starts." },
            { title: "Monitoring", detail: "A continuous ECG of good quality, and a pulse oximetry trace showing adequate oxygenation (SaO2 above 96% on room air)." },
            { title: "Oxygen when needed", detail: "Supplemental oxygen for high-risk patients and for those given large doses of sedation." },
            { title: "Protection and asepsis", detail: "Lead protection and a sterile scrub suit for the operator; prepare and drape the access site aseptically, following local nursing procedure." },
            { title: "The trolley", detail: "Check that the sterile trolley holds everything the case will need. Monitoring itself is taught in the monitoring module." },
          ],
        },
        { kind: "h", text: "1. The manifold and its lines" },
        {
          kind: "table",
          caption: "The pressure manifold, port by port (Oxford, chapter 4)",
          head: ["Port", "What it connects to", "What you check"],
          rows: [
            ["Proximal port", "The catheter hub; catheters end in a Luer-lock fitting made for this connection","A tight joint made wet, so no bubble is trapped in it"],
            ["Pressure port", "The pressure line, kept full by the flush infusion and leading to the transducer", "Line and transducer dome free of air; transducer calibrated and zeroed"],
            ["Contrast port", "The contrast supply", "Contrast drawn through the manifold with no bubbles left behind"],
            ["Distal end", "The injecting syringe; this is also the port opened to air when the transducer is zeroed", "Syringe free of air before every injection"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's manifolds carry three to five selectable ports. The flush follows hospital protocol; Oxford's example is heparin 1000 IU in 500 mL of 0.9% saline. To zero the transducer, open the distal port to air with the reference at the patient's mid-chest (Oxford's equipment section; its physiologist section uses the height of the V4 electrode instead, and the monitoring module explains which level to prefer). Oxford stresses that the system must be flushed carefully because trapped air can embolise with an injection, and that if an assistant prepared the manifold you still check it yourself before you inject.",
        },
        {
          kind: "steps",
          title: "Getting the manifold ready",
          items: [
            { title: "Flush it through", detail: "Fill the manifold, pressure line and transducer dome with flush so that no air is left anywhere in the system." },
            { title: "Run the contrast through", detail: "Oxford's pre-procedure checklist asks you to confirm that contrast has been run through the manifold and that no air bubbles remain." },
            { title: "Calibrate and zero", detail: "Confirm the transducer has been calibrated, then zero it to air through the distal port at the agreed chest level." },
            {
              title: "Inspect every joint",
              detail:
                "Brilakis names a poorly prepared manifold (or automated injector) and poor manifold connections as the first two causes of coronary air embolism. Look along the lines, the stopcocks and the syringe before the first catheter is connected.",
            },
          ],
        },
        { kind: "tip", id: "diag-root-manifold-ready" },
        {
          kind: "check",
          stem: "Before a right radial study you notice a small bubble sitting in the contrast port of the manifold, which a colleague prepared. The sheath is in and the patient is draped. What do you do?",
          options: [
            "Leave it there, because the contrast port is separate from the catheter port and that air cannot reach the patient",
            "Clear every bubble from the manifold and lines and re-check the whole system before any catheter is connected",
            "Proceed, but make the first injection a slow test puff so that the bubble stays behind in the syringe",
            "Change only the syringe, since small bubbles in the manifold are carried off harmlessly into the flush bag",
          ],
          answer: 1,
          explanation:
            "Contrast is drawn from that port into the syringe and then pushed through the catheter, so a bubble there is on its way to a coronary artery. Brilakis lists poor manifold preparation and poor connections as causes of air embolism, and Oxford asks the operator to check a manifold prepared by someone else. A slow test puff still delivers air; nothing about the flush bag removes it.",
        },
        { kind: "h", text: "2. The wires you will need" },
        {
          kind: "table",
          caption: "0.035 and 0.038 inch wires and their roles (Brilakis 30.7.8 and 5.2; Oxford, chapter 4)",
          head: ["Wire", "Use", "Caution"],
          rows: [
            [
              "Standard J tip, 0.035 or 0.038 inch",
              "Used in most procedures, for access and as the rail that carries catheters to the coronary ostia. Oxford's usual diagnostic wires are J-tipped and 0.03–0.038 inch",
              "The J reduces the chance of entering side branches; straight-tipped wires are not used to lead catheters",
            ],
            ["Short wires (30–45 cm, Oxford)", "Arterial access and sheath insertion; Brilakis prefers a short J wire for inserting the sheath when one operator works alone", "None specific"],
            ["Exchange-length wires (250–300 cm, Oxford)", "Changing catheters without giving up the route", "Keep the tip in the aortic root during the exchange"],
            ["Narrow-J radial wire", "Its J has a 1.5 mm radius instead of the standard 3 mm, and it is designed for the radial route (Brilakis). Oxford notes smaller calibres (0.025 inch) for access from the arm", "None specific"],
            [
              "Polymer-jacketed hydrophilic wire",
              "Tortuous or narrow vessels (both books). Once through, it can be exchanged for a conventional wire if needed (Oxford)",
              "Never pass or manipulate it through an access needle: the jacket can be sheared off as the wire is withdrawn (Brilakis), and these wires are a little more fragile (Oxford). Brilakis adds that it may be more likely to enter the subintimal space",
            ],
            ["Soft-tip 0.035 inch wire", "Crossing diseased, tortuous peripheral arteries (Brilakis)", "None specific"],
            ["Stiff-body 0.035 inch wire", "Inserting sheaths and pushing equipment through calcified, tortuous segments (Brilakis)", "Usually soft-tipped, and placed by way of a diagnostic catheter (Brilakis)"],
          ],
        },
        {
          kind: "check",
          stem: "The radial needle is in the artery with good backflow, but the standard wire will not pass. A colleague hands you a polymer-jacketed hydrophilic wire to push through the needle. What is the problem with that?",
          options: [
            "The jacket can be stripped off on the needle bevel if the wire is pulled back, leaving fragments in the artery",
            "Hydrophilic wires cannot be used in the radial artery at all, because they always cause spasm",
            "The wire is too stiff to pass through a 21 gauge needle and will kink at the hub every time",
            "There is no problem: hydrophilic wires are the first choice for passing through an access needle",
          ],
          answer: 0,
          explanation:
            "Both manuals warn against this. Brilakis explains that pulling the wire back through the needle can strip off its polymer coat, and Oxford calls hydrophilic wires a little more fragile and keeps them out of introducer needles. They are useful once a catheter or sheath protects them, and both books recommend them for tortuous or narrow vessels, so the blanket radial ban is wrong.",
        },
        { kind: "tip", id: "access-root-no-hydrophilic-through-needle" },
        { kind: "h", text: "3. The sheath" },
        {
          kind: "steps",
          title: "Clearing the sheath (Brilakis 4.2.14, 4.3.9, 5.4; Oxford, chapter 3)",
          items: [
            {
              title: "Aspirate the side arm first",
              detail: "Draw back 3–4 mL through the side arm and throw it away. Thrombus can form inside a sheath, and the next catheter pushed through will scoop it up and carry it towards the root.",
            },
            {
              title: "Then flush with a separate syringe",
              detail:
                "Use a different syringe holding clean heparinised saline. Oxford flushes the femoral side arm with heparinised saline to stop thrombus forming. Brilakis counts poor sheath management (not aspirating and discarding first, then flushing, before equipment or drugs go in) among the causes of leg ischaemia.",
            },
            { title: "Repeat before a guide goes in", detail: "Aspirate, discard and flush the sheath again before inserting a guide catheter." },
            {
              title: "Radial sheaths",
              detail:
                "Brilakis dips the radial sheath in saline to activate its hydrophilic coating before insertion. Once the side arm has been aspirated and the blood discarded, the vasodilator goes in through the radial sheath (Brilakis gives the separate-syringe flush in his femoral sheath section and before a guide is inserted); Oxford gives heparin in the same intra-arterial cocktail, whereas Brilakis gives it intravenously. Doses and timing are in the access and antithrombotic modules.",
            },
          ],
        },
        { kind: "tip", id: "access-root-sheath-aspirate-flush" },
        { kind: "h", text: "4. The catheters" },
        {
          kind: "steps",
          title: "Before a catheter enters the body",
          items: [
            {
              title: "Diagnostic catheters",
              detail: "Flush each catheter with saline, then load it over the 0.035 or 0.038 inch wire before it goes into the sheath (Brilakis).",
            },
            {
              title: "Guide catheters",
              detail:
                "Attach the Y-connector (haemostatic valve) and flush the guide outside the body, then insert it over the 0.035 or 0.038 inch wire. The valve stops blood pouring back out of the guide, which can be heavy with 7 Fr and even more with 8 Fr guides.",
            },
            {
              title: "Know the size",
              detail: "Oxford gives the usual range as 4–8 F, most often 6 F, and most catheters as 100 cm long. Check the previous report for the catheters that worked (next lesson).",
            },
            {
              title: "A pressure injector, if used (Oxford)",
              detail:
                "Expel the air from the reservoir before connecting; make sure the catheter is firmly attached, because the high pressures can pull a loose catheter off; the injector operator then aspirates to confirm the system holds no bubbles. During the injection, watch the image and be ready to stop if the catheter displaces or the myocardium stains.",
            },
          ],
        },
        { kind: "tip", id: "diag-root-prep-outside" },
        { kind: "h", text: "5. Keeping it clean during the case" },
        {
          kind: "list",
          items: [
            "Brilakis asks for an organised table, regular wiping of gloves and equipment, and flushing of catheters with heparinised saline: dried blood and contrast make wires and catheters sticky, and debris that gets into the manifold can embolise.",
            "His air embolism prevention list adds: preparing the manifold (or automated injector) with great care, clearing the manifold thoroughly once each catheter has come up through the aorta, back-bleeding the haemostatic connector after the trapping technique, and removing all air from balloons and other large devices before they go in.",
            "The causes on the same list go beyond the manifold: a damped pressure, whether from ostial disease or a tip lying against the aortic wall (so never inject into a damped trace); large devices that can draw air into the guide; trapping without back-bleeding afterwards; and the rupture of a balloon that was prepared badly and still held air. Brilakis warns that a large air embolus can cause cardiac arrest or death.",
            "Oxford's contrast injection rule is simple: make sure the syringe and tubing hold no air before every injection.",
          ],
        },
        {
          kind: "check",
          stem: "Midway through a long case, a run of stagnant, dark fluid and a few tiny bubbles are seen in the manifold tubing after an exchange. Which item from Brilakis's air embolism prevention list applies most directly?",
          options: [
            "Back-bleeding the guide only at the very end of the procedure, after the final images",
            "Clearing the manifold meticulously after each catheter has crossed the aorta, before any injection",
            "Giving 100% oxygen to every patient routinely from the start of the case as prophylaxis",
            "Switching to a smaller French size so that any air entrained is a smaller volume",
          ],
          answer: 1,
          explanation:
            "Brilakis lists thorough clearing of the manifold, once the catheter has come up through the aorta, among the preventive measures, alongside careful preparation and good connections. Oxygen is a treatment for air embolism, not routine prevention, and a smaller catheter does not remove air already in the line.",
        },
        { kind: "tip", id: "diag-root-air-in-line" },
        {
          kind: "pitfalls",
          items: [
            "Trusting a manifold you did not check yourself.",
            "Pushing a hydrophilic wire through the access needle.",
            "Flushing a sheath before aspirating it, which pushes any clot inside it into the artery.",
            "Inserting a guide without its haemostatic valve and losing blood through a large lumen.",
            "Letting blood and contrast dry on the wires, catheters and gloves.",
          ],
        },
        {
          kind: "pearl",
          text: "Read the manifold like a pressure trace: from catheter port to syringe, every segment should be full of fluid and free of air before you touch the plunger.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, before the first puncture, prepare the table in order: flush the manifold and run contrast through it, zero the transducer, lay out a J wire, an exchange-length wire and the catheters, and flush each catheter. After the sheath is in, aspirate its side arm, discard the blood and flush it with a separate syringe before the first catheter goes in.",
        },
        { kind: "video", id: "xng1sbQ-bT0", note: "Air embolisation (Manual of PCI chapter video)." },
        { kind: "video", id: "XPF_SXb657U", note: "The Manual of PCI chapter on monitoring." },
        {
          kind: "keypoints",
          items: [
            "Manifold: proximal port to the catheter, one port to pressure and flush, one to contrast, the syringe on the distal end; zero by opening the distal port to air.",
            "Flush and run contrast through until no air remains; check a manifold someone else set up.",
            "Poor manifold preparation and poor connections are the first causes of coronary air embolism on Brilakis's list.",
            "Wires: J tip to lead catheters; 30–45 cm for access, 250–300 cm for exchanges; narrow J for the radial; never a hydrophilic wire through the needle.",
            "Sheath: aspirate 3–4 mL and discard, then flush with a different syringe; repeat before a guide.",
            "Each diagnostic catheter is flushed, then threaded onto the wire before it enters the sheath; a guide is fitted with its haemostatic valve and flushed outside the body.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-to-the-root-choice",
      title: "Choosing the catheter: access route, target vessel and the size of the root",
      minutes: 14,
      topics: ["dx-catheter-selection"],
      sources: [
        { book: "brilakis-pci", loc: "5.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "1.5" },
        { book: "brilakis-pci", loc: "4.1" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 4: Catheters" },
        { book: "oxford-cath", loc: "ch 4: Accessing the left heart" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 7: Choice of catheters" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis makes catheter selection the first step of engagement, and calls the choice of guide one of the most critical decisions for the success, efficiency and safety of a PCI. The aim is a catheter that reaches the target ostium easily and safely, sits coaxially, and, for PCI, gives the support you will need. Three things decide it: the access route (radial or femoral), the target vessel, and the size of the aorta. Thoughtful selection, matched to how big the aorta is and where and how large the ostia are, is also Brilakis's prevention for a catheter that will not aspirate or that damps, so make the choice deliberately, before you start turning.",
        },
        { kind: "h", text: "Before you choose: look back and look ahead" },
        {
          kind: "steps",
          items: [
            {
              title: "Read the previous report",
              detail:
                "Both books ask you to check which catheters were used before and what problems arose. If engagement from one access site was very difficult or failed, Brilakis advises using a different access site this time (for example femoral). Document your own catheters so that the next operator can do the same.",
            },
            {
              title: "Read any aortic CT",
              detail: "Look for a dilated aorta and for anomalous coronary origins (Brilakis 1.5).",
            },
            {
              title: "Know the aortic valve",
              detail: "Aortic stenosis or regurgitation goes with a dilated ascending aorta, which may call for a larger catheter to engage the coronaries (Brilakis 1.5).",
            },
            {
              title: "Know the bypass grafts",
              detail: "If the patient has had CABG, find out what was grafted and where (surgical note, earlier angiograms), because the grafts change both the access site and the catheters.",
            },
          ],
        },
        { kind: "h", text: "Diagnostic catheter or guide?" },
        {
          kind: "table",
          caption: "A 6 Fr diagnostic catheter and a 6 Fr guide compared (Brilakis 30.2.1, Table 30.3)",
          head: ["Feature", "Diagnostic", "Guide"],
          rows: [
            ["Outer diameter", "0.079 inch (2 mm)", "0.079 inch (2 mm)"],
            ["Inner diameter", "0.057 inch (1.45 mm)", "0.069–0.072 inch (about 1.78 mm)"],
            ["Wall", "Thicker, two layers", "Thinner, three layers including a metal mesh that stops the wall collapsing"],
            ["Handling", "Its thicker wall transmits torque better and resists kinking","Softer tip, so it can sit engaged longer, or deeper, with less risk of dissection"],
            ["Job", "Imaging and pressure", "Imaging, pressure and delivering wires, balloons, stents and imaging catheters"],
          ],
        },
        {
          kind: "p",
          text: "Sizes are in French: 1 Fr is 0.33 mm, so a 6 Fr catheter is 2.0 mm across. A sheath's French size names the catheter it accepts, not its own outside: Brilakis notes that a sheath's outer diameter is close to that of a guide two sizes larger (a 6 Fr sheath measures 2.62 mm outside, an 8 Fr guide 2.67 mm), which is why a sheathless guide lets a larger guide pass through the same size of puncture. The bigger the sheath, the more of the artery it fills and the higher the risk of limb ischaemia and arterial thrombosis, so use the smallest sheath the procedure allows: 4–6 Fr is enough for diagnostic angiography and 5–8 Fr is used for PCI, with 7–8 Fr preferred for complex cases (Brilakis); Oxford's arterial sheath is typically 6 F, dropping to 4 or 5 F for diagnostics and rising to 7 or 8 F for complex work. Oxford uses 4–6 F catheters for routine diagnostic angiography. Smaller catheters need smaller sheaths and punctures, allow earlier mobilisation and cause fewer vascular complications, but they are floppier, transmit less torque and need more force to inject; an automated injector can help. Brilakis notes that a 4 Fr study often needs one. Most PCI can be done through a 6 Fr guide; 7 or 8 Fr guides support better, opacify better and are needed for some equipment (for example a 2.0 mm rotational atherectomy burr needs a 7 Fr guide). When a guide will not engage, you can engage and wire the vessel with a diagnostic catheter and then exchange it for the guide over a supportive 300 cm 0.014 inch wire (taught in the engagement module).",
        },
        { kind: "h", text: "What the numbers on the shapes mean" },
        {
          kind: "list",
          items: [
            "A Judkins Right number is the length of its secondary curve: 3.5, 4 or 5 cm (Brilakis).",
            "A Judkins Left number is the distance between its primary and secondary curves: 3.5, 4, 5 or 6 cm (Brilakis). Oxford describes the JL as a 90° primary curve and a 180° secondary curve on arms of different lengths.",
            "A bigger root needs a bigger catheter. Expect a dilated ascending aorta with aortic stenosis or regurgitation, which may need a larger catheter (Brilakis 1.5). In a dilated ascending aorta Brilakis adds 1 to its diameter in centimetres to get the JL size (4 cm gives a JL5). As the root dilates it also rotates anticlockwise, bringing the RCA forward, so AR1 or AR2, or AL1 or AL2, shapes may engage it more easily.",
          ],
        },
        { kind: "tip", id: "diag-dilated-root-sizing" },
        {
          kind: "check",
          stem: "A 1.95 m man is having femoral diagnostic angiography. The size of his aortic root is unknown and there is no CT. Which plan for the left coronary fits both books best?",
          options: [
            "A JL3.5, because tall patients have high left main origins that a short arm reaches more easily",
            "A JL4 first, with a JL5 or JL6 to hand, because Oxford finds a longer arm can help in very tall patients",
            "A JR4 for both coronaries, because a single catheter avoids exchanges in the femoral artery",
            "A JL6 first in every tall patient, because Brilakis sizes the left Judkins arm to the patient's own height",
          ],
          answer: 1,
          explanation:
            "Oxford uses a JL4 for routine femoral cases and says a longer arm (JL5 or JL6) can be helpful in a dilated root or a very tall patient; Brilakis sizes the JL to the aortic root, not to height, so with the root unknown the routine JL4 comes first and the longer arm is ready if the root proves large. The JL3.5 is for the right radial route, short patients, small roots, a high left main and a separate LAD origin.",
        },
        { kind: "h", text: "The usual choices, route by route" },
        {
          kind: "table",
          caption: "Catheters by access route and target (Brilakis 30.2.6; Oxford, chapter 6)",
          head: ["Target", "Femoral: diagnostic", "Femoral: PCI guide", "Radial: diagnostic", "Radial: PCI guide"],
          rows: [
            [
              "Left main",
              "JL4 (both books). Oxford: JL3.5 for short patients, small roots, a high left main or a separate LAD; JL5 or JL6 for dilated roots or very tall patients; AL for dilated sinuses or unusual ostial position",
              "EBU, XB and Voda families; an EBU 3.75 or XB 3.5 suits most cases, a 4.0 may help for the circumflex and a smaller EBU 3.5 for the LAD. JL guides are generally avoided for PCI because they support poorly (Brilakis)",
              "Catheters that engage both coronaries (TIG, Kimny, TRA series) (Brilakis). Oxford: JL4 from the left radial, JL3.5 from the right radial",
              "EBU and XB families, Ikari left (Brilakis)",
            ],
            [
              "RCA",
              "JR4; Williams; for a shepherd's crook RCA a Hockeystick or IM (Brilakis). Oxford: JR4, or as alternatives the modified Amplatz right (AR MOD) or the Williams (3DRC), and AR MOD, 3DRC or IMA for a shepherd's crook",
              "JR4; AL1 when the RCA PCI is complex; 3D Right (Brilakis)",
              "Universal catheters (TIG, Kimny, TRA series) or JR4 (Brilakis); JR4 by either route (Oxford)",
              "AL1, Ikari Right, 3D Right. Judkins Right guides are generally avoided from the radial because of poor support (Brilakis)",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Universal radial catheters.** Oxford explains that radial shapes such as the TIG were designed to engage both coronaries, which removes a catheter exchange and may reduce radial spasm and fluoroscopy time. Oxford adds that the TIG has a side hole close to its tip to limit damping on engagement; Brilakis notes, for side-hole catheters in general, that the holes can mask damping or ventricularisation at the tip (engagement module). When anatomy defeats it for one or both arteries, Oxford changes to standard Judkins catheters.",
        },
        {
          kind: "check",
          stem: "Diagnostic angiography from the right radial shows a tight mid-RCA lesion and you plan PCI through the same artery. Which guide does Brilakis advise against?",
          options: ["Amplatz Left 1 (AL1)", "Judkins Right 4 (JR4)", "Ikari Right", "3D Right"],
          answer: 1,
          explanation:
            "From the radial, Brilakis lists AL1, Ikari Right and 3D Right as RCA guides and says Judkins Right guides should generally be avoided because they provide poor support. The JR4 remains a standard diagnostic catheter for the RCA from either route; the difference is the support a guide needs to deliver equipment.",
        },
        { kind: "h", text: "How the access route changes the choice" },
        {
          kind: "list",
          items: [
            "From the right radial the catheter reaches the ascending aorta by way of the right brachiocephalic trunk. Oxford notes that this natural course makes vein grafts harder to engage, and that a LIMA can be engaged from the right radial only with difficulty and a risk of injuring its ostium.",
            "With the left radial the subclavian is less tortuous and fluoroscopy times are slightly shorter, but it can be harder and less comfortable for the operator. Brilakis says it should be used when the patient has a patent LIMA graft and radial access is chosen (after CABG with patent grafts he usually prefers femoral access).",
            "For complex PCI (chronic total occlusions, severe calcification and tortuosity, difficult bifurcations), Brilakis often prefers at least one femoral access with a 7 or 8 Fr sheath, ideally 45 cm long, for its support.",
            "Most catheter shapes were designed for the femoral route (Oxford).",
          ],
        },
        { kind: "h", text: "Grafts and the left ventricle" },
        {
          kind: "table",
          caption: "Graft and ventricular catheters (Brilakis 30.2.6.3–30.2.6.5, 4.1; Oxford, chapters 3, 4 and 7). The grafts module teaches the technique.",
          head: ["Target", "Catheters", "Access notes"],
          rows: [
            [
              "LIMA and RIMA",
              "A JR4 engages most internal mammary grafts; the IM catheter has a larger distal bend that makes it easier, and modified IM shapes larger still (Brilakis)",
              "LIMA: left radial or femoral (both books). With bilateral mammary grafts Brilakis strongly favours femoral access, whereas Oxford notes that the right radial may be the only route that engages a RIMA selectively",
            ],
            [
              "Left-sided vein grafts",
              "JR4 for most diagnostic studies; an AL engages and supports better for PCI or from the radial; multipurpose and LCB catheters support less (Brilakis). Oxford: JR4, LCB, and occasionally an AL",
              "Femoral access is usually preferred after CABG with patent grafts (Brilakis)",
            ],
            [
              "Right-sided vein grafts",
              "Usually take off downwards: JR4 or multipurpose, or the dedicated RCB (Brilakis). Oxford: multipurpose (MPA1 or MPA2) for an acute take-off; RCB",
              "Oxford often completes graft and native studies with just a JL4 and a JR4",
            ],
            ["Left ventricle and ascending aorta", "Pigtail from the femoral artery; multipurpose occasionally from the arm (Oxford)", "Covered in the haemodynamics modules"],
          ],
        },
        {
          kind: "check",
          stem: "A patient with a LIMA to the LAD and two vein grafts needs angiography and probably PCI to a vein graft. Both radials and both femorals are usable. Which plan follows Brilakis's access algorithm?",
          options: [
            "Right radial with a universal catheter, because one catheter can image every graft and both native arteries",
            "Femoral access, or the left radial if radial is chosen, with a JR4 for the grafts and an AL guide for the PCI",
            "Right radial with a JL3.5 and JR4, because the right radial makes the LIMA easiest to engage selectively",
            "Distal right radial access, because it shortens the route to the ascending aorta and to the LIMA",
          ],
          answer: 1,
          explanation:
            "Brilakis usually prefers femoral access after CABG with patent grafts and, if radial is chosen, the left radial for the LIMA. A JR4 engages most left-sided grafts for diagnosis, and an AL engages and supports better for PCI. Oxford warns that the right radial makes the LIMA technically difficult with a risk of ostial injury, and makes vein grafts harder too.",
        },
        { kind: "tip", id: "diag-root-match-curve-to-route" },
        { kind: "tip", id: "diag-root-previous-catheters" },
        {
          kind: "pitfalls",
          items: [
            "Choosing a JL size by habit when the CT already shows a dilated aorta.",
            "Using a JR guide for radial RCA PCI and then fighting for support.",
            "Starting a graft study from the right radial without knowing which grafts are there.",
            "Not recording which catheters worked, so the next operator repeats the struggle.",
          ],
        },
        {
          kind: "pearl",
          text: "Choose the catheter for the hardest thing you will ask of it: the diagnostic shape for the ostium you have, the guide shape for the support the PCI will need.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, run the ‘Small root’, ‘Dilated root’ and ‘Radial: TIG universal’ cases. Before each, state the access route and choose the left and right catheters from the table above; if your first choice fails, explain whether the size or the shape was wrong before you change it.",
        },
        { kind: "video", id: "Iy7jzdh1SQg", note: "Catheter selection for femoral access (Manual of PCI chapter video)." },
        { kind: "video", id: "tXUyX5aNEeA", note: "Catheter selection for radial access (Manual of PCI chapter video)." },
        { kind: "video", id: "K96telF5pxg", note: "Coronary catheter techniques, part 1, focused on the transradial approach." },
        { kind: "video", id: "KFXCz63Bz4s", note: "Radial catheter techniques: case illustrations and troubleshooting." },
        {
          kind: "keypoints",
          items: [
            "Choose by access route, target vessel and aortic size; read the previous report and document what you used.",
            "Diagnostic catheters have thicker walls, so they torque better and resist kinking; guides have a larger lumen, a mesh layer and a softer tip.",
            "JL number: primary-to-secondary curve distance; JR number: secondary curve length. Dilated aorta: diameter in cm plus 1 gives the JL size; the RCA moves anterior.",
            "Femoral diagnostic: JL4 and JR4. Right radial: JL3.5 or a universal catheter, and JR4.",
            "Left PCI guides: EBU, XB, Voda (femoral); EBU, XB, Ikari left (radial). Brilakis generally avoids JL guides for PCI because they support poorly.",
            "Radial RCA PCI: AL1, Ikari Right, 3D Right; avoid JR guides.",
            "Grafts: JR4 for most; AL for left-sided graft PCI; JR4, multipurpose or RCB for right-sided grafts; left radial or femoral for the LIMA.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-to-the-root-advance",
      title: "Wire first: carrying the catheter to the root, then clearing and connecting it",
      minutes: 12,
      topics: ["dx-advance-to-root"],
      sources: [
        { book: "brilakis-pci", loc: "5.2" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
      ],
      refs: [...BOOKS, "keeley-aortic-debris-1998", "powers-acute-stroke-2019"],
      blocks: [
        {
          kind: "p",
          text: "Steps 2 to 5 of Brilakis's engagement sequence take the catheter from the sheath to the root and make it safe to use: advance the wire, advance the catheter over it, aspirate, and connect to the manifold. They are done many times a day, which is exactly why they are skipped. Each one prevents a specific injury: the leading wire protects the artery wall, aspiration removes what the catheter picked up on the way, and the wet connection keeps air out.",
        },
        {
          kind: "steps",
          title: "From sheath to root",
          items: [
            {
              title: "1. Choose the rail",
              detail:
                "A 0.035 or 0.038 inch J-tip wire. From the femoral artery the wire used for access can stay in to insert the sheath and then carry the catheter. From the radial a narrow-J wire is often used. Catheters always travel over a wire: Brilakis gives both efficiency and safety as reasons, because a wire in front lowers the risk of injuring the artery.",
            },
            {
              title: "2. Wire and catheter together, wire in front",
              detail:
                "Advance them together under fluoroscopy, with the wire tip always ahead of the catheter tip, up to the aortic cusps. Oxford's radial rule is the same: the wire goes into the aortic root before any catheter is pushed through the brachial and subclavian arteries.",
            },
            {
              title: "3. Fix the wire, advance the catheter",
              detail:
                "Once the wire sits at the cusps, the assistant usually holds it still while the catheter is advanced over it to the root. If you feel resistance at any point, do not force the catheter: go to the resistance algorithms (next two lessons).",
            },
            {
              title: "4. Keep the wire out of the ventricle",
              detail:
                "The 0.035 inch wire can slip through the valve into the left ventricle and cause ventricular arrhythmias. Watch its tip, adjust it, and pull it back into the root if it enters the ventricle.",
            },
            {
              title: "5. Withdraw the wire under screening",
              detail:
                "With the catheter tip in the root, pull the wire out gently while watching. Oxford warns that taking the wire out sometimes drops a JL straight into the left main, so watch for that and keep an eye on the trace for damping.",
            },
          ],
        },
        { kind: "tip", id: "diag-root-wire-leads" },
        { kind: "tip", id: "diag-root-wire-out-of-ventricle" },
        {
          kind: "check",
          stem: "As you advance a JR4 over the J-wire towards the root from the femoral artery, a run of ventricular ectopics appears and fluoroscopy shows the wire tip curled below the valve. What do you do?",
          options: [
            "Keep advancing the catheter quickly to reach the root before the ectopy can become sustained",
            "Pull the wire tip back into the aortic root, then continue with the catheter over the fixed wire",
            "Remove the wire completely and advance the catheter the rest of the way without it",
            "Give intravenous amiodarone and continue once the rhythm has settled down",
          ],
          answer: 1,
          explanation:
            "Brilakis lists ventricular arrhythmia from the 0.035 inch wire entering the left ventricle as a hazard of this step; the fix is to remove the wire from the ventricle and keep watching its tip. A catheter advanced without a leading wire is a recognised cause of peripheral dissection, so removing the wire is not the answer. The ectopy comes from the wire, and Brilakis's solution is to take it out of the ventricle; an antiarrhythmic drug does not treat that cause.",
        },
        { kind: "h", text: "Clearing the catheter: aspiration and back-bleeding" },
        {
          kind: "p",
          text: "A catheter travelling up the aorta can collect clot from the sheath and plaque from the aortic wall. Keeley and Grines recorded the material visible in large-lumen guides in 1,000 consecutive PCIs: debris was scraped from the aorta in more than half, most often with JL (65%) and multipurpose (60%) guides and least often with the JR (24%). In their series the visible debris was not associated with in-hospital ischaemic complications, but because aortic atheroma is a potential source of systemic embolism they still judged it essential to let the debris out through the back of the catheter. Brilakis turns this into step 4.",
        },
        {
          kind: "steps",
          title: "Step 4: aspirate (Brilakis 5.4)",
          items: [
            {
              title: "Draw back 2–3 mL and discard it",
              detail:
                "Ideally squirt it onto a white gauze, where thrombus (usually from the sheath) and aortic plaque (often iridescent from its cholesterol crystals) can be seen.",
            },
            {
              title: "Large guides: let them back-bleed",
              detail:
                "With large guides Brilakis stresses back-bleeding, because aortic debris is easily scraped into them on the way up; a guide not properly cleared can then fire that debris into the aorta or a coronary artery, with catastrophic results.",
            },
            {
              title: "If suction pulls the tip onto the wall",
              detail: "Suction can pull the tip onto the aortic wall, or into a narrowed ostium; letting the catheter back-bleed is then better and safer than aspirating.",
            },
            {
              title: "If no blood comes back",
              detail:
                "Oxford: the tip may be against the aortic wall or already in an ostium, so pull back gently until blood flows freely; injecting contrast before this risks air embolism. Brilakis adds two other causes: a tip sitting next to a significant ostial lesion, and a catheter too large for the artery. Reposition it, usually by withdrawing slightly, or change to another catheter or reshape the tip by hand. A pressure waveform that comes back on the monitor tells you the tip is free; never inject or flush while the trace is damped or absent, because of the risk of embolisation or dissection.",
            },
            {
              title: "Do not pull hard on the syringe",
              detail:
                "Against a wedged or blocked catheter, forceful aspiration can draw air in through the valve of the Y-connector; if that happens, remove every bubble before any injection. If easing back a few millimetres does not work, follow Brilakis's algorithm in the engagement module: screen the whole catheter for a kink, then, if it is not kinked, assume it is plugged and remove it under constant suction without passing a wire or flushing, and aspirate the sheath.",
            },
          ],
        },
        {
          kind: "p",
          text: "Brilakis prevents a catheter from arriving full of plaque or thrombus in three ways: aspirate the sheath (and flush it with a separate syringe) before a guide goes in, use a long femoral sheath when the iliac arteries and aorta are severely diseased, and flush every catheter with saline before it enters the body.",
        },
        { kind: "tip", id: "diag-aspirate-before-engaging" },
        { kind: "tip", id: "diag-root-backbleed-guide" },
        {
          kind: "steps",
          title: "Step 5: connect to the manifold (Brilakis 5.5)",
          items: [
            { title: "Aspirated first", detail: "Connect only a catheter that has just been aspirated or has back-bled." },
            { title: "Connect while flushing", detail: "Join the hub to the manifold while flush is running through it, so no air is drawn into the catheter." },
            { title: "Stop the flush and draw back", detail: "As soon as the joint is made, stop flushing and aspirate blood into the manifold syringe." },
            { title: "Discard anything doubtful", detail: "If the blood holds any air or visible debris, throw it away and draw back again." },
            { title: "Fill to the tip", detail: "With the line clear, inject contrast until it emerges from the catheter tip. The next step, checking the pressure waveform, is taught in the engagement module." },
          ],
        },
        {
          kind: "check",
          stem: "After advancing an 8 Fr guide to the root in a patient with a heavily diseased aorta, you aspirate and see glistening, shiny fragments in the blood on the gauze. What does this mean for the next steps?",
          options: [
            "Nothing: shiny fragments are contrast crystals and can be ignored once the manifold is connected",
            "The guide has scraped aortic plaque; keep clearing it until the return is clean, and only then connect wet",
            "The guide is kinked, so it must be removed at once under suction and replaced with a smaller one",
            "The fragments show the sheath is full of thrombus, so the sheath must be exchanged before connecting",
          ],
          answer: 1,
          explanation:
            "Brilakis describes aortic plaque retrieved by aspiration as often iridescent because of cholesterol crystals, and large guides as especially prone to scraping it up. The guide must be cleared (aspirated or allowed to back-bleed) until no visible debris remains, then connected while the manifold is flushing. Thrombus from the sheath looks like clot, not glistening fragments, and a kink is suggested by a tip that will not follow the hub or a lost waveform.",
        },
        { kind: "h", text: "What goes wrong if these steps are skipped" },
        {
          kind: "table",
          head: ["Complication", "Causes (Brilakis 5.5.3; dissection 5.2.5.1)", "First signs and actions"],
          rows: [
            [
              "Systemic embolism, above all stroke",
              "No aspiration or back-bleeding before engaging; plaque dislodged by the catheter in a diseased aorta; the embolus can be air, plaque or thrombus",
              "Stroke: a new focal deficit such as weakness or loss of vision; Brilakis gives emergency head CT and neurology review, because many patients may benefit from urgent neurointervention. Current stroke guidance (AHA/ASA 2019) pairs the non-contrast CT with vascular imaging such as CT angiography to select patients for mechanical thrombectomy, so call the stroke team at once; recent heparin bears on whether thrombolysis can be given. Leg: weaker or absent pulses and discomfort; usually treated conservatively, sometimes by endovascular treatment",
            ],
            [
              "Coronary embolism",
              "The same causes",
              "ST elevation is usually the first sign; shock or arrest may follow depending on the size of the embolus and the vessel. Treatment is taught in the engagement and complications modules",
            ],
            [
              "Peripheral dissection",
              "A catheter advanced without a leading wire; forceful sheath or catheter advancement; a subintimal wire",
              "Taught in the next two lessons",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's prevention list for embolism matches the routine above: aspirate and flush the sheath before a catheter goes in, aspirate the catheter before any contrast, never inject into a damped trace, and consider a sheathless guide with an inner dilator, which avoids the ‘razor effect’ of a catheter edge scraping plaque. Oxford adds that when the wire or catheter passes through an abdominal aortic aneurysm, exchanges should be made over a wire so that the catheter does not dislodge thrombus or disrupt the intima.",
        },
        {
          kind: "pitfalls",
          items: [
            "Letting the catheter tip lead the wire through the arch or the subclavian artery.",
            "Losing sight of the wire tip, which then provokes ectopy in the ventricle.",
            "Connecting a large guide without letting it back-bleed.",
            "Connecting to a manifold that is not flushing, or connecting and injecting without drawing back.",
            "Pulling hard on a syringe against a catheter that will not aspirate: against a wedged or blocked tip it can suck air in through the Y-connector valve.",
          ],
        },
        {
          kind: "pearl",
          text: "The gauze is your report on the journey: clean blood means the route was kind; clot means look at the sheath; glitter means the aorta is shedding plaque and every later catheter needs the same care.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, take a JL4 from the sheath to the root with the J-wire always ahead of the catheter tip; keep the wire out of the ventricle; withdraw the wire while screening; aspirate 2–3 mL, connect while flushing, draw back into the manifold syringe, then fill the catheter with contrast to its tip before you look at the trace.",
        },
        { kind: "video", id: "KJ9-7kFZkQY", note: "Engagement via femoral access (Manual of PCI chapter video)." },
        { kind: "video", id: "86EzYKu_Rlc", note: "Engagement via radial access (Manual of PCI chapter video)." },
        { kind: "video", id: "efeCSk8POcg", note: "Case: ‘Getting to the heart’." },
        {
          kind: "keypoints",
          items: [
            "Catheters always travel over a 0.035 or 0.038 inch J wire, with the wire tip ahead of the catheter tip, under fluoroscopy.",
            "From the radial, the wire reaches the root before any catheter crosses the brachial and subclavian arteries.",
            "The assistant fixes the wire while the catheter is advanced; resistance means stop, not push.",
            "Watch the wire tip: in the left ventricle it causes ventricular arrhythmias.",
            "Aspirate 2–3 mL onto a white gauze; back-bleed large guides, which scrape aortic debris (more than half of guide placements in Keeley's series).",
            "Connect while flushing, stop, draw back into the manifold syringe, discard air or debris, then fill with contrast to the tip.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-to-the-root-radial",
      title: "When the arm resists: loops, tortuosity, spasm and the subclavian",
      minutes: 15,
      topics: ["acc-radial-resistance"],
      sources: [
        { book: "brilakis-pci", loc: "5.2" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "4.1" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "1.4" },
        { book: "brilakis-pci", loc: "20.4" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "30.7" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
      ],
      refs: [...BOOKS, "patel-balloon-assisted-tracking-2014"],
      blocks: [
        {
          kind: "p",
          text: "From the wrist to the root, a radial catheter passes the forearm, the elbow, the brachial artery, the subclavian and brachiocephalic arteries and the arch. Each can stop it: a small or high-origin radial artery, a radial loop, a brachial loop, subclavian tortuosity, an aberrant right subclavian artery (arteria lusoria), stenosis, or spasm. Pushing through any of them can cause spasm, dissection or perforation, or avulse a side branch, and cause bleeding into the forearm. Brilakis replaces force with two short algorithms, one for the wire and one for the catheter.",
        },
        {
          kind: "steps",
          title: "Resistance to the wire (Brilakis 5.2.4.1, Fig 5.1)",
          items: [
            {
              title: "Step 1. Transduce the sheath",
              detail:
                "Withdraw the catheter and transduce the sheath's side arm. No arterial waveform may mean that the sheath tip is subintimal (radial or femoral) or, from the radial only, that the artery is in severe spasm. Give a vasodilator for spasm; for a subintimal sheath it is best to change access site.",
            },
            {
              title: "Step 2. Image the obstacle",
              detail:
                "Advance a catheter (usually a JR4 or multipurpose) over the wire to just short of the point of resistance, confirm an arterial waveform, then inject. You will see one of five things: an occlusion, a severe lesion, severe tortuosity, a side branch the wire has entered, or an aneurysm.",
            },
            {
              title: "Step 3. Re-wire with a different wire and closer support",
              detail:
                "Bring the catheter up close to the difficult segment and try other wires: a polymer-jacketed or very soft-tipped 0.035–0.038 inch wire, or a 0.014 inch coronary wire. From the radial, Brilakis suggests a polymer-jacketed hydrophilic wire or a narrow-J radial wire, and a 0.014 inch wire to negotiate loops. A J tip is less likely to enter side branches; never push a wire against resistance.",
            },
            { title: "Step 4. Change access", detail: "If crossing fails, move to another artery." },
          ],
        },
        {
          kind: "p",
          text: "Resistance can also start at the needle, before any of this. Those fixes (checking backflow, extending the wrist, changing the needle angle or turning the bevel) are taught in the access module; once the wire stops higher in the forearm, Brilakis screens to see where it is and performs radial angiography through a diagnostic catheter brought up to just below the wire tip.",
        },
        {
          kind: "check",
          stem: "Right radial access is in, but the J-wire stops halfway up the forearm and the patient winces. What should happen first?",
          options: [
            "Push a little harder with a twisting motion, because forearm resistance usually gives way to steady pressure",
            "Advance a catheter to just below the point of resistance, confirm an arterial waveform, and inject to see the anatomy",
            "Remove everything and puncture the femoral artery straight away, without imaging, to save time and contrast",
            "Swap to a stiff-body 0.035 inch wire, which has the strength to straighten the forearm artery as it passes",
          ],
          answer: 1,
          explanation:
            "Brilakis's step 2 is to image the problem from just below it once a waveform confirms the catheter is in the lumen; the picture decides the next move (loop, tortuosity, lesion, side branch, spasm). Pushing is how dissection, perforation and avulsion of side branches happen. Changing access is the last step, not the first. Brilakis uses stiff-body wires, placed through a diagnostic catheter, to insert sheaths, advance equipment or straighten a vessel, not to push through an obstacle that has not been imaged; forcing any wire risks dissection or perforation.",
        },
        { kind: "tip", id: "diag-root-resistance-transduce-image" },
        { kind: "h", text: "Resistance to the catheter (Brilakis 5.3.3.5, Fig 5.12)" },
        {
          kind: "steps",
          items: [
            {
              title: "Step 1. Transduce from the catheter tip",
              detail:
                "From the radial, severe spasm can stop a catheter, and it is treated with vasodilators. From the femoral artery, a missing arterial waveform suggests a subintimal sheath, and changing access site may be best. (Brilakis's text says to transduce from the catheter tip; his Fig 5.12 labels this step as transducing from the sheath.)",
            },
            {
              title: "Step 2. Angiography",
              detail: "Shows a severe lesion, spasm or severe tortuosity, or reveals a perforation or a dissection that needs treatment straight away.",
            },
            {
              title: "Step 3. Treat the cause",
              detail:
                "Severe lesion: another catheter, a long sheath, or dilating the lesion; from the radial a low-profile sheath or a sheathless guide can dilate the stenosis gently without injuring the vessel. Tortuosity: a catheter with less distal angulation, a long sheath, or balloon-assisted tracking (particularly for radial loops). Spasm: vasodilators.",
            },
            { title: "Step 4. Change access", detail: "When the cause cannot be overcome." },
          ],
        },
        { kind: "h", text: "Radial loops and balloon-assisted tracking" },
        {
          kind: "p",
          text: "A catheter edge can catch on the wall of a loop or a tortuous segment and ‘dig in’; Brilakis calls this the razor effect. Balloon-assisted tracking blunts that edge. Brilakis shows radial loops crossed with a hydrophilic 0.035 inch wire and with a 0.014 inch coronary wire, with the sheath then advanced over the coronary wire. Straightening a loop can create pseudolesions on the angiogram, which are artefacts of the straightened artery and not disease. In one of his examples the diagnostic study was then completed with 5 Fr Judkins catheters after more vasodilator, but PCI was not possible through that arm and the operator crossed to the femoral artery.",
        },
        {
          kind: "steps",
          title: "Balloon-assisted tracking (Brilakis Fig 5.9)",
          items: [
            { title: "Wire across", detail: "Cross the loop or tortuous segment with a coronary wire first." },
            { title: "Choose the balloon", detail: "A small compliant balloon whose size matches the guide 1:1." },
            { title: "Position it", detail: "Half inside and half outside the guide tip." },
            {
              title: "Inflate at low pressure",
              detail: "3–6 atm: a lower pressure keeps the assembly more flexible, a higher one makes it push better.",
            },
            { title: "Advance as one unit", detail: "Guide and balloon move together over the wire, so the inflated balloon, not the guide edge, meets the vessel wall." },
          ],
        },
        {
          kind: "p",
          text: "Patel and colleagues reported balloon-assisted tracking in one high-volume radial centre: of 8,245 patients, 63 (0.76%) had anatomy in the radial, brachial or subclavian arteries that stopped a diagnostic or guide catheter despite the standard manoeuvres. The technique failed in 3 of them (4.8%), two with very small radial arteries and one with a 360° radial loop. Brilakis also lists balloon-assisted tracking across radial loops as a way to prevent radial bleeding, alongside never forcing the wire, sheath or catheter and confirming the wire position on X-ray before the sheath goes in.",
        },
        {
          kind: "check",
          stem: "A 0.014 inch wire has crossed a radial loop and the 6 Fr guide catches at its entrance each time you push. Which set-up is balloon-assisted tracking as Brilakis describes it?",
          options: [
            "A non-compliant balloon one size larger than the guide, inflated fully inside the loop to stretch the artery open",
            "A compliant balloon matched 1:1 to the guide, half out of its tip, at 3–6 atm, advanced together with the guide",
            "A compliant balloon parked well beyond the loop and inflated to anchor the wire while the guide is pushed",
            "A small balloon inflated inside the guide at 15–20 atm to trap the wire and stiffen the whole system",
          ],
          answer: 1,
          explanation:
            "The balloon covers the leading edge of the guide so it cannot dig into the wall: compliant, 1:1 with the guide, straddling the tip, at low pressure (3–6 atm), moved as one unit. Stretching the artery with an oversized balloon risks injury, and trapping at 15–20 atm is a different technique used for holding a wire during exchanges.",
        },
        { kind: "tip", id: "diag-root-balloon-assisted-tracking" },
        { kind: "h", text: "The subclavian, the arch and arteria lusoria" },
        {
          kind: "list",
          items: [
            "**Wire keeps going down the descending aorta.** Oxford: ask for a deep breath as the wire leaves the subclavian artery; it may then enter the ascending aorta.",
            "**Tortuous subclavian.** Advance the catheter close to the wire tip for support. Once through, make every exchange over a 0.035 or 0.038 inch wire 300 cm long, keeping its tip in the root. A long sheath may make manipulation much easier, but in the arm its size must respect the size of the radial artery (next paragraph). Leaving a 0.035 inch wire inside the catheter while you manipulate it also helps and lowers the risk of kinking (engagement module).",
            "**Extreme subclavian tortuosity or arteria lusoria** (the right subclavian arising anomalously from the arch). Brilakis advises changing from the right radial to the left radial or the femoral artery, partly to avoid kinking. If CT before the case shows arteria lusoria, he favours the left radial or femoral route from the start.",
            "**In STEMI**, if radial engagement is slow enough to delay reperfusion (arteria lusoria is his example), convert promptly to femoral access: time is muscle.",
          ],
        },
        { kind: "tip", id: "diag-root-descending-aorta-breath" },
        { kind: "tip", id: "diag-root-lusoria-change-artery" },
        { kind: "tip", id: "diag-radial-exchange-long-wire" },
        {
          kind: "p",
          text: "**Long sheaths in the arm: read the whole book.** In its access chapter Brilakis sizes the radial sheath to the radial artery (ultrasound helps) and the planned procedure, prefers 4 Fr sheaths for diagnostic angiography or thin-walled sheaths, and says long radial sheaths are usually avoided because of the risk of radial occlusion and spasm. The same book also uses a 16–25 cm radial sheath, partly inserted, mainly for left radial access. In its engagement chapter he notes that a long (for example 45 cm) sheath at least 1 Fr larger than the catheter can greatly ease manipulation once a tortuous passage has been crossed; that sentence follows his radial advice without naming the route, and his equipment chapter gives the 1 Fr-larger long sheath for very tortuous iliac arteries. In the radial artery, then: a long sheath only selectively, after tortuosity has been negotiated, and never large for the size of the radial artery (Brilakis also lists avoiding large sheaths relative to the radial artery among his measures against radial bleeding).",
        },
        { kind: "h", text: "Spasm, heparin timing and when the root is out of reach" },
        {
          kind: "list",
          items: [
            "**Spasm** is the radial-only cause of resistance (small or high-origin radial, tortuosity, many needle passes, much manipulation, many exchanges, women, smokers, inadequate sedation). Brilakis prevents it four ways: avoid small radial arteries and use the ulnar or femoral artery instead (one reason to puncture under ultrasound); give a vasodilator after the sheath is in; avoid large catheters, above all in a small radial; and give adequate conscious sedation before access. Oxford also finds that mild sedation before radial access usually prevents it. Doses are in the access module. The ways to release established spasm (intra-arterial and subcutaneous vasodilators, more sedation, smaller (for example 5 Fr) or low-friction guides, sheathless systems, hydrophilic sheaths and catheters, and low-profile sheaths) are taught in the engagement module.",
            "**Heparin timing.** Brilakis gives intravenous heparin with the radial sheath to prevent radial artery occlusion. When the radial or subclavian route is extremely tortuous he allows it, in some patients, to be held until the catheter has reached the root, because engagement may prove too hard and femoral crossover may be better; crossing to the femoral artery in an anticoagulated patient bleeds more and needs meticulous technique. This is an option, not a rule: once the root is reached, give the heparin.",
            "**The root is out of reach.** Very tall patients, severe subclavian tortuosity and distal radial access can leave a catheter short. Long sheaths, a stiff wire that straightens the course, or 125 cm catheters may help; with longer catheters remember that the balloons and stents may then fall short of the lesion. Guide catheter extensions are another option, and changing to the femoral artery usually gives a shorter route.",
          ],
        },
        {
          kind: "check",
          stem: "A 68-year-old woman with a STEMI is on the table via the right radial. After 15 minutes the wire still falls into the descending aorta, and a contrast injection suggests the right subclavian arises from the distal arch. What next?",
          options: [
            "Persist with deep breaths and a stiffer wire, because the right radial gives the lowest bleeding risk",
            "Exchange for a long radial sheath and keep trying the right radial, since it will eventually straighten",
            "Convert promptly to femoral access, accepting extra care with the puncture in an anticoagulated patient",
            "Leave the sheath and give thrombolysis, then return for angiography in 24 hours once she is stable",
          ],
          answer: 2,
          explanation:
            "This looks like arteria lusoria. Brilakis says that when radial engagement delays reperfusion in STEMI, with arteria lusoria as the example, the operator should convert promptly to femoral access because time is muscle. Crossing to the femoral artery after anticoagulation bleeds more and needs meticulous technique, but that does not justify further delay. A long sheath does not solve an aberrant origin.",
        },
        { kind: "h", text: "If the artery is injured" },
        {
          kind: "list",
          items: [
            "**Perforation**: forceful advancement into a side branch, a small radial artery and a sheath pushed beyond its wire are the causes Brilakis lists. Angiography is the diagnosis whenever the wire or catheter takes an unexpected course or meets resistance. In the radial, advancing a catheter across the perforated segment usually seals it; keep the wire position.",
            "**Bleeding into the forearm** can come from a wire in a radial side branch, side branches avulsed by catheters, rupture during forceful manipulation in spasm, or aggressive manipulation through loops. Inspect the forearm; haematoma and compartment syndrome are taught in the engagement and access complications modules.",
            "**When to switch**: Brilakis's access algorithm changes site whenever the first one proves unsuitable, including failure to get a wire or catheter to the root.",
          ],
        },
        { kind: "tip", id: "access-root-no-hydrophilic-through-needle" },
        {
          kind: "pitfalls",
          items: [
            "Pushing through resistance instead of transducing and imaging.",
            "Treating pseudolesions in a straightened radial loop as disease.",
            "Pushing a guide edge into a loop without balloon-assisted tracking.",
            "Persisting with the right radial in arteria lusoria during a STEMI.",
            "Exchanging catheters on a short wire after a hard-won subclavian passage.",
            "Forgetting the heparin after holding it for a very tortuous arm: once the root is reached it is still needed to protect the radial artery from occlusion.",
          ],
        },
        {
          kind: "pearl",
          text: "Resistance is a question, not an obstacle: transduce to ask whether you are in the lumen, inject to ask what is in the way, then choose the tool the answer calls for.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, choose the ‘Tortuous radial route’ case. When the wire meets the radial loop, stop, transduce and inject from just below it; cross with a different wire and bring the catheter up behind it. In the subclavian, ask for a deep breath when the wire heads down the descending aorta. Once in the root, exchange over a long wire and finish the study with a universal catheter.",
        },
        { kind: "video", id: "L3_a7saPYGM", note: "Resistance to guidewire or catheter advancement via radial access (Manual of PCI chapter video)." },
        { kind: "video", id: "pQeGh_LKoyw", note: "Radial advancement problems at the elbow and arm: the three possibilities and their management." },
        { kind: "video", id: "jJvhvQen_tM", note: "Radial loops and difficult radial, subclavian and aortic anatomy, step by step, with cases." },
        { kind: "video", id: "ZX-AJEpXeHI", note: "Case: arteria lusoria." },
        {
          kind: "keypoints",
          items: [
            "Wire resistance: transduce the sheath, image from just below, re-wire with closer support and a different wire, then change access.",
            "Catheter resistance: transduce from the tip, image, treat the cause (lesion, tortuosity, spasm, complication), then change access.",
            "Radial loops: polymer-jacketed, narrow-J or 0.014 inch wires; balloon-assisted tracking with a compliant 1:1 balloon half out at 3–6 atm.",
            "Straightened loops can show pseudolesions; a loop may allow diagnostics but not PCI.",
            "Subclavian: deep breath for a wire heading down the descending aorta; 300 cm wire for exchanges; a long sheath only selectively, sized to the radial artery.",
            "Extreme subclavian tortuosity or arteria lusoria: left radial or femoral; in STEMI convert promptly.",
            "In a very tortuous arm, heparin may be held until the root is reached; then give it, because it protects the radial artery from occlusion.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-to-the-root-femoral",
      title: "When the groin route resists: iliac tortuosity, stenosis, aneurysm and a distant root",
      minutes: 14,
      topics: ["acc-femoral-resistance"],
      sources: [
        { book: "brilakis-pci", loc: "5.2" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "1.1" },
        { book: "brilakis-pci", loc: "1.4" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "brilakis-pci", loc: "30.7" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
      ],
      refs: [...BOOKS, "reifart-parallel-sheath-2014"],
      blocks: [
        {
          kind: "p",
          text: "From the groin, the obstacles are in the iliac arteries and the aorta: tortuosity, stenosis or occlusion, old iliac stents, an abdominal aortic aneurysm and, in the tallest patients, sheer distance. Spasm is a radial problem in Brilakis's algorithms, so persistent resistance from the groin nearly always has an anatomical cause, and forcing past it risks a dissection or a perforation that bleeds into the retroperitoneum. Brilakis's two algorithms from the previous lesson apply unchanged; what differs is the toolkit.",
        },
        { kind: "h", text: "Plan for it" },
        {
          kind: "list",
          items: [
            "A femoral pulse weaker than the other side suggests an occlusion upstream (Brilakis).",
            "Review earlier catheter and peripheral films and CT for aorto-iliac disease, tortuosity, kissing iliac stents or stenosis, groin scar, and whether a long sheath was needed before (Brilakis planning).",
            "With peripheral arterial disease, do not go in through iliofemoral or subclavian arteries that are occluded or badly diseased. Chest CT shows the size and disease of the iliac and subclavian vessels and any anomalous arch; abdominal and pelvic CT shows where the common femoral artery divides and how diseased the iliofemoral vessels are; peripheral ultrasound adds to both. Brilakis's aim is to decide the access site and the sheath size and length before the case (Brilakis 1.4).",
            "Oxford: peripheral vascular disease does not rule out the femoral route, but if neither femoral pulse is palpable, or only poorly and cannot be accessed, use the radial. With an axillofemoral graft the abdominal aorta may be occluded, so a palpable femoral pulse means nothing; puncturing a peripheral polyester (prosthetic) graft risks bleeding afterwards and is generally not recommended.",
            "Aortic coarctation, most often just beyond the left subclavian artery, may stop catheters from the groin; Oxford then uses the radial, or both routes together if a gradient must be measured.",
            "If an abdominal aortic aneurysm is known, Brilakis suggests planning for radial access. Oxford has no size threshold that forbids the femoral route and weighs it case by case, but thrombus in the aneurysm on ultrasound is a contraindication because of distal embolism (renal failure, distal ischaemia, ‘trash foot’).",
          ],
        },
        { kind: "h", text: "The wire will not go: causes and fixes" },
        {
          kind: "table",
          caption: "Femoral causes of failure to advance the wire (Brilakis 5.2.4.2; Oxford, chapter 3)",
          head: ["Cause", "Clue", "What to do"],
          rows: [
            [
              "Subintimal wire or sheath",
              "Resistance to the wire; no arterial waveform from the sheath side arm",
              "Do not force. Withdraw the wire and try a different course, or move to another access site and check flow in the injured artery with an injection from the opposite side. Short retrograde dissections that spare side branches usually seal with blood flow; large femoral or iliac dissections may need endovascular repair through contralateral femoral access",
            ],
            ["Occlusion", "Weak pulse; occlusion on angiography", "Change access site; never force the wire, which can dissect or perforate"],
            [
              "Tortuosity of the iliac arteries or aorta",
              "The wire's course or the calcified outline of the vessel; earlier films or CT",
              "Other wires: a polymer-jacketed hydrophilic wire, one with a polymer-jacketed tip on a stiff uncoated body, or a soft-tip wire. Bring the catheter tip close to the wire tip for support. Once across, consider a long sheath so you do not have to cross again",
            ],
            ["Side branch", "Unexpected course on fluoroscopy", "Image to find the branches and the true course; J-tipped wires are less likely to enter branches; never lead a catheter with a straight-tipped wire"],
            [
              "Abdominal aortic aneurysm",
              "Oxford: the wire or catheter turns back on itself or veers sideways in the descending aorta",
              "Image to show its size and exit; try other wires; exchange over a wire; once across, a long sheath through the aneurysm (Brilakis shows first attempts with a JR4 and a stiff hydrophilic wire failing, the wire crossing with persistence, then exchange for a 0.035 inch wire and a 45 cm sheath across the aneurysm)",
            ],
          ],
        },
        {
          kind: "check",
          stem: "From the right femoral artery the J-wire stops at the pelvic brim. The sheath side arm, transduced, shows no arterial waveform. What does this suggest, and what is best?",
          options: [
            "Iliac spasm; give intra-arterial verapamil through the sheath and try the same wire again",
            "A subintimal sheath position; stop, and change to another access site rather than force on",
            "A normal finding with a femoral sheath; inject contrast forcefully through the side arm to see why",
            "An iliac occlusion that a stiff-body wire will cross; exchange for one and push it through",
          ],
          answer: 1,
          explanation:
            "Brilakis's first step is to transduce the sheath; a missing arterial waveform may mean a subintimal sheath (or, from the radial, severe spasm), and for a subintimal sheath he advises changing access site. Spasm appears in his algorithms only for radial access, and a femoral sheath in the lumen should show a waveform. He performs angiography only when the pressure is not damped, and warns that injecting without a waveform risks embolisation or dissection. He uses stiff-body wires, placed through a diagnostic catheter, to insert sheaths, advance equipment or straighten a vessel, not to force a way through an obstacle that has not been imaged.",
        },
        { kind: "tip", id: "access-root-femoral-no-waveform" },
        { kind: "h", text: "The catheter will not go" },
        {
          kind: "table",
          caption: "Femoral causes of resistance to the catheter (Brilakis 5.3.3)",
          head: ["Cause", "What to do"],
          rows: [
            ["Subintimal wire", "Remove the catheter and wire; move to another access site and check flow in the injured artery with an injection from the opposite side. Significant wire resistance may already have been felt"],
            [
              "Severe iliac stenosis",
              "Use a catheter with less tip angulation; pass a long sheath, typically 45 or 55 cm, across the stenosis; occasionally dilate a severe iliac lesion with angioplasty. Avoid placing iliac stents before the PCI is finished, because an advancing guide can catch and dislodge them (Brilakis shows a peripheral self-expanding stent caught by a guide tip and carried up into the aorta). If iliac stents are present, pass a long sheath through them so they are not deformed or dislodged",
            ],
            [
              "Iliac or aortic tortuosity",
              "A catheter with less distal angulation; a long sheath across the tortuous segment (kink-resistant sheaths help); the parallel sheath technique; balloon-assisted tracking; change access site",
            ],
          ],
        },
        {
          kind: "steps",
          title: "The parallel sheath technique (Brilakis 5.3.3.3; Reifart and Sotoudeh)",
          items: [
            { title: "Second puncture", detail: "Puncture the same femoral artery a second time and insert a 4 Fr sheath." },
            { title: "Stiff wire alongside", detail: "Pass a stiff 0.035 inch wire through it into the aorta." },
            { title: "Let it straighten the iliac", detail: "The stiff wire straightens the tortuous iliac artery so that the working catheter in the first sheath can be advanced and manipulated." },
          ],
        },
        {
          kind: "check",
          stem: "A planned left main PCI meets a severe right external iliac stenosis that the guide will not pass. The right femoral is the only usable large-bore access. Which approach does Brilakis favour?",
          options: [
            "Stent the iliac stenosis now so the guide passes smoothly, then carry on with the PCI immediately",
            "Advance a long sheath (45 or 55 cm) through the stenosis, dilating it with a balloon first if needed",
            "Push the guide through the stenosis with firm forward pressure while the patient holds a deep breath",
            "Leave the guide below the stenosis and perform the PCI from there using a guide catheter extension",
          ],
          answer: 1,
          explanation:
            "Brilakis lists a less angulated catheter, a long sheath through the stenosis and, occasionally, iliac angioplasty, and warns against placing iliac stents before the PCI is complete because the guide can dislodge them. Force risks dissection or perforation, and a guide parked below the iliac cannot engage the coronary at all.",
        },
        { kind: "tip", id: "access-root-iliac-long-sheath" },
        { kind: "h", text: "Choosing the sheath length" },
        {
          kind: "table",
          caption: "Femoral sheath lengths and where their tips usually lie (Brilakis 30.1.1.2)",
          head: ["Length", "Where the tip usually lies"],
          rows: [
            ["10 cm (the usual length)", "Near the origin of the internal iliac artery"],
            ["25 cm", "Near the distal aortic bifurcation"],
            ["45 cm", "Around the level of the diaphragm"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis reaches for a 25 or 45 cm sheath instead of the usual 10 cm one in iliac or aortic tortuosity, with iliac stents in place, in obesity (where a short sheath can fail to reach the femoral artery at all) and when the guide needs strong support. He does not tie these indications to one length or the other; choose the length that carries the sheath tip beyond the segment you need to bypass.",
        },
        {
          kind: "p",
          text: "Longer sheaths give better guide support and torque response. In very tortuous iliac arteries, a long sheath 1 Fr larger than the diagnostic or guide catheter can make manipulation easier. Long sheaths also help prevent catheter kinking: iliac tortuosity is one of Brilakis's examples of a guide kinking during engagement attempts (his kinking sections give 25–55 cm in one place and 45–55 cm in another). In severe iliac and aortic disease a long femoral sheath is also one of Brilakis's ways to stop catheters collecting plaque and thrombus on their way up (Brilakis 5.4). If a femoral sheath has to stay in after the case, Brilakis usually replaces a long sheath with a short (10–13 cm) one.",
        },
        { kind: "tip", id: "diag-root-iliac-kink-long-sheath" },
        { kind: "h", text: "When the root is too far" },
        {
          kind: "list",
          items: [
            "Causes: very tall patients and severe iliac or aortic tortuosity (and, from the arm, subclavian tortuosity or distal radial access).",
            "Prevention: a long sheath across the tortuosity, which can shorten the effective distance; a stiff wire that straightens the aorta; longer (125 cm) catheters.",
            "Solutions: longer catheters, remembering that balloon and stent shafts may then be too short to reach the lesion (at the time of the manual the longest drug-eluting stent shafts were 140–145 cm); guide catheter extensions; the parallel sheath technique; changing access site (the femoral route is usually the shorter one).",
          ],
        },
        { kind: "h", text: "Peripheral dissection and perforation" },
        {
          kind: "table",
          head: ["", "Dissection", "Perforation"],
          rows: [
            [
              "Causes",
              "A subintimal wire; forceful sheath or catheter advancement; a catheter advanced without a leading wire",
              "Forceful advancement of a wire or catheter into a side branch such as a renal artery; a small artery; a sheath pushed beyond its wire tip",
            ],
            [
              "Prevention",
              "Never use force; long sheaths in severe iliac tortuosity; femoral angiography with a wire in place so the sheath tip stays off the wall",
              "Fluoroscopy while advancing wires and guides; redirect a wire that enters a side branch; no force",
            ],
            [
              "Diagnosis",
              "Angiography whenever advancement is difficult, but only with an undamped pressure",
              "Angiography when the wire or catheter takes an unexpected course or meets resistance",
            ],
            [
              "Treatment",
              "Usually none: retrograde dissections are sealed by forward blood flow. Large ones may need endovascular repair, usually a stent; or switch access site",
              "Large arteries (iliac, aorta): balloon occlusion, ideally from a quickly obtained second access, then a covered stent, which can limit a retroperitoneal haematoma (the covered stents Brilakis lists need 6–7 Fr sheaths and start at 5 mm diameter). Small branches such as the inferior epigastric: coil, fat or thrombus embolisation",
            ],
          ],
        },
        {
          kind: "p",
          text: "Full management of femoral bleeding, retroperitoneal haematoma and limb ischaemia is in the access complications module.",
        },
        { kind: "tip", id: "access-root-aneurysm-suspect" },
        {
          kind: "pitfalls",
          items: [
            "Forcing a wire or catheter in the iliac artery instead of transducing and imaging.",
            "Stenting an iliac lesion before the coronary PCI and then dislodging the stent with the guide.",
            "Passing a guide through existing iliac stents without a long sheath.",
            "Ignoring a wire that loops back or swings laterally in the abdomen: think aneurysm.",
            "Using a 125 cm guide without checking that the balloons and stents will reach.",
            "Injecting to diagnose a dissection when the pressure is damped.",
          ],
        },
        {
          kind: "pearl",
          text: "Cross a hostile iliac once. As soon as a wire is through, put a long sheath across the problem so every later catheter travels inside it.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, run a femoral case and narrate the femoral resistance algorithm at each step as if the wire had stopped in the iliac artery: transduce the sheath, image from just below the obstacle, choose the wire and the sheath length, and say when you would change access. Then complete the study with a JL4 and JR4, keeping the wire ahead of each catheter.",
        },
        { kind: "video", id: "6gaIGXhyiOo", note: "Resistance to guidewire or catheter advancement via femoral access (Manual of PCI chapter video)." },
        { kind: "video", id: "9HdZn5iI-bE", note: "Case: vein graft aneurysm and iliac tortuosity." },
        { kind: "video", id: "816YL4uWVIY", note: "Case: access problems." },
        { kind: "video", id: "Cmerm-F8mfI", note: "Case: challenging access (Manual of CTO PCI)." },
        {
          kind: "keypoints",
          items: [
            "Plan: a weak pulse suggests occlusion; review films and CT for tortuosity, iliac stents, aneurysm and earlier long-sheath use.",
            "No waveform from the femoral sheath suggests a subintimal position; change access site.",
            "Tortuosity: hydrophilic, hybrid or soft-tip wires with the catheter close behind; then a long sheath, which in very tortuous iliacs may be 1 Fr larger than the catheter.",
            "Severe iliac stenosis: less angulated catheter, 45–55 cm sheath through it, or dilate; no iliac stent before the PCI; long sheath through existing stents.",
            "Parallel sheath: second 4 Fr sheath in the same femoral artery with a stiff 0.035 inch wire to straighten the iliac.",
            "Sheath tips: 10 cm near the internal iliac origin, 25 cm near the aortic bifurcation, 45 cm near the diaphragm.",
            "Root out of reach: long sheath, stiff wire, 125 cm catheter (check device lengths), guide extension.",
            "Retrograde dissections usually seal; iliac or aortic perforation needs balloon occlusion and a covered stent.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-to-the-root-q1",
      stem: "From the right radial the J-wire stops in the forearm. You withdraw the catheter and transduce the sheath side arm: there is no arterial waveform. According to Brilakis, which two explanations should you consider?",
      options: [
        "A radial loop or a radioulnar loop near the elbow, either of which you can cross with a 0.014 inch wire",
        "A subintimal sheath position or severe radial spasm, treated by changing access or a vasodilator",
        "Transducer failure or air in the line, corrected by re-zeroing and then flushing the sheath",
        "An aberrant right subclavian artery or a high-origin radial artery seen on the earlier CT",
      ],
      answer: 1,
      explanation:
        "In step 1 of Brilakis's wire algorithm a missing waveform at the sheath may mean a subintimal sheath or, from the radial, severe spasm; spasm gets a vasodilator and a subintimal sheath is best handled by changing access. Loops and tortuosity are found at step 2 with angiography, and they do not abolish the waveform at the sheath. Re-zeroing does not create a waveform that is absent.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q2",
      stem: "Why should a polymer-jacketed hydrophilic wire not be passed through an access needle?",
      options: [
        "Its tip is too floppy to leave the needle bevel and enter the vessel lumen",
        "Its coating can be sheared off when the wire is drawn back through the needle",
        "It activates platelets on contact with metal and forms clot in the needle hub",
        "It is too long to manage without an assistant at the far end of the table",
      ],
      answer: 1,
      explanation:
        "Brilakis warns that drawing the wire back through a needle can strip its polymer coat, and Oxford calls these wires slightly more fragile and keeps them out of introducer needles. The other options are not reasons either book gives.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q3",
      stem: "In Keeley and Grines's series of 1,000 PCIs, which guide catheter shape was least likely to bring back visible aortic debris?",
      options: ["Judkins Left", "Multipurpose", "Judkins Right", "Voda Left family"],
      answer: 2,
      explanation:
        "Debris was seen with 65% of JL and 60% of multipurpose guides, and large debris was most often seen with multipurpose, JL and Voda Left guides; the JR was least likely to produce any (24%). Overall, more than half of guide placements scraped debris. Visible debris was not associated with in-hospital ischaemic complications in that series, but the authors still judged clearing it essential, which is why every catheter is aspirated or allowed to back-bleed before connection.",
      difficulty: 3,
      refs: ["keeley-aortic-debris-1998"],
    },
    {
      id: "pm-to-the-root-q4",
      stem: "A 6 Fr guide repeatedly catches at a tortuous radial segment that a coronary wire has already crossed. Which description of balloon-assisted tracking is correct?",
      options: [
        "A non-compliant balloon one size above the guide, inflated at nominal pressure just beyond the bend",
        "A compliant balloon matched 1:1 to the guide, straddling its tip at 3–6 atm, advanced with the guide",
        "A compliant balloon inside the guide at 15–20 atm, holding the coronary wire still while the guide is pushed",
        "A small balloon dilating the bend at high pressure first, then removed before the guide is advanced",
      ],
      answer: 1,
      explanation:
        "Brilakis's figure shows a small compliant balloon matched 1:1 to the guide, half in and half out of its tip, inflated at 3–6 atm (lower for flexibility, higher for pushability), so the balloon rather than the guide edge meets the wall and the razor effect is avoided. Trapping at 15–20 atm is a different technique, and dilating a normal but tortuous artery is not the method.",
      difficulty: 2,
      refs: [...BOOKS, "patel-balloon-assisted-tracking-2014"],
    },
    {
      id: "pm-to-the-root-q5",
      stem: "A guide will not pass a severe external iliac stenosis before a planned complex PCI. Which option does Brilakis advise against?",
      options: [
        "Changing to a catheter with less angulation at its tip",
        "Advancing a 45 or 55 cm sheath through the stenosis",
        "Placing an iliac stent before the coronary PCI is finished",
        "Dilating the severe iliac lesion with a balloon angioplasty",
      ],
      answer: 2,
      explanation:
        "Brilakis lists a less angulated catheter, a long sheath and, occasionally, iliac angioplasty, but advises avoiding stents until the PCI is complete because the advancing guide can catch and dislodge them, as his figure of a peripheral self-expanding stent carried into the aorta shows. Existing iliac stents are protected by passing a long sheath through them.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q6",
      stem: "You plan RCA PCI through the right radial artery after a diagnostic study with a universal catheter. Which guide does Brilakis say should generally be avoided, and why?",
      options: [
        "An AL1, because Amplatz shapes cannot be advanced through the right subclavian artery",
        "A 3D Right, because it needs a femoral approach to sit against the posterior aortic wall",
        "A Judkins Right, because from the radial artery it provides poor support for equipment",
        "An Ikari Right, because it was designed for the left coronary artery from the left radial",
      ],
      answer: 2,
      explanation:
        "Brilakis's radial RCA guides are AL1, Ikari Right and 3D Right, and he says Judkins Right guides should generally be avoided because of poor support. The JR4 stays a standard diagnostic catheter for the RCA from either route; the problem is support, not engagement.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q7",
      stem: "During femoral angiography the 0.035 inch wire swings laterally and then loops back on itself in the abdomen. What does Oxford advise you to suspect, and how should catheters be handled?",
      options: [
        "A renal artery has been entered; withdraw and re-advance the catheter alone without the wire",
        "An abdominal aortic aneurysm; image it and exchange catheters over a wire to avoid dislodging thrombus",
        "Iliac spasm; give intra-arterial nitrate and continue, because the femoral route does not dissect",
        "A coarctation of the aorta; it is crossed safely by pushing a stiff-body wire straight through the narrowing",
      ],
      answer: 1,
      explanation:
        "Oxford suspects an undiagnosed abdominal aortic aneurysm when the wire or catheter loops back or deviates laterally, and recommends exchanging over a wire so the catheter does not dislodge thrombus or disrupt the intima; thrombus seen on ultrasound contraindicates the femoral approach. Brilakis images the aneurysm, tries other wires and then places a long sheath across it. A catheter advanced without a wire is a cause of dissection.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q8",
      stem: "A 2.02 m man has severe aortic and iliac tortuosity, and a 100 cm guide from the femoral artery only just reaches the root. Which statement about the options is correct?",
      options: [
        "A 125 cm guide always solves the problem because balloon and stent shafts are made to match it",
        "A long sheath, a stiff wire or a 125 cm guide may help, but devices may then not reach the lesion",
        "Changing to radial access is preferred because the radial route is usually shorter than the femoral",
        "The only reliable answer is to shorten the guide by cutting and rejoining it with a piece of sheath",
      ],
      answer: 1,
      explanation:
        "Brilakis prevents failure to reach the root with long sheaths, a stiff wire that straightens the aorta and 125 cm catheters, but warns that with longer catheters the balloons and stents may not reach the target lesion; guide extensions and the parallel sheath technique are alternatives. The femoral route is usually the shorter one, and guide shortening is used to make a guide shorter, not longer.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q9",
      stem: "A patient with a STEMI is being studied from the right radial. The wire repeatedly drops into the descending aorta and an injection suggests arteria lusoria. Twelve minutes have passed. Which action follows the manuals?",
      options: [
        "Continue on the right radial with deep breaths, because radial access lowers bleeding and that outweighs the delay",
        "Convert promptly to femoral access, taking particular care with the puncture because heparin has been given",
        "Change to the left radial only after a CT confirms the anomaly, so the next route is chosen on firm evidence",
        "Place a 45 cm sheath in the right arm so that the aberrant subclavian can be straightened and engaged",
      ],
      answer: 1,
      explanation:
        "Brilakis advises prompt conversion to femoral access when radial engagement delays reperfusion in STEMI, giving arteria lusoria as the example, because time is muscle. A femoral puncture after anticoagulation bleeds more and needs meticulous technique, but delay costs myocardium. The left radial suits a planned case where CT shows the anomaly; waiting for CT in a STEMI is wrong.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q10",
      stem: "Which statement about 6 Fr diagnostic and guide catheters is correct?",
      options: [
        "The guide has the larger outer diameter, which is why it always needs a larger sheath than the diagnostic",
        "The diagnostic has thicker walls, so it torques better and kinks less, but it has the smaller lumen",
        "The diagnostic has the softer tip, so it is the safer catheter for a deep or prolonged engagement",
        "Both have the same three-layer wall; they differ only in the shape and length of the curves",
      ],
      answer: 1,
      explanation:
        "Both are 0.079 inch (2 mm) outside, but the diagnostic's thicker two-layer wall leaves a 0.057 inch lumen against 0.069–0.072 inch in the three-layer guide, whose mesh stops the thin wall collapsing. The thicker wall of a diagnostic catheter transmits torque better and resists kinking; guides have the softer tips that tolerate longer and deeper engagement.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-to-the-root-q11",
      stem: "Brilakis's femoral sheath lengths and the usual position of their tips are best matched by which option?",
      options: [
        "10 cm at the renal arteries; 25 cm at the diaphragm; 45 cm at the aortic arch",
        "10 cm near the internal iliac origin; 25 cm near the aortic bifurcation; 45 cm near the diaphragm",
        "10 cm in the common femoral artery; 25 cm at the renal arteries; 45 cm at the aortic arch",
        "10 cm near the aortic bifurcation; 25 cm near the diaphragm; 45 cm near the origins of the renal arteries",
      ],
      answer: 1,
      explanation:
        "Brilakis places the tip of a 10 cm sheath near the origin of the internal iliac artery, a 25 cm sheath near the distal aortic bifurcation and a 45 cm sheath near the diaphragm. Knowing this tells you which length actually crosses the tortuous or diseased segment you are trying to bypass.",
      difficulty: 3,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "procedure", task: "Prepare the table, clear the sheath, and take a catheter to the root over a leading wire; aspirate, connect while flushing and fill with contrast before reading the trace." },
    { sim: "cathlab", task: "Run the ‘Tortuous radial route’ case: transduce and image at the loop, change wire, bring the catheter up behind it, use a deep breath in the subclavian, and exchange over a long wire once in the root." },
  ],
  caseIds: ["pm-to-the-root-case-radial", "pm-to-the-root-case-femoral"],
};

// ---------------------------------------------------------------------------
// Branching cases
// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "pm-to-the-root-case-radial",
    title: "A small radial artery, a loop and a subclavian that will not let go",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 4.3, 5.2-5.5, 20.4, 25.2, 29.2 and 30.2.6; Oxford Handbook, chapters 3, 4 and 6",
    },
    summary: "Right radial angiography and probable PCI in a short woman with a radial loop and subclavian tortuosity: preparing the table, the wire and catheter resistance algorithms, balloon-assisted tracking, reaching the root, clearing the catheter and choosing a radial RCA guide.",
    presentation:
      "A 76-year-old woman, 1.52 m and 51 kg, with an NSTEMI and a high bleeding risk. Right radial access with a 6 Fr thin-walled sheath has just been obtained under ultrasound; the side arm has been aspirated and the vasodilator given through the sheath. The earlier report from another hospital mentions a ‘difficult arm’.",
    findings: ["Blood pressure 146/78 mmHg, sinus rhythm 72/min", "Haemoglobin 108 g/L, eGFR 48 mL/min/1.73 m²", "ECG: ST depression in II, III and aVF"],
    steps: [
      {
        id: "s1",
        prompt: "Before the first catheter goes in you look at the manifold, which the nurse prepared. A small bubble is sitting in the line beside the contrast port. What do you do?",
        options: [
          { text: "Clear every bubble and re-check the whole manifold before any catheter is connected", best: true, feedback: "Brilakis lists poor manifold preparation and poor connections as causes of air embolism; Oxford asks you to check a manifold that someone else set up. Re-flush, confirm contrast runs through without air and the transducer is zeroed, then aspirate the sheath again before the first catheter goes in." },
          { text: "Carry on: one small bubble in the contrast line will stay behind in the syringe", next: "c-air", feedback: "Contrast from that port goes through the syringe into the catheter: the bubble is on its way to a coronary artery.", stateDelta: { stability: -25, flags: ["air"] } },
          { text: "Change the syringe and carry on without re-flushing the manifold", feedback: "The bubble is in the manifold line, not the syringe; it is still there.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-air",
        kind: "consequence",
        prompt: "The first RCA test injection is followed by chest pain and ST elevation in the inferior leads; flow in the RCA has slowed and a bubble is seen distally. What do you do?",
        options: [
          { text: "Give 100% oxygen, aspirate through the catheter and pass a coronary wire through the bubbles", best: true, feedback: "Oxygen speeds absorption; aspiration through the catheter, a wire through the bubbles and, for a large volume, an aspiration catheter are Brilakis's and Oxford's measures, with support of the circulation if needed. Prevention was a meticulously prepared manifold." },
          { text: "Inject more contrast forcefully through the same manifold to push the bubble through", feedback: "Brilakis does describe repeated forceful saline injections when flow stops, but more contrast through an unchecked manifold risks more air. Clear the system first.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "s2",
        prompt: "Now set up properly, the narrow-J wire stops halfway up the forearm and the patient says it hurts. What next?",
        options: [
          { text: "Stop; bring a catheter up to just below the resistance, confirm an arterial waveform, and inject to see the anatomy", best: true, feedback: "Brilakis's step 2: transduce and image from just below the obstacle." },
          { text: "Twist and push the wire firmly; forearm resistance usually yields", next: "c-perf", feedback: "Force is the cause of radial dissection, perforation and side-branch avulsion.", stateDelta: { stability: -20, flags: ["radial-injury"] } },
          { text: "Abandon the radial and puncture the femoral artery at once", acceptable: true, feedback: "Changing access is step 4. It is always available, but in a patient at high bleeding risk the radial is worth an image first.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-perf",
        kind: "consequence",
        prompt: "An injection through the sheath shows contrast leaking from a small forearm branch, and the forearm is beginning to swell.",
        options: [
          { text: "Keep the wire position, cross the segment and advance a catheter over the perforated part to seal it; check the forearm repeatedly", best: true, feedback: "Brilakis: in the radial, advancing a catheter across the perforation usually achieves haemostasis. Keeping the wire is vital." },
          { text: "Pull everything out and compress the wrist", feedback: "Bleeding from a forearm branch is not controlled at the wrist; losing the wire gives up the chance to seal it from inside, and a forearm haematoma can progress to compartment syndrome.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s3",
        prompt: "The injection shows a tight radial loop just below the elbow; the J-wire keeps buckling at its entrance. How do you cross it?",
        info: "The radial artery above and below the loop is small but patent; there is no spasm on the image.",
        options: [
          { text: "Bring the catheter up close behind the loop and cross it with a 0.014 inch coronary wire or a polymer-jacketed hydrophilic wire", best: true, feedback: "Brilakis's step 3: closer support and a different wire; a 0.014 inch wire is his suggestion for radial loops." },
          { text: "Change to a stiff-body 0.035 inch wire to force the loop straight", next: "c-perf", feedback: "Brilakis uses stiff-body wires, placed through a diagnostic catheter, to insert sheaths, advance equipment or straighten a vessel, not to force a loop; forcing any wire risks dissection or perforation.", stateDelta: { stability: -20, flags: ["radial-injury"] } },
          { text: "Move to the left radial", acceptable: true, feedback: "Reasonable if crossing fails, but the loop can usually be crossed first." },
        ],
      },
      {
        id: "s4",
        prompt: "A 0.014 inch wire is across, but the diagnostic catheter catches at the loop entrance each time you advance it, and the patient feels it. What now?",
        options: [
          { text: "Balloon-assisted tracking: a compliant balloon sized 1:1 with the catheter, half out of its tip, at 3–6 atm, advanced with the catheter", best: true, feedback: "The balloon covers the catheter edge so it cannot dig in (the razor effect); Patel's series used it for radial loops, small radials and subclavian tortuosity." },
          { text: "Push harder while the patient holds a deep breath", next: "c-perf", feedback: "A deep breath helps the subclavian, not a forearm loop; pushing a catheter edge into a loop is how it perforates.", stateDelta: { stability: -20, flags: ["radial-injury"] } },
          { text: "Change to a smaller (5 Fr) catheter over the wire", acceptable: true, feedback: "A smaller catheter may follow; balloon-assisted tracking is the specific answer to a catheter edge catching." },
        ],
      },
      {
        id: "s5",
        prompt: "The loop straightens and the catheter passes. Where the loop has been straightened, the image now shows two short narrowings. In the subclavian, the wire then keeps going down the descending aorta.",
        options: [
          { text: "Recognise the narrowings as likely pseudolesions from the straightened loop; ask for a deep breath as the wire leaves the subclavian, with the catheter close behind it", best: true, feedback: "Straightened loops produce pseudolesions (Brilakis). Oxford's deep breath may let the wire into the ascending aorta." },
          { text: "Rotate the catheter hard without a wire inside to point it at the ascending aorta", next: "c-kink", feedback: "Torque without a wire in a tortuous subclavian is how catheters kink; Brilakis advises leaving a 0.035 inch wire inside while manipulating.", stateDelta: { stability: -15, flags: ["kink"] } },
          { text: "Stop and plan angioplasty of the two radial narrowings", feedback: "They appeared only when the loop was straightened: pseudolesions, not disease.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-kink",
        kind: "consequence",
        prompt: "The catheter tip no longer moves with the hub and screening shows a kink in the subclavian segment.",
        options: [
          { text: "Stop rotating, untwist in the opposite direction and try to pass a 0.035 inch wire through the kink before removing it", best: true, feedback: "Brilakis's first step for a kinked catheter (taught in the engagement module)." },
          { text: "Pull it straight out through the radial sheath", feedback: "A kinked catheter dragged through the arm can injure the artery.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s6",
        prompt: "The catheter is in the root and the wire is out. What do you do before connecting it?",
        options: [
          { text: "Aspirate 2–3 mL onto a white gauze and inspect it, then connect while the manifold flushes", best: true, feedback: "Brilakis steps 4 and 5: after connecting wet, stop the flush, draw back into the manifold syringe, discard any air or debris and fill the catheter with contrast to its tip." },
          { text: "Connect and flush straight away so that the catheter lumen does not have time to clot", next: "c-embol", feedback: "Flushing before aspirating pushes whatever the catheter collected on its way up into the patient.", stateDelta: { stability: -25, flags: ["embolism"] } },
        ],
      },
      {
        id: "c-embol",
        kind: "consequence",
        prompt: "Shortly after the flush the patient cannot find words and her right hand is weak.",
        options: [
          { text: "Stop, call the stroke team now, and get an emergency non-contrast head CT with CT angiography", best: true, feedback: "Brilakis gives emergency head CT and neurology review, because many such patients can benefit from neurointervention; current stroke guidance (AHA/ASA 2019) adds vascular imaging to select patients for mechanical thrombectomy. Any heparin given during the case bears on whether thrombolysis can be given." },
          { text: "Finish the coronary study first, then ask for a neurology opinion on the ward", feedback: "A new stroke needs emergency imaging and the stroke team now; the time to thrombectomy matters.", stateDelta: { stability: -20 } },
        ],
      },
      {
        id: "s7",
        prompt: "The RCA has a tight mid lesion and you will treat it through the same arm. How do you change to a guide, and which one?",
        options: [
          { text: "Exchange over a 300 cm wire kept in the root, for an AL1, Ikari Right or 3D Right guide", best: true, feedback: "Keep the route (Brilakis), and choose a radial RCA guide that supports; Judkins Right guides are generally avoided from the radial. Use balloon-assisted tracking if the guide catches at the loop." },
          { text: "Pull the diagnostic catheter and wire out, then re-cross the loop and subclavian with the guide", next: "c-lost", feedback: "Giving the route back means crossing the loop and subclavian again, with more spasm and injury risk.", stateDelta: { stability: -15, flags: ["route-lost"] } },
          { text: "A JR4 guide over a long wire", acceptable: true, feedback: "The exchange is right, but Brilakis generally avoids JR guides from the radial because of poor support.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-lost",
        kind: "consequence",
        prompt: "The guide will not pass the loop, and the forearm is now in spasm.",
        options: [
          { text: "Stop pushing; vasodilator through the sheath and more sedation, then re-cross with a coronary wire and balloon-assisted tracking, or move to the femoral artery", best: true, feedback: "Spasm is treated with vasodilators and sedation; balloon-assisted tracking or a change of access completes the job." },
          { text: "Push the guide through the spasm", feedback: "Forceful manipulation in spasm can rupture the radial artery.", stateDelta: { stability: -20 } },
        ],
      },
    ],
    outcome:
      "The RCA lesion is stented through the right radial with an AL1 guide brought past the loop with balloon-assisted tracking. The forearm is soft at the end of the case, and the report records the radial loop, the pseudolesions, the wires that crossed and the catheters that worked.",
    outcomeVariants: [
      { flag: "air", text: "A bubble left in the manifold caused coronary air embolism, treated with oxygen and aspiration, and prolonged the case." },
      { flag: "radial-injury", text: "Forcing equipment perforated a forearm branch; the catheter sealed it, but the forearm needed repeated checks." },
      { flag: "kink", text: "Rotating without a wire inside kinked the catheter in the subclavian segment, which needed untwisting and a wire to recover." },
      { flag: "embolism", text: "Flushing before aspirating sent debris to the brain; the stroke pathway delayed the coronary treatment." },
      { flag: "route-lost", text: "Giving back the route at the exchange cost time and provoked spasm." },
    ],
    learningPoints: [
      "Check the manifold yourself: any air in it is on its way to a coronary artery.",
      "Wire resistance: transduce the sheath, image from just below, then a different wire with the catheter close behind; change access last.",
      "Radial loops: 0.014 inch or hydrophilic wire; balloon-assisted tracking when the catheter edge catches.",
      "A straightened loop can show pseudolesions.",
      "Deep breath for a wire that keeps choosing the descending aorta; keep a wire inside while manipulating in a tortuous subclavian.",
      "Aspirate onto gauze, connect while flushing, draw back, then fill to the tip.",
      "Exchange over a 300 cm wire; for radial RCA PCI use AL1, Ikari Right or 3D Right rather than a JR guide.",
      "A stroke on the table: stop, call the stroke team, and image the head and its vessels at once.",
    ],
    refs: [...BOOKS, "patel-balloon-assisted-tracking-2014", "powers-acute-stroke-2019"],
  },
  {
    id: "pm-to-the-root-case-femoral",
    title: "A tall man, a tortuous iliac and a guide that cannot reach",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 1.4, 4.1, 4.2, 5.2-5.4, 30.1 and 30.2; Oxford Handbook, chapter 3",
    },
    summary: "Femoral access for a complex PCI in a very tall man with iliac tortuosity, an old iliac stent and an aneurysmal aorta: planning, the wire and catheter algorithms, long sheaths, failure to reach the root and a catheter that will not aspirate.",
    presentation:
      "A 79-year-old man, 2.01 m, with stable angina and a heavily calcified proximal LAD lesion referred for PCI with likely atherectomy. He had a right common iliac stent 6 years ago. His previous angiogram report notes ‘right iliac tortuosity; JL4 kinked’. Both radial arteries were found occluded on ultrasound after earlier procedures. The left femoral pulse is clearly weaker than the right.",
    findings: ["Blood pressure 158/84 mmHg, sinus rhythm 64/min", "eGFR 62 mL/min/1.73 m²", "No anticoagulant; aspirin and clopidogrel loaded", "Ultrasound: both radial arteries occluded"],
    steps: [
      {
        id: "s1",
        prompt: "Which access plan do you make?",
        options: [
          { text: "Right femoral, with a 45 cm sheath through the old iliac stent and the tortuosity", best: true, feedback: "With both radials occluded, the femoral route is left. For complex PCI Brilakis often prefers femoral access with a long sheath; a weaker left pulse suggests upstream occlusion; existing iliac stents are protected inside a long sheath, and a long femoral sheath helps prevent the kinking seen last time." },
          { text: "Left femoral, to keep the guide away from the stented right iliac", next: "c-occl", feedback: "A pulse weaker than the other side suggests an occlusion between the groin and the aorta.", stateDelta: { stability: -10 } },
          { text: "Right femoral with the usual 10 cm sheath, as for any other case", feedback: "The guide would then pass the old iliac stent unprotected, where it can deform or dislodge it, and a short sheath does nothing against the tortuosity that kinked the JL4 last time.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-occl",
        kind: "consequence",
        prompt: "The left femoral wire will not advance beyond the external iliac and angiography shows an occlusion.",
        options: [
          { text: "Stop forcing and change access site to the right femoral", best: true, feedback: "Brilakis's solution for an occlusion between the access and the root is a change of access; forcing it risks dissection or perforation." },
          { text: "Push a polymer-jacketed wire hard through the occlusion", feedback: "Forceful advancement through an occluded vessel risks iatrogenic dissection or perforation.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s2",
        prompt: "Through a short right femoral sheath, the J-wire stops at the pelvic brim. The sheath side arm shows a good arterial waveform. What next?",
        options: [
          { text: "Advance a JR4 or multipurpose catheter to just below the resistance, confirm the waveform and image", best: true, feedback: "Step 2 of the wire algorithm." },
          { text: "Push the wire on with more force", next: "c-dissect", feedback: "Never force a wire; subintimal advancement causes peripheral dissection.", stateDelta: { stability: -20, flags: ["dissection"] } },
        ],
      },
      {
        id: "c-dissect",
        kind: "consequence",
        prompt: "An injection shows a short retrograde dissection of the external iliac artery; distal flow is preserved and no side branch is involved.",
        options: [
          { text: "Accept it as a usually benign retrograde dissection, avoid that channel, and re-wire the true lumen carefully under fluoroscopy, or change access", best: true, feedback: "Short retrograde dissections that spare side branches are usually sealed by forward flow; large ones may need stenting via contralateral access." },
          { text: "Stent the iliac now so the guide can pass", feedback: "Not needed for a short retrograde dissection with preserved flow, and Brilakis warns that an iliac stent placed before the PCI can be dislodged by the guide.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "s3",
        prompt: "The image shows severe tortuosity of the external iliac artery just below the old stent. How do you get through?",
        options: [
          { text: "Polymer-jacketed hydrophilic wire with the catheter close behind; once across, exchange for a 0.035 inch wire and place a 45 cm sheath 1 Fr larger than the guide through the stent", best: true, feedback: "Different wire, closer support, then a long sheath so every later catheter travels inside it and the stent is protected." },
          { text: "Cross with a hydrophilic wire, then use the 10 cm sheath and turn the guide hard to engage", next: "c-kink", feedback: "Iliac tortuosity is Brilakis's example of a guide kinking during engagement; the long sheath prevents it.", stateDelta: { stability: -15, flags: ["kink"] } },
          { text: "The parallel sheath technique: a second 4 Fr sheath in the same artery with a stiff 0.035 inch wire", acceptable: true, feedback: "A recognised option for severe iliac tortuosity, but here a long sheath also protects the old stent." },
        ],
      },
      {
        id: "c-kink",
        kind: "consequence",
        prompt: "The EBU tip stops following the hub and the pressure trace is lost. Screening shows a kink in the iliac segment.",
        options: [
          { text: "Stop turning, untwist and try to pass a wire through the kink; once it is out, use a long sheath", best: true, feedback: "Recover the kink (engagement module), then prevent the next one with a long sheath." },
          { text: "Inject contrast to see whether it is really kinked", feedback: "Never inject through a catheter with a lost waveform; fluoroscopy of the whole length shows the kink.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s4",
        prompt: "In the abdomen the wire swings far to the left and loops back on itself.",
        info: "A CT from 3 years ago, found afterwards, reported a 4.2 cm infrarenal aneurysm without mural thrombus.",
        options: [
          { text: "Suspect an aneurysm: image its size and exit, cross with a different wire, exchange over the wire and take the long sheath across it", best: true, feedback: "Oxford's clue (looping or lateral deviation) and management (exchange over a wire); Brilakis's crossing method with a long sheath." },
          { text: "Advance the catheter without the wire to find the way", next: "c-embol", feedback: "A catheter without a leading wire can dissect and, in an aneurysm, dislodge thrombus.", stateDelta: { stability: -25, flags: ["embolism"] } },
        ],
      },
      {
        id: "c-embol",
        kind: "consequence",
        prompt: "After the catheter scrapes along the aneurysm, the right foot becomes painful and its pulses weaken.",
        options: [
          { text: "Assess the foot now and image the limb while still in the laboratory to find the cause", best: true, feedback: "Lower limb embolisation shows as weaker or absent pulses and discomfort. Angiography of the limb in the laboratory confirms the diagnosis and plans treatment: endovascular (angioplasty, thrombectomy or thrombolysis) or, in some, surgery. Brilakis's usual route for limb angiography is the contralateral femoral artery, which this patient's weak left pulse makes doubtful, so plan it with care (access complications module)." },
          { text: "Leave the foot alone until the PCI is finished and then reassess", feedback: "A threatened limb needs prompt assessment.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s5",
        prompt: "With the 45 cm sheath in place, the 100 cm EBU guide only just reaches the root and will not seat. What do you do?",
        options: [
          { text: "Straighten the course with a stiff 0.035 inch wire, or use a guide extension", best: true, feedback: "Brilakis's prevention and solutions for failure to reach the root. A 125 cm guide is also an option, but first check that the balloons, atherectomy devices and stents are long enough to reach the lesion." },
          { text: "Change to a 125 cm guide without checking the device lengths", acceptable: true, feedback: "It may reach, but balloons and stents may then not reach a distal target.", stateDelta: { stability: -5 } },
          { text: "Push the guide harder against the tortuosity until it seats", feedback: "Force in a tortuous aorta risks dissection and kinking.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "s6",
        prompt: "The guide is in the root and the wire is out, but nothing comes back into the syringe.",
        options: [
          { text: "Withdraw a few millimetres and try again, screening for a kink if it still fails", best: true, feedback: "Brilakis's algorithm for failure to aspirate: if it still fails and the catheter is not kinked, assume it is plugged and remove it under constant suction without wiring or flushing, then aspirate the sheath. Do not pull hard on the syringe, which can draw air in through the Y-connector." },
          { text: "Flush firmly through the manifold to clear the catheter", next: "c-stroke", feedback: "Flushing a catheter that will not aspirate can send thrombus or plaque into the aorta or a coronary.", stateDelta: { stability: -30, flags: ["stroke"] } },
        ],
      },
      {
        id: "c-stroke",
        kind: "consequence",
        prompt: "Minutes later the patient's speech is slurred and his left arm is weak.",
        options: [
          { text: "Stop, call the stroke team now, and get an emergency non-contrast head CT with CT angiography", best: true, feedback: "Brilakis gives emergency head CT and neurology review, because many such patients can benefit from neurointervention; current stroke guidance (AHA/ASA 2019) adds vascular imaging to select patients for mechanical thrombectomy. The heparin given for the PCI bears on whether thrombolysis can be given." },
          { text: "Give more heparin and continue the PCI, reassessing him at the end", feedback: "A new stroke needs urgent imaging and the stroke team before anything else.", stateDelta: { stability: -20 } },
        ],
      },
    ],
    outcome:
      "The LAD is prepared and stented through a 45 cm sheath that protects the old iliac stent and spans the tortuosity, with a guide extension providing the reach. The report records the aneurysm, the wires that crossed, the sheath length and the guide that worked.",
    outcomeVariants: [
      { flag: "dissection", text: "Forcing the wire caused a short iliac retrograde dissection, which sealed without treatment." },
      { flag: "kink", text: "Turning a guide through the tortuous iliac without a long sheath kinked it." },
      { flag: "embolism", text: "A catheter advanced without a wire through the aneurysm caused distal embolism to the foot." },
      { flag: "stroke", text: "Flushing a catheter that would not aspirate caused an embolic stroke." },
    ],
    learningPoints: [
      "A weaker femoral pulse suggests upstream occlusion; review the previous report for tortuosity and kinking.",
      "For complex PCI and hostile iliacs, plan a long sheath; pass existing iliac stents inside one.",
      "Wire resistance: transduce, image from just below, then a different wire with the catheter close behind.",
      "A wire that loops back or swings laterally in the abdomen suggests an aneurysm: exchange over a wire, long sheath across.",
      "Failure to reach the root: stiff wire, long sheath, guide extension or 125 cm guide, checking device lengths.",
      "A catheter that will not aspirate is removed under suction, never flushed.",
    ],
    refs: [...BOOKS, "reifart-parallel-sheath-2014", "powers-acute-stroke-2019"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "diag-root-manifold-ready",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Check the manifold yourself",
    text: "Before the first catheter, confirm the manifold, pressure line and transducer dome are flushed free of air, contrast has been run through without bubbles, and the transducer is calibrated and zeroed through the distal port. Check it even if someone else set it up.",
    tone: "do",
    lessonId: "pm-to-the-root-table",
    sources: [
      { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
      { book: "oxford-cath", loc: "ch 4: Equipment" },
    ],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-root-air-in-line",
    lab: "diagnostic",
    when: { event: ["air"] },
    title: "Air in the line: nothing is injected",
    text: "Any bubble in the manifold, tubing or syringe must be removed before the next injection. Poor manifold preparation and loose connections are among the causes of coronary air embolism; clear the manifold again after each catheter has crossed the aorta.",
    tone: "caution",
    lessonId: "pm-to-the-root-table",
    sources: [
      { book: "brilakis-pci", loc: "25.2" },
      { book: "brilakis-pci", loc: "5.4" },
      { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-root-sheath-aspirate-flush",
    lab: "access",
    when: { phase: ["sheath"] },
    title: "Aspirate the sheath, then flush it",
    text: "Draw 3–4 mL back through the side arm and discard it, then flush with a separate syringe of clean heparinised saline. Do it again before a guide goes in: clot that forms in a sheath is picked up by the next catheter.",
    tone: "do",
    lessonId: "pm-to-the-root-table",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "brilakis-pci", loc: "4.3" },
      { book: "brilakis-pci", loc: "5.4" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-root-prep-outside",
    lab: "diagnostic",
    when: { phase: ["setup", "exchange"] },
    title: "Prepare catheters before they go in",
    text: "Flush a diagnostic catheter and load it over the 0.035 or 0.038 inch wire before inserting it. Fit a guide with its haemostatic valve and flush it outside the body; bleeding through a 7 Fr, and even more an 8 Fr, guide without a valve can be severe.",
    tone: "do",
    lessonId: "pm-to-the-root-table",
    sources: [{ book: "brilakis-pci", loc: "5.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-root-no-hydrophilic-through-needle",
    lab: "access",
    when: { phase: ["wire"] },
    title: "No hydrophilic wire through the needle",
    text: "A polymer-jacketed hydrophilic wire must not be passed or manipulated through an access needle: the jacket can be sheared off as the wire is withdrawn. Use it once a sheath or catheter protects it.",
    tone: "caution",
    lessonId: "pm-to-the-root-table",
    sources: [
      { book: "brilakis-pci", loc: "5.2" },
      { book: "oxford-cath", loc: "ch 4: Equipment" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-root-match-curve-to-route",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Pick the curve for the route and the root",
    text: "Femoral or left radial: JL4 and JR4. Right radial: JL3.5 or a universal radial catheter, and JR4. Go shorter for a small root or short patient; a longer arm (JL5 or JL6) can help in a dilated root or a very tall patient; a dilated ascending aorta's diameter in cm plus 1 gives the JL size.",
    tone: "do",
    lessonId: "pm-to-the-root-choice",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
      { book: "brilakis-pci", loc: "30.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-root-previous-catheters",
    lab: "diagnostic",
    when: { phase: ["setup", "finish"] },
    title: "Read the last report, write the next one",
    text: "Before starting, check which catheters were used before and what went wrong; if one access site failed to engage, choose another. At the end, record the catheters that worked so the next operator can do the same.",
    tone: "do",
    lessonId: "pm-to-the-root-choice",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
      { book: "brilakis-pci", loc: "1.5" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-root-wire-leads",
    lab: "diagnostic",
    when: { phase: ["advance"] },
    title: "The wire leads, always",
    text: "Advance the J-wire and catheter together under fluoroscopy with the wire tip ahead of the catheter tip, up to the aortic cusps; then fix the wire and advance the catheter over it. From the radial, the wire reaches the root before any catheter crosses the brachial and subclavian arteries.",
    tone: "do",
    lessonId: "pm-to-the-root-advance",
    sources: [
      { book: "brilakis-pci", loc: "5.2" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-root-wire-out-of-ventricle",
    lab: "diagnostic",
    when: { phase: ["advance"], engagement: ["below-valve", "in-lv"] },
    title: "Keep the wire out of the ventricle",
    text: "A 0.035 inch wire that slips through the valve can trigger ventricular arrhythmias. Watch its tip and pull it back into the aortic root before advancing the catheter further.",
    tone: "caution",
    lessonId: "pm-to-the-root-advance",
    sources: [{ book: "brilakis-pci", loc: "5.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-root-backbleed-guide",
    lab: "diagnostic",
    when: { phase: ["advance", "exchange"], catheter: ["EBU", "AL", "JL", "MP"] },
    title: "Clear the catheter before connecting",
    text: "Guides scrape aortic debris on the way up (JL and multipurpose shapes most often in Keeley's series), and any catheter can pick up clot from the sheath. Aspirate every catheter onto gauze and look for clot or glistening plaque; let large guides back-bleed. Connect only when the return is clean, while the manifold is flushing.",
    tone: "do",
    lessonId: "pm-to-the-root-advance",
    sources: [
      { book: "brilakis-pci", loc: "5.3" },
      { book: "brilakis-pci", loc: "5.4" },
    ],
    refs: ["brilakis-manual-pci", "keeley-aortic-debris-1998"],
  },
  {
    id: "diag-root-resistance-transduce-image",
    lab: "diagnostic",
    when: { phase: ["advance"], event: ["radial-loop", "subclavian-tortuosity", "radial-spasm"] },
    title: "Resistance: transduce, image, then choose",
    text: "Do not push. Check for an arterial waveform (sheath for a wire, catheter tip for a catheter): none suggests a subintimal position or, from the radial, severe spasm. Then inject from just below the obstacle and treat what you see: different wire with the catheter close behind, long sheath, balloon-assisted tracking or vasodilator. Change access if crossing fails.",
    tone: "bailout",
    lessonId: "pm-to-the-root-radial",
    sources: [
      { book: "brilakis-pci", loc: "5.2" },
      { book: "brilakis-pci", loc: "5.3" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-root-balloon-assisted-tracking",
    lab: "diagnostic",
    when: { phase: ["advance", "exchange"], event: ["radial-loop"] },
    title: "Catheter catching at a loop: balloon-assisted tracking",
    text: "With a coronary wire across, inflate a small compliant balloon matched 1:1 to the catheter, half out of its tip at 3–6 atm and advance the two together. The balloon, not the catheter edge, meets the wall.",
    tone: "do",
    lessonId: "pm-to-the-root-radial",
    sources: [
      { book: "brilakis-pci", loc: "5.3" },
      { book: "brilakis-pci", loc: "29.2" },
    ],
    refs: ["brilakis-manual-pci", "patel-balloon-assisted-tracking-2014"],
  },
  {
    id: "diag-root-descending-aorta-breath",
    lab: "diagnostic",
    when: { phase: ["advance"], event: ["subclavian-tortuosity"] },
    title: "Wire down the descending aorta: deep breath",
    text: "If the wire keeps entering the descending aorta from the right subclavian, ask the patient to take a deep breath as you advance it out of the subclavian; it may then enter the ascending aorta. Keep the catheter close behind the wire tip for support.",
    tone: "do",
    lessonId: "pm-to-the-root-radial",
    sources: [
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
      { book: "brilakis-pci", loc: "5.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-root-lusoria-change-artery",
    lab: "diagnostic",
    when: { event: ["subclavian-tortuosity"], phase: ["advance", "engage-left", "engage-right"] },
    title: "Extreme subclavian tortuosity or lusoria: change artery",
    text: "With extreme right subclavian tortuosity or an aberrant right subclavian (arteria lusoria), move to the left radial or the femoral artery. In a STEMI, convert to femoral promptly if the radial route is delaying reperfusion.",
    tone: "bailout",
    lessonId: "pm-to-the-root-radial",
    sources: [
      { book: "brilakis-pci", loc: "5.4" },
      { book: "brilakis-pci", loc: "20.4" },
      { book: "brilakis-pci", loc: "1.4" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-root-femoral-no-waveform",
    lab: "access",
    when: { phase: ["femoral"], route: ["femoral"] },
    alsoIn: [{ lab: "diagnostic", phase: ["advance"] }],
    title: "Wire resistance: transduce the femoral sheath",
    text: "If the wire meets resistance, transduce the sheath side arm. No arterial waveform suggests a subintimal sheath: stop, and change access site rather than force on. Short retrograde dissections usually seal with forward flow.",
    tone: "caution",
    lessonId: "pm-to-the-root-femoral",
    sources: [{ book: "brilakis-pci", loc: "5.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-root-iliac-long-sheath",
    lab: "access",
    when: { phase: ["femoral", "sheath"], route: ["femoral"] },
    alsoIn: [{ lab: "diagnostic", phase: ["advance"] }],
    title: "If the iliac is hostile: a long sheath across it",
    text: "Only if the iliac artery is severely tortuous or stenosed: once across a very tortuous iliac, a long sheath (25 or 45 cm), which may be 1 Fr larger than the catheter; across a severe stenosis, a 45 or 55 cm sheath as a rule, dilating first if needed. Pass existing iliac stents inside a long sheath, and avoid placing a new iliac stent before the coronary PCI is finished: the guide can dislodge it.",
    tone: "do",
    lessonId: "pm-to-the-root-femoral",
    sources: [
      { book: "brilakis-pci", loc: "5.3" },
      { book: "brilakis-pci", loc: "30.1" },
      { book: "brilakis-pci", loc: "4.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-root-iliac-kink-long-sheath",
    lab: "diagnostic",
    when: { event: ["catheter-kink"], phase: ["advance", "engage-left", "engage-right"] },
    title: "Tip not following the hub: stop turning",
    text: "When tortuosity stops the tip following the hub, stop turning before the catheter kinks. Once it is safely out or straightened, a long sheath across the tortuous segment, or a different access site (for example left radial or femoral in extreme subclavian tortuosity), helps prevent the next kink; leaving a 0.035 inch wire inside while manipulating also helps.",
    tone: "caution",
    lessonId: "pm-to-the-root-femoral",
    sources: [
      { book: "brilakis-pci", loc: "5.4" },
      { book: "brilakis-pci", loc: "30.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-root-aneurysm-suspect",
    lab: "access",
    when: { phase: ["femoral", "wire"], route: ["femoral"] },
    alsoIn: [{ lab: "diagnostic", phase: ["advance"] }],
    title: "If the wire loops in the abdomen: think aneurysm",
    text: "If a wire or catheter loops back or swings laterally in the descending aorta, suspect an abdominal aortic aneurysm. Image it, cross with a suitable wire, make every exchange over a wire, and once across consider a long sheath through it.",
    tone: "caution",
    lessonId: "pm-to-the-root-femoral",
    sources: [
      { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
      { book: "brilakis-pci", loc: "5.2" },
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "keeley-aortic-debris-1998",
    kind: "paper",
    citation:
      "Keeley EC, Grines CL. Scraping of aortic debris by coronary guiding catheters: a prospective evaluation of 1,000 cases. J Am Coll Cardiol. 1998;32:1861–1865.",
    url: "https://doi.org/10.1016/s0735-1097(98)00497-5",
    note: "PMID: 9857864. Checked on PubMed: authors, title, journal, year, volume 32, issue 7, pages 1861–1865.",
    verified: true,
  },
  {
    id: "patel-balloon-assisted-tracking-2014",
    kind: "paper",
    citation:
      "Patel T, Shah S, Pancholy S, Rao S, Bertrand OF, Kwan T. Balloon-assisted tracking: a must-know technique to overcome difficult anatomy during transradial approach. Catheter Cardiovasc Interv. 2014;83:211–220.",
    url: "https://doi.org/10.1002/ccd.24959",
    note: "PMID: 23592578. Checked on PubMed: authors, title, journal, volume 83, issue 2, pages 211–220 (first published online 2013; print 2014).",
    verified: true,
  },
  {
    id: "reifart-parallel-sheath-2014",
    kind: "paper",
    citation:
      "Reifart N, Sotoudeh N. The parallel sheath technique in severe iliac tortuosity: a simple and novel technique to improve catheter manoeuvrability. EuroIntervention. 2014;10:231–235.",
    url: "https://doi.org/10.4244/EIJV10I2A37",
    note: "PMID: 24080523. Checked on PubMed: authors, title, journal, year, volume 10, issue 2, pages 231–235.",
    verified: true,
  },
  {
    id: "powers-acute-stroke-2019",
    kind: "guideline",
    citation:
      "Powers WJ, Rabinstein AA, Ackerson T, et al. Guidelines for the early management of patients with acute ischemic stroke: 2019 update to the 2018 guidelines for the early management of acute ischemic stroke. A guideline for healthcare professionals from the American Heart Association/American Stroke Association. Stroke. 2019;50:e344–e418.",
    url: "https://doi.org/10.1161/STR.0000000000000211",
    note: "PMID: 31662037. Checked on PubMed: authors, title, journal, year, volume 50, issue 12, pages e344–e418. Used for vascular imaging alongside non-contrast CT to select patients for mechanical thrombectomy, and anticoagulant exposure as a consideration for thrombolysis.",
    verified: true,
  },
];
