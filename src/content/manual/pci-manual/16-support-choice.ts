// Module pm-support-choice: haemodynamic support, when and which device (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.14, 14.1, 14.2, 14.6, 14.7, 24.2 and 30 (30.1.1.1, 30.20), with
// the support passages of 2.3, 3.6, 4.4, 11.1, 15, 16, 17, 18, 19, 20, 21, 22, 25 and 28.1; Oxford Handbook of
// Cardiac Catheterization and Coronary Intervention, chapter 8 (primary PCI in cardiogenic shock) and chapter 9
// (mechanical cardiopulmonary resuscitation, mechanical circulatory support, IABP, Impella, ECMO), with chapter 2
// (team roles) and chapter 10 (myocardial infarction in the lab).
// Every claim is listed with its page in docs/curriculum/evidence/pm-support-choice.md.
// Neighbouring modules: pm-support-devices (inserting and running the IABP, microaxial pump and VA-ECMO step by step),
// pm-access (large-bore femoral access and the pre-close), pm-lab-drugs (vasopressors and inotropes),
// cp-complex-patients (PCI strategy in cardiogenic shock, cardiac arrest and ECPR), cm-patient-complications
// (hypotension in the lab). Academy lessons this module builds on: mcs-shock, cx-high-risk, hd-pericardial-myocardial,
// mcs-rv-bridges, mcs-arrest-nste.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

export const module: Module = {
  id: "pm-support-choice",
  title: "Haemodynamic support: when and which device",
  stage: 4,
  summary:
    "Deciding whether a patient needs mechanical support for PCI and choosing the device: the information to gather, the two questions of baseline haemodynamics and procedural risk, Brilakis's device-selection algorithm and his device comparison, profiling cardiogenic shock with cardiac power output and the pulmonary artery pulsatility index, supporting the right ventricle and escalating or weaning, the transseptal left atrial-to-femoral bypass pump, and mechanical chest compression during arrest in the lab.",
  objectives: [
    "Gather the history, examination, laboratory, imaging and right heart data that decide whether support is needed, and know the pressure and saturation thresholds Brilakis uses.",
    "Classify a planned PCI by baseline haemodynamics and procedural risk, and choose between prophylactic support, standby support and none.",
    "Work through Brilakis's device-selection algorithm: microaxial pump contraindications, iliofemoral adequacy, alternative access, and the contraindications to a balloon pump or VA-ECMO.",
    "Compare the IABP, microaxial pump, transseptal bypass pump and VA-ECMO on access size, output, dependence on rhythm and the right ventricle, oxygenation and complications, and state where the two manuals and Brilakis's own chapters give different numbers.",
    "Profile cardiogenic shock with clinical and haemodynamic criteria, calculate cardiac power output and PAPi, and match the device to hypoxaemia, right ventricular failure and the severity of left ventricular failure.",
    "Recognise right ventricular failure and choose between right-sided support, biventricular support and VA-ECMO; apply escalation and weaning criteria and plan the exit.",
    "Describe the left atrial-to-femoral bypass circuit, its transseptal insertion step by step and its pitfalls.",
    "Explain what mechanical chest compression devices do, how they are used in the lab, their risks and the evidence, and what follows when circulation does not return.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-when",
      title: "Deciding whether a PCI needs haemodynamic support",
      minutes: 15,
      topics: ["mcs-device-choice"],
      sources: [
        { book: "brilakis-pci", loc: "1.14" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "15.2" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "17.1" },
        { book: "brilakis-pci", loc: "17.2" },
        { book: "brilakis-pci", loc: "17.9" },
        { book: "brilakis-pci", loc: "17.14" },
        { book: "brilakis-pci", loc: "18.14" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "19.14" },
        { book: "brilakis-pci", loc: "20.11" },
        { book: "brilakis-pci", loc: "20.14" },
        { book: "brilakis-pci", loc: "21.14" },
        { book: "brilakis-pci", loc: "22.1" },
        { book: "brilakis-pci", loc: "22.2" },
        { book: "brilakis-pci", loc: "25.3" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30" },
        { book: "brilakis-pci", loc: "30.20" },
        { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 8: The no-reflow phenomenon" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "protect-ii-2012",
        "perera-bcis1-2010",
        "perera-bcis1-longterm-2013",
        "rihal-mcs-consensus-2015",
        "perera-chip-bcis3-2026",
        "ezad-chip-bcis3-haemodynamics-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "PCI can lower cardiac output and tissue perfusion, and some patients cannot tolerate that: the organs are underperfused and the case turns into resuscitation. Others arrive already in shock or arrest. Mechanical support is meant to keep perfusion going through those moments. Most of the decision can be made before the case from two things you can assess in advance, how well the circulation is working now and how dangerous the planned procedure is, but the need can also arise without warning during or after PCI. This lesson teaches that decision; the next teaches which device to use.",
        },
        {
          kind: "p",
          text: "**What support can and cannot promise.** Brilakis is explicit that no randomised trial has shown that support devices reduce in-hospital death or major complications in high-risk PCI, while accepting that they may make such procedures safer and may improve the outcome of shock or arrest. Oxford likewise notes that no trial has shown a convincing net survival benefit, even though the devices are used more and more. The two trials Brilakis cites illustrate this. In PROTECT II (452 patients with complex three-vessel or unprotected left main disease and severely reduced LV function), a microaxial pump gave better haemodynamic support than a balloon pump, but major adverse events at 30 days did not differ significantly (35.1% against 40.1%), with a trend in favour of the pump at 90 days. In BCIS-1 (301 patients, ejection fraction 30% or less, extensive disease), elective balloon pumping did not reduce major events at discharge, although long-term follow-up at a median of 51 months found fewer deaths in the balloon pump group (hazard ratio 0.66).",
        },
        {
          kind: "p",
          text: "**Newer evidence (after both manuals).** CHIP-BCIS3 (2026) randomised 300 patients with severe LV dysfunction and extensive coronary disease who were having planned complex PCI to elective unloading with a microaxial pump or to standard care. The pump did not improve the hierarchical composite of death, disabling stroke, myocardial infarction, cardiovascular hospitalisation and periprocedural injury at a median of 22 months (win ratio 0.85, 95% CI 0.63–1.15), and deaths were numerically higher with the pump (47 against 33; hazard ratio 1.54, 95% CI 0.99–2.41). Its prespecified haemodynamic substudy (97 patients) found that the pump reduced the need for inotropes but caused more loss of pulse pressure and did not prevent myocardial stunning. This population overlaps heavily with the group in which Brilakis recommends prophylactic support, although the trial selected patients by LV function and anatomy rather than by right heart numbers, so read his framework below with this trial in mind.",
        },
        { kind: "h", text: "Step 1: gather the information (Brilakis 1.14)" },
        {
          kind: "table",
          caption: "The support part of the pre-procedure checklist, with what each item tells you",
          head: ["Source", "What to look for", "Why it matters"],
          rows: [
            ["History", "Symptoms of congestive heart failure; a known low ejection fraction", "Marks a heart with little reserve for ischaemia"],
            ["Examination", "Raised jugular venous pressure, leg oedema, lung crackles; femoral and radial pulses", "Signs of congestion, and whether the arteries a device would need are palpable"],
            ["Blood tests", "BNP; lactate when shock is present", "BNP for heart failure; lactate for hypoperfusion"],
            ["Imaging", "Echo for ejection fraction, the size of both ventricles and valve lesions; imaging of the access arteries", "Ventricular and valve status decide which devices are possible; access imaging decides whether a large-bore device can be inserted"],
            ["Haemodynamics", "Right heart catheterisation where available: high right atrial, PA or wedge pressures; a cardiac output, cardiac power output or PAPi that is low", "The most direct measure of how close the patient is to failure"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's summary is that any one of three findings, a low ejection fraction, poor haemodynamics or a complex, high-risk procedure, should prompt you to think about support, whether it appears alone or alongside the others.",
        },
        { kind: "h", text: "Step 2: measure the baseline haemodynamics" },
        {
          kind: "p",
          text: "Brilakis treats the baseline haemodynamics as the single most important factor. He strongly recommends a right heart study in a patient with a low ejection fraction who is having complex PCI, and in anyone whose haemodynamic state is unclear. He then places the patient in one of four groups: normal, abnormal but stable, shock, or cardiac arrest. In arrest, VA-ECMO is essential to prevent death because it supports both the circulation and oxygenation, and many patients in shock need support; those two groups are taught in later lessons. For stable patients the decision is harder and depends on the risk of the procedure.",
        },
        {
          kind: "table",
          caption: "Right heart numbers Brilakis uses before PCI",
          head: ["Finding", "Threshold", "What it suggests"],
          rows: [
            ["Pulmonary capillary wedge pressure", "Above 18 mmHg", "Left ventricular failure"],
            ["Pulmonary artery pulsatility index (PAPi)", "Below 0.9", "Right ventricular failure"],
            ["Wedge pressure and mixed venous saturation together", "Wedge above 25 mmHg with mixed venous saturation below 50%", "High risk of pulmonary oedema and shock around the procedure"],
          ],
        },
        {
          kind: "p",
          text: "The pulmonary artery catheter does not have to come out once the numbers are taken. Brilakis suggests leaving it in during the case so that the PA pressure can be watched and support escalated or reduced as needed. In any patient who becomes hypotensive, or who has heart failure or shock, he regards a pulmonary artery catheter as useful for the support decision and for spotting new changes.",
        },
        { kind: "tip", id: "haemo-support-rhc-thresholds" },
        { kind: "tip", id: "pci-support-swan-stays" },
        {
          kind: "check",
          stem: "Before planned left main PCI, a man with an ejection fraction of 25% has a right heart study: RA 9 mmHg, PA 50/29 mmHg, wedge 27 mmHg, mixed venous saturation 46%, blood pressure 110/70 mmHg. How does Brilakis's framework read these numbers?",
          options: [
            "Abnormal but stable: LV failure with a high risk of oedema and shock",
            "Normal haemodynamics, because the systemic blood pressure is preserved at 110/70",
            "Isolated right ventricular failure, because the PA pressure is raised at 50/29",
            "Cardiogenic shock, because the wedge is above 25 mmHg and the saturation below 50%",
          ],
          answer: 0,
          explanation:
            "A wedge above 18 mmHg suggests LV failure, and a wedge above 25 mmHg with a mixed venous saturation below 50% marks a patient at high risk of periprocedural pulmonary oedema and shock. The blood pressure is normal, so he is abnormal but stable, not in shock; a normal blood pressure does not make the haemodynamics normal. PAPi here is (50 − 29) ÷ 9, about 2.3, well above 0.9, so the RV is not the problem.",
        },
        { kind: "h", text: "Step 3: judge the risk of the procedure" },
        {
          kind: "table",
          caption: "What makes a PCI high risk (Brilakis 14.1.2), with Oxford's CHIP definition beside it",
          head: ["Domain", "Brilakis", "Oxford: complex and high-risk indicated PCI (CHIP)"],
          rows: [
            ["Where the lesion is", "Unprotected left main, especially with an occluded or diseased RCA; the last remaining vessel", "Unprotected left main; multivessel disease with a SYNTAX score above 33; the last patent vessel"],
            ["What the lesion looks like", "Severe calcium and tortuosity; a tight stenosis likely to close during wiring; a bifurcation with large, tightly diseased side branches that are hard to protect; a large thrombus burden", "Complex anatomy is one of the three features that must coexist"],
            ["What you plan to do", "Long, complex procedures with sustained ischaemia, such as atherectomy and retrograde CTO PCI", "Not itemised"],
            ["The patient", "Ejection fraction and haemodynamics (Step 2)", "Comorbidity: heart failure, severe valve disease, COPD, kidney failure, diabetes, old age, peripheral vascular disease, previous cardiac surgery, acute presentation, electrical instability. Haemodynamic compromise: ejection fraction below 35%, systolic pressure below 100 mmHg, cardiac index below 2.2 L/min/m²"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis returns to support in the chapters on each lesion type, and together they fill in the picture. Left main PCI frequently has support, particularly with a low ejection fraction, a high LVEDP or wedge, an occluded RCA, or a plan for prolonged ischaemia such as atherectomy; a right heart study helps decide this beforehand and monitor during the case. Before atherectomy he advises considering prophylactic support when baseline haemodynamics are poor, the ejection fraction is low, the myocardium at risk is large, or there is severe valve disease or severe pulmonary hypertension. Complex left main bifurcation stenting with a depressed LV may justify support, especially with a closed or badly diseased RCA. Prior CABG patients often combine a low ejection fraction, heart failure and complex lesions. Support is more likely to be needed in ACS than in stable angina. It is used in about 4% of CTO PCI in the United States. Because acute closure is a real risk in SCAD, he recommends access to a device such as VA-ECMO. At the other end, ostial left main PCI rarely needs support, although it could be considered when haemodynamic compromise is likely, and an isolated Medina 0.0.1 lesion seldom does unless the territory is large, atherectomy is needed and the LV is impaired. Support may also be needed unexpectedly: Brilakis singles out stent thrombosis, and warns that acute closure of a large vessel can quickly cause arrhythmias and haemodynamic collapse. Brilakis also lists prophylactic support for high-risk patients among the ways to prevent hypotension in the lab, and he counts the availability of support devices as part of any complex PCI programme.",
        },
        {
          kind: "p",
          text: "**Left main PCI without a device.** Brilakis's left main chapter adds two measures that matter most when no support is in place: if hypotension develops, start a vasopressor such as norepinephrine early, with defibrillation pads already on the patient; and keep balloon inflations as brief as possible to limit ischaemia.",
        },
        {
          kind: "p",
          text: "**Oxford's left main advice is older and device-led.** Oxford's left main section advises an elective balloon pump when LV function is impaired (patients with normal LV function usually tolerate left main inflations), and short inflations with a prophylactic balloon pump for haemodynamic compromise. It also suggests a balloon pump to raise coronary perfusion pressure if hypotension persists during no-reflow, and asks for femoral access ready for a balloon pump or microaxial pump when left main dissection is being treated. Brilakis instead bases the decision on the haemodynamics and the procedural risk. BCIS-1 found no fewer major events at discharge with an elective balloon pump, though deaths were fewer at a median of 51 months.",
        },
        { kind: "h", text: "Step 4: put the two together" },
        {
          kind: "table",
          caption: "Brilakis's decision for patients who are not in shock or arrest (his 2020 manual, resting on the 2015 SCAI consensus)",
          head: ["", "Low-risk procedure", "High-risk procedure"],
          rows: [
            ["Normal haemodynamics", "No support", "Standby: a device immediately available, often with a 4 Fr femoral sheath in place; upfront support may be considered in some"],
            ["Abnormal but stable haemodynamics", "Standby, as above", "Brilakis: prophylactic support in most cases, if feasible. Since CHIP-BCIS3, an individual decision between upfront support and standby"],
          ],
        },
        {
          kind: "p",
          text: "The bottom-right cell is where the evidence has moved. Brilakis's recommendation of prophylactic support for abnormal haemodynamics with a high-risk procedure cites the 2015 SCAI consensus statement, and no randomised trial stood behind it when he wrote. CHIP-BCIS3 has since tested routine elective unloading with a microaxial pump in this population and found no benefit, with a numerical excess of deaths. Prophylactic support is therefore an individual decision, discussed with the team and the patient, and standby with the access already in, the device in the room and a pulmonary artery catheter to guide escalation is a valid default.",
        },
        {
          kind: "steps",
          title: "Running a standby plan",
          items: [
            {
              title: "1. Prepare the route in",
              detail: "Brilakis reports that many operators place a small (4 Fr) femoral sheath at the start so that a balloon pump, microaxial pump or VA-ECMO can be inserted quickly if it is needed.",
            },
            {
              title: "2. Have the device in the room",
              detail: "Brilakis says the device should be immediately available. His equipment chapter makes haemodynamic support one of the categories in which a PCI lab needs at least one item, and lists the balloon pump, the CP microaxial pump, the transseptal left atrial-to-femoral bypass pump, VA-ECMO and external compression devices as the options in that category.",
            },
            {
              title: "3. Watch for instability during the case",
              detail: "Hypotension or acute pulmonary oedema during or after PCI means support is now needed. Sometimes it can be foreseen; sometimes it comes without warning, from acute vessel closure or left main dissection.",
            },
            {
              title: "4. If the patient destabilises, go to device selection",
              detail: "In Brilakis's algorithm an unstable patient on standby moves straight to the device choice (next lesson). If the case stays stable, no device is used.",
            },
            {
              title: "5. Think about the sheath at the end",
              detail: "Brilakis's closure algorithm keeps a femoral sheath in when a support device is likely to be needed in the next few hours; in ACS he notes that leaving a femoral sheath for a few hours in a patient with borderline haemodynamics is sometimes done, at the cost of more bleeding risk (closure is taught in pm-closure).",
            },
          ],
        },
        { kind: "tip", id: "pci-support-plan-two-axes" },
        { kind: "tip", id: "pci-support-standby-sheath" },
        {
          kind: "check",
          stem: "A 66-year-old with normal LV function and a normal right heart study is booked for rotational atherectomy of a heavily calcified mid-LAD lesion. What support plan does Brilakis's framework give?",
          options: [
            "Prophylactic microaxial pump, because atherectomy is one of his high-risk procedures",
            "No support and no special preparation, because the haemodynamics are normal",
            "Standby: a device ready, often with a 4 Fr femoral sheath placed at the start",
            "An elective balloon pump, as the trials of high-risk PCI showed it lowers early events",
          ],
          answer: 2,
          explanation:
            "Atherectomy makes the procedure high risk, but the haemodynamics are normal: that combination calls for standby support, with a device immediately available and often a 4 Fr femoral sheath in place; upfront support may be considered in some. Brilakis reserves prophylactic support in most cases for abnormal haemodynamics with a high-risk procedure, and even there CHIP-BCIS3 has made it an individual decision. Doing nothing ignores the procedural risk, and BCIS-1 did not show fewer early events with an elective balloon pump.",
        },
        { kind: "h", text: "What support is for (Oxford)" },
        {
          kind: "p",
          text: "Oxford frames support as a way to break a vicious circle: myocardial dysfunction lowers output and raises filling pressure, hypotension reduces coronary perfusion while congestion causes hypoxia, both worsen ischaemia, and ischaemia worsens the dysfunction. The aims are to restore cardiac output and mean arterial pressure, lower the wedge pressure, optimise oxygen saturation, improve coronary flow, reduce myocardial work and oxygen demand, and, where needed, bridge to a durable ventricular assist device or transplant. Oxford names three current indications: protected PCI in CHIP patients, cardiogenic shock, and salvage in myocardial infarction. Brilakis lists three comparable uses from the operator's side: support can be prophylactic, started after a complication, or used in shock.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading a normal blood pressure as normal haemodynamics: the wedge and mixed venous saturation can show a patient on the edge.",
            "Deciding on support only once the patient is hypotensive, with no access prepared and no device in the room.",
            "Applying a single rule (for example, an elective balloon pump for every left main case) instead of weighing both haemodynamics and procedural risk.",
            "Pulling the right heart catheter after the baseline numbers, and so losing the PA pressure you would use to judge escalation.",
            "Telling the patient that support will lower the risk of dying in hospital or of major complications: no randomised trial in high-risk PCI has shown that (the lower long-term mortality in BCIS-1 came from late follow-up, and CHIP-BCIS3 found no benefit from elective unloading).",
          ],
        },
        {
          kind: "pearl",
          text: "Ask two questions at the planning meeting and write both answers down: what are the haemodynamics now, and what is the worst ischaemic moment of this procedure? If one is bad, the device is on standby with the access already in. If both are bad, discuss upfront support against standby with the access in and a pulmonary artery catheter to guide escalation, and record why you chose one.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Before a high-risk left main PCI, perform a right heart study: record RA, PA and wedge pressures, measure cardiac output and mixed venous saturation, then state whether the wedge is above 18 mmHg, whether PAPi is below 0.9, and whether the wedge-above-25 with saturation-below-50% warning applies. Classify the patient as normal, abnormal but stable, or shock.",
        },
        { kind: "video", id: "juFEySHmmdU", note: "Brilakis on when to use haemodynamic support and which device (Manual of PCI, section 14.1)." },
        { kind: "video", id: "YswQiG-6evQ", note: "Brilakis lecture on the indications, rationale and timing of support." },
        { kind: "video", id: "o51ZWhLQJPs", note: "Elias Hanna on LV support during PCI: updates and decision making." },
        { kind: "video", id: "bFmqPwxztlE", note: "Brilakis lecture on haemodynamic support for complex PCI." },
        {
          kind: "keypoints",
          items: [
            "Gather history, examination, BNP and lactate, echo, access imaging and, where possible, a right heart study before deciding.",
            "Wedge above 18 mmHg suggests LV failure; PAPi below 0.9 suggests RV failure; wedge above 25 mmHg with mixed venous saturation below 50% warns of pulmonary oedema and shock.",
            "High-risk procedures: unprotected left main, last remaining vessel, severe calcium and tortuosity, threatened closure during wiring, difficult bifurcations, large thrombus, atherectomy and retrograde CTO PCI.",
            "Brilakis (2020, after the 2015 SCAI consensus): abnormal haemodynamics plus a high-risk procedure, prophylactic support in most cases; one of the two, standby, often with a 4 Fr femoral sheath; neither, no support. Since CHIP-BCIS3, upfront support in the first group is an individual decision.",
            "Leave the pulmonary artery catheter in to guide escalation and de-escalation.",
            "Randomised trials have not shown lower in-hospital death or major complications with support in high-risk PCI (PROTECT II, BCIS-1), and CHIP-BCIS3 found no benefit from elective microaxial unloading, with numerically more deaths.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-which",
      title: "Choosing the device: the algorithm and the comparison",
      minutes: 16,
      topics: ["mcs-device-choice"],
      sources: [
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "4.4" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.1" },
        { book: "brilakis-pci", loc: "30.20" },
        { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
        { book: "oxford-cath", loc: "ch 9: Intra-aortic balloon pump" },
        { book: "oxford-cath", loc: "ch 9: Impella" },
        { book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "tomasello-ecmo-chip-2015"],
      blocks: [
        {
          kind: "p",
          text: "Once you have decided that a patient needs support, or may need it at short notice, the device has to fit the patient: the ventricle that is failing, the valves, the arteries, the bleeding risk and the amount of flow required. Choosing well means knowing what each device does, what stops you using it, and the order in which to ask the questions. The insertion and running of each device are taught in pm-support-devices.",
        },
        { kind: "h", text: "The devices and how each one works" },
        {
          kind: "p",
          text: "Brilakis counts six devices: the intra-aortic balloon pump (IABP), the microaxial pump, VA-ECMO, the transseptal left atrial-to-femoral bypass pump (lesson 5), and two right-sided systems, a dual-lumen right atrial-to-pulmonary artery cannula driven by an external centrifugal pump and the right-sided microaxial pump. Four of them support the left ventricle.",
        },
        {
          kind: "list",
          items: [
            "**IABP.** The smallest device and the weakest support. A balloon in the aorta is filled with helium in diastole, which raises coronary perfusion and pushes blood forward, and is emptied before systole, which lowers afterload and LVEDP and modestly raises output. It usually goes in through a femoral sheath.",
            "**Microaxial pump.** A non-pulsatile axial-flow pump placed across the aortic valve that draws blood from the LV and delivers it into the aorta, so it unloads the ventricle, lowering both LVEDP and LV volume. The 2.5 and CP versions go in percutaneously; the 5.0 needs a surgical cut-down. Oxford adds that, unlike the balloon pump, it does not need the ventricle to beat: the worse the LV, the more the pump contributes.",
            "**Transseptal bypass pump.** A centrifugal pump that takes oxygenated blood from the left atrium, through a cannula placed across the atrial septum, and returns it to the femoral artery (lesson 5).",
            "**VA-ECMO.** A centrifugal pump with a membrane oxygenator: venous blood is drained, oxygenated and returned through an arterial cannula. It can maintain systemic perfusion, but it raises LVEDP and LV volume and so the myocardial oxygen demand, which may hinder recovery. It needs large cannulae and a perfusionist.",
          ],
        },
        {
          kind: "p",
          text: "For the VA-ECMO statement Brilakis cites a single-centre series of 12 patients who had elective high-risk PCI on VA-ECMO, all with successful procedures and no in-hospital major events. That shows feasibility in selected patients, not a case for routine use.",
        },
        {
          kind: "table",
          caption: "The left-sided devices compared (built from Brilakis Table 14.1; + to ++++ are his relative grades)",
          head: ["", "IABP", "Microaxial pump", "Transseptal bypass pump", "VA-ECMO"],
          rows: [
            ["How widely available", "+++", "++", "+", "+"],
            ["Arterial access", "7–8 Fr", "12 Fr (2.5), 14 Fr (CP), 21 Fr (5.0)", "15–19 Fr arterial plus 21 Fr venous", "15–19 Fr arterial plus 21–25 Fr venous"],
            ["Added cardiac output", "0.3–0.5 L/min", "About 2.5, 3.5 or 5.0 L/min by model", "4–5 L/min, depending on the arterial cannula", "4–5 L/min, depending on the arterial cannula"],
            ["Works less well with arrhythmias", "Yes", "Yes", "Yes", "No"],
            ["Needs a working right ventricle", "Yes", "Yes", "Yes", "No"],
            ["Can treat respiratory failure", "No", "No", "Only if an oxygenator is added to the circuit", "Yes"],
            ["Transseptal puncture", "No", "No", "Yes", "No"],
            ["Limb ischaemia risk", "+", "++", "+++", "+++"],
            ["Bleeding risk", "+", "++", "++", "++"],
            ["Haemolysis risk", "+", "++", "++", "++"],
            ["Stroke risk", "++", "++", "++", "+++"],
            ["Difficulty of insertion", "+", "++", "++++", "++"],
          ],
        },
        {
          kind: "table",
          caption: "What rules each device out (Brilakis Table 14.1 and 14.1.3 to 14.1.6, Oxford chapter 9)",
          head: ["Device", "Brilakis", "Oxford"],
          rows: [
            ["IABP", "High bleeding risk; severe aortic regurgitation; aneurysm of the thoracic or abdominal aorta; aortic dissection; uncontrolled bleeding", "Known aortic dissection; hypertrophic obstructive cardiomyopathy with a significant gradient; significant aortic regurgitation or stenosis; significant peripheral vascular disease (a relative contraindication)"],
            ["Microaxial pump", "Mechanical aortic valve; LV thrombus; severe aortic regurgitation and a ventricular septal defect (except as a bridge to surgery); atrial septal defect; severe peripheral arterial disease; high bleeding risk", "LV thrombus; mechanical aortic valve; severe aortic stenosis; moderate or severe aortic regurgitation; significant peripheral vascular disease; contraindication to anticoagulation"],
            ["Transseptal bypass pump", "High bleeding risk; severe aortic regurgitation; severe peripheral arterial disease; left atrial thrombus", "Not covered"],
            ["VA-ECMO", "High bleeding risk; severe aortic regurgitation; severe peripheral arterial disease; aortic dissection; uncontrolled bleeding", "Moderate to severe aortic regurgitation; significant peripheral vascular disease; contraindication to anticoagulation"],
          ],
        },
        {
          kind: "p",
          text: "Two qualifications from Brilakis matter at the bedside. Severe peripheral arterial disease need not end the discussion: a footnote to his table notes that transcaval access can be used to place the arterial cannula. And although bleeding is a contraindication, a balloon pump or VA-ECMO can be run without anticoagulation for a short time in a patient who is actively bleeding.",
        },
        { kind: "h", text: "When the balloon pump is the device the problem calls for" },
        {
          kind: "table",
          caption: "Balloon pump indications and cautions (Oxford Box 9.1), with Brilakis's use in acute mitral regurgitation",
          head: ["", "What the sources say", "Why it bears on the choice"],
          rows: [
            ["Oxford's indications", "Shock of cardiac origin; ischaemia that cannot be controlled; severe pulmonary oedema; heart failure caused by severe mitral regurgitation; severe heart failure from a ventricular septal defect, above all after infarction; support during CABG or angioplasty", "The list reaches beyond PCI support to mechanical problems of the heart. Oxford's own primary PCI section, and the trials and guidelines in lesson 3, no longer support routine balloon pumping in infarct-related shock; Brilakis keeps it for pre-shock"],
            ["Acute mitral regurgitation (Brilakis 28.1.3.2)", "Acute mitral or aortic regurgitation is often poorly tolerated and may need urgent surgery; acute mechanical support, such as a balloon pump for acute mitral regurgitation, can improve the haemodynamics in the meantime", "Brilakis: the balloon pump lowers afterload and LVEDP and raises output (14.2)"],
            ["Ventricular septal defect", "Oxford lists post-infarct VSD with heart failure among balloon pump indications; Brilakis's Table 14.1 contraindicates the microaxial pump with a VSD except as a bridge to surgery", "A septal defect steers the choice away from the microaxial pump unless surgery is the plan"],
            ["Cautions (Oxford)", "It may sometimes worsen renal blood flow. Limb ischaemia, usually in the leg on the insertion side but sometimes the other one, presents as a cold, pale, painful leg with weaker pulses and needs specialist help at once", "Check the pulses and the kidneys while it runs"],
          ],
        },
        { kind: "tip", id: "mcs-select-impella-contraindications" },
        { kind: "h", text: "The algorithm for a PCI patient who needs support (Brilakis Fig 14.1, in this module's words)" },
        {
          kind: "steps",
          title: "Ask these in order",
          items: [
            {
              title: "1. Can a microaxial pump be used?",
              detail: "Look for its four contraindications in Brilakis's algorithm: a mechanical aortic valve, LV thrombus, severe aortic regurgitation, or an atrial or ventricular septal defect. Where it is available, the CP version is the device most often used for high-risk PCI. If a contraindication is present, go to question 4.",
            },
            {
              title: "2. Is the femoral route good enough?",
              detail: "The CP pump needs a 14 Fr sheath, so the iliac and femoral arteries must be more than 5 mm wide, without severe calcium, severe tortuosity or obstructive disease. Iliac stenting, or intravascular lithotripsy of calcified iliofemoral arteries, can make a borderline route usable. If the route is adequate, use the pump.",
            },
            {
              title: "3. If not, is another route feasible?",
              detail: "Axillary and transcaval access can be used when the femoral route is poor or the pump will not advance, but both demand experience with large-bore access and closure (Brilakis describes neither in detail). If an alternative route is possible, use the pump through it; if not, use a balloon pump.",
            },
            {
              title: "4. If the pump is contraindicated: can a balloon pump or VA-ECMO be used?",
              detail: "The algorithm's questions are severe aortic regurgitation, aortic dissection and uncontrolled bleeding; if one applies, there is no support option and the plan must change. Before choosing between the two, also check the rest of Table 14.1: an aneurysm of the thoracic or abdominal aorta rules out the balloon pump, and severe peripheral arterial disease rules out VA-ECMO unless the arterial cannula goes in by the transcaval route. Oxford adds significant aortic stenosis, obstructive cardiomyopathy with a significant gradient and significant peripheral vascular disease (relative) for the balloon pump, and significant peripheral vascular disease and a contraindication to anticoagulation for ECMO.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 74-year-old with an ejection fraction of 20%, a wedge of 28 mmHg and an occluded RCA needs left main PCI with atherectomy. Echo shows a mechanical aortic valve. Both iliofemoral arteries measure 7 mm. Which support does Brilakis's algorithm lead to?",
          options: [
            "A microaxial pump from the femoral artery, since both iliofemoral arteries are 7 mm",
            "A microaxial pump by the axillary route, so that the iliac arteries are avoided",
            "A balloon pump or VA-ECMO, once their own contraindications are excluded",
            "No support, because the valve also contraindicates the balloon pump and VA-ECMO",
          ],
          answer: 2,
          explanation:
            "Abnormal haemodynamics plus a high-risk procedure call for prophylactic support. A mechanical aortic valve is a contraindication to the microaxial pump whatever the access route, so the algorithm moves to the balloon pump or VA-ECMO question. Their contraindications are severe aortic regurgitation, aortic dissection and uncontrolled bleeding; none is mentioned, so either can be chosen, after checking Table 14.1 for an aortic aneurysm (balloon pump) or severe peripheral arterial disease (VA-ECMO). Good iliofemoral arteries do not cancel a valve contraindication, and a mechanical valve is not a contraindication to the other devices in Brilakis's table.",
        },
        { kind: "h", text: "Sizes and flows: where the sources differ" },
        {
          kind: "table",
          caption: "Numbers to check against the device instructions for use",
          head: ["Item", "Brilakis 14.2 and Table 14.1", "Brilakis 30.1 (equipment chapter)", "Oxford chapter 9"],
          rows: [
            ["Balloon pump sheath", "7–8 Fr", "7–9 Fr (the pump can also go in without a sheath)", "7.5 F or more in size; inserted with or without a sheath"],
            ["Microaxial pump 2.5", "12 Fr", "13 Fr", "12 F, 2.5 L/min"],
            ["Microaxial pump CP", "14 Fr", "14 Fr", "14 F, 3.5 L/min"],
            ["Microaxial pump 5.0", "21 Fr, surgical cut-down", "Not given", "21 F, 5.0 L/min"],
            ["VA-ECMO cannulae", "Arterial 15–19 Fr, venous 21–25 Fr; 4–5 L/min", "Arterial 15–19 Fr, venous 25 Fr", "Venous 18–21 F, arterial 14–16 F; 3–7 L/min, against at most 5 L/min for the largest microaxial pump"],
          ],
        },
        {
          kind: "p",
          text: "Models change, and the device's instructions for use are the final word on sheath size and flow. All sources agree that the balloon pump gives the least added flow (0.3–0.5 L/min in Brilakis's table) through the smallest sheath. Above that the sources differ: Brilakis puts the 5.0 microaxial pump (5.0 L/min through 21 Fr) level with the transseptal bypass pump and VA-ECMO (4–5 L/min through a 15–19 Fr arterial cannula), whereas Oxford gives VA-ECMO 3–7 L/min against at most 5 L/min for the 5.0 pump.",
        },
        { kind: "h", text: "How Oxford frames the choice" },
        {
          kind: "list",
          items: [
            "**Choose by the amount of support needed and how much the heart must be protected.** Oxford points out that VA-ECMO gives the greatest haemodynamic support but very poor cardioprotection, which is the same point Brilakis makes about the rise in LV pressure and volume.",
            "**Then by ease of use, risk of complications and contraindications.**",
            "**By severity and time course.** Oxford's diagram places the balloon pump at the moderate, acute end, the microaxial pump above it, and ECMO at the most severe acute end, with durable ventricular assist devices and transplantation for chronic heart failure.",
            "**Microaxial pump against balloon pump.** The pump needs larger access, so access complications are more likely; it needs prolonged anticoagulation, costs more and takes longer to learn.",
            "**VA-ECMO against the percutaneous pumps.** It supports the lungs as well as the heart, but needs the largest access (often a surgical cut-down), continuous anticoagulation and a dedicated ECMO team, carries a higher risk of systemic thromboembolism, gives poor coronary perfusion, can distend the ventricle and is more complex to manage.",
            "**Every PCI laboratory should be able to start a balloon pump immediately.** It is the device available in the vast majority of laboratories.",
            "**VA against VV.** Oxford separates veno-arterial ECMO, which supports both the heart and the lungs, from veno-venous ECMO, with both cannulae in the venous system, which only oxygenates and is meant for isolated lung failure. Circulatory support therefore means VA-ECMO. Oxford calls ECMO probably the most adopted form of extracorporeal life support in the lab because it is relatively simple to insert.",
          ],
        },
        {
          kind: "table",
          caption: "Complications Oxford lists for each device (managing them is taught in pm-support-devices)",
          head: ["Device", "Complications"],
          rows: [
            ["Balloon pump", "Possible worsening of renal blood flow; ischaemia of the leg on the insertion side or, less often, the other leg"],
            ["Microaxial pump", "Limb ischaemia; haemolysis; migration or thrombosis of the device; injury to the vessels; stroke; infection"],
            ["ECMO", "Bleeding and haemolysis; limb ischaemia, compartment syndrome and injury to the vessels; acute kidney injury; embolism of thrombus or air; infection; neurological injury"],
          ],
        },
        {
          kind: "check",
          stem: "A patient needs support for high-risk PCI. The right ventricle is failing as well as the left, and he is in atrial fibrillation with a fast, irregular rate. On Brilakis's comparison, which device is the only one that neither depends on right ventricular function nor is affected by arrhythmia?",
          options: ["VA-ECMO", "The balloon pump", "The microaxial pump", "The transseptal bypass pump"],
          answer: 0,
          explanation:
            "In Table 14.1 the balloon pump, microaxial pump and transseptal bypass pump all need adequate RV function and are all affected by arrhythmias; VA-ECMO is the exception on both counts. It also corrects respiratory failure as standard, which the bypass pump does only if an oxygenator is added to its circuit. The trade-off is that it loads the LV and has the highest grade for stroke and joint-highest for limb ischaemia. Oxford adds that the balloon pump is less effective in tachycardia, especially an irregular rhythm.",
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing the device you use most often before checking its contraindications: a mechanical aortic valve or LV thrombus excludes the microaxial pump at once.",
            "Measuring only the common femoral artery: the 14 Fr route runs through the iliac arteries too, and their calcium and tortuosity decide whether the pump will pass.",
            "Assuming VA-ECMO unloads the ventricle. It raises LV pressure and volume; if the LV is failing it may need venting (lesson 4).",
            "Treating sheath sizes from memory as exact: the manuals disagree by 1 Fr for the balloon pump and the 2.5 pump, and by several French for ECMO cannulae, and models change.",
            "Forgetting that a balloon pump, microaxial pump and transseptal bypass pump all rely on a working right ventricle.",
            "Stopping at the algorithm's three questions for the balloon pump or VA-ECMO: an aortic aneurysm or severe peripheral arterial disease in Table 14.1 can still rule one of them out.",
          ],
        },
        {
          kind: "pearl",
          text: "Run the algorithm out loud with the team before the case: pump contraindications, then the iliofemoral route, then an alternative route, then balloon pump or ECMO. Saying it once in the planning meeting means nobody has to work it out during a collapse.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "Before positioning the pump, review the patient summary and state aloud why a microaxial pump is allowed in this patient: no mechanical aortic valve, no LV thrombus, no severe aortic regurgitation, no septal defect, and an iliofemoral route wider than 5 mm without severe calcium or tortuosity. Then position the pump.",
        },
        {
          kind: "sim",
          sim: "iabp",
          task: "Take the balloon pump as the device chosen when a microaxial pump is contraindicated (for example, a mechanical aortic valve): before starting, confirm there is no severe aortic regurgitation, aortic dissection or uncontrolled bleeding, then optimise timing.",
        },
        { kind: "video", id: "juFEySHmmdU", note: "Brilakis on when to use haemodynamic support and which device (Manual of PCI, section 14.1)." },
        { kind: "video", id: "VRzBnCLZ2oc", note: "Brilakis webcast on protected PCI." },
        { kind: "video", id: "J3LVbnVq3NA", note: "Brilakis lecture on advanced haemodynamic support in the cath lab." },
        { kind: "video", id: "o07IELwgyKo", note: "Elias Hanna on LV support in complex PCI, with left main and bifurcation techniques." },
        {
          kind: "keypoints",
          items: [
            "Six devices: balloon pump, microaxial pump, VA-ECMO and transseptal bypass pump for the left side; a dual-lumen right atrial-to-pulmonary artery cannula and a right-sided microaxial pump for the right.",
            "Algorithm: pump contraindications (mechanical aortic valve, LV thrombus, severe aortic regurgitation, septal defect), then iliofemoral route over 5 mm without severe calcium or tortuosity, then axillary or transcaval, otherwise balloon pump.",
            "If the pump is contraindicated, a balloon pump or VA-ECMO unless there is severe aortic regurgitation, aortic dissection or uncontrolled bleeding; then check Table 14.1 for an aortic aneurysm (balloon pump) or severe peripheral arterial disease (VA-ECMO).",
            "Added output: balloon pump 0.3–0.5 L/min; microaxial pump about 2.5 to 5.0 L/min by model; transseptal bypass pump and VA-ECMO 4–5 L/min by cannula size (Oxford gives VA-ECMO 3–7 L/min).",
            "Only VA-ECMO works without a functioning RV and is unaffected by arrhythmia; it corrects respiratory failure as standard (the transseptal bypass pump can only if an oxygenator is added), but it loads the LV.",
            "Balloon pump indications in Oxford include severe mitral regurgitation with heart failure and post-infarct VSD; a VSD excludes the microaxial pump except as a bridge to surgery.",
            "Sheath sizes differ slightly between the sources; check the instructions for use.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-shock",
      title: "Profiling cardiogenic shock and matching the device",
      minutes: 16,
      topics: ["hd-shock-profiling", "mcs-device-choice"],
      sources: [
        { book: "brilakis-pci", loc: "24.2" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "3.6" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI in cardiogenic shock" },
        { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
        { book: "oxford-cath", loc: "ch 10: Myocardial infarction" },
        { book: "oxford-cath", loc: "ch 10: Pulmonary oedema" },
      ],
      refs: [
        "brilakis-manual-pci",
        "oxford-cath-handbook",
        "brilakis-eckman-shock-2018",
        "tehrani-shock-team-2019",
        "basir-ncsi-2019",
        "korabathina-papi-2012",
        "iabp-shock-ii-2012",
        "ecls-shock-2023",
        "danger-shock-2024",
        "udesen-danger-shock-design-2019",
        "culprit-shock-2017",
        "esc-acs-2023",
        "rao-acs-guideline-2025",
        "restrepo-acs-guideline-review-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "In cardiogenic shock the question is no longer whether to support but how much, which ventricle and when. Brilakis's answer is to find the shock early, measure it, revascularise the culprit, choose support from the haemodynamics and what the centre can do, and keep reassessing afterwards. This lesson teaches the measurements and the device choice. The PCI strategy in shock (culprit-only revascularisation and the shock team) is taught in cp-complex-patients; definitions and SCAI staging are in the Academy lesson on cardiogenic shock.",
        },
        { kind: "h", text: "The five ingredients (Brilakis and Eckman)" },
        {
          kind: "steps",
          items: [
            { title: "1. Diagnose early", detail: "Recognise shock before it becomes refractory and metabolic; Brilakis stresses that early identification improves the chance of survival." },
            { title: "2. Put in a pulmonary artery catheter", detail: "Right heart catheterisation shows the mechanism and severity, and serial measurements track the response." },
            { title: "3. Revascularise the culprit only", detail: "Culprit-only PCI at presentation, on the basis of CULPRIT-SHOCK, with staged treatment of other lesions." },
            { title: "4. Decide on mechanical support", detail: "Before or after PCI, with the device chosen by the haemodynamic need and by local availability and expertise." },
            { title: "5. Provide expert care afterwards", detail: "A dedicated, experienced team, haemodynamic monitoring, adjustment of the level of support, and access to advanced therapies." },
          ],
        },
        { kind: "h", text: "Recognising shock: two sets of criteria" },
        {
          kind: "table",
          caption: "Criteria from the shock algorithm Brilakis reproduces (Tehrani and colleagues), with Oxford's markers of severe shock",
          head: ["", "To call it cardiogenic shock (Tehrani algorithm)", "To call it severe (Oxford)"],
          rows: [
            ["Blood pressure", "Systolic below 90 mmHg for more than 30 minutes, or drugs needed to hold it there", "Below 90 mmHg"],
            ["Perfusion", "Evidence of end-organ hypoperfusion; lactate above 2 mmol/L", "Lactate above 4 mmol/L; cool extremities; an obtunded patient"],
            ["Drugs and rhythm", "(Inotropes or vasopressors count towards the blood pressure criterion)", "Two or more inotropes or vasoactive drugs; heart rate above 120 bpm"],
            ["Cardiac index", "Fick index below 1.8 L/min/m² without drugs, or below 2.2 with them", "Below 1.5 L/min/m²"],
            ["Filling pressure", "Wedge above 15 mmHg", "Wedge above 30 mmHg; LVEDP above 30 mmHg"],
            ["Cardiac power output", "Below 0.6 W", "Below 0.6 W"],
            ["PAPi", "Below 1.0", "Not given"],
          ],
        },
        {
          kind: "p",
          text: "In that algorithm a suspected shock patient triggers a single call to a team of interventional cardiology, cardiac surgery, advanced heart failure and critical care, and transfer to the lab or the cardiac intensive care unit. Suspected heart-failure shock gets a right heart study and echo; suspected infarct-related shock gets a right heart study, coronary angiography with revascularisation, and assessment of the peripheral arteries. If the haemodynamic criteria are met, percutaneous support is considered. In the intensive care unit, patients on support have daily echo, frequent neurovascular checks, serial cardiac power output, PAPi and lactate, and evaluation for weaning against escalation. In the single-centre series that produced it (204 patients), 30-day survival rose from 47% in 2016 to 57.9% and then 76.6% in the following two years; the study was observational.",
        },
        { kind: "h", text: "The two numbers you calculate" },
        {
          kind: "formula",
          name: "Cardiac power output (CPO)",
          expr: "CPO (W) = mean arterial pressure (mmHg) × cardiac output (L/min) ÷ 451",
          note: "Pressure and flow in one number. Brilakis: keep it above 0.6 W while limiting escalation of vasopressors and inotropes.",
        },
        {
          kind: "formula",
          name: "Pulmonary artery pulsatility index (PAPi)",
          expr: "PAPi = (PA systolic − PA diastolic) ÷ right atrial pressure",
          note: "How much pulse the RV generates for the filling pressure it needs. Brilakis uses below 0.9 for RV failure (from a study of acute inferior infarction); the Tehrani algorithm uses below 1.0.",
        },
        {
          kind: "table",
          caption: "Worked example: anterior STEMI in shock",
          head: ["Measurement", "Value", "Working"],
          rows: [
            ["Mean arterial pressure", "62 mmHg", ""],
            ["Cardiac output (Fick)", "3.1 L/min", ""],
            ["CPO", "0.43 W", "62 × 3.1 = 192.2; ÷ 451 = 0.43 W: below 0.6"],
            ["PA pressure", "44/28 mmHg", ""],
            ["Right atrial pressure", "10 mmHg", ""],
            ["PAPi", "1.6", "(44 − 28) ÷ 10 = 1.6: the RV is generating a good pulse"],
            ["Wedge", "29 mmHg", "High: the left side is failing"],
            ["Reading", "", "Shock driven by LV failure, RV coping"],
          ],
        },
        { kind: "tip", id: "haemo-support-cpo-papi" },
        {
          kind: "check",
          stem: "In an inferior STEMI with shock: MAP 64 mmHg, cardiac output 3.4 L/min, PA 30/22 mmHg, right atrial pressure 17 mmHg, wedge 12 mmHg, oxygen saturation normal. What does the profile show?",
          options: [
            "LV failure with a coping RV (wedge 12 mmHg): a left-sided microaxial pump",
            "Isolated RV failure (PAPi about 0.47, CPO about 0.48 W): right-sided support",
            "Biventricular failure with a low CPO: VA-ECMO, as for failure of both ventricles",
            "Pre-shock with a preserved index: a balloon pump with continuous monitoring",
          ],
          answer: 1,
          explanation:
            "PAPi = (30 − 22) ÷ 17 ≈ 0.47, below 0.9, and the RA pressure is above 12 mmHg: the RV is failing. The wedge of 12 mmHg does not suggest LV failure, so this is not biventricular failure. CPO = 64 × 3.4 ÷ 451 ≈ 0.48 W, below 0.6, so this is shock, not pre-shock. In Brilakis's algorithm, isolated RV failure in shock without hypoxaemia leads to a right-sided device (the dual-lumen cannula system or the right-sided microaxial pump). A left-sided pump depends on RV function and would have little to pump.",
        },
        { kind: "h", text: "Choosing the device in shock (the shock branch of Brilakis Fig 14.1)" },
        {
          kind: "steps",
          title: "Three questions, in order",
          items: [
            {
              title: "1. Is the patient hypoxaemic?",
              detail: "Brilakis uses VA-ECMO for shock with hypoxaemia, because it supports oxygenation as well as the circulation. Read this as hypoxaemia that persists despite optimal oxygenation and ventilation: treat hypoxaemia first with oxygen and ventilation (Oxford lists high-flow oxygen and continuous positive airway pressure for pulmonary oedema in the lab) and treat the pulmonary oedema itself. Routine early VA-ECMO did not reduce 30-day mortality in ECLS-SHOCK and caused more bleeding and vascular complications.",
            },
            {
              title: "2. Is the right ventricle failing?",
              detail: "Judge it on echo (which may not be to hand in the lab) or invasively: RA pressure above 12 mmHg or PAPi below 0.9. If the RV is failing, ask whether the LV is failing too. Both failing: VA-ECMO usually, or a combination of left- and right-sided devices. RV alone: a right-sided device (lesson 4).",
            },
            {
              title: "3. How severe is the LV failure?",
              detail: "Pre-shock with a cardiac index above 2.0 L/min/m²: a balloon pump may be enough, but only with continuous haemodynamic monitoring, ideally a pulmonary artery catheter, to show when support must be escalated. Severe shock from isolated LV failure: a microaxial pump (the CP model most often), or the transseptal bypass pump in centres experienced with it. Refractory shock, with hypoperfusion continuing despite either: escalate to VA-ECMO or the 5.0 microaxial pump (the 5.0 option is in Brilakis's text; his figure shows VA-ECMO). When VA-ECMO is added, a microaxial pump already in place is often left in to vent the LV.",
            },
          ],
        },
        { kind: "tip", id: "mcs-select-hypoxaemia-ecmo" },
        { kind: "tip", id: "mcs-select-shock-severity" },
        { kind: "h", text: "A protocol in practice: the National Cardiogenic Shock Initiative" },
        {
          kind: "p",
          text: "Brilakis reproduces the algorithm of the National Cardiogenic Shock Initiative as an example of a standard protocol for infarct-related shock. Read it as one network's protocol, not as a guideline.",
        },
        {
          kind: "steps",
          items: [
            { title: "Who", detail: "Acute myocardial infarction (STEMI or NSTEMI) with hypotension (below 90/60 mmHg, or drugs needed to keep the systolic above 90) and end-organ hypoperfusion (cool extremities, oliguria, lactic acidosis). Excluded: anoxic brain injury; an unwitnessed out-of-hospital arrest or any arrest without return of circulation within 30 minutes; a balloon pump placed before the pump; septic, anaphylactic, haemorrhagic or neurological shock, and non-ischaemic causes such as pulmonary embolism, pneumothorax, myocarditis or tamponade; active bleeding; recent major surgery; mechanical complications of infarction; known LV thrombus; a patient who did not receive revascularisation; contraindication to intravenous anticoagulation; a mechanical aortic valve." },
            { title: "Access and measurement", detail: "Femoral arterial access under direct vision with ultrasound and fluoroscopy, venous access (femoral or internal jugular), and either a Fick cardiac index or an LVEDP." },
            { title: "Support before PCI", detail: "With LVEDP above 15 mmHg or cardiac index below 2.2 L/min/m², and suitable anatomy, insert the microaxial pump before the PCI." },
            { title: "Angiography and PCI", detail: "Aim for TIMI 3 flow in all major epicardial vessels apart from chronic occlusions; if it cannot be achieved, consider intracoronary vasodilators." },
            { title: "Recalculate after PCI", detail: "CPO and PAPi. CPO above 0.6 and PAPi above 0.9: wean vasopressors and inotropes and decide whether the pump can come out in the lab or stays for the ICU." },
            { title: "Escalate if CPO stays below 0.6", detail: "With PAPi below 0.9, consider right-sided support; with PAPi above 0.9, consider more support, by a more powerful device or transfer to an LVAD or transplant centre, by local practice. If CPO is above 0.6 but PAPi below 0.9, consider right-sided support when RV dysfunction is suspected clinically." },
            { title: "Before leaving the lab", detail: "A vascular assessment, including a femoral angiogram and Doppler of the affected leg, with external bypass if needed." },
            { title: "In the intensive care unit", detail: "Daily haemodynamic assessment that includes a detailed vascular examination; watch for haemolysis and adjust the pump position when it appears. Removal is considered only off all drugs with CPO above 0.6 W and PAPi above 0.9, and without recovery in 3–5 days the patient is referred on (lesson 4)." },
          ],
        },
        {
          kind: "p",
          text: "Its quality measures are support before PCI, a door-to-support time under 90 minutes, TIMI 3 flow, a right heart study, weaning off drugs, a CPO above 0.6 W and a survival-to-discharge target above 80%. In the published update (171 patients at 35 sites), 74% had support placed before PCI, the mean door-to-support time was 85 minutes and survival to discharge was 72%; creatinine of 2 or more, lactate above 4, CPO below 0.6 W and age 70 or over predicted death. It was a single-arm registry with no control group.",
        },
        { kind: "tip", id: "mcs-manage-post-pci-escalation" },
        { kind: "h", text: "Around the device: access, drugs and physiology" },
        {
          kind: "list",
          items: [
            "**Access.** Because support is so often needed and the anatomy must be seen quickly, Brilakis says femoral access may be preferred in shock.",
            "**Drugs.** Vasopressors and inotropes are often needed but raise myocardial oxygen consumption, can provoke arrhythmias and may hinder recovery. Brilakis advises avoiding pure alpha agonists, which add afterload without inotropy, and notes that among 1,679 patients with shock of any cause, 19% of them cardiogenic, dopamine was linked to more arrhythmias than norepinephrine. He suggests early mechanical support to limit the need for these drugs (drug choice is taught in pm-lab-drugs).",
            "**Physiology wires.** FFR depends on coronary afterload, so in shock it may not reflect the true severity of a stenosis: use it with caution.",
            "**Revascularise, culprit first.** Early revascularisation improves survival in infarct-related shock. About two thirds of these patients have multivessel disease: treat the culprit at presentation (CULPRIT-SHOCK) and stage the rest. The few patients with more than one culprit lesion should have each culprit treated (cp-complex-patients).",
          ],
        },
        { kind: "tip", id: "pci-support-ffr-in-shock" },
        { kind: "h", text: "What the evidence says, and what has changed" },
        {
          kind: "p",
          text: "Both manuals are cautious. Brilakis notes that data showing better outcomes with support in shock are limited. Oxford records that, in the light of CRISP-AMI and IABP-SHOCK, routine balloon pumping is not recommended in infarct-related shock, that newer devices had not improved 30-day survival compared with the balloon pump, and that support should be decided case by case on age, comorbidities, neurological function, the prospect of long-term survival and the expected quality of life. Oxford's complications chapter still advises inserting a balloon pump, if available, when shock follows a myocardial infarction in the lab; read that alongside its own later statement and the trial below.",
        },
        {
          kind: "table",
          caption: "Randomised trials in infarct-related shock",
          head: ["Trial", "Patients", "Result"],
          rows: [
            ["IABP-SHOCK II (2012)", "600 with infarct-related shock and planned early revascularisation", "30-day death 39.7% with a balloon pump against 41.3% without: no significant difference"],
            ["ECLS-SHOCK (2023)", "420 with infarct-related shock and planned early revascularisation", "30-day death 47.8% with early VA-ECMO against 49.0% without; more moderate or severe bleeding (23.4% against 9.6%) and vascular complications needing intervention (11.0% against 3.8%)"],
            ["DanGer Shock (2024)", "360 with STEMI and shock (comatose survivors of out-of-hospital arrest excluded); CP-size pump placed before PCI", "180-day death 45.8% with a microaxial pump plus standard care against 58.5% with standard care (hazard ratio 0.74); more of the composite of severe bleeding, limb ischaemia, haemolysis, device failure or worse aortic regurgitation (24.0% against 6.2%) and more renal replacement therapy (41.9% against 26.7%)"],
          ],
        },
        {
          kind: "p",
          text: "ECLS-SHOCK and DanGer Shock were published after both manuals. Together they say that routine early VA-ECMO did not lower 30-day mortality in infarct-related shock, while a microaxial pump lowered 180-day mortality in STEMI-related shock at the price of more complications. The DanGer Shock benefit applies to LV-dominant STEMI shock in patients who are not comatose after arrest; it should not be extended to RV-dominant shock, NSTEMI shock or comatose survivors of arrest.",
        },
        {
          kind: "p",
          text: "**Current guidance.** The 2023 ESC guideline on acute coronary syndromes, which predates DanGer Shock, advises against routine balloon pumping in infarct-related shock and gives short-term mechanical support only a weak recommendation, for severe or refractory shock. The 2025 ACC/AHA/SCAI guideline on acute coronary syndromes, as summarised by one of its authors, gives a microaxial flow pump a Class IIa recommendation in selected patients with refractory infarct-related shock, on the basis of DanGer Shock, and rates routine use of a balloon pump or of ECMO as Class III (not recommended).",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating the blood pressure and not the perfusion: lactate, CPO and the cardiac index tell you whether drugs are actually helping.",
            "Putting a left-sided pump into a patient whose RV is failing: it depends on RV function to fill.",
            "Choosing VA-ECMO for LV failure without hypoxaemia and then forgetting that it loads the LV.",
            "Adding drug after drug instead of considering support early.",
            "Measuring once: shock changes over hours, so CPO, PAPi and lactate must be repeated after PCI and in the intensive care unit.",
            "Using FFR to decide on non-culprit lesions during shock.",
          ],
        },
        {
          kind: "pearl",
          text: "Get the venous sheath in at the same time as the arterial one. With a pulmonary artery catheter in place you can calculate CPO and PAPi before the coronary angiogram, choose the device on numbers rather than impressions, and repeat the same measurements at the end of the PCI to decide whether to wean or escalate.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Shock after anterior STEMI: record MAP, cardiac output, PA, RA and wedge pressures; calculate CPO and PAPi; then answer the three questions in order (hypoxaemia, RV failure, severity of LV failure) and name the device the algorithm points to.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "After placing the pump for LV-predominant shock, review the post-PCI numbers: if CPO is above 0.6 W and PAPi above 0.9, plan to wean drugs; if CPO is below 0.6 W with PAPi below 0.9, recognise that the RV is limiting flow and state the next support step.",
        },
        { kind: "video", id: "x9bB5Hab9A0", note: "Brilakis case 27: STEMI and shock (PCI Manual online case)." },
        { kind: "video", id: "4HsjKW4hA1c", note: "Elias Hanna on cardiogenic shock: tips and updates." },
        { kind: "video", id: "VbmoHuCAYqY", note: "Elias Hanna on cardiac output, mixed venous oxygen, oxygen delivery and shock indices." },
        { kind: "video", id: "uJ5kQ_pGbl0", note: "Elias Hanna on cardiogenic shock." },
        {
          kind: "keypoints",
          items: [
            "Five ingredients: early diagnosis, a pulmonary artery catheter, culprit-only revascularisation, a support decision based on haemodynamics and local expertise, and expert care afterwards.",
            "CPO = MAP × CO ÷ 451; aim above 0.6 W. PAPi = (PA systolic − PA diastolic) ÷ RA; below 0.9 (Brilakis) or 1.0 (Tehrani) means RV failure.",
            "Shock branch: hypoxaemia that persists despite optimal oxygenation and ventilation → VA-ECMO; RV failure (RA above 12 or PAPi below 0.9) → right-sided device, or VA-ECMO if both ventricles fail; LV failure → balloon pump only in pre-shock (index above 2.0) with monitoring, microaxial pump or transseptal bypass pump in severe shock, VA-ECMO or 5.0 pump when refractory.",
            "Recalculate CPO and PAPi after PCI and escalate or wean on the numbers.",
            "Femoral access may be preferred in shock; FFR may mislead.",
            "IABP-SHOCK II and ECLS-SHOCK showed no 30-day mortality benefit; DanGer Shock showed lower 180-day mortality with a microaxial pump in STEMI shock (not comatose after arrest), with more complications. ESC 2023: no routine balloon pump, short-term support a weak recommendation; ACC/AHA 2025: microaxial pump Class IIa in selected refractory shock, routine balloon pump or ECMO Class III.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-rv",
      title: "Right ventricular support, escalation, weaning and the exit",
      minutes: 13,
      topics: ["mcs-rv-support"],
      sources: [
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "14.4" },
        { book: "brilakis-pci", loc: "24.2" },
        { book: "oxford-cath", loc: "ch 9: Impella" },
        { book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" },
        { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI in cardiogenic shock" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "korabathina-papi-2012", "basir-ncsi-2019", "tehrani-shock-team-2019", "ecls-shock-2023"],
      blocks: [
        {
          kind: "p",
          text: "The balloon pump, the microaxial pump and the transseptal bypass pump all assume that the right ventricle can deliver blood across the lungs to them; VA-ECMO does not. When it cannot, a left-sided pump runs short of blood and the patient stays in shock however well the pump sits. This lesson covers how to recognise that situation, the devices that support the right side, what to do when one device is not enough, and how support ends. The Academy lessons on the failing right ventricle and on bridges and goals of care cover the medical treatment of RV failure and the ethics of bridging.",
        },
        { kind: "h", text: "Recognising right ventricular failure" },
        {
          kind: "list",
          items: [
            "**Echo** shows the RV directly, but Brilakis warns it may not be available at once in the lab.",
            "**Invasive numbers:** RA pressure above 12 mmHg or PAPi below 0.9 (Brilakis); the shock algorithm he reproduces uses PAPi below 1.0.",
            "**On a microaxial pump:** Brilakis lists RV failure among the causes of a suction alarm, with hypovolaemia and a pump cannula lying under the papillary muscles. Treatment: lower the pump speed by one or two levels, give fluid only if the patient is hypovolaemic, check and correct the position, and support the RV if it is failing. Prevention is separate: optimise volume while keeping the RA pressure below 10 mmHg, minimise movement of the pump, and cross the aortic valve over a pigtail so the inlet does not end up under the papillary muscles (management of the pump is taught in pm-support-devices).",
            "**From the device table:** the balloon pump, the microaxial pump and the transseptal bypass pump all need adequate RV function; VA-ECMO does not.",
          ],
        },
        { kind: "h", text: "The right-sided devices" },
        {
          kind: "table",
          caption: "Right ventricular support (Brilakis describes one dual-lumen cannula system)",
          head: ["", "Dual-lumen right atrial-to-pulmonary artery cannula", "Right-sided microaxial pump"],
          rows: [
            ["Circuit", "A dual-lumen cannula. Blood enters through side holes lying in the superior vena cava and right atrium, passes to an external centrifugal pump, and returns it via the other lumen to the main pulmonary artery, so the RV is bypassed", "Pumps blood from the inferior vena cava into the pulmonary artery"],
            ["Size", "29 or 31 Fr (Brilakis)", "A 22 Fr motor on an 11 Fr catheter (Brilakis); Oxford's figure gives 23 F access and 4 L/min"],
            ["Route", "Not described in the manuals' text", "Inserted from the femoral vein, with its outlet in the main pulmonary artery (Oxford)"],
            ["Uses given", "Isolated RV failure in shock (Brilakis)", "Isolated RV failure in shock (Brilakis). Oxford: massive pulmonary embolism causing acute RV failure; failure of both ventricles; RV failure after cardiac surgery or after an LV assist device; RV infarction with refractory failure"],
          ],
        },
        {
          kind: "steps",
          title: "Matching support to which ventricle is failing (Brilakis 14.1.8 and 14.1.9)",
          items: [
            { title: "RV failing, LV not", detail: "A right-sided device: the dual-lumen cannula system or the right-sided microaxial pump." },
            { title: "Both ventricles failing", detail: "Usually VA-ECMO; a left-sided and a right-sided device together are the alternative." },
            { title: "LV failing, refractory to the first device", detail: "VA-ECMO or the larger 5.0 microaxial pump. When VA-ECMO is added, a microaxial pump already in place is often kept in to unload (vent) the LV." },
            { title: "Hypoxaemia that persists despite optimal oxygenation and ventilation", detail: "VA-ECMO, because it oxygenates as well as supporting the circulation (Brilakis 14.1.7). Treat the hypoxaemia with ventilation and the pulmonary oedema itself first; routine early VA-ECMO did not reduce mortality in ECLS-SHOCK." },
          ],
        },
        { kind: "tip", id: "mcs-select-biventricular" },
        {
          kind: "check",
          stem: "On VA-ECMO for refractory shock after anterior infarction, a patient's arterial line shows almost no pulse, the LV is dilating on echo and the wedge is rising. A microaxial pump placed earlier is still in the LV. What does Brilakis advise about that pump?",
          options: [
            "Keep it running to unload the LV while VA-ECMO supports the circulation",
            "Remove it, because two large-bore devices double the risk of access bleeding",
            "Pull it back into the aorta so that it augments diastolic pressure instead",
            "Replace it with a right-sided pump, because ECMO already unloads the LV",
          ],
          answer: 0,
          explanation:
            "VA-ECMO raises LV end-diastolic pressure and volume, increasing myocardial oxygen demand; Oxford lists ventricular distension among its disadvantages. Brilakis notes that the microaxial pump is often left in to vent the LV during VA-ECMO. ECMO does not unload the LV; it loads it. A pump pulled back into the aorta is not working as intended, and removing it gives up the venting the dilating LV needs.",
        },
        { kind: "h", text: "Escalate, wean or stop: the criteria" },
        {
          kind: "table",
          caption: "Decision points after PCI in the shock protocol Brilakis reproduces (National Cardiogenic Shock Initiative)",
          head: ["Finding", "Action"],
          rows: [
            ["CPO above 0.6 W and PAPi above 0.9", "Wean vasopressors and inotropes; decide whether the pump comes out in the lab or stays"],
            ["CPO below 0.6 W, PAPi below 0.9", "Consider right-sided support"],
            ["CPO below 0.6 W, PAPi above 0.9", "Consider more support: a more powerful device, or transfer to an LVAD or transplant centre"],
            ["CPO above 0.6 W, PAPi below 0.9", "Consider right-sided support if RV dysfunction is suspected clinically"],
            ["Off all vasopressors and inotropes, CPO above 0.6 W and PAPi above 0.9", "Only now consider removing the device"],
            ["No myocardial recovery within 3–5 days", "Transfer to an LVAD or transplant centre; if not a candidate, consider palliative care"],
          ],
        },
        { kind: "tip", id: "mcs-wean-criteria" },
        {
          kind: "check",
          stem: "Day 2 on a microaxial pump after STEMI shock: no vasopressors, dobutamine still running, CPO 0.72 W, PAPi 1.3, lactate normal. The team asks whether to remove the pump today. On the protocol Brilakis reproduces, what is missing?",
          options: [
            "Nothing: a CPO above 0.6 W and a PAPi above 0.9 are enough on their own",
            "A PAPi above 1.85, rather than 0.9, is required before the pump comes out",
            "A cardiac index above 3.0 L/min/m² must be documented off support first",
            "The patient must first be off all inotropes as well as vasopressors",
          ],
          answer: 3,
          explanation:
            "The weaning criteria are three: off all vasopressors and inotropes, CPO above 0.6 W and PAPi above 0.9. The haemodynamic numbers are met but dobutamine is still running, so the inotrope comes off first and the numbers are checked again. The 1.85 and 3.0 thresholds are not part of this protocol.",
        },
        { kind: "h", text: "The exit: what support is a bridge to" },
        {
          kind: "list",
          items: [
            "**Recovery** is the usual hope: the shock algorithms Brilakis reproduces reassess it repeatedly (Tehrani: evaluation for weaning against escalation; the National Cardiogenic Shock Initiative: daily haemodynamic assessment).",
            "**Advanced therapies:** Oxford names a bridge to a definitive ventricular assist device or transplant among the aims of support; its diagram places durable assist devices and transplantation at the chronic end of heart failure, where temporary pumps are no longer the answer.",
            "**Decision:** with no recovery in 3–5 days, the protocol moves the question to an LVAD or transplant centre, and to palliative care for those who are not candidates.",
            "**Who should have support at all:** Oxford asks for a case-by-case decision weighing age, comorbidities, neurological function, the prospect of long-term survival and the expected quality of life.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Turning up a left-sided pump that is alarming for suction when the RV is the problem: it worsens the suction without adding flow.",
            "Reading a low wedge in shock as reassurance: with a high RA pressure and a low PAPi it means the RV is not delivering blood to the left side.",
            "Adding VA-ECMO and removing the left-sided pump, so the failing LV loses its vent.",
            "Removing support because the numbers look good while inotropes are still running.",
            "Starting support without a plan for day 3 to 5 if the heart has not recovered.",
          ],
        },
        {
          kind: "pearl",
          text: "Calculate PAPi every time you calculate CPO. The pair tells you which way to move: low CPO with good PAPi means the left side needs more help; low PAPi means the right side is the limit, whatever the left-sided device is doing.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "In the RV failure scenario, recognise the pattern (falling pump flow and suction alarms, rising RA pressure, low PAPi), lower the pump speed, give fluid only if the RA pressure is low, and state the support step the algorithm gives: a right-sided device if the LV is coping, VA-ECMO if both ventricles fail or hypoxaemia persists despite optimal ventilation.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "On VA-ECMO for refractory LV shock, watch the arterial pulse pressure and LV size; identify LV distension and state why a left-sided microaxial pump would be kept in place as a vent.",
        },
        { kind: "video", id: "J3LVbnVq3NA", note: "Brilakis lecture on advanced haemodynamic support in the cath lab." },
        { kind: "video", id: "SGf8awnfFqQ", note: "Brilakis lecture on the management of advanced heart failure." },
        { kind: "video", id: "uJ5kQ_pGbl0", note: "Elias Hanna on cardiogenic shock." },
        {
          kind: "keypoints",
          items: [
            "RV failure: RA above 12 mmHg or PAPi below 0.9 (Brilakis), or a failing RV on echo; it is also a cause of suction alarms on a left-sided pump.",
            "Balloon pump, microaxial pump and transseptal bypass pump need a working RV; VA-ECMO does not.",
            "Isolated RV failure: a dual-lumen cannula system (29 or 31 Fr, right atrium and SVC to pulmonary artery) or a right-sided microaxial pump (IVC to pulmonary artery).",
            "Both ventricles: VA-ECMO usually, or left- and right-sided devices together. When VA-ECMO is added, a microaxial pump already in place is often kept to vent the LV.",
            "Remove support only when off all vasopressors and inotropes with CPO above 0.6 W and PAPi above 0.9.",
            "No recovery in 3–5 days: an advanced therapy centre, or palliative care for those who are not candidates.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-tandemheart",
      title: "Left atrial-to-femoral bypass: the transseptal pump",
      minutes: 10,
      topics: ["mcs-tandemheart"],
      sources: [
        { book: "brilakis-pci", loc: "14.2" },
        { book: "brilakis-pci", loc: "14.6" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "14.5" },
      ],
      refs: ["brilakis-manual-pci", "rihal-mcs-consensus-2015", "yadav-cath-lab-arrest-2018", "thiele-tandemheart-iabp-2005"],
      blocks: [
        {
          kind: "p",
          text: "The percutaneous left atrial-to-femoral arterial bypass pump is a transseptal centrifugal circuit; this lesson calls it the transseptal bypass pump. It is the least available and the hardest to insert of Brilakis's four left-sided devices, and Oxford does not cover it. It is worth understanding because its circuit is different from all the others: it drains the left atrium rather than the right side or the LV, so it unloads the left heart without crossing the aortic valve. It is also a reminder of how a transseptal puncture fits into support work.",
        },
        { kind: "h", text: "The circuit" },
        {
          kind: "list",
          items: [
            "**Inflow:** a 21 Fr venous cannula passed from the femoral vein across the atrial septum, with its fenestrated tip in the left atrium, draws oxygenated blood.",
            "**Pump:** a centrifugal pump outside the body.",
            "**Outflow:** a 15, 17 or 19 Fr arterial cannula returns the blood to the femoral artery. With an arterial cannula of the right size, full perfusion is possible; Brilakis's table gives 4–5 L/min depending on that size. A 2018 review gives up to 4 L/min.",
            "**Oxygen:** the circuit does not oxygenate on its own, but an oxygenator can be added for full cardiopulmonary support.",
            "**Watching it:** Brilakis's device description says the circuit needs continuous monitoring so that the transseptal cannula does not slip back into the right atrium.",
          ],
        },
        {
          kind: "table",
          caption: "Where it sits among the devices (Brilakis Table 14.1, with a 2018 review and the trial it cites)",
          head: ["Feature", "Transseptal bypass pump"],
          rows: [
            ["Availability", "The lowest grade (+), shared with VA-ECMO"],
            ["Difficulty of insertion", "The highest grade (++++) of the four"],
            ["Limb ischaemia", "+++, with VA-ECMO the highest"],
            ["Bleeding, haemolysis, stroke", "++ each"],
            ["Needs a working RV; affected by arrhythmia", "Yes; yes"],
            ["Contraindications", "High bleeding risk, severe aortic regurgitation, severe peripheral arterial disease (transcaval arterial access is an option), left atrial thrombus"],
            ["Compared with VA-ECMO (review)", "Lowers LV filling pressure, whereas VA-ECMO loads the LV"],
            ["Compared with the microaxial pump (review)", "Can be used with a mechanical aortic valve or LV thrombus, which exclude the pump; needs a transseptal puncture, more time and more expertise"],
            ["Compared with the balloon pump (review, and the randomised trial behind it)", "In 41 patients with infarct-related cardiogenic shock and planned PCI of the infarct artery: better haemodynamics, including cardiac power, but no difference in 30-day mortality (43% against 45%) and more severe bleeding and limb ischaemia"],
          ],
        },
        {
          kind: "p",
          text: "In Brilakis's shock algorithm the transseptal bypass pump is the alternative to the microaxial pump for severe shock from isolated LV failure, in centres experienced with it; if shock persists despite it, the next step is VA-ECMO or the 5.0 pump. The review Brilakis cites on arrest in the lab calls it impractical during cardiac arrest because it needs left atrial access.",
        },
        {
          kind: "check",
          stem: "Severe LV-predominant shock in a patient with a mechanical aortic valve and good oxygenation. The RV is coping and the centre is experienced with transseptal circuits. Which device fits best?",
          options: [
            "A microaxial pump, which is the device Brilakis uses most often in severe shock",
            "A balloon pump, which Brilakis's algorithm offers when the pump is contraindicated",
            "VA-ECMO, which Brilakis escalates to whenever the first-line pump cannot be used",
            "The transseptal bypass pump, which drains the left atrium and avoids the valve",
          ],
          answer: 3,
          explanation:
            "A mechanical aortic valve rules out the microaxial pump, which sits across the valve. The transseptal bypass pump draws from the left atrium and returns to the femoral artery, so the valve is not crossed, and it lowers LV filling pressure; Brilakis offers it for severe LV shock in experienced centres. The balloon pump is his device for pre-shock, not severe shock, and VA-ECMO is the step for refractory shock, hypoxaemia or biventricular failure; it is possible here but loads the LV.",
        },
        { kind: "h", text: "Inserting it, step by step (Brilakis 14.6.1)" },
        {
          kind: "steps",
          items: [
            { title: "1. Access", detail: "Obtain arterial and venous access. The venous access usually goes in the right groin, which makes the transseptal puncture easier." },
            { title: "2. Transseptal puncture", detail: "Most often with a transseptal needle, guided by fluoroscopy, intracardiac echo or transoesophageal echo." },
            { title: "3. Anticoagulate at once", detail: "Give heparin immediately after entering the left atrium." },
            { title: "4. Wire", detail: "Place an extra-support wire in the left atrium." },
            { title: "5. Dilate", detail: "Dilate the skin entry gradually, then dilate the septal puncture with a 21 Fr atrial septal dilator." },
            { title: "6. Place the inflow cannula", detail: "Advance the left atrial cannula until its whole fenestrated end lies inside the left atrium." },
            { title: "7. Complete the circuit as for VA-ECMO", detail: "The arterial cannula and the connections to the pump follow the VA-ECMO technique (taught in pm-support-devices)." },
          ],
        },
        {
          kind: "check",
          stem: "During insertion of the transseptal bypass pump the needle is thought to have entered the aortic root rather than the left atrium. The sheath has not been advanced. What does Brilakis say about this?",
          options: [
            "It is usually well tolerated as long as the transseptal sheath is not advanced",
            "It calls for emergency surgical repair, because the aortic root has been punctured",
            "Advance the sheath over the needle to seal the hole, then withdraw it slowly",
            "Give heparin straight away to prevent thrombus forming along the needle track",
          ],
          answer: 0,
          explanation:
            "Brilakis states that accidentally puncturing the aorta or another cardiac structure is usually tolerated, provided the transseptal sheath has not followed the needle through it. That is why left atrial position is verified before the sheath goes across, and why heparin is given only after entry into the left atrium. Advancing the sheath would turn a needle hole into a large one.",
        },
        { kind: "h", text: "What goes wrong (Brilakis 14.6.2)" },
        {
          kind: "list",
          items: [
            "**Anatomical variation** can make the transseptal puncture impossible, or send the needle into the aorta or through the atrial wall.",
            "**Prevention:** use transoesophageal or intracardiac echo guidance; verify left atrial access before the sheath is introduced into the left atrium; and, as Brilakis also advises, perform the transseptal puncture under positive intrathoracic pressure and hold the cannula's proximal end lower than the heart.",
            "**Treatment:** a puncture into the aorta or another structure is usually tolerated if the transseptal sheath has not been advanced.",
            "**Cannula displacement** into the right atrium: prevented by continuous monitoring (14.2).",
            "**Vascular:** the highest limb ischaemia grade with VA-ECMO, plus the access and bleeding risks of large-bore cannulae.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Advancing the dilator or sheath before left atrial position is confirmed.",
            "Leaving part of the fenestrated tip on the right side of the septum.",
            "Choosing a transseptal device for an arrest, when there is no time for left atrial access.",
            "Forgetting that the transseptal bypass pump, like the microaxial pump and the balloon pump, depends on the right ventricle.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the transseptal bypass pump as VA-ECMO with the drainage moved to the left atrium: the arterial half of the job is the same, and the transseptal half adds both the advantage (the left heart is emptied) and the extra risk.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Use the VA-ECMO circuit as the nearest model: trace the arterial return and the pump, then state what would change in a transseptal bypass pump (drainage from the left atrium through a 21 Fr transseptal cannula, no oxygenator unless one is added) and why that lowers LV filling pressure instead of raising it.",
        },
        { kind: "video", id: "J3LVbnVq3NA", note: "Brilakis lecture on advanced haemodynamic support in the cath lab." },
        { kind: "video", id: "bFmqPwxztlE", note: "Brilakis lecture on haemodynamic support for complex PCI." },
        {
          kind: "keypoints",
          items: [
            "Left atrium (21 Fr transseptal cannula) → centrifugal pump → femoral artery (15–19 Fr); 4–5 L/min by cannula size in Brilakis's table.",
            "No oxygenation unless an oxygenator is added; depends on the RV; affected by arrhythmia.",
            "Hardest of the four to insert, least available, high limb ischaemia risk; contraindicated with left atrial thrombus.",
            "Steps: venous access usually in the right groin, imaging-guided transseptal puncture, heparin on entering the left atrium, extra-support wire, 21 Fr septal dilator, whole fenestrated tip in the left atrium, rest as VA-ECMO.",
            "Prevention: echo guidance, verify the left atrium before the sheath, puncture under positive intrathoracic pressure with the cannula end below the heart; monitor continuously against slipping back into the right atrium.",
            "An alternative to the microaxial pump for severe LV shock in experienced centres; no mortality gain over the balloon pump in a small shock trial; impractical in arrest.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-support-choice-cpr",
      title: "Mechanical chest compression in the catheter laboratory",
      minutes: 11,
      topics: ["acs-mechanical-cpr"],
      sources: [
        { book: "brilakis-pci", loc: "14.7" },
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.20" },
        { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
        { book: "oxford-cath", loc: "ch 2: The radiographer" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "yadav-cath-lab-arrest-2018", "elison-mechanical-cpr-trauma-2019", "linc-2014", "paramedic-2015", "hallstrom-aspire-2006"],
      blocks: [
        {
          kind: "p",
          text: "When a patient arrests on the table, the operator usually needs to keep working on the cause, an occluded artery or a perforation, while the circulation is maintained. Manual compressions do that badly in the lab, and mechanical chest compression devices were built to do it consistently. This lesson covers what the devices are, how they fit into an arrest in the lab, their harms, and what comes next when circulation does not return. The arrest algorithm itself (shocks, drugs, roles) is in the Academy lesson on cardiac arrest in the cath lab and in cp-complex-patients.",
        },
        { kind: "h", text: "Why manual compressions struggle in the lab" },
        {
          kind: "p",
          text: "Oxford, quoting the American and European guidelines current when it was written, gives compressions at least 5 cm deep at 100 a minute with full recoil of the chest, and notes that people find these targets hard to meet and rarely achieve them, particularly in a long arrest. Resuscitation guidelines are revised every few years, so take the exact depth and rate from your current resuscitation council guideline. The 2018 review Brilakis cites lists the lab's extra problems: little room around the table, the rescuer in lead leaning across the C-arm and tiring quickly, frequent pauses for shocks or for the operator, the rescuer's hands in the X-ray beam beside the tube, and an operator trying to position a stent on a heart that is being compressed and with hands in the field.",
        },
        { kind: "h", text: "The devices" },
        {
          kind: "table",
          caption: "The two designs (Oxford chapter 9, Brilakis 14.7)",
          head: ["", "Piston devices", "Load-distributing band devices"],
          rows: [
            ["How they compress", "A plunger, powered by compressed gas or electricity, pushes on the sternum at a set rate; some carry a suction cup that helps the chest re-expand after each stroke", "The patient lies on a backboard and a powered band around the chest tightens to compress the sternum"],
            ["Commercial systems in the manuals", "Two in Brilakis, one of which Oxford also names", "One, named by both manuals"],
            ["Fracture pattern noted by Oxford", "More sternal fractures", "More rib fractures"],
          ],
        },
        {
          kind: "list",
          items: [
            "**What they give:** consistent rate, depth and release without fatigue; no pauses to swap rescuers; compressions that continue during defibrillation; and a rescuer who is out of the beam and free for other tasks (review).",
            "**What they cost:** circulation stops while the device is applied. With training, the review reports a median of 7 seconds to the first mechanical compression.",
            "**Imaging:** a device on the front of the chest obscures the posteroanterior view, but coronary work is mostly done in oblique projections, so the review calls this a minor inconvenience.",
          ],
        },
        { kind: "h", text: "Using a device during an arrest in the lab" },
        {
          kind: "steps",
          items: [
            { title: "1. Start manual CPR at once", detail: "Do not wait for the device; follow the arrest algorithm for the rhythm." },
            { title: "2. Clear the space", detail: "Oxford's radiographer role includes moving the C-arm to make room for resuscitation." },
            { title: "3. Apply the device with the shortest possible pause", detail: "Compressions stop while it is positioned; a team that has practised can resume within seconds." },
            { title: "4. Check where it is compressing", detail: "The piston works over the sternum; Oxford lists a device shifting onto a vulnerable part of the chest or abdomen as one reason for harm, so recheck its position during the arrest." },
            { title: "5. Carry on treating the cause", detail: "Work in oblique projections around the device; shocks can be given without stopping compressions." },
            { title: "6. If circulation does not return promptly, escalate", detail: "Brilakis: in arrest during PCI, perform CPR, ideally with an automated system, then start VA-ECMO if the patient does not recover quickly. In his algorithm, cardiac arrest leads straight to VA-ECMO. The evidence for VA-ECMO in arrest in the lab is observational (the review cites a 14-patient series of arrests during PCI or valve implantation in which circulation returned in all and half survived to discharge), and the review notes that the American and European resuscitation recommendations for it are weak. It also mentions the microaxial pump as a possible option in arrest, without clinical data to support it." },
          ],
        },
        { kind: "tip", id: "pci-arrest-mechanical-cpr" },
        { kind: "tip", id: "pci-arrest-oblique-views" },
        { kind: "tip", id: "pci-arrest-no-rosc-ecmo" },
        {
          kind: "check",
          stem: "During primary PCI of an occluded LAD the patient goes into VF that does not respond to shocks. The wire is across the lesion and a stent is ready. Manual CPR has started and a piston device is available. What is the best sequence?",
          options: [
            "Continue manual CPR and deliver the stent in the posteroanterior view, leaving the device off so the image stays clear",
            "Pause CPR, insert a balloon pump through the femoral sheath, and let it hold the circulation until the rhythm returns",
            "Fit the device and then stop compressions every two minutes so that clean images can be taken for the stent",
            "Fit the device with a short pause, keep shocking, finish in oblique views, VA-ECMO if no early return",
          ],
          answer: 3,
          explanation:
            "The device gives consistent compressions without rescuer fatigue or radiation to the rescuer's hands, it can continue during defibrillation, and the PCI can be finished in oblique views around it. If the patient does not recover promptly, Brilakis moves to VA-ECMO. A balloon pump needs the heart's own function to augment and is ineffective in arrest, and planned pauses for imaging defeat the purpose of the device.",
        },
        { kind: "h", text: "Harms" },
        {
          kind: "list",
          items: [
            "Brilakis: rib fractures and even laceration of the heart.",
            "Oxford: damage to internal organs; more sternal fractures with the piston device and more rib fractures with the band device; the interruption while the device is positioned; and the device moving onto vulnerable parts of the chest or abdomen during use.",
            "A case report Brilakis cites describes perforation of the right ventricle and a coronary artery attributed to mechanical CPR during primary PCI.",
          ],
        },
        { kind: "h", text: "The evidence" },
        {
          kind: "p",
          text: "Oxford reports that American and European guidelines do not recommend routine use of mechanical CPR in cardiac arrest because supportive outcome data are limited. In out-of-hospital arrest, the LINC trial (2589 patients) found no difference in survival at 4 hours or 6 months with a piston device, and PARAMEDIC (4471 patients) found no improvement in 30-day survival. The 2018 review adds the two large randomised trials of a band device, ASPIRE (1071 patients) and CIRC (4753), neither of which improved survival to discharge. ASPIRE was stopped early, and in its primary population neurological outcome at discharge was worse with the device, with a trend towards lower survival to discharge. The review notes that the 2015 AHA guideline nonetheless gives these devices a Class IIb recommendation as a reasonable alternative to manual compression, and that their use in the lab specifically is supported by the AHA (Class IIb) and described as strongly recommended by the European guidelines. Evidence from the lab itself is limited to small studies: a retrospective series of 53 patients with more return of circulation, and a prospective series of 42 that suggested better survival with good neurological recovery. Brilakis's position is practical: the devices make an arrest in the lab easier to manage, and he includes external compression devices in the support equipment of a PCI lab.",
        },
        {
          kind: "check",
          stem: "A colleague argues that mechanical CPR devices should be removed from the lab because randomised trials showed no survival benefit. What is the most accurate reply?",
          options: [
            "Remove them: every randomised trial of these devices showed worse survival than manual CPR",
            "Keep them: the large trials were out of hospital, and in the lab they solve practical problems",
            "Keep them: randomised lab trials showed better neurologically intact survival with the devices",
            "Keep them: current guidelines recommend them for routine use in every arrest, in or out of hospital",
          ],
          answer: 1,
          explanation:
            "LINC and PARAMEDIC (piston device) found neither benefit nor harm in survival, and CIRC (band device) found no gain; the harm signal came from ASPIRE, an early band-device trial, which found worse neurological outcome. None of these trials was in the lab. There the devices remove rescuer fatigue, radiation to the rescuer's hands and pauses, and let the operator work while compressions continue; lab evidence is small and observational. Oxford notes that guidelines do not recommend routine use in all arrests, while the 2018 review reports guideline support for their use in the lab. Brilakis keeps them, warning of rib fracture and cardiac laceration.",
        },
        {
          kind: "pitfalls",
          items: [
            "Letting the device application become a long pause in compressions; practise it as a team.",
            "Failing to recheck the device position: a shifted piston compresses the wrong place.",
            "Expecting a balloon pump or the transseptal bypass pump to rescue an arrest: the first needs native heart function and the second needs left atrial access.",
            "Continuing mechanical CPR indefinitely without a decision about VA-ECMO.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide in the planning meeting for every high-risk case where the compression device is, who fits it and which oblique views the operator will use if it is on; in the arrest itself there is no time to work this out.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Arrest during PCI with a compression device running: confirm wire positions for VA-ECMO cannulation on fluoroscopy before dilating, then establish flow, and state why VA-ECMO rather than a balloon pump or the transseptal bypass pump is the support for arrest.",
        },
        { kind: "video", id: "J3LVbnVq3NA", note: "Brilakis lecture on advanced haemodynamic support in the cath lab." },
        {
          kind: "keypoints",
          items: [
            "Two designs: piston devices over the sternum and load-distributing band devices around the chest.",
            "In the lab they remove rescuer fatigue, radiation to the rescuer's hands and pauses, and allow compressions during shocks.",
            "They block the posteroanterior view; work in oblique projections.",
            "Harms: sternal and rib fractures, organ injury, cardiac laceration; the application pause; device shift.",
            "Out-of-hospital trials (LINC, PARAMEDIC, CIRC, ASPIRE) showed no survival benefit, and ASPIRE worse neurological outcome with a band device; lab evidence is small and observational. Not recommended for routine use in all arrests (Oxford), but supported in the cath lab (review).",
            "Arrest without prompt return of circulation: Brilakis goes to VA-ECMO, not a balloon pump; the lab evidence for it is observational and the recommendations weak.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-support-choice-q1",
      stem: "Before complex PCI, a patient with an ejection fraction of 30% has a wedge of 26 mmHg and a mixed venous saturation of 48%; blood pressure is 116/72 mmHg. According to Brilakis, what do these numbers indicate?",
      options: [
        "A high risk of pulmonary oedema and shock around the procedure",
        "Normal haemodynamics, because the arterial pressure is preserved",
        "Isolated right ventricular failure needing a right-sided device",
        "Cardiogenic shock, because the wedge pressure is above 25 mmHg",
      ],
      answer: 0,
      explanation:
        "Brilakis flags a wedge above 25 mmHg with a mixed venous saturation below 50% as a high risk of periprocedural pulmonary oedema and shock; the wedge is also above the 18 mmHg that suggests LV failure. The arterial pressure is normal, so this is abnormal but stable haemodynamics, not shock. Nothing here measures RV function directly; PAPi and RA pressure would.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-choice-q2",
      stem: "Which combination does Brilakis say should, in most cases, receive prophylactic support before PCI if it is feasible?",
      options: [
        "Normal haemodynamics with a high-risk procedure such as atherectomy",
        "Abnormal haemodynamics with a low-risk procedure on a small vessel",
        "Abnormal haemodynamics with a high-risk procedure such as left main PCI",
        "Any patient with an ejection fraction below 35%, whatever the procedure",
      ],
      answer: 2,
      explanation:
        "Brilakis (2020, citing the 2015 SCAI consensus) recommends prophylactic support in most cases when abnormal haemodynamics and a high-risk procedure coincide. When only one of the two is present, support is not usually inserted prophylactically but kept immediately available, often with a 4 Fr femoral sheath in place. An ejection fraction threshold alone is not Brilakis's rule; Oxford's CHIP definition needs complex anatomy, comorbidity and haemodynamic compromise together. Since the manual, CHIP-BCIS3 (300 patients with severe LV dysfunction having complex PCI) found no benefit from routine elective microaxial unloading, with numerically more deaths, so upfront support even in this group is now an individual decision against standby.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "rihal-mcs-consensus-2015", "perera-chip-bcis3-2026"],
    },
    {
      id: "pm-support-choice-q3",
      stem: "A patient needing prophylactic support has a native aortic valve with mild regurgitation, no thrombus and no septal defect. The right iliac artery is 4 mm and heavily calcified; the left iliofemoral axis is 4.5 mm and tortuous. Your centre has an experienced axillary access operator. What does Brilakis's algorithm suggest?",
      options: [
        "A balloon pump, because neither femoral route is adequate",
        "VA-ECMO through the larger left femoral artery",
        "No support, because the femoral route is unsuitable",
        "A microaxial pump through the axillary artery",
      ],
      answer: 3,
      explanation:
        "There is no contraindication to the microaxial pump, but both femoral routes fail the test (more than 5 mm without severe calcium or tortuosity). The algorithm then asks whether an alternative route is feasible: axillary or transcaval access, which need large-bore expertise. With that expertise available, the pump goes in by the axillary route. The balloon pump is the answer only when no alternative route is feasible, and VA-ECMO needs even larger arterial cannulae.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-choice-q4",
      stem: "On Brilakis's device comparison, which statement is correct?",
      options: [
        "The balloon pump adds about 2 L/min of output through a 7–8 Fr sheath",
        "The microaxial pump corrects respiratory failure if the LV is unloaded",
        "VA-ECMO needs no right ventricular function and is unaffected by arrhythmia",
        "The transseptal bypass pump has the lowest limb ischaemia risk, as it drains a vein",
      ],
      answer: 2,
      explanation:
        "Of the four left-sided devices, only VA-ECMO works without RV function and is unaffected by arrhythmia; it also corrects respiratory failure, which the transseptal bypass pump does only with an added oxygenator. The balloon pump adds 0.3–0.5 L/min, the microaxial pump does not oxygenate, and the transseptal bypass pump shares the highest limb ischaemia grade with VA-ECMO because of its large arterial cannula.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-choice-q5",
      stem: "In shock after an inferior STEMI: MAP 60 mmHg, cardiac output 3.0 L/min, PA 26/20 mmHg, RA 16 mmHg, wedge 10 mmHg, oxygen saturation 97%. Which device does Brilakis's shock algorithm point to?",
      options: [
        "A left-sided microaxial pump, because the CPO is well below 0.6 W",
        "A balloon pump with monitoring, because the cardiac index may still be above 2.0",
        "A right-sided device, such as a dual-lumen cannula system or right-sided pump",
        "VA-ECMO, because the low CPO means that both ventricles are failing",
      ],
      answer: 2,
      explanation:
        "CPO = 60 × 3.0 ÷ 451 ≈ 0.40 W, so this is shock. There is no hypoxaemia. PAPi = (26 − 20) ÷ 16 ≈ 0.38 and the RA is above 12 mmHg: the RV is failing. The wedge of 10 mmHg does not suggest LV failure. Isolated RV failure leads to a right-sided device. A left-sided pump depends on the RV; a low CPO does not by itself mean both ventricles are failing, and VA-ECMO is the choice for refractory hypoxaemia or biventricular failure.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "korabathina-papi-2012"],
    },
    {
      id: "pm-support-choice-q6",
      stem: "After culprit PCI with a microaxial pump for anterior STEMI shock, the post-PCI numbers are CPO 0.48 W and PAPi 1.4. What does the shock protocol Brilakis reproduces suggest next?",
      options: [
        "Wean vasopressors and inotropes now and plan removal of the pump before leaving the lab",
        "More left-sided support: a stronger device or transfer to an LVAD or transplant centre",
        "Right-sided support, because the low CPO shows that the right ventricle is limiting flow",
        "Swap the pump for a balloon pump, to lower the risk of bleeding from the access site",
      ],
      answer: 1,
      explanation:
        "CPO below 0.6 W with PAPi above 0.9 means the RV is coping and the left-sided support is not enough: the protocol suggests additional support (a more robust device or transfer to an advanced heart failure centre) according to local practice. Right-sided support is for a PAPi below 0.9. Weaning needs CPO above 0.6 W and PAPi above 0.9 off drugs, and swapping to a balloon pump lowers support.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "basir-ncsi-2019"],
    },
    {
      id: "pm-support-choice-q7",
      stem: "Why does Brilakis advise caution with FFR in cardiogenic shock?",
      options: [
        "Adenosine is contraindicated in patients who are receiving vasopressor infusions",
        "FFR depends on coronary afterload, so it may not show the true severity of a stenosis",
        "The pressure wire cannot be passed through a guide alongside a running microaxial pump",
        "FFR overestimates stenosis severity because hyperaemia is exaggerated in shock",
      ],
      answer: 1,
      explanation:
        "Brilakis explains that FFR is affected by coronary afterload and may therefore be inaccurate in shock, so physiology should be used with caution. He does not say the error runs in one direction or attribute it to exaggerated hyperaemia, and he gives neither of the other reasons. Non-culprit lesions are in any case staged after culprit-only PCI in shock.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-choice-q8",
      stem: "A patient on a microaxial pump for LV shock is also placed on VA-ECMO for refractory shock with hypoxaemia. Why is the microaxial pump often left in?",
      options: [
        "It adds oxygenation that the femoral ECMO circuit cannot deliver to the heart",
        "It prevents differential cyanosis by pumping oxygenated blood into the aortic arch",
        "It allows the ECMO flow to be turned down to zero within the first few hours",
        "It vents the LV, which VA-ECMO loads by raising its pressure and volume",
      ],
      answer: 3,
      explanation:
        "VA-ECMO raises LV end-diastolic pressure and volume and so myocardial oxygen demand, and Oxford lists ventricular distension among its drawbacks. Brilakis notes the microaxial pump is often kept in to unload the LV during VA-ECMO. The pump does not oxygenate: it delivers LV blood that has passed through the patient's own lungs. In pulmonary oedema that blood is desaturated, so the pump can cause or worsen differential (upper-body) hypoxaemia rather than prevent it; monitor right radial gases and optimise ventilation. Turning ECMO flow to zero within hours is not a reason Brilakis gives.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "elso-va-2021"],
    },
    {
      id: "pm-support-choice-q9",
      stem: "During insertion of the transseptal bypass pump, which step comes immediately after entry into the left atrium?",
      options: [
        "Give heparin, then place an extra-support wire in the left atrium",
        "Dilate the septum with the 21 Fr dilator before any anticoagulant is given",
        "Advance the arterial cannula into the femoral artery and start the pump",
        "Add an oxygenator to the circuit, which is mandatory for the device",
      ],
      answer: 0,
      explanation:
        "Brilakis gives heparin immediately after entry into the left atrium, then places an extra-support wire there, dilates the skin and then the septum with a 21 Fr dilator, and advances the cannula until the whole fenestrated segment sits within the left atrium. The arterial side and connections follow the VA-ECMO technique afterwards. An oxygenator is optional, added only for full cardiopulmonary support.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "pm-support-choice-q10",
      stem: "Which statement about mechanical chest compression devices is supported by the manuals and the trials they cite?",
      options: [
        "Randomised trials in the cath lab showed better neurologically intact survival",
        "They must be stopped for each shock and moved aside before taking an oblique view",
        "Guidelines recommend them for routine use in all cardiac arrests, in or out of hospital",
        "They help manage an arrest in the lab but can fracture ribs and lacerate the heart",
      ],
      answer: 3,
      explanation:
        "Brilakis says the devices can make managing an arrest in the lab easier but carry risks including fractured ribs and even a lacerated heart. Oxford notes guidelines do not recommend routine use in all arrests, although the 2018 review reports guideline support for their use in the lab. The large trials (LINC, PARAMEDIC, CIRC, ASPIRE) were out of hospital and showed no survival benefit, ASPIRE showing worse neurological outcome with a band device, and there are no randomised lab trials. Compressions can continue during defibrillation, and coronary work is mostly done in oblique views around the device.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "yadav-cath-lab-arrest-2018", "hallstrom-aspire-2006"],
    },
    {
      id: "pm-support-choice-q11",
      stem: "A man in infarct-related shock is being considered for a balloon pump. Which statement reflects the evidence and the manuals?",
      options: [
        "IABP-SHOCK II showed a significant reduction in 30-day mortality with routine balloon pumping in shock",
        "Oxford: routine balloon pumping in infarct shock is not advised; Brilakis keeps it for pre-shock",
        "Brilakis recommends a balloon pump as the first-line support in severe shock from LV failure",
        "Oxford recommends a microaxial pump routinely in every patient with infarct-related shock",
      ],
      answer: 1,
      explanation:
        "IABP-SHOCK II (600 patients) found 30-day mortality of 39.7% with the balloon pump and 41.3% without, no significant difference, and Oxford states that routine balloon pumping is not recommended in infarct-related shock. Brilakis uses the balloon pump in pre-shock (cardiac index above 2.0) with continuous monitoring and a microaxial pump in severe LV shock. Oxford gives no routine recommendation for the newer devices either. Since the manuals, the 2025 ACC/AHA/SCAI guideline (as summarised by one of its authors) rates routine balloon pumping as Class III and gives a microaxial pump Class IIa in selected refractory infarct shock, after DanGer Shock.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "iabp-shock-ii-2012", "rao-acs-guideline-2025", "restrepo-acs-guideline-review-2026"],
    },
  ],
  sims: [
    { sim: "haemo", task: "Profile a patient before high-risk PCI and a patient in shock: wedge, mixed venous saturation, CPO and PAPi, then classify and name the support the algorithm gives." },
    { sim: "impella", task: "Before positioning, confirm the pump is allowed (no mechanical aortic valve, LV thrombus, severe aortic regurgitation or septal defect; iliofemoral route over 5 mm), then recognise RV-limited flow and state the next support step." },
    { sim: "iabp", task: "Use the balloon pump as the choice when a microaxial pump is contraindicated, after excluding severe aortic regurgitation, dissection and uncontrolled bleeding." },
    { sim: "ecmo", task: "Recognise LV distension on VA-ECMO and keep a left-sided pump as a vent; use VA-ECMO for arrest that does not respond to CPR." },
  ],
  caseIds: ["pm-support-choice-case-chip", "pm-support-choice-case-shock"],
};

export const cases: CaseStudy[] = [
  {
    id: "pm-support-choice-case-chip",
    title: "Support for a last-remaining-vessel PCI",
    trackId: "pci-manual",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 1.14, 14.1, 14.2, 17.1, 17.14 and 19.9; Oxford Handbook, chapter 9 (mechanical circulatory support, IABP, Impella)",
    },
    summary: "Planning support for left main PCI with atherectomy in a man with a low ejection fraction and an occluded RCA: gathering the data, classifying risk, checking contraindications and choosing the route.",
    presentation:
      "A 71-year-old man with class III angina and breathlessness. Ejection fraction 25%. Angiography shows a heavily calcified distal left main bifurcation lesion and a chronically occluded RCA filled by collaterals from the LAD. The heart team has declined surgery because of his surgical risk and recommended PCI with rotational atherectomy.",
    findings: [
      "Blood pressure 112/70 mmHg, heart rate 84/min, sinus rhythm",
      "Raised jugular venous pressure and bibasal crackles on examination",
      "Creatinine 132 µmol/L; BNP raised",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What do you add to the plan before booking the procedure?",
        options: [
          {
            text: "A right heart study at the start, an echo review of both ventricles and the valves, and imaging of the iliofemoral arteries",
            best: true,
            feedback: "Brilakis's checklist asks for echo (ejection fraction, ventricular sizes, valves), access imaging to see whether support is feasible, and a right heart study, which he strongly recommends with a low ejection fraction and complex PCI.",
          },
          {
            text: "An elective balloon pump, as for every left main case with impaired LV function",
            feedback: "That is Oxford's left main advice (an elective balloon pump with impaired LV function). BCIS-1 found no fewer major events at discharge with elective balloon pumping, although deaths were fewer at a median of 51 months. Brilakis bases the decision on the haemodynamics and the procedural risk, and you have not measured the haemodynamics.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Nothing extra: decide on support if he becomes hypotensive",
            next: "c-unplanned",
            feedback: "A last remaining vessel, left main disease and atherectomy make this a high-risk procedure; waiting for hypotension leaves no access and no device ready.",
            stateDelta: { stability: -10, flags: ["no-plan"] },
          },
        ],
      },
      {
        id: "c-unplanned",
        kind: "consequence",
        prompt: "The attending reviews the plan the evening before and asks what you will do if his pressure falls during the first atherectomy run with nothing prepared. What do you change?",
        options: [
          {
            text: "Add a right heart study, echo review and iliofemoral imaging now, and decide on support from the results",
            best: true,
            feedback: "The decision rests on baseline haemodynamics and procedural risk; gather the data before the case, not during a collapse.",
          },
          {
            text: "Keep the plan: vasopressors will hold him through a short run",
            feedback: "Vasopressors raise myocardial oxygen demand and can provoke arrhythmias, and a collapse during atherectomy of the only open territory may not wait for drugs. The attending insists on the right heart study.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "At the start of the procedure: RA 10 mmHg, PA 52/30 mmHg, wedge 27 mmHg, cardiac output 3.6 L/min, mixed venous saturation 47%, arterial pressure 108/66 mmHg (MAP 80). How do you classify him, and what support plan follows?",
        variants: [{ flag: "no-plan", info: "The study was added to the plan after the attending's review." }],
        options: [
          {
            text: "Abnormal but stable with a high-risk procedure: discuss upfront support against standby, with the access and catheter in",
            best: true,
            feedback: "Wedge above 18 (LV failure) and wedge above 25 with mixed venous saturation below 50% (high risk of pulmonary oedema and shock). CPO = 80 × 3.6 ÷ 451 ≈ 0.64 W, so he is not in shock. Brilakis favours prophylactic support for this combination, but CHIP-BCIS3, in patients like him, found no benefit from routine elective unloading and numerically more deaths. After the discussion he and the team choose upfront support for the atherectomy runs, so the device choice follows.",
          },
          {
            text: "Prophylactic support before the atherectomy, without further discussion",
            feedback: "This follows Brilakis's framework (abnormal haemodynamics plus a high-risk procedure: prophylactic support in most cases). Since CHIP-BCIS3 the choice between upfront support and standby should be discussed with the team and the patient rather than assumed.",
          },
          {
            text: "Standby: the 4 Fr femoral sheath in, a device in the room and the PA catheter left in to guide escalation",
            next: "c-standby",
            feedback: "A defensible plan since CHIP-BCIS3, though Brilakis would put support in first for this combination. The trade-off: no large-bore access or device risk unless it is needed, against the chance of a collapse during atherectomy in his only open territory, so the escalation plan must be ready.",
            stateDelta: { flags: ["standby-only"] },
          },
          {
            text: "Cardiogenic shock: VA-ECMO before any coronary work",
            feedback: "He is not in shock (MAP 80, CPO about 0.64 W, no hypoperfusion) and not hypoxaemic. VA-ECMO would also load an LV that is already congested.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-standby",
        kind: "consequence",
        prompt: "Teaching branch: during the second atherectomy run the pressure falls to 74/42 mmHg, the PA diastolic rises to 36 mmHg and he becomes breathless. What now?",
        options: [
          {
            text: "Stop the run, support the pressure, and insert a device through the standby access, choosing it by the algorithm",
            best: true,
            feedback: "Instability on standby moves you straight to device selection. Stopping the ischaemic step comes first.",
          },
          {
            text: "Finish the run quickly so flow returns, then reassess",
            feedback: "Continuing atherectomy in the only open territory while he decompensates risks slow flow and arrest.",
            stateDelta: { stability: -20, flags: ["collapse"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Before choosing the device you review the echo. Which finding would rule out a microaxial pump?",
        options: [
          {
            text: "An apical LV thrombus",
            best: true,
            feedback: "LV thrombus is one of the four contraindications in Brilakis's algorithm, with a mechanical aortic valve, severe aortic regurgitation and an atrial or ventricular septal defect. His echo shows none of them.",
          },
          {
            text: "Mild aortic regurgitation",
            next: "c-ar",
            feedback: "Brilakis's contraindication is severe aortic regurgitation (Oxford says moderate or severe). Mild regurgitation does not rule the pump out.",
            stateDelta: { stability: -5 },
          },
          {
            text: "An ejection fraction of 25%",
            feedback: "A low ejection fraction is the reason for support, not a contraindication; Oxford notes the pump contributes more the worse the LV.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-ar",
        kind: "consequence",
        prompt: "A colleague suggests a balloon pump instead because of the mild regurgitation. What do you say?",
        options: [
          {
            text: "Mild regurgitation excludes neither device; the algorithm still favours the pump if the iliofemoral route allows",
            best: true,
            feedback: "Both manuals contraindicate the pump only for severe (Brilakis) or moderate to severe (Oxford) regurgitation. The balloon pump adds only 0.3–0.5 L/min.",
          },
          {
            text: "Agree: any regurgitation rules out a transaortic pump",
            feedback: "That is not what either manual says, and it would give him the weakest device for a high-risk case.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Imaging of the access: right iliofemoral axis 4.3 mm with heavy calcium; left axis 6.8 mm with mild tortuosity and no significant calcium. Which route?",
        options: [
          {
            text: "The left femoral artery for the 14 Fr pump sheath",
            best: true,
            feedback: "The left side meets the criteria: more than 5 mm without severe calcium, tortuosity or obstruction. Brilakis inserts the pump through the least diseased femoral artery.",
          },
          {
            text: "The right femoral artery, which is the side you usually use",
            next: "c-right",
            feedback: "A 4.3 mm, heavily calcified axis fails the 5 mm test for a 14 Fr sheath.",
            stateDelta: { stability: -15, flags: ["bad-route"] },
          },
          {
            text: "The axillary artery, to avoid the iliac arteries altogether",
            feedback: "Alternative routes are for when the femoral route is inadequate; the left femoral route is adequate here, and axillary access needs its own large-bore expertise.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-right",
        kind: "consequence",
        prompt: "The 14 Fr sheath will not pass the calcified right external iliac artery. What next?",
        options: [
          {
            text: "Stop forcing it and insert the pump through the left femoral artery, the least diseased side",
            best: true,
            feedback: "Brilakis inserts the pump through the least diseased femoral artery. For a route that will not take the pump he lists a long (or sometimes short) peel-away sheath, iliac balloon angioplasty and intravascular lithotripsy, and iliac stenting can make a route usable, but a usable route already exists on the left.",
          },
          {
            text: "Push harder with the dilator",
            feedback: "Forcing a large sheath through a small calcified artery risks dissection, rupture and limb ischaemia.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "A trainee asks what the algorithm would have chosen if both axes had been 4 mm, calcified and tortuous, and no one in the centre did axillary or transcaval access.",
        options: [
          {
            text: "A balloon pump, as no alternative route for the pump would be feasible",
            best: true,
            feedback: "Femoral route inadequate and no feasible alternative: the algorithm ends at the balloon pump, accepting its smaller effect (0.3–0.5 L/min).",
          },
          {
            text: "VA-ECMO through the same femoral arteries",
            feedback: "VA-ECMO needs a 15–19 Fr arterial cannula, larger than the pump sheath, and severe peripheral arterial disease is a contraindication unless the cannula is placed by transcaval access.",
            stateDelta: { stability: -5 },
          },
          {
            text: "No support at all, because the femoral route is unusable",
            feedback: "No support is the end of the other branch, when the pump is contraindicated and so are the balloon pump and VA-ECMO.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "With prophylactic microaxial pump support through the left femoral artery, the atherectomy and left main stenting were completed without haemodynamic collapse. The pulmonary artery catheter stayed in to guide weaning at the end.",
    outcomeVariants: [
      { flag: "collapse", text: "Continuing the atherectomy during decompensation caused slow flow and a period of severe hypotension before support was established; he recovered but needed a longer stay in intensive care." },
      { flag: "bad-route", text: "The failed attempt on the calcified right iliac artery delayed the procedure until the pump went in through the left femoral artery." },
      { flag: "standby-only", text: "On standby, the pump went in through the prepared access when his pressure fell during atherectomy, and the procedure was completed with support running." },
    ],
    learningPoints: [
      "Gather history, examination, echo, access imaging and a right heart study before deciding on support.",
      "Wedge above 25 mmHg with mixed venous saturation below 50% warns of periprocedural pulmonary oedema and shock.",
      "Brilakis: abnormal haemodynamics plus a high-risk procedure means prophylactic support in most cases, one of the two means standby; since CHIP-BCIS3, upfront support against standby is an individual decision in the first group.",
      "Check the pump's four contraindications, then the iliofemoral route (over 5 mm, no severe calcium or tortuosity), then alternative routes, then the balloon pump.",
      "Mild aortic regurgitation is not a contraindication; severe is.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "perera-bcis1-2010", "perera-bcis1-longterm-2013", "perera-chip-bcis3-2026"],
  },
  {
    id: "pm-support-choice-case-shock",
    title: "Anterior STEMI in shock: which ventricle, which device",
    trackId: "pci-manual",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 14.1, 14.2 and 24.2 (Figs 14.1, 24.6, 24.7 and 24.8); Oxford Handbook, chapter 8 (primary PCI in cardiogenic shock) and chapter 9 (MCS, Impella, ECMO)",
    },
    summary: "Profiling infarct-related shock, choosing support before PCI, recognising a failing right ventricle after PCI, escalating to VA-ECMO with LV venting, and applying weaning criteria.",
    presentation:
      "A 58-year-old woman arrives 3 hours after the onset of chest pain with anterior ST elevation. She is cold and clammy, confused, and on a noradrenaline infusion.",
    findings: [
      "Blood pressure 82/54 mmHg on noradrenaline, heart rate 118/min, sinus tachycardia",
      "Oxygen saturation 95% on 4 L/min",
      "Lactate 5.8 mmol/L",
      "Echo in the emergency department: severe anterior hypokinesis, native valves without significant regurgitation, no LV thrombus seen",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How do you set up access in the lab?",
        options: [
          {
            text: "Ultrasound- and fluoroscopy-guided femoral arterial access plus venous access, and a right heart study before the coronary angiogram",
            best: true,
            feedback: "Brilakis notes femoral access may be preferred in shock because support is so often needed, and the shock protocols he reproduces start with arterial and venous access and a measured cardiac index or LVEDP.",
          },
          {
            text: "Radial access only, to minimise bleeding",
            feedback: "Radial access suits the coronary work, but a large-bore device will be needed and the femoral route has not been prepared or assessed.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Angiography first; the right heart study can wait until the ICU",
            feedback: "Without the haemodynamics you cannot choose the device on numbers, and the protocols place support before PCI when the criteria are met.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Right heart study: RA 9 mmHg, PA 40/26 mmHg, wedge 28 mmHg, Fick cardiac output 3.2 L/min, MAP 60 mmHg. Iliofemoral arteries are 7 mm without calcium. Which support, and when?",
        options: [
          {
            text: "A microaxial pump before the PCI",
            best: true,
            feedback: "CPO = 60 × 3.2 ÷ 451 ≈ 0.43 W; PAPi = 14 ÷ 9 ≈ 1.6. Severe shock from LV failure with a coping RV and no hypoxaemia: Brilakis's algorithm gives a microaxial pump, and the shock protocol he reproduces places it before PCI. She matches the DanGer Shock population (STEMI shock, not comatose after arrest), where the pump lowered 180-day mortality at the cost of more complications; the 2025 ACC/AHA/SCAI guideline gives it Class IIa in selected refractory infarct shock.",
          },
          {
            text: "A balloon pump, which is quicker to insert",
            next: "c-iabp",
            feedback: "Brilakis reserves the balloon pump for pre-shock (cardiac index above 2.0) with monitoring. Oxford notes routine balloon pumping in infarct-related shock is no longer recommended after IABP-SHOCK II, and the 2025 ACC/AHA/SCAI guideline rates routine balloon pumping as Class III.",
            stateDelta: { stability: -10, flags: ["iabp-first"] },
          },
          {
            text: "VA-ECMO for maximum flow",
            feedback: "She is not hypoxaemic and her RV is coping; VA-ECMO would raise the pressure and volume of a failing LV. It is the step for hypoxaemia, biventricular failure or refractory shock.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-iabp",
        kind: "consequence",
        prompt: "Twenty minutes after the balloon pump starts: MAP 62 mmHg, lactate 6.1 mmol/L, noradrenaline increased. What now?",
        options: [
          {
            text: "Escalate to a microaxial pump through adequate femoral access, then proceed to PCI",
            best: true,
            feedback: "The balloon pump adds only 0.3–0.5 L/min. Persistent hypoperfusion needs the support level the algorithm gives for severe LV shock.",
          },
          {
            text: "Add adrenaline and continue with the balloon pump",
            feedback: "Escalating drugs raises myocardial oxygen demand and arrhythmia risk without fixing the low output.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "With the pump running, angiography shows an occluded proximal LAD, a 90% mid-RCA and a 70% LCx. What PCI do you do now?",
        options: [
          {
            text: "Culprit-only PCI of the LAD, aiming for TIMI 3 flow; stage the others",
            best: true,
            feedback: "Culprit-only PCI at presentation (CULPRIT-SHOCK), as both manuals advise; staged treatment of the remaining lesions later.",
          },
          {
            text: "LAD PCI, then FFR of the RCA and LCx to decide on immediate treatment",
            next: "c-ffr",
            feedback: "FFR depends on coronary afterload and may be inaccurate in shock, and non-culprit PCI is staged anyway.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Treat all three vessels now while the pump supports her",
            feedback: "Immediate multivessel PCI was worse than culprit-only PCI in CULPRIT-SHOCK; support does not change that.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-ffr",
        kind: "consequence",
        prompt: "The RCA FFR is 0.86. A colleague says the RCA lesion is therefore not significant. What do you reply?",
        options: [
          {
            text: "FFR may not reflect stenosis severity in shock; leave the RCA for a staged assessment",
            best: true,
            feedback: "Brilakis warns that FFR may be inaccurate in shock because it depends on coronary afterload.",
          },
          {
            text: "Agree and record the RCA as non-significant",
            feedback: "A value measured in shock may be misleading; recording it as definitive could leave a significant lesion untreated.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After LAD stenting with TIMI 3 flow: MAP 72 mmHg, cardiac output 4.0 L/min, PA 28/20 mmHg, RA 16 mmHg, wedge 14 mmHg. The pump console shows intermittent suction alarms. What is the reading and the next step?",
        options: [
          {
            text: "CPO about 0.64 W but PAPi 0.5: the RV is limiting; consider right-sided support",
            best: true,
            feedback: "CPO = 72 × 4.0 ÷ 451 ≈ 0.64 W; PAPi = 8 ÷ 16 = 0.5. With RV dysfunction suspected clinically, the protocol suggests right-sided support. RV failure is one of Brilakis's causes of suction alarms.",
          },
          {
            text: "Increase the pump speed to raise the output further",
            next: "c-suction",
            feedback: "A left-sided pump cannot fill if the RV is not delivering blood; more speed worsens suction. Brilakis reduces the speed by one or two levels.",
            stateDelta: { stability: -10, flags: ["suction"] },
          },
          {
            text: "Begin weaning: CPO is above 0.6 W",
            feedback: "Weaning needs PAPi above 0.9 and the patient off all drugs as well; PAPi is 0.5.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-suction",
        kind: "consequence",
        prompt: "At the higher speed the suction alarms become continuous and the flow falls. What do you do?",
        options: [
          {
            text: "Reduce the speed by one or two levels, check the position, give fluid only if the patient is dry, and support the RV",
            best: true,
            feedback: "That is Brilakis's treatment of a suction alarm. Fluid is only for hypovolaemia; with an RA pressure of 16 mmHg she is not dry, so the RV needs support rather than fluid.",
          },
          {
            text: "Give a large fluid bolus to fill the LV",
            feedback: "With an RA pressure of 16 mmHg, fluid will further distend the failing RV.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Six hours later in the intensive care unit: oxygen saturation 84% on high-flow oxygen with pulmonary oedema, lactate rising to 4.5 mmol/L, CPO 0.45 W, PAPi 0.6. What support now?",
        variants: [{ flag: "suction", info: "A right-sided device was not available overnight; the left-sided pump is running at a reduced speed." }],
        options: [
          {
            text: "Intubate and ventilate, then VA-ECMO with the microaxial pump kept in as an LV vent, monitoring right radial gases",
            best: true,
            feedback: "Treat the hypoxaemia with ventilation first. Hypoxaemia that persists with failure of both ventricles leads to VA-ECMO, which oxygenates and does not need the RV; keep the left-sided pump to unload the LV that ECMO will load. With the lungs failing, the blood the pump and the LV send to the arch has crossed the patient's own lungs and is desaturated, so check right radial gases or saturation for differential hypoxaemia and optimise ventilation (see the Academy lesson on VA-ECMO).",
          },
          {
            text: "VA-ECMO, removing the microaxial pump to reduce bleeding",
            feedback: "VA-ECMO raises LV pressure and volume; removing the vent risks LV distension and worse pulmonary oedema.",
            stateDelta: { stability: -10, flags: ["no-vent"] },
          },
          {
            text: "Add a balloon pump alongside the microaxial pump",
            feedback: "A balloon pump neither oxygenates nor supports the RV, and adds only 0.3–0.5 L/min.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Day 3: she is off ECMO, on the microaxial pump at low speed, on a low dose of dobutamine, with CPO 0.7 W and PAPi 1.1. When can the pump come out, and what if she had not recovered?",
        options: [
          {
            text: "Stop the dobutamine first and remove the pump once she is off all drugs with CPO above 0.6 and PAPi above 0.9; without recovery in 3–5 days, refer to an LVAD or transplant centre, or palliative care if not a candidate",
            best: true,
            feedback: "Those are the weaning and bridge-to-decision rules of the protocol Brilakis reproduces; Oxford adds that support decisions weigh age, comorbidity, neurological function and expected quality of life.",
          },
          {
            text: "Remove the pump now, because both numbers are above target",
            feedback: "She is still on an inotrope; the criteria require her to be off all vasopressors and inotropes first.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Keep the pump in for at least two weeks to rest the ventricle",
            feedback: "The protocol does not set a fixed rest period: it reassesses for weaning repeatedly, with daily haemodynamic assessment, and moves the decision on if there is no recovery in 3–5 days.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "After culprit-only PCI with a microaxial pump, a period of VA-ECMO with LV venting for hypoxaemia and RV failure, and weaning by the protocol's criteria, she left intensive care with a recovering ejection fraction.",
    outcomeVariants: [
      { flag: "iabp-first", text: "The initial balloon pump delayed adequate support by about half an hour, during which her lactate rose." },
      { flag: "no-vent", text: "Without LV venting on VA-ECMO her LV distended and the pulmonary oedema worsened until a vent was placed again." },
    ],
    learningPoints: [
      "In shock, take a right heart study before the coronary angiogram so CPO and PAPi decide the device.",
      "Severe LV shock with a coping RV and no hypoxaemia: a microaxial pump, placed before PCI in the protocols Brilakis reproduces; the balloon pump is for pre-shock.",
      "Culprit-only PCI; FFR may mislead in shock.",
      "After PCI, a low PAPi with suction alarms means the RV is the limit: lower the pump speed and support the RV.",
      "Hypoxaemia that persists despite ventilation, or biventricular failure: VA-ECMO, keeping the left-sided pump as a vent and watching right radial gases for differential hypoxaemia.",
      "Wean only off all drugs with CPO above 0.6 W and PAPi above 0.9; without recovery in 3–5 days, move to advanced therapy or palliation.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "basir-ncsi-2019", "culprit-shock-2017", "iabp-shock-ii-2012", "danger-shock-2024", "rao-acs-guideline-2025", "restrepo-acs-guideline-review-2026", "elso-va-2021"],
  },
];

export const tips: LabTip[] = [
  {
    id: "pci-support-plan-two-axes",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Decide support from two questions",
    text: "Before a high-risk PCI, classify the baseline haemodynamics (normal, abnormal but stable, shock, arrest) and the risk of the procedure. Only one of the two abnormal: keep a device on standby; neither: no support. Both: Brilakis (2020, after the 2015 SCAI consensus) advises prophylactic support in most cases, but CHIP-BCIS3 found no benefit from routine elective unloading, so discuss upfront support against standby with the access in and a pulmonary artery catheter to guide escalation.",
    tone: "do",
    lessonId: "pm-support-choice-when",
    sources: [{ book: "brilakis-pci", loc: "14.1" }],
    refs: ["brilakis-manual-pci", "rihal-mcs-consensus-2015", "perera-chip-bcis3-2026"],
  },
  {
    id: "pci-support-standby-sheath",
    lab: "pci",
    when: { phase: ["plan", "guide"] },
    title: "Standby means access already in",
    text: "When support is on standby, many operators place a small (4 Fr) femoral sheath at the start so that a balloon pump, microaxial pump or VA-ECMO can be inserted quickly if the patient becomes unstable; the device itself should be immediately available.",
    tone: "do",
    lessonId: "pm-support-choice-when",
    sources: [{ book: "brilakis-pci", loc: "14.1" }],
    refs: BRILAKIS,
  },
  {
    id: "haemo-support-rhc-thresholds",
    lab: "haemo",
    when: { phase: ["right-heart", "calculations"] },
    title: "Right heart numbers that change the PCI plan",
    text: "A wedge above 18 mmHg suggests LV failure and a PAPi below 0.9 suggests RV failure. A wedge above 25 mmHg with a mixed venous saturation below 50% marks a high risk of pulmonary oedema and shock during the procedure.",
    tone: "caution",
    lessonId: "pm-support-choice-when",
    sources: [{ book: "brilakis-pci", loc: "14.1" }],
    refs: ["brilakis-manual-pci", "korabathina-papi-2012"],
  },
  {
    id: "pci-support-swan-stays",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Leave the pulmonary artery catheter in",
    text: "Keep the pulmonary artery catheter in during a high-risk PCI or in a hypotensive, heart failure or shock patient: the PA pressure shows new changes and tells you when to escalate or reduce support.",
    tone: "do",
    lessonId: "pm-support-choice-when",
    sources: [
      { book: "brilakis-pci", loc: "14.1" },
      { book: "brilakis-pci", loc: "2.3" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "mcs-select-impella-contraindications",
    lab: "mcs",
    when: { phase: ["select"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Pump contraindications, then the route",
    text: "Before a microaxial pump, exclude a mechanical aortic valve, LV thrombus, severe aortic regurgitation and an atrial or ventricular septal defect; if one is present, consider a balloon pump or VA-ECMO, checking for severe aortic regurgitation, dissection, uncontrolled bleeding, aortic aneurysm (balloon pump) and severe peripheral arterial disease (VA-ECMO). The 14 Fr sheath needs iliofemoral arteries over 5 mm without severe calcium or tortuosity. If they fail, consider axillary or transcaval access where there is large-bore expertise; if no route is feasible, use a balloon pump.",
    tone: "caution",
    lessonId: "pm-support-choice-which",
    sources: [{ book: "brilakis-pci", loc: "14.1" }, { book: "brilakis-pci", loc: "14.2" }],
    refs: BRILAKIS,
  },
  {
    id: "haemo-support-cpo-papi",
    lab: "haemo",
    when: { phase: ["calculations"] },
    title: "In shock, calculate CPO and PAPi together",
    text: "CPO = MAP × cardiac output ÷ 451, with a target above 0.6 W. PAPi = (PA systolic − PA diastolic) ÷ RA pressure; below 0.9 suggests RV failure. Repeat both after PCI and in intensive care.",
    tone: "do",
    lessonId: "pm-support-choice-shock",
    sources: [{ book: "brilakis-pci", loc: "24.2" }, { book: "brilakis-pci", loc: "14.1" }],
    refs: ["brilakis-manual-pci", "korabathina-papi-2012", "tehrani-shock-team-2019"],
  },
  {
    id: "mcs-select-hypoxaemia-ecmo",
    lab: "mcs",
    when: { phase: ["select"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Refractory hypoxaemia in shock: VA-ECMO",
    text: "Treat hypoxaemia first with oxygen, ventilation and treatment of the pulmonary oedema. If it persists despite optimal oxygenation and ventilation, Brilakis uses VA-ECMO, because it supports oxygenation as well as the circulation. Routine early VA-ECMO did not reduce mortality in ECLS-SHOCK.",
    tone: "do",
    lessonId: "pm-support-choice-shock",
    sources: [{ book: "brilakis-pci", loc: "14.1" }, { book: "oxford-cath", loc: "ch 10: Pulmonary oedema" }],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "ecls-shock-2023"],
  },
  {
    id: "mcs-select-shock-severity",
    lab: "mcs",
    when: { phase: ["select"], event: ["hypotension"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Match the device to the severity of LV shock",
    text: "Pre-shock with a cardiac index above 2.0: a balloon pump may suffice, with continuous monitoring, ideally a pulmonary artery catheter. Severe shock: a microaxial pump, or the transseptal bypass pump in an experienced centre. Refractory shock: VA-ECMO or the 5.0 pump; when VA-ECMO is added, a microaxial pump already in place is often kept as an LV vent.",
    tone: "do",
    lessonId: "pm-support-choice-shock",
    sources: [{ book: "brilakis-pci", loc: "14.1" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-manage-post-pci-escalation",
    lab: "mcs",
    when: { phase: ["manage"], procedure: ["iabp", "impella", "ecmo"] },
    title: "After PCI, let CPO and PAPi decide",
    text: "CPO above 0.6 W and PAPi above 0.9: wean the drugs. CPO below 0.6 with PAPi below 0.9: consider right-sided support. CPO below 0.6 with PAPi above 0.9: consider more left-sided support or transfer to an advanced heart failure centre.",
    tone: "do",
    lessonId: "pm-support-choice-shock",
    sources: [{ book: "brilakis-pci", loc: "24.2" }],
    refs: ["brilakis-manual-pci", "basir-ncsi-2019"],
  },
  {
    id: "pci-support-ffr-in-shock",
    lab: "pci",
    when: { phase: ["physiology"], event: ["hypotension"] },
    title: "FFR may mislead in shock",
    text: "FFR depends on coronary afterload, so in cardiogenic shock it may not reflect the true severity of a stenosis. Use physiology with caution and stage non-culprit lesions.",
    tone: "caution",
    lessonId: "pm-support-choice-shock",
    sources: [{ book: "brilakis-pci", loc: "24.2" }],
    refs: BRILAKIS,
  },
  {
    id: "mcs-select-biventricular",
    lab: "mcs",
    when: { phase: ["select", "manage"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Check the right ventricle, and plan the LV vent on VA-ECMO",
    text: "Before a left-sided device in shock, check the RV: RA pressure above 12 mmHg or PAPi below 0.9 means it is failing, and the balloon pump, microaxial pump and transseptal bypass pump all need a working RV. Isolated RV failure: a right-sided device (dual-lumen cannula system or right-sided microaxial pump). Both ventricles failing: usually VA-ECMO, or left- and right-sided devices together. VA-ECMO raises LV end-diastolic pressure and volume and so myocardial oxygen demand (Oxford lists ventricular distension and poor coronary perfusion among its drawbacks), so plan how the LV will be unloaded: a microaxial pump already in place is often kept as a vent.",
    tone: "caution",
    lessonId: "pm-support-choice-rv",
    sources: [
      { book: "brilakis-pci", loc: "14.1" },
      { book: "brilakis-pci", loc: "14.2" },
      { book: "oxford-cath", loc: "ch 9: Extracorporeal membrane oxygenation" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "korabathina-papi-2012"],
  },
  {
    id: "mcs-wean-criteria",
    lab: "mcs",
    when: { phase: ["wean"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Weaning criteria before removal",
    text: "Consider removing the device only when the patient is off all vasopressors and inotropes, with CPO above 0.6 W and PAPi above 0.9. If the heart has not recovered within 3–5 days, discuss transfer to an LVAD or transplant centre, or palliative care if the patient is not a candidate.",
    tone: "do",
    lessonId: "pm-support-choice-rv",
    sources: [{ book: "brilakis-pci", loc: "24.2" }],
    refs: ["brilakis-manual-pci", "basir-ncsi-2019"],
  },
  {
    id: "pci-arrest-mechanical-cpr",
    lab: "pci",
    when: { phase: ["complication"], event: ["vf"] },
    title: "Arrest on the table: a compression device frees your hands",
    text: "Start manual CPR at once, then fit the mechanical compression device with the shortest possible pause. It gives consistent compressions, keeps the rescuer out of the beam and can continue during shocks; recheck that it stays over the sternum.",
    tone: "bailout",
    lessonId: "pm-support-choice-cpr",
    sources: [
      { book: "brilakis-pci", loc: "14.7" },
      { book: "brilakis-pci", loc: "28.1" },
      { book: "oxford-cath", loc: "ch 9: Mechanical cardiopulmonary resuscitation" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "yadav-cath-lab-arrest-2018"],
  },
  {
    id: "pci-arrest-oblique-views",
    lab: "pci",
    when: { phase: ["complication"], event: ["vf"] },
    title: "Work around the device in oblique views",
    text: "A compression device on the chest blocks the posteroanterior view; continue the coronary work in oblique projections rather than stopping compressions for pictures.",
    tone: "do",
    lessonId: "pm-support-choice-cpr",
    sources: [{ book: "brilakis-pci", loc: "14.7" }],
    refs: ["brilakis-manual-pci", "yadav-cath-lab-arrest-2018"],
  },
  {
    id: "pci-arrest-no-rosc-ecmo",
    lab: "pci",
    when: { phase: ["complication"], event: ["vf"] },
    title: "No prompt return of circulation: VA-ECMO",
    text: "If the patient does not recover promptly with CPR, Brilakis starts VA-ECMO, which supports both circulation and oxygenation; the evidence for it in the lab is observational and guideline recommendations are weak. A balloon pump needs the heart's own function and does not help in arrest.",
    tone: "bailout",
    lessonId: "pm-support-choice-cpr",
    sources: [
      { book: "brilakis-pci", loc: "28.1" },
      { book: "brilakis-pci", loc: "14.1" },
    ],
    refs: ["brilakis-manual-pci", "yadav-cath-lab-arrest-2018"],
  },
];

export const refs: Reference[] = [
  {
    id: "perera-bcis1-longterm-2013",
    kind: "trial",
    citation:
      "Perera D, Stables R, Clayton T, et al. Long-term mortality data from the balloon pump-assisted coronary intervention study (BCIS-1): a randomized, controlled trial of elective balloon counterpulsation during high-risk percutaneous coronary intervention. Circulation. 2013;127:207–212.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.112.132209",
    note: "PMID: 23224207. Checked on PubMed: authors, title, journal, year, volume 127, issue 2, pages 207–212. 301 patients (EF under 30%, jeopardy score 8 or more); median follow-up 51 months; all-cause mortality 33% overall; fewer deaths with elective IABP (42 vs 58; hazard ratio 0.66, 95% CI 0.44–0.98). Cited by Brilakis (14.1, reference 2).",
    verified: true,
  },
  {
    id: "rihal-mcs-consensus-2015",
    kind: "consensus",
    citation:
      "Rihal CS, Naidu SS, Givertz MM, et al. 2015 SCAI/ACC/HFSA/STS clinical expert consensus statement on the use of percutaneous mechanical circulatory support devices in cardiovascular care. J Am Coll Cardiol. 2015;65:e7–e26.",
    url: "https://doi.org/10.1016/j.jacc.2015.03.036",
    note: "PMID: 25861963. Checked on PubMed: first authors, title, journal, year, volume 65, issue 19, pages e7–e26. The abstract covers the IABP, axial flow pumps, the left atrial-to-femoral bypass pump and ECMO, and their use in high-risk PCI, cardiogenic shock and decompensated heart failure. Cited by Brilakis (14.1.2, reference 4) for prophylactic support with abnormal haemodynamics and high-risk lesions.",
    verified: true,
  },
  {
    id: "tehrani-shock-team-2019",
    kind: "paper",
    citation: "Tehrani BN, Truesdell AG, Sherwood MW, et al. Standardized team-based care for cardiogenic shock. J Am Coll Cardiol. 2019;73:1659–1669.",
    url: "https://doi.org/10.1016/j.jacc.2018.12.084",
    note: "PMID: 30947919. Checked on PubMed: authors, title, journal, year, volume 73, issue 13, pages 1659–1669. 204 consecutive patients; 30-day survival 47% (2016), 57.9% (2017), 76.6% (2018); CPO below 0.6 W and PAPi below 1.0 at 24 h among the independent predictors of 30-day mortality; observational. Its central algorithm is reproduced by Brilakis (Fig 24.7).",
    verified: true,
  },
  {
    id: "basir-ncsi-2019",
    kind: "paper",
    citation:
      "Basir MB, Kapur NK, Patel K, et al. Improved outcomes associated with the use of shock protocols: updates from the National Cardiogenic Shock Initiative. Catheter Cardiovasc Interv. 2019;93:1173–1183.",
    url: "https://doi.org/10.1002/ccd.28307",
    note: "PMID: 31025538. Checked on PubMed: authors, title, journal, year, volume 93, issue 7, pages 1173–1183. Single-arm prospective multicentre study, 171 patients at 35 sites; 74% had MCS before PCI; door-to-support 85 ± 63 min; survival to discharge 72%; creatinine ≥2, lactate >4, CPO <0.6 W and age ≥70 predicted mortality. Its algorithm is reproduced by Brilakis (Fig 24.8).",
    verified: true,
  },
  {
    id: "brilakis-eckman-shock-2018",
    kind: "paper",
    citation:
      "Brilakis ES, Eckman P. The five key \"ingredients\" for improving outcomes in cardiogenic shock complicating acute myocardial infarction. Catheter Cardiovasc Interv. 2018;91:462–463.",
    url: "https://doi.org/10.1002/ccd.27540",
    note: "PMID: 29460404. Checked on PubMed: authors, title, journal, year, volume 91, issue 3, pages 462–463. Abstract lists early diagnosis, haemodynamic assessment, culprit-only revascularisation, judicious mechanical support and expert in-hospital care. Reproduced by Brilakis as Fig 24.6.",
    verified: true,
  },
  {
    id: "tomasello-ecmo-chip-2015",
    kind: "paper",
    citation:
      "Tomasello SD, Boukhris M, Ganyukov V, et al. Outcome of extracorporeal membrane oxygenation support for complex high-risk elective percutaneous coronary interventions: a single-center experience. Heart Lung. 2015;44:309–313.",
    url: "https://doi.org/10.1016/j.hrtlng.2015.03.005",
    note: "PMID: 25913808. Checked on PubMed: authors, title, journal, year, volume 44, issue 4, pages 309–313. 12 patients, mean SYNTAX 30.1; all procedures successful; no in-hospital MACCE. Cited by Brilakis (14.2, reference 7).",
    verified: true,
  },
  {
    id: "yadav-cath-lab-arrest-2018",
    kind: "paper",
    citation: "Yadav K, Truong HT. Cardiac arrest in the catheterization laboratory. Curr Cardiol Rev. 2018;14:115–120.",
    url: "https://doi.org/10.2174/1573403X14666180509144512",
    note: "PMID: 29741141; PMC6088444. Checked on PubMed: authors, title, journal, year, volume 14, issue 2, pages 115–120. Full text read in PMC; used for the problems of manual compression in the lab, the advantages of mechanical devices (no rescuer fatigue or radiation, no pauses, compressions during defibrillation), the PA view being obscured with oblique views usual, the median 7 s to first mechanical compression after training, the trial sizes (2589 and 4471; ASPIRE and CIRC), small lab series (53 and 42 patients), the balloon pump being ineffective in arrest, and the TandemHeart's features (up to 4 L/min, lowers LV filling pressure, usable with mechanical aortic valve or LV thrombus, impractical in arrest, versus IABP). Cited by Brilakis (14.7, reference 11).",
    verified: true,
  },
  {
    id: "elison-mechanical-cpr-trauma-2019",
    kind: "case",
    citation: "Elison D, Don C, Nakamura K. Coronary artery and right ventricular perforation due to mechanical CPR trauma. JACC Case Rep. 2019;1:407–410.",
    url: "https://doi.org/10.1016/j.jaccas.2019.08.007",
    note: "PMID: 34316838; PMC8289096. Checked on PubMed: authors, title, journal, year, volume 1, issue 3, pages 407–410. Case of ventricular and coronary injury from a mechanical CPR device used during primary PCI. Cited by Brilakis (14.7, reference 12).",
    verified: true,
  },
  {
    id: "perera-chip-bcis3-2026",
    kind: "trial",
    citation: "Perera D, Ryan M, Ezad SM, et al. Left ventricular unloading in high-risk percutaneous coronary intervention. N Engl J Med. 2026;394:1779–1789.",
    url: "https://doi.org/10.1056/NEJMoa2515704",
    note: "PMID: 41910380. Checked on PubMed: authors, title, journal, year, volume 394, issue 18, pages 1779–1789. CHIP-BCIS3: 300 patients with severe LV dysfunction and extensive coronary disease having planned complex PCI, randomised to elective microaxial-pump unloading (148) or standard care (152). Hierarchical composite at a minimum of 12 months (median 22): win ratio 0.85 (95% CI 0.63–1.15; P = 0.30). Deaths 47 vs 33 (HR 1.54, 95% CI 0.99–2.41). No material difference in bleeding or vascular complications.",
    verified: true,
  },
  {
    id: "ezad-chip-bcis3-haemodynamics-2026",
    kind: "trial",
    citation: "Ezad SM, Ryan M, Khan SQ, et al. Impact of left ventricular unloading on hemodynamics and stunning in complex PCI: a CHIP-BCIS3 substudy. J Am Coll Cardiol. 2026;88:1454–1466.",
    url: "https://doi.org/10.1016/j.jacc.2026.06.041",
    note: "PMID: 42554527. Checked on PubMed: authors, title, journal, year, volume 88, issue 13, pages 1454–1466. Prespecified substudy, 97 patients: inotrope use lower with the pump (RR 0.57), loss of pulse pressure more frequent (RR 7.83), systolic pressure reduction similar, no prevention of stunning.",
    verified: true,
  },
  {
    id: "rao-acs-guideline-2025",
    kind: "guideline",
    citation: "Rao SV, O'Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for the management of patients with acute coronary syndromes. Circulation. 2025;151:e771–e862.",
    url: "https://doi.org/10.1161/CIR.0000000000001309",
    note: "PMID: 40014670. Checked on PubMed: authors, title, journal, year, volume 151, issue 13, pages e771–e862. The recommendation classes for mechanical support used in this module (microaxial flow pump Class IIa in selected patients with refractory MI-related cardiogenic shock; routine IABP and routine ECMO Class III) are as summarised by Restrepo and Rao 2026 (ref restrepo-acs-guideline-review-2026); the guideline text itself was not accessible.",
    verified: true,
  },
  {
    id: "restrepo-acs-guideline-review-2026",
    kind: "paper",
    citation: "Restrepo VJ, Rao SV. Known unknowns: unpacking controversies and uncertainties in the 2025 guidelines for management of acute coronary syndromes. Curr Cardiol Rep. 2026;28.",
    url: "https://doi.org/10.1007/s11886-026-02427-8",
    note: "PMID: 42832065. Checked on PubMed: authors, title, journal, year, volume 28, issue 1. Abstract: the percutaneous microaxial flow pump received a new Class IIa recommendation for a selected group with refractory MI-related cardiogenic shock (DanGer Shock), and the IABP and ECMO are Class III for routine use. Its second author is the guideline's first author.",
    verified: true,
  },
  {
    id: "udesen-danger-shock-design-2019",
    kind: "paper",
    citation: "Udesen NJ, Møller JE, Lindholm MG, et al. Rationale and design of DanGer shock: Danish-German cardiogenic shock trial. Am Heart J. 2019;214:60–68.",
    url: "https://doi.org/10.1016/j.ahj.2019.04.019",
    note: "PMID: 31176289. Checked on PubMed: authors, title, journal, year, volume 214, pages 60–68. STEMI with cardiogenic shock randomised to the CP microaxial pump or guideline-driven therapy; patients comatose after out-of-hospital cardiac arrest excluded; the device placed before angioplasty; primary endpoint all-cause mortality at 180 days.",
    verified: true,
  },
  {
    id: "hallstrom-aspire-2006",
    kind: "trial",
    citation: "Hallstrom A, Rea TD, Sayre MR, et al. Manual chest compression vs use of an automated chest compression device during resuscitation following out-of-hospital cardiac arrest: a randomized trial. JAMA. 2006;295:2620–2628.",
    url: "https://doi.org/10.1001/jama.295.22.2620",
    note: "PMID: 16772625. Checked on PubMed: authors, title, journal, year, volume 295, issue 22, pages 2620–2628. ASPIRE: 1071 patients, load-distributing band device vs manual CPR, enrolment stopped after the first interim analysis. No difference in survival to 4 hours; in the primary population survival to discharge 5.8% vs 9.9% (P = 0.06) and CPC 1–2 at discharge 3.1% vs 7.5% (P = 0.006) with the device.",
    verified: true,
  },
  {
    id: "thiele-tandemheart-iabp-2005",
    kind: "trial",
    citation: "Thiele H, Sick P, Boudriot E, et al. Randomized comparison of intra-aortic balloon support with a percutaneous left ventricular assist device in patients with revascularized acute myocardial infarction complicated by cardiogenic shock. Eur Heart J. 2005;26:1276–1283.",
    url: "https://doi.org/10.1093/eurheartj/ehi161",
    note: "PMID: 15734771. Checked on PubMed: authors, title, journal, year, volume 26, issue 13, pages 1276–1283. 41 patients with infarct-related cardiogenic shock and intended PCI of the infarct artery, randomised to IABP (20) or the left atrial-to-femoral bypass pump (21). Cardiac power index improved more with the bypass pump; severe bleeding (19 with the bypass pump vs 8 with IABP) and limb ischaemia (7 vs 0) more frequent with the bypass pump; 30-day mortality 45% with IABP vs 43% with the bypass pump (P = 0.86). The Yadav and Truong review's comparison of this device with the IABP (higher output, lower wedge and PA pressures, no 30-day mortality gain, more vascular complications) matches this trial; the reference numbering is not shown in the PMC text.",
    verified: true,
  },
];
