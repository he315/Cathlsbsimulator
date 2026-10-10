// Module cp-uncrossable: balloon-uncrossable and balloon-undilatable lesions (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 23 (23.1 balloon-uncrossable lesions, 23.2 balloon-undilatable lesions,
// the whole chapter), chapter 30 (30.3 guide catheter extensions and the inchworming technique, 30.6 microcatheters,
// 30.7 guidewires, 30.9 balloons, 30.10 atherectomy, 30.11 laser, with the rest of the chapter read for context),
// 8.1 (when a microcatheter is needed), with related passages in 8.4, 8.5, 9.7.7-9.7.9, 10.2, 19.9, 25 (aorto-coronary
// dissection prevention) and 27.3; Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 8
// (angioplasty balloons; rotational atherectomy and its alternatives).
// Every claim is listed with its page in docs/curriculum/evidence/cp-uncrossable.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_BALLOONS = O("ch 8: Angioplasty balloons");
const O_ROTA = O("ch 8: Rotational atherectomy");

export const module: Module = {
  id: "cp-uncrossable",
  title: "Balloon-uncrossable and balloon-undilatable lesions",
  stage: 4,
  summary:
    "Two common reasons a PCI stalls after the wire is across: no balloon will follow the wire through the lesion, or a balloon crosses but will not open it. This module teaches Brilakis's two algorithms step by step: the five lines of escalation for the uncrossable lesion (small balloons and deliberate balloon rupture; more support; microcatheters, wire-cutting and puncture; laser and atherectomy; subintimal techniques; and combinations), how to deliver a guide extension safely by inchworming, and the de novo and in-stent pathways for the undilatable lesion, from high-pressure balloon technique to atherectomy, laser, subintimal crossing and surgery.",
  objectives: [
    "Define a balloon-uncrossable and a balloon-undilatable lesion, and explain why the two often occur together.",
    "Work through Brilakis's five-line algorithm for the balloon-uncrossable lesion, choosing and performing each step and naming what can go wrong at each.",
    "Perform deliberate small-balloon rupture (grenadoplasty) safely, and say which balloon sizes must never be used for it.",
    "Choose and handle microcatheters, including plaque modification microcatheters, without fracturing or entrapping them.",
    "Deliver a guide extension by inchworming, explain why it is preferred to balloon-assisted tracking and distal anchoring, and avoid the extension's complications.",
    "Combine support and lesion modification at the same time, and explain what the manual does and does not say about named combined techniques.",
    "Prevent the balloon-undilatable lesion, and treat it with the de novo or the in-stent algorithm, using high-pressure balloon technique, plaque modification balloons, atherectomy, laser, subintimal crossing and, rarely, surgery.",
    "Use intravascular imaging at every stage of an undilatable lesion.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-first-line",
      title: "The balloon-uncrossable lesion: the algorithm and its first line",
      minutes: 14,
      topics: ["cx-uncrossable"],
      sources: [B("23.1"), B("30.9"), B("9.7"), O_ROTA],
      refs: [...BOOKS, "vo-bam-2016"],
      blocks: [
        {
          kind: "p",
          text: "A lesion is **balloon-uncrossable** when the guidewire has crossed it but no balloon can be made to follow (Brilakis 23.1). In chronic total occlusions, a balloon that will not follow a crossed wire is the most common cause of procedural failure (Vo 2016). The danger is not only failure: pushing ever harder on a balloon throws the guide out of the ostium, drags the wire back or drives it into the distal vessel, and can dissect the ostium. Brilakis therefore gives an ordered algorithm, so that each attempt adds something new rather than more force.",
        },
        {
          kind: "table",
          caption: "Brilakis's approach to the balloon-uncrossable lesion (Fig. 23.1, rebuilt as a table). In the figure, some steps modify the plaque and others add support",
          head: ["Line", "Steps", "What the step does"],
          rows: [
            ["First", "1. Small balloon. 2. Rupture a small balloon inside the lesion (grenadoplasty)", "Plaque modification"],
            ["Second", "3. Increase support: the guide and the wire", "Support"],
            ["Third", "4. Microcatheter. 5. Wire-cutting or wire puncture", "Plaque modification"],
            ["Fourth", "6. Laser. 7. Atherectomy", "Plaque modification"],
            ["Fifth", "8. Subintimal techniques: external crush (modifies the plaque) and subintimal distal anchor (adds support)", "Both"],
            ["At any stage", "9. Combinations of the above, used together or in sequence", "Both"],
          ],
        },
        {
          kind: "p",
          text: "Read the table as an order of preference, not a rigid ladder. Chapter 9 makes the same point from the other direction: when a balloon will not reach or cross a lesion, the causes are proximal disease, tortuosity, calcium, a very tight lesion, or the wrong balloon (high profile, non-compliant or already used), and the remedies come from the guide, the wire, preparing the proximal vessel and lesion, the balloon itself, and small extras such as a deep breath (that general menu is taught in pm-prep-and-stent). This lesson is about the first line, which costs little and often works.",
        },
        { kind: "h", text: "Step 1: the small balloon" },
        {
          kind: "steps",
          title: "Choosing and pushing the first balloon",
          items: [
            {
              title: "Choose the lowest profile you have",
              detail: "A rapid-exchange, compliant balloon with a single marker and a low crossing profile, in 1.0, 1.20, 1.25 or 1.5 mm diameter. The 1.0 mm balloons (and a 0.85 mm balloon available in Europe) are the lowest-profile balloons Brilakis lists and his first choice. Compliant balloons are more flexible and lower in profile than non-compliant ones; a new balloon tracks better than a used one.",
            },
            {
              title: "Choose it long",
              detail: "Pick 20–30 mm. A small balloon is thickest at its marker, which sits in the middle; with a long balloon the thin segment in front of the marker can burrow further into the lesion before the bulky part arrives. A short balloon reaches its thickest point almost at once.",
            },
            {
              title: "Consider a purpose-built crossing balloon",
              detail: "Some small balloons have a stiff, kink-resistant shaft and a hydrophilic coat with a very small lesion entry profile (one such micro-dilation catheter carries a 1.2 mm balloon). Brilakis prefers its rapid-exchange version to the over-the-wire one, because it penetrates better, probably owing to a stiffer shaft, and gives more support; the over-the-wire version does allow wire exchange and contrast injection. A balloon with a bevelled tip, designed to pass through stent struts, can be rotated so that its tip meets the lesion at a different angle. A scoring device whose tiny 0.6 mm balloon sits beside the guidewire (available in Europe) may also help some of these lesions.",
            },
            {
              title: "Push in small, watched movements",
              detail: "Advance while watching both the guide tip and the distal wire tip. Stop pushing the moment the guide starts to back out of the ostium or the distal wire position is threatened.",
            },
          ],
        },
        { kind: "tip", id: "pci-unx-small-long-balloon" },
        {
          kind: "steps",
          title: "If the small balloon stalls at the lesion",
          items: [
            {
              title: "Balloon wedge",
              detail: "Inflate the balloon where it has stopped while you keep pushing forwards. The inflation can open the entry of the lesion enough for the same balloon to pass.",
            },
            {
              title: "Rotate, but only a little",
              detail: "Turning the balloon may help it find a way in. Limit it to two or three turns in each direction, or the balloon can bind onto the wire.",
            },
            {
              title: "Refresh the profile",
              detail: "Once a balloon has been inflated it no longer returns to its original profile. Rewrap it with your fingers while holding vacuum, or open a new small balloon, or try one from another manufacturer, whose tip and profile differ. Rapid-exchange balloons can be pushed harder into a lesion.",
            },
            {
              title: "Go bigger, just proximal",
              detail: "Paradoxically, a 2.5–3.0 mm rapid-exchange balloon may cross; or, inflated just proximal to the lesion, it may break up the entry enough for a small balloon or a microcatheter to follow.",
            },
          ],
        },
        { kind: "tip", id: "pci-unx-balloon-wedge" },
        {
          kind: "check",
          stem: "A 1.25 mm × 12 mm balloon stops at the proximal edge of a calcified mid-RCA lesion. You inflated it there once at 10 atm and it still will not advance. Which next move follows Brilakis's first line?",
          options: [
            "Keep pushing the same balloon harder while the assistant pushes the guide in",
            "A new 1.0 mm balloon, 20–30 mm long, or the old one rewrapped under vacuum",
            "Spin the balloon several full turns in one direction to screw it into the lesion",
            "Change to a 2.0 mm non-compliant balloon, because it is stiffer and pushes better",
          ],
          answer: 1,
          explanation:
            "An inflated balloon has lost its original profile, so a new low-profile balloon (or the old one rewrapped with vacuum) is the logical step, and a long balloon lets its thin leading segment penetrate before the marker arrives. Forcing the same balloon risks losing the guide and wire and dissecting the ostium. Rotation is limited to two or three turns each way because the balloon can stick to the wire. A non-compliant balloon is less deliverable than a compliant one.",
        },
        { kind: "h", text: "What can go wrong with the first line" },
        {
          kind: "list",
          items: [
            "**Guide and wire position loss.** Stop as soon as the guide backs out or the wire moves.",
            "**Ostial dissection.** Vigorous back-and-forth balloon movement can tear the ostium, especially when it is already diseased.",
            "**Distal vessel injury.** Each push and pull moves the wire tip in and out (a see-saw); with a stiff-tip or polymer-jacketed wire in the distal vessel this can dissect or perforate it.",
            "**Balloon entrapment in the lesion.** Possible, but Brilakis considers it highly unlikely at this stage.",
          ],
        },
        { kind: "tip", id: "pci-unx-watch-distal-tip" },
        { kind: "h", text: "Step 2: grenadoplasty (balloon-assisted microdissection)" },
        {
          kind: "p",
          text: "Grenadoplasty, also called balloon-assisted microdissection, deliberately bursts a small balloon inside the lesion: the burst disrupts the plaque enough for a fresh balloon to cross. Brilakis calls it simple, safe and often effective, and it is increasingly used. In the series he cites (Vo 2016: 17 balloon-uncrossable CTOs at two centres), the technique contributed to success in about half the cases, overall procedural success was 94%, and no patient had a major complication.",
        },
        {
          kind: "steps",
          title: "Grenadoplasty, step by step",
          items: [
            {
              title: "1. Prepare the balloon meticulously",
              detail: "Use a 1.0–1.5 mm balloon and remove every bubble of air during preparation: the balloon is going to burst inside the coronary artery, and any air in it will go with the contrast.",
            },
            {
              title: "2. Advance it as far into the lesion as it will go",
              detail: "Brilakis pushes the small balloon as far into the lesion as it will go before inflating it.",
            },
            {
              title: "3. Inflate at high pressure until it bursts, watching the indeflator",
              detail: "Keep your eyes on the inflation device, not the screen: the needle falling is the first sign of rupture and lets you react fastest.",
            },
            {
              title: "4. Aspirate at once",
              detail: "Apply suction through the inflation device the moment it ruptures, to stop contrast jetting through the tear into the vessel wall (pinhole injury, barotrauma).",
            },
            {
              title: "5. Remove it and try a new balloon",
              detail: "A new small balloon often crosses the modified lesion. In the example Brilakis shows, a distal RCA CTO that resisted an 8 Fr Amplatz guide with an anchor balloon was crossed by a microcatheter after a 1.2 mm balloon was ruptured, and a 2.0 mm balloon then followed.",
            },
          ],
        },
        { kind: "tip", id: "pci-unx-grenadoplasty" },
        {
          kind: "check",
          stem: "You decide on grenadoplasty in a balloon-uncrossable LAD lesion. Your assistant hands you a 2.0 mm balloon because 'it bursts more convincingly'. What do you do?",
          options: [
            "Use it, but inflate slowly so that the rupture is controlled",
            "Use it at a lower pressure so that it bursts with less force",
            "Refuse it: grenadoplasty uses a 1.0–1.5 mm balloon, never 2.0 mm or larger",
            "Use it only if the guide extension is already deep in the vessel",
          ],
          answer: 2,
          explanation:
            "Brilakis states plainly that balloons of 2.0 mm or more should not be used for grenadoplasty. Proximal dissection and perforation are extremely unlikely only with the 1.0–1.5 mm balloons. Slower or lower-pressure inflation does not make a larger rupture in the vessel safe, and a guide extension changes nothing about the size of the burst.",
        },
        {
          kind: "list",
          items: [
            "**Dissection or perforation** of the proximal vessel: extremely unlikely with 1.0–1.5 mm balloons; the reason larger balloons are forbidden.",
            "**Air embolism**: prevented by meticulous balloon preparation.",
            "**Pinhole contrast injury**: reduced by watching the indeflator and deflating instantly.",
            "**A ruptured balloon that will not come out**: it can tangle with the wire, so that both have to be removed and the wire position is lost.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Repeating the same push with the same balloon instead of changing something (balloon, profile, support or technique).",
            "Using a short small balloon, so that its bulky marker reaches the lesion straight away.",
            "Spinning a balloon many turns until it binds to the wire.",
            "Ignoring the guide and the distal wire tip while pushing: the guide backs out and the wire perforates or dissects distally.",
            "Bursting a balloon of 2.0 mm or more, or one that still contains air.",
            "Watching the screen rather than the indeflator during grenadoplasty, so that deflation is late.",
          ],
        },
        {
          kind: "pearl",
          text: "An inflated balloon never regains its original profile, and balloons from different makers differ in tip and profile. So when a small balloon has stalled and been inflated, a fresh small balloon, perhaps of another make, is the cheap next try before you escalate to the next line (23.1.1).",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when the first balloon will not cross, name the line of the uncrossable algorithm you are on before every move: try a long 1.0 mm balloon, then the balloon wedge, then a rewrapped or new balloon; if all fail, perform grenadoplasty with a 1.2 mm balloon, aspirating as soon as the indeflator falls.",
        },
        { kind: "video", id: "vKDDnhWXmXM", note: "Manual of PCI section 23.1: balloon-uncrossable lesions." },
        { kind: "video", id: "z-z76bS3WhY", note: "Manual of PCI case 64: a balloon-uncrossable lesion." },
        { kind: "video", id: "QNjde7BqbYM", note: "Manual of PCI case 171: the uncrossable lesion." },
        {
          kind: "keypoints",
          items: [
            "Balloon-uncrossable: the wire has crossed but no balloon will follow.",
            "Five lines: small balloon and grenadoplasty; support; microcatheter and wire-cutting or puncture; laser and atherectomy; subintimal techniques; plus combinations at any point.",
            "First balloon: lowest profile (1.0 mm), compliant, rapid exchange, single marker, 20–30 mm long, new.",
            "Stalled: balloon wedge, two or three turns each way at most, rewrap or replace, or a 2.5–3.0 mm balloon just proximal.",
            "Grenadoplasty: 1.0–1.5 mm only, air-free, burst deep in the lesion, watch the indeflator, aspirate at once.",
            "Stop pushing when the guide backs out or the distal wire moves.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-support-microcatheter",
      title: "Second and third lines: support, microcatheters, wire-cutting and wire puncture",
      minutes: 15,
      topics: ["cx-uncrossable"],
      sources: [B("23.1"), B("9.7"), B("30.3"), B("30.6"), B("30.7"), B("8.1")],
      refs: [...BRILAKIS, "zhang-doca-tri-2012", "xue-seesaw-2017"],
      blocks: [
        {
          kind: "p",
          text: "When small balloons fail, Brilakis's second line is to push from a firmer base, and his third is to modify the lesion with a microcatheter or a second wire. Support is described as critical for crossing an uncrossable lesion; the full menu of support measures (guide size and shape, access site, forward push, deep intubation, guide extensions, side-branch and distal anchors, buddy and support wires, deep wiring) is taught in pm-prep-and-stent. This lesson covers what chapter 23 adds for the uncrossable lesion specifically, then the microcatheter and wire techniques of the third line.",
        },
        { kind: "h", text: "Second line: support from the guide" },
        {
          kind: "list",
          items: [
            "**Think before changing the guide.** A bigger or more supportive guide helps, but exchanging the guide after the wire has crossed can lose the wire, which may be unacceptable when it took a long time to cross (in a CTO, for example). Build support around the existing set-up first.",
            "**Guide extension.** Advanced into the vessel, it adds support and pushability to balloons and microcatheters. Brilakis cites a randomised trial of transradial PCI of complex lesions in which a 5-in-6 mother-and-child catheter was more effective and efficient than a buddy wire or balloon anchoring (zhang-doca-tri-2012). How to deliver an extension safely is the subject of the lesson on inchworming.",
            "**Side-branch anchor.** A workhorse wire into a side branch (the conus or an acute marginal for the RCA, a diagonal for the LAD), a 1.5–2.0 mm balloon sized to that branch, inflated usually at 6–8 atm. The patient may get chest pain while it is up. In chapter 9 Brilakis gives 4–8 atm with a 1:1 balloon; both ranges are low.",
            "**Buddy-wire stent anchor.** If the proximal vessel needs a stent anyway, deploying it over the main wire traps a buddy wire, which then holds the guide firmly.",
            "**Antegrade and retrograde anchors together** have been used in difficult retrograde CTO cases.",
          ],
        },
        {
          kind: "table",
          caption: "What can go wrong with guide-based support for an uncrossable lesion (Brilakis 23.1.3; the inchworming prevention is from 30.3.3)",
          head: ["Measure", "Complication", "Prevention or response"],
          rows: [
            ["Guide extension", "Loss of wire or guide position, distal vessel injury, or dissection of the ostium or mid vessel while advancing it", "Deliver it over a balloon or microcatheter (inchworming), not over the bare wire"],
            ["Guide extension", "Damped pressure when it wedges", "Do not inject through the guide: high risk of hydraulic dissection of the proximal vessel"],
            ["Guide extension", "Its distal marker can come off", "Reported as a complication; Brilakis gives no specific prevention"],
            ["Guide extension", "A stent deformed or stripped from its balloon at the extension's proximal collar, notably at the subclavian bend in radial cases", "In radial cases consider an extension with a 40 cm rather than 25 cm cylinder"],
            ["Side-branch anchor", "Injury or dissection of the branch (infrequent, usually of little consequence); rarely perforation", "Do not oversize the anchor balloon; use a workhorse wire in the branch"],
            ["Buddy-wire stent anchor", "The jailed wire will not come out, or equipment will not pass the proximal stent", "Use only when the proximal vessel genuinely needs a stent"],
            ["Any anchor", "Loss of wire or guide position, or distal injury, while advancing the anchor balloon", "Watch both while delivering it"],
          ],
        },
        { kind: "tip", id: "pci-support-extension-wedge" },
        { kind: "h", text: "Second line: support from the wire" },
        {
          kind: "list",
          items: [
            "**Keep the wire you have.** Exchanging a hard-won wire may be impossible or unwise. Leave it where it is and cross the lesion with a second wire alongside it; this can even be done through a second guide catheter.",
            "**Support wires.** A wire with a stiff, supportive body and a soft tip helps devices along. One type has three gentle waves in its distal segment that centre the delivery part of the wire away from the wall; it is useful through stents, tortuosity and calcium, but it is not used for primary wiring: another wire crosses first and it is then swapped in through a microcatheter or an over-the-wire balloon. Without one, bends placed by hand in the distal part of a workhorse wire can mimic it (30.7.4).",
            "**Deep wiring.** A polymer-jacketed wire advanced through distal branches into the ventricle adds support but carries a risk of perforation (taught in pm-prep-and-stent).",
          ],
        },
        { kind: "tip", id: "pci-unx-keep-the-wire" },
        {
          kind: "check",
          stem: "After 40 minutes a stiff wire has crossed a calcified RCA occlusion into the distal true lumen, but nothing follows it. The guide is a 6 Fr JR4. A colleague suggests swapping to an 8 Fr AL1 straight away. What is Brilakis's concern, and what would you try first?",
          options: [
            "No concern: guide exchange over a crossed wire is routine, so change the guide now",
            "The wire may be lost in the exchange; first add support around it, for example a guide extension or an anchor",
            "The AL1 will dissect the RCA; never use an Amplatz guide for the right coronary artery",
            "An 8 Fr guide gives no more support than a 6 Fr one, so the change would be pointless",
          ],
          answer: 1,
          explanation:
            "Changing the guide after the wire has crossed can lose the wire position, which may be unacceptable after a long crossing (23.1.3.1). Support can usually be added around the current set-up: a guide extension, a side-branch anchor, or a second wire. Larger and more supportive guides do give more support (9.7.8), so the last option is wrong; an Amplatz guide is a recognised supportive RCA shape, though it needs care.",
        },
        { kind: "h", text: "Third line: the microcatheter" },
        {
          kind: "p",
          text: "The concept Brilakis gives is that advancing a microcatheter through the lesion can modify it, so that a balloon can then cross (23.1.4). Separately, in chapter 8 he advises considering a microcatheter for wiring any complex lesion (tortuous, near-occlusive, CTO), and he sorts microcatheters into five groups: large and small outer diameter, angulated, dual-lumen, and those built to modify plaque. For the uncrossable lesion, the designs differ mainly in how they may be turned.",
        },
        {
          kind: "table",
          caption: "Microcatheters for the balloon-uncrossable lesion (Brilakis 23.1.4 and 30.6), described by design",
          head: ["Design", "How it advances", "Cautions"],
          rows: [
            ["Plaque modification microcatheter made of eight stranded stainless-steel wires (2.1 or 2.6 Fr; the larger gives more support)", "Turned counterclockwise to advance and clockwise to withdraw", "No inner polymer lining, so contrast cannot be injected through it; no more than 20 rotations in any direction, or it kinks and its wires unravel"],
            ["Coil microcatheters with a threaded tip, designed to screw into the lesion", "The opposite way: clockwise to advance, counterclockwise to withdraw", "Know which design you are holding before you turn it"],
            ["Large and small coil-reinforced microcatheters", "Can be turned in either direction", "Overspinning damages them"],
            ["Small braided microcatheters without a coil", "Mainly pushed; can be turned, but with difficulty", "Aggressive torque can detach the tip"],
            ["Very low-profile braided microcatheter built for small collaterals", "Pushed, with gentle rotation at most", "Not built for aggressive torque; Brilakis advises against it in uncrossable lesions because the tip can fracture and separate"],
          ],
        },
        {
          kind: "steps",
          title: "Using a microcatheter on an uncrossable lesion",
          items: [
            { title: "1. Keep a wire inside it", detail: "Never torque a microcatheter without a wire in its lumen: the wire keeps it from kinking and becoming trapped." },
            { title: "2. Rotate in bursts", detail: "Turn it up to about 10 times, then let it unwind before turning again (23.1.4). For the stranded-wire plaque modification type, chapter 30 sets the ceiling at 20 rotations in one direction; respect the lower figure when unsure." },
            { title: "3. Watch the guide and the distal wire", detail: "Aggressive pushing loses guide and wire position, and uncontrolled distal wire movement injures the distal vessel." },
            {
              title: "4. Once across",
              detail: "A balloon often crosses now. Alternatively, use the microcatheter to exchange for a more supportive wire, or for the dedicated atherectomy wire if atherectomy is the next planned step.",
            },
            {
              title: "5. If the microcatheter and wire lock together",
              detail: "Rarely, excessive manipulation can damage both and bind them, so both must come out. A polymer-jacketed wire can sometimes be passed back along the channel already made, and the attempt restarts.",
            },
          ],
        },
        { kind: "tip", id: "pci-unx-microcatheter-turns" },
        { kind: "tip", id: "pci-unx-microcatheter-across" },
        { kind: "h", text: "Third line: wire-cutting and wire puncture" },
        {
          kind: "steps",
          title: "Wire-cutting",
          items: [
            { title: "1. Second wire through the lesion", detail: "Advance a second wire across the lesion beside the first; this may itself be hard." },
            { title: "2. Balloon into the cap on the first wire", detail: "Push a balloon over the first wire as far into the proximal cap as it goes, and inflate it." },
            { title: "3. Pull the second wire out while the balloon is inflated", detail: "The wire, pressed against the cap by the balloon, slices through it as it is withdrawn." },
            { title: "4. Deflate, remove, try a new balloon", detail: "A fresh balloon over the first wire often crosses the cut cap." },
          ],
        },
        {
          kind: "p",
          text: "**Seesaw wire-cutting** puts a balloon on each wire. One is pushed as far as it will go and inflated, pressing the other wire into the cap; then it is pulled back and the other balloon is pushed forward and inflated, cutting the cap from the opposite side. The two alternate until one balloon crosses. In the retrospective comparison Brilakis cites (Xue 2017: 40 patients with seesaw wire-cutting against 40 matched patients treated earlier with a plaque modification microcatheter, all balloon-uncrossable CTOs), device success was 87.5% against 45.0%, procedural success 92.5% against 72.5%, and procedures were shorter, with no difference in complications.",
        },
        {
          kind: "list",
          items: [
            "**What goes wrong with wire-cutting.** Pulling the second wire out can drag the guide deep into the vessel and dissect the ostium or proximal vessel. Watch the guide as you withdraw and back it out promptly. If a dissection does occur, an operator experienced in subintimal techniques may be able to use it (fifth line).",
            "**Wire puncture.** Bring a stiff, tapered, highly penetrating wire to the lesion inside a microcatheter or over-the-wire balloon, and jab the entry of the lesion several times with its tip to break it up. Simply getting a supportive second wire through the lesion can also help a balloon or microcatheter cross.",
            "**What goes wrong with wire puncture.** Perforation; but Brilakis considers it unlikely even if the wire tip leaves the vessel, unless a balloon or microcatheter is then pushed after it.",
          ],
        },
        { kind: "tip", id: "pci-unx-wire-cutting" },
        {
          kind: "check",
          stem: "During wire-cutting you are pulling the second wire out against an inflated 1.5 mm balloon at the cap of a proximal LAD lesion. The fluoroscopy shows the EBU guide diving deeper into the left main. What should you do?",
          options: [
            "Continue pulling quickly so that the cut is completed before the guide moves further",
            "Back the guide out promptly while you withdraw the wire, to avoid dissecting the ostium",
            "Inflate the balloon to a higher pressure so that it anchors the guide in place",
            "Inject contrast through the guide to check whether the left main has been dissected",
          ],
          answer: 1,
          explanation:
            "Withdrawing the cutting wire can pull the guide deep, risking ostial or proximal dissection; Brilakis prevents this by watching the guide and backing it out as needed. Pulling faster, raising the balloon pressure or injecting through a deep-seated guide all increase the risk of the very injury you are trying to avoid.",
        },
        {
          kind: "pitfalls",
          items: [
            "Changing the guide after a long crossing and losing the wire.",
            "Injecting through a wedged guide extension.",
            "Oversizing a side-branch anchor balloon, or anchoring with a polymer-jacketed wire.",
            "Turning a threaded plaque modification microcatheter the wrong way, or past its rotation limit.",
            "Torquing a microcatheter with no wire inside it.",
            "Aggressive torque on a small braided microcatheter not built for it: the tip can fracture and stay in the lesion.",
            "Letting the guide dive in during wire-cutting.",
          ],
        },
        {
          kind: "pearl",
          text: "Before torquing any microcatheter at an uncrossable lesion, say aloud which way it advances and how many turns you will allow. The two threaded designs turn in opposite directions, and the count is what keeps the tip on the catheter.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, once the wire is in the distal true lumen and a 1.0 mm balloon will not follow, add support without losing the wire (guide extension or side-branch anchor rather than a guide exchange), then advance a microcatheter in bursts of no more than 10 turns, letting it unwind, and decide whether to try a balloon or exchange for a support or atherectomy wire.",
        },
        { kind: "video", id: "DYQ1m9N4bwg", note: "Elias Hanna: balloon-uncrossable lesions, cases and technical tips, with guide extensions, microcatheters and laser." },
        { kind: "video", id: "DFcSbpqX_6Q", note: "Manual of CTO PCI case 178: troubleshooting a microcatheter-uncrossable lesion." },
        { kind: "video", id: "AlOQpyOrdhc", note: "Manual of CTO PCI case 155: a balloon-uncrossable CTO." },
        {
          kind: "keypoints",
          items: [
            "Support is critical; add it around the crossed wire rather than exchanging the guide.",
            "Guide extension: never inject when it is wedged; beware stent stripping at the collar (40 cm cylinder for radial).",
            "Side-branch anchor: workhorse wire, 1.5–2.0 mm balloon sized to the branch, 6–8 atm (4–8 atm in chapter 9).",
            "Microcatheter: wire always inside; turn in bursts of up to 10, then unwind; know each design's direction.",
            "Once a microcatheter crosses: balloon, or exchange for a support or atherectomy wire.",
            "Wire-cutting: inflate a balloon in the cap and pull a second wire out past it; seesaw version alternates two balloons; watch the guide.",
            "Wire puncture: stiff tapered wire jabbed into the entry over a microcatheter.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-ablation-subintimal",
      title: "Fourth and fifth lines: laser, atherectomy and subintimal techniques",
      minutes: 14,
      topics: ["cx-uncrossable"],
      sources: [B("23.1"), B("30.10"), B("30.11"), B("19.9"), O_ROTA],
      refs: [...BOOKS, "michael-subintimal-anchor-2013", "christopoulos-external-crush-2017", "vo-subintimal-modification-2014"],
      blocks: [
        {
          kind: "p",
          text: "If a balloon still will not cross after small balloons, support, microcatheters and wire techniques, Brilakis's fourth line removes or ablates plaque, and his fifth goes around the lesion through the vessel wall; the subintimal techniques need experience in CTO PCI (23.1.8). The devices themselves (excimer laser, rotational and orbital atherectomy) are taught in full in cp-calcium; this lesson covers how they are used for a lesion a balloon cannot cross.",
        },
        { kind: "h", text: "Fourth line: laser" },
        {
          kind: "p",
          text: "Laser is increasingly used for uncrossable and undilatable lesions, partly because the laser catheter runs over any standard 0.014 in. wire, so the wire already across can stay. Rotational and orbital atherectomy, by contrast, need their own dedicated wires. The Oxford handbook makes the same point from the atherectomy side: when not even a microcatheter will cross, placing the atherectomy wire becomes a main limitation (direct wiring is possible but practically difficult), and an alternative such as laser may be needed. Laser can also modify the proximal cap enough for a balloon to enter without the catheter itself crossing.",
        },
        {
          kind: "steps",
          title: "Laser for an uncrossable lesion",
          items: [
            { title: "1. Switch it on early", detail: "The console needs a 5-minute warm-up and calibration. If laser is a likely option, set it up before you need it." },
            { title: "2. Use the 0.9 mm catheter at maximum settings", detail: "Usually a repetition rate of 80 Hz and a fluence of 80 mJ/mm². The coronary catheter is programmed to lase for 10 seconds and then pause for 5, and is designed for a slow continuous saline infusion; the 0.9 mm peripheral catheter is generally preferred, used off label, because it does not stop automatically after 10 seconds." },
            { title: "3. Lase during saline flushing", detail: "Lasing while contrast is injected (through the guide, or the side port of an over-the-wire laser catheter, which is used mainly in peripheral arteries and rarely in coronary ones) modifies plaque much more, through the acoustic and mechanical effect of rapidly exploding bubbles, but it raises the risk of vessel injury and perforation. Brilakis keeps it for lesions inside previously deployed stents." },
            { title: "4. Then try the balloon again", detail: "The laser may have opened the entry enough for a small balloon to pass." },
          ],
        },
        {
          kind: "list",
          items: [
            "**Perforation**, especially in tortuous vessels; the risk is higher at the maximum settings and with contrast, and lower inside stents.",
            "**A damaged wire.** Lasing over a polymer-jacketed wire can strip its polymer and leave it sticky.",
          ],
        },
        { kind: "tip", id: "pci-calc-laser-uncrossable" },
        { kind: "tip", id: "pci-unx-laser-contrast-stent-only" },
        { kind: "h", text: "Fourth line: atherectomy" },
        {
          kind: "steps",
          title: "Atherectomy for an uncrossable lesion",
          items: [
            {
              title: "1. Get the atherectomy wire across",
              detail: "Rotational and orbital atherectomy each run only on their own dedicated wire, and exchanging for it may be impossible when nothing crosses. If a microcatheter crosses, exchange through it. If nothing else works, bury a microcatheter as deep into the lesion as it will go, pull the original wire, and try to rewire with the atherectomy wire through it.",
            },
            {
              title: "2. Prefer rotational atherectomy",
              detail: "A rotational burr cuts forwards, end-on; the current orbital crown cuts sideways. For a lesion nothing can enter, forward cutting may be the advantage (Brilakis 23.1.7 and 19.9), although orbital atherectomy has also been used successfully in this setting (19.9.2).",
            },
            {
              title: "3. Choose a small burr",
              detail: "1.25–1.50 mm, to limit perforation, which is more likely still if the wire has gone subintimal. In chapter 19 Brilakis adds that a 1.5 mm burr is usually preferred because it may be less likely to become entrapped than a 1.25 mm burr.",
            },
            {
              title: "4. Advance gently and repeatedly",
              detail: "Never wedge the burr forcibly into the lesion with a deceleration: forceful advancement is how burrs become trapped (bail-out in cp-calcium).",
            },
          ],
        },
        {
          kind: "p",
          text: "The burr ablates rigid calcium and spares elastic layers such as the adventitia. Its specific risks here are losing the wire across the lesion during the exchange (and failing to recross with the atherectomy wire), perforation, and burr entrapment.",
        },
        { kind: "tip", id: "pci-unx-bury-microcatheter" },
        {
          kind: "check",
          stem: "A balloon-uncrossable calcified LAD lesion: a microcatheter will not cross, the laser is not available, and you plan rotational atherectomy. How do you get the atherectomy wire across, and which burr do you start with?",
          options: [
            "Pull the workhorse wire out and wire the lesion directly with the atherectomy wire from the guide, then a 2.0 mm burr",
            "Bury the microcatheter in the lesion, swap the workhorse for the atherectomy wire through it, then a 1.25–1.5 mm burr",
            "Keep the workhorse wire and run the burr over it, which avoids losing the position, with a 1.75 mm burr",
            "Switch to orbital atherectomy, which cuts forwards and needs no dedicated wire, with its standard crown",
          ],
          answer: 1,
          explanation:
            "When nothing crosses, Brilakis pushes a microcatheter as deep into the lesion as it will go, removes the original wire and rewires with the dedicated atherectomy wire; a small burr (1.25–1.50 mm) limits perforation. Direct wiring with the atherectomy wire is difficult (Oxford), atherectomy never runs over a workhorse wire, and orbital atherectomy also needs its own wire and cuts sideways, which is why rotational atherectomy may be preferred here, although orbital atherectomy has also been used successfully (19.9.2).",
        },
        { kind: "h", text: "Fifth line: subintimal techniques" },
        {
          kind: "p",
          text: "When the true lumen will not admit a balloon, a second wire can be passed through the wall around the lesion. These are CTO techniques and Brilakis reserves them for operators experienced in them. Both start the same way: keep the first wire in the distal true lumen, and pass a second wire (antegrade or retrograde) subintimally around the uncrossable segment, or create the subintimal track with a blunt dissection catheter and then exchange it for a wire.",
        },
        {
          kind: "table",
          caption: "Subintimal balloon techniques for a balloon-uncrossable lesion (Brilakis 23.1.8 and Fig. 23.5, panels D1 and D2)",
          head: ["", "External crush", "Subintimal distal anchor"],
          rows: [
            ["Where the balloon goes", "Over the subintimal wire, alongside the uncrossable segment", "Over the subintimal wire, beyond the lesion"],
            ["Inflation", "Usually at 8–10 atm", "Inflated distal to the lesion"],
            ["What it does", "Crushes the plaque from outside, modifying it so a balloon can pass over the true-lumen wire", "Pins the true-lumen wire against the wall so that a balloon can be pushed along it (support)"],
            ["Published by", "Christopoulos 2017 (external crush); Vo 2014 (subintimal space plaque modification)", "Michael 2013"],
          ],
        },
        {
          kind: "p",
          text: "Fig. 23.5 also shows a third way through: the subintimal wire re-enters the distal true lumen (panel C), and the vessel is then stented through the subintimal space.",
        },
        {
          kind: "list",
          items: [
            "**The subintimal wire may not get there.** It can, for example, track into side branches.",
            "**Perforation.** Before any balloon goes over a subintimal wire, confirm that the wire is inside the vessel architecture, not in a side branch or out in the pericardium. Brilakis confirms it with contralateral injection in two orthogonal projections.",
            "**Haematoma.** Subintimal crossing and inflation can raise a large subintimal haematoma that compresses the distal true lumen.",
          ],
        },
        { kind: "tip", id: "pci-unx-subintimal-confirm" },
        {
          kind: "check",
          stem: "In a balloon-uncrossable RCA CTO, a knuckled second wire has gone subintimally alongside the lesion. Before inflating a balloon on it to crush the plaque, what must you confirm, and how?",
          options: [
            "That the subintimal wire is within the vessel architecture, using contralateral injection in two orthogonal views",
            "That the true-lumen wire has been withdrawn, so that the crush can open a single new lumen",
            "That antegrade flow is TIMI 3, using a forceful antegrade injection through the guide catheter",
            "That the patient has received a second heparin bolus, using a point-of-care ACT result",
          ],
          answer: 0,
          explanation:
            "Brilakis requires confirmation that the subintimal wire lies within the vessel architecture (not in a side branch or the pericardium) before ballooning on it, usually with contralateral injection in two orthogonal projections. The true-lumen wire must stay: the point of external crush is to let a balloon pass over it. A forceful antegrade injection into a dissected vessel risks extending the haematoma.",
        },
        {
          kind: "pitfalls",
          items: [
            "Forgetting to switch the laser on until it is needed, then waiting 5 minutes.",
            "Lasing with contrast in a native, unstented segment.",
            "Lasing over a polymer-jacketed wire.",
            "Defaulting to orbital rather than rotational atherectomy without considering the value of forward cutting.",
            "A large burr, or a burr pushed into the lesion with a deceleration.",
            "Pulling the only wire before you know the atherectomy wire can recross.",
            "Ballooning over a subintimal wire whose position has not been confirmed in two views.",
          ],
        },
        {
          kind: "pearl",
          text: "Laser is the one ablative option that leaves your wire alone. When the crossing was hard won and nothing else follows it, that alone can make laser the next step, provided the console was switched on early.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when a balloon and a microcatheter have both failed, choose between laser over the existing wire and rotational atherectomy after burying the microcatheter and exchanging wires, say which line of the algorithm each belongs to, and state the burr size or laser settings you would use.",
        },
        { kind: "video", id: "3Yf6eFN63fw", note: "Manual of CTO Interventions case 47: laser for a balloon-uncrossable lesion." },
        { kind: "video", id: "0LssoY7q8WM", note: "Manual of CTO Interventions case 15: external crush for a balloon-uncrossable CTO." },
        { kind: "video", id: "65ch3syR_6Q", note: "Manual of CTO Interventions case 1: retrograde approach for a balloon-uncrossable lesion." },
        { kind: "video", id: "Ar6w7Fn7Mq0", note: "Manual of CTO Interventions case 52: laser for a balloon-uncrossable CTO." },
        {
          kind: "keypoints",
          items: [
            "Laser runs over the wire already across; atherectomy needs its own wire.",
            "Laser: 0.9 mm catheter, usually 80 Hz and 80 mJ/mm², 5-minute warm-up, saline flush; contrast only inside stents.",
            "Atherectomy: exchange through a microcatheter, or bury one and rewire; rotational preferred (end-on cutting); 1.25–1.50 mm burr; never wedge it.",
            "Subintimal techniques are for experienced CTO operators: external crush (8–10 atm alongside) or subintimal distal anchor (beyond the lesion).",
            "Confirm a subintimal wire is within the vessel architecture in two orthogonal views before ballooning on it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-extension-combined",
      title: "Delivering a guide extension by inchworming, and combining support with modification",
      minutes: 14,
      topics: ["pci-inchworming", "pci-power-techniques"],
      sources: [B("30.3"), B("23.1"), B("8.5"), B("9.7"), B("25"), B("27")],
      refs: [...BRILAKIS, "kirtane-anchor-tornus-2007", "sandoval-laser-atherectomy-2020"],
      blocks: [
        {
          kind: "p",
          text: "A guide extension is a short tube (the cylinder) on a push rod, run through the guide and out into the coronary artery. Its inner diameter is about 1–2 Fr smaller than the guide's (Brilakis gives worked inner diameters in 30.3.4). Delivering equipment is its main use, and in an uncrossable or undeliverable lesion it can carry balloons and stents past disease without their touching the wall. But the extension itself has to get there first, and pushing its edge along a bare wire is how it dissects the vessel. Brilakis's preferred way of getting it there is **inchworming**.",
        },
        {
          kind: "steps",
          title: "Inchworming, step by step (Brilakis 30.3.3 and Fig. 30.28)",
          items: [
            { title: "1. Guide engaged, extension to its tip", detail: "With the guide in position, advance the extension inside it until the extension's tip reaches the tip of the guide." },
            { title: "2. Balloon half in, half out", detail: "Advance a small balloon, usually 2.0 mm, so that half of it lies inside the extension's tip and half in the vessel beyond." },
            { title: "3. Inflate at low pressure", detail: "Usually 6–8 atm. The inflated balloon holds the extension's tip in the centre of the lumen." },
            { title: "4. Deflate", detail: "Begin deflating the balloon." },
            { title: "5. Advance the extension as the balloon deflates", detail: "As the balloon goes down, push the extension forward over it." },
            { title: "6. Repeat as needed", detail: "Fig. 30.28 shows a single cycle. The name implies that the cycle is repeated (balloon straddling the new tip, inflate, deflate, advance) so that the extension moves forward in short steps until it reaches where you want it." },
          ],
        },
        { kind: "tip", id: "pci-unx-inchworm" },
        {
          kind: "p",
          text: "**Why over a balloon rather than the wire.** The extension's edge, riding on a bare 0.014 in. wire, can catch a plaque edge and dissect the vessel. Brilakis therefore prefers advancing it over a balloon or a microcatheter, and in his chapter on dissection he lists delivering the extension over a balloon, by inchworming, among the ways to prevent aorto-coronary dissection, with extreme caution about injecting through an extension.",
        },
        {
          kind: "table",
          caption: "Three ways to deliver a guide extension (Brilakis 30.3.3)",
          head: ["Technique", "How", "Brilakis's view"],
          rows: [
            ["Inchworming", "Balloon straddling the extension's tip; inflate at low pressure, deflate and advance the extension; repeat if needed", "Generally preferred: it centres the extension, so it is less likely to injure the vessel"],
            ["Guide extension balloon-assisted tracking", "A balloon protruding from the extension is inflated at nominal pressure, and the extension and balloon are then advanced together", "An alternative, for example through tortuosity or previously stented segments"],
            ["Distal anchor", "A balloon inflated distally on a second wire pins the first wire, and the extension is advanced over it (repeated anchoring has been used to step it forward)", "An alternative; needs a second wire and room in the guide"],
          ],
        },
        {
          kind: "p",
          text: "A note on names: some operators, and the linked video's title, call inchworming 'balloon-assisted tracking'. In the manual, the balloon-assisted tracking name (GBAT) belongs to the different technique in the second row, in which the inflated balloon and the extension move forward together.",
        },
        {
          kind: "check",
          stem: "You want to take a guide extension into a diseased, tortuous proximal circumflex. A 2.0 mm balloon sits half inside the extension's tip and half in the vessel. What is the next move in inchworming?",
          options: [
            "Inflate it to rated burst pressure and push the extension and balloon forward together",
            "Inflate it at about 6–8 atm, then advance the extension while the balloon deflates",
            "Withdraw the balloon fully into the extension and push the extension along the wire",
            "Advance the balloon distally, inflate it at 12 atm and pull the wire back to tension it",
          ],
          answer: 1,
          explanation:
            "In inchworming the straddling balloon is inflated at low pressure, usually 6–8 atm, and the extension is advanced as it deflates; Fig. 30.28 shows one cycle, which can be repeated if needed. Pushing an extension along a bare wire is what inchworming exists to avoid. Advancing extension and balloon together with the balloon inflated describes balloon-assisted tracking, which uses nominal pressure, not rated burst pressure.",
        },
        { kind: "h", text: "Handling the extension safely" },
        {
          kind: "list",
          items: [
            "**Wire wrap.** Lay the push rod under a towel beside the Y-connector so that the wire does not wrap around it. If a balloon meets resistance at the extension's entry, the wire may have wrapped: remove the extension and reinsert it.",
            "**The proximal collar stays inside the guide.** Never advance it out of the guide catheter.",
            "**Wires and a smaller extension.** Do not try to pass wires through a guide that holds a smaller extension (a 6 Fr extension in an 8 Fr guide): the wire can slip between the cylinder and the guide wall. Even with matched sizes the wire tip can be damaged entering the cylinder; entering with the wire withdrawn inside a microcatheter reduces the risk. Pass wires through the collar under fluoroscopy and without force.",
            "**Stents at the collar.** A stent can deform at the collar on the way in, or on being pulled back into the extension's tip after a failed attempt. If there is resistance, watch the stent on fluoroscopy as it enters; sometimes it is better to load the stent into the extension outside the body and insert both as one unit. Inspect any stent you withdraw.",
            "**Damping and ACT.** The extension makes the lumen about 1–2 Fr smaller than the guide's, so watch for pressure damping and keep the ACT in range to avoid thrombus. Minimise damping; if it occurs, confirm that antegrade flow is adequate and that the vessel is not injured before you continue. Avoid injecting through a deeply seated extension, and never inject while the pressure is damped: the dissection can spread forwards or back into the aorta. Deep extension use has caused acute closure that needed emergency surgery.",
            "**Ejection.** Hold the push rod during a forceful injection, or the extension can be shot out into the vessel.",
            "**Other complications.** Fracture of the extension, and lengthwise deformation of a stent if an extension is forced through it.",
            "**Trapping.** Trapping equipment with a standard extension is awkward, because the trapping balloon must sit proximal to the collar; if you expect to trap, a guide extension with a built-in trapping balloon is preferred.",
          ],
        },
        { kind: "tip", id: "pci-unx-extension-collar" },
        { kind: "tip", id: "pci-unx-extension-stent-at-collar" },
        {
          kind: "list",
          items: [
            "**Very flexible.** Extensions can travel through very tortuous vessels.",
            "**Mother, daughter and granddaughter.** Two extensions can be nested (a 6 Fr extension inside an 8 Fr one) to negotiate several extreme bends.",
            "**Proximal-to-distal stenting.** Distal-first stenting is preferred, but if a proximal stent is already in, the extension can be passed through it to deliver the distal stent.",
            "**Deep intubation** of a 5 or 6 Fr guide is the alternative to an extension.",
          ],
        },
        { kind: "h", text: "Support and modification at the same time" },
        {
          kind: "p",
          text: "Brilakis's ninth step for the uncrossable lesion is to combine. Applying a support technique and a lesion modification technique **simultaneously** raises the chance that a balloon will cross: published pairings include an anchor balloon with a plaque modification microcatheter (Kirtane 2007), a plaque modification microcatheter used with a proximal support device in a vein graft, and an anchor balloon with laser. In the LAD occlusion Brilakis illustrates, the wire crossed but a microcatheter would not advance; a micro-dilation catheter then failed alone and again with a 4.0 mm anchor balloon in the circumflex stent; laser followed, the balloon was still badly underexpanded, orbital atherectomy then allowed adequate balloon expansion, and the vessel was stented (Sandoval 2020). Techniques can also be applied **in sequence** until one works. Brilakis expects the operator to improvise combinations; it is hard work, but often worth it.",
        },
        {
          kind: "p",
          text: "**'Power microcatheter' and 'power guide extension'.** These names come from a Brilakis video listed below. The 2021 edition of the Manual of PCI that this curriculum follows does not describe techniques under these names, and we have not found a verified published description, so this lesson does not describe their steps. The manual does teach that better guide support increases the likelihood of balloon or microcatheter crossing (23.1.3) and that support and lesion-modification techniques can be applied simultaneously (23.1.9). The video is the only source for the named techniques here.",
        },
        { kind: "tip", id: "pci-unx-combine" },
        {
          kind: "check",
          stem: "A plaque modification microcatheter stalls at the cap of a calcified LAD lesion each time you turn it, and the guide backs out of the left main. Which approach best applies Brilakis's ninth step?",
          options: [
            "Turn the microcatheter more turns in one go so that it finally bites into the cap",
            "Anchor in a side branch to hold the guide while you work the microcatheter",
            "Replace it with a larger, stiffer balloon and push that harder against the cap",
            "Stop and accept the result, because the guide backing out means PCI has failed",
          ],
          answer: 1,
          explanation:
            "Combining a support technique with lesion modification at the same time (for example an anchor balloon with a plaque modification microcatheter) is exactly the combination Brilakis describes. Extra turns beyond the rotation limit risk damaging and trapping the microcatheter, and more force on a bigger balloon repeats the failure that started the problem. A guide that backs out is a reason to add support, not to stop.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing an extension along a bare wire into diseased proximal vessel.",
            "Injecting through a wedged or deeply seated extension.",
            "Letting the proximal collar leave the guide.",
            "Forcing a stent through the collar and not inspecting it after a failed delivery.",
            "Forgetting the push rod towel, then fighting a wrapped wire.",
            "Escalating one technique at a time when the problem is clearly both support and plaque.",
          ],
        },
        {
          kind: "pearl",
          text: "Inchworming keeps the extension's tip centred, away from the wall, at every step. When the extension will not advance, extra force on the push rod throws that protection away; going back to another short balloon-guided step keeps it.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when the stent will not cross, deliver a guide extension by inchworming: extension to the guide tip, 2.0 mm balloon half in and half out, inflate at 6–8 atm, advance the extension as it deflates, and repeat if needed; keep the collar inside the guide and do not inject while the pressure is damped.",
        },
        { kind: "video", id: "Gm2X2tIKxyU", note: "How to deliver a guide catheter extension by inchworming (the video's title also calls it balloon-assisted tracking)." },
        { kind: "video", id: "WzFQvVzboKY", note: "Manual of PCI chapter video on the power microcatheter and power guide extension techniques." },
        { kind: "video", id: "Z1ZoLSI14iI", note: "Manual of CTO PCI case 201: a balloon-uncrossable left main CTO." },
        {
          kind: "keypoints",
          items: [
            "Inchworming: extension to the guide tip; 2.0 mm balloon straddling its tip; 6–8 atm; advance the extension as the balloon deflates; repeat if needed.",
            "Preferred to balloon-assisted tracking and distal anchoring because it centres the extension.",
            "Never push an extension along a bare wire into diseased vessel; never inject through it with damped pressure.",
            "Push rod under a towel; collar inside the guide; hold the rod during forceful injections; watch damping and ACT.",
            "Combine support and modification simultaneously (anchor plus plaque modification microcatheter, anchor plus laser) or in sequence.",
            "The named power microcatheter and power guide extension techniques are not described in the manual edition taught here; see the video.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-undilatable-balloons",
      title: "The balloon-undilatable lesion: prevention, the two algorithms and high-pressure balloon technique",
      minutes: 15,
      topics: ["cx-undilatable"],
      sources: [B("23.2"), B("9.7"), B("10.2"), B("19.9"), B("30.9"), O_BALLOONS],
      refs: [...BOOKS, "tajti-undilatable-cto-2018", "fujino-calcium-2018"],
      blocks: [
        {
          kind: "p",
          text: "A lesion is **balloon-undilatable** when it will not expand despite repeated high-pressure balloon inflations: the balloon keeps a waist on fluoroscopy (Brilakis 23.2). Such lesions are often severely calcified, and are often balloon-uncrossable as well. Their importance lies in what happens if a stent goes in anyway: an underexpanded stent predisposes to stent thrombosis and restenosis, and is much harder to fix than the lesion was. The Oxford handbook puts it the same way: dilate the lesion as fully as possible before stenting, because trying to crack a resistant lesion once the stent is in place is very hard.",
        },
        { kind: "h", text: "Prevention" },
        {
          kind: "list",
          items: [
            "**Expect it.** Undilatable lesions are more frequent in CTOs. In the registry Brilakis cites (Tajti 2018), 52 of 425 CTOs crossed with a wire (12%) were balloon-undilatable; they were longer and more often moderately or severely calcified, had lower success and more in-hospital major adverse events, mainly perforations.",
            "**Never stent a lesion a balloon has not opened.** Predilate with a balloon sized to the reference vessel diameter and see it expand fully, above all in severe calcium. If the lesion resists, prepare it further (more predilatation or atherectomy) before any stent.",
            "**Image.** Intravascular imaging helps choose the predilatation balloon size and shows plaque features that may need atherectomy.",
            "**Size balloons conservatively.** The Oxford handbook sizes balloons no larger than the vessel at the lesion; oversizing risks dissection or rupture.",
          ],
        },
        { kind: "tip", id: "pci-balloon-waist-stop" },
        { kind: "h", text: "De novo or in-stent? The first question" },
        {
          kind: "p",
          text: "The pathway you follow hinges first on one fact: is the lesion **de novo** or **inside a stent**, and was that stent placed today or years ago? Orbital atherectomy should not be performed in recently implanted stents, and rotational atherectomy in recently implanted stents carries more risk of burr entrapment and stent distortion. Laser fired during contrast injection, on the other hand, can often expand an undilatable lesion inside a stent (extra-stent laser-assisted plaque modification, ESLAP), but it is rarely used in de novo lesions, outside a stent, because there it can dissect or perforate the vessel.",
        },
        {
          kind: "table",
          caption: "Brilakis's algorithms for the balloon-undilatable lesion (Fig. 23.7, rebuilt as a table). Intravascular imaging (step 11) runs alongside every step",
          head: ["", "De novo lesion", "In-stent lesion"],
          rows: [
            ["Entry", "1. Is the lesion likely to respond to a balloon? Yes: go to 2. No: go to 4", "Start at 2"],
            ["Balloon", "2. High-pressure balloon (shorter balloon; two smaller balloons inflated together; one or more buddy wires). Failure: go to 3", "2. The same. Failure: go to 3"],
            ["Modified balloon", "3. Scoring, nitinol-caged or cutting balloon. Failure: go to 4", "3. The same. Failure: go to 6 (laser)"],
            ["Atherectomy decision", "4. Suitable for atherectomy? Yes: 5. No: back to the balloon steps if not yet tried, or to 6 (laser) if they have failed", "Atherectomy comes after laser"],
            ["Ablation", "5. Atherectomy, orbital or rotational. Failure: 6. Laser", "6. Laser. Failure: 5. Atherectomy, orbital or rotational"],
            ["Wall", "7. Subintimal lesion crossing", "7. Subintimal lesion crossing"],
            ["Last resort", "8. CABG", "8. CABG"],
            ["Listed as future techniques in 2020", "9. Lithotripsy (intravascular). 10. A balloon for very high pressures", "The same"],
          ],
        },
        {
          kind: "p",
          text: "**Will it respond to a balloon?** Heavily calcified lesions are less likely to. Imaging answers the question better than the angiogram: on OCT, a maximum calcium arc over 180°, a maximum thickness over 0.5 mm and a length over 5.0 mm together have been associated with stent underexpansion (Fujino 2018; the OCT calcium score is taught in pm-imaging and cp-calcium). Heavy circumferential calcium favours going early to atherectomy; less calcified lesions usually start with balloons.",
        },
        { kind: "tip", id: "pci-unx-undilatable-first-question" },
        {
          kind: "check",
          stem: "A balloon-undilatable lesion is found inside a stent implanted 20 minutes ago. High-pressure non-compliant inflations with a buddy wire and a scoring balloon have both failed. What comes next in Brilakis's 2020 in-stent algorithm?",
          options: [
            "Orbital atherectomy, because it cuts sideways and so will not catch the new struts",
            "Laser, fired with contrast because the lesion is inside a stent, then retest",
            "A second stent inside the first to add radial strength across the waist",
            "Rotational atherectomy with a 1.25 mm burr, the smallest and so the safest",
          ],
          answer: 1,
          explanation:
            "In the in-stent pathway laser comes before atherectomy, and lasing during contrast injection is acceptable inside a stent. Orbital atherectomy is avoided in stents placed recently, and rotational atherectomy there risks burr entrapment and stent distortion; if it is needed for an undilatable stent, Brilakis advises larger burrs (1.75 mm or more) to avoid entrapment, not the smallest. A second stent adds an underexpanded layer. In current practice, lithotripsy (where its balloon crosses) is also an option at this point; Brilakis's 2020 text already lists it, where available, before in-stent atherectomy (see cp-calcium).",
        },
        { kind: "h", text: "Step 2: getting the most from a balloon" },
        {
          kind: "steps",
          title: "High-pressure balloon technique for an undilatable lesion (Brilakis 23.2.2)",
          items: [
            { title: "1. Non-compliant balloon, high pressure", detail: "In undilatable lesions Brilakis often goes up to 26–28 atm (23.2.2). That may exceed a particular balloon's rated burst pressure, which is why Brilakis stresses knowing each non-compliant balloon's rating and diameter growth (23.2.2); the Oxford handbook defines the rated burst pressure as the limit past which a balloon is not meant to go, with a risk of rupture. In chapter 9 Brilakis gives usual non-compliant pressures of 12–20 atm (up to 20–26 atm when expansion is suboptimal), lists pressures above 20 atm as a cause of balloon rupture, and advises considering atherectomy or lithotripsy first in heavily calcified lesions (9.7.9). So check the instructions for use: know the rated burst pressure and how much the balloon grows at each pressure, go above 20 atm only with a non-compliant balloon whose rating allows it, and accept the rupture risk knowingly." },
            { title: "2. Size it conservatively", detail: "In nearly all cases use a balloon-to-vessel ratio of 1:1 or less. Slightly undersized balloons, usually by about 0.5 mm, are often used." },
            { title: "3. Inflate for longer", detail: "30–60 seconds or more (in chapter 19 he gives 1–2 minutes for calcified lesions). A falling indeflator pressure means the lesion is giving way: keep going." },
            { title: "4. Or cycle the pressure", detail: "Once at high pressure, dropping and raising the pressure quickly several times may break the lesion." },
            { title: "5. Concentrate the force", detail: "A shorter balloon focuses the force on the lesion. Two undersized balloons inflated side by side create asymmetric pressure. One or more buddy wires through the lesion alter the forces on the wall and modify the plaque: a makeshift scoring or cutting balloon." },
            { title: "6. Respect the vessel outside the lesion", detail: "Avoid injuring segments that will not be stented; every ballooned segment should be covered by a stent afterwards, to avoid restenosis from geographic miss." },
          ],
        },
        { kind: "tip", id: "pci-unx-hp-balloon-technique" },
        {
          kind: "table",
          caption: "What can go wrong with high-pressure inflation, and what to do",
          head: ["Problem", "Prevention", "Response"],
          rows: [
            ["Perforation", "Conservative sizing (1:1 or less); remove all air from the balloon", "Perforation management (cm-perforation)"],
            ["Balloon rupture, causing dissection or perforation", "Stay within the balloon's rating; chapter 9 lists pressures above 20 atm as a cause; consider atherectomy or lithotripsy first in very heavy calcium", "Apply suction at once, remove the balloon, aspirate the guide to clear any air, then angiography straight away to look for perforation, air embolism or a flow-limiting dissection; if perforated, inflate a new balloon at or just proximal to the site at once (9.7.9, 19.9.3)"],
            ["A sticky balloon after high pressure", "Expect it", "Withdraw it under fluoroscopy so that the wire is not pulled back with it"],
            ["Balloon entrapment", "Avoid very high pressures that may rupture balloons in heavy calcium (27.3)", "Bail-out in cm-equipment-loss"],
          ],
        },
        { kind: "tip", id: "pci-unx-rupture-look" },
        { kind: "tip", id: "pci-unx-sticky-balloon" },
        {
          kind: "check",
          stem: "In a 3.0 mm calcified mid-LAD segment a 3.0 mm non-compliant balloon holds a waist at 20 atm for 20 seconds. Which plan follows Brilakis's high-pressure technique?",
          options: [
            "A 3.5 mm non-compliant balloon at 20 atm, because a larger balloon applies more force",
            "A semi-compliant 3.0 mm balloon at 30 atm, which grows to fill the waist",
            "A shorter 2.5–3.0 mm NC balloon, higher within its rating, 30–60 s, plus a buddy wire",
            "Stent now at high pressure, since the stent's radial force will complete the expansion",
          ],
          answer: 2,
          explanation:
            "Brilakis concentrates force with a shorter, conservatively sized (1:1 or slightly undersized) non-compliant balloon at high pressure for longer, and adds buddy wires as a makeshift scoring element. Oversizing raises the risk of perforation; a semi-compliant balloon at very high pressure expands unpredictably and may rupture; and stenting an undilatable lesion creates an underexpanded stent that is much harder to treat.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting a lesion with a persistent balloon waist.",
            "Oversizing the balloon to 'win' against calcium.",
            "Not knowing the balloon's rated burst pressure and growth before going high.",
            "Short inflations: the lesion that yields at 45 seconds never gets the chance.",
            "Ballooning segments that will not be stented.",
            "After a rupture, moving on without an immediate angiogram.",
            "Pulling a sticky balloon out blind and losing the wire.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide what the undilatable lesion is before choosing a tool: de novo or in-stent, and if in-stent, how recent. Those two answers change the order of every later step, and the fresh-stent answer rules some devices out altogether.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Prepare a calcified 3.0 mm lesion: choose a non-compliant balloon sized 1:1 or 0.5 mm smaller, inflate within its rated burst pressure and hold for 30–60 seconds; when a waist persists, try a shorter balloon, then cycling the pressure, and record whether the lesion is ready for a stent.",
        },
        { kind: "video", id: "wQSNgtczHS0", note: "Manual of PCI section 23.2: balloon-undilatable lesions." },
        { kind: "video", id: "g0IfIsNsops", note: "Manual of PCI case 15: a balloon-undilatable lesion." },
        { kind: "video", id: "-fdTNZnRvxY", note: "Manual of CTO PCI case 238: a balloon-undilatable CTO." },
        {
          kind: "keypoints",
          items: [
            "Undilatable: no expansion despite repeated high-pressure inflations; often heavily calcified, often uncrossable too.",
            "Prevention: never stent before a balloon sized to the reference vessel has fully expanded; image; prepare further if resistant.",
            "First question: de novo or in-stent (and how recent)?",
            "De novo: likely to respond? balloons, modified balloons, atherectomy if suitable, laser, subintimal, CABG.",
            "In-stent: balloons, modified balloons, laser, then atherectomy, subintimal, CABG.",
            "High-pressure technique: NC at high pressure (Brilakis often 26–28 atm), only as far as that balloon's rated burst pressure allows (chapter 9: above 20 atm risks rupture), 1:1 or about 0.5 mm smaller, 30–60 s or pressure cycling, shorter balloon, two balloons, buddy wires.",
            "Rupture: suction, remove the balloon, aspirate the guide, angiography at once; if perforated, a new balloon at the site; sticky balloons out under fluoroscopy.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-uncrossable-undilatable-beyond",
      title: "Beyond the balloon: modified balloons, atherectomy, laser, subintimal crossing, surgery and newer tools",
      minutes: 14,
      topics: ["cx-undilatable"],
      sources: [B("23.2"), B("30.9"), B("30.10"), B("30.11"), B("19.9"), B("9.7"), B("10.2"), O_ROTA],
      refs: [...BOOKS, "egred-raser-2012", "latib-ellement-2014", "secco-opn-2019", "barbato-calcium-consensus-2023"],
      blocks: [
        {
          kind: "p",
          text: "When high-pressure balloons fail, Brilakis's algorithms move on to balloons that focus force, then to devices that remove or fracture calcium, then around the lesion, and finally to surgery. Intravascular imaging accompanies every step, because heavily calcified lesions often look expanded during balloon inflation yet turn out to have a small minimal lumen area on imaging.",
        },
        { kind: "h", text: "Step 3: plaque modification balloons" },
        {
          kind: "p",
          text: "Scoring balloons (nitinol struts spiralling round the balloon), nitinol-caged balloons (which form pillows and grooves) and cutting balloons (with blades) all focus pressure on the plaque. They cost more than standard balloons and are harder to deliver, so in most cases standard balloons go first (19.9.3). Their hazards in an undilatable lesion are specific:",
        },
        {
          kind: "list",
          items: [
            "**They may not cross.** Delivery can cost guide and wire position; anchors or a guide extension may be needed to get them there.",
            "**Rupture and perforation.**",
            "**Entrapment**, especially if the balloon ruptures: excessive force or rupture in the lesion can fracture a cutting balloon's blade, avulse stent struts and trap the balloon.",
            "**Cutting balloons are inflated slowly, and deflated as slowly.** Brilakis gives 1 atm every 5 seconds in chapters 19 and 30; slow inflation keeps the blades from puncturing the balloon or catching in calcium spicules (9.7.9), and slow deflation lets them rewrap into the folds (19.9.3). The usual pressure is 6–8 atm (9.7.9), and the ceiling differs between his chapters: avoid more than 14 atm (23.2.3) or do not exceed 12 atm (9.7.9). Keep to the lower figure. Let it deflate fully before withdrawing it: the Oxford handbook warns that the blades can injure the vessel if it is pulled back before full deflation, and can cut gloves and skin.",
          ],
        },
        { kind: "tip", id: "pci-calc-cutting-slow" },
        { kind: "h", text: "Steps 4 and 5: atherectomy" },
        {
          kind: "list",
          items: [
            "**Is it suitable?** The risks of atherectomy (dissection, embolisation, perforation, equipment loss or entrapment) rise with tortuosity, which is a relative contraindication, and with thrombus, dissection and bypass grafts. The Oxford handbook lists severe tortuosity and coronary dissection as contraindications to rotational atherectomy.",
            "**Rotational or orbital** atherectomy can both expand a de novo undilatable lesion (technique in cp-calcium).",
            "**Laser plus rotational atherectomy (RASER)**: a combination reported for very resistant lesions that neither approach opens on its own (Egred 2012: three patients with severely calcified, undilatable lesions).",
          ],
        },
        { kind: "h", text: "The undilatable stent" },
        {
          kind: "p",
          text: "Discovering after stenting that a lesion would not dilate is a serious problem: the underexpanded stent predisposes to thrombosis and restenosis. Prevention is intravascular imaging and careful predilatation with a 1:1 balloon that is seen to expand fully before the stent goes in; if it does not, more preparation (often atherectomy) comes first. Once the stent is in, the in-stent pathway applies.",
        },
        {
          kind: "table",
          caption: "Atherectomy inside an underexpanded stent ('stentablation'), Brilakis 23.2.5 and 19.9",
          head: ["Point", "Detail"],
          rows: [
            ["How often", "Infrequently done"],
            ["Why", "Stent material or plaque can embolise, the burr can become trapped, and the stent can be damaged badly enough to need more stents; in-stent atherectomy also restenoses more than laser"],
            ["Recent stents", "Complications are more likely; orbital atherectomy should be avoided in recently implanted stents (it can be done in older ones)"],
            ["Burr size", "Larger burrs (1.75 mm or more) are used selectively for undilatable stents, to avoid entrapment"],
            ["Burr speed", "Higher speeds in recently deployed stents, to avoid burr and stent entrapment (19.9)"],
            ["Place in the algorithm", "In general, reserved for when high-pressure balloons (with or without buddy wires), laser, or newer options where available (lithotripsy, a very-high-pressure balloon) have failed"],
          ],
        },
        { kind: "tip", id: "pci-ocx-instent-atherectomy-last" },
        { kind: "h", text: "Step 6: laser" },
        {
          kind: "steps",
          title: "Laser for an undilatable lesion (Brilakis 23.2.6)",
          items: [
            { title: "1. Catheter and settings", detail: "The 0.9 mm catheter, usually at maximum repetition and fluence (80 Hz, 80 mJ/mm²)." },
            { title: "2. Saline or contrast", detail: "Lase during saline flushing; inside an underexpanded stent, lase during contrast injection instead." },
            { title: "3. Test with a high-pressure balloon", detail: "Then inflate a high-pressure balloon to see whether the lesion has been modified enough to expand." },
          ],
        },
        {
          kind: "p",
          text: "Dissection is why lasing with contrast is kept for underexpanded stents; perforation is the other risk. In the multicentre registry Brilakis cites (Latib 2014, 28 patients with an underexpanded stent despite high-pressure balloons), laser during contrast injection, confined to the stent, allowed the same non-compliant balloon to expand the stent in 27 (96.4%), with periprocedural myocardial infarction in 7.1%.",
        },
        { kind: "tip", id: "pci-unx-laser-then-test" },
        {
          kind: "check",
          stem: "IVUS of in-stent restenosis in a mid-RCA stent shows an underexpanded stent with a minimal lumen area of 3.3 mm² and heavy calcium behind it. A 3.5 mm NC balloon does not expand it. Laser at 80 Hz and 80 mJ/mm² is done; NC and scoring balloons still fail on IVUS. What step did Brilakis's example take next?",
          options: [
            "Rotational atherectomy with a 1.5 mm burr, then scoring and 4.0 mm NC balloons",
            "A second drug-eluting stent at high pressure inside the first one",
            "Orbital atherectomy, which is ideal for underexpanded stents of any age",
            "Accepting the result, since a minimal lumen area of 3.3 mm² is adequate",
          ],
          answer: 0,
          explanation:
            "In Brilakis's illustrated case (Fig. 23.8), after laser and repeated balloon failures, rotational atherectomy with a 1.5 mm burr followed by a 3.5 mm scoring balloon and a 4.0 mm non-compliant balloon expanded the stent on IVUS. That matches the in-stent algorithm: atherectomy after laser. A second stent adds an underexpanded layer; orbital atherectomy is not ideal for stents of any age: it must be avoided in recently implanted stents, although it has been used successfully in older, endothelialised ones such as this, and it is not what the example used; and leaving an undilatable lesion untreated raises the risk of thrombosis and restenosis.",
        },
        { kind: "h", text: "Steps 7 and 8: subintimal crossing and surgery" },
        {
          kind: "list",
          items: [
            "**Subintimal lesion crossing** may also allow the lesion to expand, as in the uncrossable-lesion techniques (external crush from the subintimal space).",
            "**CABG.** Rarely, when every option fails, surgery is needed. An undilatable lesion left as it is carries a higher risk of stent thrombosis and restenosis.",
          ],
        },
        { kind: "tip", id: "pci-unx-cabg-last" },
        { kind: "h", text: "Steps 9 and 10: lithotripsy and the very-high-pressure balloon" },
        {
          kind: "table",
          caption: "Two tools Brilakis listed as future techniques in 2020",
          head: ["", "Intravascular lithotripsy", "Very-high-pressure balloon"],
          rows: [
            ["What it is", "A balloon with emitters that deliver shockwaves to fracture calcium (Oxford: pulses at 1 Hz, acting on superficial and deeper calcium)", "A specialised non-compliant balloon that can deliver very high pressures (over 40 atm)"],
            ["What Brilakis reports", "Published reports of successful use for undilatable lesions with circumferential calcium; then not clinically available in the United States (the peripheral catheter was used off label in large coronary arteries). The Oxford handbook rated it the most hopeful of the newer tools, one that could become the standard choice for calcified, undilatable lesions", "Usual inflation 30–35 atm (9.7.9); then not available in the United States"],
            ["Evidence quoted", "Taught in cp-calcium", "Secco 2019: 326 consecutive undilatable lesions; the balloon alone achieved adequate expansion in over 90%; coronary rupture in 3 (3 of 326 lesions, under 1%), all treated with a stent. Brilakis quotes the rupture risk as 2–3%, higher than this paper's abstract reports"],
            ["Limitation", "The bulky balloon may not cross a tight lesion (Oxford)", "As for any balloon, it must reach and cross the lesion"],
          ],
        },
        {
          kind: "p",
          text: "These were future techniques when the manual was written. Coronary lithotripsy has since been studied in a single-arm regulatory study and in randomised trials, and the 2023 EAPCI clinical consensus statement includes it with rotational and orbital atherectomy when choosing a tool for calcified lesions by calcium morphology and location (the evidence is taught in cp-calcium). Brilakis already placed lithotripsy, where available, before in-stent atherectomy (23.2.5). Where a lithotripsy balloon can cross (Oxford: its bulk may stop it crossing a tight lesion), it is therefore an option to weigh in both pathways at the point where balloons have failed, which the 2020 algorithm could not show.",
        },
        {
          kind: "check",
          stem: "Which statement about the very-high-pressure non-compliant balloon is supported by the sources?",
          options: [
            "Brilakis gives its usual inflation as 30–35 atm, and the device can exceed 40 atm",
            "It can be inflated beyond any pressure because it never ruptures",
            "It replaces imaging, because full expansion at 40 atm proves the result",
            "It is first-line in Brilakis's 2020 algorithm, ahead of standard NC balloons",
          ],
          answer: 0,
          explanation:
            "Brilakis gives 30–35 atm as the usual inflation for this balloon (9.7.9) and describes it as able to exceed 40 atm (23.2.10, 30.9.7). Ruptures do occur (3 coronary ruptures in Secco's 326 lesions, under 1%, although Brilakis quotes 2–3%). Imaging remains critical at every stage, since calcified lesions can look expanded yet have a small lumen. In the 2020 algorithm it is listed as a future technique, not a first step.",
        },
        {
          kind: "pitfalls",
          items: [
            "Going straight to a modified balloon that cannot be delivered, and losing the wire in the attempt.",
            "Inflating a cutting balloon quickly or above 12 atm.",
            "Atherectomy in a tortuous, dissected, thrombotic or grafted vessel without weighing the extra risk.",
            "Orbital atherectomy in a stent placed today.",
            "Lasing with contrast outside a stent.",
            "Judging expansion from the inflated balloon on fluoroscopy rather than from imaging.",
            "Leaving an undilatable stented lesion untreated rather than escalating, or referring for surgery when everything fails.",
          ],
        },
        {
          kind: "pearl",
          text: "After every escalation, test with the same high-pressure non-compliant balloon that failed before and image: the comparison shows whether the last device actually changed the lesion, and stops you stenting on hope.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when the 1:1 non-compliant balloon keeps its waist, decide whether the lesion is de novo or in-stent, state the next three steps of the matching Brilakis algorithm, and after each device retest with a high-pressure balloon and image before considering a stent.",
        },
        { kind: "video", id: "U3iw9wp8abo", note: "Manual of PCI case 149: a truly resistant lesion." },
        { kind: "video", id: "TsqRwqZju4s", note: "Manual of PCI case 67: how to treat underexpanded stents." },
        { kind: "video", id: "yulnmmP24PI", note: "Manual of PCI case 218: an undilatable in-stent restenosis." },
        { kind: "video", id: "lrMbTP0Ou-g", note: "Manual of PCI case 23: atherectomy regret." },
        {
          kind: "keypoints",
          items: [
            "Imaging at every step: calcified lesions can look expanded but have a small lumen.",
            "Modified balloons: focused force but harder to deliver; cutting balloon slowly, at most 12 atm (14 atm in 23.2.3).",
            "Atherectomy: weigh tortuosity, thrombus, dissection and grafts; RASER for lesions resisting both.",
            "In-stent atherectomy is a late step: embolisation, entrapment, stent damage, more restenosis; no orbital in recent stents; larger burrs (1.75 mm or more).",
            "Laser: 0.9 mm, 80 Hz, 80 mJ/mm²; contrast only inside a stent; retest with a high-pressure balloon.",
            "Subintimal crossing, then CABG; leaving the lesion untreated raises thrombosis and restenosis.",
            "Lithotripsy and the very-high-pressure balloon (usually 30–35 atm, capable of over 40) were future techniques in 2020; lithotripsy is now an established option, included in the 2023 EAPCI consensus (cp-calcium).",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-uncrossable-q1",
      stem: "Which definition matches Brilakis's balloon-uncrossable lesion?",
      options: [
        "A lesion that no guidewire can cross despite microcatheter support",
        "A lesion crossed by the wire that no balloon can then be advanced through",
        "A lesion that will not expand despite repeated high-pressure balloon inflations",
        "A lesion that a stent will not cross after successful balloon predilatation",
      ],
      answer: 1,
      explanation:
        "Balloon-uncrossable means the guidewire is across but a balloon cannot be advanced through the lesion (23.1). A lesion that will not expand despite high-pressure inflation is balloon-undilatable (23.2); failure to wire is a different problem, and a stent failing after predilatation is a delivery problem.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q2",
      stem: "For crossing a balloon-uncrossable lesion, what is the reason Brilakis gives for choosing a long (20–30 mm) small balloon?",
      options: [
        "Longer balloons have a stiffer shaft, so they can be pushed much harder into the lesion",
        "Longer balloons are less likely to slip forward or backward when inflated in the lesion",
        "Longer balloons can be rotated many more turns without binding onto the guidewire",
        "It is thickest at its central marker, so a long one's thin front segment gets in first",
      ],
      answer: 3,
      explanation:
        "Small balloons are thickest at their single, central marker; with a long balloon the thinner leading segment can enter further into the lesion before the bulky marker reaches the resistant part. Melon-seeding is a reason for longer balloons during inflation, not crossing; rotation is limited to two or three turns each way whatever the length.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q3",
      stem: "During grenadoplasty the indeflator needle suddenly drops. What should you do first?",
      options: [
        "Look at the screen to confirm the rupture before touching the inflation device",
        "Apply suction through the inflation device at once to deflate the balloon",
        "Re-inflate quickly to complete the dilatation before the balloon collapses",
        "Inject contrast through the guide to see where the balloon contrast has gone",
      ],
      answer: 1,
      explanation:
        "Brilakis applies suction through the inflation device as soon as the balloon ruptures, to avoid barotrauma, and recommends watching the indeflator rather than the screen precisely so that deflation is immediate, reducing pinhole contrast injury. Confirming on screen first wastes the seconds that matter; re-inflating a ruptured balloon jets more contrast into the wall.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q4",
      stem: "You are using a plaque modification microcatheter made of eight stranded stainless-steel wires. Which handling is correct?",
      options: [
        "Counterclockwise to advance, at most 20 turns one way, and no contrast through it",
        "Clockwise to advance, and inject contrast through it to check where its tip lies",
        "Turn it in either direction as needed, because it is braided for two-way torque",
        "Push it without any rotation, because its threads advance it as the heart beats",
      ],
      answer: 0,
      explanation:
        "This design advances with counterclockwise rotation and is withdrawn clockwise; it has no inner polymer, so contrast cannot be injected through it; and more than 20 rotations in one direction risk kinking and unravelling (30.6.5; 23.1.4 gives 10 turns before unwinding for microcatheters generally). The threaded coil designs of another maker turn the opposite way, clockwise to advance.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q5",
      stem: "In a retrospective comparison cited by Brilakis in balloon-uncrossable CTOs, how did seesaw wire-cutting compare with a plaque modification microcatheter?",
      options: [
        "Lower device success but fewer complications, so it is kept for unstable patients",
        "Similar success, but much longer procedures because of repeated balloon exchanges",
        "Higher device and procedural success, shorter procedures, similar complications",
        "Higher success, but significantly more coronary dissections and more tamponade",
      ],
      answer: 2,
      explanation:
        "In Xue 2017 (80 patients), seesaw wire-cutting had higher device success (87.5% against 45.0%) and procedural success (92.5% against 72.5%), shorter procedures (about 91 against 142 minutes) and no difference in complications. Its main hazard in Brilakis's account is the guide being dragged deep as the cutting wire is withdrawn.",
      difficulty: 2,
      refs: [...BRILAKIS, "xue-seesaw-2017"],
    },
    {
      id: "cp-uncrossable-q6",
      stem: "A microcatheter will not cross a heavily calcified LAD lesion that a workhorse wire has crossed after a long effort. Which device lets you modify the lesion without giving up that wire?",
      options: [
        "Rotational atherectomy, because the burr runs over any 0.014 in. coronary wire",
        "Orbital atherectomy, because its crown runs over the existing workhorse wire",
        "Excimer laser, because the catheter runs over any standard 0.014 in. wire",
        "A cutting balloon, because its blades cross lesions that other balloons cannot",
      ],
      answer: 2,
      explanation:
        "Laser is increasingly used for uncrossable lesions partly because it runs over any standard 0.014 in. wire, whereas rotational and orbital atherectomy need dedicated wires that may be impossible to place when nothing crosses (Brilakis 23.1.6; Oxford names laser as the alternative when a microcatheter cannot cross). Cutting balloons are less deliverable than standard balloons.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-uncrossable-q7",
      stem: "Which statement about inchworming a guide extension is correct?",
      options: [
        "The balloon is inflated at rated burst pressure entirely beyond the extension's tip",
        "The extension and the inflated balloon are pushed forward together at nominal pressure",
        "It needs a second wire and a distal balloon to pin the first wire before each advance",
        "A 2.0 mm balloon straddles the tip at 6–8 atm; the extension advances as it deflates",
      ],
      answer: 3,
      explanation:
        "Inchworming places a small balloon (usually 2.0 mm) half in and half out of the extension's tip, inflates it at low pressure (6–8 atm), and advances the extension as it deflates; Fig. 30.28 shows one cycle, which can be repeated if needed. Pushing extension and inflated balloon together at nominal pressure is guide extension balloon-assisted tracking; pinning with a second wire is the distal anchor technique. Brilakis prefers inchworming because it centres the extension.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q8",
      stem: "A balloon-undilatable lesion lies inside a stent implanted earlier in the same procedure. High-pressure inflations with two buddy wires and a scoring balloon have failed. Which sequence follows Brilakis's 2020 in-stent algorithm?",
      options: [
        "Orbital atherectomy, then laser, then subintimal crossing, then CABG if all fail",
        "Rotational atherectomy with a 1.25 mm burr, then laser, then CABG if all fail",
        "Laser (with contrast), then atherectomy, then subintimal crossing, then CABG",
        "A second stent, then high-pressure post-dilatation, then intravascular imaging",
      ],
      answer: 2,
      explanation:
        "Inside a stent, laser comes before atherectomy and may be fired with contrast; atherectomy follows, then subintimal crossing and CABG. Orbital atherectomy is avoided in recently implanted stents, and for an undilatable stent Brilakis uses larger burrs (1.75 mm or more) selectively to avoid entrapment, not the smallest. Adding a stent does not treat an undilatable lesion. In current practice lithotripsy, where its balloon crosses, is also an option at this point (2023 EAPCI consensus; see cp-calcium).",
      difficulty: 3,
      refs: [...BRILAKIS, "barbato-calcium-consensus-2023"],
    },
    {
      id: "cp-uncrossable-q9",
      stem: "Which set of measures best reflects Brilakis's high-pressure balloon technique for an undilatable de novo lesion?",
      options: [
        "Size 1:1 or 0.5 mm smaller, 30–60 s or cycled pressure, a shorter balloon, buddy wires",
        "Oversize by 0.5 mm, use short inflations, and choose a compliant balloon for more radial force",
        "Size 1:1, inflate beyond the rated burst pressure, and then stent as soon as the waist eases",
        "Use the longest balloon available so that the force is spread across the whole calcified segment",
      ],
      answer: 0,
      explanation:
        "Brilakis advises conservative sizing (1:1 or less, often about 0.5 mm undersized), prolonged inflation (30–60 seconds or more) or rapid pressure cycling, shorter balloons to concentrate force, two balloons side by side, and buddy wires. Oversizing invites perforation, a longer balloon spreads the force, and pressures beyond the rating invite rupture.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-uncrossable-q10",
      stem: "A 3.5 mm NC balloon ruptures at 24 atm in a calcified mid-RCA lesion. After suction, removal of the balloon and aspiration of the guide, what is the essential next step?",
      options: [
        "Deploy the planned stent at once, because the rupture has probably cracked the calcium",
        "Immediate angiography for perforation, air embolism or a flow-limiting dissection",
        "Repeat the inflation with a new balloon of the same size at a higher pressure",
        "Reverse the heparin with protamine in case a perforation has occurred",
      ],
      answer: 1,
      explanation:
        "After balloon rupture Brilakis applies suction at once, removes the balloon and aspirates the guide to clear any air that entered (9.7.9), then performs immediate angiography to look for perforation, air embolism or a flow-limiting dissection, and treats what is found (a perforation first with a balloon to stop bleeding). Stenting blind, repeating at higher pressure, or reversing anticoagulation before knowing whether there is a perforation are all premature.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-uncrossable-q11",
      stem: "In Brilakis's de novo algorithm, a heavily calcified lesion is judged unlikely to respond to a balloon, but the vessel is very tortuous and contains a dissection. Where does the algorithm send you?",
      options: [
        "Straight to rotational atherectomy, because heavy calcium overrides other features",
        "To high-pressure and modified balloons, then to laser if they fail",
        "Straight to CABG, because atherectomy cannot be used and balloons will fail",
        "To orbital atherectomy, because its sideways cutting is safer in tortuous vessels",
      ],
      answer: 1,
      explanation:
        "Tortuosity (a relative contraindication), thrombus, dissection and grafts make atherectomy riskier, so the lesion is unsuitable for atherectomy; Fig. 23.7 then routes it to the balloon steps if they have not been tried, and to laser if they have failed, before subintimal crossing and CABG. The Oxford handbook also lists severe tortuosity and dissection as contraindications to rotational atherectomy. Laser is not risk-free here either: Brilakis warns that laser perforation is more likely in tortuous vessels, so lase with saline, and image after each step.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-uncrossable-q12",
      stem: "Which is a recognised complication of a guide extension that the operator can prevent by holding the push rod?",
      options: [
        "Wrapping of the guidewire around the push rod during balloon delivery",
        "Ejection of the extension into the vessel during a forceful injection",
        "Deformation of a stent as it passes the extension's proximal collar",
        "Thrombus formation because the lumen is 1–2 Fr smaller than the guide",
      ],
      answer: 1,
      explanation:
        "Brilakis advises holding the push rod during forceful contrast injection to keep the extension from being ejected into the vessel. Wire wrap is prevented by laying the rod under a towel; stent deformation at the collar by careful, fluoroscopically watched advancement or loading outside the body; and thrombus by watching damping and the ACT.",
      difficulty: 1,
      refs: BRILAKIS,
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Treat a balloon-undilatable calcified lesion: size a non-compliant balloon 1:1 or about 0.5 mm smaller, inflate within its rating for 30–60 seconds, try a shorter balloon and pressure cycling, and do not stent until a high-pressure balloon has fully expanded the lesion on imaging.",
    },
  ],
  caseIds: ["cp-uncrossable-case-rca", "cp-uncrossable-case-lad"],
};

export const cases: CaseStudy[] = [
  {
    id: "cp-uncrossable-case-rca",
    title: "Nothing follows the wire: a balloon-uncrossable right coronary artery",
    trackId: "complex-pci",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 23.1 (balloon-uncrossable lesions, Fig. 23.1), 30.3 (guide extensions, inchworming) and 30.11 (laser)" },
    summary: "A heavily calcified mid-RCA lesion that a workhorse wire crosses but no balloon will follow, worked through Brilakis's uncrossable algorithm: small balloons, grenadoplasty, support with an inchwormed guide extension, a microcatheter, and laser.",
    presentation:
      "A 72-year-old man with diabetes and class III angina despite medical therapy has a 95% heavily calcified mid-RCA stenosis (reference 3.0 mm) in a dominant RCA; LVEF 55%. You are working from the right femoral artery with a 7 Fr AL1 guide. A workhorse wire has crossed into the distal RCA after some effort. Blood pressure 132/74 mmHg, heart rate 68/min, ACT 290 s.",
    findings: [
      "Dense calcium on both walls of the mid-RCA before contrast.",
      "Workhorse wire in the distal posterior descending artery.",
      "A 1.5 mm × 12 mm compliant balloon stops at the proximal edge of the lesion.",
      "Moderate proximal tortuosity; the guide sits coaxially.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The 1.5 mm × 12 mm balloon stops at the lesion. What do you do next?",
        options: [
          {
            text: "Change to a new 1.0 mm compliant rapid-exchange balloon, 20 mm long",
            best: true,
            feedback: "Right. The lowest-profile balloon is Brilakis's first choice, and a long one lets the thin segment ahead of the central marker penetrate before the bulky part arrives.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the 1.5 mm balloon hard while the assistant pushes the guide forward",
            feedback: "Force is the wrong lever. The guide prolapses out of the RCA, the wire is dragged back towards the lesion, and the distal wire tip see-saws in the PDA.",
            stateDelta: { stability: -15, flags: ["forced-push"] },
            next: "c-forced",
          },
          {
            text: "Change to a 2.5 mm non-compliant balloon, which is stiffer and will push better",
            feedback: "Non-compliant balloons are less deliverable than compliant ones. A 2.5–3.0 mm balloon can be used just proximal to the lesion to disrupt its entry, but it is not the first step.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-forced",
        kind: "consequence",
        prompt: "The guide has backed out of the ostium and the wire tip now lies just beyond the lesion. What now?",
        info: "The trace is normal. A gentle test injection from the sinus shows no ostial dissection.",
        options: [
          {
            text: "Withdraw the balloon, re-engage the guide coaxially, re-advance the wire to the distal vessel, and change the balloon",
            best: true,
            feedback: "Correct. Re-establish guide and wire position before anything else; then use the first line properly with a new low-profile balloon.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Leave the wire where it is and keep pushing the balloon",
            feedback: "A wire tip just beyond the lesion gives almost no support and can be lost entirely, leaving an injured, unwired lesion. Re-establish position first.",
            stateDelta: { stability: -10, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The 1.0 mm balloon also stalls. You inflate it in place at 10 atm while pushing (balloon wedge) without success. Next?",
        options: [
          {
            text: "Grenadoplasty: advance a fresh, air-free 1.2 mm balloon as deep as possible and inflate it until it ruptures, watching the indeflator",
            best: true,
            feedback: "Right: the second element of the first line. Small (1.0–1.5 mm), meticulously prepared, as deep as possible; aspirate the moment it ruptures.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Rotate the 1.0 mm balloon ten full turns clockwise to screw it into the lesion",
            feedback: "Brilakis limits balloon rotation to two or three turns in each direction; more and the balloon binds onto the wire, which may then have to come out with it.",
            stateDelta: { stability: -10, flags: ["balloon-bound"] },
            next: "c-bound",
          },
          {
            text: "Grenadoplasty with a 2.5 mm balloon, which will disrupt more plaque when it bursts",
            feedback: "Balloons of 2.0 mm or more must not be used for grenadoplasty: the rupture of a larger balloon can dissect or perforate the proximal vessel.",
            stateDelta: { stability: -20, flags: ["big-grenade"] },
            next: "c-big-grenade",
          },
        ],
      },
      {
        id: "c-bound",
        kind: "consequence",
        prompt: "The balloon is now stuck to the wire and both move together. What do you do?",
        options: [
          {
            text: "Withdraw both together, then rewire the RCA, accepting the lost position",
            best: true,
            feedback: "If they cannot be separated, both may have to come out, as Brilakis describes for a ruptured balloon tangled with the wire (23.1.2); rewiring is the price. Next time, limit rotation to two or three turns each way.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Keep torquing the balloon in the other direction to free it",
            feedback: "More torque deforms the shaft and wire further. Remove both and rewire.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-big-grenade",
        kind: "consequence",
        prompt: "The 2.5 mm balloon ruptures at 18 atm. A contrast stain appears outside the proximal RCA wall. What now?",
        info: "Blood pressure 118/70 mmHg; no pericardial effusion yet on echocardiography.",
        options: [
          {
            text: "Aspirate the balloon, remove it, and inflate a balloon proximal to the leak to stop bleeding while you assess and prepare treatment",
            best: true,
            feedback: "Correct first moves for a perforation: stop the bleeding with a balloon, then assess and treat it (cm-perforation). The cause was a balloon too large for grenadoplasty.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Ignore the stain and continue with the next balloon",
            feedback: "A stain outside the wall after rupture is a perforation until proven otherwise; it needs immediate control.",
            stateDelta: { stability: -20, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After grenadoplasty a new 1.0 mm balloon still will not cross, and each push makes the AL1 back out. What is the second line?",
        options: [
          {
            text: "Add support without losing the wire: deliver a guide extension into the proximal RCA by inchworming",
            best: true,
            feedback: "Right. Support is the second line, and building it around the crossed wire avoids a risky guide exchange.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Exchange the AL1 for an 8 Fr guide over the wire",
            acceptable: true,
            feedback: "More support, but Brilakis warns that changing the guide after the wire has crossed can lose the wire; building support around the current set-up is safer.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Push the guide extension into the RCA directly over the bare wire",
            feedback: "An extension edge riding a bare wire can catch the calcified plaque and dissect the proximal RCA. Deliver it over a balloon (inchworming).",
            stateDelta: { stability: -15, flags: ["extension-dissection"] },
            next: "c-ext-dissection",
          },
        ],
      },
      {
        id: "c-ext-dissection",
        kind: "consequence",
        prompt: "The pressure has damped and a linear filling defect is suspected in the proximal RCA. What do you do?",
        options: [
          {
            text: "Do not inject through the wedged extension; pull it back until the pressure recovers, then assess with a gentle injection",
            best: true,
            feedback: "Correct. Injecting through a wedged extension risks hydraulic dissection that can spread forwards or back into the aorta.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Inject forcefully through the extension to define the dissection",
            feedback: "A forceful injection with a damped trace can propagate the dissection antegradely or retrogradely into the aortic root.",
            stateDelta: { stability: -20, flags: ["aortocoronary-dissection"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "How do you inchworm the extension forward?",
        options: [
          {
            text: "Extension to the guide tip, 2.0 mm balloon half in and half out, inflate at 6–8 atm, advance the extension as it deflates, repeat if needed",
            best: true,
            feedback: "That is the sequence in Fig. 30.28; the balloon centres the extension, which you advance as it deflates, and centring is why Brilakis prefers it.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inflate the balloon at rated burst pressure fully beyond the extension and pull the wire back to tension it",
            feedback: "High pressure in diseased vessel and pulling back the wire both add risk; inchworming uses low pressure with the balloon straddling the extension's tip.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The extension sits just proximal to the lesion, but the 1.0 mm balloon still will not cross. A microcatheter is available. How do you use it?",
        options: [
          {
            text: "Advance it with the wire inside, turning in bursts of up to about 10 turns and letting it unwind, watching the guide and the distal wire",
            best: true,
            feedback: "Right. Advancing a microcatheter through the lesion can modify it; bursts of rotation and a wire inside protect it from kinking, fracture and entrapment.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Spin the very low-profile braided microcatheter continuously at full force",
            feedback: "That design is not built for aggressive torque; Brilakis advises against it in uncrossable lesions because the tip can fracture and separate.",
            stateDelta: { stability: -15, flags: ["tip-fracture"] },
            next: "c-tip",
          },
        ],
      },
      {
        id: "c-tip",
        kind: "consequence",
        prompt: "The microcatheter suddenly moves freely and its radiopaque tip has stayed in the lesion. What is the safest next move?",
        info: "The wire is still across, through the detached tip; flow is preserved.",
        options: [
          {
            text: "Keep the wire in place, stop torquing, and plan retrieval or treatment of the fragment as an entrapped-equipment problem",
            best: true,
            feedback: "Right. Keep the wire across: it is your access for whatever follows (retrieval techniques are taught in cm-equipment-loss). Choosing a microcatheter designed for torque, used in bursts, would have avoided it.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Pull the wire out so that a fresh wire can be advanced alongside the fragment",
            feedback: "Removing the wire throws away access through the fragment and the lesion; keep it.",
            stateDelta: { stability: -10, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The microcatheter will not cross either. The laser console has been warming up since the grenadoplasty. What next?",
        info: "The workhorse wire is still in the distal PDA; the vessel is not stented.",
        options: [
          {
            text: "Laser with the 0.9 mm catheter over the existing wire at 80 Hz and 80 mJ/mm², during saline flushing, then retry a small balloon",
            best: true,
            feedback: "Right. Laser keeps the hard-won wire, and saline (not contrast) is used because the segment is not stented.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Laser while injecting contrast through the guide, for maximum plaque modification",
            feedback: "Lasing with contrast greatly increases plaque modification but also the risk of dissection and perforation; Brilakis keeps it for lesions inside stents.",
            stateDelta: { stability: -15, flags: ["laser-contrast"] },
            next: "c-laser",
          },
          {
            text: "Bury the microcatheter as deep into the lesion as it goes, then exchange for the rotational atherectomy wire through it",
            acceptable: true,
            feedback: "A valid fourth-line route (23.1.7), though the new wire may fail to recross. Laser keeps the wire you already have and is ready, so it is the better first choice here.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Pull the wire and try to wire the lesion directly with the rotational atherectomy wire",
            feedback: "Direct wiring with the atherectomy wire is practically difficult (Oxford), and losing the wire you have may mean never recrossing. Bury a microcatheter and exchange through it, or use laser over the existing wire.",
            stateDelta: { stability: -10, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "c-laser",
        kind: "consequence",
        prompt: "After lasing with contrast, a spiral dissection appears in the mid-RCA, with TIMI 3 flow. What now?",
        options: [
          {
            text: "Keep the wire in the true lumen, confirm its position, and plan to cover the dissection with stents once the lesion is prepared",
            best: true,
            feedback: "Right: the wire across the dissection is what allows it to be stented (acute closure and dissection are taught in cm-principles-closure). Lasing with contrast is kept for lesions inside stents for exactly this reason.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Inject forcefully through the guide to define the dissection fully",
            feedback: "Forceful injections can extend a dissection; small, careful injections and imaging are safer.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "After lasing, a 1.0 mm and then a 2.0 mm balloon cross. How do you continue?",
        options: [
          {
            text: "Treat the lesion as potentially undilatable: 1:1 non-compliant balloon at high pressure and imaging before any stent",
            best: true,
            feedback: "Right. Uncrossable lesions are often undilatable too; the stent waits until a 1:1 balloon has fully expanded the lesion.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent directly now that a 2.0 mm balloon has crossed",
            feedback: "Crossing is not expansion. Stenting a heavily calcified lesion without proving expansion risks an underexpanded stent.",
            stateDelta: { stability: -10, flags: ["underexpanded"] },
          },
        ],
      },
    ],
    outcome:
      "After laser the lesion was predilated, a 3.0 mm non-compliant balloon expanded fully at high pressure, and the RCA was stented and post-dilated with a good result on imaging.",
    outcomeVariants: [
      { flag: "forced-push", text: "The early forceful push cost guide and wire position, which had to be rebuilt." },
      { flag: "wire-lost", text: "The wire was lost and the RCA had to be rewired across an injured lesion." },
      { flag: "balloon-bound", text: "Over-rotation bound the balloon to the wire, and both had to be removed." },
      { flag: "big-grenade", text: "Grenadoplasty with an oversized balloon caused a perforation that needed balloon tamponade and treatment." },
      { flag: "perforation", text: "The perforation was not controlled promptly and progressed." },
      { flag: "extension-dissection", text: "Pushing the extension over a bare wire dissected the proximal RCA, which needed stenting." },
      { flag: "aortocoronary-dissection", text: "Injection through the wedged extension extended the dissection towards the aortic root." },
      { flag: "tip-fracture", text: "The microcatheter tip fractured in the lesion and had to be dealt with before the procedure could continue." },
      { flag: "laser-contrast", text: "Lasing with contrast in an unstented segment caused a dissection." },
      { flag: "underexpanded", text: "The stent was underexpanded on imaging and needed high-pressure post-dilatation." },
    ],
    learningPoints: [
      "Uncrossable: wire across, no balloon follows; escalate by line, not by force.",
      "First line: long, low-profile (1.0 mm) compliant balloon; balloon wedge; two or three turns each way at most; grenadoplasty with 1.0–1.5 mm only.",
      "Second line: add support around the crossed wire; deliver extensions by inchworming, not over the bare wire; never inject when wedged.",
      "Third line: microcatheter with a wire inside, turned in bursts; know which designs tolerate torque.",
      "Fourth line: laser over the existing wire (saline in native vessels; contrast only inside stents), or atherectomy after a wire exchange.",
      "An uncrossable lesion is often undilatable: prove expansion before stenting.",
    ],
    refs: BRILAKIS,
  },
  {
    id: "cp-uncrossable-case-lad",
    title: "A waist that will not go: a balloon-undilatable de novo LAD lesion",
    trackId: "complex-pci",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 23.2 (balloon-undilatable lesions, Fig. 23.7 de novo pathway), 19.9 and 30.9; Oxford handbook, chapter 8, Angioplasty balloons" },
    summary: "A calcified proximal LAD lesion that a 1:1 non-compliant balloon will not open, treated through the de novo undilatable algorithm: imaging, high-pressure technique, a scoring balloon, a balloon rupture, and rotational atherectomy before stenting.",
    presentation:
      "A 66-year-old woman with stable angina and an anterior ischaemic territory on stress imaging has a severe, calcified proximal LAD stenosis (reference 3.0 mm, lesion 14 mm). Access is right radial with a 7 Fr extra-backup guide; a workhorse wire is in the distal LAD and a 2.0 mm balloon has crossed. Blood pressure 140/78 mmHg, heart rate 72/min.",
    findings: [
      "Angiographic calcium on both walls of the proximal LAD.",
      "A 3.0 mm non-compliant balloon keeps a tight waist at 18 atm.",
      "No previous stent in the LAD.",
      "No thrombus, dissection or marked tortuosity.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The 3.0 mm NC balloon keeps a waist at 18 atm. What do you do now?",
        options: [
          {
            text: "Do not stent; image the lesion to see whether it is likely to respond to balloons",
            best: true,
            feedback: "Right. A persistent waist means a balloon-undilatable lesion, and the de novo algorithm opens with the question imaging answers best: is it likely to respond to a balloon?",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance a 3.0 mm drug-eluting stent to deploy at 20 atm; the stent's radial force will finish the job",
            feedback: "Brilakis is explicit that stents must not be implanted in undilatable lesions; the Oxford handbook warns that a resistant lesion is very hard to crack once a stent is in.",
            stateDelta: { stability: -10, flags: ["stented-early"] },
            next: "c-stented",
          },
          {
            text: "Exchange for a 3.5 mm NC balloon, oversized to deliver more force",
            feedback: "Oversizing in calcium is the classic route to perforation; Brilakis sizes 1:1 or smaller.",
            stateDelta: { stability: -15, flags: ["oversized"] },
          },
        ],
      },
      {
        id: "c-stented",
        kind: "consequence",
        prompt: "The supervising consultant stops you with the stent at the guide tip. Why would deploying it now be a mistake?",
        options: [
          {
            text: "Because the stent would be underexpanded across the waist, and fixing an underexpanded stent is far harder; it also changes the treatment to the in-stent pathway, where orbital atherectomy is ruled out in a fresh stent",
            best: true,
            feedback: "Correct. Underexpansion predisposes to stent thrombosis and restenosis, and treatment options narrow once the stent is in. You withdraw the stent and return to preparing the lesion.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Only because the stent may not cross; if it crosses, deploying it is acceptable",
            feedback: "Crossing is not the issue. A stent cannot open what a 1:1 non-compliant balloon could not; the lesion has to be modified first.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "OCT shows a calcium arc of 200°, maximum thickness 0.6 mm, length 8 mm, mostly superficial. The vessel is not tortuous and has no thrombus or dissection. How do you read this?",
        options: [
          {
            text: "All three OCT features linked to underexpansion are present: unlikely to respond to balloons, and suitable for atherectomy",
            best: true,
            feedback: "Right. Arc over 180°, thickness over 0.5 mm and length over 5 mm predict underexpansion; with no tortuosity, thrombus, dissection or graft, the de novo algorithm goes to atherectomy.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Likely to respond: try high-pressure balloon technique first",
            acceptable: true,
            feedback: "Reasonable if imaging were less severe. Here every OCT predictor is present, so Fig. 23.7 sends you towards atherectomy; you may still try the high-pressure measures, accepting they will probably fail.",
            stateDelta: { stability: 0 },
            next: "c-hp",
          },
        ],
      },
      {
        id: "c-hp",
        kind: "consequence",
        prompt: "You try a shorter 3.0 mm NC balloon at its rated burst pressure for 45 seconds with a buddy wire. The waist persists, and the balloon ruptures as you cycle the pressure. What first?",
        options: [
          {
            text: "Apply suction, remove the balloon, aspirate the guide, and perform immediate angiography for perforation, air or a flow-limiting dissection",
            best: true,
            feedback: "Correct. After rupture, look at once. Here there is a small non-flow-limiting dissection and no perforation; the lesion is still undilatable, and atherectomy is next.",
            stateDelta: { stability: 0, flags: ["rupture"] },
          },
          {
            text: "Insert another NC balloon and inflate it to 28 atm straight away",
            feedback: "First find out what the rupture did. Repeating at higher pressure in an unassessed vessel risks turning a dissection into a perforation.",
            stateDelta: { stability: -15, flags: ["rupture", "perforation"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "You plan rotational atherectomy. How do you get the dedicated atherectomy wire across?",
        options: [
          {
            text: "Advance a microcatheter over the workhorse wire through the lesion and exchange through it",
            best: true,
            feedback: "Right. The 2.0 mm balloon crossed, so a microcatheter should too; exchanging through it keeps access across the lesion.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull the workhorse wire and wire the LAD directly with the atherectomy wire",
            feedback: "Direct wiring with the atherectomy wire is difficult (Oxford) and risks losing access to the lesion. Exchange through a microcatheter.",
            stateDelta: { stability: -10, flags: ["access-lost"] },
            next: "c-access",
          },
        ],
      },
      {
        id: "c-access",
        kind: "consequence",
        prompt: "The atherectomy wire keeps entering a diagonal and will not go down the LAD. How do you recover?",
        options: [
          {
            text: "Recross the LAD with a workhorse wire, advance a microcatheter over it, and exchange for the atherectomy wire through the microcatheter",
            best: true,
            feedback: "Right. Exchange through a microcatheter is the dependable way to place an atherectomy wire.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Run the burr over the workhorse wire instead",
            feedback: "Rotational atherectomy must only be performed over its dedicated wire.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Atherectomy is done. What do you do before stenting?",
        options: [
          {
            text: "Exchange the atherectomy wire for a workhorse wire, then a 1:1 NC balloon at high pressure to confirm full expansion, then image",
            best: true,
            feedback: "Right. Brilakis replaces the atherectomy wire with a workhorse wire, which is easier to work on, and always follows atherectomy with a 1:1 non-compliant balloon to show the lesion now expands; imaging confirms the lumen.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent directly; atherectomy guarantees expansion",
            feedback: "It does not. If the 1:1 balloon still does not expand, repeat atherectomy or use other treatments such as plaque modification balloons first.",
            stateDelta: { stability: -10, flags: ["underexpanded"] },
            next: "c-underexp",
          },
          {
            text: "Laser with contrast to finish the modification",
            feedback: "Lasing with contrast in a native, unstented LAD risks dissection and perforation; it is reserved for underexpanded stents.",
            stateDelta: { stability: -15, flags: ["laser-contrast"] },
          },
        ],
      },
      {
        id: "c-underexp",
        kind: "consequence",
        prompt: "OCT shows the stent underexpanded over the calcified segment. What is the first step?",
        options: [
          {
            text: "High-pressure inflations with a 1:1 non-compliant balloon, with buddy wires if needed, then the in-stent pathway if it still fails",
            best: true,
            feedback: "Right: the in-stent algorithm starts with high-pressure balloon technique; laser comes before any further atherectomy, and orbital atherectomy is avoided in this fresh stent.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Orbital atherectomy through the new stent",
            feedback: "Orbital atherectomy should not be performed in recently implanted stents.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The NC balloon now expands fully and OCT shows calcium fractures. How do you finish?",
        options: [
          {
            text: "Stent covering every ballooned segment, post-dilate with a 1:1 NC balloon at high pressure, and confirm expansion on OCT",
            best: true,
            feedback: "Right. Cover all ballooned segments to avoid geographic miss, post-dilate at high pressure and check with imaging, since calcified lesions can look expanded yet have a small lumen.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A short stent over the tightest point only, leaving the rest of the ballooned segment unstented",
            feedback: "Brilakis asks that all ballooned segments be covered by stents to reduce the risk of restenosis from geographic miss.",
            stateDelta: { stability: -5, flags: ["geographic-miss"] },
          },
        ],
      },
    ],
    outcome:
      "After rotational atherectomy a 1:1 non-compliant balloon expanded fully, and the LAD was stented, post-dilated and confirmed well expanded on OCT.",
    outcomeVariants: [
      { flag: "stented-early", text: "A stent was nearly deployed before the lesion had been expanded; had it been, the underexpanded stent would have needed the harder in-stent pathway." },
      { flag: "oversized", text: "The oversized balloon raised the risk of perforation without solving the calcium." },
      { flag: "rupture", text: "A balloon ruptured during high-pressure inflation; immediate angiography guided what followed." },
      { flag: "perforation", text: "A perforation followed a further high-pressure inflation in an unassessed vessel and needed treatment." },
      { flag: "access-lost", text: "Access across the lesion was lost while wiring directly with the atherectomy wire, and the LAD had to be recrossed." },
      { flag: "underexpanded", text: "The stent was underexpanded on imaging and needed further high-pressure dilatation." },
      { flag: "laser-contrast", text: "Lasing with contrast in the native LAD caused a dissection." },
      { flag: "geographic-miss", text: "An unstented ballooned segment was left at risk of restenosis." },
    ],
    learningPoints: [
      "A waist that persists on a 1:1 NC balloon means do not stent.",
      "De novo pathway: is it likely to respond to a balloon? Imaging decides; then suitability for atherectomy.",
      "High-pressure technique: 1:1 or smaller, longer or cycled inflations, shorter balloons, buddy wires; after any rupture, angiography at once.",
      "Atherectomy wire via a microcatheter exchange, not direct wiring.",
      "After atherectomy, prove expansion with a 1:1 NC balloon, stent all ballooned segments, post-dilate and image.",
    ],
    refs: BOOKS,
  },
];

export const tips: LabTip[] = [
  {
    id: "pci-unx-small-long-balloon",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "First balloon: the smallest profile, and long",
    text: "Open the lowest-profile balloon you have (1.0 mm), compliant, rapid exchange, single marker, 20–30 mm long. Its thickest point is the central marker, so a long balloon lets the thin front segment burrow in first. A new balloon tracks better than a used one.",
    tone: "do",
    lessonId: "cp-uncrossable-first-line",
    sources: [B("23.1"), B("9.7"), B("30.9")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-balloon-wedge",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Stalled balloon: wedge it, then refresh it",
    text: "Inflate the stalled balloon where it sits while keeping forward pressure; it may open the entry. Rotate no more than two or three turns each way, or it binds to the wire. An inflated balloon has lost its profile: rewrap it under vacuum or use a new one, perhaps from another maker.",
    tone: "do",
    lessonId: "cp-uncrossable-first-line",
    sources: [B("23.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-watch-distal-tip",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["balloon-uncrossable", "guide-backout"] },
    title: "Every push moves the wire tip too",
    text: "Each push and pull on a stuck balloon see-saws the distal wire, which can dissect or perforate the distal vessel, especially with a stiff or polymer-jacketed wire. Watch the tip and the guide together, and stop as soon as either moves; vigorous to-and-fro movement can also tear a diseased ostium.",
    tone: "caution",
    lessonId: "cp-uncrossable-first-line",
    sources: [B("23.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-grenadoplasty",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Grenadoplasty: small, air-free, watch the indeflator",
    text: "Use a 1.0–1.5 mm balloon, never 2.0 mm or larger, prepared free of air. Push it as deep into the lesion as it goes and inflate until it bursts, watching the indeflator rather than the screen, and aspirate the instant the pressure falls. Then try a new balloon; if the ruptured one tangles with the wire, both may have to come out.",
    tone: "do",
    lessonId: "cp-uncrossable-first-line",
    sources: [B("23.1")],
    refs: [...BRILAKIS, "vo-bam-2016"],
  },
  {
    id: "pci-unx-keep-the-wire",
    lab: "pci",
    when: { phase: ["lesion-prep", "guide"], event: ["balloon-uncrossable", "poor-guide-support"] },
    title: "Build support around the wire you have",
    text: "Changing the guide after a hard crossing can lose the wire. Add support around it instead: a guide extension, a side-branch anchor, or a second wire alongside the first (even through a second guide). A wave-shaped support wire is exchanged in through a microcatheter or over-the-wire balloon, not used to cross; hand-placed bends in a workhorse wire can mimic it.",
    tone: "caution",
    lessonId: "cp-uncrossable-support-microcatheter",
    sources: [B("23.1"), B("9.7"), B("30.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-microcatheter-turns",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["balloon-uncrossable", "microcatheter-needed"] },
    title: "Microcatheter at the lesion: wire inside, turns counted",
    text: "Keep a wire in the lumen whenever you torque. Turn in bursts of up to about 10, then let it unwind; the stranded-wire plaque modification type turns counterclockwise to advance (at most 20 turns one way), the threaded coil types clockwise. Do not torque a very low-profile braided microcatheter hard: its tip can fracture and stay in the lesion.",
    tone: "caution",
    lessonId: "cp-uncrossable-support-microcatheter",
    sources: [B("23.1"), B("30.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-microcatheter-across",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Microcatheter across: balloon, or swap the wire",
    text: "Once a microcatheter crosses, a small balloon often follows. If atherectomy is the plan, or more support is needed, use the microcatheter to exchange for the dedicated atherectomy wire or a support wire before removing it.",
    tone: "do",
    lessonId: "cp-uncrossable-support-microcatheter",
    sources: [B("23.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-wire-cutting",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Wire-cutting: pull the second wire past the inflated balloon",
    text: "With a second wire across, inflate a balloon in the proximal cap over the first wire and pull the second wire out while it is inflated, so it slices the cap; then try a new balloon. Watch the guide as you pull, because it can dive in and dissect the ostium; back it out promptly.",
    tone: "do",
    lessonId: "cp-uncrossable-support-microcatheter",
    sources: [B("23.1")],
    refs: [...BRILAKIS, "xue-seesaw-2017"],
  },
  {
    id: "pci-unx-bury-microcatheter",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Need the atherectomy wire across? Bury the microcatheter",
    text: "If nothing crosses, push a microcatheter as deep into the lesion as it will go, remove the original wire and rewire with the atherectomy wire through it. Rotational atherectomy may be preferred because it cuts end-on. Use a small burr (1.25–1.50 mm; the 1.5 mm may be less likely to become entrapped), and never force the burr into the lesion with a deceleration.",
    tone: "bailout",
    lessonId: "cp-uncrossable-ablation-subintimal",
    sources: [B("23.1"), B("19.9"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-unx-laser-contrast-stent-only",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-uncrossable", "balloon-undilatable", "stent-underexpanded"] },
    title: "Lasing with contrast belongs inside stents",
    text: "Lasing during contrast injection modifies plaque far more but raises the risk of dissection and perforation. Lase during saline flushing in native segments, and keep contrast for lesions inside previously deployed stents.",
    tone: "caution",
    lessonId: "cp-uncrossable-ablation-subintimal",
    sources: [B("23.1"), B("23.2"), B("30.11")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-subintimal-confirm",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable", "wire-subintimal"] },
    title: "Subintimal wire: prove where it is before ballooning",
    text: "Before inflating a balloon on a subintimal wire for external crush (usually 8–10 atm) or a distal anchor, confirm that the wire lies within the vessel architecture, not in a side branch or the pericardium, with contralateral injection in two orthogonal views. These are techniques for experienced CTO operators.",
    tone: "caution",
    lessonId: "cp-uncrossable-ablation-subintimal",
    sources: [B("23.1")],
    refs: [...BRILAKIS, "christopoulos-external-crush-2017", "michael-subintimal-anchor-2013"],
  },
  {
    id: "pci-unx-inchworm",
    lab: "pci",
    when: { phase: ["guide", "lesion-prep", "stent"], event: ["poor-guide-support", "balloon-uncrossable", "stent-uncrossable"] },
    title: "Inchworm the guide extension forward",
    text: "Take the extension to the guide tip, put a small balloon (usually 2.0 mm) half in and half out of its tip, inflate at 6–8 atm, then advance the extension as the balloon deflates; repeat if needed. The balloon centres the extension, so it is less likely to dissect than an extension pushed along a bare wire.",
    tone: "do",
    lessonId: "cp-uncrossable-extension-combined",
    sources: [B("30.3"), B("25")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-extension-collar",
    lab: "pci",
    when: { phase: ["guide", "lesion-prep", "stent"], event: ["poor-guide-support", "stent-uncrossable", "balloon-uncrossable"] },
    title: "Guide extension housekeeping",
    text: "Lay the push rod under a towel beside the Y-connector to prevent wire wrap, keep the proximal collar inside the guide, and hold the push rod during any forceful injection so the extension is not ejected. Watch for damping and keep the ACT in range: the extension narrows the lumen by 1–2 Fr.",
    tone: "caution",
    lessonId: "cp-uncrossable-extension-combined",
    sources: [B("30.3"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-extension-stent-at-collar",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable"] },
    title: "Stent meets the collar: watch it, do not force it",
    text: "If a stent resists at the extension's proximal collar, watch it on fluoroscopy, and consider loading it into the extension outside the body and inserting both together. A stent pulled back into the extension's tip after a failed delivery can be deformed: inspect it before reusing it.",
    tone: "caution",
    lessonId: "cp-uncrossable-extension-combined",
    sources: [B("30.3"), B("27")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-combine",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable", "poor-guide-support"] },
    title: "Support and modification at the same time",
    text: "When the guide backs out every time a device bites, combine: an anchor balloon while working a plaque modification microcatheter, or an anchor while lasing. Techniques can also be chained in sequence until one works.",
    tone: "do",
    lessonId: "cp-uncrossable-extension-combined",
    sources: [B("23.1")],
    refs: [...BRILAKIS, "kirtane-anchor-tornus-2007"],
  },
  {
    id: "pci-unx-undilatable-first-question",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable", "stent-underexpanded"] },
    title: "Undilatable: de novo or in-stent, and how recent?",
    text: "Image the lesion, then decide which algorithm applies. De novo: ask whether it is likely to respond to a balloon and whether atherectomy is suitable. In-stent: balloons, modified balloons, laser, then atherectomy; no orbital atherectomy in a recently implanted stent.",
    tone: "do",
    lessonId: "cp-uncrossable-undilatable-balloons",
    sources: [B("23.2")],
    refs: [...BRILAKIS, "fujino-calcium-2018"],
  },
  {
    id: "pci-unx-hp-balloon-technique",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"] },
    title: "High-pressure technique: size down, hold longer, concentrate",
    text: "Use a non-compliant balloon 1:1 or about 0.5 mm smaller at high pressure (Brilakis often 26–28 atm), only as far as that balloon's rated burst pressure allows, knowing chapter 9 links pressures above 20 atm to rupture; hold 30–60 seconds or cycled quickly up and down. A shorter balloon, two smaller balloons side by side, or buddy wires concentrate the force. Stent every segment you balloon.",
    tone: "do",
    lessonId: "cp-uncrossable-undilatable-balloons",
    sources: [B("23.2"), B("9.7"), O_BALLOONS],
    refs: BOOKS,
  },
  {
    id: "pci-unx-rupture-look",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable", "perforation", "air"] },
    title: "Balloon ruptured: look before anything else",
    text: "Apply suction at once, remove the balloon, aspirate the guide to clear any air, and take an immediate angiogram for perforation, air embolism or a flow-limiting dissection. If it has perforated, inflate a new balloon at or just proximal to the site at once; treat what you find before any further high-pressure inflation.",
    tone: "bailout",
    lessonId: "cp-uncrossable-undilatable-balloons",
    sources: [B("23.2"), B("19.9"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-sticky-balloon",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable"] },
    title: "After high pressure, remove the balloon under fluoroscopy",
    text: "Balloons often become sticky after high-pressure inflation and can drag the wire back as they come out. Withdraw them under fluoroscopy, holding the wire position.",
    tone: "caution",
    lessonId: "cp-uncrossable-undilatable-balloons",
    sources: [B("23.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-unx-laser-then-test",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable", "stent-underexpanded"] },
    title: "After laser, retest with a high-pressure balloon",
    text: "Use the 0.9 mm catheter, usually at 80 Hz and 80 mJ/mm², with saline (or contrast if inside an underexpanded stent). Then inflate a high-pressure non-compliant balloon to see whether the lesion now expands, and image the result.",
    tone: "do",
    lessonId: "cp-uncrossable-undilatable-beyond",
    sources: [B("23.2"), B("30.11")],
    refs: [...BRILAKIS, "latib-ellement-2014"],
  },
  {
    id: "pci-unx-cabg-last",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise", "finish"], event: ["balloon-undilatable", "stent-underexpanded"] },
    title: "When everything fails: surgery, not neglect",
    text: "If every step, subintimal crossing included, has failed, CABG may be needed. An undilatable lesion left as it is carries a higher risk of stent thrombosis and restenosis.",
    tone: "bailout",
    lessonId: "cp-uncrossable-undilatable-beyond",
    sources: [B("23.2")],
    refs: BRILAKIS,
  },
];

export const refs: Reference[] = [
  {
    id: "vo-bam-2016",
    kind: "paper",
    citation:
      "Vo MN, Christopoulos G, Karmpaliotis D, Lombardi WL, Grantham JA, Brilakis ES. Balloon-assisted microdissection “BAM” technique for balloon-uncrossable chronic total occlusions. J Invasive Cardiol. 2016;28:E37–E41.",
    note: "PMID: 27031940. Checked on PubMed: authors, title, journal, year 2016, volume 28, issue 4, pages E37–41. Abstract: 17 patients, procedural success 94%, BAM facilitated success in approximately one half, no major complication. Brilakis's reference 1 in chapter 23.",
    verified: true,
  },
  {
    id: "xue-seesaw-2017",
    kind: "paper",
    citation:
      "Xue J, Li J, Wang H, et al. “Seesaw balloon-wire cutting” technique is superior to Tornus catheter in balloon uncrossable chronic total occlusions. Int J Cardiol. 2017;228:523–527.",
    url: "https://doi.org/10.1016/j.ijcard.2016.10.107",
    note: "PMID: 27875729. Checked on PubMed: authors, title, journal, volume 228, pages 523–7 (electronic publication November 2016). Abstract: 80 patients (40 consecutive seesaw, 40 retrospectively matched Tornus); device success 87.5% vs 45.0%; procedural time 90.5 vs 141.5 min; procedural success 92.5% vs 72.5%; no difference in complications. Brilakis's reference 11 in chapter 23.",
    verified: true,
  },
  {
    id: "michael-subintimal-anchor-2013",
    kind: "case",
    citation:
      "Michael TT, Banerjee S, Brilakis ES. Subintimal distal anchor technique for “balloon-uncrossable” chronic total occlusions. J Invasive Cardiol. 2013;25:552–554.",
    note: "PMID: 24088432. Checked on PubMed: authors, title, journal, year 2013, volume 25, issue 10, pages 552–4. Brilakis's reference 20 in chapter 23.",
    verified: true,
  },
  {
    id: "christopoulos-external-crush-2017",
    kind: "case",
    citation:
      "Christopoulos G, Kotsia AP, Rangan BV, et al. “Subintimal external crush” technique for a “balloon uncrossable” chronic total occlusion. Cardiovasc Revasc Med. 2017;18:63–65.",
    url: "https://doi.org/10.1016/j.carrev.2016.06.004",
    note: "PMID: 27421955. Checked on PubMed: authors, title, journal, volume 18, issue 1, pages 63–65 (electronic publication June 2016). Brilakis's reference 19 in chapter 23.",
    verified: true,
  },
  {
    id: "vo-subintimal-modification-2014",
    kind: "case",
    citation:
      "Vo MN, Ravandi A, Grantham JA. Subintimal space plaque modification for “balloon-uncrossable” chronic total occlusions. J Invasive Cardiol. 2014;26:E133–E136.",
    note: "PMID: 25274869. Checked on PubMed: authors, title, journal, year 2014, volume 26, issue 10, pages E133–6 (case report). Abstract: antegrade and retrograde dissection re-entry techniques used to modify plaque from the subintimal space in balloon-uncrossable lesions. Brilakis's reference 18 in chapter 23.",
    verified: true,
  },
  {
    id: "kirtane-anchor-tornus-2007",
    kind: "case",
    citation:
      "Kirtane AJ, Stone GW. The Anchor-Tornus technique: a novel approach to “uncrossable” chronic total occlusions. Catheter Cardiovasc Interv. 2007;70:554–557.",
    url: "https://doi.org/10.1002/ccd.21138",
    note: "PMID: 17503510. Checked on PubMed: authors, title, journal, year 2007, volume 70, issue 4, pages 554–7. Abstract: a penetration catheter combined with a balloon-anchored guide. Brilakis's reference 21 in chapter 23.",
    verified: true,
  },
  {
    id: "sandoval-laser-atherectomy-2020",
    kind: "case",
    citation:
      "Sandoval Y, Lobo AS, Tajti P, Brilakis ES. Laser-assisted orbital or rotational atherectomy: a hybrid treatment strategy for balloon-uncrossable lesions. Hellenic J Cardiol. 2020;61:57–59.",
    url: "https://doi.org/10.1016/j.hjc.2018.07.010",
    note: "PMID: 30092275. Checked on PubMed: authors, title, journal, volume 61, issue 1, pages 57–59 (letter; electronic publication August 2018, no abstract). Brilakis's reference 23 in chapter 23 and the source of Fig. 23.6.",
    verified: true,
  },
  {
    id: "tajti-undilatable-cto-2018",
    kind: "paper",
    citation:
      "Tajti P, Karmpaliotis D, Alaswad K, et al. Prevalence, presentation and treatment of ‘balloon undilatable’ chronic total occlusions: insights from a multicenter US registry. Catheter Cardiovasc Interv. 2018;91:657–666.",
    url: "https://doi.org/10.1002/ccd.27510",
    note: "PMID: 29359452. Checked on PubMed: authors, title, journal, year 2018, volume 91, issue 4, pages 657–666. Abstract: 52 of 425 CTOs with successful guidewire crossing were balloon undilatable (12%); longer, more moderate/severe calcification, lower technical and procedural success, more in-hospital major adverse events due to higher perforation rates. Brilakis's reference 24 in chapter 23.",
    verified: true,
  },
  {
    id: "egred-raser-2012",
    kind: "case",
    citation: "Egred M. RASER angioplasty. Catheter Cardiovasc Interv. 2012;79:1009–1012.",
    url: "https://doi.org/10.1002/ccd.23174",
    note: "PMID: 22162119. Checked on PubMed: author, title, journal, volume 79, issue 6, pages 1009–12 (electronic publication December 2011). Abstract: combined laser and high-speed rotational atherectomy in three patients with severely calcified, undilatable lesions unresponsive to either technique alone. Brilakis's reference 43 in chapter 23.",
    verified: true,
  },
  {
    id: "latib-ellement-2014",
    kind: "paper",
    citation:
      "Latib A, Takagi K, Chizzola G, et al. Excimer Laser LEsion modification to expand non-dilatable stents: the ELLEMENT registry. Cardiovasc Revasc Med. 2014;15:8–12.",
    url: "https://doi.org/10.1016/j.carrev.2013.10.005",
    note: "PMID: 24290659. Checked on PubMed: authors, title, journal, volume 15, issue 1, pages 8–12 (electronic publication October 2013). Abstract: 28 patients with underexpanded stents despite high-pressure balloons; laser at high energy during contrast injection, only within the stent; success (redilatation with the same NC balloon) in 27 (96.4%); periprocedural MI 7.1%. Brilakis's reference 49 in chapter 23.",
    verified: true,
  },
  {
    id: "secco-opn-2019",
    kind: "paper",
    citation:
      "Secco GG, Buettner A, Parisi R, et al. Clinical experience with very high-pressure dilatation for resistant coronary lesions. Cardiovasc Revasc Med. 2019;20:1083–1087.",
    url: "https://doi.org/10.1016/j.carrev.2019.02.026",
    note: "PMID: 30902652. Checked on PubMed: authors, title, journal, volume 20, issue 12, pages 1083–1087. Abstract: 326 consecutive undilatable lesions; maximal dilatation pressure 45–50 atm; adequate expansion with the balloon alone in >90%; coronary rupture in 3 patients (3 of 326 lesions, under 1%), treated with stenting. Brilakis's reference 25 in chapter 19; he quotes a 2%–3% rupture risk, higher than this abstract reports.",
    verified: true,
  },
];
