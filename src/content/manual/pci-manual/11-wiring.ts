// Module pm-wiring: guide and wire, getting to and across the lesion (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.5, 1.8, 5.1, 5.5, 5.7, 5.8, 8.1-8.10, 9.7, 12, 16.2, 18.8, 25.2, 28.1, 30.2, 30.5, 30.6, 30.7;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapters 2, 4, 6, 8, 10.
// Every claim is listed with its page in docs/curriculum/evidence/pm-wiring.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-wiring",
  title: "Guide and wire: getting to and across the lesion",
  stage: 3,
  summary:
    "The platform and the rail of every PCI: choosing a guide for the access route, the target and the aorta; seating it coaxially and shallow with an undamped trace; choosing, shaping and loading the 0.014 inch wire; steering it to, across and beyond the lesion; beating tortuosity and recognising pseudolesions; and using a microcatheter, then removing it without losing the wire.",
  objectives: [
    "Choose a guide shape, curve size, French size and length from the access route, the target vessel, the aortic root and the equipment the case may need, and explain what gives a guide its support.",
    "Seat a guide for PCI that is undamped, coaxial in two orthogonal views and about 2–3 mm into the ostium, and manage damping on an ostial lesion or small vessel by working with the guide disengaged over a wire.",
    "Select a 0.014 inch wire from the seven wire categories using a stepwise escalate and de-escalate approach, and say when a support or atherectomy wire replaces the crossing wire.",
    "Shape a wire tip to the vessel and the task, load it through the introducer and haemostatic valve without damage, and bring it to the guide tip without letting it escape into the artery.",
    "Steer a wire to, across and beyond the lesion with the right views, a free tip and intermittent injections, confirm a true-lumen distal position, and keep watching the tip for the rest of the case.",
    "Apply the four solutions for wiring through tortuosity, including the reversed (hairpin) wire and the deflection balloon, and tell a pseudolesion from spasm and dissection.",
    "Decide when a microcatheter is needed, choose among its five categories, and remove it over a short wire by trapping, hydraulic exchange, an extension wire or circumcision.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-guide-choice",
      title: "Choosing the guide: shape, curve, French size and length",
      minutes: 14,
      topics: ["pci-guide-selection"],
      sources: [
        { book: "brilakis-pci", loc: "5.1" },
        { book: "brilakis-pci", loc: "1.5" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
      ],
      refs: [...BOOKS, "esc-acs-2023", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Every balloon, stent, imaging catheter and wire you use rides on the guide. If the guide backs out of the ostium when a stent meets resistance, the stent stalls, the picture is lost and the wire can be dragged back across the lesion. Brilakis ranks guide selection among the most critical decisions for success, efficiency and safety, and Oxford puts the same point the other way round: strong back-up can make a complex case straightforward, while weak back-up can make even a simple one difficult. The guide catheter lessons in the Core PCI track list the shapes; this lesson works through the decision the way you make it before the case starts.",
        },
        {
          kind: "p",
          text: "Brilakis bases the choice on three facts: the **access route** (radial or femoral), the **target vessel**, and the **size of the aorta**. Oxford adds a fourth: what the case may need later, because swapping guides halfway through a PCI is cumbersome. Choose the shape for support, then the French size for both support and the equipment you expect to use.",
        },
        { kind: "h", text: "Why a guide is not just a large diagnostic catheter" },
        {
          kind: "table",
          caption: "A 6 Fr diagnostic catheter and a 6 Fr guide compared (Brilakis table 30.3 and Oxford)",
          head: ["Feature", "6 Fr diagnostic", "6 Fr guide"],
          rows: [
            ["Outer diameter", "0.079 in (2 mm)", "0.079 in (2 mm)"],
            ["Inner diameter", "0.057 in (1.45 mm)", "0.070–0.072 in (1.78–1.83 mm), depending on the maker (Brilakis's comparison table gives the range as 0.069–0.072 in)"],
            ["Wall", "Two layers, thicker", "Three layers: Oxford describes a polyurethane outer coat that keeps the shape, a woven metal mesh for stiffness, and a PTFE lining that cuts friction. The mesh lets the wall be thin without collapsing"],
            ["Handling", "Transmits torque more faithfully and kinks less", "Thinner walled, so it handles differently; Oxford warns trainees not to expect it to behave like its diagnostic twin"],
            ["Tip", "Firmer", "Softer, so it can stay engaged longer and sit deeper with less risk of dissection"],
          ],
        },
        {
          kind: "p",
          text: "Two practical consequences follow. First, the thin wall gives a 6 Fr guide enough lumen, in Oxford's words, to carry two balloon or stent catheters at once. Second, because a diagnostic catheter steers better, Brilakis falls back on one when a guide will not engage: engage and wire the artery with the diagnostic catheter, then exchange it for the guide over a 300 cm supportive 0.014 inch wire (the exchange itself is taught in the module 'Engaging the coronary arteries').",
        },
        { kind: "h", text: "What support is, and what buys it" },
        {
          kind: "p",
          text: "Oxford defines support (back-up) as the guide's ability to hold its position while you push wires, balloons and stents forward. Every forward push into a tortuous or calcified artery creates friction that drives the guide backwards out of the ostium; if it comes out, you lose the view and can lose all your equipment from the vessel. The harder the anatomy, the more support you need. Brilakis lists what makes a guide hold its ground.",
        },
        {
          kind: "table",
          caption: "Design choices that set support (Brilakis 9.7, Oxford ch 8)",
          head: ["Factor", "More support", "Less support", "The price"],
          rows: [
            [
              "French size",
              "7 or 8 Fr (Oxford ranks 8 F above 7 F above 6 F)",
              "5 or 6 Fr",
              "Damping is common with large guides such as 8 Fr, especially at ostial lesions, and Oxford lists manipulation of 7–8 F guides among causes of left main dissection",
            ],
            [
              "Shape",
              "Extra-support left curves (EBU, XB, Voda) rather than a JL4; AL1 rather than JR4 for the RCA. Extra-support shapes brace against the far wall of the ascending aorta",
              "Judkins shapes",
              "Brilakis singles out aggressive shapes such as the AL as needing careful manipulation because of the risk of dissection",
            ],
            [
              "Access route",
              "Femoral, and long sheaths. From the arm, the left radial suits RCA PCI and the right radial suits left coronary PCI",
              "Radial",
              "Support is not the only consideration. Current ESC guidelines make radial access the standard approach: for acute coronary syndromes unless procedural considerations override it (2023, class I), and as the preferred site for invasive angiography in chronic coronary syndromes (2024, class I). Femoral access is chosen for support only when the case needs it (module 'Arterial and venous access')",
            ],
            [
              "Seating",
              "Deep intubation, usually only in the RCA or a vein graft and rarely on the left",
              "Shallow, coaxial seating",
              "Deep seating can dissect. It is an escalation, not a starting position",
            ],
          ],
        },
        {
          kind: "p",
          text: "Pushing the guide forward, deep intubation, guide extensions and anchor balloons add support once the case is under way; they are taught with device delivery in the module 'Lesion preparation and stenting'. The cheapest support is the support you choose at the start.",
        },
        {
          kind: "check",
          stem: "You are planning PCI of a calcified mid-RCA lesion through the right radial artery. Which guide follows Brilakis's advice?",
          options: [
            "A 6 Fr JR4, because it seats with the least manipulation and rarely damps",
            "A 6 Fr JL4 turned clockwise into the right sinus, to use the larger curve",
            "A 6 Fr AL1, because JR guides from the radial often give poor support",
            "A 6 Fr multipurpose, because it gives the strongest support in a native RCA",
          ],
          answer: 2,
          explanation:
            "Brilakis prefers an AL guide for RCA PCI from the radial (the Ikari right and 3D Right shapes are also listed) and advises against JR guides there because their support is often poor. A JR4 is a reasonable femoral guide for a straightforward RCA lesion, which is why it tempts, but a calcified lesion from the arm needs more back-up. Multipurpose shapes are not in his radial RCA list.",
        },
        { kind: "h", text: "Matching the shape to the target" },
        {
          kind: "table",
          caption: "Guide shapes for PCI by target and route (built from Brilakis 5.7 and 30.2.6, with Oxford's support grading)",
          head: ["Target", "Femoral PCI", "Radial PCI", "Points to remember"],
          rows: [
            [
              "Left main and LAD",
              "An extra-support family (EBU, XB, Voda). Brilakis uses an EBU 3.75 or XB 3.5 in most cases, and a smaller curve (EBU 3.0 or 3.5) favours the LAD",
              "EBU or XB families, or the Ikari left",
              "Brilakis generally avoids JL guides for PCI because of weak support. Oxford grades the LAD options from JL3.5/4 (least support) through AL2 to XB/EBU 3.5 (most)",
            ],
            [
              "Circumflex",
              "A larger extra-support curve: EBU, XB or Voda 4.0 (Brilakis also mentions EBU 4.5)",
              "The same families in the larger size",
              "Oxford grades JL4/5 least, AL2 middle and Voda/XB/EBU 3.5–4 most",
            ],
            [
              "RCA",
              "JR4 for straightforward lesions; AL1 for complex work such as an RCA CTO, because AL guides give the strongest support; the 3D Right is also listed",
              "AL1, Ikari right or 3D Right; avoid JR guides",
              "Oxford grades JR4 least (more if carefully deep-throated without trauma), AR1/2 middle, hockey stick or AL1/2 most. The Williams right engages with little or no manipulation and helps with aorto-ostial RCA lesions",
            ],
            [
              "LIMA or RIMA graft",
              "A JR4 engages most; the IM curve has a larger distal bend and engages more easily",
              "Brilakis does not divide the IM shapes by route; of them, only the Bartorelli-Cozzi shape is described as designed for the LIMA from the left radial",
              "A modified IM curve and the Bartorelli-Cozzi shape both have an even larger distal bend than the IM. Most IM guides are 90 cm long so that equipment reaches distal targets",
            ],
            [
              "Left-sided vein graft",
              "An AL guide engages more easily and supports more strongly for PCI; multipurpose and LCB shapes usually support less",
              "AL guide",
              "A JR4 is usually enough for the diagnostic run",
            ],
            [
              "Right-sided vein graft",
              "JR4 or multipurpose; a dedicated RCB shape exists",
              "As for femoral",
              "These grafts usually leave the aorta pointing downward",
            ],
          ],
        },
        {
          kind: "p",
          text: "The two manuals differ slightly on default left curve sizes: Brilakis's engagement chapter pairs EBU 3.0–3.5 with the LAD and EBU 4.0–4.5 with the circumflex, his equipment chapter names EBU 3.75 or XB 3.5 as the usual choice, and Oxford lists XB/EBU 3.5 for the LAD and 3.5–4 for the circumflex. The principle is shared: a smaller curve for the LAD, a larger one for the circumflex, and an extra-support family rather than a Judkins left.",
        },
        { kind: "h", text: "Curve size and the aortic root" },
        {
          kind: "list",
          items: [
            "**What the number means.** On a JR, the number is the length in centimetres of the secondary curve (3.5, 4 and 5 are made). On a JL, it is the distance in centimetres between the primary and secondary curves (3.5, 4, 5 and 6).",
            "**Bigger root, bigger curve.** Brilakis sizes diagnostic and guide catheters to the aortic root. In a dilated ascending aorta, add 1 to its diameter in centimetres to get the JL size: a 4 cm aorta takes a JL5.",
            "**A dilated root also turns.** It rotates anticlockwise and carries the RCA forward, so AR1 or AR2, or AL1 or AL2, shapes may engage it more easily.",
            "**Look before you choose.** Brilakis's engagement checklist asks for the aortic CT (dilation, anomalous coronaries), aortic stenosis or regurgitation (often with a dilated ascending aorta that needs larger catheters), the catheters that worked at earlier procedures, and whether engagement was difficult from one route last time, in which case he switches route, for example to femoral.",
          ],
        },
        {
          kind: "check",
          stem: "CT shows an ascending aorta of 5 cm in a man listed for PCI. The JL4 used at his diagnostic study never seated. Using Brilakis's rule of thumb, which JL size fits this aorta, and what follows for the PCI guide?",
          options: [
            "JL6, and the PCI guide should likewise be a larger curve than usual",
            "JL5, and the guide can stay at the usual size because guides are softer",
            "JL4, because the failed engagement was more likely a technique problem",
            "JL3.5, because a dilated aorta rotates and brings the ostium closer",
          ],
          answer: 0,
          explanation:
            "Diameter in centimetres plus one gives the JL size, so a 5 cm aorta takes a JL6. Brilakis applies the same root-size logic to guides: larger roots need larger catheters, so the extra-support guide should also be a bigger curve. The rotation of a dilated root mainly moves the RCA anteriorly; it does not make a smaller left curve fit.",
        },
        { kind: "h", text: "French size, lumen and length" },
        {
          kind: "list",
          items: [
            "**Most PCI fits a 6 Fr guide.** Brilakis moves to 7 or 8 Fr for more support, better opacification, or equipment that needs the room: 2.0 mm rotational atherectomy burrs need 7 Fr, and so do V-stenting and simultaneous kissing stents.",
            "**Plan the size with the strategy.** Oxford advises anticipating atherectomy or a complex two-stent technique before you start, so you do not have to change guides in the middle of the PCI. The planning module's tip below gives the radial options.",
            "**Lumen varies by maker.** Outer diameters are fixed by the French size (5 Fr 0.066 in or 1.67 mm; 6 Fr 0.079 in or 2.0 mm; 7 Fr 0.092 in or 2.33 mm; 8 Fr 0.105 in or 2.67 mm), but inner diameters differ with wall thickness: in Brilakis's table a 6 Fr guide ranges from 0.070 to 0.072 in (1.78–1.83 mm), a 7 Fr is about 0.081 in (2.06 mm) and an 8 Fr 0.090–0.091 in (2.29–2.31 mm). For complex combinations, check that the planned devices fit together; Brilakis points to a compatibility app for this.",
            "**Smaller has advantages too.** Oxford notes that routine 6 F guides, and 5 F guides from the radial, have brought better handling and fewer access-site complications.",
            "**Length.** Most guides are 100 cm. A 90 cm guide helps in retrograde CTO PCI and when equipment must reach very distal targets, for example native vessels treated through a bypass graft; a 125 cm guide may be needed in very tall patients or very tortuous aortas. Shortening a guide by hand is taught in the module 'Sheaths, guides and guide extensions'.",
            "**Side holes are a choice, not a default.** Brilakis would consider them for ostial RCA or ostial graft lesions (they reduce damping, let some blood flow on and may lower the risk of hydraulic dissection) but they give false reassurance, because hydraulic dissection can still happen, and they raise contrast use and degrade images. He would not use them in an unprotected left main except for an ostial left main CTO: a poor guide position there may go unnoticed, cutting left main flow until global ischaemia and haemodynamic collapse follow. Depending on their preference and comfort, operators often choose careful, active handling of a standard guide instead. When dissection and re-entry is used to cross a CTO, damping is actually wanted, because it limits antegrade flow and the growth of the subintimal haematoma. Side holes can be cut by hand (Brilakis mentions a scalpel, or a needle of 18–23 gauge), but hand-made holes can stop a guide extension advancing inside the guide, weaken the guide so that it kinks, and burst a trapping balloon inflated next to them. The details are in the module 'Engaging the coronary arteries'.",
          ],
        },
        { kind: "tip", id: "pci-guide-left-extra-support" },
        { kind: "tip", id: "pci-guide-rca-support" },
        { kind: "tip", id: "pci-planning-guide-size" },
        {
          kind: "pitfalls",
          items: [
            "Reaching for a JL guide for left coronary PCI because a JL engaged well at the diagnostic study: Brilakis generally avoids JL guides for PCI because of weak support.",
            "A JR guide for a complex RCA lesion, above all from the radial, where Brilakis prefers an AL.",
            "Ignoring the root: a curve too small or too large for the aorta is a recognised cause of failure to engage.",
            "Starting a case planned for a 2.0 mm burr or a two-stent technique in a 6 Fr guide, then exchanging guides across a half-treated lesion.",
            "Assuming every 6 Fr guide has the same lumen; inner diameters differ by maker.",
            "Choosing a side-hole guide for an unprotected left main.",
          ],
        },
        {
          kind: "pearl",
          text: "Pick the guide after you have decided how the case will end. If the plan could need atherectomy, two stents or a hard push through calcium, the guide that is merely adequate for the first angiogram is the wrong guide.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "From the right radial, choose a guide for each target and say why before you engage: an EBU 3.5 for a proximal LAD lesion, an EBU 4.0 for a circumflex lesion and an AL1 for a mid-RCA lesion. Then repeat the left choices from the femoral route and name what the change of route does to support.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, before each scenario (focal mid-LAD, calcified mid-RCA, circumflex STEMI, mid-RCA CTO) write down the guide shape, curve, French size and length you would choose, the support you expect from it, and the equipment in your plan that sets the minimum French size. Compare with the guide the scenario provides.",
        },
        { kind: "video", id: "fV-kGVoWpag", note: "Case: the AL guide." },
        { kind: "video", id: "03sn2Vsphcc", note: "Case: troubleshooting radial guide support." },
        { kind: "video", id: "Bn2rLN_FqsE", note: "Left extra-support guide manipulations from the radial and femoral routes, the Ikari left, and tips for left coronary engagement." },
        { kind: "video", id: "DCYUM9LhZA0", note: "Amplatz left guide manipulation, other RCA guides and RCA engagement caveats." },
        {
          kind: "keypoints",
          items: [
            "Choose from the access route, the target vessel, the aortic root and the equipment the case may need.",
            "Support comes from French size, shape, access route and seating; choose it at the start, escalate later.",
            "Left: an extra-support family, smaller curve for the LAD, larger for the circumflex; JL guides give weak support.",
            "RCA: JR4 for simple femoral cases, AL1 for complex ones; from the radial prefer AL1, Ikari right or 3D Right over JR.",
            "Dilated ascending aorta: JL size is the diameter in centimetres plus one; the root rotates anticlockwise and the RCA moves anterior.",
            "6 Fr suits most PCI; 2.0 mm burrs, V-stenting and simultaneous kissing stents need 7 Fr. Inner diameters vary by maker.",
            "100 cm is standard; 90 cm for retrograde CTO or distal targets via grafts; 125 cm for very tall patients or tortuous aortas.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-guide-seat",
      title: "Seating the guide for PCI: coaxial, shallow and undamped",
      minutes: 13,
      topics: ["pci-guide-engagement"],
      sources: [
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "5.8" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "6.2" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "8.6" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
        { book: "oxford-cath", loc: "ch 10: Iatrogenic type A aortic dissection" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A diagnostic catheter only has to stay in the ostium for a few injections. A guide has to stay there, steady and harmless, while wires, balloons and stents are pushed through it for an hour. Oxford stresses that a stable coaxial position is particularly important in PCI. The general engagement manoeuvres, the damping algorithm and failed engagement are taught in the module 'Engaging the coronary arteries'; this lesson covers what changes when the catheter is a guide and the job is an intervention.",
        },
        { kind: "h", text: "Brilakis's three marks of a good guide position" },
        {
          kind: "table",
          head: ["Mark", "How you check it", "Why it matters for PCI"],
          rows: [
            ["No damping", "The trace is the same aortic waveform you recorded in the root", "A damped guide is obstructing the ostium: injecting through it risks dissection, and leaving it there causes ischaemia"],
            ["Coaxial", "The tip points along the axis of the proximal vessel in two orthogonal projections, not one", "A non-coaxial tip can tent the ostium and dissect it, as a coronary or an aorto-coronary dissection, and a wire may not leave it cleanly"],
            ["About 2–3 mm deep", "The tip sits just inside the ostium", "Deeper seating adds support but can dissect the vessel, damp the trace and cause ischaemia"],
          ],
        },
        {
          kind: "steps",
          title: "Seating a guide, step by step",
          items: [
            {
              title: "Prepare it as you would any catheter",
              detail:
                "In the root: aspirate and discard 2–3 mL, connect to the manifold while it flushes, confirm the aortic trace and note the ECG (module 'Engaging the coronary arteries').",
            },
            {
              title: "Engage with the shape's own manoeuvre",
              detail:
                "Femoral left (JL, XB, EBU): loop the 0.035 inch J-wire over the valve, bring the guide tip to 2–3 cm above the floor of the right cusp at the wire's upward turn, then withdraw the wire and let the tip drop into the left cusp and the ostium; a little anticlockwise rotation may help because the left main usually lies posteriorly. Femoral RCA with a JR4: to the floor of the right cusp, wire out, back a few centimetres, then clockwise with back-and-forth movement. AL1: advance until the tip points upward, then rotate into the RCA ostium. From the radial, universal or standard shapes are used as in the engagement module.",
            },
            {
              title: "Grafts have their own manoeuvres",
              detail:
                "Left-sided vein grafts: move the catheter up and down with the left hand, several centimetres at a time between the aortic cusp and the origin of the brachiocephalic trunk, turning it gently with the right hand after each movement. Right-sided vein grafts: work in LAO, turn the catheter (usually a multipurpose or RCB shape) until it points towards the patient's right in that view, then move it up and down until it engages. Internal mammary grafts: advance the catheter over a 0.035 inch wire beyond the graft origin, then pull it back while turning anticlockwise, preferably in RAO; if severe proximal tortuosity makes the catheter hard to handle (and prone to kinking), a long sheath can help. Graft PCI as a whole is taught in the module 'Patients with bypass grafts'.",
            },
            {
              title: "Read the trace at once",
              detail: "Brilakis repeats the pressure check straight after engaging (his step 8). If it has damped or ventricularised, nothing is injected; go to the next section.",
            },
            {
              title: "Confirm coaxiality in two views",
              detail: "One projection can make a tip pointing at the wall look aligned. Check in an orthogonal pair before any wire goes in.",
            },
            {
              title: "Set the depth",
              detail: "About 2–3 mm in. If the guide has dived deeper, ease it back towards the ostium.",
            },
            {
              title: "Keep checking for the rest of the case",
              detail:
                "Guides move. After each balloon or stent comes out, Brilakis aspirates and flushes the guide and confirms engagement again, because the guide can have backed out or dived in during the withdrawal.",
            },
          ],
        },
        {
          kind: "check",
          stem: "An EBU 3.5 drops into the left main from the femoral route. The trace is unchanged from baseline, and in LAO caudal the tip looks aligned with the left main. What do you do before passing the wire?",
          options: [
            "Pass the wire now; an undamped trace and one aligned view prove a coaxial position",
            "Advance the guide deeper into the left main first to build support before wiring starts",
            "Inject forcefully to make sure the whole left system opacifies through the guide",
            "Check the alignment in an orthogonal view as well and confirm the tip is about 2–3 mm in",
          ],
          answer: 3,
          explanation:
            "Brilakis's optimal engagement needs all three: no damping, coaxial alignment confirmed in orthogonal projections, and a depth of about 2–3 mm. One view can hide a tip pointing at the wall. Deep seating buys support at the cost of dissection, damping and ischaemia, so it is not the default; forceful injection is a recognised cause of dissection.",
        },
        { kind: "h", text: "When the guide damps after it engages" },
        {
          kind: "p",
          text: "Beyond the causes that apply to any catheter (wall contact, deep or subselective seating, debris, a kink, a transducer fault), Brilakis names two that come up repeatedly once a guide is in: an **ostial lesion** and a **target vessel too small** for the guide. Damping is common, he adds, with ostial lesions and with large guides such as 8 Fr. The answer is not to inject harder or to push on; it is to change how the guide is used.",
        },
        {
          kind: "steps",
          title: "Working with a guide that damps",
          items: [
            {
              title: "Disengage until the trace recovers",
              detail:
                "Never inject into a damped or ventricularised guide. Take aggressive shapes such as an Amplatz off the ostium with care rather than with a straight pull (how to lift an Amplatz out is taught in the Academy diagnostic lesson 'Catheter anatomy and the main shapes'). If the trace does not recover once the guide is off the ostium, the cause is not the lesion: follow the damping algorithm in the engagement module (aspirate, check the transducer, look for a kink) and, if these steps fail, remove the guide while aspirating with a syringe, without injecting and without passing a wire through it.",
            },
            {
              title: "Put a 0.014 inch wire into the vessel",
              detail:
                "With the wire in place, the guide can sit just outside the ostium and still be steered back in. Engage only when you need to: to inject contrast or to advance a device, then disengage again (intermittent engagement). Once a wire is down the vessel, Brilakis takes the guide off the ostium by torquing it to a non-coaxial position rather than pulling it back, because pulling back can cost the distal wire position (modules 'Engaging the coronary arteries' and 'Ostial lesions').",
            },
            {
              title: "If the problem persists, change the guide",
              detail:
                "A smaller French size, or a shape less inclined to seat deeply. For an ostial lesion, Brilakis also mentions reshaping the guide tip by hand. For a small vessel, the smaller French size is the usual answer.",
            },
            {
              title: "Consider side holes only with their limits in mind",
              detail:
                "They can help at an ostial RCA or ostial graft lesion, but they mask damping, still allow hydraulic dissection, add contrast and degrade images, and an unprotected left main is no place for them.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Why the left main deserves extra respect.** Oxford lists the ways a left main is dissected during PCI: manipulating the guide (especially 7 or 8 F), injecting contrast while the guide tip points at the roof of the left main, wiring (more likely with polymer-jacketed and hydrophilic-coated wires), balloon dilatation and stent edges. It is rare (Oxford quotes 0.02%) but puts a very large territory at risk at once. Oxford's management turns on two questions, whether the bifurcation is involved and whether the patient is stable: with the bifurcation spared, PCI (or, for a small dissection in a stable patient with normal flow, observation); with the bifurcation involved in a stable patient, surgery becomes the reference treatment, with two-stent PCI as the alternative; when the patient is unstable, PCI usually has to be offered at once, with two-stent techniques if the bifurcation is involved. Have femoral access ready for circulatory support, and confirm that each wire is in the true lumen with IVUS rather than OCT, because the contrast OCT needs can expand the false lumen. Brilakis adds gentle withdrawal of the guide, wiring the true lumen with a workhorse wire, and intravascular imaging to make sure the stent covers an ostial dissection completely.",
        },
        {
          kind: "p",
          text: "**The aorta can tear too.** A guide can tear the aortic intima close to an ostium and start an iatrogenic type A aortic dissection (Oxford quotes 0.01%). Oxford notes that it usually behaves better than a spontaneous dissection, because the aortic wall is healthy, so a conservative approach can be considered first, with CT after the procedure and again at 24 hours. If the dissection clearly began at a coronary ostium, stenting the ostium can seal the entry. Surgery is considered if it spreads to the neck vessels with neurological symptoms, if a pericardial effusion appears or grows, if severe aortic regurgitation develops, or if the patient becomes haemodynamically unstable.",
        },
        {
          kind: "p",
          text: "**A low trace is not always the patient.** Brilakis lists causes of false hypotension that belong to the guide and its connections: an open haemostatic valve on the Y-connector, an open or air-filled line to the transducer, damping, a guide blocked by air, thrombus or contrast, and bulky equipment inside the guide. Check these before you treat; the monitoring module's tip below gives the sequence.",
        },
        { kind: "tip", id: "pci-mon-false-hypotension" },
        { kind: "h", text: "How the guide decides where the wire goes" },
        {
          kind: "p",
          text: "Many wiring problems are guide problems. Brilakis traces two of them back to engagement:",
        },
        {
          kind: "list",
          items: [
            "**The wire will not leave the guide tip.** Usually the guide is not seated well. Prevent it with a coaxial, not-too-deep, undamped position. Treat it by repositioning the guide, changing the wire's tip shape, or leaving that wire where it is and wiring with a second one.",
            "**The wire keeps entering the wrong branch.** If it keeps going into the conus branch of the RCA, withdraw the guide a little and re-seat it coaxially. If it keeps going into the circumflex when the target is the LAD, a smaller-curve guide points the wire towards the LAD; alternatively leave the first wire in the circumflex, where it steadies the guide, and wire the LAD with a second.",
          ],
        },
        {
          kind: "check",
          stem: "During LAD PCI through an EBU 4.0, the wire goes into the circumflex on every attempt despite reshaping its tip. What does Brilakis suggest?",
          options: [
            "Change to a polymer-jacketed wire with a larger bend, which steers past the circumflex",
            "Leave this wire in the circumflex to steady the guide and wire the LAD with a second",
            "Advance the guide deep into the LAD ostium so the wire has no other way to go",
            "Change to a larger-curve guide, which points the tip further towards the LAD",
          ],
          answer: 1,
          explanation:
            "Brilakis offers two answers for a wire that keeps choosing the circumflex: a smaller guide curve (not a larger one, which favours the circumflex) or a second wire, using the first wire in the circumflex to stabilise the guide. Deep seating of a left guide is rarely done and risks dissecting the left main, and escalating to a polymer-jacketed wire adds dissection and perforation risk without fixing the direction problem.",
        },
        { kind: "h", text: "When the guide will not engage at all" },
        {
          kind: "p",
          text: "Brilakis's five-step approach (understand where the ostium is, make the catheter manoeuvrable, fix the size, try other shapes, and stop if all fail) is taught in the engagement module. The options that matter most for a guide are: engaging with a diagnostic catheter and exchanging over a 300 cm supportive 0.014 inch wire; passing a 0.014 inch wire into the artery when the guide tip is close to the ostium, which then helps the guide in (often done for internal mammary grafts); a different curve size, or a guide extension, when the curve size does not suit the root; and, in a very dilated root with a hard-to-reach left main, a 6 Fr AL3 guide with a 4 Fr diagnostic catheter telescoped through it to reach the ostium.",
        },
        { kind: "tip", id: "pci-guide-seat-three-marks" },
        { kind: "tip", id: "pci-guide-damped-work-outside" },
        { kind: "tip", id: "pci-guide-wire-direction" },
        {
          kind: "pitfalls",
          items: [
            "Judging coaxiality from one projection.",
            "Accepting a deep seat as the starting position because it feels supportive.",
            "Injecting through a guide that damped on an ostial lesion instead of working with it disengaged over a wire.",
            "Changing wires again and again when the guide is the reason the wire will not go where you want.",
            "Forgetting the guide after a balloon comes out: it may now be deep or out.",
            "Treating a low trace before checking that the Y-connector valve is closed.",
          ],
        },
        {
          kind: "pearl",
          text: "When a guide damps on an ostial lesion, let the wire hold the position instead of the guide. With a 0.014 inch wire in the vessel, the guide can wait just outside the ostium and step in only for each injection or device.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the left main with an EBU 3.5 from the femoral route. Before any injection name the trace, then confirm a coaxial position in two orthogonal views (for example LAO caudal and RAO caudal) and set the depth to just inside the ostium. If the trace damps, withdraw before doing anything else.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, at each moment a balloon or stent is withdrawn, stop and check the guide: aspirated and flushed, still coaxial, not deeper than before. Note how often it has moved.",
        },
        { kind: "video", id: "QQfDGVH_ogs", note: "Case: hypotension after left main engagement." },
        { kind: "video", id: "SdRSb8Oh-0Q", note: "Case: challenges with engagement and support." },
        { kind: "video", id: "SSBMDshfnx4", note: "Case: what to do when you cannot engage the PCI target vessel." },
        { kind: "video", id: "4bZFdJ7POlg", note: "Case: challenges with engagement and wiring, and DK crush." },
        {
          kind: "keypoints",
          items: [
            "Optimal engagement: no damping, coaxial in orthogonal views, about 2–3 mm deep.",
            "Deep seating adds support but risks dissection, damping and ischaemia; it is an escalation step.",
            "Damping on an ostial lesion or small vessel: disengage, wire the vessel, engage intermittently (turning the guide off the ostium rather than pulling it back); then a smaller French size or different shape. If the trace stays damped off the ostium, follow the damping algorithm.",
            "Left main dissection: management depends on bifurcation involvement and stability; IVUS confirms the true lumen; femoral access ready for support. Iatrogenic aortic dissection: often conservative, CT after the procedure and again at 24 hours.",
            "Re-check the guide after every device withdrawal.",
            "Left main dissection follows guide manipulation (especially 7–8 F), injection with the tip at the left main roof, aggressive wires, balloons and stents.",
            "Wire will not exit the guide: improve the engagement. Wire keeps entering the wrong branch: re-seat or change the guide, reshape the tip, or use a second wire.",
            "False hypotension: open valve, line problems, damping, a blocked guide or bulky equipment.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-wire-choice",
      title: "Choosing the 0.014 inch wire: start soft, escalate, come back down",
      minutes: 13,
      topics: ["pci-wire-selection"],
      sources: [
        { book: "brilakis-pci", loc: "8.2" },
        { book: "brilakis-pci", loc: "8.6" },
        { book: "brilakis-pci", loc: "30.7" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
        { book: "oxford-cath", loc: "ch 8: Chronic total occlusion PCI" },
        { book: "oxford-cath", loc: "ch 8: Rotational atherectomy" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis's goal for wire selection has two halves: a wire that can reach where you need it, and the lowest risk of injuring the vessel on the way. The two pull in opposite directions. Slippery, stiff and penetrating tips reach more places and injure more vessels, so the skill is to use the gentlest wire that will do the job and to step back down once the hard part is over. The Core PCI lesson 'How a coronary wire is built' explains the parts of a wire; this lesson is about the decision.",
        },
        { kind: "h", text: "The seven kinds of 0.014 inch wire" },
        {
          kind: "table",
          caption: "Brilakis's seven categories, with what each is for",
          head: ["Category", "What defines it", "What it is for", "Watch out for"],
          rows: [
            ["Workhorse", "Soft tip (usually a tip load of 1 g or less) and no polymer jacket", "Most non-CTO PCI, including both branches of a bifurcation", "Some carry a hydrophilic coating: easier to deliver, more able to injure"],
            ["Polymer-jacketed", "A slippery polymer sheath covers the whole tip", "Tortuosity; in CTO work, collateral channels", "Distal perforation and subintimal tracking with dissection; use only when needed"],
            ["Stiff tip", "Stiff, usually tapered tips with moderate or strong penetrating power", "Crossing resistant caps in CTO PCI", "Taught in the CTO modules; not for routine lesions"],
            ["Support", "Strong, supportive body with a soft tip", "Delivering equipment, even exchanging guides", "Straighten tortuous vessels (pseudolesions, lesson 6)"],
            ["Atherectomy", "Dedicated wires for rotational and orbital atherectomy", "Atherectomy only", "Usually exchanged in through a microcatheter"],
            ["Externalisation", "Very long wires (330 and 350 cm)", "Retrograde CTO PCI", "CTO modules"],
            ["Pressure", "Wires carrying a pressure sensor", "Physiology", "Module 'Coronary physiology'"],
          ],
        },
        {
          kind: "p",
          text: "Within the workhorse group, three construction choices change the feel. **Coating**: a hydrophilic coating on the coil (which is not the same as a full polymer jacket) slides more easily and injures more readily. **Material**: most are stainless steel; nitinol holds its tip shape better but is harder to shape. **Tip construction**: the core either runs to the tip (core-to-tip) or ends short of it with a separate shaping ribbon, which makes shaping easier and is common in nitinol wires; some wires have more than one core or two coils. Oxford adds the trade-off: core-to-tip designs are stiffer, with more push, torque and support, while shaping-ribbon designs are floppier and kinder to the vessel. Some workhorse wires carry radiopaque marker bands at fixed spacing that can be used to measure lesion length. Short wires are about 180–190 cm; exchange lengths are 300 cm.",
        },
        { kind: "h", text: "Brilakis's ladder" },
        {
          kind: "steps",
          title: "Choosing and changing the wire",
          items: [
            {
              title: "Non-complex lesion: a workhorse",
              detail: "Start here. Oxford describes the same default: a wire that balances support with a flexible tip on a shaping ribbon, used for most lesions. At a bifurcation, Brilakis prefers standard workhorse wires in each branch, main and side.",
            },
            {
              title: "Tortuous vessel: Brilakis's three options",
              detail:
                "He lists three options without ranking them: an advanced workhorse with a composite core, a dual core or a nitinol construction; a soft-tipped wire whose tip has a hydrophilic coating; or a soft, non-tapered, polymer-jacketed wire. The ordering rule he does give is the next step: wires with a higher tip load and a hydrophilic coating or polymer jacket come only after a standard workhorse has failed.",
            },
            {
              title: "Higher tip loads and slippery tips only after the workhorse fails",
              detail:
                "Wires with heavier tips and a hydrophilic coating or polymer jacket carry more risk of dissection and perforation. Use them when a standard workhorse has failed to reach the segment you need, not as the opening move.",
            },
            {
              title: "CTO: a different starting point",
              detail:
                "The first wire is usually a polymer-jacketed, tapered-tip wire, and stiff penetrating wires (with or without a jacket) are often needed. This belongs to the CTO modules.",
            },
            {
              title: "Expect more than one wire? Bring a microcatheter",
              detail:
                "A lesion may need one wire to reach it and another to cross it, for example a workhorse to the lesion and a polymer-jacketed wire through it. If you expect to use more than one, Brilakis recommends a microcatheter from the start to make exchanges easy and to improve control.",
            },
            {
              title: "Once across with a polymer-jacketed or stiff wire: change it",
              detail:
                "Exchange it through a microcatheter or over-the-wire balloon, ideally with the trapping technique, for a workhorse, a highly supportive wire or, if atherectomy is planned, the dedicated atherectomy wire. If you must deliver equipment over a polymer-jacketed wire, watch its tip continuously, because distal perforation is the risk.",
            },
          ],
        },
        {
          kind: "p",
          text: "Brilakis calls this pattern **escalate, then de-escalate**. It began as a CTO principle, but it applies to every lesion: whatever non-workhorse wire got you across, a workhorse (or a support wire) carries the balloons and stents.",
        },
        {
          kind: "check",
          stem: "A tight, angulated lesion in a tortuous obtuse marginal could not be crossed with a workhorse wire. A soft polymer-jacketed wire passed through a microcatheter has now crossed it. What is the next step?",
          options: [
            "Exchange through the microcatheter for a workhorse wire before any balloon or stent",
            "Pull the microcatheter back and deliver the balloon over the polymer-jacketed wire now",
            "Leave the wire and push it further distally into a small branch for extra support",
            "Add a second polymer-jacketed wire alongside the first to act as a buddy wire",
          ],
          answer: 0,
          explanation:
            "After crossing with a polymer-jacketed or stiff wire, Brilakis exchanges it, through the microcatheter that is already in place, for a workhorse (or a support or atherectomy wire) before balloons and stents. Brilakis warns that polymer-jacketed and stiff tips raise the risk of distal perforation, so pushing one into a small branch is the opposite of what is wanted. Delivery over it is a fallback that needs constant watching of the tip.",
        },
        { kind: "h", text: "The other families, and when they enter the case" },
        {
          kind: "list",
          items: [
            "**Polymer-jacketed wires come in three groups.** Soft non-tapered wires are the ones used in non-CTO PCI, for wiring through tortuosity; soft tapered and stiff polymer-jacketed wires are mostly CTO tools, although Brilakis lists stiff jacketed wires for lesions that are hard to penetrate. In his table, soft non-tapered jacketed wires have tip loads of about 0.8–2.1 g, and the stiff ones about 1.7–4.1 g.",
            "**Oxford's categories match.** A workhorse for most lesions; stiff wires for extra support in tortuous or calcified anatomy; floppy wires where vessel trauma is a concern, for example re-crossing a dissected segment; hydrophilic-coated wires for occluded vessels. Oxford warns that polymer-covered and hydrophilic-coated wires are among the causes of left main dissection, and that stiff wires that straighten the artery can provoke spasm.",
            "**Support wires.** Strong shafts with soft tips, made for delivering equipment and long enough (300 cm versions exist) for exchanges. One support wire has three small waves in its distal part, beginning 6 cm from the tip, spread over the next 6 cm, each 3 mm high; they lift the delivery segment off the vessel wall and help deliver devices through earlier stents, tortuosity and calcium. It is not a crossing wire: another wire crosses first, and this one is swapped in through a microcatheter or an over-the-wire balloon. If it is not available, Brilakis bends the distal part of a workhorse by hand to imitate it.",
            "**Atherectomy wires.** Rotational and orbital atherectomy each need their own wire. Oxford notes that wiring directly with the rotational atherectomy wire is possible but hard in practice, so a workhorse crosses and a microcatheter is used to swap it.",
            "**Externalisation and pressure wires** belong to the CTO and physiology modules.",
          ],
        },
        {
          kind: "check",
          stem: "Which statement about workhorse wires matches the manuals?",
          options: [
            "Nitinol workhorse wires are easier to shape but lose their tip shape sooner than steel",
            "A shaping-ribbon design gives more push and torque than a core-to-tip design",
            "A hydrophilic coating on a workhorse coil eases delivery but raises the risk of injury",
            "Any wire with a tip load under 1 g is safe to park in the smallest distal branch",
          ],
          answer: 2,
          explanation:
            "Brilakis notes that hydrophilic coating increases deliverability and also the risk of vessel injury. The nitinol option has it backwards: nitinol holds its shape better and is harder to shape. Oxford attributes more push, torque and support to core-to-tip wires, with shaping-ribbon wires floppier and less traumatic. A soft tip does not make an aggressive distal position safe; distal wire position has to be watched with every wire.",
        },
        { kind: "tip", id: "pci-wire-start-workhorse" },
        { kind: "tip", id: "pci-wire-expect-two-bring-microcatheter" },
        { kind: "tip", id: "pci-wire-support-wire-exchange-in" },
        {
          kind: "pitfalls",
          items: [
            "Opening with a polymer-jacketed or stiff wire in a routine lesion because it crosses quickly; the risk is dissection and distal perforation.",
            "Forgetting to step back down: delivering balloons and stents over the slippery crossing wire.",
            "Trying to cross the lesion with a support wire of the waved type; it is exchanged in after crossing.",
            "Wiring primarily with an atherectomy wire instead of crossing with a workhorse and exchanging.",
            "Swapping wires without a microcatheter when you knew you would need more than one, and so re-wiring from the ostium each time.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask two questions every time you pick up a wire: what is this wire for, and what will replace it once it has done that job? If the second answer is 'nothing', you should be holding a workhorse.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, for the focal mid-LAD, calcified mid-RCA and circumflex STEMI scenarios, state the first wire you would use and the wire that would carry the stent. For the mid-RCA CTO scenario, state which wire would start, which might follow, and how you would exchange back before delivering a balloon.",
        },
        { kind: "video", id: "U3pkCt_8LMM", note: "Wiring: key principles (Manual of PCI chapter video)." },
        { kind: "video", id: "bTsMpBYx5c4", note: "Guidewires (Manual of PCI chapter video)." },
        { kind: "video", id: "7YXTePUN8A8", note: "Case: a wiggle wire to the rescue." },
        { kind: "video", id: "_g-xi_Hg_FU", note: "Coronary guidewires and wiring techniques." },
        {
          kind: "keypoints",
          items: [
            "Seven categories: workhorse, polymer-jacketed, stiff tip, support, atherectomy, externalisation, pressure.",
            "Workhorse: soft tip, usually 1 g or less, no polymer jacket; the default for non-CTO PCI and both bifurcation branches.",
            "Tortuosity: three listed options (advanced workhorse; soft wire with a hydrophilic-coated tip; soft non-tapered polymer-jacketed wire), not a ranked sequence.",
            "Higher tip loads and slippery tips only after the workhorse fails; they raise dissection and perforation risk.",
            "Expecting more than one wire: use a microcatheter from the start.",
            "After crossing with a non-workhorse wire, exchange (ideally by trapping) for a workhorse, support or atherectomy wire.",
            "The waved support wire and atherectomy wires are exchanged in, not used to cross.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-shape-load",
      title: "Shaping the tip and loading the wire through the Y-connector",
      minutes: 13,
      topics: ["pci-wire-shaping", "pci-wire-loading"],
      sources: [
        { book: "brilakis-pci", loc: "8.3" },
        { book: "brilakis-pci", loc: "8.4" },
        { book: "brilakis-pci", loc: "8.5" },
        { book: "brilakis-pci", loc: "8.1" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.5" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Between the packet and the guide tip a wire can be ruined twice: by a badly made bend, and by a tip that catches on its way through the Y-connector. Neither shows until the wire refuses to steer in the artery. These two short steps (Brilakis's steps 3 to 5 of wiring) are worth doing deliberately every time.",
        },
        { kind: "h", text: "Shaping: what bend, and why" },
        {
          kind: "list",
          items: [
            "**Pre-shaped or not.** Some wires come with a ready-made tip shape (Oxford's 'preformed J'). That saves shaping but limits how far you can tailor the tip.",
            "**Size the bend to the vessel.** Brilakis matches the bend to the target vessel's size and to the angulation of the lesion and vessel: a big bend for a big vessel, a small bend for a small one. As a rule, the distal bend should be shorter than the diameter of the target vessel.",
            "**Reaching is not crossing.** The bend that gets you to a lesion may not be the one that gets you through it. Brilakis's CTO example: a large bend to enter a septal branch, a small bend to travel through it.",
            "**Two bends for reach.** A larger proximal bend with a smaller distal bend can extend the wire's reach in large vessels and at angulated ostia.",
            "**Start small.** You can always add a bend; taking one out is hard.",
          ],
        },
        {
          kind: "steps",
          title: "Two ways to make the bend",
          items: [
            {
              title: "Small, precise bends: through the introducer",
              detail:
                "Push the tip just out of the introducer needle and bend it over with a finger of the other hand. Brilakis prefers this method, and it gives small bends accurately. It can, however, fracture the wire core, particularly in nitinol wires; some nitinol wires should be shaped only with the shaping needle packed with them.",
            },
            {
              title: "Larger bends: the drawing method",
              detail:
                "Press the wire between a finger and the side of the introducer needle and draw it along. This forms larger curves but can deform the wire.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Spoiling the tip.** Brilakis names two causes of an over-bent tip: forceful or excessive handling, and pulling the wire out of its hoop by the tip. Prevent both by shaping with the introducer and never holding the tip while you draw the wire from the hoop. If the tip cannot be reshaped, discard the wire and open another.",
        },
        {
          kind: "check",
          stem: "You are about to wire a 2.5 mm obtuse marginal with a gentle take-off from the circumflex. Which first tip shape follows Brilakis's guidance?",
          options: [
            "A long distal bend of about 4 mm, because a bigger curve finds branches more easily",
            "A tight double bend drawn along the needle, to have every option ready from the start",
            "No bend at all, because a straight tip is least likely to lift a plaque",
            "A small single distal bend shorter than 2.5 mm, made through the introducer",
          ],
          answer: 3,
          explanation:
            "Keep the distal bend shorter than the target vessel is wide; small bends are made most accurately through the introducer, and it is better to start small because adding a bend later is easy while removing one is hard. A 4 mm distal bend breaks Brilakis's general rule that a distal bend should be smaller than the target vessel diameter. Two bends are reserved for reach in large vessels or angulated ostia, and drawing the wire along the needle risks deforming it.",
        },
        { kind: "h", text: "The Y-connector and its haemostatic valve" },
        {
          kind: "p",
          text: "Everything you put into the guide passes through the haemostatic valve on the Y-connector, so the valve is both a door and a hazard. Brilakis describes two kinds. A **standard rotating valve** is opened to let a device through and closed afterwards. An **automated valve** lets devices pass without being opened, cuts the blood lost from back-bleeding (which matters more with large guides such as 8 Fr), and is simpler to handle.",
        },
        {
          kind: "list",
          items: [
            "**An over-tightened valve damages devices.** Forcing a balloon through it can deform the balloon (cutting balloons are especially vulnerable); open the valve first or use an automated one.",
            "**An open valve misleads the monitor.** Brilakis lists an open haemostatic valve first among causes of false hypotension on the pressure trace.",
            "**The valve can let air in.** Forceful aspiration of a wedged or blocked guide can suck air in through the valve; all of it must be removed before the next injection. After any exchange through the valve, and above all after trapping, back-bleed the Y-connector before injecting.",
            "**It is also a drug port.** Brilakis gives intracoronary nitroglycerin either through the manifold or straight through the Y-connector with the introducer needle.",
            "**The manifold behind it.** Oxford's manifold has three to five ports: the proximal port to the catheter, one to the pressure line with its flush, one to contrast, and a syringe at the distal end. It is zeroed open to air at mid-chest level and flushed carefully so that no air is trapped.",
          ],
        },
        { kind: "tip", id: "pci-mon-false-hypotension" },
        { kind: "h", text: "Loading the wire and bringing it to the guide tip" },
        {
          kind: "steps",
          title: "From the hoop to the guide tip",
          items: [
            {
              title: "Hide the tip in the introducer",
              detail: "Withdraw the shaped tip fully into the introducer needle. A large bend may have to be back-loaded into the introducer.",
            },
            {
              title: "Pass the introducer all the way through the valve",
              detail: "Then advance the wire through it. Do not force the wire if it meets resistance.",
            },
            {
              title: "Or load it inside a microcatheter",
              detail:
                "If a microcatheter (or an over-the-wire balloon) will be used, preload the wire into it and pass the microcatheter tip through the valve; no introducer is needed.",
            },
            {
              title: "Advance to the guide tip under fluoroscopy",
              detail:
                "Some wires carry shaft markers 90 cm and 100 cm back from the tip, which save fluoroscopy, but you must know the guide's length: the wire leaves a 90 cm guide sooner than a 100 cm one.",
            },
            {
              title: "Set a stop",
              detail: "Tightening the torque device on the wire about 90 cm from its tip keeps the wire from running out of the guide.",
            },
            {
              title: "Watch side holes",
              detail: "In a guide with side holes, the wire can leave through a side hole instead of the tip.",
            },
          ],
        },
        {
          kind: "table",
          caption: "What goes wrong on the way to the guide tip (Brilakis 8.4 and 8.5)",
          head: ["Problem", "Causes", "Prevention", "If it happens"],
          rows: [
            [
              "Bent or damaged tip",
              "Tip not fully inside the introducer; tip enters the side arm of the Y-connector; tip catches on a guide extension, balloon or stent already in the guide, or exits a side hole",
              "Tip fully hidden; introducer pushed right through the valve; no force; take other devices out where possible; under fluoroscopy and without force past a guide extension collar or devices",
              "Reshape it; if that fails, use a new wire",
            ],
            [
              "Wire runs into the artery",
              "Advanced too far, or carried in during contrast or saline injections without fluoroscopy; it can dissect, perforate or knock the guide out",
              "Watch the tip; use the proximal marker; set the torque device about 90 cm from the tip",
              "Do not pull it out (sometimes it has entered the intended branch). Inject to see where it is and redirect it if needed",
            ],
          ],
        },
        {
          kind: "p",
          text: "**A second wire into a crowded guide.** If you need another wire while a balloon, stent or guide extension is in the guide, Brilakis's options are: remove the device first; if you cannot, pass the wire under fluoroscopy without forcing it; push the balloon out into the artery while the new wire goes in, then pull it back; or use a dual-lumen microcatheter (its rapid-exchange lumen over the first wire, the new wire through its over-the-wire lumen) or an aspiration catheter in the same way, removed afterwards by trapping.",
        },
        {
          kind: "check",
          stem: "The assistant injects contrast to check the guide position while your wire sits in the guide. On the next frame the wire tip is 4 cm down a branch of the artery. What do you do?",
          options: [
            "Leave it, inject to see where it lies, and redirect it only if it is in the wrong place",
            "Pull the wire straight back into the guide before it causes a dissection",
            "Remove the wire and reload it, because a wire that entered unseen has been damaged",
            "Advance it further so that its stiffer shaft steadies the guide while you check",
          ],
          answer: 0,
          explanation:
            "Brilakis is explicit: do not remove a wire that has run into the artery, because sometimes it has entered the branch you wanted. Inject to locate it, then redirect it if necessary. Pulling it out throws away a position that may be correct, and pushing on without knowing where it is invites dissection or perforation. Prevention is a torque device set about 90 cm from the tip and watching the tip during injections.",
        },
        { kind: "tip", id: "pci-wire-shape-small-first" },
        { kind: "tip", id: "pci-wire-load-through-valve" },
        { kind: "tip", id: "pci-wire-stop-at-guide-tip" },
        {
          kind: "pitfalls",
          items: [
            "A distal bend longer than the vessel is wide.",
            "Shaping a nitinol wire roughly through the introducer and fracturing its core.",
            "Pulling the wire from its hoop by the tip.",
            "Leaving the tip proud of the introducer, or stopping the introducer short of the valve, so the tip catches or enters the side arm.",
            "Forcing a balloon through a closed rotating valve, or treating 'hypotension' that is really an open valve.",
            "Injecting after an exchange without back-bleeding the Y-connector.",
            "Not knowing whether the guide is 90 or 100 cm when relying on wire shaft markers.",
          ],
        },
        {
          kind: "pearl",
          text: "Make the torque device your brake as well as your handle. Clipped about 90 cm from the tip before the wire goes in, it stops the wire running out of the guide while everyone's eyes are on the injection.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "At the table stage of a full case, rehearse the order aloud: Y-connector valve closed and flushed, wire shaped with a small distal bend, tip hidden in the introducer, introducer through the valve, wire to the guide tip under fluoroscopy with the torque device set as a stop, valve closed again.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, before wiring the focal mid-LAD lesion, decide the tip shape you would make for that vessel and say whether you would add a second bend. While the wire waits at the guide tip, watch it through each contrast injection.",
        },
        { kind: "video", id: "TR7gD__WP6M", note: "Wiring: step by step (Manual of PCI chapter video)." },
        { kind: "video", id: "dwHP4lYJ3fo", note: "Case: shape it." },
        {
          kind: "keypoints",
          items: [
            "Bend size follows the vessel: the distal bend shorter than the vessel diameter; a larger proximal bend adds reach.",
            "The bend that reaches may differ from the bend that crosses.",
            "Small bends through the introducer (fracture risk in nitinol); large bends by drawing along the needle (deformation risk).",
            "Start small; do not pull the wire from its hoop by the tip; discard a tip you cannot reshape.",
            "Tip fully in the introducer, introducer fully through the valve, never force.",
            "Know the guide length; set the torque device about 90 cm from the tip; beware side holes.",
            "A wire that escapes into the artery stays in: inject, then redirect.",
            "Open valves cause false hypotension and admit air; back-bleed after exchanges.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-navigate",
      title: "Steering the wire to, across and beyond the lesion",
      minutes: 15,
      topics: ["pci-wire-navigation"],
      sources: [
        { book: "brilakis-pci", loc: "1.8" },
        { book: "brilakis-pci", loc: "8.6" },
        { book: "brilakis-pci", loc: "8.7" },
        { book: "brilakis-pci", loc: "8.8" },
        { book: "brilakis-pci", loc: "8.10" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
        { book: "oxford-cath", loc: "ch 8: Chronic total occlusion PCI" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis sets the goal of wiring as getting a wire through and beyond the target lesion as efficiently as possible, without a complication, and in a position that will support every device that follows. Preparation starts at planning: his checklist asks whether the target lesion has been hard to wire before, so read the previous report and look at the old films before you start. This lesson takes the wire from the guide tip (his step 6) through the lesion (step 7) to its final position (step 8), and then keeps it there.",
        },
        { kind: "h", text: "Seeing where you are going" },
        {
          kind: "list",
          items: [
            "**Fluoroscopy with small, intermittent injections.** A small amount of contrast is usually enough to show where the wire is relative to the vessel.",
            "**A reference image.** A stored still frame of the best view of the lesion, or the dynamic roadmap some X-ray systems offer, guides the wire and saves contrast.",
            "**Orthogonal views.** Confirm in a second projection that the wire is where you think, above all in complex anatomy: CTOs, tortuosity, overlapping side branches. In CTO work, an injection into the contralateral artery or a bypass graft is often needed to see where the wire is (CTO modules).",
            "**Continuous screening as the wire enters the artery.** Oxford advises this so that you see at once if the tip goes into a side branch or buckles against an obstruction.",
          ],
        },
        {
          kind: "table",
          caption: "Views that make wiring easier (Brilakis 8.6.2.1)",
          head: ["Target", "First view", "Then"],
          rows: [
            ["LAD", "A caudal view, to choose the LAD at the left main bifurcation", "RAO cranial or AP cranial"],
            ["Circumflex and obtuse marginals", "A caudal view, to choose the circumflex", "RAO caudal or LAO caudal"],
            ["RCA", "LAO, to reach the distal vessel", "LAO or AP cranial, to enter the PDA or the posterolateral branch"],
          ],
        },
        { kind: "h", text: "Your hands" },
        {
          kind: "list",
          items: [
            "**Two movements.** A wire is pushed or pulled, and turned. Every manoeuvre is a combination of the two, chosen for the vessel and the lesion.",
            "**Torque device.** It improves control but simple lesions may not need it; Brilakis leaves it to preference and experience.",
            "**Grip.** Holding the wire underhand or overhand is personal; the Brilakis authors prefer underhand because it makes manipulation easier. For complex lesions, many right-handed operators push and pull with the left hand and turn with the right.",
            "**Keep the tip moving.** Oxford advises repeated short rotations of the shaft as you advance, so that the tip never settles into the plaque or the vessel wall.",
          ],
        },
        { kind: "h", text: "Six principles while the wire is moving" },
        {
          kind: "steps",
          items: [
            {
              title: "Keep the tip free",
              detail:
                "A free tip both reaches the target and spares the vessel. If the tip slips under a plaque, pushing on can dissect the vessel or trap the tip. When the tip's movement becomes restricted, pull back and advance again; or leave that wire where it is and pass a second one beside it (parallel wiring).",
            },
            {
              title: "A loop at the tip is acceptable",
              detail:
                "Brilakis finds a loop both effective and safe, especially once the stenosis has been crossed. A knuckled tip can travel through tortuous segments without diving into side branches, and is less likely to perforate if it goes too far, although a perforation from a knuckle is bigger than one from a tip. Keep the loop small, within the radiopaque part of the wire, and do not knuckle a highly supportive wire.",
            },
            {
              title: "Change a damaged tip",
              detail:
                "A tip deformed by tortuosity or by catching in a small branch steers badly and injures more. Change the wire, ideally through a microcatheter with trapping so the position is not lost.",
            },
            {
              title: "Escalate, then de-escalate",
              detail: "Whatever non-workhorse wire crosses, exchange it for a workhorse before balloons, stents and other devices (previous lesson).",
            },
            {
              title: "Keep multiple wires organised",
              detail:
                "In bifurcations especially, know which wire is where. Brilakis separates them with a towel, with the wire to the branch highest on the screen on top of the towel and the lowest beneath it; other options are wires of different colours, a slight bend in the back end of the side-branch wire, or a torque device on one of them.",
            },
            {
              title: "Confirm in two views before anything follows the wire",
              detail: "An orthogonal view settles which branch the wire is in and whether it follows the vessel.",
            },
          ],
        },
        {
          kind: "check",
          stem: "The wire tip stops moving freely in a mid-LAD lesion: when you turn it, it no longer swings, and when you push, the distal coil bows. What does Brilakis advise?",
          options: [
            "Push firmly through the resistance, since a soft workhorse tip cannot dissect",
            "Inject contrast hard through the guide to open the channel ahead of the tip",
            "Pull back, rotate slightly and readvance, or leave it and pass a parallel wire",
            "Spin the wire continuously in one direction until the tip breaks free",
          ],
          answer: 2,
          explanation:
            "A restrained tip may be under a plaque. Pushing on risks dissection and tip entrapment, so Brilakis withdraws and readvances (pulling back and rotating slightly when the tip deflects), or leaves the wire and wires alongside it. Continuous spinning is not among his answers, and a forceful injection is a recognised cause of dissection.",
        },
        { kind: "h", text: "Crossing the lesion" },
        {
          kind: "p",
          text: "The crossing itself is done the same way, under fluoroscopy with intermittent injections. When the tip deflects at the lesion, do not force it: pull back, rotate a little and try again. Brilakis lists why a wire fails to cross and what to do.",
        },
        {
          kind: "list",
          items: [
            "**Why it will not cross.** A very tight or calcified lesion; a tip shape that does not suit it; tortuosity; poor guide support.",
            "**How to prevent it.** Shape the tip for the lesion; obtain good guide support (lessons 1 and 2); gain wire support and control with a microcatheter; use hydrophilic-coated or polymer-jacketed wires where they are needed.",
            "**What to do when it happens.** Brilakis lists three answers, in no fixed order: change the tip shape; change the wire (for example a polymer-jacketed wire instead of a workhorse); support it with a microcatheter or an over-the-wire balloon.",
          ],
        },
        {
          kind: "p",
          text: "**Dissection while wiring.** Brilakis's causes are severe or ulcerated lesions, stiff or polymer-jacketed wires, and aggressive manipulation; prevention is gentle handling and avoiding aggressive wires in severe lesions. If it happens, pass another wire into the distal true lumen and stent. CTO re-entry techniques can help after acute closure from dissection but need real expertise.",
        },
        {
          kind: "p",
          text: "**Acute closure after crossing.** It is more likely in very tight lesions and is usually a dissection. In a very tortuous vessel, however, the wire can straighten the artery and create a pseudolesion that looks like one (next lesson). Prevention: do not force the wire (when the tip deflects, pull back and rotate slightly before advancing again), use polymer-jacketed wires cautiously, and in a tortuous vessel withdraw the wire partly, keeping its soft distal segment just beyond the lesion, to see whether new narrowings are pseudolesions. The rules once it has happened: confirm that the wire is in the distal true lumen before any balloon or stent, using intravascular ultrasound if needed; do not inject through a microcatheter at its distal tip, because if the wire is subintimal the injection extends the dissection; try the same or another wire through the lesion; and if the wire is subintimal and the true lumen cannot be wired, re-entry with a dedicated system or penetrating wires is possible. In its CTO section, Oxford lists the hints that a wire has left the lumen: an abnormal course, abnormal motion through the cardiac cycle, and multiple ventricular extrasystoles.",
        },
        {
          kind: "p",
          text: "**Distal injections: the books differ.** In a CTO that has been crossed but still has no antegrade flow, Oxford injects contrast via an over-the-wire balloon or a probing catheter to show whether the wire lies inside or outside the lumen. Brilakis, writing about acute closure after crossing, advises against distal microcatheter injections when the wire may be subintimal, because they can extend the dissection, and uses IVUS to define the wire position. Outside CTO work, when a dissection is possible, follow Brilakis and use IVUS.",
        },
        { kind: "h", text: "Beyond the lesion: where to park, and keeping it there" },
        {
          kind: "list",
          items: [
            "**As far distally as is safe.** Brilakis and Oxford agree. Oxford explains why: wires are stiffer proximally, so a distal tip puts the supportive part across the lesion, and a distal tip is less likely to be pulled back across the lesion later.",
            "**But not into trouble.** A tip pushed too far perforates; Oxford warns specifically about hydrophilic tips far out in small vessels. Exchange a stiff or polymer-jacketed crossing wire for a workhorse as soon as it is across.",
            "**Watch the tip for the rest of the case.** Brilakis closes his wiring chapter with monitoring of the wire position, continuous or at least intermittent, most of all when collimation hides the tip and when devices are hard to advance or withdraw, because that is when the wire moves. With several wires in, each tip needs watching. The risk of a distal perforation is higher with polymer-jacketed, stiff or tapered tips. Some X-ray systems can also show part of the screen at high resolution and the rest, including the wire tip, at low resolution, so the tip stays in view.",
            "**If it perforates.** First stop the bleeding into the pericardium with a balloon inflated just upstream of the perforation; if contrast still leaks after balloon inflation, the definitive treatment is usually fat or coil embolisation (module 'Perforation and tamponade').",
            "**If it falls back.** A wire pulled back proximal to the lesion leaves you unable to treat an acute closure. Prevent it by watching the tip, preparing the lesion well and not forcing devices: if a stent will not cross, ballooning again (or sometimes atherectomy) is safer than pushing harder.",
          ],
        },
        {
          kind: "check",
          stem: "A wire has just crossed a tight mid-LAD lesion. Before any balloon, the distal LAD fills slowly, the wire tip moves in an unusual arc with each beat, and the monitor shows runs of ventricular ectopics. What is the safest next step?",
          options: [
            "Balloon and stent promptly to tack up any dissection before flow worsens",
            "Keep the wire and prove a true-lumen position before any balloon",
            "Inject contrast through a microcatheter at the wire tip to define the lumen",
            "Remove the wire and start wiring again with a stiffer polymer-jacketed wire",
          ],
          answer: 1,
          explanation:
            "An abnormal wire course or motion with ventricular ectopics suggests the wire may be outside the lumen (Oxford). Brilakis requires proof of a distal true-lumen position before ballooning or stenting further, with intravascular ultrasound as one way to obtain it. Brilakis advises against a distal microcatheter injection when the wire may be subintimal, because it can extend the dissection; ballooning promptly skips the confirmation he requires; and pulling the wire throws away your only access.",
        },
        { kind: "tip", id: "pci-wire-keep-tip-free" },
        { kind: "tip", id: "pci-wire-left-views" },
        { kind: "tip", id: "pci-wire-rca-views" },
        { kind: "tip", id: "pci-wire-not-crossing-ladder" },
        { kind: "tip", id: "pci-wire-confirm-true-lumen" },
        { kind: "tip", id: "pci-wire-organise-two-wires" },
        { kind: "tip", id: "pci-mon-wire-tip-collimation" },
        {
          kind: "pitfalls",
          items: [
            "Starting without checking whether the lesion was hard to wire before (Brilakis's planning question).",
            "Wiring by memory instead of by a stored reference image, then flooding the vessel with contrast to find the wire.",
            "Pushing a tip that has stopped moving freely.",
            "Letting a knuckle grow beyond the radiopaque segment, or knuckling a highly supportive wire.",
            "Ballooning or stenting before the distal true-lumen position is confirmed.",
            "A distal microcatheter injection when the wire may be subintimal.",
            "Losing sight of the tip once the stent is on its way.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat the wire tip as a patient in its own right: after every device movement, look at it. Most distal perforations and most lost wires happen while attention is on something else.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab circumflex STEMI scenario, enter the circumflex in a caudal view, travel along it in RAO caudal or LAO caudal, cross the lesion with small intermittent injections against a stored reference image, confirm the position in an orthogonal view, and then keep the tip in view while the balloon and stent are delivered.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "view",
          params: { artery: "RCA" },
          task: "Name the projection of each RCA run, then say which of them you would use to take a wire to the distal RCA and which to enter the PDA.",
        },
        { kind: "video", id: "zTHVB0Zeo7g", note: "Case: the wire will not go." },
        { kind: "video", id: "NeafmDqbT6M", note: "Case: challenging wiring in STEMI." },
        { kind: "video", id: "y6B_NudH2qI", note: "Case: wiring challenges." },
        { kind: "video", id: "wcnSTfg9wbY", note: "Wiring techniques through difficult angulations." },
        {
          kind: "keypoints",
          items: [
            "Check the history: was this lesion hard to wire before?",
            "Small intermittent injections, a stored reference image or roadmap, and orthogonal views.",
            "LAD and circumflex: enter in caudal; LAD then RAO or AP cranial; circumflex then RAO or LAO caudal. RCA: LAO to the distal vessel, LAO or AP cranial for the PDA and posterolateral branch.",
            "Keep the tip free: a restrained tip is withdrawn and readvanced, or a parallel wire is passed.",
            "Small knuckles are acceptable; change a damaged tip through a microcatheter.",
            "Confirm the distal true lumen before any balloon or stent; no distal microcatheter injection if the wire may be subintimal.",
            "Park as far distally as is safe, exchange slippery wires at once, and watch the tip until the case ends.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-tortuosity",
      title: "Tortuous and angulated vessels: prolapse, the reversed wire and pseudolesions",
      minutes: 14,
      topics: ["pci-wiring-tortuosity"],
      sources: [
        { book: "brilakis-pci", loc: "8.6" },
        { book: "brilakis-pci", loc: "8.7" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "18.8" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "12.2" },
        { book: "brilakis-pci", loc: "30.6" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Tortuosity defeats a wire in three ways. The tip falls into the wrong branch, or prolapses (folds back on itself) instead of turning into the right one. Torque is lost in the bends, so the tip stops answering your fingers. And once the wire does get through, it straightens the artery, which can fold the vessel wall into narrowings that were not there before. Brilakis gives a structured answer to each.",
        },
        { kind: "h", text: "The wire keeps entering a side branch" },
        {
          kind: "table",
          head: ["", "Brilakis's advice"],
          rows: [
            ["Causes", "Difficult (tortuous) anatomy; a tip shape that does not suit it"],
            ["Prevention", "Shape the tip well; use wires with one-to-one torque response; use a microcatheter, which transmits torque better and lets you reshape the tip without losing ground"],
            ["Treatment", "Re-seat the guide (for a wire that keeps entering the RCA conus branch, withdraw the guide and obtain coaxial engagement); reshape the tip; change the guide (a smaller left curve helps a wire that keeps choosing the circumflex over the LAD); or leave the first wire in the wrong branch to steady the guide and pass a second wire into the target"],
          ],
        },
        { kind: "h", text: "The wire will not go through the tortuosity" },
        {
          kind: "p",
          text: "Prevention is the same: a good tip shape and wires with one-to-one torque, with hydrophilic or polymer-jacketed wires as an option that brings more risk of dissection and perforation. When the wire still fails, Brilakis offers four solutions.",
        },
        {
          kind: "steps",
          title: "Four ways through",
          items: [
            {
              title: "1. A different wire and a different shape",
              detail:
                "Change to a hydrophilic-coated or soft polymer-jacketed wire and reshape the tip; a large bend helps an angulated branch. Some polymer-jacketed wire families prolapse less than others.",
            },
            {
              title: "2. A microcatheter",
              detail:
                "Straight or angulated, it supports and directs the wire, and lets you change wires without re-wiring from the ostium. A dual-lumen microcatheter is another option: wire the angulated branch through its over-the-wire lumen.",
            },
            {
              title: "3. The reversed (hairpin) wire",
              detail: "Described below. It turns the wire round so that it hooks into a branch that leaves at an acute angle backwards.",
            },
            {
              title: "4. The deflection balloon",
              detail:
                "Inflate a balloon in the main vessel just beyond the origin of the angulated branch, so that wires and microcatheters are deflected into the branch. The main vessel is occluded while you do it, so expect ischaemia, and the balloon can injure the vessel, for example by dissection.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Making and using a reversed (hairpin) wire",
          items: [
            {
              title: "Choose the wire",
              detail: "A polymer-jacketed wire.",
            },
            {
              title: "Form the hairpin",
              detail: "Bend the wire back on itself about 3 cm from the tip, through 180 degrees.",
            },
            {
              title: "Load the bend, not the tip",
              detail: "Insert the bent segment (not the tip) through the haemostatic valve of the Y-connector.",
            },
            {
              title: "Overshoot",
              detail: "Advance the hairpin down the main vessel past the origin of the target branch.",
            },
            {
              title: "Pull back to hook",
              detail: "Withdraw it slowly: the reversed tip catches the branch ostium and enters it as you pull.",
            },
            {
              title: "Variants",
              detail:
                "The hairpin can also be passed through a dual-lumen microcatheter. In the streamlined reverse wire technique, the wire (again bent about 3 cm from its tip) is passed along the over-the-wire channel of a dual-lumen microcatheter already in the vessel until it enters another side branch; advancing microcatheter and wire together forms the hairpin, and pulling back enters the angulated target.",
            },
            {
              title: "Know the risks",
              detail: "It can dissect the vessel, and once the hairpin has entered the vessel you are wiring, the bend can make further advancement difficult.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A large diagonal leaves the LAD at an acute, backward-facing angle. A reshaped workhorse wire, then a soft polymer-jacketed wire through an angulated microcatheter, have both prolapsed into the distal LAD. Which next step is described by Brilakis for this problem?",
          options: [
            "A stiff, tapered CTO wire, which penetrates rather than prolapses at the ostium",
            "A guide extension pushed into the diagonal ostium to direct the wire from close up",
            "A larger French guide, whose extra support stops the wire prolapsing",
            "A reversed (hairpin) polymer-jacketed wire, overshot and then pulled back",
          ],
          answer: 3,
          explanation:
            "The reversed (hairpin) wire is one of Brilakis's four solutions for wiring through tortuosity and angulation, alongside changing the wire and shape and using a microcatheter: the bend is loaded into the valve, overshoots the branch and hooks it on pull-back. A deflection balloon is the fourth option. Stiff, penetrating CTO wires belong to occlusions and would add dissection and perforation risk, and neither a guide extension nor a larger guide is among his solutions for prolapse into the main vessel.",
        },
        {
          kind: "p",
          text: "**At a bifurcation.** Brilakis groups the options for a hard side-branch wire the same way: wire-based (a secondary bend, a hydrophilic or polymer-jacketed wire, the reversed wire), microcatheter-based (large or small microcatheters for support and reshaping without losing position, angulated microcatheters, dual-lumen microcatheters), and modifying the main vessel with a balloon or atherectomy, which can occlude the side branch. Watch both distal wire tips, and swap any polymer-jacketed wire for a workhorse before lesion preparation and stenting. Bifurcation strategy is taught in the bifurcation modules.",
        },
        { kind: "h", text: "Pseudolesions and the accordion effect" },
        {
          kind: "p",
          text: "A wire (or a microcatheter) pulled straight through a tortuous artery shortens and folds the redundant vessel, producing narrowings that look like new lesions: pseudolesions, also called the accordion or accordioning effect. Brilakis describes it most clearly in left internal mammary grafts, where the pseudolesions can reduce flow and cause ischaemia, and shows an example in a tortuous mid-LAD after a supportive wire. A pseudolesion can be mistaken for spasm or dissection, and the treatments differ.",
        },
        {
          kind: "table",
          caption: "Telling them apart",
          head: ["", "Pseudolesion", "Spasm", "Dissection"],
          rows: [
            ["Setting", "Severe tortuosity straightened by a wire or microcatheter", "Instrumentation, including stiff wires that straighten the artery (Oxford)", "Severe or ulcerated lesions, stiff or polymer-jacketed wires, aggressive manipulation"],
            ["Vasodilators", "Not corrected by vasodilators (Brilakis notes that intravenous vasodilators are ineffective); give intracoronary nitrate first to exclude spasm", "Relieved by nitrate; Oxford advises a trial of intracoronary nitrate when in doubt", "Not the treatment"],
            ["Key test", "Resolves when the wire is partly withdrawn so that its soft distal segment lies just beyond the lesion (the wire stays across the lesion)", "Response to nitrate; Oxford records an image showing that the spasm has gone, and catheter withdrawal may be needed", "Persistent signs of injury, such as a filling defect or contrast staining; intravascular imaging helps"],
            ["Treatment", "Remove the equipment, after making sure there is no dissection (for example with IVUS)", "Nitrate", "Keep the wire; wire the true lumen and stent"],
          ],
        },
        {
          kind: "steps",
          title: "When new narrowings appear in a tortuous vessel after wiring",
          items: [
            { title: "Do not stent them", detail: "Not until you know what they are." },
            {
              title: "Pull the wire partly back",
              detail: "Withdraw it until its soft distal part lies just beyond the lesion. Brilakis uses this to show whether apparent lesions are pseudolesions.",
            },
            {
              title: "Exclude spasm",
              detail: "Give intracoronary nitrate if spasm is possible (dose and practice in the module 'Sedation, vasodilators, pressors, antiarrhythmics and contrast').",
            },
            {
              title: "Exclude dissection before removing equipment",
              detail: "Intravascular ultrasound can show whether the wall is intact.",
            },
            {
              title: "Prevent the next one",
              detail: "Avoid instrumenting highly tortuous vessels where you can, and use soft-bodied wires and microcatheters when you must.",
            },
          ],
        },
        {
          kind: "p",
          text: "Tortuosity also matters after the stent. Brilakis lists extreme tortuosity, through wire bias and the accordion effect, among the causes of a disappointing post-PCI FFR, so a low value measured with a wire straightening the vessel is not proof of a poor result.",
        },
        {
          kind: "check",
          stem: "A supportive wire has been passed through a very tortuous mid-LAD to deliver a stent. Two new, smooth narrowings now appear at the bends around and just beyond the lesion; flow is preserved and intracoronary nitrate has had no effect. What does this pattern suggest, and what do you do?",
          options: [
            "Pseudolesions: partly withdraw the wire, keeping its soft tip beyond the lesion",
            "Two new dissections: stent both segments now, before antegrade flow is lost",
            "Refractory spasm: give repeated doses of vasodilator until the narrowings open fully",
            "Thrombus from the wire: start a glycoprotein IIb/IIIa inhibitor and aspirate",
          ],
          answer: 0,
          explanation:
            "Smooth narrowings at bends that appear after a supportive wire straightens a tortuous artery, unaffected by vasodilators, fit pseudolesions. Brilakis withdraws the wire partly, so its soft distal segment lies just beyond the lesion while the wire stays across it, to show whether they resolve, and removes equipment only after excluding dissection (for example with IVUS). Pulling the wire back behind the lesion would leave you unable to treat an acute closure. Stenting pseudolesions treats a problem that is not there, and more vasodilator will not change them.",
        },
        { kind: "tip", id: "pci-wire-prolapse-four-solutions" },
        { kind: "tip", id: "pci-wire-reversed-hairpin" },
        { kind: "tip", id: "pci-wire-pseudolesion-pullback" },
        {
          kind: "pitfalls",
          items: [
            "Pushing harder when the wire prolapses, instead of changing shape, wire or adding a microcatheter.",
            "Loading the tip of a hairpin wire through the valve instead of the bend.",
            "Forgetting that the deflection balloon occludes the main vessel and causes ischaemia while it is up.",
            "Stenting pseudolesions, or removing the equipment before excluding a dissection.",
            "Expecting vasodilators to open a pseudolesion.",
            "Reading a low post-PCI FFR in a tortuous vessel as a stent failure without considering wire bias and accordioning.",
          ],
        },
        {
          kind: "pearl",
          text: "When a supportive wire changes the angiogram, the first question is what the wire has done to the artery, not what the artery has done to itself. Withdraw the wire partly, so that its soft distal segment lies just beyond the lesion and the wire stays across it, and look again.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab calcified mid-RCA scenario, plan the wiring of a tortuous RCA: your first wire and shape, when you would add a microcatheter, and how you would check any new narrowing that appears once a supportive wire is in place.",
        },
        { kind: "video", id: "MeVSVM5-H8s", note: "Wiring through tortuosity (Manual of PCI chapter video)." },
        { kind: "video", id: "IeqVM-LjF_g", note: "Short video: wiring through tortuosity." },
        { kind: "video", id: "MQbJJQ7ReS4", note: "Case: the reversed guidewire." },
        { kind: "video", id: "SoiUlUqopzI", note: "Case: accordioning." },
        {
          kind: "keypoints",
          items: [
            "Wire into the wrong branch: reshape, re-seat or change the guide, or leave it as a stabilising wire and pass a second.",
            "Four solutions for tortuosity: different wire and shape; microcatheter (straight, angulated or dual-lumen); reversed wire; deflection balloon.",
            "Hairpin: polymer-jacketed wire bent 180 degrees about 3 cm from the tip, bend loaded first, overshoot, pull back; risk of dissection.",
            "Deflection balloon: inflated just beyond the branch origin; ischaemia and injury are the costs.",
            "Pseudolesions come from straightening; vasodilators do not fix them; partial wire withdrawal reveals them.",
            "Exclude dissection, for example with IVUS, before removing equipment from a vessel with pseudolesions.",
            "Prevent them with soft-bodied wires and microcatheters, and by avoiding instrumentation of very tortuous vessels.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-wiring-microcatheters",
      title: "Microcatheters: when to use one, which kind, and how to get it out",
      minutes: 16,
      topics: ["pci-microcatheters"],
      sources: [
        { book: "brilakis-pci", loc: "8.1" },
        { book: "brilakis-pci", loc: "8.9" },
        { book: "brilakis-pci", loc: "30.6" },
        { book: "brilakis-pci", loc: "8.5" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "oxford-cath", loc: "ch 8: Chronic total occlusion PCI" },
        { book: "oxford-cath", loc: "ch 8: Rotational atherectomy" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A microcatheter is a very thin catheter (usually 1.8 to 3.2 Fr) that runs over a 0.014 inch wire into the coronary artery. It turns a wire you can only push and twist from the Y-connector into one supported almost to its tip, and it keeps a channel open so that one wire can be swapped for another without giving up the ground already gained. Brilakis makes deciding whether you need one the first step of wiring, before the wire is even chosen.",
        },
        { kind: "h", text: "When you need one" },
        {
          kind: "list",
          items: [
            "**Complex lesions.** Brilakis would consider one for any complex lesion, naming highly tortuous lesions, near-occlusive lesions and CTOs; in CTO PCI it is routine.",
            "**More than one wire expected.** If a lesion will need one wire to reach it and another to cross it, a microcatheter makes the exchanges easy.",
            "**Changing a damaged wire or the wire type.** Swapping a damaged tip, or exchanging a polymer-jacketed crossing wire for a workhorse, support or atherectomy wire (Oxford gives the rotational atherectomy wire as an example), is best done through a microcatheter with trapping.",
            "**Side branches and calcium.** Tortuosity, angulation and severe calcification, side-branch wiring at bifurcations, and rewiring a side branch through stent struts.",
            "**Load them together.** If you decide on a microcatheter, put the wire into it first and insert the pair through the valve, so no introducer is needed.",
          ],
        },
        {
          kind: "p",
          text: "**Microcatheter or over-the-wire balloon?** An over-the-wire balloon can do the same job and costs much less, and Brilakis notes it gives better support than many microcatheters. But it is stiffer, tracks less well and kinks more readily (a kinked shaft blocks further exchanges, often costing both balloon and wire), and in small balloons (1.5 mm or less) the single marker sits mid-balloon, so you cannot see exactly where its tip is. A microcatheter has its marker at the tip. Oxford's CTO section also uses over-the-wire balloons to add support and stop the wire tip deflecting.",
        },
        { kind: "h", text: "What a microcatheter does for you" },
        {
          kind: "list",
          items: [
            "Supports the wire and stiffens its tip, which increases its penetrating power.",
            "Lets you reshape the wire tip and put it back exactly where it was.",
            "Makes wire exchanges simple.",
            "Shields the proximal vessel (and, in retrograde CTO work, the collateral) from the wire.",
            "Delivers contrast or drugs distally. Flush it afterwards, because contrast left inside can make the wire sticky.",
            "Delivers coils, fat or thrombin to seal a perforation. All coronary microcatheters take a 0.014 inch wire and most cannot deliver 0.018 inch coils; Brilakis advises keeping 0.014 inch compatible coils in the lab, or larger microcatheters (around 2.4–2.5 Fr) that will take 0.018 inch coils.",
          ],
        },
        { kind: "h", text: "The five categories" },
        {
          kind: "table",
          caption: "Microcatheter categories (Brilakis 30.6), described generically",
          head: ["Category", "Main use", "Handling points"],
          rows: [
            [
              "Large outer diameter",
              "Wire support for antegrade CTO crossing; any other microcatheter task",
              "Can be spun to help advancement, but over-spinning damages them",
            ],
            [
              "Small outer diameter",
              "Small, tortuous vessels; the usual choice for retrograde crossing of epicardial collaterals",
              "Coil-reinforced versions can be spun; braided ones without a coil are smaller but are mainly pushed, and aggressive rotation and pushing can break the tip off one of them",
            ],
            [
              "Angulated",
              "Entering side branches at difficult angles; can stop a wire prolapsing into a side branch",
              "Fixed-angle versions come in 45, 90 and 120 degree tips. The deflectable-tip type bends up to 90 degrees with a 2.5 mm bend radius and fits a 6 Fr guide: take care in arteries under 2.5 mm, and straighten it before advancing or withdrawing. It is stiff, which adds support but can injure the vessel. It comes in rapid-exchange and over-the-wire versions; use the over-the-wire one when wire exchanges are needed, as in CTO PCI. Trapping it, or using it for parallel wiring, needs an 8 Fr guide. Another angulated design has a straight tip that articulates up to 180 degrees in opposite directions",
            ],
            [
              "Dual-lumen",
              "Placing a second wire next to a first; side-branch wiring, including through jailed side branches; reversed-wire technique; reaching the main vessel when the wire has gone into a side branch beyond a lesion, without giving up the branch",
              "Can be hard to deliver (some carry a stiffening mandrel); the side port can be hard to aim; removal while keeping the wires in place is best done with a trapping balloon",
            ],
            [
              "Plaque modification",
              "Modifying resistant plaque, usually in balloon-uncrossable lesions",
              "Each design turns one way to advance: the stranded-steel type is advanced anticlockwise and withdrawn clockwise, no more than 20 turns in one direction, and contrast cannot be injected through it; other designs advance clockwise. Know which one you hold",
            ],
          ],
        },
        {
          kind: "check",
          stem: "During LAD PCI the wire crossed the lesion but entered a diagonal just beyond it instead of the distal LAD. Re-crossing the lesion was difficult. Which device lets you wire the distal LAD without first withdrawing from the diagonal?",
          options: [
            "A large-diameter microcatheter advanced into the diagonal and spun to straighten",
            "A plaque modification microcatheter rotated through the lesion into the distal LAD",
            "A dual-lumen microcatheter over the diagonal wire, with a second wire through its other lumen",
            "An over-the-wire balloon inflated in the diagonal to deflect the existing wire",
          ],
          answer: 2,
          explanation:
            "Brilakis lists this exact use for a dual-lumen microcatheter: when the wire has crossed into a side branch beyond the lesion, wiring the main vessel through the second lumen avoids pulling back and risking a failure to re-cross, and keeps the branch. A plaque modification microcatheter is for resistant plaque, and the deflection balloon technique inflates in the main vessel beyond a branch origin, not in the branch.",
        },
        {
          kind: "p",
          text: "**What goes wrong with microcatheters.** Over-rotation can deform and entrap the catheter, fracture it just behind the tip, or bind the wire inside it ('microcatheter fatigue'). If a microcatheter becomes hard to advance, or the wire inside it hard to steer, after long use, suspect fatigue and change it. After injecting contrast through it, flush it; rarely the wire becomes stuck and both have to come out. In retrograde CTO work, the tips of antegrade devices must never meet the retrograde microcatheter tip on the same wire, or they can interlock.",
        },
        { kind: "h", text: "Getting it out without losing the wire" },
        {
          kind: "p",
          text: "A microcatheter is an over-the-wire device. With a standard 180–190 cm wire, the wire is too short to hold while the microcatheter slides off it, so Brilakis describes four ways to remove or exchange a microcatheter (or any over-the-wire system): **trapping** (preferred), **hydraulic exchange**, a **wire extension**, and **circumcision**.",
        },
        {
          kind: "p",
          text: "**1. Trapping (the preferred technique).** It moves the wire least, so it protects the wire position and the distal vessel, and fluoroscopy is needed only as the withdrawal begins; it works with long (300 cm) wires as well as short ones. The full sequence is taught step by step in the module 'Engaging the coronary arteries' (exchanging catheters); in outline, applied to a microcatheter:",
        },
        {
          kind: "steps",
          title: "Trapping a microcatheter, in outline",
          items: [
            {
              title: "Microcatheter back, balloon in beside the wire",
              detail:
                "Bring the microcatheter back inside the guide to just short of where the balloon will sit, then pass the trapping balloon through the valve alongside the wire, never over it. Use a rapid-exchange compliant balloon or a dedicated trapping balloon; dedicated trapping balloons have a lower profile and can trap in smaller guides, whereas over-the-wire balloons are too bulky.",
            },
            {
              title: "Size, length and place",
              detail:
                "2.5 mm in a 6–7 Fr guide, 3.0 mm in a 7–8 Fr guide; ideally at least 20 mm long, which matters most with slippery polymer-jacketed wires. Place it beyond the microcatheter's distal marker, usually at or near the primary curve; in a short or shortened guide the balloon's shaft markers will not stop it slipping into the coronary.",
            },
            {
              title: "Inflate to 15–20 atm and withdraw",
              detail:
                "The trace damps while the balloon is up. Pull the microcatheter out without jerking it: a polymer-jacketed wire can slide past the balloon if you pull hard.",
            },
            {
              title: "Deflate, remove, back-bleed",
              detail:
                "Air is often drawn in during trapping, so back-bleed the Y-connector before any injection (or flush saline continuously while the catheter comes out).",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "**Guide size limits.** A 6 Fr guide cannot trap over-the-wire balloons or the larger dissection and re-entry devices; 6 Fr guides with a 0.071 inch lumen can trap low-profile microcatheters.",
            "**One device at a time.** Trying to trap several devices in one guide is more likely to fail, and the wire position is then lost. A balloon used for repeated trapping may deform and stick in the valve; replace it, or use its stylet to reinsert it.",
            "**Reuse an anchor balloon.** If an anchor balloon in a side branch is the right size (at least 2.5 mm when the guide is 6–7 Fr, at least 3.0 mm when it is 8 Fr), it can be deflated, pulled back into the guide and used to trap.",
            "**A guide extension with a built-in trapping balloon** (6–8 Fr) saves fluoroscopy and equipment, and works best with 135 cm microcatheters; 150 cm microcatheters are often too long to expose the wire for it.",
          ],
        },
        { kind: "tip", id: "pci-trap-then-backbleed" },
        {
          kind: "steps",
          title: "2. Hydraulic exchange",
          items: [
            {
              title: "Know its limits first",
              detail:
                "Easier than trapping but less reliable: the wire may not stay put. Do not use it with stiff-tip or polymer-jacketed wires (distal perforation), avoid it in CTO PCI in general, and avoid it for over-the-wire balloons and re-entry balloons, whose friction on the wire can pull it out. It works through any size of guide.",
            },
            {
              title: "Fill an inflation device with saline",
              detail: "Fill it to its maximum volume (a contrast and saline mix also works; a 3 mL Luer-lock syringe can be used, but the inflation device is preferred).",
            },
            {
              title: "Withdraw the microcatheter",
              detail: "As far as it will go, until the back end of the short wire is at the microcatheter hub.",
            },
            { title: "Connect wet to wet", detail: "Inflation device to the microcatheter hub." },
            {
              title: "Pressurise to 14–20 atm under fluoroscopy",
              detail: "Then withdraw the microcatheter while holding the pressure at 14–20 atm. If the pressure drops, the wire can come back with the catheter; if the wire starts to move, slow the withdrawal while keeping the pressure up.",
            },
          ],
        },
        {
          kind: "steps",
          title: "3. Wire extension",
          items: [
            {
              title: "Connect",
              detail: "Insert the back end of the short wire into an extension wire. This works with any guide size.",
            },
            {
              title: "Use the matching extension",
              detail: "Each maker's wires take that maker's extension (Brilakis lists lengths of 145 to 165 cm), so stock the extension for every wire family the lab uses.",
            },
            {
              title: "Tighten, but do not kink",
              detail: "Make the joint as tight as possible so it does not come apart as the microcatheter slides over it, without bending or kinking the wire.",
            },
          ],
        },
        {
          kind: "steps",
          title: "4. Circumcision (the last resort)",
          items: [
            {
              title: "When",
              detail:
                "Advanced and cumbersome, but useful when the wire is stuck inside the microcatheter, or when no extension is available and trapping is impossible. Works with any guide size.",
            },
            { title: "Withdraw", detail: "Pull the microcatheter back until the wire's back end reaches its hub." },
            {
              title: "Cut",
              detail: "On a hard surface (an upturned saline bowl works), cut around the microcatheter with a scalpel, as close to the Y-connector as you can, and remove the cut piece.",
            },
            { title: "Repeat", detail: "Usually two or three segments until it is all out." },
            {
              title: "Care",
              detail: "Do not cut the patient, yourself or the wire: a nicked wire may no longer take other equipment. The microcatheter is destroyed.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A polymer-jacketed 190 cm wire has crossed a tight lesion through a microcatheter in a 6 Fr guide. You now need to remove the microcatheter and keep the wire. Which plan follows Brilakis?",
          options: [
            "Hydraulic exchange at 14–20 atm, because it works in any guide and spares a balloon",
            "Trap with a 2.5 mm balloon at least 20 mm long at 15–20 atm, then back-bleed before injecting",
            "Trap with a 3.0 mm balloon 12 mm long, then inject at once to check the wire position",
            "Pull the microcatheter out under fluoroscopy while an assistant holds the wire at the valve",
          ],
          answer: 1,
          explanation:
            "Trapping is preferred, and in a 6 Fr guide the balloon is 2.5 mm; at least 20 mm length matters most with slippery polymer-jacketed wires, and the Y-connector must be back-bled before any injection because air is drawn in. Hydraulic exchange is specifically not for polymer-jacketed or stiff-tip wires because of distal perforation. A short wire cannot be held while a microcatheter slides off it, and injecting without back-bleeding risks air embolism.",
        },
        { kind: "tip", id: "pci-microcath-when-needed" },
        { kind: "tip", id: "pci-microcath-no-overspin" },
        { kind: "tip", id: "pci-microcath-hydraulic-limits" },
        { kind: "tip", id: "pci-microcath-cannot-trap" },
        {
          kind: "pitfalls",
          items: [
            "Deciding on a microcatheter only after the second wire exchange from the ostium.",
            "Spinning a braided microcatheter that is meant to be pushed, or over-spinning any microcatheter, until the tip breaks or the wire binds.",
            "Leaving contrast in the microcatheter so the wire sticks.",
            "Hydraulic exchange over a polymer-jacketed or stiff wire.",
            "A trapping balloon that is too small for the guide, too short for a slippery wire, or inflated next to hand-made side holes.",
            "Injecting after trapping without back-bleeding.",
            "Being without the matching extension wire, or 0.014 inch compatible coils, when you need them.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide on the microcatheter before you open the wire. Loaded together from the start, the microcatheter costs a minute; added after two failed exchanges, it costs the wire position you were trying to keep.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab mid-RCA CTO scenario, plan the microcatheter steps aloud: which category you would use to support the crossing wire, which wire you would exchange to after crossing, and how you would remove the microcatheter from your guide (balloon size, length, pressure, position and the back-bleed).",
        },
        { kind: "video", id: "hfWMiCb-GwM", note: "How to remove a microcatheter (Manual of PCI chapter video)." },
        { kind: "video", id: "j99o_-dOLKY", note: "Microcatheters (Manual of PCI chapter video)." },
        { kind: "video", id: "COqySRTm7h4", note: "Case: microcatheter tip fracture." },
        { kind: "video", id: "_nzqSXEUDYQ", note: "The microcatheter 'circumcision' technique." },
        {
          kind: "keypoints",
          items: [
            "Consider a microcatheter for any complex lesion (highly tortuous, near-occlusive, CTO) and whenever more than one wire is expected; load wire and microcatheter together.",
            "It supports and stiffens the wire, allows reshaping and exchanges, protects the proximal vessel, delivers drugs, contrast and embolic material; flush after contrast.",
            "Five categories: large, small, angulated, dual-lumen, plaque modification; know which can be spun and which way.",
            "Over-rotation causes deformation, entrapment, tip fracture and microcatheter fatigue.",
            "Removal over a 180–190 cm wire: trapping (preferred), hydraulic exchange, extension wire, circumcision.",
            "Trapping: beside the wire, 2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr, at least 20 mm, 15–20 atm near the primary curve, then back-bleed.",
            "Hydraulic exchange: 14–20 atm held throughout; never with polymer-jacketed or stiff-tip wires; avoid it in CTO PCI in general and for over-the-wire or re-entry balloons.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-wiring-q1",
      stem: "A patient with previous bypass surgery needs femoral PCI of a mid-body lesion in a vein graft to an obtuse marginal. The diagnostic run used a JR4. Which guide fits Brilakis's advice best?",
      options: [
        "A JR4, because the diagnostic JR4 engaged the graft without any difficulty",
        "An AL guide, which engages left-sided grafts more easily and supports more strongly",
        "A multipurpose guide, the most supportive shape for a left-sided vein graft",
        "An IM guide, whose larger distal bend suits any graft that leaves the aorta",
      ],
      answer: 1,
      explanation:
        "For left-sided vein grafts Brilakis notes that a JR4 engages most of them for diagnostic angiography, but for PCI (or from the radial) an AL guide engages more easily and gives stronger support. Multipurpose and LCB shapes can be used but often support less than an AL, and the IM curve is designed for internal mammary grafts. The diagnostic JR4 tempts because it worked for the pictures, but the PCI needs back-up.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q2",
      stem: "CT before a repeat procedure shows an ascending aorta of 4 cm, and the RCA arises more anteriorly than usual. Which pairing reflects Brilakis's guidance?",
      options: [
        "JL5 for the left; an AR or AL shape (1 or 2) for the RCA",
        "JL4 for the left, since a larger curve is needed only from 5 cm; JR4 for the RCA",
        "JL6 for the left; a JR5 turned further clockwise for the anterior RCA",
        "JL3.5 for the left, as the rotated root brings it closer; a multipurpose for the RCA",
      ],
      answer: 0,
      explanation:
        "Brilakis's rule of thumb is the aortic diameter in centimetres plus one, so a 4 cm aorta takes a JL5 (JL6 would suit 5 cm). A dilated root rotates anticlockwise and carries the RCA anteriorly, and for that he suggests AR1 or AR2, or AL1 or AL2, shapes. A smaller left curve does not follow from the rotation, and a JR or multipurpose shape is not in his advice for the anterior RCA.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q3",
      stem: "Which combination does Brilakis describe as optimal guide engagement for PCI?",
      options: [
        "No damping, coaxial in orthogonal projections, and about 2–3 mm deep",
        "Deep seating for maximum support, confirmed with one well-chosen view",
        "Slight damping accepted, provided the guide is coaxial and supportive",
        "Tip resting at the ostium without entering, with side holes for flow",
      ],
      answer: 0,
      explanation:
        "His three marks are no pressure damping, coaxial orientation verified in orthogonal projections, and an engagement depth of about 2–3 mm. Deep seating adds support but can cause dissection, damping and ischaemia; any damping is a stop sign, not something to accept; and side holes mask damping rather than solve it.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q4",
      stem: "During PCI of a tight ostial left main lesion, the EBU guide ventricularises every time it engages. What is the best way to continue?",
      options: [
        "Exchange for a side-hole guide so the trace stays normal while engaged",
        "Wire the LAD, keep the guide just outside and engage only to inject or deliver",
        "Change up to an 8 Fr guide, which gives more support and better opacification",
        "Inject gently while engaged, since a small volume rarely dissects the left main",
      ],
      answer: 1,
      explanation:
        "For damping from an ostial lesion Brilakis keeps the guide disengaged, helped by a 0.014 inch wire in the vessel, and engages intermittently; a smaller French size or a less deep-seating shape are the next steps. Side-hole guides hide damping and are not for an unprotected left main. Larger guides damp more often and Oxford links 7–8 F manipulation to left main dissection. Nothing is injected through a damped guide.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q5",
      stem: "A workhorse wire will not pass through a tortuous mid-circumflex. Which of these is among the options Brilakis lists for wiring tortuous lesions?",
      options: [
        "A stiff, tapered penetrating wire with a high tip load",
        "An externalisation wire, whose extra length eases later exchanges",
        "A support wire with distal waves, used as the primary crossing wire",
        "An advanced workhorse: composite core, dual core or nitinol",
      ],
      answer: 3,
      explanation:
        "Brilakis lists three options for tortuous lesions, without ranking them: an advanced workhorse (composite core, dual core or nitinol), a soft wire with a hydrophilic-coated tip, or a soft non-tapered polymer-jacketed wire; wires with higher tip loads and slippery coatings come only after a standard workhorse fails. Stiff penetrating wires are CTO tools, externalisation wires (330 and 350 cm) belong to retrograde CTO PCI, and the waved support wire is exchanged in after crossing, never used to cross.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q6",
      stem: "You plan to wire a large RCA whose PDA leaves at a sharp angle. A single small distal bend reaches the crux but cannot turn into the PDA. Which change in tip shape does Brilakis describe for this?",
      options: [
        "A second, larger proximal bend behind a smaller distal bend, to extend the wire's reach",
        "A longer single bend, made by drawing the wire along the needle, longer than the PDA is wide",
        "A straightened tip with no bend, so that the wire follows the flow into the PDA",
        "A pre-shaped tip, because pre-shaped wires give the widest choice of shapes",
      ],
      answer: 0,
      explanation:
        "Brilakis describes two bends (a usually larger proximal bend and a smaller distal one) to improve reach in larger vessels and at angulated ostia. His general rule is that a distal bend should be smaller than the target vessel diameter. A larger single bend is also one of his options for an angulated branch (his figure on wiring through tortuosity), provided the distal bend stays smaller than the branch is wide; the long single bend offered here fails only because it breaks that rule. Pre-shaped tips limit, rather than widen, the shapes available.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q7",
      stem: "While contrast is injected to check the guide, the wire waiting in the guide shoots 3 cm into the artery. What does Brilakis advise?",
      options: [
        "Withdraw it into the guide at once and re-advance under fluoroscopy",
        "Remove and discard it, because an unseen advance damages the tip",
        "Push it on to the distal vessel so the shaft stabilises the guide",
        "Leave it, inject to see where it lies, redirect only if needed",
      ],
      answer: 3,
      explanation:
        "Do not remove the wire: sometimes it has entered the intended branch. Check its position with contrast and redirect it if necessary. Prevention is watching the tip and setting the torque device about 90 cm from the tip as a stop; a proximal shaft marker on some wires also helps.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q8",
      stem: "A first diagonal leaves the LAD at an acute backward angle. Reshaped wires and an angulated microcatheter keep prolapsing into the distal LAD. You decide on a reversed (hairpin) wire. Which description of the technique is correct?",
      options: [
        "A stiff tapered wire bent 1 cm from its tip and pushed straight into the diagonal ostium under a roadmap",
        "A workhorse wire loaded tip first, advanced into the diagonal, then reversed at its back end so the shaft leads",
        "A polymer-jacketed wire bent 180 degrees about 3 cm from its tip, loaded bend first, overshot and pulled back",
        "A balloon inflated in the LAD just proximal to the diagonal origin so that the wire is pushed into the branch",
      ],
      answer: 2,
      explanation:
        "The reversed wire uses a polymer-jacketed wire bent back about 3 cm from its tip; the bend, not the tip, goes through the valve, the hairpin overshoots the branch in the main vessel and then hooks the ostium as it is withdrawn. It can dissect, and once the hairpin has entered the vessel being wired, the bend can make further advancement difficult. The deflection balloon is inflated just distal (not proximal) to the branch origin.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q9",
      stem: "After a supportive wire is placed in a tortuous LAD, smooth narrowings appear at two bends and do not change with intracoronary nitrate. Which finding confirms that they are pseudolesions?",
      options: [
        "They persist after the wire is exchanged for an even stiffer support wire",
        "They resolve only after a glycoprotein IIb/IIIa inhibitor has been started",
        "They show contrast staining that persists after the injection has cleared",
        "They resolve when the wire is partly withdrawn but kept across the lesion",
      ],
      answer: 3,
      explanation:
        "Pseudolesions come from the wire straightening and folding a tortuous artery; Brilakis shows them by partial wire withdrawal, so that the soft distal segment lies just beyond the lesion, notes that intravenous vasodilators do not correct them, and removes equipment only after excluding dissection (for example with IVUS). Persistent contrast staining suggests dissection, and a stiffer wire would worsen the folding.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q10",
      stem: "In a 6 Fr guide you need to remove a microcatheter over a 190 cm polymer-jacketed wire that has just crossed a lesion. Which approach is wrong according to Brilakis?",
      options: [
        "Hydraulic exchange with the inflation device held at 14–20 atm",
        "Trapping with a 2.5 mm balloon at least 20 mm long inflated at 15–20 atm",
        "Using the wire maker's matching extension wire and tightening the joint",
        "Exchanging for a workhorse through the microcatheter first, then trapping",
      ],
      answer: 0,
      explanation:
        "Brilakis rules out hydraulic exchange over stiff-tip or polymer-jacketed wires because of the risk of driving the wire forward and perforating distally; it is also less reliable than trapping. Trapping with a long balloon is preferred, especially with slippery wires; extension wires work in any guide; and exchanging to a workhorse before removal follows the escalate and de-escalate principle.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q11",
      stem: "You are trapping a wire in an 8 Fr guide. Which trapping balloon size does Brilakis give?",
      options: ["2.0 mm", "2.5 mm", "3.0 mm", "3.5 mm"],
      answer: 2,
      explanation:
        "Brilakis sizes the trapping balloon to the guide: 6–7 Fr guides take 2.5 mm and 7–8 Fr guides take 3.0 mm, ideally at least 20 mm long and inflated to 15–20 atm near the primary curve.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-wiring-q12",
      stem: "Which statement about microcatheters is correct?",
      options: [
        "Every microcatheter can be spun freely in either direction to help it advance",
        "Contrast can go through most microcatheters, which are flushed afterwards",
        "An over-the-wire balloon shows its tip position better than a microcatheter",
        "Any coronary microcatheter can deliver 0.018 inch coils into a perforation",
      ],
      answer: 1,
      explanation:
        "Contrast can be injected through microcatheters (the stranded-steel plaque modification type is the exception) and they should be flushed afterwards to keep the wire from sticking. Braided microcatheters without a coil are not designed to be spun, and plaque modification designs turn in a set direction. Small over-the-wire balloons carry one mid-balloon marker, whereas microcatheters are marked at the tip, and coronary microcatheters, with one exception, cannot take 0.018 inch coils.",
      difficulty: 2,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "cathlab", task: "From the right radial, seat an EBU 3.5 for the LAD and an AL1 for the RCA; for each, name the trace, confirm coaxiality in two orthogonal views and set the depth to just inside the ostium before any wire goes in." },
    { sim: "procedure", task: "At the table stage, prepare the Y-connector and wire: valve closed and flushed, a small distal bend, tip hidden in the introducer, introducer through the valve, torque device set about 90 cm from the tip." },
  ],
  caseIds: ["pm-wiring-case-marginal", "pm-wiring-case-radial-rca"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-wiring-case-marginal",
    title: "A tortuous obtuse marginal from the right radial",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 1.8, 5.5, 5.6, 5.7, 6.2, 8.1–8.10, 9.7, 30.2, 30.6 and 30.7; Oxford Handbook, chapter 8 (guiding catheters, angioplasty guide wires) and chapter 10 (left main stem dissection)",
    },
    summary:
      "Elective PCI of a severe lesion in an acutely angled obtuse marginal beyond a tortuous circumflex, from the right radial: choosing and seating the guide, choosing and escalating the wire, beating prolapse, stepping back down to a workhorse, and removing the microcatheter safely.",
    presentation:
      "A 71-year-old woman with exertional angina on medical therapy. The heart team has recommended PCI of a severe mid obtuse marginal stenosis. The report from an earlier attempt three years ago reads: 'unable to wire the OM with a workhorse wire; procedure abandoned'.",
    findings: [
      "Blood pressure 132/74 mmHg, sinus rhythm 68/min",
      "Right radial access, 6 Fr sheath",
      "Severe stenosis in the mid first obtuse marginal, a vessel of about 2.75 mm, beyond two tight bends in the proximal circumflex; the OM leaves at an acute angle",
      "Aortic root of normal size; left main without disease",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which guide do you choose for this circumflex territory lesion from the right radial?",
        options: [
          {
            text: "A 6 Fr EBU 4.0",
            best: true,
            feedback:
              "An extra-support family gives the back-up a tortuous circumflex needs, the larger curve favours the circumflex, and the right radial supports left coronary PCI better than the left radial (Brilakis 5.7, 9.7, 30.2.6).",
          },
          {
            text: "A 6 Fr EBU 3.0",
            feedback: "The right family, but Brilakis pairs smaller curves with the LAD and larger ones with the circumflex. The wire will tend to head for the LAD.",
            stateDelta: { stability: -5, flags: ["lad-curve"] },
          },
          {
            text: "A 6 Fr JL4, which engaged easily at the diagnostic study",
            feedback: "Brilakis generally avoids JL guides for PCI because they give poor support, and Oxford grades the JL lowest for the circumflex. Easy engagement is not the same as back-up.",
            stateDelta: { stability: -10, flags: ["weak-guide"] },
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "The EBU 4.0 engages and the trace is unchanged from baseline. In LAO caudal it looks coaxial, but in RAO caudal the tip points up at the roof of the left main and sits about a centimetre deep. What next?",
        options: [
          {
            text: "Ease the guide back to just inside the ostium and recheck the alignment in both views before wiring",
            best: true,
            feedback:
              "Brilakis's optimal engagement is undamped, coaxial in orthogonal projections and about 2–3 mm deep. One view hid the problem; the second showed it.",
          },
          {
            text: "Give a test injection now to define the left main",
            next: "c-lm",
            feedback: "Oxford lists contrast injection with the guide tip pointing at the roof of the left main among the causes of left main dissection.",
            stateDelta: { stability: -30, flags: ["lm-dissection"] },
          },
          {
            text: "Leave it deep: the extra support will help with this lesion",
            feedback: "Deep seating adds support but can dissect, damp and cause ischaemia, and Brilakis rarely does it in the left coronary. It is an escalation step, not a starting position.",
            stateDelta: { stability: -10, flags: ["deep-guide"] },
          },
        ],
      },
      {
        id: "c-lm",
        kind: "consequence",
        prompt: "Contrast lingers in the wall of the left main after the injection. The patient has chest pain and ST elevation in I and aVL. What do you do?",
        info: "Blood pressure 104/66 mmHg, heart rate 96/min.",
        options: [
          {
            text: "Stop injecting, call for help, wire the true lumen gently and prepare to stent the left main",
            best: true,
            feedback:
              "Larger dissections are stented, and once a wire is in the true lumen it must not be lost (Brilakis 5.6.4.3). No further injections into the dissection. Confirm the wire is in the true lumen with IVUS rather than more contrast, have femoral access ready for mechanical support, and involve the surgeons if the bifurcation is involved and the patient is stable (Oxford).",
          },
          {
            text: "Inject again to see how far the dissection extends",
            feedback: "Every further injection can extend the dissection. Stop injecting.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The guide now sits coaxially, about 2–3 mm into the left main, with a free trace. How do you set up the wire?",
        options: [
          {
            text: "A workhorse with a small distal bend shorter than the OM is wide, loaded inside a microcatheter from the start",
            best: true,
            feedback:
              "Start with a workhorse (Brilakis 8.2). The report says a workhorse failed last time, so a second wire to cross the lesion is likely; when more than one wire is anticipated, Brilakis recommends a microcatheter from the start. Wire and microcatheter go in together, with no introducer.",
          },
          {
            text: "A workhorse alone, adding a microcatheter later only if it is needed",
            acceptable: true,
            feedback: "Reasonable, but the failed workhorse last time makes a second wire likely; without a microcatheter each exchange means re-wiring from the ostium.",
          },
          {
            text: "A stiff, tapered wire to get through the bends quickly",
            feedback: "Stiff penetrating wires are CTO tools and raise the risk of dissection and perforation; Brilakis reserves higher tip loads for when the workhorse has failed.",
            stateDelta: { stability: -15, flags: ["aggressive-wire"] },
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "With the microcatheter supporting it in the proximal circumflex, the workhorse reaches the OM origin, but every attempt to turn into the OM prolapses the tip down the circumflex.",
        info: "The OM origin is clearest in RAO caudal, which you use as a stored reference image.",
        options: [
          {
            text: "Reshape the tip with a larger bend through the microcatheter, and if it still prolapses change to a soft non-tapered polymer-jacketed wire",
            best: true,
            feedback:
              "Brilakis's first solutions for tortuosity: change the tip shape and the wire, using the microcatheter to reshape and exchange without losing ground. A large bend suits an angulated branch.",
          },
          {
            text: "Form a reversed (hairpin) polymer-jacketed wire and hook the OM on pull-back",
            acceptable: true,
            feedback: "One of Brilakis's four solutions and a good one for acute angles, but it can dissect and is harder to advance once in; simpler changes come first.",
          },
          {
            text: "Point the tip at the OM and push harder",
            next: "c-wire-dissection",
            feedback: "Forcing a deflected tip is how wires dissect vessels. Brilakis pulls back and rotates slightly before readvancing.",
            stateDelta: { stability: -20, flags: ["wire-dissection"] },
          },
        ],
      },
      {
        id: "c-wire-dissection",
        kind: "consequence",
        prompt: "The tip buckles and a linear filling defect appears at the OM origin. Distal OM flow is preserved. What now?",
        options: [
          {
            text: "Leave the first wire, pass another wire into the distal true lumen, confirm it and plan to stent",
            best: true,
            feedback: "Brilakis's answer to a wiring dissection: a wire in the distal true lumen, then stenting. Gentle handling from here on.",
          },
          {
            text: "Inject contrast through the microcatheter at the wire tip to find the lumen",
            feedback: "If the tip is subintimal, a distal microcatheter injection extends the dissection (Brilakis 8.7.4).",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "A soft polymer-jacketed wire, steered through the microcatheter, crosses the lesion into the distal OM. What is the next step?",
        options: [
          {
            text: "Take the microcatheter beyond the lesion and exchange the wire for a workhorse before any balloon",
            best: true,
            feedback: "Escalate, then de-escalate: polymer-jacketed wires are exchanged for a workhorse before balloons and stents (Brilakis 8.2, 8.6.2.9, 30.7.2).",
          },
          {
            text: "Deliver the balloon over the polymer-jacketed wire while watching its tip continuously",
            acceptable: true,
            feedback: "Brilakis allows this only with constant monitoring of the tip, because distal perforation is the risk. Exchanging is safer.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Deliver the balloon now and keep your eyes on the balloon",
            next: "c-perforation",
            feedback: "Slippery tips advance as devices go forward; a tip nobody is watching can perforate a small distal branch.",
            stateDelta: { stability: -25, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "c-perforation",
        kind: "consequence",
        prompt: "The wire tip has run into a tiny distal branch, and a small blush of contrast spreads beyond it.",
        info: "Blood pressure 118/70 mmHg. No pericardial effusion yet.",
        options: [
          {
            text: "Stop the bleeding with a balloon inflated just upstream of the perforation, and prepare for embolisation",
            best: true,
            feedback: "Brilakis's first step for a distal wire perforation; if contrast still leaks after balloon inflation, definitive treatment is usually fat or coil embolisation (module 'Perforation and tamponade').",
          },
          {
            text: "Pull the wire back and carry on with the stent",
            feedback: "Distal perforations can bleed into the pericardium and cause tamponade; they need treating, not ignoring.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "A 190 cm workhorse wire is now beyond the lesion. The microcatheter has to come out of the 6 Fr guide. How?",
        options: [
          {
            text: "Trap: a 2.5 mm balloon at least 20 mm long beside the wire near the primary curve, 15–20 atm, then withdraw the microcatheter",
            best: true,
            feedback: "Trapping is Brilakis's preferred technique; the size, length, pressure and position follow his steps.",
          },
          {
            text: "Hydraulic exchange, holding the inflation device at 14–20 atm during withdrawal",
            acceptable: true,
            feedback: "Acceptable over a workhorse wire outside CTO PCI, but less reliable than trapping: the wire may move.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Pull the microcatheter out while the assistant holds the wire at the valve",
            next: "c-lost-wire",
            feedback: "A 190 cm wire is too short to hold while a microcatheter slides off it; the wire comes out with it.",
            stateDelta: { stability: -20, flags: ["lost-wire"] },
          },
        ],
      },
      {
        id: "c-lost-wire",
        kind: "consequence",
        prompt: "The wire tip is now back in the proximal circumflex. What next?",
        options: [
          {
            text: "Re-wire the OM, using a new microcatheter if needed",
            best: true,
            feedback: "Loss of wire position is treated by re-wiring the vessel (Brilakis 8.9.2.1). Do it carefully: the OM origin has already been hard to enter.",
          },
          {
            text: "Advance the balloon from where the wire lies and try to cross the lesion with it",
            feedback: "A balloon cannot be steered into a branch without a wire across the lesion.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The trapping balloon has been deflated and removed. The nurse hands you the manifold to inject and check the wire.",
        options: [
          {
            text: "Back-bleed the Y-connector first, then aspirate and check the guide position before injecting",
            best: true,
            feedback: "Air is often drawn into the guide during trapping; back-bleeding before the injection prevents coronary air embolism (Brilakis 8.9.2.1).",
          },
          {
            text: "Inject at once: the wire position needs checking quickly",
            next: "c-air",
            feedback: "Injecting without back-bleeding after trapping makes coronary air embolism likely.",
            stateDelta: { stability: -25, flags: ["air"] },
          },
        ],
      },
      {
        id: "c-air",
        kind: "consequence",
        prompt: "The injection is followed by chest pain, ST elevation and slowing of flow in the circumflex. What do you do?",
        info: "Blood pressure 96/58 mmHg, heart rate 54/min.",
        options: [
          {
            text: "Give 100% oxygen and, if flow stops, aspirate through the guide; support the circulation",
            best: true,
            feedback: "Brilakis's treatment of coronary air embolism: 100% oxygen, which helps the air to be absorbed; if antegrade flow stops, aspiration through the guide or a thrombectomy catheter; repeated forceful saline injections may clear the air; intracoronary epinephrine (Brilakis reports 0.05 mg; follow local protocol) has also been used; and haemodynamic support if shock or arrest develops (module 'No-reflow, embolism and stroke').",
          },
          {
            text: "Withdraw the wire so the air can escape back into the guide",
            feedback: "Pulling the wire does nothing for air in the artery and gives up the position you need.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "The OM lesion is prepared and stented over the workhorse wire. The final angiogram in two views shows a good result, TIMI 3 flow and the wire tip in a safe distal position before the wire is withdrawn.",
    outcomeVariants: [
      { flag: "weak-guide", text: "The JL4 backed out each time a device met resistance and had to be exchanged for an extra-support guide over the wire." },
      { flag: "lad-curve", text: "The small curve kept steering the wire towards the LAD, which cost time and contrast." },
      { flag: "deep-guide", text: "The deeply seated guide damped intermittently during the case and had to be repositioned." },
      { flag: "lm-dissection", text: "A left main dissection from an injection with the guide tip against the roof needed left main stenting." },
      { flag: "aggressive-wire", text: "A stiff wire raised the risk of injury without solving the angulation." },
      { flag: "wire-dissection", text: "A wire dissection at the OM origin was treated by wiring the true lumen and stenting." },
      { flag: "perforation", text: "A distal wire perforation was sealed after balloon tamponade and embolisation; an echocardiogram was arranged." },
      { flag: "lost-wire", text: "The wire was lost during microcatheter removal and the OM had to be re-wired." },
      { flag: "air", text: "Coronary air embolism after trapping was treated with oxygen and aspiration." },
    ],
    learningPoints: [
      "Read the old report (Brilakis asks whether the lesion was hard to wire before): if a second wire is likely to be needed to cross, plan a microcatheter from the start.",
      "Left PCI: an extra-support guide, larger curve for the circumflex; the right radial supports left coronary PCI better than the left radial.",
      "Confirm coaxiality in two views and a depth of about 2–3 mm; never inject with the tip pointing at the left main roof.",
      "Workhorse first; change shape and wire before reversed wires or deflection balloons; never force a deflected tip.",
      "After crossing with a polymer-jacketed wire, exchange for a workhorse before balloons and stents.",
      "Remove a microcatheter over a short wire by trapping (2.5 mm in 6–7 Fr, at least 20 mm, 15–20 atm), then back-bleed before injecting.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-wiring-case-radial-rca",
    title: "Right radial RCA PCI: support, a damped guide and a straightened artery",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 5.6, 5.7, 5.8, 8.6–8.10, 15.1, 18.8, 25.2 and 30.2; Oxford Handbook, chapter 6 (use of nitrates) and chapter 8 (angioplasty guide wires, chronic total occlusion PCI)",
    },
    summary:
      "PCI of a severe mid-RCA lesion in a dominant, tortuous RCA from the right radial: choosing a supportive guide, working with a guide that damps, choosing views, steering past a branch, crossing with a free tip, recognising pseudolesions and protecting the distal vessel.",
    presentation:
      "A 66-year-old man with exertional angina and inferior ischaemia on stress imaging. Angiography showed a severe mid-RCA stenosis in a dominant, tortuous vessel, and PCI is planned from the right radial.",
    findings: [
      "Blood pressure 140/82 mmHg, sinus rhythm 72/min",
      "Right radial access, 6 Fr sheath",
      "Dominant RCA with moderate ostial narrowing, two tight bends in the proximal and mid vessel, and a severe mid-RCA stenosis",
      "The PDA leaves the crux at a sharp angle",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which guide do you choose?",
        options: [
          {
            text: "A 6 Fr AL1",
            best: true,
            feedback: "From the radial Brilakis prefers AL guides for RCA PCI; AL guides give the strongest support for complex RCA work.",
          },
          {
            text: "A 6 Fr Ikari right",
            acceptable: true,
            feedback: "Also on Brilakis's radial RCA list (with the 3D Right). Either is reasonable; the JR is the one to avoid.",
          },
          {
            text: "A 6 Fr JR4",
            feedback: "Brilakis advises avoiding JR guides for radial RCA PCI because their support is often poor.",
            stateDelta: { stability: -10, flags: ["weak-guide"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The AL1 engages the RCA and the trace ventricularises. What do you do?",
        options: [
          {
            text: "Disengage at once without injecting, pass a 0.014 inch wire into the RCA, then keep the guide just outside and engage only to inject or deliver",
            best: true,
            feedback: "Brilakis's approach to damping from an ostial lesion: keep the guide disengaged, helped by a wire in the vessel, and engage intermittently. Take the AL off gently rather than with a straight pull (the Academy diagnostic lesson 'Catheter anatomy and the main shapes' shows how to lift an Amplatz out). Once the wire is in, take the guide off the ostium by turning it to a non-coaxial position rather than pulling it back, which can drag the wire out (module 'Engaging the coronary arteries').",
          },
          {
            text: "Change to a smaller French size guide of a shape that seats less deeply",
            acceptable: true,
            feedback: "Also in Brilakis's list, but you lose the AL's support and have to re-engage. Try working with the guide disengaged over a wire first.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Give a gentle test injection to see the ostium",
            next: "c-ostial",
            feedback: "Never inject into a damped or ventricularised guide; aggressive shapes such as the AL dissect when handled carelessly.",
            stateDelta: { stability: -30, flags: ["aorto-ostial-dissection"] },
          },
        ],
      },
      {
        id: "c-ostial",
        kind: "consequence",
        prompt: "Contrast stains the aortic wall around the RCA ostium and persists after the injection.",
        info: "Blood pressure 128/76 mmHg. The patient reports mild chest discomfort.",
        options: [
          {
            text: "Stop injecting and plan to stent the ostium to seal the entry point, flaring the stent at high pressure",
            best: true,
            feedback: "Brilakis's treatment of aorto-coronary dissection: no more injections, stent the coronary ostium to seal the entry, often with high-pressure flaring; a covered stent if that fails.",
          },
          {
            text: "Inject again to see whether the stain is spreading",
            feedback: "More contrast drives the dissection further into the aortic wall. Do not inject.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "With the guide working just outside the ostium, which views do you use to wire the RCA?",
        options: [
          {
            text: "LAO to reach the distal RCA, then LAO or AP cranial to enter the PDA",
            best: true,
            feedback: "Brilakis's view advice for the RCA (8.6.2.1).",
          },
          {
            text: "RAO caudal throughout, the view used for the circumflex",
            feedback: "RAO caudal helps circumflex wiring; it is not one of Brilakis's RCA wiring views.",
            stateDelta: { stability: -5 },
          },
          {
            text: "A single AP view, injecting more often to compensate",
            feedback: "More contrast is not a substitute for the right projection and a stored reference image.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "At the first bend the wire keeps entering a right ventricular branch instead of continuing down the RCA.",
        options: [
          {
            text: "Reshape the tip, make sure the guide points coaxially when engaged, and add a microcatheter if it persists",
            best: true,
            feedback: "Brilakis's treatment for a wire that keeps entering a side branch: reposition the guide, change the tip shape; a microcatheter improves torque and lets you reshape without losing ground.",
          },
          {
            text: "Leave this wire in the branch and steer a second wire past it",
            acceptable: true,
            feedback: "Also in Brilakis's list: the first wire steadies the guide while the second is directed into the target.",
          },
          {
            text: "Push harder: the wire will eventually find the main vessel",
            feedback: "Forcing the tip into a small branch risks dissecting or perforating it, and does not change its direction.",
            stateDelta: { stability: -10, flags: ["branch-injury"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "At the mid-RCA lesion the tip stops responding to rotation and the distal coil bows as you push.",
        options: [
          {
            text: "Pull back, rotate slightly and readvance with the tip free",
            best: true,
            feedback: "A restrained tip may be under a plaque. Brilakis withdraws and readvances; a free tip both crosses and spares the vessel.",
          },
          {
            text: "Leave the wire and pass a parallel wire beside it",
            acceptable: true,
            feedback: "Brilakis's alternative when the tip is restrained.",
          },
          {
            text: "Push firmly through the resistance",
            next: "c-rca-dissection",
            feedback: "Aggressive advancement of a restrained tip dissects the vessel and can trap the tip.",
            stateDelta: { stability: -25, flags: ["wire-dissection"] },
          },
        ],
      },
      {
        id: "c-rca-dissection",
        kind: "consequence",
        prompt: "The wire has gone through, but its course looks wrong in the orthogonal view, it moves oddly with each beat and there are runs of ventricular ectopics. Distal flow is slower.",
        options: [
          {
            text: "Leave the wire as a marker, pass a second wire into the distal true lumen, confirm it (IVUS if needed), then stent",
            best: true,
            feedback: "Abnormal course, abnormal motion and ectopics suggest an extraluminal wire (Oxford). Brilakis requires a confirmed distal true-lumen wire before ballooning or stenting.",
          },
          {
            text: "Balloon over the current wire to restore flow quickly",
            feedback: "Brilakis requires a confirmed distal true-lumen wire position before any balloon or stent; this wire may be subintimal.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s6",
        prompt:
          "The workhorse wire is in the distal RCA. To help stent delivery you exchange it, through a microcatheter, for a support wire. Two new, smooth narrowings now appear at the bends around and beyond the mid-RCA lesion. Flow is preserved and intracoronary nitrate has made no difference.",
        options: [
          {
            text: "Pull the support wire back partly, so that its soft distal segment lies just beyond the lesion, and look again",
            best: true,
            feedback: "These behave like pseudolesions from straightening. Partial withdrawal shows whether they resolve; vasodilators do not correct pseudolesions (Brilakis 8.7.4, 18.8.3). Keep the wire across the lesion; do not withdraw it proximal to the lesion, or an acute closure could not be treated.",
          },
          {
            text: "Give another dose of intracoronary nitrate, in case this is spasm",
            feedback: "Already given. Oxford notes that stiff wires can provoke spasm and advises a nitrate trial when in doubt, which has been done; nitrate does not correct pseudolesions (Brilakis 18.8.3). Partial wire withdrawal is the next test.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Stent both narrowings while the support wire is in place",
            feedback: "Stenting pseudolesions treats a problem that is not there; the narrowings come from the wire.",
            stateDelta: { stability: -15, flags: ["stented-pseudolesion"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "As the stent advances, the wire tip has moved forward into a small distal posterolateral twig.",
        options: [
          {
            text: "Pull the wire back into a larger branch and keep the tip in view for the rest of the delivery",
            best: true,
            feedback: "Brilakis monitors the tip continuously or intermittently, most of all when devices are hard to deliver, because that is when the wire moves.",
          },
          {
            text: "Ignore it: the tip is soft and the stent is nearly there",
            next: "c-distal-perf",
            feedback: "A wire tip driven into a small branch during delivery is a classic cause of distal perforation.",
            stateDelta: { stability: -25, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "c-distal-perf",
        kind: "consequence",
        prompt: "Contrast extravasates from the end of the small branch after the stent is deployed.",
        info: "Blood pressure 112/70 mmHg, heart rate 88/min.",
        options: [
          {
            text: "Stop the bleeding with a balloon inflated just upstream of the perforation, and prepare for embolisation",
            best: true,
            feedback: "The first step for a distal wire perforation, while definitive treatment is prepared; if contrast still leaks after balloon inflation, that is usually fat or coil embolisation.",
          },
          {
            text: "Remove the wire and finish the case",
            feedback: "Removing the wire gives up control of a bleeding vessel. Seal it first.",
            stateDelta: { stability: -20 },
          },
        ],
      },
    ],
    outcome:
      "The mid-RCA lesion is stented with the guide working just outside the ostium. The narrowings resolved on partial withdrawal of the support wire, confirming pseudolesions, and the final angiogram shows a good result with the distal vessel intact.",
    outcomeVariants: [
      { flag: "weak-guide", text: "The JR4 backed out repeatedly and the stent could not be delivered until the guide was exchanged for an AL." },
      { flag: "aorto-ostial-dissection", text: "An aorto-coronary dissection at the RCA ostium was sealed by ostial stenting with high-pressure flaring." },
      { flag: "branch-injury", text: "Forcing the wire into the right ventricular branch injured it; it was monitored on the final run." },
      { flag: "wire-dissection", text: "A wiring dissection at the lesion was treated by wiring the true lumen and stenting." },
      { flag: "stented-pseudolesion", text: "Stents were placed in segments that were later shown to be pseudolesions." },
      { flag: "perforation", text: "A distal wire perforation was sealed with a balloon and embolisation; an echocardiogram was arranged." },
    ],
    learningPoints: [
      "From the radial, RCA PCI needs an AL1, Ikari right or 3D Right rather than a JR.",
      "A guide that damps on an ostial lesion is kept just outside over a wire and engaged only when needed; never inject into it, and turn it off the ostium rather than pulling it back.",
      "Wire the RCA in LAO and enter the PDA in LAO or AP cranial.",
      "A wire that keeps entering a branch: reshape, re-seat the guide, add a microcatheter or a second wire.",
      "A restrained tip is withdrawn and readvanced, never forced; confirm the true lumen before ballooning.",
      "New narrowings after a stiff wire in a tortuous vessel may be pseudolesions: partial withdrawal, with the soft tip still beyond the lesion, reveals them.",
      "Watch the wire tip during every delivery.",
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-guide-left-extra-support",
    lab: "pci",
    when: { phase: ["plan", "guide"], vessel: ["LM", "LAD", "LCx"] },
    title: "Left PCI: an extra-support curve, sized to the branch",
    text: "Use an extra-support family (EBU, XB, Voda) rather than a JL, which gives weak support. A smaller curve favours the LAD and a larger one (4.0) the circumflex; in a dilated root, go up in size.",
    tone: "do",
    lessonId: "pm-wiring-guide-choice",
    sources: [
      { book: "brilakis-pci", loc: "30.2" },
      { book: "brilakis-pci", loc: "5.7" },
      { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-guide-rca-support",
    lab: "pci",
    when: { phase: ["plan", "guide"], vessel: ["RCA"] },
    title: "RCA PCI: AL1 for complex work and from the radial",
    text: "A JR4 suits a simple RCA lesion from the femoral route. For complex RCA work an AL1 gives the strongest support, and from the radial Brilakis prefers an AL1, Ikari right or 3D Right because JR guides often support poorly. Handle Amplatz shapes gently: they can dissect.",
    tone: "do",
    lessonId: "pm-wiring-guide-choice",
    sources: [
      { book: "brilakis-pci", loc: "5.7" },
      { book: "brilakis-pci", loc: "30.2" },
      { book: "brilakis-pci", loc: "5.6" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-guide-seat-three-marks",
    lab: "pci",
    when: { phase: ["guide"] },
    title: "Seat the guide: undamped, coaxial in two views, 2–3 mm in",
    text: "Before the wire goes in, check the trace is unchanged, the tip is coaxial in two orthogonal views and it sits about 2–3 mm into the ostium. Deeper adds support but risks dissection, damping and ischaemia. Re-check after every device comes out.",
    tone: "do",
    lessonId: "pm-wiring-guide-seat",
    sources: [
      { book: "brilakis-pci", loc: "5.7" },
      { book: "brilakis-pci", loc: "9.7" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-guide-damped-work-outside",
    lab: "pci",
    when: { phase: ["guide", "wire"], event: ["pressure-damped", "pressure-ventricularised"] },
    title: "Guide damps on an ostial lesion: work from outside",
    text: "Do not inject. Disengage until the trace recovers, taking an Amplatz off gently rather than with a straight pull; if it does not recover, follow the damping algorithm (aspirate, check the transducer, look for a kink) and, if these steps fail, remove the guide while aspirating with a syringe, without injecting and without passing a wire through it. For an ostial lesion or a small vessel, pass a 0.014 inch wire into the vessel and keep the guide just outside, engaging only to inject or deliver and turning it off the ostium rather than pulling it back. If that fails, use a smaller French size or a less deep-seating shape; avoid side-hole guides in an unprotected left main.",
    tone: "caution",
    lessonId: "pm-wiring-guide-seat",
    sources: [
      { book: "brilakis-pci", loc: "5.8" },
      { book: "brilakis-pci", loc: "5.6" },
      { book: "brilakis-pci", loc: "15.1" },
      { book: "brilakis-pci", loc: "30.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-guide-wire-direction",
    lab: "pci",
    when: { phase: ["wire"], event: ["non-coaxial", "wire-side-branch"] },
    title: "Wire goes the wrong way? Look at the guide",
    text: "A wire that will not leave the guide tip usually means suboptimal engagement (not coaxial, too deep or damped): re-seat the guide. If it keeps entering the conus branch, withdraw the guide a little and re-seat it coaxially. A wire that keeps choosing the circumflex over the LAD may need a smaller guide curve, or leave it there to steady the guide and wire the LAD with a second.",
    tone: "do",
    lessonId: "pm-wiring-guide-seat",
    sources: [{ book: "brilakis-pci", loc: "8.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-start-workhorse",
    lab: "pci",
    when: { phase: ["wire"] },
    title: "Start with a workhorse, come back to one",
    text: "Begin with a workhorse wire. Move to hydrophilic-tipped or polymer-jacketed wires only when it fails, and once across, exchange back to a workhorse (or a support or atherectomy wire) before balloons and stents.",
    tone: "do",
    lessonId: "pm-wiring-wire-choice",
    sources: [
      { book: "brilakis-pci", loc: "8.2" },
      { book: "brilakis-pci", loc: "8.6" },
      { book: "brilakis-pci", loc: "30.7" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-expect-two-bring-microcatheter",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Expect more than one wire? Plan a microcatheter",
    text: "If the lesion may need one wire to reach it and another to cross it (for example because it was hard to wire before), plan a microcatheter from the start so that wires can be exchanged without re-wiring from the ostium.",
    tone: "do",
    lessonId: "pm-wiring-wire-choice",
    sources: [
      { book: "brilakis-pci", loc: "8.2" },
      { book: "brilakis-pci", loc: "1.8" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-support-wire-exchange-in",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["balloon-uncrossable", "stent-uncrossable"] },
    title: "Support wires are exchanged in, not used to cross",
    text: "A support wire, including the type with distal waves, is placed through a microcatheter or over-the-wire balloon after another wire has crossed. If that type is not available, small hand-made bends in the distal part of a workhorse can imitate it.",
    tone: "do",
    lessonId: "pm-wiring-wire-choice",
    sources: [{ book: "brilakis-pci", loc: "30.7" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-shape-small-first",
    lab: "pci",
    when: { phase: ["wire"] },
    title: "Shape small first, sized to the vessel",
    text: "Keep the distal bend shorter than the target vessel is wide; add a larger proximal bend for reach in big vessels or angulated ostia. Make small bends through the introducer (this can fracture the core of nitinol wires; some nitinol wires must be shaped only with the needle packed with them) and start small: adding a bend is easy, removing one is not.",
    tone: "do",
    lessonId: "pm-wiring-shape-load",
    sources: [
      { book: "brilakis-pci", loc: "8.3" },
      { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-load-through-valve",
    lab: "pci",
    when: { phase: ["wire"] },
    title: "Load through the valve without catching the tip",
    text: "Hide the tip fully in the introducer, push the introducer right through the haemostatic valve, then advance the wire without force. A tip that enters the side arm, or catches on a guide extension or a balloon already in the guide, is bent.",
    tone: "do",
    lessonId: "pm-wiring-shape-load",
    sources: [{ book: "brilakis-pci", loc: "8.4" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-stop-at-guide-tip",
    lab: "pci",
    when: { phase: ["wire"] },
    title: "Keep the wire in the guide until you mean to use it",
    text: "Know whether the guide is 90 or 100 cm and set the torque device about 90 cm from the tip as a stop; watch the tip during injections. If the wire does run into the artery, leave it, inject to locate it and redirect it only if needed.",
    tone: "caution",
    lessonId: "pm-wiring-shape-load",
    sources: [{ book: "brilakis-pci", loc: "8.5" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-keep-tip-free",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-not-crossing"] },
    title: "A restrained tip: pull back, never push",
    text: "If the tip stops turning freely or deflects, it may be under a plaque. Pull back, rotate slightly and readvance, or leave it and pass a parallel wire. Forcing it dissects and can trap the tip.",
    tone: "caution",
    lessonId: "pm-wiring-navigate",
    sources: [
      { book: "brilakis-pci", loc: "8.6" },
      { book: "brilakis-pci", loc: "8.7" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-left-views",
    lab: "pci",
    when: { phase: ["wire"], vessel: ["LM", "LAD", "LCx"] },
    title: "Left wiring views",
    text: "Use a caudal view to choose between LAD and circumflex at the left main. Then travel down the LAD in RAO cranial or AP cranial, and down the circumflex or marginals in RAO caudal or LAO caudal.",
    tone: "do",
    lessonId: "pm-wiring-navigate",
    sources: [{ book: "brilakis-pci", loc: "8.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-rca-views",
    lab: "pci",
    when: { phase: ["wire"], vessel: ["RCA"] },
    title: "RCA wiring views",
    text: "Take the wire to the distal RCA in LAO, then use LAO or AP cranial to enter the PDA or the posterolateral branch.",
    tone: "do",
    lessonId: "pm-wiring-navigate",
    sources: [{ book: "brilakis-pci", loc: "8.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-not-crossing-ladder",
    lab: "pci",
    when: { event: ["wire-not-crossing"] },
    title: "Wire will not cross: shape, wire, support",
    text: "Reshape the tip, make sure guide support is good, and consider a different wire (for example a polymer-jacketed one), or back the wire up with a microcatheter or an over-the-wire balloon. Brilakis's planning checklist asks whether this lesion was hard to wire before, so these options can be ready from the start.",
    tone: "bailout",
    lessonId: "pm-wiring-navigate",
    sources: [
      { book: "brilakis-pci", loc: "8.7" },
      { book: "brilakis-pci", loc: "1.8" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-confirm-true-lumen",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["wire-subintimal", "acute-closure"] },
    title: "Prove the true lumen before any balloon",
    text: "An abnormal wire course or motion with ventricular ectopics suggests the wire is out of the lumen. Keep the wire, confirm the position in orthogonal views or with IVUS, do not inject through a microcatheter at the wire tip, and pass a second wire into the distal true lumen before ballooning or stenting.",
    tone: "bailout",
    lessonId: "pm-wiring-navigate",
    sources: [
      { book: "brilakis-pci", loc: "8.7" },
      { book: "brilakis-pci", loc: "8.6" },
      { book: "oxford-cath", loc: "ch 8: Chronic total occlusion PCI" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-organise-two-wires",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent"], event: ["side-branch-compromise"] },
    title: "Two wires: keep them apart and labelled",
    text: "Separate the wires with a towel (the wire in the branch highest on the screen on top), or use different colours, a slight bend in the back end of the side-branch wire, or a torque device on one. Watch both distal tips.",
    tone: "do",
    lessonId: "pm-wiring-navigate",
    sources: [
      { book: "brilakis-pci", loc: "8.6" },
      { book: "brilakis-pci", loc: "16.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-wire-prolapse-four-solutions",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-side-branch"] },
    title: "Prolapsing past an angulated branch: four ways through",
    text: "If the wire is off course because it keeps prolapsing past an angulated target branch or cannot get through tortuosity (rather than simply entering a side branch, where the guide and tip shape come first): change the wire and the tip shape (a larger bend for an angulated branch); add a straight, angulated or dual-lumen microcatheter; use a reversed (hairpin) polymer-jacketed wire; or inflate a deflection balloon just beyond the branch origin, accepting ischaemia while it is up.",
    tone: "bailout",
    lessonId: "pm-wiring-tortuosity",
    sources: [{ book: "brilakis-pci", loc: "8.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-reversed-hairpin",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-side-branch"] },
    title: "Reversed wire: load the bend, overshoot, pull back",
    text: "For an acutely angulated branch the wire keeps prolapsing past: bend a polymer-jacketed wire back 180 degrees about 3 cm from its tip, insert the bend (not the tip) through the valve, advance it past the branch, then pull back to hook the ostium. It can dissect, and once the hairpin is in the vessel being wired, the bend can make further advancement hard.",
    tone: "bailout",
    lessonId: "pm-wiring-tortuosity",
    sources: [{ book: "brilakis-pci", loc: "8.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-wire-pseudolesion-pullback",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["microcatheter-needed"] },
    title: "New narrowings in a tortuous vessel: think pseudolesion",
    text: "A stiff wire or microcatheter that straightens a tortuous artery can fold it into pseudolesions. Give intracoronary nitrate to exclude spasm; a pseudolesion will not respond. Then withdraw the wire partly, so that its soft distal segment lies just beyond the lesion (never pull it back behind the lesion), and look again. Exclude dissection, for example with IVUS, before removing the equipment.",
    tone: "caution",
    lessonId: "pm-wiring-tortuosity",
    sources: [
      { book: "brilakis-pci", loc: "8.7" },
      { book: "brilakis-pci", loc: "18.8" },
      { book: "brilakis-pci", loc: "25.2" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-microcath-when-needed",
    lab: "pci",
    when: { event: ["microcatheter-needed"] },
    title: "Use a microcatheter early in complex wiring",
    text: "Highly tortuous, near-occlusive and CTO lesions, damaged tips and wire exchanges all go better through a microcatheter. Load the wire inside it and insert them together; an over-the-wire balloon is a cheaper substitute but kinks more, and in small balloons the only marker sits mid-balloon.",
    tone: "do",
    lessonId: "pm-wiring-microcatheters",
    sources: [
      { book: "brilakis-pci", loc: "8.1" },
      { book: "brilakis-pci", loc: "30.6" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-microcath-no-overspin",
    lab: "pci",
    when: { phase: ["wire"], event: ["microcatheter-needed", "equipment-entrapment"] },
    title: "Do not over-spin a microcatheter",
    text: "Over-rotation can deform or entrap a microcatheter, fracture it near the tip, or bind the wire inside it. Braided microcatheters without a coil are pushed rather than spun, and plaque modification types turn in a set direction. Flush after contrast, and replace a microcatheter that has become hard to use.",
    tone: "caution",
    lessonId: "pm-wiring-microcatheters",
    sources: [{ book: "brilakis-pci", loc: "30.6" }],
    refs: BOOKS,
  },
  {
    id: "pci-microcath-hydraulic-limits",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-needed"] },
    title: "Hydraulic exchange: only over a soft wire",
    text: "Fill an inflation device with saline, connect wet to wet with the wire's back end at the hub, reach 14–20 atm and hold that pressure throughout the withdrawal. Never use it with polymer-jacketed or stiff-tip wires; avoid it in CTO PCI in general and for removing over-the-wire or re-entry balloons.",
    tone: "caution",
    lessonId: "pm-wiring-microcatheters",
    sources: [{ book: "brilakis-pci", loc: "8.9" }],
    refs: BOOKS,
  },
  {
    id: "pci-microcath-cannot-trap",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-needed"] },
    title: "Cannot trap? Extension wire, then circumcision",
    text: "A 6 Fr guide cannot trap over-the-wire balloons or large re-entry devices. Use the wire maker's extension, tightened firmly without kinking. If the wire is stuck in the microcatheter or no extension is available, cut the microcatheter off in segments close to the Y-connector on a hard surface, taking care not to nick the wire.",
    tone: "bailout",
    lessonId: "pm-wiring-microcatheters",
    sources: [{ book: "brilakis-pci", loc: "8.9" }],
    refs: BOOKS,
  },
];

export const refs: Reference[] = [];
