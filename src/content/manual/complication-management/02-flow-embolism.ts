// Module cm-flow-embolism: no-reflow, embolism and stroke (manual curriculum, track complication-management).
// Sources: Brilakis, Manual of PCI: 25.2 (causes of acute vessel closure: thrombosis, embolisation of thrombus, plaque
// and air, spasm), 9.8 (good flow?), 9.7 (guide aspiration after balloon removal), 5.4 and 5.5 (aspirating the guide,
// systemic and coronary embolisation), 2.3 (pressure waveform), 3.2 and 3.5 (vasodilators, IV antiplatelet agents),
// 4.2 (sheath embolisation), 8.9 (trapping and air), 10.1 (when not to stent), 14.1 (who needs haemodynamic support),
// 18.3, 18.8 and 18.9 (vein grafts, filters, nicardipine), 19.9 (atherectomy and slow flow), 20.9 (thrombus, deferred
// stenting, aspiration and stroke), 29.1 (cholesterol embolisation syndrome), 30.17 (NIRS and lipid core plaque);
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention: ch 8 (the 'no-reflow' phenomenon, vasodilators
// in no-reflow, vein graft PCI and distal protection, aspiration catheters, deferred stenting, rotational
// atherectomy), ch 10 (risks of complications, death, myocardial infarction, pulmonary oedema, stroke, arrhythmia,
// air embolism, renal failure, cholesterol embolization), ch 6 (aspiration before injection, contrast injection,
// storing the unexpected, nitrates), ch 4 (manifolds and pressure injectors, LVEDP, left ventriculography) and ch 9
// (IABP indications). New references (PubMed-checked) are in `refs` below.
// Every claim is listed with its page in docs/curriculum/evidence/cm-flow-embolism.md.
// Neighbouring modules: cm-principles-closure (the acute-closure algorithm as a whole, dissection, spasm, side
// branches), pm-lab-drugs (vasodilator doses and adenosine arrhythmias in full), pm-to-the-root (manifold set-up,
// aspiration and the failure-to-aspirate algorithm), pm-wiring (trapping), pm-prep-and-stent (clearing the guide
// between devices), cp-prior-cabg (embolic protection filters step by step), cp-acs-thrombus (aspiration
// thrombectomy and the thrombus algorithm), cp-calcium (atherectomy), cm-patient-complications (contrast volume,
// kidneys, hypotension and arrhythmia). Academy lessons this module builds on: comp-dissection-flow (slow flow and
// no-reflow; air embolism and intraprocedural thrombosis), comp-systemic-access (stroke, cholesterol embolisation).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];
const OXFORD = ["oxford-cath-handbook"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "cm-flow-embolism",
  title: "No-reflow, embolism and stroke",
  stage: 4,
  summary:
    "When flow fails although the artery is open, and when something travels where it should not: telling no-reflow from a mechanical closure and treating the microcirculation, getting embolised plaque and thrombus out, clearing coronary air, acting on a stroke on the table or in recovery, and recognising pulmonary oedema and cholesterol embolisation.",
  objectives: [
    "Separate no-reflow and distal embolisation from dissection and the other mechanical causes of lost flow, and explain why the treatment of one makes the other worse.",
    "Anticipate no-reflow in the lesions and procedures that cause it, and apply the preventive measures each manual recommends.",
    "Treat established no-reflow in order: distal delivery of a microvascular vasodilator chosen for the patient's rhythm and pressure, time without further contrast, antithrombotic and aspiration adjuncts, support for persistent hypotension and adrenaline for refractory cases.",
    "Name the sources of plaque and thrombus emboli, prevent them with sheath and guide routines, and treat coronary and systemic embolisation.",
    "Prevent coronary air embolism, recognise its spectrum from an asymptomatic bubble to cardiac arrest, and treat it with oxygen, mechanical disruption, aspiration and support.",
    "Prevent stroke during catheterisation, recognise it during and after the procedure, and run the first steps: airway and circulation, stopping, examination, the bleeding-or-embolism question, imaging and the stroke team.",
    "Identify the patients at risk of pulmonary oedema before the case, treat it on the table, and recognise and manage cholesterol embolisation.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cm-flow-embolism-noreflow",
      title: "Slow flow and no-reflow: rule out the mechanical, then treat the microcirculation",
      minutes: 16,
      topics: ["comp-no-reflow"],
      sources: [
        B("25.2"),
        B("9.8"),
        B("10.1"),
        B("5.5"),
        B("3.2"),
        B("3.5"),
        B("18.3"),
        B("18.8"),
        B("18.9"),
        B("19.9"),
        B("20.9"),
        B("30.17"),
        B("30.8"),
        B("14.1"),
        O("ch 8: The 'no-reflow' phenomenon"),
        O("ch 8: Vein graft PCI"),
        O("ch 8: Primary PCI"),
        O("ch 8: Rotational atherectomy"),
        O("ch 8: Aspiration catheters"),
        O("ch 6: Nitrate administration"),
      ],
      refs: [
        ...BOOKS,
        "frobert-taste-2013",
        "total-2015",
        "danami3-defer-2016",
        "grines-stent-pami-1999",
        "stone-amihot2-2009",
        "khan-coar-2022",
        "oliveri-noreflow-nma-2026",
        "iabp-shock-ii-2012",
        "esc-acs-2023",
        "danger-shock-2024",
        "rao-acs-guideline-2025",
        "restrepo-acs-guideline-review-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "No-reflow is the situation in which the treated artery is open but the heart muscle beyond it is not being perfused: blood gets past the lesion and then cannot get into the myocardium. The Academy lesson on slow flow and no-reflow (comp-dissection-flow) gives the TIMI grades and a list of agents, and pm-lab-drugs teaches the vasodilator doses in full. This lesson is the decision sequence at the table, because the first decision (is this no-reflow at all?) decides whether the next device you reach for helps or harms.",
        },
        { kind: "h", text: "What it is, and when to expect it" },
        {
          kind: "list",
          items: [
            "**Two mechanisms (Oxford).** Microvascular dysfunction from ischaemia and reperfusion injury, and distal embolisation of thrombus or atheromatous debris. Spasm of the small vessels contributes, which is why vasodilators are used both to prevent and to treat it.",
            "**Timing.** It can follow pre-dilatation, but it is more common after the stent is deployed or post-dilated (Oxford).",
            "**Why it matters.** Oxford links it to higher short- and long-term mortality after PCI, and calls it difficult to treat once it is established: prevention is the main tool in a vulnerable lesion.",
            "**Where it sits in the bigger picture.** Brilakis defines acute vessel closure as any partial or complete fall in antegrade flow during or just after PCI and lists eight causes: dissection, thrombosis, embolisation (of thrombus, plaque or air), side-branch occlusion after stenting, spasm, pseudolesions, equipment entrapment and intramural haematoma. The whole algorithm is taught in cm-principles-closure. In Brilakis's algorithm, no-reflow from debris falls under the embolisation branch; Oxford's second mechanism, reperfusion injury of the microvasculature, has no separate branch there.",
          ],
        },
        {
          kind: "table",
          caption: "How no-reflow shows itself (Oxford) and what you must still exclude (Brilakis)",
          head: ["Finding", "What it tells you"],
          rows: [
            ["Sluggish or absent flow in the treated vessel after PCI: TIMI 1 or TIMI 0", "The angiographic grade Oxford uses to diagnose no-reflow"],
            ["No myocardial blush in the territory", "Contrast is not entering the muscle; a normally perfused bed blushes after an injection into an open artery"],
            ["Chest pain and ST elevation, sometimes hypotension", "The clinical picture that goes with the angiographic findings; ST elevation is also the usual first sign of coronary embolism (Brilakis)"],
            ["A linear or spiral filling defect, or a flap at a stent edge", "Dissection: a mechanical cause that needs a stent, not a vasodilator"],
            ["A new filling defect inside or near the stent", "Possible thrombus: check the ACT; Brilakis shows one that OCT confirmed as thrombus minutes after a stent (next lesson)"],
            ["Occlusion of distal branches", "On the diagnostic angiogram Brilakis uses it as a clue that an ACS culprit has already embolised; a branch newly lost during PCI raises the same suspicion (this module's inference)"],
          ],
        },
        {
          kind: "steps",
          title: "The first two minutes after flow fails",
          items: [
            { title: "1. Keep the wire where it is", detail: "Brilakis puts this first in his acute-closure algorithm: stress at this moment leads operators to pull the wire back, and losing true-lumen position can be catastrophic if the cause turns out to be a dissection. Watch the guide too: Brilakis notes that guide manipulation can be what pulls the wire out." },
            { title: "2. Decide: dissection or embolisation?", detail: "Brilakis calls this the key distinction. A dissection needs a stent. Distal embolisation may become worse with a stent and needs the material removed and/or vasodilators. Look at the stent edges and the distal vessel in more than one projection. When the angiogram is unclear, IVUS helps, and so does a contrast injection beyond the lesion through a dual-lumen catheter (Brilakis 19.9, for slow flow during atherectomy). Spasm alone seldom stops flow completely, but Brilakis notes that it can add to the picture in both dissection and distal embolisation." },
            { title: "3. Check the ACT", detail: "Thrombosis is a separate branch of the algorithm: inadequate anticoagulation or antiplatelet therapy, an underexpanded stent, a hypercoagulable state including heparin-induced thrombocytopenia, or failed venous access so that the IV anticoagulant never arrived. The targets are in the next lesson." },
            { title: "4. If it is no-reflow, do not stent into it", detail: "Brilakis lists poor antegrade flow as a reason not to stent, unless the poor flow is caused by a dissection, because stenting a no-reflow vessel makes it worse. Oxford notes that no-reflow is more common after post-dilatation, so hold back from further aggressive balloon work as well." },
            { title: "5. Stop adding contrast", detail: "Oxford warns that repeated injections into the affected vessel add to the ischaemia. Waiting, with a vasodilator on board, is often what brings the flow back, so allow it." },
          ],
        },
        { kind: "tip", id: "pci-noreflow-dissection-or-embolism" },
        { kind: "tip", id: "pci-noreflow-hold-contrast" },
        {
          kind: "check",
          stem: "After a 3.5 mm stent in a thrombotic proximal RCA, contrast creeps to the mid vessel and hangs there. The stent edges look clean in LAO and RAO, there is no linear defect, and the ACT is 285 s. The patient has chest pain and inferior ST elevation. The fellow suggests a second stent 'to cover the distal vessel'. What is the right next move?",
          options: [
            "Place the second stent, because a distal edge dissection is still the most likely cause",
            "Post-dilate the first stent at high pressure to improve its expansion before anything else",
            "Treat it as no-reflow: no more metal or balloons, and a vasodilator given distally",
            "Repeat several full-volume injections to watch how the flow changes over the next minutes",
          ],
          answer: 2,
          explanation:
            "Clean edges in two views, no dissection and an adequate ACT after stenting a thrombotic lesion point to distal embolisation and no-reflow. Brilakis lists poor flow as a reason not to stent unless a dissection is the cause, because more metal makes no-reflow worse. Oxford notes that no-reflow is more common after post-dilatation, so aggressive balloon work is avoided too. Repeated injections add ischaemia (Oxford).",
        },
        { kind: "h", text: "Prevention: anticipate the lesions that do it" },
        {
          kind: "table",
          caption: "Where no-reflow comes from, and what each manual does about it",
          head: ["Setting", "Prevention"],
          rows: [
            [
              "Bulky or thrombus-filled lesions, primary PCI, ectatic native vessels (Oxford)",
              "Think about no-reflow before you start. Oxford: consider a thrombectomy device where thrombus is present, a distal protection device with visible thrombus, pretreatment with a GP IIb/IIIa inhibitor (may reduce thromboembolism) and pretreatment with vasodilators (may reduce the vasospasm that adds to microvascular dysfunction). Routine aspiration is not recommended since TASTE and TOTAL; selective use in a large thrombus burden continues",
            ],
            [
              "Large thrombus with flow already restored (Brilakis 20.9)",
              "One option is to stop and give 24–48 hours of intense antithrombotic therapy (aspirin, an oral P2Y12 inhibitor, and an IV platelet inhibitor and/or IV antithrombotic), then repeat the angiogram: the thrombus is often smaller and balloon and stent carry less risk of embolisation. Oxford explains the idea behind deferral: stenting and post-dilatation are the steps most likely to send atherothrombotic debris downstream, so delaying them while the drugs dissolve some of the thrombus should in theory mean less embolisation and no-reflow and better stent sizing, with less undersizing and malapposition. Oxford adds that stenting in primary PCI (PAMI) brought no mortality benefit. In the trial itself (Stent-PAMI, Grines 1999) the whole benefit came from fewer ischaemia-driven target-vessel revascularisations (7.7% vs 17.0%), and 6-month mortality did not differ (4.2% vs 2.7%). Oxford also reports that DANAMI 3-DEFER, deferring stents by 48 hours in STEMI, did not improve outcome and had more urgent target-vessel revascularisation, and that current guidelines therefore do not recommend deferred stenting in STEMI. Brilakis's deferral option is not a routine strategy in primary PCI",
            ],
            [
              "Large thrombus, proceeding to PCI because of ongoing symptoms or high-risk plaque (Brilakis 20.9.6)",
              "Consider thrombectomy before further balloon and stent work, accepting that randomised trials do not support its routine use; a filter may catch thrombus and stop it embolising; laser can 'burn' through thrombus and also inhibits platelet aggregation",
            ],
            [
              "Degenerated saphenous vein grafts",
              "Oxford explains why these grafts embolise: their lesions are more friable than native disease and carry more thrombus. Embolic protection (Oxford treats it as mandatory; Brilakis uses it whenever feasible, taught in cp-prior-cabg). Oxford describes the two kinds: a balloon on a wire inflated beyond the lesion, with the stagnant blood above it aspirated after PCI, and a filter basket placed beyond the lesion to catch debris and then retrieved in a sheath. Brilakis does not use a protection device for in-stent restenosis in a vein graft, which carries a low embolisation risk, and generally avoids atherectomy in vein graft lesions because of distal embolisation (an old, heavily calcified graft may still need it). Primary stenting without pre-dilatation; Brilakis often gives nicardipine 100–300 µg into the graft before and after PCI. GP IIb/IIIa inhibitors: Brilakis says they can cause harm in SVG PCI and should not be used routinely; Oxford says routine use has not been shown to help. Oxford also notes that thrombectomy devices do not seem to protect against distal embolisation in SVG PCI, whereas distal protection devices reduce no-reflow",
            ],
            [
              "Atherectomy (Brilakis 19.9 and 25.2; Oxford rotational atherectomy)",
              "Brilakis: vasodilator before the run (nicardipine most often), unless the patient is hypotensive; short runs of under 15 s with more than 30 s between them; burr-to-artery ratio under 0.5; avoid speeds above 180,000 rpm, with lower speeds of 140,000–150,000 rpm (rotational) and 80,000 rpm (orbital) suggested because they may embolise less; avoid decelerations of more than 5,000 rpm (Oxford agrees); no pressure damping; contrast after each run. **The books differ on size and speed:** Oxford selects the burr at a burr-to-artery ratio of 0.5–0.6 (never above 0.6 of the reference diameter) and gives an ideal speed of 135,000–180,000 rpm, with orbital atherectomy run at 80,000–120,000 rpm; Brilakis's smaller burr and lower speed are aimed at releasing less debris. Oxford blames no-reflow on overheating and showers of 5–10 µm calcified debris; both books run a flush containing vasodilators during atherectomy (Brilakis names a verapamil, nitroglycerin and heparin mixture; Oxford's cools the burr and prevents spasm). **Bradycardia:** for a large RCA or a dominant circumflex, Brilakis prevents it with a temporary pacemaker, aminophylline or atropine; Oxford lists severe bradycardia and heart block among the complications, checks the rate and ECG first, pretreats with atropine when block looks likely, and notes that some operators place a temporary pacing wire, especially for a large RCA",
            ],
            [
              "Lipid-rich plaque",
              "Brilakis notes that a large lipid core plaque on near-infrared spectroscopy has been associated with a higher risk of distal embolisation and no-reflow, and lists lipid-rich lesions among the causes of plaque embolisation. He considers an embolic protection filter for native lesions with a large lipid core plaque, and for lesions with a heavy thrombus burden",
            ],
          ],
        },
        { kind: "tip", id: "pci-noreflow-anticipate" },
        { kind: "h", text: "Treating established no-reflow, step by step" },
        {
          kind: "steps",
          items: [
            { title: "1. Go distal with the drug", detail: "Oxford gives preventive doses through the guide, but when no-reflow has set in there is no forward flow, so it delivers them through an over-the-wire balloon or a multifunctional probing catheter placed as close to the distal bed as possible. The reasoning (this module's, not Oxford's wording): with nothing flowing down the artery, a drug injected into the guide is likely to reflux into the aorta. Brilakis advances a microcatheter or a dual-lumen catheter (or an aspiration catheter) over the wire for the same purpose." },
            { title: "2. Choose the agent for this patient", detail: "Microvascular agents: nicardipine, nitroprusside, verapamil and adenosine. Brilakis prefers nicardipine because it lowers the blood pressure less than nitroprusside or verapamil. Oxford warns of heart block with verapamil, and avoids adenosine in asthma and in patients taking dipyridamole. Brilakis notes that adenosine heart block is most likely when it is injected into the RCA, and advises against high doses there; he also gives it slowly, and for RCA atherectomy notes that aminophylline 250–300 mg IV, given over 10 minutes, can help prevent the bradycardia. Block is not confined to the RCA: his Fig. 3.3 shows complete heart block and then torsades after adenosine for no-reflow in the circumflex. If adenosine triggers VF, ask the patient to cough hard while the defibrillator is readied, then defibrillate (pm-lab-drugs teaches these arrhythmias in full). Nitrates have not been shown to help in no-reflow (Oxford)." },
            { title: "3. Treat the thrombus component", detail: "Brilakis's three steps for plaque or thrombus embolism: anticoagulation plus an IV antiplatelet agent (a GP IIb/IIIa inhibitor or cangrelor), thrombectomy when there is a large visible thrombus, and intracoronary vasodilators. He lists preventing thrombus propagation in no-reflow among the goals of IV antiplatelet drugs." },
            { title: "4. Give it time", detail: "Hold back from repeat injections; Oxford expects the flow to come back in many patients once a vasodilator has had time to work. Repeat the vasodilator if the response is partial; Oxford's doses are all repeatable." },
            { title: "5. Support the pressure", detail: "If hypotension persists, Oxford considers an intra-aortic balloon pump to raise the coronary perfusion pressure. Brilakis adds haemodynamic support if the patient develops shock or arrest. Oxford is not consistent here: its no-reflow, MI and air-embolism pages suggest an IABP, but its primary PCI section says that after the CRISP-AMI and IABP-SHOCK trials routine IABP is not recommended in myocardial infarction with cardiogenic shock. IABP-SHOCK II (30-day mortality 39.7% with an IABP vs 41.3% without) and the 2023 ESC ACS guideline agree, and Brilakis notes that no randomised trial had shown lower in-hospital mortality with any support device. So Oxford's IABP for no-reflow with persistent hypotension is a perfusion-pressure measure, not routine shock therapy, and the shock team chooses the support. Since 2023, DanGer Shock found lower 180-day mortality with a microaxial flow pump in selected STEMI-related shock, at the cost of more complications, and the 2025 ACC/AHA ACS guideline (as summarised in a review co-written by its first author, Restrepo and Rao 2026) supports that pump in selected refractory infarct-related shock while keeping routine IABP as not recommended; the Academy's acute-mcs track teaches the selection." },
            { title: "6. Refractory no-reflow", detail: "Brilakis adds intracoronary adrenaline (epinephrine) when no-reflow does not respond to the vasodilators." },
            { title: "7. Wait for TIMI 3 before any further device work", detail: "Brilakis, for no-reflow after a filter has been delivered into a vein graft: no balloon angioplasty or stenting until TIMI 3 flow is restored. Once it is back, decide whether further dilatation is needed at all (this module's judgement): Oxford notes that no-reflow is more common after post-dilatation, so do not add inflations that the stent result does not need." },
          ],
        },
        { kind: "tip", id: "pci-no-reflow-distal-vasodilator" },
        { kind: "tip", id: "pci-noreflow-pick-agent" },
        {
          kind: "table",
          caption: "Intracoronary doses for no-reflow as each manual gives them (typical doses; follow your local protocol; the full drug lesson is pm-lab-drugs)",
          head: ["Agent", "Brilakis", "Oxford", "Watch for"],
          rows: [
            ["Nicardipine", "100–300 µg; his preferred agent", "Not listed", "Hypotension (less than nitroprusside or verapamil)"],
            ["Nitroprusside", "100–300 µg", "50–100 µg, repeatable", "Hypotension"],
            ["Verapamil", "1 mg over 2 minutes", "100–500 µg slowly, repeatable", "Heart block, hypotension"],
            ["Adenosine", "RCA 50–100 µg; left main 100–200 µg, and several thousand µg can be given slowly in no-reflow; graft 100–200 µg", "30–50 µg, repeatable", "Give slowly. Heart block (most likely in the RCA, but also seen in the circumflex: Brilakis Fig. 3.3), AF, VF (cough, then defibrillate); avoid in asthma or with dipyridamole (Oxford)"],
            ["Adrenaline", "For refractory no-reflow (no dose given)", "Not listed", "Not stated in either manual; trial data since the manuals are below"],
            ["Nitrates", "Large-vessel dilator", "Not shown to be useful in no-reflow", "Hypotension"],
          ],
        },
        {
          kind: "check",
          stem: "No-reflow follows stenting of a dominant RCA. Heart rate 46 bpm, BP 90/60 mmHg, no dissection, ACT 300 s. A microcatheter is in the distal RCA. Which first agent fits the manuals' advice best?",
          options: [
            "A large adenosine bolus, because several thousand micrograms can be given in no-reflow",
            "Verapamil 1 mg over 2 minutes, because it is the calcium channel blocker with the longest record",
            "Glyceryl trinitrate 200 µg, because it is the vasodilator given before every angiogram",
            "Nicardipine through the microcatheter, with atropine and pacing ready for the slow rate",
          ],
          answer: 3,
          explanation:
            "Brilakis prefers nicardipine because it lowers the pressure least, which matters at 90/60; Oxford does not list nicardipine at all, so the keyed answer rests on Brilakis. In a slow RCA patient, adenosine (most likely to cause block when given into the RCA) and verapamil (Oxford: beware heart block) are poorer first choices; Brilakis's several-thousand-microgram adenosine dose is for the left main. Nitrates have not been shown to help in no-reflow. Intracoronary adrenaline, which Brilakis keeps for refractory cases, is a recognised alternative first agent since trials have shown that it improves flow (next paragraph), and the Academy's vein graft no-reflow case uses it first in a hypotensive patient.",
        },
        { kind: "tip", id: "pci-noreflow-low-pressure-support" },
        {
          kind: "p",
          text: "**Beyond the manuals: adrenaline as a first agent.** Brilakis keeps adrenaline for refractory no-reflow, and Oxford does not list it; neither manual gives trial evidence for any order of agents. In the COAR trial (Khan 2022), 201 normotensive patients with ACS and no-reflow were randomised to intracoronary adrenaline or adenosine: final TIMI 3 flow was more frequent with adrenaline (90.1% vs 78%), with no significant difference in final myocardial blush grade 3, mortality or major adverse cardiac events at 1 month. A 2026 network meta-analysis of 13 randomised trials in primary PCI (1,674 patients; Oliveri 2026) found that adrenaline and verapamil were each associated with higher odds of final TIMI 3 flow than control, while no agent reduced major adverse events or mortality (an underpowered analysis). Nicardipine was not among the agents compared. So adrenaline is a recognised alternative first agent that improves flow; because COAR enrolled normotensive patients, choosing it first in hypotensive no-reflow rests on practice rather than trial data. Nicardipine remains Brilakis's preferred pressure-sparing vasodilator, and no agent has been shown to change outcome.",
        },
        {
          kind: "p",
          text: "**Beyond the manuals: supersaturated oxygen.** One of the videos below shows supersaturated oxygen (SSO2) used for no-reflow; neither manual describes it. Its trial evidence is in a different setting. In AMIHOT II (Stone 2009), 301 patients with anterior STEMI treated with PCI within 6 hours were randomised 3:1 to a 90-minute intracoronary SSO2 infusion into the LAD territory or control. Among the 281 with SPECT imaging, median infarct size was 20% with SSO2 and 26.5% with control; the prespecified analysis pooled the evidence with AMIHOT I by Bayesian modelling (pooled 18.5% vs 25%, P=0.02), and 30-day adverse events were non-inferior. That is a trial of infarct size after reperfusion, not of rescuing established no-reflow.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling every failure of flow no-reflow and missing a dissection that needed a stent, or the reverse: stenting a vessel full of embolised debris.",
            "Putting the vasodilator into the guide when nothing is flowing down the artery.",
            "Repeating full injections to watch progress, which deepens the ischaemia.",
            "Reaching for glyceryl trinitrate, which acts on the large arteries and has not been shown to help no-reflow.",
            "Giving verapamil or a large RCA adenosine bolus to a patient who is already bradycardic without pacing back-up.",
            "Resuming balloon or stent work before TIMI 3 flow has returned, or post-dilating a well-expanded stent once it has.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide the lesion's no-reflow risk before the first balloon touches it, and have the microcatheter and the vasodilator on the table. Oxford calls established no-reflow difficult to treat and prevention the key; the operator who has the drug in the microcirculation as the debris arrives rarely needs the rescue steps.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (LCx STEMI), plan aloud how you will prevent no-reflow before wiring. If the lab reports slow flow or no-reflow, first review the stent edges for dissection and record the ACT, then give an intracoronary vasodilator, avoid repeated contrast runs while it takes effect, and do no further balloon work before flow is TIMI 3.",
        },
        { kind: "video", id: "ARrFtw473ek", note: "Case 38 from the Manual of PCI: no-reflow during vein graft PCI." },
        { kind: "video", id: "UYDQobOdsVU", note: "Case 203 from the Manual of CTO PCI: a case titled 'No reflow?!'." },
        { kind: "video", id: "LvM51_9s8SA", note: "Case 222 from the Manual of PCI: SSO2 for no-reflow." },
        {
          kind: "keypoints",
          items: [
            "No-reflow: the artery is open but the myocardium is not perfused (TIMI 0–1, no blush, pain and ST elevation); causes are reperfusion injury and distal embolisation.",
            "Keep the wire, then decide dissection (stent) versus embolisation (no stent, remove the material, vasodilate).",
            "High risk: thrombus, primary PCI, vein grafts, ectatic vessels, lipid-rich plaque, atherectomy; prevent with protection, thrombectomy where indicated, vasodilators and gentle technique.",
            "Established no-reflow: vasodilator delivered distally; nicardipine is Brilakis's choice; beware block with verapamil and RCA adenosine; nitrates do not help.",
            "Add GP IIb/IIIa inhibitor or cangrelor and thrombectomy for a thrombus component; hold the contrast and give it time.",
            "Persistent hypotension: support the perfusion pressure. Oxford's no-reflow page suggests an IABP, while its own primary PCI section (with IABP-SHOCK II and ESC 2023) does not recommend routine IABP in infarct-related shock; the shock team chooses. Refractory: intracoronary adrenaline (Brilakis), which trials since the manuals show improves flow.",
            "No balloon or stent until TIMI 3 flow is back, and then only if the result needs it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-flow-embolism-plaque-thrombus",
      title: "Plaque and thrombus embolisation: where the debris comes from and how to get it out",
      minutes: 14,
      topics: ["comp-embolisation"],
      sources: [
        B("25.2"),
        B("5.4"),
        B("5.5"),
        B("9.7"),
        B("4.2"),
        B("2.3"),
        B("18.8"),
        B("20.9"),
        B("20.10"),
        B("30.8"),
        B("3.4"),
        B("14.1"),
        O("ch 8: Aspiration catheters"),
        O("ch 8: Vein graft PCI"),
        O("ch 8: Primary PCI"),
        O("ch 10: Myocardial infarction"),
        O("ch 3: Which arterial access route to use?"),
      ],
      refs: [...BOOKS, "keeley-aortic-debris-1998", "iabp-shock-ii-2012", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Debris can leave the guide, the sheath or the lesion and lodge in the coronary bed, the brain or a leg. Brilakis warns that severe embolisation can cause profound haemodynamic compromise and must be treated at once. Most of it is preventable by routine, and the treatment of each kind is different, so this lesson goes source by source.",
        },
        {
          kind: "table",
          caption: "Sources of emboli during catheterisation and PCI (Brilakis 25.2, 5.4, 5.5, 9.7)",
          head: ["Material", "Where it comes from"],
          rows: [
            ["Thrombus", "Inadequate anticoagulant or antiplatelet therapy; suboptimal stent implantation; clot formed inside the arterial sheath and collected by the next catheter; poorly prepared catheters, balloons, stents or indeflators"],
            ["Plaque from the aorta and iliacs", "Catheters scrape the aortic wall on their way up; the debris is flushed out if the catheter is not cleared before the first injection. Keeley's prospective series of 1,000 guide placements, which Brilakis cites, is taught in pm-to-the-root"],
            ["Plaque from the lesion", "Atherectomy; lipid-rich plaque; vein graft lesions; aspiration thrombectomy or initial balloon pre-dilatation of a STEMI culprit"],
            ["Material drawn into the guide", "Withdrawing a balloon can suck thrombus or plaque into the guide, more so with bulky large balloons and plaque modification balloons; the next injection sends it downstream"],
          ],
        },
        {
          kind: "steps",
          title: "Prevention: the routine that keeps debris out",
          items: [
            { title: "1. Sheath and catheters", detail: "Before every catheter goes in, draw 3–4 mL from the sheath side arm and throw it away, then flush with a different syringe of clean heparinised saline. Thrombus can form inside the sheath; a separate syringe means aspirated debris is never pushed back in. Flush each catheter with saline before it enters the body (Brilakis). In severe iliac and aortic disease, Brilakis uses long femoral sheaths, and when catheters must pass an abdominal aortic aneurysm Oxford exchanges them over a guide wire so that they do not knock thrombus off its wall." },
            { title: "2. Guide at the root", detail: "Aspirate 2–3 mL and discard it over a white gauze: thrombus (usually from the sheath) and aortic plaque (often iridescent from cholesterol crystals) are then visible. If suction pulls the tip onto the wall or into an ostial stenosis, let the catheter back-bleed instead." },
            { title: "3. If you cannot aspirate", detail: "Withdraw a few millimetres and try again (the trace returning shows the tip is free); then screen the whole catheter for a kink. If it is not kinked, assume it is plugged with thrombus or plaque: do not pass a wire and do not flush, but remove the catheter under constant suction, then aspirate the sheath, where the clot usually came from. pm-to-the-root teaches this algorithm in full." },
            { title: "4. After every device comes out", detail: "Back-bleed the Y-connector, aspirate the guide and then fill it with contrast before the next injection (Brilakis 9.7.2)." },
            { title: "5. Anticoagulation and antiplatelet therapy", detail: "Keep a therapeutic ACT throughout and recheck it every 20–30 minutes. Brilakis's heparin targets depend on the analyser, because the two point-of-care systems read differently (Hemochron higher than HemoTec): with heparin alone, 300–350 s on the Hemochron and 250–300 s on the HemoTec; with a GP IIb/IIIa inhibitor or cangrelor running, a lower target of 200–250 s (Brilakis 3.4.2). His acute-closure chapter puts the floor as above 250 s (HemoTec) or above 300 s (Hemochron), adjusted for lesion complexity and the IV antiplatelet agent. Give a P2Y12 inhibitor, ideally before a planned PCI." },
            { title: "6. Lesion and device", detail: "Prepare the lesion well enough for full stent expansion and confirm the result with imaging; avoid atherectomy where you can or use the lower speeds; protect vein grafts. Brilakis adds a sheathless guide with an inner dilator, which avoids the 'razor effect' of a guide edge scraping plaque." },
          ],
        },
        { kind: "tip", id: "pci-prep-clear-the-guide" },
        {
          kind: "check",
          stem: "A 7 Fr guide has just reached the root through a femoral sheath in a patient with a diseased aorta. You cannot draw blood back. Pulling back a few millimetres does not help, and fluoroscopy shows no kink. What now?",
          options: [
            "Flush firmly with heparinised saline to clear the lumen, then aspirate again",
            "Pass a J-wire through the catheter to dislodge whatever is blocking it",
            "Withdraw the catheter under continuous suction, then aspirate the sheath",
            "Engage the coronary and inject a small test dose to see whether it flows",
          ],
          answer: 2,
          explanation:
            "Brilakis's algorithm: after a slight withdrawal and a kink check have failed, presume the catheter is plugged with thrombus or plaque. Flushing or passing a wire pushes the material into the aorta or a coronary (stroke or acute occlusion), so the catheter comes out under suction and the sheath, the usual source of the clot, is aspirated next.",
        },
        { kind: "h", text: "Treating coronary embolisation" },
        {
          kind: "steps",
          items: [
            { title: "Recognise it", detail: "ST elevation is usually the first sign; angiography shows reduced or absent antegrade flow. Depending on the size of the embolus and the vessel (RCA versus left main), shock or arrest can follow. IVUS or OCT can show thrombus or plaque." },
            { title: "Thrombus", detail: "Brilakis: anticoagulation plus an IV antiplatelet agent (GP IIb/IIIa inhibitor or cangrelor); thrombectomy when there is a large visible thrombus; intracoronary vasodilators (nicardipine, nitroprusside, verapamil, adenosine). His table adds balloon angioplasty and stenting, and he notes that a stent occasionally traps thrombus and restores flow. The thrombus algorithm is taught in cp-acs-thrombus." },
            { title: "Plaque", detail: "Avoid stenting: it can release more plaque or thrombus and deepen the no-reflow. A covered stent would hold the debris in, but covered stents restenose and thrombose often. Aspirate the remaining thrombus and debris; if aspiration fails, laser can be used; give vasodilators to help the remaining debris through the microcirculation. Balloon angioplasty has a role when the plaque has lodged in an epicardial segment (Brilakis's table)." },
            { title: "Support", detail: "Haemodynamic support if the patient develops shock or arrest (Brilakis 5.5). Oxford treats a lab STEMI from embolism like any other: 100% oxygen, immediate revascularisation by PCI, IABP if cardiogenic shock follows, supportive treatment if revascularisation is not possible, and thrombolysis not usually recommended. Oxford is not consistent about the IABP: its own primary PCI section says routine IABP is not recommended in infarct-related shock after the CRISP-AMI and IABP-SHOCK trials, as do IABP-SHOCK II and the 2023 ESC ACS guideline, and Brilakis notes that no randomised trial had shown a mortality benefit from any support device. The shock team chooses the support (no-reflow lesson, step 5)." },
            { title: "Embolisation during aspiration thrombectomy", detail: "Brilakis: keep suction on until the thrombectomy catheter is right out of the guide, and withdraw it while there is still volume left in the aspiration syringe; then back-bleed and aspirate the guide. If suction is lost on the way out, aspirate the guide, change the syringe and resume suction. Treat embolised thrombus by repeating the thrombectomy, and emboli in small branches with intracoronary vasodilators such as nicardipine or adenosine. Oxford adds good guide engagement while the catheter is retrieved, and lets blood back-spill from the cleared guide and line before contrast goes in." },
          ],
        },
        {
          kind: "list",
          items: [
            "**Aspiration technique that limits embolisation (Brilakis 20.9.6; Oxford ch 8).** cp-acs-thrombus teaches thrombectomy step by step; these are the points that bear on embolisation.",
            "**Suction on before the thrombus.** Brilakis switches the vacuum on before the catheter reaches the occlusion and moves it slowly back and forth within the thrombus; Oxford aspirates while crossing the lesion and makes several passes forwards and backwards.",
            "**Embolised thrombus is often easier to aspirate** than thrombus stuck to the wall, which may fail to come out and then embolise when a balloon or stent is deployed (Brilakis).",
            "**A filter may catch what the catheter frees** (Brilakis).",
            "**Use the catheter's over-the-wire lumen as a delivery route:** after aspiration it can give vasodilators or antiplatelet drugs straight into the thrombotic artery (Brilakis).",
            "**Look at what came out:** Brilakis pushes the aspirate through the supplied basket or over clean gauze and examines it, then repeats the angiogram to see whether the thrombus has gone and flow has returned.",
            "**A stent over residual thrombus can still embolise it:** the struts can slice material off like a grater, and thrombus also leads to undersized or malapposed stents (Brilakis 20.10).",
          ],
        },
        { kind: "tip", id: "pci-embol-thrombus-three-steps" },
        { kind: "tip", id: "pci-embol-plaque-aspirate" },
        {
          kind: "p",
          text: "**An example from Brilakis (Fig. 25.7).** A 90% proximal LAD lesion with a large circumferential lipid core on NIRS-IVUS and an intraluminal mass on OCT was stented with a filter in the distal LAD. Flow stopped after stenting and returned only when the filter was retrieved: it held a yellow fragment of tissue. Minutes later a filling defect appeared inside the stent, which OCT showed was thrombus; it shrank after eptifibatide and post-dilatation. Two lessons follow. A filter that has caught debris can itself become the obstruction, so Brilakis aspirates through the guide and then removes the filter when flow slows (cp-prior-cabg teaches filters). And in-stent thrombus can form within minutes after stenting a lipid-rich plaque (OCT confirmed it in this case), so watch the stent after flow returns.",
        },
        { kind: "tip", id: "pci-epd-slow-flow" },
        {
          kind: "check",
          stem: "During rotational atherectomy of a calcified LAD, a diagonal branch disappears and the distal LAD fills slowly. There is no dissection on two views. A colleague suggests stenting the LAD now 'to pin the debris'. What does Brilakis recommend instead?",
          options: [
            "A covered stent, because it traps the debris against the vessel wall and stops more from escaping",
            "Stop the atherectomy, aspirate, give vasodilators distally, and consider laser if aspiration fails",
            "Continue atherectomy with a larger burr so that the lesion is finished before the flow worsens further",
            "Give protamine to reverse heparin, because the debris is better dealt with by the clotting system",
          ],
          answer: 1,
          explanation:
            "For plaque embolisation Brilakis avoids stenting, which can release more material and worsen no-reflow, and notes that covered stents restenose and thrombose often. During atherectomy he stops the burr and gives vasodilators, delivered distally through a microcatheter or dual-lumen catheter; aspiration removes debris and laser is the fallback. A larger burr adds debris; protamine invites thrombosis.",
        },
        { kind: "h", text: "Systemic embolisation" },
        {
          kind: "list",
          items: [
            "**Leg.** Pulses fall or disappear and the leg aches. Brilakis manages it conservatively as a rule, with endovascular or surgical retrieval if the limb is ischaemic. Severe femoral or iliac disease, clot in the sheath, a badly prepared syringe and failure to aspirate the sheath before injecting are the causes; ultrasound before puncture, aspiration and separate syringes are the prevention. Oxford adds that aortic thrombus seen on ultrasound rules out the femoral route because of renal failure, distal ischaemia and 'trash foot'.",
            "**Brain.** One of the most feared complications of catheterisation (Brilakis): see the stroke lesson.",
            "**During aspiration thrombectomy.** Brilakis links aspiration thrombectomy with a higher stroke risk. Both books keep suction on while the catheter is withdrawn; Oxford adds good guide engagement, and both clear the guide (back-bleed and aspirate) before the next injection.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Flushing a sheath or a guide before aspirating it.",
            "Reusing the aspiration syringe to flush, so the clot goes straight back in.",
            "Injecting after a bulky balloon comes out without back-bleeding and aspirating the guide.",
            "Stenting over embolised plaque in the hope of trapping it.",
            "Assuming the ACT is fine because the heparin was given; check it, and remember the IV line may have failed.",
          ],
        },
        {
          kind: "pearl",
          text: "Look at what you aspirate. A dark clot on the gauze tells you the sheath needs attention; a glistening, iridescent fragment tells you the aorta is shedding cholesterol and every exchange from now on should be over a wire and as gentle as you can make it.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, after the sheath is in, aspirate the side arm and discard, flush with a second syringe, and repeat before each catheter. At the root, aspirate 2–3 mL before connecting. If the catheter will not aspirate, withdraw slightly, screen for a kink, and if neither helps remove it under suction rather than flushing.",
        },
        { kind: "video", id: "y2hZUVqFhRY", note: "Manual of PCI chapter video 25.4: plaque and thrombus embolisation." },
        {
          kind: "keypoints",
          items: [
            "Thrombus comes from the sheath, poor anticoagulation and poor device preparation; plaque from the aorta, atherectomy, lipid-rich lesions, vein grafts and STEMI culprits.",
            "Aspirate the sheath, discard, flush with another syringe; aspirate the guide onto a white gauze; never flush or wire a catheter that will not aspirate.",
            "Back-bleed, aspirate and fill the guide after every device; keep the ACT in the target range for your analyser, lower (200–250 s) when a GP IIb/IIIa inhibitor or cangrelor is running.",
            "Thrombus embolism: anticoagulant plus GP IIb/IIIa inhibitor or cangrelor, thrombectomy for large thrombus, vasodilators.",
            "Plaque embolism: no stent; aspirate, laser if aspiration fails, vasodilators.",
            "A full filter can be the obstruction: aspirate through the guide, then retrieve it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-flow-embolism-air",
      title: "Coronary air embolism: keep it out, clear it, support the patient",
      minutes: 13,
      topics: ["comp-air-embolism"],
      sources: [
        B("25.2"),
        B("5.4"),
        B("5.5"),
        B("2.3"),
        B("8.9"),
        B("9.7"),
        B("4.2"),
        B("14.1"),
        O("ch 10: Air embolism"),
        O("ch 8: Primary PCI"),
        O("ch 10: Death"),
        O("ch 10: Arrhythmia"),
        O("ch 6: Contrast injection"),
        O("ch 6: Storing the unexpected"),
        O("ch 4: Equipment"),
        O("ch 4: Left ventriculography"),
      ],
      refs: [...BOOKS, "khan-air-embolism-1995", "iabp-shock-ii-2012", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Air in a coronary artery behaves like any other embolus: it blocks the vessel it reaches, and the size of the bubble decides whether the patient notices nothing or arrests. Oxford puts coronary air embolism at about 0.4% of coronary angiograms, says it depends on training and is probably more frequent during PCI, and lists massive air embolism among the causes of unexpected death in the lab. In a teaching hospital review of 3,715 procedures, Khan and colleagues found air emboli in 0.27%, more often during PCI training than angiography training (0.84% vs 0.24%), and none in the cines of fellows at the end of their training.",
        },
        {
          kind: "table",
          caption: "How air gets in, and the habit that stops it",
          head: ["Cause", "Prevention"],
          rows: [
            ["Poorly prepared manifold or automated injector", "Prepare it meticulously; before the case inspect every tube, syringe and port for bubbles (Oxford). For a pressure injector, expel air from the reservoir, secure the catheter and aspirate the system (Oxford). Clear the manifold again once the catheter has come up the aorta (Brilakis)"],
            ["Poor manifold connections", "Connect while the manifold is flushing, then aspirate into the syringe and discard any air (Brilakis 5.5)"],
            ["Damped pressure: ostial disease or the tip against the aortic wall", "Never inject into a damped trace (Brilakis); if you cannot aspirate, pull the catheter back gently until blood flows easily, because injecting otherwise risks air embolism (Oxford)"],
            ["Forceful aspiration of a wedged or blocked guide", "Air can be drawn in through the Y-connector valve; if it happens, remove every bubble before the next injection (Brilakis 5.4)"],
            ["Large devices entraining air; balloon withdrawal, especially large balloons", "Back-bleed, aspirate and flush the guide after each device (Brilakis 9.7.2); prepare large devices carefully"],
            ["Trapping without back-bleeding afterwards", "Always back-bleed the haemostatic valve after trapping, or flush continuously while the catheter is removed (Brilakis 8.9)"],
            ["Rupture of a balloon that still contains air", "Prepare balloons to remove all air"],
            ["Air in the syringe", "Check the syringe and tubing for air before injecting. Oxford advises holding the syringe with its distal end raised, which lowers the embolisation risk; this module reads that as the plunger end, so that any bubble rises away from the outlet"],
            ["Left ventriculography", "Oxford lists air or thrombus embolisation among the complications of the ventriculogram; prepare the pressure injector as above before connecting it"],
          ],
        },
        { kind: "tip", id: "pci-trap-then-backbleed" },
        { kind: "tip", id: "pci-air-find-source" },
        {
          kind: "check",
          stem: "Mid-case, the pressure trace damps after a microcatheter is withdrawn with a trapping balloon. The scrub nurse is ready to inject contrast to check the wire position. What should happen first?",
          options: [
            "Inject a small, gentle test dose so that any air enters the vessel slowly and safely",
            "Back-bleed the Y-connector and aspirate the guide until clean blood returns",
            "Flush the guide with saline through the manifold to push any air clear of the tip",
            "Disengage the guide and inject into the sinus, since air there is harmless to the patient",
          ],
          answer: 1,
          explanation:
            "Brilakis lists air entrainment during trapping as a cause of a damped trace and says coronary air embolism is likely if contrast is injected without back-bleeding. Back-bleed and aspirate until there is clean blood. Flushing pushes the air forwards, and air sent into the root can still embolise systemically: both books list air among the causes of stroke.",
        },
        {
          kind: "table",
          caption: "The spectrum of coronary air embolism",
          head: ["Size", "What you see", "Source"],
          rows: [
            ["Any size, from microbubbles to a full syringe", "Sometimes found only when the film is reviewed afterwards, in a patient who had no symptoms", "Oxford"],
            ["Small, usually distal vessels", "Chest discomfort, pallor, nausea", "Oxford"],
            ["Main coronary artery", "STEMI, cardiogenic shock, ventricular arrhythmias; Oxford's arrhythmia section names air embolus among the causes of VF", "Oxford"],
            ["Any significant embolus", "ST elevation is usually the first sign; RCA or left main air can cause shock or arrest; flow slows or stops", "Brilakis 5.5"],
          ],
        },
        { kind: "tip", id: "diag-mon-store-loop" },
        { kind: "h", text: "Treatment, step by step" },
        {
          kind: "steps",
          items: [
            { title: "1. Stop injecting and keep the wire", detail: "Nothing more goes through the manifold until the air source is found. Keep any wire that is down the vessel; you will use it. Call for help early: Brilakis warns that haemodynamic deterioration can be very rapid, and Oxford advises seeking expert help." },
            { title: "2. 100% oxygen", detail: "Through a non-rebreather mask (Brilakis); it helps the air to be absorbed. In an asymptomatic patient with a small bubble, Oxford usually needs nothing more." },
            { title: "3. Treat the symptoms", detail: "Oxford gives opioid analgesia for ischaemic pain, and intracoronary nitrate may relieve any associated spasm. Nitrate is for spasm once the pressure allows: Brilakis does not give glyceryl trinitrate (nitroglycerin) to a hypotensive patient." },
            { title: "4. Break up and remove the air", detail: "Advance a workhorse coronary wire to the distal vessel and steer it into several side branches: the moving wire tip breaks up the residual air in the small branches. Aspirate through the guide, or through an aspiration thrombectomy catheter when a large volume has embolised. Oxford also pulls back on the syringe attached to the catheter to try to free the bubble. Flushing saline forcefully and repeatedly can help reopen the blocked vessels (Brilakis 5.5). Brilakis's table of causes also lists intracoronary vasodilators for air, without conditions; one case report in his reference list cleared massive air with catheter aspiration and intracoronary adenosine. This module adds a caution, drawn from the heart block that adenosine and verapamil can cause (Brilakis 3.2; Oxford ch 8): in a patient who is already bradycardic or in heart block, avoid adenosine and verapamil, and give any vasodilator only once the guide has been cleared." },
            { title: "5. Support the rhythm and pressure while the air clears", detail: "Treat the bradycardia or AV block with atropine or temporary pacing, the hypotension with a vasopressor, and VF with defibrillation. These are general resuscitation measures rather than steps either manual lists for air: the Academy lesson comp-dissection-flow teaches them, and Khan and colleagues suggest supportive measures (100% oxygen, IABP, CPR and DC cardioversion) alongside aspiration or forceful saline. Brilakis adds haemodynamic support if shock or arrest develops." },
            { title: "6. If the patient arrests", detail: "Brilakis gives intracoronary adrenaline (epinephrine), and notes 0.05 mg has been used, alongside resuscitation and defibrillation for VF. Oxford considers an IABP in cardiogenic shock, but its own primary PCI section does not recommend routine IABP in infarct-related shock (nor do IABP-SHOCK II and the 2023 ESC ACS guideline), so the shock team chooses the support." },
            { title: "7. If the vessel stays occluded", detail: "Treat the patient as a myocardial infarction (Oxford); emergency bypass surgery may be required." },
            { title: "8. Find the source before the next injection", detail: "Check every connection, the manifold, the syringe and the valve; back-bleed and aspirate the guide. Brilakis notes that air embolism usually resolves with supportive measures without further intervention." },
          ],
        },
        { kind: "tip", id: "pci-air-first-moves" },
        { kind: "tip", id: "pci-air-collapse" },
        {
          kind: "check",
          stem: "A 2 mL bubble is seen entering a dominant RCA. Within seconds the heart rate is 35 bpm, BP 60/30 mmHg, and the inferior leads show ST elevation. A workhorse wire is already in the distal RCA. Which sequence best fits the manuals?",
          options: [
            "Give 100% oxygen, aspirate through the guide, move the wire into distal branches, and treat the collapse",
            "Inject contrast forcefully through the manifold to wash the bubble out, then wait for the rhythm to recover",
            "Start IV glyceryl trinitrate to dilate the vessel, then tilt the patient head-down to keep air from the brain",
            "Withdraw the wire to avoid dissecting the RCA, then give thrombolysis for the occlusion that follows",
          ],
          answer: 0,
          explanation:
            "Brilakis: oxygen, a wire into the distal vessel and side branches to break up bubbles, aspiration through the guide or an aspiration catheter, and rapid support (intracoronary adrenaline if arrest). Injecting more through a manifold that may still hold air risks more air; the forceful injections he mentions are saline. IV nitrate drops the pressure further, and Trendelenburg positioning is controversial because it may increase cerebral oedema.",
        },
        {
          kind: "p",
          text: "**Systemic air.** Air can also reach the brain or a limb. Brilakis says a large systemic air embolism could be treated in a hyperbaric chamber, and that putting the patient head-down (Trendelenburg) is controversial because it may increase cerebral oedema. For air injected into a femoral sheath he considers 100% oxygen. Oxford's caution applies to all of this: the advice rests on case reports and small series, some of the interventions carry their own risk, and expert help should be sought.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting through a manifold or guide that has not been checked after the event, so a second bubble follows the first.",
            "Pulling the wire back in the confusion, when it is the tool that breaks up the air.",
            "Treating a damped trace as a reason to inject harder.",
            "Forgetting to back-bleed after trapping or after a large balloon comes out.",
            "Dismissing a small bubble on the film without watching the ECG and the patient.",
          ],
        },
        {
          kind: "pearl",
          text: "Air embolism is a preparation failure, so the fix includes the system: after every event, the whole team reviews the manifold, the lines and the valve before the next injection, and the run is stored so that it can be reviewed and taught.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (mid-RCA CTO), withdraw the microcatheter with a trapping balloon, then back-bleed and aspirate the guide before any injection. If the lab reports air, give 100% oxygen, aspirate the guide, try forceful saline and support the rhythm (atropine, pacing, defibrillation as needed) before you inject again.",
        },
        { kind: "video", id: "xng1sbQ-bT0", note: "Manual of PCI chapter video 25.5: air embolisation." },
        { kind: "video", id: "36nFSiyR008", note: "Case 197 from the Manual of PCI: 'Airmail'." },
        { kind: "video", id: "eTb3Stlg8fU", note: "Elias Hanna: SCAD cases and discussion, and air embolism cases." },
        {
          kind: "keypoints",
          items: [
            "About 0.4% of angiograms (Oxford); training-dependent and probably more frequent during PCI.",
            "Causes: manifold and injector preparation, loose connections, damped pressure, forceful aspiration of a wedged guide, devices and balloon withdrawal, trapping without back-bleeding, ruptured air-filled balloons.",
            "Presentation ranges from a bubble seen only on review to STEMI, shock, VF and death.",
            "Treat: stop injecting, 100% oxygen by non-rebreather, wire through the distal bed and branches, aspirate via guide or aspiration catheter, forceful saline; support the rhythm and pressure (atropine or pacing, vasopressor, defibrillation) while the air clears.",
            "Arrest: intracoronary adrenaline (0.05 mg has been used) and full support; occluded vessel: treat as MI; surgery may be needed.",
            "Systemic air: hyperbaric treatment is an option; Trendelenburg is controversial.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-flow-embolism-stroke",
      title: "Stroke around the procedure: prevent it, spot it, act on it",
      minutes: 13,
      topics: ["comp-stroke"],
      sources: [
        B("5.5"),
        B("5.4"),
        B("2.1"),
        B("3.5"),
        B("20.9"),
        B("27"),
        O("ch 10: Stroke"),
        O("ch 10: Risks of complications"),
        O("ch 8: Aspiration catheters"),
        O("ch 4: Left ventriculography"),
        O("ch 1: Indications for cardiac catheterization"),
      ],
      refs: [...BOOKS, "powers-acute-stroke-2019", "prabhakaran-ais-2026"],
      blocks: [
        {
          kind: "p",
          text: "Oxford quotes stroke in about 1 in 1000 diagnostic catheterisations; Brilakis calls systemic embolisation, stroke above all, one of the most feared complications of the procedure. The Academy lesson in comp-systemic-access gives the outline. This lesson matches each mechanism to its prevention, and then works through what to do when a deficit appears on the table or hours later on the ward.",
        },
        {
          kind: "table",
          caption: "Mechanisms of stroke during catheterisation and the measure that addresses each",
          head: ["Mechanism", "Prevention"],
          rows: [
            ["Atherosclerotic material knocked off the aortic wall (one of Oxford's two usual mechanisms)", "Change catheters over a guidewire (Oxford); aspirate and clear the catheter after it comes up the aorta before any injection (Brilakis); a sheathless guide with an inner dilator avoids scraping (Brilakis)"],
            ["Thrombus (the other usual mechanism): clot on catheters and wires, or clot already present, such as LV thrombus", "Flush catheters and wipe wires with heparinised saline; in high-risk patients consider anticoagulating them and follow the clotting time (Oxford); never flush or wire a catheter that will not aspirate (Brilakis); LV thrombus is a relative contraindication to ventriculography (Oxford)"],
            ["Air", "Inspect tubing, manifold and syringes for bubbles before starting (Oxford)"],
            ["Carotid or vertebral dissection, particularly while cannulating the LIMA (Oxford)", "Oxford names the mechanism; graft engagement technique is taught in cp-prior-cabg"],
            ["Aspiration thrombectomy", "Brilakis links it with a higher stroke risk; keep suction on and the guide engaged while withdrawing the catheter (Oxford)"],
            ["Embolised equipment", "Lost devices can travel to an intracranial artery (Brilakis, chapter 27)"],
            ["Intracranial haemorrhage (Oxford)", "Not an embolic cause; this is why Oxford asks about the anticoagulation status and whether the event is haemorrhagic or embolic before treatment"],
          ],
        },
        {
          kind: "p",
          text: "**Who is at higher risk (Oxford):** older patients with known atheroma or a previous stroke, and patients with diabetes, renal failure, hypertension or aortic valve disease. Oxford also lists an acute stroke among the relative contraindications to catheterisation.",
        },
        { kind: "tip", id: "diag-exchange-over-wire" },
        {
          kind: "check",
          stem: "A 79-year-old with diabetes, a previous stroke and calcified aortic stenosis needs angiography. Which plan addresses the aortic mechanism Oxford names first?",
          options: [
            "Use the stiffest catheters available so that each one engages the ostium at the first attempt",
            "Exchange over a wire, clear each catheter before injecting, and manipulate gently",
            "Inject a larger contrast bolus into the root so that fewer selective engagements are needed",
            "Avoid heparin altogether during the case, since haemorrhage is the commonest cause of stroke",
          ],
          answer: 1,
          explanation:
            "One of Oxford's two usual mechanisms is atheroma dislodged from the aortic wall (the other is thrombus), and its high-risk list includes age, known atheroma, previous stroke, diabetes and aortic valve disease. Exchanging over a wire reduces plaque disruption, and clearing the catheter before injecting stops scraped material being sent downstream. Oxford advises considering systemic anticoagulation in high-risk cases, not avoiding it.",
        },
        { kind: "h", text: "Recognising a stroke" },
        {
          kind: "list",
          items: [
            "**Ask and look throughout.** Brilakis's monitoring includes whether the patient can move all four limbs. A new focal deficit, such as weakness or loss of vision, is the alarm (Brilakis 5.5).",
            "**The range (Oxford).** From mild symptoms to hemiparesis, aphasia and coma. The most frequent are disturbance of vision, weakness, aphasia and a change in mental state; in nearly half of cases the posterior (vertebrobasilar) circulation is affected.",
            "**Timing.** Symptoms can appear hours after the study, from late embolisation (Oxford), so the recovery team must know what to look for.",
            "**Outlook.** Many events resolve completely within 24 hours (Oxford), which never justifies waiting to act.",
          ],
        },
        {
          kind: "steps",
          title: "When a deficit appears",
          items: [
            { title: "1. Airway, breathing, circulation", detail: "Treat what you find (Oxford)." },
            { title: "2. Stop", detail: "Oxford abandons the procedure and removes the catheters. Neither manual covers two situations a fellow will meet, so this is the module's judgement: if the stroke happens mid-PCI with the culprit artery still occluded, decide with the senior operator whether to complete the life-saving step before stopping; and leave the arterial sheath in place until the stroke team has decided about neurointervention, because pulling it under full heparin adds bleeding risk." },
            { title: "3. Examine and record", detail: "A full neurological examination, written in the notes (Oxford). This module adds: record the time the deficit was first noticed, which the stroke team will need." },
            { title: "4. Bleed or clot?", detail: "Review the anticoagulation status and ask whether the event is a haemorrhage or an embolism (Oxford). This module adds the antiplatelet drugs and when each was given, which the stroke team will also need." },
            { title: "5. Image now", detail: "Brilakis: emergency head CT and a neurology assessment, because urgent neurointervention may help many of these patients. Oxford: CT to exclude haemorrhage. The 2019 AHA/ASA update recommended vascular imaging alongside the non-contrast CT to select patients for mechanical thrombectomy. Its replacement, the 2026 AHA/ASA guideline, revised eligibility for thrombolysis and for endovascular thrombectomy and changed the approach to thrombolysis contraindications, so the stroke team applies the current criteria." },
            { title: "6. Hand over to the stroke team", detail: "Oxford cites case reports in which thrombolysis, given systemically or locally, succeeded in extensive embolic strokes; current decisions about thrombolysis and thrombectomy belong to the stroke team. Rehabilitation continues with expert neurological input, for example on a stroke unit." },
          ],
        },
        { kind: "tip", id: "diag-finish-neuro-check" },
        {
          kind: "check",
          stem: "Three hours after an uneventful radial PCI, the recovery nurse finds the patient has new word-finding difficulty and a weak right hand. Heparin was given in the lab. What is the best immediate plan?",
          options: [
            "Reassure and reassess in an hour, since many post-catheter events resolve within a day",
            "Give aspirin 300 mg now, since most of these strokes are embolic from aortic plaque",
            "ABC, examine and time the deficit, emergency CT with vascular imaging, stroke team",
            "Start an IV heparin infusion now for presumed embolism from thrombus on a catheter",
          ],
          answer: 2,
          explanation:
            "Late embolisation can produce a deficit hours after the study (Oxford). Neither manual waits: after ABC and a documented examination, Oxford asks whether the event is haemorrhagic or embolic and arranges CT to exclude bleeding; Brilakis gives emergency CT and neurology review because urgent neurointervention may help. Antithrombotic drugs before imaging could make a haemorrhage worse; that many events resolve is no reason to delay.",
        },
        {
          kind: "p",
          text: "**After a stroke or TIA,** remember the drug consequence: Brilakis notes that prasugrel is contraindicated in patients with a previous TIA or stroke, so the P2Y12 choice for the stent has to be reviewed.",
        },
        {
          kind: "pitfalls",
          items: [
            "Putting a new deficit down to sedation and waiting for it to wear off.",
            "Giving antithrombotic drugs for a presumed embolism before a scan has excluded haemorrhage.",
            "Not telling the recovery team that symptoms can start hours later.",
            "Flushing a catheter that will not aspirate.",
            "Exchanging catheters in a diseased aorta without a wire.",
          ],
        },
        {
          kind: "pearl",
          text: "Make Brilakis's monitoring question (can the patient move all four limbs?) part of the end of every case, and ask the patient to talk to you before they leave the table. A deficit noticed in the lab, with a time attached, goes straight to imaging and the stroke team.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, exchange catheters over a wire, aspirate each catheter at the root before injecting, and before the patient leaves the table ask them to move all four limbs and speak. In recovery, describe the first six steps you would take if a new weakness were reported.",
        },
        { kind: "video", id: "nF4sR3k7ivI", note: "Case 136 from the Manual of PCI: stroke." },
        {
          kind: "keypoints",
          items: [
            "About 1 in 1000 diagnostic catheterisations (Oxford); usually aortic atheroma or thrombus, also air, arterial dissection, LV thrombus, devices and haemorrhage.",
            "Higher risk: older patients with atheroma or prior stroke, diabetes, renal failure, hypertension, aortic valve disease.",
            "Prevent: exchanges over a wire, heparinised flushes, clean wires, aspirate before injecting, no flushing of a blocked catheter, bubble checks.",
            "Symptoms: visual disturbance, weakness, aphasia, confusion; vertebrobasilar in almost half; may start hours later.",
            "Act: ABC, stop and remove catheters, examine and document, bleeding or embolism, emergency CT with vascular imaging, stroke team.",
            "After a stroke or TIA, prasugrel is contraindicated.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-flow-embolism-oedema-cholesterol",
      title: "Pulmonary oedema and cholesterol embolisation",
      minutes: 13,
      topics: ["comp-oedema-cholesterol"],
      sources: [
        B("14.1"),
        B("3.2"),
        B("29.1"),
        B("5.4"),
        B("2.4"),
        O("ch 1: Indications for cardiac catheterization"),
        O("ch 10: Pulmonary oedema"),
        O("ch 10: Cholesterol embolization"),
        O("ch 10: Risks of complications"),
        O("ch 10: Renal failure"),
        O("ch 4: Left ventricular filling pressure"),
        O("ch 4: Left ventriculography"),
        O("ch 9: Intra-aortic balloon pump"),
        O("ch 8: Primary PCI"),
      ],
      refs: [...BOOKS, "brar-poseidon-2014", "fukumoto-ces-2003", "iabp-shock-ii-2012", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Both complications are uncommon (Oxford: pulmonary oedema 0.1% and cholesterol embolisation 1.4% of diagnostic studies) and both are partly predictable. Pulmonary oedema is usually a volume problem in a heart that cannot take it. Cholesterol embolisation is a shower of crystals from atheromatous plaque, usually disrupted mechanically by catheters (Oxford), so gentle handling reduces it. Oedema declares itself on the table; the renal and skin signs of cholesterol embolisation may only be recognised later.",
        },
        { kind: "h", text: "Pulmonary oedema" },
        {
          kind: "p",
          text: "**Who is at risk (Oxford):** patients with LV impairment, a raised LVEDP, severe aortic or mitral stenosis, or dialysis-dependent renal failure. Oxford also lists existing pulmonary oedema among the relative contraindications to the catheterisation itself. **Early warning:** a falling oxygen saturation can signal early pulmonary oedema, although oversedation with hypoventilation and artefact cause it too; an arterial blood gas gives the fuller picture (Brilakis 2.4).",
        },
        {
          kind: "table",
          caption: "Warning numbers before and during the case",
          head: ["Measurement", "Threshold and meaning", "Source"],
          rows: [
            ["LVEDP", "Normal 3–12 mmHg; above 30 mmHg pulmonary oedema is likely, so minimise contrast and avoid ventriculography", "Oxford ch 4"],
            ["LVEDP and ventriculography", "Relative contraindications to a ventriculogram: LVEDP above 35 mmHg, pulmonary oedema, critical aortic stenosis, severe left main stenosis (risk of hypotension), LV systolic hypertension and LV thrombus. A good-quality echocardiogram gives the same information and can replace it. Oxford gives two figures (30 mmHg on its filling-pressure page, 35 mmHg on its ventriculography page); the lower one is the safer working threshold (this module's advice)", "Oxford ch 4"],
            ["Wedge pressure", "Above 18 mmHg suggests LV failure", "Brilakis 14.1"],
            ["Wedge with mixed venous saturation", "Wedge above 25 mmHg with mixed venous saturation below 50%: high risk of oedema and shock around PCI; the pulmonary artery catheter can stay in during PCI to guide support", "Brilakis 14.1"],
          ],
        },
        {
          kind: "p",
          text: "The trigger is usually a large volume of contrast in one of these patients; oedema can also come with a contrast reaction or with myocardial ischaemia (Oxford). Fluid given to protect the kidneys adds to the load. In POSEIDON (Brar 2014), fluid guided by the measured LVEDP reduced contrast-induced kidney injury compared with a standard protocol (6.7% vs 16.3%), and hydration was stopped early for breathlessness in three patients in each group, so LVEDP-guided fluid did not add respiratory complications. Measuring the LVEDP lets the fluid plan follow the ventricle's filling pressure. Contrast limits and kidney protection are taught in cm-patient-complications.",
        },
        { kind: "tip", id: "diag-lvedp-before-lv-gram" },
        { kind: "tip", id: "haemo-wedge-oedema-risk" },
        {
          kind: "steps",
          title: "Treating pulmonary oedema on the table (Oxford, with Brilakis's nitrate regimen)",
          items: [
            { title: "1. Oxygen and position", detail: "Oxford gives high-flow oxygen and sits the patient up if the procedure allows." },
            { title: "2. Loop diuretic", detail: "An IV loop diuretic, for example furosemide 80–100 mg (Oxford's typical dose; follow your local protocol)." },
            { title: "3. Nitrate if the pressure allows", detail: "If the systolic pressure is above 100 mmHg, consider IV nitrate: Oxford gives isosorbide dinitrate 2–10 mg/hour; Brilakis, who lists the treatment of pulmonary oedema among glyceryl trinitrate's uses, starts an infusion at 10 µg/min and increases by 10 µg/min every 5 minutes while the systolic stays above 100 mmHg, to a maximum of 200 µg/min." },
            { title: "4. Ventilatory support", detail: "Continuous positive airway pressure can be extremely effective (Oxford)." },
            { title: "5. Mechanical support", detail: "Oxford considers an IABP and lists severe pulmonary oedema among its indications, and Brilakis notes that acute pulmonary oedema during or after PCI can be a reason for haemodynamic support. Trial evidence for an IABP in oedema without shock is lacking, and routine IABP is not recommended in infarct-related shock (Oxford's primary PCI section; IABP-SHOCK II; 2023 ESC ACS guideline), so keep mechanical support for oedema with haemodynamic compromise and choose it with the shock team." },
            { title: "6. Find and treat the cause", detail: "Ischaemia from a closed vessel, a contrast reaction or simple volume; then admit for close monitoring and further treatment." },
          ],
        },
        { kind: "tip", id: "diag-oedema-on-table" },
        {
          kind: "check",
          stem: "During diagnostic angiography in a man with severe aortic stenosis and an LVEF of 30%, the LVEDP is 32 mmHg. The plan included a left ventriculogram. What fits Oxford's advice best?",
          options: [
            "Proceed with the ventriculogram but inject it slowly over a longer period of time",
            "Give a 500 mL saline bolus first to protect the kidneys from the contrast load",
            "Omit the ventriculogram, minimise contrast and watch for breathlessness",
            "Proceed, because a ventriculogram is only contraindicated above 40 mmHg of LVEDP",
          ],
          answer: 2,
          explanation:
            "Oxford: above an LVEDP of 30 mmHg pulmonary oedema is likely, so minimise contrast and avoid ventriculography; an LVEDP above 35 mmHg and critical aortic stenosis are relative contraindications to it, and an echocardiogram can supply the LV information instead. A fluid bolus adds to a load this ventricle cannot handle.",
        },
        { kind: "h", text: "Cholesterol embolisation" },
        {
          kind: "list",
          items: [
            "**Mechanism.** Cholesterol crystals break off atheromatous plaque and lodge downstream in small arteries of the brain, eyes, kidneys and limbs, typically after catheter manipulation in an aorta lined with atheroma (Oxford). Brilakis describes aortic plaque aspirated from a guide as often iridescent because of these crystals.",
            "**Who.** More common with aortic aneurysm and cerebrovascular disease (Oxford). It is probably under-diagnosed: prospective series suggest up to 1.4% of routine diagnostic angiograms.",
            "**The evidence behind 1.4%.** Fukumoto and colleagues followed 1,786 consecutive patients after left heart catheterisation: 25 (1.4%) developed the syndrome, 48% with skin signs and 64% with renal insufficiency, and in-hospital mortality was 16%. The femoral route did not increase the incidence, suggesting the ascending aorta as a possible source.",
          ],
        },
        {
          kind: "table",
          caption: "Cholesterol embolisation or acute limb ischaemia?",
          head: ["Feature", "Cholesterol embolisation", "Acute limb ischaemia (Brilakis 29.1)"],
          rows: [
            ["Cause", "Showers of microemboli (cholesterol crystals)", "Thrombosis, dissection, embolism of large thrombi, closure device problems"],
            ["Pulses", "Intact: Brilakis's triad is leg or foot pain, livedo reticularis and palpable pulses", "Reduced or absent, with pain, pallor, paralysis, paraesthesia and a cold limb"],
            ["Skin", "Livedo reticularis, blue toes, digital gangrene (Oxford)", "Pallor"],
            ["Other organs", "Visual disturbance, neurological deficits, renal impairment that persists beyond 2 weeks (Oxford)", "Limited to the limb"],
            ["Blood and tissue", "Eosinophil count often rises; biopsy shows crystals in occluded arterioles", "Imaging shows the occlusion"],
            ["Treatment", "Supportive", "Angiography and endovascular or surgical treatment"],
          ],
        },
        {
          kind: "steps",
          title: "Managing cholesterol embolisation",
          items: [
            { title: "Prevent it", detail: "The mechanism is mechanical, so handle catheters carefully in the aorta, exchange them over guide wires, choose soft-tipped catheters, and do not inject forcefully with the tip against the aortic or vessel wall (Oxford)." },
            { title: "Support", detail: "Careful hydration and blood pressure control; surgery is rarely needed for distal ischaemia; ask the renal team early if kidney function is severely affected (Oxford). Brilakis: there is no specific treatment and prevention is key." },
            { title: "The disputed drugs", detail: "The books differ. Oxford calls anticoagulants, statins and steroids controversial; Brilakis says statins may help with the acute kidney injury." },
            { title: "Prognosis", detail: "Poor when several organs are involved: Oxford says up to 90% die within 3 months of multisystem disease. Renal failure after catheterisation is usually contrast nephropathy but can be cholesterol embolisation (Oxford)." },
          ],
        },
        {
          kind: "check",
          stem: "Three weeks after femoral angiography, a 72-year-old with an abdominal aortic aneurysm has painful mottled feet, palpable foot pulses, a creatinine that is still rising and a raised eosinophil count. What is the most likely diagnosis?",
          options: [
            "Acute limb ischaemia from a closure device, needing emergency angiography of the leg",
            "Contrast nephropathy alone, with livedo from the low blood pressure of the procedure",
            "Cholesterol embolisation, managed supportively with hydration and pressure control",
            "A femoral pseudoaneurysm compressing the artery, needing ultrasound-guided thrombin",
          ],
          answer: 2,
          explanation:
            "Livedo with intact pulses, renal impairment persisting beyond 2 weeks, eosinophilia and an aortic aneurysm are the picture of cholesterol embolisation (Oxford; Brilakis's triad of foot pain, livedo and intact pulses). Acute limb ischaemia removes the pulses. Contrast nephropathy does not explain the skin or the eosinophils.",
        },
        {
          kind: "pitfalls",
          items: [
            "Doing a routine ventriculogram without reading the LVEDP first.",
            "Running pre-hydration at a fixed rate in a patient whose LVEDP is already high.",
            "Giving nitrate to an oedematous patient whose systolic pressure is below 100 mmHg.",
            "Calling livedo with palpable pulses 'bruising' and labelling the rising creatinine contrast nephropathy.",
          ],
        },
        {
          kind: "pearl",
          text: "Read the LVEDP before you inject anything into the ventricle, and say it aloud: it decides whether you do the ventriculogram, how much more contrast is acceptable, and how much fluid the ward should give.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, measure the LVEDP and the wedge pressure before any ventriculogram. State whether the values make a ventriculogram acceptable (Oxford gives 30 mmHg on one page and 35 mmHg on another; work to the lower) and whether the patient is at high risk of oedema (Brilakis: wedge above 25 mmHg with mixed venous saturation below 50%).",
        },
        {
          kind: "keypoints",
          items: [
            "Pulmonary oedema (0.1%): large contrast volumes in LV impairment, raised LVEDP, severe AS or MS, dialysis; also contrast reaction or ischaemia.",
            "LVEDP above 30 mmHg: oedema likely, minimise contrast, no ventriculogram; above 35 mmHg is a relative contraindication. Wedge above 25 with SvO2 below 50%: high risk.",
            "Treat: oxygen, sit up, furosemide 80–100 mg IV, IV nitrate if systolic above 100, CPAP, consider an IABP if the circulation is compromised, treat the cause.",
            "Cholesterol embolisation (up to 1.4%): livedo, blue toes, intact pulses, renal impairment beyond 2 weeks, eosinophilia.",
            "Prevent with gentle aortic handling, wire exchanges, soft tips and no forceful injections against the wall; treatment is supportive.",
            "Statins: may help the kidney (Brilakis) or controversial (Oxford); multisystem disease carries a poor prognosis.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cm-flow-embolism-q1",
      stem: "Which statement best captures Brilakis's key distinction when antegrade flow falls during PCI?",
      options: [
        "Spasm needs nitroglycerin and everything else needs surgery",
        "Dissection needs a stent, while embolisation can be worsened by one",
        "Thrombus needs protamine, while dissection needs more heparin",
        "Every cause of lost flow is best treated with a longer and larger stent",
      ],
      answer: 1,
      explanation:
        "Brilakis makes the separation of dissection (treated by stenting) from distal embolisation (which stenting may worsen, and which needs removal of the material and/or vasodilators) the central decision of acute closure. Spasm is one cause among eight and rarely causes complete cessation of flow; protamine has no place in thrombosis.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-flow-embolism-q2",
      stem: "Established no-reflow after stenting a vein graft: the graft is open, flow is TIMI 1, BP 100/60 mmHg. Where and how should Oxford's vasodilators be given?",
      options: [
        "Through the guide catheter at the graft ostium, as for prevention",
        "Intravenously, so that the whole coronary bed receives the drug",
        "Through an over-the-wire balloon or probing catheter near the distal bed",
        "Into the aortic root through a pigtail catheter, so that the graft is avoided altogether",
      ],
      answer: 2,
      explanation:
        "Oxford gives preventive doses through the guide, but once no-reflow is established and antegrade flow is absent the drug goes through an over-the-wire balloon or a multifunctional probing catheter whose tip sits as near the distal bed as it can reach. Given into the guide with no forward flow, the drug is likely to reflux into the aorta (the reasoning behind Oxford's route, not its wording); IV dosing lowers the pressure without reaching the target.",
      difficulty: 1,
      refs: OXFORD,
    },
    {
      id: "cm-flow-embolism-q3",
      stem: "A patient with asthma develops no-reflow in the left anterior descending artery after primary PCI. Heart rate 88 bpm, BP 104/70 mmHg. Which agent is least appropriate according to Oxford?",
      options: ["Adenosine", "Verapamil", "Sodium nitroprusside", "Nicardipine"],
      answer: 0,
      explanation:
        "Oxford advises avoiding adenosine in asthmatic patients and in those taking dipyridamole. Verapamil (watch for heart block) and nitroprusside are Oxford's other agents, and nicardipine is Brilakis's preferred agent because it lowers the pressure least; none is contraindicated by asthma.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cm-flow-embolism-q4",
      stem: "The two manuals give different intracoronary doses for no-reflow. Which pairing is correct?",
      options: [
        "Adenosine: Brilakis 30–50 µg; Oxford 100–200 µg into the left main",
        "Nitroprusside: Brilakis 100–300 µg; Oxford 50–100 µg, repeatable",
        "Verapamil: Brilakis 100–500 µg; Oxford 1 mg over 2 minutes only",
        "Nicardipine: Brilakis 1 mg over 2 minutes; Oxford 100–300 µg",
      ],
      answer: 1,
      explanation:
        "Brilakis gives nitroprusside 100–300 µg and Oxford 50–100 µg, repeatable. The other options swap the books: Oxford's adenosine is 30–50 µg and Brilakis's left main dose 100–200 µg; Brilakis's verapamil is 1 mg over 2 minutes and Oxford's 100–500 µg; nicardipine (100–300 µg) appears only in Brilakis.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-flow-embolism-q5",
      stem: "Before rotational atherectomy of a calcified RCA, which combination of settings does Brilakis associate with a lower risk of slow flow and no-reflow?",
      options: [
        "Runs of 30 s with 15 s between them, burr-to-artery ratio 0.7, speed 200,000 rpm",
        "Runs under 15 s with over 30 s between them, ratio under 0.5, 140,000–150,000 rpm",
        "Continuous runs until the burr crosses, with decelerations accepted to finish faster",
        "Runs under 15 s, ratio over 0.6, speed above 180,000 rpm to minimise decelerations",
      ],
      answer: 1,
      explanation:
        "Brilakis keeps runs under 15 s with more than 30 s between them, the burr-to-artery ratio below 0.5, and avoids speeds above 180,000 rpm, suggesting 140,000–150,000 rpm; he also avoids decelerations of more than 5,000 rpm and pressure damping, and gives a vasodilator first. Long runs and decelerations release more and larger particles; larger burrs and higher speeds add debris. Oxford differs on size and speed: it selects the burr at a ratio of 0.5–0.6 (never above 0.6) and gives an ideal speed of 135,000–180,000 rpm, so a ratio above 0.6 and a speed above 180,000 rpm fall outside both books.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cm-flow-embolism-q6",
      stem: "After a large balloon is pulled from a 6 Fr guide, the next injection is followed by chest discomfort and a small bubble in a distal LAD branch. The patient is otherwise stable with no ST change. What does Oxford usually recommend?",
      options: [
        "Intracoronary adrenaline at once, before the rhythm and pressure deteriorate",
        "Emergency surgical review, since the small branch may remain occluded",
        "High-flow 100% oxygen, analgesia, aspiration on the guide, and observation",
        "Head-down tilt to keep the air in the coronaries and away from the brain",
      ],
      answer: 2,
      explanation:
        "Oxford gives high-flow 100% oxygen to speed reabsorption, opiate analgesia for ischaemic pain, and suction on the catheter syringe to try to free the bubble; only an asymptomatic patient usually needs nothing further. Watch the ECG and the patient. Brilakis keeps intracoronary adrenaline for cardiac arrest; surgery is for a vessel that stays occluded; Trendelenburg is controversial because it may increase cerebral oedema. Then find the source before the next injection.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cm-flow-embolism-q7",
      stem: "A full syringe of air has entered a dominant RCA. Flow has stopped and the patient has a slow, broad rhythm with BP 55/30 mmHg. A workhorse wire is in the distal RCA. Which action does Brilakis describe as a way to clear the distal circulation itself?",
      options: [
        "Steer the wire into the distal vessel and several side branches to break up the bubbles",
        "Withdraw the wire into the guide so that the RCA can be flushed freely with contrast medium",
        "Inflate a balloon in the proximal RCA to stop any further air from reaching the bed",
        "Exchange the workhorse for a polymer-jacketed wire that can push the air distally",
      ],
      answer: 0,
      explanation:
        "Brilakis: push a workhorse wire down to the distal vessel and on into several side branches, because the moving wire tip breaks up residual air in the small branches; add 100% oxygen, aspiration through the guide or an aspiration catheter for a large volume, and intracoronary adrenaline if arrest develops. Withdrawing the wire throws away the tool; a proximal balloon adds ischaemia.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-flow-embolism-q8",
      stem: "During an LAD PCI with a distal filter, flow stops after the stent is deployed. Dissection is excluded. What is the best next step?",
      options: [
        "Post-dilate the stent at high pressure to push the debris back into the vessel wall",
        "Aspirate through the guide, then retrieve the filter, which may be full of debris",
        "Deploy a second filter beyond the first to capture what has escaped",
        "Leave the filter in place for an hour and repeat the angiogram afterwards",
      ],
      answer: 1,
      explanation:
        "In Brilakis's example, flow ceased after stenting a lipid-rich LAD lesion with a filter in place and returned only when the filter, holding a fragment of yellow tissue, was retrieved. His filter steps for slow or no flow are aspiration through the guide followed by filter removal, with a new filter if more PCI is needed.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-flow-embolism-q9",
      stem: "Which statement about stroke during cardiac catheterisation is supported by Oxford?",
      options: [
        "Most strokes are haemorrhagic, so anticoagulants should always be reversed before any imaging",
        "Symptoms are always immediate, so a patient who leaves the lab well is safe",
        "Vertebrobasilar involvement is rare, so visual symptoms point to another cause",
        "The vertebrobasilar territory is affected in nearly half, and symptoms may appear hours later",
      ],
      answer: 3,
      explanation:
        "Oxford reports posterior (vertebrobasilar) involvement in nearly half of cases and late embolisation causing symptoms hours after the study; visual disturbance is among the commonest symptoms. The two usual mechanisms are embolism of aortic atheroma and of thrombus, and the bleeding-or-embolism question is answered by CT, not assumed.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "cm-flow-embolism-q10",
      stem: "A patient with an LVEF of 25% develops breathlessness and crackles during PCI. BP 138/84 mmHg, saturation 89% on air. Which set of measures fits Oxford's management?",
      options: [
        "High-flow oxygen, sit up, IV loop diuretic, IV nitrate, consider CPAP and IABP",
        "Lie the patient flat, give a fluid challenge and start a dobutamine infusion",
        "IV adrenaline and steroids for a presumed contrast reaction, then continue",
        "Stop oxygen to avoid hyperoxia, give morphine and carry on with the procedure as planned",
      ],
      answer: 0,
      explanation:
        "Oxford treats lab pulmonary oedema with high-flow oxygen, sitting up, an IV loop diuretic (for example furosemide 80–100 mg), IV nitrate if the systolic pressure is above 100 mmHg (isosorbide dinitrate 2–10 mg/hour), CPAP and consideration of an IABP, then admission. A fluid challenge worsens it; a contrast reaction is a possible cause but not the default. The IABP is a consideration, not a routine step: trial evidence in oedema without shock is lacking, and routine IABP is not recommended in infarct-related shock (IABP-SHOCK II; 2023 ESC ACS guideline).",
      difficulty: 1,
      refs: [...OXFORD, "iabp-shock-ii-2012", "esc-acs-2023"],
    },
    {
      id: "cm-flow-embolism-q11",
      stem: "The books disagree about cholesterol embolisation. Which statement represents the disagreement correctly?",
      options: [
        "Brilakis advises surgery for distal ischaemia; Oxford says surgery is never needed",
        "Oxford advises anticoagulation as first-line treatment; Brilakis says anticoagulation is harmful",
        "Brilakis says statins may help the acute kidney injury; Oxford calls statins controversial",
        "Oxford says pulses are absent; Brilakis says pulses are characteristically preserved",
      ],
      answer: 2,
      explanation:
        "Brilakis: there is no specific treatment and prevention matters most, though statins may help the kidney injury. Oxford: management is supportive, and anticoagulants, statins and steroids are all controversial. Oxford says surgery is rarely (not never) needed for distal ischaemia; neither book describes absent pulses as typical, and Brilakis's triad includes intact pulses.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-flow-embolism-q12",
      stem: "A 7 Fr guide will not aspirate at the root. A small withdrawal fails and fluoroscopy shows no kink. Why does Brilakis then aspirate the sheath after removing the guide under suction?",
      options: [
        "The sheath valve is the usual entry point for the air that has blocked the catheter lumen",
        "A plugged guide is often clot formed in the sheath and picked up by the catheter",
        "Aspirating the sheath measures the ACT more accurately than a venous sample",
        "Sheath aspiration confirms that the femoral artery has not been dissected",
      ],
      answer: 1,
      explanation:
        "Brilakis: when a catheter is clogged, it is often by thrombus that formed inside the sheath and was scooped up as the catheter was advanced, so the sheath is aspirated next. Thrombus in the sheath can also embolise to the coronary or the leg. The other reasons are not in his algorithm.",
      difficulty: 3,
      refs: BRILAKIS,
    },
  ],
  sims: [
    { sim: "procedure", task: "Run the sheath and guide routine that prevents embolism: aspirate and discard, flush with a second syringe, aspirate at the root before connecting, exchange over a wire, and check the patient's neurology before they leave the table." },
    { sim: "haemo", task: "Measure the LVEDP and wedge pressure, and decide whether a ventriculogram is safe and how much contrast and fluid the patient can take." },
    { sim: "cathlab", task: "Before every injection confirm free aspiration, an undamped trace and a bubble-free syringe with its distal end tilted up (Oxford's advice; this module reads the distal end as the plunger end, so that bubbles rise away from the outlet); if a bubble is seen, store the loop and stop injecting until the source is found." },
  ],
  caseIds: ["cm-flow-embolism-case-noreflow", "cm-flow-embolism-case-air-stroke"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cm-flow-embolism-case-noreflow",
    title: "Flow fails after stenting a thrombotic LAD",
    trackId: "complication-management",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 25.2 (acute vessel closure, embolisation), 9.8, 10.1, 3.2, 3.5, 5.5 and 19.9; Oxford Handbook ch 8 (the 'no-reflow' phenomenon, vasodilators in no-reflow, aspiration catheters).",
    },
    summary:
      "An NSTEMI with a bulky thrombotic proximal LAD lesion: preparing for no-reflow, recognising it after stenting, excluding a mechanical cause, delivering the right vasodilator distally, supporting the pressure and knowing when to stop.",
    presentation:
      "A 64-year-old man with 6 hours of intermittent chest pain, anterior T-wave inversion and a rising troponin. He is loaded with aspirin and ticagrelor. Right radial access with a 6 Fr guide. Angiography shows a 95% proximal LAD lesion with a hazy filling defect and TIMI 2 flow; the circumflex and RCA have mild disease.",
    findings: [
      "Bulky proximal LAD lesion with visible thrombus, TIMI 2 flow",
      "BP 128/76 mmHg, heart rate 78 bpm, sinus rhythm",
      "Unfractionated heparin given; ACT 290 s",
      "LVEF 50% on echo before the procedure",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Before wiring, how do you prepare for this lesion?",
        options: [
          {
            text: "Treat it as high risk for no-reflow: microcatheter and vasodilator on the table, consider thrombectomy for the thrombus and a GP IIb/IIIa inhibitor, and avoid aggressive dilatation",
            best: true,
            feedback:
              "Oxford asks you to anticipate no-reflow in bulky, thrombus-filled lesions, to consider thrombectomy where thrombus is present, and notes that GP IIb/IIIa pretreatment may reduce thromboembolism and vasodilator pretreatment may reduce microvascular spasm. Having the delivery catheter ready saves minutes later.",
          },
          {
            text: "Pre-dilate with a balloon matched to the vessel at high pressure to make room for the stent",
            feedback:
              "Brilakis lists initial balloon pre-dilatation of a STEMI culprit among the causes of plaque embolisation; a bulky thrombotic NSTEMI lesion carries the same kind of risk, and Oxford asks you to anticipate no-reflow in bulky, thrombus-filled lesions.",
            next: "s1-aggressive",
            stateDelta: { stability: -10, flags: ["aggressive-predilation"] },
          },
          {
            text: "Proceed as for a stable lesion; no-reflow cannot be predicted",
            feedback:
              "Both manuals describe the lesions that cause no-reflow; thrombus, primary PCI and bulky lesions head the list. Planning for it is the main defence because it is hard to reverse.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s1-aggressive",
        kind: "consequence",
        prompt: "After a 3.5 mm balloon at 16 atm, the distal LAD fills slowly and a diagonal branch is cut off. What now?",
        info: "TIMI 2 flow; new chest pain; ST elevation in V2–V4. No dissection is seen in two views.",
        options: [
          {
            text: "Stop balloon work, give a vasodilator distally and treat the thrombus before deciding on a stent",
            best: true,
            feedback:
              "This is embolisation. Brilakis: anticoagulation plus an IV antiplatelet agent, thrombectomy for large thrombus, vasodilators; stenting over plaque emboli can make things worse.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent immediately to trap the debris",
            feedback: "Stenting in the face of embolised plaque can release more material and deepen no-reflow (Brilakis).",
            stateDelta: { stability: -10, flags: ["stented-into-emboli"] },
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "After aspiration and direct stenting with a 3.5 × 23 mm stent, contrast reaches the mid LAD and hangs there. The patient has chest pain and ST elevation in V1–V4. BP 98/62 mmHg, heart rate 92 bpm. What is your first step?",
        info: "TIMI 1 flow beyond the stent; no myocardial blush in the anterior territory.",
        options: [
          {
            text: "Keep the wire in place, look at both stent edges and the distal vessel in two views for dissection or thrombus, and check the ACT",
            best: true,
            feedback:
              "Brilakis: maintain wire position first, then decide whether this is a dissection (stent it) or embolisation (do not). Check the ACT, because inadequate anticoagulation is one cause of thrombosis. The thrombus itself is looked for on the angiogram (a new filling defect) or with IVUS or OCT.",
            next: "s3",
          },
          {
            text: "Place a second stent distal to the first to cover any distal problem",
            feedback: "Without a dissection, more metal worsens no-reflow (Brilakis 10.1).",
            next: "c-more-metal",
            stateDelta: { stability: -15, flags: ["more-metal"] },
          },
          {
            text: "Perform three full injections over two minutes to see whether the flow changes",
            feedback: "Oxford warns that repeated injections into a no-reflow vessel worsen the ischaemia.",
            next: "c-contrast",
            stateDelta: { stability: -10, flags: ["repeat-contrast"] },
          },
          {
            text: "Pull the wire back to the guide so the vessel can be imaged without it",
            feedback: "Brilakis: losing wire position can be catastrophic if the cause turns out to be a dissection. Keep it.",
            next: "c-wire-lost",
            stateDelta: { stability: -20, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "c-more-metal",
        kind: "consequence",
        prompt: "After the second stent, flow is TIMI 0 and the patient is hypotensive at 82/50 mmHg. What now?",
        options: [
          {
            text: "Stop all device work; microcatheter to the distal LAD, vasodilator there, and support the pressure",
            best: true,
            feedback: "The problem is in the microcirculation. Deliver the drug where it is needed and support the circulation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Post-dilate both stents at high pressure",
            feedback: "More dilatation sends more debris downstream.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-contrast",
        kind: "consequence",
        prompt: "The ST elevation is higher and the patient is more distressed. What is the lesson, and what now?",
        options: [
          {
            text: "Stop injecting; go to the distal bed with a microcatheter and give the vasodilator there",
            best: true,
            feedback: "Each injection adds ischaemia without treating anything; Oxford expects time and a vasodilator to bring the flow back in many patients.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject once more with a larger volume to be sure of the grade",
            feedback: "The grade is clear; more contrast only adds ischaemia.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-wire-lost",
        kind: "consequence",
        prompt: "The wire is out. The distal LAD barely fills. What now?",
        options: [
          {
            text: "Rewire gently with a workhorse wire, confirm a distal true-lumen position, then resume the no-reflow treatment",
            best: true,
            feedback: "You need a wire to deliver a microcatheter and to treat any dissection. Rewire carefully before anything else.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give the vasodilator through the guide and finish the case",
            feedback: "Oxford: with antegrade flow absent, the drug goes through an over-the-wire balloon or probing catheter near the distal bed. (The module's reasoning, not Oxford's wording: given into the guide, it is likely to reflux into the aorta.)",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "There is no dissection, no new filling defect and the ACT is 295 s. How will you give the treatment?",
        options: [
          {
            text: "Advance a microcatheter over the wire to the distal LAD and inject the vasodilator through it",
            best: true,
            feedback:
              "Oxford delivers established no-reflow treatment through an over-the-wire balloon or probing catheter close to the distal bed; Brilakis uses a microcatheter or dual-lumen catheter.",
          },
          {
            text: "Inject the vasodilator into the guide",
            feedback: "That is the preventive route. Oxford gives established no-reflow treatment through an over-the-wire balloon or probing catheter near the distal bed, because forward flow is absent; a drug given into the guide is likely to reflux into the aorta (the module's reasoning).",
            next: "c-guide",
            stateDelta: { stability: -10 },
          },
          {
            text: "Start IV glyceryl trinitrate",
            feedback: "Nitrates have not been shown to help in no-reflow (Oxford) and will drop the pressure.",
            next: "c-guide",
            stateDelta: { stability: -10, flags: ["nitrate-given"] },
          },
        ],
      },
      {
        id: "c-guide",
        kind: "consequence",
        prompt: "Nothing has changed except that the BP is now 86/54 mmHg. What now?",
        options: [
          {
            text: "Go distal with a microcatheter and choose a vasodilator that spares the pressure",
            best: true,
            feedback: "Distal delivery, and Brilakis's preference for nicardipine because it lowers the pressure least.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Repeat the same dose into the guide",
            feedback: "The route is the problem; repeating it changes nothing.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The microcatheter tip is in the distal LAD. BP 94/60 mmHg, heart rate 90 bpm. Which agent?",
        options: [
          {
            text: "Nicardipine through the microcatheter, repeated if the response is partial",
            best: true,
            feedback: "Brilakis's preferred agent for no-reflow, chosen because it lowers the blood pressure less than nitroprusside or verapamil.",
          },
          {
            text: "Adenosine boluses through the microcatheter",
            acceptable: true,
            feedback: "A recognised agent in both books (Oxford 30–50 µg, repeatable); in an LAD with a normal rate it is reasonable. Watch for heart block and avoid it in asthma.",
          },
          {
            text: "Intracoronary adrenaline through the microcatheter",
            acceptable: true,
            feedback:
              "Brilakis keeps adrenaline for refractory no-reflow, but trials since the manuals (COAR; a 2026 network meta-analysis) found that it improves final TIMI 3 flow, so it is a recognised first agent. COAR enrolled normotensive patients, so its use first in borderline hypotension rests on practice rather than trial data. No agent has been shown to change outcome.",
          },
          {
            text: "Nitroprusside 100 µg",
            acceptable: true,
            feedback: "Effective, but it lowers the pressure more than nicardipine, which matters at 94/60.",
            stateDelta: { stability: -3 },
          },
          {
            text: "Glyceryl trinitrate 200 µg",
            feedback: "A large-vessel dilator that has not been shown to help in no-reflow (Oxford).",
            stateDelta: { stability: -8, flags: ["nitrate-given"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Flow improves to TIMI 2 but the systolic pressure falls to 78 mmHg and stays there despite a pressor. What next?",
        variants: [{ flag: "more-metal", info: "Two stents now cover the proximal and mid LAD." }],
        options: [
          {
            text: "Keep the pressor running, call the shock team to choose haemodynamic support, and give the GP IIb/IIIa inhibitor for the thrombus component",
            best: true,
            feedback:
              "This is cardiogenic shock. Brilakis adds haemodynamic support for shock and an IV antiplatelet agent for thrombus or plaque embolism. Oxford's no-reflow page suggests an IABP when hypotension persists, but its own primary PCI section says routine IABP is not recommended in infarct-related shock, as do IABP-SHOCK II and the 2023 ESC ACS guideline, so the shock team chooses the device. Since 2023, DanGer Shock found lower mortality with a microaxial flow pump in selected STEMI-related shock, with more complications.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Insert an IABP to raise the coronary perfusion pressure, and give the GP IIb/IIIa inhibitor",
            acceptable: true,
            feedback:
              "Oxford's no-reflow page considers an IABP to raise perfusion pressure when hypotension persists, but its own primary PCI section does not recommend routine IABP in infarct-related shock; IABP-SHOCK II found no 30-day mortality benefit (39.7% vs 41.3%) and the 2023 ESC ACS guideline agrees. The shock team should choose the support.",
          },
          {
            text: "Give a large bolus of verapamil to finish opening the microcirculation",
            feedback: "Verapamil lowers the pressure further and can cause heart block (Oxford).",
            next: "c-verapamil",
            stateDelta: { stability: -15 },
          },
          {
            text: "Accept the pressure and close; it will recover on the ward",
            feedback: "Persistent hypotension in a large anterior territory needs support now.",
            stateDelta: { stability: -15, flags: ["no-support"] },
          },
        ],
      },
      {
        id: "c-verapamil",
        kind: "consequence",
        prompt: "The heart rate falls to 40 bpm with AV block and the BP to 65/40 mmHg. What now?",
        options: [
          {
            text: "Atropine or pacing, a pressor, and mechanical support; no more verapamil",
            best: true,
            feedback: "Support the rhythm and pressure; Oxford's warning about heart block with verapamil has just been illustrated.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give adenosine to keep the microcirculation open",
            feedback: "Adenosine also blocks the AV node; it would deepen the block.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "With haemodynamic support running, flow stays at TIMI 2 after two further vasodilator doses. What does Brilakis add for refractory no-reflow?",
        options: [
          {
            text: "Intracoronary adrenaline through the microcatheter",
            best: true,
            feedback: "Brilakis gives intracoronary adrenaline (epinephrine) for no-reflow that does not respond to vasodilators.",
          },
          {
            text: "A covered stent to stop further embolisation",
            feedback: "Brilakis notes that covered stents restenose and thrombose often, and there is no lesion to treat.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Intracoronary glyceryl trinitrate at a higher dose",
            feedback: "Nitrates have not been shown to help in no-reflow (Oxford).",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "Flow is now TIMI 3 and the ST segments are settling. The stent looks well expanded. A colleague suggests a final high-pressure post-dilatation 'for good measure'. How do you finish?",
        options: [
          {
            text: "Decline: the stent is well expanded and needs nothing more; remove the equipment, continue antiplatelet therapy and monitor",
            best: true,
            feedback:
              "Oxford notes that no-reflow is more common after post-dilatation; with a well-expanded stent there is nothing to gain from another high-pressure inflation, only the risk of a recurrence.",
          },
          {
            text: "Post-dilate the stent at high pressure now that flow is back",
            feedback: "High-pressure post-dilatation is one of the triggers of no-reflow (Oxford: more common after post-dilatation).",
            next: "c-recur",
            stateDelta: { stability: -15, flags: ["recurrence"] },
          },
        ],
      },
      {
        id: "c-recur",
        kind: "consequence",
        prompt: "Flow falls back to TIMI 1. What now?",
        options: [
          {
            text: "Repeat the distal vasodilator and adrenaline, hold contrast, and stop when flow recovers",
            best: true,
            feedback: "The same sequence again, and this time no more balloon work.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Place a longer stent over the first",
            feedback: "Without a dissection, more metal deepens no-reflow.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "Flow recovered to TIMI 3. The haemodynamic support was removed the next day, the troponin peaked and fell, and the anterior wall was mildly hypokinetic on echo with an ejection fraction of 45%.",
    outcomeVariants: [
      { flag: "more-metal", text: "The extra stent added to the embolic load; the anterior infarct was larger than it needed to be." },
      { flag: "wire-lost", text: "Losing the wire cost time while the territory was ischaemic." },
      { flag: "nitrate-given", text: "The nitrate lowered the pressure without helping the microcirculation." },
      { flag: "no-support", text: "Closing with persistent hypotension led to cardiogenic shock on the ward and a return to the lab for support." },
      { flag: "recurrence", text: "Post-dilating after recovery brought the no-reflow back." },
      { flag: "aggressive-predilation", text: "Aggressive pre-dilatation started the embolisation before the stent was placed." },
      { flag: "stented-into-emboli", text: "Stenting over the embolised debris made the no-reflow worse." },
      { flag: "repeat-contrast", text: "The repeated injections deepened the ischaemia." },
    ],
    learningPoints: [
      "Plan for no-reflow in thrombotic, bulky lesions: thrombectomy where indicated, GP IIb/IIIa inhibitor and vasodilator pretreatment, a microcatheter ready, gentle dilatation.",
      "When flow fails, keep the wire, then decide dissection (stent) or embolisation (no stent); check the ACT.",
      "Deliver vasodilators distally; nicardipine spares the pressure; nitrates do not help; beware block with verapamil and adenosine.",
      "Hold the contrast; support persistent hypotension (routine IABP is not recommended in infarct-related shock: Oxford's primary PCI section, IABP-SHOCK II, ESC 2023; the shock team chooses the support); add intracoronary adrenaline for refractory no-reflow.",
      "No balloon or stent until TIMI 3 has returned, and then only if the result needs it.",
    ],
    refs: [...BOOKS, "iabp-shock-ii-2012", "esc-acs-2023", "khan-coar-2022", "oliveri-noreflow-nma-2026", "danger-shock-2024"],
  },
  {
    id: "cm-flow-embolism-case-air-stroke",
    title: "Air in the right coronary, then a deficit in recovery",
    trackId: "complication-management",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 25.2 (air embolisation), 5.4, 5.5, 8.9 and 9.7; Oxford Handbook ch 10 (air embolism, stroke), ch 6 (storing the unexpected).",
    },
    summary:
      "A trapping exchange during RCA PCI leads to coronary air embolism with bradycardia and hypotension; after recovery from that, the patient develops a stroke on the ward. Both are run step by step.",
    presentation:
      "A 74-year-old woman with hypertension, diabetes and known aortic atheroma on CT is having PCI to a long mid-RCA lesion through a 7 Fr femoral guide. A microcatheter has just been removed over the wire using a trapping balloon. The pressure trace is damped.",
    findings: [
      "Dominant RCA; the wire is in the distal posterolateral branch",
      "BP 132/70 mmHg, heart rate 70 bpm before the exchange",
      "ACT 310 s on heparin",
      "Damped trace after trapping",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The scrub nurse is about to inject to check the wire position. What do you say?",
        options: [
          {
            text: "Stop: back-bleed the Y-connector and aspirate until clean blood with no air returns, then check the trace",
            best: true,
            feedback:
              "Brilakis: air is often drawn into the guide during trapping, and injecting without back-bleeding makes coronary air embolism likely. A damped trace after trapping can itself be air.",
          },
          {
            text: "Go ahead, but inject gently",
            feedback: "Gentle injection still delivers the air into the RCA.",
            next: "c-first-air",
            stateDelta: { stability: -10, flags: ["avoidable-air"] },
          },
        ],
      },
      {
        id: "c-first-air",
        kind: "consequence",
        prompt: "A few small bubbles run into the distal posterolateral branch. She has brief chest discomfort; the ST segments do not change. What now?",
        options: [
          {
            text: "100% oxygen, analgesia if the discomfort persists, store the run, back-bleed and aspirate the guide, and watch the ECG",
            best: true,
            feedback: "Oxford: 100% oxygen speeds reabsorption, analgesia treats ischaemic pain, and suction on the catheter may free the bubble; only a patient with no symptoms usually needs nothing more. Clear the guide before anything else goes in.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject again to see whether the bubbles have cleared",
            feedback: "The guide may still hold air; clear it before any injection.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "Later in the case, after a 4.0 mm balloon is withdrawn through the valve, the next injection shows a large bubble in the mid RCA. The heart rate falls to 38 bpm, the BP to 64/36 mmHg, and the inferior leads show ST elevation. What first?",
        info: "Flow beyond the mid RCA has stopped. The wire is still in the distal vessel.",
        variants: [{ flag: "avoidable-air", info: "This is the second air event of the case." }],
        options: [
          {
            text: "Stop injecting, 100% oxygen by non-rebreather, call for help, atropine and a vasopressor with pacing ready, and store the run",
            best: true,
            feedback:
              "Oxygen helps the air to be absorbed (Brilakis); Brilakis warns that haemodynamic deterioration can be very rapid and Oxford advises seeking expert help, so call early. Atropine or pacing for the bradycardia and a vasopressor for the pressure are general resuscitation support while the air clears (Academy comp-dissection-flow; Khan 1995 lists supportive measures). Oxford asks for the loop to be stored before screening again.",
          },
          {
            text: "Inject again forcefully with contrast to push the air through",
            feedback: "The manifold or guide may still contain air; nothing should be injected until the source is cleared.",
            next: "c-more-air",
            stateDelta: { stability: -15, flags: ["more-air"] },
          },
          {
            text: "Withdraw the wire so that the RCA can be flushed freely",
            feedback: "The wire is your tool for breaking up bubbles and for delivering an aspiration catheter. Keep it.",
            next: "c-more-air",
            stateDelta: { stability: -15, flags: ["wire-lost"] },
          },
        ],
      },
      {
        id: "c-more-air",
        kind: "consequence",
        prompt: "The patient is now in a slow junctional rhythm at 30 bpm with BP 50/25 mmHg. What now?",
        options: [
          {
            text: "Oxygen, atropine or pacing, aspirate the guide, rewire if needed and use the wire to break up the air",
            best: true,
            feedback: "Back to Brilakis's sequence, with support for the rhythm.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give thrombolysis for presumed thrombus",
            feedback: "This is air, not thrombus; lysis adds bleeding risk without benefit.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Oxygen is on, atropine and a vasopressor have been given and pacing is ready. What do you do to clear the RCA?",
        options: [
          {
            text: "Aspirate through the guide, then advance the wire into the distal branches; use an aspiration catheter if the bubble does not clear",
            best: true,
            feedback:
              "Brilakis: the moving wire tip breaks up residual air in the small branches; aspirate through the guide or, for a large volume, through an aspiration thrombectomy catheter. Flushing saline forcefully and repeatedly can also help (Brilakis 5.5).",
          },
          {
            text: "Give intracoronary glyceryl trinitrate and wait",
            feedback:
              "Brilakis does not give glyceryl trinitrate (nitroglycerin) to a hypotensive patient; at 64/36 mmHg it would deepen the collapse, and it does nothing to remove the air. Oxford keeps intracoronary nitrate for associated spasm, once the pressure allows.",
            stateDelta: { stability: -8 },
          },
          {
            text: "Tilt the table head-down to keep the air in the coronaries",
            feedback: "Brilakis calls Trendelenburg positioning controversial because it may increase cerebral oedema, and it does nothing to clear the RCA.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "As the aspiration catheter goes in, the monitor shows no output with a slow broad rhythm. CPR starts. What else does Brilakis add for air embolism with arrest?",
        options: [
          {
            text: "Intracoronary adrenaline (0.05 mg has been used) through the guide or catheter, alongside advanced life support",
            best: true,
            feedback: "Brilakis gives intracoronary adrenaline (epinephrine) if the patient arrests from air embolism; haemodynamic support if shock or arrest persists.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Intracoronary adenosine to open the microcirculation",
            feedback: "Adenosine slows AV conduction; in an arrest with a slow rhythm it can do harm.",
            next: "c-adenosine",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-adenosine",
        kind: "consequence",
        prompt: "There is now asystole. What now?",
        options: [
          {
            text: "Continue CPR, intracoronary adrenaline, pacing, and call for mechanical support",
            best: true,
            feedback: "Support the circulation while the air clears; this is the arrest pathway.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stop resuscitation; air arrests do not recover",
            feedback: "Brilakis warns that large air embolism can cause arrest or death, and treats arrest with intracoronary adrenaline and haemodynamic support; continue resuscitation while the air clears.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Output returns after two minutes; flow in the RCA is TIMI 3 and the ST segments settle. Before the next injection, what must happen?",
        options: [
          {
            text: "Find the source: check the manifold, every connection and the valve; back-bleed and aspirate the guide after every device; prepare large devices meticulously",
            best: true,
            feedback: "Air embolism is a preparation failure; Brilakis's prevention list is the checklist (25.2.3.3), with guide aspiration and flushing after each balloon comes out (9.7.2).",
          },
          {
            text: "Resume immediately; the event has passed",
            feedback: "Without finding the source, the next injection can repeat it.",
            next: "c-more-air",
            stateDelta: { stability: -15, flags: ["more-air"] },
          },
        ],
      },
      {
        id: "s6",
        prompt:
          "The stent is placed and the patient goes to recovery. Two hours later the nurse reports that she is confused, cannot find her words and has a weak right arm. BP 156/84 mmHg. What do you do?",
        info: "She received heparin in the lab; the femoral sheath has been removed with a closure device.",
        options: [
          {
            text: "Check ABC, examine and document the deficit with its time, review the antithrombotic drugs given, and arrange emergency CT with vascular imaging and the stroke team",
            best: true,
            feedback:
              "Oxford's sequence: ABC, full examination recorded in the notes, the bleeding-or-embolism question, CT to exclude haemorrhage; Brilakis adds an emergency neurology assessment because urgent neurointervention may help.",
          },
          {
            text: "Observe for an hour, since many events after catheterisation resolve within 24 hours",
            feedback: "Many do resolve (Oxford), but waiting costs the treatments that depend on time.",
            next: "c-delay",
            stateDelta: { stability: -15, flags: ["stroke-delay"] },
          },
          {
            text: "Start IV heparin for presumed embolism",
            feedback: "Antithrombotic drugs before a scan can worsen a haemorrhage; the first question is bleed or clot.",
            next: "c-delay",
            stateDelta: { stability: -15, flags: ["heparin-before-ct"] },
          },
        ],
      },
      {
        id: "c-delay",
        kind: "consequence",
        prompt: "An hour later the weakness is worse. What now?",
        options: [
          {
            text: "Emergency CT with vascular imaging and the stroke team, now",
            best: true,
            feedback: "The same steps, later than they should have been.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Continue to observe",
            feedback: "A worsening deficit is an emergency.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "CT shows no haemorrhage, and CT angiography shows an occluded proximal middle cerebral artery branch. What happens next?",
        options: [
          {
            text: "The stroke team decides on mechanical thrombectomy; the cardiology team gives the full drug history and the time of onset, and reviews the P2Y12 choice",
            best: true,
            feedback:
              "Brilakis: urgent neurointervention may help many of these patients. The stroke team selects treatment by the 2026 AHA/ASA guideline, which revised eligibility for thrombolysis and thrombectomy; vascular imaging for thrombectomy selection dates from the 2019 update it replaced. Prasugrel is contraindicated after a stroke (Brilakis).",
          },
          {
            text: "Give full-dose IV thrombolysis yourself, since haemorrhage has been excluded",
            feedback: "The decision belongs to the stroke team, who will weigh the heparin given in the lab (Oxford asks about anticoagulation status first) against the current thrombolysis contraindications.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Switch her to prasugrel for stronger protection of the new stent",
            feedback: "Brilakis: prasugrel is contraindicated in patients with a previous stroke or TIA.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The air cleared with oxygen, aspiration, the wire and intracoronary adrenaline, and the RCA was stented. In recovery a left-hemisphere embolic stroke was treated by mechanical thrombectomy; the deficit improved over the following days, and she continued aspirin with clopidogrel.",
    outcomeVariants: [
      { flag: "avoidable-air", text: "The first air embolism came from injecting after trapping without back-bleeding, and was avoidable." },
      { flag: "more-air", text: "A second injection before the source was found added more air and deepened the collapse." },
      { flag: "wire-lost", text: "Withdrawing the wire cost the tool that breaks up the air and delayed recovery." },
      { flag: "stroke-delay", text: "Observing a new deficit delayed imaging and thrombectomy." },
      { flag: "heparin-before-ct", text: "Heparin was started before a scan had excluded haemorrhage." },
    ],
    learningPoints: [
      "Back-bleed after trapping and after every device; a damped trace after an exchange can be air.",
      "Air: stop injecting, 100% oxygen, store the run, support the rhythm and pressure, keep the wire and use it to break up bubbles, aspirate through the guide or an aspiration catheter.",
      "Air with arrest: intracoronary adrenaline and full support; find the source before the next injection.",
      "A deficit hours later is still a stroke until proven otherwise: ABC, examine and time it, bleed or clot, CT with vascular imaging, stroke team.",
      "After a stroke, prasugrel is contraindicated.",
    ],
    refs: [...BOOKS, "powers-acute-stroke-2019", "prabhakaran-ais-2026", "khan-air-embolism-1995"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-noreflow-dissection-or-embolism",
    lab: "pci",
    when: { phase: ["complication", "stent", "optimise"], event: ["no-reflow", "slow-flow", "acute-closure"] },
    title: "Flow has failed: dissection or embolism?",
    text: "Keep the wire where it is. Look at both stent edges and the distal vessel in two views and check the ACT: a dissection needs a stent, whereas embolised debris may be made worse by one and needs aspiration and vasodilators.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-noreflow",
    sources: [B("25.2"), B("10.1"), O("ch 8: The 'no-reflow' phenomenon")],
    refs: BOOKS,
  },
  {
    id: "pci-noreflow-hold-contrast",
    lab: "pci",
    when: { phase: ["complication"], event: ["no-reflow", "slow-flow"] },
    title: "Hold the contrast",
    text: "Each extra injection into a no-reflow vessel adds ischaemia. Once the grade is clear, treat and wait: a vasodilator and time often bring the flow back.",
    tone: "caution",
    lessonId: "cm-flow-embolism-noreflow",
    sources: [O("ch 8: The 'no-reflow' phenomenon")],
    refs: OXFORD,
  },
  {
    id: "pci-noreflow-pick-agent",
    lab: "pci",
    when: { phase: ["complication"], event: ["no-reflow"] },
    title: "Choose the vasodilator for the rhythm and the pressure",
    text: "Nicardipine lowers the pressure least (Brilakis's choice). Verapamil can cause heart block; adenosine blocks the AV node, most often in the RCA but not only there, so give it slowly and avoid it in asthma. Nitrates have not been shown to help no-reflow. For refractory no-reflow (for example, after two distal vasodilator doses have failed), Brilakis adds intracoronary adrenaline, which trials published since the manuals show improves flow.",
    tone: "do",
    lessonId: "cm-flow-embolism-noreflow",
    sources: [B("3.2"), B("19.9"), O("ch 8: The 'no-reflow' phenomenon")],
    refs: [...BOOKS, "khan-coar-2022", "oliveri-noreflow-nma-2026"],
  },
  {
    id: "pci-noreflow-low-pressure-support",
    lab: "pci",
    when: { phase: ["complication"], event: ["no-reflow", "slow-flow"], requires: ["hypotension"] },
    title: "No-reflow with persistent hypotension: support the perfusion pressure",
    text: "If the pressure stays low, support the coronary perfusion pressure. Oxford's no-reflow page suggests an intra-aortic balloon pump for this, but its primary PCI section, IABP-SHOCK II and the 2023 ESC ACS guideline do not recommend routine IABP in infarct-related shock. Call the shock team to choose the support.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-noreflow",
    sources: [O("ch 8: The 'no-reflow' phenomenon"), O("ch 8: Primary PCI"), B("5.5"), B("14.1")],
    refs: [...BOOKS, "iabp-shock-ii-2012", "esc-acs-2023"],
  },
  {
    id: "pci-noreflow-anticipate",
    lab: "pci",
    when: { phase: ["plan", "lesion-prep"], event: ["thrombus"] },
    title: "Thrombus in the lesion: plan for no-reflow now",
    text: "Bulky thrombotic lesions, primary PCI, vein grafts and ectatic vessels are where no-reflow happens. Have a microcatheter and vasodilator ready, consider thrombectomy and a GP IIb/IIIa inhibitor, and avoid aggressive pre-dilatation.",
    tone: "do",
    lessonId: "cm-flow-embolism-noreflow",
    sources: [O("ch 8: The 'no-reflow' phenomenon"), B("25.2")],
    refs: BOOKS,
  },
  {
    id: "pci-embol-thrombus-three-steps",
    lab: "pci",
    when: { phase: ["complication"], event: ["thrombus"] },
    title: "Embolised thrombus: drugs, extraction, vasodilator",
    text: "Check the ACT and give anticoagulation plus a GP IIb/IIIa inhibitor or cangrelor, aspirate when a large thrombus can be seen, and give an intracoronary vasodilator. Support the circulation if shock follows.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-plaque-thrombus",
    sources: [B("5.5"), B("25.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-embol-plaque-aspirate",
    lab: "pci",
    when: { phase: ["complication"], event: ["no-reflow"] },
    title: "Plaque downstream: aspirate, do not stent over it",
    text: "Once a dissection has been excluded and embolised plaque is the likely cause (atherectomy, a lipid-rich lesion, a vein graft), do not stent over it: stenting over embolised plaque can release more and deepen no-reflow, and covered stents bring restenosis and thrombosis. Aspirate the debris, use laser if aspiration fails, and give vasodilators to help the rest through.",
    tone: "caution",
    lessonId: "cm-flow-embolism-plaque-thrombus",
    sources: [B("25.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-air-first-moves",
    lab: "pci",
    when: { event: ["air"] },
    title: "Air in the artery: oxygen, wire, aspirate",
    text: "Stop injecting and give 100% oxygen by non-rebreather mask. Keep the wire and steer it into the distal vessel and side branches to burst bubbles, and aspirate through the guide or an aspiration catheter if a large volume went in.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-air",
    sources: [B("25.2"), O("ch 10: Air embolism")],
    refs: BOOKS,
  },
  {
    id: "pci-air-collapse",
    lab: "pci",
    when: { event: ["air"], requires: ["hypotension"] },
    title: "Air with collapse: move fast",
    text: "After air embolism, haemodynamic deterioration can be very rapid (Brilakis): call for expert help (Oxford) and support the rhythm and pressure with atropine or pacing, a vasopressor and defibrillation as needed. Give intracoronary adrenaline if the patient arrests (0.05 mg has been used). In shock the shock team chooses the support: routine IABP is not recommended in infarct-related shock, Oxford's primary PCI section included.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-air",
    sources: [B("25.2"), B("5.5"), O("ch 10: Air embolism"), O("ch 8: Primary PCI")],
    refs: [...BOOKS, "iabp-shock-ii-2012", "esc-acs-2023", "khan-air-embolism-1995"],
  },
  {
    id: "pci-air-find-source",
    lab: "pci",
    when: { event: ["air"] },
    title: "Find the source before the next injection",
    text: "Check the manifold, every connection, the syringe and the valve; back-bleed and aspirate the guide until clean blood returns. Trapping, withdrawal of large balloons and forceful aspiration of a wedged guide all draw air in.",
    tone: "caution",
    lessonId: "cm-flow-embolism-air",
    sources: [B("25.2"), B("5.4"), B("8.9"), B("9.7")],
    refs: BRILAKIS,
  },
  {
    id: "diag-air-small-bubble",
    lab: "diagnostic",
    when: { phase: ["inject"], event: ["air"] },
    title: "A bubble on the run: oxygen, then watch",
    text: "Give high-flow 100% oxygen, store the loop, and watch the ECG and the patient. A small distal bubble in a patient without symptoms usually needs nothing more; chest pain calls for analgesia and aspiration on the catheter, and spasm for intracoronary nitrate if the pressure allows.",
    tone: "bailout",
    lessonId: "cm-flow-embolism-air",
    sources: [O("ch 10: Air embolism"), O("ch 6: Storing the unexpected")],
    refs: OXFORD,
  },
  {
    id: "diag-exchange-over-wire",
    lab: "diagnostic",
    when: { phase: ["exchange"] },
    title: "Exchange over a wire in a diseased aorta",
    text: "Changing catheters over a guidewire reduces disruption of aortic plaque, one of the two usual sources of stroke and the source of cholesterol emboli. Manipulate gently, prefer soft tips, and do not inject forcefully with the tip against the aortic or vessel wall.",
    tone: "do",
    lessonId: "cm-flow-embolism-stroke",
    sources: [O("ch 10: Stroke"), O("ch 10: Cholesterol embolization")],
    refs: OXFORD,
  },
  {
    id: "diag-finish-neuro-check",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Check the neurology before the patient leaves",
    text: "Ask the patient to talk and to move all four limbs before leaving the table, and tell the recovery team that a stroke can declare itself hours later. Any new deficit: ABC, examine and time it, then emergency CT and the stroke team.",
    tone: "do",
    lessonId: "cm-flow-embolism-stroke",
    sources: [B("2.1"), B("5.5"), O("ch 10: Stroke")],
    refs: BOOKS,
  },
  {
    id: "diag-lvedp-before-lv-gram",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"] },
    title: "Read the LVEDP before the ventriculogram",
    text: "Above 30 mmHg pulmonary oedema is likely: keep contrast to a minimum and avoid the ventriculogram. Oxford's ventriculography page sets its relative contraindication at 35 mmHg (or existing pulmonary oedema); work to the lower figure.",
    tone: "caution",
    lessonId: "cm-flow-embolism-oedema-cholesterol",
    sources: [O("ch 4: Left ventricular filling pressure"), O("ch 4: Left ventriculography")],
    refs: OXFORD,
  },
  {
    id: "haemo-wedge-oedema-risk",
    lab: "haemo",
    when: { phase: ["right-heart", "calculations"] },
    title: "High wedge and low mixed venous saturation: oedema risk",
    text: "A wedge pressure above 18 mmHg suggests LV failure. Above 25 mmHg with a mixed venous saturation under 50%, the patient is at high risk of pulmonary oedema and shock around PCI: plan contrast, fluid and support accordingly.",
    tone: "caution",
    lessonId: "cm-flow-embolism-oedema-cholesterol",
    sources: [B("14.1")],
    refs: BRILAKIS,
  },
  {
    id: "diag-oedema-on-table",
    lab: "diagnostic",
    when: { event: ["high-contrast-volume"] },
    title: "Large contrast load in a weak or stiff ventricle: watch for oedema",
    text: "LV impairment, a high LVEDP, severe aortic or mitral stenosis and dialysis make oedema likely after a large contrast load. If it starts, Oxford's regimen: high-flow oxygen, sit up, IV loop diuretic, IV nitrate if systolic is above 100 mmHg, CPAP, and consider an IABP if the circulation is compromised (routine IABP is not recommended in infarct-related shock).",
    tone: "caution",
    lessonId: "cm-flow-embolism-oedema-cholesterol",
    sources: [O("ch 10: Pulmonary oedema"), O("ch 9: Intra-aortic balloon pump"), O("ch 8: Primary PCI")],
    refs: [...OXFORD, "iabp-shock-ii-2012", "esc-acs-2023"],
  },
];

// ---------------------------------------------------------------------------
// New references (each checked on PubMed: authors, title, journal, year, volume, pages)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "fukumoto-ces-2003",
    kind: "paper",
    citation:
      "Fukumoto Y, Tsutsui H, Tsuchihashi M, Masumoto A, Takeshita A. The incidence and risk factors of cholesterol embolization syndrome, a complication of cardiac catheterization: a prospective study. J Am Coll Cardiol. 2003;42(2):211–216.",
    url: "https://doi.org/10.1016/s0735-1097(03)00579-5",
    note: "PMID: 12875753. Checked on PubMed: authors, title, journal, year, volume 42, issue 2, pages 211–216. Used for 1,786 patients, 25 (1.4%) with the syndrome, 48% cutaneous signs, 64% renal insufficiency, in-hospital mortality 16%, and no increase with the femoral approach (ascending aorta as a possible source).",
    verified: true,
  },
  {
    id: "grines-stent-pami-1999",
    kind: "trial",
    citation:
      "Grines CL, Cox DA, Stone GW, et al. Coronary angioplasty with or without stent implantation for acute myocardial infarction. Stent Primary Angioplasty in Myocardial Infarction Study Group. N Engl J Med. 1999;341(26):1949–1956.",
    url: "https://doi.org/10.1056/NEJM199912233412601",
    note: "PMID: 10607811. Checked on PubMed: authors, title, journal, year, volume 341, issue 26, pages 1949–1956. Used for the correction to Oxford's PAMI summary: the lower combined end point came entirely from fewer ischaemia-driven target-vessel revascularisations (7.7% vs 17.0%), and 6-month mortality was 4.2% with stenting vs 2.7% without (P=0.27).",
    verified: true,
  },
  {
    id: "brar-poseidon-2014",
    kind: "trial",
    citation:
      "Brar SS, Aharonian V, Mansukhani P, et al. Haemodynamic-guided fluid administration for the prevention of contrast-induced acute kidney injury: the POSEIDON randomised controlled trial. Lancet. 2014;383(9931):1814–1823.",
    url: "https://doi.org/10.1016/S0140-6736(14)60689-9",
    note: "PMID: 24856027. Checked on PubMed: authors, title, journal, year, volume 383, issue 9931, pages 1814–1823. Used for LVEDP-guided fluid reducing contrast-induced AKI (6.7% vs 16.3%) and hydration stopped early for shortness of breath in three patients in each group.",
    verified: true,
  },
  {
    id: "khan-air-embolism-1995",
    kind: "paper",
    citation:
      "Khan M, Schmidt DH, Bajwa T, Shalev Y. Coronary air embolism: incidence, severity, and suggested approaches to treatment. Cathet Cardiovasc Diagn. 1995;36(4):313–318.",
    url: "https://doi.org/10.1002/ccd.1810360406",
    note: "PMID: 8719380. Checked on PubMed: authors, title, journal, year, volume 36, issue 4, pages 313–318. Used for 3,715 procedures reviewed, total air emboli 0.27%, 0.84% during PTCA training versus 0.24% during angiography training, and none in the cines from the last 2 months of fellowship.",
    verified: true,
  },
  {
    id: "stone-amihot2-2009",
    kind: "trial",
    citation:
      "Stone GW, Martin JL, de Boer MJ, et al. Effect of supersaturated oxygen delivery on infarct size after percutaneous coronary intervention in acute myocardial infarction. Circ Cardiovasc Interv. 2009;2(5):366–375.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.108.840066",
    note: "PMID: 20031745. Checked on PubMed: authors, title, journal, year, volume 2, issue 5, pages 366–375. Used for AMIHOT II: 301 patients with anterior STEMI and PCI within 6 hours, randomised 222 to 79 (3:1), 90-minute intracoronary SSO2 infusion into the LAD territory; among 281 with SPECT, median infarct size 20% vs 26.5%; superiority from Bayesian pooling with AMIHOT I (pooled 18.5% vs 25%); 30-day MACE non-inferior.",
    verified: true,
  },
  {
    id: "khan-coar-2022",
    kind: "trial",
    citation:
      "Khan KA, Qamar N, Saghir T, et al. Comparison of intracoronary epinephrine and adenosine for no-reflow in normotensive patients with acute coronary syndrome (COAR trial). Circ Cardiovasc Interv. 2022;15(2):e011408.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.121.011408",
    note: "PMID: 35000456. Checked on PubMed: authors, title, journal, year, volume 15, issue 2, article e011408. Used for 201 normotensive ACS patients with no-reflow randomised to intracoronary epinephrine or adenosine; final TIMI 3 flow 90.1% vs 78%; no significant difference in final myocardial blush grade 3, mortality or MACE at 1 month.",
    verified: true,
  },
  {
    id: "oliveri-noreflow-nma-2026",
    kind: "paper",
    citation:
      "Oliveri F, Tua L, Raone L, et al. Intracoronary vasoactive therapy for no-reflow during primary PCI: a network meta-analysis of randomized trials. JACC Adv. 2026;5(3):102599.",
    url: "https://doi.org/10.1016/j.jacadv.2026.102599",
    note: "PMID: 41740240. Checked on PubMed: authors, title, journal, year, volume 5, issue 3, article 102599. Used for 13 randomised trials, 1,674 patients; adenosine, epinephrine, nitroprusside and verapamil compared; epinephrine and verapamil associated with higher odds of final TIMI 3 flow than control; no agent reduced MACE or mortality (underpowered). Nicardipine was not among the agents compared.",
    verified: true,
  },
  {
    id: "prabhakaran-ais-2026",
    kind: "guideline",
    citation:
      "Prabhakaran S, Gonzalez NR, Zachrison KS, et al. 2026 Guideline for the early management of patients with acute ischemic stroke: a guideline from the American Heart Association/American Stroke Association. Stroke. 2026;57(8):e316–e436.",
    url: "https://doi.org/10.1161/STR.0000000000000513",
    note: "PMID: 41582814 (correction: PMID 42507797, Stroke 2026;57(8):e461–e467). Checked on PubMed: authors, title, journal, year, volume 57, issue 8, pages e316–e436. Used only for what the abstract states: it replaces the 2018 guideline and the 2019 update, with new evidence on thrombolytic choice and eligibility and on eligibility for endovascular thrombectomy, and a modified approach to thrombolysis contraindications.",
    verified: true,
  },
];
