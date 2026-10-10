import type { Track } from "../schema";

export const physiologyImaging: Track = {
  id: "physiology-imaging",
  order: 3,
  title: "Physiology & Imaging",
  tagline: "Pressure wire, resting indices, IVUS, OCT and the microcirculation",
  description:
    "When a stenosis matters and how to prove it: pressure-wire and resting indices, angiography- and CT-derived FFR, microvascular testing for angina without obstructive disease, and intravascular ultrasound and optical coherence tomography to plan, optimise and troubleshoot PCI.",
  stage: 3,
  modules: [
    // =====================================================================
    // MODULE 1 — PRESSURE WIRE
    // =====================================================================
    {
      id: "phy-pressure-wire",
      title: "The pressure wire: FFR and resting indices",
      stage: 3,
      summary:
        "Why physiology rather than appearance should decide whether an intermediate stenosis is treated, how to perform a reliable FFR or resting-index study, the thresholds in current use, and the technical and physiological traps that produce wrong answers.",
      objectives: [
        "Explain the physiological basis of FFR and resting indices and the evidence from FAME, FAME 2, DEFINE-FLAIR and iFR-SWEDEHEART.",
        "Perform a pressure-wire study in a safe, reproducible sequence, including equalisation and a drift check.",
        "Apply the thresholds FFR ≤ 0.80 and resting indices ≤ 0.89.",
        "Recognise guide damping, inadequate hyperaemia, drift and the special situations in which values mislead.",
        "Interpret a pullback as focal, serial or diffuse disease and plan treatment accordingly.",
      ],
      lessons: [
        {
          id: "phy-pw-why",
          title: "Why physiology: anatomy, ischaemia and deferral",
          minutes: 9,
          refs: ["supplied-medmastery", "fame-2009", "fame2-2012", "define-flair-2017", "ifr-swedeheart-2017", "esc-ccs-2024", "defer-2007"],
          blocks: [
            {
              kind: "p",
              text: "The angiogram is a luminogram: a shadow of the contrast-filled lumen. It shows narrowing but not its consequence for myocardial blood flow. Epicardial arteries are conduits; the microcirculation regulates how much flow the myocardium receives. A stenosis that looks intermediate may or may not limit flow when demand rises, and the eye cannot tell which.",
            },
            {
              kind: "table",
              caption: "What determines whether a stenosis limits flow",
              head: ["Factor", "Effect"],
              rows: [
                ["Minimal lumen area and lesion length", "Smaller and longer lesions generate more resistance"],
                ["Entrance and exit geometry, eccentricity", "Energy is lost to turbulence and flow separation, not just friction"],
                ["Size of the territory supplied", "The same stenosis matters more in a proximal LAD than in a small diagonal"],
                ["Previous infarction in the territory", "Less viable myocardium means less flow and a smaller gradient"],
                ["Collaterals", "Supply the territory from elsewhere and lessen the gradient"],
                ["Microvascular function", "Impaired vasodilatation limits hyperaemic flow and the gradient"],
                ["Serial or diffuse disease", "Pressure losses accumulate along the vessel"],
              ],
            },
            {
              kind: "p",
              text: "For mild stenoses the answer is usually 'not significant', and for severe ones 'significant'. The angiographically intermediate lesion is the grey zone where physiology changes decisions. The question to ask is whether this lesion limits flow enough to cause the patient's symptoms or to justify the risks of stenting and dual antiplatelet therapy.",
            },
            { kind: "h", text: "Fractional flow reserve" },
            {
              kind: "formula",
              name: "FFR",
              expr: "FFR = Pd ÷ Pa during maximal hyperaemia",
              note: "Pd: pressure distal to the stenosis (wire sensor). Pa: aortic pressure (guide catheter). Strictly (Pd − Pv) ÷ (Pa − Pv); venous pressure is assumed negligible.",
            },
            {
              kind: "p",
              text: "At maximal hyperaemia microvascular resistance is minimal and assumed constant, so flow is proportional to driving pressure. The ratio of distal to aortic pressure then estimates maximal flow with the stenosis as a fraction of maximal flow without it. An FFR of 0.70 means that at peak demand the territory receives about 70% of the flow it would get through a normal vessel.",
            },
            {
              kind: "keypoints",
              title: "Properties of FFR",
              items: [
                "The normal value is 1.0 in every vessel and every patient.",
                "Relatively independent of heart rate, blood pressure and contractility.",
                "Incorporates the size of the territory and any collateral supply.",
                "Specific to the vessel and lesion measured; reproducible.",
              ],
            },
            { kind: "h", text: "Resting (non-hyperaemic) indices" },
            {
              kind: "p",
              text: "Resting indices avoid a hyperaemic drug. The instantaneous wave-free ratio (iFR) measures Pd/Pa in a diastolic window when microvascular resistance is naturally low and stable; the resting full-cycle ratio (RFR) takes the lowest Pd/Pa in the whole cycle; the diastolic pressure ratio (dPR) uses diastole. All share a threshold of 0.89. Older practice used a 'hybrid' approach with an iFR grey zone of about 0.86–0.94 in which adenosine was given; since DEFINE-FLAIR and iFR-SWEDEHEART, a single 0.89 cut-off is standard.",
            },
            {
              kind: "table",
              caption: "Key evidence (direction of findings)",
              head: ["Trial", "Population", "Comparison", "Main finding"],
              rows: [
                ["FAME (2009)", "Multivessel coronary disease", "FFR-guided (≤ 0.80) vs angiography-guided PCI", "Fewer stents and fewer combined death, MI and repeat revascularisation at one year with FFR guidance"],
                ["FAME 2 (2012)", "Stable disease with at least one lesion FFR ≤ 0.80", "PCI plus medical therapy vs medical therapy alone", "Fewer urgent revascularisations with PCI; stopped early. Patients whose lesions all had FFR > 0.80 did well on medical therapy alone"],
                ["DEFINE-FLAIR and iFR-SWEDEHEART (2017)", "Intermediate stenoses, stable and ACS", "iFR-guided (≤ 0.89) vs FFR-guided (≤ 0.80)", "iFR non-inferior for major adverse events at one year, with fewer procedural symptoms"],
                ["ISCHEMIA (2020)", "Stable disease with moderate or severe ischaemia", "Initial invasive vs initial conservative strategy", "No significant reduction in the primary composite endpoint; revascularisation in stable disease is largely for symptoms and selected high-risk anatomy"],
              ],
            },
            { kind: "h", text: "The deferral concept" },
            {
              kind: "p",
              text: "A lesion that does not limit flow carries a low risk of future events. Stenting it adds procedural risk, stent-related events and antiplatelet bleeding without a corresponding benefit. Deferral means optimal medical therapy with reassessment if symptoms change. Earlier work, including the DEFER study, showed that deferring functionally non-significant lesions was safe over long-term follow-up.",
            },
            {
              kind: "p",
              text: "The 2024 ESC chronic coronary syndromes guideline supports pressure-wire assessment (FFR or a validated resting index) to decide on revascularisation of angiographically intermediate stenoses when non-invasive testing has not already localised ischaemia to that vessel.",
            },
            {
              kind: "pitfalls",
              items: [
                "Treating the angiogram rather than the patient: a 70% stenosis in a vessel supplying an old infarct may be functionally trivial.",
                "Assuming a wire study is risk-free: pressure wires steer less well than workhorse wires, and dissecting a vessel to measure a lesion that turns out to be non-significant is a poor trade.",
                "Using a single number in isolation from symptoms, territory and pullback pattern.",
              ],
            },
            {
              kind: "pearl",
              text: "Before you open a pressure wire, decide what you will do with each possible result. If no value would change management, do not measure.",
            },
          ],
        },
        {
          id: "phy-pw-technique",
          title: "Performing a pressure-wire study",
          minutes: 9,
          refs: ["supplied-medmastery", "esc-ccs-2024", "brilakis-manual-pci"],
          blocks: [
            {
              kind: "p",
              text: "A pressure wire is a 0.014-inch guidewire with a pressure sensor about 3 cm from the tip, at the junction between the radio-opaque tip and the less opaque shaft. Piezoresistive and fibre-optic sensors are available; optical sensors tend to drift less. Because the sensor and its connections make the wire less steerable than a workhorse wire, handle it with the care of a diagnostic procedure.",
            },
            {
              kind: "steps",
              title: "Step by step",
              items: [
                { title: "Prepare the patient", detail: "Explain the expected adenosine effects (chest tightness, breathlessness, flushing, a sense of unease) so they do not cause alarm. Check for contraindications: severe bronchospasm, high-grade AV block without pacing, hypotension. Caffeine and theophylline blunt adenosine." },
                { title: "Anticoagulate", detail: "Give a full PCI dose of heparin before the wire enters the coronary artery." },
                { title: "Check the guide", detail: "Coaxial engagement, preferably a guide without side holes, a clean aortic trace with a dicrotic notch, correctly zeroed and levelled." },
                { title: "Give intracoronary nitrate", detail: "Abolishes epicardial spasm from catheter or wire and ensures maximal epicardial dilatation." },
                { title: "Calibrate the wire", detail: "Flush the hoop with heparinised saline, lay it flat on the table, connect and zero to atmosphere before insertion." },
                { title: "Advance to the guide tip", detail: "Place the sensor just beyond the tip of the guide in the proximal vessel." },
                { title: "Seal and flush", detail: "Remove the introducer, close the haemostatic valve and flush contrast out of the guide with saline." },
                { title: "Equalise", detail: "Pd and Pa should superimpose; equalise so that Pd/Pa reads 1.00." },
                { title: "Cross and position", detail: "Advance the sensor well beyond the lesion, typically into the distal third of the vessel, and record an image of its position for later re-measurement. Remove the introducer and flush again." },
                { title: "Resting index", detail: "Record the resting index over several stable beats." },
                { title: "Hyperaemia", detail: "Start the hyperaemic agent, watch the ECG for AV block, record the lowest stable Pd/Pa at steady state, then stop." },
                { title: "Pullback", detail: "Pull the sensor slowly back to the guide tip (during steady-state IV adenosine for FFR, or at rest for a resting-index pullback), noting where the pressure steps up." },
                { title: "Drift check", detail: "With the sensor back at the equalisation point, Pd/Pa should read 1.00 (within about ±0.02). If not, re-equalise and repeat the measurement." },
                { title: "Check the vessel", detail: "Repeat the angiogram to exclude wire injury." },
              ],
            },
            {
              kind: "table",
              caption: "Hyperaemic agents (typical use; follow local protocol)",
              head: ["Agent", "Route", "Notes"],
              rows: [
                ["Adenosine", "IV infusion, typically 140 micrograms/kg/min via a large vein", "Steady-state hyperaemia within a minute or two allows a pullback; aortic pressure usually falls slightly; systemic symptoms"],
                ["Adenosine", "IC bolus through the guide (doses in the tens to low hundreds of micrograms, lower in the right coronary)", "Rapid and brief; needs an engaged guide; no steady-state pullback"],
                ["Papaverine", "IC bolus", "Longer hyperaemia; prolongs the QT interval with a risk of polymorphic VT; rarely first choice"],
              ],
            },
            {
              kind: "table",
              caption: "Thresholds in current use",
              head: ["Index", "Ischaemic threshold", "Measured"],
              rows: [
                ["FFR", "≤ 0.80", "Lowest stable Pd/Pa during steady-state hyperaemia"],
                ["iFR", "≤ 0.89", "Diastolic wave-free period at rest"],
                ["RFR", "≤ 0.89", "Lowest Pd/Pa over the whole cardiac cycle at rest"],
                ["dPR", "≤ 0.89", "Diastolic Pd/Pa at rest"],
                ["Resting full-cycle Pd/Pa", "About ≤ 0.91", "Less well validated than the dedicated indices"],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Equalise at the guide tip before crossing, and check drift at the same point afterwards.",
                "Remove the introducer and flush contrast out before every measurement.",
                "The sensor is about 3 cm from the tip, not at it.",
                "If the result means PCI, the pressure wire can be used as the PCI wire, or swapped for a workhorse wire and reinserted to measure post-PCI.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Never stent over a pressure wire that is lying alongside a second wire: jailing it behind the stent risks fracturing the sensor section on removal.",
                "If the wire was disconnected during PCI, wipe and dry the connector before reconnecting, or the signal will be unreliable.",
                "Ostial or proximal left main and RCA lesions: the guide may sit in or across the lesion. Disengage the guide and use IV adenosine.",
              ],
            },
            {
              kind: "pearl",
              text: "Take a fluoroscopic image of the sensor position before hyperaemia. After PCI you can return the sensor to exactly the same spot, which makes the pre- and post-PCI values comparable.",
            },
            {
              kind: "sim",
              sim: "physiology",
              task: "Equalise at the guide tip, cross an intermediate LAD lesion, record iFR, then FFR during IV adenosine; pull back to the guide and confirm Pd/Pa returns to 1.00 ± 0.02.",
            },
          ],
        },
        {
          id: "phy-pw-pitfalls",
          title: "Pitfalls, special situations and pullback interpretation",
          minutes: 10,
          refs: ["supplied-medmastery", "esc-acs-2023", "brilakis-manual-pci", "hanna-pcm"],
          blocks: [
            {
              kind: "table",
              caption: "Common pitfalls",
              head: ["Problem", "Effect on the value", "How to recognise it", "Fix"],
              rows: [
                ["Guide damping or deep intubation", "Guide obstructs inflow and limits hyperaemic flow; Pa may be wrong. FFR usually falsely high", "Ventricularised Pa trace, loss of dicrotic notch, guide deep in the vessel", "Disengage the guide during hyperaemia; use IV adenosine"],
                ["Guide with side holes", "Pa reflects aortic pressure while the tip still obstructs; IC drug partly lost to the aorta", "Known catheter type", "Use a guide without side holes, or IV adenosine with the guide disengaged"],
                ["Introducer left in, loose valve, contrast in the guide", "Distorted or damped Pa", "Abnormal Pa contour", "Remove introducer, tighten valve, flush with saline"],
                ["Drift", "Pd offset in either direction", "Pd/Pa not 1.00 at the guide tip after pullback", "Re-equalise and repeat"],
                ["Inadequate hyperaemia", "FFR falsely high", "No fall in Pa, no symptoms, small IC bolus, caffeine, infusion into a small or tissued vein", "Large vein, check the pump, repeat"],
                ["Wire accordion effect in a tortuous vessel", "Artefactual gradient from wire-straightening of the vessel", "Folds or pseudo-lesions on angiography", "Pull the stiff part of the wire back and re-measure"],
                ["Arrhythmia or ectopy", "Unstable readings", "Irregular traces", "Measure over stable beats"],
              ],
            },
            { kind: "h", text: "Special situations" },
            {
              kind: "list",
              items: [
                "Serial lesions: each lesion alters flow through the other, so the FFR of either one in isolation is unreliable. Treat the lesion with the largest pressure step first and re-measure. Resting pullbacks are less affected by interaction and can predict the effect of treating each segment.",
                "Diffuse disease: pressure falls gradually along the vessel without a focal step. A low distal value does not mean that a stent will fix it; consider medical therapy or surgery rather than long stents.",
                "Left main with downstream disease: a significant LAD or circumflex lesion reduces flow through the left main and can make the left main value falsely reassuring. The effect matters mainly when downstream disease is severe; measure in the less diseased branch and consider IVUS.",
                "Acute MI culprit vessel: stunned microvasculature limits hyperaemia, so FFR underestimates the lesion. Do not use physiology to judge the culprit. The 2023 ESC ACS guideline advises against invasive functional assessment of non-culprit segments of the infarct-related artery during the index procedure.",
                "Non-culprit vessels in ACS: physiology can be used, but evidence on physiology versus angiography guidance for non-culprit lesions after STEMI is mixed.",
                "Severe aortic stenosis: LV hypertrophy, raised LVEDP and altered coronary flow affect both FFR and resting indices, and values can change after valve treatment; interpret with caution.",
                "Microvascular dysfunction or LV hypertrophy: limited hyperaemic flow produces a smaller gradient, so FFR may look better than the anatomy suggests. Consider CFR and IMR (next module).",
              ],
            },
            { kind: "h", text: "Reading the pullback" },
            {
              kind: "table",
              caption: "Pullback patterns",
              head: ["Pattern", "Appearance", "Implication"],
              rows: [
                ["Focal", "An abrupt step-up in Pd/Pa across a short segment", "PCI to that segment is likely to restore a near-normal value"],
                ["Serial", "Two or more distinct steps", "Treat the largest step first, then re-measure"],
                ["Diffuse", "A gradual slope over a long segment", "Stenting gains little; consider medical therapy or CABG"],
                ["Mixed", "A focal step superimposed on a gradual slope", "PCI of the focal part may help, but expect a residual gradient"],
              ],
            },
            {
              kind: "p",
              text: "Indices such as the pullback pressure gradient quantify how focal a pressure loss is, and resting-index pullbacks co-registered with the angiogram allow a 'virtual PCI' that predicts the post-stent value. After PCI, a higher final FFR is associated with better outcomes; a persisting gradient should prompt a pullback to see whether the loss lies in the stent (underexpansion) or outside it (residual disease), and imaging to explain it.",
            },
            {
              kind: "keypoints",
              items: [
                "A damped guide makes FFR falsely high; disengage and re-measure.",
                "Drift must be checked every time before you act on a value.",
                "The pullback tells you where the pressure is lost, which is what decides the treatment.",
              ],
            },
            {
              kind: "pearl",
              text: "An FFR of 0.78 with a single sharp step and an FFR of 0.78 with a gradual slope are different diseases. Report the pattern, not just the number.",
            },
            {
              kind: "sim",
              sim: "physiology",
              task: "Reproduce a damped-guide artefact, correct it by disengaging the guide, then perform a hyperaemic pullback across serial lesions and decide which to treat first.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "phy-q-pw-1",
          stem: "Which pair of thresholds identifies a haemodynamically significant stenosis in current practice?",
          options: [
            "FFR ≤ 0.80 and iFR ≤ 0.89",
            "FFR ≤ 0.75 and iFR ≤ 0.86",
            "FFR ≤ 0.89 and iFR ≤ 0.80",
            "FFR ≤ 0.90 and iFR ≤ 0.94",
            "FFR ≤ 0.70 and iFR ≤ 0.90",
          ],
          answer: 0,
          explanation:
            "FAME used FFR ≤ 0.80, and DEFINE-FLAIR and iFR-SWEDEHEART validated iFR ≤ 0.89 against it. FFR 0.75 was the earlier, more specific cut-off, and iFR 0.86 was the lower end of the old hybrid grey zone (0.86–0.94); neither is the current standard.",
          difficulty: 1,
          refs: ["fame-2009", "define-flair-2017", "ifr-swedeheart-2017"],
        },
        {
          id: "phy-q-pw-2",
          stem: "In FAME 2, patients with stable disease and at least one lesion with FFR ≤ 0.80 were randomised to PCI plus medical therapy or medical therapy alone. What was the main finding?",
          options: [
            "PCI reduced the composite endpoint, driven mainly by fewer urgent revascularisations",
            "PCI reduced all-cause mortality and spontaneous MI within the first year of follow-up",
            "There was no difference in any endpoint between PCI and medical therapy at two years",
            "Medical therapy alone reduced myocardial infarction by avoiding periprocedural events",
          ],
          answer: 0,
          explanation:
            "FAME 2 was stopped early because of a lower rate of the composite endpoint with PCI, driven mainly by urgent revascularisation. It did not show a mortality benefit. Patients whose lesions were all above 0.80 did well on medical therapy alone, supporting deferral.",
          difficulty: 2,
          refs: ["fame2-2012"],
        },
        {
          id: "phy-q-pw-3",
          stem: "During IV adenosine the aortic trace loses its dicrotic notch and takes on a ventricular shape; FFR reads 0.87. The guide is deeply seated in the left main. What should you do?",
          options: [
            "Disengage the guide slightly, confirm a normal aortic trace and repeat the hyperaemic measurement",
            "Accept the value and defer PCI",
            "Switch to iFR, which is unaffected by guide position",
            "Give an additional intracoronary adenosine bolus through the deeply seated guide",
            "Increase the IV adenosine infusion rate",
          ],
          answer: 0,
          explanation:
            "A ventricularised Pa trace means the guide is obstructing the ostium. Hyperaemic inflow is limited, the gradient across the lesion is underestimated, and FFR is falsely high. Disengaging the guide during IV adenosine fixes this. iFR also depends on an accurate Pa and unobstructed flow, so switching index does not solve the problem.",
          difficulty: 2,
          refs: ["supplied-medmastery"],
        },
        {
          id: "phy-q-pw-4",
          stem: "After measuring FFR 0.79 in the mid LAD, you pull the sensor back to the guide tip and Pd/Pa reads 0.95. What is the correct next step?",
          options: [
            "Re-equalise at the guide tip and repeat the measurement before deciding",
            "Proceed to PCI because the FFR is below 0.80",
            "Subtract 0.05 from the FFR and defer",
            "Ignore it: drift only matters for resting indices",
          ],
          answer: 0,
          explanation:
            "Pd/Pa should be 1.00 (within about ±0.02) at the equalisation point. A reading of 0.95 means the sensor has drifted, so the 0.79 cannot be trusted; re-equalise and measure again. Applying an arithmetic correction is unreliable because drift is not necessarily linear over time.",
          difficulty: 2,
          refs: ["supplied-medmastery"],
        },
        {
          id: "phy-q-pw-5",
          stem: "A patient has an intermediate distal left main stenosis and a severe proximal LAD stenosis. How is FFR measured in the circumflex (across the left main) likely to be affected?",
          options: [
            "It may be falsely high, because the LAD lesion limits flow through the left main",
            "It will be falsely low, because the LAD steals flow from the circumflex territory",
            "It is unaffected, because FFR is lesion-specific whatever the downstream disease",
            "It cannot be measured from the circumflex; the wire must always go down the LAD",
          ],
          answer: 0,
          explanation:
            "Severe downstream disease reduces maximal flow through the left main, so the pressure drop across the left main is smaller than it would be without the LAD lesion, and its FFR looks better than it is. Measure through the less diseased branch and consider IVUS. FFR is lesion-specific only when the lesion is the sole stenosis in the circuit.",
          difficulty: 3,
          refs: ["brilakis-manual-pci"],
        },
        {
          id: "phy-q-pw-6",
          stem: "A hyperaemic pullback in the RCA shows two distinct steps: 0.94 → 0.82 across a proximal lesion and 0.82 → 0.70 across a distal lesion. What is the best strategy?",
          options: [
            "Treat the larger step (or the proximal one if equal), then re-measure",
            "Stent both lesions, because the distal FFR of 0.70 is clearly ischaemic",
            "Defer both, because each individual step is less than 0.20 and so not significant",
            "Stent only the distal lesion, because the FFR is lowest at the distal end of the vessel",
          ],
          answer: 0,
          explanation:
            "Serial lesions interact: each limits flow through the other, so the contribution of each changes once the other is treated. Treat one, then re-measure; the other may no longer be significant. Stenting both on the basis of the distal value ignores this interaction.",
          difficulty: 2,
          refs: ["brilakis-manual-pci"],
        },
        {
          id: "phy-q-pw-7",
          stem: "A pullback shows Pd/Pa falling gradually from 0.97 to 0.76 over 50 mm of the LAD with no focal step. Which statement is most accurate?",
          options: [
            "Diffuse disease: stenting is unlikely to normalise it, so consider medical therapy or CABG",
            "A long stent covering the whole 50 mm segment will normalise the FFR and the symptoms",
            "The distal value is below 0.80, so PCI of the most angiographically severe segment is mandatory",
            "The study is invalid because there is no focal step, so the pullback should be repeated",
          ],
          answer: 0,
          explanation:
            "Gradual pressure loss without a focal step means the resistance is spread along the vessel. Long stents give a poor return, with residual gradients and more stent-related events. A distal value of 0.76 confirms ischaemia but not that PCI is the right treatment.",
          difficulty: 3,
          refs: ["brilakis-manual-pci", "esc-ccs-2024"],
        },
        {
          id: "phy-q-pw-8",
          stem: "Where on a pressure wire is the sensor located?",
          options: [
            "About 3 cm from the tip, where the radio-opaque tip meets the shaft",
            "At the very tip of the wire, inside the radio-opaque coil",
            "Halfway along the wire, level with the guide catheter tip",
            "Inside the connector at the proximal end of the wire, outside the body",
          ],
          answer: 0,
          explanation:
            "The sensor sits where the radio-opaque tip meets the shaft, a few centimetres from the tip. It must be positioned well beyond the lesion, not just the wire tip. Assuming the sensor is at the tip can leave it within or proximal to the lesion.",
          difficulty: 1,
          refs: ["supplied-medmastery"],
        },
        {
          id: "phy-q-pw-9",
          stem: "During IV adenosine the patient has no symptoms, aortic pressure does not change and FFR is 0.86. He drank two cups of coffee an hour ago. What is the most likely explanation?",
          options: [
            "Inadequate hyperaemia, making FFR falsely high",
            "Drift of the pressure sensor",
            "Microvascular dysfunction making FFR falsely low",
            "A guide catheter with side holes making FFR falsely low",
          ],
          answer: 0,
          explanation:
            "Caffeine antagonises adenosine receptors. Absent symptoms and no fall in aortic pressure suggest that hyperaemia was not achieved, so the gradient is underestimated and FFR is falsely high. Consider a resting index or an alternative agent. Drift is detected at the guide tip, not by the absence of a hyperaemic response.",
          difficulty: 2,
          refs: ["supplied-medmastery"],
        },
      ],
      sims: [
        { sim: "physiology", task: "Perform a complete FFR study: calibrate, equalise at the guide tip, measure resting and hyperaemic indices, pull back and check drift." },
        { sim: "physiology", task: "Identify and correct three artefacts: a damped guide, an introducer left in the valve, and sensor drift." },
      ],
      caseIds: ["phy-case-damped-guide"],
    },

    // =====================================================================
    // MODULE 2 — ANGIOGRAPHY- AND CT-DERIVED FFR
    // =====================================================================
    {
      id: "phy-angio-derived",
      title: "Angiography- and CT-derived FFR",
      stage: 3,
      summary:
        "How FFR can be estimated without a pressure wire from the angiogram or from coronary CT, what each method needs to work, where they fail, and where they fit alongside wire-based physiology.",
      objectives: [
        "Explain how angiography-derived FFR is computed and what image acquisition it requires.",
        "List the lesion and image characteristics that make angiography-derived FFR unreliable.",
        "Describe the role of CT-derived FFR in chronic coronary syndromes and how to read its values.",
        "Decide when a borderline derived value should be confirmed with a pressure wire.",
      ],
      lessons: [
        {
          id: "phy-ad-angio",
          title: "Angiography-derived FFR",
          minutes: 7,
          refs: ["esc-ccs-2024", "fame-2009", "favor3-china-2021", "favor3-europe-2024"],
          blocks: [
            {
              kind: "p",
              text: "Angiography-derived FFR estimates the pressure loss along a vessel from the angiogram alone. Software reconstructs the vessel in three dimensions from two or more projections, estimates flow (from a fixed hyperaemic flow assumption or from contrast frame counting) and applies simplified fluid-dynamic equations to calculate the pressure drop. The output is a value at the end of the vessel and a virtual pullback along it. Several commercial implementations exist (for example QFR and vFFR), including single-projection variants. The same ≤ 0.80 threshold is applied.",
            },
            {
              kind: "steps",
              title: "Acquisition that makes the analysis possible",
              items: [
                { title: "Nitrate first", detail: "Give intracoronary nitrate so the reconstruction reflects a dilated vessel." },
                { title: "Two good projections", detail: "At least two views of the target vessel, usually at least 25° apart, with minimal foreshortening and no overlap at the lesion." },
                { title: "Full opacification", detail: "A brisk injection that fills the vessel completely, with no table panning during the run." },
                { title: "Adequate frame rate", detail: "Sufficient frames to identify end-diastole and to count contrast transit if the software uses it." },
                { title: "Careful analysis", detail: "The analyst defines the vessel path, the lumen contours and the reference; poor contouring is a major source of error." },
              ],
            },
            {
              kind: "table",
              caption: "Strengths and limitations",
              head: ["Strengths", "Limitations"],
              rows: [
                ["No wire, so no risk of wire injury", "Depends on image quality: overlap, foreshortening, poor opacification"],
                ["No hyperaemic drug or its side effects", "Aorto-ostial lesions and the ostial left main are poorly modelled"],
                ["Can be done offline, including on angiograms from another centre", "Severe tortuosity, very small vessels, diffuse disease"],
                ["Gives a virtual pullback to localise pressure loss", "Assumes normal microvascular function; unreliable after recent infarction in the territory"],
                ["Quick once workflow is established", "Not validated for the acute culprit, bypass grafts or collateral-dependent territories"],
                ["Several vessels can be assessed from one set of runs", "Analyst-dependent; arrhythmia disturbs frame counting"],
              ],
            },
            {
              kind: "p",
              text: "Diagnostic studies show good agreement with wire-based FFR, best when the value is well away from 0.80. In outcome trials, QFR-guided PCI improved results compared with angiography alone (FAVOR III China), but in a later head-to-head comparison QFR guidance did not demonstrate non-inferiority to wire-based FFR guidance (FAVOR III Europe). Its place relative to wire-based indices is still evolving; check the current ESC chronic coronary syndromes recommendation before relying on it.",
            },
            {
              kind: "keypoints",
              items: [
                "Angiography-derived FFR is only as good as the projections it is built from.",
                "It is most useful for triage: clearly abnormal or clearly normal values are reliable; values close to 0.80 need a pressure wire.",
                "Avoid it in aorto-ostial and ostial left main disease, acute culprits and poor-quality images.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Acquiring a run with the lesion overlapped by a side branch and then trusting the reconstruction.",
                "Using a single heavily foreshortened view.",
                "Applying it to a territory with recent infarction, where the flow model does not hold.",
              ],
            },
            {
              kind: "pearl",
              text: "If you might want angiography-derived FFR later, acquire the angiogram with it in mind: nitrate, two well-separated views of each intermediate lesion, and no panning.",
            },
          ],
        },
        {
          id: "phy-ad-ct",
          title: "CT-derived FFR in chronic coronary syndromes",
          minutes: 7,
          refs: ["esc-ccs-2024"],
          blocks: [
            {
              kind: "p",
              text: "The 2024 ESC chronic coronary syndromes guideline recommends coronary CT angiography (CCTA) as a first-line test for many patients with a lower clinical likelihood of obstructive disease, and functional imaging for those with a higher likelihood. CCTA is excellent at ruling out disease but overestimates the functional significance of moderate stenoses, particularly when calcium is present. CT-derived FFR addresses that gap.",
            },
            {
              kind: "p",
              text: "CT-FFR applies computational fluid dynamics to the CCTA-derived coronary model, with assumptions about resting flow (scaled to myocardial mass) and the reduction in microvascular resistance during hyperaemia. The result is a colour-coded three-dimensional map of estimated FFR along every vessel. Processing may be off-site or on-site, depending on the system.",
            },
            {
              kind: "steps",
              title: "Reading a CT-FFR result",
              items: [
                { title: "Check image quality", detail: "Motion, misregistration, heavy calcium blooming and poor opacification all degrade the model." },
                { title: "Read at the right point", detail: "Take the value about 1–2 cm distal to the stenosis, not at the vessel tip, where values fall progressively even in normal vessels." },
                { title: "Look at the drop across the lesion", detail: "A focal drop across the stenosis is more meaningful than a low value reached by gradual decline." },
                { title: "Correlate", detail: "Match the value with the anatomical stenosis, the territory and the symptoms." },
              ],
            },
            {
              kind: "table",
              caption: "Interpreting values (approximate)",
              head: ["CT-FFR", "Interpretation"],
              rows: [
                ["> 0.80", "Functionally non-significant; medical therapy"],
                ["0.76–0.80", "Grey zone; decide on symptoms, anatomy and the size of the drop, or confirm invasively"],
                ["≤ 0.75", "Likely significant; consider invasive angiography with a view to revascularisation if symptoms warrant"],
              ],
            },
            {
              kind: "table",
              caption: "Limitations",
              head: ["Limitation", "Why"],
              rows: [
                ["Heavy calcification", "Blooming obscures the lumen and distorts the geometry"],
                ["Motion artefact, arrhythmia, high heart rate", "Misregistration of the coronary model"],
                ["Stents and bypass grafts", "Not reliably modelled"],
                ["Recent infarction, microvascular disease", "Flow and resistance assumptions no longer hold"],
                ["Small or distal vessels", "Resolution limits"],
                ["Processing time and cost", "Not available everywhere; data transfer may be needed"],
              ],
            },
            {
              kind: "p",
              text: "Adding CT-FFR to CCTA has been shown to reduce the proportion of invasive angiograms that find no obstructive disease. The 2024 ESC guideline lists CT-FFR among the options for assessing the functional relevance of a stenosis seen on CCTA; stress perfusion imaging, including CT perfusion, is an alternative.",
            },
            {
              kind: "keypoints",
              items: [
                "CT-FFR is a gatekeeper to the catheter laboratory, not a replacement for invasive physiology when values are borderline.",
                "Read 1–2 cm beyond the lesion and look for a focal drop.",
                "Image quality is the first thing to check.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Reading the lowest value at the distal tip and calling the vessel ischaemic.",
                "Trusting CT-FFR in a heavily calcified or stented segment.",
              ],
            },
          ],
        },
      ],
      quiz: [
        {
          id: "phy-q-ad-1",
          stem: "What does angiography-derived FFR require that wire-based FFR does not?",
          options: [
            "Two well-separated projections of the lesion without overlap",
            "A pressure wire positioned well beyond the lesion",
            "An intravenous adenosine infusion at 140 µg/kg/min",
            "Coronary CT angiography performed before the invasive procedure",
            "Intravascular ultrasound to define the lumen contour",
          ],
          answer: 0,
          explanation:
            "Angiography-derived FFR is computed from a three-dimensional reconstruction, which needs good projections (usually at least 25° apart) without overlap or foreshortening at the lesion. It specifically avoids the wire and the hyperaemic drug; CT is the basis of CT-FFR, a different method.",
          difficulty: 1,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-ad-2",
          stem: "In which lesion is angiography-derived FFR least reliable?",
          options: [
            "An aorto-ostial RCA lesion overlapped by the guide catheter",
            "A mid-LAD lesion seen clearly in two projections",
            "A proximal circumflex lesion with good opacification",
            "A mid-RCA lesion in a stable patient",
          ],
          answer: 0,
          explanation:
            "Aorto-ostial and ostial left main lesions are poorly modelled because the inflow is undefined and the guide catheter overlaps the lesion. The other lesions, if well imaged, are suitable for analysis.",
          difficulty: 2,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-ad-3",
          stem: "On a CT-FFR map, where should the value be read for a mid-LAD stenosis?",
          options: [
            "About 1–2 cm distal to the stenosis",
            "At the distal tip of the LAD",
            "At the ostium of the LAD",
            "At the lowest value anywhere in the vessel",
          ],
          answer: 0,
          explanation:
            "Values fall progressively towards the distal tip even in normal vessels, so reading the tip overcalls ischaemia. The value just beyond the lesion, together with the size of the drop across it, reflects the lesion's contribution.",
          difficulty: 2,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-ad-4",
          stem: "Which situation most limits the accuracy of CT-derived FFR?",
          options: [
            "Heavy calcification with blooming at the stenosis",
            "A regular heart rate of 58 bpm during the scan",
            "A single moderate non-calcified stenosis in the LAD",
            "A large-calibre vessel with a good distal run-off",
          ],
          answer: 0,
          explanation:
            "Calcium blooming obscures the true lumen and distorts the geometry on which the fluid model depends. A slow heart rate improves image quality, and a single non-calcified stenosis in a large vessel is the ideal case.",
          difficulty: 2,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-ad-5",
          stem: "CT-FFR is 0.78 just beyond a 50–69% mid-LAD stenosis in a patient with typical angina on two antianginal drugs. What is the most reasonable approach?",
          options: [
            "Treat it as grey zone; go to invasive angiography with a pressure wire",
            "Proceed directly to PCI of the LAD lesion without any further assessment",
            "Reassure: values above 0.75 are always normal and need no action",
            "Repeat the CT-FFR on the same images to see whether it changes",
          ],
          answer: 0,
          explanation:
            "Values between about 0.76 and 0.80 are a grey zone. With typical, drug-refractory symptoms, invasive angiography with pressure-wire confirmation is appropriate. Proceeding straight to PCI ignores the uncertainty; reprocessing the same images adds little.",
          difficulty: 2,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-ad-6",
          stem: "Why is angiography-derived FFR unreliable in the culprit vessel of an acute MI?",
          options: [
            "The flow model assumes normal microvascular function, disturbed after acute MI",
            "The culprit vessel cannot be seen clearly enough on angiography to reconstruct",
            "Adenosine is contraindicated in acute MI, so the hyperaemic state cannot be induced",
            "Thrombus is always invisible on angiography and distorts the reconstructed lumen",
          ],
          answer: 0,
          explanation:
            "Derived FFR estimates hyperaemic flow from assumptions or frame counts that presume normal microvascular behaviour. After acute infarction the microvasculature is stunned or obstructed, so the modelled pressure loss is wrong. Adenosine is irrelevant because derived FFR does not use it.",
          difficulty: 3,
          refs: ["esc-acs-2023"],
        },
        {
          id: "phy-q-ad-7",
          stem: "Which is a genuine advantage of angiography-derived FFR?",
          options: [
            "It can be calculated offline from a diagnostic angiogram done elsewhere",
            "It is accurate regardless of image quality, overlap or foreshortening",
            "It replaces intravascular imaging for choosing stent diameter and length",
            "It measures microvascular resistance as well as the epicardial gradient",
          ],
          answer: 0,
          explanation:
            "Because it needs only the angiographic images, analysis can be done after the procedure and remotely, saving a wire and a drug. It is highly dependent on image quality, does not size stents, and does not measure microvascular resistance.",
          difficulty: 1,
          refs: ["esc-ccs-2024"],
        },
      ],
      sims: [
        { sim: "physiology", task: "Compare a derived FFR value with a wire-based FFR in the same intermediate lesion, then repeat with an overlapped projection to see how the derived value changes." },
      ],
    },

    // =====================================================================
    // MODULE 3 — MICROVASCULAR
    // =====================================================================
    {
      id: "phy-microvascular",
      title: "The microcirculation, INOCA and MINOCA",
      stage: 3,
      summary:
        "Measure coronary flow reserve and microvascular resistance, classify angina without obstructive disease into endotypes with invasive coronary function testing, perform acetylcholine provocation safely, and work up MINOCA systematically.",
      objectives: [
        "Define CFR, IMR and the resistive reserve ratio and know how each is measured.",
        "Classify ANOCA and INOCA into endotypes and link them to treatment.",
        "Describe acetylcholine provocation testing, the diagnostic criteria for epicardial and microvascular spasm, and its safety precautions.",
        "Work up a patient with a working diagnosis of MINOCA.",
      ],
      lessons: [
        {
          id: "phy-mv-indices",
          title: "Coronary flow reserve, IMR and resistive reserve",
          minutes: 8,
          refs: ["esc-ccs-2024", "brilakis-manual-pci", "kunadian-inoca-2020", "perera-bhf-cmd-2023", "ford-cormica-review-2019"],
          blocks: [
            {
              kind: "p",
              text: "The coronary circulation has two compartments in series: the epicardial arteries, which are conduits, and the microcirculation (pre-arterioles, arterioles and capillaries), which regulates flow. FFR is designed to assess the epicardial compartment and to be largely independent of the microcirculation. To assess the microcirculation you need flow-based indices.",
            },
            {
              kind: "formula",
              name: "Coronary flow reserve",
              expr: "CFR = hyperaemic flow ÷ resting flow  (thermodilution: resting Tmn ÷ hyperaemic Tmn)",
              note: "Tmn is the mean transit time of a saline bolus. CFR reflects both compartments: a low CFR can come from epicardial or microvascular disease, or from high resting flow.",
            },
            {
              kind: "formula",
              name: "Index of microcirculatory resistance",
              expr: "IMR = Pd × hyperaemic Tmn",
              note: "Specific to the microcirculation and relatively independent of epicardial disease and haemodynamics. With a significant epicardial stenosis, a correction for collateral flow is needed.",
            },
            {
              kind: "formula",
              name: "Resistive reserve ratio",
              expr: "RRR = resting microvascular resistance ÷ hyperaemic microvascular resistance (resting Pd × resting Tmn ÷ IMR)",
              note: "The capacity of the microcirculation to dilate. Lower values indicate exhausted vasodilator reserve and have been associated with worse outcomes after STEMI.",
            },
            {
              kind: "steps",
              title: "Bolus thermodilution with a pressure–temperature wire",
              items: [
                { title: "Position", detail: "Pressure–temperature wire in the distal two-thirds of the vessel (usually the LAD), after nitrate, equalised as for FFR." },
                { title: "Resting boluses", detail: "Three brisk intracoronary injections of a few millilitres of room-temperature saline; the system records the resting Tmn." },
                { title: "Hyperaemic boluses", detail: "Repeat during steady-state IV adenosine; the system records hyperaemic Tmn and FFR simultaneously." },
                { title: "Quality", detail: "Consistent injection volume and speed, a coaxial guide, and similar transit times within each set." },
              ],
            },
            {
              kind: "p",
              text: "Doppler wires measure flow velocity directly: CFR is the ratio of hyperaemic to resting average peak velocity, and hyperaemic microvascular resistance (HMR) is Pd divided by hyperaemic velocity. Continuous thermodilution, with saline infused at a known rate through a dedicated microcatheter, measures absolute flow (mL/min) and resistance, and derives a microvascular resistance reserve.",
            },
            {
              kind: "table",
              caption: "Commonly used thresholds",
              head: ["Index", "Abnormal"],
              rows: [
                ["CFR (thermodilution or Doppler)", "< 2.0 or < 2.5: COVADIS allows either; CorMicA used < 2.0 by thermodilution, the UK consensus < 2.5 for both techniques"],
                ["IMR", "≥ 25"],
              ],
            },
            {
              kind: "table",
              caption: "Combining FFR, CFR and IMR",
              head: ["FFR", "CFR", "IMR", "Interpretation"],
              rows: [
                ["> 0.80", "Normal", "Normal", "No epicardial or structural microvascular disease; consider vasospasm testing if symptoms persist"],
                ["≤ 0.80", "Low", "Normal", "Focal epicardial disease; PCI likely to help"],
                ["> 0.80", "Low", "High", "Structural microvascular dysfunction"],
                ["> 0.80", "Low", "Normal", "Functional microvascular dysfunction (high resting flow) or diffuse epicardial disease"],
                ["≤ 0.80", "Normal", "Normal", "Epicardial lesion with preserved flow reserve (FFR–CFR discordance)"],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "FFR answers 'is the epicardial lesion limiting flow?'; CFR and IMR answer 'is the whole system, and the microcirculation in particular, working?'.",
                "A low CFR is not specific; IMR separates microvascular from epicardial causes.",
                "Thermodilution indices depend on consistent injections and steady hyperaemia.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Interpreting IMR uncorrected in the presence of a significant epicardial stenosis with collaterals.",
                "Inconsistent saline injections that produce scattered transit times.",
                "Failing to achieve hyperaemia, which makes both CFR and IMR look worse or better than reality.",
              ],
            },
            {
              kind: "pearl",
              text: "After primary PCI, very high IMR values (above about 40) indicate microvascular obstruction and have been associated with larger infarcts. Physiology in the culprit tells you about the microcirculation, not the lesion.",
            },
          ],
        },
        {
          id: "phy-mv-inoca",
          title: "INOCA, ANOCA and acetylcholine provocation",
          minutes: 9,
          refs: ["esc-ccs-2024", "hanna-pcm", "kunadian-inoca-2020", "ong-covadis-mva-2018", "beltrame-covadis-vsa-2017", "cormica-2018", "perera-bhf-cmd-2023", "ford-cormica-review-2019"],
          blocks: [
            {
              kind: "p",
              text: "Many patients with angina have no obstructive coronary disease on angiography, more often women. They are not reassured by 'normal coronaries' and are not at negligible risk: angina with non-obstructive coronary arteries is associated with impaired quality of life, repeated attendances and adverse events. The 2024 ESC chronic coronary syndromes guideline uses the terms ANOCA (angina with non-obstructive coronary arteries) and INOCA (when ischaemia is demonstrated), and supports invasive coronary function testing in patients with persistent symptoms to identify the mechanism and tailor therapy.",
            },
            {
              kind: "table",
              caption: "Endotypes identified by invasive coronary function testing",
              head: ["Endotype", "Defining findings", "Treatment direction"],
              rows: [
                ["Microvascular angina, structural", "Low CFR and/or high IMR", "Anti-anginal therapy such as beta-blockers; risk factor control"],
                ["Microvascular angina, functional (microvascular spasm)", "Acetylcholine reproduces angina with ischaemic ECG changes without epicardial spasm", "Calcium-channel blockers"],
                ["Vasospastic angina", "Acetylcholine causes ≥ 90% epicardial constriction with angina and ischaemic ECG changes", "Calcium-channel blockers and nitrates; avoid non-selective beta-blockers"],
                ["Mixed", "Both microvascular dysfunction and spasm", "Combined approach"],
                ["Non-cardiac chest pain", "All tests normal", "Reassurance and investigation of other causes"],
              ],
            },
            {
              kind: "p",
              text: "The CorMicA trial showed that stratifying therapy according to the endotype found at coronary function testing improved angina and quality of life compared with standard care.",
            },
            {
              kind: "steps",
              title: "Invasive coronary function test (outline; protocols vary)",
              items: [
                { title: "Prepare", detail: "Stop vasoactive drugs (calcium-channel blockers, long-acting nitrates) beforehand per protocol, avoid caffeine, and consent specifically for provocation testing." },
                { title: "Angiography", detail: "Confirm the absence of obstructive disease; assess any intermediate lesion with FFR." },
                { title: "Microvascular indices", detail: "Pressure–temperature wire in the LAD: FFR, CFR and IMR with IV adenosine." },
                { title: "Acetylcholine provocation", detail: "Incremental intracoronary acetylcholine into the left coronary, given slowly over about 20 seconds per dose (commonly 2, 20 and 100 micrograms, sometimes 200), with angiography, a 12-lead ECG and symptom assessment after each dose." },
                { title: "Reverse", detail: "Intracoronary nitrate at the end, or earlier if spasm is severe, then a final angiogram." },
              ],
            },
            {
              kind: "p",
              text: "Avoid large or long-acting nitrate doses before acetylcholine, because they can suppress spasm and give a false-negative test. The UK consensus and CorMicA protocols still give a low dose of short-acting GTN (200 µg or less) before the adenosine readings: its half-life is about 2 minutes, so little is active by the time acetylcholine is given. Both measure the adenosine indices before acetylcholine, because a positive spasm test can make the later resting flow and CFR inaccurate. Laboratories differ; follow your protocol.",
            },
            {
              kind: "table",
              caption: "Diagnostic criteria for spasm (COVADIS)",
              head: ["Finding", "Epicardial spasm", "Microvascular spasm"],
              rows: [
                ["Reproduction of usual angina", "Yes", "Yes"],
                ["Ischaemic ECG changes", "Yes", "Yes"],
                ["Epicardial vasoconstriction", "≥ 90%", "< 90%"],
              ],
            },
            {
              kind: "pitfalls",
              title: "Safety",
              items: [
                "Bradycardia and transient AV block, particularly when acetylcholine reaches the AV nodal artery (RCA or dominant circumflex): give doses slowly, use lower doses in the RCA, and have temporary pacing available.",
                "Prolonged or multivessel spasm causing hypotension or arrhythmia: give intracoronary nitrate promptly.",
                "Ventricular arrhythmia is rare but possible; a defibrillator must be immediately available.",
                "Complication rates are low in experienced centres; perform testing where the team does it regularly.",
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Normal coronary arteries do not mean a normal coronary circulation.",
                "Testing identifies an endotype, and the endotype determines treatment.",
                "No large or long-acting nitrate before acetylcholine (UK and CorMicA protocols use only low-dose GTN, 200 µg or less); nitrate to reverse spasm and to finish.",
              ],
            },
            {
              kind: "pearl",
              text: "Ask the patient during each acetylcholine dose whether this is 'their' pain. Reproduction of the usual symptom is a diagnostic criterion, not a side effect.",
            },
            {
              kind: "sim",
              sim: "physiology",
              task: "Measure FFR, CFR and IMR in the LAD of a patient with angina and unobstructed arteries, then classify the microvascular endotype.",
            },
          ],
        },
        {
          id: "phy-mv-minoca",
          title: "MINOCA: a working diagnosis",
          minutes: 7,
          refs: ["esc-acs-2023", "scad-esc-2018", "thygesen-4udmi-2018", "mills-5udmi-2026"],
          blocks: [
            {
              kind: "p",
              text: "The 2023 ESC acute coronary syndromes guideline treats MINOCA (myocardial infarction with non-obstructive coronary arteries) as a working diagnosis: acute myocardial infarction by the universal definition, no stenosis of 50% or more in a major epicardial vessel, and no overt alternative explanation at the time of angiography. The work-up then aims to find the mechanism; conditions such as myocarditis and takotsubo syndrome are alternative diagnoses rather than causes of MINOCA. Since August 2026 the fifth universal definition of MI renames MINOCA 'myocardial injury with non-obstructive coronary arteries', still a working diagnosis (no stenosis of 50% or more); if MI is later confirmed, it is classified as primary, secondary or procedure-related (see hb-background-mi).",
            },
            {
              kind: "table",
              caption: "Mechanisms to consider",
              head: ["Group", "Causes"],
              rows: [
                ["Coronary, atherosclerotic", "Plaque rupture, plaque erosion, calcified nodule, with spontaneous thrombolysis"],
                ["Coronary, non-atherosclerotic", "Epicardial spasm, microvascular spasm or dysfunction, spontaneous coronary artery dissection, coronary embolism or in-situ thrombosis"],
                ["Supply–demand mismatch", "Anaemia, tachyarrhythmia, hypotension, hypoxaemia"],
                ["Alternative diagnoses", "Myocarditis, takotsubo syndrome, other cardiomyopathies"],
              ],
            },
            {
              kind: "steps",
              title: "Systematic work-up",
              items: [
                { title: "Re-read the angiogram", detail: "Look for a missed occluded branch, distal embolic cut-offs, haziness or thrombus, and the long smooth narrowing of SCAD." },
                { title: "Assess the LV", detail: "Left ventriculography or echocardiography: a regional pattern that crosses coronary territories suggests takotsubo syndrome." },
                { title: "Intracoronary imaging", detail: "OCT or IVUS at the index procedure when plaque disruption is suspected. Avoid it in suspected SCAD unless the diagnosis is uncertain and the result will change management, because instrumentation can extend the dissection." },
                { title: "Provocation testing", detail: "In selected patients, in experienced centres, to look for spasm. Not in acute SCAD." },
                { title: "Cardiac MRI", detail: "Early, ideally within days. It distinguishes ischaemic injury from myocarditis and takotsubo and is central to the work-up in the 2023 guideline." },
                { title: "Look for emboli and thrombophilia", detail: "Rhythm monitoring for AF, bubble contrast study for a PFO, and thrombophilia testing where appropriate." },
              ],
            },
            {
              kind: "table",
              caption: "Typical CMR patterns",
              head: ["Diagnosis", "Late gadolinium enhancement", "Other features"],
              rows: [
                ["Ischaemic MI", "Subendocardial or transmural, in a coronary territory", "Oedema in the same territory"],
                ["Myocarditis", "Subepicardial or mid-wall, non-territorial", "Oedema, often inferolateral"],
                ["Takotsubo syndrome", "Usually absent or minimal", "Oedema matching the regional wall-motion abnormality"],
                ["Normal CMR", "None", "Consider early resolution, small infarct or timing of the scan"],
              ],
            },
            {
              kind: "table",
              caption: "Management follows the mechanism (outline)",
              head: ["Mechanism", "Management direction"],
              rows: [
                ["Plaque disruption (rupture, erosion)", "Treat as atherosclerotic MI: antiplatelet therapy and full secondary prevention"],
                ["Epicardial or microvascular spasm", "Calcium-channel blockers, with nitrates as needed; address triggers such as smoking"],
                ["SCAD", "Usually conservative; revascularise only for ongoing ischaemia or instability; screen for associated arteriopathy"],
                ["Coronary embolism", "Find and treat the source, for example anticoagulation for AF"],
                ["Supply–demand mismatch", "Correct the precipitant (anaemia, arrhythmia, hypotension)"],
                ["Myocarditis or takotsubo syndrome", "Managed as those conditions; not as MINOCA"],
              ],
            },
            {
              kind: "keypoints",
              items: [
                "MINOCA is a starting point for investigation, not a final diagnosis.",
                "Combining OCT with CMR identifies a likely mechanism in most patients in whom both are performed.",
                "Treatment follows the mechanism: secondary prevention for atherosclerotic causes, calcium-channel blockers for spasm, conservative management for most SCAD.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Labelling the event a 'troponin leak' and discharging without a mechanism.",
                "Instrumenting a suspected SCAD vessel with imaging catheters or wires without a clear need.",
                "Giving long-term dual antiplatelet therapy for myocarditis or takotsubo syndrome where there is no indication.",
              ],
            },
          ],
        },
      ],
      quiz: [
        {
          id: "phy-q-mv-1",
          stem: "What does coronary flow reserve (CFR) measure?",
          options: [
            "Hyperaemic over resting flow, reflecting epicardial and microvascular function",
            "The ratio of distal coronary to aortic pressure at maximal hyperaemia",
            "Microvascular resistance alone, independent of any epicardial artery disease",
            "The difference between resting and hyperaemic aortic pressure during adenosine",
          ],
          answer: 0,
          explanation:
            "CFR is hyperaemic flow divided by resting flow. Because both compartments influence it, a low CFR can result from epicardial stenosis, microvascular dysfunction or high resting flow. Pd/Pa at hyperaemia is FFR; a microvascular-specific index is IMR.",
          difficulty: 1,
          refs: ["esc-ccs-2024"],
        },
        {
          id: "phy-q-mv-2",
          stem: "How is the index of microcirculatory resistance (IMR) calculated, and which value is abnormal?",
          options: [
            "Distal pressure × hyperaemic mean transit time; ≥ 25",
            "Aortic pressure ÷ resting mean transit time; ≥ 2.0",
            "Hyperaemic ÷ resting mean transit time; < 2.0",
            "Distal pressure ÷ aortic pressure at rest; ≤ 0.89",
          ],
          answer: 0,
          explanation:
            "IMR is Pd multiplied by the hyperaemic mean transit time, with values of 25 or more considered abnormal. A ratio of transit times relates to CFR (resting Tmn divided by hyperaemic Tmn gives CFR), and resting Pd/Pa with a 0.89 threshold describes a resting pressure index.",
          difficulty: 2,
          refs: ["esc-ccs-2024", "kunadian-inoca-2020"],
        },
        {
          id: "phy-q-mv-3",
          stem: "A woman with angina and unobstructed arteries has LAD FFR 0.91, CFR 1.6 and IMR 38. Which endotype is identified?",
          options: [
            "Structural microvascular dysfunction (microvascular angina)",
            "Focal epicardial stenosis that is not flow-limiting at rest",
            "Vasospastic angina of the epicardial arteries",
            "Normal coronary physiology with non-cardiac chest pain",
          ],
          answer: 0,
          explanation:
            "A normal FFR excludes a flow-limiting epicardial lesion, while low CFR with high IMR shows impaired microvascular vasodilatation. Vasospastic angina is diagnosed with acetylcholine provocation, not with these indices.",
          difficulty: 2,
          refs: ["esc-ccs-2024", "kunadian-inoca-2020", "ong-covadis-mva-2018"],
        },
        {
          id: "phy-q-mv-4",
          stem: "Which combination fulfils the COVADIS criteria for epicardial coronary spasm during acetylcholine testing?",
          options: [
            "≥ 90% epicardial constriction with the usual angina and ischaemic ECG changes",
            "≥ 50% epicardial vasoconstriction without symptoms or any ECG change",
            "Angina and ischaemic ECG changes without epicardial vasoconstriction",
            "Any degree of epicardial vasoconstriction that then reverses fully with nitrate",
          ],
          answer: 0,
          explanation:
            "Epicardial spasm requires all three: at least 90% constriction, the patient's usual symptoms, and ischaemic ECG changes. Symptoms and ECG changes without significant epicardial constriction define microvascular spasm. Mild diffuse constriction with acetylcholine is a normal finding.",
          difficulty: 2,
          refs: ["esc-ccs-2024", "ong-covadis-mva-2018", "beltrame-covadis-vsa-2017"],
        },
        {
          id: "phy-q-mv-5",
          stem: "Why should a large or long-acting dose of intracoronary nitrate be avoided before acetylcholine provocation?",
          options: [
            "It prevents spasm and causes a false-negative test",
            "It increases the risk of AV block with acetylcholine",
            "It makes IMR falsely high",
            "It interacts chemically with acetylcholine in the catheter",
          ],
          answer: 0,
          explanation:
            "Nitrate dilates the epicardial and, to a degree, the microvascular vessels and can block the spasm the test is designed to provoke. UK consensus and CorMicA protocols therefore use only low-dose, short-acting GTN (200 µg or less, half-life about 2 minutes) before the adenosine readings, and give more nitrate at the end or to reverse severe spasm. AV block during testing results from acetylcholine itself, especially in the right coronary territory, so nitrate does not change that risk.",
          difficulty: 2,
          refs: ["esc-ccs-2024", "kunadian-inoca-2020", "perera-bhf-cmd-2023", "ford-cormica-review-2019"],
        },
        {
          id: "phy-q-mv-6",
          stem: "During acetylcholine injection into the right coronary artery the patient develops transient complete heart block. What is the most appropriate response?",
          options: [
            "Stop injecting; it usually resolves in seconds; have pacing ready; use lower RCA doses",
            "Continue to the next dose, because transient block is expected and confirms a positive test",
            "Give intracoronary adenosine to restore conduction and then repeat the same dose",
            "Abandon the procedure and arrange a permanent pacemaker before discharge",
          ],
          answer: 0,
          explanation:
            "Acetylcholine can cause transient bradycardia and AV block, particularly in the RCA territory, usually resolving quickly after the injection stops. Slow injection, lower RCA doses and immediate access to pacing are standard precautions. Adenosine would worsen AV block, and transient drug-induced block is not an indication for a permanent device.",
          difficulty: 3,
          refs: ["hanna-pcm", "kunadian-inoca-2020"],
        },
        {
          id: "phy-q-mv-7",
          stem: "A 48-year-old woman has a troponin-positive event with unobstructed coronary arteries. Which investigation is most central to establishing the mechanism?",
          options: [
            "Cardiac MRI",
            "Exercise treadmill test",
            "Repeat coronary angiography at six weeks",
            "CT coronary angiography",
          ],
          answer: 0,
          explanation:
            "Cardiac MRI distinguishes ischaemic injury from myocarditis and takotsubo syndrome and is central to the MINOCA work-up in the 2023 ESC guideline. CT and repeat angiography add little once invasive angiography has shown no obstructive disease, and exercise testing does not address the mechanism.",
          difficulty: 2,
          refs: ["esc-acs-2023"],
        },
        {
          id: "phy-q-mv-8",
          stem: "Vasospastic angina is confirmed. Which drug class should be avoided?",
          options: ["Non-selective beta-blockers", "Calcium-channel blockers", "Long-acting nitrates", "Statins"],
          answer: 0,
          explanation:
            "Non-selective beta-blockade can leave alpha-mediated vasoconstriction unopposed and worsen spasm. Calcium-channel blockers are first-line, with nitrates as additional therapy; statins are not harmful.",
          difficulty: 2,
          refs: ["esc-ccs-2024"],
        },
      ],
      sims: [
        { sim: "physiology", task: "Perform bolus thermodilution at rest and during hyperaemia; calculate CFR and IMR and assign the microvascular endotype." },
      ],
    },

    // =====================================================================
    // MODULE 4 — IVUS
    // =====================================================================
    {
      id: "phy-ivus",
      title: "Intravascular ultrasound",
      stage: 3,
      summary:
        "IVUS physics and image anatomy, the measurements that matter, how to use IVUS to plan lesion preparation and stent size and length, and how to optimise the result, including in the left main.",
      objectives: [
        "Explain the trade-off between IVUS frequency, resolution and penetration and identify the layers of the vessel wall.",
        "Measure lumen, EEM and plaque burden and choose reference segments.",
        "Use IVUS to assess calcium, plan lesion preparation, size the stent and choose landing zones.",
        "Apply post-PCI optimisation criteria for expansion, apposition and edges, including left main targets.",
      ],
      lessons: [
        {
          id: "phy-ivus-basics",
          title: "IVUS physics, acquisition and image anatomy",
          minutes: 9,
          refs: ["eapci-imaging-2018", "brilakis-manual-pci", "mintz-ivus-standards-2001"],
          blocks: [
            {
              kind: "p",
              text: "An IVUS catheter carries an ultrasound transducer at its tip and produces cross-sectional images of the vessel as it is pulled back. Frequencies range roughly from 20 to 60 MHz: higher frequencies improve resolution at the cost of penetration. Conventional IVUS resolves structures of roughly 100–200 µm axially, with high-definition systems doing better, and penetrates several millimetres, so it usually shows the full vessel wall to its outer boundary except behind calcium.",
            },
            {
              kind: "table",
              caption: "Catheter types",
              head: ["Type", "How it works", "Practical points"],
              rows: [
                ["Solid-state (phased-array)", "A ring of elements fired electronically; no moving parts", "Quick to prepare; a ring-down zone around the catheter obscures the near field; lower frequency"],
                ["Mechanical (rotational)", "A single rotating transducer inside a sheath", "Higher frequency and resolution; must be flushed to remove air; prone to non-uniform rotational distortion"],
              ],
            },
            {
              kind: "steps",
              title: "Acquisition",
              items: [
                { title: "Anticoagulate and dilate", detail: "Therapeutic anticoagulation and intracoronary nitrate before imaging." },
                { title: "Prepare the catheter", detail: "Flush mechanical catheters to remove air; check the image in the guide before advancing." },
                { title: "Position", detail: "Advance over the wire at least 10 mm beyond the segment of interest." },
                { title: "Motorised pullback", detail: "Use a constant automated pullback speed so that lengths can be measured; note side branches as landmarks." },
                { title: "Review", detail: "Examine the long-axis view to find the minimum lumen and the references, then the cross-sections at each." },
              ],
            },
            {
              kind: "table",
              caption: "Image anatomy",
              head: ["Structure", "Appearance"],
              rows: [
                ["Lumen", "Dark, with moving speckle from blood (more obvious at high frequency)"],
                ["Intima or plaque", "Variable echogenicity; a thin bright inner layer in a normal artery"],
                ["Media", "A thin dark band"],
                ["Adventitia", "Bright outer layer merging with surrounding tissue"],
                ["External elastic membrane (EEM)", "The boundary between media and adventitia: the outer edge of the vessel"],
                ["Landmarks", "Side branches, accompanying veins, the bright pericardium"],
              ],
            },
            {
              kind: "table",
              caption: "Plaque and other findings",
              head: ["Finding", "Appearance", "Significance"],
              rows: [
                ["Soft (hypoechoic) plaque", "Less bright than adventitia", "Lipid-rich or fibrofatty"],
                ["Fibrous plaque", "As bright as adventitia, no shadow", "Stable"],
                ["Calcium", "Brighter than adventitia with acoustic shadowing behind; reverberations", "Measure arc and length; thickness cannot be seen behind the shadow"],
                ["Attenuated plaque", "Deep attenuation (shadowing) without bright calcium", "Lipid or necrotic core; risk of no-reflow and distal embolisation"],
                ["Thrombus", "Lobulated, layered, scintillating, may move", "ACS; distinguish from blood speckle by flushing"],
                ["Dissection", "Flap with a separate channel", "Grade depth and length"],
              ],
            },
            {
              kind: "formula",
              name: "Plaque burden",
              expr: "Plaque burden (%) = (EEM area − lumen area) ÷ EEM area × 100",
              note: "Strictly plaque plus media, because the media cannot be reliably separated from plaque.",
            },
            {
              kind: "list",
              items: [
                "Minimal lumen area (MLA): the smallest lumen cross-section in the lesion.",
                "Reference segments: the most normal-looking cross-sections within about 10 mm proximal and distal to the lesion, before any major side branch.",
                "Remodelling index: lesion EEM area ÷ average reference EEM area. Above 1, positive (outward) remodelling; below 1, negative (constrictive) remodelling.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Measuring with a manual (non-motorised) pullback and then quoting lengths.",
                "Mistaking the guidewire shadow or a ring-down artefact for plaque.",
                "Calling blood speckle thrombus without flushing to check.",
                "Catheter movement through the cardiac cycle shifts the imaged plane by several millimetres; use end-diastolic frames for measurements where possible.",
              ],
            },
            {
              kind: "pearl",
              text: "Find the EEM first. Once the outer boundary is clear, lumen, plaque and remodelling follow; if the EEM is invisible behind calcium over a wide arc, size from the lumen.",
            },
          ],
        },
        {
          id: "phy-ivus-planning",
          title: "Planning PCI with IVUS",
          minutes: 8,
          refs: ["eapci-imaging-2018", "supplied-medmastery", "brilakis-manual-pci"],
          blocks: [
            { kind: "h", text: "Is the lesion significant?" },
            {
              kind: "p",
              text: "IVUS shows anatomy, not physiology. Outside the left main, MLA cut-offs predict FFR poorly and should not be used on their own to decide revascularisation; use a pressure wire. The left main is the exception: an MLA below about 6 mm² is commonly used to indicate significant disease in Western populations, with lower cut-offs (around 4.5 mm²) derived in some Asian cohorts. Image the left main from both the LAD and the circumflex, disengaging the guide to see the ostium.",
            },
            { kind: "h", text: "Calcium and lesion preparation" },
            {
              kind: "table",
              caption: "Calcium features that predict difficulty",
              head: ["Feature", "Why it matters"],
              rows: [
                ["Arc approaching or reaching 360°", "A complete ring resists expansion until it is fractured"],
                ["Long calcified segment (over about 5 mm)", "More resistance over the stent length"],
                ["Superficial location", "Directly restrains the stent; target for atherectomy or lithotripsy"],
                ["Calcified nodule", "Protrudes into the lumen; risks underexpansion and malapposition"],
                ["Reverberations behind the calcium", "Suggest a thin calcium sheet, more likely to crack"],
                ["Small vessel", "Less room for expansion"],
              ],
            },
            {
              kind: "p",
              text: "Choose preparation according to these findings: non-compliant, scoring or cutting balloons for moderate disease; intravascular lithotripsy for deep or circumferential calcium; rotational or orbital atherectomy for superficial calcium or uncrossable lesions. Prepare the vessel before the stent goes in. Once an unprepared lesion has an underexpanded stent in it, the options are few.",
            },
            { kind: "h", text: "Sizing the stent" },
            {
              kind: "table",
              caption: "Approaches to diameter selection",
              head: ["Approach", "Method", "Comment"],
              rows: [
                ["EEM-based", "Mean EEM diameter at the distal reference, rounded down (for example to the nearest 0.25 mm)", "Larger stents and larger final areas; needs a visible EEM"],
                ["Lumen-based", "Mean lumen diameter at the distal reference, rounded up (about 0.25–0.5 mm)", "Safer when the EEM is not visible; may undersize"],
                ["Mid-wall", "Average of lumen and EEM diameters", "A compromise"],
              ],
            },
            {
              kind: "p",
              text: "Size the proximal segment separately: use the proximal reference to choose the post-dilation or proximal optimisation balloon, particularly across bifurcations and in tapering vessels.",
            },
            { kind: "h", text: "Length and landing zones" },
            {
              kind: "list",
              items: [
                "Land both edges in segments with plaque burden below 50% (EAPCI 2018).",
                "Avoid landing on attenuated plaque, lipid or calcium.",
                "Measure length from the motorised pullback between the chosen landing zones; it is more accurate than angiographic estimation, which suffers from foreshortening.",
                "Co-registration with the angiogram shows exactly where each landing zone lies.",
              ],
            },
            {
              kind: "steps",
              title: "Pre-PCI IVUS checklist",
              items: [
                { title: "Minimum lumen", detail: "Location and area." },
                { title: "Plaque", detail: "Burden, distribution and type (attenuated, calcified)." },
                { title: "Calcium", detail: "Arc, length, depth, nodule." },
                { title: "References", detail: "Distal and proximal EEM and lumen diameters." },
                { title: "Landing zones", detail: "Plaque burden below 50%, length between them." },
                { title: "Plan", detail: "Preparation tool, stent diameter and length, post-dilation balloon." },
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Treating a non-left-main lesion because MLA is below 4 mm² without physiology.",
                "Undersizing by using the lesion lumen rather than the reference.",
                "Landing the distal edge in a 'normal-looking' angiographic segment that has 60% plaque burden on IVUS.",
              ],
            },
            {
              kind: "sim",
              sim: "pci-bench",
              task: "Run a pre-PCI IVUS pullback, measure distal and proximal references, choose landing zones with plaque burden below 50%, and select stent diameter, length and a lesion-preparation tool.",
            },
          ],
        },
        {
          id: "phy-ivus-optimisation",
          title: "Post-PCI optimisation and left main IVUS",
          minutes: 8,
          refs: ["eapci-imaging-2018", "ultimate-2018", "esc-ccs-2024", "supplied-medmastery", "kang-lm-ivus-2011"],
          blocks: [
            {
              kind: "p",
              text: "An angiographically good result can hide an underexpanded stent, an edge dissection or untreated disease. Small stent area is the strongest imaging predictor of stent thrombosis and restenosis, which is why expansion comes first in every optimisation checklist.",
            },
            {
              kind: "table",
              caption: "Optimisation criteria (EAPCI 2018 consensus; approximate)",
              head: ["Criterion", "Target", "If not met"],
              rows: [
                ["Absolute expansion (non-left main)", "MSA > 5.5 mm² by IVUS (> 4.5 mm² by OCT)", "High-pressure non-compliant post-dilation; consider lithotripsy if calcium restrains the stent"],
                ["Relative expansion", "MSA > 80% of the average reference lumen area", "As above"],
                ["Apposition", "Correct malapposition if the strut-to-wall distance is > 0.4 mm over > 1 mm length", "Post-dilate, usually with a semi-compliant balloon at low pressure (Brilakis)"],
                ["Edge dissection", "Large dissections (wide arc, longer than a few millimetres, or reaching the media) are associated with events", "Additional stent to cover the dissection"],
                ["Edge disease", "Plaque burden < 50% at each edge", "Extend the stent if the edge lands in significant disease"],
                ["Tissue protrusion and thrombus", "Note extent, particularly in ACS", "Further dilation, antithrombotic therapy"],
              ],
            },
            {
              kind: "p",
              text: "Malapposition on its own, if small and with a well-expanded stent, is less strongly linked to events than underexpansion. Do not oversize the post-dilation balloon to chase a few struts at the cost of edge dissection or perforation. Imaging resolution now reveals small edge microdissections in many cases; small ones with good flow can be left alone.",
            },
            { kind: "h", text: "Left main IVUS" },
            {
              kind: "list",
              items: [
                "Before PCI: MLA, plaque extension into the LAD and circumflex ostia, calcium and vessel size from separate pullbacks in each branch, with the guide disengaged to image the ostium.",
                "Stent sizing: left main vessels are large and taper at the bifurcation; size each segment separately and use proximal optimisation.",
                "After PCI: commonly quoted segmental area targets are approximately 5 mm² at the circumflex ostium, 6 mm² at the LAD ostium, 7 mm² at the polygon of confluence and 8 mm² in the left main above it (the '5-6-7-8' rule derived from Korean data); larger targets may be appropriate in larger vessels.",
                "OCT needs a good flush and coaxial engagement, which is difficult with ostial left main disease; IVUS is usually preferred there.",
              ],
            },
            {
              kind: "p",
              text: "ULTIMATE showed that IVUS-guided implantation in an all-comer population reduced target vessel failure at one year compared with angiography guidance. The 2024 ESC chronic coronary syndromes guideline recommends intravascular imaging to guide PCI of anatomically complex lesions, in particular the left main, true bifurcations and long lesions.",
            },
            {
              kind: "steps",
              title: "Post-stent review, in order",
              items: [
                { title: "Expansion", detail: "Find the MSA; compare it with absolute and relative targets." },
                { title: "Apposition", detail: "Look for struts separated from the wall, especially proximally and in tapering vessels." },
                { title: "Edges", detail: "Dissection, haematoma, residual plaque burden." },
                { title: "Geographic miss", detail: "Untreated significant disease just beyond either edge." },
                { title: "Side branches", detail: "Ostial compromise in bifurcations." },
              ],
            },
            {
              kind: "keypoints",
              items: [
                "Expansion matters most; fix underexpansion before anything else.",
                "Treat large edge dissections; leave small ones with good flow.",
                "In the left main, use IVUS before and after stenting, with targets for each segment.",
              ],
            },
            {
              kind: "sim",
              sim: "pci-bench",
              task: "Post-dilate an underexpanded stent with a non-compliant balloon, re-image with IVUS, and decide whether the expansion and edge criteria are now met.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "phy-q-ivus-1",
          stem: "On IVUS, what does the external elastic membrane (EEM) represent?",
          options: [
            "The boundary between the media and the adventitia",
            "The boundary between the lumen and the intima",
            "The leading edge of calcium",
            "The outer border of the pericardium",
          ],
          answer: 0,
          explanation:
            "The EEM is the interface between the dark media and the bright adventitia, the outer boundary of the vessel used for vessel sizing and plaque burden. The lumen–intima border defines the lumen area.",
          difficulty: 1,
          refs: ["eapci-imaging-2018", "mintz-ivus-standards-2001"],
        },
        {
          id: "phy-q-ivus-2",
          stem: "At the minimal lumen site, EEM area is 14 mm² and lumen area 4 mm². What is the plaque burden?",
          options: ["71%", "29%", "40%", "250%"],
          answer: 0,
          explanation:
            "Plaque burden = (EEM − lumen) ÷ EEM = (14 − 4) ÷ 14 ≈ 71%. Dividing by the lumen instead gives 250%; 29% is the lumen as a fraction of the EEM.",
          difficulty: 1,
          refs: ["eapci-imaging-2018", "mintz-ivus-standards-2001"],
        },
        {
          id: "phy-q-ivus-3",
          stem: "Pre-PCI IVUS of a culprit lesion in ACS shows extensive attenuated plaque without calcium. Which complication is this most associated with?",
          options: [
            "No-reflow from distal embolisation",
            "Coronary perforation during dilatation",
            "Stent underexpansion despite high pressure",
            "Guide catheter dissection of the ostium",
          ],
          answer: 0,
          explanation:
            "Deep attenuation without bright calcium indicates a lipid-rich necrotic core, which is associated with distal embolisation and no-reflow on balloon or stent expansion. Underexpansion is associated with calcium, not attenuated lipid.",
          difficulty: 2,
          refs: ["eapci-imaging-2018"],
        },
        {
          id: "phy-q-ivus-4",
          stem: "Which IVUS finding is commonly used to indicate significant left main disease in Western populations?",
          options: ["MLA below about 6 mm²", "MLA below about 4 mm²", "MLA below about 2.5 mm²", "Plaque burden above 30%"],
          answer: 0,
          explanation:
            "An MLA under about 6 mm² is the commonly used left main threshold in Western practice, with lower cut-offs derived in some Asian cohorts. The 4 mm² figure refers to older non-left-main thresholds, which predict physiology poorly and should not be used alone.",
          difficulty: 2,
          refs: ["supplied-medmastery", "eapci-imaging-2018", "litro-2011"],
        },
        {
          id: "phy-q-ivus-5",
          stem: "Where should the stent edges land according to the EAPCI 2018 consensus?",
          options: [
            "In segments with plaque burden below 50%",
            "At the minimal lumen area",
            "In the most calcified segment, to anchor the stent",
            "Anywhere angiographically normal, regardless of IVUS findings",
          ],
          answer: 0,
          explanation:
            "Landing in segments with plaque burden below 50% reduces edge restenosis and dissection. An angiographically normal segment may carry substantial plaque on IVUS, which is the trap in landing wherever the angiogram looks normal.",
          difficulty: 2,
          refs: ["eapci-imaging-2018"],
        },
        {
          id: "phy-q-ivus-6",
          stem: "Why can IVUS not measure the thickness of a calcified plate?",
          options: [
            "Calcium reflects the ultrasound strongly, leaving the tissue behind in shadow",
            "Calcium is invisible on IVUS and is only seen on fluoroscopy or OCT",
            "IVUS resolution is too high to integrate the echo signal across a thick plate",
            "Calcium absorbs blood speckle, so its outer border merges with the lumen",
          ],
          answer: 0,
          explanation:
            "Calcium reflects almost all the ultrasound energy, producing a bright leading edge with a shadow behind it, so its back surface is not seen. OCT light passes through calcium with little attenuation, so OCT can measure calcium thickness. Reverberations behind the calcium suggest a thin plate.",
          difficulty: 2,
          refs: ["eapci-imaging-2018"],
        },
        {
          id: "phy-q-ivus-7",
          stem: "After stenting a mid-LAD lesion, IVUS shows an MSA of 4.6 mm² with an average reference lumen area of 8.0 mm². What is the best action?",
          options: [
            "High-pressure non-compliant post-dilation within the stent, then re-image",
            "Accept the result because the MSA is above 4.5 mm²",
            "Implant a second stent inside the first",
            "Post-dilate with a balloon 1 mm larger than the reference to ensure expansion",
          ],
          answer: 0,
          explanation:
            "The MSA is below the IVUS target of 5.5 mm² and only about 58% of the reference lumen area, far short of 80%. Post-dilate with a non-compliant balloon at high pressure and re-image. The 4.5 mm² figure is the OCT target, not the IVUS one. Grossly oversized balloons risk edge dissection and perforation.",
          difficulty: 3,
          refs: ["eapci-imaging-2018"],
        },
        {
          id: "phy-q-ivus-8",
          stem: "Which statement about the ULTIMATE trial is correct?",
          options: [
            "In all-comers with DES, IVUS guidance cut one-year target vessel failure",
            "It showed no benefit of IVUS guidance over angiography in any subgroup",
            "It compared IVUS with OCT guidance and found OCT superior at one year",
            "It was restricted to unprotected left main disease treated with two stents",
          ],
          answer: 0,
          explanation:
            "ULTIMATE randomised an all-comer population to IVUS-guided or angiography-guided DES implantation and found lower target vessel failure at one year with IVUS. It did not compare IVUS with OCT and was not limited to the left main.",
          difficulty: 2,
          refs: ["ultimate-2018"],
        },
      ],
      sims: [
        { sim: "pci-bench", task: "Use IVUS to size and place a stent in a calcified proximal LAD lesion, then optimise until expansion and edge criteria are met." },
        { sim: "pci-bench", task: "Perform left main IVUS from both the LAD and circumflex, plan a provisional strategy, and check segmental area targets after stenting." },
      ],
    },

    // =====================================================================
    // MODULE 5 — OCT
    // =====================================================================
    {
      id: "phy-oct",
      title: "Optical coherence tomography",
      stage: 3,
      summary:
        "OCT physics, acquisition and artefacts; how to read plaque, thrombus and the ACS culprit; the OCT calcium score; optimisation criteria; choosing between IVUS and OCT; and the trial evidence for imaging-guided PCI.",
      objectives: [
        "Describe how OCT forms images, why blood must be cleared, and the main artefacts.",
        "Identify fibrous, lipid and calcified plaque, thin-cap fibroatheroma, red and white thrombus, and rupture versus erosion.",
        "Calculate the OCT calcium score and use it to plan lesion preparation.",
        "Apply stent optimisation criteria, choose between IVUS and OCT, and summarise the evidence for imaging guidance.",
      ],
      lessons: [
        {
          id: "phy-oct-basics",
          title: "OCT physics, acquisition and artefacts",
          minutes: 8,
          refs: ["eapci-imaging-2018", "supplied-medmastery"],
          blocks: [
            {
              kind: "p",
              text: "OCT uses near-infrared light (wavelength around 1300 nm) rather than sound. The system measures the delay of light reflected from tissue by interferometry and builds cross-sectional images. Axial resolution is roughly 10–20 µm, about ten times finer than IVUS, but penetration is only 1–2 mm and less through lipid. Light cannot pass through blood, so the vessel is flushed, usually with contrast, during a rapid automated pullback that images a long segment in a few seconds.",
            },
            {
              kind: "table",
              caption: "IVUS and OCT compared",
              head: ["Feature", "IVUS", "OCT"],
              rows: [
                ["Energy", "Ultrasound (about 20–60 MHz)", "Near-infrared light"],
                ["Axial resolution", "Roughly 100–200 µm (finer with high-definition systems)", "Roughly 10–20 µm"],
                ["Penetration", "Several millimetres; EEM usually visible", "1–2 mm; EEM often hidden behind lipid"],
                ["Blood clearance", "Not needed", "Required (contrast or other flush)"],
                ["Pullback", "Slower; long runs without contrast", "Fast, a few seconds per run"],
                ["Calcium", "Arc and length; thickness hidden by shadow", "Arc, length and thickness"],
                ["Thrombus, cap, dissection, apposition", "Limited detail", "Detailed"],
              ],
            },
            {
              kind: "steps",
              title: "Acquisition",
              items: [
                { title: "Anticoagulate and dilate", detail: "Therapeutic anticoagulation and intracoronary nitrate." },
                { title: "Secure the guide", detail: "Coaxial engagement is essential: the flush must fill the vessel rather than reflux into the aorta." },
                { title: "Purge the catheter", detail: "Purge with contrast and check the system in the guide." },
                { title: "Position", detail: "Place the imaging lens (marked radiographically) well beyond the segment of interest." },
                { title: "Flush and pull back", detail: "Inject contrast through the guide (by injector or hand, at the rate the system specifies) and trigger the pullback once the lumen clears. Each run uses roughly 10–20 mL of contrast." },
                { title: "Review", detail: "Check clearance along the whole segment before interpreting." },
              ],
            },
            {
              kind: "table",
              caption: "Common artefacts",
              head: ["Artefact", "Appearance", "Cause"],
              rows: [
                ["Incomplete clearance", "Swirling signal and attenuation in the lumen", "Poor guide engagement, low flush rate, very large vessel"],
                ["Sew-up (seam)", "Misalignment at one point of the circumference", "Rapid movement of wire or vessel during a frame"],
                ["Non-uniform rotational distortion", "Stretched or compressed sectors", "Friction on the rotating catheter in tortuous vessels"],
                ["Guidewire shadow", "A dark wedge behind the wire", "Light blocked by the wire"],
                ["Tangential signal dropout", "Signal-poor area mimicking lipid", "Light striking the wall obliquely from an eccentric catheter"],
                ["Strut blooming and saturation", "Struts appear thicker or streaked", "Very strong reflections"],
                ["Calibration (z-offset) error", "All dimensions systematically wrong", "Incorrect reference calibration"],
              ],
            },
            {
              kind: "pitfalls",
              title: "Limitations",
              items: [
                "Aorto-ostial and ostial left main lesions: the flush leaks into the aorta and the ostium cannot be imaged reliably.",
                "Very large vessels: the field and penetration may not reach the vessel wall.",
                "Chronic kidney disease: each run adds contrast; consider IVUS or reduce runs.",
                "Very tight lesions may block flushing; pre-dilate with a small balloon first if necessary.",
                "Red thrombus and lipid shadow the wall behind them, hiding the EEM.",
              ],
            },
            {
              kind: "pearl",
              text: "Do a small test injection before the real run. If the lumen does not clear completely on the test, improve guide engagement or flush rate first rather than wasting a full run of contrast.",
            },
          ],
        },
        {
          id: "phy-oct-plaque",
          title: "Reading OCT: plaque, thrombus and the culprit",
          minutes: 8,
          refs: ["eapci-imaging-2018", "fujino-calcium-2018", "esc-acs-2023", "tearney-oct-standards-2012"],
          blocks: [
            {
              kind: "table",
              caption: "Tissue characterisation",
              head: ["Tissue", "OCT appearance"],
              rows: [
                ["Normal wall", "Three layers: bright intima, dark media, bright adventitia"],
                ["Fibrous plaque", "Homogeneous, bright (signal-rich), low attenuation"],
                ["Lipid (necrotic core)", "Dark (signal-poor) region with diffuse, poorly defined borders and high attenuation, under a bright fibrous cap"],
                ["Calcium", "Dark or heterogeneous region with sharply delineated borders and low attenuation, so its back edge and thickness are visible"],
                ["Macrophages", "Bright punctate or confluent spots at the cap, casting shadows"],
                ["Cholesterol crystals", "Thin, linear, highly reflective structures"],
                ["Microchannels", "Small dark holes within the plaque"],
                ["Red (erythrocyte-rich) thrombus", "Intraluminal mass, bright surface, high attenuation with shadowing"],
                ["White (platelet-rich) thrombus", "Intraluminal mass, moderately bright, low attenuation, homogeneous"],
              ],
            },
            {
              kind: "p",
              text: "A thin-cap fibroatheroma (TCFA) is a lipid-rich plaque with a fibrous cap thinner than 65 µm, typically with a wide lipid arc. It is the plaque type most associated with rupture and is visible only with the resolution of OCT.",
            },
            {
              kind: "table",
              caption: "ACS culprit mechanisms on OCT",
              head: ["Mechanism", "OCT features"],
              rows: [
                ["Plaque rupture", "Disrupted fibrous cap with a cavity communicating with the lumen, usually over lipid; often thrombus"],
                ["Plaque erosion", "Thrombus over an intact plaque, with no cap rupture; often fibrous or lipid-poor plaque"],
                ["Calcified nodule", "Protruding calcium with a disrupted surface, often with thrombus"],
                ["SCAD", "Intramural haematoma or a double lumen with an intimal–medial flap"],
              ],
            },
            {
              kind: "p",
              text: "The 2023 ESC ACS guideline supports intravascular imaging when the culprit lesion is unclear on angiography. Identifying erosion versus rupture has research and possibly therapeutic implications, but outside trials it does not yet change standard ACS treatment.",
            },
            { kind: "h", text: "OCT calcium score" },
            {
              kind: "table",
              caption: "OCT calcium score (Fujino et al., 2018)",
              head: ["Feature", "Points"],
              rows: [
                ["Maximum calcium arc > 180°", "2"],
                ["Maximum calcium thickness > 0.5 mm", "1"],
                ["Calcium length > 5 mm", "1"],
                ["Total", "0–4; a score of 4 predicts a high risk of stent underexpansion"],
              ],
            },
            {
              kind: "p",
              text: "A useful mnemonic is 'the rule of 5s': more than half the circumference, more than 0.5 mm thick, more than 5 mm long. When the score is high, modify the calcium (atherectomy or intravascular lithotripsy) before stenting, and re-image to look for calcium fractures, which predict good expansion.",
            },
            {
              kind: "keypoints",
              items: [
                "Calcium has sharp borders and low attenuation; lipid has diffuse borders and high attenuation.",
                "TCFA: cap under 65 µm over lipid.",
                "Erosion: thrombus on an intact cap. Rupture: cavity through a broken cap.",
                "OCT calcium score of 4: prepare the lesion before stenting.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Confusing lipid with calcium: look at the borders and whether you can see behind the region.",
                "Calling the shadow behind red thrombus a lipid pool.",
                "Mistaking residual blood from incomplete flushing for thrombus.",
                "Tangential signal dropout mimicking lipid.",
              ],
            },
            {
              kind: "sim",
              sim: "pci-bench",
              task: "Review a pre-PCI OCT pullback through a calcified LAD lesion, score the calcium, and choose a lesion-preparation strategy before stenting.",
            },
          ],
        },
        {
          id: "phy-oct-stent",
          title: "Stent optimisation, IVUS versus OCT, and the evidence",
          minutes: 9,
          refs: ["eapci-imaging-2018", "ultimate-2018", "renovate-2023", "october-2023", "ilumien4-2023", "esc-ccs-2024", "esc-acs-2023", "ilumien3-2016"],
          blocks: [
            {
              kind: "steps",
              title: "Sizing with OCT (one widely used approach)",
              items: [
                { title: "Distal reference EEM", detail: "If the EEM is visible over about half the circumference or more, take the mean EEM diameter and round down (for example to the nearest 0.25 mm) to choose the stent diameter." },
                { title: "If the EEM is not visible", detail: "Use the mean lumen diameter at the distal reference and round up (about 0.25–0.5 mm)." },
                { title: "Length", detail: "Measure between landing zones free of lipid-rich plaque and with low plaque burden." },
                { title: "Proximal optimisation", detail: "Choose the post-dilation balloon from the proximal reference." },
              ],
            },
            {
              kind: "table",
              caption: "OCT optimisation targets (EAPCI 2018 consensus; approximate)",
              head: ["Criterion", "Target"],
              rows: [
                ["Absolute expansion (non-left main)", "MSA > 4.5 mm²"],
                ["Relative expansion", "MSA > 80% of the average reference lumen area"],
                ["Malapposition", "Correct if strut-to-wall distance > 0.4 mm over > 1 mm length"],
                ["Edge dissection", "Treat if large: more than about 60° of the circumference and/or longer than about 3 mm, or involving the media"],
                ["Edges", "Avoid landing in lipid-rich plaque"],
                ["Tissue protrusion and thrombus", "Note extent; large protrusion in ACS may warrant further treatment"],
              ],
            },
            {
              kind: "table",
              caption: "Choosing between IVUS and OCT",
              head: ["Situation", "Better choice", "Reason"],
              rows: [
                ["Ostial left main or aorto-ostial lesion", "IVUS", "No flush needed; ostium visible"],
                ["Large vessel (left main, large proximal segments)", "IVUS", "Penetration and field of view"],
                ["Chronic kidney disease, contrast minimisation", "IVUS", "No contrast flush"],
                ["CTO and subintimal tracking", "IVUS", "Imaging without antegrade flush"],
                ["Calcium thickness, fracture after lithotripsy", "OCT", "Sees through calcium"],
                ["ACS culprit mechanism and thrombus", "OCT", "Resolution"],
                ["Edge dissection, malapposition, tissue protrusion", "OCT", "Resolution"],
                ["Plaque burden at landing zones, EEM sizing", "IVUS", "Penetration to the EEM"],
                ["Stent failure (underexpansion versus neointima)", "Either; OCT gives more detail", "Resolution of struts and tissue"],
              ],
            },
            {
              kind: "table",
              caption: "Evidence for imaging-guided PCI (direction of findings)",
              head: ["Trial", "Population", "Comparison", "Finding"],
              rows: [
                ["ULTIMATE (2018)", "All-comers receiving drug-eluting stents", "IVUS vs angiography guidance", "Lower target vessel failure at one year with IVUS"],
                ["RENOVATE-COMPLEX-PCI (2023)", "Complex coronary lesions", "IVUS or OCT vs angiography guidance", "Lower target-vessel failure with imaging guidance"],
                ["OCTOBER (2023)", "Complex bifurcation lesions", "OCT vs angiography guidance", "Fewer major adverse cardiac events at two years with OCT"],
                ["ILUMIEN IV (2023)", "High-risk patients or complex lesions", "OCT vs angiography guidance", "Larger minimum stent area with OCT; no significant difference in target-vessel failure at two years; fewer stent thromboses as a secondary finding"],
              ],
            },
            {
              kind: "p",
              text: "The 2024 ESC chronic coronary syndromes guideline recommends intravascular imaging (IVUS or OCT) to guide PCI of anatomically complex lesions, in particular the left main, true bifurcations and long lesions. The 2023 ESC ACS guideline also supports imaging guidance in ACS and its use to clarify an ambiguous culprit.",
            },
            {
              kind: "keypoints",
              items: [
                "Image to plan, image to optimise, and act on what you see.",
                "IVUS for the ostium, large vessels and contrast limitation; OCT for calcium thickness, thrombus and fine detail.",
                "Trial benefit comes from optimisation, not just acquisition: an image that changes nothing changes no outcome.",
              ],
            },
            {
              kind: "pitfalls",
              items: [
                "Chasing perfect numbers with oversized balloons and causing edge dissection or perforation.",
                "Spending effort on small, clinically minor malapposition while ignoring underexpansion.",
                "Using OCT in an ostial left main lesion and failing to clear the ostium.",
              ],
            },
            {
              kind: "pearl",
              text: "Write down the three numbers before you post-dilate: distal reference lumen area, proximal reference lumen area and the MSA target (80% of their average). Then you know exactly what you are aiming for.",
            },
            {
              kind: "sim",
              sim: "pci-bench",
              task: "Size a stent from OCT using the distal EEM, deploy it, then assess expansion, apposition and edges against the EAPCI criteria and correct any shortfall.",
            },
          ],
        },
      ],
      quiz: [
        {
          id: "phy-q-oct-1",
          stem: "Why must blood be cleared from the vessel during OCT acquisition?",
          options: [
            "Red cells scatter near-infrared light, so tissue cannot be seen through blood",
            "Blood clots on the imaging catheter during the pullback and obscures the lens",
            "Contrast improves the ultrasound signal reflected from the vessel wall",
            "Blood raises the pullback speed above the rate the console can record",
          ],
          answer: 0,
          explanation:
            "OCT uses light, which red cells scatter heavily, so the lumen must be flushed (usually with contrast) during the pullback. IVUS uses ultrasound, which passes through blood, which is why IVUS needs no flush.",
          difficulty: 1,
          refs: ["eapci-imaging-2018"],
        },
        {
          id: "phy-q-oct-2",
          stem: "On OCT, a signal-poor region with sharply delineated borders through which the outer vessel structures remain visible is most likely:",
          options: ["Calcium", "Lipid", "Red thrombus", "Fibrous tissue", "Macrophage accumulation"],
          answer: 0,
          explanation:
            "Calcium is signal-poor with sharp borders and low attenuation, so you can see behind it and measure its thickness. Lipid is also signal-poor but has diffuse borders and high attenuation, hiding what lies beyond. Fibrous tissue is signal-rich.",
          difficulty: 2,
          refs: ["eapci-imaging-2018", "tearney-oct-standards-2012"],
        },
        {
          id: "phy-q-oct-3",
          stem: "Which OCT definition describes a thin-cap fibroatheroma?",
          options: [
            "Lipid-rich plaque with a fibrous cap thinner than 65 µm",
            "Calcified plaque with a calcium arc of more than 180°",
            "Fibrous plaque with a fibrous cap thinner than 500 µm",
            "Any plaque with overlying thrombus at the minimal lumen",
          ],
          answer: 0,
          explanation:
            "A TCFA is a lipid-rich plaque with a cap under 65 µm, a thickness only OCT can resolve. Calcium arc is part of the calcium score, not the TCFA definition; overlying thrombus describes a complicated plaque, not specifically a TCFA.",
          difficulty: 2,
          refs: ["eapci-imaging-2018", "tearney-oct-standards-2012"],
        },
        {
          id: "phy-q-oct-4",
          stem: "OCT of an NSTEMI culprit shows white thrombus attached to a plaque with an intact fibrous cap and no cavity. What is the mechanism?",
          options: ["Plaque erosion", "Plaque rupture", "Calcified nodule", "Spontaneous coronary artery dissection", "Coronary embolism"],
          answer: 0,
          explanation:
            "Thrombus over an intact cap without a cavity defines erosion. Rupture requires a disrupted cap with a cavity communicating with the lumen. A calcified nodule shows protruding, disrupted calcium.",
          difficulty: 2,
          refs: ["eapci-imaging-2018", "esc-acs-2023"],
        },
        {
          id: "phy-q-oct-5",
          stem: "Pre-PCI OCT shows calcium with a maximum arc of 240°, maximum thickness 0.8 mm and length 7 mm. What is the OCT calcium score and its implication?",
          options: [
            "4: high risk of stent underexpansion; modify the calcium before stenting",
            "3: moderate risk; stent directly with high-pressure post-dilation",
            "2: low risk; standard pre-dilation",
            "4: stent underexpansion is unlikely",
          ],
          answer: 0,
          explanation:
            "Arc over 180° scores 2, thickness over 0.5 mm scores 1 and length over 5 mm scores 1, for a total of 4. A score of 4 predicts underexpansion, so calcium modification (atherectomy or lithotripsy) should precede stenting. A common error is to give 1 point for the arc rather than 2.",
          difficulty: 2,
          refs: ["fujino-calcium-2018"],
        },
        {
          id: "phy-q-oct-6",
          stem: "Which intraluminal finding is most typical of red (erythrocyte-rich) thrombus on OCT?",
          options: [
            "A bright mass with high attenuation casting a shadow",
            "A homogeneous mass with low attenuation and little shadow",
            "A thin, linear, highly reflective structure within the plaque",
            "Small dark holes within the plaque, a few hundred microns across",
          ],
          answer: 0,
          explanation:
            "Red thrombus is signal-rich at the surface with strong attenuation and shadowing. White, platelet-rich thrombus is moderately bright with low attenuation. Linear reflective structures suggest cholesterol crystals; small dark holes are microchannels.",
          difficulty: 2,
          refs: ["eapci-imaging-2018", "tearney-oct-standards-2012"],
        },
        {
          id: "phy-q-oct-7",
          stem: "Which lesion is better imaged with IVUS than with OCT?",
          options: [
            "An ostial left main stenosis",
            "A suspected thin-cap fibroatheroma",
            "Calcium thickness before lithotripsy",
            "Strut-level malapposition in a 3 mm vessel",
          ],
          answer: 0,
          explanation:
            "The ostial left main cannot be reliably flushed for OCT because contrast refluxes into the aorta, and the vessel is large. IVUS needs no flush and penetrates further. The other three require the fine resolution of OCT.",
          difficulty: 2,
          refs: ["eapci-imaging-2018", "supplied-medmastery"],
        },
        {
          id: "phy-q-oct-8",
          stem: "What was the main result of ILUMIEN IV, comparing OCT-guided and angiography-guided PCI in high-risk patients or complex lesions?",
          options: [
            "Larger minimum stent area with OCT, but no significant difference in TVF at two years",
            "OCT guidance significantly reduced all-cause mortality compared with angiography",
            "Angiography guidance produced larger stent areas because of less conservative sizing",
            "OCT guidance significantly increased stent thrombosis because of more post-dilatation",
          ],
          answer: 0,
          explanation:
            "OCT achieved a larger minimum stent area, but the primary clinical endpoint, target-vessel failure at two years, was not significantly different; stent thrombosis was less frequent with OCT as a secondary finding. It did not show a mortality benefit.",
          difficulty: 3,
          refs: ["ilumien4-2023"],
        },
        {
          id: "phy-q-oct-9",
          stem: "Post-stent OCT shows a distal edge dissection extending into the media, 4 mm long and spanning 100° of the circumference, with TIMI 3 flow. What is the most appropriate action?",
          options: [
            "Cover it with an additional short stent landing in a healthy segment",
            "Leave it, because all OCT-detected edge dissections are benign",
            "Post-dilate the edge with an oversized balloon",
            "Give glycoprotein IIb/IIIa inhibitor and leave it",
          ],
          answer: 0,
          explanation:
            "This dissection is large by EAPCI criteria (more than about 60° of the circumference, longer than about 3 mm and involving the media), and such dissections are associated with events, so cover it with a stent. Small intimal flaps with good flow can be left, which is why leaving it alone is tempting, but this one is not small. Oversized balloons risk extending the dissection.",
          difficulty: 2,
          refs: ["eapci-imaging-2018"],
        },
      ],
      sims: [
        { sim: "pci-bench", task: "Use OCT to score calcium, prepare the lesion, size the stent from the distal EEM, then optimise until expansion and edge criteria are met." },
      ],
      caseIds: ["phy-case-oct-underexpansion"],
    },
  ],

  // =======================================================================
  // CASES
  // =======================================================================
  cases: [
    {
      id: "phy-case-damped-guide",
      title: "Intermediate LAD lesion: a reassuring FFR that was not",
      trackId: "physiology-imaging",
      stage: 3,
      provenance: { kind: "synthetic", basedOn: "Common pressure-wire artefact from deep guide intubation" },
      summary:
        "A man with angina has an intermediate mid-LAD stenosis. The first FFR is reassuring, but the aortic trace tells a different story.",
      presentation:
        "A 59-year-old man has typical exertional angina (CCS class II) despite bisoprolol and amlodipine. CT coronary angiography showed a calcium score of 410 and a mid-LAD stenosis estimated at 50–69%; CT-FFR was not available. He has had no other functional test. Invasive angiography via the right radial artery with a 6 Fr EBU 3.5 guide (no side holes) shows a 15 mm mid-LAD lesion just beyond a large first diagonal, visually about 60%. The other vessels have mild disease only.",
      findings: [
        "BP 138/82 mmHg, HR 64 bpm, sinus rhythm.",
        "Echo: LVEF 60%, no regional wall-motion abnormality.",
        "Creatinine 84 µmol/L. No asthma.",
        "Heparin 70 units/kg given; ACT in range.",
      ],
      steps: [
        {
          id: "s1",
          prompt: "How should you assess this lesion?",
          options: [
            {
              text: "Stent it: a 60% stenosis in the LAD is significant",
              feedback:
                "Visual assessment of intermediate lesions is unreliable. FAME showed that physiology-guided PCI leads to fewer stents and better outcomes than angiography-guided PCI.",
              next: "s2",
            },
            {
              text: "Invasive physiology with a pressure wire (FFR or a resting index such as iFR)",
              best: true,
              feedback:
                "Correct. An angiographically intermediate stenosis without prior functional evidence of ischaemia should be assessed physiologically before deciding on PCI.",
              next: "s2",
            },
            {
              text: "Stop and arrange stress perfusion imaging",
              acceptable: true,
              feedback:
                "Reasonable, but it adds a second test and delay when the question can be answered now with a wire.",
              next: "s2",
            },
            {
              text: "IVUS: treat if the MLA is below 4 mm²",
              feedback:
                "Outside the left main, MLA thresholds predict physiology poorly and should not decide revascularisation on their own.",
              next: "s2",
            },
          ],
        },
        {
          id: "s2",
          prompt: "Which sequence of set-up steps is correct?",
          options: [
            {
              text: "Cross the lesion first, then equalise once the sensor is in its final position",
              feedback:
                "Equalising distal to the lesion sets its pressure drop to zero and makes the study meaningless.",
              next: "s3",
            },
            {
              text: "Skip intracoronary nitrate to avoid hypotension during adenosine",
              feedback:
                "Nitrate is needed to abolish spasm and dilate the epicardial vessel; omitting it can make the lesion look worse than it is.",
              next: "s3",
            },
            {
              text: "Intracoronary nitrate; calibrate the wire flat on the table; advance the sensor just beyond the guide tip; remove the introducer, seal the valve and flush contrast out; equalise; then cross and position the sensor well beyond the lesion",
              best: true,
              feedback:
                "Correct. Equalisation must be done with the sensor at the guide tip, with no introducer in the valve and no contrast in the guide, before the lesion is crossed.",
              next: "s3",
            },
          ],
        },
        {
          id: "s3",
          prompt: "What do you do now?",
          info:
            "Resting Pd/Pa 0.95. IV adenosine 140 micrograms/kg/min via an antecubital vein: the patient feels flushed and breathless and HR rises to 78 bpm. The aortic trace loses its dicrotic notch and develops a ventricularised shape. Lowest stable Pd/Pa 0.87. Fluoroscopy shows the guide deeply seated in the left main.",
          options: [
            {
              text: "Recognise guide obstruction: withdraw the guide slightly from the ostium, confirm a normal aortic trace, and repeat the hyperaemic measurement",
              best: true,
              feedback:
                "Correct. A deep guide limits hyperaemic inflow, so the lesion's gradient is underestimated and FFR is falsely high. IV adenosine allows the guide to be disengaged during measurement.",
              next: "s4",
            },
            {
              text: "Accept FFR 0.87 and defer PCI",
              feedback:
                "The ventricularised trace shows that the measurement conditions are invalid. Deferring on this value risks leaving a significant lesion untreated.",
              next: "s3-false-reassurance", stateDelta: {"stability": -15, "flags": ["false-deferral"]} },
            {
              text: "Switch to iFR, which is unaffected by guide position",
              feedback: "All Pd/Pa indices depend on an accurate aortic pressure and unobstructed flow.",
              next: "s4",
            },
            {
              text: "Give an intracoronary adenosine bolus through the deeply seated guide",
              feedback: "This does not address the obstruction caused by the guide, which is the source of the error.",
              next: "s4",
            },
          ],
        },
        {
          id: "s4",
          prompt: "Before you act on this result, what must you do?",
          info:
            "With the guide disengaged and a normal aortic trace, steady-state hyperaemia gives a lowest Pd/Pa of 0.74. Hyperaemic pullback: Pd/Pa rises abruptly from 0.76 to 0.94 across the lesion, then gradually from 0.94 to 0.98 along the proximal LAD.",
          options: [
            {
              text: "Bring the sensor back to the guide tip and check for drift: Pd/Pa should read 1.00 ± about 0.02, otherwise re-equalise and repeat",
              best: true,
              feedback:
                "Correct. Drift can move the reading in either direction, and you are about to place a stent on the basis of this value.",
              next: "s5",
            },
            {
              text: "Nothing more is needed; proceed to PCI",
              feedback: "Always confirm the absence of drift before acting on a pressure-wire value.",
              next: "s4-unchecked-drift", stateDelta: {"stability": -10} },
            {
              text: "Repeat the measurement with intracoronary papaverine",
              feedback: "Hyperaemia has already been achieved with a valid trace. Papaverine adds a risk of QT prolongation and VT without new information.",
              next: "s5",
            },
          ],
        },
        {
          id: "s5",
          prompt: "Pd/Pa at the guide tip reads 0.99. What is your management?",
          options: [
            {
              text: "Defer: the earlier value of 0.87 is reassuring",
              feedback: "That value was produced by guide obstruction and should be discarded.",
              next: "s3-false-reassurance", stateDelta: {"stability": -15, "flags": ["false-deferral"]} },
            {
              text: "FFR 0.74 with a focal step: PCI is appropriate for symptoms on two antianginal drugs; use intravascular imaging to size and optimise, and re-measure FFR after stenting",
              best: true,
              feedback:
                "Correct. A valid, drift-free FFR well below 0.80 with a focal step predicts that stenting will restore near-normal physiology and relieve symptoms.",
              next: "s6",
            },
            {
              text: "Refer for CABG because of diffuse disease",
              feedback: "The pullback shows a focal step with only minor gradual loss elsewhere. This is focal disease suited to PCI.",
              next: "s6",
            },
          ],
        },
        {
          id: "s6",
          prompt: "You leave the pressure wire in the distal LAD and add a workhorse wire for the PCI. What must you avoid?",
          options: [
            {
              text: "Deploying the stent with the pressure wire lying alongside the delivery wire, which would jail it behind the stent",
              best: true,
              feedback:
                "Correct. A jailed pressure wire can fracture at the sensor section on removal. Either withdraw it before deployment and reinsert it afterwards, or perform the PCI over the pressure wire alone.",
            },
            {
              text: "Using the pressure wire to remeasure FFR after stenting",
              feedback: "Remeasuring after stenting is good practice, provided the wire was not jailed and the connector is wiped and dried before reconnecting.",
            },
            {
              text: "Disconnecting the pressure wire during the PCI",
              feedback: "Disconnecting is necessary to load equipment over it; just clean and dry the connector before reconnecting.",
            },
          ],
        },
        {
          "id": "s3-false-reassurance",
          "kind": "consequence",
          "info": "Seven weeks later he is admitted with an anterior NSTEMI. Angiography shows the same mid-LAD lesion, now subtotal with haziness.",
          "prompt": "Reviewing the first study, why was the FFR falsely reassuring, and what do you do now?",
          "options": [
            {
              "text": "The damped, deeply seated guide limited hyperaemic flow and the aortic reference; treat the culprit now and learn to watch the aortic trace",
              "best": true,
              "feedback": "Guide obstruction lowers Pa and flow, making FFR look better than it is; the culprit now needs treatment.",
              "stateDelta": {
                "stability": 0
              }
            },
            {
              "text": "FFR is unreliable in the LAD; stop using physiology",
              "feedback": "The method was sound; the measurement conditions were not.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Repeat FFR before treating the subtotal culprit",
              "feedback": "An ACS culprit with haziness is treated on angiographic grounds; FFR is not used in the culprit vessel.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
        {
          "id": "s4-unchecked-drift",
          "kind": "consequence",
          "info": "After the stent, the sensor is pulled back to the guide tip and reads Pd/Pa 0.92: the signal had drifted by about 0.08.",
          "prompt": "What does the drift mean for the decision you made?",
          "options": [
            {
              "text": "The true lesion FFR was higher than measured; repeat the assessment practice next time and document the drift-corrected values",
              "best": true,
              "feedback": "Drift beyond about ±0.02 invalidates the reading; a drift check before acting is mandatory.",
              "stateDelta": {
                "stability": 0
              }
            },
            {
              "text": "Ignore it: drift only matters for resting indices",
              "feedback": "Drift affects every pressure-derived index.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Add a second stent to be sure the vessel is treated",
              "feedback": "Stenting more because of a measurement error compounds the problem.",
              "stateDelta": {
                "stability": -15
              }
            }
          ]
        },
      ],
      outcome:
        "A 3.0 × 18 mm drug-eluting stent was implanted under IVUS guidance and post-dilated with a non-compliant balloon; final MSA was 7.1 mm² (over 90% of the reference lumen). Post-PCI FFR was 0.91 with no residual step. At three months he was free of angina.",
      outcomeVariants: [
        {
          "flag": "false-deferral",
          "text": "Deferring on a measurement taken with an obstructing guide led to a later infarct in the territory."
        }
      ],
      learningPoints: [
        "Deep guide intubation obstructs hyperaemic inflow and makes FFR falsely high; watch the aortic waveform.",
        "Disengage the guide during IV adenosine for ostial and proximal lesions or when the trace damps.",
        "Check drift at the guide tip before acting on any value.",
        "A focal step on pullback predicts a good physiological result from stenting.",
        "Never jail a pressure wire behind a stent.",
      ],
      refs: ["supplied-medmastery", "fame-2009", "esc-ccs-2024"],
    },
    {
      id: "phy-case-oct-underexpansion",
      title: "Post-stent OCT: underexpansion and an edge dissection",
      trackId: "physiology-imaging",
      stage: 3,
      provenance: { kind: "synthetic", basedOn: "Typical calcified LAD PCI without pre-stent imaging" },
      summary:
        "A stent in a calcified LAD looks acceptable on angiography. OCT shows underexpansion over thick calcium and a large distal edge dissection.",
      presentation:
        "A 71-year-old woman with diabetes and chronic kidney disease (eGFR 52 mL/min/1.73 m²) has CCS class III angina despite two antianginal drugs. Angiography shows a heavily calcified proximal LAD stenosis of about 85%, which is significant on physiology. The operator pre-dilated with a 2.5 mm non-compliant balloon at 18 atm, which expanded with a slight waist, and deployed a 3.0 × 28 mm drug-eluting stent at 14 atm. The angiographic result looks acceptable with a mild waist. OCT is performed.",
      findings: [
        "BP 132/70 mmHg, HR 72 bpm; no chest pain.",
        "TIMI 3 flow throughout.",
        "Contrast used so far: 120 mL.",
      ],
      steps: [
        {
          id: "s1",
          prompt: "How do you interpret the stent result?",
          info:
            "OCT: MSA 4.0 mm² in the mid-stent over calcium with an arc of 280°, maximum thickness 0.9 mm and length 8 mm. Distal reference lumen area 6.6 mm² (mean EEM diameter 3.3 mm); proximal reference lumen area 9.0 mm²; average reference lumen area 7.8 mm². No malapposition over 0.4 mm. At the distal edge: a dissection 4 mm long spanning 100° of the circumference and extending into the media, with no intramural haematoma.",
          options: [
            {
              text: "Acceptable: the angiographic result is reasonable and flow is TIMI 3",
              feedback: "Angiography hides eccentric underexpansion. The OCT numbers are well below target.",
              next: "s1-accepted-underexpansion", stateDelta: {"stability": -15, "flags": ["underexpanded"]} },
            {
              text: "The main problem is malapposition",
              feedback: "There is no malapposition over 0.4 mm. The problem is underexpansion over calcium.",
              next: "s2",
            },
            {
              text: "Significant underexpansion: MSA 4.0 mm² is below the OCT target of 4.5 mm² and only about 51% of the average reference lumen area (target over 80%)",
              best: true,
              feedback: "Correct. Underexpansion is the strongest imaging predictor of stent thrombosis and restenosis and must be corrected.",
              next: "s2",
            },
          ],
        },
        {
          id: "s2",
          prompt: "What would the OCT calcium score have been, and what does it imply for how this lesion should have been treated?",
          options: [
            {
              text: "Score 2: low risk",
              feedback: "An arc over 180° alone scores 2; thickness and length each add 1, for a total of 4.",
              next: "s3",
            },
            {
              text: "Arc over 180° (2) + thickness over 0.5 mm (1) + length over 5 mm (1) = 4: high risk of underexpansion; the calcium should have been modified before stenting",
              best: true,
              feedback:
                "Correct. Pre-PCI imaging would have shown a score of 4, prompting atherectomy or lithotripsy before the stent. Prepare the vessel first.",
              next: "s3",
            },
            {
              text: "OCT cannot measure calcium thickness, so no score is possible",
              feedback: "That limitation applies to IVUS. OCT light passes through calcium, so its thickness is measurable.",
              next: "s3",
            },
          ],
        },
        {
          id: "s3",
          prompt: "How do you treat the underexpansion first?",
          options: [
            {
              text: "A 4.0 mm non-compliant balloon at 24 atm",
              feedback: "The distal EEM is 3.3 mm. A 4.0 mm balloon at high pressure risks rupture, particularly against rigid calcium.",
              next: "s3-oversized-perforation", stateDelta: {"stability": -20} },
            {
              text: "Leave it: underexpansion only matters in the left main",
              feedback: "Underexpansion predicts stent failure in any vessel.",
              next: "s4",
            },
            {
              text: "Proceed directly to intravascular lithotripsy within the stent",
              acceptable: true,
              feedback:
                "Reasonable with this much calcium, but a high-pressure non-compliant balloon is the usual first step and may suffice.",
              next: "s4",
            },
            {
              text: "High-pressure post-dilation within the stent with a short non-compliant balloon sized to the reference (for example 3.25 mm), kept inside the stent, then re-image",
              best: true,
              feedback:
                "Correct. A non-compliant balloon delivers controlled force. Keep it within the stent edges to avoid extending the dissection.",
              next: "s4",
            },
          ],
        },
        {
          id: "s4",
          prompt: "What next?",
          info:
            "After a 3.25 mm non-compliant balloon at 24 atm, the balloon still showed a waist. OCT: MSA 5.0 mm² (64% of the average reference lumen area).",
          options: [
            {
              text: "Rotational atherectomy through the stent as the next step",
              feedback: "Ablating through stent struts is a last-resort bailout, with risks of burr entrapment and embolisation of metal debris.",
              next: "s5",
            },
            {
              text: "Accept the result: the MSA now exceeds 4.5 mm²",
              acceptable: true,
              feedback:
                "The absolute OCT target is met, but relative expansion is only 64% in a 3.3 mm vessel and the balloon still waisted. Further optimisation is reasonable if it can be done safely.",
              next: "s1-accepted-underexpansion", stateDelta: {"stability": -10, "flags": ["underexpanded"]} },
            {
              text: "Intravascular lithotripsy within the stent (used off-label for underexpanded stents in many centres), followed by repeat non-compliant post-dilation and OCT",
              best: true,
              feedback:
                "Correct. Lithotripsy fractures calcium behind the struts and frequently allows further expansion. Follow local practice and the device's instructions for use.",
              next: "s5",
            },
          ],
        },
        {
          id: "s5",
          prompt: "Expansion is now adequate. How do you manage the distal edge dissection?",
          info:
            "After lithotripsy and repeat 3.25 mm non-compliant post-dilation at 22 atm: MSA 6.4 mm² (82% of the average reference lumen area). The distal edge dissection is unchanged: 4 mm long, spanning 100°, extending into the media; TIMI 3 flow. The segment 5 mm beyond the dissection has a fibrous wall with lumen area 6.0 mm².",
          options: [
            {
              text: "Leave it: OCT-detected edge dissections are benign",
              feedback:
                "Small intimal flaps with good flow can be left, but this one is large and medial.",
              next: "s6",
            },
            {
              text: "Cover it with a short additional stent sized to the distal reference, landing in the fibrous, low-plaque segment beyond, then re-image",
              best: true,
              feedback:
                "Correct. By EAPCI criteria this dissection is large (more than about 60° of the circumference, longer than about 3 mm and medial) and is associated with events, so it should be covered.",
              next: "s6",
            },
            {
              text: "Prolonged low-pressure inflation of a compliant balloon over the dissection",
              feedback: "This may tack down a minor flap, but it is unreliable for a large medial dissection and delays definitive treatment.",
              next: "s6",
            },
          ],
        },
        {
          id: "s6",
          prompt: "The final OCT is satisfactory. What else matters before she leaves the laboratory?",
          info:
            "Final OCT: MSA 6.4 mm² (82%), new distal stent well expanded and apposed, distal edge in fibrous tissue without dissection. Total contrast 210 mL.",
          options: [
            {
              text: "One more OCT run to document the proximal stent in detail",
              feedback: "The proximal stent has already been assessed. Another run adds contrast without changing management.",
            },
            {
              text: "No further steps are needed",
              feedback: "With CKD and over 200 mL of contrast, kidney protection and monitoring are needed.",
            },
            {
              text: "Plan kidney protection: hydration per local protocol and a creatinine check at 48–72 hours, given CKD and a large contrast volume; record the imaging findings and the lesson about pre-stent imaging",
              best: true,
              feedback:
                "Correct. Each OCT run added contrast in a patient with CKD. In a similar future case, IVUS-guided preparation or fewer OCT runs would lower the contrast load.",
            },
          ],
        },
        {
          "id": "s1-accepted-underexpansion",
          "kind": "consequence",
          "info": "Eight months later she presents with crescendo angina. Angiography shows focal in-stent restenosis at the site of the underexpanded segment.",
          "prompt": "How do you approach the restenosis?",
          "options": [
            {
              "text": "Image first; expand the underexpanded stent with high-pressure NC balloons or lithotripsy before any drug-coated balloon or second stent",
              "best": true,
              "feedback": "Mechanical underexpansion must be corrected; another layer of metal over it repeats the problem.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Implant a second drug-eluting stent inside the first",
              "feedback": "A second stent inside an underexpanded one leaves the mechanical cause in place.",
              "stateDelta": {
                "stability": -10
              }
            },
            {
              "text": "Drug-coated balloon without imaging",
              "acceptable": true,
              "feedback": "A DCB treats neointima but not the underexpansion that caused it.",
              "stateDelta": {
                "stability": -5
              }
            }
          ]
        },
        {
          "id": "s3-oversized-perforation",
          "kind": "consequence",
          "info": "With the 4.0 mm NC balloon at 24 atm the patient feels sharp pain; the next injection shows contrast staining outside the vessel with a small jet (Ellis III).",
          "prompt": "The oversized balloon has perforated the vessel. What do you do?",
          "options": [
            {
              "text": "Reinflate a balloon at low pressure across the perforation, call for help and echo, and prepare a covered stent",
              "best": true,
              "feedback": "Immediate balloon tamponade buys time for definitive sealing.",
              "stateDelta": {
                "stability": 5
              }
            },
            {
              "text": "Give protamine and withdraw the equipment",
              "feedback": "Withdrawing loses control of the vessel; reversal comes later, once inflow is stopped.",
              "stateDelta": {
                "stability": -20
              }
            },
            {
              "text": "Repeat the injection to see how large the leak is",
              "feedback": "Each injection pushes more contrast and blood into the pericardium.",
              "stateDelta": {
                "stability": -10
              }
            }
          ]
        },
      ],
      outcome:
        "Creatinine rose by 18 µmol/L at 48 hours and returned to baseline by one week. She was angina-free at three months.",
      outcomeVariants: [
        {
          "flag": "underexpanded",
          "text": "Leaving the stent underexpanded over thick calcium set up the later restenosis."
        }
      ],
      learningPoints: [
        "An acceptable angiogram can conceal severe underexpansion; image after stenting in calcified vessels.",
        "Image before stenting too: an OCT calcium score of 4 predicts underexpansion and calls for calcium modification first.",
        "Treat underexpansion with high-pressure non-compliant balloons first; lithotripsy within the stent is an option when calcium resists.",
        "Large edge dissections (wide arc, longer than about 3 mm, medial) should be covered; small ones with good flow can be left.",
        "Count the contrast cost of each OCT run in patients with CKD and consider IVUS instead.",
      ],
      refs: ["eapci-imaging-2018", "fujino-calcium-2018", "supplied-medmastery"],
    },
  ],
};
