// ---------------------------------------------------------------------------
// Realism harness: deterministic X-ray frame capture (development builds only).
//
// Two layers:
//  1. Pure, GL-free functions (safe in Node and vitest): build the same scene the
//     PCI lab draws for a capture spec at a fixed time step t_k = t0 + k / fps, and
//     project anatomy for CPU realism gates (vessel motion, catheter motion, iodine
//     time course). Other streams import these into their own tests together with
//     the bands in datasets/library/realism_targets.json.
//  2. Browser capture: window.__xrayCapture renders specs on its own detached canvas
//     and XrayRenderer (no requestAnimationFrame, so a hidden pane does not pause it),
//     reads the frame back synchronously, encodes an 8-bit grey PNG and POSTs it to
//     the dev server's /__capture/<set>__<sequence>_fNNN.png. Per-sequence metadata
//     (spec, C-arm, timestamps, frame hashes, projected annotations) travels as
//     <set>__<sequence>.meta.png: a grey PNG whose bytes are "XCMETA1\n", an 8-digit
//     length and UTF-8 JSON (the endpoint accepts PNG only). scripts/realism/ reads both.
//  3. The realism baseline (docs/realism/baseline.md): the scorecard's specs, PCI device scenes drawn
//     through the PCI lab's pciDevices (guide, wire, balloon, stent), and live-path sequences filmed through
//     the diagnostic and PCI labs' own render paths by their dev hooks. Device and live runs carry
//     spec.role "device" / "live"; report.py measures them but leaves them out of the pass count.
//     __xrayCapture.baseline("baseline"), then __xrayCapture.live("pci") and .live("diagnostic") with each
//     lab open; score with python3 scripts/realism/report.py baseline and compare later sets with
//     python3 scripts/realism/compare_sets.py baseline <set>. With the rod mechanics on (diag-rod-physics)
//     the diagnostic live run seats the catheter through the solver (window.__lab.seatPhysics) and films
//     its centre line; the metadata records which mechanics ran.
//
// Install from src/main.tsx under import.meta.env.DEV (see docs/realism/wave1/S0.md):
//   if (import.meta.env.DEV) void import("./dev/xrayCapture").then((m) => m.installXrayCapture());
// ---------------------------------------------------------------------------

import type { CArm, Vec3, VesselId } from "../types";
import { buildAnatomy, type AnatomyModel } from "../simulation/anatomy";
import { buildCoronaryTree, type CoronaryTree, type Sample } from "../render/xray/coronaryTree";
import { buildXrayScene, type SceneInput } from "../render/xray/sceneBuilder";
import { XrayRenderer, type ImageParams, type SystemProfileId, type XrayCamera, type XrayScene } from "../render/xray/XrayRenderer";
import type { AccumulationPass } from "../render/xray/passes";
import type { TubeSpec } from "../render/xray/thorax";
import { catheterById } from "../data/catheters";
import { VIEW_PRESETS, viewById } from "../data/viewPresets";
import { catheterPath } from "../ui/sim/helpers";
import { PCI_SCENARIOS, deflate, inflate, initialPci, loadDevice, lumenFor, moveDevice, moveWire, pciGeom, removeDevice, scenarioCase, type PciGeom, type PciScenario, type PciState } from "../simulation/angioPci";
import { CINE_RUN_S, STANDARD_PUSH_S } from "../simulation/injection";
import { BALLOON_SPEC, STENT_SPEC } from "../simulation/pciBench";
import { wireToTarget } from "../simulation/pci/testSetup";
// the PCI lab's own device drawing and live flow conditions (device scenes draw exactly what the lab draws)
import { pciDevices, pciFlowMods } from "../ui/sections/AngioPci";

/** Calibration handles (development): the live tuning objects the renderer and scene builder read. */
export { SYSTEM_PROFILES } from "../render/xray/systemProfiles";
export { ANATOMY_TUNE } from "../render/xray/thorax";
export { CATHETER_WALL, VESSEL_PROFILE } from "../render/xray/sceneBuilder";
import { SYSTEM_PROFILES as SYSTEM_PROFILES_LIVE, type SystemProfile } from "../render/xray/systemProfiles";
import { ANATOMY_TUNE as ANATOMY_TUNE_LIVE } from "../render/xray/thorax";
import { CLUTTER_TUNE as CLUTTER_TUNE_LIVE } from "../render/xray/clutter";
import { CATHETER_WALL as CATHETER_WALL_LIVE, VESSEL_PROFILE as VESSEL_PROFILE_LIVE } from "../render/xray/sceneBuilder";

// ---------------------------------------------------------------------------
// spec
// ---------------------------------------------------------------------------

export interface CaptureSpec {
  /** capture set (folder under datasets/tmp/captures); letters, digits and '-' */
  set: string;
  /** sequence name within the set; letters, digits, '-' and '_' */
  name: string;
  /** offscreen (deterministic, default) or the live lab canvas through its dev hooks */
  source?: "offscreen" | "pci-hook" | "fluoro-hook";
  /** PCI scenario id (src/simulation/angioPci.ts); default lad-focal for LCA, rca-calcified for RCA */
  scenario?: string;
  artery?: "LCA" | "RCA";
  /** C-arm preset id (src/data/viewPresets.ts) */
  view?: string;
  /** explicit C-arm angles; override `view` */
  cArm?: CArm;
  /** detector field in cm (the PCI lab default is 20) */
  fieldCm?: number;
  mode?: "cine" | "fluoro";
  /** frames per second (default 15, the lab's cine rate) */
  fps?: number;
  /** frames to keep (default: the lab's cine run, CINE_RUN_S 3.4 s, at the frame rate: 51 at 15 frames/s) */
  nFrames?: number;
  /** model time of frame 0 in seconds (cardiac and breathing phase); default 0 */
  t0?: number;
  /** heart rate in beats/min; default: the scene builder's own default */
  heartRate?: number;
  /** contrast injection: the press (s from frame 0; the push follows the operator delay inside the scene
   * builder) and the push duration; null for no contrast. Default { at: 0, duration: STANDARD_PUSH_S }:
   * the lab's press starts the cine run with a standard push. */
  injection?: { at: number; duration?: number; side?: "left" | "right" } | null;
  /** noise seed offset (integer); default 1 */
  seed?: number;
  /** frames rendered before frame 0 and discarded, in fluoroscopy mode as in the lab before a run (default 4) */
  warmup?: number;
  /** canvas size in px (default 768, as the lab) */
  res?: number;
  /** record projected annotations (vessels, catheter, rib margins) in the metadata; default true */
  annotate?: boolean;
  /** POST frames to the dev server; default true */
  upload?: boolean;
  /** free text copied to the metadata (for example the paired real run in the drill) */
  note?: Record<string, unknown>;
  /** imaging-system profile passed to the renderer as ImageParams.profile; default: the renderer's own default */
  profile?: SystemProfileId;
  /**
   * The injecting catheter: the PCI scenario's 6 Fr guide (default) or a 6 Fr diagnostic catheter (thicker
   * wall, 1.42 mm lumen), as in diagnostic angiography such as the library's CoronaryDominance runs.
   */
  catheter?: "guide" | "diagnostic";
  /**
   * Calibration only: ImageParams fields merged over the scene builder's parameters on every frame
   * (for example { spr: 0.4 } or { edge: 1 }). Recorded in the metadata; never used by the scorecard sets.
   */
  params?: Partial<ImageParams>;
  /**
   * Draw the PCI lab's devices through pciDevices (src/ui/sections/AngioPci.tsx) at one stage of a case
   * driven through the PCI engine: the guide in the left main (wire tip just out of it), the wire across the lesion, a
   * balloon inflated in the lesion, or a stent deployed (realism-baseline). Offscreen captures only.
   */
  devices?: PciDeviceStage;
  /**
   * How the scorecard treats the run (scripts/realism/report.py): "scorecard" runs make the pass count;
   * "device" and "live" runs are measured with the same code but listed as measurements outside it, since
   * no real reference band exists for them yet. Default: "live" for the hook sources, "device" with
   * `devices`, otherwise "scorecard".
   */
  role?: CaptureRole;
  /**
   * Harness check only: scale the lumen radius of every coronary on one side by `scale` before drawing
   * (a deliberately narrowed tree, to show that the scorecard and compare_sets.py catch a degraded image).
   * Never used by the baseline set.
   */
  narrowTree?: { side: "left" | "right"; scale: number };
}

/** Stages of a PCI case drawn by the device scenes, in the order a case reaches them. */
export type PciDeviceStage = "guide" | "wire" | "balloon" | "stent";
export const PCI_DEVICE_STAGES: PciDeviceStage[] = ["guide", "wire", "balloon", "stent"];
export type CaptureRole = "scorecard" | "device" | "live";

export interface ResolvedSpec extends Required<Omit<CaptureSpec, "heartRate" | "injection" | "note" | "view" | "cArm" | "profile" | "params" | "catheter" | "devices" | "narrowTree">> {
  catheter: "guide" | "diagnostic";
  params: Partial<ImageParams> | null;
  /** null = the renderer's default profile */
  profile: SystemProfileId | null;
  resolved: true;
  view: string | null;
  cArm: CArm;
  heartRate: number | undefined;
  injection: { at: number; duration: number; side: "left" | "right" } | null;
  note: Record<string, unknown>;
  devices: PciDeviceStage | null;
  narrowTree: { side: "left" | "right"; scale: number } | null;
}

const NAME_RE = /^[A-Za-z0-9-]{1,24}$/;
const SEQ_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function resolveSpec(spec: CaptureSpec | ResolvedSpec): ResolvedSpec {
  if ((spec as ResolvedSpec).resolved === true) return spec as ResolvedSpec;
  if (!NAME_RE.test(spec.set)) throw new Error(`capture set "${spec.set}": use 1-24 letters, digits or '-'`);
  if (!SEQ_RE.test(spec.name)) throw new Error(`sequence "${spec.name}": use 1-40 letters, digits, '-' or '_'`);
  const preset = spec.view ? viewById(spec.view) : undefined;
  if (spec.view && !preset) throw new Error(`unknown view preset ${spec.view}`);
  const artery: "LCA" | "RCA" = spec.artery ?? (preset?.side === "right" ? "RCA" : "LCA");
  const scenario = spec.scenario ?? (artery === "RCA" ? "rca-calcified" : "lad-focal");
  const s = PCI_SCENARIOS.find((x) => x.id === scenario);
  if (!s) throw new Error(`unknown PCI scenario ${scenario}`);
  const cArm = spec.cArm ?? preset?.cArm ?? viewById(s.views[0])!.cArm;
  const inj = spec.injection === undefined ? { at: 0, duration: STANDARD_PUSH_S } : spec.injection;
  const source = spec.source ?? "offscreen";
  if (spec.devices && !PCI_DEVICE_STAGES.includes(spec.devices)) throw new Error(`unknown device stage ${spec.devices}`);
  if (spec.devices && source !== "offscreen") throw new Error("device scenes are drawn offscreen; the hook sources film the lab as it stands");
  if (spec.narrowTree && !(spec.narrowTree.scale > 0 && spec.narrowTree.scale <= 1.5)) throw new Error("narrowTree.scale: use a factor in (0, 1.5]");
  const role: CaptureRole = spec.role ?? (source !== "offscreen" ? "live" : spec.devices ? "device" : "scorecard");
  return {
    resolved: true,
    set: spec.set,
    name: spec.name,
    source,
    role,
    devices: spec.devices ?? null,
    narrowTree: spec.narrowTree ? { side: spec.narrowTree.side, scale: spec.narrowTree.scale } : null,
    scenario,
    artery,
    view: spec.view ?? null,
    cArm: { laoRao: cArm.laoRao, cranialCaudal: cArm.cranialCaudal },
    fieldCm: spec.fieldCm ?? 20,
    mode: spec.mode ?? "cine",
    fps: spec.fps ?? 15,
    nFrames: spec.nFrames ?? Math.round(CINE_RUN_S * (spec.fps ?? 15)),
    t0: spec.t0 ?? 0,
    heartRate: spec.heartRate,
    injection: inj ? { at: inj.at, duration: inj.duration ?? STANDARD_PUSH_S, side: inj.side ?? s.side } : null,
    seed: spec.seed ?? 1,
    warmup: spec.warmup ?? 4,
    res: spec.res ?? 768,
    annotate: spec.annotate ?? true,
    upload: spec.upload ?? true,
    note: spec.note ?? {},
    profile: spec.profile ?? null,
    params: spec.params ?? null,
    catheter: spec.catheter ?? "guide",
  };
}

// ---------------------------------------------------------------------------
// scene construction (mirrors PciFluoro.draw in src/ui/sections/AngioPci.tsx)
// ---------------------------------------------------------------------------

/** The PCI case behind a device scene: its geometry, the engine state at the stage, and how it got there. */
export interface PreparedPci {
  stage: PciDeviceStage;
  g: PciGeom;
  st: PciState;
  /** indeflator pressure at the stage (atm; 0 when nothing is inflated) */
  atm: number;
  /** what the harness did, with the values it used (copied to the capture metadata) */
  steps: { action: string; [k: string]: unknown }[];
}

export interface Prepared {
  s: PciScenario;
  model: AnatomyModel;
  tree: CoronaryTree;
  /** present for device scenes (CaptureSpec.devices) */
  pci?: PreparedPci;
}

export interface PrepareOptions {
  devices?: PciDeviceStage | null;
  narrowTree?: { side: "left" | "right"; scale: number } | null;
}

const prepCache = new Map<string, Prepared>();

/** How far the guide stage's wire tip is out of the guide (mm along the first vessel; a capture-scene setting). */
export const GUIDE_STAGE_WIRE_MM = 5;

/**
 * Drive a fresh PCI case through the engine to a device stage, the way the PCI engine tests do
 * (src/simulation/pci/testSetup.ts): the guide is engaged and the wire tip advanced GUIDE_STAGE_WIRE_MM out of
 * it into the left main; or, from the guide with the wire in its lumen, the operator steers the wire to 35 mm
 * beyond the lesion; a semi-compliant balloon is loaded, centred on the lesion and inflated to
 * the catalogue's nominal pressure (BALLOON_SPEC, src/simulation/pciBench.ts); or a stent is loaded,
 * centred, deployed at the catalogue's nominal pressure (STENT_SPEC), deflated and its balloon withdrawn.
 * The device size is a capture-scene setting taken from the scenario's own geometry, not a device claim:
 * the reference diameter at the lesion rounded to 0.25 mm, and the lesion length plus 4 mm rounded up to
 * 2 mm. That length need not be one the PCI lab's device menu offers (AngioPci.tsx LENGTHS), and the
 * diameter is not clamped to the menu's range; a change of this rule re-baselines the device scenes.
 * The guide and wire states come from wireToTarget in src/simulation/pci/testSetup.ts (the engine tests'
 * simulated operator); a change there also re-baselines the device scenes (re-capture and rescore).
 */
export function pciStageState(s: PciScenario, g: PciGeom, tree: CoronaryTree, refTree: CoronaryTree, model: AnatomyModel, stage: PciDeviceStage): PreparedPci {
  const steps: PreparedPci["steps"] = [];
  let st = initialPci(s);
  steps.push({ action: "start", guideEngaged: true, tipMm: st.tipMm });
  if (stage === "guide") {
    // the guide seated in the left main with the wire just introduced: the tip advanced out of the guide
    // GUIDE_STAGE_WIRE_MM into the first vessel of the route (the proximal left main in lad-focal), so
    // pciDevices draws something the scorecard scene does not (with the tip in the guide's lumen the scene
    // was the scorecard scene, frame for frame)
    const first = g.byName.get(st.route[0]);
    const len = first ? first.pathMm[first.pathMm.length - 1] : 0;
    for (let guard = 0; guard < 200 && st.tipMm < GUIDE_STAGE_WIRE_MM; guard++) st = moveWire(s, g, st, 1);
    if (st.route.length !== 1 || st.tipMm <= 0 || st.tipMm >= len) throw new Error(`device scene ${s.id}: the wire tip did not stop in the ${st.route[0]} (tip ${st.tipMm.toFixed(1)} mm on ${st.route.join(">")}, vessel ${len.toFixed(1)} mm)`);
    steps.push({ action: "wire out of the guide", route: st.route.join(">"), tipMm: Math.round(st.tipMm * 10) / 10, vesselMm: Math.round(len * 10) / 10 });
    return { stage, g, st, atm: 0, steps };
  }
  st = wireToTarget({ s, g, tree, refTree, model }, st, 35);
  steps.push({ action: "wire", route: st.route.join(">"), tipMm: Math.round(st.tipMm * 10) / 10 });
  if (!st.route.includes(g.lesion.vessel) || st.tipMm < g.lesion.endMm) throw new Error(`device scene ${s.id}: the wire did not cross the lesion (tip ${st.tipMm.toFixed(1)} mm on ${st.route.join(">")})`);
  if (stage === "wire") return { stage, g, st, atm: 0, steps };
  const diameter = Math.round(g.lesion.refDiameter * 4) / 4;
  const lengthMm = Math.ceil((g.lesion.endMm - g.lesion.startMm + 4) / 2) * 2;
  const kind = stage === "stent" ? "stent" : "balloon";
  const atm = kind === "stent" ? STENT_SPEC.nominalAtm : BALLOON_SPEC["semi-compliant"].nominalAtm;
  st = loadDevice(st, kind, "semi-compliant", diameter, lengthMm);
  if (!st.device) throw new Error(`device scene ${s.id}: the ${kind} was not loaded`);
  st = moveDevice(st, g.lesion.centreMm - st.device.centreMm);
  st = inflate(s, g, st, atm);
  steps.push({ action: `${kind} at the lesion`, diameterMm: diameter, lengthMm, atm, centreMm: Math.round((st.device?.centreMm ?? 0) * 10) / 10, basis: "reference diameter rounded to 0.25 mm; lesion length + 4 mm rounded up to 2 mm; catalogue nominal pressure" });
  if (!st.device?.inflated) throw new Error(`device scene ${s.id}: the ${kind} did not inflate`);
  if (stage === "balloon") return { stage, g, st, atm, steps };
  st = removeDevice(deflate(st));
  steps.push({ action: "deflate and withdraw", stents: st.stents.length });
  if (st.device || !st.stents.length) throw new Error(`device scene ${s.id}: no deployed stent`);
  return { stage, g, st, atm: 0, steps };
}

/**
 * Anatomy and the diseased coronary tree of a PCI scenario, as the lab builds them: in its initial state, or
 * at a device stage (the lumen follows the engine state, as AngioPci.tsx's lumenFor memo does). The
 * default (no options) is the scorecard's scene, unchanged.
 */
export function prepareScenario(id: string, o: PrepareOptions = {}): Prepared {
  const key = `${id}|${o.devices ?? ""}|${o.narrowTree ? `${o.narrowTree.side}*${o.narrowTree.scale}` : ""}`;
  const hit = prepCache.get(key);
  if (hit) return hit;
  const s = PCI_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown PCI scenario ${id}`);
  const c = scenarioCase(s);
  const model = buildAnatomy(c);
  const refTree = buildCoronaryTree(model, { ...c, lesions: [] });
  const baseTree = buildCoronaryTree(model, c);
  const g = pciGeom(s, baseTree, refTree);
  const pci = o.devices ? pciStageState(s, g, baseTree, refTree, model, o.devices) : undefined;
  const lumen = lumenFor(s, g, pci ? pci.st : initialPci(s));
  const tree = buildCoronaryTree(model, { ...c, lesions: lumen.lesions }, lumen.scaffolds);
  if (o.narrowTree) {
    // a fresh tree (never the cached one): scale every lumen radius on the chosen side
    const k = o.narrowTree.scale;
    // (the lumen radii and the refined render path's radii; both arrays are built per tree, not cached)
    for (const v of tree.vessels) {
      if (v.side !== o.narrowTree.side) continue;
      v.radii = v.radii.map((r) => r * k);
      if (v.fine) v.fine = { ...v.fine, radii: v.fine.radii.map((r) => r * k) };
    }
  }
  const p: Prepared = { s, model, tree, ...(pci ? { pci } : {}) };
  prepCache.set(key, p);
  return p;
}

/** The prepared scene of a resolved spec. */
export function prepareFor(R: ResolvedSpec): Prepared {
  return prepareScenario(R.scenario, { devices: R.devices, narrowTree: R.narrowTree });
}

export interface SimFrame {
  /** frame index (negative for warm-up frames) */
  k: number;
  /** model time (s): exactly t0 + k / fps */
  t: number;
  /** seconds since the injection started, or null before it / without contrast */
  bolusT: number | null;
  mode: "cine" | "fluoro";
  scene: XrayScene;
  params: ImageParams;
  contraction: number;
  resp: number;
  /** heart-surface sample to world position for this frame (from the scene builder) */
  place: (sm: Sample) => Vec3;
}

/** Scene builder input for frame k of a resolved spec. */
export function sceneInputAt(p: Prepared, R: ResolvedSpec, k: number, sink: { place?: (sm: Sample) => Vec3 }): SceneInput {
  const { s, model, tree } = p;
  const t = R.t0 + k / R.fps;
  const warm = k < 0;
  const mode: "cine" | "fluoro" = warm ? "fluoro" : R.mode;
  const bt = R.injection && !warm ? t - R.t0 - R.injection.at : null;
  const cath = catheterById(s.guide);
  const os = s.side === "left" ? model.lm : model.rca;
  const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
  const root = catheterPath(model, tip, cath);
  const bside = R.injection?.side ?? s.side;
  const filled = [...new Set(tree.vessels.filter((v) => v.side === bside).map((v) => v.fillId))] as VesselId[];
  const cine = mode === "cine";
  let catheter2: SceneInput["catheter2"] = null;
  if (s.target.kind === "cto") {
    const os2 = s.side === "left" ? model.rca : model.lm;
    const tip2 = { pos: os2.pos, dir: os2.dir, height: os2.height, az: os2.az, radius: model.sinusRadius, cram: 0, gap: 0 };
    catheter2 = { root: catheterPath(model, tip2, catheterById(s.side === "left" ? "JR4" : "JL4")), route: "femoral", french: 6, injecting: cine && bt !== null && bside !== s.side && bt >= 0 && bt < 1.8 };
  }
  const pci = p.pci;
  return {
    model,
    caseData: { accessRoute: "radial-right", lesions: [{ vessel: s.target.vessel, position: s.target.position, severity: pci ? pci.st.severity : s.target.severity, kind: s.target.kind, lengthMm: s.target.lengthMm }], dominance: "right" },
    tree,
    catheterRoot: root,
    french: 6,
    guide: R.catheter !== "diagnostic",
    wire: null,
    bolus: cine && bt !== null && bt >= 0 && R.injection ? { filled, plume: "none", side: bside, t: bt, injectDur: R.injection.duration, peak: 1 } : null,
    catheter2,
    t,
    cArm: R.cArm,
    field: R.fieldCm * 10,
    centreOn: s.target.kind === "cto" ? "both" : s.side,
    mode,
    breathHold: cine ? 0.7 : null,
    // deterministic noise: the renderer seeds its noise from the frame number
    frame: R.seed * 100000 + 1000 + k,
    heartRate: R.heartRate,
    flowScale: 1,
    // device scenes: the PCI lab's live flow (an inflated balloon stops antegrade contrast beyond it)
    ...(pci ? { flowMods: pciFlowMods(s, pci.st, pci.g, tree) } : {}),
    extras: (place, ctx) => {
      sink.place = place;
      // device scenes: wire, balloon and stents drawn by the PCI lab's own function (AngioPci.tsx)
      return pci ? pciDevices(s, pci.st, pci.g, tree, place, ctx, pci.atm) : {};
    },
  };
}

/** The scene builder must hand its surface-to-world mapping to `extras`; without it every projected
 * annotation and motion gate would be meaningless, so fail loudly rather than guess. */
function requirePlace(sink: { place?: (sm: Sample) => Vec3 }, k: number): (sm: Sample) => Vec3 {
  if (!sink.place) throw new Error(`frame ${k}: buildXrayScene did not call SceneInput.extras(place); the capture harness needs the heart-surface mapping (see docs/realism/wave1/S0.md)`);
  return sink.place;
}

/**
 * Renderer parameters for frame k of a capture: the scene builder's parameters plus explicit run
 * bookkeeping, so the renderer never infers a run start from wall-clock gaps. Warm-up frames are
 * fluoroscopy frames 0..warmup-1 of their own run; the cine (or fluoro) run proper restarts at 0.
 */
export function runParams(base: ImageParams, R: ResolvedSpec, k: number, mode: "cine" | "fluoro"): ImageParams {
  const p: ImageParams = { ...base, ...(R.params ?? {}), mode, framesSinceStart: k < 0 ? k + R.warmup : k };
  if (R.profile) p.profile = R.profile;
  return p;
}

/** All frames of a spec (warm-up frames first, k < 0), without any GL. */
export function simulateSequence(spec: CaptureSpec | ResolvedSpec, opts: { warmup?: boolean } = {}): SimFrame[] {
  const R = (spec as ResolvedSpec).resolved === true ? (spec as ResolvedSpec) : resolveSpec(spec as CaptureSpec);
  const p = prepareFor(R);
  const out: SimFrame[] = [];
  const k0 = opts.warmup === false ? 0 : -R.warmup;
  for (let k = k0; k < R.nFrames; k++) {
    const sink: { place?: (sm: Sample) => Vec3 } = {};
    const inp = sceneInputAt(p, R, k, sink);
    const r = buildXrayScene(inp);
    out.push({ k, t: inp.t, bolusT: inp.bolus ? inp.bolus.t : null, mode: inp.mode, scene: r.scene, params: runParams(r.params, R, k, inp.mode), contraction: r.contraction, resp: r.resp, place: requirePlace(sink, k) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// projection helpers and CPU realism measures
// ---------------------------------------------------------------------------

/** Source-to-iso-centre distance used by sceneBuilder.ts makeCamera (not exported there). */
export const SCENE_SOD_MM = 760;

/** Radius of the renderer's circular field as a fraction of the canvas half-width (DISPLAY_FS: 0.985).
 * Only the circular field has this border; the lab's square field fills the canvas. */
export const FIELD_FRACTION = 0.985;

/** Field box (x0, y0, x1, y1; exclusive ends, canvas px). */
export type FieldBox = [number, number, number, number];

/**
 * The in-field box the Python harness finds in a capture (scripts/realism/metrics.py field_box), predicted
 * from the parameters: an edge row or column is outside the field when its mean over the central half
 * is below 0.2 x the centre, and at most 1/8 of the canvas is cut from each side. The model assumes the
 * field outside the collimation is black (circle) or fully covered by a blade (shutter of 0.2 or more
 * attenuation contrast); the scorecard measures the real box from the frames and records it.
 */
export function fieldBoxPx(params: Pick<ImageParams, "field" | "shutters">, res: number): FieldBox {
  const lim = Math.floor(res / 8);
  const h0 = Math.floor(res / 4),
    h1 = Math.floor((3 * res) / 4);
  let x0 = 0,
    x1 = res;
  let y0 = 0,
    y1 = res;
  if (params.field === "circle") {
    const R = (FIELD_FRACTION * res) / 2;
    const c = res / 2;
    // fraction of the central-half rows inside the disc for pixel column x (centre x + 0.5)
    const frac = (x: number) => {
      const dx = x + 0.5 - c;
      if (Math.abs(dx) >= R) return 0;
      const half = Math.sqrt(R * R - dx * dx);
      const lo = Math.max(h0, c - half),
        hi = Math.min(h1, c + half);
      return Math.max(0, hi - lo) / (h1 - h0);
    };
    while (x0 < lim && frac(x0) < 0.2) x0++;
    while (x1 > res - lim && frac(x1 - 1) < 0.2) x1--;
    y0 = x0;
    y1 = x1;
  } else if (params.shutters) {
    const [l, r, t, b] = params.shutters;
    x0 = Math.min(lim, Math.round(l * res));
    x1 = Math.max(res - lim, res - Math.round(r * res));
    y0 = Math.min(lim, Math.round(t * res));
    y1 = Math.max(res - lim, res - Math.round(b * res));
  }
  return [x0, y0, x1, y1];
}

/** Detector uv (−1..1, v up) to canvas px (top-left origin). */
export function uvToPx(u: number, v: number, res: number): { x: number; y: number } {
  return { x: ((u + 1) / 2) * res, y: ((1 - v) / 2) * res };
}

/** 512-analysis px per canvas px: the harness crops to the field box and resamples to 512
 * (scripts/realism/sources.py CaptureRun.scale512). Default box: the full canvas (the lab's square field). */
export function px512PerNative(res: number, box: FieldBox = [0, 0, res, res]): number {
  return 511 / (box[2] - box[0] - 1.01);
}

/** Canvas px to 512-analysis px (sources.py CaptureRun.to512). */
export function to512(x: number, y: number, res: number, box: FieldBox = [0, 0, res, res]): { x: number; y: number } {
  return { x: ((x - box[0]) * 511) / (box[2] - box[0] - 1.01), y: ((y - box[1]) * 511) / (box[3] - box[1] - 1.01) };
}

const xy = (q: { x: number; y: number }): [number, number] => [q.x, q.y];

export function projectPx(cam: XrayCamera, p: Vec3, res: number): { x: number; y: number; mag: number } {
  const q = XrayRenderer.project(cam, p);
  const px = uvToPx(q.u, q.v, res);
  return { x: px.x, y: px.y, mag: q.mag };
}

/** Detector mm per canvas px, and mm at the iso-centre plane per canvas px. */
export function pixelScale(cam: XrayCamera, res: number): { detMmPerPx: number; isoMmPerPx: number } {
  const half = Math.hypot(cam.detU.x, cam.detU.y, cam.detU.z);
  const det = (2 * half) / res;
  // magnification at the iso-centre = SID / SOD; SID from the camera, SOD = 760 mm as in sceneBuilder.ts makeCamera
  const sid = Math.hypot(cam.detC.x - cam.src.x, cam.detC.y - cam.src.y, cam.detC.z - cam.src.z);
  return { detMmPerPx: det, isoMmPerPx: det / (sid / SCENE_SOD_MM) };
}

function vesselSample(tree: CoronaryTree, name: string, frac: number): Sample {
  const v = tree.vessels.find((x) => x.name === name);
  if (!v) throw new Error(`no vessel ${name}`);
  const i = Math.max(0, Math.min(v.samples.length - 1, Math.round(frac * (v.samples.length - 1))));
  return v.samples[i];
}

export interface Track {
  /** positions in 512-analysis px */
  pts: { x: number; y: number }[];
  /** unit normal of the vessel at the reference frame (512 px space) */
  normal: { x: number; y: number };
}

/** Projected track of the sample at `frac` along a named vessel, in 512-analysis px. */
export function vesselTrack(spec: CaptureSpec, vessel: string, frac: number, refFrame = 0): Track {
  const R = resolveSpec({ ...spec, warmup: 0 });
  const frames = simulateSequence(R, { warmup: false });
  const p = prepareFor(R);
  const sm = vesselSample(p.tree, vessel, frac);
  const v = p.tree.vessels.find((x) => x.name === vessel)!;
  const i = v.samples.indexOf(sm);
  const sa = v.samples[Math.max(0, i - 2)];
  const sb = v.samples[Math.min(v.samples.length - 1, i + 2)];
  const box = fieldBoxPx(frames[0].params, R.res);
  const pts = frames.map((f) => {
    const q = projectPx(f.scene.cam, f.place(sm), R.res);
    return to512(q.x, q.y, R.res, box);
  });
  const f0 = frames[Math.min(refFrame, frames.length - 1)];
  const a = to512(...xy(projectPx(f0.scene.cam, f0.place(sa), R.res)), R.res, box);
  const b = to512(...xy(projectPx(f0.scene.cam, f0.place(sb), R.res)), R.res, box);
  const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { pts, normal: { x: -(b.y - a.y) / tl, y: (b.x - a.x) / tl } };
}

/** Catheter tip (last catheter centre-line point) track in 512-analysis px. */
export function catheterTipTrack(spec: CaptureSpec): Track {
  const R = resolveSpec({ ...spec, warmup: 0 });
  const frames = simulateSequence(R, { warmup: false });
  const box = frames.length ? fieldBoxPx(frames[0].params, R.res) : undefined;
  const pts: { x: number; y: number }[] = [];
  let normal = { x: 1, y: 0 };
  frames.forEach((f, idx) => {
    const c = findCatheter(sceneTubes(f.scene));
    if (!c) return;
    const tip = c.pts[c.pts.length - 1];
    const q = to512(...xy(projectPx(f.scene.cam, tip, R.res)), R.res, box);
    pts.push(q);
    if (idx === 0 && c.pts.length > 3) {
      const a = to512(...xy(projectPx(f.scene.cam, c.pts[c.pts.length - 4], R.res)), R.res, box);
      const tl = Math.hypot(q.x - a.x, q.y - a.y) || 1;
      normal = { x: -(q.y - a.y) / tl, y: (q.x - a.x) / tl };
    }
  });
  return { pts, normal };
}

export interface MotionStats {
  /** peak-to-peak displacement across the vessel (along the reference normal), px */
  crossRange: number;
  /** peak-to-peak displacement along the principal axis of the 2-D track, px */
  majorRange: number;
  stepMedian: number;
  stepP90: number;
  stepMax: number;
  /** cross-vessel steps (the component a fixed scan line measures, as xtrack.py) */
  crossStepMedian: number;
  crossStepP90: number;
  crossStepMax: number;
}

const quant = (v: number[], q: number) => {
  const s = [...v].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const pos = q * (s.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(s.length - 1, lo + 1);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};

export function motionStats(tr: Track): MotionStats {
  const { pts, normal } = tr;
  const cross = pts.map((p) => p.x * normal.x + p.y * normal.y);
  const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  let sxx = 0,
    syy = 0,
    sxy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const major = pts.map((p) => p.x * Math.cos(ang) + p.y * Math.sin(ang));
  const steps = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const csteps = cross.slice(1).map((c, i) => Math.abs(c - cross[i]));
  return {
    crossRange: Math.max(...cross) - Math.min(...cross),
    majorRange: Math.max(...major) - Math.min(...major),
    stepMedian: quant(steps, 0.5),
    stepP90: quant(steps, 0.9),
    stepMax: Math.max(...steps),
    crossStepMedian: quant(csteps, 0.5),
    crossStepP90: quant(csteps, 0.9),
    crossStepMax: Math.max(...csteps),
  };
}

/**
 * Every tube of a scene: the ribbon tubes plus, when the analytic segment integrator draws the vessels,
 * catheters and wires, the moved tubes the scene builder keeps for CPU readers (extra.segmentTubes).
 */
export function sceneTubes(scene: XrayScene): TubeSpec[] {
  const seg = scene.extra?.segmentTubes as TubeSpec[] | undefined;
  return seg && seg.length ? [...scene.tubes, ...seg] : scene.tubes;
}

/** Summed iodine in the coronary tubes per frame: sum of mu_iodine * pi r^2 * segment length (relative units). */
export function iodineAmount(scene: XrayScene): number {
  let sum = 0;
  for (const t of sceneTubes(scene)) {
    if (!Array.isArray(t.mu[0])) continue;
    const mu = t.mu as [number, number, number][];
    for (let i = 0; i + 1 < t.pts.length; i++) {
      const a = t.pts[i],
        b = t.pts[i + 1];
      const L = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      const r = 0.5 * (t.r[i] + t.r[i + 1]);
      sum += 0.5 * (mu[i][1] + mu[i + 1][1]) * Math.PI * r * r * L;
    }
  }
  return sum;
}

export function iodineSeries(spec: CaptureSpec): number[] {
  return simulateSequence(resolveSpec({ ...spec, warmup: 0 }), { warmup: false }).map((f) => iodineAmount(f.scene));
}

export interface TimingFeatures {
  f10: number | null;
  f50: number | null;
  f90: number | null;
  riseFrames: number | null;
  peakFrame: number;
  framesGe90: number;
  wash50AfterPeak: number | null;
  endRel: number;
}

/** The features of scripts/realism/metrics.py timing_features (baseline = min of frames 1-3). */
export function timingFeatures(S: number[]): TimingFeatures | null {
  if (S.length < 6) return null;
  const base = Math.min(...S.slice(1, 4));
  const pk = Math.max(...S);
  const ip = S.indexOf(pk);
  const rng = pk - base;
  if (rng <= 0) return null;
  const first = (th: number) => {
    const i = S.findIndex((v) => v >= base + th * rng);
    return i < 0 ? null : i;
  };
  let w50: number | null = null;
  for (let i = ip; i < S.length; i++)
    if (S[i] < base + 0.5 * rng) {
      w50 = i;
      break;
    }
  const f10 = first(0.1),
    f90 = first(0.9);
  return {
    f10,
    f50: first(0.5),
    f90,
    riseFrames: f10 !== null && f90 !== null ? f90 - f10 : null,
    peakFrame: ip,
    framesGe90: S.filter((v) => v >= base + 0.9 * rng).length,
    wash50AfterPeak: w50 !== null ? w50 - ip : null,
    endRel: (S[S.length - 1] - base) / rng,
  };
}

export interface ArrivalFeatures {
  arrival30: number;
  arrival30_s: number;
  above50_s: number;
  end3_ge50: number;
  arrival_at_frame0: number;
}

/** scripts/realism/metrics.py arrival_features (the audit's run_analysis.py summary): baseline = mean of
 * frames 0-1, arrival = first frame at or above baseline + 30% of the rise. */
export function arrivalFeatures(S: number[], fps: number): ArrivalFeatures | null {
  if (S.length < 6 || !fps) return null;
  const v0 = (S[0] + S[1]) / 2;
  const rise = Math.max(...S) - v0;
  if (rise <= 0) return null;
  const arr = S.findIndex((x) => x >= v0 + 0.3 * rise);
  const half = v0 + 0.5 * rise;
  const above = S.filter((x) => x >= half).length;
  const end3 = (S[S.length - 1] + S[S.length - 2] + S[S.length - 3]) / 3;
  return { arrival30: arr, arrival30_s: arr / fps, above50_s: above / fps, end3_ge50: end3 >= half ? 1 : 0, arrival_at_frame0: arr === 0 ? 1 : 0 };
}

export interface LandmarkMotion {
  /** median over landmarks of P90 - P10 of the position on the principal motion axis (mm) */
  p10p90: number;
  /** median over landmarks of the median frame-to-frame speed (mm/s) */
  speedMedian: number;
  /** median over landmarks of the 90th-centile speed (mm/s) */
  speedP90: number;
  perLandmark: { frac: number; p10p90: number; speedMedian: number }[];
}

/**
 * scripts/realism/geometry.py capture_geometry motion block on the CPU: landmarks at 10/30/50/70/90% of
 * the ostium-to-distal arc length (LM + LAD, or RCA) at frame 0, followed through the sequence on the
 * projected geometry, in mm at the iso-centre plane (the audit's simmotion.ts convention).
 */
export function landmarkMotionMm(spec: CaptureSpec, artery: "LCA" | "RCA"): LandmarkMotion {
  const R = resolveSpec({ ...spec, warmup: 0 });
  const frames = simulateSequence(R, { warmup: false });
  const p = prepareFor(R);
  const names = artery === "LCA" ? ["LM", "LAD"] : ["RCA"];
  const vs = names.map((n) => {
    const v = p.tree.vessels.find((x) => x.name === n);
    if (!v) throw new Error(`no vessel ${n}`);
    return v;
  });
  const f0 = frames[0];
  const proj = (f: SimFrame, sm: Sample) => projectPx(f.scene.cam, f.place(sm), R.res);
  // cumulative projected arc length at frame 0 over the concatenated samples
  const chain: Sample[] = [];
  vs.forEach((v, j) => chain.push(...(j > 0 ? v.samples.slice(1) : v.samples)));
  const cum = [0];
  for (let i = 1; i < chain.length; i++) {
    const a = proj(f0, chain[i - 1]),
      b = proj(f0, chain[i]);
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = cum[cum.length - 1];
  const iso = pixelScale(f0.scene.cam, R.res).isoMmPerPx;
  const q = (v: number[], t: number) => quant(v, t);
  const per = [0.1, 0.3, 0.5, 0.7, 0.9].map((frac) => {
    const i = Math.max(0, cum.findIndex((c) => c >= frac * total));
    const sm = chain[i];
    const tr = frames.map((f) => proj(f, sm));
    const mx = tr.reduce((s, t) => s + t.x, 0) / tr.length;
    const my = tr.reduce((s, t) => s + t.y, 0) / tr.length;
    let sxx = 0,
      syy = 0,
      sxy = 0;
    for (const t of tr) {
      sxx += (t.x - mx) ** 2;
      syy += (t.y - my) ** 2;
      sxy += (t.x - mx) * (t.y - my);
    }
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const pr = tr.map((t) => (t.x - mx) * Math.cos(th) + (t.y - my) * Math.sin(th));
    const sp = tr.slice(1).map((t, k) => Math.hypot(t.x - tr[k].x, t.y - tr[k].y) * iso * R.fps);
    return { frac, p10p90: (q(pr, 0.9) - q(pr, 0.1)) * iso, speedMedian: q(sp, 0.5), speedP90: [...sp].sort((a, b) => a - b)[Math.round(0.9 * (sp.length - 1))] };
  });
  return { p10p90: q(per.map((x) => x.p10p90), 0.5), speedMedian: q(per.map((x) => x.speedMedian), 0.5), speedP90: q(per.map((x) => x.speedP90), 0.5), perLandmark: per.map(({ frac, p10p90, speedMedian }) => ({ frac, p10p90, speedMedian })) };
}

/**
 * The guide catheter's outer tube in a scene: sceneBuilder pushes it with mu = CATHETER_WALL as
 * [0, jacket, braid] (both positive, below 3 /mm), after the vessels; its lumen tube follows with
 * negative wall terms, and wires carry metal only.
 */
export function findCatheter(tubes: TubeSpec[]): TubeSpec | null {
  let best: TubeSpec | null = null;
  for (const t of tubes) {
    if (Array.isArray(t.mu[0])) continue;
    const mu = t.mu as [number, number, number];
    if (mu[0] === 0 && mu[1] > 0.1 && mu[1] < 3 && mu[2] >= 0 && mu[2] < 3 && t.pts.length > 10 && !t.thin) {
      if (!best || t.pts.length > best.pts.length) best = t;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// realism targets (datasets/library/realism_targets.json)
// ---------------------------------------------------------------------------

export interface RealismTarget {
  metric: string;
  pipeline: string;
  profile: string;
  artery: string;
  view: string;
  n: number;
  median: number;
  iqr: [number, number];
  band: [number, number];
  band_rule: string;
  unit: string;
  method: string;
}

/** Find one target; defaults: CoronaryDominance domain-shift profile, matched pipeline, any artery and view. */
export function findTarget(
  doc: { targets: RealismTarget[] },
  metric: string,
  o: { profile?: string; pipeline?: string; artery?: string; view?: string } = {}
): RealismTarget | undefined {
  const want = { profile: o.profile ?? "cd-ds", pipeline: o.pipeline ?? "matched", artery: o.artery ?? "any", view: o.view ?? "any" };
  return doc.targets.find((t) => t.metric === metric && t.profile === want.profile && t.pipeline === want.pipeline && t.artery === want.artery && t.view === want.view);
}

export const inBand = (v: number, t: RealismTarget | undefined) => !!t && v >= t.band[0] && v <= t.band[1];

// ---------------------------------------------------------------------------
// annotations (projected geometry for the Python scorecard)
// ---------------------------------------------------------------------------

type Pt = [number, number];
interface VesselAnn {
  name: string;
  side: "left" | "right";
  fillId: string;
  /** centre line in canvas px, decimated to at most 32 points */
  pts: Pt[];
  /** projected radius (px) per point */
  r: number[];
  /** sample fraction along the vessel per point */
  f: number[];
}
interface FrameAnn {
  k: number;
  t: number;
  bolusT: number | null;
  contraction: number;
  resp: number;
  iodine: number;
  vessels?: VesselAnn[];
  /** undecimated centre lines (every tree sample) of the main vessels, on the frames in FINE_FRAMES */
  fine?: { name: string; pts: Pt[] }[];
  catheter?: { pts: Pt[]; r: number[] } | null;
  ribs?: { upper: Pt[]; lower: Pt[] }[];
  /** the renderer's meter after this frame (processed log percentiles and the window), when it exposes one */
  meter?: { p5: number; p50: number; p95: number; width: number };
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Main vessels whose full-resolution centre lines are recorded for the geometry metrics (tortuosity
 * band RMS, projected length): the decimated 32-point lines are too coarse for a 3-8 mm band. */
export const FINE_VESSELS = ["LM", "LAD", "LCx", "RCA"];
/** Frames that carry fine centre lines: the first and the middle frame of a sequence. */
export const fineFrames = (nFrames: number) => [0, Math.floor(nFrames / 2)];

function annotateFrame(f: SimFrame, tree: CoronaryTree, res: number, withRibs: boolean, withFine = false): FrameAnn {
  const cam = f.scene.cam;
  const { detMmPerPx } = pixelScale(cam, res);
  const out: FrameAnn = { k: f.k, t: f.t, bolusT: f.bolusT, contraction: f.contraction, resp: f.resp, iodine: iodineAmount(f.scene) };
  out.vessels = [];
  for (const v of tree.vessels) {
    if (v.name.includes("twig") || v.name.startsWith("collateral")) continue;
    const n = v.samples.length;
    const step = Math.max(1, Math.ceil(n / 32));
    const idx: number[] = [];
    for (let i = 0; i < n; i += step) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    const pts: Pt[] = [];
    const rr: number[] = [];
    const ff: number[] = [];
    for (const i of idx) {
      const q = projectPx(cam, f.place(v.samples[i]), res);
      pts.push([r1(q.x), r1(q.y)]);
      rr.push(Math.round(((v.radii[i] * q.mag) / detMmPerPx) * 100) / 100);
      ff.push(Math.round((i / Math.max(1, n - 1)) * 1000) / 1000);
    }
    out.vessels.push({ name: v.name, side: v.side, fillId: v.fillId, pts, r: rr, f: ff });
  }
  if (withFine) {
    out.fine = [];
    for (const name of FINE_VESSELS) {
      const v = tree.vessels.find((x) => x.name === name);
      if (!v) continue;
      out.fine.push({
        name,
        pts: v.samples.map((sm) => {
          const q = projectPx(cam, f.place(sm), res);
          return [Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100] as Pt;
        }),
      });
    }
  }
  out.catheter = catheterAnnotation(f.scene, res);
  if (withRibs) out.ribs = ribAnnotations(f.scene, res);
  return out;
}

/** The guide catheter's projected centre line and radius (canvas px), from the scene alone. */
export function catheterAnnotation(scene: XrayScene, res: number): FrameAnn["catheter"] {
  const cam = scene.cam;
  const { detMmPerPx } = pixelScale(cam, res);
  const c = findCatheter(sceneTubes(scene));
  if (!c) return null;
  const pts: Pt[] = [];
  const rr: number[] = [];
  for (let i = 0; i < c.pts.length; i += 2) {
    const q = projectPx(cam, c.pts[i], res);
    if (q.x < -50 || q.y < -50 || q.x > res + 50 || q.y > res + 50) continue;
    pts.push([r1(q.x), r1(q.y)]);
    rr.push(Math.round(((c.r[i] * q.mag) / detMmPerPx) * 100) / 100);
  }
  return { pts, r: rr };
}

/** Projected rib margins (upper and lower margin polylines, canvas px), from the scene alone. */
export function ribAnnotations(scene: XrayScene, res: number): NonNullable<FrameAnn["ribs"]> {
  const cam = scene.cam;
  const { detMmPerPx } = pixelScale(cam, res);
  const out: NonNullable<FrameAnn["ribs"]> = [];
  // rib centre lines: the cortical rib tubes on the ribbon path, or the thorax's rib lines when the
  // ribs are drawn by the thorax segment pass (scene.extra.ribLines; no rib tubes then)
  const ribSrc: { pts: Vec3[]; r: number[] }[] = scene.tubes.filter((t) => t.thin && !Array.isArray(t.mu[0]) && (t.mu as number[])[0] > 0 && t.pts.length >= 6);
  const lines = scene.extra?.ribLines as { pts: Vec3[]; a: number[] }[] | undefined;
  if (!ribSrc.length && lines) for (const l of lines) if (l.pts.length >= 6) ribSrc.push({ pts: l.pts, r: l.a });
  for (const t of ribSrc) {
    const P = t.pts.map((p) => projectPx(cam, p, res));
    const up: Pt[] = [];
    const lo: Pt[] = [];
    for (let i = 0; i < P.length; i += 2) {
      const a = P[Math.max(0, i - 1)],
        b = P[Math.min(P.length - 1, i + 1)];
      const tl = Math.hypot(b.x - a.x, b.y - a.y);
      if (tl < 1e-6) continue;
      let nx = -(b.y - a.y) / tl,
        ny = (b.x - a.x) / tl;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      // half-width across the ray: the rib's wide semi-axis projected (good enough to seed a margin search)
      const hw = (t.r[i] * P[i].mag) / detMmPerPx;
      up.push([r1(P[i].x + nx * hw), r1(P[i].y + ny * hw)]);
      lo.push([r1(P[i].x - nx * hw), r1(P[i].y - ny * hw)]);
    }
    if (up.length >= 3) out.push({ upper: up, lower: lo });
  }
  return out;
}

/**
 * Annotation of a frame filmed through a lab's own render path (live-path captures): what the scene
 * alone gives, without the tree and the heart-surface mapping the lab keeps to itself (no vessel centre
 * lines, so the vessel, geometry and motion-track rows are not measured on these runs).
 */
export interface LiveFrameAnn {
  k: number;
  /** seconds since frame 0 of the sequence (wall clock of the lab) */
  t: number;
  bolusT: number | null;
  mode: "cine" | "fluoro";
  framesSinceStart: number | null;
  iodine: number;
  catheter: FrameAnn["catheter"];
  ribs?: FrameAnn["ribs"];
  meter?: FrameAnn["meter"];
}

export function annotateLiveFrame(k: number, t: number, bolusT: number | null, scene: XrayScene, params: ImageParams, res: number, withRibs: boolean): LiveFrameAnn {
  const out: LiveFrameAnn = { k, t: Math.round(t * 1000) / 1000, bolusT, mode: params.mode === "cine" ? "cine" : "fluoro", framesSinceStart: params.framesSinceStart ?? null, iodine: iodineAmount(scene), catheter: catheterAnnotation(scene, res) };
  if (withRibs) out.ribs = ribAnnotations(scene, res);
  return out;
}

// ---------------------------------------------------------------------------
// PNG encoding (8-bit grey, filter 0, zlib via CompressionStream)
// ---------------------------------------------------------------------------

let crcTable: Uint32Array | null = null;
function crc32(buf: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate");
  const stream = new Blob([data]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export async function encodeGreyPng(px: Uint8Array, w: number, h: number): Promise<Blob> {
  const raw = new Uint8Array((w + 1) * h);
  for (let y = 0; y < h; y++) raw.set(px.subarray(y * w, (y + 1) * w), y * (w + 1) + 1);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr.set([8, 0, 0, 0, 0], 8);
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Blob([sig, chunk("IHDR", ihdr), chunk("IDAT", await zlib(raw)), chunk("IEND", new Uint8Array(0))], { type: "image/png" });
}

export async function encodeMetaPng(obj: unknown): Promise<Blob> {
  const body = new TextEncoder().encode(JSON.stringify(obj));
  const head = new TextEncoder().encode("XCMETA1\n" + String(body.length).padStart(8, "0"));
  const n = head.length + body.length;
  const w = 1024;
  const h = Math.max(1, Math.ceil(n / w));
  const px = new Uint8Array(w * h);
  px.set(head, 0);
  px.set(body, head.length);
  return encodeGreyPng(px, w, h);
}

async function sha256Hex(px: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", px);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function post(name: string, blob: Blob) {
  const r = await fetch(`/__capture/${encodeURIComponent(name)}`, { method: "POST", body: blob });
  if (!r.ok) throw new Error(`capture upload ${name}: HTTP ${r.status}`);
}

/** Red channel of the default framebuffer as top-down grey bytes. */
function readGrey(gl: WebGL2RenderingContext, res: number): Uint8Array {
  const rgba = new Uint8Array(res * res * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(0, 0, res, res, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
  const out = new Uint8Array(res * res);
  for (let y = 0; y < res; y++) {
    const src = (res - 1 - y) * res * 4;
    const dst = y * res;
    for (let x = 0; x < res; x++) out[dst + x] = rgba[src + x * 4];
  }
  return out;
}

// ---------------------------------------------------------------------------
// browser capture
// ---------------------------------------------------------------------------

/** Extra accumulation passes that the lab registers (other streams add theirs here so captures match the lab). */
const passFactories: ((gl: WebGL2RenderingContext) => AccumulationPass)[] = [];
export function registerCapturePass(factory: (gl: WebGL2RenderingContext) => AccumulationPass) {
  passFactories.push(factory);
}

export interface SequenceResult {
  set: string;
  name: string;
  frames: number;
  sha256: string[];
  /** mean main-thread milliseconds per frame: scene building, and render plus synchronous read-back */
  msScene: number;
  msRender: number;
  uploaded: boolean;
}

function metaFor(R: ResolvedSpec, frames: SimFrame[], hashes: string[], anns: FrameAnn[], timing: { scene: number; render: number }, source: string) {
  const f0 = frames.find((f) => f.k >= 0) ?? frames[0];
  const sc = pixelScale(f0.scene.cam, R.res);
  return {
    version: 1,
    created: new Date().toISOString(),
    source,
    spec: R,
    cArm: R.cArm,
    artery: R.artery,
    fps: R.fps,
    res: R.res,
    fieldFraction: FIELD_FRACTION,
    /** field box predicted from the parameters (the scorecard measures its own from the frames) */
    fieldBoxPredicted: fieldBoxPx(f0.params, R.res),
    px512PerNative: px512PerNative(R.res, fieldBoxPx(f0.params, R.res)),
    profile: R.profile,
    captureMode: true,
    detMmPerPx: sc.detMmPerPx,
    isoMmPerPx: sc.isoMmPerPx,
    timestamps: frames.filter((f) => f.k >= 0).map((f) => f.t),
    bolusT: frames.filter((f) => f.k >= 0).map((f) => f.bolusT),
    sha256: hashes,
    msPerFrame: timing,
    annotations: anns,
  };
}

/** The renderer's meter after the last frame (processed log percentiles and the window width), when it exposes one. */
function meterOf(xr: XrayRenderer): FrameAnn["meter"] | undefined {
  const lm = (xr as unknown as { lastMeter?: { p5: number; p50: number; p95: number; window?: { width: number } } | null }).lastMeter;
  return lm ? { p5: r1(lm.p5 * 100) / 100, p50: r1(lm.p50 * 100) / 100, p95: r1(lm.p95 * 100) / 100, width: r1((lm.window?.width ?? 0) * 100) / 100 } : undefined;
}

/** What a device scene shows, for the capture metadata (scripts/realism/report.py lists it with the run). */
export function pciMeta(pci: PreparedPci) {
  const st = pci.st;
  const d = st.device;
  return {
    stage: pci.stage,
    lesion: { vessel: pci.g.lesion.vessel, startMm: r1(pci.g.lesion.startMm), endMm: r1(pci.g.lesion.endMm), refDiameterMm: Math.round(pci.g.lesion.refDiameter * 100) / 100 },
    wire: { route: st.route, tipMm: r1(st.tipMm) },
    device: d ? { kind: d.kind, diameterMm: d.diameter, lengthMm: d.lengthMm, centreMm: r1(d.centreMm), inflated: d.inflated, atm: d.atm } : null,
    stents: st.stents.map((x) => ({ fromMm: r1(x.fromMm), toMm: r1(x.toMm), diameterMm: x.diameter })),
    severity: st.severity,
    complications: { dissection: !!st.dissection, perforation: !!st.perforation, slowFlow: st.slowFlow, list: st.cx.list.map((c) => c.kind) },
    steps: pci.steps,
  };
}

async function captureOffscreen(R: ResolvedSpec): Promise<SequenceResult> {
  const canvas = document.createElement("canvas");
  canvas.width = R.res;
  canvas.height = R.res;
  const xr = XrayRenderer.create(canvas);
  if (!xr) throw new Error("WebGL2 with EXT_color_buffer_float is needed for capture");
  for (const f of passFactories) xr.addPass(f(xr.gl));
  xr.resize(R.res);
  // capture mode: synchronous auto-window readback of the current frame, run frames counted per render
  // and a cleared recursion buffer at run start (critique item 18). Optional so the harness still loads
  // against an older renderer; framesSinceStart below makes the run bookkeeping explicit either way.
  const cm = xr as unknown as { setCaptureMode?: (on: boolean) => void };
  if (typeof cm.setCaptureMode !== "function") console.warn("[xrayCapture] XrayRenderer.setCaptureMode is missing: frames may depend on timing");
  cm.setCaptureMode?.(true);
  const p = prepareFor(R);
  const hashes: string[] = [];
  const anns: FrameAnn[] = [];
  const kept: SimFrame[] = [];
  let tScene = 0,
    tRender = 0;
  try {
    for (let k = -R.warmup; k < R.nFrames; k++) {
      const a = performance.now();
      const sink: { place?: (sm: Sample) => Vec3 } = {};
      const inp = sceneInputAt(p, R, k, sink);
      const r = buildXrayScene(inp);
      const place = requirePlace(sink, k);
      const params = runParams(r.params, R, k, inp.mode);
      const b = performance.now();
      xr.render(r.scene, params);
      const grey = readGrey(xr.gl, R.res);
      const c = performance.now();
      if (k < 0) continue;
      tScene += b - a;
      tRender += c - b;
      const fr: SimFrame = { k, t: inp.t, bolusT: inp.bolus ? inp.bolus.t : null, mode: inp.mode, scene: r.scene, params, contraction: r.contraction, resp: r.resp, place };
      kept.push(fr);
      hashes.push(await sha256Hex(grey));
      if (R.annotate) {
        const ann = annotateFrame(fr, p.tree, R.res, k < 5, fineFrames(R.nFrames).includes(k));
        const m = meterOf(xr);
        if (m) ann.meter = m;
        anns.push(ann);
      }
      if (R.upload) await post(`${R.set}__${R.name}_f${String(k).padStart(3, "0")}.png`, await encodeGreyPng(grey, R.res, R.res));
    }
    const n = Math.max(1, kept.length);
    const timing = { scene: tScene / n, render: tRender / n };
    if (R.upload) await post(`${R.set}__${R.name}.meta.png`, await encodeMetaPng({ ...metaFor(R, kept, hashes, anns, timing, "offscreen"), ...(p.pci ? { pci: pciMeta(p.pci) } : {}) }));
    return { set: R.set, name: R.name, frames: kept.length, sha256: hashes, msScene: timing.scene, msRender: timing.render, uploaded: R.upload };
  } finally {
    xr.dispose();
    xr.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/**
 * Calibration view of the line integrals before the image chain (C1, wave 2): renders frame `k` of a
 * spec offscreen (after the warm-up frames and frames 0..k-1, so the run state matches a capture),
 * reads the soft-tissue/bone line integral P, and uploads it as an 8-bit PNG with bright = low P,
 * windowed linearly between its 1st and 99th percentiles over the central 90 % of the field, as
 * `<set>__<name>_rawP_fNNN.png`, next to the displayed frame `<set>__<name>_disp_fNNN.png`.
 * Returns the percentiles. Development only; not deterministic in timing but deterministic in content.
 */
export async function rawFrame(spec: CaptureSpec, k: number): Promise<{ p1: number; p50: number; p99: number; iodineMax: number }> {
  const R = resolveSpec({ ...spec, annotate: false });
  const canvas = document.createElement("canvas");
  canvas.width = R.res;
  canvas.height = R.res;
  const xr = XrayRenderer.create(canvas);
  if (!xr) throw new Error("WebGL2 with EXT_color_buffer_float is needed");
  for (const f of passFactories) xr.addPass(f(xr.gl));
  xr.resize(R.res);
  xr.setCaptureMode(true);
  const p = prepareFor(R);
  try {
    for (let j = -R.warmup; j <= k; j++) {
      const inp = sceneInputAt(p, R, j, {});
      const r = buildXrayScene(inp);
      xr.render(r.scene, runParams(r.params, R, j, inp.mode));
    }
    const li = xr.readLineIntegrals()!;
    const n = li.w;
    const vals: number[] = [];
    let iodineMax = 0;
    const m0 = Math.round(n * 0.05),
      m1 = n - m0;
    for (let y = m0; y < m1; y += 2)
      for (let x = m0; x < m1; x += 2) {
        vals.push(li.data[(y * n + x) * 4]);
        iodineMax = Math.max(iodineMax, li.data[(y * n + x) * 4 + 1]);
      }
    vals.sort((a, b) => a - b);
    const q = (t: number) => vals[Math.floor(t * (vals.length - 1))];
    const p1 = q(0.01),
      p50 = q(0.5),
      p99 = q(0.99);
    const out = new Uint8Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const P = li.data[((n - 1 - y) * n + x) * 4];
        out[y * n + x] = Math.max(0, Math.min(255, Math.round((255 * (p99 - P)) / Math.max(1e-6, p99 - p1))));
      }
    const kk = String(k).padStart(3, "0");
    await post(`${R.set}__${R.name}_rawP_f${kk}.png`, await encodeGreyPng(out, n, n));
    await post(`${R.set}__${R.name}_disp_f${kk}.png`, await encodeGreyPng(readGrey(xr.gl, n), n, n));
    return { p1, p50, p99, iodineMax };
  } finally {
    xr.dispose();
    xr.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** One variant of a calibration sweep: overrides applied to the live tuning objects for its captures. */
export interface SweepVariant {
  /** fields of SYSTEM_PROFILES.A sections */
  processing?: Partial<SystemProfile["processing"]>;
  detector?: Partial<SystemProfile["detector"]>;
  /** ANATOMY_TUNE fields (objects are merged) */
  anat?: Record<string, unknown>;
  /** CLUTTER_TUNE multipliers (lung clutter gain, soft-tissue gain, tilt, trabecular amplitude) */
  clutter?: Partial<typeof CLUTTER_TUNE_LIVE>;
  /** CATHETER_WALL and VESSEL_PROFILE fields */
  wall?: Partial<typeof CATHETER_WALL_LIVE>;
  vessel?: Partial<typeof VESSEL_PROFILE_LIVE>;
  /** ImageParams overrides */
  params?: Partial<ImageParams>;
  nFrames?: number;
}

/**
 * Calibration sweep (development, C1 wave 2): for each variant, apply its overrides to the live profile,
 * anatomy, catheter and vessel tuning objects, capture the views into set `<set>-<tag>` (sequence names as
 * the scorecard's; "fluoro" and "flush" are the companions), then restore every object. The scorecard sets
 * themselves are always captured with the committed constants (no variant).
 */
export async function calibrationSweep(set: string, variants: Record<string, SweepVariant>, views: string[]): Promise<string[]> {
  const P = SYSTEM_PROFILES_LIVE.A;
  const snap = JSON.stringify({ processing: P.processing, detector: P.detector, T: ANATOMY_TUNE_LIVE, W: CATHETER_WALL_LIVE, V: VESSEL_PROFILE_LIVE, C: CLUTTER_TUNE_LIVE });
  const restore = () => {
    const b = JSON.parse(snap);
    Object.assign(P.processing, b.processing);
    Object.assign(P.detector, b.detector);
    for (const k of Object.keys(b.T)) (ANATOMY_TUNE_LIVE as Record<string, unknown>)[k] = b.T[k];
    Object.assign(CATHETER_WALL_LIVE, b.W);
    Object.assign(VESSEL_PROFILE_LIVE, b.V);
    Object.assign(CLUTTER_TUNE_LIVE, b.C);
  };
  const ref = new Map(REFERENCE_VIEWS.map((v) => [v.name, v]));
  const short: Record<string, string> = { raocau: "lad_raocau", raocra: "lad_raocra", apcra: "lad_apcra", laocra: "lad_laocra", rcalao: "rca_lao", rcarao: "rca_rao" };
  const done: string[] = [];
  try {
    for (const [tag, v] of Object.entries(variants)) {
      restore();
      Object.assign(P.processing, v.processing ?? {});
      Object.assign(P.detector, v.detector ?? {});
      const T = ANATOMY_TUNE_LIVE as Record<string, unknown>;
      for (const [k, x] of Object.entries(v.anat ?? {})) T[k] = x && typeof x === "object" ? { ...(T[k] as object), ...(x as object) } : x;
      Object.assign(CATHETER_WALL_LIVE, v.wall ?? {});
      Object.assign(VESSEL_PROFILE_LIVE, v.vessel ?? {});
      Object.assign(CLUTTER_TUNE_LIVE, v.clutter ?? {});
      const S = `${set}-${tag}`;
      const specs: CaptureSpec[] = views.map((n) => {
        if (n === "fluoro") return { set: S, name: FLUORO_COMPANION.name, view: FLUORO_COMPANION.view, scenario: FLUORO_COMPANION.scenario, mode: "fluoro", nFrames: FLUORO_COMPANION.nFrames, injection: null, params: v.params };
        if (n === "flush") return { set: S, name: FLUSH_COMPANION.name, view: FLUSH_COMPANION.view, scenario: FLUSH_COMPANION.scenario, mode: "cine", nFrames: FLUSH_COMPANION.nFrames, injection: null, catheter: FLUSH_COMPANION.catheter, params: v.params };
        if (n === "spider") return { set: S, name: "lad_spider", view: "spider", scenario: "lad-focal", nFrames: v.nFrames, params: v.params };
        const r = ref.get(short[n] ?? n);
        if (!r) throw new Error(`unknown view ${n}`);
        return { set: S, name: r.name, view: r.view, scenario: r.scenario, nFrames: v.nFrames, params: v.params };
      });
      await capture(specs);
      done.push(S);
    }
  } finally {
    restore();
  }
  return done;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Every render call made while a live-path capture runs: the lab's own scene and parameters, and the renderer. */
interface RenderTap {
  last: { scene: XrayScene; params: ImageParams; xr: XrayRenderer } | null;
  restore: () => void;
}

/**
 * Watch XrayRenderer.render (the prototype method, restored afterwards); nothing in the renderer changes.
 * Every argument is passed through, so an offscreen render (target null) stays offscreen; only renders to
 * the canvas count as the lab's frame.
 */
function tapRenders(): RenderTap {
  type RenderFn = (scene: XrayScene, params: ImageParams, target?: "canvas" | null) => unknown;
  const proto = XrayRenderer.prototype as unknown as { render: RenderFn };
  const orig = proto.render;
  const tap: RenderTap = {
    last: null,
    restore: () => {
      proto.render = orig;
    },
  };
  proto.render = function (this: XrayRenderer, ...args: Parameters<RenderFn>) {
    if (args[2] !== null) tap.last = { scene: args[0], params: args[1], xr: this };
    return orig.apply(this, args);
  };
  return tap;
}

/** Set a React-controlled <select> that offers `value` (the PCI lab's scenario list). */
function selectOption(value: string): boolean {
  const sel = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === value));
  if (!sel || sel.value === value) return !!sel;
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(sel, value);
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

interface PciHooks {
  __pciDraw?: (bt?: number) => void;
  __pciStep?: (seconds: number, dt?: number) => void;
  __pciLab?: () => { clock: { state: () => { t: number } } };
}
interface DiagHooks {
  __fluoroDraw?: (mode?: "fluoro" | "cine") => void;
  __labStep?: (seconds?: number, dt?: number) => void;
  __lab?: {
    startInjection: () => boolean;
    releaseInjection: () => void;
    bolusFor: () => { t: number } | null;
    engine?: { clockState: () => { t: number } };
    /** the rod mechanics (diag-rod-physics), when it runs */
    physics?: { active: boolean; latest: () => { costMs: number; kind: string } | null } | null;
    seatPhysics?: (side: "left" | "right") => Promise<boolean>;
  };
  __sim?: {
    getState: () => {
      setCArm: (c: CArm) => void;
      caseData: AnatomyCaseLike;
      catheterId: string;
      controls: { cmdInsertion: number; cmdTorque: number };
      commandInsertion: (d: number) => void;
      commandTorque: (d: number) => void;
      aspirate?: () => void;
      engagement?: { isSelective?: boolean; kind?: string } | null;
    };
  };
}
type AnatomyCaseLike = { id?: string; name?: string };

/**
 * How fast the lab's patient clock runs on its own (patient seconds per wall second, read 500 ms apart).
 * Near 1 when the lab's requestAnimationFrame loop runs at full rate; near 0 in a hidden pane, and well
 * below 1 in a background tab whose animation frames are throttled (the labs cap a loop step at 0.1 s, so
 * the heart then jumps rarely). Below 0.8 the capture steps the lab itself between frames.
 */
async function clockRate(read: () => number | undefined): Promise<number> {
  const a = read();
  await sleep(500);
  const b = read();
  return a !== undefined && b !== undefined ? Math.max(0, (b - a) / 0.5) : 0;
}

/**
 * Live-path capture (realism-baseline): film a sequence through a lab's own scene assembly, by its
 * development hooks, so that the scorecard measures what the trainee sees (closed-loop dose control, the
 * patient clock, the legacy catheter path, the lab's contrast and flow state) rather than the offscreen
 * capture path alone.
 *
 *  - "pci-hook": the PCI lab ("PCI in the cath lab", AngioPci.tsx PciFluoro.draw): the scenario is chosen
 *    in the lab's list, the view by its preset button, and window.__pciDraw(bt) draws each frame with the
 *    standard injection plan from the press.
 *  - "fluoro-hook": the diagnostic lab (the cath lab shell, FluoroView.tsx drawXray with its session): the
 *    catheter is seated selectively in the left main (or the RCA) by the skill cards' start controls,
 *    the C-arm set, and each frame is drawn by window.__fluoroDraw(mode); the hand injection starts at the
 *    press and is released after the push duration.
 *
 * Between frames the lab advances by 1 / fps: in real time (frames paced at fps) when its own frame loop
 * runs at full rate, or by its step hook (window.__pciStep, window.__labStep) when the pane is hidden or
 * the tab throttled (clockRate below 0.8); without that the patient clock, and so the heart, would stand
 * still or jump. A throttled loop still adds its own rare steps (at most 0.1 s each); the metadata records
 * the measured rate.
 *
 * Not deterministic (the labs read the wall clock), so these runs are measurements outside the pass count.
 *
 * The live capture drives and changes the open case and does not restore it: in the diagnostic lab the
 * catheter position, contrast, dose and recorded frames (each __fluoroDraw runs the session's exposure and
 * frame recording); in the PCI lab the scenario chosen in its list and the view. Run it on a fresh case
 * and reload afterwards.
 *
 * The lab keeps its tree and heart-surface mapping to itself: the metadata carries what the scene gives
 * (iodine, the catheter, rib margins, the meter), not vessel centre lines.
 */
/**
 * The smallest lab canvas a live-path capture accepts (device px, square). The lab canvases follow the pane:
 * in a narrow pane the diagnostic lab's fluoroscopy canvas shrinks to a few dozen CSS px and would film
 * frames that cannot be compared with the baseline's (PCI lab 1280 px, diagnostic lab 988 px), so the
 * capture stops instead. A capture-harness setting, not a renderer one.
 */
export const LIVE_MIN_PX = 512;

async function captureHook(R: ResolvedSpec): Promise<SequenceResult> {
  const w = window as unknown as PciHooks & DiagHooks;
  const labInfo: Record<string, unknown> = {};
  if (R.source === "pci-hook") {
    if (!w.__pciDraw) throw new Error("open 'PCI in the cath lab' first (window.__pciDraw is missing)");
    if (selectOption(R.scenario)) await sleep(600);
    labInfo.scenario = R.scenario;
    const preset = VIEW_PRESETS.find((v) => v.cArm.laoRao === R.cArm.laoRao && v.cArm.cranialCaudal === R.cArm.cranialCaudal);
    const btn = preset ? [...document.querySelectorAll("button")].find((b) => b.getAttribute("title") === preset.shows) : undefined;
    labInfo.viewButton = !!btn;
    if (btn) {
      btn.click();
      await sleep(150);
    }
    labInfo.clockRate = Math.round((await clockRate(() => w.__pciLab?.().clock.state().t)) * 100) / 100;
    labInfo.clock = (labInfo.clockRate as number) >= 0.8 ? "real time" : w.__pciStep ? "stepped" : "frozen";
    if (labInfo.clock === "frozen") throw new Error(`the PCI lab clock is not running (rate ${labInfo.clockRate}) and window.__pciStep is missing`);
  } else {
    if (!w.__fluoroDraw || !w.__lab || !w.__labStep || !w.__sim) throw new Error("open the diagnostic lab (the cath lab shell with a case) first: window.__fluoroDraw, __lab, __labStep or __sim is missing");
    const st = w.__sim.getState();
    const target = R.artery === "RCA" ? "selective-rca" : "selective-lm";
    let ctl: { insertion: number; torque: number } | null = null;
    const rod = !!w.__lab.physics?.active && !!w.__lab.seatPhysics;
    if (rod) {
      // the rod mechanics (diag-rod-physics): the catheter is driven over the wire to the root and seated
      // by the scripted technique (hand commands only), so the run films the catheter the trainee sees
      labInfo.mechanics = "rod";
      labInfo.seatedByScript = await w.__lab.seatPhysics!(R.artery === "RCA" ? "right" : "left");
    } else {
      const { findStartControls } = await import("../mentor/skillCards");
      ctl = findStartControls(st.caseData as Parameters<typeof findStartControls>[0], st.catheterId, target);
      if (ctl) {
        st.commandInsertion(ctl.insertion - st.controls.cmdInsertion);
        st.commandTorque(ctl.torque - st.controls.cmdTorque);
      }
      labInfo.mechanics = "simple";
    }
    w.__labStep(4, 1 / 60);
    w.__sim.getState().setCArm(R.cArm);
    w.__labStep(0.5, 1 / 60);
    const now = w.__sim.getState();
    labInfo.clockRate = Math.round((await clockRate(() => w.__lab?.engine?.clockState().t)) * 100) / 100;
    labInfo.clock = (labInfo.clockRate as number) >= 0.8 ? "real time" : "stepped";
    Object.assign(labInfo, { caseId: now.caseData.id ?? null, caseName: now.caseData.name ?? null, catheterId: now.catheterId, seatTarget: target, startControls: !!ctl, engaged: !!now.engagement?.isSelective });
    if (rod) labInfo.physicsCostMs = w.__lab.physics?.latest()?.costMs ?? null;
  }
  const tap = tapRenders();
  const hashes: string[] = [];
  const anns: LiveFrameAnn[] = [];
  const bolusTs: (number | null)[] = [];
  const stamps: number[] = [];
  let tRender = 0;
  let res = 0;
  let cam: XrayCamera | null = null;
  let injected = false;
  let pushing = false;
  const dt = 1 / R.fps;
  // frames are kept in memory and hashed, encoded and uploaded after the run, so that encoding does not
  // slow a run filmed in real time below its frame rate
  const kept: Uint8Array[] = [];
  const drawFrame = (k: number): number | null => {
    const tk = k * dt;
    if (R.source === "pci-hook") {
      const bt = R.injection && k >= 0 && tk >= R.injection.at ? tk - R.injection.at : undefined;
      w.__pciDraw!(bt);
      return bt ?? null;
    }
    if (R.injection && k >= 0 && !injected && tk >= R.injection.at) {
      w.__sim!.getState().aspirate?.();
      injected = w.__lab!.startInjection();
      pushing = injected;
      labInfo.injected = injected;
    }
    if (pushing && R.injection && tk >= R.injection.at + R.injection.duration) {
      w.__lab!.releaseInjection();
      pushing = false;
    }
    w.__fluoroDraw!(k >= 0 && R.injection ? "cine" : k >= 0 ? R.mode : "fluoro");
    const b = w.__lab!.bolusFor();
    return b ? b.t : null;
  };
  try {
    const t0 = performance.now();
    for (let k = -R.warmup; k < R.nFrames; k++) {
      const a = performance.now();
      tap.last = null;
      const bt = drawFrame(k);
      const hit = tap.last as RenderTap["last"];
      if (!hit) throw new Error(`frame ${k}: the lab did not render (is its canvas mounted?)`);
      const gl = hit.xr.gl;
      const cv = gl.canvas as HTMLCanvasElement;
      if (cv.width !== cv.height) throw new Error(`frame ${k}: the lab canvas is ${cv.width}x${cv.height}, not square`);
      res = cv.width;
      if (res < LIVE_MIN_PX) throw new Error(`frame ${k}: the lab canvas is ${res} px (${cv.clientWidth} CSS px); widen the pane (live captures need at least ${LIVE_MIN_PX} px, and a run at another size cannot be compared with the baseline's)`);
      labInfo.cssPx = cv.clientWidth;
      const grey = readGrey(gl, res);
      tRender += performance.now() - a;
      if (k >= 0) {
        cam = cam ?? hit.scene.cam;
        kept.push(grey);
        bolusTs.push(bt);
        stamps.push((performance.now() - t0) / 1000);
        if (R.annotate) {
          const ann = annotateLiveFrame(k, k * dt, bt, hit.scene, hit.params, res, k < 5);
          const m = meterOf(hit.xr);
          if (m) ann.meter = m;
          anns.push(ann);
        }
      }
      // advance the lab one frame: in real time when its own loop runs, else by its step hook
      if (labInfo.clock === "real time") await sleep(Math.max(0, t0 + (k + R.warmup + 1) * 1000 * dt - performance.now()));
      else if (R.source === "pci-hook") w.__pciStep?.(dt, dt);
      else w.__labStep!(dt, dt);
    }
  } finally {
    tap.restore();
    if (pushing) w.__lab?.releaseInjection();
  }
  // the frame rate the run was filmed at in wall time (equal to fps when the lab advanced in real time and
  // kept up; irrelevant when the lab was stepped)
  if (stamps.length > 1) labInfo.wallFps = Math.round(((stamps.length - 1) / (stamps[stamps.length - 1] - stamps[0])) * 10) / 10;
  for (let k = 0; k < kept.length; k++) {
    hashes.push(await sha256Hex(kept[k]));
    if (R.upload) await post(`${R.set}__${R.name}_f${String(k).padStart(3, "0")}.png`, await encodeGreyPng(kept[k], res, res));
  }
  const sc = cam ? pixelScale(cam, res) : null;
  const meta = {
    version: 1,
    created: new Date().toISOString(),
    source: R.source,
    role: R.role,
    spec: R,
    cArm: R.cArm,
    artery: R.artery,
    fps: R.fps,
    res,
    fieldFraction: FIELD_FRACTION,
    captureMode: false,
    detMmPerPx: sc?.detMmPerPx ?? null,
    isoMmPerPx: sc?.isoMmPerPx ?? null,
    timestamps: stamps,
    bolusT: bolusTs,
    sha256: hashes,
    msPerFrame: { scene: 0, render: tRender / Math.max(1, R.nFrames + R.warmup) },
    lab: labInfo,
    annotations: anns,
  };
  if (R.upload) await post(`${R.set}__${R.name}.meta.png`, await encodeMetaPng(meta));
  return { set: R.set, name: R.name, frames: hashes.length, sha256: hashes, msScene: 0, msRender: tRender / Math.max(1, R.nFrames + R.warmup), uploaded: R.upload };
}

export async function capture(spec: CaptureSpec | CaptureSpec[]): Promise<SequenceResult[]> {
  const list = Array.isArray(spec) ? spec : [spec];
  const out: SequenceResult[] = [];
  for (const s of list) {
    const R = resolveSpec(s);
    out.push(R.source === "offscreen" ? await captureOffscreen(R) : await captureHook(R));
  }
  return out;
}

/** The scorecard's five reference views (scripts/realism/views.py REFERENCE_VIEWS), as the lab films them. */
export const REFERENCE_VIEWS: { name: string; view: string; scenario: string; mode?: "cine" | "fluoro" }[] = [
  { name: "lad_raocau", view: "raocaudal", scenario: "lad-focal" },
  // RAO cranial: the view of the real LAD traces (tortuosity, projected length) and a grey-level family
  { name: "lad_raocra", view: "raocranial", scenario: "lad-focal" },
  { name: "lad_apcra", view: "apcranial", scenario: "lad-focal" },
  { name: "lad_laocra", view: "laocranial", scenario: "lad-focal" },
  { name: "rca_lao", view: "rcalao", scenario: "rca-calcified" },
  { name: "rca_rao", view: "rcarao", scenario: "rca-calcified" },
];

/** Fluoroscopy companion of the first reference view: no contrast, 40 frames, for the scorecard's
 * "fluoro noisier than cine at equal grey" rule (scripts/realism/report.py). */
export const FLUORO_COMPANION = { name: "lad_raocau_fluoro", view: "raocaudal", scenario: "lad-focal", mode: "fluoro" as const, nFrames: 40 };
/**
 * Cine companion of the first reference view without contrast (C1, wave 2): the catheter holds saline, as
 * in the library's hand-picked unfilled-catheter segments, so the scorecard measures the unfilled catheter
 * on it (scripts/realism/report.py, "flush" runs). The library is diagnostic angiography
 * (CoronaryDominance), so the companion carries a 6 Fr diagnostic catheter. 12 frames.
 */
export const FLUSH_COMPANION = { name: "lad_raocau_flush", view: "raocaudal", scenario: "lad-focal", mode: "cine" as const, nFrames: 12, catheter: "diagnostic" as const };

export function standardSpecs(set: string, o: Partial<CaptureSpec> & { fluoro?: boolean; flush?: boolean } = {}): CaptureSpec[] {
  const { fluoro = true, flush = true, ...rest } = o;
  const specs: CaptureSpec[] = REFERENCE_VIEWS.map((v) => ({ set, name: v.name, view: v.view, scenario: v.scenario, ...rest }));
  if (fluoro) specs.push({ set, name: FLUORO_COMPANION.name, view: FLUORO_COMPANION.view, scenario: FLUORO_COMPANION.scenario, ...rest, mode: "fluoro", nFrames: FLUORO_COMPANION.nFrames, injection: null });
  if (flush) specs.push({ set, name: FLUSH_COMPANION.name, view: FLUSH_COMPANION.view, scenario: FLUSH_COMPANION.scenario, ...rest, mode: "cine", nFrames: FLUSH_COMPANION.nFrames, injection: null, catheter: FLUSH_COMPANION.catheter });
  return specs;
}

/**
 * The PCI device scenes of the baseline set (realism-baseline): the LAD lesion of the lad-focal scenario in
 * RAO cranial (the view of the lad_raocra reference run, so each device run has a device-free twin), drawn
 * through pciDevices at four stages of the case, each filmed as a standard cine run with the check injection.
 */
export const DEVICE_SCENES: { name: string; view: string; scenario: string; devices: PciDeviceStage }[] = PCI_DEVICE_STAGES.map((stage) => ({ name: `dev_${stage}`, view: "raocranial", scenario: "lad-focal", devices: stage }));

/** The two live-path sequences of the baseline set: one through each coronary lab's own render path. */
export const LIVE_SEQUENCES: Record<"pci" | "diagnostic", { name: string; source: "pci-hook" | "fluoro-hook"; view: string; scenario: string }> = {
  pci: { name: "live_pci_raocra", source: "pci-hook", view: "raocranial", scenario: "lad-focal" },
  diagnostic: { name: "live_diag_raocau", source: "fluoro-hook", view: "raocaudal", scenario: "lad-focal" },
};

/**
 * The offscreen part of the baseline set: the scorecard's specs exactly as c1g0 was captured
 * (standardSpecs: six reference views and the fluoroscopy and flush companions, default settings), then the
 * four device scenes. The live-path sequences are added with liveSpec() while each lab is open.
 */
export function baselineSpecs(set = "baseline", o: Partial<CaptureSpec> = {}): CaptureSpec[] {
  return [...standardSpecs(set, o), ...DEVICE_SCENES.map((d) => ({ set, name: d.name, view: d.view, scenario: d.scenario, devices: d.devices, ...o }))];
}

/** The live-path spec for one lab (open that lab first). */
export function liveSpec(set: string, lab: "pci" | "diagnostic", o: Partial<CaptureSpec> = {}): CaptureSpec {
  const L = LIVE_SEQUENCES[lab];
  return { set, name: L.name, source: L.source, view: L.view, scenario: L.scenario, ...o };
}

interface DrillPlanItem {
  id: string;
  realRun: string;
  realBase?: string;
  artery: "LCA" | "RCA";
  angles: { primary: number; secondary: number };
  nFrames: number;
  fps: number;
  heartRate?: number;
}

/** Capture the simulated half of every pair in the drill plan (/angio-library/sim-clips/plan.json, written
 * by `python3 scripts/realism/make_clip.py plan`). */
async function drill(set = "drill", o: Partial<CaptureSpec> = {}): Promise<SequenceResult[]> {
  const r = await fetch("/angio-library/sim-clips/plan.json", { cache: "no-store" });
  if (!r.ok) throw new Error("no drill plan: run python3 scripts/realism/make_clip.py plan");
  const plan = (await r.json()) as { items: DrillPlanItem[]; injectionAt: number };
  const specs: CaptureSpec[] = plan.items.map((it) => ({
    set,
    name: it.id,
    artery: it.artery,
    cArm: { laoRao: it.angles.primary, cranialCaudal: it.angles.secondary },
    nFrames: it.nFrames,
    fps: it.fps,
    heartRate: it.heartRate,
    injection: { at: plan.injectionAt, duration: STANDARD_PUSH_S },
    seed: 7,
    note: { realRun: it.realRun },
    ...o,
  }));
  return capture(specs);
}

export interface XrayCaptureApi {
  version: number;
  capture: typeof capture;
  standard: (set?: string, o?: Partial<CaptureSpec> & { fluoro?: boolean }) => Promise<SequenceResult[]>;
  /** the offscreen baseline set: the c1g0 specs plus the four PCI device scenes */
  baseline: (set?: string, o?: Partial<CaptureSpec>) => Promise<SequenceResult[]>;
  /** one live-path sequence through the open lab ("pci" or "diagnostic") */
  live: (lab: "pci" | "diagnostic", set?: string, o?: Partial<CaptureSpec>) => Promise<SequenceResult[]>;
  drill: typeof drill;
  simulate: typeof simulateSequence;
  resolve: typeof resolveSpec;
  registerPass: typeof registerCapturePass;
  sweep: typeof calibrationSweep;
}

export function installXrayCapture(): XrayCaptureApi {
  const api: XrayCaptureApi = {
    version: 3,
    capture,
    standard: (set = "baseline", o = {}) => capture(standardSpecs(set, o)),
    baseline: (set = "baseline", o = {}) => capture(baselineSpecs(set, o)),
    live: (lab, set = "baseline", o = {}) => capture(liveSpec(set, lab, o)),
    drill,
    simulate: simulateSequence,
    resolve: resolveSpec,
    registerPass: registerCapturePass,
    sweep: calibrationSweep,
  };
  (window as unknown as { __xrayCapture?: XrayCaptureApi }).__xrayCapture = api;
  return api;
}
