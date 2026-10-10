# Simulator calibration fact sheet

Sourced values for calibrating CathMaster simulators. Compiled 3 October 2026.

Rules for using this sheet:

- Every value below was read on the source page or document named next to it. Nothing was filled from memory.
- Anything marked **UNVERIFIED — do not use** could not be confirmed on a source page. Do not hard-code it. If a simulator needs such a value, take it from the confirmed alternative given in the same item, or leave it configurable and flag it in the UI.
- Confidence levels:
  - **High**: primary source (IFU or label, guideline, consensus document, or the original paper) read directly.
  - **Medium**: secondary peer-reviewed source, a summarised fetch of a primary source, or the primary sources disagree.
  - **Low**: non-peer-reviewed or methods-only source.
- Device values are manufacturer guidance for the labelled product and version. They are not clinical recommendations. Labels change between versions and regions, so recheck before any release that names a product.
- Where a PMC full text was read through the Europe PMC REST service, the DOI is given as the canonical link.

---

## 1. Edwards SAPIEN 3 / SAPIEN 3 Ultra / SAPIEN 3 Ultra RESILIA: native annulus sizing

| THV size | TEE annulus diameter | CT annulus area | CT area-derived diameter |
|---|---|---|---|
| 20 mm | 16–19 mm | 273–345 mm² | 18.6–21 mm |
| 23 mm | 18–22 mm | 338–430 mm² | 20.7–23.4 mm |
| 26 mm | 21–25 mm | 430–546 mm² | 23.4–26.4 mm |
| 29 mm | 24–28 mm | 540–683 mm² | 26.2–29.5 mm |

- **Source:** FDA-hosted IFU, Edwards SAPIEN 3, SAPIEN 3 Ultra and SAPIEN 3 Ultra RESILIA THV System with Commander Delivery System, Table 4 (label dated 2025-04). https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140031S182D.pdf
- **Same table in the Edwards OUS eIFU:** https://eifu.edwards.com/eifu/5970f1a946e0fb00015e5f4c/DOC-0586309A.pdf
- **Source type:** IFU.
- **Confidence:** High. The table was rechecked directly in the FDA PDF.
- **Caveats:**
  - Adjacent size ranges overlap.
  - No perimeter range is given. Perimeter for SAPIEN sizing is **UNVERIFIED — do not use**.
  - In this label, SAPIEN 3 Ultra (9750TFX) is listed only in 20, 23 and 26 mm. The 29 mm valve is SAPIEN 3 (9600TFX) or Ultra RESILIA (9755RSL).
  - Valve heights in the same label are 15.5, 18, 20 and 22.5 mm for sizes 20, 23, 26 and 29.

## 2. Medtronic Evolut PRO+ / Evolut FX / Evolut FX+: annulus criteria

| Valve | Annulus diameter | Annulus perimeter (π × diameter) |
|---|---|---|
| 23 mm | 18–20 mm (17 mm for TAV-in-SAV or TAV-in-TAV only) | 56.5–62.8 mm (53.4 mm for TAV-in-SAV or TAV-in-TAV only) |
| 26 mm | 20–23 mm | 62.8–72.3 mm |
| 29 mm | 23–26 mm | 72.3–81.7 mm |
| 34 mm | 26–30 mm | 81.7–94.2 mm |

- **Source:** FDA-hosted IFU, combined Evolut PRO+/FX/FX+ labelling (P130021/S174, dated 2025-08-08), Table 2 "Patient anatomical criteria". The table is identical for EVPROPLUS, EVOLUTFX and EVFXPLUS models. https://www.accessdata.fda.gov/cdrh_docs/pdf13/P130021S174D.pdf
- **Access figures (Medtronic FX+ page):** https://www.medtronic.com/en-us/l/c/cardiovascular/evolut-fx-plus.html
  - Minimum vessel diameter is 5 mm for the 23–29 mm systems and 6 mm for the 34 mm system.
  - 23–29 mm systems: 18 Fr introducer, or 14 Fr-equivalent inline sheath.
  - 34 mm system: 22 Fr introducer, or 18 Fr-equivalent inline sheath.
- **Source type:** IFU, plus manufacturer product page for access.
- **Confidence:** High. The table was rechecked directly in the FDA PDF.
- **Caveats:**
  - Perimeter is defined in the label as π × diameter. It is not an independent CT-perimeter table.
  - For valve-in-valve, the criteria apply to the failed valve's measured inner diameter.
  - Sinus of Valsalva width and sinus height criteria for Evolut: **UNVERIFIED — do not use**.

## 3. TAVI coronary obstruction risk markers

**Main source:** SCCT 2019 TAVI CT expert consensus. Blanke P et al., JACC Cardiovasc Imaging 2019;12:1–24, https://doi.org/10.1016/j.jcmg.2018.12.003. Full text read at https://secardiologia.es/images/grupos-trabajo/cardiorm-cardiotc/tc/GuidelineTC-on-TAVI-TAVR-JACC-CVI-2019.pdf. Source type: consensus. Confidence: high.

- Coronary ostial height <12 mm from the annulus, together with sinus of Valsalva mean diameter <30 mm, "connote an increased risk of coronary occlusion".
- The document states there is no absolute threshold that contraindicates TAVI, because specificity is low.
- Valve-in-valve: a virtual transcatheter valve-to-coronary distance (VTC) <4 mm should be flagged as high risk. VTC is assessed for the RCA and left main when the surgical valve posts reach or pass the ostia.

**Supporting registry data:** Ribeiro HB et al., JACC 2013;62:1552–62, https://doi.org/10.1016/j.jacc.2013.07.040 (abstract read on PubMed, https://pubmed.ncbi.nlm.nih.gov/23954337/). Source type: peer-reviewed paper. Confidence: high.

| Measure | Obstruction cases | Controls |
|---|---|---|
| Incidence | 44 of 6,688 (0.66%) | — |
| Left coronary height | 10.6 ± 2.1 mm | 13.4 ± 2.1 mm |
| Sinus of Valsalva diameter | 28.1 ± 3.8 mm | 31.9 ± 4.1 mm |

These are means only. The abstract gives no cut-off.

**Valve-in-valve cut-off:** VIVID registry, Ribeiro HB et al., Eur Heart J 2018;39:687–695, https://doi.org/10.1093/eurheartj/ehx455. Source type: peer-reviewed paper. Confidence: high.

- VTC was 3.24 ± 2.22 mm in obstruction cases against 6.30 ± 2.34 mm in controls.
- The optimal cut-off was 4 mm (AUC 0.943).
- Obstruction occurred in 37 of 1,612 cases (2.3%).

**Older consensus:** SCCT 2012, Achenbach S et al., J Cardiovasc Comput Tomogr 2012;6:366–80, read at https://cdn.ymaws.com/scct.org/resource/resmgr/Docs/Fellows&Residents_of_SCCT/Guidelines_TAVI_TAVR.pdf. Source type: consensus. Confidence: high for the wording.

- A coronary ostial distance of ≥10–14 mm is recommended for the Edwards SAPIEN valve.
- Sinus of Valsalva width should be ≥30 mm, particularly for CoreValve.
- The document itself says these recommendations are not based on scientific data.

**Review-level grading:** Arévalos V et al., REC Interv Cardiol 2024;6:117–126, https://recintervcardiol.org/en/review-articles/coronary-obstruction-following-transcatheter-aortic-valve-replacement-risk-evaluation-and-preventive-strategies. Source type: peer-reviewed review. Confidence: medium.

- Coronary height <10 mm is described as maximum risk.
- VTC >6 mm is low risk, 4–6 mm borderline, and <4 mm maximum risk.

**For the simulator:** use height <12 mm plus SOV <30 mm as the "increased risk" flag, and VTC <4 mm as high risk for valve-in-valve. A guideline-level "<10 mm = maximum risk" threshold is **UNVERIFIED — do not use** as a guideline value; it is review-level only.

## 4. Impella CP and Impella 5.5

**Impella CP**

| Parameter | Value | Source | Type | Confidence |
|---|---|---|---|---|
| Pump and catheter size | 14 Fr pump on a 9 Fr drive catheter, 6 Fr pigtail | FDA SSED P140003/S018 (Feb 2018), https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140003S018B.pdf | Regulatory (SSED) | High |
| Sheath | 14 Fr peel-away introducer | Same SSED | Regulatory | High |
| Minimum vessel | 4.67 mm | Abiomed Impella CP step-by-step insertion guide IMP-653.v2 (2020), https://cce.upmc.com/sites/default/files/Impella%20CP%20Step-by-Step%20Insertion%20Guide%20Handheld%20(2).pdf | Manufacturer guide | Medium |
| Inlet position | About 3.5 cm from the aortic annulus to mid-inlet, radiopaque marker at the annulus; a further 5.5 cm from mid-inlet to pigtail tip | Review, Interv Cardiol Rev 2021, https://doi.org/10.15420/icr.2021.11; also Baldetti et al., Cardiac Interventions Today 2023, https://citoday.com/articles/2023-july-aug/technical-tips-for-inserting-and-positioning-the-impella-device | Peer-reviewed review | Medium-high |

**Impella CP maximum flow: the sources disagree. Label whichever value is used.**

| Value | Source | Confidence |
|---|---|---|
| 3.7 L/min maximum average flow | Interv Cardiol Rev 2021, Table 1 (DOI above) | Medium |
| Up to 4.1 L/min at P9 | Al-Rashid et al., EuroIntervention 2015, https://eurointervention.pcronline.com/article/tools-and-techniques-clinical-percutaneous-catheter-based-left-ventricular-support-using-the-impella-cp | Medium |
| Sustained peak up to 4.3 L/min (CP with SmartAssist) | Abiomed guide above | Medium |

- **Caveats:**
  - The official Impella CP IFU could not be read (FDA PDFs over 10 MB). The IFU wording for maximum flow and inlet distance is **UNVERIFIED — do not use** as an IFU figure.
  - An automated summary of the FDA SSED reported "3.5 L/min" and "2–3 cm". Neither appears in the document text, so neither should be used.

**Impella 5.5 with SmartAssist**

- **Source:** FDA-hosted IFU and Clinical Reference Manual (2020, EUA-era), https://www.fda.gov/media/140766/download
- **Source type:** IFU. **Confidence:** High.
- **Access:** surgical cut-down to the axillary artery.
  - The axillary insertion kit includes a 23 Fr × 6 cm peel-away introducer and graft locks.
  - A 10 mm × 20 cm vascular graft is recommended (not supplied).
- **Dimensions:** cannula 21 Fr, motor 19 Fr, catheter shaft 9 Fr.
- **Maximum flow:** 5.5 L/min.
- **Inlet position:** about 5.0 cm below the aortic valve. A 2021 review gives 5.5 cm from annulus to mid-inlet; use the IFU figure.
- **Duration:** up to 14 days in the US, 30 days in the EU.
- **Caveat:** newer label versions may differ.

## 5. Intra-aortic balloon pump

**Balloon volume by patient height.** The bands are manufacturer-specific, so name the brand in the simulator.

| Manufacturer chart | Height | Balloon |
|---|---|---|
| Getinge Cardiosave quick reference guide (ANZ, ©2023, OUS) | <152 cm (<5'0") | 30 cc |
| | 152–162 cm (5'0"–5'4") | 40 cc |
| | ≥162 cm (≥5'4") | 50 cc |
| Teleflex Arrow IAB catheter brochure MC-000164 Rev 5 (03/2025) | 147–162 cm (4'10"–5'4"), BSA <1.8 m² | 30 cc |
| | 162–182 cm (5'4"–6'0"), BSA >1.8 m² | 40 cc |
| | >173 cm (>5'8"), BSA >1.8 m² | 50 cc |

- **Sources:**
  - Getinge: https://www.getinge.com/dam/hospital/documents/english/cardiosave-iabp-operation-transport-quick-reference-guide-anz-94434-en.pdf
  - Teleflex: https://irc.teleflex.com/wp-content/uploads/2025/03/MC-000164-Rev-5-Interventional-MCS-IAB-Catheter-Brochure.pdf
- **Source type:** manufacturer guidance. Both are marked as guidance only and refer to the IFU.
- **Confidence:** High, as each manufacturer's own chart.
- **Caveats:**
  - Getinge's 30, 40 and 50 cc rows refer to Mega/Sensation Plus catheters.
  - An older Getinge/Maquet booklet (2016, third-party copy, https://www.flightforlife.org/wp-content/uploads/2023/09/FFL-cardiosave-reference-1.pdf) also lists standard-volume balloons:
    - 25 cc for <152 cm
    - 34 cc for 152–162 cm
    - 40 cc for 162–183 cm
  - The Teleflex 40 cc and 50 cc bands overlap.

**Tip position**

| Landmark | Source | Type | Confidence |
|---|---|---|---|
| Tip about 1–2 cm below (distal to) the origin of the left subclavian artery; avoid occluding the coeliac and renal arteries | Insightra Ultra IAB IFU D02-0161-001 Rev G, https://insightra.com/wp-content/uploads/2025/03/D02-0161-Ultra-IAB-IFU-Rev-G-English-Only.pdf | IFU | High |
| Tip 2 cm above the carina placed it 1.5–3.5 cm distal to the left subclavian origin in 95.3% of patients; the aortic knob was unreliable in 16% | Kim et al., Anesth Analg 2007, https://doi.org/10.1213/01.ane.0000278086.23266.35 | Peer-reviewed paper | High |
| Tip at the 2nd intercostal space, just above the left main bronchus; lower end of the balloon above the renal arteries | LITFL Critical Care Compendium (Nickson, Nov 2020), https://litfl.com/intra-aortic-balloon-pump-ccc/ | Educational web resource | Medium |

- "3rd intercostal space" as a landmark: **UNVERIFIED — do not use**.

**Timing rules**

- **Source:** Getinge Cardiosave guides above (2023 ANZ quick reference; 2016 booklet).
- **Source type:** manufacturer guidance. **Confidence:** High.

| Rule | Description |
|---|---|
| Correct inflation | At the dicrotic notch, seen as a sharp "V" |
| Correct deflation | Just before systolic ejection. Assisted end-diastolic pressure and assisted systolic pressure fall below unassisted values |
| Early inflation | Before aortic valve closure. Possible premature valve closure, raised LVEDV, LVEDP and PCWP, raised wall stress and afterload, aortic regurgitation, raised myocardial oxygen demand |
| Late inflation | Well after valve closure, with no sharp "V". Suboptimal augmentation and coronary perfusion |
| Early deflation | Sharp drop after augmentation; assisted EDP equal to or below unassisted EDP. Possible retrograde coronary and carotid flow, angina, poor afterload reduction |
| Late deflation | After aortic valve opening; assisted EDP equal to or above unassisted EDP, with a prolonged rise of assisted systole. Little or no afterload reduction, raised myocardial oxygen demand, balloon may impede LV ejection |

## 6. Adult VA-ECMO

**Main source:** ELSO Interim Guidelines for VA-ECMO in Adult Cardiac Patients. Lorusso R et al., ASAIO J 2021;67:827–844, https://doi.org/10.1097/MAT.0000000000001510. Full text read at https://www.biomedsimulation.com/wp-content/uploads/2025/04/ELSO_Adult_Cardiac_VA_ECMO_Guidelines_2021.pdf. Source type: consensus guideline. Confidence: high.

- **Arterial (return) cannula:** a 15–17 Fr cannula is usually adequate. 19 or 21 Fr may be needed in rare scenarios such as sepsis.
- **Distal perfusion cannula:**
  - Short 6–8 Fr armoured cannula, targeting at least 100 mL/min.
  - Limb NIRS should stay above 50%, preferably above 60%, with less than 20% difference between legs.
  - With 15–17 Fr arterial cannulas, a distal perfusion cannula may not always be needed.
- **Venous drainage:** right femoral vein preferred, with the drainage tip at the SVC/RA junction.
- **Flow target:** no fixed number. Flow should be "the lowest flow, which provides adequate organ perfusion".
- **Weaning:**
  - Consider weaning when pulse pressure is >10 mmHg and MAP >65 mmHg at 2–2.5 L/min of ECMO flow.
  - Reduce flow by 500 mL every 5–10 minutes.
  - Run the trial at a minimum of 1 L/min.

**Circuit design:** ELSO General Guidelines for all ECLS Cases, v1.4 (Aug 2017), https://www.elso.org/portals/0/elso%20guidelines%20general%20all%20ecls%20version%201_4.pdf. Source type: consensus guideline. Confidence: high.

- The cardiac support circuit is designed for 3 L/m²/min; for adults, 60 mL/kg/min.
- Venous saturation above 70% is the best indicator of adequate perfusion.

**Venous drainage cannula size:**

- A guideline-level Fr size is **UNVERIFIED — do not use**. It is not stated in the ELSO 2021 VA guideline or the ELSO 2022 circuit guideline.
- The only sourced figure is from a bench study: Wickramarachchi et al., Perfusion 2025, https://doi.org/10.1177/02676591241256502. Source type: peer-reviewed paper. Confidence: medium-low.
  - It tested 21, 23 and 25 Fr multistage drainage cannulas.
  - It notes that 19–25 Fr cannulas were "traditionally" chosen.
- A cardiac index flow target other than the 3 L/m²/min circuit-design figure: **UNVERIFIED — do not use**.

## 7. Watchman FLX / FLX Pro and Amulet

**Watchman FLX Pro and FLX: device selection by maximum LAA ostium width (TEE)**

| Max ostium width | Device |
|---|---|
| 14.0–18.0 mm | 20 mm |
| 16.8–21.6 mm | 24 mm |
| 18.9–24.3 mm | 27 mm |
| 21.7–27.9 mm | 31 mm |
| 24.5–31.5 mm | 35 mm |
| 28.0–36.0 mm | 40 mm (FLX Pro only) |

- **Sources:**
  - Boston Scientific WATCHMAN FLX Pro eIFU, Table 67: https://www.bostonscientific.com/content/dam/elabeling/ic/watchman-flx/51750467-01A_WATCHMAN_FLXPro_eIFU_EN_s.pdf
  - FDA label P130013/S074, Table 78: https://www.accessdata.fda.gov/cdrh_docs/pdf13/P130013S074D.pdf
- **Source type:** IFU. **Confidence:** High.
- **Usable ostium width:**
  - FLX Pro: 14.0–36.0 mm, six sizes from 20 to 40 mm.
  - FLX: 14.0–31.5 mm, sizes 20 to 35 mm.
- **LAA depth:** about half the labelled implant diameter or longer.
- **Release criteria (PASS):** Position, Anchor, Size (compression), Seal (no leak >5 mm).

**Compression**

- A compression percentage stated in the IFU: **UNVERIFIED — do not use**. Neither IFU states one.
- Recommended range 10–30% (mean achieved 19.2 ± 7.1%): ICE LAA study, Nielsen-Kudsk et al., JACC Cardiovasc Interv 2023, https://doi.org/10.1016/j.jcin.2022.10.024. Source type: peer-reviewed paper with manufacturer co-authors. Confidence: medium-high.
- The IFU sizing bands match 10–30% compression arithmetically (for example 20 × 0.7 = 14 and 20 × 0.9 = 18). This is a derived observation, not a stated rule.

**Amulet**

- **Source:** FDA IFU P200049, https://www.accessdata.fda.gov/cdrh_docs/pdf20/P200049C.pdf
- **Source type:** IFU. **Confidence:** High.
- **Sizing principle:**
  - Measure the landing zone, defined as a minimum of 10–12 mm inside the LAA orifice.
  - Use the maximum landing-zone value on 2D TEE or angiography, and the mean value on 3D TEE or CT.
  - Confirm that the orifice is smaller than the device disc.

| Landing zone | Measured at (from orifice) | Device (lobe) | Disc | Lobe length | Sheath |
|---|---|---|---|---|---|
| 11–13 mm | 10 mm | 16 mm | 22 mm | 7.5 mm | 12 or 14 Fr |
| 13–15 mm | 10 mm | 18 mm | 24 mm | 7.5 mm | 12 or 14 Fr |
| 15–17 mm | 10 mm | 20 mm | 26 mm | 7.5 mm | 12 or 14 Fr |
| 17–19 mm | 10 mm | 22 mm | 28 mm | 7.5 mm | 12 or 14 Fr |
| 19–22 mm | 12 mm | 25 mm | 32 mm | 10 mm | 14 Fr |
| 22–25 mm | 12 mm | 28 mm | 35 mm | 10 mm | 14 Fr |
| 25–28 mm | 12 mm | 31 mm | 38 mm | 10 mm | 14 Fr |
| 28–31 mm | 12 mm | 34 mm | 41 mm | 10 mm | 14 Fr |

## 8. MitraClip

**Transseptal puncture height**

| Value | Source | Type | Confidence |
|---|---|---|---|
| 4.0–5.0 cm above the annulus (4-chamber view), mid-bicaval in SVC–IVC tenting, posterior in short-axis tenting | Abbott MitraClip G4 Procedural Positioning and Imaging Guide MAT-2005413 v1.0 (©2020, OUS), https://www.structuralheart.abbott/int/fileadmin/content/Solutions-Products/Mitraclip/G4_Procedural_Positioning_and_Imaging_Guide_MAT-2005413_v1.0.pdf | Manufacturer guide | High |
| Mid-fossa, posterior, 4.0–4.5 cm above the MR pathology | ACC TAVR Handbook ch. 26 (Gin, Partida, Elmariah, Sakhuja, 2018), https://www.acc.org/~/media/Non-Clinical/Files-PDFs-Excel-MS-Word-etc/Membership/TAVR-Handbook/Chapter-26-Step-by-step-MitraClip-FNL-March-2-2018.pdf | Textbook chapter | Medium-high |
| At least 4 cm in degenerative MR; 3 cm acceptable in functional MR; posterior | Russo et al., EuroIntervention 2021, https://eurointervention.pcronline.com/article/transseptal-puncture-procedural-guidance-challenging-situations-and-complications-management | Peer-reviewed expert review | High |
| 4–5 cm in organic MR; about 3.5 cm in functional MR | Ramlawi et al., Ann Cardiothorac Surg 2018, https://www.annalscts.com/article/view/16552/16843 | Peer-reviewed review | Medium |

- **For the simulator:** target about 4.0–4.5 cm (at least 4 cm), posterior and mid-superior. Lower heights are acceptable in functional MR.
- **Caveats:**
  - The ACC handbook measures height from the MR pathology rather than the annulus, so it is higher for prolapse or flail.
  - The FDA MitraClip NT IFU gives no numeric height: https://www.accessdata.fda.gov/cdrh_docs/pdf10/P100009S028D.pdf

**Post-procedural mean gradient**

| Value | Source | Type | Confidence |
|---|---|---|---|
| Invasive mean gradient >5 mmHg at implantation predicted worse long-term outcome (HR 2.3); echo cut-off in the same study 4.4 mmHg | Neuss et al., JACC Cardiovasc Interv 2017, https://doi.org/10.1016/j.jcin.2016.12.280 | Peer-reviewed paper | Medium |
| >4.4 mmHg predictive in degenerative MR but not in functional MR | Patzelt et al., JAHA 2019, https://doi.org/10.1161/JAHA.118.011366 | Peer-reviewed paper | Medium |
| Mean gradient <5 mmHg and residual valve area >4 cm² as conditions for adding a clip | US Cardiology Review 2022, https://doi.org/10.15420/usc.2022.11 | Peer-reviewed review | Medium |

- **Caveats:**
  - The FDA IFU says only to assess the mean gradient before deployment. It lists MVA ≥4.0 cm² as an anatomical criterion.
  - A guideline or consensus-defined ">5 mmHg" threshold: **UNVERIFIED — do not use** as a guideline value. Use >5 mmHg as a cohort-derived threshold of concern.

## 9. SCAI SHOCK stages (2022 update)

- **Sources:**
  - SCAI Shock Classification Bedside Checklist (2022): https://www.scai.org/sites/default/files/2022-04/SCAI%20SHOCK%20Bedside%20Checklist%202022.pdf
  - Naidu SS et al., J Soc Cardiovasc Angiogr Interv 2022;1:100008, https://doi.org/10.1016/j.jscai.2021.100008 (co-published in J Am Coll Cardiol 2022;79:933–946)
- **Source type:** consensus. **Confidence:** High.

| Stage | Definition (checklist wording) | Haemodynamic markers on the checklist |
|---|---|---|
| A, At risk | Not currently experiencing signs or symptoms of CS, but at risk for its development | SBP >100 mmHg or at baseline; CI ≥2.5 (if acute); CVP ≤10; PCWP ≤15; PA saturation ≥65% |
| B, Beginning CS | Clinical evidence of haemodynamic instability without hypoperfusion | SBP <90, MAP <60, or >30 mmHg drop from baseline; HR ≥100 |
| C, Classic CS | Hypoperfusion requiring intervention (pharmacological or mechanical) beyond volume resuscitation | CI <2.2; PCWP >15; lactate ≥2 |
| D, Deteriorating | Failure of initial support strategy to restore perfusion | Any stage C marker plus escalating dose or number of pressors, or addition of MCS |
| E, Extremis | Acute or impending circulatory collapse | Profound hypotension despite maximal support; bolus vasopressors; lactate ≥8; CPR; pH <7.2 |

- **Arrest modifier (A):** cardiac arrest with concern for anoxic brain injury. In the paper it applies only to comatose patients (GCS <9, or not following commands).
- **Caveats:**
  - Stage D requires an adequate trial of initial support, which involves "some element of time".
  - The paper's full table is an image. The checklist reproduces it.

## 10. Cardiac power output and PAPi

**Cardiac power output**

- **Formula:** CPO (W) = MAP × CO / 451.
- **Source:** Fincke R et al., J Am Coll Cardiol 2004;44:340–8, https://doi.org/10.1016/j.jacc.2004.03.060 (abstract, https://pubmed.ncbi.nlm.nih.gov/15261929/).
- **Source type:** peer-reviewed paper. **Confidence:** High.

| CPO threshold | Context | Source | Confidence |
|---|---|---|---|
| ≤0.53 W | Strongest predictor of in-hospital mortality in the SHOCK registry analysis | Fincke 2004 as tabulated in Kosyakovsky LB et al., JACC Adv 2025, https://doi.org/10.1016/j.jacadv.2025.101964; used as an established cut-off by Mendoza et al., Am Heart J 2007;153:366, https://doi.org/10.1016/j.ahj.2006.11.014 | Medium (the Fincke abstract gives no cut-off) |
| <0.6 W | Predictor of mortality in the National Cardiogenic Shock Initiative | Basir MB et al., Catheter Cardiovasc Interv 2019;93:1173, https://doi.org/10.1002/ccd.28307 | High |

- "<0.6 W from Fincke 2004": **UNVERIFIED — do not use**. 0.6 W is the NCSI figure.

**Pulmonary artery pulsatility index**

- **Formula:** PAPi = (PA systolic − PA diastolic) / RA pressure.
- **Source:** Kosyakovsky 2025, Table 4 (DOI above).
- **Source type:** peer-reviewed review. **Confidence:** High.

| PAPi threshold | Context | Source | Confidence |
|---|---|---|---|
| ≤0.9 | Acute inferior MI: 100% sensitivity and 98.3% specificity for in-hospital death or need for percutaneous RV support (n = 20) | Korabathina R et al., Catheter Cardiovasc Interv 2012;80:593, https://doi.org/10.1002/ccd.23309 | High |
| <1.85 | RV failure after LVAD: sensitivity 94%, specificity 81% | Morine KJ et al., J Card Fail 2016;22:110–6, https://doi.org/10.1016/j.cardfail.2015.10.019 | High |
| 2.0 | Optimal threshold for RV failure after LVAD (an erratum exists and was not read) | Kang G et al., J Heart Lung Transplant 2016;35:67–73, https://doi.org/10.1016/j.healun.2015.06.009 | Medium |
| <1.0 at 24 h | Independent predictor of 30-day mortality in cardiogenic shock | Tehrani 2019 as tabulated in Kosyakovsky 2025 | Medium (secondary) |

## 11. Fujino OCT calcium score

- **Source:** Fujino A et al., EuroIntervention 2018;13:e2182–e2189, https://doi.org/10.4244/EIJ-D-17-00962. Full text: https://eurointervention.pcronline.com/article/a-new-optical-coherence-tomography-based-calcium-scoring-system-to-predict-stent-underexpansion
- **Source type:** peer-reviewed paper. **Confidence:** High.

| Criterion | Points |
|---|---|
| Maximum calcium angle >180° | 2 |
| Maximum calcium thickness >0.5 mm | 1 |
| Calcium length >5 mm | 1 |

- **Maximum score:** 4.
- **Validation:** scores 0–3 had excellent stent expansion. A score of 4 had poor stent expansion (96% vs 78%, p<0.01).
- **Caveats:**
  - Underexpansion was defined as stent expansion <70%.
  - The ROC-optimal cut-offs were 188°, 0.75 mm and 7.1 mm; the score uses rounded versions.
  - The score is assessed on the single largest calcium deposit.

## 12. EAPCI 2018 intracoronary imaging consensus: stent optimisation

- **Source:** Räber L et al., Eur Heart J 2018;39:3281–3300, https://doi.org/10.1093/eurheartj/ehy285. Co-published in EuroIntervention 2018;14:656–677; text read at https://eurointervention.pcronline.com/article/clinical-use-of-intracoronary-imaging-part-1-guidance-and-optimization-of-coronary-interventions-an-expert-consensus-document-of-the-european-association-of-percutaneous-cardiovascular-interventions
- **Source type:** consensus. **Confidence:** High.

| Criterion | Consensus wording |
|---|---|
| Expansion | Relative stent expansion >80% (MSA divided by average reference lumen area) |
| MSA, non-left main | >5.5 mm² by IVUS, >4.5 mm² by OCT |
| MSA, left main (IVUS) | >7 mm² distal left main; >8 mm² proximal left main |
| Malapposition | Acute malapposition <0.4 mm axial distance with longitudinal extension <1 mm should not be corrected. The paper notes this cut-off requires prospective validation |
| Edge dissection | Lateral extension >60°, longitudinal extension >2 mm, involvement of medial or adventitial layers, residual plaque burden, and location distal to the stent increase risk. The take-home figure's acceptable dissection is <60°, intima-only and <2 mm long |
| Edge / landing zone | Plaque burden <50% at the stent edge and no lipid pool; avoid landing in residual plaque burden >50% |
| Tissue protrusion | No extensive protrusion |

- **Caveats:**
  - Malapposition is framed as the tolerable limit, not as a ">0.4 mm" trigger.
  - A dissection length of ">3 mm": **UNVERIFIED — do not use**. Only >2 mm appears.

## 13. Left main IVUS minimal stent area ("5-6-7-8")

| Segment | MSA cut-off predicting angiographic in-stent restenosis |
|---|---|
| Ostial LCx | 5.0 mm² |
| Ostial LAD | 6.3 mm² |
| Polygon of confluence | 7.2 mm² |
| Left main above the polygon of confluence | 8.2 mm² |

- **Source:** Kang SJ, Ahn JM, Song H, et al. Comprehensive intravascular ultrasound assessment of stent area and its impact on restenosis and adverse cardiac events in 403 patients with unprotected left main disease. Circ Cardiovasc Interv 2011;4:562–9. https://doi.org/10.1161/CIRCINTERVENTIONS.111.964643 (abstract, https://pubmed.ncbi.nlm.nih.gov/22045969/)
- **Source type:** peer-reviewed paper. **Confidence:** High.
- **Additional result:** underexpansion in at least one segment carried an adjusted MACE HR of 5.56.
- **Caveats:**
  - Single Korean centre, sirolimus-eluting stents, 9-month angiographic restenosis endpoint.
  - The EAPCI 2018 consensus (item 12) uses the rounded >7 mm² (distal LM) and >8 mm² (proximal LM).

## 14. FFR, non-hyperaemic pressure ratios and drift

| Index | Threshold | Source | Type | Confidence |
|---|---|---|---|---|
| FFR | ≤0.80 significant (Class I, Level A) | ESC 2024 CCS Guidelines, Vrints C et al., Eur Heart J 2024;45:3415–3537, https://doi.org/10.1093/eurheartj/ehae177; full copy read at https://icus-society.org/wp-content/uploads/2024/09/ESCCCS-2024-guideline7.pdf | Guideline | High |
| iFR | ≤0.89 significant (Class I, Level A) | Same | Guideline | High |
| RFR | ≤0.89, "identical to the threshold used for iFR" | VALIDATE RFR, Svanerud J et al., EuroIntervention 2018;14:806–814, https://eurointervention.pcronline.com/article/validation-of-a-novel-non-hyperaemic-index-of-coronary-artery-stenosis-severity-the-resting-full-cycle-ratio-validate-rfr-study | Peer-reviewed paper | High |
| Diastolic non-hyperaemic ratios (dPR, DFR) | ≤0.89, the same cut-off as iFR; Table 3 lists FFR ≤0.80 and iFR/RFR/DFR ≤0.89 | EAPCI clinical consensus statement, Escaned J et al., EuroIntervention 2023;19:464–481, https://eurointervention.pcronline.com/article/applied-coronary-physiology-for-planning-and-guidance-of-percutaneous-coronary-interventions-a-clinical-consensus-statement-from-the-european-association-of-percutaneous-cardiovascular-interventions-eapci-of-the-european-society-of-cardiology | Consensus | High |
| dPR | Numerically identical to iFR, so iFR cut-offs extend to it | Van't Veer M et al., J Am Coll Cardiol 2017;70:3088–96, https://doi.org/10.1016/j.jacc.2017.10.066 | Peer-reviewed paper | Medium |

- The ESC 2024 guideline lists resting Pd/Pa, dPR and RFR as Class IIb, Level C alternatives without giving a numeric cut-off.

**Pressure drift**

| Value | Source | Type | Confidence |
|---|---|---|---|
| ±2 mmHg is "arbitrarily considered the most stringent clinically acceptable threshold" with no repeat normalisation needed. Even ±2 mmHg drift misclassified 21% of lesions by FFR and 25% by iFR | Cook CM et al., Circ Cardiovasc Interv 2016;9:e002988, https://pmc.ncbi.nlm.nih.gov/articles/PMC4836560/ | Peer-reviewed paper | High |
| ±2 to ±3 mmHg most commonly used; Pd/Pa 1.00 ± 0.02 and ± 0.03 used as definitions | Sci Rep 2024, https://doi.org/10.1038/s41598-024-62440-1 | Peer-reviewed paper | Medium |
| Pd/Pa 0.97–1.03 at pullback as acceptable drift (no source cited by the authors) | Ai H et al., Front Cardiovasc Med 2021, https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2021.654392/full | Peer-reviewed paper (methods only) | Low |

- A guideline or consensus-endorsed Pd/Pa 0.97–1.03 window: **UNVERIFIED — do not use** as a guideline value. The EAPCI 2023 statement addresses drift only qualitatively (repeat, re-normalise or correct).

## 15. Rotational atherectomy

**Main source:** European expert consensus on rotational atherectomy, Barbato E et al., EuroIntervention 2015;11:30–36, https://eurointervention.pcronline.com/article/european-expert-consensus-on-rotational-atherectomy. Source type: consensus. Confidence: high.

- **Speed:** a safe range is 135,000–180,000 rpm. Below 135,000 rpm risks burr lodging; above 180,000 rpm risks platelet activation.
- **Burr-to-artery ratio:** about 0.6 (a single 1.5 mm burr achieves 0.6). Table 2 contrasts this with the traditional approach of up to 0.7 at 180,000–200,000 rpm.
- **Deceleration:** a drop of >5,000 rpm is listed as a predictor of complications.
- **Run duration:** no longer than 30 seconds.

**Japanese CVIT expert consensus update 2023:** Sakakura K et al., Cardiovasc Interv Ther 2023;38:141–162, https://doi.org/10.1007/s12928-022-00906-7. Source type: consensus. Confidence: high for its own statements.

- It recommends a burr-to-artery ratio of 0.4–0.6 when intravascular imaging is not used.
- It attributes 0.6 to the European consensus and 0.4–0.6 to the North American document.
- It recommends 140,000–190,000 rpm, citing manufacturer limits. This differs from the European range.
- Runs: the manufacturer recommends under 30 s; for junior operators, ≤15–20 s.

**EAPCI 2023 calcified-lesion consensus:** Barbato E et al., Eur Heart J 2023;44:4340–4356, https://academic.oup.com/eurheartj/article/44/41/4340/7174174. Source type: consensus. Confidence: medium (read through a summarised fetch).

- Recommended speed 135,000–180,000 rpm.
- Burr-to-artery ratio <0.7.

**For the simulator:** use a speed band of 135,000–180,000 rpm, a burr-to-artery ratio of 0.4–0.6, and runs of 30 s or less. Flag a drop of more than 5,000 rpm as a warning.

**UNVERIFIED — do not use:**

- North American expert review (Sharma SK et al., Circ Cardiovasc Interv 2019): not read at source. Its 0.4–0.6 figure is known only through CVIT.
- "<5,000 rpm drop" as a formal recommendation. It is a complication predictor, not a rule.
- "15–20 s" as a European recommendation.

## 16. Coronary intravascular lithotripsy (Shockwave C2 and C2+)

| Parameter | C2 | C2+ |
|---|---|---|
| Balloon sizing | 1:1 to reference vessel diameter using the compliance chart | Same |
| Balloon sizes | 2.5, 3.0, 3.5 and 4.0 mm × 12 mm | — |
| Pressure during pulses | ≤4.0 atm. Do not deliver lithotripsy above 4 atm | Same |
| Pulse rate | 1 pulse per second | Same |
| Pulses per cycle | Maximum 10 continuous pulses | Same |
| Pause between cycles | Minimum 10 s, enforced by the generator | Same |
| After each cycle | Inflate to reference size (6 atm is nominal and post-treatment pressure; 10 atm is RBP). Deflate and wait at least 10 s to restore flow | Same |
| Pulses per treatment segment | No more than 80 (160 in an overlap segment) | Same |
| Maximum pulses per catheter | "Displayed on generator" in the IFU. 80 per the EAPCI 2023 statement and the SSED bench requirement | 120 |

- **Sources:**
  - C2 IFU (LBL 63927 Rev C, Feb 2021), FDA PMA P200039: https://www.accessdata.fda.gov/cdrh_docs/pdf20/P200039C.pdf
  - C2 SSED (bench requirement: minimum 80 pulses without failure): https://www.accessdata.fda.gov/cdrh_docs/pdf20/P200039B.pdf
  - C2+ IFU (US): https://shockwavemedical.com/wp-content/uploads/2024/11/PN-64192-Rev-C-%E2%80%93-IFU-Shockwave-C2plus-Coronary-IVL-Catheter-US.pdf
  - EAPCI 2023 calcium consensus (item 15 URL): 4 atm, 10 pulses, optional 6 atm; 80 pulses per C2 balloon or 120 with C2+. Confidence: medium.
- **Source type:** IFU. **Confidence:** High.
- **Caveats:**
  - The 80 pulses per C2 catheter is partly confirmed. The C2 IFU table itself shows "Displayed on generator".
  - The newer C2 Aero IFU (2025) differs: 5 s minimum pause, 120 pulses, 2.0–4.0 atm. Do not mix device generations.
  - The Disrupt CAD III abstract gives no technique parameters.

## 17. Temporary transvenous pacing

| Value | Source | Type | Confidence |
|---|---|---|---|
| Capture threshold typically <1 mA. Set output to about 2.5 × threshold, typically 2–3 mA | StatPearls, "Overdrive Pacing" (Self M, Tainter CR; updated 24 Apr 2023), https://www.ncbi.nlm.nih.gov/sites/books/NBK549874/ | Textbook | Medium-high |
| Threshold <1.0 mA considered adequate; initial output set at twice the diastolic pacing threshold | Yaqub Y et al., Cardiology Research 2012 (study methods), PMC5358289, read via https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5358289/fullTextXML | Peer-reviewed paper (methods) | Medium |
| Voltage threshold usually 0.7–1.0 V; output at least twice threshold | patient.info professional reference (updated 27 Jun 2024), https://patient.info/doctor/inserting-temporary-pacemakers | Professional reference | Low-medium |

- **For the simulator:** accept a threshold below 1 mA and set output at 2 to 3 times threshold, defaulting to about 2.5×.
- "3 × threshold" and "≥3 mA" as sourced rules: **UNVERIFIED — do not use**.

## 18. Normal resting haemodynamics and assumed VO2

| Measure | Normal value | Source |
|---|---|---|
| RA mean | 2–6 mmHg (ESC/ERS); 1–5 mmHg (StatPearls RHC) | A, B |
| RV systolic / diastolic | 15–30 / 1–7 mmHg | B |
| PA systolic / diastolic | 15–30 / 4–12 mmHg | A, B |
| PA mean | 8–20 mmHg (ESC/ERS); about 15 mmHg (StatPearls) | A, B |
| PAWP / PCWP | ≤15 mmHg (ESC/ERS; upper limit of normal "considered to be 12 mmHg"); 4–12 mmHg (StatPearls) | A, B |
| CO / CI | 4–8 L/min; 2.5–4.0 L/min/m² | A |
| PVR | 0.3–2.0 WU | A |
| SvO2 | 65–80% | A |
| SaO2 | 95–100% | A |
| Systemic BP | 120/80 mmHg | A |
| LV max / min pressure | 120 / 15 mmHg | C |
| Aorta max / min | 120 / 80 mmHg | C |

- **Sources:**
  - A: ESC/ERS 2022 PH Guidelines, Table 11, Eur Heart J 2022;43:3618–3731, https://academic.oup.com/eurheartj/article/43/38/3618/6673929. Guideline. Confidence: high.
  - B: StatPearls, "Right Heart Catheterization" (Haleem, Sharma, Chaudhari; updated 5 Jul 2025), https://www.ncbi.nlm.nih.gov/sites/books/NBK557404/. Textbook. Confidence: high.
  - C: StatPearls, "Physiology, Cardiac Cycle" (Pollock, Makaryus; updated 3 Oct 2022), https://www.ncbi.nlm.nih.gov/sites/books/NBK459327/. Textbook. Confidence: medium. The LV "15" is labelled a minimum pressure, not explicitly LVEDP.
- **UNVERIFIED — do not use:**
  - A sourced normal LVEDP range (for example 3–12 or ≤12 mmHg).
  - A normal LV systolic range (for example 100–140 mmHg).

**Assumed VO2 for estimated Fick**

| Value | Source | Type | Confidence |
|---|---|---|---|
| 125 mL/min/m² (or 250 mL/min) | StatPearls RHC (source B) | Textbook | High |
| 125 mL/min/m² × BSA for adults at rest; 110 mL/min/m² × BSA for age ≥70 | StatPearls, "Calculating FICK Cardiac Output" (Basnet, Rout; updated 29 May 2024), https://www.ncbi.nlm.nih.gov/sites/books/NBK606091/ | Textbook | High |

- **Formula:** CO = (10 × 125 × BSA) / ((SaO2 − SvO2) × Hb × 1.31).
- **Caveats on accuracy:**
  - Measured and estimated VO2 differed by more than 25% in 17–25% of patients, and errors were worse with BMI >40. Narang N et al., Circulation 2014;129:203–10, https://doi.org/10.1161/CIRCULATIONAHA.113.003334.
  - The ESC/ERS 2022 guideline considers indirect Fick less reliable than thermodilution.

## 19. Gorlin formula and Hakki simplification

- **Gorlin constant:** 44.3 (√(2 × 980)).
- **Aortic flow:** CO / (HR × SEP), where SEP is the systolic ejection period.
- **Aortic valve area:** CO / (HR × SEP × 44.3 × √mean gradient).
- **Mitral coefficient:** 0.85. Cohen and Gorlin revised the original 0.7 to 0.85 in 1972.
- **Mitral valve area:** (SV ÷ DFP) ÷ (0.85 × 44.3 × √ΔP), where DFP is the diastolic filling period.
- **Hakki simplification:** valve area ≈ CO (L/min) / √(peak-to-peak LV–Ao gradient for aortic, or mean gradient for mitral). It is accurate except at HR <60 or >100 bpm. Peak and mean gave the same correlation (r = 0.96 in AS).

| Source | Type | Confidence |
|---|---|---|
| "Measuring Valve Gradients and Areas", J Soc Cardiovasc Angiogr Interv 2022, https://doi.org/10.1016/j.jscai.2022.100433 | Peer-reviewed paper | High for the components; the full equation is printed as an image |
| Hakki AH et al., Circulation 1981;63:1050–5, https://doi.org/10.1161/01.cir.63.5.1050 | Peer-reviewed paper | High |
| Salustri & Almaghrabi, ESC e-Journal of Cardiology Practice vol 16 (2018), https://www.escardio.org/communities/councils/cardiology-practice/scientific-documents-and-publications/ejournal/volume-16/Mitral-Valve-Disease-correlation-between-the-most-important-echocardiographic-parameters-and-haemodynamics/ | Society educational journal | Medium-high |

- **Caveats:**
  - The combined mitral constant 37.7 is the arithmetic product 0.85 × 44.3 = 37.66. It was not printed on any source page.
  - The JSCAI paper misprints the constant once as 44.5.

## 20. ESC/ERS 2022 pulmonary hypertension haemodynamic definitions

- **Source:** Humbert M et al., Eur Heart J 2022;43:3618–3731, Table 5. https://academic.oup.com/eurheartj/article/43/38/3618/6673929 (https://doi.org/10.1093/eurheartj/ehac237)
- **Source type:** guideline. **Confidence:** High.

| Definition | Criteria |
|---|---|
| Pulmonary hypertension | mPAP >20 mmHg |
| Pre-capillary PH | mPAP >20, PAWP ≤15, PVR >2 WU |
| Isolated post-capillary PH | mPAP >20, PAWP >15, PVR ≤2 WU |
| Combined pre- and post-capillary PH | mPAP >20, PAWP >15, PVR >2 WU |
| Exercise PH | mPAP/CO slope between rest and exercise >3 mmHg/L/min |

- **Additional points from the same guideline:**
  - The upper limit of normal PVR is 2 WU.
  - The upper limit of normal PAWP is 12 mmHg, but the 15 mmHg threshold is retained.
  - A PAWP/CO slope >2 mmHg/L/min may help separate pre- from post-capillary causes.
  - Severe PH in lung disease is PVR >5 WU. Medium confidence: this was read in the HTML summary only.

## 21. TIMI flow grades

| Grade | Definition |
|---|---|
| 0 (no perfusion) | No antegrade flow beyond the point of occlusion |
| 1 (penetration without perfusion) | Contrast passes the obstruction but "hangs up" and fails to opacify the entire distal bed for the duration of the filming sequence |
| 2 (partial perfusion) | Contrast opacifies the entire distal bed, but entry and clearance are slower than in the opposite coronary artery |
| 3 (complete perfusion) | Distal antegrade flow is as fast as proximal flow, and clearance is as prompt as from an uninvolved bed |

- **Sources:**
  - Elahifar A et al., Cardiol Res Pract 2024, https://doi.org/10.1155/2024/6632656. The definitions are reproduced there, citing the TIMI Study Group, N Engl J Med 1985;312:932–6.
  - Short labels confirmed in Gibson CM 2000, PMC59594.
- **Source type:** peer-reviewed paper (secondary to the original). **Confidence:** Medium-high.
- The exact original NEJM 1985 wording: **UNVERIFIED — do not use** as a verbatim quotation. The PubMed record has no abstract and the article was not accessible.

## 22. Contrast dose limits

**Maximum acceptable contrast dose (Cigarroa)**

- **Formula:** MACD = 5 mL × body weight (kg) / serum creatinine (mg/dL), with a maximum of 300 mL.
- **Outcome:** CI-AKI occurred in 21% when the limit was exceeded and in 2% when it was not.
- **Source:** review in Curr Opin Nephrol Hypertens, https://doi.org/10.1097/MNH.0000000000000389 (PMC6584943).
- **Source type:** peer-reviewed review. **Confidence:** High.
- **Caveats:**
  - The original Cigarroa 1989 abstract (https://pubmed.ncbi.nlm.nih.gov/2729314/) does not print the formula.
  - Creatinine is in mg/dL.

**Contrast volume ratios**

| Ratio and threshold | Source | Type | Confidence |
|---|---|---|---|
| Contrast volume / CrCl ≥3.7: independent predictor of an early abnormal rise in serum creatinine (>0.5 mg/dL at 24–48 h; adjusted OR 3.84; C-statistic 0.69) | Laskey WK et al., J Am Coll Cardiol 2007;50:584–90, https://doi.org/10.1016/j.jacc.2007.03.058 | Peer-reviewed paper | High |
| Contrast volume / calculated CrCl: risk approached significance above 2 and rose sharply above 3 (adjusted OR 1.46 for CIN, 1.89 for dialysis). Authors recommend keeping the ratio below 3, preferably below 2 | Gurm HS et al., J Am Coll Cardiol 2011;58:907–14, https://doi.org/10.1016/j.jacc.2011.05.023 | Peer-reviewed paper | High |
| Contrast volume / eGFR cut-off 2.7 (Raposeiras-Roubín); CV/eGFR <1.0 in stage 4 CKD (Ogata) | Review above (PMC6584943) | Peer-reviewed review | Medium |

- **Caveat:** the Laskey 3.7 and Gurm 2 and 3 ratios use calculated creatinine clearance, not eGFR. Label the denominator in the simulator.

## 23. Radiation skin dose thresholds and the interventional reference point

**Deterministic skin effects (single-procedure skin dose, ICRP 85 as adapted)**

| Threshold | Effect | Approximate onset |
|---|---|---|
| 2 Gy | Early transient erythema | 2–24 h |
| 3 Gy | Temporary epilation | — |
| 6 Gy | Main erythema | About 1.5 weeks |
| 7 Gy | Permanent epilation | — |
| 14 Gy | Dry desquamation | — |
| 18 Gy | Moist desquamation | — |
| 18 Gy | Ischaemic dermal necrosis | — |
| 24 Gy | Secondary ulceration | — |

- **Source:** Jaschke W et al., Cardiovasc Intervent Radiol 2017, Table 1, PMC5489635, read via https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5489635/fullTextXML
- **Source type:** peer-reviewed paper. **Confidence:** High.

**Substantial radiation dose levels (NCRP 168 as adapted): trigger follow-up**

| Measure | Threshold |
|---|---|
| Peak skin dose | 3 Gy |
| Reference air kerma (Ka,r) | 5 Gy |
| Kerma-area product (KAP) | 500 Gy·cm² |
| Fluoroscopy time | 60 min |

- **Sources:**
  - Jaschke 2017, Table 2.
  - Ahmed & Taha, Egypt Heart J 2017, Table 4 (PMC5839352).
  - The same four values are CIRSE trigger levels in Jaschke 2020 (PMC7369256).
- **Source type:** peer-reviewed paper. **Confidence:** High.

**Interventional reference point**

- **Definition:** for C-arm fluoroscopes, the reference location is 15 cm from the isocentre toward the X-ray source along the beam axis, or an alternative point the manufacturer specifies to represent the skin entry point.
- **Sources:**
  - 21 CFR 1020.32(k)(4)(ii): https://www.law.cornell.edu/cfr/text/21/1020.32
  - Ahmed & Taha 2017 also gives "15 cm on the X-ray tube side of isocenter".
- **Source type:** regulatory. **Confidence:** High.

**Caveats**

- Jaschke 2020 places 2–3 Gy at "tissue reactions unlikely" and 3–5 Gy at "small risk of transient erythema". This differs from the ICRP 2 Gy threshold.
- The primary documents were not read directly: the 2018 ACC/HRS/NASCI/SCAI/SCCT consensus (Hirshfeld, JACC 2018;71:e283) and NCRP Report 168. The values above come from peer-reviewed secondary tables.

---

## Summary of items or parts marked UNVERIFIED — do not use

| Item | What could not be confirmed |
|---|---|
| 1 | SAPIEN 3 perimeter ranges |
| 2 | Evolut sinus of Valsalva and sinus-height criteria |
| 3 | A guideline-level "<10 mm coronary height = maximum risk" |
| 4 | Impella CP IFU wording for maximum flow and inlet distance (literature values given instead) |
| 5 | IABP "3rd intercostal space" landmark |
| 6 | Guideline-level venous drainage cannula size; a VA-ECMO cardiac index flow target beyond the 3 L/m²/min circuit-design figure |
| 7 | A Watchman compression percentage in the IFU (study-level 10–30% given instead) |
| 8 | A guideline or consensus MitraClip gradient threshold (cohort-level >5 mmHg given instead) |
| 10 | "<0.6 W" attributed to Fincke 2004 |
| 12 | Dissection length ">3 mm" |
| 14 | A guideline-level Pd/Pa 0.97–1.03 drift window |
| 15 | North American RA review read at source; "<5,000 rpm drop" and "15–20 s" as formal European recommendations |
| 16 | 80 pulses per C2 catheter in the IFU itself (partly confirmed) |
| 17 | "3 × threshold" and "≥3 mA" pacing rules |
| 18 | Normal LVEDP range and normal LV systolic range |
| 19 | The printed constant 37.7 (it is only an arithmetic product) |
| 21 | The verbatim original NEJM 1985 TIMI wording |
| 23 | Values read directly in Hirshfeld 2018 and NCRP 168 (secondary peer-reviewed tables used instead) |

No item is wholly unverified. Each of items 1–23 has at least one confirmed, sourced value.
