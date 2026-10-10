// Module cp-cto-antegrade: chronic total occlusions, antegrade crossing (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 21 (21.6 and 21.8 in particular), with the related passages in 8.1–8.9
// (microcatheters, wire choice, shaping, knuckles, escalation, exchanges), 13.4, 23.1, 25.2, 26.4, 27.2 and 30.3–30.16
// (support catheters, microcatheters, guidewires, dissection and re-entry equipment); Oxford Handbook of Cardiac
// Catheterization and Coronary Intervention, chapter 8 (chronic total occlusion PCI, angioplasty guide wires, angioplasty
// balloons). The techniques the manuals name without describing (limited re-entry, BASE, scratch-and-go, STRAW,
// stick-and-swap, investment) are taught from the PubMed-checked references in the `refs` export.
// Selection, set-up, dual injection, cap ambiguity, the hybrid algorithm and stop rules are taught in cp-cto-strategy;
// retrograde crossing in cp-cto-retrograde; balloon-uncrossable lesions in cp-uncrossable.
// Every claim is listed with its page in docs/curriculum/evidence/cp-cto-antegrade.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip, TipTrigger } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_CTO = O("ch 8: Chronic total occlusion PCI");
const O_WIRES = O("ch 8: Angioplasty guide wires");
const O_BALLOONS = O("ch 8: Angioplasty balloons");

export const module: Module = {
  id: "cp-cto-antegrade",
  title: "Chronic total occlusions: antegrade crossing",
  stage: 5,
  summary:
    "How a chronic total occlusion is crossed from the front: the microcatheter and wire families, choosing the first wire from the proximal cap, escalating and stepping down, reading where the wire is and acting on it, parallel wiring, antegrade dissection with a knuckle or a blunt dissection catheter, re-entry into the distal true lumen with a re-entry balloon or a wire, what to do when re-entry fails, and how to enter the wall above an ambiguous or impenetrable cap (BASE and scratch-and-go).",
  objectives: [
    "Set up antegrade wire escalation through a microcatheter and choose the first wire from the shape of the proximal cap, as Brilakis does, and say where Oxford's emphasis differs.",
    "Escalate and de-escalate wires (step-up/step-down), confirm the wire position with contralateral injection in orthogonal views, and act correctly on a wire in the distal true lumen, outside the vessel or in the subintimal space.",
    "Exchange the crossing wire safely after crossing, using trapping rather than a hydraulic exchange.",
    "Perform parallel wiring with or without a dual-lumen microcatheter, and choose between parallel wiring and a re-entry balloon from the anatomy.",
    "Explain why limited antegrade dissection and re-entry replaced STAR, and travel the occlusion within the vessel architecture with a knuckled wire or a blunt dissection catheter while protecting the distal true lumen from haematoma.",
    "Re-enter the distal true lumen with a re-entry balloon (preparation, bougie, inflation, STRAW, stick-and-swap and its variants) or with wire-based techniques, and know the bail-outs when re-entry fails.",
    "Describe the move-the-cap techniques, BASE and scratch-and-go, say when they are used and what follows them.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-awe-kit",
      title: "Antegrade wire escalation I: microcatheter, wire families and the first wire",
      minutes: 14,
      topics: ["cto-awe"],
      sources: [B("21.8"), B("8.1"), B("8.2"), B("8.3"), B("8.6"), B("30.4"), B("30.6"), B("30.7"), O_CTO, O_WIRES, O_BALLOONS],
      refs: [
        ...BOOKS,
        "cto-consensus-2019",
        "tajti-progress-hybrid-2018",
        "brilakis-cto-algorithm-2012",
        "harding-apcto-algorithm-2017",
        "wu-global-cto-algorithm-2021",
        "wu-apcto-antegrade-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Antegrade wire escalation (AWE, also simply called antegrade wiring) means pushing wires through the occlusion in the direction blood used to flow, aiming to stay inside the plaque, and changing to a more or less penetrating wire according to how the cap and the occluded segment respond. No CTO crossing technique is used more often. The PROGRESS CTO registry analysed 3,122 procedures; among the lesions that were crossed successfully, wire escalation was the strategy that made the final crossing in 52.0%. In the hybrid algorithm it is the first choice when the cap is clear, the distal target is good, there is no reason to start retrograde and the occlusion is shorter than 20 mm.",
        },
        {
          kind: "p",
          text: "Later algorithms no longer let length alone decide. The Asia Pacific algorithm (Harding 2017) weighs an unclear course, heavy calcium, tortuosity, length and any earlier failure when choosing between wiring and dissection, and the 2021 global algorithm (Wu 2021) lists antegrade wiring as its antegrade crossing step. In the Asia Pacific group's 2025 update, antegrade wiring is the usual start, and a knuckle is planned up front for 'long plus' occlusions, those with a long ambiguous segment, tortuosity and heavy calcium together. The same update also allows intentional subintimal tracking without a knuckle, using blunt wires of intermediate penetration (Wu 2025).",
        },
        {
          kind: "p",
          text: "This lesson is the equipment and the opening move. The set-up (guides, dual injection, heparin, reading the angiogram) is taught in cp-cto-strategy; the next lesson covers what happens once the wire is in the cap.",
        },
        { kind: "h", text: "The microcatheter goes first" },
        {
          kind: "steps",
          title: "Why every antegrade CTO wire works through a microcatheter",
          items: [
            {
              title: "1. It is one of the seven global principles",
              detail:
                "The 2019 consensus states that a microcatheter is essential for handling and exchanging wires in CTO PCI, and Brilakis recommends one routinely for wire support in CTO interventions (30.6).",
            },
            {
              title: "2. What it does for the wire",
              detail:
                "Sitting close behind the tip, it supports the wire and makes the tip effectively stiffer, so the wire penetrates better. It lets you take the wire out, reshape the tip and put it back in the same place, swap one wire for another without rewiring from the ostium, and it shields the proximal vessel from the wire.",
            },
            {
              title: "3. Load them together",
              detail:
                "When a microcatheter is planned, insert the wire with the microcatheter already over it, so the introducer needle is not needed (8.1). Advance the pair to the lesion, then bring the microcatheter up to the cap.",
            },
            {
              title: "4. Which microcatheter",
              detail:
                "Brilakis sorts microcatheters into five groups: large outer diameter, small outer diameter, angulated, dual-lumen and plaque-modification. The large ones are the usual support catheters for CTO wiring; they can be rotated to help them advance, but over-rotation damages them (30.6). Dual-lumen microcatheters come into their own in parallel wiring (lesson 3).",
            },
            {
              title: "5. The over-the-wire balloon as an alternative",
              detail:
                "If no microcatheter is available, an over-the-wire balloon can be used: it costs much less and supports better than many microcatheters, but it is stiffer, kinks more easily, and on small balloons the marker sits mid-balloon so the tip position is uncertain (8.1, 30.6). Brilakis therefore prefers microcatheters: they track better, are more flexible and kink less, and a kinked balloon shaft blocks further wire exchanges. Oxford adds that an over-the-wire balloon gives extra support against tip deflection, and that over-the-wire balloons are now used mainly in CTO work.",
            },
            {
              title: "6. Look after the microcatheter",
              detail:
                "Do not over-rotate it: too many turns can deform it, trap it, break it short of the tip or make the wire bind inside it (30.6.6). Contrast can be given through most microcatheters, but flush afterwards so the wire does not become sticky. If the wire starts to feel sticky or the microcatheter will not advance after long use, it is fatigued: change it for a new one. The same catheter is also the route for coils, fat or thrombin if a distal perforation has to be sealed (30.6; cm-perforation).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-microcatheter" },
        {
          kind: "check",
          stem: "A stiff wire keeps deflecting off a hard proximal cap. The microcatheter is still 15 mm back in the proximal vessel. What is the most useful first change?",
          options: [
            "Bring the microcatheter right up to the cap so that it backs up the wire tip",
            "Withdraw the microcatheter into the guide so the wire can be torqued more freely",
            "Exchange the microcatheter for a larger guide catheter to increase support",
            "Inject contrast through the microcatheter to see where the cap lies",
          ],
          answer: 0,
          explanation:
            "Support at the tip is what a microcatheter adds: close behind the wire it stiffens the tip and raises its penetrating force, and an over-the-wire balloon used the same way prevents deflection (Oxford). Pulling the microcatheter back removes exactly that support. The guide matters too, but it is not the first change, and injecting near a cap you are trying to penetrate is not a way of improving support.",
        },
        { kind: "h", text: "The wire families" },
        {
          kind: "table",
          caption: "0.014 inch wires used in antegrade CTO crossing, by family (Brilakis 30.7; tip loads from his Table 30.8)",
          head: ["Family", "What it is like", "Its role in antegrade crossing"],
          rows: [
            [
              "Workhorse",
              "Soft tip, usually 1 g or less, without a polymer jacket",
              "Reaching the occlusion; the wire that balloons and stents are delivered on after crossing",
            ],
            [
              "Soft, tapered, polymer-jacketed (about 0.6–1.2 g)",
              "Slippery tapered tip that follows channels",
              "The front-line antegrade CTO wires: tapered caps and functional occlusions; one of them is also used to form knuckles",
            ],
            [
              "Soft, non-tapered, polymer-jacketed (about 0.8–2.1 g)",
              "Slippery but not tapered",
              "Tortuosity in ordinary PCI; in CTO work mainly collateral crossing (retrograde module)",
            ],
            [
              "Composite-core, intermediate penetration",
              "A CTO wire of intermediate penetration force, named beside the jacketed ones (21.8.1)",
              "One of his two starting options for a blunt cap",
            ],
            [
              "Stiff, tapered tip, no jacket",
              "Two grades: moderate and strong penetrating power",
              "Designed for resistant proximal caps",
            ],
            [
              "Stiff, polymer-jacketed (about 1.7–4.1 g)",
              "Stiff and slippery",
              "Antegrade crossing where the occluded course cannot be seen clearly; forming knuckles; re-entry during dissection and re-entry",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Two kinds of composite-core wire.** The blunt-cap wire above is not the composite-core advanced workhorse that Brilakis suggests for tortuous lesions outside CTO work (8.2); that wire is for navigating bends, not for penetrating a cap.",
            "**The price of a polymer jacket.** It slides through tortuosity and channels, but it is more likely to perforate the distal vessel and to track under the intima and dissect. Use it only when needed and exchange it for a workhorse wire before balloons and stents (30.7.2).",
            "**Construction, in Oxford's terms.** A core that runs to the tip makes a wire stiffer, with more push, torque and support; a core that stops short, leaving a shaping ribbon, gives a floppier tip that is kinder to the vessel. Hydrophilic coatings reduce friction and can help with occluded vessels.",
            "**Oxford's CTO wires.** Oxford describes specially designed stiff, heavyweight wires, often hydrophilic-coated, that resist deflection and help penetrate the cap, and warns that perforation with them is not uncommon and can cause tamponade. Among evolving approaches it lists guidewires that deliver ultrasound or laser energy to help through long occlusions. The Asia Pacific group's 2025 update of antegrade wiring mentions neither (Wu 2025).",
          ],
        },
        { kind: "h", text: "Choosing the first wire from the cap" },
        {
          kind: "table",
          caption: "Brilakis 21.8.1: the cap decides where the ladder starts",
          head: ["What the angiogram shows", "First wire", "If it fails"],
          rows: [
            [
              "Tapered proximal cap, or a functional occlusion in which a channel can be seen",
              "Polymer-jacketed, tapered, low penetration force",
              "Escalate to intermediate, then high penetration force, only as required",
            ],
            ["Blunt proximal cap", "Intermediate penetration force: a polymer-jacketed or a composite-core wire", "Escalate to high penetration force"],
            [
              "A highly resistant cap, or resistance met inside the body of the occlusion",
              "Stiff, high-penetration wire for that segment",
              "Step back down once through it (next lesson)",
            ],
          ],
        },
        {
          kind: "p",
          text: "The two books differ in emphasis. Brilakis starts soft whenever the cap allows and escalates only as needed, and his wiring chapter (8.2) says that in CTOs the usual first wire is a polymer-jacketed tapered wire, with stiff, highly penetrating wires (with or without a jacket) also often needed. Oxford's short CTO section leads with stiff heavyweight wires. Use Brilakis's ladder, and remember Oxford's warning about perforation with stiff wires.",
        },
        { kind: "tip", id: "pci-cto-antegrade-first-wire" },
        {
          kind: "check",
          stem: "A mid-LAD CTO has a blunt proximal cap with no visible channel; the course beyond is straight and 15 mm long. Following Brilakis, which wire do you start with?",
          options: [
            "A soft, tapered, low-penetration polymer-jacketed wire, because every CTO starts at the bottom of the ladder",
            "An intermediate-penetration polymer-jacketed or composite-core wire",
            "A stiff, tapered, strong-penetration wire, because the cap is blunt",
            "A workhorse wire without a microcatheter, keeping the microcatheter for later",
          ],
          answer: 1,
          explanation:
            "For a blunt cap Brilakis starts with an intermediate-penetration wire, polymer-jacketed or composite-core, and escalates if needed. Starting soft and tapered is his choice for a tapered cap or a visible channel, not a blunt one. The strongest wires are kept for caps or segments that resist, and the microcatheter belongs at the cap from the start.",
        },
        { kind: "h", text: "Shaping and handling the wire" },
        {
          kind: "steps",
          items: [
            {
              title: "Shape a small distal bend",
              detail:
                "As a rule, keep the distal bend shorter than the width of the vessel you are wiring. A CTO may need one shape to reach the occlusion and a different one to cross it, and two bends (a larger proximal and a smaller distal one) can extend reach in big vessels or angulated origins (8.3). Start with a small bend: adding a bend is easy, taking one out is not.",
            },
            {
              title: "Use both hands",
              detail:
                "In CTOs and other complex lesions, a right-handed operator commonly advances and withdraws with the left hand and turns the wire with the right (8.6).",
            },
            {
              title: "Keep the tip free",
              detail:
                "Oxford advises continuous small rotations as the wire advances so the tip does not lodge in the wall. Brilakis: if the tip stops moving freely, pull back and advance again, or leave that wire and work a second one beside it (8.6).",
            },
            {
              title: "Change a damaged tip",
              detail:
                "A deformed tip is less likely to succeed and more likely to cause harm: exchange the wire, ideally through the microcatheter, and remove the microcatheter later by trapping (8.6).",
            },
            {
              title: "Need more support still?",
              detail:
                "Support catheters that anchor in the vessel with a self-expanding scaffold or a soft balloon raise backup and the force the wire can apply to the cap (30.4). The two scaffold devices Brilakis describes need at least 10 mm of vessel before the lesion and are too bulky to trap, so they come out over a 300 cm wire.",
            },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Wiring a CTO without a microcatheter, then having to rewire from the ostium every time the wire changes.",
            "Reaching for the stiffest wire first because the lesion is 'a CTO', whatever the shape of the cap.",
            "Making the tip bend too large for the vessel, or bending it repeatedly until the tip is damaged.",
            "Forgetting that polymer-jacketed and stiff wires are crossing tools, not delivery rails.",
            "Using a 6 Fr system and then finding that the support or imaging you need will not fit (cp-cto-strategy).",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first wire, say out loud what the cap looks like (tapered, blunt, channel visible or not) and which three wires form your ladder. The cap chooses the bottom rung; resistance, not impatience, moves you up.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Open the mid-RCA CTO scenario. On the dual injection, describe the proximal cap (tapered or blunt, channel or not) and name the first wire Brilakis's ladder gives you; bring a microcatheter up to the cap before you start wiring.",
        },
        { kind: "video", id: "aKY2I5Yeni0", note: "Manual of CTO PCI case 299: back to the basics." },
        { kind: "video", id: "MwhcUMGy8iw", note: "Manual of CTO Interventions case 76: antegrade wire escalation." },
        { kind: "video", id: "KG6z-LPNEr0", note: "Manual of CTO PCI case 261: a 'simple' CTO." },
        { kind: "video", id: "Kn8omnStnRI", note: "Manual of CTO PCI case 174: beware of stiff guidewires." },
        {
          kind: "keypoints",
          items: [
            "AWE is the commonest CTO crossing technique; the hybrid algorithm starts with it for clear, short (under 20 mm) occlusions with a good distal target, while later algorithms do not decide by length alone and keep up-front knuckling for 'long plus' occlusions.",
            "Always work through a microcatheter: support, tip reshaping, exchanges and protection of the proximal vessel; do not over-rotate it, flush after contrast, change it when fatigued.",
            "Tapered cap or visible channel: start with a low-penetration tapered polymer-jacketed wire. Blunt cap: start with an intermediate polymer-jacketed or composite-core wire.",
            "Stiff, high-penetration wires are for resistant caps or resistant segments.",
            "Polymer jackets and stiff tips raise the risk of perforation and dissection: exchange before balloons and stents.",
            "Small distal bend, smaller than the vessel; keep the tip free; change a damaged tip.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-awe-crossing",
      title: "Antegrade wire escalation II: step up, step down, and know where the wire is",
      minutes: 15,
      topics: ["cto-awe"],
      sources: [B("21.8"), B("21.6"), B("8.6"), B("8.7"), B("8.9"), B("13.4"), B("25.2"), B("26.4"), O_CTO],
      refs: [...BOOKS, "cto-consensus-2019", "wu-apcto-antegrade-2025"],
      blocks: [
        {
          kind: "p",
          text: "Once the wire is in the cap, crossing is a loop of three actions: move the wire, find out exactly where it is, and decide what that position means. Do not skip the middle action: Brilakis warns that advancing a microcatheter, balloon or stent over a wire that has left the vessel can create or enlarge a perforation (21.8.1).",
        },
        { kind: "h", text: "Escalate, then step down" },
        {
          kind: "steps",
          title: "The step-up/step-down sequence (Brilakis 21.8.1)",
          items: [
            {
              title: "1. Small changes before big ones",
              detail:
                "If the wire is not progressing, first change the tip angle or change the wire; bigger changes of strategy come later (21.8.5, taught in cp-cto-strategy).",
            },
            {
              title: "2. Add support before penetration",
              detail:
                "At a tough proximal cap the Asia Pacific group strongly advises raising backup force before choosing a more penetrating wire. On top of the microcatheter at the cap (lesson 1), that means a supportive guide, a side-branch anchor, a coaxial anchor balloon or a guide extension (Wu 2025).",
            },
            {
              title: "3. Escalate one rung at a time",
              detail:
                "Move up from low to intermediate to high penetration force only when the cap, or a segment inside the occlusion, resists the current wire.",
            },
            {
              title: "4. Step down after 1–2 mm",
              detail:
                "Once the stiff wire has crossed 1–2 mm of the proximal cap, change back to a less penetrating wire to travel the rest of the occluded segment safely. Brilakis lists stiff, tapered and polymer-jacketed wires as the ones more likely to perforate a small distal branch (26.4), so they are kept for the segments that need them. Inside the body of the occlusion he allows a stiff wire wherever resistance is met; the 1–2 mm figure he gives is for the proximal cap, and the same step back down after a resistant segment follows the same logic.",
            },
            {
              title: "5. Track the course",
              detail:
                "Keep a stored reference image, inject the contralateral artery (or graft) to see the distal vessel, and check the wire in orthogonal projections (8.6). In the CTO setting, contralateral injection to locate the wire is one of the key crossing principles.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-step-down" },
        {
          kind: "table",
          caption: "Crossing the body of the occlusion: the Asia Pacific group lets the anatomy choose the method (Wu 2025)",
          head: ["What the occlusion looks like", "Method", "Wire class"],
          rows: [
            ["A tapered stump or a residual channel", "Loose tissue tracking: let a soft wire follow the soft tissue", "Soft tapered polymer-jacketed wires, or a non-tapered jacketed wire of a little more force"],
            [
              "A clear intimal path: short, in-stent, outlined by calcium or by bridging collaterals, or seen open on an old angiogram",
              "Intentional intimal tracking, steered in three dimensions from two views",
              "Stiffer, precisely torquable tapered wires",
            ],
            [
              "No tapered stump and no clear intimal path",
              "Intentional intimal tracking without three-dimensional steering",
              "Blunt intermediate-penetration wires; they advise against the stiffer tapered ones when the course is unclear",
            ],
            ["'Long plus': long, with an unclear course, tortuosity and heavy calcium", "Intentional subintimal tracking, planned from the start", "A knuckle (lesson 4)"],
          ],
        },
        {
          kind: "p",
          text: "The decision is made up front but is not fixed: the authors accept that a wire meant to stay in the intima may still go subintimal, and that only IVUS after crossing shows which space it used. Three-dimensional wiring and their angiographic 3D antegrade puncture technique (ADAPT) for a tough distal cap are advanced techniques beyond this lesson; the principle to keep is that the anatomy, not habit, picks the wire.",
        },
        { kind: "h", text: "Where is the wire, and what now?" },
        {
          kind: "table",
          caption: "Brilakis 21.8.1: three positions, three different responses",
          head: ["Where the tip is", "How it looks", "What to do"],
          rows: [
            [
              "Distal true lumen",
              "Within the contrast-filled distal vessel in both orthogonal views on contralateral injection",
              "Advance the microcatheter into the distal true lumen and exchange the CTO wire for a workhorse wire through it, to protect the distal vessel during ballooning and stenting",
            ],
            [
              "Outside the vessel",
              "Beyond the vessel contour; Oxford adds an abnormal course or movement with the cardiac cycle, and multiple ventricular extrasystoles",
              "Withdraw and redirect it. Advance nothing over it: a microcatheter, balloon or stent could create or enlarge a perforation",
            ],
            [
              "Subintimal space (inside the vessel wall, outside the lumen)",
              "Follows the vessel course but is not within the lumen on orthogonal views",
              "Try to redirect it. If that fails, leave it in place to guide a second wire into the true lumen (parallel wiring, lesson 3), or move to dissection and re-entry (lessons 4 and 5)",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Do not drive on in the wall.** A wire advanced well beyond the distal cap in the subintimal space raises a haematoma that squeezes the true lumen and lowers the chance of success (21.8.1).",
            "**Why wires leave the plaque.** Severe calcium and tortuosity in the occluded segment make crossing harder and subintimal (extraplaque) entry more likely (21.6).",
            "**The distal cap can be the hard part.** Distal caps of native CTOs are more often calcified and resistant when the vessel was bypassed beyond the occlusion, and a bifurcation at the distal cap hinders antegrade wiring and threatens one of the branches; retrograde crossing is then favoured (21.6).",
          ],
        },
        {
          kind: "check",
          stem: "During escalation in an RCA CTO, the wire's tip moves in a way that does not match the vessel during the cardiac cycle, and the patient has repeated ventricular ectopics. On the contralateral injection in the second view the tip lies beyond the vessel contour. What is the right action?",
          options: [
            "Pull the wire back and redirect it, without advancing the microcatheter",
            "Advance the microcatheter to the tip and inject to confirm the position",
            "Leave this wire in place and advance a second wire beside it into the same channel",
            "Inflate a small balloon over the wire to seal the channel before redirecting",
          ],
          answer: 0,
          explanation:
            "These are Oxford's clues to extraluminal passage, and the orthogonal view confirms the tip is outside the vessel. Brilakis's rule is to withdraw and redirect the wire and to advance nothing over it, because a microcatheter or balloon following it could make or enlarge a perforation. Leaving the wire as a marker for a parallel wire is the response to a subintimal wire, not to one that has exited the vessel.",
        },
        { kind: "h", text: "Confirming the true lumen" },
        {
          kind: "table",
          head: ["Method", "What the manuals say"],
          rows: [
            ["Contralateral injection in orthogonal views", "The standard: it shows the distal vessel and the wire against it (21.8.1)"],
            ["IVUS", "Can show whether a wire is in the true lumen and confirm re-entry; Brilakis prefers solid-state catheters for CTO crossing because they image closer to the tip (13.4, 21.13)"],
            [
              "A workhorse wire through the advanced microcatheter",
              "In the true lumen it runs to the distal vessel without resistance; in the subintimal space it meets marked resistance (Brilakis, dissection section 25.2)",
            ],
            [
              "Contrast through a catheter over the wire",
              "Oxford suggests dye through an over-the-wire balloon or a probing catheter when the wire has crossed but there is still no antegrade flow. Brilakis warns that a distal injection through a microcatheter whose tip is subintimal extends the dissection and enlarges the subintimal space, making re-entry harder (8.7, 25.2)",
            ],
          ],
        },
        {
          kind: "p",
          text: "The books disagree on the last row. When you are not sure the microcatheter tip is in the lumen, use the first three methods; a distal injection is only safe once you know the tip is in the true lumen.",
        },
        { kind: "h", text: "If the wire exit becomes a perforation" },
        {
          kind: "list",
          items: [
            "**Recognise it.** Oxford's signs are contrast collecting in the pericardial space or dye leaving the vessel in a pulsatile way; tamponade is not uncommon with stiff CTO wires.",
            "**First response.** Inflate a balloon at the site to stop the bleeding, give fluids, and drain the pericardium promptly if the patient is hypotensive or tamponade develops. Oxford adds that heparin reversal with protamine and a covered stent may then be needed; a distal wire perforation may need coils or fat delivered through the microcatheter. The full sequence is taught in cm-perforation.",
            "**Why the rule matters.** A wire tip alone usually makes a small hole that seals itself; following it with a microcatheter or balloon is what enlarges it (26.4).",
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-confirm-lumen" },
        { kind: "h", text: "After the crossing: exchange without losing the wire" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Microcatheter into the distal true lumen",
              detail: "Only once the position is confirmed.",
            },
            {
              title: "2. Swap the crossing wire immediately",
              detail:
                "Stiff and polymer-jacketed wires perforate small distal branches more readily than workhorse wires, so exchange them through the microcatheter as soon as crossing is confirmed (8.8, 26.4). The replacement is a workhorse or a support wire, or an atherectomy wire if atherectomy is planned (8.2).",
            },
            {
              title: "3. Remove the microcatheter by trapping",
              detail:
                "Trapping is Brilakis's preferred way to remove an over-the-wire device over a short wire: withdraw the microcatheter into the guide, place a balloon beside (not over) the wire inside the guide, inflate it to 15–20 atm to pin the wire, then withdraw the microcatheter. A 2.5 mm balloon traps in 6 or 7 Fr guides, a 3.0 mm balloon in 7 and 8 Fr guides, ideally at least 20 mm long; polymer-jacketed wires are slippery and can slide past the trapping balloon, so withdraw gently (8.9). In a 6 Fr guide the space is tight: over-the-wire balloons, the blunt dissection catheter and the re-entry balloon cannot be trapped in a standard 6 Fr guide, and only low-profile microcatheters can be trapped, in 6 Fr guides with a 0.071 in. inner diameter. Dedicated trapping balloons, or a guide extension with its own trapping balloon (made in 6–8 Fr), trap in smaller guides.",
            },
            {
              title: "4. Back-bleed the Y-connector",
              detail: "Air is often drawn into the guide during trapping; inject before back-bleeding and you risk coronary air embolism (8.9).",
            },
            {
              title: "5. Not a hydraulic exchange",
              detail:
                "Brilakis advises avoiding hydraulic (saline-jet) exchange in CTO PCI, especially with stiff tapered or stiff polymer-jacketed wires, because the wire can shoot forward and perforate (8.9). A wire extension is an alternative to trapping.",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "**The order of preference.** Trapping first, a wire extension second (one matched to the wire maker), hydraulic exchange avoided; cutting the microcatheter off the wire in pieces ('circumcision') is a cumbersome last option for when the wire is stuck inside it or trapping and extensions are not possible (8.9, 26.4). Trapping also works over a 300 cm wire.",
            "**Which balloon.** A rapid-exchange balloon rather than an over-the-wire one, whose larger profile may not fit beside other devices in the guide. Trying to trap several devices in one guide is likely to fail and lose the wire. A side-branch anchor balloon of the right size can be pulled back into the guide and reused for trapping.",
            "**Where.** Advance the trapping balloon beyond the distal marker of the microcatheter, usually to the primary curve; the stylet left in its end helps it through the haemostatic valve. On a short or cut-down guide, do not rely on the balloon shaft markers to keep the trapping balloon out of the coronary.",
            "**During and after.** The guide pressure should be damped while trapping. A trapping balloon used many times may deform and be hard to reinsert: replace it. Continuous saline flushing during withdrawal is an alternative way of keeping air out, besides back-bleeding.",
            "**Over-the-wire devices too.** Hydraulic exchange should also not be used to remove an over-the-wire balloon or the re-entry balloon, because friction inside them can pull the wire back (8.9).",
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-trap-exchange" },
        {
          kind: "check",
          stem: "A stiff polymer-jacketed wire has crossed an LAD CTO and is confirmed in the distal true lumen. The microcatheter has been advanced. You are working through a 7 Fr guide with a 190 cm wire. What is the best sequence?",
          options: [
            "Remove the microcatheter by hydraulic exchange, then deliver the first balloon on the polymer-jacketed wire",
            "Exchange for a workhorse wire through the microcatheter, then trap with a 2.5 mm balloon, remove the microcatheter and back-bleed",
            "Leave the polymer-jacketed wire, which gives the best support, and trap the microcatheter with a 3.0 mm balloon",
            "Withdraw the microcatheter slowly under fluoroscopy without trapping, since the wire is now well across",
          ],
          answer: 1,
          explanation:
            "Stiff polymer-jacketed wires should be exchanged for a workhorse wire immediately after crossing. In a 7 Fr guide a 2.5 mm balloon traps the wire; back-bleed afterwards to clear entrained air. A hydraulic exchange is the tempting shortcut, but Brilakis advises against it in CTO work with stiff or polymer-jacketed wires because the wire can lurch distally.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pressing on with a stiff wire through the whole occlusion because it is 'moving'.",
            "Judging the wire position from a single view.",
            "Following a wire that has left the vessel with a microcatheter 'to check'.",
            "Injecting through a microcatheter whose tip may be subintimal.",
            "Pushing a subintimal wire far down the distal vessel in the hope that it will find the lumen.",
            "Ballooning over the crossing wire, or removing the microcatheter by hydraulic exchange.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat every wire movement as a question and the contralateral injection in two views as the answer. If you cannot answer 'true lumen, subintimal or out', you have not earned the right to advance anything else.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, escalate from the soft tapered wire to an intermediate wire and then, only if the cap still resists, to the stiff tapered wire; then confirm the distal position with a contralateral injection in two views before you advance anything; exchange back to a workhorse wire before the first balloon.",
        },
        { kind: "video", id: "AFDP7mNW6SY", note: "Manual of CTO PCI case 225: antegrade wiring works." },
        { kind: "video", id: "qe6jOo7-D8c", note: "Manual of CTO Interventions case 21: ensuring true lumen wire position." },
        { kind: "video", id: "uwTSBqCaSX0", note: "Manual of CTO PCI case 190: antegrade first." },
        { kind: "video", id: "fZR0WrVcBVs", note: "Manual of CTO Interventions case 71: distal open sesame and reversed guidewire." },
        {
          kind: "keypoints",
          items: [
            "Small changes first; add backup support before a more penetrating wire; escalate one rung at a time.",
            "Step down to a less penetrating wire once 1–2 mm through the cap.",
            "Let the anatomy choose how to cross the body: loose tissue tracking, intentional intimal tracking, or planned subintimal tracking for 'long plus' occlusions.",
            "Locate the tip with contralateral injection in orthogonal views after every meaningful advance.",
            "True lumen: microcatheter in, exchange for a workhorse. Out of the vessel: withdraw and redirect, nothing over it. Subintimal: redirect, then parallel wire or dissection and re-entry.",
            "Do not advance a subintimal wire far beyond the distal cap: the haematoma compresses the true lumen.",
            "Oxford's clues to extraluminal passage: abnormal course or motion, multiple ventricular extrasystoles.",
            "Remove the microcatheter by trapping (wire extension second), back-bleed afterwards; avoid hydraulic exchange in CTO work. In 6 Fr, a standard balloon traps only low-profile microcatheters, and only in a guide with a 0.071 in. lumen; anything bulkier needs a dedicated trapping balloon or a trapping guide extension.",
            "Perforation: dye in the pericardium or pulsatile exit; balloon at the site, fluids, pericardiocentesis if tamponade.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-parallel",
      title: "When the wire goes into the wall: redirect, parallel wire or re-enter",
      minutes: 13,
      topics: ["cto-awe"],
      sources: [B("21.8"), B("21.5"), B("21.13"), B("8.5"), B("8.6"), B("30.6"), B("13.4")],
      refs: [...BRILAKIS, "harding-apcto-algorithm-2017", "wu-apcto-reentry-2020", "brilakis-cto-algorithm-2012"],
      blocks: [
        {
          kind: "p",
          text: "A wire that has slipped into the subintimal space near the distal cap is a frequent fork in antegrade crossing. Brilakis gives three ways forward in 21.8.1: redirect the same wire; leave it and steer a second wire past it into the lumen (parallel wiring), helped by a dual-lumen microcatheter or IVUS; or re-enter with antegrade dissection and re-entry techniques. Changing to the retrograde approach remains an option (21.8.5). The Asia Pacific authors stress choosing early and deliberately, because repeated manoeuvres in the wall enlarge the space and the haematoma and make the next technique harder (Wu 2020).",
        },
        { kind: "h", text: "Parallel wiring, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Redirect briefly",
              detail:
                "Pull the wire back a little, change its direction and try again. If that fails, do not persist: Brilakis moves on to a second wire or to ADR (21.8.1), and the Asia Pacific authors warn against excessive redirection of the single wire, which widens the space around it and erodes control (Wu 2020).",
            },
            {
              title: "2. Leave the first wire where it is",
              detail:
                "It now marks the wrong channel and acts as a reference for steering the second wire into the true lumen (21.8.1; the same move as for a tip caught under plaque, 8.6).",
            },
            {
              title: "3. Bring in the second wire with its own support",
              detail:
                "A second microcatheter, or a dual-lumen microcatheter whose rapid-exchange lumen rides on the first wire while the second wire goes through its over-the-wire lumen (8.5, 30.6).",
            },
            {
              title: "4. Steer the second wire away from the false channel",
              detail: "Aim for the distal true lumen, checking in orthogonal views with contralateral injection, exactly as in the previous lesson.",
            },
            {
              title: "5. Once in the true lumen",
              detail:
                "Advance its microcatheter, exchange for a workhorse wire and remove the first wire. Withdrawing a dual-lumen microcatheter while holding the distal wire is difficult; a trapping balloon makes it reliable (30.6).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-parallel-wire" },
        {
          kind: "table",
          caption: "Dual-lumen microcatheters in antegrade CTO work (Brilakis 30.6)",
          head: ["Use", "Why it helps"],
          rows: [
            ["Parallel wiring", "Delivers the second wire beside the first with support, without rewiring from the ostium"],
            ["A side branch next to the proximal cap", "One lumen stays in the branch while the other wire attacks the cap"],
            [
              "The crossing wire has gone into a side branch beyond the occlusion",
              "Instead of pulling back and risking not re-crossing the occlusion, keep that wire and wire the main distal vessel through the second lumen",
            ],
            ["Practical limits", "Can be hard to deliver (some come with a stiffening mandrel), the side port is hard to orient, and holding the distal wire on withdrawal needs a trapping balloon"],
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-distal-branch" },
        {
          kind: "check",
          stem: "Your antegrade wire has crossed a mid-LAD CTO but entered a diagonal just beyond the distal cap rather than the LAD. Re-crossing the occlusion was difficult. What is the most efficient next step?",
          options: [
            "Pull the wire back into the occlusion and redirect it into the LAD",
            "Advance a dual-lumen microcatheter over it and wire the distal LAD through the second lumen",
            "Balloon the occlusion over the diagonal wire, then rewire the LAD through the opened segment",
            "Abandon antegrade crossing and go retrograde through septal collaterals",
          ],
          answer: 1,
          explanation:
            "Brilakis lists exactly this use: the dual-lumen microcatheter keeps the hard-won position in the side branch while the main vessel is wired, so you do not risk being unable to re-cross. Pulling back is the tempting option, and it is precisely what risks losing the crossing. Ballooning into the branch before the main vessel is secured can compromise the LAD.",
        },
        { kind: "h", text: "IVUS-guided wiring" },
        {
          kind: "p",
          text: "IVUS can show whether the first wire is subintimal and where the true lumen lies relative to it, and so guide the second wire. Brilakis notes that IVUS-guided antegrade re-entry needs 8 Fr guides and expertise in reading IVUS, and that the IVUS catheter lying in the subintimal space limits wire handling (21.8.1); the same constraints apply when IVUS guides a parallel wire. He also warns that 6 Fr guides may limit the use of IVUS to guide cap penetration (21.5). For CTO crossing he prefers solid-state IVUS catheters, which image closer to their tip (13.4).",
        },
        { kind: "h", text: "Parallel wire or re-entry balloon?" },
        {
          kind: "p",
          text: "The hybrid algorithm sends failed antegrade wiring to antegrade dissection and re-entry; the Asia Pacific CTO Club algorithm offers parallel wiring or a re-entry balloon as equal options. The Asia Pacific authors (Wu, with Brilakis among them) explain the difference in mechanism: parallel wiring is the manipulation of a wire within the plaque to puncture the distal cap into the lumen, whereas a re-entry balloon is used from the subintimal space beyond the distal cap, at a chosen re-entry zone.",
        },
        {
          kind: "table",
          caption: "What favours each (Asia Pacific CTO Club, Wu 2020)",
          head: ["Feature", "Favours"],
          rows: [
            ["Soft distal cap", "Parallel wiring"],
            ["First wire still in the plaque, with good wire control", "Parallel wiring"],
            ["Distal cap in the mid RCA", "Parallel wiring (mid RCA is a difficult re-entry zone)"],
            ["Calcium in the intended re-entry zone", "Parallel wiring"],
            ["First wire subintimal, or poor antegrade wire control", "Re-entry balloon"],
            ["A good, disease- and calcium-free re-entry zone (the distal RCA is usually easy)", "Re-entry balloon"],
            ["First wire lying very close to the true lumen", "Re-entry balloon"],
            ["Heavy calcium within the occlusion (reduces wire control)", "Re-entry balloon"],
            ["Bifurcation at the distal cap", "Retrograde if possible; otherwise parallel wiring"],
            ["Very hard, calcified distal cap", "Re-entry balloon (it bypasses the cap and punctures at the re-entry zone, where the plaque may be soft)"],
            ["No expansion of the haematoma", "Re-entry balloon"],
            [
              "A large distal lumen, good retrograde filling, and a device that reaches the cap easily",
              "Help both; but the re-entry balloon often still succeeds with a very small lumen or poorer filling, while a dual-lumen catheter is easier to deliver than the low-profile re-entry balloon",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Decide once.** The same authors warn against switching back and forth: an attempt with one technique makes the other much harder.",
            "**Decide early.** Each manipulation widens the space around the wire and erodes wire control, and repeated redirection or parallel wiring enlarges the haematoma that later defeats a re-entry balloon.",
            "**Non-anatomical factors count.** Experience with each technique, availability of the device and cost can outweigh the anatomy; in most countries parallel wiring costs a little less.",
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-decide-early" },
        {
          kind: "check",
          stem: "In a 30 mm RCA CTO, the first wire lies subintimally alongside a straight, disease-free distal RCA, very close to the lumen. Antegrade wire control is poor because of heavy calcium in the occlusion. You have tried redirecting twice. Which option do the Asia Pacific authors' criteria favour?",
          options: [
            "Parallel wiring through a dual-lumen microcatheter, because a second wire always follows the first most easily",
            "A re-entry balloon from the subintimal space in the distal RCA, moving to it without further redirection",
            "Further redirection attempts with progressively stiffer wires until one enters the lumen",
            "Parallel wiring first, then a re-entry balloon if it fails, to try both before going retrograde",
          ],
          answer: 1,
          explanation:
            "A subintimal first wire, poor wire control from calcium, a wire very close to the lumen and a good distal RCA re-entry zone all favour a re-entry balloon, and the authors advise moving to it promptly. More redirection enlarges the space around the wire and the haematoma, and trying one technique after the other is what they warn against, because the first attempt spoils the second.",
        },
        {
          kind: "pitfalls",
          items: [
            "Redirecting the same subintimal wire again and again until the haematoma hides the distal vessel.",
            "Pulling out the first wire before the second is safely in the true lumen.",
            "Losing a hard-won position in a distal side branch by pulling back, when a dual-lumen microcatheter would have kept it.",
            "Trying parallel wiring and then a re-entry balloon (or the reverse) in the same segment without a reason.",
            "Planning IVUS-guided wiring through guides too small to take it.",
          ],
        },
        {
          kind: "pearl",
          text: "When the first wire slips into the wall, stop and decide before you touch it again: redirect briefly, then parallel wire if the wire is in plaque and the distal cap is soft, or re-entry balloon if it is subintimal near a good landing zone. The decision is worth more than the next ten rotations.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, when the stiff wire stops short of the distal true lumen, decide and say whether it is in plaque or subintimal, then state whether you would parallel wire or use a re-entry balloon and why. (A dedicated parallel-wiring stage has been requested for this lab.)",
        },
        { kind: "video", id: "ptMEap-fbw0", note: "Manual of CTO PCI case 240: parallel wiring." },
        { kind: "video", id: "_VrWP6aZhpE", note: "Manual of CTO PCI case 196: parallel wiring." },
        { kind: "video", id: "_fqwBJmvxLU", note: "Manual of CTO Interventions case 68: parallel wiring." },
        { kind: "video", id: "9fXI4sMmKW4", note: "Manual of CTO PCI case 283: jailed LAD CTO." },
        {
          kind: "keypoints",
          items: [
            "Subintimal wire: redirect briefly and do not persist; then leave it as a marker and parallel wire, or go to dissection and re-entry.",
            "Dual-lumen microcatheters: parallel wiring, a side branch at the proximal cap, and keeping a distal side-branch position while wiring the main vessel.",
            "IVUS-guided re-entry needs 8 Fr guides and IVUS skill, and the subintimal IVUS catheter limits wire handling; the same applies to IVUS-guided parallel wiring.",
            "Parallel wiring works from within the plaque at the distal cap; a re-entry balloon works from the subintimal space at a chosen zone.",
            "Choose early and once: repeated manoeuvres enlarge the space and the haematoma.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-adr-track",
      title: "Antegrade dissection and re-entry I: entering and crossing within the wall",
      minutes: 15,
      topics: ["cto-adr"],
      sources: [B("21.8"), B("21.6"), B("8.6"), B("25.2"), B("26.4"), B("27.2"), B("30.2"), B("30.3"), B("30.7"), B("30.16"), O_CTO],
      refs: [
        ...BOOKS,
        "colombo-star-2005",
        "azzalini-vessel-architecture-2018",
        "danek-adr-registry-2016",
        "karacsonyi-crossboss-first-2018",
        "whitlow-fast-cto-2012",
        "wu-apcto-reentry-2020",
        "brilakis-cto-algorithm-2012",
        "harding-apcto-algorithm-2017",
        "wu-global-cto-algorithm-2021",
        "wu-apcto-antegrade-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Antegrade dissection and re-entry (ADR) means entering the vessel wall (the subintimal space), crossing the occluded segment within it, and then re-entering the distal true lumen. The dissection can be deliberate or the result of a wire that slipped during antegrade wiring. Kept short and controlled, it limits vessel injury and stent length; long subintimal tracks cause haematoma and side-branch loss (21.8.1, 21.8.2).",
        },
        { kind: "h", text: "From STAR to limited dissection and re-entry" },
        {
          kind: "list",
          items: [
            "**STAR (subintimal tracking and re-entry).** Colombo and colleagues advanced a J-shaped hydrophilic wire through the wall and let it re-enter wherever it would. In their 31 patients, 53% of those restudied had restenosis. Brilakis summarises the problem: uncontrolled re-entry meant long stented segments, many side branches lost, extensive vessel injury and high rates of restenosis and reocclusion.",
            "**What STAR is now.** A bail-out in which the track is ballooned but not stented, in preparation for another attempt (lesson 5).",
            "**Limited dissection and re-entry.** Dedicated re-entry systems and wire-based strategies keep the dissection short, the vessel injury small and the stented length shorter, and make side-branch survival more likely. Brilakis links these limited approaches to good clinical results in the studies he cites (21.8.2).",
            "**Vessel architecture.** Azzalini and colleagues describe the plaque, the disrupted intima and media and the adventitia as the 'vessel architecture', a safe space for wires and devices, as opposed to the extravascular space beyond it. Crossing in the wall is safe only while you stay inside that architecture.",
          ],
        },
        { kind: "h", text: "When ADR is chosen" },
        {
          kind: "table",
          head: ["Situation", "Source"],
          rows: [
            [
              "Primary strategy: clear proximal cap, good distal vessel, occlusion 20 mm or longer, no retrograde indication. Later algorithms do not use length alone (lesson 1)",
              "Hybrid algorithm (Brilakis Fig. 21.4); Harding 2017, Wu 2021, Wu 2025",
            ],
            ["After antegrade wiring fails, or after another strategy fails", "Hybrid algorithm; in the US registry ADR was used after another strategy in most ADR cases"],
            ["Unclear or very tortuous course: a knuckled wire (or a retrograde switch) is often preferred", "Brilakis 21.6"],
            [
              "Asia Pacific practice: start with wire escalation and reach the distal cap with the wire; keep up-front knuckles for 'long plus' occlusions (a long ambiguous segment with tortuosity and heavy calcium), where the 2025 update plans intentional subintimal tracking from the start",
              "Wu 2020; Wu 2025",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**How often, and how well.** In a US registry of 1,313 CTO PCIs (Danek 2016), ADR was used in 34.9% and was the first strategy in 12.9% of all cases. ADR cases were more complex and had lower technical success (86.9% against 91.8%), with similar major events (2.9% against 2.2%). Among antegrade-only cases, ADR and wire escalation had similar technical success (92.7% against 94.2%). Tamponade needing pericardiocentesis was commoner with ADR (1.8% against 0.1%).",
            "**Oxford's view.** Oxford lists catheter devices for guided blunt dissection among the evolving CTO techniques, used to help wires and equipment through occluded segments.",
          ],
        },
        { kind: "h", text: "Two ways to travel through the wall" },
        {
          kind: "steps",
          title: "The knuckled wire",
          items: [
            {
              title: "1. Choose the wire for the knuckle",
              detail:
                "A knuckled wire is one whose tip has folded back into a J-shaped loop (21.6). In Brilakis's wire table, stiff polymer-jacketed wires and one soft tapered polymer-jacketed wire are named for knuckle formation. Avoid knuckles on highly supportive wires, the support wires with a strong body that are used to deliver equipment (8.6). Neither manual describes how the loop is formed.",
            },
            {
              title: "2. Keep it small",
              detail:
                "The loop should stay small and never extend beyond the radiopaque part of the wire (8.6). Size is a trade-off: the Asia Pacific group notes that a bigger knuckle makes a bigger subintimal space but runs into small side branches less often, so with a small knuckle check in several views that it is still in the main vessel (Wu 2025).",
            },
            {
              title: "3. Advance it, with the microcatheter following",
              detail:
                "A knuckle travels within the vessel architecture with a low risk of perforation and passes through tortuosity without entering side branches as readily as a free tip (21.6, 8.6). It is not risk-free: a knuckle can still leave the vessel, and the hole it then makes is larger than a wire tip's (8.6, 26.4).",
            },
            {
              title: "4. Knuckle only with an indication, and watch for side branches",
              detail:
                "A knuckle that enters a branch can raise a haematoma there. In a case Wu's group describe, the wire had already reached the space beside the distal cap, so the knuckle was not needed; it repeatedly entered a right ventricular marginal branch, the haematoma pinched that branch, and in recovery the patient became hypotensive from right ventricular ischaemia and needed inotropic support. They do not knuckle without a clear indication (unclear course, tortuosity, calcium), and instead bougie the existing track. If a knuckle keeps entering a branch, stop knuckling: withdraw and redirect, or go back to a non-knuckled wire, as that operator did to regain the original space.",
            },
            {
              title: "5. Stop short of the distal cap",
              detail:
                "Wu's group stops the knuckle before the distal cap, brings the microcatheter up, and then uses a non-knuckled intermediate-penetration wire to reach the space alongside the distal cap, so that the space at the re-entry zone stays small. They do not advise trying to puncture the distal lumen with a stiff wire from a knuckle track: success is low and the haematoma grows.",
            },
            {
              title: "6. Do not force it",
              detail:
                "Aggressive knuckling deforms the wire and can entrap it (27.2). If a knuckled wire becomes entrapped, do not pull hard: a wire that loses its structural integrity can fracture or unravel, which may need surgery. Advance a microcatheter or balloon over it as far as possible and pull gently; if that fails, inflate a balloon over it; if that fails, cross with a second wire and inflate a balloon beside it. Brilakis shows an entrapped knuckle freed in exactly that last way.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-knuckle" },
        {
          kind: "steps",
          title: "The blunt dissection catheter",
          items: [
            {
              title: "What it is",
              detail:
                "A rigid metal over-the-wire catheter whose smooth, coated 1 mm tip is driven forward by fast rotation from a torque device. In the wall it opens only a narrow plane, so coming back into the lumen is easier (30.16).",
            },
            {
              title: "Keep it out of side branches",
              detail:
                "Its perforation risk is low as long as it does not go into a side branch (30.16). Wu shows a perforation after it entered an overlapping diagonal and a massive one after it entered a right ventricular marginal branch.",
            },
            {
              title: "Its perforations in the US registry",
              detail:
                "It caused three of the eight perforations in the ADR group (Danek 2016): one exited through the struts of an old stent during an in-stent CTO, and two occurred while crossing RCA occlusions.",
            },
            {
              title: "Advance in short steps",
              detail:
                "Set the torque device so that it acts as a brake on a sudden jump, advance only a short distance at a time, and check the position in two orthogonal views before going on (Danek 2016).",
            },
            {
              title: "Where it is most useful",
              detail:
                "The US registry authors describe it as particularly useful in in-stent occlusions, though it can exit through stent struts. In their registry it was used in in-stent CTOs about as often as wires, with numerically higher technical success (97.4% against 86.4%, not significant; observational data), and across all ADR cases its use went with higher technical success (89.8% against 83.5%) (Danek 2016). In 2020 the Asia Pacific group favoured it for in-stent CTOs that are straight, of shorter duration, without stent underexpansion, with a tapered cap and with both caps inside the stent, partly because a wire can pass unnoticed under thin stent struts; it also used it to make a straight track, or a final small channel, for a re-entry balloon. Its 2025 update now prefers three-dimensional wiring for in-stent CTOs (Wu 2025). Wu does not recommend the catheter to overcome an ambiguous course: a knuckle is the safer tool there.",
            },
            {
              title: "What the trials show",
              detail:
                "In CrossBoss First (246 patients randomised at 11 US centres), using the catheter first gave similar crossing time (56 against 66 minutes, not significant), success (technical 87.8% overall) and major events (3.28% against 4.03%) to wire escalation. In FAST-CTOs, a single-arm study of 150 CTOs that had failed standard techniques (mean length 41 mm), the crossing catheter with a re-entry system achieved 77% technical success; perforation occurred in 9.3%, three needing treatment, without tamponade.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-dissection-catheter" },
        {
          kind: "check",
          stem: "A 40 mm RCA CTO has a clear cap, a good distal vessel and a tortuous, poorly seen course through heavy calcium. You choose ADR. Which way of travelling the occluded segment fits both the hybrid and the Asia Pacific advice best?",
          options: [
            "A stiff tapered high-penetration wire steered along the expected course",
            "A blunt dissection catheter spun along the expected course to the distal cap",
            "A small knuckle on a polymer-jacketed wire, stopped short of the distal cap",
            "A workhorse wire through an over-the-wire balloon, pushed until it buckles",
          ],
          answer: 2,
          explanation:
            "An unclear, tortuous course is the indication for a knuckle in both schools: it stays within the vessel architecture with little perforation risk. Stopping short of the distal cap keeps the re-entry space small. The blunt dissection catheter is the tempting answer, but Wu specifically does not recommend it for an ambiguous course, and it perforates if it enters a branch. A stiff tapered wire steered into an unseen course is how vessels are exited.",
        },
        { kind: "h", text: "Protect the distal true lumen while you dissect" },
        {
          kind: "steps",
          items: [
            {
              title: "No antegrade injections once you are in the wall",
              detail:
                "Contrast injected from the antegrade guide expands the subintimal space and the haematoma. Wu's group removes the antegrade contrast syringe so that it cannot happen by accident; see the distal vessel by contralateral injection (or by a superselective injection into an ipsilateral collateral through a microcatheter).",
            },
            {
              title: "Reduce the inflow",
              detail:
                "During ADR a damped guide pressure is actually desirable, because it limits antegrade flow and haematoma growth (30.2, 30.3). A guide extension advanced to the proximal cap, ideally of the same size as the guide, seals much of the inflow; a balloon inflated in the proximal cap also stops it. Opening the Y-connector of the antegrade guide during contralateral injections lets the distal vessel fill better.",
            },
            {
              title: "Never inject into a damped or wedged system",
              detail:
                "Damping is wanted for inflow, not for injecting. Brilakis says not to inject when the waveform is damped, lists forceful injection through a wedged guide among the causes of aorto-coronary dissection, and urges extreme caution when injecting through a guide extension because of the risk of hydraulic dissection (25.2). So with the guide damped or a guide extension sitting at the cap, do not inject antegradely at all.",
            },
            {
              title: "Keep the dissection short",
              detail:
                "Every millimetre of wall you open beyond the distal cap is a millimetre of haematoma pressing on the true lumen and a side branch at risk (21.8.1). Re-enter close to the distal cap (next lesson).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-inflow" },
        {
          kind: "check",
          stem: "A knuckle has reached the distal cap of an RCA CTO. A colleague asks for a quick antegrade injection 'to see where we are'. What do you do?",
          options: [
            "Give a small, gentle antegrade puff, which is safe if the guide pressure is not damped",
            "Decline: see the distal vessel with a contralateral injection, and keep the antegrade syringe off the manifold",
            "Inject through the microcatheter at the knuckle tip instead of through the guide",
            "Inject antegradely only after withdrawing the knuckle a few millimetres",
          ],
          answer: 1,
          explanation:
            "Once the wall has been entered, antegrade contrast enlarges the subintimal space and the haematoma that compresses the distal lumen, so it is avoided altogether; the contralateral injection shows the distal vessel. A microcatheter injection into a subintimal track is the same error closer to the target. A gentle puff is the tempting compromise, but the volume is not what makes it harmful: any antegrade injection pressurises the dissection.",
        },
        {
          kind: "pitfalls",
          items: [
            "Letting the knuckle grow large or run beyond the radiopaque segment of the wire.",
            "Knuckling down a side branch, or spinning a dissection catheter into one.",
            "Pushing the knuckle well past the distal cap, or then trying to stab the distal lumen with a stiff wire from it.",
            "Antegrade contrast injections after the wall has been entered.",
            "Forcing a knuckle until the wire deforms and is trapped.",
            "Using a dissection catheter to find an ambiguous course.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of ADR as two separate jobs. The first is to get past the occlusion inside the vessel architecture without making a large space; the second is to come back into the lumen at a good spot. Many re-entries are made harder during the first job: excessive wiring, unnecessary knuckling, a long track or an antegrade injection all enlarge the haematoma (Wu 2020).",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, plan an ADR as if the occlusion were longer than 20 mm: say how you would travel the segment (knuckle or dissection catheter), where you would stop, how you would see the distal vessel without an antegrade injection, and how you would reduce inflow. (A knuckle and re-entry stage has been requested for this lab.)",
        },
        { kind: "video", id: "2c4hzgFDIiM", note: "Antegrade dissection and re-entry: step-by-step." },
        { kind: "video", id: "7TVoY_HaWXc", note: "Manual of CTO PCI case 134: trust the knuckle?" },
        { kind: "video", id: "-hOsoZZNt6g", note: "The CrossBoss First randomised controlled trial." },
        { kind: "video", id: "oedZujPSUGQ", note: "Manual of CTO Interventions case 19: a dissection catheter for an in-stent CTO." },
        {
          kind: "keypoints",
          items: [
            "ADR: enter the wall, cross within it, re-enter the distal true lumen; deliberate or after a wire slips.",
            "Old STAR caused long stents, lost side branches and restenosis; limited ADR keeps dissection and stent length short.",
            "Stay within the vessel architecture.",
            "Knuckle only with an indication (unclear course, tortuosity, calcium): small, within the radiopaque segment, not on support wires, out of side branches, stopped short of the distal cap.",
            "Entrapped knuckle: never pull hard; microcatheter or balloon over it, then a balloon inflated, then a second wire and balloon beside it.",
            "Blunt dissection catheter: short advances with the torque device as a brake, two-view checks, never into side branches; used in in-stent CTOs, where the Asia Pacific group now prefers three-dimensional wiring.",
            "No antegrade injections once in the wall, and never through a damped guide or a guide extension at the cap; reduce inflow with a damped guide, a guide extension or a blocking balloon.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-reentry",
      title: "Antegrade dissection and re-entry II: back into the distal true lumen",
      minutes: 16,
      topics: ["cto-adr"],
      sources: [B("21.8"), B("21.6"), B("21.13"), B("8.7"), B("8.9"), B("25.2"), B("30.6"), B("30.16"), O_CTO],
      refs: [
        ...BRILAKIS,
        "wu-apcto-reentry-2020",
        "danek-adr-registry-2016",
        "christopoulos-stick-swap-2015",
        "galassi-mini-star-2012",
        "hirai-spm-2018",
        "colombo-star-2005",
      ],
      blocks: [
        {
          kind: "p",
          text: "Re-entry is where ADR succeeds or fails. The aim is to come back into the distal true lumen close to the distal cap, at a spot where the wall is thin and free of calcium and no important branch will be lost, before a haematoma has had time to squash the lumen.",
        },
        { kind: "h", text: "Choose the re-entry zone" },
        {
          kind: "list",
          items: [
            "**Close to the distal cap.** Long subintimal tracks beyond the cap cause haematoma and side-branch loss (21.8.1, 21.8.2).",
            "**What makes a good zone.** Little calcium and plaque, a reasonable lumen, a wire close to the lumen, a small haematoma, a straight segment and a stable balloon position. Plaque thickness matters: in the study Wu cites, failed re-entries had much thicker plaque at the zone (1.32 mm against 0.33 mm).",
            "**The distal vessel itself.** Brilakis finds recanalisation easier when the distal vessel is over 2.0 mm, fills well, is largely free of disease and has no big branches. A small vessel with diffuse disease is harder, and more so once the wire is in the wall, though a vessel that is small only from underfilling may grow after flow returns. Calcium in the distal vessel also makes re-entry harder (21.6.3). The Asia Pacific authors add a wire less than 0.5 mm from the lumen, no expansion of the haematoma and good retrograde filling, and note that the re-entry balloon often succeeds even in very small distal lumens (Wu 2020).",
            "**By vessel.** The distal RCA is usually easy (straight, few branches); the mid RCA is harder; the LAD carries more risk of losing a side branch.",
            "**Plan it.** Preprocedural CT or the angiogram can identify the zone before the case.",
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-reentry-zone" },
        { kind: "h", text: "Re-entry with a re-entry balloon system" },
        {
          kind: "p",
          text: "The system Brilakis describes is a flat balloon, 2.5 mm wide and 10 mm long when inflated, with two side exit ports facing in opposite directions. Inflated at low pressure (4 atm) in the subintimal space, it lies flat against the vessel and turns one port towards the true lumen, most reliably when the dissection space is small; this is why the haematoma-control rules of lesson 4 matter here. A dedicated stiff re-entry wire with a very fine tapered tip is steered out of the port that faces the lumen (30.16).",
        },
        {
          kind: "steps",
          title: "Step by step (Brilakis 30.16; Asia Pacific CTO Club practice, Wu 2020)",
          items: [
            {
              title: "1. Prepare the balloon properly",
              detail:
                "Apply negative pressure with a syringe of undiluted contrast, release slowly and let contrast fill the balloon, then repeat. Well-filled wings are what let you see which way the re-entry wire will exit.",
            },
            {
              title: "2. Make a path for it",
              detail:
                "Advance a rotational microcatheter to the wire tip to dilate the track (the 'bougie' technique), exchange for a supportive wire and track the balloon to the zone. If even the microcatheter will not pass, dilate with a 1.5 mm balloon.",
            },
            {
              title: "3. Inflate at the zone",
              detail: "At low pressure, so that the balloon orients itself with one port facing the lumen.",
            },
            {
              title: "4. Aspirate the haematoma (STRAW)",
              detail:
                "Subintimal transcatheter withdrawal: when the wire is taken out of the balloon, attach an empty inflation device or syringe and keep it on suction (Wu's group keeps it negative for about 4 minutes). This shrinks the haematoma and makes the stick easier. When the haematoma is large, a second over-the-wire balloon beside the re-entry balloon can occlude the proximal vessel during suction (complete occlusive STRAW, done through an 8 Fr guide).",
            },
            {
              title: "5. Stick",
              detail:
                "Under fluoroscopy, direct the stiff re-entry wire (or another high-penetration wire the operator knows well) out of the port that faces the true lumen.",
            },
            {
              title: "6. Swap",
              detail:
                "Once the stick has entered the lumen, withdraw the stick wire and advance a familiar wire, often a polymer-jacketed one, through the same hole and down the true lumen. The stick wire is so penetrating that driving it down the distal vessel can dissect it ('stick-and-swap', used routinely by the Asia Pacific group).",
            },
            {
              title: "7. Confirm and remove",
              detail:
                "Confirm the distal true lumen in two views on contralateral injection (and with IVUS if in doubt), then remove the balloon by trapping. An 8 Fr guide takes a 3.0 mm trapping balloon; in a 7 Fr guide a 2.5 mm balloon traps the low-profile version. Do not use a hydraulic exchange for this balloon (8.9).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-stick-swap" },
        { kind: "tip", id: "pci-cto-antegrade-straw" },
        {
          kind: "p",
          text: "The sources differ on small guides. Brilakis writes that a 6 Fr guide does not allow trapping of the re-entry balloon (8.9). The Asia Pacific authors trap its low-profile version in a 6 Fr guide with a dedicated trapping balloon or a trapping guide extension, and one has walked it out of a 5 Fr guide over a 300 cm wire. Plan 7–8 Fr for any case that may need ADR.",
        },
        {
          kind: "check",
          stem: "A re-entry balloon is inflated in the subintimal space next to the distal LAD. The stiff re-entry wire has punctured into the lumen through the port facing it. What next?",
          options: [
            "Advance the stiff re-entry wire to the distal LAD to secure the position before swapping",
            "Withdraw the re-entry wire and pass a familiar, less penetrating wire through the same hole down the true lumen",
            "Inflate the re-entry balloon to a higher pressure to enlarge the opening into the lumen",
            "Inject contrast through the re-entry balloon's wire lumen to confirm that the stick entered the lumen",
          ],
          answer: 1,
          explanation:
            "This is the swap: the stick wire's job ends at the puncture, because driving such a penetrating wire down the distal vessel can dissect it. A familiar wire, often polymer-jacketed, follows the same hole into the lumen, and its position is then confirmed on contralateral injection. Securing the position with the stick wire is the tempting move and the one the Asia Pacific authors warn against.",
        },
        { kind: "h", text: "When the standard stick does not work" },
        {
          kind: "table",
          head: ["Problem", "Variant", "What it involves"],
          rows: [
            [
              "The distal vessel cannot be seen despite efforts to decompress the haematoma",
              "Double-blind stick-and-swap (Christopoulos 2015)",
              "Puncture blindly through both ports of the balloon, then exchange for a stiff polymer-jacketed wire, which finds whichever puncture reached the lumen",
            ],
            [
              "Small distal lumen; a single stick will not let the swap wire in",
              "Multi-stick-and-swap (Wu 2020)",
              "Push the high-penetration wire in and out of the same puncture 3–5 times, spinning it on the last pass, to enlarge the hole for the swap wire",
            ],
            [
              "A first attempt at re-entry has failed",
              "Bobsled (Danek 2016)",
              "Move the balloon further along the subintimal space before trying again (the registry defines the move but not when to use it); do not extend the track further than needed",
            ],
            [
              "The first wire lies far from the lumen",
              "Stick into the plaque first (Wu 2020)",
              "Use the balloon within the occlusion to bring the wire back into the plaque, steer it closer to the lumen, then re-dilate and stick again",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Registry use.** In the US registry the re-entry balloon was used in 54.8% of ADR cases; stick-and-swap in 82 cases (successful in 66), the bobsled in 8 and STRAW in 2 (Danek 2016). The Asia Pacific group now recommends STRAW and stick-and-swap routinely.",
            "**Do not wait.** One of the commonest mistakes they see when proctoring is moving to the re-entry balloon too late, after so much redirection or parallel wiring that the haematoma prevents re-entry.",
          ],
        },
        { kind: "h", text: "Wire-based re-entry" },
        {
          kind: "table",
          caption: "Named wire-based approaches (definitions from Danek 2016)",
          head: ["Technique", "What happens"],
          rows: [
            ["STAR", "The wire travels in the wall and re-enters spontaneously, wherever it happens to (the original technique, Colombo 2005)"],
            ["Contrast-guided STAR", "Contrast injection outlines the dissection plane to guide the wire"],
            [
              "Mini-STAR",
              "Only a short subintimal track, with early re-entry; Galassi's retrospective, non-randomised series reported 97.6% procedural success against 52% with other bail-out strategies after a failed first attempt",
            ],
            ["LAST (limited antegrade subintimal tracking)", "A stiffer wire re-enters just beyond the lesion"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis also names, among microcatheter uses, injecting contrast into the plaque or the subintimal space during CTO work (the Carlino technique), and he notes that IVUS can guide antegrade re-entry, with the 8 Fr requirement and the handling limits taught in lesson 3. Both are specialist techniques; neither manual describes them step by step.",
        },
        { kind: "h", text: "When re-entry fails" },
        {
          kind: "steps",
          items: [
            {
              title: "Change strategy",
              detail: "Retrograde crossing, if a route exists, is the usual next box in the hybrid algorithm (cp-cto-strategy, cp-cto-retrograde).",
            },
            {
              title: "Or invest and come back",
              detail:
                "STAR now survives as a bail-out: the subintimal track is ballooned without stenting, and a repeat attempt is planned 2–3 months later (subintimal plaque modification, the 'investment' procedure, 21.8.2). In an observational 12-centre registry, plaque modification was done in 59 of 138 failed CTO PCIs, did not increase complications, and was associated with a greater improvement in the Seattle Angina Questionnaire summary score at 30 days (adjusted 10.5 points; Hirai 2018). The authors add that whether patients who improve this much still need a later PCI remains to be studied.",
            },
            {
              title: "Or stop",
              detail:
                "Brilakis's stop triggers apply: a complication; a high radiation dose (usually an air kerma above 5 Gy without crossing or substantial progress); a contrast volume above 3.7 times the estimated creatinine clearance; no crossing options left; or patient or operator fatigue. He asks for a fresh weighing of the patient's risk against benefit at each stage, and writes that STAR or an honest failure is often better than an aggressive strategy that risks serious complications (21.8.5; taught in full in cp-cto-strategy).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-investment" },
        {
          kind: "check",
          stem: "After 2 hours, repeated stick attempts in a long RCA CTO have failed; the distal RCA is now poorly seen because of haematoma. There is no retrograde route, contrast is near the limit for this patient, and the track runs subintimally to just beyond the distal cap. What is the most appropriate plan?",
          options: [
            "Continue sticking blindly with progressively stiffer wires until one reaches the lumen",
            "Stent the subintimal track as far as the distal cap and hope the stents compress the haematoma",
            "Balloon the subintimal track without stenting, stop, and plan a repeat attempt in 2–3 months",
            "Inject antegradely to opacify the distal vessel and choose a new zone",
          ],
          answer: 2,
          explanation:
            "This is the setting for the modern use of STAR: dilate the track without stenting (investment), stop within the contrast limit, and return after 2–3 months; registry data link it to better early health status without more complications. Continuing to stick blindly into a haematoma is the tempting persistence that Brilakis warns against when he says failure can be better than aggressive strategies. Antegrade injection would enlarge the haematoma further, and stenting a subintimal track without re-entry achieves nothing.",
        },
        {
          kind: "pitfalls",
          items: [
            "Re-entering far down the vessel because the knuckle went there, instead of choosing a zone near the distal cap.",
            "Skipping balloon preparation, so the ports cannot be seen.",
            "Driving the stick wire down the distal vessel instead of swapping.",
            "Moving to the re-entry balloon only after the haematoma has hidden the distal vessel.",
            "Removing the re-entry balloon by hydraulic exchange, or finding that the guide is too small to trap it.",
            "Stenting a long subintimal track to rescue a failed re-entry, when investment and a later attempt would serve better.",
          ],
        },
        {
          kind: "pearl",
          text: "Every re-entry is decided by three numbers you can influence before you stick: how close the wire is to the lumen, how thick the plaque is at the zone, and how big the haematoma has become. Choose the zone for the first two, and control inflow and use STRAW for the third.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Run IVUS on the bench and practise telling a wire in the true lumen from one in the wall on each frame, as you would when confirming re-entry; the fluoroscopic re-entry stage itself has been requested for the PCI lab.",
        },
        { kind: "video", id: "Xwb_bZorzRc", note: "Problem solving in antegrade dissection and re-entry CTO interventions." },
        { kind: "video", id: "F4_qKy5YqdE", note: "Manual of CTO Interventions case 80: a double re-entry balloon technique." },
        { kind: "video", id: "KABiHnf4G80", note: "Manual of CTO PCI case 142: triple blind stick and swap." },
        { kind: "video", id: "2s8oMdjgipM", note: "Manual of CTO Interventions case 9: subintimal plaque modification (investment)." },
        {
          kind: "keypoints",
          items: [
            "Re-enter close to the distal cap at a calcium-free, thin-plaque zone; the distal RCA is usually easiest, the LAD risks side branches.",
            "Re-entry balloon: prepare with contrast, bougie the track, inflate at low pressure, STRAW, stick from the lumen-facing port, then swap.",
            "Variants: double-blind and multi stick-and-swap, the bobsled, sticking into plaque first.",
            "Wire-based re-entry: STAR, contrast-guided STAR, mini-STAR, LAST.",
            "Confirm in two views; remove by trapping, with 7–8 Fr guides.",
            "If re-entry fails: retrograde, investment (balloon the track, no stent, return in 2–3 months) or stop.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-antegrade-move-cap",
      title: "Moving the cap: BASE and scratch-and-go",
      minutes: 11,
      topics: ["cto-base"],
      sources: [B("21.6"), B("21.8"), B("23.1"), B("25.2"), O_CTO],
      refs: [
        ...BRILAKIS,
        "vo-move-the-cap-2016",
        "alexandrou-base-2023",
        "roy-side-base-2018",
        "giangiacomi-scratch-go-2024",
        "karatasakis-cap-ambiguity-2016",
        "galassi-eurocto-consensus-2019",
        "wu-apcto-antegrade-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Sometimes the antegrade problem is the proximal cap itself: it cannot be located, or it cannot be penetrated by any wire. Brilakis lists dissection and re-entry ('move the cap') techniques among the ways to deal with an ambiguous cap, and as one of two antegrade options when the cap stays ambiguous and no collateral or graft is available (21.6, 21.8.4). The idea is to stop attacking the cap and to enter the vessel wall just before it instead, then continue as ADR.",
        },
        {
          kind: "p",
          text: "Neither manual describes these techniques step by step, so this lesson teaches them from the papers that describe them, and keeps to what those papers state.",
        },
        { kind: "h", text: "The two ways in" },
        {
          kind: "table",
          head: ["", "Scratch-and-go", "BASE (balloon-assisted subintimal entry)"],
          rows: [
            [
              "How the wall is entered",
              "A stiff wire is deliberately directed into the wall just before the proximal cap",
              "Inflating a slightly oversized balloon just before the cap helps the wire enter the subintimal space",
            ],
            ["What follows", "Standard antegrade dissection and re-entry", "Standard antegrade dissection and re-entry"],
            [
              "Source",
              "Vo 2016 described both ways in; the EuroCTO Club's 2019 consensus already named scratch-and-go (as cited by Wu 2025); Giangiacomi 2024 is a non-CTO example",
              "Vo 2016 described both ways in; the name BASE was in use by 2018 (Roy 2018) and the EuroCTO 2019 consensus advised it (as cited by Wu 2025); Alexandrou 2023 is the largest BASE registry",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Why it is attractive.** Vo, Karmpaliotis and Brilakis describe move-the-cap as a way to cross ambiguous or impenetrable caps while keeping the perforation risk low, and add that it also helps with balloon-uncrossable lesions.",
            "**How often, and in which lesions.** In a registry of 31 centres (2016–2023), BASE was used in 155 of 1,968 ADR cases (7.9%). Those lesions were longer (42 against 37 mm), had higher J-CTO and PROGRESS-CTO scores, and more often had proximal cap ambiguity, a side branch at the proximal cap, a blunt or absent stump, moderate or severe calcium and proximal tortuosity.",
            "**Results.** Technical success (71.6% against 75.5%), procedural success and major events (1.3% against 4.1%) were similar to ADR without BASE: moderate success, but low event rates, in hard lesions.",
          ],
        },
        {
          kind: "check",
          stem: "In the BASE technique, what is the purpose of the balloon inflated just proximal to the cap?",
          options: [
            "To dilate the proximal cap so that a soft wire can then cross it within the plaque",
            "To help the wire enter the subintimal space before the cap, after which the case continues as ADR",
            "To anchor the guide catheter so that a stiff wire can penetrate the cap with more force",
            "To occlude inflow while a stiff wire punctures the cap under contralateral injection",
          ],
          answer: 1,
          explanation:
            "Move-the-cap techniques bypass the cap rather than attacking it: the slightly oversized balloon facilitates subintimal entry proximal to the cap, and standard antegrade dissection and re-entry follows. Anchoring for more push and dilating the cap for intraplaque wiring are different ideas; reducing inflow helps during ADR but is not the purpose of the BASE balloon.",
        },
        { kind: "h", text: "The sequence" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Confirm that moving the cap is the right answer",
              detail:
                "The cap remains ambiguous after projections, a microcatheter injection, IVUS or CT, or it resists all appropriate wires; and a primary retrograde approach is not available or not preferred (cap ambiguity is taught in cp-cto-strategy). In the US registry Brilakis cites (Karatasakis 2016), the retrograde approach was used in about two-thirds of CTOs with an ambiguous cap.",
            },
            {
              title: "2. Look at the side branches at the cap",
              detail:
                "A branch arising at the cap can be lost when the wall is entered there. Concern about proximal side-branch loss with BASE led Roy, Hill and Spratt to describe side-BASE, which combines an anchor balloon in the side branch with balloon-assisted subintimal entry, and uses the side branch to reach the subintimal space before the occlusion.",
            },
            {
              title: "3. Enter the wall",
              detail: "With a stiff wire directed into the wall (scratch-and-go) or with the help of a slightly oversized balloon inflated just before the cap (BASE).",
            },
            {
              title: "4. Continue as ADR",
              detail:
                "Travel within the vessel architecture past the occlusion (lesson 4), re-enter the distal true lumen near the distal cap (lesson 5), with the same rules: no antegrade injections into the dissection, inflow controlled, position checked in two views.",
            },
            {
              title: "5. Confirm and finish",
              detail: "Confirm the distal true lumen, exchange for a workhorse wire and complete the PCI with imaging (cp-cto-strategy).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-antegrade-move-cap" },
        {
          kind: "list",
          items: [
            "**The same idea outside CTOs.** Giangiacomi and colleagues used scratch-and-go to bypass a fractured microcatheter tip that had acutely occluded a calcified proximal RCA: a stiff wire entered the subintimal space past the fragment and, after exchange for another wire, re-entered the true lumen at the acute margin; IVUS confirmed the re-entry and flow was restored with stents.",
            "**Related subintimal techniques.** For balloon-uncrossable lesions Brilakis describes external crush and the subintimal distal anchor, both of which need subintimal wire crossing and experienced operators; they are taught in cp-uncrossable (23.1).",
            "**Care at the aortic ostium.** Brilakis lists antegrade attempts to recanalise a true aorto-ostial CTO among the causes of aorto-coronary dissection, and notes that operators often go retrograde from the start for flush aorto-ostial CTOs (25.2, 21.8.4).",
          ],
        },
        {
          kind: "check",
          stem: "A proximal LAD CTO starts at a large first diagonal, the cap cannot be defined despite IVUS from the diagonal and a preprocedural CT, and there is no usable collateral. Which plan follows the sources?",
          options: [
            "Probe the presumed cap with the stiffest available wire, guided by the IVUS image of the diagonal",
            "Enter the wall just before the cap (BASE or scratch-and-go) with a plan to protect the diagonal, then continue as ADR",
            "Start a primary retrograde approach through the best available non-interventional collateral",
            "Abandon PCI, because an ambiguous cap without collaterals cannot be crossed antegradely",
          ],
          answer: 1,
          explanation:
            "Without a retrograde route, Brilakis's antegrade options for an unresolved ambiguous cap are imaging-guided entry or move-the-cap techniques. Here imaging has not resolved it, so entering the wall before the cap and continuing as ADR fits, with the diagonal protected (the concern behind side-BASE). Probing blindly with a stiff wire is the classic route to perforation, and a non-interventional collateral is not a retrograde option.",
        },
        {
          kind: "pitfalls",
          items: [
            "Using move-the-cap before the cap has been properly imaged and the retrograde option considered.",
            "Entering the wall at a bifurcation without a plan for the side branch.",
            "Forgetting that the case has now become an ADR case, with all of its haematoma rules.",
            "Forgetting that antegrade attempts at a true aorto-ostial occlusion can cause aorto-coronary dissection, when a retrograde approach is often chosen there.",
          ],
        },
        {
          kind: "pearl",
          text: "Moving the cap changes the question from 'how do I get through this cap?' to 'where is the best place to enter the wall above it, and where will I come back in below it?'. Answer both before you inflate a balloon or point a stiff wire at the wall.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, imagine the cap could not be penetrated by any wire. Point to where you would enter the wall above the cap, name the branch you would need to protect, and describe the ADR that follows. (A move-the-cap stage has been requested for this lab.)",
        },
        { kind: "video", id: "q_N951pnpuU", note: "Manual of CTO PCI video 8.2.7: when and how to do BASE and scratch-and-go." },
        { kind: "video", id: "MNA2VgMEVjs", note: "Manual of CTO Interventions case 82: BASE (balloon-assisted subintimal entry)." },
        { kind: "video", id: "l8CavAxZ0fM", note: "Manual of CTO Interventions case 2: scratch-and-go for proximal cap ambiguity." },
        { kind: "video", id: "xTDZweBUa5I", note: "Manual of CTO PCI case 209: side BASE." },
        {
          kind: "keypoints",
          items: [
            "Move-the-cap: enter the wall just proximal to an ambiguous or impenetrable cap, then continue as standard ADR.",
            "Scratch-and-go uses a stiff wire to enter the wall; BASE uses a slightly oversized balloon to help the wire in.",
            "Described as keeping perforation risk low; also useful for balloon-uncrossable lesions.",
            "BASE lesions are complex; success is moderate, events low.",
            "Plan for side branches at the cap (side-BASE).",
            "True aorto-ostial CTOs: antegrade attempts can cause aorto-coronary dissection, and they are often approached retrogradely.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-cto-antegrade-q1",
      stem: "According to Brilakis, what should follow once a stiff, high-penetration wire has crossed 1–2 mm of a resistant proximal cap?",
      options: [
        "Advance the same wire through the rest of the occlusion while it is making progress",
        "Change to a less penetrating wire to travel through the occluded segment",
        "Advance the microcatheter over the stiff wire to the distal cap before any change",
        "Form a knuckle on the stiff wire to protect the distal vessel",
      ],
      answer: 1,
      explanation:
        "This is the step-up/step-down technique: escalate to get through the cap, then de-escalate to navigate the body of the occlusion safely. Carrying on with the stiff wire because it is moving is the tempting error. Forming a knuckle is a dissection manoeuvre, not a way to protect the distal vessel after a stiff tapered wire has crossed the cap, and Brilakis advises against knuckles on highly supportive wires.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-antegrade-q2",
      stem: "A CTO has a tapered proximal cap with a faint channel visible through it. Following Brilakis, which first wire is appropriate?",
      options: [
        "A stiff, tapered wire with strong penetrating power",
        "A stiff polymer-jacketed wire formed into a knuckle",
        "A low-penetration, tapered, polymer-jacketed wire",
        "A support wire with a soft tip and a strong body",
      ],
      answer: 2,
      explanation:
        "A tapered cap, or a functional occlusion in which a channel can be seen, is entered with a low-penetration, tapered, polymer-jacketed wire, escalating only if required. Strong-penetration wires are for resistant caps, knuckles for dissection strategies, and support wires for equipment delivery.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-antegrade-q3",
      stem: "After a long ADR, the microcatheter has been advanced over a wire you believe has re-entered the distal LAD, but you are not certain. Which way of confirming it carries a specific risk if you are wrong?",
      options: [
        "A contralateral injection viewed in two orthogonal projections",
        "Advancing a workhorse wire through the microcatheter and feeling for resistance",
        "IVUS of the segment, using a solid-state catheter",
        "A contrast injection through the microcatheter at the presumed re-entry point",
      ],
      answer: 3,
      explanation:
        "If the tip is subintimal, an injection through the microcatheter expands the dissection and enlarges the subintimal space, making re-entry harder (Brilakis), even though Oxford suggests dye through an over-the-wire balloon to check position. Contralateral injection in two views, the workhorse-wire resistance test and IVUS carry no such risk.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-cto-antegrade-q4",
      stem: "Why does Brilakis advise against hydraulic (saline-jet) exchange of a microcatheter in CTO PCI?",
      options: [
        "The saline jet can dissect the proximal vessel at the guide tip",
        "Air is entrained into the guide and embolises down the coronary during the jet",
        "The wire can be driven forward unpredictably and perforate distally",
        "The microcatheter cannot be pressurised enough to move the wire",
      ],
      answer: 2,
      explanation:
        "Hydraulic exchange may not hold the wire position, and with stiff tapered or polymer-jacketed wires an inadvertent forward jump risks distal perforation; trapping is preferred. Air entrainment is a hazard of trapping (hence back-bleeding afterwards), not the reason given against the hydraulic method.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-antegrade-q5",
      stem: "Your antegrade wire in an RCA CTO has reached the distal cap without entering the lumen; it appears to be within the plaque and responds well to torque. The distal cap looks soft and lies in the mid RCA. Which next technique do the Asia Pacific criteria favour?",
      options: [
        "A re-entry balloon from the subintimal space in the mid RCA",
        "Parallel wiring with a second wire, the first left in place as a marker",
        "Advancing the first wire further into the distal RCA wall to find a better zone",
        "A knuckle on a stiff polymer-jacketed wire through the distal cap",
      ],
      answer: 1,
      explanation:
        "A soft distal cap, a first wire in plaque with preserved control, and a mid-RCA distal cap (a difficult re-entry zone) all favour parallel wiring. Driving the wire further down in the wall raises a haematoma, and knuckling into the distal cap enlarges the space at exactly the place you need to re-enter.",
      difficulty: 3,
      refs: ["wu-apcto-reentry-2020", ...BRILAKIS],
    },
    {
      id: "cp-cto-antegrade-q6",
      stem: "What was the main problem with the original STAR technique that led to the development of limited dissection and re-entry?",
      options: [
        "It could only be performed retrogradely, through septal collaterals, which limited it to a few patients",
        "Re-entry was uncontrolled, leading to long stents, lost side branches and high restenosis and reocclusion",
        "It required dedicated re-entry balloons and stiff re-entry wires that were not widely available at that time",
        "Its perforation rate was so high that it was unsafe even as a bail-out strategy at expert centres",
      ],
      answer: 1,
      explanation:
        "STAR used a J-shaped hydrophilic wire that re-entered wherever it would, which often meant stenting long segments, losing branches and high rates of restenosis (53% of the restudied patients in the original series) and reocclusion. It survives as a bail-out without stenting (investment). Dedicated re-entry systems came later, as part of the solution.",
      difficulty: 1,
      refs: [...BRILAKIS, "colombo-star-2005"],
    },
    {
      id: "cp-cto-antegrade-q7",
      stem: "During ADR in a long RCA CTO, a knuckle has been advanced to the distal cap. The contralateral injection shows the distal RCA progressively narrowing beyond the cap. Which combination of measures best addresses this?",
      options: [
        "A gentle antegrade injection to define the haematoma, then a stiffer stick wire through the knuckle track",
        "Prompt use of a re-entry balloon with STRAW, no antegrade injections, and inflow reduced with a guide extension at the cap",
        "Advance the knuckle further into the distal RCA beyond the narrowing, so that the haematoma can decompress into the distal vessel",
        "Continue redirecting the knuckle until it finds the lumen, then switch to parallel wiring",
      ],
      answer: 1,
      explanation:
        "A growing subintimal haematoma compresses the true lumen. The Asia Pacific authors recommend moving promptly to the re-entry balloon, aspirating through it (STRAW), avoiding antegrade injections, and reducing inflow with a guide extension or blocking balloon. Advancing or redirecting the knuckle enlarges the space, and stabbing from a knuckle track is specifically not advised.",
      difficulty: 3,
      refs: ["wu-apcto-reentry-2020", ...BRILAKIS],
    },
    {
      id: "cp-cto-antegrade-q8",
      stem: "In the CrossBoss First randomised trial (246 patients), how did starting with a blunt dissection catheter compare with antegrade wire escalation?",
      options: [
        "It halved the crossing time but at the cost of more perforations",
        "It improved technical success but used more equipment and cost",
        "Crossing time, success, complications, equipment use and cost were similar",
        "It reduced major adverse events but prolonged the procedure and the fluoroscopy time",
      ],
      answer: 2,
      explanation:
        "Crossing time was 56 against 66 minutes (not significant), technical and procedural success were 87.8% and 84.1% overall and similar between arms, procedural major events were 3.28% against 4.03%, and secondary end points including equipment use and cost did not differ. None of the other options matches the trial.",
      difficulty: 2,
      refs: ["karacsonyi-crossboss-first-2018"],
    },
    {
      id: "cp-cto-antegrade-q9",
      stem: "A re-entry balloon is in place at a good zone, but after attempts to decompress the haematoma the distal vessel still cannot be seen on contralateral injection. Which technique was described for this situation?",
      options: [
        "Multi-stick-and-swap through the port facing the presumed lumen",
        "The bobsled, moving the balloon further along the subintimal space",
        "Double-blind stick-and-swap, puncturing through both ports",
        "Contrast-guided STAR, injecting to outline the dissection plane",
      ],
      answer: 2,
      explanation:
        "Christopoulos and colleagues described the double-blind stick-and-swap for exactly this: when the distal vessel cannot be seen, puncture blindly through both ports, then swap for a stiff polymer-jacketed wire that finds the puncture into the lumen. Multi-stick is for a small distal lumen, and contrast injection into the dissection would enlarge the haematoma further.",
      difficulty: 3,
      refs: ["christopoulos-stick-swap-2015"],
    },
    {
      id: "cp-cto-antegrade-q10",
      stem: "Which statement about move-the-cap techniques is supported by the sources?",
      options: [
        "They enter the wall proximal to the cap and are followed by standard ADR, and are also useful for balloon-uncrossable lesions",
        "They are the recommended first approach to flush aorto-ostial CTOs, because there is no stump available for the guide to engage",
        "In the BASE registry they achieved higher technical success than ADR without BASE in less complex lesions",
        "They aim to dilate the cap so that wire escalation can then continue within the plaque",
      ],
      answer: 0,
      explanation:
        "Vo and colleagues describe subintimal entry proximal to the cap with a stiff wire or a slightly oversized balloon, followed by standard ADR, and note usefulness in balloon-uncrossable lesions. Flush aorto-ostial CTOs are often approached retrogradely, and antegrade attempts at true aorto-ostial CTOs can cause aorto-coronary dissection. BASE lesions were more complex, with similar (not higher) success.",
      difficulty: 3,
      refs: ["vo-move-the-cap-2016", "alexandrou-base-2023", ...BRILAKIS],
    },
    {
      id: "cp-cto-antegrade-q11",
      stem: "Which statement about forming and using a knuckle wire is correct?",
      options: [
        "A knuckle cannot perforate the vessel, so it can be pushed freely through any course, however tortuous or calcified",
        "The loop should stay small and within the radiopaque segment; if it does exit the vessel, the perforation is larger",
        "Knuckles work best on highly supportive wires, which hold the loop shape",
        "A large knuckle is preferred because the wider loop keeps the subintimal space and the haematoma small",
      ],
      answer: 1,
      explanation:
        "Brilakis advises a small knuckle confined to the radiopaque part of the wire and not on highly supportive wires. A knuckle is less likely to perforate than a free tip, but it can still exit the vessel, and the resulting hole is larger. A larger loop does the opposite of keeping the space small: it enlarges the subintimal space and the haematoma, although the Asia Pacific group notes it enters small branches less often.",
      difficulty: 2,
      refs: [...BRILAKIS, "wu-apcto-antegrade-2025"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Use IVUS on the bench to tell a wire in the true lumen from one in the vessel wall, as you would when confirming re-entry after dissection.",
    },
  ],
  caseIds: ["cp-cto-antegrade-case-lad", "cp-cto-antegrade-case-rca"],
};

export const cases: CaseStudy[] = [
  {
    id: "cp-cto-antegrade-case-lad",
    title: "Short LAD CTO: from wire escalation to parallel wiring",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, 21.8 with 8.1–8.9 and 30.6–30.7; Oxford Handbook, ch 8: Chronic total occlusion PCI; Asia Pacific CTO Club (Wu 2020)",
    },
    summary:
      "Choosing the first wire from the cap, escalating and stepping down, recognising a wire outside the vessel and a wire in the wall, parallel wiring with a dual-lumen microcatheter, confirming the true lumen and exchanging safely.",
    presentation:
      "A 61-year-old man has CCS class III angina despite three antianginal drugs, with a large anterior perfusion defect and no scar on MRI. This is a planned CTO procedure: an 8 Fr EBU guide in the left coronary through the right femoral artery, a 6 Fr guide in the RCA through the right radial artery for contralateral injection, unfractionated heparin with the ACT above 300 s.",
    findings: [
      "Mid-LAD CTO just beyond the second septal; tapered proximal cap with a faint channel.",
      "Occlusion length about 15 mm on dual injection; the distal LAD is 2.5 mm and fills well from the RCA through thin septal connections that are not interventional.",
      "No major branch at the distal cap; moderate calcium in the occluded segment.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How do you start crossing?",
        options: [
          {
            text: "Bring a microcatheter to the cap with a low-penetration, tapered, polymer-jacketed wire.",
            best: true,
            feedback:
              "Correct. A tapered cap with a visible channel is Brilakis's indication for starting at the bottom of the ladder, and the microcatheter supports the wire and allows quick exchanges.",
          },
          {
            text: "Start with a stiff, tapered, strong-penetration wire through the microcatheter to save time.",
            feedback:
              "Strong-penetration wires are for caps or segments that resist. Starting with one at a tapered cap risks leaving the channel and the vessel.",
            next: "s1-stiff",
            stateDelta: { stability: -10, flags: ["stiff-first"] },
          },
          {
            text: "Advance a workhorse wire on its own, keeping the microcatheter in reserve.",
            feedback:
              "A microcatheter is one of the global principles of CTO PCI; without it each wire change means rewiring from the ostium and the tip has no support.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s1-stiff",
        kind: "consequence",
        prompt: "The stiff wire jumps forward. Its tip now moves out of step with the vessel and the patient has runs of ventricular ectopics. In the orthogonal view on contralateral injection it lies beyond the LAD contour. What do you do?",
        options: [
          {
            text: "Withdraw the wire and redirect it, advancing nothing over it, and watch the contralateral injections for staining.",
            best: true,
            feedback:
              "Right. A wire outside the vessel is withdrawn and redirected; a microcatheter or balloon following it could create or enlarge a perforation. Restart the ladder with a softer wire.",
          },
          {
            text: "Advance the microcatheter to the tip and inject to see exactly where it is.",
            feedback:
              "Advancing anything over a wire that has left the vessel can turn a wire hole into a real perforation. A small effusion is seen on echo and is watched.",
            stateDelta: { stability: -15, flags: ["exit-perforation"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The soft tapered wire follows the channel for a few millimetres and then stops, buckling at a hard segment. What next?",
        options: [
          {
            text: "Escalate to an intermediate-penetration wire through the same microcatheter, adjusting the tip bend.",
            best: true,
            feedback: "Correct: escalate one rung at a time, and keep the microcatheter close behind the tip.",
          },
          {
            text: "Switch to a retrograde approach through the septal connections.",
            feedback:
              "The septal connections are not interventional, and antegrade wiring has barely started. Small changes come before big ones.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Form a knuckle and dissect through the segment.",
            feedback:
              "Knuckling a short occlusion with a tapered cap and a clear course has no indication: the Asia Pacific authors do not knuckle without one (unclear course, tortuosity, calcium), and the knuckle only enlarges the space. The next rung of the wire ladder comes first.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "A stiffer wire was needed and has now passed about 2 mm through the hard segment, within the expected course. What do you do?",
        options: [
          {
            text: "Step down to a less penetrating wire to travel the rest of the occlusion.",
            best: true,
            feedback:
              "Correct: step-up/step-down. Brilakis gives the 1–2 mm rule for the proximal cap; the same logic applies after a resistant segment inside the occlusion. The stiff wire has done its job, and a softer one is safer for the rest.",
          },
          {
            text: "Keep pushing the stiff wire, since it is progressing.",
            feedback:
              "Brilakis steps down after the resistant part because stiff wires are more likely to leave the plaque or perforate. Here the wire tracks into the wall beside the distal cap.",
            next: "s3-deep",
            stateDelta: { stability: -10, flags: ["deep-subintimal"] },
          },
        ],
      },
      {
        id: "s3-deep",
        kind: "consequence",
        prompt: "The stiff wire has run about 20 mm down the distal LAD in the wall; the distal lumen is starting to look narrower on contralateral injection. What now?",
        options: [
          {
            text: "Pull the wire back to just beyond the distal cap and treat the situation as a subintimal wire at the distal cap.",
            best: true,
            feedback:
              "Right. Subintimal advancement well beyond the distal cap raises a haematoma that compresses the lumen; come back to the distal cap and decide on parallel wiring or re-entry.",
          },
          {
            text: "Push further: the wire may re-enter by itself lower down.",
            feedback: "That is uncontrolled STAR: long dissection, lost branches, and a growing haematoma that makes any later re-entry harder.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The softer wire reaches the distal cap. On orthogonal views it lies within the occluded segment just short of the distal lumen and has not entered it. One redirection has failed. What next?",
        info: "The distal cap looks soft, the wire is responsive to torque, and the distal LAD is a good size.",
        options: [
          {
            text: "Leave this wire as a marker and pass a second wire through a dual-lumen microcatheter to puncture the distal cap into the true lumen.",
            best: true,
            feedback:
              "Correct. A wire still in the plaque at the cap, a soft distal cap, a responsive wire and a good distal lumen favour parallel wiring; the first wire marks the wrong channel.",
          },
          {
            text: "Advance the microcatheter and inject through it to see whether the tip is really outside the lumen.",
            feedback:
              "If the tip has strayed under the intima, the injection extends the dissection and enlarges the space, making the true lumen harder to reach.",
            next: "s4-inject",
            stateDelta: { stability: -10, flags: ["haematoma"] },
          },
          {
            text: "Change to a re-entry balloon system.",
            acceptable: true,
            feedback:
              "A valid option, especially if the wire were subintimal with poor control; here the anatomy favours parallel wiring. Whichever you choose, choose once.",
          },
        ],
      },
      {
        id: "s4-inject",
        kind: "consequence",
        prompt: "The microcatheter injection stains the wall and the distal LAD now fills poorly from the RCA. What do you do?",
        options: [
          {
            text: "Stop injecting antegradely, proceed promptly to parallel wiring or a re-entry balloon with aspiration, and rely on contralateral injections.",
            best: true,
            feedback:
              "Right: limit the haematoma and move on without delay; every further manoeuvre in the wall makes re-entry harder.",
          },
          {
            text: "Inject again with more contrast to outline the distal lumen.",
            feedback: "Each injection enlarges the haematoma further. The distal LAD disappears.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The second wire punctures the distal cap and passes freely down the LAD; in both views it lies within the lumen. How do you finish the crossing?",
        options: [
          {
            text: "Advance the microcatheter into the distal true lumen, exchange for a workhorse wire, remove the first wire and trap to remove the microcatheter, then back-bleed.",
            best: true,
            feedback:
              "Correct. Polymer-jacketed and stiff wires are exchanged immediately; trapping keeps the distal position and back-bleeding clears entrained air.",
          },
          {
            text: "Predilate over the crossing wire to save time, then exchange.",
            feedback: "Ballooning on a slippery or stiff crossing wire risks distal perforation; the exchange comes first.",
            stateDelta: { stability: -10, flags: ["distal-perforation-risk"] },
          },
          {
            text: "Exchange for a workhorse wire and remove the microcatheter by hydraulic exchange.",
            feedback:
              "Brilakis advises against hydraulic exchange in CTO PCI: the wire can move unpredictably. Trapping is preferred.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The LAD was predilated and stented under IVUS guidance with a good result and no effusion on echo. The crossing took one redirection and one parallel wire.",
    outcomeVariants: [
      { flag: "exit-perforation", text: "A small pericardial effusion from the early wire exit was watched with echo and did not need drainage." },
      { flag: "haematoma", text: "The subintimal haematoma made the parallel wire harder and the procedure longer; the distal LAD needed an extra stent." },
      { flag: "deep-subintimal", text: "The long subintimal track left the distal LAD narrowed, which lengthened the stented segment." },
    ],
    learningPoints: [
      "Choose the first wire from the cap: soft and tapered for a tapered cap with a channel.",
      "Escalate one rung at a time and step down once through the resistant cap (1–2 mm) or segment.",
      "A wire outside the vessel is withdrawn and redirected; nothing goes over it.",
      "A wire that misses the distal lumen at the cap: redirect briefly, then parallel wire (wire in plaque, soft cap) or re-enter; do not inject through the microcatheter or push on in the wall.",
      "Do not knuckle a short, clear occlusion: knuckles need an indication.",
      "After crossing, exchange for a workhorse wire and remove the microcatheter by trapping.",
    ],
    refs: [...BOOKS, "wu-apcto-reentry-2020"],
  },
  {
    id: "cp-cto-antegrade-case-rca",
    title: "Long RCA CTO: knuckle, haematoma and re-entry",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, 21.6–21.8, 8.6, 8.9, 26, 29.4, 30.3 and 30.16; Oxford Handbook, ch 8: Chronic total occlusion PCI; Asia Pacific CTO Club (Wu 2020, Wu 2025); Danek 2016; Christopoulos 2015; Hirai 2018",
    },
    summary:
      "Choosing ADR for a long occlusion, travelling an unclear course with a knuckle, keeping it out of a branch, protecting the distal lumen from haematoma, re-entering with a re-entry balloon and STRAW, and knowing the bail-out.",
    presentation:
      "A 67-year-old man has CCS class III angina on maximal therapy, inferior ischaemia and a viable inferior wall. Planned procedure: an 8 Fr AL guide in the RCA through the right femoral artery and a 7 Fr EBU guide in the left coronary through the right radial artery. Heparin with ACT above 300 s. Estimated creatinine clearance 70 mL/min.",
    findings: [
      "Mid-RCA CTO about 38 mm long on dual injection, with a clear tapered proximal cap.",
      "The occluded course is tortuous and poorly seen, with heavy calcium.",
      "The distal RCA is straight, about 3 mm, free of disease, and fills from the LAD through septal connections that are not interventional; a right ventricular marginal branch arises from the occluded segment.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which first crossing strategy does the hybrid algorithm point to?",
        options: [
          {
            text: "Antegrade dissection and re-entry.",
            best: true,
            feedback:
              "Correct: a clear cap, a good distal target and no interventional collateral point antegrade, and a length of 20 mm or more points to dissection and re-entry. Later algorithms do not decide by length alone, but they reach the same answer here because the course is long, tortuous, poorly seen and calcified ('long plus').",
          },
          {
            text: "Antegrade wire escalation, moving to a re-entry balloon if the wire reaches the wall beside the distal cap.",
            acceptable: true,
            feedback:
              "For most CTOs the Asia Pacific group starts with wire escalation, and the global algorithm also starts antegrade with wiring. But this is a 'long plus' occlusion (long, tortuous, poorly seen, calcified), for which the Asia Pacific algorithm recommends a knuckle up front, stopped short of the distal cap.",
          },
          {
            text: "Primary retrograde crossing through the septal connections.",
            feedback: "The septal connections are not interventional, and nothing about the cap or distal vessel calls for retrograde first.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you travel the tortuous, poorly seen occluded segment?",
        options: [
          {
            text: "A small knuckle on a polymer-jacketed wire through a microcatheter, kept within the radiopaque segment.",
            best: true,
            feedback:
              "Correct. A knuckle stays within the vessel architecture with a low perforation risk and suits an unclear, tortuous course.",
          },
          {
            text: "A blunt dissection catheter spun along the expected course.",
            feedback:
              "Wu does not recommend the dissection catheter for an ambiguous course, and it can perforate if it enters the right ventricular marginal branch.",
            stateDelta: { stability: -5 },
          },
          {
            text: "A stiff tapered high-penetration wire steered along the expected course.",
            feedback: "A stiff tip in an unseen, tortuous, calcified course is how wires leave the vessel.",
            next: "s2-exit",
            stateDelta: { stability: -10, flags: ["wire-exit"] },
          },
        ],
      },
      {
        id: "s2-exit",
        kind: "consequence",
        prompt: "The stiff wire tip is beyond the RCA contour in the LAO view, with a faint blush. What now?",
        options: [
          {
            text: "Withdraw it without advancing anything, watch for staining and the haemodynamics, then restart with a knuckle.",
            best: true,
            feedback: "Right: nothing follows a wire out of the vessel. The blush does not grow.",
          },
          {
            text: "Advance the microcatheter to check the position.",
            feedback: "That can make a wire exit into a perforation needing a blocking balloon.",
            stateDelta: { stability: -15, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Halfway through, the knuckle twice turns into the right ventricular marginal branch. What do you do?",
        options: [
          {
            text: "Stop knuckling into the branch: withdraw, then redirect along the RCA course or go back to a non-knuckled wire, and check in two views.",
            best: true,
            feedback:
              "Correct. A knuckle in a branch raises a haematoma there; in the case Wu's group describe it pinched a right ventricular marginal branch and caused right ventricular ischaemia. That operator regained the course with a non-knuckled wire.",
          },
          {
            text: "Push the knuckle on into the branch; it will come back into the RCA course further down.",
            feedback: "Knuckling into the branch compromises it, and the patient becomes hypotensive.",
            next: "s3-branch",
            stateDelta: { stability: -15, flags: ["rv-branch"] },
          },
        ],
      },
      {
        id: "s3-branch",
        kind: "consequence",
        prompt: "The right ventricular marginal branch is pinched by haematoma and the blood pressure is 85/55 mmHg. What now?",
        options: [
          {
            text: "Support the pressure and get an immediate echo to exclude tamponade, checking the femoral site too; once a perforation is excluded, withdraw the knuckle from the branch, avoid antegrade injections and aim to re-enter the RCA quickly.",
            best: true,
            feedback:
              "Right. Hypotension during CTO PCI means looking for a perforation first: perforations are commoner in CTO work, their effusions build up fast and often cause hypotension, and a knuckle can exit the vessel; with femoral access a retroperitoneal bleed must also be suspected (Brilakis 26, 29). The echo shows no effusion, so the branch haematoma is the likely cause; get on with re-entry.",
          },
          {
            text: "Put the hypotension down to right ventricular ischaemia from the branch, give fluids and carry on with the knuckle without further checks.",
            feedback:
              "The branch may well be the cause, but a knuckle can exit the vessel, and a perforation or a femoral bleed has to be excluded first. Twenty minutes later the pressure falls further and an echo shows a pericardial effusion that needs drainage.",
            next: "s3-tamponade",
            stateDelta: { stability: -15, flags: ["missed-effusion"] },
          },
          {
            text: "Inject antegradely to see how much of the branch is still open.",
            feedback: "Antegrade injection would enlarge the haematoma in both the branch and the RCA, and it does not answer the question of tamponade.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3-tamponade",
        kind: "consequence",
        prompt: "The blood pressure is now 70/40 mmHg and the echo shows a pericardial effusion with signs of tamponade. Contrast is seen leaving the vessel where the knuckle ran. What do you do?",
        options: [
          {
            text: "Inflate a balloon at the exit point to stop the bleeding, give fluids and vasopressors, drain the pericardium urgently and alert the surgeons; then treat the cause.",
            best: true,
            feedback:
              "Right: this is the universal first response to a coronary perforation (Brilakis 26), and Oxford gives the same priorities: balloon at the site, rapid pericardiocentesis and fluids. The pressure recovers; the case continues once the leak is controlled (cm-perforation).",
          },
          {
            text: "Give protamine at once to reverse the heparin before anything else.",
            feedback:
              "The bleeding is stopped first with a balloon and the tamponade drained. Brilakis advises that, in most cases, heparin is not reversed until all the equipment is out and the pericardium has been emptied, because reversal risks thrombosis of the guide and the vessel and clotting of the pericardial blood.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The knuckle is 5 mm short of the distal cap. Where do you go from here?",
        options: [
          {
            text: "Stop the knuckle, bring up the microcatheter, and use a non-knuckled intermediate wire to reach the space beside the distal cap, aiming for a re-entry zone in the straight distal RCA.",
            best: true,
            feedback:
              "Correct. This keeps the space at the re-entry zone small and puts you next to the best zone: a straight, disease-free distal RCA close to the cap.",
          },
          {
            text: "Push the knuckle 30 mm down the distal RCA to make room for the re-entry balloon.",
            feedback: "A long track beyond the cap raises a haematoma that compresses the distal lumen.",
            next: "s4-haematoma",
            stateDelta: { stability: -10, flags: ["haematoma"] },
          },
          {
            text: "From the knuckle track, try to puncture the distal lumen with a stiff wire.",
            feedback:
              "The Asia Pacific authors do not advise this: success is low and the haematoma grows. Use the space beside the distal cap for a re-entry balloon instead.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4-haematoma",
        kind: "consequence",
        prompt: "The distal RCA is now thin and faint on the LAD injection. What do you do?",
        options: [
          {
            text: "No antegrade injections; place a guide extension at the proximal cap to reduce inflow; deliver the re-entry balloon promptly and aspirate through it (STRAW).",
            best: true,
            feedback: "Right: control inflow and shrink the haematoma, then stick. Delay is one of the commonest mistakes.",
          },
          {
            text: "Try parallel wiring first, then the re-entry balloon if it fails.",
            feedback: "Switching between techniques spoils both, and wiring in the wall enlarges the haematoma further.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The re-entry balloon has been prepared with contrast, delivered after a bougie with a rotational microcatheter, and inflated at low pressure beside the distal RCA. Suction is applied. How do you re-enter?",
        options: [
          {
            text: "Stick with the stiff re-entry wire from the port facing the lumen, then swap for a familiar polymer-jacketed wire through the same hole.",
            best: true,
            feedback: "Correct: stick-and-swap. The swap wire travels down the true lumen without the dissection risk of the stick wire.",
          },
          {
            text: "Stick, then drive the stiff re-entry wire on to the distal RCA to secure the position.",
            feedback: "The stick wire is highly penetrating and can dissect the distal vessel; it should be swapped.",
            stateDelta: { stability: -10, flags: ["distal-dissection"] },
          },
          {
            text: "Puncture blindly through both ports in turn without checking which faces the lumen.",
            feedback:
              "That is the double-blind variant, reserved for a distal vessel that cannot be seen. Here the port facing the lumen can be identified, and a stick through the other port aims at the adventitia.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The swap wire runs freely down the distal RCA and lies within the lumen in both views. How do you remove the re-entry balloon?",
        options: [
          {
            text: "Trap with a 3.0 mm balloon in the 8 Fr guide, withdraw the re-entry balloon, then back-bleed the Y-connector.",
            best: true,
            feedback: "Correct. An 8 Fr guide takes a 3.0 mm trapping balloon; back-bleed to clear entrained air. In a 6 Fr guide an ordinary balloon could not have trapped it; only a dedicated trapping balloon or trapping guide extension could.",
          },
          {
            text: "Hydraulic exchange.",
            feedback: "Brilakis advises against hydraulic exchange for this balloon: friction inside it can pull the wire back.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The RCA was prepared and stented from the distal cap to the proximal vessel under IVUS guidance, with the stent ending close to the re-entry point and the distal RCA preserved.",
    outcomeVariants: [
      { flag: "missed-effusion", text: "The delayed recognition of the effusion meant an emergency pericardiocentesis; the exit point was sealed before the case went on." },
      { flag: "rv-branch", text: "The right ventricular marginal branch did not recover; the hypotension settled after flow in the RCA was restored and with supportive treatment." },
      { flag: "haematoma", text: "Re-entry needed STRAW and several sticks because of the haematoma, and the stented segment was longer." },
      { flag: "perforation", text: "A wire perforation from the early stiff-wire attempt needed a prolonged balloon inflation; the effusion was watched with echo." },
      { flag: "distal-dissection", text: "The stiff wire dissected the distal RCA, which needed an additional stent." },
    ],
    learningPoints: [
      "Long occlusion with a clear cap and a good distal vessel: dissection and re-entry (hybrid); for 'long plus' CTOs the Asia Pacific algorithm also uses a knuckle, and otherwise starts with wire escalation.",
      "Use a small knuckle for an unclear, tortuous course; if it keeps entering a branch, stop knuckling.",
      "Hypotension during CTO PCI: exclude tamponade with an echo (and a femoral bleed) before blaming the branch.",
      "Stop the knuckle short of the distal cap and re-enter close to it at a straight, disease-free zone.",
      "No antegrade injections once in the wall; reduce inflow; use STRAW.",
      "Stick from the lumen-facing port, then swap; remove the balloon by trapping.",
      "If re-entry fails: retrograde, investment, or stop.",
    ],
    refs: [
      ...BOOKS,
      "wu-apcto-reentry-2020",
      "wu-apcto-antegrade-2025",
      "wu-global-cto-algorithm-2021",
      "danek-adr-registry-2016",
      "christopoulos-stick-swap-2015",
      "hirai-spm-2018",
    ],
  },
];

/**
 * Every tip in this module belongs to CTO crossing only (Brilakis 21.8, 30.16), so each trigger also
 * requires the lab's "cto" event: a dissection, a subintimal wire or a high contrast dose in ordinary
 * PCI or in primary PCI must not bring up knuckle, re-entry or move-the-cap advice. tipsFor and
 * validateTips (src/content/lab/tips.ts, src/content/validate.ts) check `requires`; the PCI lab
 * raises "cto" in CTO scenarios only (src/ui/lab/pciTips.ts).
 */
const cto = (when: TipTrigger): TipTrigger => ({ ...when, requires: ["cto"] });

export const tips: LabTip[] = [
  {
    id: "pci-cto-antegrade-microcatheter",
    lab: "pci",
    when: cto({ phase: ["wire"] }),
    title: "Work every CTO wire through a microcatheter",
    text: "Load the wire inside the microcatheter and keep the microcatheter close behind the tip at the cap. It backs up the wire, lets you reshape or swap it without rewiring from the ostium, and protects the proximal vessel.",
    tone: "do",
    lessonId: "cp-cto-antegrade-awe-kit",
    sources: [B("8.1"), B("30.6"), B("21.8")],
    refs: [...BRILAKIS, "cto-consensus-2019"],
  },
  {
    id: "pci-cto-antegrade-first-wire",
    lab: "pci",
    when: cto({ phase: ["wire"] }),
    title: "Let the cap choose the first wire",
    text: "Tapered cap or a visible channel: start with a low-penetration tapered polymer-jacketed wire. Blunt cap: start with an intermediate polymer-jacketed or composite-core wire. Keep the stiff, high-penetration wires for caps or segments that resist.",
    tone: "do",
    lessonId: "cp-cto-antegrade-awe-kit",
    sources: [B("21.8"), B("8.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-step-down",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-not-crossing"] }),
    title: "Escalate one rung, then step back down",
    text: "Try a new tip angle or a different wire first, and add backup support before a more penetrating wire. Then move up one level of penetration at a time, and once a stiff wire is 1–2 mm through the resistant cap, change back to a less penetrating wire for the rest of the occlusion.",
    tone: "do",
    lessonId: "cp-cto-antegrade-awe-crossing",
    sources: [B("21.8"), B("8.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-confirm-lumen",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-subintimal", "wire-distal-position"] }),
    title: "Prove the true lumen without injecting into the wall",
    text: "Use contralateral injection in two orthogonal views, IVUS, or a workhorse wire through the microcatheter (free passage in the lumen, marked resistance in the wall). Do not inject through a microcatheter whose tip may be subintimal: it enlarges the space you need to re-enter.",
    tone: "caution",
    lessonId: "cp-cto-antegrade-awe-crossing",
    sources: [B("21.8"), B("8.7"), B("25.2"), B("13.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-trap-exchange",
    lab: "pci",
    when: cto({ phase: ["wire", "lesion-prep"], event: ["microcatheter-removal"] }),
    title: "Exchange the crossing wire, then trap",
    text: "Swap a stiff or polymer-jacketed crossing wire for a workhorse through the microcatheter straight away. Remove the microcatheter by trapping (2.5 mm balloon in 7 Fr, 3.0 mm in 7–8 Fr; in 6 Fr a standard balloon traps only low-profile microcatheters, and only in a 0.071 in. guide; bulkier devices need a dedicated trapping balloon or trapping guide extension), withdraw gently because jacketed wires slip, and back-bleed afterwards. Avoid hydraulic exchange in CTO work.",
    tone: "do",
    lessonId: "cp-cto-antegrade-awe-crossing",
    sources: [B("8.9"), B("8.8"), B("26.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-parallel-wire",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-subintimal"] }),
    title: "Subintimal wire: redirect, then parallel wire",
    text: "Redirect briefly; if that fails, do not persist. Leave the first wire where it is to mark the false channel and steer a second wire past it into the distal true lumen, ideally through a dual-lumen microcatheter. Remove the first wire only when the second is confirmed in the lumen.",
    tone: "do",
    lessonId: "cp-cto-antegrade-parallel",
    sources: [B("21.8"), B("30.6"), B("8.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-distal-branch",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-side-branch"] }),
    title: "Crossed into a distal side branch? Keep it",
    text: "If the crossing wire has entered a side branch beyond the occlusion, do not pull it back: advance a dual-lumen microcatheter over it and wire the main distal vessel through the second lumen, so you keep access across the occlusion.",
    tone: "do",
    lessonId: "cp-cto-antegrade-parallel",
    sources: [B("30.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-antegrade-decide-early",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-subintimal"] }),
    title: "Parallel wire or re-entry balloon: decide early, once",
    text: "Soft distal cap, wire still in plaque with good control, mid-RCA cap or calcium at the zone: parallel wire. Wire subintimal and close to a good, calcium-free zone, or poor control: re-entry balloon. Do not try one then the other in the same segment, and do not keep redirecting.",
    tone: "caution",
    lessonId: "cp-cto-antegrade-parallel",
    sources: [B("21.8")],
    refs: ["wu-apcto-reentry-2020", ...BRILAKIS],
  },
  {
    id: "pci-cto-antegrade-knuckle",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["wire-subintimal", "dissection"] }),
    title: "Knuckle small, out of branches, short of the cap",
    text: "Knuckle only with an indication (unclear course, tortuosity, calcium), on a polymer-jacketed wire, keeping the loop small, within the radiopaque segment and never on a support wire. If it keeps entering a side branch, stop knuckling; stop it short of the distal cap. A knuckle can still exit the vessel, and the hole is then larger.",
    tone: "caution",
    lessonId: "cp-cto-antegrade-adr-track",
    sources: [B("8.6"), B("21.6"), B("26.4"), B("27.2")],
    refs: [...BRILAKIS, "wu-apcto-reentry-2020"],
  },
  {
    id: "pci-cto-antegrade-dissection-catheter",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-side-branch"] }),
    title: "Blunt dissection catheter: short spins, two views, no branches",
    text: "Advance the spinning dissection catheter a short distance at a time with the torque device acting as a brake, and check in two orthogonal views before going on. If it heads into a side branch, stop: that is where it perforates.",
    tone: "caution",
    lessonId: "cp-cto-antegrade-adr-track",
    sources: [B("30.16")],
    refs: [...BRILAKIS, "danek-adr-registry-2016", "wu-apcto-reentry-2020"],
  },
  {
    id: "pci-cto-antegrade-inflow",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["wire-subintimal", "dissection"] }),
    title: "In the wall: no antegrade contrast, less inflow",
    text: "Once the subintimal space has been entered, take the contrast syringe off the antegrade manifold and see the distal vessel by contralateral injection. A damped guide, a guide extension at the proximal cap or a blocking balloon reduces inflow and haematoma growth. Never inject through a damped guide or a guide extension at the cap: both risk hydraulic and aorto-coronary dissection.",
    tone: "caution",
    lessonId: "cp-cto-antegrade-adr-track",
    sources: [B("30.3"), B("30.2"), B("25.2"), B("21.8")],
    refs: [...BRILAKIS, "wu-apcto-reentry-2020"],
  },
  {
    id: "pci-cto-antegrade-reentry-zone",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["wire-subintimal", "dissection"] }),
    title: "Re-enter close to the distal cap at a clean zone",
    text: "Choose a re-entry zone just beyond the distal cap where the vessel is straight and free of calcium and the plaque is thin; the distal RCA is usually easy, the LAD puts side branches at risk. Long tracks beyond the cap make haematoma and branch loss.",
    tone: "do",
    lessonId: "cp-cto-antegrade-reentry",
    sources: [B("21.8")],
    refs: [...BRILAKIS, "wu-apcto-reentry-2020"],
  },
  {
    id: "pci-cto-antegrade-stick-swap",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["wire-subintimal", "dissection"] }),
    title: "Re-entry balloon: prepare, inflate low, stick, swap",
    text: "Prepare the balloon with undiluted contrast under negative pressure, make a path with a rotational microcatheter, and inflate at low pressure so one port faces the lumen. Stick from that port, then swap the stiff stick wire for a familiar wire down the true lumen.",
    tone: "do",
    lessonId: "cp-cto-antegrade-reentry",
    sources: [B("30.16")],
    refs: [...BRILAKIS, "wu-apcto-reentry-2020"],
  },
  {
    id: "pci-cto-antegrade-straw",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["wire-subintimal", "dissection"] }),
    title: "Shrink the haematoma before you stick",
    text: "Put the re-entry balloon's wire lumen on suction for a few minutes (STRAW) before sticking. If the distal vessel still cannot be seen, puncture blindly through both ports and swap for a stiff polymer-jacketed wire (double-blind stick-and-swap).",
    tone: "bailout",
    lessonId: "cp-cto-antegrade-reentry",
    sources: [B("30.16")],
    refs: ["wu-apcto-reentry-2020", "christopoulos-stick-swap-2015"],
  },
  {
    id: "pci-cto-antegrade-investment",
    lab: "pci",
    when: cto({ phase: ["wire", "complication"], event: ["high-contrast-volume", "high-radiation-dose"] }),
    title: "Re-entry failing? Invest and come back",
    text: "When re-entry fails and no retrograde route remains, balloon the subintimal track without stenting and plan another attempt after 2–3 months. STAR or an honest failure is often safer than an aggressive rescue.",
    tone: "bailout",
    lessonId: "cp-cto-antegrade-reentry",
    sources: [B("21.8")],
    refs: [...BRILAKIS, "hirai-spm-2018"],
  },
  {
    id: "pci-cto-antegrade-move-cap",
    lab: "pci",
    when: cto({ phase: ["wire"], event: ["wire-not-crossing"] }),
    title: "Impenetrable or ambiguous cap: move the cap",
    text: "When the cap cannot be found or penetrated and retrograde is not an option, enter the wall just before the cap with a stiff wire (scratch-and-go) or helped by a slightly oversized balloon (BASE), then continue as dissection and re-entry. Plan for any side branch at the cap first.",
    tone: "do",
    lessonId: "cp-cto-antegrade-move-cap",
    sources: [B("21.6"), B("21.8")],
    refs: [...BRILAKIS, "vo-move-the-cap-2016", "roy-side-base-2018"],
  },
];

export const refs: Reference[] = [
  {
    id: "colombo-star-2005",
    kind: "paper",
    citation:
      "Colombo A, Mikhail GW, Michev I, et al. Treating chronic total occlusions using subintimal tracking and reentry: the STAR technique. Catheter Cardiovasc Interv. 2005;64:407–411.",
    url: "https://doi.org/10.1002/ccd.20307",
    note: "PMID: 15789384. Checked on PubMed: authors, title, journal, year, volume 64, issue 4, pages 407–411 (discussion 412); abstract read (0.014 inch hydrophilic J-configured wire, subintimal dissection with distal re-entry; 31 patients, RCA 87%; 3 perforations without consequences; angiographic follow-up in 21, restenosis in 53%). Brilakis ch 21 ref 33.",
    verified: true,
  },
  {
    id: "whitlow-fast-cto-2012",
    kind: "trial",
    citation:
      "Whitlow PL, Burke MN, Lombardi WL, et al. Use of a novel crossing and re-entry system in coronary chronic total occlusions that have failed standard crossing techniques: results of the FAST-CTOs (Facilitated Antegrade Steering Technique in Chronic Total Occlusions) trial. JACC Cardiovasc Interv. 2012;5:393–401.",
    url: "https://doi.org/10.1016/j.jcin.2012.01.014",
    note: "PMID: 22516395. Checked on PubMed: authors, title, journal, year, volume 5, issue 4, pages 393–401; abstract read (prospective single-arm; 147 patients, 150 CTOs failing standard techniques; mean length 41 ± 17 mm; technical success 77%; perforation 14 (9.3%), 3 treated, no tamponade; 30-day MACE 4.8%). Brilakis ch 21 ref 39.",
    verified: true,
  },
  {
    id: "karacsonyi-crossboss-first-2018",
    kind: "trial",
    citation:
      "Karacsonyi J, Tajti P, Rangan BV, et al. Randomized comparison of a CrossBoss first versus standard wire escalation strategy for crossing coronary chronic total occlusions: the CrossBoss First trial. JACC Cardiovasc Interv. 2018;11:225–233.",
    url: "https://doi.org/10.1016/j.jcin.2017.10.023",
    note: "PMID: 29413236. Checked on PubMed: authors, title, journal, year, volume 11, issue 3, pages 225–233; abstract read (246 patients, 11 US centres, 2015–2017; technical 87.8%, procedural 84.1%, similar between arms; crossing time 56 vs 66 min, p = 0.323; procedural MACE 3.28% vs 4.03%; no differences in secondary end points, equipment use or cost). Brilakis ch 21 ref 40.",
    verified: true,
  },
  {
    id: "galassi-mini-star-2012",
    kind: "paper",
    citation:
      "Galassi AR, Tomasello SD, Costanzo L, et al. Mini-STAR as bail-out strategy for percutaneous coronary intervention of chronic total occlusion. Catheter Cardiovasc Interv. 2012;79:30–40.",
    url: "https://doi.org/10.1002/ccd.22998",
    note: "PMID: 21956876. Checked on PubMed: authors, title, journal, year (2012; epub 2011), volume 79, issue 1, pages 30–40; abstract read (117 CTO lesions after failed initial attempt; mini-STAR with polymeric wires vs conventional bail-out strategies: procedural success 97.6% vs 52%, less contrast, shorter procedure and fluoroscopy, no difference in complications). Brilakis ch 21 ref 42.",
    verified: true,
  },
  {
    id: "azzalini-vessel-architecture-2018",
    kind: "paper",
    citation:
      "Azzalini L, Carlino M, Brilakis ES, et al. Subadventitial techniques for chronic total occlusion percutaneous coronary intervention: the concept of \"vessel architecture\". Catheter Cardiovasc Interv. 2018;91:725–734.",
    url: "https://doi.org/10.1002/ccd.27025",
    note: "PMID: 28303648. Checked on PubMed: authors, title, journal, year, volume 91, issue 4, pages 725–734; abstract read (vessel architecture: occlusive plaque with disrupted intima and media plus adventitia, as distinct from extravascular space; a safe working environment for wires and devices). Brilakis ch 21 ref 20.",
    verified: true,
  },
  {
    id: "danek-adr-registry-2016",
    kind: "paper",
    citation:
      "Danek BA, Karatasakis A, Karmpaliotis D, et al. Use of antegrade dissection re-entry in coronary chronic total occlusion percutaneous coronary intervention in a contemporary multicenter registry. Int J Cardiol. 2016;214:428–437.",
    url: "https://doi.org/10.1016/j.ijcard.2016.03.215",
    note: "PMID: 27088405; PMCID: PMC4862911 (full text read). Checked on PubMed: authors, title, journal, year, volume 214, pages 428–437. 1,313 CTO PCIs, 11 US centres 2012–2015; ADR 34.9%, first strategy in 169 (12.9% of all); technical 86.9% vs 91.8%; MACE 2.9% vs 2.2%; antegrade-only ADR vs AWE technical 92.7% vs 94.2%; tamponade needing pericardiocentesis 1.8% vs 0.1%; 3 of 8 ADR perforations from the dissection catheter; dissection catheter in 53.7%, re-entry balloon in 54.8%; stick-and-swap 82 (successful 66), bobsled 8, STRAW 2; definitions of STAR, contrast-guided STAR, mini-STAR and LAST; dissection catheter advanced in short steps with the torque device as a brake, checked in two orthogonal views; can exit through stent struts. Brilakis ch 21 ref 47.",
    verified: true,
  },
  {
    id: "hirai-spm-2018",
    kind: "paper",
    citation:
      "Hirai T, Grantham JA, Sapontis J, et al. Impact of subintimal plaque modification procedures on health status after unsuccessful chronic total occlusion angioplasty. Catheter Cardiovasc Interv. 2018;91:1035–1042.",
    url: "https://doi.org/10.1002/ccd.27380",
    note: "PMID: 29068126. Checked on PubMed: authors, title, journal, year (2018; epub 2017), volume 91, issue 6, pages 1035–1042; abstract read (138 unsuccessful CTO PCIs, 12-centre registry; SPM in 59 (42.8%); similar complications; SAQ summary score change at 1 month 28.3 vs 16.8; adjusted 10.5-point greater improvement). Brilakis ch 21 ref 36.",
    verified: true,
  },
  {
    id: "wu-apcto-reentry-2020",
    kind: "consensus",
    citation:
      "Wu EB, Brilakis ES, Lo S, et al. Advances in CrossBoss/Stingray use in antegrade dissection reentry from the Asia Pacific Chronic Total Occlusion Club. Catheter Cardiovasc Interv. 2020;96:1423–1433.",
    url: "https://doi.org/10.1002/ccd.28607",
    note: "PMID: 31769597; PMCID: PMC7754104 (full text read). Checked on PubMed: authors, title, journal, volume 96, issue 7, pages 1423–1433 (epub 2019). Source for: mechanism of parallel wiring vs re-entry balloon and the anatomical factors favouring each; decide early and do not switch; bougie technique (1.5 mm balloon if the microcatheter will not pass); balloon preparation with undiluted contrast; routine STRAW (suction about 4 min; complete occlusive STRAW with a second OTW balloon in 8 Fr); routine stick-and-swap; multi-stick-and-swap (3–5 passes); plaque thickness 1.32 vs 0.33 mm; distal RCA easy, mid RCA difficult, LAD side-branch risk; avoid antegrade injection and remove the syringe; guide extension or blocking balloon to control inflow; knuckle reserved for long-plus CTOs, stopped short of the distal cap; dissection catheter not for course ambiguity, perforation in side branches; trapping sizes in 7 and 6 Fr guides.",
    verified: true,
  },
  {
    id: "wu-apcto-antegrade-2025",
    kind: "consensus",
    citation:
      "Wu EB, Matsuno S, Nagamatsu W, et al. New frontiers in antegrade wiring from the Asia Pacific Chronic Total Occlusion Club. JACC Asia. 2025;5:219–230.",
    url: "https://doi.org/10.1016/j.jacasi.2024.12.009",
    note: "PMID: 39967211; PMCID: PMC11840268 (full text read). Checked on PubMed: authors, title, journal, year, volume 5, issue 2, pages 219–230. Source for: raise backup force (supportive guide, side-branch or coaxial balloon anchor, guide extension) before wire penetration force at a tough proximal cap; EuroCTO 2019 advised IVUS, BASE and scratch-and-go, then retrograde, for cap ambiguity; anatomy dictates body crossing (loose tissue tracking for tapered stumps; intentional intimal tracking with 3D wiring for a clear intimal path; blunt intermediate-penetration wires without a clear path, no stiffer tapered wires with an unclear course; intentional subintimal tracking for 'long plus' CTOs, knuckle up front); bigger knuckle makes a bigger space but enters small branches less; APCTO now prefers 3D wiring to the blunt dissection catheter for in-stent CTOs; ADAPT for tough distal caps.",
    verified: true,
  },
  {
    id: "christopoulos-stick-swap-2015",
    kind: "case",
    citation:
      "Christopoulos G, Kotsia AP, Brilakis ES. The double-blind stick-and-swap technique for true lumen reentry after subintimal crossing of coronary chronic total occlusions. J Invasive Cardiol. 2015;27:E199–E202.",
    note: "PMID: 26332885 (no DOI in PubMed). Checked on PubMed: authors, title, journal, year, volume 27, issue 9, pages E199–E202; abstract read (3 cases; distal vessel not visualised after subintimal crossing despite attempts to decompress the haematoma; blind puncture through both ports of the re-entry balloon, then exchange of the re-entry wire for a stiff polymer-jacketed wire).",
    verified: true,
  },
  {
    id: "alexandrou-base-2023",
    kind: "paper",
    citation:
      "Alexandrou M, Rempakos A, Al Ogaili A, et al. Balloon-assisted subintimal entry (BASE) in chronic total occlusion percutaneous coronary interventions. Catheter Cardiovasc Interv. 2023;102:834–843.",
    url: "https://doi.org/10.1002/ccd.30830",
    note: "PMID: 37676010. Checked on PubMed: authors, title, journal, year, volume 102, issue 5, pages 834–843; abstract read (31 centres 2016–2023; BASE in 155 of 1,968 ADR cases (7.9%); longer occlusions 42 vs 37 mm; higher J-CTO 3.4 vs 3.0 and PROGRESS-CTO scores; more cap ambiguity, side branch at the proximal cap, blunt or no stump, moderate-severe calcification, proximal tortuosity; technical 71.6% vs 75.5%, procedural 71.6% vs 72.8%, MACE 1.3% vs 4.1%, all not significant).",
    verified: true,
  },
  {
    id: "roy-side-base-2018",
    kind: "case",
    citation:
      "Roy J, Hill J, Spratt JC. The \"side-BASE technique\": combined side branch anchor balloon and balloon assisted sub-intimal entry to resolve ambiguous proximal cap chronic total occlusions. Catheter Cardiovasc Interv. 2018;92:E15–E19.",
    url: "https://doi.org/10.1002/ccd.27422",
    note: "PMID: 29266669. Checked on PubMed: authors, title, journal, year (2018; epub 2017), volume 92, issue 1, pages E15–E19; abstract read (concern over proximal side-branch loss with BASE; sub-intimal space accessed proximal to the occlusion using the side branch; for proximal cap ambiguity and resistant caps).",
    verified: true,
  },
  {
    id: "giangiacomi-scratch-go-2024",
    kind: "case",
    citation:
      "Giangiacomi F, Mircoli L, Tumminello G, Carugo S. Microcatheter tip fracture and acute vessel occlusion rescued with subintimal tracking and re-entry: move the tip. Catheter Cardiovasc Interv. 2024;104:1220–1224.",
    url: "https://doi.org/10.1002/ccd.31264",
    note: "PMID: 39387319. Checked on PubMed: authors, title, journal, year, volume 104, issue 6, pages 1220–1224; abstract read (fractured microcatheter tip occluding a calcified proximal RCA; ADR using scratch-and-go and STAR: a stiff wire entered the subintimal space past the fragment, a second wire re-entered at the acute margin, IVUS confirmed re-entry, three drug-eluting stents).",
    verified: true,
  },
];
