// ---------------------------------------------------------------------------
// Builds the X-ray scene for one frame from the simulator state: C-arm
// geometry, breathing and heartbeat, the beating coronary tree with iodine
// concentrations from the contrast bolus, the aortic root and LV when they are
// opacified, calcium, the catheter (with its lumen) and the guidewire.
//
// Wave-2 integration (track I1) assembles the wave-1 pieces here:
// - heart motion from the patient clock (heartMotion.motionAt on a ClockState),
//   with the aortic root, the ostia and the legacy catheter path moving together
//   (rootDisplacement, catheterTether) and the coronaries drawn on their dense
//   render path (renderPath: lesion and stent-edge resampling, bridge squeeze);
// - the beating heart silhouette (heartShape.heartShapes) merged into the
//   per-patient thorax (thorax genome from the patient seed, exact thorax
//   segments for ThoraxSegmentPass, lung-anchored clutter uniforms, hardware);
// - the analytic segment integrator for vessels, catheters, wires and devices
//   (S2b, behind segmentsEnabled());
// - automatic dose-rate control (adrc.ts) in place of the old kV formula, with
//   the renderer's meter fed back by the lab (LabImaging below);
// - run bookkeeping for the image chain (mode, framesSinceStart, profile).
// See docs/realism/wave2/I1.md.
//
// Lesion morphologies (diag-lesion-morphologies) on the default (ribbon) path:
// an eccentric lumen is drawn as a flattened tube (TubeSpec.thin) whose minor
// axis follows the plaque, with the lumen centre moved away from it, so its
// projected diameter depends on the view; a spasm lesion relaxes with the
// engine's epicardial dilation (SceneInput.epicardialDilation); a thrombus is
// an intraluminal filling defect (a tube of negative iodine inside the lumen)
// with haze; a SCAD type 1 false lumen runs beside the true lumen and holds
// contrast (ContrastField.retained); the bed beyond a chronic occlusion fills
// through its collateral channels with the transport's lag (ContrastField.late).
//
// Catheter-tip spasm (diag-spasm-states): SceneInput.spasm narrows the trunk the
// catheter tip is in, smoothly round the tip, by the patient engine's spasm
// (coronaryTree.ts tipSpasmRadii); without it nothing changes.
//
// Ventriculogram and aortogram (diag-lv-aorta-render): an LV injection (BolusView.lv)
// or an aortic root injection (BolusView.aortogram) is drawn by lvGram.ts: the LV
// cavity with segmental wall motion, the LA filling by the MR grade, the LV filling
// from the root by the AR grade, the aorta, and the case's findings (SceneInput.lvGram).
// It replaces the uniformly filling ellipsoid; no other render changes.
// ---------------------------------------------------------------------------

import type { AnatomyCase, CArm, Vec3, VesselId } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import { toWorld } from "../../simulation/anatomy";
import { cameraBasis } from "../../simulation/projection";
import { CardiacClock, type ClockState } from "../../simulation/clock/cardiacClock";
import { DoseTracker, bodyFromAnat, DEFAULT_OPERATOR, type OperatorSetup } from "../../simulation/dose";
import { V3, type HeartFrame, type Motion } from "./heart";
import { motionAt, clockStateAt, rootDisplacement, catheterTether } from "./heartMotion";
import { heartShapes } from "./heartShape";
import { lvGramFrame, stainAfterRun, stainPrims, viewDirection, type LvGramContrast, type LvGramSpec } from "./lvGram";
import { samplePos, renderPath, relaxSpasm, tipSpasmRadii, minorAxisDir, MORPHOLOGY, type CoronaryTree, type Sample, type TreeVessel } from "./coronaryTree";
import { DIAPHRAGM_DESCENT, buildThorax, MU, aorticCourse, seedFrom, type BonePrim, type TubeSpec } from "./thorax";
import type { HardwareSpec } from "./hardware";
import { CLUTTER_KEY, THORAX_SEGMENTS_KEY, clutterStateFromAnat } from "./clutter";
import { tubesToSegments, segmentsEnabled, createSegmentPass, createThinPass, SEGMENTS_KEY, type SegmentBatch } from "./segments";
import { Adrc, DEFAULT_SETTINGS, REFERENCE_FIELD_MM, patientPath, steadyState, imageParamsFromAdrc, type AdrcCalibration, type AdrcInput, type AdrcSettings, type AdrcState } from "./adrc";
import { contrastField, contrastTune, transportNet, thetaOnPath, lagOnPath, vesselHash, graftTransportNet, graftCompetition, rootInjectionShares, DEFAULT_SEAT, ROOT_INJECTION, THETA_MAX_S, type ContrastField, type GraftCompetition, type Seat, type TransportMods, type TransportNet } from "./contrastTransport";
import { METAL } from "./hardware";
import { IODINE_MG_PER_ML, lumenFillAt, lumenForFrench, planTrace, standardPlan, type InjectionTrace, type LumenFill } from "../../simulation/injection";
import type { ImageParams, MeterReading, SystemProfileId, XrayCamera, XrayRenderer, XrayScene } from "./XrayRenderer";

export interface BolusView {
  filled: VesselId[];
  plume: "none" | "root" | "reflux";
  side: "left" | "right" | null;
  /**
   * seconds since the injection command: the operator's press that starts the cine run. The push itself
   * starts after the operator's delay (injection.ts OPERATOR_DELAY_S), so a run opens on pre-contrast frames.
   */
  t: number;
  /** seconds the syringe is pushed for (used to plan the default standard injection when `trace` is absent) */
  injectDur: number;
  /** 0..1 how well the catheter is seated: the share of the jet that enters the ostium when `seat` is absent */
  peak: number;
  /** LV injection (ventriculogram) */
  lv?: boolean;
  /**
   * Injection in the ascending aorta just above the valve (aortogram, usually through a pigtail): fills the
   * root, ascending aorta and arch, and the LV by the AR grade of SceneInput.lvGram.
   */
  aortogram?: boolean;
  /**
   * The hand injection (flow and strength at the catheter tip from the press, injection.ts). When absent a
   * standard injection of `injectDur` through the catheter `french` implies is planned (planTrace).
   */
  trace?: InjectionTrace;
  /** engagement of the tip: share of the jet captured by the ostium and how far the tip seals it */
  seat?: Seat;
  /**
   * The injection is into a bypass graft (diag-grafts-svg): the graft's tree name (CoronaryTree.grafts). The graft and
   * the native bed it reaches through its anastomosis fill at the graft's own flow (contrastTransport
   * graftTransportNet), and nothing else; `filled` and `side` are not read for the coronaries.
   */
  graft?: string;
  /**
   * The tree vessel holding the catheter tip when the injection began (diag-injection-run-quality: the classifier's
   * vessel, e.g. the LAD of a short left main entered superselectively). Contrast then enters at that vessel, so only
   * it and the vessels it gives off fill. Absent, or not a vessel of the tree: the side's vessels in `filled`, as before.
   */
  vessel?: string | null;
  /**
   * Fill the coronaries of a non-selective root injection (no engaged side) or an aortogram by the share of it that
   * reaches each ostium (contrastTransport rootInjectionShares, as that ostium's seat capture; diag-injection-run-
   * quality). Opt-in: the diagnostic lab sets it; without it such a bolus fills the sinus cloud only, as before.
   */
  rootFill?: boolean;
}

export interface SceneInput {
  model: AnatomyModel;
  caseData: Pick<AnatomyCase, "accessRoute" | "lesions" | "dominance">;
  tree: CoronaryTree;
  /** catheter centre line in the aortic frame, root portion (from the shaft at the top of the root to the tip) */
  catheterRoot: Vec3[];
  french: 5 | 6 | 7;
  /** guidewire beyond the catheter tip, aortic frame */
  wire?: { pts: Vec3[]; kind: "035" | "014" } | null;
  bolus: BolusView | null;
  /** model time (s) */
  t: number;
  cArm: CArm;
  /** table position: iso-centre offset in the patient (mm) */
  pan?: Vec3;
  /** which coronary the table is centred on before any pan (operators centre the injected artery) */
  centreOn?: "left" | "right" | "both";
  /** detector field (mm, full width): 250, 200, 170, 150 */
  field?: number;
  /** heart rate (bpm) for the stand-in clock when `clock` is omitted (default 72) */
  heartRate?: number;
  /**
   * The patient clock (CardiacClock.state()). Heart motion, the beat phase and, unless `breathHold`
   * is given, breathing come from it. When omitted a sinus clock at `heartRate` is derived from `t`.
   */
  clock?: ClockState;
  /** null = free breathing; a number = held at that inspiration level (0..1). Overrides the clock's breathing. */
  breathHold?: number | null;
  /** image acquisition: fluoroscopy (low dose) or cine (acquisition) */
  mode: "fluoro" | "cine";
  frame: number;
  /** frames since the start of this run (pedal-down or cine start); passed to the image chain (settling, recursion) */
  framesSinceStart?: number;
  /** imaging-system profile for the image chain (default: the renderer's) */
  profile?: SystemProfileId;
  /** native coronary flow scale of the whole side for the contrast transport (1 normal; below 1 global slow flow) */
  flowScale?: number;
  /**
   * Live flow conditions for the transport: balloon occlusions, hyperaemia, regional no-reflow beyond a point
   * (contrastTransport TransportMods). Default: resting flows.
   */
  flowMods?: TransportMods;
  /**
   * The patient engine's epicardial vasodilation (0..1; pharmacology DrugEffects.epicardialDilation, the
   * nitrate effect), for the whole patient or per side. A spasm lesion's narrowing is drawn times (1 - this).
   * Default 0: spasm lesions at their full severity, as before.
   */
  epicardialDilation?: number | { left: number; right: number };
  /**
   * Catheter-tip spasm (diag-spasm-states): the side the catheter tip is in, how far along the flow path
   * from the ostium it lies (mm), and the patient engine's spasm there (0..1, PatientEngine.tipSpasm).
   * The trunk of that side (the RCA, the left main) is narrowed smoothly round that point (coronaryTree.ts tipSpasmRadii).
   * Absent or severity 0: nothing changes.
   */
  spasm?: { side: "left" | "right"; atMm: number; severity: number } | null;
  /**
   * Share of the main catheter's lumen holding contrast (0 saline … 1 contrast; Injector.primed). Without a bolus it
   * is drawn uniform (default 0, saline). During a run the lumen follows the run's trace: the syringe's contrast
   * displaces the old contents (InjectionTrace.primed) from the hub as the dead volume is pushed (lumenFillAt); a
   * bolus without its own trace plans the standard injection with this share in the lumen (default 1). With a live
   * trace and this field both given, the run is through another catheter (contralateral injection) and the main
   * lumen is drawn uniform at this share.
   */
  catheterContrast?: number;
  /** the injecting catheter is a guide (larger lumen) rather than a diagnostic catheter; default: french >= 6 */
  guide?: boolean;
  /** a second catheter (dual injection): its root course in the aortic frame and access route */
  catheter2?: { root: Vec3[]; route: "femoral" | "radial-right" | "radial-left"; french: 5 | 6 | 7; injecting: boolean; /** lumen contrast share when not injecting (default 0) */ lumen?: number } | null;
  /**
   * Physics catheter centre line (aortic frame, hub side first) from the rod solver. When given it
   * replaces aorticCourse + catheterRoot and is drawn as is (the solver's moving lumens already
   * carry the cardiac motion, so it is never tethered).
   */
  catheterNodes?: Vec3[];
  /**
   * Tether the catheter to the aortic-root motion (legacy fixed catheter path). Default: true when
   * the catheter comes from catheterRoot, false when it comes from catheterNodes (critique item 20:
   * the root motion is never applied twice).
   */
  legacyCatheter?: boolean;
  /**
   * Patient seed: selects the thorax genome (habitus, ribs, spine, lung trees). Default: the
   * coronary genome's seed (the case id), so the lab and the capture harness film the same patient.
   */
  patientSeed?: string | number;
  /**
   * Hardware in the field (ECG electrodes and leads, table edge, sternal wires, devices, valves).
   * Default: ECG electrodes and the table (present in every lab). null hides all of it (teaching toggle).
   */
  hardware?: HardwareSpec | null;
  /** draw ribs, cartilage, lung vessels and hardware with the exact thorax segment pass (default true) */
  thoraxSegments?: boolean;
  /** draw vessels, catheters, wires and devices with the analytic segment pass (default: segmentsEnabled(SEGMENTS_DEFAULT)) */
  segments?: boolean;
  /** exposure settings (fluoro level, pulse rates, grid); mode and field come from `mode` and `field` */
  exposure?: Partial<AdrcSettings>;
  /** the lab's dose-rate controller (keeps loop state across frames); omitted = steady state for this geometry */
  adrc?: Adrc;
  /** renderer meter read-back for the controller (at most once per new reading; see LabImaging) */
  meter?: AdrcInput["meter"];
  /**
   * Water-equivalent path of the rendered patient from the renderer's meter (cm), when known. The
   * controller then evaluates the detector dose on the patient the renderer actually draws (its
   * image is normalised at that meter), so the closed loop settles on the target; the analytic body
   * path is used until the first reading.
   */
  meteredWaterCm?: number | null;
  /** contrast calibration of the controller's gains (default ADRC_CALIBRATION) */
  calibration?: AdrcCalibration;
  /**
   * Extra devices placed on the beating heart (PCI wires, balloons, stents, contrast staining).
   * `place` maps a heart-surface sample to its world position for this frame.
   */
  extras?: (place: (s: Sample) => Vec3, ctx: { bolusT: number | null; injecting: boolean }) => { tubes?: TubeSpec[]; bones?: BonePrim[] };
  /**
   * The left heart and aorta as the ventriculogram and aortogram show them (lvGram.ts): wall motion per
   * segment (from the case, or from the engine through lvGram.segmentsFromEngine), LVEF, MR and AR grades,
   * stain, thrombus, takotsubo, VSD, the anomalous circumflex, aortic stenosis and graft stumps. Used only
   * during an LV or aortic root injection; default a normal left heart.
   */
  lvGram?: LvGramSpec | null;
}

export interface SceneResult {
  scene: XrayScene;
  params: ImageParams;
  resp: number;
  contraction: number;
  /** the heart motion state of this frame */
  motion: Motion;
  /** the dose-rate controller's state for this exposure (technique, dose rates, image gains) */
  exposure: AdrcState;
  /** iso-centre used for this frame (world, mm): the dose tracker needs it */
  iso: Vec3;
  /** contrast state of this frame (null without a bolus) */
  contrast: ContrastSummary | null;
  /** chamber contrast of a ventriculogram or aortogram frame (lvGram.ts), when one is drawn */
  lvGram?: LvGramContrast;
}

export interface ContrastSummary {
  /** time since the press (s) */
  t: number;
  /** contrast flowing out of the tip now */
  injecting: boolean;
  /** time (s since the press) the ostial strength first reached 10% */
  arrival: number | null;
  /** flows now (mL/s): injected, entering the coronary, refluxing into the sinus */
  qInj: number;
  qCoronary: number;
  qReflux: number;
  /** strength entering the artery now (0..1) */
  inlet: number;
  /** myocardial blush and sinus cloud strengths (0..1) */
  blush: number;
  sinus: number;
  /** volume pushed so far (mL) */
  volumeMl: number;
  /** tree vessels drawn with contrast in this frame (names; diag-injection-run-quality) */
  vessels: string[];
  /**
   * A non-selective root injection or an aortogram (diag-injection-run-quality): the share of it each ostium's
   * arteries received (root vessel name to share, rootInjectionShares). Absent for a selective or graft injection.
   */
  rootShares?: Record<string, number>;
}

/** Source-to-iso-centre and source-to-image distances (mm). */
export const SOD = 760;
export const SID = 1060;

/**
 * Default of the analytic segment integrator flag (S2b) when neither SceneInput.segments nor the
 * URL / localStorage flag says otherwise. See docs/realism/wave2/I1.md for the measurement behind it.
 * Re-decided in wave 2 (C1) with the capture harness reading `extra.segmentTubes`: on the refitted chain
 * the integrator scored 181 against 179 (sets c1s8-seg, c1s8-a) and 184 against 183 (c1f1s, c1f1) of 234-235
 * rows, flips of borderline timing and motion rows only, while it widened the large-vessel profile out of
 * its band (FWHM 9.15 -> 10.62 px, band 4.0-9.6) and cost +4.9 ms per frame at 768 px and +10.6 ms at
 * 1024 px (pipelined, 7.5 -> 12.4 and 13.1 -> 23.7 ms). Kept off (docs/realism/wave2/C1.md).
 */
export const SEGMENTS_DEFAULT = false;
/**
 * Contrast calibration of the dose-rate controller's iodine and metal gains. "physical" takes the
 * controller's effective attenuation as it is; "legacy-ap" rescales the standard AP patient to the
 * contrast the wave-1 image chain was tuned against (S6.md, step 1). Wave 2 (C1) re-ran the A/B on the
 * refitted thorax and processing: "physical" 181 of 234 scorecard rows against 179 with "legacy-ap"
 * (sets c1s9-phys and c1s8-a, docs/realism/wave2/C1.md), as adrc.ts intended once the scorecard was
 * re-run, so the physical gains are the default.
 */
export const ADRC_CALIBRATION: AdrcCalibration = "physical";
/**
 * Field (mm) at which the image chain's noise model was fitted with counts 1500 (cine) / 380 (fluoro):
 * S2 fitted the detector's quantum and floor split on 200 mm field captures (wave1/S2.md, "field 200 mm").
 * The controller's counts are referenced to 230 mm (adrc.ts REFERENCE_FIELD_MM) and scale with the
 * field (smaller field, fewer quanta per rendered pixel), so they are rescaled by 230/200 to keep that
 * fit: at 200 mm the standard patient gets the 1500 counts the noise targets were matched with, and
 * magnification still raises the noise as the controller says.
 */
export const COUNTS_CALIBRATION_FIELD_MM = 200;
/** Held inspiration level during cine (0..1); model parameter, as before the integration. */
export const CINE_BREATH_HOLD = 0.7;
/**
 * Share of a coronary's iodine carried in a parabolic radial profile (TubeSpec.core) rather than
 * uniformly across the lumen: incompletely mixed contrast in laminar coronary flow is densest on the
 * axis. Model parameter (C1, wave 2), fitted on the library's large-vessel profile width and shape at
 * peak opacification (FWHM 4.0-9.6 px and w80/w20 0.22-0.49 at 512 px, vessel.py); a uniform lumen
 * gave 10.6 px and 0.57.
 */
export const VESSEL_PROFILE = {
  laminarCore: 0.6,
  /**
   * Calcified plaque: excess attenuation (/mm) of the thin shell drawn around the lumen of a calcified
   * segment. Exported for calibration sweeps (C1 review round); see docs/realism/wave2/C1.md.
   */
  calciumMu: 0.055,
  /**
   * Thrombus haze: iodine of the faint halo around a thrombus-containing lumen as a share of the lumen's
   * own (MODEL PARAMETER, diag-lesion-morphologies: Brilakis's "haziness", drawn, not measured).
   */
  thrombusHaze: 0.12,
  /** SCAD type 1 false lumen: strength of the retained contrast as a share of the lumen's (MODEL PARAMETER) */
  falseLumenGain: 0.8,
};
/**
 * Catheter outer diameters (mm) by French size: 1 Fr = 1/3 mm by the definition of the scale.
 * Inner diameters come from the injection model's lumen table (injection.ts LUMENS: 6 Fr guide 1.80 mm,
 * 6 Fr diagnostic 1.42 mm, sources in docs/realism/facts/I1.md).
 */
export const CATHETER_OD_MM: Record<5 | 6 | 7, number> = { 5: 5 / 3, 6: 2, 7: 7 / 3 };
/**
 * Catheter wall attenuation excess over soft tissue, per mm of wall, at the reference energy (C1, wave 2;
 * model parameters, docs/realism/facts/C1.md): `braid` is the stainless-steel braid of the shaft as a
 * steel-equivalent (metal channel; steel 0.95 /mm at 60 keV times the braid's volume share of the wall);
 * `jacket` the radiopaque filler of the polymer jacket (barium sulphate, contrast-like channel). Fitted
 * with the wall geometry on the library's unfilled-catheter depth, wall separation and lumen contrast;
 * refitted (x 0.6) after the C1 harmonisation change, which deepened the unfilled catheter (depth 64.8
 * against the band 24.3-54.5).
 */
export const CATHETER_WALL = { braid: 0.27, jacket: 0.18 };
/**
 * Bypass grafts on an aortogram (diag-grafts-svg), MODEL PARAMETERS: each graft fills from the opacified root over
 * its first centimetres, at `share` of the aortic concentration falling off over `fadeMm` along the conduit (an
 * occluded graft shows as its stump). The ring marker: a radio-opaque metal ring round the conduit at the aortic
 * anastomosis, `atMm` along the graft, `wireMm` thick, `clearMm` outside the lumen.
 */
export const AORTOGRAM_GRAFT = { share: 0.7, fadeMm: 40 };
export const GRAFT_RING = { atMm: 2.5, wireMm: 0.35, clearMm: 0.9 };

/** The ring marker of a graft: a closed metal ring round the conduit near its aortic end (world points). */
function graftRing(pts: Vec3[], radii: number[]): TubeSpec {
  let acc = 0,
    i = 1;
  while (i < pts.length - 2 && acc < GRAFT_RING.atMm) {
    acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
    i++;
  }
  const c = pts[i];
  const T = V3.nrm(V3.sub(pts[i + 1], pts[i - 1]));
  const ref = Math.abs(T.y) < 0.9 ? V3.v(0, 1, 0) : V3.v(1, 0, 0);
  const u = V3.nrm(V3.cross(T, ref));
  const w = V3.cross(T, u);
  const rr = radii[i] + GRAFT_RING.clearMm;
  const ring: Vec3[] = [];
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * 2 * Math.PI;
    ring.push(V3.add(c, V3.add(V3.sc(u, rr * Math.cos(a)), V3.sc(w, rr * Math.sin(a)))));
  }
  return { pts: ring, r: ring.map(() => GRAFT_RING.wireMm), mu: [0, 0, METAL.steel] };
}

/** Default hardware: ECG electrodes with their leads, and the table top and mattress. */
export const DEFAULT_HARDWARE: HardwareSpec = { enabled: true, ecg: true, table: true, sternalWires: 0, graftClips: false, device: "none", valve: "none" };

export function makeCamera(cArm: CArm, iso: Vec3, field: number): XrayCamera {
  const b = cameraBasis(cArm);
  // the tube sits behind the patient along the viewing direction; the detector faces the viewer
  const src = V3.add(iso, V3.sc(b.forward, SOD));
  const detC = V3.sub(iso, V3.sc(b.forward, SID - SOD));
  return { src, detC, detU: V3.sc(b.right, field / 2), detV: V3.sc(b.up, field / 2) };
}

/** Ventricular contraction envelope over one beat (0 diastole … 1 end-systole). Legacy; the scene uses heartMotion. */
export function contraction(phase: number): number {
  const q = ((phase % 1) + 1) % 1;
  if (q < 0.08) return 0;
  if (q < 0.38) return Math.sin(((q - 0.08) / 0.3) * Math.PI * 0.5);
  if (q < 0.55) return Math.cos(((q - 0.38) / 0.17) * Math.PI * 0.5);
  return 0;
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Catmull-Rom resample of a polyline at roughly `step` mm. */
function resample(pts: Vec3[], step: number): Vec3[] {
  if (pts.length < 2) return pts;
  const out: Vec3[] = [];
  const get = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = get(i - 1),
      b = get(i),
      c = get(i + 1),
      d = get(i + 2);
    const seg = Math.hypot(c.x - b.x, c.y - b.y, c.z - b.z);
    const n = Math.max(1, Math.ceil(seg / step));
    for (let k = 0; k < n; k++) {
      const t = k / n,
        t2 = t * t,
        t3 = t2 * t;
      const f = (p: number, q: number, r: number, s: number) => 0.5 * (2 * q + (-p + r) * t + (2 * p - 5 * q + 4 * r - s) * t2 + (-p + 3 * q - 3 * r + s) * t3);
      out.push({ x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y), z: f(a.z, b.z, c.z, d.z) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Arc length from each point to the last point of a polyline (mm). */
function distFromEnd(pts: Vec3[]): number[] {
  const out = pts.map(() => 0);
  for (let i = pts.length - 2; i >= 0; i--) out[i] = out[i + 1] + Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y, pts[i + 1].z - pts[i].z);
  return out;
}

const centreCache = new WeakMap<CoronaryTree, Map<string, Vec3>>();
/** Centre of the coronary tree (or of one side of it) at rest, for table positioning. */
export function treeCentre(tree: CoronaryTree, side: "left" | "right" | "both" = "both"): Vec3 {
  const cache = centreCache.get(tree) ?? new Map<string, Vec3>();
  centreCache.set(tree, cache);
  const hit = cache.get(side);
  if (hit) return hit;
  let x0 = Infinity,
    y0 = Infinity,
    z0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity,
    z1 = -Infinity;
  for (const v of tree.vessels) {
    if (v.name.includes("twig") || v.name.startsWith("collateral")) continue;
    if (side !== "both" && v.side !== side) continue;
    for (const s of v.samples) {
      const p = samplePos(tree.heart, s);
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      z0 = Math.min(z0, p.z);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
      z1 = Math.max(z1, p.z);
    }
  }
  const c = V3.v((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  cache.set(side, c);
  return c;
}

/** The bolus's injection trace: the given one, or the standard plan for its push through the catheter's lumen. */
export function bolusTrace(inp: Pick<SceneInput, "french" | "guide" | "catheterContrast">, b: BolusView): InjectionTrace {
  if (b.trace) return b.trace;
  // the planned standard injection; the lumen holds `catheterContrast` before the push (default primed with contrast)
  return planTrace({ ...standardPlan(b.side ?? "left", lumenForFrench(inp.french, inp.guide), b.injectDur), primed: inp.catheterContrast ?? 1 });
}

/** Volume pushed up to time t (mL). */
function volumeUpTo(tr: InjectionTrace, t: number): number {
  const n = Math.min(tr.q.length, Math.max(0, Math.floor(t / tr.dt)));
  let v = 0;
  for (let i = 0; i < n; i++) v += tr.q[i] * tr.dt;
  return v;
}

/** The graft a bolus is injected into, when the tree has it (diag-grafts-svg). */
function bolusGraft(inp: Pick<SceneInput, "tree">, b: BolusView | null) {
  return b?.graft ? inp.tree.grafts?.find((g) => g.name === b.graft) ?? null : null;
}

const subtreeCache = new WeakMap<CoronaryTree, Map<string, Set<string>>>();

/**
 * The tree vessels a bolus delivered into `name` reaches: the vessel and every vessel it gives off (collateral channels
 * excluded). Null when the tree has no such vessel. Cached per tree.
 */
export function vesselSubtree(tree: CoronaryTree, name: string): Set<string> | null {
  let m = subtreeCache.get(tree);
  if (!m) subtreeCache.set(tree, (m = new Map()));
  const hit = m.get(name);
  if (hit) return hit;
  if (!tree.vessels.some((v) => v.name === name)) return null;
  const out = new Set<string>([name]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v of tree.vessels) {
      if (out.has(v.name) || !v.parent || v.kind === "collateral" || !out.has(v.parent.name)) continue;
      out.add(v.name);
      grew = true;
    }
  }
  m.set(name, out);
  return out;
}

const rootCache = new WeakMap<CoronaryTree, Map<string, string>>();

/** The ostial (root) vessel each tree vessel descends from: the vessel itself for one with its own ostium. Cached per tree. */
export function ostialRootOf(tree: CoronaryTree): Map<string, string> {
  const hit = rootCache.get(tree);
  if (hit) return hit;
  const byName = new Map(tree.vessels.map((v) => [v.name, v]));
  const out = new Map<string, string>();
  const rootOf = (v: TreeVessel, depth = 0): string => {
    const done = out.get(v.name);
    if (done) return done;
    const p = v.parent ? byName.get(v.parent.name) : undefined;
    const r = p && depth < 64 ? rootOf(p, depth + 1) : v.name;
    out.set(v.name, r);
    return r;
  };
  for (const v of tree.vessels) rootOf(v);
  rootCache.set(tree, out);
  return out;
}

const ostialCache = new WeakMap<CoronaryTree, TreeVessel[]>();

/** The tree vessels with their own ostium (no parent in the tree; collateral channels and empty vessels excluded). Cached per tree. */
function ostialVessels(tree: CoronaryTree): TreeVessel[] {
  const hit = ostialCache.get(tree);
  if (hit) return hit;
  const names = new Set(tree.vessels.map((v) => v.name));
  const out = tree.vessels.filter((v) => (!v.parent || !names.has(v.parent.name)) && v.kind !== "collateral" && v.samples.length > 0);
  ostialCache.set(tree, out);
  return out;
}

/**
 * A non-selective injection (diag-injection-run-quality): with no engaged side, a puff in a sinus or an aortogram
 * fills each ostium's arteries by the share of the injection that reaches that ostium (contrastTransport
 * rootInjectionShares: by distance from the catheter tip for a sinus injection, alike for an aortogram), used as that
 * ostium's seat capture with no seal. `place` gives the ostium positions in this frame, `tipWorld` the tip's.
 */
function rootInjectionFields(inp: SceneInput, b: BolusView, net: TransportNet, trace: InjectionTrace, clock: Pick<ClockState, "phase" | "rr">, place: (s: Sample) => Vec3, tipWorld: Vec3 | null): Map<string, { cf: ContrastField; share: number }> {
  const out = new Map<string, { cf: ContrastField; share: number }>();
  const roots = ostialVessels(inp.tree);
  const shares = rootInjectionShares(
    roots.map((v) => ({ name: v.name, pos: place(v.samples[0]) })),
    tipWorld,
    !!b.aortogram
  );
  for (const v of roots) {
    const share = shares.get(v.name) ?? 0;
    if (!(share > 1e-3)) continue;
    out.set(v.name, {
      share,
      cf: contrastField({ net, side: v.side, trace, t: b.t, phase: clock.phase, rr: clock.rr, flowScale: inp.flowScale, seat: { capture: share, seal: 0 } }),
    });
  }
  return out;
}

/** The contrast field of this frame's bolus. A non-selective injection (no side) only fills the sinus here; its coronaries fill by rootInjectionFields. */
function contrastFor(inp: SceneInput, b: BolusView, clock: Pick<ClockState, "phase" | "rr">): ContrastField {
  const trace = bolusTrace(inp, b);
  const g = bolusGraft(inp, b);
  // a graft injection runs on the graft's own network (its flow, then the native bed beyond the anastomosis)
  const net = (g && graftTransportNet(inp.tree, g.name, inp.flowMods)) || transportNet(inp.tree, inp.caseData.lesions, inp.flowMods);
  const seat: Seat = b.seat ?? { capture: Math.max(0, Math.min(1, b.peak)), seal: DEFAULT_SEAT.seal };
  return contrastField({
    net,
    side: g ? g.side : b.side ?? "left",
    trace,
    t: b.t,
    phase: clock.phase,
    rr: clock.rr,
    flowScale: inp.flowScale,
    seat: b.side ? seat : { capture: 0, seal: 0 },
  });
}

/** Call fn(a, z) for each run of consecutive samples where arr exceeds the threshold. */
function runs(arr: number[] | undefined, min: number, fn: (a: number, z: number) => void) {
  if (!arr) return;
  let a = -1;
  for (let i = 0; i <= arr.length; i++) {
    const on = i < arr.length && arr[i] > min;
    if (on && a < 0) a = i;
    if (!on && a >= 0) {
      if (i - 1 > a) fn(a, i - 1);
      a = -1;
    }
  }
}

/** Previous frame's moved tubes, time and batch per tree (segment motion blur, velocity, topology reuse). */
const prevSeg = new WeakMap<CoronaryTree, { tubes: TubeSpec[]; t: number; batch: SegmentBatch }>();

export function buildXrayScene(input: SceneInput): SceneResult {
  // development only: A/B overrides for calibration runs (window.__sceneOverrides = { segments: true, ... })
  const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ? (globalThis as { __sceneOverrides?: Partial<SceneInput> }).__sceneOverrides : undefined;
  const inp: SceneInput = dev ? { ...input, ...dev } : input;
  const H: HeartFrame = inp.tree.heart;
  // ---- patient clock: heart motion and breathing ------------------------------
  const clock = inp.clock ?? clockStateAt(inp.t, inp.heartRate ?? 72);
  const m = motionAt(clock, H);
  const e = m.contraction; // LV cavity and blush scaling
  // quiet breathing: about a quarter of a deep breath, ~14 breaths/min (stand-in when there is no clock)
  const resp = inp.breathHold ?? inp.clock?.resp ?? 0.22 * (0.5 - 0.5 * Math.cos((2 * Math.PI * inp.t) / 4.3));
  // the heart rests on the diaphragm and descends with it (slightly less: the great vessels tether it)
  const heartShift = V3.v(0, -0.85 * DIAPHRAGM_DESCENT * resp, 3 * resp);
  const seed = inp.patientSeed ?? inp.tree.genome?.seed;
  const hs = heartShapes(H, m).map((s) => ({ ...s, c: V3.add(s.c, heartShift) }));
  const useThoraxSeg = inp.thoraxSegments ?? true;
  const thorax = buildThorax({
    resp,
    heart: H,
    heartShift,
    motion: m,
    contraction: e,
    heartShapes: hs,
    seed,
    segments: useThoraxSeg,
    hardware: inp.hardware === undefined ? DEFAULT_HARDWARE : inp.hardware,
  });

  // breathing moves the heart more than the aortic root, which is tethered
  const moveWorld = (p: Vec3, weight: number): Vec3 => toWorld(inp.model, V3.add(p, V3.sc(heartShift, weight)));
  const rootW = 0.45;
  /** heart-surface sample to world position for this frame */
  const place = (sm: Sample) => moveWorld(samplePos(H, sm, m), rootW + (1 - rootW) * sm.w);

  const tubes: TubeSpec[] = [...thorax.tubes];
  const bones: BonePrim[] = [...thorax.bones];
  const firstNonThorax = tubes.length; // thorax tubes stay on ribbons (or S4's pass)
  const vesselOfTube = new Map<TubeSpec, TreeVessel>();
  const tubeOfVessel = new Map<string, TubeSpec>();
  const baseIndexOf = new Map<string, number[] | undefined>();

  // ---- contrast: hand injection -> ostial mixing -> transport along the tree (contrastTransport.ts) ----
  const b = inp.bolus;
  const filled = new Set(b?.filled ?? []);
  const cf: ContrastField | null = b ? contrastFor(inp, b, clock) : null;
  const trace = b ? bolusTrace(inp, b) : null;
  const injecting = !!cf?.injecting;
  // a graft injection (diag-grafts-svg): the graft's own network; a native injection with patent grafts on its side:
  // their competitive washout and back-filling
  const graftInj = bolusGraft(inp, b);
  const gnet: TransportNet | null = graftInj ? graftTransportNet(inp.tree, graftInj.name, inp.flowMods) : null;
  const net = b ? gnet ?? transportNet(inp.tree, inp.caseData.lesions, inp.flowMods) : null;
  const competition: GraftCompetition[] = b && net && !gnet && b.side && inp.tree.grafts?.length ? graftCompetition(inp.tree, net, inp.caseData.lesions).filter((c) => c.side === b.side) : [];
  const washoutAt = (name: string, base: number): number => {
    let k = 1;
    for (const c of competition) {
      const from = c.washout.get(name);
      if (from !== undefined && base >= from) k *= 1 - c.share;
    }
    return k;
  };
  const full = MU.iodinePerMg * IODINE_MG_PER_ML;
  // the classifier's vessel at the tip (a superselective branch): only it and its branches fill
  const reach = b && !gnet && b.side && b.vessel ? vesselSubtree(inp.tree, b.vessel) : null;
  // a non-selective root injection or an aortogram: each ostium's arteries by their share of it
  const rootOf = ostialRootOf(inp.tree);
  let rootFields: Map<string, { cf: ContrastField; share: number }> | null = null;
  if (b && b.rootFill && cf && net && trace && !gnet && !b.lv && (b.side === null || b.aortogram)) {
    const tipA = (inp.catheterNodes ?? inp.catheterRoot)[(inp.catheterNodes ?? inp.catheterRoot).length - 1];
    rootFields = rootInjectionFields(inp, b, net, trace, clock, place, tipA ? moveWorld(tipA, rootW) : null);
  }
  const contrastVessels: string[] = [];
  const useSegments = inp.segments ?? segmentsEnabled(SEGMENTS_DEFAULT);
  const dilation = (side: "left" | "right") => {
    const d = inp.epicardialDilation;
    return Math.max(0, Math.min(1, typeof d === "number" ? d : d?.[side] ?? 0));
  };
  for (const v of inp.tree.vessels) {
    // a graft run fills the vessels its network reaches; a native run the vessels of the injected side
    const rootField = rootFields?.get(rootOf.get(v.name) ?? v.name) ?? null;
    const opac = gnet ? !!cf && gnet.vessels.has(v.name) : rootField ? true : !!cf && b!.side !== null && filled.has(v.fillId) && (!reach || reach.has(v.name));
    // the field this vessel's contrast comes from: its ostium's share of a root injection, or the bolus's own
    const vcf = rootField ? rootField.cf : cf;
    const retro = !gnet && b && cf && v.retro && b.side === v.retro.side ? v.retro : null;
    const calcified = v.calcium.length > 0;
    if (!opac && !retro && !calcified) continue; // nothing of this vessel is visible
    const rp = renderPath(v, m);
    const bi = (i: number) => (rp.baseIndex ? Math.floor(rp.baseIndex[i]) : i);
    const pts = rp.samples.map(place);
    const sh = rp.shape;
    // a spasm lesion relaxes with the nitrate's epicardial dilation (the stored radii are its full severity)
    const relaxed = relaxSpasm(rp.radii, sh, dilation(v.side));
    // catheter-tip spasm round the catheter tip, in the trunk the catheter is in (diag-spasm-states)
    const sp = inp.spasm;
    const radii = sp && sp.severity > 0 && sp.side === v.side && !v.parent ? tipSpasmRadii(relaxed, rp.pathMm, sp.atMm, sp.severity) : relaxed;
    // an eccentric lumen: an ellipse whose minor axis lies along the plaque, its centre moved away from the plaque
    // (the ribbon path only; the segment integrator draws the equal-area round lumen, see below). It is placed
    // before the contrast so the calcium shell sits round the same moved lumen with or without contrast.
    let ecc: { from: number; to: number; dir: Vec3[]; major: number[]; minor: number[]; shift: Vec3[] } | null = null;
    if (sh?.minor && sh.major && !useSegments) {
      let i0 = -1,
        i1 = -1;
      for (let i = 0; i < pts.length; i++)
        if (sh.major[i] > sh.minor[i] + 1e-6) {
          if (i0 < 0) i0 = i;
          i1 = i;
        }
      if (i0 >= 0) {
        const from = Math.max(0, i0 - 1),
          to = Math.min(pts.length - 1, i1 + 1);
        const dir: Vec3[] = [],
          major: number[] = [],
          minor: number[] = [];
        const shift: Vec3[] = [];
        for (let i = from; i <= to; i++) {
          const T = V3.sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]);
          const d = minorAxisDir(place, rp.samples[i], pts[i], T, sh.orient?.[i] ?? 0);
          // bridge squeeze and spasm relief scale the ellipse like the round lumen
          const k = radii[i] / (rp.storedRadii[i] || 1);
          dir.push(d);
          major.push(sh.major[i] * k);
          minor.push(sh.minor[i] * k);
          shift.push(V3.sc(d, (-(sh.ref[i] - sh.minor[i]) * k) / 2));
        }
        for (let i = from; i <= to; i++) pts[i] = V3.add(pts[i], shift[i - from]);
        ecc = { from, to, dir, major, minor, shift };
      }
    }
    if (opac || retro) {
      const muArr: [number, number, number][] = [];
      const theta = opac ? thetaOnPath(net!, v, pts.length, rp.baseIndex) : null;
      // beyond a chronic occlusion: late, faint, retrograde filling through the collateral channels, lagged by
      // the donor's transit to each channel, the channel's own transit and the spread through the bed
      const lag = retro ? lagOnPath(net!, v, pts.length, rp.baseIndex) : null;
      const hash = vesselHash(v.name);
      for (let i = 0; i < pts.length; i++) {
        let conc = 0;
        if (opac && theta) {
          conc = vcf!.at(theta[i]) * vcf!.streak(theta[i], hash);
          const k = bi(i);
          // beyond an occlusion no antegrade contrast; from a graft, the network says where it reaches (theta)
          if (gnet) {
            if (theta[i] >= THETA_MAX_S - 1e-3) conc = 0;
          } else if (v.occludedFrom >= 0 && k >= v.occludedFrom) conc = 0;
          else if (competition.length) conc *= washoutAt(v.name, k);
          for (const [a, z] of v.thrombus) if (k >= a && k <= z) conc *= 0.35 + 0.25 * Math.sin(k * 2.1);
        }
        if (retro && lag && cf) conc = Math.max(conc, retro.gain * cf.late(lag[i]));
        // terminal tips fade out over their last millimetres
        conc *= v.fade?.[bi(i)] ?? 1;
        muArr.push([0, full * conc, 0]);
      }
      const core = VESSEL_PROFILE.laminarCore;
      if (opac) contrastVessels.push(v.name);
      const pieces: TubeSpec[] = [];
      if (!ecc) pieces.push({ pts, r: radii, mu: muArr, core });
      else {
        const piece = (a: number, z: number, thin: boolean) => {
          if (z - a < 1) return;
          pieces.push({
            pts: pts.slice(a, z + 1),
            r: thin ? ecc!.major.slice(a - ecc!.from, z - ecc!.from + 1) : radii.slice(a, z + 1),
            mu: muArr.slice(a, z + 1),
            core,
            ...(thin ? { thin: { dir: ecc!.dir.slice(a - ecc!.from, z - ecc!.from + 1), r: ecc!.minor.slice(a - ecc!.from, z - ecc!.from + 1) } } : {}),
          });
        };
        piece(0, ecc.from, false);
        piece(ecc.from, ecc.to, true);
        piece(ecc.to, pts.length - 1, false);
      }
      const tube = pieces[0];
      vesselOfTube.set(tube, v);
      tubeOfVessel.set(v.name, tube);
      baseIndexOf.set(v.name, rp.baseIndex);
      tubes.push(...pieces);
      // thrombus: an intraluminal filling defect (iodine displaced inside the lumen) and a faint haze around it
      if (sh?.defect || sh?.haze) {
        runs(sh.defect, 0.02, (a, z) =>
          tubes.push({ pts: pts.slice(a, z + 1), r: radii.slice(a, z + 1).map((r, j) => r * sh.defect![a + j]), mu: muArr.slice(a, z + 1).map((x) => [0, -x[1], 0] as [number, number, number]) })
        );
        runs(sh.haze, 0.02, (a, z) => {
          tubes.push({
            pts: pts.slice(a, z + 1),
            r: radii.slice(a, z + 1).map((r) => r * 1.35 + 0.15),
            mu: muArr.slice(a, z + 1).map((x, j) => [0, x[1] * VESSEL_PROFILE.thrombusHaze * sh.haze![a + j], 0] as [number, number, number]),
          });
          // taken back out of the lumen itself, so the haze is a halo round the lumen and the lumen is not denser
          tubes.push({
            pts: pts.slice(a, z + 1),
            r: radii.slice(a, z + 1),
            mu: muArr.slice(a, z + 1).map((x, j) => [0, -x[1] * VESSEL_PROFILE.thrombusHaze * sh.haze![a + j], 0] as [number, number, number]),
          });
        });
      }
      // SCAD type 1: the false lumen beside the true one, filling slowly and holding contrast after the lumen clears
      if (sh?.falseR && opac && theta) {
        runs(sh.falseR, 0.02, (a, z) => {
          const fp: Vec3[] = [],
            fr: number[] = [],
            fm: [number, number, number][] = [];
          for (let i = a; i <= z; i++) {
            const T = V3.sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]);
            const side = minorAxisDir(place, rp.samples[i], pts[i], T, Math.PI / 2);
            fp.push(V3.add(pts[i], V3.sc(side, radii[i] + sh.falseR![i] + MORPHOLOGY.flapMm)));
            fr.push(sh.falseR![i]);
            fm.push([0, full * VESSEL_PROFILE.falseLumenGain * vcf!.retained(theta[i]), 0]);
          }
          tubes.push({ pts: fp, r: fr, mu: fm });
        });
      }
    }
    // calcium is visible without contrast: a thin dense shell around the lumen (indices refer to the base samples)
    if (calcified) {
      const basePts = rp.baseIndex ? v.samples.map(place) : pts;
      let baseR = v.radii;
      if (ecc) {
        // an eccentric lumen: the shell follows the moved lumen and clears its major axis, so the lumen
        // cannot show through its own calcium (on the dense path each base sample takes the nearest dense sample's shift)
        baseR = v.radii.slice();
        const nearest = new Map<number, number>();
        for (let i = ecc.from; i <= ecc.to; i++) {
          const f = rp.baseIndex ? rp.baseIndex[i] : i;
          const k = Math.round(f);
          if (k < 0 || k >= baseR.length) continue;
          if (rp.baseIndex) {
            const d = Math.abs(f - k);
            if ((nearest.get(k) ?? Infinity) <= d) continue;
            nearest.set(k, d);
            basePts[k] = V3.add(place(v.samples[k]), ecc.shift[i - ecc.from]);
          }
          baseR[k] = Math.max(v.radii[k], ecc.major[i - ecc.from]);
        }
      }
      for (const [a, z] of v.calcium) {
        const seg = basePts.slice(a, z + 1);
        if (seg.length < 2) continue;
        const rr = baseR.slice(a, z + 1);
        tubes.push({ pts: seg, r: rr.map((r) => r + 0.9), mu: [VESSEL_PROFILE.calciumMu, 0, 0] });
        tubes.push({ pts: seg, r: rr.map((r) => r + 0.25), mu: [-VESSEL_PROFILE.calciumMu, 0, 0] });
      }
    }
  }

  // ---- aortic root (reflux cloud) and LV opacification ---------------------------
  // a ventriculogram or aortogram is drawn by lvGram.ts (chamber tubes stay on the ribbon path)
  const chamberRun = !!(b && trace && (b.lv || b.aortogram));
  const chamberTubes: TubeSpec[] = [];
  let lvGram: LvGramContrast | undefined;
  if (b && cf && !chamberRun) {
    // reflux into the sinus: the jet the ostium does not take (missed, or in excess of what the coronary
    // accepts); cleared by aortic flow (contrastTransport SINUS)
    const muI = full * cf.sinus;
    if (muI > full * 0.002) {
      const R = inp.model.sinusRadius;
      const r0 = V3.v(0, R * 0.55, 0);
      const root = moveWorld(V3.add(r0, rootDisplacement(m, r0.y, H)), rootW * 0.6);
      bones.push({ type: 0, c: root, ax: [V3.v(1, 0, 0), V3.v(0, 1, 0), V3.v(0, 0, 1)], half: [R * 1.05, R * 0.85, R * 1.05], mu: 0, muI });
      const a0 = V3.v(0, 45, 0);
      const asc = moveWorld(V3.add(a0, rootDisplacement(m, a0.y, H)), rootW * 0.4);
      bones.push({ type: 1, c: asc, ax: [V3.v(1, 0, 0), V3.v(0, 1, 0), V3.v(0, 0, 1)], half: [15, 30, 15], mu: 0, muI: muI * 0.6 });
    }
  }
  if (b && trace && chamberRun) {
    // the LV cavity with segmental wall motion, the LA (MR), the aorta (ejection or the root injection) and the
    // case's findings, opacified through lvGram's beat-by-beat compartments from this run's trace
    const fr = lvGramFrame({
      H,
      m,
      spec: inp.lvGram ?? {},
      trace,
      site: b.aortogram && !b.lv ? "root" : "lv",
      t: b.t,
      clock,
      full,
      sinusRadius: inp.model.sinusRadius,
      toHeart: (p) => moveWorld(p, 1),
      // the root and aorta move with the root's motion at their height, and with breathing as the reflux cloud does
      toAortic: (p) => moveWorld(V3.add(p, rootDisplacement(m, p.y, H)), rootW * (0.6 - 0.2 * Math.min(1, Math.max(0, (p.y - 10) / 50)))),
      // an LV injection's puff starts at the injecting catheter's tip (the last point of its centre line)
      tip: (inp.catheterNodes ?? inp.catheterRoot)[(inp.catheterNodes ?? inp.catheterRoot).length - 1] ?? null,
      view: viewDirection(inp.cArm),
    });
    chamberTubes.push(...fr.tubes);
    bones.push(...fr.bones);
    lvGram = fr.contrast;
  } else if (inp.lvGram?.stain) {
    // a myocardial stain outlasts the run that made it: after the bolus it clears over minutes
    // (LvGramSpec.stain.sinceS, seconds since the staining push; nothing is drawn without it)
    const s = stainAfterRun(inp.lvGram);
    if (s > 0.002) {
      const sp = stainPrims({ H, m, spec: inp.lvGram, full, toHeart: (p) => moveWorld(p, 1) }, s);
      chamberTubes.push(...sp.tubes);
      bones.push(...sp.bones);
    }
  }

  // ---- bypass grafts (diag-grafts-svg): the conduits' contrast and their ring markers ----
  // An unopacified graft is invisible, as on a real image; a ring marker at the aortic anastomosis is metal and shows
  // on every frame. A graft fills when it is injected (its own network), back-fills from its anastomosis on a native
  // run of its side (competitive flow), and fills over its first centimetres, or its whole stump, on an aortogram.
  for (const g of inp.tree.grafts ?? []) {
    // what this frame draws of the graft, decided before its path is placed: its ring marker, and contrast from its
    // own injection, from back-filling on a native run of its side, or from the root on an aortogram
    const own = !!b && !!cf && !!gnet && graftInj === g;
    const back = !!b && !!cf && !gnet && !b.lv && !b.aortogram && b.side === g.side ? competition.find((x) => x.graft === g.name)?.backfill ?? null : null;
    const aorta = b && cf && b.aortogram && lvGram ? lvGram.aorta : 0;
    if (!g.graft.ringMarker && !own && !back && !(aorta > 0)) continue;
    const rp = renderPath(g, m);
    const end = g.occludedFrom >= 0 ? Math.min(rp.samples.length - 1, g.occludedFrom) : rp.samples.length - 1;
    const pts = rp.samples.slice(0, end + 1).map(place);
    const radii = rp.radii.slice(0, end + 1);
    if (g.graft.ringMarker && pts.length > 3) tubes.push(graftRing(pts, radii));
    if (!b || !cf || pts.length < 2 || (!own && !back && !(aorta > 0))) continue;
    let th: Float32Array | null = null;
    let gain = 1;
    if (own) th = thetaOnPath(gnet!, g, pts.length);
    else if (back) {
      th = back.theta;
      gain = back.gain;
    }
    const hash = vesselHash(g.name);
    let any = false;
    const mu: [number, number, number][] = pts.map((_, i) => {
      let conc = 0;
      if (th && th[i] < THETA_MAX_S - 1e-3) conc = cf.at(th[i]) * cf.streak(th[i], hash) * gain;
      if (aorta > 0) conc = Math.max(conc, aorta * AORTOGRAM_GRAFT.share * Math.exp(-g.pathMm[i] / AORTOGRAM_GRAFT.fadeMm));
      if (conc > 1e-3) any = true;
      return [0, full * conc, 0];
    });
    if (any) tubes.push({ pts, r: radii, mu, core: VESSEL_PROFILE.laminarCore });
  }

  // ---- myocardial blush: the capillary-phase ground-glass opacity of the injected territory ----
  // (contrastTransport: fed by the strength reaching the arteriolar ends, cleared with BLUSH.tauS;
  // reduced and slower with slow flow / no-reflow)
  if (b && b.side && !b.lv && !b.aortogram && cf) {
    // global slow flow, and the share of the territory whose antegrade flow a balloon cuts or no-reflow slows
    const imp = net ? net.impaired[b.side] : 0;
    const blush = cf.blush * Math.min(1, inp.flowScale ?? 1) * (1 - imp * (1 - Math.max(0, Math.min(1, inp.flowMods?.noReflow?.scale ?? 0))));
    if (blush > 0.01) {
      const left = b.side === "left";
      let c = V3.add(H.base, V3.sc(H.L, H.len * 0.45));
      if (!left) c = V3.add(c, V3.add(V3.sc(H.S, -18), V3.sc(H.A, 12)));
      const k = 1 - 0.12 * e;
      bones.push({
        type: 0,
        c: moveWorld(c, 1),
        ax: [H.L, H.A, H.S],
        half: [H.len * 0.52 * k, (left ? 46 : 36) * k, (left ? 50 : 38) * k],
        mu: 0,
        muI: MU.iodinePerMg * contrastTune().blushMg * blush,
      });
    }
  }

  // ---- catheter and wire ------------------------------------------------------
  // the legacy fixed catheter path bobs with the aortic root (the tip with the ostium, decaying up
  // the shaft); a rod-solver centre line (catheterNodes) already carries that motion
  const tetherOn = inp.legacyCatheter ?? !inp.catheterNodes;
  const tether = (pts: Vec3[], fromTip: number[]) =>
    tetherOn ? pts.map((p, i) => V3.add(p, V3.sc(rootDisplacement(m, p.y, H), catheterTether(fromTip[i])))) : pts;
  const topY = inp.catheterRoot[0]?.y ?? 54;
  const cathAortic = inp.catheterNodes ?? [...aorticCourse(inp.caseData.accessRoute, topY).slice(0, -1), ...inp.catheterRoot];
  const cathRaw = resample(cathAortic, 2.5);
  const cath = tether(cathRaw, distFromEnd(cathRaw)).map((p) => moveWorld(p, rootW));
  // a hollow polymer shaft with a braided wall: outer and inner radius from the French size and the lumen
  // table; the wall carries the braid (metal channel) and the jacket filler (contrast-like channel)
  const isGuide = inp.guide ?? inp.french >= 6;
  const od = CATHETER_OD_MM[inp.french] / 2;
  const id = Math.min(od - 0.05, lumenForFrench(inp.french, isGuide).idMm / 2);
  const wallMu: [number, number, number] = [0, CATHETER_WALL.jacket, CATHETER_WALL.braid];
  // what the lumen holds: the main catheter's own state when given; otherwise, during a run, the run's trace (the
  // syringe's contrast displaces the old contents from the hub as the dead volume is pushed); saline without a run
  // (a live trace with catheterContrast given is another catheter's run: the main lumen keeps its own state)
  const fill: LumenFill =
    b && trace && !(b.trace && inp.catheterContrast !== undefined)
      ? lumenFillAt(trace, b.t)
      : { front: 0, behind: inp.catheterContrast ?? 0, ahead: inp.catheterContrast ?? 0 };
  tubes.push({ pts: cath, r: cath.map(() => od), mu: wallMu });
  // the visible course is the distal part of a 100 cm catheter: a sample d mm from the tip lies (L - d) / L from the hub
  const cathLenMm = lumenForFrench(inp.french, isGuide).lengthMm;
  const fromTip = distFromEnd(cathRaw);
  const split = fromTip.findIndex((d) => (cathLenMm - d) / cathLenMm > fill.front);
  const lumenTube = (pts: Vec3[], share: number) => {
    if (pts.length >= 2) tubes.push({ pts, r: pts.map(() => id), mu: [0, full * Math.max(0, Math.min(1, share)) - wallMu[1], -wallMu[2]] });
  };
  if (split < 0) lumenTube(cath, fill.behind);
  else if (split === 0 || fill.behind === fill.ahead) lumenTube(cath, split === 0 ? fill.ahead : fill.behind);
  else {
    lumenTube(cath.slice(0, split + 1), fill.behind);
    lumenTube(cath.slice(split), fill.ahead);
  }
  if (inp.catheter2) {
    const c2 = inp.catheter2;
    const course2 = aorticCourse(c2.route, c2.root[0]?.y ?? 54);
    const raw2 = resample([...course2.slice(0, -1), ...c2.root], 2.5);
    const pts2 = tether(raw2, distFromEnd(raw2)).map((p) => moveWorld(p, rootW));
    const od2 = CATHETER_OD_MM[c2.french] / 2;
    const id2 = Math.min(od2 - 0.05, lumenForFrench(c2.french, false).idMm / 2);
    tubes.push({ pts: pts2, r: pts2.map(() => od2), mu: wallMu });
    tubes.push({ pts: pts2, r: pts2.map(() => id2), mu: [0, (c2.injecting ? full : full * Math.max(0, Math.min(1, c2.lumen ?? 0))) - wallMu[1], -wallMu[2]] });
  }
  // soft tip: slightly denser than the shaft, not a separate marker band
  const tipSeg = cath.slice(-2);
  if (tipSeg.length === 2) tubes.push({ pts: tipSeg, r: [od * 0.9, od * 0.8], mu: [0, 0, 0.08] });

  if (inp.wire && inp.wire.pts.length >= 2) {
    // the wire leaves the catheter tip: it moves with the tip (full tether)
    const wRaw = resample(inp.wire.pts, 1.5);
    const w = tether(wRaw, wRaw.map(() => 0)).map((p) => moveWorld(p, rootW));
    const rw = inp.wire.kind === "035" ? 0.445 : 0.178;
    // core steel, then a dense radiopaque coil over the distal 30 mm (coronary wires)
    tubes.push({ pts: w, r: w.map(() => rw), mu: [0, 0, inp.wire.kind === "035" ? 0.95 : 1.9] });
    if (inp.wire.kind === "014") {
      let acc = 0;
      const tip: Vec3[] = [w[w.length - 1]];
      for (let i = w.length - 2; i >= 0 && acc < 30; i--) {
        acc += Math.hypot(w[i + 1].x - w[i].x, w[i + 1].y - w[i].y, w[i + 1].z - w[i].z);
        tip.unshift(w[i]);
      }
      tubes.push({ pts: tip, r: tip.map(() => rw), mu: [0, 0, 6.5] });
    }
  }

  if (inp.extras) {
    const ex = inp.extras(place, { bolusT: b ? b.t : null, injecting });
    if (ex.tubes) tubes.push(...ex.tubes);
    if (ex.bones) bones.push(...ex.bones);
  }

  // ---- camera and imaging chain ------------------------------------------------
  // the table is positioned so the coronary tree is centred (iso-centre at the heart)
  const iso = V3.add(treeCentre(inp.tree, inp.centreOn ?? "both"), inp.pan ?? V3.v(0, 0, 0));
  const field = inp.field ?? 230;
  const cam = makeCamera(inp.cArm, iso, field);
  // automatic dose-rate control (adrc.ts): water-equivalent path of this patient and projection ->
  // kVp, mA, pulse width, Cu -> detected quanta and contrast gains
  const cine = inp.mode === "cine";
  const body = thorax.anat[0]; // BODY: elliptic cylinder along y (half: x, y, z)
  const path = patientPath(inp.cArm, { body: { a: body.half[0], b: body.half[2] }, isoAboveTableMm: iso.z - (body.c.z - body.half[2]) });
  const settings: AdrcSettings = { ...DEFAULT_SETTINGS, ...inp.exposure, mode: inp.mode, fieldMm: field };
  const waterCm = inp.meteredWaterCm ?? path.waterCm;
  const exposure = inp.adrc
    ? inp.adrc.step({ settings, waterCm, tableSec: path.tableInBeam ? path.tableSec : null, meter: inp.meter ?? null })
    : steadyState(settings, inp.meteredWaterCm != null ? { ...path, waterCm } : path);
  const ex = imageParamsFromAdrc(exposure, { calibration: inp.calibration ?? ADRC_CALIBRATION });
  const params: ImageParams = {
    counts: ex.counts * (REFERENCE_FIELD_MM / COUNTS_CALIBRATION_FIELD_MM),
    recursive: cine ? 0.12 : 0.5,
    edge: cine ? 0.75 : 0.55,
    spr: ex.spr,
    iodineGain: ex.iodineGain,
    metalGain: ex.metalGain,
    gridIn: ex.gridIn,
    pulseWidthMs: ex.pulseWidthMs,
    window: cine ? 2.3 : 2.7,
    // flat-panel harmonisation and level calibrated against real Philips cine frames
    // (CoronaryDominance dataset): grey-level quartiles of standard views match within ~10 levels
    drc: 0.7,
    level: -0.12,
    seed: inp.frame * 1.618,
    field: "square",
    mode: inp.mode,
  };
  if (inp.framesSinceStart !== undefined) params.framesSinceStart = inp.framesSinceStart;
  if (inp.profile) params.profile = inp.profile;

  // ---- extra-pass inputs ----------------------------------------------------------
  const extra: Record<string, unknown> = {
    [CLUTTER_KEY]: clutterStateFromAnat(thorax.anat, thorax.clutterSeed ?? (seed !== undefined ? seedFrom(seed) : 0)),
  };
  if (thorax.segments) extra[THORAX_SEGMENTS_KEY] = thorax.segments;
  // rib centre lines for CPU readers (capture annotations): with thorax segments the ribs are not tubes
  if (thorax.ribLines) extra.ribLines = thorax.ribLines;
  let outTubes = tubes;
  // Note (diag-lesion-morphologies): the lesion morphologies are built for the default ribbon path above. On this
  // off-by-default integrator path (HANDOVER 6.1) an eccentric lumen is drawn as its equal-area round lumen (the
  // integrator has no flattened cross-section), and the thrombus defect, haze and false-lumen tubes reach it as
  // device-like tubes without vessel topology; giving segments/ an elliptical cross-section is left to the package
  // that switches the integrator on.
  if (useSegments) {
    const moved = tubes.slice(firstNonThorax);
    outTubes = tubes.slice(0, firstNonThorax);
    const index = new Map(moved.map((t, i) => [t, i]));
    const prev = prevSeg.get(inp.tree);
    const dt = prev ? inp.t - prev.t : 0;
    const live = !!prev && dt > 0 && dt < 0.2;
    const batch = tubesToSegments(moved, {
      // exact branch topology from the tree (the automatic search remains for devices)
      parentOf: (t) => {
        const v = vesselOfTube.get(t);
        if (!v) return undefined;
        const pt = v.parent ? tubeOfVessel.get(v.parent.name) : undefined;
        if (!pt || !index.has(pt) || !v.parent) return null;
        // the parent may be drawn on its dense path: first dense sample at or beyond the base index
        const pbi = baseIndexOf.get(v.parent.name);
        let at = v.parent.index;
        if (pbi) {
          const j = pbi.findIndex((x) => x >= v.parent!.index);
          at = j < 0 ? pbi.length - 1 : j;
        }
        return { tube: index.get(pt)!, at };
      },
      prevTubes: live ? prev!.tubes : null,
      motion: live ? { dtS: dt, pulseS: (params.pulseWidthMs ?? 8) / 1000 } : null,
      gains: [1, params.iodineGain, params.metalGain],
      // same tree object => same layout: reuse the branch and family host slots
      topologyFrom: prev?.batch ?? null,
    });
    extra[SEGMENTS_KEY] = batch;
    // the moved tubes, for CPU consumers (capture annotations, tests): not drawn by the ribbon path
    extra.segmentTubes = moved;
    prevSeg.set(inp.tree, { tubes: moved, t: inp.t, batch });
  }
  if (chamberTubes.length) outTubes = outTubes === tubes ? [...tubes, ...chamberTubes] : [...outTubes, ...chamberTubes];
  const contrast: ContrastSummary | null =
    b && cf
      ? {
          t: b.t,
          injecting,
          arrival: cf.arrival,
          qInj: cf.now.qInj,
          qCoronary: cf.now.qCoronary,
          qReflux: cf.now.qReflux,
          inlet: cf.now.inlet,
          blush: cf.blush,
          sinus: cf.sinus,
          volumeMl: trace ? volumeUpTo(trace, b.t) : 0,
          vessels: contrastVessels,
          ...(rootFields ? { rootShares: Object.fromEntries([...rootFields].map(([k, x]) => [k, x.share])) } : {}),
        }
      : null;
  return { scene: { cam, anat: thorax.anat, bones, tubes: outTubes, extra }, params, resp, contraction: e, motion: m, exposure, iso, contrast, ...(lvGram ? { lvGram } : {}) };
}

// ---------------------------------------------------------------------------
// Renderer side of the scene. XrayRenderer itself registers the thorax segment pass, registers
// the vessel segment and thin-object passes on the first scene that carries a segment batch, and
// sets the lung clutter uniforms every frame (wave 2, track C1; this replaced the render() bridge
// track I1 kept here). installScenePasses() remains for callers that want the passes registered
// before the first frame (for example to compile their programs early).
// ---------------------------------------------------------------------------

/** Register the passes for the scene's extra data ahead of the first frame (optional: render() does it on demand). */
export function installScenePasses(xr: XrayRenderer, o: { segments?: boolean } = {}) {
  if (o.segments ?? segmentsEnabled(SEGMENTS_DEFAULT)) {
    if (!xr.hasPass(SEGMENTS_KEY)) {
      const seg = createSegmentPass({ velocity: true });
      seg.velocityTarget = () => xr.getVelocityTarget();
      xr.addPass(seg);
      xr.addPass(createThinPass());
    }
  }
}

// ---------------------------------------------------------------------------
// LabImaging: the per-lab imaging state both labs keep (one patient clock,
// one dose-rate controller, one dose tracker, run bookkeeping, meter hand-off).
// ---------------------------------------------------------------------------

export interface LabFrame {
  clock: ClockState;
  framesSinceStart: number;
  adrc: Adrc;
  exposure: Partial<AdrcSettings>;
  meter: AdrcInput["meter"];
  /** the rendered patient's water-equivalent path from the latest meter reading of this run (cm), or null */
  meteredWaterCm: number | null;
  breathHold: number | null;
}

/**
 * The mounted labs' imaging state, for UI that shows dose and technique (a DosePanel reads
 * labImaging.pci?.dose.totals, .live, .skinMap and lastExposure). Set by the lab views while mounted.
 */
export const labImaging: { diagnostic: LabImaging | null; pci: LabImaging | null } = { diagnostic: null, pci: null };

/** Longest wall-clock gap the patient clock is advanced by in one call (s): a hidden tab must not replay minutes. */
const MAX_CLOCK_STEP_S = 2;
/** Longest exposure interval booked as beam-on time for one frame (s). */
const MAX_EXPOSE_STEP_S = 0.2;

export class LabImaging {
  readonly clock: CardiacClock;
  readonly adrc = new Adrc();
  readonly dose = new DoseTracker();
  /** exposure settings (fluoro level, pulse rates, grid) */
  exposure: Partial<AdrcSettings> = { fluoroLevel: "normal", fluoroPps: 15, cinePps: 15, grid: true };
  operator: OperatorSetup = { ...DEFAULT_OPERATOR };
  /** latest controller state (technique, dose rates) for display */
  lastExposure: AdrcState | null = null;
  /** called after each exposed frame (for a dose panel) */
  onExpose: ((st: AdrcState, lab: LabImaging) => void) | null = null;
  private run: { mode: "fluoro" | "cine"; frames: number } | null = null;
  private lastReading: MeterReading | null = null;
  private meteredCm: number | null = null;
  private lastWall: number | null = null;
  private lastExposeWall: number | null = null;

  /** the clock belongs to a patient engine that advances it (the image then follows the engine's ECG and breathing) */
  private readonly externalClock: boolean;

  constructor(o: { hr?: number; seed?: string | number; clock?: CardiacClock } = {}) {
    this.clock = o.clock ?? new CardiacClock({ hr: o.hr ?? 72, seed: o.seed !== undefined ? seedFrom(o.seed) : 1 });
    this.externalClock = !!o.clock;
  }

  /** Advance the patient clock by the wall-clock time since the last call (ms timestamps, e.g. performance.now()). An engine's clock is advanced by the engine, not here. */
  tick(nowMs: number) {
    if (this.lastWall !== null && !this.externalClock) this.clock.advance(Math.min(MAX_CLOCK_STEP_S, Math.max(0, (nowMs - this.lastWall) / 1000)));
    this.lastWall = nowMs;
  }

  /** Inputs for an exposed frame in `mode`: clock state, run frame, controller, a new meter reading if any. */
  frame(mode: "fluoro" | "cine", xr: XrayRenderer | null): LabFrame {
    if (!this.run || this.run.mode !== mode) this.run = { mode, frames: 0 };
    else this.run.frames++;
    const hold = mode === "cine" ? CINE_BREATH_HOLD : null;
    this.clock.holdBreath(hold);
    const r = xr?.lastMeter ?? null;
    // a reading from before this run (another view, another mode) is not used; within the run each new
    // reading is handed over once, and its path stands for the rendered patient until the next one
    if (this.run.frames === 0) this.meteredCm = null;
    const fresh = !!r && r !== this.lastReading && this.run.frames > 0;
    if (fresh) this.meteredCm = -Math.log(Math.max(1e-6, r!.primaryTransmission)) / (MU.soft * 10);
    const meter = fresh && this.meteredCm !== null ? { waterCm: this.meteredCm } : null;
    this.lastReading = r;
    return { clock: this.clock.state(), framesSinceStart: this.run.frames, adrc: this.adrc, exposure: this.exposure, meter, meteredWaterCm: this.meteredCm, breathHold: hold };
  }

  /** Book an exposed frame's dose (after buildXrayScene). */
  expose(res: Pick<SceneResult, "exposure" | "iso" | "params" | "scene">, cArm: CArm, fieldMm: number, nowMs: number) {
    const pps = res.exposure.pps || 15;
    const dt = this.lastExposeWall === null ? 1 / pps : Math.min(MAX_EXPOSE_STEP_S, Math.max(0, (nowMs - this.lastExposeWall) / 1000));
    this.lastExposeWall = nowMs;
    this.lastExposure = res.exposure;
    this.dose.expose({
      adrc: res.exposure,
      dtS: dt,
      geometry: { cArm, iso: res.iso, fieldMm, shutters: res.params.shutters },
      body: bodyFromAnat(res.scene.anat[0]),
      operator: this.operator,
      tPatient: this.clock.state().t,
    });
    this.onExpose?.(res.exposure, this);
  }

  /** The beam is off (pedal released, last-image hold): the next exposure starts a new run. */
  beamOff(nowMs: number) {
    if (this.run) {
      this.run = null;
      this.clock.holdBreath(null);
    }
    if (this.lastExposeWall !== null) {
      this.dose.idle(Math.min(MAX_CLOCK_STEP_S, Math.max(0, (nowMs - this.lastExposeWall) / 1000)));
      this.lastExposeWall = null;
    }
  }
}
