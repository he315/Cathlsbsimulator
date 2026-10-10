// Module hb-mitral-tricuspid-laa: transseptal puncture, mitral and tricuspid transcatheter repair and
// replacement, and left atrial appendage occlusion (manual curriculum, track cath-handbook).
// Sources: the two manuals touch these procedures only at their edges: Oxford Handbook ch 4 (accessing the
// left heart by the transseptal route; left and right atrial waveforms) and ch 5 (the v waves of mitral and
// tricuspid regurgitation), and Brilakis, Manual of PCI, sections 14.2 and 14.6 (transseptal puncture for a
// left atrial cannula, its prevention and bail-out). The procedural teaching therefore comes from verified
// references, read in full: Russo 2021 (transseptal puncture), Hausleiter 2023 (mitral TEER), Praz 2021
// (tricuspid interventions), the 2020 EHRA/EAPCI LAAO consensus (Glikson), Fukutomi 2022 (transseptal site for
// LAAO), and trial abstracts on PubMed (TRILUMINATE Pivotal, TRISCEND II, Amulet IDE). Every claim is listed
// with its page or reference in docs/curriculum/evidence/hb-mitral-tricuspid-laa.md.
// Builds on the Academy module sh-imaging-transseptal, sh-mitral-tricuspid and sh-laao (rationale, trials,
// TOE view catalogue, release-check overview), which these lessons do not repeat. Neighbouring modules:
// hb-specific-conditions (mitral and tricuspid haemodynamics on the catheter), hb-additional-procedures
// (balloon valvuloplasty, PFO and ASD closure), hb-tavi (TAVI).
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OX = ["oxford-cath-handbook"];
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });

const TS_SOURCES: SourceLoc[] = [
  O("ch 4: Accessing the left heart"),
  O("ch 4: Left heart pressures and waveforms"),
  O("ch 4: Right heart pressures and waveforms"),
  B("14.2"),
  B("14.6"),
];

export const module: Module = {
  id: "hb-mitral-tricuspid-laa",
  title: "Mitral, tricuspid and left atrial appendage interventions",
  stage: 5,
  summary:
    "The transseptal puncture done step by step, from the equipment and the groin to a secured left atrium, with the hard septa and the complications; mitral TEER from the work-up and device choice through steering, grasping, the checks before release and the fixes for residual regurgitation; tricuspid assessment, patient selection, the device classes and the aftercare; and left atrial appendage occlusion from the CT and TOE measurements to the implant of a single-lobe and a lobe-and-disc occluder and the antithrombotic plan.",
  objectives: [
    "Choose the transseptal kit, prepare the access, and perform the pull-down with the needle orientation, the three TOE views and the fluoroscopic cues, moving the system correctly to change the contact point.",
    "Cross the septum safely: confirm left atrial position four ways, anticoagulate, advance and de-air the sheath, and adapt to thick, floppy, enlarged or previously closed septa.",
    "Recognise and manage the complications of transseptal puncture: posterior exit and delayed tamponade, aortic puncture, embolism, the vagal ST-elevation reflex and the iatrogenic ASD.",
    "Work up a patient for mitral TEER, grade the anatomical complexity, predict the gradient, and choose the implant from the leaflet length, the gap and the valve area.",
    "Steer, align and grasp under TOE and fluoroscopy, optimise the result (leaflet optimisation, staged capture, second devices) and judge the result by MR, left atrial pressure and planimetered valve area.",
    "Assess tricuspid regurgitation and the right ventricle for transcatheter treatment, select patients who are likely to benefit, and compare leaflet approximation, annuloplasty, orthotopic replacement and caval valves, including their evidence and harms.",
    "Plan an LAAO from CT and TOE (morphology, measurements, loading, fluoroscopic views, sheath and puncture site), implant both device families step by step, apply their release criteria, and set the antithrombotic and imaging follow-up.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-ts-setup",
      title: "Transseptal puncture I: the septum, the kit, the groin and the pull-down",
      minutes: 16,
      topics: ["sh-transseptal-toe"],
      sources: TS_SOURCES,
      refs: [...BOOKS, "russo-transseptal-2021", "laao-consensus-2020", "hausleiter-mitral-teer-2023", "katsiampoura-pitloc-2022"],
      blocks: [
        {
          kind: "p",
          text: "The left heart is usually entered backwards, through an artery and the aortic valve. Oxford lists the alternative: cross from the right atrium to the left, through a patent foramen ovale, an atrial septal defect or a deliberate puncture of the septum. Mitral repair and replacement, appendage occlusion, paravalvular leak repair and left atrial cannulae for mechanical support all depend on it. The Academy lesson on transseptal puncture gives the anatomy table and the puncture-site targets; this lesson takes the puncture apart into its individual movements.",
        },
        { kind: "h", text: "Why the target is small" },
        {
          kind: "p",
          text: "Most of what looks like septum on a four-chamber image is not crossable. Russo and colleagues separate the anatomical interatrial septum (all the tissue between the two atria) from the **true septum**, the part a needle can pass without leaving the heart, and put the true septum at only about **20%** of the total. The fossa ovalis, a thin fibrous oval or round depression, sits in its lower posterior part. Think of the fossa in four quadrants: superior-anterior, inferior-anterior, superior-posterior and inferior-posterior. Each procedure names one of them as its target.",
        },
        {
          kind: "table",
          caption: "Which quadrant for which procedure (Russo 2021; EHRA/EAPCI 2020; Fukutomi 2022)",
          head: ["Procedure", "Usual quadrant", "Height or reason"],
          rows: [
            ["Mitral TEER", "Superior-posterior or inferior-posterior", "Two different measurements. Puncture to the mitral annular plane (four-chamber view): at least 4 cm in degenerative MR; Russo accepts 3 cm in functional MR (the Academy lesson gives about 3–3.5 cm). Puncture to the coaptation point: about 4.0–4.5 cm (Hausleiter). Say which one you are quoting"],
            ["Direct mitral annuloplasty", "Superior-anterior or inferior-anterior", "A more anterior approach to the annulus"],
            ["LAA occlusion", "Inferior, usually inferior-posterior", "Coaxial with the appendage; CT predicted an inferior-central or inferior-anterior site in about a quarter of patients (Fukutomi)"],
          ],
        },
        { kind: "h", text: "The kit" },
        {
          kind: "list",
          items: [
            "**Needle.** The Brockenbrough needle is Ross's original curved needle with its distal 1.5 cm narrowed from 18 to 21 gauge. It is stainless steel, carries a stylet that stops it shaving the inside of the dilator, and has an arrow on the hub that points the same way as the tip. The standard curve is 19°; the more curved version is 53°; any curve can be shaped by hand.",
            "**Sheath and dilator.** Kits differ little. Two families of sheath are common, in 8–12 Fr: a braided sheath whose curve points at the left superior pulmonary vein and which pushes and torques better, and a Mullins-type sheath whose curve suits a course down to the mitral valve. The dilator protrudes beyond the sheath tip.",
            "**Energy and wire alternatives** for resistant septa (lesson II): radiofrequency needles or catheters, electrocautery applied to the needle hub, a sharp-tipped nitinol transseptal guidewire, or the stiff back end of a coronary wire.",
            "**Pressure line** on the needle from the start, so the tip pressure is read before, during and after crossing.",
          ],
        },
        { kind: "h", text: "Imaging before and during" },
        {
          kind: "p",
          text: "Russo recommends a TOE before every transseptal puncture: it shows the septum (PFO, ASD, a thick or aneurysmal septum) and excludes a left atrial thrombus or tumour, both contraindications. CT is added when a mitral replacement or a direct annuloplasty is planned; some software also maps the fossa against the appendage ostium, the mitral annulus and the venae cavae, so the puncture height, catheter orientation and C-arm angle can be rehearsed. Brilakis, describing the left atrial cannula, lists fluoroscopy, ICE or TOE as the guidance for a Brockenbrough puncture. During the puncture the imager works through three views (the Academy's 'transseptal triad'): bicaval for superior–inferior, aortic short-axis for anterior–posterior, four-chamber for height. One published imaging protocol for anaesthetic and echo teams, PITLOC, breaks the imager's job into six stages: Practice, Identify the needle, Track the tip, Localise it in the fossa, Optimise the indentation, and watch the Crossing.",
        },
        {
          kind: "steps",
          title: "Access and loading the system",
          items: [
            { title: "Choose the side", detail: "The right femoral vein gives a straight run to the right atrium and is preferred. Prepare both groins: the left may be needed for arterial pressure monitoring, as a rescue access if something goes wrong, or for the puncture itself if the right venous route is unsuitable (expect poorer trackability and a needle that needs more curve)." },
            { title: "Puncture low, under ultrasound", detail: "The femoral vein stays a usable single vessel until a few centimetres below the inguinal ligament, so a low puncture lowers the risk of retroperitoneal bleeding. Ultrasound shows the vein beside the artery and lets you follow the needle. Without ultrasound, puncture medial to the femoral head and below its equator on an AP image, or about 4 cm below the ligament, medial to the pulse, at about 45°. A micropuncture needle, a skin nick of about 7 mm and an optional suture pre-close are additions the LAAO consensus describes; it notes that pre-closure has not been shown to improve outcomes or reduce vascular complications." },
            { title: "Early heparin (one approach)", detail: "Russo suggests about 2,000 U of heparin (roughly a quarter of the full dose) once access is gained, because the puncture can take time. Timing varies between operators; the LAAO consensus describes full-dose, after-crossing and split strategies. Follow local protocol." },
            { title: "Sheath and dilator to the SVC", detail: "Advance the sheath and dilator over the wire into the superior vena cava under AP fluoroscopy and the bicaval TOE view. Keep the sheath tip facing the patient's left (towards the aorta) rather than right (towards the caval free wall). If there are pacing leads, keep the wire posterior to them: in an LAO projection the wire should lie to the right of the leads on the screen. If the veins are tortuous, a larger sheath or two stiff wires can straighten them." },
            { title: "Needle in, stylet in", detail: "Remove the wire. Pass the needle with its stylet inside, letting the hub arrow turn freely as the curve negotiates the iliac veins; never force it straight. Russo keeps the stylet in until the needle is about 4 cm from the dilator tip; then remove the stylet, connect the pressure line, and advance under AP fluoroscopy to just inside the tip without letting the needle protrude." },
            { title: "Hold it as one", detail: "Line up the sheath's side arm and the needle arrow so they point the same way. Russo's grip: thumb and first two fingers on the sheath at the side arm, ring and little fingers on the needle arrow. From now on the hand moves sheath, dilator and needle together and cannot let the needle advance by accident." },
          ],
        },
        { kind: "tip", id: "structural-ts-both-groins-low" },
        { kind: "tip", id: "structural-ts-pacing-lead-wire" },
        {
          kind: "check",
          stem: "You are loading the transseptal system in a patient with a dual-chamber pacemaker. How do you check that the wire to the SVC is in the right relation to the leads?",
          options: [
            "In an RAO projection the wire should cross in front of the leads, anterior to them",
            "Position does not matter, because the needle will be pulled down well below the leads",
            "In an LAO projection the wire should lie to the right of the leads on the screen, posterior to them",
            "Remove the wire and advance the sheath over the needle alone to avoid tangling the leads",
          ],
          answer: 2,
          explanation:
            "Russo advises keeping the wire posterior to the leads and checking it in LAO, where it should appear to the right of the electrodes. An anterior course is the opposite of the advice, and the needle must never be used as the leading rail: it stays inside the dilator.",
        },
        { kind: "h", text: "The pull-down" },
        {
          kind: "steps",
          title: "From the SVC to the fossa",
          items: [
            { title: "Orient", detail: "Turn the assembly so the arrow points to about 5 to 6 o'clock, with noon towards the ceiling and 6 o'clock towards the floor (the LAAO consensus definition). Russo starts at 5 or 6 o'clock and keeps 6 for a more posterior target. Anatomy varies, so the clock face is a start, not a rule." },
            { title: "Withdraw slowly", detail: "Pull the whole system caudally under AP fluoroscopy and the bicaval view. The LAAO consensus describes a sudden jump as the tip drops from the SVC into the right atrium and another as it engages the fossa." },
            { title: "Read the bicaval view", detail: "Watch for tenting. When the tip catches the superior rim of the fossa, atrial ectopics are common. Use AP fluoroscopy to see the rotation of the tip and to stop yourself pulling down into the IVC." },
            { title: "Paint and poke", detail: "If a manifold is connected, a puff of contrast through the needle shows the tenting on fluoroscopy. Echo must confirm it in every case, whether TOE or ICE is used." },
            { title: "Short-axis: anterior or posterior", detail: "Once tenting is seen, the imager moves to the aortic short-axis view. For mitral work the tent should be posterior, to leave working distance above the annulus." },
            { title: "Four-chamber: height", detail: "For TEER, measure the distance from the tent to the mitral annulus (Russo) or to the coaptation point (Hausleiter) before crossing." },
          ],
        },
        { kind: "tip", id: "structural-ts-pulldown-orient" },
        { kind: "h", text: "Moving the contact point" },
        {
          kind: "p",
          text: "Once the tip sits in the fossa, a single movement often fails. Turning the system clockwise alone rotates the sheath about its own axis without moving where it touches. Russo therefore changes position with **two movements at once**: to move posteriorly from an anterior tent, combine clockwise rotation with slight withdrawal. The LAAO consensus describes the same: more clockwise for more posterior, and a slight pull for a lower site. Clockwise also carries the tip away from the mitral plane and gains height; counter-clockwise brings it nearer the valve. Hausleiter adds that posterior rotation of the needle and sheath is how you gain height for TEER, and that bending (rarely straightening) the needle helps it reach the fossa in a distorted atrium.",
        },
        {
          kind: "p",
          text: "**Two sources, two conventions.** Clock positions in the literature differ with the source, the reference point and the target: the Academy lesson on transseptal puncture describes about 4 to 5 o'clock viewed from below with 12 o'clock anterior, Russo 5 or 6 o'clock, and the consensus 5 to 6 with noon to the ceiling. Agree one convention with your team. Likewise, the Academy lesson advises withdrawing to the SVC and repeating the pull-down rather than dragging the tip across the septum; Russo's combined movements are for small adjustments of a tent once the system already sits in the fossa.",
        },
        {
          kind: "table",
          caption: "Fixing the tent before you cross",
          head: ["What the imager sees", "What to do"],
          rows: [
            ["Tent too anterior (near the aortic root, short-axis view)", "Clockwise rotation plus slight withdrawal; recheck short-axis"],
            ["Tent too high in the bicaval view, or too high for a TEER height target", "Slight withdrawal, then re-tent; recheck four-chamber height"],
            ["Not enough height for TEER", "More posterior (clockwise) position; Hausleiter: posterior rotation gains height"],
            ["Tip cannot reach the septum (large atrium)", "Add curve to the needle by hand; aim lower and less posterior (lesson II)"],
          ],
        },
        { kind: "tip", id: "structural-ts-two-movements" },
        {
          kind: "check",
          stem: "The needle tents the fossa, but the short-axis view shows the tent close to the aortic root and you need a posterior site for TEER. You turn the system clockwise and the tent does not move. Why, and what next?",
          options: [
            "The needle is caught in the limbus; push firmly forward to free it and then rotate counter-clockwise",
            "Rotation alone spins the sheath without moving the contact point; rotate clockwise and withdraw slightly at the same time",
            "Clockwise is the wrong way for posterior; rotate counter-clockwise to move the tent away from the aorta",
            "The fossa cannot be reached posteriorly in this patient; cross where you are and steer the guide instead",
          ],
          answer: 1,
          explanation:
            "An isolated clockwise turn rotates the system about its axis; the contact point moves only when rotation is combined with a slight pull-back (Russo). Counter-clockwise moves towards the mitral plane and is not the fix for an anterior tent. Crossing next to the aorta to save time risks an aortic puncture and leaves the TEER system badly placed.",
        },
        { kind: "h", text: "ICE and fusion" },
        {
          kind: "p",
          text: "With intracardiac echo the probe sits in the right atrium, turned clockwise and flexed back to show the fossa from head to foot; more clockwise rotation brings the posterior fossa into view (LAAO consensus). Fusion software lays echo markers on the live fluoroscopic image and can mark the fossa and suggest a C-arm angle. Russo lists its limits: so much information on one screen that it distracts, a requirement for echo and X-ray systems from the same maker, C-arm angles that cannot overlay some views, and markers that stay still while the heart moves. No data yet show that it shortens procedures, lowers dose or reduces complications.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing the needle beyond the dilator tip while loading or pulling down: keep the stylet in until near the tip, and fix needle and sheath together so it cannot advance by accident.",
            "Losing track of where the needle points because the side arm and the arrow are no longer aligned.",
            "Rotating harder when rotation alone is not moving the tent; change two things at once instead.",
            "Pulling down so far that the system falls into the IVC; watch the AP fluoroscopy image as well as the echo.",
            "Starting without a TOE look for left atrial thrombus or tumour, both contraindications.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the pull-down, rehearse aloud with the imager: target quadrant, the height you need, and which view will confirm each. Then the imager can say 'too anterior' and you already know the answer is a turn and a pull, not a turn alone.",
        },
        {
          kind: "sim",
          sim: "teer",
          task: "In the TEER lab, go to the Transseptal step. Drag the needle tip on the fossa map until the bicaval view shows a superior tent, the short-axis view a posterior tent, and the four-chamber height lies in the target band for the scenario's MR type. Then move it to an anterior position next to the aortic root and note how the danger flag changes.",
        },
        {
          kind: "sim",
          sim: "laao",
          task: "In the LAAO lab, go to the Transseptal step and choose an inferior and posterior site; check that the lab confirms a coaxial approach to the appendage, then compare it with a superior posterior TEER-type site.",
        },
        { kind: "video", id: "uvgLPY2gqmQ", note: "Brilakis channel lecture on imaging for structural heart interventions." },
        {
          kind: "keypoints",
          items: [
            "Only about a fifth of the anatomical septum is safely crossable; the fossa lies in its lower posterior part.",
            "Right femoral vein, low and ultrasound-guided; prepare both groins.",
            "Load the needle with its stylet and a freely rotating arrow; align arrow and side arm and move them as one.",
            "Pull down at about 5–6 o'clock: two jumps, tenting in the bicaval view, then short-axis for anterior–posterior and four-chamber for height.",
            "Change the contact point with two movements at once; clockwise moves posterior and gains height.",
            "TEER: posterior; to the annular plane at least 4 cm in degenerative MR (Russo accepts 3 cm in functional MR), or about 4.0–4.5 cm to the coaptation point (Hausleiter). LAAO: inferior, usually posterior.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-ts-cross",
      title: "Transseptal puncture II: crossing, securing the atrium, hard septa and complications",
      minutes: 16,
      topics: ["sh-transseptal-toe"],
      sources: TS_SOURCES,
      refs: [...BOOKS, "russo-transseptal-2021", "laao-consensus-2020", "lo-russo-transseptal-occluder-2025", "hausleiter-mitral-teer-2023", "lurz-mithras-2021"],
      blocks: [
        {
          kind: "p",
          text: "Crossing takes a second; the decisions around it decide whether the patient has a quiet procedure or a pericardial drain. This lesson covers the crossing itself, what proves the needle is in the left atrium, how the sheath follows without letting air in, the septa that resist or flap, and the six complications that belong to the puncture.",
        },
        {
          kind: "steps",
          title: "Crossing and confirming",
          items: [
            { title: "Set the views", detail: "Imager in the aortic short-axis view; fluoroscopy in AP. Keep the sheath still and advance only the needle, slowly, so the system does not slip to a new spot." },
            { title: "Watch the tent release", detail: "Crossing is usually seen on TOE as the tent springs back." },
            { title: "Prove the position four ways", detail: "Russo: TOE, blood aspiration, a pressure curve and a contrast puff through the needle. If there is no pressure trace, or the trace is aortic, do not advance the sheath." },
            { title: "Read the waveform", detail: "Oxford describes the left atrial trace with a v wave usually slightly taller than the a wave, and the right atrial trace with an a wave that usually exceeds the v wave. The LAAO consensus uses the same contrast (v dominant in the LA, a dominant in the RA) to confirm the puncture. Oxford also notes that right atrial pressure sits slightly below left atrial pressure, so a small rise in the mean pressure as the needle crosses is a further clue. A systemic arterial trace means the aorta." },
            { title: "Anticoagulate", detail: "Brilakis gives heparin immediately on entering the left atrium. Russo completes heparinisation to 100 U/kg after the puncture and aims for an ACT of 250–300 s for most procedures; the LAAO consensus uses 70–100 U/kg and at least 250 s. Reach a therapeutic ACT quickly: the left atrium is a low-flow chamber and the equipment is thrombogenic. Follow local protocol." },
          ],
        },
        { kind: "tip", id: "structural-ts-four-confirmations" },
        { kind: "tip", id: "structural-ts-heparin-after-crossing" },
        {
          kind: "check",
          stem: "After the needle crosses, the trace from its tip shows a waveform with a dicrotic notch and a systolic pressure of 120 mmHg. The dilator is still in the right atrium. What do you do?",
          options: [
            "Advance the dilator over the needle to secure access, then reassess the position with contrast",
            "Pull the needle straight back and immediately re-puncture a more posterior part of the fossa",
            "Give a full heparin dose now so that thrombus cannot form on the needle in the aorta",
            "Keep the dilator and sheath where they are, withdraw nothing, call the surgeon and look for tamponade",
          ],
          answer: 3,
          explanation:
            "An arterial trace with a dicrotic notch means the needle is in the aorta. Russo: never advance the dilator and sheath while in doubt, and once aortic puncture is confirmed pull nothing back; involve the surgeon and exclude tamponade if the patient becomes unstable. A needle-only puncture may have no consequence (Brilakis: usually tolerated if the sheath is not advanced), whereas once dilator and sheath have entered the aorta massive haemopericardium may follow. Heparin would make any bleed worse.",
        },
        {
          kind: "steps",
          title: "Securing the left atrium",
          items: [
            { title: "Dilator then sheath", detail: "Russo advances the transseptal assembly and needle together under TOE until 1–2 cm lies in the left atrium; then, holding the needle, advances the assembly over it; then, holding needle and dilator still, slides the sheath over the dilator. When the sheath tip nears the edge of the heart shadow, withdraw the needle and, if desired, the dilator, slowly." },
            { title: "Keep air out", detail: "As the needle comes out, cover the hub with a thumb and hold it low (between the patient's legs or beside the leg), especially when the left atrial pressure is low; aspirate slowly through the dilator as it is withdrawn, then aspirate and flush the sheath and connect it to pressure to read the mean left atrial pressure (LAAO consensus). For a left atrial cannula, Brilakis adds positive intrathoracic pressure and holding the cannula's outer end lower than the heart." },
            { title: "Park a wire", detail: "Pass a 0.032-inch wire into the left superior pulmonary vein with a slight clockwise turn of the sheath; the four-chamber view confirms it is not in the appendage. Hausleiter also confirms the stiff wire's position before any large-bore exchange." },
            { title: "Sheath behaviour", detail: "With a Mullins-type sheath, do not pull the dilator out completely or the sheath may kink. After a very posterior puncture, turn the sheath slightly counter-clockwise before advancing so it does not hit the atrial roof." },
            { title: "Large bores", detail: "For a left atrial cannula, Brilakis places an extra-support wire in the left atrium, dilates the skin and then the puncture with a 21 Fr atrial septal dilator, and checks that the cannula's fenestrated end lies wholly inside the left atrium; afterwards the cannula needs continuous monitoring so it does not slip back into the right atrium. Russo notes that septal dilatation with a 12–16 mm peripheral balloon is sometimes needed, especially for transcatheter mitral replacement." },
          ],
        },
        { kind: "tip", id: "structural-ts-air-hub-low" },
        {
          kind: "steps",
          title: "When the sheath will not follow the dilator",
          items: [
            { title: "Gentle first", detail: "Resistance usually sits at the step between dilator and sheath. Mild forward pressure with a slight turn either way normally carries it across (LAAO consensus)." },
            { title: "Protect the back wall before escalating", detail: "Before anything more forceful, place a J-tipped wire deep in a pulmonary vein (usually left superior) or a large-curve pigtail-tipped wire in the atrium or ventricle. A sudden jump through the septum can otherwise drive the dilator tip into the posterior wall." },
            { title: "Escalate", detail: "Use one of the stiffest wires, or dilate the puncture with a 4 mm balloon; the sheath usually tracks across as the balloon deflates." },
          ],
        },
        { kind: "tip", id: "structural-ts-resistant-wire-first" },
        { kind: "h", text: "Septa that do not behave" },
        {
          kind: "table",
          head: ["Septum", "Problem", "Approach"],
          rows: [
            ["Enlarged right or left atrium", "The tip cannot reach the fossa; a posterior site may exit into the pericardium", "Puncture lower and less posterior; add curve to the needle by hand (Russo)"],
            ["Thick or resistant (redo surgery, thoracic radiation)", "Force builds up and the system overshoots once through, hitting the superior or far LA wall", "Radiofrequency energy (dedicated RF catheter, or a cautery generator touched to the needle hub; the LAAO consensus gives 15–20 W for 1 s); the stiff end of a 0.014-inch coronary wire, or the needle's stylet, through the needle; a sharp-tipped nitinol transseptal wire that forms a J once unsupported. Russo's RF catheter example: 5 W for 2–5 s, crossing after 1–4 pulses"],
            ["Floppy or aneurysmal", "Height is lost while devices are steered","Puncture higher than usual for mitral work; RF or diathermy for a controlled crossing (Russo; Hausleiter lists cautery on the needle or a dedicated device, or the stiff end of a coronary wire)"],
            ["Previous septal occluder or patch", "No native fossa where the device sits", "Plan with TOE and CT; cross through native septum beside the device or through the device, with balloon-assisted tracking and RF as aids; risks include residual shunt and device deformation (Lo Russo 2025)"],
            ["PFO or ASD present", "A ready-made route, but often in the wrong place", "The LAAO consensus accepts using it when the appendage points laterally or posteriorly; a tight, long PFO tunnel can misalign the sheath and force a separate puncture"],
          ],
        },
        {
          kind: "check",
          stem: "A patient who had mitral surgery and chest radiotherapy needs TEER. The needle tents the posterior fossa deeply but will not cross. Why is pushing harder the wrong answer, and what is the better tool?",
          options: [
            "Momentum builds and the system can overshoot into the left atrial wall once through; use RF energy or a sharp transseptal wire",
            "Pushing harder bends the needle and lowers the height; use a more curved needle and accept a lower site",
            "The septum will not tear, but the dilator kinks; change to a Mullins sheath and push the dilator instead",
            "Force is fine once tenting is seen; the risk is only to the aortic root, which is anterior",
          ],
          answer: 0,
          explanation:
            "In thick, scarred or patched septa, force stores energy; when the septum gives, needle and sheath can jump into the superior or far wall of the left atrium (Russo's overshoot). Radiofrequency, cautery to the needle, a sharp nitinol wire or the back of a coronary wire cross with little force. A lower site does not solve resistance and loses TEER height.",
        },
        { kind: "h", text: "Complications that belong to the puncture" },
        {
          kind: "table",
          head: ["Complication", "How it happens and looks", "What to do"],
          rows: [
            ["Posterior exit through the pericardium", "Puncture at the border of the fossa with the muscular septum can pass through the pericardial space. It may be silent until the catheters come out, then present as delayed tamponade; TOE may show an atrial haematoma", "Drain the pericardium first, then close the breach with an ASD-type occluder. For early detection, leave a wire across the septum after the left atrial catheters come out and watch the arterial pressure, ECG and TOE for a few minutes (Russo)"],
            ["Aortic puncture (or another structure)", "Uncommon with TOE guidance (about 0.05% in recent data, Russo); more likely with anterior targets, difficult anatomy or inexperience. Brilakis lists entry into the aorta and puncture of the atrial wall together, as results of anatomical variation", "Confirm with pressure or contrast through the needle; do not advance dilator or sheath while in doubt; once confirmed, withdraw nothing and call the surgeon; if unstable, exclude tamponade first. Needle-only entry is usually tolerated (Brilakis, Russo); a dilator and sheath in the aorta can cause massive haemopericardium; occluder closure has been described"],
            ["Air embolism", "Large devices across the septum that were not properly de-aired", "Prevent with the hub-low, aspirate-and-flush routine; treat as in the complications modules"],
            ["Thrombus", "Forming on the transseptal equipment or in the atrium", "Prevent with 1,000–2,000 U of heparin before the puncture (Russo). If it forms: full heparin for an ACT above 250 s, aspiration if still before crossing, consider cerebral protection if already in the left heart, surgery for large thrombus"],
            ["Inferior ST elevation with vagal signs", "A Bezold–Jarisch-like reflex, probably from the dense parasympathetic fibres in the septum causing cholinergic vasospasm: inferior ST elevation, hypotension, bradycardia and sweating", "Usually settles within minutes without a troponin rise; atropine is seldom needed. If it persists, think of air or thrombus embolism and treat that"],
            ["Iatrogenic ASD", "Common after large-bore sheaths; sheath size is the strongest predictor of persistence", "Evidence and expert view differ. In the randomised MITHRAS trial (80 patients with a relevant left-to-right defect a month after mitral TEER), closure did not significantly reduce death or heart failure admission at 12 months (35% vs 50%), although patients with a defect did worse than those without. Russo, in an expert review, advises immediate closure for bidirectional or right-to-left shunting or a large defect (over 8 mm), and calls closure highly advisable after transcatheter mitral replacement. If left open, watch patients with right-to-left flow and venous thrombosis risk, who may need anticoagulation against paradoxical embolism"],
          ],
        },
        { kind: "tip", id: "structural-ts-aortic-puncture-hold" },
        { kind: "tip", id: "structural-ts-vagal-st" },
        { kind: "tip", id: "structural-ts-posterior-delayed-tamponade" },
        {
          kind: "check",
          stem: "Thirty seconds after crossing, the patient has inferior ST elevation, a heart rate of 45/min, a blood pressure of 80/45 mmHg and is sweating. TOE shows no effusion and the sheath has not yet been flushed into the left atrium. What is the most likely explanation and first response?",
          options: [
            "Air in the right coronary artery from the sheath; aspirate the coronary immediately through a guiding catheter",
            "Tamponade from posterior exit; proceed to urgent pericardiocentesis from the subxiphoid approach",
            "A vagal reflex from the septum; support the patient and expect recovery in minutes, considering atropine, and think of embolism if it persists",
            "Anaphylaxis to the contrast puff; give intramuscular adrenaline and stop the procedure",
          ],
          answer: 2,
          explanation:
            "Inferior ST elevation with bradycardia, hypotension and sweating straight after the puncture fits the Bezold–Jarisch-like reflex Russo describes; it usually resolves within minutes and atropine is seldom needed. Air is the main alternative, and becomes the working diagnosis if the changes persist, but here no sheath has been opened to the atrium. There is no effusion, so a drain is not indicated.",
        },
        {
          kind: "pitfalls",
          items: [
            "Advancing the dilator before the pressure trace has been read: the step that turns a harmless needle hole in the aorta into a haemopericardium.",
            "Removing a needle or dilator with the hub held high in a patient with a low left atrial pressure: air enters the sheath.",
            "Escalating force on a sheath that will not follow the dilator before a wire is parked deep in a pulmonary vein; and pushing harder on a needle that will not cross a thick septum instead of changing to RF or a sharp wire.",
            "Taking an uneventful puncture as proof of safety: posterior exit can declare itself only after the catheters come out.",
            "Leaving a large iatrogenic ASD with right-to-left flow unassessed after a large-bore procedure.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the four confirmations aloud before the dilator moves: 'echo in the atrium, blood back, atrial trace with a v wave, contrast in the atrium'. If any one is missing, the dilator does not move.",
        },
        {
          kind: "p",
          text: "**Learning the puncture.** Russo closes by asking for supervision by experienced operators through the early part of the learning curve, and for training that covers echocardiography and the management of tamponade as well as the hand skills. The LAAO consensus sets at least 10 transseptal punctures, done in other procedures or under an expert's guidance in the first appendage cases, before an operator does LAAO unproctored.",
        },
        {
          kind: "sim",
          sim: "teer",
          task: "In the TEER lab Transseptal step, place the needle at the anterior edge of the fossa next to the aortic root and read the lab's danger flag; then state, before moving the needle, which four checks you would need before advancing a dilator, and what you would do if the trace were arterial.",
        },
        { kind: "video", id: "uvgLPY2gqmQ", note: "Brilakis channel lecture on imaging for structural heart interventions." },
        {
          kind: "keypoints",
          items: [
            "Cross with the sheath still and the needle moving slowly, in the short-axis view and AP fluoroscopy.",
            "Four confirmations (TOE, aspiration, pressure, contrast) before the dilator moves; an aortic trace means stop.",
            "Heparin as soon as the atrium is entered; typical targets an ACT of at least 250 s (250–300 s), per local protocol.",
            "Air: thumb on the hub, hub low, aspirate as the dilator comes out; wire to the left superior pulmonary vein.",
            "Needle will not cross a thick septum: RF, cautery to the needle, a sharp nitinol wire or the back of a coronary wire, never force (overshoot). Sheath will not follow the dilator: first park a J wire deep in a pulmonary vein, then a stiffer wire or a 4 mm balloon.",
            "Aortic puncture: advance nothing, withdraw nothing, call the surgeon. Vagal ST elevation settles in minutes; persisting changes mean embolism.",
            "Iatrogenic ASD: routine closure of a left-to-right defect did not help in MITHRAS; Russo advises closure for right-to-left or bidirectional flow or a defect over 8 mm.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-teer-select",
      title: "Mitral TEER I: work-up, anatomical complexity and choosing the implant",
      minutes: 15,
      topics: ["sh-mitral-teer"],
      sources: [O("ch 5: Mitral regurgitation"), O("ch 4: Left heart pressures and waveforms")],
      refs: [...OX, "hausleiter-mitral-teer-2023", "esc-vhd-2021", "esc-vhd-2025", "adamo-vhd-update-2026", "everest2-2011", "coapt-2018", "mitra-fr-2018"],
      blocks: [
        {
          kind: "p",
          text: "Transcatheter edge-to-edge repair (TEER) joins the anterior and posterior leaflets with an implant passed from the femoral vein through the septum. The Academy lessons cover the mechanisms and grading of MR, the trials and the classical suitability criteria. Here the question is narrower and practical: given this valve, will TEER leave little regurgitation without a stenotic valve, and which implant gives the best chance? The source is the 2023 EuroIntervention state-of-the-art review by Hausleiter and colleagues; the manuals contribute the haemodynamics.",
        },
        { kind: "h", text: "The work-up, in order" },
        {
          kind: "steps",
          items: [
            { title: "Clinical baseline", detail: "Symptoms by NYHA class, heart failure admissions, renal and hepatic function, quality of life (preferably a standard heart failure questionnaire), and an objective test such as a 6-minute walk or cardiopulmonary exercise test." },
            { title: "TTE, then TOE in nearly everyone", detail: "TTE confirms the MR, its mechanism and severity, the pulmonary pressure, other valve disease and both ventricles. TOE is needed in almost all candidates to define the valve. Because MR can look smaller at rest, exercise echo (pharmacological or, better, physiological stress) may show how the regurgitant volume and pulmonary pressure change at peak exercise; Hausleiter adds that the concept still needs further investigation." },
            { title: "Coronaries and right heart", detail: "Coronary assessment in every candidate: coronary angiography is recommended to decide on revascularisation, with CT coronary angiography as the alternative in selected patients in stable sinus rhythm who are unlikely to have coronary disease. Right heart catheterisation when RV function is reduced, the pulmonary pressure is high or TR is severe." },
            { title: "Heart Team", detail: "At least an interventional cardiologist experienced in mitral therapy, a surgeon experienced in mitral repair and replacement, and an interventional imager; a heart failure specialist for secondary MR. STS and EuroSCORE II estimate surgical risk. Palliative care is the better path if life expectancy is under a year; LVAD or transplantation may suit selected advanced heart failure." },
            { title: "Optimise secondary MR first", detail: "Guideline medical therapy and CRT where indicated can shrink secondary MR; the aim of optimisation is MR of 1+, because persisting 2+ or 3+ almost doubled the risk of death or admission in one cohort. Restoring sinus rhythm may help. Expect only a minority to respond, and with less MR reduction than TEER achieves. Before the procedure, bring the patient to euvolaemia (neither dry nor overloaded) and continue the neurohormonal drugs. In severe LV dysfunction or a large coaptation gap, some have suggested preparing the patient with inotropes or balloon counterpulsation, but this is not routine practice." },
          ],
        },
        { kind: "h", text: "Indications and what predicts the outcome" },
        {
          kind: "table",
          caption: "Recommendations as summarised by Hausleiter (2021 ESC/EACTS and AHA/ACC) and by members of the 2025 ESC/EACTS task force",
          head: ["Group", "2021 position (Hausleiter)", "2025 ESC/EACTS"],
          rows: [
            ["Primary MR at high or prohibitive surgical risk", "the Heart Team may consider TEER: class IIb, level B (ESC); class IIa for selected NYHA III–IV patients (AHA/ACC)", "Upgraded to class IIa, level B for symptomatic high-risk patients"],
            ["Ventricular secondary MR meeting the trial-derived (COAPT) criteria, symptomatic despite medical therapy and CRT", "Class IIa, level B", "Class I, level A"],
            ["Secondary MR outside those criteria (advanced heart failure with severe LV dysfunction; atrial MR with preserved LVEF)", "Class IIb, level C, to improve symptoms and quality of life", "Class IIb, level C retained for ventricular secondary MR outside the criteria; for atrial MR, surgery with AF ablation and appendage occlusion is preferred in suitable candidates and TEER kept for high-risk patients"],
          ],
        },
        {
          kind: "list",
          items: [
            "**The COAPT criteria** are listed in the Academy lesson on COAPT and MITRA-FR. Hausleiter's simplified figure adds that natriuretic peptides had to be raised (NT-proBNP of 1,500 pg/mL or more, or BNP of 300 pg/mL or more), that the anatomy had to include a valve area over 4.0 cm², and that haemodynamic instability (systolic pressure ≤90 mmHg, shock, or need for inotropes or mechanical support) excluded patients.",
            "**Predictors of death or heart failure admission after TEER for secondary MR:** advanced symptoms (each step up in NYHA class carried 28% more risk at 2 years in COAPT), lower LVEF, RV dysfunction and tricuspid regurgitation, a poor RV–pulmonary arterial coupling index, chronic AF, COPD (in which the benefit of TEER over medical therapy was smaller), chronic kidney disease and pulmonary hypertension.",
            "**Risk scores:** a multimodality intraprocedural score was associated with better MR reduction at discharge, and other scores predict 1-year mortality, but they share few variables; predicting outcome after TEER remains imperfect.",
            "**2025 anatomical scale for primary MR:** the guideline grades a valve as ideal, suitable, challenging or impossible for TEER. Examples of 'impossible': valve area under 3.0 cm², a mean gradient over 5 mmHg, a posterior leaflet under 5 mm, calcium in the grasping zone, leaflet perforation or rheumatic stenosis; 'ideal' includes central pathology without calcium, an area over 4.0 cm² and a posterior leaflet over 10 mm.",
          ],
        },
        {
          kind: "table",
          caption: "Severe MR by numbers (Hausleiter, Table 1, following the 2021 guideline; see the 2025 row for secondary MR)",
          head: ["Measure", "Primary MR", "Secondary MR"],
          rows: [
            ["Colour jet and flow convergence", "Large central jet filling more than half the LA, or an eccentric jet hugging the wall; a large convergence zone throughout systole", "As for primary MR"],
            ["Continuous-wave signal", "Holosystolic, dense and triangular", "As for primary MR"],
            ["Pulmonary veins and inflow", "Systolic flow reversal; E wave dominant (over 1.2 m/s); mitral-to-aortic TVI ratio over 1.4", "As for primary MR"],
            ["Vena contracta", "≥7 mm (≥8 mm biplane)", "≥7 mm (≥8 mm biplane)"],
            ["EROA (2D PISA)", "≥40 mm²", "≥40 mm²; ≥30 mm² may apply when the orifice is elliptical"],
            ["Regurgitant volume", "≥60 mL", "≥60 mL; ≥45 mL may apply in low flow"],
            ["Regurgitant fraction", "≥50%", "≥50%"],
            ["Supportive", "Flail, ruptured papillary muscle; LV end-systolic diameter ≥40 mm; LA ≥55 mm or ≥60 mL/m²", "Severe tenting, poor coaptation; dilated LV and LA"],
            ["2025 ESC/EACTS", "Multiparametric EROA, regurgitant volume and fraction, as above", "Lower thresholds define severe secondary MR: EROA ≥30 mm² and/or regurgitant volume ≥45 mL, measured on optimised medical therapy with the patient euvolaemic and normotensive"],
          ],
        },
        {
          kind: "p",
          text: "Hausleiter warns that regurgitant volume thresholds can mislead in a dilated, poorly contracting ventricle. Their worked example (LVEF 35%, LVEDV 200 mL, heart rate 75/min, body surface area 2 m²) has a total stroke volume of 70 mL: a regurgitant volume of 45 mL would leave a cardiac index of 0.9 L/min/m², and 60 mL only 0.4. Such values are barely compatible with life, so PISA numbers in secondary MR need a multiparametric reading, with 3D vena contracta planimetry as a useful addition.",
        },
        {
          kind: "formula",
          name: "Forward flow in the worked example",
          expr: "Forward stroke volume = total stroke volume − regurgitant volume; cardiac index = forward stroke volume × heart rate ÷ BSA",
          note: "70 − 45 = 25 mL; 25 mL × 75/min = 1.9 L/min; ÷ 2 m² ≈ 0.9 L/min/m² (Hausleiter Table 2).",
        },
        { kind: "h", text: "On the catheter" },
        {
          kind: "p",
          text: "Oxford describes the large v wave of MR on the wedge trace as a transmitted LV pressure wave, seen on the down-slope of the LV pressure trace. It is not specific, because a VSD or an infiltrative cardiomyopathy that raises left atrial pressure can produce the same wave. During TEER the guide sheath reads left atrial pressure directly, which is why the v wave becomes one of the measures of the result (lesson II). Oxford's ventriculographic grades I–IV of MR, and its warnings about catheter-induced MR and ectopic beats, are taught in the lesson on mitral disease on the catheter (hb-specific-conditions-mitral).",
        },
        {
          kind: "check",
          stem: "A COAPT-like patient has LVEF 35%, LVEDV 200 mL and a heart rate of 75/min. PISA reports a regurgitant volume of 60 mL. Why does Hausleiter treat this with caution?",
          options: [
            "Regurgitant volume is always overestimated by PISA in primary MR, but this patient has secondary MR",
            "A regurgitant volume of 60 mL is the threshold for mild MR in secondary disease, so it should be ignored",
            "PISA cannot be measured in sinus rhythm, so the number must have been recorded during an ectopic beat",
            "The total stroke volume is only about 70 mL, so 60 mL of regurgitation would leave a cardiac index near 0.4 L/min/m²",
          ],
          answer: 3,
          explanation:
            "With a total stroke volume of 70 mL, 60 mL of regurgitation leaves 10 mL forward per beat: about 0.8 L/min, or 0.4 L/min/m² for a 2 m² patient, barely compatible with survival. PISA tends to underestimate the crescent-shaped orifice of secondary MR, and the volume thresholds sit awkwardly in low-output ventricles, so the grade needs several measures together.",
        },
        { kind: "h", text: "Anatomical complexity" },
        {
          kind: "p",
          text: "The EVEREST inclusion criteria defined valves with a high chance of an excellent result. Outside them, the procedure becomes more complex and the chance of a lasting result falls. Hausleiter collects the markers that move a valve towards the complex end, and the absolute contraindications.",
        },
        {
          kind: "table",
          head: ["Group", "Feature"],
          rows: [
            ["Complexity (EXPAND registry)", "Coaptation gap ≥15 mm; flail gap ≥10 mm; jet outside A2/P2; small valve area; calcified landing zone; little leaflet tissue"],
            ["Predictors of a final gradient ≥5 mmHg", "Annular and leaflet calcification (especially leaflet infiltration ≥6 mm); valve area under 4 cm²; baseline mean gradient ≥4 mmHg; multiple jets"],
            ["Other technical markers", "Coaptation reserve, leaflet-to-annulus index and asymmetrical tethering"],
            ["Definite contraindications", "Heavy calcium where the device grasps; endocarditis that is active; mitral stenosis of haemodynamic relevance"],
            ["Feasible but demanding", "Failed surgical repair"],
          ],
        },
        {
          kind: "p",
          text: "Results depend on centre experience: Hausleiter places learning-curve inflection points at about 50 cases, with continued improvement to 200, and stresses that the whole team (imagers included) learns. Complex valves belong in high-volume centres, where replacement or other repair options are also available.",
        },
        { kind: "h", text: "Choosing the implant" },
        {
          kind: "p",
          text: "Two families of TEER implant are approved in Europe. The **clip system** has rigid arms with flexible grippers carrying small friction hooks; its fourth generation comes in two widths (4 mm and 6 mm) and two arm lengths (9 and 12 mm), lets each gripper be lowered independently, and reads left atrial pressure through the guide. The **paddle-and-spacer system** uses a 22 Fr steerable guide with nested steerable and implant catheters; its larger implant has curved nitinol paddles with a 26 mm grasping length when opened to 180°, 10 mm clasps grasped together or separately, and a central spacer that fills part of the gap; a smaller version has 6 mm paddles. The choice turns on how much valve area you can afford to lose, the leaflets and the gap.",
        },
        {
          kind: "table",
          caption: "Device choice by anatomy (from Hausleiter's text and Table 4)",
          head: ["Anatomy", "Favour", "Avoid or caution"],
          rows: [
            ["Mobile leaflet in the grasping zone under 9 mm", "Short-arm clips; either paddle size", "Long arms"],
            ["Mobile leaflet over 9 mm", "Long-arm clips; either paddle size", ""],
            ["Broad gap, large flail or wide prolapse", "Wide clips or the larger paddle (Table 4); the text adds extended arms, often with more than one device to stabilise", ""],
            ["Small valve area (under 4.5 cm²)", "Short-arm clips (narrow or wide) or the smaller paddle", "Rigid long-arm implants, expected to remove more area"],
            ["Thin leaflets", "Short-arm clips or either paddle", ""],
            ["Commissural jet", "Short-arm clips or the smaller paddle, with stable steering", ""],
            ["Short, thin, tethered posterior leaflet (secondary MR)", "Less problematic: paddle devices (flexible, grasping force at the leaflet base)", "Extended-arm clips should be avoided (single-leaflet attachment, leaflet injury)"],
            ["Calcified annulus infiltrating the leaflet", "Smaller, more flexible devices", "Large rigid implants"],
            ["Barlow disease", "Long-arm clips or either paddle", ""],
            ["Plan for more than one implant", "Implants that sit well side by side", "The larger paddle, whose concave paddles may not match a second implant"],
          ],
        },
        {
          kind: "p",
          text: "**Valve area budget.** Measure the area by 3D multiplanar reconstruction. In earlier device generations the larger paddle reduced it by about 47%, short-arm and long-arm third-generation clips by 52% and 57%. The loss is greatest when the implant sits at A2/P2 (the 'hot zone') and least at a commissure. If two separate jets will need two devices well apart, plan for a baseline area of about 6 cm².",
        },
        { kind: "tip", id: "structural-teer-area-budget" },
        {
          kind: "check",
          stem: "TOE shows two separate primary MR jets, one at A1/P1 and one at A3/P3, with a 3D valve area of 4.4 cm² and a mean gradient of 4 mmHg. What does Hausleiter's guidance suggest?",
          options: [
            "Two devices at the commissures remove little area, so the 4.4 cm² valve can safely take two large implants",
            "Two distant devices need a baseline area of about 6 cm²; here stenosis is a real risk, so reconsider TEER with the Heart Team",
            "A gradient of 4 mmHg excludes stenosis after TEER, so the number of devices does not matter",
            "Place one large implant at A2/P2, which will treat both commissural jets by approximation",
          ],
          answer: 1,
          explanation:
            "Hausleiter advises a baseline area of about 6 cm² before planning two distant devices, and lists an area under 4 cm², a baseline gradient of 4 mmHg or more and multiple jets as predictors of a final gradient of 5 mmHg or more. Commissural implants do remove less area than central ones, but two of them in a 4.4 cm² valve with a 4 mmHg baseline gradient is a stenosis risk. A central device would not treat two commissural jets and removes the most area.",
        },
        {
          kind: "pitfalls",
          items: [
            "Grading secondary MR on the table under anaesthesia without allowing for the vasodilatation and hypotension that make it look smaller.",
            "Choosing long arms for a short, thin, tethered posterior leaflet.",
            "Ignoring the valve area budget when a second device is likely.",
            "Referring secondary MR before medical therapy and CRT have been optimised.",
            "Treating a valve with severe calcium in the grasping zone, active endocarditis or significant stenosis.",
          ],
        },
        {
          kind: "pearl",
          text: "Write three numbers on the planning sheet before the case: the 3D valve area, the baseline mean gradient and the posterior leaflet's mobile length. Together they decide the implant, the number of implants you can afford and how hard you will chase the last jet.",
        },
        {
          kind: "sim",
          sim: "teer",
          task: "In the TEER lab TOE plan step, read the scenario's aetiology, jet location and baseline gradient, then choose narrow or wide arms and justify the choice from the leaflet length, the gap and the valve area budget before moving to the transseptal step.",
        },
        { kind: "video", id: "SGhygtxcajc", note: "Brilakis channel lecture on mitral valve interventions." },
        { kind: "video", id: "1_8lFiWvrPc", note: "Elias Hanna on valve area calculation and the haemodynamics of mitral stenosis and regurgitation." },
        {
          kind: "keypoints",
          items: [
            "TOE in almost every candidate; coronary assessment in all (CT coronary angiography in selected patients); right heart catheterisation when RV function, pulmonary pressure or TR demand it.",
            "Optimise secondary MR first (aim for 1+), then bring the patient to euvolaemia.",
            "Severe primary MR: vena contracta ≥7 mm, EROA ≥40 mm², regurgitant volume ≥60 mL, regurgitant fraction ≥50%. Severe secondary MR (2025 ESC/EACTS): EROA ≥30 mm² and/or regurgitant volume ≥45 mL.",
            "2025 ESC/EACTS: TEER class I (level A) for ventricular secondary MR meeting the trial criteria, class IIa for high-risk primary MR.",
            "Predictors of a post-TEER gradient ≥5 mmHg: leaflet calcium, area under 4 cm², baseline gradient ≥4 mmHg, multiple jets.",
            "Contraindications: severe calcium in the grasping zone, active endocarditis, relevant stenosis.",
            "Implants remove roughly half the valve area, most at A2/P2; two distant devices need about 6 cm².",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-teer-procedure",
      title: "Mitral TEER II: steering, grasping, optimising and the complications",
      minutes: 16,
      topics: ["sh-mitral-teer", "sh-transseptal-toe"],
      sources: [O("ch 5: Mitral regurgitation"), O("ch 5: Mitral stenosis"), O("ch 4: Left heart pressures and waveforms"), O("ch 4: Accessing the left heart")],
      refs: [...OX, "hausleiter-mitral-teer-2023", "russo-transseptal-2021", "coapt-2018", "esc-vhd-2021"],
      blocks: [
        {
          kind: "p",
          text: "The Academy lesson gives the TEER sequence from puncture to release. This lesson adds the manoeuvres that move the implant, the views that show each movement, what to do when the result is not good enough, and the complications with their published rates. Haemodynamics during the procedure should be kept as close as possible to the patient's awake state, or the result you accept will not be the result they live with.",
        },
        {
          kind: "steps",
          title: "From the groin to the valve",
          items: [
            { title: "Re-image at the start", detail: "Secondary MR changes with volume and pressure, so the imager re-grades the MR, checks the jet origin and measures the valve area by multiplanar reconstruction to confirm the device plan." },
            { title: "Venous access", detail: "Ultrasound-guided femoral venous puncture below the inguinal ligament, to reduce retroperitoneal bleeding and arterial puncture." },
            { title: "Puncture", detail: "Start in the bicaval view (90–120°) with an x-plane to set the anterior–posterior position. Remember the coaptation line usually lies lower in secondary than in primary MR. Aim for about 4.0–4.5 cm between the puncture and the coaptation point." },
            { title: "Wire and guide", detail: "Confirm the curved stiff wire in a left pulmonary vein (usually the upper) or in the atrium before the guide goes in. Fusion imaging helps steer towards the mitral plane while keeping clear of the left pulmonary veins and the appendage." },
            { title: "Orient in 3D", detail: "Orient the implant in a 3D view from the left atrium. Hausleiter prefers a 'cardiologist's view' with the aorta at 6 o'clock: a lateral movement of the device then moves the same way on the 3D image and on the intercommissural 2D view, whereas in the traditional surgeon's view it moves the opposite way." },
            { title: "Lock fluoroscopy to the orientation", detail: "Once 3D echo confirms the arms are perpendicular to the coaptation line, turn the C-arm until the two arms overlap and seem to disappear (their example: RAO 20, cranial 10). Fluoroscopy can then show any rotation during grasping." },
          ],
        },
        { kind: "tip", id: "structural-teer-height-coaptation" },
        { kind: "tip", id: "structural-teer-gantry-arms" },
        { kind: "h", text: "Which movement moves the implant where" },
        {
          kind: "table",
          caption: "Steering under the intercommissural view with an x-plane LVOT view (Hausleiter)",
          head: ["Movement", "Effect", "Seen in"],
          rows: [
            ["Pull or push the whole assembly; flex or unflex the steerable catheter", "Moves the implant medially or laterally", "Intercommissural view (50–70°)"],
            ["Clockwise rotation of the catheter", "Moves the implant posteriorly", "LVOT view (140–160°)"],
            ["Counter-clockwise rotation", "Moves the implant anteriorly", "LVOT view"],
            ["Flex the guide sheath", "Corrects an 'aorta-hugger' position or loses height", "LVOT view and fluoroscopy"],
            ["Posterior rotation of the guide", "Gains height", "LVOT view"],
            ["Commissural targets", "Adjust the 'intercommissural' plane to 30–60° for A3/P3 and 60–90° for A1/P1 so it runs along the coaptation line there", "Multiplanar reconstruction from 3D helps build these views"],
          ],
        },
        { kind: "tip", id: "structural-teer-steer-views" },
        {
          kind: "check",
          stem: "In the LVOT view, the open implant sits against the aortic side of the anterior leaflet. Which corrections fit Hausleiter's description?",
          options: [
            "Flex the guide to correct the aorta-hugging position; clockwise rotation of the catheter moves the implant posteriorly",
            "Pull back the whole assembly, which moves the implant posteriorly in the LVOT view",
            "Rotate counter-clockwise, which moves the implant away from the aorta towards the posterior leaflet",
            "Advance into the ventricle anyway; the implant will centre itself when the arms are closed on the leaflets",
          ],
          answer: 0,
          explanation:
            "Flexing the guide sheath corrects an aorta-hugger position, and clockwise rotation moves the implant posteriorly in the LVOT view. Pulling or pushing the assembly moves it medially or laterally (seen in the intercommissural view). Counter-clockwise moves it anteriorly, the wrong way. Grasping from a skewed position distorts the valve.",
        },
        {
          kind: "steps",
          title: "Crossing, grasping and judging the grasp",
          items: [
            { title: "Cross with two planes", detail: "With the x-plane on the intercommissural view and its partner on the LVOT view, the imager shows both leaflets separately at the target. Keep the trajectory you set in the atrium as the implant enters the ventricle." },
            { title: "Grasp", detail: "Capture both leaflets together (conventional grasp), or one at a time." },
            { title: "Leaflet optimisation", detail: "After a simultaneous grasp, reopen the arms while the grippers or clasps stay closed, then lift one gripper or clasp. This shows how deeply each leaflet sits in the device, lets you regrasp one leaflet more deeply, and allows small rotations to improve coaxiality. It often reduces the MR further." },
            { title: "Staged capture", detail: "Grasp and secure one leaflet, keep the other arm ready with its gripper up, move towards the second leaflet and lower the gripper when the leaflet is well inside. Both techniques need care to avoid distorting or injuring the valve." },
            { title: "Measure MR several ways", detail: "Hausleiter recommends invasive haemodynamic monitoring throughout TEER to judge the immediate effect. Use colour Doppler, pulmonary vein flow and left atrial pressure, especially the v wave. Invasive pressure may judge the improvement better than colour Doppler in complex valves. Expect a smaller fall in left atrial pressure in secondary MR, where diastolic filling is also impaired. Cardiac output can be measured by thermodilution or Fick." },
            { title: "Measure stenosis properly", detail: "Under general anaesthesia a continuous-wave gradient or a pressure half-time depends on flow, heart rate and filling, so it can hide stenosis. Planimeter each new orifice, ideally in 3D, or in the transgastric short-axis view. Oxford makes the same point on the catheter for mitral stenosis: mean gradients vary with heart rate, so in AF average at least 10 beats." },
            { title: "Check insertion", detail: "Assess and quantify how much of each leaflet is inside the device before release." },
          ],
        },
        {
          kind: "p",
          text: "**When TOE is impossible or poor.** Hausleiter describes 4D intracardiac echo as an emerging alternative for patients with a firm contraindication to TOE or inadequate images. The ICE catheter is passed into the left atrium alongside the TEER system, through a septal puncture that has been dilated to take both; MR is assessed, grasping is guided on reconstructed biplane views, several implants can be placed, and a residual shunt can be closed with guidance from the right atrium.",
        },
        { kind: "tip", id: "structural-teer-planimetry" },
        { kind: "tip", id: "structural-teer-la-vwave" },
        {
          kind: "table",
          caption: "Accepting the result",
          head: ["Measure", "Target or limit"],
          rows: [
            ["Residual MR, primary MR", "1+ or less was associated with lower mortality and heart failure admission than 2+"],
            ["Residual MR, secondary MR", "Debated: no outcome difference between 0/1+ and 2+ in COAPT; registries favour lower residual MR"],
            ["Mean gradient", "Balance MR reduction against a gradient above 5 mmHg, which is associated with worse outcomes"],
            ["Final valve area", "Avoid under 1.5 cm²; in one retrospective analysis 1.94 cm² or less was already associated with less fall in pulmonary pressure and more events at 2 years"],
          ],
        },
        {
          kind: "check",
          stem: "After one central implant, colour Doppler shows mild MR and the continuous-wave mean gradient under anaesthesia is 3 mmHg. 3D planimetry of the two orifices adds up to 1.4 cm². What do you do?",
          options: [
            "Release: the gradient is under 5 mmHg, which is the only stenosis criterion that matters",
            "Release and add a second implant to reduce the MR to trace, because more MR reduction always helps",
            "Release, then repeat the gradient at discharge; planimetry overestimates stenosis after TEER",
            "Do not accept it as it stands: the planimetered area is below 1.5 cm², so reopen and reposition or reconsider the device",
          ],
          answer: 3,
          explanation:
            "Hausleiter warns that the Doppler gradient under general anaesthesia can underestimate stenosis and recommends planimetry of each orifice; a final area under 1.5 cm² should be avoided. The low gradient is the trap. A second implant would shrink the area further.",
        },
        { kind: "h", text: "Fixing residual MR" },
        {
          kind: "list",
          items: [
            "**Second device:** consider it from the residual MR and the gradient, especially in primary MR with a large flail or prolapse gap or width. The first device usually goes more medial and the second lateral to it. A 'zipping' technique may close a large coaptation gap.",
            "**Cleft-like indentations** (often between P1–P2 or P2–P3, with thinned tissue in tethered or dilated valves) cause residual jets. If the main jet comes from one, two devices can converge on it: the lateral one turned slightly clockwise and the medial one slightly counter-clockwise relative to the coaptation line.",
            "**Barlow disease** with several prolapsing segments: an 'anchor' device beside the main jet narrows the gap so the jet can be treated.",
            "**Ventilation:** positive end-expiratory pressure and a breath-hold after forced expiration raise intrathoracic pressure, lower LV preload and shrink the coaptation gap; smaller tidal volumes steady the heart and the TOE plane for grasping.",
            "**Recurrent or residual MR after the procedure:** Heart Team review and a repeat TOE. Case series describe vascular plugs or septal occluders for gaps between or beside implants, and electrosurgical laceration of an implant followed by transapical replacement; safety data are limited.",
          ],
        },
        { kind: "tip", id: "structural-teer-second-device" },
        { kind: "h", text: "Finishing" },
        {
          kind: "p",
          text: "Close the femoral vein either with manual compression plus a figure-of-eight (Z) suture and a pressure dressing (for example for 12 hours), or with a suture-mediated closure device followed by a shorter dressing; the two appear similar in safety and efficacy, and the suture device may allow earlier mobilisation. Assess the iatrogenic ASD before leaving, using the closure criteria in transseptal lesson II.",
        },
        {
          kind: "table",
          caption: "Complications and reported rates (Hausleiter, Table 3)",
          head: ["Complication", "Reported rate", "Notes"],
          rows: [
            ["Single-leaflet device attachment", "1.5–5.1%", "More likely with long-standing secondary MR or short or calcified leaflets. In a large registry, implant failure from SLDA or loss of insertion (3.5%) carried 8.2% in-hospital mortality and 29.3% at a median of 163 days; redo TEER is feasible and may be preferred in suitable patients"],
            ["Device embolisation", "0.05–0.70%", "Percutaneous retrieval can be hard, particularly with larger implants"],
            ["Leaflet injury", "0–2%", "Perforation or tear; extended arms raise concern through more leaflet tension, although in an EXPAND analysis long-arm clips did not have more leaflet adverse events than short-arm clips"],
            ["Haemodynamically relevant iatrogenic ASD", "Not consistently defined", "See the iatrogenic ASD row in transseptal lesson II"],
            ["Residual MR over 2+", "3.4–17.0%", ""],
            ["Mean gradient over 5 mmHg", "Up to 15%", ""],
            ["Major vascular complication", "1.4–4.0%", "Bleeding, perforation, rupture, dissection"],
            ["Pericardial effusion or tamponade", "0–0.5%", ""],
            ["Severe bleeding needing transfusion", "0–17%", "Access, pericardium, gut, urinary tract"],
            ["Myocardial infarction; stroke", "0–3%; 0–1%", ""],
            ["Afterload mismatch", "Rare", "Temporary; usually managed with inotropes without mechanical support; may mark advanced heart failure"],
            ["Atrial or ventricular thrombus", "Rare", "Low-flow states with very poor LV function; earlier and more intense anticoagulation may be indicated"],
          ],
        },
        {
          kind: "list",
          items: [
            "**MR with severe aortic stenosis:** if the MR is secondary and at least 2+, treat the aortic valve first and reassess the MR (for example at 3 months); severe primary MR is less likely to improve, so plan the two procedures in sequence. TEER done first may worsen the coexisting aortic stenosis by increasing forward flow. Three diagnostic traps: a high LV pressure behind a stenotic aortic valve raises the mitral regurgitant volume more than the orifice area; MR can produce a low-flow, low-gradient picture of the aortic stenosis; and the fast MR jet can be mistaken for the aortic stenosis jet.",
            "**MR with TR:** in pooled European registries, TR of at least 2+ was present in 56.3% (and at least 3+ in 18.9%) before TEER and 2+ or more in 44.7% at follow-up, a modest fall. In the TRAMI registry, combined severe MR and TR treated by mitral TEER alone carried higher mortality in hospital, at 30 days and at a year; whether both valves should be treated together or in sequence lacks randomised data.",
            "**Shock and acute MR:** trials excluded them; small series describe TEER as rescue or bridge, including papillary muscle rupture in selected high-risk patients.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a Doppler gradient under anaesthesia as proof that there is no stenosis.",
            "Steering by guesswork: name the view in which each movement shows before you make it.",
            "Letting the trajectory drift as the implant enters the ventricle; grasping from a skewed position distorts the valve.",
            "Chasing the last trace of MR with another implant in a valve that has no area to spare.",
            "Releasing without quantifying leaflet insertion: the setting for single-leaflet attachment.",
          ],
        },
        {
          kind: "pearl",
          text: "Watch the left atrial trace at every grasp. A falling v wave and mean pressure is a result you can feel in the patient; a pretty colour Doppler image with an unchanged v wave deserves a second look.",
        },
        {
          kind: "sim",
          sim: "teer",
          task: "In the TEER lab, steer the device over the A2/P2 jet, turn on the perpendicular guide to align the arms, grasp, then in the Assess step judge residual MR, the mean gradient and the risk of single-leaflet attachment before deciding whether a second device is justified.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, open the 'Breathless with a dilated, poorly contracting LV' scenario and find the large v waves on the wedge trace; explain why the same wave on a left atrial line during TEER should fall after a good grasp, and why Oxford calls large v waves non-specific.",
        },
        { kind: "video", id: "nSgY_iLDiX4", note: "Brilakis channel lecture on percutaneous mitral valve therapies." },
        { kind: "video", id: "SGhygtxcajc", note: "Brilakis channel lecture on mitral valve interventions." },
        {
          kind: "keypoints",
          items: [
            "Puncture about 4.0–4.5 cm above the coaptation point; the coaptation line is lower in secondary MR.",
            "Intercommissural view: push, pull, flex for medial–lateral. LVOT view: clockwise is posterior, counter-clockwise anterior.",
            "Align the C-arm so the arms overlap once 3D confirms perpendicular orientation.",
            "Leaflet optimisation and staged capture use independent grippers or clasps to check and deepen insertion.",
            "Judge the result by MR, pulmonary vein flow, left atrial pressure and planimetered area; avoid an area under 1.5 cm² and weigh a gradient above 5 mmHg.",
            "Second devices: first medial, second lateral; convergent devices for cleft-like jets; anchor devices in Barlow disease.",
            "SLDA 1.5–5.1%, major vascular 1.4–4.0%, tamponade up to 0.5%, embolisation under 1%; residual MR over 2+ (3.4–17%), a gradient over 5 mmHg (up to 15%) and transfusion-requiring bleeding (0–17%) are the commoner shortfalls.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-tricuspid",
      title: "Tricuspid interventions: assessing, selecting, choosing the device and aftercare",
      minutes: 17,
      topics: ["sh-tricuspid"],
      sources: [O("ch 5: Tricuspid valve"), O("ch 4: Right heart pressures and waveforms"), O("ch 4: Calculations")],
      refs: [...OX, "praz-tricuspid-2021", "triluminate-2023", "triscend2-2025", "esc-vhd-2021", "esc-vhd-2025", "adamo-vhd-update-2026", "esc-ph-2022"],
      blocks: [
        {
          kind: "p",
          text: "Tricuspid regurgitation was long left alone, partly because surgery for isolated TR carried high mortality (8.8–9.7% in reported series, often after late referral, although single-centre series in younger, less sick patients suggest surgery can be safe and effective in experienced centres) and partly because of the belief that it improves once the left heart is treated. Praz and colleagues report that more than 90% of patients with clinically relevant TR receive no treatment. Transcatheter therapy now offers options, but the valve is harder to see, its leaflets are thinner and more variable, and its gaps larger than in the mitral valve. This lesson covers the assessment, who is likely to benefit, the device classes and what follows the procedure; the Academy lesson summarises TRILUMINATE and the replacement concept.",
        },
        { kind: "h", text: "The valve" },
        {
          kind: "p",
          text: "The tricuspid is the largest and most anterior valve, and 'three leaflets' is only the commonest pattern. In a four-centre series of 579 patients classified with a proposed nomenclature, 54% had three leaflets (type I), 4.5% two (type II), 38.5% four in one of three arrangements (type III: 2.6%, 32.1% and 3.8%), and 2.4% five (type IV). The number and position of extra leaflets matter for where devices can go. The transgastric short-axis view is the only 2D view that shows all the leaflets together; a 3D en-face rendering does the same.",
        },
        {
          kind: "table",
          head: ["Type of TR", "Mechanism"],
          rows: [
            ["Primary (8–10%)", "Abnormal valve apparatus"],
            ["Secondary, ventricular", "Annular dilatation from RV enlargement and dysfunction, from pulmonary hypertension, often due to left heart disease"],
            ["Secondary, atrial", "AF with normal RV pressures"],
            ["After left-sided valve surgery", "Probably silent ischaemic RV damage; TR progresses in up to 25% after open-heart surgery"],
            ["Lead-related", "An RV lead from a cardiac implantable device causes relevant TR in 20–30% of patients, often progressive"],
          ],
        },
        { kind: "h", text: "Grading severity" },
        {
          kind: "list",
          items: [
            "Specific signs: wide systolic separation of the leaflets, systolic flow reversal in the hepatic veins, and a triangular, early-peaking continuous-wave TR signal; RA and RV dilatation support the grade.",
            "Colour jet size reflects jet momentum, not volume: pulmonary hypertension can enlarge it, and in severe TR rapid equalisation of RA and RV pressures can produce a jet that does not alias.",
            "Vena contracta ≥7 mm generally means severe (some studies use 9 mm averaged from two orthogonal views); 3D planimetry suits the often non-circular orifice.",
            "ASE/EACVI define severe TR as EROA ≥0.40 cm² and regurgitant volume ≥45 mL. Because transcatheter candidates often have orifices several times larger, Praz described proposed 'massive' and 'torrential' grades; these are now part of the five-grade scale (mild, moderate, severe, massive, torrential) used by the 2025 ESC/EACTS guideline, which also asks for TR to be graded in a euvolaemic state. On CMR, a regurgitant volume ≥45 mL or fraction ≥50% marked the highest excess mortality.",
          ],
        },
        { kind: "h", text: "The right ventricle and the catheter" },
        {
          kind: "list",
          items: [
            "Assess the RV when the patient is euvolaemic. RV strain is less load-dependent than TAPSE in severe TR; RV ejection fraction can overestimate systolic function because it ignores afterload.",
            "TAPSE divided by pulmonary artery systolic pressure is a marker of RV–arterial coupling: below 0.31 mm/mmHg indicates a poor prognosis in severe TR. A propensity-matched comparison suggested the largest benefit from intervention when RV dysfunction was intermediate (TAPSE 13–17 mm).",
            "Right heart catheterisation is the reference test for the grade and type of pulmonary hypertension, and for PVR, the RA/wedge ratio, the pulmonary artery pulsatility index and reversibility. An invasive pulmonary pressure more than 10 mmHg away from the echo estimate predicted worse outcomes, as did an impaired ratio of TAPSE to the invasive systolic pulmonary pressure. Because echo often underestimates pulmonary pressure, the 2025 ESC/EACTS guideline makes right heart catheterisation mandatory before intervention, partly to exclude pre-capillary pulmonary hypertension.",
            "Further prognostic markers in Praz: contractile reserve on pharmacological or physical stress (shown in pulmonary hypertension with severe RV dysfunction; its role in TR still needs study) and myocardial fibrosis on CMR, which may help time the intervention.",
            "On the trace, Oxford describes large v waves in the right atrium as blood is driven back in systole, and an RA waveform with large c and v waves and loss of the x descent. The haemodynamics of tricuspid disease, including tricuspid stenosis (where a 5 mmHg gradient matters and two catheters are needed), are taught in hb-specific-conditions-ar-right.",
          ],
        },
        {
          kind: "check",
          stem: "Echo in a candidate for tricuspid intervention gives a pulmonary systolic pressure of 35 mmHg, but right heart catheterisation measures 58 mmHg systolic (mean 38 mmHg), a wedge of 11 mmHg and a PVR of 5.2 Wood units. What is the significance?",
          options: [
            "Echo is the reference standard for pulmonary pressure in severe TR, so the invasive value should be discarded as artefact",
            "The difference proves the TR is torrential, which is the group with the greatest benefit from intervention",
            "A discordance over 10 mmHg between echo and invasive pressure predicted worse outcomes, and this pre-capillary pattern argues against benefit",
            "Invasive pressures are always higher under sedation; repeat the echo and proceed if it still reads 35 mmHg",
          ],
          answer: 2,
          explanation:
            "Praz describes right heart catheterisation as the gold standard and reports that a discordance of more than 10 mmHg between non-invasive and invasive pulmonary pressure independently predicted death, admission or reintervention. A raised mean pressure with a wedge of 15 mmHg or less and a PVR above 2 Wood units is pre-capillary pulmonary hypertension (2022 ESC/ERS definition). Praz puts the absence of pre-capillary pulmonary hypertension in the responder profile, and the 2025 ESC/EACTS recommendation for transcatheter treatment requires it to be absent. Severe TR can make the echo estimate unreliable, which is exactly why the catheter is needed.",
        },
        { kind: "h", text: "Who is likely to benefit" },
        {
          kind: "steps",
          items: [
            { title: "Treat the cause first", detail: "Restore sinus rhythm in AF if feasible, optimise heart failure or pulmonary hypertension treatment, then re-image with the same modality, ideally in the same laboratory. Repositioning or extracting a lead that disturbs the leaflets is possible in selected patients, but its effect on TR is uncertain and it can damage the valve further." },
            { title: "Look for the responder profile", detail: "Most likely to gain: still congested and symptomatic on diuretics, LV function no worse than moderately reduced, RV function preserved, no pre-capillary pulmonary hypertension, and kidney and liver only mildly or moderately affected." },
            { title: "Recognise futility", detail: "End-stage heart failure, untreated combined pre- and post-capillary pulmonary hypertension and severe pulmonary fibrosis point to futility. Praz adds advanced end-organ damage (terminal renal failure, established cirrhosis), especially with a life expectancy under a year, while noting that evidence for these is still lacking." },
            { title: "Prepare the anatomy", detail: "A course of intravenous diuretics in a refractory overloaded patient can shrink the annulus and the gaps and make the intervention easier." },
            { title: "Stage with left-sided disease", detail: "TR and RV size improve in about 40% within 3 months of successful transcatheter mitral treatment, so a staged approach is often appropriate." },
            { title: "Heart valve centre", detail: "Interdisciplinary Heart Team assessment in a centre with tricuspid expertise, advanced imaging and on-site surgery when investigational or replacement systems are used. The 2025 ESC/EACTS guideline makes a Heart Team evaluation of disease stage (TR severity, RV and LV function, pulmonary pressures), operative risk and likelihood of recovery a class I recommendation before any intervention." },
          ],
        },
        {
          kind: "p",
          text: "**Why intervene at all?** Before the randomised trials, two propensity-matched cohorts found lower mortality after transcatheter intervention than with medical therapy alone, and fewer heart failure readmissions at a year (26% vs 47% in one of them); Praz called for randomised confirmation, which the trials in the device table below then supplied for symptoms and quality of life.",
        },
        { kind: "tip", id: "structural-tteer-diurese-first" },
        { kind: "h", text: "The device classes" },
        {
          kind: "table",
          head: ["Class", "How it works", "What the data show", "Watch for"],
          rows: [
            ["Leaflet approximation (tricuspid TEER)", "Clip or paddle implants approximate leaflets; the dedicated clip system has a shorter-curve guide and an extra septal-to-lateral steering plane", "Single-arm TRILUMINATE (85 patients): TR moderate or less in 71% at a year, 83% in NYHA I–II, 40% fewer readmissions, 6-minute walk up by 31 m and KCCQ up by 20 points. Randomised TRILUMINATE Pivotal (350 patients): hierarchical endpoint favoured TEER (win ratio 1.48), driven by quality of life (KCCQ +12.3 vs +0.6 points); TR no more than moderate at 30 days in 87.0% vs 4.8%; 98.3% free of major adverse events; no apparent difference in death, surgery or heart failure admission", "Single-leaflet attachment (about 7% with the first system); coaptation gap over 7–10 mm and a jet outside the anteroseptal commissure predicted failure; with long arms a gap of 8.4 mm or less predicted success"],
            ["Direct annuloplasty", "A screw-anchored adjustable band shortens the annulus", "TR moderate or less in 69–76% at 30 days and 72% at 2 years in small studies", "Right coronary artery perforation or occlusion (15% in early experience, sometimes only transient deformation)"],
            ["Orthotopic replacement", "A valve anchored in the native annulus", "Randomised TRISCEND II (400 patients, 2:1): win ratio 2.02 at a year, driven mainly by symptoms and quality of life. The first transatrial system (30 patients): technical success 87%, in-hospital mortality 10%", "Severe bleeding 15.4% vs 5.3% and new pacemakers 17.4% vs 2.3% (TRISCEND II); with the first transatrial system, relevant conduction disturbance 10%, conversion to surgery 5% and inotropes in 57%, probably for transient RV failure"],
            ["Valve-in-valve", "A transcatheter valve inside a degenerated surgical tricuspid bioprosthesis", "Off-label balloon-expandable valve-in-valve is safe and effective (Praz)", "Valve-in-ring results have been suboptimal"],
            ["Heterotopic caval valves", "Valves in the IVC (and SVC) reduce venous backflow without treating the valve", "Symptomatic option for patients unsuitable for other treatments; experience limited", "Need an IVC up to about 40–43 mm and a gap of at least 10 mm between the cavoatrial junction and the hepatic veins; frame fractures led to redesign of one device"],
          ],
        },
        {
          kind: "p",
          text: "Version note: the 2021 ESC/EACTS guideline, as Praz summarises it, first gave transcatheter treatment a class IIb, level C recommendation for inoperable patients with symptomatic severe TR. After TRILUMINATE Pivotal, Tri.Fr and TRISCEND II, the 2025 ESC/EACTS guideline upgraded it to class IIa, level A for symptomatic patients with severe TR at high surgical risk despite optimal medical therapy, provided severe RV dysfunction and pre-capillary pulmonary hypertension are absent. The task-force summary adds that TEER patients had fewer heart failure admissions at 2 years in TRILUMINATE despite much crossover, and gives pacemaker implantation after replacement as about 25% at a year.",
        },
        {
          kind: "check",
          stem: "A patient with torrential secondary TR has a coaptation gap of 12 mm and the main jet arises between the posterior and septal leaflets. Which concern does the evidence raise about tricuspid TEER?",
          options: [
            "A large gap favours TEER because the implant can stretch the leaflets together under tension",
            "A gap over 7–10 mm and a non-anteroseptal jet were associated with procedural failure with the early system",
            "The jet location is irrelevant because tricuspid implants are always placed at the anteroseptal commissure",
            "Torrential TR is a contraindication to every transcatheter option, so medical therapy is the only choice",
          ],
          answer: 1,
          explanation:
            "Praz reports that a coaptation gap above 7–10 mm and a jet outside the anteroseptal location predicted failure with the early system; with long arms, a gap of 8.4 mm or less predicted success, so 12 mm remains unfavourable. Massive and torrential grades were introduced precisely because transcatheter candidates often have them, so torrential TR is not in itself a contraindication.",
        },
        { kind: "h", text: "Imaging the procedure" },
        {
          kind: "list",
          items: [
            "3D TOE is essential; the mid- and deep-oesophageal views and the transgastric window are the most useful. Every technique except leaflet approximation needs a dedicated CT of the annulus, subvalvular apparatus, RA and venae cavae.",
            "Imagers see the valve from behind (the 'valentine' display); interventionalists think in body directions. Praz recommends an 'attitudinal' nomenclature so the image and the leaflet relations look the same whatever the modality, and joint training of the team.",
            "ICE helps when TOE images are poor, and 3D-capable catheters may reduce the need for general anaesthesia.",
          ],
        },
        { kind: "h", text: "After the procedure" },
        {
          kind: "table",
          head: ["Issue", "Typical approach (Praz 2021)"],
          rows: [
            ["Antithrombotic", "About 70% have AF and need oral anticoagulation. In sinus rhythm without another indication, the post-mitral-repair regimen: usually 4 weeks of aspirin plus clopidogrel, then aspirin. After replacement the best regimen is unclear; early experience favours warfarin, possibly with aspirin for at least a year. Follow local protocol."],
            ["Diuretics", "Keep the pre-procedure dose for at least 3 months to allow RV remodelling; reduce carefully if replacement causes early polyuria (usually within 24–48 hours) or later hypotension or renal impairment"],
            ["Follow-up", "Most centres review at 1, 6 and 12 months, then yearly: NT-proBNP, renal and liver tests, TTE, 6-minute walk and a quality-of-life questionnaire"],
            ["Infection", "Antibiotic prophylaxis around the procedure; afterwards follow endocarditis guidance, with a low threshold to treat"],
            ["Other", "SGLT2 inhibitors may help selected patients with right heart failure after intervention (early, unsystematic experience)"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Judging TR by the size of the colour jet.",
            "Relying on an echo estimate of pulmonary pressure in severe TR when right heart catheterisation would change the decision.",
            "Treating TR before the AF, heart failure or pulmonary hypertension behind it has been addressed and re-imaged.",
            "Assuming a lead is innocent, or assuming lead extraction will fix the valve.",
            "Stopping diuretics early after a successful procedure, or failing to reduce them after replacement-induced polyuria.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the Heart Team meeting, write the TAPSE/PASP ratio and the invasive pulmonary pressure beside the TR grade. A torrential jet in a coupled RV is a target; a moderate jet on top of pre-capillary pulmonary hypertension is a warning.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, open the 'Progressive breathlessness in a young woman' scenario: measure the pulmonary pressures and PVR, classify the pulmonary hypertension, note the limits of invasive cardiac output measurement that Oxford describes, and explain why this profile would argue against a tricuspid intervention.",
        },
        { kind: "video", id: "DFbsXsNeqzw", note: "Elias Hanna's haemodynamic cases including tricuspid regurgitation." },
        {
          kind: "keypoints",
          items: [
            "Most TR is secondary; RV leads cause relevant TR in 20–30% of recipients.",
            "Severe: vena contracta ≥7 mm, EROA ≥0.40 cm², regurgitant volume ≥45 mL; massive and torrential grades exist beyond.",
            "RV coupling (TAPSE/PASP under 0.31 mm/mmHg is poor) and invasive pulmonary haemodynamics shape selection.",
            "Treat the cause and re-image first; consider IV diuretics; stage after mitral treatment.",
            "TEER improves quality of life and reduces TR; gap over 7–10 mm and non-anteroseptal jets predict failure.",
            "Replacement improved symptoms and quality of life in TRISCEND II (win ratio 2.02) but brought more severe bleeding (15.4% vs 5.3%) and new pacemakers (17.4% vs 2.3%); no trial has compared it head to head with TEER.",
            "2025 ESC/EACTS: transcatheter treatment class IIa (level A) for symptomatic high-risk severe TR without severe RV dysfunction or pre-capillary pulmonary hypertension; right heart catheterisation first.",
            "Anticoagulate the many with AF; keep diuretics for at least 3 months; review at 1, 6 and 12 months.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-laao-plan",
      title: "LAAO I: the appendage, the measurements and the plan",
      minutes: 15,
      topics: ["sh-laao"],
      sources: [O("ch 4: Accessing the left heart")],
      refs: [...OX, "laao-consensus-2020", "fukutomi-laao-transseptal-2022", "dukkipati-pdl-2022", "alkhouli-ncdr-leak-2022"],
      blocks: [
        {
          kind: "p",
          text: "Appendage occlusion succeeds or fails on planning: the device that fits, the puncture that lines the sheath up with the appendage, and measurements made at the right moment under the right filling. The Academy lessons cover why and for whom, and the release checks in outline. This lesson works through the anatomy and imaging chapters of the 2020 EHRA/EAPCI consensus.",
        },
        { kind: "h", text: "What you are measuring" },
        {
          kind: "list",
          items: [
            "Length 20–60 mm and width 16–59 mm. The orifice is oval in about 69%, and less often foot-shaped (~10%), triangular (~8%), waterdrop (~8%) or round (~6%), so a single diameter rarely describes it.",
            "Usually two lobes (a lobe is an outpouching with a lumen of at least 2 mm); accessory appendages and atrial diverticula occur in 10–27% of people.",
            "Shapes: chicken-wing ~48% (a marked bend), cactus ~30% (a main central lobe with smaller side lobes), windsock ~19% (one dominant lobe without a bend), cauliflower ~3% (short, without a dominant lobe). Extensive trabeculation is linked to higher stroke risk.",
            "The neck always angles superiorly and anteriorly; the mid-to-distal body points superior-anterior (commonest), mid-to-inferior anterior (less frequent), or turns back superiorly, rightwards and posteriorly (retroflex, infrequent).",
          ],
        },
        { kind: "h", text: "CT or TOE before the day" },
        {
          kind: "table",
          head: ["", "CT angiography", "TOE"],
          rows: [
            ["Strengths", "Better spatial resolution, full 3D anatomy, accurate sizing, non-invasive; plans the sheath, the puncture site and the fluoroscopic angles", "No contrast or X-ray; widely available; usually the guiding modality anyway, so it can be done in the lab just before access"],
            ["Thrombus", "With delayed imaging or other protocol adaptations, specificity and positive predictive value above 90%, sensitivity and negative predictive value close to 100%; a well-opacified appendage without thrombus makes TOE unnecessary", "Excellent at excluding thrombus"],
            ["Downside", "Contrast and radiation", "Finding thrombus or an unsuitable appendage on the table cancels a case after anaesthesia and staff have been committed"],
            ["Timing of measurement", "Phase with the largest appendage, usually late atrial diastole at 30–40% of the RR interval", "End-systole, in at least four planes (0°, 45°, 90°, 135°) after a full 0–135° sweep"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Guiding the implant:** the consensus recommends TOE or ICE. With ICE the best images come from a probe in the left atrium, through a second transseptal puncture or alongside the access sheath through the same one.",
            "**Not recommended for general use:** implanting under fluoroscopy alone, and a distant contrast injection into the appendage on arrival in the left atrium to exclude thrombus when neither TOE nor CT is possible. Both are confined to a few expert centres, and fluoroscopy alone should never be used without pre-screening by CT, TOE or ICE.",
          ],
        },
        {
          kind: "steps",
          title: "Measuring on CT",
          items: [
            { title: "Find the ostium plane", detail: "Build an oblique multiplanar view that shows the circumflex artery, the pulmonary vein ridge and the appendage together." },
            { title: "Make it coaxial", detail: "Take an orthogonal cross-section and adjust the crosshairs to lie coaxial with the wall." },
            { title: "Go en face", detail: "The third, double-oblique plane shows the ostium face-on; measure its maximum and minimum diameters." },
            { title: "Measure for the device family", detail: "Single-lobe (plug) occluder: the ostium from the circumflex artery to a point 1–2 cm inside the pulmonary vein ridge, then the deepest usable depth from there. Lobe-and-disc occluder: the most proximal ostium (inferior edge to the ridge) and a landing zone 10–12 mm inside it (the CT chapter gives 12 mm; the implant chapter gives about 10 mm for devices of 25 mm or less and about 12 mm for 28 mm or more). Follow each device's instructions for use; trabeculation, angulation or a pectinate ridge can move the right site." },
            { title: "Depth", detail: "Measure the depth on multiplanar images; angulated, lobulated appendages may need maximum-intensity projections." },
          ],
        },
        { kind: "h", text: "Why the numbers disagree" },
        {
          kind: "table",
          head: ["Comparison", "Typical difference"],
          rows: [
            ["CT versus 2D TOE (maximal diameter)", "CT 1–3 mm larger"],
            ["CT versus fluoroscopy", "CT 2–4 mm larger"],
            ["3D TOE versus CT", "3D TOE larger than 2D TOE but about 2 mm smaller than CT"],
            ["Effect of a 500–1,000 mL saline bolus", "Ostium and depth about 2 mm larger; perimeter +4%, area +8%"],
          ],
        },
        {
          kind: "p",
          text: "Because the appendage is thin and distensible, filling changes the answer. During the procedure the consensus wants measurements confirmed with a mean left atrial pressure above 12 mmHg, and suggests a fluid challenge of 250–1,000 mL (depending on LV function and any history of heart failure) when the pressure is below 11–12 mmHg. Undersizing risks embolisation and leaks. When measurements differ, rely on the largest valid measurement, made in the right place on good images.",
        },
        { kind: "tip", id: "structural-laao-fill-before-sizing" },
        { kind: "tip", id: "structural-laao-largest-measurement" },
        {
          kind: "check",
          stem: "Under general anaesthesia the mean left atrial pressure is 7 mmHg. 2D TOE gives a maximal ostium of 17 mm; the preprocedural CT gave 20 mm. What should you do before choosing the size?",
          options: [
            "Give a fluid challenge to bring the mean LA pressure above about 12 mmHg, re-measure, and size to the largest valid measurement",
            "Size to the TOE value, because TOE is the procedural imaging modality and reflects today's conditions",
            "Average the two values and choose the device closest to 18.5 mm to split the difference",
            "Size to CT minus 3 mm, because CT always overestimates the appendage compared with TOE",
          ],
          answer: 0,
          explanation:
            "A low left atrial pressure makes the appendage measure small, and CT typically reads 1–3 mm larger than 2D TOE. The consensus advises a fluid challenge when the pressure is below 11–12 mmHg and relying on the largest measurement made at the right location on good images. Sizing to the small TOE value under-fills the device and risks embolisation and leaks.",
        },
        { kind: "h", text: "Planning the views, the sheath and the puncture" },
        {
          kind: "list",
          items: [
            "**Fluoroscopy:** RAO cranial shows the ostium and neck best (useful for lobe-and-disc devices); RAO caudal shows the body and distal lobe (useful for placing the access sheath for a plug occluder). RAO 30°/caudal 20° corresponds roughly to the TOE 135° view and RAO 30°/cranial 20° to the 45° view. CT can supply a patient-specific angle.",
            "**Sheath for the plug occluder:** a double-curve sheath for the commonest superior-anterior body, a single-curve sheath for a mid-to-inferior body, and an anterior-curve sheath when a chicken-wing turns back on itself (retroflex).",
            "**Puncture:** inferior-posterior for most appendages, giving a direct line to a superior-anterior body; mid-level and posterior for an inferiorly directed lobe; very posterior for a very anterior appendage; mid-fossa to anterior for a lateral or posterior appendage such as a reverse chicken-wing.",
            "**Fukutomi's CT study (182 patients):** coaxial alignment was predicted from an inferior-posterior puncture in 75%, inferior-central in 16% and inferior-anterior in 8%, confirmed by angiography in 96% (sheath within 30° of the appendage axis). A reverse chicken-wing and posterior bending of the proximal appendage predicted the need for a central or anterior site, which applied to 20–25%.",
          ],
        },
        { kind: "tip", id: "structural-laao-puncture-from-ct" },
        {
          kind: "check",
          stem: "CT shows a reverse chicken-wing appendage whose proximal part bends posteriorly. Where should the transseptal puncture be?",
          options: [
            "Inferior-posterior, as for every appendage, then torque the sheath counter-clockwise",
            "Inferior but central or anterior in the fossa, to line the sheath up with this appendage",
            "Superior-posterior, as for TEER, to gain height above the appendage ostium",
            "Through the aortic root side of the fossa, which gives the most anterior possible course",
          ],
          answer: 1,
          explanation:
            "Fukutomi found that a reverse chicken-wing and posterior bending of the proximal appendage independently predicted the need for a central or anterior (still inferior) puncture, and the consensus suggests mid-fossa to anterior sites for laterally or posteriorly oriented appendages. Inferior-posterior is right for most appendages but not this one. A puncture near the aortic root risks aortic puncture.",
        },
        { kind: "h", text: "Imaging after the implant" },
        {
          kind: "list",
          items: [
            "TTE before discharge to check the device is in place and there is no effusion (the lobe-and-disc device may look like a figure of 8).",
            "TOE or CT at 6–12 weeks, chiefly to look for thrombus on the device (DRT) and leaks around it; consider repeating at 12 months or later, especially after an embolic event, because very late DRT occurs.",
            "DRT is reported in about 2–4% with most devices (3.7–7.2% in recent large series) and independently predicted stroke or TIA (HR about 4.4). Patient factors: poor LVEF, poor adherence, smoking, spontaneous echo contrast, previous thromboembolism; implant factors: deep implantation, incomplete occlusion.",
            "CT separates flow through the fabric (incomplete endothelialisation) from a true peri-device gap. Reported leak rates vary by device and definition: any leak in about 32% at a year with the plug device in PROTECT AF, leaks over 5 mm in 1% in the EWOLUTION registry, any leak in 12.5% (over 5 mm in 0.6%) with the first lobe-and-disc device, and leaks over 3 mm in 1.8% with its successor.",
            "The 5 mm cut-off came from PROTECT AF, where it decided whether anticoagulation continued, and the 2020 consensus found no link between leaks and events. Later data changed this: pooled PROTECT AF, PREVAIL and CAP2 data linked a leak of 5 mm or less at 1 year with more ischaemic stroke or systemic embolism over 5 years (adjusted HR 1.94), and a US registry of 51,333 patients linked small leaks (over 0 to 5 mm) with modestly more stroke, TIA or systemic embolism (adjusted HR 1.15) and more major bleeding. Aim for no leak, and image any leak again.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring a dry appendage and undersizing the device.",
            "Taking one diameter of an oval orifice.",
            "Measuring a plug occluder's site and then implanting a lobe-and-disc device (or the reverse): the measurement sites differ.",
            "Using the standard inferior-posterior puncture for a reverse chicken-wing.",
            "Calling every irregularity on the atrial face of the device thrombus, or missing a protruding mobile one, which needs anticoagulation.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the case on the CT the day before: the shape, the lobe you will use, the device family, the size from the largest valid measurement, the puncture quadrant, the sheath curve and the C-arm angles. On the table, TOE then only has to confirm the plan, under proper filling.",
        },
        {
          kind: "sim",
          sim: "laao",
          task: "In the LAAO lab TOE measure step, measure the appendage at 0°, 45°, 90° and 135°, note the largest diameter and the usable depth, and decide which device family fits; then choose a transseptal site in the next step that gives a coaxial approach.",
        },
        { kind: "video", id: "9zHX1JiyZxs", note: "Brilakis channel lecture on left atrial appendage occlusion." },
        {
          kind: "keypoints",
          items: [
            "Chicken-wing ~48%, cactus ~30%, windsock ~19%, cauliflower ~3%; most orifices are oval.",
            "CT measures at 30–40% of RR; TOE at end-systole in at least four planes.",
            "CT reads 1–3 mm above 2D TOE; filling adds about 2 mm. Measure with mean LA pressure above 12 mmHg; size to the largest valid value.",
            "Measurement sites differ by device family; follow the instructions for use.",
            "RAO cranial for the neck, RAO caudal for the body; RAO 30/caudal 20 ≈ TOE 135°.",
            "Inferior-posterior puncture for most; central or anterior for a reverse chicken-wing or posteriorly bent neck.",
            "TTE before discharge; TOE or CT at 6–12 weeks for DRT and leak.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-mitral-tricuspid-laa-laao-implant",
      title: "LAAO II: implanting the two device families, release and aftercare",
      minutes: 18,
      topics: ["sh-laao"],
      sources: [O("ch 4: Accessing the left heart"), B("14.6")],
      refs: [...BOOKS, "laao-consensus-2020", "lakkireddy-amulet-ide-2021", "reddy-laao-5y-2017", "dukkipati-pdl-2022", "alkhouli-ncdr-leak-2022"],
      blocks: [
        {
          kind: "p",
          text: "The 2020 EHRA/EAPCI consensus describes the implant of a single-lobe (plug) occluder and of a lobe-and-disc occluder movement by movement. The two share the access and the puncture but deploy in opposite ways, so keep their movements separate in your head. Device-specific numbers below are those the consensus gives for the devices it describes; newer generations have their own instructions for use.",
        },
        {
          kind: "steps",
          title: "Shared steps",
          items: [
            { title: "Antibiotic", detail: "One dose before and one after the procedure, chosen by local policy and allergy history." },
            { title: "Access with care", detail: "Right femoral vein; vascular complications have been relatively common in trials and registries, so use ultrasound (or fluoroscopic marking of the lower third of the femoral head), consider a micropuncture needle, and consider a suture pre-close (not shown to improve outcomes or reduce vascular complications). In obese patients a 16 Fr sheath through the subcutaneous tissue can improve torque on the access sheath." },
            { title: "Puncture", detail: "As in the transseptal lessons, at the site planned from CT (usually inferior-posterior). Heparin before or on crossing (for example 100 U/kg) for an ACT above 250 s (some operators prefer above 300 s), maintained throughout. Measure the mean left atrial pressure and load with fluid if it is below 11–12 mmHg." },
            { title: "Wire", detail: "A stiff-bodied, soft J-tipped 0.035-inch wire in the left upper pulmonary vein (turn the transseptal sheath slightly clockwise to aim posteriorly), or a pigtail-shaped wire in the atrium if the vein will not cannulate." },
          ],
        },
        { kind: "h", text: "Single-lobe (plug) occluder" },
        {
          kind: "steps",
          items: [
            { title: "Access sheath across", detail: "Exchange for the device access sheath until its tip is 2–3 cm across the septum; withdraw the dilator into it, remove the wire, then remove the dilator slowly while aspirating. Aspirate and flush." },
            { title: "Pigtail into the deepest lobe", detail: "Advance an angled 5–6 Fr marker pigtail and turn it into the appendage, into the deepest (usually anterior and largest) lobe. If the sheath tip is far into the atrium the pigtail cannot be steered: pull the sheath back to 2–3 cm in the atrium." },
            { title: "Angiogram and measure", detail: "Cine in RAO caudal (for example 30/20) and RAO cranial (30/20), or CT-derived views; a power injector (typical 9 mL at 9 mL/s) fills large appendages that a hand injection cannot. Measure the maximum ostium and depth in the frame with the largest diameter and compare with echo and CT; similar views rarely differ by more than 2 mm. Size from the chart: the earlier-generation device the consensus describes needs at least 8% compression (current devices have their own instructions for use), and oversizing by about 20–25% may reduce leaks when depth and pectinate muscles allow." },
            { title: "Sheath over the pigtail", detail: "Advance the access sheath over the pigtail as deep as is safe. Its distal marker band sits 5 mm behind the tip, so keep that marker at least 5 mm from the appendage wall; the proximal markers show where the loaded device will sit. Counter-clockwise torque helps reach anterior appendages. Leave the pigtail in until the device is ready: it stops the sheath sliding deeper." },
            { title: "Insert the device without air", detail: "Remove the pigtail without letting the sheath advance. Open the sheath valve and hold it low so it back-bleeds, flush the delivery catheter so the two meet fluid to fluid, align the delivery catheter's marker with the sheath's distal marker, then pull the sheath back onto the delivery catheter until it clicks and they move as one. The sheath markers no longer guide depth after this." },
            { title: "Deploy by unsheathing", detail: "In the RAO caudal view, hold the cable still and pull the sheath and catheter back very slowly. Ask the anaesthetist to hold ventilation (or the awake patient to breathe shallowly); an assistant can trace the far end of the appendage on the screen. Do not push or reposition. Once the device starts to open, keep a very slight forward tension so it does not migrate into the atrium." },
            { title: "PASS", detail: "Position: more than half the device length beyond the ostium. Anchor: keep the catheter tip 2–4 cm back from the hub, tug the cable and watch device and appendage move together. Size: the largest shoulder diameter in every TOE plane (and/or fluoroscopy) at least 8% below the nominal size (8% for the earlier-generation device the consensus describes; follow the instructions for use of current devices). Seal: no relevant leak in any plane; the consensus imaging chapter sets the procedural target as a minimal peri-device leak under 3 mm in all four planes. Contrast is optional when echo criteria are met." },
            { title: "Release", detail: "Turn the cable counter-clockwise 3–5 turns without forward tension, then pull its tip back into the catheter to protect the atrium." },
          ],
        },
        { kind: "h", text: "Equipment details for the plug device the consensus describes (check the instructions for yours)" },
        {
          kind: "list",
          items: [
            "The access sheath carries four marker bands. The distal one lies 5 mm from the tip; the three proximal ones match the proximal end of the loaded 21, 27 and 33 mm devices (the 24 and 30 mm devices fall between them). If the sheath is too deep, pull it back until the marker for the chosen size meets the ostium.",
            "Both the sheath and the delivery catheter run 5 mm beyond their distal marker, a segment that may not show on fluoroscopy.",
            "When the device is handed over, confirm its feet sit at the delivery catheter's distal marker, not beyond it.",
            "The sheath can lose its anterior orientation as the delivery catheter goes in; an assistant can hold counter-clockwise torque on it meanwhile.",
            "Some operators swap the pigtail for a soft-tipped J stiff wire in the appendage and exchange sheaths over it, avoiding movement and forward tension during the exchange.",
          ],
        },
        { kind: "tip", id: "structural-laao-pigtail-leads" },
        { kind: "tip", id: "structural-laao-plug-unsheathe" },
        { kind: "tip", id: "structural-laao-plug-pass" },
        {
          kind: "table",
          caption: "Recapture rules for the plug occluder",
          head: ["Problem", "Action"],
          rows: [
            ["Too distal in the appendage", "Partial recapture: re-advance the sheath and catheter over the device up to, but not past, the fixation barbs (resistance is felt), pull back slightly and redeploy"],
            ["Sheath advanced past the barbs", "Remove the device (barb injury)"],
            ["Wrong size", "Full recapture and change of size"],
            ["Too proximal (too far into the atrium)", "Do not partly recapture and push forward: advancing without a leading pigtail or wire is traumatic and risks perforation"],
          ],
        },
        {
          kind: "check",
          stem: "A plug occluder has been deployed. In all four TOE planes the shoulder measures 4–5% below the nominal size, the device moves independently of the appendage on tug testing, and there is a 2 mm leak. What do you do?",
          options: [
            "Release, because a 2 mm leak is below the 5 mm threshold and does not need treatment",
            "Partially recapture and push the device deeper to improve its anchoring in the appendage",
            "Release and keep the patient on oral anticoagulation until the leak has sealed",
            "Recapture fully and redeploy a larger size, then repeat the PASS checks",
          ],
          answer: 3,
          explanation:
            "The device fails Size (compression of 4–5% is below the 8% minimum the consensus gives for its device) and Anchor (independent movement), so it is undersized and at risk of embolisation. Full recapture and upsizing is the recapture rule for a wrong size. The small leak distracts from the real problem, and pushing a recaptured device forward is the traumatic manoeuvre the consensus warns against.",
        },
        { kind: "h", text: "Lobe-and-disc occluder" },
        {
          kind: "steps",
          items: [
            { title: "Sheath", detail: "The delivery sheath has two 45° out-of-plane bends and can be reshaped. It can be taken into the appendage directly with the dilator pulled back behind the proximal bend, or over a pigtail." },
            { title: "Measure the landing zone", detail: "On angiography (RAO caudal or cranial), measure the ostium and a landing zone about 10 mm inside it for devices of 25 mm or less, or about 12 mm for 28 mm or more. Measure the landing zone's length too: a short one changes the technique. With CT, the mean diameter or perimeter of an elliptical zone avoids gross oversizing." },
            { title: "Prepare without air", detail: "Flush the loader until no air is visible; connect fluid to fluid while the sheath back-bleeds. Advance the cable without turning it counter-clockwise, which could release the device early; pull back 1–2 cm to confirm it is still attached." },
            { title: "Ball", detail: "In the view that best shows the landing zone and ostium (often RAO cranial), hold the cable and pull the sheath back until the lobe forms a round 'ball'. The ball is atraumatic: sheath and ball can now be moved together into the landing zone, often with counter-clockwise rotation for coaxial alignment." },
            { title: "Open the lobe by pushing", detail: "With the ball in the landing zone, fix the sheath and push the cable: the lobe opens laterally, through a triangle to a tyre, and its anchors engage. If you instead hold the cable and pull the sheath, the device slips proximally, possibly ending up sitting in the atrium." },
            { title: "Open the disc", detail: "Pull the sheath back with slight tension on the cable so the disc opens." },
            { title: "Tug and check", detail: "With the sheath tip about 2 cm from the device, pull the cable until the disc becomes football-shaped (some hold this for 30 seconds to 2 minutes), then release and check: lobe tyre-shaped (slightly compressed) and perpendicular to the landing-zone axis; a half to two-thirds or more of the lobe distal to the circumflex artery; slight separation between lobe and disc; disc slightly concave, under tension at the ostium. Check for leaks at 0°, 45°, 90° and 135°: the consensus detaches this device when the shape criteria are met and no device leak is seen (its imaging chapter accepts a minimal leak under 3 mm as the general procedural target)." },
            { title: "Wait, then release", detail: "Wait a few minutes to see whether the device moves. Release by counter-clockwise rotation with slight backward tension, so the screw does not catch the fabric, and pull the cable into the sheath." },
          ],
        },
        { kind: "tip", id: "structural-laao-disc-ball-push" },
        { kind: "tip", id: "structural-laao-disc-criteria" },
        {
          kind: "table",
          caption: "Lobe-and-disc problems and fixes",
          head: ["Situation", "Fix"],
          rows: [
            ["Right size, wrong position", "Partial recapture: re-advance the sheath over the disc and part of the lobe to the lobe marker or the triangle shape, so the anchors disengage without entering the sheath"],
            ["Anchors entered the sheath", "Remove the device and reload it (or use a new one); anchors may be damaged and fixation unreliable"],
            ["Sheath tip invaginated (seen on magnified cine)", "Re-pass a soft J wire to the atrium or pulmonary vein and re-insert the dilator over it to restore the tip before a new device"],
            ["Device too small or large", "Remove by reversing the steps; a larger device may need a larger sheath (for example 12 Fr to 14 Fr above 25 mm), so some use 14 Fr from the start with the adaptor for smaller devices"],
            ["Short landing zone (often a chicken-wing)", "'Sandwich' technique: deploy the lobe deeper, in line with the wing, so the short neck lies between lobe and disc; usually needs a larger size and deeper initial engagement; the whole lobe must be in the wing or too few anchors reach the wall"],
            ["Large ostium tapering to a narrow landing zone; or a small (16–22 mm) device indicated", "Consider oversizing by 2 mm above the chart (small devices have fewer anchors)"],
          ],
        },
        { kind: "tip", id: "structural-laao-anchors-in-sheath" },
        {
          kind: "check",
          stem: "The lobe-and-disc device has formed a ball exactly in the landing zone. The operator holds the cable still and pulls the sheath back to open the lobe. What is likely to happen?",
          options: [
            "The lobe opens in place; pulling the sheath is the correct way to open both the lobe and the disc of this device",
            "The anchors are driven into the sheath tip, which then invaginates and has to be replaced",
            "The device slides back towards the ostium and may sit in the atrium; open the lobe by pushing the cable with the sheath fixed",
            "The disc opens before the lobe, so the device seals the ostium without anchoring in the appendage",
          ],
          answer: 2,
          explanation:
            "For the lobe-and-disc device the consensus opens the lobe by pushing the cable while the sheath is held, which unfolds it laterally without advancing it; holding the cable and pulling the sheath makes it migrate towards the ostium. Unsheathing is the plug occluder's technique, which is why it tempts here. Anchors enter the sheath when a recapture goes too far, not during deployment.",
        },
        { kind: "h", text: "Evidence between the device families" },
        {
          kind: "p",
          text: "Amulet IDE randomised 1,878 patients between a lobe-and-disc and a plug occluder. The lobe-and-disc device was non-inferior for safety (14.5% vs 14.7%) and for ischaemic stroke or systemic embolism at 18 months (2.8% vs 2.8%), and superior for occlusion at 45 days (98.9% vs 96.8%). Procedure-related complications were higher with it (4.5% vs 2.5%), mainly pericardial effusion and device embolisation, and fell with operator experience.",
        },
        { kind: "h", text: "The antithrombotic plan" },
        {
          kind: "table",
          caption: "2020 EHRA/EAPCI consensus; regimens must follow local protocol and device instructions",
          head: ["Situation", "Approach"],
          rows: [
            ["Mobile thrombus on screening", "Contraindication; treat with heparin or at least 4 weeks of oral anticoagulation and re-image before implanting"],
            ["During the implant", "Unfractionated heparin 70–100 U/kg, at the latest straight after crossing, for an ACT of at least 250 s"],
            ["Can take oral anticoagulation (trial regimen)", "Warfarin plus aspirin for 45 days, then clopidogrel plus aspirin (described as six months), then aspirin long term; a NOAC appears a possible alternative to warfarin early on"],
            ["Contraindication to oral anticoagulation", "DAPT for at least 1 month or until a 6-month TOE; with complete occlusion or a residual jet under 5 mm and no device thrombus, drop one antiplatelet and usually continue the other"],
            ["Extremely high bleeding risk", "Aim for at least 2–4 weeks of antiplatelet therapy; endocardial implantation is then possible but at a somewhat higher thromboembolic risk. If not even a single antiplatelet for 2 weeks is possible, an endocardial device should not be implanted; consider epicardial closure in experienced hands, remembering that thrombus has also been described after epicardial closure"],
            ["Device-related thrombus", "Anticoagulation (subcutaneous heparin or oral anticoagulant for weeks to months) in every patient, symptomatic or not, until follow-up TOE or CT shows resolution; a no-antithrombotic strategy is not appropriate"],
            ["Residual leak", "Small jets (under 5 mm) may close spontaneously with time, but later data associate them with modestly more thromboembolism, so image them again; for persistent leaks of 5 mm or more, long-term anticoagulation or leak closure is at the operator's discretion"],
          ],
        },
        { kind: "tip", id: "structural-laao-drt-anticoagulate" },
        {
          kind: "p",
          text: "The room must be ready for perforation and tamponade and for device or air embolism: large sheaths, transseptal kits, wires, snares and pericardiocentesis equipment to hand, and a team that knows the procedure and their roles. Operators should have done at least 10 transseptal punctures (in other procedures, or under an expert in their first appendage cases) before working unproctored, and should be proctored with each new device. On-site cardiac surgery is not mandatory, but rapid transfer to a surgical centre must be arranged, with no more than 60 minutes' delay to operation (consensus, operator and centre requirements).",
        },
        {
          kind: "pitfalls",
          items: [
            "Unsheathing a lobe-and-disc device, or pushing a plug occluder out of its sheath: each device's deployment is the other's mistake.",
            "Letting the plug occluder's sheath creep deeper while the pigtail is removed or the device inserted.",
            "Advancing the delivery cable while turning it counter-clockwise (premature release of a lobe-and-disc device).",
            "Recapturing so far that the anchors enter the sheath, then redeploying the same device.",
            "Releasing without the waiting period, the tug test or all four TOE planes.",
            "Discharging without an antithrombotic plan and a 6–12 week imaging date.",
          ],
        },
        {
          kind: "pearl",
          text: "Name the deployment aloud before you touch the device: 'plug: hold the cable, pull the sheath' or 'lobe and disc: ball, then push the cable, then pull the sheath for the disc'. Saying it keeps the two techniques apart.",
        },
        {
          kind: "sim",
          sim: "laao",
          task: "In the LAAO lab, run the case twice: once with the plug device and once with the lobe-and-disc device. Size each from your four-plane measurements, deploy, and in the PASS check step state each release criterion for that device before releasing.",
        },
        { kind: "video", id: "9zHX1JiyZxs", note: "Brilakis channel lecture on left atrial appendage occlusion." },
        {
          kind: "keypoints",
          items: [
            "Antibiotic before and after; careful ultrasound-guided venous access; heparin for an ACT above 250 s.",
            "Plug: pigtail leads the sheath into the deepest lobe; distal marker 5 mm behind the tip; deploy by withdrawing the sheath; PASS (more than half beyond the ostium, tug, at least 8% compression for the earlier-generation device the consensus describes, seal with any leak under 3 mm).",
            "Plug recapture: partial only up to the barbs; never push a too-proximal device forward.",
            "Lobe-and-disc: landing zone 10–12 mm in; ball, push the cable to open the lobe, pull the sheath for the disc; tyre-shaped lobe, half to two-thirds beyond the circumflex, separation, concave disc.",
            "Short landing zone: sandwich technique, usually a larger size.",
            "No endocardial device if not even 2 weeks of single antiplatelet therapy is possible; DRT always gets anticoagulation until resolved.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-mitral-tricuspid-laa-q1",
      stem: "During the pull-down, the short-axis view shows the tent too anterior. According to Russo, which manoeuvre moves the contact point posteriorly?",
      options: [
        "Clockwise rotation combined with a slight withdrawal of the transseptal system",
        "Counter-clockwise rotation alone, keeping the system at the same level in the fossa",
        "Clockwise rotation alone, which moves the tip directly to a more posterior site",
        "Advancing the system slightly, which slides the tip from anterior to posterior",
      ],
      answer: 0,
      explanation:
        "An isolated clockwise turn only spins the sheath about its axis; Russo moves the contact point by combining two movements, clockwise rotation with a slight pull-back, to go posterior. The tempting answer is clockwise alone, which is the right direction but does not move the tent. Counter-clockwise moves towards the mitral plane.",
      difficulty: 3,
      refs: ["russo-transseptal-2021", "laao-consensus-2020"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q2",
      stem: "After crossing, which pressure tracing from the needle tip best supports a left atrial position?",
      options: [
        "A venous trace with an a wave clearly taller than the v wave",
        "A pulsatile trace with a dicrotic notch and a systolic peak",
        "A venous trace with a v wave slightly taller than the a wave",
        "A trace with a diastolic pressure near zero and a rapid upstroke",
      ],
      answer: 2,
      explanation:
        "Oxford describes the left atrial v wave as usually slightly higher than the a wave, and the right atrial a wave as usually a little taller than its v wave; the LAAO consensus uses this difference to confirm the puncture. A dicrotic notch means the aorta, and a ventricular trace has a near-zero diastolic pressure. The a-dominant trace is the tempting choice, but it is the right atrium.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "laao-consensus-2020"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q3",
      stem: "During a TEER puncture the dilator and sheath were advanced over the needle before the trace was read, and contrast now outlines the ascending aorta. Blood pressure is stable. What is the correct sequence?",
      options: [
        "Leave the dilator and sheath exactly where they are, withdraw nothing, call the surgeon and exclude tamponade",
        "Withdraw the sheath into the right atrium slowly while injecting contrast, then give protamine and watch on TOE",
        "Withdraw the sheath and dilator together quickly, then puncture again at a more posterior site on the fossa",
        "Give a full heparin bolus to protect the sheath from thrombus, then call the surgeon to discuss closure",
      ],
      answer: 0,
      explanation:
        "Russo: once aortic puncture is confirmed, pull nothing back and call the surgeon before planning further steps, ruling out tamponade first if instability develops. A needle-only puncture may be harmless, but if dilator and sheath have entered the aorta, massive haemopericardium may occur; occluder closure has been described. Slow withdrawal sounds controlled but still pulls back what Russo says must stay.",
      difficulty: 3,
      refs: ["russo-transseptal-2021", "brilakis-manual-pci"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q4",
      stem: "After mitral TEER, TOE shows a 6 mm iatrogenic ASD with mainly right-to-left flow, and the oxygen saturation has fallen to 87% on air. What is the best course?",
      options: [
        "Leave it, because the MITHRAS trial found that closing iatrogenic defects after TEER did not improve outcomes",
        "Leave it, because only defects larger than 8 mm need closure and this one measures 6 mm",
        "Reassess in a year, because iatrogenic defects reliably close by themselves once the guide is out",
        "Close it: right-to-left shunting with hypoxaemia is an indication for closure whatever the size",
      ],
      answer: 3,
      explanation:
        "Russo lists bidirectional or right-to-left shunting and a defect over 8 mm as indications for closure, each sufficient alone, and the Academy lesson closes for right-to-left shunting with hypoxia. MITHRAS is the tempting answer, but it randomised patients with a relevant left-to-right shunt (Qp:Qs at least 1.3) a month after TEER; closure did not improve death or heart failure admission at 12 months, which says nothing against closing a right-to-left defect that is causing hypoxaemia. Size is only one of the criteria.",
      difficulty: 3,
      refs: ["russo-transseptal-2021", "lurz-mithras-2021"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q5",
      stem: "In a valve with a 3D area of 4.2 cm² and a baseline mean gradient of 4 mmHg, which implant consideration best follows Hausleiter's guidance?",
      options: [
        "Choose the widest implant available, since a wide implant spreads the grasp and so removes less of the area",
        "Expect implants to remove about half the area, most at A2/P2; favour short arms or the smaller paddle",
        "Ignore the area because the gradient under anaesthesia will show whether stenosis has been created",
        "Plan two distant implants, as a 4.2 cm² valve comfortably exceeds the area two implants require",
      ],
      answer: 1,
      explanation:
        "Earlier-generation implants reduced the area by about 47–57%, most in the A2/P2 hot zone; an area under 4 cm² and a baseline gradient of 4 mmHg or more predict a final gradient of 5 mmHg or more, and a small area (under 4.5 cm²) favours short-arm clips or the smaller paddle. Two distant devices need about 6 cm². The anaesthetic gradient can hide stenosis, which is why planimetry is needed.",
      difficulty: 2,
      refs: ["hausleiter-mitral-teer-2023"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q6",
      stem: "With an x-plane showing the intercommissural and LVOT views, the open implant sits too far medially and slightly anterior. Which pair of corrections matches Hausleiter's description?",
      options: [
        "Rotate clockwise to move laterally in the intercommissural view; flex the guide to move posteriorly in the LVOT view",
        "Rotate counter-clockwise to move laterally and posteriorly at once, checked in the four-chamber view",
        "Push, pull or flex for medial–lateral (intercommissural view); rotate clockwise for posterior (LVOT view)",
        "Withdraw the guide to lose height; this moves the implant both lateral and posterior in either view",
      ],
      answer: 2,
      explanation:
        "Pushing, pulling and flexing the steerable catheter move the implant medially or laterally, seen in the intercommissural view; clockwise rotation moves it posteriorly and counter-clockwise anteriorly, seen in the LVOT view. Flexing the guide corrects an aorta-hugger position or loses height. Rotation is the tempting answer for medial–lateral, but it acts in the other plane.",
      difficulty: 3,
      refs: ["hausleiter-mitral-teer-2023"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q7",
      stem: "After two implants under general anaesthesia, MR is mild; the heart rate is 50/min, the CW mean gradient 6 mmHg and the planimetered area 1.8 cm². What is the best interpretation?",
      options: [
        "The area is above 1.5 cm², so the gradient can safely be disregarded and the result accepted as ideal",
        "Both numbers sit where worse outcomes were reported; weigh them against the MR reduction before release",
        "A gradient above 5 mmHg is an absolute reason to remove both implants and abandon the procedure",
        "Gradients are unreliable at slow heart rates, so add a third implant to remove the last of the residual MR",
      ],
      answer: 1,
      explanation:
        "Hausleiter links a final gradient above 5 mmHg with worse outcomes and, in one retrospective analysis, an area of 1.94 cm² or less with a smaller fall in pulmonary pressure and more events at 2 years, while advising only that areas under 1.5 cm² be avoided. Gradients depend on flow, filling and heart rate (Oxford; Hausleiter), so neither number stands alone: the decision balances stenosis against MR reduction. Clearing 1.5 cm² is the tempting reason to stop thinking; a third implant would shrink the area further.",
      difficulty: 3,
      refs: ["hausleiter-mitral-teer-2023", "oxford-cath-handbook"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q8",
      stem: "What did TRISCEND II show for transcatheter tricuspid valve replacement compared with medical therapy?",
      options: [
        "A large reduction in all-cause death at one year, with pacemaker rates similar to medical therapy",
        "No difference in quality of life, but fewer heart failure admissions and less severe bleeding",
        "A benefit confined to patients with severe pre-capillary pulmonary hypertension and RV failure",
        "Win ratio 2.02, mainly from symptoms and quality of life, with more bleeding and pacemakers",
      ],
      answer: 3,
      explanation:
        "TRISCEND II randomised 400 patients 2:1; the hierarchical outcome favoured replacement (win ratio 2.02), driven chiefly by quality of life (KCCQ) and NYHA class; the 6-minute walk contributed little (wins 1.1% vs 0.9%). Severe bleeding (15.4% vs 5.3%) and new pacemakers (17.4% vs 2.3%) were more frequent. Heart failure admissions did not favour replacement, and pre-capillary pulmonary hypertension is a marker of futility, not benefit.",
      difficulty: 2,
      refs: ["triscend2-2025"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q9",
      stem: "Which tricuspid patient is most likely to gain from a transcatheter intervention, according to Praz and colleagues?",
      options: [
        "Overloaded despite diuretics, mild LV impairment, preserved RV function, no pre-capillary PH",
        "End-stage heart failure with torrential TR, severe RV dysfunction and a life expectancy of under one year",
        "Severe pulmonary fibrosis with pre- and post-capillary pulmonary hypertension that has not been treated",
        "Established cirrhosis and terminal renal failure, in whom relief of congestion may reverse organ damage",
      ],
      answer: 0,
      explanation:
        "Praz's likely responder is still symptomatic and congested on diuretics, has LV function no worse than moderately reduced and a preserved RV, has no pre-capillary pulmonary hypertension, and has kidneys and liver only mildly or moderately affected. The other options are the features Praz lists as making the procedure likely to be futile, including advanced end-organ damage with a life expectancy under a year.",
      difficulty: 1,
      refs: ["praz-tricuspid-2021"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q10",
      stem: "CT before a plug-occluder implant shows that the mid-to-distal body of the appendage points inferiorly rather than superiorly. Which plan follows the 2020 consensus?",
      options: [
        "A standard inferior-posterior puncture with a double-curve access sheath, as for most appendages",
        "A mid-level, posterior puncture with a single-curve access sheath to reach the inferior lobe",
        "A superior-posterior puncture with an anterior-curve sheath to come down onto the lobe from above",
        "A mid-fossa to anterior puncture with a double-curve sheath turned hard counter-clockwise",
      ],
      answer: 1,
      explanation:
        "The consensus matches the sheath to the direction of the body: double-curve for the commonest superior-anterior body, single-curve for a mid-to-inferior body and anterior-curve for a retroflex chicken-wing. For a mid-inferiorly directed appendage it advises a mid-level, posterior puncture so the single-curve sheath can reach the tip of the lobe. Inferior-posterior with a double curve is right for most appendages, which makes it the tempting choice; mid-fossa to anterior sites are for laterally or posteriorly oriented appendages.",
      difficulty: 2,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q11",
      stem: "A patient being considered for LAAO cannot take any antithrombotic drug, not even a single antiplatelet agent for two weeks. What does the 2020 EHRA/EAPCI consensus advise?",
      options: [
        "Implant an endocardial device and give no antithrombotic therapy, because occlusion removes the risk",
        "Choose a lobe-and-disc device, whose instructions allow no antithrombotic therapy after the implant",
        "Implant any device and give anticoagulation only if thrombus is seen on the 6–12 week TOE",
        "Do not implant an endocardial device; discuss epicardial appendage closure in an experienced centre",
      ],
      answer: 3,
      explanation:
        "The consensus aims for at least 2–4 weeks of antiplatelet therapy even at the highest bleeding risk, advises against any endocardial device when even two weeks of a single antiplatelet drug cannot be given, and suggests epicardial closure instead, while noting that thrombus has also been described after epicardial closure. Device-related thrombus is less likely with antiplatelet or anticoagulant therapy, so a no-antithrombotic strategy is not appropriate.",
      difficulty: 3,
      refs: ["laao-consensus-2020"],
    },
    {
      id: "hb-mitral-tricuspid-laa-q12",
      stem: "A lobe-and-disc device has its lobe in the landing zone as a ball. What is the next movement, and what does the wrong movement cause?",
      options: [
        "Hold the cable and pull the sheath to open the lobe; pushing the cable would drive the lobe through the appendage",
        "Fix the sheath and push the cable; pulling the sheath instead lets the device slip proximally",
        "Rotate the cable counter-clockwise to open the lobe; pulling the sheath would release the device too early",
        "Pull the cable firmly to seat the lobe; pushing the cable would push the anchors back into the sheath",
      ],
      answer: 1,
      explanation:
        "The consensus opens the lobe of this device by pushing the cable with the sheath held, which unfolds it laterally without advancing it; holding the cable and retracting the sheath makes it migrate towards the ostium. Pulling the sheath is the plug occluder's technique, which is why it tempts. Turning the cable counter-clockwise risks premature release.",
      difficulty: 3,
      refs: ["laao-consensus-2020"],
    },
  ],
  sims: [
    { sim: "teer", task: "Plan the transseptal site for the scenario's MR type, steer and align over the jet, grasp, and judge residual MR, gradient and leaflet insertion before deciding on a second device." },
    { sim: "laao", task: "Measure the appendage in four planes under adequate filling, choose a device family and size, puncture inferiorly at the site that gives a coaxial sheath, deploy each device by its own technique and apply its release criteria." },
    { sim: "haemo", task: "Find the large v waves of functional mitral regurgitation on the wedge trace and classify pre- and post-capillary pulmonary hypertension, as you would before a mitral or tricuspid intervention." },
  ],
  caseIds: ["hb-mitral-tricuspid-laa-case-teer-flail", "hb-mitral-tricuspid-laa-case-laao-reverse-wing"],
};

export const cases: CaseStudy[] = [
  {
    id: "hb-mitral-tricuspid-laa-case-teer-flail",
    title: "A flail posterior leaflet, a floppy septum and a gradient that lies",
    trackId: "cath-handbook",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Hausleiter 2023 (mitral TEER: work-up, device selection, imaging, optimisation, complications); Russo 2021 (transseptal technique, floppy septa, complications); Oxford Handbook ch 4 (left heart waveforms) and ch 5 (mitral regurgitation)",
    },
    summary:
      "An elderly patient with severe primary MR is treated with TEER after a Heart Team decision. Choose the implant, place the puncture for a floppy septum, handle a vagal reaction after crossing, steer away from the aorta, judge the grasp by more than the gradient, and decide about the septal defect.",
    presentation:
      "An 84-year-old woman has NYHA class III breathlessness from severe primary MR with a flail P2 segment. The Heart Team judged her surgical risk prohibitive and recommended TEER. She is euvolaemic on her usual medicines.",
    findings: [
      "TOE: flail P2 with a flail gap of 8 mm and width of 12 mm; mobile posterior leaflet length 11 mm in the grasping zone; no calcium in the grasping zone",
      "3D valve area 4.8 cm²; baseline mean gradient 2 mmHg; single central jet",
      "Interatrial septum mobile and aneurysmal; no left atrial or appendage thrombus",
      "LVEF 60%; moderate TR; pulmonary artery systolic pressure on echo 45 mmHg",
    ],
    steps: [
      {
        id: "device",
        prompt: "Which implant plan fits this valve best?",
        info: "The valve area is 4.8 cm². The posterior leaflet is long and mobile and the flail gap is 8 mm.",
        options: [
          {
            text: "A long-arm implant at A2/P2, accepting that a second device would only be added if the gradient and area allow",
            best: true,
            feedback:
              "Right. A mobile leaflet over 9 mm and a flail favour long arms (Hausleiter Table 4), and one central implant is the plan. Implants remove roughly half the area, most at A2/P2, so a 4.8 cm² valve has room for one device; any second device depends on the planimetered area afterwards.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Two implants placed well apart from the start, to cover the whole flail",
            feedback:
              "Two distant implants need a baseline area of about 6 cm²; at 4.8 cm² this plan risks creating mitral stenosis. Start with one central device and reassess.",
            stateDelta: { stability: -10, flags: ["stenosis-risk"] },
          },
          {
            text: "A short-arm implant, because short arms are always safer for the leaflets",
            acceptable: true,
            feedback:
              "Short arms suit leaflets under 9 mm and commissural lesions. With an 11 mm mobile leaflet and a flail, long arms are more likely to reduce the MR; short arms may leave residual MR and invite extra devices.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "puncture",
        prompt: "The septum is aneurysmal and mobile. Where and how will you puncture?",
        info: "The coaptation point lies above the annulus because of the flail.",
        options: [
          {
            text: "Posterior and higher than usual, aiming for about 4.0–4.5 cm above the coaptation point, with RF or cautery ready for a controlled crossing",
            best: true,
            feedback:
              "Right. A floppy septum loses height while the system is steered, so Russo recommends a higher puncture, and RF or diathermy gives a more controlled, precise crossing. Hausleiter's target distance from puncture to coaptation is about 4.0–4.5 cm.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inferior and posterior, as for appendage occlusion, to keep well away from the aorta",
            feedback:
              "An inferior site leaves too little height for TEER, and a floppy septum will lose even more as you steer.",
            stateDelta: { stability: -10, flags: ["low-puncture"] },
            next: "low-height",
          },
          {
            text: "Anterior and superior, near the aortic root, for the shortest route to the valve",
            feedback:
              "An anterior site next to the aorta risks aortic puncture and gives a poor angle to the valve; mitral work needs a posterior puncture.",
            stateDelta: { stability: -20, flags: ["anterior-puncture"] },
            next: "aortic-trace",
          },
        ],
      },
      {
        id: "low-height",
        kind: "consequence",
        prompt: "The guide is in the atrium, but even with full flexion the implant cannot be brought above the valve with room to align; the four-chamber view shows about 2.5 cm of height. What now?",
        options: [
          {
            text: "Rotate the guide posteriorly and ease off the flexion, which costs height; if the height is still inadequate, repuncture at a higher posterior site",
            best: true,
            feedback: "Hausleiter notes that posterior rotation of the guide gains height and that flexing it loses height, so try that first. If they do not give enough room, a new, correctly placed puncture is the fix, accepting a second septal defect to assess at the end.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Repuncture straight away at a higher posterior site and bring the system across there",
            acceptable: true,
            feedback: "A higher puncture solves the problem, but it means removing the guide and leaving a second defect; try posterior rotation of the guide first.",
            stateDelta: { stability: -2 },
          },
          {
            text: "Grasp from the low position and accept the angle",
            feedback: "A steep, low approach distorts the valve and makes insertion unreliable, the setting for single-leaflet attachment.",
            stateDelta: { stability: -10, flags: ["poor-grasp"] },
          },
        ],
      },
      {
        id: "aortic-trace",
        kind: "consequence",
        prompt: "The needle tip trace shows a systolic pressure of 125 mmHg with a dicrotic notch. Only the needle has crossed. What do you do?",
        options: [
          {
            text: "Advance the dilator to secure access, then reassess",
            feedback: "This converts a needle hole into a dilator-sized hole in the aorta, with the risk of massive haemopericardium.",
            stateDelta: { stability: -35, flags: ["aortic-dilator"] },
          },
          {
            text: "Advance nothing, withdraw nothing for now, call the surgeon and watch TOE for an effusion before planning further steps",
            best: true,
            feedback:
              "Russo's sequence. With the needle alone in the aorta there may be no consequence (Brilakis: usually tolerated if the sheath is not advanced), but the decisions are made with the surgeon, never by advancing the dilator.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "vagal",
        prompt: "After a posterior, high puncture, within a minute of crossing she has inferior ST elevation, a heart rate of 44/min, blood pressure 82/46 mmHg and sweating. TOE shows no effusion and no bubbles; the sheath has not yet been opened to the atrium.",
        variants: [{ flag: "anterior-puncture", info: "This is after the needle was withdrawn from the aorta, the surgeon reviewed, and a new posterior puncture was made." }],
        options: [
          {
            text: "Treat it as the septal vagal reflex: support the blood pressure, atropine if needed, and expect resolution in minutes; reconsider air or thrombus if it persists",
            best: true,
            feedback:
              "Right. Russo describes a Bezold–Jarisch-like reflex with inferior ST elevation and vagal signs straight after the puncture, usually settling in minutes without a troponin rise; atropine is seldom needed. Persisting changes point to air or thrombus.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Proceed to emergency pericardiocentesis",
            feedback: "There is no effusion. Draining an empty pericardium adds a complication without treating the cause.",
            stateDelta: { stability: -15, flags: ["needless-drain"] },
            next: "drain",
          },
          {
            text: "Ignore it and advance the guide into the atrium immediately",
            feedback: "Pushing on with a hypotensive, bradycardic patient before the cause is clear is unsafe; wait for the picture to declare itself.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "drain",
        kind: "consequence",
        prompt: "The drain returns no fluid and the ST elevation resolved spontaneously within four minutes. What is the lesson for the debrief?",
        options: [
          {
            text: "The drain treated the reflex and should be used again next time",
            feedback: "The reflex resolved on its own; the drain contributed only risk.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Effusion was excluded on TOE; the timing and vagal signs fitted the septal reflex, which resolves without intervention",
            best: true,
            feedback: "Match the treatment to the evidence: no effusion, no drain. The reflex is common enough to recognise.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "steer",
        prompt: "Heparin has been given for an ACT of 280 s. The guide and steerable catheter are over the valve, but in the LVOT view the open implant hugs the aortic side.",
        options: [
          {
            text: "Flex the guide to correct the aorta-hugging position, then use clockwise rotation to bring the implant posterior in the LVOT view",
            best: true,
            feedback: "Right: flexing the guide corrects an aorta-hugger; in the LVOT view clockwise rotation moves the implant posteriorly (Hausleiter).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Rotate counter-clockwise to move away from the aorta",
            feedback: "Counter-clockwise moves the implant anteriorly in the LVOT view, towards the aorta.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Enter the ventricle and grasp anyway; the arms will centre on the leaflets",
            feedback: "Grasping from a skewed position distorts the valve and risks poor insertion.",
            stateDelta: { stability: -10, flags: ["poor-grasp"] },
          },
        ],
      },
      {
        id: "assess",
        prompt: "After the grasp, colour Doppler shows mild MR; the left atrial v wave fell from 42 to 20 mmHg; the CW mean gradient is 3 mmHg. Insertion of the posterior leaflet looks shallow in one plane.",
        variants: [{ flag: "poor-grasp", info: "The grasp was made from a skewed or low approach; the imager is uncertain about the posterior leaflet in both planes." }],
        options: [
          {
            text: "Use independent gripper control to optimise the posterior leaflet, quantify insertion in both planes and planimeter the orifices before release",
            best: true,
            feedback:
              "Right. Leaflet optimisation reopens the arms with the grippers closed and lifts one gripper to check and deepen insertion; insertion should be quantified and each orifice planimetered, because the anaesthetic gradient can hide stenosis.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Release now: mild MR, a falling v wave and a 3 mmHg gradient are enough",
            feedback: "Shallow insertion of one leaflet is the setting for single-leaflet device attachment, and the gradient alone does not exclude stenosis.",
            stateDelta: { stability: -20, flags: ["slda"] },
            next: "slda",
          },
        ],
      },
      {
        id: "slda",
        kind: "consequence",
        prompt: "At the 1-month echo the MR is severe again: the implant is attached only to the anterior leaflet. What is the appropriate next step?",
        options: [
          {
            text: "Heart Team review and repeat TOE to see whether a redo TEER is feasible",
            best: true,
            feedback: "In one large registry, implant failure from SLDA or loss of insertion carried 8.2% in-hospital and 29.3% mortality at a median of 163 days; redo TEER is feasible and may be preferred in suitable primary MR anatomy.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Accept the result and continue medical therapy",
            feedback: "Severe recurrent MR deserves Heart Team review rather than acceptance.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "septum",
        prompt: "The result is good: mild MR, planimetered area 2.4 cm², gradient 3 mmHg. After the guide is withdrawn, TOE shows a 5 mm iatrogenic ASD with left-to-right flow only. What do you do?",
        options: [
          {
            text: "Leave it: it is under 8 mm with left-to-right flow; close the vein with a figure-of-eight suture or suture device",
            best: true,
            feedback: "Russo's closure indications are bidirectional or right-to-left flow, or a defect over 8 mm; neither applies, and in the randomised MITHRAS trial closing a relevant left-to-right defect a month after TEER did not improve death or heart failure admission at 12 months. Follow her closely, as patients with a defect had more heart failure admissions. Either venous closure method is acceptable.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Close it routinely with an occluder",
            acceptable: true,
            feedback: "Not indicated by Russo's criteria, and MITHRAS found no outcome benefit from closing left-to-right defects; it also adds a device that a future transseptal puncture would have to cross.",
            stateDelta: { stability: -2 },
          },
        ],
      },
    ],
    outcome:
      "The flail was treated with one long-arm implant at A2/P2. MR fell to mild with a falling left atrial v wave, a planimetered area of 2.4 cm² and a 3 mmHg gradient. She went home on day 2 in NYHA class II.",
    outcomeVariants: [
      { flag: "stenosis-risk", text: "Planning two distant implants in a 4.8 cm² valve risked iatrogenic stenosis; the second was not needed." },
      { flag: "aortic-dilator", text: "Advancing the dilator into the aorta caused a haemopericardium that needed drainage and surgical review before the procedure could continue." },
      { flag: "slda", text: "Releasing without checking insertion led to single-leaflet attachment and recurrent severe MR needing a redo procedure." },
      { flag: "needless-drain", text: "An unnecessary pericardial drain was placed for a vagal reflex that resolved on its own." },
    ],
    learningPoints: [
      "Choose the implant from the leaflet length, the gap and the valve area budget; two distant devices need about 6 cm².",
      "A floppy septum loses height: puncture higher, posterior, about 4.0–4.5 cm above coaptation, with RF ready.",
      "An arterial trace means stop: advance nothing, withdraw nothing, call the surgeon.",
      "Inferior ST elevation with vagal signs straight after crossing is usually the septal reflex; persisting changes mean embolism.",
      "In the LVOT view clockwise is posterior; flex the guide to correct an aorta-hugger.",
      "Judge the grasp by insertion, MR, left atrial pressure and planimetered area, not the anaesthetic gradient alone.",
      "Iatrogenic ASD: routine closure of a left-to-right defect did not help in MITHRAS; Russo closes for bidirectional or right-to-left flow or a defect over 8 mm.",
    ],
    refs: ["hausleiter-mitral-teer-2023", "russo-transseptal-2021", "lurz-mithras-2021", "oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "hb-mitral-tricuspid-laa-case-laao-reverse-wing",
    title: "Recurrent bleeding, a reverse chicken-wing and a short landing zone",
    trackId: "cath-handbook",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "2020 EHRA/EAPCI LAAO consensus (imaging, implantation technique, antithrombotic therapy); Fukutomi 2022 (CT-based transseptal site); Russo 2021 (transseptal technique)",
    },
    summary:
      "A patient with AF who cannot take long-term anticoagulation comes for appendage occlusion. Plan the puncture from CT, load before sizing, choose the technique for a short landing zone, deploy a lobe-and-disc device correctly, release safely and manage device-related thrombus.",
    presentation:
      "A 78-year-old man with permanent AF and previous stroke has had three admissions with transfusion-dependent bleeding from small-bowel angiodysplasia despite endoscopic treatment. Gastroenterology and haematology agree that long-term anticoagulation is contraindicated; a short course of antiplatelet therapy is acceptable. The Heart Team recommends LAAO.",
    findings: [
      "CT: reverse chicken-wing appendage with posterior bending of the proximal segment; landing zone 21 mm in diameter but only about 9 mm long before the bend",
      "CT shows good appendage opacification with no thrombus",
      "LVEF 50%; no significant valve disease",
      "Haemoglobin 104 g/L; creatinine normal",
    ],
    steps: [
      {
        id: "site",
        prompt: "Where should the transseptal puncture be placed?",
        options: [
          {
            text: "Inferior, but central or anterior in the fossa, as CT predicts for this appendage",
            best: true,
            feedback:
              "Right. Fukutomi found a reverse chicken-wing and posterior bending of the proximal appendage predicted the need for an inferior-central or inferior-anterior site; the consensus suggests mid-fossa to anterior sites for posteriorly oriented appendages.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Standard inferior-posterior, as for most appendages",
            acceptable: true,
            feedback: "Right for most appendages, but this anatomy predicts poor coaxiality from a posterior site.",
            stateDelta: { stability: -5, flags: ["non-coaxial"] },
            next: "noncoaxial",
          },
          {
            text: "Superior-posterior, as for TEER",
            feedback: "A superior TEER-type site approaches the appendage at an angle; LAAO punctures are inferior.",
            stateDelta: { stability: -10, flags: ["non-coaxial"] },
            next: "noncoaxial",
          },
        ],
      },
      {
        id: "noncoaxial",
        kind: "consequence",
        prompt: "The delivery sheath points at the appendage wall rather than down its axis, even with counter-clockwise torque. What now?",
        options: [
          {
            text: "Push the sheath harder into the appendage to straighten it",
            feedback: "Force in a thin-walled appendage risks perforation and tamponade.",
            stateDelta: { stability: -20, flags: ["effusion"] },
          },
          {
            text: "Re-puncture at an inferior, more central or anterior site that lines up with the appendage",
            best: true,
            feedback: "The consensus lists a new puncture as one way to achieve alignment; forcing an off-axis sheath risks injury and an off-axis device.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "load",
        prompt: "After crossing and heparin (ACT 290 s), the mean left atrial pressure is 8 mmHg. TOE gives a maximum landing-zone diameter of 18 mm; CT gave 21 mm.",
        options: [
          {
            text: "Size to the 18 mm TOE value because it reflects today's conditions",
            feedback: "Today's conditions are a dry appendage; sizing to them undersizes the device.",
            stateDelta: { stability: -10, flags: ["undersized"] },
            next: "unstable",
          },
          {
            text: "Give a fluid challenge (for example 500 mL with his LVEF of 50%) to bring the mean pressure above about 12 mmHg, re-measure and size from the largest valid measurement",
            best: true,
            feedback:
              "Right. The consensus advises a 250–1,000 mL challenge when the pressure is below 11–12 mmHg and relying on the largest measurement taken at the right site; CT typically reads 1–3 mm above 2D TOE and filling adds about 2 mm.",
            stateDelta: { stability: 5 },
          },
        ],
      },
      {
        id: "unstable",
        kind: "consequence",
        prompt: "The device deployed from the small size wobbles on the tug test and the lobe is barely compressed. What do you do?",
        options: [
          {
            text: "Remove it by reversing the deployment steps and implant a larger size after loading and re-measuring",
            best: true,
            feedback: "An undersized, mobile device risks embolisation; the consensus advises removing a wrongly sized device and remembers that a larger device may need a larger sheath.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Release it: the disc covers the ostium, so the seal will hold",
            feedback: "A lobe that does not anchor is the setting for embolisation, whatever the disc looks like.",
            stateDelta: { stability: -30, flags: ["embolised"] },
          },
        ],
      },
      {
        id: "technique",
        prompt: "After loading, the landing zone is 22 mm wide and still only about 9 mm long before the wing. How will you deploy the lobe-and-disc device?",
        options: [
          {
            text: "Standard deployment at the short landing zone, letting part of the lobe sit at the ostium",
            feedback: "If part of the lobe prolapses out of the ostium, too few anchors reach the wall and embolisation risk rises.",
            stateDelta: { stability: -15, flags: ["partial-lobe"] },
          },
          {
            text: "Sandwich technique: engage deeper, place the whole lobe in line with the wing, and choose a larger size than the landing zone alone suggests",
            best: true,
            feedback:
              "Right. With a landing zone shorter than about 15–20 mm, the consensus deploys the lobe deeper in the wing so the short neck lies between lobe and disc, usually with a larger device; the entire lobe must sit in the wing.",
            stateDelta: { stability: 5 },
          },
        ],
      },
      {
        id: "deploy",
        prompt: "The ball is formed deep in the wing at the planned position. What is the next movement?",
        options: [
          {
            text: "Hold the cable and pull the sheath back to open the lobe",
            feedback: "That is the plug occluder's technique; here it lets the device migrate proximally.",
            stateDelta: { stability: -10, flags: ["migrated"] },
            next: "recapture",
          },
          {
            text: "Fix the sheath and push the cable so the lobe opens laterally to a tyre shape, then pull the sheath back to open the disc",
            best: true,
            feedback: "This is the consensus sequence for the lobe-and-disc device; pushing the cable opens the lobe without advancing it.",
            stateDelta: { stability: 5 },
          },
        ],
      },
      {
        id: "recapture",
        kind: "consequence",
        prompt: "The lobe has opened partly outside the wing. The size is right. How do you recapture?",
        options: [
          {
            text: "Re-advance the sheath over the disc and part of the lobe to the lobe marker or triangle shape, keeping the anchors out of the sheath, then reposition",
            best: true,
            feedback: "Partial recapture without the anchors entering the sheath preserves the device; if anchors enter, remove and reload or use a new device.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Pull the whole device fully back into the sheath and redeploy it immediately",
            feedback: "Anchors pulled into the sheath may be damaged and can invaginate the sheath tip; the device should then be removed and reloaded, not simply redeployed.",
            stateDelta: { stability: -10, flags: ["anchor-damage"] },
          },
        ],
      },
      {
        id: "release",
        prompt: "The tug test is stable, the lobe is tyre-shaped and perpendicular, two-thirds of it lies beyond the circumflex, the disc is separated and concave, and a 2 mm leak is seen at 135° only.",
        options: [
          {
            text: "Wait a few minutes, recheck, then release by counter-clockwise rotation with slight backward tension and pull the cable into the sheath",
            best: true,
            feedback: "The shape and tug criteria are met, and the 2 mm jet is within the consensus imaging chapter's procedural target of a minimal leak under 3 mm (its lobe-and-disc section aims for no leak, so check the other planes and the disc position first). A small leak is acceptable at release but not irrelevant: later data link even small leaks to modestly more thromboembolism, so record it and image it again at 6–12 weeks. The waiting period and backward tension at release are both in the consensus.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Release at once with forward pressure on the cable to keep the disc against the ostium",
            feedback: "Forward tension at release risks catching the fabric and injuring the atrium; release with slight backward tension after a short wait.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "after",
        prompt: "What antithrombotic and imaging plan will you set?",
        options: [
          {
            text: "No antithrombotic therapy at all, because the appendage is now closed",
            feedback: "Antiplatelet and anticoagulant therapy are each associated with less device-related thrombus; a no-antithrombotic strategy is not appropriate after an endocardial device.",
            stateDelta: { stability: -15, flags: ["no-antithrombotic"] },
          },
          {
            text: "TTE before discharge; DAPT for at least 1 month or until a TOE or CT, with imaging at 6–12 weeks, then step down to one antiplatelet if the result is satisfactory",
            best: true,
            feedback: "This follows the consensus for patients who cannot take oral anticoagulation; agree the duration with gastroenterology.",
            stateDelta: { stability: 5 },
          },
          {
            text: "TTE before discharge; a single antiplatelet drug for 2–4 weeks only, agreed with gastroenterology, with TOE or CT at 6–12 weeks",
            acceptable: true,
            feedback: "Reasonable if his bleeding risk is judged extreme: the consensus accepts 2–4 weeks of antiplatelet therapy, even a single drug, agreed by an expert team, at the price of a somewhat higher thromboembolic risk. His team has said a short course of antiplatelet therapy is acceptable, so the standard regimen is preferred if tolerated.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Warfarin plus aspirin for 45 days, as in the early trials, then dual antiplatelet therapy",
            feedback: "That was the trial regimen for patients who could take anticoagulation. His contraindication to anticoagulation is the reason he is having LAAO.",
            stateDelta: { stability: -10, flags: ["bleed-risk-regimen"] },
          },
        ],
      },
      {
        id: "drt",
        prompt: "At 8 weeks, TOE shows a 5 mm mobile thrombus protruding from the atrial face of the disc. He has no symptoms and no further bleeding.",
        variants: [{ flag: "no-antithrombotic", info: "He has taken no antithrombotic drug since the implant." }],
        options: [
          {
            text: "Continue aspirin alone and re-image in a year, because anticoagulation is contraindicated",
            feedback: "A mobile protruding thrombus with a fourfold stroke risk needs time-limited anticoagulation, planned with the bleeding team, not a year of waiting.",
            stateDelta: { stability: -15 },
          },
          {
            text: "Anticoagulate (for example subcutaneous heparin) for weeks to months, agreed with gastroenterology, and re-image until the thrombus has resolved",
            best: true,
            feedback:
              "The consensus recommends anticoagulation for every device-related thrombus, symptomatic or not, until TOE or CT shows resolution; protruding mobile thrombus is the type most likely to embolise.",
            stateDelta: { stability: 5 },
          },
        ],
      },
    ],
    outcome:
      "A lobe-and-disc device was implanted by the sandwich technique through an inferior, central puncture after loading. Device-related thrombus at 8 weeks resolved on a short course of low-molecular-weight heparin planned with gastroenterology, and he continued on single antiplatelet therapy.",
    outcomeVariants: [
      { flag: "effusion", text: "Forcing an off-axis sheath caused a pericardial effusion that needed drainage." },
      { flag: "embolised", text: "The undersized device embolised and had to be snared." },
      { flag: "partial-lobe", text: "A lobe left partly outside the ostium anchored poorly and had to be repositioned." },
      { flag: "anchor-damage", text: "Anchors damaged by full recapture meant a new device was needed." },
      { flag: "no-antithrombotic", text: "Leaving him on no antithrombotic therapy preceded the device-related thrombus." },
      { flag: "bleed-risk-regimen", text: "Starting warfarin after the implant exposed him to the bleeding risk the occlusion was meant to avoid." },
    ],
    learningPoints: [
      "Plan the puncture from CT: a reverse chicken-wing or posteriorly bent neck needs an inferior but central or anterior site.",
      "Load to a mean left atrial pressure above about 12 mmHg before sizing; size from the largest valid measurement.",
      "A short landing zone calls for the sandwich technique and usually a larger device.",
      "Lobe-and-disc: ball, push the cable to open the lobe, pull the sheath for the disc.",
      "Partial recapture keeps the anchors out of the sheath; if they enter, remove and reload.",
      "No antithrombotic therapy at all is not appropriate; every device-related thrombus is anticoagulated until resolved.",
    ],
    refs: ["laao-consensus-2020", "fukutomi-laao-transseptal-2022", "russo-transseptal-2021"],
  },
];

const TS_TIP_SOURCES: SourceLoc[] = [O("ch 4: Accessing the left heart"), B("14.6")];
// Where neither manual holds a tip's technique, the location names the manual section on the route or
// the condition and says so; the technique itself comes from the tip's refs.
const ROUTE_ONLY: SourceLoc = O("ch 4: Accessing the left heart (transseptal route only; technique from the references)");
const MR_ONLY: SourceLoc = O("ch 5: Mitral regurgitation (the condition only; technique from the references)");

export const tips: LabTip[] = [
  {
    id: "structural-ts-both-groins-low",
    lab: "structural",
    when: { phase: ["access"], procedure: ["transseptal"] },
    title: "Transseptal access: right femoral vein, low and ultrasound-guided, both groins prepared",
    text: "Use the right femoral vein for its straight line to the right atrium, punctured low under ultrasound to cut retroperitoneal bleeding and arterial puncture. Prepare the left groin too, for arterial monitoring, a rescue access or the puncture itself if the right side is unsuitable.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-ts-setup",
    sources: TS_TIP_SOURCES,
    refs: ["russo-transseptal-2021", "laao-consensus-2020"],
  },
  {
    id: "structural-ts-pacing-lead-wire",
    lab: "structural",
    when: { phase: ["access"], procedure: ["transseptal"] },
    title: "Pacing leads: keep the wire posterior to them",
    text: "With pacing leads present, run the wire to the SVC posterior to them; in LAO the wire should lie to the right of the leads on the screen. Advance the sheath with its tip facing the aorta, not the caval free wall.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-ts-setup",
    sources: [ROUTE_ONLY],
    refs: ["russo-transseptal-2021"],
  },
  {
    id: "structural-ts-pulldown-orient",
    lab: "structural",
    when: { phase: ["access", "position"], procedure: ["transseptal"] },
    title: "Pull-down: arrow at 5 to 6 o'clock, arrow and side arm aligned",
    text: "Align the needle arrow with the sheath side arm and hold them as one. Start the pull-down at about 5 to 6 o'clock with noon towards the ceiling (6 for a more posterior target), expect a jump into the atrium and another into the fossa, and confirm tenting in the bicaval view before moving to short-axis and four-chamber.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-ts-setup",
    sources: [ROUTE_ONLY],
    refs: ["russo-transseptal-2021", "laao-consensus-2020"],
  },
  {
    id: "structural-ts-two-movements",
    lab: "structural",
    when: { phase: ["position"], procedure: ["transseptal"] },
    title: "Move the tent with two movements, not one",
    text: "Rotation alone spins the sheath without moving the contact point. To move posteriorly from an anterior tent, turn clockwise and pull back slightly together; clockwise also gains height, counter-clockwise moves towards the mitral plane.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-ts-setup",
    sources: [ROUTE_ONLY],
    refs: ["russo-transseptal-2021", "laao-consensus-2020"],
  },
  {
    id: "structural-ts-four-confirmations",
    lab: "structural",
    when: { phase: ["position", "access"], procedure: ["transseptal"] },
    title: "Four confirmations before the dilator moves",
    text: "Before advancing the dilator, confirm the needle is in the left atrium on TOE, by aspirating blood, by a left atrial pressure trace (v wave slightly taller than a) and by a contrast puff. No trace, or an arterial trace, means do not advance.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [O("ch 4: Left heart pressures and waveforms"), O("ch 4: Right heart pressures and waveforms"), B("14.6")],
    refs: ["oxford-cath-handbook", "russo-transseptal-2021", "laao-consensus-2020"],
  },
  {
    id: "structural-ts-heparin-after-crossing",
    lab: "structural",
    when: { phase: ["position"], event: ["low-act"], procedure: ["transseptal"] },
    title: "Anticoagulate as soon as the atrium is entered",
    text: "Give heparin on entering the left atrium (typically 70–100 U/kg, to an ACT of at least 250 s; 250–300 s in Russo's practice) and reach the target quickly: the left atrium is low-flow and the equipment thrombogenic. Follow local protocol.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [B("14.6")],
    refs: ["brilakis-manual-pci", "russo-transseptal-2021", "laao-consensus-2020"],
  },
  {
    id: "structural-ts-air-hub-low",
    lab: "structural",
    when: { phase: ["position", "access"], event: ["air"], procedure: ["transseptal"] },
    title: "Needle and dilator out: thumb on the hub, hub low, aspirate",
    text: "As the needle comes out, cover the hub and hold it low, especially if the left atrial pressure is low; aspirate slowly as the dilator is withdrawn, then aspirate and flush the sheath. Air enters an open sheath held above a low-pressure atrium.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [B("14.6")],
    refs: ["laao-consensus-2020", "brilakis-manual-pci"],
  },
  {
    id: "structural-ts-resistant-wire-first",
    lab: "structural",
    when: { phase: ["position"], procedure: ["transseptal"] },
    title: "Sheath will not cross: protect the back wall first",
    text: "Try mild forward pressure with a slight turn. Before escalating to a stiffer wire or a 4 mm balloon, park a J wire deep in a pulmonary vein or a large pigtail-tip wire in the atrium or ventricle, so a sudden jump through the septum cannot drive the dilator into the posterior wall.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-ts-aortic-puncture-hold",
    lab: "structural",
    when: { phase: ["position", "complication"], procedure: ["transseptal"] },
    title: "Aortic trace: advance nothing, withdraw nothing, call the surgeon",
    text: "If the needle trace or contrast shows the aorta, do not advance the dilator or sheath, and once it is confirmed do not pull anything back; call the surgeon and exclude tamponade if the patient becomes unstable. A needle-only puncture is usually tolerated; a sheath in the aorta can cause massive haemopericardium.",
    tone: "bailout",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [B("14.6")],
    refs: ["russo-transseptal-2021", "brilakis-manual-pci"],
  },
  {
    id: "structural-ts-vagal-st",
    lab: "structural",
    when: { phase: ["complication", "position"], event: ["st-elevation", "bradycardia"], procedure: ["transseptal"] },
    title: "Inferior ST elevation just after crossing: think septal reflex first",
    text: "Inferior ST elevation with hypotension, bradycardia and sweating straight after the puncture is usually a Bezold–Jarisch-like reflex that settles within minutes; atropine is seldom needed. If it persists, treat it as air or thrombus embolism.",
    tone: "bailout",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [ROUTE_ONLY],
    refs: ["russo-transseptal-2021"],
  },
  {
    id: "structural-ts-posterior-delayed-tamponade",
    lab: "structural",
    when: { phase: ["complication", "assess"], event: ["hypotension"], procedure: ["transseptal"] },
    title: "Posterior puncture: watch for delayed tamponade",
    text: "A puncture at the edge of the fossa can cross the pericardial space and bleed only after the catheters come out. Leave a wire across the septum for a few minutes after removing the left atrial catheters and watch pressure, ECG and TOE; drain a tamponade first, then close the breach with an occluder.",
    tone: "bailout",
    lessonId: "hb-mitral-tricuspid-laa-ts-cross",
    sources: [ROUTE_ONLY],
    refs: ["russo-transseptal-2021"],
  },
  {
    id: "structural-teer-area-budget",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["teer"] },
    title: "TEER: budget the valve area before choosing the implant",
    text: "Measure the 3D valve area first. Implants remove about half of it, most at A2/P2; two distant devices need a baseline of about 6 cm², and an area under 4 cm² or a baseline gradient of 4 mmHg or more predicts a final gradient of 5 mmHg or more.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-select",
    sources: [MR_ONLY],
    refs: ["hausleiter-mitral-teer-2023"],
  },
  {
    id: "structural-teer-height-coaptation",
    lab: "structural",
    when: { phase: ["access", "position"], procedure: ["teer"] },
    title: "TEER puncture: about 4.0–4.5 cm above the coaptation point",
    text: "Aim for about 4.0–4.5 cm from the puncture to the coaptation point, remembering the coaptation line lies lower in secondary than primary MR. Posterior rotation of needle and sheath gains height; a floppy septum loses height while steering, so puncture higher.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [ROUTE_ONLY],
    refs: ["hausleiter-mitral-teer-2023", "russo-transseptal-2021"],
  },
  {
    id: "structural-teer-gantry-arms",
    lab: "structural",
    when: { phase: ["position"], procedure: ["teer"] },
    title: "Turn the C-arm until the implant arms overlap",
    text: "Once 3D echo shows the arms perpendicular to the coaptation line, rotate the C-arm until the two arms superimpose and seem to disappear. Fluoroscopy then shows any rotation during grasping.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [MR_ONLY],
    refs: ["hausleiter-mitral-teer-2023"],
  },
  {
    id: "structural-teer-steer-views",
    lab: "structural",
    when: { phase: ["position"], procedure: ["teer"] },
    title: "Steering: push, pull and flex for medial–lateral; rotation for anterior–posterior",
    text: "In the intercommissural view, push, pull or flex the steerable catheter to move medially or laterally. In the LVOT view, clockwise rotation moves the implant posteriorly and counter-clockwise anteriorly; flex the guide to correct an aorta-hugging position.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [MR_ONLY],
    refs: ["hausleiter-mitral-teer-2023"],
  },
  {
    id: "structural-teer-planimetry",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["teer"] },
    title: "Do not trust the anaesthetic gradient alone: planimeter",
    text: "Under general anaesthesia, the continuous-wave gradient depends on flow, heart rate and filling and can hide stenosis. Planimeter each new orifice (3D, or transgastric short-axis); avoid a final area under 1.5 cm² and weigh a gradient above 5 mmHg against the MR you have removed.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [O("ch 5: Mitral stenosis"), O("ch 5: Mitral regurgitation")],
    refs: ["hausleiter-mitral-teer-2023", "oxford-cath-handbook"],
  },
  {
    id: "structural-teer-la-vwave",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["teer"] },
    title: "Watch the left atrial v wave at every grasp",
    text: "Read the left atrial pressure and v wave through the guide before and after each grasp; invasive pressure may judge MR reduction better than colour Doppler in complex valves. Expect a smaller fall in secondary MR, where filling is also impaired.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [O("ch 5: Mitral regurgitation"), O("ch 4: Left heart pressures and waveforms")],
    refs: ["hausleiter-mitral-teer-2023", "oxford-cath-handbook"],
  },
  {
    id: "structural-teer-second-device",
    lab: "structural",
    when: { phase: ["deploy", "assess"], procedure: ["teer"] },
    title: "Second implant: first medial, then lateral, only if the area allows",
    text: "Consider a second implant from the residual MR and the gradient, especially for a large flail or prolapse in primary MR. The first usually sits more medial and the second lateral to it; recheck the planimetered area before adding one.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
    sources: [MR_ONLY],
    refs: ["hausleiter-mitral-teer-2023"],
  },
  {
    id: "structural-tteer-diurese-first",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tteer"] },
    title: "Tricuspid: treat the cause, diurese, and read the gap",
    text: "Before tricuspid intervention, treat AF, heart failure or pulmonary hypertension and re-image; a course of intravenous diuretics can shrink the annulus and gaps. A coaptation gap over 7–10 mm and a jet outside the anteroseptal commissure predicted TEER failure.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-tricuspid",
    sources: [O("ch 5: Tricuspid valve (the condition only; technique from the references)")],
    refs: ["praz-tricuspid-2021"],
  },
  {
    id: "structural-laao-fill-before-sizing",
    lab: "structural",
    when: { phase: ["plan", "assess"], procedure: ["laao"] },
    title: "Fill the atrium before you measure the appendage",
    text: "If the mean left atrial pressure is below 11–12 mmHg, give a fluid challenge (250–1,000 mL, according to LV function and heart failure history) and measure with the pressure above 12 mmHg. A dry appendage measures small and leads to undersizing, embolisation and leaks.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-laao-plan",
    sources: [O("ch 4: Left heart pressures and waveforms (pressure measurement only; fluid challenge from the references)")],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-largest-measurement",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["laao"] },
    title: "Size from the largest valid measurement",
    text: "Expect CT to read 1–3 mm above 2D TOE, and 2–4 mm above fluoroscopy. Measure every plane, use the device family's measurement site, and rely on the largest measurement made at the right place on good images.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-laao-plan",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-puncture-from-ct",
    lab: "structural",
    when: { phase: ["plan", "access"], procedure: ["laao"] },
    title: "LAAO puncture: inferior, and choose posterior or central from the CT",
    text: "Inferior-posterior suits most appendages. A reverse chicken-wing or a posteriorly bent proximal appendage needs an inferior but central or anterior site, which applied to 20–25% of patients in one CT study.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-laao-plan",
    sources: [ROUTE_ONLY],
    refs: ["fukutomi-laao-transseptal-2022", "laao-consensus-2020"],
  },
  {
    id: "structural-laao-pigtail-leads",
    lab: "structural",
    when: { phase: ["position"], procedure: ["laao"] },
    title: "Plug occluder: let the pigtail lead the sheath, and leave it in",
    text: "Steer a marker pigtail into the deepest lobe and advance the access sheath over it, keeping the distal marker (5 mm behind the tip) at least 5 mm from the wall. Leave the pigtail in until the device is ready so the sheath cannot slide deeper.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-plug-unsheathe",
    lab: "structural",
    when: { phase: ["deploy"], procedure: ["laao"] },
    title: "Plug occluder: hold the cable, withdraw the sheath slowly",
    text: "Deploy the plug occluder by holding the cable still and withdrawing the sheath and catheter very slowly, with ventilation held. Do not push; once it begins to open, keep only slight forward tension so it does not migrate into the atrium.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-plug-pass",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["laao"] },
    title: "Plug occluder release: PASS in every plane",
    text: "Position: more than half the device beyond the ostium. Anchor: device and appendage move together on a tug. Size: at least 8% compression of the shoulder in every TOE plane for the device the consensus describes (check the instructions for newer ones). Seal: no relevant leak, and any leak under 3 mm, in all four planes.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-disc-ball-push",
    lab: "structural",
    when: { phase: ["deploy"], procedure: ["laao"] },
    title: "Lobe-and-disc: ball, then push the cable to open the lobe",
    text: "Pull the sheath until the lobe forms a ball and move the ball into the landing zone. Then fix the sheath and push the cable so the lobe opens to a tyre; holding the cable and pulling the sheath lets the device slip towards the atrium. Pull the sheath only to open the disc.",
    tone: "do",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-disc-criteria",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["laao"] },
    title: "Lobe-and-disc release: four shapes, four planes, a short wait",
    text: "After the tug, check a tyre-shaped lobe perpendicular to the landing zone, at least half to two-thirds of it beyond the circumflex artery, separation between lobe and disc, and a concave disc; look for leaks at 0°, 45°, 90° and 135° (the consensus releases this device with no leak), then wait a few minutes before releasing with slight backward tension.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-anchors-in-sheath",
    lab: "structural",
    when: { phase: ["complication", "deploy"], procedure: ["laao"] },
    title: "Recapture: keep the anchors out of the sheath",
    text: "To reposition a correctly sized lobe-and-disc device, re-sheath only to the lobe marker or triangle shape. If the anchors have entered the sheath, remove and reload the device or use a new one; if the sheath tip has invaginated, restore it over a wire and dilator first.",
    tone: "bailout",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
  {
    id: "structural-laao-drt-anticoagulate",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["laao"] },
    title: "Device-related thrombus: anticoagulate until it has gone",
    text: "Anticoagulate every device-related thrombus, with or without symptoms, for weeks to months until TOE or CT shows it has resolved. Plan at least 2–4 weeks of antiplatelet therapy after any endocardial device; no antithrombotic at all is not appropriate.",
    tone: "caution",
    lessonId: "hb-mitral-tricuspid-laa-laao-implant",
    sources: [ROUTE_ONLY],
    refs: ["laao-consensus-2020"],
  },
];

export const refs: Reference[] = [
  {
    id: "russo-transseptal-2021",
    kind: "paper",
    citation: "Russo G, Taramasso M, Maisano F. Transseptal puncture: procedural guidance, challenging situations and management of complications. EuroIntervention. 2021;17:720–727.",
    url: "https://doi.org/10.4244/EIJ-D-20-00454",
    note: "PMID: 33775929; PMC9724844. Authors, title, journal, year, volume (17, issue 9) and pages checked on PubMed; full text read on the publisher's open-access page.",
    verified: true,
  },
  {
    id: "hausleiter-mitral-teer-2023",
    kind: "paper",
    citation: "Hausleiter J, Stocker TJ, Adamo M, Karam N, Swaans MJ, Praz F. Mitral valve transcatheter edge-to-edge repair. EuroIntervention. 2023;18:957–976.",
    url: "https://doi.org/10.4244/EIJ-D-22-00725",
    note: "PMID: 36688459; PMC9869401. Authors, title, journal, year, volume (18, issue 12) and pages checked on PubMed; full text read on the publisher's open-access page.",
    verified: true,
  },
  {
    id: "praz-tricuspid-2021",
    kind: "paper",
    citation: "Praz F, Muraru D, Kreidel F, et al. Transcatheter treatment for tricuspid valve disease. EuroIntervention. 2021;17:791–808.",
    url: "https://doi.org/10.4244/EIJ-D-21-00695",
    note: "PMID: 34796878; PMC9724890. Authors, title, journal, year, volume (17, issue 10) and pages checked on PubMed; full text read on the publisher's open-access page.",
    verified: true,
  },
  {
    id: "fukutomi-laao-transseptal-2022",
    kind: "paper",
    citation: "Fukutomi M, Fuchs A, Bieliauskas G, et al. Computed tomography-based selection of transseptal puncture site for percutaneous left atrial appendage closure. EuroIntervention. 2022;17:e1435–e1444.",
    url: "https://doi.org/10.4244/EIJ-D-21-00555",
    note: "PMID: 34483092; PMC9900448. Authors, title, journal, year, volume (17, issue 17) and pages checked on PubMed; abstract and results read.",
    verified: true,
  },
  {
    id: "lakkireddy-amulet-ide-2021",
    kind: "trial",
    citation: "Lakkireddy D, Thaler D, Ellis CR, et al. Amplatzer Amulet left atrial appendage occluder versus Watchman device for stroke prophylaxis (Amulet IDE): a randomized, controlled trial. Circulation. 2021;144:1543–1552.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.121.057063",
    note: "PMID: 34459659; PMC8570346. Authors, title, journal, year, volume (144, issue 19) and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "katsiampoura-pitloc-2022",
    kind: "paper",
    citation: "Katsiampoura A, Mufarrih SH, Sharkey A, et al. A sequential approach for echocardiographic guidance of transseptal puncture: the PITLOC protocol. J Cardiothorac Vasc Anesth. 2022;36:3257–3264.",
    url: "https://doi.org/10.1053/j.jvca.2021.12.025",
    note: "PMID: 35153136. Authors, title, journal, year, volume (36, issue 8 Pt B) and pages checked on PubMed; abstract read (cited only for the protocol's six stages).",
    verified: true,
  },
  {
    id: "lo-russo-transseptal-occluder-2025",
    kind: "paper",
    citation: "Lo Russo G, Nerla R, Sanseviero A, et al. Breaking the barriers: transseptal puncture in patients with atrial septal defect closure devices. Interv Cardiol. 2025;20:e33.",
    url: "https://doi.org/10.15420/icr.2025.08",
    note: "PMID: 41450850; PMC12728519. Authors, title, journal, year, volume (20) and article number checked on PubMed; abstract read (cited only for planning with TOE and CT, native-septum or through-device puncture, balloon-assisted tracking and RF, residual shunt and device deformation).",
    verified: true,
  },
  {
    id: "dukkipati-pdl-2022",
    kind: "paper",
    citation: "Dukkipati SR, Holmes DR, Doshi SK, et al. Impact of peridevice leak on 5-year outcomes after left atrial appendage closure. J Am Coll Cardiol. 2022;80:469–483.",
    url: "https://doi.org/10.1016/j.jacc.2022.04.062",
    note: "PMID: 35902169. Authors, title, journal, year, volume (80, issue 5) and pages checked on PubMed; abstract read (pooled PROTECT AF, PREVAIL and CAP2; leak of 5 mm or less at 1 year and 5-year ischaemic stroke or systemic embolism, adjusted HR 1.94).",
    verified: true,
  },
  {
    id: "alkhouli-ncdr-leak-2022",
    kind: "paper",
    citation: "Alkhouli M, Du C, Killu A, et al. Clinical impact of residual leaks following left atrial appendage occlusion: insights from the NCDR LAAO Registry. JACC Clin Electrophysiol. 2022;8:766–778.",
    url: "https://doi.org/10.1016/j.jacep.2022.03.001",
    note: "PMID: 35387751; PMC9233062. Authors, title, journal, year, volume (8, issue 6) and pages checked on PubMed; abstract read (51,333 patients; small leaks over 0 to 5 mm and stroke, TIA or systemic embolism, adjusted HR 1.152; major bleeding).",
    verified: true,
  },
  {
    id: "lurz-mithras-2021",
    kind: "trial",
    citation: "Lurz P, Unterhuber M, Rommel KP, et al. Iatrogenic atrial septal defects following transcatheter mitral valve repair and implications of interventional closure. JACC Cardiovasc Interv. 2021;14:2685–2694.",
    url: "https://doi.org/10.1016/j.jcin.2021.09.023",
    note: "PMID: 34949392. Authors, title, journal, year, volume (14, issue 24) and pages checked on PubMed; abstract read (MITHRAS: 80 patients with iASD and Qp:Qs at least 1.3 at 30 days after TEER, closure vs conservative; death or HF hospitalisation at 12 months 35% vs 50%, P = 0.26).",
    verified: true,
  },
  {
    id: "adamo-vhd-update-2026",
    kind: "paper",
    citation: "Adamo M, Massussi M, Ajmone Marsan N, Borger MA, Praz F, Metra M. 2025 ESC/EACTS valvular heart disease guidelines: practical updates on mitral and tricuspid regurgitation. Eur Heart J Suppl. 2026;28(Suppl 4):iv83–iv96.",
    url: "https://doi.org/10.1093/eurheartjsupp/suag001",
    note: "PMID: 42064867; PMC13128274. Authors, title, journal, year, volume, supplement and pages checked on PubMed; full text read on PMC (summary by members of the 2025 task force; used for the 2025 classes, secondary MR thresholds, the anatomical TEER scale, the five-grade TR scale and the right heart catheterisation requirement).",
    verified: true,
  },
];
