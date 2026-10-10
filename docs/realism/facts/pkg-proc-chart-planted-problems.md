# proc-chart-planted-problems: model parameters

Model parameters added by this package in the run 3 fix stage. None is a population value or a
sourced clinical figure; each is a setting of the simulation, named as such in the code. The earlier
model parameters of this package are listed where they are defined (MP_PLANNING in
src/simulation/session/planning.ts, MP_PLANNING_TIME and MP_OXYGEN_LPM in
src/simulation/session/modules/planning.ts, MP_PRE_PROCEDURE in src/simulation/patient/patient.ts).

| Parameter | File | Value | Unit | What it rests on |
| --- | --- | --- | --- | --- |
| MP_PLANNING.dialysisEgfr | src/simulation/session/planning.ts | 15 | mL/min/1.73 m2 | A narrative setting. Below it, the record's fistula is in use for haemodialysis. At or above it, the record says a kidney transplant has since taken over and the fistula was kept, so a drawn fistula never contradicts the patient's creatinine. The planting rule does not use it. |
| MP_PRIOR_PLUG.plugLenMm, plugWidMm, plugThickMm | src/simulation/access/ultrasound.ts | 6, 4, 2.5 | mm | Drawing sizes for the collagen plug on the B-mode image, chosen so it reads on the image. They are not the dimensions of any device. |
| MP_PRIOR_PLUG.anchorLenMm, anchorWidMm, anchorThickMm | src/simulation/access/ultrasound.ts | 10, 2, 0.5 | mm | Drawing sizes for the anchor on the inner anterior wall, chosen so it reads on the image. They are not the dimensions of any device. |
| MP_PRIOR_PLUG.plugEcho, anchorEcho | src/simulation/access/ultrasound.ts | 0.8, 0.95 | relative echo (MP_BMODE scale) | Echo levels for an echogenic plug and a bright anchor, set against the scale the B-mode model already uses (wall 0.95, calcium 1.0). |
| The plug's position along the artery | src/simulation/session/modules/planning.ts (priorPlug) | middle of the site's puncture window, (targetFrom + targetTo) / 2 | mm (site frame) | A model choice. The old arteriotomy is taken to lie where the textbook puncture lies. |
| MP_PLANNING.siteFallbackShare | src/simulation/session/planning.ts | 0.6 | probability | A case-mix setting added in the run 4 fix stage. An acute patient who can carry none of the in-patient problems (under MP_PLANNING.dnacprMinAgeY, no PDE-5 inhibitor in its window, no contrast reaction, not of childbearing potential) is given the site problem of the planned access in this share of draws (a closure device in the planned groin, or a fistula in the planned arm), and an unsuspended do-not-resuscitate order in the rest, so that a random acute case does not usually mean a site problem. The weight is a simulation setting, not a population frequency. The draw uses its own planning-RNG value, drawn after the others, so no other fact of the record shifts. |
| SPO2_RECHECK_S, SPO2_RECHECKS | src/simulation/session/autopilot.ts | 30, 10 | s, count | Autopilot settings: how long the autopilot waits on oxygen before it rechecks the SpO2 for the checklist, and how many times it rechecks. |

## Rules applied, from the module text

- An anchor-and-collagen-plug device within 90 days: use the other femoral artery or a radial artery
  (Brilakis 1.4, pm-planning-assessment). PLANNING_RULES.closureDeviceDays, already in planning.ts.
- A dialysis fistula arm is not used (Brilakis's examination checklist, pm-planning-assessment).
