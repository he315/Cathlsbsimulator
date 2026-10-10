// Module cm-access-complications: vascular access complications (manual curriculum, track complication-management).
// Sources: Brilakis, Manual of PCI: chapter 29 (29.1 femoral: limb ischaemia, bleeding with the retroperitoneal algorithm
// of Fig. 29.4, pseudoaneurysm, arteriovenous fistula, infection, nerve injury; 29.2 radial: bleeding with the forearm
// haematoma grading of Fig. 29.10, occlusion, spasm, pseudoaneurysm, sterile granuloma), chapter 14 (14.1 large-bore
// femoral requirements and alternatives; 14.3 to 14.5 the access steps and failure modes of the balloon pump, the
// microaxial pump and VA-ECMO), and the related passages in 2.7, 4.1, 4.2.3, 4.2.6, 4.2.15, 4.3, 5.2.5, 5.3.3, 11.1,
// 11.2, 28.1, 30.1 and 30.15. Oxford Handbook of Cardiac Catheterization and Coronary Intervention: ch 10 (risks of
// complications, vascular complications with Box 10.1 thrombin injection, limb ischaemia), ch 3 (radial and femoral
// artery access complications, compression devices, arterial closure devices), ch 8 (consent figures) and ch 9 (the
// microaxial pump and ECMO complication lists). Large-bore crossover balloon occlusion and bail-out stent grafting from
// PubMed-checked papers (sharp-crossover-tavi-2010, buchanan-modified-crossover-2013, zaman-cbot-2016,
// stortecky-tavi-vascular-2012), the last of which Brilakis cites in 29.1.2.4. Round-1 additions: fluid strategy in
// major bleeding (rossaint-trauma-bleeding-2023, trauma guidance extrapolated), the retroperitoneal series Brilakis cites
// in 11.1 (ellis-retroperitoneal-2006), distal radial access (aminian-disco-radial-2022, defined in pm-access) and
// anaphylaxis to bovine thrombin (pope-thrombin-anaphylaxis-2000, jalaeian-thrombin-anaphylaxis-2015,
// quarmby-autologous-thrombin-2002).
// Every claim is listed with its page in docs/curriculum/evidence/cm-access-complications.md.
// Neighbouring modules: pm-access (puncture technique, the large-bore pre-close and the antegrade perfusion sheath),
// pm-closure (manual compression, closure devices step by step, radial patent haemostasis), pm-engaging (radial spasm
// during engagement), pm-support-devices (running the balloon pump, the microaxial pump and VA-ECMO), cm-patient-complications
// (major bleeding in general, hypotension, cholesterol embolisation and the kidneys). Academy lessons this module builds on:
// comp-access-radial, comp-access-femoral and the case comp-case-retroperitoneal (track complications), mcs-ecmo-running.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_VASC = O("ch 10: Vascular complications");
const O_LIMB = O("ch 10: Limb ischaemia");
const O_RADIAL = O("ch 3: Radial artery access");
const O_FEM = O("ch 3: Femoral artery access");

const FEMORAL = { route: ["femoral" as const] };
const RADIAL = { route: ["radial" as const] };

const THROMBIN_REFS = ["pope-thrombin-anaphylaxis-2000", "jalaeian-thrombin-anaphylaxis-2015", "quarmby-autologous-thrombin-2002"];
const LARGE_BORE_REFS = ["sharp-crossover-tavi-2010", "buchanan-modified-crossover-2013", "zaman-cbot-2016", "stortecky-tavi-vascular-2012"];

export const module: Module = {
  id: "cm-access-complications",
  title: "Vascular access complications",
  stage: 3,
  summary:
    "What goes wrong at the femoral and radial artery and how to deal with it, step by step: the groin haematoma and the hidden retroperitoneal bleed with the manual's algorithm, pseudoaneurysm, arteriovenous fistula, infection and nerve injury, the cold leg after femoral or large-bore access, bleeding, forearm haematoma and perforation after radial access, radial occlusion, spasm, pseudoaneurysm and granuloma, and the endovascular bail-out of a large-bore arteriotomy that will not close.",
  objectives: [
    "Recognise a retroperitoneal haematoma early, start the general measures, and follow the manual's algorithm from the catheter laboratory or from the ward to balloon occlusion, a covered stent, coils or surgery.",
    "Manage a groin haematoma, and diagnose and treat a femoral pseudoaneurysm (observation, compression or thrombin injection, surgery), an arteriovenous fistula, an access-site infection and a nerve injury.",
    "Name the causes of acute limb ischaemia after femoral and large-bore access, prevent them, recognise the six Ps and cholesterol embolisation, and act on them.",
    "Place a radial compression band where the arterial hole is, grade a forearm haematoma, control proximal radial bleeding over a catheter or balloon, and recognise compartment syndrome before it is too late.",
    "Prevent and treat radial artery occlusion, spasm, pseudoaneurysm and sterile granuloma.",
    "Set up crossover balloon occlusion before a large sheath comes out, and when a large-bore arteriotomy or an iliofemoral artery bleeds, keep the wire, occlude from the other side, and choose between a covered stent and surgery (with a further suture device as an option argued by analogy).",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-femoral-bleeding",
      title: "Femoral bleeding: the groin haematoma and the hidden retroperitoneal bleed",
      minutes: 16,
      topics: ["comp-femoral-bleeding"],
      sources: [B("29.1"), B("4.2"), B("5.2"), B("11.1"), B("28.1"), B("2.7"), O_VASC, O_FEM, O("ch 10: Risks of complications"), O("ch 8: The PCI procedure"), O("ch 3: Compression devices")],
      refs: [...BOOKS, "ellis-retroperitoneal-2006", "rossaint-trauma-bleeding-2023"],
      blocks: [
        {
          kind: "p",
          text: "Blood that escapes from a femoral puncture goes one of two ways. It can collect under the skin of the groin, where you can see and feel it (and it can spread into the abdominal wall and the scrotum), or it can track upwards behind the peritoneum, where nothing shows at the groin until the patient is in shock. The Academy lesson comp-access-femoral gives the overview; this lesson works through how each presents, why it happens, and the manual's step-by-step algorithm for the retroperitoneal bleed. Two points differ from the Academy material. The Academy case comp-case-retroperitoneal sends a patient who is still hypotensive after a litre of fluid to CT; Brilakis's algorithm sends an unstable patient straight to the laboratory or theatre and keeps CT for stable patients. And where the Academy treats a slow pulse during sheath removal as usually vagal, Brilakis notes that patients with a retroperitoneal bleed often become bradycardic, so a slow pulse does not settle the question. Where they differ, follow this lesson.",
        },
        {
          kind: "list",
          items: [
            "**How common.** Oxford gives local haematoma after femoral access in up to a quarter of procedures, vascular complications in 1–2% of diagnostic catheterisations, and approximately 3–5% (haematoma and false aneurysm) for PCI, while advising that consent should rest on the operator's or the centre's own complication rates. The site of puncture decides much of the risk: above the femoral head and the origin of the inferior epigastric artery invites retroperitoneal bleeding; below the femoral head invites pseudoaneurysm and fistula (Brilakis 4.2.3).",
            "**Watch the site throughout.** Brilakis checks the access-site and distal pulses at the start and the end of every case and inspects and feels the site during it, because early detection of a haematoma is the point (2.7).",
          ],
        },
        { kind: "h", text: "The groin haematoma" },
        {
          kind: "table",
          caption: "Groin haematoma: recognition and management (Brilakis 29.1.2; Oxford ch 10)",
          head: ["Step", "What to do", "Source"],
          rows: [
            ["Recognise", "A swelling at the groin, typically growing and often very painful; with time the groin, thigh and abdomen discolour. It usually settles with manual pressure, but in a very obese patient it may be hard to see and found late", "Brilakis; Oxford"],
            ["Watch the circulation", "The pain can occasionally provoke a vagal collapse. Blood loss may be large: check the blood count and send a group and save", "Oxford"],
            ["Press", "Firm manual pressure just proximal to where the needle entered the skin (over the arterial hole, not the skin hole). It hurts, so give analgesia. Oxford adds mechanical compression devices; the frame-and-dome type is inflated above systolic pressure at first and then let down gradually until the site is dry", "Brilakis; Oxford"],
            ["After haemostasis", "A compressive bandage, and bed rest for 6–8 hours", "Brilakis"],
            ["Look for what lies beneath", "Feel the distal pulses and listen for a bruit (a fistula). Examine a large haematoma carefully for a pseudoaneurysm. When ongoing bleeding, a pseudoaneurysm or a fistula is suspected (Oxford: when in doubt), a duplex scan answers the question; neither book makes it routine for every haematoma. CT shows exactly where the haematoma is and how big", "Brilakis; Oxford"],
            ["If it will not stop", "Emergency endovascular or surgical treatment, as for the retroperitoneal bleed below", "Brilakis"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Who bleeds.** Oxford: patients who have had anticoagulants, thrombolysis or a glycoprotein IIb/IIIa inhibitor. A large haematoma can compress the femoral nerve; leg weakness has been reported.",
            "**Why pressure fails.** Brilakis (11.1.6) lists hands placed too low or to one side of the arterial hole, too little pressure, anticoagulation, high blood pressure, obesity and an existing haematoma; the remedy is to move the hands, press firmly, and go to endovascular or surgical treatment if haemostasis still cannot be achieved. The compression technique itself is taught in pm-closure.",
            "**Preventing it when the sheath comes out.** Brilakis checks the ACT before pulling a femoral sheath and waits until it is under 180 seconds (protamine can shorten the wait in some patients), and gives a hypertensive patient medication to bring the pressure down (11.1.5, 11.1.6). Oxford's threshold is an ACT under 150–200 seconds or 3–4 hours after the heparin, according to local protocol, with an antihypertensive if the patient is hypertensive. Against a vagal fall in pressure at sheath removal Brilakis gives saline beforehand, local anaesthetic before the sheath goes in so that pain does not set it off, and atropine for a slow pulse; but in this lesson a fall in pressure is a bleed until shown otherwise.",
          ],
        },
        { kind: "tip", id: "access-cx-groin-haematoma-press" },
        {
          kind: "check",
          stem: "Twenty minutes after a 6 Fr femoral sheath was pulled, the nurse calls: a tense, tender lump the size of a plum has appeared in the groin. BP 138/80 mmHg, HR 84 bpm. Where do you press, and what comes after the bleeding has stopped?",
          options: [
            "Centred on the lump until it is soft, with analgesia; then mobilise at once so the haematoma disperses",
            "Just above the skin puncture, with analgesia; then bandage, 6–8 h in bed, duplex if a leak is suspected",
            "Below the skin puncture, over the superficial femoral artery; then a duplex scan next week if still there",
            "Nowhere, as a formed haematoma has stopped bleeding; give analgesia and a light dressing, then mobilise",
          ],
          answer: 1,
          explanation:
            "The artery was entered above the point where the needle went through the skin, so the pressure goes just proximal to the skin entry (Brilakis 29.1.2.4). It is painful and needs analgesia. Once the site is dry, Brilakis applies a compressive bandage and keeps the patient in bed for 6–8 hours; a duplex scan shows whether bleeding continues and excludes a pseudoaneurysm or fistula when one is suspected (Oxford: examine a large haematoma for a pseudoaneurysm and scan if in doubt). Pressing on the lump misses the hole, and a growing tense haematoma is still bleeding.",
        },
        { kind: "h", text: "The retroperitoneal haematoma: why it happens" },
        {
          kind: "table",
          caption: "Causes and the habit that prevents each (Brilakis 29.1.2.2–29.1.2.3, 4.2, 5.2.5; Oxford ch 10)",
          head: ["Cause", "How it bleeds", "Prevention"],
          rows: [
            [
              "High puncture",
              "Above the lower border of the inferior epigastric artery the artery cannot be compressed; Oxford: above the inguinal ligament, and the bleeding may be relentless and fatal. A collagen-plug device should not be used here, because its plug can catch in the muscle layers of the abdominal wall and may not be pushed all the way down to the artery; Brilakis prefers a suture device for a high stick (11.1.4)",
              "Puncture with fluoroscopic and ultrasound guidance and take a femoral angiogram straight away (pm-access). If the needle is seen to be high, take it out and puncture again (4.2.6)",
            ],
            ["Back-wall puncture", "The far wall of the artery is holed as well as the near one", "Same meticulous technique"],
            [
              "Too much anticoagulation",
              "Supratherapeutic or prolonged anticoagulation, and glycoprotein IIb/IIIa inhibitors or cangrelor",
              "Avoid supratherapeutic levels",
            ],
            ["Hypertension", "Uncontrolled pressure before or during the puncture", "Control the blood pressure"],
            [
              "A wire in the wrong branch",
              "A polymer-jacketed wire can perforate a renal or another peripheral artery; a wire or catheter forced into a side branch, or a sheath pushed past its wire, can perforate (5.2.5.2)",
              "Advance wires through the iliac arteries and aorta under fluoroscopy; redirect a wire that enters a branch; never push hard against resistance",
            ],
          ],
        },
        { kind: "tip", id: "access-cx-iliac-wire-fluoro" },
        { kind: "h", text: "Suspecting it" },
        {
          kind: "list",
          items: [
            "**The rule.** Brilakis: suspect a retroperitoneal haematoma in every patient who becomes hypotensive during or after a procedure done through the femoral artery.",
            "**The picture.** Hypotension, sweating, and pain low in the abdomen or in the back are the commonest features; Brilakis notes that bradycardia is common, so a slow pulse does not exclude it, and the lower abdomen or suprapubic area is tender. Oxford adds progressive hypotension or cardiovascular collapse and, occasionally, bruising of the flank. Most develop within 3 hours of the procedure.",
            "**A closure device does not exclude it.**",
            "**Raise your suspicion further** in obese patients, uncontrolled hypertension before or during the puncture, a high puncture, a puncture made without ultrasound or fluoroscopy, and several attempts at the artery (Brilakis). In a single-centre series of 28,378 PCI patients that Brilakis cites (Ellis 2006), 0.57% had a retroperitoneal bleed; it was independently associated with a sheath placed above the inferior epigastric artery, female sex, a collagen-plug closure device, glycoprotein IIb/IIIa inhibitors and presentation with myocardial infarction, and was commoner in lighter patients.",
            "**Do not wait for proof in an unstable patient.** In that series, 2 of the 6 deaths caused by the bleed followed resuscitation that was delayed while CT confirmation was sought.",
            "**The dented bladder.** If contrast has been given, the bladder is opacified; fluoroscopy that shows it pushed to one side strongly suggests a retroperitoneal haematoma (Brilakis 29.1.2.1 and 28.1, where bleeding is the commonest cause of hypovolaemic hypotension).",
            "**Haemoglobin lags.** It is worth measuring, but in acute bleeding it often has not fallen yet.",
          ],
        },
        { kind: "tip", id: "access-closure-hypotension-retroperitoneal" },
        { kind: "h", text: "The algorithm (Brilakis Fig. 29.4), step by step" },
        {
          kind: "steps",
          title: "Suspected retroperitoneal haematoma",
          items: [
            {
              title: "1. General measures, at once",
              detail:
                "Large-bore intravenous access (a central line may be needed for vasopressors and large volumes of crystalloid or blood). Crystalloid (the algorithm names normal saline; a balanced solution is the alternative in current bleeding guidance) to restore perfusion while blood is obtained. Brilakis notes that several litres may be needed, but avoid reflex large-volume crystalloid, which in trauma studies has been linked with more coagulopathy and higher mortality: send blood for type and cross-match, transfuse early according to how much has been lost and the haemodynamics, and if the pressure will not hold, add a vasopressor rather than ever more crystalloid. (The European major-bleeding guideline, written for trauma and extrapolated here, recommends restricted volume replacement until the bleeding is controlled, noradrenaline when that fails to hold the target pressure, and restricted use of colloids; its permissive systolic target of 80–90 mmHg comes with the guideline's own warning that it needs careful thought in elderly patients and may be contraindicated in chronic hypertension, and was not written for a patient with a fresh coronary stent.) A haemoglobin. Press by hand on the puncture site, above all when a groin haematoma is present too.",
            },
            {
              title: "2. Reverse the anticoagulation once the diagnosis is made",
              detail:
                "Protamine for heparin; stop any glycoprotein IIb/IIIa inhibitor or cangrelor. The algorithm places reversal after the diagnosis has been established. Oxford's management is the same in outline: fluid and blood, reversal of anticoagulation, and occasionally surgical repair; it warns that manual compression is unlikely to help a bleed of this kind. Doses and the reversal decision in detail: pm-antithrombotics; antiplatelet decisions after major bleeding: cm-patient-complications.",
            },
            {
              title: "3. Where is the patient?",
              detail:
                "Still in the catheter laboratory: screen the bladder with fluoroscopy, then obtain access in the opposite femoral artery and perform femoral (iliofemoral) angiography to find the source. The algorithm gives this angiogram two outcomes: active bleeding (steps 6 to 9) or no bleeding, for which the figure gives no next step. By this module's reasoning, borrowing the CT branches: if there is evidence of a haematoma (a dented bladder, for example) but no active bleeding, manage it conservatively with the general measures; if there is no evidence of a haematoma, look for another cause of the hypotension. Already out of the laboratory: decide whether the patient is haemodynamically stable.",
            },
            {
              title: "4. Out of the laboratory and unstable",
              detail:
                "Straight back to the catheter laboratory, or to theatre, as an emergency. Brilakis adds (11.1.7.8) that when suspicion is high, going directly to the laboratory for endovascular treatment may be better than imaging that delays it; in the Ellis series, deaths followed delays for CT.",
            },
            {
              title: "5. Out of the laboratory and stable",
              detail:
                "CT of the abdomen and pelvis (Oxford: CT confirms the diagnosis). It answers three questions: a retroperitoneal haematoma with active contrast extravasation (go to the laboratory and treat the bleeding point); a haematoma without active bleeding (conservative management with the general measures); no haematoma (look for another cause of the symptoms).",
            },
            {
              title: "6. Active bleeding on angiography: stop it first",
              detail:
                "As with a coronary perforation, the mechanism decides the treatment. Before anything definitive, inflate a balloon at low pressure across the bleeding point to stop the flow.",
            },
            {
              title: "7. Large-vessel perforation (iliac or femoral)",
              detail:
                "If prolonged balloon inflation does not seal it, place a covered stent across the hole. It may be hard to deliver, and stents in the common femoral artery tend to fracture. Choosing and placing the stent is taught in the large-bore lesson of this module.",
            },
            {
              title: "8. Small-vessel perforation (inferior epigastric, lateral circumflex iliac)",
              detail:
                "Coil embolisation, after first making sure blood is not reaching the hole backwards from the other side (retrograde bleeding); or, for very distal holes where a coil cannot be delivered, microspheres, cyanoacrylate glue or thrombin, taking particular care that the sealant does not leak out of the vessel. Prolonged balloon inflation, or a covered stent laid over the mouth of the bleeding branch, may also work. Brilakis's femoral-angiography section lists the same embolisation for these branches with coils or thrombin (4.2.15).",
            },
            {
              title: "9. Surgery",
              detail:
                "If the covered stent or coils fail, or a stent is not wanted, for example where the common femoral artery divides into its superficial and profunda branches.",
            },
            {
              title: "10. Found before a non-emergency PCI",
              detail:
                "If the femoral angiogram at the start of the case shows a perforation and bleeding, and the PCI is not an emergency, Brilakis gives no anticoagulant and does not go on with the PCI, so as to limit the risk of further bleeding (4.2.15).",
            },
          ],
        },
        { kind: "tip", id: "access-cx-rp-in-lab" },
        { kind: "tip", id: "access-cx-iliofemoral-balloon-first" },
        { kind: "tip", id: "access-cx-small-branch-embolise" },
        {
          kind: "check",
          stem: "Two hours after PCI through a right femoral sheath closed with a collagen plug, a man becomes sweaty, BP 84/50 mmHg, HR 56 bpm, with low back pain. The groin is soft. After fluid and the first unit of blood the pressure is 88/54 mmHg. The CT scanner is free in 30 minutes. What does Brilakis's algorithm do next?",
          options: [
            "Atropine and leg elevation for a vagal reaction, as the pulse is slow and the groin is soft",
            "Wait for the CT, since every patient on the ward is imaged before any intervention",
            "Straight back to the laboratory or theatre: unstable, so no scan that delays treatment",
            "Take him to theatre to remove the plug, as the closure device must be the source",
          ],
          answer: 2,
          explanation:
            "He is unstable despite resuscitation, so the algorithm sends him emergently to the catheter laboratory or the operating room; Brilakis adds that with high suspicion, going straight to the laboratory may be preferable to imaging that delays treatment, and in the Ellis series deaths followed delays for CT. CT is the route for stable patients. A slow pulse is common with retroperitoneal bleeding, so it does not make this vagal, and a closure device does not exclude the diagnosis.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading a soft groin as reassurance.",
            "Calling hypotension with bradycardia after femoral access vasovagal without thinking of the retroperitoneum.",
            "Trusting a normal first haemoglobin.",
            "Sending an unstable patient to CT.",
            "Going straight to a covered stent without first stopping the flow with a low-pressure balloon.",
            "Coiling a small branch without checking whether it also fills backwards.",
            "Placing a stent across the common femoral bifurcation instead of calling the surgeons.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the patient leaves the laboratory, look at the femoral angiogram again and ask whether the hole lies above the lower border of the inferior epigastric artery. If it does, everyone who looks after the patient for the next few hours should know, because that is the patient whose falling pressure is a retroperitoneal bleed until shown otherwise.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, puncture the common femoral artery over the femoral head under fluoroscopic and ultrasound guidance and read the femoral angiogram: say whether the puncture lies below the inferior epigastric artery and above the bifurcation. If recovery reports hypotension after closure, run the general measures, screen the bladder, and image from the opposite groin before deciding on a balloon, a covered stent or coils.",
        },
        { kind: "video", id: "UzFqEfJIeeY", note: "Manual of PCI chapter video 29.2: femoral access bleeding." },
        { kind: "video", id: "ukNF_xn93-s", note: "Manual of PCI chapter video 29.3: approach to suspected retroperitoneal haematoma." },
        { kind: "video", id: "CXdH-QFquHA", note: "Elias Hanna: access complications and their management." },
        {
          kind: "keypoints",
          items: [
            "Groin haematoma: press just proximal to the skin puncture with analgesia, then bandage and 6–8 hours of bed rest; duplex if ongoing bleeding, pseudoaneurysm or fistula is suspected.",
            "Retroperitoneal bleeding comes from high or back-wall punctures, excess anticoagulation (including GP IIb/IIIa inhibitors and cangrelor), hypertension and wires in the wrong branch; women and lighter patients are at higher risk.",
            "Suspect it in any hypotension after femoral access: sweating, low abdominal or back pain, often bradycardia, usually within 3 hours; closure devices do not exclude it.",
            "General measures first: large IV access, crystalloid without reflex litres, early blood, a vasopressor if the pressure will not hold, haemoglobin, pressure at the site; reverse anticoagulation once the diagnosis is made.",
            "In the laboratory: bladder fluoroscopy and angiography from the other groin. Out of it: unstable goes to the laboratory or theatre (delays for CT have cost lives); stable goes to CT.",
            "Active bleeding: low-pressure balloon first; covered stent for a large vessel, coils (after excluding retrograde filling) or other embolics for a small branch; surgery if these fail or at the femoral bifurcation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-femoral-other",
      title: "Femoral pseudoaneurysm, arteriovenous fistula, infection and nerve injury",
      minutes: 14,
      topics: ["comp-femoral-pseudoaneurysm"],
      sources: [B("29.1"), B("4.2"), B("11.1"), O_VASC, O("ch 3: Arterial closure devices")],
      refs: [...BOOKS, ...THROMBIN_REFS],
      blocks: [
        {
          kind: "p",
          text: "These complications usually declare themselves after the patient has left the laboratory: a pulsatile lump on the ward round, a bruit at follow-up, a red and discharging groin a few days later, a leg that hurts for months. Each has a typical cause at the puncture, a test that confirms it, and a treatment ladder. The Academy overview (comp-access-femoral) lists them; here each ladder is given in full, with the points where the two manuals disagree.",
        },
        { kind: "h", text: "Pseudoaneurysm" },
        {
          kind: "list",
          items: [
            "**What it is.** A false aneurysm. Take Oxford's definition as the working one: blood leaks through the arterial wall into a cavity walled by the surrounding tissues, and flows in and out of it through a channel, the neck. Brilakis words it differently, as blood collected between the media and the adventitia, in contrast with a true aneurysm, which involves all three layers of the wall; this module reads his wording as saying that the wall of the cavity is not a true arterial wall. Both describe flow into and out of the cavity.",
            "**Why it matters.** It can become infected or rupture, compress a nerve, or cause a deep vein thrombosis.",
            "**How it presents.** A pulsatile, tender groin lump, often with a bruit (Brilakis); Oxford notes that it presents just like a local haematoma.",
            "**How it is confirmed.** Duplex ultrasound, showing blood flowing in and out of the cavity.",
            "**Why it happens.** A low puncture (below the femoral head); inadequate compression at the end of the case; a difficult access, for example a kinked wire; puncturing both the femoral artery and vein; heavy anticoagulation; and a closure device that fails. Oxford adds that a meta-analysis raised concern that first-generation closure devices may increase haematoma and possibly pseudoaneurysm. Prevention: the femoral technique of pm-access, and good haemostasis. If the needle is seen to have entered low, it may be better to withdraw it and puncture again (Brilakis 4.2.6).",
          ],
        },
        {
          kind: "steps",
          title: "Treating a femoral pseudoaneurysm (Brilakis 29.1.3.4; Oxford ch 10)",
          items: [
            {
              title: "1. Measure it",
              detail: "Under 2 cm across: most are managed conservatively, because many close by themselves, unless the groin pain is severe. 2 cm or more: treat.",
            },
            {
              title: "2. Look at the neck",
              detail:
                "Ultrasound-guided thrombin injection is the usual treatment for the larger ones, but only if the neck connecting cavity and artery is narrow. Through a wide neck, thrombin can escape downstream and cause acute limb ischaemia; surgical repair may then be the better choice.",
            },
            {
              title: "3. Inject thrombin (Oxford's method; typical, follow your local protocol)",
              detail:
                "Make up 5000 IU of bovine thrombin to 5 mL with 0.9% saline (1000 units per mL). Under ultrasound, enter the cavity with a 23-gauge (blue) needle, with local anaesthetic if the site is very tender. A tiny injection can confirm where the tip is. Then inject slowly: the blood in the cavity swirls like smoke and clots, sometimes very fast. Usually 500–1000 units are needed, that is 0.5–1 mL. The clot is reabsorbed over 5–6 weeks, and thrombin seldom finds its way into the systemic circulation. Before injecting, ask about previous exposure to thrombin: bovine thrombin can cause anaphylaxis, reported after repeated earlier exposure (Pope 2000) and in one report fatal (Jalaeian 2015), so have resuscitation drugs ready. Autologous thrombin prepared from the patient's own blood has been used instead and avoids that risk (Quarmby 2002); human thrombin is another commercial form.",
            },
            { title: "4. Check it stayed closed", detail: "Brilakis repeats the ultrasound 2–3 days later to confirm there is no recurrence." },
            {
              title: "5. Compression as an alternative",
              detail:
                "Press over the neck with the ultrasound probe, checking continuously that flow through the neck has stopped, until the cavity thromboses completely. It can take a long time (occasionally more than 30–45 minutes) and is uncomfortable for the patient. Oxford lists ultrasound-guided compression and thrombin injection as the two first-line options.",
            },
            {
              title: "6. Surgery (or a stent)",
              detail:
                "Brilakis: surgery may be needed for very large pseudoaneurysms (over 6 cm), a synthetic graft at the site, infection, limb ischaemia or necrosis of the overlying skin, as well as a wide neck. Oxford: surgical repair, or closure with an endovascular stent, if compression and thrombin fail.",
            },
          ],
        },
        { kind: "tip", id: "access-cx-psa-size-and-neck" },
        {
          kind: "check",
          stem: "Duplex on the day after femoral PCI shows a 3.2 cm pseudoaneurysm communicating with the common femoral artery through a broad, short connection. The skin is intact and the leg is well perfused. What does Brilakis advise?",
          options: [
            "Consider surgical repair: thrombin through a wide neck can embolise downstream",
            "Watch it, because pseudoaneurysms of any size usually close by themselves in time",
            "Thrombin injection, because every pseudoaneurysm of 2 cm or more is injected",
            "Thrombin injection followed at once by a covered stent in the femoral artery",
          ],
          answer: 0,
          explanation:
            "At 2 cm or more it needs treatment, and thrombin is usual, but only with a narrow neck: through a wide one thrombin can embolise distally and cause acute limb ischaemia, so surgical repair may be preferable (Brilakis 29.1.3.4). Conservative care is for those under 2 cm. Brilakis warns that a stent placed in the common femoral artery tends to fracture.",
        },
        { kind: "h", text: "Arteriovenous fistula" },
        {
          kind: "list",
          items: [
            "**What it is.** An abnormal connection between the femoral artery and the femoral vein. Oxford: it forms when both have been punctured and blood tracks from one to the other, or when a needle and then a sheath go right through one of the vessels into its neighbour.",
            "**How it presents.** Usually no symptoms; rarely, with a large shunt, leg swelling or high-output heart failure. A bruit and a palpable thrill over the artery. Doppler ultrasound or angiography confirms it; on the femoral angiogram the vein fills at the same time as the artery.",
            "**Why it happens.** A low puncture: lower in the groin the femoral vein often lies behind the common femoral or superficial femoral artery, so a needle can pass through the artery into the vein (ultrasound shows how the two lie). Several arterial punctures. Arterial and venous access in the same procedure, especially at the same level. Oxford links fistulae to punctures below the common femoral artery.",
            "**Prevention.** The standard femoral technique; and when both an arterial and a venous sheath are in, take out the arterial sheath first and the venous sheath a few minutes later, not both together.",
          ],
        },
        {
          kind: "table",
          caption: "Treatment of a femoral arteriovenous fistula: the books differ",
          head: ["Source", "Position"],
          rows: [
            ["Brilakis 29.1.4.4", "Most need nothing, and many close by themselves within a year. Rarely a large fistula needs a covered stent in the femoral artery (only if the bifurcation into the profunda and superficial femoral arteries is not involved) or surgery"],
            ["Oxford ch 10", "Management is usually surgical"],
          ],
        },
        {
          kind: "p",
          text: "One way to reconcile them (this module's reading, not a statement in either book): Brilakis is describing the usual small, silent fistula found after catheterisation, Oxford the fistula that comes to treatment. In practice, decide with the vascular team on the size of the shunt and the symptoms.",
        },
        { kind: "tip", id: "access-cx-arterial-sheath-first" },
        { kind: "h", text: "Infection" },
        {
          kind: "table",
          caption: "Access-site infection (Brilakis 29.1.5 and 11.1.7; Oxford ch 10 and ch 3)",
          head: ["", "Points"],
          rows: [
            ["Why it matters", "It can be devastating, often needing surgery and a long period of healing (Brilakis); Oxford calls it uncommon"],
            ["Signs", "Pain, redness and discharge at the site; fever and a raised white cell count. Oxford: usually Staphylococcus aureus"],
            ["Tests", "Blood cultures, and duplex ultrasound to exclude a pseudoaneurysm"],
            ["Causes", "A haematoma or pseudoaneurysm (a haematoma is a culture medium); a sheath left in for a long time, such as overnight; immunosuppression, for example after transplantation; poor hygiene at the site; arterial closure devices, particularly in a patient with a systemic infection or when sterile technique slipped (11.1.7)"],
            ["Prevention", "Strict sterile technique; prepare the skin again with antiseptic before deploying a closure device, especially after a long case, and put a sterile dressing on the site as soon as the device is deployed; avoid closure devices in patients at higher risk of infection (immunosuppressed, active infection, or skin infection at the site); remove the sheath as soon as possible; prophylactic antibiotics for high-risk patients; and do everything possible to prevent a haematoma"],
            ["Treatment", "Intravenous antibiotics (Oxford: according to cultures). Surgery if a closure device is infected, an abscess forms, there is a previous synthetic bypass graft, or bacteraemia persists despite antibiotics; an infected closure device may need surgical debridement and reconstruction (11.1.7). Oxford says abscess drainage is rarely needed"],
          ],
        },
        { kind: "h", text: "Nerve injury" },
        {
          kind: "p",
          text: "Rarely, the lateral cutaneous or the femoral nerve is injured and the patient has leg pain. The needle can hit the nerve directly, or a haematoma or pseudoaneurysm can compress it (Oxford reports leg weakness from femoral nerve compression by a haematoma). Prevention is good access technique. Treatment is conservative; most recover, though complete recovery may take several months (Brilakis 29.1.6).",
        },
        {
          kind: "check",
          stem: "A patient had diagnostic angiography with a 6 Fr femoral arterial sheath and a 7 Fr femoral venous sheath at the same level for a right heart study. At removal, the junior plans to pull both sheaths together and press once. What does Brilakis advise, and why?",
          options: [
            "Both together, as a single period of pressure halves the time to mobilisation",
            "Venous sheath first, so that the arterial pressure can be monitored to the very end",
            "Arterial sheath first, the venous one a few minutes later, to lower fistula risk",
            "Leave the venous sheath in overnight so that bleeding can be managed through it",
          ],
          answer: 2,
          explanation:
            "Arterial and venous access in one procedure, especially at the same level, is a cause of arteriovenous fistula; Brilakis advises removing the arterial sheath first and the venous sheath a few minutes later rather than at the same time. A sheath left overnight is itself a cause of infection.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pressing on a pulsatile groin lump without a duplex scan, or calling every lump a haematoma.",
            "Injecting thrombin through a wide neck.",
            "Injecting thrombin fast, or not checking with ultrasound days later.",
            "Leaving a femoral sheath in overnight without a clear reason.",
            "Using a closure device in an immunosuppressed patient or through infected skin, or without repeating the skin preparation after a long case.",
            "Puncturing artery and vein at the same level, low in the groin.",
          ],
        },
        {
          kind: "pearl",
          text: "Every pseudoaneurysm decision turns on two measurements from the duplex scan: the size of the cavity and the width of its neck. Ask for both in the request, and the scan will tell you whether to watch it, inject it, press it or send it to the surgeons.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, use ultrasound to see where the femoral vein lies relative to the artery before you puncture, and puncture the common femoral artery over the femoral head, not below it. At the end, if both an arterial and a venous sheath are in, remove the arterial sheath first.",
        },
        { kind: "video", id: "TDcNEUW-qBs", note: "Manual of PCI chapter video 29.4: pseudoaneurysm, arteriovenous fistula, infection and nerve injury with femoral access." },
        { kind: "video", id: "CXdH-QFquHA", note: "Elias Hanna: access complications and their management." },
        {
          kind: "keypoints",
          items: [
            "Pseudoaneurysm: pulsatile tender lump, often a bruit; duplex shows flow in and out. Causes: low puncture, poor compression, difficult access, artery plus vein, heavy anticoagulation, closure failure.",
            "Under 2 cm: usually watch. 2 cm or more: ultrasound-guided thrombin if the neck is narrow (Oxford: typically 500–1000 units), re-scan in 2–3 days; compression is an alternative. Ask about earlier thrombin exposure: bovine thrombin can cause anaphylaxis.",
            "Surgery for a wide neck, over 6 cm, synthetic graft, infection, limb ischaemia or skin necrosis; Oxford also lists endovascular stent closure if other measures fail.",
            "Arteriovenous fistula: bruit and thrill, usually silent; Brilakis treats few (covered stent or surgery), Oxford says management is usually surgical. Remove the arterial sheath before the venous one.",
            "Infection: antibiotics; surgery for an infected closure device, abscess, synthetic graft or persistent bacteraemia. Prevent with asepsis, a sterile dressing straight after a closure device, early sheath removal and no haematoma.",
            "Nerve injury: rare, conservative, can take months to settle.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-limb",
      title: "Limb ischaemia after femoral and large-bore access",
      minutes: 15,
      topics: ["comp-limb-ischaemia"],
      sources: [B("29.1"), B("4.2"), B("5.2"), B("11.1"), B("14.3"), B("14.4"), B("14.5"), B("30.1"), O_LIMB, O("ch 9: Impella"), O("ch 9: Extracorporeal membrane oxygenation")],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A cold leg after femoral access means that something is blocking the artery: a flap, a clot, an embolus, a closure device or the sheath itself. The longer it is left, the more muscle is lost, so the job is to prevent it, to look for it at set times, and to know the route to the cause. Brilakis also separates a second, quite different picture in which the peripheral pulses are intact: cholesterol embolisation.",
        },
        {
          kind: "table",
          caption: "Two pictures of lower-limb ischaemia (Brilakis 29.1.1.1)",
          head: ["", "Acute limb ischaemia", "Cholesterol embolisation syndrome"],
          rows: [
            ["Features", "The six Ps: pain, pallor, paralysis, pulse deficit, paraesthesia, poikilothermia (a cold limb)", "Classic triad: pain in the leg or foot, livedo reticularis, and intact peripheral pulses. Often a high eosinophil count; sometimes acute renal failure"],
            ["Mechanism", "Thrombosis, dissection, embolisation of large thrombi, or a closure-device complication", "Showers of microemboli"],
            ["Treatment", "Angiography from the other groin and treatment of the cause (below)", "No specific treatment: prevention is what counts. Statins may help the acute kidney injury. Full teaching in cm-patient-complications"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Oxford's ward checks.** The nursing team should examine the leg regularly for a pale or blue colour, coldness, weak or absent pulses, pain, and loss of movement or sensation.",
            "**Confirming it.** Still in the laboratory: angiography of the leg confirms the diagnosis and plans the treatment. After leaving it: usually ultrasound or CT (Brilakis); Oxford arranges Doppler ultrasound or CT and involves the vascular surgeons early.",
          ],
        },
        { kind: "tip", id: "access-cx-cold-leg-six-ps" },
        { kind: "h", text: "Causes, each with its prevention" },
        {
          kind: "table",
          caption: "Why the leg goes cold (Brilakis 29.1.1.2–29.1.1.3, 4.2.15, 11.1, 30.1; Oxford ch 10)",
          head: ["Cause", "Prevention or note"],
          rows: [
            ["Dissection of the femoral or iliac artery: wires forced against resistance, diseased arteries, a contrast injection with the sheath tip against the wall", "Confirm a clean arterial waveform before injecting, avoid forceful injections, and put a 0.035 inch wire through the sheath first: it steadies the sheath, keeps its tip off the wall and keeps the true lumen if a dissection occurs (4.2.15). Use soft, deflectable wires and never push catheters against resistance"],
            ["Thrombosis; suboptimal anticoagulation", "Check the ACT periodically so that anticoagulation stays at target"],
            ["Distal embolisation: thrombus, closure-device parts, cholesterol, air or plaque from a diseased artery or a clotted sheath", "Always aspirate the sheath first and discard what comes back, then flush with a separate syringe before inserting anything or giving drugs; ultrasound before the puncture to avoid badly diseased or calcified segments"],
            ["An occlusive sheath: a small or diseased artery, a large sheath, a long dwell time", "Use the smallest sheath you can; the bigger the sheath, the more of the lumen it fills and the higher the risk of ischaemia and thrombosis (30.1)"],
            ["Closure devices", "Oxford: an over-tightened suture knot, especially when several devices close a large hole; a collagen plug narrowing a small or atherosclerotic artery. Brilakis: a plug deployed inside the artery (sheath advanced too far so the anchor catches on plaque, tamping before the anchor is felt against the wall, or a puncture in the superficial femoral or profunda artery). Prevention: correct puncture site; a femoral angiogram before the sheath comes out; manual or mechanical compression instead of a device for punctures below the bifurcation or small arteries; no collagen plug in small or diseased arteries, or watch the anchor on ultrasound as it is deployed (Brilakis 11.1.7)"],
            ["Compression that is too long or too hard after sheath removal", "This can also cause deep vein thrombosis"],
            ["Access technique", "Meticulous technique with fluoroscopic and ultrasound guidance; Brilakis also lists radial access among the preventive measures"],
          ],
        },
        { kind: "tip", id: "access-closure-cold-leg" },
        {
          kind: "check",
          stem: "Before a femoral angiogram through a freshly placed sheath, the pressure trace from the side arm is damped. The fellow wants to give a firm 10 mL hand injection to see what is going on. What does Brilakis advise instead?",
          options: [
            "Inject harder, so that the contrast clears the obstruction and shows the true lumen",
            "Inject through the micropuncture needle instead, as a needle injection cannot dissect it",
            "Upsize the sheath at once, since a damped trace means the sheath is too small for it",
            "Do not inject: get a clean waveform and put a 0.035 inch wire through the sheath first",
          ],
          answer: 3,
          explanation:
            "A contrast injection with the sheath tip against the wall can dissect the iliofemoral artery. Brilakis injects only with a good arterial waveform, avoids forceful injections, and puts a wire through the sheath first to keep its tip off the wall and to keep the true lumen if a dissection does occur (4.2.15). He notes that injecting through the needle can itself dissect if the needle position is poor.",
        },
        { kind: "h", text: "Treating acute limb ischaemia, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Get in from the other side",
              detail: "Obtain access in the opposite femoral artery and perform angiography to find the cause; often the same access delivers the treatment.",
            },
            {
              title: "2. Treat what you find",
              detail:
                "Balloon angioplasty, endovascular thrombectomy or thrombolysis. Thrombus or plaque that has embolised and made the leg ischaemic is retrieved endovascularly or surgically (4.2.15).",
            },
            {
              title: "3. Dissection: flow-limiting or not?",
              detail:
                "A dissection that does not limit flow usually heals without treatment; retrograde dissections from a sheath are usually sealed by the forward flow, provided they are short and spare the side branches, though large ones may need endovascular repair, usually a stent; if the sheath itself lies subintimal (no arterial waveform from its side arm), change the access site (5.2.4, 5.2.5.1). A flow-limiting dissection depends on where it is: in the common femoral artery, femoral endarterectomy is preferred so that no stent is left in a segment where stents fracture; in the iliac artery, cross into the true lumen from the opposite femoral artery and deploy a self-expanding stent.",
            },
            {
              title: "4. A closure device in the artery",
              detail: "Treat it promptly; a plug inside the artery often has to be removed surgically, although endovascular treatment has been described (Brilakis Fig. 29.1 shows a plug that occluded the common femoral artery and was removed at emergency surgery).",
            },
            {
              title: "5. Surgery when needed",
              detail: "Surgical thrombectomy, endarterectomy or bypass in some patients. Oxford: involve the vascular surgeons early.",
            },
            {
              title: "6. Air",
              detail: "If air has been embolised into the leg, consider 100% oxygen (4.2.15).",
            },
          ],
        },
        { kind: "tip", id: "access-cx-iliac-dissection-crossover" },
        { kind: "h", text: "Large-bore access and the leg" },
        {
          kind: "list",
          items: [
            "**Choose the better artery.** Insert a microaxial pump through the less diseased femoral artery; its 14 Fr sheath needs iliofemoral arteries over 5 mm across without severe calcification, tortuosity or obstruction (Brilakis 14.1, 14.4). Oxford lists significant peripheral vascular disease as a contraindication to both the microaxial pump and ECMO, and limb ischaemia among the complications of each (with compartment syndrome listed for ECMO).",
            "**Check the leg as soon as the sheath is in.** Brilakis takes a femoral angiogram after inserting the pump sheath to make sure it is not making the leg ischaemic (pm-access teaches the full large-bore sequence).",
            "**VA-ECMO.** The arterial cannula can make its own leg ischaemic, so Brilakis places an antegrade perfusion sheath in the common or superficial femoral artery, ideally under ultrasound with a micropuncture needle. It is best placed before the cannula, which can get in the way of the puncture, but in an urgent case it can go in after the circuit is running. He usually uses a kink-resistant 6 Fr sheath 24 cm long. With a smaller arterial cannula (for example 15–17 Fr) one may not be needed; near-infrared spectroscopy below 50%, or more than 15% lower than the other leg, means one should be placed. Keep the venous and arterial cannulae in different groins, so that the arterial cannula does not compress the femoral vein and congest the leg (14.5; the full sequence is in pm-access and pm-support-devices).",
            "**Balloon pump.** An ischaemic leg usually recovers once the pump and its sheath are removed with manual haemostasis, but surgical or endovascular treatment is sometimes needed (Brilakis 14.3).",
            "**Pre-close sutures.** Oxford's warning about over-tightened knots applies most to large holes closed with more than one suture device.",
          ],
        },
        { kind: "tip", id: "mcs-largebore-limb-check" },
        { kind: "tip", id: "mcs-cx-iabp-ischaemic-leg" },
        {
          kind: "check",
          stem: "Six hours into balloon-pump support through the right femoral artery, the right foot is cold and pale with no palpable pulses. The patient still needs support. Brilakis's teaching points to which first move?",
          options: [
            "Leave the pump in until support ends, as limb ischaemia always resolves once it is out later",
            "Remove the pump and its sheath now, re-site support if needed, and image if no recovery",
            "Start thrombolysis down the pump sheath at once, without imaging the leg beforehand",
            "Increase the pump to 1:1 augmentation so that more blood is driven down to the foot",
          ],
          answer: 1,
          explanation:
            "Removing the device is the treatment: Brilakis notes that an ischaemic leg usually recovers once the pump and its sheath are removed with manual haemostasis, but not always, so surgical or endovascular treatment is sometimes required. If support is still needed, it has to continue from somewhere else, such as the other femoral artery or another route, decided with the team (this module's reasoning; neither manual describes re-siting). If the leg does not recover, Oxford's steps apply: Doppler or CT, and the vascular surgeons involved early. Leaving the culprit sheath in a pulseless leg for hours, waiting for the support to end, is the wrong order.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting through a sheath with a damped trace.",
            "Re-injecting what you aspirated from the sheath.",
            "Putting a closure device into a small, diseased artery or below the bifurcation.",
            "Holding pressure for longer or harder than the hole needs.",
            "Stenting a common femoral dissection that an endarterectomy would fix.",
            "Placing a large sheath without an angiogram of the leg afterwards, and not examining the leg again during support.",
            "Taking intact pulses as reassurance in a patient with livedo and leg pain: that is cholesterol embolisation.",
            "Keeping a balloon-pump sheath in a cold, pulseless leg while waiting for support to end, instead of removing it.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the time on the first distal pulse check after every large sheath goes in, and check again at set times. A leg that was warm with a palpable or Doppler pulse at the start, and is not now, is a firm finding to act on; a leg that was never examined gives you nothing to compare.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "After placing the 14 Fr sheath, take the femoral angiogram and comment on flow into the superficial femoral artery before you position the pump. During support, perform and record distal limb checks at set times, and when the lab reports limb ischaemia, image the leg and decide with the team on the cause and the remedy.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Cannulate for VA-ECMO with the arterial cannula in the left common femoral artery, and place the antegrade perfusion sheath before the arterial cannula. Use the limb NIRS values (below 50%, or more than 15% lower than the other leg) to decide whether the perfusion sheath is needed if it was not placed first.",
        },
        { kind: "video", id: "JWh8OaDq6K8", note: "Manual of PCI chapter video 29.1: ischaemic femoral access complications." },
        {
          kind: "keypoints",
          items: [
            "Acute limb ischaemia: the six Ps. Cholesterol embolisation: leg or foot pain, livedo reticularis and intact pulses, often eosinophilia, sometimes renal failure.",
            "Causes: dissection, thrombosis, embolisation, closure devices, occlusive or large sheaths, long dwell, poor sheath handling, over-long or over-hard compression, weak anticoagulation.",
            "Prevent with guided puncture, soft wires, smallest sheath, aspirate-discard-flush, ACT checks, no force; a femoral angiogram before closure, and no device in small or diseased arteries or below the bifurcation.",
            "Treat from the other groin: angioplasty, thrombectomy or thrombolysis; endarterectomy for common femoral dissection, self-expanding stent for iliac dissection; surgery when needed.",
            "Large-bore: least diseased side, angiogram after sheath insertion, antegrade perfusion for VA-ECMO when NIRS says so (venous and arterial cannulae in different groins), avoid over-tightened knots; for balloon-pump leg ischaemia remove the pump and sheath, which usually lets the leg recover, but not always.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-radial-bleeding",
      title: "Radial bleeding: the band, the forearm haematoma, perforation and compartment syndrome",
      minutes: 16,
      topics: ["comp-radial"],
      sources: [B("29.2"), B("4.3"), B("5.2"), B("5.3"), B("11.2"), O_RADIAL, O_LIMB],
      refs: [...BOOKS, "bertrand-forearm-2010"],
      blocks: [
        {
          kind: "p",
          text: "Bleeding is less common with radial than with femoral access, because the artery can be pressed against the radius with a band. But blood that escapes into the forearm is in a closed space: if it keeps coming, the pressure in the muscle compartments rises until the muscles and nerves die, and only an emergency fasciotomy saves the arm. So radial bleeding is about two things: getting the band in the right place, and catching a forearm haematoma early. The Academy lesson comp-access-radial introduces the EASY grades; here they are used step by step.",
        },
        {
          kind: "list",
          items: [
            "**Brilakis's list** of radial complications: bleeding, occlusion of the artery, spasm, pseudoaneurysm, sterile granuloma, and injury to a nerve (the last has no section of its own).",
            "**Two places to bleed.** At the access site, when haemostasis is difficult; or higher up the radial artery, from a hole made by a wire, a catheter or a sheath.",
            "**Oxford's numbers.** Forearm haematoma in up to 1% of radial cases, usually developing slowly on the ward after the sheath is out; acute ischaemia of the arm, usually from a large forearm haematoma with compartment syndrome, in 0.004% to 0.13%. Serious bleeding with the radial technique is very rare.",
          ],
        },
        { kind: "h", text: "Bleeding at the wrist: the band" },
        {
          kind: "list",
          items: [
            "**Where is the hole?** The needle enters the artery further up the arm than it enters the skin, and the gap grows the flatter the needle was held. So the band goes slightly proximal to the skin puncture.",
            "**Too distal** and the arterial hole is not compressed: blood goes up into the forearm. **Too proximal** and blood collects at the wrist.",
            "**Other causes of radial bleeding** (Brilakis 29.2.1.2): intensive anticoagulation; a wire that enters a side branch of the radial artery; a side branch torn off by an advancing catheter; rupture of the artery when a sheath or catheters are forced through spasm; rough catheter manipulation, especially through a radial loop.",
            "**Oxford's local haematoma** often appears just proximal to the puncture as soon as the band is put on; a second band placed hard against the first usually deals with it.",
          ],
        },
        { kind: "tip", id: "access-cx-radial-band-proximal" },
        {
          kind: "steps",
          title: "Access-site bleeding (Brilakis 29.2.1.4, 11.2)",
          items: [
            { title: "1. Move the band", detail: "Reposition it over the arterial hole." },
            { title: "2. Or add a second band", detail: "Place a second compression device." },
            { title: "3. Press and elevate", detail: "Hold manual pressure and keep the arm raised." },
            {
              title: "4. Blood pressure cuff on the arm",
              detail:
                "Brilakis's text says a cuff inflated above systolic pressure can help achieve haemostasis. The forearm-haematoma chart he reproduces (Fig. 29.10, from Bertrand) instead sets the cuff 20 mmHg below systolic, deflates it every 15 minutes, and allows finger oxygen saturation to be monitored while it is up; Oxford, to stop a forearm haematoma evolving into compartment syndrome, inflates it up to 15 mmHg below systolic. The three figures differ: follow your local protocol, and never leave a cuff inflated without a plan to let it down.",
            },
          ],
        },
        { kind: "tip", id: "access-radial-band-bleeding" },
        { kind: "h", text: "The forearm haematoma: grade it, treat the grade" },
        {
          kind: "table",
          caption: "Haematoma grading after transradial or transulnar PCI, as reproduced by Brilakis (Fig. 29.10, from Bertrand)",
          head: ["Grade", "Extent", "Incidence on the chart", "Treatment", "Who is told"],
          rows: [
            ["I", "Local and superficial, within about 5 cm of the puncture", "under 5%", "Analgesia, an extra band, ice", "—"],
            ["II", "With moderate infiltration of muscle, up to about 10 cm", "under 3%", "Analgesia, an extra band, ice", "Inform the doctor"],
            ["III", "Forearm haematoma with muscle infiltration, still below the elbow", "under 2%", "Analgesia, an extra band, ice, inflated blood pressure cuff", "Inform the doctor"],
            ["IV", "Haematoma and muscle infiltration extending above the elbow", "not given", "Analgesia, an extra band, ice, inflated blood pressure cuff", "Inform the doctor"],
            ["V", "Ischaemic threat: compartment syndrome", "under 0.01%", "Consider surgery", "Call the doctor immediately"],
          ],
        },
        {
          kind: "list",
          items: [
            "**For every grade** (the chart's remarks): control the blood pressure, and remember that pain control helps it; consider stopping any anticoagulant or antiplatelet infusion; measure the forearm and arm circumference repeatedly to decide whether another band or the cuff is needed; ice in a plastic bag or a washcloth on the haematoma; after the band comes off, a light compressive bandage around the forearm and arm for a few hours.",
            "**Oxford's ward treatment** of a forearm haematoma is the same in spirit: bandage compression of the forearm, ice for the swelling, the arm raised in a sling, and close watching for compartment syndrome.",
          ],
        },
        { kind: "tip", id: "access-cx-forearm-haematoma-grade" },
        {
          kind: "check",
          stem: "Three hours after a right radial PCI, the forearm is swollen and firm from the wrist to a hand's breadth below the elbow; the hand is warm, pink and moves normally, and the band is in place. Which grade is this, and what is the plan?",
          options: [
            "Grade I: ice on the swelling alone, with a review of the forearm on the morning round",
            "Grade V: immediate fasciotomy, as any haematoma above the wrist is a compartment syndrome",
            "Grade III: analgesia, another band, ice, a timed cuff; inform the doctor, measure again",
            "Grade IV: remove the band so that the trapped blood can drain out through the puncture",
          ],
          answer: 2,
          explanation:
            "A forearm haematoma with muscle infiltration that stays below the elbow is grade III on the chart Brilakis reproduces. Its treatment adds an inflated blood pressure cuff to analgesia, an extra band and ice, the doctor is informed, and the remarks ask for repeated forearm measurements and consideration of stopping antithrombotic infusions. Grade V is an ischaemic threat; this hand is well perfused. Removing the band would add to the bleeding.",
        },
        { kind: "h", text: "Proximal radial bleeding: perforation" },
        {
          kind: "steps",
          title: "A hole higher up the radial artery (Brilakis 29.2.1.4, 5.2.5.2)",
          items: [
            { title: "1. Keep the wire", detail: "When the radial artery has ruptured and bleeds heavily, Brilakis calls keeping the wire in position crucial." },
            {
              title: "2. Cover the hole with a catheter",
              detail: "If you can cross the damaged segment safely and advance a catheter (diagnostic or guide) through it, the catheter seals the perforation in most cases.",
            },
            {
              title: "3. If not, a balloon",
              detail: "A long balloon (peripheral or coronary, chosen to suit the artery) held across the hole at low pressure for a long time often seals it.",
            },
            { title: "4. Help from outside", detail: "Wrap the arm in a compression dressing and apply ice." },
            { title: "5. Compartment syndrome", detail: "Emergency fasciotomy." },
          ],
        },
        { kind: "tip", id: "access-cx-radial-perforation-cover" },
        {
          kind: "list",
          items: [
            "**Prevention of radial bleeding** (Brilakis 29.2.1.3): meticulous access technique; close watching of the site; the band slightly proximal to the puncture; never force the wire, the sheath or a catheter against resistance; confirm on fluoroscopy that the wire is where it should be before the sheath goes in; size the sheath to the artery (ultrasound measures it); and cross radial loops with balloon-assisted tracking, which stops the catheter tip acting like a razor on the wall.",
            "**Balloon-assisted tracking** (5.3.3): a small compliant balloon matched 1:1 to the guide is inflated half in and half out of the guide tip at low pressure (3–6 atm). Lower pressure makes the assembly more flexible; higher pressure makes it more pushable.",
          ],
        },
        { kind: "tip", id: "access-cx-radial-loop-bat" },
        { kind: "h", text: "Compartment syndrome: recognise it early" },
        {
          kind: "table",
          caption: "Acute upper-limb ischaemia and compartment syndrome (Oxford ch 10)",
          head: ["", "Points"],
          rows: [
            ["Why the hand usually survives a radial occlusion", "The ulnar artery takes over; acute ischaemia of the hand is therefore rare, and usually comes with a large, uncontrolled forearm haematoma and compartment syndrome"],
            ["Causes", "Poor or inadequate haemostasis; a radial side-branch perforation, usually by the wire, that was not noticed; tearing of the radial artery as a sheath goes in or comes out through severe spasm; fluid or drugs from a misplaced intravenous cannula leaking into the forearm"],
            ["Risk factors", "Female sex, small body size, impaired renal function, a large sheath"],
            ["Without a haematoma", "Rare cases occur; sheath- or catheter-induced muscle ischaemia with oedema has been suggested as the mechanism. Lost equipment (an entrapped wire) can also make the arm ischaemic and needs immediate surgery"],
            ["Signs", "A swollen forearm with pain (worse on passive stretching), pallor, pulselessness, paralysis and paraesthesia"],
            ["Prevention once a haematoma is seen", "Mechanical compression of the forearm (a cuff up to 15 mmHg below systolic), pain relief, good blood pressure control, reversal of heparin"],
            ["Management", "Early diagnosis; involve the vascular surgeons early if it is confirmed or strongly suspected. Brilakis: emergency fasciotomy"],
          ],
        },
        { kind: "tip", id: "access-cx-compartment-call" },
        {
          kind: "check",
          stem: "During a right radial case the 0.035 inch wire met resistance in the mid forearm and a radial angiogram shows contrast escaping from the radial artery. The wire has since been passed through the segment into the brachial artery. The patient is anticoagulated. What does Brilakis advise?",
          options: [
            "Keep the wire, cover the hole with a catheter, then a long low-pressure balloon if needed",
            "Pull everything out at once, press firmly on the forearm and switch to the femoral artery",
            "Inject more contrast forcefully to see how large the hole is before deciding on anything",
            "Give protamine and continue the case through the same artery without changing anything",
          ],
          answer: 0,
          explanation:
            "Brilakis: if the perforated segment can be crossed safely and a catheter advanced through it, haemostasis is achieved in most cases; keep wire position, and if the catheter does not seal it, a long peripheral or coronary balloon at low pressure for a prolonged time often will. Pulling everything out loses the means of sealing the hole in an anticoagulated forearm, and forceful injections enlarge the problem.",
        },
        {
          kind: "pitfalls",
          items: [
            "Putting the band over the skin puncture rather than slightly proximal to it.",
            "Pushing a wire, sheath or catheter against resistance in the forearm, or forcing a catheter through a radial loop without balloon-assisted tracking.",
            "Pulling the catheter out of a perforated radial artery before the hole is sealed.",
            "Not grading, measuring and re-measuring a forearm haematoma.",
            "Leaving a cuff inflated without timing its deflation and without watching the finger saturation.",
            "Waiting for the pulse to disappear before suspecting compartment syndrome: suspect it in any swollen forearm with pain, especially pain that is worse on passive stretching (Oxford).",
            "Compressing a forearm that already shows the signs of compartment syndrome instead of calling the surgeons: compression, pain relief, blood pressure control and heparin reversal are Oxford's measures to stop a haematoma progressing, not the treatment of an established syndrome.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the band goes on, look at where the needle entered the artery on the ultrasound or estimate it from the angle you used: a flat puncture puts the arterial hole a good way up the arm from the skin nick. The band belongs over the artery, not the skin.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Through the radial route, confirm the wire's course on fluoroscopy before the sheath goes in, and if the wire meets resistance in the forearm, stop and take a radial angiogram through a catheter brought up behind it. At the end, place the compression band slightly proximal to the skin puncture.",
        },
        { kind: "video", id: "SU74rGGZTe8", note: "Manual of PCI chapter video 29.5: radial access complications." },
        { kind: "video", id: "CXdH-QFquHA", note: "Elias Hanna: access complications and their management." },
        {
          kind: "keypoints",
          items: [
            "Radial bleeding is at the wrist (band problems) or higher up (a hole made by a wire, catheter or sheath).",
            "The arterial hole lies proximal to the skin hole: band slightly proximal. Too distal bleeds into the forearm; too proximal bleeds at the wrist.",
            "Access-site bleeding: reposition the band or add a second, press and elevate, and consider a cuff (the sources give above systolic, 20 below, or up to 15 below).",
            "Grade forearm haematomas I–V; treat the grade, measure the forearm, control pain and blood pressure, consider stopping antithrombotic infusions.",
            "Perforation: keep the wire; a catheter across the hole seals most; otherwise a long low-pressure balloon; compression dressing and ice.",
            "Forearm haematoma: compress (cuff up to 15 mmHg below systolic), relieve pain, control the pressure, reverse heparin. Signs of compartment syndrome (pain worse on passive stretch, pallor, pulselessness, paralysis, paraesthesia): call the surgeons at once; fasciotomy. Acute arm ischaemia of this kind: 0.004–0.13% (Oxford).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-radial-other",
      title: "Radial occlusion, spasm, pseudoaneurysm and sterile granuloma",
      minutes: 12,
      topics: ["comp-radial"],
      sources: [B("29.2"), B("4.3"), B("11.2"), O_RADIAL, O_LIMB],
      refs: [...BOOKS, "aminian-disco-radial-2022"],
      blocks: [
        {
          kind: "p",
          text: "These radial complications rarely threaten the hand, but they matter: an occluded radial artery is no longer available for the next procedure, spasm can trap equipment and turn a routine case into an avulsed artery, and a pseudoaneurysm or granuloma brings the patient back. Each has known causes that the operator controls.",
        },
        { kind: "h", text: "Radial artery occlusion" },
        {
          kind: "list",
          items: [
            "**How often and how it shows.** Oxford: a radial pulse lost after the procedure in up to 5% of cases, often without symptoms; transient occlusion in up to 7–8%. Most patients have no symptoms; rarely, acute hand ischaemia causes pain. Duplex ultrasound confirms it.",
            "**Causes.** A small radial artery or a sheath large for it; haemostasis that does not keep the artery open (non-patent haemostasis); no or low-intensity anticoagulation during the procedure; repeated use of the same radial artery.",
          ],
        },
        {
          kind: "steps",
          title: "Preventing occlusion (Brilakis 29.2.2.3, 11.2.5)",
          items: [
            { title: "Anticoagulate", detail: "Unfractionated heparin during the procedure (the doses are taught in pm-access)." },
            { title: "Keep the artery open while you compress", detail: "Patent haemostasis: pulse oximeter on the index finger, occlude the ulnar artery, and loosen the band until the plethysmographic signal returns or bleeding starts; if the site bleeds at the band pressure needed to keep the artery open, Brilakis uses manual compression (11.2.5; the technique is in pm-closure)." },
            { title: "Keep compression short", detail: "Brilakis limits compression to 2 hours or less in his complications chapter and leaves the band on for 1–2 hours in his closure chapter; longer compression raises the risk of occlusion. Compressing the ulnar artery at the same time lowers it further." },
            { title: "Consider the distal radial artery", detail: "Distal (snuffbox) rather than proximal radial access, which Brilakis lists among the preventive measures. Oxford also lists possibly easier recanalisation of an occluded radial artery and a lower risk of compartment syndrome as possible benefits of the snuffbox route. The caveats: Brilakis's own comparison table marks the occlusion benefit with a question mark, and the distal artery is smaller, which limits the sheath size, and slower to puncture (4.3). In the randomised DISCO RADIAL trial (1,307 patients, 6 Fr thin-walled sheaths, best practices including patent haemostasis applied in both arms), forearm radial occlusion at discharge was equally low with distal and conventional access (0.31% against 0.91%, not significant); distal access needed crossover to another site more often (7.4% against 3.5%) and had more spasm, but haemostasis was shorter. The package of heparin, patent haemostasis and short compression is what keeps the artery open." },
          ],
        },
        {
          kind: "table",
          caption: "The Allen test: the books differ",
          head: ["Source", "Position"],
          rows: [
            ["Brilakis 29.2.2.3", "Neither the Allen nor the Barbeau test predicts radial artery occlusion; neither needs to be done routinely"],
            ["Oxford ch 3", "Describes the Allen test (compress both arteries, clench the hand until it blanches, release the ulnar; colour back within 10 seconds is normal; a finger plethysmograph can make it more sensitive), says it is not universally applied, and notes that some operators will not use the radial artery unless it is normal. Say 'normal' rather than 'positive' to avoid confusion"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Treatment.** Most patients have no symptoms and need none. Anticoagulation may be considered, and a non-steroidal anti-inflammatory drug if local pain is significant. In selected, highly symptomatic patients the occluded radial can be recanalised percutaneously from the brachial or the distal radial artery.",
          ],
        },
        {
          kind: "check",
          stem: "A man had a right radial angiogram with a 6 Fr sheath, heparin 5000 units, and a band left fully inflated for 5 hours because the ward was busy. Next day there is no radial pulse; the hand is warm and pain-free. Which statement fits Brilakis?",
          options: [
            "The heparin caused the occlusion, so the next radial case should be done without it",
            "He needs urgent percutaneous recanalisation of the radial through the brachial artery",
            "An Allen test before the procedure would have predicted this occlusion and so prevented it",
            "Long occlusive compression is the likely cause: no treatment, patent and shorter next time",
          ],
          answer: 3,
          explanation:
            "Non-patent haemostasis and prolonged compression raise the risk of radial occlusion; Brilakis limits compression to 2 hours or less and uses patent haemostasis. An asymptomatic occlusion needs no treatment; recanalisation is for selected, highly symptomatic patients. Heparin prevents occlusion rather than causing it, and Brilakis says the Allen and Barbeau tests do not predict it.",
        },
        { kind: "h", text: "Radial artery spasm" },
        {
          kind: "p",
          text: "Spasm makes the hand uncomfortable and can stop equipment going in or coming out. The engagement module (pm-engaging) teaches how to handle it during a case; this section collects the complication chapter's causes and rescue steps, including the one that injures most: pulling hard.",
        },
        {
          kind: "table",
          caption: "Radial spasm (Brilakis 29.2.3; Oxford ch 3)",
          head: ["", "Points"],
          rows: [
            ["Causes", "A small radial artery or a large sheath for it; much catheter manipulation and many exchanges; women and current smokers; anxiety (inadequate sedation); no vasodilator after access; intravenous vasopressors"],
            ["Prevention", "Meticulous access (ultrasound guidance reduces the number of attempts, which can reduce spasm); vasodilators; the thinnest-walled, smallest sheath; ulnar or femoral access instead of a very small radial artery; fewer manipulations; adequate moderate sedation (Oxford: mild sedation before access, for example with opiates and benzodiazepines); adequate local anaesthetic before the puncture; a long (24 cm) sheath that reaches the brachial artery and keeps catheter movement away from the radial artery"],
            ["Rescue", "Vasodilators (nitroglycerin, verapamil; given intravenously if nothing can be aspirated from the sheath's side arm; the nitroglycerin may also be given by injection into the tissue around the artery; Oxford: intra-arterial nitrates and verapamil through the sheath or catheter); more sedation, rarely propofol or even a general anaesthetic or a nerve block if equipment is trapped by severe spasm (11.2.4); warmth (warm blankets, or gauze soaked in warm sterile saline over the forearm); a lubricious solution; an upper-arm cuff inflated above systolic pressure for 5 minutes and then let down, which relaxes the artery through ischaemia"],
            ["Never", "Pull the sheath out by force: the whole radial artery can be avulsed"],
          ],
        },
        { kind: "tip", id: "access-radial-spasm-no-traction" },
        { kind: "h", text: "Radial pseudoaneurysm" },
        {
          kind: "list",
          items: [
            "**Presentation.** A pulsatile lump over the access site; duplex confirms it.",
            "**Causes.** Several punctures of the artery; a sheath large for the artery; aggressive anticoagulation; poor haemostasis.",
            "**Prevention.** Meticulous access; ulnar or femoral access instead of a very small radial artery; the smallest sheath possible.",
            "**Treatment.** Most thrombose without treatment. If one does not, ultrasound-guided compression, thrombin injection or surgery; endovascular repair using a covered stent appears in a published report.",
          ],
        },
        { kind: "h", text: "Sterile granuloma" },
        {
          kind: "list",
          items: [
            "**Presentation.** A red nodule over the radial puncture, sometimes with a sterile discharge. The diagnosis is clinical, once infection has been excluded. It can later give rise to a pseudoaneurysm.",
            "**Cause.** The body reacts to the sheath's polymer as a foreign material. It was commoner with an earlier generation of hydrophilic radial sheaths from one manufacturer, which Brilakis advises avoiding, but it still occurs with current devices.",
            "**Treatment.** Usually settles with time; a steroid cream may help; surgical excision if the nodule does not resolve.",
          ],
        },
        {
          kind: "check",
          stem: "Three weeks after radial PCI, a woman returns with a red, slightly discharging nodule at the puncture. She is well, afebrile, and cultures of the discharge grow nothing. The nodule is not pulsatile. What is the most likely diagnosis and plan?",
          options: [
            "Radial pseudoaneurysm: ultrasound-guided thrombin injection into it today",
            "Sterile granuloma: wait or steroid cream, excise if it persists, watch it",
            "Access-site infection: intravenous antibiotics and surgical debridement",
            "Radial artery occlusion: start anticoagulation and arrange a duplex scan",
          ],
          answer: 1,
          explanation:
            "An erythematous nodule with sterile discharge, once infection is excluded, is a sterile granuloma, a foreign-body reaction to the sheath polymer (Brilakis 29.2.5). Symptoms usually resolve; a steroid cream may help, and excision is for a nodule that does not resolve. Granulomas can lead to a delayed pseudoaneurysm, so a new pulsatile lump would need duplex. A non-pulsatile lump with negative cultures in a well patient fits neither pseudoaneurysm nor infection.",
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the band fully inflated for hours.",
            "Skipping heparin in a short diagnostic radial case.",
            "Reusing a small radial artery with a large sheath.",
            "Forcing a gripped sheath out.",
            "Treating a sterile granuloma as an abscess, or missing the pseudoaneurysm that can follow it.",
          ],
        },
        {
          kind: "pearl",
          text: "The radial artery is a resource for the patient's next procedure. Treat the whole radial sequence (the smallest sheath, heparin, vasodilator, patent haemostasis, short compression) as one package that keeps it open.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Through the radial route, choose the smallest sheath that the plan allows, give the vasodilator and heparin, and at the end apply the band with patent haemostasis (plethysmograph on the index finger, ulnar artery occluded) and plan its removal within 2 hours. If the lab reports spasm on withdrawal, use vasodilators, sedation, warmth or the 5-minute upper-arm cuff, and never pull.",
        },
        { kind: "video", id: "SU74rGGZTe8", note: "Manual of PCI chapter video 29.5: radial access complications." },
        {
          kind: "keypoints",
          items: [
            "Radial occlusion: often silent (Oxford: pulse loss up to 5%, transient occlusion up to 7–8%). Causes: small artery or large sheath, non-patent haemostasis, little or no anticoagulation, repeat access.",
            "Prevent with heparin, patent haemostasis, compression of 2 hours or less (band 1–2 hours), ulnar compression; Brilakis adds distal radial access, but in DISCO RADIAL, with best practices in both arms, occlusion was equally low and distal access needed crossover more often.",
            "Brilakis: Allen and Barbeau tests do not predict occlusion; Oxford describes the Allen test and notes some operators require it.",
            "Spasm: prevent with sedation, local anaesthetic, vasodilators, small thin-walled sheaths, fewer manipulations; rescue with vasodilators (intravenous if the side arm will not aspirate), sedation, warmth, lubricant, the 5-minute cuff, rarely general anaesthesia or a nerve block; never pull hard.",
            "Radial pseudoaneurysm: most thrombose; otherwise compression, thrombin or surgery.",
            "Sterile granuloma: foreign-body reaction to the sheath polymer; usually settles; steroid cream; excise if persistent; may lead to a pseudoaneurysm.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-access-complications-large-bore",
      title: "Large-bore bail-out: crossover balloon occlusion, failed closure and the covered stent",
      minutes: 16,
      topics: ["cx-large-bore-bailout"],
      sources: [B("14.1"), B("14.3"), B("14.4"), B("14.5"), B("29.1"), B("5.2"), B("4.2"), B("11.1"), B("30.1"), B("30.15"), O("ch 9: Impella"), O("ch 9: Extracorporeal membrane oxygenation"), O_LIMB],
      refs: [...BOOKS, ...LARGE_BORE_REFS],
      blocks: [
        {
          kind: "p",
          text: "A 14 Fr hole in the femoral artery bleeds briskly the moment the sheath is out, and an iliac artery torn by a large device bleeds into the retroperitoneum where no one can press on it. The answer is the same in both: stop the inflow from inside the artery, with a balloon brought from somewhere else, then seal the hole at leisure in a dry field. This lesson builds on the large-bore access and pre-close sequence taught in pm-access and the bleeding algorithm earlier in this module.",
        },
        {
          kind: "list",
          items: [
            "**How large.** Brilakis: the 14 Fr microaxial pump sheath needs iliofemoral arteries over 5 mm across; VA-ECMO arterial cannulae are 15 Fr for most women and 17 Fr for most men (larger in some), venous cannulae 25 Fr in most; balloon pumps go through a 7–8 Fr sheath (14.1–14.5). His sheath chapter gives slightly different ranges: 7–9 Fr for the balloon pump (which can also go in without a sheath), 13 Fr for the smallest microaxial pump and 14 Fr for the next, and 15–19 Fr for the ECMO arterial cannula (30.1). Oxford gives access sizes of 12, 14 and 21 Fr for the three left-sided microaxial pumps, ECMO cannulae of 18–21 Fr (venous) and 14–16 Fr (arterial), and notes that a surgical cut-down is often needed for ECMO. A bigger sheath fills more of the lumen, and limb ischaemia and thrombosis become more likely (30.1).",
            "**How often things go wrong.** In one single-centre Swiss series of 149 transfemoral TAVI procedures, 27 patients (18%) had a vascular complication; the commonest by far was an arteriotomy that did not close completely (19 of 27), followed by dissection, perforation, occlusion and pseudoaneurysm. These were valve-delivery sheaths, not a 14 Fr pump sheath, so the figures are a guide, not a rate for pump access. Oxford notes that the microaxial pump needs larger access than a balloon pump and so carries a higher risk of access complications, and lists vascular trauma among the complications of both the pump and ECMO.",
            "**Reducing the risk before you start.** The least diseased femoral artery; angiography first; iliac angioplasty, stenting or intravascular lithotripsy when calcified or narrowed iliac arteries stop the device; axillary or transcaval access as alternatives that need teams experienced in large-bore access and closure (Brilakis 14.1, 14.4). Many operators also place a 4 Fr femoral sheath at the start of high-risk PCI so that a support device can go in quickly if needed (14.1.2).",
          ],
        },
        { kind: "h", text: "Step 1: set up the crossover balloon before the sheath comes out" },
        {
          kind: "steps",
          items: [
            {
              title: "What Brilakis does",
              detail:
                "At the end of a protected PCI, when the pump sheath is removed and the pre-close sutures are tightened, a balloon can be passed from the opposite femoral artery into the iliac artery of the large-bore side to cut the bleeding and make haemostasis easier (14.4, step 12). He also advises, for an iliac perforation, a rapidly obtained second access (femoral or radial) for balloon occlusion followed by a covered stent, which may prevent a retroperitoneal haematoma or limit its size (5.2.5.2). Note that he presents the crossover balloon at sheath removal as an option, not a rule; the case for using it routinely comes from the TAVI series below, which are non-randomised.",
            },
            {
              title: "How the technique was described",
              detail:
                "In the TAVI series that described the crossover technique, the opposite femoral artery was cannulated with a 7 Fr long sheath, a balloon was passed over the aortic bifurcation and inflated in the proximal iliac artery of the large-bore side, the large sheath was then removed and the sutures tied in a dry field, with balloon 'optimisation' of the puncture site as required. A later series passed the occlusion balloon from the left radial artery (also its diagnostic access) and inflated it in the proximal iliac artery; its three access-site complications were all treated with covered stents delivered from the opposite femoral artery.",
            },
            {
              title: "Why it is worth the extra access",
              detail:
                "When major on-table injuries occurred in the first series (iliac avulsion, iliac dissections, an iliac and a common femoral perforation), the crossover balloon kept the patients stable while they were repaired by surgical and endovascular means. In a later comparison, routine crossover balloon occlusion succeeded in 96% and was associated with fewer major access-site vascular or bleeding complications at 30 days than in the patients treated before it was adopted (5.5% against 18.6%; a non-randomised comparison).",
            },
            {
              title: "Keep a wire in the large-bore artery",
              detail:
                "When large arteriotomies are closed with suture devices, Brilakis reinserts the 0.035 inch wire through the device's wire port as it is withdrawn, and readvances the wire if there is any concern that the device has failed, removing it only once haemostasis is secure (11.1.8). A wire in the artery keeps a route for a balloon at the arteriotomy, a covered stent or a further suture device.",
            },
          ],
        },
        { kind: "tip", id: "mcs-cx-crossover-balloon-before-removal" },
        { kind: "tip", id: "mcs-largebore-removal-sutures" },
        {
          kind: "check",
          stem: "A protected PCI with a 14 Fr microaxial pump in the right femoral artery is finished, the pump has been weaned, and two pre-close sutures are waiting. The left femoral artery has a 6 Fr sheath used for the guide. What set-up best matches Brilakis and the crossover technique before the pump and sheath come out?",
          options: [
            "A balloon from the left groin into the right iliac artery, ready, and a wire kept in the right",
            "Remove the left sheath first, so that only one groin has to be pressed at the very end of the case",
            "Pull the pump and sheath out together slowly, then tighten the sutures as the bleeding allows",
            "Deploy a collagen plug through the 14 Fr sheath before removing it, then tie the two sutures",
          ],
          answer: 0,
          explanation:
            "Brilakis offers, as an option, a balloon from the opposite femoral artery into the iliac artery to reduce bleeding and make haemostasis easier when the large sheath comes out and the sutures are tightened; the crossover series tied the sutures in a dry field this way. Keeping a wire in the large-bore artery keeps a route for any bail-out. The pump itself is removed quickly, because it bleeds heavily while its outlet is out of the sheath and its inlet still inside.",
        },
        { kind: "h", text: "Step 2: when the large-bore site bleeds" },
        {
          kind: "steps",
          title: "The bail-out sequence (built from Brilakis 11.1, 14.4, 29.1.2.4 and 5.2.5.2, and the crossover series)",
          items: [
            {
              title: "1. Recognise it",
              detail:
                "Brisk bleeding at the groin after the sheath is out or around it; or hypotension, a retroperitoneal picture and, in the laboratory, a dented bladder or contrast outside the artery on the access angiogram. Start the general measures for bleeding from the first lesson.",
            },
            {
              title: "2. Stop the inflow",
              detail:
                "Inflate the crossover balloon at low pressure in the iliac artery above the site (Brilakis inflates the balloon at low pressure over the site of an iliofemoral perforation before any definitive treatment). If no crossover access was placed, get one quickly, from the other femoral or a radial artery (5.2.5.2).",
            },
            {
              title: "3. Keep the wire, and know what the sources say about a failed suture",
              detail:
                "With the balloon up, the wire in the artery is your route to the definitive repair, so it stays. Brilakis's remedy for a suture that is cut or loose while the device is still in the artery during deployment is to pass a wire back into the artery through the device, remove it and deploy another (11.1.8). He does not address a pre-close suture that breaks at knot-tightening after a large sheath is out; trying a further suture device over the retained wire at that point is this module's extrapolation of 11.1.8. What the sources do support for a large-bore hole that will not close is balloon occlusion followed by a covered stent, or surgery (Brilakis 29.1.2.4, 5.2.5.2), and that is how both TAVI series treated failed closure. A device that will not come out: rotate gently in both directions while withdrawing; if it is still stuck, call the vascular surgeons. Oozing around a sheath that is still in because the hole is bigger than the sheath: Brilakis upsizes the sheath (4.2.15, 11.1.2).",
            },
            {
              title: "4. Still leaking after prolonged balloon occlusion: covered stent",
              detail:
                "A covered stent across the hole seals a large-vessel perforation, though it may be hard to deliver. In the Swiss TAVI series, percutaneous stent-graft implantation succeeded in 21 of 23 patients, and patency at follow-up was high; among the stents imaged at follow-up, 4 (22%) had fractured, all without symptoms, and the authors advise careful surveillance. In the radial-crossover series the covered stents were delivered from the opposite femoral artery, and the stent graft in Brilakis's Fig. 29.5 (from the Swiss series) was placed over a wire parked in the superficial femoral artery.",
            },
            {
              title: "5. Choose the stent for the place",
              detail:
                "Balloon-expandable covered stents position more precisely; self-expanding ones resist deformation when the hip flexes and are preferred in the common femoral artery, where stents are prone to fracture. Brilakis would rather not leave a stent in the common femoral artery at all where another fix exists (he prefers endarterectomy for a flow-limiting dissection there, 4.2.15), so, in this module's reading, a stent there needs a clear landing zone above the bifurcation, and surgery is at least as reasonable when there is none. The ones Brilakis lists need a 6 or 7 Fr sheath (one balloon-expandable type) or a 7 Fr sheath (the others), and the smallest diameter among them is 5 mm. Do not stent across the point where the common femoral artery divides into the superficial and profunda femoral arteries.",
            },
            {
              title: "6. Surgery",
              detail:
                "When the stent fails or is not wanted (a bifurcation injury), or the site cannot be controlled. A flow-limiting common femoral dissection is also better treated by endarterectomy than by a stent (4.2.15).",
            },
            {
              title: "7. The leg afterwards",
              detail:
                "Check the distal pulses and image the leg: over-tightened knots (Oxford) and a closure device in the lumen (Brilakis) can leave the leg ischaemic (previous lesson); by reasoning rather than either manual, so can a stent that narrows the artery or a long balloon occlusion of the iliac artery.",
            },
          ],
        },
        { kind: "tip", id: "mcs-cx-largebore-bleed-balloon" },
        { kind: "tip", id: "mcs-cx-covered-stent-site" },
        { kind: "tip", id: "access-suture-loose-second-device" },
        {
          kind: "check",
          stem: "Your crossover balloon is inflated in the right external iliac artery after a failed pre-close, and the field is dry. An angiogram with the balloon briefly down shows a jet from the right common femoral artery about 2 cm above the bifurcation, leaving a landing zone of healthy artery below it. The left femoral sheath is 8 Fr. Which definitive option fits the manual?",
          options: [
            "Balloon-expandable covered stent across the bifurcation, for precision",
            "A bare-metal stent, because it fractures less than a covered stent",
            "Self-expanding covered stent above the bifurcation, or surgery",
            "Deflate the balloon and hold firm manual pressure for an hour",
          ],
          answer: 2,
          explanation:
            "Brilakis prefers self-expanding covered stents in the common femoral artery, because they resist deformation in flexion, and sends perforations at the superficial and profunda femoral bifurcation to surgery when a stent is not desirable there. Because common femoral stents are prone to fracture, he avoids stents there where another fix exists, so surgical repair is an equally reasonable choice; the landing zone is what makes the stent possible here. A bare stent does not seal a hole. Precise positioning is the strength of balloon-expandable stents, but not at the cost of covering the bifurcation in a segment that flexes.",
        },
        { kind: "h", text: "Device-specific moments of danger" },
        {
          kind: "table",
          caption: "Where large-bore devices bleed (Brilakis 14.3–14.5, 14.1)",
          head: ["Device", "Moment", "What to do"],
          rows: [
            ["Microaxial pump", "Insertion and removal: bleeding is heavy while the inlet is inside the sheath and the outlet outside", "Insert with fast, small movements; remove quickly"],
            ["Microaxial pump continuing after PCI", "Removing the peel-away sheath", "Pull it completely out of the body before peeling it; peeling it while part of it is still in the artery can injure the artery and cause bleeding that is hard to control"],
            ["VA-ECMO", "Arterial cannula", "Displacement can cause massive bleeding or a haematoma; bleeding around the cannula; perforation, so insert it under fluoroscopy over a stiff wire"],
            ["VA-ECMO", "Venous cannula", "Laceration as it advances: advance under fluoroscopy with the wire confirmed in the superior vena cava, and stop at any resistance"],
            ["Balloon pump", "Retroperitoneal bleeding", "May require anticoagulation to be stopped; if it is stopped, run the pump at 1:1 to reduce thrombus forming on the balloon"],
            ["Balloon pump and VA-ECMO", "Uncontrolled bleeding", "Brilakis: a contraindication, although both can be run without anticoagulation for a short time in a patient who is actively bleeding. Oxford lists contraindications to anticoagulation among the major contraindications to ECMO, and among the contraindications to the microaxial pump, so the books differ"],
          ],
        },
        { kind: "tip", id: "mcs-cx-iabp-bleeding-anticoag" },
        { kind: "tip", id: "mcs-cx-ecmo-cannula-bleed" },
        {
          kind: "pitfalls",
          items: [
            "Removing a large sheath with no plan for failure: no wire, and no balloon, covered stent or crossover route ready (Brilakis offers the crossover balloon as an option; routine use rests on non-randomised TAVI series).",
            "Pulling the wire before haemostasis is secure.",
            "Pressing on an iliac bleed: it cannot be compressed.",
            "Covered stent before balloon occlusion, or across the femoral bifurcation.",
            "Peeling a peel-away sheath while part of it is still in the artery.",
            "Forgetting the leg once the bleeding has stopped.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the large-bore case backwards: before the large sheath goes in, decide where the crossover balloon will come from, what size balloon and covered stent you would use for that iliac and common femoral artery, and where they are. Then the bail-out is a sequence you have already rehearsed, not a search of the shelves.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "At the end of a protected PCI, before removing the pump: place the crossover balloon from the opposite femoral artery into the iliac artery of the pump side, keep a wire in the pump-side artery, wean, remove the pump quickly, then remove the sheath with the balloon inflated and tighten the pre-close sutures. If the lab reports bleeding at the site, keep the balloon up and the wire in; a further suture device over the wire is an option by analogy, and if a jet persists, choose a self-expanding covered stent that stays above the femoral bifurcation or call the surgeons.",
        },
        { kind: "video", id: "BE-88Jf6d0Q", note: "Brilakis lecture: vascular access management for coronary and peripheral interventions (Dallas CVI 2015)." },
        { kind: "video", id: "CXdH-QFquHA", note: "Elias Hanna: access complications and their management." },
        {
          kind: "keypoints",
          items: [
            "In one TAVI series (149 patients), 18% had a vascular complication, and incomplete closure of the arteriotomy accounted for 70% of them; valve sheaths are not pump sheaths, so treat this as a guide.",
            "Consider a crossover balloon (other femoral, or radial) before the large sheath comes out (an option in Brilakis, routine in the TAVI series); keep a wire in the large-bore artery until haemostasis is secure.",
            "Bleeding: low-pressure balloon above or over the site first, wire kept; upsize a sheath that oozes around it. A further suture device over the wire for a failed pre-close is an extrapolation of Brilakis 11.1.8.",
            "Persistent leak: covered stent (balloon-expandable for precision; self-expanding in the common femoral artery, with a landing zone); not across the femoral bifurcation; surgery when stenting fails or is unwise.",
            "Common femoral stents tend to fracture (Brilakis); in one TAVI series, 4 of the stent grafts imaged at follow-up (22%) had fractured, all silently, so follow them up.",
            "Microaxial pump: fast in, fast out; peel-away sheath fully out before peeling. ECMO: cannulae under fluoroscopy over stiff wires. Balloon pump: 1:1 if anticoagulation is stopped.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cm-access-complications-q1",
      stem: "Where does the manual's Fig. 29.4 put the reversal of anticoagulation in suspected retroperitoneal haematoma?",
      options: [
        "As the very first act, before IV access or fluids are given, the moment the pressure falls after femoral access",
        "Only after a covered stent or coils have been tried and have failed to stop the extravasation",
        "Among the general measures for bleeding, once the diagnosis of retroperitoneal haematoma is established",
        "Never in the first 24 hours after PCI, because reversal would put the new coronary stent at risk",
      ],
      answer: 2,
      explanation:
        "The algorithm's general measures are large IV or central access, normal saline, type and cross, haemoglobin and reversal of anticoagulation, with reversal marked as after the diagnosis is established (protamine for heparin; stop GP IIb/IIIa inhibitors and cangrelor). It is not the very first act before resuscitation, and it is not deferred until a stent fails.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q2",
      stem: "Which collection of features is most typical of a retroperitoneal haematoma after femoral access in Brilakis's description?",
      options: [
        "Hypotension, sweating, low abdominal or back pain, often bradycardia, usually within the first 3 hours",
        "Hypertension, flushing and a tense, expanding groin swelling within minutes of the sheath coming out",
        "Fever, redness of the groin and a purulent discharge from the puncture appearing two or three days afterwards",
        "A pulsatile, tender groin lump with a bruit and a palpable thrill over the common femoral artery",
      ],
      answer: 0,
      explanation:
        "Brilakis names a low blood pressure, sweating, and pain in the lower abdomen or the back as the commonest signs, often with bradycardia and abdominal or suprapubic tenderness, usually within the first 3 hours. Fever and discharge suggest infection; a pulsatile lump with bruit suggests pseudoaneurysm, and a thrill a fistula. A tense groin swelling is a groin haematoma; a high puncture can bleed upwards into the retroperitoneum with no visible groin haematoma (this module's reasoning, consistent with Oxford's warning that pressing on the groin is unlikely to help).",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q3",
      stem: "Angiography from the opposite groin shows extravasation from the inferior epigastric artery. A low-pressure balloon has been inflated at its origin. Which definitive step does Brilakis's algorithm propose, with which precaution?",
      options: [
        "A covered stent in the external iliac artery as the only possible option, since coils cannot reach small iliac branches",
        "Immediate open surgery, since small-branch bleeding from the iliac system cannot be treated endovascularly",
        "Thrombin injected into the external iliac artery just upstream of the branch so that the clot flows into it",
        "Coil embolisation once retrograde filling of the hole is excluded; glue, microspheres or thrombin if very distal",
      ],
      answer: 3,
      explanation:
        "For small-vessel perforations Brilakis uses coil embolisation, first excluding retrograde bleeding through the perforation, and for very distal holes where coils cannot be delivered, microspheres, cyanoacrylate glue or thrombin, avoiding leakage of the sealant. Prolonged balloon inflation or a covered stent across the branch origin are alternatives, not the only option. Thrombin in the parent artery would embolise downstream.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q4",
      stem: "A 2.6 cm femoral pseudoaneurysm with a narrow neck is to be injected under ultrasound. According to Oxford's Box 10.1, which preparation and dose are typical (to be adapted to local protocol)?",
      options: [
        "5000 IU of thrombin diluted in 50 mL of saline, with a rapid 10 mL bolus into the cavity",
        "1000 IU of thrombin in 1 mL, the whole 1 mL pushed as fast as possible into the neck",
        "5000 IU of bovine thrombin in 5 mL (1000 units/mL); usually 0.5–1 mL, injected slowly",
        "Heparinised saline flushed through a 23-gauge needle into the cavity until flow stops",
      ],
      answer: 2,
      explanation:
        "Oxford makes up 5000 IU of bovine thrombin to 5 mL with 0.9% saline (1000 units per mL), punctures the cavity with a 23-gauge needle under ultrasound and injects slowly; usually 500–1000 units (0.5–1 mL) are needed, and the cavity is seen to 'smoke' and clot. Thrombin goes into the cavity, not the neck, and heparin would do the opposite of what is wanted. Ask first about earlier exposure to thrombin: anaphylaxis to bovine thrombin has been reported, once fatally, so have resuscitation drugs to hand.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "pope-thrombin-anaphylaxis-2000", "jalaeian-thrombin-anaphylaxis-2015"],
    },
    {
      id: "cm-access-complications-q5",
      stem: "How do the two manuals differ on the treatment of a femoral arteriovenous fistula after catheterisation?",
      options: [
        "Brilakis: most need nothing and many close within a year; Oxford: usually treated surgically",
        "Both manuals say that every fistula must be closed surgically within a week of its diagnosis",
        "Brilakis: thrombin injection into the fistula; Oxford: ultrasound-guided compression of the neck",
        "Brilakis: a covered stent even across the bifurcation; Oxford: no treatment is ever required",
      ],
      answer: 0,
      explanation:
        "Brilakis says most fistulae need no treatment and many close spontaneously within a year, with a covered stent (only if the femoral bifurcation is not involved) or surgery for rare large ones. Oxford states that management is usually surgical. Thrombin and compression are treatments for pseudoaneurysm.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cm-access-complications-q6",
      stem: "A flow-limiting dissection appears in the common femoral artery after sheath insertion in a patient whose leg is now cool. What does Brilakis prefer, and why?",
      options: [
        "A balloon-expandable stent through the same sheath, because it is the quickest way to restore flow",
        "No treatment at all, because every dissection made by a sheath is sealed by the forward flow",
        "A self-expanding stent from the opposite groin after crossing into the true lumen from above",
        "Femoral endarterectomy, because a stent left in the common femoral artery is prone to fracture",
      ],
      answer: 3,
      explanation:
        "Non-flow-limiting dissections usually heal, but a flow-limiting one needs treatment by location: in the common femoral artery Brilakis prefers femoral endarterectomy to avoid a stent in a segment where stents fracture; in the iliac artery he crosses into the true lumen from the opposite femoral artery and places a self-expanding stent. So the self-expanding stent from the other groin is the iliac answer, not the common femoral one.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q7",
      stem: "Which feature distinguishes cholesterol embolisation syndrome from acute limb ischaemia after femoral access?",
      options: [
        "Absent peripheral pulses in a cold, pale limb that the patient cannot move properly",
        "A pulsatile, tender groin lump with a bruit, confirmed by duplex as flow in and out",
        "Leg or foot pain with livedo reticularis and intact pulses, often with eosinophilia",
        "Pain on passive stretching of a tense, swollen forearm in the hours after radial PCI",
      ],
      answer: 2,
      explanation:
        "Brilakis describes the classic triad of cholesterol embolisation as pain in the leg or foot, livedo reticularis, and peripheral pulses that are still present, often with hypereosinophilia and sometimes acute renal failure, from showers of microemboli. Acute limb ischaemia shows the six Ps, including the pulse deficit. There is no specific treatment for cholesterol embolisation; prevention is the key.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q8",
      stem: "After a right radial PCI the band was placed exactly over the skin puncture, which was made with a very flat needle angle. An hour later the forearm is swelling. What is the most likely mechanism?",
      options: [
        "The arterial hole lies proximal to the skin hole, so the band was too distal to compress it",
        "The band sat too proximal to the arterial hole, so blood collected at the wrist and spread",
        "The band compressed the ulnar artery as well, so the forearm became engorged with venous blood",
        "The heparin dose was too low for a PCI, so the puncture could not seal under the band",
      ],
      answer: 0,
      explanation:
        "Brilakis explains that the arterial entry is often proximal to the skin entry, more so with a shallow needle angle; a band placed too distally leaves the arterial hole uncompressed and causes bleeding into the forearm, whereas a band too proximal causes a wrist haematoma. Hence the band goes slightly proximal to the puncture. Too little heparin causes occlusion, not bleeding.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-access-complications-q9",
      stem: "A forearm haematoma is being treated with an inflated blood pressure cuff on the arm. Which statement about the cuff pressure is accurate?",
      options: [
        "All the sources agree: cuff exactly at systolic pressure, left up for 30 minutes at a time",
        "Oxford sets the cuff 20 mmHg above systolic pressure and lets it down once every hour",
        "None uses a cuff, because a cuff on the arm itself causes forearm compartment syndrome",
        "They differ: above systolic (Brilakis text), 20 below (his chart), up to 15 below (Oxford)",
      ],
      answer: 3,
      explanation:
        "Brilakis's text (29.2.1.4) says a cuff can be inflated above systolic pressure to help haemostasis; the haematoma chart in Fig. 29.10 sets it 20 mmHg below systolic, deflated every 15 minutes, with finger saturation monitoring; Oxford uses up to 15 mmHg below systolic to stop a forearm haematoma progressing. The differences are real; follow local protocol and time the deflation.",
      difficulty: 3,
      refs: [...BOOKS, "bertrand-forearm-2010"],
    },
    {
      id: "cm-access-complications-q10",
      stem: "During removal of a 14 Fr sheath, one pre-close suture breaks and the groin bleeds briskly. A crossover balloon sits in the ipsilateral external iliac artery from the opposite groin, and a 0.035 inch wire remains in the artery. Which sequence is best?",
      options: [
        "Pull the wire, hold firm pressure on the groin for 30 minutes and give protamine, then reassess the bleeding",
        "Deliver a covered stent across the femoral bifurcation at once, without inflating the crossover balloon",
        "Crossover balloon up at low pressure, wire kept in, then a covered stent or surgery if it still leaks",
        "Insert a larger sheath over the wire and leave it in overnight so that the hole can be closed tomorrow",
      ],
      answer: 2,
      explanation:
        "Stop the inflow from inside with the low-pressure balloon (Brilakis inflates one before definitive treatment of iliofemoral bleeding) and keep the wire. If bleeding persists after prolonged occlusion, a covered stent seals large-vessel holes, self-expanding in the common femoral artery and not across the bifurcation, which goes to surgery; that is how the TAVI series treated failed closure. A further suture device over the wire may be tried first, by analogy with Brilakis 11.1.8 (his remedy for a suture found cut or loose during deployment), but he does not describe it for a pre-close that fails after the sheath is out. Pulling the wire loses every endovascular option. Upsizing a sheath is a remedy for oozing around a sheath during a case, not for a failed closure, and an overnight sheath invites infection.",
      difficulty: 3,
      refs: [...BRILAKIS, "sharp-crossover-tavi-2010", "stortecky-tavi-vascular-2012"],
    },
    {
      id: "cm-access-complications-q11",
      stem: "VA-ECMO is running in a patient who develops major retroperitoneal bleeding. What does Brilakis say about anticoagulation for these devices?",
      options: [
        "Uncontrolled bleeding is a contraindication, yet both can run briefly without anticoagulation",
        "VA-ECMO can never run without anticoagulation, so heparin continues at full dose whatever the bleeding",
        "Anticoagulation is increased to protect the circuit while the bleeding point is repaired surgically",
        "The balloon pump, if one is also in, is switched to 1:3 augmentation once anticoagulation is stopped",
      ],
      answer: 0,
      explanation:
        "Brilakis lists uncontrolled bleeding as a contraindication to VA-ECMO and the balloon pump, adding that either device may be run for a brief period with no anticoagulant in a patient who is actively bleeding. For the balloon pump without anticoagulation he uses 1:1 augmentation to reduce thrombus on the balloon, not 1:3. Oxford lists contraindications to anticoagulation among the major contraindications to ECMO, and among the contraindications to the microaxial pump, so the books differ.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-access-complications-q12",
      stem: "A radial sheath cannot be withdrawn because of severe spasm despite intra-arterial verapamil and nitroglycerin. Which is NOT among Brilakis's rescue measures?",
      options: [
        "Deeper sedation, and rarely propofol or even a general anaesthetic",
        "Warm blankets or gauze soaked in warm saline over the forearm",
        "An upper-arm cuff above systolic for 5 minutes, then released",
        "Steady, firm traction on the sheath until it finally comes out",
      ],
      answer: 3,
      explanation:
        "Brilakis treats spasm with vasodilators, more sedation (rarely propofol or general anaesthesia), warming, a lubricious solution and ischaemia-mediated vasodilation with an upper-arm cuff for 5 minutes, and specifically warns against forceful withdrawal, which can avulse the radial artery (Fig. 29.12).",
      difficulty: 1,
      refs: BRILAKIS,
    },
  ],
  sims: [
    { sim: "procedure", task: "Femoral and radial access with ultrasound and fluoroscopy, a femoral angiogram that you read for puncture height, a radial band placed slightly proximal to the puncture with patent haemostasis, and the recovery-room complications that follow." },
    { sim: "impella", task: "Large-bore access and exit: angiogram for the leg after the 14 Fr sheath, distal limb checks during support, and removal over a crossover balloon with a wire kept in the artery and the pre-close sutures tightened in a dry field." },
    { sim: "ecmo", task: "Cannulate with an antegrade perfusion sheath placed first, and act on limb NIRS values and on bleeding around the arterial cannula." },
  ],
  caseIds: ["cm-access-complications-case-retroperitoneal", "cm-access-complications-case-large-bore"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cm-access-complications-case-retroperitoneal",
    title: "Hypotension on the table after femoral PCI: the retroperitoneal algorithm in the laboratory",
    trackId: "complication-management",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI 29.1.2 (Figs 29.3 to 29.6), 4.2, 5.2.5.2, 11.1, 3.5 and 28.1; Oxford Handbook ch 10 (vascular complications) and ch 3 (femoral artery access); Ellis 2006 and the European major-bleeding guideline (fluid strategy, extrapolated).",
    },
    summary:
      "A high, unguided femoral puncture in an obese, hypertensive patient on cangrelor bleeds into the retroperitoneum before she has left the table. The case walks through the general measures, the in-laboratory diagnosis, balloon occlusion from the other groin, reversal, and the choice of covered stent.",
    presentation:
      "A 71-year-old woman (BMI 37) with an NSTEMI had PCI to the circumflex through a 7 Fr right femoral sheath after the right radial artery would not take a wire. The femoral artery was punctured by landmarks without ultrasound or fluoroscopy, at the third attempt. Her BP was 186/98 mmHg at the puncture. She received unfractionated heparin and a cangrelor infusion, which is still running. The femoral angiogram through the sheath was not taken.",
    findings: [
      "Obese; uncontrolled hypertension at the puncture",
      "Landmark puncture, three attempts, no femoral angiogram",
      "Unfractionated heparin given; cangrelor running",
      "Contrast given during the PCI, so the bladder is opacified",
    ],
    steps: [
      {
        id: "s1",
        prompt: "As the guide is withdrawn she becomes pale and sweaty and complains of low back pain. BP 82/48 mmHg, HR 52 bpm. The right groin is soft. What do you do first?",
        info: "Sheath still in the right femoral artery. ECG unchanged from the end of the PCI.",
        options: [
          {
            text: "Treat it as a retroperitoneal bleed: call for help, large-bore IV access, crystalloid, blood for cross-match and a haemoglobin, and keep thinking about other causes",
            best: true,
            feedback: "Right. Brilakis suspects a retroperitoneal haematoma in every patient who becomes hypotensive after femoral access, and a slow pulse with sweating and back pain fits it. The general measures start at once; reversal of the anticoagulation (protamine, and stopping the cangrelor) comes once the diagnosis is established. Give crystalloid to restore perfusion while blood is obtained, not reflex litres.",
            stateDelta: { stability: 0 },
          },
          {
            text: "It is vasovagal: give atropine and raise the legs, then carry on removing the equipment",
            feedback: "A slow pulse is common in retroperitoneal bleeding, so it does not make this vagal. Treating it as a faint wastes the minutes when she is still in the laboratory with a sheath in.",
            next: "c-vagal",
            stateDelta: { stability: -15, flags: ["vagal-label"] },
          },
          {
            text: "Remove the femoral sheath and press hard on the groin",
            feedback: "If the hole is above the inferior epigastric artery, pressure will not reach it (Oxford: manual compression is unlikely to help), and the sheath is your route for diagnosis and treatment.",
            next: "c-sheath-out",
            stateDelta: { stability: -15, flags: ["sheath-pulled"] },
          },
        ],
      },
      {
        id: "c-vagal",
        kind: "consequence",
        prompt: "After atropine her heart rate is 88 bpm but BP is 74/40 mmHg and she is more confused. What now?",
        options: [
          {
            text: "Start the general measures for bleeding now and screen the bladder",
            best: true,
            feedback: "Correct course: the response to atropine did not restore the pressure, because the problem is volume.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Repeat the atropine and give more saline only",
            feedback: "Atropine does not replace blood. Look for the bleeding.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-sheath-out",
        kind: "consequence",
        prompt: "With the sheath out and pressure held, BP is 76/42 mmHg. The groin stays soft. What now?",
        options: [
          {
            text: "General measures, bladder fluoroscopy, and access in the left femoral artery for angiography of the right iliofemoral arteries",
            best: true,
            feedback: "The way back in is now from the other side, which is where the algorithm goes in the laboratory anyway.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pressing for another 20 minutes and recheck",
            feedback: "A high puncture bleeds into the retroperitoneum whatever you do at the groin.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "After 1 litre of saline, BP 88/52 mmHg. She is still on the table. How do you confirm the diagnosis and find the source?",
        options: [
          {
            text: "Fluoroscopy of the pelvis to look at the bladder, then access in the left femoral artery and angiography of the right iliac and femoral arteries",
            best: true,
            feedback: "Right: in the laboratory, the algorithm screens the bladder and images from the other groin. The angiogram shows the source and lets you treat it.",
            next: "s3",
            stateDelta: { stability: 0 },
          },
          {
            text: "Move her to CT of the abdomen and pelvis now",
            feedback: "CT is for patients who have left the laboratory and are stable. She is here, unstable, with the tools to diagnose and treat at hand; in the series Brilakis cites, deaths followed delays to obtain CT.",
            next: "c-ct",
            stateDelta: { stability: -15, flags: ["ct-delay"] },
          },
          {
            text: "Send her to the ward with a repeat haemoglobin in 4 hours",
            feedback: "The haemoglobin often has not fallen yet in acute bleeding, and she is hypotensive now.",
            next: "c-ct",
            stateDelta: { stability: -20, flags: ["ward-delay"] },
          },
        ],
      },
      {
        id: "c-ct",
        kind: "consequence",
        prompt: "Forty minutes later, CT shows a large right retroperitoneal haematoma with active extravasation and the bladder pushed to the left. BP 72/40 mmHg after 2 units of blood. What now?",
        options: [
          {
            text: "Straight back to the laboratory: contralateral femoral access and angiography to treat the bleeding point",
            best: true,
            feedback: "The algorithm's branch for a haematoma with active bleeding. The lost time cost blood.",
            next: "s3",
            stateDelta: { stability: 5 },
          },
          {
            text: "Conservative management with transfusion",
            feedback: "Conservative care is for a retroperitoneal haematoma without active bleeding.",
            next: "s3",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The bladder is pushed to the left. Angiography from the left femoral artery, crossing over the bifurcation, shows contrast streaming from the right external iliac artery just above the inguinal ligament, at the puncture. What is the first treatment?",
        variants: [{ flag: "ct-delay", info: "The haematoma on screen is now very large." }],
        options: [
          {
            text: "Inflate a balloon at low pressure across the hole from the left side, to stop the bleeding before any definitive treatment",
            best: true,
            feedback: "Right. As with a coronary perforation, Brilakis stops the bleeding with a low-pressure balloon over the site first; a prolonged inflation may be enough.",
            next: "s4",
            stateDelta: { stability: 10 },
          },
          {
            text: "Deliver a covered stent straight away without a balloon",
            acceptable: true,
            feedback: "A covered stent is the likely end point, but the bleeding continues while you prepare and deliver it. Brilakis inflates a balloon over the site first.",
            next: "s4",
            stateDelta: { stability: -5 },
          },
          {
            text: "Coil the external iliac artery",
            feedback: "Coils are for small-branch perforations such as the inferior epigastric. Coiling the external iliac would make the leg ischaemic.",
            next: "c-coil",
            stateDelta: { stability: -20, flags: ["iliac-coiled"] },
          },
        ],
      },
      {
        id: "c-coil",
        kind: "consequence",
        prompt: "The vascular surgeon on the phone stops you. What instead?",
        options: [
          {
            text: "Balloon occlusion at low pressure over the hole, then a covered stent if it keeps leaking",
            best: true,
            feedback: "Large-vessel perforation: balloon, then covered stent; coils are for small branches.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Ligate it surgically now without trying the balloon",
            feedback: "Surgery is the step after the endovascular options fail or are unsuitable.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "With the balloon up, BP rises to 104/62 mmHg. The diagnosis is established. What do you do about the anticoagulation?",
        options: [
          {
            text: "Protamine for the heparin, and stop the cangrelor",
            best: true,
            feedback: "Right: the general measures include reversing anticoagulation once the diagnosis is established, with protamine for heparin and discontinuation of cangrelor or a GP IIb/IIIa inhibitor (doses and cautions in pm-antithrombotics). Plan the oral P2Y12 inhibitor now, with senior input: cangrelor's short half-life means platelet function returns quickly once it stops, leaving the new circumflex stent unprotected. Brilakis gives ticagrelor at any time, and loads clopidogrel or prasugrel straight after cangrelor stops (3.5; antiplatelet decisions after bleeding: cm-patient-complications).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Continue heparin to protect the new stent in the circumflex",
            feedback: "She is bleeding into the retroperitoneum; the algorithm reverses anticoagulation once the diagnosis is made.",
            next: "c-heparin",
            stateDelta: { stability: -15, flags: ["heparin-continued"] },
          },
        ],
      },
      {
        id: "c-heparin",
        kind: "consequence",
        prompt: "Each brief deflation of the balloon shows a larger jet. What now?",
        options: [
          {
            text: "Reverse the heparin with protamine and keep the balloon up",
            best: true,
            feedback: "Reversal belongs in the general measures once the diagnosis is made.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Add a GP IIb/IIIa inhibitor to protect the stent",
            feedback: "Brilakis lists GP IIb/IIIa inhibitors and cangrelor among the causes of this bleeding.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After a prolonged inflation, a check angiogram still shows a jet from the external iliac artery. The hole is 3 cm above the femoral head, well away from the femoral bifurcation. A wire has been passed through the right sheath, and with the balloon up the right sheath has been withdrawn over it, so that nothing now crosses the hole. What next?",
        options: [
          {
            text: "A covered stent across the hole in the external iliac artery, delivered through an adequate sheath from the left groin; a balloon-expandable stent positions precisely here",
            best: true,
            feedback: "Right. A covered stent seals a large-vessel perforation that prolonged inflation has not. Balloon-expandable covered stents position more precisely; the self-expanding preference applies to the common femoral artery, which flexes. Check the sheath size the stent needs (6–7 Fr for the ones Brilakis lists).",
            next: "s6",
            stateDelta: { stability: 10 },
          },
          {
            text: "A bare-metal self-expanding stent",
            feedback: "A bare stent does not seal a hole.",
            next: "s6",
            stateDelta: { stability: -15, flags: ["bare-stent"] },
          },
          {
            text: "Deflate the balloon and transfuse until the bleeding stops on its own",
            feedback: "It has not stopped after prolonged occlusion; definitive treatment is needed.",
            next: "s6",
            stateDelta: { stability: -15, flags: ["no-seal"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The covered stent seals the hole and BP is 118/70 mmHg. What do you check and arrange before she leaves the laboratory?",
        options: [
          {
            text: "Distal pulses and flow into the leg, haemoglobin and transfusion needs, monitoring for further bleeding, and a review of why it happened: unguided high puncture, multiple attempts, hypertension, no femoral angiogram",
            best: true,
            feedback: "Right. The leg must be checked after any iliofemoral intervention, and the causes listed by Brilakis were all present: the review is how the next one is prevented.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Nothing more: the stent has sealed it",
            feedback: "Check the leg and the haemoglobin, and learn from the causes.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The external iliac puncture was sealed with a covered stent after balloon occlusion from the left groin; she needed two units of blood, the leg remained well perfused, and she recovered.",
    outcomeVariants: [
      { flag: "vagal-label", text: "Treating the first fall in pressure as vagal cost minutes and blood." },
      { flag: "sheath-pulled", text: "Pulling the sheath removed the easy route for diagnosis; the bleeding was found from the other groin." },
      { flag: "ct-delay", text: "The trip to CT while unstable allowed a much larger haematoma to form, and more transfusion was needed." },
      { flag: "ward-delay", text: "Sending her out before the source was found delayed treatment until the haematoma was large." },
      { flag: "iliac-coiled", text: "The attempt to coil a large vessel was abandoned before harm, but it delayed the balloon." },
      { flag: "heparin-continued", text: "Continuing heparin kept the hole bleeding until it was reversed." },
      { flag: "bare-stent", text: "The bare stent did not seal the hole; a covered stent was needed afterwards." },
      { flag: "no-seal", text: "Waiting for the bleeding to stop by itself prolonged the shock until a covered stent was placed." },
    ],
    learningPoints: [
      "Hypotension after femoral access is retroperitoneal bleeding until proven otherwise; a slow pulse and a soft groin do not exclude it.",
      "General measures first: large IV access, crystalloid without reflex litres, early blood, cross-match, haemoglobin, pressure; reverse anticoagulation (protamine, stop cangrelor) once the diagnosis is established.",
      "Once the bleeding is controlled, plan the oral P2Y12 inhibitor with senior input: cangrelor wears off quickly, and the new stent is otherwise unprotected.",
      "In the laboratory, screen the bladder and image from the other groin; CT is for stable patients who have left.",
      "Stop the bleeding with a low-pressure balloon before the definitive treatment.",
      "Large vessel: covered stent. Small branch: coils (after excluding retrograde filling) or other embolics. Surgery if these fail or at the femoral bifurcation.",
      "Prevention: guided puncture over the femoral head, few attempts, controlled blood pressure, sensible anticoagulation, and a femoral angiogram.",
    ],
    refs: [...BOOKS, "ellis-retroperitoneal-2006", "rossaint-trauma-bleeding-2023"],
  },
  {
    id: "cm-access-complications-case-large-bore",
    title: "A pre-close that fails: crossover balloon, wire access and covered stent",
    trackId: "complication-management",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 14.1, 14.4, 11.1.8 (by analogy), 29.1.1–29.1.2, 5.2.5.2 and 4.2.15; Oxford Handbook ch 10 (limb ischaemia); the crossover technique and bail-out stent grafting in the papers cited.",
    },
    summary:
      "At the end of a protected left main PCI, the 14 Fr microaxial pump sheath is removed and a pre-close suture breaks. The case tests the set-up before removal, balloon occlusion from the other side, keeping wire access, the choice between a covered stent near the femoral bifurcation and surgery, and the leg afterwards.",
    presentation:
      "A 68-year-old man with an ejection fraction of 25% has had PCI of the distal left main with support from a 14 Fr microaxial pump in the right common femoral artery (7.5 mm, free of disease on angiography). Two suture devices were deployed at 10 and 2 o'clock before dilatation (pre-close) and left untied. The guide went through a 7 Fr sheath in the left common femoral artery. Heparin was given; the ACT is now 210 s. The PCI result is good and support is no longer needed.",
    findings: [
      "14 Fr pump sheath, right common femoral artery; two untied pre-close sutures",
      "7 Fr sheath in the left common femoral artery",
      "BP 112/68 mmHg on support, HR 84 bpm",
      "Right foot warm with a Doppler signal before the pump went in",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Before you take out the pump and its sheath, how do you set up?",
        options: [
          {
            text: "Pass a balloon from the left femoral artery over the bifurcation into the right iliac artery, ready to inflate, and plan to keep a 0.035 inch wire in the right femoral artery until haemostasis is secure",
            best: true,
            feedback: "Right. Brilakis notes that a balloon in the iliac artery from the other femoral artery reduces bleeding and makes haemostasis easier while the sutures are tightened, and he keeps wire access when closing large arteriotomies.",
            next: "s2",
            stateDelta: { stability: 0 },
          },
          {
            text: "Remove the left sheath first so that only one groin bleeds at a time",
            feedback: "The left sheath is your crossover route. Removing it first throws away the safety net.",
            next: "c-no-crossover",
            stateDelta: { stability: -10, flags: ["no-crossover"] },
          },
          {
            text: "No special preparation: the pre-close sutures will hold",
            acceptable: true,
            feedback: "They usually do, but incomplete closure is the commonest large-bore complication in the TAVI series cited. Without a balloon ready, a failure costs blood.",
            next: "c-no-crossover",
            stateDelta: { stability: -5, flags: ["no-crossover"] },
          },
        ],
      },
      {
        id: "c-no-crossover",
        kind: "consequence",
        prompt: "You begin to remove the sheath without a crossover balloon. What would make this safer now?",
        options: [
          {
            text: "Stop, and pass a balloon from the left femoral artery (or a radial artery) into the right iliac artery first",
            best: true,
            feedback: "A few minutes to set up the balloon buys a dry field if a suture fails.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Carry on and rely on manual pressure if needed",
            feedback: "A 14 Fr hole is hard to control by pressure alone.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The pump has been weaned to a low support level. How do you remove it?",
        options: [
          {
            text: "Pull it back into the aorta, switch it off and disconnect it, then withdraw it quickly through the sheath",
            best: true,
            feedback: "Right: bleeding is heavy while the outlet is outside the sheath and the inlet still inside, so removal is quick.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Withdraw it slowly through the sheath to avoid damaging the valve of the sheath",
            feedback: "Slow removal prolongs the phase in which the device bleeds through the sheath.",
            next: "c-slow",
            stateDelta: { stability: -10, flags: ["slow-removal"] },
          },
        ],
      },
      {
        id: "c-slow",
        kind: "consequence",
        prompt: "Blood pours from the sheath during the slow withdrawal. BP 92/58 mmHg. What now?",
        options: [
          {
            text: "Complete the withdrawal quickly and inflate the crossover balloon if one is in place",
            best: true,
            feedback: "Finish the removal and control the inflow.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stop halfway and wait for the bleeding to settle",
            feedback: "The bleeding will not settle with the device half out.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The crossover balloon is inflated at low pressure in the right external iliac artery, the 14 Fr sheath is withdrawn over a wire, and the sutures are tightened. One suture breaks; when the balloon is let down briefly the groin bleeds briskly. BP 98/60 mmHg. What next?",
        variants: [{ flag: "no-crossover", info: "The crossover balloon was placed only after the sheath removal had begun." }],
        options: [
          {
            text: "Re-inflate the balloon and keep the wire in the artery; plan the definitive repair over that wire",
            best: true,
            feedback: "Right. With the inflow stopped from inside, the field is dry and the wire is your route to the repair: a covered stent, which is how the TAVI series treated failed closure (Brilakis 29.1.2.4 for iliofemoral bleeding), or surgery. A further suture device over the wire may be tried first, by analogy with Brilakis 11.1.8 (his remedy for a suture found cut or loose during deployment), but he does not describe it for a pre-close that fails after the sheath is out.",
            next: "s4",
            stateDelta: { stability: 5 },
          },
          {
            text: "Take the wire out and press on the groin for 30 minutes",
            feedback: "Without the wire, there is no quick route for a balloon at the arteriotomy, a covered stent or a further suture device.",
            next: "c-wire-out",
            stateDelta: { stability: -20, flags: ["wire-lost"] },
          },
          {
            text: "Give protamine and tighten the remaining suture harder",
            feedback: "A single suture on a 14 Fr hole, over-tightened, risks narrowing the artery (Oxford warns about over-tightened knots) and the hole stays partly open.",
            next: "s4",
            stateDelta: { stability: -10, flags: ["over-tight"] },
          },
        ],
      },
      {
        id: "c-wire-out",
        kind: "consequence",
        prompt: "The groin is swelling despite pressure, and BP is 84/50 mmHg. What now?",
        options: [
          {
            text: "Inflate the crossover balloon, regain a wire across the arteriotomy from the left groin over the bifurcation into the superficial femoral artery (or from the right groin if that is quicker), and call the vascular surgeons",
            best: true,
            feedback: "Stop the inflow from inside first. The left groin is the easier way back across the hole than a bleeding, haematoma-filled right groin, and it is also the route by which a covered stent can be delivered (the radial-crossover series treated its complications with covered stents from the opposite femoral artery; Brilakis's Fig. 29.5 shows the stent graft over a wire parked in the superficial femoral artery). Get the surgeons on their way.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pressing; it will stop",
            feedback: "A large-bore arteriotomy without closure seldom stops with pressure while the patient is anticoagulated.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "A check angiogram with the balloon briefly down shows a jet from the right common femoral artery about 2 cm above the bifurcation, with a short segment of healthy artery below the hole as a landing zone. What is your definitive plan?",
        options: [
          {
            text: "A self-expanding covered stent that covers the hole and stays above the bifurcation, or surgical repair",
            best: true,
            feedback: "Right. Brilakis prefers self-expanding covered stents in the common femoral artery, because they resist deformation in flexion, and sends perforations at the bifurcation to surgery when a stent is not desirable there. He would rather avoid a stent in the common femoral artery where another fix exists, because stents there are prone to fracture, so surgical repair is an equally reasonable answer; the landing zone is what makes the stent possible. In the TAVI series, stent grafts succeeded in 21 of 23, and 4 of those imaged later (22%) had fractured silently, so they need follow-up.",
            next: "s5",
            stateDelta: { stability: 10 },
          },
          {
            text: "A balloon-expandable covered stent across the bifurcation for precise positioning",
            feedback: "It covers the profunda or superficial femoral origin, and balloon-expandable stents deform in a segment that flexes.",
            next: "c-bifurcation",
            stateDelta: { stability: -15, flags: ["bifurcation-covered"] },
          },
          {
            text: "Leave the balloon inflated for an hour and see",
            acceptable: true,
            feedback: "A prolonged inflation is the first step and can be enough, but (by reasoning rather than either manual) the leg receives no inflow while the iliac artery is occluded; set a limit and have the definitive option ready.",
            next: "s5",
            stateDelta: { stability: -5, flags: ["long-occlusion"] },
          },
        ],
      },
      {
        id: "c-bifurcation",
        kind: "consequence",
        prompt: "After the stent, flow into the profunda femoral artery is lost. What now?",
        options: [
          {
            text: "Call the vascular surgeons and image the leg; surgical repair is the route for bifurcation injuries",
            best: true,
            feedback: "Brilakis lists bifurcation perforations among those where a stent is not desirable and surgery is required.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept it; the superficial femoral artery will supply the leg",
            feedback: "Loss of a major branch is not acceptable when surgery can repair the injury.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The site is dry. What do you check before the patient leaves the laboratory?",
        options: [
          {
            text: "Deflate and withdraw the crossover balloon, take an angiogram of the right leg for flow, check the distal pulses against the earlier record, close the left femoral access, and arrange limb checks and stent follow-up",
            best: true,
            feedback: "Right. Over-tightened knots can leave the leg ischaemic (Oxford), and so, by reasoning, can a stent or a long balloon occlusion; the earlier pulse record gives you the comparison, and common femoral stents need follow-up for fracture.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Only close the left groin; the right side is dry",
            feedback: "The right leg is the one at risk. Check it.",
            next: "c-cold-leg",
            stateDelta: { stability: -10, flags: ["leg-unchecked"] },
          },
        ],
      },
      {
        id: "c-cold-leg",
        kind: "consequence",
        prompt: "In recovery the right foot is cold with no Doppler signal. What now?",
        options: [
          {
            text: "Back to the laboratory: angiography from the left groin to find the cause, endovascular treatment if possible, and the vascular surgeons involved early",
            best: true,
            feedback: "Acute limb ischaemia: contralateral access and angiography to find and often treat the cause; surgery when needed.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Warm the foot and review in the morning",
            feedback: "A pulseless cold foot after large-bore closure needs imaging now.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "With the crossover balloon up and the wire kept, the persistent jet above the bifurcation was sealed with a self-expanding covered stent; the leg was well perfused on the final angiogram, and the stent was booked for follow-up.",
    outcomeVariants: [
      { flag: "no-crossover", text: "Starting without a crossover balloon meant the first minutes of the failure were spent setting one up." },
      { flag: "slow-removal", text: "Withdrawing the pump slowly cost blood through the sheath." },
      { flag: "wire-lost", text: "Losing wire access meant re-wiring a bleeding artery before any repair, and the surgeons were needed." },
      { flag: "over-tight", text: "The single over-tightened suture narrowed the artery and did not close the hole." },
      { flag: "bifurcation-covered", text: "The stent across the bifurcation lost the profunda, and surgical repair was needed." },
      { flag: "long-occlusion", text: "The long iliac occlusion kept inflow from the leg for longer than necessary." },
      { flag: "leg-unchecked", text: "The cold leg was found in recovery rather than on the table, and a second procedure was needed." },
    ],
    learningPoints: [
      "Set up the crossover balloon before the large sheath comes out; keep a wire in the artery until haemostasis is secure.",
      "Remove a microaxial pump quickly: it bleeds while the outlet is out and the inlet in the sheath.",
      "A failed suture: balloon up and wire kept; a further suture device over the wire is an extrapolation of Brilakis 11.1.8, not his large-bore remedy.",
      "Persistent leak in the common femoral artery: self-expanding covered stent with a landing zone, not across the bifurcation; or surgery, which is equally reasonable there.",
      "Check the leg afterwards against a recorded baseline; follow common femoral stents up for fracture.",
    ],
    refs: [...BOOKS, ...LARGE_BORE_REFS],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "access-cx-groin-haematoma-press",
    lab: "access",
    when: { phase: ["closure", "complication"], event: ["haematoma"], ...FEMORAL },
    title: "Groin haematoma: press over the arterial hole",
    text: "Press firmly just proximal to the skin puncture, where the needle entered the artery, and give analgesia. Once it is dry, apply a compressive bandage and keep the patient in bed for 6–8 hours; check distal pulses, listen for a bruit, and get a duplex scan if ongoing bleeding, a pseudoaneurysm or a fistula is suspected.",
    tone: "bailout",
    lessonId: "cm-access-complications-femoral-bleeding",
    sources: [B("29.1"), O_VASC],
    refs: BOOKS,
  },
  {
    id: "access-cx-iliac-wire-fluoro",
    lab: "access",
    when: { phase: ["wire", "femoral"], ...FEMORAL },
    title: "Wires through the iliac arteries under fluoroscopy",
    text: "Watch the wire on fluoroscopy all the way through the iliac arteries and aorta, redirect it if it enters a side branch, and never push against resistance. A polymer-jacketed wire can perforate a renal or other peripheral artery and cause a retroperitoneal bleed.",
    tone: "caution",
    lessonId: "cm-access-complications-femoral-bleeding",
    sources: [B("29.1"), B("5.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-rp-in-lab",
    lab: "access",
    when: { phase: ["complication"], event: ["hypotension", "bleeding"], ...FEMORAL },
    title: "Suspected retroperitoneal bleed in the lab: bladder, then the other groin",
    text: "Start the general measures, then screen the pelvis: an opacified bladder pushed to one side is a dented bladder. Get access in the opposite femoral artery and image the iliofemoral arteries to find the bleeding point. Reverse anticoagulation once the diagnosis is established.",
    tone: "bailout",
    lessonId: "cm-access-complications-femoral-bleeding",
    sources: [B("29.1"), B("28.1")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-iliofemoral-balloon-first",
    lab: "access",
    when: { phase: ["complication"], event: ["bleeding"], ...FEMORAL },
    title: "Iliofemoral bleeding: balloon before the definitive fix",
    text: "Inflate a balloon at low pressure over the bleeding point to stop the flow. If prolonged inflation does not seal a large-vessel hole, place a covered stent; send injuries at the femoral bifurcation, and failures, to surgery.",
    tone: "bailout",
    lessonId: "cm-access-complications-femoral-bleeding",
    sources: [B("29.1"), B("5.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-small-branch-embolise",
    lab: "access",
    when: { phase: ["complication"], event: ["bleeding"], ...FEMORAL },
    title: "Bleeding small branch: coil it, after checking the back door",
    text: "For an inferior epigastric or lateral circumflex iliac bleed, coil the branch after excluding retrograde filling of the hole; for very distal holes, microspheres, glue or thrombin, keeping the sealant inside the vessel. A prolonged balloon or a covered stent across the branch origin are alternatives.",
    tone: "bailout",
    lessonId: "cm-access-complications-femoral-bleeding",
    sources: [B("29.1"), B("4.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-psa-size-and-neck",
    lab: "access",
    when: { phase: ["complication"], event: ["haematoma"], ...FEMORAL },
    title: "Pulsatile groin lump: duplex for size and neck",
    text: "A pulsatile, tender lump with a bruit is a pseudoaneurysm until duplex says otherwise. Under 2 cm usually settles; 2 cm or more with a narrow neck gets ultrasound-guided thrombin and a repeat scan in 2–3 days; a wide neck, over 6 cm, infection, a graft, limb ischaemia or skin necrosis points to surgery.",
    tone: "do",
    lessonId: "cm-access-complications-femoral-other",
    sources: [B("29.1"), O_VASC],
    refs: BOOKS,
  },
  {
    id: "access-cx-arterial-sheath-first",
    lab: "access",
    when: { phase: ["closure"], ...FEMORAL },
    title: "Artery and vein both in: arterial sheath out first",
    text: "When there is both a femoral arterial and a venous sheath, remove the arterial sheath first and the venous sheath a few minutes later, rather than both together, to lower the risk of an arteriovenous fistula.",
    tone: "do",
    lessonId: "cm-access-complications-femoral-other",
    sources: [B("29.1")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-cold-leg-six-ps",
    lab: "access",
    when: { phase: ["sheath", "closure", "complication"], event: ["limb-ischaemia"], ...FEMORAL },
    title: "Cold leg: six Ps, then the other groin",
    text: "Look for pain, pallor, paralysis, pulse deficit, paraesthesia and a cold limb. Get access in the opposite femoral artery and image the leg to find the cause, then treat it (angioplasty, thrombectomy, thrombolysis) or call the vascular surgeons. Leg pain and livedo with intact pulses suggest cholesterol emboli instead.",
    tone: "bailout",
    lessonId: "cm-access-complications-limb",
    sources: [B("29.1"), O_LIMB],
    refs: BOOKS,
  },
  {
    id: "access-cx-iliac-dissection-crossover",
    lab: "access",
    when: { phase: ["sheath", "femoral", "complication"], event: ["dissection"], ...FEMORAL },
    title: "Flow-limiting iliofemoral dissection: treat by site",
    text: "A dissection that does not limit flow usually heals. If it limits flow in the iliac artery, cross into the true lumen from the opposite femoral artery and place a self-expanding stent; in the common femoral artery, prefer endarterectomy to a stent that may fracture.",
    tone: "bailout",
    lessonId: "cm-access-complications-limb",
    sources: [B("4.2"), B("5.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-radial-band-proximal",
    lab: "access",
    when: { phase: ["closure"], ...RADIAL },
    title: "Radial band: over the artery, not the skin",
    text: "The needle entered the artery proximal to where it crossed the skin, more so with a flat angle, so place the band slightly proximal to the puncture. Too distal bleeds into the forearm; too proximal bleeds at the wrist.",
    tone: "do",
    lessonId: "cm-access-complications-radial-bleeding",
    sources: [B("29.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-forearm-haematoma-grade",
    lab: "access",
    when: { phase: ["closure", "complication"], event: ["haematoma"], ...RADIAL },
    title: "Forearm haematoma: grade it and measure it",
    text: "Grade by extent: local (I), to about 10 cm (II), below the elbow (III), above it (IV), ischaemic threat (V). Treat with analgesia, an extra band and ice, add a timed cuff for III and IV, control the blood pressure, consider stopping antithrombotic infusions, and re-measure the forearm.",
    tone: "bailout",
    lessonId: "cm-access-complications-radial-bleeding",
    sources: [B("29.2"), O_RADIAL],
    refs: [...BOOKS, "bertrand-forearm-2010"],
  },
  {
    id: "access-cx-radial-perforation-cover",
    lab: "access",
    when: { phase: ["radial", "wire", "complication"], event: ["perforation", "bleeding"], ...RADIAL },
    title: "Radial perforation: keep the wire, cover the hole",
    text: "Hold the wire across the damaged segment and advance a catheter through it: that seals most radial perforations. If it does not, inflate a long peripheral or coronary balloon at low pressure across the hole for a prolonged time, and wrap the forearm with a compression dressing and ice.",
    tone: "bailout",
    lessonId: "cm-access-complications-radial-bleeding",
    sources: [B("29.2"), B("5.2")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-radial-loop-bat",
    lab: "access",
    when: { phase: ["radial", "wire"], event: ["radial-loop"], ...RADIAL },
    title: "Radial loop: balloon-assisted tracking",
    text: "Do not force a catheter round a radial loop. Inflate a small compliant balloon, matched 1:1 to the guide, half out of the tip at 3–6 atm and advance the two together, so the catheter edge cannot cut the wall.",
    tone: "do",
    lessonId: "cm-access-complications-radial-bleeding",
    sources: [B("29.2"), B("5.3")],
    refs: BRILAKIS,
  },
  {
    id: "access-cx-compartment-call",
    lab: "access",
    when: { phase: ["complication"], event: ["haematoma", "limb-ischaemia"], ...RADIAL },
    title: "Forearm haematoma or compartment syndrome?",
    text: "Forearm haematoma: compress it (a cuff up to 15 mmHg below systolic), relieve pain, control the blood pressure and reverse heparin, to stop it progressing (Oxford). Signs of compartment syndrome in a swollen forearm (pain worse on passive stretching, pallor, pulselessness, paralysis, paraesthesia): call the vascular surgeons at once; emergency fasciotomy (Brilakis).",
    tone: "bailout",
    lessonId: "cm-access-complications-radial-bleeding",
    sources: [B("29.2"), O_LIMB],
    refs: BOOKS,
  },
  {
    id: "mcs-cx-iabp-ischaemic-leg",
    lab: "mcs",
    when: { phase: ["manage", "wean"], event: ["limb-ischaemia"], procedure: ["iabp"] },
    title: "Balloon pump and a cold leg",
    text: "Remove the balloon pump and its sheath with manual haemostasis: the leg usually recovers once they are out. If support is still needed, re-site it from another artery with the team. If the leg does not recover, image it and involve the vascular surgeons early; surgical or endovascular treatment is sometimes needed.",
    tone: "bailout",
    lessonId: "cm-access-complications-limb",
    sources: [B("14.3"), O_LIMB],
    refs: BOOKS,
  },
  {
    id: "mcs-cx-crossover-balloon-before-removal",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Before the large sheath comes out: crossover balloon and a wire",
    text: "Pass a balloon from the opposite femoral (or a radial) artery into the iliac artery of the large-bore side, ready to inflate while the sheath comes out and the sutures are tied in a dry field. Keep a 0.035 inch wire in the large-bore artery until haemostasis is secure.",
    tone: "do",
    lessonId: "cm-access-complications-large-bore",
    sources: [B("14.4"), B("11.1"), B("5.2")],
    refs: [...BRILAKIS, "sharp-crossover-tavi-2010", "buchanan-modified-crossover-2013"],
  },
  {
    id: "mcs-cx-largebore-bleed-balloon",
    lab: "mcs",
    when: { phase: ["wean", "complication"], event: ["bleeding", "hypotension"], procedure: ["large-bore", "impella", "ecmo"] },
    title: "Large-bore site bleeding: inflow off, wire kept, then fix",
    text: "Inflate the crossover balloon at low pressure above the site; if there is none, get one in fast from the other femoral or a radial artery. Keep the wire: over it, a covered stent or surgery if a leak persists after prolonged occlusion. A further suture device over the wire is an option argued by analogy with Brilakis 11.1.8, not his large-bore remedy.",
    tone: "bailout",
    lessonId: "cm-access-complications-large-bore",
    sources: [B("29.1"), B("5.2"), B("11.1"), B("14.4")],
    refs: [...BRILAKIS, "sharp-crossover-tavi-2010", "stortecky-tavi-vascular-2012"],
  },
  {
    id: "mcs-cx-covered-stent-site",
    lab: "mcs",
    when: { phase: ["complication"], event: ["bleeding"], procedure: ["large-bore", "impella", "ecmo", "iabp"] },
    title: "Covered stent: match the type to the segment",
    text: "Balloon-expandable covered stents place precisely, for example in the iliac artery; self-expanding ones resist flexion and are preferred in the common femoral artery, where stents tend to fracture. Do not cover the femoral bifurcation: that goes to surgery. Check the sheath size the stent needs.",
    tone: "caution",
    lessonId: "cm-access-complications-large-bore",
    sources: [B("29.1"), B("5.2")],
    refs: [...BRILAKIS, "stortecky-tavi-vascular-2012"],
  },
  {
    id: "mcs-cx-iabp-bleeding-anticoag",
    lab: "mcs",
    when: { phase: ["manage", "complication"], event: ["bleeding"], procedure: ["iabp", "ecmo"] },
    title: "Bleeding on a balloon pump or ECMO: anticoagulation",
    text: "Retroperitoneal bleeding on a balloon pump may mean stopping the anticoagulant; if you do, run the pump at 1:1 to limit thrombus on the balloon. Brilakis allows balloon pumps and VA-ECMO to run without anticoagulation for a short time in active bleeding; Oxford lists contraindications to anticoagulation among the contraindications to ECMO.",
    tone: "caution",
    lessonId: "cm-access-complications-large-bore",
    sources: [B("14.3"), B("14.1"), O("ch 9: Extracorporeal membrane oxygenation")],
    refs: BOOKS,
  },
  {
    id: "mcs-cx-ecmo-cannula-bleed",
    lab: "mcs",
    when: { phase: ["insert", "manage"], event: ["bleeding", "haematoma"], procedure: ["ecmo"] },
    title: "ECMO cannula bleeding: position and route",
    text: "Bleeding or a haematoma at an ECMO cannula can mean it has moved, which can bleed massively, or that the vessel was torn. Insert cannulae under fluoroscopy over a stiff wire, check that the venous wire is in the superior vena cava, and stop advancing at any resistance.",
    tone: "caution",
    lessonId: "cm-access-complications-large-bore",
    sources: [B("14.5")],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// New references (PubMed-checked)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "sharp-crossover-tavi-2010",
    kind: "paper",
    citation:
      "Sharp ASP, Michev I, Maisano F, et al. A new technique for vascular access management in transcatheter aortic valve implantation. Catheter Cardiovasc Interv. 2010;75(5):784-93.",
    url: "https://doi.org/10.1002/ccd.22238",
    note: "PMID: 20049970. Checked on PubMed: authors, title, journal, year 2010, volume 75, issue 5, pages 784-93. Used (abstract): opposite femoral artery cannulated with a 7 Fr long sheath; balloon passed contralaterally and inflated in the proximal iliac artery; sheath then removed and sutures tied in a dry field; balloon optimisation of the puncture site as required; on-table complications (iliac avulsion, two iliac dissections, iliac perforation, common femoral perforation, scrotal haematoma) repaired by combined surgical and endovascular techniques using the crossover technique to keep the patient stable.",
    verified: true,
  },
  {
    id: "buchanan-modified-crossover-2013",
    kind: "paper",
    citation:
      "Buchanan GL, Chieffo A, Montorfano M, et al. A \"modified crossover technique\" for vascular access management in high-risk patients undergoing transfemoral transcatheter aortic valve implantation. Catheter Cardiovasc Interv. 2013;81(4):579-83.",
    url: "https://doi.org/10.1002/ccd.24380",
    note: "PMID: 22511470. Checked on PubMed: authors, title, journal, volume 81, issue 4, pages 579-83 (published online 2012; volume 81 is the 2013 volume). Used (abstract): balloon passed from the left radial artery and inflated in the proximal iliac artery to allow percutaneous closure in a clean field; three access-site complications (external iliac rupture, suture-device failure, common femoral pseudoaneurysm) all treated percutaneously with covered stents via the contralateral femoral artery.",
    verified: true,
  },
  {
    id: "zaman-cbot-2016",
    kind: "paper",
    citation:
      "Zaman S, Gooley R, Cheng V, McCormick L, Meredith IT. Impact of routine crossover balloon occlusion technique on access-related vascular complications following transfemoral transcatheter aortic valve replacement. Catheter Cardiovasc Interv. 2016;88(2):276-84.",
    url: "https://doi.org/10.1002/ccd.26371",
    note: "PMID: 27107395. Checked on PubMed: authors, title, journal, year 2016, volume 88, issue 2, pages 276-84. Used (abstract): crossover balloon occlusion passes a balloon from the contralateral femoral artery to allow controlled closure; routine use (n = 55) against preceding patients without it (n = 43); technical success 96%; 30-day access-site major vascular and/or bleeding complications 5.5% against 18.6%. Non-randomised comparison.",
    verified: true,
  },
  {
    id: "stortecky-tavi-vascular-2012",
    kind: "paper",
    citation:
      "Stortecky S, Wenaweser P, Diehm N, et al. Percutaneous management of vascular complications in patients undergoing transcatheter aortic valve implantation. JACC Cardiovasc Interv. 2012;5(5):515-24.",
    url: "https://doi.org/10.1016/j.jcin.2012.01.021",
    note: "PMID: 22625190. Checked on PubMed: authors, title, journal, year 2012, volume 5, issue 5, pages 515-24. Cited by Brilakis in 29.1.2.4 (reference 3, Fig. 29.5). Used (abstract): 149 transfemoral TAVI; 27 (18%) vascular complications: incomplete arteriotomy closure 19 (70%), dissection 3, perforation 3, occlusion 1, pseudoaneurysm 1; percutaneous stent-graft implantation successful in 21 of 23 (91%); no haemodynamically significant stenosis at a median 10.9 months; stent fractures in 4 stents (22%), clinically silent; fractures require careful scrutiny.",
    verified: true,
  },
  {
    id: "rossaint-trauma-bleeding-2023",
    kind: "guideline",
    citation:
      "Rossaint R, Afshari A, Bouillon B, et al. The European guideline on management of major bleeding and coagulopathy following trauma: sixth edition. Crit Care. 2023;27(1):80.",
    url: "https://doi.org/10.1186/s13054-023-04327-7",
    note: "PMID: 36859355 (PMC9977110). Checked on PubMed: authors, title, journal, year 2023, volume 27, issue 1, article 80. Used (full text, Recommendations 13–15): restricted volume replacement with a target systolic pressure of 80–90 mmHg until major bleeding is stopped (no brain injury); noradrenaline in addition to fluids if that fails to reach the target; 0.9% sodium chloride or balanced crystalloid to start; restrict colloids. Trauma guidance, extrapolated in this module to iatrogenic access-site bleeding.",
    verified: true,
  },
  {
    id: "pope-thrombin-anaphylaxis-2000",
    kind: "paper",
    citation:
      "Pope M, Johnston KW. Anaphylaxis after thrombin injection of a femoral pseudoaneurysm: recommendations for prevention. J Vasc Surg. 2000;32(1):190-1.",
    url: "https://doi.org/10.1067/mva.2000.106498",
    note: "PMID: 10876222. Checked on PubMed: authors, title, journal, year 2000, volume 32, issue 1, pages 190-1. Used (abstract): anaphylaxis after thrombin injection of a femoral pseudoaneurysm in a patient with repeated previous thrombin exposure; the authors recommend skin-prick testing before bovine thrombin in patients previously exposed.",
    verified: true,
  },
  {
    id: "jalaeian-thrombin-anaphylaxis-2015",
    kind: "paper",
    citation:
      "Jalaeian H, Misselt A. Anaphylactic reaction to bovine thrombin in ultrasound-guided treatment of femoral pseudoaneurysm. J Vasc Interv Radiol. 2015;26(6):915-6.",
    url: "https://doi.org/10.1016/j.jvir.2015.02.020",
    note: "PMID: 26003458. Checked on PubMed: authors, title, journal, year 2015, volume 26, issue 6, pages 915-6 (letter; no abstract). Used: the title (anaphylaxis to bovine thrombin during ultrasound-guided pseudoaneurysm treatment) and the PubMed indexing term 'Fatal Outcome'.",
    verified: true,
  },
  {
    id: "quarmby-autologous-thrombin-2002",
    kind: "paper",
    citation:
      "Quarmby JW, Engelke C, Chitolie A, Morgan RA, Belli AM. Autologous thrombin for treatment of pseudoaneurysms. Lancet. 2002;359(9310):946-7.",
    url: "https://doi.org/10.1016/S0140-6736(02)07991-6",
    note: "PMID: 11918917. Checked on PubMed: authors, title, journal, year 2002, volume 359, issue 9310, pages 946-7. Used (abstract): autologous thrombin prepared from the patient's blood thrombosed femoral pseudoaneurysms in 10 patients and avoids the anaphylaxis risk of commercial bovine or human thrombin.",
    verified: true,
  },
];
