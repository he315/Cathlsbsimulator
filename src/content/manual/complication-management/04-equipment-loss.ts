// Module cm-equipment-loss: equipment loss and entrapment (manual curriculum, track complication-management).
// Sources: Brilakis, Manual of PCI: chapter 27 (27.1 stent loss or entrapment, 27.2 guidewire entrapment and fracture,
// 27.3 balloon entrapment and fracture, 27.4 microcatheter entrapment and fracture) and chapter 30 (30.3 guide catheter
// extensions, 30.6 microcatheters, 30.9 trapping balloons, 30.10 the burr, 30.18 complication-management kit and
// snares, 30.23 the complex PCI cart), with the related passages in 5.3 and 5.7 (iliac stents dislodged by guides,
// snaring a kinked catheter), 8.6 and 8.9 (restrained wire tip, circumcision), 9.7 (balloon shaft kinks, failure to
// deflate), 10.2 (stent delivery and stent loss), 15.1 (ostial stents protruding into the aorta), 16.2 (jailed wires),
// 18.8 (buddy wire with a filter), 19.9 (burr entrapment, Rotawire fracture), 23.1 and 23.2 (microcatheter rotation,
// guide extension collar, cutting balloons), 25.2 (entrapment as a cause of acute closure) and 29.2 (radial spasm);
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention: ch 4 (catheter knotting), ch 8 (intracoronary
// stents, intravascular ultrasound, rotational atherectomy) and ch 10 (limb ischaemia from lost equipment).
// New references (PubMed-checked) are in `refs` below.
// Every claim is listed with its page in docs/curriculum/evidence/cm-equipment-loss.md.
// Neighbouring modules: cp-calcium (burr entrapment step by step), cp-bifurcation-provisional (jailing a side-branch
// wire and removing it), cp-cto-retrograde (interlocking over an externalised wire, snaring the retrograde wire),
// pm-wiring (removing a microcatheter over a short wire: trapping, extension, circumcision), pm-engaging (the kinked
// catheter algorithm), pm-prep-and-stent (stent delivery and support), cm-principles-closure (entrapment as one of the
// eight causes of acute closure). Academy lessons this module builds on: comp-equipment (comp-equip-stent-loss,
// comp-equip-wire-burr-guide, comp-equip-balloon-snare) and bed-biopsy-retrieval (bed-foreign-body).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "cm-equipment-loss",
  title: "Equipment loss and entrapment",
  stage: 5,
  summary:
    "What to do when hardware stays behind: a stent stripped from its balloon, a wire that will not come back or has broken, a balloon that is stuck, will not deflate or has snapped, a microcatheter caught in calcium, and the snares and improvised tools that bring them out. Each problem is taught as Brilakis's algorithm, one decision at a time, with the prevention that makes the algorithm unnecessary.",
  objectives: [
    "Explain why entrapment is graver than loss, and name the procedural habits that cause each (poor preparation, direct stenting, small guides, forceful advancement and withdrawal, guide extension collars, devices through fresh stents).",
    "Work through the stent-loss algorithm: locate the stent, decide whether it must come out, check whether the wire still runs through it, and then retrieve (small balloon, snare, wire twirling), deploy, crush or leave it.",
    "Free an entrapped guidewire without breaking it, and manage a fracture according to whether the coil has unravelled, where the fragments lie and whether they can be covered with a stent.",
    "Run the three balloon algorithms (entrapment, failure to deflate, shaft fracture) and the microcatheter equivalents, including trapping a fragment inside the guide.",
    "Choose and size a snare for the coronary tree or the aorta, load and close it correctly, and build one from a wire and a catheter or a guide extension when none is on the shelf.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cm-equipment-loss-stent",
      title: "Stent loss: prevent it, then follow the algorithm",
      minutes: 18,
      topics: ["comp-stent-loss"],
      sources: [
        B("27.1"),
        B("10.2"),
        B("30.3"),
        B("23.1"),
        B("5.3"),
        B("15.1"),
        B("25.2"),
        B("30.7"),
        B("30.18"),
        B("19.9"),
        O("ch 8: Intracoronary stents"),
      ],
      refs: [...BOOKS, "brilakis-stent-loss-2005", "iturbe-device-loss-2012", "eggebrecht-stent-retrieval-2000", "abdel-wahab-rotaxus-2013"],
      blocks: [
        {
          kind: "p",
          text: "A lost stent is one that has come off its delivery balloon before it was expanded where you meant it to be. It can block the artery, perforate it, or travel into the systemic circulation, including the brain. Brilakis separates loss from **entrapment** (the device is held fast in the patient), and calls entrapment the graver of the two, because it may need emergency surgery. The Academy lesson comp-equip-stent-loss lists the rescue techniques; this lesson takes you through Brilakis's decision sequence one branch at a time, with the details that decide whether each technique works.",
        },
        {
          kind: "p",
          text: "**How often, and how it ends.** In a review of 2,338 consecutive PCIs from Brilakis's group (Iturbe 2012), devices were lost in 9 cases (0.38%) and entrapped in 4 (0.17%). Every loss was managed percutaneously, whereas 3 of the 4 entrapments needed emergency surgical removal and bypass grafting. In an earlier series of 11,773 stent procedures (Brilakis 2005), stents were lost in 38 (0.32%), more often in calcified lesions and those with marked proximal angulation.",
        },
        { kind: "h", text: "Why stents come off" },
        {
          kind: "table",
          caption: "Causes of stent loss (Brilakis 27.1.1, 10.2.8.3.2, 10.2.8.4.3, 15.1, 23.1.3.1.1, 30.3.3, 30.3.4, 30.18.1.2)",
          head: ["Cause", "What the sources add"],
          rows: [
            ["Tortuous and calcified arteries", "Listed first by Brilakis. In his 2005 series loss was more frequent in calcified lesions and in those with marked proximal angulation"],
            ["Forceful advancement, and deformation of the stent", "The two causes Brilakis gives in his stent-delivery chapter (10.2.8.4.3): pushing hard through resistance, and bending the stent out of shape while advancing or withdrawing it"],
            ["Poor vessel preparation", "The stent is crumpled while you try to deliver it, then catches on the guide tip as you pull it back and is stripped off the balloon (the mechanism in Brilakis Fig. 27.1). Brilakis cites the ROTAXUS trial for stent loss in about 2% of lesions without atherectomy against 0.5% with rotational atherectomy (27.1.1; his calcium chapter quotes 2.5% of patients randomised to no atherectomy, 19.9.1). The trial itself found that routine atherectomy did not reduce late lumen loss and kept balloon dilatation with provisional atherectomy as the default, so the lesson is to prepare until the lesion expands, not to atherectomise every calcified lesion (cp-calcium)"],
            ["Direct stenting", "Listed without further explanation; the matching prevention is to avoid it, above all in tortuous and calcified vessels"],
            ["Small guides (for example 5 Fr)", "Too little room inside the guide to bring a deformed stent back in"],
            ["Forceful withdrawal against resistance", "Into the guide, or into a guide extension"],
            ["Guide catheter extensions", "The stent can catch the proximal collar on the way in, or be deformed at the distal tip on the way back, especially if already bent. Brilakis notes that stripping at the collar can happen around the subclavian curve in radial cases, and suggests extensions with a 40 cm rather than a 25 cm cylinder there (23.1.3.1.1). In his Fig. 30.34 the extension's tip folded back on itself while an undeployed stent was being pulled into it, caught the stent's proximal edge and bent it"],
            ["Passing a stent through a stent already deployed", "When a stent meets resistance at an earlier stent, the wire may have gone under one of its struts: rewire through that stent, ideally with a knuckle formed further back (10.2.8.3.2). Stent from distal to proximal where you can; if a proximal stent is already in place, stenting proximal to distal is still workable, helped by inserting a guide extension through the proximal stent (30.3.3)"],
            ["Delivering equipment through a collateral in retrograde CTO PCI", "Predisposes to both stent loss and wire entrapment (taught in cp-cto-retrograde)"],
            ["Bending the stent to get it round a corner", "Brilakis: may help it through tortuosity, but may also make loss more likely"],
            ["Szabo technique for ostial lesions", "May deform the stent or lose it (cp-ostial)"],
            ["Covered stents", "Of the two covered stents Brilakis describes, the one that is easier to deliver than the design built from two steel stents with a membrane between them can occasionally come off its balloon on the way to a perforation (30.18.1.2; cm-perforation)"],
          ],
        },
        {
          kind: "steps",
          title: "Prevention, step by step",
          items: [
            { title: "1. Prepare the lesion before the stent comes out of its packet", detail: "Avoid direct stenting in tortuous or calcified vessels. Prepare thoroughly, often with atherectomy for calcium, and use intravascular imaging to confirm that the lesion has expanded before you try to deliver the stent." },
            { title: "2. Plan the order", detail: "Stent distal lesions before proximal ones, so that later stents do not have to pass through earlier ones. Brilakis accepts that a distal need sometimes appears only after the proximal stent is in, for example a distal edge dissection." },
            { title: "3. Pick a guide with room", detail: "Avoid 5 Fr guides for complex lesions: a deformed stent needs space to be pulled back into the guide." },
            { title: "4. Use a guide extension for difficult delivery, and handle it carefully", detail: "Lay the extension's push rod under a towel beside the Y-connector so the wires do not wrap round it. If the stent meets resistance entering the extension, do not push: take the extension out and put it back in, avoiding wire wrap. Loading the stent into the extension outside the body and advancing both into the guide together can prevent dislodgement. Watch the stent on fluoroscopy as it enters the extension's proximal port. Keep the extension's proximal collar inside the guide." },
            { title: "5. Never force a stent forward", detail: "Watch the guide and the distal wire position while you advance or withdraw, and match your effort to what they tell you. Do not push the stent's proximal end out of the guide when the stent is not moving into the artery." },
            { title: "6. Withdraw only through a coaxial guide", detail: "If the stent must come back, line the guide up with the vessel first. After any failed attempt, inspect the withdrawn stent closely for damage before using it again." },
          ],
        },
        { kind: "tip", id: "pci-stentloss-prepare-first" },
        { kind: "tip", id: "pci-stentloss-guide-extension-collar" },
        {
          kind: "check",
          stem: "A 3.0 × 28 mm stent stops at the collar of a guide extension sitting in the proximal RCA (right radial approach, 6 Fr guide). The fellow wants to push harder because 'it is nearly in'. What does Brilakis advise?",
          options: [
            "Push with more force while the patient takes a deep breath, because the collar is the last obstacle",
            "Stop, remove and reinsert the extension avoiding wire wrap, and consider loading stent and extension together",
            "Advance the extension's proximal collar out of the guide so that the stent can enter it more easily in the aorta",
            "Bend the stent by hand so that it takes the angle of the collar, then advance it again under fluoroscopy",
          ],
          answer: 1,
          explanation:
            "Brilakis: if a stent meets resistance at a guide extension, do not apply force. Take the extension out and reinsert it, avoiding wire wrap round its rod, and consider advancing stent and extension into the guide as one unit. The collar must stay inside the guide, and bending the stent may make loss more likely. A deep breath can help stent delivery (10.2.8), but Brilakis's advice for resistance at a guide extension is not to apply force.",
        },
        { kind: "h", text: "The algorithm when a stent is lost" },
        {
          kind: "p",
          text: "Brilakis's algorithm (Fig. 27.2) asks three questions in order. Where is the stent? Does it have to come out? Is the wire still through it? The answers lead to one of five endings: retrieval, deployment, crushing, leaving it in a peripheral artery, or surgery. Say the questions aloud to the team before anyone touches the wire.",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Freeze the wire and find the stent", detail: "Keep the guidewire exactly where it is: a wire through the lost stent is the route for every gentle option. Then locate the stent. A stent with thin struts may be almost invisible on fluoroscopy, above all in a heavy patient or in an artery that is calcified or already contains stents; intravascular ultrasound can then show where it is (Brilakis)." },
            { title: "2. Is it in the coronary tree or outside it?", detail: "Inside a coronary artery, a lost stent must either be retrieved or be deployed or crushed in place: it cannot simply be left loose. Outside the coronaries the next question is whether it matters where it lies." },
            { title: "3. Must it come out?", detail: "Retrieve it if it lies in a critical coronary location (the left main or a major bifurcation) or a critical peripheral artery (cerebral or renal). In a non-critical coronary segment, deployment or crushing can be faster and safer than retrieval. In a non-critical peripheral site such as the pelvic or leg arteries, the risks of retrieval often outweigh any benefit and it can often be left." },
            { title: "4. Is the wire still through it?", detail: "If yes, you can retrieve it with the small-balloon technique, or deploy it. If the wire has come out, rewiring the stent is often impossible: retrieval is then limited to snares or wire twirling, and if it is staying in the artery, crushing is the only option, because a stent cannot be deployed without a wire through it." },
          ],
        },
        {
          kind: "table",
          caption: "Where the algorithm ends (Brilakis Fig. 27.2)",
          head: ["Situation", "Wire through the stent", "Wire lost"],
          rows: [
            ["Coronary, critical site (left main, major bifurcation): retrieve", "Small balloon; if it fails, snare; then wire twirling", "Snare; then wire twirling"],
            ["Coronary, non-critical site: no need to retrieve", "Deploy it (small balloon first, then larger)", "Crush it with another stent"],
            ["Retrieval has failed (including in a critical site)", "Reassess: weigh further attempts and surgery against deploying or crushing; in most cases deploying or crushing is the fastest and safest course. If retrieval is still essential, emergency surgery", "As for wire through the stent (crushing, since a stent without a wire cannot be deployed)"],
            ["Peripheral, non-critical (pelvis, legs)", "Leave it; if it has been pulled into the iliac or femoral artery and cannot come out through the sheath, crush it against the wall with a peripheral stent (Fig. 5.8)", "Leave it; if it has been pulled into the iliac or femoral artery and cannot come out through the sheath, crush it against the wall with a peripheral stent (Fig. 5.8)"],
            ["Peripheral, critical (cerebral, renal)", "Retrieve", "Retrieve"],
          ],
        },
        { kind: "tip", id: "pci-stentloss-freeze-wire" },
        {
          kind: "check",
          stem: "A 2.5 × 28 mm stent comes off its balloon in the left main during treatment of an LAD lesion. Its proximal end lies in the aortic root, and the wire has pulled back out of it. The patient is stable. Which course follows Brilakis's algorithm?",
          options: [
            "Crush it against the left main wall with a large balloon and cover it with a new stent, since the wire is lost",
            "Leave it where it is and finish the LAD, because a stent lying partly in the aorta will endothelialise",
            "Retrieve it with a snare, moving to wire twirling if snaring fails and to surgery only if retrieval is still essential",
            "Rewire through the stent repeatedly until a balloon can be passed for the small-balloon technique",
          ],
          answer: 2,
          explanation:
            "The left main is a critical site, so the stent must come out, and with the wire lost the options are snaring or wire twirling. Brilakis keeps crushing for a lost stent without a wire through it whose retrieval is not desired or not feasible, and excludes critical locations such as the left main as a first choice; only after retrieval has failed and the need to retrieve has been reassessed do deploying or crushing come back into consideration there. Rewiring a lost stent is often impossible. His own example (Fig. 27.5) is a 2.5 × 28 mm stent lost in the left main and retrieved with snares, the first leaving it partly in the aorta, the second, a three-loop snare, bringing it out.",
        },
        { kind: "h", text: "The techniques, done properly" },
        {
          kind: "steps",
          title: "Small-balloon technique (wire still through the stent)",
          items: [
            { title: "1. Cross the stent with a low-profile balloon", detail: "Advance a small balloon over the same wire through the lost stent. It can be hard to get through, and pushing may drive the stent further down the artery: watch the stent, not just the balloon." },
            { title: "2. Inflate beyond the stent", detail: "Inflate the balloon just distal to the stent, then pull it back so that it drags the stent with it. If the balloon only gets part of the way through, it can sometimes be inflated inside the proximal or mid part of the stent instead, and the whole system removed." },
            { title: "3. Into the guide, or out with the guide", detail: "If the stent is not badly deformed and the guide is large, the inflated balloon can pull it into the guide and both are removed. More often the stent is too crumpled to enter the guide: then keep the balloon inflated and take balloon, stent and guide out of the body together." },
          ],
        },
        { kind: "tip", id: "pci-stentloss-small-balloon" },
        {
          kind: "steps",
          title: "Wire twirling (wire lost, or the snare has failed)",
          items: [
            { title: "1. Two or more wires to the stent", detail: "Advance at least two 0.014 inch coronary wires through the lost stent or alongside it (Brilakis Fig. 27.6)." },
            { title: "2. Twist them together", detail: "Rotate the wires several times so that their distal ends wind round one another, and round the stent between them." },
            { title: "3. Withdraw wires and stent as one", detail: "Pull the twisted wires back; the stent often comes with them. In Brilakis's 2005 series, twirling two wires round the stent was one of the methods used in 5% of retrievals." },
          ],
        },
        {
          kind: "steps",
          title: "Deploying the lost stent (non-critical site, wire through it)",
          items: [
            { title: "1. Start small", detail: "A small balloon is most likely to enter the lost stent. Then use progressively larger balloons until the stent is properly expanded." },
            { title: "2. Watch for displacement", detail: "Trying to get a balloon into the stent can push it further down the vessel." },
            { title: "3. If no balloon will enter", detail: "Usually the stent is deformed. Change plan to crushing." },
          ],
        },
        {
          kind: "steps",
          title: "Crushing the lost stent (wire lost, retrieval not desired or not feasible; not a first choice in the left main)",
          items: [
            { title: "1. Wire round the outside", detail: "Advance a coronary guidewire past the lost stent, outside it. Take care not to thread the new wire through one or more of its struts, a particular risk if the stent was partly expanded." },
            { title: "2. Suspect a strut crossing early", detail: "If a balloon is hard to pass alongside the lost stent, suspect that the wire has gone through the struts and rewire, ideally with a knuckled polymer-jacketed wire (Brilakis Fig. 27.8 shows a knuckled wire crossing a deformed stent that no balloon or stent could pass). If balloon delivery is still difficult, rewire again, or use a balloon with a bevelled tip made to cross stent struts (23.1), or exchange for a support wire with a wavy distal segment that is especially useful for delivering equipment through stents (30.7.4). That wire is never used for primary wiring: it goes in by exchange over a microcatheter or an over-the-wire balloon." },
            { title: "3. Crush and exclude", detail: "Inflate a balloon to press the lost stent flat against the wall, then deploy a new stent over it so that the lost one is shut out of the lumen." },
            { title: "4. Appose fully", detail: "Make sure the struts lie flat against the wall so they do not obstruct flow, ideally confirmed with intravascular imaging." },
          ],
        },
        {
          kind: "p",
          text: "**Why leaving metal behind is usually acceptable.** Deploying or crushing a lost stent carries a risk of restenosis, but Brilakis judges it much lower than the risk of aggressive retrieval, and crushing an occluded stent on purpose is already used in some in-stent CTO procedures. The data are supportive, though limited: in Brilakis 2005 no patient whose stent was crushed or deployed in the coronary artery had a major cardiac complication (a small subgroup in a retrospective single-centre series; only three stents were crushed without any attempt at retrieval), while patients with stent loss as a whole had more bleeding needing transfusion (24% vs 7%) and more emergency bypass surgery (5% vs 0.4%) than those without. In Eggebrecht 2000, three patients needed urgent surgery after percutaneous retrieval failed, and all three died. Brilakis likewise calls surgical retrieval challenging and high-risk, to be undertaken only in extenuating circumstances.",
        },
        { kind: "tip", id: "pci-stentloss-crush-check-struts" },
        {
          kind: "check",
          stem: "A deformed stent has been lost in the mid LAD (a non-critical segment) and the wire is no longer through it. A second wire is passed beside it, but a 2.0 mm balloon will not advance past the lost stent. What is the most likely explanation and the next step?",
          options: [
            "The lesion beyond is undilatable, so start rotational atherectomy over the second wire",
            "The second wire has probably gone through the lost stent's struts, so rewire, ideally with a knuckled polymer-jacketed wire",
            "The balloon is too large, so the stent should now be retrieved with the small-balloon technique",
            "Crushing has failed, so the patient should go for emergency surgery",
          ],
          answer: 1,
          explanation:
            "Brilakis: difficult balloon delivery around a lost stent should make you suspect that the new wire has passed through its struts, especially if it was partly expanded, and the answer is to rewire, ideally with a knuckled polymer-jacketed wire. The small-balloon technique needs the original wire through the stent. Atherectomy over a wire that may be threaded through struts would be dangerous, and surgery is far down the list.",
        },
        {
          kind: "p",
          text: "**Outside the coronaries.** A stent pulled out of the coronary into the iliac or femoral arteries that will not come through the sheath can be crushed against the arterial wall with a peripheral stent. Brilakis shows the same manoeuvre after a self-expanding iliac stent was caught on a guide tip and carried into the aorta: it was snared back into the iliac artery and pinned with a balloon-expandable stent (Fig. 5.8). That case is also why he avoids placing iliac stents before a PCI is finished, and advances a long sheath through any iliac stent already there. A stent that has embolised into a small distal branch, such as a femoral branch, may be left: none of 12 such patients across three series had consequences, so extraction usually carries more risk than leaving it.",
        },
        {
          kind: "p",
          text: "**A historical note from Oxford.** The first widely used stent was supplied expanded and had to be crimped onto a balloon by hand, and it dislodged from its balloon not infrequently. Eggebrecht's series measured the difference: 1.04% of hand-crimped stents were lost against 0.27% of premounted ones. Premounted stents have made loss rare, but not impossible. Brilakis notes that many operators still avoid suction through the indeflator while preparing a stent, for fear of dislodging it, but that with contemporary stents the risk is very low and suction can usually be applied.",
        },
        {
          kind: "p",
          text: "**Entrapment as a cause of acute closure.** Brilakis's acute vessel closure algorithm lists entrapped equipment as one of its causes, arising from calcification, tortuosity, poor lesion preparation, rotational atherectomy and pushing equipment through stents; the treatment is to retrieve the equipment or to stent over it (25.2.7, Table 25.1; cm-principles-closure).",
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling the wire out to 'start again': it removes the only rail for the small-balloon technique and for deployment.",
            "Pushing a balloon hard into a lost stent and driving the stent into the distal vessel.",
            "Crushing a lost stent in the left main or another critical site before retrieval has been tried; Brilakis requires retrieval there first.",
            "Crushing over a wire that has passed through the lost stent's struts; difficult balloon passage is the warning.",
            "Chasing a stent in a small peripheral branch, where retrieval is riskier than leaving it.",
            "Forgetting to look: a thin-strut stent can disappear on fluoroscopy, and intravascular ultrasound can find it.",
          ],
        },
        {
          kind: "pearl",
          text: "Before anyone reaches for a snare, ask whether this stent truly has to come out. In a non-critical segment with the wire still through it, the fastest and safest rescue is usually to finish the job the stent was meant to do: expand it where it lies, then treat the lesion.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (calcified mid-RCA), prepare the lesion until a balloon expands fully before you attempt the stent. During delivery, if the stent stops, do not push: check guide position and coaxiality first. Say aloud the stent-loss questions (where is it, must it come out, is the wire through it) and the ending you would choose for a stent lost in the proximal RCA with the wire still through it.",
        },
        { kind: "video", id: "Iu4_ry7T2Rs", note: "Manual of PCI chapter video 27.1: stent loss." },
        { kind: "video", id: "uzEJi7SWAbc", note: "Case 10 from the Manual of PCI: stent loss." },
        { kind: "video", id: "8JDR76D2wcM", note: "Case 134 from the Manual of PCI: stent loss." },
        { kind: "video", id: "1RpMi3I-n_Q", note: "Case 167 from the Manual of CTO PCI: how to best manage stent loss." },
        {
          kind: "keypoints",
          items: [
            "Entrapment is graver than loss; in Brilakis's group's series all lost devices were managed percutaneously, but 3 of 4 entrapments needed surgery.",
            "A common route to stent loss is poor preparation: the stent is crumpled during delivery and stripped off at the guide tip on the way back (Fig. 27.1).",
            "Prevent it: prepare (atherectomy and imaging as needed), no direct stenting in tortuous calcified vessels, distal before proximal, no 5 Fr guides for complex work, no force, coaxial withdrawal, careful guide extension handling.",
            "Algorithm: where is it, must it come out, is the wire through it; keep the wire.",
            "Critical sites (left main, major bifurcation, cerebral, renal) need retrieval: small balloon, snare, wire twirling, then reassess, then surgery.",
            "Non-critical coronary: deploy it if the wire is through it, crush it if not; peripheral and non-critical: usually leave it.",
            "When crushing, a balloon that will not pass means the new wire may be through the struts: rewire, ideally with a knuckle.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-equipment-loss-wire",
      title: "Guidewire entrapment and fracture",
      minutes: 16,
      topics: ["comp-wire-entrapment"],
      sources: [B("27.2"), B("16.2"), B("8.6"), B("18.8"), B("19.9"), B("29.2"), O("ch 10: Limb ischaemia")],
      refs: [...BOOKS, "danek-wire-entrapment-2016", "iturbe-device-loss-2012"],
      blocks: [
        {
          kind: "p",
          text: "A coronary guidewire is a core with a fine spring coil wound round its tip. When it is held fast, the instinct is to pull, and pulling is what turns a stuck wire into a broken one. Brilakis calls entrapment and fracture infrequent and often preventable, but warns that the consequences can be devastating once the coil unravels. The Academy lesson comp-equip-wire-burr-guide gives the general principles; here are Brilakis's two algorithms (Fig. 27.10) in full, and the prevention that sits behind them.",
        },
        { kind: "h", text: "How wires get trapped and broken" },
        {
          kind: "table",
          caption: "Causes (Brilakis 27.2.1, 16.2, 18.8, 19.9) and the prevention that answers each",
          head: ["Cause", "Prevention"],
          rows: [
            ["Jailing a side-branch wire during bifurcation stenting", "Some avoid jailing for this reason, but Brilakis judges the risk of losing the side branch greater in most cases. Jail with the tip straight; pull the wire back before jailing so that its radiopaque segment lies near the carina, but not under the stent; and avoid jailing a long length of wire. Which wire to jail is debated: workhorse, hydrophilic and polymer-jacketed wires can all be jailed, and in one microscopy study 2 of 115 jailed polymer-coated wires showed mild damage against 63 of 120 (55%) wires without a polymer coat, 2 of them fractured internally, with longer jailed lengths linked to more damage; the side branch was also wired faster with the polymer-coated wires. The concern on the other side is that the polymer may be stripped as the wire is withdrawn and embolise downstream: one autopsy study found polymer material distal to stented arteries in 10% of hearts, though not after jailing. The question is therefore unsettled. Separately, Brilakis asks for a polymer-jacketed wire used to reach a branch to be exchanged for a workhorse wire before lesion preparation and stenting (16.2.8; cp-bifurcation-provisional teaches jailing in full)"],
            ["A wire deformed by aggressive knuckling", "Avoid aggressive manipulation, especially in small branches"],
            ["Pulling a wire whose tip has curled into a loop back through a stent", "Straighten the tip before it comes back through any stent; the loop can catch the struts"],
            ["A buddy wire used with a filter embolic protection device", "Remove the buddy wire as soon as the filter is delivered: stenting over it traps the filter, which can be very hard or impossible to remove"],
            ["Severe calcification", "Brilakis gives no specific prevention; the general rule is to avoid aggressive manipulation (27.2.2)"],
            ["Fracture from pulling an entrapped wire hard", "Never pull hard"],
            ["Fracture from over-rotation", "Avoid aggressive torquing; a tip that stops responding after torquing should raise the suspicion of fracture (Fig. 27.12)"],
            ["Fracture from atherectomy over a kinked wire", "Replace a kinked wire with a new one before atherectomy. Fracture of the dedicated atherectomy wire is also linked to ablating close to its 0.014 inch tip, to highly angulated lesions and to prolonged contact in tortuous segments (cp-calcium)"],
          ],
        },
        {
          kind: "p",
          text: "**A wire left in a branch while the left main is stented.** In Brilakis Fig. 27.9, an obtuse marginal wire was kept in place to steady the guide while a left main stent was deployed over the LAD wire. On withdrawal it tangled in the new stent, several attempts failed to free it, and it had to be removed surgically; the later panels show the unravelled coil.",
        },
        {
          kind: "p",
          text: "**Catch it early.** If the tip stops moving freely while you wire, it may be under plaque. Brilakis's advice is to withdraw and re-advance it, or leave it and pass a second wire beside it, rather than push on, which risks dissection and tip entrapment. When aggressive torquing leaves the tip unresponsive on fluoroscopy, suspect that the wire has fractured (Brilakis Fig. 27.12: the fracture had unravelled the distal spring coil, and the whole wire was removed with a microcatheter).",
        },
        { kind: "tip", id: "pci-wire-tip-restrained" },
        { kind: "h", text: "The entrapped wire: five steps" },
        {
          kind: "steps",
          items: [
            { title: "1. Do not pull hard", detail: "Brilakis puts this first because once the wire's structure is compromised it can fracture or unravel, which is very hard to treat and may need cardiac surgery. Apply only gentle, constant traction. A hard pull also drags the guide deep into the artery, risking a guide-induced dissection (16.2)." },
            { title: "2. Bring a catheter to the trap", detail: "Advance a microcatheter or a balloon over the trapped wire as far as it will go, then pull the wire gently. The catheter concentrates the pulling force at the point of entrapment. A guide extension can be used in the same way. For a jailed wire, Brilakis adds that rotating it with a torquer may help." },
            { title: "3. Inflate a balloon on it", detail: "If that fails, take a balloon over the trapped wire as far distally as possible, inflate it, and try again. In most cases this frees the wire. After freeing a jailed wire this way, Brilakis repeats the proximal optimisation inflation (POT)." },
            { title: "4. Second wire and balloon beside it", detail: "If it is still stuck, pass a second wire next to the trapped one and dilate alongside it to loosen it (Brilakis Fig. 27.11: a knuckled wire trapped in an LAD CTO was freed after the occlusion was crossed with a second wire and balloon angioplasty was performed around the trapped wire)." },
            { title: "5. Surgery, or the last straw", detail: "If every attempt fails, surgery may be needed. A last resort before that is to pull hard with a balloon or microcatheter in place, in the hope that the wire breaks cleanly without unravelling." },
          ],
        },
        { kind: "tip", id: "pci-wire-trapped-no-hard-pull" },
        {
          kind: "check",
          stem: "After provisional stenting of the LAD across a large diagonal, the jailed diagonal wire will not come out with gentle traction, and with each tug the guide dives deeper. What is the next step in Brilakis's sequence?",
          options: [
            "Pull firmly and quickly so that the wire comes out before the guide can follow it into the LAD",
            "Advance a microcatheter or small balloon over the jailed wire as far as it will go, then pull gently",
            "Leave the wire in place permanently and cut it at the Y-connector, since jailed wires are harmless anyway",
            "Inflate a large balloon in the LAD stent at high pressure to squeeze the wire free of the struts",
          ],
          answer: 1,
          explanation:
            "Pulling hard risks fracture or unravelling and, as here, deep guide intubation and dissection. Brilakis's sequence is a microcatheter or balloon to the trap with a gentle pull, so that the force acts where it is needed, then a balloon inflated on the trapped wire, then a second wire with a balloon dilated beside it, then surgery. Cutting the wire and leaving it is not in that algorithm, and a high-pressure inflation in the main-vessel stent is not the next step.",
        },
        { kind: "h", text: "The fractured wire: is the coil unravelled?" },
        {
          kind: "p",
          text: "The first question after a fracture is whether the wire has broken cleanly or its distal spring coil has unravelled. An unravelled coil can form a metal 'bird's nest' that predisposes to thrombosis; fragments that reach the aorta add a risk of systemic as well as coronary thromboembolism. Brilakis asks for intravascular ultrasound after any fracture to confirm that no coil has unravelled.",
        },
        {
          kind: "steps",
          title: "If the coil has unravelled",
          items: [
            { title: "Can the fragments be covered by a stent?", detail: "If yes, trap them against the wall with a stent (Brilakis Fig. 27.13: a stent lost in the proximal circumflex, then a wire trapped and fractured there; another wire was passed beyond the trapped hardware, followed by balloon angioplasty and a stent across it all)." },
            { title: "If they reach the aorta, or lie in a critical site", detail: "When unravelled wire reaches back into the aorta, or sits in the left main or at another major bifurcation, Brilakis sends the patient for emergency surgery to take it out and to head off later emboli, systemic as well as coronary, unless the percutaneous alternative below works." },
            { title: "Do not try to pull unravelled fragments out", detail: "Retrieval attempts are generally avoided because they unravel the wire further, although successful percutaneous removal has been reported (Fig. 27.12 is one example). A snare can instead break the wire as close to the ostium as possible (or even inside the artery), so that the remainder can be stented over. In Fig. 27.15 this removed the unravelled length, and the wire left behind was stented over (panel L shows the final result)." },
          ],
        },
        {
          kind: "p",
          text: "**How that manoeuvre looks (Brilakis Fig. 27.15).** In a calcified acute RCA occlusion the wire tip became trapped and unravelled; a 2 mm snare could not be advanced and a trapping balloon failed. The operators then mounted a large (20 mm) single-loop snare inside a small (2 mm) one, caught the free proximal end of the wire, which lay in the abdominal aorta, with the large loop, advanced the small snare along the wire to the ostium, and pulled back there. The wire broke at the ostium, the unravelled length came out, and the part left in the artery was covered with a stent (panel L shows the final result).",
        },
        {
          kind: "steps",
          title: "If the wire has broken cleanly (no unravelling on intravascular ultrasound)",
          items: [
            { title: "Does the fragment need to come out?", detail: "A short piece lodged in a small distal branch or a collateral is usually safest left alone; a long piece, above all in a major artery, should come out." },
            { title: "Retrieve: wire twirling first", detail: "Advance one or more wires beside the fragment and twist them together several times so that they wind round it, then withdraw them with it." },
            { title: "Then a snare", detail: "Small coronary snares (lesson 4) may capture the fragment. If they fail, emergency surgery may be needed to remove it." },
            { title: "Not retrieving: stent over it or leave it", detail: "A fragment in a small distal branch is usually left in place. One lying more centrally can be pinned with a stent, which stops it migrating and lowers the chance of thrombus forming on it." },
          ],
        },
        { kind: "tip", id: "pci-wire-fracture-ivus-first" },
        {
          kind: "table",
          caption: "Fractured wire: where Brilakis's algorithm ends",
          head: ["Finding", "Ending"],
          rows: [
            ["Unravelled, can be covered by a stent", "Stent over the fragments"],
            ["Unravelled, into the aorta or in the left main or a major bifurcation", "Emergency surgery, unless a snare can break the wire at (or just inside) the ostium so that the remaining fragment can be stented (Fig. 27.15)"],
            ["Clean break, long fragment in a large artery", "Wire twirling, then snare, then surgery if both fail"],
            ["Clean break, central fragment left in place", "Stent over it"],
            ["Clean break, small fragment in a small distal branch or collateral", "Leave it"],
          ],
        },
        {
          kind: "check",
          stem: "A workhorse wire breaks during CTO wiring. Intravascular ultrasound shows a clean break with no unravelled coil. A short (3–4 mm) fragment sits in a small distal septal collateral. What does the algorithm recommend?",
          options: [
            "Emergency surgery, because any retained wire fragment is a source of thrombus",
            "Leave the fragment in place, since it is small and lies in a small distal collateral",
            "Twirl two wires round the fragment and withdraw, because every fragment must be retrieved",
            "Snare it with a 20 mm snare advanced into the septal collateral to grip it securely",
          ],
          answer: 1,
          explanation:
            "Without unravelling, the question is whether the fragment needs to come out. A short piece in a small distal branch or a collateral is usually safest left alone, and Brilakis keeps retrieval (twirling, then snaring, then surgery) for long fragments in large arteries; a central fragment that stays is pinned with a stent. Large snares are for the aorta, not a septal channel.",
        },
        {
          kind: "p",
          text: "**Beyond the coronary.** Oxford notes that acute arm ischaemia can result from lost equipment, such as a wire wrapped in the radial artery (its Fig. 10.13, a rare case), and that it requires immediate surgery. Brilakis notes that equipment held by severe radial spasm may rarely need propofol or even general anaesthesia to release it (pm-engaging teaches spasm). In Danek's review of fracture and entrapment from Brilakis's group (2016), fracture may be more likely in complex lesions and where wires interact with new or existing stents; in one of their two cases the fragment protruded into the ascending aorta and the patient went for emergency surgery, while the other, a fractured polymer-jacketed wire, was retrieved after a second wire crossed the lesion and a balloon was inflated beside it. They add that wire fragments can often be retrieved percutaneously, with surgery when that fails. The Academy's published case pub-calcified-lad-wire-entrapment-elca shows laser atherectomy used to release a wire trapped in heavy calcium.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling hard on a trapped wire, which risks fracture, unravelling and a guide-induced dissection.",
            "Torquing on when the tip has stopped responding; suspect fracture and stop.",
            "Withdrawing a looped tip through a stent instead of straightening it first.",
            "Running atherectomy over a kinked wire.",
            "Leaving a buddy wire beside a filter while a stent is deployed.",
            "Assuming a fracture is clean without intravascular ultrasound.",
            "Trying to pull out an unravelled coil, which unravels it further.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat a jailed or knuckled wire as a device that may have to come back through metal. Straighten the tip, keep the jailed length short and away from the radiopaque segment, and if it sticks, take a catheter to the wire rather than the wire to the operator.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (focal mid-LAD), keep the wire tip moving freely while you cross: if the tip stops responding to torque, withdraw and re-advance rather than spin further. Before you withdraw any wire through a deployed stent, check on fluoroscopy that its tip is straight, and say aloud the five entrapment steps in order.",
        },
        { kind: "video", id: "6QEFbGPq68I", note: "Manual of PCI chapter video 27.2: guidewire entrapment and fracture." },
        { kind: "video", id: "8EQsasVWJRU", note: "Case 32 from the Manual of PCI: guidewire entrapment." },
        { kind: "video", id: "1TwMn7SMhc8", note: "Case 33 from the Manual of PCI: guidewire fracture and unravelling." },
        { kind: "video", id: "eglCD3rzKLQ", note: "Case 88 from the Manual of PCI: wire entrapment and fracture." },
        {
          kind: "keypoints",
          items: [
            "Causes: jailing, aggressive knuckling, looped tips pulled through stents, buddy wires beside filters, calcium; fracture from hard pulls, over-rotation and atherectomy over kinked wires.",
            "Entrapped wire: do not pull hard; microcatheter or balloon to the trap and pull gently; inflate a balloon on it; second wire and balloon alongside; then surgery (or, last, a hard pull with a catheter in place).",
            "After any fracture, intravascular ultrasound: has the coil unravelled?",
            "Unravelled: stent over the fragments if possible; fragments in the aorta, left main or a major bifurcation need surgery unless a snare can break the wire at the ostium so the rest can be stented; do not try to pull them out.",
            "Clean break: leave small distal fragments; retrieve long ones in large arteries (twirling, snare, surgery); pin central ones with a stent.",
            "Straighten the tip before withdrawing through a stent, and replace a kinked wire before atherectomy.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-equipment-loss-balloon-microcath",
      title: "Balloons and microcatheters: stuck, will not deflate, or broken",
      minutes: 17,
      topics: ["comp-balloon-microcath-entrapment"],
      sources: [
        B("27.3"),
        B("27.4"),
        B("9.7"),
        B("10.2"),
        B("23.1"),
        B("23.2"),
        B("30.3"),
        B("30.6"),
        B("30.9"),
        B("8.9"),
        O("ch 8: Intravascular ultrasound"),
      ],
      refs: [...BOOKS, "iturbe-device-loss-2012"],
      blocks: [
        {
          kind: "p",
          text: "Balloons can rupture and stick in a lesion, refuse to deflate, catch on stent struts, or snap at the shaft. Microcatheters can wedge in calcium, lock onto each other over an externalised wire, or lose their tip. A trapped balloon may also stop flow down the artery, so Brilakis reminds you that the patient may need haemodynamic support while you work. The Academy lesson comp-equip-balloon-snare covers balloon rupture; this lesson teaches the three balloon algorithms of Brilakis Fig. 27.17 and the microcatheter rules that go with them.",
        },
        { kind: "h", text: "Causes and prevention" },
        {
          kind: "table",
          caption: "Balloons (Brilakis 27.3.1–27.3.2, 9.7, 23.1.2, 23.2)",
          head: ["Problem", "Causes", "Prevention"],
          rows: [
            ["Entrapment", "Rupture, which leaves the balloon caught in the lesion; failure to deflate; interaction with a stent already in place, above all with plaque modification balloons; stents already in place have occasionally been pulled out while a cutting balloon was retrieved. With cutting balloons, excessive inflation force or rupture in the lesion can also break a blade or tear out stent struts, as well as trap the balloon (23.2.3). A ruptured balloon can be hard to remove, and occasionally it tangles with the wire so that both must come out and wire position is lost (23.1.2). Balloons that have been taken to high pressure can also cling to the lesion and be hard to pull back, occasionally at the cost of the wire; watching on fluoroscopy as you withdraw them lowers that risk (23.2.2)", "Rupture is linked to pressures above 20 atm: Brilakis's prevention is to modify heavy calcium first, by atherectomy or lithotripsy, and to avoid inflations above 20 atm in such lesions (9.7.9.3.1). Non-compliant post-dilatation and undilatable lesions are a separate matter, where he accepts 20 atm or more and up to 26–28 atm (10.2.9.2, 23.2.2). Inflate a cutting balloon slowly, so that its blades do not puncture the balloon and are less likely to catch in calcified spicules. Brilakis gives two ceilings: about 5 s per atm, usually 6–8 atm and not above 12 atm (9.7.9.2), and avoid more than 14 atm (23.2.3). The lower figure, with the device's instructions for use, is the one pm-prep-and-stent teaches"],
            ["Failure to deflate", "The lesion or stent recoils onto the balloon; the balloon is strangled inside the guide; the hypotube (the shaft that carries the inflation fluid) is kinked or broken", "Do not kink the shaft; if it kinks, replace the balloon promptly"],
            ["Shaft fracture", "A kinked shaft (balloon or stent delivery catheter), usually from forceful advancement against resistance", "Advance in small bites, and never straighten a kink, which weakens the shaft. In the entrapment chapter (27.3.2.2) and on failure to deflate (9.7.10.3.1) Brilakis advises replacing any kinked balloon or stent catheter; on balloon delivery (9.7.7) he allows the procedure to continue with a small kink but always discards a catheter with a large one"],
          ],
        },
        {
          kind: "table",
          caption: "Microcatheters (Brilakis 27.4.1–27.4.2, 23.1, 30.6)",
          head: ["Problem", "Causes", "Prevention"],
          rows: [
            ["Entrapment", "Aggressive advancement through tortuous calcified lesions; two microcatheters meeting tip to tip over an externalised wire and interlocking; manipulating a microcatheter with no wire inside it", "No aggressive pushing through complex calcified lesions; antegrade equipment must never meet the retrograde microcatheter tip (cp-cto-retrograde); always keep a wire in the lumen while you manipulate"],
            ["Fracture", "Aggressive manipulation, especially of soft-tip microcatheters, through complex lesions or across stent struts; over-rotation, which weakens the catheter and hinders both advancement and retrieval, and can deform and trap the catheter or break it just proximal to the tip (30.6.6). Some low-profile microcatheters that can be turned either way are hard to rotate and may lose their tip if torqued aggressively (23.1)", "No more than 10 turns before letting the catheter unwind (Brilakis 23.1); for the stranded-steel plaque modification microcatheter, no more than 20 rotations in either direction; soft-tip low-profile microcatheters are not designed for aggressive torquing, and Brilakis advises against the one he discusses for balloon-uncrossable lesions; microcatheters with a stronger tip construction may fracture less"],
            ["Microcatheter 'fatigue'", "After prolonged use the wire binds to the microcatheter, or the microcatheter becomes hard to advance; over-rotation can do the same", "Exchange it for a new one. After injecting contrast through a microcatheter, flush it, or the wire may become sticky; rarely, wire and microcatheter must come out together"],
          ],
        },
        { kind: "tip", id: "pci-balloon-shaft-kink" },
        { kind: "tip", id: "pci-microcath-wire-inside-limit-turns" },
        { kind: "h", text: "Balloon entrapment: six steps" },
        {
          kind: "steps",
          items: [
            { title: "1. Is it simply failing to deflate?", detail: "If so, go to the failure-to-deflate branch below." },
            { title: "2. Rotate and rock", detail: "Turning the balloon may help it rewrap; gentle back-and-forth movement may free it." },
            { title: "3. Trap it inside the guide and pull everything", detail: "Pass a second balloon inside the guide, as close to the guide tip as possible without leaving the guide, and inflate it at high pressure (20 atm or more). It pins the trapped balloon's shaft against the guide wall, and the guide with both balloons is pulled back as one unit." },
            { title: "4. Guide extension to the balloon", detail: "Cut the trapped balloon's shaft, advance a guide extension over it as close to the balloon as possible, and pull again. A guide extension with its own trapping balloon has the advantage of trapping the shaft inside the guide at the same time." },
            { title: "5. Snare", detail: "Bring the snare right up to the trapped balloon, close it and pull back." },
            { title: "6. Surgery", detail: "If all of this fails, emergency surgery may be needed." },
          ],
        },
        { kind: "tip", id: "pci-balloon-trap-in-guide" },
        {
          kind: "check",
          stem: "A balloon has ruptured in a heavily calcified mid-RCA and will not come back. It is deflated, and rotating and rocking it have not helped. You are in a 7 Fr guide. What is Brilakis's next step?",
          options: [
            "Inflate a second balloon inside the guide near its tip at 20 atm or more and withdraw guide and both balloons together",
            "Pull firmly on the balloon shaft alone, keeping the guide still, so that the guide gives counter-traction",
            "Advance a larger balloon over the same wire and inflate it inside the ruptured balloon to break it up",
            "Cut the balloon shaft at the hub and leave the balloon in the RCA, then stent over it later",
          ],
          answer: 0,
          explanation:
            "After rotation and back-and-forth movement, Brilakis's next step is trapping: a second balloon inflated at high pressure inside the guide pins the shaft, and the whole assembly comes out together. Next come a guide extension advanced over the cut shaft, then a snare, then surgery. Cutting the shaft is part of the guide extension step, not a way of abandoning the balloon.",
        },
        { kind: "h", text: "A balloon that will not deflate" },
        {
          kind: "steps",
          items: [
            { title: "1. Another indeflator", detail: "Swap to a fresh indeflator, preferably one primed with saline, or use a saline-filled luer-lock syringe." },
            { title: "2. Withdraw it inflated", detail: "When the balloon is narrower than the vessel's reference diameter, you can try pulling it back into the guide while it is still inflated." },
            { title: "3. Burst it", detail: "If the balloon is smaller than the reference vessel, inflate it at high pressure until it ruptures." },
            { title: "4. Puncture it", detail: "Advance an over-the-wire balloon over a second wire alongside the stuck balloon and inflate it at low pressure (2–4 atm). Remove that wire and pass a stiff wire, or the back end of a wire, through the over-the-wire balloon to puncture the stuck one; the inflated balloon centres the wire and points it at the target, which protects the vessel. Alternatively, cut the stuck balloon's shaft, push a guide extension gently against the balloon, and puncture it with a stiff wire or a wire's back end passed through the extension, which protects the proximal vessel." },
            { title: "5. Surgery", detail: "If none of this works, emergency surgery may be needed." },
          ],
        },
        { kind: "tip", id: "pci-balloon-no-deflate" },
        { kind: "h", text: "A broken shaft" },
        {
          kind: "steps",
          items: [
            { title: "1. Is part of the fragment still inside the guide?", detail: "Brilakis's trick: lay the piece you have retrieved next to an intact catheter of the same model to see where it broke and how much is left behind." },
            { title: "2. If yes, trap it in the guide", detail: "Inflate a second balloon inside the guide at high pressure (20 atm or more) beside the fragment, and withdraw guide, fragment and inflated balloon together under fluoroscopy, keeping the balloon inflated throughout. If this fails, go to the snare." },
            { title: "3. If no, snare it", detail: "Capture the retained fragment with a snare and withdraw (Brilakis Fig. 27.16: a kinked balloon shaft snapped in two, and the distal piece was retrieved from the RCA with a small coronary snare)." },
            { title: "4. Wire and balloon around it", detail: "If snaring fails, pass a wire around the trapped fragment, usually through a second guide, and dilate around it to free it from the wall." },
            { title: "5. Surgery", detail: "If that also fails." },
          ],
        },
        {
          kind: "check",
          stem: "A kinked balloon shaft snaps during withdrawal. Comparing the retrieved piece with an intact balloon of the same model shows that about 40 cm of shaft is missing, so the broken end must still lie inside the guide. What is the next step?",
          options: [
            "Snare the fragment in the coronary artery first, since snaring is the first step for every broken shaft",
            "Pass a wire around the fragment through a second guide and dilate around it",
            "Inflate a second balloon inside the guide at high pressure beside the fragment and withdraw everything together",
            "Proceed directly to emergency surgery, since a broken balloon shaft cannot be retrieved percutaneously",
          ],
          answer: 2,
          explanation:
            "When part of the fragment is still in the guide, Brilakis traps it there with a second balloon at 20 atm or more and pulls guide, fragment and balloon out as a unit, keeping the balloon inflated. Snaring is the first step only when nothing is left inside the guide, and wire-and-balloon dilatation around the fragment comes after a failed snare.",
        },
        { kind: "h", text: "Microcatheters, guide extensions and imaging catheters" },
        {
          kind: "list",
          items: [
            "**Retrieving a trapped or broken microcatheter.** Brilakis treats it as important to retrieve, to prevent acute and late complications, using the same tools as for a broken balloon: snares, a guide extension, trapping inside the guide, or a second wire through the area followed by balloon angioplasty. If they fail, surgery may be needed.",
            "**A fractured microcatheter tip.** Getting it out can be very hard or impossible, and Brilakis suggests that pinning the broken tip under a stent may be quicker and safer than persisting (his Fig. 27.18 shows a tip that snapped off while being pushed through heavy calcium).",
            "**Wire and microcatheter locked together.** Rarely, excessive manipulation disrupts the microcatheter or the wire and locks them, so both must be withdrawn. Brilakis notes that a polymer-jacketed wire can sometimes then be passed along the channel already made, so crossing can restart.",
            "**Circumcision.** If the wire is entrapped inside the microcatheter or over-the-wire balloon, or a short wire must stay in place when no extension wire is available and trapping is impossible, the catheter can be cut off the wire in segments (circumcision, taught in pm-wiring). Cut carefully, so as not to injure anyone or damage the wire, which must still carry equipment afterwards; the catheter is destroyed.",
            "**Guide extensions.** A guide extension can itself be trapped and fracture. Brilakis shows one whose tip was caught while being advanced into a diagonal through an LAD stent; its shaft broke during retrieval, and the cylinder was recovered by inflating a balloon inside it and withdrawing (Fig. 30.37). Forceful advancement of an extension through a stent already in place can also deform that stent along its length.",
            "**Trapping with a guide extension in place is hard.** The trapping balloon has to sit proximal to the extension's proximal collar, and the equipment has to be pulled back to that point. When you expect to need trapping, Brilakis prefers the extension that carries its own trapping balloon. Dedicated trapping balloons, which have no wire lumen, resist kinking and have a lower profile than standard balloons used for trapping.",
            "**Intravascular ultrasound catheters.** Oxford lists entrapment of an IVUS catheter by a stent strut among its uncommon major complications (all major complications together under 0.3%), alongside dissection and thrombus.",
          ],
        },
        { kind: "tip", id: "pci-microcath-trapped-retrieve" },
        {
          kind: "pitfalls",
          items: [
            "Repeated very high-pressure inflations in heavy calcium, which rupture and trap balloons; atherectomy first is the prevention.",
            "Straightening a kinked shaft and then using it; replace a kinked balloon or stent catheter, and always one with a large kink.",
            "Pulling a trapped balloon by its shaft alone instead of trapping it inside the guide and moving everything together.",
            "Bursting a non-deflating balloon that is as large as the vessel; Brilakis keeps that option for balloons smaller than the reference diameter.",
            "Spinning a microcatheter beyond its limit, or moving it with no wire inside it.",
            "Letting antegrade devices touch the retrograde microcatheter tip over an externalised wire.",
          ],
        },
        {
          kind: "pearl",
          text: "Several balloon and microcatheter rescues share one idea: fix the device to the guide and move them as a unit. A second balloon inflated inside the guide, a guide extension slid up to the trap, a trapping balloon in the extension: each turns a pull on a fragile shaft into a pull on the whole system.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "On the bench, inflate a non-compliant balloon in a calcified segment without resorting to very high pressures, and consider atherectomy instead when it will not expand. Then rehearse aloud the failure-to-deflate sequence (new indeflator with saline, withdraw if smaller than the vessel, burst if smaller than the vessel, puncture through an over-the-wire balloon at 2–4 atm) and the trapping manoeuvre (second balloon at 20 atm or more inside the guide).",
        },
        { kind: "video", id: "lEDjc5CNrJo", note: "Manual of PCI chapter video 27.3: balloon entrapment and fracture." },
        { kind: "video", id: "chznLPRnIWc", note: "Manual of PCI chapter video 27.4: microcatheter entrapment and fracture." },
        { kind: "video", id: "COqySRTm7h4", note: "Case 29 from the Manual of PCI: microcatheter tip fracture." },
        { kind: "video", id: "9eSeLtQXeYs", note: "Case 8 from the Manual of PCI: fracture of a scoring balloon." },
        {
          kind: "keypoints",
          items: [
            "A trapped balloon can stop flow: have haemodynamic support in mind while you work.",
            "Entrapment: deflation problem? then rotate and rock, trap with a second balloon at 20 atm or more inside the guide and pull everything, guide extension over the cut shaft, snare, surgery.",
            "Failure to deflate: another indeflator with saline, withdraw inflated or burst it (only if smaller than the vessel), puncture via an over-the-wire balloon at 2–4 atm or a guide extension, surgery.",
            "Shaft fracture: compare with an intact catheter; fragment in the guide, trap it; if not, snare; then wire and balloon around it; then surgery.",
            "Prevent: atherectomy (or intravascular lithotripsy) for very heavy calcium; avoid very high pressures there, since Brilakis links rupture to inflations above 20 atm; cutting balloons slowly (about 5 s per atm), usually 6–8 atm, with Brilakis's ceilings of 12 atm (9.7.9) and 14 atm (23.2.3); replace a kinked balloon.",
            "Microcatheters: a wire always inside, no more than 10 turns before unwinding, no aggressive pushing of soft tips; retrieve like a balloon fragment; a broken tip may be stented over.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-equipment-loss-snares",
      title: "Snares and the retrieval kit",
      minutes: 14,
      topics: ["comp-snaring"],
      sources: [
        B("30.18"),
        B("30.23"),
        B("27.1"),
        B("27.2"),
        B("30.3"),
        B("19.9"),
        B("5.7"),
        B("10.2"),
        B("15.1"),
        O("ch 4: Accessing the right heart"),
      ],
      refs: [...BOOKS, "brilakis-stent-loss-2005", "eggebrecht-stent-retrieval-2000"],
      blocks: [
        {
          kind: "p",
          text: "A snare is a loop of wire, usually nitinol, that is passed through a catheter, opened around a lost device and closed so that the device is held against the catheter tip; catheter, loop and device then come out together. Brilakis counts snares with covered stents, coils, vascular plugs and the pericardiocentesis tray as equipment every catheter laboratory must have, however rarely it is used. The Academy lessons comp-equip-balloon-snare and bed-foreign-body describe snare types and general retrieval; this lesson adds Brilakis's sizes, loading steps and improvised snares.",
        },
        { kind: "h", text: "Which snare, and what size" },
        {
          kind: "table",
          caption: "Snare choice (Brilakis 30.18.5, 27.1.3.5)",
          head: ["Space", "Snare", "Delivery"],
          rows: [
            ["Coronary arteries", "Small loops of 2–4 mm. One coronary microsnare is itself 0.014 inch, 180 cm long, with 2, 4 or 7 mm loops, and needs no delivery catheter; a small three-loop snare of 2 or 4 mm is also used", "Through the guide, or a microcatheter"],
            ["Aorta and peripheral arteries", "Large loops of 27–45 mm or 18–30 mm. For a stent lost in the peripheral circulation Brilakis often chooses an 18–30 mm three-loop snare, but warns that its wires can still injure the vessel", "Through a JR4 or multipurpose catheter (diagnostic or guide)"],
          ],
        },
        {
          kind: "p",
          text: "**Loop design.** Brilakis prefers three-loop ('tulip') snares to the single-loop design: three overlapping loops make capture more likely. That is why his peripheral snare of choice is a three-loop one. In his Fig. 27.5, a stent that a coronary microsnare had left partly in the aorta and partly in the left main was then retrieved with a three-loop snare.",
        },
        { kind: "tip", id: "pci-snare-size-for-space" },
        {
          kind: "check",
          stem: "A lost stent has been pulled out of the coronary artery and now sits in the descending thoracic aorta. Which snare does Brilakis's sizing rule point to?",
          options: [
            "A 2 mm coronary microsnare advanced through a microcatheter from the guide, because a small loop gives the finest control",
            "A 7 mm loop on a 0.014 inch coronary microsnare, because it needs no delivery catheter and reaches the aorta directly",
            "A large snare (27–45 or 18–30 mm), for example the 18–30 mm three-loop snare, through a JR4 or multipurpose catheter",
            "No snare at all: a stent free in the aorta must be retrieved surgically, because snare wires would injure the aortic wall",
          ],
          answer: 2,
          explanation:
            "Snare size follows the space that holds the device: 2–4 mm in the coronaries, 27–45 or 18–30 mm in the aorta. Brilakis's choice for stents in the peripheral circulation is the 18–30 mm three-loop snare through a JR4 or multipurpose catheter, used with care because its wires can injure the vessel. Small coronary loops cannot encircle a device lying free in the aorta.",
        },
        { kind: "h", text: "Loading and closing a snare" },
        {
          kind: "steps",
          items: [
            { title: "1. Discard the delivery sheath, keep the collapsing tool", detail: "Each snare comes with a delivery sheath that is usually thrown away, because the snare goes through your own diagnostic or guide catheter. Keep the collapsing (introducer) tool: you will need it to reload the snare if it has to come out and go back in." },
            { title: "2. Collapse and load", detail: "Pull the snare back into the introducer so the loop folds, insert the introducer into the catheter, and push the snare on until it comes out of the catheter tip." },
            { title: "3. Open it beside the device", detail: "Position the open loop close to the lost device and work it around the device." },
            { title: "4. Close the loop against the catheter tip", detail: "In general, Brilakis draws the snare back into the catheter until the device is caught between loop and catheter tip. For a stent in a coronary artery he does the reverse: keeping the snare wire fixed, he pushes its catheter forward until the loop tightens round the stent. Either way, the device ends up gripped against the catheter tip before anything is withdrawn." },
            { title: "5. Withdraw as one", detail: "Pull catheter, snare and device back together. For a stent snared in a coronary artery, Brilakis withdraws the whole assembly into the guide." },
          ],
        },
        { kind: "tip", id: "pci-snare-close-and-withdraw" },
        { kind: "h", text: "When no snare is on the shelf" },
        {
          kind: "steps",
          items: [
            { title: "Wire-and-catheter loop", detail: "Pass an exchange-length 0.014 inch coronary wire through a multipurpose catheter, then bring its tip back and reinsert it into the catheter's distal tip, so that a loop of wire stands out of the end of the catheter (Brilakis Fig. 30.115)." },
            { title: "The guide extension snare ('KAM-snare')", detail: "Load a wire into the rapid-exchange lumen of an ordinary angioplasty balloon and shape its distal end into a loop. Introduce the looped wire and the balloon into a guide extension so that the balloon, inflated at 8–12 atm in the distal part of the extension, traps the returning end of the wire. Pushing or pulling the proximal end of the wire outside the patient then opens or closes the loop (Brilakis Fig. 30.116)." },
          ],
        },
        { kind: "tip", id: "pci-snare-homemade" },
        { kind: "h", text: "What snares are used for" },
        {
          kind: "table",
          caption: "Snaring across the manuals",
          head: ["Problem", "How the snare is used", "Where taught"],
          rows: [
            ["Stent lost in a coronary or peripheral artery", "Small coronary snares in the coronaries; a large three-loop snare in the aorta and peripheries", "Lesson 1 of this module (Brilakis 27.1)"],
            ["Stent deployed too far out of an aorto-ostial lesion", "If a long portion protrudes into the aorta (Brilakis 10.2), or more than 50% lies outside the ostium (15.1), it can sometimes be snared and removed, at a risk of coronary injury and of embolising the stent", "cp-ostial"],
            ["Wire fragment, or unravelled wire", "Small coronary snares for a clean fragment; a snare can break an unravelled wire at the ostium; a large loop in the aorta can catch the free proximal end", "Lesson 2 of this module (27.2)"],
            ["Trapped balloon or broken balloon or microcatheter shaft", "Bring the snare loop right up to the device, close it and pull back", "Lesson 3 of this module (27.3, 27.4)"],
            ["Trapped atherectomy burr", "A snare can be advanced over the drive shaft", "cp-calcium (19.9)"],
            ["Kinked catheter", "From a second arterial access, snare the tip of the kinked catheter to straighten the kink and help untwist it; snares also retrieve fragments if the catheter breaks", "pm-engaging (5.7)"],
            ["Knotted catheter (Oxford)", "Get expert help and do not pull the knot tight; careful advancement of a wire can sometimes undo it; otherwise it may be pulled tight to make it small and the whole system removed with the sheath, which can cause significant bleeding and need surgical repair. Snares and forceps are the percutaneous alternatives, and surgical removal is well described", "Oxford ch 4 (right heart catheterisation)"],
            ["Retrograde CTO PCI", "Capturing the retrograde wire for externalisation", "cp-cto-retrograde"],
          ],
        },
        {
          kind: "check",
          stem: "A stent has been deployed in an aorto-ostial RCA lesion, and fluoroscopy in two views shows that well over half of it lies in the aorta. Flow is normal. What does Brilakis say about snaring it?",
          options: [
            "It is never possible to snare a deployed stent, so the only options are flaring or surgery",
            "It can sometimes be snared and removed, but at a risk of coronary injury and of embolising the stent",
            "It should always be snared at once, because a protruding stent is safer removed than left",
            "It can be snared safely only with a 2 mm coronary microsnare passed through the stent struts",
          ],
          answer: 1,
          explanation:
            "Brilakis 15.1: when more than half of the stent lies outside the ostium, snaring and removing it is sometimes possible, accepting the risks of coronary injury and stent embolisation. His other solutions for an overhanging stent are flaring it with a short oversized balloon or a dedicated ostial balloon, and considering prolonged DAPT (cp-ostial).",
        },
        {
          kind: "p",
          text: "**Other retrieval tools.** In Brilakis's 2005 series, retrieval of lost stents was attempted in 35 of 38 patients and succeeded in 30 (86%). The methods used were the small-balloon technique (45%), loop snares (26%), biliary forceps (12%), a retained-fragment retriever (10%), wire twirling (5%) and a basket (2%), with more than one method in some cases. Eggebrecht's earlier series succeeded with low-profile 1.5 mm balloons in 7 of 10 attempts and with biopsy forceps or a single-loop snare in 3 of 7 (overall percutaneous success 10 of 14), and its authors judged the balloon readily available, technically familiar and relatively successful.",
        },
        {
          kind: "p",
          text: "**Have the kit, and know it.** Brilakis keeps all the CTO and complex PCI equipment, including the complication kit, on a dedicated cart that is restocked regularly, available during the procedure and known to both operators and laboratory staff. He also accepts that covered stents and coils will sometimes expire on the shelf, given how rarely they are needed; the operator should still know each item's strengths and limits and be willing to use it.",
        },
        {
          kind: "pitfalls",
          items: [
            "Trying to catch a device in the aorta with a small coronary loop, or opening a large loop in a coronary artery.",
            "Throwing away the collapsing tool, so the snare cannot be reloaded.",
            "Pulling catheter and snare out of the body before the device is gripped against the catheter tip; close the loop first, by drawing the snare into the catheter or, for a coronary stent, advancing the catheter over the held snare wire.",
            "Forgetting that the wires of a large snare can injure the vessel.",
            "Not knowing where the snares are kept, or which catheters they fit, until the day they are needed.",
          ],
        },
        {
          kind: "pearl",
          text: "When a small coronary snare cannot bring a device home, a second snare can be tried: in Brilakis Fig. 27.5 a three-loop snare succeeded after a microsnare had left the stent partly in the aorta. Snares can also be combined. In Fig. 27.15 a 20 mm snare mounted inside a 2 mm one caught the free end of an unravelled wire in the aorta, and the small loop, run along the wire to the ostium, gripped it there so that it broke at that point.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, plan how you would deliver a large snare to the aorta: through a diagnostic or guide catheter with a JR4 or multipurpose curve, with a second arterial access if the first is occupied. Name the loop size you would pick for a stent lost in the aorta (27–45 or 18–30 mm) compared with one in a coronary artery (2–4 mm).",
        },
        { kind: "video", id: "wJ0if-5OEfM", note: "Brilakis channel: how to create a 'homemade' snare." },
        { kind: "video", id: "_gNLUyKe-Xg", note: "Case 48 from the Manual of PCI: guide catheter fracture." },
        { kind: "video", id: "MG8W3F3qGa8", note: "Case 77 from the Manual of PCI: snaring for treating ventricular tachycardia." },
        { kind: "video", id: "UXZSq2Sp4a8", note: "Case 77 from the Manual of CTO Interventions: wire snaring and externalisation." },
        {
          kind: "keypoints",
          items: [
            "Snares, with covered stents, coils, plugs and the pericardiocentesis tray, must be in every laboratory and on a cart the team knows.",
            "Size the snare to the space: 2–4 mm in coronaries; 27–45 or 18–30 mm in the aorta.",
            "Three-loop snares capture more readily than single-loop ones; large loops can still injure the vessel.",
            "Load with the collapsing tool (keep it), open beside the device, close by advancing the catheter (or drawing the loop into it), and withdraw everything together.",
            "No snare: make one from an exchange-length wire looped back into a multipurpose catheter, or a wire loop trapped by a balloon at 8–12 atm in a guide extension.",
            "Snares retrieve stents, wire and balloon fragments, burrs and fragments of broken catheters, straighten kinked catheters from a second access, and capture wires in retrograde CTO PCI.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cm-equipment-loss-q1",
      stem: "In the series of 2,338 consecutive PCIs reported from Brilakis's group (Iturbe 2012), how did device loss and device entrapment compare?",
      options: [
        "Entrapment was more common than loss, and both were usually managed percutaneously without the need for any surgery",
        "Loss was always managed percutaneously, whereas most entrapments needed emergency surgery and bypass grafting",
        "Loss and entrapment were equally common, and each needed surgery in roughly half of the patients concerned",
        "Both were managed percutaneously in every case, because snares were available for every device involved",
      ],
      answer: 1,
      explanation:
        "Devices were lost in 9 procedures (0.38%) and entrapped in 4 (0.17%). All losses were managed percutaneously; 3 of the 4 entrapments needed emergency surgical removal and CABG. That is why Brilakis calls entrapment the graver complication.",
      difficulty: 1,
      refs: ["iturbe-device-loss-2012", "brilakis-manual-pci"],
    },
    {
      id: "cm-equipment-loss-q2",
      stem: "Which of these is NOT among Brilakis's causes of stent loss?",
      options: [
        "Stenting directly without pre-dilatation in a tortuous calcified artery",
        "Using small guides such as 5 Fr for complex lesions",
        "Applying suction through the indeflator with a contemporary stent",
        "Advancing a stent through a stent that has already been deployed",
      ],
      answer: 2,
      explanation:
        "Brilakis notes that many operators avoid suction through the indeflator for fear of dislodging the stent, but that with contemporary stents the risk is very low and suction can usually be applied. Direct stenting, small guides and passing a stent through a deployed stent are all on his list of causes, with poor preparation, tortuosity and calcium, forceful withdrawal, guide extensions and delivery through collaterals.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q3",
      stem: "A small balloon has been passed through a lost stent (wire still through it) and inflated distal to it. On withdrawal the crumpled stent catches at the tip of the guide and will not enter. What is the right move?",
      options: [
        "Deflate the balloon and pull it into the guide, then go back for the stent with a coronary microsnare",
        "Keep the balloon inflated and remove balloon, stent and guide from the body together",
        "Push the stent back into the artery and deploy it there with progressively larger balloons",
        "Exchange the guide over the wire for a larger one while leaving the stent at the ostium",
      ],
      answer: 1,
      explanation:
        "Brilakis: the stent is often too deformed to enter the guide, and then the inflated balloon, lost stent and guide are all removed together. Deflating the balloon releases the stent, which may then embolise. Exchanging the guide around a stent sitting at the ostium invites losing it.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q4",
      stem: "During femoral PCI a stent comes off its balloon, is drawn out of the coronary with the guide and is lost from it on the way back. Fluoroscopy finds it in a small branch of the femoral artery. The leg is warm with normal pulses. What does Brilakis advise?",
      options: [
        "Leave it: stents embolised into small distal branches have had a benign course, and extraction usually carries more risk",
        "Retrieve it with a large three-loop snare from the other groin, because a lost stent must always be brought out of the body",
        "Crush it against the wall of the branch with a peripheral stent, since that is how every stent outside the coronaries is managed",
        "Refer for surgical removal, because a stent that has reached a peripheral artery cannot be snared or crushed by catheter",
      ],
      answer: 0,
      explanation:
        "In a non-critical peripheral site the risks of retrieval often outweigh any benefit (27.1.3.2), and a stent embolised into a small branch such as a femoral branch may be left: none of 12 such patients in three series had consequences (27.1.3.11). Crushing with a peripheral stent is for a stent pulled back into the iliac or femoral artery itself that cannot come out through the sheath, and retrieval is required only in critical peripheral arteries such as the cerebral or renal arteries.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q5",
      stem: "A 4.0 × 12 mm stent, chosen for a 4.0 mm left main, comes off its balloon there with the wire still through it. It lies wholly within the left main shaft, clear of the ostium and the bifurcation. Retrieval with the small-balloon technique, snaring and wire twirling have all failed, and the patient is stable with normal flow. What does Brilakis's algorithm say next?",
      options: [
        "Reassess whether retrieval is still needed: if not, deploy it; if it is, emergency surgery",
        "Crush it against the left main wall at once, since the wire is still through it",
        "Leave the stent loose in the left main and finish the procedure, as it will endothelialise",
        "Remove the wire and try twirling again with three new wires instead of two",
      ],
      answer: 0,
      explanation:
        "After failed retrieval, the algorithm reassesses the need to retrieve, weighing further attempts and surgery against deploying or crushing; in most cases deploying or crushing is fastest and safest. With the wire through the stent, deployment is the route. Crushing is the route when the wire has been lost; in a critical site such as the left main it is not the first choice, but after failed retrieval Brilakis lists deploying or crushing as the usual alternatives to surgery. Deployment means expanding the lost stent with progressively larger balloons until expansion is optimised (27.1.3.9); it is realistic here because the stent was sized for this left main and lies within its shaft. A lost stent in a coronary artery must be retrieved, deployed or crushed, never left loose.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q6",
      stem: "A guidewire jailed behind an LAD stent will not come out. A microcatheter has been advanced over it as far as it will go and gentle traction has failed. What comes next in Brilakis's entrapment algorithm?",
      options: [
        "Pull hard with the microcatheter in place, because a clean fracture is likely",
        "Take a balloon as far down the trapped wire as it will go, inflate it, then pull gently",
        "Cut the wire at the Y-connector and leave it, as jailed wires do not cause problems",
        "Rotate the wire in one direction until it unwinds itself from the stent struts",
      ],
      answer: 1,
      explanation:
        "The order is: do not pull hard; microcatheter or balloon over the wire and gentle traction; inflate a balloon on it and pull gently (which frees most wires); second wire and balloon beside it; then surgery. A hard pull with a catheter in place is the 'last straw' before surgery, not the third step.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q7",
      stem: "A wire fractures during PCI of a proximal LAD lesion. Intravascular ultrasound shows that the distal coil has unravelled and the unravelled wire runs back through the left main into the aortic root. What does Brilakis recommend?",
      options: [
        "Retrieve the unravelled coil by repeated snaring until every piece of it is out of the coronary tree and aorta",
        "Twirl two new wires around the coil to wind it up and withdraw it through the guide",
        "Leave it in place, because unravelled coils endothelialise like clean fragments do",
        "Emergency surgery, unless the wire can be snared and broken at the ostium and the remaining fragment stented",
      ],
      answer: 3,
      explanation:
        "Unravelled fragments reaching the aorta, or lying in the left main or a major bifurcation, need emergency surgery to remove them and to prevent thromboembolism. Attempts to pull unravelled fragments out should generally be avoided, because they unravel further. The percutaneous alternative to surgery is to snare the wire and break it as close to the ostium as possible, then stent over the remaining fragment; in Brilakis Fig. 27.15 this removed the unravelled length, and the wire left behind was stented over.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q8",
      stem: "A 2.5 mm balloon will not deflate in a 3.5 mm RCA. Pulling on the indeflator achieves nothing. Which step comes first in Brilakis's failure-to-deflate sequence?",
      options: [
        "Swap to a fresh indeflator, preferably primed with saline, or a saline luer-lock syringe",
        "Puncture the balloon at once with a stiff wire passed through an over-the-wire balloon beside it",
        "Inflate it at high pressure until it bursts, because it is smaller than the vessel",
        "Refer for emergency surgery, because a balloon that will not deflate cannot be removed",
      ],
      answer: 0,
      explanation:
        "The sequence is another indeflator (or saline syringe), then withdrawal without deflation if the balloon is smaller than the vessel, then inflation to rupture if it is smaller than the vessel, then puncture through an over-the-wire balloon inflated at 2–4 atm or through a guide extension, and surgery last. Bursting and puncture are later steps.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q9",
      stem: "Why does Brilakis prefer a guide extension with its own trapping balloon when trapping is likely to be needed?",
      options: [
        "Because standard guide extensions cannot be used with any kind of trapping balloon in any size of guide catheter",
        "Because trapping through a standard extension needs the balloon proximal to its collar and the gear pulled back there",
        "Because standard guide extensions have no proximal collar, so trapped equipment slides out of the guide",
        "Because a trapping balloon inflated inside a standard extension perforates its cylinder at pressures above 8 atm",
      ],
      answer: 1,
      explanation:
        "Brilakis explains that trapping through a standard guide extension is difficult for two reasons: the trapping balloon has to lie proximal to the extension's proximal collar, and the equipment must be withdrawn to that location. A guide extension with a built-in trapping balloon avoids both. The other options are not stated anywhere in the manuals.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q10",
      stem: "A microcatheter is being torqued through a heavily calcified lesion. Which practice does Brilakis recommend to avoid entrapment and fracture?",
      options: [
        "Rotate it freely in one direction until it crosses, then reverse the same number of turns",
        "Remove the wire while torquing, so the microcatheter is more flexible in the calcium",
        "Turn it no more than 10 times before letting it unwind, and keep a wire inside it",
        "Use the softest low-profile microcatheter available, because a soft tip cannot fracture",
      ],
      answer: 2,
      explanation:
        "Brilakis limits rotation to 10 turns, after which the catheter is allowed to unwind, and wants a wire inside it at all times so that it does not kink and become trapped. Over-rotation weakens the catheter and can break its tip or shaft. Soft-tip low-profile microcatheters are not designed for aggressive torquing, and he advises against the one he discusses for balloon-uncrossable lesions.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-equipment-loss-q11",
      stem: "A kinked balloon shaft breaks during withdrawal. Laid beside an intact balloon of the same model, the retrieved piece shows that the break lies beyond the guide tip, so the whole fragment is in the RCA. Which step comes first?",
      options: [
        "Capture the fragment with a small coronary snare and withdraw it, keeping wire-and-balloon dilatation for a failed snare",
        "Inflate a second balloon at 20 atm or more inside the guide beside the fragment and withdraw guide and fragment together",
        "Pass a wire round the fragment through a second guide and dilate beside it to free it, before any attempt to snare it",
        "Refer for emergency surgery, because a fragment that lies wholly in the coronary cannot be retrieved by catheter",
      ],
      answer: 0,
      explanation:
        "Brilakis's first question after a shaft fracture is whether part of the fragment is still inside the guide. Here nothing is, so trapping inside the guide cannot grip it, and the next step is to snare it (his Fig. 27.16 shows a distal shaft piece snared out of the RCA). If snaring fails, a wire is passed round the fragment, usually through a second guide, and a balloon dilated beside it; surgery comes only after that.",
      difficulty: 3,
      refs: [...BRILAKIS, "iturbe-device-loss-2012"],
    },
    {
      id: "cm-equipment-loss-q12",
      stem: "No commercial snare is available in the laboratory and a lost device has to be snared. Which improvised snare does Brilakis describe?",
      options: [
        "A biopsy forceps passed through the guide and opened beside the fragment at the ostium",
        "An exchange-length wire passed through a multipurpose catheter with its tip reinserted into the catheter",
        "A pigtail catheter rotated beside the fragment until the fragment is wound round its curl and can be withdrawn",
        "A cutting balloon inflated beside the fragment at high pressure to grip it with its blades",
      ],
      answer: 1,
      explanation:
        "Brilakis gives two homemade snares: an exchange-length 0.014 inch wire through a multipurpose catheter, with its tip reinserted into the catheter's distal end to form a loop, and the guide extension snare, a wire loop trapped by a balloon inflated at 8–12 atm in the distal part of a guide extension. Forceps appear in published retrieval series but are not his homemade snare.",
      difficulty: 2,
      refs: [...BRILAKIS, "brilakis-stent-loss-2005"],
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Expand calcified segments without very high balloon pressures, then rehearse the trapping manoeuvre and the failure-to-deflate sequence aloud." },
    { sim: "procedure", task: "Plan how to deliver a large snare to the aorta (a diagnostic or guide catheter with a JR4 or multipurpose curve, with a second arterial access if the first is occupied) and choose the loop size for a device in the aorta compared with one in a coronary artery." },
  ],
  caseIds: ["cm-equipment-loss-case-stent-rca", "cm-equipment-loss-case-jailed-wire"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cm-equipment-loss-case-stent-rca",
    title: "A stent stripped off its balloon in a calcified RCA",
    trackId: "complication-management",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 27.1 (stent loss: causes, prevention, the Fig. 27.2 algorithm, small-balloon technique, deployment, crushing), 10.2.8.4.3, 30.3.3 and 30.3.4 (guide extension handling and complications).",
    },
    summary:
      "A stent deformed at a guide extension and stripped off its balloon in the proximal RCA: keeping the wire, deciding that this is a non-critical segment where deployment beats retrieval, switching to crushing when no balloon will enter, recognising a wire through the struts, and finishing with full apposition.",
    presentation:
      "A 72-year-old woman with angina on minimal exertion despite two anti-anginal drugs. Right femoral access, 7 Fr JR4 guide. The RCA is tortuous and heavily calcified, with a 90% stenosis in the mid vessel. After pre-dilatation with a 2.5 mm non-compliant balloon (which still showed a waist), a 3.0 × 28 mm stent would not pass the proximal bend. A guide extension was placed in the proximal RCA; the stent caught at its collar, was pushed, and on withdrawal came back without the stent.",
    findings: [
      "The undeployed stent lies in the proximal-to-mid RCA, overlapping the proximal shoulder of the target lesion; its proximal end looks crumpled",
      "The guidewire still runs through the stent to the distal RCA",
      "TIMI 3 flow; no chest pain; BP 136/74 mmHg, heart rate 70 bpm, sinus rhythm",
      "ACT 290 s",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The empty stent balloon is out of the patient. What do you do first?",
        options: [
          {
            text: "Stop all manipulation, hold the wire exactly where it is, tell the team, and locate the stent in two views (intravascular ultrasound if it is hard to see)",
            best: true,
            feedback:
              "The wire through the lost stent is the rail for the small-balloon technique and for deployment, and Brilakis's algorithm starts with where the stent is. Thin-strut stents can be hard to see, and he uses IVUS to find them.",
          },
          {
            text: "Pull the wire and the guide extension back to the guide so that you can start again with a clean set-up",
            feedback:
              "Once the wire is out of the stent, rewiring it is often impossible: the stent can then only be snared, twirled or crushed.",
            next: "c-wire-lost",
            stateDelta: { stability: -15, flags: ["wire-lost"] },
          },
          {
            text: "Advance a second stent over the wire to push the lost one into the lesion and deploy both together",
            feedback:
              "Pushing new hardware into a crumpled stent risks driving it distally or catching it; nothing in the algorithm uses another stent as a pusher.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The stent lies across the proximal shoulder of the lesion, which needs a stent anyway, with the wire through it. Which branch of the algorithm do you take?",
        info: "Proximal-to-mid RCA, no major side branch at this point. The patient remains stable.",
        options: [
          {
            text: "This is a non-critical coronary segment with the wire through the stent: deploy it, starting with a small balloon and working up",
            best: true,
            feedback:
              "Brilakis: not every lost stent has to come out. With the wire still through it in a non-critical segment, expanding it in place, small balloon first and then larger ones, is often quicker and safer.",
          },
          {
            text: "Retrieve it with the small-balloon technique and bring balloon, stent and guide out together if needed",
            acceptable: true,
            feedback:
              "A reasonable technique when the wire is through the stent, and the one to use in a critical site. Here, though, retrieval is not required and deployment is usually quicker and safer.",
          },
          {
            text: "Call the surgeons for emergency removal of the lost stent",
            feedback:
              "Surgery comes only after failed retrieval when retrieval is still essential. Brilakis calls surgical retrieval challenging and high-risk.",
            next: "c-surgery",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "A 1.5 mm balloon will not enter the crumpled proximal end of the stent. With each push the stent moves a few millimetres down the vessel. What now?",
        options: [
          {
            text: "Stop pushing: a stent that no balloon can enter is usually deformed, so change plan to crushing it against the wall and covering it with a new stent",
            best: true,
            feedback:
              "Brilakis warns that advancing a balloon into a lost stent can displace it distally, and that if a balloon cannot pass through it (usually because it is deformed), the stent can be crushed instead.",
          },
          {
            text: "Use a stiffer, higher-profile balloon and push harder to force it into the stent",
            feedback: "More force drives the stent further into the tortuous, calcified distal RCA.",
            next: "c-pushed-distal",
            stateDelta: { stability: -15, flags: ["stent-displaced"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "You advance a second wire past the outside of the lost stent, keeping the original wire in place until the new one is safely distal, then withdraw the original wire so the crush can begin. A 2.0 mm balloon over the new wire stops at the lost stent and will not pass. What is the likely problem?",
        options: [
          {
            text: "Suspect that the new wire has gone through the lost stent's struts; rewire, ideally with a knuckled polymer-jacketed wire",
            best: true,
            feedback:
              "Brilakis: difficult balloon delivery around a lost stent should raise the suspicion that the wire has passed through struts, and the answer is to rewire, ideally with a knuckle. If it is still difficult, rewire again or use a bevelled-tip balloon made to cross struts or a support wire with a wavy distal segment.",
          },
          {
            text: "Inflate the 2.0 mm balloon where it has stopped, at high pressure, to make a path",
            feedback: "If the wire is through the struts, inflating here deforms the lost stent further and can trap the balloon.",
            next: "c-strut",
            stateDelta: { stability: -15, flags: ["strut-inflation"] },
          },
          {
            text: "Abandon PCI and refer for bypass surgery now",
            feedback: "Premature: the crush has not yet been attempted with a correctly placed wire, and the patient is stable.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After a knuckled wire passes alongside, a balloon crushes the lost stent and a 3.5 × 32 mm stent is deployed across it and the lesion. How do you finish?",
        info: "Angiography looks good. IVUS shows the crushed struts lying against the wall over most of the length, but a short segment of incomplete apposition and underexpansion at the calcified mid segment.",
        options: [
          {
            text: "Post-dilate with a non-compliant balloon guided by IVUS until the struts are fully apposed and the stent well expanded",
            best: true,
            feedback:
              "Before the covering stent, the calcified mid segment should have been shown to expand fully on a non-compliant balloon or IVUS (Brilakis 27.1.2); the underexpansion here is the cost of skipping that step. Brilakis asks for meticulous apposition of the crushed struts so that they do not limit flow, ideally checked with intracoronary imaging. Crushing and deploying carry a restenosis risk, which he judges much lower than the risk of aggressive retrieval. For underexpansion he allows longer inflations and higher pressures, up to 26–28 atm with non-compliant balloons (10.2.9.2). If the calcified segment still will not expand, escalate as pm-prep-and-stent and cp-calcium teach for underexpansion, and remember that the root cause here was calcium that had not been prepared.",
          },
          {
            text: "Accept the angiographic result; IVUS findings of this kind do not matter after a crush",
            feedback: "Struts left away from the wall can limit flow, and underexpansion over crushed metal invites restenosis.",
            stateDelta: { stability: -10, flags: ["malapposed"] },
          },
        ],
      },
      {
        id: "c-wire-lost",
        kind: "consequence",
        prompt: "With the wire out, the stent lies loose in the proximal RCA. Attempts to rewire through it fail. What now?",
        options: [
          {
            text: "Retrieval is not essential in this segment, so crush it: wire around the outside, balloon to crush, new stent to cover",
            best: true,
            feedback:
              "With the wire lost, a stent that does not need retrieving can only be crushed, because deployment needs a wire through the stent.",
            next: "c-crush-new-wire",
            stateDelta: { stability: 5 },
          },
          {
            text: "Snare it with a 2–4 mm coronary snare and bring it out",
            acceptable: true,
            feedback:
              "A valid retrieval route when the wire is lost, but here retrieval is not needed and crushing is usually faster and safer. In this case the snare cannot grip the crumpled stent in the bend, so you move to crushing.",
            next: "c-crush-new-wire",
          },
          {
            text: "Keep trying to rewire through the stent so that it can be deployed",
            feedback: "Brilakis: after the wire has come out, getting a new one back through the lost stent often cannot be done; persisting adds time, contrast and risk. You move to crushing.",
            next: "c-crush-new-wire",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-crush-new-wire",
        kind: "consequence",
        prompt: "You advance a new wire past the outside of the lost stent for the crush. A 2.0 mm balloon over it stops at the lost stent and will not pass. What is the likely problem?",
        options: [
          {
            text: "Suspect that the new wire has gone through the lost stent's struts; rewire, ideally with a knuckled polymer-jacketed wire",
            best: true,
            feedback:
              "Brilakis: when a balloon is hard to deliver around a lost stent, suspect that the wire has passed through its struts, and rewire, ideally with a knuckle. If it is still difficult, rewire again or use a bevelled-tip balloon made to cross struts or a support wire with a wavy distal segment.",
            next: "s5",
          },
          {
            text: "Inflate the 2.0 mm balloon where it has stopped, at high pressure, to make a path",
            feedback: "If the wire is through the struts, inflating here deforms the lost stent further and can trap the balloon.",
            next: "c-strut",
            stateDelta: { stability: -15, flags: ["strut-inflation"] },
          },
        ],
      },
      {
        id: "c-surgery",
        kind: "consequence",
        prompt: "The surgeon asks why the stent cannot be dealt with in the laboratory. What is the right answer?",
        options: [
          {
            text: "It can: the segment is non-critical and the wire is through the stent, so deploying it in place is the next step",
            best: true,
            feedback: "Surgical retrieval is high-risk and is kept for failed retrieval when retrieval is still required.",
            next: "s3",
            stateDelta: { stability: 5 },
          },
          {
            text: "Lost stents always need surgery",
            feedback: "Most are managed percutaneously; in Brilakis's group's series every lost device was.",
            next: "s3",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-pushed-distal",
        kind: "consequence",
        prompt: "The stent has been pushed into the mid-RCA bend and is now more deformed. The wire is still through it. What now?",
        options: [
          {
            text: "Stop pushing and crush it where it lies, with a second wire round the outside and a new stent over it",
            best: true,
            feedback: "A stent no balloon can enter is crushed. The distal displacement is the warning Brilakis gives about forcing a balloon into a lost stent.",
            next: "s4",
            stateDelta: { stability: 5 },
          },
          {
            text: "Try an even larger balloon from the same position",
            feedback: "More force, more displacement.",
            next: "s4",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-strut",
        kind: "consequence",
        prompt: "The balloon inflates partly inside the lost stent's struts and now drags on withdrawal. What do you do?",
        options: [
          {
            text: "Deflate fully, withdraw gently with the guide coaxial, then rewire outside the stent with a knuckled polymer-jacketed wire",
            best: true,
            feedback: "Take the wire out of the struts and start the crush again with a wire that is truly outside the lost stent.",
            next: "s5",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull the balloon back hard",
            feedback: "A hard pull on a balloon caught in struts risks entrapment of the balloon and further stent deformation.",
            next: "s5",
            stateDelta: { stability: -10, flags: ["balloon-caught"] },
          },
        ],
      },
    ],
    outcome:
      "The lost stent was crushed against the wall and covered, the lesion was treated, and IVUS-guided post-dilatation achieved full apposition. The patient left the laboratory free of pain with TIMI 3 flow.",
    outcomeVariants: [
      { flag: "wire-lost", text: "Losing the wire took away the option of deploying the stent and committed the case to a crush over a new wire passed outside the stent, with the extra risk of that wire passing through the struts." },
      { flag: "stent-displaced", text: "Forcing a balloon pushed the stent deeper into the tortuous calcified segment, making the crush longer and harder." },
      { flag: "strut-inflation", text: "Inflating over a wire that had passed through the struts deformed the lost stent further before the wire was corrected." },
      { flag: "malapposed", text: "Leaving malapposed struts and an underexpanded segment over crushed metal raises the risk of restenosis and thrombosis." },
      { flag: "balloon-caught", text: "A hard pull on a balloon caught in struts risked turning a lost stent into an entrapped balloon." },
    ],
    learningPoints: [
      "Keep the wire through a lost stent: it is the rail for retrieval with a small balloon and for deployment.",
      "Ask where the stent is and whether it must come out: in a non-critical coronary segment, deploying or crushing is usually faster and safer than retrieval.",
      "Do not force a balloon into a lost stent; if none will enter, crush it.",
      "When crushing, a balloon that will not pass alongside means the wire may be through the struts: rewire, ideally with a knuckle.",
      "Finish with full apposition, ideally confirmed with intravascular imaging.",
      "Prevention: prepare calcium properly, and never push a stent against a guide extension collar.",
    ],
    refs: [...BRILAKIS, "brilakis-stent-loss-2005", "iturbe-device-loss-2012"],
  },
  {
    id: "cm-equipment-loss-case-jailed-wire",
    title: "A jailed diagonal wire that will not come out",
    trackId: "complication-management",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 27.2 (guidewire entrapment and fracture, Fig. 27.10 algorithm), 16.2 (removing a jailed wire) and Fig. 27.15 (snaring an unravelled wire).",
    },
    summary:
      "Provisional stenting of an LAD-diagonal bifurcation with a jailed diagonal wire that sticks: gentle traction, a catheter to the trap, a balloon on the wire, repeat POT, and what to do when a hard pull breaks the wire and its coil unravels back into the left main.",
    presentation:
      "A 63-year-old man with exertional angina and a Medina 1,1,0 bifurcation of the proximal LAD and a large first diagonal. Right radial, 6 Fr EBU 3.5 guide. Both branches were wired with workhorse wires. A 3.5 × 24 mm stent was deployed in the LAD across the diagonal, jailing the diagonal wire over about 2 cm, and POT was performed. The diagonal ostium was then pinched, with reduced flow, so the diagonal was rewired through a distal strut and a balloon confirmed the new position.",
    findings: [
      "TIMI 3 flow in the LAD and diagonal",
      "The jailed diagonal wire does not move with gentle traction",
      "BP 128/76 mmHg, heart rate 68 bpm, no chest pain",
      "ACT 300 s",
    ],
    steps: [
      {
        id: "s1",
        prompt: "You pull on the jailed wire, harder with each attempt, and the guide starts to dive into the left main. What do you do?",
        options: [
          {
            text: "Stop pulling hard; keep only gentle constant traction, watch the guide position, and plan the next step",
            best: true,
            feedback:
              "Brilakis: do not pull hard. Pulling hard risks fracture and unravelling, and drags the guide deep into the artery, risking a guide-induced dissection.",
          },
          {
            text: "Give a firm, quick pull before the guide has time to follow the wire",
            feedback: "This is exactly the hard pull Brilakis warns against.",
            next: "c-fracture",
            stateDelta: { stability: -20, flags: ["wire-fractured"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "What is the next step to free the wire?",
        options: [
          {
            text: "Advance a microcatheter or small balloon over the jailed wire as far as it will go, then pull the wire gently",
            best: true,
            feedback: "Bringing a catheter up to the trap concentrates the force where the wire is held.",
          },
          {
            text: "Rotate the jailed wire gently with a torquer while keeping light traction",
            acceptable: true,
            feedback: "Brilakis lists rotation with a torquer among the things that may help a jailed wire, but bringing a catheter up to the trap is the core step of his algorithm.",
          },
          {
            text: "Cut the wire at the Y-connector and leave it, since jailed wires are harmless",
            feedback: "Cutting the wire and leaving it is not an option in Brilakis's entrapment algorithm, whose steps are a catheter to the trap, a balloon on the wire, a second wire and balloon, then surgery.",
            next: "c-cut",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The microcatheter reaches the stent edge, but gentle traction still does not free the wire. What now?",
        options: [
          {
            text: "Advance a small balloon as far distally as possible over the jailed wire, inflate it, then pull gently; repeat POT afterwards",
            best: true,
            feedback: "In most cases inflating a balloon on the trapped wire releases it (Brilakis 27.2), and POT is repeated after a jailed wire is freed this way (16.2).",
          },
          {
            text: "Pull hard now that the microcatheter is in place",
            feedback: "Brilakis keeps a hard pull with a catheter in place as the 'last straw' before surgery, not the third step.",
            next: "c-fracture",
            stateDelta: { stability: -20, flags: ["wire-fractured"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The wire comes free with gentle traction after the balloon inflation. What do you check before you finish?",
        options: [
          {
            text: "Inspect the removed wire for an intact tip, repeat POT, and image the LAD stent and the diagonal ostium in two views",
            best: true,
            feedback:
              "A wire that has been trapped may have been damaged, and the stent may have been disturbed; POT is repeated afterwards. If the tip were missing, the fracture algorithm would apply.",
          },
          {
            text: "Finish without further imaging; the wire came out, so nothing else can have happened",
            feedback: "Freeing a jailed wire can disturb the stent; Brilakis repeats POT afterwards.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Looking back, which habit before jailing would most have reduced the risk?",
        options: [
          {
            text: "A straight tip, the radiopaque segment kept out of the jail, and as short a jailed length as possible",
            best: true,
            feedback:
              "Brilakis's jailing advice: straighten the tip (a looped tip can tangle in the stent), do not jail across the radiopaque portion (fracture risk), and avoid jailing long segments.",
          },
          {
            text: "Never jail a side-branch wire",
            feedback:
              "Some advocate this, but Brilakis judges the risk of side-branch occlusion greater than the risk of entrapment in most cases (cp-bifurcation-provisional).",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-fracture",
        kind: "consequence",
        prompt: "The wire breaks. Part comes out; fluoroscopy shows wire material running from the diagonal, behind the LAD stent struts, into the left main. What is your first step?",
        options: [
          {
            text: "Intravascular ultrasound to see whether the coil has unravelled and where the fragments lie",
            best: true,
            feedback: "Brilakis's fracture algorithm begins with one question: has the coil unravelled? IVUS answers it.",
            next: "c-unravelled",
            stateDelta: { stability: 5 },
          },
          {
            text: "Snare the fragments repeatedly until everything is out",
            feedback: "If the coil has unravelled, retrieval attempts generally unravel it further.",
            next: "c-unravelled",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-unravelled",
        kind: "consequence",
        prompt: "IVUS shows an unravelled coil running from the diagonal, behind the LAD stent struts, into the left main, and its proximal end lies in the aortic root. What now?",
        info: "TIMI 3 flow; the patient is stable.",
        options: [
          {
            text: "Involve the surgeons now: unravelled wire reaching the aorta and lying in the left main needs emergency surgery, unless a snare can break the wire at the ostium so that the remaining fragment can be stented",
            best: true,
            feedback:
              "Fragments in the aorta or a critical location need surgery to remove them and to prevent coronary and systemic thromboembolism. The percutaneous alternative is to snare the wire and break it as close to the ostium as possible, then stent over what remains; in Brilakis Fig. 27.15 this removed the unravelled wire, and the wire left behind was stented over (panel L shows the final result).",
            next: "s5",
            stateDelta: { stability: 5 },
          },
          {
            text: "Leave the coil in place and finish, because coils endothelialise",
            feedback: "An unravelled 'bird's nest' predisposes to thrombosis; leaving it in the left main and aorta is not an option.",
            next: "s5",
            stateDelta: { stability: -15, flags: ["coil-left"] },
          },
        ],
      },
      {
        id: "c-cut",
        kind: "consequence",
        prompt: "Your consultant stops you. What is the safer course?",
        options: [
          {
            text: "Return to the algorithm: a microcatheter or balloon over the wire, then a balloon inflated on it",
            best: true,
            feedback: "The algorithm frees most trapped wires without surgery.",
            next: "s3",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull hard instead",
            feedback: "Pulling hard is the first thing Brilakis forbids.",
            next: "c-fracture",
            stateDelta: { stability: -15, flags: ["wire-fractured"] },
          },
        ],
      },
    ],
    outcome:
      "The jailed wire was released by a balloon inflated on it, POT was repeated and the final result was good in both branches.",
    outcomeVariants: [
      { flag: "wire-fractured", text: "A hard pull fractured the wire and its coil unravelled into the left main and aorta; the patient needed the surgical team, a far graver outcome than the entrapment itself." },
      { flag: "coil-left", text: "Leaving an unravelled coil in the left main and aorta exposed the patient to coronary and systemic thromboembolism." },
    ],
    learningPoints: [
      "Never pull hard on a trapped wire: it fractures, unravels and pulls the guide into the artery.",
      "The sequence: microcatheter or balloon to the trap and gentle pull; balloon inflated on the wire; second wire and balloon beside it; surgery.",
      "Repeat POT after freeing a jailed wire with a balloon.",
      "After any fracture, IVUS decides the path: unravelled or clean, and where the fragments are.",
      "Unravelled wire into the aorta or left main: surgery, unless a snare can break the wire close to the ostium so the remainder can be stented; retrieval attempts are generally avoided because they unravel the wire further.",
      "Jail with a straight tip, away from the radiopaque segment, over a short length.",
    ],
    refs: [...BRILAKIS, "danek-wire-entrapment-2016"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-stentloss-prepare-first",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["stent-uncrossable"] },
    title: "Prepare the lesion before you push a stent",
    text: "A common route to stent loss is a stent crumpled against an unprepared lesion and then stripped off at the guide tip on the way back. Do not force the stent: withdraw it through a coaxial guide, inspect it, and prepare the lesion further (atherectomy for calcium if needed, imaging to confirm expansion) before trying again.",
    tone: "caution",
    lessonId: "cm-equipment-loss-stent",
    sources: [B("27.1"), B("10.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-stentloss-guide-extension-collar",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable", "poor-guide-support"] },
    title: "Stent stuck at the guide extension collar: never push",
    text: "If a stent catches entering a guide extension, stop. Remove and reinsert the extension, keeping its push rod under a towel so the wire does not wrap round it, and consider loading the stent into the extension outside the body and advancing both together. Keep the proximal collar inside the guide.",
    tone: "caution",
    lessonId: "cm-equipment-loss-stent",
    sources: [B("27.1"), B("30.3"), B("23.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-stentloss-freeze-wire",
    lab: "pci",
    when: { phase: ["stent", "complication"], event: ["stent-loss"] },
    title: "Stent lost: keep the wire, then ask three questions",
    text: "Hold the wire where it is. Then ask where the stent is (IVUS can find a thin-strut stent), whether it must come out (left main, major bifurcation, cerebral or renal artery: yes), and whether the wire is still through it. Those answers choose between retrieval, deployment, crushing and leaving it.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-stent",
    sources: [B("27.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-stentloss-small-balloon",
    lab: "pci",
    when: { phase: ["complication"], event: ["stent-loss"] },
    title: "Small-balloon retrieval: inflate beyond, then out together",
    text: "With the wire still through the lost stent, pass a small balloon through it, inflate it just beyond the stent and pull back. If the stent is too deformed to enter the guide, keep the balloon inflated and remove balloon, stent and guide together. Pushing the balloon hard can drive the stent distally.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-stent",
    sources: [B("27.1")],
    refs: [...BRILAKIS, "eggebrecht-stent-retrieval-2000"],
  },
  {
    id: "pci-stentloss-crush-check-struts",
    lab: "pci",
    when: { phase: ["complication"], event: ["stent-loss"] },
    title: "Crushing a lost stent: make sure the wire is outside it",
    text: "In a non-critical segment with the wire lost, pass a new wire round the stent, crush it with a balloon and cover it with a new stent. If a balloon is hard to pass alongside, suspect that the wire has gone through the struts: rewire, ideally with a knuckled polymer-jacketed wire. In the left main or another critical site, retrieve first; crushing is considered there only after retrieval has failed and the need to retrieve has been reassessed.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-stent",
    sources: [B("27.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-wire-tip-restrained",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-not-crossing", "wire-subintimal"] },
    title: "Tip no longer moving freely: withdraw, do not spin",
    text: "A tip that stops moving freely may be under plaque; pushing on risks dissection and entrapment. Withdraw and re-advance it, or leave it and pass a second wire alongside. If torquing leaves the tip unresponsive, suspect a fracture and stop turning.",
    tone: "caution",
    lessonId: "cm-equipment-loss-wire",
    sources: [B("8.6"), B("27.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-wire-trapped-no-hard-pull",
    lab: "pci",
    when: { phase: ["wire", "optimise", "complication"], event: ["equipment-entrapment"] },
    title: "Trapped wire: catheter to the trap, then a balloon on it",
    text: "Do not pull hard. Advance a microcatheter or balloon over the trapped wire as far as possible and pull gently; if that fails, inflate a balloon on the wire and pull gently; then pass a second wire alongside and dilate. Surgery is the last step.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-wire",
    sources: [B("27.2"), B("16.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-wire-fracture-ivus-first",
    lab: "pci",
    when: { phase: ["wire"], event: ["equipment-entrapment"] },
    title: "Wire broken: has the coil unravelled?",
    text: "Use intravascular ultrasound. Unravelled fragments are stented over if possible and need surgery if they reach the aorta or lie in the left main or a major bifurcation, unless a snare can break the wire at the ostium so that the remainder can be stented; do not try to pull them out. A clean small distal fragment can be left; a long one in a large artery is twirled or snared out.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-wire",
    sources: [B("27.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-balloon-shaft-kink",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["balloon-uncrossable", "stent-uncrossable"] },
    title: "Kinked balloon shaft: do not straighten it",
    text: "Advance in small bites rather than forcing, and never straighten a kink: it weakens the shaft. Brilakis advises replacing a kinked balloon or stent catheter, which can fracture or fail to deflate; at most, a small kink may be tolerated, but a large one always means a new catheter.",
    tone: "caution",
    lessonId: "cm-equipment-loss-balloon-microcath",
    sources: [B("9.7"), B("27.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-microcath-wire-inside-limit-turns",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-needed", "balloon-uncrossable"] },
    title: "Microcatheter in calcium: a wire inside and limited turns",
    text: "Keep a wire inside the microcatheter whenever you manipulate it, and turn it no more than 10 times before letting it unwind. Do not force soft-tip low-profile microcatheters through calcium or stent struts: their tips can break off and stay in the lesion.",
    tone: "caution",
    lessonId: "cm-equipment-loss-balloon-microcath",
    sources: [B("27.4"), B("23.1"), B("30.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-balloon-trap-in-guide",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], event: ["equipment-entrapment"] },
    title: "Trapped balloon: pin it inside the guide and pull everything",
    text: "After gentle rotation and back-and-forth movement, inflate a second balloon inside the guide near its tip at 20 atm or more and withdraw the guide with both balloons as one unit. Next options: cut the shaft and advance a guide extension to the balloon, then a snare, then surgery.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-balloon-microcath",
    sources: [B("27.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-balloon-no-deflate",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], event: ["equipment-entrapment"] },
    title: "Balloon will not deflate: the four steps",
    text: "Try another indeflator or a luer-lock syringe filled with saline. If the balloon is smaller than the vessel, try to withdraw it inflated, or inflate it until it bursts. If these fail, puncture it with a stiff wire passed through an over-the-wire balloon inflated alongside at 2–4 atm, or through a guide extension pushed against it. Surgery if all fail.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-balloon-microcath",
    sources: [B("27.3"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-microcath-trapped-retrieve",
    lab: "pci",
    when: { phase: ["wire", "complication"], event: ["equipment-entrapment"], requires: ["microcatheter-needed"] },
    title: "Microcatheter trapped or broken: retrieve it like a balloon fragment",
    text: "Use a snare, a guide extension with trapping inside the guide, or a second wire through the trap with balloon angioplasty. A broken-off tip may be impossible to retrieve: stenting over it may be the fastest and safest answer.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-balloon-microcath",
    sources: [B("27.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-snare-size-for-space",
    lab: "pci",
    when: { phase: ["complication"], event: ["stent-loss"] },
    title: "Choose the snare for the space the device is in",
    text: "Use 2–4 mm snares in the coronary arteries and 27–45 or 18–30 mm snares in the aorta. Three-loop snares capture more readily than single loops; for the peripheral circulation pass a large three-loop snare through a JR4 or multipurpose catheter, remembering that its wires can injure the vessel.",
    tone: "do",
    lessonId: "cm-equipment-loss-snares",
    sources: [B("30.18"), B("27.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-snare-close-and-withdraw",
    lab: "pci",
    when: { phase: ["complication"], event: ["stent-loss"] },
    title: "Close the snare against the catheter tip, then withdraw as one",
    text: "Load the snare with its collapsing tool (keep the tool for reloading) and open the loop beside the device. Then draw the loop back into the catheter, or, for a stent in a coronary artery, hold the snare wire still and advance the catheter, until the device is gripped against the catheter tip. Withdraw catheter, snare and device together.",
    tone: "do",
    lessonId: "cm-equipment-loss-snares",
    sources: [B("30.18"), B("27.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-snare-homemade",
    lab: "pci",
    when: { phase: ["complication"], event: ["stent-loss"] },
    title: "No snare on the shelf: make one",
    text: "Pass an exchange-length 0.014 inch wire through a multipurpose catheter and reinsert its tip into the catheter's distal end to make a loop. Or load a wire through the rapid-exchange lumen of a balloon, shape its end into a loop, and trap the returning end by inflating the balloon at 8–12 atm in the distal guide extension; pushing or pulling the wire resizes the loop.",
    tone: "bailout",
    lessonId: "cm-equipment-loss-snares",
    sources: [B("30.18"), B("30.3")],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// New references (PubMed-checked)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "brilakis-stent-loss-2005",
    kind: "paper",
    citation:
      "Brilakis ES, Best PJ, Elesber AA, et al. Incidence, retrieval methods, and outcomes of stent loss during percutaneous coronary intervention: a large single-center experience. Catheter Cardiovasc Interv. 2005;66(3):333–340.",
    url: "https://doi.org/10.1002/ccd.20449",
    note: "PMID: 16142808. Checked on PubMed: authors, title, journal, year, volume 66, issue 3, pages 333–340. Used for: 11,773 PCIs with stents, stent loss in 38 (0.32%), more frequent with calcification and/or proximal angulation; retrieval attempted in 35, successful in 30 (86%); methods balloon 45%, wire twirling 5%, loop snare 26%, biliary forceps 12%, retained fragment retriever 10%, basket 2%; transfusion-requiring bleeding 24% vs 7%; emergency CABG 5% vs 0.4%; no major cardiac complication when the stent was crushed or deployed; retrospective single-centre review 1994–2004, three stents crushed and covered without a retrieval attempt. Brilakis ch 27 ref 3.",
    verified: true,
  },
  {
    id: "iturbe-device-loss-2012",
    kind: "paper",
    citation:
      "Iturbe JM, Abdel-Karim AR, Papayannis A, et al. Frequency, treatment, and consequences of device loss and entrapment in contemporary percutaneous coronary interventions. J Invasive Cardiol. 2012;24(5):215–221.",
    note: "PMID: 22562915 (no DOI listed on PubMed). Checked on PubMed: authors, title, journal, year, volume 24, issue 5, pages 215–221. Used for: 2,338 consecutive PCIs; device loss 9 (0.38%), entrapment 4 (0.17%); all losses managed percutaneously; 3 of 4 entrapments required emergency surgical removal and CABG. Brilakis ch 27 ref 1.",
    verified: true,
  },
  {
    id: "danek-wire-entrapment-2016",
    kind: "paper",
    citation:
      "Danek BA, Karatasakis A, Brilakis ES. Consequences and treatment of guidewire entrapment and fracture during percutaneous coronary intervention. Cardiovasc Revasc Med. 2016;17(2):129–133.",
    url: "https://doi.org/10.1016/j.carrev.2015.12.005",
    note: "PMID: 26826011. Checked on PubMed: authors, title, journal, year, volume 17, issue 2, pages 129–133. Used for: fracture more likely in complex lesions and when wires interact with new or existing stents; wire fragments can often be retrieved percutaneously, surgery if that fails; case 1, a fractured polymer-jacketed wire retrieved after another wire crossed and a balloon was dilated beside it; case 2, failed retrieval with the fragment protruding into the ascending aorta and emergency surgery. Brilakis ch 27 ref 13.",
    verified: true,
  },
  {
    id: "eggebrecht-stent-retrieval-2000",
    kind: "paper",
    citation:
      "Eggebrecht H, Haude M, von Birgelen C, et al. Nonsurgical retrieval of embolized coronary stents. Catheter Cardiovasc Interv. 2000;51(4):432–440.",
    url: "https://doi.org/10.1002/1522-726x(200012)51:4<432::aid-ccd12>3.0.co;2-1",
    note: "PMID: 11108675. Checked on PubMed: authors, title, journal, year, volume 51, issue 4, pages 432–440. Used for: 20 stent embolisations (0.90%) among 2,211 patients; 1.04% of manually crimped vs 0.27% of premounted stents; low-profile 1.5 mm balloons successful in 7 of 10, biopsy forceps or gooseneck snare in 3 of 7; overall percutaneous success 10 of 14 (71%); three urgent CABG after failed retrieval, all fatal; balloon retrieval described as readily available, technically familiar and with a relatively high success rate. Brilakis ch 27 ref 8.",
    verified: true,
  },
];
