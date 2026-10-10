// Module cp-cto-retrograde: chronic total occlusions, retrograde crossing and CTO complications (manual curriculum,
// track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 21 (21.6.4 collaterals, 21.8.3 retrograde approach, 21.8.4, 21.10, 21.13),
// chapter 18 (bypass grafts as routes, 18.5.3, 18.7.2.2, 18.7.3, 18.8.1, 18.8.3), chapter 26 (26 introduction, 26.1,
// 26.2, 26.4, 26.5 collateral vessel perforation, 26.6) and the related passages in 8.3 and 8.6 (wire bends, contralateral
// injection), 9.7 (the surfing analogy), 14.1, 23.1 (anchoring), 25.2 (aorto-coronary dissection), 27.1, 27.2 and 27.4
// (stent loss, wire and microcatheter entrapment), 30.2, 30.3, 30.6, 30.7 and 30.18 (guide length, guide extensions,
// microcatheters, wires, coils, vascular plugs, snares); Oxford Handbook of Cardiac Catheterization and Coronary
// Intervention, ch 8 (chronic total occlusion PCI) and ch 10 (iatrogenic type A aortic dissection, coronary perforation).
// The PCI manual refers the detail of retrograde technique to the Manual of CTO Interventions, which is not a source
// here; the step-by-step depth beyond the PCI manual comes only from the PubMed-checked references in `refs` below.
// Selection, set-up, collateral grading and the hybrid algorithm are taught in cp-cto-strategy; antegrade crossing in
// cp-cto-antegrade; general perforation management in cm-perforation; graft anatomy and graft PCI in cp-prior-cabg.
// Every claim is listed with its page in docs/curriculum/evidence/cp-cto-retrograde.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_CTO = O("ch 8: Chronic total occlusion PCI");
const O_AOD = O("ch 10: Iatrogenic type A aortic dissection");
const O_PERF = O("ch 10: Coronary perforation");

export const module: Module = {
  id: "cp-cto-retrograde",
  title: "Chronic total occlusions: retrograde crossing and CTO complications",
  stage: 5,
  summary:
    "How to reach a CTO from behind and finish the job safely: crossing septal and epicardial collaterals and bypass grafts with wire and microcatheter, closing a vein graft once the native artery is open, crossing the occlusion by retrograde wiring or reverse CART and troubleshooting it, connecting the retrograde wire to the antegrade guide by externalisation or a portal technique, and preventing, recognising and treating the complications that belong to CTO work: donor-artery injury, collateral perforation, septal haematoma, aorto-coronary dissection and trapped equipment.",
  objectives: [
    "Choose a retrograde channel from its size, tortuosity, branching, entry and exit angles, stent jailing and distance to the distal cap, and say why septal channels come first.",
    "Cross a septal collateral step by step with a soft wire and microcatheter, and know the options when the wire or the microcatheter will not follow.",
    "State the extra dangers of epicardial and ipsilateral collaterals and the equipment and connection choices that limit them.",
    "Use a patent or occluded bypass graft as a retrograde route, avoid a mammary-dependent donor, and close a vein graft with a correctly sized plug or coils.",
    "Perform and troubleshoot reverse CART, and recognise and treat an aorto-coronary dissection caused during retrograde work.",
    "Connect the retrograde wire to the antegrade system by externalisation, wire trapping, snaring or a portal technique, and avoid equipment interlocking.",
    "Prevent and manage donor-artery injury, septal and epicardial collateral perforation, septal haematoma and equipment entrapment during retrograde CTO PCI.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-septal",
      title: "The retrograde route through a septal collateral, step by step",
      minutes: 16,
      topics: ["cto-retro-septal"],
      sources: [B("21.6"), B("21.8"), B("21.10"), B("8.3"), B("8.6"), B("9.7"), B("23.1"), B("27.4"), B("30.2"), B("30.3"), B("30.6"), B("30.7"), O_CTO],
      refs: [...BOOKS, "karmpaliotis-retrograde-2016", "allana-retrograde-2023", "rathore-retrograde-2009", "huang-collateral-tortuosity-2018", "dautov-septal-surfing-2017", "piedimonte-microcatheter-tracking-2024", "wu-apcto-retrograde-2018"],
      blocks: [
        {
          kind: "p",
          text: "In the retrograde approach the occlusion is attacked from its far end. A wire travels from a donor artery through a collateral channel (or a bypass graft) into the vessel beyond the occlusion, a microcatheter follows it to the distal cap, and the occlusion is then crossed against the original direction of flow. Choosing when to go retrograde is taught in cp-cto-strategy; this lesson is about getting there, and the septal route is where most operators start because it is the safest and easiest channel to work in.",
        },
        {
          kind: "list",
          items: [
            "**Why it matters.** In a US registry of 1,301 CTO procedures (Karmpaliotis 2016) the retrograde approach was used in 41%, as the first strategy in 46% of those and after a failed antegrade attempt in 54%. Retrograde cases were more complex and had lower technical success (85% against 94%) and more in-hospital major events (4.3% against 1.1%), yet the authors judged the approach critical for high overall success.",
            "**What the current numbers look like.** In 4,058 retrograde procedures at 44 centres (Allana 2023), retrograde crossing succeeded in 60.5%, the lesion was crossed in 81.6%, and technical success was 78.7% with in-hospital major events in 3.5% and clinical perforation in 5.8%.",
            "**Why antegrade still comes first, and why retrograde is worth it.** Besides the extra complications, time and radiation of retrograde work, Brilakis points out that the lesion has to be prepared from the antegrade side even when it is crossed from behind. He also notes that the retrograde approach has been linked with good long-term results (21.8.4).",
            "**Oxford's view.** Oxford lists the retrograde approach among the evolving CTO techniques, with the example of a proximal RCA occlusion crossed from the LAD through septal collaterals.",
            "**The three problems.** The Asia Pacific CTO club built its retrograde algorithm around three hurdles: a tough proximal cap, crossing the collateral channel safely and efficiently, and crossing the occlusion itself, above all making reverse CART work (Wu 2018). The second is this lesson; the third is lessons 4 and 5.",
          ],
        },
        {
          kind: "table",
          caption: "Which channels are used (three series, different eras and denominators)",
          head: ["Series", "Septal", "Epicardial", "Bypass graft", "What was counted"],
          rows: [
            ["Rathore 2009, single centre, 157 patients", "67.5%", "24.8%", "7.6%", "Channel used in each retrograde case"],
            ["Huang 2018, single high-volume operator, 242 channels", "50.4%", "34.7%, plus 14.9% through the atrioventricular groove", "Not reported in the abstract", "Channels attempted"],
            ["Allana 2023, 44 centres, 4,058 procedures", "62.0%", "19.1%", "17.4% (vein grafts)", "Channels successfully used"],
          ],
        },
        { kind: "h", text: "Before the first retrograde wire" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Check the set-up for retrograde work",
              detail:
                "Retrograde equipment is delivered through a guide in the donor artery (cp-cto-strategy-setup). Brilakis's ACT target rises to above 350 s for retrograde work; his figures are for a Hemochron analyser and values differ between analysers, so use your laboratory's equivalent. Some operators accept above 300 s but then recheck the ACT very often while it sits in the low 300s (21.3). Any donor lesion on the path of the route is treated first so the donor does not thrombose while equipment sits in it (21.10).",
            },
            {
              title: "2. Plan for length",
              detail:
                "Retrograde routes are long. Several large microcatheters come in 150 cm as well as 135 cm lengths (30.6), shorter 90 cm guides may be needed for retrograde work (30.2.3), and cutting a guide shorter is now reserved for graft or apical-collateral routes on which the retrograde microcatheter cannot otherwise reach the antegrade guide (30.2.4).",
            },
            {
              title: "3. Grade each candidate channel",
              detail:
                "Brilakis lists what to look at: the channel's size and tortuosity, any branching, the angle at which the wire must enter and leave it, whether a stent jails its entry or exit, and how far its exit lies from the distal cap (21.6.4). Review the old films as well as today's: the dominant collateral can change before the procedure or during it, and a channel seen before that has vanished today may still be crossable (21.6.4). Lack of tortuosity predicts wire and device crossing best, then size (taught with the Werner grades in cp-cto-strategy-angiogram).",
            },
            {
              title: "4. Know what the predictors say",
              detail:
                "In Huang's 242 channels only a large size and the absence of tortuosity independently predicted that the channel would be tracked and the case succeed; the authors scored a large channel 1 point and a non-tortuous one 2 points. Rathore found success with thread-like (CC1) continuous channels, tortuosity under 90° and an angle with the recipient artery under 90°, and failure with epicardial channels, no continuous connection (CC0), corkscrew channels, a recipient angle over 90° and a connection that could not be seen.",
            },
            {
              title: "5. Watch the donor",
              detail:
                "Look at the donor artery before the collateral and ask whether one large channel carries most of the supply (collateral dominance). Both predict ischaemia once a wire and microcatheter fill that channel (21.6.4).",
            },
          ],
        },
        {
          kind: "check",
          stem: "An RCA CTO has two straight septal channels from the LAD. Channel A leaves the LAD where a stent covers its origin and joins the PDA 40 mm beyond the distal cap at an obtuse angle. Channel B arises from an unstented segment and joins the PDA 10 mm from the cap at an acute angle. Which do you try first, and why?",
          options: [
            "Channel A, because a longer stretch of PDA beyond the cap gives the microcatheter more room to turn into the vessel",
            "Channel B, because a stent-jailed entry, an obtuse exit angle and a long run to the cap all count against A",
            "Either, because only size and tortuosity matter and the two channels are equally straight",
            "Neither, because septal channels from the LAD should be left for when an epicardial route has failed",
          ],
          answer: 1,
          explanation:
            "Brilakis asks for jailing, the entry and exit angles and the distance to the cap to be graded as well as size and tortuosity. In Huang's series only size and tortuosity were independent predictors, but Rathore found that a recipient angle over 90° predicted failure, and a stent over the entry can hinder wiring, so B is the better first choice and 'either' is the tempting wrong answer. Septal channels are the first choice, not the fallback.",
        },
        { kind: "h", text: "Crossing the septal" },
        {
          kind: "steps",
          title: "Wire and microcatheter through a septal channel",
          items: [
            {
              title: "1. Microcatheter to the septal origin",
              detail:
                "Take a microcatheter down the donor LAD to the mouth of the chosen septal. It supports the wire, allows tip reshaping and wire exchange, and protects the donor artery and then the collateral from wire injury (30.6).",
            },
            {
              title: "2. Choose and shape the wire",
              detail:
                "Soft, non-tapered polymer-jacketed wires are the class Brilakis lists for collateral crossing (30.7.2); polymer-jacketed wires slide through tortuosity but carry more risk of perforation and dissection, so they are exchanged before balloons and stents. Two jobs need two shapes: a large bend to get into the septal from the LAD, and a small bend to travel through it (Fig. 8.1). The microcatheter lets you change the shape between the two.",
            },
            {
              title: "3. Surf",
              detail:
                "Advance the wire gently and let it find the path of least resistance through the septum, guided by feel and fluoroscopy rather than by mapping injections (21.6.4). Brilakis credits surfing to Sianos and likens the no-contrast, tactile 'deep wiring' technique, used to gain wire support in distal vessels, to it; for that technique he advises pulling back and redirecting into another channel when the wire will not advance, because perforation is likelier when wiring goes on against resistance (9.7). Apply the same rule in a septal: if the tip stops or buckles, pull back and try another branch or another channel instead of pushing. In the Quebec series (Dautov 2017) surfing crossed 81% of septal channels whatever their Werner size; success and time depended on tortuosity, and the septal perforations seen in about a quarter of cases were all minor and caused no symptoms.",
            },
            {
              title: "4. Map when surfing fails",
              detail:
                "Advance the microcatheter into the septal and inject a little contrast through it, after confirming good backflow, to show the channel's course (21.6.4). A dual-lumen microcatheter lets you try different septal branches without losing your position (30.6.4), and a deflectable-tip microcatheter can direct a wire into a collateral whose takeoff is sharply angled (30.6.3). That catheter is stiff, which adds support but can injure the vessel; its tip bends on a 2.5 mm radius, so deflect it with special care in arteries narrower than that, and release the bend so the tip is straight whenever you advance or withdraw it. Trapping it for removal needs an 8 Fr guide (30.6.3).",
            },
            {
              title: "5. Confirm that the wire is in the recipient artery",
              detail:
                "Use intermittent contrast injections and two orthogonal views to check that the wire tip lies in the lumen of the recipient artery beyond the occlusion (8.6.2.6).",
            },
            {
              title: "6. Bring the microcatheter across",
              detail:
                "Large microcatheters with coils in the wall can be rotated to advance; small, non-coiled ones have the lowest profiles but are designed to be pushed, and aggressive spinning can break the tip off (30.6.2). Never over-rotate, and never move a microcatheter without a wire inside it (27.4.2). Flush the microcatheter after each tip injection so the wire does not stick in it, and if wire or microcatheter become hard to move after long use, suspect a fatigued microcatheter and exchange it for a new one (30.6.6).",
            },
            {
              title: "7. Park the microcatheter at the distal cap",
              detail:
                "From there the occlusion is crossed by retrograde wiring or retrograde dissection and re-entry (lesson 4).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-septal-surf" },
        { kind: "tip", id: "pci-cto-strategy-microcatheter-injection" },
        { kind: "h", text: "When the wire crosses but the microcatheter will not" },
        {
          kind: "p",
          text: "This is a common sticking point, and it matters: in the SURFING MICRO registry (Piedimonte 2024), small septal size and continuous bends independently predicted failure of the microcatheter to follow a wire that had already crossed, and when it failed, procedural success fell to 40.0% against 93.9% and collateral perforation rose to 20.0% against 3.0%. Forcing the issue is how channels perforate.",
        },
        {
          kind: "steps",
          items: [
            {
              title: "Dilate the septal",
              detail:
                "Unlike epicardial channels, septals can be dilated safely with a small balloon (1.5 mm or less) at low pressure (2–4 atm) so that the microcatheter or a device can pass (21.6.4).",
            },
            {
              title: "Add support",
              detail:
                "A guide extension in the donor guide gives retrograde equipment more support (30.3.2), and anchoring can be done from the antegrade and the retrograde side in difficult retrograde cases (23.1.3).",
            },
            {
              title: "Change the microcatheter",
              detail:
                "A smaller-profile microcatheter tracks small, tortuous channels more easily (30.6.2).",
            },
            {
              title: "Do without retrograde microcatheter crossing",
              detail:
                "If the retrograde wire has already reached the antegrade guide, portal techniques such as tip-in connect the systems without the microcatheter crossing (lesson 5).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-microcatheter-stalls" },
        {
          kind: "check",
          stem: "A soft polymer-jacketed wire has surfed through a septal into the PDA, but the low-profile microcatheter stops at a tight bend in the mid-septum. Which is the best next step?",
          options: [
            "Spin the low-profile microcatheter hard in both directions until it passes the bend",
            "Dilate the septal with a 2.5 mm balloon at nominal pressure to straighten the bend",
            "Inflate a balloon of 1.5 mm or less at 2–4 atm in the septal, then try the microcatheter again",
            "Abandon the septal and dilate a nearby epicardial channel instead, because it is larger and better filled",
          ],
          answer: 2,
          explanation:
            "Septal channels can be dilated safely with balloons of 1.5 mm or less at 2–4 atm to let the microcatheter through. Small non-coiled microcatheters are built to be pushed, and spinning them hard risks tip fracture. A 2.5 mm balloon at nominal pressure breaks the size and pressure limits. Epicardial channels must not be balloon-dilated at all.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing a wire against resistance in a septal: change branch or channel, or map it, instead.",
            "Using one wire shape for both entering and crossing the septal.",
            "Moving a microcatheter with no wire inside it, or over-rotating a soft-tipped microcatheter.",
            "Dilating with a balloon larger than 1.5 mm or above 4 atm, or dilating an epicardial channel.",
            "Starting retrograde work with a diagnostic catheter in the donor or an ACT still at the antegrade target.",
            "Ignoring collateral dominance: the patient may become ischaemic as soon as the channel is filled with equipment.",
          ],
        },
        {
          kind: "pearl",
          text: "Spend the effort before the wire goes in. A minute spent grading every septal on the old and new films (straightness, size, entry and exit angles, stents, distance to the cap) usually saves far more time than any trick used once the wire is stuck.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, after dual injection, choose a septal channel from the LAD and state why (size, tortuosity, angles, stents, distance to the cap). Then describe your wire shapes for entering and crossing it, and what you will do if the microcatheter stops in the septum.",
        },
        { kind: "drill", target: "angio-real", drill: "collaterals", task: "On each real run with collateral filling, decide whether a septal channel is visible, whether it looks straight or tortuous, and where it joins the recipient artery relative to the occlusion." },
        { kind: "video", id: "JtpKic3-Wjw", note: "Manual of CTO PCI 8.3.2: retrograde via septal collaterals." },
        { kind: "video", id: "SShpWxF9J4c", note: "Manual of CTO PCI 8.3.1: retrograde approach overview." },
        { kind: "video", id: "iDPJSSktDjc", note: "Manual of CTO PCI 8.3.5: microcatheter will not cross." },
        { kind: "video", id: "fYQhwy-gI0k", note: "How to cross a collateral with a microcatheter after guidewire crossing." },
        {
          kind: "keypoints",
          items: [
            "Retrograde: wire through a collateral or graft to the distal vessel, microcatheter to the distal cap, then cross against flow.",
            "Grade each channel: size, tortuosity, branches, entry and exit angles, stent jailing, distance to the cap; tortuosity and size predict crossing.",
            "Set-up: a guide in the donor, ACT above 350 s (Brilakis's figure; analysers differ), donor lesions on the route treated first.",
            "Soft non-tapered polymer-jacketed wire, large bend to enter and small bend to cross; surf gently, map with backflow-checked tip injections if needed.",
            "Microcatheter stuck: dilate the septal (≤1.5 mm, 2–4 atm), add support, change to a lower profile, or connect by a portal technique.",
            "Never move a microcatheter without a wire, and never spin a push-only microcatheter hard.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-epicardial",
      title: "Epicardial and ipsilateral collaterals",
      minutes: 13,
      topics: ["cto-retro-epicardial"],
      sources: [B("21.6"), B("26.5"), B("26.6"), B("26.2"), B("30.6"), B("30.7"), B("18")],
      refs: [...BRILAKIS, "rathore-retrograde-2009", "benincasa-epicardial-2017", "wu-epicardial-perforation-2019", "azzalini-ipsilateral-2017", "al-ogaili-ipsilateral-2024", "ungureanu-portal-techniques-2025", "allana-retrograde-2023"],
      blocks: [
        {
          kind: "p",
          text: "Epicardial collaterals run over the surface of the heart rather than through the septum. They are usually more tortuous than septals (Benincasa 2017), and a tear bleeds into the pericardium, where it can cause rapid tamponade (26.5). Use them when they are the best route left, with equipment and techniques chosen to keep them intact.",
        },
        {
          kind: "table",
          caption: "Why epicardial channels are treated differently from septals",
          head: ["Point", "Septal", "Epicardial"],
          rows: [
            ["Ease and safety", "Generally the safer, easier channel to work in (21.6.4)", "Harder; epicardial use predicted failure in Rathore 2009"],
            ["Balloon dilation to cross", "Allowed: 1.5 mm or less at 2–4 atm", "Not done (21.6.4)"],
            ["If perforated", "Usually no harm, although septal and right ventricular wall haematomas and even dry tamponade have been reported (26.5)", "Serious: can fill the pericardium fast and be difficult to stop (26.5)"],
            ["Success in one comparison (Benincasa 2017, 81 retrograde procedures)", "Technical success 76% through non-epicardial routes (septals and grafts)", "35%, with perforation needing treatment in 5% (none through non-epicardial routes); follow-up events similar"],
          ],
        },
        {
          kind: "list",
          items: [
            "**How often they perforate.** In 155 patients treated through epicardial collaterals at one Chinese centre (Wu 2019), coronary perforation occurred in 15.5% and tamponade in 4.5%; coil embolisation and pericardiocentesis controlled the tamponades, and perforation did not worsen long-term outcomes. Renal dysfunction, an RCA CTO and an Epi-CTO score of 2 or more predicted perforation.",
            "**How often they are used.** Epicardial channels made up 19.1% of successful retrograde routes in the 44-centre series (Allana 2023).",
          ],
        },
        { kind: "h", text: "Ipsilateral collaterals" },
        {
          kind: "p",
          text: "An ipsilateral collateral connects two parts of the same coronary artery, bridging the occlusion from upstream to downstream, so the donor and the CTO vessel are one artery. The two registries below report different end points in different populations: Azzalini counted only perforations that needed treatment and included septal channels, while Al-Ogaili counted all perforations and studied epicardial channels only. Their figures cannot be compared directly. Al-Ogaili found more complications than in other retrograde cases; Azzalini had no comparison group and judged the complication rate reasonable in experienced hands.",
        },
        {
          kind: "table",
          caption: "Ipsilateral collateral registries",
          head: ["Point", "Azzalini 2017 (6 European centres)", "Al-Ogaili 2024 (PROGRESS-CTO)"],
          rows: [
            ["Size", "126 patients, 17% of retrograde procedures", "191 of 4,466 retrograde cases (4.3%)"],
            ["Channel and target", "Epicardial 76%, septal 24%; circumflex 42%, LAD 39%, RCA 19%", "Ipsilateral epicardial only; circumflex the commonest target (50%)"],
            ["Guides", "One guide in 80%; a second guide in the same artery (ping-pong) in 20%", "Dual injection less often than in other retrograde cases (66% against 89%)"],
            ["Crossing", "Retrograde wire reached the distal cap in 81%; technical success 87%", "Wiring success through the collateral 50%; technical success 76% against 79% in other retrograde cases"],
            ["Complications", "Collateral perforation needing treatment 5.6%, tamponade from it 2.4%, one death (0.8%)", "Procedural complications 25.8% against 16.4%, perforation 17.3% against 9.0%, pericardiocentesis 3.1% against 1.2%, donor dissection or thrombus 3.7% against 1.2%"],
          ],
        },
        {
          kind: "check",
          stem: "An RCA CTO has no visible septal channel and no grafts; a tortuous epicardial channel from a large circumflex marginal fills the posterolateral branch. The retrograde wire has crossed it, but the microcatheter stops halfway. What do you do?",
          options: [
            "Dilate the channel with a 1.25 mm balloon at 2 atm, as you would a septal channel",
            "Use a smaller-profile microcatheter and add support, without ballooning the epicardial channel",
            "Keep pushing the current microcatheter firmly, because epicardial channels are larger than septals",
            "Withdraw the wire and leave the case, because epicardial channels must never be used retrogradely",
          ],
          answer: 1,
          explanation:
            "Septal channels can be balloon-dilated at low pressure, but Brilakis contrasts this with epicardial channels, which are not dilated; perforating one can cause rapid tamponade. Small-outer-diameter microcatheters are his choice for epicardial routes. Treating it like a septal is the tempting error. Epicardial channels are used when needed, so abandoning the case on principle is wrong.",
        },
        { kind: "h", text: "Working through an epicardial channel" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Use it only when it is the best route left",
              detail:
                "Septal channels and grafts come first. Azzalini describes ipsilateral routes as used mostly when no other retrograde option exists.",
            },
            {
              title: "2. Map the whole channel",
              detail:
                "Film it completely in the views that open it out, and use selective tip injections after a backflow check where the course is unclear (21.6.4). Note every corkscrew segment and where the exit lies.",
            },
            {
              title: "3. The softest wire you can steer",
              detail:
                "Brilakis's workhorse table names a wire with an ultra-low tip load (0.3 g) and a long hydrophilic coating as the best wire for tortuous epicardial collaterals (30.7.1); soft polymer-jacketed collateral wires are the other option (30.7.2).",
            },
            {
              title: "4. A small microcatheter",
              detail:
                "Brilakis prefers small-outer-diameter microcatheters for epicardial routes (30.6.2). In PROGRESS-CTO the commonest ipsilateral choices were an ultra-low tip-load wire (39%) and a very low-profile push microcatheter (43%).",
            },
            {
              title: "5. No balloon dilation of the channel you are crossing",
              detail: "Gain support from the guide side instead (guide extension, anchoring), or change the plan. Brilakis does describe gentle balloon occlusion, for 2–4 minutes, of a dominant non-interventional epicardial channel to recruit better collaterals (taught in cp-cto-strategy-angiogram); that is a brief occlusion of a channel you are not going to cross, not dilation of your route.",
            },
            {
              title: "6. Ipsilateral: plan the guide",
              detail:
                "One guide can serve both directions, which limits the room inside it, or a second guide can engage the same artery (ping-pong). Antegrade microcatheter probing, a portal technique, avoids putting a second microcatheter in the same guide (lesson 5).",
            },
            {
              title: "7. Plan a gentle connection",
              detail:
                "Externalisation pulls on the channel. Portal techniques such as tip-in to a balloon or antegrade microcatheter probing are suggested when externalisation is not wanted, for example after crossing an epicardial collateral (Ungureanu 2025; lesson 5).",
            },
            {
              title: "8. Watch for staining at every step",
              detail:
                "Inject the donor and the CTO artery often, keep the pericardiocentesis set ready, and remember that after bypass surgery a bleed may loculate and compress a chamber instead of causing classic tamponade (26.6; lesson 6).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-epicardial-rules" },
        {
          kind: "check",
          stem: "During an ipsilateral circumflex CTO case, a single 7 Fr guide holds the antegrade microcatheter, and the retrograde wire has crossed an epicardial loop and the occlusion into the guide. You want to avoid putting tension on the loop. Which connection fits best?",
          options: [
            "Externalise a 330 cm wire and pull it taut to straighten the loop before stenting",
            "Snare the retrograde polymer-jacketed wire in the ascending aorta and pull it out",
            "A portal technique such as tip-in, then conversion to an antegrade wire",
            "Advance a second guide into the aorta beside the first and catch the wire there",
          ],
          answer: 2,
          explanation:
            "Portal techniques connect the systems without externalisation and are suggested when crossing epicardial collaterals or when the guide has little room, reducing tension on fragile channels. Pulling an externalised wire taut is exactly the tension to avoid. Snaring needs a dedicated externalisation wire, not a crossing wire, and the retrograde microcatheter must first have crossed the occlusion.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating an epicardial channel like a septal: no balloon dilation, no forceful pushing.",
            "Choosing an epicardial route when a usable septal or graft exists.",
            "Using a bulky microcatheter or a stiff wire in a tortuous epicardial loop.",
            "Externalising and then pulling hard on a wire that runs through an epicardial channel.",
            "Assuming a perforation after bypass surgery is harmless because the pericardium is adherent.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat an epicardial channel as something you borrow and must give back intact: softest wire, smallest microcatheter, no balloon dilation, and the gentlest connection you can make.",
        },
        { kind: "tip", id: "pci-cto-retro-donor-ischaemia" },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, suppose no septal is usable and only an epicardial channel from the circumflex is available. State your wire and microcatheter class, what you will not do in the channel, how you will connect at the end, and what you will watch for throughout.",
        },
        { kind: "video", id: "uPvZfHQYTDQ", note: "Manual of CTO PCI 8.3.3: retrograde via epicardial collaterals." },
        { kind: "video", id: "_Wvej1tV5Sc", note: "Case 106: retrograde via an epicardial collateral." },
        { kind: "video", id: "xMcMSepKMoc", note: "Case 88: retrograde via an ipsilateral epicardial collateral." },
        { kind: "video", id: "ckE99t9akPA", note: "Case 119: epicardial collateral perforation." },
        {
          kind: "keypoints",
          items: [
            "Epicardial channels are harder and riskier than septals; use them when they are the best route left.",
            "Never balloon-dilate an epicardial channel; a perforation can cause rapid tamponade.",
            "Ultra-low tip-load or soft polymer-jacketed wire; small-outer-diameter microcatheter.",
            "Ipsilateral routes: one guide or ping-pong; complication rates were higher than other retrograde routes in PROGRESS-CTO.",
            "Prefer a connection without tension, such as a portal technique, after an epicardial crossing.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-grafts",
      title: "Bypass grafts as retrograde routes, and closing a vein graft",
      minutes: 15,
      topics: ["cto-retro-svg"],
      sources: [B("21.6"), B("18"), B("18.5"), B("18.7"), B("18.8"), B("26.6"), B("30.2"), B("30.6"), B("30.7"), B("30.18")],
      refs: [...BRILAKIS, "nguyen-trong-svg-retrograde-2016", "tajti-lima-retrograde-2018", "wilson-svg-sacrifice-2019", "xenogiannis-svg-plug-2020", "allana-retrograde-2023"],
      blocks: [
        {
          kind: "p",
          text: "After bypass surgery the native arteries are often occluded, and the grafts that supply them can carry a wire straight to the vessel beyond the occlusion. A graft is in some ways the ideal retrograde conduit, but it brings problems of reach, angle and safety of its own, and when the native artery has been reopened the graft itself may need to be closed. Graft anatomy and graft PCI are taught in cp-prior-cabg.",
        },
        {
          kind: "table",
          caption: "Grafts as retrograde routes",
          head: ["Route", "For it", "Against it, and the evidence"],
          rows: [
            [
              "Patent vein graft",
              "No side branches, a predictable course and a large calibre (21.6.4)",
              "The angle of the distal anastomosis can make it hard to turn back towards the occlusion. In a four-centre US series (Nguyen-Trong 2016) vein grafts were the route in 14.6% of retrograde cases; technical success was 86%, the retrograde attempt through the graft succeeded in 67%, and one of two major events was a fatal tamponade",
            ],
            [
              "Occluded vein graft",
              "Can still be used if the occlusion looks favourable (18.7.2.2, 21.6.4)",
              "A chronically occluded graft is otherwise not reopened (cp-prior-cabg)",
            ],
            [
              "Acutely occluded vein graft",
              "When a badly degenerated vein graft fails and causes an acute coronary syndrome, treating the native CTO ad hoc is preferred if feasible (21.1, 18.7.2.1)",
              "Among the reports Brilakis cites is retrograde recanalisation of the native CTO through the acutely occluded vein graft itself (18.7.2.1, ch 18 ref 27); acutely occluded grafts carry a large thrombus load (18.7.2.1)",
            ],
            [
              "Mammary graft",
              "Possible: in a US registry (Tajti 2018) mammary grafts were the conduit in 20 of 990 retrograde procedures (2.02%), with technical success 70% against 81.05% through other routes and major complications 5% against 6% (neither difference significant; only 20 mammary cases)",
              "If the collaterals come from an LAD that depends on a mammary graft, working through that graft risks global ischaemia and is avoided whenever possible (21.6.4); wiring a tortuous mammary can create pseudolesions, and deep intubation or guide extensions can dissect or perforate it (18.5.3, 18.8.3)",
            ],
          ],
        },
        { kind: "tip", id: "pci-svg-chronic-occlusion" },
        { kind: "tip", id: "pci-cto-retro-lima-donor" },
        {
          kind: "check",
          stem: "A patient with prior CABG has an RCA CTO. The LAD, which fills only through a patent LIMA, gives large septal collaterals to the PDA. A patent vein graft to the PDA is also present but its distal anastomosis is acutely angled. Which retrograde route do you plan first?",
          options: [
            "The septal collaterals, reached by wiring down the LIMA, because septals are the safest channels",
            "The septal collaterals, reached by wiring the native left main through the LAD, because it avoids the graft",
            "The vein graft to the PDA, accepting the awkward anastomosis, because it avoids the mammary-dependent donor",
            "No retrograde route, because both are contraindicated after bypass surgery",
          ],
          answer: 2,
          explanation:
            "Brilakis advises avoiding retrograde access through a mammary graft when the collaterals come from an LAD that depends on it, because of the risk of global ischaemia. The LAD here fills only through the LIMA, so the native left main route does not exist. A patent vein graft is an ideal conduit apart from its anastomotic angle, which an angled microcatheter can help with. Grafts are valid routes after surgery.",
        },
        { kind: "h", text: "Working through a graft, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Make sure you can reach",
              detail:
                "The target lies a long way beyond the guide tip. Brilakis's answers: short (90 cm) guides, deep intubation, 300 cm wires and long-shaft balloons and stents (18.8.1). Cutting the guide shorter is still sometimes needed on graft routes when the retrograde microcatheter cannot otherwise reach the antegrade guide (30.2.4).",
            },
            {
              title: "2. Engage with support",
              detail:
                "A supportive graft guide, as for graft PCI (18.5.2). Treat the mammary gently: deep intubation and guide extensions can injure it (18.5.3).",
            },
            {
              title: "3. Turn back at the anastomosis",
              detail:
                "At a vein graft's distal anastomosis the wire tends to run on downstream rather than back towards the occlusion. An angled-tip microcatheter with a 120° bend helps point it retrogradely, both through vein grafts and through reverse-angled collaterals (30.6.3).",
            },
            {
              title: "4. Separate delivery from visualisation if needed",
              detail:
                "Native-vessel PCI after surgery can use two catheters: one to deliver equipment, usually in the native artery, and another, usually in a bypass graft, to show the target (18.10.1).",
            },
            {
              title: "5. Expect a hard distal cap",
              detail:
                "Distal caps of native CTOs in bypassed vessels are more often calcified and resist the wire (21.6.3), which is part of why retrograde wiring alone may not cross and reverse CART is common on these routes (lesson 4). Reverse CART was the commonest re-entry technique in the vein graft series.",
            },
            {
              title: "6. Treat any perforation at once",
              detail:
                "After CABG a bleed may loculate, compress a chamber and be impossible to drain with a needle (18, 26.6).",
            },
          ],
        },
        { kind: "tip", id: "pci-graft-route-reach" },
        { kind: "tip", id: "pci-cto-retro-svg-angled-microcatheter" },
        { kind: "tip", id: "pci-lima-pseudolesion" },
        { kind: "tip", id: "pci-cabg-perforation-act-now" },
        { kind: "h", text: "Closing a vein graft" },
        {
          kind: "p",
          text: "Once the native artery has been reopened, a vein graft that stays open competes with it for flow. Plugs close vessels either in an emergency, for a perforation, or electively; Brilakis describes deliberate occlusion of a vein graft that has failed repeatedly after the native artery was recanalised (30.18.3); in the vein graft retrograde series two grafts were coiled for competitive flow after the CTO was opened; and in a UK series of 33 patients (Wilson 2019), almost all with a recanalised native CTO, closing the graft after native PCI was done with vascular plugs in every case, succeeded in 97% (one plug in 72.7%), took about 20 minutes, caused one transient episode of slow flow and was followed by target lesion failure in 9.1% over a mean of 602 days. The same approach has been reported after native CTO PCI in a heart attack caused by a graft lesion (Xenogiannis 2020).",
        },
        {
          kind: "steps",
          title: "Occluding a vein graft",
          items: [
            {
              title: "1. Finish the native artery first",
              detail: "Close the graft only after successful native PCI, as in the published series and case.",
            },
            {
              title: "2. Measure the landing zone",
              detail:
                "Find a segment of graft where the device will sit, measure its diameter and make sure the segment is long enough to hold the whole device without blocking another vessel or structure (30.18.3).",
            },
            {
              title: "3. Size the plug",
              detail:
                "A vascular plug is a braided nitinol mesh disc on a delivery cable. Choose a diameter 30–50% larger than the vessel at the occlusion site (30.18.3). Brilakis uses the multilayer (type II) plug for most vein grafts; its sizes run from 3 to 22 mm, and larger plugs need a delivery catheter with a larger inner diameter (at least 0.056 inch for a 3–8 mm plug and 0.098 inch for an 18–22 mm plug, Table 30.12).",
            },
            {
              title: "4. Deploy, check, then release",
              detail:
                "The plug can be pulled back and repositioned until it is released, which is done by turning the delivery cable anticlockwise with its torque device (30.18.3).",
            },
            {
              title: "5. Coils are the alternative",
              detail:
                "Coils occlude vessels too (30.18.2). Detachable coils are preferred because they can be placed precisely and recovered before release, whereas pushable coils cannot be recovered once out. Coils compatible with 0.014 inch microcatheters pass through standard CTO microcatheters; most stock coils need a 0.018 inch microcatheter, so either stock 0.014-compatible detachable coils or have the larger microcatheter ready. Make sure the coil cannot prolapse back into the parent vessel (30.18.2).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-svg-plug" },
        {
          kind: "check",
          stem: "After native RCA recanalisation, you decide to close a patent vein graft whose body measures 4.5 mm at a long, branch-free landing zone. Which plug diameter meets Brilakis's sizing rule?",
          options: ["4 mm", "5 mm", "6 mm", "8 mm"],
          answer: 2,
          explanation:
            "The plug should be 30–50% larger than the vessel at the occlusion site: for 4.5 mm that is about 5.9–6.8 mm, so 6 mm fits. A 5 mm plug is only about 11% larger and a 4 mm plug is undersized; 8 mm is about 78% larger, well beyond the rule.",
        },
        {
          kind: "pitfalls",
          items: [
            "Planning a retrograde route through a mammary graft that supplies the donor LAD.",
            "Discovering on the day that the equipment cannot reach: plan guide length, wire length and shaft length first.",
            "Pushing a wire straight on at a vein graft anastomosis instead of turning it back with an angled microcatheter.",
            "Watching a small perforation after bypass surgery instead of sealing it.",
            "Sizing a graft-closure plug to the vessel diameter, or landing it where it blocks another branch.",
          ],
        },
        {
          kind: "pearl",
          text: "In a patient with prior surgery, list every graft and ask two questions of each: could it take me to the distal cap, and once the native artery is open, should it stay open?",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Using the mid-RCA CTO scenario, imagine the patient has a patent vein graft to the PDA. Plan a graft route: guide length, wire length, how you will turn back at the anastomosis, and how you would close the graft afterwards (landing zone, plug size for a 4 mm graft, release).",
        },
        { kind: "video", id: "pXTZVCMiWMI", note: "Manual of CTO PCI 8.3.4: retrograde via SVGs." },
        { kind: "video", id: "H6Zf6ou-BrQ", note: "Manual of CTO PCI 8.3.9: how to close an SVG." },
        { kind: "video", id: "QrYwjDI8zb4", note: "Case 255: retrograde through an occluded SVG." },
        { kind: "video", id: "HlEE1de3R54", note: "Case 260: retrograde through a LIMA." },
        {
          kind: "keypoints",
          items: [
            "Patent vein grafts are near-ideal routes (no branches, predictable, large); the anastomotic angle is the catch.",
            "Occluded vein grafts can be routes if their occlusion looks favourable; they are not reopened for their own sake.",
            "Avoid a mammary graft route when the donor LAD depends on it: global ischaemia.",
            "Plan reach: 90 cm guides, 300 cm wires, long shafts; an angled 120° microcatheter turns the wire back.",
            "Close a competing graft after native PCI: plug 30–50% larger than the vessel, adequate landing length, release by anticlockwise rotation; coils are the alternative.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-reverse-cart",
      title: "Crossing from behind: retrograde wiring and reverse CART",
      minutes: 16,
      topics: ["cto-reverse-cart"],
      sources: [B("21.8"), B("21.13"), B("21.6"), B("23.1"), B("25.2"), B("26.4"), B("27.1"), B("30.3"), O_AOD],
      refs: [...BOOKS, "matsuno-reverse-cart-2018", "allana-retrograde-2023", "huang-guide-extension-reverse-cart-2017", "wu-apcto-retrograde-2018", "surmely-cart-2006", "ungureanu-portal-techniques-2025"],
      blocks: [
        {
          kind: "p",
          text: "With the retrograde microcatheter at the distal cap, the occlusion still has to be crossed. Either the retrograde wire goes straight through into the proximal true lumen, or the two systems are joined through a dissection plane. The second, reverse CART, is now the dominant retrograde crossing technique, and most of the skill lies in making it work when it does not at first.",
        },
        {
          kind: "table",
          caption: "Ways to cross once the retrograde microcatheter is at the distal cap",
          head: ["Technique", "What happens", "When"],
          rows: [
            ["Retrograde wiring (true lumen puncture)", "The retrograde wire passes through the occlusion into the proximal true lumen", "Usually short occlusions, especially with a tapered distal cap (21.8.3)"],
            ["Retrograde wire as a marker", "Ungureanu describes antegrade rewiring with a microcatheter and workhorse wire, using the retrograde wire as a marker, after a tip-in to an antegrade balloon. The registry term 'just marker' antegrade crossing (Allana 2023) is not defined in its abstract. In Brilakis's Fig. 27.5 case a retrograde true-lumen puncture, confirmed by IVUS, and a retrograde balloon were followed by antegrade wiring", "When the antegrade wire needs a target"],
            ["CART", "The original technique (Surmely 2006): subintimal dissection is made from both the antegrade and the retrograde side and kept within the occluded segment so that the two meet. Its name makes it the converse of reverse CART; neither manual describes its steps", "Less often than reverse CART"],
            ["Reverse CART", "A balloon on the antegrade wire, usually in the subintimal space, opens a space; the retrograde wire is steered into it after the balloon is deflated (21.8.3)", "The commonest retrograde crossing technique"],
          ],
        },
        {
          kind: "p",
          text: "**Three kinds of reverse CART.** A standard terminology (Matsuno 2018) divides it into conventional reverse CART, in which large antegrade balloons create re-entry within the occluded segment; directed reverse CART, which uses a small antegrade balloon and active, intentional steering and penetration with a controllable retrograde wire, still within the occlusion; and extended reverse CART, in which the dissection is extended beyond the occluded segment, proximally or distally, and re-entry happens outside it. The Asia Pacific club's retrograde algorithm also sets out what it calls a 'contemporary' reverse CART philosophy (Wu 2018), and the registry figures below report 'contemporary' reverse CART as a separate category; neither abstract defines it, so it is listed here without a definition.",
        },
        {
          kind: "steps",
          title: "Reverse CART, step by step",
          items: [
            {
              title: "1. Retrograde wire into the occlusion",
              detail:
                "From the microcatheter at the distal cap, advance a retrograde wire into the occluded segment. A knuckled retrograde wire can be pushed through the distal cap, as in Brilakis's Fig. 26.14 case.",
            },
            {
              title: "2. Antegrade wire into the occlusion",
              detail:
                "From the antegrade guide, advance a wire into the occlusion until it overlaps the retrograde wire in the same segment, checked in orthogonal views.",
            },
            {
              title: "3. Size and inflate the antegrade balloon",
              detail:
                "Inflate a balloon over the antegrade wire where the wires overlap. IVUS helps choose the balloon size (21.13.1).",
            },
            {
              title: "4. Steer the retrograde wire into the space",
              detail: "Deflate the balloon and direct the retrograde wire into the space it has made, then on into the proximal true lumen.",
            },
            {
              title: "5. Into the antegrade guide",
              detail:
                "Advance the retrograde wire up the proximal vessel and into the antegrade guide, then connect the two systems (lesson 5). Confirm that the wire is in the true lumen before anything follows it.",
            },
          ],
        },
        { kind: "h", text: "When reverse CART will not connect" },
        {
          kind: "steps",
          items: [
            {
              title: "Find out why with IVUS",
              detail:
                "In difficult reverse CART cases IVUS can show the mechanism of failure, for example where each wire lies, and so raise the chance of success (21.8.3); it also guides the balloon size (21.13.1).",
            },
            {
              title: "Shorten the gap with a guide extension",
              detail:
                "Advanced through the antegrade guide, a guide extension reduces the distance the retrograde wire must travel to enter the antegrade system (guide extension reverse CART, 30.3.2). In a Chinese series (Huang 2017) it was used when the retrograde wire would not enter the antegrade guide, mostly in occlusions over 20 mm with bends over 45°, and all 20 such cases succeeded, with one tamponade and one epicardial perforation.",
            },
            {
              title: "Add support",
              detail: "Antegrade and retrograde anchoring can both be used in challenging retrograde cases (23.1.3).",
            },
            {
              title: "Change the type",
              detail:
                "If the wires will not meet inside the occluded segment, the dissection can be extended beyond it and re-entry made outside it (extended reverse CART, Matsuno 2018).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-reverse-cart-troubleshoot" },
        {
          kind: "check",
          stem: "Reverse CART in a mid-RCA CTO: the wires overlap, a 2.5 mm antegrade balloon has been inflated twice, but the retrograde wire keeps sliding past the balloon site without entering. What is the most useful next step?",
          options: [
            "Inflate the same 2.5 mm balloon a third time at higher pressure and keep trying the retrograde wire",
            "Image with IVUS to see where each wire lies and to size the balloon",
            "Give a forceful antegrade contrast injection to outline the dissection plane before the next attempt",
            "Exchange the retrograde wire for the stiffest tapered wire available and push harder",
          ],
          answer: 1,
          explanation:
            "Brilakis notes that IVUS can show why reverse CART is failing and guide the balloon size; a guide extension is an aid Brilakis describes, supported by a small non-randomised series. Repeating the same step without knowing the mechanism wastes time. Forceful antegrade injection into a dissected vessel can extend the dissection and, near the ostium, cause an aorto-coronary dissection.",
        },
        { kind: "h", text: "The danger at the ostium: aorto-coronary dissection" },
        {
          kind: "p",
          text: "A dissection that runs back from the coronary artery into the aortic sinus or beyond is rare in PCI generally (Oxford gives an incidence of iatrogenic type A aortic dissection of 0.01% of coronary interventions) but commoner in CTO work, especially retrograde (between 0.8% and 1.8% across the two recent series Brilakis cites), and the RCA is the usual site (25.2.1.1). It may stay within the coronary sinus or spread into the proximal ascending aorta and even further. Among its causes Brilakis lists a retrograde wire that tracks under the intima and on into the wall beneath the aortic sinus during reverse CART, deep or aggressive guide engagement, a damped guide, forceful injection through a wedged catheter, predilating the ostium, balloon rupture, antegrade attempts at a true aorto-ostial CTO, and an aortic dissection that reaches the coronary ostia.",
        },
        {
          kind: "table",
          caption: "Aorto-coronary dissection during CTO work",
          head: ["Step", "Brilakis (25.2.1.1)", "Oxford (ch 10)"],
          rows: [
            ["Prevent", "Use anchoring rather than aggressive guide intubation; take a guide extension in over a balloon rather than directly over the wire, and inject through it with great caution; side-hole guides can give false reassurance; avoid power injection once the proximal CTO segment has been dilated, preferring hand injections and injections from the donor", "Guide catheter trauma and stent-edge flaps are the causes it names"],
            ["First action", "Stop contrast injections into that artery, because they extend the dissection", "Because the aortic wall is not diseased, iatrogenic dissections are usually self-limiting and have a more benign course than spontaneous type A dissection; conservative care can be considered first"],
            ["Seal the entry", "Stent the ostium with a stent that can expand enough to seal it, protruding 1–2 mm into the aorta, guided by IVUS", "Stenting the ostium can seal the entry point when the dissection started there"],
            ["Look downstream if essential", "Inject via a catheter placed in the distal vessel: a dual-lumen microcatheter, or a thrombus aspiration catheter", "Not covered"],
            ["Follow up", "Serial CT or transoesophageal echo for a large dissection, above all when it involves the ascending aorta, and careful blood pressure control", "CT after the procedure and again at 24 hours"],
            ["Surgery", "Seldom needed; the triggers are aortic regurgitation, rupture into the pericardium with tamponade, or a dissection that keeps extending (a cut-off of more than 40 mm from the ostium has been proposed)", "Propagation to the neck vessels with neurological symptoms, a new or growing effusion, severe aortic regurgitation or haemodynamic instability"],
          ],
        },
        { kind: "tip", id: "pci-cto-retro-aortocoronary-dissection" },
        { kind: "tip", id: "pci-cto-retro-no-power-injection" },
        {
          kind: "check",
          stem: "During reverse CART on a proximal RCA CTO, a test injection through the AL guide shows a stain at the RCA ostium that grows on the next cine run. The patient is stable. What is the right sequence?",
          options: [
            "Stop injecting through the guide, complete the crossing, then stent the ostium 1–2 mm into the aorta under IVUS",
            "Inject again with the power injector to see how far the stain extends before choosing a treatment",
            "Call the surgeons for emergency aortic root replacement, as you would for a spontaneous type A dissection",
            "Withdraw the guide from the RCA and finish the case retrogradely, injecting the RCA only through its microcatheter",
          ],
          answer: 0,
          explanation:
            "Injections through the guide extend the dissection plane, so they stop; once the occlusion is crossed, stenting the ostium with 1–2 mm protrusion seals the entry, and IVUS confirms coverage. Brilakis reserves surgery for aortic regurgitation, tamponade or extension beyond about 40 mm; Oxford notes that iatrogenic dissections have a more benign course than spontaneous type A dissection, and Brilakis notes that PCI-induced aorto-coronary dissections rarely need surgery. Withdrawing the guide gives up the access you need to stent and seal the ostium; if the distal vessel must be seen, inject only through a dual-lumen microcatheter or aspiration catheter placed in the distal vessel, never through the guide.",
        },
        {
          kind: "table",
          caption: "In-hospital major events by retrograde crossing technique (Allana 2023, 4,058 procedures)",
          head: ["Technique", "In-hospital major events"],
          rows: [
            ["Retrograde true lumen crossing", "2.1%"],
            ["'Just marker' antegrade crossing (term not defined in the abstract)", "0.8%"],
            ["Conventional reverse CART", "5.5%"],
            ["Contemporary reverse CART", "3.0%"],
            ["Extended reverse CART", "2.1%"],
            ["Guide extension reverse CART", "3.2%"],
            ["CART", "4.1%"],
          ],
        },
        {
          kind: "p",
          text: "The authors concluded that retrograde true lumen puncture was the safest retrograde crossing strategy. These are registry figures, not a randomised comparison: the technique was chosen for the lesion in front of the operator.",
        },
        {
          kind: "pitfalls",
          items: [
            "Repeating the same balloon and wire for a long time without imaging to understand why the wires will not meet.",
            "Antegrade contrast injection into a dissected or dilated proximal segment, especially with a power injector.",
            "Letting the retrograde wire wander into the subintimal space at the ostium and into the aortic wall.",
            "Advancing devices over a retrograde wire before confirming it is in the proximal true lumen.",
          ],
        },
        {
          kind: "pearl",
          text: "Make the target big and the distance short: an IVUS-sized antegrade balloon and a guide extension brought close to the overlap can turn some failing reverse CARTs into shorter connections.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, talk through reverse CART: where the wires must overlap, how you will size the antegrade balloon, and the three things you will do if the retrograde wire will not enter (IVUS, guide extension, change of type). Then state your actions if a stain appears at the RCA ostium.",
        },
        { kind: "video", id: "xV0bnhycH1c", note: "Manual of CTO PCI 8.3.6: reverse CART troubleshooting." },
        { kind: "video", id: "l1ZJbZPIBoc", note: "Case 5: IVUS guidance for retrograde CTO PCI." },
        { kind: "video", id: "p5nnVIbUmTQ", note: "Case 10: retrograde via SVG and aortocoronary dissection." },
        { kind: "video", id: "aFuIxrXtaSM", note: "Brilakis: CTO retrograde techniques (Dallas CVI 2016)." },
        {
          kind: "keypoints",
          items: [
            "Retrograde wiring suits short occlusions, especially with a tapered distal cap.",
            "Reverse CART: antegrade balloon makes the space, retrograde wire enters it after deflation; CART, the original technique, is by name its converse.",
            "Conventional, directed and extended reverse CART differ in balloon size and where re-entry happens.",
            "Failing reverse CART: IVUS for mechanism and balloon size, guide extension to shorten the gap, anchoring, or extend the dissection.",
            "Aorto-coronary dissection: stop injections through the guide (a distal check only through a catheter in the distal vessel), stent the ostium protruding 1–2 mm with IVUS, image the aorta; surgery rarely.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-connect",
      title: "Connecting the two sides: externalisation and portal techniques",
      minutes: 14,
      topics: ["cto-reverse-cart"],
      sources: [B("21.8"), B("27.4"), B("30.6"), B("30.7"), B("30.18"), B("30.2")],
      refs: [...BRILAKIS, "ungureanu-portal-techniques-2025"],
      blocks: [
        {
          kind: "p",
          text: "Once the retrograde wire is in the antegrade guide, the CTO is crossed but not yet treatable. Balloons and stents go in from the antegrade side, so you need either a wire that runs all the way from one guide to the other (externalisation) or an antegrade wire across the occlusion (antegrade conversion). How you make the connection decides how much strain falls on the collateral and the donor artery.",
        },
        {
          kind: "steps",
          title: "Classic externalisation",
          items: [
            {
              title: "1. Retrograde microcatheter into the antegrade guide",
              detail: "Follow the retrograde wire with the microcatheter through the occlusion and up into the antegrade guide.",
            },
            {
              title: "2. Exchange for an externalisation wire",
              detail:
                "Through the retrograde microcatheter, pass a dedicated externalisation wire (330 cm and 350 cm lengths exist, 30.7.6) and bring it out through the antegrade guide's Y-connector.",
            },
            {
              title: "3. Work over the rail from the antegrade side",
              detail:
                "Balloons and stents now travel on a wire held at both ends. The retrograde microcatheter stays across the collateral to protect it (30.6), and its tip must never meet the tip of the antegrade equipment on the same wire, or the two can interlock and trap each other (27.4.2, 30.6.6).",
            },
            {
              title: "4. Keep the tension low",
              detail:
                "Pulling on the rail strains the channel and the donor artery. Externalisation can injure the donor ostium when the retrograde microcatheter or wire is pulled back, can trap the retrograde wire under a stent in bifurcation treatment, and puts tension on the collateral that can tear a fragile channel (Ungureanu 2025).",
            },
            {
              title: "5. Collateral exit close to the distal cap",
              detail:
                "If the externalised wire crossed a collateral close to the distal cap, dilating the CTO over it may not be safe; wire the distal true lumen antegradely instead, with the help of a dual-lumen microcatheter (30.6.4).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-no-interlock" },
        {
          kind: "check",
          stem: "Over an externalised wire, you are advancing a 3.0 mm balloon into the mid-RCA. On fluoroscopy its tip is approaching the tip of the retrograde microcatheter, which sits just beyond the occlusion. What do you do?",
          options: [
            "Keep advancing: both devices are on the same wire, so they will slide past each other",
            "Stop and keep the two tips apart, pulling the retrograde microcatheter back towards the collateral first",
            "Pull hard on the antegrade end of the rail to straighten the RCA before advancing further",
            "Inflate the balloon where it is, against the microcatheter tip, to lock the two systems together for support",
          ],
          answer: 1,
          explanation:
            "Brilakis warns that antegrade equipment must never touch the tip of the retrograde microcatheter on the same wire: the two can interlock and become entrapped. Keeping them apart, with the retrograde microcatheter withdrawn to protect the collateral, avoids it. Pulling the rail taut is the tempting move, but it strains the collateral and the donor ostium.",
        },
        { kind: "h", text: "Connecting without, or instead of, classic externalisation" },
        {
          kind: "table",
          caption: "Connection options once the retrograde wire has crossed the occlusion (Ungureanu 2025, with Brilakis 30.18.5)",
          head: ["Option", "When", "How", "Watch out for"],
          rows: [
            ["Wire trapping", "The retrograde wire is in the antegrade guide but its microcatheter will not follow", "Trap the retrograde wire inside the antegrade guide with a balloon, then advance the retrograde microcatheter while pulling slightly on the trapped wire", "This raises the tension in the collateral"],
            ["Snaring", "The retrograde microcatheter has crossed the occlusion and a dedicated externalisation wire has been passed into the ascending aorta", "Catch the wire in the aorta with a snare. Three-loop snares are preferred; small (2–4 mm) snares are for coronary use and large ones (18–30 mm or 27–45 mm) for the aorta", "Only with a dedicated externalisation wire, which cannot cross lesions; can be slow"],
            ["Catch-it", "The retrograde wire has crossed but will not enter the antegrade guide in the coronary artery, or snaring has failed or is not wanted", "Advance the retrograde wire into the ascending aorta and steer it straight into the antegrade guide at the aorta's outer curve, then trap it", "Catheter work in a diseased aorta can embolise debris"],
            ["Tip-in", "The retrograde wire is in the antegrade guide but the retrograde microcatheter will not cross, or crossing it would risk the collateral", "Advance the retrograde wire into the tip of an antegrade microcatheter inside the antegrade guide, ideally at the guide's most angled outer curve; then take the antegrade microcatheter across, remove the retrograde wire and pass an antegrade wire", "The antegrade microcatheter may then need help to cross (step 4 below)"],
            ["Tip-in to a balloon or stent", "Externalisation is not wanted (for example after an epicardial crossing) or no externalisation wire is at hand, or the antegrade microcatheter will not cross after a tip-in", "The retrograde wire enters the tip of an antegrade balloon (or stent) instead of a microcatheter", "The lesion then has to be rewired antegradely; full antegrade conversion is the safest end point"],
            ["Rendezvous", "The retrograde microcatheter will not cross and the retrograde wire cannot be brought into the antegrade guide or a guide extension, or the two microcatheter tips already lie very close", "Inside the occlusion, an antegrade wire is passed into the tip of the retrograde microcatheter", "Needs the two systems close together and well aligned; if they are not, reverse CART may work better"],
            ["Deep dive rendezvous", "The antegrade microcatheter will not cross after a rendezvous, or extra support is needed for the PCI", "Advance a supportive antegrade wire through the retrograde microcatheter as far as possible, up into the retrograde guide; then pull the retrograde microcatheter back to the collateral to protect it and treat the lesion as usual", "The authors rate it easier, quicker and safer than classic externalisation, with similar support"],
            ["Antegrade microcatheter probing", "The retrograde microcatheter is already inside the antegrade guide, but externalisation is not wanted, or a second microcatheter in one ipsilateral guide is to be avoided", "Remove the retrograde wire and pass an antegrade wire into the retrograde microcatheter", "Keep the retrograde microcatheter deep or trapped, or it may slip back"],
          ],
        },
        {
          kind: "steps",
          title: "Tip-in, step by step",
          items: [
            {
              title: "1. Place the antegrade microcatheter",
              detail:
                "Position its tip at the most angled outer curve of the antegrade guide (or inside a guide extension); the retrograde wire tip and the microcatheter tip tend to meet on that outer curve. A larger-lumen microcatheter that is radiopaque to its tip makes entry easier.",
            },
            {
              title: "2. Bring the wire to it",
              detail:
                "Advance the retrograde wire, or the microcatheter over it, gently and precisely. Contact shows as buckling of the wire tip; a slight rotation helps it in. The firmest confirmation is feeling the retrograde wire stop against an antegrade wire parked 3–5 mm inside the microcatheter tip.",
            },
            {
              title: "3. If it will not go in",
              detail:
                "Poor alignment is the usual cause: reposition the microcatheter, shape the retrograde wire with a 60° bend 2–3 mm from the tip (which may mean withdrawing it to reshape), inflate a small (2.0–2.5 mm) balloon beside the microcatheter tip to push it against the outer curve, remove unneeded equipment from the guide, and magnify and collimate.",
            },
            {
              title: "4. Cross and convert",
              detail:
                "Advance the antegrade microcatheter over the retrograde wire through the occlusion. If it will not cross, add support (a guide extension, the stiff back end of a workhorse wire, trapping), dilate further, or push the microcatheter while a second operator slowly withdraws the retrograde wire. Then remove the retrograde wire and pass an antegrade workhorse wire.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-connect-options" },
        {
          kind: "check",
          stem: "After reverse CART, a soft polymer-jacketed retrograde wire has entered the antegrade guide, but the retrograde microcatheter will not pass the calcified occlusion. A colleague suggests snaring the wire in the aorta. What is the problem, and what is a better option?",
          options: [
            "Snaring needs an externalisation wire and a microcatheter that has crossed; try tip-in to an antegrade microcatheter instead",
            "Snaring is fine, but only with a single-loop snare; three-loop snares cannot capture coronary wires",
            "There is no problem: any 0.014 inch wire can be snared and externalised through the femoral sheath",
            "Snaring is contraindicated after any reverse CART; the only safe option is to stop now and plan an investment procedure later",
          ],
          answer: 0,
          explanation:
            "Snaring should be done only with a dedicated externalisation wire, and those wires cannot cross lesions, so the retrograde microcatheter must have crossed first. With the wire already in the guide but the microcatheter stuck, tip-in (or wire trapping) is the logical step. Brilakis prefers three-loop snares, so that option has it backwards.",
        },
        {
          kind: "pitfalls",
          items: [
            "Letting the antegrade balloon or stent tip touch the retrograde microcatheter tip over an externalised wire.",
            "Pulling the externalised wire taut; watch the donor guide and the collateral.",
            "Snaring a crossing wire instead of a dedicated externalisation wire.",
            "Spending a long time on any one portal technique; the authors advise limiting attempts before going back to externalisation.",
            "Pulling the retrograde system out at the end without checking the donor ostium and the collateral.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask early which connection the collateral can tolerate, judging each channel's tortuosity, size and fragility rather than its type alone: a robust channel tolerates an externalised rail, while a fragile one, whether epicardial, ipsilateral or septal, is better served by tip-in or probing and a quick antegrade conversion.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, once the retrograde wire reaches the antegrade guide, choose between externalisation, wire trapping, tip-in and antegrade microcatheter probing for a septal route and for an epicardial route, and say how you will keep the antegrade and retrograde tips apart while stenting.",
        },
        { kind: "video", id: "UXZSq2Sp4a8", note: "Case 77: wire snaring and externalisation." },
        { kind: "video", id: "T5TzHmVfqBM", note: "Case 66: retrograde 'rendez vous'." },
        { kind: "video", id: "SiFkKWM_viI", note: "Case 188: externalisation for non-CTO PCI." },
        { kind: "video", id: "EJpcDZ_GbVQ", note: "Case 218: retrograde microcatheter entrapment." },
        {
          kind: "keypoints",
          items: [
            "Externalise through the retrograde microcatheter with a dedicated 330–350 cm wire, then treat from the antegrade side.",
            "Never let antegrade and retrograde device tips meet on the same wire: interlocking and entrapment.",
            "Keep tension low: the collateral and the donor ostium take the strain.",
            "Wire in the guide but microcatheter stuck: wire trapping or tip-in; wire will not enter the guide: catch-it, or rendezvous if the microcatheter is stuck too; snare only an externalisation wire.",
            "Tip-in: meet at the guide's outer curve; rendezvous: meet inside the occlusion; probing: antegrade wire into the retrograde microcatheter.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-retrograde-complications",
      title: "CTO complications: the donor artery, collateral perforation and septal haematoma",
      minutes: 16,
      topics: ["cto-complications"],
      sources: [B("26"), B("26.1"), B("26.2"), B("26.4"), B("26.5"), B("26.6"), B("21.6"), B("21.8"), B("21.10"), B("27.1"), B("27.2"), B("27.4"), B("30.18"), O_CTO, O_PERF],
      refs: [...BOOKS, "hirai-cto-perforation-2019", "allana-retrograde-2023", "doshi-septal-haematoma-2019", "wu-cto-safety-consensus-2024", "dautov-septal-surfing-2017", "wu-epicardial-perforation-2019", "al-ogaili-ipsilateral-2024", "ungureanu-portal-techniques-2025"],
      blocks: [
        {
          kind: "p",
          text: "Retrograde work puts equipment in two arteries and a collateral at once, so it adds complications that ordinary PCI does not have: the donor artery can thrombose, dissect or become ischaemic, the collateral can perforate or bleed into the septum, and equipment can be lost or trapped in the channel. General perforation management (Ellis grades, covered stents, pericardiocentesis) is taught in cm-perforation; this lesson covers what is specific to CTO and retrograde work.",
        },
        {
          kind: "list",
          items: [
            "**How common.** Perforations are common in CTO PCI but most do no harm; tamponade complicates about 0.3% of CTO procedures overall and about 1.3% of retrograde ones (26). Oxford puts perforation at 0.3% of all PCI, commoner in complex cases such as CTOs, with half caused by wires.",
            "**Where they happen.** Brilakis classifies perforations by location because location drives treatment: large vessel, distal vessel, and collateral (septal or epicardial); the Ellis grades were not designed for collateral channels (26.1).",
            "**Which ones matter.** In 1,000 consecutive CTO procedures with core-laboratory review (Hirai 2019), 8.9% had an angiographic perforation and about half of those needed treatment; major events followed 28.0% of perforations and in-hospital death 10.1%. Larger size, a proximal or collateral location and high-risk shapes went with harm.",
            "**Retrograde is not always to blame.** In the same study, 61% of the perforations that other classifications called retrograde were actually caused by antegrade manoeuvres; Brilakis also notes that some complications counted in retrograde cases come from the antegrade attempts (21.8.4).",
            "**One advantage.** Occluding a perforated CTO vessel usually causes no new ischaemia, which leaves time to try treatments in sequence and prepare equipment (26).",
            "**Spotting a wire outside the vessel.** Oxford's clues are an abnormal wire course or motion through the cardiac cycle and multiple ventricular ectopics (Oxford ch 8). Some perforations are not recognised during the case and present insidiously, on the ward, with falling blood pressure and tamponade (Oxford ch 10).",
            "**The current consensus.** A 2024 global consensus on CTO safety (Wu 2024) covers set-up, guide-related vessel injury, hydraulic dissection, haematoma expansion and aortic dissection, haemodynamic collapse, side branch occlusion, perforation, equipment entrapment, access, contrast nephropathy, radiation, when to stop and proctorship; its full text was not available for this lesson, so its recommendations are not reproduced here.",
          ],
        },
        { kind: "h", text: "The donor artery" },
        {
          kind: "table",
          head: ["Threat", "Why it happens", "Prevent", "Recognise and act"],
          rows: [
            ["Thrombosis", "Wires and microcatheters sit in the donor for a long time", "ACT above 350 s (Brilakis's figure for his analyser) checked every 20–30 minutes; treat donor lesions on the route first (21.3, 21.10)", "Loss of flow in the donor and ischaemia in two territories; inject the donor, check the ACT"],
            ["Ischaemia", "Equipment fills a dominant collateral, or the donor has a proximal lesion (21.6.4)", "Assess donor and collateral dominance beforehand; consider support in high-risk cases (cp-cto-strategy)", "Chest pain, ST change or hypotension during retrograde work: inject the donor and check the ACT"],
            ["Dissection or ostial injury", "Deep guide engagement, and pulling back the retrograde microcatheter or externalised wire", "Keep externalisation tension low; consider portal techniques for fragile routes (Ungureanu 2025)", "Inject the donor before and after the retrograde equipment comes out"],
            ["Lost equipment", "Delivering devices through a collateral predisposes to stent loss and wire entrapment (27.1.1)", "Do not deliver devices through the collateral unless needed", "Brilakis's Fig. 27.5: a stent intended for an LAD lesion at the crossed collateral was lost in the left main and retrieved with snares"],
          ],
        },
        {
          kind: "p",
          text: "In PROGRESS-CTO, dissection or thrombus of the donor occurred in 3.7% of ipsilateral epicardial cases against 1.2% of other retrograde cases (Al-Ogaili 2024): when the donor and the target are the same artery, a donor injury threatens the whole vessel.",
        },
        { kind: "tip", id: "pci-cto-retro-donor-ischaemia" },
        { kind: "tip", id: "pci-cto-retro-final-donor-check" },
        { kind: "h", text: "Septal perforation and septal haematoma" },
        {
          kind: "p",
          text: "Wire exits from septal channels are frequent and usually harmless: a quarter of septal crossings in the Quebec series had one, all minor (Dautov 2017). Brilakis notes that septal perforation is unlikely to have consequences, but septal haematoma, right ventricular wall haematoma and even dry tamponade have been reported (26.5). A haematoma inside the septum can grow and obstruct the outflow of either ventricle, and septal haematomas have also caused ventricular septal defects and coronary-to-ventricle fistulas (Doshi 2019). Before that case, every reported septal haematoma with outflow obstruction had been fatal.",
        },
        {
          kind: "steps",
          title: "A septal blush after retrograde work",
          items: [
            {
              title: "1. Look for it",
              detail:
                "Inject the donor once the retrograde equipment is out. In the published case (Doshi 2019), that injection showed a lacerated septal artery and a haematoma.",
            },
            {
              title: "2. Stable and small: observe",
              detail:
                "Most septal haematomas are managed conservatively. Watch the patient, the ECG and the blood pressure, and image with echocardiography.",
            },
            {
              title: "3. Growing or symptomatic: the options",
              detail:
                "The reported strategies for an enlarging septal haematoma are conservative care while the patient is stable, aspiration through a microcatheter, and coil occlusion of the septal. In the published case the haematoma grew after initial observation and both the inflow and the outflow of the septal channel were coiled. A collateral can fill from either of the arteries it joins, which is why Brilakis requires an injection from the other side once a perforation is sealed (26.4). A controlled opening of the haematoma into a ventricle with a stiff wire and small balloon was considered but not needed.",
            },
            {
              title: "4. Outflow obstruction: support the circulation",
              detail:
                "Coiling both ends does not guarantee that the haematoma stops enlarging or compressing: in that case it still almost obliterated the right ventricle after coiling, with hypotension despite fluids and two vasopressors, and a percutaneous right ventricular assist device restored the circulation until the haematoma resolved. Septal haematomas with outflow obstruction had been uniformly fatal in earlier reports, so treat a growing one as an emergency.",
            },
            {
              title: "5. Let echo decide what to drain",
              detail: "Blood inside the septum cannot be drained with a pericardial needle (the effusion in the case was trivial). Septal wire perforation can also cause dry tamponade (26.5), so echo decides whether there is a pericardial collection; drain a pericardial effusion as usual.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-septal-haematoma" },
        {
          kind: "check",
          stem: "After successful retrograde RCA CTO PCI through a septal, the final LAD injection shows a contained septal blush. The patient is pain-free with a blood pressure of 118/70 mmHg, and echo shows a small septal haematoma and no effusion. What do you do?",
          options: [
            "Pericardiocentesis now, before the haematoma can break through into the pericardium",
            "Coil the septal at its LAD end only, which stops all further filling",
            "Observe in a monitored setting with repeat echo, and coil both ends if it grows",
            "Give protamine with the guides still in the LAD and RCA",
          ],
          answer: 2,
          explanation:
            "Most septal haematomas are managed conservatively; growth or symptoms call for treatment, and in the reported case the channel was coiled at both inflow and outflow. A collateral can fill from either artery, which is why Brilakis asks for an injection from the other side after sealing (26.4). With no effusion on echo, pericardiocentesis drains nothing here. Brilakis advises against reversing heparin while equipment is still in the coronaries, because of guide and vessel thrombosis.",
        },
        { kind: "h", text: "Epicardial collateral perforation" },
        {
          kind: "p",
          text: "Brilakis rates perforation of an epicardial collateral as a serious complication of retrograde CTO PCI, because it can fill the pericardium fast and be difficult to stop (26.5). Its treatment uses the general perforation measures and the embolisation tools of distal vessel perforation, with one rule that collaterals add: they bleed from both ends.",
        },
        {
          kind: "steps",
          title: "Managing a collateral perforation",
          items: [
            {
              title: "1. General measures at once",
              detail:
                "Stop the bleeding where possible with a balloon at or just proximal to the site (dilating a torn channel is a different act and is not done), give fluids and vasopressors (and atropine for a vagal bradycardia), drain the pericardium immediately if the patient is unstable, and tell the surgeons early (26.2). A small effusion in a stable patient may be best left alone, since the raised pericardial pressure can help seal the leak; echo sizes the effusion, and an echo contrast agent can show whether bleeding continues (26.2). Stop any IIb/IIIa inhibitor or cangrelor (none should have been given in CTO work).",
            },
            {
              title: "2. Embolise the channel",
              detail:
                "Coils should be on the shelf for collateral perforation (30.18.2). Deliver them through a microcatheter in the channel. Detachable coils allow precise placement and can be recovered, whereas pushable coils cannot. Most stock coils need a 0.018 inch microcatheter and will not pass standard CTO microcatheters, so stock 0.014-compatible detachable coils or have the larger microcatheter ready; know one or two coil systems before you need them, or call an interventional radiologist; keep the coil from prolapsing into the parent vessel; and allow a few minutes for sealing before you re-inject (26.4.1, 30.18.2). For distal vessel perforation Brilakis prefers fat in most cases and coils for very large ones (26.4.1). Block and deliver puts a blocking balloon and a microcatheter through one guide; the guide needed depends on the microcatheter, from at least 6 Fr for small ones to 7 or 8 Fr for several larger ones (Table 26.2).",
            },
            {
              title: "3. Check both sides",
              detail:
                "Brilakis requires a contralateral injection after sealing any perforated branch that collaterals can feed (26.4.2); a collateral channel is fed from both ends, so inject the other artery as well. In the epicardial series (Wu 2019) the tamponades were controlled with coil embolisation and pericardiocentesis.",
            },
            {
              title: "4. Reverse heparin only at the end",
              detail:
                "In most cases not until all equipment is out and the pericardium drained, because reversal risks guide, vessel and pericardial clot (26.2). Brilakis gives protamine at 1 mg for every 100 units of heparin, at most 50 mg, no faster than 5 mg per minute; follow local protocol for the dose. Protamine can cause anaphylaxis in patients who have had NPH insulin or have a fish allergy (26.2). Oxford orders things differently: its CTO perforation sequence is balloon, pericardiocentesis and fluids, then heparin reversal and a covered stent if needed, and in coronary perforation it advises considering reversal once the vessel is occluded with a balloon (Oxford ch 8, ch 10).",
            },
            {
              title: "5. Prior CABG",
              detail:
                "Treat immediately, for example with coils or covered stents; a loculated haematoma may compress a chamber and be unreachable by needle, needing CT-guided drainage or surgery (26.6).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-retro-collateral-perforation" },
        {
          kind: "check",
          stem: "During retrograde wiring through an epicardial channel from the circumflex to the posterolateral RCA, contrast streams into the pericardium; blood pressure falls to 85/50 mmHg. After the immediate measures, you coil the channel from the circumflex side and the circumflex injection is now clean. What next?",
          options: [
            "Reverse heparin fully now, with both guides still engaged, to stop any further oozing",
            "Inject the RCA side as well, because the channel can still fill from the other artery",
            "Nothing more: a clean circumflex injection proves the perforation is sealed",
            "Dilate the channel with a small balloon to seal the tear by tamponade from inside",
          ],
          answer: 1,
          explanation:
            "A collateral connects two arteries, so a perforation can keep filling from the side you have not treated; Brilakis requires a contralateral injection to exclude continued bleeding through collaterals, and the septal haematoma case was coiled at both ends. Reversing heparin with equipment still in the coronaries risks thrombosis. Dilating the torn channel is wrong; a balloon at the site belongs to the immediate haemostatic measures, and after coiling the remaining task is to exclude filling from the other artery.",
        },
        { kind: "h", text: "Trapped wires and microcatheters" },
        {
          kind: "table",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            ["Microcatheter entrapment", "Aggressive advancement through tortuous calcified segments; two microcatheters meeting and interlocking over an externalised wire; moving a microcatheter with no wire inside (27.4.1)", "Gentle handling, no over-rotation, a wire always inside, antegrade and retrograde tips kept apart (27.4.2)", "Snares, a guide extension and trapping inside the guide, or wiring past it and ballooning; surgery if all fail; if only a tip fragment remains, stenting over it may be quickest and safest (27.4.3)"],
            ["Microcatheter fracture", "Aggressive manipulation, particularly of soft-tipped microcatheters; over-rotation (27.4.1)", "Avoid aggressive manipulation; stronger-tipped designs may fracture less", "As above"],
            ["Wire entrapment or fracture", "Entrapment: jailing under a stent, wire deformation from aggressive knuckling, pulling a looped wire back through a stent, severe calcium. Fracture: hard pulling on a trapped wire, over-rotation, or atherectomy over a kinked wire (27.2.1)", "Avoid aggressive manipulation in small branches; straighten the tip before withdrawing it through a stent; never pull hard (27.2.2)", "Do not pull hard; advance a microcatheter or balloon over it and pull gently; inflate a balloon; a second wire and balloon beside it. After a fracture, use IVUS to exclude unravelling: small fragments that have not unravelled, in collaterals or small distal branches, may be left; unravelled fragments are trapped behind a stent, or removed surgically if they reach the aorta or a critical site such as the left main (27.2.3)"],
          ],
        },
        { kind: "tip", id: "pci-cto-retro-microcatheter-entrapment" },
        { kind: "tip", id: "pci-cabg-perforation-act-now" },
        {
          kind: "pitfalls",
          items: [
            "Removing the retrograde system without a final donor injection.",
            "Treating a septal blush with pericardiocentesis, or ignoring a septal haematoma that keeps growing.",
            "Coiling one end of a perforated collateral and assuming it is sealed.",
            "Reversing heparin while guides and wires are still in the coronary arteries.",
            "Pulling hard on a trapped wire or microcatheter.",
            "Blaming every complication in a retrograde case on the retrograde route; the antegrade attempts cause many.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the last wire leaves, run a three-part check: inject the donor, inject the treated artery, and look along every collateral that was used. Then decide whether the patient needs an echo before leaving the room.",
        },
        { kind: "sim", sim: "pericardiocentesis", task: "Rehearse the bail-out for an epicardial collateral perforation with tamponade: subxiphoid echo-guided pericardiocentesis, then state how the channel will be embolised and checked from both arteries." },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, after a retrograde case, perform the final checks: donor injection, RCA injection and review of the collateral used. Describe what you would do for a contained septal blush and for contrast streaming from an epicardial channel.",
        },
        { kind: "video", id: "MMb9gjbweWc", note: "Case 97: the donor vessel." },
        { kind: "video", id: "OI_UO_CWnw0", note: "Case 22: donor vessel injury." },
        { kind: "video", id: "r0-3m3S_Hdg", note: "Case 13: epicardial collateral perforation." },
        { kind: "video", id: "8Ky6aWpqxkU", note: "Case 40: perforation during retrograde CTO PCI." },
        {
          kind: "keypoints",
          items: [
            "Tamponade risk is about 0.3% in CTO PCI overall and about 1.3% in retrograde CTO PCI.",
            "Classify by location: large vessel, distal vessel, collateral (septal or epicardial).",
            "Protect the donor: high ACT, treat donor lesions first, watch for ischaemia, low externalisation tension, final donor injection.",
            "Septal perforation is usually benign; a growing septal haematoma needs active treatment (coiling, as at both ends in the reported case, or microcatheter aspiration), and outflow obstruction may need circulatory support.",
            "Epicardial perforation is dangerous: general measures, coil embolisation, then check from both arteries.",
            "Reverse heparin only after equipment is out and the pericardium drained.",
            "Trapped equipment: never pull hard; microcatheter, balloon, snare or guide extension.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-cto-retrograde-q1",
      stem: "In the Quebec series of septal crossings by surfing, which factor influenced crossing success and time?",
      options: [
        "The Werner grade of the channel, with CC2 channels crossed far more often",
        "The tortuosity of the septal channel, whatever its Werner grade",
        "The number of septal channels visible on the dual injection",
        "Whether tip injections were made through the microcatheter first",
      ],
      answer: 1,
      explanation:
        "Dautov found that surfing crossed 81% of septal channels irrespective of Werner size; success and time depended on tortuosity. This agrees with Brilakis's point that lack of tortuosity is the strongest predictor of crossing. The Werner grade is the tempting answer but did not affect the result.",
      difficulty: 2,
      refs: ["dautov-septal-surfing-2017", "brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q2",
      stem: "A retrograde wire has crossed a septal channel but the microcatheter stops. Which response stays within Brilakis's rules?",
      options: [
        "A 2.0 mm balloon at 6 atm in the septal channel, then the same microcatheter again",
        "A balloon of 1.5 mm or less at 2–4 atm in the septal, then the microcatheter",
        "Forceful rotation of a low-profile push microcatheter through the bend",
        "Removing the wire and advancing the microcatheter alone along the same path",
      ],
      answer: 1,
      explanation:
        "Septal channels can be dilated with balloons of 1.5 mm or less at 2–4 atm. A 2.0 mm balloon at 6 atm exceeds both limits. Push-only microcatheters can fracture when spun hard, and microcatheters should never be moved without a wire inside.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q3",
      stem: "Which statement about epicardial collaterals in retrograde CTO PCI is supported by the sources?",
      options: [
        "They can be dilated like septals, but only with balloons under 1.25 mm",
        "Their perforation can cause rapid tamponade, and success through them was lower in a direct comparison",
        "They should be tried before septal channels, because their larger size is the strongest predictor of crossing",
        "Ipsilateral epicardial routes had fewer complications than other retrograde routes in PROGRESS-CTO",
      ],
      answer: 1,
      explanation:
        "Brilakis rates an epicardial collateral tear as serious because it can fill the pericardium fast and be difficult to stop, and contrasts septals, which can be dilated, with epicardials, which cannot. Benincasa found technical success of 35% through epicardial routes against 76% through septals and grafts. In PROGRESS-CTO, ipsilateral epicardial cases had more complications, not fewer.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "benincasa-epicardial-2017", "al-ogaili-ipsilateral-2024"],
    },
    {
      id: "cp-cto-retrograde-q4",
      stem: "A patent vein graft must be closed after native recanalisation. It measures 3.0 mm at a long landing zone. Which plug diameter follows the 30–50% oversizing rule?",
      options: ["3 mm", "4 mm", "5 mm", "6 mm"],
      answer: 1,
      explanation:
        "30–50% larger than 3.0 mm is 3.9–4.5 mm, so 4 mm fits. A 3 mm plug is not oversized at all; 5 mm is about 67% larger and 6 mm twice the vessel diameter. The landing zone must also be long enough to hold the device without blocking other vessels.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q5",
      stem: "What distinguishes reverse CART from CART?",
      options: [
        "In reverse CART the antegrade balloon makes the space and the retrograde wire enters it",
        "In reverse CART the retrograde balloon makes the space and the antegrade wire enters it",
        "Reverse CART needs no antegrade wire, because the retrograde wire crosses alone",
        "Reverse CART is done only through bypass grafts, CART only through collaterals",
      ],
      answer: 0,
      explanation:
        "In reverse CART a balloon on the antegrade wire, usually in the subintimal space, creates a space that the retrograde wire enters after deflation. The distractor describes the opposite arrangement, which is not reverse CART; CART, the original technique, is by name its converse. Retrograde wiring without a balloon is a different technique, and neither is tied to the type of route.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "matsuno-reverse-cart-2018"],
    },
    {
      id: "cp-cto-retrograde-q6",
      stem: "In the proposed terminology for reverse CART, what defines the 'extended' type?",
      options: [
        "A large antegrade balloon creates re-entry inside the occluded segment",
        "A small antegrade balloon and active steering of a controllable retrograde wire inside the occlusion",
        "The dissection is carried beyond the occluded segment and re-entry occurs outside it",
        "A guide extension is advanced to meet the retrograde wire inside the occlusion",
      ],
      answer: 2,
      explanation:
        "Matsuno and colleagues defined three types: conventional (large antegrade balloons, re-entry within the CTO segment), directed (small balloon and active, intentional retrograde wire tracking within the segment) and extended (dissection extended proximal or distal to the segment, with re-entry outside it). Guide extension reverse CART is a separate, equipment-defined variant.",
      difficulty: 3,
      refs: ["matsuno-reverse-cart-2018"],
    },
    {
      id: "cp-cto-retrograde-q7",
      stem: "During reverse CART, staining appears at the RCA ostium and extends into the sinus. The patient is stable. Which management matches Brilakis?",
      options: [
        "Repeat power injections to define the extent, then decide between stenting and surgery",
        "Emergency aortic root replacement, because the dissection involves the coronary ostium",
        "Stop RCA injections and stent the ostium protruding 1–2 mm into the aorta under IVUS",
        "Stop RCA injections and observe, reserving any stent for dissections beyond 40 mm",
      ],
      answer: 2,
      explanation:
        "Injections can extend the dissection; stenting the ostium with 1–2 mm protrusion seals the entry, and IVUS confirms coverage. Extension beyond about 40 mm from the ostium is one proposed trigger for surgery, not a threshold for stenting. Aortic root replacement is for spontaneous aortic dissection involving the ostia, not PCI-induced aorto-coronary dissection, which rarely needs surgery.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "cp-cto-retrograde-q8",
      stem: "The retrograde wire is in the antegrade guide, but the retrograde microcatheter cannot cross the calcified occlusion. Which option is consistent with the portal-technique review?",
      options: [
        "Snare the retrograde crossing wire in the aorta and externalise it",
        "Tip-in: advance the retrograde wire into an antegrade microcatheter at the guide's outer curve",
        "Antegrade microcatheter probing through the retrograde microcatheter tip in the antegrade guide",
        "Pull the retrograde wire out and restart with antegrade dissection and re-entry",
      ],
      answer: 1,
      explanation:
        "Tip-in is indicated exactly when the retrograde wire is in the antegrade guide but the retrograde microcatheter fails to cross. Snaring needs a dedicated externalisation wire, which in turn needs the microcatheter to have crossed. Antegrade microcatheter probing requires the retrograde microcatheter already to be inside the antegrade guide. Abandoning a crossed wire wastes the hardest step.",
      difficulty: 3,
      refs: ["ungureanu-portal-techniques-2025", "brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q9",
      stem: "Which statement about perforation in CTO PCI is correct?",
      options: [
        "Tamponade complicates about 1.3% of retrograde CTO PCI against about 0.3% of CTO PCI overall",
        "Most perforations in retrograde cases are caused by the retrograde wire in the collateral",
        "The Ellis classification was designed to grade septal and epicardial collateral perforations",
        "Occluding a perforated CTO vessel usually causes severe new ischaemia, so it is avoided",
      ],
      answer: 0,
      explanation:
        "Brilakis gives tamponade risks of about 0.3% for CTO PCI and about 1.3% for retrograde CTO PCI. Hirai found that 61% of perforations attributed to retrograde work were actually antegrade. Ellis predates collateral perforation and needs adapting. Occluding a perforated CTO vessel usually causes no new ischaemia, which buys time.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "hirai-cto-perforation-2019"],
    },
    {
      id: "cp-cto-retrograde-q10",
      stem: "A septal haematoma after retrograde PCI keeps growing although the septal was coiled at its LAD end. Which explanation should be excluded first?",
      options: [
        "The coil was too small, because a septal coil must be wider than the LAD at the origin of the septal",
        "The channel still fills from the recipient artery's side and needs coiling there too",
        "Heparin was not reversed before coiling, so the coil cannot thrombose",
        "Septal haematomas always grow for 24 hours whatever is done",
      ],
      answer: 1,
      explanation:
        "A septal collateral connects two arteries, so closing one end can leave it filling from the other; in the published case both inflow and outflow were coiled, and Brilakis requires a contralateral injection after sealing any perforation that collaterals can feed. Even complete coiling does not guarantee that a haematoma stops enlarging or compressing, as the same case showed, but filling from the other end is the treatable cause to rule out first. The other options have no support in the sources.",
      difficulty: 2,
      refs: ["doshi-septal-haematoma-2019", "brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q11",
      stem: "Which practice most directly prevents microcatheter entrapment during retrograde CTO PCI over an externalised wire?",
      options: [
        "Keeping the antegrade balloon or stent tip from touching the retrograde microcatheter tip",
        "Rotating the retrograde microcatheter continuously in one direction so that it never sticks to the wire",
        "Removing the wire from the microcatheter before repositioning it, to reduce friction",
        "Pulling the externalised wire taut so that both systems run in a straight line",
      ],
      answer: 0,
      explanation:
        "Brilakis lists interlocking of two microcatheters meeting over an externalised wire as a cause of entrapment, and warns that antegrade equipment must never contact the retrograde microcatheter tip. Over-rotation and moving a microcatheter without a wire are themselves causes of entrapment, and tension strains the collateral and donor.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-cto-retrograde-q12",
      stem: "A retrograde route through a vein graft is planned in a patient whose LAD fills only through a LIMA. Which statement is correct?",
      options: [
        "The LIMA is the preferred route because arterial grafts are larger and straighter than degenerated vein grafts",
        "Working through the LIMA to septal collaterals risks global ischaemia and is avoided when possible",
        "A perforation after bypass surgery is low risk because adhesions prevent tamponade",
        "The occluded vein graft should be recanalised first and stented for its own sake",
      ],
      answer: 1,
      explanation:
        "Brilakis advises avoiding access through a mammary graft when the collateral donor LAD depends on it, because of global ischaemia. After CABG, perforations can form loculated haematomas that compress chambers and may be lethal, so they are treated at once. Chronically occluded vein grafts are not reopened for their own sake, though they may serve as routes.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "tajti-lima-retrograde-2018"],
    },
  ],
  sims: [
    { sim: "pericardiocentesis", task: "Drain a tamponade after an epicardial collateral perforation during retrograde CTO PCI, then confirm with echo." },
    { sim: "pci-bench", task: "Choose an antegrade balloon size for reverse CART using IVUS vessel measurements, and size a vascular plug 30–50% larger than a vein graft at its landing zone." },
  ],
  caseIds: ["cp-cto-retrograde-case-septal", "cp-cto-retrograde-case-graft"],
};

export const cases: CaseStudy[] = [
  {
    id: "cp-cto-retrograde-case-septal",
    title: "RCA CTO: across the septum, through reverse CART, and out again",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, 21.6.4, 21.8.3, 21.13, 25.2.1.1, 26.4–26.5, 27.4 and 30.6; Oxford Handbook ch 10 (iatrogenic aortic dissection); Ungureanu 2025 and Doshi 2019 (see refs)",
    },
    summary:
      "Choosing a septal channel, crossing it and the occlusion, troubleshooting reverse CART, handling an ostial stain, connecting the two systems without entrapment, and dealing with a septal haematoma at the end.",
    presentation:
      "A 61-year-old man with CCS class III angina despite three antianginal drugs has a 35 mm mid-RCA CTO with a viable, ischaemic inferior wall. A previous antegrade attempt elsewhere failed with the wire subintimal. Today: femoral 8 Fr AL guide to the RCA, radial 7 Fr EBU guide to the LAD, heparin with ACT 360 s. LVEF 50%; estimated creatinine clearance 80 mL/min.",
    findings: [
      "Dual injection: a tapered proximal cap, a 35 mm occlusion with a bend, a good distal RCA with a large PDA.",
      "Septal A: almost straight, unstented origin, joins the PDA about 10 mm beyond the distal cap at an acute angle.",
      "Septal B: corkscrew, arises under an old LAD stent.",
      "A tortuous epicardial channel from the circumflex to the posterolateral branch.",
      "No significant LAD disease.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Antegrade wire escalation enters the subintimal space again. You switch to retrograde. Which channel do you choose?",
        options: [
          {
            text: "Septal A: straight, unjailed, short distance and an acute angle into the PDA near the cap.",
            best: true,
            feedback:
              "Correct. Tortuosity and size predict crossing best, and Brilakis also grades stent jailing, entry and exit angles and the distance to the distal cap; septals are the safer channels.",
          },
          {
            text: "Septal B, because corkscrew septals are larger and can be dilated if needed.",
            feedback: "Corkscrew channels predicted failure in Rathore's series, and a stent over its origin jails the entry.",
            stateDelta: { stability: -5 },
          },
          {
            text: "The epicardial channel, because it is the best-filled collateral on the films.",
            feedback: "Epicardial channels are harder and more dangerous, and cannot be balloon-dilated. With a good septal available they come later.",
            next: "s1-epicardial",
            stateDelta: { stability: -5, flags: ["epicardial-route"] },
          },
        ],
      },
      {
        id: "s1-epicardial",
        kind: "consequence",
        prompt: "A wire has crossed the tortuous epicardial channel but the microcatheter has stopped halfway. A colleague suggests a 1.25 mm balloon at 3 atm in the channel. What do you do?",
        options: [
          {
            text: "Decline: withdraw from the epicardial channel without ballooning it and go back to septal A.",
            best: true,
            feedback: "Right. Low-pressure dilation is for septals only; an epicardial tear can cause rapid tamponade. A better channel is available.",
          },
          {
            text: "Dilate the channel as suggested, as you would a septal.",
            feedback: "The epicardial channel tears and contrast collects in the pericardium; it has to be coiled and the pericardium drained before work can resume.",
            stateDelta: { stability: -25, flags: ["epicardial-perforation"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "A microcatheter is at the mouth of septal A. How do you cross it?",
        options: [
          {
            text: "Soft non-tapered polymer-jacketed wire, a large bend to enter and then a small bend; advance gently and let it find its path, retreating if it buckles.",
            best: true,
            feedback: "Correct. Two shapes for two jobs (Fig. 8.1), then surfing: in the Quebec series it crossed most septal channels, with only minor perforations.",
          },
          {
            text: "A stiff tapered CTO wire pushed firmly, because septal tissue is resistant.",
            feedback: "A penetrating wire forced through a septum is how channels are perforated; the wire exits into the septal myocardium.",
            next: "s2-stiff",
            stateDelta: { stability: -5, flags: ["septal-exit"] },
          },
          {
            text: "Wedge the microcatheter in the septal and inject 5 mL briskly to map it without checking backflow.",
            feedback: "Tip injections are useful, but only small volumes after confirming backflow, to avoid barotrauma.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2-stiff",
        kind: "consequence",
        prompt: "The stiff wire has exited the septal into the myocardium; there is a small blush. The patient is stable. What now?",
        options: [
          {
            text: "Withdraw the wire without advancing anything over it, change to a soft polymer-jacketed wire and surf another branch; keep watching the blush.",
            best: true,
            feedback: "Right. Nothing follows a wire that has left the vessel; septal exits are usually harmless but must be watched.",
          },
          {
            text: "Advance the microcatheter over the exited wire to inject and confirm the position.",
            feedback: "Advancing devices over a wire outside the vessel enlarges the hole; the blush grows.",
            stateDelta: { stability: -10, flags: ["septal-haematoma"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The wire is in the PDA, confirmed in two orthogonal views, but the microcatheter stops at a mid-septal bend. What next?",
        options: [
          {
            text: "Inflate a 1.25 mm balloon at 3 atm in the septal, then advance the microcatheter.",
            best: true,
            feedback: "Correct. Septal channels can be dilated with balloons of 1.5 mm or less at 2–4 atm.",
          },
          {
            text: "Add support with a guide extension in the LAD guide and try again.",
            acceptable: true,
            feedback: "Reasonable: a guide extension on the retrograde side increases support. Dilating the septal is the more direct fix for a tight bend.",
          },
          {
            text: "Spin the low-profile push microcatheter hard in both directions.",
            feedback: "Push-only microcatheters can fracture when rotated aggressively; the tip deforms and the microcatheter has to be exchanged.",
            stateDelta: { stability: -10, flags: ["microcatheter-damage"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The microcatheter is at the distal cap. Retrograde wiring does not cross. You set up reverse CART: the wires overlap, but after two inflations of a 2.5 mm antegrade balloon the retrograde wire still slides past. What do you do?",
        options: [
          {
            text: "IVUS to see where each wire lies and size the balloon, and bring a guide extension towards the overlap.",
            best: true,
            feedback: "Correct. IVUS shows the mechanism of failure and the right balloon size; a guide extension shortens the distance the retrograde wire must travel.",
          },
          {
            text: "A power injection through the AL guide to outline the dissection plane.",
            feedback: "Power injection after the proximal segment has been dilated risks extending the dissection back to the ostium.",
            next: "s4-ostium",
            stateDelta: { stability: -10, flags: ["aortocoronary-dissection"] },
          },
          {
            text: "Keep inflating the same balloon and retrying for another 30 minutes.",
            feedback: "Repetition without understanding the mechanism costs time, contrast and dose.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4-ostium",
        kind: "consequence",
        prompt: "A stain now extends from the RCA ostium into the right sinus. Blood pressure is stable. What do you do?",
        info: "The stain persists after the injection and is larger on the next cine frame.",
        options: [
          {
            text: "Stop injecting through the RCA guide; once the RCA is crossed, stent the ostium with the stent protruding 1–2 mm into the aorta, with IVUS to confirm coverage; image the aorta afterwards.",
            best: true,
            feedback: "Right. Injections extend the plane; an ostial stent seals the entry. CT is repeated after the case and at 24 hours (Oxford), and surgery is rarely needed.",
          },
          {
            text: "Inject again to see how far it extends.",
            feedback: "Each injection can extend the dissection plane further.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Call for emergency aortic root replacement.",
            feedback: "PCI-induced aorto-coronary dissections rarely need surgery; the triggers are aortic regurgitation, tamponade or extension beyond about 40 mm.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The retrograde wire is now in the AL guide, but the retrograde microcatheter will not pass the calcified segment. What next?",
        options: [
          {
            text: "Tip-in: place an antegrade microcatheter at the guide's outer curve and steer the retrograde wire into it, then convert to an antegrade wire.",
            best: true,
            feedback: "Correct. Tip-in is designed for exactly this, and avoids pulling on the septal.",
          },
          {
            text: "Trap the retrograde wire in the AL guide with a balloon and push the microcatheter while pulling gently.",
            acceptable: true,
            feedback: "A recognised option; it increases tension in the collateral, so use it gently.",
          },
          {
            text: "Snare the retrograde polymer-jacketed wire in the aorta and pull it out of the femoral sheath.",
            feedback: "Snaring is done only with dedicated externalisation wires, which need the microcatheter to have crossed first. The snare does not hold the crossing wire.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Suppose instead that the retrograde microcatheter had crossed and you externalised the wire. You are stenting over the rail. The tip of a 3.0 mm balloon is approaching the retrograde microcatheter tip. What do you do?",
        options: [
          {
            text: "Stop, withdraw the retrograde microcatheter towards the septal so the tips stay apart, then continue.",
            best: true,
            feedback: "Correct. Antegrade equipment must never touch the retrograde microcatheter tip on the same wire.",
          },
          {
            text: "Push on: both are on one wire and will slide past.",
            feedback: "The balloon tip jams into the microcatheter tip: the two interlock.",
            next: "s6-interlock",
            stateDelta: { stability: -10, flags: ["interlock"] },
          },
          {
            text: "Pull the externalised wire taut for support and advance quickly.",
            feedback: "Tension strains the septal channel and risks injury to the LAD ostium.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6-interlock",
        kind: "consequence",
        prompt: "The balloon and the retrograde microcatheter are locked together in the mid-RCA. What do you do?",
        options: [
          {
            text: "Do not pull hard; try freeing it with a guide extension and trapping, or snares, keeping wire position; surgery only if all fail.",
            best: true,
            feedback: "Right. These are Brilakis's retrieval tools for an entrapped microcatheter; hard pulling risks fracture.",
          },
          {
            text: "Pull both systems back hard together from each end.",
            feedback: "Forceful pulling can fracture the microcatheter and leave a fragment in the vessel.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The RCA is stented with a good result. After the retrograde equipment is removed, the LAD injection shows a contained septal blush. BP 120/72 mmHg, no pain; echo shows a small septal haematoma and no effusion. What now?",
        variants: [{ flag: "septal-haematoma", info: "The blush is in the same area as the earlier wire exit and looks larger than before." }],
        options: [
          {
            text: "Observe in a monitored bed with repeat echo; if it grows or causes symptoms, coil the channel at both ends.",
            best: true,
            feedback: "Correct. Most septal haematomas settle; in the reported case a growing one was coiled at inflow and outflow, and a collateral can fill from either artery.",
          },
          {
            text: "Pericardiocentesis to prevent tamponade.",
            feedback: "The blood is in the septum; there is nothing to drain.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Give protamine now with both guides still engaged.",
            feedback: "Reversal with equipment in the coronaries risks guide and vessel thrombosis; it is done only after equipment is out.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The RCA was opened retrogradely through a straight septal channel and stented; the septal haematoma was observed and did not grow. The patient's angina resolved at follow-up.",
    outcomeVariants: [
      { flag: "epicardial-perforation", text: "The epicardial perforation was coiled and the pericardium drained; the case was completed later through the septal." },
      { flag: "aortocoronary-dissection", text: "The aorto-coronary dissection was sealed with an ostial stent; CT after the procedure and at 24 hours showed it stable." },
      { flag: "interlock", text: "The interlocked devices were freed without fracture, at the cost of time, contrast and dose." },
      { flag: "septal-haematoma", text: "The larger septal haematoma from the early wire exit was watched with echo and settled without intervention." },
    ],
    learningPoints: [
      "Grade septal channels on tortuosity and size, and also on stent jailing, angles and distance to the cap.",
      "Two wire shapes for a septal; surf gently; dilate a stuck septal with ≤1.5 mm at 2–4 atm, never an epicardial.",
      "Failing reverse CART: IVUS for mechanism and balloon size, guide extension to shorten the gap; no power injections.",
      "Aorto-coronary dissection: stop injections through the guide, stent the ostium 1–2 mm into the aorta with IVUS, image the aorta.",
      "Connect by tip-in or trapping when the microcatheter will not cross; snare only externalisation wires; keep device tips apart.",
      "Septal haematoma: observe if stable; coil both ends if it grows; reverse heparin only after equipment is out.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "ungureanu-portal-techniques-2025", "doshi-septal-haematoma-2019", "dautov-septal-surfing-2017"],
  },
  {
    id: "cp-cto-retrograde-case-graft",
    title: "After CABG: a vein graft as the route, and then closing it",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, 18.5, 18.7, 18.8, 21.6.4, 26.4, 26.6, 30.2, 30.6 and 30.18; Nguyen-Trong 2016, Tajti 2018 and Wilson 2019 (see refs)",
    },
    summary:
      "Choosing between a mammary-dependent septal route and a vein graft, planning reach, turning back at the anastomosis, managing a perforation in a patient with prior surgery, and closing a competing graft after native recanalisation.",
    presentation:
      "A 72-year-old man with CABG 14 years ago (LIMA to LAD, vein graft to PDA) has CCS class III angina. The native RCA is occluded proximally; the vein graft to the PDA has diffuse degeneration and a recurrent mid-graft lesion despite two previous stents. The heart team favours native RCA CTO PCI.",
    findings: [
      "Native left main and proximal LAD occluded; the LAD fills only through the LIMA.",
      "Septal collaterals from the LIMA-supplied LAD to the PDA.",
      "The vein graft to the PDA is patent; its distal anastomosis meets the PDA at an acute angle pointing downstream.",
      "Proximal RCA CTO, 40 mm, ambiguous proximal cap.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which retrograde route do you plan?",
        options: [
          {
            text: "The vein graft to the PDA.",
            best: true,
            feedback: "Correct. A patent graft is an excellent conduit; working through a LIMA that supplies the donor LAD risks global ischaemia. Vein graft PCI carries a risk of distal embolisation (18.8), so pass equipment gently through the degenerated graft and watch for slow flow; the graft is closed at the end once the native artery is open.",
          },
          {
            text: "The septal collaterals, reached through the LIMA.",
            feedback: "Brilakis advises avoiding this whenever possible because of the risk of global ischaemia.",
            next: "s1-lima",
            stateDelta: { stability: -10, flags: ["lima-route"] },
          },
          {
            text: "No retrograde route; antegrade only despite the ambiguous cap.",
            acceptable: true,
            feedback: "Antegrade options exist for ambiguous caps (IVUS, move the cap), but a good graft route is available and a primary retrograde approach is often recommended here.",
          },
        ],
      },
      {
        id: "s1-lima",
        kind: "consequence",
        prompt: "With a microcatheter in the LIMA and a wire entering the first septal, the patient develops chest pain and ST depression across the anterior leads; BP 92/60 mmHg. What do you do?",
        options: [
          {
            text: "Withdraw the equipment from the LIMA and LAD at once, restore flow, and change to the vein graft route.",
            best: true,
            feedback: "Right. Equipment in a mammary graft that is the only supply to the LAD can cause global ischaemia.",
          },
          {
            text: "Give intravenous nitrate and press on, as this is a pseudolesion.",
            feedback: "Pseudolesions from straightening a LIMA do not respond to vasodilators and correct with wire withdrawal; either way the equipment must come out.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "In the planning measurements, the retrograde microcatheter would only just reach the antegrade guide through the long graft route. How do you prepare?",
        options: [
          {
            text: "90 cm guides, a 150 cm retrograde microcatheter and an externalisation-length wire; shorten a guide only if still needed.",
            best: true,
            feedback: "Correct. Short guides and long equipment solve most reach problems; shortening a guide is now reserved for graft or apical routes when the microcatheter cannot reach.",
          },
          {
            text: "Standard 100 cm guides and a 135 cm microcatheter; deal with reach if it becomes a problem.",
            feedback: "Discovering a reach problem with the wire across the occlusion wastes time and contrast.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "At the distal anastomosis the retrograde wire keeps running down the distal PDA instead of turning back towards the occlusion. What helps?",
        options: [
          {
            text: "An angled-tip microcatheter with a 120° bend at the anastomosis to direct the wire back up the PDA.",
            best: true,
            feedback: "Correct. Brilakis names the 120° angled microcatheter for vein graft routes on which the wire is biased towards the distal vessel.",
          },
          {
            text: "A stiffer tapered wire pushed harder at the anastomosis.",
            feedback: "Force at an acute anastomosis risks dissection or perforation without solving the angle.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After reverse CART and externalisation, the RCA is stented. A final injection shows a small contrast blush from a distal PDA branch; BP is 110/70 mmHg. What do you do?",
        options: [
          {
            text: "Treat it now: blocking balloon, then coil or fat embolisation of the branch through a microcatheter, and inject the graft and native artery to confirm sealing.",
            best: true,
            feedback: "Correct. After CABG a perforation can form a loculated haematoma that compresses a chamber and cannot be drained by needle; treat it immediately and check every route that can feed it. Distal perforations bleed slowly, may be missed under collimation and can cause tamponade hours later, so monitor the patient closely and give no IIb/IIIa inhibitor or cangrelor (26.4).",
          },
          {
            text: "Observe: adhesions after bypass surgery protect against tamponade.",
            feedback: "Adhesions do not prevent loculated haematomas, which can be lethal.",
            next: "s4-loculated",
            stateDelta: { stability: -15, flags: ["loculated-haematoma"] },
          },
        ],
      },
      {
        id: "s4-loculated",
        kind: "consequence",
        prompt: "Two hours later the patient is hypotensive. Echo shows a localised posterior collection compressing the left atrium; no free effusion is reachable. What now?",
        options: [
          {
            text: "Seal the bleeding branch, call the surgeons and arrange CT-guided drainage or surgery.",
            best: true,
            feedback: "Right. Loculated collections may need CT-guided drainage or surgery; the source must be sealed.",
          },
          {
            text: "Blind subxiphoid pericardiocentesis.",
            feedback: "A loculated posterior collection may be impossible to reach percutaneously by the usual route.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The native RCA result is good. The vein graft remains patent and fills the PDA competitively. What do you do?",
        options: [
          {
            text: "Close the graft with a vascular plug 30–50% larger than the graft at a landing zone long enough for the device.",
            best: true,
            feedback: "Correct. Brilakis describes deliberate graft occlusion with plugs, and a UK series reported high success and few complications after native PCI.",
          },
          {
            text: "Close the graft with a plug equal to the graft diameter.",
            feedback: "Brilakis sizes the plug 30–50% larger than the vessel at the occlusion site.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Leave the graft open and review at follow-up.",
            acceptable: true,
            feedback: "Not wrong in itself, but competitive flow may compromise the reconstructed native artery, which is the reason graft closure is advocated.",
          },
        ],
      },
      {
        id: "s6",
        prompt: "The plug sits in the graft but its position is not quite right. What can you do?",
        options: [
          {
            text: "Pull it back and reposition it before release, then release by turning the cable anticlockwise.",
            best: true,
            feedback: "Correct. The plug can be retrieved and adjusted until it is released.",
          },
          {
            text: "Release it and add coils to correct the position.",
            feedback: "Release is final; the point of a retrievable device is to get the position right first.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome: "The native RCA was recanalised retrogradely through the vein graft and the graft was closed with a plug. The patient was free of angina at follow-up.",
    outcomeVariants: [
      { flag: "lima-route", text: "The ischaemia during the LIMA attempt resolved once the equipment was withdrawn." },
      { flag: "loculated-haematoma", text: "A loculated haematoma compressing the left atrium needed CT-guided drainage after the bleeding branch was sealed." },
    ],
    learningPoints: [
      "Avoid a mammary graft route when the donor LAD depends on it.",
      "Patent vein grafts are near-ideal routes; plan reach with short guides and long equipment.",
      "An angled 120° microcatheter turns the wire back at a vein graft anastomosis.",
      "After CABG, treat any perforation at once and check every route that can feed it.",
      "Close a competing graft after native PCI with a plug 30–50% larger than the vessel; reposition before release.",
    ],
    refs: ["brilakis-manual-pci", "nguyen-trong-svg-retrograde-2016", "tajti-lima-retrograde-2018", "wilson-svg-sacrifice-2019"],
  },
];

export const tips: LabTip[] = [
  {
    id: "pci-cto-retro-septal-surf",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Retrograde septal: two bends, then surf",
    text: "In a CTO with a septal route, enter the septal with a large tip bend and cross it with a small one, using a soft non-tapered polymer-jacketed wire through a microcatheter. Advance gently and let the wire find its own path; if it stops or buckles, pull back and try another branch rather than pushing.",
    tone: "do",
    lessonId: "cp-cto-retrograde-septal",
    sources: [B("8.3"), B("21.6"), B("30.7")],
    refs: ["brilakis-manual-pci", "dautov-septal-surfing-2017"],
  },
  {
    id: "pci-cto-retro-microcatheter-stalls",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Retrograde microcatheter stuck in a septal",
    text: "If the wire has crossed a septal channel but the microcatheter will not follow, dilate the septal with a balloon of 1.5 mm or less at 2–4 atm, add support with a guide extension or anchoring, or change to a lower-profile microcatheter. Never spin a push-only microcatheter hard, and never dilate an epicardial channel.",
    tone: "do",
    lessonId: "cp-cto-retrograde-septal",
    sources: [B("21.6"), B("30.3"), B("30.6"), B("23.1")],
    refs: ["brilakis-manual-pci", "piedimonte-microcatheter-tracking-2024"],
  },
  {
    id: "pci-cto-retro-donor-ischaemia",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], requires: ["cto"] },
    title: "Retrograde CTO work: think of the donor",
    text: "Only in retrograde CTO work: new pain, ST change or hypotension may come from the donor artery, through equipment filling a dominant collateral, a low ACT or donor injury. Inject the donor and check the ACT against the retrograde target (Brilakis: above 350 s), and remember that the risk was predictable from the donor and the collateral dominance.",
    tone: "caution",
    lessonId: "cp-cto-retrograde-complications",
    sources: [B("21.6"), B("21.3"), B("21.10")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-retro-epicardial-rules",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Retrograde via an epicardial collateral: softest wire, smallest microcatheter",
    text: "Through an epicardial collateral, use an ultra-low tip-load or soft polymer-jacketed wire and a small-outer-diameter microcatheter, never balloon-dilate the channel, and plan a connection that avoids pulling on it. A tear can cause tamponade quickly.",
    tone: "caution",
    lessonId: "cp-cto-retrograde-epicardial",
    sources: [B("21.6"), B("26.5"), B("30.6"), B("30.7")],
    refs: ["brilakis-manual-pci", "ungureanu-portal-techniques-2025"],
  },
  {
    id: "pci-cto-retro-lima-donor",
    lab: "pci",
    when: { phase: ["plan"], vessel: ["RCA", "LCx"], requires: ["cto"] },
    title: "Native CTO after CABG: no retrograde route through a LIMA-dependent donor",
    text: "If the collaterals to a CTO come from an LAD that depends on a mammary graft, avoid working through that graft whenever possible: equipment in it risks global ischaemia. Look for a vein graft or another route first.",
    tone: "caution",
    lessonId: "cp-cto-retrograde-grafts",
    sources: [B("21.6"), B("18.7")],
    refs: ["brilakis-manual-pci", "tajti-lima-retrograde-2018"],
  },
  {
    id: "pci-cto-retro-svg-angled-microcatheter",
    lab: "pci",
    when: { phase: ["wire"], vessel: ["RCA", "LAD", "LCx"], requires: ["cto"] },
    title: "Native CTO with a vein graft as the route: turn back at the anastomosis",
    text: "When a patent vein graft is the retrograde route to a native CTO and the wire keeps running down the native vessel beyond the anastomosis, an angled-tip microcatheter with a 120° bend can point it back towards the occlusion.",
    tone: "do",
    lessonId: "cp-cto-retrograde-grafts",
    sources: [B("30.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-retro-svg-plug",
    lab: "pci",
    when: { phase: ["finish"], vessel: ["RCA", "LAD", "LCx"], requires: ["cto"] },
    title: "Native CTO opened, graft still competing: size the plug up",
    text: "Only after successful native CTO PCI with a patent competing vein graft: to close the graft, choose a vascular plug 30–50% larger than the graft at the landing zone, make sure the segment is long enough to hold it without blocking other vessels, and reposition as needed before releasing it by anticlockwise rotation.",
    tone: "do",
    lessonId: "cp-cto-retrograde-grafts",
    sources: [B("30.18")],
    refs: ["brilakis-manual-pci", "wilson-svg-sacrifice-2019"],
  },
  {
    id: "pci-cto-retro-reverse-cart-troubleshoot",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-subintimal"], requires: ["cto"] },
    title: "Retrograde CTO: reverse CART will not connect",
    text: "In reverse CART, if the retrograde wire will not enter the space made by the antegrade balloon, image with IVUS to see where each wire lies and size the balloon, bring a guide extension towards the overlap to shorten the gap, add anchoring, or extend the dissection and re-enter outside the occluded segment.",
    tone: "do",
    lessonId: "cp-cto-retrograde-reverse-cart",
    sources: [B("21.8"), B("21.13"), B("30.3"), B("23.1")],
    refs: ["brilakis-manual-pci", "matsuno-reverse-cart-2018", "huang-guide-extension-reverse-cart-2017"],
  },
  {
    id: "pci-cto-retro-aortocoronary-dissection",
    lab: "pci",
    when: { phase: ["wire", "complication"], event: ["dissection"], vessel: ["RCA", "LM"] },
    title: "Ostial stain spreading into the sinus: stop injecting, seal the ostium",
    text: "A stain spreading from the coronary ostium into the aortic sinus is an aorto-coronary dissection; a dissection further down the vessel is not. Stop injecting that artery, stent the ostium with the stent protruding 1–2 mm into the aorta under IVUS guidance, image the aorta afterwards and control blood pressure; surgery is rarely needed.",
    tone: "bailout",
    lessonId: "cp-cto-retrograde-reverse-cart",
    sources: [B("25.2"), O_AOD],
    refs: BOOKS,
  },
  {
    id: "pci-cto-retro-no-power-injection",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], requires: ["cto"] },
    title: "CTO: no power injection after proximal dilation",
    text: "After the proximal part of an occluded artery has been ballooned, avoid power injections, which can drive a dissection back to the ostium; use gentle hand injections and injections from the donor artery instead.",
    tone: "caution",
    lessonId: "cp-cto-retrograde-reverse-cart",
    sources: [B("25.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-retro-connect-options",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Retrograde CTO: wire in the guide, microcatheter stuck",
    text: "When the retrograde wire has entered the antegrade guide but its microcatheter will not cross, try tip-in to an antegrade microcatheter at the guide's outer curve, or trap the wire in the guide and push the microcatheter gently. Snare only dedicated externalisation wires, which need the microcatheter to have crossed first.",
    tone: "do",
    lessonId: "cp-cto-retrograde-connect",
    sources: [B("30.18")],
    refs: ["ungureanu-portal-techniques-2025", "brilakis-manual-pci"],
  },
  {
    id: "pci-cto-retro-no-interlock",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], requires: ["cto"] },
    title: "Retrograde CTO, externalised wire: keep the tips apart",
    text: "Over an externalised retrograde wire, never let the tip of an antegrade balloon or stent meet the tip of the retrograde microcatheter: they can interlock and become trapped. Keep the retrograde microcatheter back across the collateral and keep tension on the rail low.",
    tone: "caution",
    lessonId: "cp-cto-retrograde-connect",
    sources: [B("27.4"), B("30.6")],
    refs: ["brilakis-manual-pci", "ungureanu-portal-techniques-2025"],
  },
  {
    id: "pci-cto-retro-final-donor-check",
    lab: "pci",
    when: { phase: ["finish"], requires: ["cto"] },
    title: "After retrograde CTO work: inject the donor",
    text: "Before finishing a retrograde CTO case, inject the donor artery and the treated artery and look along every collateral that was used, for donor injury, a septal blush or staining from an epicardial channel.",
    tone: "do",
    lessonId: "cp-cto-retrograde-complications",
    sources: [B("21.10"), B("26.4")],
    refs: ["brilakis-manual-pci", "doshi-septal-haematoma-2019"],
  },
  {
    id: "pci-cto-retro-septal-haematoma",
    lab: "pci",
    when: { phase: ["complication", "finish"], event: ["perforation"], requires: ["cto"] },
    title: "After retrograde septal work: septal haematoma",
    text: "A contained septal blush after retrograde work through a septal is usually managed by observation with echo. If the haematoma grows or causes symptoms, treat it: coil occlusion (the reported case was coiled at both inflow and outflow; a collateral can fill from either artery, so confirm sealing with an injection from the other side) or microcatheter aspiration; outflow obstruction may need circulatory support. If echo shows the blood is inside the septum with no pericardial effusion, pericardiocentesis will not help; drain a pericardial effusion as usual.",
    tone: "bailout",
    lessonId: "cp-cto-retrograde-complications",
    sources: [B("26.5"), B("26.4")],
    refs: ["doshi-septal-haematoma-2019", "brilakis-manual-pci"],
  },
  {
    id: "pci-cto-retro-collateral-perforation",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"], requires: ["cto"] },
    title: "Retrograde CTO, collateral perforation: seal it from both sides",
    text: "An epicardial collateral perforation can cause tamponade fast: start the general measures, drain the pericardium if unstable, and embolise the channel with coils through a microcatheter. Then inject the other artery too, because a collateral can keep bleeding from the contralateral side.",
    tone: "bailout",
    lessonId: "cp-cto-retrograde-complications",
    sources: [B("26.2"), B("26.4"), B("26.5"), B("30.18")],
    refs: ["brilakis-manual-pci", "wu-epicardial-perforation-2019", "boukhris-collateral-coil-2015"],
  },
  {
    id: "pci-cto-retro-microcatheter-entrapment",
    lab: "pci",
    when: { phase: ["complication"], event: ["equipment-entrapment"] },
    title: "Trapped microcatheter or wire: never pull hard",
    text: "If a microcatheter or wire is trapped during retrograde work, do not pull hard. Use a guide extension and trapping, snares, or a balloon advanced over or beside the trapped device. After a wire fracture, check with IVUS that the coil has not unravelled: small intact fragments in collaterals may be left, unravelled ones are stented over or, if they reach the aorta or left main, removed surgically. A fractured microcatheter tip may be best covered with a stent.",
    tone: "bailout",
    lessonId: "cp-cto-retrograde-complications",
    sources: [B("27.2"), B("27.4")],
    refs: BRILAKIS,
  },
];

export const refs: Reference[] = [
  {
    id: "surmely-cart-2006",
    kind: "paper",
    citation:
      "Surmely JF, Tsuchikane E, Katoh O, et al. New concept for CTO recanalization using controlled antegrade and retrograde subintimal tracking: the CART technique. J Invasive Cardiol. 2006;18:334–338.",
    note: "PMID: 16816442 (no DOI in PubMed). Checked on PubMed: authors, title, journal, year, volume 18, issue 7, pages 334–338; abstract read (10 patients; subintimal dissection created antegradely and retrogradely, limiting the dissection to the CTO segment; retrograde approach through the best collateral; recanalisation in all; no collateral complications or in-hospital MACE). Used only to define CART as the original technique.",
    verified: true,
  },
  {
    id: "wu-cto-safety-consensus-2024",
    kind: "consensus",
    citation:
      "Wu EB, Kalyanasundaram A, Brilakis ES, Mashayekhi K, Tsuchikane E, et al. Global consensus recommendations on improving the safety of chronic total occlusion interventions. Heart Lung Circ. 2024;33:915–931.",
    url: "https://doi.org/10.1016/j.hlc.2023.11.030",
    note: "PMID: 38839467. Checked on PubMed: first five authors, title, journal, year, volume 33, issue 7, pages 915–931; abstract read (12 areas: set-up; guide-associated vessel injury; hydraulic dissection, extraplaque haematoma expansion and aortic dissection; haemodynamic collapse; side branch occlusion; perforation; equipment entrapment; vascular access; contrast-induced kidney injury; radiation; when to stop; proctorship; complements the global crossing algorithm). No PMC full text; only the abstract's scope is used.",
    verified: true,
  },
  {
    id: "wu-apcto-retrograde-2018",
    kind: "consensus",
    citation:
      "Wu EB, Tsuchikane E, Lo S, et al. Retrograde algorithm for chronic total occlusion from the Asia Pacific Chronic Total Occlusion club. AsiaIntervention. 2018;4:98–107.",
    url: "https://doi.org/10.4244/AIJ-D-17-00041",
    note: "PMID: 36798652 (PMCID PMC9890576; PMC holds the abstract only). Checked on PubMed: authors, title, journal, year, volume 4, issue 2, pages 98–107; abstract read (algorithm built around three problems: the tough proximal cap, crossing collateral channels safely and efficiently, and crossing the CTO, in particular reverse CART; describes a 'contemporary reverse CART' philosophy). Brilakis ch 21 ref 49. Only the abstract's content is used.",
    verified: true,
  },
  {
    id: "karmpaliotis-retrograde-2016",
    kind: "paper",
    citation:
      "Karmpaliotis D, Karatasakis A, Alaswad K, et al. Outcomes with the use of the retrograde approach for coronary chronic total occlusion interventions in a contemporary multicenter US registry. Circ Cardiovasc Interv. 2016;9:e003434.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.115.003434",
    note: "PMID: 27307562. Checked on PubMed: authors, title, journal, year, volume 9, issue 6, article e003434; abstract read (1,301 CTO PCIs, 11 US centres 2012–2015; retrograde used in 539 (41%), initial strategy in 46%, after failed antegrade in 54%; retrograde vs antegrade-only technical success 85% vs 94%, in-hospital MACE 4.3% vs 1.1%; predictors of retrograde technical success: suitable collaterals, no smoking, no prior CABG, LAD target). Brilakis ch 26 ref 10.",
    verified: true,
  },
  {
    id: "allana-retrograde-2023",
    kind: "paper",
    citation:
      "Allana SS, Kostantinis S, Rempakos A, et al. The retrograde approach to chronic total occlusion percutaneous coronary interventions: technical analysis and procedural outcomes. JACC Cardiovasc Interv. 2023;16:2748–2762.",
    url: "https://doi.org/10.1016/j.jcin.2023.08.031",
    note: "PMID: 38030360. Checked on PubMed: authors, title, journal, year, volume 16, issue 22, pages 2748–2762; abstract read (4,058 retrograde CTO PCIs, 44 centres 2012–2023; J-CTO 3.1; retrograde crossing successful 60.5%, lesion crossing 81.6%; successful pathways septal 62.0%, SVG 17.4%, epicardial 19.1%; technical 78.7%, procedural 76.6%; antegrade rescue 50.3% after failed retrograde crossing; in-hospital MACE 3.5%; clinical perforation 5.8%; MACE by technique: retrograde true lumen 2.1%, just-marker antegrade 0.8%, conventional reverse CART 5.5%, contemporary 3.0%, extended 2.1%, guide-extension reverse CART 3.2%, CART 4.1%; retrograde true lumen puncture judged safest).",
    verified: true,
  },
  {
    id: "matsuno-reverse-cart-2018",
    kind: "consensus",
    citation:
      "Matsuno S, Tsuchikane E, Harding SA, et al. Overview and proposed terminology for the reverse controlled antegrade and retrograde tracking (reverse CART) techniques. EuroIntervention. 2018;14:94–101.",
    url: "https://doi.org/10.4244/EIJ-D-17-00867",
    note: "PMID: 29360064. Checked on PubMed: authors, title, journal, year, volume 14, issue 1, pages 94–101; abstract read (reverse CART now the dominant retrograde wire crossing technique; three subtypes: conventional (large antegrade balloons, re-entry within the CTO segment), directed (small antegrade balloon, active intentional tracking and penetration with a controllable retrograde wire, within the segment), extended (dissection extended proximal or distal to the CTO segment, re-entry outside it)).",
    verified: true,
  },
  {
    id: "huang-collateral-tortuosity-2018",
    kind: "paper",
    citation:
      "Huang CC, Lee CK, Meng SW, et al. Collateral channel size and tortuosity predict retrograde percutaneous coronary intervention success for chronic total occlusion. Circ Cardiovasc Interv. 2018;11:e005124.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.117.005124",
    note: "PMID: 29311284. Checked on PubMed: authors, title, journal, year, volume 11, issue 1, article e005124; abstract read (216 retrograde attempts by one operator 2012–2015, 242 channels; tracking 83.5%, technical success per channel 81.4%, per patient 91.2%; AV groove 14.9%, epicardial 34.7%, septal 50.4% of attempts; only large size and lack of tortuosity independent predictors; score: large size 1 point, no tortuosity 2 points; ROC areas 0.800 and 0.752). Brilakis ch 21 ref 24.",
    verified: true,
  },
  {
    id: "rathore-retrograde-2009",
    kind: "paper",
    citation:
      "Rathore S, Katoh O, Matsuo H, et al. Retrograde percutaneous recanalization of chronic total occlusion of the coronary arteries: procedural outcomes and predictors of success in contemporary practice. Circ Cardiovasc Interv. 2009;2:124–132.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.108.838862",
    note: "PMID: 20031705. Checked on PubMed: authors, title, journal, year, volume 2, issue 2, pages 124–132; abstract read (157 patients, single centre 2003–2008; septal 67.5%, epicardial 24.8%, SVG 7.6%; channel crossed in 73.2%, retrograde success 65.6%, final success 85%; success predictors CC1, tortuosity <90°, angle with recipient <90°; failure predictors epicardial use, CC0, corkscrew, angle >90°, non-visible connection; channel dissection in 6, one coiled). Brilakis ch 21 ref 28.",
    verified: true,
  },
  {
    id: "dautov-septal-surfing-2017",
    kind: "paper",
    citation:
      "Dautov R, Urena M, Nguyen CM, et al. Safety and effectiveness of the surfing technique to cross septal collateral channels during retrograde chronic total occlusion percutaneous coronary intervention. EuroIntervention. 2017;12:e1859–e1867.",
    url: "https://doi.org/10.4244/EIJ-D-16-00650",
    note: "PMID: 27802929. Checked on PubMed: authors, title, journal, year, volume 12, issue 15, pages e1859–e1867; abstract read (Quebec programme 2010–2015, 470 CTO PCIs, 240 retrograde, septal channels in 152; surfing crossed septal channels with the wire in 81% irrespective of channel size; success and time influenced by septal tortuosity, not Werner class; a quarter had septal perforations, all minor and asymptomatic). Brilakis ch 21 ref 26.",
    verified: true,
  },
  {
    id: "piedimonte-microcatheter-tracking-2024",
    kind: "paper",
    citation:
      "Piedimonte G, Azzalini L, Ferrarotto L, et al. Applicability of J-CTO channel score to predict microcatheter tracking during retrograde percutaneous coronary intervention of chronic total occlusions: insights from the SURFING MICRO registry. Catheter Cardiovasc Interv. 2024;103:1–11.",
    url: "https://doi.org/10.1002/ccd.30928",
    note: "PMID: 38050646. Checked on PubMed: authors, title, journal, year (epub December 2023), volume 103, issue 1, pages 1–11; abstract read (189 retrograde CTO PCIs 2017–2021; for septal channels small size (adjusted OR 12.70) and continuous bends (adjusted OR 14.15) predicted microcatheter tracking failure after wire crossing; small size the only predictor for epicardial channels; failure vs success: procedural success 40.0% vs 93.9%, collateral perforation 20.0% vs 3.0%).",
    verified: true,
  },
  {
    id: "benincasa-epicardial-2017",
    kind: "paper",
    citation:
      "Benincasa S, Azzalini L, Carlino M, et al. Outcomes of the retrograde approach through epicardial versus non-epicardial collaterals in chronic total occlusion percutaneous coronary intervention. Cardiovasc Revasc Med. 2017;18:393–398.",
    url: "https://doi.org/10.1016/j.carrev.2017.03.013",
    note: "PMID: 28341287. Checked on PubMed: authors, title, journal, year, volume 18, issue 6, pages 393–398; abstract read (81 retrograde procedures in 75 patients at one centre; 38 non-epicardial (31 septal, 7 grafts), 37 epicardial (34 contralateral, 3 ipsilateral); more tortuosity in epicardials; technical success 35% vs 76%, procedural 30% vs 76%; perforations needing intervention 5% vs 0; MACE on follow-up 12.9% vs 5.4%, not significant). Brilakis ch 21 ref 29.",
    verified: true,
  },
  {
    id: "azzalini-ipsilateral-2017",
    kind: "paper",
    citation:
      "Azzalini L, Agostoni P, Benincasa S, et al. Retrograde chronic total occlusion percutaneous coronary intervention through ipsilateral collateral channels: a multicenter registry. JACC Cardiovasc Interv. 2017;10:1489–1497.",
    url: "https://doi.org/10.1016/j.jcin.2017.06.002",
    note: "PMID: 28797424. Checked on PubMed: authors, title, journal, year, volume 10, issue 15, pages 1489–1497; abstract read (126 patients, 6 centres 2011–2016, 17% of retrograde CTO PCIs; usually when no other retrograde option exists; target circumflex 42%, LAD 39%, RCA 19%; channels epicardial 76%, septal 24%; one guide 80%, ping-pong 20%; retrograde wire to distal cap 81%; technical 87%, procedural 82%; channel perforation needing intervention 5.6%, tamponade 2.4%; one death 0.8%).",
    verified: true,
  },
  {
    id: "al-ogaili-ipsilateral-2024",
    kind: "paper",
    citation:
      "Al-Ogaili A, Alexandrou M, Rempakos A, et al. Retrograde chronic total occlusion percutaneous coronary intervention via ipsilateral collaterals. Catheter Cardiovasc Interv. 2024;103:863–872.",
    url: "https://doi.org/10.1002/ccd.31019",
    note: "PMID: 38563074. Checked on PubMed: authors, title, journal, year, volume 103, issue 6, pages 863–872; abstract read (PROGRESS-CTO, 4,466 retrograde cases 2012–2023; ipsilateral epicardial collaterals attempted in 191 (4.3%), wiring success 50%; target circumflex 50% vs RCA 70% in others; most used wire an ultra-low tip-load workhorse (39%), most used microcatheter a low-profile push design (43%); dual injection 66% vs 89%; technical 76% vs 79%, procedural 74% vs 79%; complications 25.8% vs 16.4%, perforation 17.3% vs 9.0%, pericardiocentesis 3.1% vs 1.2%, donor dissection or thrombus 3.7% vs 1.2%).",
    verified: true,
  },
  {
    id: "wu-epicardial-perforation-2019",
    kind: "paper",
    citation:
      "Wu K, Huang Z, Zhong Z, et al. Predictors, treatment, and long-term outcomes of coronary perforation during retrograde percutaneous coronary intervention via epicardial collaterals for recanalization of chronic coronary total occlusion. Catheter Cardiovasc Interv. 2019;93:800–809.",
    url: "https://doi.org/10.1002/ccd.28093",
    note: "PMID: 30690863. Checked on PubMed: authors, title, journal, year, volume 93, issue S1, pages 800–809; abstract read (155 patients, one centre 2011–2017; perforation 15.5% (Ellis 1–2 41.7%, 3 58.3%); tamponade 4.5%, managed with coil embolisation and pericardiocentesis; predictors renal dysfunction, RCA CTO, Epi-CTO score ≥2; perforation not associated with worse long-term outcomes).",
    verified: true,
  },
  {
    id: "nguyen-trong-svg-retrograde-2016",
    kind: "paper",
    citation:
      "Nguyen-Trong PK, Alaswad K, Karmpaliotis D, et al. Use of saphenous vein bypass grafts for retrograde recanalization of coronary chronic total occlusions: insights from a multicenter registry. J Invasive Cardiol. 2016;28:218–224.",
    note: "PMID: 27236005 (no DOI in PubMed). Checked on PubMed: authors, title, journal, year, volume 28, issue 6, pages 218–224; abstract read (4 US centres 2012–2013; retrograde in 144 of 572 (25.2%), via SVG in 21 (14.6% of retrograde); target RCA 38%, circumflex 38%, LAD 24%; J-CTO 3.5; reverse CART the commonest re-entry technique; technical 86%, procedural 81%, retrograde via SVG successful 67%; MACE in 2 (one periprocedural MI, one fatal tamponade); median contrast 250 mL, fluoroscopy 91.6 min, procedure 214 min; two SVGs coiled for competitive flow). Brilakis ch 18 ref 29.",
    verified: true,
  },
  {
    id: "tajti-lima-retrograde-2018",
    kind: "paper",
    citation:
      "Tajti P, Karatasakis A, Karmpaliotis D, et al. Retrograde CTO-PCI of native coronary arteries via left internal mammary artery grafts: insights from a multicenter U.S. registry. J Invasive Cardiol. 2018;30:89–96.",
    note: "PMID: 29138364 (no DOI in PubMed; epub November 2017). Checked on PubMed: authors, title, journal, year, volume 30, issue 3, pages 89–96; abstract read (LIMA used in 20 of 990 retrograde CTO PCIs (2.02%) at 18 US centres; target RCA 55%; J-CTO 3.45; technical success 70% vs 81.05%, procedural 70% vs 78.19%, major in-hospital complications 5% vs 6%, none significant; guide extensions 40% vs 28%, IVUS 45% vs 31%, LV assist devices 24% vs 10%, numerically higher). Brilakis ch 21 ref 27.",
    verified: true,
  },
  {
    id: "wilson-svg-sacrifice-2019",
    kind: "paper",
    citation:
      "Wilson SJ, Hanratty CG, Spence MS, et al. Saphenous vein graft sacrifice following native vessel PCI is safe and associated with favourable longer-term outcomes. Cardiovasc Revasc Med. 2019;20:1048–1052.",
    url: "https://doi.org/10.1016/j.carrev.2019.01.025",
    note: "PMID: 30745059. Checked on PubMed: authors, title, journal, year, volume 20, issue 12, pages 1048–1052; abstract read (33 consecutive post-CABG patients at two UK institutions 2014–2018 with attempted SVG closure after successful native PCI; native vessel a CTO in 93.9%, J-CTO 3.2; closure successful in 97.0%; vascular plugs in all, a single plug in 72.7%; mean procedure time 20.1 min; target lesion failure 9.1% over mean 602 days; one transient slow flow, no other complications; rationale: competitive flow may compromise the reconstructed vessel).",
    verified: true,
  },
  {
    id: "xenogiannis-svg-plug-2020",
    kind: "case",
    citation:
      "Xenogiannis I, Nikolakopoulos I, Vemmou E, Brilakis ES. Chronic total occlusion recanalization for myocardial infarction. Catheter Cardiovasc Interv. 2020;95:1133–1135.",
    url: "https://doi.org/10.1002/ccd.28590",
    note: "PMID: 31696624 (epub November 2019). Checked on PubMed: authors, title, journal, year, volume 95, issue 6, pages 1133–1135; abstract read (84-year-old post-CABG NSTEMI with culprit at the SVG–PDA anastomosis; native RCA CTO recanalised; the SVG was then occluded with a vascular plug).",
    verified: true,
  },
  {
    id: "huang-guide-extension-reverse-cart-2017",
    kind: "paper",
    citation:
      "Huang Z, Zhang B, Chai W, et al. Usefulness and safety of a novel modification of the retrograde approach for the long tortuous chronic total occlusion of coronary arteries. Int Heart J. 2017;58:351–356.",
    url: "https://doi.org/10.1536/ihj.16-337",
    note: "PMID: 28539570. Checked on PubMed: authors, title, journal, year, volume 58, issue 3, pages 351–356; abstract read (80 reverse CART cases without and 20 with a guide extension, used when the retrograde wire would not enter the antegrade guide; guide-extension group more often >20 mm (100% vs 72.5%) and bend >45° (90% vs 63.7%); technical success 100% vs 75%; one tamponade and one epicardial perforation in the guide-extension group). Brilakis ch 21 ref 50; product name in the abstract replaced by the device class.",
    verified: true,
  },
  {
    id: "ungureanu-portal-techniques-2025",
    kind: "paper",
    citation:
      "Ungureanu C, Avran A, Brilakis ES, et al. Comprehensive overview of retrograde-antegrade connection techniques without externalization in chronic total occlusion PCI: the portal techniques. Catheter Cardiovasc Interv. 2025;105:11–22.",
    url: "https://doi.org/10.1002/ccd.31346",
    note: "PMID: 39665265; PMCID PMC11694543 (full text read). Checked on PubMed: authors, title, journal, year (epub December 2024), volume 105, issue 1, pages 11–22. Used: wire trapping and its collateral tension; snaring only with dedicated externalisation wires after the retrograde microcatheter has crossed; catch-it; tip-in (indications, connection at the guide's most angulated outer curve, contact signs, antegrade wire 3–5 mm back, 60° bend 2–3 mm from the tip, 2.0–2.5 mm balloon beside the microcatheter, larger-lumen microcatheter radiopaque to the tip); antegrade microcatheter crossing aids; tip-in the balloon or stent; rendezvous; deep dive rendezvous; antegrade microcatheter probing (keep the retrograde microcatheter deep or trapped); drawbacks of externalisation (interlocking, jailing in bifurcation treatment, donor ostial injury on pullback, collateral tension); limit attempts before externalising; full antegrade conversion safest.",
    verified: true,
  },
  {
    id: "hirai-cto-perforation-2019",
    kind: "paper",
    citation:
      "Hirai T, Nicholson WJ, Sapontis J, et al. A detailed analysis of perforations during chronic total occlusion angioplasty. JACC Cardiovasc Interv. 2019;12:1902–1912.",
    url: "https://doi.org/10.1016/j.jcin.2019.05.024",
    note: "PMID: 31255554. Checked on PubMed: authors, title, journal, year, volume 12, issue 19, pages 1902–1912; abstract read (1,000 consecutive CTO PCIs, 12 centres; core-lab angiographic perforation 8.9%; 48.3% clinically significant; MAE 28.0%, in-hospital death 10.1% of perforations; clinical and MAE-associated perforations larger, more often collateral (and proximal) and high-risk in shape; 61% of perforations called retrograde by other classifications were antegrade).",
    verified: true,
  },
  {
    id: "doshi-septal-haematoma-2019",
    kind: "case",
    citation:
      "Doshi D, Hatem R, Masoumi A, Karmpaliotis D. A case report of right ventricular compression from a septal haematoma during retrograde coronary intervention to a chronic total occlusion. Eur Heart J Case Rep. 2019;3(3):ytz089.",
    url: "https://doi.org/10.1093/ehjcr/ytz089",
    note: "PMID: 31408099; PMCID PMC6764583 (full text read). Checked on PubMed: authors (PubMed indexes the fourth author as 'Karmapaliotis'; cited here under the correct spelling, Karmpaliotis), title, journal, year, volume 3, issue 3, article ytz089. Used: septal laceration found on donor injection after retrograde hardware removal; observed about 2 h, heparin not reversed (ACT fell quickly); enlarging haematoma coiled at inflow and outflow; then hypotension 70/48 mmHg despite >3 L fluid, dopamine and noradrenaline; 4.2 cm haematoma nearly obliterating the RV with trivial effusion; percutaneous RV assist device restored haemodynamics; resolution on MRI at 3 months; most septal haematomas managed conservatively; described options conservative, microcatheter aspiration, coil occlusion; controlled fenestration considered. The same case is in the Academy as pub-retrograde-cto-septal-haematoma.",
    verified: true,
  },
];
