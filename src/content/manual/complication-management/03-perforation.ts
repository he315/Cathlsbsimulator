// Module cm-perforation: perforation and tamponade (manual curriculum, track complication-management).
// Sources: Brilakis, Manual of PCI: chapter 26 (26.1 classification, causes and prevention; 26.2 general treatment and the
// universal algorithm of Fig. 26.5; 26.3 large vessel perforation with Figs 26.6 to 26.9 and Table 26.1; 26.4 distal vessel
// perforation with Figs 26.10 to 26.14 and Tables 26.2 to 26.4; 26.5 collateral perforation; 26.6 prior CABG), chapter 30
// (30.18 complication equipment: covered stents, coils, vascular plugs, the pericardiocentesis tray; 30.6 microcatheters as
// coil and fat carriers; 30.7.1 and 30.7.2 workhorse and polymer-jacketed wires; the introduction on stocking rarely used kit;
// 30.23 the complex PCI cart), and the related passages in 2.3 (pulsus paradoxus, Fig. 2.2), 3.4 (protamine), 6.8.2.12,
// 8.6.2.7, 8.8.3, 8.9.2, 8.10.3, 9.7.1.3.1, 9.7.9.3.1, 10.2, 11.1.6.4.3, 18 (introduction), 19.9.3, 19.9.5.7.2, 19.10,
// 20.8.1, 21.3, 21.6, 23.1.6, 28.1.3.2, 28.2.2.4.3 and 28.3.2. Oxford Handbook of Cardiac Catheterization and Coronary
// Intervention: ch 10 (risks of complications, hypotension, cardiac tamponade, protamine sulphate, vasovagal reaction,
// coronary perforation), ch 5 (pericardial tamponade), ch 9 (pericardiocentesis, endomyocardial biopsy), ch 8 (angioplasty
// guide wires, chronic total occlusion PCI, rotational atherectomy) and ch 4 (left ventriculography). Ellis's registry
// (ellis-1994, PubMed abstract) and the BCIS perforation analysis (kinnaird-perforation-uk-2016, PubMed abstract, new).
// Every claim is listed with its page in docs/curriculum/evidence/cm-perforation.md.
// Neighbouring modules: cm-principles-closure (acute closure and dissection), cm-flow-embolism, pm-antithrombotics (heparin,
// protamine and IV antiplatelet agents in full), pm-monitoring (the pressure trace), pm-wiring (trapping and wire control),
// cp-calcium (atherectomy), cp-cto-retrograde (collateral perforation and septal haematoma in retrograde CTO PCI in full),
// cp-prior-cabg (graft PCI), cp-complex-patients (arrest in the lab). Academy lessons this module builds on: comp-perforation
// (all four lessons), comp-case-ellis3-perforation, hd-pm-tamponade, bed-pericardiocentesis (all lessons).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];
const OXFORD = ["oxford-cath-handbook"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_PERF = O("ch 10: Coronary perforation");
const O_TAMP = O("ch 10: Cardiac tamponade");

export const module: Module = {
  id: "cm-perforation",
  title: "Perforation and tamponade",
  stage: 4,
  summary:
    "A hole in a coronary artery, step by step: sorting it by location and severity, the universal first minutes (balloon, access, support, drainage, surgeons, anticoagulation), sealing a large vessel with a covered stent through one guide or two, sealing a distal branch with fat, coils or a covered stent over its origin, the special dangers of collateral channels and of patients with bypass grafts, and recognising and draining tamponade.",
  objectives: [
    "Classify a perforation by location (large vessel, distal vessel, collateral) and by Ellis grade, and name the mechanisms that cause each type and the habits that prevent them.",
    "Run the universal sequence in the first minutes: occluding balloon, second arterial access, fluids and vasopressors, timing of pericardiocentesis, early surgical notification, and the handling of heparin, GP IIb/IIIa inhibitors and cangrelor.",
    "Deliver a covered stent to a large-vessel perforation through a single guide (block and deliver) or through two guides (ping-pong), and finish it properly.",
    "Seal a distal vessel perforation by embolisation through a microcatheter placed beside the blocking balloon, choosing between fat and coils, or by covering the bleeding branch's ostium with a covered stent in the parent vessel.",
    "Recognise why septal, epicardial and post-CABG perforations behave differently, and act accordingly.",
    "Recognise tamponade during and after a procedure, separate it from a vasovagal reaction, and perform and manage pericardiocentesis in the catheter laboratory.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-classify",
      title: "Perforation: where it is, how bad it is, and how it happens",
      minutes: 15,
      topics: ["comp-perf-classification"],
      sources: [
        B("26.1"),
        B("26.3"),
        B("26.4"),
        B("6.8"),
        B("8.6"),
        B("8.8"),
        B("8.10"),
        B("9.7"),
        B("10.2"),
        B("15.1"),
        B("19.9"),
        B("20.8"),
        B("21.8"),
        B("23.1"),
        B("28.2"),
        B("28.3"),
        B("30.7"),
        O_PERF,
        O("ch 10: Risks of complications"),
        O("ch 8: Angioplasty guide wires"),
        O("ch 8: Chronic total occlusion PCI"),
        O("ch 8: Rotational atherectomy"),
      ],
      refs: [...BOOKS, "ellis-1994", "kinnaird-perforation-uk-2016", "mikhail-perforation-copit-2022"],
      blocks: [
        {
          kind: "p",
          text: "A coronary perforation is a breach of the arterial wall through which blood and contrast escape, usually into the pericardium. Brilakis ranks it among the most feared complications of PCI because it can cause pericardial effusion and tamponade. These effusions build up quickly, so they often cause hypotension, sometimes need emergency pericardiocentesis and rarely need cardiac surgery. The Academy lesson on classification (comp-perforation) gives the Ellis grades and the general risk factors; this lesson sorts perforations the way the manuals treat them, by location first, and goes through each mechanism with the habit that prevents it.",
        },
        {
          kind: "list",
          items: [
            "**Not always classic tamponade.** Brilakis notes that a perforation can instead produce a loculated collection (especially after bypass surgery) that compresses one chamber, an intramyocardial haematoma, or bleeding into a cardiac cavity.",
            "**How often.** Oxford puts perforation at 0.3% of PCI procedures, absent from routine diagnostic work, commoner in complex cases (chronic total occlusions, ostial lesions, tortuous vessels) and with debulking, and wire-related in half. In the UK (BCIS data for England and Wales, 2006–2013), 1,762 perforations occurred in 527,121 procedures (0.33%); older age, previous CABG, left main PCI, rotational atherectomy and CTO PCI predicted it, outcomes were worse after it, and 3% needed emergency surgery. The patients who perforated were more often women; among them, death was predicted by age, diabetes, previous MI, renal disease, the need for ventilatory or circulatory support, use of a glycoprotein IIb/IIIa inhibitor, and the type of stent.",
            "**Across many series.** A meta-analysis of 67 all-comer PCI studies (5.57 million procedures, 1982–2020) found a pooled perforation rate of 0.39%, about 1 in 250 PCIs. About a fifth of perforations led to tamponade, Ellis III made up 43% of them, and mortality was 7.5%. Female sex, hypertension, chronic kidney disease and previous CABG were risk factors; distal wire exit was the commonest cause (37%), followed by balloon catheters (28%); covered stents were used in 25% and emergency surgery in 17%, far more than the 3% of the UK data.",
            "**Who is at risk.** Women and older patients were over-represented among perforations both in Ellis's registry and in the BCIS data.",
            "**CTO work.** Perforations are frequent in CTO PCI but most do no harm; Brilakis gives a tamponade risk of about 0.3%, rising to about 1.3% with the retrograde approach. Because balloon occlusion of a perforated CTO target vessel usually causes no ischaemia, it buys time to prepare equipment and try strategies in sequence.",
            "**Diagnostic catheterisation.** Oxford lists cardiac tamponade among its serious complications at 0.1%.",
          ],
        },
        { kind: "h", text: "Step 1: name the location, because the location picks the treatment" },
        {
          kind: "table",
          caption: "The three locations (Brilakis 26.1) and where each leads. The 75/25 split comes from one series cited by Brilakis; in the meta-analysis above, distal wire exit was the commonest single cause (37%), so do not treat the split as universal.",
          head: ["Location", "What has torn", "Share in one series", "Definitive treatment after the balloon"],
          rows: [
            ["Large vessel", "The main epicardial artery at the treated segment, usually from a device", "75%", "Covered stent; prolonged balloon inflation; in expert hands, a dissection plane created to seal it"],
            ["Distal vessel", "A small distal branch, usually by the wire tip or a device that followed it", "25%", "Embolisation (fat, coils and other material), or a covered stent in the parent vessel over the branch ostium"],
            ["Collateral", "A septal or an epicardial collateral channel (a complication of retrograde CTO PCI)", "Not given", "Septal: usually no consequence, though haematomas of the septum or the right ventricular wall and even dry tamponade are on record. Epicardial: serious, can cause rapid tamponade; coils should be available (30.18.2); full treatment in the retrograde CTO module (cp-cto-retrograde)"],
          ],
        },
        { kind: "h", text: "Step 2: grade the severity (Ellis)" },
        {
          kind: "table",
          caption: "The Ellis grades, with what Ellis's own 1990–91 registry found (an older device era, so read the outcomes as historical)",
          head: ["Grade", "What you see", "In Ellis's registry (death / MI / tamponade)"],
          rows: [
            ["Class I", "A crater outside the lumen, with no linear staining that would suggest a dissection", "0% / 0% / 8%"],
            ["Class II", "A blush in the pericardium or the myocardium, without an exit hole of 1 mm or more", "0% / 14% / 13%"],
            ["Class III", "Contrast streaming freely through an exit hole of 1 mm or more", "19% / 50% / 63% (non-cavity-spilling)"],
            ["Class III, cavity spilling", "The leak empties into a cardiac chamber or vessel: coronary sinus, right ventricle, left ventricle", "Not separately reported in the abstract"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Cavity spilling is not automatically benign.** Brilakis shows a wire and microcatheter perforation draining into the coronary sinus that made the patient hypotensive and needed coil occlusion of the vessel (Fig. 26.4).",
            "**The grades were built for native arteries.** Brilakis notes they must be adapted for situations Ellis did not consider, such as septal and epicardial collateral channels.",
            "**Delayed tamponade.** In Ellis's registry, 2 of the 15 tamponades came within 24 hours after the patient had left the laboratory, and the authors advised observation for at least 24 hours. Grade I and II perforations occasionally did badly too.",
            "**The rest of Ellis's registry.** Perforation occurred in 0.5% of 12,900 procedures, and was commoner with devices that remove or ablate tissue (atherectomy, laser) than with balloon angioplasty (1.3% against 0.1%). Of the perforations, 21% were class I, 50% class II and 26% non-cavity-spilling class III. They were managed without cardiac surgery (expectantly or with balloon angioplasty) in 85%, 90% and 44% of class I, II and III respectively.",
          ],
        },
        { kind: "tip", id: "pci-perf-grade-and-locate" },
        {
          kind: "check",
          stem: "After post-dilating a mid-LAD stent, a faint stain appears in the myocardium just beyond the distal stent edge. It stays after the contrast washes out, but there is no jet and no visible hole. BP 128/74 mmHg. How do you grade it, and what is the first move?",
          options: [
            "Ellis class I; no action, because a crater cannot bleed into the pericardium",
            "Ellis class II; inflate a vessel-sized balloon at low pressure at the site, which may seal it",
            "Ellis class III; deliver a covered stent immediately without first stopping the flow",
            "Cavity spilling; observe, because blood returning to a chamber never causes tamponade",
          ],
          answer: 1,
          explanation:
            "A myocardial or pericardial blush without an exit hole of 1 mm or more is Ellis class II. Brilakis's first step for every perforation is a balloon at or proximal to the site, and a prolonged inflation alone may be enough for class I and II perforations. Class I is a crater without a blush. A covered stent is the large-vessel answer when a leak persists after prolonged inflation, not the first move. Cavity spilling can still cause hypotension (Fig. 26.4).",
        },
        { kind: "h", text: "Step 3: know the mechanism, so you can prevent the next one" },
        {
          kind: "table",
          caption: "How perforations are made, and the habit that prevents each (Brilakis 26.3, 26.4 and the chapters cited; Oxford ch 8 and 10)",
          head: ["Mechanism", "How it perforates", "Prevention"],
          rows: [
            [
              "Oversized balloon or stent, very high pressure",
              "The wall tears at the treated segment, especially in heavy calcification and in vein grafts. Brilakis shows an artery that ruptured when a non-compliant balloon was taken to 25 atm in an undilatable lesion (Fig. 26.6)",
              "Size the stent to the distal reference, not the proximal vessel (10.2); use intravascular imaging to choose balloon and stent sizes; avoid very high-pressure inflations",
            ],
            [
              "Balloon rupture",
              "More likely in complex, heavily calcified lesions and at pressures above 20 atm (9.7.9.3.1). A sudden fall in inflation pressure suggests the balloon has burst, and fluoroscopy can confirm it (9.7.9.3.1; 19.9.3); contrast jetting out of it can perforate. An inadequately prepared balloon that ruptures can also cause air embolism (19.9.3)",
              "Prevention: avoid very high pressures (consider atherectomy or lithotripsy first in heavy calcium). Response: suction at once, remove the balloon, aspirate the guide, then an angiogram straight away; if the vessel has perforated, deliver a new balloon to the site and inflate it immediately (9.7.9.3.1; 26.3)",
            ],
            [
              "Rotational atherectomy",
              "Small vessel, large burr, high speed, tortuosity, wire tip too close to the lesion, extreme wire bias, wire fracture with uncontrolled ablation (19.9.5.7.2). The risk of any atherectomy also rises with thrombus, dissection and bypass grafts (23.2.4). Oxford lists severe tortuosity and coronary dissection as contraindications",
              "Avoid burr oversizing and avoid rotational atherectomy in highly tortuous vessels",
            ],
            [
              "Orbital atherectomy and laser",
              "Higher speed carries more risk (orbital). Laser perforates especially in tortuous vessels; the risk may be higher at the high settings Brilakis usually uses (80 Hz, 80 mJ/mm²) and with contrast injection, and is lower inside stents",
              "Start orbital atherectomy at the low speed (80,000 rpm) and avoid the high speed in arteries under 3.0 mm (19.9.6.6); keep laser with contrast for use within previously deployed stents (23.1.6)",
            ],
            [
              "Wire exit followed by a device",
              "A wire alone usually makes a tiny hole that seals itself; a microcatheter or balloon advanced over it enlarges the hole. Sometimes the leak appears only after a stent is placed over the area",
              "Before anything follows the wire, make sure it is inside the vessel's structure, whether in the true lumen or the subintimal space; if it has exited, withdraw and redirect it without advancing devices (21.8.1)",
            ],
            [
              "Distal wire migration",
              "The tip enters a small distal branch and the next device push or exchange drives it through. Stiff, tapered and polymer-jacketed wires do this most; Oxford warns specifically about hydrophilic wires placed very distally. Even a thin hydrophilic coating on a workhorse wire (which is not a full polymer jacket) helps delivery at the price of more vessel injury, whereas a soft tip without a polymer jacket lowers the risk of dissection and perforation (30.7.1)",
              "Watch the tip, especially with collimation and multiple wires; exchange specialty wires for a workhorse once across; trap rather than hydraulic exchange (26.4; 8.9.2). Use a polymer-jacketed wire only when you need it, and never deliver balloons or stents over one: swap it for a workhorse first (30.7.2; 15.1). Before a balloon is inflated, make sure the wire is not parked in a small branch, above all one arising close to the lesion, which the balloon could enter and burst (9.7.1.3.1)",
            ],
            [
              "Deliberate deep wiring",
              "Passing a polymer-jacketed wire through distal branches into a cavity for support carries an obvious perforation risk (9.7.8)",
              "Distal perforation is likelier when wire manipulation continues against resistance; if the wire will not pass into the cavity, pull it back gently and redirect it into another channel (9.7.8)",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Clues that the wire has left the vessel.** Oxford: an abnormal course of the wire, or abnormal motion with the cardiac cycle, and runs of ventricular extrasystoles. Brilakis: orthogonal projections and a contralateral injection help establish where the wire is (21.8.1). Oxford adds that a perforation shows as dye collecting in the pericardial space or leaving the vessel in a pulsatile way, and is usually visible at once on the angiogram.",
            "**Knuckles are safer, not safe.** A looped wire tip is less likely to perforate when it goes too far, but if it does exit, the hole is larger than a tip exit. Keep the knuckle small and within the radiopaque tip, and do not knuckle highly supportive wires (8.6.2.7); Brilakis says plainly that knuckled wires can still perforate (26.4).",
            "**Wire escalation in acute occlusions.** Brilakis starts with soft workhorse wires and avoids escalating to stiffer polymer-jacketed wires where possible, because they raise the perforation risk (20.8.1).",
            "**Collimation hides the tip.** Narrowing the field to save dose can leave the wire tip out of view, so check it at least intermittently (28.2.2.4.3; 8.10.3.1). The check matters most when delivering or withdrawing equipment is a struggle, because that is when the wire moves the most. Brilakis also mentions an imaging system that keeps full resolution in part of the screen and lower resolution over the rest, where the wire tip can still be seen.",
            "**Zero-contrast PCI.** When almost no contrast is used, Brilakis advises an echo before and after the procedure so that an effusion from an unseen perforation is not missed (28.3.2).",
          ],
        },
        { kind: "tip", id: "pci-perf-wire-tip-watch" },
        { kind: "tip", id: "pci-perf-wire-exit-no-follow" },
        { kind: "tip", id: "pci-perf-size-and-pressure" },
        {
          kind: "check",
          stem: "You are crossing a thrombotic RCA occlusion with a soft polymer-jacketed wire. In the orthogonal view the tip lies just outside the expected vessel contour; there is no contrast stain yet. Your colleague wants to push a microcatheter up to give the wire more support. What do you do?",
          options: [
            "Advance the microcatheter, because there is no extravasation and a wire hole always seals",
            "Advance a small balloon over the wire and inflate it gently to check whether it is in the lumen",
            "Withdraw the wire and redirect it, advancing nothing over it until its position in the vessel is confirmed",
            "Inject forcefully through the guide to outline the vessel and stain any perforation",
          ],
          answer: 2,
          explanation:
            "A wire that has left the vessel usually makes a small self-sealing hole; it is the microcatheter or balloon that follows it that enlarges the hole and lets blood out (Brilakis 26.3). The rule is to confirm the wire is within the vessel architecture before anything follows it, and to withdraw and redirect a wire that has exited (21.8.1). In acute occlusions Brilakis also starts with soft workhorse wires to lower the perforation risk (20.8.1).",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling a stain 'just a dissection' without looking for persistence outside the vessel after the contrast clears.",
            "Treating cavity spilling as harmless: a coronary-sinus leak can make the patient hypotensive.",
            "Sizing a stent to the proximal vessel in a tapering artery, then post-dilating the distal end at very high pressure.",
            "Following an exited wire with a microcatheter for 'support'.",
            "Collimating tightly and forgetting where the wire tip is; leaving a stiff or polymer-jacketed wire in a small branch while delivering devices.",
            "Moving on after a balloon ruptures without an immediate angiogram.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every push of a balloon, stent or microcatheter, glance at two things: the distal wire tip and the size of what you are about to inflate. Many perforations in the manuals come from one of the two, a wire tip where it should not be or a device that is too big or inflated too hard, and both can be checked in a second.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (calcified mid-RCA), keep the distal wire tip in view during every device advance, size the stent to the distal reference, and post-dilate within the stent with a balloon matched to the vessel rather than at the highest pressure available. If the lab reports a balloon rupture or a perforation, name the location and the Ellis grade aloud before you act.",
        },
        { kind: "video", id: "ELNZNLV4Vq8", note: "Manual of PCI chapter video 26.1: perforation, overall management." },
        { kind: "video", id: "G9CEV_YK6n4", note: "Elias Hanna: coronary perforation." },
        {
          kind: "keypoints",
          items: [
            "Sort a perforation by location first (large vessel, distal vessel, collateral), because location decides the definitive treatment; then grade it with Ellis.",
            "Ellis I: crater without staining; II: blush without an exit of 1 mm or more; III: streaming through 1 mm or more; III cavity spilling: into a chamber or the coronary sinus, which can still cause hypotension.",
            "Perforation complicates about 0.3% of PCI (Oxford; 0.33% in UK BCIS data), more with CTO, atherectomy, left main, older age and prior CABG.",
            "Large-vessel causes: oversizing, very high pressure, balloon rupture, atherectomy, devices following an exited wire.",
            "Distal causes: wire tips in small branches, especially stiff, tapered and polymer-jacketed wires (even a hydrophilic coating adds risk), uncontrolled exchanges and collimation that hides the tip; never stent over a polymer-jacketed wire.",
            "Prevention: distal-reference sizing and imaging, moderate pressures, confirmed wire position before devices follow, trapping, and an exchange to a workhorse wire after crossing.",
            "Watch for delayed tamponade: Ellis advised observing for at least 24 hours.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-first-minutes",
      title: "The first minutes: the universal sequence for every perforation",
      minutes: 16,
      topics: ["comp-perf-first-minutes"],
      sources: [
        B("26.2"),
        B("26.3"),
        B("26.4"),
        B("3.4"),
        B("21.3"),
        B("28.1"),
        O_PERF,
        O_TAMP,
        O("ch 10: Protamine sulphate"),
        O("ch 8: Chronic total occlusion PCI"),
      ],
      refs: [...BOOKS, "kinnaird-perforation-uk-2016"],
      blocks: [
        {
          kind: "p",
          text: "Whatever the location, the same few actions come first. Brilakis draws them as a universal algorithm (Fig. 26.5): stop the bleeding with a balloon, support the circulation, drain the pericardium if the patient is hypotensive, and warn the surgeons; only then ask whether contrast is still leaking and, if it is, treat the cause according to the location. The Academy lesson on the first minutes (comp-perforation) gives the outline; here each step is made precise, with the numbers the manuals give and the points where they differ.",
        },
        {
          kind: "steps",
          title: "The universal sequence",
          items: [
            {
              title: "1. Inflate a balloon now",
              detail: "At the perforation or just proximal to it, immediately, before more blood reaches the pericardium. Brilakis specifies a semi-compliant balloon the size of the vessel, at a pressure of 8–10 atm or less: enough to stop antegrade flow without stretching the vessel further. Keep it up for a long time, at least 10–15 minutes. For less severe perforations (Ellis I or II) this alone may seal the hole. Oxford also occludes the culprit vessel at once with a balloon, notes that prolonged inflation may be needed, and mentions perfusion balloons to limit downstream ischaemia.",
            },
            {
              title: "2. Keep the route into the vessel",
              detail: "Every definitive treatment that follows (a covered stent, a microcatheter, a second wire) reaches the hole along the wire already in the vessel or alongside the balloon sitting on it, so the wire stays. (The manuals do not state this as a separate rule; it follows from the techniques in 26.3 and 26.4.)",
            },
            {
              title: "3. Get a second arterial access in a large-vessel perforation",
              detail: "If the guide is not 8 Fr, Brilakis recommends giving strong consideration to a second arterial access, because bulky equipment such as a covered stent is likely to be needed. A second guide placed through it can carry the definitive device while the first guide keeps the balloon inflated (the 'ping-pong' technique). Confirm haemostasis with a contrast injection.",
            },
            {
              title: "4. Support the circulation",
              detail: "IV fluids and vasopressors; atropine if a vasovagal reaction slows the heart. If the pressure cannot be held while the cause is being treated, add inotropes and, in some patients, mechanical circulatory support. In cardiac arrest, start CPR (ideally with an automated chest compression device) and move to VA-ECMO if the patient does not recover promptly (Brilakis 28.1.3.1; arrest in the laboratory is taught in full in cp-complex-patients).",
            },
            {
              title: "5. Decide about drainage",
              detail: "Haemodynamic instability means immediate pericardiocentesis (Oxford: bleeding into the pericardium can cause collapse quickly; drain at once). A small effusion in a stable patient may be better left alone: the raised pericardial pressure from the blood already there may help to tamponade the hole and reduce further bleeding. The algorithm also lists autotransfusion of the drained blood with a question mark, as an option to consider. Contrast that has leaked often outlines the pericardium, so the needle can frequently be guided by fluoroscopy; echo shows the size of the effusion, guides the needle if there is time, and shows the result.",
            },
            {
              title: "6. Call the surgeons early",
              detail: "Early notification makes surgery easier to arrange if percutaneous measures fail. In UK registry data surgery was needed in only 3% of perforations, but the 3% cannot wait for a theatre to be found.",
            },
            {
              title: "7. Ask: is it still leaking?",
              detail: "If the leak has stopped after prolonged inflation, monitor the patient. If it persists, treat the cause by location: large vessel (covered stent, prolonged inflations, dissection techniques; next lesson) or distal vessel (embolisation or a covered stent over the branch origin; the lesson after). If extravasation continues despite this, reverse the anticoagulation; if that fails, surgery.",
            },
          ],
        },
        { kind: "tip", id: "pci-perf-balloon-now" },
        { kind: "tip", id: "pci-perf-second-access" },
        { kind: "tip", id: "pci-perf-support-and-call" },
        {
          kind: "check",
          stem: "A 3.5 mm non-compliant balloon at 22 atm has torn a 3.0 mm mid LAD: contrast streams into the pericardium. The balloon has been withdrawn into the guide. Which balloon tamponade matches Brilakis's specification?",
          options: [
            "Re-advance the 3.5 mm non-compliant balloon and inflate it to its rated pressure to close the tear firmly",
            "A 3.0 mm semi-compliant balloon at the tear, at no more than 8–10 atm, kept up for at least 10–15 minutes",
            "A 2.0 mm balloon at 4 atm for 30 seconds at a time, deflating between inflations to watch the leak",
            "No balloon; give protamine and fluids first, and inflate only if the patient becomes hypotensive",
          ],
          answer: 1,
          explanation:
            "Brilakis wants a semi-compliant balloon the size of the vessel, inflated at no more than 8–10 atm so that it stops antegrade flow without stretching the torn vessel, and kept up for at least 10–15 minutes; for Ellis I or II this alone may seal the hole. The oversized non-compliant balloon caused the injury. Short repeated inflations let the vessel bleed between them. Protamine is not a first step and, with equipment in the artery, risks thrombosis.",
        },
        { kind: "h", text: "Anticoagulant and antiplatelet drugs" },
        {
          kind: "list",
          items: [
            "**Stop IV antiplatelet drugs.** Brilakis: stop a GP IIb/IIIa inhibitor or cangrelor as soon as a perforation occurs. Oxford: if the GP IIb/IIIa antagonist abciximab has been given, consider giving platelets. (Brilakis lists only eptifibatide, tirofiban and cangrelor as the intravenous antiplatelet agents available in the US; none has a reversal agent, so the infusion is simply stopped: see pm-antithrombotics.)",
            "**Do not reverse heparin early (Brilakis).** In most cases reversal should wait until all interventional equipment has been removed and the pericardial blood has been fully drained, for two reasons: reversing heparin can cause thrombosis of the guide or of the target vessel, and it can make the blood in the pericardium clot, so that it can no longer be drained through a needle. In his algorithm, reversal comes only after location-specific treatment has failed to stop the leak.",
            "**Consider reversal (Oxford).** Oxford's perforation section advises considering protamine if the patient is anticoagulated; its tamponade section adds platelets and clotting factors; its CTO section says reversal and a covered stent may be necessary. The two books therefore agree that reversal has a place but differ in emphasis: Brilakis places it late and after the equipment is out, Oxford lists it among the early considerations. Follow your local protocol and decide with the team.",
            "**Choose a reversible anticoagulant for high-risk work.** For CTO PCI Brilakis prefers unfractionated heparin because it can be reversed if a severe perforation occurs; bivalirudin is best avoided because it cannot be reversed. GP IIb/IIIa inhibitors and cangrelor are not given in CTO PCI even after successful stenting, because minor wire perforations can reopen and cause a delayed effusion and tamponade.",
          ],
        },
        {
          kind: "table",
          caption: "Protamine as each source gives it (typical doses; follow your local protocol; the full drug lesson is pm-antithrombotics)",
          head: ["Source", "Dose and rate", "Cautions"],
          rows: [
            ["Brilakis 26.2 (perforation)", "1 mg for every 100 units of heparin given, up to 50 mg, at a rate of 5 mg per minute or slower", "Anaphylactic reactions in patients previously treated with NPH (isophane) insulin or with fish allergy"],
            ["Brilakis 3.4 (medications)", "1–1.5 mg per 100 units, not more than 50 mg, given slowly to reduce the risk of hypersensitivity and anaphylaxis", "Reaction risk also raised by previous protamine zinc insulin, vasectomy, severe LV dysfunction and abnormal preoperative pulmonary haemodynamics; can cause a severe fall in systemic pressure with a relative rise in pulmonary pressure, typically 5–10 minutes after the dose; methylene blue may help a patient recover from such a reaction"],
            ["Oxford ch 10", "Given intravenously over 10 minutes, up to 50 mg; each 1 mg neutralises 80–100 units if the heparin was given in the previous 15 minutes", "Heparin's half-life is about 60–90 minutes, so use less if more than 15 minutes have passed; protamine is itself anticoagulant at high doses; allergic reactions, particularly in diabetic patients who have had isophane insulin"],
          ],
        },
        { kind: "tip", id: "pci-perforation-stop-iv-antiplatelet" },
        { kind: "tip", id: "pci-protamine-only-after-equipment-out" },
        {
          kind: "check",
          stem: "A distal branch perforation is controlled by a balloon inflated proximally. A microcatheter is being prepared, the echo shows a 7 mm effusion, BP 112/70 mmHg. A colleague draws up 50 mg of protamine 'to help it clot'. What is the best response?",
          options: [
            "Give it now: reversing heparin early is the quickest way to stop a distal leak",
            "Give half the dose now and the rest once the microcatheter is in position",
            "Give it as a fast bolus so that it acts before the microcatheter reaches the branch",
            "Hold it: with equipment in the artery it risks thrombosis and clotted, undrainable pericardial blood",
          ],
          answer: 3,
          explanation:
            "Brilakis keeps reversal, in most cases, until all equipment is out of the coronary and the pericardium has been emptied, because early reversal risks thrombosis of the guide or the vessel and can make the pericardial blood clot so that it cannot be drained. In his algorithm reversal follows failure of the definitive treatment. The patient is stable with a small effusion, so the next step is the definitive seal. Protamine is never given fast: Brilakis limits it to 5 mg per minute and Oxford gives it over 10 minutes.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pulling the balloon back to 'see how it looks' every minute, letting the vessel bleed each time.",
            "Inflating an oversized non-compliant balloon at high pressure to stop the leak, and extending the tear.",
            "Waiting for an echo before inflating the balloon.",
            "Leaving a GP IIb/IIIa inhibitor or cangrelor running.",
            "Giving protamine early, fast, or with equipment still in the coronary artery.",
            "Calling the surgeons only after the percutaneous options have failed.",
            "Draining a small, stable effusion that may be helping to seal the hole, or delaying drainage in a hypotensive patient.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the sequence out loud as you do it: balloon up, second access, fluids and pressor, echo and drain if low, surgeons told. Then, and only then, decide whether the leak has stopped. A team that hears the plan prepares the covered stent, the microcatheter and the pericardiocentesis kit in parallel instead of in turn.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, when a perforation is raised: inflate a semi-compliant balloon matched to the vessel at or just proximal to the site at 8–10 atm or less and start a 10–15 minute clock; ask for a second arterial access if the guide is smaller than 8 Fr; stop any GP IIb/IIIa inhibitor or cangrelor; give fluids and a vasopressor if the pressure falls; ask for echo and the pericardiocentesis kit; and tell the surgeons. Do not give protamine while equipment is in the artery.",
        },
        {
          kind: "sim",
          sim: "pericardiocentesis",
          task: "Drain an acute haemopericardium after a coronary perforation in a hypotensive patient: guide the needle with fluoroscopy (the leaked contrast outlines the sac) and echo, leave the drain in, and check with echo that the effusion has gone.",
        },
        { kind: "video", id: "ELNZNLV4Vq8", note: "Manual of PCI chapter video 26.1: perforation, overall management." },
        { kind: "video", id: "g0SVTMCP_r8", note: "Brilakis channel: how to treat main vessel coronary perforation, step by step." },
        { kind: "video", id: "RvjTp2FSSDM", note: "Case 160 from the Manual of PCI: blocking balloon." },
        { kind: "video", id: "xICEE9KOJrI", note: "Case 112 from the Manual of CTO Interventions: Murphy's law, perforation and dissection." },
        {
          kind: "keypoints",
          items: [
            "Balloon at or just proximal to the hole at once: semi-compliant, vessel-sized, 8–10 atm or less, at least 10–15 minutes (Brilakis); Oxford adds perfusion balloons to limit ischaemia.",
            "Large-vessel perforation with a guide smaller than 8 Fr: strongly consider a second arterial access early.",
            "Fluids and vasopressors; atropine for vagal bradycardia.",
            "Unstable: drain now. Small and stable: watching may be better, because pericardial pressure helps seal the hole. Fluoroscopy can guide the needle; echo sizes, guides and checks.",
            "Tell the surgeons early.",
            "Stop GP IIb/IIIa inhibitors and cangrelor. Brilakis delays heparin reversal until the equipment is out and the pericardium drained; Oxford lists protamine, platelets and clotting factors as considerations. All three protamine sources cap the dose at 50 mg and give it slowly (Brilakis no faster than 5 mg per minute; Oxford over 10 minutes).",
            "Use unfractionated heparin rather than bivalirudin for high-risk (CTO) work, because it can be reversed.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-large-vessel",
      title: "Large-vessel perforation: covered stents through one guide or two",
      minutes: 16,
      topics: ["comp-covered-stent"],
      sources: [B("26.3"), B("26.2"), B("30.18"), B("30"), B("30.23"), B("5.6"), B("25.2"), O_PERF, O("ch 8: Chronic total occlusion PCI")],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "When the main vessel is torn and contrast keeps leaking despite prolonged balloon inflation, the usual answer is a covered stent: a stent carrying a membrane that closes the hole from inside. The difficulty is getting a bulky device to the hole while the vessel is still bleeding. Brilakis describes two ways to do it, through one guide or through two, both built so that the balloon stops the bleeding for as long as possible.",
        },
        {
          kind: "p",
          text: "**A note on names.** Brilakis calls the single-guide technique 'block and deliver' and the two-guide technique the dual, 'ping-pong' or 'dueling' guide technique. The Academy lesson comp-perforation uses 'block-and-deliver' for the two-guide method; this module uses Brilakis's terms throughout.",
        },
        {
          kind: "steps",
          title: "The order of treatment (Brilakis 26.3)",
          items: [
            { title: "1. Balloon", detail: "Stop the bleeding as in the universal sequence." },
            { title: "2. Covered stent if it keeps leaking", detail: "If extravasation persists despite prolonged inflations, place a covered stent, delivered through one guide or two depending on whether the blocking balloon and the covered stent fit together in the guide in use." },
            { title: "3. Prolonged inflation if the covered stent cannot get there", detail: "Prolonged balloon inflation may still bring haemostasis. Heparin is usually not reversed until haemostasis is achieved and all equipment is out of the coronary artery. If bleeding into the pericardium continues, emergency surgery may be needed." },
            { title: "4. Dissection techniques (experts only)", detail: "Another option is to open a subintimal plane on either side of the hole (before or beyond it), which can help close it off. Brilakis restricts this to operators with extensive experience of CTO dissection and re-entry." },
            { title: "Also available: occluding the vessel", detail: "Coils can stop a large-vessel perforation by occluding the vessel (30.18.2), and a vascular plug can occlude a vessel in an emergency (30.18.3). Oxford's teaching for perforation in general: balloon, consider reversal, covered stents, and coils for small-vessel leaks." },
          ],
        },
        { kind: "h", text: "Covered stent designs (as described in 2020; check what your laboratory stocks and the device instructions)" },
        {
          kind: "p",
          text: "In 2020 both coronary covered stents sold in the US had been approved under a humanitarian device exemption for use in large-vessel perforation; a third, single-layer design was available in Europe (30.18.1).",
        },
        {
          kind: "table",
          caption: "The three coronary covered stent designs in Brilakis 26.3 and 30.18 (generic descriptions)",
          head: ["Feature", "Two-layer 'sandwich' (ePTFE between two steel stents)", "Single-layer polyurethane-covered", "Single-layer PTFE-covered (available in Europe)"],
          rows: [
            ["Guide needed", "6 Fr (2.8–4.0 mm sizes); 7 Fr (4.5 and 4.8 mm)", "5 Fr (2.5–4.0 mm sizes); 6 Fr (4.5 and 5.0 mm)", "5 Fr for all sizes"],
            ["Diameters and lengths", "Diameters 2.8 mm, 3.5 mm, 4.0 mm, 4.5 mm and 4.8 mm; lengths 16, 19 and 26 mm", "Diameters 2.5 mm, 3.0 mm, 3.5 mm, 4.0 mm, 4.5 mm and 5.0 mm; lengths 15, 20 and 26 mm", "Crossing profile 1.1–1.4 mm"],
            ["Delivery", "Bulky and hard to deliver; may not pass through stents already in place; needs excellent guide support and often a distal anchor or a guide extension", "Easier to deliver, but can occasionally slip off its balloon on the way", "Cobalt-chromium open-cell stent; the membrane is clamped at both ends"],
            ["Expansion", "At least 15 atm (its nominal pressure); higher pressures held for up to 60 seconds, ideally with IVUS, are preferred; it shortens by up to 1.6 mm at each end (3.2 mm in total at 15 atm), so overlap stents generously over a long tear", "Post-dilatable to at most 3.50 mm (2.5 and 3.0 mm sizes), 4.65 mm (3.5 and 4.0 mm) and 5.63 mm (4.5 and 5.0 mm)", "Not described in detail"],
          ],
        },
        {
          kind: "p",
          text: "**Which technique?** If the blocking balloon and the covered stent can travel together through the guide in use, use one guide; for the sandwich design that usually means an 8 Fr guide. Otherwise use two. For the two-guide technique Brilakis suggests a second guide ideally of 6 Fr or larger for the polyurethane-covered stent and 8 Fr for the sandwich design. He notes that the two-guide technique is often required for the sandwich design, although the balloon and the covered stent can both pass through an 8 Fr guide.",
        },
        {
          kind: "steps",
          title: "One guide: 'block and deliver' (Brilakis Fig. 26.7)",
          items: [
            { title: "1. Block", detail: "The balloon is inflated at the perforation and the bleeding stops." },
            { title: "2. Second wire to the guide tip", detail: "Advance a second wire through the same guide to its tip." },
            { title: "3. Cross with the second wire", detail: "Deflate the blocking balloon briefly, pass the second wire beyond the perforation, and reinflate." },
            { title: "4. Bring the covered stent up", detail: "Load the covered stent on the second wire and advance it to the guide tip and then towards the inflated balloon. The inflated balloon acts as a distal anchor, which also gives strong support for this bulky device." },
            { title: "5. Swap", detail: "Deflate the blocking balloon and advance the covered stent across the perforation. If it will not reach, reinflate the balloon to stop the bleeding while you add other delivery aids." },
            { title: "6. Clear the first system", detail: "Withdraw the blocking balloon and the first wire." },
            { title: "7. Deploy and post-dilate", detail: "Deploy the covered stent and post-dilate it; the sandwich design needs high-pressure post-dilatation to seal." },
            { title: "8. Confirm and finish", detail: "Inject to confirm the seal. Stent any residual dissection beside the covered stent, proximally or distally, because it can become a re-entry point for bleeding." },
          ],
        },
        {
          kind: "steps",
          title: "Two guides: 'ping-pong' (Brilakis Fig. 26.8)",
          items: [
            { title: "1. Block", detail: "The balloon is inflated at the perforation through the first guide." },
            { title: "2. Make room", detail: "Pull the first guide back into the aorta, leaving its balloon inflated in the artery." },
            { title: "3. Second guide to the ostium", detail: "Through the second arterial access, engage the same ostium with the second guide, and load a second wire and the covered stent." },
            { title: "4. Cross with the second wire", detail: "Deflate the blocking balloon briefly, pass the second wire beyond the perforation, and reinflate." },
            { title: "5. Swap", detail: "Deflate and deliver the covered stent across the perforation; if it fails to reach, reinflate the blocking balloon while other delivery techniques are prepared." },
            { title: "6. Clear the first system", detail: "Withdraw the first wire and the blocking balloon." },
            { title: "7. Deploy, post-dilate, confirm", detail: "As for the single-guide technique." },
          ],
        },
        { kind: "tip", id: "pci-perf-covered-one-guide" },
        { kind: "tip", id: "pci-perf-covered-two-guides" },
        {
          kind: "check",
          stem: "A large tear in a 3.5 mm proximal RCA is blocked by a balloon in a 6 Fr guide from the right radial. The laboratory's covered stent is the two-layer (sandwich) design. How should it be delivered?",
          options: [
            "Deflate the balloon, withdraw it and pass the covered stent through the 6 Fr guide as quickly as possible",
            "Through the same 6 Fr guide beside the inflated balloon, using the balloon as a distal anchor",
            "Through a second guide, ideally 8 Fr, from a second arterial access while the first balloon stays up",
            "Leave the balloon up and coil the proximal RCA to occlude it, since covered stents are rarely needed",
          ],
          answer: 2,
          explanation:
            "The single-guide technique needs room for the blocking balloon and the covered stent together, usually an 8 Fr guide for the sandwich design. With a 6 Fr guide the answer is a second access and a second guide, ideally 8 Fr for that design, so the balloon keeps blocking until the covered stent is beside it (Brilakis Fig. 26.8). Deflating and withdrawing first lets the artery bleed for the whole delivery. Occluding a proximal RCA would sacrifice a large territory when a covered stent can seal it.",
        },
        { kind: "h", text: "After the covered stent is in" },
        {
          kind: "list",
          items: [
            "**Expand it hard.** Dilate it firmly after deployment: full expansion is what lowers its later thrombosis risk. The sandwich design is hard to expand and needs high pressure.",
            "**If contrast still leaks behind the stent,** post-dilate its shoulders so that the ends appose the wall (30.18.1.1).",
            "**Seal any residual dissection** beside the covered stent with another stent: an open dissection can let blood back in.",
            "**Do not reverse heparin while the guide, wires and fresh stents are in the artery.** Brilakis warns that reversal risks thrombosis of the guide or the target vessel (26.2), and usually withholds it until haemostasis is achieved and all equipment is out (26.3).",
            "**Expect thrombus and edge problems after a covered stent.** In Brilakis's illustrative case (Fig. 26.9), a covered stent delivered through a guide extension sealed a balloon-rupture perforation in a calcified LAD; thrombus then appeared inside the LAD stents and a dissection extended into the left main. Aspiration and left main stenting gave an excellent result, leaving a small effusion on echo.",
            "**Expect long-term problems.** Brilakis notes that covered stents carry an increased risk of restenosis and thrombosis (5.6.4 and 25.2).",
          ],
        },
        { kind: "tip", id: "pci-perf-covered-expand" },
        {
          kind: "check",
          stem: "A sandwich covered stent has been deployed across an LAD tear at nominal pressure. A small stain of contrast now appears beside the proximal end of the covered stent, and there is a short dissection flap just proximal to it. What is the next step?",
          options: [
            "Give protamine and observe, because the covered stent has done its job",
            "Post-dilate the covered stent at high pressure, including its proximal shoulder, and stent the dissection",
            "Deflate everything and pull out the wires, so that the guide can be repositioned for a final view",
            "Coil the LAD distal to the covered stent to stop any further flow through the area",
          ],
          answer: 1,
          explanation:
            "The sandwich design needs high-pressure post-dilatation to seal and to expand; Brilakis adds dilatation of the shoulders when contrast persists behind the stent, and stenting of any residual dissection, because it can be a re-entry point for bleeding. It also shortens by up to 1.6 mm at each end, which can uncover the edge. Protamine with equipment in the artery risks thrombosis, and removing the wires gives up the route for the fix.",
        },
        {
          kind: "pitfalls",
          items: [
            "Deflating the blocking balloon before the covered stent is beside it.",
            "Leaving a sandwich covered stent at its nominal 15 atm: Brilakis prefers higher pressures held for up to 60 seconds, ideally with IVUS, and under-expansion invites thrombosis.",
            "Forgetting the shortening of the sandwich design and leaving the end of a long tear uncovered.",
            "Trying to push a bulky covered stent through stents already in place without a distal anchor or guide extension.",
            "Reversing heparin while the guide, wires and fresh stents are in the coronary artery.",
            "Never having handled a covered stent before the day it is needed: Brilakis expects such kit to expire on the shelf, and still wants it in every laboratory and on the complex PCI cart.",
          ],
        },
        {
          kind: "pearl",
          text: "In any case where you might rupture a vessel (heavy calcium, atherectomy, very high pressures), have the second access site prepared and know which covered stent you stock and which guide it needs. The balloon buys minutes; what decides the outcome is how quickly the second guide and the right device appear.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (calcified mid-RCA), if a large-vessel perforation is raised: block it with a vessel-sized balloon, then state which covered stent design you would use and whether it fits beside the balloon in your guide. If it does not, describe the two-guide sequence step by step (pull back the first guide, second guide to the ostium, second wire across during a brief deflation, covered stent beside the balloon, swap, deploy at high pressure). The lab cannot yet deliver a covered stent; the request is in the lab-request file.",
        },
        { kind: "video", id: "qMaHdemNVgk", note: "Manual of PCI chapter video 26.2: large vessel perforation." },
        { kind: "video", id: "bTOyDpLGAlk", note: "Case 204 from the Manual of CTO PCI: TILT for block and deliver." },
        { kind: "video", id: "8_GGoiFS7Vo", note: "Case 170 from the Manual of PCI: covered stent did not work." },
        { kind: "video", id: "-bawP8CXlo0", note: "Case 118 from the Manual of CTO Interventions: alternative treatment of large vessel perforation." },
        {
          kind: "keypoints",
          items: [
            "Large-vessel perforation: balloon first; covered stent if it keeps leaking; prolonged inflation if the covered stent cannot be delivered; dissection techniques for experts; surgery if bleeding continues.",
            "One guide ('block and deliver') when balloon and covered stent fit together (usually 8 Fr for the sandwich design); otherwise two guides ('ping-pong').",
            "In both: second wire crosses during a brief deflation, the covered stent comes up to the inflated balloon (a distal anchor), then the swap; reinflate if the stent will not reach.",
            "Sandwich design: bulky, at least 15 atm and ideally higher for up to 60 seconds, shortens up to 1.6 mm at each end. Polyurethane design: easier to deliver, can slip off its balloon.",
            "Post-dilate hard, dilate the shoulders if it still leaks, stent residual dissections, and keep anticoagulation until the equipment is out.",
            "Covered stents carry more restenosis and thrombosis; stock them, know their guide sizes and practise with them.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-distal",
      title: "Distal vessel perforation: block, then seal with fat, coils or a covered stent",
      minutes: 18,
      topics: ["comp-distal-perf"],
      sources: [B("26.4"), B("26.2"), B("30.18"), B("30.6"), B("8.9"), B("8.10"), B("21.3"), B("21.5"), O_PERF],
      refs: [...BOOKS, "ellis-1994", "kinnaird-perforation-uk-2016"],
      blocks: [
        {
          kind: "p",
          text: "A wire tip that has gone through a small distal branch leaks slowly, often out of the field of view, and can fill the pericardium hours after the patient has left the table. Because the branch is small, it can usually be sacrificed: the standard treatment is to plug it from inside with fat or coils delivered through a microcatheter. This lesson goes through the whole procedure, from the blocking balloon to the final angiogram, and covers the alternative of a covered stent across the branch origin.",
        },
        { kind: "h", text: "Why distal perforations are treacherous" },
        {
          kind: "list",
          items: [
            "**Hard to see.** They can be difficult to diagnose, especially when collimation narrows the field (Brilakis 26.4).",
            "**Slow and late.** Blood may enter the pericardium slowly, so tamponade can appear several hours after the procedure. Oxford describes the same insidious course: progressive hypotension and tamponade back on the ward.",
            "**So:** monitor these patients closely, and do not give them a GP IIb/IIIa inhibitor or cangrelor. Ellis's registry found delayed tamponade within 24 hours and advised observation for at least that long.",
          ],
        },
        {
          kind: "steps",
          title: "Causes and prevention (Brilakis 26.4; 8.9 and 8.10)",
          items: [
            { title: "Cause: a device or wire tip in a small branch", detail: "A wire, balloon or microcatheter advanced into a small distal branch. Stiff, tapered and polymer-jacketed wires are the most likely culprits, and a knuckled wire can still exit the vessel." },
            { title: "Cause: exchanges", detail: "During over-the-wire exchanges a hydrophilic, polymer-jacketed or stiff wire can shoot forward into a small branch. Brilakis prefers trapping first and wire extensions second, and avoids the hydraulic (saline-injection) exchange for these wires." },
            { title: "Prevention: watch the tip", detail: "Pay close attention to the distal wire position while delivering equipment or when several wires are in use, above all with stiff and polymer-jacketed wires." },
            { title: "Prevention: trap", detail: "Use the trapping technique to keep the wire still during exchanges." },
            { title: "Prevention: exchange the wire", detail: "As soon as crossing is confirmed, swap a stiff or polymer-jacketed wire for a workhorse wire." },
          ],
        },
        { kind: "h", text: "Treatment: three steps before the seal" },
        {
          kind: "steps",
          items: [
            { title: "Step 1: block", detail: "As for every perforation, a balloon inflated just upstream of the hole keeps blood out of the pericardium. Drain the pericardium if the patient becomes hypotensive, and let the surgeons know in case percutaneous treatment fails. Brilakis notes that with a promptly placed blocking balloon the effusion may stay small enough not to need drainage." },
            { title: "Step 2: is it still bleeding?", detail: "If the balloon has sealed it, observation and heparin reversal (once the equipment is out of the coronary artery) may be enough. Suction through a microcatheter can sometimes collapse the vessel and stop the bleeding. In most cases, however, Brilakis prefers a definitive seal by embolisation or a covered stent, to reduce the risk that the hole reopens and causes late tamponade." },
            { title: "Step 3: choose the seal", detail: "Embolisation is the commonest treatment and is usually done with fat or coils. If the bleeding branch is so small or so sharply angled that neither a wire nor a microcatheter can enter it, place a covered stent across its origin instead. If neither is possible, prolonged inflations may still stop it; otherwise surgery. In the UK registry Brilakis cites, surgery was needed in only 3% of 1,762 perforations." },
          ],
        },
        { kind: "tip", id: "pci-perf-distal-block-deliver" },
        { kind: "h", text: "Embolisation through one guide (Brilakis Fig. 26.10, panels C1–C7)" },
        {
          kind: "p",
          text: "Embolisation can usually be done through a single guide of 6 Fr or more with the 'block and deliver' technique: the blocking balloon and a microcatheter sit side by side in the same guide, so no second guide is needed. Its key advantage is that you can inject through the microcatheter tip to see the leak before and after the coil goes in, without deflating the balloon. The smallest guide that takes a given microcatheter beside a balloon is listed in Brilakis's Table 26.2: 6 Fr for eight of the microcatheters listed (one of them takes 0.018-inch coils), 7 Fr for seven, and 8 Fr for two. Know the figure for the microcatheter you use.",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Second wire into the bleeding branch", detail: "Deflate the blocking balloon briefly, steer a second wire into the perforated branch, and reinflate." },
            { title: "2. Microcatheter into the branch", detail: "Deflate briefly again, advance a microcatheter over the second wire into the branch, and reinflate. Fat goes through any microcatheter; for coils the choice of microcatheter matters (below)." },
            { title: "3. Find the hole", detail: "With the balloon up, inject contrast through the microcatheter to show exactly where the perforation is. If the microcatheter sits too far back, reposition it so that the coil occludes as little of the proximal vessel as possible." },
            { title: "4. Embolise", detail: "Deliver fat or a coil through the microcatheter, just proximal to the perforation. With a detachable coil, release it only when its position looks right." },
            { title: "5. Check through the microcatheter", detail: "Inject through the microcatheter again. Sealing is sometimes delayed by a few minutes after a coil. If bleeding continues, add more fat or coils." },
            { title: "6. Confirm through the guide", detail: "Finish with an angiogram through the guide to confirm that the perforation is completely sealed." },
          ],
        },
        {
          kind: "check",
          stem: "A distal branch of the circumflex is bleeding into the pericardium. A balloon blocks it through a 6 Fr guide and a standard 0.014-inch-compatible microcatheter sits in the branch beside the balloon. The only coils on the shelf are 0.018-inch pushable coils. What is the most practical way to seal it?",
          options: [
            "Push one of the 0.018-inch coils through the microcatheter that is already in place",
            "Embolise with the patient's own fat through the microcatheter already in the branch",
            "Deflate the balloon and send the patient for surgery, since no compatible coil is available",
            "Exchange the 6 Fr guide for an 8 Fr guide over the wire while the balloon remains inflated",
          ],
          answer: 1,
          explanation:
            "Fat can be delivered through any microcatheter, is always available and costs nothing; Brilakis prefers it in most cases except very large perforations. Coils for 0.018-inch microcatheters cannot pass through standard 0.014-inch microcatheters (with one low-profile exception in his text) and need a larger delivery microcatheter. Surgery is reserved for failure of percutaneous treatment (3% in the UK data), and changing guides around an inflated balloon is not a technique the manual describes.",
        },
        { kind: "h", text: "Fat or coil?" },
        {
          kind: "table",
          caption: "Fat and coils compared (built from Brilakis Table 26.3 and the text of 26.4.1)",
          head: ["", "Autologous fat", "Coil"],
          rows: [
            ["Seen on X-ray", "Faint at best (0/+ in Table 26.3); soaking it in contrast is what makes it visible", "Yes (+)"],
            ["Control of where it goes", "None once injected", "Good, especially with detachable coils"],
            ["Delivery catheter", "Any microcatheter", "Must match the coil: 0.014-inch coils through standard microcatheters; 0.018-inch coils through a larger microcatheter"],
            ["Availability and cost", "Always available, no cost, biologically compatible", "Often limited stock, expensive"],
            ["Brilakis's preference", "First choice in most cases", "Very large perforations (fat is preferred otherwise)"],
          ],
        },
        {
          kind: "steps",
          title: "Fat embolisation",
          items: [
            { title: "1. Harvest", detail: "Advance a haemostat into the femoral arteriotomy site and pull out small pieces of fat; cut larger pieces smaller with a scalpel." },
            { title: "2. Make it visible", detail: "Soak the fat in contrast for about a minute so that it takes up contrast and can be seen on X-ray." },
            { title: "3. Load it", detail: "Fat is light and floats, so it tends to stay in the hub. Turning the microcatheter hub upside down lets the pieces move into the lumen." },
            { title: "4. Inject", detail: "Flush the microcatheter with saline to carry the fat out of its tip." },
            { title: "5. Repeat if needed", detail: "Several pieces may be needed: inject through the microcatheter to check the seal and add more if it still leaks." },
          ],
        },
        { kind: "tip", id: "pci-perf-fat-embolisation" },
        {
          kind: "steps",
          title: "Coil embolisation",
          items: [
            { title: "1. Be ready before you need it", detail: "Coiling is rare in the catheter laboratory, so become familiar with coil delivery and release in advance, or get help from an interventional radiologist, who coils and embolises often. One or two coil types are enough." },
            { title: "2. Know the two properties that matter", detail: "Microcatheter compatibility (0.014-inch or 0.018-inch) and release mechanism (pushable or detachable). The ideal coronary coil is 0.014-inch compatible and detachable, so it goes through the standard microcatheter already in use and can be placed precisely. Brilakis's laboratory uses a detachable neurovascular coil of this kind, usually in the smaller sizes. All the neurovascular (0.014-inch-compatible) coils he lists are detachable, but their release systems differ (mechanical, thermomechanical or electrolytic), so know the one your laboratory stocks. They are bare platinum, some with added microfilaments or an expanding hydrogel. Brilakis prefers detachable coils for perforations because their placement is optimal and predictable." },
            { title: "3. Match the catheter", detail: "Most standard coils need a 0.018-inch microcatheter of about 2.4–2.5 Fr; they cannot pass through standard 0.014-inch coronary microcatheters, with the exception of one low-profile microcatheter in his text. Hence the advice to stock 0.014-inch-compatible coils, or the larger microcatheters." },
            { title: "4. Deliver", detail: "Load the coil into the microcatheter and advance it into the target vessel. A pushable coil is pushed out with a coil pusher or the leading end of a guidewire; once out, it cannot be retrieved and its final position is less predictable. A detachable coil stays attached to its delivery system until you release it, and can be withdrawn if the position or shape is wrong." },
            { title: "5. Watch the main vessel", detail: "Once out, a coil takes up its preformed shape; some carry fibres that make them more thrombogenic. When coiling a branch, make sure no loop prolapses back into the main vessel." },
          ],
        },
        { kind: "tip", id: "pci-perf-coil-match" },
        {
          kind: "p",
          text: "**An example from Brilakis (Fig. 26.13).** After a distal perforation during an RCA CTO procedure, a balloon stopped the bleeding and a 0.018-inch microcatheter was placed beside it through a single 8 Fr guide. Two small coils did not stop the leak; a detachable expanding-hydrogel coil slowed it, and it stopped 15 minutes later. Echo showed only a small effusion, and an echo contrast agent showed no ongoing bleeding. The lessons: sealing can take minutes, and you may need more than one coil. Oxford shows the same principle with a series of small, highly thrombogenic coils in a diagonal branch, occluded on the next day's angiogram.",
        },
        {
          kind: "list",
          items: [
            "**Other materials** that have been used for embolisation (Brilakis 26.4): thrombin, thrombus, gelatin sponge, microparticles and even a piece of guidewire.",
            "**Vascular plugs** are another way to occlude a vessel (30.18.3): a braided nitinol mesh disc on a delivery cable, released by turning the cable anticlockwise and retrievable until then, sized 30–50% larger than the vessel at the occlusion site with enough landing length not to block other vessels.",
          ],
        },
        { kind: "h", text: "A covered stent across the branch origin (Brilakis Fig. 26.10, panels D1–D6)" },
        {
          kind: "p",
          text: "If no wire will enter the bleeding branch, one fallback is to coil the bigger vessel upstream of it. That sacrifices the upstream vessel, which Brilakis regards as undesirable when the bleeding branch comes off a major artery; there the alternative is a covered stent in the parent artery, placed so that it covers the branch ostium.",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Second wire into the main vessel", detail: "Deflate the blocking balloon briefly to pass a second wire down the main vessel, then reinflate." },
            { title: "2. Bring the covered stent up", detail: "Advance the covered stent on the second wire until it sits just behind the inflated blocking balloon; the balloon anchors the wire distally and helps this bulky device along." },
            { title: "3. Swap", detail: "Deflate the blocking balloon and push the covered stent on until it spans the ostium of the bleeding branch. Leave the blocking balloon and its wire in place until the covered stent has reached the site." },
            { title: "4. Deploy and post-dilate", detail: "Deploy the covered stent, then post-dilate it at high pressure with a non-compliant balloon, in nearly all cases; the sandwich design is hard to expand." },
            { title: "5. Check the other side", detail: "If the perforated branch filled from contralateral collaterals before the perforation, inject the contralateral artery: blood can keep reaching the hole retrogradely through the collaterals." },
          ],
        },
        { kind: "tip", id: "pci-perf-distal-covered-origin" },
        {
          kind: "check",
          stem: "During an RCA CTO procedure a small posterolateral branch perforates. It cannot be wired, so a covered stent is placed in the distal RCA across its origin, and the antegrade injection shows no further leak. Before the CTO the distal RCA filled through septal collaterals from the LAD. What remains to be done?",
          options: [
            "Nothing: the antegrade injection shows the perforation has been sealed",
            "Give protamine at once, because a covered stent is now in place",
            "Inject the left coronary to exclude retrograde collateral filling of the branch",
            "Remove the guide and leave the wire in the RCA overnight in case the leak returns",
          ],
          answer: 2,
          explanation:
            "Brilakis requires a contralateral injection after sealing a branch that filled from contralateral collaterals, because blood can keep reaching the perforation retrogradely even when the antegrade view looks dry. Protamine is not given while wires and devices are still in the artery (26.2); once the seal is complete and the equipment is out, Brilakis's own pages differ on whether reversal is needed (26.4 Step 2 allows it; his algorithm reserves it for continued leakage). Leaving wires in the artery overnight is not part of the technique.",
        },
        { kind: "tip", id: "pci-perf-distal-finish-watch" },
        {
          kind: "pitfalls",
          items: [
            "Missing a distal leak because the wire tip was outside the collimated field.",
            "Accepting a balloon-sealed distal perforation without a definitive seal, then finding tamponade on the ward hours later.",
            "Starting a GP IIb/IIIa inhibitor or cangrelor after a distal wire perforation.",
            "Placing the microcatheter too far back and coiling more of the vessel than needed.",
            "Trying to push 0.018-inch coils through a standard 0.014-inch microcatheter.",
            "Releasing a detachable coil before checking its position; letting a coil loop prolapse into the main vessel.",
            "Judging the result too early: sealing after a coil can take a few minutes.",
            "Forgetting the contralateral injection when collaterals feed the bleeding branch.",
          ],
        },
        {
          kind: "pearl",
          text: "The 'block and deliver' set-up turns a distal perforation into a controlled procedure: the balloon keeps the pericardium dry while the microcatheter tip injections show you, in real time, whether the fat or coil has worked. A 6 Fr guide allows block and deliver with many microcatheters, but several need 7 or 8 Fr (Table 26.2), and in CTO PCI Brilakis prefers 7 or 8 Fr guides partly because a 6 Fr guide limits the management of complications (21.5). Know before you start whether your bail-out fits in your guide.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (mid-RCA CTO), if a distal wire perforation is raised: block it with a small balloon proximal to the exit; describe the 'block and deliver' sequence (second wire and microcatheter into the branch during brief deflations, a tip injection to find the hole); choose fat or a coil and justify it from the microcatheter you have; and finish with a guide injection, plus a contralateral injection if the branch is fed by collaterals. The embolisation devices are not yet in the lab; the request is in the lab-request file.",
        },
        { kind: "video", id: "M_ASWxk3Gx0", note: "Manual of PCI chapter video 26.3: distal vessel perforation." },
        { kind: "video", id: "RWsCcbmQsow", note: "Brilakis channel: how to treat distal coronary perforations." },
        { kind: "video", id: "N2r41qFsq2A", note: "Case 124 from the Manual of PCI: combined coil and fat embolisation for distal vessel perforation." },
        { kind: "video", id: "IhF049NEPjk", note: "Brilakis channel: how to deliver a detachable 0.014-inch-compatible coil." },
        {
          kind: "keypoints",
          items: [
            "Distal perforations are hard to see and can cause tamponade hours later: monitor closely (Ellis: for at least 24 hours), no GP IIb/IIIa inhibitor or cangrelor, and an echo at once if the pressure falls.",
            "Prevent them: watch the tip, trap rather than hydraulic exchange, and swap stiff or polymer-jacketed wires for a workhorse once across.",
            "Block proximally, then seal definitively in most cases to prevent late reopening; microcatheter suction occasionally collapses the vessel.",
            "'Block and deliver': balloon and microcatheter side by side through one guide of 6 Fr or more; tip injections show the leak without deflating.",
            "Fat: first choice in most cases (any microcatheter, free, always available), harvested at the femoral arteriotomy, soaked in contrast for about a minute, loaded with the hub inverted.",
            "Coils: 0.014-inch-compatible detachable coils are ideal; 0.018-inch coils need a larger microcatheter; sealing may take minutes.",
            "Branch too small to wire: covered stent across its origin, post-dilated at high pressure, then a contralateral injection if collaterals feed it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-collateral-cabg",
      title: "Collateral perforation, and perforation after bypass surgery",
      minutes: 12,
      topics: ["comp-collateral-cabg-perf"],
      sources: [B("26.5"), B("26.6"), B("26.4"), B("26.3"), B("26.1"), B("18"), B("21.3"), B("21.6"), B("2.3"), B("30.18"), O_PERF, O("ch 8: Chronic total occlusion PCI"), O("ch 9: Pericardiocentesis")],
      refs: [...BOOKS, "kinnaird-perforation-uk-2016", "boukhris-collateral-coil-2015"],
      blocks: [
        {
          kind: "p",
          text: "Two situations break the usual rules. A collateral channel joins two arteries, so it can leak on either side (in a case cited by Brilakis, a second leak at the recipient-artery end needed antegrade coils after the first had been coiled retrogradely), and an epicardial one can bleed quickly into the pericardium. After bypass surgery, adhesions change where the blood goes: it can collect in a pocket that compresses one chamber and cannot be reached with a needle. The retrograde CTO module (cp-cto-retrograde) teaches collateral perforation in retrograde work in full; this lesson gives the manuals' general rules and how they change your decisions.",
        },
        { kind: "h", text: "Collateral perforation" },
        {
          kind: "table",
          caption: "Septal versus epicardial collateral perforation (Brilakis 26.5, 21.6)",
          head: ["", "Septal collateral", "Epicardial collateral"],
          rows: [
            ["Usual consequence", "Rarely harmful", "A serious event in retrograde CTO work: tamponade can develop fast and the leak may be hard to stop"],
            ["Reported problems", "Haematomas in the septum or in the right ventricular wall, and even dry tamponade, are on record after a wire has exited a septal", "Fast bleeding into the pericardium"],
            ["Dilating the channel", "Can be dilated with small balloons (1.5 mm or less) at low pressure (2–4 atm) to help a microcatheter cross", "Not dilated, in contrast to septals"],
            ["Grading", "Ellis grades need adapting for collateral channels", "Ellis grades need adapting for collateral channels"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Treatment kit.** Coils should be available for collateral perforation as well as distal perforation (30.18.2); the embolisation technique is the one in the previous lesson.",
            "**Either end.** An epicardial collateral can leak at either end. Boukhris and colleagues (2015), one of the reports Brilakis cites in 26.5, describe an epicardial collateral perforation with tamponade during retrograde CTO PCI: coils placed from the retrograde side stopped the first leak, a second leak later appeared at the junction of the collateral with the recipient artery and needed coils from the antegrade side, and the authors advise checking such a collateral with bilateral injections. Brilakis's own rule is a contralateral injection after sealing a branch that filled through collaterals (26.4), so check a sealed collateral from both arteries.",
            "**Retrograde risk.** Tamponade complicates about 1.3% of retrograde CTO procedures against about 0.3% of CTO PCI overall (26 introduction). Oxford adds that the stiff, hydrophilic-coated wires used for CTOs perforate not infrequently and can cause tamponade, and that perforation shows as dye collecting in the pericardium or leaving the vessel in a pulsatile way. Oxford stabilises such a patient with prompt pericardiocentesis, fluid resuscitation and a prolonged balloon inflation at the site of the leak; reversal of heparin with protamine and then a covered stent may be needed.",
            "**Other forms of bleeding.** A perforation can also produce an intramyocardial haematoma or bleeding into a cavity rather than the pericardium (26 introduction).",
          ],
        },
        { kind: "tip", id: "pci-perf-check-other-side" },
        { kind: "tip", id: "pci-cto-retro-collateral-perforation" },
        {
          kind: "check",
          stem: "During retrograde CTO PCI a wire leaves a septal collateral and a small contained blush appears in the septum. BP 132/78 mmHg, no effusion on echo, no symptoms. Which statement fits Brilakis's teaching?",
          options: [
            "Septal perforation is unlikely to cause harm, but septal and right ventricular haematomas and dry tamponade have been reported, so watch for them",
            "Septal perforation drains directly into the pericardium, so pericardiocentesis should be set up at once",
            "Septal channels must never be dilated, so the procedure must be abandoned whenever a septal is chosen",
            "A septal perforation is the most dangerous kind of collateral perforation and needs coils from both ends",
          ],
          answer: 0,
          explanation:
            "Brilakis sets the two kinds of collateral against each other: a septal exit rarely does harm, though haematomas of the septum or the right ventricular wall and even dry tamponade are on record, whereas an epicardial exit is serious and can cause rapid tamponade. Septals, unlike epicardials, can be dilated with small balloons at low pressure. The other options confuse the two.",
        },
        { kind: "h", text: "Perforation after coronary bypass surgery" },
        {
          kind: "list",
          items: [
            "**The old belief.** Adhesions after CABG were thought to protect against effusion and tamponade, so perforation in these patients was considered 'innocent'.",
            "**What actually happens.** Blood can collect as a loculated effusion or haematoma that compresses individual structures, such as the left atrium or the right ventricle, causing haemodynamic collapse: 'dry tamponade' (18, 26.6).",
            "**Why it can kill.** Such a collection may be impossible to reach and drain with a needle; drainage may need CT guidance or emergency surgery.",
            "**What to do.** Treat any perforation in a patient with previous CABG immediately, for example with a covered stent or coils, so that a loculated collection does not have time to form (26.6). Brilakis's Fig. 26.14, taken from a report on distal perforation after prior CABG and the importance of early treatment, shows a small right posterior descending branch perforation sealed with a 2.8 × 19 mm covered stent.",
            "**What it looks like on the monitor.** Brilakis's Fig. 2.2 shows ST elevation and a pulsus paradoxus of 35 mmHg after a distal perforation in a patient with previous CABG.",
            "**How common.** In UK data, previous CABG was itself a predictor of perforation (odds ratio 1.44).",
            "**Grafts count too.** A vein graft can tear when a stent is oversized or a balloon inflated at high pressure (26.3), and Brilakis calls prompt recognition and treatment of a coronary or a graft perforation critical in these patients (18).",
            "**Drainage is harder.** Oxford warns that after PCI only a small amount of blood can tamponade a single chamber, making percutaneous drainage technically difficult; an apical approach is occasionally needed, and expert advice should be sought when time allows.",
          ],
        },
        { kind: "tip", id: "pci-cabg-perforation-act-now" },
        {
          kind: "check",
          stem: "A patient with previous CABG has a small distal wire perforation (Ellis II) of a native circumflex branch. A balloon has stopped the leak, BP is 124/70 mmHg and echo shows no free effusion. The registrar suggests finishing the case and observing, since 'bypass patients are protected'. What do you do?",
          options: [
            "Agree: adhesions protect bypass patients, so a small leak can be observed on the ward",
            "Finish the case, but give a GP IIb/IIIa inhibitor to protect the newly stented segment",
            "Seal the branch now with fat or coils (or a covered stent), because a loculated collection may be undrainable",
            "Give full-dose protamine and remove all equipment, then repeat the echo the next morning",
          ],
          answer: 2,
          explanation:
            "Brilakis is explicit that perforations in prior-CABG patients should be treated immediately, with covered stents or coils, because loculated collections can compress a single chamber and may be impossible to drain percutaneously, needing CT-guided drainage or surgery. The 'protected' belief is outdated. GP IIb/IIIa inhibitors are avoided after distal perforation, and reversing heparin does not replace a definitive seal.",
        },
        {
          kind: "pitfalls",
          items: [
            "Dilating an epicardial collateral as you would a septal one.",
            "Checking the seal from one side only when collaterals feed the bleeding vessel.",
            "Reassuring yourself that a bypass patient cannot get tamponade.",
            "Expecting a loculated post-surgical collection to show up as a classic circumferential effusion, or to be reachable from below the xiphoid.",
            "Observing a small perforation after CABG instead of sealing it.",
          ],
        },
        {
          kind: "pearl",
          text: "This module's advice, building on Brilakis 26.6 and Fig. 2.2: in a bypass patient, treat the haemodynamics and the echo as two separate witnesses. A rising heart rate, a widening respiratory swing on the arterial trace and falling pressure with an unimpressive echo should make you suspect a loculated collection that the probe cannot see.",
        },
        {
          kind: "sim",
          sim: "pericardiocentesis",
          task: "Before you puncture, use the echo to decide whether the collection is free and lies where a needle from below the xiphoid can reach it. If the lab presents a loculated collection behind the heart after cardiac surgery, do not needle it blindly: state that CT-guided or surgical drainage is needed and call for it.",
        },
        { kind: "video", id: "ckE99t9akPA", note: "Case 119 from the Manual of CTO Interventions: epicardial collateral perforation." },
        { kind: "video", id: "9ZaHJZKhoC0", note: "Case 16 from the PCI Manual: septal perforation." },
        { kind: "video", id: "8gb7uIS2lZI", note: "Case 43 from the Manual of CTO Interventions: perforation in a prior CABG patient." },
        { kind: "video", id: "i14AZmq6vaA", note: "Case 133 from the Manual of PCI: SVG perforation." },
        {
          kind: "keypoints",
          items: [
            "Septal collateral perforation is usually harmless but can cause septal or right ventricular haematoma and dry tamponade; epicardial perforation can cause rapid, hard-to-control tamponade.",
            "Septals can be dilated with balloons of 1.5 mm or less at 2–4 atm; epicardials are not.",
            "A branch fed by collaterals needs a contralateral injection after sealing (Brilakis); an epicardial collateral can leak on either side and has needed coils from both (Boukhris 2015); keep coils available.",
            "Previous CABG does not protect: loculated haematomas compress single chambers ('dry tamponade') and may need CT-guided drainage or surgery.",
            "Seal every perforation in a bypass patient immediately, with a covered stent or coils.",
            "After PCI, a small volume of blood can tamponade one chamber and make drainage difficult; seek expert help and consider other approaches.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-tamponade",
      title: "Recognising tamponade on the table and afterwards",
      minutes: 13,
      topics: ["hd-tamponade"],
      sources: [
        B("26.2"),
        B("26.4"),
        B("2.3"),
        B("28.1"),
        B("28.3"),
        B("11.1"),
        B("19.9"),
        O_TAMP,
        O("ch 5: Pericardial tamponade"),
        O("ch 10: Hypotension"),
        O("ch 10: Vasovagal reaction"),
        O("ch 10: Risks of complications"),
        O("ch 4: Left ventriculography"),
        O("ch 9: Endomyocardial biopsy"),
      ],
      refs: [...BOOKS, "ellis-1994"],
      blocks: [
        {
          kind: "p",
          text: "Tamponade is a mechanical problem: blood or fluid in the pericardium raises the pressure around the heart until it cannot fill. In the catheter laboratory it develops fast and in a patient who is already monitored, so the clues are there if you look for them. The Academy lesson hd-pm-tamponade explains the haemodynamic physiology (equalised diastolic pressures, the blunted y descent, the mechanism of pulsus paradoxus); this lesson is about recognising it in the room and telling it from its mimics.",
        },
        {
          kind: "table",
          caption: "Where tamponade comes from in the catheter laboratory (Oxford ch 10, ch 4, ch 9; Brilakis 26, 19.9)",
          head: ["Source", "Mechanism"],
          rows: [
            ["PCI", "Usually a coronary perforation"],
            ["Left ventriculography", "Contrast injected into the myocardium, which can leak into the pericardium (usually benign, but tamponade can follow)"],
            ["Right heart catheters and pacing wires", "The right ventricle is relatively thin-walled; Brilakis also notes that a temporary pacing lead for atherectomy carries a risk of right ventricular perforation"],
            ["Endomyocardial biopsy", "Cardiac perforation; Oxford advises observation for signs of tamponade for several hours afterwards"],
          ],
        },
        { kind: "h", text: "What you see" },
        {
          kind: "list",
          items: [
            "**Speed.** Oxford: tachycardia, hypotension and syncope can develop within minutes. Brilakis: perforation effusions accumulate rapidly and often cause hypotension.",
            "**The X-ray.** Contrast can often be seen collecting in the pericardial space around the heart.",
            "**The arterial trace.** Pulsus paradoxus (Oxford: usually a fall in systolic pressure of more than 10 mmHg with inspiration) is one of the waveform changes Brilakis lists for continuous monitoring; his Fig. 2.2 shows 35 mmHg after a distal perforation, with ST elevation.",
            "**The right atrium.** If a right-sided pressure is being recorded, Oxford describes the right atrial pressure as generally raised and blunted, with findings similar to constriction.",
            "**The echo.** Oxford: echo gives the diagnosis instantly, showing the effusion and small, collapsing right-sided chambers such as right atrial collapse.",
            "**Later.** Distal perforations can bleed slowly and cause tamponade hours after the procedure (Brilakis 26.4); Oxford describes progressive hypotension and tamponade back on the ward; Ellis found delayed tamponade within 24 hours.",
          ],
        },
        { kind: "tip", id: "pci-mon-pulsus-paradoxus" },
        { kind: "tip", id: "pci-perf-hypotension-tamponade" },
        {
          kind: "check",
          stem: "At the end of a CTO case the pressure falls from 128/72 to 92/60 mmHg over five minutes and the heart rate rises from 74 to 112 bpm. The systolic pressure now drops by about 20 mmHg with each breath. The final angiogram looked clean. What do you do first?",
          options: [
            "Raise the legs, give atropine 0.5–1.0 mg and a rapid saline infusion for a vasovagal reaction, then reassess in a few minutes",
            "Echo at once with the pericardiocentesis kit open; drain without waiting if the pressure keeps falling; review every wire position",
            "Give protamine at once, because a fall in pressure at the end of the case must be bleeding from the arterial access site",
            "Send the patient to the ward with a fluid infusion running and an echo booked for the following morning to look for a slow effusion",
          ],
          answer: 1,
          explanation:
            "Falling pressure with a rising heart rate and an inspiratory systolic fall well above 10 mmHg after CTO work is high clinical suspicion of tamponade; distal wire and collateral perforations can be invisible on a 'clean' final view. Oxford uses echo to confirm the diagnosis but performs pericardiocentesis at once when suspicion is high, and Brilakis drains immediately when the patient is haemodynamically unstable, so the kit must be ready before the probe goes on. A vasovagal reaction slows the heart rather than speeding it. Protamine does not treat tamponade, and sending the patient out invites arrest on the ward.",
        },
        { kind: "h", text: "Telling it from its mimics" },
        {
          kind: "table",
          caption: "Tamponade and the other common causes of hypotension in the laboratory (Oxford ch 10; Brilakis 28.1 and 11.1)",
          head: ["Cause", "Clues", "First treatment"],
          rows: [
            ["False hypotension", "Normal patient, low reading: an open Y-connector valve, a loose or air-filled transducer line, damping, air, thrombus or contrast in the catheter, bulky equipment in it", "Find and correct the technical fault before treating (Brilakis 28.1.1.1)"],
            ["Fasting and blood-pressure drugs", "Common: mild dehydration from fasting plus antihypertensive or anti-anginal medication", "Often a slow IV fluid infusion is all that is needed (Oxford)"],
            ["Tamponade", "Pressure falling over minutes with a rising heart rate; pulsus paradoxus; contrast around the heart; effusion on echo", "Pericardiocentesis; treat the source"],
            ["Vasovagal reaction", "Faints occur in 2–3% of catheterisations (Oxford). Feels unwell, nauseated, sweaty, pale; the heart rate usually slows before the pressure falls; may become syncopal, apnoeic and look dead. Triggers: strong emotion, dehydration, fasting and an expected painful stimulus; often on the ward beforehand (venesection, cannulation), at arterial puncture and during compression; young anxious men", "Lie flat, raise the legs, monitor, atropine 0.5–1.0 mg IV, rapid 0.9% saline; if no better within a few minutes, reconsider (MI, tamponade, retroperitoneal bleed). Prevention: adequate sedation and hydration (Brilakis 28.1.2)"],
            ["Bleeding", "Access-site haematoma; retroperitoneal bleeding may show nothing outside, but fluoroscopy of the bladder can show the 'dented bladder' sign (Brilakis 28.1.1.2.1)", "Saline and blood; balloon at the bleeding artery, then endovascular or surgical repair (cm module on access complications)"],
            ["Contrast reaction", "Within about 15 minutes of the first injection: itching, flushing, rash, wheeze, angio-oedema, tachycardia", "Oxford's anaphylaxis treatment (cm module on patient complications)"],
            ["Myocardial ischaemia or ventricular failure", "Oxford lists myocardial ischaemia among the causes; Brilakis notes ischaemia is the commonest cause of ventricular dysfunction. On right heart catheterisation, high left-sided filling pressure with a low cardiac output (Fig. 28.1)", "Revascularisation, and in some cases mechanical circulatory support (Brilakis 28.1.3.2)"],
            ["Catheter-induced aortic regurgitation", "An Amplatz guide, or an EBU with a deep curve, can push an aortic cusp open (Brilakis 28.1.1.2.2); in his Fig. 28.2 the pressure was low while an Amplatz sat deep on the valve and rose once it was withdrawn", "Reposition the guide: the pressure recovers at once"],
            ["Arrhythmia", "Brady- or tachyarrhythmia lowering cardiac output; in the laboratory usually ischaemic, often after reperfusion; bradycardia and heart block often from drugs such as adenosine (short-acting)", "Treat the ischaemia; recognise and correct the rhythm early (Brilakis 28.1.2, 28.1.3.2)"],
            ["Drug vasodilation", "Nitroglycerin, especially after recent use of a phosphodiesterase-5 inhibitor, or verapamil given to prevent radial spasm", "Fluids; avoid excessive doses of nitroglycerin and other vasodilators (Brilakis 28.1.2)"],
          ],
        },
        {
          kind: "p",
          text: "Both a faint and tamponade can strike suddenly, and Oxford separates them by the pulse: fast in tamponade, slowing first in a vagal reaction. When in doubt, get an echo straight away. Brilakis's hypotension algorithm (28.1) starts by excluding a false reading, then sorts true hypotension by mechanism; tamponade sits with the causes of low stroke volume and is treated with pericardiocentesis, while a myocardial rupture after infarction needs emergency surgery. If the cause is unclear, right heart catheterisation helps: in tamponade, as in other causes of pump failure, the left-sided filling pressure is high and the cardiac output low (Fig. 28.1), and in hypotensive patients a pulmonary artery catheter can guide decisions about haemodynamic support (2.3).",
        },
        { kind: "tip", id: "access-vasovagal-or-tamponade" },
        {
          kind: "check",
          stem: "During femoral sheath removal after an uncomplicated diagnostic study, a 34-year-old man becomes pale, sweaty and nauseated. Heart rate 42 bpm, BP 78/40 mmHg. What is the best first management, and when should you think again?",
          options: [
            "Immediate pericardiocentesis, because hypotension after catheterisation is tamponade until proven otherwise",
            "Legs up, atropine 0.5–1.0 mg IV and rapid saline; if not better within minutes, look for tamponade, bleeding or MI",
            "Intravenous adrenaline for anaphylaxis, then hydrocortisone and an antihistamine as a matter of routine",
            "Protamine to reverse the heparin, then compression for a further 30 minutes before reassessing",
          ],
          answer: 1,
          explanation:
            "Bradycardia before hypotension, pallor, sweating and nausea during compression in a young man is a vasovagal reaction; Oxford treats it with leg elevation, monitoring, atropine 0.5–1.0 mg IV and rapid saline, and expects improvement within a few minutes. If that does not happen, reconsider the diagnosis and exclude MI, tamponade and retroperitoneal bleeding, with an immediate echo if there is any uncertainty. Pericardiocentesis without evidence of an effusion would be harmful.",
        },
        { kind: "h", text: "The echo in the laboratory" },
        {
          kind: "list",
          items: [
            "**Confirm** the diagnosis (Oxford); but if clinical suspicion is high, perform pericardiocentesis at once rather than waiting for the echo (next lesson).",
            "**Size** the effusion, **guide** the needle if time allows, and **check** the result after drainage (Brilakis 26.2).",
            "**Is it still bleeding?** An echo contrast agent can show whether blood is still entering the pericardium (Brilakis 26.2; Fig. 26.13).",
            "**Before and after** a procedure done with almost no contrast, to catch an effusion from a perforation nobody saw (28.3.2).",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating every hypotensive patient as vasovagal; tamponade is usually tachycardic.",
            "Being reassured by a 'clean' final angiogram after CTO or distal wiring.",
            "Missing pulsus paradoxus because nobody is watching the arterial trace through the breathing cycle.",
            "Forgetting non-PCI sources: intramyocardial contrast at ventriculography, right ventricular catheters, pacing wires and biopsy.",
            "Discharging a patient early after a perforation instead of observing for at least 24 hours (Ellis).",
          ],
        },
        {
          kind: "pearl",
          text: "When the pressure falls, look at the heart rate and the trace before reaching for drugs. Slow and pale points to the vagus; fast with a respiratory swing points to the pericardium, and the echo probe should already be on the chest.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Record the arterial pressure through several breaths and measure the inspiratory fall in systolic pressure; then record the right atrial pressure and describe its level and shape. Decide whether the findings fit tamponade (pulsus over 10 mmHg, raised right atrial pressure) and what you would do next.",
        },
        { kind: "video", id: "NX81MYPpbtQ", note: "Elias Hanna: tamponade, asymptomatic effusion, pericardiocentesis, constriction." },
        {
          kind: "keypoints",
          items: [
            "Laboratory sources of tamponade: coronary perforation, intramyocardial contrast at ventriculography, right ventricular catheters and pacing wires, biopsy.",
            "Signs: hypotension within minutes, usually with tachycardia; pulsus paradoxus over 10 mmHg; contrast around the heart; raised right atrial pressure; effusion with right atrial collapse on echo.",
            "Vasovagal reactions slow the heart before the pressure falls; tamponade usually speeds it. If unsure, echo now.",
            "A vasovagal reaction that does not respond within minutes needs another diagnosis: MI, tamponade or retroperitoneal bleeding.",
            "Echo confirms, sizes, guides and checks; echo contrast shows ongoing bleeding; zero-contrast PCI needs an echo before and after.",
            "Distal perforations can cause tamponade hours later: observe for at least 24 hours, with an echo at once if the pressure falls.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-perforation-pericardiocentesis",
      title: "Pericardiocentesis in the catheter laboratory",
      minutes: 13,
      topics: ["comp-pericardiocentesis"],
      sources: [B("26.2"), B("30.18"), B("30.23"), B("28.1"), O("ch 9: Pericardiocentesis"), O_TAMP, O_PERF],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Pericardiocentesis removes the blood or fluid that is compressing the heart. After a perforation it is often done on the same table, under the same X-ray, with the coronary balloon still inflated. The Academy module bed-pericardiocentesis teaches the approaches, complications and drain care in general; this lesson follows the two manuals step by step and adds what is different when the effusion is blood from a coronary artery.",
        },
        {
          kind: "steps",
          title: "When",
          items: [
            { title: "Cardiac arrest from known or suspected tamponade", detail: "Drain immediately; Oxford treats it as a potentially life-saving measure that should not wait." },
            { title: "Haemodynamic instability after perforation", detail: "Immediate pericardiocentesis (Brilakis 26.2; Oxford ch 10)." },
            { title: "Less critical cases", detail: "Echo first: it confirms the diagnosis and tells you whether aspiration is wise and from where (Oxford ch 9)." },
            { title: "Small effusion, stable patient", detail: "Brilakis may manage it conservatively: the raised pericardial pressure may help to seal the perforation. Echo shows its size, and an echo contrast agent can show whether blood is still entering the sac." },
          ],
        },
        {
          kind: "table",
          caption: "The kit (it must be in every laboratory: Brilakis 30.18)",
          head: ["Item", "Oxford ch 9", "Brilakis 30.18.4"],
          rows: [
            ["Needle", "Long (15 cm), at least 18 gauge, ideally short-bevelled to reduce the risk of lacerating the heart", "A standard 18 gauge needle; a micropuncture needle kit (with echo guidance if time allows) can make it safer"],
            ["Wire", "J-tip, 0.035 inch", "J-tip, 0.035 inch"],
            ["Dilator", "5–7 F", "Not specified"],
            ["Drain", "Pigtail or other drainage catheter with multiple side holes", "A standard pigtail catheter"],
            ["Also", "Large syringe for aspiration; drainage bag and tubing", "A pre-assembled pericardiocentesis kit makes it faster"],
          ],
        },
        {
          kind: "p",
          text: "Ready-made drainage packs containing these items are sold by several manufacturers (Oxford). Whichever you use, open it and check that every component is there before you start, not when the needle is already in.",
        },
        {
          kind: "steps",
          title: "The procedure (Oxford ch 9, with Brilakis's points for perforation)",
          items: [
            { title: "1. Image it", detail: "Use X-ray screening with pressure monitoring, echo, or both. After a perforation, contrast that has leaked often outlines the pericardium, so fluoroscopy can frequently guide the needle (Brilakis 26.2)." },
            { title: "2. Position", detail: "If possible sit the patient up at 45°, so that the fluid pools at the inferior surface of the heart." },
            { title: "3. Prepare", detail: "Sterile skin preparation and drapes. Infiltrate local anaesthetic along the track, which passes just below the costal margin and points at the left scapular tip. Some patients need conscious sedation (for example midazolam). Oxford aims towards the tip of the left scapula; the Academy lesson bed-pericardiocentesis describes the same shallow subcostal track as aiming towards the left shoulder. Let the imaging, rather than a fixed landmark, decide the final direction (this module's advice, in line with Oxford's recommendation to image the procedure)." },
            { title: "4. Skin", detail: "Make a small scalpel incision just below the xiphisternum, so the drain will pass the skin easily." },
            { title: "5. Needle", detail: "Advance the needle with the syringe attached, aspirating continuously, until fluid comes back. With echo guidance, agitated saline injected through the needle confirms that its tip lies in the pericardial space." },
            { title: "6. Wire", detail: "Take the syringe off and pass the J-wire through the needle. Oxford's sign is a wire that forms a loop within the cardiac shadow on fluoroscopy, or a wire seen in the pericardial space on echo. A wire that has entered the right ventricle also lies within the cardiac shadow, so the Academy lesson bed-pericardiocentesis sharpens the X-ray sign: the wire should curl around the heart along its border, outside the chambers, and must not run into the right ventricular outflow tract or the pulmonary artery. Blood from a haemopericardium looks the same as blood from a chamber, and the Academy lesson warns that whether it clots is unreliable, so rely on the course of the wire or on agitated saline seen in the sac on echo, alongside the pressure monitoring Oxford recommends during the procedure. Only then remove the needle, leaving the wire." },
            { title: "7. Dilate and place the drain", detail: "Dilate over the wire (more than one pass may be needed), then advance the drainage catheter over the wire into the pericardium." },
            { title: "8. Aspirate", detail: "Removing as little as 20–50 mL often relieves the tamponade." },
            { title: "9. Send samples if needed", detail: "Oxford sends fluid for biochemical, immunological and microbiological tests when they are needed; after a coronary perforation the source of the blood is usually already known (this module's comment)." },
            { title: "10. Secure", detail: "Connect the drainage bag, suture the catheter at the skin and cover it with a transparent occlusive dressing." },
            { title: "11. Re-image", detail: "Repeat the echo straight after drainage, then at intervals, to catch fluid returning." },
          ],
        },
        { kind: "tip", id: "bed-peri-set-up" },
        { kind: "tip", id: "bed-peri-confirm-wire" },
        {
          kind: "check",
          stem: "After an Ellis III perforation the balloon is up, BP is 74/46 mmHg and the leaked contrast outlines the pericardium on fluoroscopy. The echo machine is on its way from another room. What do you do?",
          options: [
            "Wait for the echo to arrive, because pericardiocentesis without echo guidance is never safe after a perforation",
            "Give a vasopressor and protamine now, then decide about drainage once the echo machine has arrived",
            "Drain now under fluoroscopy, using the contrast-outlined sac and a wire curling round the heart border",
            "Deflate the balloon to deliver a covered stent first, then drain once the leak has been sealed",
          ],
          answer: 2,
          explanation:
            "Haemodynamic instability means immediate pericardiocentesis, and after a perforation the leaked contrast often lets fluoroscopy guide the needle (Brilakis 26.2); Oxford confirms the wire position by its loop in the cardiac shadow, and the wire should curl round the heart border outside the chambers rather than run into the right ventricular outflow tract (Academy bed-pericardiocentesis). Echo is valuable for size, guidance and the result, but it should not delay drainage in a hypotensive patient. Protamine with equipment in the artery risks thrombosis, and deflating the balloon now would add more blood to a tamponaded heart.",
        },
        { kind: "h", text: "After the drain is in" },
        {
          kind: "list",
          items: [
            "**Leave it.** Oxford: keep the drain in until the bleeding has stopped, which may take a few days; in general it stays for several hours at least, to show the rate of drainage.",
            "**It is also a monitor.** Continued output tells you that the source is still bleeding (this module's inference from Oxford's advice to judge the rate of drainage).",
            "**Treat the source.** Seal the perforation with a covered stent or coils (Oxford); the location-specific options are in the earlier lessons.",
            "**Anticoagulation.** Oxford: think about the anticoagulation status and consider protamine, platelets and clotting factors. Brilakis: in most cases reverse heparin only after the equipment is out and the pericardial blood fully evacuated, because reversal can make the pericardial blood clot so that it can no longer be drained.",
            "**Autotransfusion.** Brilakis's universal algorithm lists autotransfusion of drained blood with a question mark beside pericardiocentesis; neither manual describes how to do it, so follow local practice.",
            "**Difficult anatomy.** After PCI a small amount of blood can tamponade a single chamber and make the drainage technically difficult. Oxford occasionally uses an apical approach and advises seeking expert advice when there is time. After CABG a loculated collection may be unreachable and need CT-guided or surgical drainage (Brilakis 26.6).",
          ],
        },
        { kind: "tip", id: "bed-peri-after-pci" },
        { kind: "tip", id: "bed-peri-drain-stays" },
        { kind: "tip", id: "pci-arrest-tamponade-drain" },
        {
          kind: "check",
          stem: "Pericardiocentesis has removed 40 mL of blood and the pressure has risen from 72/40 to 108/66 mmHg. The covered stent is sealing the LAD and the drain output has fallen to a few millilitres. What is the right plan?",
          options: [
            "Remove the drain now, since the pressure has recovered and the effusion was small",
            "Keep the drain, echo now and serially, and follow its output; reverse heparin only once the coronary equipment is out",
            "Give 50 mg of protamine as a fast bolus to make sure the leak cannot restart, then remove the drain",
            "Aspirate the pericardium every few minutes until no more blood can be drawn, then pull it out",
          ],
          answer: 1,
          explanation:
            "Oxford keeps the drain in until the bleeding has stopped (possibly days) and repeats the echo straight after drainage and then serially; modest volumes of 20–50 mL are often enough to relieve tamponade. Brilakis reverses heparin, if at all, only after the equipment is out and the pericardium has been emptied, and never as a fast bolus (no faster than 5 mg per minute; Oxford over 10 minutes).",
        },
        {
          kind: "pitfalls",
          items: [
            "Delaying drainage in a hypotensive patient to wait for echo when fluoroscopy can guide the needle.",
            "Draining a small, stable effusion that may be helping to seal the perforation.",
            "Dilating before the wire has been seen curling round the heart outside the chambers (a wire in the right ventricle also lies in the cardiac shadow), or before agitated saline has shown the needle in the sac.",
            "Pulling the drain once the pressure recovers, before the source is sealed and the output has stopped.",
            "Reversing heparin so early that the pericardial blood clots and can no longer be drained.",
            "Expecting a needle from below the xiphoid to reach a loculated post-surgical collection.",
          ],
        },
        {
          kind: "pearl",
          text: "Open the pericardiocentesis kit when the perforation is declared, not when the pressure falls. If the patient stays stable you have lost nothing; if not, the minutes saved are the ones that matter.",
        },
        {
          kind: "sim",
          sim: "pericardiocentesis",
          task: "Perform a subxiphoid pericardiocentesis for acute haemopericardium: position the patient at 45° if possible, anaesthetise a shallow track under the costal margin towards the left scapular tip (Oxford) or left shoulder (Academy), with the final direction set by fluoroscopy or echo, advance the needle with continuous aspiration, confirm before dilating that the wire curls round the heart border outside the chambers and does not enter the right ventricular outflow tract (or that bubbles appear in the sac on echo), place a multi-hole pigtail, aspirate until the pressure recovers (often 20–50 mL), leave the drain and re-image with echo.",
        },
        { kind: "video", id: "OKHOo6m20To", note: "Manual of PCI chapter video 26.5: pericardiocentesis." },
        { kind: "video", id: "NX81MYPpbtQ", note: "Elias Hanna: tamponade, asymptomatic effusion, pericardiocentesis, constriction." },
        {
          kind: "keypoints",
          items: [
            "Arrest or instability from tamponade: drain now. Otherwise echo first. Small and stable after perforation: watching may be better.",
            "Kit in every laboratory: an 18 gauge (Oxford: 15 cm, short-bevel) needle, 0.035-inch J-wire, 5–7 F dilator, multi-hole pigtail, large syringe, drainage bag; a micropuncture kit and echo add safety.",
            "Subxiphoid, 45° if possible, a shallow track under the costal margin towards the left scapular tip (Oxford) or left shoulder (Academy), final direction set by fluoroscopy or echo, continuous aspiration.",
            "Before dilating, confirm the wire curls round the heart border outside the chambers, not into the right ventricular outflow tract or pulmonary artery (or agitated saline in the sac on echo); blood alone cannot tell sac from chamber.",
            "20–50 mL often relieves tamponade; leave the drain until bleeding stops, echo at once and serially.",
            "After perforation: fluoroscopy can guide the needle; reverse heparin, if at all, only after the equipment is out and the pericardium emptied; seal the source.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cm-perforation-q1",
      stem: "Brilakis classifies coronary perforations by location before severity. Which three locations does he use?",
      options: [
        "Proximal, mid and distal segments of whichever epicardial artery is being treated",
        "Large vessel, distal vessel, and collateral vessel (septal or epicardial)",
        "Pericardial, myocardial, and cavity-spilling, as in the Ellis grades",
        "Wire-related, balloon-related, and atherectomy-related perforations",
      ],
      answer: 1,
      explanation:
        "Brilakis sorts perforations into large vessel, distal vessel and collateral vessel (septal or epicardial) because the location decides the treatment: covered stents for large vessels, embolisation or a covered stent over the branch origin for distal ones. Pericardial and myocardial blush and cavity spilling are features of the Ellis severity grades, and the mechanism (wire, balloon, atherectomy) is a cause, not a location.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q2",
      stem: "After a stent is post-dilated, contrast jets through a visible hole of about 1.5 mm into the pericardial space. Which Ellis class is this?",
      options: ["Class I", "Class II", "Class III", "Class III cavity spilling", "Not gradable by Ellis"],
      answer: 2,
      explanation:
        "Frank streaming of contrast through an exit hole of 1 mm or more is Ellis class III. Class II is a pericardial or myocardial blush without such a hole; class I is a crater without staining; cavity spilling is a leak into a chamber or the coronary sinus rather than the pericardium.",
      difficulty: 1,
      refs: [...BRILAKIS, "ellis-1994"],
    },
    {
      id: "cm-perforation-q3",
      stem: "A 4.0 mm non-compliant balloon post-dilating a stent in a 3.5 mm proximal RCA at 22 atm tears the vessel, and contrast streams into the pericardium. On the table, still on the wire, is the 4.0 mm non-compliant balloon; a 3.5 mm semi-compliant balloon is also open. Which tamponade inflation follows Brilakis?",
      options: [
        "The 4.0 mm non-compliant balloon at the tear at only 4 atm, since low pressure cannot stretch the vessel further",
        "The 3.5 mm semi-compliant balloon at the tear at 8 atm, left up continuously for at least 10–15 minutes",
        "The 3.5 mm semi-compliant balloon at 14 atm, to be certain that antegrade flow stops completely at the tear",
        "The 3.5 mm semi-compliant balloon at 8 atm, deflated every two minutes to see whether the leak has sealed",
        "A small balloon at 8 atm placed beyond the tear in the distal RCA, so that the stented segment is left untouched",
      ],
      answer: 1,
      explanation:
        "Brilakis specifies a semi-compliant balloon the size of the vessel, at or just proximal to the hole, at no more than 8–10 atm, which stops antegrade flow without overstretching the torn wall, and kept up for at least 10–15 minutes. The oversized non-compliant balloon is the wrong device even at low pressure, 14 atm exceeds his limit, repeated deflations let the vessel bleed each time, and a balloon beyond the tear does not stop inflow into it.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q4",
      stem: "Why does Brilakis advise, in most cases, delaying heparin reversal until all equipment is out of the coronary artery and the pericardium has been emptied?",
      options: [
        "Protamine is ineffective while an occluding balloon is inflated in the coronary artery",
        "Reversal risks guide or vessel thrombosis and can clot the pericardial blood so it cannot be drained",
        "Heparin has to be metabolised first, otherwise protamine causes a rebound anticoagulant effect",
        "Reversal stops covered stents from expanding fully, because the blood around them becomes more viscous",
      ],
      answer: 1,
      explanation:
        "Brilakis gives two reasons: reversing heparin can cause thrombosis of the guide or of the target vessel while equipment is in it, and it can make the blood in the pericardium clot so that it can no longer be drained through a needle. In his algorithm reversal comes after location-specific treatment has failed. Oxford lists protamine among early considerations, so the books differ in emphasis.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-perforation-q5",
      stem: "A patient received 8,000 units of heparin 70 minutes ago. A distal perforation has been sealed with fat, all coronary equipment is out and the pericardium has been drained, but a little fresh blood still comes from the drain, and the team decides to reverse. Which order fits the sources?",
      options: [
        "80 mg (1 mg per 100 units of the heparin given) over 10 minutes, because the full dose must match the heparin",
        "50 mg as a single rapid bolus, because the cap at 50 mg makes the speed of injection irrelevant",
        "No more than 50 mg, at 5 mg per minute or slower; Oxford would give less because over an hour has passed",
        "120 mg (1.5 mg per 100 units) given slowly over 30 minutes, the upper end of the Brilakis drug chapter",
        "8 mg, because only heparin given within the previous 15 minutes needs to be neutralised by protamine",
      ],
      answer: 2,
      explanation:
        "Brilakis gives 1 mg per 100 units (1–1.5 mg in his drug chapter) but caps the dose at 50 mg, no faster than 5 mg per minute, so 50 mg takes at least 10 minutes; Oxford also caps it at 50 mg over 10 minutes. Oxford's 1 mg per 80–100 units applies when the heparin was given in the last 15 minutes; with a half-life of 60–90 minutes, less is needed after 70 minutes. A fast bolus risks hypotension and reactions, and high doses of protamine are themselves anticoagulant.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-perforation-q6",
      stem: "In Brilakis's terminology, what is the 'block and deliver' technique?",
      options: [
        "Two guides from two access sites: one holds the blocking balloon, the other brings the device",
        "Deflating the blocking balloon, removing it, and then delivering the device through the same guide",
        "One guide carrying the blocking balloon and the device (covered stent or microcatheter) side by side",
        "Blocking the donor artery of a collateral while coils are delivered retrogradely from the other side",
      ],
      answer: 2,
      explanation:
        "Brilakis uses 'block and deliver' for the single-guide method: the blocking balloon and the covered stent, or a microcatheter for embolisation, travel side by side through one guide, so the vessel stays blocked until the device is ready. The two-guide method is the dual, 'ping-pong' or 'dueling' guide technique. Removing the balloon first lets the vessel bleed throughout the delivery.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q7",
      stem: "Two-layer (sandwich) covered stents are overlapped generously when they are used to cover a long tear. Which property of the device explains this?",
      options: [
        "They expand only to their nominal diameter, so a second device is needed to appose the wall",
        "They shorten by up to 1.6 mm at each end on expansion, about 3.2 mm in total at 15 atm",
        "Their membrane covers only the central half of the stent, leaving bare metal at both ends",
        "They recoil by about a third after deflation, so the ends lift off the wall within minutes",
      ],
      answer: 1,
      explanation:
        "Brilakis notes that the sandwich design shortens by up to 1.6 mm at each end (3.2 mm in total at its nominal 15 atm), so adequate overlap is needed over a long perforation. It needs high pressure (at least 15 atm, preferably higher for up to 60 seconds) to expand. None of the other properties offered (a limit at nominal diameter, a membrane over only the central half, or recoil by a third) is one he describes.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q8",
      stem: "For sealing a distal vessel perforation, why does Brilakis prefer fat to coils in most cases?",
      options: [
        "Fat is more visible on X-ray and lands more precisely than a detachable coil does",
        "Fat is universally available, costs nothing and passes through any microcatheter",
        "Fat dissolves within days, so the perforated branch reopens once the leak has healed",
        "Fat can be pushed through the guide without any microcatheter in the perforated branch",
      ],
      answer: 1,
      explanation:
        "Brilakis prefers fat (except for very large perforations) because it is always available, costs nothing, is biologically compatible and goes through any microcatheter. Its drawbacks are that it is less visible than a coil (it is soaked in contrast to make it show) and its delivery is uncontrolled, so it neither shows up better nor lands more precisely than a coil. It is delivered through a microcatheter placed in the branch, beside the blocking balloon.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q9",
      stem: "During CTO PCI of the LAD, which before the procedure filled through septal collaterals from the RCA, a tiny, sharply angled diagonal branch arising from the large mid LAD perforates. A balloon blocks it, but neither a wire nor a microcatheter will enter the branch. Which plan follows Brilakis?",
      options: [
        "Covered stent in the LAD across the branch origin, high-pressure post-dilatation, then an RCA injection",
        "Microcatheter in the LAD at the branch origin and fat injected there, then a final antegrade injection",
        "Coils in the mid LAD proximal to the branch, accepting occlusion of the LAD to stop the bleeding",
        "Prolonged inflation, then protamine with the wires still in, and a final antegrade injection only",
      ],
      answer: 0,
      explanation:
        "When the bleeding branch is too small or angulated to wire, Brilakis covers its origin with a covered stent in the parent vessel, post-dilates it at high pressure with a non-compliant balloon, and, because the branch filled through contralateral collaterals, injects the contralateral artery to exclude retrograde bleeding. Embolising the parent vessel would occlude a large LAD, which he calls undesirable, and protamine is not given while equipment is in the artery.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q10",
      stem: "After a distal perforation in a patient with previous CABG, he becomes hypotensive and tachycardic. Echo shows a localised collection behind the left atrium and no fluid anterior or inferior to the heart. How should the collection be drained?",
      options: [
        "Subxiphoid pericardiocentesis under fluoroscopy, aiming towards the tip of the left scapula as usual",
        "By CT-guided drainage or at emergency surgery, while the circulation is supported",
        "Through an apical needle placed blind, because the inferior approach cannot reach the left atrium",
        "It needs no drainage; give protamine so that the collection clots and stops expanding",
      ],
      answer: 1,
      explanation:
        "Brilakis describes loculated collections after CABG that compress single structures such as the left atrium and may be impossible to reach percutaneously, so drainage may have to be done under CT guidance or at emergency surgery; that is why he seals perforations in these patients at once. A subxiphoid needle cannot reach a posterior collection, a blind apical puncture is not what either manual offers here, and protamine does not decompress the heart.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-perforation-q11",
      stem: "Shortly after a PCI, a patient becomes hypotensive. Which finding most favours tamponade over a vasovagal reaction?",
      options: [
        "Nausea and sweating with pallor that started during groin compression",
        "A heart rate that rose from 70 to 115 bpm as the pressure fell",
        "A heart rate that fell from 70 to 45 bpm before the pressure fell",
        "Rapid improvement within a few minutes after atropine and saline",
      ],
      answer: 1,
      explanation:
        "In Oxford's account both can come on abruptly. The pulse separates them: it is usually fast in tamponade, whereas a faint brings the rate down first, typically during puncture or compression, with nausea, sweating and pallor, and settles within minutes with atropine and fluid. If there is any doubt, arrange an immediate echo.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "cm-perforation-q12",
      stem: "After a distal perforation is blocked with a balloon, echo shows a 6 mm effusion and the patient is stable (BP 118/72 mmHg, HR 84 bpm). What does Brilakis say about draining it?",
      options: [
        "Drain it at once, because every effusion after a perforation must be removed before the sealing starts",
        "A small effusion may be best left: the pericardial pressure may help tamponade the perforation",
        "Drain it only after protamine has been given, so that the pericardial blood stays liquid",
        "Drain it through the apical approach, because subxiphoid drainage of small effusions fails",
      ],
      answer: 1,
      explanation:
        "Brilakis ties drainage to haemodynamics: instability requires immediate pericardiocentesis, but a smaller effusion may be best managed conservatively, because the raised pericardial pressure from the blood may help to tamponade the perforation and reduce further bleeding; echo then follows its size and an echo contrast agent can show ongoing bleeding. Early protamine can make pericardial blood clot rather than keep it liquid.",
      difficulty: 3,
      refs: BRILAKIS,
    },
  ],
  sims: [
    { sim: "pericardiocentesis", task: "Drain acute haemopericardium after a coronary perforation under fluoroscopy and echo: before dilating, confirm the wire curls round the heart border outside the chambers and not into the right ventricular outflow tract, aspirate until the pressure recovers, leave the drain and re-image." },
    { sim: "haemo", task: "Measure pulsus paradoxus on the arterial trace and describe the right atrial pressure, and decide whether the picture fits tamponade." },
    { sim: "pci-bench", task: "Choose a post-dilatation balloon for a stent in a tapering vessel sized to the distal reference, and keep the pressure moderate, so that the stent expands without tearing the vessel." },
  ],
  caseIds: ["cm-perforation-case-large-vessel", "cm-perforation-case-distal-cabg"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cm-perforation-case-large-vessel",
    title: "A ruptured mid LAD: balloon, second guide, covered stent and drain",
    trackId: "complication-management",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 26.1–26.3 (Figs 26.5–26.9, Table 26.1), 30.18 and 3.4; Oxford Handbook ch 10 (coronary perforation, cardiac tamponade, protamine sulphate) and ch 9 (pericardiocentesis).",
    },
    summary:
      "A calcified LAD is post-dilated with an oversized non-compliant balloon at very high pressure and ruptures. The case tests the universal sequence, the two-guide delivery of a covered stent, pericardiocentesis and the handling of heparin.",
    presentation:
      "A 72-year-old woman with stable angina despite two anti-anginal drugs undergoes PCI of a heavily calcified 85% mid-LAD lesion through a 6 Fr EBU 3.5 guide from the right radial artery. Unfractionated heparin has been given; ACT 290 s. A 3.0 × 28 mm drug-eluting stent has been deployed. Its distal half looked underexpanded, and it was post-dilated with a 3.5 mm non-compliant balloon at 24 atm; the distal reference measures 3.0 mm.",
    findings: [
      "Heavily calcified mid LAD; distal reference 3.0 mm",
      "6 Fr guide from the right radial; no other access",
      "BP 126/70 mmHg, HR 78 bpm before the post-dilatation",
      "No GP IIb/IIIa inhibitor or cangrelor given",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The next injection shows contrast streaming from the distal stent edge through a clear exit hole into the pericardium. BP 108/62 mmHg, HR 92 bpm. What is your first action?",
        info: "Large-vessel, Ellis class III perforation at the distal stent edge. The wire is still in the distal LAD.",
        options: [
          {
            text: "Inflate a 3.0 mm semi-compliant balloon at the tear at 8 atm and keep it up",
            best: true,
            feedback: "Right. Brilakis's first step, immediately: a vessel-sized semi-compliant balloon at no more than 8–10 atm, prolonged. Everything else is organised while it is up.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Re-inflate the 3.5 mm non-compliant balloon at 24 atm to press the tear closed",
            feedback: "The oversized balloon at very high pressure made the tear. Brilakis specifies a semi-compliant, vessel-sized balloon at 8–10 atm or less, to stop flow without stretching the vessel further.",
            next: "c-tear-extended",
            stateDelta: { stability: -15, flags: ["tear-extended"] },
          },
          {
            text: "Give protamine 50 mg IV now and repeat the injection in five minutes",
            feedback: "Protamine does not seal an Ellis III tear, and with a guide, wire and fresh stent in the LAD it risks thrombosis. The balloon comes first.",
            next: "c-protamine",
            stateDelta: { stability: -15, flags: ["early-protamine"] },
          },
          {
            text: "Pull the wire back so the vessel can be imaged without it",
            feedback: "The wire is the route for the blocking balloon and the covered stent. Losing it leaves a free-bleeding artery with no quick way back in.",
            next: "c-wire-lost",
            stateDelta: { stability: -25, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "c-tear-extended",
        kind: "consequence",
        prompt: "After the high-pressure inflation the jet is larger. BP 88/54 mmHg, HR 110 bpm. What now?",
        options: [
          {
            text: "Deflate and replace it with a 3.0 mm semi-compliant balloon at 8 atm at the tear, then run the universal sequence",
            best: true,
            feedback: "Occlude at low pressure with a vessel-sized balloon. The extra injury will make a covered stent all the more necessary.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inflate the non-compliant balloon to 28 atm to close the larger hole",
            feedback: "More pressure from an oversized balloon tears further.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-protamine",
        kind: "consequence",
        prompt: "Five minutes after protamine the pericardial stain is larger, and a hazy filling defect has appeared inside the stent. BP 84/50 mmHg. What now?",
        info: "Effusion growing on fluoroscopy; possible thrombus in the stent.",
        options: [
          {
            text: "Inflate a vessel-sized semi-compliant balloon at the tear now, stop further protamine, and continue the universal sequence",
            best: true,
            feedback: "Mechanical control first. Brilakis delays reversal in most cases because it risks thrombosis of the guide or the vessel and clotting of pericardial blood, as here.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give a second 50 mg dose of protamine",
            feedback: "Protamine is limited to 50 mg in all three sources, it does not seal a tear, and the stent is already thrombosing.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-wire-lost",
        kind: "consequence",
        prompt: "The wire is out and the LAD bleeds freely. BP 70/40 mmHg, HR 126 bpm. What now?",
        options: [
          {
            text: "Rewire the LAD at once and inflate a balloon at the tear, while a colleague drains the pericardium under fluoroscopy",
            best: true,
            feedback: "Regain control of the vessel and drain the tamponade in parallel. The wire should never have come out.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give protamine and wait for the bleeding to slow",
            feedback: "An Ellis III tear will not seal with reversal alone.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The balloon is up and an injection shows no further leak. BP 102/60 mmHg, HR 98 bpm. What do you organise now?",
        options: [
          {
            text: "A second arterial access (right femoral) for a larger guide, fluids and a vasopressor ready, echo and the pericardiocentesis kit, and a call to the surgeons",
            best: true,
            feedback: "Right. The guide is not 8 Fr, so Brilakis says a second access should be strongly considered for the covered stent; support, echo and early surgical notification complete the universal sequence.",
            next: "s3",
            stateDelta: { stability: 0 },
          },
          {
            text: "Deflate the balloon every minute to see whether the hole has sealed",
            feedback: "Each deflation lets the vessel bleed into the pericardium. Brilakis wants at least 10–15 minutes of continuous inflation.",
            next: "c-deflate",
            stateDelta: { stability: -15, flags: ["repeated-deflation"] },
          },
          {
            text: "Give fluids and wait 15 minutes before deciding anything else",
            feedback: "Not acceptable in an Ellis III tear through a 6 Fr guide: a long inflation is right and may seal smaller tears, but use those minutes. Brilakis wants a second access strongly considered when the guide is not 8 Fr and the surgeons told early, so the second access, the covered stent, echo and the surgeons should all be in motion.",
            next: "s3",
            stateDelta: { stability: -10, flags: ["delayed-preparation"] },
          },
        ],
      },
      {
        id: "c-deflate",
        kind: "consequence",
        prompt: "Each deflation shows a fresh jet and the stain around the heart grows. BP 86/52 mmHg, HR 116 bpm. What now?",
        options: [
          {
            text: "Keep the balloon up continuously, get the second access and echo, and prepare to drain",
            best: true,
            feedback: "Continuous occlusion while the definitive treatment is prepared.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Continue checking every minute; it will seal eventually",
            feedback: "A class III tear from oversizing is unlikely to seal this way, and each check adds blood to the pericardium.",
            stateDelta: { stability: -15, flags: ["tamponade"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Echo shows a 14 mm circumferential effusion with right ventricular diastolic collapse. BP 76/48 mmHg, HR 122 bpm. The balloon remains inflated. What do you do?",
        info: "Contrast outlines the pericardial sac on fluoroscopy. The blood that escaped before the balloon went up is now compressing the right ventricle: Brilakis notes that effusions from coronary perforations build up quickly.",
        variants: [{ flag: "repeated-deflation", info: "The effusion is larger than it would have been: each deflation added blood." }],
        options: [
          {
            text: "Subxiphoid pericardiocentesis now under fluoroscopy and echo, balloon still inflated, and leave a pigtail drain",
            best: true,
            feedback: "Right. Instability means immediate drainage; the leaked contrast lets fluoroscopy guide the needle. Keep the drain to follow the output.",
            next: "s4",
            stateDelta: { stability: 10 },
          },
          {
            text: "Deflate the balloon and try to deliver a covered stent first",
            feedback: "The covered stent is not ready and deflating now would add blood to a tamponaded heart. Drain first, with the balloon up.",
            next: "s4",
            stateDelta: { stability: -15, flags: ["tamponade"] },
          },
          {
            text: "Start noradrenaline and observe; small effusions can help to seal the hole",
            feedback: "Brilakis's conservative option is for a small effusion in a stable patient. This patient is hypotensive with right ventricular collapse: haemodynamic instability requires immediate pericardiocentesis (Brilakis 26.2; Oxford ch 10), with support alongside it, not instead of it.",
            next: "c-no-drain",
            stateDelta: { stability: -20, flags: ["tamponade"] },
          },
        ],
      },
      {
        id: "c-no-drain",
        kind: "consequence",
        prompt: "Five minutes on noradrenaline, the pressure is 64/40 mmHg and the heart rate 130 bpm; the patient is drowsy. The echo shows the same effusion with right atrial and right ventricular collapse. What now?",
        options: [
          {
            text: "Pericardiocentesis now under fluoroscopy, balloon still inflated, and leave a pigtail drain",
            best: true,
            feedback: "Drainage is the treatment for tamponade; vasopressors only buy minutes. The leaked contrast lets fluoroscopy guide the needle.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Add a second vasopressor and keep observing, since the balloon has stopped the leak",
            feedback: "The leak is controlled but the blood already in the pericardium is compressing the heart. Without drainage the patient will arrest.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After 60 mL is drained, BP is 112/68 mmHg. An 8 Fr guide is ready in the right femoral artery. The laboratory stocks the two-layer (sandwich) covered stent, 2.8 mm. How will you deliver it?",
        options: [
          {
            text: "Pull the radial guide back into the aorta with its balloon still inflated; engage the LAD with the 8 Fr guide; pass a second wire beyond the tear during a brief deflation; bring the covered stent up to the balloon; then swap",
            best: true,
            feedback: "Right: the two-guide ('ping-pong') technique, with the second guide ideally 8 Fr for the sandwich design. The vessel bleeds only for the seconds of the swap.",
            next: "s5",
            stateDelta: { stability: 0 },
          },
          {
            text: "Deflate and remove the balloon, then pass the covered stent through the 6 Fr radial guide",
            feedback: "The vessel bleeds for the whole delivery of a bulky device through a calcified LAD, which may take minutes.",
            next: "c-unblocked-delivery",
            stateDelta: { stability: -15, flags: ["tamponade"] },
          },
          {
            text: "Coil the mid LAD at the tear to occlude it",
            feedback: "Coils can stop a large-vessel perforation by occluding the vessel, but sacrificing the mid LAD is not the answer when a covered stent can be delivered.",
            next: "s5",
            stateDelta: { stability: -10, flags: ["lad-occluded"] },
          },
        ],
      },
      {
        id: "c-unblocked-delivery",
        kind: "consequence",
        prompt: "The covered stent sticks at the proximal stent edge while the LAD bleeds and the drain fills fast. BP 82/50 mmHg. What now?",
        options: [
          {
            text: "Reinflate a blocking balloon at the tear (through the femoral guide) and use the two-guide technique with anchor or extension support",
            best: true,
            feedback: "Re-establish the block, then deliver with support. The sandwich design may not pass existing stents without a distal anchor or a guide extension.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pushing the covered stent harder through the radial guide",
            feedback: "Force without support risks losing the device while the vessel keeps bleeding.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The 2.8 × 16 mm covered stent is deployed at 15 atm across the tear. A thin stain persists beside its distal end, and the drain still produces a little fresh blood. What next?",
        variants: [{ flag: "lad-occluded", info: "The mid LAD is occluded by coils; the anterior wall is akinetic on echo." }],
        options: [
          {
            text: "Post-dilate the covered stent at high pressure, including its distal shoulder, and stent any residual edge dissection",
            best: true,
            feedback: "Right. The sandwich design needs high pressure to expand and seal, shortens at its ends, and a residual dissection can be a re-entry point for bleeding.",
            next: "s6",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give protamine now that a covered stent is in place",
            feedback: "Equipment is still in the LAD; reversal risks thrombosis of the new stents and does not fix an under-expanded covered stent.",
            next: "c-thrombus",
            stateDelta: { stability: -15, flags: ["stent-thrombus"] },
          },
          {
            text: "Accept the result and remove the wires",
            feedback: "A persisting stain beside the stent means the seal is incomplete; you would be giving up the route to fix it.",
            next: "s6",
            stateDelta: { stability: -10, flags: ["incomplete-seal"] },
          },
        ],
      },
      {
        id: "c-thrombus",
        kind: "consequence",
        prompt: "Two minutes after protamine a filling defect appears inside the LAD stents and flow slows. What now?",
        options: [
          {
            text: "Stop any further protamine, aspirate the thrombus, then post-dilate the covered stent at high pressure; decide with the team whether more heparin is needed while the seal is incomplete",
            best: true,
            feedback: "Brilakis's Fig. 26.9 shows thrombus forming in the stents after a covered stent, treated by aspiration (the left main stent in that case treated a separate dissection). Brilakis warns that early reversal risks thrombosis of the guide or the vessel (26.2). Neither manual says whether to re-heparinise while the covered stent still leaks, so that is a team decision under local protocol.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give a GP IIb/IIIa inhibitor bolus",
            feedback: "GP IIb/IIIa inhibitors are stopped, not started, after a perforation.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "After high-pressure post-dilatation the leak has stopped, TIMI 3 flow, and the drain output has fallen to a few millilitres. BP 118/70 mmHg. ACT 270 s. How do you finish?",
        variants: [{ flag: "incomplete-seal", info: "The drain output increases again after the wires are removed; the leak has restarted." }],
        options: [
          {
            text: "Remove the coronary equipment, keep the drain, echo now and serially, and reverse heparin only if bleeding continues",
            best: true,
            feedback: "Right. Brilakis withholds reversal until all equipment is out and the pericardium is drained, and his algorithm reserves it for continued extravasation; with the leak sealed and the output falling, it is not needed now. Oxford keeps the drain until bleeding stops (possibly days) and repeats the echo after drainage and serially. Covered stents carry a higher risk of thrombosis and restenosis (Brilakis 5.6.4, 25.2); the manuals give no specific advice on oral antiplatelet therapy after a perforation, so follow local practice.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give 50 mg protamine as a fast bolus with the wires still in the LAD, then remove the drain",
            feedback: "Fast protamine causes hypotension and reactions (Brilakis: no faster than 5 mg/min), reversal with equipment in the artery risks thrombosis, and the drain is your monitor.",
            stateDelta: { stability: -15 },
          },
          {
            text: "Remove the drain now, because the output has stopped",
            feedback: "Keep it until the bleeding has clearly stopped and serial echo shows no re-accumulation.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The tear was sealed with a covered stent delivered through a second guide while a semi-compliant balloon kept the pericardium from filling further. Pericardiocentesis relieved the tamponade and the drain was removed after two days with no re-accumulation on echo.",
    outcomeVariants: [
      { flag: "early-protamine", text: "Early protamine made the stents thrombose and complicated the drainage; the thrombus needed aspiration." },
      { flag: "wire-lost", text: "Losing the wire left the LAD bleeding freely for several minutes; the patient needed vasopressors and a large-volume drainage before control was regained." },
      { flag: "delayed-preparation", text: "Waiting before organising the second access and the covered stent cost time while the effusion grew." },
      { flag: "lad-occluded", text: "Coiling the mid LAD sealed the leak at the cost of an anterior infarct." },
      { flag: "stent-thrombus", text: "Protamine given with equipment in the LAD caused stent thrombosis that needed aspiration and further dilatation." },
      { flag: "incomplete-seal", text: "The incompletely sealed covered stent leaked again after the wires were out; the LAD had to be rewired and the stent post-dilated." },
    ],
    learningPoints: [
      "Balloon first: semi-compliant, vessel-sized, 8–10 atm or less, at least 10–15 minutes; never re-inflate the oversized balloon that caused the tear.",
      "With a guide smaller than 8 Fr, give strong consideration to a second arterial access for the covered stent.",
      "Hypotension with an effusion means drainage now; fluoroscopy can guide it because contrast outlines the sac.",
      "Two-guide ('ping-pong') delivery keeps the vessel blocked until the covered stent is beside the balloon.",
      "Post-dilate the covered stent hard, including the shoulders, and stent residual dissections.",
      "Reverse heparin late, slowly and only if needed; keep the drain and re-image.",
    ],
    refs: BOOKS,
  },
  {
    id: "cm-perforation-case-distal-cabg",
    title: "A distal wire perforation in a patient with bypass grafts",
    trackId: "complication-management",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 26.4 (Figs 26.10 and 26.13, Tables 26.2 to 26.4), 26.6, 18, 2.3 (Fig. 2.2), 21.3, 30.6 and 30.18; Oxford Handbook ch 10 (coronary perforation, cardiac tamponade) and ch 9 (pericardiocentesis).",
    },
    summary:
      "After a native RCA PCI in a patient with previous CABG, a polymer-jacketed wire left in a small distal branch perforates. The case tests blocking, the 'block and deliver' embolisation, the choice of fat or coil, and the danger of a loculated collection.",
    presentation:
      "A 69-year-old man with CABG nine years ago (LIMA to LAD patent, vein graft to the RCA occluded) has a 90% mid-RCA lesion causing angina. PCI is done through a 7 Fr JR4 guide from the right femoral artery. A soft polymer-jacketed wire was needed to cross a tortuous segment and was left in place for stenting. Heparin was given; ACT 280 s.",
    findings: [
      "Previous CABG: LIMA to LAD patent, vein graft to RCA occluded",
      "7 Fr guide from the right femoral artery",
      "Stent deployed in the mid RCA over a polymer-jacketed wire",
      "BP 132/76 mmHg, HR 70 bpm before the final images",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The final injection, with the field opened up, shows the wire tip deep in a small posterolateral branch and a small jet of contrast leaving that branch. BP 124/72 mmHg. What do you do first?",
        info: "Distal vessel perforation, Ellis III, in a small posterolateral branch.",
        options: [
          {
            text: "Inflate a small balloon in the branch just proximal to the exit to stop the bleeding",
            best: true,
            feedback: "Right. Block first, as for every perforation, then plan the definitive seal.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Finish the case and observe: bypass patients are protected by their adhesions",
            feedback: "Brilakis calls this belief outdated: loculated haematomas can compress a chamber and may be impossible to drain. Perforations after CABG are treated at once.",
            next: "c-late-block",
            stateDelta: { stability: -20, flags: ["observed"] },
          },
          {
            text: "Start a GP IIb/IIIa inhibitor to protect the stent while the leak settles",
            feedback: "Brilakis stops these drugs after any perforation and never starts them after a distal one: tamponade can appear hours later.",
            next: "c-late-block",
            stateDelta: { stability: -20, flags: ["gp-started"] },
          },
        ],
      },
      {
        id: "c-late-block",
        kind: "consequence",
        prompt: "While the guide is being withdrawn, a nurse points out that the stain around the posterolateral branch is spreading. BP 102/64 mmHg, HR 98 bpm. What now?",
        info: "The wire is still in the branch; the guide is still engaged.",
        options: [
          {
            text: "Stop any GP IIb/IIIa infusion, inflate a small balloon proximal to the exit, and seal the branch now",
            best: true,
            feedback: "Block, stop the IV antiplatelet drug, and treat definitively: after CABG a leak left alone can form a loculated collection.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Remove the guide and send him to the ward with an echo booked for the morning",
            feedback: "A distal leak can cause tamponade hours later, and after CABG the blood can loculate out of reach of a needle.",
            next: "c-ward",
            stateDelta: { stability: -20, flags: ["late-loculated"] },
          },
        ],
      },
      {
        id: "c-ward",
        kind: "consequence",
        prompt: "Three hours later on the ward he is hypotensive (80/50 mmHg) and tachycardic. Echo shows a collection behind the left atrium, compressing it, with no free effusion in front of or below the heart. What now?",
        options: [
          {
            text: "Support the circulation, bring him straight back to the laboratory to block and seal the branch with surgeons on standby, and drain the collection under CT guidance or at surgery once the source is controlled (or at emergency surgery if he cannot be stabilised)",
            best: true,
            feedback: "Brilakis puts immediate sealing first in prior-CABG patients, and gives CT-guided drainage or emergency surgery for the loculated collection, which a needle may not reach (26.6). Draining before the branch is sealed would let the collection refill (this module's reasoning).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Attempt a subxiphoid pericardiocentesis on the ward",
            feedback: "The collection is not where a subxiphoid needle goes.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The balloon stops the leak. How will you seal the branch definitively through the 7 Fr guide?",
        variants: [{ flag: "late-loculated", info: "He is back on the table; the branch has been rewired and a small balloon blocks it again; the surgeons and the CT drainage team are aware." }],
        options: [
          {
            text: "'Block and deliver': during brief deflations pass a second wire and then a microcatheter into the branch beside the balloon; inject through the microcatheter to find the hole",
            best: true,
            feedback: "Right. Balloon and microcatheter fit together in a guide of 6 Fr or more for most microcatheters, and tip injections show the leak without deflating.",
            next: "s3",
            stateDelta: { stability: 0 },
          },
          {
            text: "Keep the balloon up for 10 minutes, deflate, and stop if the leak has gone",
            feedback: "Prolonged inflation alone is not enough here, and Brilakis specifies at least 10–15 minutes even for that. He treats every perforation after CABG at once with embolisation or a covered stent, because a leak that reopens can loculate where no needle reaches (26.6).",
            next: "s3",
            stateDelta: { stability: -10, flags: ["no-definitive-seal"] },
          },
          {
            text: "Get a second arterial access and a second guide for the microcatheter",
            feedback: "Unnecessary: Brilakis's block and deliver technique avoids a second guide (26.4), and a second puncture adds time and, in an anticoagulated patient, a further bleeding site.",
            next: "s3",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The microcatheter in the branch is a standard 0.014-inch-compatible one. The shelf holds only 0.018-inch pushable coils. What do you use?",
        options: [
          {
            text: "Autologous fat from the femoral access site, soaked in contrast for about a minute and loaded with the hub inverted",
            best: true,
            feedback: "Right. Fat passes through any microcatheter, is always available and free; Brilakis prefers it in most cases.",
            next: "s4",
            stateDelta: { stability: 0 },
          },
          {
            text: "Push one of the 0.018-inch coils through the microcatheter already in place",
            feedback: "Coils for 0.018-inch microcatheters cannot pass standard 0.014-inch microcatheters (with one low-profile exception in Brilakis's text); you would need a larger microcatheter.",
            next: "c-coil-stuck",
            stateDelta: { stability: -10, flags: ["coil-mismatch"] },
          },
          {
            text: "Change to a larger 0.018-inch microcatheter, then deliver the pushable coil",
            acceptable: true,
            feedback: "Feasible, but Brilakis's Table 26.2 lists 0.018-inch-compatible microcatheters needing anything from a 6 Fr to an 8 Fr guide for block and deliver (the one in his Fig. 26.13 needs 8 Fr, more than this 7 Fr guide); it also adds an exchange, and a pushable coil cannot be retrieved. Fat through the catheter already there is quicker.",
            next: "s4",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-coil-stuck",
        kind: "consequence",
        prompt: "The coil will not advance beyond the hub of the microcatheter. What now?",
        options: [
          {
            text: "Remove the coil and use fat through the same microcatheter",
            best: true,
            feedback: "Match the material to the catheter; fat goes through any microcatheter.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push harder with the back of a wire",
            feedback: "An incompatible coil can jam the microcatheter and lose your access to the branch.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After two pieces of fat, a microcatheter injection still shows a slow trickle out of the branch. His blood pressure has held since the balloon went up. What next?",
        variants: [{ flag: "late-loculated", info: "His pressure is holding at about 100/64 mmHg only with the support started on the ward; the collection behind the left atrium has not been drained." }],
        options: [
          {
            text: "Wait a few minutes with the balloon up, inject again, and add more fat if it still leaks",
            best: true,
            feedback: "Right. Several pieces of fat may be needed (Brilakis 26.4.1). He describes sealing being delayed by a few minutes after a coil; a short re-check before adding more fat applies the same caution.",
            next: "s5",
            stateDelta: { stability: 0 },
          },
          {
            text: "Give protamine now to make the fat work",
            feedback: "Equipment is in the artery and the pericardium has not been drained; Brilakis keeps reversal for failure of the definitive treatment, after the equipment is out.",
            next: "s5",
            stateDelta: { stability: -10, flags: ["early-protamine"] },
          },
          {
            text: "Abandon embolisation and call for emergency surgery",
            feedback: "Surgery is for failure of percutaneous treatment (3% in UK data); the seal is nearly complete.",
            next: "s5",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "A third piece seals the branch on microcatheter and guide injections. Twenty minutes later, as the sheath is being removed, BP falls to 92/62 mmHg and HR rises to 108 bpm; the arterial trace swings by about 25 mmHg with breathing. The echo shows no free anterior or inferior effusion, but a collection behind the left atrium.",
        variants: [
          { flag: "early-protamine", info: "The collection looks echo-dense, consistent with clot." },
          { flag: "late-loculated", info: "This is the collection first seen on the ward: sealing the branch has stopped it filling, but it has not been drained." },
        ],
        options: [
          {
            text: "Treat this as a loculated collection compressing the left atrium: support the pressure, call the surgeons and arrange CT-guided or surgical drainage",
            best: true,
            feedback: "Right. After CABG, blood can loculate and compress one chamber ('dry tamponade') where a needle from below the xiphoid cannot reach; CT-guided drainage or surgery may be needed.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Attempt a subxiphoid pericardiocentesis, aiming towards the left scapula",
            feedback: "There is no collection in the path of a subxiphoid needle; blind needling risks the heart without reaching the blood.",
            next: "c-blind-needle",
            stateDelta: { stability: -20, flags: ["blind-needle"] },
          },
          {
            text: "Give atropine and fluid for a vasovagal reaction during sheath removal",
            feedback: "Vasovagal reactions slow the heart; this patient is tachycardic with a respiratory swing on the arterial trace, after a perforation.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-blind-needle",
        kind: "consequence",
        prompt: "The needle returns nothing and ventricular ectopy appears. BP 84/56 mmHg. What now?",
        options: [
          {
            text: "Withdraw the needle, support the pressure, and arrange CT-guided or surgical drainage urgently",
            best: true,
            feedback: "The collection is loculated out of reach; the drainage has to be done where it can be seen.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance the needle further until fluid returns",
            feedback: "Advancing blind towards the heart risks a ventricular puncture.",
            stateDelta: { stability: -20 },
          },
        ],
      },
    ],
    outcome:
      "The branch was sealed with fat through a microcatheter placed beside the blocking balloon in the single guide. A loculated collection behind the left atrium was recognised on echo and drained under CT guidance, and the patient recovered.",
    outcomeVariants: [
      { flag: "observed", text: "The minutes spent deciding to observe let more blood into the pericardium before the branch was blocked." },
      { flag: "late-loculated", text: "Sending him to the ward with the branch still leaking let a loculated haematoma form; it compressed the left atrium hours later; the branch had to be sealed on a second visit to the laboratory and the collection drained under CT guidance." },
      { flag: "no-definitive-seal", text: "Relying on balloon inflation alone left the branch at risk of reopening; it was sealed definitively only after the delay." },
      { flag: "gp-started", text: "A GP IIb/IIIa inhibitor after a distal perforation prolonged the bleeding into a loculated collection." },
      { flag: "coil-mismatch", text: "An incompatible coil cost time before the branch was sealed with fat." },
      { flag: "early-protamine", text: "Early protamine left the collection clotted, which made drainage harder." },
      { flag: "blind-needle", text: "A blind subxiphoid attempt caused ventricular ectopy without reaching the collection." },
    ],
    learningPoints: [
      "Watch the tip of a polymer-jacketed wire, and exchange it for a workhorse wire after crossing.",
      "Distal perforation: block proximally, then seal definitively; never start a GP IIb/IIIa inhibitor or cangrelor.",
      "'Block and deliver' puts the balloon and the microcatheter in one guide of 6 Fr or more.",
      "Fat goes through any microcatheter; 0.018-inch coils need a larger one; sealing can take minutes and several pieces.",
      "After CABG, treat perforation immediately: loculated collections compress single chambers and may need CT-guided or surgical drainage.",
      "Tachycardia and a respiratory swing on the trace point to tamponade, not a vasovagal reaction.",
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-perf-grade-and-locate",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"] },
    title: "Name the location and the grade",
    text: "Say where the hole is (large vessel, distal branch or collateral) and its Ellis grade: crater (I), blush without a 1 mm exit (II), streaming through 1 mm or more (III), or spilling into a chamber. The location picks the definitive treatment; cavity spilling can still cause hypotension.",
    tone: "do",
    lessonId: "cm-perforation-classify",
    sources: [B("26.1"), O_PERF],
    refs: [...BOOKS, "ellis-1994"],
  },
  {
    id: "pci-perf-wire-tip-watch",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent", "optimise"], event: ["wire-distal-position"] },
    title: "Keep the wire tip out of small branches",
    text: "Check the distal tip before every device push and exchange, especially with stiff, tapered or polymer-jacketed wires and when collimation hides it. Swap a specialty wire for a workhorse once across, and trap rather than flush during exchanges.",
    tone: "caution",
    lessonId: "cm-perforation-classify",
    sources: [B("26.4"), B("8.9"), B("8.10"), B("28.2"), O("ch 8: Angioplasty guide wires")],
    refs: BOOKS,
  },
  {
    id: "pci-perf-wire-exit-no-follow",
    lab: "pci",
    when: { phase: ["wire"], event: ["perforation", "wire-not-crossing"] },
    title: "An exited wire: redirect it, follow it with nothing",
    text: "A wire tip outside the vessel usually leaves a small hole that seals itself; a microcatheter or balloon pushed over it makes the hole bleed. Confirm the wire is within the vessel before anything follows it, and if it has exited, pull it back and redirect.",
    tone: "caution",
    lessonId: "cm-perforation-classify",
    sources: [B("26.3"), B("21.8")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-size-and-pressure",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], event: ["stent-underexpanded", "balloon-undilatable"] },
    title: "Underexpansion is not a reason to oversize",
    text: "Size balloons and stents to the distal reference, ideally with imaging, and avoid very high pressures in calcified segments and vein grafts. If a balloon bursts, apply suction, remove it, aspirate the guide and take an angiogram straight away.",
    tone: "caution",
    lessonId: "cm-perforation-classify",
    sources: [B("26.3"), B("10.2"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-balloon-now",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent", "optimise", "complication"], event: ["perforation"] },
    title: "Perforation: balloon up now",
    text: "Inflate a semi-compliant balloon the size of the vessel at or just proximal to the hole, at no more than 8–10 atm, and keep it up for at least 10–15 minutes. Keep the wire where it is: everything that seals the hole will travel along it.",
    tone: "bailout",
    lessonId: "cm-perforation-first-minutes",
    sources: [B("26.2"), O_PERF],
    refs: BOOKS,
  },
  {
    id: "pci-perf-second-access",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"] },
    title: "Large vessel and a guide under 8 Fr: second access",
    text: "With a large-vessel perforation and a guide smaller than 8 Fr, strongly consider a second arterial access early. A second guide can bring the covered stent while the first guide's balloon keeps the pericardium dry.",
    tone: "do",
    lessonId: "cm-perforation-first-minutes",
    sources: [B("26.2"), B("26.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-support-and-call",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"] },
    title: "Support, drain if low, tell the surgeons",
    text: "Give IV fluids and a vasopressor (atropine if a vagal reaction slows the heart). Drain the pericardium at once if the patient is unstable; a small effusion in a stable patient may be better left, as its pressure helps seal the hole. Notify the cardiac surgeons early.",
    tone: "bailout",
    lessonId: "cm-perforation-first-minutes",
    sources: [B("26.2"), O_PERF, O_TAMP],
    refs: BOOKS,
  },
  {
    id: "pci-perf-covered-one-guide",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"] },
    title: "Covered stent through one guide: block and deliver",
    text: "If the blocking balloon and the covered stent fit together in the guide (usually 8 Fr for the sandwich design), pass a second wire beyond the tear during a brief deflation, bring the covered stent up to the inflated balloon, then deflate and swap. Reinflate if the stent will not reach.",
    tone: "do",
    lessonId: "cm-perforation-large-vessel",
    sources: [B("26.3"), B("30.18")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-covered-two-guides",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"] },
    title: "Covered stent through two guides: ping-pong",
    text: "Pull the first guide back into the aorta with its balloon still inflated, engage the ostium with a second guide (ideally 8 Fr for the sandwich design), cross with a second wire during a brief deflation, bring the covered stent up beside the balloon, then swap.",
    tone: "do",
    lessonId: "cm-perforation-large-vessel",
    sources: [B("26.3"), B("30.18")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-covered-expand",
    lab: "pci",
    when: { phase: ["complication", "optimise"], event: ["perforation"] },
    title: "Finish the covered stent properly",
    text: "Post-dilate the covered stent at high pressure (the sandwich design needs at least 15 atm and shortens at its ends), dilate the shoulders if contrast still leaks behind it, and stent any residual dissection that could let blood back in.",
    tone: "do",
    lessonId: "cm-perforation-large-vessel",
    sources: [B("26.3"), B("30.18")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-distal-block-deliver",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"], requires: ["wire-distal-position"] },
    title: "Distal leak: balloon and microcatheter in one guide",
    text: "Keep the blocking balloon proximal to the exit. During brief deflations pass a second wire and then a microcatheter into the bleeding branch through the same guide (6 Fr or more), inject through the microcatheter tip to find the hole, then embolise.",
    tone: "bailout",
    lessonId: "cm-perforation-distal",
    sources: [B("26.4"), O_PERF],
    refs: BOOKS,
  },
  {
    id: "pci-perf-fat-embolisation",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"], requires: ["wire-distal-position"] },
    title: "Fat goes through any microcatheter",
    text: "Harvest fat with a haemostat at the femoral arteriotomy site, cut it small, soak it in contrast for about a minute, load it with the microcatheter hub upside down (it floats), and flush it out with saline. Several pieces may be needed.",
    tone: "do",
    lessonId: "cm-perforation-distal",
    sources: [B("26.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-coil-match",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"], requires: ["wire-distal-position"] },
    title: "Match the coil to the microcatheter",
    text: "0.014-inch-compatible detachable coils go through standard microcatheters and can be retrieved until released; most 0.018-inch coils need a larger microcatheter. Release a detachable coil only when its position is right, keep loops out of the main vessel, and allow a few minutes for sealing.",
    tone: "do",
    lessonId: "cm-perforation-distal",
    sources: [B("26.4"), B("30.18"), B("30.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-distal-covered-origin",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation"], requires: ["wire-distal-position"] },
    title: "Branch too small to wire: cover its origin",
    text: "Pass a second wire down the main vessel during a brief deflation, bring a covered stent up to the blocking balloon, then swap and cover the origin of the bleeding branch. Post-dilate at high pressure and, if collaterals fed the branch, inject the other artery too.",
    tone: "bailout",
    lessonId: "cm-perforation-distal",
    sources: [B("26.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-perf-distal-finish-watch",
    lab: "pci",
    when: { phase: ["finish"], event: ["perforation"], requires: ["wire-distal-position"] },
    title: "After a distal perforation: no IV antiplatelet drugs, and watch",
    text: "A distal leak can fill the pericardium hours later. Do not start a GP IIb/IIIa inhibitor or cangrelor and monitor the patient closely; Ellis advised observing for at least 24 hours. Get an echo at once if the pressure falls.",
    tone: "caution",
    lessonId: "cm-perforation-distal",
    sources: [B("26.4"), O_PERF],
    refs: [...BOOKS, "ellis-1994"],
  },
  {
    id: "pci-perf-check-other-side",
    lab: "pci",
    when: { phase: ["complication", "finish"], event: ["perforation"] },
    title: "Check the seal from the other side",
    text: "If the sealed branch filled through collaterals before the perforation, inject the contralateral artery before you call it sealed (Brilakis 26.4). An epicardial collateral can leak on either side: in Boukhris 2015 a second leak at the recipient junction needed antegrade coils after retrograde coiling, so check it from both arteries too.",
    tone: "caution",
    lessonId: "cm-perforation-collateral-cabg",
    sources: [B("26.4"), B("26.5")],
    refs: [...BRILAKIS, "boukhris-collateral-coil-2015"],
  },
  {
    id: "pci-perf-hypotension-tamponade",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent", "optimise", "complication", "finish"], event: ["hypotension"] },
    title: "Falling pressure and a fast heart: think pericardium",
    text: "Hypotension with tachycardia, an inspiratory fall in systolic pressure or contrast around the heart is tamponade until an echo says otherwise. Review every wire position, including distal branches and collaterals; a vasovagal reaction slows the heart rather than speeding it.",
    tone: "caution",
    lessonId: "cm-perforation-tamponade",
    sources: [O_TAMP, O("ch 10: Vasovagal reaction"), B("26.2"), B("28.1")],
    refs: BOOKS,
  },
  {
    id: "diag-lv-gram-tamponade",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], event: ["hypotension"] },
    title: "Hypotension after a ventriculogram: look for a myocardial stain",
    text: "If the catheter tip was in the myocardium, contrast can be injected into the wall and leak into the pericardium. It is usually benign, but tamponade can follow: look for a stain on the run and get an echo.",
    tone: "caution",
    lessonId: "cm-perforation-tamponade",
    sources: [O("ch 4: Left ventriculography"), O_TAMP],
    refs: OXFORD,
  },
  {
    id: "access-vasovagal-or-tamponade",
    lab: "access",
    when: { phase: ["puncture", "sheath", "closure", "complication"], event: ["hypotension", "bradycardia"] },
    title: "Vasovagal or tamponade? Look at the heart rate",
    text: "A vasovagal reaction slows the heart before the pressure falls: legs up, atropine 0.5–1.0 mg IV and rapid saline (typical doses; follow local protocol). Tamponade is usually tachycardic. If the patient is not better within a few minutes, or there is any doubt, get an immediate echo.",
    tone: "caution",
    lessonId: "cm-perforation-tamponade",
    sources: [O("ch 10: Vasovagal reaction"), O("ch 10: Hypotension")],
    refs: OXFORD,
  },
  {
    id: "bed-peri-set-up",
    lab: "bedside",
    when: { phase: ["plan", "needle"], procedure: ["pericardiocentesis"] },
    title: "Position and track",
    text: "Sit the patient at 45° if possible so the fluid pools inferiorly. Anaesthetise a shallow track just under the costal margin, towards the left scapular tip (Oxford) or left shoulder (Academy), with the final direction set by fluoroscopy or echo. Make a small incision below the xiphisternum and advance the needle on a syringe with continuous suction under X-ray, pressure monitoring and/or echo.",
    tone: "do",
    lessonId: "cm-perforation-pericardiocentesis",
    sources: [O("ch 9: Pericardiocentesis")],
    refs: OXFORD,
  },
  {
    id: "bed-peri-confirm-wire",
    lab: "bedside",
    when: { phase: ["needle"], procedure: ["pericardiocentesis"] },
    title: "See the wire in the sac before you dilate",
    text: "Blood drawn from the sac can look like blood drawn from a chamber. Oxford's sign is a J-wire that forms a loop within the cardiac shadow on screening, or one seen in the sac on echo, where agitated saline through the needle also helps. The Academy lesson bed-pericardiocentesis adds that the wire should curl round the heart along its border, outside the chambers, and not run into the right ventricular outflow tract or pulmonary artery. Only then remove the needle and dilate.",
    tone: "caution",
    lessonId: "cm-perforation-pericardiocentesis",
    sources: [O("ch 9: Pericardiocentesis")],
    refs: OXFORD,
  },
  {
    id: "bed-peri-after-pci",
    lab: "bedside",
    when: { phase: ["needle", "drain"], procedure: ["pericardiocentesis"] },
    title: "After a perforation: use the contrast, keep the balloon up",
    text: "Keep the coronary balloon inflated while you drain, so that no more blood enters. Leaked contrast often outlines the sac, so fluoroscopy can guide the needle; do not wait for echo in an unstable patient. A small volume of blood can compress a single chamber and make drainage difficult; seek expert help if there is time.",
    tone: "do",
    lessonId: "cm-perforation-pericardiocentesis",
    sources: [B("26.2"), O("ch 9: Pericardiocentesis")],
    refs: BOOKS,
  },
  {
    id: "bed-peri-drain-stays",
    lab: "bedside",
    when: { phase: ["drain"], procedure: ["pericardiocentesis"] },
    title: "Leave the drain and re-image",
    text: "Modest volumes (20–50 mL) often relieve tamponade. Secure the drain, leave it until the bleeding has stopped (it may take days), and repeat the echo straight away and then serially.",
    tone: "do",
    lessonId: "cm-perforation-pericardiocentesis",
    sources: [O("ch 9: Pericardiocentesis"), O_TAMP],
    refs: OXFORD,
  },
];

// ---------------------------------------------------------------------------
// New references (PubMed-checked)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "kinnaird-perforation-uk-2016",
    kind: "paper",
    citation:
      "Kinnaird T, Kwok CS, Kontopantelis E, et al. Incidence, determinants, and outcomes of coronary perforation during percutaneous coronary intervention in the United Kingdom between 2006 and 2013: an analysis of 527 121 cases from the British Cardiovascular Intervention Society database. Circ Cardiovasc Interv. 2016;9(8):e003449.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.115.003449",
    note: "PMID: 27486140. Checked on PubMed: authors, title, journal, year, volume 9, issue 8, article e003449. Used for 1,762 perforations in 527,121 PCI procedures in England and Wales, 2006–2013 (0.33%); predictors including age, previous CABG (OR 1.44), left main, rotational atherectomy (OR 2.37) and CTO intervention (OR 3.96); higher adjusted odds of adverse outcomes including mortality; emergency surgery in 3%.",
    verified: true,
  },
  {
    id: "mikhail-perforation-copit-2022",
    kind: "paper",
    citation:
      "Mikhail P, Howden N, Monjur M, et al. Coronary perforation incidence, outcomes and temporal trends (COPIT): a systematic review and meta-analysis. Open Heart. 2022;9(2):e002076.",
    url: "https://doi.org/10.1136/openhrt-2022-002076",
    note: "PMID: 36270713. Checked on PubMed: authors, title, journal, year 2022, volume 9, issue 2; article number from the DOI (openhrt-2022-002076). Used for: 67 all-comer studies, 5,568,191 PCIs (1982–2020); pooled perforation incidence 0.39% (about 1 in 250); tamponade 21.1%; Ellis III 43%; mortality 7.5%; risk factors female sex, hypertension, chronic kidney disease, previous CABG; causes distal wire exit 37%, balloon catheters 28%; covered stents 25%; emergency surgery 17%.",
    verified: true,
  },
  {
    id: "boukhris-collateral-coil-2015",
    kind: "paper",
    citation:
      "Boukhris M, Tomasello SD, Azzarelli S, et al. Coronary perforation with tamponade successfully managed by retrograde and antegrade coil embolization. J Saudi Heart Assoc. 2015;27(3):216-21.",
    url: "https://doi.org/10.1016/j.jsha.2015.02.005",
    note: "PMID: 26136637. Checked on PubMed: authors, title, journal, year 2015, volume 27, issue 3, pages 216-21. Cited by Brilakis in 26.5 (reference 33). Full text read in PMC (PMC4481427). Used for: a retrograde CTO procedure through an epicardial collateral, complicated by perforation with tamponade at the collateral's distal end (coiled retrogradely) and later at its junction with the distal LAD (coiled antegradely); the authors stress checking the collateral used for retrograde access by bilateral injections.",
    verified: true,
  },
];
