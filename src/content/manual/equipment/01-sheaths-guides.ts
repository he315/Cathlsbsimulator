// Module eq-sheaths-guides: sheaths, guide length and guide extensions (manual curriculum, track equipment).
// Sources: Brilakis, Manual of PCI, chapter 30 (30.1 sheaths, 30.2 catheters including 30.2.3 length and 30.2.4
// shortening, 30.3 guide catheter extensions; the rest of the chapter read for context), chapter 21 (CTO: access,
// engagement, reverse CART), 23.1 (balloon-uncrossable lesions, guide extension), with related passages in 4.1-4.3
// (sheath insertion), 5.2-5.7 (long sheaths, sheathless guides, failure to reach the root), 6.6, 8.4, 8.9, 9.7, 10.2,
// 14.4, 15.1, 16.1, 18.5, 18.8, 18.10, 19.9, 20.8, 24.1, 25.2, 27.1, 27.3, 28.2 and 29.2; Oxford Handbook of Cardiac
// Catheterization and Coronary Intervention, chapter 3 (radial and femoral access), chapter 4 (Equipment; Catheters),
// chapter 6 (Choice of catheters), chapter 8 (Guiding catheters; Specific techniques in complex PCI) and chapter 10
// (Limb ischaemia; Left main stem dissection).
// Every claim is listed with its page in docs/curriculum/evidence/eq-sheaths-guides.md.
// Related modules: pm-access (sheath insertion and site choice), pm-to-the-root (long sheaths for iliac problems),
// pm-wiring (guide shapes and side holes), pm-prep-and-stent (support escalation), cp-uncrossable (inchworming in
// depth), cp-cto-retrograde and cp-prior-cabg (reach through grafts and collaterals).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_RADIAL = O("ch 3: Radial artery access");
const O_FEMORAL = O("ch 3: Femoral artery access");
const O_EQUIP = O("ch 4: Equipment");
const O_CATHS = O("ch 4: Catheters");
const O_CHOICE = O("ch 6: Choice of catheters");
const O_GUIDES = O("ch 8: Guiding catheters");
const O_COMPLEX = O("ch 8: Specific techniques in complex PCI");
const O_LIMB = O("ch 10: Limb ischaemia");
const O_LMS = O("ch 10: Left main stem dissection");

export const module: Module = {
  id: "eq-sheaths-guides",
  title: "Sheaths, guides and guide extensions",
  stage: 3,
  summary:
    "The tubes that every other device travels through. How sheath size is measured and how much artery a sheath occupies; when a long sheath, a long or thin-walled radial sheath, or no sheath at all is the better choice; how a guide extension is built, sized and used, step by step from the stent that will not go, with every complication and its bail-out; and how guide length decides what can reach the lesion, including how to shorten a guide by hand when nothing shorter is on the shelf.",
  objectives: [
    "Convert French sizes to millimetres, explain why a sheath's outer diameter matches a guide two sizes larger, and calculate the share of an artery's lumen a sheath occupies.",
    "Choose sheath size for the procedure, the planned devices and the artery, and name the complications that rise with sheath size at the femoral and radial sites.",
    "Choose a sheath length from where its tip will lie, use long femoral sheaths for tortuosity, disease, stents, obesity and support, and weigh the opposing advice on long radial sheaths.",
    "Describe four ways to place a guide without a sheath and say when each helps.",
    "Describe how a guide extension is built, match its size to the guide and to the devices it must carry, and list its uses beyond stent delivery.",
    "Deliver a device through a guide extension step by step, recognise each of its complications early, and perform the bail-outs.",
    "Choose guide length for the reach required, use shaft markers correctly with 90 cm and shortened guides, and shorten a guide by the cut-and-connect technique.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "eq-sheaths-guides-sizing",
      title: "Sheath size: what French measures and how much artery a sheath fills",
      minutes: 14,
      topics: ["eq-sheaths"],
      sources: [B("30.1"), B("30.2"), B("4.1"), B("4.2"), B("4.3"), B("14.4"), B("21"), B("27.1"), B("29.2"), O_RADIAL, O_FEMORAL, O_CATHS, O_CHOICE, O_LIMB],
      refs: [...BOOKS, "esc-acs-2023", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Every wire, catheter and device in a case passes through the sheath, so its size sets the upper limit of what you can do. It also sits inside the patient's artery for the whole procedure. The larger it is, the more lumen it takes up, and Brilakis links that directly to limb ischaemia and arterial thrombosis at the femoral site; at the wrist, a sheath that is large for the artery is a cause of both radial spasm and radial artery occlusion (29.2). Choosing a sheath therefore means knowing exactly what the number on the packet measures.",
        },
        {
          kind: "steps",
          title: "Reading a sheath label, step by step",
          items: [
            {
              title: "1. The French number describes the catheter that fits",
              detail: "One French is 0.33 mm. A sheath is labelled by the outer diameter of the catheter it accepts, so a 6 Fr sheath takes a catheter 2.0 mm across, a 7 Fr sheath one of 2.33 mm and an 8 Fr sheath one of 2.67 mm (Brilakis 30.1.1.1). Oxford uses the same scale: smaller numbers, smaller catheters.",
            },
            {
              title: "2. The bore must be wider than that catheter",
              detail: "To let a catheter through, the sheath's internal diameter has to exceed the catheter's outside. Brilakis's example is a standard 6 Fr femoral sheath whose bore is 2.22 mm, narrowing to 2.06 mm at the tip: both larger than the 2.0 mm of a 6 Fr catheter.",
            },
            {
              title: "3. Add the wall: the outside is about two French bigger",
              detail: "Because the wall surrounds that bore, a sheath's outer diameter is roughly that of a guide two sizes up. A 6 Fr sheath measures 2.62 mm outside, close to the 2.67 mm of an 8 Fr guide. This is the whole argument for sheathless guides (next lesson): drop the sheath and the same hole in the artery can carry a bigger guide.",
            },
            {
              title: "4. Thin walls trim the outside, not the bore",
              detail: "Thin-walled sheaths keep the inner size and shave the outer: about 2.14 mm instead of 2.29 mm at 5 Fr, 2.44 mm instead of 2.62 mm at 6 Fr and 2.79 mm instead of 2.95 mm at 7 Fr (Brilakis Table 30.2). They go in more easily and cause less spasm, but they kink more readily.",
            },
          ],
        },
        {
          kind: "formula",
          name: "Share of the arterial lumen a sheath occupies",
          expr: "fraction of lumen = (sheath outer diameter ÷ artery diameter)²",
          note: "Area scales with the square of diameter. Worked with the manual's outer diameters in a 6 mm femoral artery: 5 Fr, (2.29 ÷ 6)² ≈ 15%; 6 Fr, (2.62 ÷ 6)² ≈ 19%; 7 Fr, (2.95 ÷ 6)² ≈ 24%. Brilakis's Fig. 30.2 shows the same 6 mm artery: 24.2% for 7 Fr, 30.6% for 8 Fr, 38.6% for 9 Fr, 53.5% for 10 Fr and 64.8% for 11 Fr. Its labels for 5 Fr (11.1%) and 6 Fr (14.5%) are lower than the calculation from the manual's own outer diameters, so trust the arithmetic for those two.",
        },
        {
          kind: "check",
          stem: "A standard 6 Fr sheath (outer diameter 2.62 mm) sits in a common femoral artery 6 mm across. Roughly what share of the lumen does it fill?",
          options: ["About 7%", "About 19%", "About 30%", "About 44%"],
          answer: 1,
          explanation:
            "The share of the cross-section is the square of the diameter ratio: (2.62 ÷ 6)² ≈ 0.19. The 44% figure is the diameter ratio (2.62 ÷ 6) without squaring, the classic error. About 30% is roughly what an 8 Fr sheath occupies in the same artery, and 7% would need a sheath far thinner than any 6 Fr device. (The printed figure labels are discussed in the formula note above.)",
        },
        { kind: "h", text: "Which size for which job" },
        {
          kind: "table",
          caption: "Sheath sizes the manuals give, by job (Brilakis 30.1, 30.2.2, 21.5; Oxford chapters 3, 4 and 6)",
          head: ["Job", "Brilakis", "Oxford", "What drives the size"],
          rows: [
            ["Diagnostic angiography, femoral", "4–6 Fr; a 4 Fr system often needs a power injector", "4 or 5 Fr femoral sheaths; diagnostic catheters 4–6 F", "Smaller catheters need more injection force and are floppier with less torque, but the smaller sheath and puncture allow earlier mobilisation and fewer vascular complications (Oxford)"],
            ["Routine PCI", "5–8 Fr; most PCI can be done through 6 Fr guides", "6 F arterial sheaths typical; catheters usually 4–8 F, typically 6 F", "The guide that the planned devices need"],
            ["Complex PCI", "7–8 Fr preferred; larger guides give more support and better pictures; 5 Fr guides are best avoided for complex lesions, because a small guide leaves little room to pull back a stent that has been deformed (27.1)", "7 or 8 F for complex intervention", "Simultaneous devices (some two-stent techniques need 7 Fr), a 2.0 mm rotational burr (7 Fr guide), CTO work (7–8 Fr guides; 6 Fr limits IVUS-guided cap puncture and complication management)"],
            ["Radial", "5 or 6 Fr most often; 7 or 8 Fr can often go into a larger radial; a 4 Fr sheath for a diagnostic study, or a thin-walled sheath, is preferred for its lower profile and lower spasm risk", "Radial sheaths generally 5 or 6 F, short or long, sometimes hydrophilic", "Radial artery size on ultrasound, and the plan; the distal radial is smaller and limits sheath size"],
            ["Support devices", "Balloon pump 7–9 Fr (or no sheath); microaxial pump 13 Fr or 14 Fr for its two percutaneous models (30.1.1.1), while the largest model is placed by surgical cut-down and needs 21 Fr (Table 14.1); VA-ECMO cannulae 15–19 Fr arterial, 25 Fr venous", "—", "The device; large-bore access is taught in pm-access and the support-device modules"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's chapter on complications adds the other side of the trade at the wrist: transient radial occlusion after a procedure is reported in up to 7–8%, usually silent because the ulnar artery takes over, while forearm compartment syndrome is very rare, and large sheath size is one of its listed risk factors. At the groin, lower limb ischaemia is mostly tied to closure devices used for large femoral sheaths. Brilakis's radial complication section names a sheath that is big for the size of the radial artery as a cause of occlusion, of spasm and of radial pseudoaneurysm (29.2.2, 29.2.3, 29.2.4). His preventive measures follow: to limit bleeding, avoid a sheath that is large for the radial, whose size ultrasound can measure; against spasm, the thinnest-walled sheath of the smallest diameter possible; against pseudoaneurysm, the smallest sheath possible.",
        },
        { kind: "tip", id: "access-sheath-plan-size" },
        {
          kind: "steps",
          title: "Choosing the sheath, in order",
          items: [
            { title: "1. Start from the devices", detail: "List what must pass: guide size for the planned work, simultaneous balloons or stents, an imaging catheter, an atherectomy burr. Brilakis points to a compatibility app for checking what fits in 6, 7 and 8 Fr guides; the next lessons explain the numbers behind it." },
            { title: "2. Measure the artery", detail: "At the wrist, ultrasound gives the radial diameter and lets you put the sheath's outer diameter beside it (step 3 above). A radial too small for the plan is a reason to use the ulnar, the other radial or the femoral artery rather than force a sheath in." },
            { title: "3. Take the smallest sheath that carries the plan", detail: "For radial work a thin-walled sheath where possible, or a 4 Fr sheath when the study is diagnostic only. Wet a hydrophilic sheath in saline before use to activate its coating (Brilakis 4.3.8)." },
            { title: "4. If the plan needs more than the artery allows", detail: "Change site, or go sheathless (next lesson). At the femoral site, extra bore is easier: for complex PCI Brilakis favours at least one femoral access, often 7 or 8 Fr. That is an operator preference. ESC guidance makes radial access the standard unless procedural considerations override it (2023 ACS and 2024 chronic coronary syndrome guidelines; taught in pm-access), and Brilakis notes radial and biradial access rising in CTO work (21.4); a larger guide from the wrist means a thin-walled radial sheath or a sheathless guide." },
            { title: "5. Treat the sheath as part of the circulation", detail: "Aspirate the side arm and discard the blood, then flush with a separate syringe of heparinised saline, before each guide goes in: thrombus that forms in a sheath is picked up by the next catheter (4.2.14, 5.4)." },
          ],
        },
        { kind: "tip", id: "access-root-sheath-aspirate-flush" },
        {
          kind: "check",
          stem: "Which statement about a 6 Fr sheath is correct?",
          options: [
            "Its outer diameter is 2.0 mm, the same as a 6 Fr guide catheter",
            "It accepts a 2.0 mm catheter, and its outside is close to that of an 8 Fr guide",
            "It accepts a catheter of up to 2.62 mm, because that is its outer size",
            "Its bore is 1.8 mm, the same as the lumen of a 6 Fr guide catheter",
          ],
          answer: 1,
          explanation:
            "The French number names the catheter the sheath accepts (6 Fr = 2.0 mm). The wall adds to that, so the sheath measures 2.62 mm outside, close to the 2.67 mm of an 8 Fr guide. The 2.62 mm figure is the outside, not the bore; and 1.8 mm is the lumen of a 6 Fr guide, not of the sheath, whose bore must be larger than 2.0 mm to let the guide in.",
        },
        { kind: "h", text: "Problems that belong to the sheath" },
        {
          kind: "table",
          head: ["Problem", "Why it happens", "What to do"],
          rows: [
            ["Bleeding around a femoral sheath", "Bleeding from the arteriotomy around the sheath; Brilakis lists injury to the arterial wall as the sheath goes in among the causes of access bleeding", "Change to a larger sheath (Brilakis 4.2.15.3). Bleeding from a branch (coils or thrombin), a covered stent or surgery belong to other sources of bleeding, taught in the access complications module; an expanding haematoma is not ooze"],
            ["Radial spasm or occlusion", "Sheath large for the artery, among other causes", "Smallest thin-walled sheath, vasodilator after insertion, ultrasound sizing; for occlusion, anticoagulation and patent haemostasis (pm-access, pm-closure)"],
            ["Thrombus or debris injected from the sheath", "Clot forms in a sheath that is not aspirated", "Aspirate and discard, then flush with a separate syringe; never reinject what you aspirated"],
            ["A red (erythematous) nodule at the radial puncture site, sometimes with sterile discharge", "Sterile granuloma: a foreign-body reaction to the sheath polymer, commoner with one earlier-generation hydrophilic radial sheath but still possible with current ones; it can later lead to a delayed pseudoaneurysm", "First exclude infection (and a pseudoaneurysm, which ultrasound confirms if the swelling is pulsatile), because the diagnosis is clinical once infection is ruled out. Then it usually settles; a steroid cream may help; excision if the nodule persists. Prevention: avoid the earlier-generation hydrophilic sheath linked to it (Brilakis 29.2.4, 29.2.5)"],
            ["Sheath will not advance", "Poorly prepared track, scar, damaged sheath tip, wire kink", "Taught step by step in pm-access: nick and dilate the track, inspect or downsize the sheath, pass the dilator alone first, exchange for a stiffer 0.035 in. wire"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Squaring forgotten: an 8 Fr sheath is not 'a third bigger' than a 6 Fr sheath in its effect on the artery; the occupied area rises from about a fifth to nearly a third of a 6 mm femoral lumen.",
            "Reading the French number as the sheath's outside diameter; the outside is about two sizes larger.",
            "Choosing radial sheath size by habit rather than by the artery on ultrasound.",
            "Upsizing the guide mid-case because the plan was not thought through: Oxford stresses anticipating rotational atherectomy or complex two-stent work so that the guide need not be changed half way.",
            "Reinjecting aspirated sheath contents through the same syringe.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the sheath in three numbers: what it accepts (the French label), what it occupies (its outer diameter, about two sizes up), and what fraction of the artery that is (the square of the ratio). The third number is the one the patient's artery feels.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "At the sheath stage of a radial case, choose the sheath for a planned 6 Fr PCI: compare a standard and a thin-walled 6 Fr sheath by outer diameter, wet the hydrophilic sheath before insertion, then aspirate and flush the side arm with separate syringes before the guide goes in.",
        },
        { kind: "video", id: "4szvqsnKMA0", note: "Brilakis's Manual of PCI chapter video on sheaths." },
        {
          kind: "keypoints",
          items: [
            "1 Fr = 0.33 mm; the label is the catheter the sheath accepts (6 Fr = 2.0 mm).",
            "A sheath's outside is about two French larger: 6 Fr sheath 2.62 mm, 8 Fr guide 2.67 mm.",
            "Lumen share = (outer diameter ÷ artery diameter)²: about 19% for 6 Fr, 24% for 7 Fr in a 6 mm femoral artery; 8 Fr about 31% and 11 Fr about 65% in the manual's figure.",
            "Thin-walled sheaths: smaller outside, easier entry, less spasm, more kinking.",
            "Sizes: diagnostic 4–6 Fr; PCI 5–8 Fr (6 Fr typical); complex 7–8 Fr; radial 5–6 Fr, 7–8 Fr only in larger arteries.",
            "Large sheath for the artery: limb ischaemia and thrombosis (femoral); spasm, occlusion and pseudoaneurysm (radial). Bleeding around a femoral sheath: change to a larger sheath.",
            "Aspirate and discard, then flush with a different syringe, before each guide.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-sheaths-guides-long-sheathless",
      title: "Long sheaths, radial sheath length and working without a sheath",
      minutes: 14,
      topics: ["eq-sheaths"],
      sources: [B("30.1"), B("4.1"), B("4.2"), B("4.3"), B("5.2"), B("5.3"), B("5.4"), B("5.7"), B("14.4"), B("21"), B("29.2"), O_RADIAL, O_COMPLEX],
      refs: [...BOOKS, "reifart-parallel-sheath-2014", "esc-acs-2023", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "The standard femoral sheath is 10 cm long. A longer sheath straightens the path the guide must follow and gives it something to push against, so Brilakis credits long sheaths with better guide support and torque response. At the wrist the arguments run the other way, and the two manuals and even two chapters of Brilakis's book give different advice. When the artery is too small for the guide, the sheath can be left out altogether. Oxford lists difficult vascular access and peripheral vascular disease among the patient features that make PCI complex; this lesson is the equipment answer to that problem.",
        },
        {
          kind: "table",
          caption: "Femoral sheath length and where its tip usually lies (Brilakis 30.1.1.2, Fig. 30.3)",
          head: ["Length", "Tip usually reaches", "Used for"],
          rows: [
            ["10 cm", "The origin of the internal iliac artery", "Most cases"],
            ["25 cm", "The distal aortic bifurcation", "25 or 45 cm (4.2.13): iliac tortuosity, iliac stents, obesity (where a 10 cm sheath can fall short of the artery), extra guide support; 25–55 cm sheaths against catheter kinking (5.4)"],
            ["45 cm", "About the level of the diaphragm", "As for 25 cm; the length Brilakis names for support in complex and CTO PCI (4.1, 21.4), and the one he shows placed across an abdominal aortic aneurysm once a wire had crossed it (Fig. 5.6)"],
            ["45 or 55 cm", "Beyond an iliac stenosis", "A severe iliac stenosis, crossed by the sheath before the catheter follows (Brilakis 5.3.3.2)"],
          ],
        },
        { kind: "tip", id: "access-sheath-femoral-length-tip" },
        {
          kind: "steps",
          title: "When to change to a long femoral sheath, and how to use it",
          items: [
            { title: "1. Recognise the trigger", detail: "A wire that only crossed an iliac or aortic problem after effort; catheters that will not follow the hub, or kink; an iliac stenosis; existing iliac stents; severe iliac and aortic atheroma; an obese groin; or a planned complex PCI that will need strong support (Brilakis 4.1 favours at least one femoral access for complex PCI, often 7 or 8 Fr and ideally 45 cm long; that is his preference, while ESC guidance keeps radial as the standard access unless the procedure demands otherwise, as taught in pm-access)." },
            { title: "2. Keep the hard-won route", detail: "Once the wire is across, put the long sheath over it so that every later catheter passes without fighting the same segment again (5.2.4)." },
            { title: "3. Size it one French above the catheter if handling is the problem", detail: "Through very tortuous iliacs, a long sheath one French larger than the catheter makes manipulation easier (30.1.1.1). If the catheter still will not turn, use a catheter slightly smaller than the sheath, for example a 7 Fr guide in an 8 Fr sheath, or stiffen the catheter with a 0.035 or 0.038 in. wire inside it (5.7.3.3)." },
            { title: "4. Protect what is already there", detail: "Pass a long sheath through existing iliac stents so that the guide tip cannot catch and dislodge them; Brilakis shows a peripheral stent caught by a guide and carried into the aorta (Fig. 5.8)." },
            { title: "5. Keep debris out of the guide", detail: "Brilakis lists a long femoral sheath, in severe iliac and aortic disease, among the ways of preventing a guide that reaches the root carrying thrombus or plaque (5.4, 5.6); aspirate the sheath and the guide before injecting all the same." },
            { title: "6. If the route still fights", detail: "A guide with less distal angulation may pass more easily, and kink-resistant long sheaths help in tortuosity. In the parallel sheath technique a second puncture of the same femoral artery takes a 4 Fr sheath; a stiff 0.035 in. wire passed up it straightens the iliac for the working catheter (5.3.3.3; Reifart 2014). Otherwise change access site." },
          ],
        },
        {
          kind: "p",
          text: "**Suspect a kink before it happens.** Brilakis's signs are a guide tip that stays still while the hub turns and a pressure trace that damps or disappears; fluoroscopy of the whole catheter length confirms it and shows where it is (5.4.3, 5.7.4.1). Tortuous iliacs, aorta or subclavian and long engagement attempts are the causes; long sheaths, limited rotation and a 0.035 or 0.038 in. wire inside during manipulation are the prevention. Do not inject while the trace is damped or lost.",
        },
        {
          kind: "steps",
          title: "A kinked guide: Brilakis's escalation (5.7.4.1, Fig. 5.21; full lesson in pm-engaging)",
          items: [
            { title: "1. Untwist and pass a wire", detail: "Rotate gently in the opposite direction to the one used while engaging, and try to pass a 0.035 in. wire through the kinked segment. The wire's back end is an option but may perforate the catheter; a 0.069 in. wire is another." },
            { title: "2. Hold the tip from a second access", detail: "Through a second radial or femoral puncture, snare the guide tip so the segment can be straightened while you untwist. From the radial, when the kink sits distal to the brachial artery, inflating a cuff around the upper arm can hold the catheter still for untwisting and removal." },
            { title: "3. Pressurise the lumen", detail: "An inflation device on the hub, inflated gently to 3–4 atm, may help unwind the kink." },
            { title: "4. Cover it with a sheath", detail: "Cut the catheter at the hub and advance a sheath of the same size, or 1–2 Fr larger, over it to enclose the kinked part for withdrawal; a sheath advanced without its dilator can injure the vessel." },
            { title: "5. Bring the kink out through the skin", detail: "Pull the kinked segment out through the arteriotomy, provided enough catheter remains to take a wire, then place a wire to keep access. If the catheter breaks during these attempts, the pieces can usually be snared rather than removed surgically." },
          ],
        },
        { kind: "tip", id: "access-root-iliac-long-sheath" },
        {
          kind: "check",
          stem: "A 45 cm 8 Fr femoral sheath is in place for an RCA CTO. Through the tortuous aorta the 8 Fr AL1 guide responds sluggishly to the hub; the trace is normal and screening the whole guide shows no kink. What is the most useful next change?",
          options: [
            "Keep turning the hub firmly until the tip follows, watching the trace",
            "Use a 7 Fr guide within the 8 Fr sheath, or stiffen the guide with a 0.035 in. wire",
            "Withdraw the long sheath to 10 cm so that the guide has more room to move",
            "Swap to a 25 cm sheath, which gives more torque control than a 45 cm one",
          ],
          answer: 1,
          explanation:
            "Brilakis's solutions for a catheter that will not respond through tortuosity include stiffening it with a 0.035 or 0.038 in. wire inside, a long sheath, and, if handling is still difficult, a catheter slightly smaller than the sheath (a 7 Fr guide in an 8 Fr sheath). Torquing hard when the tip does not follow the hub is how catheters kink; had the tip not moved at all, or the trace been lost, the first step would be to stop and screen the whole guide for a kink. Shortening the sheath gives up the support and torque that a long sheath provides.",
        },
        {
          kind: "p",
          text: "**Length and reach interact.** Through severe iliac, aortic or subclavian tortuosity a long sheath may shorten the path from the puncture to the coronary ostium, and Brilakis lists it among the ways to prevent a guide failing to reach the root (5.3.4). A long sheath that cannot be fully inserted can have the opposite effect. Brilakis describes passing a 7 Fr sheath through the valve of a microaxial pump's 14 Fr sheath to avoid a second puncture; if that 45 cm sheath cannot go fully into the body, or the guide is 90 cm long, or the patient is tall or the aorta tortuous, the guide may not reach the coronary ostia. The fixes are a 100 cm (or 125 cm) guide or a short 7 Fr sheath (14.4.11). Guide length itself is the last lesson of this module.",
        },
        { kind: "tip", id: "mcs-pump-sheath-guide-reach" },
        { kind: "h", text: "Radial sheath length: three positions" },
        {
          kind: "table",
          head: ["Source", "What it says"],
          rows: [
            ["Brilakis, access chapter (4.3.8)", "His default is to leave long sheaths out of the radial artery, since in that chapter he links them with more occlusion and more spasm"],
            ["Brilakis, equipment chapter (30.1.3) and access chapter (4.3)", "10 cm is the usual length. From the left wrist in particular, a 16 or 25 cm sheath can sit only partly within the artery, its outer part easing catheter entry and exchange without the hand having to be supinated"],
            ["Brilakis, complications chapter (29.2.3.3)", "A long (24 cm) radial sheath whose tip lies in the brachial artery keeps catheter manipulation off the radial artery and is listed among the measures that prevent spasm, by sparing the radial endothelium"],
            ["Brilakis, CTO chapter (21.4)", "For CTO work from the left wrist, distal radial access or a long sheath can make the route workable, though a femoral 45 cm sheath remains a common choice for support"],
            ["Oxford, radial access", "Radial sheaths are usually 5 or 6 F; either short or long versions are used, some with a hydrophilic coating"],
          ],
        },
        {
          kind: "p",
          text: "Reconcile them by purpose. Brilakis's access chapter usually avoids long radial sheaths, citing occlusion and spasm. His complications chapter takes the opposite view of one particular set-up: a 24 cm sheath reaching the brachial artery, so that catheters never rub the radial wall, is listed as spasm prevention. His equipment and CTO chapters use 16–25 cm sheaths for left radial and CTO work. So there is no single rule. Use a short, thin sheath by default, and choose a long one for a stated reason: left radial ergonomics, a CTO case from the left wrist, or keeping catheters off a radial artery that is prone to spasm.",
        },
        { kind: "tip", id: "access-sheath-radial-long-caution" },
        { kind: "h", text: "Working without a sheath" },
        {
          kind: "p",
          text: "Take the sheath away and the artery only has to accept the guide itself: by the two-sizes rule, a guide inserted bare can be about two French larger for the same hole. Brilakis gives four ways to do it and one alternative.",
        },
        {
          kind: "table",
          caption: "Sheathless guide placement (Brilakis 30.1.2, 5.3)",
          head: ["Method", "How it works", "Note"],
          rows: [
            ["Dedicated sheathless guide system", "A guide with its own inner dilator", "Lets CTO PCI be done with 7.5 Fr guides through a puncture equivalent to a 5 Fr sheath"],
            ["Dilator inside a standard guide", "A long tapered dilator runs through any guide and leads it into the radial artery", "Works with the operator's choice of guide"],
            ["Long diagnostic catheter as the dilator", "A 125 cm diagnostic catheter inside a 90 or 100 cm guide two French sizes larger (Brilakis's figure: a 5 Fr, 125 cm catheter inside a 7 Fr, 100 cm EBU 3.5)", "The extra length lets the inner catheter protrude beyond the guide tip and taper the step"],
            ["Balloon-assisted tracking", "A small compliant balloon, the same size as the guide, straddles the guide tip and is inflated at low pressure (3–6 atm); guide and balloon then advance together", "Lower pressure gives a more flexible assembly, higher pressure more push; the balloon stops the guide edge digging into the wall (the 'razor effect'). Also used for radial loops"],
            ["Alternative: a short sheath of the guide's size", "A standard 7 or 8 Fr guide through a short 7 or 8 Fr sheath", "The sheath approach for large guides when sheathless kit is not used"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Radial spasm.** After vasodilators (intra-arterial, or subcutaneous nitroglycerin) and sedation, Brilakis's list of fixes includes a smaller (5 Fr) guide, guides with a dimpled low-friction surface, a sheathless guide or dilator system, and hydrophilic or low-profile sheaths (5.3.3.4).",
            "**Radial stenosis.** A low-profile sheath or a sheathless guide may dilate the narrowing gently without injuring the vessel (5.3.3.2).",
            "**Embolism.** A sheathless guide with an inner dilator avoids the razor effect and does not scrape plaque (5.5).",
            "**Femoral balloon pump.** The balloon pump can also go in without a sheath (30.1.1.1).",
          ],
        },
        { kind: "tip", id: "access-sheath-sheathless-option" },
        { kind: "tip", id: "access-sheath-sheathless-spasm" },
        {
          kind: "check",
          stem: "You want a 7 Fr EBU guide (100 cm) for a left main PCI through a small right radial artery, and you have no sheathless guide system. Which improvised method does Brilakis describe?",
          options: [
            "A 5 Fr, 100 cm diagnostic catheter inside the guide as its dilator",
            "A 5 Fr, 125 cm diagnostic catheter inside the guide as its dilator",
            "A 7 Fr, 125 cm diagnostic catheter inside the guide as its dilator",
            "The guide pushed in bare over the 0.035 in. wire, with no dilator",
          ],
          answer: 1,
          explanation:
            "Brilakis's example is a 5 Fr, 125 cm diagnostic catheter used to insert a 7 Fr, 100 cm EBU 3.5: the inner catheter is two French smaller, and its extra 25 cm lets it protrude beyond the guide tip to taper the step. A 100 cm inner catheter would sit flush with the tip and taper nothing; a 7 Fr catheter will not fit inside a 7 Fr guide; and a bare guide edge over a wire is what causes the razor effect.",
        },
        {
          kind: "pitfalls",
          items: [
            "A long sheath in an obese or tortuous groin forgotten until the guide has kinked.",
            "Pushing a guide through iliac stents without a sheath across them.",
            "Defaulting to long radial sheaths; Brilakis's access chapter usually avoids them for occlusion and spasm.",
            "A 90 cm guide through a 45 cm sheath that cannot be fully inserted (for example through a support-device sheath): the guide may not reach the root.",
            "A diagnostic-catheter dilator that is not long enough to protrude beyond the guide tip.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide sheath length by asking where you want the tip to be. 10 cm ends near the internal iliac origin, 25 cm at the aortic bifurcation and 45 cm near the diaphragm; put the tip beyond the problem you are bypassing.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "From the femoral route, advance a JR4 and then an AL1 to the root and engage the RCA; note how many turns at the hub it takes before the tip responds, and plan which sheath length (10, 25 or 45 cm) and catheter-to-sheath size you would choose if the iliac were tortuous.",
        },
        { kind: "video", id: "4szvqsnKMA0", note: "Brilakis's Manual of PCI chapter video on sheaths." },
        {
          kind: "keypoints",
          items: [
            "Long femoral sheaths: better guide support and torque; 10 cm to the internal iliac origin, 25 cm to the aortic bifurcation, 45 cm to the diaphragm.",
            "Indications: tortuosity, kinking, iliac stenosis (45–55 cm), iliac stents, severe aorto-iliac disease, obesity, strong support for complex PCI.",
            "Tortuous route: sheath 1 Fr above the catheter, or a catheter 1 Fr below the sheath; wire inside to stiffen; parallel 4 Fr sheath with a stiff wire.",
            "Radial: short and thin by default (the access chapter avoids long sheaths for occlusion and spasm); 16–25 cm sheaths for left radial convenience or CTO work, or a 24 cm sheath reaching the brachial artery to keep catheters off a spasm-prone radial (29.2.3.3), each by choice.",
            "Kink: tip still while the hub turns, trace damped or lost; screen the whole guide, then untwist and wire, snare the tip, pressurise at 3–4 atm, sheath over it, pull it out through the skin.",
            "Sheathless: dedicated system (7.5 Fr through a 5 Fr-sized hole), dilator in a guide, 125 cm diagnostic as dilator for a guide 2 Fr larger, or balloon-assisted tracking at 3–6 atm.",
            "Sheath length and guide length interact: a long sheath can shorten the path through tortuosity, but a 90 cm guide may not reach the ostia when a 45 cm sheath cannot be fully inserted (for example through a pump sheath), or in tall or tortuous patients.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-sheaths-guides-extension-device",
      title: "Guide extensions: how they are built, what fits through them and what they are for",
      minutes: 15,
      topics: ["pci-guide-extension"],
      sources: [B("30.2"), B("30.3"), B("30.4"), B("23.1"), B("8.9"), B("9.7"), B("5.7"), B("6.6"), B("15.1"), B("16.1"), B("19.9"), B("20"), B("24.1"), B("27.1"), B("27.3"), O_GUIDES],
      refs: [...BOOKS, "zhang-doca-tri-2012", "duong-guide-extension-2015", "huang-guide-extension-reverse-cart-2017", "total-2015", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "A guide extension is a second, thinner catheter that runs inside the guide and out of its tip into the coronary artery: the 'mother-and-child' idea. Brilakis calls it one of the most commonly used tools for getting balloons and stents to a lesion, and his group found one in use in about one PCI in twenty (5.4% of 1,539 procedures; Duong 2015). To use one well you need three things: how the device is built, how its bore compares with the guide's and with what you want to pass, and the whole range of jobs it can do.",
        },
        { kind: "h", text: "Start with the guide's lumen" },
        {
          kind: "table",
          caption: "Diagnostic and guide catheters compared (Brilakis 30.2.1–30.2.2, Tables 30.3–30.4; Oxford, Guiding catheters)",
          head: ["Feature", "6 Fr diagnostic", "6 Fr guide"],
          rows: [
            ["Outer diameter", "0.079 in. (2.0 mm)", "0.079 in. (2.0 mm)"],
            ["Inner diameter", "0.057 in. (1.45 mm)", "0.069–0.072 in. (about 1.78 mm), varying slightly by manufacturer"],
            ["Wall", "Two layers, thicker: more torque, less kinking", "Three layers made thin by a metal mesh: Oxford describes a polyurethane outer coat for shape, a woven mesh for stiffness and a low-friction PTFE lining"],
            ["Tip", "Firmer", "Softer, for longer engagement and deep seating with less risk of dissection (Brilakis); Oxford describes an atraumatic soft tip designed to avoid iatrogenic coronary dissection"],
          ],
        },
        {
          kind: "p",
          text: "**Use the difference.** Because a diagnostic catheter torques better, Brilakis uses one to engage and wire a coronary that a guide will not engage, then exchanges it for the guide over a supportive 0.014 in. wire 300 cm long (30.2.1, 5.7.3.3). In a very dilated root with a left main that is hard to reach, a 4 Fr diagnostic catheter telescoped through a 6 Fr AL3 guide can reach it (5.7.3.4).",
        },
        {
          kind: "p",
          text: "Guide lumens by size (Brilakis Table 30.4): about 0.058–0.059 in. (1.47–1.50 mm) at 5 Fr, 0.070–0.072 in. (1.78–1.83 mm) at 6 Fr, 0.081 in. (2.06 mm) at 7 Fr and 0.090–0.091 in. (2.29–2.31 mm) at 8 Fr. Oxford gives the bore of a 6 F guide as up to 0.71 mm, a figure that cannot be right, since it would be barely a third of the guide's 2.0 mm outer diameter; use Brilakis's 0.071 in. (1.80 mm). Oxford's practical point stands: thinner walls let a 6 F guide carry two balloon or stent catheters at once. Larger guides (7 or 8 Fr) give more support (both manuals) and better vessel visualisation (Brilakis), and some jobs need them: a 2.0 mm rotational burr and some two-stent techniques (V-stenting, simultaneous kissing stents) need a 7 Fr guide. Trapping depends on the lumen too: a 6 Fr guide is too small to trap over-the-wire balloons or dissection re-entry devices, but 6 Fr guides with a 0.071 in. lumen can trap low-profile microcatheters (8.9.2.1).",
        },
        { kind: "h", text: "The device" },
        {
          kind: "list",
          items: [
            "**Push rod and cylinder.** Most extensions are a long push rod carrying a short distal cylinder, 25 cm in most designs (a 40 cm version exists for some), and 13 cm in the design with a built-in trapping balloon. Only the cylinder enters the coronary artery; overall usable length is 145–150 cm.",
            "**Proximal collar.** The entry port at the junction of rod and cylinder. Every device you pass enters the cylinder here, so this is where wires, balloons and stents catch.",
            "**Markers.** A radiopaque marker close to the distal tip (2 mm from it on the designs illustrated) and one at the collar; positioning marks on the push rod at 90 and 100 cm, or 95 and 105 cm, from the tip, depending on the model.",
            "**Trapping version.** One design, made in 6–8 Fr sizes, adds a balloon just proximal to the collar, so that a short wire can be pinned inside the guide for exchanges. Its advantages are less fluoroscopy to position a trapping balloon and less equipment, because a separate trapping balloon becomes hard to pass back through the Y-connector after many inflations in a long case. It works best with shorter (135 cm) microcatheters, because a 150 cm microcatheter is often too long to leave wire exposed for trapping (8.9.2.1).",
            "**Catheter-in-catheter version.** One system has no push rod: a 120 cm, 5 Fr catheter passed through a standard 6 Fr guide (the '5-in-6' design).",
          ],
        },
        {
          kind: "table",
          caption: "Inner diameters of guide extensions by size (Brilakis Table 30.5; product names omitted)",
          head: ["Extension size", "Inner diameter", "Compare with a guide of"],
          rows: [
            ["5 Fr", "0.041–0.046 in. (1.04–1.17 mm)", "Smaller than any guide in Table 30.4"],
            ["5.5 Fr", "0.051 in. (1.30 mm)", "Smaller than a 5 Fr guide"],
            ["6 Fr", "0.056–0.057 in. (1.42–1.45 mm)", "Just under a 5 Fr guide (0.058 in.)"],
            ["7 Fr", "0.062–0.063 in. (1.57–1.60 mm)", "Between a 5 Fr (0.058 in.) and a 6 Fr (0.071 in.) guide"],
            ["8 Fr", "0.071–0.072 in. (1.80–1.83 mm)", "The same as a 6 Fr guide (0.071 in.)"],
            ["5 Fr catheter in a 6 Fr guide", "0.059 in. (1.50 mm)", "About a 5 Fr guide"],
          ],
        },
        {
          kind: "p",
          text: "The rule that falls out of the table: an extension leaves you a lumen about two French smaller than the guide's (Brilakis says about two in 30.3.1 and one to two in 30.3.4). Everything you plan to pass must fit that smaller bore, and the smaller bore damps more easily and gives clot a chance, which is why the ACT and the trace both need watching while it is in.",
        },
        { kind: "tip", id: "pci-gx-size-match" },
        {
          kind: "check",
          stem: "A calcified distal main vessel at a bifurcation needs a 1.5 mm rotational burr. You will pass the burr through a guide extension placed over the atherectomy wire only, so that the side-branch wire stays in the guide but outside the extension. Which set-up does Brilakis describe for this?",
          options: [
            "A 6 Fr guide with a 5.5 Fr extension",
            "A 7 Fr guide with a 6 Fr extension",
            "An 8 Fr guide with a 7 Fr extension",
            "A 7 Fr guide with a 5 Fr extension",
          ],
          answer: 2,
          explanation:
            "For bifurcation atherectomy Brilakis pairs an 8 Fr guide with a 7 Fr extension for a 1.5 mm burr, and a 7 Fr guide with a 6 Fr extension for a 1.25 mm burr or a 1.25 mm orbital crown; the extension is deliberately a size smaller than the guide so that the side-branch wire runs outside it. Outside that set-up, his calcium chapter prefers a 7 Fr extension for both the 1.25 mm and the 1.5 mm burr. The 6 Fr extension's bore (about 0.056 in.) is less than a 5 Fr guide's, and the smaller extensions are smaller still.",
        },
        { kind: "h", text: "What fits, and what does not" },
        {
          kind: "list",
          items: [
            "**Rotational burrs:** a 7 Fr extension is Brilakis's preference for both the 1.25 mm and the 1.5 mm burr (19.9.5). In bifurcation atherectomy, where the extension is deliberately a size smaller than the guide so that the side-branch wire stays outside it, a 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or 1.25 mm orbital crown, and an 8 Fr guide with a 7 Fr extension a 1.5 mm burr (16.1).",
            "**Orbital atherectomy crown trapping:** without an extension the crown can be trapped with a balloon in 7 and 8 Fr guides, not in 6 Fr; with a standard extension in place it cannot be trapped at 6, 7 or 8 Fr (Table 19.2). The exception is an 8 Fr extension with a built-in trapping balloon, through which trapping can be done (19.9.6.5).",
            "**Thrombectomy catheters** may not fit inside an extension (20).",
            "**Small guides and stent loss:** a 5 Fr guide is a recognised cause of stent loss; avoid it for complex lesions, because it leaves too little room to withdraw a deformed stent (27.1).",
            "**Covered stents:** Brilakis illustrates a covered stent brought to a perforation with the help of an 8 Fr extension (Fig. 26.9).",
            "**Imaging catheters and microcatheters:** check combined profiles against the lumen you will have left; the compatibility app example shows an IVUS catheter and a microcatheter fitting side by side in a 7 Fr guide.",
          ],
        },
        { kind: "h", text: "What extensions are for" },
        {
          kind: "table",
          caption: "Uses of a guide extension (Brilakis; Oxford does not cover guide extensions)",
          head: ["Use", "How the extension helps", "Where"],
          rows: [
            ["Delivering balloons, stents and other devices (the main use)", "Adds guide support and pushability, and if taken close to or through the lesion the device travels inside it without touching the diseased wall. Works even when the guide cannot sit coaxially, as with anomalous coronaries and mammary grafts", "30.3.2, 9.7.8, 10.2.8, 23.1.3"],
            ["Engaging awkward ostia", "Reaches a coronary that the guide cannot: dilated ascending aorta, a curve that is the wrong size, a guide that cannot reach the root; after TAVI, the guide or an extension may have to be railed into the ostium over a wire", "30.3.2, 5.7.3, 5.3.4, 24.1"],
            ["Better pictures", "A more selective position for injection when opacification is poor", "6.6"],
            ["Ostial lesions", "A small extension engages the artery while the guide is backed out of the ostium, to limit damping and guide trauma; helps re-engage the ostium if the guide loses position during ostial stenting", "15.1"],
            ["Thrombus aspiration (bail-out only)", "Taken into the vessel, it lets you aspirate through the guide (at the cost of possible distal dissection, ischaemia and stent deformation). Routine aspiration is not recommended: Brilakis notes that trials do not support it, TOTAL found no benefit and more strokes, and the 2023 ESC ACS guideline does not recommend it (cp-acs-thrombus)", "30.3.2, 20"],
            ["Retrieving entrapped equipment", "Over the cut shaft of an entrapped burr or balloon, pushed up to it before pulling; a trapping-balloon design can also trap the balloon; or used to guide a stiff wire to puncture a balloon that will not deflate", "30.3.2, 19.9, 27.3"],
            ["A home-made snare", "A wire loop held by a balloon inflated in the extension's distal end", "30.3.2, 27.1"],
            ["CTO: reverse CART", "From the antegrade side it shortens the distance the retrograde wire must travel; from the retrograde side it adds support for equipment", "30.3.2, 21.8.3"],
            ["CTO: antegrade dissection and re-entry", "By damping the pressure and reducing antegrade flow, it limits haematoma growth", "30.3.2"],
            ["Bifurcation atherectomy", "Placed over the atherectomy wire alone, it keeps the burr or crown away from the side-branch wire", "16.1"],
            ["Other delivery", "Support for a knuckled wire through tortuosity; delivery of an embolic protection retrieval sheath through stents", "20.8, 18.8"],
          ],
        },
        {
          kind: "p",
          text: "**The evidence Brilakis cites.** In a randomised trial of transradial PCI of complex lesions in which balloon or stent delivery had already failed, the 5-in-6 catheter system succeeded far more often than a buddy wire or balloon anchoring (technical success 97.9% against 39.8%; Zhang 2012). In Duong's series the main indication was delivery or support (84.7%), followed by thrombus aspiration (10.5%), retrieval of lost devices (2.3%), reverse CART (1%) and selective visualisation (1%); half the target vessels were RCAs. The extension achieved its aim in 73.3%, and 4 patients (4.8%) had a complication attributed to it, among them a dissection that needed emergency surgery (Duong 2015).",
        },
        { kind: "h", text: "Support catheters: an alternative to an extension" },
        {
          kind: "p",
          text: "Brilakis describes a separate class of catheters that, like an extension, go deep into the vessel but also grip its wall to add support (30.4). One type opens a self-expanding nitinol scaffold, up to 4.5 mm across, proximal to the lesion, with either three lumens spaced around it or a single central lumen big enough for a microcatheter; another bows out helical nitinol struts from a 10 mm element when compressed along its axis; a third is a 5 Fr catheter with a soft balloon at its tip that expands to 6 mm and is limited to 1 atm by a relief valve, anchoring with little risk to the proximal vessel. They raise backup and the force the wire can apply to a proximal cap. Two practical limits: the scaffold catheters need at least 10 mm of vessel before the lesion to land in, and they are too bulky to remove by trapping, so 300 cm wires are needed to take them out. Their use in CTO wiring is taught in cp-cto-antegrade.",
        },
        { kind: "tip", id: "pci-gx-engage-when-guide-cannot" },
        { kind: "tip", id: "pci-gx-ostial-keep-guide-out" },
        { kind: "tip", id: "pci-gx-thrombus-aspiration" },
        {
          kind: "check",
          stem: "During PCI of an aorto-ostial RCA lesion the AL1 guide repeatedly dives in and damps. Which extension-based approach does Brilakis describe to protect the ostium?",
          options: [
            "Advance an 8 Fr extension inside the 6 Fr guide to stiffen it at the ostium",
            "Leave the guide outside the ostium and engage the artery with a small extension",
            "Push the guide deeper and use the extension to inject contrast beyond the lesion",
            "Swap to a side-hole guide and add an extension through the side hole into the RCA",
          ],
          answer: 1,
          explanation:
            "For ostial lesions Brilakis lists using a small guide extension to engage the vessel while the guide is kept out of (backed out of) the ostium, among the measures that prevent aorto-coronary dissection. An extension cannot be larger than its guide. Deep guide engagement and injecting through a deep extension both raise dissection risk, and hand-made or factory side holes do not make a channel for an extension.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming the guide's lumen is still available after the extension goes in: plan for about two French less.",
            "Choosing a smaller extension than the guide when more wires must pass later.",
            "Expecting to trap an orbital atherectomy crown through a standard extension (only the 8 Fr trapping-balloon design allows it), or to pass a thrombectomy catheter through an extension.",
            "Using a 5 Fr guide for a complex lesion: too little room to bring a deformed stent back.",
            "Treating the extension as only a stent-delivery tool and forgetting it in retrieval, ostial and CTO work.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you open an extension, say out loud the largest device that must still pass, and compare it with the lumen the extension leaves you. Two French goes quickly: an 8 Fr extension leaves you a 6 Fr guide's bore, and a 6 Fr extension leaves you less than a 5 Fr guide's.",
        },
        { kind: "tip", id: "pci-gx-atherectomy-plan" },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, before any device goes in, decide whether a guide extension may be needed: name the guide size, the matching extension size, and whether a 1.25 or 1.5 mm burr could pass through that combination.",
        },
        { kind: "video", id: "mXXXSwW--BA", note: "Brilakis's Manual of PCI chapter video on guide catheter extensions." },
        { kind: "video", id: "Z4-lZ0GmGbY", note: "Manual of PCI case 1: a guide extension for visualisation and equipment delivery." },
        {
          kind: "keypoints",
          items: [
            "6 Fr guide lumen 0.070–0.072 in. (about 1.8 mm) against 0.057 in. for a 6 Fr diagnostic catheter; use Brilakis's lumen values. A diagnostic catheter can engage and wire a vessel a guide cannot, then be exchanged over a 300 cm wire.",
            "Extension: push rod, 25 cm cylinder (40 cm and 13 cm versions), proximal collar, tip and collar markers; total length 145–150 cm; one design is a 120 cm 5-in-6 catheter.",
            "The extension's bore is about 2 Fr below the guide's: 8 Fr extension ≈ 6 Fr guide; 6 Fr extension < 5 Fr guide.",
            "Burrs: a 7 Fr extension is his choice whether the burr is 1.25 mm or 1.5 mm; in bifurcations (extension a size below the guide) 7 Fr guide + 6 Fr extension for 1.25 mm, 8 Fr guide + 7 Fr extension for 1.5 mm. Crown trapping fails with a standard extension in, but works through an 8 Fr trapping-balloon extension.",
            "Uses: delivery (main), engagement, visualisation, ostial lesions, bail-out thrombus aspiration, retrieval, home-made snare, reverse CART, ADR haematoma control, bifurcation atherectomy.",
            "Support catheters (scaffold, strut or low-pressure balloon) anchor in the vessel instead; the scaffold types need at least 10 mm of landing zone and cannot be trapped, so 300 cm wires are needed to remove them.",
            "Randomised evidence: 5-in-6 system beat buddy wire or anchoring after failed delivery (97.9% vs 39.8%).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-sheaths-guides-extension-use",
      title: "Using a guide extension at the stuck stent, and getting out of trouble",
      minutes: 16,
      topics: ["pci-guide-extension"],
      sources: [B("30.3"), B("23.1"), B("8.4"), B("9.7"), B("10.2"), B("16.1"), B("18.5"), B("20"), B("25.2"), B("27.1"), B("27.3"), B("30.2")],
      refs: [...BRILAKIS, "waterbury-guide-extension-2016", "chen-guide-extension-maude-2019", "duong-guide-extension-2015"],
      blocks: [
        {
          kind: "p",
          text: "The commonest moment for a guide extension is this one: the wire is distal, a stent has stopped at a proximal bend or calcified segment, and pushing makes the guide back out. This lesson works from that moment forward, one decision at a time. Inchworming is summarised here and taught in full in cp-uncrossable; general support escalation is in pm-prep-and-stent.",
        },
        {
          kind: "steps",
          title: "From the stuck stent to a delivered stent",
          items: [
            { title: "1. Stop pushing and protect what you have", detail: "Watch the guide and the distal wire. If the guide is backing out or the wire is being dragged, stop advancing (23.1.1). Make the guide coaxial before withdrawing the stent, and never pull hard against resistance into the guide (pm-prep-and-stent)." },
            { title: "2. Decide that an extension is the answer", detail: "Changing the guide after a hard-won wire risks losing the wire (23.1.3); an extension adds support around the wire you already have. The alternatives are deep intubation of the guide (usually with 5 or 6 Fr guides, and mainly in the RCA and vein grafts) and anchor techniques. Each has a price: deep intubation adds support but can dissect the vessel, and is rarely used in the left coronary artery; the distal anchor needs two wires and at least a 6 Fr guide (better 7 or 8 Fr), and can cause a distal dissection that needs extensive stenting (9.7.8)." },
            { title: "3. Match the size", detail: "If more wires may need to pass, use an extension of the guide's own French size: with a smaller extension in a larger guide, new wires tend to run outside its cylinder (30.3.3). The one-size-smaller pairing is used on purpose in bifurcation atherectomy, to keep the side-branch wire outside the extension (16.1). Check that the stent and anything else you need will pass the bore it leaves. From the radial route, Brilakis suggests considering a 40 cm cylinder rather than 25 cm, because stents can be deformed or stripped at the collar around the subclavian bend (23.1.3)." },
            { title: "4. Load it and park the push rod", detail: "Load the extension over the wire through the Y-connector and tuck the part of the push rod outside the patient under a towel beside the Y-connector, so the wire cannot wrap around it (30.3.3, 27.1)." },
            { title: "5. Run it to the guide tip", detail: "Advance it inside the guide under fluoroscopy until its tip reaches the guide tip. The proximal collar must never leave the guide." },
            { title: "6. Take it into the artery over something, not the bare wire", detail: "Advance it over a balloon or a microcatheter rather than over the bare 0.014 in. wire, whose extension edge can catch a plaque edge and dissect. The balloon method Brilakis generally prefers is inchworming, because it centres the extension: a small balloon (usually 2.0 mm) half inside and half outside the extension tip, inflated at low pressure (usually 6–8 atm), the extension advanced as the balloon deflates. Alternatives: balloon-assisted tracking (a balloon protruding from the extension inflated at nominal pressure and advanced with it; a leading balloon also helps the extension through tortuosity and previously stented segments, Fig. 30.29) or a distal anchor. Watch the guide and the distal wire tip while you advance: pushing an extension can cost wire or guide position, or injure the distal vessel (23.1.3)." },
            { title: "7. Watch the trace at every step", detail: "Minimise damping. If the trace damps, confirm that antegrade flow is preserved and that the vessel is not injured before going on; do not inject while it is damped, and avoid injecting through a deeply seated extension at all (30.3.4)." },
            { title: "8. Pass the stent through", detail: "Advance it gently; if it resists, watch on fluoroscopy as it enters the collar. Resistance at the cylinder entry suggests the wire has wrapped the push rod: take the extension out and reinsert it rather than force the stent (9.7.7, 27.1). Sometimes it is best to load the stent into the extension outside the body and insert the two as one unit." },
            { title: "9. Deploy, then come back out carefully", detail: "If a stent has to be pulled back into the extension's tip after a failed attempt, it can be deformed there: inspect any stent that comes out before reusing it. Hold the push rod during any forceful injection so the extension is not shot forward into the vessel (30.3.4)." },
            { title: "10. Look at where the extension has been", detail: "Deep advancement of an extension can dissect the vessel, so confirm flow and the integrity of the segment it travelled through before you finish." },
          ],
        },
        { kind: "tip", id: "pci-unx-extension-collar" },
        { kind: "tip", id: "pci-unx-inchworm" },
        { kind: "tip", id: "pci-support-extension-wedge" },
        {
          kind: "check",
          stem: "With a 6 Fr extension 4 cm into the RCA, the aortic trace from the guide flattens and loses its notch as you prepare to inject to position the stent. What do you do?",
          options: [
            "Inject a small, gentle puff to see whether the extension has wedged",
            "Give intracoronary nitrate through the guide and then inject",
            "Ease the extension back until the trace recovers, then check flow",
            "Hold the push rod still and inject firmly so contrast clears the tip",
          ],
          answer: 2,
          explanation:
            "A damped trace with an extension deep in the vessel means its tip is wedged. Brilakis warns that injecting through it in this state can cause a hydraulic dissection that spreads forwards or back into the aorta, and advises confirming that antegrade flow is preserved and the vessel uninjured before continuing. Any injection, even a gentle puff or a drug, goes into a closed space; holding the push rod prevents ejection during forceful injection but does not make injecting into a wedged extension safe.",
        },
        { kind: "h", text: "Wires, trapping and the more advanced moves" },
        {
          kind: "list",
          items: [
            "**A second wire with an extension in place.** Take the extension (and other balloons or stents) out first if you can. If not, pass the wire through the collar under fluoroscopy and without force. Even with matched sizes the wire tip can be damaged entering the cylinder; enter with the wire withdrawn inside a microcatheter (30.3.3, 8.4).",
            "**Trapping.** With a standard extension, the trapping balloon has to sit proximal to the collar and the equipment must be withdrawn that far, which is awkward; if trapping is likely, use the design with a built-in trapping balloon.",
            "**Very tortuous vessels.** Extensions are very flexible and can follow severe tortuosity. Where several extreme bends lie in series, two can be nested: a 6 Fr extension inside an 8 Fr one ('mother, daughter, granddaughter').",
            "**A proximal stent already in place.** Distal-to-proximal stenting is preferred, but if the distal stent is needed afterwards, the extension can be passed through the proximal stent to deliver it. Forcing an extension through a deployed stent can deform that stent longitudinally.",
            "**Hand-made side holes.** Holes cut into a guide with a needle or scalpel can stop an extension advancing inside it, and weaken the guide (30.2.5).",
            "**Grafts.** Deep guide intubation and extensions can dissect or perforate a mammary graft (18.5).",
          ],
        },
        { kind: "tip", id: "pci-gx-second-wire" },
        { kind: "tip", id: "pci-gx-nested-extensions" },
        { kind: "tip", id: "pci-gx-through-proximal-stent" },
        { kind: "tip", id: "pci-gx-radial-long-cylinder" },
        { kind: "h", text: "Complications and what to do" },
        {
          kind: "table",
          caption: "Guide extension complications (Brilakis 30.3.4, 23.1.3, 27.1, 20; series data from the cited studies)",
          head: ["Complication", "Mechanism", "Prevention", "If it happens"],
          rows: [
            ["Stent, wire or device deformed at the collar", "The device catches as it enters the collar, or as it is pulled back into the extension tip", "Fluoroscopy at the collar when there is resistance; load the stent into the extension outside the body; matched sizes; push rod under a towel", "Inspect every withdrawn stent; remove and reinsert the extension if the wire has wrapped"],
            ["Loss of wire or guide position; distal vessel injury", "Pushing the extension forward", "Advance over a balloon or microcatheter; watch the guide and the distal wire tip as it goes", "Stop advancing and re-establish wire and guide position (23.1.3)"],
            ["Stent loss", "A stent caught on the collar going in, or stripped coming back, especially once deformed", "As above; never force; avoid 5 Fr guides for complex lesions (27.1)", "Stent loss algorithm (cm-equipment-loss)"],
            ["Coronary or aorto-coronary dissection; acute closure", "Deep advancement, especially over a bare wire; injection through a damped extension, which can track back into the aortic root", "Inchworm rather than push; minimise damping; avoid injecting through a deep extension", "Keep the wire; stop injecting; stent the dissection; Brilakis shows a circumflex closure that could not be reopened and went to emergency surgery"],
            ["Thrombus", "A lumen 1–2 Fr smaller than the guide, and a damped trace", "Special attention to damping and to the ACT", "Brilakis's advice here is preventive; thrombus management is taught in cp-acs-thrombus"],
            ["Ejection into the vessel", "A forceful injection drives the extension forward", "Hold the push rod during forceful injections", "Image for dissection: the report Brilakis cites is of a left main dissection after an extension was ejected"],
            ["Fracture", "The shaft breaks; in Brilakis's example, during attempts to retrieve a tip trapped while being advanced into a branch through a stent", "No specific measure given; fracture is the commonest problem in device-failure reports", "Advance a balloon inside the cylinder, inflate it there, and withdraw balloon and fragment together (Fig. 30.37)"],
            ["Distal marker dislodged", "The extension's distal marker comes off (23.1.3)", "No specific measure given", "A recognised complication with no specific treatment given; it is one of the equipment losses reported in the series below"],
            ["Ischaemia and haemodynamic compromise", "Deep seating of a guide or an extension in the vessel", "Watch the patient and the trace while it is deep", "Brilakis lists it among the risks of deep seating (20); no specific treatment is given"],
          ],
        },
        {
          kind: "p",
          text: "**How often.** In a single-centre series of 363 extension-supported PCIs, device delivery succeeded in 80.2%; extension-related stent deformation occurred in 2.2% and coronary dissection in 3.3%, both becoming less frequent as operators and device designs matured (Waterbury 2016). In Brilakis's group's series, 4.8% of patients had an extension-related complication: two vessel injuries (one needing emergency bypass surgery) and two equipment losses, a detached distal marker and a sheared wire tip (Duong 2015). In reports to the US device-failure database, breakage or fracture of the extension was the commonest single reported problem for both devices analysed; the other reports concerned failure to pass equipment through the extension or damage to it, failure to advance the extension to the lesion, kinking (which on inspection was mostly a partial or complete fracture), dissection and, in a few reports, perforation, thrombus in the catheter, aortic dissection and no-reflow; the authors note that patients occasionally died (Chen 2019).",
        },
        { kind: "tip", id: "pci-gx-fracture-retrieval" },
        { kind: "tip", id: "pci-gx-retrieve-entrapped-device" },
        {
          kind: "check",
          stem: "A guide extension's tip has become trapped in a diagonal after being pushed through an LAD stent; on retrieval its shaft snaps, leaving the cylinder in the artery. Which bail-out does Brilakis illustrate?",
          options: [
            "Snare the free end of the push rod in the aorta and pull the cylinder back",
            "Pass a balloon into the cylinder, inflate it there and withdraw them together",
            "Crush the cylinder against the wall with a stent deployed alongside it",
            "Leave it, because a cylinder in a diagonal rarely causes any problem",
          ],
          answer: 1,
          explanation:
            "In Brilakis's Fig. 30.37 a balloon is advanced inside the retained cylinder and inflated, and the two are withdrawn together, retrieving the fragment. The push rod has broken away from the cylinder, so pulling it cannot help; crushing the cylinder against the wall or leaving it in a coronary is not the manual's answer for a retrievable fragment.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing the extension along the bare wire into diseased proximal vessel, or advancing it without watching the guide and the distal wire.",
            "Injecting through a damped or deeply seated extension.",
            "Letting the collar leave the guide.",
            "A push rod lying loose on the table, then fighting a wrapped wire at the cylinder entry.",
            "Forcing a stent at the collar, or reusing a withdrawn stent without inspecting it.",
            "Passing extra wires through a guide that holds a smaller extension.",
            "Forcing an extension through a previously deployed stent.",
          ],
        },
        {
          kind: "pearl",
          text: "Most extension accidents are force applied at the wrong place: on the push rod against a diseased wall, on a stent against the collar, on the syringe against a wedged tip. Each has a gentler alternative in the steps above; when you feel resistance, look before you push.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, when the stent stops at the proximal bend: stop, park the guide coaxially, add a matched guide extension with its push rod under a towel, inchworm it to just beyond the bend (2.0 mm balloon, 6–8 atm), confirm the trace is not damped, then pass the stent through it and inspect the proximal RCA at the end.",
        },
        { kind: "video", id: "Gm2X2tIKxyU", note: "How to deliver a guide catheter extension by inchworming (the video's title also calls it balloon-assisted tracking)." },
        { kind: "video", id: "o680G13d3QQ", note: "Brilakis on how to deliver balloons and stents during complex coronary interventions." },
        { kind: "video", id: "DYQ1m9N4bwg", note: "Elias Hanna: balloon-uncrossable lesions, cases and technical tips, including guide extensions." },
        {
          kind: "keypoints",
          items: [
            "Stop, protect wire and guide; prefer adding an extension to exchanging the guide.",
            "Same French size as the guide if more wires may follow (smaller only by design, as in bifurcation atherectomy); consider a 40 cm cylinder from the radial route; push rod under a towel; collar stays in the guide.",
            "Into the artery over a balloon or microcatheter (inchworming, 2.0 mm at 6–8 atm, generally preferred), not along the bare wire; watch the guide and the wire tip as it goes.",
            "Damped trace: confirm flow and no injury; never inject while damped; hold the rod during forceful injections.",
            "Resistance at the collar: look, do not push; wrapped wire means remove and reinsert; inspect withdrawn stents.",
            "Nested extensions for serial bends; pass through a proximal stent gently; trapping needs the trapping design.",
            "Fracture: balloon inflated inside the cylinder and both withdrawn. Series: dissection 3.3%, stent deformation 2.2%.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-sheaths-guides-length",
      title: "Guide length: short, standard and long guides, and shortening a guide by hand",
      minutes: 12,
      topics: ["pci-guide-shortening"],
      sources: [B("30.2"), B("21"), B("5.3"), B("8.4"), B("8.9"), B("9.7"), B("10.2"), B("14.4"), B("18.8"), B("18.10"), B("28.2"), O_CATHS],
      refs: [...BOOKS, "wu-retrograde-tips-2008"],
      blocks: [
        {
          kind: "p",
          text: "Guide length is a reach problem. The guide, the shaft of every balloon and stent, and the working length of every wire and microcatheter are fixed, so a lesion far beyond the guide tip, or a retrograde route that ends far from the antegrade guide, can simply be out of range. Most catheters are 100 cm long (both manuals). This lesson teaches when a 90 cm or 125 cm guide is needed, how shaft markers behave with each, and how to shorten a guide yourself when no short one is available.",
        },
        {
          kind: "table",
          caption: "Guide lengths and their uses (Brilakis 30.2.3, 5.3.4, 18.8.1)",
          head: ["Length", "When", "Watch for"],
          rows: [
            ["100 cm", "Standard", "—"],
            ["90 cm (made by several manufacturers)", "Retrograde CTO PCI; very distal targets, for example native lesions reached through a bypass graft; most mammary-graft guides are 90 cm for this reason", "Use the 90 cm shaft mark, and screen trapping balloons (below); may not reach the root through a long sheath that cannot be fully inserted, or in a tall patient"],
            ["125 cm", "Very tall patients or very tortuous aortas when the guide fails to reach the root", "Balloons and stents may then be too short for the lesion: the longest stent shafts Brilakis lists are 140–145 cm"],
            ["Shortened by hand", "When a short guide is needed and none is in stock", "Poor torque; the joint can separate; shaft markers cannot be relied on to hold a trapping balloon inside"],
          ],
        },
        {
          kind: "p",
          text: "**The reach toolkit.** For a target a long way beyond the guide tip, Brilakis's answers are a short (or shortened) guide, deep guide intubation, 300 cm wires and the longest-shaft balloons and stents available (18.8.1, 9.7.8, 10.2.8), and a guide extension, which may allow safer deep intubation and better guide alignment (10.2.8). For mammary grafts, a shortened guide is occasionally needed to bring a balloon or stent to the distal anastomosis or to a native lesion beyond it (18.10.3).",
        },
        {
          kind: "table",
          caption: "When the guide will not reach the aortic root (Brilakis 5.3.4)",
          head: ["Causes", "Prevention", "Solutions"],
          rows: [
            [
              "A very tall patient; severe subclavian, iliac or aortic tortuosity; distal radial access",
              "A long sheath through the tortuous segment, which may shorten the distance from puncture to ostium; a stiff guidewire, which may straighten the aorta enough to reach; a longer (for example 125 cm) catheter",
              "A longer catheter, remembering that balloons and stents may then be too short (longest stent shafts 140–145 cm); a guide extension; the parallel sheath technique; a different access site (radial to femoral or the reverse, though the femoral route is usually the shorter)",
            ],
          ],
        },
        { kind: "tip", id: "pci-guide-reach-distal-target" },
        { kind: "h", text: "Shaft markers and guide length" },
        {
          kind: "list",
          items: [
            "**Balloons and stents** carry two shaft marks, at 90 cm (distal) and 100 cm (proximal). Advance without fluoroscopy until the first mark reaches the Y-connector for a 90 cm guide, or the second for a 100 cm guide, then screen to the guide tip (9.7.7).",
            "**Using the 100 cm mark with a 90 cm guide** lets the device leave the guide before the mark reaches the Y-connector (28.2.2): you are in the coronary without having screened.",
            "**Wires:** some wires are marked 90 cm and 100 cm back from their tip, and the wire leaves a 90 cm guide sooner than a 100 cm one; a torque device fixed about 90 cm from the wire tip stops it running out of the guide unseen (8.4).",
            "**Short (90 cm) or shortened guides and trapping:** Brilakis warns that shaft markers cannot be relied on to keep a trapping balloon inside the guide, so place it under fluoroscopy (8.9.2.1).",
          ],
        },
        { kind: "tip", id: "pci-guide-short-markers" },
        {
          kind: "check",
          stem: "You are working through a 90 cm guide and advance a balloon without fluoroscopy, watching its shaft marks. When should you start screening?",
          options: [
            "When the 100 cm mark reaches the Y-connector, as with any guide",
            "When the 90 cm mark reaches the Y-connector",
            "Only once the balloon has left the guide and entered the coronary",
            "Shaft marks do not apply to 90 cm guides; screen from the start",
          ],
          answer: 1,
          explanation:
            "For delivering a balloon, the 90 cm (distal) mark is the one for a 90 cm guide: at that point the balloon is near the guide tip and you screen it the rest of the way (9.7.7). Waiting for the 100 cm mark, as for a standard guide, lets the device exit the guide unseen. Screening from the start is not wrong, only unnecessary for delivery. A trapping balloon is different: in any short or shortened guide Brilakis says the marks cannot be relied on to keep it inside the guide, so place it under fluoroscopy (8.9).",
        },
        { kind: "h", text: "Shortening a guide" },
        {
          kind: "p",
          text: "With long externalisation wires and factory-made 90 cm guides, shortening is now rarely needed. Brilakis keeps it for some retrograde cases through bypass grafts or apical collaterals, where the retrograde microcatheter can be too short to arrive at the antegrade guide. For the technique he cites Wu's paper on retrograde CTO tips (Wu 2008), and it can be done with any 100 cm guide.",
        },
        {
          kind: "steps",
          title: "Cut and reconnect (Brilakis 30.2.4, Fig. 30.8)",
          items: [
            { title: "1. Measure in the patient", detail: "Insert the guide, engage the target vessel, and mark the guide where it leaves the femoral sheath. The marked, redundant length is what you will remove." },
            { title: "2. Cut out the segment", detail: "Remove the guide and cut out the marked segment with sterile scissors, leaving a proximal (hub) piece and a distal (tip) piece." },
            { title: "3. Make a connector from a sheath one size smaller", detail: "Cut a 3–4 cm length from a sheath one French smaller than the guide: for a 7 Fr guide use a 6 Fr sheath, for an 8 Fr guide a 7 Fr sheath." },
            { title: "4. Flare the connector", detail: "Open both ends of the connector with a dilator of the guide's own size, so the guide pieces can be pushed in." },
            { title: "5. Rejoin the guide", detail: "Push the distal piece into one end and the proximal piece into the other, so the guide is whole again minus the removed segment. A transparent adhesive dressing wrapped over the joint helps stop it coming apart." },
            { title: "6. Use it knowing its limits", detail: "A shortened guide transmits torque poorly during engagement and manipulation, worse as a long procedure goes on, and the two pieces can separate. Shaft markers cannot be relied on to keep a trapping balloon inside it, so screen trapping balloons (8.9)." },
          ],
        },
        { kind: "tip", id: "pci-guide-shorten-by-hand" },
        {
          kind: "check",
          stem: "You must shorten an 8 Fr guide for a retrograde case through a vein graft. Which connector does Brilakis's technique use?",
          options: [
            "A 3–4 cm piece of 7 Fr sheath, its ends flared with an 8 Fr dilator",
            "A 3–4 cm piece of 8 Fr sheath, its ends flared with an 8 Fr dilator",
            "A 10 cm piece of 9 Fr sheath, slid over the joint with no flaring",
            "A 3–4 cm piece of 6 Fr sheath, its ends flared with a 7 Fr dilator",
          ],
          answer: 0,
          explanation:
            "The connector is cut from a sheath one French smaller than the guide (7 Fr for an 8 Fr guide), 3–4 cm long, with both ends flared by a dilator of the guide's size so that the guide pieces push in snugly. A sheath of the guide's own size or larger would sit loose and let the pieces part; a 6 Fr segment is the connector for a 7 Fr guide.",
        },
        {
          kind: "p",
          text: "**Remember the sheath.** Brilakis warns that the guide may fail to reach the ostia when a 45 cm sheath cannot be advanced fully (for example a sheath passed through a support device's sheath), when a 90 cm guide is used, or in a tall or tortuous patient; a 100 or 125 cm guide or a short sheath solves it (14.4.11).",
        },
        {
          kind: "pitfalls",
          items: [
            "Discovering a length problem after the wire is across, when changing the guide may lose it.",
            "Advancing a balloon to the 100 cm mark through a 90 cm guide.",
            "Trusting shaft markers to keep a trapping balloon inside a short or hand-shortened guide.",
            "A connector of the guide's own size, or no dressing over the joint.",
            "Expecting a shortened guide to torque like a new one in a long case.",
            "Choosing a 125 cm guide without checking that the balloons and stents are long enough to reach.",
          ],
        },
        {
          kind: "pearl",
          text: "Do the arithmetic of reach before the case, not during it: how far the lesion lies beyond the guide tip (or, retrograde, from the entry of the collateral or graft to the antegrade guide) against the working length of what must travel it. A short guide planned is a two-minute choice; a guide shortened mid-case costs the position you have.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, plan the guides before you start: state the guide length for the retrograde side if the route were through a vein graft, which balloon shaft mark you would watch with that guide, and how you would make a 90 cm guide from a 100 cm 7 Fr guide if none were in stock.",
        },
        { kind: "video", id: "hrbU6w2S0Y4", note: "Brilakis: how to shorten a coronary guide catheter." },
        {
          kind: "keypoints",
          items: [
            "Most guides are 100 cm; 90 cm for retrograde CTO and distal targets through grafts (most mammary guides); 125 cm for tall patients or tortuous aortas, if the devices are long enough.",
            "Reach toolkit: short or shortened guide, deep intubation, 300 cm wires, longest-shaft devices (140–145 cm), guide extension.",
            "Shaft marks for delivery: the 90 cm mark at the Y-connector for 90 cm guides, the 100 cm mark for 100 cm guides. For trapping in a short or shortened guide, screen rather than trust the marks.",
            "Guide will not reach the root: long sheath, stiff wire or longer catheter to prevent; extension, parallel sheath or a change of access to solve.",
            "Shortening: engage, mark at the sheath, cut out the segment, rejoin with a 3–4 cm piece of sheath one French smaller, flared with a guide-sized dilator, dressing over the joint.",
            "Shortened guides torque poorly and can come apart.",
            "A 90 cm guide may not reach the ostia when a 45 cm sheath cannot be fully inserted (for example through a pump sheath), or in tall or tortuous patients.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "eq-sheaths-guides-q1",
      stem: "A 7 Fr standard femoral sheath has an outer diameter of 2.95 mm. In a 6 mm common femoral artery, about what share of the lumen does it fill?",
      options: ["About 12%", "About 24%", "About 35%", "About 49%"],
      answer: 1,
      explanation:
        "The occupied fraction is the square of the diameter ratio: (2.95 ÷ 6)² ≈ 0.24, which matches the 24.2% in Brilakis's Fig. 30.2. The 49% option is the unsquared diameter ratio; area, not diameter, decides how much of the artery the sheath obstructs.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q2",
      stem: "Why can a sheathless 7.5 Fr guide be placed through a puncture similar to that made by a 5 Fr sheath?",
      options: [
        "Sheathless guides are made with walls thinner than those of standard guides",
        "A sheath's outer diameter is about two French larger than the catheter it takes",
        "The radial artery stretches more around a smooth guide than around a sheath",
        "French sizes for sheaths are measured on the inside and for guides on the outside",
      ],
      answer: 1,
      explanation:
        "A sheath is labelled by the catheter it accepts, and its wall adds roughly two French to the outside (a 6 Fr sheath is 2.62 mm, like an 8 Fr guide). Remove the sheath and the arteriotomy only has to accept the guide itself. The manuals do not attribute the benefit to thinner guide walls or to arterial stretch; and the French label of a sheath refers to the catheter it accepts, not to a measurement of its bore.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q3",
      stem: "Which statement about radial sheaths reflects Brilakis's access chapter?",
      options: [
        "Long radial sheaths are the default choice for every radial case he does",
        "Long radial sheaths are usually avoided because of occlusion and spasm risk",
        "Radial sheaths should be one French larger than the guide to reduce friction",
        "Hydrophilic radial sheaths should be inserted dry to keep the coating intact",
      ],
      answer: 1,
      explanation:
        "In 4.3.8 Brilakis prefers 4 Fr sheaths for diagnostic angiography, or thin-walled sheaths, and usually avoids long radial sheaths because of the risk of radial artery occlusion and spasm; the sheath is dipped in saline to activate its hydrophilic coating. Elsewhere he uses 16–25 cm radial sheaths for left radial and CTO work, and his complications chapter (29.2.3.3) lists a 24 cm sheath reaching the brachial artery as a way to prevent spasm, so long sheaths are a deliberate choice, never the routine default. The 'one French larger' advice belongs to long femoral sheaths through tortuous iliacs.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "eq-sheaths-guides-q4",
      stem: "A patient with a previously stented, tortuous left iliac artery needs complex PCI from the left femoral route. Which sheath plan best follows Brilakis?",
      options: [
        "A 10 cm sheath, with the guide advanced through the iliac stent over a 0.035 in. wire",
        "A 45 cm sheath taken through the iliac stent, so that guides never touch the stent",
        "A 25 cm sheath stopping short of the stent, so the sheath cannot deform the stent",
        "A 4 Fr parallel sheath in the same artery, with the guide passed through the stent",
      ],
      answer: 1,
      explanation:
        "With iliac stents in place Brilakis prefers a long sheath through them to minimise the risk of stent deformation or dislodgement, and a 45 cm sheath also gives support for complex PCI. Guides passed through peripheral stents can catch and dislodge them (his Fig. 5.8 shows one carried into the aorta). The parallel sheath technique straightens tortuosity but does not keep the guide off the stent.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q5",
      stem: "An 8 Fr guide extension is placed inside an 8 Fr guide. Its remaining lumen is closest to which of these?",
      options: [
        "That of a 7 Fr guide (0.081 in.)",
        "That of a 6 Fr guide (0.071 in.)",
        "That of a 5 Fr guide (0.058 in.)",
        "That of a 4 Fr diagnostic catheter",
      ],
      answer: 1,
      explanation:
        "An 8 Fr extension has an inner diameter of 0.071–0.072 in., the same as a 6 Fr guide such as one with a 0.071 in. lumen; extensions leave about two French less than the guide. The 7 Fr guide figure ignores the extension's wall, and 0.058 in. is closer to what a 6 Fr extension leaves.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q6",
      stem: "You have a 6 Fr extension in an 8 Fr guide and now need a second coronary wire. What is the main hazard Brilakis describes?",
      options: [
        "The second wire will push the extension deeper into the coronary artery as it goes",
        "It tends to travel outside the extension, alongside the inner guide wall",
        "The extension will be ejected out of the guide when the new wire reaches its tip",
        "The second wire will twist the first wire tightly around the extension's cylinder",
      ],
      answer: 1,
      explanation:
        "With an extension smaller than the guide, a wire advanced through the guide tends to pass outside the cylinder, between it and the guide wall (Fig. 30.31), so such attempts should be avoided. Even with matched sizes the wire tip can be damaged at the collar, which is why Brilakis suggests entering with the wire withdrawn inside a microcatheter. Ejection is a risk of forceful injection, and wire wrap involves the push rod, not the cylinder.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q7",
      stem: "Which way of taking a guide extension into a diseased proximal vessel does Brilakis generally prefer, and why?",
      options: [
        "Over the bare 0.014 in. wire, because it is quickest and keeps the trace normal",
        "Inchworming, because a balloon straddling the extension tip keeps it centred",
        "Balloon-assisted tracking at rated burst pressure, because it pushes hardest",
        "A distal anchor, because it avoids the need for any balloon in the extension",
      ],
      answer: 1,
      explanation:
        "Brilakis generally prefers inchworming (a small balloon straddling the extension tip, inflated at low pressure, the extension advanced as it deflates) because it centres the extension and is less likely to injure the vessel. Advancing over a balloon or a microcatheter is preferred to the bare wire, over which the extension's edge can catch a plaque and dissect. Balloon-assisted tracking uses nominal, not rated burst, pressure; the distal anchor itself uses a balloon on a second wire.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q8",
      stem: "With an extension deep in the circumflex the pressure is damped. A colleague suggests a quick contrast injection to check the position. Which outcome illustrated by Brilakis is the reason to refuse?",
      options: [
        "Air drawn into the extension through the Y-connector's haemostatic valve",
        "A dissection travelling back from the vessel into the aortic root",
        "The extension being drawn deeper into the vessel by the injection's recoil",
        "Contrast escaping through the guide's side holes and spoiling the picture",
      ],
      answer: 1,
      explanation:
        "Brilakis's Fig. 30.35 shows a retrograde dissection into the aortic root after contrast was injected through an extension deep in the circumflex with a damped waveform; such dissections can spread forwards or backwards. Forceful injection can eject (push forward) an extension, which is why the push rod is held, but that is not the danger he illustrates for the damped case.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "eq-sheaths-guides-q9",
      stem: "In a series of 363 guide extension-supported PCIs, which pair of extension-related complication rates was reported?",
      options: [
        "Stent deformation 0.2% and coronary dissection 0.3%",
        "Stent deformation 2.2% and coronary dissection 3.3%",
        "Stent deformation 8.2% and coronary dissection 13.3%",
        "Stent deformation 12.2% and coronary dissection 3.3%",
      ],
      answer: 1,
      explanation:
        "Waterbury and colleagues reported device delivery success of 80.2%, extension-associated stent deformation in 2.2% (8 of 363) and coronary dissection in 3.3% (12 of 363), both declining over the study period as designs and experience improved. The other figures are not from the study.",
      difficulty: 3,
      refs: ["waterbury-guide-extension-2016"],
    },
    {
      id: "eq-sheaths-guides-q10",
      stem: "For a retrograde case through a vein graft, no 90 cm 7 Fr guide is available. Which statement about shortening a 100 cm guide is correct?",
      options: [
        "Cut the tip off, then reshape the curve with steam before inserting it",
        "Rejoin the cut pieces inside a 6 Fr sheath segment flared with a 7 Fr dilator",
        "Rejoin the cut pieces inside an 8 Fr sheath segment so that they slide in easily",
        "Once rejoined, balloon shaft markers can be trusted to keep a trapping balloon inside it",
      ],
      answer: 1,
      explanation:
        "Brilakis removes a segment from the shaft (not the tip) and rejoins the two pieces inside a 3–4 cm length of sheath one French smaller than the guide, flared with a dilator of the guide's size, covering the joint with a transparent dressing. A larger connector would hold the pieces loosely, and in a short or shortened guide Brilakis says balloon shaft markers cannot be relied on to keep a trapping balloon inside the guide.",
      difficulty: 3,
      refs: [...BRILAKIS, "wu-retrograde-tips-2008"],
    },
    {
      id: "eq-sheaths-guides-q11",
      stem: "A 7 Fr sheath is passed through the valve of a microaxial pump's 14 Fr femoral sheath so that a guide can go in without a second puncture. The 90 cm guide does not reach the left main. What does Brilakis advise?",
      options: [
        "Advance the pump further into the ventricle so the long sheath can move deeper into the aorta",
        "Use a 100 cm (or 125 cm) guide, or a short 7 Fr sheath instead of a 45 cm one",
        "Add a guide extension through the guide and inject through it to locate the left main ostium",
        "Change to a 6 Fr guide, which comes in a longer length for the same catalogue curve",
      ],
      answer: 1,
      explanation:
        "Brilakis lists a 45 cm sheath that cannot go fully into the body, a 90 cm guide, and tall or tortuous patients as causes, and prevents them with 100 cm (or 125 cm) guides or short 7 Fr sheaths. Moving the pump to make room is unsafe (forward movement can injure the ventricle). A guide extension is among his general solutions when a guide fails to reach the root (5.3.4), but injecting through it to hunt for the ostium is not, because injection through an extension risks hydraulic dissection (30.3.4). French size does not change guide length.",
      difficulty: 3,
      refs: BRILAKIS,
    },
  ],
  sims: [
    { sim: "procedure", task: "Choose sheath size and type for the planned work and the artery, then aspirate and flush the sheath with separate syringes before any guide goes in." },
    { sim: "cathlab", task: "From the femoral route, compare how the tip of a JR4 and an AL1 responds to the hub, and plan the sheath length you would use if the iliac were tortuous." },
  ],
  caseIds: ["eq-sheaths-guides-case-stuck-stent", "eq-sheaths-guides-case-reach"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "eq-sheaths-guides-case-stuck-stent",
    title: "The stent that stopped at the bend: a guide extension from the radial route",
    trackId: "equipment",
    stage: 3,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 30.3 (guide catheter extensions: types, uses, tips and complications), 23.1.3 (guide extension) and 9.7.7 (resistance at the extension)" },
    summary: "A calcified, tortuous RCA treated from the right radial artery, where a stent stops at a proximal bend: choosing, sizing, placing and using a guide extension, and avoiding its complications.",
    presentation:
      "A 69-year-old woman with stable angina despite two anti-anginal drugs has a 90% calcified stenosis in the mid RCA beyond a tortuous proximal segment. Access is right radial with a 6 Fr thin-walled sheath and a 6 Fr AL1 guide. The lesion has been pre-dilated with a 2.5 mm non-compliant balloon, which expanded fully. Blood pressure 138/76 mmHg, heart rate 64/min, ACT 280 s.",
    findings: [
      "Workhorse wire in the distal posterior descending artery.",
      "A 3.0 × 22 mm drug-eluting stent stops at the second proximal bend, well short of the lesion.",
      "As the stent is pushed, the AL1 starts to back out of the RCA ostium.",
      "Aortic trace from the guide is normal.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The stent stops and the guide is backing out. What do you do first?",
        options: [
          {
            text: "Stop pushing, keep the wire in place, make the guide coaxial and draw the stent back into the proximal vessel under fluoroscopy",
            best: true,
            feedback: "Right. Stop before the guide is lost or the wire is dragged back. Pull the stent back gently with the guide coaxial; forcing a stent against a non-coaxial guide tip is how stents are stripped.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push harder while the assistant pushes the guide forward",
            feedback: "Force against a bend throws the guide out of the ostium and drags the wire; the stent can deform on the calcium and then strip off on withdrawal.",
            stateDelta: { stability: -15, flags: ["forced-push"] },
            next: "c-forced",
          },
          {
            text: "Deploy the stent where it has stopped and treat the lesion with another stent",
            feedback: "A stent deployed in the wrong segment cannot be undone, and the next stent would have to cross it, where it is even more likely to stop.",
            stateDelta: { stability: -10, flags: ["misplaced-stent"] },
          },
        ],
      },
      {
        id: "c-forced",
        kind: "consequence",
        prompt: "The guide has fallen out of the ostium, the wire tip has withdrawn to the mid PDA and the stent is still at the bend. What now?",
        info: "The trace is normal; the wire is still distal to the lesion.",
        options: [
          {
            text: "Withdraw the stent coaxially, inspect it, re-seat the guide over the wire and add support before trying again",
            best: true,
            feedback: "Recovered. A stent that has been forced against calcium may be deformed: inspect it before reuse. Then add support rather than force.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Re-seat the guide by pushing it in over the stent shaft and push the stent again",
            feedback: "Repeating the manoeuvre that failed, now with a possibly damaged stent, risks deformation and loss.",
            stateDelta: { stability: -10, flags: ["stent-damage"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "How will you add support without losing the wire?",
        options: [
          {
            text: "A 6 Fr guide extension in the 6 Fr guide, choosing a 40 cm cylinder because this is a radial case",
            best: true,
            feedback: "Matched size, and the longer cylinder addresses the radial-specific risk of a stent stripping at the collar around the subclavian bend.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 5 Fr extension in the 6 Fr guide, because a smaller extension is easier to advance",
            feedback: "A smaller extension in a larger guide invites any new wire to run between the cylinder and the guide wall, and its bore may be too small for the stent.",
            stateDelta: { stability: -5, flags: ["mismatched-extension"] },
            next: "c-mismatch",
          },
          {
            text: "Exchange the AL1 for a 7 Fr guide over the wire",
            acceptable: true,
            feedback: "A bigger guide supports better, but exchanging a guide after a hard wire risks the wire, and from a radial sheath sized for 6 Fr it means changing the sheath too. Support can usually be added around the wire you have.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-mismatch",
        kind: "consequence",
        prompt: "The 5 Fr extension is in. A second wire you intend to pass through it runs between the cylinder and the guide wall instead, and the stent catches at the 5 Fr collar. What now?",
        options: [
          {
            text: "Remove the 5 Fr extension and replace it with a 6 Fr one, with the push rod under a towel",
            best: true,
            feedback: "Matching the extension to the guide removes the gap the wire slipped into and restores a bore the stent can pass.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the stent harder through the 5 Fr collar",
            feedback: "Stents deform at the collar when forced; deformed stents are lost on withdrawal.",
            stateDelta: { stability: -15, flags: ["stent-damage"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The 6 Fr extension is loaded. What do you do with the push rod as you advance it?",
        options: [
          {
            text: "Tuck the push rod under a towel beside the Y-connector, and keep the collar inside the guide",
            best: true,
            feedback: "This stops the wire wrapping around the rod, and the collar must never leave the guide.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Leave it free on the table beside the wire so both can be adjusted easily",
            feedback: "A loose rod and a loose wire wrap around each other; the next device then sticks at the cylinder entry.",
            stateDelta: { stability: -5, flags: ["wire-wrap"] },
            next: "c-wrap",
          },
        ],
      },
      {
        id: "c-wrap",
        kind: "consequence",
        prompt: "Later the stent sticks exactly at the entry of the extension's cylinder. What is the likely cause and the fix?",
        options: [
          {
            text: "Wire wrapped around the push rod: withdraw the extension and reinsert it, rod under a towel",
            best: true,
            feedback: "Resistance at the cylinder entry with a loose rod suggests wire wrap; removing and reinserting the extension corrects it.",
            stateDelta: { stability: 5 },
          },
          {
            text: "The stent is too big for the extension: push it through with more force",
            feedback: "A 6 Fr extension accepts a standard stent; force at the collar deforms the stent.",
            stateDelta: { stability: -10, flags: ["stent-damage"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The extension is at the guide tip. How do you take it past the tortuous, calcified proximal RCA?",
        options: [
          {
            text: "Inchworm: a 2.0 mm balloon half in and half out of its tip, inflated at 6–8 atm, the extension advanced as the balloon deflates, repeated as needed",
            best: true,
            feedback: "The balloon centres the extension at every step, so its edge does not catch the plaque.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the extension firmly along the bare wire",
            feedback: "The extension's edge rides the wire into the plaque and lifts a flap in the proximal RCA.",
            stateDelta: { stability: -20, flags: ["dissection"] },
            next: "c-dissection",
          },
          {
            text: "Balloon-assisted tracking: a balloon protruding from the extension inflated at nominal pressure and advanced with it",
            acceptable: true,
            feedback: "A described alternative, for example through tortuosity; Brilakis generally prefers inchworming because it centres the extension.",
          },
        ],
      },
      {
        id: "c-dissection",
        kind: "consequence",
        prompt: "A proximal RCA dissection appears where the extension passed. The wire is still distal and flow is TIMI 3. What now?",
        options: [
          {
            text: "Keep the wire, stop injecting through the extension, and plan to cover the dissection with the stenting",
            best: true,
            feedback: "Wire position is everything in a dissection; injections can extend it. The dissection is treated by stenting.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject firmly through the extension to define the dissection",
            feedback: "Injection can propagate the dissection, even back into the aortic root.",
            stateDelta: { stability: -20, flags: ["aortic-extension"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The extension is now 5 cm into the RCA, beyond the bends. The guide trace becomes damped. What do you do?",
        info: "The trace has lost its dicrotic notch and both pressures have fallen.",
        options: [
          {
            text: "Do not inject; ease the extension back until the trace recovers, then confirm antegrade flow and no vessel injury",
            best: true,
            feedback: "A damped trace means the tip is wedged. Restore the trace and confirm flow and integrity before proceeding.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject a small amount of contrast through the guide to see the extension tip",
            feedback: "Injection through a wedged extension is the classic cause of hydraulic dissection, which can track back to the aorta.",
            stateDelta: { stability: -25, flags: ["hydraulic-dissection"] },
            next: "c-hydraulic",
          },
          {
            text: "Give intracoronary nitrate through the guide for presumed spasm",
            feedback: "Any injection goes into a closed space while the extension is wedged; the first step is to restore the trace.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-hydraulic",
        kind: "consequence",
        prompt: "Contrast stains the proximal RCA wall and tracks towards the right sinus. The patient has chest pain. What now?",
        info: "Blood pressure 112/64 mmHg; wire still distal.",
        options: [
          {
            text: "Stop all injections, keep the wire, and stent the RCA ostium with the stent protruding 1–2 mm into the aorta; plan follow-up aortic imaging and blood pressure control",
            best: true,
            feedback: "Aorto-coronary dissection: stop injecting (injections widen the dissection plane), keep the wire, and seal the ostium with a stent that protrudes 1–2 mm into the aorta, ideally placed with IVUS. If the dissection is large, serial CT or transoesophageal imaging and careful blood pressure control follow. Its management is taught in cm-principles-closure.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject again with more force through the extension to see how far the stain has spread into the sinus and aorta",
            feedback: "Each injection can enlarge the dissection plane.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The trace is normal. The stent passes the collar and reaches the lesion, but on positioning it is 3 mm too distal and will not come back smoothly into the extension tip. What is the safe approach?",
        options: [
          {
            text: "Reposition gently; if it must be withdrawn into the extension, do so slowly and inspect the stent before any reuse",
            best: true,
            feedback: "Stents can deform when drawn back into the extension tip; a deformed stent can be lost next time.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull it firmly into the extension and reuse it straight away",
            feedback: "A stent pulled hard into the tip may be deformed; reused uninspected, it can be stripped off and lost.",
            stateDelta: { stability: -15, flags: ["stent-loss-risk"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The stent is deployed and post-dilated. Before finishing, a firm injection is needed for the final views. What do you do?",
        options: [
          {
            text: "Withdraw the extension into the guide, hold the push rod during the injection, and inspect the proximal RCA where the extension travelled",
            best: true,
            feedback: "Holding the rod prevents ejection, and the segment the extension passed is where an extension-related dissection would be.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject firmly with the extension still deep, without holding the push rod",
            feedback: "A forceful injection can shoot an unheld extension into the vessel, and injecting through a deep extension risks dissection.",
            stateDelta: { stability: -15, flags: ["ejection"] },
          },
        ],
      },
    ],
    outcome:
      "The stent is delivered through a matched 6 Fr extension inchwormed beyond the bends; final angiography shows full expansion and an intact proximal RCA. The radial sheath is removed with patent haemostasis.",
    outcomeVariants: [
      { flag: "dissection", text: "The proximal dissection made by the bare-wire advance needed an extra stent, lengthening the stented segment." },
      { flag: "hydraulic-dissection", text: "The hydraulic dissection from injecting through the wedged extension required ostial stenting and close observation for aortic extension." },
      { flag: "aortic-extension", text: "Injection into the dissection carried it towards the aortic root; the patient needed imaging of the aorta and a longer stay." },
      { flag: "stent-damage", text: "A stent was deformed at the collar or on the calcium and had to be discarded." },
      { flag: "ejection", text: "The unheld extension was driven forward by the final injection; the proximal RCA had to be re-imaged for injury." },
    ],
    learningPoints: [
      "Stop pushing when a stent stops and the guide backs out; add support around the wire rather than exchanging the guide.",
      "Match the extension to the guide; consider a 40 cm cylinder from the radial route.",
      "Push rod under a towel, collar inside the guide; resistance at the cylinder entry suggests wire wrap.",
      "Inchworm the extension past disease; do not ride it along the bare wire.",
      "Damped trace: no injection; restore the trace and confirm flow.",
      "Inspect any stent pulled back into the extension; hold the push rod during forceful injection.",
    ],
    refs: BRILAKIS,
  },
  {
    id: "eq-sheaths-guides-case-reach",
    title: "Long iliacs and a long graft: sheath length and guide length in a retrograde CTO",
    trackId: "equipment",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 30.1 (sheaths), 30.2.3–30.2.4 (guide length and shortening), 4.1 and 21.4 (access for CTO PCI), 5.3 and 5.7 (long sheaths, catheter handling, kinking), 8.9 and 9.7.7 (shaft markers), 18.7.2 (native CTO recanalisation after recurrent vein graft failure) and 21 (bypass grafts, even occluded ones, as retrograde routes)" },
    summary: "Planning femoral access through tortuous iliac arteries and a retrograde route through a long vein graft: sheath length, catheter-to-sheath sizing, guide length and shortening a guide by hand.",
    presentation:
      "A 71-year-old man with prior bypass surgery has recurrent angina. His native RCA has a chronic total occlusion of its proximal segment; the vein graft to the distal right posterior descending artery has failed repeatedly despite two earlier graft stenting procedures. After heart-team review, recanalisation of the native RCA is planned in preference to a third graft intervention, using the graft as the retrograde route; the antegrade approach is through the native RCA. CT shows tortuous iliac arteries on both sides. He has normal renal function. Blood pressure 144/80 mmHg, heart rate 70/min.",
    findings: [
      "Tortuous iliac arteries bilaterally; no iliac stents.",
      "Long vein graft from the ascending aorta to the distal PDA, stented twice, now with severe in-stent restenosis in its body but still open as a channel to the distal RCA.",
      "Proximal RCA CTO with a blunt proximal cap.",
      "Only 100 cm guides are available in this laboratory today.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which femoral sheaths do you plan for the antegrade (native RCA) guide?",
        options: [
          {
            text: "An 8 Fr, 45 cm sheath, placed once the wire has crossed the tortuous iliac",
            best: true,
            feedback: "A long sheath bypasses the iliac tortuosity for every later catheter and improves guide support and torque, which this CTO will need; 7–8 Fr guides are standard for CTO work.",
            stateDelta: { stability: 5 },
          },
          {
            text: "An 8 Fr, 10 cm sheath, and manage the tortuosity with the guide",
            feedback: "Every guide movement then fights the iliac bends; handling worsens through a long case and the guide may kink.",
            stateDelta: { stability: -10, flags: ["short-sheath"] },
            next: "c-kink",
          },
          {
            text: "A 6 Fr, 10 cm sheath to minimise the arteriotomy",
            feedback: "A 6 Fr system limits CTO options such as IVUS-guided cap puncture and complication management, and does nothing for the tortuosity.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-kink",
        kind: "consequence",
        prompt: "During engagement the AL1 tip stops responding to the hub and the trace damps: the guide has kinked in the iliac bends. What now?",
        options: [
          {
            text: "Screen the whole guide, untwist gently and pass a 0.035 in. wire through the kink, escalating if needed; once it is out, change to a long sheath",
            best: true,
            feedback: "Brilakis's escalation for a kink: untwist and pass a wire; if that fails, snare the tip from a second access, pressurise the lumen gently at 3–4 atm, cut the hub and advance a sheath of the same size or 1–2 Fr larger over it, and finally pull the kinked segment out through the arteriotomy. Once the guide is out, a long sheath helps prevent a repeat.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep turning in the same direction until the tip moves",
            feedback: "More torque tightens the kink and may fracture the guide.",
            stateDelta: { stability: -15, flags: ["guide-fracture-risk"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Through the 45 cm sheath, the 8 Fr AL1 still turns sluggishly in the tortuous aorta; the trace is normal and screening the whole guide shows no kink. What change helps most?",
        options: [
          {
            text: "Use a 7 Fr guide within the 8 Fr sheath, or stiffen the guide with a 0.035 in. wire during manipulation",
            best: true,
            feedback: "A catheter slightly smaller than the sheath, or a stiffening wire, eases handling through tortuosity.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Withdraw the long sheath to 15 cm to free the guide",
            feedback: "Pulling the sheath back surrenders the support and straightening you placed it for.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "For the retrograde guide in the vein graft, you expect the microcatheter route through the long graft to be too long for a 100 cm guide. With no 90 cm guide in stock, what do you plan?",
        options: [
          {
            text: "Shorten the graft guide before wiring: engage, mark at the sheath, cut out the segment and rejoin it",
            best: true,
            feedback: "Shortening is reserved for exactly this: retrograde routes through grafts where the microcatheter may not reach the antegrade guide. Doing it before wiring avoids losing a hard-won position.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Start with the 100 cm guide and see how far the microcatheter gets",
            acceptable: true,
            feedback: "Reasonable if you expect to reach, but if the microcatheter falls short, changing the guide afterwards risks the retrograde wire position.",
            stateDelta: { stability: -5, flags: ["late-shortening"] },
            next: "c-short",
          },
          {
            text: "Use a 125 cm guide in the graft for extra length",
            feedback: "A longer guide makes the problem worse: the retrograde equipment has further to travel before it emerges.",
            stateDelta: { stability: -10 },
            next: "c-short",
          },
        ],
      },
      {
        id: "c-short",
        kind: "consequence",
        prompt: "The retrograde wire is through the graft into the distal RCA, but the microcatheter cannot reach the antegrade guide. What now?",
        options: [
          {
            text: "Bring the antegrade side closer, for example a guide extension towards the meeting point, and plan a shortened guide if the gap remains",
            best: true,
            feedback: "A guide extension from the antegrade side shortens the distance the retrograde equipment must cover; shortening the retrograde guide is the other answer but now risks the wire.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the microcatheter harder through the graft",
            feedback: "Length does not respond to force; the microcatheter can be damaged or the graft injured.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "You are shortening the 7 Fr graft guide. How do you make the connector?",
        options: [
          {
            text: "Cut 3–4 cm of 6 Fr sheath, flare both ends with a 7 Fr dilator, push both guide pieces in and cover the joint with a transparent dressing",
            best: true,
            feedback: "One French smaller than the guide gives a snug sleeve; the dressing helps stop the pieces separating.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Cut 3–4 cm of 8 Fr sheath and slide the pieces in without flaring",
            feedback: "A larger sleeve holds the pieces loosely; they can come apart in the patient.",
            stateDelta: { stability: -10, flags: ["loose-joint"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Later you need to trap the retrograde wire in the shortened guide with a trapping balloon. How do you place it?",
        options: [
          {
            text: "Place it under fluoroscopy, because shaft markers cannot be trusted in a shortened guide",
            best: true,
            feedback: "In a hand-shortened guide the markers no longer match its length, so the balloon could enter the vessel unseen.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance it to the 100 cm shaft mark without screening",
            feedback: "In a shortened guide the balloon will already have left the guide by that mark.",
            stateDelta: { stability: -15, flags: ["balloon-in-graft"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Reverse CART is under way but the retrograde wire will not enter the antegrade guide. Which equipment move does Brilakis describe?",
        options: [
          {
            text: "Advance a guide extension through the antegrade guide towards the overlap, to shorten the distance the retrograde wire must travel",
            best: true,
            feedback: "Guide extension reverse CART: the extension meets the retrograde wire nearer the occlusion.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject forcefully through the antegrade guide to open the space",
            feedback: "Forceful antegrade injection after the proximal vessel has been dilated risks extending the dissection.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "With a 45 cm femoral sheath, a 7 Fr antegrade guide and a hand-shortened graft guide, the retrograde wire is externalised through an antegrade guide extension and the RCA is stented.",
    outcomeVariants: [
      { flag: "short-sheath", text: "The short sheath cost time with a kinked guide before a long sheath was placed." },
      { flag: "late-shortening", text: "Deciding on reach only after the wire was across made every later change riskier." },
      { flag: "loose-joint", text: "The loose joint in the shortened guide came apart during manipulation and the guide had to be replaced." },
      { flag: "balloon-in-graft", text: "The trapping balloon left the shortened guide unseen and had to be withdrawn from the graft." },
      { flag: "guide-fracture-risk", text: "Continued torque on the kinked guide risked fracturing it; removal required careful untwisting." },
    ],
    learningPoints: [
      "Tortuous iliacs and a complex CTO: a long (45 cm) femoral sheath, 7–8 Fr.",
      "Handling through tortuosity: a guide one French smaller than the sheath, or a stiffening wire.",
      "Plan reach before wiring: 90 cm or shortened guides for retrograde routes through grafts.",
      "Shorten with a 3–4 cm sheath sleeve one French smaller, flared with a guide-sized dilator, and a dressing over the joint.",
      "Shaft markers cannot be trusted in a shortened guide.",
      "A guide extension from the antegrade side shortens the gap in reverse CART.",
    ],
    refs: [...BRILAKIS, "wu-retrograde-tips-2008", "huang-guide-extension-reverse-cart-2017"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "access-sheath-plan-size",
    lab: "access",
    when: { phase: ["plan", "sheath"] },
    title: "Size the sheath to the plan and to the artery",
    text: "The French label is the catheter the sheath accepts; its outside is about two sizes larger (a 6 Fr sheath measures like an 8 Fr guide). Pick the smallest sheath that carries the planned devices, and at the wrist check it against the radial diameter on ultrasound: a sheath large for the artery invites spasm and occlusion.",
    tone: "do",
    lessonId: "eq-sheaths-guides-sizing",
    sources: [B("30.1"), B("4.3"), B("29.2"), O_RADIAL],
    refs: BOOKS,
  },
  {
    id: "access-sheath-ooze-upsize",
    lab: "access",
    when: { phase: ["sheath", "femoral"], event: ["bleeding"] },
    title: "Bleeding around a femoral sheath: upsize it",
    text: "For bleeding around the sheath itself, Brilakis's fix is a larger sheath. Bleeding from a branch or the vessel needs the access-complication pathway, and an expanding haematoma is not ooze: compress, image and follow that pathway.",
    tone: "bailout",
    lessonId: "eq-sheaths-guides-sizing",
    sources: [B("4.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-sheath-femoral-length-tip",
    lab: "access",
    when: { phase: ["plan", "sheath"], route: ["femoral"] },
    title: "Choose femoral sheath length by where the tip will lie",
    text: "A 10 cm sheath ends near the internal iliac origin, a 25 cm sheath at the distal aortic bifurcation and a 45 cm sheath near the diaphragm. Put the tip beyond what you are bypassing (tortuosity, stenosis, iliac stents, an obese groin) and use 45 cm when a complex case needs strong guide support.",
    tone: "do",
    lessonId: "eq-sheaths-guides-long-sheathless",
    sources: [B("30.1"), B("4.2"), B("5.3")],
    refs: BRILAKIS,
  },
  {
    id: "access-sheath-radial-long-caution",
    lab: "access",
    when: { phase: ["radial", "sheath"], route: ["radial"] },
    title: "Long radial sheaths: only for a reason",
    text: "Brilakis's access chapter usually avoids long radial sheaths (occlusion, spasm); his complications chapter lists a 24 cm sheath that reaches the brachial artery as a way to prevent spasm, and 16–25 cm sheaths ease left radial and CTO work. Choose one for a reason, not by habit.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-long-sheathless",
    sources: [B("4.3"), B("29.2"), B("30.1"), B("21")],
    refs: BRILAKIS,
  },
  {
    id: "access-sheath-sheathless-option",
    lab: "access",
    when: { phase: ["plan"], route: ["radial"] },
    title: "Guide bigger than the artery allows? Go sheathless",
    text: "Without a sheath the artery only has to take the guide. Options: a dedicated sheathless system (7.5 Fr through a hole like a 5 Fr sheath's), a dilator run through a standard guide, a 125 cm diagnostic catheter as the dilator for a guide two French larger, or balloon-assisted tracking at 3–6 atm.",
    tone: "do",
    lessonId: "eq-sheaths-guides-long-sheathless",
    sources: [B("30.1"), B("5.3")],
    refs: BRILAKIS,
  },
  {
    id: "access-sheath-sheathless-spasm",
    lab: "access",
    when: { phase: ["radial", "sheath"], route: ["radial"], event: ["radial-spasm"] },
    title: "Radial spasm: smaller, smoother or sheathless",
    text: "After vasodilators and sedation, Brilakis's equipment answers to radial spasm include a 5 Fr guide, a guide with a dimpled low-friction surface, a sheathless guide or dilator system, and hydrophilic or low-profile sheaths. Never pull a sheath out against spasm.",
    tone: "do",
    lessonId: "eq-sheaths-guides-long-sheathless",
    sources: [B("5.3"), B("29.2")],
    refs: BRILAKIS,
  },
  {
    id: "mcs-pump-sheath-guide-reach",
    lab: "mcs",
    when: { phase: ["insert", "manage"], procedure: ["impella"] },
    title: "Guide through the pump sheath: check the reach",
    text: "A 7 Fr sheath can be passed through the valve of a microaxial pump's 14 Fr sheath for the guide. If that 45 cm sheath cannot go fully in, or the guide is 90 cm, it may not reach the ostia: use a 100 cm (or 125 cm) guide or a short 7 Fr sheath, and hold the pump while the sheath goes in.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-long-sheathless",
    sources: [B("14.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-size-match",
    lab: "pci",
    when: { phase: ["guide", "stent", "lesion-prep"], event: ["poor-guide-support", "stent-uncrossable", "balloon-uncrossable"] },
    title: "Match the extension to the guide and to the device",
    text: "If more wires may need to pass, use an extension of the guide's own size: with a smaller extension in a larger guide, new wires tend to run outside its cylinder (the one-size-smaller pairing is used on purpose in bifurcation atherectomy). An extension leaves about two French less lumen (an 8 Fr extension is like a 6 Fr guide inside), so check that the stent, burr or catheter will still pass.",
    tone: "do",
    lessonId: "eq-sheaths-guides-extension-device",
    sources: [B("30.3"), B("16.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-engage-when-guide-cannot",
    lab: "pci",
    when: { phase: ["guide"], event: ["engage-fail", "dilated-root", "anomalous-origin", "non-coaxial"] },
    title: "Guide will not sit? An extension can reach the ostium",
    text: "When the guide cannot engage coaxially (dilated ascending aorta, a curve of the wrong size, an anomalous origin or a mammary graft), a guide extension can engage the vessel and carry equipment in. Take it over a balloon, not the bare wire.",
    tone: "do",
    lessonId: "eq-sheaths-guides-extension-device",
    sources: [B("30.3"), B("5.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-ostial-keep-guide-out",
    lab: "pci",
    when: { phase: ["guide", "stent"], event: ["catheter-too-deep"], requires: ["aorto-ostial-lesion", "pressure-damped"] },
    title: "Ostial lesion: let a small extension engage instead of the guide",
    text: "If the guide keeps diving into a diseased ostium and damping, a small guide extension can engage the vessel while the guide stays outside the ostium, lowering the risk of aorto-coronary dissection. This is not the answer to a damped trace with an extension already deep in the vessel: that extension is wedged, so do not inject and ease it back.",
    tone: "do",
    lessonId: "eq-sheaths-guides-extension-device",
    sources: [B("15.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-thrombus-aspiration",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["thrombus"] },
    title: "Aspiration through a guide extension: know the cost",
    text: "Routine thrombus aspiration is not recommended; keep it for bail-out when a large thrombus persists. If you do aspirate, a guide extension taken into the vessel lets you aspirate through the guide, but deep extensions can cause distal dissection, ischaemia with haemodynamic compromise and stent deformation, and a thrombectomy catheter may not fit inside one.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-extension-device",
    sources: [B("30.3"), B("20")],
    refs: [...BRILAKIS, "total-2015", "esc-acs-2023"],
  },
  {
    id: "pci-gx-atherectomy-plan",
    lab: "pci",
    when: { phase: ["plan", "lesion-prep"], event: ["balloon-uncrossable", "balloon-undilatable", "poor-guide-support"] },
    title: "Burr through an extension: size the guide for it",
    text: "For a burr through an extension, Brilakis prefers a 7 Fr extension whether the burr is 1.25 mm or 1.5 mm. In a bifurcation, where the extension is deliberately smaller than the guide so the side-branch wire stays outside it, a 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or crown and an 8 Fr guide with a 7 Fr extension a 1.5 mm burr. With a standard extension in, an orbital crown cannot be trapped with a balloon in 6, 7 or 8 Fr guides; an 8 Fr extension with a built-in trapping balloon does allow it.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-extension-device",
    sources: [B("16.1"), B("19.9")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-second-wire",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable"] },
    title: "Another wire with an extension in: remove it or go slowly",
    text: "Take the extension out before adding a wire if you can. If not, pass the wire through the collar under fluoroscopy without force, ideally with its tip withdrawn inside a microcatheter, because the tip can be damaged entering the cylinder.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("30.3"), B("8.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-nested-extensions",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable"] },
    title: "Several extreme bends: nest two extensions",
    text: "Where one extension cannot negotiate a series of extreme bends, a 6 Fr extension can be passed through an 8 Fr extension and the pair advanced in steps (mother, daughter, granddaughter), then the stent delivered through both.",
    tone: "do",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("30.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-through-proximal-stent",
    lab: "pci",
    when: { phase: ["stent"], event: ["stent-uncrossable"] },
    title: "Distal stent after a proximal one: through it, gently",
    text: "Stent distal to proximal when you can. If a distal stent is needed after the proximal one, an extension passed through the proximal stent can deliver it, but forcing the extension through a deployed stent can deform it longitudinally.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("30.3"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-radial-long-cylinder",
    lab: "pci",
    when: { phase: ["guide", "stent"], event: ["stent-uncrossable", "subclavian-tortuosity"] },
    title: "Radial route: consider the 40 cm cylinder",
    text: "From the radial artery a stent can deform or strip off its balloon at the extension's collar around the subclavian bend. For radial cases Brilakis suggests considering an extension with a 40 cm rather than 25 cm cylinder.",
    tone: "do",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("23.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-fracture-retrieval",
    lab: "pci",
    when: { event: ["equipment-entrapment"] },
    title: "Fractured extension: balloon inside the cylinder",
    text: "If an extension's shaft breaks and leaves the cylinder in the artery, advance a balloon into the retained cylinder, inflate it there and withdraw balloon and fragment together, as in Brilakis's illustrated retrieval.",
    tone: "bailout",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("30.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-gx-retrieve-entrapped-device",
    lab: "pci",
    when: { event: ["equipment-entrapment"] },
    title: "Entrapped burr or balloon: cut the shaft, bring an extension up",
    text: "Cut the shaft of the entrapped burr or balloon outside the body, advance a guide extension over it as close as possible to the device, then pull. An extension with a trapping balloon can also trap the entrapped balloon in the guide; a balloon that will not deflate can be punctured with a stiff wire guided through the extension.",
    tone: "bailout",
    lessonId: "eq-sheaths-guides-extension-use",
    sources: [B("27.3"), B("19.9"), B("30.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-guide-reach-distal-target",
    lab: "pci",
    when: { phase: ["plan"], vessel: ["SVG", "LIMA", "RIMA"] },
    title: "Distal target through a graft: plan the reach",
    text: "A lesion far beyond the guide tip, especially past a graft anastomosis, may be out of reach. Plan a 90 cm (or shortened) guide, 300 cm wires and the longest-shaft balloons and stents; deep intubation or a guide extension can help.",
    tone: "do",
    lessonId: "eq-sheaths-guides-length",
    sources: [B("30.2"), B("18.8"), B("18.10"), B("10.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-guide-short-markers",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent"], requires: ["cto"] },
    title: "Short guide: use the 90 cm mark, and screen in a cut one",
    text: "Through a 90 cm guide, screen when the balloon's 90 cm mark reaches the Y-connector; waiting for the 100 cm mark lets it leave the guide unseen. In any short or hand-shortened guide, shaft marks cannot be relied on to keep a trapping balloon inside: place trapping balloons under fluoroscopy.",
    tone: "caution",
    lessonId: "eq-sheaths-guides-length",
    sources: [B("9.7"), B("28.2"), B("8.9")],
    refs: BRILAKIS,
  },
  {
    id: "pci-guide-shorten-by-hand",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "No short guide: shorten one before you wire",
    text: "Engage, mark the guide at the sheath, cut out that segment, and rejoin the pieces inside a 3–4 cm piece of sheath one French smaller, flared with a dilator of the guide's size; dress the joint. Expect poorer torque, and do it before the wire is across.",
    tone: "do",
    lessonId: "eq-sheaths-guides-length",
    sources: [B("30.2")],
    refs: [...BRILAKIS, "wu-retrograde-tips-2008"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "duong-guide-extension-2015",
    kind: "paper",
    citation:
      "Duong T, Christopoulos G, Luna M, et al. Frequency, indications, and outcomes of guide catheter extension use in percutaneous coronary intervention. J Invasive Cardiol. 2015;27:E211–E215.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26429852/",
    note: "PMID: 26429852. Checked on PubMed: authors, title, journal, year 2015, volume 27, issue 10, pages E211–5. Abstract read: 1539 PCIs, extension used in 83 (5.4%); RCA 50% of target vessels; indications delivery/support 84.7%, thrombus aspiration 10.5%, retrieval 2.3%, reverse CART 1%, visualisation 1%; extension success 73.3%; 4 patients (4.8%) with extension-related complications (2 vessel injuries, 1 requiring emergency CABG; 2 equipment losses: distal marker detachment, sheared guidewire tip). Brilakis's reference 27 in chapter 30.",
    verified: true,
  },
  {
    id: "waterbury-guide-extension-2016",
    kind: "paper",
    citation:
      "Waterbury TM, Sorajja P, Bell MR, et al. Experience and complications associated with use of guide extension catheters in percutaneous coronary intervention. Catheter Cardiovasc Interv. 2016;88:1057–1065.",
    url: "https://doi.org/10.1002/ccd.26329",
    note: "PMID: 26698371. Checked on PubMed: authors, title, journal, year 2016, volume 88, issue 7, pages 1057–1065. Abstract read: 363 extension-facilitated PCIs among 6,088; procedural success with device delivery 80.2%; stent deformation 2.2% (8/363); coronary dissection 3.3% (12/363); both declining over time. Brilakis's reference 31 in chapter 30.",
    verified: true,
  },
  {
    id: "chen-guide-extension-maude-2019",
    kind: "paper",
    citation:
      "Chen Y, Shah AA, Shlofmitz E, et al. Adverse events associated with the use of guide extension catheters during percutaneous coronary intervention: reports from the Manufacturer and User Facility Device Experience (MAUDE) database. Cardiovasc Revasc Med. 2019;20:409–412.",
    url: "https://doi.org/10.1016/j.carrev.2019.02.016",
    note: "PMID: 31079818. Checked on PubMed: authors, title, journal, year 2019, volume 20, issue 5, pages 409–412. Abstract read: for one device 38 of 65 reports (58%) were catheter fracture, for the other 164 of 408 (40%) a broken catheter, the largest category for each; others were inability to pass or damage to devices, failure to advance, dissection and perforation. Brilakis's reference 29 in chapter 30.",
    verified: true,
  },
  {
    id: "wu-retrograde-tips-2008",
    kind: "paper",
    citation: "Wu EB, Chan WW, Yu CM. Retrograde chronic total occlusion intervention: tips and tricks. Catheter Cardiovasc Interv. 2008;72:806–814.",
    url: "https://doi.org/10.1002/ccd.21726",
    note: "PMID: 19012325. Checked on PubMed: authors, title, journal, year 2008, volume 72, issue 6, pages 806–814. Abstract read: describes techniques to shorten the guiding catheter for the retrograde approach, among others. Brilakis's reference 9 in chapter 30 for the guide-shortening technique.",
    verified: true,
  },
];
