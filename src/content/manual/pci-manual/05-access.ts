// Module pm-access: arterial and venous access (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.4, 4.1-4.4, 5.2, 5.3, 11.1, 14.1, 14.4, 14.5, 21.4, 29.1, 29.2, 30.1, 30.15;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 3 (vascular access) with
// passages from chapters 4, 5, 9 and 10. Every claim is listed with its page in docs/curriculum/evidence/pm-access.md.
// Neighbouring modules: pm-planning (access history at pre-assessment), pm-antithrombotics (radial heparin),
// pm-to-the-root (wire and catheter resistance on the way to the aortic root), pm-engaging (radial spasm and
// entrapment during the case), pm-closure (closure eligibility, compression and closure devices),
// pm-support-devices (running an Impella or VA-ECMO), cm-access-complications (treating access complications).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-access",
  title: "Arterial and venous access",
  stage: 2,
  summary:
    "How to choose the access route with the five-step algorithm, then obtain it safely: the Seldinger and micropuncture sequence, fluoroscopy- and ultrasound-guided femoral puncture with the femoral angiogram, ultrasound-guided radial puncture and sheath, the distal radial, ulnar, brachial, axillary and transcaval routes, femoral, jugular and subclavian venous access, what to do when a wire, dilator or sheath will not advance, and large-bore access with the double-suture pre-close.",
  objectives: [
    "Choose radial or femoral access with the five-step algorithm, and adapt the choice to grafts, peripheral disease, aneurysm, coarctation, anticoagulation and complex PCI, including the sheath size and length.",
    "Describe the Seldinger technique and its micropuncture modification, and use ultrasound to find, enter and confirm the target vessel.",
    "Obtain common femoral access step by step, using the femoral head on fluoroscopy, ultrasound of the bifurcation, a screened micropuncture wire and a femoral angiogram in the ipsilateral oblique view.",
    "Obtain radial access step by step with ultrasound, a small volume of local anaesthetic, a thin-walled sheath and a vasodilator, and respond to resistance and spasm at the wrist without force.",
    "Explain the indications, technique and limits of distal radial, ulnar, brachial, axillary and transcaval access, and how the evidence on distal radial access has moved since the manual.",
    "Cannulate the femoral, internal jugular and subclavian veins safely, and prevent arteriovenous fistula when artery and vein share a groin.",
    "Troubleshoot a wire, dilator or sheath that will not advance at each stage of the access sequence.",
    "Plan and obtain large-bore femoral access with two pre-placed sutures, sequential dilatation and a limb check, and close it at the end.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-access-site-choice",
      title: "Choosing the access site: the five-step decision",
      minutes: 14,
      topics: ["acc-site-choice"],
      sources: [
        { book: "brilakis-pci", loc: "1.4" },
        { book: "brilakis-pci", loc: "4.1" },
        { book: "brilakis-pci", loc: "21.4" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 3: Trends in vascular access" },
        { book: "oxford-cath", loc: "ch 3: Anticoagulation issues" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "esc-revasc-2018", "esc-acs-2023", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "The route you choose decides how much the patient may bleed, how well your guide will be supported, and how easily you can rescue the case if it goes wrong. Wrist access (proximal radial, distal radial or ulnar) gives significantly fewer access-site complications than the groin, and patients prefer it. Its costs, in Brilakis's account, are harder engagement and sometimes weaker guide support, because of more respiratory movement, subclavian tortuosity, or a radial artery that will not take a large guide. Brilakis regards expertise in both radial and femoral access as essential; Oxford stresses that, whichever route you use, you must know its anatomical landmarks and its complications. Brachial, transcaval and carotid access are kept mainly for structural work.",
        },
        {
          kind: "p",
          text: "**Guideline position.** Brilakis quotes the 2018 ESC/EACTS revascularisation guideline, which preferred radial access for any PCI, whatever the presentation, unless procedural considerations override it. The 2023 ESC guideline for acute coronary syndromes keeps radial access as the recommended standard approach (class I) with the same exception. For elective work, the 2024 ESC guideline for chronic coronary syndromes recommends radial artery access as the preferred site whenever invasive coronary angiography is indicated (class I, level A). Oxford describes how radial has replaced femoral as the usual route over the last decade and is now the commonest route in the UK, Europe and Asia, on the strength of randomised and registry data showing less bleeding and lower mortality; the mortality benefit is thought, though not proven, to come from fewer bleeding complications.",
        },
        {
          kind: "table",
          caption: "What each route offers (Oxford chapter 3; Brilakis 4.1)",
          head: ["", "Radial", "Femoral"],
          rows: [
            [
              "Strengths",
              "Fewer access-site bleeds and lower mortality in the trials Oxford cites; earlier mobilisation; more comfortable and satisfied patients; lower cost",
              "Easier engagement, better guide support, large sheaths (7–8 Fr and above) and long sheaths; the route Brilakis describes for inserting a balloon pump, a microaxial pump and VA-ECMO",
            ],
            [
              "Weaknesses",
              "A steep learning curve for operators trained on the femoral route, with longer procedures and more failures while learning; possibly more operator radiation; radial occlusion; an uncomfortable arm position for patients with shoulder or arm injuries",
              "More access-site complications and bleeding, especially with aggressive antithrombotic treatment; slower mobilisation (Oxford mobilises after about 3 hours of bed rest following manual compression)",
            ],
            [
              "Who should think twice",
              "Patients who may need the artery later: those with renal failure who may need dialysis access, or those who may need total arterial surgical revascularisation (Oxford)",
              "Severely diseased or occluded iliofemoral arteries, which Brilakis says should be avoided",
            ],
          ],
        },
        { kind: "h", text: "The five steps (Brilakis Fig 4.1)" },
        {
          kind: "steps",
          title: "Work through these in order; the first step that decides, decides",
          items: [
            {
              title: "1. Find out which sites are available at all",
              detail:
                "Take the history, examine every pulse, and read the reports and films of earlier procedures and any CT. Sites drop out for a radial artery harvested for CABG, a known occluded radial or femoral artery, occlusion or severe disease of the common femoral or iliac arteries or the distal abdominal aorta, extreme iliac or subclavian tortuosity, failure to engage from that site last time, or a dialysis fistula in that arm. Preference counts too: some musicians and patients who lean on a walking frame would rather avoid the wrist, while a patient who cannot lie flat (severe back pain, heart failure) is better served by it. His pre-procedure checklist (1.4) adds two points: consider the other groin or a radial when an Angioseal (a collagen-plug closure device) was used within the last 90 days, and avoid any site that has already caused an access complication. It also asks you to look at earlier catheter films for disease or tortuosity of the aortoiliac and arm vessels, and to consider ultrasound of the peripheral arteries. If only one route survives, that is your route.",
            },
            {
              title: "2. Prior CABG?",
              detail:
                "With patent grafts, femoral access is usually preferred because grafts are harder to engage from the radial artery. If you do choose a radial, choose the left, because nearly every graft patient has a LIMA. If both internal mammary arteries were used, femoral access is strongly favoured.",
            },
            {
              title: "3. STEMI, oral anticoagulation or high bleeding risk?",
              detail:
                "Any of these points to radial. Several (not all) studies found lower mortality with radial access in STEMI, probably because aggressive antithrombotic treatment makes femoral bleeding more likely. High bleeding risk covers anaemia, thrombocytopenia, renal failure and a body mass index at either extreme; at pre-assessment, a high INR and a low platelet count also favour radial.",
            },
            {
              title: "4. Complex PCI?",
              detail:
                "For chronic total occlusions, severe calcification and tortuosity, or difficult bifurcations, at least one femoral access is often preferred, frequently with a 7 or 8 Fr sheath that is ideally 45 cm long, because it usually gives better support and may make the procedure more efficient, successful and safe. If the PCI is not complex, go radial.",
            },
            {
              title: "5. If the first site fails, change it",
              detail:
                "If the wire or catheter cannot be brought up to the root, the ostium cannot be engaged, or the PCI cannot be completed, moving to another site may rescue the case. Crossing from radial to femoral in a patient who is already anticoagulated carries more bleeding risk, so do it with great care and meticulous technique.",
            },
          ],
        },
        { kind: "tip", id: "access-site-five-steps" },
        {
          kind: "check",
          stem: "A 66-year-old man with LIMA-to-LAD and two vein grafts, no anticoagulant and normal bleeding risk, needs elective angiography for recurrent angina. Both radial and femoral pulses are good. Where does Brilakis's algorithm send him?",
          options: [
            "Right radial, because radial access is the default in every patient without a contraindication",
            "Right radial, because step 3 is applied first and he has no reason at all to avoid the wrist in this setting",
            "Femoral, because prior CABG with patent grafts is decided at step 2, with the left radial as the radial option",
            "Left brachial, which gives the most direct route to the LIMA without the radial artery's spasm",
          ],
          answer: 2,
          explanation:
            "Step 2 asks about prior CABG before bleeding risk is considered. With patent grafts, femoral access is usually preferred because grafts are harder to engage from the radial artery; if a radial is chosen it should be the left, for the LIMA. The tempting answer, right radial as a default, skips step 2 and gives the hardest route to the LIMA. Brachial access is used rarely because haemostasis there is difficult.",
        },
        { kind: "h", text: "Situations that change the route (Oxford chapter 3)" },
        {
          kind: "table",
          head: ["Situation", "What Oxford advises", "Why"],
          rows: [
            [
              "Bypass grafts",
              "Femoral, or the left radial when there is a LIMA. A RIMA may only be selectively engaged from the right radial",
              "The LIMA can be engaged from the right radial but it is difficult and can injure its ostium; vein grafts are awkward from the right because of the way the catheter enters the ascending aorta from the brachiocephalic artery",
            ],
            [
              "Peripheral arterial disease",
              "Not in itself a bar to the femoral route; go radial if neither femoral pulse can be felt, or only faintly, and the artery cannot be entered",
              "With an axillofemoral graft the abdominal aorta itself may be occluded, so a femoral approach is pointless even with a femoral pulse. Puncturing a Dacron graft is generally not recommended because of bleeding afterwards",
            ],
            [
              "Abdominal aortic aneurysm",
              "Suspect one if the wire or catheter loops back or swings laterally in the descending aorta; move catheters through it over a wire. There is no size cut-off that forbids the femoral route; weigh risk and benefit",
              "Thrombus in the aneurysm on ultrasound is a contraindication to femoral access: embolism can cause renal failure, distal ischaemia and ‘trash foot’",
            ],
            [
              "Coarctation of the aorta",
              "Consider the radial route; use femoral and radial access together if you need an accurate gradient across it",
              "The narrowing usually lies just beyond the left subclavian artery, and a tight one may stop catheters from the femoral route",
            ],
            [
              "Anticoagulation that has not or cannot be stopped",
              "Radial. Keep femoral access for emergencies such as an intra-aortic balloon pump",
              "Bleeding is less frequent from the wrist. Oxford adds that femoral catheterisation on warfarin is generally safer once the INR is below 2.0, that ultrasound and fluoroscopy should be considered to guide a femoral puncture in an anticoagulated patient, and that compression or closure devices can lessen bleeding afterwards. Oxford presents all of this as guidance to be adapted to local protocols",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's planning checklist (section 1.4, taught in the planning module) adds three anatomical points. An **arteria lusoria**, the right subclavian artery arising anomalously from the arch, favours the left radial or a femoral route. **Morbid obesity** favours radial access. And CT of the chest, abdomen and pelvis can show an anomalous arch, the calibre and disease of the iliac and subclavian arteries, and where the common femoral artery divides. The outcome of the planning step is not only a site but also **the sheath size and length**.",
        },
        { kind: "h", text: "Choosing the sheath with the site (Brilakis 30.1; Oxford chapter 3)" },
        {
          kind: "table",
          head: ["Question", "What the manuals give"],
          rows: [
            ["What does French mean?", "One French is 0.33 mm, so a 6 Fr sheath accepts a catheter of 2.0 mm outer diameter. A sheath's outer diameter is close to that of a guide two sizes larger: 2.62 mm for a 6 Fr sheath against 2.67 mm for an 8 Fr guide"],
            ["Diagnostic angiography", "4–6 Fr (Brilakis); a 4 Fr system often needs an automated injector. Oxford: 4 or 5 Fr femoral sheaths for diagnostic work"],
            ["PCI", "5–8 Fr, with 7–8 Fr preferred for more complex procedures (Brilakis). Oxford: 6 Fr femoral is typical, 7 or 8 Fr for complex intervention; radial sheaths are generally 5 or 6 Fr, and 7 or 8 Fr can often go into a larger radial (Brilakis)"],
            ["Support devices", "Intra-aortic balloon pump 7–9 Fr (it can also go in without a sheath); microaxial pump 13 Fr for the smaller model and 14 Fr for the larger one; VA-ECMO 15–19 Fr arterial and 25 Fr venous cannulae (equipment chapter; the support-device table differs slightly, see the large-bore lesson)"],
            ["Length", "10 cm as standard; 25 or 45 cm for obesity, iliac or aortic tortuosity or when the guide needs strong support, because a longer sheath improves the guide's support and torque response. The tips reach roughly the internal iliac origin, the aortic bifurcation and the diaphragm respectively. Through very tortuous iliac arteries, a long sheath one French size above the catheter can make catheter handling easier"],
            ["Why size matters", "A larger sheath fills more of the artery, so limb ischaemia and arterial thrombosis become more likely. In Brilakis's illustration of a 6 mm femoral artery, a 6 Fr sheath takes up 14.5% of the lumen, an 8 Fr 30.6% and an 11 Fr 64.8%"],
            ["Thin-walled radial sheaths", "Outer diameters fall from 2.29 to 2.14 mm at 5 Fr, from 2.62 to 2.44 mm at 6 Fr and from 2.95 to 2.79 mm at 7 Fr (Brilakis Table 30.2). They go in more easily and provoke less spasm, but kink more readily"],
            ["Without a sheath", "Sheathless guides put a bigger guide through a smaller hole: a 7.5 Fr sheathless guide system through a puncture the size of a 5 Fr sheath; a dedicated dilator run inside the guide; a 125 cm diagnostic catheter used as the dilator for a 90 or 100 cm guide two French sizes larger; or balloon-assisted tracking. The alternative is a standard 7 or 8 Fr guide through a short sheath of the same size"],
          ],
        },
        {
          kind: "check",
          stem: "A retrograde CTO PCI of the RCA is planned in a 58-year-old man with normal bleeding risk, no grafts and good pulses everywhere. Which access plan matches Brilakis's step 4?",
          options: [
            "At least one femoral access, often 7 or 8 Fr and ideally 45 cm long, alongside the second access",
            "Bilateral radial 6 Fr only, because the wrist is always safer whatever the support needed",
            "A single 6 Fr femoral sheath of standard 10 cm length for both injections in turn",
            "Left brachial 7 Fr for the guide, because it combines femoral-level support with the easy compressibility of the wrist",
          ],
          answer: 0,
          explanation:
            "Step 4: for complex PCI, CTO included, at least one femoral access is often preferred, frequently a 7 or 8 Fr sheath and ideally a 45 cm one, because of the support it gives. Brilakis notes elsewhere (21.4) that radial and biradial CTO PCI is increasingly used, so bilateral radial access is not wrong in experienced hands, but it is not what the algorithm recommends for a case that needs maximal support. A single sheath cannot provide the dual injection a CTO needs, and brachial access is hard to compress.",
        },
        { kind: "tip", id: "access-cabg-left-radial" },
        { kind: "tip", id: "access-complex-pci-femoral" },
        {
          kind: "pitfalls",
          items: [
            "Deciding on the right radial by habit in a patient with a LIMA, then fighting to engage it.",
            "Crossing to the femoral artery in a heparinised patient with a quick, palpation-only puncture.",
            "Choosing femoral access for a patient on uninterrupted anticoagulation when a radial would do.",
            "Planning the site but not the sheath: a 6 Fr 10 cm sheath in a complex, tortuous case can cost support you will need later.",
            "Ignoring a wire that loops or swings laterally in the abdomen: it may be an undiagnosed aneurysm.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the five steps aloud at the time-out: what is excluded, grafts, bleeding, complexity, and what you will do if the first site fails. The fifth step is the one people forget to plan.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, before you touch the needle, commit to a route and sheath for three patients: one on apixaban with an NSTEMI, one with LIMA and vein grafts, and one booked for a calcified CTO. Then run the case from your chosen site and note what the choice changed.",
        },
        { kind: "video", id: "97flCAkT5xY", note: "Brilakis on choosing the access site (Manual of PCI, section 4.1)." },
        { kind: "video", id: "zbRyvCrjz-I", note: "A debate on radial versus femoral access for PCI." },
        { kind: "video", id: "NTNEQzVJINk", note: "A radial PCI case about when to switch access." },
        { kind: "video", id: "cHvPrxoV2-Y", note: "A case of PCI in a patient with extreme obesity." },
        {
          kind: "keypoints",
          items: [
            "Wrist access bleeds less and patients prefer it; the femoral route supports better and takes bigger kit. Brilakis wants expertise in both.",
            "Five steps: exclude unusable sites, prior CABG (femoral, or the left radial), STEMI or bleeding risk (radial), complex PCI (at least one femoral, 7–8 Fr, ideally 45 cm), and change site if the first fails.",
            "Current ESC guidelines make radial access the standard: for acute coronary syndromes unless procedural considerations override it (2023), and as the preferred site for invasive angiography in chronic coronary syndromes (2024, class I, level A).",
            "Brilakis's checklist: consider another site after an Angioseal within 90 days; avoid any site with a previous access complication.",
            "Oxford: anticoagulated patients go radial; femoral access is kept for emergencies such as a balloon pump.",
            "Thrombus in an abdominal aneurysm rules out the femoral route; an axillofemoral graft may mean the aorta is occluded.",
            "Plan the sheath with the site: 1 Fr = 0.33 mm, a sheath's outside is about a guide two sizes larger, and 25 or 45 cm sheaths help in tortuous or obese patients.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-seldinger",
      title: "The Seldinger technique, micropuncture and ultrasound guidance",
      minutes: 13,
      topics: ["acc-seldinger"],
      sources: [
        { book: "oxford-cath", loc: "ch 3: The Seldinger technique" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "5.2" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "oxford-cath", loc: "ch 3: Femoral vein access" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "seldinger-technique-1953", "seto-faust-2010", "seto-raust-2015", "jolly-universal-2022", "dentremont-universal-closure-2023", "dentremont-ultrasound-learning-2024"],
      blocks: [
        {
          kind: "p",
          text: "Every sheath you will ever place goes in the same way: a needle finds the lumen, a wire replaces the needle, and a dilator and sheath follow the wire. The Swedish radiologist Sven-Ivar Seldinger described this in 1953 to make arteriography safer, and the same principle is now used for veins, arteries and hollow organs, chest drains and gastrostomy tubes included. Learn its logic once and every access in this module becomes a variation on it.",
        },
        {
          kind: "steps",
          title: "The classic sequence (Oxford Fig 3.1, in this module's words)",
          items: [
            { title: "1. Needle", detail: "Puncture the vessel through the skin with a hollow needle that has a bevelled tip." },
            { title: "2. Wire", detail: "Pass a soft, curved-tip wire through the needle into the vessel." },
            { title: "3. Needle out", detail: "Withdraw the needle over the wire, pressing on the site, and leave the wire in the lumen." },
            { title: "4. Sheath", detail: "Run the introducer sheath, with or without its dilator, over the wire into the vessel." },
            {
              title: "5. Wire out (or not yet)",
              detail:
                "Oxford then removes the wire, leaving the sheath, whose haemostatic valve lets catheters and devices pass without blood loss. Brilakis, at the femoral artery, removes only the dilator and keeps the 0.035 inch wire in place until the femoral angiogram has been taken.",
            },
          ],
        },
        { kind: "h", text: "The micropuncture modification" },
        {
          kind: "p",
          text: "Brilakis uses a micropuncture kit for femoral access: a 21 gauge needle (outer diameter 0.82 mm) instead of the standard 18 gauge (1.27 mm). Nobody has proved it superior, but the smaller hole is likely to injure the artery less, and if the first stick turns out too high or too low you can pull out and try again without significant bleeding. The trade-off is the 0.018 inch wire that comes with it, which is more prone than a 0.035 inch wire to slip into small side branches and perforate them, so it is always followed on fluoroscopy.",
        },
        {
          kind: "table",
          caption: "Two routes from needle to sheath",
          head: ["Step", "Standard 18 gauge needle", "21 gauge micropuncture needle"],
          rows: [
            ["Blood return", "Brisk, pulsatile flow from the hub", "Less obvious through the narrow needle, though ideally still pulsatile"],
            ["First wire", "0.035 or 0.038 inch J-wire straight through the needle", "0.018 inch wire through the needle, screened on fluoroscopy"],
            ["Intermediate step", "None", "Micropuncture dilator over the 0.018 inch wire; remove its inner part and the wire, confirm brisk pulsatile flow from the outer part, then pass the 0.035 or 0.038 inch wire"],
            ["Sheath", "Over the 0.035 inch wire", "Over the 0.035 inch wire. At the wrist, the radial sheath kit holds its own needle or cannula and 0.018 inch wire, and the sheath goes directly over that wire"],
          ],
        },
        {
          kind: "check",
          stem: "You have a 21 gauge micropuncture needle in the common femoral artery and slow but pulsatile blood return. What comes next?",
          options: [
            "A 0.035 inch J-wire straight through the micropuncture needle, then the sheath",
            "A hydrophilic polymer-jacketed wire through the needle, which crosses tortuous iliac arteries most easily",
            "A contrast injection through the needle, which is mandatory before any wire is passed",
            "The 0.018 inch wire, followed on fluoroscopy before the micropuncture dilator goes over it",
          ],
          answer: 3,
          explanation:
            "The 21 gauge needle takes the 0.018 inch wire, which is screened because it can enter side branches. Only an 18 gauge needle takes a 0.035 inch wire directly. Brilakis warns never to pass a polymer-jacketed wire through a needle, because the coating can be sheared off if the wire is pulled back. A contrast puff through the needle is something some operators do, not a requirement, and it can dissect if the needle tip is badly placed.",
        },
        { kind: "h", text: "Ultrasound: the default, not the rescue" },
        {
          kind: "p",
          text: "Brilakis strongly recommends ultrasound for every arterial and venous access, because it makes access safer and quicker and builds the operator's skill; it matters most with weak pulses, peripheral arterial disease, obesity, failed palpation, and when you need both the femoral artery and vein. Two randomised trials he cites support this. In FAUST (1004 femoral punctures) ultrasound did not raise the overall rate of common femoral cannulation (86.4% against 83.3%) except when the bifurcation lay over the femoral head, but it nearly doubled first-pass success (83% against 46%), cut attempts (1.3 against 3.0), venous punctures (2.4% against 15.8%) and vascular complications (1.4% against 3.4%). In RAUST (698 radial punctures) it reduced attempts (1.65 against 3.05) and access time and raised first-pass success (64.8% against 43.9%), without a significant difference in spasm, pain or bleeding. A later femoral trial adds a caution. In UNIVERSAL (621 patients, all with fluoroscopic landmarks), ultrasound again raised first-pass success (86.6% against 70.0%) and cut venous punctures (3.1% against 11.7%), but it did not significantly reduce the combination of major bleeding and major vascular complications (12.9% against 16.1%). In a prespecified analysis, that composite was lower with ultrasound only in patients who received a closure device (11.8% against 23.4%), and pooled FAUST and UNIVERSAL data showed the benefit once operators had performed more than 20 ultrasound-guided femoral punctures.",
        },
        {
          kind: "steps",
          title: "Ultrasound-guided puncture, step by step",
          items: [
            { title: "Prepare the probe", detail: "Gel on the probe, then a sterile cover, then gel (or saline at the wrist) on the outside." },
            {
              title: "Find and characterise the target",
              detail:
                "Scan along the vessel. At the groin the artery lies lateral to the vein and, unlike the vein, does not collapse when you press. Adjust depth and gain; use colour Doppler if you cannot find flow. Look for calcium, narrowing, branches and devices left by earlier procedures.",
            },
            { title: "Hold the probe square", detail: "Keep it perpendicular to the skin over the chosen entry point." },
            { title: "Bevel up", detail: "Insert the needle bevel up and watch it all the way to the vessel wall." },
            {
              title: "If you cannot see the needle",
              detail: "Change the needle's entry point or angle, move or tilt the probe, or use a needle with echogenic markings.",
            },
            {
              title: "Read the blood",
              detail:
                "Pulsatile flow from the hub means artery. Dark, non-pulsatile blood means vein: at the groin, pull the needle partly back and redirect it laterally. No blood at all means the tip is outside the artery or within its wall, or the needle is plugged: reposition it, or take it out and flush it.",
            },
            {
              title: "Never push a wire against resistance",
              detail:
                "This applies at every access and every stage. If the wire stops, the tip is in the wrong place; image it rather than force it.",
            },
          ],
        },
        { kind: "tip", id: "access-needle-flashback-check" },
        { kind: "tip", id: "access-wire-never-push" },
        { kind: "h", text: "After the sheath: clear it before you use it" },
        {
          kind: "p",
          text: "Aspirate 3–4 mL from the side arm and throw it away, then flush with a second syringe of heparinised saline. Using separate syringes means that any thrombus or debris you draw back is never pushed back into the artery. At the femoral artery, connect the side arm to the manifold and check for an arterial waveform without damping before any injection. Oxford flushes the side arm of femoral arterial and venous sheaths to stop thrombus forming.",
        },
        {
          kind: "check",
          stem: "You have just placed a femoral sheath. Your assistant hands you one 10 mL syringe for both aspiration and flushing to save time. Why does Brilakis object?",
          options: [
            "One syringe cannot hold enough heparinised saline to flush a 10 cm sheath",
            "Debris drawn back from the sheath could be injected straight back into the artery",
            "Aspirated blood mixed with saline clots the side arm valve within seconds",
            "A single syringe introduces a bubble of air every time it is reconnected to the side arm",
          ],
          answer: 1,
          explanation:
            "Separate syringes for aspirating and flushing are a stated prevention of embolism: whatever is aspirated, thrombus or plaque, goes in the bin rather than back into the leg. Air is a risk with any poor syringe preparation, but it is not the reason for two syringes.",
        },
        { kind: "tip", id: "access-sheath-two-syringes" },
        {
          kind: "pitfalls",
          items: [
            "Passing a polymer-jacketed wire through a metal needle and shearing the coating when you pull it back.",
            "Advancing the 0.018 inch micropuncture wire without screening it.",
            "Mistaking dark, non-pulsatile blood for an arterial flash: at the groin it means the femoral vein.",
            "Skipping the aspiration step and flushing a sheath that holds thrombus.",
            "Reaching for force when a wire stops: the answer is always to image and reposition.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of every puncture as needle, wire, image. Until fluoroscopy or ultrasound shows the wire where you expect it, nothing larger than the wire goes into the patient.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, perform an ultrasound-guided femoral puncture with a micropuncture needle: confirm the artery is lateral and non-compressible, enter bevel up with the probe square to the skin, screen the 0.018 inch wire, then upsize through the micropuncture dilator to a 0.035 inch wire and a sheath. Aspirate and flush with separate syringes.",
        },
        { kind: "video", id: "BE-88Jf6d0Q", note: "A talk on vascular access management for coronary and peripheral interventions." },
        { kind: "video", id: "7TUFq35ATj0", note: "A talk on optimising vascular access." },
        {
          kind: "keypoints",
          items: [
            "Seldinger (1953): needle, wire, needle out, sheath over the wire; the sheath's valve lets kit in without blood loss.",
            "Micropuncture: 21 gauge (0.82 mm) against 18 gauge (1.27 mm); easier to redo, but its 0.018 inch wire enters side branches, so screen it.",
            "Ultrasound for all arterial and venous access: FAUST, RAUST and UNIVERSAL showed fewer attempts, and the femoral trials fewer venous punctures; fewer complications in FAUST; in UNIVERSAL only in patients given a closure device; and in pooled FAUST and UNIVERSAL data once operators had done more than 20 guided punctures.",
            "Pulsatile blood: artery. Dark and steady at the groin: femoral vein, so redirect laterally. None: reposition or flush the needle.",
            "Never push a wire against resistance; never pass a polymer-jacketed wire through a needle.",
            "Aspirate 3–4 mL and discard, then flush with a different syringe.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-femoral-puncture",
      title: "Femoral access I: from landmarks to a needle in the common femoral artery",
      minutes: 14,
      topics: ["acc-femoral"],
      sources: [
        { book: "brilakis-pci", loc: "4.2" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "brilakis-pci", loc: "29.1" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "The target is narrow: the common femoral artery after it leaves the inguinal ligament and before it divides into the superficial femoral and profunda arteries, where it runs over the femoral head. There the bone gives you something to press against when the sheath comes out. Puncture too high, above both the femoral head and the point where the inferior epigastric artery arises, and bleeding can track into the retroperitoneum. Too low, below the femoral head, and pseudoaneurysm and arteriovenous fistula become more likely. Brilakis combines fluoroscopy, ultrasound and a micropuncture kit to hit that segment every time.",
        },
        {
          kind: "table",
          caption: "Where the needle enters, and what follows",
          head: ["Puncture", "Main risk", "What to do"],
          rows: [
            ["Over the femoral head, above the bifurcation", "Lowest: compressible against bone, suitable for closure devices", "Proceed"],
            ["High: above the femoral head and the inferior epigastric origin, or above the inguinal ligament (Oxford)", "Retroperitoneal haemorrhage", "Brilakis: take the micropuncture needle out and start again"],
            ["Low: below the femoral head or below the bifurcation", "Pseudoaneurysm and arteriovenous fistula; the vein often lies behind the artery lower in the groin", "Brilakis: it may be better to remove the needle and puncture again"],
          ],
        },
        {
          kind: "steps",
          title: "Steps 1–3: pulse, preparation and the femoral head",
          items: [
            {
              title: "Step 1. Feel the pulse",
              detail:
                "Brilakis uses his left hand as a caliper. Right groin: thumb on the patient's right anterior superior iliac spine, middle finger on the symphysis pubis, so the index finger falls on the common femoral artery over the femoral head. Left groin: the same hand reversed, thumb on the symphysis and middle finger on the patient's left anterior superior iliac spine. Oxford abducts the leg with the foot turned out and feels the pulse at or above the groin crease. If the pulse is weak or absent, scan it to confirm the artery is patent and to measure it.",
            },
            {
              title: "Step 2. Prepare and drape",
              detail:
                "Prepare both groins, ideally, in case the first side fails. Apply antiseptic from the puncture site outwards in widening circles so the centre stays clean, let it dry so the drape will stick, and centre the drape openings on the groins. In very obese patients, tape the pannus back or use a retention device. If the field is contaminated (for example by the patient's hand), clean it again; if the drape opening sits too high, low or to one side, move it once the new skin has been prepared.",
            },
            {
              title: "Step 3. Find the femoral head",
              detail:
                "Lay a haemostat or other metal instrument over the pulse and take an AP fluoroscopy image. Move it until its tip sits on the lower edge of the femoral head, and mark that line on the skin with a sterile pen (or leave a micropuncture needle there as a marker). In a very obese patient, push the overlying tissue up from the groin crease rather than going through many layers of fat. Keep your hands out of the beam. The line is a reference, not the target: the arterial entry should end up over the lower half of the femoral head (checked at step 8). Oxford gives the same target in its own terms: on X-ray the puncture lies at the level of the femoral head, between half a centimetre and 3 cm under the inguinal ligament, in the stretch between the skin crease and the ligament; screen before puncturing, particularly in overweight patients.",
            },
          ],
        },
        { kind: "tip", id: "access-femoral-head-marker" },
        {
          kind: "check",
          stem: "On AP fluoroscopy the tip of your haemostat projects 3 cm above the lower edge of the femoral head. What do you do before marking the skin?",
          options: [
            "Mark the skin where the haemostat lies, since anywhere over the femoral head is ideal",
            "Ignore fluoroscopy and use the groin crease, which marks the bifurcation most reliably",
            "Ask for a femoral angiogram through a 4 Fr sheath first, before choosing the final puncture height",
            "Move the haemostat down until its tip sits on the lower edge of the femoral head, then mark",
          ],
          answer: 3,
          explanation:
            "The fluoroscopy step is there to find and mark the inferior border of the femoral head; the haemostat is repositioned until its tip lies there. Fluoroscopy alone cannot show where the artery divides, which is why ultrasound comes next. The groin crease is not the target landmark in either manual (Oxford palpates at or above it).",
        },
        {
          kind: "steps",
          title: "Steps 4–6: ultrasound, anaesthetic and the puncture",
          items: [
            {
              title: "Step 4. Scan the artery",
              detail:
                "Place the probe above the line you drew, find the common femoral artery and scan up and down to see where it divides and whether it is calcified or diseased. Fluoroscopy alone can be misleading because the bifurcation varies a great deal. Choose a point above the bifurcation, clear of calcium, luminal narrowing, bypass grafts and recently placed closure devices. If you cannot find the artery (obesity, previous surgery, a misplaced drape, inexperience, femoral disease), use colour Doppler, check the X-ray landmarks again, move the drape, change depth or gain, or go to the other groin or a radial. If the whole common femoral artery is calcified, use another site.",
            },
            {
              title: "Step 5. Local anaesthetic",
              detail:
                "Brilakis loads a 10 mL syringe with a fine (26–31 gauge) needle, aspirates to make sure he is not in a vessel, and gives 10–20 mL into the subcutaneous tissue around the planned entry; to give more than one syringe, he leaves the needle in the skin and swaps syringes. Ultrasound shows where it goes; if you cannot see it, change the needle angle. Oxford infiltrates 10 mL of 1% lidocaine, then incises the skin and opens the superficial layers with forceps. Keep your other hand away from the groin while you inject. If you hit the artery or vein, reposition before injecting more; if a lot of blood enters the syringe, discard it and start a fresh one.",
            },
            {
              title: "Step 6. Puncture",
              detail:
                "With the target and the needle both on the screen, hold the probe square to the skin and advance the needle bevel up until it enters the common femoral artery at the chosen point. Oxford angles the needle 30–45° from the skin surface and advances it until arterial blood pulses freely out of the hub. Brilakis matches the angle to the depth: for an artery about 2 cm deep, enter at about 45°; for one about 4 cm deep, keep the 45° angle and move the skin entry further down the leg (his preferred option) rather than steepening to about 70°. The flatter the angle, the further from the probe the needle must enter.",
            },
          ],
        },
        { kind: "tip", id: "access-femoral-scan-bifurcation" },
        { kind: "tip", id: "access-femoral-deep-move-caudal" },
        {
          kind: "check",
          stem: "Ultrasound shows the common femoral artery at 4 cm depth in an obese man. Your usual 45° puncture from your usual skin point would meet the artery too high, beyond the planned point and towards the inguinal ligament. What does Brilakis prefer?",
          options: [
            "Steepen the needle to about 70° from the usual skin entry point",
            "Puncture the skin crease vertically and redirect once you reach the artery",
            "Keep about 45° and move the skin entry point further down the leg",
            "Give up the femoral route because a 4 cm depth rules out compression",
          ],
          answer: 2,
          explanation:
            "For a deeper artery, Brilakis's preferred option is to move the skin entry caudally and keep the angle, so the needle still meets the artery at the planned point over the femoral head; steepening to about 70° is his second option. At 45° the needle travels as far up the leg as it goes deep, so from the same skin point a deeper artery is met further cranially; moving the entry caudally brings the arterial entry back down. A deep artery makes palpation harder but does not by itself rule out the femoral route.",
        },
        {
          kind: "table",
          caption: "When the needle does not behave (Brilakis 4.2.6.3)",
          head: ["Problem", "Likely reason", "Fix"],
          rows: [
            ["Needle not visible on ultrasound", "Not given by Brilakis", "Change the needle entry point; move or angle the probe; use a needle with echogenic markings"],
            ["No blood return", "Tip outside the artery or along its wall; needle plugged", "Reposition the needle; take it out and flush it"],
            ["Dark, non-pulsatile blood", "Femoral vein entered", "Withdraw partly and redirect laterally"],
          ],
        },
        { kind: "tip", id: "access-femoral-vein-redirect" },
        {
          kind: "pitfalls",
          items: [
            "Puncturing at the groin crease in an obese patient: the crease often lies below the target.",
            "Trusting fluoroscopy to show the bifurcation; only ultrasound or angiography shows it.",
            "Puncturing through anterior-wall calcium or next to a recent closure device.",
            "Accepting a high stick because the sheath went in easily: retroperitoneal bleeding can be hard to diagnose, usually declares itself within the first 3 hours, and is not excluded by a closure device (Brilakis 29.1).",
            "Leaving your free hand on the groin while injecting anaesthetic or using the scalpel.",
            "Fluoroscopy with your hands in the beam.",
          ],
        },
        {
          kind: "pearl",
          text: "Mark the lower edge of the femoral head first, then let the ultrasound choose the exact spot above it. The two methods correct each other's blind spots: bone for height, ultrasound for the bifurcation and calcium.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, run the femoral access stage: mark the lower edge of the femoral head on fluoroscopy, scan the common femoral artery up to its bifurcation, infiltrate around the target under ultrasound, and puncture bevel up above the bifurcation. Repeat with a deep artery and move your skin entry caudally rather than steepening the needle.",
        },
        { kind: "video", id: "S7UWo_MsWjc", note: "Brilakis, femoral access step by step (Manual of PCI, section 4.2)." },
        { kind: "video", id: "7TUFq35ATj0", note: "A talk on optimising vascular access." },
        {
          kind: "keypoints",
          items: [
            "Target: common femoral artery over the femoral head, above the bifurcation, below the inguinal ligament (Oxford: about 0.5–3 cm below it on X-ray).",
            "High stick: retroperitoneal bleeding. Low stick: pseudoaneurysm and arteriovenous fistula. Redo a wrong-height micropuncture.",
            "Prepare both groins; tape back a pannus; mark the lower edge of the femoral head on fluoroscopy.",
            "Scan up and down for the bifurcation and calcium; puncture above the bifurcation in healthy artery.",
            "Local anaesthetic: aspirate first; Brilakis 10–20 mL, Oxford 10 mL of 1%, keeping out of the artery and vein.",
            "Needle bevel up, probe square; deeper artery: move the skin entry down rather than steepen.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-femoral-sheath",
      title: "Femoral access II: wire, sheath and the femoral angiogram",
      minutes: 14,
      topics: ["acc-femoral", "acc-seldinger"],
      sources: [
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "brilakis-pci", loc: "29.1" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A needle in the artery is not yet access. The next nine steps turn it into a sheath you can trust, and each has a check built in: where the wire entered, where it is heading, whether the sheath sits in a healthy segment, and whether anything was injured on the way in. The femoral angiogram at the end tells you whether you can close the artery with a device later; the decision itself is taught in the closure module.",
        },
        {
          kind: "steps",
          title: "Steps 7–12: wire, nick and dilator",
          items: [
            {
              title: "Step 7. Pass the 0.018 inch wire",
              detail:
                "Thread the micropuncture wire (40 cm long in one common kit) through the 21 gauge needle under fluoroscopy. It can enter the lateral circumflex iliac, inferior epigastric or internal iliac arteries, and a sheath later forced into such a branch can perforate it. Do not push if you feel resistance.",
            },
            {
              title: "Step 8. Screen the wire",
              detail:
                "Ask two questions. Did the wire enter the artery in the lower half of the femoral head? Is it running up the expected course of the femoral and iliac arteries? If yes to both, remove the needle while pressing over the wire. If the entry is too high or too low, remove wire and needle, press for 1–2 minutes and puncture again under ultrasound. If the wire runs medially (inferior epigastric), laterally (lateral circumflex iliac) or downwards, reposition it under fluoroscopy.",
            },
            {
              title: "Step 9. Skin nick (optional)",
              detail:
                "Make it over the needle so the blade cannot damage the wire, or after the micropuncture dilator is in; never with a sheath in place, because the blade can cut the sheath and cause heavy bleeding. Keep it shallow so the artery is not cut, big enough for the sheath but not so big that it bleeds, and keep your other hand clear. A good nick also helps later with suture-based closure and its knot pusher.",
            },
            { title: "Step 10. Micropuncture dilator", detail: "Advance the dilator assembly over the 0.018 inch wire into the artery." },
            {
              title: "Step 11. Exchange to a 0.035 inch wire",
              detail:
                "Remove the 0.018 inch wire and the inner dilator, leaving the outer part in the artery, and confirm brisk pulsatile backflow. Pass a 0.035 or 0.038 inch wire to the abdominal aorta. A long (180 cm) wire lets the sheath and then the catheters go over the same wire. In groins scarred by repeated procedures, Brilakis prefers a stiff wire of the extra-support class. If the wire will not advance (a kinked dilator, iliac tortuosity, a side branch or a subintimal course), screen it.",
            },
            { title: "Step 12. Screen the 0.035 inch wire", detail: "Fluoroscopy of the groin confirms that the wire follows the expected course and guides you if it meets resistance." },
          ],
        },
        { kind: "tip", id: "access-femoral-screen-micro-wire" },
        { kind: "tip", id: "access-femoral-repuncture-wrong-height" },
        {
          kind: "check",
          stem: "The 0.018 inch wire entered the artery just below the middle of the femoral head, but on fluoroscopy its tip curls medially and upwards in a small vessel instead of following the iliac artery. What next?",
          options: [
            "Withdraw the wire and redirect it under fluoroscopy into the external iliac artery",
            "Advance the micropuncture dilator, which will straighten the wire into the main artery",
            "Accept it, because the entry point is ideal and the dilator only goes a few centimetres",
            "Remove everything and puncture the other groin, as the wire has damaged the branch",
          ],
          answer: 0,
          explanation:
            "A wire running medially is following the inferior epigastric artery. The entry point is good, so the fix is to reposition the wire under fluoroscopy. Advancing a dilator or sheath into a small branch is how branches are perforated. There is no need to abandon a good puncture.",
        },
        {
          kind: "steps",
          title: "Steps 13–15: sheath, flush and femoral angiogram",
          items: [
            {
              title: "Step 13. Insert the sheath",
              detail:
                "A 10 cm sheath suits most cases. Longer sheaths (25 or 45 cm) help with iliac tortuosity, iliac stents, obesity (where a short sheath may not even reach the artery) and when complex PCI needs extra back-up. Advance it over the 0.035 or 0.038 inch wire until the hub reaches the skin, then remove the dilator and leave the wire. Oxford typically uses 6 Fr, with 4 or 5 Fr for diagnostic work and 7 or 8 Fr for complex intervention.",
            },
            {
              title: "Step 14. Aspirate and flush",
              detail: "Draw 3–4 mL from the side arm and discard it, then flush with a separate syringe of heparinised saline.",
            },
            {
              title: "Step 15. Femoral angiogram",
              detail:
                "Connect the side arm to the manifold and check that the arterial waveform is not damped. If the 0.035 inch wire is no longer in, put one through the sheath into the aorta. Centre the sheath on the screen at low magnification so the iliac artery and the bifurcation are both seen. Angle towards the side of the puncture: RAO 20–30° when the sheath is in the right groin, LAO 20–30° when it is in the left. This ipsilateral oblique opens out the bifurcation. Inject about 5–10 mL (diluted contrast is fine) on cine or stored fluoroscopy, pulling the sheath gently medially so its entry point stands clear of the artery.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Reading the femoral angiogram",
          head: ["Look for", "Why"],
          rows: [
            ["Perforation", "Bleeding from a branch or the puncture"],
            ["Dissection or a filling defect", "Wall injury from the wire or sheath, or material such as an earlier collagen plug"],
            ["Flow down the leg", "Limb perfusion around the sheath"],
            ["Disease, calcium and tortuosity of the femoral and iliac arteries", "Kit choice, sheath length and the risk of later device insertion"],
            ["Where the sheath enters, and the artery's size and quality there", "Whether a closure device can be used (pm-closure). Brilakis shows a high bifurcation where the sheath had entered a small accessory profunda branch; no closure device was used and the site was compressed by hand"],
          ],
        },
        {
          kind: "p",
          text: "Some operators inject contrast through the micropuncture needle before any sheath goes in. If the entry point is poor, they can withdraw without placing a sheath; the risk is that contrast from a badly positioned needle tip can dissect the wall.",
        },
        { kind: "tip", id: "access-femoral-sheath-angiogram" },
        {
          kind: "check",
          stem: "You are about to take the femoral angiogram through a new left femoral sheath. Which set-up matches Brilakis's technique?",
          options: [
            "20–30° RAO, high magnification on the sheath tip, 20 mL of full-strength contrast",
            "20–30° LAO, low magnification, about 5–10 mL, wire in the aorta and an undamped waveform",
            "Straight AP with the wire removed, so that it does not hide the arterial entry point on the image",
            "40° LAO cranial, injecting by hand through the dilator before the sheath is advanced",
          ],
          answer: 1,
          explanation:
            "For the left common femoral artery the ipsilateral oblique is LAO 20–30°, at low magnification to include the iliac and the bifurcation, with about 5–10 mL of contrast. A wire through the sheath into the aorta steadies the sheath, keeps its tip off the wall and preserves access to the true lumen if a dissection occurs; an undamped waveform is checked first. RAO is the view for the right groin.",
        },
        { kind: "h", text: "What can go wrong while gaining femoral access (Brilakis 4.2.15.3)" },
        {
          kind: "table",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            [
              "Perforation and bleeding",
              "Wire or catheter through a small branch; arterial wall injured by the sheath; a venous sheath passed through the artery (arteriovenous fistula)",
              "Screen wires, especially micropuncture wires; never advance a wire, sheath or catheter against resistance",
              "Branch bleeding (inferior epigastric, lateral circumflex iliac): embolise with coils or thrombin. Ooze around the sheath: upsize the sheath. Otherwise a covered stent or surgery. If the case is not urgent, give no anticoagulant and postpone the PCI",
            ],
            [
              "Femoral or iliac dissection",
              "Forcing a wire through resistance; iliofemoral atheroma; injecting with the tip against the wall",
              "Check the waveform before injecting; avoid forceful injection; put a 0.035 inch wire in before injecting",
              "Non-flow-limiting: usually heals on its own. Flow-limiting in the common femoral: endarterectomy is preferred, to avoid a stent where it may fracture. Flow-limiting iliac: contralateral femoral access, wire the true lumen and place a self-expanding stent",
            ],
            [
              "Embolism of air, plaque or thrombus",
              "Severe femoral or iliac disease; thrombus in the sheath; a poorly prepared syringe or failure to aspirate the sheath",
              "Ultrasound to avoid diseased segments; careful aspiration; separate syringes for aspirating and flushing",
              "Air: consider 100% oxygen. Thrombus or plaque: endovascular or surgical retrieval if the leg becomes ischaemic",
            ],
          ],
        },
        {
          kind: "p",
          text: "Oxford's list of femoral complications adds the frequencies and the setting: local haematoma (as many as a quarter of procedures), vasovagal episodes during the puncture or on sheath removal, tears or dissection (uncommon unless the iliofemoral arteries are diseased or calcified), retroperitoneal haemorrhage after a high puncture, pseudoaneurysm, and embolism of thrombus from the sheath. Their treatment is taught in the access complications module.",
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a wire entry in the upper half of the femoral head, or below it, because the wire then ran well.",
            "Cutting the skin with a sheath already in the artery.",
            "Taking the femoral angiogram with the sheath tip against the wall and no wire in place.",
            "Imaging in a view other than the ipsilateral oblique, which is the projection Brilakis uses because it shows the bifurcation best.",
            "Starting heparin and the PCI after an unexplained groin perforation in a non-urgent case.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat the femoral angiogram as part of the access, not as an optional extra at the end: in one picture it shows the puncture height, the bifurcation, any branch injury and whether the artery will accept a closure device.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, continue from a micropuncture needle in the right common femoral artery: screen the 0.018 inch wire and redirect it if it heads medially, nick the skin over the needle, upsize to a 0.035 inch wire, insert the sheath, aspirate and flush with two syringes, then take the femoral angiogram in 20–30° RAO and name the puncture height relative to the bifurcation.",
        },
        { kind: "video", id: "S7UWo_MsWjc", note: "Brilakis, femoral access step by step (Manual of PCI, section 4.2)." },
        {
          kind: "keypoints",
          items: [
            "Screen the 0.018 inch wire: entry in the lower half of the femoral head, course up the iliac artery. Wrong height: out, 1–2 minutes of pressure, redo.",
            "Medial wire is in the inferior epigastric, lateral in the lateral circumflex iliac: redirect under fluoroscopy.",
            "Nick over the needle or the micropuncture dilator, never over a sheath.",
            "10 cm sheath for most; 25 or 45 cm for tortuosity, iliac stents, obesity or extra support.",
            "Femoral angiogram: wire in, waveform checked, ipsilateral oblique 20–30°, low magnification, 5–10 mL.",
            "Branch bleeding: coils or thrombin; ooze around the sheath: upsize it; no heparin and no PCI if the case can wait.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-radial-puncture",
      title: "Radial access I: positioning, ultrasound and the puncture",
      minutes: 13,
      topics: ["acc-radial"],
      sources: [
        { book: "brilakis-pci", loc: "4.3" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "brilakis-pci", loc: "29.2" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "valgimigli-radar-allen-2014", "seto-raust-2015"],
      blocks: [
        {
          kind: "p",
          text: "The radial artery is small and superficial and it spasms when provoked, so the puncture rewards patience and punishes repeated stabs. Every step in Brilakis's sequence is designed to get the needle in at the first or second pass: position the arm well, find the artery on ultrasound, numb the skin with a small volume, and puncture under vision. The previous lesson covered the general Seldinger logic; this one is about the wrist.",
        },
        { kind: "h", text: "Step 1. Feel the pulse, and the Allen test question" },
        {
          kind: "p",
          text: "Feel the radial artery just proximal to the styloid process. Oxford palpates proximal to the flexor retinaculum with the index, middle and ring fingers together, so the whole distal course of the artery can be traced. The two books differ on testing the hand's collateral supply first.",
        },
        {
          kind: "table",
          head: ["", "Brilakis", "Oxford"],
          rows: [
            [
              "Position",
              "The Allen and Barbeau tests are no longer recommended before radial access. In RADAR, patients with normal, intermediate and abnormal Allen results had radial procedures without any ischaemic hand complication. RADAR was small (203 elective patients), grouped patients by their Allen result rather than randomising them, and used thumb capillary lactate as its primary endpoint; its authors called it proof of concept needing wider validation. Brilakis also states that the tests do not predict radial occlusion",
              "Not universal, but some operators will only proceed when the Allen test is normal",
            ],
            [
              "How the test is done",
              "Barbeau: compress the radial artery with an oximeter on the thumb and see whether a waveform persists",
              "Compress both arteries, have the patient clench and open the fist six or seven times until the palm blanches, release the ulnar artery: colour back within 10 seconds is normal. An oximeter on a finger makes it more sensitive. Say ‘normal’ rather than ‘positive’, which confuses",
            ],
          ],
        },
        {
          kind: "check",
          stem: "An elective patient has an abnormal Allen test on the right but a good radial artery on ultrasound. Following Brilakis, what do you do?",
          options: [
            "Go femoral instead, because an abnormal Allen test is an absolute contraindication to the radial route in both books",
            "Repeat the test with an oximeter and proceed only if the waveform returns within 10 seconds",
            "Proceed with right radial access, since RADAR found no hand ischaemia across the whole range of Allen results",
            "Use the right ulnar artery, which is the vessel the Allen test has just shown to be inadequate",
          ],
          answer: 2,
          explanation:
            "Brilakis no longer recommends the Allen or Barbeau test, citing RADAR, in which no hand ischaemic complications occurred whatever the Allen result. Oxford notes that some operators still insist on a normal test, so local practice varies, but neither manual treats an abnormal result as an absolute contraindication. RADAR itself was small and confined to elective patients, which is one reason some operators still test. Puncturing the ulnar artery on the side of a poor ulnar supply makes no sense.",
        },
        {
          kind: "steps",
          title: "Step 2. Position, prepare and drape",
          items: [
            {
              title: "Right radial",
              detail:
                "Use an arm board or positioning device, or rest the arm along the patient's side. Oxford has the arm extended, palm up and relaxed with the wrist hyperextended, often held by a light strap across the palm to the board, with a rolled towel under the wrist and elbow as needed.",
            },
            {
              title: "Left radial",
              detail:
                "It meets less tortuosity at the subclavian and needs a little less fluoroscopy time; the price is more difficulty and less comfort for the operator. Use it when the patient has a patent LIMA graft. Support the left elbow on an arm support or pillows and bring the arm across the abdomen palm up; or hold it partly supinated with finger traps; or put a long (16–25 cm) radial sheath only partly into the artery so the hand need not be turned; or use a sheath extension so you can work from the right side afterwards.",
            },
            {
              title: "Distal left radial",
              detail:
                "The patient grips the thumb inside the closed fingers and keeps the hand slightly abducted, which brings the artery up in the snuffbox. The distal radial route is taught in the alternative-access lesson.",
            },
            {
              title: "Skin",
              detail:
                "Shave the wrist, scrub both the radial and the ulnar sites, let the antiseptic dry and centre the drape on the wrist. Oxford removes bracelets and watches, avoids intravenous cannulae in that arm, and some operators prepare the right groin too, in case the radial fails or a balloon pump is needed.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Step 3. Ultrasound",
          items: [
            {
              title: "Why",
              detail:
                "Brilakis argues that fewer attempts should mean less spasm. In RAUST, ultrasound cut the mean number of attempts from 3.05 to 1.65 and raised first-pass success from 43.9% to 64.8%, although operator-reported spasm did not differ significantly.",
            },
            {
              title: "How",
              detail:
                "Gel on the probe, then a sterile bag. Place the probe above the styloid process (or over the snuffbox), with gel or saline on the skin. Use a low depth setting: the radial artery is much smaller and more superficial than the femoral. Puncture in the segment above the styloid.",
            },
            {
              title: "If you cannot find it",
              detail:
                "Think of obesity, a harvested radial, inexperience or occlusion. Use colour Doppler, or change site: the ulnar artery on the same side, the radial or ulnar on the other side, or the femoral artery.",
            },
            {
              title: "If it is small",
              detail: "A small artery is hard to enter and prone to spasm; Brilakis changes to one of the same alternative sites rather than persisting.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Step 4. Local anaesthetic: less is more",
          items: [
            {
              title: "Volume",
              detail:
                "Brilakis loads a 3 mL syringe with a 31 gauge needle, aspirates, then injects about 1 mL. Oxford's volume is 1–2 mL of 1% lidocaine under the skin, without entering the artery. Larger volumes squash the artery and make it harder to enter.",
            },
            { title: "Watch it", detail: "Ultrasound shows the anaesthetic spreading and what it does to the artery's calibre." },
            {
              title: "If you gave too much",
              detail: "Wait 1–2 minutes for the artery to recover, or move to a different point along the radial artery.",
            },
            {
              title: "Never into the artery",
              detail: "Lidocaine injected into the artery can cause seizures; aspirate before you inject.",
            },
            {
              title: "If spasm appears now",
              detail:
                "Brilakis gives nitroglycerin under the tongue, or injects it around the artery under ultrasound, mixed 1:1 with 1% lidocaine.",
            },
          ],
        },
        { kind: "tip", id: "access-radial-one-ml-local" },
        {
          kind: "check",
          stem: "After 4 mL of lidocaine around the wrist, the ultrasound shows a flattened radial artery and you can no longer feel the pulse. What is the manual's advice?",
          options: [
            "Puncture now through the bleb, where the artery is at its most fixed",
            "Inject verapamil around the artery, which reverses compression by local anaesthetic",
            "Massage the wrist firmly to disperse the anaesthetic and puncture immediately",
            "Wait 1–2 minutes for the artery to recover, or puncture at another point along it",
          ],
          answer: 3,
          explanation:
            "Too much local anaesthetic compresses the radial artery. Brilakis's solution is to wait 1–2 minutes or to choose another location on the artery, and to keep to about 1 mL next time. Periarterial vasodilator (nitroglycerin mixed with lidocaine) is his answer to spasm, not to compression by volume.",
        },
        {
          kind: "steps",
          title: "Step 5. The puncture",
          items: [
            {
              title: "Where",
              detail:
                "Oxford punctures about 1 cm proximal to the radial styloid, after tracing the artery's course, and aims the needle along that course at roughly 30–60° to the skin (Oxford Fig 3.2). Brilakis keeps both the target and the needle on ultrasound.",
            },
            {
              title: "With a micropuncture needle",
              detail:
                "Bevel up. Either a single-wall puncture (enter the front wall and wait for back-bleeding) or a through-and-through puncture (pass through both walls; back-bleeding is only brief).",
            },
            {
              title: "With an over-the-needle cannula",
              detail:
                "Advance until blood returns, push on through the back wall, take out the needle, then withdraw the cannula slowly. When pulsatile blood appears, pass the 0.018 inch wire. The radial sheath kit usually contains the needle or cannula and the wire.",
            },
            {
              title: "If you cannot see the needle",
              detail: "Change the needle's angle or entry point, move or tilt the probe, or use an echogenic needle.",
            },
            {
              title: "If you cannot enter the artery",
              detail:
                "Consider a small artery, spasm, or a proximal radial occlusion with a pulse kept alive by collaterals from the palmar arch.",
            },
            { title: "If no blood returns", detail: "The tip is outside the artery or in its wall, or the needle is plugged: reposition, or remove and flush." },
          ],
        },
        { kind: "h", text: "Spasm at the puncture" },
        {
          kind: "table",
          head: ["Risk factors", "Prevention", "Treatment"],
          rows: [
            [
              "Small radial artery; younger patients; several needle passes; intravenous vasopressors or cardiac arrest (Brilakis 4.3). In his complications chapter he adds women, current smokers, anxiety, large sheaths and no vasodilator",
              "Avoid very small radial arteries (the ulnar may be an option); ultrasound to avoid repeated passes; adequate moderate sedation (Oxford: mild sedation with an opiate and a benzodiazepine before the puncture); nitroglycerin under the tongue or under the skin",
              "Vasodilators (sublingual nitroglycerin) and more sedation; or move to the ulnar on the same side, the other radial, or the femoral artery",
            ],
          ],
        },
        { kind: "tip", id: "access-radial-puncture-spasm" },
        {
          kind: "pitfalls",
          items: [
            "A large bleb of anaesthetic that flattens the artery before you start.",
            "Stabbing repeatedly at a small, spasming artery instead of using ultrasound or changing site.",
            "Missing a proximal occlusion because the wrist pulse feels normal (palmar arch collaterals).",
            "An intravenous cannula in the access arm.",
            "Forgetting that a patient with a LIMA needs the left radial.",
          ],
        },
        {
          kind: "pearl",
          text: "Brilakis's first line against spasm is prevention: a sedated patient, ultrasound, about 1 mL of anaesthetic and as few passes as possible, with a vasodilator once the sheath is in.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, choose radial access and run the puncture with spasm prevention built in: sedate, scan above the styloid at low depth, give about 1 mL of local anaesthetic after aspirating, then puncture under ultrasound bevel up. Repeat in a small-radial patient and decide when to move to another artery.",
        },
        { kind: "video", id: "zQCx7wQSe-Q", note: "Brilakis, radial artery access step by step (Manual of PCI, section 4.3)." },
        { kind: "video", id: "K96telF5pxg", note: "Elias Hanna on coronary catheter techniques with a focus on the transradial approach." },
        {
          kind: "keypoints",
          items: [
            "Allen and Barbeau testing: no longer recommended by Brilakis (RADAR); Oxford notes some operators still require a normal test.",
            "Left radial for a patent LIMA; position the arm over the abdomen, use finger traps, a partly inserted long sheath, or the distal radial.",
            "Ultrasound above the styloid at low depth reduces attempts (RAUST); Brilakis expects this to reduce spasm, though RAUST found no significant difference in spasm.",
            "About 1 mL of local anaesthetic (Oxford 1–2 mL); too much: wait 1–2 minutes or move; never intra-arterial lidocaine.",
            "Puncture about 1 cm above the styloid along the artery's course; single-wall or through-and-through.",
            "Spasm risk: small artery, younger, repeated passes, vasopressors or arrest; prevent with sedation, ultrasound and nitroglycerin.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-radial-sheath",
      title: "Radial access II: wire, sheath, vasodilator and securing the sheath",
      minutes: 12,
      topics: ["acc-radial", "acc-seldinger"],
      sources: [
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "brilakis-pci", loc: "29.2" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Once the needle is in the radial artery, the rest of the access is about not losing it: a wire that goes where it should, a sheath no larger than the artery tolerates, and drugs that keep the artery open and relaxed. Problems on the way from the arm to the aortic root are taught in the module on reaching the root; spasm and entrapment later in the case are taught in the engagement module.",
        },
        {
          kind: "steps",
          title: "Step 6. The 0.018 inch wire",
          items: [
            { title: "Single-wall puncture", detail: "Pass the wire straight through the needle." },
            { title: "Through-and-through puncture", detail: "Withdraw the needle slowly; as soon as blood flows, advance the wire." },
            {
              title: "If it meets resistance",
              detail:
                "The needle may be badly placed, the radial artery tortuous, the wire in a side branch, or the artery in spasm. Never push hard: that is how dissection, spasm and perforation happen. Check for good backflow and reposition the needle until you have it. Extending the wrist straightens the artery. If blood flows well but the wire stops at the needle tip, change the needle's angle while advancing the wire, and if the needle entered the side of the artery, turn it slightly so the bevel faces the lumen.",
            },
            {
              title: "If the resistance is higher up the forearm",
              detail:
                "Screen the wire on fluoroscopy to see where it is and whether the artery is tortuous. Then advance a diagnostic catheter to just below the wire tip and inject to show the cause, such as tortuosity or spasm. Brilakis illustrates a small, tortuous radial that went into spasm on a 0.035 inch wire; the loop was crossed with a coronary guidewire, the sheath went in over it, the diagnostic study was completed with 5 Fr catheters, and the PCI needed a switch to the femoral artery.",
            },
          ],
        },
        { kind: "tip", id: "access-radial-wire-resists" },
        {
          kind: "check",
          stem: "The 0.018 inch wire advances about 15 cm and then stops; the patient feels a sharp pain in the forearm. What do you do?",
          options: [
            "Stop, screen the wire, and image the forearm artery through a catheter brought up beneath the wire tip",
            "Push firmly once more, because the radial artery often straightens after a short pause",
            "Exchange to a stiffer 0.035 inch wire through the needle, so that it straightens out the difficult segment",
            "Insert the sheath over the wire as it lies and inject through the sheath to find out",
          ],
          answer: 0,
          explanation:
            "Resistance high in the forearm is investigated, not overcome: fluoroscopy shows where the wire is, and angiography through a diagnostic catheter advanced to just below the wire tip shows tortuosity, a loop or spasm. Pushing risks dissection and perforation, a stiffer wire makes that worse, and running a sheath over a wire of unknown course can tear a side branch.",
        },
        {
          kind: "steps",
          title: "Steps 7–8. Nick and sheath",
          items: [
            {
              title: "Skin nick (optional)",
              detail:
                "Take the needle out and nick the skin where the wire enters. Do not go deep, and cut along the line of the artery, not across it. Keep your other hand out of the field. Oxford instead nicks the skin superficially over the intended site before the puncture, and asks for the sheath to be inserted gently.",
            },
            {
              title: "Choose the sheath",
              detail:
                "Size it to the artery (ultrasound can measure it) and to the procedure. Brilakis prefers 4 Fr sheaths for diagnostic studies, or thin-walled sheaths, because a lower profile is less likely to cause spasm; a thin-walled 6 Fr sheath has an outer diameter of about 2.44 mm against 2.62 mm for a standard one, though thin walls kink more easily. Oxford's radial sheaths are generally 5 or 6 Fr, short or long, sometimes hydrophilic. Brilakis usually avoids long radial sheaths because of radial occlusion and spasm, though he describes a long sheath left partly outside the left wrist as one way to work from the left radial, and in his complications chapter he lists long (24 cm) radial sheaths, whose tips lie in the brachial artery, as a way to keep catheter manipulation off the radial artery and so limit spasm. Sheathless guides (taught with the sheath choices in the first lesson) put a larger guide through a smaller puncture.",
            },
            { title: "Wet it", detail: "Dip the sheath in saline to activate its hydrophilic coating." },
            {
              title: "Insert",
              detail:
                "Advance it over the 0.018 inch wire until the hub reaches the skin, then remove the dilator and the wire. From the left wrist, the distal radial or a partly inserted long sheath avoids twisting the arm.",
            },
            {
              title: "If it will not advance",
              detail:
                "At the skin, use the scalpel. In spasm, give sedation and verapamil or nitroglycerin into the artery, or nitroglycerin under the skin. If the artery is simply too small, use another: the ulnar, the other radial or the femoral.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Steps 9–10. Make the artery safe, then secure the sheath",
          items: [
            { title: "Aspirate", detail: "Draw 3–4 mL from the side arm and discard it." },
            {
              title: "Vasodilator",
              detail:
                "Give one or more vasodilators through the side arm. Brilakis's examples: nitroglycerin (100–200 mcg), nicardipine (100–200 mcg) or verapamil (2–3 mg). In the engagement chapter his example after sheath insertion is 2.5 mg of verapamil, nitroglycerin 100–200 mcg, or both. A vasodilator before the sheath comes out may also lower the risk of radial occlusion. These are typical doses only; follow local protocol. Brilakis does not give nitroglycerin to a patient who is hypotensive, has right ventricular infarction or hypertrophic obstructive cardiomyopathy, or has recently taken a PDE-5 inhibitor, and he lists the verapamil given for radial access among the causes of hypotension at the start of angiography (the drugs module teaches both).",
            },
            {
              title: "Heparin",
              detail:
                "Intravenous heparin protects the radial artery from occlusion. For a diagnostic study the usual dose is 50 units/kg with a ceiling of 5000 units, though 100 units/kg may work better. With extreme radial or subclavian tortuosity, Brilakis may hold the heparin until a catheter has reached the aortic root, in case he has to cross over to the femoral artery (the antithrombotics module covers the doses in full). Oxford describes a cocktail injected into the radial artery before catheterisation, for example heparin 2500 IU, verapamil 2.5 mg and GTN 200–400 micrograms; regimens vary.",
            },
            {
              title: "Secure the sheath",
              detail:
                "Stop it moving: clip the side arm to the drape with a haemostat, cover it with a transparent adhesive dressing, suture it to the skin, or use the adhesive clasp of a sheath extension.",
            },
          ],
        },
        { kind: "tip", id: "access-radial-thin-sheath-vasodilator" },
        {
          kind: "check",
          stem: "A right radial diagnostic study is planned; the report of her previous study notes extreme subclavian tortuosity. Your sheath is in. When might Brilakis hold back the intravenous heparin?",
          options: [
            "Never: heparin must always go in before any catheter is advanced, or the radial artery will occlude",
            "Until the end of the case, when it is given just before the sheath is pulled",
            "Until a catheter reaches the aortic root, because crossover to the femoral artery may be needed",
            "Until the ACT has been measured, because women need lower heparin doses",
          ],
          answer: 2,
          explanation:
            "Heparin (typically 50 units/kg, capped at 5000 units, in a diagnostic study) prevents radial occlusion, but with extreme radial or subclavian tortuosity Brilakis may wait until a catheter is at the aortic root, because engagement may prove impossible and a femoral crossover in a heparinised patient bleeds more. Giving it only at the end defeats its purpose.",
        },
        {
          kind: "table",
          caption: "Radial complications Oxford expects you to recognise",
          head: ["Complication", "How often and what to do"],
          rows: [
            ["Spasm", "Common; usually prevented by mild sedation before the puncture; if it occurs, nitrates and verapamil into the artery through the sheath or catheter"],
            ["Loss of the radial pulse after the procedure", "Up to 5%, often without symptoms"],
            ["Local haematoma", "Often just proximal to the compression band soon after it is applied; a second band placed against the first usually controls it"],
            ["Forearm haematoma", "About 1 in 100 radial cases at most, appearing gradually once the patient is back on the ward; bandage the forearm, apply ice and elevate the arm in a sling, and watch for compartment syndrome"],
            ["Serious bleeding", "Very rare from the radial route"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "A 6 Fr standard sheath by habit in a small radial artery when a 4 Fr or thin-walled sheath would do.",
            "A dry hydrophilic sheath dragged through the skin.",
            "Forgetting the vasodilator once the sheath is in.",
            "An unsecured sheath that slips out when the arm moves.",
            "Pushing the wire against forearm resistance instead of imaging it.",
          ],
        },
        {
          kind: "pearl",
          text: "When the wire stops in the forearm, the angiogram is the tool, not the wire. Bring a catheter up to just below the wire tip and inject: you will see whether you face a loop, tortuosity or spasm, and choose the right fix.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, continue from a radial puncture: pass the 0.018 inch wire, nick along the line of the artery, insert a thin-walled sheath after wetting it, aspirate, give the vasodilator, decide when to give heparin, and secure the sheath before moving to the catheters.",
        },
        { kind: "video", id: "zQCx7wQSe-Q", note: "Brilakis, radial artery access step by step (Manual of PCI, section 4.3)." },
        {
          kind: "keypoints",
          items: [
            "Wire resistance: never push; get backflow, extend the wrist, change the angle or turn the bevel; higher up, image with fluoroscopy and a catheter angiogram.",
            "Nick along the artery, shallow; dip the sheath in saline.",
            "Smallest adequate sheath: 4 Fr or thin-walled for diagnostic work; Brilakis usually avoids long radial sheaths.",
            "Aspirate 3–4 mL, then a vasodilator (for example verapamil 2–3 mg or nitroglycerin 100–200 mcg; typical doses, follow local protocol).",
            "Heparin for a diagnostic study: typically 50 units/kg, capped at 5000 units; it may be held until the root is reached in extreme tortuosity.",
            "Secure the sheath; Oxford: pulse loss in up to 5%, forearm haematoma in up to 1 in 100.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-alternative",
      title: "Alternative arterial routes: distal radial, ulnar, brachial, axillary and transcaval",
      minutes: 12,
      topics: ["acc-alternative-arterial"],
      sources: [
        { book: "brilakis-pci", loc: "4.1" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "4.4" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "21.4" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 9: Microaxial pump section (printed p.274)" },
        { book: "oxford-cath", loc: "ch 5: TAVI work-up" },
        { book: "oxford-cath", loc: "ch 1: Cardiac CT or invasive angiography?" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "aminian-disco-radial-2022", "babunashvili-tendera-2024", "stiermaier-rapid-2025", "singh-distal-radial-meta-2026"],
      blocks: [
        {
          kind: "p",
          text: "When the usual radial or femoral artery is unavailable, too small or too diseased, or when a device needs a route the usual sites cannot give, you need to know the alternatives, what they offer and what they cost. Of these, the distal radial artery is the one most likely to become part of your routine coronary work. Brilakis counts the ulnar and brachial arteries among rarely used sites, and the axillary and transcaval routes belong to large-bore device work, whose technical detail he places beyond the scope of his manual.",
        },
        { kind: "h", text: "Distal radial (snuffbox) access" },
        {
          kind: "steps",
          title: "How it is done (Brilakis 4.3; Oxford chapter 3)",
          items: [
            {
              title: "Find the artery",
              detail:
                "Here the radial artery runs over the back of the hand, where it can be felt over the bones of the snuffbox between the thumb and index finger. Have the patient grip the thumb inside the closed fingers and keep the hand slightly abducted; this brings the artery up towards the surface. Scan it with the probe over the snuffbox.",
            },
            {
              title: "Puncture",
              detail:
                "Enter at 30–45°, going from lateral to medial, aiming at the point where the pulse is strongest in the proximal part of the snuffbox.",
            },
            {
              title: "After the sheath",
              detail:
                "The arm can be turned to a neutral, pronated position that is comfortable for both patient and operator, which is the main appeal from the left wrist.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Distal against proximal radial access in the manual (Brilakis Table 4.1, summarised)",
          head: ["Domain", "Favours distal", "No difference", "Favours proximal"],
          rows: [
            ["Success", "", "Obtaining access; crossover to femoral", ""],
            ["Efficiency", "", "Time to haemostasis: left open (marked uncertain across both columns)", "Time to access; ease of access; larger sheaths; probably ease of engagement"],
            ["Comfort", "Patient comfort from the left wrist", "Operator and patient comfort from the right wrist", "Operator comfort from the left wrist"],
            ["Complications", "Compartment syndrome; hand ischaemia; probably radial occlusion", "Bleeding", ""],
          ],
        },
        {
          kind: "p",
          text: "Oxford lists the benefits as easier left radial access for patient and operator, easier access when the arm cannot be fully supinated, possibly easier retrograde reopening of an occluded radial with a lower occlusion risk, less forearm compartment syndrome, and quicker haemostasis because the artery is more superficial. Brilakis adds the costs: a smaller artery limits the sheath size, access takes longer, and the extra distance is one of his causes of failing to reach the aortic root (with very tall patients and severe tortuosity), which long sheaths, a stiff wire or 125 cm catheters may overcome. A longer guide has a cost if PCI follows: balloon and stent shafts may then be too short to reach the lesion (he lists the longest drug-eluting stent shafts at 140–145 cm). His other answers are a guide extension, the parallel sheath technique, or a change of site, the femoral route usually being the shorter one. He uses distal radial access, or long radial sheaths, to make the left radial practical in CTO PCI, and lists it among ways to lower the radial occlusion risk.",
        },
        {
          kind: "p",
          text: "**What has changed since the manual.** DISCO RADIAL (Aminian 2022) randomised 1307 patients to distal or conventional radial access with a 6 Fr thin-walled sheath and a strict haemostasis protocol. Forearm radial occlusion at discharge was rare and did not differ (0.31% distal against 0.91% conventional). Crossover to another site was more frequent with distal access (7.4% against 3.5%), as was radial spasm (5.4% against 2.7%), while haemostasis was quicker (median 153 against 180 minutes). So in DISCO RADIAL two entries in the manual's table looked different: crossover was not equal, and a lower occlusion rate was not shown when best haemostasis practice was used. Later randomised evidence disagrees on occlusion. TENDERA (850 patients, 5 or 6 Fr sheaths) found less forearm occlusion at 12 months with distal access (2.5% against 6.7%), with more crossover (4.6% against 1%) and shorter haemostasis. RAPID (439 diagnostic patients) found no difference in occlusion (20.3% against 21.2%) and more crossover with distal access (14.9% against 8.3%). A 2026 meta-analysis of 20 randomised trials (8718 patients) found less radial occlusion with distal access (odds ratio 0.26), at the price of more crossover (odds ratio 2.28) and lower procedural success; it found no significant difference in spasm or time to haemostasis. Every one of these analyses found more crossover with the distal route.",
        },
        {
          kind: "check",
          stem: "A colleague says distal radial access should be the default because it has the same success as conventional radial access and clearly prevents radial occlusion. Which statement is most accurate?",
          options: [
            "Correct: Brilakis's table and the DISCO RADIAL trial both show fewer occlusions and an equal crossover rate",
            "DISCO RADIAL found equal, low occlusion rates with best practice, and more crossover with distal access",
            "DISCO RADIAL found distal access slower to haemostasis and higher in forearm occlusion",
            "Distal access has no proven advantage of any kind and is not described in either manual",
          ],
          answer: 1,
          explanation:
            "In DISCO RADIAL, with rigorous haemostasis, forearm occlusion was similarly low with both routes, crossover and spasm were more frequent with distal access, and haemostasis was shorter. Brilakis's 2020 table, written before the trial, showed no difference in crossover and a possible occlusion benefit. Since then TENDERA and a 2026 meta-analysis of 20 trials have found less occlusion with distal access and RAPID has not, while all of them found more crossover; so the colleague's ‘clearly’ and ‘same success’ both overstate the case. Both manuals describe the snuffbox approach and its advantages for the left wrist and for patients who cannot supinate.",
        },
        { kind: "tip", id: "access-distal-radial-angle" },
        { kind: "h", text: "The other routes" },
        {
          kind: "table",
          head: ["Route", "When it is used", "Technique and cautions"],
          rows: [
            [
              "Ulnar",
              "In place of a very small radial artery, or when the radial cannot be found; one of the wrist routes for CTO PCI",
              "Obtained like radial access, but harder: the artery lies deeper and often just beneath the flexor carpi ulnaris tendon, and it runs next to the ulnar nerve, so hitting the nerve is very painful",
            ],
            [
              "Brachial",
              "Rarely. Brilakis also lists brachial or distal radial access for reopening an occluded radial artery in a highly symptomatic patient",
              "Usually at the antecubital fossa under ultrasound. Hard to compress compared with the radial, and radial compression bands do not fit it; a haematoma there carries a higher risk of nerve injury",
            ],
            [
              "Axillary",
              "Sometimes for haemodynamic support devices; Oxford notes that the microaxial pump can be inserted through the femoral or axillary artery, and that CT before TAVI assesses the femoral and axillary arteries",
              "Requires experience with large-bore access and closure. If the iliofemoral arteries are badly diseased before TAVI, Oxford images the axillary and subclavian arteries to find another route",
            ],
            [
              "Transcaval",
              "Insertion of support devices and TAVI; Brilakis's support-device table notes it as a way to place the arterial cannula when severe peripheral arterial disease rules out the femoral route",
              "Brilakis places the detailed technique beyond the scope of his manual, and Oxford does not describe it; it needs large-bore access and closure expertise",
            ],
            ["Carotid", "Rarely, mainly in structural interventions", "Not described further"],
            [
              "Peripheral bypass grafts",
              "Some operators puncture Dacron grafts",
              "Oxford generally advises against it because of bleeding afterwards",
            ],
          ],
        },
        {
          kind: "check",
          stem: "Why does Brilakis keep brachial access as a rare choice for coronary work?",
          options: [
            "Its catheters cannot reach the left main ostium because of the sharp angle at the subclavian artery",
            "It needs a 45 cm sheath, which is too long for most coronary catheters in common use",
            "It causes more radial occlusion than the radial route because flow to the wrist stops",
            "It is hard to compress, takes no radial band, and a haematoma there more often injures a nerve",
          ],
          answer: 3,
          explanation:
            "Brilakis's reasons are practical: haemostasis is difficult (the brachial artery is harder to compress and compression bands cannot be used) and a haematoma brings a higher risk of nerve injury. Reaching the coronary ostia is not the problem.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming distal radial access will reach the aortic root in a very tall patient; have a long sheath or longer catheters ready, remembering that balloon and stent shafts may then be too short for PCI.",
            "Choosing the ulnar artery without ultrasound and hitting the ulnar nerve.",
            "Using the brachial artery for convenience and then struggling for haemostasis.",
            "Trying axillary or transcaval access for a support device without large-bore closure experience in the room.",
          ],
        },
        {
          kind: "pearl",
          text: "From the left wrist, the snuffbox lets the patient rest the hand over the abdomen and lets you work from the right side. Add the pooled trial evidence of less forearm occlusion and you have the case for it; the price is a harder puncture and more crossover.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, choose the nearest available wrist route for a patient with a LIMA graft who cannot supinate the left arm, and plan the distal left radial puncture: thumb tucked, probe over the snuffbox, needle at 30–45° from lateral to medial. Note in your plan what you will do if the catheter does not reach the root.",
        },
        { kind: "video", id: "vAOGSbKG4xM", note: "A case with snuffbox access, a kink, rotational atherectomy, perforation and coiling." },
        { kind: "video", id: "BXRpJS8jtFM", note: "Elias Hanna on axillary access for a balloon pump or microaxial pump: access, exchange, closure and complications." },
        {
          kind: "keypoints",
          items: [
            "Distal radial: thumb tucked, puncture 30–45° from lateral to medial in the proximal snuffbox; easier left radial work and comfort.",
            "Its costs: a smaller artery, longer access time and more crossover in every trial. Occlusion: no difference in DISCO RADIAL and RAPID, less with distal access in TENDERA and in a 2026 meta-analysis of 20 trials.",
            "Ulnar: deeper, under the flexor carpi ulnaris tendon, next to the ulnar nerve.",
            "Brachial: rarely, under ultrasound at the antecubital fossa; hard to compress, no band, nerve injury with haematoma.",
            "Axillary and transcaval: for support devices and TAVI; both need large-bore access and closure expertise.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-venous",
      title: "Venous access: femoral vein, internal jugular and subclavian",
      minutes: 14,
      topics: ["acc-venous"],
      sources: [
        { book: "oxford-cath", loc: "ch 3: How to obtain venous access" },
        { book: "oxford-cath", loc: "ch 3: Femoral vein access" },
        { book: "oxford-cath", loc: "ch 3: Internal jugular vein access" },
        { book: "oxford-cath", loc: "ch 3: Subclavian vein access" },
        { book: "oxford-cath", loc: "ch 4: Accessing the right heart" },
        { book: "oxford-cath", loc: "ch 5: Pulmonary embolism" },
        { book: "oxford-cath", loc: "ch 9: Temporary pacemaker" },
        { book: "oxford-cath", loc: "ch 9: Endomyocardial biopsy" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "14.5" },
        { book: "brilakis-pci", loc: "29.1" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "lamperti-perseus-vascular-2020", "williams-arm-right-heart-2014"],
      blocks: [
        {
          kind: "p",
          text: "Venous access in the cath lab serves right heart pressures and saturations, cardiac output and shunt measurements, pulmonary angiography, myocardial biopsy, temporary pacing and the venous side of support devices. The route depends on the procedure, the patient and the operator. Oxford teaches three veins; Brilakis adds that ultrasound should guide venous as well as arterial punctures, and is especially valuable when you need both the femoral artery and vein.",
        },
        { kind: "h", text: "Femoral vein" },
        {
          kind: "steps",
          title: "Femoral vein, step by step (Oxford)",
          items: [
            { title: "Anatomy", detail: "The vein usually lies medial to the artery. From lateral to medial: nerve, artery, vein (Oxford's ‘NAVY’ mnemonic)." },
            { title: "Prepare", detail: "Shave and paint the groin; infiltrate 5–10 mL of 1% lidocaine." },
            {
              title: "Protect the artery",
              detail: "Feel the artery and hold it laterally with the fingers of the left hand while the right hand holds the needle (or let ultrasound show both vessels).",
            },
            {
              title: "Puncture with suction",
              detail:
                "Mount the needle on a syringe of heparinised saline and advance it as for the artery, drawing gently on the plunger. Once the syringe fills easily with dark blood, take it off the needle without moving the tip and thread the wire.",
            },
            { title: "Sheath", detail: "Nick the skin before or after the puncture, insert the sheath (usually 5 or 6 Fr) and flush the side arm so thrombus does not form." },
          ],
        },
        {
          kind: "table",
          head: ["", "Femoral vein"],
          rows: [
            ["Main uses", "Oxford's usual route for combined left and right heart catheterisation (the right femoral vein), though it notes that an approach from the superior vena cava is sometimes preferred. Right and left heart catheterisation can also be done entirely from the arm, through an antecubital fossa vein and the radial artery: in one prospective series of 58 procedures the arm vein gave right heart access in 93% (Williams 2014). Other uses: temporary pacing wires (Oxford: usually femoral, with a sheath wider than the pacing wire) and central venous lines in patients on anticoagulants or with clotting disorders, because complications are few"],
            ["Complications", "Puncture of the artery, local haematoma, infection if the line stays in after the procedure"],
            ["Cautions", "Suspected or proven pulmonary embolism: femoral venous access may dislodge iliofemoral clot (Oxford). On the way to the heart the catheter can catch in venous side branches; pull back and rotate under screening"],
          ],
        },
        { kind: "h", text: "Artery and vein in the same groin" },
        {
          kind: "p",
          text: "An arteriovenous fistula is a connection between the femoral artery and vein. Brilakis lists its causes: a low puncture (lower in the groin the vein often lies behind the common or superficial femoral artery, so a needle can pass through the artery into the vein), multiple arterial punctures, and arterial and venous access in the same procedure, especially at the same level. Ultrasound shows how the two vessels lie and prevents it. If you have both sheaths in, remove the arterial sheath first and the venous sheath a few minutes later, not both together. For VA-ECMO, Brilakis puts the venous cannula in the right common femoral vein (the easier path to the right atrium) and the arterial cannula in the left common femoral artery. He advises against placing both in the same groin, because the arterial cannula can collapse the femoral vein beside it and congest the leg. If the femoral vein is thrombosed, the venous cannula can go in the other femoral vein or the internal jugular vein; with an inferior vena cava filter, it goes through the internal jugular vein.",
        },
        { kind: "tip", id: "access-artery-vein-same-groin" },
        {
          kind: "check",
          stem: "At the end of a combined right and left heart study you have a 6 Fr arterial and a 6 Fr venous sheath in the right groin. How do you remove them?",
          options: [
            "The arterial sheath first, then the venous sheath a few minutes later",
            "Both together, with one hand over each, so the groin is compressed only once",
            "The venous sheath first, because venous bleeding is harder to control",
            "Leave the venous sheath overnight as a precaution against late tamponade",
          ],
          answer: 0,
          explanation:
            "Brilakis lists sequential removal, arterial first and venous a few minutes later, as a way to prevent arteriovenous fistula, alongside ultrasound-guided puncture and avoiding artery and vein at the same level. Oxford warns that a venous line left in place invites infection.",
        },
        { kind: "h", text: "Internal jugular vein" },
        {
          kind: "steps",
          title: "Internal jugular vein (Oxford)",
          items: [
            {
              title: "Anatomy",
              detail:
                "Inside the carotid sheath the vein lies lateral to the carotid artery and in front of it. Just above the clavicle it passes between the sternal and clavicular heads of sternocleidomastoid, then meets the subclavian vein behind the clavicle, on the medial side of scalenus anterior.",
            },
            {
              title: "Ultrasound first",
              detail:
                "Brilakis recommends ultrasound for venous as well as arterial punctures, Oxford notes that a handheld probe helps find the vein, and the European anaesthesia guideline on ultrasound-guided vascular access (PERSEUS, 2020) grades the evidence for ultrasound-guided internal jugular cannulation at level 1B. So make real-time ultrasound the default: find the vein lateral to the carotid, check that it collapses under the probe while the artery does not, and follow the needle tip into it. The landmark approaches below are the fallback when ultrasound is not available.",
            },
            {
              title: "Choose the approach",
              detail:
                "High, mid or low (supraclavicular). The low approach is close to the apex of the pleura and carries a high pneumothorax risk; leave it to experienced operators.",
            },
            {
              title: "Prepare",
              detail:
                "Paint the neck; some operators also clean and drape below the clavicle so they can move to the subclavian vein if the neck fails. Infiltrate 5–10 mL of 1% lidocaine and make a small skin incision: forcing the needle through intact skin can distort the anatomy.",
            },
            {
              title: "High approach (landmark fallback)",
              detail:
                "Turn the head away. Feel the carotid at the level of the thyroid cartilage and hold it medially with your fingers. Enter just outside it at 45°, pointing at the nipple on that side in a man, or at the anterior superior iliac spine on that side in a woman. A miss is followed by a pass angled a little more medially.",
            },
            {
              title: "Mid approach (landmark fallback)",
              detail:
                "The patient looks straight ahead with the neck slightly extended. Feel the carotid at the midpoint of a line from the mastoid to the sternal notch, hold it medially, enter just lateral to it and advance downwards at about 45–60° until you reach the vein.",
            },
            {
              title: "Puncture and wire",
              detail:
                "Use a syringe of heparinised saline on the needle and aspirate gently all the way in. When you are in the vein, pass the wire and complete the Seldinger sequence.",
            },
          ],
        },
        {
          kind: "table",
          head: ["", "Internal jugular vein"],
          rows: [
            ["Uses", "Pulmonary artery catheterisation; myocardial biopsy (Oxford uses the right internal jugular for right ventricular biopsy); central access in patients with clotting problems or on anticoagulants, or in whom a pneumothorax would be particularly dangerous (COPD, respiratory failure); pulmonary angiography when the inferior vena cava holds thrombus or a filter"],
            ["Complications", "Arterial puncture, haematoma, infection, injury to cervical nerve roots; pneumothorax or haemothorax with the low approach; chylothorax on the left"],
          ],
        },
        {
          kind: "steps",
          title: "When the jugular or subclavian vein will not yield blood (Oxford)",
          items: [
            { title: "Withdraw slowly", detail: "The needle may have passed straight through the vein. Pull back slowly while aspirating; when blood comes, pass the wire." },
            { title: "Flush the needle", detail: "It may be blocked." },
            { title: "Tilt head down", detail: "10–30° of head-down tilt fills the neck veins." },
            { title: "Fill the patient", detail: "Give intravenous fluid, especially if the patient is dry or on large diuretic doses." },
          ],
        },
        { kind: "tip", id: "access-central-vein-no-blood" },
        {
          kind: "check",
          stem: "Using the high approach to the right internal jugular vein in a man, where should the needle point?",
          options: [
            "Medial to the carotid, towards the sternal notch, at a steep 80°",
            "Lateral to the carotid, parallel to the bed, towards the opposite shoulder",
            "Lateral to the carotid at 45°, towards the right nipple",
            "Through the carotid sheath centre, towards the left anterior superior iliac spine",
          ],
          answer: 2,
          explanation:
            "In Oxford's high approach the needle enters at 45° just outside the palpated carotid, pointing at the same-side nipple in a man (the same-side anterior superior iliac spine in a woman); after a miss, the next pass is angled a little more medially. Going medial to the carotid invites arterial puncture.",
        },
        { kind: "h", text: "Subclavian vein" },
        {
          kind: "steps",
          title: "Subclavian vein (Oxford)",
          items: [
            {
              title: "Anatomy",
              detail:
                "It continues from the axillary vein at the outer border of the first rib, runs 3–4 cm and joins the internal jugular behind the sternoclavicular joint to become the brachiocephalic vein. Behind it lie scalenus anterior and then the subclavian artery and brachial plexus; further in, on the medial side, sit the phrenic nerve and the internal mammary artery, with the thoracic duct as well on the left. Oxford notes that ultrasound may help find it; PERSEUS found the evidence for ultrasound guidance limited at sites other than the internal jugular and femoral veins and the arteries, so use it where you can but know the landmarks.",
            },
            { title: "Position", detail: "A rolled towel or a litre bag of fluid between the shoulder blades opens out the chest." },
            {
              title: "Anaesthetic and incision",
              detail: "Paint the area and infiltrate 5–10 mL of 1% lidocaine along the track, starting 2 cm below the inner third of the clavicle and finishing just beneath the bone; make a small incision.",
            },
            {
              title: "Needle path",
              detail:
                "With the needle on a syringe of heparinised saline, advance to the clavicle and walk down until the tip is just beneath it. Then turn the needle through 30–45° and advance towards the suprasternal notch (a finger in the notch helps you aim), keeping the needle parallel to the bed to avoid the artery and the pleura. Once in the vein, complete the Seldinger sequence.",
            },
          ],
        },
        {
          kind: "table",
          head: ["", "Subclavian vein"],
          rows: [
            ["Uses", "Permanent pacing systems and long-term central catheters (its commonest use); pulmonary artery catheterisation"],
            ["Complications", "Arterial puncture, pneumothorax, haemothorax, infection"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing artery and vein at the same level in one groin, or pulling both sheaths together.",
            "The low jugular approach in inexperienced hands, close to the pleura.",
            "Pointing the subclavian needle downwards instead of keeping it parallel to the bed.",
            "Advancing a needle into the neck without aspirating, so you cannot tell when you have entered the vein.",
            "Femoral venous access in a patient with iliofemoral clot and suspected pulmonary embolism.",
          ],
        },
        {
          kind: "pearl",
          text: "If the vein is not entered on the way in, it is often entered on the way out: the needle has gone through both walls. Withdraw slowly with gentle suction before you redirect.",
        },
        {
          kind: "sim",
          sim: "pacing",
          task: "In the temporary pacing lab, start from the venous access choice: pick the femoral vein in an anticoagulated patient, place a sheath larger than the pacing wire, and then position the lead. Note which vein you would use instead if the femoral veins were thrombosed.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, set up a combined study from the right groin: plan the arterial and venous punctures so that they are not at the same level, and at the end remove the arterial sheath before the venous one.",
        },
        { kind: "video", id: "i76OWhbpwM4", note: "Elias Hanna on simple techniques for femoral or difficult right heart catheterisation." },
        {
          kind: "keypoints",
          items: [
            "Venous access serves right heart studies, output and shunts, pulmonary angiography, biopsy, pacing and support devices.",
            "Femoral vein: medial to the artery; needle on a heparinised-saline syringe with gentle suction; 5 or 6 Fr sheath; Oxford's usual route for combined studies and temporary wires, with the arm vein and the jugular as alternatives.",
            "Artery and vein in one groin: ultrasound, different levels, arterial sheath out first and the venous a few minutes later.",
            "Internal jugular: under ultrasound by default, lateral to the carotid; landmark fallback at 45° towards the ipsilateral nipple (men) or anterior superior iliac spine (women); avoid the low approach unless experienced.",
            "Subclavian: walk under the medial third of the clavicle, turn 30–45° towards the sternal notch, keep parallel to the bed.",
            "No blood: withdraw slowly, flush, tilt 10–30° head down, give fluid.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-troubleshoot",
      title: "When the wire, dilator or sheath will not go",
      minutes: 12,
      topics: ["acc-sheath-troubleshoot"],
      sources: [
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "5.2" },
        { book: "oxford-cath", loc: "ch 3: The Seldinger technique" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Resistance during access is information. It tells you that the needle, wire, dilator or sheath is somewhere other than you think, or that the tissue or vessel in front of it needs a different tool. The answer is never more force: forcing causes dissection, perforation and kinked kit. This lesson gathers Brilakis's fixes for each stage of the sequence into one place. Resistance once the wire is on its way to the aortic root is taught in the module on reaching the root.",
        },
        {
          kind: "steps",
          title: "The rule for every stage",
          items: [
            { title: "1. Stop", detail: "Do not push a wire, dilator or sheath against resistance." },
            { title: "2. Image", detail: "Fluoroscopy shows where the wire runs and whether it, or the dilator, has kinked; ultrasound shows the needle and the vessel." },
            { title: "3. Find the level", detail: "Needle tip, skin and subcutaneous tissue, arterial wall, or the vessel beyond." },
            { title: "4. Fix that cause", detail: "Use the table below; if the fixes fail, change site (Brilakis's last step in each algorithm)." },
          ],
        },
        {
          kind: "table",
          caption: "Stage by stage (Brilakis 4.2 and 4.3)",
          head: ["Stage and problem", "Likely causes", "Fixes"],
          rows: [
            [
              "Femoral micropuncture wire will not leave the needle",
              "Needle tip poorly placed; wire heading down the leg or into a small branch; femoral or iliac disease or tortuosity; a low puncture below the bifurcation",
              "Screen it. If it stops just past the needle tip, remove the wire, reposition the needle until backflow is good and reintroduce the wire. If it heads down the leg, withdraw and redirect under fluoroscopy. If it follows the expected course through tortuosity, carry on",
            ],
            [
              "Radial wire will not leave the needle",
              "Needle position; radial tortuosity; side branch; spasm",
              "Never push hard. Restore good backflow; extend the wrist; change the needle angle while advancing; turn the bevel towards the lumen if the needle entered the side of the artery",
            ],
            [
              "Micropuncture dilator will not pass, or kinks under the skin",
              "Scar from earlier procedures; calcified plaque; a kinked wire, more likely in obese patients when the wire runs through thick tissue",
              "Nick the skin, or enlarge the nick. Use a stiffer micropuncture dilator. If the wire has kinked: pull it back a little and re-advance the dilator, using a new dilator if the tip has flared; or, if enough wire lies inside the artery, cut off the kinked part and pass the micropuncture dilator or the distal part of a sheath dilator over what remains (the ‘Gordian knot’ technique); or pass the inner dilator into the artery and swap the kinked wire for a long, supportive 0.018 inch wire",
            ],
            [
              "0.035 inch wire will not advance through the micropuncture dilator",
              "A kinked dilator; iliac tortuosity; a side branch; a subintimal course",
              "Screen the wire and redirect",
            ],
            [
              "Femoral sheath will not advance",
              "A poorly prepared track; scar from repeated procedures",
              "Prepare the track: nick with the scalpel and spread the tissue with a haemostat. Check the sheath tip and replace it if damaged. Use a smaller sheath. Exchange (through a dilator) to a stiff 0.035 inch wire. Pass the sheath's dilator alone first to make a track, then the sheath and dilator together",
            ],
            [
              "The 0.035 inch wire kinks as the sheath is pushed",
              "Not specified; Brilakis likens it to the micropuncture wire kinking under its dilator",
              "Take the sheath out, swap the wire (usually through a dilator) for a stiffer one of 0.035 or 0.038 inch, then try again",
            ],
            [
              "Radial sheath will not advance",
              "Skin; spasm; a small artery; tortuosity",
              "Skin: scalpel. Spasm: sedation, verapamil or nitroglycerin into the artery, or nitroglycerin under the skin. Too small: another artery (ulnar, the other radial, or femoral)",
            ],
          ],
        },
        { kind: "tip", id: "access-dilator-will-not-pass" },
        {
          kind: "check",
          stem: "In a patient with a BMI of 41, the micropuncture dilator will not pass. Fluoroscopy shows the 0.018 inch wire bent sharply where it enters the artery; most of the wire is still well up in the iliac artery. Which fix fits Brilakis's list?",
          options: [
            "Push the dilator harder while rotating it, so that it straightens out the kink in the wire as it advances over it",
            "Exchange immediately for a 0.035 inch hydrophilic wire through the micropuncture needle",
            "Inject contrast through the dilator so that the pressure dilates the subcutaneous track hydraulically",
            "Pull the wire back slightly and re-advance the dilator, or cut off the kinked part and pass a dilator over the rest",
          ],
          answer: 3,
          explanation:
            "A kinked wire at the entry point is common in obese patients. Brilakis partly withdraws the wire and re-advances the dilator (a new one if its tip has flared), or, when plenty of wire lies within the artery, cuts away the kinked segment and passes a dilator over the remainder. Another option is to get the inner dilator into the artery and swap to a long supportive 0.018 inch wire. Forcing the dilator worsens the kink, and a polymer-jacketed wire should never go through a needle.",
        },
        { kind: "h", text: "No arterial waveform from a new sheath" },
        {
          kind: "p",
          text: "If a wire will not advance once the sheath is in, Brilakis's first move is to withdraw any catheter and transduce the sheath's side arm. A missing arterial waveform suggests the sheath lies subintimally (femoral or radial) or, at the wrist, that the artery is in severe spasm. With a subintimal sheath it is best to change site. Retrograde dissections made this way are usually well tolerated, because blood flowing against them tends to seal them, provided they are short and spare side branches; large femoral or iliac dissections may need endovascular repair from the opposite groin.",
        },
        { kind: "tip", id: "access-no-waveform-sheath" },
        {
          kind: "check",
          stem: "A femoral sheath has gone in, but the side arm gives no arterial waveform and the J-wire will not advance beyond its tip. What does this suggest, and what is the best course?",
          options: [
            "A blocked transducer; flush the line and continue with the planned catheter",
            "A subintimal sheath; it is best to change the access site",
            "Spasm of the femoral artery; give intra-arterial verapamil and wait",
            "A normal finding in hypotension; inject contrast through the sheath to confirm the lumen",
          ],
          answer: 1,
          explanation:
            "Brilakis reads an absent waveform from the sheath as a possible subintimal position (or severe spasm at the wrist) and prefers to change site when the sheath is subintimal. Injecting contrast through a subintimal sheath would extend the dissection. Femoral arteries are not the ones that spasm in this way.",
        },
        {
          kind: "p",
          text: "Brilakis shows an example: a puncture over the middle of the femoral head where the micropuncture dilator would not pass because the wire had bent at the entry point, so that the wire tip slipped back from the aorta. A second dilator also failed. The wire was removed, the groin pressed for 1 minute, and a repeat puncture succeeded and took a 6 Fr sheath. Starting again is a legitimate fix.",
        },
        {
          kind: "pitfalls",
          items: [
            "Rotating and pushing a dilator against a kinked wire until the wire fractures or the artery tears.",
            "Exchanging wires without a dilator or catheter over the old wire, and losing access.",
            "Putting a damaged sheath back in after a failed attempt.",
            "A polymer-jacketed wire through a needle.",
            "Persisting with a subintimal sheath instead of changing site.",
          ],
        },
        {
          kind: "pearl",
          text: "Most resistance at the skin is a track problem, not an artery problem. A proper nick and a few seconds spreading the tissue with a haemostat save more femoral accesses than any stiff wire.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, practise femoral access in a scarred groin: when the dilator or sheath resists, stop, screen the wire, and work through the fixes in order (nick and spread the track, stiffer dilator, wire exchange through a dilator, dilator alone first) before deciding to re-puncture or change site.",
        },
        { kind: "video", id: "L2ls1c3dvbo", note: "Brilakis on what to do when the dilator will not go over the wire." },
        {
          kind: "keypoints",
          items: [
            "Stop, image, find the level, fix that cause, and change site if the fixes fail.",
            "Wire stops at the needle: reposition for good backflow; at the wrist, extend the wrist, change the angle or turn the bevel.",
            "Dilator will not pass: nick, stiffer dilator, pull back a kinked wire, cut the kinked segment, or swap to a supportive 0.018 inch wire.",
            "Sheath will not pass: prepare the track, inspect the sheath, go smaller, stiffer wire through a dilator, dilator alone first.",
            "No waveform from a new sheath: think subintimal (or radial spasm) and change site.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-access-large-bore",
      title: "Large-bore femoral access and the double-suture pre-close",
      minutes: 14,
      topics: ["acc-large-bore-preclose"],
      sources: [
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.4" },
        { book: "brilakis-pci", loc: "14.5" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "30.15" },
        { book: "oxford-cath", loc: "ch 3: Arterial closure devices" },
        { book: "oxford-cath", loc: "ch 9: Microaxial pump section (printed p.274)" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A 14 Fr hole in the common femoral artery is difficult and risky to control by pressure alone, and a sheath that size can starve the leg of blood. So large-bore access is planned around its ending: Brilakis places the closing sutures before he dilates up, and you check the leg once the big sheath is in. Brilakis teaches the sequence with the microaxial pump used for protected PCI; the same access principles carry over to other large devices. Running the pump itself is taught in the support-devices module.",
        },
        {
          kind: "table",
          caption: "How big is ‘large-bore’? (Brilakis 14.1 and 30.1)",
          head: ["Device", "Arterial access"],
          rows: [
            ["Intra-aortic balloon pump", "7–9 Fr (it can also go in without a sheath)"],
            ["Microaxial pump, smaller model", "13 Fr"],
            ["Microaxial pump, 14 Fr model", "14 Fr sheath, needing iliofemoral arteries over 5 mm across without severe calcification, tortuosity or obstruction"],
            ["VA-ECMO", "15–19 Fr arterial cannula; 25 Fr venous cannula in most patients"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's support-device comparison table (Table 14.1) gives slightly different figures from his equipment chapter: 7–8 Fr for the balloon pump, 12 Fr for the smaller microaxial pump, 21 Fr for the largest model, and 21–25 Fr venous cannulae for VA-ECMO. Sizes change with device generations, so check the instructions for use of the device in your lab.",
        },
        {
          kind: "p",
          text: "Before committing, ask whether the iliofemoral arteries will take the sheath. Brilakis sometimes stents the iliac artery or uses intravascular lithotripsy for calcified iliofemoral arteries to let a large sheath through; if femoral access is poor or the pump will not advance, axillary or transcaval access are options for teams experienced in large-bore access and closure. Oxford notes that a microaxial pump needs larger access than a balloon pump, with more access-site complications, and lists significant peripheral vascular disease among its contraindications. In high-risk PCI where support is not planned up front, many operators place a 4 Fr femoral sheath at the start so that a support device can be inserted quickly if the patient deteriorates.",
        },
        {
          kind: "steps",
          title: "Large-bore femoral access, step by step (Brilakis 14.4)",
          items: [
            {
              title: "1. Small sheath and femoral angiogram",
              detail:
                "Obtain access exactly as in the femoral lessons (fluoroscopy, ultrasound, micropuncture). Place a 5–6 Fr sheath first and take a femoral angiogram to confirm that the artery is large enough and free of significant disease for the large sheath.",
            },
            {
              title: "2. Pre-close with two sutures",
              detail:
                "Deploy two suture-based closure devices, one turned to the 10 o'clock and one to the 2 o'clock position, using the same steps as for routine suture closure (closure module). Do not tie them: wrap each pair of suture ends in gauze or thread them into insulin syringes to keep them tidy and apart.",
            },
            {
              title: "Keep the wire in between",
              detail:
                "As each suture device is drawn back, its guidewire port comes out above the skin; at that point the 0.035 inch wire can be put back into the artery, which Brilakis stresses when large arteriotomies are to be closed. The wire is your way back in for the second device and the large sheath.",
            },
            {
              title: "3. Dilate and insert the large sheath",
              detail:
                "Over the stiff wire supplied with the pump kit, pass and remove 8, 10 and then 12 Fr dilators in turn, then insert the peel-away sheath (short, 13 cm, or long, 25 cm); a 14 Fr sheath of another make is an alternative. Take a femoral angiogram after insertion to make sure the sheath is not making the leg ischaemic.",
            },
            {
              title: "4. Anticoagulate before opening the sheath",
              detail:
                "Give anticoagulation, usually unfractionated heparin, to a recommended ACT above 250 seconds. Only then remove the sheath's dilator and aspirate and flush the sheath.",
            },
          ],
        },
        { kind: "tip", id: "mcs-largebore-angiogram-first" },
        { kind: "tip", id: "mcs-preclose-two-sutures" },
        {
          kind: "check",
          stem: "You have confirmed a 7 mm common femoral artery without disease on the angiogram through a 6 Fr sheath. What comes next in Brilakis's sequence before you dilate to 14 Fr?",
          options: [
            "Deploy two suture devices at 10 and 2 o'clock, leave them untied, and keep wire access",
            "Dilate straight to 14 Fr and place one suture device at the end of the case",
            "Give heparin to an ACT over 250 seconds, then place the suture devices through the large sheath",
            "Place one collagen-plug device now so that the anchor is in position for the end of the case",
          ],
          answer: 0,
          explanation:
            "Pre-close means placing the sutures while the hole is still small: two devices at 10 and 2 o'clock, tied only at the end. Suture devices cannot be deployed through the large sheath, and a collagen plug cannot be pre-placed. Heparin to an ACT above 250 seconds comes after the large sheath is in, before its dilator is removed.",
        },
        { kind: "h", text: "Ending the case" },
        {
          kind: "steps",
          title: "Removing the large sheath (Brilakis 14.4, step 12)",
          items: [
            { title: "Wean", detail: "Reduce the pump support slowly to a low support level to check that the patient tolerates it." },
            {
              title: "Remove the device",
              detail:
                "If support is no longer needed, pull the pump back into the aorta, switch it off and disconnect it, then remove it quickly through the peel-away sheath: bleeding is heavy while its outlet is outside the sheath and its inlet still inside.",
            },
            {
              title: "Close",
              detail:
                "Remove the sheath and tighten the pre-placed sutures. A balloon passed into the iliac artery from the opposite femoral artery can cut the bleeding and make haemostasis easier.",
            },
            {
              title: "If support continues after the PCI",
              detail:
                "Remove the peel-away sheath while advancing the device's repositioning sheath: with an assistant pressing on the groin, pull the peel-away sheath completely out of the body before splitting it (peeling it while part of it is still in the artery can tear the artery and cause bleeding that is hard to control). Flush the side arm of the repositioning sheath, advance it into the artery, partly tighten the sutures to limit oozing around it, put gauze under the catheter to keep a 45° entry angle, and suture and secure both to the skin.",
            },
          ],
        },
        { kind: "tip", id: "mcs-largebore-removal-sutures" },
        { kind: "h", text: "Using the large sheath for the guide" },
        {
          kind: "p",
          text: "The pump's shaft is only 9 Fr inside a 14 Fr sheath, leaving room for a sheath of up to 7 Fr beside it. Brilakis punctures the sheath's valve with a micropuncture needle at the centre of one of its two upper quadrants, passes a 0.018 inch wire, exchanges it for a 0.035 inch wire, and inserts a 7 Fr sheath; at the end the 7 Fr sheath is pulled and the valve seals. This saves a second arterial puncture. Two cautions: a guide may not reach the coronary ostia (if a 7 Fr 45 cm sheath cannot be fully inserted, with 90 cm guides, or in tall patients or a tortuous aorta), so use 100 cm (or 125 cm) guides and short 7 Fr sheaths; and hold the pump still while you insert the sheath, watching it on fluoroscopy, because pushing it forward can injure the left ventricle.",
        },
        { kind: "h", text: "Protecting the limb" },
        {
          kind: "p",
          text: "A large sheath or cannula can make the leg ischaemic. After the pump sheath goes in, Brilakis takes a femoral angiogram to check flow down the leg. For VA-ECMO he places an antegrade sheath in the common or superficial femoral artery, ideally with ultrasound and a micropuncture needle, preferably before the arterial cannula goes in (in urgent cases it can follow once the circuit is running); 6 Fr 24 cm reinforced sheaths kink less. It may not be needed with smaller (15–17 Fr) arterial cannulae, and near-infrared spectroscopy can decide: a tissue saturation below 50%, or more than 15% below the other leg, calls for one. Oxford adds that suture devices can make the leg ischaemic if a knot is pulled too tight, especially when several devices close a large hole, and that the leg should be checked regularly for pallor or cyanosis, coldness, weak or absent pulses, pain and loss of movement or sensation.",
        },
        { kind: "tip", id: "mcs-largebore-limb-angiogram" },
        { kind: "tip", id: "mcs-largebore-limb-check" },
        {
          kind: "check",
          stem: "During VA-ECMO through a 17 Fr arterial cannula in the left common femoral artery, near-infrared spectroscopy shows 46% in the cannulated leg and 68% in the other. What does Brilakis advise?",
          options: [
            "No action, because a 15–17 Fr cannula never needs a distal perfusion sheath",
            "Exchange the cannula for a larger 19 Fr cannula to increase flow down the aorta to the leg",
            "Place an antegrade perfusion sheath in the common or superficial femoral artery",
            "Move the arterial cannula to the right groin beside the venous cannula",
          ],
          answer: 2,
          explanation:
            "Smaller cannulae may not need a perfusion sheath, but the decision rests on the limb: a NIRS saturation below 50%, or more than 15% lower than the uncannulated leg, means an antegrade perfusion catheter should be placed. Here both criteria are met. A larger cannula would worsen the obstruction, and Brilakis keeps arterial and venous cannulae in different groins.",
        },
        {
          kind: "p",
          text: "**Closure tools in the manual.** The suture-based device delivers a single monofilament polypropylene suture and, per Brilakis, can close arterial access from 5 to 21 Fr and large-bore venous access from 5 to 24 Fr; a dedicated large-bore plug-based device is also available for closing large arteriotomies. For a large-bore hole, the suture route means two devices placed before dilatation (pre-close), as in this lesson, not one device at the end. Oxford insists on strict asepsis and on following each device's datasheet and indications; Brilakis repeats the aseptic preparation of the groin just before a closure device is deployed.",
        },
        {
          kind: "pitfalls",
          items: [
            "Dilating to the large sheath before placing the sutures, which loses the planned pre-close and leaves fewer and less reliable ways to close the hole.",
            "Losing wire access between the two suture devices.",
            "Tying the pre-close sutures early, or knotting them too tightly at the end.",
            "No femoral angiogram after the large sheath is in, so leg ischaemia is found late.",
            "Splitting the peel-away sheath while part of it is still inside the artery.",
            "Removing the dilator from the large sheath before the ACT is above 250 seconds.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the large-bore case backwards: how will this hole be closed, and what will you do if closure fails? A balloon from the opposite groin into the iliac artery can reduce the bleeding and make haemostasis easier while you tighten the sutures.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "In the microaxial pump lab, run the access stage first: 6 Fr sheath and femoral angiogram, two suture devices at 10 and 2 o'clock left untied, sequential 8, 10 and 12 Fr dilators, the 14 Fr peel-away sheath, a limb angiogram, heparin to an ACT above 250 seconds, then position the pump. At the end, wean, remove and tighten the sutures.",
        },
        { kind: "video", id: "M72Te9oB76g", note: "Brilakis on large-bore access with two suture-based closure devices (Manual of PCI)." },
        { kind: "video", id: "BXRpJS8jtFM", note: "Elias Hanna on axillary access for a balloon pump or microaxial pump: access, exchange, closure and complications." },
        {
          kind: "keypoints",
          items: [
            "14 Fr microaxial pump: 14 Fr sheath; iliofemoral arteries over 5 mm without severe calcium, tortuosity or obstruction.",
            "5–6 Fr sheath and femoral angiogram first; then two suture devices at 10 and 2 o'clock, left untied; keep wire access.",
            "Dilate 8, 10, 12 Fr over a stiff wire; peel-away sheath 13 or 25 cm; angiogram for the limb.",
            "ACT above 250 seconds before the sheath's dilator comes out.",
            "End: wean to a low support level, remove quickly, tighten the sutures; a contralateral iliac balloon helps haemostasis.",
            "Protect the limb: angiogram, antegrade perfusion sheath for ECMO when NIRS is below 50% or more than 15% below the other leg; avoid over-tight knots.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-access-q1",
      stem: "A 76-year-old woman on warfarin for atrial fibrillation, with LIMA-to-LAD and vein grafts, needs angiography for an NSTEMI. Her INR is 2.6. Which route would both manuals accept while respecting her anticoagulation?",
      options: [
        "Right radial, because both books send anticoagulated patients to the wrist",
        "Left radial, which suits the LIMA and the anticoagulation in both books",
        "Right femoral, because Brilakis's algorithm decides prior CABG first",
        "Left brachial, which reaches the LIMA and avoids the femoral bleeding risk",
      ],
      answer: 1,
      explanation:
        "Brilakis's algorithm reaches prior CABG at step 2 and usually prefers femoral access, but says that if a radial is chosen it should be the left, for the LIMA; he also prefers radial access in anticoagulated patients. Oxford sends anticoagulated patients radial, keeps femoral access for emergencies, and catheterises CABG patients femorally or from the left radial when there is a LIMA. The left radial satisfies all of these. Femoral access is the algorithm's default but sits badly with an INR of 2.6 (Oxford regards it as generally safer only below 2.0); the right radial makes the LIMA difficult and risks its ostium.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-access-q2",
      stem: "Why does Brilakis insist on following the 0.018 inch micropuncture wire on fluoroscopy?",
      options: [
        "It is invisible on ultrasound, so fluoroscopy is the only way to confirm that it lies within the arterial lumen",
        "It is too short to reach the iliac artery, so its tip must be kept in the femoral artery",
        "Its stiff tip dissects the femoral artery unless it is rotated continuously as it advances",
        "It enters small branches more readily than a 0.035 inch wire, and a sheath then perforates them",
      ],
      answer: 3,
      explanation:
        "The micropuncture wire is more likely than a 0.035 inch wire to slip into branches such as the inferior epigastric or lateral circumflex iliac arteries, and a dilator or sheath following it can perforate them. Screening also confirms the entry point lies in the lower half of the femoral head.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q3",
      stem: "A femoral angiogram is about to be taken through a new left common femoral sheath. Which projection best opens out the bifurcation?",
      options: ["20–30° RAO", "20–30° LAO", "Straight AP", "40° LAO caudal"],
      answer: 1,
      explanation:
        "Brilakis uses the ipsilateral oblique: LAO 20–30° for a left groin sheath and RAO 20–30° for a right one, at low magnification so the iliac and bifurcation are seen. RAO is the view for the right groin only.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q4",
      stem: "Ultrasound places the common femoral artery 4 cm below the skin over the femoral head. With a 45° needle from your usual skin point you would meet the artery too high, above the planned point over the femoral head. What is Brilakis's preferred adjustment?",
      options: [
        "Steepen the needle to about 70° from the usual skin entry point",
        "Keep 45° and move the skin entry point cranially towards the ligament",
        "Keep about 45° and move the skin entry point caudally",
        "Puncture the skin crease vertically and angle the needle once in the fat",
      ],
      answer: 2,
      explanation:
        "In Brilakis's figure, a deeper artery is reached either by moving the skin entry further down the leg at the same angle (his preferred option) or by steepening the needle to about 70°. Moving the entry cranially would make the needle meet the artery higher, possibly above the femoral head, and a vertical crease puncture abandons the planned path.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q5",
      stem: "A puncture enters the artery below the femoral head. Which complications become more likely?",
      options: [
        "Pseudoaneurysm and arteriovenous fistula",
        "Retroperitoneal haemorrhage and inferior epigastric injury",
        "Iliac dissection and distal embolism",
        "Femoral nerve palsy and lymphocoele",
      ],
      answer: 0,
      explanation:
        "Low punctures, below the femoral head, raise the risk of pseudoaneurysm and arteriovenous fistula (the vein often lies behind the artery lower in the groin). High punctures, above the femoral head and the inferior epigastric origin, raise the risk of retroperitoneal bleeding.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-access-q6",
      stem: "On the radial side, 4 mL of lidocaine has flattened the artery on ultrasound. What does Brilakis recommend?",
      options: [
        "Puncture immediately through the bleb, where the artery is now held most firmly in place",
        "Inject nitroglycerin into the bleb, which reverses compression by volume",
        "Convert to the femoral artery, because the radial will now go into spasm",
        "Wait 1–2 minutes or puncture at a different point along the radial artery",
      ],
      answer: 3,
      explanation:
        "Large volumes compress the radial artery; Brilakis gives about 1 mL and, if too much was given, waits 1–2 minutes or chooses another point on the artery. Periarterial nitroglycerin mixed with lidocaine is his treatment for spasm, not for compression. A femoral switch is not needed for this.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q7",
      stem: "The micropuncture dilator will not pass in an obese patient because the 0.018 inch wire has kinked at the arterial entry, though plenty of wire lies within the iliac artery. What is the ‘Gordian knot’ solution Brilakis describes?",
      options: [
        "Tie the wire to a second wire and pull both through the artery from the opposite groin",
        "Cut away the kinked segment and pass a dilator over the remaining straight wire",
        "Replace the micropuncture dilator with a 7 Fr sheath and push it over the kink",
        "Withdraw everything and puncture through the knot of scar tissue with an 18 gauge needle",
      ],
      answer: 1,
      explanation:
        "When enough wire lies inside the artery, the kinked part can be cut off and a micropuncture dilator, or the distal segment of a sheath dilator, passed over the remaining wire. Other fixes are partial withdrawal of the wire and re-advancing the dilator, a stiffer micropuncture dilator, or exchanging to a long supportive 0.018 inch wire through the inner dilator. Forcing a larger sheath over a kink invites wire fracture or arterial injury.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q8",
      stem: "Using Oxford's high approach to the right internal jugular vein in a woman, where do you aim the needle after entering lateral to the carotid at 45°?",
      options: [
        "The right nipple, as in a man of the same height",
        "The suprasternal notch, as for the subclavian vein",
        "The right anterior superior iliac spine",
        "The left shoulder, crossing in front of the trachea",
      ],
      answer: 2,
      explanation:
        "Oxford aims at the ipsilateral nipple in men and the anterior superior iliac spine in women, entering lateral to the carotid at 45°; a missed first pass is redirected slightly medially. The suprasternal notch is the target for the subclavian vein, approached from under the clavicle.",
      difficulty: 2,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "pm-access-q9",
      stem: "Which practice does Brilakis list to prevent a femoral arteriovenous fistula after a combined right and left heart study?",
      options: [
        "Removing the arterial sheath first and the venous sheath a few minutes later",
        "Puncturing the vein and artery at the same level so a single compression covers both",
        "Removing both sheaths together so the groin is compressed only once",
        "Leaving the venous sheath in place overnight to tamponade the arterial track",
      ],
      answer: 0,
      explanation:
        "Arteriovenous fistula follows low punctures, multiple arterial punctures and arterial and venous access in the same procedure, especially at the same level. Ultrasound-guided puncture prevents it, and the sheaths are removed in sequence, arterial first, venous a few minutes later, rather than together.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q10",
      stem: "For protected PCI with a 14 Fr microaxial pump, which sequence follows Brilakis's steps?",
      options: [
        "14 Fr sheath first, then heparin to an ACT above 250 s, then two suture devices through the valve, then the femoral angiogram",
        "Heparin to an ACT above 250 s, then a 5–6 Fr sheath, one suture device tied at once, the 14 Fr sheath and an angiogram",
        "5–6 Fr sheath, 8/10/12 Fr dilators and the 14 Fr sheath, then two suture devices placed through the sheath valve at the end",
        "5–6 Fr sheath and angiogram, two suture devices left untied, 8/10/12 Fr dilators, 14 Fr sheath, heparin to ACT >250 s",
      ],
      answer: 3,
      explanation:
        "Brilakis takes a femoral angiogram through a 5–6 Fr sheath, pre-closes with two suture devices at 10 and 2 o'clock left untied, dilates with 8, 10 and 12 Fr dilators over a stiff wire, places the 14 Fr peel-away sheath (with a limb angiogram), then anticoagulates to an ACT above 250 seconds before removing the sheath's dilator. Sutures cannot be placed once the 14 Fr sheath is in, and they are tightened only at the end.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-access-q11",
      stem: "What did the DISCO RADIAL trial (2022) find when distal radial access was compared with conventional radial access using best haemostasis practice?",
      options: [
        "Fewer forearm occlusions with distal access, with equal rates of crossover to another access site and of radial spasm",
        "Similar low forearm occlusion, more crossover and spasm, and shorter haemostasis with distal access",
        "More forearm occlusion with distal access, offset by fewer crossovers and less spasm",
        "Equal crossover and spasm, but longer haemostasis because the distal artery is smaller",
      ],
      answer: 1,
      explanation:
        "In 1307 patients, forearm radial occlusion did not differ (0.31% against 0.91%), crossover was higher with distal access (7.4% against 3.5%), spasm more frequent (5.4% against 2.7%) and haemostasis shorter (median 153 against 180 minutes). The manual's 2020 table, written earlier, listed no difference in crossover and a possible occlusion benefit. Later trials differ on occlusion (TENDERA and a 2026 meta-analysis found less with distal access, RAPID found no difference), but all found more crossover.",
      difficulty: 3,
      refs: ["aminian-disco-radial-2022", "babunashvili-tendera-2024", "stiermaier-rapid-2025", "singh-distal-radial-meta-2026", "brilakis-manual-pci"],
    },
    {
      id: "pm-access-q12",
      stem: "Which finding on ultrasound or with the needle tells you that you have entered the femoral vein rather than the artery, and what do you do?",
      options: [
        "Bright pulsatile flow; advance the 0.018 inch wire as planned",
        "No blood return; advance the needle further through the back wall",
        "Dark non-pulsatile blood; withdraw partly and redirect laterally",
        "Dark pulsatile blood; redirect the needle medially towards the vein",
      ],
      answer: 2,
      explanation:
        "Dark, non-pulsatile return means the needle is in the vein, which lies medial to the artery: withdraw partly and redirect laterally. No blood return means the tip is outside the artery or in its wall, or the needle is plugged: reposition or flush. On ultrasound the artery is lateral and does not collapse with pressure.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Run a femoral case from the route decision to the femoral angiogram: mark the femoral head, scan for the bifurcation, puncture with a micropuncture needle, screen the wire, insert the sheath, flush with two syringes and image in the ipsilateral oblique." },
    { sim: "procedure", task: "Run a radial case with spasm prevention: sedation, ultrasound at low depth, about 1 mL of local anaesthetic, a single-pass puncture, a thin-walled sheath, a vasodilator and a secured sheath." },
    { sim: "impella", task: "Practise large-bore femoral access for a microaxial pump with the double-suture pre-close, sequential dilatation, a limb angiogram and suture tightening at the end." },
    { sim: "pacing", task: "Begin a temporary pacing case with a femoral venous puncture and a sheath larger than the pacing lead." },
  ],
  caseIds: ["pm-access-case-groin", "pm-access-case-wrist"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-access-case-groin",
    title: "A groin for a calcified CTO",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 4.1, 4.2 and 29.1; Oxford Handbook, chapter 3 (femoral artery access)",
    },
    summary: "Planning and obtaining femoral access for a complex CTO PCI: the route, the femoral head, the bifurcation, a venous puncture, a wandering micropuncture wire, a kinked wire and the femoral angiogram.",
    presentation:
      "A 61-year-old man with lifestyle-limiting angina despite medication is booked for PCI of a heavily calcified, tortuous right coronary CTO, with retrograde options. He is 1.78 m and 98 kg. He takes no anticoagulant, his haemoglobin and platelets are normal, and he has never had CABG.",
    findings: [
      "Blood pressure 142/84 mmHg, sinus rhythm 68/min",
      "Good femoral and radial pulses on both sides",
      "CT from his diagnostic work-up: no significant iliac disease; the right common femoral artery divides at the level of the middle of the femoral head",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How do you plan his access?",
        options: [
          {
            text: "Right femoral 8 Fr, ideally 45 cm, for the RCA guide, with a second access for the contralateral injection",
            best: true,
            feedback:
              "Complex PCI (CTO, severe calcium and tortuosity) is step 4 of Brilakis's algorithm: at least one femoral access, often 7 or 8 Fr and ideally 45 cm long, for support. A CTO also needs dual injection, so a second access is planned.",
          },
          {
            text: "Bilateral 6 Fr radial access, upsizing later if support proves inadequate",
            acceptable: true,
            feedback:
              "Radial and biradial CTO PCI is increasingly used (Brilakis 21.4), and he has good radial pulses. But the algorithm prefers at least one femoral access for this degree of complexity, so this is reasonable rather than best.",
          },
          {
            text: "A single 6 Fr right femoral sheath, using it for both the guide and the contralateral injections in turn",
            feedback: "One sheath cannot give simultaneous dual injection, which a CTO needs, and 6 Fr gives less support than the algorithm suggests.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "You place a haemostat over the right femoral pulse and take an AP image. Its tip projects 3 cm above the lower edge of the femoral head. What do you do?",
        options: [
          {
            text: "Move the haemostat down to the lower edge of the femoral head and mark that line on the skin",
            best: true,
            feedback: "The fluoroscopy step marks the inferior border of the femoral head; ultrasound then chooses the exact point above it.",
          },
          {
            text: "Puncture directly under the haemostat tip, which is clearly over the femoral head",
            next: "c-high",
            feedback: "Without ultrasound and a marked lower border, a puncture planned this high risks entering above the femoral head.",
            stateDelta: { stability: -15, flags: ["high-stick"] },
          },
          {
            text: "Abandon fluoroscopy and puncture 1 cm below the groin crease",
            feedback: "The crease is not the landmark either manual uses, and in heavier patients it may lie below the target.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-high",
        kind: "consequence",
        prompt: "The 0.018 inch wire is in. On screening, its entry point lies above the top of the femoral head. What now?",
        options: [
          {
            text: "Remove the wire and needle, press for 1–2 minutes, and puncture again under ultrasound over the femoral head",
            best: true,
            feedback: "A high stick raises the risk of retroperitoneal bleeding. The micropuncture needle allows a redo without significant bleeding, which is one of its main advantages.",
          },
          {
            text: "Continue: the arteriotomy is small and a closure device will seal it",
            feedback: "Brilakis advises removing the needle and starting again after a high stick; retroperitoneal bleeding can be hard to diagnose and is not excluded by a closure device, and a plug-based closure device should be avoided when the stick is high.",
            stateDelta: { stability: -20, flags: ["retroperitoneal-risk"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Ultrasound over your mark shows the common femoral artery dividing over the middle of the femoral head, with a calcified plaque on the front wall just above the bifurcation and a clean segment 1 cm higher, still over the femoral head. Where do you puncture?",
        options: [
          {
            text: "The clean segment above the bifurcation and the calcified plaque, still over the femoral head",
            best: true,
            feedback: "Puncture above the bifurcation, over the femoral head, away from calcium and disease.",
          },
          {
            text: "Just below the bifurcation, in the superficial femoral artery, where there is no calcium",
            next: "c-low",
            feedback: "Below the bifurcation is a low puncture: pseudoaneurysm and arteriovenous fistula become more likely, and the artery is smaller.",
            stateDelta: { stability: -15, flags: ["low-stick"] },
          },
          {
            text: "Through the plaque, since it lies at the ideal height",
            feedback: "Brilakis selects a segment away from calcification; puncturing through it risks failure, dissection and an unclosable arteriotomy.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-low",
        kind: "consequence",
        prompt: "The micropuncture wire runs well, but screening shows the entry point below the femoral head. What do you do?",
        options: [
          {
            text: "Remove the wire and needle, hold pressure, and re-puncture above the bifurcation",
            best: true,
            feedback: "Brilakis says it may be preferable to start again after a low stick; a large sheath below the bifurcation would also rule out a closure device, which needs access above it (11.1.3).",
          },
          {
            text: "Insert the 8 Fr 45 cm sheath, because the wire course is good",
            feedback: "An 8 Fr sheath below the bifurcation fills more of a smaller artery, raises the risk of pseudoaneurysm and fistula, and rules out a closure device at the end.",
            stateDelta: { stability: -15, flags: ["low-stick-sheath"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "As the needle advances, dark blood flows steadily from the hub without pulsation. What next?",
        options: [
          {
            text: "Withdraw the needle partly and redirect it laterally under ultrasound",
            best: true,
            feedback: "Dark, non-pulsatile blood means the femoral vein, which lies medial to the artery.",
          },
          {
            text: "Pass the 0.018 inch wire anyway and decide once the sheath is in",
            feedback: "A wire and sheath in the vein waste the puncture, and if the needle crossed the artery on its way, a sheath along that track can create an arteriovenous fistula.",
            stateDelta: { stability: -10, flags: ["venous-puncture"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The needle is now in the artery with pulsatile flow. The 0.018 inch wire passes, but screening shows its tip curling medially and upwards in a small vessel.",
        options: [
          {
            text: "Withdraw the wire and redirect it under fluoroscopy into the external iliac artery",
            best: true,
            feedback: "A medial course is the inferior epigastric artery. Reposition the wire; never advance a dilator or sheath into a small branch.",
          },
          {
            text: "Advance the micropuncture dilator: it will pull the wire into the main artery",
            next: "c-perf",
            feedback: "Advancing a dilator over a wire in a small branch can perforate it.",
            stateDelta: { stability: -25, flags: ["branch-perforation"] },
          },
        ],
      },
      {
        id: "c-perf",
        kind: "consequence",
        prompt: "After the wire is redirected and the sheath placed, the femoral angiogram shows contrast leaking from the inferior epigastric artery and a growing groin swelling. The PCI is elective. What do you do?",
        options: [
          {
            text: "Embolise the bleeding branch with coils or thrombin, give no heparin, and postpone the CTO PCI",
            best: true,
            feedback: "Brilakis treats branch bleeding with coils or thrombin, and in non-urgent cases withholds anticoagulation and does not proceed with PCI.",
          },
          {
            text: "Give heparin and proceed with the PCI, since the bleeding will tamponade under the drape",
            feedback: "Anticoagulation will keep a perforated branch bleeding; this can become a retroperitoneal or large thigh haematoma.",
            stateDelta: { stability: -20, flags: ["bleeding"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The micropuncture dilator will not pass. Screening shows the 0.018 inch wire bent sharply at the arterial entry, with most of the wire still high in the iliac artery.",
        options: [
          {
            text: "Pull the wire back slightly and re-advance the dilator, using a new one if its tip has flared",
            best: true,
            feedback: "First-line for a kinked wire. If that fails, cut off the kinked segment and pass a dilator over the rest, or exchange to a long supportive 0.018 inch wire through the inner dilator.",
          },
          {
            text: "Exchange through the inner dilator for a long supportive 0.018 inch wire",
            acceptable: true,
            feedback: "Also on Brilakis's list, and good if the inner dilator can be advanced into the artery.",
          },
          {
            text: "Push and rotate the dilator firmly until it gives",
            feedback: "Force over a kinked wire can fracture the wire or injure the artery, and the dilator may kink in the fat.",
            stateDelta: { stability: -15, flags: ["forced-dilator"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The 8 Fr 45 cm sheath is in. Your assistant offers one syringe for both aspirating and flushing.",
        options: [
          {
            text: "Aspirate 3–4 mL with one syringe and discard it, then flush with a second syringe of heparinised saline",
            best: true,
            feedback: "Separate syringes mean anything aspirated is never re-injected into the artery.",
          },
          {
            text: "Use the single syringe; it saves time and the blood is diluted anyway",
            feedback: "Brilakis lists separate syringes as a prevention of embolism from the sheath.",
            stateDelta: { stability: -10, flags: ["embolism-risk"] },
          },
        ],
      },
      {
        id: "s8",
        prompt: "Before the guide goes in, you take the femoral angiogram.",
        options: [
          {
            text: "Wire through the sheath into the aorta, check the waveform, 20–30° RAO at low magnification, 5–10 mL, sheath pulled gently medially",
            best: true,
            feedback: "The ipsilateral oblique opens out the right common femoral bifurcation and shows the puncture height, branches, disease and closure suitability.",
          },
          {
            text: "20–30° LAO at high magnification on the sheath tip, injecting forcefully to fill the profunda",
            feedback: "LAO is the view for the left groin, high magnification hides the iliac artery, and forceful injection can dissect.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The angiogram shows the 8 Fr sheath entering the common femoral artery over the femoral head, above the bifurcation, with good flow down the leg and no injury. The CTO PCI proceeds with a well-supported guide.",
    outcomeVariants: [
      { flag: "high-stick", text: "The first puncture was planned too high and had to be repeated." },
      { flag: "retroperitoneal-risk", text: "Continuing through a high arteriotomy left a risk of retroperitoneal bleeding that needed close monitoring after the case." },
      { flag: "low-stick", text: "A puncture below the bifurcation was recognised on screening." },
      { flag: "low-stick-sheath", text: "An 8 Fr sheath in the superficial femoral artery made a closure device unsuitable and raised the risk of pseudoaneurysm and fistula." },
      { flag: "venous-puncture", text: "A wire passed through a venous puncture caused confusion and an additional hole in the groin." },
      { flag: "branch-perforation", text: "Advancing the dilator into the inferior epigastric artery perforated it." },
      { flag: "bleeding", text: "Heparin given over a perforated branch led to a large groin haematoma and the PCI was abandoned." },
      { flag: "forced-dilator", text: "Forcing the dilator over a kinked wire bent the wire beyond use and the artery had to be punctured again." },
      { flag: "embolism-risk", text: "Re-injecting aspirated blood from the sheath risked sending thrombus down the leg." },
    ],
    learningPoints: [
      "Complex PCI: at least one femoral access, often 7 or 8 Fr and ideally 45 cm long.",
      "Mark the lower edge of the femoral head on fluoroscopy; let ultrasound choose a healthy segment above the bifurcation.",
      "Dark, steady blood is venous: redirect laterally.",
      "Screen the micropuncture wire; a medial course means the inferior epigastric artery.",
      "A kinked wire at the entry: pull back and re-advance, cut the kinked part, or exchange through the inner dilator; never force.",
      "Aspirate and flush with separate syringes; take the femoral angiogram in the ipsilateral oblique.",
      "Branch bleeding in an elective case: coils or thrombin, no heparin, postpone the PCI.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-access-case-wrist",
    title: "Grafts, apixaban and a stiff shoulder",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 4.1, 4.3, 5.3 and 29.2; Oxford Handbook, chapter 3 (which arterial access route to use, radial artery access, anticoagulation issues)",
    },
    summary: "Choosing and obtaining wrist access in an anticoagulated woman with bypass grafts who cannot turn her left palm up, and crossing to the groin when the catheter cannot reach.",
    presentation:
      "A 74-year-old woman, 1.68 m and 64 kg, presents with an NSTEMI. She had CABG nine years ago (LIMA to LAD, vein grafts to the obtuse marginal and the RCA) and takes apixaban for atrial fibrillation; her last dose was 10 hours ago. Severe arthritis of the left shoulder stops her turning the left palm upwards.",
    findings: [
      "Blood pressure 128/72 mmHg, atrial fibrillation 84/min",
      "Haemoglobin 118 g/L, platelets 210 × 10⁹/L, eGFR 52 mL/min/1.73 m²",
      "Palpable radial and femoral pulses on both sides",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which route do you choose?",
        options: [
          {
            text: "Left wrist access, because both books accept it with a LIMA and it suits an anticoagulated patient",
            best: true,
            feedback:
              "Brilakis's algorithm usually prefers femoral access after CABG but says a radial should be the left, for the LIMA, and prefers radial access in anticoagulated patients. Oxford catheterises CABG patients femorally or from the left radial when there is a LIMA, and sends anticoagulated patients radial.",
          },
          {
            text: "Right femoral with ultrasound and fluoroscopic guidance",
            acceptable: true,
            feedback: "This is the default of Brilakis's algorithm after CABG, and grafts are easier from the groin; but she is anticoagulated, and both books favour the wrist for that.",
          },
          {
            text: "Right radial, because it is the lab's standard route",
            feedback: "Oxford warns that the LIMA is difficult to engage from the right radial and its ostium can be injured, and vein grafts are awkward from the right.",
            stateDelta: { stability: -10, flags: ["right-radial-lima"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "She cannot supinate the left arm. How do you set up the left wrist?",
        options: [
          {
            text: "Distal left radial in the snuffbox: thumb tucked under the fingers, hand slightly abducted, puncture at 30–45° from lateral to medial under ultrasound",
            best: true,
            feedback: "Oxford lists easier access with limited supination as a benefit of the snuffbox approach; after the sheath the hand can rest in a comfortable neutral position.",
          },
          {
            text: "Proximal left radial with a long sheath partly inserted, so the hand need not be turned",
            acceptable: true,
            feedback: "Brilakis's option to avoid supination; it still needs the forearm accessible above the styloid.",
          },
          {
            text: "Strap the arm into supination on a board for the proximal radial",
            feedback: "Forcing an arthritic shoulder is painful and unnecessary when there are other options.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Ultrasound shows a distal radial artery of modest size. How much local anaesthetic do you give?",
        options: [
          {
            text: "About 1 mL through a fine needle after aspirating, watching it on ultrasound",
            best: true,
            feedback: "Brilakis gives about 1 mL; larger volumes compress the artery.",
          },
          {
            text: "5 mL to make sure she feels nothing",
            next: "c-lido",
            feedback: "A large volume compresses a small artery and hides it.",
            stateDelta: { stability: -5, flags: ["lidocaine-volume"] },
          },
        ],
      },
      {
        id: "c-lido",
        kind: "consequence",
        prompt: "The artery has flattened on ultrasound and the pulse has gone.",
        options: [
          {
            text: "Wait 1–2 minutes or move to another point along the artery",
            best: true,
            feedback: "Brilakis's solution to compression by local anaesthetic.",
          },
          {
            text: "Puncture blindly where the pulse was",
            feedback: "Blind passes in a small artery invite spasm and haematoma.",
            stateDelta: { stability: -10, flags: ["spasm"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The first two passes miss. Ultrasound now shows the artery narrowing in spasm.",
        options: [
          {
            text: "Give sublingual nitroglycerin and more sedation, then try once more under ultrasound, ready to switch artery",
            best: true,
            feedback: "Brilakis treats spasm at the puncture with vasodilators and more sedation, and switches to the ipsilateral ulnar, the other radial or the femoral artery if it persists.",
          },
          {
            text: "Keep making passes until the artery is entered",
            next: "c-spasm",
            feedback: "Repeated passes are a risk factor for spasm and make it worse.",
            stateDelta: { stability: -10, flags: ["spasm"] },
          },
        ],
      },
      {
        id: "c-spasm",
        kind: "consequence",
        prompt: "After five more passes the artery is barely visible and a small haematoma has formed in the snuffbox.",
        options: [
          {
            text: "Stop, press, give nitroglycerin and more sedation; if the artery has not recovered on ultrasound, change artery (the left ulnar keeps you on the LIMA side) rather than pass again",
            best: true,
            feedback: "Vasodilators and sedation treat spasm, and several needle passes are themselves a cause of it. If the artery does not recover, Brilakis moves to the ipsilateral ulnar, the other radial or the femoral artery rather than continuing to stab; here the left ulnar keeps the left arm for the LIMA.",
          },
          {
            text: "Stop, press, and change straight to the left ulnar artery under ultrasound, keeping the left arm for the LIMA",
            acceptable: true,
            stateDelta: { flags: ["ulnar-switch"] },
            feedback: "The ipsilateral ulnar is one of Brilakis's alternatives when the radial fails, and it keeps you on the left for the LIMA. It is deeper and close to the ulnar nerve, so ultrasound matters; giving the radial a chance to recover first is also reasonable.",
          },
          {
            text: "Try the left proximal radial above the haematoma at once",
            feedback: "The same artery is in spasm, and supination is impossible for her.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Whichever left wrist artery you end up in, the 0.018 inch wire passes and you are choosing a sheath.",
        options: [
          {
            text: "The smallest thin-walled sheath that will do, wetted in saline; then aspirate 3–4 mL and give a vasodilator",
            best: true,
            feedback: "Thin-walled, low-profile sheaths are less likely to provoke spasm; aspiration and a vasodilator follow.",
          },
          {
            text: "A standard 7 Fr sheath now in case PCI needs a large guide",
            feedback: "A large sheath in a modest wrist artery invites spasm and occlusion, and the smaller distal radial in particular limits the sheath size you can use.",
            stateDelta: { stability: -10, flags: ["large-sheath"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The LIMA and the obtuse marginal graft are patent. The culprit is a vein graft lesion to the RCA, but even with a long guide the catheter cannot be made to reach and seat at the graft ostium from the left wrist. Heparin has been given.",
        options: [
          {
            text: "Change to the right femoral artery with ultrasound, fluoroscopy and a micropuncture needle, taking great care",
            best: true,
            feedback: "Step 5: if the first site fails, change site. Brilakis warns that radial-to-femoral crossover in an anticoagulated patient bleeds more and must be done meticulously.",
          },
          {
            text: "Try the right radial for the RCA vein graft before crossing to the groin",
            acceptable: true,
            feedback: "This keeps her on the wrist despite anticoagulation. Oxford calls vein grafts awkward from the right radial, not impossible, and a femoral crossover stays available if it fails, though a second arterial puncture in a heparinised patient on apixaban still needs ultrasound guidance.",
          },
          {
            text: "Quick palpation-guided femoral puncture to save time",
            next: "c-groin",
            feedback: "Crossover after heparin, on apixaban, with a palpation-only puncture is exactly the setting in which femoral bleeding rises.",
            stateDelta: { stability: -15, flags: ["crossover-bleed"] },
          },
        ],
      },
      {
        id: "c-groin",
        kind: "consequence",
        prompt: "The femoral sheath is in, but a firm swelling grows around it.",
        options: [
          {
            text: "Take a femoral angiogram through the sheath to look for perforation or a high or low puncture, and upsize the sheath if the ooze is around it",
            best: true,
            feedback: "Brilakis upsizes the sheath for bleeding around it and uses the angiogram to define injuries that need embolisation, a covered stent or surgery.",
          },
          {
            text: "Ignore it until the end of the case",
            feedback: "A growing haematoma in an anticoagulated patient will not wait.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "The vein graft is treated from the right femoral artery after a meticulous ultrasound-guided crossover. The left wrist puncture site is dry, and the pulse of the artery used is present at discharge.",
    outcomeVariants: [
      { flag: "right-radial-lima", text: "The right radial route made the LIMA hard to engage and prolonged the study." },
      { flag: "lidocaine-volume", text: "Too much local anaesthetic hid the artery and cost time." },
      { flag: "spasm", text: "Repeated passes provoked spasm and a small snuffbox haematoma." },
      { flag: "large-sheath", text: "A large sheath in a small wrist artery caused spasm and pain." },
      { flag: "ulnar-switch", text: "After the distal radial failed, the case ran from the left ulnar artery, which kept the left arm for the LIMA." },
      { flag: "crossover-bleed", text: "A hurried femoral crossover in an anticoagulated patient caused a groin haematoma." },
    ],
    learningPoints: [
      "After CABG with a LIMA, the wrist route is the left; femoral is Brilakis's algorithm default, radial both books' preference with anticoagulation.",
      "Distal radial access helps when the arm cannot supinate: thumb tucked, 30–45° from lateral to medial.",
      "About 1 mL of local anaesthetic at the wrist; too much: wait 1–2 minutes or move.",
      "Spasm at the puncture: vasodilator and sedation, then change artery rather than stabbing.",
      "The smallest thin-walled sheath, wetted; aspirate, then a vasodilator.",
      "A failed first site is a reason to change site, and a crossover after heparin demands meticulous femoral technique.",
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "access-site-five-steps",
    lab: "access",
    when: { phase: ["plan"] },
    title: "Choose the route in five steps",
    text: "First strike out sites that cannot be used. Then: prior CABG favours femoral (or the left radial); STEMI, an anticoagulant or high bleeding risk favours radial; complex PCI favours at least one femoral access. Decide now where you will go if the first site fails.",
    tone: "do",
    lessonId: "pm-access-site-choice",
    sources: [{ book: "brilakis-pci", loc: "4.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-cabg-left-radial",
    lab: "access",
    when: { phase: ["plan"] },
    alsoIn: [{ lab: "diagnostic", phase: ["setup"] }],
    title: "Grafts with a LIMA: the left wrist or the groin",
    text: "With patent grafts, Brilakis usually goes femoral; if you use the wrist, use the left for the LIMA. Both internal mammary arteries grafted: femoral is strongly favoured. Oxford adds that a RIMA may only be engaged selectively from the right radial.",
    tone: "caution",
    lessonId: "pm-access-site-choice",
    sources: [
      { book: "brilakis-pci", loc: "4.1" },
      { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-complex-pci-femoral",
    lab: "access",
    when: { phase: ["plan"] },
    title: "Complex PCI: plan a femoral sheath for support",
    text: "For a CTO, severe calcium and tortuosity, or a difficult bifurcation, plan at least one femoral access, often 7 or 8 Fr and ideally 45 cm long. Longer sheaths also help with iliac tortuosity, iliac stents and obesity.",
    tone: "do",
    lessonId: "pm-access-site-choice",
    sources: [
      { book: "brilakis-pci", loc: "4.1" },
      { book: "brilakis-pci", loc: "4.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-needle-flashback-check",
    lab: "access",
    when: { phase: ["puncture"] },
    title: "Read the blood at the hub",
    text: "Pulsatile flow means artery (less brisk through a 21 gauge needle). At the groin, dark, steady blood means the femoral vein: pull back and redirect laterally. No blood: the tip is outside the artery or in its wall, or the needle is plugged; reposition, or remove and flush it.",
    tone: "do",
    lessonId: "pm-access-seldinger",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "brilakis-pci", loc: "4.3" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-wire-never-push",
    lab: "access",
    when: { phase: ["wire"] },
    title: "A wire that stops is in the wrong place",
    text: "Never push an access wire against resistance. Screen it, find where it is, and reposition the needle or redirect the wire. Never pass a polymer-jacketed wire through a needle: its coating can shear off.",
    tone: "caution",
    lessonId: "pm-access-seldinger",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "brilakis-pci", loc: "5.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-sheath-two-syringes",
    lab: "access",
    when: { phase: ["sheath"] },
    title: "Aspirate with one syringe, flush with another",
    text: "Draw 3–4 mL from the side arm and discard it, then flush with a separate syringe of heparinised saline so that nothing aspirated goes back into the artery. At the groin, check for an undamped arterial waveform before injecting.",
    tone: "do",
    lessonId: "pm-access-seldinger",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "brilakis-pci", loc: "4.3" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-head-marker",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Mark the lower edge of the femoral head",
    text: "Lay a haemostat over the pulse, take an AP image and move it until its tip sits on the inferior border of the femoral head; mark the skin there. In obese patients push the tissue up from the crease, and keep your hands out of the beam.",
    tone: "do",
    lessonId: "pm-access-femoral-puncture",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-scan-bifurcation",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Scan for the bifurcation before you puncture",
    text: "Scan the common femoral artery up and down from your mark: puncture above the bifurcation, clear of calcium, disease, grafts and recent closure devices. The artery is lateral to the vein and does not collapse when pressed.",
    tone: "do",
    lessonId: "pm-access-femoral-puncture",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-deep-move-caudal",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Deep artery: move the skin entry down",
    text: "For a deeper common femoral artery, keep the needle at about 45° and move the skin entry point further down the leg (Brilakis's preferred option) rather than steepening to about 70°. Needle bevel up, probe square to the skin.",
    tone: "do",
    lessonId: "pm-access-femoral-puncture",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-femoral-vein-redirect",
    lab: "access",
    when: { phase: ["femoral"], route: ["femoral"], event: ["venous-flashback"] },
    title: "Femoral vein entered: redirect laterally",
    text: "Dark, non-pulsatile blood from the needle means the femoral vein. Withdraw partly and redirect laterally under ultrasound; do not pass a sheath through the artery into the vein.",
    tone: "bailout",
    lessonId: "pm-access-femoral-puncture",
    sources: [
      { book: "brilakis-pci", loc: "4.2" },
      { book: "brilakis-pci", loc: "29.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-screen-micro-wire",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Screen the micropuncture wire",
    text: "Check that the 0.018 inch wire entered in the lower half of the femoral head and runs up the iliac artery. Medially it is in the inferior epigastric, laterally in the lateral circumflex iliac, downwards in the leg: redirect under fluoroscopy before any dilator goes in.",
    tone: "do",
    lessonId: "pm-access-femoral-sheath",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-repuncture-wrong-height",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Wrong height: take it out and start again",
    text: "If the wire does not enter over the lower half of the femoral head (too high or too low), remove the wire and micropuncture needle, press for 1–2 minutes, and puncture again under ultrasound. High sticks risk retroperitoneal bleeding; low sticks pseudoaneurysm and fistula.",
    tone: "bailout",
    lessonId: "pm-access-femoral-sheath",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-femoral-sheath-angiogram",
    lab: "access",
    when: { phase: ["femoral"] },
    title: "Femoral angiogram in the ipsilateral oblique",
    text: "With a wire in the aorta and an undamped waveform, image at low magnification in 20–30° RAO for the right groin or 20–30° LAO for the left, injecting about 5–10 mL while pulling the sheath gently medially. Look for perforation, dissection, flow, disease and the puncture height.",
    tone: "do",
    lessonId: "pm-access-femoral-sheath",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-one-ml-local",
    lab: "access",
    when: { phase: ["radial"] },
    title: "About 1 mL at the wrist",
    text: "Aspirate, then give about 1 mL of local anaesthetic (Oxford: 1–2 mL of 1% lidocaine) under ultrasound. A larger volume flattens the artery: wait 1–2 minutes or move along it. Never inject lidocaine into the artery.",
    tone: "do",
    lessonId: "pm-access-radial-puncture",
    sources: [
      { book: "brilakis-pci", loc: "4.3" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-radial-puncture-spasm",
    lab: "access",
    when: { phase: ["radial"], event: ["radial-spasm"] },
    title: "Spasm at the puncture: drugs, sedation or another artery",
    text: "Stop stabbing. Give nitroglycerin (under the tongue, under the skin, or around the artery mixed 1:1 with 1% lidocaine) and more sedation; once the sheath is in, verapamil or nitroglycerin can go into the artery. If spasm persists, move to the ipsilateral ulnar, the other radial or the femoral artery.",
    tone: "bailout",
    lessonId: "pm-access-radial-puncture",
    sources: [{ book: "brilakis-pci", loc: "4.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-wire-resists",
    lab: "access",
    when: { phase: ["radial"] },
    title: "Radial wire resists: never push",
    text: "Restore good backflow, extend the wrist, change the needle angle, or turn the bevel towards the lumen. If it stops higher in the forearm, screen it and image the artery through a catheter brought up to just below the wire tip.",
    tone: "caution",
    lessonId: "pm-access-radial-sheath",
    sources: [{ book: "brilakis-pci", loc: "4.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-thin-sheath-vasodilator",
    lab: "access",
    when: { phase: ["radial"] },
    title: "Small, thin-walled sheath, then a vasodilator",
    text: "Choose the smallest thin-walled sheath that suits the artery and the plan, wet it, and usually avoid long radial sheaths. After aspirating 3–4 mL, give a vasodilator, for example nitroglycerin 100–200 mcg or verapamil 2–3 mg (typical doses; follow local protocol), then secure the sheath. Leave out nitroglycerin if the patient is hypotensive.",
    tone: "do",
    lessonId: "pm-access-radial-sheath",
    sources: [
      { book: "brilakis-pci", loc: "4.3" },
      { book: "brilakis-pci", loc: "3.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-distal-radial-angle",
    lab: "access",
    when: { phase: ["radial"] },
    title: "Distal radial: thumb tucked, lateral to medial",
    text: "Have the patient tuck the thumb under the fingers with the hand slightly abducted. Puncture at 30–45° from lateral to medial, aiming at the strongest pulse in the proximal snuffbox. Expect a smaller artery. If the root is far away a longer catheter may reach it, but balloon and stent shafts may then be too short for PCI.",
    tone: "do",
    lessonId: "pm-access-alternative",
    sources: [
      { book: "brilakis-pci", loc: "4.3" },
      { book: "brilakis-pci", loc: "5.3" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-artery-vein-same-groin",
    lab: "access",
    when: { phase: ["femoral", "closure"], route: ["femoral"] },
    title: "Artery and vein in one groin",
    text: "Use ultrasound and avoid puncturing the artery and vein at the same level. At the end, remove the arterial sheath first and the venous sheath a few minutes later, not together, to avoid an arteriovenous fistula.",
    tone: "caution",
    lessonId: "pm-access-venous",
    sources: [
      { book: "brilakis-pci", loc: "29.1" },
      { book: "brilakis-pci", loc: "4.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-central-vein-no-blood",
    lab: "access",
    when: { phase: ["puncture"], route: ["jugular", "subclavian"], event: ["no-flashback"] },
    title: "No venous blood in the neck",
    text: "At a jugular or subclavian puncture, withdraw the needle slowly while aspirating, because it may have passed through the vein. If there is still nothing, flush the needle, tilt the patient 10–30° head down and give intravenous fluid if the patient is volume depleted.",
    tone: "bailout",
    lessonId: "pm-access-venous",
    sources: [{ book: "oxford-cath", loc: "ch 3: Internal jugular vein access" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "access-dilator-will-not-pass",
    lab: "access",
    when: { phase: ["sheath"] },
    title: "Dilator or sheath will not pass",
    text: "Make or enlarge the skin nick and spread the track with a haemostat. Screen for a kinked wire: pull it back and re-advance, cut off the kinked part if enough wire is inside, or exchange to a stiffer wire through a dilator. A smaller sheath, or the dilator alone first, may also help.",
    tone: "bailout",
    lessonId: "pm-access-troubleshoot",
    sources: [{ book: "brilakis-pci", loc: "4.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-no-waveform-sheath",
    lab: "access",
    when: { phase: ["sheath", "femoral", "radial"], event: ["pressure-damped"] },
    title: "No waveform from a new sheath",
    text: "Transduce the side arm. An absent arterial waveform suggests a subintimal sheath, or at the wrist severe spasm. With a subintimal sheath, change the access site rather than injecting through it.",
    tone: "caution",
    lessonId: "pm-access-troubleshoot",
    sources: [{ book: "brilakis-pci", loc: "5.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "mcs-largebore-angiogram-first",
    lab: "mcs",
    when: { phase: ["select", "insert"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Small sheath and angiogram before going large",
    text: "Obtain femoral access with ultrasound and fluoroscopy, place a 5–6 Fr sheath and take a femoral angiogram. A 14 Fr pump sheath needs iliofemoral arteries over 5 mm without severe calcium, tortuosity or obstruction.",
    tone: "do",
    lessonId: "pm-access-large-bore",
    sources: [
      { book: "brilakis-pci", loc: "14.1" },
      { book: "brilakis-pci", loc: "14.4" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "mcs-preclose-two-sutures",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Pre-close with two sutures before you dilate",
    text: "Deploy two suture devices, at 10 and 2 o'clock, through the small arteriotomy and leave them untied, wrapped in gauze or threaded into insulin syringes. Reinsert the wire between devices, then dilate 8, 10 and 12 Fr before the large sheath.",
    tone: "do",
    lessonId: "pm-access-large-bore",
    sources: [
      { book: "brilakis-pci", loc: "14.4" },
      { book: "brilakis-pci", loc: "11.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "mcs-largebore-limb-angiogram",
    lab: "mcs",
    when: { phase: ["insert"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Angiogram for the leg once the big sheath is in",
    text: "As soon as the large sheath is in, take a femoral angiogram to check flow down the leg. For VA-ECMO, plan the antegrade perfusion sheath, ideally before the arterial cannula goes in.",
    tone: "do",
    lessonId: "pm-access-large-bore",
    sources: [
      { book: "brilakis-pci", loc: "14.4" },
      { book: "brilakis-pci", loc: "14.5" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "mcs-largebore-limb-check",
    lab: "mcs",
    when: { phase: ["insert", "manage"], event: ["limb-ischaemia"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Leg ischaemic behind a large sheath",
    text: "Look for pallor, coldness, weak pulses, pain and loss of movement or sensation, and image the leg. For VA-ECMO, place an antegrade perfusion sheath when NIRS is below 50% or more than 15% lower than the other leg; after suture closure, an over-tight knot can be the cause.",
    tone: "bailout",
    lessonId: "pm-access-large-bore",
    sources: [
      { book: "brilakis-pci", loc: "14.4" },
      { book: "brilakis-pci", loc: "14.5" },
      { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
    ],
    refs: BOOKS,
  },
  {
    id: "mcs-largebore-removal-sutures",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Removing the large sheath: be quick, then tighten",
    text: "Wean to a low support level, pull the pump into the aorta, switch off and remove it quickly through the sheath, then remove the sheath and tighten the pre-placed sutures. A balloon in the iliac artery from the other groin reduces bleeding while you tie.",
    tone: "do",
    lessonId: "pm-access-large-bore",
    sources: [{ book: "brilakis-pci", loc: "14.4" }],
    refs: ["brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "seldinger-technique-1953",
    kind: "paper",
    citation: "Seldinger SI. Catheter replacement of the needle in percutaneous arteriography; a new technique. Acta Radiol. 1953;39(5):368–376.",
    url: "https://doi.org/10.3109/00016925309136722",
    note: "PMID: 13057644. Checked on PubMed: author, title, journal, year, volume 39, issue 5, pages 368–376.",
    verified: true,
  },
  {
    id: "seto-faust-2010",
    kind: "trial",
    citation:
      "Seto AH, Abu-Fadel MS, Sparling JM, et al. Real-time ultrasound guidance facilitates femoral arterial access and reduces vascular complications: FAUST (Femoral Arterial Access With Ultrasound Trial). JACC Cardiovasc Interv. 2010;3:751–758.",
    url: "https://doi.org/10.1016/j.jcin.2010.04.015",
    note: "PMID: 20650437. Checked on PubMed: authors, title, journal, year, volume 3, issue 7, pages 751–758.",
    verified: true,
  },
  {
    id: "seto-raust-2015",
    kind: "trial",
    citation:
      "Seto AH, Roberts JS, Abu-Fadel MS, et al. Real-time ultrasound guidance facilitates transradial access: RAUST (Radial Artery access with Ultrasound Trial). JACC Cardiovasc Interv. 2015;8:283–291.",
    url: "https://doi.org/10.1016/j.jcin.2014.05.036",
    note: "PMID: 25596790. Checked on PubMed: authors, title, journal, year, volume 8, issue 2, pages 283–291.",
    verified: true,
  },
  {
    id: "valgimigli-radar-allen-2014",
    kind: "trial",
    citation:
      "Valgimigli M, Campo G, Penzo C, et al. Transradial coronary catheterization and intervention across the whole spectrum of Allen test results. J Am Coll Cardiol. 2014;63:1833–1841.",
    url: "https://doi.org/10.1016/j.jacc.2013.12.043",
    note: "PMID: 24583305 (RADAR study). Checked on PubMed: authors, title, journal, year, volume 63, issue 18, pages 1833–1841.",
    verified: true,
  },
  {
    id: "aminian-disco-radial-2022",
    kind: "trial",
    citation:
      "Aminian A, Sgueglia GA, Wiemer M, et al. Distal versus conventional radial access for coronary angiography and intervention: the DISCO RADIAL trial. JACC Cardiovasc Interv. 2022;15:1191–1201.",
    url: "https://doi.org/10.1016/j.jcin.2022.04.032",
    note: "PMID: 35595673. Checked on PubMed: authors, title, journal, year, volume 15, issue 12, pages 1191–1201.",
    verified: true,
  },
  {
    id: "jolly-universal-2022",
    kind: "trial",
    citation:
      "Jolly SS, AlRashidi S, d'Entremont MA, et al. Routine ultrasonography guidance for femoral vascular access for cardiac procedures: the UNIVERSAL randomized clinical trial. JAMA Cardiol. 2022;7:1110–1118.",
    url: "https://doi.org/10.1001/jamacardio.2022.3399",
    note: "PMID: 36116089. Checked on PubMed: authors, title, journal, year, volume 7, issue 11, pages 1110–1118.",
    verified: true,
  },
  {
    id: "dentremont-universal-closure-2023",
    kind: "trial",
    citation:
      "d'Entremont MA, Alrashidi S, Alansari O, et al. Ultrasound-guided femoral access in patients with vascular closure devices: a prespecified analysis of the randomised UNIVERSAL trial. EuroIntervention. 2023;19:73–79.",
    url: "https://doi.org/10.4244/EIJ-D-22-01130",
    note: "PMID: 36876864. Checked on PubMed: authors, title, journal, year, volume 19, issue 1, pages 73–79.",
    verified: true,
  },
  {
    id: "dentremont-ultrasound-learning-2024",
    kind: "paper",
    citation:
      "d'Entremont MA, Seto AH, Alrashidi S, et al. Ultrasound-guided transfemoral access for coronary procedures: a pooled learning curve analysis from the FAUST and UNIVERSAL trials. Circ Cardiovasc Interv. 2024;17:e013817.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.123.013817",
    note: "PMID: 38887948. Checked on PubMed: authors, title, journal, year, volume 17, issue 8, article e013817.",
    verified: true,
  },
  {
    id: "babunashvili-tendera-2024",
    kind: "trial",
    citation:
      "Babunashvili AM, Pancholy S, Zulkarnaev AB, et al. Traditional versus distal radial access for coronary diagnostic and revascularization procedures: final results of the TENDERA multicenter, randomized controlled study. Catheter Cardiovasc Interv. 2024;104:1396–1405.",
    url: "https://doi.org/10.1002/ccd.31271",
    note: "PMID: 39474765. Checked on PubMed: authors, title, journal, year, volume 104, issue 7, pages 1396–1405.",
    verified: true,
  },
  {
    id: "stiermaier-rapid-2025",
    kind: "trial",
    citation:
      "Stiermaier T, Grünewälder M, Pätz T, et al. Distal access and procedural anticoagulation to prevent radial artery occlusion after coronary angiography: the randomised RAPID trial. EuroIntervention. 2025;21:e366–e375.",
    url: "https://doi.org/10.4244/EIJ-D-24-00846",
    note: "PMID: 40191883. Checked on PubMed: authors, title, journal, year, volume 21, issue 7, pages e366–e375.",
    verified: true,
  },
  {
    id: "singh-distal-radial-meta-2026",
    kind: "paper",
    citation:
      "Singh S, Gahlot K, Benny O, et al. Distal versus proximal transradial access and radial artery occlusion: a meta-analysis and trial sequential analysis. J Thromb Thrombolysis. 2026 (published online ahead of print).",
    url: "https://doi.org/10.1007/s11239-026-03364-7",
    note: "PMID: 42449086. Checked on PubMed: authors, title, journal, year 2026 (online July 2026); volume and pages not yet assigned.",
    verified: true,
  },
  {
    id: "lamperti-perseus-vascular-2020",
    kind: "guideline",
    citation:
      "Lamperti M, Biasucci DG, Disma N, et al. European Society of Anaesthesiology guidelines on peri-operative use of ultrasound-guided for vascular access (PERSEUS vascular access). Eur J Anaesthesiol. 2020;37:344–376.",
    url: "https://doi.org/10.1097/EJA.0000000000001180",
    note: "PMID: 32265391. Checked on PubMed: authors, title, journal, year, volume 37, issue 5, pages 344–376.",
    verified: true,
  },
  {
    id: "williams-arm-right-heart-2014",
    kind: "paper",
    citation:
      "Williams PD, Palmer S, Judkins C, et al. Right and left heart catheterization via an antecubital fossa vein and the radial artery: a prospective study. J Invasive Cardiol. 2014;26:669–673.",
    url: "https://pubmed.ncbi.nlm.nih.gov/25480997/",
    note: "PMID: 25480997. Checked on PubMed: authors, title, journal, year, volume 26, issue 12, pages 669–673.",
    verified: true,
  },
];
