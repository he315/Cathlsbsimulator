# xray-device-fluoro-views: model parameters

Device fluoroscopy for the bedside, support and structural labs: device tubes drawn into the X-ray scene (`src/render/xray/deviceTubes.ts`) and the device view (`src/ui/xray/XrayDeviceView.tsx`). Product names are not used.

Sourced values carry their module location in the code and are not repeated as model parameters: the balloon pump catheter 7.5 F and the 40 mL balloon (pci-manual/17-support-devices.ts, IABP lesson and balloon sizing table); the microaxial pump shaft 9 Fr in a 14 Fr sheath and its inlet about 3.5 cm below the aortic valve (same file, access and positioning step); the VA-ECMO venous cannula 25 Fr with its tip at the SVC-RA junction and the arterial cannula 17 Fr (same file, VA-ECMO cannulation); the 0.035 inch J wire, radius 0.445 mm (cath-handbook/04-cardiac-catheterisation.ts, wires). Material attenuations come from existing facts: PVC for the device polymers (hardware.ts `PLASTIC.pvc`, NIST at 60 keV, facts/S4.md), the metals in hardware.ts `METAL`, the iodine channel from thorax.ts `MU.iodinePerMg` and injection.ts `IODINE_MG_PER_ML`.

Everything below is a MODEL PARAMETER (a drawing size or placement with no source), in mm unless stated.

## Materials (deviceTubes.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `HELIUM_MU` | src/render/xray/deviceTubes.ts | 0 | per mm | MODEL PARAMETER: helium density is about four orders of magnitude below soft tissue, so a balloon's gas column reads as `HELIUM_MU - MU.soft` (brighter) |
| `DEVICE_MU.polymerExcess` | src/render/xray/deviceTubes.ts | `PLASTIC.pvc - MU.soft` | per mm | MODEL PARAMETER: the device polymers attenuate as PVC |
| `DEVICE_MU.jacket` | src/render/xray/deviceTubes.ts | `CATHETER_WALL.jacket` | iodine-like channel | MODEL PARAMETER: the scene builder's diagnostic catheter jacket filler |

## Device sizes and placements (deviceTubes.ts `DEVICE_MODEL`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `iabp.balloonLengthMm40`, `iabp.taperMm` | src/render/xray/deviceTubes.ts | 220, 12 | mm | MODEL PARAMETER: inflated length of the 40 mL balloon (other volumes scale by the cube root of the volume ratio) and the taper at each end; the radius is then set by the volume |
| `iabp.foldedRadiusMm` | src/render/xray/deviceTubes.ts | 1.9 | mm | MODEL PARAMETER: the deflated balloon wrapped on the catheter |
| `iabp.tipMarkerMm`, `tipMarkerMu`, `tipGapMm`, `tipMarkerRadiusShare` | src/render/xray/deviceTubes.ts | 4; `METAL.platinum` x 0.5; 6; 0.95 | mm; per mm; mm; share | MODEL PARAMETER: the radio-opaque tip marker |
| `iabp.jacketShare`, `membraneFolded`, `membraneInflated` | src/render/xray/deviceTubes.ts | 0.6, 0.35, 0.05 | shares | MODEL PARAMETER: catheter jacket filler; membrane polymer folded and as a thin inflated skin |
| `iabp.rampS` | src/render/xray/deviceTubes.ts | 0.06 | s | MODEL PARAMETER: inflation and deflation ramp of 1:1 counterpulsation |
| `pump.cannulaRadiusMm`, `cannulaMm`, `motorMm`, `motorRadiusMm`, `motorMu` | src/render/xray/deviceTubes.ts | 2.0, 65, 14, 2.1; `METAL.steel` x 0.45 | mm; per mm | MODEL PARAMETER: cannula radius and inlet-to-outlet length, motor housing |
| `pump.cannulaBraid`, `cannulaWallMm`, `cannulaJacketShare` | src/render/xray/deviceTubes.ts | 0.12, 0.35, 0.5 | share; mm; share | MODEL PARAMETER: nitinol reinforcement, wall and jacket of the cannula |
| `pump.pigtailStraightMm`, `pigtailRadiusMm`, `pigtailTurns`, `pigtailTubeRadiusMm`, `pigtailJacketShare` | src/render/xray/deviceTubes.ts | 10, 4.5, 1.25, 1.0, 0.8 | mm, mm, turns, mm, share | MODEL PARAMETER: the pigtail beyond the inlet |
| `pump.lvWallMm` | src/render/xray/deviceTubes.ts | 10 | mm | MODEL PARAMETER: LV wall taken off each semi-axis of the myocardial ellipsoid to give the cavity the inlet sits in |
| `ecmo.coil`, `wallMm`, `jacketShare` | src/render/xray/deviceTubes.ts | 0.2, 0.7, 0.3 | share, mm, share | MODEL PARAMETER: wire reinforcement, wall and jacket of the cannulae |
| `ecmo.arterialTipY` | src/render/xray/deviceTubes.ts | -360 | mm (thorax frame y) | MODEL PARAMETER: the arterial cannula tip in the common iliac artery, below the aortic bifurcation (y = -330 where the femoral course joins thorax.ts aorticCourse) |
| `ecmo.tipMarkerMm`, `tipMarkerMu` | src/render/xray/deviceTubes.ts | 3; `METAL.steel` x 0.25 | mm; per mm | MODEL PARAMETER: marker at the venous cannula tip |
| `lead.fr` | src/render/xray/deviceTubes.ts | 5 | Fr | MODEL PARAMETER: temporary bipolar pacing lead outer size |
| `lead.conductorRadiusMm`, `conductorInner`, `conductorMu` | src/render/xray/deviceTubes.ts | 0.55, 0.55, `METAL.steel` x 0.55 | mm, share of outer radius, per mm | MODEL PARAMETER: the coiled conductor seen as a hollow metal tube, as hardware.ts draws permanent leads |
| `lead.tipElectrodeMm`, `ringFromTipMm`, `tipMu`, `ringMu` | src/render/xray/deviceTubes.ts | 2; [9, 11]; `METAL.platinum` x 0.6; x 0.5 | mm; mm; per mm | MODEL PARAMETER: tip and ring electrodes, as hardware.ts |
| `rhc.fr`, `balloonRadiusMm`, `balloonFromTipMm`, `membraneShare` | src/render/xray/deviceTubes.ts | 7; 5.5; [7, 0.5]; 0.05 | Fr; mm; mm behind the tip; share | MODEL PARAMETER: balloon-tipped right heart catheter |
| `pericardial.needleRadiusMm`, `needleInnerMm` | src/render/xray/deviceTubes.ts | 0.65, 0.42 | mm | MODEL PARAMETER: needle |
| `pericardial.jRadiusMm`, `hubOutsideMm`, `effusionMm` | src/render/xray/deviceTubes.ts | 3, 60, 10 | mm | MODEL PARAMETER: J curl, needle and hub outside the skin, default effusion thickness |
| `pericardial.sacContrastShare` | src/render/xray/deviceTubes.ts | 0.06 | share of full-strength contrast | MODEL PARAMETER, tuned on the rendered AP image with a 15 mm effusion: 0.06 reads as a dark rim (8-frame average, about 20-25 grey levels at the lateral heart border and 30-40 at the inferior border); 0.015 gave 9 or fewer, not separable from beat and breathing |
| `pericardial.aim`, `targetDir` | src/render/xray/deviceTubes.ts | normalised (0.3, 0.5, -0.81); normalised (-0.1, -0.55, 0.83) | unit vectors | MODEL PARAMETER: needle direction (towards the left shoulder, posterior) and where on the sac the track is aimed (anterior and inferior) |
| `transseptal.sheathFr`, `dilatorFr`, `dilatorOutMm`, `needleRadiusMm` | src/render/xray/deviceTubes.ts | 8, 6, 18, 0.6 | Fr, Fr, mm, mm | MODEL PARAMETER: sheath, dilator beyond the sheath and needle |
| `transseptal.tentMm`, `crossMm`, `svcHighMm`, `crossedNeedleOutMm` | src/render/xray/deviceTubes.ts | 5, 16, 30, 6 | mm | MODEL PARAMETER: tenting depth, dilator in the left atrium once crossed, starting height in the SVC, needle beyond the dilator when crossed |
| `transseptal.approachMm`, `septalOffsetMm`, `raBendMm` | src/render/xray/deviceTubes.ts | 14, 2, 8 | mm | MODEL PARAMETER: shape of the course to the fossa |
| `transseptal.dilatorTaperMm`, `dilatorTipShare`, `dilatorMinRadiusMm`, `dilatorInSheathMm`, `needleBehindMm` | src/render/xray/deviceTubes.ts | 8, 0.35, 0.7, 4, 0.5 | mm, share, mm, mm, mm | MODEL PARAMETER: dilator taper and overlaps |
| `transseptal.sheathMarkerMm`, `sheathMarkerMu`, `sheathJacketShare`, `dilatorJacketShare`, `needleMu` | src/render/xray/deviceTubes.ts | 2; `METAL.platinum` x 0.25; 0.7; 0.5; `METAL.steel` x 0.8 | mm; per mm; shares; per mm | MODEL PARAMETER: markers and fillers |

## Landmarks and the venous course (deviceTubes.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Venous `stations` (`landmarks`) | src/render/xray/deviceTubes.ts | e.g. femoral (-55k, -460, -35), iliac (-34k, -330, -52), neck (-44, 250, -18), innominate (-18, 128, -24); the intracardiac stations are fixed points on the heart frame (`heartPt`) or offsets from the chamber ellipsoids | mm, thorax frame (k: habitus scale) | MODEL PARAMETERS: the venous course outside the heart and the stations inside it |
| `leftSubclavian` | src/render/xray/deviceTubes.ts | (14, 104, -42) plus 0.2 of the breathing shift | mm | MODEL PARAMETER: origin of the left subclavian artery on the arch |
| Root breathing share | src/render/xray/deviceTubes.ts | rises linearly from y = -100 to the top of the root (y = 26), 0.45 at the valve | share of the heart shift | MODEL PARAMETER (sceneBuilder rootW 0.45 at the root) |
| Pericardium ellipsoid (`hugging`) | src/render/xray/deviceTubes.ts | scaled so that 90% of sampled ventricular surface points lie inside | share | MODEL PARAMETER: a single ellipsoid follows the two ventricles within a few millimetres except at the apex and acute margin |
| `RA_PASS_RIGHT_MM` | src/render/xray/deviceTubes.ts | 4 | mm | MODEL PARAMETER: the venous course from the IVC to the SVC passes this far right of the RA centre |
| SVC test | src/render/xray/deviceTubes.ts | a tip within 4 mm of the SVC-RA junction height, or above it, is still in the SVC | mm | MODEL PARAMETER |

## View settings (XrayDeviceView.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `RENDER_PX` | src/ui/xray/XrayDeviceView.tsx | 768 | px | Render setting: the realism baseline's capture size |
| `FLUORO_PPS`, `LAB_FRAME_BUDGET_MS` | src/ui/xray/XrayDeviceView.tsx | 15, 1000/15 | pulses per s, ms | Render setting: the lab's frame budget is one pulse interval |
