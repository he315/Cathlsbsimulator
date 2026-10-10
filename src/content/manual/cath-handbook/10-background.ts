// Module hb-background: background for the lab: anatomy, disease and beyond the coronaries (manual curriculum, track
// cath-handbook).
// Neither manual has a chapter on these topics, so the module gathers the related passages from both books and adds
// PubMed-checked references for what the books do not cover or no longer state correctly:
//   Oxford Handbook of Cardiac Catheterization and Coronary Intervention: ch 1 (indications for cardiac catheterization and
//   coronary angiography; patient preparation), ch 3 (which arterial access route to use; anticoagulation issues), ch 4
//   (accessing the left and right heart; ventriculography; aortography), ch 5 (cardiomyopathy; MINOCA), ch 6 (coronary
//   anatomy; catheter manipulation; imaging the coronaries; quantification of stenoses; tips for interpretation), ch 7
//   (types of operation; procedure; saphenous vein grafts; arterial grafts), ch 8 (restenosis; optical coherence
//   tomography; PCI in acute myocardial infarction), ch 9 (pericardiocentesis; temporary pacemaker), ch 10 (risks;
//   death; myocardial infarction; pulmonary oedema; stroke; arrhythmia; limb ischaemia; cholesterol embolization).
//   Brilakis, Manual of PCI: 1.1, 1.4 (planning), 2.6, 2.7 (monitoring), 4.1, 4.2 (access), 5.2, 5.7 (to the root and
//   engagement), 7.1, 7.2 (selecting target lesions), 10.2 (stent choice and surgery), 13.1, 13.3 (intravascular imaging),
//   14.2 (support devices), 20.11, 20.13 (ACS), 24.2 (shock), 25.2 (embolisation) and 29.1 (femoral complications).
// New references (PubMed-checked) are in `refs` below; the fifth universal definition of MI (mills-5udmi-2026) was re-read
// in full text for this module.
// Every claim is listed with its page in docs/curriculum/evidence/hb-background.md.
// Neighbouring modules (named in the lessons for the rest of each topic): hb-cardiac-catheterisation (doing the
// ventriculogram, aortogram and right heart study), hb-additional-procedures (pacing, pericardiocentesis), pm-engaging
// (catheter rotation in practice), cp-prior-cabg (graft angiography and PCI), pm-imaging (IVUS and OCT step by step),
// cp-acs-thrombus (MINOCA worked through, primary PCI), cm-principles-closure (procedure-related MI), pm-planning and
// pm-target (assessment, preparation, indications), pm-antithrombotics (anticoagulated patients), pm-to-the-root (iliac
// and aortic obstacles), cm-access-complications (limb ischaemia).
// Academy lessons this module builds on: fnd-heart-position, fnd-heart-chambers, fnd-cor-left, fnd-cor-right,
// fnd-phys-flow, fnd-phys-athero, fnd-phys-mi.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OXFORD = ["oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "hb-background",
  title: "Background for the lab: anatomy, disease and beyond the coronaries",
  stage: 1,
  summary:
    "The background the manuals assume you already have, taught from the lab's point of view: how catheters and leads outline the chambers and valve planes, how to read front and back on a flat image, what the angiogram shows and hides of atherosclerosis, how myocardial infarction is now classified, which general-cardiology problems change a procedure, and what a coronary operator needs to know about peripheral, aortic and venous disease.",
  objectives: [
    "Use the pigtail, the right heart catheter, the pacing wire and the ventriculogram to locate the aortic root, LV cavity, right heart chambers and coronary sinus on fluoroscopy, and map each LV wall to the artery that supplies it.",
    "Name a projection from the spine, identify the circumflex as the left coronary branch nearest the spine, and use grafts, leads and a second view to judge whether a structure or catheter tip lies anteriorly or posteriorly.",
    "Explain why angiography misjudges plaque, describe the OCT appearances of fibrous, calcific and lipid-rich plaque and of thrombus, and contrast plaque rupture, erosion and calcified nodule as ACS mechanisms.",
    "Classify myocardial infarction with the fifth universal definition (2026: primary, secondary and procedure-related), say how it differs from the fourth (2018), and apply it to referrals for a troponin rise.",
    "Screen a patient before the lab for the general-cardiology problems that change the procedure: heart failure, arrhythmia and anticoagulation, valve disease, kidneys and diabetes, planned surgery, and the conditions that mimic infarction.",
    "Recognise peripheral, aortic and venous disease that alters access and device choice (absent pulses, peripheral grafts, aortic aneurysm, coarctation, subclavian stenosis), and know where peripheral intervention is taught outside this curriculum.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-background-silhouette",
      title: "Chambers and valve planes on the screen: what each catheter outlines",
      minutes: 14,
      topics: ["fnd-heart-fluoro-anatomy"],
      sources: [
        O("ch 4: Accessing the left heart"),
        O("ch 4: Accessing the right heart"),
        O("ch 4: Ventriculography"),
        O("ch 4: Aortography"),
        O("ch 6: Coronary anatomy"),
        O("ch 9: Pericardiocentesis"),
        O("ch 9: Temporary pacemaker"),
        O("ch 3: Anticoagulation issues"),
        O("ch 10: Arrhythmia"),
      ],
      refs: OXFORD,
      blocks: [
        {
          kind: "p",
          text: "On plain fluoroscopy the heart is a grey shadow; its chambers and valves appear only when a catheter, a wire or contrast traces them. Each device you place is therefore a landmark. The pigtail marks the aortic root and the LV cavity, a right heart catheter follows the right atrium, right ventricle and pulmonary artery, and a pacing wire marks the RV apex. This lesson assembles the chambers and valve planes from those landmarks so that you can say where a tip lies on any view. It builds on fnd-heart-position and fnd-heart-chambers (the silhouette and the chambers themselves); hb-cardiac-catheterisation teaches how to perform each study.",
        },
        {
          kind: "steps",
          title: "Tracing the left heart with one pigtail",
          items: [
            {
              title: "1. Above the valve: the aortic root",
              detail:
                "Carried over the wire into the ascending aorta, the pigtail is brought down until it sits just above the aortic valve. For an aortogram it must stay clear of the leaflets so that it neither holds them open nor stops them closing. Oxford films the aortogram in an LAO projection, where it shows the origins of the left and right coronary arteries and any regurgitant jet back into the LV; to find bypass grafts the tip sits a little higher and the run is filmed for longer.",
            },
            {
              title: "2. Across the valve",
              detail:
                "In an AP or RAO view, push the catheter so that its end bends into a shallow U against the valve; gentle forward pressure then usually drops it into the LV. If it will not cross, Oxford's first step is to check the notes for significant aortic stenosis. After that its sequence is: put the wire back inside the catheter to stiffen it; if that fails, lead with the wire itself, using the catheter tip to aim it; switch to a JR4 or an Amplatz left curve to point the wire better; try a straight-tipped or hydrophilic wire. Once the wire is across, follow it with the catheter, take the wire out and connect the pressure line; if a ventriculogram is planned, exchange over a long wire for a pigtail. hb-cardiac-catheterisation teaches the crossing in full.",
            },
            {
              title: "3. Inside the cavity",
              detail:
                "Aim for the middle of the cavity. Near the apex the tip provokes ectopics; near the mitral valve it can tangle in the valve apparatus, and pigtails in particular catch in the papillary muscles (a gentle turn either way with slight withdrawal frees them). Confirm a ventricular pressure trace and note the LVEDP before anything else.",
            },
            {
              title: "4. RAO 30°: the long side of the ventricle",
              detail:
                "In Oxford's RAO schematic the aorta leaves at the upper left, the anterior wall forms the upper border, the apex points down and to the right, and the inferior wall forms the lower border. This view therefore shows the anterior, apical and inferior walls; panning towards the left atrium in the same view shows mitral regurgitation.",
            },
            {
              title: "5. LAO 60° with 20° cranial: across the septum",
              detail:
                "Here the aorta sits at the top, the septum forms the left-hand border of the image and the posterolateral wall the right-hand border. This is the view for the septal and posterolateral walls and for localising a ventricular septal defect. A biplane system can film both views from one injection, at the cost of more dose and set-up time.",
            },
            {
              title: "6. Reading what you see",
              detail:
                "Global function is graded by eye as normal or mildly, moderately or severely impaired; software can calculate the ejection fraction as (EDV − ESV) / EDV. Each segment is called normal, hypokinetic (reduced), akinetic (absent) or dyskinetic (moving outwards in systole). A filling defect (an area that does not opacify), usually at the apex in a poorly contracting or aneurysmal ventricle, suggests thrombus; thrombus may also be laminar.",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "**When to think twice about a ventriculogram (Oxford's relative contraindications):** aortic stenosis that is critical; left main disease that is severe, because of the risk of hypotension; an LVEDP above 35 mmHg; pulmonary oedema; LV systolic hypertension; and LV thrombus. Where a laminar apical thrombus is known, Oxford advises not passing catheters into the LV at all.",
            "**What can go wrong:** ventricular arrhythmias (VT or VF), embolism of air or thrombus, contrast reactions and contrast nephropathy, injection into the myocardium (usually harmless, though tamponade can follow) and the complications of the access site.",
            "**At the injection:** do not fire contrast straight into an LV aneurysm; if you are unsure where the tip lies, give a 10 mL test injection by hand first.",
          ],
        },
        {
          kind: "table",
          caption: "LV walls on the ventriculogram and the arteries behind them (built from Oxford ch 4 and ch 6)",
          head: ["Wall", "Best seen in", "Usual supply", "What to remember"],
          rows: [
            ["Anterior", "RAO 30°", "LAD; its diagonal branches supply the anterolateral wall", "The LAD runs in the interventricular groove"],
            ["Apex", "RAO 30°", "The terminal LAD", "The LAD often wraps round the apex onto part of the inferior wall"],
            ["Inferior", "RAO 30°", "The posterior descending artery (PDA), plus a wrapping LAD", "The PDA comes from the RCA in 85%, the circumflex in 8%; 7% are co-dominant"],
            ["Septum", "LAO 60° cranial 20°", "LAD septal branches (anterior two-thirds); PDA (inferior third)", "The septals also supply the left bundle"],
            ["Posterolateral", "LAO 60° cranial 20°", "Circumflex (posterior wall) and its obtuse marginals (lateral wall)", "The circumflex runs in the left atrioventricular groove"],
          ],
        },
        { kind: "tip", id: "diag-lv-gram-views" },
        { kind: "tip", id: "diag-bg-wall-to-territory" },
        {
          kind: "check",
          stem: "An RAO 30° ventriculogram shows an akinetic apex and an akinetic distal third of the inferior wall; the basal inferior wall contracts normally. The RCA is dominant and smooth. Which artery is the most likely culprit?",
          options: [
            "The RCA, because the inferior wall is involved and the RCA supplies the PDA in most patients",
            "The first obtuse marginal branch of the circumflex",
            "A diagonal branch, because diagonals supply the apex and the inferior wall",
            "A long LAD that wraps round the apex onto the inferior wall",
          ],
          answer: 3,
          explanation:
            "The terminal LAD supplies the apex and often wraps round to supply part of the inferior wall, so an apical defect that runs onto the distal inferior wall, with a normal basal inferior segment and a normal dominant RCA, points to the LAD. The RCA answer is tempting because the PDA supplies the inferior wall in most people, but a PDA lesion would not spare the base while taking the apex. Diagonals supply the anterolateral wall, and obtuse marginals the lateral wall, not the apex.",
        },
        {
          kind: "steps",
          title: "Tracing the right heart from the femoral vein",
          items: [
            {
              title: "1. Up the inferior vena cava into the right atrium",
              detail:
                "Reaching the right atrium is usually easy from either cava. From the femoral vein the tip can lodge in a venous side branch; withdraw a little and rotate under screening until it runs free.",
            },
            {
              title: "2. Through the tricuspid valve",
              detail:
                "Sometimes the catheter crosses directly. Often it needs a loop formed in the atrium that then prolapses through the valve, the same manoeuvre used for pacing wires, where the loop is usually made with the tip against the right lateral border of the atrium. A wire inside the catheter stiffens it and helps steering. Ectopics announce arrival in the ventricle.",
            },
            {
              title: "3. The RV apex",
              detail:
                "On an AP view the RV apex sits a little medial to the apex of the heart's outline. A pacing wire in its final position curves like a sock: the heel in the right atrium, the toe at the RV apex.",
            },
            {
              title: "4. Out to the pulmonary artery",
              detail:
                "Pull back slightly off the apex, turn the tip to point towards the head and advance into the main pulmonary artery; a deep breath helps. Gentle rotation and advance select the right or left branch, and the catheter is advanced during inspiration until gentle resistance gives a wedge trace.",
            },
            {
              title: "5. The wrong turn: the coronary sinus",
              detail:
                "The coronary sinus opens just above the tricuspid valve. A wire in it sits higher than expected on the AP view and runs posteriorly on a lateral view, whereas a wire in the RV heads anteriorly.",
            },
            {
              title: "6. Outside the heart: the pericardial space",
              detail:
                "During pericardiocentesis, Oxford advances the guidewire until it loops within the cardiac shadow on screening, or is seen in the pericardial space on echo, before the needle comes out and the dilator goes in; with echo, agitated saline through the needle can confirm that its tip is in the pericardial space. A wire that has entered the right ventricle also lies inside the cardiac shadow, so the Academy lesson bed-pericardiocentesis sharpens the X-ray sign: the wire should curl round the heart along its border, outside the chambers, and must not run into the RV outflow tract or the pulmonary artery. Settle this before any dilator follows (hb-additional-procedures teaches the procedure).",
            },
          ],
        },
        { kind: "tip", id: "bed-pace-coronary-sinus" },
        {
          kind: "check",
          stem: "During a right heart study from the femoral vein, the catheter reaches the right atrium easily but keeps flicking up the superior vena cava instead of crossing the tricuspid valve. What do both the right heart and the pacing sections of Oxford recommend?",
          options: [
            "Curl the catheter into a loop inside the atrium and let the loop prolapse across the tricuspid valve",
            "Exchange for a stiffer catheter and push it straight through the valve on the AP view, ignoring the ectopics it provokes",
            "Inject contrast in the right atrium to outline the valve before every further attempt",
            "Switch to the internal jugular vein, because the valve cannot be crossed from below",
          ],
          answer: 0,
          explanation:
            "Oxford describes the same move for both: a loop formed in the atrium (for pacing wires, made with the tip resting against the atrium's right lateral wall) prolapses through the tricuspid valve, helped if needed by a soft J wire inside the catheter to stiffen it. Brute force with a stiffer catheter risks arrhythmia and injury, and the femoral route is the usual one, not a reason to change access.",
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the pigtail at the apex or in the papillary muscles: ectopics spoil the run and the tip can injure the wall. Mid-cavity is the target.",
            "Reading an apical and distal inferior defect as RCA disease and forgetting the LAD that wraps round the apex.",
            "Accepting a pacing or right heart position on the AP view alone; the coronary sinus can look plausible until a lateral view shows the tip running backwards.",
            "Dismissing an apical filling defect in a poor ventricle as streaming: it may be thrombus, and the catheter can dislodge it, so take particular care when an aneurysm is suspected. A known LV thrombus is itself a relative contraindication to ventriculography.",
            "Positioning an aortogram pigtail where it interferes with the leaflets, which distorts the regurgitation you are trying to grade.",
            "Working the catheter hard or for a long time in the right ventricle: it provokes ventricular arrhythmias (VT particularly from the RV outflow tract) and can tie the catheter in a knot. If a knot is suspected, stop, call for expert help and do not pull it tight; Oxford's sequence is to try to undo it by advancing the wire, and only if that fails to pull the knot small, bring it back to the sheath and remove everything together (bleeding and vessel repair may follow; snares and forceps are alternatives).",
            "Calling a wire looped inside the cardiac shadow pericardial without checking its course: a wire in the RV lies inside the shadow too.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford's view of ventriculography belongs here: a good echo already answers the questions a routine ventriculogram asks, and adds to them, while sparing the patient contrast and radiation. The anatomy in this lesson is still needed, because it tells you where every catheter tip is.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, cross the aortic valve with the pigtail in an RAO view, settle it mid-cavity with a clean LV trace, and before filming say which walls the RAO 30° run will show and which the LAO 60°/cranial 20° run will show, and which artery supplies each.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "In the view trainer, set RAO 30° and then LAO 60° with 20° cranial. On each, point to where the anterior wall, apex, inferior wall, septum and posterolateral wall of the LV project, using the spine to orient yourself.",
        },
        { kind: "video", id: "P0czcxqgfOo", note: "Lecture on left ventricular catheterisation and left ventriculography, with diagrams and cases." },
        { kind: "video", id: "Cueo0oIz-eA", note: "Manual of PCI chapter video 6.6: how to perform and interpret left ventriculography." },
        { kind: "video", id: "i76OWhbpwM4", note: "Techniques for femoral or difficult right heart catheterisation." },
        {
          kind: "keypoints",
          items: [
            "Every catheter is a landmark: the pigtail marks the root and LV cavity, the right heart catheter the RA, RV and PA, the pacing wire the RV apex.",
            "RAO 30° ventriculogram: anterior, apical and inferior walls (and MR when panned to the atrium). LAO 60° cranial 20°: septum and posterolateral wall (and VSDs).",
            "Map walls to arteries: anterior and apex LAD, inferior PDA (RCA in 85%), septum LAD and PDA, posterolateral circumflex; the LAD often wraps onto the inferior wall.",
            "On AP the RV apex sits a little medial to the apex of the heart's outline; a good pacing wire looks like a sock.",
            "Coronary sinus: higher on AP, posterior on lateral; RV: anterior on lateral.",
            "Pericardiocentesis: a wire curling round the heart border (not into the RV outflow tract or pulmonary artery), or agitated saline in the pericardial space on echo, marks the pericardial space before any dilator.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-background-depth",
      title: "Front and back on a flat image: the spine, the grooves, the grafts and a second view",
      minutes: 13,
      topics: ["fnd-heart-fluoro-anatomy"],
      sources: [
        O("ch 6: Coronary anatomy"),
        O("ch 6: Catheter manipulation"),
        O("ch 6: Imaging the coronaries"),
        O("ch 6: Tips for interpretation"),
        O("ch 7: Types of operation"),
        O("ch 7: Procedure"),
        O("ch 7: Saphenous vein grafts"),
        O("ch 7: Arterial grafts"),
        O("ch 9: Temporary pacemaker"),
        B("5.7"),
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A projection flattens the chest: anything in front of the heart and anything behind it lands on the same patch of detector. Two vessels that cross on the screen may be centimetres apart, and a catheter tip that looks aligned with an ostium may be pointing straight past it. The manuals give you fixed anchors for depth: the spine at the back, the grooves the arteries run in, the places surgeons sew grafts, and the way leads and catheters move on a second view. Use them in that order whenever you meet a new projection.",
        },
        {
          kind: "table",
          caption: "Depth anchors the manuals give you",
          head: ["Anchor", "Front or back", "How you use it"],
          rows: [
            ["The spine", "The back of the chest", "On the image left the view is RAO; on the image right it is LAO (Oxford)"],
            ["Circumflex in the left atrioventricular groove", "Posterior: it supplies the posterior LV wall", "In every view of the left coronary it is the branch nearest the spine (Oxford)"],
            ["LAD in the interventricular groove", "Anterior: it supplies the anterior wall", "Its septals run towards the right ventricle and septum, its diagonals towards the lateral wall"],
            ["RCA in the right atrioventricular groove", "Runs round to the inferior surface", "Its conus branch supplies the RV outflow tract; its RV marginals run anteriorly towards the septum"],
            ["Left main ostium", "Usually posterior (Brilakis)", "Explains why a JL sometimes needs a turn to find it; see the box on rotation below"],
            ["Vein graft ostia", "Front wall of the ascending aorta, a short way above the sinuses", "Circumflex grafts highest, RCA grafts lowest; LAD and diagonal grafts just above the left coronary ostium; an RCA graft just above and in front of the native RCA"],
            ["LIMA", "Arises anteroinferiorly from the left subclavian, a few centimetres beyond the vertebral artery", "The catheter is seen entering it just after the vertebral origin"],
            ["Wire in the coronary sinus versus the RV", "Sinus posterior, RV anterior on a lateral view", "One lateral view settles a doubtful pacing position"],
          ],
        },
        {
          kind: "steps",
          title: "Reading a new projection, step by step",
          items: [
            {
              title: "1. Name the projection from the spine",
              detail:
                "Spine on the left of the image: RAO. Spine on the right: LAO. (fnd-heart-position adds the diaphragm cue for cranial and caudal.) Do this before you try to name a single branch.",
            },
            {
              title: "2. Find the circumflex",
              detail:
                "In any left coronary view, the branch closest to the spine is the circumflex, because it runs at the back of the heart in the atrioventricular groove. Oxford offers this rule because beginners often cannot tell the LAD from the circumflex.",
            },
            {
              title: "3. Name the branches by where they head",
              detail:
                "LAD branches running towards the circumflex territory (the lateral wall) are diagonals, whereas branches heading for the septum and the right ventricle are septals. Circumflex branches running towards the lateral wall are obtuse marginals (the last one may be called the terminal marginal), and a branch that carries on along the groove towards the base of the heart is the atrioventricular circumflex. RCA branches that pass anteriorly but supply mostly RV muscle are RV marginals.",
            },
            {
              title: "4. Never judge depth or severity from one view",
              detail:
                "Look at each artery in more than one plane; an oval lumen can look tight from one angle and normal from another. Oxford asks for every lesion of interest in at least two projections, ideally 90° apart, free of overlap and foreshortening. Its imaging sequences include a right lateral view for both coronaries.",
            },
            {
              title: "5. Check where a catheter tip is pointing",
              detail:
                "For vein grafts to the left system Oxford finds the RAO view useful to confirm the tip is directed anteriorly, and for a circumflex graft wants the tip pointing away from the spine on RAO. For a doubtful pacing wire, a lateral view shows whether it runs forwards (RV) or backwards (coronary sinus).",
            },
            {
              title: "6. Bookmark with fixed markers",
              detail:
                "Before hunting grafts, read the operation note and the previous angiogram (films as well as report, if possible) and make sure the invasive study is justified. Then freeze the clearest frame of an LAO aortogram and use it as a road map, provided you work in the same projection; sternal wires and the rib spaces give fixed reference points, and surgical clips can also give clues. Move the catheter slowly and deliberately: a small jump of the tip, or resistance to further movement, usually means it has entered an ostium. An occluded graft leaves only a small stump on the aortic wall; film it, so the record shows you found it.",
            },
          ],
        },
        { kind: "tip", id: "diag-bg-name-view-first" },
        {
          kind: "check",
          stem: "A left coronary run shows the spine on the left of the image. Two large branches leave the left main; one runs close to the spine, the other runs away from it towards the apex. What is the projection and which branch lies nearest the spine?",
          options: [
            "LAO; the branch nearest the spine is the LAD",
            "RAO; the branch nearest the spine is the LAD",
            "LAO; the branch nearest the spine is the circumflex",
            "RAO; the branch nearest the spine is the circumflex",
          ],
          answer: 3,
          explanation:
            "Spine on the image left means RAO. In every left coronary view the circumflex is the branch closest to the spine, because it runs posteriorly in the atrioventricular groove. Calling the near branch the LAD is the classic beginner's error the rule exists to prevent.",
        },
        {
          kind: "h",
          text: "Which way does the tip turn? A point where the books differ",
        },
        {
          kind: "p",
          text: "Rotating a catheter swings its tip towards the front or the back, but the manuals do not describe the left main in the same way. Brilakis says an anticlockwise turn may be needed because the left main usually lies posteriorly. Oxford, describing the JL in the root, labels a clockwise turn as posterior and an anticlockwise turn as anterior. For the mammary arteries Oxford gives opposite directions on the two sides: an anticlockwise turn brings the tip anteriorly into the LIMA from the left subclavian, and a clockwise turn brings it anteriorly into the RIMA. Since the two manuals disagree, turn a little and watch which way the tip moves before turning further; pm-engaging teaches this in practice.",
        },
        { kind: "tip", id: "diag-bg-depth-second-view" },
        { kind: "tip", id: "diag-aortogram-graft-roadmap" },
        {
          kind: "check",
          stem: "A man with three vein grafts (to the RCA, an obtuse marginal and a diagonal) arrives without the operation note. Where does Oxford tell you to expect each graft ostium on the ascending aorta?",
          options: [
            "Marginal graft highest, diagonal graft just above the left coronary ostium, RCA graft lowest, just above and in front of the native RCA",
            "Diagonal graft highest, marginal graft in the middle, RCA graft just below and behind the native RCA",
            "All three grafts on the posterior aortic wall, the RCA graft highest because it is the longest conduit and needs the most room to reach the heart",
            "RCA graft highest, marginal graft lowest, diagonal graft beside the non-coronary sinus",
          ],
          answer: 0,
          explanation:
            "Most vein grafts are sewn onto the front of the ascending aorta, a short way above the sinuses. Circumflex (marginal) grafts are usually the most superior and RCA grafts the most inferior; LAD and diagonal grafts usually start just above the left coronary ostium, and an RCA graft just above and in front of the native RCA. A posterior-wall answer ignores the anterior anchor that makes grafts findable.",
        },
        {
          kind: "pitfalls",
          items: [
            "Naming branches before naming the projection; the spine comes first.",
            "Calling the branch nearest the spine the LAD.",
            "Assuming two vessels that cross on the screen touch, or that a tip aligned with an ostium in one view is pointing into it.",
            "Relying on a remembered rotation rule; the manuals label the JL directions differently, so watch the tip.",
            "Using a frozen aortogram as a road map in a different projection from the one it was filmed in.",
            "Injecting into a vein graft or a mammary without watching the pressure: cannulating a vein graft carries a higher risk of VF, so check that the trace is not damped (withdraw slowly and rotate if it is) and test with a slow injection; the LIMA is fragile and dissects easily, especially in older patients, so inject into it slowly.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford's shortest rule for the left coronary is the most useful one on a busy list: whatever the view, the circumflex is the artery nearest the spine.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "view",
          params: { artery: "LCA" },
          task: "For each left coronary run, name the projection from the spine first, then point to the circumflex as the branch nearest the spine before naming the LAD and its diagonals.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "artery",
          task: "Name the artery on each real run; for left coronary runs, say which branch is nearest the spine and why that makes it the circumflex.",
        },
        { kind: "video", id: "r2zahMaZjHY", note: "Lecture on coronary angiographic views." },
        { kind: "video", id: "3sGSkQ6hoQ0", note: "Manual of PCI case 56: core principles of coronary anatomy assessment." },
        {
          kind: "keypoints",
          items: [
            "Name the projection from the spine before anything else: left of image RAO, right of image LAO.",
            "In every left coronary view the circumflex is nearest the spine; the LAD runs in the anterior interventricular groove.",
            "Diagonals head to the lateral wall, septals to the RV and septum, obtuse marginals to the lateral wall; RV marginals of the RCA run anteriorly.",
            "Vein grafts arise from the anterior ascending aorta: circumflex grafts highest, RCA grafts lowest, LAD grafts just above the left coronary ostium.",
            "Depth needs a second view: two projections about 90° apart, a lateral for pacing wires, RAO to check a tip points anteriorly.",
            "The manuals disagree on which rotation turns a JL posteriorly; watch the tip rather than trust a rule.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-background-plaque",
      title: "What the angiogram shows of atherosclerosis, and what it hides",
      minutes: 14,
      topics: ["fnd-atherosclerosis-mi"],
      sources: [
        O("ch 1: Indications for coronary angiography"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 6: Quantification of stenoses"),
        O("ch 7: Saphenous vein grafts"),
        O("ch 8: Restenosis"),
        O("ch 8: Optical coherence tomography"),
        O("ch 8: PCI in acute myocardial infarction"),
        B("7.2"),
        B("13.1"),
        B("13.3"),
        B("20.13"),
        B("25.2"),
      ],
      refs: [...BOOKS, "jia-oct-erosion-2013", "glagov-remodelling-1987", "mills-5udmi-2026"],
      blocks: [
        {
          kind: "p",
          text: "Atherosclerosis lives in the vessel wall, and the angiogram shows only the lumen. Oxford calls angiography 'lumenography' for that reason: it gives clues to the extent of atheroma, thrombus, spasm, bridging and dissection, but never the plaque itself. fnd-phys-athero describes how plaque forms and fails; this lesson takes the same biology into the lab, showing where the angiogram misleads, how intravascular imaging shows the plaque, and why plaque type changes what happens during PCI.",
        },
        {
          kind: "steps",
          title: "Why the angiogram misjudges plaque",
          items: [
            {
              title: "1. It compares the lumen with a 'normal' segment that may not be normal",
              detail:
                "Percent stenosis is judged against the adjacent vessel. Atherosclerosis is diffuse, so the reference segment is often diseased and looks smaller than it really is; remodelling can make a vessel look larger than it is. Oxford warns that, at the extreme, the angiogram can understate severity by as much as 50%, because of incomplete views or eccentric lesions.",
            },
            {
              title: "2. Outward remodelling hides plaque",
              detail:
                "Arteries enlarge outwards as plaque grows (Glagov's compensatory enlargement), so a large plaque can leave the lumen almost untouched. Oxford makes the clinical point: not every plaque that ruptures is obstructive on angiography.",
            },
            {
              title: "3. Resolution and observers",
              detail:
                "Spatial resolution is only about 0.2 mm, and readings vary between observers and for the same observer on another day. The angiographic appearance may not match the physiological effect of the lesion, which is why the pressure wire and intravascular imaging exist.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A woman with an anterior NSTEMI has a 40% LAD narrowing that looks unimpressive, yet her troponin is rising and the ECG points to the LAD. Which statement explains how a culprit plaque can look so mild?",
          options: [
            "A plaque that ruptures is always severely obstructive at the moment of rupture, so a 40% narrowing in the LAD cannot be the culprit of this NSTEMI",
            "Contrast fills the ruptured plaque cavity and makes the narrowing look milder than the overlying cap really is",
            "Outward remodelling can accommodate a large plaque with little loss of lumen, and diffuse disease makes the reference segment look smaller",
            "Angiography overestimates stenosis, so the true narrowing is less than 40%",
          ],
          answer: 2,
          explanation:
            "Oxford notes that not every ruptured plaque is obstructive, because the vessel grows outwards to accommodate plaque, and that diffuse disease makes the reference look smaller, so visual percent stenosis understates disease. Oxford turns to intravascular imaging, and Brilakis specifically to OCT, to settle whether such a lesion is the culprit. Angiography tends to underestimate, not overestimate, severity.",
        },
        {
          kind: "table",
          caption: "Plaque and thrombus on OCT (Brilakis Fig. 13.5, described in words)",
          head: ["Finding", "OCT appearance", "Why it matters"],
          rows: [
            ["Normal wall", "Bright, dark, bright: intima, media and adventitia all the way round", "The reference for everything else"],
            ["Fibrous plaque", "Uniform, signal-rich (bright) tissue", "The bright background against which the two dark plaques, calcium and lipid, are read"],
            ["Calcific plaque", "Signal-poor (dark) area with sharp borders; depth and arc can usually be measured", "Brilakis links three OCT features to stent underexpansion: a maximum calcium arc over 180°, a maximum thickness over 0.5 mm and a length over 5.0 mm; they favour plaque modification (atherectomy or lithotripsy). Superficial calcium is more likely to need ablation, deep calcium may yield to balloons (pm-imaging)"],
            ["Lipid-rich plaque", "Signal-poor area with blurred borders; the media behind it disappears because light is absorbed", "Linked to distal embolisation, and a poor stent landing zone"],
            ["White thrombus", "Mass in the lumen, rich in platelets and white cells, casting little shadow", "Platelet-rich; the commoner thrombus over erosion and calcified nodules in Jia's series"],
            ["Red thrombus", "Mass rich in red cells, strongly attenuating, throwing a shadow over the wall behind", "Hides the plaque underneath"],
          ],
        },
        {
          kind: "list",
          items: [
            "**High-risk plaque on OCT (Oxford):** a fibrous cap thinner than 65 μm; a lipid core with attenuation behind it; a lipid arc greater than 90°; macrophage infiltration.",
            "**Thin-cap fibroatheroma (TCFA)** is a lipid-rich plaque with a thin cap (Jia's OCT definition: lipid in at least two quadrants and a cap thinner than 65 μm); Brilakis warns that stent edges landing on lipid-rich plaque, especially TCFA, tend to dissect.",
          ],
        },
        {
          kind: "table",
          caption: "Three ways a plaque causes an acute coronary syndrome (Jia 2013: 126 ACS patients with OCT before PCI; Oxford ch 5). The other 17.5% of culprits fitted none of the three groups (for example a tight stenosis without rupture, dissection or spasm). Erosion and calcified nodule were diagnosed with new OCT criteria that were not validated against histology.",
          head: ["Feature", "Plaque rupture", "Plaque erosion", "Calcified nodule"],
          rows: [
            ["How often", "43.7%, the commonest", "31.0%", "7.9%, the least common"],
            ["Who", "Mean age 60.6 years", "The youngest (mean 53.8 years). Oxford finds erosion commoner in smokers and in women; Jia's series did not find it more often in women than in men", "The oldest (mean 65.1 years), with the most hypertension and chronic kidney disease"],
            ["Presentation", "NSTE-ACS in 29.1%", "NSTE-ACS in 61.5%", "All NSTE-ACS in this series"],
            ["Plaque underneath", "Lipid plaque in 100%; cap about 60 μm; lipid arc about 276°; mostly red thrombus", "Lipid plaque in 43.6%; cap about 169 μm; lipid arc about 203°; mostly white thrombus", "A disrupted cap over calcified plaque with protruding, superficial calcium; mostly white thrombus"],
            ["Diameter stenosis", "About 69%", "About 55%, the least severe", "About 66%"],
          ],
        },
        {
          kind: "p",
          text: "Oxford states that most myocardial infarctions arise from plaque rupture, and that most STEMIs are caused by thrombus occluding the artery after a rupture. The 2026 universal definition says the same in its own terms: atherothrombosis (thrombus on a ruptured or eroded plaque) is the commonest acute coronary pathology, thrombus can embolise downstream as well as occlude, and stenoses that did not limit flow beforehand are common causes of infarction.",
        },
        {
          kind: "steps",
          title: "How plaque type changes the procedure",
          items: [
            {
              title: "1. Finding the culprit",
              detail:
                "When the culprit is not obvious, Brilakis reviews the angiogram again for subtle staining or thrombus and then uses OCT, preferred to IVUS for its higher resolution. He looks first for ulceration or thrombus at the culprit, while noting that erosion may be the only finding; plaque erosion, ulceration, thrombus or a calcified nodule locate it (pm-imaging-acs teaches the images).",
            },
            {
              title: "2. Forecasting embolisation",
              detail:
                "Brilakis lists a large lipid core or a large thrombus as predictors of distal embolisation, and lipid-rich lesions (with atherectomy and vein graft work) as causes of plaque embolisation, managed with aspiration, vasodilators, and balloon angioplasty if the embolus lodges in an epicardial vessel (cm-flow-embolism).",
            },
            {
              title: "3. Choosing where the stent ends",
              detail:
                "Land the stent edges where plaque burden is below 50% and there is no lipid-rich plaque, particularly no TCFA, because edges on such plaque dissect. OCT penetrates less deeply than IVUS, so behind heavy plaque, and lipid in particular, the outer vessel wall may not be visible and plaque burden can be hard to judge. Brilakis sizes the stent to the distal reference, never the proximal one, because the artery tapers.",
            },
            {
              title: "4. Expecting the disease to come back",
              detail:
                "After PCI the vessel can renarrow by three processes: elastic recoil (immediate), inflammation with neointimal growth (weeks to months) and negative remodelling (months to years). Stents largely abolished recoil and negative remodelling, leaving neointima. OCT also recognises neoatherosclerosis inside a stent as a mechanism of stent failure. In vein grafts, Oxford lists intimal hyperplasia, atherosclerosis within the graft and thrombosis from plaque rupture as the causes of failure.",
            },
          ],
        },
        { kind: "tip", id: "pci-bg-lipid-embolisation-forecast" },
        { kind: "tip", id: "pci-img-landing-zone" },
        {
          kind: "check",
          stem: "OCT of a planned landing zone shows a signal-poor area with blurred borders, behind which the media cannot be seen, under a cap measured at 55 μm. What is it, and what follows?",
          options: [
            "Calcific plaque; it needs atherectomy before any balloon is used",
            "Red thrombus; aspirate it and then land the stent on the same segment",
            "Fibrous plaque; its uniform tissue makes it a safe place for the stent edge, so keep the planned stent length unchanged",
            "A thin-cap lipid-rich plaque; move the stent edge to a segment with less than 50% plaque burden and no lipid",
          ],
          answer: 3,
          explanation:
            "Lipid looks dark with poorly defined borders and hides the media behind it; calcium is dark with sharp borders, and fibrous plaque is bright (signal-rich), not dark. A cap thinner than 65 μm over lipid is a thin-cap fibroatheroma, which Brilakis keeps out of landing zones because edges there dissect. Red thrombus attenuates strongly too, but it sits in the lumen as a mass rather than within the wall.",
        },
        {
          kind: "pitfalls",
          items: [
            "Equating a mild angiographic narrowing with a small plaque: remodelling and diffuse disease hide the burden.",
            "Reading calcium and lipid the same way because both are dark on OCT; the border (sharp or blurred) separates them.",
            "Landing a stent edge on lipid-rich plaque or TCFA because it looks angiographically normal.",
            "Dilating a large lipid-rich lesion without preparing for embolisation and slow flow.",
            "Assuming every ACS culprit is a rupture: in Jia's series nearly a third were erosions, often with less stenosis.",
          ],
        },
        {
          kind: "pearl",
          text: "Before calling a lesion bystander or culprit, ask what is in the wall, not only how narrow the lumen is. Brilakis reaches for OCT when the culprit is unclear because its resolution shows the thrombus, ulceration or erosion the angiogram cannot.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "On the PCI bench, use the OCT pullback to label each frame as fibrous, calcific or lipid-rich plaque or thrombus, score any calcium (arc over 180°, thickness over 0.5 mm, length over 5.0 mm), then choose landing zones with less than 50% plaque burden and no lipid before sizing the stent to the distal reference. Where heavy or lipid plaque hides the outer vessel wall, say that the plaque burden there cannot be judged reliably.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "estimate",
          task: "Estimate the diameter stenosis on each run, then say whether the reference segment you compared it with could itself be diseased, which would make your estimate an underestimate.",
        },
        { kind: "video", id: "09q0X_Htmvc", note: "Lecture on updated concepts in myocardial infarction, in question format." },
        { kind: "video", id: "YpYRizqz-yg", note: "STEMI part 3: an approach to all myocardial infarctions, troponin grades, subtle STEMI cases and LV thrombus." },
        {
          kind: "keypoints",
          items: [
            "The angiogram shows the lumen only; diffuse disease, remodelling, eccentric lesions and a 0.2 mm resolution all make it misjudge plaque.",
            "OCT: fibrous bright and uniform; calcium dark with sharp borders; lipid dark with blurred borders and a hidden media; white thrombus low shadow, red thrombus heavy shadow.",
            "High-risk plaque on OCT: cap under 65 μm, lipid with attenuation, lipid arc over 90°, macrophages.",
            "ACS culprits: rupture commonest (43.7%), erosion next (31.0%, younger, thicker cap, less stenosis), calcified nodule least (7.9%, older).",
            "Large lipid core or large thrombus forecasts distal embolisation; keep stent edges off lipid and TCFA.",
            "Restenosis: recoil, neointima and negative remodelling; stents leave mainly neointima; neoatherosclerosis is a cause of late stent failure.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-background-mi",
      title: "Myocardial infarction in the lab: from the fourth to the fifth universal definition",
      minutes: 14,
      topics: ["fnd-atherosclerosis-mi"],
      sources: [
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 8: PCI in acute myocardial infarction"),
        O("ch 10: Myocardial infarction"),
        B("7.2"),
        B("13.3"),
        B("20.7"),
      ],
      refs: [...BOOKS, "mills-5udmi-2026", "thygesen-4udmi-2018", "ischemia-2020", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "The words you write in a report decide what happens next to the patient: the drugs, the follow-up and the statistics the unit is judged on. fnd-phys-mi taught the fourth universal definition of myocardial infarction (2018) with its numbered types. In August 2026 the fifth universal definition replaced the numbers with three clinical settings. Neither manual covers this change (both predate it), so this lesson takes it from the published definition and applies it to the referrals that reach the lab.",
        },
        {
          kind: "steps",
          title: "The fifth definition, step by step",
          items: [
            {
              title: "1. Is there acute myocardial injury?",
              detail:
                "A rise and/or fall of cardiac troponin I or T with at least one value above the 99th percentile upper reference limit, using sex-specific limits (already recommended in 2018 for high-sensitivity assays and kept in 2026) so that injury in women is not under-recognised.",
            },
            {
              title: "2. Is the injury ischaemic?",
              detail:
                "Troponin cannot tell ischaemic from non-ischaemic injury. Inflammation, stress responses, catecholamines, toxins and trauma all raise it, so ischaemia has to be shown by the clinical picture, the ECG and imaging. Symptoms are best called chest discomfort; the definition discourages 'typical' and 'atypical', because symptoms labelled atypical are commoner in women and may contribute to delayed diagnosis.",
            },
            {
              title: "3. In which setting did it happen?",
              detail:
                "Primary MI arises spontaneously from an acute coronary pathology. Secondary MI is ischaemia caused by another acute condition that upsets the oxygen supply–demand balance (tachyarrhythmia is the commonest; others are severe hypertension, hypotension, hypoxia and anaemia). Procedure-related MI follows a complication of a percutaneous or surgical cardiac procedure within 30 days.",
            },
            {
              title: "4. What confirms it?",
              detail:
                "Primary MI is confirmed when atherothrombosis or another acute coronary pathology is found, or when imaging shows a new regional wall-motion abnormality or loss of viable myocardium in an ischaemic pattern; angiography may miss the pathology, so OCT or IVUS can help, and cardiac MR may be needed. Without angiography or imaging (unavailable or inappropriate), primary MI can still be diagnosed on troponin, ECG and clinical grounds, with the cause recorded as unknown. Secondary MI is confirmed when the ischaemia results from obstructive coronary disease without an acute coronary pathology, or when the injury produces a new regional wall-motion abnormality or loss of viable myocardium. Obstructive here means a stenosis of 70% or more on angiography, or 50% or more if it is flow-limiting on physiological assessment (a different cut-off from the 50% used for MINOCA). When imaging is not feasible or appropriate, for example in frailty, secondary MI cannot be confirmed and rests on clinical judgement, supported by known coronary disease, significant injury that impairs cardiac function, ischaemic ECG changes, or a strong suspicion from the extent of ECG ischaemia or of the troponin rise. Procedure-related MI is taught in cm-principles-closure-pmi.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Where the old numbered types went (fourth definition 2018 → fifth definition 2026)",
          head: ["Event", "Fourth definition (2018)", "Fifth definition (2026)"],
          rows: [
            ["Atherothrombosis: thrombus on a ruptured or eroded plaque", "Type 1", "Primary MI"],
            ["Spontaneous coronary artery dissection, vasospasm, embolism from a non-coronary source", "Type 2 (grouped with supply–demand mismatch)", "Primary MI: an acute coronary pathology other than atherothrombosis"],
            ["Supply–demand imbalance from another acute illness", "Type 2", "Secondary MI; confirmed by coronary or cardiac imaging (obstructive disease without acute pathology, or new wall-motion or viability loss); when imaging is not feasible or appropriate, a clinical diagnosis rests on judgement (known coronary disease, injury that impairs cardiac function, ischaemic ECG changes, or the extent of ECG ischaemia or troponin rise)"],
            ["Stent thrombosis, restenosis or graft failure", "Types 4b (stent thrombosis) and 4c (restenosis), at any time; type 5 covered only CABG-related MI within 48 hours", "Procedure-related within 30 days of the procedure (after an initially uncomplicated procedure, only if it arises in the vessel or territory treated); primary MI if more than 30 days after it"],
            ["MI caused by PCI or surgery", "Types 4a and 5", "Procedure-related MI (within 30 days)"],
            ["MINOCA", "Myocardial infarction with non-obstructive coronary arteries", "Myocardial injury with non-obstructive coronary arteries: a working diagnosis"],
          ],
        },
        {
          kind: "p",
          text: "The ECG labels survive the change: STEMI and NSTEMI are still used for the presenting ECG, now alongside the setting (ICD-11 gives them separate codes). The Academy lessons fnd-phys-mi and phy-mv-minoca use the earlier wording (the 2018 numbered types, and the 2023 ESC term myocardial infarction with non-obstructive coronary arteries); since August 2026 the universal definition uses the settings above and myocardial injury.",
        },
        {
          kind: "check",
          stem: "A 44-year-old woman, six weeks post partum, has an anterior NSTEMI. Angiography shows a long, smooth narrowing of the mid-to-distal LAD typical of spontaneous coronary artery dissection. How is the infarct classified under the fifth universal definition?",
          options: [
            "Type 2 MI, because there is no atherothrombosis",
            "Secondary MI, because pregnancy and the post-partum period changed the oxygen supply–demand balance",
            "Primary MI, caused by an acute coronary pathology other than atherothrombosis",
            "MINOCA, because the narrowing is not caused by plaque",
          ],
          answer: 2,
          explanation:
            "The fifth definition moves SCAD, vasospasm and coronary embolism out of the old type 2 group and into primary MI as acute coronary pathologies, and asks clinicians to consider SCAD particularly in women under 50 and around pregnancy. 'Type 2' was the fourth-definition label and no longer exists. MINOCA is only a working diagnosis: once SCAD is identified, the final diagnosis is primary MI due to SCAD, whatever the degree of narrowing. If OCT is considered to confirm SCAD, Brilakis notes the concern that wiring and contrast injection may extend the dissection flap and close the vessel.",
        },
        {
          kind: "steps",
          title: "A troponin rise during another illness: when to bring the patient to the lab",
          items: [
            {
              title: "1. Treat the trigger and look for ischaemia",
              detail:
                "In sepsis, bleeding or a fast arrhythmia, troponin rises are common and chest discomfort is less often reported; breathlessness and the symptoms of the underlying illness dominate, and ECG changes are often global rather than regional.",
            },
            {
              title: "2. Invasive angiography if ischaemia persists or recurs",
              detail:
                "Ongoing or returning ischaemia, with primary MI still possible, is the indication for invasive angiography. Remember that sepsis and bleeding can themselves trigger atherothrombosis, and that marked ST changes which do not settle quickly once the trigger is treated (for example after cardioversion of a tachyarrhythmia) should make you reconsider primary MI.",
            },
            {
              title: "3. Otherwise, image later",
              detail:
                "Imaging is often deferred until the acute illness is treated and can then be non-invasive, for example CT coronary angiography. In frail patients or those with limited life expectancy it may not be appropriate, and clinical judgement decides.",
            },
            {
              title: "4. If MI is excluded, name the injury",
              detail:
                "Most such patients turn out to have no obstructive disease and no new loss of viable muscle; secondary MI is then excluded, and the cause of the myocardial injury should still be identified where possible.",
            },
          ],
        },
        { kind: "tip", id: "diag-bg-secondary-mi-question" },
        {
          kind: "check",
          stem: "A man with pneumonia and fast AF has a rising troponin and diffuse ST depression that resolves with rate control. He has no ongoing chest discomfort. The ward asks for urgent angiography. What does the fifth definition support?",
          options: [
            "Treat the infection and rate, and reserve invasive angiography for persistent or recurrent ischaemia; otherwise image after recovery",
            "Urgent angiography tonight, because a rising troponin with ST depression is a primary MI until proved otherwise, whatever the heart rate",
            "Diagnose secondary MI now from the troponin and the arrhythmia, and arrange no further cardiac tests",
            "Diagnose MINOCA, because the coronaries are unlikely to be obstructed",
          ],
          answer: 0,
          explanation:
            "Possible secondary MI is managed by treating the trigger; invasive angiography is indicated if ischaemia persists or recurs with primary MI in the differential, and otherwise imaging (often CT coronary angiography) waits until the acute illness is treated. Secondary MI cannot be confirmed from troponin and symptoms alone: it needs obstructive disease without an acute coronary pathology, or new wall-motion or viability changes on imaging. MINOCA is a label applied after angiography, not before.",
        },
        {
          kind: "h",
          text: "What the manuals add from the lab",
        },
        {
          kind: "list",
          items: [
            "**Time is muscle (Oxford).** In acute MI the aim is to restore flow in the infarct-related artery; shorter ischaemic time means less necrosis and less LV damage, and a patent infarct artery, however it was opened, halves the risk of death. STEMI still carries about 10% mortality at one year.",
            "**Lytics fade with time (Oxford).** Fibrinolysis helps most early in STEMI; by 12 hours its bleeding risk outweighs its benefit, and PCI is the default reperfusion strategy. The 2023 ESC ACS guideline keeps fibrinolysis, within 12 hours of symptom onset, for patients in whom primary PCI cannot be delivered within 120 minutes of diagnosis (taught in acute-mcs).",
            "**No obvious culprit (Brilakis).** Review the angiogram again for subtle thrombus or staining, use the ventriculogram or an echo to find a hypokinetic territory or an alternative diagnosis such as takotsubo, image with OCT, and use cardiac MR if it is still unclear.",
            "**Infarction caused in the lab (Oxford).** STEMI during catheterisation is rare (about 0.1%), from dissection or embolism of air, thrombus or atheroma. Routine enzyme testing after PCI also finds small, silent rises that are nonetheless linked to a higher later risk of death or MI.",
            "**Definitions change results.** In ISCHEMIA (5179 patients with moderate or severe ischaemia), the primary outcome was sensitive to the MI definition used; one analysis gave more procedural MIs of uncertain clinical importance.",
          ],
        },
        {
          kind: "p",
          text: "**MINOCA, renamed.** When a patient with features of MI has no stenosis of 50% or more, the fifth definition calls this myocardial injury with non-obstructive coronary arteries, because most such patients prove to have a non-coronary cardiac cause (myocarditis, takotsubo, a cardiomyopathy) or a non-cardiac one such as pulmonary embolism. Intravascular imaging may find erosion, rupture, mural thrombus or SCAD; functional testing may find spasm or microvascular dysfunction; cardiac MR, ideally within 2 weeks, gives the final diagnosis and confirms MI in 22–27%. MR is best done early because the changes of takotsubo and myocarditis can resolve, whereas those of infarction persist. If MI is confirmed, it is then reclassified as primary, secondary or procedure-related. Oxford's 2020 text, which predates the change, estimated MINOCA at about 5–10% of patients presenting with MI. cp-acs-thrombus-minoca works the diagnosis through.",
        },
        {
          kind: "table",
          caption: "Causes of MINOCA in Oxford ch 5 (written before the 2026 renaming)",
          head: ["Cause", "Clues and confirmation", "What follows"],
          rows: [
            ["Plaque rupture or erosion", "Rupture may not look obstructive because of outward remodelling; intravascular imaging can show the rupture or laminated thrombus", "Consider intravascular imaging, especially with one or more cardiovascular risk factors and localising ECG changes"],
            ["Coronary spasm", "Often at sites of mild plaque, but can occur in normal arteries after cocaine, epinephrine or chemotherapy drugs; patients may lack the usual risk factors; confirmed by intracoronary ergonovine or acetylcholine provocation", "Drug treatment; calcium-channel blockers first, other vasodilators possible"],
            ["Paradoxical embolism", "Suspect in the young without risk factors and with ECG changes pointing to the right atrium or ventricle; angiography often shows abrupt occlusion of a terminal branch, sometimes nothing", "Transthoracic or transoesophageal echo to find the communication between the circulations"],
            ["Myocarditis", "Can mimic MI closely, and fulminant cases cause heart failure or collapse; catheterisation is usually normal, and a raised LV diastolic pressure is a poor sign", "Cardiac MR confirms; biopsy is now rarely done; acute treatment is supportive"],
            ["Takotsubo cardiomyopathy", "Often after emotional or physical stress (not always), commoner in women after the menopause; marked ST elevation; arteries unobstructed; apical ballooning on the ventriculogram", "LV function often recovers with time, but it can recur"],
            ["Hypertrophic or dilated cardiomyopathy", "Echo or cardiac MR is the cornerstone of diagnosis", "Some argue that cardiac MR should be routine in MINOCA"],
          ],
        },
        { kind: "tip", id: "diag-bg-minoca-working" },
        {
          kind: "check",
          stem: "Eight months after an LAD stent, a patient presents with an anterior STEMI from stent thrombosis. How is the infarct classified under the fifth universal definition?",
          options: [
            "Procedure-related MI, because a stent is involved whenever the thrombosis occurs after it",
            "Primary MI, because the event is more than 30 days after the procedure",
            "Type 4b MI, the stent thrombosis category",
            "Secondary MI, because stent thrombosis reduces supply",
          ],
          answer: 1,
          explanation:
            "Procedure-related MI is limited to complications within 30 days. Restenosis, stent thrombosis or graft failure arising more than 30 days after revascularisation counts as an acute coronary pathology of primary MI. Type 4b was the fourth-definition label.",
        },
        {
          kind: "pitfalls",
          items: [
            "Still writing 'type 1' and 'type 2' in reports after the 2026 change without saying which definition you are using.",
            "Filing SCAD, spasm or embolism under supply–demand mismatch; they are now primary MI.",
            "Confirming secondary MI from a troponin and a tachycardia alone; it needs obstructive disease without acute pathology, or new imaging changes.",
            "Taking every troponin rise in sepsis or AF straight to the lab, or, the opposite error, never imaging a patient whose ischaemia recurs.",
            "Writing 'normal coronaries' and stopping: non-obstructive arteries with myocardial injury is a working diagnosis that needs MR.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the setting and the mechanism, not just 'MI': for example, 'primary MI due to SCAD' or 'secondary MI from fast AF on obstructive circumflex disease'. The fifth definition asks that once angiography has identified the acute coronary pathology, the final diagnosis should name it, because that tells the next doctor about future risk and treatment.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab debrief after a case with non-obstructive coronaries and a raised troponin, write the report line using the fifth definition: state that the arteries are non-obstructive, record the LV findings, and recommend cardiac MR within 2 weeks.",
        },
        { kind: "video", id: "MbsKyedJ2ts", note: "Acute chest pain part 1: chest pain and high-sensitivity troponin." },
        { kind: "video", id: "9oruCVVldy4", note: "Myocardial infarction 2: board questions." },
        { kind: "video", id: "t2Nd3oxfHSU", note: "Myocardial infarction 3: board questions." },
        {
          kind: "keypoints",
          items: [
            "Acute myocardial injury: troponin rise and/or fall with a value above the sex-specific 99th percentile; troponin alone cannot show ischaemia.",
            "Fifth definition (2026): primary (spontaneous acute coronary pathology), secondary (another acute condition upsets supply and demand) and procedure-related (within 30 days).",
            "SCAD, vasospasm and coronary embolism are now primary MI; stent thrombosis or restenosis beyond 30 days is primary MI.",
            "Secondary MI needs confirmation: obstructive disease (a stenosis of 70% or more, or 50% or more that is flow-limiting on physiology) without acute pathology, or new wall-motion or viability changes.",
            "Possible secondary MI: treat the trigger; invasive angiography if ischaemia persists or recurs; otherwise image after recovery.",
            "MINOCA now means myocardial injury with non-obstructive coronary arteries; MR within 2 weeks confirms MI in 22–27%.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-background-general",
      title: "General cardiology at the lab door: the conditions that change the procedure",
      minutes: 15,
      topics: ["oth-general-cardiology"],
      sources: [
        O("ch 1: Indications for cardiac catheterization"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 1: Patient preparation"),
        O("ch 3: Anticoagulation issues"),
        O("ch 4: Ventriculography"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 10: Death"),
        O("ch 10: Pulmonary oedema"),
        O("ch 10: Arrhythmia"),
        B("1.1"),
        B("1.3"),
        B("2.6"),
        B("4.1"),
        B("7.1"),
        B("10.2"),
      ],
      refs: [...BOOKS, "revived-2022", "ischemia-2020", "velazquez-stiches-2016", "esc-ccs-2024", "mills-5udmi-2026", "esc-ncs-2022", "vandermolen-esur-pcaki-2018"],
      blocks: [
        {
          kind: "p",
          text: "Most of the risk in a cath lab case arrives with the patient: a weak ventricle, an anticoagulant, failing kidneys, a tight valve, an operation booked for next month. The manuals scatter these points across many chapters. This lesson gathers them into one screen you can run before you scrub, and points to the modules that teach each in depth (pm-planning-assessment and pm-planning-preparation for the full work-up). It is also the landing place for the general-cardiology lectures linked at the end.",
        },
        {
          kind: "table",
          caption: "Conditions that change the procedure, and how",
          head: ["Condition", "What it changes in the lab", "Taught in depth"],
          rows: [
            ["Heart failure, impaired LV", "Higher procedural mortality (with age, left main or three-vessel disease, class IV heart failure and aortic valve disease); contrast can precipitate pulmonary oedema; a ventriculogram is relatively contraindicated with LVEDP above 35 mmHg or pulmonary oedema, and a good echo makes it unnecessary; a patient who cannot lie flat may favour radial access", "hb-cardiac-catheterisation, pm-support-choice"],
            ["Atrial fibrillation on anticoagulation", "Radial access preferred (both manuals). Warfarin before elective cases: Oxford stops it 3–5 days before only in low-risk AF (normal LV, no previous stroke), and continues it or switches to IV unfractionated heparin in moderate- or high-risk AF (poor LV, previous stroke, diabetes), prosthetic (especially mechanical) valves, rheumatic mitral disease or non-laminar thrombus; Brilakis stops it 5 days before and checks the INR on the day. DOACs: Oxford withholds them for 24 hours (72 hours for dabigatran with renal impairment); Brilakis's table holds them for 2–5 days by drug and creatinine clearance (apixaban 2 days). The books differ, so follow local protocol. AF can start in the lab and may need cardioversion", "pm-antithrombotics-oac"],
            ["Valve disease", "Coronary angiography is considered in symptomatic patients being assessed for valve surgery, because valve disease makes non-invasive diagnosis of coronary disease difficult (Oxford's guide: everyone over 40 with one or more risk factors, asymptomatic patients with suspected ischaemia, and LV systolic dysfunction; in endocarditis only with multiple risk factors or coronary embolism). Severe aortic or mitral stenosis raises the risk of pulmonary oedema; aortic valve disease raises the risk of death and stroke", "hb-specific-conditions"],
            ["Kidney disease and dialysis", "Contrast ceiling (Brilakis: stop before 3.7 × GFR, lower in chronic kidney disease or a single kidney); stage non-emergency PCI; dialysis-dependent patients are prone to pulmonary oedema; a dialysis fistula arm is not an access site", "cm-patient-complications"],
            ["Diabetes", "Early on the list; morning insulin and short-acting oral agents withheld (Brilakis reduces insulin to match the fast). Metformin: the books differ. Oxford withholds it the day before and for 2 days after; Brilakis holds it only in chronic kidney disease (on the day, restarting no earlier than 48 hours after) and otherwise rechecks renal function afterwards; the 2018 ESUR contrast guideline stops it from the time of contrast only with an eGFR below 30, acute kidney injury, or arterial contrast that reaches the kidneys undiluted on first pass (for example a left heart injection such as a ventriculogram); coronary injections count as second pass (pm-planning). Follow local policy. With multivessel disease CABG is generally preferred in good surgical candidates", "pm-planning-preparation, pm-target-heart-team"],
            ["Planned non-cardiac surgery or doubtful adherence", "If surgery is likely within 6–12 months, or the patient may not take the drugs, Brilakis advises avoiding a stent if possible, because the operation and early interruption of dual antiplatelet therapy raise the risk of stent thrombosis; medical therapy or CABG may be better. This is the manual's 2021 advice: the 2022 ESC non-cardiac surgery guideline defers elective surgery to 6 months after elective PCI and 12 months after an ACS (pm-planning)", "pm-planning-steps"],
            ["Conditions that mimic infarction", "Myocarditis (coronaries usually normal; a raised LV diastolic pressure is a poor sign; MR confirms), takotsubo (often women after the menopause, after stress; ST elevation; unobstructed arteries; apical ballooning), spasm after cocaine, epinephrine or chemotherapy drugs (see the MINOCA table in hb-background-mi)", "cp-acs-thrombus-minoca"],
          ],
        },
        {
          kind: "steps",
          title: "A five-question screen before you scrub",
          items: [
            {
              title: "1. Why is the patient here, and has anything changed?",
              detail:
                "Oxford wants the indication and the responsible cardiologist documented, any change in events or symptoms since the decision recorded, and a check that the procedure is still indicated on the day. Review previous procedures (access sites, catheters used, complications, outcomes), the CABG operation note if there is one, the drugs, allergies and fasting status, and see that consent is documented. Relative contraindications to catheterisation include acute kidney injury, pulmonary oedema, known contrast allergy, uncontrolled hypertension, active gastrointestinal bleeding, acute stroke, untreated coagulopathy and an untreated or unexplained fever. Refusal of consent is the only absolute one.",
            },
            {
              title: "2. What does the ventricle look like?",
              detail:
                "Read the echo report and look for congestion (a raised JVP, basal crackles). A weak or stiff ventricle changes contrast volume, whether a ventriculogram is needed, how long the patient can lie flat and whether support may be required.",
            },
            {
              title: "3. What is the rhythm, and what is the anticoagulant?",
              detail:
                "Note the rhythm on the baseline ECG and the anticoagulant, its last dose and, for warfarin, the INR. Brilakis prefers radial access for anyone on warfarin or a DOAC or at high bleeding risk; Oxford considers the femoral route generally safer on warfarin only when the INR is below 2.0.",
            },
            {
              title: "4. Kidneys, sugar and contrast",
              detail:
                "Check the blood count, electrolytes, renal function and glucose (Oxford also asks for the lipid status to be documented) and the drug list, and site a venous cannula, preferably in the left arm. Hydrate patients with renal impairment, especially diabetic ones, minimise contrast and count any contrast given recently (for example at a CT) against the day's ceiling.",
            },
            {
              title: "5. What happens after the lab?",
              detail:
                "Ask about surgery booked in the coming months and whether the patient will take antiplatelet drugs reliably; both decide whether a stent is the right answer.",
            },
          ],
        },
        { kind: "tip", id: "pci-bg-surgery-adherence" },
        {
          kind: "check",
          stem: "Which patient is at the highest risk of pulmonary oedema from the contrast given during a diagnostic study, according to Oxford?",
          options: [
            "A 60-year-old with normal LV function, mild aortic regurgitation and a normal LVEDP",
            "A 45-year-old with intermittent chest pain and a normal echocardiogram",
            "A patient with a previous radial occlusion and normal renal function",
            "A dialysis-dependent patient with severe aortic stenosis and a raised LVEDP",
          ],
          answer: 3,
          explanation:
            "Oxford lists LV impairment, a raised LVEDP, severe aortic or mitral stenosis and dialysis-dependent renal failure as the settings in which large contrast volumes cause pulmonary oedema; this patient has three of them. A previous radial occlusion affects access, not the risk of oedema.",
        },
        { kind: "tip", id: "diag-bg-contrast-heart-failure" },
        { kind: "tip", id: "haemo-bg-af-in-lab" },
        {
          kind: "h",
          text: "What revascularisation can add to medical treatment",
        },
        {
          kind: "p",
          text: "General cardiology also sets the expectations for the lab. Brilakis is direct about stable disease: revascularisation relieves angina better than medicines and improves quality of life, but does not lower the risk of MI or death except possibly in high-risk anatomy, and it cannot make an asymptomatic patient feel better. Some patients deny symptoms because they have slowly cut back what they do; the family's account and an exercise test show whether they are truly symptom-free. Brilakis lists the groups in whom revascularisation might improve prognosis: left main stenosis over 50%; proximal LAD stenosis over 50%; two- or three-vessel disease (stenoses over 50%) with an ejection fraction of 35% or less; a large ischaemic area on functional testing (over 10% of the LV) or an abnormal FFR; a single remaining patent artery with a stenosis over 50%; and sudden death from VF or VT. When multivessel or left main disease needs treatment, he prefers PCI after previous CABG, in poor surgical candidates and in less complex disease, and CABG in diabetes, reduced ejection fraction and complex multivessel disease.",
        },
        {
          kind: "p",
          text: "Trials published around and after the manual sharpen this. ISCHEMIA (5179 patients with moderate or severe ischaemia) found no reduction in ischaemic events or death with an initial invasive strategy over a median of 3.2 years: events were more frequent with the invasive strategy early on (5.3% versus 3.4% at 6 months) and less frequent late (16.4% versus 18.2% at 5 years), with no overall difference. REVIVED-BCIS2 (700 patients with ejection fraction 35% or less, extensive disease amenable to PCI and viable myocardium, all on optimal heart failure treatment) found that PCI did not reduce death or heart failure admission over a median of 41 months (37.2% versus 38.0%); quality of life seemed better with PCI at 6 and 12 months, but the difference had faded by 24 months. REVIVED tested PCI only. In the extended follow-up of STICH (1212 patients with ejection fraction 35% or less and disease suitable for CABG), surgery added to medical therapy reduced death from any cause over a median of 9.8 years (58.9% versus 66.1%), so the heart team still weighs CABG in this group. The 2024 ESC chronic coronary syndromes guideline is the current European reference for these decisions, which pm-target-ccs-why teaches.",
        },
        {
          kind: "check",
          stem: "A man with ischaemic cardiomyopathy (ejection fraction 30%), extensive coronary disease suitable for PCI and viable myocardium is on optimal heart failure treatment. His family asks whether stenting will help him live longer. What did REVIVED-BCIS2 show?",
          options: [
            "PCI halved deaths and heart failure admissions over about 3 years",
            "PCI improved the ejection fraction by about 10 points at 12 months but did not change survival or admissions",
            "PCI did not reduce death or heart failure admission, and ejection fraction at 6 and 12 months was similar",
            "PCI reduced deaths from any cause but increased the number of heart failure admissions",
          ],
          answer: 2,
          explanation:
            "In REVIVED-BCIS2 the primary outcome (death from any cause or heart failure admission) occurred in 37.2% with PCI and 38.0% with optimal medical therapy alone (hazard ratio 0.99) over a median of 41 months, and ejection fraction did not differ at 6 or 12 months. REVIVED-BCIS2 tested PCI; it does not overturn the long-term survival benefit of CABG in this group seen in STICH (death 58.9% versus 66.1% over a median of 9.8 years), so the heart team still weighs surgery.",
        },
        {
          kind: "pitfalls",
          items: [
            "Taking a breathless patient with a high LVEDP through a full-volume ventriculogram that a recent echo made unnecessary.",
            "Going femoral by habit in a patient on a DOAC or warfarin when the radial route is available.",
            "Forgetting contrast given at a CT the day before when setting the day's contrast ceiling.",
            "Stenting a patient whose hip operation is booked for next month without discussing the alternatives.",
            "Promising a patient with stable disease that a stent will help them live longer.",
          ],
        },
        {
          kind: "pearl",
          text: "Brilakis's planning checklist asks for comorbidities to be listed before every case: valve disease, heart failure, arrhythmia, peripheral arterial disease, renal failure, significant lung disease, sleep apnoea, bleeding disorders, back pain that stops the patient lying flat, diabetes and advanced age. Reading that list aloud at the brief catches most of the problems in the table above.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, record the LVEDP before deciding on a ventriculogram: if it is above 25 mmHg, reduce the planned injection, and if it is above 35 mmHg or the patient is congested, decide whether the echo already answers the question.",
        },
        { kind: "video", id: "tCo6C_oJOws", note: "Acute chest pain part 2: non-MI causes, tips and tricks." },
        { kind: "video", id: "TdbelvbKaWA", note: "Acute atrial fibrillation with haemodynamic compromise or heart failure: practical tips." },
        { kind: "video", id: "EsPMh0cMU3k", note: "Preoperative cardiac assessment: pearls and updates." },
        { kind: "video", id: "DiobAb9Fw04", note: "Viability testing in ischaemic cardiomyopathy: concepts, caveats and case illustrations." },
        {
          kind: "keypoints",
          items: [
            "Screen five things before you scrub: indication and changes, the ventricle, rhythm and anticoagulant, kidneys and diabetes, what happens after.",
            "Pulmonary oedema from contrast: LV impairment, raised LVEDP, severe aortic or mitral stenosis, dialysis.",
            "Anticoagulated or high bleeding risk: radial first; on warfarin the femoral route is safer when the INR is below 2.0. Elective DOAC holds differ (Oxford 24 hours; Brilakis 2–5 days by drug and clearance), so follow local protocol.",
            "Contrast ceiling 3.7 × GFR (Brilakis), lower in kidney disease, counting recent CT contrast; metformin rules differ between the books.",
            "Surgery likely within 6–12 months or doubtful adherence: avoid a stent if possible, and check the timing against the 2022 ESC guideline.",
            "Stable disease: revascularisation relieves angina; ISCHEMIA and REVIVED-BCIS2 (PCI) found no reduction in death or major events, while STICH showed CABG lowering long-term mortality with an ejection fraction of 35% or less.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-background-peripheral",
      title: "Beyond the coronaries: peripheral, aortic and venous disease for the coronary operator",
      minutes: 13,
      topics: ["ref-peripheral"],
      sources: [
        O("ch 1: Patient preparation"),
        O("ch 3: Which arterial access route to use?"),
        O("ch 4: Aortography"),
        O("ch 7: Arterial grafts"),
        O("ch 10: Stroke"),
        O("ch 10: Limb ischaemia"),
        O("ch 10: Cholesterol embolization"),
        B("1.4"),
        B("2.7"),
        B("4.1"),
        B("4.2"),
        B("5.2"),
        B("14.2"),
        B("24.2"),
        B("29.1"),
      ],
      refs: [...BOOKS, "mazzolai-esc-pad-aortic-2024", "esc-pe-2019", "esc-achd-2020"],
      blocks: [
        {
          kind: "p",
          text: "Peripheral arterial, aortic and venous intervention is outside the scope of CathMaster; the current European reference for the arterial and aortic conditions is the 2024 ESC guideline on peripheral arterial and aortic diseases, and for acute pulmonary embolism the 2019 ESC guideline. Every coronary case still travels through peripheral vessels, though, and the patients who have coronary disease often have disease elsewhere. This lesson teaches what the two manuals say about the peripheral, aortic and venous problems a coronary operator meets, and lists the lectures to follow if you want to go further.",
        },
        {
          kind: "table",
          caption: "Peripheral and aortic findings that change a coronary case",
          head: ["Finding", "Why it matters", "What the manuals advise"],
          rows: [
            ["Weak or absent femoral pulses, claudication", "Peripheral disease narrows or blocks the route to the heart", "Not a contraindication to the femoral route, but if neither femoral pulse is palpable, or only weakly and it cannot be entered, go radial; a pulse weaker than the other side suggests an occlusion upstream; Brilakis recommends ultrasound for every puncture, and especially when pulses are weak"],
            ["Axillofemoral or other peripheral graft", "With an axillofemoral graft the abdominal aorta itself may be occluded", "A femoral approach is pointless then, even with a palpable pulse; puncturing a synthetic (polyester) graft risks bleeding and is generally not recommended"],
            ["Iliac tortuosity, stenosis or kissing iliac stents", "Kinked catheters, poor torque, failure to reach the root", "Look for them on old films and CT; use specialised wires, a catheter close behind the wire tip, and a long sheath once across"],
            ["Abdominal aortic aneurysm", "Common in coronary patients and often undiagnosed; mural thrombus can embolise", "Suspect it when the wire loops back or swings laterally; exchange over a wire; thrombus on ultrasound rules out the femoral route; Brilakis plans radial access when an aneurysm is known"],
            ["Coarctation", "Usually just beyond the left subclavian origin; catheters may not cross from below", "Consider radial access, or femoral plus radial to measure the gradient; Oxford images it in RAO and gives a gradient above 50 mmHg as an indication for intervention, but the 2020 ESC adult congenital guideline uses an invasive peak-to-peak gradient of 20 mmHg or more in hypertensive patients, so do not apply Oxford's figure (hb-cardiac-catheterisation)"],
            ["Subclavian stenosis or anomaly", "Matters for LIMA grafts and for arm access", "A damped pressure in the subclavian before LIMA engagement may mean stenosis: inject non-selectively; an aberrant right subclavian (arteria lusoria) favours left radial or femoral access"],
            ["Aortic atheroma", "Debris dislodged by catheters causes stroke and cholesterol embolisation", "Move catheters gently, exchange over wires, use soft tips and avoid high-pressure injections against the wall. Cholesterol embolisation is commoner with aortic aneurysm or cerebrovascular disease and may occur in up to 1.4% of diagnostic studies; treatment is supportive, and multisystem embolisation carries a poor prognosis"],
            ["Severe peripheral disease when support is needed", "Large-bore support devices need a usable iliofemoral route", "Brilakis lists severe peripheral disease as a contraindication to the large-bore support devices in his table (transcaval access is an option for some), and an aortic aneurysm as a contraindication to the balloon pump; in MI with shock his algorithm assesses the peripheral vessels"],
          ],
        },
        { kind: "tip", id: "access-bg-pulses-both-groins" },
        { kind: "tip", id: "access-bg-axillofemoral" },
        {
          kind: "check",
          stem: "A man with an axillofemoral bypass graft has a strong right femoral pulse. He needs coronary angiography. Which access do you plan?",
          options: [
            "Right femoral, because the pulse is strong and the common femoral artery is the largest and most familiar target",
            "Radial access, because the abdominal aorta may be occluded and the femoral route may lead nowhere",
            "Puncture the synthetic graft directly, because it is easy to feel",
            "Left femoral, because the graft only affects the right side",
          ],
          answer: 1,
          explanation:
            "Oxford warns that an axillofemoral graft may mean the abdominal aorta is occluded, so the femoral approach can be pointless even with a palpable pulse, and that puncturing synthetic peripheral grafts risks bleeding and is generally not recommended. The arm is the route. The strong pulse is the trap: it may come from the graft, not from a patent aorta.",
        },
        {
          kind: "steps",
          title: "A peripheral check before any coronary case",
          items: [
            {
              title: "1. History",
              detail:
                "Ask about claudication, aortic aneurysm, previous peripheral procedures and grafts, previous catheterisation (and any difficulty reaching the heart), bypass surgery, dialysis fistulas and radial artery harvest. Ask which access sites were used before and whether there was a complication: Brilakis avoids a site that has had one, and if an Angio-Seal closure device was used within the last 90 days he considers the other groin or the radial route.",
            },
            {
              title: "2. Examination",
              detail:
                "Feel and record the femoral and distal pulses on both sides before you start (Oxford's preparation; Brilakis asks for all the pulses in the arms and legs) and again at the end (Brilakis's monitoring).",
            },
            {
              title: "3. Old images",
              detail:
                "Brilakis reviews previous cardiac or peripheral films and any CT for aortoiliac and arm-vessel disease or tortuosity, the level of the femoral bifurcation, kissing iliac stents, radial loops, an anomalous arch or an aberrant right subclavian. An abdominal and pelvic CT shows the femoral bifurcation and iliofemoral disease.",
            },
            {
              title: "4. During the case",
              detail:
                "Never force a wire. If it meets resistance, transduce the sheath, bring a catheter up behind the wire, image the obstacle (occlusion, severe lesion, tortuosity, side branch or aneurysm) and choose a wire, a long sheath or another route accordingly (pm-to-the-root teaches the algorithm).",
            },
            {
              title: "5. After the case",
              detail:
                "Watch the limb: pallor or cyanosis, coldness, lost or weak pulses, pain, and motor or sensory loss suggest acute ischaemia and need prompt imaging and the vascular team (cm-access-complications-limb). Cholesterol embolisation can appear later as livedo, blue toes, visual or neurological signs, persistent renal impairment and a rising eosinophil count.",
            },
          ],
        },
        { kind: "tip", id: "access-root-aneurysm-suspect" },
        { kind: "tip", id: "access-bg-aaa-thrombus" },
        {
          kind: "check",
          stem: "A woman with a known 5 cm abdominal aortic aneurysm needs angiography. Ultrasound shows mural thrombus in the aneurysm. What does Oxford advise?",
          options: [
            "Femoral access is contraindicated by the thrombus, because of embolisation to the kidneys and legs",
            "Femoral access is acceptable because no aneurysm size rules it out",
            "Femoral access with a long sheath makes the thrombus irrelevant",
            "Delay angiography until the aneurysm has been repaired, whatever the indication, because no access is safe beforehand",
          ],
          answer: 0,
          explanation:
            "Oxford says no absolute aortic size precludes the femoral route, but thrombus seen on ultrasound is a contraindication, because embolisation can cause renal failure, distal ischaemia and 'trash foot'. The size-only answer is half right and misses the thrombus; a long sheath protects the catheter from looping, not the patient from embolism.",
        },
        {
          kind: "h",
          text: "Venous work the coronary operator does",
        },
        {
          kind: "p",
          text: "The venous side of the lab is mostly access: the femoral vein for right heart studies and temporary pacing, and the jugular or subclavian veins when the upper route is preferred. Pulmonary embolism and pulmonary angiography are taught in hb-specific-conditions-pe. Intervention for venous disease itself, like peripheral arterial and aortic intervention, is outside this curriculum; the lectures below are the starting points.",
        },
        {
          kind: "list",
          items: [
            "**Outside the curriculum, as reference only:** lower-limb arterial disease and critical limb ischaemia; femoropopliteal and below-the-knee intervention, including chronic occlusions of the superficial femoral artery and femoropopliteal in-stent restenosis; drug delivery and stent or non-stent strategies in peripheral arteries; endovascular or surgical repair of abdominal aortic aneurysm and other catheter-based aortic interventions; percutaneous treatment of venous disease. Lectures on all of these are on the Brilakis channel, and on peripheral arterial disease on the Hanna channel; four are linked below.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing femoral access without feeling both groins: the weak side or the graft is found only when the wire stops.",
            "Trusting a strong femoral pulse in a patient with an axillofemoral graft.",
            "Pushing through resistance in the iliac arteries instead of imaging the obstacle.",
            "Missing an undiagnosed aneurysm when the wire swings sideways in the abdomen.",
            "Forgetting that an IABP is contraindicated with an aortic aneurysm and that large-bore devices need a usable iliofemoral route.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford's reminder is that abdominal aortic aneurysm shares its risk factors with coronary disease, so it is common in the patients you catheterise and often unknown before the procedure. The course of the wire in the abdomen is your first, free scan of the aorta: watch it.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the procedure lab, before the puncture, feel and record both femoral pulses and the distal pulses; state which access you would choose if neither femoral pulse were palpable, if the patient had an axillofemoral graft, and if a known aneurysm contained thrombus.",
        },
        { kind: "video", id: "nM6rAOygua8", note: "Peripheral arterial disease part 1: general concepts." },
        { kind: "video", id: "AKfhIOfzisM", note: "Lower-extremity PAD interventions: general approach, techniques and devices." },
        { kind: "video", id: "etidipETk7M", note: "Abdominal aortic aneurysm: endovascular therapy versus surgery." },
        { kind: "video", id: "XUKD5cV7EpY", note: "Percutaneous management of venous diseases." },
        {
          kind: "keypoints",
          items: [
            "Peripheral, aortic and venous intervention is outside CathMaster; the 2024 ESC guideline on peripheral arterial and aortic diseases is the current European reference.",
            "Neither femoral pulse palpable: go radial; one side weaker: suspect an upstream occlusion; ultrasound for every puncture (Brilakis), especially with weak pulses.",
            "Axillofemoral graft: the aorta may be occluded; do not puncture synthetic (polyester) grafts.",
            "Wire looping or swinging laterally in the abdomen: suspect an aneurysm; thrombus on ultrasound rules out the femoral route.",
            "Coarctation lies just beyond the left subclavian; consider radial or femoral-plus-radial access; the current ESC threshold for repair (20 mmHg peak-to-peak in hypertensive patients) is lower than Oxford's 50 mmHg.",
            "Severe peripheral disease limits large-bore support devices; an aortic aneurysm contraindicates the balloon pump.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-background-q1",
      stem: "In a left-dominant circulation (the circumflex gives the PDA), an RAO 30° ventriculogram shows an akinetic basal and mid inferior wall with a normal apex. Which artery is most likely responsible?",
      options: [
        "The RCA, because it supplies the inferior wall in about 85% of people",
        "The LAD, because its terminal part wraps round the apex onto the inferior wall",
        "The circumflex, because here it gives the PDA that supplies the inferior wall",
        "A septal branch of the LAD, because septals supply the inferior third of the septum and wall",
      ],
      answer: 2,
      explanation:
        "Dominance is defined by the artery giving the PDA, which supplies the inferior wall; Oxford gives the circumflex as dominant in 8%. Here the PDA comes from the circumflex, so the circumflex is the likely culprit. The RCA answer applies the 85% figure without reading the dominance; a wrapping LAD would involve the apex, which is normal. The LAD septals supply the anterior two-thirds of the septum; the inferior third comes from the PDA.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-background-q2",
      stem: "During temporary pacing the wire looks acceptable on the AP view but sits higher than expected, and capture is intermittent. Which finding on a lateral view shows that it is in the coronary sinus?",
      options: [
        "The tip runs anteriorly, towards the sternum",
        "The tip runs posteriorly, towards the spine",
        "The tip forms a sock shape with the heel in the atrium",
        "The tip sits a little medial to the apex of the heart's outline",
      ],
      answer: 1,
      explanation:
        "Oxford: the coronary sinus opens just above the tricuspid valve; a wire there looks more cranial on AP and runs posteriorly on a lateral view, whereas an RV lead runs anteriorly. The sock shape and the position just medial to the apex of the silhouette are the signs of a correct RV apical position.",
      difficulty: 1,
      refs: OXFORD,
    },
    {
      id: "hb-background-q3",
      stem: "You are looking for an unknown vein graft to a diagonal branch from the femoral route with a JR4. According to Oxford, where on the aorta should you search first, and how do you confirm the catheter is facing the right way?",
      options: [
        "Low on the posterior wall near the non-coronary sinus, confirming in an LAO cranial view",
        "On the anterior wall just above the left coronary ostium, checking in RAO that the tip points anteriorly",
        "High on the anterior wall above the circumflex grafts, checking in a left lateral view that the tip points posteriorly",
        "Just above and in front of the native RCA, checking in an AP caudal view that the tip points to the right",
      ],
      answer: 1,
      explanation:
        "Oxford places LAD and diagonal grafts just above the left coronary ostium on the anterior aortic wall, engaged with gentle clockwise rotation in LAO, and finds the RAO view useful to confirm the catheter is directed anteriorly. The highest grafts are usually to the circumflex; a graft just above and in front of the native RCA is an RCA graft.",
      difficulty: 3,
      refs: OXFORD,
    },
    {
      id: "hb-background-q4",
      stem: "In Jia's 2013 OCT series of ACS culprit lesions, which combination described plaque erosion compared with plaque rupture?",
      options: [
        "Older patients, thinner fibrous caps, more STEMI and more severe diameter stenosis",
        "Older patients, protruding calcium, all NSTE-ACS and more hypertension and kidney disease",
        "Younger patients, thicker caps, less lipid, more NSTE-ACS and less severe stenosis",
        "Younger patients, thinner caps, larger lipid arcs, more red thrombus and more STEMI",
      ],
      answer: 2,
      explanation:
        "Erosion patients were the youngest (mean 53.8 years), more often had NSTE-ACS (61.5% versus 29.1%), had lipid plaque less often (43.6% versus 100%), thicker caps (about 169 versus 60 μm) and the least severe stenosis (about 55%). Protruding calcium in older patients with NSTE-ACS describes the calcified nodule.",
      difficulty: 2,
      refs: ["jia-oct-erosion-2013"],
    },
    {
      id: "hb-background-q5",
      stem: "A diffusely diseased LAD has no clearly normal segment, and the narrowest point is read as a 50% stenosis. Which statement best describes the likely error?",
      options: [
        "Overestimated, because diffuse disease makes the narrowest point look worse than it really is",
        "Underestimated, because the diseased reference segment looks smaller than it really is",
        "No error is likely, because percent stenosis does not depend on the state of the reference segment",
        "Overestimated, because outward remodelling makes the reference segment look larger than it is",
      ],
      answer: 1,
      explanation:
        "Percent stenosis is measured against a 'normal' reference; Oxford notes that diffuse atherosclerosis makes the vessel appear smaller than it is, so the narrowing is understated. (Separately, Oxford notes that incomplete views or eccentric lesions can understate severity by up to 50%.) Remodelling can make a vessel look larger, but here there is no normal segment and the diffuse disease shrinks the reference, so the dominant error is a reference that is itself narrowed and the lesion is understated.",
      difficulty: 3,
      refs: OXFORD,
    },
    {
      id: "hb-background-q6",
      stem: "A 38-year-old man has an inferior STEMI from a coronary embolus; he has atrial fibrillation and no atherosclerosis on imaging. Which label is correct under the fifth universal definition (2026)?",
      options: [
        "Type 2 MI, because the cause is not atherothrombosis",
        "Secondary MI, because atrial fibrillation upset the supply–demand balance",
        "Primary MI, because coronary embolism is an acute coronary pathology",
        "Procedure-related MI, because the embolus came from the heart",
      ],
      answer: 2,
      explanation:
        "The fifth definition counts embolism from a non-coronary source, like SCAD and vasospasm, as an acute coronary pathology of primary MI; the fourth definition had grouped these with supply–demand mismatch as type 2. Secondary MI is ischaemia from supply–demand imbalance without an acute coronary pathology, which is not the case when an embolus blocks the artery.",
      difficulty: 3,
      refs: ["mills-5udmi-2026", "thygesen-4udmi-2018"],
    },
    {
      id: "hb-background-q7",
      stem: "Under the fifth universal definition, which finding confirms a diagnosis of secondary myocardial infarction in a patient with sepsis and a troponin rise?",
      options: [
        "A troponin rise above five times the upper reference limit together with a persistent sinus tachycardia on the monitor and global ST depression on the ECG",
        "Chest discomfort with any rise and fall of troponin during the illness, whatever the coronary or cardiac imaging later shows",
        "Thrombus on a ruptured plaque in the artery that supplies the territory showing ECG changes",
        "Obstructive disease (≥70%, or ≥50% if flow-limiting) without an acute coronary pathology, or a new wall-motion abnormality or loss of viability",
      ],
      answer: 3,
      explanation:
        "Secondary MI is confirmed if the ischaemia results from obstructive coronary disease (a stenosis of 70% or more on angiography, or 50% or more that is flow-limiting on physiology) without an acute coronary pathology, or if the injury causes a new or presumed new regional wall-motion abnormality or loss of viable myocardium. Troponin and symptoms alone do not confirm it. Thrombus on a ruptured plaque would make it a primary MI, even in sepsis, which can itself trigger atherothrombosis.",
      difficulty: 3,
      refs: ["mills-5udmi-2026"],
    },
    {
      id: "hb-background-q8",
      stem: "A troponin-positive patient has no coronary stenosis of 50% or more. What does the fifth universal definition say about MINOCA?",
      options: [
        "A final diagnosis of infarction, so secondary prevention for MI should start at once without any further imaging",
        "Excluded when troponin stays below five times the upper reference limit, so no follow-up is needed",
        "Myocardial injury with non-obstructive coronary arteries: a working diagnosis, with cardiac MR ideally within 2 weeks",
        "A label that may be used only after myocarditis and takotsubo syndrome have both been excluded by endomyocardial biopsy",
      ],
      answer: 2,
      explanation:
        "MINOCA was renamed myocardial injury with non-obstructive coronary arteries because most such patients have a non-coronary cardiac or non-cardiac cause; it is a working diagnosis. MR, ideally within 2 weeks, confirms MI in 22–27% and more often finds myocarditis or takotsubo. Treating it as a final infarct diagnosis is the error the renaming was meant to prevent.",
      difficulty: 2,
      refs: ["mills-5udmi-2026"],
    },
    {
      id: "hb-background-q9",
      stem: "A patient on apixaban for atrial fibrillation needs an elective angiogram. His right radial pulse is good and his renal function is normal. Which plan is consistent with both manuals?",
      options: [
        "Femoral access with apixaban continued, because the femoral artery is easier to compress",
        "Radial access, with apixaban withheld beforehand for the time set by local protocol (Oxford 24 hours, Brilakis 2 days)",
        "Femoral access after stopping apixaban for 72 hours beforehand, the rule for every DOAC",
        "Radial access with apixaban continued unchanged and an unfractionated heparin infusion added on the night before the study",
      ],
      answer: 1,
      explanation:
        "Both manuals prefer radial access for patients on oral anticoagulants. Their elective holds differ: Oxford withholds DOACs for 24 hours (72 hours for dabigatran with renal impairment), while Brilakis's table holds apixaban for 2 days and adjusts the other DOACs by creatinine clearance (2–5 days). Neither stops every DOAC for 72 hours, and adding a heparin infusion to a continued DOAC has no basis in either manual. Local protocol and pm-antithrombotics-oac govern the details.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "hb-background-q10",
      stem: "During a femoral case, the J wire swings sharply to the left in the abdomen and then loops back on itself. The patient is a 74-year-old smoker. What is the most likely explanation, and the right response?",
      options: [
        "Iliac artery spasm: give intra-arterial nitrate through the sheath, wait two minutes, then push the wire through",
        "A renal artery branch: advance a hydrophilic wire firmly so that it straightens the course",
        "Coarctation of the aorta: measure the gradient across it and continue the case from the groin",
        "An unsuspected aortic aneurysm: image it, exchange only over a wire, consider a long sheath or the radial route",
      ],
      answer: 3,
      explanation:
        "Oxford: an undiagnosed aneurysm should be suspected when the wire or catheter loops back or deviates laterally in the descending aorta; exchanges should be made over a wire to avoid dislodging thrombus or disrupting the intima. Brilakis images the aneurysm, crosses with a suitable wire and places a long sheath once across, or plans radial access when an aneurysm is known. Driving a hydrophilic wire hard into a branch such as a renal artery is a recognised way to perforate it.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "hb-background-q11",
      stem: "A patient in cardiogenic shock after an anterior MI has severe bilateral iliac disease. Which statement about support devices matches Brilakis's comparison table?",
      options: [
        "Severe peripheral disease contraindicates the large-bore devices; transcaval access is listed for some of them",
        "Severe peripheral disease is no obstacle, because every support device can be inserted through the radial artery",
        "Severe peripheral disease matters only for the balloon pump, because it needs the largest arterial sheath",
        "An abdominal aortic aneurysm is the preferred route for a large-bore device in a patient with iliac disease",
      ],
      answer: 0,
      explanation:
        "In Brilakis's table severe peripheral arterial disease is listed as a contraindication for the microaxial pump, the left atrial-to-femoral bypass device and VA-ECMO, with transcaval access noted as an option; the balloon pump, which needs the smallest sheath, is contraindicated by a thoracic or abdominal aortic aneurysm. His shock algorithm includes assessing the peripheral vessels in MI with shock.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "hb-background-q12",
      stem: "In ISCHEMIA, patients with stable disease and moderate or severe ischaemia were randomised to an initial invasive or conservative strategy. Which statement reflects the published result?",
      options: [
        "The invasive strategy reduced cardiovascular death and MI by about a third over three years of follow-up",
        "The trial was stopped early by its monitoring board because the conservative strategy caused more deaths in the first year",
        "No reduction in ischaemic events or death over a median of 3.2 years; the result was sensitive to the MI definition",
        "The invasive strategy reduced deaths from any cause but increased admissions with heart failure",
      ],
      answer: 2,
      explanation:
        "ISCHEMIA (5179 patients) found no evidence that an initial invasive strategy reduced ischaemic cardiovascular events or death from any cause over a median of 3.2 years (145 versus 144 deaths), and the findings were sensitive to the definition of MI, with more procedural MIs of uncertain importance in one analysis. Events were more frequent with the invasive strategy early (5.3% versus 3.4% at 6 months) and less frequent late (16.4% versus 18.2% at 5 years). This matches Brilakis's point that revascularisation in stable disease is mainly for symptoms.",
      difficulty: 3,
      refs: ["ischemia-2020", "brilakis-manual-pci"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Cross the aortic valve with a pigtail, place it mid-cavity, and name the walls each ventriculogram view shows and the artery behind each wall." },
    { sim: "views", task: "Name each projection from the spine, then locate the circumflex as the left coronary branch nearest the spine." },
    { sim: "pci-bench", task: "Label OCT frames as fibrous, calcific or lipid-rich plaque or thrombus, and choose landing zones free of lipid." },
    { sim: "procedure", task: "Record both femoral and distal pulses before choosing the access route, and justify radial access for absent femoral pulses, an axillofemoral graft or an aneurysm with thrombus." },
  ],
  caseIds: ["hb-background-case-fast-af-troponin"],
};

// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "hb-background-case-fast-af-troponin",
    title: "A troponin rise in fast atrial fibrillation",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Fifth universal definition of MI (2026), sections 7.2.1–7.2.2; Oxford ch 1, 3, 6 and 10; Brilakis 2.6, 4.1, 7.2 and 13.1",
    },
    summary:
      "An older man with pneumonia and fast AF has a rising troponin. You decide when he needs the lab, plan access and contrast around his anticoagulant, kidneys and leg arteries, identify the diseased artery from the spine, and classify the infarct under the 2026 definition.",
    presentation:
      "A 76-year-old man was admitted two days ago with pneumonia. Overnight he went into atrial fibrillation at 150 per minute and became more breathless. He denies chest discomfort. High-sensitivity troponin T has risen between two samples, both above the sex-specific upper reference limit. He has known paroxysmal AF on apixaban, type 2 diabetes on metformin, and calf claudication at about 100 metres.",
    findings: [
      "Temperature 38.4 °C; blood pressure 102/64 mmHg; SpO2 93% on 2 L/min oxygen",
      "ECG: atrial fibrillation 150/min with widespread ST depression",
      "eGFR 41 mL/min/1.73 m²",
      "Both femoral pulses weak; right radial pulse strong",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The medical registrar asks you to take him to the lab tonight for an 'NSTEMI'. What do you advise?",
        options: [
          {
            text: "Treat the infection and control the rate, repeat the ECG and troponin, request an echo, and bring him to the lab if ischaemia persists or recurs",
            best: true,
            feedback:
              "This is possible secondary MI: injury during another acute illness that upsets supply and demand, most often a tachyarrhythmia. The 2026 definition reserves invasive angiography for persistent or recurrent ischaemia with primary MI in the differential; otherwise imaging waits until the illness is treated.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Take him to the lab tonight: a rising troponin with ST depression is a primary MI until proved otherwise",
            feedback:
              "Troponin cannot distinguish ischaemic from non-ischaemic injury, and global ST depression in fast AF and sepsis does not localise a culprit. Taking an unstable, febrile, breathless patient to the lab at night risks more than it is likely to find.",
            next: "c1",
            stateDelta: { stability: -10, flags: ["night-lab"] },
          },
          {
            text: "Record 'type 2 MI' in the notes and arrange no further cardiac assessment",
            feedback:
              "Under the 2026 definition 'type 2' no longer exists, and secondary MI cannot be confirmed from troponin and symptoms alone: it needs obstructive disease without an acute coronary pathology, or new wall-motion or viability changes on imaging. Sepsis can also trigger atherothrombosis, so primary MI stays in the differential.",
            stateDelta: { stability: -5, flags: ["no-cardiac-workup"] },
          },
        ],
      },
      {
        id: "c1",
        kind: "consequence",
        prompt: "On the table at 23:00 he is still in AF at 145 per minute, cannot lie flat, and his saturation falls to 88%. What now?",
        info: "Blood pressure 96/60 mmHg. Crackles at both bases.",
        options: [
          {
            text: "Stop before access: sit him up, give high-flow oxygen and an IV loop diuretic, treat the rate and the infection on the ward, and reconsider in the morning",
            best: true,
            feedback:
              "Pulmonary oedema is managed by sitting the patient up with high-flow oxygen and an IV loop diuretic (Oxford). Nothing in the angiogram tonight is worth adding contrast and lying flat to this picture.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Proceed quickly through the femoral artery to get the pictures before he deteriorates further",
            feedback:
              "Contrast in a breathless patient with fast AF invites pulmonary oedema, his femoral pulses are weak, and he is anticoagulated. Speed does not reduce any of these risks.",
            stateDelta: { stability: -15, flags: ["oedema"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Thirty-six hours later his rate is 82 per minute in AF, but the pneumonia is slow to settle: temperature 38.6 °C and SpO2 89% on 2 L/min oxygen. At rest he has 20 minutes of central chest tightness with new ST depression in V4–V6, relieved by GTN, and the troponin rises again. Echo shows an ejection fraction of 35% with inferolateral hypokinesis. What next?",
        options: [
          {
            text: "Invasive coronary angiography: ischaemia has recurred despite rate control, so primary MI remains in the differential",
            best: true,
            feedback:
              "Persistent or recurrent ischaemia with primary MI in the differential is exactly when the 2026 definition indicates invasive angiography. Hypoxia from the pneumonia is still a possible supply–demand trigger, but only the angiogram can separate a primary from a secondary MI here. Treat the hypoxia and the infection as well.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Arrange CT coronary angiography once he has recovered from the pneumonia",
            feedback:
              "Deferred non-invasive imaging is the path when ischaemia has settled and primary MI is unlikely. Recurrent rest ischaemia at a normal rate changes that.",
            stateDelta: { stability: -10, flags: ["delayed"] },
          },
          {
            text: "Increase the rate control and observe; the troponin reflects the sepsis",
            feedback:
              "His rate is already controlled, yet the ischaemia has come back with a regional pattern and a regional wall-motion abnormality. Correct the hypoxia, but waiting for angiography risks a larger infarct.",
            next: "c2",
            stateDelta: { stability: -15, flags: ["delayed"] },
          },
        ],
      },
      {
        id: "c2",
        kind: "consequence",
        prompt: "Six hours later he has further chest tightness with deeper lateral ST depression and a blood pressure of 88/52 mmHg. What do you do?",
        options: [
          {
            text: "Bring him to the lab now for angiography, with the team ready to support the circulation",
            best: true,
            feedback: "Recurrent ischaemia with falling pressure makes angiography urgent.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give a fluid bolus and repeat the troponin in the morning",
            feedback: "Another troponin will only confirm the injury; the recurrent ischaemia needs angiography now.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "He is booked for the lab. His last apixaban dose was 12 hours ago. How do you plan access and contrast?",
        info: "eGFR 41 mL/min/1.73 m². Both femoral pulses weak with claudication; right radial pulse strong. A good-quality echo was done this morning.",
        options: [
          {
            text: "Right radial access; keep contrast well below Brilakis's ceiling (3.7 × 41, about 150 mL); skip the ventriculogram because the echo has shown LV function",
            best: true,
            feedback:
              "Both manuals prefer radial access in anticoagulated patients; weak femoral pulses with claudication add a second reason. The ceiling of 3.7 × GFR is a maximum, lower in kidney disease, and a good echo makes a ventriculogram unnecessary while sparing contrast in a patient prone to pulmonary oedema. Hold his metformin: Oxford withholds it around every study, and Brilakis does so in kidney disease; with an eGFR of 41 during sepsis, recheck renal function afterwards before restarting it (follow local policy).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Femoral access with a closure device, for better guide support if PCI is needed",
            feedback:
              "Weak femoral pulses and claudication suggest iliofemoral disease, and he is anticoagulated; both favour the radial route. Oxford keeps the femoral route in anticoagulated patients for emergencies such as balloon pump insertion, and Brilakis warns that femoral access while anticoagulated raises the bleeding risk and needs meticulous technique.",
            next: "c3",
            stateDelta: { stability: -10, flags: ["femoral-attempt"] },
          },
          {
            text: "Delay until apixaban has been withheld for a full 24 hours, then proceed radially",
            acceptable: true,
            feedback:
              "Both manuals' holds (Oxford 24 hours for a DOAC, Brilakis 2 days for apixaban) are written for elective procedures. With recurrent ischaemia, the radial route lets you proceed without waiting; delay only if he is pain-free and stable.",
            stateDelta: { stability: -2 },
          },
        ],
      },
      {
        id: "c3",
        kind: "consequence",
        prompt: "The right femoral puncture is difficult under the weak pulse. The J wire stops in the external iliac artery and will not advance. What do you do?",
        options: [
          {
            text: "Do not push: transduce the sheath, image through a catheter brought up behind the wire, and if the iliac is diseased or occluded, change to the radial artery",
            best: true,
            feedback:
              "Brilakis's rule is never to force a wire against resistance: confirm an arterial trace, image the obstacle, and change access if crossing fails. The groin he leaves behind is an anticoagulated puncture, so watch it closely.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the wire harder and follow it with the sheath",
            feedback:
              "Forceful wire or sheath advancement is how iliac dissection and perforation happen, and he is anticoagulated.",
            stateDelta: { stability: -15, flags: ["iliac-injury"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The first left coronary run shows the spine on the left of the image. The branch running closest to the spine has a 90% stenosis in its mid portion. Which artery is it, and does it fit the echo?",
        options: [
          {
            text: "The circumflex, seen in RAO; its territory, the posterolateral wall, fits the inferolateral hypokinesis",
            best: true,
            feedback:
              "Spine on the left means RAO, and in every left coronary view the circumflex is the branch nearest the spine. The circumflex supplies the posterior wall and its marginals the lateral wall, matching the echo.",
            stateDelta: { stability: 3 },
          },
          {
            text: "The LAD, seen in LAO; it supplies the inferolateral wall",
            feedback: "Spine on the left is RAO, and the branch nearest the spine is the circumflex. The LAD supplies the anterior wall and apex.",
            stateDelta: { stability: -3, flags: ["misnamed"] },
          },
          {
            text: "A diagonal branch, seen in RAO; diagonals supply the inferior wall",
            feedback: "Diagonals run from the LAD towards the lateral wall and are not the branch nearest the spine.",
            stateDelta: { stability: -3, flags: ["misnamed"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "In orthogonal views the circumflex lesion looks smooth, without haziness or a filling defect. How do you decide whether it is the site of an acute coronary pathology?",
        options: [
          {
            text: "Image it intravascularly (OCT for resolution, or IVUS if contrast must be spared), looking for thrombus, rupture, ulceration or erosion",
            best: true,
            feedback:
              "Brilakis prefers OCT, with its higher resolution, to find or exclude a culprit; the 2026 definition likewise notes that angiography can miss the acute pathology and that OCT or IVUS can help. OCT clears the blood with contrast, which counts against his ceiling of about 150 mL; Brilakis prefers IVUS in chronic kidney disease because it needs no contrast.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Call it the culprit of a primary MI from the angiogram alone, because it is the tightest lesion",
            feedback:
              "Severity does not show mechanism. A tight stable stenosis can cause ischaemia in fast AF without any plaque rupture or thrombus.",
            stateDelta: { stability: -3, flags: ["unconfirmed"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "OCT shows a fibrocalcific plaque with a thick intact cap, a small lumen and no thrombus, rupture or erosion. How do you classify the event in the report?",
        options: [
          {
            text: "Secondary MI: supply–demand ischaemia from fast AF and then hypoxia in sepsis, on obstructive (90%) circumflex disease without an acute coronary pathology",
            best: true,
            feedback:
              "Secondary MI is confirmed when ischaemia from a supply–demand imbalance is the consequence of obstructive disease without an acute coronary pathology. The 90% stenosis meets the threshold (70% or more on angiography), OCT has excluded an acute pathology, and the triggers are named: fast AF at the first event and hypoxia from the pneumonia at the recurrence. The new regional wall-motion abnormality supports it too.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Type 2 MI",
            acceptable: true,
            feedback:
              "That was the fourth-definition label for this mechanism. Since 2026 the term is secondary MI; if you use the older term, say which definition you are applying.",
          },
          {
            text: "Primary MI due to atherothrombosis",
            feedback: "Primary MI needs an acute coronary pathology, and OCT has excluded thrombus, rupture and erosion.",
            stateDelta: { stability: -3, flags: ["misclassified"] },
          },
          {
            text: "Procedure-related MI",
            feedback: "Procedure-related MI follows a complication of a cardiac procedure within 30 days; the injury preceded any procedure here.",
            stateDelta: { stability: -3, flags: ["misclassified"] },
          },
        ],
      },
    ],
    outcome:
      "The report named a secondary MI from fast atrial fibrillation and then hypoxia in sepsis, on obstructive (90%) circumflex disease with no acute coronary pathology on OCT, with an ejection fraction of 35%. The revascularisation decision was left to the heart team once he had recovered (pm-target), and his anticoagulation and antiplatelet plan to pm-antithrombotics.",
    outcomeVariants: [
      { flag: "night-lab", text: "The night-time trip to the lab added a bout of pulmonary oedema and nothing diagnostic." },
      { flag: "oedema", text: "Contrast given while he was breathless and in fast AF precipitated pulmonary oedema that needed CPAP." },
      { flag: "no-cardiac-workup", text: "The early 'type 2' label nearly stopped the work-up; only the recurrent pain brought him to angiography." },
      { flag: "delayed", text: "The delay after the recurrent ischaemia let more injury accumulate before the artery was seen." },
      { flag: "femoral-attempt", text: "The femoral attempt cost time and left a groin to watch in an anticoagulated patient." },
      { flag: "iliac-injury", text: "Forcing the wire caused an iliac dissection that needed vascular review." },
      { flag: "misnamed", text: "Misnaming the artery would have sent the heart team the wrong territory; the spine rule prevents it." },
      { flag: "unconfirmed", text: "Without imaging, the lesion would have been labelled a culprit it was not." },
      { flag: "misclassified", text: "A wrong label in the report changes follow-up and the statistics the unit is judged on." },
    ],
    learningPoints: [
      "A troponin rise during another acute illness is possible secondary MI: treat the trigger, and take the patient to the lab when ischaemia persists or recurs with primary MI in the differential.",
      "Secondary MI is confirmed only by obstructive disease without acute pathology, or by new wall-motion or viability changes; troponin and symptoms are not enough.",
      "Anticoagulation and weak femoral pulses both point to radial access; set the contrast ceiling from the GFR and skip a ventriculogram that a good echo has made unnecessary.",
      "Name the projection from the spine, then find the circumflex as the left coronary branch nearest the spine.",
      "Severity is not mechanism: OCT shows whether a lesion carries an acute coronary pathology.",
      "Write the 2026 setting and mechanism in the report, and if you use the old numbers, say which definition you mean.",
    ],
    refs: [...BOOKS, "mills-5udmi-2026"],
  },
];

// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "diag-bg-wall-to-territory",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"] },
    title: "Read each akinetic wall as a coronary territory",
    text: "Translate the ventriculogram into arteries: anterior wall and apex to the LAD (which often wraps onto the inferior wall), inferior wall to the PDA (from the RCA in about 85%), posterolateral wall to the circumflex. Then check that the angiogram tells the same story.",
    tone: "do",
    lessonId: "hb-background-silhouette",
    sources: [O("ch 4: Ventriculography"), O("ch 6: Coronary anatomy")],
    refs: OXFORD,
  },
  {
    id: "diag-bg-name-view-first",
    lab: "diagnostic",
    when: { phase: ["views", "inject"] },
    title: "Name the view from the spine, then find the circumflex",
    text: "Before naming any branch, name the projection: spine on the image left means RAO, on the right LAO. In every left coronary view, the branch nearest the spine is the circumflex.",
    tone: "do",
    lessonId: "hb-background-depth",
    sources: [O("ch 6: Tips for interpretation")],
    refs: OXFORD,
  },
  {
    id: "diag-bg-depth-second-view",
    lab: "diagnostic",
    when: { phase: ["engage-graft", "views"] },
    title: "Front or back needs a second view",
    text: "One projection cannot show whether a tip points forwards or backwards. For left-sided vein grafts Oxford checks in RAO that the tip is directed anteriorly (for a circumflex graft, away from the spine); for any doubt, film a second view roughly 90° from the first.",
    tone: "do",
    lessonId: "hb-background-depth",
    sources: [O("ch 6: Quantification of stenoses"), O("ch 7: Saphenous vein grafts")],
    refs: OXFORD,
  },
  {
    id: "pci-bg-lipid-embolisation-forecast",
    lab: "pci",
    when: { phase: ["imaging", "lesion-prep"] },
    title: "Lipid core or big thrombus on imaging: expect embolisation",
    text: "A large lipid core plaque or a large thrombus on intravascular imaging marks a lesion at higher risk of distal embolisation. Prepare for slow flow before you dilate; Brilakis manages plaque embolisation with aspiration and vasodilators.",
    tone: "caution",
    lessonId: "hb-background-plaque",
    sources: [B("13.1"), B("25.2")],
    refs: BRILAKIS,
  },
  {
    id: "diag-bg-secondary-mi-question",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Troponin during another illness: is ischaemia persisting?",
    text: "Before an urgent study for a troponin rise in sepsis, bleeding or fast AF, review the notes, as Oxford asks before every study, to confirm it is still indicated, and ask whether ischaemia is persisting or recurring. That is what makes invasive angiography indicated under the 2026 definition; otherwise treat the trigger and image after recovery.",
    tone: "caution",
    lessonId: "hb-background-mi",
    sources: [O("ch 1: Catheter laboratory preparation")],
    refs: ["mills-5udmi-2026", "oxford-cath-handbook"],
  },
  {
    id: "diag-bg-minoca-working",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Non-obstructive arteries with a raised troponin: a working diagnosis",
    text: "If no stenosis reaches 50%, report MINOCA as myocardial injury with non-obstructive coronary arteries, a working diagnosis, and recommend cardiac MR, ideally within 2 weeks, to find the cause.",
    tone: "do",
    lessonId: "hb-background-mi",
    sources: [O("ch 5: Myocardial infarction with non-obstructed coronary arteries"), B("7.2")],
    refs: ["mills-5udmi-2026", "oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "diag-bg-contrast-heart-failure",
    lab: "diagnostic",
    when: { event: ["high-contrast-volume"] },
    title: "Weak ventricle, tight valve or dialysis: count every millilitre",
    text: "Pulmonary oedema from contrast is most likely with LV impairment, a raised LVEDP, severe aortic or mitral stenosis and dialysis-dependent renal failure. Skip a ventriculogram that a good echo has answered. If oedema starts: sit the patient up, give high-flow oxygen and an IV loop diuretic, add IV nitrates if the systolic pressure is above 100 mmHg, use CPAP, consider a balloon pump, and admit for monitoring; remember that a contrast reaction or ischaemia can also cause it.",
    tone: "caution",
    lessonId: "hb-background-general",
    sources: [O("ch 10: Pulmonary oedema"), O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "haemo-bg-af-in-lab",
    lab: "haemo",
    when: { phase: ["right-heart"] },
    title: "If AF starts in the right heart: most episodes stop",
    text: "Atrial irritation during right heart catheterisation can start AF (so can ischaemia or pericarditis), and most episodes end on their own. With severe compromise (Oxford lists a rate above 150, hypotension, pulmonary oedema, ischaemia or a reduced conscious level), Oxford gives high-flow oxygen and IV heparin, then a synchronised shock under sedation or general anaesthesia. With milder compromise it gives heparin, then flecainide if there is no structural heart disease or pulmonary oedema, or amiodarone as a less effective alternative.",
    tone: "caution",
    lessonId: "hb-background-general",
    sources: [O("ch 10: Arrhythmia")],
    refs: OXFORD,
  },
  {
    id: "pci-bg-surgery-adherence",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Ask about surgery and adherence before the stent",
    text: "If non-cardiac surgery is likely within 6–12 months, or the patient may not take the antiplatelet drugs, Brilakis advises avoiding a stent if possible, because surgery and early interruption of dual antiplatelet therapy invite stent thrombosis; medical therapy or CABG may serve better. Check the timing against the 2022 ESC guideline (elective surgery deferred 6 months after elective PCI, 12 months after an ACS) and local practice.",
    tone: "caution",
    lessonId: "hb-background-general",
    sources: [B("1.1"), B("10.2")],
    refs: ["brilakis-manual-pci", "esc-ncs-2022"],
  },
  {
    id: "access-bg-pulses-both-groins",
    lab: "access",
    when: { phase: ["plan"] },
    title: "Feel both groins and the feet before choosing",
    text: "Record both femoral pulses and the distal pulses before choosing the route. If neither femoral pulse is palpable, go radial; if one is weaker, suspect an occlusion above it. Brilakis recommends ultrasound for every puncture, and especially when pulses are weak.",
    tone: "do",
    lessonId: "hb-background-peripheral",
    sources: [O("ch 1: Patient preparation"), O("ch 3: Which arterial access route to use?"), B("2.7"), B("4.2"), B("5.2")],
    refs: BOOKS,
  },
  {
    id: "access-bg-axillofemoral",
    lab: "access",
    when: { phase: ["plan"], route: ["femoral"] },
    title: "Axillofemoral graft: the groin may lead nowhere",
    text: "An axillofemoral graft may mean the abdominal aorta is occluded, so a femoral approach can be pointless even with a good pulse. Do not puncture a synthetic (polyester) peripheral graft for a coronary study; use the arm.",
    tone: "caution",
    lessonId: "hb-background-peripheral",
    sources: [O("ch 3: Which arterial access route to use?")],
    refs: OXFORD,
  },
  {
    id: "access-bg-aaa-thrombus",
    lab: "access",
    when: { phase: ["plan"], route: ["femoral"] },
    title: "Known aortic aneurysm: thrombus rules out the groin",
    text: "No aneurysm size forbids the femoral route, but thrombus seen on ultrasound does, because of embolisation to the kidneys and legs. Brilakis plans radial access when an abdominal aneurysm is known.",
    tone: "caution",
    lessonId: "hb-background-peripheral",
    sources: [O("ch 3: Which arterial access route to use?"), B("5.2")],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "mazzolai-esc-pad-aortic-2024",
    kind: "guideline",
    citation:
      "Mazzolai L, Teixido-Tura G, Lanzi S, et al. 2024 ESC Guidelines for the management of peripheral arterial and aortic diseases. Eur Heart J. 2024;45(36):3538–3700.",
    url: "https://doi.org/10.1093/eurheartj/ehae179",
    note: "PMID: 39210722. Checked on PubMed: authors, title, journal, year (September 2024), volume 45, issue 36, pages 3538–3700; practice guideline, no abstract on PubMed. Used only as the current European reference covering peripheral arterial and aortic diseases (PubMed keywords include lower extremity artery disease, carotid and renal artery disease, aortic aneurysm, acute aortic syndromes and polyvascular disease); no specific recommendation is quoted from it.",
    verified: true,
  },
  {
    id: "velazquez-stiches-2016",
    kind: "trial",
    citation:
      "Velazquez EJ, Lee KL, Jones RH, et al. Coronary-artery bypass surgery in patients with ischemic cardiomyopathy. N Engl J Med. 2016;374(16):1511–1520.",
    url: "https://doi.org/10.1056/NEJMoa1602001",
    note: "PMID: 27040723 (PMC4938005). Checked on PubMed: authors, title, journal, year, volume 374, issue 16, pages 1511–1520. Abstract read: STICH extended follow-up (STICHES), 1212 patients with ejection fraction 35% or less and coronary disease amenable to CABG; death from any cause 58.9% with CABG plus medical therapy versus 66.1% with medical therapy alone (HR 0.84, 95% CI 0.73–0.97) over a median of 9.8 years.",
    verified: true,
  },
];
