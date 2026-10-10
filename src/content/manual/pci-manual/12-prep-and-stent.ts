// Module pm-prep-and-stent: lesion preparation and stenting (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.9, 1.10, 9.1-9.10, 10.1-10.2, 23.1, with related passages in 16.2,
// 18.1, 19.9-19.10, 20.5, 20.10, 22.2-22.3, 27.1, 28.3 and 30.9; Oxford Handbook of Cardiac Catheterization and
// Coronary Intervention, chapter 1 (fluoroscopy and acquisition) and chapter 8 (guiding catheters, angioplasty guide
// wires, angioplasty balloons, intracoronary stents, restenosis, drug-eluting stents, bioresorbable scaffolds, stent
// thrombosis, the PCI procedure, optical coherence tomography, specific techniques in complex PCI, primary PCI).
// Every claim is listed with its page in docs/curriculum/evidence/pm-prep-and-stent.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-prep-and-stent",
  title: "Lesion preparation and stenting",
  stage: 3,
  summary:
    "The working heart of every PCI, taught as Brilakis breaks it down: why almost every lesion is prepared before a stent, how to choose, prepare, inflate and remove a balloon, how to bring balloons and stents to the lesion, how to escalate support when they will not go, when a stent should not be placed and when a balloon alone may be enough, how to size, position and deploy the stent, and how to post-dilate and judge the final result.",
  objectives: [
    "Work through the lesion preparation sequence (wire position, thrombus, calcium, friable grafts, balloon angioplasty, flow, balloon expansion) and say which lesions should and should not be stented directly.",
    "Choose a balloon by diameter, length, compliance and delivery system, prepare it, and inflate, deflate and remove it with the pressures, speeds and durations the manuals give, recognising rupture, watermelon seeding and a lesion that will not dilate.",
    "Deliver balloons and stents to the lesion with the marker and hand techniques, and manage resistance, lost wire or guide position, a lost distal view and a stent that will not cross a previous stent.",
    "Escalate support in a logical order (guide, wire, proximal vessel and lesion, device, other measures), including deep intubation, guide extensions, buddy wires and the side-branch, distal and buddy-wire stent anchors, with their limits.",
    "Decide when a stent should not be placed, when balloon angioplasty or a drug-coated balloon may be the end point, and what newer trials add to the manuals on drug-coated balloons.",
    "Size a stent to the distal reference, cover the whole injured segment, position it against landmarks, deploy it at the right pressure for long enough, then post-dilate and judge the result with enhanced stent visualisation, imaging and the final angiogram.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-prep-why",
      title: "Preparing the lesion: why, when and in what order",
      minutes: 13,
      topics: ["pci-lesion-prep"],
      sources: [
        { book: "brilakis-pci", loc: "9.1" },
        { book: "brilakis-pci", loc: "9.2" },
        { book: "brilakis-pci", loc: "9.3" },
        { book: "brilakis-pci", loc: "9.6" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "9.8" },
        { book: "brilakis-pci", loc: "9.9" },
        { book: "brilakis-pci", loc: "1.9" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "27.1" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty balloons" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI" },
      ],
      refs: [...BOOKS, "total-2015", "frobert-taste-2013", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Lesion preparation is everything you do between crossing the lesion with a wire and putting in a stent. Its purpose, in Brilakis's words reduced to one line, is to make the lesion ready to accept a stent and to let that stent open fully. A stent that cannot reach the lesion, or that reaches it and stays narrow, is exactly what lesion preparation is meant to prevent.",
        },
        {
          kind: "h",
          text: "Why nearly every lesion is prepared",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "**Delivery.** A dilated lesion lets the stent pass more easily and lowers the risk of losing the stent off its balloon.",
            "**Sizing.** The balloon tells you how big and how long the stent should be. This matters most when you are not using intravascular imaging and when contrast flows poorly beyond the lesion, making the distal vessel hard to judge.",
            "**Expansion.** A balloon that opens fully shows that the lesion will yield. One that does not warns you, before any metal is committed, that more modification (for example atherectomy for heavy calcium) is needed. Brilakis calls the alternative ‘stent regret’.",
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook frames it the same way: preparation should let the stent catheter reach the lesion easily and without complications, and should leave the vessel compliant enough for the stent balloon to expand fully. It stresses calcified and thrombus-containing lesions, and warns that trying to crack a resistant lesion once a stent is in place can be very difficult, so the lesion should be dilated as fully as possible beforehand.",
        },
        {
          kind: "steps",
          title: "Brilakis's lesion preparation sequence",
          items: [
            {
              title: "1. Is the lesion wired?",
              detail: "No preparation of any kind until a wire is across (wiring is taught in pm-wiring). Then confirm the distal wire position before the first balloon (next section).",
            },
            {
              title: "2. Is there a large thrombus?",
              detail: "If yes, selective (bail-out) thrombectomy is often done first. Routine aspiration in every STEMI is not recommended: the TASTE and TOTAL trials showed no benefit (TOTAL found more strokes), the Oxford handbook keeps aspiration for a large thrombus burden, and the 2023 ESC ACS guideline does not recommend it routinely. Thrombus is taught in cp-acs-thrombus.",
            },
            {
              title: "3. Is there severe calcification?",
              detail: "If yes, atherectomy or intracoronary lithotripsy is often done first (cp-calcium).",
            },
            {
              title: "4. Is it a degenerated vein graft, or a lesion with thrombus?",
              detail: "Primary stenting (a stent with no balloon or other preparation first) may be preferred in a few lesion types, such as friable vein-graft lesions, or thrombus when thrombectomy is not planned or has failed.",
            },
            {
              title: "5. Balloon angioplasty",
              detail: "For everything else, and after steps 2 and 3, the preparation is a balloon (the next two lessons).",
            },
            {
              title: "6. Is the flow good?",
              detail: "If antegrade flow is poor after the balloon, give vasodilators and consider thrombectomy. The exception is poor flow caused by a dissection: that needs a stent.",
            },
            {
              title: "7. Did the balloon expand?",
              detail: "Confirm good balloon expansion before stenting, above all in heavy calcium, to avoid an underexpanded stent. If it did not expand, the lesion is ‘balloon undilatable’ and follows its own algorithm (cp-uncrossable).",
            },
            {
              title: "8. Stent",
              detail: "Only now (lessons 6 to 8 of this module).",
            },
          ],
        },
        {
          kind: "check",
          stem: "A wire has just crossed a heavily calcified mid-RCA lesion in a stable patient. The fellow suggests going straight to a 3.0 × 28 mm stent ‘to save time’. What does Brilakis say?",
          options: [
            "Reasonable: direct stenting shortens the case and calcium does not affect stent delivery",
            "No: never stent heavy calcium directly, because the stent may underexpand",
            "Reasonable if a 7 Fr guide is used, because the extra support guarantees delivery",
            "Direct stenting is preferred whenever the lesion is longer than 20 mm",
          ],
          answer: 1,
          explanation:
            "Brilakis is categorical: primary stenting should never be done in heavily calcified lesions, because a lesion that has not been fully dilated leaves the stent underexpanded, which raises the risk of restenosis and stent thrombosis. Direct stenting is also listed among the causes of stent loss, and he advises avoiding it especially in tortuous and calcified vessels. Guide size improves support but cannot make an undilated lesion expand.",
        },
        { kind: "h", text: "Plan it before the case" },
        {
          kind: "list",
          items: [
            "Ask whether there was trouble expanding this lesion before. Brilakis puts this question in the planning checklist for lesion preparation.",
            "Look at earlier images: severe calcification should make you think of atherectomy, laser and intravascular lithotripsy, where available; a large thrombus of antithrombotic drugs and thrombectomy.",
            "Have what you might need in the room and the right guide in place, because changing the guide once the wire is across risks losing the wire (lesson 5).",
          ],
        },
        { kind: "h", text: "Two things to do before the first balloon" },
        {
          kind: "steps",
          items: [
            {
              title: "Check where the wire tip lies",
              detail: "Inject contrast and confirm that the wire runs through the lesion and several centimetres beyond it, but not into a small distal branch. If it is not where you want it, reposition it now. A wire in a small branch can perforate it, and a branch close to the lesion is the dangerous one: the balloon can slide into it while the lesion is dilated. The Oxford handbook adds that the wire should sit as far distally as possible, because the stiffer part then lies across the lesion and gives support, and the tip is less likely to be pulled back across the lesion; it also warns about hydrophilic wires parked very distally.",
            },
            {
              title: "Clear the guide",
              detail: "Let the Y-connector back-bleed, aspirate the guide, then fill it with contrast. The point is that no air or debris goes downstream with the next injection.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Why the guide is cleared: distal embolisation after a balloon comes out (Brilakis 9.7.2)",
          head: ["What embolises", "How it gets into the guide", "What you do"],
          rows: [
            [
              "Air",
              "Sucked in as a balloon is pulled back into the guide; more likely with large balloons",
              "Prevention: aspirate then flush. Treatment: 100% oxygen, possibly aspiration, and intracoronary epinephrine (adrenaline) if the patient arrests. It usually settles with supportive care alone (cm-flow-embolism).",
            ],
            [
              "Thrombus or plaque",
              "Carried into the guide during balloon withdrawal; more likely with bulky large balloons and with plaque modification balloons",
              "Prevention: aspirate then flush. Treatment: usually thrombectomy.",
            ],
          ],
        },
        { kind: "tip", id: "pci-prep-wire-check-before-balloon" },
        { kind: "tip", id: "pci-prep-clear-the-guide" },
        {
          kind: "check",
          stem: "Before predilating a mid-LAD lesion, your injection shows the wire tip curled in a small diagonal branch just beyond the lesion. What should you do?",
          options: [
            "Inflate now; the wire position does not matter once the lesion is crossed",
            "Inflate a small balloon in the diagonal first to make room for the wire",
            "Pull the wire back and steer it well into the distal LAD past the lesion",
            "Leave it and inflate at a lower pressure to protect the branch",
          ],
          answer: 2,
          explanation:
            "Brilakis's first balloon step is to confirm an optimal distal wire position, several centimetres beyond the lesion and not in a small branch. A branch near the lesion is exactly where a balloon can track during inflation and perforate. Lowering the pressure does not change where the balloon and wire go.",
        },
        { kind: "h", text: "How the two manuals differ" },
        {
          kind: "p",
          text: "Both books treat balloon predilatation as the usual preparation. Brilakis goes further: preparation should be done in nearly all lesions, and primary stenting is kept for a few lesion types (friable vein grafts, thrombus). The Oxford handbook says that most lesions need nothing more than predilatation, and notes that some operators skip even that and stent directly. Teach yourself Brilakis's default; when you do stent directly, it should be a deliberate choice for one of his exceptions, never in calcium, and with the knowledge that direct stenting is a recognised cause of stent loss.",
        },
        {
          kind: "list",
          items: [
            "Adjuncts the Oxford handbook lists for lesions that need more than a balloon: rotational atherectomy, the cutting balloon, distal protection, thrombectomy, and the extra information from IVUS or the pressure wire.",
            "Several lesions, or one long lesion: dilate the distal lesion or segment first. If the proximal part is dilated first, getting the balloon further down may then fail. (The exceptions to distal-first for stenting order are in pm-target.)",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting to dilate before the wire is confirmed in a good distal position.",
            "Injecting through a guide that has not been aspirated after a balloon came out.",
            "Stenting a lesion whose balloon never fully expanded, then trying to fix the stent afterwards.",
            "Calling a lesion ‘prepared’ when the flow after the balloon is poor; flow comes first.",
            "Dilating the proximal lesion of a long or tandem segment first and then failing to get past it.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the predilatation balloon as a test as well as a treatment. Size it to the distal reference and watch it: full expansion suggests the lesion is ready, and a waist warns you before any metal goes in. In heavy calcium a good-looking balloon can still mislead (Brilakis notes that balloon-first preparation can give a false impression of adequate preparation), so confirm with intravascular imaging where you can.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, before any balloon, say aloud each step of the preparation sequence (wire position, thrombus, calcium, graft or thrombus exception, balloon, flow, expansion) and what you would do at each, then confirm the wire tip is several centimetres beyond the lesion and out of small branches.",
        },
        { kind: "video", id: "iCxB2VZ89mM", note: "Manual of PCI chapter 9.1: lesion preparation, when and how." },
        { kind: "video", id: "Ta1MbCgzgCg", note: "A CTO case on the importance of vessel preparation." },
        {
          kind: "keypoints",
          items: [
            "Goal: a lesion that lets the stent reach it and expand fully.",
            "Prepare nearly every lesion, usually with a balloon: it eases delivery, guides sizing and tests expansion.",
            "Sequence: wired? large thrombus? severe calcium? graft or thrombus exception? balloon; good flow? balloon expanded? stent.",
            "Primary stenting may be preferred in a few lesion types, such as friable vein-graft lesions or thrombus without (or after failed) thrombectomy; never in heavy calcium.",
            "Large thrombus: selective thrombectomy first; routine aspiration in every STEMI is not recommended (TASTE, TOTAL, ESC 2023).",
            "Before the first balloon: wire several centimetres distal and out of small branches; guide back-bled, aspirated and filled with contrast.",
            "Poor flow after the balloon: vasodilators and consider thrombectomy, unless a dissection is the cause, which needs a stent.",
            "Dilate distal segments first in long or multiple lesions.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-balloon-choose",
      title: "Balloon angioplasty I: choosing, preparing and loading the balloon",
      minutes: 13,
      topics: ["pci-balloon-angioplasty"],
      sources: [
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "30.9" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty balloons" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis teaches balloon angioplasty as thirteen steps. The first two (wire position and a clear guide) were in the last lesson. This lesson covers steps 3 to 6: choosing the balloon, preparing it, loading it on the wire and taking it through the Y-connector. The construction and compliance of balloons are covered in pci-bs-balloons and eq-balloons-stents-cart; here the focus is on how each property changes what you choose.",
        },
        { kind: "h", text: "What you are holding" },
        {
          kind: "p",
          text: "The Oxford handbook describes the balloon catheter as a delivery system for the balloon, running over the angioplasty wire. It has a low-profile hypotube that connects to the inflation device, a short monorail segment, the balloon with radio-opaque markers so you can see it, and a tapered nose cone that limits trauma.",
        },
        {
          kind: "steps",
          title: "Step 3: choose the balloon",
          items: [
            {
              title: "Diameter, for dilatation",
              detail: "For most lesions Brilakis matches the balloon 1:1 to the distal reference diameter. The point is to find out whether it opens fully, in which case nothing more is needed before the stent; this matters most in calcified lesions and in in-stent restenosis. The Oxford handbook sets the upper limit: no larger than the vessel at the lesion, because oversizing risks dissection or rupture, while undersizing leaves the lesion incompletely prepared. Many operators predilate slightly undersized (about 0.8–1.0 to the reference, as taught in pci-bs-balloons). Brilakis uses a full 1:1 non-compliant balloon on purpose, because a balloon matched to the reference is the one whose full expansion tells you the lesion is ready.",
            },
            {
              title: "Diameter, for crossing",
              detail: "For a very tight lesion that a normal balloon cannot enter, start with a small balloon of 1.5 mm or less to open the entry point, then bring larger balloons to finish the job.",
            },
            {
              title: "Length",
              detail: "Shorter than the estimated lesion. A longer balloon injures normal vessel either side, and every injured millimetre has to be covered by stent later. The Oxford handbook adds the other side of the trade-off: a balloon that is too short tends to ‘melon-seed’, squirting backwards and forwards across the lesion as it inflates.",
            },
            {
              title: "Compliance",
              detail: "Brilakis prefers non-compliant balloons, because the same balloon can post-dilate the stent later, accepting that they deliver less well than compliant balloons. The Oxford handbook describes the compliant balloon as the standard predilatation balloon (its diameter keeps growing with pressure and becomes unpredictable at high pressure), the non-compliant balloon as the post-dilatation balloon, and the semi-compliant balloon as having more predictable growth at high pressure than a compliant one.",
            },
            {
              title: "Delivery system",
              detail: "Use a monorail (rapid exchange) balloon in the great majority of cases: it is simpler, needs no long wire, and its stiffer shaft pushes better. Over-the-wire balloons, where the wire runs through the whole catheter and any exchange needs an exchange-length wire, are now mainly a CTO tool according to the Oxford handbook.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Two pressures to know for every balloon (Oxford handbook)",
          head: ["Pressure", "Meaning", "Practical use"],
          rows: [
            ["Nominal", "The pressure at which the balloon reaches its labelled diameter", "A 2.5 mm balloon at nominal pressure is 2.5 mm across: a ruler for the vessel"],
            ["Rated (‘burst’)", "The upper design limit: the balloon is not meant to be taken past it", "Above it the balloon may rupture and the vessel may dissect"],
          ],
        },
        {
          kind: "check",
          stem: "A 22 mm long, tight, calcified LAD lesion sits in a vessel whose distal reference is 2.75 mm. Which predilatation balloon fits Brilakis's rules?",
          options: [
            "A 3.5 × 30 mm compliant balloon, so that the whole segment opens in one go",
            "A 2.75 × 15 mm non-compliant balloon (smaller first if needed)",
            "A 2.0 × 30 mm compliant balloon, inflated to its rated pressure",
            "A 3.0 × 25 mm cutting balloon as the very first device across",
          ],
          answer: 1,
          explanation:
            "Brilakis sizes the balloon 1:1 to the distal reference so that full expansion tells you the lesion is ready, keeps it shorter than the lesion to avoid injuring normal vessel, prefers non-compliant balloons, and uses a 1.5 mm or smaller balloon first when the lesion is too tight to enter. A 3.5 mm balloon is oversized and longer than the lesion; a 2.0 mm balloon cannot test expansion; plaque modification balloons are harder to deliver and are not a first device for a tight lesion.",
        },
        {
          kind: "table",
          caption: "Plaque modification balloons in brief (devices in detail: eq-balloons-stents-cart; resistant lesions: cp-uncrossable)",
          head: ["Type", "What it adds", "Price you pay"],
          rows: [
            ["Scoring balloons with nitinol wires", "Help a resistant lesion yield", "Larger profile and less flexible, so harder to deliver"],
            ["Cutting balloon", "Blades (atherotomes) on the surface incise fibrous or calcified plaque so later inflations succeed", "Hard to deliver; must be inflated and deflated slowly; the Oxford handbook warns the blades are sharper than a scalpel, can cut gloves and skin, and can damage the vessel if withdrawn before full deflation"],
            ["Very-high-pressure balloon", "Can dilate resistant lesions", "Not available in the United States when the manual was written"],
          ],
        },
        {
          kind: "steps",
          title: "Step 4: prepare the balloon",
          items: [
            {
              title: "1. Take it out carefully",
              detail: "Pull the balloon slowly out of its hoop. The stylet inside can spring out and injure your hand.",
            },
            {
              title: "2. Fill a Luer-lock syringe",
              detail: "Usually half contrast and half saline. A weaker mixture inflates and deflates faster but the balloon is harder to see. Label the syringe.",
            },
            {
              title: "3. Connect and suck out the air",
              detail: "Attach the syringe to the balloon's proximal hub and apply negative pressure with the plunger pointing up, so the air rises into the syringe.",
            },
            {
              title: "4. Connect the indeflator",
              detail: "Attach the inflation device and apply negative pressure.",
            },
          ],
        },
        {
          kind: "p",
          text: "**If you cannot see the balloon when it inflates,** it was either filled with saline instead of diluted contrast or still contains a lot of air. Prevent both by labelling the contrast syringe and removing the air properly. If it happens, take the balloon out and prepare it again correctly.",
        },
        { kind: "tip", id: "pci-balloon-size-and-length" },
        { kind: "tip", id: "pci-balloon-prep-visible" },
        {
          kind: "steps",
          title: "Steps 5 and 6: load it and take it into the guide",
          items: [
            {
              title: "Load the balloon on the wire",
              detail: "Thread the balloon tip over the back end of the wire. It is easier if the left thumb and index finger hold the wire with its end resting at an angle on the middle finger, while the right hand feeds the balloon on. Another trick is to rest wire and balloon together in the channel of a syringe plunger.",
            },
            {
              title: "Fix the wire",
              detail: "Someone must hold the back of the wire still while the balloon goes in: an assistant, a second operator, or your other hand if you are alone.",
            },
            {
              title: "Through the Y-connector",
              detail: "With a standard valve, open it, pass the balloon, then close it. With an automated haemostatic valve there is nothing to open: push the balloon straight through.",
            },
            {
              title: "If the balloon is damaged",
              detail: "Forcing it through a valve that is screwed too tight deforms it; cutting balloons are the most vulnerable. Open the valve first or use an automated valve, and replace any damaged balloon.",
            },
          ],
        },
        { kind: "tip", id: "pci-balloon-open-the-valve" },
        {
          kind: "check",
          stem: "During your first inflation the indeflator reads 12 atm but nothing is visible at the lesion on fluoroscopy. What is the likely cause and remedy?",
          options: [
            "The balloon has ruptured; inflate a new one at exactly the same site straight away",
            "The balloon is in the guide; push it further while inflating",
            "The image is underexposed; switch to cine and inflate again",
            "Saline without contrast or residual air; remove it and prepare it again properly",
          ],
          answer: 3,
          explanation:
            "Brilakis lists two causes of an invisible inflated balloon: filling with saline rather than diluted contrast, and poor preparation that left much of the air inside. The fix is to re-prepare it with a contrast solution. A rupture shows as a sudden fall in indeflator pressure, not a balloon you cannot see at stable pressure, and switching to cine adds dose without addressing the cause.",
        },
        {
          kind: "pitfalls",
          items: [
            "An oversized or over-long predilatation balloon that dissects normal vessel and lengthens the stent you will need.",
            "Choosing a balloon too small to tell you whether the lesion will open.",
            "Reaching for a plaque modification balloon first in a lesion it cannot even reach.",
            "An unlabelled syringe of saline mistaken for contrast.",
            "Pushing a balloon through a tight haemostatic valve.",
          ],
        },
        {
          kind: "pearl",
          text: "One non-compliant balloon of the right size can do three jobs: test the lesion before the stent, tell you its length from its markers, and post-dilate the stent afterwards. Keep it on the table.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For a 20 mm lesion with a 3.0 mm distal reference, choose the predilatation balloon diameter, length and compliance, and say what a waist that persists despite prolonged high-pressure inflation would mean for the next step.",
        },
        { kind: "video", id: "icI8Zn2FFvQ", note: "Manual of PCI chapter 9.2: how to perform balloon angioplasty." },
        { kind: "video", id: "5GjTX2J80Fw", note: "Sizing balloons, stents and drug-coated balloons by angiography and by IVUS or OCT (Elias Hanna)." },
        {
          kind: "keypoints",
          items: [
            "Diameter 1:1 to the distal reference for dilatation; 1.5 mm or less to open a lesion that will not admit a normal balloon.",
            "Length shorter than the lesion; too short invites melon-seeding.",
            "Non-compliant preferred by Brilakis (reusable for post-dilatation) at some cost in deliverability.",
            "Monorail in nearly every case; over-the-wire mainly for CTO.",
            "Nominal pressure gives the labelled size; do not exceed rated pressure.",
            "Prepare with labelled diluted contrast, plunger up, all air out; re-prepare an invisible balloon.",
            "Fix the wire, open the valve (or use an automated one), and never force a balloon through it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-balloon-inflate",
      title: "Balloon angioplasty II: inflate, deflate, withdraw and check",
      minutes: 15,
      topics: ["pci-balloon-angioplasty", "pci-lesion-prep"],
      sources: [
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "9.8" },
        { book: "brilakis-pci", loc: "9.9" },
        { book: "brilakis-pci", loc: "23.2" },
        { book: "brilakis-pci", loc: "23.1" },
        { book: "brilakis-pci", loc: "30.9" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty balloons" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "This lesson covers Brilakis's steps 9 to 13, from the moment the balloon sits in the lesion to the angiogram that tells you whether it worked. Getting the balloon there (steps 7 and 8) is the subject of lesson 4. The numbers below are the manual's typical values; the balloon's own compliance chart and instructions always take precedence.",
        },
        {
          kind: "table",
          caption: "Step 9: inflating the balloon (Brilakis 9.7.9; inflate under fluoroscopy, turning the indeflator arm to the target pressure)",
          head: ["Balloon", "Speed of inflation", "Usual pressure", "Duration"],
          rows: [
            ["Non-compliant, sized 1:1 or less to the vessel", "3–5 seconds", "12–20 atm; up to 20–26 atm if expansion is poor", "10–20 seconds; longer if expansion is poor"],
            ["Compliant, sized 1:1 or less to the vessel", "3–5 seconds", "12–14 atm", "10–20 seconds"],
            ["Cutting balloon", "Much slower: 5 seconds for each atm", "6–8 atm, never above 12 atm", "As the instructions for use say"],
            ["Very-high-pressure balloon", "As the instructions for use say", "30–35 atm", "As the instructions for use say"],
          ],
        },
        {
          kind: "p",
          text: "Why the cutting balloon is inflated so slowly: slow inflation stops the blades puncturing their own balloon and lowers the chance of a blade catching on calcium spicules.",
        },
        {
          kind: "p",
          text: "**Two numbers differ within Brilakis's own book.** Chapter 9 gives 30–35 atm for the very-high-pressure balloon, while chapter 30 describes the same device as able to reach more than 40 atm. For the cutting balloon, chapter 9 says never above 12 atm, while chapter 23 says to avoid pressures above 14 atm. In both cases follow the device's instructions for use.",
        },
        { kind: "tip", id: "pci-balloon-inflation-numbers" },
        { kind: "h", text: "What can go wrong during inflation" },
        {
          kind: "steps",
          title: "Balloon rupture",
          items: [
            { title: "Why it happens", detail: "Complex lesions, typically heavily calcified, and pressures above 20 atm." },
            { title: "How to avoid it", detail: "Modify heavy calcium first (atherectomy or intravascular lithotripsy), and avoid pressures above 20 atm. Only a non-compliant balloon is taken higher, and then only within its own compliance chart and rated burst pressure (step 9 table)." },
            { title: "How you know", detail: "The indeflator pressure suddenly drops. Fluoroscopy confirms it." },
            { title: "1. Suction at once", detail: "Pull negative on the indeflator immediately so contrast is not jetted out through the tear into the vessel wall, which can perforate it." },
            { title: "2. Remove the balloon and clear the guide", detail: "Take the ruptured balloon out and aspirate the guide to remove any air that came in with it." },
            { title: "3. Look for a perforation", detail: "Angiogram. If there is a perforation, take a new balloon straight to the site and inflate it, then follow the perforation pathway (cm-perforation)." },
          ],
        },
        { kind: "tip", id: "pci-balloon-rupture-suction" },
        {
          kind: "steps",
          title: "Watermelon seeding: the balloon slips forwards or backwards",
          items: [
            { title: "Why it happens", detail: "A severe or sharply angulated lesion, a guide that moves too much, a short balloon, or inflating too fast." },
            { title: "Prevent it", detail: "Hold the balloon gently back if it creeps forward, or push gently if it slides back; inflate slowly; use a longer balloon if you can." },
            { title: "If it happens", detail: "Deflate immediately, so the balloon does not injure vessel that is not your target. Then try again at lower pressure and slower speed, add one or more buddy wires, use a plaque modification balloon, or a longer balloon." },
          ],
        },
        { kind: "tip", id: "pci-balloon-watermelon" },
        {
          kind: "steps",
          title: "The balloon will not open: a balloon-undilatable lesion",
          items: [
            { title: "Why", detail: "Severe calcification and in-stent restenosis are the usual causes." },
            { title: "How you know", detail: "Brilakis defines it as a lesion that will not open even after several high-pressure balloon inflations: on fluoroscopy a waist persists on a properly sized non-compliant balloon." },
            { title: "What to do", detail: "Do not stent. Intravascular imaging helps define the lesion and choose the treatment. In heavy calcium, Brilakis's prevention is to consider atherectomy before the balloon." },
            { title: "First step of the undilatable algorithm: more from the balloon", detail: "Non-compliant balloons at high pressure, often up to 26–28 atm, provided you know each balloon's rated burst pressure and how much its diameter grows; prolonged inflations of 30–60 seconds or more (or, once at high pressure, quickly lowering and raising the pressure several times); a slightly undersized balloon (usually by 0.5 mm) or a shorter one to concentrate the force; two undersized balloons inflated side by side; or one or more buddy wires through the lesion before a high-pressure inflation. Every ballooned segment must later be stented, so keep the balloon off normal vessel." },
            { title: "Then modify", detail: "If the waist still persists, plaque modification balloons and atherectomy follow; the whole algorithm, for de novo and in-stent lesions, is taught in cp-uncrossable." },
          ],
        },
        { kind: "tip", id: "pci-balloon-waist-stop" },
        {
          kind: "check",
          stem: "At 22 atm in a calcified circumflex lesion, the indeflator needle suddenly falls to 4 atm. What is your first action?",
          options: [
            "Reinflate to 22 atm to finish dilating the lesion before it recoils",
            "Inject contrast through the guide at once to see whether the vessel is intact",
            "Apply suction on the indeflator immediately, then remove the balloon",
            "Advance the balloon a few millimetres so the tear lies beyond the lesion",
          ],
          answer: 2,
          explanation:
            "A sudden fall in pressure means rupture until proved otherwise. Brilakis's first move is immediate suction, so contrast is not forced out through the tear into the vessel wall. Then remove the balloon, aspirate the guide for air, and only then inject to look for a perforation. Injecting first, before the guide has been aspirated, risks pushing air down the vessel; reinflating a ruptured balloon makes the jet worse.",
        },
        {
          kind: "steps",
          title: "Step 10: deflate",
          items: [
            { title: "How", detail: "Turn the indeflator arm to bring the pressure down, then pull the plunger back and lock it so the vacuum draws the contrast out of the balloon." },
            { title: "Be patient", detail: "Deflation takes several seconds, longer for long and large balloons because they hold more contrast." },
            { title: "If it will not deflate", detail: "Three mechanisms: the lesion or a stent recoils onto the balloon, the balloon is strangled inside the guide, or the hypotube is damaged. Avoid kinking the shaft and swap a kinked balloon for a new one promptly. An entrapped balloon is managed as in cm-equipment-loss." },
          ],
        },
        {
          kind: "steps",
          title: "Step 11: withdraw the balloon into the guide",
          items: [
            { title: "1. Confirm it is empty", detail: "Check on fluoroscopy that the balloon is fully deflated." },
            { title: "2. Pull back, watching both ends", detail: "Withdraw it while you watch the guide and the wire." },
            { title: "3. If the guide dives in", detail: "Stop pulling and reposition the guide and the wire. You may need to hold the guide back with gentle traction so it is not dragged into the artery." },
          ],
        },
        {
          kind: "p",
          text: "**Guide-induced dissection** is the complication of this step: a forceful pull, sometimes before the balloon is fully deflated, drags the guide tip into the coronary. Prevent it by never pulling forcefully, confirming full deflation first, partly disengaging the guide from the ostium before the balloon comes out, and using the independent-hand technique (the left hand eases the guide back while the right withdraws the balloon). If it happens, keep the wire where it is and stent the dissection.",
        },
        { kind: "tip", id: "pci-balloon-withdraw-deflated" },
        {
          kind: "steps",
          title: "Step 12: take the balloon off the wire",
          items: [
            { title: "Hand over hand", detail: "Left hand pins the wire just outside the Y-connector; right hand draws the balloon back until it reaches those fingers. Then the right hand takes over the wire and the left hand draws the balloon off the end." },
            { title: "Why wires get pulled out", detail: "The wire was not fixed well; a balloon inflated above 20 atm became sticky; the wire itself is sticky or kinked; or two wires have wrapped." },
            { title: "Prevent it", detail: "Wipe the wire outside the guide with a wet gauze; move the balloon in short pulls; keep wires separated and wiped; if movement is stiff, screen the wire tip to check it is not moving; trapping the wire stops the tip moving. A kinked wire should be removed only after a second, intact wire is in place." },
            { title: "If the wire is lost", detail: "Rewire the lesion." },
          ],
        },
        {
          kind: "steps",
          title: "Step 13: check the result",
          items: [
            { title: "Clear the guide again", detail: "Aspirate and flush it." },
            { title: "Check the guide position", detail: "It may have backed out or gone deeper while the balloon came out." },
            { title: "Inject", detail: "Look at the dilated lesion and for any complication." },
            { title: "Or image", detail: "Intravascular imaging can assess the result and save contrast." },
            { title: "Then the two gates before stenting", detail: "Is the flow good (if not, vasodilators and possibly thrombectomy, unless a dissection is the cause, which is stented)? Did the balloon expand fully, especially in calcium?" },
          ],
        },
        { kind: "tip", id: "pci-mon-check-guide-after-removal" },
        { kind: "tip", id: "pci-mon-wipe-wire" },
        {
          kind: "check",
          stem: "During a 14 atm inflation of a 12 mm non-compliant balloon in an angulated lesion, the balloon slides forward out of the lesion. What should you do?",
          options: [
            "Deflate, then retry slower and lower, with a buddy wire or longer balloon",
            "Keep inflating to rated pressure so the balloon locks back into the lesion",
            "Push the guide in deeply so the balloon cannot move during the next inflation",
            "Change to a shorter balloon, which is less likely to be squeezed out",
          ],
          answer: 0,
          explanation:
            "This is watermelon seeding. Brilakis says deflate immediately so that normal vessel is not injured, then retry at lower pressure and slower speed, with one or more buddy wires, a plaque modification balloon or a longer balloon. A short balloon is one of the causes, not the remedy, and inflating to rated pressure while the balloon sits outside the lesion injures the healthy segment.",
        },
        {
          kind: "pitfalls",
          items: [
            "Inflating fast to save time: rapid inflation is one of the causes of watermelon seeding.",
            "Going beyond the balloon's rated pressure, or repeating ever-higher inflations, instead of modifying the calcium.",
            "Injecting before the guide is aspirated after a rupture or a balloon withdrawal.",
            "Pulling a balloon that is not fully deflated, and dragging the guide into the ostium.",
            "Straightening a kinked balloon shaft and using it again.",
            "Stenting when the balloon has not opened or the flow is poor.",
          ],
        },
        {
          kind: "pearl",
          text: "Watch the indeflator as well as the screen. A needle that falls suddenly is a rupture. In deliberate small-balloon rupture (grenadoplasty, cp-uncrossable), Brilakis notes that watching the indeflator rather than the screen lets you deflate faster the moment the balloon bursts; the same habit helps you catch an unintended rupture. A needle that keeps creeping down while a stent balloon is held means the stent is still expanding (lesson 7). Both are information you will miss if you only look at the image.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, predilate with a non-compliant balloon sized 1:1 to the distal reference: inflate over 3–5 seconds to 12–20 atm, hold 10–20 seconds, deflate fully under fluoroscopy, withdraw while watching the guide, then aspirate, check the guide position and inject before choosing the stent.",
        },
        { kind: "video", id: "icI8Zn2FFvQ", note: "Manual of PCI chapter 9.2: how to perform balloon angioplasty." },
        {
          kind: "keypoints",
          items: [
            "Inflate over 3–5 seconds and hold 10–20 seconds; non-compliant 12–20 atm (up to 20–26 if needed), compliant 12–14 atm.",
            "Cutting balloon: 5 seconds per atm, 6–8 atm, never above 12 atm.",
            "Sudden pressure drop: suction first, remove, aspirate the guide, then angiogram for perforation.",
            "Watermelon seeding: deflate, then slower, lower pressure, buddy wire, longer or plaque modification balloon.",
            "A waist that persists despite prolonged high-pressure non-compliant inflations means do not stent: image and follow the undilatable-lesion algorithm; never exceed a balloon's rated pressure.",
            "Deflate fully (lock the vacuum), confirm on fluoroscopy, withdraw while watching the guide; partly disengage the guide if it dives.",
            "After every balloon: aspirate, check the guide, inject or image; then check flow and expansion before the stent.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-delivery",
      title: "Getting balloons and stents to the lesion",
      minutes: 14,
      topics: ["pci-device-delivery"],
      sources: [
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "27.1" },
        { book: "brilakis-pci", loc: "22.2" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 1: Fluoroscopy and acquisition" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Balloons and stents travel the same road: through the Y-connector, down the guide to its tip, and out along the wire to the lesion. Brilakis describes the journey once for balloons (steps 7 and 8) and applies it to stents. Stents are harder to deliver than balloons, and they can be lost, so the cautions weigh more heavily for them. When ordinary technique fails, the next lesson takes over.",
        },
        {
          kind: "steps",
          title: "Step 7: down the guide to its tip",
          items: [
            {
              title: "Hands",
              detail: "Left hand holds the Y-connector, with its thumb and index finger pinning the wire.",
            },
            {
              title: "Without screening, to the shaft marker",
              detail: "Push the device forward without fluoroscopy until the shaft marker reaches the Y-connector: the first (distal) marker with a 90 cm guide, the second (proximal) marker with a 100 cm guide. At that point the balloon is close to the guide tip.",
            },
            {
              title: "Then under fluoroscopy",
              detail: "Bring it the rest of the way to the guide tip while screening. The Oxford handbook notes that pulsed fluoroscopy, typically 7.5 frames per second with lower image quality and lower dose, is ideal for wiring and for balloon and stent delivery.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Problems on the way down the guide (Brilakis 9.7.7)",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            [
              "Resistance",
              "Wire wrapped round a guide extension's push rod; a kinked guide; too much kit in the guide; wires wrapped round each other",
              "Keep a guide extension's push rod in a towel; take out other balloons, stents and spare wires first; check that the planned kit fits the guide size (Brilakis points to a compatibility app for 6, 7 and 8 Fr)",
              "If it catches at the guide extension, remove and reinsert the extension; remove some equipment and try again; replace a kinked guide",
            ],
            [
              "Kinked shaft",
              "Forceful pushing; pushing against resistance",
              "Advance in short movements (‘small bites’)",
              "A small kink: carry on and do not try to straighten it (that weakens the shaft). A large kink: discard the device, because the shaft may fracture",
            ],
            [
              "Device shoots into the coronary unseen",
              "Poor image (obese patients); ignoring the shaft markers",
              "Watch the markers; never go past them without fluoroscopy; never push hard against resistance you cannot see",
              "Pull it back and take an angiogram to look for distal dissection or perforation",
            ],
          ],
        },
        {
          kind: "steps",
          title: "Step 8: out to the lesion",
          items: [
            {
              title: "Two-hand technique",
              detail: "The left hand grips the valve together with the wire, and the right hand advances the shaft of the balloon or stent.",
            },
            {
              title: "Independent-hand technique",
              detail: "The right hand does everything at the valve: middle and ring fingers hold the Y-connector, thumb and index finger hold the device shaft, and the wire lies between the ring and little fingers. The left hand is then free to hold and gently push the guide, which adds support. Brilakis calls this the preferred technique for stents.",
            },
            {
              title: "Confirm the position",
              detail: "Use landmarks (surgical clips, previous stents and similar) and contrast. Use as little contrast as you can in chronic kidney disease. Coregistration of the angiogram with imaging or physiology can help place a stent.",
            },
            {
              title: "Read the markers",
              detail: "Balloons of 1.5 mm or less have one central marker and cannot measure lesion length; balloons of 2.0 mm or more have two markers and can. Enhanced stent visualisation (lesson 8) helps place a balloon inside an existing stent.",
            },
          ],
        },
        { kind: "tip", id: "pci-delivery-marker-then-screen" },
        {
          kind: "check",
          stem: "You are using a 100 cm guide. How far do you push a new balloon before you start screening?",
          options: [
            "Until the first (distal) shaft marker reaches the Y-connector",
            "Until the second (proximal) shaft marker reaches the Y-connector",
            "All the way to the lesion, then screen to confirm the position",
            "Never without screening: every millimetre must be under fluoroscopy",
          ],
          answer: 1,
          explanation:
            "Brilakis: with a 90 cm guide the first marker at the valve means the device is near the tip; with a 100 cm guide it is the second marker. From there, screen the last part. Pushing blind to the lesion is how devices enter the coronary unseen, and screening the whole guide length adds dose for no benefit.",
        },
        { kind: "h", text: "When the device does not reach the lesion" },
        {
          kind: "list",
          items: [
            "**The shaft is too short.** This happens with very distal lesions, especially beyond a bypass-graft anastomosis. Use a short or shortened guide and the longest shaft available; stent shaft lengths vary by manufacturer (Brilakis lists 140 to 145 cm). A guide extension may also allow safer deep seating and better guide alignment.",
            "**Something in the way.** Disease, tortuosity or calcium proximally; a tight, calcified or tortuous lesion; a poorly prepared lesion; and for balloons a high-profile, non-compliant or previously used balloon. Prevent it by treating the proximal vessel and preparing the lesion well; the escalation of support is the next lesson.",
            "**A previous stent.** Resistance exactly at an old stent suggests the wire passed under a strut. Pull the wire back and recross the stent, ideally with a knuckled wire tip formed proximally. Forcing a device on can deform the old stent lengthways.",
          ],
        },
        { kind: "tip", id: "pci-delivery-old-stent-rewire" },
        { kind: "h", text: "What can go wrong on the way to the lesion" },
        {
          kind: "table",
          head: ["Problem", "Cause", "What to do"],
          rows: [
            [
              "Guide and wire position lost",
              "Forceful advancement through resistance",
              "Prevent: do not force; watch the guide and the distal wire continuously and adjust how hard you push; choose a supportive, coaxial guide. Treat: re-engage the guide and rewire, or readvance the wire",
            ],
            [
              "Distal vessel disappears",
              "The device occludes a tight lesion; dissection; distal embolisation; spasm (stents)",
              "Tight lesion: pull back, inject until contrast fills beyond the lesion, then readvance, which traps contrast distally. Dissection: stent. Embolisation: thrombectomy and vasodilators. Spasm: intracoronary nitroglycerin. Prevent with adequate preparation, nitroglycerin and no oversized balloons",
            ],
            [
              "Stent lost",
              "Forceful pushing; a stent deformed while being advanced or withdrawn",
              "Prepare meticulously; do not force; if the stent is not advancing in the artery, do not push its proximal part out of the guide; keep the guide coaxial when pulling the stent back. Retrieval: cm-equipment-loss",
            ],
          ],
        },
        { kind: "tip", id: "pci-interp-lost-distal-vessel" },
        {
          kind: "p",
          text: "Brilakis's wider list of causes of stent loss is worth knowing as a checklist: tortuosity and calcium, poor preparation, direct stenting, small guides such as 5 Fr, forceful withdrawal into the guide or into a guide extension, a stent catching on a guide extension's collar on the way in or out, advancing a stent through a previously deployed stent, and delivery through a collateral in retrograde CTO work. His preventive list starts with avoiding direct stenting, above all where the vessel is tortuous and calcified, and meticulous preparation, often with atherectomy in calcified lesions and intravascular imaging to confirm that the lesion has expanded before stent delivery is attempted. (He cites the ROTAXUS trial, in which stents were lost in 2% of lesions without rotational atherectomy against 0.5% with it.) It goes on: stent from distal to proximal; use a guide extension to deliver stents through tortuous, calcified vessels; avoid forceful advancement; keep the extension's push rod under a towel beside the Y-connector so wires do not wrap round it; and never force a stent through a guide extension against resistance: remove and reinsert the extension instead.",
        },
        { kind: "tip", id: "pci-delivery-small-bites" },
        { kind: "tip", id: "pci-delivery-withdraw-coaxial" },
        {
          kind: "check",
          stem: "A stent stops 1 cm short of a calcified lesion. You push, the guide backs out, and the stent's proximal end is now half outside the guide in the aorta. What do you do?",
          options: [
            "Push the guide back in hard over the stent shaft to regain support",
            "Pull the stent back briskly before the guide moves any further",
            "Deploy the stent where it is and plan to cover the lesion with another",
            "Stop pushing, make the guide coaxial, then withdraw gently",
          ],
          answer: 3,
          explanation:
            "Forceful pushing caused this, and a deformed stent withdrawn against a non-coaxial guide tip is how stents are stripped off their balloons. Brilakis: avoid force, do not push the proximal stent out of the guide when it is not advancing, and keep the guide coaxial when withdrawing it. Deploying a stent away from the lesion solves nothing and leaves metal where it is not needed.",
        },
        {
          kind: "pitfalls",
          items: [
            "Watching only the device tip while the guide backs out of the ostium and the wire slides back.",
            "Pushing harder when a device stops: it kinks shafts, loses position and deforms stents.",
            "Advancing blind past the shaft marker.",
            "Leaving extra balloons and wires in a small guide and then wondering why nothing moves.",
            "Forcing a device through an old stent instead of suspecting a sub-strut wire.",
          ],
        },
        {
          kind: "pearl",
          text: "The Oxford handbook points out that guiding catheters do not handle like their diagnostic cousins, because their walls are thinner, and that keeping the guide stable and coaxial is especially important in PCI. When delivery is hard, look first at the guide, not at the device.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, deliver the balloon and then the stent with the independent-hand technique: push without screening only to the correct shaft marker for the guide length, screen the rest, and stop and reassess at the first sign of the guide backing out.",
        },
        { kind: "video", id: "wFyDa1UnwH4", note: "Manual of PCI chapter 9.3: how to deliver balloons and stents." },
        { kind: "video", id: "RcTu0qOb3T0", note: "A Manual of PCI case titled ‘Don't push!’." },
        { kind: "video", id: "qpJnSzpR1kA", note: "A Manual of PCI case on difficulties reaching the coronary lesion." },
        { kind: "video", id: "o680G13d3QQ", note: "How to deliver balloons and stents during complex coronary interventions." },
        {
          kind: "keypoints",
          items: [
            "Push without screening only to the shaft marker (first for a 90 cm guide, second for 100 cm), then screen to the guide tip.",
            "Independent-hand technique frees the left hand to support the guide; Brilakis prefers it for stents.",
            "Confirm position with landmarks and minimal contrast; 1.5 mm or smaller balloons have a single central marker.",
            "Short shaft: shorter guide, longest shaft, consider a guide extension.",
            "Resistance at an old stent: suspect a sub-strut wire and rewire with a knuckle.",
            "Distal vessel lost: pull back, fill the distal vessel, readvance; stent a dissection; nitroglycerin for spasm.",
            "Never force a stent; keep the guide coaxial to pull it back.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-support",
      title: "When the device will not go: escalating support",
      minutes: 16,
      topics: ["pci-support-escalation", "pci-device-delivery"],
      sources: [
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "23.1" },
        { book: "brilakis-pci", loc: "19.8" },
        { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
        { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" },
        { book: "oxford-cath", loc: "ch 8: Specific techniques in complex PCI" },
      ],
      refs: [...BOOKS, "zhang-doca-tri-2012"],
      blocks: [
        {
          kind: "p",
          text: "The Oxford handbook defines support (or back-up) as the guide's ability to stay where it is while you push wires, balloons and stents forward. Every push creates friction that pushes the guide back out of the ostium, and in tortuous or calcified arteries the friction is large. Lose the guide and you lose the view, and possibly the wire and everything on it. Brilakis gives a five-part menu for getting a balloon or stent to the lesion. Read it as a set of levers to pull; the groups are not given in any fixed order, and they can be combined.",
        },
        {
          kind: "table",
          caption: "Brilakis's five groups of measures for delivering a balloon or stent (Figs 9.6 and 10.3, rebuilt as a table)",
          head: ["Group", "Measures"],
          rows: [
            ["1. Guide", "Larger French size; more supportive shape; access site; forward push with the independent-hand technique; deep intubation; guide extension; anchors (side branch, distal)"],
            ["2. Wire", "One or more buddy wires; a support wire; a wiggle-type wire; a ‘buddy balloon’ to deflect the device; deep wiring; rewiring if the wire went under a stent strut"],
            ["3. Proximal vessel and lesion", "Balloon angioplasty; plaque modification balloons; atherectomy (rotational, orbital, laser); intravascular lithotripsy"],
            ["4. The device", "Balloon: smaller, compliant (and new rather than used). Stent: shorter, thinner struts, or bent to follow the curve"],
            ["5. Other", "A deep breath from the patient; an atherectomy lubricant run in during advancement"],
          ],
        },
        { kind: "tip", id: "pci-support-five-levers" },
        { kind: "h", text: "1. The guide" },
        {
          kind: "list",
          items: [
            "**Size.** 7 or 8 Fr guides support better than 5 or 6 Fr. The Oxford handbook gives the same order (8 Fr more than 7 Fr more than 6 Fr) and urges planning ahead, because switching guides in the middle of a PCI is awkward. Brilakis adds that changing the guide after the wire has crossed can lose the wire, which may be unacceptable, for example in a CTO.",
            "**Shape.** An extra-backup (EBU-type) guide supports left coronary PCI much better than a JL4; an AL1 (or a dedicated right supportive shape) supports RCA PCI better than a JR4. The Oxford handbook's support ladder: for the LAD, JL3.5 or 4, then AL2, then XB or EBU 3.5; for the circumflex, JL4 or 5, then AL2, then Voda, XB or EBU 3.5 or 4; for the RCA, JR4, then AR1 or 2, then hockey stick or AL1 or 2. Extra-support shapes work by bracing against the opposite wall of the ascending aorta.",
            "**Access.** Femoral access supports better than radial, and long sheaths add support. From the radial side, the left radial supports RCA PCI better and the right radial supports left coronary PCI better. For truly complex lesions many operators choose femoral access with an 8 Fr supportive guide.",
            "**Forward push.** Pushing the guide gently adds support but can make it prolapse and disengage. The independent-hand technique lets a single operator support the guide with one hand (the left) and, with the other, both fix the wire and advance the device.",
            "**Deep intubation.** Seating the guide deeper in the vessel adds support but can dissect. Brilakis reserves it mostly for the RCA and vein grafts, and seldom uses it in the left system. The Oxford handbook notes that a JR4 may give more support when ‘deep-throated’, provided this does not injure the vessel.",
          ],
        },
        {
          kind: "steps",
          title: "Guide extensions",
          items: [
            { title: "What they do", detail: "Among the commonest tools for delivery. They add support, and if advanced close to or through the lesion they effectively ‘modify’ the proximal vessel: the balloon or stent travels inside the extension without touching the diseased wall." },
            { title: "Evidence quoted by Brilakis", detail: "In a randomised trial of transradial PCI in 187 patients in whom balloon or stent delivery had already failed (DOCA-TRI), a 5 Fr child catheter inside the 6 Fr guide succeeded far more often than a buddy wire or balloon anchoring (technical success 97.9% against 39.8%), with no difference in major adverse cardiac events at one year. Brilakis cites it under guide extensions; rapid-exchange guide extensions work on the same principle." },
            { title: "Danger 1: the wedge", detail: "Advanced into a wedged position, the extension damps the pressure trace. Do not inject through the guide then: the risk of hydraulic dissection of the proximal vessel is high." },
            { title: "Danger 2: dissection and wire loss", detail: "Advancing an extension can dissect the ostium or mid vessel, lose the wire or guide position, or injure the distal vessel. Its distal marker can also come off." },
            { title: "Danger 3: stent stripping at the collar", detail: "A stent can catch on the extension's proximal collar and be deformed or stripped off its balloon, notably around the subclavian bend in radial cases; Brilakis suggests an extension with a 40 cm rather than 25 cm cylinder for radial access." },
          ],
        },
        { kind: "tip", id: "pci-support-extension-wedge" },
        { kind: "tip", id: "pci-guide-extension-watch-act" },
        {
          kind: "check",
          stem: "A guide extension has been advanced deep into the RCA to deliver a stent, and the aortic pressure trace from the guide is now damped. What is the key safety rule?",
          options: [
            "Inject contrast firmly to clear the extension and confirm where it lies",
            "Do not inject through the wedged guide: hydraulic dissection risk",
            "Give intracoronary nitroglycerin through the guide to relieve the damping",
            "Push the extension further so its tip lies beyond the lesion before injecting",
          ],
          answer: 1,
          explanation:
            "Brilakis warns that a wedged guide extension damps the trace and that guide injections should then be avoided because of the high risk of hydraulic dissection and proximal vessel damage. Any injection, including nitroglycerin, is delivered into a closed space; pushing further does not solve the wedge.",
        },
        {
          kind: "steps",
          title: "Anchor techniques",
          items: [
            {
              title: "Side-branch anchor (the commonest)",
              detail: "Put a workhorse wire into a proximal side branch (usually the conus or an acute marginal for the RCA, a diagonal for the LAD) and inflate a balloon there, which locks the guide. In chapter 9 Brilakis advises sizing it 1:1 to the branch and inflating at relatively low pressure (4–8 atm); in chapter 23 he describes a 1.5–2.0 mm balloon, depending on branch size, usually at 6–8 atm. A long balloon grips better, more so if its hydrophilic coating is wiped off with a wet gauze first. Patients sometimes get chest pain while it is inflated.",
            },
            {
              title: "Distal anchor",
              detail: "A second wire goes past the lesion and a balloon on it is inflated distal to or at the lesion, pinning the first wire against the wall; the device then rides up the pinned wire. It needs at least a 6 Fr guide and works better with 7 or 8 Fr (larger guides, at least 7 Fr, are often needed). Remove the second wire and balloon before deploying the stent, so the wire is not trapped behind it.",
            },
            {
              title: "Buddy-wire stent anchor",
              detail: "If the proximal vessel needs a stent anyway, place a buddy wire, then deploy the proximal stent over the main wire, deliberately trapping the buddy wire, which then anchors the guide. Risks: the buddy wire may not come out, and equipment may not pass the proximal stent.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Limits of anchoring (Brilakis 9.7.8 and 23.1.3)",
          head: ["Problem", "Detail and prevention"],
          rows: [
            ["Injury where the anchor balloon sits", "Usually of no consequence in small branches; dissection or, rarely, perforation of the branch. Size 1:1, use low pressure, avoid oversizing, and use a workhorse wire"],
            ["Distal dissection", "With the distal anchor; may need extensive stenting"],
            ["Larger guide needed", "Distal anchoring often needs at least 7 Fr"],
            ["Changed anatomy", "A side-branch anchor can alter the proximal vessel and make antegrade wiring harder"],
            ["Ischaemia and arrhythmia", "Ischaemia is rare but can occur when a large branch such as a diagonal is used; prolonged conus occlusion can cause arrhythmia or haemodynamic instability. Deflate intermittently if needed"],
            ["Position loss", "The wire, the guide or the distal vessel can suffer while the anchor balloon is being advanced"],
          ],
        },
        { kind: "tip", id: "pci-support-side-branch-anchor" },
        { kind: "tip", id: "pci-support-distal-anchor-out" },
        {
          kind: "check",
          stem: "A stent will not pass a mid-RCA bend despite a buddy wire. You decide to anchor in a 1.5 mm conus branch. Which set-up follows Brilakis?",
          options: [
            "A 2.5 mm balloon at 14 atm in the conus, so the guide cannot move at all",
            "A short 1.5 mm balloon at 18 atm, keeping its hydrophilic coating intact",
            "A long balloon sized 1:1 at low pressure, coating wiped off",
            "No anchor in the conus: it is too small to anchor in safely",
          ],
          answer: 2,
          explanation:
            "Brilakis keeps anchor injury small with a balloon matched 1:1 to the branch and a relatively low pressure, and improves grip with a long balloon whose hydrophilic coating has been wiped off. Oversizing risks dissection and perforation of the branch. The conus is one of the branches he names for RCA anchoring; watch for chest pain and arrhythmia, and deflate intermittently if needed.",
        },
        { kind: "h", text: "2. The wire" },
        {
          kind: "list",
          items: [
            "**Buddy wire.** One of the simplest measures: one or more extra wires add guide support and straighten the vessel. The existing lesson pci-wires covers buddy wire handling and wire wrap.",
            "**Support wires.** Stiffer-bodied support wires, or a wiggle-type wire, can carry devices round bends. A support wire can be placed through a microcatheter.",
            "**Pull the wire back a little.** Partly withdrawing the wire while advancing the stent may help it through.",
            "**Buddy balloon.** Advance a balloon on a second wire across the point of resistance to deflect the stent as you try again.",
            "**Deep wiring.** A polymer-jacketed wire is advanced gently through distal branches, by feel and under fluoroscopy without contrast, into the ventricle or aorta via arterioluminal communications, adding wire support. If it will not enter the cavity, pull back and try another channel. The obvious risk is perforation, more likely if you keep manipulating a wire that meets resistance; ventricular ectopy or tachyarrhythmia usually settles on its own.",
            "**Wire position matters.** The Oxford handbook places the wire as distally as possible so that its stiffer segment supports the device at the lesion.",
          ],
        },
        { kind: "tip", id: "pci-support-buddy-wire" },
        { kind: "h", text: "3 to 5. The vessel, the device and the patient" },
        {
          kind: "list",
          items: [
            "**Prepare the proximal vessel and the lesion.** When proximal disease, tortuosity or calcium stops the device, dilate or modify the proximal vessel (balloon, atherectomy or intravascular lithotripsy). Good preparation also expands the stent better and lowers the risk of stent loss.",
            "**Balloon choice.** Small balloons of 1.0–1.5 mm cross resistant lesions best; their single marker is in the middle, so a longer balloon is better. Compliant balloons are more flexible and lower in profile than non-compliant ones. A used balloon delivers worse: a new one may cross.",
            "**Stent choice.** Shorter and thinner-strut stents deliver more easily. Two shorter stents may go where one long one will not. Bending the stent may help it round a curve but raises the risk of losing it.",
            "**Deep breath.** Asking the patient to breathe in deeply can help, perhaps by straightening the arteries or changing how the guide sits.",
            "**Lubricant.** Running an atherectomy lubricant emulsion during advancement may reduce friction.",
          ],
        },
        { kind: "tip", id: "pci-support-deep-breath" },
        { kind: "h", text: "If a balloon will not cross even after the wire has" },
        {
          kind: "p",
          text: "That is a balloon-uncrossable lesion, and Brilakis gives it its own five-line algorithm: first a small balloon and, if needed, deliberate rupture of a small balloon in the lesion (grenadoplasty: only with a 1.0–1.5 mm balloon, never one of 2.0 mm or more, meticulously prepared to remove all air, with suction applied the moment it ruptures); second, more support from the guide and the wire (everything above); third, a microcatheter and wire-cutting or puncture; fourth, laser and atherectomy; fifth, subintimal techniques; with combinations of these at any stage. The full algorithm is taught in cp-uncrossable.",
        },
        {
          kind: "pitfalls",
          items: [
            "Answering a device that will not go with more force on the device instead of a measure from one of the five groups.",
            "Exchanging the guide after a hard-won wire crossing and losing the wire.",
            "Injecting through a wedged guide extension.",
            "Forgetting to take the distal anchor wire and balloon out before deploying the stent.",
            "Oversized or high-pressure anchor balloons that dissect the branch.",
            "Continuing to push a deep-wiring wire against resistance.",
          ],
        },
        {
          kind: "pearl",
          text: "Support problems are often solved before the case. The guide you choose, its size, the access site and whether you have a guide extension open on the table decide most deliveries. When planning a known tortuous or calcified vessel, start with the guide you would otherwise have switched to.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when the stent stops at the proximal bend and the guide backs out, stop pushing, re-seat the guide and escalate using Brilakis's five groups, for example forward push with the independent-hand technique (guide), a buddy wire (wire), a deep breath (other), then a guide extension or a conus side-branch anchor sized 1:1 at low pressure (guide). Brilakis prescribes no fixed order; name the group and the measure each time.",
        },
        { kind: "video", id: "03sn2Vsphcc", note: "A Manual of PCI case on troubleshooting radial guide support." },
        { kind: "video", id: "SdRSb8Oh-0Q", note: "A Manual of PCI case on challenges with engagement and support." },
        { kind: "video", id: "7YXTePUN8A8", note: "A Manual of PCI case titled ‘Wiggle wire to the rescue’." },
        { kind: "video", id: "Z4-lZ0GmGbY", note: "A Manual of PCI case on a guide extension for visualisation and equipment delivery." },
        {
          kind: "keypoints",
          items: [
            "Five groups: guide, wire, proximal vessel and lesion, device, other.",
            "Guide: bigger, more supportive shape, femoral or long sheath, forward push, deep intubation (mainly RCA and grafts), guide extension, anchors.",
            "Guide extension: watch for damping and never inject when wedged; beware stent stripping at the collar.",
            "Side-branch anchor: 1:1, low pressure, long balloon with coating wiped; distal anchor needs two wires and a larger guide, and comes out before deployment.",
            "Wire: buddy wires, support or wiggle-type wires, partial withdrawal, buddy balloon, deep wiring (perforation risk).",
            "Device: small, compliant, new balloons; short, thin-strut stents; two short stents rather than one long.",
            "A balloon that will not cross after the wire has: the uncrossable algorithm in cp-uncrossable.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-when",
      title: "When to stent, and when a balloon is enough",
      minutes: 14,
      topics: ["pci-when-to-stent"],
      sources: [
        { book: "brilakis-pci", loc: "10.1" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "1.10" },
        { book: "brilakis-pci", loc: "9.8" },
        { book: "brilakis-pci", loc: "20.5" },
        { book: "brilakis-pci", loc: "20.10" },
        { book: "brilakis-pci", loc: "22.2" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "brilakis-pci", loc: "18.1" },
        { book: "brilakis-pci", loc: "30.9" },
        { book: "oxford-cath", loc: "ch 8: Intracoronary stents" },
        { book: "oxford-cath", loc: "ch 8: Restenosis" },
        { book: "oxford-cath", loc: "ch 8: Drug-eluting stents" },
        { book: "oxford-cath", loc: "ch 8: Bioresorbable scaffolds" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI" },
      ],
      refs: [
        ...BOOKS,
        "basket-small2-2018",
        "jeger-dcb-consensus-2020",
        "yeh-agent-ide-2024",
        "gao-rec-cagefree1-2024",
        "danami3-defer-2016",
        "esc-revasc-2018",
        "esc-ncs-2022",
        "esc-acs-2023",
        "urban-leaders-free-2015",
        "valgimigli-master-dapt-2021",
        "brilakis-diva-2018",
        "total-2015",
        "frobert-taste-2013",
      ],
      blocks: [
        {
          kind: "p",
          text: "Almost every PCI ends with a stent, but the decision to place one is still a decision. Brilakis lists what a stent does, the four situations in which it should not be placed, and what must already be true before it is. This lesson adds where balloon angioplasty, with or without a drug coating, is the planned end point.",
        },
        {
          kind: "h",
          text: "What a stent does",
        },
        {
          kind: "list",
          items: [
            "It stops the vessel recoiling and lowers the risk of acute closure, above all where there is dissection, plaque rupture or thrombus.",
            "It lowers the risk of restenosis. The Oxford handbook explains why: restenosis after a balloon has three parts (immediate elastic recoil, neointimal growth over weeks to months, and negative remodelling over months to years), and stents have largely removed the first and the last. Restenosis affected around 30–60% of patients six months after balloon angioplasty; successive bare-metal stents brought it from around 25% to 10–15%. Restenosis is commoner in longer lesions, smaller vessels, complex lesions, diabetes and renal failure. Angiographic restenosis (seen on a repeat angiogram) is much commoner than clinical restenosis (causing recurrent ischaemic symptoms), which affects only about 10% of patients.",
            "In primary PCI, the handbook notes that the PAMI study found stenting brought no mortality benefit; its benefit was less reinfarction and less need for urgent revascularisation.",
            "History, from the handbook: stents began as bail-out devices for abrupt closure after balloon dissection, were then shown to reduce restenosis compared with balloon angioplasty alone, and their near-universal elective use has run in parallel with falling rates of procedural death, myocardial infarction and emergency CABG.",
          ],
        },
        {
          kind: "steps",
          title: "Do not stent when…",
          items: [
            { title: "1. Antegrade flow is poor", detail: "Placing a stent into no-reflow makes it worse. Treat the flow first (vasodilators, possibly thrombectomy). The single exception is poor flow caused by a dissection, which is exactly what a stent fixes." },
            { title: "2. The lesion will not expand with a balloon", detail: "An undilatable lesion leaves the stent underexpanded. Modify the lesion first (cp-uncrossable, cp-calcium)." },
            { title: "3. An important branch is at high risk and cannot be protected", detail: "Bifurcation strategy is taught in cp-bifurcation-provisional." },
            { title: "4. The vessel and lesion are very small", detail: "Brilakis notes that 2.0 mm stents exist and could be used in some of these." },
          ],
        },
        {
          kind: "list",
          items: [
            "**And not yet,** until the wire is across, the lesion has (in most cases) been prepared, and the distal wire position has been confirmed.",
            "**Ask about the next year.** Brilakis's planning question for stenting is whether the patient can take dual antiplatelet therapy: a history of bleeding or a high bleeding risk, and how reliably they take medication. Citing a 2017 review, he also advises avoiding any stent, drug-eluting or bare-metal, if possible, when non-cardiac surgery is needed within 6–12 months.",
            "**What has changed.** The 2018 ESC/EACTS revascularisation guideline recommends a drug-eluting rather than a bare-metal stent for any PCI, whatever the planned non-cardiac surgery or expected length of dual antiplatelet therapy. High bleeding risk is now handled by shortening dual antiplatelet therapy, to as little as one month with a modern drug-eluting stent, not by avoiding the stent: in LEADERS FREE a polymer-free drug-coated stent beat a bare-metal stent with one month of therapy in both groups, and in MASTER DAPT stopping it one month after a modern stent was non-inferior to continuing. When surgery is planned, the real question is whether the PCI or the operation can wait: the 2022 ESC non-cardiac surgery guideline usually defers elective surgery until about 6 months after elective PCI and 12 months after an acute coronary syndrome. Antiplatelet durations are taught in pm-antithrombotics.",
          ],
        },
        { kind: "tip", id: "pci-stent-not-into-no-reflow" },
        { kind: "tip", id: "pci-stent-check-dapt-and-surgery" },
        {
          kind: "check",
          stem: "After predilatation of a thrombotic circumflex lesion, flow falls to TIMI 1. There is no dissection on two views. The fellow says ‘let's stent it open’. What do Brilakis's rules say?",
          options: [
            "Stent now: a stent always restores flow by trapping the debris behind its struts",
            "Not yet: give vasodilators, consider thrombectomy, then reassess flow",
            "Stent now but with a smaller-diameter stent to reduce embolisation",
            "Remove the wire so the vessel can recover, then rewire in a few minutes",
          ],
          answer: 1,
          explanation:
            "Poor antegrade flow is the first item on Brilakis's do-not-stent list unless a dissection is the cause, because stenting into no-reflow worsens it. His preparation algorithm says give vasodilators and consider thrombectomy first. Undersizing creates its own problems, and pulling the wire out gives up the access you need to treat whatever happens next.",
        },
        { kind: "h", text: "Which stent" },
        {
          kind: "list",
          items: [
            "**Drug-eluting stents by default.** Brilakis uses newer-generation drug-eluting stents in the great majority of patients because they cause less restenosis and less stent thrombosis than bare-metal stents. The exception is the saphenous vein graft, where the two give similar results (DIVA). Even so, current guidelines recommend a drug-eluting stent for every PCI (2018 ESC/EACTS), and bare-metal stents now have essentially no routine role.",
            "**Stenting over thrombus.** Brilakis usually delays the stent until after thrombectomy when the thrombus burden is large. If thrombectomy fails, a stent may trap the thrombus behind its struts and restore flow, but it can still embolise thrombus downstream (the struts act like a cheese grater), and thrombus can lead you to undersize the stent and leave it malapposed.",
            "**The Oxford handbook's older view.** Its drug-eluting stent section, written in the first-generation era, cites NICE guidance limiting drug-eluting stents to vessels under 3 mm or lesions over 15 mm and lists cost and short follow-up as concerns. Its own primary PCI section is more current: new-generation drug-eluting stents are now the standard in STEMI, mainly because fewer repeat procedures are needed. Follow Brilakis and the primary PCI section, not the older list.",
            "**Struts and brand.** Thinner struts deliver better but are often harder to see. Brilakis chooses a brand by its trial evidence, the lesion, local availability and cost.",
            "**Bioresorbable scaffolds.** The Oxford handbook notes that the 2018 European revascularisation guideline did not recommend them outside clinical studies.",
          ],
        },
        { kind: "h", text: "When a balloon alone may be the end point" },
        {
          kind: "table",
          head: ["Setting", "What the manuals say"],
          rows: [
            [
              "STEMI culprit in the RCA with left main or multivessel disease not yet seen",
              "Brilakis: some of these patients will need haemodynamic support or will do better with CABG, so balloon angioplasty of the culprit without a stent may be preferable (see pm-target for the engagement sequence). Treat this as a holding step, not a final strategy: image the left coronary in the same sitting, then stent the culprit unless the anatomy points to CABG or haemodynamic support. Stenting the culprit with a new-generation drug-eluting stent is the standard in primary PCI (Oxford handbook; 2023 ESC ACS guideline).",
            ],
            [
              "ACS culprit that looks excellent after thrombus aspiration",
              "Brilakis cites a 28-patient STEMI series where aspiration gave TIMI 3 flow, residual thrombus grade 3 or less, no significant residual stenosis and no significant distal embolisation; without a stent, the vessel was open at repeat angiography about 6 days later. Observation without a stent has been advocated, especially in a small culprit vessel. This rests on a small observational series; stenting the culprit remains the guideline default, and routine aspiration itself is not recommended (TASTE, TOTAL).",
            ],
            [
              "Deferred stenting in STEMI",
              "The Oxford handbook explains the idea (restore flow, stent hours to days later when thrombus has cleared) but notes DANAMI-DEFER showed no benefit from stenting 48 hours later and more urgent target-vessel revascularisation, so guidelines do not recommend it.",
            ],
            [
              "Distal anastomotic lesions of internal mammary grafts",
              "Brilakis's graft overview suggests considering balloon angioplasty alone.",
            ],
            [
              "Recurrent in-stent restenosis",
              "Brilakis: the first episode is usually treated with a new drug-eluting stent once the lesion is shown to be well dilated; for restenosis that keeps coming back he prefers brachytherapy or a drug-coated balloon.",
            ],
            [
              "Small vessels",
              "Brilakis defines small vessels as under 2.5 mm. Give nitroglycerin before sizing so that spasm does not make the artery look small. Stenting small arteries carries a higher risk of restenosis, especially in diabetes. Avoid aggressive wire manipulation, generally avoid atherectomy (especially in tortuous small vessels), and avoid oversized balloons, which dissect and lengthen the stent needed. Drug-coated balloons can be used.",
            ],
          ],
        },
        {
          kind: "check",
          stem: "A STEMI patient has an occluded mid-RCA. To save time, only the RCA has been engaged with a guide. After wiring and a balloon, flow is TIMI 3. The left coronary has not been seen. What does Brilakis suggest about stenting?",
          options: [
            "Always stent the culprit at once; left coronary anatomy never changes the plan",
            "Stent only if the residual stenosis exceeds 70% after balloon dilatation",
            "Defer any stent by 48 hours to allow the thrombus to dissolve",
            "Consider leaving it unstented until the left coronary has been imaged",
          ],
          answer: 3,
          explanation:
            "Brilakis warns that treating an RCA culprit without knowing the left coronary anatomy can be suboptimal: if there is significant left main or multivessel disease, the patient may need haemodynamic support or CABG, so balloon angioplasty without a stent may be preferable. This is a holding step: once the left coronary has been imaged in the same sitting, the culprit is stented unless the anatomy points to CABG or support. Routine deferred stenting at 48 hours was not beneficial in DANAMI-DEFER and is not recommended.",
        },
        { kind: "h", text: "Drug-coated balloons: what the manuals say and what has changed" },
        {
          kind: "p",
          text: "A drug-coated balloon carries an antiproliferative drug (paclitaxel or sirolimus most often) that passes into the vessel wall when the balloon is inflated, reducing restenosis without leaving metal. Brilakis lists in-stent restenosis as the commonest use, with bifurcations and small vessels as others, and notes that coronary drug-coated balloons were not available in the United States when he wrote, although some operators had used peripheral drug-coated balloons off label in large coronary arteries. The Oxford handbook includes them only in its antiplatelet duration table. Since the manuals, randomised trials have clarified where they fit:",
        },
        {
          kind: "table",
          head: ["Trial", "Who", "Result"],
          rows: [
            [
              "BASKET-SMALL 2 (2018)",
              "758 patients with de novo lesions in vessels under 3 mm, randomised after successful predilatation to a drug-coated balloon or a second-generation drug-eluting stent",
              "Major adverse cardiac events at 12 months 7.5% against 7.3%: the balloon was non-inferior",
            ],
            [
              "AGENT IDE (2024)",
              "600 patients with in-stent restenosis in the United States, paclitaxel-coated against uncoated balloon",
              "Target lesion failure at 1 year 17.9% against 28.6%: the coated balloon was superior",
            ],
            [
              "REC-CAGEFREE I (2024)",
              "2,272 patients with de novo, non-complex lesions of any vessel size, after successful predilatation; drug-coated balloon with rescue stenting if the result was unsatisfactory (needed in 9.4%) against an intended drug-eluting stent",
              "Device-oriented events at 24 months 6.4% against 3.4%: non-inferiority was not shown, and the authors concluded that drug-eluting stents should remain the preferred treatment for these lesions",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "The International DCB Consensus Group (2020) describes drug-coated balloons as established for in-stent restenosis of bare-metal and drug-eluting stents, with good randomised data in small de novo vessels and in high bleeding risk, and emphasises that the devices differ, so there is no class effect.",
            "BASKET-SMALL 2 and REC-CAGEFREE I applied the coated balloon only after successful predilatation, the same gate this module teaches: the lesion must have opened before a balloon-only end point is considered. Technique (sizing, inflation time, what result is acceptable) is taught in cx-small-diffuse.",
          ],
        },
        {
          kind: "check",
          stem: "A 62-year-old has a focal de novo lesion in a 3.5 mm mid-LAD that predilates well. A colleague proposes a drug-coated balloon ‘because the trials show it is as good as a stent’. Which statement is accurate?",
          options: [
            "Correct: BASKET-SMALL 2 showed non-inferiority in all de novo lesions of any size",
            "Correct: AGENT IDE proved coated balloons beat stents in de novo disease",
            "Not supported: REC-CAGEFREE I did not show non-inferiority to a stent here",
            "Not supported: drug-coated balloons have shown no benefit in any coronary setting",
          ],
          answer: 2,
          explanation:
            "BASKET-SMALL 2 enrolled only vessels under 3 mm; AGENT IDE compared coated with uncoated balloons in in-stent restenosis, not with stents in de novo disease. REC-CAGEFREE I, in de novo non-complex lesions of any size, did not show non-inferiority to a drug-eluting stent at two years, and its authors concluded stents should stay the preferred treatment. Saying coated balloons never help ignores AGENT IDE and the consensus that they are established for in-stent restenosis.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting into slow or no flow that is not caused by a dissection.",
            "Stenting a lesion the balloon could not open.",
            "Placing a stent without having planned the dual antiplatelet duration for this patient's bleeding risk, or without deciding with the surgeon whether planned non-cardiac surgery or the PCI should wait.",
            "Choosing a bare-metal stent to shorten dual antiplatelet therapy: current guidance uses a drug-eluting stent with a shorter course instead.",
            "Choosing a stent on outdated restrictions (vessel under 3 mm, lesion over 15 mm) rather than current practice.",
            "Extending drug-coated balloon results from small vessels or restenosis to every de novo lesion.",
            "Stenting an RCA STEMI culprit without knowing whether the left main is diseased, when a balloon-only result would keep options open.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every stent, run four questions in your head: is the flow good, did the balloon open, is any important branch protected, and have you planned the dual antiplatelet duration and any surgery? A ‘no’ to any of them is a reason to stop and think.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For three scenarios (TIMI 1 flow after predilatation without dissection; a persistent balloon waist in calcium; a 2.25 mm distal vessel with a good predilatation result), decide whether to stent now, treat something else first, or consider a balloon-only or drug-coated balloon strategy, and give the reason from the do-not-stent list.",
        },
        { kind: "video", id: "84sVvlUR3Ns", note: "A Manual of PCI case titled ‘DCB troubles’." },
        { kind: "video", id: "RNxl_wf9B2Q", note: "A Manual of PCI case using a peripheral drug-coated balloon for coronary in-stent restenosis." },
        { kind: "video", id: "6I_7sjnvZpw", note: "A CTO case combining intravascular lithotripsy and a drug-coated balloon." },
        {
          kind: "keypoints",
          items: [
            "Stents prevent recoil and acute closure and reduce restenosis; drug-eluting stents for every PCI (in vein grafts outcomes are similar, but guidelines still prefer a drug-eluting stent).",
            "Do not stent: poor flow without dissection, a lesion that will not expand, an unprotectable important branch, a very small vessel.",
            "Stent only after wiring, preparation (in most cases) and confirmed distal wire position.",
            "Check bleeding risk and adherence and plan the antiplatelet duration (short courses with a modern drug-eluting stent in high bleeding risk); if non-cardiac surgery is due soon, decide with the surgeon whether PCI or surgery should wait.",
            "Balloon-only end points: RCA STEMI culprit, until the left coronary has been imaged; selected excellent post-aspiration results; IMA distal anastomosis; recurrent ISR (drug-coated balloon or brachytherapy).",
            "Deferred stenting in STEMI was not beneficial in DANAMI-DEFER and is not recommended.",
            "Drug-coated balloons: established for ISR (AGENT IDE), non-inferior in small vessels (BASKET-SMALL 2), not non-inferior to stents in de novo non-complex disease (REC-CAGEFREE I).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-deploy",
      title: "Choosing, positioning and deploying the stent",
      minutes: 15,
      topics: ["pci-stent-deployment"],
      sources: [
        { book: "brilakis-pci", loc: "1.10" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "brilakis-pci", loc: "27.1" },
        { book: "oxford-cath", loc: "ch 8: Intracoronary stents" },
        { book: "oxford-cath", loc: "ch 8: Drug-eluting stents" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 8: Restenosis" },
      ],
      refs: [...BOOKS, "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis's goal for stenting has three parts: get the stent there, expand it properly, and cover the whole lesion. His thirteen stenting steps mirror the balloon steps. This lesson covers what is different: choosing the size (step 3), preparing the stent balloon (step 4), placing it (step 8) and deploying it (step 9). Steps 10 to 12 (deflate, withdraw, remove) follow the balloon lesson, and step 13 is the next lesson.",
        },
        { kind: "h", text: "Step 3: diameter" },
        {
          kind: "steps",
          items: [
            {
              title: "Measure",
              detail: "By angiography, by intravascular imaging, or both. Imaging makes size selection much more accurate and also shows whether the lesion has been prepared well enough (imaging criteria are taught in pm-imaging). In anatomically complex lesions, current ESC guidance recommends imaging guidance (next lesson).",
            },
            {
              title: "Match the distal reference",
              detail: "Size the stent to the distal reference diameter. Vessels taper, so the proximal reference is usually bigger; a stent sized to it can dissect or perforate the distal vessel, and can occlude a side branch by shifting the carina.",
            },
            {
              title: "Then open the proximal part",
              detail: "After implantation, post-dilate the proximal stent with a larger balloon sized to the proximal reference (the proximal optimisation technique, taught in cp-bifurcation-provisional).",
            },
            {
              title: "Know the platform's limits",
              detail: "When the proximal vessel is much larger than the distal one (left main, aneurysmal vessels), you must know how far each stent can be post-dilated. Labelled limits differ between platforms and between size groups of the same platform (Brilakis's Fig. 10.1 charts five). In large vessels he notes the largest drug-eluting stent available then was 5.0 mm, expandable to 5.75 mm, and that peripheral stents can be used in vessels of 6 mm or more; the smallest coronary stent was 2.0 mm.",
            },
            {
              title: "Imaging-based sizing",
              detail: "Size either to the distal reference or, when the media is visible, to 85% of the media-to-media diameter.",
            },
          ],
        },
        { kind: "tip", id: "pci-stent-size-distal" },
        { kind: "h", text: "Step 3: length" },
        {
          kind: "list",
          items: [
            "Cover the whole lesion **and** every segment injured by the balloon beyond it. Leaving any of it uncovered is a geographic miss, which raises restenosis risk.",
            "Measure the length with a balloon of known length during predilatation, or with an imaging pullback (IVUS or OCT).",
            "Long stents exist (when the manual was written, the longest were 60 mm in Europe and 40 mm in the United States) but are hard to deliver through tortuosity and calcium. There, two or more shorter stents may be easier, or better preparation and more guide support.",
            "In small vessels (under 2.5 mm in Brilakis's definition) keep the stent as short as the lesion allows, which may lower restenosis risk; stenting small arteries carries a higher restenosis risk, especially in diabetes. Give nitroglycerin first so spasm does not make you undersize.",
          ],
        },
        {
          kind: "table",
          caption: "What a poor size choice causes, and when you find out (Brilakis 10.2.3.3)",
          head: ["Choice", "Consequence", "When it shows"],
          rows: [
            ["Stent cannot be delivered (long stents are harder to deliver through tortuous, calcified segments)", "Delivery failure", "Step 8"],
            ["Diameter too big for the vessel", "Perforation, distal edge dissection", "Step 13"],
            ["Too short for the lesion", "Geographic miss", "Step 13"],
          ],
        },
        {
          kind: "check",
          stem: "An LAD tapers from 3.5 mm proximally to 2.75 mm distally across a 24 mm lesion, and the 15 mm predilatation balloon was used twice, end to end, over 28 mm. What stent fits Brilakis's rules?",
          options: [
            "3.5 × 24 mm, sized to the proximal vessel so that the proximal stent is well apposed",
            "2.75 × 24 mm, matching the distal reference and the lesion length exactly",
            "3.0 × 18 mm in the tightest part, with a second stent only if needed",
            "2.75 mm, long enough to cover all 28 mm, then post-dilate the proximal part to 3.5",
          ],
          answer: 3,
          explanation:
            "Size to the distal reference and cover every segment the balloon injured, not only the visible lesion, then post-dilate proximally to the proximal reference, on a platform whose limit allows it. Sizing to 3.5 mm risks distal dissection or perforation and carina shift; 24 mm leaves predilated vessel uncovered (geographic miss); an 18 mm stent misses even more.",
        },
        {
          kind: "steps",
          title: "Step 4: prepare the stent balloon",
          items: [
            { title: "Same as a balloon", detail: "Usually 50% contrast and 50% saline in a Luer-lock syringe (weaker mixtures inflate faster but are harder to see); connect to the stent balloon hub; with the syringe pointing upside down, suck out the air; connect the indeflator." },
            { title: "Suction through the indeflator?", detail: "Many operators do not, to avoid dislodging the stent from its balloon. Brilakis notes that with modern stents the risk of dislodgement and loss is very low and suction can usually be applied." },
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook adds what the stent is: premounted on a monorail balloon, named by its expanded diameter and length, made of stainless steel or increasingly cobalt-chromium and other alloys, and built as a closed-cell tubular design (more metal coverage and radial strength, less flexibility), an open-cell modular design (more flexible, easier side-branch access) or, historically, a coil. Self-expanding stents have dropped out of coronary use, mainly because their restenosis rates were unacceptably high. Stent design in detail is in eq-balloons-stents-cart.",
        },
        {
          kind: "steps",
          title: "Step 8: position",
          items: [
            { title: "Advance", detail: "As in lesson 4, preferably with the independent-hand technique so the left hand can support the guide." },
            { title: "Find the landmarks", detail: "Surgical clips, previous stents and similar fixed markers, plus contrast (sparingly in kidney disease). Coregistration with imaging or physiology can help. The Oxford handbook reminds you that the stent's radio-opaque markers show where its ends are." },
            { title: "Deploy only when it is right", detail: "Patient or operator movement and cardiac motion are the causes of a misplaced stent. Wait for the right position; if the stent swings a lot with each beat, Brilakis notes that rapid pacing during deployment can reduce the risk of landing it in the wrong place." },
            { title: "Order of stents", detail: "When several stents are needed, place them from distal to proximal; Brilakis lists this among the ways to avoid stent loss, while noting that a distal stent is sometimes needed later, for example for an edge dissection." },
          ],
        },
        { kind: "tip", id: "pci-stent-cover-injured-segment" },
        { kind: "tip", id: "pci-stent-cardiac-motion" },
        {
          kind: "steps",
          title: "Step 9: deploy",
          items: [
            { title: "Inflate under fluoroscopy", detail: "Turn the indeflator arm to the target pressure, usually reached over 3–5 seconds." },
            { title: "Pressure", detail: "Brilakis's usual deployment pressure is 12–14 atm, and most stents then get a high-pressure post-dilatation (next lesson). The Oxford handbook sets the floor: never below the stent's nominal pressure, and preferably high enough to expand the whole stent body; it is usual to record a short run with the stent balloon fully expanded." },
            { title: "Duration", detail: "The longer the inflation, the better the expansion. Watch the indeflator: if the pressure keeps falling, the stent is still expanding, so keep inflating." },
            { title: "If expansion looks poor", detail: "On fluoroscopy (often with enhanced stent visualisation) or imaging, use longer inflations or higher pressures (next lesson)." },
            { title: "A caution on the stent balloon", detail: "The Oxford handbook warns that high-pressure inflations with the stent's own balloon are not always desirable: its ends can extend beyond the stent and injure the normal vessel next to it. That is why high-pressure work is done with a shorter non-compliant balloon." },
          ],
        },
        { kind: "tip", id: "pci-stent-hold-the-inflation" },
        {
          kind: "check",
          stem: "During deployment at 14 atm, the indeflator pressure slowly drifts down to 12 atm over 15 seconds, with no sudden drop. What does this mean?",
          options: [
            "A balloon leak; deflate at once and replace it",
            "The stent is still expanding; keep the inflation going",
            "The lesion has dissected; deflate and inject to look for contrast staining",
            "The indeflator is faulty; switch to a new indeflator before going on",
          ],
          answer: 1,
          explanation:
            "Brilakis uses exactly this sign: a continuing fall in stent balloon pressure means the stent is still expanding, and the inflation should be continued. Longer inflations give better expansion. A rupture shows as a sudden drop, not a slow drift.",
        },
        {
          kind: "table",
          caption: "Misplaced stent (Brilakis 10.2.9.3)",
          head: ["Situation", "Remedy"],
          rows: [
            ["The lesion is not fully covered", "An additional stent"],
            ["An ostial stent protrudes a long way into the aorta", "It can be snared and removed"],
          ],
        },
        {
          kind: "list",
          items: [
            "The Oxford handbook lists the technical basis for preventing restenosis and stent thrombosis in the same terms: the right stent size, full expansion when it is deployed, and coverage of the entire lesion, with IVUS guidance shown to reduce restenosis and possibly useful against malapposition. Stent malapposition and undersizing are among its predisposing factors for stent thrombosis.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Sizing to the proximal vessel in a tapering artery.",
            "Covering the visible lesion but not the predilated segment.",
            "Choosing a platform that cannot be post-dilated to the proximal reference.",
            "A long stent pushed through calcified tortuosity when two short ones would have gone.",
            "Deploying below nominal pressure, or deflating the moment the target pressure is reached.",
            "High-pressure inflation on the stent balloon, injuring the vessel beyond the stent edges.",
            "Deploying while the stent swings with each heartbeat.",
          ],
        },
        {
          kind: "pearl",
          text: "Write down the predilatation balloon's length and how many times, and where, you inflated it. That record is your stent length. Geographic miss comes from a stent shorter than the injured segment or from injuring vessel outside the lesion (Brilakis); the balloon record prevents the first, and a balloon shorter than the lesion prevents the second.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "A LAD tapers from 3.5 mm to 2.75 mm over a 24 mm lesion that was predilated over 28 mm. Choose a stent sized to the distal reference, long enough for the injured segment, on a platform whose labelled post-dilatation limit reaches 3.5 mm; deploy at 12–14 atm, holding the inflation while the pressure keeps falling.",
        },
        { kind: "video", id: "rInrpac5lwI", note: "Manual of PCI chapter 10.1: how to perform stenting." },
        { kind: "video", id: "ZFyi-1faRSI", note: "A Manual of PCI case titled ‘The 3.5 mm stent’." },
        { kind: "video", id: "5GjTX2J80Fw", note: "Sizing balloons, stents and drug-coated balloons by angiography and by IVUS or OCT (Elias Hanna)." },
        {
          kind: "keypoints",
          items: [
            "Diameter: distal reference (or 85% of media-to-media on imaging); proximal segment post-dilated to the proximal reference.",
            "Know each platform's post-dilatation limit when the proximal vessel is much bigger.",
            "Length: the whole lesion plus every balloon-injured segment; measure with the balloon or an imaging pullback.",
            "Long stents deliver poorly through tortuosity and calcium; consider two shorter ones.",
            "Deploy at 12–14 atm (never below nominal), inflate over 3–5 s and hold while the pressure keeps falling.",
            "Deploy only in the right position; rapid pacing can help when cardiac motion is excessive.",
            "Stent from distal to proximal.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-prep-and-stent-result",
      title: "Post-dilatation, enhanced stent visualisation and the final result",
      minutes: 14,
      topics: ["pci-postdilatation-result"],
      sources: [
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "19.10" },
        { book: "brilakis-pci", loc: "22.2" },
        { book: "brilakis-pci", loc: "28.3" },
        { book: "oxford-cath", loc: "ch 8: The PCI procedure" },
        { book: "oxford-cath", loc: "ch 8: Optical coherence tomography" },
        { book: "oxford-cath", loc: "ch 8: Stent thrombosis" },
        { book: "oxford-cath", loc: "ch 1: Fluoroscopy and acquisition" },
      ],
      refs: [...BOOKS, "esc-ccs-2024", "renovate-2023"],
      blocks: [
        {
          kind: "p",
          text: "A deployed stent is not a finished stent. Brilakis follows most deployments with high-pressure post-dilatation and then checks the result in a set order. This lesson covers that sequence, the X-ray tool that shows the stent itself, the four problems the check is looking for, and how the Oxford handbook defines a successful result.",
        },
        { kind: "h", text: "Post-dilatation" },
        {
          kind: "steps",
          items: [
            { title: "The default", detail: "After deployment at 12–14 atm, Brilakis post-dilates in most cases at high pressure (20 atm or more) with a shorter non-compliant balloon, which stays inside the stent." },
            { title: "Three exceptions", detail: "Skip high-pressure post-dilatation when intravascular imaging has confirmed excellent expansion, when you are worried about embolising thrombus or plaque, or when you are worried about compromising a large jailed branch." },
            { title: "If expansion is still poor", detail: "Inflate for longer, or go higher: semi-compliant balloons to as much as 20 atm, non-compliant balloons to as much as 26–28 atm (within the device's chart)." },
            { title: "The proximal segment", detail: "Where the vessel tapers, post-dilate the proximal stent with a larger, shorter non-compliant balloon sized to the proximal reference (lesson 7)." },
            { title: "The Oxford handbook's version", detail: "A stent that has not opened completely is post-dilated with a semi-compliant or non-compliant balloon." },
          ],
        },
        { kind: "tip", id: "pci-optimise-nc-postdilate" },
        {
          kind: "check",
          stem: "A 3.0 mm stent has been deployed in a large thrombotic STEMI culprit, with a good angiographic result and TIMI 3 flow. Does Brilakis's default of high-pressure post-dilatation apply?",
          options: [
            "Yes, always: every stent should be post-dilated at 20 atm or more",
            "Yes, but with a balloon longer than the stent so that the edges are treated too",
            "Not necessarily: concern about embolising thrombus is a listed exception",
            "No: post-dilatation is never done in acute coronary syndromes",
          ],
          answer: 2,
          explanation:
            "Brilakis lists three exceptions to routine high-pressure post-dilatation: excellent expansion on imaging, concern about thrombus or plaque embolisation, and concern about a large jailed branch. The Oxford handbook makes the same point about embolisation risk in primary PCI. A balloon longer than the stent at high pressure injures the edges, and post-dilatation is not banned in ACS; it is weighed.",
        },
        { kind: "h", text: "Step 13: check the result, in order" },
        {
          kind: "steps",
          items: [
            { title: "1. Clear the guide", detail: "Aspirate and flush once the balloon is out." },
            { title: "2. Check the guide", detail: "It may have backed out or dived in while the balloon came out." },
            { title: "3. Nitroglycerin", detail: "May be given to reduce spasm before you judge the vessel." },
            { title: "4. Inject", detail: "Look at the stented segment, its edges, the side branches and the distal vessel." },
            { title: "5. Show the stent", detail: "Enhanced stent visualisation helps judge expansion (below)." },
            { title: "6. Or measure it", detail: "IVUS or OCT, or physiology, can assess the result and save contrast (pm-imaging, pm-physiology)." },
          ],
        },
        {
          kind: "p",
          text: "**When imaging is more than an option.** In anatomically complex lesions (left main, true bifurcations, long lesions) the 2024 ESC chronic coronary syndromes guideline recommends IVUS or OCT guidance rather than angiography alone. In RENOVATE-COMPLEX-PCI (1,639 patients with complex lesions), imaging guidance cut the composite of cardiac death, target-vessel infarction and target-vessel revascularisation from 12.3% to 7.7% (hazard ratio 0.64). In calcified lesions Brilakis recommends imaging both before stenting, to confirm preparation, and after, to confirm expansion. Imaging criteria are taught in pm-imaging.",
        },
        { kind: "h", text: "Enhanced stent visualisation" },
        {
          kind: "p",
          text: "Some X-ray systems offer a stent enhancement mode that shows the deployed stent far more clearly than ordinary fluoroscopy. Brilakis names two vendor modes of this kind and returns to them throughout the book:",
        },
        {
          kind: "list",
          items: [
            "To judge stent expansion after deployment, and to show a waist when a lesion has not yielded.",
            "To place a balloon precisely inside an existing stent.",
            "To make sure a stent fully covers a side-branch ostium and to see whether a stent has deformed.",
            "In stent failure, to show a fracture or a gap between stents, with a balloon positioned inside the blocked stent.",
            "In calcified lesions, together with imaging, to confirm adequate expansion.",
            "To save contrast: it is on Brilakis's list of contrast-sparing strategies.",
          ],
        },
        { kind: "tip", id: "pci-optimise-show-the-stent" },
        { kind: "tip", id: "pci-acq-fluoro-save-inflations" },
        {
          kind: "p",
          text: "A note on the image itself, from the Oxford handbook: pulsed fluoroscopy at low frame rates is fine for delivery, and modern systems can store a few seconds of it; cine acquisition, at higher dose and frame rate, gives higher-resolution images that are saved for recording and diagnosis, and should be used sparingly because it is the main source of patient dose. Brilakis's table of contrast-sparing strategies advises high frame-rate acquisition (15 or 25 frames per second) to evaluate the final result.",
        },
        { kind: "h", text: "The four problems the check looks for" },
        {
          kind: "table",
          head: ["Problem", "Causes", "How it shows", "Treatment"],
          rows: [
            [
              "Underexpansion (a lesion that would not dilate)",
              "Severe calcium, in-stent restenosis, poor preparation",
              "A waist that persists on high-pressure inflation; imaging; enhanced stent visualisation",
              "The balloon-undilatable algorithm (cp-uncrossable). Prevent with meticulous preparation, especially in calcium",
            ],
            [
              "Lesion not fully covered",
              "Stent too short; too much vessel injured by preparation",
              "Residual narrowing at the proximal or distal edge",
              "Further stent(s). Prevent by sizing length from the balloon or an imaging pullback, and by not dilating outside the lesion",
            ],
            [
              "Distal edge dissection",
              "Oversized stent or very high pressures; incomplete coverage, especially with the edge on a lipid-rich plaque",
              "Lucency at the stent edge; slow or no flow if large; a flap on IVUS or OCT",
              "Another stent for a significant dissection. Prevent by avoiding oversizing and very high pressure inflation of the stent balloon",
            ],
            [
              "Side-branch occlusion",
              "The ostium is jailed; plaque or carina shift",
              "Slow or no flow in the branch",
              "Balloon and/or stent the branch. Prevent by wiring important branches first, ballooning or stenting the branch first, and proximal optimisation proximal to the carina (cp-bifurcation-provisional)",
            ],
          ],
        },
        { kind: "tip", id: "pci-optimise-edge-dissection" },
        { kind: "tip", id: "pci-optimise-side-branch-loss" },
        {
          kind: "check",
          stem: "After a 3.0 × 23 mm stent in a mid-RCA at 14 atm and post-dilatation at 22 atm with a 3.0 mm balloon, there is a linear lucency just beyond the distal edge, with TIMI 2 flow. What is the most likely explanation and treatment?",
          options: [
            "A distal edge dissection; cover it with an additional stent",
            "Spasm only; nitroglycerin and accept the result whatever happens",
            "Thrombus in the stent; aspirate and give more heparin",
            "An artefact of the wire; remove the wire and take a final run",
          ],
          answer: 0,
          explanation:
            "Lucency at a stent edge with slowed flow is how Brilakis describes a significant distal edge dissection, caused by oversizing, very high pressures or an edge landing on soft plaque. Significant dissections are covered with an additional stent. Nitroglycerin is reasonable for spasm but does not treat a flap, and pulling the wire would give up the route to the fix.",
        },
        { kind: "h", text: "Judging the final result" },
        {
          kind: "list",
          items: [
            "**Two orthogonal views, first with the wire in, then out.** Confirm the result in two or more orthogonal projections while the wire is still across, so that an edge dissection or other problem can still be treated (Brilakis checks the result before any wire comes out). Only then withdraw the wire and repeat the views: the wire straightens the vessel and can create pseudolesions, so the Oxford handbook judges the final residual stenosis on views taken with the wire removed.",
            "**The success threshold.** Angiographic success is generally a final diameter stenosis under 20%.",
            "**What imaging adds.** The Oxford handbook lists what OCT finds after stenting that angiography can miss: strut malapposition, stent underexpansion, geographic miss, edge dissection and tissue prolapse.",
            "**Why it matters later.** Underexpansion leads to restenosis and stent thrombosis (Brilakis), and malapposition or undersizing predisposes to stent thrombosis (Oxford handbook), which is why both books insist on correct sizing and full expansion at the first procedure.",
          ],
        },
        { kind: "tip", id: "pci-optimise-final-views" },
        {
          kind: "pitfalls",
          items: [
            "Skipping post-dilatation without one of the three reasons.",
            "Post-dilating with a balloon that extends beyond the stent.",
            "Injecting to judge the result before the guide is aspirated and its position checked.",
            "Accepting a stent whose expansion you have not actually seen, on enhanced visualisation or imaging.",
            "Calling an edge lucency spasm without giving nitroglycerin and looking again.",
            "Judging the final result in one view, or pulling the wire before the result has been checked with it still across.",
          ],
        },
        {
          kind: "pearl",
          text: "Use the enhanced stent image as a reflex at two moments: after deployment, to decide how hard to post-dilate, and with the post-dilatation balloon in place, to be sure its markers sit inside the stent before you go to high pressure.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "After deploying a stent at 12–14 atm, choose a shorter non-compliant balloon, post-dilate at 20 atm or more within the stent, then run the step 13 checklist (aspirate, guide position, nitroglycerin, injection, stent view, imaging) and decide whether the result meets the Oxford success threshold or shows one of the four problems.",
        },
        { kind: "video", id: "rInrpac5lwI", note: "Manual of PCI chapter 10.1: how to perform stenting." },
        { kind: "video", id: "cyikf9s8Ph8", note: "A Manual of PCI case on refractory stent underexpansion." },
        { kind: "video", id: "TsqRwqZju4s", note: "A Manual of PCI case on how to treat underexpanded stents." },
        {
          kind: "keypoints",
          items: [
            "Default: high-pressure (20 atm or more) post-dilatation with a shorter non-compliant balloon.",
            "Exceptions: imaging-confirmed excellent expansion, embolisation concern, a large jailed branch at risk.",
            "More expansion if needed: up to 20 atm semi-compliant, 26–28 atm non-compliant, or longer inflations.",
            "Check in order: aspirate, guide position, nitroglycerin, injection, enhanced stent view, imaging or physiology.",
            "Look for underexpansion, incomplete coverage, edge dissection and side-branch occlusion, each with its own fix.",
            "Final result: two orthogonal views with the wire in, then repeated with it out; residual stenosis under 20%.",
            "Complex lesions (left main, true bifurcation, long lesion): imaging guidance is recommended (ESC 2024; RENOVATE-COMPLEX-PCI).",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-prep-and-stent-q1",
      stem: "A 3.0 mm non-compliant balloon, sized 1:1 to the distal reference, still shows a central waist in a calcified LAD lesion after repeated, prolonged inflations at 26 atm, within its rated pressure. Which next step follows Brilakis?",
      options: [
        "Deploy a 3.0 mm stent at 14 atm and fix the waist with post-dilatation afterwards",
        "Go to 35 atm on the same balloon until the waist disappears",
        "Do not stent; image the lesion and follow the balloon-undilatable algorithm",
        "Change to a 3.5 mm compliant balloon at 14 atm to apply more force",
      ],
      answer: 2,
      explanation:
        "A waist that persists despite multiple high-pressure inflations defines a balloon-undilatable lesion. Brilakis's preparation sequence makes balloon expansion a gate before stenting, inability to expand the lesion is on his do-not-stent list, and imaging helps choose the modification (cp-uncrossable). Brilakis lists pressures above 20 atm as a rupture risk, but allows non-compliant balloons up to 20–26 atm (and often 26–28 atm in undilatable lesions) within the device's rated pressure; 35 atm is beyond both. Compliant balloons expand unpredictably at high pressure and an oversized balloon risks dissection or rupture (Oxford handbook), which is why Brilakis prefers a 1:1 non-compliant balloon. Stenting first leaves an underexpanded stent that is far harder to fix.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q2",
      stem: "How does Brilakis inflate a cutting balloon?",
      options: [
        "Over 3–5 seconds to 12–20 atm, like a non-compliant balloon",
        "About 5 seconds per atm, usually to 6–8 atm and never above 12 atm",
        "Rapidly to 30–35 atm, so the blades score the full circumference",
        "At nominal pressure only, for 30–60 seconds, without exceeding 4 atm",
      ],
      answer: 1,
      explanation:
        "Cutting balloons are inflated much more slowly than standard balloons (5 seconds per atm, not above 12 atm), usually to 6–8 atm, so the blades do not puncture their own balloon or catch on calcium. 3–5 seconds to 12–20 atm is the non-compliant balloon; 30–35 atm is the very-high-pressure balloon.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q3",
      stem: "During predilatation the indeflator pressure falls suddenly from 22 atm. In what order should you act?",
      options: [
        "Suction on the indeflator, remove the balloon, aspirate the guide, then angiogram",
        "Angiogram through the guide, then suction, then remove the balloon from the vessel",
        "Reinflate to 22 atm to seal the tear, then remove the balloon and aspirate",
        "Remove the balloon under positive pressure, then flush the guide with saline",
      ],
      answer: 0,
      explanation:
        "Brilakis: apply suction immediately so contrast is not jetted through the tear (which can perforate the vessel), remove the balloon, aspirate the guide to clear air, then take an angiogram to look for perforation, treating any perforation with a new balloon at the site. Injecting before aspirating risks air embolism; flushing without aspirating pushes any air downstream.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q4",
      stem: "Which statement about anchoring a guide with a side-branch balloon matches Brilakis?",
      options: [
        "Use a balloon one size larger than the branch, inflated to 14 atm, so that the grip cannot slip at all",
        "Use a short balloon with its hydrophilic coating intact, inflated in the main vessel",
        "Anchoring is safe in any branch, because the occlusion lasts only seconds",
        "Size it 1:1 to the branch at low pressure; a long balloon with the coating wiped grips best",
      ],
      answer: 3,
      explanation:
        "Brilakis sizes the anchor balloon 1:1 to the branch and inflates at relatively low pressure (4–8 atm in chapter 9; 6–8 atm in chapter 23) to keep branch injury minor, and improves grip with a long balloon whose hydrophilic coating has been wiped off. Oversizing risks dissection and perforation of the branch. Anchoring in large branches such as diagonals can cause ischaemia, and prolonged conus occlusion can cause arrhythmia, so intermittent deflation may be needed.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q5",
      stem: "A stent has been delivered across a tight lesion using a distal anchor balloon on a second wire. What must happen before the stent is deployed?",
      options: [
        "The anchor balloon is deflated but left in place, so the second wire stays across",
        "The second wire and the anchor balloon are withdrawn, so the wire is not trapped",
        "The anchor balloon is reinflated to hold the stent in position during deployment",
        "The guide is exchanged for a larger one to protect the anchor wire",
      ],
      answer: 1,
      explanation:
        "In the distal anchor technique the second wire and its balloon are removed before stent deployment, to avoid trapping the second wire behind the stent. (The buddy-wire stent anchor is a different technique, in which a proximal stent deliberately traps a buddy wire.) Exchanging the guide after crossing risks losing the main wire.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q6",
      stem: "A balloon will not pass a point in the mid-LAD where a stent was placed two years ago, although it went through the proximal segment easily. What is the likely problem and solution?",
      options: [
        "The old stent has restenosed; dilate it first with a larger balloon at higher pressure, then try again",
        "The wire has gone under a strut; withdraw it and recross the stent with a knuckled tip",
        "Guide support is inadequate; deep intubate the left main with the guide",
        "The balloon is too compliant; switch to a non-compliant balloon and push firmly",
      ],
      answer: 1,
      explanation:
        "Resistance precisely at a previous stent should make you suspect that the wire crossed under a strut. Brilakis advises withdrawing the wire and advancing a knuckled wire through the stent; forcing devices on can deform the old stent lengthways. Deep intubation of the left main is rarely done and does not address the cause; non-compliant balloons deliver worse, not better.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q7",
      stem: "Which is on Brilakis's list of situations in which a stent should not be placed?",
      options: [
        "A flow-limiting dissection seen in two views after predilatation of the lesion",
        "A thrombotic culprit lesion in a patient with an acute coronary syndrome",
        "Poor antegrade flow after predilatation that is not due to a dissection",
        "A lesion longer than 20 mm in a vessel of 3.0 mm",
      ],
      answer: 2,
      explanation:
        "Poor antegrade flow is first on the list, unless a dissection causes it: stenting into no-reflow worsens it. A dissection is the classic reason to stent, and stents are particularly protective in lesions with dissection, rupture or thrombus. Lesion length changes the choice of stent, not whether to stent.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q8",
      stem: "An LAD tapers from 3.5 mm to 2.5 mm across the lesion. Why does Brilakis size the stent to the distal reference rather than the proximal one?",
      options: [
        "Because distal sizing allows a longer stent to be used safely",
        "Because the proximal segment never needs full apposition against the vessel wall",
        "Because stents always expand to the proximal size by themselves",
        "Because proximal sizing risks distal dissection, perforation and carina shift",
      ],
      answer: 3,
      explanation:
        "Normal tapering makes the proximal reference larger. A stent sized to it can dissect or perforate the distal vessel and occlude a side branch through carina shift. The proximal part is then post-dilated with a larger balloon sized to the proximal reference (proximal optimisation), within the platform's labelled limit, which is why you must know that limit when the vessel tapers steeply.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q9",
      stem: "What did REC-CAGEFREE I show, and how should it change practice in de novo, non-complex lesions?",
      options: [
        "A coated balloon with rescue stenting was not non-inferior to a stent; stents stay preferred",
        "A coated balloon was non-inferior to a stent, so either can be chosen in any vessel size",
        "A coated balloon was superior to an uncoated balloon, so plain angioplasty should be abandoned",
        "No difference at one year, so a coated balloon is preferred to avoid antiplatelet therapy",
      ],
      answer: 0,
      explanation:
        "REC-CAGEFREE I randomised 2,272 patients with de novo non-complex lesions, after successful predilatation, to a paclitaxel-coated balloon with rescue stenting or an intended drug-eluting stent. At 24 months device-oriented events were 6.4% against 3.4%; non-inferiority was not met and the authors concluded that drug-eluting stents should remain preferred. The coated-against-uncoated comparison is AGENT IDE, in in-stent restenosis; non-inferiority in vessels under 3 mm is BASKET-SMALL 2.",
      difficulty: 3,
      refs: ["gao-rec-cagefree1-2024", "yeh-agent-ide-2024", "basket-small2-2018"],
    },
    {
      id: "pm-prep-and-stent-q10",
      stem: "Brilakis deploys most stents at 12–14 atm and then post-dilates at 20 atm or more. Which is NOT one of his reasons to skip high-pressure post-dilatation?",
      options: [
        "Intravascular imaging has already confirmed excellent stent expansion",
        "There is concern about embolising thrombus or plaque",
        "A large jailed side branch could be compromised",
        "The stent is longer than 30 mm and covers a long segment",
      ],
      answer: 3,
      explanation:
        "His three exceptions are imaging-confirmed excellent expansion, concern about thrombus or plaque embolisation, and concern about compromising a large jailed branch. Stent length is not one of them; a long stent can be post-dilated in overlapping inflations with a shorter non-compliant balloon kept inside the stent.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q11",
      stem: "According to the Oxford handbook, how should the final angiographic result be judged?",
      options: [
        "In one view with the wire in place; residual stenosis under 30%",
        "In two orthogonal views with the wire withdrawn; residual stenosis under 20%",
        "In two orthogonal views with the wire left in place; residual stenosis under 50%",
        "By the stent balloon's appearance at full inflation; no injection needed",
      ],
      answer: 1,
      explanation:
        "The handbook judges the final angiogram in two or more orthogonal projections once the wire has been pulled out, because the wire distorts the anatomy and creates artefacts, and defines angiographic success as a final diameter stenosis under 20%. In practice the result is first checked in orthogonal views with the wire still across, so that a problem can be fixed, and the wire-out views are the final ones. The image of the inflated stent balloon shows deployment, not the final lumen.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-prep-and-stent-q12",
      stem: "A stent will not advance past a calcified RCA bend from the right radial with a 6 Fr JR4. A buddy wire has not helped. A colleague suggests exchanging for a 7 Fr AL1 over the current wire. What is the main concern Brilakis raises, and a reasonable alternative?",
      options: [
        "An AL1 never fits the RCA from the radial side; use a 5 Fr guide extension instead of any exchange",
        "Exchanging a guide after crossing can lose the wire; try a guide extension or an anchor first",
        "A larger guide gives less support than a smaller one; stay with the JR4 and push harder",
        "Exchanging is risk-free once a wire is across; the AL1 should have been the first choice",
      ],
      answer: 1,
      explanation:
        "Brilakis notes that changing the guide after the wire has crossed can be challenging and may lose the wire, which can be unacceptable. Guide extensions and anchoring add support without an exchange. In the randomised transradial trial he cites (DOCA-TRI, 187 patients in whom delivery had already failed), a 5 Fr child catheter inside the 6 Fr guide succeeded far more often than a buddy wire or balloon anchoring; rapid-exchange guide extensions work on the same principle. Larger and more supportive guides do support better (an AL1 better than a JR4), which is why the choice is best made at the start; pushing harder risks guide and wire loss and stent loss.",
      difficulty: 3,
      refs: [...BOOKS, "zhang-doca-tri-2012"],
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Size the predilatation balloon 1:1 to the distal reference, inflate over 3–5 s and hold 10–20 s; if a waist persists despite longer, higher-pressure inflations within the balloon's rated pressure, stop and modify. Then size the stent to the distal reference, long enough for the predilated segment, deploy at 12–14 atm while the pressure keeps falling, and post-dilate at 20 atm or more with a shorter non-compliant balloon inside the stent." },
    { sim: "cathlab", task: "Seat an EBU 3.5 and a JL4 in the same left coronary and compare how each behaves when you push forward; then compare an AL1 with a JR4 in the RCA. Say which gives more support and why (bracing against the opposite aortic wall)." },
  ],
  caseIds: ["pm-prep-and-stent-case-calcified-rca", "pm-prep-and-stent-case-lcx-flow"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-prep-and-stent-case-calcified-rca",
    title: "A calcified RCA that will not open, then will not let the stent through",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 9.2-9.10, 10.2, 19.1-19.10, 23.1 and 23.2; Oxford Handbook, chapter 8 (angioplasty balloons, guiding catheters, the PCI procedure)",
    },
    summary: "Elective PCI of a calcified mid-RCA from the right radial: preparation before stenting, a lesion that will not expand, a stent that will not reach, stepwise support, deployment and post-dilatation.",
    presentation:
      "A 71-year-old woman has exertional angina despite two antianginal drugs and inferior ischaemia on stress perfusion imaging. Diagnostic angiography last month showed an 85% mid-RCA stenosis, 22 mm long, beyond a calcified proximal bend. The lesion looks moderately calcified on angiography: its densities are seen only with cardiac motion before contrast is injected. She returns for PCI from the right radial artery with a 6 Fr JR4 guide.",
    findings: ["Blood pressure 138/74 mmHg, sinus rhythm 66/min", "eGFR 58 mL/min/1.73 m²", "Distal RCA reference 3.0 mm, proximal 3.5 mm", "Heparin given; ACT in range"],
    steps: [
      {
        id: "s1",
        prompt: "A workhorse wire has crossed and sits in the distal posterior descending artery, several centimetres beyond the lesion. The guide has been back-bled, aspirated and filled with contrast. How do you prepare the lesion?",
        options: [
          {
            text: "A 3.0 mm non-compliant balloon, shorter than the lesion, to test whether it opens fully",
            best: true,
            feedback: "Brilakis sizes the balloon 1:1 to the distal reference precisely to learn whether the lesion will expand before any metal goes in, keeps it shorter than the lesion, and prefers non-compliant balloons. This matters most in calcium; with moderate calcium on angiography, a balloon first with atherectomy if it fails is one of his two accepted approaches.",
          },
          {
            text: "IVUS or OCT first, to grade the calcium and choose between a balloon and upfront modification",
            acceptable: true,
            feedback: "Also reasonable. Brilakis encourages intravascular imaging in calcified lesions because angiography underestimates calcium, and imaging findings (a large calcium arc, thick and long calcium) help predict that a balloon will not be enough.",
          },
          {
            text: "Go straight to a 3.0 × 26 mm drug-eluting stent to save time",
            next: "c-direct",
            feedback: "Brilakis prepares nearly every lesion and keeps primary stenting for a few lesion types such as friable vein grafts or thrombus; this is neither, angiography underestimates calcium, and direct stenting is a listed cause of stent loss, especially in tortuous and calcified vessels.",
            stateDelta: { stability: -10, flags: ["direct-stent-attempt"] },
          },
          {
            text: "A 3.5 × 30 mm compliant balloon to open the whole segment at once",
            feedback: "Oversized and longer than the lesion: it injures normal vessel either side (lengthening the stent needed), and an oversized balloon risks dissection or rupture (Oxford handbook). Compliant balloons also expand unpredictably at high pressure, which is why Brilakis prefers a 1:1 non-compliant balloon.",
            stateDelta: { stability: -5, flags: ["oversized-balloon"] },
          },
        ],
      },
      {
        id: "c-direct",
        kind: "consequence",
        prompt: "The stent stops at the proximal bend. You push, the guide backs out of the ostium and the stent now looks slightly deformed at its proximal end. What now?",
        options: [
          {
            text: "Stop pushing, make the guide coaxial and withdraw the stent gently into the guide under screening",
            best: true,
            feedback: "Brilakis: avoid force, do not push the proximal stent out of the guide when it is not advancing, and keep the guide coaxial when pulling a stent back. A deformed stent pulled against a non-coaxial tip is how stents are stripped.",
          },
          {
            text: "Pull the stent back briskly before the guide moves any further",
            feedback: "Forceful withdrawal of a deformed stent into the guide is one of the listed causes of stent loss.",
            stateDelta: { stability: -15, flags: ["stent-stripped"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The 3.0 mm non-compliant balloon is inflated slowly to 20 atm and held, then given two prolonged 45-second inflations at 26 atm, which its compliance chart allows. A firm waist remains in the middle of the lesion.",
        info: "No dissection, TIMI 3 flow.",
        variants: [{ flag: "oversized-balloon", info: "The earlier oversized balloon has left a type A dissection proximal to the lesion; it will need to be covered by the stent." }],
        options: [
          {
            text: "Stop. Do not stent; image the lesion and escalate calcium modification as the undilatable-lesion algorithm directs",
            best: true,
            feedback: "A waist that persists despite multiple prolonged high-pressure inflations is a balloon-undilatable lesion. Inability to expand the lesion is on Brilakis's do-not-stent list; imaging helps choose the modification (cp-uncrossable, cp-calcium).",
          },
          {
            text: "Take the same balloon to 30 atm",
            next: "c-rupture",
            feedback: "Beyond the 26–28 atm Brilakis describes for non-compliant balloons in undilatable lesions, and above most rated burst pressures. High pressures in heavily calcified lesions are the textbook causes of balloon rupture.",
            stateDelta: { stability: -10, flags: ["rupture"] },
          },
          {
            text: "Deploy the stent anyway and fix the waist with post-dilatation",
            feedback: "A lesion that a non-compliant balloon cannot open will not be opened by the stent: you will be left with an underexpanded stent, a cause of restenosis and stent thrombosis, which is much harder to treat.",
            stateDelta: { stability: -20, flags: ["underexpanded"] },
          },
        ],
      },
      {
        id: "c-rupture",
        kind: "consequence",
        prompt: "At 28 atm the indeflator needle drops suddenly to 3 atm.",
        options: [
          {
            text: "Suction on the indeflator at once, remove the balloon, aspirate the guide, then angiogram for perforation",
            best: true,
            feedback: "Brilakis's order: immediate suction so contrast is not jetted through the tear, remove the balloon, aspirate air from the guide, then look for perforation (and if present, inflate a new balloon at the site).",
          },
          {
            text: "Inject contrast immediately to see what happened",
            feedback: "Injecting before the guide has been aspirated risks air embolism, and leaving the balloon unsuctioned lets contrast jet into the wall.",
            stateDelta: { stability: -15, flags: ["air"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After calcium modification by the team, a 3.0 mm non-compliant balloon now expands fully at 16 atm. Flow is TIMI 3 without dissection. The balloon was inflated over 28 mm in total. Which stent?",
        options: [
          {
            text: "3.0 mm, long enough to cover all 28 mm, then post-dilate the proximal part to 3.5 mm",
            best: true,
            feedback: "Size to the distal reference, cover every balloon-injured segment, and post-dilate proximally to the proximal reference, on a platform whose labelled limit allows 3.5 mm.",
          },
          {
            text: "3.5 × 28 mm, matched to the proximal vessel for good apposition",
            feedback: "Sizing to the proximal reference in a tapering vessel risks distal dissection or perforation, and carina shift into side branches.",
            stateDelta: { stability: -10, flags: ["oversized-stent"] },
          },
          {
            text: "3.0 × 22 mm, matching the angiographic lesion length",
            feedback: "That leaves balloon-injured vessel uncovered: a geographic miss, which raises restenosis risk.",
            stateDelta: { stability: -5, flags: ["geographic-miss"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The stent stops at the calcified proximal bend. As you push, the JR4 starts to back out of the ostium.",
        options: [
          {
            text: "Stop pushing, re-seat the guide, then add support: forward push with the independent-hand technique, a buddy wire and a deep breath",
            best: true,
            feedback: "Simple measures from Brilakis's guide, wire and ‘other’ groups, which can be combined. Pushing against a backing-out guide loses position.",
          },
          {
            text: "Push harder; the stent is nearly there",
            next: "c-push",
            feedback: "Forceful advancement is the cause of guide and wire position loss and of stent loss.",
            stateDelta: { stability: -15, flags: ["position-lost"] },
          },
          {
            text: "Exchange the JR4 for a 7 Fr AL1 over the current wire",
            feedback: "A more supportive guide is better, but changing the guide after the wire has crossed can lose the wire. Brilakis's alternatives add support without an exchange; the better time to choose an AL1 was at the start.",
            acceptable: true,
          },
        ],
      },
      {
        id: "c-push",
        kind: "consequence",
        prompt: "The guide has prolapsed into the aorta and the wire tip has slid back to the mid-RCA. The stent is in the proximal RCA, undeployed.",
        options: [
          {
            text: "Withdraw the stent coaxially into the guide, re-engage, readvance the wire distally, then escalate support before trying again",
            best: true,
            feedback: "Brilakis's treatment for position loss is to re-engage and rewire or readvance the wire, and the stent comes back with the guide coaxial.",
          },
          {
            text: "Deploy the stent where it is in the proximal RCA to avoid losing it",
            feedback: "Deploying away from the lesion leaves metal in normal vessel and makes the next delivery harder.",
            stateDelta: { stability: -10, flags: ["stent-misplaced"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "With a buddy wire in place, the stent still will not pass the bend.",
        options: [
          {
            text: "Advance a guide extension beyond the bend, watching the pressure trace, and deliver the stent through it",
            best: true,
            feedback: "Guide extensions are among the commonest tools for delivery; they add support and carry the stent past the diseased segment. In the radial trial Brilakis cites (DOCA-TRI, 187 patients in whom delivery had already failed), a 5 Fr child catheter inside the 6 Fr guide succeeded far more often than a buddy wire or balloon anchoring; rapid-exchange guide extensions work on the same principle. Do not inject if it wedges and damps.",
          },
          {
            text: "Anchor with a balloon sized 1:1 to the conus branch at low pressure",
            acceptable: true,
            feedback: "A valid alternative from Brilakis's anchor techniques; watch for chest pain and arrhythmia with conus occlusion and deflate intermittently if needed.",
          },
          {
            text: "Change to a longer stent so more of it reaches beyond the bend",
            next: "c-longer",
            feedback: "Longer stents are harder, not easier, to deliver through tortuous calcified segments.",
            stateDelta: { stability: -5, flags: ["longer-stent"] },
          },
        ],
      },
      {
        id: "c-longer",
        kind: "consequence",
        prompt: "The longer stent stops at the same place. What is the better plan?",
        options: [
          {
            text: "Withdraw it coaxially and use a guide extension, or two shorter stents, with better support",
            best: true,
            feedback: "Shorter, thinner-strut stents deliver more easily, and two short stents may pass where one long one will not.",
          },
          {
            text: "Bend the long stent by hand into a curve and try again",
            feedback: "Bending may help round a curve but raises the risk of stent loss; it is not the first answer when better support has not been tried.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The stent is at the lesion, the extension withdrawn proximal to it. Both markers sit in normal vessel beyond the predilated segment and the position is stable. How do you deploy?",
        options: [
          {
            text: "Inflate over 3–5 s to 12–14 atm and hold, keeping the inflation going while the pressure keeps falling",
            best: true,
            feedback: "Brilakis's deployment: 12–14 atm, and the longer the inflation the better the expansion; a creeping fall in pressure means the stent is still opening.",
          },
          {
            text: "Inflate quickly to nominal and deflate the moment it is reached",
            feedback: "Too brief: the longer the inflation, the better the expansion, and a continuing fall in pressure shows the stent is still opening.",
            stateDelta: { stability: -5, flags: ["short-inflation"] },
          },
          {
            text: "Take the stent balloon itself to 24 atm to avoid a separate post-dilatation",
            feedback: "The Oxford handbook warns that high pressure on the stent balloon can injure the vessel beyond the stent edges; high-pressure work is for a shorter non-compliant balloon.",
            stateDelta: { stability: -10, flags: ["edge-injury"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The stent is deployed. What next?",
        variants: [{ flag: "short-inflation", info: "The enhanced stent image shows a mild waist in the middle third." }],
        options: [
          {
            text: "Post-dilate at 20 atm or more with a shorter non-compliant balloon inside the stent, then a 3.5 mm balloon proximally; confirm expansion with enhanced stent visualisation and IVUS or OCT, then two views",
            best: true,
            feedback: "Brilakis's default after deployment, with proximal optimisation in a tapering vessel. In calcified lesions he recommends imaging after stenting to confirm expansion, helped by enhanced stent visualisation. Check the result in two orthogonal views with the wire still across, then repeat them with the wire out for the final judgement (Oxford handbook).",
          },
          {
            text: "Accept the result because the angiogram looks good",
            feedback: "Angiography alone can miss underexpansion in calcium; Brilakis recommends imaging before and after stenting in calcified lesions, plus enhanced stent visualisation.",
            stateDelta: { flags: ["unchecked-expansion"] },
          },
          {
            text: "Post-dilate at 24 atm with a non-compliant balloon longer than the stent",
            feedback: "The balloon ends outside the stent injure the edges: a cause of edge dissection.",
            stateDelta: { stability: -10, flags: ["edge-injury"] },
          },
        ],
      },
    ],
    outcome:
      "With the lesion modified before stenting, support escalated stepwise instead of by force, and the stent deployed, post-dilated and checked, the RCA is fully expanded with a residual stenosis well under 20% and TIMI 3 flow. She goes home the next day.",
    outcomeVariants: [
      { flag: "underexpanded", text: "The stent was placed in an undilated lesion and remains underexpanded despite high-pressure post-dilatation; she needs further treatment for a stent failure that should not have happened." },
      { flag: "rupture", text: "The balloon rupture was handled in the right order, but it was avoidable: calcium should be modified rather than overpowered." },
      { flag: "stent-stripped", text: "The stent came off its balloon at the guide tip and had to be retrieved (cm-equipment-loss), lengthening the case considerably." },
      { flag: "geographic-miss", text: "Follow-up imaging shows restenosis at the uncovered predilated edge: a geographic miss." },
      { flag: "edge-injury", text: "An edge dissection beyond the stent needed an additional stent." },
    ],
    learningPoints: [
      "Size the predilatation balloon 1:1 to the distal reference: full expansion is the gate to stenting.",
      "A waist that persists after prolonged high-pressure non-compliant inflations means stop and modify; never stent an undilated calcified lesion, and never go beyond the balloon's rated pressure.",
      "Balloon rupture: suction, remove, aspirate the guide, then angiogram.",
      "When a stent stops, do not push: re-seat the guide and add support from Brilakis's five groups (for example forward push, buddy wire, deep breath, guide extension or anchor).",
      "Size the stent to the distal reference, cover every injured segment, deploy at 12–14 atm and hold while the pressure falls.",
      "Post-dilate at 20 atm or more with a shorter non-compliant balloon, then confirm expansion with enhanced stent visualisation or imaging.",
    ],
    refs: [...BOOKS, "zhang-doca-tri-2012"],
  },
  {
    id: "pm-prep-and-stent-case-lcx-flow",
    title: "NSTEMI culprit: flow, the decision to stent, and the edges",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 9.2, 9.7-9.8, 10.1-10.2 and 20.10; Oxford Handbook, chapter 8 (the PCI procedure); REC-CAGEFREE I",
    },
    summary: "An NSTEMI culprit in the circumflex: wire position, slow flow after predilatation, whether to stent, stent versus drug-coated balloon, positioning against cardiac motion, and an edge dissection.",
    presentation:
      "A 64-year-old man is admitted with an NSTEMI. Angiography from the right radial shows a 90% hazy mid-circumflex stenosis with a small filling defect, distal reference 3.0 mm, and moderate non-obstructive disease elsewhere. He has no bleeding history, takes his medicines reliably and has no surgery planned. PCI of the circumflex is under way with a 6 Fr EBU guide.",
    findings: ["Blood pressure 128/76 mmHg, sinus rhythm 78/min", "Pain-free on arrival in the lab", "Troponin raised", "Loaded with aspirin and a P2Y12 inhibitor; heparin given"],
    steps: [
      {
        id: "s1",
        prompt: "The wire has crossed. A check injection shows its tip curled in a small obtuse marginal branch 1 cm beyond the lesion.",
        options: [
          {
            text: "Reposition the wire into the distal circumflex, several centimetres beyond the lesion, before any balloon",
            best: true,
            feedback: "Brilakis's first balloon step: the wire must be well beyond the lesion and out of small branches, especially branches close to the lesion, where a balloon can follow it and perforate.",
          },
          {
            text: "Predilate now; the wire position will not matter once the balloon is across",
            next: "c-branch",
            feedback: "A balloon can track into a small branch near the lesion during dilatation.",
            stateDelta: { stability: -10, flags: ["branch-injury"] },
          },
        ],
      },
      {
        id: "c-branch",
        kind: "consequence",
        prompt: "After the inflation there is a small contrast stain at the tip of the marginal branch. The patient is stable.",
        options: [
          {
            text: "Pull the wire tip out of the branch, keep the main wire across, and manage the distal stain as a wire perforation (cm-perforation)",
            best: true,
            feedback: "Recognise it, withdraw the tip from the branch and follow the perforation pathway; prevention would have been an optimal distal wire position.",
          },
          {
            text: "Carry on with the stent and look again at the end",
            feedback: "An unaddressed distal perforation can progress to tamponade.",
            stateDelta: { stability: -15, flags: ["perforation-ignored"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "A 3.0 × 12 mm balloon, sized to the distal reference, opens fully at 14 atm. The next injection shows TIMI 1 flow beyond the lesion, without any dissection in two views. The patient has chest pain, with new ST elevation in the lateral leads and ST depression in V1–V3.",
        options: [
          {
            text: "Do not stent yet: give intracoronary vasodilators, consider thrombectomy, and reassess flow",
            best: true,
            feedback: "Poor flow without dissection is first on Brilakis's do-not-stent list; stenting into no-reflow worsens it. His sequence gives vasodilators and considers thrombectomy first.",
          },
          {
            text: "Stent now to open it up",
            next: "c-stent-no-reflow",
            feedback: "A stent fixes flow limited by dissection, not flow limited by embolised debris or microvascular obstruction.",
            stateDelta: { stability: -15, flags: ["stented-no-reflow"] },
          },
          {
            text: "Pull the wire out so the vessel can settle, then recross",
            feedback: "Giving up wire position in an unstable vessel removes your route to any treatment.",
            stateDelta: { stability: -10, flags: ["wire-removed"] },
          },
        ],
      },
      {
        id: "c-stent-no-reflow",
        kind: "consequence",
        prompt: "After the stent, flow is now TIMI 0–1 and the lateral ST elevation has increased.",
        options: [
          {
            text: "Treat no-reflow: intracoronary vasodilators delivered distally, thrombectomy if thrombus, support the blood pressure",
            best: true,
            feedback: "The no-reflow pathway is taught in cm-flow-embolism; the lesson is that it should have been treated before the stent.",
          },
          {
            text: "Post-dilate the stent at high pressure to push the debris out",
            feedback: "High-pressure post-dilatation is itself a cause of distal embolisation; concern about embolisation is one of Brilakis's reasons to skip it.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After vasodilators, flow is TIMI 3 and the pain settles. The lesion has a 30% residual narrowing without dissection. A colleague suggests a drug-coated balloon instead of a stent ‘to avoid metal’. What do you choose?",
        options: [
          {
            text: "A drug-eluting stent: in de novo non-complex lesions, REC-CAGEFREE I did not show a coated balloon to be non-inferior",
            best: true,
            feedback: "Stents prevent recoil and acute closure, especially with plaque rupture and thrombus, and reduce restenosis. In a 3.0 mm de novo lesion the newer trial evidence favours a stent; coated balloons are established for in-stent restenosis and have non-inferiority data in vessels under 3 mm.",
          },
          {
            text: "A drug-coated balloon, because trials show it equals a stent in all de novo lesions",
            feedback: "BASKET-SMALL 2 was in vessels under 3 mm; REC-CAGEFREE I, in de novo non-complex lesions of any size, missed non-inferiority at 24 months.",
            stateDelta: { flags: ["dcb-misapplied"] },
          },
          {
            text: "Stop here: the balloon result is good enough without any further treatment",
            feedback: "A ruptured, thrombotic ACS plaque is exactly where a stent prevents recoil and acute closure. Balloon-only end points are reserved for specific situations, such as an RCA STEMI culprit when the left coronary anatomy is unknown.",
            stateDelta: { stability: -5, flags: ["no-stent"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "A 3.0 mm stent long enough for the predilated segment is at the lesion, but it swings several millimetres with each heartbeat.",
        options: [
          {
            text: "Wait for a stable position against the landmarks and deploy only then; consider rapid pacing if the motion stays excessive",
            best: true,
            feedback: "Brilakis: deploy only once the position is right; rapid pacing during deployment can reduce the risk of landing a moving stent in the wrong place.",
          },
          {
            text: "Deploy straight away; the stent is long enough to cover any movement",
            feedback: "Cardiac motion is a listed cause of suboptimal stent placement, and incomplete coverage then needs another stent.",
            stateDelta: { stability: -5, flags: ["misplaced"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After deployment at 14 atm, the check injection shows a linear lucency just beyond the distal stent edge, with TIMI 2 flow.",
        variants: [{ flag: "misplaced", info: "The stent landed 3 mm proximal to its planned position." }],
        options: [
          {
            text: "Treat it as a significant distal edge dissection and cover it with another stent",
            best: true,
            feedback: "Lucency at the edge with slowed flow is how Brilakis describes a significant edge dissection; the treatment is an additional stent.",
          },
          {
            text: "Post-dilate the stent at 24 atm to seal the edge",
            next: "c-edge",
            feedback: "Very high pressure is one of the causes of edge dissection, not its treatment.",
            stateDelta: { stability: -10, flags: ["edge-worse"] },
          },
          {
            text: "Accept it: edge lucencies are always spasm",
            next: "c-edge",
            feedback: "Spasm is possible and nitroglycerin is reasonable, but a lucency with slow flow should not be accepted without treatment.",
            stateDelta: { stability: -10, flags: ["edge-worse"] },
          },
        ],
      },
      {
        id: "c-edge",
        kind: "consequence",
        prompt: "The lucency has lengthened and flow is now TIMI 1, with recurrent chest pain.",
        options: [
          {
            text: "Keep the wire in the true lumen and stent the dissection now",
            best: true,
            feedback: "With the wire still across, the dissection can be covered; this is why the wire stays in until the result is right.",
          },
          {
            text: "Remove the wire and take orthogonal views to define the dissection",
            feedback: "Without a wire across a dissection, recrossing may be impossible.",
            stateDelta: { stability: -20, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The edge is covered and flow is TIMI 3. How do you finish?",
        options: [
          {
            text: "Aspirate, check the guide, give nitroglycerin, check the stents on enhanced visualisation, take two orthogonal views with the wire in, then withdraw it and repeat the views",
            best: true,
            feedback: "Brilakis's step 13 sequence with the wire still across, so any problem can still be fixed, then the Oxford handbook's final assessment: at least two orthogonal views with the wire out, success being a residual stenosis under 20%.",
          },
          {
            text: "One view with the wire still in, then finish, since flow is normal",
            feedback: "One view can hide a residual stenosis or dissection, and the final judgement needs views with the wire out, because the wire distorts the vessel and creates artefacts.",
            stateDelta: { flags: ["single-view"] },
          },
        ],
      },
    ],
    outcome: "Treating the flow before stenting, choosing a stent for a thrombotic de novo culprit, deploying only in a stable position, and covering the edge dissection with the wire still across leave a widely patent circumflex with TIMI 3 flow.",
    outcomeVariants: [
      { flag: "stented-no-reflow", text: "Stenting into slow flow converted it into no-reflow and a larger infarct; the flow should have been treated first." },
      { flag: "perforation-ignored", text: "A small effusion from the distal wire perforation is found on the echocardiogram the next morning and needs observation in the coronary care unit." },
      { flag: "wire-lost", text: "Recrossing the dissected circumflex took 40 minutes and much more contrast." },
      { flag: "dcb-misapplied", text: "The coated balloon was chosen on a misreading of the trials; for a de novo non-complex lesion the stronger evidence favours a stent." },
    ],
    learningPoints: [
      "Confirm the wire is well beyond the lesion and out of small branches before the first balloon.",
      "Poor flow after predilatation without dissection: vasodilators and consider thrombectomy before any stent.",
      "Stents prevent recoil and acute closure in ruptured, thrombotic plaques; in de novo non-complex lesions current evidence prefers a stent to a coated balloon.",
      "Deploy only in a stable position; rapid pacing can help when cardiac motion is excessive.",
      "Edge lucency with slow flow: cover it with another stent while the wire is still across.",
      "Finish with the step 13 sequence and two orthogonal views with the wire in, then repeat them with the wire withdrawn.",
    ],
    refs: [...BOOKS, "gao-rec-cagefree1-2024", "basket-small2-2018"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

const SRC_9 = [{ book: "brilakis-pci" as const, loc: "9.7" }];
const SRC_10 = [{ book: "brilakis-pci" as const, loc: "10.2" }];

export const tips: LabTip[] = [
  {
    id: "pci-prep-wire-check-before-balloon",
    lab: "pci",
    when: { phase: ["lesion-prep"] },
    title: "Check the wire tip before the first balloon",
    text: "Inject and confirm the wire runs through the lesion and several centimetres beyond it, but not into a small branch, least of all one close to the lesion where the balloon could follow it. Reposition it now if needed.",
    tone: "do",
    lessonId: "pm-prep-and-stent-prep-why",
    sources: [{ book: "brilakis-pci", loc: "9.3" }, { book: "brilakis-pci", loc: "9.7" }, { book: "oxford-cath", loc: "ch 8: Angioplasty guide wires" }],
    refs: BOOKS,
  },
  {
    id: "pci-prep-clear-the-guide",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Back-bleed, aspirate, then fill with contrast",
    text: "Before each device and after each one comes out, let the Y-connector back-bleed and aspirate the guide before filling it with contrast. Large and plaque modification balloons can draw air, thrombus or plaque into the guide as they are withdrawn.",
    tone: "do",
    lessonId: "pm-prep-and-stent-prep-why",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-size-and-length",
    lab: "pci",
    when: { phase: ["lesion-prep"] },
    title: "Predilatation balloon: 1:1 to the distal reference, shorter than the lesion",
    text: "Size the balloon 1:1 to the distal reference so its expansion tells you whether the lesion is ready, and keep it shorter than the lesion so normal vessel is not injured. For a lesion too tight to enter, start with a balloon of 1.5 mm or less.",
    tone: "do",
    lessonId: "pm-prep-and-stent-balloon-choose",
    sources: [...SRC_9, { book: "oxford-cath", loc: "ch 8: Angioplasty balloons" }],
    refs: BOOKS,
  },
  {
    id: "pci-balloon-prep-visible",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Prepare with labelled diluted contrast and no air",
    text: "Fill the syringe with diluted contrast (usually half and half), label it, and pull the air out with the plunger pointing up before connecting the indeflator. If an inflated balloon cannot be seen, it was filled with saline or still holds air: take it out and prepare it again.",
    tone: "do",
    lessonId: "pm-prep-and-stent-balloon-choose",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-open-the-valve",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Open the valve, never force the device",
    text: "Have the wire held still, open a standard haemostatic valve before passing the balloon or stent, and close it afterwards. Forcing a device through a tight valve deforms it, and cutting balloons are especially vulnerable.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-balloon-choose",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-inflation-numbers",
    lab: "pci",
    when: { phase: ["lesion-prep"] },
    title: "Inflate over 3–5 s, hold 10–20 s",
    text: "Reach the target pressure under fluoroscopy in about 3–5 seconds and hold for 10–20 seconds: usually 12–20 atm for a non-compliant balloon sized 1:1 or less, 12–14 atm for a compliant one. A cutting balloon goes up 5 seconds per atm, to 6–8 atm and never above 12 atm.",
    tone: "do",
    lessonId: "pm-prep-and-stent-balloon-inflate",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-rupture-suction",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"] },
    title: "If the pressure falls suddenly: suction first",
    text: "Keep an eye on the indeflator during every inflation. If its pressure falls suddenly, the balloon has probably ruptured: apply suction at once so contrast is not jetted through the tear, then remove the balloon, aspirate the guide for air, and take an angiogram; if there is a perforation, inflate a new balloon at the site.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-balloon-inflate",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-watermelon",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"] },
    title: "If the balloon slips during inflation: deflate",
    text: "Inflate steadily rather than fast, and hold the balloon with gentle traction or push if it starts to creep. If it squirts forwards or backwards, deflate immediately to spare normal vessel, then retry slower and at lower pressure, with a longer balloon, one or more buddy wires, or a plaque modification balloon.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-balloon-inflate",
    sources: [...SRC_9, { book: "oxford-cath", loc: "ch 8: Angioplasty balloons" }],
    refs: BOOKS,
  },
  {
    id: "pci-balloon-waist-stop",
    lab: "pci",
    when: { event: ["balloon-undilatable"] },
    title: "A waist that will not yield: do not stent",
    text: "A waist that persists on a properly sized non-compliant balloon despite longer inflations and higher pressure means the lesion is balloon-undilatable. Do not stent it. Never take any balloon past its rated burst pressure: pressures above 20 atm raise the risk of rupture, and only a non-compliant balloon, within its own compliance chart, is taken higher (Brilakis: up to 20–26 atm, often 26–28 atm in undilatable lesions). Image the lesion and follow the undilatable-lesion algorithm.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-balloon-inflate",
    sources: [...SRC_9, { book: "brilakis-pci", loc: "9.9" }, { book: "brilakis-pci", loc: "10.1" }, { book: "brilakis-pci", loc: "23.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-balloon-withdraw-deflated",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"] },
    title: "Fully deflated before you pull, and watch the guide",
    text: "Lock the indeflator on vacuum, confirm full deflation on fluoroscopy, then withdraw while watching the guide. If the guide is being sucked into the artery, stop, partly disengage it and use the independent-hand technique to ease it back as the balloon comes out.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-balloon-inflate",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-delivery-marker-then-screen",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Push blind only to the shaft marker",
    text: "Advance the device without fluoroscopy until the shaft marker reaches the Y-connector (the first marker for a 90 cm guide, the second for a 100 cm guide), then screen it to the guide tip and out to the lesion.",
    tone: "do",
    lessonId: "pm-prep-and-stent-delivery",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-delivery-small-bites",
    lab: "pci",
    when: { event: ["balloon-uncrossable", "stent-uncrossable"] },
    title: "Small bites, not force",
    text: "Advance in short movements while watching the guide and the distal wire, and ease off as soon as either moves. Forceful pushing kinks shafts, loses guide and wire position, and deforms stents.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-delivery",
    sources: [...SRC_9, ...SRC_10],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-delivery-old-stent-rewire",
    lab: "pci",
    when: { event: ["balloon-uncrossable", "stent-uncrossable"] },
    title: "Stuck exactly at an old stent: suspect a sub-strut wire",
    text: "If a device stops at the edge of a previously placed stent, the wire may have passed under a strut. Withdraw it and recross the stent with a knuckled wire tip rather than forcing the device, which can deform the old stent lengthways.",
    tone: "bailout",
    lessonId: "pm-prep-and-stent-delivery",
    sources: [...SRC_9, ...SRC_10, { book: "brilakis-pci", loc: "22.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-delivery-withdraw-coaxial",
    lab: "pci",
    when: { event: ["stent-uncrossable", "stent-loss"] },
    title: "Pull a stuck stent back only through a coaxial guide",
    text: "If a stent will not advance, do not push its proximal end out of the guide. Make the guide coaxial before withdrawing it, and never pull hard against resistance into the guide or a guide extension.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-delivery",
    sources: [...SRC_10, { book: "brilakis-pci", loc: "27.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-five-levers",
    lab: "pci",
    when: { event: ["poor-guide-support", "balloon-uncrossable", "stent-uncrossable"] },
    title: "Device will not go: work through five groups",
    text: "Guide (size, shape, access, forward push, deep intubation, guide extension, anchor); wire (buddy, support, partial withdrawal, buddy balloon, deep wiring); proximal vessel and lesion (more preparation); device (smaller, compliant or new balloon; shorter, thinner-strut stent); other (deep breath, lubricant). Brilakis gives no fixed order, and measures can be combined.",
    tone: "do",
    lessonId: "pm-prep-and-stent-support",
    sources: [...SRC_9, ...SRC_10, { book: "brilakis-pci", loc: "23.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-extension-wedge",
    lab: "pci",
    when: { pressure: ["damped"], event: ["stent-uncrossable", "balloon-uncrossable", "poor-guide-support"] },
    title: "Guide extension wedged: do not inject",
    text: "A damped trace with a guide extension deep in the vessel means it is wedged. Do not inject through the guide while it is wedged: a hydraulic dissection or other injury of the proximal artery is a real danger.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-support",
    sources: [{ book: "brilakis-pci", loc: "23.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-side-branch-anchor",
    lab: "pci",
    when: { event: ["poor-guide-support", "balloon-uncrossable", "stent-uncrossable"] },
    title: "Side-branch anchor: 1:1, low pressure, long balloon",
    text: "Put a workhorse wire into a proximal branch (conus or acute marginal for the RCA, diagonal for the LAD) and inflate a balloon sized 1:1 to it at low pressure; a long balloon with its hydrophilic coating wiped off grips best. Watch for chest pain, ischaemia and arrhythmia, and deflate intermittently if needed.",
    tone: "do",
    lessonId: "pm-prep-and-stent-support",
    sources: [...SRC_9, { book: "brilakis-pci", loc: "23.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-distal-anchor-out",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable"] },
    title: "Distal anchor: take the second wire out before deploying",
    text: "Once the stent has ridden up the pinned wire into position, deflate and withdraw the anchor balloon and its wire before deploying, so the second wire is not trapped behind the stent.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-support",
    sources: SRC_9,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-buddy-wire",
    lab: "pci",
    when: { event: ["stent-uncrossable", "balloon-uncrossable", "poor-guide-support"] },
    title: "Add a buddy wire",
    text: "One of the simplest fixes: a second (or third) wire adds guide support and straightens the vessel. Partly withdrawing the main wire while advancing, or a balloon on the buddy wire to deflect the stent, can also help.",
    tone: "do",
    lessonId: "pm-prep-and-stent-support",
    sources: [...SRC_9, ...SRC_10],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-support-deep-breath",
    lab: "pci",
    when: { event: ["stent-uncrossable", "balloon-uncrossable"] },
    title: "Ask for a deep breath",
    text: "Asking the patient to breathe in deeply while you advance can help the device across, possibly by straightening the arteries or changing how the guide sits.",
    tone: "do",
    lessonId: "pm-prep-and-stent-support",
    sources: [...SRC_9, ...SRC_10],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stent-not-into-no-reflow",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["slow-flow", "no-reflow"] },
    title: "Poor flow without dissection: do not stent yet",
    text: "Stenting into no-reflow makes it worse. Give vasodilators and consider thrombectomy, then reassess. If a dissection is causing the poor flow, a stent is the treatment.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-when",
    sources: [{ book: "brilakis-pci", loc: "10.1" }, { book: "brilakis-pci", loc: "9.8" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stent-check-dapt-and-surgery",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Can this patient take a stent?",
    text: "Before committing to a stent, check bleeding history and risk and how reliably the patient takes medication, and plan the dual antiplatelet duration: high bleeding risk is now met with a drug-eluting stent and a short course, not by avoiding the stent. If non-cardiac surgery is due soon, decide with the surgeon whether PCI or surgery should wait.",
    tone: "caution",
    lessonId: "pm-prep-and-stent-when",
    sources: [{ book: "brilakis-pci", loc: "1.10" }, { book: "brilakis-pci", loc: "10.2" }],
    refs: ["brilakis-manual-pci", "esc-revasc-2018", "esc-ncs-2022", "urban-leaders-free-2015", "valgimigli-master-dapt-2021"],
  },
  {
    id: "pci-stent-size-distal",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Size the stent to the distal reference",
    text: "Match the stent diameter to the distal reference (or 85% of media-to-media on imaging), then post-dilate the proximal part to the proximal reference. Sizing to the proximal vessel risks distal dissection, perforation and carina shift; check the platform's post-dilatation limit.",
    tone: "do",
    lessonId: "pm-prep-and-stent-deploy",
    sources: SRC_10,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stent-cover-injured-segment",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Cover every segment the balloon touched",
    text: "Choose a length that covers the lesion and all vessel injured during preparation, measured from the predilatation balloon or an imaging pullback; anything left uncovered is a geographic miss. Through tortuous calcified vessels, two shorter stents may deliver better than one long one.",
    tone: "do",
    lessonId: "pm-prep-and-stent-deploy",
    sources: SRC_10,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stent-cardiac-motion",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Deploy only when the position is right",
    text: "Movement of the patient, the operator or the heart misplaces stents. Wait for a stable position against your landmarks; if the stent swings excessively with each beat, rapid pacing during deployment can reduce the risk.",
    tone: "do",
    lessonId: "pm-prep-and-stent-deploy",
    sources: SRC_10,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stent-hold-the-inflation",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Deploy at 12–14 atm and keep holding",
    text: "Inflate over 3–5 seconds to 12–14 atm (never below nominal). The longer the inflation, the better the expansion: if the indeflator pressure keeps falling, the stent is still opening, so keep inflating.",
    tone: "do",
    lessonId: "pm-prep-and-stent-deploy",
    sources: [...SRC_10, { book: "oxford-cath", loc: "ch 8: The PCI procedure" }],
    refs: BOOKS,
  },
  {
    id: "pci-optimise-nc-postdilate",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "Post-dilate at 20 atm or more with a shorter NC balloon",
    text: "After deployment, post-dilate at high pressure with a non-compliant balloon shorter than the stent, kept inside it. Skip this only if imaging shows excellent expansion, embolisation is a concern, or a large jailed branch could be compromised.",
    tone: "do",
    lessonId: "pm-prep-and-stent-result",
    sources: [...SRC_10, { book: "oxford-cath", loc: "ch 8: The PCI procedure" }],
    refs: BOOKS,
  },
  {
    id: "pci-optimise-show-the-stent",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "Look at the stent itself",
    text: "Use enhanced stent visualisation (or imaging) to judge expansion, to check that a post-dilatation balloon sits inside the stent, and to confirm side-branch ostium coverage. It also saves contrast.",
    tone: "do",
    lessonId: "pm-prep-and-stent-result",
    sources: [...SRC_10, { book: "brilakis-pci", loc: "16.2" }, { book: "brilakis-pci", loc: "28.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-optimise-edge-dissection",
    lab: "pci",
    when: { phase: ["stent", "optimise", "complication"], event: ["dissection"] },
    title: "Edge lucency with slow flow: cover it",
    text: "A lucency at the stent edge, especially with slow flow, is an edge dissection until shown otherwise. Keep the wire across and place an additional stent for a significant dissection; do not try to fix it with more pressure.",
    tone: "bailout",
    lessonId: "pm-prep-and-stent-result",
    sources: SRC_10,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-optimise-side-branch-loss",
    lab: "pci",
    when: { event: ["side-branch-compromise"] },
    title: "Side branch lost after stenting",
    text: "Slow or absent flow in a jailed branch comes from the ostium being covered or from plaque and carina shift. Treat it with balloon angioplasty and, if needed, a stent in the branch; next time wire important branches and use proximal optimisation before the carina.",
    tone: "bailout",
    lessonId: "pm-prep-and-stent-result",
    sources: SRC_10,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-optimise-final-views",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Final result: two orthogonal views, wire in then out",
    text: "Check the result in at least two orthogonal projections with the wire still across, so an edge dissection or other problem can still be treated. Then withdraw the wire and repeat the views: the wire straightens the vessel and creates artefacts, so the final residual stenosis is judged wire-out. Angiographic success is a final diameter stenosis under 20%.",
    tone: "do",
    lessonId: "pm-prep-and-stent-result",
    sources: [{ book: "oxford-cath", loc: "ch 8: The PCI procedure" }, ...SRC_10],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "gao-rec-cagefree1-2024",
    kind: "trial",
    citation:
      "Gao C, He X, Ouyang F, et al. Drug-coated balloon angioplasty with rescue stenting versus intended stenting for the treatment of patients with de novo coronary artery lesions (REC-CAGEFREE I): an open-label, randomised, non-inferiority trial. Lancet. 2024;404:1040–1050.",
    url: "https://doi.org/10.1016/S0140-6736(24)01594-0",
    note: "PMID: 39236727. Checked on PubMed: authors, title, journal, year, volume 404, issue 10457, pages 1040–1050; abstract read (2,272 patients, rescue DES in 9.4%, DoCE at 24 months 6.4% vs 3.4%, non-inferiority not met).",
    verified: true,
  },
  {
    id: "yeh-agent-ide-2024",
    kind: "trial",
    citation:
      "Yeh RW, Shlofmitz R, Moses J, et al. Paclitaxel-coated balloon vs uncoated balloon for coronary in-stent restenosis: the AGENT IDE randomized clinical trial. JAMA. 2024;331:1015–1024.",
    url: "https://doi.org/10.1001/jama.2024.1361",
    note: "PMID: 38460161; PMC10924708. Checked on PubMed: authors, title, journal, year, volume 331, issue 12, pages 1015–1024; abstract read (600 patients, target lesion failure at 1 year 17.9% vs 28.6%, HR 0.59, superiority met).",
    verified: true,
  },
  {
    id: "zhang-doca-tri-2012",
    kind: "trial",
    citation:
      "Zhang Q, Zhang RY, Kirtane AJ, et al. The utility of a 5-in-6 double catheter technique in treating complex coronary lesions via transradial approach: the DOCA-TRI study. EuroIntervention. 2012;8:848–854.",
    url: "https://doi.org/10.4244/EIJV8I7A128",
    note: "PMID: 23171804. Checked on PubMed: authors, title, journal, year, volume 8, issue 7, pages 848–854; abstract read (187 patients with failed stent or balloon delivery after wiring, randomised to a 5-in-6 double catheter or buddy wire/balloon anchoring; technical success 97.9% vs 39.8%; 1-year MACE-free survival 89.4% vs 84.9%, p=0.36).",
    verified: true,
  },
  {
    id: "urban-leaders-free-2015",
    kind: "trial",
    citation:
      "Urban P, Meredith IT, Abizaid A, et al. Polymer-free drug-coated coronary stents in patients at high bleeding risk. N Engl J Med. 2015;373:2038–2047.",
    url: "https://doi.org/10.1056/NEJMoa1503943",
    note: "PMID: 26466021. Checked on PubMed: authors, title, journal, year, volume 373, issue 21, pages 2038–2047; abstract read (LEADERS FREE: 2,466 high-bleeding-risk patients, all on 1 month of DAPT; drug-coated stent superior to bare-metal stent for the safety end point, 9.4% vs 12.9%, and for target-lesion revascularisation, 5.1% vs 9.8%).",
    verified: true,
  },
  {
    id: "valgimigli-master-dapt-2021",
    kind: "trial",
    citation:
      "Valgimigli M, Frigoli E, Heg D, et al. Dual antiplatelet therapy after PCI in patients at high bleeding risk. N Engl J Med. 2021;385:1643–1655.",
    url: "https://doi.org/10.1056/NEJMoa2108749",
    note: "PMID: 34449185. Checked on PubMed: authors, title, journal, year, volume 385, issue 18, pages 1643–1655; abstract read (MASTER DAPT: high-bleeding-risk patients one month after a biodegradable-polymer sirolimus-eluting stent; stopping DAPT was non-inferior for net adverse clinical events, 7.5% vs 7.7%, and caused less bleeding, 6.5% vs 9.4%).",
    verified: true,
  },
  {
    id: "frobert-taste-2013",
    kind: "trial",
    citation:
      "Fröbert O, Lagerqvist B, Olivecrona GK, et al. Thrombus aspiration during ST-segment elevation myocardial infarction. N Engl J Med. 2013;369:1587–1597.",
    url: "https://doi.org/10.1056/NEJMoa1308789",
    note: "PMID: 23991656. Checked on PubMed: authors, title, journal, year, volume 369, issue 17, pages 1587–1597; abstract read (TASTE: 7,244 STEMI patients; routine aspiration did not reduce 30-day mortality, 2.8% vs 3.0%).",
    verified: true,
  },
  {
    id: "brilakis-diva-2018",
    kind: "trial",
    citation:
      "Brilakis ES, Edson R, Bhatt DL, et al. Drug-eluting stents versus bare-metal stents in saphenous vein grafts: a double-blind, randomised trial. Lancet. 2018;391:1997–2007.",
    url: "https://doi.org/10.1016/S0140-6736(18)30801-8",
    note: "PMID: 29759512; PMC6402785. Checked on PubMed: authors, title, journal, year, volume 391, issue 10134, pages 1997–2007; abstract read (DIVA: 597 patients with de novo vein-graft lesions; target vessel failure at 12 months 17% vs 19%, no significant difference).",
    verified: true,
  },
];
