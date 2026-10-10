# CathMaster v2 — Gap Analysis & Phased Roadmap

## Status update (2026-10-04): real cines, calibration, fluoroscopic PCI

**Real angiogram library** (`datasets/library/`, built by `scripts/angio_library/`, served at
`/angio-library`): CADICA (42 patients, 382 runs, CC BY 4.0), CoronaryDominance (domain-shift set
plus the main set's occlusion, artefact and challenging studies: 277 studies, 1,625 runs, CC0) and
AngioCAD (412 patients, 2,711 runs, with clinical data and 15-segment stenosis grades, CC BY 4.0):
4,718 runs from 731 patients in all. Sources,
licences, changes and screening are in `datasets/ATTRIBUTION.md`. The "Real angiograms" section
has reading drills (stenosis grade, left or right, projection from the real C-arm angles,
dominance with every run of the patient, occluded RCA, left-to-right collaterals), patient cases
(CADICA vignettes, AngioCAD segment reports with dominance and Gensini score) and a filterable
library.

**Renderer calibrated against real cines.** Grey-level percentiles of standard views were measured
on real Philips frames and the display chain (dynamic range compression 0.7, level −0.12) was
fitted to them. Anatomy corrections found by the comparison: flattened elliptical rib cross-sections
(ribs read as thin curved margins, not bands), hemidiaphragm domes that carve the lung bases so the
heart sits on the diaphragm, a smaller gastric bubble, a thicker lateral chest wall, and a cardiac
notch so less lung wraps the heart. Hairline tubes (wires, small branches) are anti-aliased.

**Imaging controls.** Detector field 25/20/16/12 cm (Z cycles), table pan (Shift+arrows, X
centres), fluoroscopy pulse rate.

**PCI in the cath lab** (`simulation/angioPci.ts`, `ui/sections/AngioPci.tsx`): wire navigation on
the real branch topology with torque deciding each branch, lesion crossing by wire type, distal
perforation; balloons (semi-compliant, non-compliant, scoring, lithotripsy) and stents on the wire
with radiopaque markers, contrast-filled inflation with a waist where the lesion resists,
deployment, under-expansion, geographic miss, edge dissection, rupture, slow flow; QCA read-out;
debrief. Four scenarios including a mid-RCA CTO with dual injection. Deployed stents scaffold the
lumen in the rendered tree.

**Physiology in the image.** Collateral channels to the bed beyond a chronic occlusion, with late
retrograde filling on contralateral injection; late-phase myocardial blush, reduced with slow flow.
Catheter in-root course is a tangent-continuous curve through each family's secondary-curve contact.

**Bugs found by the comparison and fixed:** the washout term left the first ~30 mm of every
artery (left main, proximal RCA) partly empty during injection; stenosis slowing scaled the whole
transit, so an 80% lesion delayed distal filling about 3.5-fold (now TIMI 3 below ~95%); the field
was centred on the whole tree, leaving the RCA partly off-screen in right views (now centred on the
catheter's coronary); ribbon tubes twisted where vessels or ribs run end-on or fold back in
projection.

**Still to do for realism:** the catheter and wire as discrete elastic rods (true tracking,
prolapse and deep-seating in the image), stent strut texture, side-branch jailing and bifurcation
techniques in the PCI lab, intracoronary imaging linked to the angiographic lesion, and per-view
anatomy variation (habitus, cardiomegaly).

## Status update (2026-10-03): Academy rebuild and physically based X-ray

**Academy.** 10 tracks (stage 1 foundations → stage 5 structural/MCS): 68 modules, 231 lessons,
542 single-best-answer questions with spaced repetition, 31 synthetic branching cases and 20 retold
published cases (EuroPCR/PCRonline, EuroIntervention Case Reports, EHJ and JACC Case Reports) with
links to the originals. 180-term glossary. 178 references, all verified at PubMed/publisher level.
Content integrity is enforced by `src/content/validate.ts` in the test suite.

**New simulators (engines tested in Vitest):** haemodynamics lab (`haemo.ts`, 15 scenarios, Fick,
Gorlin, shunts, constriction vs restriction, Brockenbrough), pressure wire (`physiology.ts`, Gould
pressure–flow, autoregulation, phasic flow, FFR/wave-free ratio/pullback/CFR/IMR, drift and guide
wedging), PCI bench (`pciBench.ts`, IVUS/OCT, Fujino, preparation devices, EAPCI 2018 criteria),
MCS (`circulation.ts` lumped circulation with Impella and VA-ECMO; `iabp.ts` timing), structural
(TAVI/TEER/LAAO), bedside (temporary pacing, pericardiocentesis), calculators (`calc.ts`).

**A5 X-ray image fidelity: replaced.** `src/render/xray/` is a WebGL2 physically based renderer:
exact per-ray line integrals through the thorax (lungs carved around a lobulated mediastinum,
liver, stomach, trachea), bone (vertebrae, pedicles, ribs, clavicles, scapulae, sternum), pulmonary
vascular markings, a real-scale epicardial coronary tree anchored to the engagement model's ostia,
catheter wall and lumen, wire with radiopaque tip, iodine with flow-front timing, washout, stenosis
slowing, CTO, thrombus and calcium. Image chain: scatter, centre-weighted AEC, quantum noise,
detector blur, dynamic range compression, edge enhancement, recursive filtering, 15 frames/s.

**Next for realism:** wire/catheter as a discrete elastic rod inside a 3D vessel lumen (true
tracking, prolapse, deep-seating), table pan and zoom controls, stent and balloon markers in the
renderer, collateral filling, myocardial blush, and real cine loops from openly licensed datasets
(pending the user's approval of downloads).

Response to the v2 upgrade brief. **Grounded in the actual current code**, not the brief's
"schematic toy" assumption — a large part of Track A already exists. Nothing below is coded
yet; this is the review-first deliverable the brief requires. Pick phases to execute one at a time.

Legend: ✅ done · 🟡 partial · ⬜ missing

## Reference material status — ✅ ingested (2026-07-03)
`docs/reference/` now contains: `Angio.pdf`, the EH views notes (.docx), the Oxford handbook (.docx),
and the Medmastery PCI Essentials handbook (.pdf), plus `BRILAKIS_PRINCIPLES.md`. These are the
canonical clinical spec. A4 (view catalogue) and A9 (anatomy) will encode their exact angles/landmarks.

## Testing status — ✅ Phase 0 done (2026-07-03)
Vitest harness in place (`npm test`, `npm run test:watch`); **61 tests across 11 files** covering
random/engagement/procedure(wire)/projection/pressure/ecg/contrast/scoring/caseGenerator/angio and a
store-level **construct-validity gate** (a scripted expert trajectory outscores a novice on the same
case). `vitest.config.ts` runs the pure engine in Node. Typecheck + production build stay green.

---

## Track A — Diagnostic (current vs target)

| WS | Target | State | What's already built | Remaining gap |
|----|--------|-------|----------------------|---------------|
| A1 | Catheter/wire physics | ✅ | `engagement.ts` spring dynamics: commanded vs actual insertion/torque, lag, wind‑up, whip, forward pressure, resistance, prolapse/buckle; `haptics.ts` tactile channel; wire model in `procedure.ts` (torque‑steer, buckle, spasm, breath) | catheter body as a true physical curve (physics is tip‑based); wire‑leads‑catheter coupling during tracking; **unit tests** |
| A2 | Catheter‑specific engagement | 🟡 | ~21 catheters in `data/catheters.ts` (reach/azimuth/seatHeight/torque/deep‑seat risk); coaxial rewarded, deep penalised; per‑family shaft geometry | **manoeuvre signatures** (JL form‑on‑opposite‑cusp→withdraw; Tiger CW‑and‑pull + dive risk; JR CW torque); **aspirate‑before‑inject**; **conus over‑selection→VF**; wrong catheter truly unseatable w/ coach reason |
| A3 | Access & tortuosity | 🟡→✅ | `procedure.ts` femoral/radial routes, subclavian breath, radial loop torque‑steer, spasm, iliac tortuosity | arteria lusoria variant; balloon‑assisted tracking; access affecting **support/tracking in the engagement sim** (currently cosmetic there) |
| A4 | Projection geometry | 🟡→✅ | `projection.ts` cone‑beam perspective (foreshortening + overlap + depth + mag); view presets | **annotated view catalogue** (segment↔view↔why↔fix); **view‑ID quiz** (diaphragm/spine landmarks); collimation/mag/pan controls; graft/LIMA views |
| A5 | X‑ray image fidelity | 🟡→✅ | density‑buffer render + blur + grain + diaphragm/ribs/spine + vignette + cardiac/resp motion; **cine loop playback** of user footage | explicit **fluoro‑vs‑cine** dose/noise; **store & replay acquired runs**; dose‑scaled quantum noise |
| A6 | Contrast dynamics | 🟡→✅ | bolus lifecycle: wash‑in front, hold, washout, reflux plume, blush, selective/non‑selective; densitometric | **streaming/incomplete opacification**; **TIMI flow grade** past lesions; **CTO collateral filling**; injection‑force model |
| A7 | Pressure & ECG | ✅ | `pressure.ts` aortic/damped/wedged/ventricularised/lv/dissected + morphology; `ecg.ts` P‑QRS‑T with ST/ischaemia from engagement + dwell + lesion | catheter‑tip spasm signature; **rhythm events** (VF/vagal/asystole/ectopy) as first‑class |
| A8 | Complication engine | 🟡 | dissection: trauma accumulator → latched dissection → damped trace + stained contrast + safety hit + logged event | unify into cause→effect engine w/ warning signs + management: **air embolism, VF, vagal, contrast reaction, atheroembolism, kinking**; coronary/cardiac/other taxonomy |
| A9 | Anatomy & pathology depth | 🟡 | dominance, root sizes, ~14 variants (high/anterior/superior/shepherd's RCA, separate ostia, ramus, tortuosity); pathology kinds; parametric case generator | **RCA branches** (conus/SA/AV‑node); **named collaterals** (Kugel/Vieussens); **SCAD** types; **anomalies** (lusoria dot‑sign, interarterial, bridging); **AHA/SYNTAX** segment model; acute‑marginal‑vs‑true‑RCA trap |
| A10 | Stenosis quantification | ⬜🟡 | lesions with severity + position | **≥2 orthogonal views required** for a severity call; eccentricity/foreshortening‑hides‑stenosis; QCA/FFR/IVUS adjuncts |
| A11 | Assessment & metrics | 🟡 | `scoring.ts` safety/efficiency/anatomy/final; fluoro time, contrast vol, mistakes; OSATS‑ish | proper **DAP/air‑kerma**; **coaxiality quality**; **diagnostic completeness** (all segments in adequate views); **construct‑validity test** (expert > novice) |

## Track B — Interventional / PCI
⬜ **Entirely missing.** The app is diagnostic‑only. B0 planning · B1 equipment · B2 lesion assessment ·
B3 physiology (FFR) · B4 core PCI workflow · B5 complex modules (bifurcation/calcium/left‑main/CTO) ·
B6 PCI complications · B7 post‑procedure · B8 imaging (IVUS/OCT) · B9 dose/contrast discipline — all new.
This roughly triples the app.

## Cross‑track
- Curriculum/coach: `curriculumEngine.ts` + 365‑day + levels + `adaptiveCoach.ts` (mistake→drill, longitudinal) exist for Track A; PCI phases + step‑by‑step PCI coach ⬜.
- Validation harness: ⬜ (no Vitest).

---

## Proposed phasing (re‑prioritised for what already exists)

- **Phase 0 — Foundation.** Add Vitest; convert the ad‑hoc engine checks into a real regression
  suite (engagement, projection, wire physics, pressure/ecg, contrast, scoring, generator);
  add the construct‑validity scaffold. Low‑risk, locks in everything already built. *(Recommended first.)*
- **Phase 1 — A2 catheter‑specific engagement manoeuvres** ✅ **done (2026-07-03):** conus branch added
  to the anatomy + conus over-selection detection; **aspirate-before-inject** (`aspirate()` → clean /
  no-return, invalidated on tip movement) with **air-embolism** on injecting a wall/deep/damped tip
  blind; **conus injection → VF** with a **defibrillate()** recovery + VF vitals display; per-catheter
  `seatCue`s surfaced by the coach. Safety scoring + case-fail gates for air-embolism/VF. +6 tests
  (67 total). Verified live (conus→VF→defib) with no console errors.
- **Phase 2 — A4 view catalogue + view‑ID quiz + collimation/mag/pan** (perceptual skill).
- **Phase 3 — A8 unified complication engine + A7 rhythm events + A6 streaming/TIMI** (safety loop).
- **Phase 4 — A9 anatomy/collateral/SCAD/anomaly depth + A10 quantification** (knowledge).
- **Phase 5 — A11 DAP/completeness/OSATS + validation gates** (assessment).
- **Phases 6–9 — Track B (PCI)** per the brief, gated behind Track A: planning/equipment/core →
  physiology/complex → complications/aftercare/imaging/dose → assessment/curriculum/coach.

## Evidence‑of‑realism map (fill in as built)
| Feature | Reference | Learning objective |
|---|---|---|
| Cone‑beam projection (foreshorten+overlap) | EH views §proj | choose angulation to resolve overlap |
| Dissection engine (force→tear→damp→stain) | Oxford/complications | never force a catheter; read pressure |
| Wire torque‑steer + aim‑the‑tip at true lumen | procedure feel | finesse over force through loops |
| *(add each feature as it lands)* | | |

---
*Educational use only. Not a medical device. Real angiography/PCI must be learned under direct expert supervision.*
