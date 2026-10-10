import type { CaseStudy } from "../schema";

// Case-based learning modules built from PUBLISHED, openly accessible case
// material. Each entry paraphrases the clinical facts in original wording and
// links the source. No images are reproduced. Nothing here is invented: if a
// fact is not in the source, it is not in the case.
//
// Source URLs: PCRonline and EuroIntervention Case Reports pages were read
// directly. Open-access journal case reports (Eur Heart J Case Rep, JACC Case
// Rep) were read in full through the Europe PMC full-text service; the URL
// recorded is that full-text endpoint and the DOI is given in the citation.
// Option feedback adds general teaching; where it goes beyond the source it is
// written as general guidance, not as a fact about the patient.
export const PUBLISHED_CASES: CaseStudy[] = [
  // ---------------------------------------------------------------------------
  // 1. STEMI, cardiogenic shock, Impella CP and VA-ECMO
  // ---------------------------------------------------------------------------
  {
    id: "pub-stemi-shock-impella-lv-perforation",
    title: "Resuscitated anterior STEMI on Impella CP: the pump that left the ventricle",
    trackId: "acute-mcs",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Hajji O, Abumayyaleh M, Schupp T, et al. Left ventricular perforation following Impella CP placement in a resuscitated STEMI patient with cardiogenic shock: a rare complication and case report. Eur Heart J Case Rep. 2026;10(2):ytag050. doi:10.1093/ehjcr/ytag050",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12908187/",
    },
    summary:
      "A 54-year-old man with an anterior STEMI and recurrent ventricular fibrillation had LAD PCI during mechanical CPR, then microaxial pump support for persistent shock. Refractory VF led to VA-ECMO, after which CT showed the pump had passed through the infarcted left ventricular free wall.",
    presentation:
      "A 54-year-old man with no relevant history was brought directly to the catheter laboratory about an hour after central chest pain began, with ST elevation in V2–V5. Paramedics had defibrillated him out of VF and he had woken up; he had received intravenous aspirin and unfractionated heparin. Soon after arrival VF returned and would not terminate.",
    findings: [
      "Angiography performed during mechanical CPR showed an occluded LAD; two drug-eluting stents were implanted and spontaneous circulation returned after 23 minutes of resuscitation.",
      "After ROSC he remained in cardiogenic shock with severely impaired LV function.",
      "An Impella CP was placed under fluoroscopy with a pigtail in the LV as an apical landmark; TOE was not available. No console alarms occurred in the first 30 minutes and the pump was never repositioned.",
      "The first bedside echo in intensive care showed no pericardial effusion and a correctly sited pump.",
      "Later, refractory VF needed prolonged CPR and VA-ECMO. CT then showed perforation of the LV free wall with a small effusion, and the console position trace had become flat and damped, losing its normal pulsatile shape.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "The LAD is open and circulation has returned after 23 minutes of CPR, but he remains in cardiogenic shock with severely impaired LV function. Which support do you choose?",
        info: "Intubated and ventilated after a prolonged arrest; anterior STEMI treated with two LAD stents; shock persists despite reperfusion.",
        options: [
          {
            text: "Insert a microaxial flow pump (Impella CP) in the laboratory",
            best: true,
            feedback:
              "This is what the team did. DanGer-SHOCK showed lower 180-day mortality with a microaxial pump in STEMI-related shock, with more bleeding, limb ischaemia and renal replacement therapy. The trial enrolled non-comatose patients, so a patient intubated after 23 minutes of CPR sits outside that evidence: the choice is a judgement, not a trial-proven certainty. In a fresh transmural infarct every wire and pump movement also carries a risk of perforation.",
            next: "s2",
          },
          {
            text: "Insert an intra-aortic balloon pump",
            feedback:
              "IABP-SHOCK II found no mortality benefit from routine IABP in infarct-related shock, and ESC 2023 advises against routine use. The haemodynamic support it gives is modest and unlikely to stabilise a severely failing LV.",
            next: "s2",
          },
          {
            text: "Start VA-ECMO now as the first device",
            acceptable: true,
            feedback:
              "ECLS-SHOCK showed no mortality benefit from routine early extracorporeal support in infarct-related shock, with more bleeding and vascular complications, and VA-ECMO increases LV afterload. Some centres would still choose it after a long arrest. Here it was kept for refractory arrest, which is how it was eventually used.",
            next: "s2",
          },
          {
            text: "Rely on inotropes and vasopressors, and reassess in intensive care",
            feedback:
              "Drugs alone suit milder shock. After a large anterior infarct and a long arrest, escalating catecholamines raise myocardial oxygen demand and arrhythmia risk without unloading the ventricle.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "In intensive care he develops VF that will not stop despite all standard measures. The earlier echo showed the pump in the right place and no effusion. What now?",
        options: [
          {
            text: "Establish VA-ECMO as a rescue while CPR continues",
            best: true,
            feedback:
              "The team instituted VA-ECMO as a last resort. Extracorporeal support maintains perfusion during refractory arrest while the cause is found. With an Impella already in place, the pump also helps unload the LV against the extra afterload that ECMO creates.",
            next: "s3",
          },
          {
            text: "Remove the Impella at once because it may be causing the VF",
            feedback:
              "Pump-related ventricular ectopy happens, so position should be checked with echo, but pulling the only LV support during refractory VF without an alternative removes circulatory support at the worst moment.",
            next: "s3",
          },
          {
            text: "More antiarrhythmics and continued CPR without escalation",
            feedback:
              "Antiarrhythmics and shocks had already failed. In a young patient with a reperfused culprit and no prior illness, extracorporeal support is a reasonable escalation where it is available.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Once ECMO is running, CT (part of local protocol after ECMO) shows the Impella has perforated the LV free wall, with only a small pericardial effusion. The console position trace is flat and damped. What is the safest plan?",
        options: [
          {
            text: "Pull the Impella out on the ICU and watch the effusion",
            feedback:
              "A pump crossing an infarcted free wall may be partly plugging the hole. Withdrawing it away from surgical help risks sudden haemorrhage into the pericardium. Removal belongs where repair and drainage are immediately available.",
            next: "s3-bedside-removal", stateDelta: {"stability": -25} },
          {
            text: "Transfer to cardiac surgery for controlled removal with pericardial drainage, keeping LV support",
            best: true,
            feedback:
              "This is what happened. At the surgical centre the pump was withdrawn without open-heart surgery, a drain was placed through an inferior pericardiotomy, and a surgically implanted Impella 5.5 continued LV support alongside ECMO.",
            next: "s4",
          },
          {
            text: "Pericardiocentesis and leave the pump where it is",
            feedback:
              "The pump is no longer in the LV cavity and is giving little useful flow. Draining the effusion deals with neither the malposition nor the defect.",
            next: "s4",
          },
          {
            text: "Pull the pump back into the LV cavity under fluoroscopy",
            feedback:
              "Manipulating a device that has exited through necrotic muscle risks enlarging the tear. In FDA MAUDE reports cited by the authors, about a quarter of Impella-related ventricular perforations followed repositioning.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "After transfer, the ECG still shows anterior ST elevation and the anterior wall is akinetic. What do you do?",
        options: [
          {
            text: "Repeat coronary angiography",
            best: true,
            feedback:
              "Stent thrombosis was suspected, and the LAD stent was found thrombosed and reopened. Persistent ST elevation with akinesia after primary PCI should prompt a re-look, particularly after cardiac arrest, when absorption of oral antiplatelet drugs can be unreliable.",
          },
          {
            text: "Put it down to a completed infarct and observe",
            feedback:
              "ST elevation can persist after a large infarct, but with fresh stents and dependence on mechanical support, stent thrombosis must be excluded first.", next: "s4-missed-occlusion", stateDelta: {"stability": -15} },
          {
            text: "Systemic thrombolysis",
            feedback:
              "Not appropriate with a freshly drained pericardium, large-bore cannulae and a ventricular perforation. Mechanical reperfusion is the route.",
          },
        ],
      },
      {
        "id": "s3-bedside-removal",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: as the pump is pulled out on the ICU, the drain-free pericardium fills rapidly; BP 50/30 mmHg on ECMO flow.",
        "prompt": "Uncontrolled removal has opened the free-wall defect. What now?",
        "options": [
          {
            "text": "Emergency pericardial drainage with autotransfusion and immediate surgical repair, keeping ECMO support",
            "best": true,
            "feedback": "A free-wall perforation needs surgical control; this is why removal is planned in theatre.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Increase ECMO flow and observe",
            "feedback": "Flow cannot compensate for ongoing haemorrhage into the pericardium.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Reinsert a microaxial pump to plug the hole",
            "feedback": "Blind reinsertion through infarcted myocardium risks a larger tear.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s4-missed-occlusion",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: two days later lactate rises again and the anterior wall remains akinetic with persistent ST elevation.",
        "prompt": "What should be checked?",
        "options": [
          {
            "text": "Repeat coronary angiography to exclude stent thrombosis or a failed LAD result",
            "best": true,
            "feedback": "Persistent ST elevation after PCI in a supported patient may mean the vessel has reoccluded.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Increase inotropes and wait",
            "feedback": "Ongoing ischaemia needs a mechanical answer.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Systemic thrombolysis",
            "feedback": "Thrombolysis on ECMO after surgery carries prohibitive bleeding risk.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "ECMO came out on day 4, he was extubated on day 5 and the Impella 5.5 was removed on day 6. LVEF was 41% at discharge. He wore a wearable defibrillator with no recorded arrhythmia; cardiac MRI at about 3 months showed LVEF 43% with extensive transmural LAD-territory scar and no thrombus, and a subcutaneous ICD was implanted for primary prevention. Follow-up angiography showed a patent stent.",
    learningPoints: [
      "Freshly infarcted myocardium is friable: pump placement, and especially repositioning, in a transmural infarct can perforate the free wall.",
      "A flat, damped position trace on the Impella console, a new effusion or unexplained deterioration should trigger immediate imaging of pump position.",
      "When a device has left the ventricle, remove it where surgical repair and pericardial drainage are immediately available.",
      "DanGer-SHOCK supports microaxial pumps in selected non-comatose STEMI shock; routine IABP and routine early VA-ECMO did not reduce mortality in IABP-SHOCK II and ECLS-SHOCK.",
      "Persistent ST elevation after primary PCI warrants a re-look for stent thrombosis.",
    ],
    refs: ["danger-shock-2024", "iabp-shock-ii-2012", "ecls-shock-2023", "esc-acs-2023"],
  },

  // ---------------------------------------------------------------------------
  // 2. Post-infarct VSR with cardiogenic shock: emergency transcatheter closure
  // ---------------------------------------------------------------------------
  {
    id: "pub-post-mi-vsr-transjugular-closure",
    title: "Late anterior STEMI, shock and a new murmur: emergency apical VSR closure",
    trackId: "acute-mcs",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Sharma A, Chaudhary G, Shukla A, Tripathi U, Chandra S. Transcatheter closure of an apical post-infarction ventricular septal rupture after delayed anterior myocardial infarction complicated by cardiogenic shock and ventricular tachycardia. EuroIntervention Case Reports. 2026;1(1). doi:10.4244/EIJCR-D-26-00028",
      url: "https://eijcasereports.pcronline.com/articles/transcatheter-closure-of-an-apical-post-infarction-ventricular-septal-rupture-after-delayed-anterior-myocardial-infarction-complicated-by-cardiogenic-shock-and-ventricular-tachycardia",
    },
    summary:
      "A 64-year-old man arrived 48 hours into an anterior STEMI in cardiogenic shock with recurrent VT and a loud pansystolic murmur. Echo showed a large apical ventricular septal rupture. Surgery was judged prohibitive, and the defect was closed percutaneously the same day through the right internal jugular vein, without mechanical support.",
    presentation:
      "Severe chest pain for 48 hours, then sudden breathlessness and syncope. BP 80/56 mmHg, HR 132/min, pulmonary oedema. Repeated unstable VT needed DC cardioversion, intravenous amiodarone and a brief period of CPR. Raised JVP, basal crackles, a third heart sound and a loud pansystolic murmur.",
    findings: [
      "ECG: sinus tachycardia with Q waves and persistent ST elevation in V1–V6 (late-presenting anterior STEMI).",
      "TTE: aneurysmal, akinetic anterior wall and distal septum; apical VSR about 10 × 12 mm with friable, internally dissected septum and several RV exit points; Qp/Qs 2.9.",
      "Severe MR, moderate TR, LVEF 40–45%.",
      "Bloods: high white count, raised CRP and procalcitonin, low platelets, creatinine 2.4 mg/dL, marked transaminase rise, lactate 2.7 mmol/L: evolving multiorgan dysfunction.",
      "VA-ECMO and Impella were unavailable; an IABP was kept on standby but not inserted.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "Shock and a new loud pansystolic murmur in a late-presenting anterior STEMI. What is the most useful immediate investigation?",
        options: [
          {
            text: "Urgent bedside echocardiography",
            best: true,
            feedback:
              "A new murmur with shock after MI is a mechanical complication until proved otherwise: septal rupture, papillary muscle rupture or contained free-wall rupture. Echo answers the question in minutes; here it showed a large apical VSR with Qp/Qs 2.9.",
            next: "s2",
          },
          {
            text: "Go straight to angiography to open the LAD",
            feedback:
              "Two days into an anterior STEMI the infarct is largely completed and the immediate threat is mechanical. Angiography will be needed, but after a diagnosis that changes the whole plan.",
            next: "s2",
          },
          {
            text: "Right heart catheter to look for an oxygen saturation step-up",
            acceptable: true,
            feedback:
              "A step-up from RA to PA confirms and quantifies a left-to-right shunt, but echo is quicker and shows the anatomy you need for planning.",
            next: "s2",
          },
          {
            text: "CT pulmonary angiography",
            feedback:
              "Shock with hypoxia can come from pulmonary embolism, but the murmur and the ECG point elsewhere, and moving an unstable patient to CT delays the key diagnosis.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "Echo confirms a large apical VSR. While definitive treatment is planned, how do you support the circulation?",
        info: "BP 80/56 mmHg at presentation; pulmonary oedema; renal and hepatic dysfunction.",
        options: [
          {
            text: "Vasopressors, non-invasive ventilation and loop diuretics; avoid vasodilators while he is hypotensive",
            best: true,
            feedback:
              "This is what the team did. Afterload reduction lowers shunt fraction in theory, but with a systolic pressure near 80 mmHg vasodilators risk collapse. Most guidance also recommends mechanical support as a bridge where available, usually an IABP. Here the IABP was kept on standby and not used, partly on cost grounds, and ECMO or Impella were unavailable: a defensible local decision rather than a general recommendation.",
            next: "s3",
          },
          {
            text: "Sodium nitroprusside infusion to cut afterload and reduce the shunt",
            feedback:
              "Helpful only when blood pressure allows. At 80/56 mmHg it risks cardiovascular collapse.",
            next: "s2-nitroprusside-collapse", stateDelta: {"stability": -20} },
          {
            text: "VA-ECMO without any LV unloading",
            acceptable: true,
            feedback:
              "ECMO can bridge to repair, but it raises LV afterload and can increase left-to-right shunting unless the LV is vented. It was not available here.",
            next: "s3",
          },
          {
            text: "Large fluid boluses",
            feedback: "He already has pulmonary oedema, and volume will not correct a mechanical shunt.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Surgery is judged prohibitive. Shock, VT and organ dysfunction are worsening despite medical therapy. When and how should the defect be closed?",
        options: [
          {
            text: "Stabilise and defer repair for 2–6 weeks while the infarct margins fibrose",
            acceptable: true,
            feedback:
              "This is the preferred approach when a patient can be stabilised, because healed margins hold sutures or devices far better. With refractory shock, VT and progressive organ failure, he was unlikely to survive the wait.",
            next: "s4",
          },
          {
            text: "Emergency transcatheter closure today",
            best: true,
            feedback:
              "The heart team chose same-day salvage closure. Early closure carries higher procedural risk, but comparisons are biased: the sickest patients often die before a delayed repair can happen.",
            next: "s4",
          },
          {
            text: "Medical therapy alone",
            feedback: "Untreated post-infarct VSR with shock carries a very high mortality.",
            next: "s3-medical-only", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s4",
        prompt: "How will you reach and cross an apical VSR in an unstable patient?",
        info: "Access: 7 Fr right femoral artery and 7 Fr right internal jugular vein. LV angiography in steep LAO cranial shows an aneurysmal apical cavity with a defect up to 12 mm.",
        options: [
          {
            text: "From the jugular vein: cross from RV to LV with a hydrophilic wire on a JR catheter, park an extra-stiff wire in the descending aorta, then advance the delivery sheath over it",
            best: true,
            feedback:
              "This is what was done. The jugular route gives a fairly direct line to the apex, and a stiff wire parked in the descending aorta forms a stable rail without building an arteriovenous loop, which shortens the procedure in a crashing patient. A 10 Fr sheath was then passed across the defect into the LV.",
            next: "s5",
          },
          {
            text: "Conventional arteriovenous loop: cross from the LV, snare the wire on the venous side and externalise it",
            acceptable: true,
            feedback:
              "The standard, well-described method with excellent support, but it takes longer and adds manipulation in an unstable patient.",
            next: "s5",
          },
          {
            text: "Deliver the device retrogradely from the arterial side",
            feedback:
              "Needs a large arterial sheath across the aortic valve and makes disc alignment at the apex awkward; venous delivery is the usual choice.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt:
          "The defect measures 10–12 mm on echo and angiography; the tissue is friable with intraseptal dissection. Which device size?",
        options: [
          {
            text: "Match the device to 12 mm, as for a congenital muscular VSD",
            feedback:
              "Necrotic, dissected margins grip poorly. A device sized to the measured defect is likely to embolise or leave a large residual shunt.", next: "s5-undersized", stateDelta: {"stability": -15} },
          {
            text: "Oversize to roughly 1.5–2 times the largest measured diameter",
            best: true,
            feedback:
              "A 20 mm septal occluder was used for a 10–12 mm defect; the LV disc was opened first, then the RV disc. The apical position kept the discs away from the atrioventricular valves and conduction tissue.",
          },
          {
            text: "Use the largest device available",
            feedback:
              "Excessive oversizing risks interference with valves, erosion and poor disc conformation.",
          },
        ],
      },
      {
        "id": "s2-nitroprusside-collapse",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: ten minutes into the nitroprusside infusion, BP is 62/38 mmHg and he becomes confused.",
        "prompt": "Afterload reduction has dropped his pressure. What now?",
        "options": [
          {
            "text": "Stop the nitroprusside, restore pressure with a vasopressor and move to definitive closure planning",
            "best": true,
            "feedback": "Vasodilators are avoided in hypotensive VSR; they worsen systemic perfusion.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Give a large fluid bolus",
            "feedback": "Volume increases the shunt and pulmonary oedema.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Continue at a lower dose",
            "feedback": "Any vasodilator is harmful while he is hypotensive.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s3-medical-only",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: overnight he develops recurrent VT and anuria; lactate 8 mmol/L.",
        "prompt": "Medical therapy alone is failing. What now?",
        "options": [
          {
            "text": "Proceed to emergency transcatheter closure (or surgery if reconsidered) as a rescue",
            "best": true,
            "feedback": "Untreated post-infarct VSR in shock has a very high mortality; closure is the only route to survival.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Continue medical therapy",
            "feedback": "Organ failure is progressing; waiting is futile.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Palliative care only, without discussion",
            "feedback": "Palliation may be right, but only after an informed discussion with the patient or family.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s5-undersized",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the 12 mm device pulls through the friable defect on tug testing and a large residual shunt remains.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Recapture and choose a device about 1.5–2 times the largest measured diameter",
            "best": true,
            "feedback": "Post-infarct defects are friable and enlarge; oversizing is needed for stability.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Release it anyway",
            "feedback": "An unstable device will embolise.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Add a second small device beside it",
            "feedback": "Two small devices in friable tissue are unstable.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "After release, shunting fell (Qp/Qs below 1.5), vasopressors were weaned, and nitroglycerine and a low-dose ACE inhibitor were started. VT did not recur. He went home 4 days after the procedure. At 6 months he was well, with LVEF about 50%, mild-to-moderate MR, a small residual shunt and no haemolysis. Perfusion imaging showed non-viable LAD territory and RCA-territory ischaemia; the RCA was stented and the occluded LAD left alone. An ICD was recommended but deferred for financial reasons.",
    learningPoints: [
      "A new pansystolic murmur with shock after MI demands immediate echocardiography for a mechanical complication.",
      "The usual strategy for post-infarct VSR is to stabilise, support and repair once the margins have fibrosed; salvage closure is for patients who cannot be stabilised.",
      "Avoid vasodilators in hypotensive shock even though afterload reduction lowers the shunt in theory.",
      "Size post-infarct VSR devices generously (about 1.5–2 times the defect) because necrotic margins hold poorly; expect some residual shunt.",
      "At the apex, a jugular approach with an aortic rail can avoid building an arteriovenous loop.",
      "Mechanical support as a bridge is advised where available; this case comes from a resource-limited setting.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Left main bifurcation, rotational atherectomy, LM perforation, delayed tamponade (EuroPCR)
  // ---------------------------------------------------------------------------
  {
    id: "pub-lm-rota-minicrush-perforation",
    title: "Calcified left main, rotablation and mini-crush: a perforation you must localise",
    trackId: "complications",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Moncalvo C. Case study: an iatrogenic perforation of the left main during PCI. Presented in the EuroPCR 2018 session 'How to manage coronary perforation? Part 2'. PCRonline, Complications: coronary perforation, type III; 2019.",
      url: "https://www.pcronline.com/Cases-resources-images/Complications/How-to-treat-emergency-coronary-perforation/Type-III/Case-study-an-iatrogenic-perforation-of-the-left-main-during-PCI",
    },
    summary:
      "An 83-year-old man who declined surgery had rotational atherectomy and mini-crush stenting of a calcified distal left main bifurcation. After kissing balloon inflation an Ellis type III perforation caused cardiogenic shock; a covered stent in the left main sealed it. Two weeks later he needed pericardiocentesis for delayed tamponade.",
    presentation:
      "83-year-old man with hypertension and dyslipidaemia, ex-smoker. Coronary angiography in June 2017 for unstable angina. He declined surgical revascularisation.",
    findings: [
      "Calcified distal left main stenosis of about 60%.",
      "Heavily calcified LAD stenosis of about 80%.",
      "Ostial circumflex stenosis of 99%.",
      "Occluded right coronary artery.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "He declines CABG. How do you plan PCI of this calcified distal left main bifurcation with a critical ostial circumflex?",
        options: [
          {
            text: "Rotational atherectomy first, then a planned two-stent technique (here mini-crush) with final kissing",
            best: true,
            feedback:
              "This is what the operator did. Heavy calcium needs modifying before stents go in. With a critical ostial side-branch lesion an upfront two-stent strategy is reasonable: DKCRUSH-V favoured double-kissing crush over provisional stenting for true distal left main bifurcations, while EBC MAIN found stepwise provisional comparable to systematic dual stenting at one year. Use the technique you perform well, ideally with imaging.",
            next: "s2",
          },
          {
            text: "Provisional stenting from left main into LAD, adding a circumflex stent only if needed",
            acceptable: true,
            feedback:
              "The default for many left main bifurcations and supported by EBC MAIN, but a 99% ostial circumflex is very likely to need a second stent, so plan for it.",
            next: "s2",
          },
          {
            text: "Direct stenting without plaque modification",
            feedback:
              "In heavy calcium this risks underexpansion, stent loss and malapposition; an underexpanded left main stent is a major cause of later failure.",
            next: "s1-direct-stent", stateDelta: {"stability": -15} },
        ],
      },
      {
        id: "s2",
        prompt:
          "After left main stenting and kissing inflation, contrast jets out of the vessel and he becomes shocked. In the first view the jet seems to arise from the circumflex. What do you do next?",
        options: [
          {
            text: "Place a covered stent in the proximal circumflex based on this view",
            feedback:
              "If the leak is elsewhere you have wasted time and left it open. Covered stents also close side branches, so you must be sure of the site first.",
            next: "s2-wrong-site-stent", stateDelta: {"stability": -20} },
          {
            text: "Take another projection to pin down exactly where the leak starts",
            best: true,
            feedback:
              "A second projection showed the perforation was in the left main itself. The presenter's key message: even in shock, precise localisation decides the treatment. In practice, a balloon inflated across the site buys time while you image; the source does not say whether one was used.",
            next: "s3",
          },
          {
            text: "Give protamine and wait for the leak to stop",
            feedback:
              "Ellis type III leaks rarely seal with reversal alone, and reversing heparin with fresh stents in a left main bifurcation risks thrombosis before the leak is controlled.",
            next: "s3",
          },
          {
            text: "Pericardiocentesis first, then look at the angiogram again",
            acceptable: true,
            feedback:
              "Drain if there is tamponade, but drainage does not stop the source; the leak still needs sealing quickly.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "The perforation is in the left main and he is in cardiogenic shock. Definitive treatment?",
        options: [
          {
            text: "Covered stent in the left main",
            best: true,
            feedback:
              "A 3.5 × 16 mm stent graft at 18 atm sealed it and haemodynamics recovered quickly; no pericardiocentesis was needed at that point.",
            next: "s4",
          },
          {
            text: "Prolonged balloon inflation alone",
            acceptable: true,
            feedback:
              "The first step for stabilisation, and small leaks sometimes seal, but a type III left main perforation with shock usually needs a covered stent or surgery.",
            next: "s4",
          },
          {
            text: "Coil embolisation",
            feedback: "Coils occlude the vessel; never an option in the left main.",
            next: "s4",
          },
          {
            text: "Emergency surgery",
            acceptable: true,
            feedback:
              "The bailout if percutaneous sealing fails, but this 83-year-old had declined surgery and a covered stent can be deployed within minutes.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "After the procedure a small, non-significant effusion is seen and he goes home on DAPT. At a planned echo about two weeks later the effusion has grown, with early signs of tamponade. What do you do?",
        options: [
          {
            text: "Stop DAPT and watch",
            feedback:
              "A fresh covered stent is prone to thrombosis, so stopping antiplatelets is dangerous, and early tamponade will not resolve by itself.", next: "s4-watched-tamponade", stateDelta: {"stability": -15} },
          {
            text: "Pericardiocentesis, with angiography in the same session to check the stent graft",
            best: true,
            feedback:
              "This is what was done. The angiogram showed the stent graft result unchanged. The drain came out after 3 days with no residual effusion on echo, and he was discharged on the fourth day.",
          },
          {
            text: "Surgical pericardial window as the first step",
            feedback:
              "Reserved for recurrent or loculated effusions; percutaneous drainage comes first.",
          },
        ],
      },
      {
        "id": "s2-wrong-site-stent",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: after a covered stent in the proximal circumflex, contrast still jets into the pericardium and BP falls to 70/40 mmHg.",
        "prompt": "The leak continues. Why, and what now?",
        "options": [
          {
            "text": "The perforation is elsewhere (here the left main); tamponade with a balloon, image in another projection and seal the true site",
            "best": true,
            "feedback": "A covered stent in the wrong place seals nothing and may jail a branch; localise first.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Add a second covered stent in the circumflex",
            "feedback": "More metal in the wrong place does not stop the leak.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give protamine and wait",
            "feedback": "An Ellis III perforation will not seal with reversal alone.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s4-watched-tamponade",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: three days after stopping DAPT, he returns breathless and hypotensive with a larger effusion.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Pericardiocentesis, check the stent graft angiographically, and restart antiplatelet therapy as soon as safe",
            "best": true,
            "feedback": "Stopping DAPT soon after left main stenting risks thrombosis without treating the effusion.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Keep DAPT stopped and observe",
            "feedback": "Tamponade needs drainage, and the stents need protection.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Surgical window as first step",
            "acceptable": true,
            "feedback": "An option if drainage fails, but needle drainage is first-line.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s1-direct-stent",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the stent will not cross the calcified left main and the circumflex ostium remains critical.",
        "prompt": "What should have come first?",
        "options": [
          {
            "text": "Plaque modification (here rotational atherectomy) before stenting, then the planned two-stent technique",
            "best": true,
            "feedback": "Severe calcium must be modified to allow delivery and expansion.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Push the stent harder with a buddy wire",
            "feedback": "Forcing stents through unprepared calcium risks loss and underexpansion.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "High-pressure balloon above rated burst",
            "feedback": "Rupture risks perforation in the left main.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
    ],
    outcome:
      "The covered stent sealed the left main perforation and he recovered haemodynamically without drainage. He developed delayed tamponade at about two weeks, treated by pericardiocentesis; same-session angiography showed the stent graft result unchanged. The drain was removed after 3 days with no residual effusion and he was discharged on the fourth day.",
    learningPoints: [
      "Plan calcified left main bifurcation PCI around plaque modification and a clear bifurcation strategy, with covered stents and a pericardiocentesis kit in the room.",
      "When a perforation appears, confirm exactly where it starts in more than one projection before choosing treatment.",
      "Left main perforations cannot be coiled; a covered stent or surgery are the definitive options.",
      "Delayed tamponade can appear days to weeks after a sealed perforation, so arrange follow-up echocardiography.",
    ],
    refs: ["dkcrush5-2017", "ebc-main-2021", "ellis-1994"],
  },

  // ---------------------------------------------------------------------------
  // 4. Staged left main bifurcation PCI after STEMI, stent loss and retrieval
  // ---------------------------------------------------------------------------
  {
    id: "pub-lm-bifurcation-stent-loss-guide-extension",
    title: "Staged left main bifurcation PCI after inferior STEMI: retrieving a lost stent",
    trackId: "pci-complex",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Righetti S, Tresoldi S, Calchera I, et al. Innovative guide extension catheter trapping technique to retrieve a lost stent from a coronary artery. JACC Case Rep. 2022;4(7):411–414. doi:10.1016/j.jaccas.2022.02.005",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9175196/",
    },
    summary:
      "A 79-year-old man had primary PCI to the RCA for inferior STEMI, then staged IVUS-guided PCI of a distal left main bifurcation. A stent meant for a circumflex edge dissection was stripped off its balloon and left floating in the left main; it was retrieved by trapping it inside a guide extension.",
    presentation:
      "Three hours of persistent chest discomfort. BP 135/85 mmHg, HR 55/min, SpO2 99%, no congestion. Dyslipidaemic ex-smoker. ECG: inferior STEMI. Echo: LVEF 50% with inferior hypokinesia.",
    findings: [
      "Subtotal mid-RCA stenosis (culprit).",
      "80% ostial LAD and 80% proximal circumflex stenoses; 50% distal left main stenosis.",
      "Loaded with intravenous aspirin and ticagrelor before the procedure.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How do you deal with the multivessel disease at the primary PCI?",
        options: [
          {
            text: "Treat the RCA culprit now and plan the left main bifurcation with the heart team",
            best: true,
            feedback:
              "The RCA was stented directly and he became pain-free. ESC 2023 recommends complete revascularisation in STEMI with multivessel disease, either at the index procedure or within 45 days, and COMPLETE supported staged non-culprit PCI. Complex non-culprit left main work in a stable patient is better planned than improvised.",
            next: "s2",
          },
          {
            text: "Treat the RCA and the left main bifurcation in the same sitting",
            feedback:
              "Possible in selected stable patients, but a two-stent left main procedure during STEMI adds contrast, time and thrombotic risk with no urgency.",
            next: "s1-same-sitting-lm", stateDelta: {"stability": -15} },
          {
            text: "RCA only, then medical therapy for the left main bifurcation",
            feedback:
              "Leaves significant left main bifurcation disease without heart-team review or a revascularisation plan.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "Three days later the heart team recommends PCI (age 79, recent STEMI, SYNTAX score 22). Ostial LAD and circumflex are both 80%, distal left main 50%. Which bifurcation strategy?",
        options: [
          {
            text: "Planned two-stent technique under IVUS: stent the ostial circumflex first, then left main into LAD over it, with post-dilation of each branch and the left main",
            best: true,
            feedback:
              "This is what was done (6 Fr EBU 3.5; predilation of both branches; 2.0 mm stent at the ostial circumflex; overlapping 3.0 and 3.5 mm stents from proximal LAD to ostial left main; NC post-dilation in the LAD, 4.5 mm in the left main and in the circumflex after rewiring). For true distal left main bifurcations, double-kissing crush has the strongest randomised support (DKCRUSH-V), and EBC MAIN found stepwise provisional comparable; choose the technique that fits the anatomy and your experience.",
            next: "s3",
          },
          {
            text: "Stepwise provisional: left main into LAD, with a bailout circumflex stent only if needed",
            acceptable: true,
            feedback:
              "A strong option supported by EBC MAIN, although with an 80% ostial circumflex many operators would expect to need the second stent.",
            next: "s3",
          },
          {
            text: "Angiography guidance alone",
            feedback:
              "Intravascular imaging improves outcomes in complex PCI including left main stenting (RENOVATE-COMPLEX-PCI); IVUS was used here.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "The final run shows a type B dissection at the distal edge of the circumflex stent. What now?",
        options: [
          {
            text: "Cover it with another stent",
            best: true,
            feedback:
              "A 2.0 × 26 mm stent was advanced to cover it. Edge dissections that limit flow, or that are long or deep on imaging, are generally treated.",
            next: "s4",
          },
          {
            text: "Leave it if imaging shows it is short, shallow and not flow-limiting",
            acceptable: true,
            feedback:
              "Minor edge dissections can safely be left when imaging confirms they are limited; larger ones at a fresh stent edge can propagate.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "As the new stent reaches the ostial circumflex it catches on the existing struts, is stripped from its balloon and ends up floating in the left main, its proximal end inside the guide. The wire is still through it. The patient is stable. What do you do?",
        options: [
          {
            text: "Deploy the lost stent where it lies",
            feedback:
              "It is a 2.0 mm stent in a left main post-dilated to 4.5 mm: deploying it would leave grossly malapposed metal and a nidus for thrombosis. In-situ deployment only makes sense when the stent matches the vessel.",
            next: "s4-deployed-floating", stateDelta: {"stability": -20} },
          {
            text: "Keep the wire, advance a guide extension up to the stent, pass a small balloon into it, then inflate a non-compliant balloon inside the stent to lock it in the guide extension and withdraw them together",
            best: true,
            feedback:
              "This is the team's technique: a 6 Fr guide extension just behind the stent, a 1.0 × 8 mm balloon pushed through for support and predilation, then a 2.0 mm NC balloon inflated within the stent inside the extension, and the whole assembly pulled out. Wire and guide position were preserved for treating the dissection.",
            next: "s5",
          },
          {
            text: "Small-balloon technique: pass a balloon of 1.5 mm or less beyond the stent, inflate at low pressure and pull the stent back into the guide",
            acceptable: true,
            feedback:
              "The usual first move when the wire is through the stent. The risk is that the stent catches on the guide tip and is stripped again, so coaxial guide alignment matters.",
            next: "s5",
          },
          {
            text: "Snare it",
            acceptable: true,
            feedback:
              "Loop snares work, but usually mean losing wire position and sometimes the guide, which matters when there is still a dissection to treat.",
            next: "s5",
          },
          {
            text: "Crush it against the left main wall with another stent",
            feedback:
              "A last resort; in a left main bifurcation it adds a layer of metal across the carina and compromises branch access.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "The stent is out and the wire and guide are still in place. What next?",
        options: [
          {
            text: "Re-prepare the ostial circumflex, stent the dissection with a new stent, then a final POT in the left main",
            best: true,
            feedback:
              "This is what was done: 3.0 mm NC predilation at the ostial circumflex, a 2.0 × 18 mm stent over the dissection and a final 4.5 mm proximal optimisation in the left main, with an excellent result.",
          },
          {
            text: "Stop and leave the dissection",
            feedback: "The dissection was the reason for the extra stent; leaving it risks abrupt closure.",
          },
          {
            text: "Advance a new stent straight away without further preparation",
            feedback:
              "The first stent failed by catching on struts at the ostium; repeating the same move without preparation or better alignment invites a second loss.", next: "s5-unprepared", stateDelta: {"stability": -10} },
        ],
      },
      {
        "id": "s1-same-sitting-lm",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: during the left main work, BP falls and contrast exceeds 300 mL in a 79-year-old with a fresh infarct.",
        "prompt": "What is the lesson and what now?",
        "options": [
          {
            "text": "Finish the safest part only, stop, and stage the rest after heart team review",
            "best": true,
            "feedback": "Complex left main PCI is staged after STEMI, not added to the primary procedure.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Push on to complete the bifurcation",
            "feedback": "More contrast and ischaemia in a fresh infarct add risk.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Insert an IABP and continue",
            "acceptable": true,
            "feedback": "Support may help pressure, but the strategic error is doing it all now.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s4-deployed-floating",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the stent is deployed where it floats and now lies partly in the aorta and partly across the left main bifurcation.",
        "prompt": "What problems does this create?",
        "options": [
          {
            "text": "A malpositioned stent that obstructs re-engagement and the bifurcation; image with IVUS and plan careful correction with the heart team",
            "best": true,
            "feedback": "Deploying a lost stent in place is a last resort; here retrieval was achievable.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "None; the stent is now secured",
            "feedback": "It may obstruct the circumflex and future access.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Crush it with another stent",
            "feedback": "Layers of crushed metal in the left main are hard to fix.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s5-unprepared",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the new stent catches on the same struts.",
        "prompt": "What must change?",
        "options": [
          {
            "text": "Re-prepare the ostium and open the struts with a balloon, use support, then deliver",
            "best": true,
            "feedback": "The cause of the first loss must be fixed before trying again.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Push harder",
            "feedback": "This repeats the stent loss.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Leave the dissection",
            "acceptable": true,
            "feedback": "A possibility if imaging shows a minor flap, but here it needed treatment.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
    ],
    outcome:
      "He remained stable and ischaemia-free throughout. He was discharged two days after the PCI without angina and was well at one month.",
    learningPoints: [
      "In STEMI with multivessel disease, treat the culprit and stage complex non-culprit left main PCI after heart-team review.",
      "Stents can be stripped when they catch on existing struts at an ostium; good preparation and coaxial guide alignment reduce the risk.",
      "After stent loss, first ask whether the wire is still through the stent: that determines your retrieval options.",
      "Never deploy a lost stent that is much smaller than the vessel it sits in.",
      "Retrieval methods that keep wire and guide position let you finish the job once the stent is out.",
    ],
    refs: ["esc-acs-2023", "complete-2019", "dkcrush5-2017", "ebc-main-2021", "renovate-2023"],
  },

  // ---------------------------------------------------------------------------
  // 5. Calcified LAD: wire entrapment, ELCA, dual perforation (EuroIntervention Case Reports)
  // ---------------------------------------------------------------------------
  {
    id: "pub-calcified-lad-wire-entrapment-elca",
    title: "Calcified LAD subocclusion: an uncrossable lesion, a trapped wire and two perforations",
    trackId: "pci-complex",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Basile M, Santana B, Zubiaur J, et al. Bailout excimer laser coronary atherectomy for guidewire entrapment in a severely calcified left anterior descending artery complicated by dual perforation. EuroIntervention Case Reports. 2026;1(1). doi:10.4244/EIJCR-D-26-00020. Accompanying editorial: Paradies V, Mancini G. Complication cascades in calcified PCI: why preparation determines outcome. EuroIntervention Case Reports. 2026;1(1). doi:10.4244/EIJCR-E-26-00001",
      url: "https://eijcasereports.pcronline.com/articles/bailout-excimer-laser-coronary-atherectomy-for-guidewire-entrapment-in-a-severely-calcified-left-anterior-descending-artery-complicated-by-dual-perforation",
    },
    summary:
      "A second attempt at a heavily calcified mid-LAD subocclusion in a 73-year-old with metastatic cancer escalated from an uncrossable lesion to a distal wire perforation, wire entrapment, laser-assisted release and a second Ellis type III perforation, managed with covered stents and coils. The accompanying editorial argues that better upfront preparation would have widened the margin.",
    presentation:
      "73-year-old man with metastatic pancreatic adenocarcinoma on active treatment and angina on minimal effort. An earlier PCI attempt at another centre had failed because the LAD lesion could not be wired.",
    findings: [
      "Diffuse severe coronary calcification with a chronic subocclusion of the mid LAD.",
      "Severely calcified circumflex lesion; moderate RCA disease.",
      "Second attempt: right radial access with a 6 Fr EBU 3.5 guide.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Before trying again, what is the most important step?",
        options: [
          {
            text: "Revisit the indication with the heart team; if PCI is still favoured, plan for the calcium: CT mapping, a guide that allows every escalation, an upfront atherectomy strategy and bailout kit ready",
            best: true,
            feedback:
              "The editorial makes exactly these points. Limited life expectancy, minimal symptoms and a failed first attempt deserve an explicit risk-benefit discussion, and if you proceed you should plan for the calcium rather than discover it. The published team went ahead with a 6 Fr system and small-balloon predilation.",
            next: "s2",
          },
          {
            text: "Repeat the same approach: 6 Fr guide, wire escalation and small balloons",
            feedback:
              "This is what happened. The editorial suggests it narrowed the options: in heavy calcium, small-balloon predilation tends to create dissections at the junction of calcified and normal wall that make further devices harder to deliver.",
            next: "s2",
          },
          {
            text: "Optimise antianginal therapy and do not attempt PCI",
            acceptable: true,
            feedback:
              "Entirely reasonable given minimal symptoms and prognosis, and a legitimate outcome of the heart-team discussion.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "A Gladius EX14 crosses with Caravel support; after 1.0 and 1.5 mm balloons it is exchanged for a SION blue ES. Now nothing crosses: not OCT, not small balloons, even with a guide extension. A distal LAD perforation appears, and a microcatheter for coils will not advance. You suspect the wire is trapped in the calcified segment. What do you do?",
        options: [
          {
            text: "Pull firmly on the wire until it comes free",
            feedback:
              "Uncontrolled traction can unravel, stretch or fracture the wire and push its tip forward into the distal vessel; the authors thought traction may have contributed to the distal perforation.",
            next: "s2-wire-fracture", stateDelta: {"stability": -20, "flags": ["retained-wire"]} },
          {
            text: "Work through controlled manoeuvres: rotation and gentle withdrawal, a microcatheter, balloon or guide extension over the wire, and a parallel wire",
            best: true,
            feedback:
              "All of these were tried without success. They remain the correct first sequence for an entrapped wire.",
            next: "s3",
          },
          {
            text: "Rotational atherectomy over the trapped wire",
            feedback:
              "Not possible: rotablation runs on its own dedicated wire, and exchanging to it needs a microcatheter across the lesion.",
            next: "s3",
          },
          {
            text: "Send for surgery now",
            acceptable: true,
            feedback:
              "Surgery is the final option for an entrapped wire, but percutaneous options have not yet been exhausted.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "A second wire lies in parallel, but no balloon or microcatheter will cross on either wire. What could still free the trapped wire percutaneously?",
        options: [
          {
            text: "Intravascular lithotripsy",
            feedback: "IVL needs a balloon across the lesion, and nothing will cross.",
            next: "s4",
          },
          {
            text: "Excimer laser over the parallel wire with saline flush, with covered stents and coils open and ready",
            best: true,
            feedback:
              "Excimer laser runs over an ordinary 0.014-inch wire and ablates from its tip without needing to cross first. A 0.9 mm catheter at 40 mJ/mm2 and 40 Hz (five runs, 1,000 pulses) freed the wire. Laser in an already injured, calcified vessel can perforate, so the bailout kit must be ready.",
            next: "s4",
          },
          {
            text: "Orbital atherectomy",
            feedback: "Like rotablation, it needs its own dedicated wire placed across the lesion.",
            next: "s3-orbital-trapped", stateDelta: {"stability": -15} },
          {
            text: "Surgery",
            acceptable: true,
            feedback: "Still a valid route if laser is unavailable.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "The wire comes free, but the next run shows an Ellis type III perforation in the mid LAD, and the distal perforation is still leaking. He is haemodynamically stable. What do you do?",
        options: [
          {
            text: "Seal the mid-LAD perforation with covered stents, then coil the distal perforation through a microcatheter",
            best: true,
            feedback:
              "Two overlapping 2.5 × 20 mm covered stents were placed, with a proximal drug-eluting stent overlapping them, then two coils were delivered distally. Both leaks sealed.",
          },
          {
            text: "Give protamine first, then seal",
            acceptable: true,
            feedback:
              "Reversal is often used once the leak is controlled or the hardware is out; with wires and new stents in the vessel it risks thrombosis. The team did not give protamine.",
          },
          {
            text: "Coil the mid LAD at the perforation",
            feedback: "That would sacrifice the LAD; coils are for distal or small-branch perforations.",
          },
          {
            text: "Immediate pericardiocentesis",
            feedback: "Only if tamponade develops; there was no significant effusion here.", next: "s4-tap-first", stateDelta: {"stability": -10} },
        ],
      },
      {
        "id": "s2-wire-fracture",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the wire snaps and a 6 cm fragment remains in the LAD and left main, its proximal end in the aorta.",
        "prompt": "The wire has fractured. What now?",
        "options": [
          {
            "text": "Try to snare or twist out the fragment with additional wires; if it cannot be retrieved, discuss trapping it with a stent or surgery",
            "best": true,
            "feedback": "Retained fragments in the left main and aorta cause thrombosis and embolism and must be dealt with.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Leave it and finish",
            "feedback": "A fragment protruding into the aorta is a thrombotic hazard.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Pull the remaining end harder",
            "feedback": "Further force fractures it again or injures the vessel.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s3-orbital-trapped",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the orbital crown will not advance over the trapped wire and risks cutting it.",
        "prompt": "What is the problem?",
        "options": [
          {
            "text": "Atherectomy over a trapped wire risks fracture and perforation; use a technique that works over the parallel wire, such as laser, with bailout kit open",
            "best": true,
            "feedback": "Devices that run on the trapped wire cannot cross and endanger it.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Increase the crown speed",
            "feedback": "Higher speed on a trapped wire risks fracture.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Switch to lithotripsy",
            "feedback": "The lithotripsy balloon cannot cross either.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-tap-first",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: pericardiocentesis drains 150 mL, but the mid-LAD jet and the distal leak continue.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Seal the mid-LAD with covered stents and coil the distal perforation, keeping the drain",
            "best": true,
            "feedback": "Drainage treats tamponade but not the source; both perforations need sealing.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Keep draining and wait",
            "feedback": "Active Ellis III bleeding will not stop by itself.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give protamine with the equipment in place",
            "feedback": "Reversal before sealing risks thrombosis of the equipment and vessel.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He stayed haemodynamically stable with no significant pericardial effusion, went home on day 4 and was free of angina at 6 months while continuing cancer treatment. The editorial pointed out that no intravascular imaging was performed after stenting, which matters because covered stents tend to underexpand.",
    outcomeVariants: [
      {
        "flag": "retained-wire",
        "text": "Forceful traction fractured the wire, adding a retained fragment to an already complex case."
      }
    ],
    learningPoints: [
      "In heavily calcified lesions, aim the first plaque modification at getting an imaging catheter across; small balloons alone can make the lesion harder to cross.",
      "Uncrossability, distal wire perforation and wire entrapment often arise together from the same substrate: recognise the cascade early and change strategy.",
      "Avoid forceful traction on an entrapped wire; use over-the-wire support and parallel wires first.",
      "Excimer laser can work over an existing wire without crossing first, but can perforate an injured calcified vessel: covered stents, coils and drainage kit must be ready.",
      "Match the sealing tool to the site: covered stents for large-vessel leaks, coils or fat for distal ones.",
      "Patient selection is part of complex PCI: limited life expectancy and minimal symptoms call for an explicit heart-team decision.",
    ],
    refs: ["ellis-1994"],
  },

  // ---------------------------------------------------------------------------
  // 6. IVL, Ellis III perforation, covered stents, side-branch fenestration (EuroIntervention Case Reports)
  // ---------------------------------------------------------------------------
  {
    id: "pub-ivl-perforation-covered-stent-fenestration",
    title: "Calcified LAD after lithotripsy: perforation, two covered stents and a diagonal to rescue",
    trackId: "complications",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Premawardhana D, Abdelmaaboud M, Ali M, Hailan A. Fenestration and TAP stenting to restore side branch flow after covered stent implantation for coronary perforation. EuroIntervention Case Reports. 2026;1(1). doi:10.4244/EIJCR-D-26-00034",
      url: "https://eijcasereports.pcronline.com/articles/fenestration-and-tap-stenting-to-restore-side-branch-flow-after-covered-stent-implantation-for-coronary-perforation",
    },
    summary:
      "In a 64-year-old woman with NSTEMI, PCI of a calcified LAD after lithotripsy led to loss of the diagonal and then a proximal LAD Ellis type III perforation. Two covered stents sealed the leak but closed the diagonal; flow was restored by fenestrating the covered stent and TAP stenting.",
    presentation:
      "64-year-old woman with type 1 diabetes and asthma presenting with NSTEMI (peak high-sensitivity troponin 286 ng/L). LV function preserved on echo.",
    findings: [
      "6 Fr right radial access.",
      "Severe calcified disease from proximal to mid LAD, with acute occlusion of the first diagonal.",
      "Circumflex and RCA unobstructed.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "The diagonal was wired and treated with a 2.5 × 20 mm drug-coated balloon. The LAD was prepared with a 2.5 mm NC balloon, a scoring balloon and a 3.0 mm IVL catheter, then stented (3.0 × 28 mm distally, 3.5 × 28 mm proximally) with graded NC post-dilation up to 3.75 mm. Diagonal flow was lost; after rewiring and kissing balloons it partly returned. Now a proximal LAD Ellis type III perforation appears. First action?",
        options: [
          {
            text: "Inflate a balloon at the perforation immediately and keep it inflated",
            best: true,
            feedback:
              "A 3.75 mm NC balloon was inflated for a prolonged period and she stayed stable while it was up. Balloon tamponade comes first: it buys time to call for help, get echo, prepare a covered stent and a second access if needed.",
            next: "s2",
          },
          {
            text: "Give protamine now",
            feedback:
              "Reversal alone does not stop a type III leak, and reversing heparin with fresh stents and wires in place risks thrombosis; seal first.",
            next: "s1-protamine-first", stateDelta: {"stability": -15} },
          {
            text: "Go straight for a covered stent without balloon tamponade",
            feedback:
              "Every minute without tamponade fills the pericardium. Inflate first, then bring the covered stent.",
            next: "s2",
          },
          {
            text: "Pericardiocentesis first",
            feedback: "Drain if tamponade develops, but stopping the source comes first.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "When the balloon is deflated the leak continues and she becomes haemodynamically unstable. What now?",
        options: [
          {
            text: "Covered stent at the perforation",
            best: true,
            feedback:
              "A 3.5 × 20 mm PK Papyrus covered stent was placed just proximal to the diagonal origin and post-dilated with a 3.75 mm NC balloon.",
            next: "s3",
          },
          {
            text: "More prolonged balloon inflations only",
            acceptable: true,
            feedback:
              "Sometimes enough for smaller leaks, but with continued extravasation and instability in a large proximal vessel, a covered stent is the definitive step.",
            next: "s3",
          },
          {
            text: "Coil or fat embolisation",
            feedback: "Appropriate for distal or small-branch perforations, not the proximal LAD.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Leakage continues after the first covered stent despite further balloon tamponade; the leak reaches the level of the diagonal origin. What next?",
        options: [
          {
            text: "A second, overlapping covered stent across the diagonal origin, accepting that the diagonal may close",
            best: true,
            feedback:
              "This sealed the perforation. The diagonal occluded, with chest pain and dynamic lateral ST depression. Stopping a type III leak takes priority over a side branch.",
            next: "s4",
          },
          {
            text: "Stent the diagonal first, then place the covered stent",
            acceptable: true,
            feedback:
              "Gives a clear target for later re-entry, but takes time; the authors judged it too slow given her instability.",
            next: "s4",
          },
          {
            text: "Leave a wire jailed in the diagonal as a marker before the covered stent",
            acceptable: true,
            feedback:
              "The authors considered and rejected this: withdrawing a jailed wire from behind a covered stent can tear the membrane ('cheese-wiring') and undo the seal.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "The perforation is sealed but the diagonal is occluded behind the covered stent, and she has pain with lateral ST depression. What do you do?",
        options: [
          {
            text: "Accept the side-branch loss",
            acceptable: true,
            feedback:
              "Reasonable for a small branch without ischaemia; this branch was causing symptoms and ECG changes.",
            next: "s5",
          },
          {
            text: "Attempt controlled fenestration: a dual-lumen microcatheter on the LAD wire, then a penetrating wire from the side port into the diagonal, using earlier runs as a roadmap in the same projections",
            best: true,
            feedback:
              "Fielder XT-A and Confianza Pro 12 failed; a Gaia Second through the side port of a dual-lumen microcatheter entered the diagonal. The authors stress case selection because of the risk of reperforation.",
            next: "s5",
          },
          {
            text: "Emergency CABG for the diagonal",
            feedback: "Disproportionate for a diagonal once the perforation is sealed.",
            next: "s4-cabg-diagonal", stateDelta: {"stability": -10} },
        ],
      },
      {
        id: "s5",
        prompt: "The diagonal is wired through the covered stent, but after kissing balloons flow is still poor. Next?",
        options: [
          {
            text: "TAP stenting of the diagonal",
            best: true,
            feedback:
              "A 2.0 × 25 mm stent with T-and-protrusion restored TIMI 3 flow while the perforation stayed sealed.",
          },
          {
            text: "Drug-coated balloon only and stop",
            feedback:
              "Balloon therapy had already failed to give good flow; a scaffold through the fenestrated membrane was needed.",
          },
          {
            text: "Leave it",
            feedback: "Flow is limited and the branch is causing ischaemia.",
          },
        ],
      },
      {
        "id": "s1-protamine-first",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: after protamine with no balloon in place, contrast continues to jet into the pericardium and BP falls to 76/42 mmHg.",
        "prompt": "What should have come first, and what now?",
        "options": [
          {
            "text": "Balloon tamponade at the perforation immediately, then echo and a covered stent",
            "best": true,
            "feedback": "Stopping inflow with a balloon is the first move; reversal alone does not seal an Ellis III leak.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Give more protamine",
            "feedback": "Reversal is not the mechanism that seals a large perforation.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Pericardiocentesis without stopping the leak",
            "acceptable": true,
            "feedback": "Drainage may be needed, but the leak must be controlled as well.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s4-cabg-diagonal",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the surgeons review her and judge emergency surgery for a diagonal branch too risky after two covered stents and a perforation.",
        "prompt": "What remains possible?",
        "options": [
          {
            "text": "Attempt controlled fenestration of the covered stent to rewire the diagonal, or accept the loss if it fails",
            "best": true,
            "feedback": "Fenestration is an advanced percutaneous option when surgery is not appropriate.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Insist on surgery",
            "feedback": "The risk of emergency surgery outweighs the benefit for a diagonal branch.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Thrombolysis for the diagonal",
            "feedback": "Thrombolysis after a perforation is contraindicated.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "No significant pericardial effusion developed. Access-site compartment syndrome needed a fasciotomy before discharge. At 9 months she had stable angina from focal restenosis in the stent distal to the covered stents; IVUS showed underexpansion (minimal stent area 4.21 mm2). High-pressure NC dilation and repeat IVL failed; excimer laser delivered through a guide extension positioned to shield the covered stents, followed by a 3.5 × 30 mm drug-coated balloon, gave a good result.",
    learningPoints: [
      "Balloon tamponade first, then a covered stent if the leak persists; give protamine only once the leak is controlled.",
      "A covered stent across a bifurcation will often close the side branch; decide in advance whether that branch matters.",
      "Fenestrating a covered stent with a dual-lumen microcatheter and a stiff penetrating wire can rescue a side branch, at the price of reperforation risk.",
      "Withdrawing a jailed wire from behind a covered stent can tear the membrane.",
      "Underexpansion in calcium is a common cause of later restenosis; image and optimise.",
    ],
    refs: ["ellis-1994"],
  },

  // ---------------------------------------------------------------------------
  // 7. LAD CTO, Ellis III perforation, tamponade, fat and coil embolisation (EuroPCR)
  // ---------------------------------------------------------------------------
  {
    id: "pub-lad-cto-perforation-tamponade-coils",
    title: "LAD CTO: Ellis III perforation, tamponade and escalating solutions",
    trackId: "complications",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Cigalini IM. Case study: the sum of all fears in CTO PCI. Presented in the EuroPCR 2018 session 'How to manage coronary perforation? Part 2'. PCRonline, Complications: coronary perforation, type III; 2019.",
      url: "https://www.pcronline.com/Cases-resources-images/Complications/How-to-treat-emergency-coronary-perforation/Type-III/Case-study-the-sum-of-all-fears-in-CTO-PCI",
    },
    summary:
      "During antegrade wire escalation for an LAD CTO in a 78-year-old woman, predilation caused an Ellis type III perforation with tamponade. After pericardiocentesis, the leak resisted balloon tamponade, fat embolisation and a first coil, and was finally sealed with a larger framing coil.",
    presentation:
      "78-year-old woman with hypertension and dyslipidaemia; previous breast cancer treated with chemotherapy and radiotherapy; under psychiatric care; ischaemic stroke in 2013 with residual right hemianopia. NSTEMI in October 2017 with two-vessel disease, managed medically at first, then staged RCA PCI with everolimus-eluting stents. Class III angina persisted after discharge.",
    findings: [
      "SYNTAX I 29.5, with SYNTAX II favouring CABG; EuroSCORE II 3.7%; STS-PROM 5.12%.",
      "LAD CTO with J-CTO score 3 (bend, calcification, blunt stump).",
      "Collateral filling graded Rentrop 0 on the pre-procedure images.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Class III angina persists after RCA PCI. How should the LAD CTO be approached?",
        options: [
          {
            text: "Heart-team review (SYNTAX II favoured CABG); if PCI is chosen, prepare for complications: dual injection where possible, echo in the room, pericardiocentesis kit, coils and covered stents ready",
            best: true,
            feedback:
              "The presenter's reflection lists careful case selection, contralateral injection whenever possible and being prepared for the worst: ultrasound, pericardiocentesis kit, coils, covered stents and a trained team.",
            next: "s2",
          },
          {
            text: "Antegrade wire escalation without specific bailout preparation",
            feedback:
              "Wire escalation was the chosen crossing strategy, but starting a J-CTO 3 case without the bailout kit and imaging ready is the error the presenter warns against.",
            next: "s2",
          },
          {
            text: "Continue optimised medical therapy",
            acceptable: true,
            feedback:
              "A valid choice given her prior stroke and scores. EURO-CTO showed symptom and quality-of-life benefit from CTO PCI in suitable patients, so persistent class III angina is a reasonable indication if she wants it.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "A Pilot 200 on a Corsair fails; a Hornet 10 crosses and is exchanged for a workhorse wire. After 2.5 × 15 mm predilation she develops pulsus paradoxus and hypotension, and angiography shows an Ellis type III perforation of the LAD. What now?",
        options: [
          {
            text: "Echo to confirm tamponade and immediate pericardiocentesis, while stopping inflow with a proximal balloon",
            best: true,
            feedback:
              "Tamponade was confirmed on TTE and drained emergently, with clinical stabilisation, and a prolonged proximal balloon inflation followed. Drainage and inflow control go together.",
            next: "s3",
          },
          {
            text: "Give protamine and observe",
            feedback: "Does not stop a type III leak and does nothing for tamponade.",
            next: "s2-protamine-observe", stateDelta: {"stability": -20, "flags": ["tamponade"]} },
          {
            text: "Transfer straight to theatre",
            feedback:
              "Surgery may be needed later, but a patient in tamponade needs drainage now, and percutaneous control is usually faster.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "After prolonged balloon inflation the leak returns on deflation. An over-the-wire balloon is inflated proximally and another attempt is made to cross the CTO for a covered stent, but it fails. Next?",
        options: [
          {
            text: "Embolise at the perforation through a microcatheter, starting with autologous subcutaneous fat",
            best: true,
            feedback:
              "Fat was injected through a Progreat microcatheter; the leak continued, so escalation was needed.",
            next: "s4",
          },
          {
            text: "Keep inflating balloons",
            feedback: "Repeated inflations without definitive sealing leave her bleeding; escalate.",
            next: "s3-repeated-balloons", stateDelta: {"stability": -15} },
          {
            text: "Emergency surgery",
            acceptable: true,
            feedback: "A legitimate escalation if embolisation fails or is not available.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "After the fat and an 8 mm helical hydrocoil, contrast is still leaking. What next?",
        options: [
          {
            text: "A larger (10 mm) framing coil through the same microcatheter",
            best: true,
            feedback:
              "This sealed the perforation. The mid and distal LAD were then seen filling via collaterals: sealing within an occluded CTO segment can mean giving up the vessel.",
          },
          {
            text: "Stop percutaneous attempts and send for surgery",
            acceptable: true,
            feedback: "If the team runs out of options or materials, surgery is the backstop.",
          },
          {
            text: "Remove the drain and finish",
            feedback: "The leak is not sealed.", next: "s4-drain-out", stateDelta: {"stability": -20, "flags": ["tamponade"]} },
        ],
      },
      {
        "id": "s2-protamine-observe",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: five minutes after protamine she has pulseless electrical activity.",
        "prompt": "What now?",
        "options": [
          {
            "text": "CPR, immediate pericardiocentesis, and balloon occlusion proximal to the perforation",
            "best": true,
            "feedback": "PEA in tamponade needs immediate drainage; chest compressions alone will not restore output.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Adrenaline and continued observation",
            "feedback": "Drugs cannot overcome tamponade.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Transfer to theatre during CPR without drainage",
            "feedback": "Drain first; transfer during arrest without drainage is rarely survivable.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
      {
        "id": "s3-repeated-balloons",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: after 30 minutes of repeated inflations, the leak returns each time and the drain keeps filling.",
        "prompt": "Prolonged balloon tamponade has failed. What now?",
        "options": [
          {
            "text": "Embolise at the perforation through a microcatheter (fat, then coils)",
            "best": true,
            "feedback": "When a covered stent cannot be delivered, embolisation is the next step.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Keep inflating",
            "feedback": "The leak has shown it will not seal this way.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Emergency surgery",
            "acceptable": true,
            "feedback": "Reasonable if embolisation is unavailable or fails.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s4-drain-out",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: shortly after the drain is removed, tamponade recurs with BP 65/40 mmHg.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Redrain, confirm the leak on angiography and complete the embolisation",
            "best": true,
            "feedback": "Contrast was still leaking; the drain had to stay.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Fluids and inotropes",
            "feedback": "Tamponade must be drained.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Observe on the ward",
            "feedback": "Recurrent tamponade is life-threatening.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "No leak was visible on the final angiogram. She returned to intensive care stable, the pericardial drain was removed after 24 hours and she was discharged at 72 hours.",
    outcomeVariants: [
      {
        "flag": "tamponade",
        "text": "Delays in draining or controlling the perforation led to a period of haemodynamic collapse."
      }
    ],
    learningPoints: [
      "Select CTO cases deliberately and prepare for the worst before starting: echo, pericardiocentesis kit, coils, covered stents and a trained team.",
      "Use contralateral injection whenever possible so you know where your wire is.",
      "Type III perforation with tamponade: drain the pericardium and control inflow with a balloon at the same time.",
      "Escalate the sealing method stepwise; if a covered stent cannot be delivered, fat or coils can seal the leak at the cost of the vessel.",
    ],
    refs: ["jcto-2011", "rentrop-1985", "ellis-1994", "euro-cto-2018", "cto-consensus-2019"],
  },

  // ---------------------------------------------------------------------------
  // 8. Retrograde RCA CTO, septal haematoma, Impella RP
  // ---------------------------------------------------------------------------
  {
    id: "pub-retrograde-cto-septal-haematoma",
    title: "Retrograde RCA CTO: a septal haematoma that crushed the right ventricle",
    trackId: "pci-complex",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Doshi D, Hatem R, Masoumi A, et al. A case report of right ventricular compression from a septal haematoma during retrograde coronary intervention to a chronic total occlusion. Eur Heart J Case Rep. 2019;3(3):ytz089. doi:10.1093/ehjcr/ytz089",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6764583/",
    },
    summary:
      "A 63-year-old woman had a mid-RCA CTO opened retrogradely through a septal collateral. A lacerated septal artery produced a haematoma that kept growing despite coiling and eventually obliterated the right ventricle; a percutaneous right ventricular assist device restored the circulation until it resolved.",
    presentation:
      "63-year-old woman with hypertension and hyperlipidaemia, with CCS class IV angina for 6 months despite maximal beta-blocker and long-acting nitrate. Regadenoson nuclear imaging showed severe inferior ischaemia with normal LV function. Before the procedure: HR 48/min, BP 100/78 mmHg, normal examination, sinus rhythm.",
    findings: [
      "Single-vessel disease: a mid-RCA CTO about 24 mm long on dual injection.",
      "Biradial approach (patient preference) with 7 Fr AL 0.75 and 7 Fr EBU 3.5 guides; aspirin and clopidogrel preloaded.",
      "Antegrade attempt through a TurnPike microcatheter: Fielder XT-A, Pilot 200 and Gaia 2nd all went subintimal, and the Gaia 2nd exited the vessel.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Antegrade wire escalation has failed with a wire exit. What next?",
        options: [
          {
            text: "Switch to a retrograde approach through a septal collateral",
            best: true,
            feedback:
              "Following the hybrid algorithm, a septal channel to the right PDA was crossed with a Sion; a retrograde Gaia 2nd crossed from distal to proximal true lumen and was exchanged for an externalised R350, over which the RCA was stented. The ACT target was raised above 350 s for retrograde work.",
            next: "s2",
          },
          {
            text: "Antegrade dissection and re-entry",
            acceptable: true,
            feedback:
              "A legitimate alternative in the hybrid algorithm when the distal landing zone is good; after a wire exit, more antegrade work in the subintimal space may enlarge the injury.",
            next: "s2",
          },
          {
            text: "Keep escalating antegrade wires",
            feedback:
              "Repeated antegrade attempts after a wire exit add risk with diminishing returns; change strategy.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "After the retrograde equipment is removed, an injection into the donor (left) system shows a lacerated septal artery with an intramyocardial haematoma. She is stable. What do you do?",
        options: [
          {
            text: "Observe closely in the laboratory without further fluid or anticoagulation",
            best: true,
            feedback:
              "Most septal perforations are benign. She was watched on the table for about 2 hours; heparin was not reversed because the ACT had fallen quickly.",
            next: "s3",
          },
          {
            text: "Coil the septal channel straight away",
            acceptable: true,
            feedback:
              "Reasonable if the haematoma is large or growing; many operators would do it at once.",
            next: "s3",
          },
          {
            text: "Pericardiocentesis",
            feedback: "The blood is inside the septum, not the pericardium; there is nothing to drain.",
            next: "s2-pericardiocentesis-dry", stateDelta: {"stability": -10} },
        ],
      },
      {
        id: "s3",
        prompt:
          "In recovery she develops sudden severe chest pain; HR 94/min, BP 100/60 mmHg, sinus tachycardia on the ECG. Repeat angiography shows the haematoma is enlarging. What next?",
        options: [
          {
            text: "Coil the septal channel at both its inflow and its outflow",
            best: true,
            feedback:
              "Both ends were coiled. A septal collateral connects two arterial systems, so closing one end can leave the haematoma filling from the other.",
            next: "s4",
          },
          {
            text: "Coil the inflow only",
            feedback: "May leave the haematoma filling from the far (retrograde) side.",
            next: "s4",
          },
          {
            text: "Analgesia and observation",
            feedback: "The haematoma is growing and she is symptomatic; act.",
            next: "s3-observed-growth", stateDelta: {"stability": -20, "flags": ["haematoma-growth"]} },
        ],
      },
      {
        id: "s4",
        prompt:
          "Some hours later she is hypotensive at 70/48 mmHg despite more than 3 L of fluid, dopamine and noradrenaline. Echo: a 4.2 cm septal haematoma almost obliterating the RV cavity, normal LV function, trivial effusion. What do you do?",
        options: [
          {
            text: "Insert a percutaneous right ventricular assist device",
            best: true,
            feedback:
              "An Impella RP via the right femoral vein, run at maximum performance, normalised the haemodynamics at once. The haematoma shrank over the following days and the pump was weaned and removed on day 4. DAPT was continued throughout.",
          },
          {
            text: "More fluid and inotropes",
            feedback: "Both have failed; the problem is mechanical obstruction of the RV.", next: "s3-observed-growth", stateDelta: {"stability": -15, "flags": ["haematoma-growth"]} },
          {
            text: "Controlled fenestration of the haematoma into a ventricular cavity with a stiff wire and small balloon",
            acceptable: true,
            feedback:
              "Described as an option and considered by the authors, but not needed once RV support worked.",
          },
          {
            text: "VA-ECMO",
            acceptable: true,
            feedback:
              "Would bypass the obstructed RV, but is more invasive than isolated RV support for an isolated RV problem.",
          },
        ],
      },
      {
        "id": "s2-pericardiocentesis-dry",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the needle finds no fluid; echo shows no effusion but a growing echodensity within the septum.",
        "prompt": "Why was the tap dry?",
        "options": [
          {
            "text": "A septal haematoma is intramyocardial, not pericardial; observe closely and seal the septal channel if it grows",
            "best": true,
            "feedback": "Septal haematomas compress the ventricles from within and cannot be drained through the pericardium.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Repeat the tap from another angle",
            "feedback": "There is no pericardial fluid to drain.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Start full anticoagulation",
            "feedback": "Anticoagulation enlarges the haematoma.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s3-observed-growth",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the haematoma now measures 4.5 cm, the RV cavity is almost obliterated and BP is 64/40 mmHg.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Seal the channel at both ends and support the circulation, with a percutaneous RV assist device if needed",
            "best": true,
            "feedback": "A septal channel fed from both sides needs two-sided occlusion; RV support bridges until the haematoma resolves.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "More fluid and inotropes only",
            "feedback": "The RV cavity is obliterated; filling cannot overcome the compression.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Pericardiocentesis",
            "feedback": "The blood is not in the pericardium.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "She was discharged on day 8 after a baseline cardiac MRI. MRI at 3 months showed complete resolution of the haematoma, and she was symptom-free at 4 months.",
    outcomeVariants: [
      {
        "flag": "haematoma-growth",
        "text": "Allowing the septal haematoma to keep growing led to RV compression and the need for mechanical support."
      }
    ],
    learningPoints: [
      "Retrograde CTO PCI improves crossing success but adds collateral-channel complications; always inject the donor artery after removing retrograde equipment.",
      "Most septal perforations settle; observe closely and act if the haematoma grows or the patient becomes symptomatic.",
      "Coil both ends of a perforated collateral channel.",
      "A septal haematoma can obstruct the LV, the RV or both; echo shows which ventricle needs support.",
      "Percutaneous RV support can bridge an isolated RV obstruction until the haematoma resolves.",
    ],
    refs: ["cto-consensus-2019", "brilakis-manual-cto"],
  },

  // ---------------------------------------------------------------------------
  // 9. SCAD with occlusion in STEMI
  // ---------------------------------------------------------------------------
  {
    id: "pub-scad-occlusive-pullback-injection",
    title: "Occlusive SCAD in a 47-year-old man: restoring flow without a stent",
    trackId: "acute-mcs",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Unzue L, Romero-Castro MJ, García E, et al. Successful percutaneous treatment of occlusive spontaneous coronary artery dissection with a 'pull-back injection technique': case report. Eur Heart J Case Rep. 2021;5(6):ytab165. doi:10.1093/ehjcr/ytab165",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8274651/",
    },
    summary:
      "A 47-year-old man with an anterior STEMI had an abrupt mid-LAD occlusion typical of type 2 SCAD. A wire crossed but flow did not return; withdrawing a microcatheter from the distal vessel while injecting contrast reconnected the true and false lumens, restored flow and avoided stenting.",
    presentation:
      "47-year-old man without notable cardiovascular risk factors, with acute chest pain and ST elevation in the anterior precordial leads. BP 110/70 mmHg, HR 82/min, no heart failure.",
    findings: [
      "Right radial access.",
      "Abrupt occlusion of the mid LAD with no distal flow, suggesting type 2 SCAD.",
      "Other coronary arteries normal.",
      "Intravascular imaging was not available in this emergency setting.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "A young man with ongoing anterior STEMI, an abrupt mid-LAD occlusion and otherwise normal coronaries. What is your approach?",
        options: [
          {
            text: "Treat as probable SCAD: the vessel is occluded with ongoing ischaemia, so attempt gentle reperfusion with a soft non-hydrophilic wire and avoid aggressive manoeuvres",
            best: true,
            feedback:
              "Conservative management is preferred in SCAD when flow is preserved and the patient is stable; an occluded artery with ongoing STEMI is one situation where intervention is justified. Handle the guide gently, avoid forceful injections and use a non-hydrophilic wire to reduce false-lumen entry. Intravascular imaging confirms the diagnosis and wire position when available.",
            next: "s2",
          },
          {
            text: "Direct long stent at the occlusion",
            feedback:
              "Stenting SCAD can push the haematoma along the vessel, and the stent may become malapposed as the haematoma resorbs; with the wire in the false lumen it can close the true lumen.",
            next: "s1-stented-scad", stateDelta: {"stability": -20, "flags": ["scad-stented"]} },
          {
            text: "Conservative management only, because SCAD usually heals",
            feedback:
              "True for stable patients with preserved flow, not for an occluded LAD with ongoing ST elevation.",
            next: "s2",
          },
          {
            text: "Thrombolysis",
            feedback: "Lytics can extend the intramural haematoma and have no place when SCAD is suspected.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "A BMW wire passes into the distal LAD but flow does not return. Next?",
        options: [
          {
            text: "Take a microcatheter to the distal vessel, confirm true-lumen position with a small injection, then withdraw it slowly while injecting firmly",
            best: true,
            feedback:
              "A Finecross was pulled back under continuous injection from a 2 mL syringe; flow returned with a residual spiral flap and the pain eased. The aim is to reconnect the false and true lumens and restore flow, not a perfect angiogram.",
            next: "s3",
          },
          {
            text: "Small-balloon angioplasty, or a cutting balloon to fenestrate the haematoma",
            acceptable: true,
            feedback:
              "Recognised steps in a stepwise approach; cutting balloons can decompress the haematoma but may extend the dissection.",
            next: "s3",
          },
          {
            text: "Stent from distal to proximal to cover the whole dissection",
            feedback:
              "Long stents in SCAD carry high risks of haematoma propagation, malapposition and later thrombosis or restenosis; keep stenting for when gentler measures fail.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "Flow is restored with a residual spiral intimal flap, and the pain has gone. What now?",
        options: [
          {
            text: "Stop here",
            best: true,
            feedback:
              "Success in SCAD is restored flow, not the absence of a flap; the vessel usually heals.",
            next: "s4",
          },
          {
            text: "Stent the residual flap for a cleaner result",
            feedback: "Adds the risks of stenting SCAD without clear benefit once flow has returned.",
            next: "s1-stented-scad", stateDelta: {"stability": -10, "flags": ["scad-stented"]} },
        ],
      },
      {
        id: "s4",
        prompt:
          "Peak high-sensitivity troponin T 907 ng/L; echo shows apical and distal anterior akinesia with LVEF 45%. How do you manage him in hospital and confirm healing?",
        options: [
          {
            text: "Antiplatelet therapy and a beta-blocker, stop parenteral anticoagulation, screen for extracoronary arteriopathy, and check the vessel with CT coronary angiography rather than invasive angiography",
            best: true,
            feedback:
              "Consensus advice, including the 2018 ESC-ACCA SCAD position paper, generally discourages continuing anticoagulation once SCAD is confirmed because of concern about haematoma extension. The authors actually continued enoxaparin with DAPT during admission, judging him at low bleeding risk; that is a debatable choice. They screened for fibromuscular dysplasia and used 320-slice CT at one week, which showed complete healing, to avoid a second invasive study.",
          },
          {
            text: "Routine repeat invasive angiography before discharge",
            feedback:
              "Invasive angiography in SCAD carries a higher risk of iatrogenic dissection; CT is a sensible alternative for a proximal or mid-vessel segment.", next: "s4-repeat-angio", stateDelta: {"stability": -10} },
          {
            text: "Full anticoagulation with DAPT for the whole admission",
            acceptable: true,
            feedback:
              "Close to what the authors did, but it runs against most consensus advice; it needs a clear reason.",
          },
        ],
      },
      {
        "id": "s1-stented-scad",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: after stenting, the haematoma propagates beyond both stent edges and a new filling defect appears distally.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Stop adding stents if flow is preserved; manage medically and monitor",
            "best": true,
            "feedback": "In SCAD, stents push the haematoma along; the vessel usually heals without more metal.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Add more stents to cover the propagation",
            "feedback": "Each stent can propagate the haematoma further.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Cutting balloon across the stented segment",
            "feedback": "This does not help a dissection that has already been stented.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-repeat-angio",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: routine repeat angiography before discharge causes a catheter-induced dissection of the left main.",
        "prompt": "What is the lesson?",
        "options": [
          {
            "text": "Confirm healing non-invasively (for example CT coronary angiography); avoid routine invasive re-imaging in SCAD",
            "best": true,
            "feedback": "Patients with SCAD are prone to iatrogenic dissection.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Repeat invasive angiography is always required",
            "feedback": "It adds risk without changing management.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Stent the left main dissection routinely",
            "acceptable": true,
            "feedback": "May be needed if flow-limiting, but the event was avoidable.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
    ],
    outcome:
      "CT at one week showed complete resolution of the flap with a small residual image at the entry point. Fibromuscular dysplasia and rheumatic disease were excluded. He was discharged on aspirin, clopidogrel, bisoprolol and a proton pump inhibitor; at 4 weeks echo showed normal wall motion, and he was asymptomatic at 4 months.",
    outcomeVariants: [
      {
        "flag": "scad-stented",
        "text": "Stenting the SCAD segment propagated the haematoma and left a long stented segment."
      }
    ],
    learningPoints: [
      "Suspect SCAD with an abrupt, smooth or tapering occlusion in a patient without typical risk factors; it also occurs in men.",
      "Conservative management is preferred when flow is preserved and the patient is stable; an occluded vessel with ongoing STEMI justifies intervention.",
      "In SCAD PCI the goal is flow, not a perfect lumen; stents are the last resort.",
      "Use soft non-hydrophilic wires and confirm true-lumen position before ballooning or injecting.",
      "CT coronary angiography can confirm healing without another invasive study; screen for extracoronary arteriopathy.",
    ],
    refs: ["scad-esc-2018", "scad-saw-2014"],
  },

  // ---------------------------------------------------------------------------
  // 10. Vasospasm causing VF, VA-ECMO, OCT, FFR, acetylcholine testing
  // ---------------------------------------------------------------------------
  {
    id: "pub-vasospasm-vf-ecmo-acetylcholine",
    title: "Refractory VF at 36: a moderate LAD stenosis, or spasm?",
    trackId: "physiology-imaging",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Nishido H, Honda S, Noguchi T. Refractory ventricular fibrillation associated with a coronary vasospasm and fixed moderate coronary stenosis. JACC Case Rep. 2026;31(35):109104. doi:10.1016/j.jaccas.2026.109104. Accompanying editorial: McGrath S, Khialani B. Provoking the diagnosis: coronary vasospasm testing in the setting of acute coronary syndromes. JACC Case Rep. 2026;31(35):109456. doi:10.1016/j.jaccas.2026.109456",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13554878/",
    },
    summary:
      "A previously healthy 36-year-old collapsed in VF after two weeks of early-morning chest tightness and needed VA-ECMO. A moderate proximal LAD stenosis did not explain the event: OCT excluded plaque rupture, FFR was 0.69, and acetylcholine testing under ECMO provoked severe LAD spasm.",
    presentation:
      "Two weeks of recurrent early-morning chest tightness. On the day of admission, chest discomfort while straining at stool, then collapse. Paramedics found VF that did not respond to repeated shocks; in hospital persistent VF led to VA-ECMO, with return of circulation after a low-flow time of 16 minutes. No past history; family history of MI, not premature.",
    findings: [
      "Emergency angiography: moderate proximal LAD stenosis with preserved distal flow.",
      "Day 3 at the tertiary centre: stable on VA-ECMO with no further arrhythmia; ECG terminal T-wave inversion V1–V3, QTc 433 ms, no ST deviation; structurally normal heart with normal LV function on echo.",
      "Day 4: unchanged LAD lesion; OCT showed a lipid-rich plaque with a thick fibrous cap, no rupture or thrombus; FFR 0.69.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "On the first angiogram the LAD lesion is moderate with preserved flow. Does it explain refractory VF?",
        options: [
          {
            text: "Stent the LAD now as the presumed culprit",
            feedback:
              "A moderate lesion with normal flow and no visible thrombus does not convincingly explain refractory VF; immediate stenting could end the search before the real mechanism is found.",
            next: "s1-stent-moderate", stateDelta: {"stability": -15, "flags": ["missed-spasm"]} },
          {
            text: "Defer intervention, stabilise and investigate the mechanism",
            best: true,
            feedback:
              "The first team managed him conservatively, and the lesion was later studied with imaging and physiology once he was stable.",
            next: "s2",
          },
          {
            text: "Decide the coronaries are irrelevant and plan an ICD only",
            feedback:
              "Early-morning rest symptoms point to a coronary mechanism that needs defining, and the answer changes drug treatment.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "OCT shows no rupture or thrombus and FFR is 0.69. He describes early-morning chest tightness at rest. What further test do you want?",
        options: [
          {
            text: "Intracoronary acetylcholine provocation, with vasodilators, a defibrillator and circulatory support ready",
            best: true,
            feedback:
              "Acetylcholine 20 µg provoked severe proximal and distal LAD spasm with slowed flow and up to 2 mm ST depression in V2–V4. It was done while still on VA-ECMO. The editorial stresses that provocation is not a resuscitation tool: test once the patient is stable, with full safety preparation.",
            next: "s3",
          },
          {
            text: "Ergonovine provocation",
            acceptable: true,
            feedback: "An established alternative in some centres; the principle and precautions are the same.",
            next: "s3",
          },
          {
            text: "Stent the LAD on the FFR result and stop",
            feedback: "Treats the fixed lesion but would miss the spasm that most likely triggered VF.",
            next: "s3",
          },
          {
            text: "Genetic testing and an electrophysiology study first",
            acceptable: true,
            feedback:
              "Inherited arrhythmia syndromes were considered and matter in a young VF survivor, but the history, normal QTc and normal heart point first to spasm.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "Severe LAD spasm is confirmed. Which medical therapy?",
        options: [
          {
            text: "Calcium-channel blocker",
            best: true,
            feedback: "Started here, with complete resolution of symptoms; calcium-channel blockers are the mainstay of vasospastic angina.",
            next: "s4",
          },
          {
            text: "High-dose beta-blocker, as after type 1 MI",
            feedback:
              "Beta-blockade can worsen spasm by leaving alpha-mediated vasoconstriction unopposed; avoid it as the main agent.",
            next: "s3-beta-blocker", stateDelta: {"stability": -15, "flags": ["missed-spasm"]} },
          {
            text: "Sublingual nitrate as needed only",
            feedback: "Helps attacks but does not prevent recurrence.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "He comes off ECMO on day 4 and recovers fully. What about the FFR-positive lesion and prevention of sudden death?",
        options: [
          {
            text: "Calcium-channel blocker, an ICD for secondary prevention, and staged PCI of the proximal LAD once on vasodilator therapy",
            best: true,
            feedback:
              "All three were done. VF survivors with spasm remain at risk despite medical therapy, and guidelines support considering an ICD. The lesion was stented because it was physiologically significant and could lower the ischaemic threshold during spasm; the editorial notes that this mixed picture has little guideline direction.",
          },
          {
            text: "Calcium-channel blocker alone, no ICD",
            acceptable: true,
            feedback:
              "Some would argue for drugs alone, but after refractory VF the concern is recurrence despite treatment; most guidance supports considering an ICD.",
          },
          {
            text: "PCI to the LAD without vasodilator therapy",
            feedback:
              "Treats the fixed lesion but leaves the dominant trigger untreated; a stent does not stop spasm elsewhere in the vessel.", next: "s1-stent-moderate", stateDelta: {"stability": -10, "flags": ["missed-spasm"]} },
        ],
      },
      {
        "id": "s1-stent-moderate",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: six weeks after the LAD stent he has another early-morning collapse in VF, rescued by a bystander.",
        "prompt": "What was missed?",
        "options": [
          {
            "text": "Vasospasm: test with acetylcholine and treat with a calcium-channel blocker and an ICD",
            "best": true,
            "feedback": "A stent treats a fixed lesion, not diffuse spasm; the history pointed to vasospasm.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Stent thrombosis; increase antiplatelet therapy",
            "feedback": "The pattern of early-morning rest symptoms suggests spasm.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Nothing; arrhythmic death is unpredictable",
            "feedback": "The mechanism is identifiable and treatable.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s3-beta-blocker",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: on high-dose beta-blocker, he reports more frequent early-morning chest tightness.",
        "prompt": "Why has he worsened?",
        "options": [
          {
            "text": "Non-selective or high-dose beta-blockade can worsen spasm; switch to a calcium-channel blocker",
            "best": true,
            "feedback": "Calcium-channel blockers are first-line for vasospastic angina.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Increase the beta-blocker dose",
            "feedback": "This may worsen spasm further.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Add sublingual nitrate only",
            "acceptable": true,
            "feedback": "Useful for attacks but not as prevention.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
    ],
    outcome:
      "Calcium-channel blockade abolished his symptoms. After full neurological recovery an ICD was implanted, and the proximal LAD was treated with staged PCI. He was discharged in a stable condition and remained free of chest pain and ventricular arrhythmia at follow-up.",
    outcomeVariants: [
      {
        "flag": "missed-spasm",
        "text": "Treating the moderate lesion or beta-blocking without addressing vasospasm left him exposed to recurrent arrhythmia."
      }
    ],
    learningPoints: [
      "When the angiogram does not explain the severity of the presentation, look for a dynamic mechanism such as vasospasm.",
      "Imaging (no rupture or thrombus) and physiology (FFR) help separate a fixed substrate from an acute plaque event.",
      "Acetylcholine provocation is the reference test for spasm; perform it once the patient is stable, with monitoring and bailout ready.",
      "Calcium-channel blockers are first-line; beta-blockers can worsen spasm.",
      "Vasospasm and a fixed stenosis can coexist, and both may need treatment.",
    ],
    refs: ["esc-acs-2023"],
  },

  // ---------------------------------------------------------------------------
  // 11. Anomalous left main from the right sinus presenting with STEMI
  // ---------------------------------------------------------------------------
  {
    id: "pub-anomalous-lm-right-sinus-stemi",
    title: "High lateral STEMI and no left main to be found: anomalous origin from the right sinus",
    trackId: "diagnostic",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Wong CCY, Pogatchnik BP, Clark DE, et al. A case report of successful primary percutaneous coronary intervention to an occluded anomalous left main coronary artery arising from the right coronary sinus. Eur Heart J Case Rep. 2024;8(4):ytae192. doi:10.1093/ehjcr/ytae192",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11044188/",
    },
    summary:
      "A 65-year-old man with a high lateral STEMI had a large, nearly normal RCA and no left main where expected. A persistent stain in the right cusp revealed an occluded anomalous left main from the right sinus, which was engaged with an Amplatz left guide and stented. Heart failure and arterial and venous thromboembolism followed.",
    presentation:
      "Sudden retrosternal pain while cycling uphill. BP 168/83 mmHg, irregular pulse 108/min, SpO2 94% on air, basal crackles. Untreated hypertension and dyslipidaemia; non-smoker.",
    findings: [
      "ECG: AF at 108/min with 3 mm ST elevation in I and aVL and reciprocal depression in II, III, aVF and V2–V6.",
      "Killip class II; loaded with aspirin, ticagrelor and heparin.",
      "Right radial access: a JR4 showed a large dominant RCA with only minor disease.",
      "A brief attempt with an EBU 3.5 failed to engage a left main.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "No left main is found in the left sinus. What do you do?",
        options: [
          {
            text: "Look again at the RCA run for clues and consider an anomalous origin",
            best: true,
            feedback:
              "Reviewing the RCA injection showed a persistent stain in the right cusp near the RCA origin: the stump of an occluded anomalous left main. Lingering contrast in a sinus where no vessel fills is a classic sign of an occluded ostium.",
            next: "s2",
          },
          {
            text: "Non-selective aortic root injection",
            acceptable: true,
            feedback:
              "A quick way to show the sinuses and a stump, though an occluded vessel may not opacify.",
            next: "s2",
          },
          {
            text: "Keep trying different left-sided catheters",
            feedback:
              "Time matters in STEMI; if good attempts fail, think anomaly rather than technique.",
            next: "s2",
          },
          {
            text: "Conclude that the RCA supplies the anterior wall and stop",
            feedback:
              "A high lateral STEMI with no explaining lesion means an occluded vessel has been missed.",
            next: "s1-stopped-wrongly", stateDelta: {"stability": -25} },
        ],
      },
      {
        id: "s2",
        prompt: "Which guide do you use to engage a left main arising from the right sinus?",
        options: [
          {
            text: "Amplatz left 0.75",
            best: true,
            feedback:
              "Used successfully from the right radial; the anomalous left main was totally occluded proximally.",
            next: "s3",
          },
          {
            text: "Judkins right 4",
            acceptable: true,
            feedback:
              "Can engage some right-sinus anomalies but often gives poor backup for intervention.",
            next: "s3",
          },
          {
            text: "EBU 3.5",
            feedback: "Shaped for a normally placed left main; it will not seat in the right sinus.",
            next: "s2-ebu-fails", stateDelta: {"stability": -10} },
        ],
      },
      {
        id: "s3",
        prompt:
          "After predilation with a 2.5 mm semi-compliant balloon, flow returns and shows 50% proximal and 70% distal left main stenoses and a long 70% LAD lesion. Stents go into the proximal left main (3.0 × 22 mm) and distal left main/LAD (2.5 × 38 mm), post-dilated to 3.25 mm. A distal LAD edge dissection now limits flow. Next?",
        options: [
          {
            text: "Overlapping stent to cover the edge dissection",
            best: true,
            feedback:
              "A 2.25 × 15 mm stent restored TIMI 3 flow and the ST segments resolved. The authors acknowledged that intracoronary imaging was not used, so the occlusion mechanism (plaque rupture or embolism) was not defined.",
            next: "s4",
          },
          {
            text: "Prolonged balloon inflation only",
            acceptable: true,
            feedback:
              "May tack down a small flap, but flow-limiting edge dissections usually need a stent.",
            next: "s4",
          },
          {
            text: "Leave it",
            feedback: "A flow-limiting dissection needs treatment.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "Day 5: abdominal pain, haematuria and fever. He needed escalating heparin infusion rates to reach his target aPTT. CT shows bilateral segmental pulmonary emboli and embolic occlusion of the right renal artery with infarction; duplex shows a femoral vein thrombus; earlier CT angiography showed left atrial appendage thrombus. Next?",
        options: [
          {
            text: "Therapeutic anticoagulation, a thrombophilia screen and a search for an interatrial shunt",
            best: true,
            feedback:
              "Warfarin followed heparin. Heparin resistance was put down to inflammation (normal antithrombin, raised fibrinogen and CRP). Thrombophilia testing was negative and a bubble study excluded an interatrial shunt.",
            next: "s5",
          },
          {
            text: "Systemic thrombolysis",
            feedback:
              "Stable segmental PE and renal embolism days after PCI: the bleeding risk outweighs any benefit.",
            next: "s5",
          },
          {
            text: "Continue antiplatelet therapy only",
            feedback: "AF with appendage thrombus plus venous thromboembolism needs anticoagulation.",
            next: "s4-antiplatelet-only", stateDelta: {"stability": -15} },
        ],
      },
      {
        id: "s5",
        prompt:
          "At 2 months: no angina; CMR shows LVEF 40% with extensive non-viable anterior scar and no inducible ischaemia. CT angiography shows a retroaortic course with no intramural segment, angulated take-off or slit-like ostium. Should the anomalous left main be repaired surgically?",
        options: [
          {
            text: "No: medical management",
            best: true,
            feedback:
              "Consistent with the 2020 ESC adult congenital heart disease guidelines, which reserve surgery for anomalous coronaries with documented ischaemia or high-risk anatomy. The interarterial course is the one most associated with sudden death.",
          },
          {
            text: "Surgical reimplantation or unroofing",
            feedback:
              "No ischaemia, no high-risk features and a non-viable territory: there is nothing to gain.",
          },
        ],
      },
      {
        "id": "s1-stopped-wrongly",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: back on the unit, the lateral ST elevation persists and he becomes hypotensive.",
        "prompt": "What was missed?",
        "options": [
          {
            "text": "The occluded left system: return to the lab, look for an anomalous origin and treat it",
            "best": true,
            "feedback": "A missing left main with an infarct in its territory means it is somewhere else, often occluded.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Treat as a completed infarct",
            "feedback": "Ongoing ST elevation with hypotension needs reperfusion.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Give thrombolysis",
            "acceptable": true,
            "feedback": "Possible if PCI is unavailable, but here returning to the lab is better.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s2-ebu-fails",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the EBU curve cannot point towards the right sinus origin and backs out repeatedly.",
        "prompt": "What shape suits a left main arising from the right sinus?",
        "options": [
          {
            "text": "An Amplatz left curve, which can reach and seat in an anterior right-sinus origin",
            "best": true,
            "feedback": "Amplatz shapes give the reach and backup needed for this anomaly.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "A larger EBU",
            "feedback": "The shape, not the size, is the problem.",
            "stateDelta": {
              "stability": -5
            }
          },
          {
            "text": "A pigtail",
            "feedback": "A pigtail cannot be used to engage a coronary.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-antiplatelet-only",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: on antiplatelet therapy alone, he develops a new left leg ischaemia from a further embolus.",
        "prompt": "What should have been done?",
        "options": [
          {
            "text": "Therapeutic anticoagulation, a thrombophilia screen and a search for an interatrial shunt",
            "best": true,
            "feedback": "Arterial and venous thromboembolism together need anticoagulation and a cause.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Double antiplatelet doses",
            "feedback": "Antiplatelets do not treat venous thromboembolism.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Systemic thrombolysis",
            "feedback": "The bleeding risk after recent PCI is high.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He made a full recovery and was discharged on day 14 on warfarin. At 2 months he was asymptomatic, the appendage thrombus had resolved and renal function had improved to a new baseline; repeat imaging was planned before deciding whether to stop anticoagulation.",
    learningPoints: [
      "If the left main cannot be found, look for clues on the RCA injection and think of an anomalous origin early.",
      "An Amplatz left guide suits a left main arising from the right sinus.",
      "CT angiography defines the course and high-risk features (interarterial, intramural, angulated or slit-like ostium) that decide the need for surgery.",
      "Intracoronary imaging can clarify the mechanism of occlusion; its absence was an acknowledged limitation here.",
      "Heparin resistance and new embolic events after STEMI need a systematic work-up.",
    ],
    refs: ["esc-achd-2020"],
  },

  // ---------------------------------------------------------------------------
  // 12. TAVI: left main occlusion by sinus sequestration, valve snared into aorta
  // ---------------------------------------------------------------------------
  {
    id: "pub-tavi-lm-occlusion-valve-snare",
    title: "Arrest after TAVI release: left coronary sinus sealed off, valve snared into the aorta",
    trackId: "structural",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Lopes PM, Brito JD, Campante Teles R, et al. Acute left main coronary occlusion after transcatheter aortic valve implantation: life-saving intervention using the snare technique. A case report. Eur Heart J Case Rep. 2023;7(1):ytac469. doi:10.1093/ehjcr/ytac469",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9792273/",
    },
    summary:
      "During transfemoral TAVI with a 34 mm self-expanding valve, a 73-year-old man arrested within a minute of release. The valve sat very high and sealed off the left coronary sinus. Snaring the valve into the ascending aorta restored left main flow; a balloon-expandable valve was then implanted through it.",
    presentation:
      "73-year-old man with 6 months of progressive exertional breathlessness and mild chest pain. Hypertension, dyslipidaemia, type 2 diabetes, cerebrovascular disease, CKD stage 3b and Parkinson's disease. Grade III/VI ejection systolic murmur.",
    findings: [
      "TTE: Vmax 4.21 m/s, mean gradient 45 mmHg, valve area 0.8 cm2, LVEF 59%; sinus rhythm with no conduction disease; no obstructive coronary disease.",
      "CT: mean annular diameter 26.4 mm, area 548 mm2, perimeter 85.2 mm; moderately calcified tricuspid valve; coronary heights about 13 mm (left) and 14 mm (right); suitable iliofemoral access.",
      "STS 3.27%, EuroSCORE II 3.67%; the heart team chose TAVI because of frailty, comorbidity and the patient's preference.",
      "Conscious sedation; 34 mm Evolut R through a 16 Fr right femoral sheath; pigtail via the left radial artery.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "On the planning CT, coronary heights exceed 12 mm, but the sinotubular junction is relatively narrow for a 34 mm self-expanding valve. What do you do with that information?",
        options: [
          {
            text: "Coronary heights are above 12 mm, so coronary risk is low: proceed",
            feedback:
              "Height is only one factor. Sinus width, STJ dimensions, leaflet bulk, valve design and implant depth all matter; with a supra-annular valve a narrow STJ can pin the leaflets against the sinus and seal it off.",
            next: "s1-unplanned-risk", stateDelta: {"stability": -15} },
          {
            text: "Reassess the root as a whole and plan mitigation: balloon valvuloplasty with simultaneous root injection, coronary protection, or a different valve or size",
            best: true,
            feedback:
              "Afterwards the authors concluded that the narrow STJ should not have been overlooked, and that pre-implant balloon sizing or a balloon-expandable valve might have prevented the event.",
            next: "s2",
          },
          {
            text: "Cancel TAVI and refer for surgery",
            acceptable: true,
            feedback:
              "Surgery was reasonable at this risk level, but the heart team had good reasons for TAVI; the risk could be managed with planning.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "Each time the valve is flared at the annulus he becomes unstable. On the third attempt the position looks acceptable, but you are not certain of the depth or the alignment with the cusps. What now?",
        options: [
          {
            text: "Release",
            feedback: "This is what happened. The valve turned out to be implanted very high.",
            next: "s1-unplanned-risk", stateDelta: {"stability": -20} },
          {
            text: "Recapture, recheck depth in a true coplanar view, and consider predilation or a different valve before committing",
            best: true,
            feedback:
              "Recapturable valves exist so that you release only when depth is confirmed. The authors attributed the event to very high implantation combined with a valve size large for this root.",
            next: "s3",
          },
          {
            text: "Release and post-dilate if the result is poor",
            feedback: "Post-dilation cannot bring a valve that is too high back down.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Immediately after release he has chest pain and collapses into cardiac arrest within a minute. Aortography: the valve sits very high, the left coronary sinus does not fill and the left main is occluded. What do you do?",
        options: [
          {
            text: "Start advanced life support and snare the self-expanding valve up into the ascending aorta from the second arterial access",
            best: true,
            feedback:
              "A 20 mm Goose Neck snare through the radial access pulled the Evolut into the ascending aorta; left main flow returned immediately and resuscitation succeeded.",
            next: "s4",
          },
          {
            text: "Emergency left main PCI through the valve frame",
            acceptable: true,
            feedback:
              "The most common treatment for coronary obstruction after TAVI, but with the sinus sealed by a high valve and the patient in arrest, reaching the ostium may be impossible or too slow.",
            next: "s4",
          },
          {
            text: "Start VA-ECMO, then plan",
            acceptable: true,
            feedback: "Support buys time but does not relieve the obstruction.",
            next: "s4",
          },
          {
            text: "Post-dilate the valve",
            feedback: "Pushes the leaflets harder against the sinus and makes things worse.",
            next: "s3-postdilated", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s4",
        prompt: "The first valve now sits in the ascending aorta and circulation has returned. How do you finish?",
        options: [
          {
            text: "Re-analyse the CT and implant a 29 mm balloon-expandable valve, passing it through the parked self-expanding valve",
            best: true,
            feedback:
              "A 29 mm Sapien 3 was advanced through the Evolut and implanted with both coronary arteries perfused.",
          },
          {
            text: "Another 34 mm self-expanding valve placed lower",
            feedback: "The same mismatch with the root repeats the risk.",
          },
          {
            text: "Abandon valve treatment",
            feedback:
              "He still has severe AS and a valve parked in his aorta; completing the procedure safely is the better option.",
          },
        ],
      },
      {
        "id": "s1-unplanned-risk",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: the valve is released without a mitigation plan; the left main ostium is now very close to the frame and the leaflets.",
        "prompt": "What should be in place before release in a narrow root?",
        "options": [
          {
            "text": "A plan for coronary protection (wire or parked stent), assessment with balloon valvuloplasty and root injection, and a recapturable valve",
            "best": true,
            "feedback": "Coronary heights alone do not define the risk; the whole root matters.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Nothing; coronary heights above 12 mm exclude obstruction",
            "feedback": "A narrow sinotubular junction and a large valve can seal the sinus.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Post-dilate aggressively after release",
            "feedback": "This pushes the leaflets further towards the ostium.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s3-postdilated",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: post-dilatation flares the frame further; the left sinus remains sealed and he remains in arrest.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Snare the self-expanding valve up into the ascending aorta to unseal the sinus, during ALS",
            "best": true,
            "feedback": "Moving the valve restores flow when sinus sequestration is the mechanism.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Further post-dilatation",
            "feedback": "This worsens the sequestration.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Continue CPR without changing the valve position",
            "feedback": "The cause remains untreated.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "He went to the cardiac ICU without mechanical support and was extubated within 6 hours. High-sensitivity troponin T peaked at 1,100 ng/L with no fall in LVEF or new wall-motion abnormality, and the post-procedure ECG showed no rhythm disturbance. He was discharged on day 5 on single antiplatelet therapy and was NYHA class I at 6 months with a normally functioning valve.",
    learningPoints: [
      "Coronary obstruction risk at TAVI depends on the whole root: coronary height, sinus width, STJ, leaflet bulk, valve design and implant depth.",
      "With a supra-annular self-expanding valve, a high implant in a narrow STJ can seal off an entire sinus.",
      "Use recapturability: release only when depth is confirmed.",
      "Coronary obstruction after TAVI presents with hypotension, ST change, arrhythmia or arrest; emergency PCI is the usual treatment, but snaring a self-expanding valve into the aorta can restore flow in extremis.",
      "Have a second arterial access and a snare ready in every TAVI.",
    ],
    refs: ["scct-tavi-2019"],
  },

  // ---------------------------------------------------------------------------
  // 13. Iatrogenic VSD after TAVI with conduction disease (EuroIntervention Case Reports)
  // ---------------------------------------------------------------------------
  {
    id: "pub-tavi-iatrogenic-vsd-closure",
    title: "A new murmur after TAVI: iatrogenic VSD and right heart failure",
    trackId: "structural",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Foszcz P, Ubben T, Chung D, et al. When a new murmur appears: the left-to-right dilemma. Management of iatrogenic ventricular septal defect after transcatheter aortic valve implantation. EuroIntervention Case Reports. 2026;1(1). doi:10.4244/EIJCR-D-26-00022",
      url: "https://eijcasereports.pcronline.com/articles/when-a-new-murmur-appears-the-left-to-right-dilemma-management-of-iatrogenic-ventricular-septal-defect-after-transcatheter-aortic-valve-implantation",
    },
    summary:
      "After a 32 mm balloon-expandable valve in a heavily calcified outflow tract, an 80-year-old man developed new LBBB, transient Mobitz II block and a holosystolic murmur. Echo showed a membranous VSD. He progressed to right heart failure and cardiac arrest, and the defect was closed with a muscular VSD occluder; haemolysis followed and settled.",
    presentation:
      "80-year-old man admitted for elective TAVI. Heart failure with LVEF 35% from post-myocarditis dilated cardiomyopathy, type 2 diabetes, hypertension and COPD.",
    findings: [
      "Low-flow, low-gradient severe AS: Vmax 3.6 m/s, mean gradient 39 mmHg, valve area 0.4 cm2.",
      "CT: extensive valvular, subannular and outflow-tract calcification (calcium score 6,476 AU); annulus about 33 mm.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "Valve choice: an annulus of about 33 mm with heavy subannular and outflow-tract calcium. What matters?",
        options: [
          {
            text: "Choose a balloon-expandable valve without further thought; calcium location is irrelevant",
            feedback:
              "Outflow-tract and subannular calcium is the main risk factor for annular rupture and septal injury with balloon-expandable valves.",
            next: "s2",
          },
          {
            text: "Weigh the trade-off: self-expanding valves carry less rupture risk in outflow calcium, but this annulus exceeded the Evolut range and the only suitable self-expanding option was unavailable, so a 32 mm balloon-expandable valve was chosen",
            best: true,
            feedback:
              "This mirrors the authors' reasoning. Asymmetric calcium also raises the risk of paravalvular leak with self-expanding valves, so neither option was risk-free. With a balloon-expandable valve in heavy outflow calcium, watch afterwards for rupture and septal injury.",
            next: "s2",
          },
          {
            text: "Surgical aortic valve replacement instead",
            acceptable: true,
            feedback:
              "Worth discussing, though his comorbidities and LV function favoured TAVI; the heart team chose TAVI.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "TAVI goes well (peak-to-peak gradient from 57 to 2 mmHg). Overnight he develops new LBBB and transient Mobitz type II block, and a new holosystolic murmur is heard. What do you do?",
        options: [
          {
            text: "Urgent echocardiography, with continued ECG monitoring and ready access to temporary pacing",
            best: true,
            feedback:
              "Echo the next morning showed mild paravalvular leak and an 8 mm membranous VSD with left-to-right flow, confirmed on CT and TOE (7 × 6 mm on 3D). New LBBB with transient high-grade block after TAVI needs extended monitoring and an individual pacing decision under the 2021 ESC pacing guidance; the source does not report how the conduction disease was managed.",
            next: "s3",
          },
          {
            text: "Discharge as planned with an outpatient echo",
            feedback: "A new murmur and new conduction disease after TAVI must be assessed before discharge.",
            next: "s2-missed-vsd", stateDelta: {"stability": -20} },
          {
            text: "Assume it is paravalvular leak and ignore it",
            feedback:
              "A holosystolic murmur after TAVI may be MR, a VSD or a fistula; image it.",
            next: "s2-missed-vsd", stateDelta: {"stability": -15} },
        ],
      },
      {
        id: "s3",
        prompt:
          "Over the next days he becomes increasingly breathless with hepatic and renal congestion, needing intensive care, non-invasive ventilation and renal replacement therapy. Surgeons decline (EuroSCORE 36.1%). Conservative management continues until he has a pulseless VT arrest, with return of circulation after brief CPR. What now?",
        options: [
          {
            text: "Bailout percutaneous VSD closure",
            best: true,
            feedback:
              "This was done. The authors conclude that symptomatic, haemodynamically significant shunts need early intervention before malignant deterioration; in a systematic review they cite, untreated symptomatic post-TAVI VSD carried about 35% mortality at 30 days.",
            next: "s4",
          },
          {
            text: "Continue conservative management",
            feedback: "It has already failed.",
            next: "s4",
          },
          {
            text: "Surgical repair",
            feedback: "Declined as prohibitive risk.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "Which technique and device?",
        options: [
          {
            text: "Retrograde: cross the TAVI valve with a pigtail, cross the VSD with a hydrophilic wire on a JR4 under TOE, park a stiff wire in the RV apex, balloon-size, then deploy a muscular VSD occluder",
            best: true,
            feedback:
              "A 10 × 40 mm balloon sized the defect, and a 10 mm Amplatzer muscular VSD occluder was deployed from the arterial side, followed by a pull-and-plug test.",
            next: "s5",
          },
          {
            text: "A vascular plug",
            feedback:
              "Used off-label for membranous defects, but the authors argue its small rim (about 2 mm) and oval shape make dislodgement likely; the larger disc of a muscular occluder seals better.",
            next: "s5",
          },
          {
            text: "An ASD occluder",
            feedback: "Not designed for ventricular pressures or this anatomy.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt:
          "After closure, LDH rises and haptoglobin falls; TOE shows a small residual jet through the device. What next?",
        options: [
          {
            text: "Supportive care and monitoring of haemolysis, expecting it to settle as the device endothelialises",
            best: true,
            feedback:
              "Haemolysis markers normalised over the following weeks as the residual shunt fell. Renal replacement was stopped as RV function improved, and bilirubin fell with hepatic decongestion.",
          },
          {
            text: "Retrieve the device",
            feedback: "Would reopen the shunt that caused right heart failure.",
          },
          {
            text: "Place a second device immediately",
            feedback:
              "Flow through a new device often falls with endothelialisation; reserve further intervention for persistent significant haemolysis.", next: "s5-second-device", stateDelta: {"stability": -10} },
        ],
      },
      {
        "id": "s2-missed-vsd",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: a week later he is readmitted in right heart failure with a loud holosystolic murmur and new complete heart block.",
        "prompt": "What should have happened at the first sign?",
        "options": [
          {
            "text": "Urgent echo with ECG monitoring and pacing access; now image, pace and plan VSD management with the heart team",
            "best": true,
            "feedback": "A new murmur with conduction changes after TAVI needs immediate imaging.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Treat as paravalvular leak with diuretics",
            "feedback": "The murmur and conduction disease point to a septal injury.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Discharge again with outpatient follow-up",
            "feedback": "He is decompensating.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
      {
        "id": "s5-second-device",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: a second device impinges on the TAVI frame and haemolysis worsens.",
        "prompt": "What is the usual course of mild haemolysis after VSD closure?",
        "options": [
          {
            "text": "It usually settles as the device endothelialises; support and monitor, and avoid further hardware unless it fails to settle",
            "best": true,
            "feedback": "Small residual jets often seal over weeks.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Add a third device",
            "feedback": "More hardware increases shear and haemolysis.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Retrieve both devices surgically now",
            "feedback": "He was declined for surgery; this is not proportionate.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He left intensive care 15 days after closure and moved to a rehabilitation centre 23 days later.",
    learningPoints: [
      "Iatrogenic VSD after TAVI is rare and mostly follows balloon-expandable valves in calcified outflow tracts; calcium location and extent predict risk.",
      "A new murmur or right heart failure after TAVI should prompt echo looking for VSD, fistula or valve dysfunction.",
      "Symptomatic, haemodynamically significant post-TAVI VSD should be closed early; percutaneous closure is preferred when surgical risk is high.",
      "Muscular VSD occluders are the commonest choice; vascular plugs may dislodge.",
      "Residual flow through a new occluder can cause haemolysis that often resolves with endothelialisation.",
      "New LBBB and transient high-grade AV block after TAVI need monitoring and a structured pacing decision.",
    ],
    refs: ["esc-pacing-2021"],
  },

  // ---------------------------------------------------------------------------
  // 14. Mitral TEER in cardiogenic shock on Impella after left main STEMI
  // ---------------------------------------------------------------------------
  {
    id: "pub-stemi-shock-mcs-mitral-teer",
    title: "Left main STEMI in shock: Impella plus ECMO, then mitral TEER to wean support",
    trackId: "structural",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Schwarzkopf D, Hinkov H, Lee CB, et al. Transcatheter edge-to-edge mitral repair with a nitinol device in cardiogenic shock on micro-axial flow-pump support: a case report. Eur Heart J Case Rep. 2026;10(6):ytag420. doi:10.1093/ehjcr/ytag420",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13293262/",
    },
    summary:
      "After Impella-protected PCI of a left main bifurcation STEMI, a 54-year-old man remained in profound shock. Support was escalated to Impella plus VA-ECMO; once ECMO came off, severe functional MR prevented weaning of the Impella and was treated with a PASCAL edge-to-edge device on Impella support.",
    presentation:
      "54-year-old man with hypertension, type 2 diabetes and known coronary disease. The day before, at another hospital, he had a STEMI treated with Impella CP-protected PCI and stenting of the left main into the LAD and circumflex. He arrived intubated in profound shock.",
    findings: [
      "Noradrenaline and adrenaline infusions (vasoactive-inotropic score 29); SCAI shock stage D–E; pH 7.1 with marked lactic acidosis.",
      "TOE: posterolateral akinesia, LVEDD 57 mm, LVEF 13%, cardiac index 1.08 L/min/m2.",
      "Severe functional MR with an eccentric jet and posterior leaflet tethering; Impella correctly positioned; no VSD and no structural mitral lesion.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "Shock persists on an Impella CP after left main PCI. Which causes must you work through?",
        options: [
          {
            text: "Pump position and function, failed revascularisation, mechanical complications (VSD, papillary muscle rupture) and acute MR",
            best: true,
            feedback:
              "TOE confirmed pump position and excluded VSD and structural mitral damage; the angiographic result and absence of further ischaemia argued against failed revascularisation. Severe ischaemic functional MR was the main driver.",
            next: "s2",
          },
          {
            text: "Increase catecholamines and wait",
            feedback:
              "He is already on high doses; more raises oxygen demand and arrhythmia risk without addressing the cause.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you escalate support?",
        options: [
          {
            text: "A larger microaxial pump (Impella 5.5), or if that is not possible, add VA-ECMO to the Impella",
            best: true,
            feedback:
              "An Impella 5.5 could not be placed because of brachiocephalic trunk stenosis, so Impella CP plus VA-ECMO was set up (right axillary arterial and right femoral venous access). Catecholamines were stopped within 12 hours. The Impella offsets the extra afterload that ECMO puts on the LV.",
            next: "s3",
          },
          {
            text: "Add an IABP",
            feedback: "Modest support, not enough for SCAI D–E shock on high-dose catecholamines.",
            next: "s3",
          },
          {
            text: "Emergency mitral surgery now",
            feedback:
              "Extremely high risk with LVEF 13% and multiorgan dysfunction; stabilise first.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "He wakes without neurological deficit and ECMO is weaned and removed. The Impella cannot be weaned: at level P2 he deteriorates and MR worsens to 4+. EuroSCORE II 20.2%. What next?",
        options: [
          {
            text: "Mitral TEER while on Impella support",
            best: true,
            feedback:
              "The heart team chose TEER to allow weaning. Functional MR is load-dependent and can worsen as support is reduced.",
            next: "s4",
          },
          {
            text: "Surgical mitral repair or replacement",
            acceptable: true,
            feedback:
              "Definitive but high risk here; surgery was kept as the bailout if TEER failed.",
            next: "s4",
          },
          {
            text: "Leave the Impella in and wait",
            feedback:
              "Prolonged support adds bleeding, haemolysis and vascular risk without treating the MR.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "How do you assess the MR and choose the device?",
        options: [
          {
            text: "Assess at reduced support (P2, no vasoactive drugs) and choose a device suited to tethered leaflets and a spherical ventricle",
            best: true,
            feedback:
              "At P2: EROA 0.45 cm2, regurgitant volume 60 mL, coaptation gap 5.7 mm, tenting height 11.1 mm, posterior leaflet 15 mm, non-dilated annulus, systolic flow reversal in a pulmonary vein. PASCAL was chosen for its flexible design and broad paddles; MitraClip was the alternative considered.",
          },
          {
            text: "Assess at full support and intervene only if MR is still severe",
            feedback:
              "Full unloading shrinks the LV and the regurgitant orifice, underestimating MR that returns once support is reduced.",
          },
          {
            text: "Avoid TEER because the MR is secondary rather than degenerative",
            feedback:
              "TEER is used for secondary MR; the question is anatomical suitability and context, not aetiology alone.",
          },
        ],
      },
    ],
    outcome:
      "On day 8 after the STEMI a single PASCAL device at A2/P2 (transseptal puncture 36 mm above the annulus) reduced MR to trace with a mean gradient of 2.3 mmHg. The next day LVEF had improved to 30%, and the Impella was removed at the bedside the day after. He was transferred to another hospital on day 15 after the STEMI. At 9 months LVEF was 44%, residual MR less than grade I, and he was NYHA class I.",
    learningPoints: [
      "Persistent shock on mechanical support needs a structured search: device position, revascularisation result, mechanical complications and valve lesions.",
      "If an Impella CP is not enough, escalate to a larger pump or add VA-ECMO; the Impella unloads the LV against ECMO afterload.",
      "Functional MR is load-dependent: assess it under the conditions the patient will face once support is reduced.",
      "TEER on mechanical support can allow weaning when surgery is prohibitive, though evidence is limited to case reports and series.",
    ],
    refs: ["scai-shock-2022"],
  },

  // ---------------------------------------------------------------------------
  // 15. LAAO device embolisation into the LV
  // ---------------------------------------------------------------------------
  {
    id: "pub-laao-device-embolisation-lv",
    title: "LAA occluder found in the left ventricle a few hours after implantation",
    trackId: "structural",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Jena N, Lapsiwala B, Bondi G, et al. Successful percutaneous retrieval of embolized left atrial appendage occlusion device from left ventricle. JACC Case Rep. 2025;30(40):105902. doi:10.1016/j.jaccas.2025.105902",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12861665/",
    },
    summary:
      "Hours after an apparently uncomplicated 21 mm Watchman implantation, an 80-year-old woman developed frequent ventricular ectopy; echo found the device wedged in the LV subvalvular apparatus. It was freed via transseptal access, allowed to pass into the aorta and snared out through a femoral arterial sheath.",
    presentation:
      "80-year-old woman with persistent non-valvular AF, CHA2DS2-VASc 6 and HAS-BLED 4, unable to take anticoagulation after severe lower GI bleeding. Previous multivessel PCI, heart failure with preserved LVEF (NYHA III), moderate MR and hypertension.",
    findings: [
      "Planning CT and TOE: single-lobe windsock appendage, maximum ostium 1.9 cm, depth 2.25 cm.",
      "21 mm Watchman implanted transseptally; PASS criteria met and tug test performed.",
      "On the cardiac care unit: frequent premature ventricular contractions.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "A few hours after an uncomplicated LAAO, monitoring shows frequent ventricular ectopics. What next?",
        options: [
          {
            text: "Urgent echocardiography to check the device position",
            best: true,
            feedback:
              "TTE showed the device had embolised into the LV and was wedged in the mitral subvalvular apparatus. New ventricular ectopy after LAAO is a warning sign of embolisation.",
            next: "s2",
          },
          {
            text: "Start an antiarrhythmic and observe",
            feedback: "Treats the symptom and misses a loose device.",
            next: "s1-antiarrhythmic", stateDelta: {"stability": -15} },
          {
            text: "Fluoroscopy alone",
            acceptable: true,
            feedback:
              "Will show the device has moved, but echo shows its relation to valves and chordae, which you need for planning.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "The device sits in the LV between the lateral wall and a papillary muscle. She is stable. What do you do?",
        options: [
          {
            text: "Leave it and anticoagulate",
            feedback:
              "A device in the LV threatens valves, provokes arrhythmia and may obstruct flow; it needs to come out.",
            next: "s3",
          },
          {
            text: "Surgical retrieval",
            acceptable: true,
            feedback:
              "Most reported Watchman embolisations to the LV have been managed surgically, and surgery is first line if the patient is unstable.",
            next: "s3",
          },
          {
            text: "Attempt percutaneous retrieval in a stable patient, with surgical backup",
            best: true,
            feedback:
              "This was chosen. Selected stable patients can be offered a percutaneous attempt.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "How would you retrieve it?",
        options: [
          {
            text: "Snare it directly inside the LV from the transseptal route",
            acceptable: true,
            feedback:
              "Possible, but grasping within the mitral apparatus risks chordal and leaflet injury, and transseptal snaring has failed in earlier reports.",
            next: "s4",
          },
          {
            text: "Free it with a catheter through a transseptal sheath, let it pass through the aortic valve, and snare it in the descending aorta through a large arterial sheath",
            best: true,
            feedback:
              "A curved transseptal sheath carried an ablation catheter used to free the device; it travelled into the descending aorta, where a triple-loop snare captured it and pulled it into a 16 Fr arterial sheath (pre-closed with sutures). TOE then showed no effusion and no new valve regurgitation.",
            next: "s4",
          },
          {
            text: "Pull it back across the mitral valve into the LA and out through the septal sheath",
            feedback:
              "Dragging a nitinol device with exposed anchors back across the mitral valve risks leaflet damage, and it may not fit the transseptal sheath.",
            next: "s3-pulled-across-mitral", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s4",
        prompt:
          "She recovers and goes home the next day on aspirin and apixaban. What is the longer-term plan?",
        options: [
          {
            text: "Repeat LAAO with a device whose anchoring suits the anatomy",
            best: true,
            feedback:
              "She later received an Amulet, a lobe-and-disc design chosen for the wider ostium and borderline depth rather than depth-dependent anchoring. Follow-up TEE showed a sealed device without thrombus.",
          },
          {
            text: "Repeat the same 21 mm device",
            feedback:
              "Sizing and anchoring may have contributed to embolisation; repeating the same choice risks a second event.",
          },
          {
            text: "Lifelong anticoagulation",
            acceptable: true,
            feedback:
              "Possible, but she had major GI bleeding on anticoagulation, which was the reason for LAAO in the first place.",
          },
        ],
      },
      {
        "id": "s1-antiarrhythmic",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: on amiodarone the ectopy persists, and the next morning echo shows the device in the LV outflow tract with a new gradient.",
        "prompt": "What should have been done first?",
        "options": [
          {
            "text": "Urgent echocardiography to check device position; now plan retrieval with surgical backup",
            "best": true,
            "feedback": "New ventricular ectopy after LAAO suggests embolisation until proven otherwise.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Increase the amiodarone",
            "feedback": "The ectopy is mechanical.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Fluoroscopy only",
            "acceptable": true,
            "feedback": "Fluoroscopy shows the device but not its relation to valves and outflow.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s3-pulled-across-mitral",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: as the device is pulled back towards the mitral valve it catches the subvalvular chords; acute severe MR develops.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Stop traction, support the circulation and call the surgeons for retrieval and valve repair",
            "best": true,
            "feedback": "Chordal entanglement is the reason devices are freed and allowed to pass forward rather than dragged back.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Pull harder to free it",
            "feedback": "This tears chords and worsens MR.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Snare it from the aorta while it is entangled",
            "feedback": "The device must be freed from the chords first.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "She recovered without neurological deficit and was discharged the next day on aspirin and apixaban, with haemoglobin monitored at 1 week, 4 weeks and 6 months. A later Amulet implantation was uncomplicated, and TEE showed a sealed device without thrombus.",
    learningPoints: [
      "Device embolisation can happen even when PASS criteria are met; most occur during or soon after the procedure.",
      "New ventricular ectopy or haemodynamic change after LAAO should prompt immediate imaging of the device.",
      "Percutaneous retrieval is preferred from the LA or aorta; retrieval from the LV is harder and surgery is often needed, especially if the patient is unstable.",
      "Turning an LV embolisation into an aortic one, then snaring in the descending aorta through a large sheath, is one percutaneous strategy.",
      "Choose the redo device to fit the anatomy (ostial width and depth).",
    ],
    refs: ["laao-consensus-2020"],
  },

  // ---------------------------------------------------------------------------
  // 16. PFO closure device embolisation: tunnel width sizing
  // ---------------------------------------------------------------------------
  {
    id: "pub-pfo-closure-device-embolisation",
    title: "PFO occluder lost to the abdominal aorta: sizing by tunnel width",
    trackId: "structural",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Peters AC, Ruggiero N, Datta T, et al. Device embolization after transcatheter patent foramen ovale closure: the importance of tunnel width assessment. JACC Case Rep. 2025;30(40):105837. doi:10.1016/j.jaccas.2025.105837",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12861683/",
    },
    summary:
      "A 40-year-old woman's 25 mm PFO occluder embolised to the abdominal aorta after closure at another hospital. At the redo procedure, 3D TOE showed a short tunnel but a 24 mm tunnel width with an atrial septal aneurysm; a 35 mm cribriform occluder closed it without residual shunt.",
    presentation:
      "40-year-old woman with a recent left middle cerebral artery stroke. Rhythm monitoring and thrombophilia testing were negative and TTE showed a PFO; a multidisciplinary team recommended closure.",
    findings: [
      "First procedure (another hospital): 25 mm Gore Cardioform occluder under intracardiac echo and fluoroscopy.",
      "The device could not be seen on post-procedure TTE.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Is PFO closure appropriate for her?",
        options: [
          {
            text: "Yes: PFO-associated stroke in a patient under 60 after other causes have been excluded",
            best: true,
            feedback:
              "SCAI guidance, cited by the authors, recommends closure over antiplatelet therapy alone for PFO-associated stroke in patients aged 18–60, and the European position paper supports closure in carefully selected patients.",
            next: "s2",
          },
          {
            text: "No: antiplatelet therapy alone",
            acceptable: true,
            feedback:
              "A valid choice for some after shared decision-making, but trials favour closure in well-selected patients.",
            next: "s2",
          },
          {
            text: "Lifelong anticoagulation",
            feedback: "Not the default without another indication.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "After closure the device cannot be seen on TTE. What do you do?",
        options: [
          {
            text: "Locate it with fluoroscopy and imaging of the circulation, then plan retrieval",
            best: true,
            feedback:
              "It was found in the abdominal aorta and retrieved percutaneously, with an arterial cut-down to remove it.",
            next: "s3",
          },
          {
            text: "Assume it is hidden by poor echo windows",
            feedback:
              "A device not seen on the septum must be presumed embolised until it has been located.",
            next: "s2-assumed-hidden", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s3",
        prompt:
          "She comes to you for a second attempt. 3D TOE: tunnel length 5 mm; tunnel height 11 mm (atrial septal aneurysm); tunnel width 24 mm at both the RA and LA openings. How do you size?",
        options: [
          {
            text: "By tunnel length, as manufacturer guidance suggests, which points to a 25 mm device again",
            feedback:
              "Probably how the first device was chosen. With a 24 mm-wide tunnel, a 25 mm device cannot anchor around the margins.",
            next: "s3-length-sizing", stateDelta: {"stability": -15} },
          {
            text: "By tunnel width, choosing discs larger than the width on both sides ('tunnel width oversizing')",
            best: true,
            feedback:
              "A 35 mm Amplatzer cribriform occluder was chosen. The authors acknowledge this goes beyond current sizing guidance.",
            next: "s4",
          },
          {
            text: "Refer for surgical closure",
            feedback: "Unnecessary when a correctly sized device can be used.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "You are choosing between a 35 mm PFO occluder (with a 25 mm LA disc) and a 35 mm cribriform device (both discs 35 mm). What matters before release?",
        options: [
          {
            text: "Both discs must exceed the tunnel width, and the atrial dimensions must accommodate the discs without impinging on the aortic sinus or the posterior LA wall",
            best: true,
            feedback:
              "The PFO occluder's smaller LA disc raised concern that the device could slip into the right heart. The atrial anteroposterior dimensions were checked, and after deployment the cribriform device sat well without impinging on the aorta or posterior wall.",
          },
          {
            text: "Choose the largest device available",
            feedback:
              "Discs that abut the aorta or atrial roof raise concern about erosion; size to the anatomy, not the maximum.", next: "s3-length-sizing", stateDelta: {"stability": -10} },
        ],
      },
      {
        "id": "s2-assumed-hidden",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: two days later she presents with abdominal pain and a cold left leg; CT shows the occluder lodged at the aortic bifurcation.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Urgent retrieval (percutaneous snare or surgery) and limb assessment; then re-plan closure",
            "best": true,
            "feedback": "A device that cannot be seen must be located immediately.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Anticoagulate and observe",
            "feedback": "An embolised device obstructing flow needs retrieval.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Repeat TTE",
            "feedback": "The diagnosis is made; the device needs removing.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s3-length-sizing",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: a 25 mm device again sits unstably across the wide tunnel and pulls through on a push-pull test.",
        "prompt": "What is the sizing principle here?",
        "options": [
          {
            "text": "Size by tunnel width: both discs must exceed it; recapture and choose a larger device",
            "best": true,
            "feedback": "A wide, short tunnel needs discs larger than its width on both sides.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Release it; it will settle",
            "feedback": "It embolised for the same reason before.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Choose the largest device available regardless of atrial size",
            "feedback": "Oversized discs can impinge on the aortic root and atrial roof.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "There was no residual right-to-left shunt on bubble study after deployment or at 6 months. At follow-up she had no recurrent stroke and no atrial arrhythmia.",
    learningPoints: [
      "Measure a PFO in three dimensions (length, height and width); a short tunnel can hide a wide defect.",
      "An atrial septal aneurysm should raise suspicion of a large, mobile defect needing a bigger device.",
      "Undersized devices embolise; confirm device position on imaging before discharge.",
      "Before release, check disc stability and clearance from the aortic sinus and atrial walls.",
    ],
    refs: ["pfo-position-2019", "respect-2017"],
  },

  // ---------------------------------------------------------------------------
  // 17. High-risk protected PCI: calcified LM, rotablation, VA-ECMO, BAV
  // ---------------------------------------------------------------------------
  {
    id: "pub-protected-lm-rotablation-ecmo-bav",
    title: "Calcified left main, severe AS and LVEF 30%: ECMO-protected rotablation",
    trackId: "pci-complex",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Ajmi I, Mahnkopf C, Brachmann J, et al. Rotablation of heavily calcified left main stenosis and aortic valve valvuloplasty under ECMO cardiopulmonary support. JACC Case Rep. 2020;2(15):2448–2454. doi:10.1016/j.jaccas.2020.10.015",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8304597/",
    },
    summary:
      "A 74-year-old man with ischaemic cardiomyopathy, occluded vein grafts, a subtotal calcified left main, severe AS and severe secondary MR was declined for redo surgery. Under elective VA-ECMO the team performed balloon aortic valvuloplasty and rotational atherectomy with left main stenting, followed by TAVI six weeks later.",
    presentation:
      "74-year-old man with decompensated heart failure (NYHA III). CABG two years earlier (LIMA to LAD, vein grafts to ramus and RCA) and tricuspid valve repair. COPD, chronic kidney disease, previous abdominal aortic aneurysm repair, peripheral arterial disease, hypertension, type 2 diabetes and hyperlipidaemia.",
    findings: [
      "Echo: severe AS (valve area 0.90 cm2 on TOE), severe secondary MR from posterior leaflet restriction, LVEF 30%.",
      "Angiography: heavily calcified subtotal left main stenosis; mid LAD occluded with a patent LIMA graft; occluded vein grafts to ramus and RCA (confirmed on CT); subtotal proximal non-dominant circumflex; a large ramus without a graft.",
      "CMR: fixed anterior and septal/posterolateral scar; viable inferior wall.",
      "EuroSCORE II 29.65%, STS 26%: redo CABG and valve surgery declined.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What is the overall strategy?",
        options: [
          {
            text: "Staged percutaneous treatment: protected left main PCI with balloon aortic valvuloplasty as a bridge, then TAVI",
            best: true,
            feedback:
              "This is what was done: valvuloplasty and left main PCI in one supported session, and TAVI six weeks later.",
            next: "s2",
          },
          {
            text: "TAVI first, then left main PCI",
            acceptable: true,
            feedback:
              "Some teams treat the valve first. With a subtotal calcified left main and LVEF 30%, rapid pacing and valve deployment without revascularisation or support would be hazardous.",
            next: "s2",
          },
          {
            text: "Medical therapy only",
            feedback:
              "Severe AS and a subtotal left main with symptomatic heart failure carry a poor prognosis untreated.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "Which circulatory support do you use for this high-risk PCI?",
        options: [
          {
            text: "Elective VA-ECMO",
            best: true,
            feedback:
              "Chosen for full support independent of rhythm (23 Fr femoral venous and 15 Fr femoral arterial cannulae, about 4.5 L/min). The authors judged an Impella insufficient given severe AS and the calcified left main. Remember that VA-ECMO raises LV afterload: watch for LV distension, especially with a stenotic aortic valve.",
            next: "s3",
          },
          {
            text: "Impella",
            acceptable: true,
            feedback:
              "Widely used for protected PCI, and crossing a stenotic valve is feasible in experienced hands, often after valvuloplasty. The authors preferred ECMO; other centres would reasonably differ.",
            next: "s3",
          },
          {
            text: "IABP",
            feedback: "Limited support; unlikely to carry him through rapid pacing and left main ischaemia.",
            next: "s3",
          },
          {
            text: "No support",
            feedback: "LVEF 30%, severe AS and a subtotal left main: a high risk of collapse.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Valvuloplasty is done under rapid pacing with a 22 mm balloon. Now the left main: heavily calcified and subtotal. How do you prepare it?",
        options: [
          {
            text: "Rotational atherectomy with a 1.5 mm burr, then high-pressure non-compliant balloons",
            best: true,
            feedback:
              "Rotablation at up to 180,000 rpm, then 3.5 and 4.0 mm NC balloons at 20–24 atm, allowed a stent to be delivered from the left main into the ramus, with final balloon optimisation into the LAD and a proximal optimisation with a 6.0 mm balloon. IVL was not available that day.",
          },
          {
            text: "Intravascular lithotripsy",
            acceptable: true,
            feedback: "A good alternative if a balloon can cross; it was not available here.",
          },
          {
            text: "Direct stenting",
            feedback: "Underexpansion and stent loss are likely in a subtotal calcified lesion.",
          },
        ],
      },
    ],
    outcome:
      "He remained stable throughout, and ECMO was removed at the end of the procedure. There were no complications; he went home on day 5 with improved aortic valve function and no pericardial effusion. TAVI was performed successfully 6 weeks later.",
    learningPoints: [
      "High-risk PCI needs a support plan matched to the patient: valve disease, LV function and the lesion all matter.",
      "VA-ECMO gives full support independent of rhythm but adds LV afterload; plan how you will detect and treat LV distension.",
      "In heavily calcified left main disease, modify the plaque with atherectomy or lithotripsy before stenting.",
      "Balloon valvuloplasty can bridge to TAVI in patients with severe AS who need PCI first.",
    ],
    refs: ["disrupt-cad3-2020"],
  },

  // ---------------------------------------------------------------------------
  // 18. Temporary pacing in inferior STEMI with CHB, RV perforation after wire removal, tamponade
  // ---------------------------------------------------------------------------
  {
    id: "pub-stemi-chb-pacing-wire-tamponade",
    title: "Inferior STEMI with complete heart block: tamponade after the pacing wire came out",
    trackId: "procedures-career",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Gabriel M, Vasiliadis I. Successful management of cardiac tamponade due to right ventricular perforation following temporary pacing wire removal after primary percutaneous coronary intervention at a district general hospital: a case report. Eur Heart J Case Rep. 2026;10(8):ytag590. doi:10.1093/ehjcr/ytag590",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13496324/",
    },
    summary:
      "At a UK district general hospital, a 62-year-old woman with inferior STEMI and complete heart block needed an emergency femoral pacing wire before primary PCI. Fifteen minutes after the wire came out she developed tamponade from a right ventricular perforation, confirmed by agitated saline echo, and was kept alive with drainage, autotransfusion and inotropes during transfer for surgical repair.",
    presentation:
      "Sudden central chest pain and collapse. Hypertension, prediabetes, hypercholesterolaemia, obesity (BMI 33.3), vitamin B12 deficiency and current smoking. Taking amlodipine and perindopril only; no previous antiplatelet, anticoagulant or statin therapy.",
    findings: [
      "On arrival in the laboratory: obtunded, hypotensive, HR 37–38/min in complete AV block, impalpable peripheral pulses, clear chest.",
      "ECG: inferior STEMI with complete heart block.",
      "No response to maximal atropine and isoprenaline.",
      "Haemoglobin 86 g/L (known B12 deficiency); creatinine 89 µmol/L.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "Complete heart block with shock, unresponsive to atropine and isoprenaline. What now?",
        options: [
          {
            text: "Emergency temporary transvenous pacing via the femoral vein under fluoroscopy, then primary PCI",
            best: true,
            feedback: "Pacing restored an adequate rate and PCI followed immediately.",
            next: "s2",
          },
          {
            text: "Transcutaneous pacing as a bridge",
            acceptable: true,
            feedback:
              "A reasonable immediate bridge, but often unreliable and poorly tolerated; in the laboratory a transvenous wire is quick to place.",
            next: "s2",
          },
          {
            text: "Proceed straight to PCI without pacing",
            feedback:
              "Reperfusion often restores conduction in inferior MI, but with a rate of 37 and impalpable pulses she needs a reliable rhythm now.",
            next: "s1-no-pacing", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s2",
        prompt:
          "Radial pulses are impalpable and the pacing sheath is in the right femoral vein. Which arterial access for PCI?",
        options: [
          {
            text: "Right femoral artery, on the same side as the venous sheath, keeping the left groin free for large-bore support",
            best: true,
            feedback:
              "This was the team's reasoning. The RCA was severely and diffusely diseased, and three overlapping stents from the posterior LV branch to the ostium gave TIMI 3 flow.",
            next: "s3",
          },
          {
            text: "Persist with radial access",
            feedback:
              "Radial-first is the standard (MATRIX), but with impalpable pulses and shock, delay matters; femoral access is appropriate here.",
            next: "s3",
          },
          {
            text: "Left femoral artery",
            acceptable: true,
            feedback: "Works, but uses the groin you may need for mechanical support.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "She is obtunded and cannot swallow safely. What antiplatelet strategy for a three-stent RCA?",
        options: [
          {
            text: "Bridge with an intravenous GP IIb/IIIa inhibitor (or cangrelor if available) and give an oral P2Y12 inhibitor once swallowing is safe",
            best: true,
            feedback:
              "She had pre-hospital aspirin, heparin and tirofiban as a bridge; prasugrel was given enterally once she was conscious with protective airway reflexes. Cangrelor was not available locally. The authors acknowledge that this potent platelet inhibition may have worsened the later haemopericardium.",
            next: "s4",
          },
          {
            text: "Aspirin alone until she can swallow",
            feedback: "Leaves a complex three-stent construct at high early risk of stent thrombosis.",
            next: "s4",
          },
          {
            text: "Crushed P2Y12 inhibitor by nasogastric tube now",
            acceptable: true,
            feedback:
              "Possible, but carries aspiration risk in an obtunded patient without a protected airway; the team avoided it.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "AV conduction returns during PCI. The pacing wire is removed and the venous sheath left in. About 15 minutes later she becomes hypotensive; bedside echo shows a large circumferential effusion (about 1.9 cm) with tamponade physiology. What now?",
        options: [
          {
            text: "Pericardiocentesis with a drain",
            best: true,
            feedback:
              "Fresh, non-clotting blood was drained with initial improvement, but it quickly reaccumulated.",
            next: "s5",
          },
          {
            text: "Fluids and inotropes only",
            feedback: "Tamponade needs drainage.",
            next: "s5",
          },
          {
            text: "Reinsert the pacing wire",
            feedback: "Conduction has recovered; the problem is bleeding.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt:
          "Blood keeps reaccumulating. Where is it coming from, and how do you find out quickly?",
        options: [
          {
            text: "Repeat angiography to exclude coronary perforation, then agitated saline echo: bubbles in the pericardial blood confirm a communication with the RV",
            best: true,
            feedback:
              "No coronary leak was found; peripherally injected agitated saline appeared in the effusion on subcostal views, confirming RV perforation.",
            next: "s6",
          },
          {
            text: "CT scan",
            acceptable: true,
            feedback:
              "Sensitive for perforation, but moving an unstable patient out of the laboratory is risky, and it was not feasible here.",
            next: "s6",
          },
          {
            text: "Keep draining and hope it stops",
            feedback: "Ongoing bleeding needs a diagnosis and a definitive plan.",
            next: "s5-keep-draining", stateDelta: {"stability": -20} },
        ],
      },
      {
        id: "s6",
        prompt: "There is no cardiac surgery on site. How do you keep her alive?",
        options: [
          {
            text: "Immediate consultant-to-consultant referral to the regional surgical centre; transfer with an open drain, autotransfusion of aspirated blood through the venous sheath, dobutamine, cross-matched blood and platelets, and a critical-care escort",
            best: true,
            feedback:
              "Decision-to-arrival time was about 60 minutes. At sternotomy a puncture near the RV apex was repaired with pledgeted sutures to avoid cutting through infarcted muscle.",
          },
          {
            text: "Stay on the unit and keep aspirating",
            feedback:
              "Persistent haemopericardium from a ventricular perforation usually needs surgical repair.", next: "s5-keep-draining", stateDelta: {"stability": -15} },
        ],
      },
      {
        "id": "s1-no-pacing",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: during wiring of the RCA she becomes asystolic for 8 seconds and then has a rate of 20 bpm with BP 50/30 mmHg.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Transcutaneous pacing immediately, then a femoral transvenous wire under fluoroscopy before continuing",
            "best": true,
            "feedback": "Unstable complete heart block unresponsive to drugs needs pacing before PCI.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Continue PCI quickly and hope reperfusion restores conduction",
            "feedback": "Asystole during PCI risks arrest before reperfusion.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "More atropine",
            "feedback": "Atropine has already failed.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s5-keep-draining",
        "kind": "consequence",
        "info": "Teaching branch, not part of the published report: after two hours of repeated aspiration on the unit, she is on two inotropes and has received six units of blood.",
        "prompt": "What is needed?",
        "options": [
          {
            "text": "Identify the source and transfer urgently for surgical repair with an open drain and autotransfusion",
            "best": true,
            "feedback": "Continuous bleeding from an RV perforation needs a surgeon.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Keep aspirating",
            "feedback": "This buys time but does not stop the bleeding.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Remove the drain to let it tamponade",
            "feedback": "Tamponade will kill her.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
    ],
    outcome:
      "Recovery was complicated by transient respiratory failure, transfusion-related acute lung injury, acute kidney injury and paroxysmal AF, all of which resolved. She was discharged on DAPT and secondary prevention. At 18 months she was asymptomatic in sinus rhythm with LVEF above 55% and no effusion, had stopped smoking and had completed cardiac rehabilitation.",
    learningPoints: [
      "Complete heart block in inferior STEMI is usually ischaemic and often recovers with reperfusion; pace if it causes haemodynamic compromise.",
      "Temporary wire perforation can declare itself after removal, not only at insertion: keep monitoring.",
      "A rapidly reaccumulating effusion needs a source: exclude coronary perforation, then agitated saline echo can show an RV communication at the bedside.",
      "Autotransfusion of pericardial blood via a venous sheath can sustain the circulation while surgery is arranged.",
      "Centres providing primary PCI without on-site surgery need clear escalation and transfer pathways.",
    ],
    refs: ["esc-acs-2023", "esc-pacing-2021", "matrix-2015"],
  },

  // ---------------------------------------------------------------------------
  // 19. No-reflow after rotablation and IVL
  // ---------------------------------------------------------------------------
  {
    id: "pub-calcified-lad-no-reflow",
    title: "No-reflow after rotablation and lithotripsy in a calcified LAD",
    trackId: "complications",
    stage: 4,
    provenance: {
      kind: "published",
      citation:
        "Prasad M, Sorajja N, Nathan S, et al. Supersaturated oxygen therapy as a treatment for no reflow. JACC Case Rep. 2025;30(3):103102. doi:10.1016/j.jaccas.2024.103102",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11830269/",
    },
    summary:
      "A 57-year-old woman with type 1 diabetes had a calcified proximal LAD and mid-LAD in-stent restenosis treated with NC balloons, rotational atherectomy and IVL. After stenting she developed chest pain, anterior ECG changes and TIMI 1 flow. Vasodilators helped little; 60 minutes of intracoronary supersaturated oxygen was followed by restored flow.",
    presentation:
      "57-year-old woman with type 1 diabetes and previous LAD, RCA and obtuse marginal stents, with a week of accelerating angina. Echo: LVEF 45% with mild apical hypokinesis.",
    findings: [
      "Calcified proximal LAD stenosis and restenosis of an older mid-LAD stent.",
      "Plan: balloon dilation and intravascular imaging, with calcium modification as needed.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "A 3.0 mm NC balloon at 24 atm has not fractured the calcium on IVUS. Next?",
        options: [
          {
            text: "Rotational atherectomy with a 1.5 mm burr",
            best: true,
            feedback:
              "Several passes at 170,000 rpm, during which she had mild chest pain and brief falls in blood pressure. A further NC balloon and IVL then fractured the calcium on IVUS, and IVL was also used in the restenotic mid-LAD stent before stenting.",
            next: "s2",
          },
          {
            text: "Intravascular lithotripsy first",
            acceptable: true,
            feedback: "A reasonable alternative when a balloon crosses; both were eventually used here.",
            next: "s2",
          },
          {
            text: "Stent anyway",
            feedback: "Unfractured calcium risks stent underexpansion.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "After stenting she has severe chest pain with anterior ECG changes, and angiography shows TIMI 1 flow in the LAD. What is your first step?",
        options: [
          {
            text: "Exclude a mechanical cause (dissection, thrombus, stent edge problem, air) before calling it no-reflow, then give vasodilators into the distal vessel",
            best: true,
            feedback:
              "No-reflow means poor flow without mechanical obstruction, so check for one first. The team followed a no-reflow algorithm with pharmacological vasodilators including nitroprusside, with limited improvement.",
            next: "s3",
          },
          {
            text: "Vasodilators through the guide catheter only",
            acceptable: true,
            feedback:
              "Better delivered through a microcatheter or aspiration catheter beyond the stent, so the drug reaches the microcirculation.",
            next: "s3",
          },
          {
            text: "Implant another stent",
            feedback: "Only if there is a mechanical lesion; stents do not treat microvascular obstruction.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Flow is still poor and she remains symptomatic. The centre has intracoronary supersaturated oxygen (SSO2), approved in the US as an adjunct after PCI for anterior STEMI. Is it reasonable to use it?",
        options: [
          {
            text: "Yes, as an off-label adjunct after optimising the stent result, accepting that evidence in no-reflow is limited to this report",
            best: true,
            feedback:
              "After stent optimisation, 60 minutes of SSO2 was followed by relief of symptoms and better flow. The rationale (treating microvascular obstruction) is plausible, but this was described as the first such use, the technology is not widely available in UK or European laboratories, and some authors declare industry relationships. Treat it as hypothesis-generating.",
          },
          {
            text: "No; nothing more can be done",
            feedback:
              "Even without SSO2, options remain: repeated distal vasodilators, support of blood pressure and, if haemodynamics deteriorate, mechanical support.",
          },
          {
            text: "Further stenting to improve flow",
            feedback: "Without a mechanical lesion, more stents do not help microvascular obstruction.",
          },
        ],
      },
    ],
    outcome:
      "Her symptoms resolved and LAD flow improved after the SSO2 infusion. At follow-up 10 days later she was doing well, and her ejection fraction had returned to normal.",
    learningPoints: [
      "Calcified lesions treated with atherectomy are a setting for slow flow and no-reflow; anticipate it.",
      "Before calling it no-reflow, exclude dissection, thrombus, air and stent problems.",
      "Deliver vasodilators distally through a microcatheter or aspiration catheter for the best effect.",
      "No-reflow reflects microvascular obstruction and carries a worse prognosis; current treatments are limited.",
      "Novel adjuncts reported in single cases are hypothesis-generating; weigh the evidence and declared interests.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 20. Elective RCA PCI: complication cascade with fatal outcome
  // ---------------------------------------------------------------------------
  {
    id: "pub-elective-rca-pci-complication-cascade",
    title: "Elective RCA PCI: when hazard, vulnerability and capacity collide",
    trackId: "complications",
    stage: 5,
    provenance: {
      kind: "published",
      citation:
        "Wagener M, Boeddinghaus J, Leibundgut G. When 3 fundamentals of disaster meet during elective PCI. JACC Case Rep. 2025;30(3):103126. doi:10.1016/j.jaccas.2024.103126",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11830253/",
    },
    summary:
      "A frail 74-year-old woman with very severe COPD had elective PCI of a calcified, tortuous RCA. A polymer-jacketed wire perforated the PDA and set off a cascade: electrical storm, stent thrombosis with no-reflow, vessel rupture from an oversized balloon, loss of a covered stent and a DES, and wire fracture. Each was managed, but she died of right heart failure. The authors set out what they would do differently.",
    presentation:
      "74-year-old woman referred for elective PCI after perfusion imaging showed inferior ischaemia with transient ischaemic dilatation. Type 2 diabetes, hypertension and smoking; severe peripheral arterial disease with iliac stenting; COPD GOLD stage IV; osteoporosis; unsteady gait.",
    findings: [
      "Right radial access.",
      "High-grade circumflex stenosis; serial high-grade mid-RCA stenoses in a tortuous, severely calcified vessel.",
      "A Sion Blue workhorse wire would not cross; a polymer-jacketed Sion Black crossed, followed by difficult 2.5 mm semi-compliant predilation.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The workhorse wire will not cross the tortuous calcified RCA. How do you escalate?",
        options: [
          {
            text: "Switch directly to a polymer-jacketed wire and predilate over it",
            feedback:
              "This is what happened; after difficult predilation the polymer wire had perforated the distal PDA. Polymer-jacketed wires increase the risk of distal perforation.",
            next: "s1-hydrophilic-balloon", stateDelta: {"stability": -20} },
          {
            text: "Escalate through a microcatheter, cross, then exchange back to a workhorse wire before any balloon work",
            best: true,
            feedback:
              "The authors' first hindsight lesson: this lowers the risk of distal perforation and leaves a microcatheter in place for rapid coil delivery if one occurs.",
            next: "s2",
          },
          {
            text: "Stop and revisit the indication",
            acceptable: true,
            feedback:
              "Given her frailty and end-stage COPD, reconsidering is reasonable; the authors stress screening for vulnerability before elective PCI.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "A distal PDA perforation is bleeding, and balloon occlusion in the PDA fails. What next?",
        options: [
          {
            text: "Coil the distal PDA through a microcatheter",
            best: true,
            feedback:
              "After the RCA was predilated to pass a parallel workhorse wire, four coils were placed through a microcatheter.",
            next: "s3",
          },
          {
            text: "Covered stent in the PDA",
            feedback: "Distal small vessels are not covered-stent territory.",
            next: "s3",
          },
          {
            text: "Full heparin reversal",
            feedback:
              "With complex PCI still in progress, reversal invites thrombosis, as the next step of this case shows.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "The prolonged PDA occlusion and a flow-limiting mid-RCA dissection trigger an ischaemic electrical storm, needing mechanical CPR and more than 10 shocks. Two DES restore flow, but acute stent thrombosis with no-reflow follows. The ACT had been kept low because of the perforation. What do you do?",
        options: [
          {
            text: "Bring the ACT back into range with more heparin",
            best: true,
            feedback:
              "An extra 5,000 U of heparin reversed the stent thrombosis. The authors' lesson: keep the ACT therapeutic while hardware is in the coronary, even after a distal wire perforation.",
            next: "s4",
          },
          {
            text: "Intracoronary vasodilators for no-reflow",
            feedback: "The no-reflow here was thrombotic; vasodilators alone will not fix it.",
            next: "s4",
          },
          {
            text: "Aspiration thrombectomy",
            acceptable: true,
            feedback: "Can help, but without adequate anticoagulation the thrombus will re-form.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "Contrast is still seeping into the myocardium and epicardial fat from the PDA, with only a minor effusion on echo. A 3.0 mm balloon is occluding the vessel. Do you upsize to 3.5 mm to seal better?",
        options: [
          {
            text: "Upsize to 3.5 mm",
            feedback:
              "This is what happened, and the vessel ruptured at the crux. The authors' lesson: size occlusion balloons 1:1 to the vessel.",
            next: "s4-oversized-rupture", stateDelta: {"stability": -20} },
          {
            text: "Keep 1:1 balloon sizing and use other sealing measures or close monitoring",
            best: true,
            feedback:
              "Balloon occlusion is meant to stop flow, not stretch the vessel. With no tamponade, further embolisation or watchful monitoring is safer than oversizing.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt:
          "A 3.0 × 24 mm covered stent sent to the rupture catches in the proximal DES and is stripped off its balloon; a 1.0 mm balloon will not pass for the small-balloon technique. A DES sent to crush it is also lost, and the wire becomes trapped and fractures. Femoral access is impossible because of severe iliofemoral disease. What can you do from the radial access?",
        options: [
          {
            text: "Snare the lost DES and wire fragment through the radial guide, improvising a snare if no dedicated one is available",
            best: true,
            feedback:
              "The guide was removed, flushed and reinserted; a self-made snare (a wire loop through a microcatheter, pinned in the guide with a balloon) recovered the distorted stent and wire fragment. A Gladius wire then passed the trapped covered stent, and after NC dilation a high-radial-force 4.0 mm DES crushed it against the wall.",
          },
          {
            text: "Leave everything and finish",
            feedback:
              "A loose stent and wire fragment in the proximal RCA risk embolisation and thrombosis.",
          },
        ],
      },
      {
        "id": "s1-hydrophilic-balloon",
        "kind": "consequence",
        "info": "Teaching branch: in the published case the polymer-jacketed wire perforated the distal PDA. Here, predilatation over it pushes the tip further into a small branch, and contrast appears in the pericardium.",
        "prompt": "What should the escalation have looked like?",
        "options": [
          {
            "text": "Cross with a microcatheter, then exchange back to a workhorse wire before any balloon work; now seal the distal perforation",
            "best": true,
            "feedback": "Hydrophilic wires are exchanged once the lesion is crossed, so their tips do not migrate during balloon work.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Continue predilating over the hydrophilic wire",
            "feedback": "The tip will migrate further distally.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give protamine",
            "feedback": "Reversal alone does not seal a wire exit.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-oversized-rupture",
        "kind": "consequence",
        "info": "Teaching branch: as in the published case, the upsized balloon ruptures the vessel; in this branch, brisk extravasation follows and BP falls.",
        "prompt": "What is the lesson, and what now?",
        "options": [
          {
            "text": "Keep 1:1 sizing; now tamponade with a correctly sized balloon and deliver a covered stent with a plan for delivery problems",
            "best": true,
            "feedback": "Oversized balloons in a damaged vessel convert a leak into a rupture.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Upsize again to 4.0 mm to seal it",
            "feedback": "This enlarges the rupture.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Reverse heparin with wires in place",
            "feedback": "Reversal before sealing risks thrombosis of the stents and vessel.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "The rupture stabilised and RCA flow was restored, but more than 40 minutes of cumulative CPR and poor ventilation with end-stage COPD led to right heart failure. A right-sided Impella was discussed and judged not purposeful given her comorbidities, uncertain neurological outcome and her expressed wishes. She died of cardiogenic shock.",
    learningPoints: [
      "Screen elective PCI candidates for vulnerability (frailty, severe lung disease, limited access) and weigh the risk against the expected gain.",
      "Escalate to polymer-jacketed wires through a microcatheter and swap back to a workhorse wire before balloon work.",
      "Keep the ACT therapeutic while hardware is in the coronary, even after a distal wire perforation.",
      "Size occlusion balloons 1:1; oversizing can turn a perforation into a rupture.",
      "Prepare lesions adequately before delivering stents or covered stents to avoid entrapment and loss.",
      "Know your bailout kit, including improvised snares, and plan alternative access in advance.",
    ],
    refs: ["ellis-1994"],
  },
];
