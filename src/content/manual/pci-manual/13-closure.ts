// Module pm-closure: closing the access site (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.4, 1.11, 3.4, 4.2, 4.3, 11.1, 11.2, 14.4, 29.1, 29.2, 30.1 and 30.15;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 3 (femoral and radial line removal,
// compression devices, arterial closure devices) with passages from chapters 2, 9, 10 and 11.
// Every claim is listed with its page in docs/curriculum/evidence/pm-closure.md.
// Neighbouring modules: pm-access (the femoral angiogram at sheath insertion, large-bore access and the double-suture
// pre-close), pm-antithrombotics (ACT targets, protamine), pm-engaging (radial spasm during the case),
// cm-access-complications (treating haematoma, retroperitoneal bleeding, pseudoaneurysm, limb ischaemia and
// compartment syndrome once they have happened), hb-after-the-procedure (ward care after the case).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-closure",
  title: "Closing the access site",
  stage: 2,
  summary:
    "How to finish every case safely at the puncture: deciding whether a femoral sheath can come out, reading the femoral angiogram for closure, working through the femoral closure algorithm, pulling a femoral sheath and holding pressure, deploying a collagen-plug device and a suture-mediated device step by step with their failure modes, and removing a radial sheath with a compression band and patent haemostasis.",
  objectives: [
    "Work through the femoral closure algorithm: whether the sheath can come out, whether a device can be used, how high the puncture is, and whether the ACT allows manual compression.",
    "Read a femoral angiogram for closure: artery size, disease and calcium, the puncture height and its relation to the bifurcation, and branch or graft entry.",
    "Remove a femoral sheath and hold manual compression with the right preparation, hand position and duration, and recognise and treat bleeding, limb ischaemia and hypotension at the bedside.",
    "Deploy a collagen-plug closure device step by step, size it to the sheath, and prevent and manage incomplete anchor deployment, a pulled-through anchor, an intra-arterial plug, retroperitoneal bleeding and infection.",
    "Deploy a suture-mediated closure device step by step, keep wire access when closure is in doubt, and manage a device that will not advance or retract and a suture that is cut or loose.",
    "Remove a radial sheath as soon as the case ends, whatever the ACT, unless further PCI or haemodynamic monitoring through it is needed; place and inflate a compression band, achieve patent haemostasis with plethysmography and ulnar compression, and keep compression short.",
    "Explain what the trials say about closure devices and about patent radial haemostasis, and where the two manuals differ.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-closure-plan",
      title: "Planning femoral closure: the algorithm and the femoral angiogram",
      minutes: 14,
      topics: ["acc-closure-eligibility"],
      sources: [
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "1.11" },
        { book: "brilakis-pci", loc: "1.4" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "brilakis-pci", loc: "30.15" },
        { book: "oxford-cath", loc: "ch 3: Arterial closure devices" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "koreny-closure-meta-2004",
        "robertson-closure-cochrane-2016",
        "schulz-schupke-isar-closure-2014",
        "ellis-retroperitoneal-2006",
        "dentremont-universal-closure-2023",
      ],
      blocks: [
        {
          kind: "p",
          text: "A femoral case is not finished when the stent is in: the hole in the artery still has to be closed, and groin bleeding, retroperitoneal haemorrhage and closure-related limb ischaemia can all start at this stage. Closure is a decision made in the lab, from the femoral angiogram and the ACT, not a reflex at the end. This lesson teaches the decision; the next three teach compression and the two device classes.",
        },
        { kind: "h", text: "Why use a closure device at all?" },
        {
          kind: "p",
          text: "Brilakis favours closure devices because patients are more comfortable and walk sooner, and they may lower access complications, though he is clear that this last benefit is still argued over and that the devices bring complications of their own. Oxford makes the same case: less of the often painful digital compression, earlier mobilisation and discharge. Oxford also cites an older meta-analysis of first-generation devices that raised concern about haematoma and possibly pseudoaneurysm. Across all 30 randomised trials in that analysis, many of them of poor methodological quality, devices achieved haemostasis about 17 minutes sooner and made no significant difference to haematoma or pseudoaneurysm. The concern came from the few trials analysed explicitly by intention to treat, in which devices were associated with more haematoma (relative risk 1.89) and more pseudoaneurysm (relative risk 5.40).",
        },
        {
          kind: "p",
          text: "**Later evidence.** A 2016 Cochrane review (52 studies, 19,192 participants) found that suture-based and clip-based devices shortened time to haemostasis by about 15 minutes compared with external compression, and that collagen-based devices were associated with less groin haematoma and pseudoaneurysm; no difference was shown in death or in vascular injury needing repair, nor in infection where it was measured. In ISAR-CLOSURE (4524 patients after 6 Fr diagnostic angiography), a device strategy was non-inferior to manual compression for access-site complications at 30 days (6.9% against 7.9%), haemostasis took a median of 1 minute instead of 10, and the intravascular device failed less often than the extravascular one (5.3% against 12.2%). The way the artery was entered may matter too. The UNIVERSAL trial of ultrasound-guided femoral access did not significantly reduce its overall composite of bleeding and vascular complications (access module), but in a prespecified subgroup analysis ultrasound guidance was associated with fewer of these events in patients closed with a device (11.8% against 23.4%) and not in those closed without one.",
        },
        { kind: "h", text: "Before the case: what the history tells you" },
        {
          kind: "list",
          items: [
            "**Infection risk.** Brilakis's planning checklist asks about active infection and immunosuppression: in these patients a closure device may be better avoided. His complications chapter adds skin infection at the access site.",
            "**A recent collagen plug.** If a collagen-plug device was used in that groin within the last 90 days, consider the other groin or a radial. The plug's anchor, suture and collagen take 60–90 days to be absorbed (Brilakis); Oxford gives about 3 months for the collagen.",
            "**A previous access complication.** Brilakis's checklist asks what the complication was and how it was treated, and advises not using that access site again.",
            "**Where the puncture goes.** At femoral access Brilakis chooses a point above the bifurcation and away from calcium, luminal disease, bypass grafts and recently placed closure devices. A good closure starts with a good puncture.",
          ],
        },
        { kind: "tip", id: "access-planning-closure-infection" },
        { kind: "h", text: "The femoral closure algorithm (Brilakis Fig 11.1, in this module's words)" },
        {
          kind: "steps",
          title: "Four questions, asked in order at the end of the case",
          items: [
            {
              title: "1. Can the sheath come out now?",
              detail:
                "Keep it if a staged PCI is planned within a few hours or a haemodynamic support device is likely to be needed in the next few hours. A sheath that stays is secured with sutures, and a long sheath is usually exchanged for a short one of 10–13 cm; reassess later. The opposite also happens: if blood keeps oozing around the sheath it may have to come out at once, or, when the ooze comes from an arteriotomy larger than the sheath, a larger sheath can be inserted instead.",
            },
            {
              title: "2. Can a closure device be used?",
              detail:
                "Decide from the femoral angiogram. A device needs a common femoral artery larger than 5 mm, free of significant disease, entered above its bifurcation. Heavy calcification rules out the suture-mediated device in particular. If the answer is no, go to question 4.",
            },
            {
              title: "3. Was the stick high?",
              detail:
                "A puncture above the inguinal ligament is a high stick. Here the collagen-plug device should not be used, because the plug is hard to push all the way down to the artery; the suture device is preferred. If the stick is not high, either device class can be used.",
            },
            {
              title: "4. No device: is the ACT below 180 seconds?",
              detail:
                "If it is, remove the sheath and hold manual pressure. If not, suture the sheath in place, wait and recheck. Protamine can reverse heparin in selected patients so that the sheath comes out sooner, once all coronary equipment is out and accepting the risk of stent thrombosis after stenting (dose and cautions in the next lesson).",
            },
          ],
        },
        {
          kind: "p",
          text: "Brilakis presents the algorithm as his own team's practice and says that other devices can be fitted into it according to what a lab has and knows. Two further rules sit beside it. Devices can be deployed when the ACT is still high, but he suggests it may be best not to deploy one above an ACT of 300 seconds. And Oxford insists on strict asepsis and on following each device's datasheet and indications. One inconsistency is worth knowing: in his section on collagen-plug failures Brilakis advises avoiding the plug, or any other arterial closure device, after a high stick, so on that advice no device would be used; whichever closure is used, a high stick needs close watching for retroperitoneal bleeding.",
        },
        { kind: "tip", id: "access-closure-sheath-stays" },
        { kind: "tip", id: "access-closure-device-criteria" },
        {
          kind: "check",
          stem: "A 7 Fr femoral PCI of a long, calcified LAD lesion has just finished with a reasonable result, but the team plans to treat the RCA in the same admission, about four hours from now, and is unsure whether a microaxial pump will be needed for that procedure. The ACT is 270 seconds. What should happen to the sheath?",
          options: [
            "Close it now with a suture-mediated device, because a device can be used at this ACT",
            "Pull it now and compress, because the ACT will have fallen by the time pressure is released",
            "Swap it for a 4 Fr sheath through which the pump can later be advanced without dilatation",
            "Leave it in, sutured to the skin, and reassess; swap a long sheath for a 10–13 cm one",
          ],
          answer: 3,
          explanation:
            "Question 1 of the algorithm comes first: a staged PCI within a few hours, or a likely support device, means the sheath stays, sutured in place, with a long sheath exchanged for a short one. Closing it now with a device is possible at an ACT of 270 but throws away access that will be needed. Pulling it now ignores both the plan and the rule to wait for an ACT below 180 seconds. A microaxial pump needs a 13–14 Fr sheath (Brilakis), so a 4 Fr sheath could not take it without upsizing.",
        },
        { kind: "h", text: "Reading the femoral angiogram for closure" },
        {
          kind: "p",
          text: "The angiogram taken through the sheath side arm at the start of the case (technique in the access module: wire in the aorta, undamped waveform, ipsilateral oblique of 20–30°, low magnification, 5–10 mL of contrast) is the document you use now. Brilakis calls femoral angiography critical to the closure decision; Oxford suggests a femoral angiogram before the sheath is removed to confirm the puncture site, the artery's calibre and any disease. If no angiogram was taken at the start, take one now.",
        },
        {
          kind: "table",
          caption: "What to read, and what each finding means for closure",
          head: ["Finding", "What it means"],
          rows: [
            ["Perforation, dissection or a filling defect in the lumen, or loss of antegrade flow to the leg", "A complication: deal with it before any closure decision. Brilakis reads the angiogram first to exclude complications, then to judge their risk and whether a device is feasible"],
            ["Entry over the femoral head, below the inferior epigastric artery and above the bifurcation, in a clean artery larger than 5 mm", "Either device class can be used; manual compression is also straightforward because the artery lies against bone"],
            ["Entry above the inguinal ligament, or above the lowest point of the inferior epigastric artery (a high stick)", "No collagen plug. A suture device is preferred. Retroperitoneal bleeding becomes possible and manual compression may not reach the hole"],
            ["Entry at or below the bifurcation, in the superficial femoral or profunda artery", "No device. Oxford prefers manual or mechanical compression after a puncture below the bifurcation"],
            ["Small artery, or entry into a small branch", "No device. Brilakis shows a high bifurcation with the sheath in a small accessory profunda branch: no device was used and the site was compressed by hand"],
            ["Significant atheroma at the puncture", "No device. Oxford explains why: a plug can create a new stenosis in a diseased or small artery"],
            ["Heavy calcification", "Avoid the suture device in particular"],
            ["A filling defect from an earlier collagen plug", "That segment holds foreign material; this is why a recent plug is a reason to choose another site"],
          ],
        },
        {
          kind: "p",
          text: "**Why the high stick matters so much.** A puncture above the femoral head and the inferior epigastric origin cannot be pressed against bone, and Brilakis links it to retroperitoneal bleeding. A collagen plug placed there may catch in the muscle layers of the abdominal wall instead of reaching the artery. In the Cleveland Clinic series Brilakis cites (28,378 consecutive PCI patients), retroperitoneal haemorrhage occurred in 0.57%; it was independently associated with a sheath placed above the inferior epigastric artery, female sex, use of the collagen-plug device, glycoprotein IIb/IIIa inhibitors and presentation with myocardial infarction, and was less likely in heavier patients. Of the patients who bled, 10.4% died in hospital.",
        },
        {
          kind: "check",
          stem: "The end-of-case femoral angiogram shows the sheath entering a 7 mm common femoral artery, free of disease, just above the lowest loop of the inferior epigastric artery, well above the bifurcation. ACT 240 seconds. Which closure does the algorithm point to?",
          options: [
            "A suture-mediated device, because this is a high stick in a suitable artery",
            "A collagen-plug device, because the artery is large and entirely free of disease",
            "Manual compression now, because the ACT is close enough to the threshold",
            "No closure yet: suture the sheath in until the ACT is below 180 seconds",
          ],
          answer: 0,
          explanation:
            "Entry above the lowest point of the inferior epigastric artery is a high stick. The artery passes question 2 (larger than 5 mm, no disease, above the bifurcation), so a device can be used, and question 3 then excludes the collagen plug and prefers the suture device. Waiting for the ACT is the route only when no device can be used, and manual compression of a high stick may not reach the hole at all; the plug is the tempting wrong answer because the artery is otherwise ideal.",
        },
        { kind: "tip", id: "access-closure-high-stick" },
        { kind: "h", text: "Infection: the asepsis of closure" },
        {
          kind: "p",
          text: "A closure device leaves material in or against the artery, so its infection is serious, and Brilakis lists the devices themselves among the causes of access-site infection, with a groin haematoma or pseudoaneurysm, a sheath left in overnight, immunosuppression (for example after transplantation) and poor hygiene of the site. His preventive steps are to avoid devices in patients at higher risk of infection, to prepare the groin again with antiseptic immediately before deploying the device (especially after a long procedure), to cover the site with a sterile dressing straight afterwards, and to take the sheath out as soon as possible. A haematoma can itself become infected, which is one more reason to prevent it. He also considers prophylactic antibiotics for patients at high risk of infection. Infection shows itself as pain, redness and discharge at the site, sometimes with fever and a raised white cell count; blood cultures are usually taken, with duplex ultrasound to exclude a pseudoaneurysm. Treatment is intravenous antibiotics, and surgery when a closure device is infected, an abscess forms, a synthetic graft lies at the site or bacteraemia persists despite antibiotics.",
        },
        { kind: "tip", id: "access-closure-reprep-skin" },
        {
          kind: "pitfalls",
          items: [
            "Choosing the device before looking at the angiogram.",
            "Reaching for a collagen plug in a high stick because the artery is large and clean.",
            "Deploying any device in an artery under 5 mm, in a branch, below the bifurcation or through significant disease.",
            "Pulling a sheath that the next procedure, or a support device, will need within hours.",
            "Deploying a device after a long case without preparing the skin again.",
            "Assuming a device has excluded retroperitoneal bleeding: it has not.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the closure at the moment of puncture. The femoral angiogram you take with the new sheath answers question 2 and question 3 of the algorithm before the PCI has even started, so you can tell the team at the start how the groin will be closed.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, reach the closure stage of a femoral case and, before choosing a closure method, review the femoral angiogram: name the puncture height relative to the femoral head and the inferior epigastric artery, the relation to the bifurcation, the artery size and any calcium, then state which of the four algorithm questions decides the closure.",
        },
        { kind: "video", id: "YLeuuF8TS7s", note: "Brilakis on when and how to close femoral access (Manual of PCI, section 11.1)." },
        { kind: "video", id: "S7UWo_MsWjc", note: "Brilakis on femoral access step by step, including the femoral angiogram (Manual of PCI, section 4.2)." },
        {
          kind: "keypoints",
          items: [
            "Four questions in order: can the sheath come out; can a device be used; was the stick high; if no device, is the ACT below 180 seconds.",
            "A sheath stays for a staged PCI within hours or a likely support device: suture it, and swap a long sheath for a 10–13 cm one.",
            "Device criteria: common femoral artery larger than 5 mm, no significant disease, entered above the bifurcation. No suture device in heavy calcium; no collagen plug in a high stick.",
            "Devices work at a high ACT, but Brilakis would rather not use one above 300 seconds.",
            "Below the bifurcation or a small artery: manual or mechanical compression (Oxford).",
            "Devices speed haemostasis and mobilisation; their effect on complications is debated, and ISAR-CLOSURE found them non-inferior to manual compression.",
            "Avoid devices in infection or immunosuppression, prepare the skin again before deployment, and consider another site after a collagen plug within 90 days.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-closure-femoral-compression",
      title: "Removing a femoral sheath and holding pressure",
      minutes: 14,
      topics: ["acc-femoral-compression"],
      sources: [
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "3.4" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
        { book: "oxford-cath", loc: "ch 3: Compression devices" },
        { book: "oxford-cath", loc: "ch 10: Vasovagal reaction" },
        { book: "oxford-cath", loc: "ch 10: Vascular complications" },
        { book: "oxford-cath", loc: "ch 11: The patient" },
        { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "grossman-nifedipine-1996", "ellis-retroperitoneal-2006"],
      blocks: [
        {
          kind: "p",
          text: "Manual compression is the oldest closure method and the fallback for every failed or unsuitable device. It looks simple, yet each part of it (when to pull, where the fingers go, how long to press, who stands ready) has a reason, and getting any one wrong produces a haematoma, a pseudoaneurysm, a cold leg or a collapsed patient. Learn it as a procedure with its own preparation and its own complications.",
        },
        { kind: "h", text: "When the sheath may come out" },
        {
          kind: "table",
          head: ["", "Brilakis", "Oxford"],
          rows: [
            ["After heparin", "Wait until the ACT is below 180 seconds before pulling the sheath and pressing", "Wait until the ACT is below 150–200 seconds, or until 3–4 hours have passed, according to local protocol"],
            ["Speeding it up", "Protamine can be given in some patients to reverse heparin and allow earlier removal, but only once all coronary equipment is out, and reversal after stenting carries a risk of stent thrombosis", "Not part of Oxford's line-removal advice, which waits for the ACT or the clock"],
            ["Blood pressure", "Lower it with medication in a hypertensive patient before removal", "A hypertensive patient may need an antihypertensive before removal to help haemostasis. Oxford's example, sublingual nifedipine capsules, is no longer advised: a 1996 review linked it to abrupt hypotension, stroke, myocardial infarction and death. Use a titratable agent according to local protocol"],
            ["Duration of pressure", "About 2–3 minutes for each French size: 12–18 minutes for 6 Fr, 16–24 minutes for 8 Fr", "Continuous pressure for approximately 8–10 minutes until haemostasis"],
          ],
        },
        {
          kind: "formula",
          name: "Brilakis's rule for compression time",
          expr: "minutes of pressure ≈ (2 to 3) × sheath size in French",
          note: "6 Fr: 12–18 minutes; 8 Fr: 16–24 minutes. Oxford gives about 8–10 minutes for a femoral sheath. The manuals differ; follow local protocol and never release before haemostasis is secure.",
        },
        { kind: "tip", id: "access-femoral-sheath-act" },
        {
          kind: "p",
          text: "**Protamine** (taught with heparin in the antithrombotics module) reverses unfractionated heparin at 1–1.5 mg per 100 units of heparin, to a maximum of 50 mg, given slowly. It can cause hypersensitivity and anaphylaxis, and severe systemic hypotension with pulmonary hypertension, usually 5–10 minutes after the dose. The risk is higher after NPH or protamine zinc insulin, with fish hypersensitivity, after vasectomy, and with severe left ventricular dysfunction or abnormal pulmonary haemodynamics. If a severe reaction occurs, Brilakis notes that methylene blue can aid recovery. Two cautions apply when protamine is used to get a sheath out after PCI: give it only after all coronary equipment has been removed, and remember that reversing heparin after stent implantation carries a risk of stent thrombosis. These are typical figures from the manual; follow local protocol.",
        },
        { kind: "h", text: "Manual compression, step by step (Brilakis 11.1.6, with Oxford's details)" },
        {
          kind: "steps",
          title: "From preparation to dressing",
          items: [
            {
              title: "1. Monitor",
              detail: "The patient is on telemetry with non-invasive blood pressure monitoring throughout.",
            },
            {
              title: "2. Have the vagal kit and a person ready",
              detail:
                "Someone must be ready to give atropine or fluids for a vasovagal reaction, which Oxford lists among the reactions seen at sheath removal and during compression. Brilakis gives normal saline before the sheath comes out to prevent hypotension.",
            },
            {
              title: "3. Sterile gloves",
              detail: "Compression is done with sterile gloves.",
            },
            {
              title: "4. Place the hands over the arterial hole",
              detail:
                "The hands go above the skin puncture, because the needle travelled upwards and the hole in the artery is higher than the hole in the skin. Oxford presses firmly, using at least two fingers placed 1 cm proximal to the arterial puncture, before the sheath is withdrawn.",
            },
            {
              title: "5. Pull the sheath",
              detail:
                "Withdraw it under gentle pressure, allowing a small back-bleed. Oxford describes a brisk withdrawal.",
            },
            {
              title: "6. Press firmly and confirm haemostasis",
              detail: "Apply firm pressure and check that bleeding has stopped.",
            },
            {
              title: "7. Hold for long enough",
              detail: "About 2–3 minutes per French size (Brilakis) or about 8–10 minutes (Oxford), and in either case until haemostasis is secure.",
            },
            {
              title: "8. Check the groin",
              detail: "Look and feel for a haematoma.",
            },
            {
              title: "9. Check the foot",
              detail: "Feel the distal pulses.",
            },
            {
              title: "10. Dress the site",
              detail: "Cover it with a clear sterile dressing so that it can be watched.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Artery and vein in the same groin.** Take the arterial sheath out first and the venous sheath a few minutes later, rather than both together; Brilakis recommends this staggered removal as one of the ways to prevent an arteriovenous fistula.",
        },
        { kind: "tip", id: "access-compression-prepare" },
        { kind: "tip", id: "access-compression-hands-above" },
        {
          kind: "check",
          stem: "After a 6 Fr femoral PCI the ACT is 168 seconds and the blood pressure 186/94 mmHg. The nurse is ready to pull the sheath. What should happen first?",
          options: [
            "Pull it now and press for 6 minutes, since the ACT is below 180 seconds and the sheath is only 6 Fr",
            "Give protamine first, because any ACT above 150 seconds forbids removal in both manuals",
            "Lower the blood pressure, then pull with saline and atropine ready and press for 12–18 minutes",
            "Leave the sheath until the morning so that hypertension and heparin have both worn off",
          ],
          answer: 2,
          explanation:
            "The ACT passes Brilakis's threshold, but hypertension is one of his causes of compression failure, and both manuals advise lowering the pressure first. Preparation then includes saline before removal and someone ready to treat a vasovagal reaction, and Brilakis's duration for a 6 Fr sheath is 12–18 minutes (Oxford's is about 8–10). Six minutes is too short in either book. Protamine is not needed at an ACT of 168, and leaving a femoral sheath overnight raises the risk of infection.",
        },
        { kind: "h", text: "What can go wrong during compression" },
        {
          kind: "table",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            [
              "Bleeding",
              "Hands too low or to one side of the arterial entry point; too little pressure; anticoagulation; hypertension; obesity; a haematoma forming",
              "Correct hand position; firm pressure; check the ACT before removal so the patient is no longer anticoagulated; lower a raised blood pressure",
              "Move the hands to the right place and press firmly. If haemostasis still cannot be achieved, endovascular treatment or emergency surgery may be needed",
            ],
            [
              "Limb ischaemia",
              "Iliac or femoral dissection, femoral thrombosis, or embolism of thrombus or plaque; prolonged or overzealous compression, which can also cause deep vein thrombosis. Brilakis adds an occlusive or large sheath, a sheath or catheter left in for a long time, poor sheath handling (aspirate and discard before flushing) and suboptimal anticoagulation",
              "Meticulous technique when the access was obtained; press firmly but not for longer than needed",
              "Emergency angiography, then endovascular or surgical treatment",
            ],
            [
              "Hypotension",
              "Bleeding; a cardiac cause (tamponade, ischaemia, arrhythmia, valve regurgitation, failure of either ventricle); a vasovagal or anaphylactic reaction",
              "Good access technique; normal saline before removal; local anaesthetic when the sheath was inserted, so pain does not trigger a vagal reaction",
              "Bleeding: saline, transfusion if needed, then endovascular or surgical repair depending on the type of bleeding. Cardiac: treat the cause (pericardiocentesis for tamponade; vasopressors, inotropes or support devices for failure). Vasovagal: saline, and atropine for bradycardia",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Telling a vasovagal reaction from bleeding.** Oxford describes vasovagal reactions in 2–3% of catheter patients, including at puncture and during compression. The patient feels unwell, sick and sweaty, and the heart rate usually slows before the blood pressure falls. Tamponade can mimic this and is just as sudden, but the pulse is usually fast; if in doubt, Oxford asks for an immediate echocardiogram. Oxford's treatment: lie the patient flat with the legs raised, monitor, give atropine 0.5–1.0 mg intravenously and run 0.9% saline quickly. If the patient has not improved within a few minutes, think again and exclude infarction, tamponade and retroperitoneal bleeding. A slow pulse does not rule bleeding out: Brilakis notes that patients with a retroperitoneal haematoma often become bradycardic. Doses are typical; follow local protocol.",
        },
        { kind: "tip", id: "access-compression-vasovagal" },
        {
          kind: "check",
          stem: "Ten minutes into compression of an 8 Fr femoral sheath, the patient becomes pale, sweaty and nauseated. Heart rate 46/min, blood pressure 74/40 mmHg. The groin is soft. What do you do?",
          options: [
            "Release pressure so the leg does not become ischaemic, and start a vasopressor infusion",
            "Stop and request urgent CT of the abdomen, because retroperitoneal bleeding is likeliest",
            "Perform pericardiocentesis at once, because tamponade presents in exactly this way",
            "Keep pressing; raise the legs, give atropine 0.5–1.0 mg IV and fast saline, reassess",
          ],
          answer: 3,
          explanation:
            "Bradycardia with hypotension, pallor, sweating and nausea during compression is a vasovagal reaction until proven otherwise. Keep the pressure on (releasing it invites bleeding), raise the legs, and give atropine and fast saline. Oxford's first steps are positioning, atropine and saline, not a vasopressor, a CT scan or a pericardial needle. If the patient does not recover within a few minutes, reconsider: tamponade is usually tachycardic, but retroperitoneal bleeding can also slow the heart (Brilakis), so both must then be excluded.",
        },
        { kind: "h", text: "When pressure is not enough, or too much" },
        {
          kind: "list",
          items: [
            "**Obesity** makes manual compression hard (Brilakis), and Oxford suggests a mechanical compression device when bleeding is difficult to control by hand, particularly in hypertensive and obese patients.",
            "**Mechanical compression devices** press the artery against bone using an external frame. One type is strapped on with a belt under the buttocks and presses through a sterile inflatable dome: start the dome above systolic pressure, then lower it step by step until the site stops bleeding. Another is a clamp fixed to the bed that presses straight down on the puncture.",
            "**Procoagulant patches** help finger pressure rather than replace it; Oxford does not count them as closure devices, although they shorten the time to haemostasis.",
            "**How common.** Oxford reports a local haematoma after up to a quarter of femoral procedures, and lists among femoral complications vasovagal reactions, dissection, retroperitoneal haemorrhage after a puncture above the inguinal ligament, pseudoaneurysm and distal embolisation of thrombus from the sheath.",
            "**Too little pressure** at the end of the case is one of Brilakis's causes of pseudoaneurysm; **too much for too long** is one of his causes of limb ischaemia and can cause deep vein thrombosis.",
            "**A groin haematoma** is treated with manual pressure proximal to the skin entry site (it is painful, so give analgesia), then a compressive bandage and 6–8 hours of bed rest; duplex ultrasound can confirm that bleeding has stopped and that no pseudoaneurysm has formed. Its full management, and that of retroperitoneal bleeding, is taught in the access complications module.",
          ],
        },
        { kind: "tip", id: "access-compression-bleeding" },
        { kind: "h", text: "After the pressure is off" },
        {
          kind: "p",
          text: "Oxford mobilises most patients after 3 hours of bed rest following manual compression (chapter 3); its aftercare chapter gives a guide for a 6 Fr femoral puncture of lying flat for an hour after the line comes out and walking 2½ hours after removal, with shorter times (about 1 hour) after radial access, a closure device or a smaller femoral sheath, all varying with local practice. Watch for **retroperitoneal bleeding**: Brilakis says it usually declares itself within the first 3 hours, with hypotension, sweating, and lower abdominal or back pain, often with bradycardia, and that it should be suspected in every patient who becomes hypotensive during or after a femoral procedure. Feel for tenderness over the lower abdomen or above the pubis. Keep the suspicion especially high in obese patients, in those whose blood pressure was uncontrolled before or during the case, and after a high puncture, a puncture made without ultrasound or fluoroscopic guidance, or several attempts. If contrast has been given and the patient is still in the lab, fluoroscopy may show the bladder pushed aside by the haematoma, which strongly suggests it.",
        },
        { kind: "tip", id: "access-closure-hypotension-retroperitoneal" },
        {
          kind: "p",
          text: "**Balloon pump sheaths.** After use, Oxford warns, the balloon generally cannot be drawn back through its sheath. Withdraw the catheter until the balloon meets resistance at the sheath, then remove sheath and catheter together as one unit, and expect prolonged compression, because these devices are 7.5 Fr or larger.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pressing over the skin nick instead of over the arterial hole above it.",
            "Pulling the sheath while the ACT or the blood pressure is still high.",
            "Releasing early because the clock says 10 minutes, without checking haemostasis.",
            "Pressing so hard and so long that the foot pulses disappear.",
            "Taking out the arterial and venous sheaths at the same moment.",
            "Calling every post-compression hypotension vagal, and missing a retroperitoneal bleed or tamponade.",
            "Trying to pull a used balloon pump catheter back through its sheath instead of removing catheter and sheath together.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you pull, say the three numbers aloud: the ACT, the systolic pressure and the minutes you intend to press (2–3 per French). Then put the fingers above the skin hole, not on it.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, close a 6 Fr femoral sheath by manual compression: check the ACT against 180 seconds and the blood pressure, confirm saline and atropine are ready, place the fingers above the skin entry, pull the sheath with a small back-bleed, press for 12–18 minutes, then check the groin and the foot pulses and apply a clear dressing.",
        },
        { kind: "video", id: "UzFqEfJIeeY", note: "Brilakis on bleeding related to femoral access (Manual of PCI)." },
        { kind: "video", id: "YLeuuF8TS7s", note: "Brilakis on when and how to close femoral access (Manual of PCI, section 11.1)." },
        {
          kind: "keypoints",
          items: [
            "Pull a femoral sheath after heparin once the ACT is below 180 seconds (Brilakis), or below 150–200 seconds or after 3–4 hours (Oxford); protamine can speed this in selected patients, once all coronary equipment is out and accepting the stent-thrombosis risk.",
            "Prepare: telemetry and blood pressure, someone ready with atropine and fluids, saline before removal, sterile gloves, and a controlled blood pressure.",
            "Fingers above the skin puncture, over the arterial hole; pull with a small back-bleed, then press firmly.",
            "Press about 2–3 minutes per French size (Brilakis; 12–18 minutes for 6 Fr) or about 8–10 minutes (Oxford), always until haemostasis.",
            "Then check for haematoma and distal pulses, and apply a clear sterile dressing. Arterial sheath out first, venous a few minutes later.",
            "A heart rate that falls before the blood pressure suggests a vagal reaction (atropine 0.5–1.0 mg, fast saline). No recovery within minutes, or tachycardia, means looking for bleeding and tamponade; retroperitoneal bleeding can itself cause bradycardia.",
            "Retroperitoneal bleeding usually appears within 3 hours and must be suspected in every hypotensive femoral patient; look for back, lower abdominal or suprapubic pain and tenderness.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-closure-plug-device",
      title: "Collagen-plug closure step by step",
      minutes: 13,
      topics: ["eq-closure-devices"],
      sources: [
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "30.15" },
        { book: "brilakis-pci", loc: "29.1" },
        { book: "oxford-cath", loc: "ch 3: Arterial closure devices" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
      blocks: [
        {
          kind: "p",
          text: "The collagen-plug device closes the arteriotomy by trapping the artery wall between two parts joined by a suture: a small absorbable anchor that sits inside the artery and a collagen sponge that is pressed down onto the outside of the wall. Brilakis describes the most widely used collagen-plug device step by step; Oxford calls this class generally the most straightforward to use. Every step exists to put the anchor flat against the inner wall at the hole before the collagen is pressed down, and almost every failure comes from breaking that order.",
        },
        {
          kind: "table",
          caption: "The kit (Brilakis 30.15.1.1)",
          head: ["Part", "What it does"],
          rows: [
            ["Guidewire", "Supplied with the device; adequate for sheaths up to 25 cm long. A longer sheath needs a longer 0.035 inch wire"],
            ["Insertion sheath", "Replaces your procedural sheath and delivers the device. Near its tip are blood inlet holes"],
            ["Dilator (arteriotomy locator)", "Snaps into the insertion sheath with the two reference indicators aligned. Its side hole lines up with the sheath's hole 1.5 cm from the sheath tip, and blood from its drip hole tells you when that point is inside the artery"],
            ["The device itself", "Carries the polymer anchor, the collagen sponge and the suture that connects them, with a tamper tube to push the collagen down and a coloured band and black compaction marker that show progress"],
          ],
        },
        {
          kind: "table",
          caption: "Sizing",
          head: ["Your sheath", "Device", "Wire"],
          rows: [
            ["6 or 7 Fr", "6 Fr device", "0.035 inch; not compatible with 0.038 inch"],
            ["8 Fr", "8 Fr device", "0.038 inch can be used"],
            ["9 Fr", "Outside standard sizing. A single report Brilakis cites, in acute stroke patients after intravenous thrombolysis, used the 8 Fr device for 9 Fr punctures with good results; follow the device's instructions for use", "—"],
          ],
        },
        {
          kind: "steps",
          title: "Deployment (Brilakis 11.1.7, in this module's words)",
          items: [
            {
              title: "1. Prepare",
              detail: "Open the pack, put the dilator into the insertion sheath until the two click together, and check that the reference indicators on dilator and sheath line up.",
            },
            {
              title: "2. Wire in, procedural sheath out",
              detail:
                "Pass a 0.035 inch wire through your sheath, confirm on fluoroscopy that its tip is in the aorta, then remove your sheath and leave the wire.",
            },
            {
              title: "3. Find the artery wall with the locator",
              detail:
                "Advance the insertion sheath and dilator together over the wire until blood comes from the drip hole. Pull back slowly until it stops: the inlet holes have just left the artery. Advance again until blood just reappears. The sheath is now just inside the lumen.",
            },
            {
              title: "4. Remove dilator and wire, holding the sheath still",
              detail:
                "Fix the insertion sheath with the left hand so it cannot move, bend the dilator tip upwards to release it from the sheath, and pull out dilator and wire together.",
            },
            {
              title: "5. Insert the device",
              detail:
                "Hold it close to its tip with its reference indicator facing up, pass it through the sheath's valve and push it fully home until device and sheath click together.",
            },
            {
              title: "6. Deploy the anchor",
              detail:
                "Keep holding the sheath cap firmly so nothing moves. Pull the device back slowly until you feel resistance: the anchor has caught on the end of the sheath. The coloured band on the device sleeve should now be fully visible.",
            },
            {
              title: "7. Withdraw and tamp",
              detail:
                "Pull the device and sheath back together at roughly 45° to the skin, drawing the anchor against the inside of the wall. The tamper tube appears once the sheath is out of the skin. Only after you feel resistance at the back of the device (the anchor is against the wall) advance the tamper gently while keeping tension on the suture, so the collagen is compacted outside the arteriotomy. Keep the pull and the push going together for 8–10 seconds; usually a black marker appears on the suture. Check that bleeding has stopped.",
            },
            {
              title: "8. Cut the suture",
              detail:
                "Cut below the clear stop and remove the tamper tube. Then pull the suture gently and cut it beneath the skin, below the black marker, which does not dissolve. In an obese patient you may need to press the tissue down around the suture to reach it.",
            },
          ],
        },
        { kind: "tip", id: "access-plug-locator-drip" },
        { kind: "tip", id: "access-plug-no-tamp-before-resistance" },
        {
          kind: "check",
          stem: "You are advancing the insertion sheath and locator over the wire. Blood flows from the drip hole. You pull back and the flow stops. What does this tell you, and what next?",
          options: [
            "The inlet holes have just left the artery; advance until blood just returns",
            "The anchor has deployed against the wall; start tamping the collagen down now",
            "The sheath has entered a small branch; remove it and compress the groin by hand",
            "The ACT is too low for the locator to work; give a heparin bolus and repeat",
          ],
          answer: 0,
          explanation:
            "The drip hole bleeds only while the inlet holes near the sheath tip are inside the artery. Losing the flow means you are just outside; re-advancing until it just returns puts the sheath tip just inside the lumen, which is where the anchor must be released. The anchor has not been deployed yet at this stage, so tamping now would push collagen into nothing.",
        },
        { kind: "h", text: "Failure modes and what to do" },
        {
          kind: "table",
          head: ["Failure", "Cause", "Prevention", "Treatment"],
          rows: [
            [
              "Incomplete or improper anchor deployment",
              "The device was not pulled back fully, or an anchor leg caught on the sheath",
              "Pull the device fully back before going further",
              "If the anchor catches too early, push the device back into the sheath and pull back again",
            ],
            [
              "Anchor pulled through the arteriotomy",
              "Wrong size (for example a 6 Fr device for an 8 Fr hole) or a too forceful pull",
              "Match the device to the sheath; do not pull violently",
              "Manual pressure. If that fails, reversing anticoagulation and angiography may be needed to look for significant arterial injury",
            ],
            [
              "Plug deployed inside the artery",
              "A sheath advanced too far lets the anchor snag on atheroma higher up (proximal common femoral or external iliac artery), giving a false sense that it has reached the hole; tamping before the anchor is against the wall; an arteriotomy in the superficial femoral or profunda, where the anchor catches at the bifurcation",
              "Avoid the device in small or diseased arteries, or watch the anchor with ultrasound; never tamp before resistance; use it only above the bifurcation",
              "This causes acute limb ischaemia and must be treated promptly, often by surgical removal of the plug, although endovascular treatment has been described",
            ],
            [
              "Retroperitoneal haematoma",
              "A diseased common femoral artery, a high stick, or poor deployment technique",
              "No device in diseased arteries or high sticks; good technique",
              "Treat instability with fluids and blood, reverse anticoagulation, and consider surgical or endovascular repair if bleeding continues. When suspicion is high, going straight back to the lab for endovascular treatment may be better than imaging that delays it",
            ],
            [
              "Infection",
              "Systemic infection, immunosuppression, or a lapse in sterile technique",
              "No device in these patients; prepare the groin again just before deployment; apply a sterile dressing straight afterwards",
              "Antibiotics; surgical debridement and reconstruction may be needed",
            ],
          ],
        },
        {
          kind: "p",
          text: "Oxford explains the ischaemia from the vessel's side: a plug-based device can create a new stenosis, typically in an artery with pre-existing atheroma or a small calibre, and Oxford notes that lower-limb ischaemia is typically a closure-device problem, especially with large sheaths. Brilakis illustrates the result: in his example, a groin ultrasound after deployment showed an occluded common femoral artery with monophasic flow beyond it, and the plug had to be removed surgically. After any femoral closure, Oxford has the nurses check the leg regularly for a pale or blue colour, coldness, weak or absent pulses, pain, and loss of movement or sensation. For an ischaemic leg Brilakis gains access from the other groin, defines the cause angiographically and often treats it there (balloon angioplasty, endovascular thrombectomy or thrombolysis), with surgical thrombectomy, endarterectomy or bypass needed in some cases.",
        },
        { kind: "tip", id: "access-plug-size-to-sheath" },
        { kind: "tip", id: "access-closure-cold-leg" },
        {
          kind: "check",
          stem: "Just after a plug deployment in a patient with a diseased common femoral artery, the foot becomes cold and pale and the pedal pulses are lost. What is the most likely cause and the right response?",
          options: [
            "Arterial spasm from the procedure; warm the leg and recheck the pulses in an hour",
            "Retroperitoneal bleeding; reverse heparin, give fluids and arrange a CT scan",
            "A plug in or narrowing the artery; image promptly, often for surgical removal",
            "A vasovagal reaction; lie the patient flat, raise the legs and give atropine",
          ],
          answer: 2,
          explanation:
            "A plug placed in a diseased or small artery can sit inside the lumen or create a new stenosis, causing acute limb ischaemia. Brilakis says it must be treated promptly, often by surgical removal; Oxford adds early vascular surgical involvement with Doppler ultrasound or CT. Waiting for spasm to settle wastes the time the leg does not have.",
        },
        {
          kind: "pitfalls",
          items: [
            "Letting the insertion sheath drift deeper while removing the dilator or inserting the device.",
            "Tamping as soon as the tamper appears, before resistance tells you the anchor is on the wall.",
            "A 6 Fr device for an 8 Fr arteriotomy.",
            "Using a plug in a high stick, below the bifurcation, or in a small or diseased artery.",
            "Cutting the suture above the black marker, leaving non-absorbable material near the skin.",
            "Assuming a sealed groin cannot be the source of later hypotension.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the device as a sandwich made in strict order: bread inside (anchor, pulled flat against the wall), then the filling pressed down from outside (collagen). If you have not felt the anchor stop, you have not made the inside half yet.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, close a 6 Fr femoral sheath in a suitable artery with a collagen-plug device: confirm the wire is in the aorta, use the drip hole to place the insertion sheath just inside the lumen, hold the sheath still while removing the dilator, deploy and seat the anchor, tamp only after resistance, and cut the suture below the marker.",
        },
        { kind: "video", id: "cUPV8MNRfiE", note: "Brilakis on deploying a collagen-plug closure device step by step (Manual of PCI)." },
        {
          kind: "keypoints",
          items: [
            "Mechanism: an absorbable anchor inside, a collagen sponge outside, joined by a suture; anchor, suture and collagen are absorbed in 60–90 days (Brilakis; the black compaction marker is not absorbable), the collagen in about 3 months (Oxford).",
            "Size: 6 Fr device for 6–7 Fr sheaths (0.035 inch wire only), 8 Fr device for 8 Fr sheaths.",
            "Use the drip hole: blood on, pull back until it stops, advance until it just returns.",
            "Hold the sheath still; pull the device until the anchor catches and the coloured band shows.",
            "Withdraw at about 45°, and tamp only after resistance, for 8–10 seconds; cut below the black marker.",
            "Failures: anchor misdeployed or pulled through, plug inside the artery (acute limb ischaemia), retroperitoneal bleeding, infection.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-closure-suture-device",
      title: "Suture-mediated closure step by step, and the other device classes",
      minutes: 13,
      topics: ["eq-closure-devices"],
      sources: [
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "30.15" },
        { book: "brilakis-pci", loc: "4.2" },
        { book: "brilakis-pci", loc: "14.4" },
        { book: "oxford-cath", loc: "ch 3: Arterial closure devices" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
      blocks: [
        {
          kind: "p",
          text: "The suture-mediated device closes the hole the way a surgeon would, with a stitch. Needles carried inside the device pass a single monofilament polypropylene suture through the wall on either side of the arteriotomy; a knot is then slid down to the artery and locked. Brilakis describes a suture-mediated system which, he says, can be used for arterial access from 5 to 21 Fr and large-bore venous access from 5 to 24 Fr. For a large-bore arteriotomy that means two devices placed before the track is dilated (pre-close), not one device after the large sheath is out. It is the device his algorithm prefers for a high stick.",
        },
        {
          kind: "table",
          caption: "The kit (Brilakis 30.15.1.2)",
          head: ["Part", "What it does"],
          rows: [
            ["The device", "Has a wire exit port, a marker lumen that shows pulsatile blood when the tip is in the artery, a foot opened by a lever, and a plunger that fires the needles"],
            ["Knot pusher", "Slides the knot down the suture to the arteriotomy"],
            ["Suture trimmer", "Cuts both limbs at depth once the knot is locked"],
          ],
        },
        {
          kind: "steps",
          title: "Deployment (Brilakis 11.1.8, in this module's words)",
          items: [
            {
              title: "1. Prepare",
              detail: "Open the pack and flush the marker lumen with saline until it comes out of the marker port.",
            },
            {
              title: "2. Wire in, sheath out",
              detail:
                "Pass a 0.035 or 0.038 inch wire through your sheath, confirm on fluoroscopy that it is in the distal aorta, and remove the sheath leaving the wire.",
            },
            {
              title: "3. Open the track",
              detail:
                "Spread the tissue along the wire with a haemostat so the device will pass. Brilakis also makes the skin nick at access partly for this: the device and its knot pusher need it.",
            },
            {
              title: "4. Insert the device",
              detail:
                "Advance it over the wire until the wire exit port reaches the skin, take the wire out, then advance further until pulsatile blood comes from the marker lumen.",
            },
            {
              title: "5. Open the foot",
              detail: "Hold the device at 45°, check that pulsatile marker flow continues, and lift the lever to deploy the foot.",
            },
            {
              title: "6. Fire the suture",
              detail:
                "Hold the device between the index and middle fingers of the right hand and pull back until you feel the foot against the vessel wall; marker flow should stop or fall sharply. Steady the body with the left hand and push the plunger with the right to fire the needles. Then, using the thumb as a fulcrum, pull the plunger back to free the needles and plunger from the device. One (anterior) suture stays attached to its needle: cut it with the cutter at the front of the device.",
            },
            {
              title: "7. Close the foot",
              detail: "Release the tension and push the lever down to fold the foot back.",
            },
            {
              title: "8. Withdraw to the exit port",
              detail:
                "Pull the device back until the wire exit port shows above the skin. A 0.035 inch wire can be passed back into the vessel here to keep access, which matters most when closing a large arteriotomy.",
            },
            {
              title: "9. Remove the device and slide the knot",
              detail:
                "Take the suture limbs out of the device. The blue limb is the longer one and carries the knot down; the white-tipped limb locks it. Load the knot pusher on the blue limb and wrap that limb round the left index finger close to the skin. If you suspect device failure, re-advance the 0.035 inch wire through the device first and remove the device over it. Withdraw the device with gentle tension on the blue limb, then run the knot pusher (or the trimmer) down to push the knot onto the arteriotomy, pushing further if it still bleeds. A wire left in is removed only once haemostasis is secure.",
            },
            {
              title: "10. Lock and cut",
              detail:
                "Check that bleeding has stopped, pull the white-tipped limb to lock the knot, remove the knot pusher, run the trimmer over both limbs, cut, and remove the trimmer.",
            },
          ],
        },
        { kind: "tip", id: "access-suture-45-foot" },
        { kind: "tip", id: "access-suture-keep-wire" },
        {
          kind: "check",
          stem: "You have fired the suture device, closed the foot and withdrawn it until the wire exit port shows. The device was hard to keep steady at 45° during firing, and you are not confident the needles captured the wall. What is your next move?",
          options: [
            "Remove the device, push the knot down and simply compress the groin if it bleeds",
            "Fire a collagen-plug device through the suture device while it is still in the artery",
            "Remove the device and leave the knot untied, compressing the groin for 20 minutes",
            "Pass a 0.035 inch wire back through the exit port, then remove the device over it",
          ],
          answer: 3,
          explanation:
            "When device failure is a concern, Brilakis re-advances the wire through the device and removes the device over it, so access is never lost. If the suture is cut or loose you can then put in a second device over the same wire. Removing the device first and hoping for the best throws away the wire, which is what you need most if the closure fails.",
        },
        { kind: "h", text: "Failure modes and what to do" },
        {
          kind: "table",
          head: ["Problem", "Cause", "Prevention", "Treatment"],
          rows: [
            [
              "Device will not advance",
              "Scar from earlier punctures, a poorly prepared track, or a kinked wire",
              "Careful track preparation; a stiff 0.035 or 0.038 inch wire, such as an extra-stiff wire",
              "Poor track: take the device out and prepare the track again. Kinked wire: exchange it, ideally for a stiffer one, and prepare the track again",
            ],
            [
              "Suture cut or loose",
              "Device failure, pulling too hard, or firing at an angle other than 45°",
              "Choose arteriotomies carefully, handle the device gently, steady it at 45° before firing",
              "Put a wire back into the artery through the device, remove it, and deploy another device",
            ],
            [
              "Device will not come out",
              "Malfunction, a poor track, or severe calcification",
              "A well-prepared track",
              "Gentle rotation with withdrawal in both directions; if it still will not come, call the vascular surgeons",
            ],
            [
              "Limb ischaemia (Oxford)",
              "A knot tied too tightly, especially when several devices close a large hole",
              "Correct puncture site; femoral angiogram before closure",
              "Early vascular surgical involvement, with Doppler ultrasound or CT",
            ],
          ],
        },
        { kind: "tip", id: "access-suture-loose-second-device" },
        {
          kind: "check",
          stem: "The suture device will not advance over the wire into a groin that has been punctured many times before. The wire has a visible kink at the skin. What do you do?",
          options: [
            "Push harder with a firm twisting motion until the device passes through the scar",
            "Remove the device, swap the wire for a stiffer one, re-prepare the track and retry",
            "Abandon the device, take the wire out as well, and compress the groin by hand",
            "Switch to a collagen plug over the same kinked wire, since plugs need no prepared track",
          ],
          answer: 1,
          explanation:
            "Scar and a kinked wire are two of Brilakis's three causes. He exchanges a kinked wire, ideally for a stiffer one, and prepares the track again; a poor track alone just needs re-preparing. Forcing the device risks the artery, and pulling everything out without a wire throws away access you may need.",
        },
        { kind: "h", text: "Sutures for large holes" },
        {
          kind: "p",
          text: "For a large-bore sheath, the suture devices go in before the big sheath, not after it: the double-suture pre-close (two devices, one turned to 10 o'clock and one to 2 o'clock, left untied in gauze or insulin syringes) is taught in the access module. At the end, Brilakis removes the large sheath and tightens the pre-placed sutures, and a balloon brought up from the opposite femoral artery into the iliac artery can cut the bleeding and make haemostasis easier. If support continues after the PCI, the pre-placed sutures can be partly tightened round the repositioning sheath to limit oozing. Brilakis also mentions a dedicated device for large-bore access closure, without describing how it works.",
        },
        { kind: "h", text: "The other device classes" },
        {
          kind: "table",
          head: ["Class", "How it works", "Source"],
          rows: [
            ["Collagen plug", "Anchor inside, collagen outside, joined by a suture; the collagen is absorbed in about 3 months", "Oxford; Brilakis 30.15.1.1 (previous lesson)"],
            ["Suture-mediated", "Needles carry a suture across the wall on either side of the hole and a knot is formed (Oxford); after the device is withdrawn, the knot is pushed down to the artery with a knot pusher and locked (Brilakis 11.1.8.9)", "Oxford; Brilakis 11.1.8, 30.15.1.2"],
            ["Clip", "A nitinol clip is deployed outside the vessel and grips the rim of the hole; because it stays outside, the vessel's own tissues are brought together to heal", "Oxford"],
            ["Dedicated large-bore device", "Available for large-bore access closure; neither manual describes its mechanism", "Brilakis 30.15.1"],
            ["Procoagulant patch", "Carries an agent that blood switches on. Oxford classes patches as helpers for finger pressure rather than true closure devices; they do cut the time needed to stop the bleeding", "Oxford"],
          ],
        },
        {
          kind: "p",
          text: "Beyond the plug and suture devices, Brilakis names five other femoral closure devices and says any of them can be used according to what is available locally and what the operator knows. Whatever the device, Oxford's rule applies: strict asepsis, and follow the device's own instructions and indications.",
        },
        {
          kind: "pitfalls",
          items: [
            "Skipping the skin nick and track preparation, then fighting the device through the tissue.",
            "Firing the needles while the device is flat or wobbling instead of steady at 45°.",
            "Pulling the device out without a wire when you are unsure the suture held.",
            "Over-tightening knots, especially when several devices close one large hole.",
            "Tugging a stuck device out by force instead of rotating gently and calling the surgeons.",
          ],
        },
        {
          kind: "pearl",
          text: "Whenever a suture closure feels doubtful, the wire goes back in before the device comes out. A wire in the artery turns a failed stitch into a second attempt instead of an emergency.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, close a high femoral stick with a suture-mediated device: confirm the wire in the distal aorta, prepare the track, advance until pulsatile marker flow, open the foot at 45°, pull back until flow stops, fire, cut the anterior suture, close the foot, reinsert a wire through the exit port, and slide and lock the knot before cutting.",
        },
        { kind: "video", id: "ai3DVDTx7v0", note: "Brilakis on deploying a suture-mediated closure device step by step (Manual of PCI)." },
        { kind: "video", id: "M72Te9oB76g", note: "Brilakis on large-bore access with two suture-mediated closure devices (Manual of PCI)." },
        {
          kind: "keypoints",
          items: [
            "One monofilament polypropylene suture; arterial access 5–21 Fr and large-bore venous access 5–24 Fr (Brilakis), a large-bore artery needing two devices placed before dilatation.",
            "Wire (0.035–0.038 inch) in the distal aorta, sheath out, track prepared with a haemostat.",
            "Advance until pulsatile marker flow; at 45°, open the foot, pull back until flow stops, fire, cut the anterior suture, close the foot.",
            "Withdraw to the exit port, where a wire can go back in; blue limb carries the knot, white-tipped limb locks it.",
            "Failures: will not advance (re-prepare the track, stiffer wire), cut or loose suture (wire back in, second device), will not come out (rotate gently, call surgery), over-tight knot (limb ischaemia).",
            "Large-bore closure is planned at access with two pre-placed sutures; a contralateral iliac balloon helps haemostasis when they are tied.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-closure-radial",
      title: "Radial sheath removal and patent haemostasis",
      minutes: 14,
      topics: ["acc-radial-haemostasis"],
      sources: [
        { book: "brilakis-pci", loc: "11.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "brilakis-pci", loc: "30.15" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 3: Compression devices" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "pancholy-prophet-2008",
        "pancholy-compression-duration-2012",
        "pancholy-prophet-ii-2016",
        "koutouzis-ultra-2016",
        "petroglou-memory-2018",
        "bernat-rao-consensus-2019",
        "aminian-disco-radial-2022",
      ],
      blocks: [
        {
          kind: "p",
          text: "Radial closure is easy to do and easy to do badly. The artery is small and can be pressed against the radius, so bleeding is infrequent; the real aim is to stop the bleeding while blood keeps flowing through the artery, because an artery squeezed shut while a fresh puncture heals tends to thrombose. Radial artery occlusion is the commonest complication of radial access after the procedure, and it can take away that artery for future procedures and as a bypass conduit (international consensus, 2019).",
        },
        { kind: "h", text: "Start with the hardest case: a long ACT and a big sheath" },
        {
          kind: "p",
          text: "Picture the end of a primary PCI through a 7 Fr radial sheath, a glycoprotein IIb/IIIa infusion running and an ACT above 300 seconds. A femoral sheath would stay in. A radial sheath does not: once no further PCI or haemodynamic monitoring through it is needed, Brilakis takes it out as soon as the case ends, whatever the ACT, and whether or not an intravenous glycoprotein IIb/IIIa inhibitor or cangrelor is running, and Oxford says radial sheaths are almost always removed at once. A radial sheath that is left in must be flushed carefully and connected to a pressure transducer, or it will thrombose and embolise. The size of the sheath matters later: large sheaths relative to the artery are a cause of both spasm and occlusion.",
        },
        {
          kind: "p",
          text: "**The band.** Brilakis names three radial compression devices and notes that many have an air chamber inflated over the puncture. Oxford describes radial bands as compact devices that work like a tourniquet, pressing the artery against the radius, and that let the patient walk early; one design is a transparent wrist band with an inflatable bladder, another a pad strapped down onto the puncture from a wrist splint. The steps below assume an inflatable band.",
        },
        { kind: "tip", id: "access-radial-remove-now" },
        { kind: "h", text: "The five steps (Brilakis 11.2, in this module's words)" },
        {
          kind: "steps",
          title: "From the last injection to patent haemostasis",
          items: [
            {
              title: "1. Confirm the sheath is no longer needed",
              detail: "The procedure is over and no further PCI or haemodynamic monitoring through the radial is required.",
            },
            {
              title: "2. Give a vasodilator through the side arm",
              detail:
                "For example verapamil 2–3 mg, nitroglycerin 200–500 micrograms, or both, usually mixed 1:1 with blood just drawn back through the sheath, which makes it less uncomfortable. It prevents or relieves spasm so the sheath slides out, and Brilakis notes that a vasodilator before removal may also lower the risk of occlusion. Typical doses; follow local protocol.",
            },
            {
              title: "3. Put the band on before the sheath comes out",
              detail:
                "Place the compression band on the wrist immediately above the radial puncture. The hole in the artery usually lies proximal to the hole in the skin, particularly when the needle went in at a shallow angle. A band placed too distally lets the artery bleed into the forearm; one placed too proximally gives a haematoma at the wrist.",
            },
            {
              title: "4. Pull the sheath and set the pressure",
              detail:
                "Remove the sheath while inflating the band's cuff with 10–15 mL of air. Then let air out slowly until the puncture begins to bleed, and put back 2–3 mL.",
            },
            {
              title: "5. Prove the artery is open: patent haemostasis",
              detail:
                "Put a pulse oximeter probe on the index finger and compress the ulnar artery at the same wrist. If the plethysmograph trace has gone, the band is occluding the radial: loosen it until the trace returns (the radial is open) or bleeding starts. If it bleeds at the pressure needed to keep the radial open, use manual compression. Leave the band on for 1–2 hours: longer raises the risk of occlusion. Compressing the ulnar artery at the same time lowers that risk further.",
            },
          ],
        },
        { kind: "tip", id: "access-radial-band-inflation" },
        { kind: "tip", id: "access-radial-patency-check" },
        {
          kind: "check",
          stem: "The band is on and the sheath is out. With the oximeter on the index finger, you compress the ulnar artery and the plethysmograph trace goes flat. What do you do?",
          options: [
            "Nothing: a flat trace confirms that the band is compressing the right artery",
            "Add 2–3 mL to the band, because the flat trace shows the artery is still leaking",
            "Let air out slowly until the trace returns or the puncture starts to bleed",
            "Remove the band and hold three fingers over the puncture site for a full hour",
          ],
          answer: 2,
          explanation:
            "With the ulnar artery compressed, the finger is supplied only through the radial. A flat trace means the band has occluded the radial, which is exactly the occlusive compression that leads to thrombosis. Loosen until the trace returns or bleeding begins; if it bleeds at the pressure needed for patency, switch to manual compression. Adding air makes the occlusion worse.",
        },
        { kind: "h", text: "The evidence behind the method" },
        {
          kind: "table",
          head: ["Study", "What it compared", "What it found"],
          rows: [
            ["PROPHET (2008), 436 patients", "Conventional pressure against pressure adjusted to keep the radial patent (checked with the plethysmographic test)", "Patent haemostasis cut occlusion by 59% at 24 hours and by 75% at 30 days; low body weight was a risk factor"],
            ["Pancholy and Patel (2012), 400 patients, retrospective", "Band compression for 6 hours against 2 hours", "Early occlusion 12% against 5.5%, occlusion at 30 days 8.5% against 3.5%; occlusive compression was the only independent predictor; maintaining patency removed the harm of a longer duration"],
            ["PROPHET-II (2016), 3000 patients", "Patent haemostasis alone against patent haemostasis plus compression of the ulnar artery at the same wrist", "Occlusion at 30 days 3.0% against 0.9%"],
            ["ULTRA (2016), 240 patients, non-randomised", "Patent haemostasis against patent haemostasis with 1 hour of ulnar compression", "Occlusion within an hour of band removal in 5% against none"],
            ["MEMORY (2018), 589 patients, 5 Fr diagnostic", "Manual against mechanical patent haemostasis", "Early occlusion 12% against 8% (not significant), similar bleeding; haemostasis took a mean of 22 minutes by hand against 119 minutes with a device"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis accepts manual compression as an alternative, citing MEMORY: pressure with three fingers over the puncture, aiming for patent haemostasis and checking patency every 1–2 minutes by briefly compressing the ulnar artery and watching the plethysmograph. Results are good, but someone has to hold the pressure throughout: a mean of 22 minutes in MEMORY, whereas the band stayed on far longer but needed no hands. Brilakis notes that most centres now use a radial compression device.",
        },
        { kind: "h", text: "When things go wrong at the wrist" },
        {
          kind: "table",
          head: ["Problem", "What to do", "Source"],
          rows: [
            ["The sheath will not come out (spasm)", "More vasodilator (intravenously if you cannot aspirate through the side arm; Oxford gives intra-arterial nitrates and verapamil), nitroglycerin injected under the skin around the artery, more sedation (consider propofol), warm blankets or gauze soaked in warm sterile saline over the forearm, a lubricious solution, a cuff on the upper arm inflated above systolic for 5 minutes to provoke ischaemic vasodilatation, and in the last resort general anaesthesia or a nerve block. Never pull hard: forced removal can avulse the radial artery. Spasm is commoner in women, current smokers and anxious or under-sedated patients, with a small artery or a large sheath, with many catheter exchanges, when no vasodilator was given after access, and with intravenous vasopressors. Prevention: vasodilator at the start, the thinnest and smallest sheath possible, few catheter manipulations, adequate sedation (Oxford: mild sedation with an opiate and a benzodiazepine before access) and local anaesthesia, and long (24 cm) sheaths that reach the brachial artery", "Brilakis 11.2.4, 29.2.3; Oxford ch 3"],
            ["Bleeding at the puncture", "Reposition the band, or add a second band; manual pressure with the arm elevated; a blood pressure cuff inflated above systolic can help", "Brilakis 11.2.4, 29.2.1"],
            ["A haematoma just proximal to the band soon after it is applied", "Usually controlled by a second compression device placed against the first", "Oxford ch 3"],
            ["Forearm haematoma developing slowly on the ward (up to 1% of radial cases)", "Usually conservative: compressive bandage, ice, the arm elevated in a sling, and close watch for compartment syndrome", "Oxford ch 3"],
            ["Tense, painful forearm with pain on passive stretch", "Suspect compartment syndrome; involve the vascular surgeons early. Oxford puts its incidence at 0.004–0.13% and lists female sex, small body size, impaired renal function and a large sheath as possible risk factors. To stop a forearm haematoma progressing, Oxford compresses the forearm with a blood pressure cuff inflated to no more than the systolic pressure minus 15 mmHg, together with analgesia, blood pressure control and heparin reversal. The radial haematoma scheme Brilakis reproduces (Fig 29.10) differs: the cuff is set 20 mmHg below systolic and deflated every 15 minutes, finger oxygen saturation is watched while it is inflated, anticoagulant or antiplatelet infusions may be interrupted, forearm and arm diameters are followed, and a Velpeau bandage keeps mild pressure for a few hours after the band comes off. The manuals differ, so follow local protocol. Treatment of the established syndrome is taught in the access complications module", "Oxford ch 10; Brilakis 29.2"],
          ],
        },
        { kind: "tip", id: "access-radial-spasm-no-traction" },
        { kind: "tip", id: "access-radial-band-bleeding" },
        {
          kind: "check",
          stem: "Twenty minutes after a band was applied, a firm, tender swelling appears just proximal to it. The radial trace is present with the ulnar artery compressed. What is the most appropriate first step?",
          options: [
            "Place a second band against the proximal edge of the first; raise the arm",
            "Inflate the first band further until the swelling stops getting any bigger",
            "Remove the band and wrap the forearm firmly in a crepe bandage only",
            "Start intravenous heparin to prevent radial occlusion under the haematoma",
          ],
          answer: 0,
          explanation:
            "Oxford describes exactly this: a local haematoma just proximal to the band soon after it is applied, controlled by a second compression device placed against the first; Brilakis repositions or adds a band and elevates the arm. The arterial hole is often proximal to the skin hole, which is why the bleeding appears above the band. Over-inflating the first band occludes the radial without reaching the bleeding point.",
        },
        { kind: "h", text: "Preventing radial occlusion, and watching afterwards" },
        {
          kind: "list",
          items: [
            "**Causes** (Brilakis): a small artery or a large sheath relative to it, non-patent haemostasis, no or low-intensity anticoagulation, and repeated access of the same artery.",
            "**Prevention**: meticulous access, unfractionated heparin during the case (for a diagnostic study he usually gives 50 units/kg up to 5000 units, noting that 100 units/kg may be more effective), compression for 2 hours or less, patent haemostasis, and the distal rather than the proximal radial artery (although in the later randomised DISCO RADIAL trial, with a strict patent haemostasis protocol, forearm occlusion was equally rare with distal and conventional access, 0.31% against 0.91%, and distal access needed more crossovers and had more spasm). The Allen and Barbeau tests do not predict occlusion and need not be done routinely.",
            "**Size of the problem** (Oxford): loss of the radial pulse after the procedure in up to 5%, often without symptoms; transient occlusion in up to 7–8%, usually silent because the ulnar artery supplies the hand.",
            "**If occlusion happens** (Brilakis): it is usually silent, rarely causing pain from hand ischaemia, and duplex ultrasound confirms it. Most patients need no treatment; anticoagulation may be considered, an anti-inflammatory drug helps local pain, and percutaneous recanalisation through brachial or distal radial access is kept for selected, highly symptomatic patients.",
            "**Distal radial access** has its own compression devices, both adapted and dedicated (Brilakis Figs 11.19 and 11.20). Oxford adds that haemostasis is quicker at the snuff box, where the artery lies more superficially, and that forearm compartment syndrome may be less likely.",
            "**Observation** (Oxford): confirm patent haemostasis, and check the wound every 15 minutes until the band is off, looking for changes in the colour, sensation, temperature, shape and size of the forearm, the pulse, and pain.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving a radial sheath in because the ACT is high, as if it were femoral.",
            "Placing the band over the skin nick instead of just above it, so the artery bleeds into the forearm.",
            "Pumping the band up 'to be safe' and never checking the plethysmograph with the ulnar artery compressed.",
            "Leaving the band on for 6 hours by habit; Brilakis keeps it to 1–2 hours.",
            "Pulling a gripped sheath by force.",
            "Ignoring increasing forearm pain on the ward.",
          ],
        },
        {
          kind: "pearl",
          text: "Patent haemostasis is a pressure you titrate, not a volume you inject. Find the point where it just bleeds, add 2–3 mL, then prove with the ulnar artery pressed that the trace survives. If it does not, the band is causing the occlusion it is meant to avoid.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, finish a right radial PCI with a 7 Fr sheath and an ACT of 320 seconds: give the side-arm vasodilator mixed with blood, place the band just above the puncture, pull the sheath while inflating 10–15 mL, deflate until it bleeds and add 2–3 mL, then compress the ulnar artery with the oximeter on the index finger and adjust until the trace persists. Set the band to come off at 1–2 hours.",
        },
        { kind: "video", id: "SU74rGGZTe8", note: "Brilakis on radial access complications (Manual of PCI)." },
        { kind: "video", id: "zQCx7wQSe-Q", note: "Brilakis on radial artery access step by step (Manual of PCI, section 4.3)." },
        {
          kind: "keypoints",
          items: [
            "Remove a radial sheath as soon as the case ends, whatever the ACT and even with IV antiplatelet infusions, unless further PCI or haemodynamic monitoring through it is needed; a retained sheath must be flushed and transduced.",
            "Side-arm vasodilator before removal (verapamil 2–3 mg, nitroglycerin 200–500 micrograms, or both, mixed 1:1 with blood).",
            "Band immediately above the skin puncture; too distal bleeds into the forearm, too proximal into the wrist.",
            "Inflate 10–15 mL as the sheath comes out, deflate until it bleeds, add back 2–3 mL.",
            "Patent haemostasis: oximeter on the index finger, ulnar artery compressed, loosen until the trace returns; manual compression if it bleeds at that pressure.",
            "Band on for 1–2 hours; longer compression and occlusive compression raise occlusion; adding ulnar compression lowers it (PROPHET-II 0.9% against 3.0%).",
            "Proximal haematoma: second band against the first; slow forearm swelling: bandage, ice, sling, and watch for compartment syndrome.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-closure-q1",
      stem: "A 6 Fr femoral PCI is complete. ACT 260 seconds. The femoral angiogram shows the sheath entering a 7 mm, disease-free common femoral artery above the lowest point of the inferior epigastric artery, far above the bifurcation. According to Brilakis's algorithm, how should the artery be closed?",
      options: [
        "A collagen-plug device, the most straightforward device in an artery of this size",
        "Manual compression straight away, because a 6 Fr hole closes quickly",
        "Suture the sheath in and compress by hand once the ACT is below 180 seconds",
        "A suture-mediated device, because the artery qualifies but the puncture is high",
      ],
      answer: 3,
      explanation:
        "The artery passes question 2 (larger than 5 mm, no significant disease, entered above the bifurcation), so a device can be used. Question 3 then asks about a high stick: entry above the inguinal ligament and the inferior epigastric artery excludes the collagen plug, which may not reach the artery and is linked to retroperitoneal bleeding, and the suture device is preferred. Waiting for the ACT is the branch for patients who cannot have a device, and a high puncture may not be compressible at all. (Elsewhere Brilakis advises avoiding any closure device after a high stick; whatever is chosen, watch for retroperitoneal bleeding.)",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-closure-q2",
      stem: "Which femoral sheath should NOT be removed at the end of a successful PCI, according to Brilakis?",
      options: [
        "One in a patient whose ACT is 175 seconds and whose blood pressure is 128/70 mmHg",
        "One in a patient booked for staged PCI of another vessel later the same afternoon",
        "One in a patient whose angiogram shows entry below the bifurcation",
        "One with a persistent ooze of blood around it from a slightly larger arteriotomy",
      ],
      answer: 1,
      explanation:
        "A staged PCI within a few hours, or a support device likely to be needed in the next few hours, is the reason to leave the sheath in, secured with sutures. A puncture below the bifurcation rules out a device but not removal and compression. Ooze around the sheath is a reason to remove it now, or to upsize it if the arteriotomy is larger than the sheath. An ACT of 175 with a normal blood pressure allows removal.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q3",
      stem: "How long does Brilakis suggest holding manual compression after removing an 8 Fr femoral sheath?",
      options: ["About 6–8 minutes", "About 8–10 minutes", "About 16–24 minutes", "About 30–45 minutes"],
      answer: 2,
      explanation:
        "Brilakis's rule is about 2–3 minutes for each French size: 16–24 minutes for 8 Fr (and 12–18 for 6 Fr). Oxford gives about 8–10 minutes for a femoral sheath, so the books differ, and in every case pressure continues until haemostasis is secure. Compression of more than 30–45 minutes is what Brilakis describes for closing a pseudoaneurysm with the ultrasound probe, not routine sheath removal.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-closure-q4",
      stem: "During deployment of a collagen-plug device, the tamper tube appears as the sheath leaves the skin. When should you begin advancing it?",
      options: [
        "Immediately, so the collagen is compacted before the anchor can slip back into the lumen",
        "After cutting the suture below the clear stop, so the tamper can run freely down the track",
        "As soon as blood reappears from the drip hole, confirming the sheath tip is just inside",
        "Only once resistance at the back of the device tells you the anchor sits on the inner wall",
      ],
      answer: 3,
      explanation:
        "Brilakis stresses that the tamper must not be advanced until resistance is felt at the back end of the device, which means the anchor is against the wall. Tamping earlier is one of the ways the plug ends up inside the artery and causes acute limb ischaemia. The drip hole belongs to the locator step, much earlier, and the suture is cut only after tamping.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q5",
      stem: "A collagen-plug anchor is pulled straight out through the arteriotomy, with brisk bleeding. The procedural sheath was 8 Fr. What was the most likely error, and the first response?",
      options: [
        "A 6 Fr device was used for an 8 Fr hole; hold manual pressure, then reverse heparin and image if it fails",
        "The anchor was deployed in a high stick; give a second plug over a new wire through the same arteriotomy",
        "The locator was advanced too far into the iliac artery; push the anchor back in and retamp more firmly",
        "The suture was cut too early; pull the remaining suture to reseat the anchor against the inner arterial wall",
      ],
      answer: 0,
      explanation:
        "Poor sizing (a 6 Fr device for an 8 Fr sheath) and an over-forceful pull are Brilakis's causes of a pulled-through anchor. The 6 Fr device suits 6 and 7 Fr sheaths and the 8 Fr device 8 Fr sheaths. Treatment is manual pressure; if that fails, reversal of anticoagulation and angiography to look for significant arterial injury. There is no wire left in, so a second device cannot simply be passed.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q6",
      stem: "In the suture-mediated device sequence, what confirms that the foot is against the inner wall of the artery just before the needles are fired?",
      options: [
        "Pulsatile flow starts from the marker lumen as the device is pulled back at 45°",
        "The wire exit port appears above the skin as the device is withdrawn",
        "Marker-lumen flow stops or falls sharply as you pull back against resistance",
        "The black compaction marker becomes visible on the suture at the skin",
      ],
      answer: 2,
      explanation:
        "Pulsatile marker flow begins when the device tip is inside the artery, before the foot is opened. After the foot is deployed at 45°, pulling back until resistance brings it against the wall, and the marker flow stops or falls sharply. The exit port appears later, when the device is withdrawn after the foot is closed, and the black marker belongs to the collagen-plug device.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q7",
      stem: "At the end of primary PCI through a 6 Fr right radial sheath, the ACT is 340 seconds and a cangrelor infusion is running. When should the sheath be removed?",
      options: [
        "Now, after a side-arm vasodilator, with a band and patent haemostasis",
        "When the ACT is below 180 seconds, as for a femoral sheath",
        "After the cangrelor infusion has finished and its effect has worn off",
        "The next morning, with the sheath flushed and transduced overnight",
      ],
      answer: 0,
      explanation:
        "Unlike femoral sheaths, radial sheaths come out as soon as the case is over and no further PCI or monitoring through them is needed, whatever the ACT and despite intravenous glycoprotein IIb/IIIa inhibitors or cangrelor (Brilakis); Oxford says they are almost always removed at once. A radial sheath that stays would need careful flushing and a pressure line, but there is no reason to keep this one. The 180-second rule is for femoral sheaths.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-closure-q8",
      stem: "In the PROPHET-II trial of 3000 radial diagnostic patients, what reduced 30-day radial artery occlusion from 3.0% to 0.9%?",
      options: [
        "Shortening band compression from 6 hours to 2 hours in every patient in the trial",
        "Adding compression of the ipsilateral ulnar artery during patent haemostasis",
        "Doubling the heparin dose from 50 units/kg to 100 units/kg",
        "Replacing the compression band with manual patent haemostasis",
      ],
      answer: 1,
      explanation:
        "PROPHET-II randomised patients to patent haemostasis alone or with prophylactic ipsilateral ulnar compression, which raises radial flow; 30-day occlusion fell from 3.0% to 0.9%. The 6-hour against 2-hour comparison was a separate retrospective study (8.5% against 3.5% at 30 days). Manual against mechanical patent haemostasis was MEMORY, which found no significant difference. Brilakis mentions that 100 units/kg of heparin may be more effective, but that was not this trial.",
      difficulty: 3,
      refs: ["pancholy-prophet-ii-2016", "pancholy-compression-duration-2012", "petroglou-memory-2018", "brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q9",
      stem: "A radial band is placed centred over the skin puncture after a shallow-angle puncture. Shortly afterwards, the forearm above the band begins to swell. What does this tell you about the band?",
      options: [
        "It was inflated with too much air and has occluded the radial artery",
        "It sits too proximal, because the arterial hole lies distal to the skin hole",
        "It is correctly placed; forearm swelling is expected after a 7 Fr sheath",
        "It sits too distal, because the arterial hole lies proximal to the skin hole",
      ],
      answer: 3,
      explanation:
        "After a shallow needle angle in particular, the hole in the artery usually lies proximal to the hole in the skin. A band centred on the skin hole is therefore too distal, and the artery bleeds into the forearm; a band too proximal gives a wrist haematoma instead. Brilakis places the band slightly proximal to the puncture. Over-inflation occludes the artery but does not explain bleeding above the band.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-closure-q10",
      stem: "Two hours after a femoral PCI closed with a collagen plug, a 72-year-old woman becomes hypotensive (86/50 mmHg, heart rate 112/min), sweaty and complains of lower back pain. The groin looks normal. What is the best management?",
      options: [
        "Raise the legs and give atropine for a vasovagal reaction, since the groin looks normal",
        "Arrange a CT of the abdomen and pelvis before any other intervention, since she is not bleeding externally",
        "Resuscitate, hold pressure over the groin and take her to the lab for angiography from the other groin",
        "Reassure the team, because a closure device rules out retroperitoneal bleeding",
      ],
      answer: 2,
      explanation:
        "Hypotension, sweating and back pain within the first hours after femoral access are retroperitoneal bleeding until proven otherwise, and a closure device does not exclude it; female sex and plug use are independent associations in the series Brilakis cites. She is unstable, so after general measures (large-bore access, saline, crossmatch, pressure held over the access site) Brilakis sends unstable patients to the lab or theatre and notes that going straight back to the lab may be better than imaging that delays treatment. Anticoagulation is reversed once the bleed is established (protamine for heparin, stopping any glycoprotein IIb/IIIa inhibitor or cangrelor), remembering the stent-thrombosis risk of protamine after stenting. CT suits stable patients, and the tachycardia argues against a vagal reaction.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "ellis-retroperitoneal-2006"],
    },
    {
      id: "pm-closure-q11",
      stem: "A patient returns six weeks after a right femoral PCI that was closed with a collagen-plug device. What does Brilakis's planning checklist advise for access today?",
      options: [
        "Puncture the same spot, since the plug has been absorbed by six weeks",
        "Consider the left femoral artery or a radial, because the plug was used within 90 days",
        "Puncture 2 cm below the previous site to avoid the plug, staying in the femoral artery",
        "Use the right femoral artery but close with manual compression only this time",
      ],
      answer: 1,
      explanation:
        "Brilakis advises considering the contralateral femoral artery or a radial if a collagen-plug device was used within 90 days; its anchor, suture and collagen take 60–90 days to be absorbed, and at access he avoids recently placed closure devices. A lower puncture risks entering below the bifurcation, with pseudoaneurysm and fistula, and a different closure method does nothing about the plug in the wall.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Close a femoral case by the algorithm: review the femoral angiogram, decide whether the sheath can come out and whether a device can be used, and either deploy the device or wait for an ACT below 180 seconds and compress by hand for 2–3 minutes per French size." },
    { sim: "procedure", task: "Close a high femoral stick with a suture-mediated device, reinserting a wire through the exit port before removing the device and sliding the knot." },
    { sim: "procedure", task: "Finish a radial PCI with a large sheath and a high ACT: vasodilator, band placement just above the puncture, inflation and deflation to the bleeding point, then patent haemostasis proved with the ulnar artery compressed." },
  ],
  caseIds: ["pm-closure-case-groin", "pm-closure-case-wrist"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-closure-case-groin",
    title: "Closing a high femoral stick",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 11.1, 3.4, 29.1 and 30.15; Oxford Handbook, chapter 3 (femoral line removal, arterial closure devices) and chapter 10 (vasovagal reaction, vascular complications)",
    },
    summary: "Closing a 6 Fr femoral sheath after PCI: reading the angiogram, choosing between compression and the two device classes for a high puncture, deploying a suture device when its first stitch is doubtful, and recognising bleeding afterwards.",
    presentation:
      "A 67-year-old woman, 58 kg, has had PCI of a proximal LAD stenosis for an NSTEMI through a 6 Fr right femoral sheath (a radial approach failed at the start because of a radial loop). She received unfractionated heparin; no glycoprotein IIb/IIIa inhibitor. The result is good and no further procedure is planned.",
    findings: [
      "Blood pressure 138/76 mmHg, sinus rhythm 74/min",
      "ACT at the end of the case 265 seconds",
      "No history of infection or immunosuppression; no previous groin procedures",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The PCI is finished. How do you begin the closure?",
        options: [
          {
            text: "Review the femoral angiogram taken through the sheath: puncture height, bifurcation, artery size, disease and calcium",
            best: true,
            feedback: "The femoral angiogram is the basis of the closure decision (Brilakis 11.1.3); with no staged procedure or support device planned, question 1 of the algorithm says the sheath can come out.",
          },
          {
            text: "Ask the nurse to pull the sheath now and hold firm pressure for 15 minutes",
            next: "c-early-pull",
            feedback: "An ACT of 265 is well above Brilakis's threshold of 180 seconds for manual compression, and you have not looked at where the sheath enters.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Leave the sheath in overnight and pull it on the morning ward round",
            feedback: "No staged procedure or support device is planned, so there is no reason to keep it; prolonged dwelling, such as overnight, is one of Brilakis's causes of access-site infection.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-early-pull",
        kind: "consequence",
        prompt: "Before the nurse starts, the physiologist reads out the last ACT: 265 seconds. The nurse asks whether to go ahead. What do you say?",
        options: [
          {
            text: "Not yet: keep the sheath in, review the femoral angiogram and choose the closure; hand compression waits for an ACT below 180 seconds",
            best: true,
            feedback: "Manual compression is delayed until the ACT is below 180 seconds (Brilakis 11.1.5); a device may be possible sooner, but only after the angiogram has been read.",
          },
          {
            text: "Go ahead: 15 minutes of firm pressure will overcome the heparin",
            feedback: "Anticoagulation is one of Brilakis's causes of compression bleeding, and at an ACT of 265 the sheath should not come out for hand compression. The attending stops the nurse before the sheath is pulled and asks you to look at the angiogram first.",
            stateDelta: { stability: -10, flags: ["early-pull"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The angiogram (ipsilateral oblique) shows the sheath entering a disease-free 7 mm common femoral artery, with no calcium, well above the bifurcation, but above the lowest loop of the inferior epigastric artery. Which closure do you choose?",
        info: "The ACT is now 250 seconds.",
        variants: [{ flag: "early-pull", info: "The sheath is still in: the attending stopped the early pull." }],
        options: [
          {
            text: "A suture-mediated device",
            best: true,
            feedback: "The artery qualifies for a device, and the high stick excludes the collagen plug: question 3 points to the suture device (Brilakis 11.1.4).",
          },
          {
            text: "A collagen-plug device, since the artery is large and clean",
            next: "c-plug-high",
            feedback: "In a high stick the plug may not reach the artery and may catch in the abdominal wall; plug use and a sheath above the inferior epigastric artery are both associated with retroperitoneal bleeding.",
            stateDelta: { stability: -15, flags: ["plug-high-stick"] },
          },
          {
            text: "Suture the sheath in and compress by hand once the ACT is below 180 seconds",
            feedback: "Brilakis calls a high puncture noncompressible: there is no bone behind it. Waiting for the ACT is the algorithm's branch when no device can be used; when one can, the algorithm sends a high stick to the suture device. Brilakis elsewhere advises avoiding any device after a high stick (11.1.7.8.2.1), but this case follows his algorithm, which prefers the suture device.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "c-plug-high",
        kind: "consequence",
        prompt: "The plug is deployed, but the groin oozes and the tamper never met firm resistance. What do you do?",
        options: [
          {
            text: "Hold manual pressure; if bleeding continues or she becomes unstable, treat it as retroperitoneal bleeding and go back to the lab",
            best: true,
            feedback: "In a high stick the plug may never reach the artery (Brilakis 11.1.4). Hold pressure, and if bleeding continues or the patient becomes unstable, manage it as retroperitoneal bleeding: resuscitate, reverse anticoagulation, and go back to the lab for angiography and endovascular repair rather than delaying for imaging (11.1.7.8.2.1).",
          },
          {
            text: "Tamp harder until the ooze stops",
            feedback: "Forcing the tamper without the anchor against the wall risks pushing collagen where it should not go; it does not solve the high stick.",
            stateDelta: { stability: -10, flags: ["retroperitoneal-risk"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The 0.035 inch wire is in the distal aorta and the sheath is out. You have opened the track with a haemostat and advanced the suture device over the wire until the exit port reached the skin, removed the wire and advanced further: pulsatile blood now comes from the marker lumen. What next?",
        options: [
          {
            text: "Hold the device at 45°, confirm marker flow, lift the lever to open the foot, then pull back until flow stops",
            best: true,
            feedback: "That is the sequence: 45°, continued marker flow, foot out, pull back until the foot meets the wall and marker flow stops or falls sharply, then fire.",
          },
          {
            text: "Fire the needles at once while the marker lumen is still bleeding",
            next: "c-loose",
            feedback: "Firing before the foot is opened and seated against the wall cannot capture the arterial wall correctly.",
            stateDelta: { stability: -10, flags: ["loose-suture"] },
          },
          {
            text: "Lay the device flat against the thigh to steady it, then open the foot",
            next: "c-loose",
            feedback: "Deployment at an angle other than 45° is one of Brilakis's causes of a cut or loose suture.",
            stateDelta: { stability: -10, flags: ["loose-suture"] },
          },
        ],
      },
      {
        id: "c-loose",
        kind: "consequence",
        prompt: "After firing and withdrawing to the exit port, the suture limbs come out but the knot will not tighten and bleeding continues. What do you do?",
        options: [
          {
            text: "Pass a wire back through the exit port into the artery, remove the device over it, and deploy a second device",
            best: true,
            feedback: "Brilakis's treatment for a cut or loose suture: wire back in through the device, remove it, deploy another.",
          },
          {
            text: "Remove the device and press, since the wire is no longer needed",
            feedback: "Without a wire you have lost the chance of a second device in an anticoagulated patient with a high puncture that is hard to compress.",
            stateDelta: { stability: -15, flags: ["lost-access"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The suture has been fired cleanly and you have withdrawn the device until the exit port shows above the skin. How do you finish?",
        options: [
          {
            text: "Load the knot pusher on the blue limb, withdraw the device under gentle tension, push the knot down, check haemostasis, lock with the white-tipped limb and trim",
            best: true,
            feedback: "The blue limb carries the knot and the white-tipped limb locks it; push further if it still bleeds, then cut both limbs with the trimmer.",
          },
          {
            text: "Pull the white-tipped limb first to lock the knot, then push it down with the knot pusher",
            feedback: "Locking first prevents the knot sliding down to the arteriotomy. The knot is advanced on the blue limb and locked only once haemostasis is confirmed.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Cut both limbs at the skin and apply a pressure dressing",
            feedback: "An untied suture closes nothing; the knot must be pushed down and locked.",
            stateDelta: { stability: -15, flags: ["groin-haematoma"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Haemostasis is secure. What is your plan before she leaves the lab?",
        options: [
          {
            text: "Clear sterile dressing, check for haematoma and distal pulses, and hand over to watch for hypotension and back or abdominal pain in the next hours",
            best: true,
            feedback: "Check the groin and the foot, keep the site visible, and warn the ward: retroperitoneal bleeding usually shows itself within about 3 hours and a closure device does not exclude it.",
          },
          {
            text: "A thick pressure pad strapped over the groin, and routine observations only",
            acceptable: true,
            feedback: "Observations are needed, but a thick pad hides the site, and the ward should be told specifically what to look for after a high femoral puncture.",
          },
        ],
      },
      {
        id: "s6",
        prompt: "Two and a half hours later she is pale and sweaty, blood pressure 84/48 mmHg, heart rate 114/min, with lower back pain. The groin is soft and dry. What do you do?",
        variants: [
          { flag: "plug-high-stick", info: "Her groin was closed with a collagen plug in a high stick." },
          { flag: "groin-haematoma", info: "A groin haematoma from earlier is unchanged in size." },
        ],
        options: [
          {
            text: "Large-bore IV access, saline and crossmatch, pressure over the groin, then back to the lab for angiography from the other groin",
            best: true,
            feedback: "Suspect retroperitoneal bleeding in every hypotensive femoral patient. She is unstable, so after general measures (including holding pressure over the access site) Brilakis takes her to the lab (or theatre) rather than delaying for CT; in the lab, bladder fluoroscopy and femoral angiography find the source for balloon tamponade, a covered stent or coils. Reverse anticoagulation once the bleed is established (Brilakis Fig 29.4): protamine for heparin, stopping any glycoprotein IIb/IIIa inhibitor or cangrelor.",
          },
          {
            text: "Raise the legs, give atropine and saline for a vasovagal reaction",
            feedback: "A vagal reaction slows the heart before the pressure falls; a heart rate of 114 with back pain after femoral access points to bleeding. Even a slow pulse would not have excluded a retroperitoneal bleed, which often causes bradycardia.",
            stateDelta: { stability: -20, flags: ["delayed-diagnosis"] },
          },
          {
            text: "Send her for CT of the abdomen and pelvis before deciding anything",
            acceptable: true,
            feedback: "CT is the test for stable patients. In an unstable patient Brilakis warns that imaging may delay treatment, and the series he cites recorded deaths linked to delays while CT confirmation was sought.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "Angiography from the left groin shows a small leak from the right external iliac artery at the puncture, sealed by a low-pressure balloon inflation. She is transfused one unit and recovers.",
    outcomeVariants: [
      { flag: "early-pull", text: "A sheath pull at an ACT of 265, before the angiogram had been read, was stopped only by the attending." },
      { flag: "plug-high-stick", text: "The collagen plug in a high stick never seated properly and the bleeding that followed was retroperitoneal." },
      { flag: "loose-suture", text: "The first suture was loose and a second device was needed." },
      { flag: "lost-access", text: "Removing the failed device without a wire lost access to a high, hard-to-compress puncture." },
      { flag: "delayed-diagnosis", text: "Treating her hypotension as vasovagal delayed recognition of retroperitoneal bleeding." },
    ],
    learningPoints: [
      "Close a femoral artery from the angiogram: size, disease, calcium, bifurcation and puncture height decide the method.",
      "High stick: no collagen plug; a suture device is preferred.",
      "Manual compression waits for an ACT below 180 seconds (Brilakis).",
      "Suture device: 45°, marker flow, foot out, pull to the wall until flow stops, fire; wire back in through the exit port when in doubt.",
      "Blue limb carries the knot, white-tipped limb locks it.",
      "Hypotension with tachycardia and back pain after femoral access is retroperitoneal bleeding until proven otherwise; an unstable patient goes back to the lab.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "ellis-retroperitoneal-2006"],
  },
  {
    id: "pm-closure-case-wrist",
    title: "A radial band after primary PCI",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 11.2, 4.3 and 29.2; Oxford Handbook, chapter 3 (radial line removal, radial compression devices, complications) and chapter 2 (post-procedure monitoring)",
    },
    summary: "Removing a 7 Fr radial sheath with a high ACT and an antiplatelet infusion running: vasodilator, band placement, inflation to patent haemostasis, a gripped sheath, a haematoma above the band and the length of compression.",
    presentation:
      "A 54-year-old man, 70 kg, has had primary PCI to an occluded RCA through a 7 Fr right radial sheath. He received unfractionated heparin and a glycoprotein IIb/IIIa inhibitor infusion that is still running. The result is good.",
    findings: [
      "Blood pressure 124/72 mmHg, sinus rhythm 82/min",
      "ACT 330 seconds",
      "Good radial and ulnar pulses before the case",
    ],
    steps: [
      {
        id: "s1",
        prompt: "When will you take out the radial sheath?",
        options: [
          {
            text: "Now, at the end of the procedure",
            best: true,
            feedback: "Radial sheaths come out immediately, even with a high ACT and during IV glycoprotein IIb/IIIa inhibitors or cangrelor (Brilakis 11.2.1).",
          },
          {
            text: "Once the ACT is below 180 seconds",
            next: "c-retained",
            feedback: "That is the femoral rule. A retained radial sheath has to be flushed and transduced, and the time it dwells adds nothing.",
            stateDelta: { stability: -10, flags: ["retained-sheath"] },
          },
          {
            text: "After the antiplatelet infusion finishes tomorrow",
            next: "c-retained",
            feedback: "There is no reason to keep a radial sheath during the infusion; Brilakis removes it straight away.",
            stateDelta: { stability: -10, flags: ["retained-sheath"] },
          },
        ],
      },
      {
        id: "c-retained",
        kind: "consequence",
        prompt: "The sheath has been left in. What must be done while it stays?",
        options: [
          {
            text: "Flush it carefully and connect it to a pressure transducer, and plan its removal as soon as possible",
            best: true,
            feedback: "Brilakis requires careful flushing and a connection to a pressure transducer for any radial sheath left in, because otherwise it can thrombose and embolise (11.2.1). Better still, take it out.",
          },
          {
            text: "Cap it and leave it closed until the morning",
            feedback: "A capped, unflushed sheath invites thrombus and embolism.",
            stateDelta: { stability: -10, flags: ["sheath-thrombus"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "What do you give before removing the sheath?",
        options: [
          {
            text: "Through the side arm, verapamil 2–3 mg, nitroglycerin 200–500 micrograms, or both, mixed 1:1 with aspirated blood",
            best: true,
            feedback: "A side-arm vasodilator prevents or relieves spasm so the sheath comes out, and may lower the risk of occlusion; mixing it with blood reduces discomfort.",
          },
          {
            text: "Protamine, to bring the ACT down before the sheath comes out",
            feedback: "Reversal is not needed for radial removal, and protamine can cause hypotension and hypersensitivity reactions; it also removes the anticoagulation whose absence Brilakis lists as a cause of radial occlusion.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Nothing: the patient was given a vasodilator at the start",
            acceptable: true,
            feedback: "The start-of-case vasodilator helps, but Brilakis gives another through the side arm before removal, for spasm and because it may reduce occlusion.",
          },
        ],
      },
      {
        id: "s3",
        prompt: "As you start to pull the sheath, it grips and the patient winces with forearm pain. What next?",
        options: [
          {
            text: "Stop pulling; give more vasodilator, more sedation and warm blankets, and if needed inflate an upper-arm cuff above systolic for 5 minutes before trying again",
            best: true,
            feedback: "Brilakis's measures for a gripped radial sheath. Forceful withdrawal can avulse the radial artery.",
          },
          {
            text: "Pull steadily harder until it comes free",
            next: "c-avulsion",
            feedback: "Excessive force in spasm can avulse the radial artery (Brilakis Fig 29.12).",
            stateDelta: { stability: -25, flags: ["radial-injury"] },
          },
        ],
      },
      {
        id: "c-avulsion",
        kind: "consequence",
        prompt: "The sheath comes out suddenly with a strip of tissue, and the forearm begins to swell quickly. What do you do?",
        options: [
          {
            text: "Compress firmly, elevate the arm, inflate a cuff, reverse anticoagulation as needed and involve the vascular surgeons early, watching for compartment syndrome",
            best: true,
            feedback: "Severe radial bleeding can progress to compartment syndrome; Oxford advises early vascular surgical involvement when it is suspected. Its full management is taught in the access complications module.",
          },
          {
            text: "Apply the band tightly and recheck in two hours",
            feedback: "A band at the wrist cannot control bleeding higher in the forearm, and two hours is far too long to wait.",
            stateDelta: { stability: -15, flags: ["compartment-risk"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "With the spasm settled, how do you place and set the band?",
        options: [
          {
            text: "Band just above the skin puncture; inflate 10–15 mL as the sheath comes out, deflate slowly until it bleeds, then add 2–3 mL",
            best: true,
            feedback: "The arterial hole is usually proximal to the skin hole. Inflate, find the bleeding point, then add back a small volume (Brilakis 11.2.4).",
          },
          {
            text: "Band centred exactly over the skin puncture, inflated to the maximum the band allows",
            next: "c-forearm",
            feedback: "A band centred on the skin hole is often too distal, and maximum inflation is occlusive compression.",
            stateDelta: { stability: -10, flags: ["band-distal"] },
          },
        ],
      },
      {
        id: "c-forearm",
        kind: "consequence",
        prompt: "Within minutes a swelling appears just above the band. What now?",
        options: [
          {
            text: "Reposition the band over the arterial hole or add a second band against the first, elevate the arm, and reduce the inflation to patent haemostasis",
            best: true,
            feedback: "Brilakis repositions or adds a band; Oxford places a second device against the first for a haematoma just proximal to it.",
          },
          {
            text: "Add more air to the same band",
            feedback: "More air at the wrong spot occludes the radial without reaching the bleeding point.",
            stateDelta: { stability: -10, flags: ["occlusive-band"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The site is dry. The oximeter is on the index finger. You compress the ulnar artery and the plethysmograph trace disappears. What do you do?",
        options: [
          {
            text: "Release air slowly until the trace returns, keeping it dry; if it bleeds at that pressure, use manual compression",
            best: true,
            feedback: "That is patent haemostasis: radial flow kept during compression, the main defence against occlusion (PROPHET).",
          },
          {
            text: "Leave it: the site is dry and that is what matters",
            feedback: "A flat trace with the ulnar compressed means the band has occluded the radial; occlusive compression was the strongest predictor of occlusion in the study Brilakis cites.",
            stateDelta: { stability: -10, flags: ["occlusive-band"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "What is the plan for the band and the observations?",
        options: [
          {
            text: "Band off at 1–2 hours, with wound checks every 15 minutes until then and a radial patency check",
            best: true,
            feedback: "Brilakis leaves the band for 1–2 hours because longer compression raises occlusion; Oxford checks the wound every 15 minutes until the device is off, looking at colour, sensation, temperature, swelling, pulse and pain.",
          },
          {
            text: "Band on for 6 hours because the glycoprotein IIb/IIIa infusion is still running",
            feedback: "Brilakis's advice is 1–2 hours, because longer compression raises the risk of occlusion: in the study he cites, 6 hours of compression gave more than twice the occlusion rate of 2 hours.",
            stateDelta: { stability: -5, flags: ["occlusive-band"] },
          },
        ],
      },
    ],
    outcome: "The band comes off at 2 hours with no bleeding. The radial pulse is present and the plethysmograph trace persists with the ulnar artery compressed.",
    outcomeVariants: [
      { flag: "retained-sheath", text: "Keeping the radial sheath in added time and thrombosis risk without benefit." },
      { flag: "sheath-thrombus", text: "A capped, unflushed sheath risked thrombus and embolism into the hand." },
      { flag: "radial-injury", text: "Forcing a gripped sheath injured the radial artery and caused a forearm haematoma that needed surgical review." },
      { flag: "compartment-risk", text: "A forearm bleed managed only with a wrist band put the forearm at risk of compartment syndrome." },
      { flag: "band-distal", text: "A band placed too distally let the artery bleed above it." },
      { flag: "occlusive-band", text: "Occlusive compression left the radial artery at higher risk of occlusion." },
    ],
    learningPoints: [
      "A radial sheath comes out as soon as the case ends, whatever the ACT, unless further PCI or monitoring through it is needed.",
      "Side-arm vasodilator before removal; never pull a gripped sheath by force.",
      "Band just above the skin puncture: 10–15 mL, deflate to bleeding, add 2–3 mL.",
      "Prove patency with the ulnar artery compressed and the oximeter on the index finger.",
      "Band off at 1–2 hours; a haematoma above it needs repositioning or a second band.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "pancholy-prophet-2008", "pancholy-compression-duration-2012"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

// The access route each tip belongs to, so that a radial closure does not show femoral device and
// compression tips and the reverse (TipTrigger.route in src/content/lab/tips.ts). The access lab must
// report the route with phase "closure" (docs/curriculum/lab-requests/pm-closure.json).
const FEMORAL: { route: "femoral"[] } = { route: ["femoral"] };
const RADIAL: { route: "radial"[] } = { route: ["radial"] };

export const tips: LabTip[] = [
  {
    id: "access-closure-sheath-stays",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "First ask whether the sheath should come out",
    text: "Keep a femoral sheath if a staged PCI is planned within a few hours or a support device may be needed soon: suture it in and swap a long sheath for a 10–13 cm one. If blood oozes around it, remove it now, or put in a larger sheath when the arteriotomy is bigger than the sheath.",
    tone: "do",
    lessonId: "pm-closure-plan",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-closure-device-criteria",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Read the femoral angiogram before choosing a device",
    text: "A closure device needs a common femoral artery larger than 5 mm, without significant disease, entered above the bifurcation. Heavy calcium rules out the suture device. Below the bifurcation, in a branch or in a small artery, compress instead.",
    tone: "do",
    lessonId: "pm-closure-plan",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-closure-high-stick",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "High stick: no collagen plug",
    text: "If the sheath enters above the inguinal ligament or the inferior epigastric artery, do not use a collagen plug: it may not reach the artery and is linked to retroperitoneal bleeding. A suture device is preferred, and the patient needs watching for hypotension and back or abdominal pain.",
    tone: "caution",
    lessonId: "pm-closure-plan",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "brilakis-pci", loc: "29.1" },
    ],
    refs: ["brilakis-manual-pci", "ellis-retroperitoneal-2006"],
  },
  {
    id: "access-closure-reprep-skin",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Prepare the skin again before a device",
    text: "Repeat the antiseptic preparation of the groin immediately before deploying a closure device, especially after a long case, and cover the site with a sterile dressing straight afterwards.",
    tone: "do",
    lessonId: "pm-closure-plan",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "brilakis-pci", loc: "29.1" },
      { book: "oxford-cath", loc: "ch 3: Arterial closure devices" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-compression-prepare",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Femoral compression: prepare before you pull",
    text: "Have telemetry and blood pressure monitoring on, someone ready with atropine and fluids, saline running, sterile gloves on and a raised blood pressure treated before the femoral sheath comes out.",
    tone: "do",
    lessonId: "pm-closure-femoral-compression",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-compression-hands-above",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Femoral compression: fingers above the skin hole",
    text: "The arterial hole lies above the skin puncture, so press there (Oxford: at least two fingers, 1 cm proximal to the arterial puncture). Pull the sheath with a small back-bleed, then press firmly for about 2–3 minutes per French size (Oxford: about 8–10 minutes) and until haemostasis.",
    tone: "do",
    lessonId: "pm-closure-femoral-compression",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 3: Femoral artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-compression-bleeding",
    lab: "access",
    when: { phase: ["closure"], event: ["bleeding", "haematoma"], ...FEMORAL },
    title: "Bleeding under your fingers: reposition and press",
    text: "Usual causes are hands too low or to one side, too little pressure, anticoagulation, hypertension and obesity. Move the hands over the arterial hole, press firmly, lower the blood pressure, and escalate to endovascular or surgical treatment if haemostasis cannot be achieved; a mechanical compressor can help in obese or hypertensive patients.",
    tone: "bailout",
    lessonId: "pm-closure-femoral-compression",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 3: Compression devices" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-compression-vasovagal",
    lab: "access",
    when: { phase: ["closure"], event: ["bradycardia"], ...FEMORAL },
    title: "Slow and low during compression: think vagal, then think again",
    text: "Bradycardia, pallor, sweating and nausea during sheath removal suggest a vasovagal reaction: keep pressing, raise the legs, give atropine and fast saline. If the patient is tachycardic or does not recover within minutes, look for bleeding and tamponade; a retroperitoneal bleed can also slow the heart.",
    tone: "bailout",
    lessonId: "pm-closure-femoral-compression",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 10: Vasovagal reaction" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-closure-hypotension-retroperitoneal",
    lab: "access",
    when: { phase: ["closure", "complication"], event: ["hypotension"], ...FEMORAL },
    title: "Hypotension after femoral closure: retroperitoneal bleeding until proven otherwise",
    text: "A falling blood pressure during or after femoral sheath removal or closure is retroperitoneal bleeding until proven otherwise, particularly with sweating and back, lower abdominal or suprapubic pain; a closure device does not exclude it, and the pulse may even be slow. Get large-bore IV access, give saline, crossmatch and hold pressure over the groin; in the lab, look for a displaced bladder and image from the other groin.",
    tone: "bailout",
    lessonId: "pm-closure-femoral-compression",
    sources: [{ book: "brilakis-pci", loc: "29.1" }],
    refs: ["brilakis-manual-pci", "ellis-retroperitoneal-2006"],
  },
  {
    id: "access-plug-locator-drip",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Collagen plug: let the drip hole find the wall",
    text: "Advance the insertion sheath and locator until blood drips, pull back until it stops, then advance until it just returns. Hold the sheath completely still while the dilator and wire come out and the device goes in.",
    tone: "do",
    lessonId: "pm-closure-plug-device",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-plug-no-tamp-before-resistance",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Collagen plug: no tamping before the anchor stops",
    text: "Withdraw at about 45° and wait for resistance at the back of the device before advancing the tamper; then keep tension and tamp together for 8–10 seconds. Tamping early can leave the plug inside the artery.",
    tone: "caution",
    lessonId: "pm-closure-plug-device",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-plug-size-to-sheath",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Collagen plug: match the device to the sheath",
    text: "Use the 6 Fr device for 6 or 7 Fr sheaths (0.035 inch wire only) and the 8 Fr device for 8 Fr sheaths. An undersized device lets the anchor pull through the arteriotomy; if that happens, press, and reverse heparin and image if bleeding continues.",
    tone: "caution",
    lessonId: "pm-closure-plug-device",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "brilakis-pci", loc: "30.15" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-closure-cold-leg",
    lab: "access",
    when: { phase: ["closure", "complication"], event: ["limb-ischaemia"], ...FEMORAL },
    title: "Cold leg after closure: the device is the suspect",
    text: "A plug inside the artery or narrowing a small or diseased artery, or an over-tightened suture knot, can cause acute limb ischaemia. Image promptly and involve the vascular surgeons early; a plug often needs surgical removal.",
    tone: "bailout",
    lessonId: "pm-closure-plug-device",
    sources: [
      { book: "brilakis-pci", loc: "11.1" },
      { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-suture-45-foot",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Suture device: 45°, foot out, pull until the flow stops",
    text: "Advance until the marker lumen pulses, hold the device at 45°, open the foot, and pull back until you feel the wall and marker flow stops or falls sharply. Only then fire the needles.",
    tone: "do",
    lessonId: "pm-closure-suture-device",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-suture-keep-wire",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Suture device: wire back in when in doubt",
    text: "When the exit port reaches the skin, pass a 0.035 inch wire back into the artery if you doubt the suture or are closing a large hole, and remove the device over it. Take the wire out only when haemostasis is secure.",
    tone: "do",
    lessonId: "pm-closure-suture-device",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-suture-loose-second-device",
    lab: "access",
    when: { phase: ["closure"], event: ["bleeding"], ...FEMORAL },
    title: "Cut or loose suture: second device over a wire",
    text: "If the suture is cut or loose, put a wire back into the artery through the device, remove the device and deploy another. A device that will not come out is rotated gently both ways; if it still will not come, call the vascular surgeons.",
    tone: "bailout",
    lessonId: "pm-closure-suture-device",
    sources: [{ book: "brilakis-pci", loc: "11.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-remove-now",
    lab: "access",
    when: { phase: ["closure"], ...RADIAL },
    title: "Radial: the sheath comes out now",
    text: "Once no further PCI or haemodynamic monitoring through it is needed, remove a radial sheath at the end of the case, even with a high ACT or an IV glycoprotein IIb/IIIa inhibitor or cangrelor running. First give a vasodilator through the side arm, such as verapamil 2–3 mg, nitroglycerin 200–500 micrograms, or both, mixed 1:1 with aspirated blood.",
    tone: "do",
    lessonId: "pm-closure-radial",
    sources: [
      { book: "brilakis-pci", loc: "11.2" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-radial-band-inflation",
    lab: "access",
    when: { phase: ["closure"], ...RADIAL },
    title: "Radial band: just above the puncture, then find the bleeding point",
    text: "Place the band immediately above the skin puncture, because the arterial hole is usually proximal to it. Inflate 10–15 mL as the sheath comes out, let air out until it starts to bleed, then add back 2–3 mL.",
    tone: "do",
    lessonId: "pm-closure-radial",
    sources: [
      { book: "brilakis-pci", loc: "11.2" },
      { book: "brilakis-pci", loc: "29.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-radial-patency-check",
    lab: "access",
    when: { phase: ["closure"], ...RADIAL },
    title: "Radial band: prove the artery is open",
    text: "With the oximeter on the index finger, compress the ulnar artery. If the trace disappears, loosen the band until it returns or the site bleeds; if it bleeds at that pressure, compress by hand. Take the band off at 1–2 hours.",
    tone: "do",
    lessonId: "pm-closure-radial",
    sources: [{ book: "brilakis-pci", loc: "11.2" }],
    refs: ["brilakis-manual-pci", "pancholy-prophet-2008", "pancholy-compression-duration-2012"],
  },
  {
    id: "access-radial-band-bleeding",
    lab: "access",
    when: { phase: ["closure"], event: ["bleeding", "haematoma"], ...RADIAL },
    title: "Radial bleeding: move the band or add a second",
    text: "Reposition the band over the arterial hole or place a second band against the first, press by hand and elevate the arm; a cuff inflated above systolic can help. A slowly enlarging forearm haematoma needs a bandage, ice, a sling and a watch for compartment syndrome.",
    tone: "bailout",
    lessonId: "pm-closure-radial",
    sources: [
      { book: "brilakis-pci", loc: "11.2" },
      { book: "brilakis-pci", loc: "29.2" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "koreny-closure-meta-2004",
    kind: "paper",
    citation:
      "Koreny M, Riedmüller E, Nikfardjam M, Siostrzonek P, Müllner M. Arterial puncture closing devices compared with standard manual compression after cardiac catheterization: systematic review and meta-analysis. JAMA. 2004;291:350–357.",
    url: "https://doi.org/10.1001/jama.291.3.350",
    note: "PMID: 14734598. Checked on PubMed: authors, title, journal, year, volume 291, issue 3, pages 350–357. Oxford's further reading for closure devices.",
    verified: true,
  },
  {
    id: "robertson-closure-cochrane-2016",
    kind: "paper",
    citation:
      "Robertson L, Andras A, Colgan F, Jackson R. Vascular closure devices for femoral arterial puncture site haemostasis. Cochrane Database Syst Rev. 2016;3:CD009541.",
    url: "https://doi.org/10.1002/14651858.CD009541.pub2",
    note: "PMID: 26948236. Checked on PubMed: authors, title, journal, year, issue 3, article CD009541. Cited by Brilakis (11.1, 30.15).",
    verified: true,
  },
  {
    id: "schulz-schupke-isar-closure-2014",
    kind: "trial",
    citation:
      "Schulz-Schüpke S, Helde S, Gewalt S, et al. Comparison of vascular closure devices vs manual compression after femoral artery puncture: the ISAR-CLOSURE randomized clinical trial. JAMA. 2014;312:1981–1987.",
    url: "https://doi.org/10.1001/jama.2014.15305",
    note: "PMID: 25399273. Checked on PubMed: authors, title, journal, year, volume 312, issue 19, pages 1981–1987.",
    verified: true,
  },
  {
    id: "ellis-retroperitoneal-2006",
    kind: "paper",
    citation:
      "Ellis SG, Bhatt D, Kapadia S, Lee D, Yen M, Whitlow PL. Correlates and outcomes of retroperitoneal hemorrhage complicating percutaneous coronary intervention. Catheter Cardiovasc Interv. 2006;67:541–545.",
    url: "https://doi.org/10.1002/ccd.20671",
    note: "PMID: 16547938. Checked on PubMed: authors, title, journal, year, volume 67, issue 4, pages 541–545. Cited by Brilakis (11.1.3, 11.1.4).",
    verified: true,
  },
  {
    id: "grossman-nifedipine-1996",
    kind: "paper",
    citation:
      "Grossman E, Messerli FH, Grodzicki T, Kowey P. Should a moratorium be placed on sublingual nifedipine capsules given for hypertensive emergencies and pseudoemergencies? JAMA. 1996;276:1328–1331.",
    note: "PMID: 8861992. Checked on PubMed: authors, title, journal, year 1996, volume 276, issue 16, pages 1328–1331. Cited for the reported harms of sublingual nifedipine capsules (severe hypotension, cerebrovascular ischaemia, stroke, myocardial infarction, death), poor sublingual absorption, and the conclusion that this use should be abandoned.",
    verified: true,
  },
  {
    id: "pancholy-prophet-2008",
    kind: "trial",
    citation:
      "Pancholy S, Coppola J, Patel T, Roke-Thomas M. Prevention of radial artery occlusion-patent hemostasis evaluation trial (PROPHET study): a randomized comparison of traditional versus patency documented hemostasis after transradial catheterization. Catheter Cardiovasc Interv. 2008;72:335–340.",
    url: "https://doi.org/10.1002/ccd.21639",
    note: "PMID: 18726956. Checked on PubMed: authors, title, journal, year, volume 72, issue 3, pages 335–340. Cited by Brilakis (11.2.5).",
    verified: true,
  },
  {
    id: "pancholy-compression-duration-2012",
    kind: "paper",
    citation:
      "Pancholy SB, Patel TM. Effect of duration of hemostatic compression on radial artery occlusion after transradial access. Catheter Cardiovasc Interv. 2012;79:78–81.",
    url: "https://doi.org/10.1002/ccd.22963",
    note: "PMID: 21584923. Checked on PubMed: authors, title, journal, volume 79, issue 1, pages 78–81 (issue dated 2012; first published online 2011). Cited by Brilakis (11.2.5).",
    verified: true,
  },
  {
    id: "pancholy-prophet-ii-2016",
    kind: "trial",
    citation:
      "Pancholy SB, Bernat I, Bertrand OF, Patel TM. Prevention of radial artery occlusion after transradial catheterization: the PROPHET-II randomized trial. JACC Cardiovasc Interv. 2016;9:1992–1999.",
    url: "https://doi.org/10.1016/j.jcin.2016.07.020",
    note: "PMID: 27712733. Checked on PubMed: authors, title, journal, year, volume 9, issue 19, pages 1992–1999. Cited by Brilakis (11.2.5).",
    verified: true,
  },
  {
    id: "koutouzis-ultra-2016",
    kind: "paper",
    citation:
      "Koutouzis MJ, Maniotis CD, Avdikos G, Tsoumeleas A, Andreou C, Kyriakides ZS. ULnar artery Transient compression facilitating Radial Artery patent hemostasis (ULTRA): a novel technique to reduce radial artery occlusion after transradial coronary catheterization. J Invasive Cardiol. 2016;28:451–454.",
    note: "PMID: 27529655. Checked on PubMed: authors, title, journal, year, volume 28, issue 11, pages 451–454. Cited by Brilakis (11.2.5).",
    verified: true,
  },
  {
    id: "petroglou-memory-2018",
    kind: "trial",
    citation:
      "Petroglou D, Didagelos M, Chalikias G, et al. Manual versus mechanical compression of the radial artery after transradial coronary angiography: the MEMORY multicenter randomized trial. JACC Cardiovasc Interv. 2018;11:1050–1058.",
    url: "https://doi.org/10.1016/j.jcin.2018.03.042",
    note: "PMID: 29880098. Checked on PubMed: authors, title, journal, year, volume 11, issue 11, pages 1050–1058. Cited by Brilakis (11.2).",
    verified: true,
  },
  {
    id: "bernat-rao-consensus-2019",
    kind: "consensus",
    citation:
      "Bernat I, Aminian A, Pancholy S, et al. Best practices for the prevention of radial artery occlusion after transradial diagnostic angiography and intervention: an international consensus paper. JACC Cardiovasc Interv. 2019;12:2235–2246.",
    url: "https://doi.org/10.1016/j.jcin.2019.07.043",
    note: "PMID: 31753298. Checked on PubMed: first authors, title, journal, year, volume 12, issue 22, pages 2235–2246. Cited here only for its abstract's statement that radial occlusion is the most frequent post-procedural complication of radial access and limits the artery's later use.",
    verified: true,
  },
];
