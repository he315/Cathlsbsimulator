// Module pm-physiology: coronary physiology (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, chapter 12 (12.1 when to use physiology, 12.2 the eight steps of a
// pressure-wire study, 12.3 lesion and patient subsets) and section 1.12, with the physiology sections of
// chapters 3, 6, 7, 10, 15–22 and 24; Oxford Handbook of Cardiac Catheterization and Coronary Intervention,
// chapter 8 (Pressure wire), chapter 1 (Cardiac CT or invasive angiography?), chapter 5 (MINOCA), chapter 6
// (use of nitrates, quantification of stenoses, common pitfalls) and chapter 2 (the cardiac physiologist).
// The manuals say little about wire-free FFR and microvascular testing, so those lessons rest on verified
// references (FAVOR II–III, NXT, PLATFORM, the UK coronary microvascular dysfunction consensus and the
// CorMicA review); every claim is listed with its page or reference in docs/curriculum/evidence/pm-physiology.md.
// Neighbouring modules: pm-lab-drugs (adenosine as a drug, its doses and arrhythmias), pm-target (choosing
// the target, ACS culprit and multivessel STEMI), pm-interpreting (stenosis grading, collaterals, spasm),
// pm-monitoring (transducers), pm-imaging (IVUS and OCT), cp-left-main and cp-bifurcation-provisional
// (the second-stent techniques), cp-acs-thrombus (the MINOCA work-up).
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });

export const module: Module = {
  id: "pm-physiology",
  title: "Coronary physiology",
  stage: 3,
  summary:
    "When a pressure wire changes the plan and when it cannot help; the eight steps of a pressure-wire study with what goes wrong at each; resting ratios and hyperaemic FFR with their agents, doses and hazards; reading a pullback and checking for drift; how aorto-ostial and left main lesions, vein grafts, acute coronary syndromes, chronic occlusions, heart failure and aortic stenosis change the measurement; physiology after stenting and in jailed side branches; angiography- and CT-derived FFR; and testing the microcirculation and coronary vasomotion in angina with unobstructed arteries.",
  objectives: [
    "Decide before the case whether physiology will change management, and recognise the lesions and patients in which it should not be used.",
    "Prepare, zero, introduce, equalise and advance a pressure wire, and correct failed zeroing, failed equalisation, a wire that will not enter the target vessel and a deformed wire.",
    "Measure a resting index and hyperaemic FFR, choose the vasodilator, route and dose, recognise inadequate hyperaemia and artefacts, and manage AV block, ventricular fibrillation and atrial fibrillation after adenosine.",
    "Perform a pullback, check for drift against the 0.98–1.02 window, and plan treatment of serial, focal and diffuse disease from the pressure trace.",
    "Adapt the study to aorto-ostial and left main lesions, and explain why vein grafts, ACS culprits, CTO vessels and donors, heart failure, cardiogenic shock and aortic stenosis distort the result.",
    "Use physiology after stenting to find the cause of a low value, and to decide whether a jailed side branch needs treatment.",
    "Explain how angiography-derived and CT-derived FFR are obtained, what the trials showed, and when a wire is still needed.",
    "Describe invasive coronary function testing in angina with non-obstructive arteries: CFR, IMR, acetylcholine provocation, its safety steps and the endotypes it defines.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-when",
      title: "Deciding to measure: which lesions need physiology",
      minutes: 14,
      topics: ["phy-indications"],
      sources: [
        B("1.12"),
        B("12.1"),
        B("6.8"),
        B("7.1"),
        B("7.3"),
        B("12.3"),
        B("19.12"),
        B("22.3"),
        B("22.4"),
        O("ch 8: Pressure wire"),
        O("ch 6: Quantification of stenoses"),
        O("ch 8: Multivessel PCI"),
        O("ch 2: The cardiac physiologist"),
      ],
      refs: [...BOOKS, "zimmermann-defer-2015", "tonino-fame-angio-2010", "fame-2009", "vannunen-fame-5y-2015", "define-flair-2017", "ifr-swedeheart-2017", "eftekhari-ifr-5y-2023", "malcolm-adenosine-ep-1993"],
      blocks: [
        {
          kind: "p",
          text: "An angiogram outlines the contrast column; it does not tell you whether a narrowing starves the muscle beyond it. Coronary physiology answers that second question with a pressure wire, and its main job is the lesion whose appearance is neither clearly trivial nor clearly severe. The decision to measure is made before the wire is opened, because it depends on what is already known about ischaemia and on whether the lesion is one in which a pressure ratio means anything at all.",
        },
        { kind: "h", text: "Why the eye is not enough" },
        {
          kind: "list",
          items: [
            "**Readers disagree.** Oxford lists variability between and within observers, puts the spread between readers at about ±20% for moderate lesions (mild and severe ones are graded more reliably), and warns that angiography can underestimate severity, by as much as 50% in extreme cases, through incomplete views or an eccentric lesion.",
            "**Where the eye's threshold sits.** Oxford takes a lesion as haemodynamically important once the diameter is narrowed by more than 70% (roughly 90% by area), or by more than 50% in the left main, and notes that some operators therefore grade by eye only as mild (30% or less), moderate (30–70%) or severe (above 70%). The moderate band is exactly where the wire earns its place; QCA and grading are taught in pm-interpreting.",
            "**The reference is unreliable.** Atherosclerosis is diffuse, so the 'normal' segment you compare with may itself be narrowed; remodelling can make a vessel look larger than it is (Oxford).",
            "**Resolution is limited** to roughly 0.2 mm (Oxford).",
            "**Lumen is not function.** Both manuals say the angiographic picture may not match the physiological effect. Brilakis treats a stenosis of 70–90% (50% in the left main) as significant by convention but stresses that percentage stenosis has real limits, and reproduces the FAME analysis in which 35% of lesions graded 50–70%, 80% of those graded 71–90% and 96% of those graded 91–99% had an FFR of 0.80 or less (taught in pm-interpreting).",
            "**The one exception.** Brilakis regards a diameter stenosis of 90% or more as almost always haemodynamically significant; below that, physiology defines severity better than the eye.",
          ],
        },
        {
          kind: "p",
          text: "**What the wire measures.** Flow is what matters but it is hard to measure in the lab, so pressure is used as its stand-in. Oxford points out that this works only when the resistance of the microcirculation is low (in its words, low or trivial). FFR makes it low by giving a vasodilator (usually adenosine) for maximal hyperaemia, which is why it is called a hyperaemic index; it expresses the maximum flow the territory receives through the stenosis as a fraction of the maximum it would receive without it. The instantaneous wave-free ratio (iFR) instead uses wave-intensity analysis to find a window in diastole when resistance is naturally at its lowest, so it needs no drug and is a resting index. Both are a ratio of the distal pressure from the wire (Pd) to the aortic pressure at the guide tip (Pa).",
        },
        { kind: "h", text: "Before the case: four planning questions" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Has ischaemia already been shown in this territory?",
              detail:
                "If the history is unclear and nothing done before the case has demonstrated ischaemia, plan to have the pressure wire ready (Brilakis 1.12).",
            },
            {
              title: "2. Can the patient take a vasodilator?",
              detail:
                "Ask whether adenosine or another intracoronary vasodilator has ever caused a reaction, or is contraindicated (Brilakis 1.12). Oxford gives asthma and dipyridamole treatment as contraindications to adenosine. If adenosine is out, a resting index avoids the drug altogether.",
            },
            {
              title: "3. Has the patient had caffeine?",
              detail:
                "Caffeine stops adenosine binding to its receptor, so recent intake is one of Brilakis's causes of failed hyperaemia; his prevention is simply to make sure the patient has had none before the procedure.",
            },
            {
              title: "4. Is the lesion one physiology can judge?",
              detail:
                "Not a culprit or suspected culprit in an acute coronary syndrome (use intracoronary imaging), not a vein graft, not the CTO vessel itself. These exclusions, and the subsets in which the value needs care, are taught in the subsets lesson of this module.",
            },
          ],
        },
        { kind: "tip", id: "pci-planning-adenosine-history" },
        { kind: "tip", id: "pci-phys-decide-before-measuring" },
        {
          kind: "check",
          stem: "A 66-year-old man has atypical exertional chest discomfort and no non-invasive test. Angiography shows a 60% mid-LAD stenosis and nothing else. He takes dipyridamole after a stroke. What is the most appropriate plan?",
          options: [
            "Stent the LAD now, because a 60% LAD stenosis carries prognostic weight on its own",
            "Measure a resting index such as iFR, avoiding adenosine, and decide on PCI from the result",
            "Measure FFR with intracoronary adenosine, doubling the usual dose to overcome dipyridamole",
            "Defer any decision and arrange a stress echocardiogram before a repeat angiogram",
          ],
          answer: 1,
          explanation:
            "With equivocal symptoms and no test showing ischaemia, physiology is exactly what Brilakis recommends for a 60% lesion. Oxford lists dipyridamole as a contraindication to adenosine, so a resting index, which needs no vasodilator, is the way to measure. Dipyridamole potentiates the effects of adenosine (it does not blunt them), so doubling the dose would only add to the risk of AV block and the drug's other effects. Stenting on the appearance alone is what physiology exists to prevent, and sending him away for a stress test is possible but discards an answer available on the table.",
        },
        { kind: "h", text: "Where physiology decides" },
        {
          kind: "table",
          head: ["Situation", "What the manuals say"],
          rows: [
            [
              "Intermediate lesion",
              "PCI of a lesion with FFR above 0.80 (0.75 in the early studies), or a resting index that shows no ischaemia such as iFR above 0.89, can be safely deferred without more adverse events; this also applies to the left main (Brilakis 12.1). Oxford: FFR 0.80 or less, or iFR 0.89 or less, is an indication for revascularisation; above those values, defer",
            ],
            [
              "Multivessel disease",
              "FFR, usually in lesions under 90% by angiography, leads to fewer lesions being treated and better outcomes than angiography-guided PCI (Brilakis 12.1). Oxford adds assessing the relative importance of lesions in multivessel disease",
            ],
            ["Serial stenoses in one vessel", "Assessing the contribution of each (Oxford); the pullback lesson shows how"],
            ["Heavy calcification", "Encouraged, because angiography and physiology correlate poorly in these lesions (Brilakis 19.6, 19.12)"],
            [
              "Small or large vessels",
              "In small vessels the result depends on the territory as well as the stenosis, so physiology is very helpful; severity is also hard to judge by eye in large vessels (Brilakis 22.3)",
            ],
            ["Long lesions", "A step-up on pullback suggests the disease is more focal than it looks (Brilakis 22.4)"],
            ["After PCI and in jailed side branches", "Taught in the after-stenting lesson of this module"],
          ],
        },
        {
          kind: "p",
          text: "**The evidence for deferral.** Brilakis cites the 15-year follow-up of DEFER. Of 325 patients scheduled for PCI of an intermediate stenosis, those with FFR of 0.75 or more were randomised to deferral (91) or PCI (90). At 15 years death rates did not differ (33.0% deferred, 31.1% stented), and myocardial infarction was less frequent after deferral (2.2% against 10.0%), with no late catch-up. The threshold has since moved to 0.80, the FAME cut-off. Oxford notes that DEFINE-FLAIR and iFR-SWEDEHEART showed iFR non-inferior to FFR, while reminding the reader that FFR, being the older index, has a much larger body of evidence behind it.",
        },
        {
          kind: "p",
          text: "**What happened later with iFR.** Both trials were non-inferior at 1 year. When their 5-year results were pooled (4,511 patients), iFR-guided revascularisation was followed by higher all-cause mortality (hazard ratio 1.34) and more major adverse cardiovascular events (hazard ratio 1.18) than FFR guidance, and more patients had revascularisation deferred under iFR (50.0% against 45.2%). Rates of myocardial infarction and unplanned revascularisation did not differ. Neither manual includes these data, which postdate both books.",
        },
        {
          kind: "p",
          text: "**Two places where the handbook is out of step.** Oxford's indications line says a derived FFR below 0.75 marks a flow-limiting lesion, while its own interpretation section a page later uses 0.80 or less; 0.75 is the older cut-off, and the current one is 0.80. Its multivessel PCI section also says FFR guidance 'shows promise' but needs randomised data, whereas Brilakis cites FAME. In FAME, FFR guidance reduced major adverse cardiac events at 1 and 2 years; by 5 years the two strategies had similar event rates (28% FFR-guided against 31% angiography-guided), achieved with fewer stents (1.9 against 2.7 per patient). Use 0.80 for FFR and 0.89 for iFR.",
        },
        {
          kind: "list",
          items: [
            "**Prognosis.** Brilakis lists a large area of ischaemia on functional testing (more than 10% of the LV) or an abnormal invasive FFR among the stable-disease subgroups in which revascularisation may improve prognosis as well as symptoms.",
            "**Ad hoc PCI.** Among Brilakis's reasons not to proceed straight from diagnostic angiography to PCI is no evidence of ischaemia when neither FFR nor IVUS is available.",
            "**The team.** Oxford lists pressure-wire studies among the procedures the cardiac physiologist helps the operator with, and the FFR or iFR value belongs in the physiologist's procedure report.",
          ],
        },
        {
          kind: "check",
          stem: "Stable angina on two drugs; the angiogram shows a 92% focal proximal RCA stenosis with an otherwise normal system. The fellow opens a pressure wire 'to be sure'. What does Brilakis's teaching suggest?",
          options: [
            "Measure it: no stenosis is significant until FFR has confirmed it",
            "Measure iFR only, because FFR is unreliable in the RCA",
            "Physiology is not needed: a 90% or greater stenosis is almost always significant",
            "Defer PCI: proximal RCA lesions carry no prognostic benefit from treatment",
          ],
          answer: 2,
          explanation:
            "Brilakis excludes highly stenotic lesions (90% or more) from the need for physiology because they are almost always haemodynamically significant, and in FAME 96% of lesions graded 91–99% had an FFR of 0.80 or less. Measuring adds wire risk, time and cost without changing the plan. Nothing in either manual makes FFR invalid in the RCA (only intracoronary adenosine doses differ), and symptoms on two drugs are a reason to treat.",
        },
        {
          kind: "pitfalls",
          items: [
            "Opening a pressure wire without deciding what you will do with each possible result.",
            "Forgetting to ask about adenosine reactions, asthma, dipyridamole and caffeine before the case.",
            "Measuring a 90% or greater stenosis, or a lesion in which the value is meaningless (ACS culprit, vein graft, CTO vessel).",
            "Treating 0.80 as a cliff edge: Brilakis notes there is no real difference between 0.80 and 0.81, and the benefit of revascularisation is larger the lower the FFR.",
            "Quoting Oxford's 0.75 line as the current threshold.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide the action for each result before you measure: '0.80 or below I stent; above 0.80 I optimise medical therapy and stop.' If no value would change the plan, close the box and save the wire.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "Before opening the wire in the 'Intermediate mid-LAD lesion' scenario, state the planning answers aloud: ischaemia shown or not, adenosine contraindications and caffeine, and whether the lesion can be judged by physiology. Then write down what you will do if FFR is 0.80 or less and if it is above 0.80.",
        },
        { kind: "video", id: "SgVzBKGvdPc", note: "Brilakis's chapter summary of coronary physiology (Manual of PCI, section 12.1)." },
        { kind: "video", id: "DkJ8P-oQY5s", note: "Brilakis's coronary imaging and physiology update (Dallas CVI 2016)." },
        { kind: "video", id: "TTC1aoFCBMo", note: "Brilakis's intravascular imaging and physiology update (Dallas CVI 2015)." },
        {
          kind: "keypoints",
          items: [
            "Pressure stands in for flow only when microvascular resistance is low: FFR achieves this with hyperaemia, iFR with a wave-free diastolic window.",
            "Plan physiology when symptoms are equivocal and no test has shown ischaemia; ask about adenosine reactions, asthma, dipyridamole and caffeine.",
            "A stenosis of 90% or more is almost always significant; below that, physiology beats the eye.",
            "Defer PCI when FFR is above 0.80 or iFR above 0.89; treat at or below them. DEFER at 15 years: same mortality, fewer infarctions with deferral.",
            "In multivessel disease (FAME), FFR guidance meant fewer lesions treated, with fewer events up to 2 years and similar outcomes at 5 years.",
            "iFR was non-inferior to FFR at 1 year, but pooled 5-year data from both trials showed higher mortality with iFR guidance.",
            "Physiology is encouraged in calcified, small, large and long lesions; it is not for ACS culprits, vein grafts or the CTO vessel.",
            "Oxford's 0.75 line and its 'promising' multivessel comment are dated; use 0.80 and 0.89.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-setup",
      title: "Setting up the study: zero, introduce, equalise and cross",
      minutes: 14,
      topics: ["phy-ffr-nhpr"],
      sources: [B("12.2"), B("30.7"), O("ch 8: Pressure wire")],
      refs: [...BOOKS, "ford-cormica-review-2019"],
      blocks: [
        {
          kind: "p",
          text: "Most wrong pressure-wire answers are made before any drug is given: a wire zeroed badly, an introducer left in the valve, a guide full of contrast, or a pair of traces that were never truly superimposed. Brilakis divides the study into eight steps; this lesson takes the first four, which end with the sensor beyond the lesion and two traces you can trust.",
        },
        { kind: "h", text: "The equipment and the starting position" },
        {
          kind: "list",
          items: [
            "**The wire.** A 0.014-inch wire with its pressure sensor about 3 cm from the tip, where the radiopaque tip meets the radiolucent shaft (Oxford; Brilakis also places it about 3 cm from the tip). Brilakis lists several makes of pressure guidewire and a rapid-exchange FFR microcatheter for physiological assessment as described in his chapter 12.",
            "**The console** needs the aortic pressure from the lab's monitoring system and, for iFR, an ECG signal too (Oxford).",
            "**Nitrate.** The CorMicA authors note that intra-arterial glyceryl trinitrate is typically given as part of a standard FFR assessment (for their microvascular protocol they suggest 200 µg or less). Neither manual's pressure-wire section lists it, so follow local protocol.",
            "**The guide** is engaged in the target vessel with a pressure waveform that is not damped. Damping matters before you start: it makes the lesion look less severe by raising FFR and the resting indices (Brilakis 12.2). How to recognise and correct it is taught in pm-engaging and pm-wiring.",
          ],
        },
        { kind: "h", text: "Steps 1 to 4, with what can go wrong at each" },
        {
          kind: "steps",
          items: [
            {
              title: "Step 1. Flush and zero the wire outside the body",
              detail:
                "Fill the wire's container with normal saline (Oxford: so that no air remains), connect it to the patient interface module and zero it. Shape the tip as for any wire (pm-wiring), taking care not to damage the sensor region. If it will not zero, the cause is a poor connection or a faulty wire: check every connection, and replace the wire if that fails. A calibration problem found only after the wire is in the guide costs time, because the wire must come out to be recalibrated.",
            },
            {
              title: "Step 2. Introduce the wire and bring the sensor to the guide tip",
              detail:
                "Pass it through the haemostatic valve with an introducer, advance it to the tip of the guide, then a little further, until the start of the radiopaque tip segment (its proximal end) sits exactly at the guide tip: that puts the sensor where the guide pressure is measured.",
            },
            {
              title: "Step 3. Remove the introducer, flush the guide with saline, equalise",
              detail:
                "A retained introducer and an unflushed guide are Brilakis's first two causes of failed equalisation; once both are dealt with, equalise the wire pressure to the guide pressure. Oxford's test: the two waveforms lie on top of each other and Pd/Pa reads 1.0. Brilakis's warning: a system can match the mean pressures while the waveforms themselves stay apart, and that mismatch then introduces error into the hyperaemic FFR, so look at the shapes, not just the number.",
            },
            {
              title: "Step 4. Cross the lesion and go distal",
              detail:
                "Reinserting the introducer is optional. Advance the wire through and beyond the lesion or lesions, ideally as far distally as possible so that the measurement covers flow through the whole artery. Advancing the wire can injure the target vessel (Brilakis refers to his section 8.7; Oxford notes the wire may rarely dissect the artery). If it will not cross, use the wiring techniques of pm-wiring.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Troubleshooting the set-up (Brilakis 12.2.1–12.2.4)",
          head: ["Problem", "Causes", "Prevent", "Fix"],
          rows: [
            ["Will not zero", "Poor connection; defective wire", "Check all connections before connecting the wire", "Check connections; replace the wire"],
            [
              "Will not enter the target vessel",
              "Poor guide engagement; the wrong guide (an oversized EBU can steer the wire into the circumflex instead of the LAD, or the reverse); a poorly shaped tip",
              "A well-engaged, correctly sized guide; a good tip shape",
              "Change to a better-fitting guide; reshape the tip",
            ],
            [
              "Wire deformed",
              "Poor shaping before insertion; the tip sticking out of the introducer as it goes through the valve; other devices (guide extension, balloon, stent) in the guide",
              "Keep the tip fully inside the introducer; never push hard against resistance; remove other devices first or advance the wire under fluoroscopy",
              "Reshape if possible, or open a new wire",
            ],
            [
              "Will not equalise",
              "Introducer still in; guide not flushed; wire failure; sensor too deep in the vessel; air in the aortic pressure line",
              "Introducer out; guide flushed; aortic line flushed and zeroed; radiopaque segment's proximal end at the guide tip",
              "Correct each of these; if it still fails, change the wire",
            ],
            [
              "Drift",
              "A technical fault in the wire; a loose or malfunctioning transducer",
              "Equalise before crossing; do not disconnect the wire while manipulating it",
              "Pull back until the proximal end of the radiopaque segment is at the guide tip, re-equalise, recross and repeat the measurement",
            ],
          ],
        },
        { kind: "tip", id: "pci-phys-zero-outside" },
        { kind: "tip", id: "pci-phys-equalise-at-tip" },
        { kind: "tip", id: "pci-mon-aortic-line-physiology" },
        {
          kind: "check",
          stem: "With the sensor at the guide tip the console shows Pd/Pa 1.00 after equalisation, but the Pd waveform is visibly delayed and smaller than the Pa waveform. What should you do before crossing?",
          options: [
            "Cross the lesion: the ratio is 1.00, so the equalisation has worked",
            "Find out why the waveforms differ (introducer, contrast, air, sensor position) and equalise again",
            "Cross the lesion and subtract the difference in waveform height from the final FFR",
            "Change straight to a resting index, which is not affected by waveform shape",
          ],
          answer: 1,
          explanation:
            "Brilakis warns that a system may equalise the mean pressures while the waveforms do not overlap, and that this introduces error into the hyperaemic FFR. The fix is to remove the causes of a distorted trace (introducer still in, contrast in the guide, air in the aortic line, sensor not at the guide tip) and equalise again, changing the wire if it still fails. A matching mean is not the test; matching shapes are.",
        },
        { kind: "tip", id: "pci-phys-equalise-fail" },
        {
          kind: "check",
          stem: "You plan to measure a mid-LAD lesion through an EBU 4.0 guide in a small woman. The pressure wire repeatedly enters the circumflex despite several reshapes. What is Brilakis's first-line remedy?",
          options: [
            "Keep reshaping with ever larger bends until the wire enters the LAD",
            "Push the wire firmly while rotating it, accepting some deformation of the tip",
            "Use a workhorse wire to enter the LAD, then measure with the sensor at its tip",
            "Change to a better-fitting guide, here a smaller curve, then retry the shaped wire",
          ],
          answer: 3,
          explanation:
            "Brilakis gives suboptimal guide choice as a cause, with exactly this example: an oversized EBU sends the wire into the circumflex instead of the LAD (or the reverse). The treatment is a better-fitting guide, with appropriate tip shaping. Pushing hard against resistance deforms the wire, which he warns against. A workhorse wire has no sensor; an exchange through a microcatheter is possible, but it is not the remedy he gives.",
        },
        { kind: "tip", id: "pci-phys-wire-wrong-branch" },
        { kind: "tip", id: "pci-phys-cross-distal" },
        {
          kind: "pitfalls",
          items: [
            "Zeroing after the wire is already in the guide, and losing time to take it out.",
            "Leaving the introducer in the valve, or contrast in the guide, while equalising.",
            "Equalising with the sensor still inside the guide or already deep in the vessel instead of at the guide tip.",
            "Accepting a matched mean with mismatched waveforms.",
            "Pushing a pressure wire through a guide that holds a balloon or guide extension without fluoroscopy.",
            "Disconnecting the wire during manipulation, which invites drift.",
          ],
        },
        {
          kind: "pearl",
          text: "Use the wire's own landmark: the proximal end of the radiopaque segment marks the sensor. Park that landmark at the guide tip to equalise, and bring it back to the same place at the end to check drift.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the 'Intermediate mid-LAD lesion' scenario, complete the set-up checklist: nitrate as your local protocol requires, guide flushed with saline, introducer removed, equalise with the sensor at the guide tip until the two waveforms superimpose, then advance the sensor into the distal LAD.",
        },
        { kind: "video", id: "SgVzBKGvdPc", note: "Brilakis's chapter summary of coronary physiology (Manual of PCI, section 12.1)." },
        { kind: "video", id: "w1vtN7o5S4U", note: "Elias Hanna on FFR and iFR concepts, technical pitfalls and applications in different lesion types." },
        {
          kind: "keypoints",
          items: [
            "Start with an engaged guide and an undamped trace: damping raises FFR and resting indices and hides severity.",
            "Step 1: flush, connect and zero outside the body; check every connection.",
            "Step 2: introducer through the valve; proximal end of the radiopaque segment at the guide tip.",
            "Step 3: introducer out, guide flushed with saline, equalise until the waveforms (not only the means) superimpose and Pd/Pa reads 1.0.",
            "Step 4: cross and go as distal as possible.",
            "Will not equalise: introducer, flush, aortic line, sensor position; then change the wire.",
            "Drift: equalise before crossing and do not disconnect the wire during manipulation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-indices",
      title: "Reading the lesion: resting ratios and hyperaemic FFR",
      minutes: 16,
      topics: ["phy-ffr-nhpr"],
      sources: [B("12.2"), B("3.2"), O("ch 8: Pressure wire")],
      refs: [...BOOKS, "define-flair-2017", "ifr-swedeheart-2017"],
      blocks: [
        {
          kind: "p",
          text: "With the sensor beyond the lesion you can measure at rest (step 5) and, if needed, during hyperaemia (step 6). Brilakis treats the hyperaemic step as optional because in many cases the resting index already answers the question. This lesson covers both, the vasodilators and their doses, the artefacts that make a value wrong, and the arrhythmias adenosine can cause.",
        },
        { kind: "h", text: "Step 5: the resting index" },
        {
          kind: "p",
          text: "Record Pd and Pa together at rest and let the console compute the index. The resting indices correlate strongly with each other, but Brilakis notes that only iFR has been validated in clinical trials (DEFINE-FLAIR and iFR-SWEDEHEART); Oxford likewise says that only FFR and iFR have been widely tested for routine use. For iFR the console uses the ECG to find the wave-free period of diastole, so check that both the pressure traces and the ECG are clean before you read it.",
        },
        {
          kind: "table",
          caption: "Resting indices and their cut-offs (Brilakis Table 12.1)",
          head: ["Index", "What it is", "Ischaemic at"],
          rows: [
            ["Pd/Pa", "Whole-cycle resting ratio of wire pressure to guide pressure", "0.91 or less"],
            ["iFR", "Instantaneous wave-free ratio, in the diastolic wave-free window", "0.89 or less"],
            ["dPR", "Diastolic pressure ratio", "0.89 or less"],
            ["dFR", "Diastolic hyperaemia-free ratio", "0.89 or less"],
            ["RFR", "Resting full-cycle ratio", "0.89 or less"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Why rest first.** Brilakis: shorter procedure, lower cost, and none of the complications of hyperaemic drugs. Oxford: less time-consuming, cheaper because no adenosine is used, and better tolerated, since adenosine can cause chest pain, bronchospasm, bradycardia and AV block.",
            "**The price.** Resting indices are much more affected by pressure drift than hyperaemic ones (Brilakis), so the drift check at the end (next lesson) matters even more after a resting measurement.",
            "**When they disagree.** Resting and hyperaemic indices are discordant in about 14% of lesions, especially in large arteries such as the left main and proximal LAD and in diabetes; Brilakis bases the decision on the clinical presentation when that happens.",
          ],
        },
        { kind: "h", text: "Step 6: hyperaemic FFR" },
        {
          kind: "table",
          caption: "Vasodilators for hyperaemia (typical doses as given in the manuals; follow local protocol)",
          head: ["Agent", "Route and dose", "Notes"],
          rows: [
            [
              "Adenosine",
              "Intracoronary: RCA 50–100 µg; left main 200 µg (up to 600 µg used in some studies). Intravenous: 140–180 µg/kg/min (section 3.2 gives 140 µg/kg/min through a central or large peripheral vein)",
              "The usual agent. Brilakis's drug chapter gives 100–200 µg for the left main, so the two sections differ slightly",
            ],
            ["Regadenoson", "Can be used", "Costly (Brilakis)"],
            [
              "Papaverine",
              "Intracoronary: RCA 8 mg; left main 12 mg",
              "Usually avoided because of the risk of ventricular arrhythmia; not available in the United States when Brilakis wrote",
            ],
            [
              "Contrast",
              "The usual volume is 8 mL",
              "Has some vasodilator effect; the ischaemic threshold for contrast FFR is 0.83 rather than 0.80",
            ],
          ],
        },
        {
          kind: "steps",
          title: "Giving the drug and reading the value",
          items: [
            {
              title: "Intracoronary bolus",
              detail:
                "Inject through the engaged guide, then flush the guide so that the whole dose reaches the artery. Read the lowest Pd/Pa from the simultaneous recording that follows within a second or two, but only once the guide trace has returned to its baseline after the injection: reading too early is one of Brilakis's artefacts. For a pullback during hyperaemia Brilakis uses an intravenous infusion (next lesson).",
            },
            {
              title: "Intravenous infusion",
              detail:
                "Oxford: the infusion gives steadier hyperaemia than an intracoronary bolus but takes 60–90 seconds to reach it and causes slightly more side effects. Brilakis reads FFR 1–3 minutes after starting, once hyperaemia is stable. Signs that the drug is working: a fall in systolic pressure of about 10 mmHg and a rise in heart rate of 5–10 beats/min. Pd/Pa falls to a minimum steady value, which is the FFR (Oxford). Stop the infusion after the pullback and drift check.",
            },
            {
              title: "Interpret it as a continuum",
              detail:
                "FFR 0.80 or less (contrast FFR 0.83 or less) is the ischaemic threshold, but Brilakis stresses that ischaemia and FFR are continuous: 0.80 and 0.81 are not really different, and the potential benefit of revascularisation is greater the lower the FFR.",
            },
          ],
        },
        { kind: "tip", id: "pci-phys-ic-adenosine-flush" },
        { kind: "tip", id: "pci-phys-iv-hyperaemia-signs" },
        {
          kind: "check",
          stem: "Two and a half minutes into an IV adenosine infusion at 140 µg/kg/min through a hand vein, the blood pressure and heart rate have not changed, the patient feels nothing and FFR reads 0.85. What should you do?",
          options: [
            "Record 0.85 and defer PCI, because the infusion has run for longer than 2 minutes",
            "Check the cannula for infiltration and ask about caffeine, then repeat with working hyperaemia",
            "Reduce the dose, because an absent response suggests adenosine sensitivity",
            "Switch to papaverine 12 mg intracoronary, which is the preferred second agent",
          ],
          answer: 1,
          explanation:
            "No fall in systolic pressure and no rise in heart rate mean hyperaemia has probably not been reached, so the 0.85 may be falsely high. Brilakis's causes of failed vasodilation include an IV line that is not working (infiltration), a very low dose, saline given instead of adenosine, recent caffeine, and, for intracoronary doses, a guide disengaged before the bolus. Fix the cause and repeat. Brilakis gives IV adenosine through a central or large peripheral vein (section 3.2); a small hand-vein cannula is a poor choice and easily infiltrates, so re-site it in a large vein. Papaverine is usually avoided because of ventricular arrhythmias.",
        },
        { kind: "tip", id: "pci-phys-no-hyperaemia" },
        { kind: "h", text: "Artefacts and adenosine's hazards" },
        {
          kind: "table",
          head: ["Problem", "Cause", "Prevention", "Treatment"],
          rows: [
            [
              "Artefact",
              "Wire artefact; measuring before the guide trace has recovered from an intracoronary injection; damped guide pressure",
              "Look at the tracings for artefact and damping before recording",
              "Give adenosine again and repeat with a clean trace",
            ],
            [
              "Bradycardia, AV block",
              "Adenosine acting on the AV node",
              "No more than 100 µg intracoronary into the RCA",
              "It usually passes within seconds (short half-life); ask the patient to cough; if block without an escape rhythm persists, brief CPR and temporary pacing may be needed",
            ],
            [
              "Ventricular fibrillation",
              "R-on-T, usually after a pause, though it can occur without one (Brilakis 3.2.5)",
              "No more than 100 µg intracoronary into the RCA or a dominant circumflex",
              "Defibrillation",
            ],
            [
              "Atrial fibrillation",
              "Adenosine-induced AV block or atrial fibrillation",
              "As above",
              "Cardioversion if sinus rhythm does not return on its own",
            ],
          ],
        },
        {
          kind: "p",
          text: "Oxford adds that adenosine can cause flushing and chest tightness, and that the wire itself may rarely dissect the artery. The drug's wider use (no-reflow, its doses by vessel, and the arrhythmia figures) is taught in pm-lab-drugs.",
        },
        { kind: "tip", id: "pci-adenosine-rca-dose" },
        { kind: "tip", id: "pci-adenosine-block-cough-wait" },
        {
          kind: "check",
          stem: "FFR in a proximal LAD lesion is 0.81 with good hyperaemia and no drift. The patient has typical angina on two antianginal drugs. How does Brilakis want you to think about this number?",
          options: [
            "It is not ischaemic, so PCI is contraindicated and must not be considered",
            "It should be rounded to 0.80 and the lesion treated as definitely ischaemic",
            "It sits on a continuum: 0.81 barely differs from 0.80, so weigh it with the clinical picture",
            "It is invalid in the proximal LAD, where only resting indices should be used",
          ],
          answer: 2,
          explanation:
            "Brilakis notes that FFR is often treated as yes or no around 0.80 but is really continuous, that there is no major difference between 0.80 and 0.81, and that the benefit of revascularisation grows as FFR falls. A borderline value in a symptomatic patient is weighed with the clinical picture. Rounding a value is not a method, and nothing bars FFR in the proximal LAD, although discordance with resting indices is more common in large vessels.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading a resting index from a noisy ECG or trace.",
            "Disengaging the guide before an intracoronary bolus, so the drug goes to the aorta.",
            "Forgetting to flush the guide after an intracoronary bolus.",
            "Reading the FFR while the guide trace is still disturbed by the injection.",
            "Accepting an IV FFR without the expected fall in blood pressure and rise in heart rate.",
            "Giving more than 100 µg into the RCA or a dominant circumflex.",
            "Applying the 0.80 threshold to a contrast FFR, whose threshold is 0.83.",
          ],
        },
        {
          kind: "pearl",
          text: "Watch the patient and the monitor, not only the ratio. A slight fall in pressure, a slight rise in heart rate and a patient who feels the drug tell you hyperaemia is real; a calm patient with an unchanged pressure tells you to check the drip.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the 'Moderate mid-RCA lesion' scenario, record the resting index, then give intracoronary adenosine at no more than 100 µg with the guide engaged, flush the guide, and read FFR once the guide trace has recovered. Repeat with IV adenosine and confirm the blood pressure and heart rate response before reading.",
        },
        { kind: "video", id: "fxceb437LF0", note: "Brilakis case 30 from the Manual of PCI: iFR-guided PCI." },
        { kind: "video", id: "FVG3077hurg", note: "Brilakis case 166 from the Manual of PCI: physiology-guided PCI." },
        { kind: "video", id: "w1vtN7o5S4U", note: "Elias Hanna on FFR and iFR concepts, technical pitfalls and applications in different lesion types." },
        {
          kind: "keypoints",
          items: [
            "Resting cut-offs: Pd/Pa 0.91 or less; iFR, dPR, dFR and RFR 0.89 or less. Only iFR has outcome-trial validation.",
            "Resting indices are quicker, cheaper and drug-free, but more sensitive to drift; discordance with FFR (about 14%) is decided on the clinical presentation.",
            "Adenosine (typical, follow local protocol): RCA 50–100 µg IC; left main 200 µg IC; IV 140–180 µg/kg/min. Flush the guide after an IC bolus.",
            "IV infusion: steadier hyperaemia after 60–90 s (Oxford) to 1–3 min (Brilakis); expect about 10 mmHg fall in systolic pressure and 5–10 beats/min rise in rate.",
            "FFR 0.80 or less is ischaemic (contrast FFR 0.83); the value is a continuum.",
            "Failed hyperaemia: disengaged guide for IC drug, saline instead of adenosine, tissued IV, low dose, caffeine.",
            "No more than 100 µg IC into the RCA or a dominant circumflex: AV block, VF and AF. Adenosine is contraindicated in asthma and with dipyridamole (Oxford).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-pullback",
      title: "Pullback, drift check and reading the trace",
      minutes: 14,
      topics: ["phy-pitfalls-pullback"],
      sources: [B("12.2"), B("12.1"), B("22.4"), B("7.4"), O("ch 8: Pressure wire")],
      refs: [...BOOKS, "perera-bhf-cmd-2023"],
      blocks: [
        {
          kind: "p",
          text: "A single distal number tells you that the vessel as a whole limits flow; it does not tell you where. The pullback (step 7) finds the places where pressure is lost, which is what decides whether a stent will help, and the drift check (step 8) decides whether any of the numbers can be believed.",
        },
        { kind: "h", text: "Step 7: the pullback" },
        {
          kind: "steps",
          items: [
            {
              title: "Choose the state",
              detail:
                "Pull back at rest while recording a resting index, or during intravenous adenosine for an FFR pullback (Brilakis). Either way, record the pressures continuously and withdraw under fluoroscopy so that every change in the trace can be matched to a position in the vessel.",
            },
            {
              title: "Withdraw slowly",
              detail:
                "Oxford withdraws the wire slowly along the artery so that each lesion's share can be assessed. Note where Pd steps up.",
            },
            {
              title: "Stop at the guide tip",
              detail:
                "Stop when the radiopaque segment reaches the tip of the guide, the same place where you equalised; this is where the drift check is made.",
            },
          ],
        },
        {
          kind: "table",
          caption: "What the trace shows and what it means",
          head: ["Pattern on pullback", "Meaning", "What to do"],
          rows: [
            [
              "One clear step-up across a short segment",
              "A focal lesion is responsible for the pressure loss",
              "Treat that segment",
            ],
            [
              "Two or more steps (serial lesions)",
              "FFR reflects the summed effect of the lesions, but it does not apply to any one of them, because each lesion limits the maximal flow through the other",
              "Treat the stenosis with the biggest gradient first, repeat the FFR, and stent the remaining lesion only if the value is still abnormal",
            ],
            [
              "A gradual fall with no step (diffuse disease)",
              "Pressure is lost along a long segment",
              "PCI is challenging because it would need a long stent length; bypass surgery is preferable if feasible (Brilakis Fig 12.7)",
            ],
            [
              "A step within what looked like a long lesion",
              "The disease may be more focal than the angiogram suggested (Brilakis 22.4)",
              "Locate the step on the angiogram before planning stent length",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Resting pullbacks predict the result.** Brilakis notes that with iFR, a pullback before angioplasty works as a virtual intervention, predicting the haemodynamic result of treating serial or diffuse disease. Newer systems co-register the pullback with the angiogram and map the pressure drop onto the vessel. In the example he reproduces, the distal iFR was 0.41 and the operator marked a 48 mm segment that accounted for a drop of 0.51, predicting a value of about 0.92 after treating it; after a 48 mm stent covering exactly that segment the iFR beyond the stent was 0.93. In a third panel, with no step on the trend line, stenting was judged not practical.",
        },
        { kind: "tip", id: "pci-phys-serial-biggest-step" },
        { kind: "tip", id: "pci-phys-diffuse-no-step" },
        {
          kind: "check",
          stem: "An FFR pullback in the LAD during IV adenosine reads 0.66 distally, with a step from 0.95 to 0.86 across a proximal lesion and from 0.86 to 0.66 across a mid lesion. What is the correct plan?",
          options: [
            "Stent the mid lesion first, then repeat the FFR before deciding on the proximal one",
            "Stent both lesions now, since the distal FFR of 0.66 is clearly ischaemic",
            "Stent the proximal lesion first because upstream lesions are always treated first",
            "Defer both, because neither single step on its own exceeds a drop of 0.25",
          ],
          answer: 0,
          explanation:
            "In serial disease FFR reflects the combination and cannot be assigned to either lesion alone, because each limits flow through the other. Brilakis treats the stenosis with the biggest pressure gradient first (here the mid lesion, a drop of 0.20 against 0.09), then repeats the FFR and stents the other only if the value remains abnormal. Stenting both on the distal value ignores the interaction; deferring ignores a clearly ischaemic system.",
        },
        {
          kind: "p",
          text: "**Which lesion needs a stent, and in what order you stent.** These are two different questions. The pullback answers the first: physiology picks the lesion with the biggest gradient, and a repeat measurement after treating it decides whether the other needs anything (12.2.7). The second is technical. In a stable patient with several lesions in one artery, Brilakis generally treats the more distal lesion first, making exceptions when a proximal or ostial lesion causes severe pressure damping or ischaemia, or is too tight for devices to pass (7.4). He also advises treating all the significant lesions in a target vessel during the same procedure. The two rules can point in different directions. When the proximal lesion has the larger step, the physiological rule treats it first and then re-measures, and that re-measurement is the only way to learn whether the distal lesion needs a stent at all.",
        },
        { kind: "h", text: "Step 8: the drift check" },
        {
          kind: "p",
          text: "With the radiopaque segment back at the guide tip, read Pd/Pa. It should be 1.0 again. Brilakis treats a value above 1.02 or below 0.98 as significant drift: re-equalise and repeat steps 4 to 7. Oxford makes the same check (Pd/Pa at the guide not equal to 1) part of both FFR and iFR studies, and uses the same withdrawal to look for a jump in the value across tandem lesions. Oxford stops the adenosine at this point. The UK microvascular protocol uses a looser rule, repeating the study when the drift is 0.03 or more; for a stenosis study keep to Brilakis's narrower 0.98–1.02 window.",
        },
        {
          kind: "p",
          text: "**Why it matters.** Brilakis shows an FFR pullback that read 0.78, apparently significant. At the guide tip the pressures had drifted, so the study was invalid. After re-equalising and repeating, the pullback ended without drift and the FFR was 0.85: the lesion was not significant, and stenting it on the first reading would have been wrong.",
        },
        { kind: "tip", id: "pci-phys-drift-check" },
        {
          kind: "check",
          stem: "A resting iFR of 0.86 is recorded in the mid RCA. On pullback to the guide tip the console reads Pd/Pa 0.96. What next?",
          options: [
            "Accept 0.86: drift matters only for hyperaemic FFR, not for a resting index",
            "Add 0.04 to the iFR to correct for the drift, giving 0.90, and defer PCI",
            "Proceed to PCI, because the drift makes the true iFR even lower than 0.86",
            "Re-equalise at the guide tip, recross and repeat the measurement and pullback",
          ],
          answer: 3,
          explanation:
            "A value below 0.98 at the guide tip is significant drift, so Brilakis re-equalises and repeats steps 4 to 7. Resting indices are much more affected by drift than FFR (Brilakis), so ignoring it is the worst option. Arithmetic correction assumes the drift is fixed and known, which it is not; and the direction of the error cannot be used to justify PCI.",
        },
        { kind: "h", text: "The traps that corrupt a pullback" },
        {
          kind: "table",
          head: ["Trap", "Effect", "Answer"],
          rows: [
            [
              "Damped guide pressure",
              "Underestimates severity by raising FFR and the resting indices",
              "Recognise it before measuring; disengage the guide (the subsets lesson shows how for ostial lesions)",
            ],
            [
              "Extreme tortuosity",
              "Wire bias and an accordion effect can create an artificial gradient",
              "Brilakis lists it among causes of a disappointing post-PCI FFR; recognising pseudolesions is taught in pm-wiring",
            ],
            ["Drift", "Offsets Pd in either direction", "Check at the guide tip after every pullback; re-equalise and repeat"],
            [
              "Reading during an injection",
              "Distorted guide pressure after an intracoronary bolus",
              "Wait for the guide trace to recover",
            ],
          ],
        },
        { kind: "tip", id: "pci-phys-damped-guide" },
        {
          kind: "pitfalls",
          items: [
            "Pulling back without fluoroscopy, so a step cannot be placed on the angiogram.",
            "Assigning the distal FFR to the most severe-looking lesion in a vessel with serial disease.",
            "Planning a long stent to 'fix' a gradual pressure fall without a step.",
            "Removing the wire or closing the case before the drift check.",
            "Correcting drift by arithmetic instead of re-equalising and repeating.",
          ],
        },
        {
          kind: "pearl",
          text: "Report three things, not one: the distal value, where the pressure is lost (focal step, steps or slope), and the Pd/Pa back at the guide tip. A value without the other two cannot be acted on.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the 'Tandem LAD lesions' scenario, perform a hyperaemic pullback under IV adenosine, name the larger step, and choose to treat it first and re-measure. Then open 'Diffusely diseased LAD' and 'A pitfall: sensor drift': recognise the slope without a step, and re-equalise when the guide-tip Pd/Pa falls outside 0.98–1.02.",
        },
        { kind: "video", id: "fxceb437LF0", note: "Brilakis case 30 from the Manual of PCI: iFR-guided PCI." },
        { kind: "video", id: "1NTwPRQUoUw", note: "Brilakis case 195 from the Manual of PCI: physiology-guided PCI." },
        { kind: "video", id: "w1vtN7o5S4U", note: "Elias Hanna on FFR and iFR concepts, technical pitfalls and applications in different lesion types." },
        {
          kind: "keypoints",
          items: [
            "Pull back under fluoroscopy, at rest or during IV adenosine, and stop with the radiopaque segment at the guide tip.",
            "Serial lesions: FFR is the sum and belongs to neither lesion; treat the biggest gradient first, then re-measure.",
            "Technical order in one artery: generally distal first, unless a proximal or ostial lesion damps the pressure, causes ischaemia or blocks device passage (Brilakis 7.4).",
            "No step-up means diffuse disease: PCI needs long stents and bypass surgery is preferable if feasible.",
            "An iFR pullback before PCI predicts the result (virtual PCI); co-registration maps the drop onto the angiogram.",
            "Drift: Pd/Pa at the guide tip above 1.02 or below 0.98 means re-equalise and repeat steps 4–7.",
            "Damping raises the values and hides severity; tortuosity can create an artificial gradient.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-subsets",
      title: "Lesion and patient subsets: when the number needs care",
      minutes: 16,
      topics: ["phy-subsets", "phy-pitfalls-pullback"],
      sources: [
        B("12.3"),
        B("15.1"),
        B("17.12"),
        B("18.12"),
        B("20.12"),
        B("21.12"),
        B("22.1"),
        B("22.2"),
        B("24.1"),
        B("24.2"),
        O("ch 8: Pressure wire"),
        O("ch 8: Primary PCI in multivessel disease"),
      ],
      refs: [...BOOKS, "ahmad-tavr-physiology-2018", "lonborg-notion3-2024", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "A pressure ratio is valid only when its assumptions hold: an undamped guide, a microcirculation that can dilate, a stable lesion, and a single route of supply. Each subset below breaks one of these, and the manuals respond either by changing the technique or by advising against measuring at all.",
        },
        { kind: "h", text: "Aorto-ostial lesions" },
        {
          kind: "steps",
          items: [
            {
              title: "Equalise in the aorta",
              detail:
                "Bring both the pressure wire's sensor and the guide out into the ascending aorta to equalise, with the guide off the ostium, so the trace is not damped (Brilakis 15.1.12).",
            },
            {
              title: "Measure with the guide disengaged",
              detail:
                "Damping from a guide in or across an ostial lesion raises the indices and underestimates the stenosis. Either give intracoronary adenosine and then disengage the guide before reading, or give the adenosine intravenously; resting indices are measured disengaged too (Brilakis 12.3.1).",
            },
            {
              title: "Assess the final result the same way",
              detail:
                "After stenting, detect and correct damping by disengaging before the physiological assessment (Brilakis 15.1.12). When an aorto-ostial stenosis looks questionable, give nitroglycerin first to rule out spasm (15.1.7).",
            },
          ],
        },
        { kind: "tip", id: "pci-phys-ostial-disengage" },
        { kind: "h", text: "Left main" },
        {
          kind: "list",
          items: [
            "Both hyperaemic and resting indices can be used, and Brilakis cites follow-up supporting FFR-guided deferral of angiographically equivocal left main stenoses.",
            "An ostial left main lesion is an aorto-ostial lesion: disengage the guide.",
            "**Measure in both branches.** Put the wire in the LAD and in the circumflex, each with a pullback, to see whether the step-up happens in the left main. Brilakis's rule: a value of 0.80 or above (his wording) in one branch but not in the other points to a non-significant left main lesion, because a significant left main lesion would lower both.",
            "**Downstream disease misleads.** A stenosis in the LAD or circumflex lowers the maximum flow that can pass through the left main, so the distal pressure is higher and the left main looks less severe than it is (Brilakis 17.12).",
            "Unlike other lesions, IVUS and OCT can also judge the significance of a left main stenosis (minimal lumen area under 6.0 mm² by IVUS or 5.4 mm² by OCT; Brilakis adds that the IVUS cut-off may differ between populations, with about 4.5 mm² proposed for Korean patients, whose coronary arteries are smaller); taught in pm-target and pm-imaging.",
          ],
        },
        { kind: "tip", id: "pci-phys-left-main-both-branches" },
        {
          kind: "check",
          stem: "An intermediate distal left main stenosis is assessed. LAD pullback: FFR 0.93, with no step at the left main. Circumflex pullback: FFR 0.72, with a sharp step at the circumflex ostium and none in the left main. The LAD is free of disease. What does this suggest?",
          options: [
            "Significant left main disease, because the lowest value in either branch is the left main value",
            "The left main is probably not significant; the pressure is lost at the circumflex ostium",
            "Both are invalid because left main lesions can only be assessed by intravascular imaging",
            "Significant left main disease, masked in the LAD by the circumflex lesion downstream",
          ],
          answer: 1,
          explanation:
            "A significant left main lesion would lower the pressure in both branches and show its step in the left main on both pullbacks. Here the LAD is normal with no left main step, and the circumflex loss is at its own ostium, which is Brilakis's pattern for a non-significant left main. Downstream disease can hide left main severity, which is why both branches are measured. Here, though, neither pullback shows a step in the left main: the only loss is at the circumflex ostium, and a significant left main lesion would still produce a step on both pullbacks, so D over-reads the masking effect. Imaging is an alternative, not a requirement.",
        },
        { kind: "h", text: "Where physiology should not decide, or needs care" },
        {
          kind: "table",
          head: ["Subset", "Problem", "The manuals' advice"],
          rows: [
            [
              "Saphenous vein graft lesion",
              "The FFR combines graft flow, native flow (unless the native artery is occluded) and collateral flow, so a severe graft lesion can read normal when the native vessel competes; and the reason deferral works in native arteries (slow progression of non-significant lesions) does not hold, because intermediate graft lesions progress fast and new lesions appear in the same graft",
              "Brilakis recommends against physiological assessment of graft lesions. CT-derived FFR is not validated with previous stents or grafts (18.12)",
            ],
            [
              "ACS culprit or suspected culprit",
              "Microcirculatory dysfunction after infarction",
              "Do not measure; use intracoronary imaging (Brilakis). Oxford: avoid FFR in the STEMI culprit vessel",
            ],
            [
              "ACS non-culprit",
              "—",
              "Can be measured, because the values change little over time (Brilakis 12.3.4, 20.12). Oxford: two of the four STEMI multivessel trials it lists (DANAMI-3-PRIMULTI, COMPARE-ACUTE) selected lesions by FFR 0.80 or less. The 2023 ESC guideline now bases non-culprit PCI in STEMI on angiographic severity; this guidance is taught in pm-target",
            ],
            [
              "CTO vessel",
              "The CTO territory is ischaemic even with good collaterals",
              "Not usually measured before treatment; after stenting, a step-up shows where more treatment is needed (21.12)",
            ],
            [
              "Donor vessel of a CTO",
              "It carries collateral flow, so its lesion can look worse",
              "In Sachdeva's study six of nine ischaemic donor vessels (FFR 0.80 or less) became non-ischaemic after the CTO was opened, a mean rise of 0.098 ± 0.04; another study found a mean rise of 0.03. Measure ideally after recanalisation",
            ],
            [
              "Heart failure with high right atrial and LV end-diastolic pressure",
              "The FFR measurement is affected",
              "A correction exists, FFR = (Pd − Pv)/(Pa − Pv) with right atrial pressure as Pv, but Brilakis prefers to avoid functional assessment in these patients",
            ],
            [
              "Cardiogenic shock",
              "FFR depends on coronary afterload",
              "Use physiology with caution; it may not show the true severity (24.2)",
            ],
            [
              "Severe aortic stenosis",
              "In one study, hyperaemic flow rose after valve replacement, so FFR fell, while iFR did not change",
              "Use FFR with caution, as it may underestimate the stenosis (24.1). Oxford names the CTO donor artery, aortic stenosis, hypertrophic cardiomyopathy, diabetes and chronic kidney failure as settings where validation is limited",
            ],
            ["Spontaneous coronary artery dissection", "—", "Physiology has a limited role (22.1)"],
            ["Stent failure", "—", "Physiology can help judge significance, although imaging is usually the better choice (22.2)"],
          ],
        },
        {
          kind: "p",
          text: "**The aortic stenosis data.** In the study Brilakis cites, 28 patients (30 lesions) with severe aortic stenosis had intracoronary pressure and flow measured just before and after TAVI. Flow in the wave-free period of diastole did not change, whereas whole-cycle hyperaemic flow rose, mostly through systolic flow. iFR was 0.88 before and after, while FFR fell from 0.87 to 0.85. The authors concluded that hyperaemic indices that include systole underestimate stenosis severity in severe aortic stenosis. Keep the size of this in view: it was one 28-patient study and the FFR change was small. Since the manuals were written, the randomised NOTION-3 trial (455 patients undergoing TAVI) selected lesions by FFR 0.80 or less, or a diameter stenosis of 90% or more, and found fewer major adverse cardiac events with PCI than with conservative treatment (26% against 36% at a median of 2 years, hazard ratio 0.71), at the cost of more bleeding.",
        },
        { kind: "tip", id: "pci-phys-svg-avoid" },
        { kind: "tip", id: "pci-no-physiology-in-culprit" },
        { kind: "tip", id: "pci-interp-donor-ffr" },
        {
          kind: "check",
          stem: "A man with severe aortic stenosis awaiting TAVI has a 65% proximal LAD stenosis. FFR is 0.82 and iFR 0.87. What does the evidence quoted by Brilakis imply?",
          options: [
            "The FFR is reliable and the iFR is not, so defer PCI on the strength of the FFR",
            "Both are invalid in aortic stenosis, so only angiographic grading can be used",
            "The FFR may underestimate the lesion, because hyperaemic flow is blunted until the valve is treated",
            "The iFR overestimates the lesion, because diastolic flow rises after TAVI",
          ],
          answer: 2,
          explanation:
            "After TAVI, hyperaemic flow increased and FFR fell, while diastolic wave-free flow and iFR did not change. So before the valve is treated, FFR may underestimate how severe the stenosis is, and Brilakis advises caution with FFR in severe aortic stenosis. The resting index was the stable one in that study; nothing makes physiology wholly invalid here, although Oxford notes its validation is limited.",
        },
        { kind: "tip", id: "pci-phys-discordance" },
        {
          kind: "pitfalls",
          items: [
            "Measuring an ostial lesion with the guide engaged, or equalising with the guide in the ostium.",
            "Judging the left main from one branch, or forgetting that downstream disease hides left main severity.",
            "Deferring a vein-graft lesion because its FFR is normal.",
            "Measuring the culprit of an acute coronary syndrome.",
            "Treating a CTO donor lesion on its FFR before the occlusion has been opened.",
            "Measuring FFR in high filling pressures (Brilakis advises avoiding it), or trusting it without caution in shock or severe aortic stenosis.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every measurement ask: is the guide off this ostium, is this artery the only route of supply, and can its microcirculation dilate? A 'no' to any of the three means the number needs an asterisk, or should not be measured.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "Open 'A pitfall: the deeply seated guide': recognise the damped, ventricularised aortic trace, disengage the guide during hyperaemia and compare the two FFR values. Then state how you would equalise and measure an ostial RCA lesion (sensor and guide in the aorta, guide disengaged, IV adenosine).",
        },
        { kind: "video", id: "w1vtN7o5S4U", note: "Elias Hanna on FFR and iFR concepts, technical pitfalls and applications in different lesion types." },
        {
          kind: "keypoints",
          items: [
            "Aorto-ostial: equalise in the aorta and measure with the guide disengaged (IC adenosine then disengage, or IV adenosine).",
            "Left main: measure both branches with pullback; normal in one branch and abnormal in the other points away from the left main; downstream disease hides left main severity.",
            "Vein grafts: Brilakis advises against physiology (competitive flow; rapid progression).",
            "ACS: never the culprit. Non-culprit lesions can be measured (Brilakis), but in STEMI the 2023 ESC guideline bases non-culprit PCI on angiographic severity (see pm-target).",
            "CTO: not the occluded vessel; donor FFR rises by about 0.03–0.10 after recanalisation.",
            "Avoid FFR in high filling pressures; use it with caution in shock and severe aortic stenosis (after TAVI, FFR fell slightly while iFR did not change in one small study).",
            "Resting and hyperaemic indices disagree in about 14%: decide on the clinical presentation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-after-pci",
      title: "Physiology after stenting and in jailed side branches",
      minutes: 13,
      topics: ["phy-subsets"],
      sources: [B("12.1"), B("10.2"), B("15.1"), B("16.2"), B("17.12"), B("21.12")],
      refs: ["brilakis-manual-pci", "koo-jailed-sb-ffr-2005", "collison-target-ffr-2021"],
      blocks: [
        {
          kind: "p",
          text: "Physiology is not only for deciding whether to treat. After a stent, it can tell you whether the result is functionally good, and if not, where the pressure is still being lost. In bifurcations it settles a question the angiogram answers badly: does the narrowed ostium of a jailed side branch matter?",
        },
        { kind: "h", text: "The final FFR" },
        {
          kind: "p",
          text: "Brilakis describes post-PCI FFR as an emerging tool for judging whether a result is functionally optimal: values above 0.91 after PCI have been linked with the best outcomes. That link is observational. In the randomised TARGET-FFR trial (260 patients), about two-thirds had a post-PCI FFR below 0.90 after angiography-guided PCI; a strategy of further optimisation guided by FFR reduced the share left at 0.80 or less, but did not significantly increase the share reaching 0.90 or more. Physiology can also stand in for contrast when assessing the result (10.2.13), and co-registration of the angiogram with physiology or imaging can help position the stent (10.2.8).",
        },
        {
          kind: "steps",
          title: "When the post-PCI value is low (Brilakis Fig 12.1, in this module's words)",
          items: [
            {
              title: "1. Trigger",
              detail: "After PCI the FFR is 0.80 or less, or the iFR 0.89 or less.",
            },
            {
              title: "2. Pull back through the stent",
              detail: "Find where the remaining pressure is lost: inside the stent, or in the vessel proximal or distal to it.",
            },
            {
              title: "3a. Loss inside the stent",
              detail: "Post-dilate, or add a stent.",
            },
            {
              title: "3b. Loss outside the stent, focal",
              detail: "A focal step proximal or distal to the stent: stent it.",
            },
            {
              title: "3c. Loss outside the stent, diffuse",
              detail: "A gradual fall with no step: no further treatment.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Why the post-PCI FFR may be disappointing (Brilakis 12.1.2)",
          head: ["Group", "Causes"],
          rows: [
            ["The stent", "A geographic miss of the culprit lesion; incomplete coverage (not healthy to healthy); an undersized or underexpanded stent; an edge dissection"],
            ["The vessel", "Diffuse disease; serial lesions (another intermediate lesion becoming haemodynamically significant once the culprit is treated); vasospasm; myocardial bridging"],
            ["The circulation", "The treated vessel supplying large collaterals to a CTO territory"],
            ["The measurement", "Extreme tortuosity causing wire bias and an accordion effect; drift or a malfunctioning wire"],
          ],
        },
        { kind: "tip", id: "pci-phys-post-pci-pullback" },
        {
          kind: "check",
          stem: "After a 3.0 × 28 mm stent in the mid LAD, FFR is 0.77. On pullback the pressure rises gradually over the 40 mm beyond the stent with no discrete step, and there is no step across the stent. What does the algorithm advise?",
          options: [
            "Post-dilate the stent with a non-compliant balloon, because the FFR is below 0.80",
            "No further treatment, because the residual loss is diffuse and outside the stent",
            "Add a long distal stent to cover the 40 mm where the pressure is falling",
            "Repeat the measurement with a resting index, which is not affected by diffuse disease",
          ],
          answer: 1,
          explanation:
            "The pullback is the decision point. A loss within the stent calls for post-dilatation or another stent; a focal step outside it calls for a stent; diffuse loss outside it, as here, calls for no further treatment. Post-dilating a stent across which there is no gradient treats the wrong segment, and a long distal stent is the very treatment the manual avoids for diffuse disease.",
        },
        { kind: "h", text: "Ostial stents and CTOs" },
        {
          kind: "list",
          items: [
            "**After aorto-ostial stenting**, the guide pressure should no longer damp, unless the vessel is no bigger than the guide; FFR or a resting index can be measured, with the guide disengaged to avoid damping (15.1.10, 15.1.12).",
            "**After a CTO is opened and stented**, a step-up on the pullback shows the segment that still needs treatment (21.12).",
          ],
        },
        { kind: "h", text: "The jailed side branch" },
        {
          kind: "p",
          text: "During provisional bifurcation stenting the side-branch ostium often looks narrowed after the main-vessel stent, and Brilakis notes that the eye frequently overestimates how severe that narrowing is. In one of the studies he cites (Koo), only 20 of 73 jailed branches narrowed by 75% or more had an FFR below 0.75. Intracoronary nitroglycerin may reverse spasm. Then adenosine FFR of the jailed branch guides what happens next. Coronary physiology can be used for this in non-culprit lesions in an acute coronary syndrome as well as in stable disease (16.2).",
        },
        {
          kind: "table",
          head: ["Jailed side-branch FFR", "Action (Brilakis 12.1.2)"],
          rows: [
            ["0.80 or less", "Treat the branch further, provided it measures at least 2 mm, because later adverse events are more likely if it is left"],
            ["Above 0.80", "No further side-branch treatment"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Left main provisional stenting.** After stenting from the left main into the LAD, if the jailed circumflex ostium looks narrowed, assess the circumflex with imaging and physiology. If FFR is above 0.80, or a resting index is above its cut-off, defer circumflex stenting; if FFR is 0.80 or less, a second stent can be placed by T-stenting, TAP, reverse crush or culotte (17.12; techniques in the bifurcation modules).",
            "**Brilakis's example**: after left main stenting the circumflex ostium looked compromised, and FFR (0.52), with the pressure rising at the left main as the wire was pulled back, confirmed a significant focal ostial circumflex stenosis.",
            "**Three jobs in a bifurcation** (16.2.12): the baseline severity of the main vessel and side branch, whether the final result is optimal, and whether the side branch was compromised during provisional stenting.",
          ],
        },
        { kind: "tip", id: "pci-phys-jailed-side-branch" },
        {
          kind: "check",
          stem: "After provisional stenting of the proximal LAD across a 2.5 mm first diagonal, the diagonal ostium looks 75% narrowed. Flow is TIMI 3 and the patient is stable. After intracoronary nitroglycerin, FFR in the diagonal is 0.86. What next?",
          options: [
            "Kissing balloon inflation, because a 75% ostial narrowing needs treating",
            "A T-stent into the diagonal, because the vessel is larger than 2 mm",
            "Leave the diagonal: FFR above 0.80 needs no further side-branch treatment",
            "Repeat the FFR during a second intracoronary adenosine bolus of 600 µg",
          ],
          answer: 2,
          explanation:
            "Brilakis's rule for a jailed side branch is that an FFR above 0.80 needs no further treatment; the 2 mm size criterion applies only when FFR is 0.80 or less. The angiogram often overestimates jailed-ostium severity, which is why the wire is used. Kissing or a second stent would add risk for no functional gain, and repeating with a higher dose has no basis when hyperaemia was adequate.",
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a low post-PCI FFR without a pullback to find the cause.",
            "Post-dilating a stent when the residual loss lies outside it.",
            "Stenting diffuse disease beyond the stent because the final value is below 0.80.",
            "Treating a jailed side branch because of its angiographic appearance without measuring it.",
            "Measuring the ostial result with the guide still engaged.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep the pressure wire as part of your final assessment toolkit: one pullback through a new stent tells you whether to post-dilate, extend or stop, which neither the angiogram nor a single number can.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the 'Tandem LAD lesions' scenario, after deciding which lesion to treat, state the post-PCI sequence: measure the final FFR, and if it is 0.80 or less (iFR 0.89 or less) pull back through the stent and choose post-dilatation for an in-stent loss, a stent for a focal step outside it, or nothing for diffuse loss.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario of the PCI lab, after deploying the stent, describe how you would confirm a functionally optimal result with a pressure wire and what a final FFR above 0.91 means.",
        },
        { kind: "video", id: "1NTwPRQUoUw", note: "Brilakis case 195 from the Manual of PCI: physiology-guided PCI." },
        { kind: "video", id: "FVG3077hurg", note: "Brilakis case 166 from the Manual of PCI: physiology-guided PCI." },
        {
          kind: "keypoints",
          items: [
            "A post-PCI FFR above 0.91 has been linked with the best outcomes (observational); optimising to a target did not significantly raise the share reaching 0.90 in TARGET-FFR.",
            "Post-PCI FFR 0.80 or less (iFR 0.89 or less): pull back through the stent.",
            "In-stent loss: post-dilate or add a stent. Focal loss outside: stent. Diffuse loss outside: stop.",
            "Causes of a low result include geographic miss, incomplete coverage, underexpansion, edge dissection, serial or diffuse disease, spasm, bridging, CTO collaterals, tortuosity and wire problems.",
            "Jailed side branch: IC nitroglycerin may reverse spasm; then FFR 0.80 or less and at least 2 mm in diameter means treat; above 0.80 means leave.",
            "Left main provisional stenting: assess the circumflex with imaging and physiology before adding a second stent.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-derived",
      title: "Wire-free physiology: angiography-derived and CT-derived FFR",
      minutes: 14,
      topics: ["phy-angio-ct-derived"],
      sources: [O("ch 1: Cardiac CT or invasive angiography?"), O("ch 6: Quantification of stenoses"), B("18.12")],
      refs: [
        "oxford-cath-handbook",
        "brilakis-manual-pci",
        "westra-favor2-2018",
        "favor3-china-2021",
        "favor3-europe-2024",
        "norgaard-nxt-2014",
        "douglas-platform-2015",
      ],
      blocks: [
        {
          kind: "p",
          text: "FFR can now be estimated without a pressure wire, either from the invasive angiogram or from a coronary CT scan, by reconstructing the vessel and modelling the flow. The two manuals mention these methods only in passing, so this lesson draws on the trials that tested them. Both methods depend entirely on the images they start from, and neither has replaced the wire when the answer is close to the threshold.",
        },
        { kind: "h", text: "CT and CT-derived FFR before the lab" },
        {
          kind: "list",
          items: [
            "**Why CT caught up.** Oxford explains that invasive angiography held its place through good spatial and temporal resolution, and that CT scanners acquiring up to 320 slices per rotation, covering the heart in one short breath-hold, have narrowed the gap.",
            "**Accuracy.** CT has high sensitivity and a negative predictive value that can reach 100%, but its specificity and positive predictive value are much lower (under 50% in some studies). Accuracy depends on the scanner (64 detector rows is the minimum), pretest probability, a high calcium score, a high heart rate and a high body mass index (Oxford). So CT is mainly a rule-out test; its full indications are taught in pm-target.",
            "**When Oxford was written**, guidelines put functional non-invasive tests first; the handbook expected evidence on CT-derived FFR and perfusion CT to change that.",
            "**Limits.** Brilakis: FFR-CT is feasible for native arteries but has not been validated in patients with previous stents or bypass grafts (18.12). Oxford advises against CT with a calcium score above 1000, a high body mass index, a high pretest probability, or previous stents, especially those under 3 mm or of thick-strut design.",
          ],
        },
        {
          kind: "table",
          caption: "What the CT-FFR studies showed",
          head: ["Study", "Design", "Main findings"],
          rows: [
            [
              "NXT (2014)",
              "254 patients with suspected stable disease who had CT before clinically indicated invasive angiography; FFR-CT and invasive FFR both read at 0.80 or less",
              "Area under the curve 0.90 for FFR-CT against 0.81 for CT anatomy. Per patient, FFR-CT sensitivity 86% and specificity 79%; CT anatomy 94% and 34%; invasive angiography by eye 64% and 83%. Adding FFR markedly raised specificity",
            ],
            [
              "PLATFORM (2015)",
              "584 patients with new chest pain assigned to usual testing or CT with FFR-CT",
              "Among those with planned invasive angiography, no obstructive disease was found in 12% after CT/FFR-CT against 73% with usual care; invasive angiography was cancelled in 61% after the CT/FFR-CT result; radiation exposure was similar",
            ],
          ],
        },
        {
          kind: "check",
          stem: "A 71-year-old with three previous LAD and circumflex stents (two of them 2.5 mm) and a calcium score of 1400 has new exertional angina. The clinic suggests CT with CT-derived FFR to avoid an invasive test. What do the manuals say?",
          options: [
            "Ideal: CT-FFR is most accurate in heavily treated, calcified arteries",
            "A poor choice: high calcium, small stents and previous stenting all undermine CT and FFR-CT",
            "Reasonable, as long as a 64-detector scanner is used to image the stents",
            "Reasonable, because CT-FFR has been validated in stents but not in grafts",
          ],
          answer: 1,
          explanation:
            "Oxford advises against cardiac CT with a calcium score above 1000 and after stenting, with accuracy worst in stents under 3 mm and in thick-strut stents; Brilakis notes FFR-CT has not been validated with previous stents or grafts. A 64-detector scanner is Oxford's minimum standard, not a remedy for these limitations.",
        },
        { kind: "h", text: "Angiography-derived FFR" },
        {
          kind: "p",
          text: "The quantitative flow ratio (QFR) builds a three-dimensional reconstruction of the vessel from two angiographic projections and estimates flow from the speed of the contrast (frame counting); no wire and no hyperaemic drug are used, and the same 0.80 threshold applies. Because the reconstruction is only as good as the runs, the FAVOR II Europe-Japan investigators specified how to acquire them.",
        },
        {
          kind: "steps",
          title: "Acquiring runs that can be analysed (FAVOR II Europe-Japan protocol)",
          items: [
            { title: "Nitrate", detail: "Intracoronary nitroglycerin 100–200 µg was given after the first projection (typical dose; follow local protocol)." },
            { title: "Two projections of each lesion", detail: "Chosen for minimal foreshortening and minimal overlap, with the whole vessel visible as far as the point of interest." },
            { title: "Frame rate", detail: "At least 12.5 frames per second." },
            { title: "Injection and table", detail: "Brisk, continuous, fast contrast injections; no zooming and no table movement during the run." },
            { title: "Analysis", detail: "An end-diastolic frame from each projection for the reconstruction; a reference vessel fitted to healthy segments; a run in which contrast movement is clearly seen for the frame count. Every step needs the analyst's judgement." },
          ],
        },
        { kind: "tip", id: "diag-phys-qfr-acquisition" },
        {
          kind: "table",
          caption: "What the QFR trials showed",
          head: ["Trial", "Design", "Main findings"],
          rows: [
            [
              "FAVOR II Europe-Japan (2018)",
              "317 vessels in patients with stable angina or a staged evaluation after myocardial infarction (atrial fibrillation, severe asthma or COPD and infarction within 72 hours excluded); QFR computed during the procedure against wire FFR",
              "Sensitivity 86.5% and specificity 86.9% (2D QCA 44.2% and 76.5%); area under the curve 0.92 against 0.64. Accuracy fell to 71.3% for lesions with FFR 0.75–0.84. Median time to QFR 5.0 minutes against 7.0 for FFR. In a theoretical hybrid analysis that assumed FFR is always correct, treating at QFR 0.77 or less and deferring above 0.87 (0.86 in the paper's discussion) would have kept sensitivity and specificity at 95% or more and avoided the wire in 64% of measurements. Bifurcations with Medina 1.1.1 or 1.0.1 were excluded",
            ],
            [
              "FAVOR III China (2021)",
              "3825 patients randomised to QFR-guided PCI (only if QFR 0.80 or less) or angiography-guided PCI",
              "Major adverse cardiac events at 1 year 5.8% with QFR against 8.8% with angiography (hazard ratio 0.65), driven by fewer myocardial infarctions and ischaemia-driven revascularisations",
            ],
            [
              "FAVOR III Europe (2024)",
              "2000 patients with intermediate stenoses (40–90%) randomised to QFR-guided or FFR-guided strategies",
              "Death, myocardial infarction or unplanned revascularisation at 12 months in 6.7% with QFR against 4.2% with FFR (hazard ratio 1.63); QFR failed to meet non-inferiority. The authors concluded their results do not support QFR when FFR is available to guide revascularisation",
            ],
          ],
        },
        {
          kind: "check",
          stem: "Your centre has pressure wires. QFR computed on the table for a 60% mid-LAD lesion in a stable patient reads 0.79. What is the evidence-based next step?",
          options: [
            "Stent the lesion: QFR is validated at the same 0.80 threshold as FFR",
            "Defer: QFR systematically underestimates FFR, so the true value is above 0.80",
            "Measure with a pressure wire, since the value is near the cut-off and FFR is available",
            "Repeat QFR from a single, more foreshortened projection to confirm the value",
          ],
          answer: 2,
          explanation:
            "In FAVOR II Europe-Japan, agreement fell sharply for values near the threshold (71.3% for FFR 0.75–0.84), and 0.79 lies inside the 0.77–0.87 band in which, even in that study's theoretical hybrid analysis, the wire could not be avoided. FAVOR III Europe found QFR guidance not non-inferior to FFR, and its authors did not support QFR where FFR is available. QFR shows no fixed bias in one direction, and it needs two good projections, not one foreshortened view.",
        },
        {
          kind: "pitfalls",
          items: [
            "Acquiring overlapped or foreshortened runs, or panning the table, and then trusting the reconstruction.",
            "Treating a derived value close to 0.80 as definitive when a wire is available.",
            "Using FFR-CT in stented or grafted patients, in whom it is not validated.",
            "Reading CT in a heavily calcified system (calcium score above 1000) as if it were reliable.",
          ],
        },
        {
          kind: "pearl",
          text: "Acquire every diagnostic angiogram as if someone may want to compute QFR from it: nitrate, two non-overlapping views of each intermediate lesion, brisk injections, no panning or zooming. It may add a little time, but it keeps the wire-free option open.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "For a mid-LAD lesion, choose two projections that show it without foreshortening or overlap by a side branch, as you would for an angiography-derived FFR analysis, and say why a panned run cannot be used.",
        },
        { kind: "video", id: "6DArgI6Kilc", note: "Brilakis case 168 from the Manual of PCI: PCI guided by CT and angiography-derived FFR." },
        {
          kind: "keypoints",
          items: [
            "CT: high sensitivity and negative predictive value, lower specificity; worse with high calcium (above 1000), high heart rate, high BMI and previous small or thick-strut stents.",
            "FFR-CT raised specificity over CT anatomy (NXT) and cut the share of invasive angiograms finding no obstructive disease (PLATFORM: 12% against 73%); it is not validated with stents or grafts.",
            "QFR: 3D reconstruction from two projections plus contrast frame count; no wire, no adenosine; same 0.80 threshold.",
            "Acquisition: nitrate, two views with minimal foreshortening and overlap, at least 12.5 frames/s, brisk injections, no panning or zooming.",
            "QFR beat angiographic guidance (FAVOR III China) but was not non-inferior to FFR guidance (FAVOR III Europe).",
            "Near the threshold, or when a wire is available, measure with the wire.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-physiology-microvascular",
      title: "Beyond the epicardial artery: CFR, IMR and acetylcholine testing",
      minutes: 18,
      topics: ["phy-microvascular"],
      sources: [
        O("ch 8: Pressure wire"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 6: Use of nitrates"),
        O("ch 6: Common pitfalls"),
        B("12.3"),
        B("3.7"),
      ],
      refs: [
        "oxford-cath-handbook",
        "brilakis-manual-pci",
        "perera-bhf-cmd-2023",
        "ford-cormica-review-2019",
        "cormica-2018",
        "ong-covadis-mva-2018",
        "beltrame-covadis-vsa-2017",
        "esc-ccs-2024",
        "reynolds-inoca-esc-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Many patients sent for angiography with angina have no obstructive disease, and 'normal coronaries' is not a diagnosis. The UK consensus on coronary microvascular dysfunction states that nearly half of patients with angina have non-obstructive arteries (ANOCA), and that about two-thirds of these have microvascular disease. The angina may come from a microcirculation that cannot dilate, from vessels that constrict, or from both, and the lab visit is the chance to tell which.",
        },
        {
          kind: "p",
          text: "**What the manuals give you.** Oxford reminds you that pressure stands in for flow only when microvascular resistance is low, so FFR is designed to judge the epicardial artery, not the microcirculation. Brilakis warns that microcirculatory dysfunction is why physiology fails in infarct culprits. On vasomotion, Oxford (MINOCA) teaches that severe spasm can almost occlude an artery and cause infarction or sudden death; that it often arises where there is mild plaque but can occur in entirely normal arteries after vasoactive substances such as cocaine, adrenaline or chemotherapy drugs; that patients with spasm do not always have the traditional risk factors; that the diagnosis can be confirmed by provocation with intracoronary ergonovine or acetylcholine; and that calcium-channel blockers are first-line treatment. It also notes (angiography pitfalls) that ergonovine provocation is now rarely performed because intractable spasm can cause infarction. The rest of this lesson follows the UK consensus standard operating procedure and the CorMicA authors' practical review; the MINOCA work-up itself is taught in cp-acs-thrombus.",
        },
        { kind: "h", text: "What is measured" },
        {
          kind: "table",
          head: ["Index", "How", "Abnormal"],
          rows: [
            [
              "FFR or a resting ratio",
              "Pressure wire, as for any lesion",
              "FFR 0.80 or less, or a non-hyperaemic ratio 0.89 or less, means an epicardial lesion: the patient does not have non-obstructive disease",
            ],
            [
              "Coronary flow reserve (CFR)",
              "Hyperaemic flow ÷ resting flow. Thermodilution: resting mean transit time ÷ hyperaemic mean transit time. Doppler: hyperaemic ÷ resting average peak velocity",
              "UK consensus: below 2.5. CorMicA: below 2.0. COVADIS allows 2.0 or 2.5",
            ],
            [
              "Index of microcirculatory resistance (IMR)",
              "Distal pressure × hyperaemic mean transit time",
              "25 or more (CorMicA)",
            ],
            [
              "Hyperaemic microvascular resistance (HMR)",
              "Doppler: hyperaemic distal pressure ÷ hyperaemic average peak velocity",
              "2.5 mmHg/cm/s or more (CorMicA review)",
            ],
            [
              "Acetylcholine flow reserve (AChFR)",
              "Doppler flow during an acetylcholine infusion ÷ resting flow, with vessel diameter by QCA",
              "1.5 or less suggests endothelial dysfunction; below 1.0 with no change in epicardial diameter shows microvascular spasm",
            ],
          ],
        },
        {
          kind: "p",
          text: "**The thresholds differ.** The UK consensus uses a CFR cut-off of 2.5 because patients with CFR 2.0–2.5 behaved like those below 2.0 and 2.5 best predicted ischaemia; CorMicA used 2.0. Know which your centre reports.",
        },
        { kind: "h", text: "The protocol, step by step (UK consensus and CorMicA practice)" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Select the patient",
              detail:
                "Reserve testing for patients likely to have coronary vascular dysfunction: risk factors, typical angina despite optimal medical therapy, with or without ischaemia on stress imaging, and no obstructive epicardial disease.",
            },
            {
              title: "2. Access, vessel and heparin",
              detail:
                "Radial access is preferred. Test the LAD (it subtends the most myocardium); if that is not possible, the circumflex, then the RCA. Give heparin 70–100 U/kg to an ACT of about 250 seconds before the wire goes in (UK consensus; the CorMicA review uses 50–70 U/kg). Typical doses; follow local protocol.",
            },
            {
              title: "3. No obstructive disease on the angiogram",
              detail:
                "The test begins once the angiogram shows no obstructive epicardial disease. The pressure measurements below then confirm it: FFR above 0.80, or a non-hyperaemic ratio above 0.89. If the wire shows an ischaemic value, the patient has epicardial disease, not ANOCA, and the lesion is managed as in the earlier lessons.",
            },
            {
              title: "4. Low-dose nitrate, before any reading",
              detail:
                "Give intracoronary GTN, at most 200 µg, before any measurement is taken. Its half-life is about 2 minutes (only about 3% remains active after 10 minutes), so it should not mask spasm later in the test. A radial intra-arterial nitrate to prevent radial spasm is acceptable for the same reason: it is short-acting and unlikely to affect the results (UK consensus).",
            },
            {
              title: "5. Resting thermodilution",
              detail:
                "Equalise with the sensor at the guide tip, then park it at least 5 cm into the vessel with a stable trace, free of whip and damping, and keep it there for the whole study. The guide must be engaged but not plugging the left main, particularly during hyperaemia. Inject 3–4 mL of room-temperature saline briskly from a 5 mL syringe, with the same volume and force each time, until three transit times lie within 10% of each other; their mean is the resting value. The resting Pd/Pa is available at this point too.",
            },
            {
              title: "6. Hyperaemia, then hyperaemic thermodilution",
              detail:
                "Start IV adenosine at 140 µg/kg/min. Confirm that hyperaemia is real before measuring: the patient feels the systemic effects of the drug, the distal pressure waveform ventricularises and loses its dicrotic notch, and the mean aortic and distal pressures separate (with a Doppler wire, the average peak velocity also rises). Then repeat the three injections until they agree within 10%. The console gives CFR, IMR and FFR together, and this is where FFR above 0.80 confirms that the epicardial artery is not the problem. The UK consensus also allows intracoronary adenosine boluses instead, at the highest dose tolerated without AV block, usually 60–120 µg into the left coronary and 30–60 µg into the RCA (typical doses; follow local protocol).",
            },
            {
              title: "7. Drift check",
              detail:
                "Pull the sensor back to the ostium and compare it with the guide pressure. The UK protocol re-equalises and repeats the measurements when the drift is 0.03 or more; for a stenosis FFR study, Brilakis uses the stricter 0.98–1.02 window taught in the pullback lesson.",
            },
            {
              title: "8. Acetylcholine last",
              detail:
                "Adenosine before acetylcholine: after acetylcholine, especially a positive spasm test, the resting flow and CFR may be inaccurate (CorMicA review).",
            },
          ],
        },
        { kind: "tip", id: "pci-phys-thermodilution-boluses" },
        {
          kind: "check",
          stem: "A 54-year-old woman has typical exertional angina despite bisoprolol and amlodipine; angiography shows only mild irregularities. LAD FFR is 0.90, thermodilution CFR 1.7 and IMR 34. How should this be classified so far?",
          options: [
            "Obstructive epicardial disease that has been underestimated, needing PCI",
            "Microvascular angina from impaired dilatation and high microvascular resistance",
            "Vasospastic angina, because the CFR is low and the patient is a woman",
            "A normal study, so the chest pain should be labelled non-cardiac",
          ],
          answer: 1,
          explanation:
            "FFR above 0.80 rules out a flow-limiting epicardial lesion. CFR 1.7 is abnormal by either cut-off (below 2.0 or 2.5) and IMR 34 is above 25; either of these on its own is enough to establish microvascular dysfunction, and here both are abnormal, so this is microvascular angina with impaired dilatation and high resistance. Vasospastic angina is diagnosed only by acetylcholine provocation, which has not yet been done and which is still worth doing, since spasm can coexist.",
        },
        { kind: "h", text: "Acetylcholine provocation" },
        {
          kind: "p",
          text: "In healthy endothelium acetylcholine releases nitric oxide and the vessel dilates; with endothelial dysfunction, or at high doses, it acts on the smooth muscle and the vessel constricts, which can provoke epicardial or microvascular spasm (CorMicA review). Protocols vary widely, and the dose and speed matter: a 20-second bolus provokes spasm more readily than a 3-minute infusion of the same dose, and 200 µg causes multivessel spasm more often than 100 µg (UK consensus).",
        },
        {
          kind: "list",
          items: [
            "**When to add a spasm bolus.** The UK consensus suggests bolus provocation when the pre-test probability of vasospasm is high, for example a patient whose angina comes both on exertion and at rest.",
            "**Watching the pressure.** An infusion through the guide interrupts the aortic pressure recording for as long as it runs, so follow the distal pressure (and flow, with a Doppler wire), the ECG and the symptoms. The alternative is to infuse through a microcatheter sited in the mid vessel with the sensor just beyond its tip, which keeps the aortic trace throughout.",
            "**Imaging for QCA.** Take cine runs before and after acetylcholine in two projections at least 30° apart, and measure in the view with the least foreshortening.",
            "**Dose matters.** The optimal dose and rate are uncertain, and past some threshold acetylcholine can provoke spasm in almost anyone: one prospective registry the consensus cites found spasm in 97%. A positive result is read together with the patient's own symptoms and ECG.",
          ],
        },
        {
          kind: "table",
          caption: "Acetylcholine regimens in use (typical; follow local protocol)",
          head: ["Purpose", "Regimen"],
          rows: [
            [
              "Spasm provocation, UK consensus",
              "100 µg into the left coronary over 20 seconds (5.5 mL of an 18.2 µg/mL solution); if the left system cannot be used, 50 µg into the RCA (2.75 mL). Two orthogonal views before and after",
            ],
            [
              "Spasm provocation, Japanese practice (CorMicA review)",
              "Sequential 20-second boluses through the guide: 20, 50, 100 and up to 200 µg into the left system, or 20, 50 and 80 µg into the RCA, with up to 3 minutes between doses; angiography when ST changes or pain appear, or 1 minute after each injection",
            ],
            [
              "Endothelial function (needs Doppler flow)",
              "Infusion at 1 mL/min for 2 minutes of each of 0.182, 1.82 and 18.2 µg/mL, or 18.2 µg/mL at 1 then 2 mL/min; halve the rate or dose in the RCA",
            ],
          ],
        },
        {
          kind: "table",
          caption: "Reading the response (COVADIS criteria as applied in CorMicA)",
          head: ["Finding", "Diagnosis"],
          rows: [
            ["The usual chest pain, ischaemic ECG changes and epicardial constriction of 90% or more", "Epicardial vasospasm (vasospastic angina)"],
            ["The usual chest pain and ischaemic ECG changes without 90% epicardial constriction", "Microvascular spasm, a functional form of microvascular angina"],
            ["Luminal constriction of 20% or more during the infusion", "Severe epicardial endothelial dysfunction"],
            ["FFR above 0.80, CFR and IMR normal and no acetylcholine response", "Non-cardiac chest pain"],
          ],
        },
        {
          kind: "steps",
          title: "Safety during acetylcholine",
          items: [
            { title: "Before", detail: "Pads and ECG leads attached first, and the team warned that pacing, though seldom needed, may be required." },
            { title: "Dose in the RCA", detail: "Halve infusion rates or doses in the RCA; bradycardia is common and usually self-limiting, and a lower RCA dose (at most 50–80 µg) may reduce it." },
            { title: "AV block", detail: "Slow or stop the infusion; IV atropine and transcutaneous pacing are the back-up." },
            { title: "Spasm", detail: "Intracoronary nitrate relieves it quickly; if nitrate fails, intracoronary atropine reverses acetylcholine's effect." },
            { title: "After the infusion", detail: "Aspirate the acetylcholine left in the guide with a syringe before flushing, so that no accidental bolus is given." },
          ],
        },
        { kind: "tip", id: "pci-phys-ach-prepare" },
        { kind: "tip", id: "pci-phys-ach-block" },
        { kind: "tip", id: "pci-phys-ach-spasm" },
        {
          kind: "check",
          stem: "After 100 µg of acetylcholine into the left coronary over 20 seconds, the patient says 'that's my pain', the ECG shows ST elevation in V2–V4 and the LAD is 95% narrowed along its mid segment. What is the diagnosis and the immediate action?",
          options: [
            "Microvascular spasm; continue to the 200 µg dose to confirm it",
            "Epicardial vasospasm; give intracoronary nitrate now, with atropine if it fails",
            "Endothelial dysfunction only; no treatment is needed during the test",
            "An acute plaque rupture; proceed to PCI of the mid LAD",
          ],
          answer: 1,
          explanation:
            "Reproduced usual pain, ischaemic ECG changes and epicardial constriction of 90% or more meet the criteria for epicardial vasospasm. Relieve it straight away with intracoronary nitrate, and use intracoronary atropine if nitrate does not work. Microvascular spasm requires the absence of significant epicardial constriction; a further, larger dose is not needed once the test is positive; and the pre-test angiogram showed no culprit lesion to stent.",
        },
        { kind: "h", text: "Endotype, then treatment" },
        {
          kind: "table",
          caption: "Treatment by endotype as described in the CorMicA review (doses there are examples; follow current guidelines)",
          head: ["Endotype", "Treatment direction"],
          rows: [
            [
              "Microvascular angina with impaired dilatation (low CFR, high IMR)",
              "Beta-blockers first (as the ESC guidance it cites recommends), calcium-channel blockers if beta-blockers fail or are not tolerated, and a dihydropyridine calcium-channel blocker can be added to a beta-blocker if blood pressure allows; ACE inhibitors and statins; ranolazine (in a WISE trial, patients with CFR below 2.5 had better perfusion and fewer angina episodes on it); nicorandil and ivabradine as further options; long-acting nitrates appear ineffective or even harmful",
            ],
            [
              "Microvascular angina from abnormal pain processing",
              "Tricyclic antidepressants or a xanthine such as aminophylline, aimed at heightened pain perception",
            ],
            ["Microvascular angina with excess constriction (microvascular spasm)", "Calcium-channel blockers; ACE inhibitors, nicorandil and statins are also listed"],
            [
              "Vasospastic angina",
              "Calcium-channel blockers (effective in more than 90%), with nitrates; beta-blockers are relatively contraindicated",
            ],
            ["Mixed", "Both pathways"],
            [
              "Refractory vasospasm (about 10%)",
              "Large doses of calcium-channel blockers or nitrates; the review also mentions clonidine in selected patients and nicorandil when nitrates are poorly tolerated, and advises reconsidering the diagnosis",
            ],
            ["All endotypes", "Lifestyle and risk-factor measures: stopping smoking, exercise, cardiac rehabilitation, a Mediterranean diet and, where needed, cognitive behavioural therapy"],
            ["Non-cardiac", "Reassure and look for other causes"],
          ],
        },
        {
          kind: "p",
          text: "**The evidence.** In CorMicA, 151 patients without obstructive disease were randomised during their angiogram to a full interventional diagnostic procedure (CFR, IMR, FFR and acetylcholine testing) with therapy matched to the result, or to a sham procedure with standard care. Stratified therapy improved the Seattle Angina Questionnaire summary score by 11.7 units at 6 months and improved quality of life, with no difference in major adverse cardiac events (2.6% in both groups). The procedure found isolated microvascular angina in 52%, isolated vasospastic angina in 17%, both in 20% and non-cardiac pain in 11%, and after disclosure over half of the treating clinicians changed their diagnosis. The UK consensus cited the ESC recommendation then current, class IIa. The 2024 ESC chronic coronary syndromes guideline goes further: a new class I recommendation that invasive coronary function testing be available at the initial angiogram when the mechanism of chest pain remains uncertain after non-invasive testing, and for patients with established ANOCA or INOCA whose symptoms and quality of life stay poor despite medical therapy.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling the arteries normal and the pain non-cardiac without testing the microcirculation and vasomotion.",
            "Giving a large dose of a long-acting nitrate before acetylcholine; the protocol uses low-dose GTN (200 µg or less) for its short half-life.",
            "Doing acetylcholine before the adenosine measurements, which can distort resting flow and CFR.",
            "Scattered thermodilution curves from inconsistent saline injections, or a guide plugging the left main.",
            "Flushing the guide after an acetylcholine infusion without aspirating it first.",
            "Starting a beta-blocker in confirmed vasospastic angina.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask during each acetylcholine dose whether the pain is the patient's usual pain, and record ECG, symptom and angiographic response together. All three are criteria, and missing one turns a diagnosis into a guess.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the 'Angina with no obstructive coronary disease' scenario, give low-dose intracoronary nitrate, then resting thermodilution, then IV adenosine with hyperaemic thermodilution (three injections each within 10%), read CFR, IMR and FFR, check drift, and classify the microvascular endotype before any acetylcholine.",
        },
        { kind: "video", id: "khoa3Fd8hqg", note: "Elias Hanna on stable coronary disease: questions, summary and INOCA." },
        {
          kind: "keypoints",
          items: [
            "FFR judges the epicardial artery; CFR and IMR judge the whole circulation and the microcirculation.",
            "CFR = resting Tmn ÷ hyperaemic Tmn (abnormal below 2.5 in the UK consensus, below 2.0 in CorMicA); IMR = Pd × hyperaemic Tmn (abnormal 25 or more).",
            "Sequence: no obstruction on the angiogram, low-dose GTN (200 µg or less) before any reading, resting thermodilution, IV adenosine 140 µg/kg/min giving hyperaemic Tmn, CFR, IMR and FFR (confirm FFR above 0.80), drift check, acetylcholine last.",
            "Spasm provocation: 100 µg ACh into the left coronary over 20 s (50 µg into the RCA); pain + ischaemic ECG + 90% or more constriction = epicardial spasm; without the constriction = microvascular spasm.",
            "Safety: pads on, pacing available, lower RCA doses, nitrate for spasm (atropine if it fails), aspirate the guide afterwards.",
            "Ergonovine provocation is now rarely used (Oxford).",
            "CorMicA: endotype-matched therapy improved angina and quality of life.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-physiology-q1",
      stem: "Where should the pressure-wire sensor be when you equalise Pd with Pa?",
      options: [
        "With the proximal end of the radiopaque segment at the guide tip",
        "With the distal tip of the wire just at the end of the guide catheter",
        "In the proximal vessel, a few millimetres beyond the coronary ostium",
        "Inside the guide catheter, about 3 cm short of the guide's tip",
      ],
      answer: 0,
      explanation:
        "The sensor lies about 3 cm from the tip, where the radiopaque tip meets the shaft, so Brilakis advances the wire until the proximal end of the radiopaque segment is at the guide tip; the drift check later uses the same landmark. With only the wire tip at the guide end, the sensor is still inside the guide; a sensor in the vessel is too deep, which is one of his causes of failed equalisation.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-physiology-q2",
      stem: "Which statement about resting indices is supported by Brilakis's chapter?",
      options: [
        "All resting indices have equal outcome-trial validation and share a 0.89 cut-off",
        "Resting indices are less affected by drift than FFR because no drug is given",
        "Whole-cycle resting Pd/Pa uses 0.91; only iFR has outcome-trial validation",
        "When resting and hyperaemic indices disagree, the hyperaemic value always wins",
      ],
      answer: 2,
      explanation:
        "His Table 12.1 gives resting Pd/Pa 0.91 or less and iFR, dPR, dFR and RFR 0.89 or less; the indices correlate strongly, but only iFR has clinical trial validation. Resting indices are much more affected by drift than hyperaemic ones, and when the two disagree (about 14%) he bases the decision on the clinical presentation, not automatically on FFR.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q3",
      stem: "During an FFR study you give 200 µg of adenosine into the left main, then flush. Pd/Pa reaches 0.83 during the first few beats while the guide trace is still distorted by the injection, then settles at 0.86 once the trace recovers. Which value do you record?",
      options: [
        "0.83, because the lowest Pd/Pa after an intracoronary bolus is always the FFR",
        "0.86, but only after confirming a fall in blood pressure of about 10 mmHg",
        "Neither, because intracoronary adenosine cannot be used in the left main",
        "The lowest clean value once the guide trace has recovered; repeat if in doubt",
      ],
      answer: 3,
      explanation:
        "Brilakis takes the lowest Pd/Pa after an intracoronary bolus as the FFR, but lists measuring before the guide trace has returned to baseline as an artefact: inspect the tracings, and repeat the adenosine if the reading is not clean. The blood-pressure and heart-rate surrogate belongs to the IV infusion. 200 µg is his intracoronary left main dose.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q4",
      stem: "An IV adenosine FFR of 0.84 is recorded at 3 minutes. The systolic pressure and heart rate never changed, the patient felt nothing, and the cannula is in a swollen hand. Which cause of failed hyperaemia is most likely?",
      options: [
        "Infiltration of the IV line, so the adenosine never reached the circulation",
        "Recent caffeine, because coffee always abolishes every adenosine response",
        "A guide disengaged before the infusion, which removes the hyperaemic effect",
        "Too high a dose, which paradoxically constricts the microcirculation",
      ],
      answer: 0,
      explanation:
        "Brilakis lists an IV line that is not working, for example through infiltration, among the causes of failed vasodilation, and a swollen hand with no systemic response points to it. He gives IV adenosine through a central or large peripheral vein (section 3.2); a hand-vein cannula is a poor choice and easily infiltrates. Caffeine is another cause but there is no history and nothing absolute about it; guide position matters for intracoronary, not intravenous, adenosine; and an excessive dose is not one of his causes.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q5",
      stem: "An FFR pullback ends with the radiopaque segment at the guide tip reading Pd/Pa 1.04. The distal FFR had been 0.79. What is the correct action?",
      options: [
        "Accept 0.79 because drift above 1.0 only makes the FFR appear better",
        "Re-equalise and repeat the crossing, measurement and pullback (steps 4–7)",
        "Subtract 0.04 from the FFR and treat the lesion as clearly significant",
        "Proceed to PCI, since any drift makes the lesion more likely to be significant",
      ],
      answer: 1,
      explanation:
        "Brilakis defines significant drift as Pd/Pa above 1.02 or below 0.98 at the guide tip, and his response is to re-equalise and repeat steps 4 to 7. The size and direction of drift over time cannot be trusted for arithmetic correction, and his own example shows a drifted 0.78 becoming 0.85 after re-equalisation.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q6",
      stem: "A resting iFR pullback before PCI shows a distal value of 0.70 with a single large drop of 0.20 over a 20 mm segment and a small gradual decline elsewhere. What can this pullback tell you that a single distal FFR cannot?",
      options: [
        "Nothing more, because resting pullbacks cannot be used in serial or diffuse disease",
        "The final FFR after PCI, because resting and hyperaemic values are interchangeable",
        "The expected value after treating that segment, acting as a virtual intervention",
        "The microvascular resistance of the territory, from the slope of the decline",
      ],
      answer: 2,
      explanation:
        "Brilakis notes that an iFR pullback before angioplasty provides a virtual intervention, predicting the haemodynamic result of treating serial or diffuse lesions, and co-registration can map the drop onto the angiogram; here treating the 20 mm segment would be predicted to restore about 0.20. With FFR, by contrast, serial lesions interact and the biggest step is treated first before re-measuring. A pressure pullback does not measure microvascular resistance.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q7",
      stem: "Why does Brilakis recommend against physiological assessment of an intermediate saphenous vein graft lesion?",
      options: [
        "Adenosine is ineffective in vein grafts because they lack a microcirculation",
        "The graft cannot be engaged coaxially enough to give an undamped guide pressure",
        "Competitive native and collateral flow can mask it, and graft lesions progress fast",
        "The pressure wire cannot be advanced safely across a degenerated graft lesion",
      ],
      answer: 2,
      explanation:
        "The graft FFR reflects graft, native and collateral flow, so a severe graft lesion can read normal when the native artery competes; and deferral is justified in native arteries by the slow progression of non-significant lesions, which does not hold for grafts, whose intermediate lesions progress quickly. Engagement and wire passage are practical issues, not his reasons.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q8",
      stem: "An intermediate left main stenosis coexists with a severe proximal LAD lesion. The circumflex pullback shows FFR 0.85 with a small step in the left main. Which interpretation is correct?",
      options: [
        "The left main is clearly not significant, because 0.85 is above the threshold",
        "The circumflex value is falsely low because the LAD lesion steals its flow",
        "The left main can only ever be judged from the LAD, never from the circumflex",
        "The LAD lesion limits flow through the left main, so this may understate it",
      ],
      answer: 3,
      explanation:
        "Brilakis warns that a downstream stenosis in the LAD or circumflex lowers the maximum achievable flow through the left main, so the distal pressure is higher and the left main's severity is underestimated. Both branches should be measured with pullback, and imaging (IVUS or OCT area) is an alternative in the left main. There is no 'steal' that lowers the circumflex value.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q9",
      stem: "After a mid-RCA stent, FFR is 0.78. The pullback shows a 0.12 step confined to the stented segment. Which action follows Brilakis's algorithm?",
      options: [
        "Post-dilate the stent, or add a stent, because the loss is within the stent",
        "No further treatment, because residual post-PCI ischaemia is always diffuse",
        "Stent the distal RCA, because a low post-PCI FFR means distal disease",
        "Measure a resting index instead, because FFR after stenting is unreliable",
      ],
      answer: 0,
      explanation:
        "For a post-PCI FFR of 0.80 or less, Brilakis pulls back through the stent: a loss inside the stent means post-dilatation or another stent; a focal loss outside means a stent; a diffuse loss outside means no further treatment. Underexpansion and undersizing are among his listed causes of a poor post-PCI FFR.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-physiology-q10",
      stem: "What did FAVOR III Europe show about the quantitative flow ratio (QFR)?",
      options: [
        "QFR guidance reduced events compared with angiographic guidance alone",
        "QFR guidance was non-inferior to FFR guidance at 12 months",
        "QFR guidance missed non-inferiority to FFR, with more events at 12 months",
        "QFR was more accurate than FFR in lesions with values between 0.75 and 0.84",
      ],
      answer: 2,
      explanation:
        "In 2000 patients with intermediate stenoses, the composite of death, myocardial infarction or unplanned revascularisation occurred in 6.7% with QFR against 4.2% with FFR (hazard ratio 1.63), and non-inferiority was not met. The improvement over angiographic guidance comes from FAVOR III China, a different comparison, and FAVOR II Europe-Japan found QFR agreement poorest for FFR values of 0.75–0.84.",
      difficulty: 3,
      refs: ["favor3-europe-2024", "favor3-china-2021", "westra-favor2-2018"],
    },
    {
      id: "pm-physiology-q11",
      stem: "In invasive coronary function testing, why is a low dose of intracoronary GTN (200 µg or less) given before the readings, and acetylcholine left until after the adenosine measurements?",
      options: [
        "GTN is short-acting so it will not mask spasm later, and acetylcholine first can distort resting flow and CFR",
        "GTN potentiates acetylcholine, and adenosine after acetylcholine would cause complete heart block",
        "GTN is needed to dilate the microcirculation fully, and acetylcholine first would lower the FFR",
        "GTN prevents adenosine bronchospasm, and acetylcholine first would make the IMR falsely low",
      ],
      answer: 0,
      explanation:
        "The UK consensus and the CorMicA review give low-dose GTN because its half-life is about 2 minutes (about 3% active at 10 minutes), so it should not cause a false-negative spasm test, and they do the adenosine measurements first because after acetylcholine, particularly a positive test, resting flow and CFR may be inaccurate. The other options invent interactions the sources do not describe.",
      difficulty: 3,
      refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019"],
    },
    {
      id: "pm-physiology-q12",
      stem: "During an acetylcholine infusion into the RCA for endothelial testing, the patient develops 2:1 AV block. What does the UK consensus advise?",
      options: [
        "Continue at the same rate, because AV block confirms a positive spasm test",
        "Give intracoronary adenosine to restore conduction, then continue the infusion",
        "Slow the infusion or switch it off; atropine IV and an external pacing set-up are the fall-backs",
        "Stop the test permanently and arrange a permanent pacemaker before discharge",
      ],
      answer: 2,
      explanation:
        "Bradycardia during acetylcholine is common and usually self-limiting (CorMicA review), but high-grade AV block needing pacing is rare. The UK consensus answer is to slow the infusion or switch it off, with atropine IV and an external pacing set-up as the fall-backs. The RCA rate or dose should already have been halved. AV block is not a diagnostic criterion, adenosine would worsen it, and transient drug-induced block is not an indication for a permanent device.",
      difficulty: 2,
      refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019"],
    },
  ],
  sims: [
    { sim: "physiology", task: "Complete an FFR study in the 'Intermediate mid-LAD lesion' scenario: zero, introduce, remove the introducer, flush, equalise at the guide tip, cross, record the resting index, give IV adenosine and confirm the haemodynamic response, read FFR, pull back and check drift." },
    { sim: "physiology", task: "Work through the two pitfall scenarios: disengage a deeply seated guide during hyperaemia, and re-equalise and repeat when the guide-tip Pd/Pa falls outside 0.98–1.02." },
    { sim: "physiology", task: "In the 'Tandem LAD lesions' and 'Diffusely diseased LAD' scenarios, read the pullback, treat the biggest step first and re-measure, and recognise diffuse disease that stenting will not fix." },
    { sim: "physiology", task: "In the 'Angina with no obstructive coronary disease' scenario, measure FFR, CFR and IMR by thermodilution and assign the endotype before acetylcholine testing." },
  ],
  caseIds: ["pm-physiology-case-lad", "pm-physiology-case-anoca"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-physiology-case-lad",
    title: "Two LAD lesions and a pressure wire",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 1.12, 12.1, 12.2, 3.2 and 7.4; Oxford Handbook, chapter 8 (Pressure wire)",
    },
    summary:
      "A stable patient with two intermediate LAD lesions: planning, equalisation, failed hyperaemia, a damped guide, a serial pullback, the drift check and a disappointing post-PCI FFR.",
    presentation:
      "A 63-year-old man has exertional chest tightness that he describes vaguely; he has had no stress test. He has type 2 diabetes and hypertension and takes aspirin, atorvastatin, ramipril and metformin. Radial angiography shows a 55% proximal LAD stenosis and a 65% mid-LAD stenosis beyond the first diagonal; the circumflex and RCA have mild disease. He is on the table with a 6 Fr EBU 3.5 guide engaged and heparin given.",
    findings: [
      "Blood pressure 142/78 mmHg, sinus rhythm 68/min",
      "Undamped guide pressure with a clear dicrotic notch",
      "No asthma, no dipyridamole; he had two cups of coffee this morning",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The attending asks how you will decide about the two LAD lesions.",
        options: [
          {
            text: "Physiology of the LAD: start with a resting index (he has had coffee), and use IV adenosine only if needed with its response checked",
            best: true,
            feedback:
              "With equivocal symptoms and no ischaemia test, Brilakis recommends physiology. Caffeine blunts adenosine, so a resting index avoids the problem; if FFR is still needed, the haemodynamic response tells you whether hyperaemia was real.",
          },
          {
            text: "Stent both lesions: together they must be significant",
            next: "c-stent-both",
            feedback: "Neither lesion is 90% or more, and serial lesions cannot be judged by eye; that is what physiology is for.",
            stateDelta: { stability: -10, flags: ["stented-on-appearance"] },
          },
          {
            text: "Measure FFR with intracoronary adenosine, aware that the coffee may blunt it",
            acceptable: true,
            feedback:
              "Possible, but recent caffeine is one of Brilakis's causes of failed hyperaemia, and his prevention is a patient who has had none; if you choose FFR now, be ready to doubt a normal value.",
          },
        ],
      },
      {
        id: "c-stent-both",
        kind: "consequence",
        prompt: "The attending stops you before the balloon is prepared: 'Two intermediate lesions, no ischaemia test, and you want two stents?' What now?",
        options: [
          {
            text: "Agree, and measure the LAD with a pressure wire before deciding",
            best: true,
            feedback: "Serial intermediate lesions are exactly where the pullback shows which, if either, needs treatment.",
          },
          {
            text: "Insist: the patient has diabetes and will need stents eventually",
            feedback:
              "Diabetes does not make a lesion significant, and FAME-style guidance treats fewer lesions with better outcomes. The attending overrules you and asks for the wire.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The wire is zeroed outside the body and advanced until the proximal end of its radiopaque segment is at the guide tip. Before equalising, the aortic trace looks flattened and the Pd and Pa waveforms do not overlap. What do you check?",
        variants: [{ flag: "stented-on-appearance", info: "The balloon has been put away and the pressure wire opened instead." }],
        options: [
          {
            text: "Remove the introducer still sitting in the valve, flush the guide with saline, then equalise",
            best: true,
            feedback: "Introducer left in and guide not flushed are Brilakis's first two causes of failed equalisation.",
          },
          {
            text: "Equalise anyway: the console matches the means and that is enough",
            next: "c-bad-equalisation",
            feedback: "Matched means with mismatched waveforms introduce error into the hyperaemic FFR.",
            stateDelta: { stability: -5, flags: ["poor-equalisation"] },
          },
          {
            text: "Advance the wire further into the vessel to get a better signal, then equalise",
            feedback: "A sensor too deep in the vessel is itself a cause of failed equalisation; the sensor belongs at the guide tip.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-bad-equalisation",
        kind: "consequence",
        prompt: "You cross and record a resting Pd/Pa of 0.84, which the physiologist queries because the two traces never matched at the guide tip. What do you do?",
        options: [
          {
            text: "Pull back to the guide tip, take out the introducer, flush, re-equalise properly and recross",
            best: true,
            feedback: "Fix the cause, then repeat; the earlier value is not usable.",
          },
          {
            text: "Accept 0.84 and move on to hyperaemia",
            feedback: "Every later value inherits the error. The physiologist refuses to record it until the study is repeated.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Properly equalised, the wire is in the distal LAD. Resting iFR is 0.87, below the 0.89 cut-off. To find out which of the two lesions accounts for the loss you plan a hyperaemic pullback, and start IV adenosine at 140 µg/kg/min through a small cannula on the back of the forearm. At 2 minutes the blood pressure and heart rate are unchanged and the distal FFR reads 0.83. What next?",
        options: [
          {
            text: "Check the cannula; re-site the infusion in a large (antecubital) or central vein, and meanwhile check the distal value with intracoronary adenosine 200 µg, guide engaged, then flush",
            best: true,
            feedback:
              "No haemodynamic response means hyperaemia is doubtful (tissued line, caffeine, low dose). Brilakis gives IV adenosine through a central or large peripheral vein, which the pullback needs; an intracoronary bolus, given with the guide engaged and flushed in, gives a spot value in the meantime.",
          },
          {
            text: "Accept the FFR of 0.83 as the deciding value, and defer PCI",
            next: "c-false-deferral",
            feedback: "The iFR of 0.87 is already ischaemic, and the FFR was read with no sign of hyperaemia, so it may be falsely high. Neither value supports deferral.",
            stateDelta: { stability: -10, flags: ["deferred-on-doubtful-ffr"] },
          },
          {
            text: "Give papaverine 12 mg into the left main instead",
            feedback: "Papaverine is usually avoided because of ventricular arrhythmias; there are safer ways to achieve hyperaemia.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-false-deferral",
        kind: "consequence",
        prompt: "As you start to withdraw, the nurse notices the forearm cannula site is swollen: the adenosine has been running into the tissues. What do you do?",
        options: [
          {
            text: "Re-site the infusion in a large or central vein, and repeat the FFR and pullback before deciding",
            best: true,
            feedback: "An infiltrated line is one of Brilakis's causes of failed vasodilation; repeat with effective hyperaemia through a suitable vein.",
          },
          {
            text: "Keep the deferral: an FFR above 0.80 settles it whatever the iFR shows",
            feedback:
              "This FFR was never hyperaemic, so it cannot overrule an iFR of 0.87, which is itself ischaemic. Discordance is decided on the clinical picture only when both values are valid. The attending asks you to repeat the study.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "With 200 µg of intracoronary adenosine the Pa trace suddenly loses its notch and ventricularises, and Pd/Pa reads 0.88. The guide has moved deeper into the left main. What do you do?",
        options: [
          {
            text: "Pull the guide back to a coaxial, undamped position and repeat the adenosine and the reading",
            best: true,
            feedback: "A damped guide underestimates the lesion by raising the value; correct it and repeat. The guide must be engaged for intracoronary adenosine but not wedged.",
          },
          {
            text: "Accept 0.88: a value above 0.80 is reassuring whatever the trace",
            next: "c-damped-accepted",
            feedback: "Brilakis inspects the tracings for damping before recording; this value is an artefact.",
            stateDelta: { stability: -10, flags: ["accepted-damped-value"] },
          },
          {
            text: "Disengage the guide fully before giving another intracoronary bolus",
            feedback: "A guide disengaged before an intracoronary dose sends the drug into the aorta, causing failed hyperaemia. Disengage after an intracoronary bolus only for ostial lesions.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-damped-accepted",
        kind: "consequence",
        prompt: "The physiologist points out the ventricularised trace on the recording and asks whether the value can go in the report. What do you say?",
        options: [
          {
            text: "No: reposition the guide and repeat the measurement",
            best: true,
            feedback: "Repeat the adenosine and the reading with a clean trace.",
          },
          {
            text: "Yes, and note 'guide damping' beside it",
            feedback: "A value you know to be falsely high cannot guide a decision. The attending asks for a repeat.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "With the guide coaxial and IV adenosine now running through an antecubital cannula (blood pressure down 12 mmHg, heart rate up 7/min), the FFR pullback reads 0.75 distally, rising to 0.84 across the mid lesion and to 0.97 across the proximal lesion. With the radiopaque segment at the guide tip, Pd/Pa is 0.99. What is your plan?",
        variants: [
          { flag: "poor-equalisation", info: "The equalisation was redone properly before this pullback." },
          { flag: "deferred-on-doubtful-ffr", info: "The repeat measurement with working hyperaemia is the one shown here." },
        ],
        options: [
          {
            text: "Treat the proximal lesion first (the larger step, 0.13), then repeat the FFR before deciding on the mid lesion",
            best: true,
            feedback: "Serial lesions interact; Brilakis treats the biggest gradient first and then re-measures. The drift check (0.99) is within 0.98–1.02, so the values stand.",
          },
          {
            text: "Stent both lesions now, since the distal FFR is 0.75",
            next: "c-both",
            feedback: "The distal value belongs to neither lesion alone; treating one may make the other non-significant.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Treat the mid lesion first, because distal lesions in one artery are generally stented first",
            acceptable: true,
            feedback: "Brilakis does generally stent the more distal lesion first in one artery (7.4), but that is a technical rule for lesions you already know need treatment. Here physiology must first decide which lesion needs a stent: the proximal step is the bigger (0.13 against 0.09), so treat it, then re-measure, because the mid lesion may no longer need anything.",
          },
        ],
      },
      {
        id: "c-both",
        kind: "consequence",
        prompt: "The attending asks: 'If you stent the proximal lesion first, what might happen to the mid lesion's gradient?'",
        options: [
          {
            text: "It may change, so treat the proximal lesion and re-measure before stenting the mid one",
            best: true,
            feedback: "Each lesion limits the maximal flow through the other, so re-measure after treating the larger.",
          },
          {
            text: "Nothing: each lesion's step is fixed regardless of the other",
            feedback: "That is the misconception the pullback rule exists to correct.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "After a 3.5 × 18 mm stent to the proximal LAD, IV adenosine FFR is 0.79. On pullback, Pd/Pa is 0.97 proximal to the stent, there is a step of 0.08 within the stent, then a step of 0.10 at the mid lesion. What next?",
        options: [
          {
            text: "Correct the in-stent loss first (post-dilate with a non-compliant balloon), then re-measure before deciding on the mid lesion",
            best: true,
            feedback: "A loss inside the stent points to under-expansion or undersizing: post-dilate or add a stent (Brilakis Fig 12.1). The two remaining losses still interact, so re-measure before deciding whether the mid lesion needs a stent.",
          },
          {
            text: "Stent the mid lesion, because the final FFR is still below 0.80",
            feedback: "Part of the loss is inside the new stent, which must be corrected first. Each lesion limits flow through the other, so the mid-lesion step will change once the stent is optimised; decide on it after re-measuring.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Accept the result: post-PCI FFR is not used to change management",
            feedback: "Brilakis describes post-PCI FFR as a tool for finding a suboptimal result, with values above 0.91 associated with optimal outcomes.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "After post-dilatation there is no step in the stent. The step at the mid lesion has grown slightly, to 0.11, as more flow now crosses it, but the distal FFR is 0.86, so the mid lesion is left alone, as the serial-lesion rule directs. The final 0.86 is above the ischaemic threshold, though below the value above 0.91 that has been associated with optimal outcomes. The final drift check reads 1.00. He is discharged on dual antiplatelet therapy and his angina improves.",
    outcomeVariants: [
      { flag: "stented-on-appearance", text: "The debrief notes that two stents would have been placed on appearance alone; physiology showed only one was needed." },
      { flag: "accepted-damped-value", text: "The debrief highlights the damped-trace value that nearly led to deferral of a significant lesion." },
    ],
    learningPoints: [
      "Plan physiology when symptoms are equivocal and no test has shown ischaemia; ask about caffeine and adenosine contraindications.",
      "Equalise only with the introducer out, the guide flushed and the sensor at the guide tip, and with the waveforms (not only the means) superimposed.",
      "No fall in pressure and no rise in heart rate during IV adenosine means hyperaemia is doubtful: check the line.",
      "A damped guide makes FFR falsely high; the guide must be engaged for an intracoronary dose but not wedged.",
      "Serial lesions: treat the biggest step first and re-measure; check drift at the guide tip (0.98–1.02). Distal-first is a technical rule for lesions already known to need a stent.",
      "IV adenosine belongs in a central or large peripheral vein; a small cannula that infiltrates gives no hyperaemia.",
      "A low post-PCI FFR with an in-stent step means post-dilate or add a stent.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-physiology-case-anoca",
    title: "Angina with unobstructed arteries",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "UK coronary microvascular dysfunction consensus (Perera 2023) and the CorMicA review (Ford 2019); Oxford Handbook, chapters 5 (MINOCA) and 8 (Pressure wire); Brilakis, Manual of PCI, section 12.2",
    },
    summary:
      "A woman with typical angina and unobstructed arteries: deciding to test, low-dose nitrate, thermodilution technique, interpreting CFR and IMR, acetylcholine provocation, bradycardia and spasm, and matching treatment to the endotype.",
    presentation:
      "A 57-year-old woman with hypertension and hypercholesterolaemia has exertional angina and episodes of chest pain at rest, despite bisoprolol 5 mg and a statin. An exercise test was positive. Radial angiography shows smooth coronary arteries with minor irregularities.",
    findings: [
      "Blood pressure 134/80 mmHg, sinus rhythm 62/min",
      "6 Fr guide in the left coronary, heparin given to an ACT of 260 seconds",
      "Consented in advance for coronary function testing",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The angiogram shows no obstructive disease. What do you do?",
        options: [
          {
            text: "Proceed to coronary function testing of the LAD: FFR, CFR and IMR, then acetylcholine",
            best: true,
            feedback:
              "She fits the UK consensus selection: risk factors and typical angina despite medical therapy with evidence of ischaemia and no obstructive disease.",
          },
          {
            text: "Reassure her that the arteries are normal and stop the bisoprolol",
            next: "c-reassure",
            feedback: "Unobstructed arteries do not exclude microvascular or vasospastic angina.",
            stateDelta: { stability: -10, flags: ["no-diagnosis"] },
          },
          {
            text: "Arrange a CT coronary angiogram to look again",
            feedback: "CT cannot detect microvascular or vasospastic angina; the invasive test is already set up.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-reassure",
        kind: "consequence",
        prompt: "The attending reminds you that in CorMicA most such patients had an identifiable disorder of vasomotion. What now?",
        options: [
          {
            text: "Go back and perform the coronary function test while the guide is in",
            best: true,
            feedback: "In CorMicA, 89% of randomised patients without obstructive disease had microvascular angina, vasospastic angina or both.",
          },
          {
            text: "Discharge her and review in clinic",
            feedback: "False reassurance and stopping therapy are what the UK consensus identifies as drivers of poor outcomes in these patients. The attending asks you to proceed.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Before the measurements, which nitrate do you give?",
        variants: [{ flag: "no-diagnosis", info: "You have returned to the table to complete the test." }],
        options: [
          {
            text: "Intracoronary GTN, 200 µg or less",
            best: true,
            feedback: "Low-dose, short-acting GTN (half-life about 2 minutes) prepares the vessel without masking spasm later.",
          },
          {
            text: "A large dose of isosorbide dinitrate, to make sure the epicardial arteries are fully dilated",
            next: "c-big-nitrate",
            feedback: "A long-acting, large nitrate dose risks a false-negative acetylcholine test.",
            stateDelta: { stability: -5, flags: ["masked-spasm-risk"] },
          },
          {
            text: "No nitrate at all before any measurement",
            acceptable: true,
            feedback: "Possible, but the UK protocol gives low-dose intracoronary GTN before any readings, and its short half-life should not affect the later acetylcholine test.",
          },
        ],
      },
      {
        id: "c-big-nitrate",
        kind: "consequence",
        prompt: "The physiologist asks how long the acetylcholine part should now wait. What is the right response?",
        options: [
          {
            text: "Do the adenosine measurements now and interpret a negative acetylcholine test with caution",
            best: true,
            feedback: "A long-acting nitrate may suppress spasm; a negative result after it is less reassuring.",
          },
          {
            text: "Give acetylcholine straight away to beat the nitrate",
            feedback: "Acetylcholine before the adenosine measurements can distort resting flow and CFR, and the nitrate is still active.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After the GTN, the sensor sits in the mid LAD with a stable trace; the resting Pd/Pa is 0.97. Resting thermodilution gives transit times of 0.82, 0.55 and 1.04 s. What do you do?",
        options: [
          {
            text: "Repeat 3–4 mL brisk injections with the same volume and force until three readings agree within 10%",
            best: true,
            feedback: "Scattered transit times mean inconsistent injections; the UK protocol repeats until three lie within 10%.",
          },
          {
            text: "Average the three values and move on",
            feedback: "An average of inconsistent injections gives an unreliable resting Tmn and so an unreliable CFR.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Push the guide deeper into the left main so the saline reaches the sensor",
            feedback: "The guide should be engaged but not plugging the left main, which confounds the result.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "With consistent injections at rest and then during IV adenosine 140 µg/kg/min (she feels flushed, and the distal waveform has lost its notch), the console gives FFR 0.91, CFR 1.6 and IMR 36; Pd/Pa at the ostium afterwards is 1.01. How do you interpret this, and what next?",
        options: [
          {
            text: "Microvascular angina with impaired dilatation; continue to acetylcholine testing because spasm can coexist",
            best: true,
            feedback: "FFR 0.91 excludes an epicardial cause. A low CFR or an IMR of 25 or more is each enough to establish microvascular dysfunction, and here both are abnormal; in CorMicA 20% had mixed microvascular and vasospastic angina.",
          },
          {
            text: "Microvascular angina; stop here, because the diagnosis is made",
            acceptable: true,
            feedback: "The microvascular diagnosis stands, but she also has rest pain, and coexisting spasm would change treatment.",
          },
          {
            text: "A normal study, because FFR is above 0.80",
            feedback: "FFR judges only the epicardial artery; CFR and IMR are clearly abnormal.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "You give 100 µg of acetylcholine into the left coronary over 20 seconds. The heart rate falls to 38/min with transient AV block. What do you do?",
        variants: [{ flag: "masked-spasm-risk", info: "The large nitrate dose was given about 25 minutes ago." }],
        options: [
          {
            text: "Wait for it to settle (it is usually self-limiting), with IV atropine and transcutaneous pacing ready, pads already on",
            best: true,
            feedback: "Bradycardia with acetylcholine is common and usually self-limiting; pads, atropine and pacing are the back-up.",
          },
          {
            text: "Give intracoronary adenosine to speed recovery",
            feedback: "Adenosine itself causes AV block.",
            stateDelta: { stability: -15 },
          },
          {
            text: "Flush the guide with saline immediately to clear the acetylcholine",
            next: "c-flush",
            feedback: "Flushing pushes whatever acetylcholine remains in the guide into the artery as a further bolus.",
            stateDelta: { stability: -10, flags: ["ach-flushed"] },
          },
        ],
      },
      {
        id: "c-flush",
        kind: "consequence",
        prompt: "After the flush the bradycardia deepens briefly before recovering. How should acetylcholine be cleared from the guide in future?",
        options: [
          {
            text: "Aspirate it with a syringe on the guide before any flush or contrast injection",
            best: true,
            feedback: "The UK protocol aspirates the remaining acetylcholine to avoid an accidental bolus.",
          },
          {
            text: "Flush with contrast instead of saline",
            feedback: "Contrast delivers the same residual acetylcholine; aspirate first.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Rhythm recovers. She says the pain is exactly her usual pain; the ECG shows inferolateral ST depression; the LAD and circumflex narrow by about 30% diffusely. What is the diagnosis?",
        options: [
          {
            text: "Microvascular spasm: usual pain and ischaemic ECG changes without 90% epicardial constriction",
            best: true,
            feedback: "These are the COVADIS criteria for microvascular spasm as used in CorMicA. The 30% diffuse constriction also points to epicardial endothelial dysfunction (20% or more during infusion in the CorMicA review), but it is well short of the 90% needed for epicardial spasm.",
          },
          {
            text: "Epicardial vasospastic angina",
            feedback: "Epicardial spasm needs constriction of 90% or more.",
            stateDelta: { stability: -5 },
          },
          {
            text: "A negative test, because the arteries did not close",
            feedback: "Reproduced pain with ischaemic ECG changes is a positive microvascular result.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "She has microvascular angina with both impaired dilatation and microvascular spasm. Which treatment direction fits the CorMicA review?",
        options: [
          {
            text: "Add a calcium-channel blocker for the spasm, keep risk-factor treatment and consider an ACE inhibitor",
            best: true,
            feedback: "Calcium-channel blockers treat the constrictive component; the review also lists ACE inhibitors and statins for microvascular angina.",
          },
          {
            text: "Long-acting nitrates as first-line therapy",
            feedback: "The review describes long-acting nitrates as ineffective or even harmful in microvascular angina.",
            stateDelta: { stability: -5 },
          },
          {
            text: "PCI to the LAD to improve flow",
            feedback: "There is no epicardial stenosis (FFR 0.91); stenting has no role.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "She is told she has microvascular angina with microvascular spasm. A calcium-channel blocker is added to her treatment, with an ACE inhibitor considered, and at follow-up her angina is less frequent.",
    outcomeVariants: [
      { flag: "ach-flushed", text: "The debrief notes the accidental acetylcholine bolus from flushing the guide; aspirate first." },
      { flag: "masked-spasm-risk", text: "The debrief notes that the large long-acting nitrate dose could have produced a false-negative acetylcholine test." },
    ],
    learningPoints: [
      "Unobstructed arteries in typical angina call for coronary function testing, not reassurance.",
      "Low-dose GTN (200 µg or less), adenosine measurements before acetylcholine.",
      "Thermodilution: 3–4 mL brisk injections until three agree within 10%; guide engaged but not plugging the left main.",
      "A low CFR or an IMR of 25 or more establishes microvascular dysfunction; acetylcholine is still worth doing because spasm can coexist.",
      "Acetylcholine: pads on, pacing available, aspirate the guide before flushing; bradycardia is usually self-limiting.",
      "Usual pain and ischaemic ECG changes without 90% constriction: microvascular spasm; treat with calcium-channel blockers, not long-acting nitrates.",
    ],
    refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019", "cormica-2018", "ong-covadis-mva-2018", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-phys-decide-before-measuring",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Decide what each result will mean before opening the wire",
    text: "Measure lesions under 90% in which the value will change the plan. Do not use physiology for an ACS culprit, a vein-graft lesion or the CTO vessel itself. Use it with caution in severe aortic stenosis or cardiogenic shock, and avoid it in heart failure with high right atrial and LV filling pressures.",
    tone: "do",
    lessonId: "pm-physiology-when",
    sources: [B("12.1"), B("12.3"), B("7.1")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-zero-outside",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Flush and zero the pressure wire before it enters the guide",
    text: "Fill the wire's container with saline, connect it to the interface module and zero it outside the body, checking every connection. A wire that will not zero has a poor connection or is faulty; replace it rather than finding out inside the patient.",
    tone: "do",
    lessonId: "pm-physiology-setup",
    sources: [B("12.2"), O("ch 8: Pressure wire")],
    refs: BOOKS,
  },
  {
    id: "pci-phys-equalise-at-tip",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Equalise with the sensor exactly at the guide tip",
    text: "Advance until the proximal end of the radiopaque segment sits at the guide tip, remove the introducer and flush the guide with saline, then equalise. Accept it only when the two waveforms superimpose and Pd/Pa reads 1.0, not merely when the means match.",
    tone: "do",
    lessonId: "pm-physiology-setup",
    sources: [B("12.2"), O("ch 8: Pressure wire")],
    refs: BOOKS,
  },
  {
    id: "pci-phys-equalise-fail",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Will not equalise: work through the causes",
    text: "Check that the introducer is out, the guide is flushed, the aortic line is flushed and zeroed without air, and the sensor is at the guide tip rather than deep in the vessel. If equalisation still fails, change the pressure wire.",
    tone: "bailout",
    lessonId: "pm-physiology-setup",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-wire-wrong-branch",
    lab: "pci",
    when: { phase: ["physiology"], event: ["wire-side-branch"] },
    title: "Pressure wire keeps entering the wrong branch: change the guide",
    text: "Poor engagement, an ill-fitting guide (an oversized EBU can steer the wire into the circumflex instead of the LAD, or the reverse) or a poor tip shape are the causes. Switch to a better-fitting guide and reshape the tip; never push hard against resistance.",
    tone: "bailout",
    lessonId: "pm-physiology-setup",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-cross-distal",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Equalise before crossing, then go as distal as you can",
    text: "Cross only after equalising, place the sensor as far distally as possible so the whole artery is measured, and do not disconnect the wire while you manipulate it, which invites drift.",
    tone: "do",
    lessonId: "pm-physiology-setup",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-ic-adenosine-flush",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Intracoronary adenosine: engaged guide, then flush",
    text: "Give the bolus with the guide engaged (a disengaged guide sends it to the aorta) and flush the guide so the whole dose arrives. Take the lowest Pd/Pa only once the guide trace has recovered from the injection.",
    tone: "do",
    lessonId: "pm-physiology-indices",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-iv-hyperaemia-signs",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "IV adenosine: wait for the haemodynamic response",
    text: "Read FFR once hyperaemia is stable, 60–90 seconds (Oxford) to 1–3 minutes (Brilakis) into the infusion. A fall in systolic pressure of about 10 mmHg and a rise in heart rate of 5–10 beats/min show that the drug is working.",
    tone: "do",
    lessonId: "pm-physiology-indices",
    sources: [B("12.2"), O("ch 8: Pressure wire")],
    refs: BOOKS,
  },
  {
    id: "pci-phys-no-hyperaemia",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "No response to adenosine: find out why before believing the FFR",
    text: "Check for a tissued or disconnected IV line, a dose that is too low, saline given in place of adenosine, recent caffeine, or a guide disengaged before an intracoronary bolus. Correct the cause and repeat the measurement.",
    tone: "bailout",
    lessonId: "pm-physiology-indices",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-damped-guide",
    lab: "pci",
    when: { phase: ["physiology"], pressure: ["damped", "ventricularised"] },
    title: "Damped guide: the FFR is falsely high",
    text: "A damped or ventricularised guide pressure raises FFR and the resting indices and hides the lesion's severity. Bring the guide back to a coaxial, undamped position (for an ostial lesion, disengage it) and repeat the measurement.",
    tone: "caution",
    lessonId: "pm-physiology-pullback",
    sources: [B("12.2"), B("12.3")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-drift-check",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Every study ends with a drift check",
    text: "Pull back until the radiopaque segment is at the guide tip and read Pd/Pa. Above 1.02 or below 0.98 is significant drift: re-equalise and repeat crossing, measurement and pullback. Resting indices are especially sensitive to drift.",
    tone: "do",
    lessonId: "pm-physiology-pullback",
    sources: [B("12.2"), O("ch 8: Pressure wire")],
    refs: BOOKS,
  },
  {
    id: "pci-phys-serial-biggest-step",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Serial lesions: treat the biggest step, then re-measure",
    text: "With two or more lesions the distal FFR is their combined effect and belongs to neither alone. Stent the lesion with the largest pressure step first, repeat the FFR, and treat the other only if it is still abnormal.",
    tone: "do",
    lessonId: "pm-physiology-pullback",
    sources: [B("12.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-diffuse-no-step",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "No step on the pullback: think twice about a stent",
    text: "A gradual pressure fall without a step-up means diffuse disease; PCI would need a long stent length and bypass surgery is preferable if feasible. A step within a long-looking lesion suggests the disease is more focal than it appears.",
    tone: "caution",
    lessonId: "pm-physiology-pullback",
    sources: [B("12.2"), B("22.4")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-ostial-disengage",
    lab: "pci",
    when: { phase: ["physiology"], pressure: ["damped", "ventricularised"] },
    title: "Aorto-ostial lesion: equalise in the aorta, measure disengaged",
    text: "Equalise with the sensor and the guide in the ascending aorta. Measure with the guide off the ostium: give intracoronary adenosine and then disengage, or use IV adenosine. Do the same for the final assessment after stenting.",
    tone: "do",
    lessonId: "pm-physiology-subsets",
    sources: [B("12.3"), B("15.1")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-left-main-both-branches",
    lab: "pci",
    when: { phase: ["physiology"], vessel: ["LM"] },
    title: "Left main: measure both branches with pullback",
    text: "Disengage the guide for an ostial left main. Measure the LAD and the circumflex, each with a pullback, to see whether the step is in the left main. A normal value in one branch but not the other points away from the left main; severe downstream disease can hide left main severity.",
    tone: "do",
    lessonId: "pm-physiology-subsets",
    sources: [B("12.3"), B("17.12")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-svg-avoid",
    lab: "pci",
    when: { phase: ["physiology"], vessel: ["SVG"] },
    title: "Do not judge a vein-graft lesion by FFR",
    text: "Native and collateral flow can make a severe graft lesion read normal, and intermediate graft lesions progress quickly, so a normal value does not make deferral safe. Brilakis advises against physiological assessment of graft lesions.",
    tone: "caution",
    lessonId: "pm-physiology-subsets",
    sources: [B("12.3"), B("18.12")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-discordance",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Resting and hyperaemic values disagree: decide on the clinical picture",
    text: "About 14% of lesions give discordant resting and hyperaemic results, most often in large arteries such as the left main and proximal LAD and in diabetes. Brilakis bases the decision on the clinical presentation.",
    tone: "do",
    lessonId: "pm-physiology-subsets",
    sources: [B("12.3")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-post-pci-pullback",
    lab: "pci",
    when: { phase: ["optimise", "physiology"] },
    title: "Low FFR after the stent: pull back through it",
    text: "If the post-PCI FFR is 0.80 or less (iFR 0.89 or less), pull back through the stent. A loss inside it means post-dilate or add a stent; a focal step outside it means a stent; a diffuse fall outside it means stop. Above 0.91 is associated with optimal outcomes.",
    tone: "do",
    lessonId: "pm-physiology-after-pci",
    sources: [B("12.1")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-phys-jailed-side-branch",
    lab: "pci",
    when: { phase: ["optimise", "physiology"], event: ["side-branch-compromise"] },
    title: "Jailed side branch looks narrowed: measure before treating",
    text: "The eye overestimates a jailed ostium. Intracoronary nitroglycerin may reverse spasm; then measure FFR in the branch: 0.80 or less in a branch of at least 2 mm needs treatment; above 0.80 needs none.",
    tone: "do",
    lessonId: "pm-physiology-after-pci",
    sources: [B("12.1"), B("16.2"), B("17.12")],
    refs: ["brilakis-manual-pci", "koo-jailed-sb-ffr-2005"],
  },
  {
    id: "diag-phys-qfr-acquisition",
    lab: "diagnostic",
    when: { phase: ["views"] },
    title: "Film intermediate lesions so wire-free FFR stays possible",
    text: "After intracoronary nitrate, take two projections of each intermediate lesion with minimal foreshortening and overlap, the whole vessel in view, at least 12.5 frames per second, with brisk continuous injection and no panning or zooming.",
    tone: "do",
    lessonId: "pm-physiology-derived",
    sources: [O("ch 6: Quantification of stenoses")],
    refs: ["westra-favor2-2018"],
  },
  {
    id: "pci-phys-thermodilution-boluses",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Thermodilution: three matching injections",
    text: "Equalise with the sensor at the guide tip, as for any pressure-wire study (Brilakis). The UK consensus protocol then parks the sensor at least 5 cm into the vessel, with the guide engaged but not plugging the left main, and repeats brisk 3–4 mL injections of room-temperature saline from a 5 mL syringe, the same way each time, until three transit times agree within 10%. This is done at rest and again during IV adenosine.",
    tone: "do",
    lessonId: "pm-physiology-microvascular",
    sources: [B("12.2")],
    refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019"],
  },
  {
    id: "pci-phys-ach-prepare",
    lab: "pci",
    when: { phase: ["physiology"], event: ["ach-provocation"] },
    title: "Acetylcholine test only: pads on, low RCA dose, aspirate afterwards",
    text: "Applies only when acetylcholine is being given, not to adenosine FFR; Oxford notes only that spasm can be confirmed by acetylcholine provocation, and these safety steps come from the UK consensus protocol. Put defibrillator pads and ECG leads on and warn the team that pacing may be needed. Halve the dose or rate in the RCA, and after an infusion aspirate the acetylcholine left in the guide before flushing or injecting contrast.",
    tone: "caution",
    lessonId: "pm-physiology-microvascular",
    sources: [O("ch 5: Myocardial infarction with non-obstructed coronary arteries")],
    refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019"],
  },
  {
    id: "pci-phys-ach-block",
    lab: "pci",
    when: { phase: ["physiology"], event: ["ach-provocation"] },
    title: "Acetylcholine test only: bradycardia or AV block",
    text: "During acetylcholine (not adenosine) testing, bradycardia is common and usually short-lived. Slow the infusion or switch it off, with atropine IV and an external pacing set-up ready. Do not give adenosine.",
    tone: "bailout",
    lessonId: "pm-physiology-microvascular",
    sources: [B("3.7")],
    refs: ["perera-bhf-cmd-2023", "ford-cormica-review-2019"],
  },
  {
    id: "pci-phys-ach-spasm",
    lab: "pci",
    when: { phase: ["physiology"], event: ["ach-provocation"] },
    title: "Acetylcholine test only: spasm, record then reverse",
    text: "This applies to acetylcholine provocation, not to the chest pain adenosine often causes during FFR. Ask whether it is the usual pain and record the ECG and an angiogram, then give intracoronary nitrate, which should relieve the spasm quickly. If it does not, intracoronary atropine reverses acetylcholine's effect.",
    tone: "bailout",
    lessonId: "pm-physiology-microvascular",
    sources: [O("ch 6: Use of nitrates")],
    refs: ["perera-bhf-cmd-2023", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "zimmermann-defer-2015",
    kind: "trial",
    citation:
      "Zimmermann FM, Ferrara A, Johnson NP, et al. Deferral vs. performance of percutaneous coronary intervention of functionally non-significant coronary stenosis: 15-year follow-up of the DEFER trial. Eur Heart J. 2015;36:3182–3188.",
    url: "https://doi.org/10.1093/eurheartj/ehv452",
    note: "PMID: 26400825. Checked on PubMed: authors, title, journal, year, volume 36, issue 45, pages 3182–3188; abstract read (325 patients; FFR ≥0.75 randomised to Defer 91 or Perform 90; 15-year death 33.0% vs 31.1%; MI 2.2% vs 10.0%). Brilakis chapter 12 reference [1].",
    verified: true,
  },
  {
    id: "ahmad-tavr-physiology-2018",
    kind: "paper",
    citation:
      "Ahmad Y, Götberg M, Cook C, et al. Coronary hemodynamics in patients with severe aortic stenosis and coronary artery disease undergoing transcatheter aortic valve replacement: implications for clinical indices of coronary stenosis severity. JACC Cardiovasc Interv. 2018;11:2019–2031.",
    url: "https://doi.org/10.1016/j.jcin.2018.07.019",
    note: "PMID: 30154062; PMC6197079. Checked on PubMed: authors, title, journal, year, volume 11, issue 20, pages 2019–2031; abstract read (28 patients, 30 lesions; iFR 0.88 before and after TAVR; FFR 0.87 to 0.85). Brilakis chapter 24 reference [4].",
    verified: true,
  },
  {
    id: "westra-favor2-2018",
    kind: "trial",
    citation:
      "Westra J, Andersen BK, Campo G, et al. Diagnostic performance of in-procedure angiography-derived quantitative flow reserve compared to pressure-derived fractional flow reserve: the FAVOR II Europe-Japan study. J Am Heart Assoc. 2018;7(14):e009603.",
    url: "https://doi.org/10.1161/JAHA.118.009603",
    note: "PMID: 29980523; PMC6064860. Checked on PubMed: authors, title, journal, year, volume 7, issue 14, article e009603. Full text read in PMC: acquisition protocol, sensitivity 86.5% and specificity 86.9%, AUC 0.92 vs 0.64, accuracy 71.3% for FFR 0.75–0.84, hybrid limits 0.77 and 0.87 (64% wire-free), time 5.0 vs 7.0 minutes, Medina 1.1.1 and 1.0.1 bifurcations excluded.",
    verified: true,
  },
  {
    id: "norgaard-nxt-2014",
    kind: "trial",
    citation:
      "Nørgaard BL, Leipsic J, Gaur S, et al. Diagnostic performance of noninvasive fractional flow reserve derived from coronary computed tomography angiography in suspected coronary artery disease: the NXT trial (Analysis of Coronary Blood Flow Using CT Angiography: Next Steps). J Am Coll Cardiol. 2014;63:1145–1155.",
    url: "https://doi.org/10.1016/j.jacc.2013.11.043",
    note: "PMID: 24486266. Checked on PubMed: authors, title, journal, year, volume 63, issue 12, pages 1145–1155; abstract read (254 patients; AUC 0.90 vs 0.81; per-patient sensitivity and specificity 86% and 79% FFR-CT, 94% and 34% CTA, 64% and 83% ICA).",
    verified: true,
  },
  {
    id: "douglas-platform-2015",
    kind: "trial",
    citation:
      "Douglas PS, Pontone G, Hlatky MA, et al. Clinical outcomes of fractional flow reserve by computed tomographic angiography-guided diagnostic strategies vs. usual care in patients with suspected coronary artery disease: the prospective longitudinal trial of FFR(CT): outcome and resource impacts study. Eur Heart J. 2015;36:3359–3367.",
    url: "https://doi.org/10.1093/eurheartj/ehv444",
    note: "PMID: 26330417; PMC4677273. Checked on PubMed: authors, title, journal, year, volume 36, issue 47, pages 3359–3367; abstract read (584 patients; no obstructive CAD at planned ICA 12% vs 73%; ICA cancelled in 61%; radiation 9.9 vs 9.4 mSv).",
    verified: true,
  },
  {
    id: "perera-bhf-cmd-2023",
    kind: "consensus",
    citation:
      "Perera D, Berry C, Hoole SP, et al. Invasive coronary physiology in patients with angina and non-obstructive coronary artery disease: a consensus document from the coronary microvascular dysfunction workstream of the British Heart Foundation/National Institute for Health Research Partnership. Heart. 2023;109(2):88–95.",
    url: "https://doi.org/10.1136/heartjnl-2021-320718",
    note: "PMID: 35318254; PMC9811089. Checked on PubMed: authors, title, journal, volume 109, issue 2, pages 88–95 (published online 2022, issue dated 2023). Full text read in PMC: patient selection, LAD target, heparin 70–100 U/kg, GTN ≤200 µg, thermodilution technique (3–4 mL, three within 10%, at least 5 cm, drift ≥0.03), IV adenosine 140 µg/kg/min, CFR <2.5, AChFR ≤1.5 and <1.0, acetylcholine regimens and safety, 100 µg LCA / 50 µg RCA bolus, ESC class IIa note.",
    verified: true,
  },
  {
    id: "ford-cormica-review-2019",
    kind: "paper",
    citation:
      "Ford TJ, Berry C. How to diagnose and manage angina without obstructive coronary artery disease: lessons from the British Heart Foundation CorMicA trial. Interv Cardiol. 2019;14(2):76–82.",
    url: "https://doi.org/10.15420/icr.2019.04.R1",
    note: "PMID: 31178933; PMC6545998. Checked on PubMed: authors, title, journal, year, volume 14, issue 2, pages 76–82. Full text read in PMC: CFR <2.0, IMR ≥25, HMR ≥2.5, heparin 50–70 U/kg, GTN ≤200 µg (3% active at 10 minutes), adenosine before acetylcholine, Japanese bolus doses, COVADIS criteria, ≥20% constriction for endothelial dysfunction, endotype prevalence and treatment table.",
    verified: true,
  },
  {
    id: "vannunen-fame-5y-2015",
    kind: "trial",
    citation:
      "van Nunen LX, Zimmermann FM, Tonino PAL, et al. Fractional flow reserve versus angiography for guidance of PCI in patients with multivessel coronary artery disease (FAME): 5-year follow-up of a randomised controlled trial. Lancet. 2015;386:1853–1860.",
    url: "https://doi.org/10.1016/S0140-6736(15)00057-4",
    note: "PMID: 26333474. Checked on PubMed: authors, title, journal, year, volume 386, issue 10006, pages 1853–60; abstract read (MACE at 5 years 31% angiography-guided vs 28% FFR-guided, RR 0.91, p=0.31; benefit up to 2 years, parallel thereafter; stents per patient 2.7 vs 1.9).",
    verified: true,
  },
  {
    id: "eftekhari-ifr-5y-2023",
    kind: "paper",
    citation:
      "Eftekhari A, Holck EN, Westra J, et al. Instantaneous wave free ratio vs. fractional flow reserve and 5-year mortality: iFR SWEDEHEART and DEFINE FLAIR. Eur Heart J. 2023;44:4376–4384.",
    url: "https://doi.org/10.1093/eurheartj/ehad582",
    note: "PMID: 37634144. Checked on PubMed: authors, title, journal, year, volume 44, issue 41, pages 4376–4384; abstract read (study-level meta-analysis; 2254 iFR vs 2257 FFR; deferral 50.0% vs 45.2%; HR all-cause death 1.34 [1.08–1.67], MACE 1.18 [1.04–1.34], unplanned revascularisation 0.99, MI 1.02).",
    verified: true,
  },
  {
    id: "collison-target-ffr-2021",
    kind: "trial",
    citation:
      "Collison D, Didagelos M, Aetesam-Ur-Rahman M, et al. Post-stenting fractional flow reserve vs coronary angiography for optimization of percutaneous coronary intervention (TARGET-FFR). Eur Heart J. 2021;42:4656–4668.",
    url: "https://doi.org/10.1093/eurheartj/ehab449",
    note: "PMID: 34279606; PMC8634564. Checked on PubMed: authors, title, journal, year, volume 42, issue 45, pages 4656–4668; abstract read (260 randomised; 68.1% initial post-PCI FFR <0.90; final FFR ≥0.90 not significantly increased, P=0.099; final FFR ≤0.80 reduced by 11.2%, P=0.045).",
    verified: true,
  },
  {
    id: "lonborg-notion3-2024",
    kind: "trial",
    citation:
      "Lønborg J, Jabbari R, Sabbah M, et al. PCI in patients undergoing transcatheter aortic-valve implantation. N Engl J Med. 2024;391:2189–2200.",
    url: "https://doi.org/10.1056/NEJMoa2401513",
    note: "PMID: 39216095. Checked on PubMed: authors, title, journal, year, volume 391, issue 23, pages 2189–2200; abstract read (NOTION-3; 455 patients; lesions with FFR ≤0.80 or diameter stenosis ≥90%; MACE 26% PCI vs 36% conservative at median 2 years, HR 0.71; bleeding 28% vs 20%).",
    verified: true,
  },
  {
    id: "malcolm-adenosine-ep-1993",
    kind: "paper",
    citation:
      "Malcolm AD, Garratt CJ, Camm AJ. The therapeutic and diagnostic cardiac electrophysiological uses of adenosine. Cardiovasc Drugs Ther. 1993;7:139–147.",
    url: "https://doi.org/10.1007/BF00878323",
    note: "PMID: 8485069. Checked on PubMed: authors, title, journal, year, volume 7, issue 1, pages 139–47; abstract read (aminophylline antagonises and dipyridamole potentiates the effects of adenosine).",
    verified: true,
  },
  {
    id: "reynolds-inoca-esc-2025",
    kind: "paper",
    citation:
      "Reynolds HR, Smilowitz NR. Ischaemia with non-obstructive coronary arteries in the 2024 European Society of Cardiology guidelines for the management of chronic coronary syndromes. Eur Heart J Acute Cardiovasc Care. 2025;14:173–177.",
    url: "https://doi.org/10.1093/ehjacc/zuaf005",
    note: "PMID: 39820976. Checked on PubMed: authors, title, journal, year, volume 14, issue 3, pages 173–177; abstract read (new class I recommendation in the 2024 ESC CCS guideline for availability of invasive coronary function testing at initial angiography when the mechanism is uncertain after non-invasive testing, and in established INOCA/ANOCA with persistent symptoms despite medical therapy).",
    verified: true,
  },
];
