// ---------------------------------------------------------------------------
// The rod physics in the coronary labs (diag-rod-physics).
//
// Three layers:
//  1. RodPhysicsDevices implements the PhysicsDevices interface of
//     diag-engagement-fallback (src/ui/physics/types.ts) over the Cosserat-rod
//     solver's client (src/physics/physicsClient.ts: a Web Worker when there is
//     one, in-thread otherwise). src/ui/physics/impl/rod.ts registers it, so
//     getPhysicsDevices() returns it to any lab (pci-guide-engagement picks it
//     up there).
//  2. DiagnosticPhysics is the diagnostic lab's use of it, owned by the lab
//     session (src/ui/sim/labSession.ts): it builds the scene from the case
//     (anatomy model, route, variants, the coronary lumens of the render tree
//     so the physics and the image share one geometry), loads the catheter
//     over the 0.035 in J wire, steps on the patient engine's clock with its
//     breathing and the heart's contraction, takes the hand commands, turns a
//     catheter change into a timed exchange over the wire left in the root,
//     and reads the legacy view (tip, engagement, hub read-outs, polylines)
//     the store and the image use. Difficulty never reaches it: what is hard
//     comes from the anatomy and the mechanics.
//  3. The setting "Catheter mechanics: rod or simple" with its default rule
//     (the measured step cost against COST_RULE), the automatic fallback and
//     the reason the simple model is in use, for the Settings screen and the
//     lab's banner.
//
// The scripted procedures at the end (Judkins left, Judkins right, driving a
// right catheter into the conus) only issue hand commands and read the
// classifier, like src/physics/manoeuvres.ts; the tests, the development
// capture (src/dev/xrayCapture.ts) and the cost bench run them.
//
// Every number below that is not a measurement is a MODEL PARAMETER of this
// lab, not a sourced clinical value.
// ---------------------------------------------------------------------------

import { create } from "zustand";
import type { AccessRoute, AnatomyCase, AnatomyVariant, EngagementState, Vec3 } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import type { HandCommand, HubReaction } from "../../simulation/session/types";
import type { ControlState, TipState } from "../../simulation/engagement";
import { PhysicsClient } from "../../physics/physicsClient";
import { DEFAULT_KINK_SETUP, type EngineConfig, type EngineSnapshot, type KinkCommand, type KinkOutcome, type KinkReadout, type KinkRecoveryAction, type KinkSetup } from "../../physics/engine";
import { Region, LUMEN_LV, RADIAL_LOOP, loopControlInput, spasmControlInput, withRouteVariants } from "../../physics/lumen";
import { MP_RADIAL_LIVE, avulses, gripForceN, gripTorqueNmm, hubAxialForceN, radialLumenScale, spasmPain, type RadialMeasureId, type RadialMeasureResult } from "../../simulation/access/radialSpasm";
import { SHEATHS } from "../../simulation/access/closure";
import { forearmFinding, forearmHaematomaAfterAvulsion, type ForearmHaematoma } from "../../simulation/access/site";
import { MP_SPASM_EVENT_HOLD_S, scenarios as spasmScenarios, spasmSetups, type SpasmSetup } from "../../simulation/diagnosticScenarios/spasm";
import type { PatientEngine } from "../../simulation/patient/engine";
import { sideHoleBase } from "../../data/catheters";
import type { LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { PedalState } from "../../simulation/session/types";
import type { SessionModule } from "../sim/modules";
import type { ConfigInfo, MotionMsg, PhysicsFrame } from "../../physics/protocol";
import { LumenSet, queryTube, type CoronaryInput, type LumenHit } from "../../physics/lumen";
import { coronaryInputsFromTree, type SamplePosFn, type TreeLike } from "../../physics/coronaryLumens";
import { CATHETER_IDS, wireSpec } from "../../physics/catheterShapes";
import { bridgedKind, inConus, legacyEngagement, legacyView, neutralEngagement, type LegacyView } from "../../physics/legacyBridge";
import { samplePos } from "../../render/xray/coronaryTree";
import { motionAt } from "../../render/xray/heartMotion";
import { DIAPHRAGM_DESCENT } from "../../render/xray/thorax";
import type { DiagnosticPhysicsReading } from "../lab/diagnosticContext";
import { diagScenarioById, type DiagScenario } from "../../simulation/diagnosticScenarios";
import type {
  PhysicsDeviceKind,
  PhysicsDevices,
  PhysicsDevicesCreateOptions,
  PhysicsLoadOptions,
  PhysicsMotion,
  PhysicsReading,
  PhysicsSceneInit,
} from "./types";

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/**
 * The rule for the rod physics to be on by default: over a 60 s scripted Judkins left and Judkins
 * right session with the renderer drawing at 1024 px, the median step cost is under 4 ms and the
 * 95th centile under 8 ms. Thresholds for this machine (lab-build-plan diag-rod-physics), not
 * sourced values. A step is one lab frame of the solver (PhysicsFrame.stepMs).
 */
export const COST_RULE = { medianMs: 4, p95Ms: 8, sessionS: 60, rendererPx: 1024 } as const;

/** A measured step cost (ms per lab frame). */
export interface MeasuredCost {
  medianMs: number;
  p95Ms: number;
  /** frames measured */
  frames: number;
  /** the fluoroscopy canvas size (px) during the run; the rule needs COST_RULE.rendererPx or more */
  rendererPx: number;
  /** what was measured, where and when */
  note: string;
}

/**
 * The step cost measured on the development machine with the cost bench (DiagnosticPhysics.bench,
 * window.__lab.physics.bench(60) in the cath lab): worker mode, the solver configuration chosen by
 * "auto", the JL4 then JR4 scripts with the fluoroscopy image drawn every frame. Null until measured;
 * the package notes record the run.
 */
export const MEASURED_COST: MeasuredCost | null = {
  medianMs: 1.6,
  p95Ms: 3.8,
  frames: 3601,
  rendererPx: 988,
  note:
    "8 October 2026, development server on the Apple M4 development machine, browser pane tab emulating 1600 x 1000 (fluoroscopy canvas 988 px, the largest the lab layout gives at that viewport; the baseline's diagnostic live runs used the same size), worker mode, auto configuration segment scale 1.4 at 120 Hz (init bench 8.4 to 9.0 s), case easy-left-0, 60.0 s of lab time (100 s wall) of the JL4 script, an exchange to JR4 and the JR4 script, the image drawn every lab frame. The slower of two runs; the first gave median 1.2 ms and 95th centile 2.6 ms over 3098 frames.",
};

/** Whether a measured step cost is under COST_RULE's median and 95th centile thresholds. */
export function costUnderThresholds(c: Pick<MeasuredCost, "medianMs" | "p95Ms"> | null | undefined): boolean {
  return !!c && Number.isFinite(c.medianMs) && Number.isFinite(c.p95Ms) && c.medianMs < COST_RULE.medianMs && c.p95Ms < COST_RULE.p95Ms;
}

/** Whether a measured cost meets COST_RULE: under both thresholds, measured with the image at COST_RULE.rendererPx or more. */
export function costMeetsRule(c: Pick<MeasuredCost, "medianMs" | "p95Ms" | "rendererPx"> | null | undefined): boolean {
  return costUnderThresholds(c) && !!c && Number.isFinite(c.rendererPx) && c.rendererPx >= COST_RULE.rendererPx;
}

/**
 * The rod physics is the default only when the measured cost meets the rule. The run recorded in
 * MEASURED_COST had the image at 988 px, under the rule's 1024 px, so the default is the simple
 * model until a run at 1024 px or more is recorded; the Settings choice still turns the rod on.
 */
export const ROD_DEFAULT_ON = costMeetsRule(MEASURED_COST);

/**
 * The solver's own budget (ms per 1/15 s of patient time, the unit of src/physics/host.ts and
 * bench.autoConfig): COST_RULE's median step at the lab's 60 frames/s, four frames per 1/15 s. "auto"
 * picks the finest validated configuration within it and the over-budget flag compares with it.
 */
export const SOLVER_BUDGET_MS = COST_RULE.medianMs * 4;
/** Seconds the solver may stay over its time budget before the lab falls back to the simple model (plan: 10 s). */
export const OVER_BUDGET_FALLBACK_S = 10;

/**
 * Patient seconds after the first frame during which the over-budget flag is not counted: the worker's
 * code is still warming up and it is catching up with the clock that ran on during the init bench
 * (frames of up to MAX_CATCH_UP, measured at several times the steady per-substep cost). MODEL
 * PARAMETER and a deviation from the plan, whose fallback rule has only the 10 s over budget: a
 * session can stay over budget for up to OVER_BUDGET_GRACE_S + OVER_BUDGET_FALLBACK_S after its first
 * frame before it falls back.
 */
export const OVER_BUDGET_GRACE_S = 15;
/** Where the catheter starts: tip this far back from the top of the root along the route, over the J wire (mm). */
export const START_TIP_BACK_MM = 70;
/** The J wire's lead beyond the catheter tip at the start (mm). */
export const START_WIRE_LEAD_MM = 30;
/** The operator presents the curve towards the patient's left and posterior (a 45 degree left anterior oblique view's "left"), as src/physics/scenarios.ts LAO_LEFT. */
export const LAO_LEFT: [number, number, number] = [Math.SQRT1_2, 0, -Math.SQRT1_2];

/**
 * The exchange over the wire (MODEL PARAMETERS of the crew's technique, not sourced values):
 *  clearMm, clearMaxMm   the catheter is first backed out of the coronary until its tip is clearMm above
 *                        the valve plane, at most clearMaxMm of pull;
 *  wireLeadMm            the J wire is then advanced to lead the catheter tip by this much;
 *  pullMm                the catheter is withdrawn over the pinned wire by this much;
 *  outS                  time out of the patient (the catheter comes out, the wire is wiped, the new one loaded);
 *  finalLeadMm           the new catheter is advanced over the wire until the wire leads it by this much;
 *  pullMmS, wireMmS      hand speeds (mm/s); stepMaxS: longest a step waits for the devices.
 */
export const EXCHANGE = { clearMm: 45, clearMaxMm: 90, wireLeadMm: 20, pullMm: 150, outS: 3, finalLeadMm: 20, pullMmS: 40, wireMmS: 50, stepMaxS: 8 };
/** How far beyond the root top deepestArclengthAbove looks along the extrapolated route (mm; a search bound, not a model value). */
const ROUTE_SEARCH_BEYOND_MM = 80;
/**
 * The J wire's distal curve laid straight (mm): the length of its curved arcs in the solver's own J
 * shape (src/physics/catheterShapes.ts WIRE_DEFS J). A J wire put back straight along the route
 * reaches this much further than its curled tip until it curls again.
 */
const J_STRAIGHT_MM = wireSpec("J").arcs.reduce((a, x) => a + x.len, 0);
/** The sheath hub lies this far outside the skin along the route (src/physics/engine.ts sheathExit). */
const SHEATH_HUB_MM = 25;
/** A wire pushed in again after it was withdrawn is fed through the hub to this far inside the catheter tip (mm). */
export const REINSERT_WIRE_INSIDE_MM = 120;
/**
 * The catheter counts as moving (an earlier aspiration no longer stands) when the hand pushed, pulled or
 * turned it since the last read-out. The tip's own displacement is not used: with the heart moving the
 * tip travels more than a fraction of a millimetre between read-outs while the hub is held still.
 */
/**
 * The hub load counts as forward pressure (the store's over-push warning and trauma model) only while
 * the hand is pushing and for this long after (s): a held catheter that rests compressed against the
 * wall stores load without the operator forcing it, which the legacy forward pressure did not count.
 */
export const PUSHING_HOLD_S = 0.3;
/** Prolapses within this window (s) that count as a failed attempt to engage ("engage-fail"). */
export const PROLAPSE_WINDOW_S = 60;
/** A prolapse counts when the catheter stays folded this long (s), so the classifier's flicker at the fold's threshold is not counted. */
export const PROLAPSE_MIN_S = 0.5;
export const PROLAPSE_REPEAT = 2;
/**
 * The conus latch (MODEL PARAMETERS): with the heart moving, the conus lumen moves with each beat and
 * the classifier finds a tip lodged in the branch in it for only part of the beat (no vessel for the
 * rest). The lab counts the tip in the conus once the classifier has found it there for
 * MP_CONUS_LATCH_S in all (since it was last out), and out again only when the classifier has not found
 * it there for longer than one RR interval and it is clear of the conus lumen (depth short of
 * MP_CONUS_RELEASE_DEPTH_MM, or another vessel or none). While latched the lab reads the tip as it was
 * the last time the classifier found it in the branch.
 */
export const MP_CONUS_LATCH_S = 0.3;
export const MP_CONUS_RELEASE_DEPTH_MM = -1.5;
/**
 * The coronary lumens are sent to the solver again only when the heart's contraction or the breathing
 * phase has changed by more than this since the last send (MODEL PARAMETER: about one sixtieth of
 * their range, below what the image shows), so a still phase of the beat sends nothing.
 */
export const MP_CORONARY_RESEND = 0.02;

/**
 * The solver configuration "auto" chose earlier in this page, reused by later sessions so the init
 * bench (several seconds) runs once per page. Worker sessions only; reset by tests.
 */
let pageAutoConfig: Partial<EngineConfig> | null = null;
export function cachedAutoConfig(): Partial<EngineConfig> | null {
  return pageAutoConfig;
}
export function resetCachedAutoConfig(): void {
  pageAutoConfig = null;
}

// ---------------------------------------------------------------------------
// The reading
// ---------------------------------------------------------------------------

/**
 * The rod mechanics' reading: the interface's PhysicsReading with the catheter's kink and torque loss
 * (diag-catheter-kink), at the top level (tipFromPhysics reads `kink`) and as `catheter` (the dev hook
 * window.__lab.physics.latest().catheter.kink).
 */
export interface RodPhysicsReading extends PhysicsReading {
  kink: KinkReadout | null;
  torqueLoss: boolean;
  catheter: { kink: KinkReadout | null; torqueLoss: boolean; storedTwist: number };
}

/** The newest reading of a physics frame, in the interface's vocabulary (kind is the labs' bridged kind). */
export function readingFromFrame(f: PhysicsFrame | null): RodPhysicsReading | null {
  if (!f || !f.catheter || !f.engagement) return null;
  const e = f.engagement;
  const kink = f.catheter.kink ?? null;
  const torqueLoss = !!f.catheter.torqueLoss;
  return {
    kink,
    torqueLoss,
    catheter: { kink, torqueLoss, storedTwist: f.catheter.storedTwist ?? 0 },
    t: f.t,
    vessel: e.vessel,
    side: e.side,
    depthMm: e.depthMm,
    coaxiality: e.coaxiality,
    wallForce: e.wallForce,
    openFraction: e.openFraction,
    prolapsed: e.prolapsed,
    kind: bridgedKind(e),
    conus: inConus(e),
    costMs: f.stepMs,
  };
}

/** Where the tip is for the tip context: "lv" in the ventricle, below the valve or prolapsed; "route" outside the root; else "root". */
export function tipZoneOf(r: Pick<PhysicsReading, "kind" | "prolapsed">): NonNullable<DiagnosticPhysicsReading["tipZone"]> {
  if (r.kind === "in-lv" || r.kind === "below-valve" || r.prolapsed) return "lv";
  if (r.kind === "not-in-root") return "route";
  return "root";
}

// ---------------------------------------------------------------------------
// 1. The PhysicsDevices implementation
// ---------------------------------------------------------------------------

/** What RodPhysicsDevices.init takes beyond the interface's scene. */
export interface RodSceneInit extends PhysicsSceneInit {
  /** solver configuration, or "auto" (the worker benches the validated configurations at init) */
  config?: Partial<EngineConfig> | "auto";
  /** per-frame solver budget for "auto" and the over-budget flag (ms per 1/15 s, default 2) */
  budgetMs?: number;
  /** arch branches that are not the route (default true, as the live geometry the manoeuvre suite validates) */
  archBranches?: boolean;
}

/** Load options beyond the interface's. */
export interface RodLoadOptions extends PhysicsLoadOptions {
  /** route arclength of the tip (mm); overrides advanceMm */
  tipS?: number;
  /** present the curve towards this direction */
  facing?: [number, number, number];
}

export class RodPhysicsDevices implements PhysicsDevices {
  readonly client: PhysicsClient;
  private scene: RodSceneInit | null = null;
  private lumens: LumenSet | null = null;
  private hit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
  private readingFor: PhysicsFrame | null = null;
  private reading: RodPhysicsReading | null = null;

  constructor(opts: PhysicsDevicesCreateOptions = {}) {
    this.client = PhysicsClient.create({ useWorker: opts.useWorker });
  }

  get usesWorker(): boolean {
    return this.client.usesWorker;
  }

  /** the configuration the solver settled on, once known */
  get config(): ConfigInfo | null {
    return this.client.config;
  }

  get lastError(): string | null {
    return this.client.lastError;
  }

  init(scene: RodSceneInit): void {
    this.scene = scene;
    const v = scene.variants ?? [];
    // the same lumens the solver builds (engine.ts), kept on this thread for route arclengths
    this.lumens = new LumenSet({
      route: scene.route,
      model: scene.model,
      resp: 0,
      tortuousSubclavian: v.includes("tortuous-subclavian"),
      tortuousIliac: v.includes("tortuous-iliac"),
      radialLoop: v.includes("radial-loop"),
      coronaries: scene.coronaries,
      archBranches: scene.archBranches ?? true,
    });
    this.client.init({
      model: scene.model,
      route: scene.route,
      variants: scene.variants,
      coronaries: scene.coronaries,
      archBranches: scene.archBranches ?? true,
      config: scene.config ?? "auto",
      budgetMs: scene.budgetMs,
      t0: scene.t0,
    });
  }

  /** Route arclength at the top of the root (mm). */
  routeLength(): number {
    return this.need().routeLength;
  }

  /** Route arclength of a point near the access route (mm). */
  arclength(p: ArrayLike<number>): number {
    const L = this.need();
    queryTube(L.access, p[0], p[1], p[2], 0, -1, this.hit);
    return this.hit.s;
  }

  /**
   * The deepest route arclength (towards the root top and on beyond it, extrapolated) at which the
   * route centre line is still at or above height `y` (mm, aortic frame); 0 if none is.
   */
  deepestArclengthAbove(y: number): number {
    const L = this.need();
    const out = new Float64Array(6);
    for (let s = L.routeLength + ROUTE_SEARCH_BEYOND_MM; s > 0; s -= 1) {
      L.routePoint(s, out);
      if (out[1] >= y) return s;
    }
    return 0;
  }

  /** Route arclength where the device enters the skin (mm). */
  skinS(): number {
    return this.need().skinS;
  }

  /** Radius of the aortic root (mm). */
  rootRadius(): number {
    return this.need().root.R;
  }

  /** The stretch of the access route (route arclengths, mm) labelled with this lumen region, or null. */
  regionSpan(region: number): [number, number] | null {
    const t = this.need().access;
    let a = -1, b = -1;
    for (let i = 0; i < t.n; i++) {
      if (t.region[i] !== region) continue;
      if (a < 0) a = t.cum[i];
      b = t.cum[i];
    }
    return a < 0 ? null : [a, b];
  }

  /** The lumens kept on this thread (route arclengths, regions and the radial loop; the solver has its own copy). */
  lumenSet(): LumenSet {
    return this.need();
  }

  /** Straighten the radial loop of the local lumens (the solver's copy takes it with the motion: lumen.ts loopControlInput). */
  setLoopStraighten(f: number): void {
    this.need().setLoopStraighten(f);
  }

  /** An engine command of the kink model (diag-catheter-kink), through the hands' channel: the worker forwards every command to the engine. */
  kinkCommand(c: KinkCommand): void {
    this.client.command(c as unknown as HandCommand);
  }

  load(device: PhysicsDeviceKind, id: string, opts: RodLoadOptions = {}): void {
    void device; // a guide is a catheter to the solver (slot "catheter")
    const tipS = opts.tipS ?? (opts.advanceMm !== undefined ? this.routeLength() - START_TIP_BACK_MM + opts.advanceMm : undefined);
    this.client.loadCatheter(id, { tipS, roll: opts.roll, facing: opts.roll === undefined ? opts.facing ?? LAO_LEFT : undefined });
  }

  /**
   * Load the 0.035 in J wire with its tip `advanceMm` beyond the catheter tip (negative: inside it), or,
   * with no catheter loaded, beyond the sheath hub (src/physics/engine.ts loadWire).
   */
  loadWire(id = "J", advanceMm = -5): void {
    this.client.loadWire(id, { advance: advanceMm });
  }

  remove(device: PhysicsDeviceKind): void {
    void device;
    this.client.remove("catheter");
  }

  removeWire(): void {
    this.client.remove("wire");
  }

  command(cmd: HandCommand): void {
    this.client.command(cmd);
  }

  step(tClock: number, motion?: PhysicsMotion): void {
    this.client.step(tClock, motion as MotionMsg | undefined);
  }

  /** The newest frame's reading, built once per frame (the same object until the next frame). */
  latest(): RodPhysicsReading | null {
    const f = this.client.latest();
    if (f !== this.readingFor) {
      this.readingFor = f;
      this.reading = readingFromFrame(f);
    }
    return this.reading;
  }

  /** the newest complete frame (nodes, reactions, the classifier's reading) */
  frame(): PhysicsFrame | null {
    return this.client.latest();
  }

  snapshot(): Promise<EngineSnapshot> {
    return this.client.snapshot();
  }

  dispose(): void {
    this.client.dispose();
  }

  private need(): LumenSet {
    if (!this.lumens) throw new Error("physics devices: init must come first");
    return this.lumens;
  }
}

// ---------------------------------------------------------------------------
// 2. The diagnostic lab's physics
// ---------------------------------------------------------------------------

/** The patient clock the heart and the breathing follow (PatientEngine.clockState()). */
export interface PhysicsClock {
  t: number;
  tInBeat: number;
  rr: number;
  endSystole: number;
  resp?: number;
}

/** Breathing shift of the heart (the formula of sceneBuilder.ts buildXrayScene: the heart rests on the diaphragm). */
export function heartShiftFor(resp: number): Vec3 {
  return { x: 0, y: -0.85 * DIAPHRAGM_DESCENT * resp, z: 3 * resp };
}

/**
 * Vessels thinner than this at their origin are left out of the physics (coronaryLumens.ts default),
 * except the conus branch: it always has its own ostium in the sinus (coronaryGrowth.ts), and a right
 * catheter lodges in its mouth whatever its calibre.
 */
const MIN_RADIUS_MM = 0.6;
const ALWAYS = new Set(["CONUS"]);

/** Proximal coronary lumens of the render tree at this clock time: the image's own vessels, moved by the heart. */
export function coronariesAt(tree: TreeLike, clock: PhysicsClock | null, contraction?: number): CoronaryInput[] {
  const keep = (list: CoronaryInput[]) => list.filter((c) => ALWAYS.has(c.name) || (c.radii[0] ?? 0) >= MIN_RADIUS_MM);
  if (!clock) return keep(coronaryInputsFromTree(tree, samplePos as unknown as SamplePosFn, { contraction: 0 }, { minRadius: 0 }));
  // the contraction only (coronaryLumens.ts): the physics runs in the frame of the root, so the root's
  // own cardiac and breathing motion is the renderer's (moveWorld), not the lumens'
  const c = contraction ?? motionAt(clock).contraction;
  return keep(coronaryInputsFromTree(tree, samplePos as unknown as SamplePosFn, { contraction: c, heartShift: heartShiftFor(clock.resp ?? 0), rootW: 0.45 }, { minRadius: 0 }));
}

export interface DiagnosticPhysicsOptions {
  model: AnatomyModel;
  caseData: Pick<AnatomyCase, "accessRoute"> & { variants?: AnatomyVariant[]; scenarioId?: string };
  /** the render tree (FluoroView's): the physics coronaries come from it */
  tree: TreeLike;
  catheterId: string;
  /** patient clock at the start */
  clock?: PhysicsClock | null;
  /** run the solver in a worker when possible (default true) */
  useWorker?: boolean;
  /** solver configuration (default "auto") */
  config?: Partial<EngineConfig> | "auto";
  budgetMs?: number;
  /** move the coronary lumens with the beating heart (default true) */
  moveCoronaries?: boolean;
  /** fall back when over budget for OVER_BUDGET_FALLBACK_S (default true; tests run in-thread and switch it off) */
  autoFallback?: boolean;
  /**
   * where the catheter starts (defaults START_TIP_BACK_MM, START_WIRE_LEAD_MM; wire null: no wire). `at`
   * 'sheath' starts the catheter at the sheath tip with the J wire leading (ROUTE_START; default: the
   * scenario's startAt, else the root).
   */
  start?: { tipBackMm?: number; wireLeadMm?: number | null; at?: "root" | "sheath" };
}

type ExchangePhase = "pullback" | "wire" | "withdraw" | "out" | "in";

interface ExchangeState {
  to: string;
  /** the wire came out with the catheter (a wire too short to hold the route from the sheath; diag-route-wire-led-radial) */
  routeLost?: boolean;
  phase: ExchangePhase;
  /** patient time the phase began */
  since: number;
  /** mm commanded in this phase */
  moved: number;
  /** route arclength of the old catheter's tip when it was removed */
  sRemoved: number;
  /** the wire's lowest tip height above the valve plane seen during the exchange (mm) */
  minWireTipHeight: number;
}

/** The hub and table read-outs (TableView). */
export interface PhysicsTableState {
  insertedMm: { catheter: number; wire035: number };
  hubRollRad: { catheter: number };
}

/** A physics snapshot taken at a decision point (the recorder's). */
export interface PhysicsSnapshotEntry {
  t: number;
  reason: string;
  snap: EngineSnapshot;
}

const sortedPct = (xs: number[], p: number): number => {
  if (!xs.length) return NaN;
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
};

export class DiagnosticPhysics {
  readonly devices: RodPhysicsDevices;
  readonly model: AnatomyModel;
  readonly route: AccessRoute;
  readonly tree: TreeLike;
  /** the catheter in the patient (the store's id) */
  catheterId: string;
  /** why the lab must fall back to the simple model (set once; the session acts on it) */
  failed: string | null = null;
  /** the exchange in progress, or null */
  exchange: ExchangeState | null = null;
  /** the last exchange's lowest wire tip height above the valve plane (mm), for tests and the debrief */
  lastExchangeMinWireTipHeight: number | null = null;
  /** per-frame solver cost (ms) of every new frame, newest last (at most COST_KEEP) */
  readonly costs: number[] = [];
  /** new frames counted since the session began (costs keeps only the newest COST_KEEP of them) */
  costsTotal = 0;
  private readonly moveCoronaries: boolean;
  private readonly autoFallback: boolean;
  private hubRoll = 0;
  private lastPushT = -Infinity;
  private lastFrame: PhysicsFrame | null = null;
  private lastView: LegacyView | null = null;
  private viewFor: PhysicsFrame | null = null;
  private viewLatched = false;
  private lastReading: PhysicsReading | null = null;
  private readingFrom: PhysicsReading | null = null;
  private readingLatched = false;
  private nearestFor: LegacyView | null = null;
  private nearest: Int32Array | null = null;
  /** the conus latch (MP_CONUS_LATCH_S): the tip counts as in the conus */
  private conusLatched = false;
  private conusInS = 0;
  private conusLastInT = -Infinity;
  private conusLastT: number | null = null;
  private conusReading: PhysicsReading | null = null;
  private conusEngagement: EngagementState | null = null;
  private sentContraction = NaN;
  private sentResp = NaN;
  private readonly autoConfig: boolean;
  /** the hand pushed, pulled or turned the catheter since the last read-out (readout().moving) */
  private handMoved = true;
  private overSince: number | null = null;
  private firstFrameT: number | null = null;
  private t = 0;
  private prolapsedNow = false;
  private prolapseSince: number | null = null;
  private prolapseOnsets: number[] = [];
  private wireOut = false;
  /** the kink set-up last sent to the engine (diag-catheter-kink: the diagnostic lab turns the model on) */
  private localKinkSetup: KinkSetup = { ...DEFAULT_KINK_SETUP, model: true };
  /** a set-up sent and not yet seen in a frame: the frame current when it was sent, and the lab time */
  private kinkSetupSent: { frame: PhysicsFrame | null; t: number } | null = null;
  /** catheter changes made with a kink in the shaft that had not been covered with a sheath */
  kinkedExchanges = 0;
  /** where the case opened: the catheter at the root, or at the sheath with the wire leading (diag-route-wire-led-radial) */
  readonly startAt: "root" | "sheath";
  /** the 0.035 in (or 0.014 in) wire in use: its physics id (ROUTE_WIRES) */
  wireId = "J";
  /** the route mechanics of the newest frame (updateRoute), or null before the first frame */
  private routeNow: RouteMechanics | null = null;
  private routeAcc = newRouteAccumulators();
  /** catheter push commanded (mm) since the last frame, and wire push */
  private pushCathMm = 0;
  private pushWireMm = 0;
  /** all the catheter push the hand has commanded (mm, withdrawal negative): the hand's own movement at the hub */
  private cathFedMm = 0;
  /** the radial loop's straightening (0 the turn … 1 straight) */
  private loopStraighten = 0;
  /** the straightening the lumens were last given: loopStraighten in steps of MP_ROUTE_LED.loopSendStep, so the lumens rebuild a few dozen times over a crossing, not every frame */
  private loopSent = 0;
  /** the route mechanics object, updated in place each frame (routeNow points at it once the first frame is in) */
  private readonly routeBuf: RouteMechanics = newRouteMechanics();
  private readonly loopBuf: NonNullable<RouteMechanics["loop"]> = { span: [0, 0], straighten: 0, wireAcross: false, catheterAcross: false, stalled: null, stallWire: null };
  private readonly stallBuf: NonNullable<RouteMechanics["stalled"]> = { device: "wire", s: 0, atLoop: false };
  private readonly perfBuf: NonNullable<RouteMechanics["perforation"]> = { s: 0, t: 0, sealed: false, region: 0 };
  private readonly cTipBuf: [number, number, number] = [0, 0, 0];
  private readonly wTipBuf: [number, number, number] = [0, 0, 0];
  /** balloon-assisted tracking set up at the catheter tip (null: none) */
  bat: { atm: number } | null = null;
  /** the radial artery's spasm the lumens carry (diag-spasm-states): its tone, and whether the solver still needs a send at 0 */
  private radialSpasmLevel = 0;
  private radialSpasmPending = false;
  /** the catheter and the artery the grip acts between (diag-spasm-states setRadialSpasm) */
  private gripGeom: { catheterOdMm: number; radialDiamMm: number; lubricated: number } = { catheterOdMm: 2, radialDiamMm: 2.5, lubricated: 0 };
  disposed = false;

  static readonly COST_KEEP = 7200;

  constructor(o: DiagnosticPhysicsOptions) {
    this.model = o.model;
    this.route = o.caseData.accessRoute;
    this.tree = o.tree;
    this.catheterId = o.catheterId;
    this.moveCoronaries = o.moveCoronaries ?? true;
    this.autoFallback = o.autoFallback ?? true;
    this.devices = new RodPhysicsDevices({ useWorker: o.useWorker ?? true });
    const clock = o.clock ?? null;
    this.t = clock?.t ?? 0;
    // "auto" benches the solver at init; a worker session reuses the configuration an earlier session chose
    const cached = (o.useWorker ?? true) && (o.config ?? "auto") === "auto" ? cachedAutoConfig() : null;
    const config = cached ?? o.config ?? "auto";
    this.autoConfig = config === "auto" && (o.useWorker ?? true);
    this.startAt = o.start?.at ?? scenarioStartAt(o.caseData.scenarioId);
    // the radial loop is in the lumen only for a case that starts at the sheath: from the root the catheter
    // has already crossed the arm, and a case that opens there keeps its geometry as before
    const variants = this.startAt === "sheath" ? o.caseData.variants : (o.caseData.variants ?? []).filter((x) => x !== "radial-loop");
    this.devices.init({
      model: withRouteVariants(o.model, variants),
      route: this.route,
      variants,
      coronaries: coronariesAt(o.tree, this.moveCoronaries ? clock : null),
      t0: this.t,
      config,
      budgetMs: o.budgetMs ?? SOLVER_BUDGET_MS,
      archBranches: true,
    });
    // the kink model is opt-in in the shared engine: the diagnostic lab turns it on (diag-catheter-kink)
    this.devices.kinkCommand({ kind: "kink-setup", setup: { model: true } });
    this.kinkSetupSent = { frame: null, t: this.t };
    const back = o.start?.tipBackMm ?? START_TIP_BACK_MM;
    const sheathStart = this.startAt === "sheath" && o.start?.tipBackMm === undefined;
    const lead = o.start?.wireLeadMm === undefined ? (sheathStart ? ROUTE_START.wireLeadMm : START_WIRE_LEAD_MM) : o.start.wireLeadMm;
    const tipS = sheathStart ? this.sheathStartS() : this.devices.routeLength() - back;
    this.devices.load("catheter", physicsCatheterId(this.catheterId), { tipS, facing: LAO_LEFT });
    const ks = kinkStartFor(o.caseData.scenarioId);
    if (lead !== null && !ks) this.devices.loadWire("J", lead);
    else this.wireOut = true;
    if (ks) {
      // a scenario that opens with a kink already in the shaft: in the middle of the route region it names
      const span = this.devices.regionSpan(ks.region);
      if (span) this.devices.kinkCommand({ kind: "kink-latch", u: tipS - (span[0] + span[1]) / 2, severity: ks.severity });
    }
  }

  /** The solver can drive this catheter id (it has a physics shape). */
  static supports(catheterId: string): boolean {
    return CATHETER_IDS.includes(physicsCatheterId(catheterId));
  }

  get active(): boolean {
    return !this.disposed && !this.failed;
  }

  get exchanging(): boolean {
    return this.exchange !== null;
  }

  /** The solver has not yet answered with its first frame (the worker's init, with the "auto" bench). */
  get preparing(): boolean {
    return this.active && this.devices.frame() === null;
  }

  /** A hand command from the input bus. Ignored while the crew's exchange has the devices. */
  command(c: HandCommand): void {
    if (!this.active || this.exchange) return;
    if (c.kind === "torque" && (c.device === "catheter" || c.device === "pigtail")) this.hubRoll += c.rad;
    if (c.kind === "push" && (c.device === "catheter" || c.device === "pigtail") && c.mm > 0) this.lastPushT = this.t;
    if (c.kind === "push" && (c.device === "catheter" || c.device === "pigtail")) {
      this.pushCathMm += c.mm;
      if (Number.isFinite(c.mm)) this.cathFedMm += c.mm;
    }
    if (c.kind === "push" && (c.device === "wire035" || c.device === "wire014")) this.pushWireMm += c.mm;
    if ((c.kind === "torque" && c.rad !== 0) || (c.kind === "push" && c.mm !== 0)) if (c.device === "catheter" || c.device === "pigtail") this.handMoved = true;
    if (c.kind === "push" && (c.device === "wire035" || c.device === "wire014") && c.mm > 0 && this.wireIsOut()) {
      // the wire is fed back through the hub to near the curve, then the hand takes it on; in a kinked
      // catheter it is fed only to just short of the kink, which the hand must then pass (diag-catheter-kink)
      const k = this.kink();
      this.devices.loadWire(this.wireId, k ? -(k.u + KINK_WIRE_FEED_MM) : -REINSERT_WIRE_INSIDE_MM);
      this.wireOut = false;
    }
    this.devices.command(c);
  }

  private wireIsOut(): boolean {
    const f = this.devices.frame();
    return this.wireOut || (!!f && !!f.catheter && !f.wire);
  }

  /**
   * Advance the physics to the patient clock (call once per lab frame). The heart moves the
   * coronary lumens and the breathing the arm routes, as in the image.
   */
  step(clock: PhysicsClock): void {
    if (!this.active) return;
    const dt = Math.max(0, clock.t - this.t);
    this.t = clock.t;
    const resp = clock.resp ?? 0;
    const motion: PhysicsMotion = { resp };
    if (this.moveCoronaries) {
      // the lumens again only when the contraction or the breathing moved them visibly (MP_CORONARY_RESEND)
      const contraction = motionAt(clock).contraction;
      if (!(Math.abs(contraction - this.sentContraction) <= MP_CORONARY_RESEND && Math.abs(resp - this.sentResp) <= MP_CORONARY_RESEND)) {
        motion.coronaries = coronariesAt(this.tree, clock, contraction);
        this.sentContraction = contraction;
        this.sentResp = resp;
      }
    }
    // the radial loop's straightening rides with every step while it is not the turn (lumen.ts loopControlInput)
    if (this.loopSent > 0) motion.coronaries = [...(motion.coronaries ?? []), loopControlInput(this.loopSent)];
    // the radial artery's spasm rides with every step while it is on, and once more when it ends (diag-spasm-states)
    if (this.radialSpasmLevel > 0 || this.radialSpasmPending) {
      motion.coronaries = [...(motion.coronaries ?? []), spasmControlInput(this.radialSpasmLevel, radialLumenScale(this.radialSpasmLevel))];
      this.radialSpasmPending = false;
    }
    this.devices.step(clock.t, motion);
    const f = this.devices.frame();
    if (this.devices.lastError) {
      this.fail(`the rod solver stopped (${this.devices.lastError})`);
      return;
    }
    if (f && f !== this.lastFrame) {
      this.lastFrame = f;
      this.costs.push(f.stepMs);
      this.costsTotal++;
      if (this.costs.length > DiagnosticPhysics.COST_KEEP) this.costs.splice(0, this.costs.length - DiagnosticPhysics.COST_KEEP);
      if (this.firstFrameT === null) {
        this.firstFrameT = clock.t;
        // the configuration "auto" chose, for the next sessions in this page
        const ci = this.devices.config;
        if (this.autoConfig && ci) pageAutoConfig = { substepHz: ci.substepHz, segmentScale: ci.segmentScale };
      }
      this.updateConusLatch(f, clock);
      if (f.overBudget && clock.t - this.firstFrameT >= OVER_BUDGET_GRACE_S) this.overSince ??= clock.t;
      else this.overSince = null;
      if (this.autoFallback && this.overSince !== null && clock.t - this.overSince >= OVER_BUDGET_FALLBACK_S) {
        this.fail(`the rod solver stayed over its time budget for ${OVER_BUDGET_FALLBACK_S} s`);
        return;
      }
      // a prolapse of the bare catheter (no wire leading it) that lasts PROLAPSE_MIN_S counts once
      const p = !!f.engagement?.prolapsed && (this.view()?.wireLeadMm ?? 0) <= 0;
      if (!p) {
        this.prolapseSince = null;
        this.prolapsedNow = false;
      } else {
        this.prolapseSince ??= clock.t;
        if (!this.prolapsedNow && clock.t - this.prolapseSince >= PROLAPSE_MIN_S) {
          this.prolapsedNow = true;
          this.prolapseOnsets.push(clock.t);
        }
      }
      if (f.wire) this.wireOut = false;
      this.updateRoute(f);
    }
    if (this.exchange) this.stepExchange(dt);
  }

  /** The conus latch (MP_CONUS_LATCH_S, MP_CONUS_RELEASE_DEPTH_MM): in after time in the branch, out after a beat clear of it. */
  private updateConusLatch(f: PhysicsFrame, clock: PhysicsClock) {
    const e = f.catheter ? f.engagement : null;
    const raw = !!e && inConus(e);
    const dt = this.conusLastT === null ? 0 : Math.max(0, clock.t - this.conusLastT);
    this.conusLastT = clock.t;
    const rr = Number.isFinite(clock.rr) && clock.rr > 0 ? clock.rr : 1;
    if (raw) {
      this.conusLastInT = clock.t;
      this.conusInS += dt;
      this.conusReading = readingFromFrame(f);
      this.conusEngagement = legacyEngagement(e!);
      if (this.conusInS >= MP_CONUS_LATCH_S) this.conusLatched = true;
      return;
    }
    if (clock.t - this.conusLastInT <= rr) return;
    const clear = !e || e.vessel !== "CONUS" || e.depthMm < MP_CONUS_RELEASE_DEPTH_MM;
    if (!clear) return;
    this.conusLatched = false;
    this.conusInS = 0;
  }

  /** The tip counts as in the conus branch (the classifier's reading held by the latch). */
  get inConusBranch(): boolean {
    return this.active && this.conusLatched;
  }

  private fail(reason: string) {
    if (this.failed) return;
    this.failed = reason;
  }

  /** Newest frame, or null. */
  frame(): PhysicsFrame | null {
    return this.devices.frame();
  }

  /**
   * Newest reading in the interface's vocabulary (window.__lab.physics.latest().costMs), with the conus
   * latch applied; the same object until the next frame or a change of the latch.
   */
  latest(): PhysicsReading | null {
    const r = this.devices.latest();
    const latched = this.conusLatched;
    if (r !== this.readingFrom || latched !== this.readingLatched) {
      this.readingFrom = r;
      this.readingLatched = latched;
      this.lastReading =
        r && latched && !r.conus && this.conusReading
          ? ({ ...this.conusReading, t: r.t, costMs: r.costMs, ...("kink" in r ? { kink: (r as RodPhysicsReading).kink, torqueLoss: (r as RodPhysicsReading).torqueLoss, catheter: (r as RodPhysicsReading).catheter } : {}) } as PhysicsReading)
          : r;
    }
    return this.lastReading;
  }

  /** The legacy view of the newest frame (tip, engagement, hub read-outs, polylines) with the conus latch, cached per frame. */
  view(): LegacyView | null {
    const f = this.devices.frame();
    if (!f) return null;
    const latched = this.conusLatched;
    if (f !== this.viewFor || latched !== this.viewLatched) {
      this.viewFor = f;
      this.viewLatched = latched;
      const v = legacyView(f, this.model);
      this.lastView = v && latched && !v.engagement.conus && this.conusEngagement ? { ...v, engagement: this.conusEngagement } : v;
    }
    return this.lastView;
  }

  /**
   * For each node of the view's wire (wireInBody), the index of the nearest catheter node
   * (catheterInBody), computed once per frame: the image gives a wire node the cardiac coupling of the
   * catheter node it lies in or beside. Null without a wire or a catheter.
   */
  wireNearestIndex(): Int32Array | null {
    const v = this.view();
    if (v !== this.nearestFor) {
      this.nearestFor = v;
      this.nearest = null;
      const w = v?.wireInBody;
      const c = v?.catheterInBody;
      if (w && c && w.length >= 2 && c.length >= 2) {
        const out = new Int32Array(w.length);
        for (let j = 0; j < w.length; j++) {
          const p = w[j];
          let best = Infinity;
          let k = c.length - 1;
          for (let i = 0; i < c.length; i++) {
            const q = c[i];
            const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2;
            if (d < best) {
              best = d;
              k = i;
            }
          }
          out[j] = k;
        }
        this.nearest = out;
      }
    }
    return this.nearest;
  }

  /**
   * What the store takes this frame (setPhysicsReadout), or null before the first frame. While the
   * crew exchanges the catheter, or no catheter is in the patient, the engagement is neutral (not
   * selective, not in the root): the old catheter is on its way out and nothing may be injected.
   */
  readout(): { tip: TipState; engagement: EngagementState; controls: Partial<ControlState>; moving: boolean } | null {
    const v = this.view();
    if (!v || this.exchange) {
      const tip = v?.tip ?? this.lastView?.tip ?? null;
      if (!tip || !this.devices.frame()) return null;
      const lead = v ? Math.max(0, v.wireLeadMm) : 0;
      return {
        tip,
        engagement: neutralEngagement(tip.height),
        controls: { insertion: v?.insertedMm ?? 0, torque: this.hubRoll, wireInsertion: lead, windup: 0, forwardPressure: 0, resistance: v?.controls.resistance ?? 0, whip: 0 },
        moving: true,
      };
    }
    const moving = this.handMoved;
    this.handMoved = false;
    return {
      tip: v.tip,
      engagement: v.engagement,
      controls: {
        insertion: this.insertedMm(v),
        torque: this.hubRoll,
        wireInsertion: Math.max(0, v.wireLeadMm),
        windup: v.controls.windup,
        forwardPressure: this.t - this.lastPushT <= PUSHING_HOLD_S ? v.controls.forwardPressure : 0,
        resistance: v.controls.resistance,
        whip: v.controls.whip,
      },
      moving,
    };
  }

  /** The reading the tip context takes (DiagnosticLabSession.physicsReading). */
  contextReading(): DiagnosticPhysicsReading | null {
    const r = this.latest();
    if (!r) return this.exchange ? { exchange: true } : null;
    return { tipZone: tipZoneOf(r), vessel: r.vessel, exchange: this.exchange !== null };
  }

  /** The catheter's hub reaction this frame (for the haptics), or null; with the grip of a radial spasm added (diag-spasm-states). */
  reaction(): HubReaction | null {
    const f = this.devices.frame();
    const r = f?.catheter ? f.catheter.reaction : null;
    if (!r || !(this.radialSpasmLevel > 0)) return r;
    const g = this.radialGrip();
    if (!(g.axialN > 0)) return r;
    return { ...r, axial: r.axial + g.axialN, torsion: r.torsion + g.torqueNmm };
  }

  // --- radial spasm (diag-spasm-states) ------------------------------------------------

  /**
   * The radial artery's tone (0..1; radialSpasm.ts): the solver's lumens narrow the radial artery by
   * the shared model's lumen scale (lumen.ts; the wall friction stays the relaxed artery's,
   * RADIAL_SPASM_LUMEN.friction), and the hub reaction carries the grip of the shared model
   * (gripForceN, gripTorqueNmm) over the catheter length in the artery: the grip's one source. `geom` gives the catheter's outer diameter, the relaxed artery and the share
   * of the friction a lubricious solution has removed.
   */
  setRadialSpasm(level: number, geom?: Partial<{ catheterOdMm: number; radialDiamMm: number; lubricated: number }>): void {
    const l = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
    if (geom) this.gripGeom = { ...this.gripGeom, ...geom };
    if (l === this.radialSpasmLevel) return;
    if (l === 0 && this.radialSpasmLevel > 0) this.radialSpasmPending = true;
    this.radialSpasmLevel = l;
    if (this.active) this.devices.lumenSet().setRadialSpasm(l, radialLumenScale(l));
  }

  /**
   * All the catheter push the hand has commanded (mm; a withdrawal counts negative): the hub's own
   * movement, which the spasm module reads as the hand speed (the reported insertion moves in steps as
   * shaft nodes cross the skin, and the tip sticks and slips in a gripping spasm).
   */
  get catheterFedMm(): number {
    return this.cathFedMm;
  }

  /** The radial artery's tone the lumens carry now. */
  get radialSpasm(): number {
    return this.radialSpasmLevel;
  }

  /**
   * The catheter length in the radial artery (mm): the route's radial region (and its loop) between the
   * skin and the catheter tip.
   */
  radialContactMm(): number {
    if (!this.active || this.route === "femoral") return 0;
    const L = this.devices.lumenSet();
    const t = L.access;
    const tip = this.routeNow?.catheterTipS ?? L.routeLength;
    const skin = L.skinS;
    let len = 0;
    for (let i = 1; i < t.n; i++) {
      const reg = t.region[i];
      if (reg !== Region.Radial && reg !== Region.RadialLoop) continue;
      const a = Math.max(skin, t.cum[i - 1]);
      const b = Math.min(tip, t.cum[i]);
      if (b > a) len += b - a;
    }
    return len;
  }

  /** The grip of the radial spasm on the catheter now: axial (N) and torque (N·mm) at the hub. */
  radialGrip(): { axialN: number; torqueNmm: number; contactMm: number } {
    const contactMm = this.radialContactMm();
    if (!(this.radialSpasmLevel > 0) || !(contactMm > 0)) return { axialN: 0, torqueNmm: 0, contactMm };
    const g = { level: this.radialSpasmLevel, contactMm, ...this.gripGeom };
    return { axialN: gripForceN(g), torqueNmm: gripTorqueNmm(g), contactMm };
  }

  /** Prolapses onto the valve within the last PROLAPSE_WINDOW_S. */
  recentProlapses(): number {
    const t = this.t;
    this.prolapseOnsets = this.prolapseOnsets.filter((x) => t - x <= PROLAPSE_WINDOW_S);
    return this.prolapseOnsets.length;
  }

  /**
   * The catheter length inside the patient (mm). From the root the legacy view's (the shaft's nodes past
   * the skin); from the sheath the route arclength from the skin to the tip, which grows smoothly as the
   * catheter is pushed (a shaft node crossing the skin moves the node sum by a whole segment, which the
   * session would read as a withdrawal over the wire).
   */
  private insertedMm(v: LegacyView | null): number {
    if (this.startAt === "sheath") {
      const r = this.routeNow;
      const f = this.devices.frame();
      if (r?.catheterTipS !== null && r?.catheterTipS !== undefined && f?.catheter) {
        // the tip settles and moves with the breathing by about a millimetre: a withdrawal is reported once
        // it has come back MP_INSERTION_HYSTERESIS_MM, so a still or advancing catheter never reads as pulled back
        const raw = this.lengthInside(f.catheter.nodes, f.catheter.count);
        const held = this.insertionHeld;
        this.insertionHeld = held === null || raw > held || raw < held - MP_INSERTION_HYSTERESIS_MM ? raw : held;
        return this.insertionHeld;
      }
    }
    return v?.insertedMm ?? 0;
  }

  private insertionHeld: number | null = null;
  private readonly skinPt = new Float64Array(6);

  /**
   * The length of a device inside the patient (mm): along its nodes (hub → tip) from where it passes the
   * skin to its tip, the skin crossing interpolated within its segment. It follows the device, not the
   * route, so it does not change when the radial loop straightens and the route shortens.
   */
  private lengthInside(nodes: ArrayLike<number>, count: number): number {
    const P = this.skinPt;
    this.devices.lumenSet().routePoint(this.devices.skinS(), P);
    let best = Infinity;
    let k = 0;
    let u = 0;
    for (let i = 1; i < count; i++) {
      const ax = nodes[3 * i - 3], ay = nodes[3 * i - 2], az = nodes[3 * i - 1];
      const dx = nodes[3 * i] - ax, dy = nodes[3 * i + 1] - ay, dz = nodes[3 * i + 2] - az;
      const ll = dx * dx + dy * dy + dz * dz;
      const q = ll > 1e-12 ? Math.max(0, Math.min(1, ((P[0] - ax) * dx + (P[1] - ay) * dy + (P[2] - az) * dz) / ll)) : 0;
      const d = Math.hypot(ax + dx * q - P[0], ay + dy * q - P[1], az + dz * q - P[2]);
      if (d < best) {
        best = d;
        k = i;
        u = q;
      }
    }
    let len = 0;
    for (let i = k; i < count; i++) {
      const l = Math.hypot(nodes[3 * i] - nodes[3 * i - 3], nodes[3 * i + 1] - nodes[3 * i - 2], nodes[3 * i + 2] - nodes[3 * i - 1]);
      len += i === k ? l * (1 - u) : l;
    }
    return Math.max(0, len);
  }

  /** Hub roll and insertion for the table view. */
  tableState(): PhysicsTableState {
    const v = this.view();
    const ins = this.insertedMm(v);
    return {
      insertedMm: { catheter: ins, wire035: Math.max(0, ins + (v?.wireLeadMm ?? 0)) },
      hubRollRad: { catheter: this.hubRoll },
    };
  }

  /** Step cost statistics over the frames kept (or the last `lastN`). */
  costStats(lastN?: number): { frames: number; medianMs: number; p95Ms: number } {
    const xs = lastN ? this.costs.slice(-lastN) : this.costs;
    return { frames: xs.length, medianMs: sortedPct(xs, 50), p95Ms: sortedPct(xs, 95) };
  }

  /** Take a snapshot of the solver at a decision point (resolves with the entry; the session keeps the list). */
  async snapshotAt(reason: string): Promise<PhysicsSnapshotEntry | null> {
    if (!this.active) return null;
    const t = this.t;
    const snap = await this.devices.snapshot();
    return { t, reason, snap };
  }

  // --- torque loss and kinking (diag-catheter-kink) ------------------------------------

  /** The catheter's kink in the newest frame, or null. */
  kink(): KinkReadout | null {
    const f = this.devices.frame();
    return this.active && f?.catheter ? f.catheter.kink ?? null : null;
  }

  /** The hub has turned with little rotation of the tip over the last MP_TNT_WINDOW_S (newest frame). */
  torqueLoss(): boolean {
    const f = this.devices.frame();
    return this.active && !!f?.catheter?.torqueLoss;
  }

  /** What the engine reports of the kinks since the catheter was loaded (newest frame). */
  kinkHistory(): NonNullable<NonNullable<PhysicsFrame["catheter"]>["kinkHistory"]> | null {
    return this.devices.frame()?.catheter?.kinkHistory ?? null;
  }

  /**
   * The kink set-up in the engine, from the newest frame (so a rewind or restore shows what came
   * back); the set-up last sent until a frame carries it, or for at most KINK_SETUP_ECHO_S.
   */
  get kinkSetup(): KinkSetup {
    const f = this.devices.frame();
    const fs = f?.catheter?.kinkSetup;
    if (!fs) return this.localKinkSetup;
    const sent = this.kinkSetupSent;
    if (sent) {
      const l = this.localKinkSetup;
      const echoed = fs.sheathMm === l.sheathMm && fs.undersized === l.undersized && fs.model === l.model;
      if (!echoed && (f === sent.frame || (this.t >= sent.t && this.t - sent.t <= KINK_SETUP_ECHO_S))) return l;
      this.kinkSetupSent = null;
    }
    if (fs.sheathMm !== this.localKinkSetup.sheathMm || fs.undersized !== this.localKinkSetup.undersized || fs.model !== this.localKinkSetup.model) this.localKinkSetup = { ...fs };
    return this.localKinkSetup;
  }

  /** Put the prevention measures in place: the sheath's length inside the body, a catheter 1 Fr smaller than the sheath. */
  setKinkSetup(setup: Partial<KinkSetup>): void {
    if (!this.active) return;
    this.localKinkSetup = { ...this.kinkSetup, ...setup };
    this.kinkSetupSent = { frame: this.devices.frame(), t: this.t };
    this.devices.kinkCommand({ kind: "kink-setup", setup });
  }

  /** A recovery command the engine carries out (its outcome arrives with a later frame: kinkHistory().lastAction). */
  kinkRecover(action: KinkRecoveryAction): void {
    if (!this.active || this.exchange) return;
    this.devices.kinkCommand({ kind: "kink-recover", action });
  }

  /** Hub roll applied by the hands since the catheter was loaded (rad, clockwise +). */
  get hubRollRad(): number {
    return this.hubRoll;
  }

  /**
   * Bring a kinked catheter out through the arteriotomy once its hub has been cut and a sheath advanced
   * over the kinked part, and load a fresh catheter of the same type over the wire (the crew's exchange).
   * Returns false while the kink is not covered (it would catch at the sheath).
   */
  pullOutKinked(): boolean {
    const k = this.kink();
    if (!this.active || this.exchange || (k && !k.sheathed)) return false;
    this.exchangeTo(this.catheterId);
    return true;
  }

  // --- the exchange over the wire ------------------------------------------------------

  /**
   * Change the catheter as the operator does: back the catheter out of the coronary into the
   * ascending aorta, lead with the J wire, withdraw the catheter over the pinned wire, load the new
   * one over it and advance it back up. The wire tip stays in the ascending aorta throughout.
   */
  exchangeTo(id: string): void {
    if (!this.active) return;
    // a kinked catheter changed without covering the kink first (diag-catheter-kink): the crew pulls it
    // out regardless, and the kink's score counts it
    const k = this.kink();
    if (k && !k.sheathed && !this.exchange) this.kinkedExchanges++;
    if (this.exchange) {
      this.exchange.to = id;
      return;
    }
    this.exchange = { to: id, phase: "pullback", since: this.t, moved: 0, sRemoved: 0, minWireTipHeight: Infinity };
  }

  private nextPhase(p: ExchangePhase) {
    const x = this.exchange!;
    x.phase = p;
    x.since = this.t;
    x.moved = 0;
  }

  private stepExchange(dt: number) {
    const x = this.exchange!;
    const f = this.devices.frame();
    const valve = this.model.valvePlaneY;
    if (f?.wire) {
      const w = f.wire;
      const h = w.nodes[3 * (w.count - 1) + 1] - valve;
      x.minWireTipHeight = Math.min(x.minWireTipHeight, h);
    }
    const late = this.t - x.since > EXCHANGE.stepMaxS;
    const c = f?.catheter ?? null;
    switch (x.phase) {
      case "pullback": {
        const h = c ? c.tip[1] - valve : Infinity;
        if (h >= EXCHANGE.clearMm || x.moved >= EXCHANGE.clearMaxMm || late) {
          this.devices.command({ kind: "pin", device: "wire035", on: false });
          if (!f?.wire) this.devices.loadWire(this.wireId, -5);
          this.nextPhase("wire");
          return;
        }
        const mm = EXCHANGE.pullMmS * dt;
        x.moved += mm;
        this.devices.command({ kind: "push", device: "catheter", mm: -mm });
        return;
      }
      case "wire": {
        const lead = this.view()?.wireLeadMm ?? -Infinity;
        if ((f?.wire && lead >= EXCHANGE.wireLeadMm) || late) {
          this.devices.command({ kind: "pin", device: "wire035", on: true });
          this.nextPhase("withdraw");
          return;
        }
        const mm = EXCHANGE.wireMmS * dt;
        this.devices.command({ kind: "push", device: "wire035", mm });
        return;
      }
      case "withdraw": {
        if (x.moved >= EXCHANGE.pullMm || late) {
          x.sRemoved = c ? this.devices.arclength(c.tip) : this.devices.routeLength() - EXCHANGE.pullMm - START_TIP_BACK_MM;
          // the catheter comes off the wire, which stays where it is. The solver cannot yet take a
          // catheter off a wire left inside the patient (engine.ts removeCatheter leaves the wire's
          // bodies undefined), so the wire is taken out with it and put back at once on its own. It is
          // put back straight along the route, so its tip goes where the curled tip was less the J's
          // straightened curve, and never deeper than EXCHANGE.clearMm above the valve plane: the
          // catheter tip plus the wire's lead would overshoot, the lead being measured along a wire
          // that does not follow the route's centre line
          const sWire = f?.wire ? this.devices.arclength(f.wire.tip) : x.sRemoved + Math.max(0, this.view()?.wireLeadMm ?? EXCHANGE.wireLeadMm);
          const sClear = this.devices.deepestArclengthAbove(valve + EXCHANGE.clearMm);
          const sTip = Math.min(sWire - J_STRAIGHT_MM, sClear);
          this.devices.removeWire();
          this.devices.remove("catheter");
          if (this.startAt === "sheath" && !isExchangeLength(this.wireId)) {
            // a standard-length wire cannot stay while a catheter comes off it: it comes out too, and the new
            // catheter goes in from the sheath over it again (diag-route-wire-led-radial)
            x.routeLost = true;
            this.routeAcc.routeLostExchanges++;
          } else this.devices.loadWire(this.wireId, sTip - (this.devices.skinS() - SHEATH_HUB_MM));
          this.nextPhase("out");
          return;
        }
        const mm = EXCHANGE.pullMmS * dt;
        x.moved += mm;
        this.devices.command({ kind: "push", device: "catheter", mm: -mm });
        return;
      }
      case "out": {
        if (this.t - x.since < EXCHANGE.outS) return;
        this.catheterId = x.to;
        this.hubRoll = 0;
        if (x.routeLost) {
          // back at the sheath with the wire leading, as at the start
          this.devices.load("catheter", physicsCatheterId(x.to), { tipS: this.sheathStartS(), facing: LAO_LEFT });
          this.devices.loadWire(this.wireId, ROUTE_START.wireLeadMm);
          this.lastExchangeMinWireTipHeight = x.minWireTipHeight;
          this.exchange = null;
          return;
        }
        this.devices.load("catheter", physicsCatheterId(x.to), { tipS: x.sRemoved, facing: LAO_LEFT });
        // the wire stays where it is: the new catheter slides over it
        this.devices.command({ kind: "pin", device: "wire035", on: true });
        this.nextPhase("in");
        return;
      }
      case "in": {
        const isNew = !!c && c.id === physicsCatheterId(x.to);
        const lead = isNew ? this.view()?.wireLeadMm ?? Infinity : Infinity;
        const done = (isNew && lead <= EXCHANGE.finalLeadMm) || x.moved >= EXCHANGE.pullMm + 60 || (late && x.moved > 0);
        if (done) {
          this.devices.command({ kind: "pin", device: "wire035", on: false });
          this.lastExchangeMinWireTipHeight = x.minWireTipHeight;
          this.exchange = null;
          return;
        }
        const mm = EXCHANGE.pullMmS * dt;
        x.moved += mm;
        this.devices.command({ kind: "push", device: "catheter", mm });
        return;
      }
    }
  }

  // --- from the sheath to the root (diag-route-wire-led-radial) ------------------------

  /** Route arclength of the catheter tip at a sheath start: just out of the sheath's tip (ROUTE_START). */
  sheathStartS(): number {
    const span = this.devices.regionSpan(Region.Sheath);
    return (span ? span[1] : this.devices.skinS() + 100) + ROUTE_START.catheterBeyondSheathMm;
  }

  /** The route mechanics of the newest frame (wire lead, the dissection accumulator, the loop, a stall, a perforation), or null. One object updated in place each frame: read it, do not keep it. */
  routeMechanics(): RouteMechanics | null {
    return this.active ? this.routeNow : null;
  }

  /** Catheter changes in which a standard-length wire came out with the catheter, so the route had to be crossed again. */
  get routeLostExchanges(): number {
    return this.routeAcc.routeLostExchanges;
  }

  /**
   * Change the wire (ROUTE_WIRES): the one in the catheter comes out through the hub and the new one goes
   * in to just inside the catheter tip, where the hand takes it on. False while the crew exchanges the
   * catheter or for an unknown id.
   */
  chooseWire(id: string): boolean {
    if (!this.active || this.exchange || !ROUTE_WIRES.some((w) => w.id === id)) return false;
    this.wireId = id;
    this.devices.removeWire();
    this.devices.loadWire(id, -ROUTE_WIRE_INSIDE_MM);
    this.wireOut = false;
    return true;
  }

  /** Take the wire out through the catheter hub (the catheter stays where it is). */
  removeWireFromCatheter(): void {
    if (!this.active || this.exchange) return;
    this.devices.removeWire();
    this.wireOut = true;
  }

  /**
   * Balloon-assisted tracking (Brilakis 5.3 as the module text gives it: a compliant balloon 1:1 with the
   * catheter, half out of its tip, at 3–6 atm, advanced as a unit): set up at `atm`, or taken down (null).
   * It needs a wire beyond the catheter tip to ride on.
   */
  setBat(atm: number | null): boolean {
    if (!this.active) return false;
    if (atm === null) {
      this.bat = null;
      return true;
    }
    const r = this.routeNow;
    if (!r || r.wireLeadMm === null || r.wireLeadMm <= 0) return false;
    this.bat = { atm };
    return true;
  }

  /** Balloon-assisted tracking that blunts the catheter's leading edge: set up within MP_ROUTE_LED.batAtm. */
  get batEffective(): boolean {
    const b = this.bat;
    return !!b && b.atm >= MP_ROUTE_LED.batAtm[0] && b.atm <= MP_ROUTE_LED.batAtm[1];
  }

  /** How far the radial loop has been straightened (0 the turn … 1 straight). */
  get radialLoopStraighten(): number {
    return this.loopStraighten;
  }

  /** The newest frame's route mechanics (called once per new frame from step). */
  private updateRoute(f: PhysicsFrame): void {
    const A = this.routeAcc;
    const dt = A.lastT === null ? 0 : Math.max(0, Math.min(0.25, f.t - A.lastT));
    A.lastT = f.t;
    const pushC = this.pushCathMm;
    const pushW = this.pushWireMm;
    this.pushCathMm = 0;
    this.pushWireMm = 0;
    const L = this.devices.lumenSet();
    const c = f.catheter;
    const w = f.wire;
    const view = this.view();
    const cTip = c ? this.devices.arclength(c.tip) : null;
    const wTip = w ? this.devices.arclength(w.tip) : null;
    const cRegion = c ? this.regionAt(c.tip) : null;
    const wRegion = w ? this.regionAt(w.tip) : null;
    const lead = w && c ? view?.wireLeadMm ?? 0 : null;
    const inRoute = !!c && cTip !== null && cTip < L.routeLength - MP_ROUTE_LED.rootMarginMm && cRegion !== null && cRegion !== Region.Root && cRegion !== Region.Ascending;
    // the catheter advanced in the route with its tip beyond the wire tip (or with no wire in it)
    const unled = lead === null || lead < -MP_ROUTE_LED.notLeadingMm;
    const notLeading = inRoute && pushC > 0 && unled;
    if (notLeading) {
      A.notLeadingAdvanceMm += pushC;
      A.notLeadingSince ??= f.t;
      A.notLeadingAt = f.t;
    } else if (!unled || !inRoute) A.notLeadingSince = null;
    // the dissection accumulator: wall load on the catheter beyond the wire tip while it is pushed in the route
    if (inRoute && c && (pushC > 0 || this.t - this.lastPushT <= PUSHING_HOLD_S) && unled) {
      const distal = lead === null ? MP_ROUTE_LED.noWireDistalMm : -lead;
      let acc = 0;
      let load = 0;
      for (let i = c.count - 1; i >= 1 && acc <= distal; i--) {
        load += c.contactForce[i] ?? 0;
        acc += Math.hypot(c.nodes[3 * i] - c.nodes[3 * i - 3], c.nodes[3 * i + 1] - c.nodes[3 * i - 2], c.nodes[3 * i + 2] - c.nodes[3 * i - 1]);
      }
      A.dissectionRisk += load * dt;
      if (!A.dissection && A.dissectionRisk >= MP_ROUTE_LED.dissectionNs && cTip !== null) A.dissection = { region: cRegion ?? Region.Iliac, s: cTip, t: f.t };
    }
    // the wire tip in the ventricle (through the valve): it touches the wall and provokes ectopic beats.
    // With the catheter tip itself in the ventricle the patient engine already counts the contact (its
    // TipInput.lvContact), so the wire's contact is reported only while the catheter is not there.
    const wireInLv = !!w && this.inLv(w.tip);
    const catheterInLv = !!c && f.engagement?.kind === "in-lv";
    // a stall: the hand pushes on, the tip does not follow
    const stalled = this.stallOf(f, pushC, pushW, cTip, wTip);
    // the radial loop
    const span = L.radialLoopSpan;
    let loop: RouteMechanics["loop"] = null;
    if (span) {
      const near = (s: number | null) => s !== null && s >= span[0] - MP_ROUTE_LED.loopNearMm && s <= span[1] + 2;
      // balloon-assisted tracking: the assembly straightens the loop as it is advanced through it
      if (this.batEffective && pushC > 0 && near(cTip) && this.loopStraighten < 1) {
        const x = this.loopStraighten + pushC * MP_ROUTE_LED.batStraightenPerMm;
        this.loopStraighten = x > 1 - 1e-9 ? 1 : x;
        // the lumens are rebuilt only when the straightening has moved a step on, and always at straight
        const step = MP_ROUTE_LED.loopSendStep;
        const q = this.loopStraighten >= 1 - step / 2 ? 1 : Math.round(this.loopStraighten / step) * step;
        if (q !== this.loopSent) {
          this.loopSent = q;
          this.devices.setLoopStraighten(q);
        }
      }
      const sp = L.radialLoopSpan ?? span;
      loop = this.loopBuf;
      loop.span[0] = sp[0];
      loop.span[1] = sp[1];
      loop.straighten = this.loopStraighten;
      loop.wireAcross = wTip !== null && wTip > sp[1];
      loop.catheterAcross = cTip !== null && cTip > sp[1];
      loop.stalled = stalled && stalled.atLoop ? stalled.device : null;
      loop.stallWire = stalled && stalled.atLoop && stalled.device === "wire" ? (w?.id ?? this.wireId) : null;
      if (stalled?.atLoop) A.loopStalls[stalled.device]++;
    }
    // forcing against a stall in the forearm perforates a branch; a catheter advanced across it seals it
    const arm = this.route !== "femoral";
    if (stalled && arm && !A.perforation) {
      const ax = stalled.device === "catheter" ? c?.reaction.axial ?? 0 : w?.reaction.axial ?? 0;
      if (ax > MP_ROUTE_LED.forceN) A.forcingNs += (ax - MP_ROUTE_LED.forceN) * dt;
      const sAt = stalled.device === "catheter" ? cTip : wTip;
      const reg = stalled.device === "catheter" ? cRegion : wRegion;
      if (A.forcingNs >= MP_ROUTE_LED.perforationNs && sAt !== null && (reg === Region.Radial || reg === Region.RadialLoop || reg === Region.RadialSpasm || reg === Region.Brachial)) A.perforation = { s: sAt, t: f.t, sealed: false, region: reg };
    }
    if (A.perforation && !A.perforation.sealed && cTip !== null && cTip >= A.perforation.s + MP_ROUTE_LED.sealMm) A.perforation.sealed = true;
    const R = this.routeBuf;
    R.t = f.t;
    R.catheterTipS = cTip;
    R.wireTipS = wTip;
    R.wireLeadMm = lead;
    R.catheterRegion = cRegion;
    R.wireRegion = wRegion;
    R.catheterInRoute = inRoute;
    R.notLeading = notLeading;
    R.lastNotLeadingT = A.notLeadingAt;
    R.notLeadingAdvanceMm = A.notLeadingAdvanceMm;
    R.dissectionRisk = A.dissectionRisk;
    R.dissection = A.dissection;
    R.wireInLv = wireInLv;
    R.lvContact = wireInLv && !catheterInLv;
    R.loop = loop;
    R.stalled = stalled;
    if (A.perforation) {
      const pf = this.perfBuf;
      pf.s = A.perforation.s;
      pf.t = A.perforation.t;
      pf.sealed = A.perforation.sealed;
      pf.region = A.perforation.region;
      R.perforation = pf;
    } else R.perforation = null;
    R.forcingNs = A.forcingNs;
    R.wireId = w?.id ?? null;
    if (c) {
      this.cTipBuf[0] = c.tip[0];
      this.cTipBuf[1] = c.tip[1];
      this.cTipBuf[2] = c.tip[2];
      R.catheterTip = this.cTipBuf;
    } else R.catheterTip = null;
    if (w) {
      this.wTipBuf[0] = w.tip[0];
      this.wTipBuf[1] = w.tip[1];
      this.wTipBuf[2] = w.tip[2];
      R.wireTip = this.wTipBuf;
    } else R.wireTip = null;
    this.routeNow = R;
  }

  /** The access route's region at a point (the lumen sample nearest it). */
  private regionAt(p: ArrayLike<number>): number {
    const L = this.devices.lumenSet();
    queryTube(L.access, p[0], p[1], p[2], 0, -1, this.routeHit);
    return this.routeHit.region;
  }

  /** Whether a point lies in the left ventricular cavity (below the valve, inside the LV lumen). */
  private inLv(p: ArrayLike<number>): boolean {
    if (p[1] > this.model.valvePlaneY - MP_ROUTE_LED.lvBelowValveMm) return false;
    const L = this.devices.lumenSet();
    L.query(p[0], p[1], p[2], 0, { crossedValve: true }, null, 0, this.routeHit);
    return this.routeHit.lumen === LUMEN_LV && this.routeHit.slack > -1;
  }

  private readonly routeHit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };

  /**
   * A stall over the last MP_ROUTE_LED.stallWindowS: the hand pushed the catheter or the wire at least
   * stallPushMm while its tip moved on less than stallProgressMm along the route. atLoop: the tip lies at
   * the radial loop (within loopNearMm before its first sample, or in it).
   */
  private stallOf(f: PhysicsFrame, pushC: number, pushW: number, cTip: number | null, wTip: number | null): RouteMechanics["stalled"] {
    const A = this.routeAcc;
    A.histC.keep(f.t, cTip, pushC);
    // the wire stalls on its own only when it leads; inside the catheter it moves with it
    const lead = this.view()?.wireLeadMm ?? 0;
    A.histW.keep(f.t, f.wire && lead > 0 ? wTip : null, pushW);
    const span = this.devices.lumenSet().radialLoopSpan;
    const atLoop = (s: number | null) => !!span && s !== null && s >= span[0] - MP_ROUTE_LED.loopNearMm && s <= span[1] + 2;
    const out = this.stallBuf;
    if (A.histW.stalled() && wTip !== null) {
      out.device = "wire";
      out.s = wTip;
      out.atLoop = atLoop(wTip);
      return out;
    }
    if (A.histC.stalled() && cTip !== null) {
      out.device = "catheter";
      out.s = cTip;
      out.atLoop = atLoop(cTip);
      return out;
    }
    return null;
  }

  // --- scripts ------------------------------------------------------------------------

  /** Run a scripted procedure synchronously, advancing the lab with `advance(seconds)` between its steps. */
  runScript<T>(script: Generator<number, T>, advance: (seconds: number) => void): T {
    let r = script.next();
    while (!r.done) {
      advance(r.value);
      r = script.next();
    }
    return r.value;
  }

  /** The same, asynchronously (the browser: worker frames arrive between the steps). */
  async runScriptAsync<T>(script: Generator<number, T>, advance: (seconds: number) => void | Promise<void>): Promise<T> {
    let r = script.next();
    while (!r.done) {
      await advance(r.value);
      r = script.next();
    }
    return r.value;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.devices.dispose();
  }
}

/**
 * The physics shape for a store catheter id: the store and the solver share the ids (the pigtail is PIG
 * in both), and a side-hole variant moves like its base curve (src/data/catheters.ts sideHoleBase), so
 * this module's own comparisons (the exchange's "is this the new catheter" check, the cost bench) treat
 * it as its base.
 */
export function physicsCatheterId(id: string): string {
  return sideHoleBase(id) ?? id;
}

// ---------------------------------------------------------------------------
// Scripted procedures (hand commands and the classifier only)
// ---------------------------------------------------------------------------

/** What a script needs from the lab: the newest frame, the bridged engagement, the hands, the anatomy. */
export interface ScriptTarget {
  frame(): PhysicsFrame | null;
  view(): LegacyView | null;
  command(c: HandCommand): void;
  readonly model: AnatomyModel;
  readonly devices: Pick<RodPhysicsDevices, "rootRadius">;
}

const tipOf = (t: ScriptTarget): [number, number, number] | null => t.frame()?.catheter?.tip ?? null;
const kindOf = (t: ScriptTarget) => t.view()?.engagement.kind ?? null;
const wrapPi = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

/** Advance the catheter with its wire until the tip is in the root (src/physics/scenarios.ts advanceToRoot). */
export function* advanceToRootScript(t: ScriptTarget, stepMm = 6, maxSteps = 80): Generator<number, boolean> {
  for (let i = 0; i < maxSteps; i++) {
    const p = tipOf(t);
    if (p && p[1] < 22 && Math.hypot(p[0], p[2]) < t.devices.rootRadius() + 4) return true;
    t.command({ kind: "push", device: "catheter", mm: stepMm });
    yield 0.1;
  }
  return false;
}

/** Pull the J wire back through the catheter and let the curve form (scenarios.ts withdrawWire). */
export function* withdrawWireScript(t: ScriptTarget, settle = 2.5): Generator<number, void> {
  const v = t.view();
  if (!t.frame()?.wire) return;
  t.command({ kind: "push", device: "wire035", mm: -(Math.max(0, v?.wireLeadMm ?? 0) + 160) });
  yield settle;
}

/**
 * Standard Judkins left technique (src/physics/manoeuvres.ts judkinsLeftTechnique): every 0.5 s a small
 * height correction towards the usual level of the left main and a small turn towards its usual
 * direction, watching the tip on fluoroscopy. Returns true once the bridged engagement is selective.
 */
export function* judkinsLeftScript(t: ScriptTarget, steps = 24): Generator<number, boolean> {
  const lm = t.model.lm;
  const target = lm.pos.y - 1;
  const azLm = Math.atan2(lm.pos.z, lm.pos.x);
  for (let i = 0; i < steps; i++) {
    if (kindOf(t) === "selective-lm") return true;
    const tip = tipOf(t);
    if (!tip) {
      yield 0.5;
      continue;
    }
    const err = tip[1] - target;
    const push = Math.abs(err) < 1 ? 1 : Math.max(-2, Math.min(2, err));
    const dAz = wrapPi(azLm - Math.atan2(tip[2], tip[0]));
    if (Math.abs(dAz) > (15 * Math.PI) / 180) t.command({ kind: "torque", device: "catheter", rad: 0.1 * Math.sign(dAz) });
    t.command({ kind: "push", device: "catheter", mm: push });
    yield 0.5;
  }
  return kindOf(t) === "selective-lm";
}

/**
 * Judkins right technique (manoeuvres.ts jr4Technique): bring the tip up to the ostial level, then
 * gentle clockwise torque (0.15 rad per 0.5 s) while holding the expected ostial height.
 */
export function* judkinsRightScript(t: ScriptTarget, steps = 22): Generator<number, boolean> {
  for (let i = 0; i < 40; i++) {
    const p = tipOf(t);
    if (p && p[1] >= 12) break;
    t.command({ kind: "push", device: "catheter", mm: -1.5 });
    yield 0.2;
  }
  const target = t.model.rca.pos.y - 2;
  for (let i = 0; i < steps; i++) {
    if (kindOf(t) === "selective-rca") return true;
    const y = tipOf(t)?.[1] ?? target;
    const push = Math.max(-1.5, Math.min(1.5, y - target));
    t.command({ kind: "torque", device: "catheter", rad: 0.15 });
    if (push) t.command({ kind: "push", device: "catheter", mm: push });
    yield 0.5;
  }
  return kindOf(t) === "selective-rca";
}

/**
 * The error the conus scenario teaches: a right catheter turned too far anteriorly and held high
 * enough to miss the right coronary ostium, then advanced until it enters the conus branch, and kept
 * there for `holdS` (small advances whenever the tip slips back to the mouth). A tip that drops into
 * the right coronary on the way is backed out first. Returns true when the tip is in the conus at the
 * end.
 */
export function* conusScript(t: ScriptTarget, steps = 40, holdS = 0): Generator<number, boolean> {
  for (let i = 0; i < 40; i++) {
    const p = tipOf(t);
    if (p && p[1] >= 12) break;
    t.command({ kind: "push", device: "catheter", mm: -1.5 });
    yield 0.2;
  }
  const c = t.model.conus;
  const target = c.pos.y + 0.5;
  const az = Math.atan2(c.pos.z, c.pos.x);
  const inConusNow = () => !!t.view()?.engagement.conus;
  let entered = false;
  for (let i = 0; i < steps && !entered; i++) {
    if (inConusNow()) {
      entered = true;
      break;
    }
    const tip = tipOf(t);
    if (!tip) {
      yield 0.5;
      continue;
    }
    if (t.frame()?.engagement?.vessel === "RCA") {
      t.command({ kind: "push", device: "catheter", mm: -3 });
      yield 0.5;
      continue;
    }
    const dAz = wrapPi(az - Math.atan2(tip[2], tip[0]));
    if (Math.abs(dAz) > 0.1) t.command({ kind: "torque", device: "catheter", rad: 0.15 * Math.sign(dAz) });
    t.command({ kind: "push", device: "catheter", mm: Math.abs(dAz) < 0.15 ? 0.8 : Math.max(-1.5, Math.min(1.5, tip[1] - target)) });
    yield 0.5;
  }
  if (!entered) return false;
  for (let h = 0; h < holdS - 1e-9; h += 0.25) {
    if (!inConusNow()) t.command({ kind: "push", device: "catheter", mm: 0.5 });
    yield 0.25;
  }
  return inConusNow();
}

/** From the start over the wire: to the root, the wire out, then the technique for the side. */
export function* engageScript(t: ScriptTarget, side: "left" | "right"): Generator<number, boolean> {
  for (let i = 0; i < 60 && !t.frame(); i++) yield 1 / 30; // the first frame (a worker answers a step later)
  const lead = t.view()?.wireLeadMm ?? 0;
  const tip = tipOf(t);
  const inRoot = !!tip && tip[1] < 22 && Math.hypot(tip[0], tip[2]) < t.devices.rootRadius() + 4;
  if (!inRoot || (t.frame()?.wire && lead > 0)) {
    // up to the root first (with the wire leading when it is out), then the wire back into the catheter
    const ok = yield* advanceToRootScript(t);
    if (!ok) return false;
    if (t.frame()?.wire && (t.view()?.wireLeadMm ?? 0) > 0) yield* withdrawWireScript(t);
  }
  const ok = side === "left" ? yield* judkinsLeftScript(t) : yield* judkinsRightScript(t);
  if (ok) yield* easeBackScript(t, side);
  return ok;
}

/**
 * Once seated, ease the catheter back a little at a time while the tip is pressed into the vessel
 * (deeper than 4 mm, or the classifier's damping risk above one half), as an operator does when
 * aspiration gives no blood return, stopping while the seat is still selective.
 */
export function* easeBackScript(t: ScriptTarget, side: "left" | "right", steps = 10): Generator<number, void> {
  const sel = side === "left" ? "selective-lm" : "selective-rca";
  for (let i = 0; i < steps; i++) {
    yield 0.5;
    const e = t.frame()?.engagement;
    if (!e || kindOf(t) !== sel) return;
    if (e.depthMm <= 4 && e.dampingRisk <= 0.5) return;
    t.command({ kind: "push", device: "catheter", mm: -0.7 });
  }
}

// ---------------------------------------------------------------------------
// 3. The setting and why the simple model is in use
// ---------------------------------------------------------------------------

export type CatheterMechanics = "rod" | "simple";

const SETTINGS_KEY = "cathmaster.catheterMechanics";

function readChoice(): CatheterMechanics | null {
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(SETTINGS_KEY) : null;
    return v === "rod" || v === "simple" ? v : null;
  } catch {
    return null;
  }
}

interface PhysicsSettingsState {
  /** the learner's choice in Settings, or null for the default (ROD_DEFAULT_ON) */
  choice: CatheterMechanics | null;
  /** the last automatic fallback in this page (reason, wall time) */
  fallback: { reason: string; at: number } | null;
  setChoice: (c: CatheterMechanics | null) => void;
  noteFallback: (reason: string | null) => void;
}

export const usePhysicsSettings = create<PhysicsSettingsState>((set) => ({
  choice: readChoice(),
  fallback: null,
  setChoice: (c) => {
    try {
      if (typeof localStorage !== "undefined") {
        if (c) localStorage.setItem(SETTINGS_KEY, c);
        else localStorage.removeItem(SETTINGS_KEY);
      }
    } catch {
      // storage unavailable: the choice lasts for this page
    }
    set({ choice: c, fallback: null });
  },
  noteFallback: (reason) => set({ fallback: reason ? { reason, at: Date.now() } : null }),
}));

const ms = (x: number) => `${x.toFixed(1)} ms`;

/** The default's reason when the rod physics is off by default. */
export function defaultOffReason(measured: MeasuredCost | null = MEASURED_COST): string {
  if (!measured) return `The rod solver's step cost has not been measured on this machine yet, so the simple model is the default (the rod mechanics needs a median step under ${COST_RULE.medianMs} ms and a 95th centile under ${COST_RULE.p95Ms} ms).`;
  if (costUnderThresholds(measured) && !(measured.rendererPx >= COST_RULE.rendererPx))
    return `The rod solver's step cost (median ${ms(measured.medianMs)}, 95th centile ${ms(measured.p95Ms)}) was measured with the image at ${Math.round(measured.rendererPx)} px; the default needs a measurement with the image at ${COST_RULE.rendererPx} px or more, so the simple model is the default until then.`;
  return `The rod solver's measured step cost (median ${ms(measured.medianMs)}, 95th centile ${ms(measured.p95Ms)}) is above the threshold (median under ${COST_RULE.medianMs} ms, 95th centile under ${COST_RULE.p95Ms} ms), so the simple model is the default.`;
}

export interface PhysicsMode {
  on: boolean;
  /** why the simple model is in use (null when the rod mechanics runs, or the learner chose the simple model) */
  reason: string | null;
}

/**
 * Whether the rod mechanics runs: the learner's choice, else the default rule; never without a
 * worker in the browser (the solver would block the image), unless `inThread` (tests) is allowed.
 */
export function resolvePhysicsMode(o: {
  choice?: CatheterMechanics | null;
  defaultOn?: boolean;
  measured?: MeasuredCost | null;
  hasWorker?: boolean;
  inThread?: boolean;
  registered?: boolean;
  catheterId?: string;
} = {}): PhysicsMode {
  const choice = o.choice === undefined ? usePhysicsSettings.getState().choice : o.choice;
  const defaultOn = o.defaultOn ?? (o.measured !== undefined ? costMeetsRule(o.measured) : ROD_DEFAULT_ON);
  if (choice === "simple") return { on: false, reason: null };
  if (choice !== "rod" && !defaultOn) return { on: false, reason: defaultOffReason(o.measured === undefined ? MEASURED_COST : o.measured) };
  if (o.registered === false) return { on: false, reason: "No rod mechanics implementation is registered in this build." };
  const hasWorker = o.hasWorker ?? typeof Worker !== "undefined";
  if (!hasWorker && !o.inThread) return { on: false, reason: "This browser cannot run the rod solver in a background worker, so the lab uses the simple model." };
  if (o.catheterId && !DiagnosticPhysics.supports(o.catheterId)) return { on: false, reason: `The rod solver has no shape for the ${o.catheterId} catheter, so the lab uses the simple model.` };
  return { on: true, reason: null };
}

/** The line the Settings screen shows under the toggle. */
export function physicsStatusText(s: Pick<PhysicsSettingsState, "choice" | "fallback"> = usePhysicsSettings.getState()): string {
  if (s.fallback) return `In use: the simple model. ${s.fallback.reason}`;
  if (s.choice === "simple") return "In use: the simple model (chosen here).";
  const m = resolvePhysicsMode({ choice: s.choice });
  return m.on ? "In use: rod mechanics." : `In use: the simple model. ${m.reason ?? ""}`.trim();
}

// ---------------------------------------------------------------------------
// Scenarios that need the rod mechanics (src/content/practice/diag-rod-physics.launch.ts)
// ---------------------------------------------------------------------------

/**
 * The two scenarios this package's practice links open. They are plain scenario data in the
 * diagnostic registry's shape; the lab session finds them through rodScenarioById when the registry
 * (src/simulation/diagnosticScenarios/) has no scenario of that id. No dose, threshold or device
 * dimension is stated; the drugs carry their timing only.
 */
export const ROD_SCENARIOS: readonly DiagScenario[] = [
  {
    id: "diag-lm-fold-over-j-wire",
    title: "Left main over a looped J wire",
    caseName: "Exertional angina, femoral study",
    indication: "SA",
    brief:
      "A 58-year-old man with exertional angina is having diagnostic angiography from the right femoral artery. The left catheter is in the aortic arch over the J wire.",
    lessonIds: ["pm-engaging-left", "pm-engaging-fail"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Exertional angina, femoral study" },
    events: [],
    chart: {
      ageY: 58,
      sex: "M",
      heightCm: 176,
      weightKg: 84,
      egfr: 82,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "fold", text: "Left main engaged coaxially with a free trace without forcing the catheter.", lessonId: "pm-engaging-left" },
      { id: "right-cusp", text: "A tip pushed down into the right cusp corrected by repositioning, not by advancing.", lessonId: "pm-engaging-left" },
    ],
  },
  {
    id: "diag-rca-dive-and-conus",
    title: "Dominant right coronary: the dive and the conus",
    caseName: "Chest pain on exertion, femoral study",
    indication: "SA",
    brief:
      "A 63-year-old woman with chest pain on exertion is having diagnostic angiography from the right femoral artery. Engage the right coronary artery.",
    lessonIds: ["pm-engaging-rca", "pm-engaging-fail"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Chest pain on exertion, femoral study" },
    events: [],
    chart: {
      ageY: 63,
      sex: "F",
      heightCm: 162,
      weightKg: 70,
      egfr: 76,
      echo: { lvef: 58 },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "no-injection", text: "No injection into a deep, damped or conus position.", lessonId: "pm-engaging-rca" },
      { id: "shape", text: "Right coronary engaged with a suitable shape after the ostium is located.", lessonId: "pm-engaging-rca" },
    ],
  },
];

/** Where a scenario opens (its startAt: the diagnostic registry, then ROD_SCENARIOS), the root when it has none or for a free case. */
export function scenarioStartAt(scenarioId: string | undefined): "root" | "sheath" {
  if (!scenarioId) return "root";
  return (diagScenarioById(scenarioId) ?? rodScenarioById(scenarioId))?.startAt ?? "root";
}

/** One of ROD_SCENARIOS by id. */
export function rodScenarioById(id: string): DiagScenario | undefined {
  return ROD_SCENARIOS.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Torque loss and kinking in the diagnostic lab (diag-catheter-kink)
//
// The engine (src/physics/engine.ts) stores twist in a tortuous segment, latches a kink and undoes it;
// here the lab uses it: the scenario start states, the scripted over-torque, the table-side recovery
// (KinkControl, the 'kink' capability the KinkTab drives), the escalation's score, the refusal of an
// injection through a closed kink (the syringe will not push), and the session module that raises
// catheter-kink and torque-not-transmitted for the tips. Every number is a MODEL PARAMETER; the order
// of the escalation and the 3-4 atm, 10, 25 and 45 cm figures are the module text's (eq-sheaths-guides,
// pm-engaging-torque: Brilakis 5.4, 5.7.4.1, 30.1.3).
// ---------------------------------------------------------------------------

/** The kink scenarios of src/simulation/diagnosticScenarios/kink.ts. */
export const KINK_SCENARIO_IDS = {
  iliac: "diag-kink-tortuous-iliac",
  subclavian: "diag-kink-subclavian",
  forearm: "diag-kink-radial-forearm",
} as const;

/**
 * Scenario start states with a kink already in the shaft: the radial forearm case opens with a kink
 * pulled back into the forearm (below the brachial artery), too tight for the wire to pass or for
 * untwisting alone to undo (MP_KINK_WIRE_PASS_MAX, MP_KINK_UNTWIST_MAX in engine.ts), so that the cuff
 * on the upper arm is the step that works. Severity MODEL PARAMETER.
 */
export const KINK_STARTS: Readonly<Record<string, { region: number; severity: number }>> = {
  [KINK_SCENARIO_IDS.forearm]: { region: Region.Radial, severity: 0.85 },
};

/** The kink start state for a scenario id, or null. */
export function kinkStartFor(scenarioId: string | undefined): { region: number; severity: number } | null {
  return (scenarioId && KINK_STARTS[scenarioId]) || null;
}

/** A wire fed back into a kinked catheter goes in quickly to this far short of the kink (mm); the hand then has to pass it. MODEL PARAMETER. */
export const KINK_WIRE_FEED_MM = 40;
/** The table-side "pass a 0.035 in wire" advances the wire this far (mm). MODEL PARAMETER. */
export const KINK_WIRE_PASS_MM = 90;
/**
 * The table-side "untwist" turns the hub gently back this far against the direction it was turned (rad,
 * half a turn per press; the module text's "rotate gently in the opposite direction"). Turning back much
 * further stores twist the other way and can kink the shaft again. MODEL PARAMETER.
 */
export const KINK_UNTWIST_TURN_RAD = Math.PI;
/** Lab seconds after untwisting or passing the wire at which the operator judges the result. MODEL PARAMETER. */
export const KINK_OBSERVE_S = 2.5;
/** Seconds a set-up sent to the engine is shown before the frames' own set-up is trusted again (one frame's latency is far shorter). */
const KINK_SETUP_ECHO_S = 1;

/** A kink at least this tight (severity, 0..1) closes the lumen to an injection: the syringe will not push. MODEL PARAMETER. */
export const MP_KINK_INJECT_REFUSE = 0.5;
/** Seconds torque-not-transmitted stays raised after the read-out last reported it. MODEL PARAMETER. */
export const MP_TNT_HOLD_S = 10;
/** Seconds catheter-kink is held after each report while the kink exists (it is cleared once the kink is undone). MODEL PARAMETER. */
export const MP_KINK_EVENT_HOLD_S = 1;

/** Three one-way turns at the hub (6π rad) over `seconds`, in steps of 0.1 s: the over-torque the scenarios warn against. */
export function* overTorqueScript(t: Pick<ScriptTarget, "command">, turns = 3, seconds = 6, sign: 1 | -1 = 1): Generator<number, void> {
  const n = Math.max(1, Math.round(seconds / 0.1));
  for (let i = 0; i < n; i++) {
    t.command({ kind: "torque", device: "catheter", rad: (sign * turns * 2 * Math.PI) / n });
    yield 0.1;
  }
}

/**
 * What the screening step records. The lab's field stays over the chest (src/simulation/imaging/carm.ts
 * TABLE_PARAMS), so the shaft in the forearm, the subclavian or the iliac is not drawn; the text says
 * so rather than claim the whole catheter is on the image.
 */
export const KINK_SCREEN_OBSERVED = "Fluoroscopy held along the catheter from the sheath to the tip. The image in this lab covers the chest only, so the shaft lower down is not shown.";

/** The recovery steps the table-side controls offer, after screening the whole catheter. */
export const KINK_STEPS = ["screen", "untwist", "wire", "snare", "cuff", "pressurise", "cut-sheath", "pull-out"] as const;
export type KinkStep = (typeof KINK_STEPS)[number];

/**
 * Each step's place in Brilakis's escalation (eq-sheaths-guides, 'A kinked guide: Brilakis's escalation
 * (5.7.4.1)'; pm-engaging-torque): screen the whole catheter first (5.4.3); 1 untwist and pass a wire;
 * 2 hold the tip from a second access (a snare) or, for a radial kink below the brachial artery, with a
 * cuff on the upper arm; 3 pressurise the lumen (3-4 atm); 4 cut the hub and cover the kink with a
 * sheath; 5 bring it out through the arteriotomy.
 */
export const KINK_ESCALATION: Readonly<Record<KinkStep, number>> = {
  screen: 0,
  untwist: 1,
  wire: 1,
  snare: 2,
  cuff: 2,
  pressurise: 3,
  "cut-sheath": 4,
  "pull-out": 5,
};

/** One step the operator took, with what they would see or feel (null until it is known). */
export interface KinkStepEntry {
  step: KinkStep;
  /** lab time, s */
  t: number;
  observed: string | null;
  /** whether a kink was present when it was taken (for the debrief, never shown live) */
  kinked: boolean;
}

/**
 * How the recovery went, for the debrief. inOrder: no step of a later rank of KINK_ESCALATION came
 * before one of an earlier rank, except that untwisting and passing the wire again with the tip held
 * (after a snare or a cuff) belong to step 2 ("snare the guide tip so the segment can be straightened
 * while you untwist").
 */
export interface KinkScore {
  /** kinks latched in this case */
  kinks: number;
  steps: KinkStep[];
  /** the whole catheter was screened before the first recovery step */
  screenedFirst: boolean;
  /** the recovery steps taken followed the escalation's order (no step of a later rank before an earlier one) */
  inOrder: boolean;
  /** injections attempted through a closed kink (refused: the syringe would not push) */
  injectionsThroughKink: number;
  /** the kink was undone or the kinked catheter removed */
  recovered: boolean;
  /** catheter changes made with the kink still uncovered (the crew pulled it out through the arteriotomy regardless) */
  removedUncovered: number;
}

/** What the kink controls need from the lab (DiagnosticLabSession satisfies it structurally). */
export interface KinkHost {
  readonly physics: DiagnosticPhysics | null;
  /** lab time, s */
  wall(): number;
  readonly pedal: PedalState;
}

/**
 * The engine's outcome of a recovery command, as the operator finds it. No text says whether the
 * shaft is kinked: each says what the step did.
 */
export function kinkOutcomeText(o: KinkOutcome, action?: KinkRecoveryAction): string {
  switch (o) {
    case "held":
      return action === "cuff" ? "The cuff on the upper arm is inflated around the catheter." : "The catheter tip is held still.";
    case "not-below-brachial":
      return "A cuff on the upper arm does not hold a catheter from this access.";
    case "unwound":
      return "Under pressure the shaft straightens and the trace returns.";
    case "unchanged":
      return "Under pressure nothing changes.";
    case "sheathed":
      return "The hub is cut and a sheath is advanced over the catheter.";
    case "released":
      return "The tip is let go.";
    case "no-catheter":
      return "There is no catheter in the patient.";
  }
}

/**
 * The table-side kink recovery of one lab session: screening, the prevention measures, the recovery
 * steps in Brilakis's order and their score. It never reports whether the shaft is kinked: each step
 * reports what the operator would see or feel.
 */
export class KinkControl {
  screenedAt: number | null = null;
  readonly steps: KinkStepEntry[] = [];
  injectionsThroughKink = 0;
  /** lab time of the last refused injection (the syringe would not push) */
  lastRefusalAt: number | null = null;
  private pending: { entry: KinkStepEntry; kind: "untwist" | "wire" | "engine" | "pull-out"; seq: number; at: number }[] = [];
  private kinksSeen = 0;
  private lastKinked = false;
  private recovered = false;
  private version = 0;

  constructor(readonly host: KinkHost) {}

  /** The rod mechanics is running (the kink model exists only there). */
  available(): boolean {
    return !!this.host.physics?.active;
  }

  /** bumped whenever anything the controls show changes */
  rev(): number {
    return this.version;
  }

  /** Screening needs the beam on (fluoroscopy held while panning along the shaft). */
  canScreen(): boolean {
    return this.available() && !!this.host.pedal.fluoro;
  }

  get screened(): boolean {
    return this.screenedAt !== null;
  }

  /**
   * Screen the whole length of the catheter (with fluoroscopy on): the recovery steps become available.
   * The lab's image does not yet follow the shaft below the chest (the table's travel keeps the field
   * over the heart), so the record says what was done and makes no claim about what the image showed.
   */
  screen(): boolean {
    if (!this.canScreen()) return false;
    this.screenedAt = this.host.wall();
    this.record("screen", KINK_SCREEN_OBSERVED);
    return true;
  }

  setup(): KinkSetup {
    return this.host.physics?.kinkSetup ?? { ...DEFAULT_KINK_SETUP };
  }

  /** The sheath in place (its length inside the body, mm: 100, 250 or 450). */
  setSheath(mm: number): void {
    this.host.physics?.setKinkSetup({ sheathMm: mm });
    this.version++;
  }

  /** A catheter 1 Fr smaller than the sheath. */
  setUndersized(on: boolean): void {
    this.host.physics?.setKinkSetup({ undersized: on });
    this.version++;
  }

  /** Untwist: turn the hub back, against the way it has been turned since the catheter was loaded. */
  untwist(): void {
    const p = this.host.physics;
    if (!p?.active || !this.screened) return;
    const dir = p.hubRollRad >= 0 ? -1 : 1;
    p.command({ kind: "torque", device: "catheter", rad: dir * KINK_UNTWIST_TURN_RAD });
    this.track("untwist", "untwist");
  }

  /** Pass a 0.035 in wire up the catheter (fed back in through the hub when it is out). */
  passWire(): void {
    const p = this.host.physics;
    if (!p?.active || !this.screened) return;
    p.command({ kind: "push", device: "wire035", mm: KINK_WIRE_PASS_MM });
    this.track("wire", "wire");
  }

  snare(): void {
    this.engine("snare", "snare");
  }

  cuff(): void {
    this.engine("cuff", "cuff");
  }

  pressurise(): void {
    this.engine("pressurise", "pressurise");
  }

  cutAndSheath(): void {
    this.engine("cut-sheath", "cut-sheath");
  }

  /** Bring the kinked part out through the arteriotomy (a fresh catheter is then loaded over the wire). */
  pullOut(): void {
    const p = this.host.physics;
    if (!p?.active || !this.screened) return;
    const kinked = !!p.kink();
    const ok = p.pullOutKinked();
    const e = this.record("pull-out", ok ? "The catheter comes out through the sheath; a new one goes in over the wire." : "The catheter catches at the sheath tip and will not come back.");
    e.kinked = kinked;
    if (ok && kinked) this.recovered = true;
  }

  /** An injection while the lumen is closed by a kink is refused (the syringe will not push). Returns true when refused. */
  refuseInjection(): boolean {
    const k = this.host.physics?.kink();
    if (!k || k.severity < MP_KINK_INJECT_REFUSE) return false;
    this.injectionsThroughKink++;
    this.lastRefusalAt = this.host.wall();
    this.version++;
    return true;
  }

  /** Settle the pending observations and count kinks (call a few times a second). */
  poll(): void {
    const p = this.host.physics;
    const k = p?.kink() ?? null;
    if (k && !this.lastKinked) this.kinksSeen++;
    if (!k && this.lastKinked) this.recovered = true;
    if (!!k !== this.lastKinked) this.version++;
    this.lastKinked = !!k;
    const now = this.host.wall();
    const hist = p?.kinkHistory() ?? null;
    for (const x of this.pending.slice()) {
      let text: string | null = null;
      if (x.kind === "engine") {
        const a = hist?.lastAction;
        if (a && a.seq > x.seq) text = kinkOutcomeText(a.outcome, a.action);
        else if (now - x.at > 5) text = "Nothing changes.";
      } else if (now - x.at >= KINK_OBSERVE_S) {
        if (x.kind === "untwist") text = k ? "The tip still does not follow the hub." : "The tip turns with the hub again.";
        else text = k ? "The wire stops in the shaft." : "The wire passes up the catheter.";
      }
      if (text !== null) {
        x.entry.observed = text;
        this.pending.splice(this.pending.indexOf(x), 1);
        this.version++;
      }
    }
  }

  /** The recovery's score (the debrief's). */
  score(): KinkScore {
    const steps = this.steps.map((s) => s.step);
    const firstRecovery = steps.findIndex((s) => s !== "screen");
    const screenedFirst = firstRecovery < 0 ? steps.includes("screen") : steps.slice(0, firstRecovery).includes("screen");
    let inOrder = true;
    let rank = 0;
    let held = false;
    for (const s of steps) {
      if (s === "screen") continue;
      if (s === "snare" || s === "cuff") held = true;
      // with the tip held (step 2), untwisting and passing the wire again are part of that step
      if (held && (s === "untwist" || s === "wire")) continue;
      const r = KINK_ESCALATION[s];
      if (r < rank) inOrder = false;
      rank = Math.max(rank, r);
    }
    const hist = this.host.physics?.kinkHistory();
    return {
      kinks: Math.max(this.kinksSeen, hist?.latched ?? 0),
      steps,
      screenedFirst,
      inOrder,
      injectionsThroughKink: this.injectionsThroughKink,
      recovered: this.recovered,
      removedUncovered: this.host.physics?.kinkedExchanges ?? 0,
    };
  }

  private engine(action: KinkRecoveryAction, step: KinkStep) {
    const p = this.host.physics;
    if (!p?.active || !this.screened) return;
    const seq = p.kinkHistory()?.lastAction?.seq ?? 0;
    p.kinkRecover(action);
    const e = this.record(step, null);
    this.pending.push({ entry: e, kind: "engine", seq, at: this.host.wall() });
  }

  private track(step: KinkStep, kind: "untwist" | "wire") {
    const e = this.record(step, null);
    this.pending.push({ entry: e, kind, seq: 0, at: this.host.wall() });
  }

  private record(step: KinkStep, observed: string | null): KinkStepEntry {
    const e: KinkStepEntry = { step, t: this.host.wall(), observed, kinked: !!this.host.physics?.kink() };
    this.steps.push(e);
    this.version++;
    return e;
  }
}

declare module "../lab/controls/types" {
  interface LabCapabilities {
    /** the kink recovery of the rod mechanics (diag-catheter-kink) */
    kink: KinkControl;
  }
}

const KINK_CONTROLS = new WeakMap<object, KinkControl>();

/** The kink controls of a lab session (one per session, made on first use). */
export function kinkControlFor(host: KinkHost): KinkControl {
  let c = KINK_CONTROLS.get(host);
  if (!c) {
    c = new KinkControl(host);
    KINK_CONTROLS.set(host, c);
  }
  return c;
}

/** The events the kink session module raises in the diagnostic lab. */
export const KINK_EVENTS = ["catheter-kink", "torque-not-transmitted"] as const satisfies readonly LabEvent[];

/**
 * What the kink session module reports (the reachability report reads it from the module file that
 * registers createKinkSessionModule in src/ui/sim/modules/): catheter-kink while the shaft is kinked
 * and torque-not-transmitted while the tip does not follow the hub, in any phase the catheter can be
 * turned in.
 */
export const KINK_RAISES: LabRaises = {
  lab: "diagnostic",
  phases: ["advance", "engage-left", "engage-right", "engage-graft", "lv-aorta"],
  events: KINK_EVENTS,
};

/** The lab session as the kink module uses it (DiagnosticLabSession satisfies it). */
export interface KinkSessionHost extends KinkHost {
  readonly events: { raise(event: LabEvent, holdS?: number, t?: number, source?: string): boolean; clear(event: LabEvent): void };
  beforeInject: (() => boolean) | null;
  provideCapability(k: "kink", v: KinkControl | null): void;
}

const KINK_GUARD = Symbol("kink-inject-guard");
/** The module's injection guard, carrying the beforeInject it wrapped (restored when the module detaches). */
type GuardedInject = (() => boolean) & { [KINK_GUARD]?: true; prev?: (() => boolean) | null };

/**
 * The diagnostic session module for the kink (src/ui/sim/modules/ registers it): four times a second it
 * raises catheter-kink while the shaft is kinked (cleared once undone) and torque-not-transmitted while
 * the hub turns without the tip, keeps the KinkControl's observations up to date, provides it to the
 * table-side controls as the 'kink' capability, and puts its injection guard in front of the session's
 * beforeInject (re-applied when the attending replaces it).
 */
export function createKinkSessionModule(): SessionModule {
  let host: KinkSessionHost | null = null;
  let control: KinkControl | null = null;
  let acc = 0;
  let kinked = false;
  const guard = () => {
    const h = host;
    if (!h || !control) return;
    const cur = h.beforeInject as GuardedInject | null;
    if (cur && cur[KINK_GUARD]) return;
    const prev = cur;
    const c = control;
    const f: GuardedInject = () => {
      if (prev && !prev()) return false;
      return !c.refuseInjection();
    };
    f[KINK_GUARD] = true;
    f.prev = prev;
    h.beforeInject = f;
  };
  return {
    id: "catheter-kink",
    attach(session) {
      host = session as unknown as KinkSessionHost;
      control = kinkControlFor(host);
      host.provideCapability("kink", control);
      guard();
      return () => {
        const h = host;
        if (h) {
          const cur = h.beforeInject as GuardedInject | null;
          if (cur && cur[KINK_GUARD]) h.beforeInject = cur.prev ?? null;
          h.provideCapability("kink", null);
        }
        host = null;
        control = null;
      };
    },
    step(dt) {
      const h = host;
      if (!h || !control) return;
      acc += dt;
      if (acc < 0.25) return;
      acc = 0;
      guard();
      control.poll();
      const p = h.physics;
      const t = h.wall();
      const k = p?.active ? p.kink() : null;
      if (k) h.events.raise("catheter-kink", MP_KINK_EVENT_HOLD_S, t, "physics");
      else if (kinked) h.events.clear("catheter-kink");
      kinked = !!k;
      if (p?.active && p.torqueLoss()) h.events.raise("torque-not-transmitted", MP_TNT_HOLD_S, t, "physics");
    },
  };
}

// ---------------------------------------------------------------------------
// From the sheath to the root (diag-route-wire-led-radial)
//
// A scenario with startAt 'sheath' opens with the catheter just out of the sheath tip and the 0.035 in J
// wire leading it (ROUTE_START). Every frame the lab reads the route mechanics (DiagnosticPhysics
// .routeMechanics): whether the wire leads the catheter, the dissection accumulator (the wall load on the
// part of the catheter beyond the wire tip while it is pushed in the route), the wire tip in the
// ventricle, a stall (the hand pushes on, the tip does not follow), the radial loop and its straightening,
// and a forearm branch perforated by forcing against a stall. The session module of
// src/ui/sim/modules/route.ts raises the tips' events from it and gives the table-side actions. The loop
// itself is the lumen's (src/physics/lumen.ts RADIAL_LOOP): a J wire stalls in it and a hydrophilic wire
// passes, by the rod mechanics alone. Every number here is a MODEL PARAMETER
// (docs/realism/facts/pkg-diag-route-wire-led-radial.md) unless its comment cites the module text.
// ---------------------------------------------------------------------------

/**
 * From the sheath, the catheter's reported insertion falls only once it has come back this far (mm): the shaft
 * shortens by a few millimetres under the hand's load against a catch, which is not a withdrawal. MODEL PARAMETER.
 */
export const MP_INSERTION_HYSTERESIS_MM = 6;

/** A sheath start: the catheter tip this far beyond the sheath tip, the J wire leading it by this much (mm). MODEL PARAMETERS. */
export const ROUTE_START = { catheterBeyondSheathMm: 5, wireLeadMm: 25 } as const;

/**
 * The route mechanics' thresholds (MODEL PARAMETERS unless cited):
 *   notLeadingMm         the catheter tip this far beyond the wire tip counts as not led
 *   rootMarginMm         the catheter tip within this of the root top (along the route) is no longer "in the route"
 *   noWireDistalMm       with no wire in the catheter, the distal length whose wall load the accumulator counts
 *   dissectionNs         the accumulator (N·s of wall load beyond the wire tip) at which the artery dissects
 *   lvBelowValveMm       the wire tip at least this far below the valve plane, in the LV lumen, is in the ventricle
 *   stallWindowS, stallPushMm, stallProgressMm   a stall: pushed this much in the window, moved on less than this
 *   loopNearMm           a tip within this before the loop's first sample is at the loop
 *   forceN, perforationNs   the hub load above forceN, integrated while stalled in the forearm, that perforates a branch
 *   sealMm               a catheter tip this far beyond the perforation covers (seals) it (module text: "advancing a
 *                        catheter across the perforated segment usually seals it", 06-to-the-root.ts:820)
 *   batAtm               the balloon pressure of balloon-assisted tracking: "3–6 atm" (06-to-the-root.ts:754)
 *   batStraightenPerMm   the loop's straightening per mm the assembly is advanced through it
 *   loopSendStep         the straightening is given to the lumens in steps of this (each step rebuilds them)
 */
export const MP_ROUTE_LED = {
  notLeadingMm: 2,
  rootMarginMm: 15,
  noWireDistalMm: 20,
  dissectionNs: 2,
  lvBelowValveMm: 4,
  stallWindowS: 1,
  stallPushMm: 6,
  stallProgressMm: 2,
  loopNearMm: 10,
  forceN: 3,
  perforationNs: 4,
  sealMm: 10,
  batAtm: [3, 6] as const,
  batStraightenPerMm: 1 / 30,
  loopSendStep: 0.02,
};

/** A wire put into the catheter goes in to this far inside its tip (mm), where the hand takes it on. MODEL PARAMETER. */
export const ROUTE_WIRE_INSIDE_MM = 5;

/**
 * The wires the route offers (physics ids of src/physics/catheterShapes.ts), generic names. The 0.035 in
 * J leads catheters; the narrow-J radial wire, the polymer-jacketed hydrophilic wire and the 0.014 in
 * coronary wire are the radial algorithm's alternatives ("From the radial, Brilakis suggests a
 * polymer-jacketed hydrophilic wire or a narrow-J radial wire, and a 0.014 inch wire to negotiate loops",
 * 06-to-the-root.ts:696); the straight wire crosses the valve; the 260 and 300 cm J wires are for
 * exchanges ("Exchange-length wires (250–300 cm, Oxford)", 06-to-the-root.ts:121).
 */
export const ROUTE_WIRES: readonly { id: string; label: string; exchange: boolean }[] = [
  { id: "J", label: "0.035 in J wire", exchange: false },
  { id: "NARROWJ", label: "0.035 in narrow-J radial wire", exchange: false },
  { id: "HYDRO", label: "0.035 in hydrophilic wire", exchange: false },
  { id: "WORKHORSE", label: "0.014 in coronary wire", exchange: false },
  { id: "STRAIGHT", label: "0.035 in straight wire", exchange: false },
  { id: "J260", label: "0.035 in J wire, 260 cm", exchange: true },
  { id: "J300", label: "0.035 in J wire, 300 cm", exchange: true },
];

/** Whether a wire is exchange length (it keeps its place while a catheter comes off it). */
export function isExchangeLength(id: string): boolean {
  return ROUTE_WIRES.some((w) => w.id === id && w.exchange);
}

/** The route mechanics of one frame (DiagnosticPhysics.routeMechanics). Route arclengths are the lumen's (mm). */
export interface RouteMechanics {
  t: number;
  catheterTipS: number | null;
  wireTipS: number | null;
  /** the wire's lead beyond the catheter tip (mm; negative inside it), null without a wire or a catheter */
  wireLeadMm: number | null;
  /** the access route's region (src/physics/lumen.ts Region) at the catheter tip and the wire tip */
  catheterRegion: number | null;
  wireRegion: number | null;
  /** the catheter tip is in the access route, short of the ascending aorta */
  catheterInRoute: boolean;
  /** this frame the catheter was pushed in the route with its tip beyond the wire tip (or no wire in it) */
  notLeading: boolean;
  /** the last frame time (solver clock, s) at which the catheter was pushed in the route without the wire leading, or null */
  lastNotLeadingT: number | null;
  /** catheter advance (mm) made in the route without the wire leading, since the start */
  notLeadingAdvanceMm: number;
  /** the dissection accumulator (N·s) and the dissection once it is above MP_ROUTE_LED.dissectionNs */
  dissectionRisk: number;
  dissection: { region: number; s: number; t: number } | null;
  /** the wire tip is in the left ventricle, touching its wall */
  wireInLv: boolean;
  /** the wire's ventricular contact that the patient engine does not already count: the wire tip in the LV while the catheter tip is not (a catheter tip in the LV is the engine's own TipInput.lvContact) */
  lvContact: boolean;
  /** the radial loop (a sheath start with the variant), or null */
  loop: { span: [number, number]; straighten: number; wireAcross: boolean; catheterAcross: boolean; stalled: "wire" | "catheter" | null; stallWire: string | null } | null;
  stalled: { device: "wire" | "catheter"; s: number; atLoop: boolean } | null;
  perforation: { s: number; t: number; sealed: boolean; region: number } | null;
  forcingNs: number;
  /** the wire in the patient (physics id), the tips in the aortic frame */
  wireId: string | null;
  catheterTip: [number, number, number] | null;
  wireTip: [number, number, number] | null;
}

interface RouteAccumulators {
  lastT: number | null;
  notLeadingAdvanceMm: number;
  notLeadingSince: number | null;
  notLeadingAt: number | null;
  dissectionRisk: number;
  dissection: { region: number; s: number; t: number } | null;
  forcingNs: number;
  perforation: { s: number; t: number; sealed: boolean; region: number } | null;
  histC: StallHistory;
  histW: StallHistory;
  loopStalls: { wire: number; catheter: number };
  routeLostExchanges: number;
}

/**
 * The last MP_ROUTE_LED.stallWindowS of one tip's route arclength and the push the hand gave it, frame by
 * frame, in a fixed ring (no allocation on the frame path). A frame without the tip clears it.
 */
class StallHistory {
  private static readonly CAP = 512;
  private readonly t = new Float64Array(StallHistory.CAP);
  private readonly s = new Float64Array(StallHistory.CAP);
  private readonly push = new Float64Array(StallHistory.CAP);
  /** index of the oldest entry, and the number kept */
  private head = 0;
  private n = 0;

  keep(t: number, s: number | null, push: number): void {
    if (s === null) {
      this.n = 0;
      this.head = 0;
      return;
    }
    const C = StallHistory.CAP;
    if (this.n === C) {
      this.head = (this.head + 1) % C;
      this.n--;
    }
    const i = (this.head + this.n) % C;
    this.t[i] = t;
    this.s[i] = s;
    this.push[i] = push;
    this.n++;
    while (this.n && t - this.t[this.head] > MP_ROUTE_LED.stallWindowS) {
      this.head = (this.head + 1) % C;
      this.n--;
    }
  }

  /** The hand pushed at least stallPushMm over (most of) the window while the tip moved on less than stallProgressMm. */
  stalled(): boolean {
    const C = StallHistory.CAP;
    if (this.n < 3) return false;
    const first = this.head;
    const last = (this.head + this.n - 1) % C;
    if (this.t[last] - this.t[first] < MP_ROUTE_LED.stallWindowS * 0.8) return false;
    let pushed = 0;
    for (let k = 0; k < this.n; k++) pushed += this.push[(first + k) % C];
    return pushed >= MP_ROUTE_LED.stallPushMm && this.s[last] - this.s[first] < MP_ROUTE_LED.stallProgressMm;
  }
}

/** An empty route mechanics record (DiagnosticPhysics updates one in place). */
function newRouteMechanics(): RouteMechanics {
  return {
    t: 0,
    catheterTipS: null,
    wireTipS: null,
    wireLeadMm: null,
    catheterRegion: null,
    wireRegion: null,
    catheterInRoute: false,
    notLeading: false,
    lastNotLeadingT: null,
    notLeadingAdvanceMm: 0,
    dissectionRisk: 0,
    dissection: null,
    wireInLv: false,
    lvContact: false,
    loop: null,
    stalled: null,
    perforation: null,
    forcingNs: 0,
    wireId: null,
    catheterTip: null,
    wireTip: null,
  };
}

function newRouteAccumulators(): RouteAccumulators {
  return {
    lastT: null,
    notLeadingAdvanceMm: 0,
    notLeadingSince: null,
    notLeadingAt: null,
    dissectionRisk: 0,
    dissection: null,
    forcingNs: 0,
    perforation: null,
    histC: new StallHistory(),
    histW: new StallHistory(),
    loopStalls: { wire: 0, catheter: 0 },
    routeLostExchanges: 0,
  };
}

// ---------------------------------------------------------------------------
// Spasm in the diagnostic lab (diag-spasm-states)
//
// The session module of src/ui/sim/modules/ that couples the patient's spasm to the lab (registered by a
// module file there, as the kink module is; see the package notes). At attach it turns the engine's
// catheter-tip spasm model on for this patient's tree (responses.ts TipSpasmModel: a small ostium is
// more susceptible, a provoked spasm holds until nitrate relieves it), and for a radial case gives the
// engine its radial artery (PatientEngine.setRadialAccess, radialSpasm.ts LiveRadialSpasm) with the
// scenario's start (spasm.ts spasmSetups: the artery, the sheath, the exchanges made, the tone, a
// vasopressor running). Four times a second it counts a catheter change as an exchange through the
// artery (that evaluation reads no hand movement: a change resets the controls, and a jump faster than
// MP_SPASM_MODULE.maxHandMmS is a reset, not a pull), gives the rod mechanics the tone
// (DiagnosticPhysics.setRadialSpasm: the lumen narrows), works out the hub axial force from the
// catheter's movement through the arm (radialSpasm.ts hubAxialForceN, the one source of the grip in
// both catheter models), gives the patient forearm pain when the spasm grips the catheter (the
// engine's forearm pain, PatientEngine.forearmPain, which stays out of the chest pain and the
// haemodynamics), and raises the tips' events: ostial-spasm while the
// engine's catheter-tip spasm on the engaged side is at MP_SPASM_MODULE.ostialAt, radial-spasm while a
// significant radial spasm drags on a moving catheter or hurts, and haematoma and bleeding when a
// forceful pull through a gripping spasm avulses the artery (radialSpasm.ts avulses; site.ts
// forearmHaematomaAfterAvulsion). It provides the 'radialSpasm' capability (RadialSpasmControl) with
// the module text's measures and the forearm check. Every number is a MODEL PARAMETER.
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the spasm session module. */
export const MP_SPASM_MODULE = {
  /** seconds between evaluations (a quarter-second, as the kink module) */
  stepS: 0.25,
  /** engine catheter-tip spasm (0..0.9) at which ostial-spasm is raised, and its hold (s; the scenario script's hold too, spasm.ts) */
  ostialAt: 0.15,
  ostialHoldS: MP_SPASM_EVENT_HOLD_S,
  /** radial-spasm: a tone at MP_RADIAL_LIVE.significantAt felt on a moving catheter or as pain; its hold (s) */
  radialHoldS: 30,
  /** hand speed (mm/s) that counts as moving the catheter */
  movingMmS: 0.5,
  /** the catheter length in the radial artery under the simple catheter model (mm): the artery beyond a standard short sheath */
  contactMm: 120,
  /** a 6 Fr diagnostic catheter's outer diameter (mm) */
  catheterOdMm: 2.0,
  /** forearm pain (PatientEngine.forearmPain, magnitude spasmPain): reported at most every painEveryS */
  painEveryS: 2,
  /**
   * the fastest a hand moves a catheter through the arm, mm/s (60 mm in one quarter-second evaluation):
   * a faster change of the insertion is a reset (a catheter change, a case load), not a pull
   */
  maxHandMmS: 240,
  /** the sheath's side arm will not aspirate from this tone (the artery closed round the sheath tip) */
  noAspirateAt: 0.85,
};

/** The events the spasm session module raises in the diagnostic lab. */
export const SPASM_EVENTS = ["ostial-spasm", "radial-spasm", "haematoma", "bleeding"] as const satisfies readonly LabEvent[];

/**
 * What the spasm session module reports (the reachability report reads it from the module file that
 * registers createSpasmSessionModule in src/ui/sim/modules/): ostial-spasm with the catheter in a
 * coronary, radial-spasm in any phase the catheter moves through the arm, haematoma and bleeding after an
 * avulsion, to the end of the case.
 */
export const SPASM_RAISES: LabRaises = {
  lab: "diagnostic",
  phases: ["setup", "advance", "engage-left", "engage-right", "engage-graft", "inject", "views", "lv-aorta", "exchange", "finish"],
  events: SPASM_EVENTS,
};

/** The avulsion the module recorded (for the debrief). */
export interface RadialAvulsion {
  /** lab time, s */
  t: number;
  hubAxialN: number;
  level: number;
  haematoma: ForearmHaematoma;
}

/** The lab session as the spasm module uses it (DiagnosticLabSession satisfies it). */
export interface SpasmSessionHost {
  readonly engine: PatientEngine;
  readonly physics: DiagnosticPhysics | null;
  readonly store: { getState(): { caseData: Pick<AnatomyCase, "accessRoute"> & { scenarioId?: string }; catheterId: string; controls: { insertion: number; torque: number } } };
  readonly events: { raise(event: LabEvent, holdS?: number, t?: number, source?: string): boolean; hold(events: readonly LabEvent[], t?: number, source?: string): void };
  /** lab time, s */
  wall(): number;
  provideCapability(k: "radialSpasm", v: RadialSpasmControl | null): void;
}

/**
 * The radial spasm at the table (the 'radialSpasm' capability): the module text's measures, the
 * vasodilators by their route, the side arm, and the forearm check. It shows signs, not the tone: the
 * drag the hand feels, the pain the patient reports, the finding on the forearm.
 */
export class RadialSpasmControl {
  /** the forearm checks made (lab time, s) and what they found */
  readonly forearmChecks: { t: number; grade: "none" | "visible" | "tense" }[] = [];
  /** the hub axial force at the last evaluation (N), and the hand speed (mm/s) and catheter length in the artery (mm) it was worked out from */
  hubAxialN = 0;
  hubSpeedMmS = 0;
  contactMm = 0;
  /** the avulsion, once it happened */
  avulsion: RadialAvulsion | null = null;
  /** lidocaine into the artery was asked for and refused */
  lidocaineRefused = 0;
  version = 0;

  constructor(private readonly host: SpasmSessionHost) {}

  get available(): boolean {
    return !!this.host.engine.radial;
  }

  /** The side arm aspirates (it will not once the artery has closed round the sheath tip, MP_SPASM_MODULE.noAspirateAt). */
  sideArmAspirates(): boolean {
    const r = this.host.engine.radial;
    return !r || r.level < MP_SPASM_MODULE.noAspirateAt;
  }

  /**
   * A vasodilator for the radial artery: into the artery through the side arm, or intravenously (the
   * module text: if you cannot aspirate through the side port, the intravenous route). Given through the
   * patient engine (giveDrug), so its systemic effect follows too.
   */
  vasodilator(drug: "gtn" | "verapamil", dose: number, route: "ia" | "iv"): RadialMeasureResult {
    const e = this.host.engine;
    if (!e.radial) return { ok: false, text: "There is no radial artery in this procedure." };
    const r = route === "ia" && !this.sideArmAspirates() ? "iv" : route;
    const g = e.giveDrug(drug, dose, r);
    this.version++;
    if (!g.ok) return { ok: false, text: g.text ?? "Not given" };
    const name = drug === "gtn" ? "Nitroglycerin" : "Verapamil";
    return { ok: true, route: r, text: r === route ? `${name} ${r === "ia" ? "into the radial artery through the side arm" : "intravenously"}.` : `The side arm will not aspirate: ${name.toLowerCase()} given intravenously instead.` };
  }

  /** A measure (radialSpasm.ts LiveRadialSpasm.measure); intra-arterial lidocaine is refused. */
  measure(id: RadialMeasureId): RadialMeasureResult {
    const r = this.host.engine.radial;
    if (!r) return { ok: false, text: "There is no radial artery in this procedure." };
    const out = r.measure(id);
    if (id === "ia-lidocaine") this.lidocaineRefused++;
    this.version++;
    return out;
  }

  /** Look at and feel the forearm (the end-of-case check). */
  checkForearm(): { grade: "none" | "visible" | "tense"; text: string } {
    const f = forearmFinding(this.avulsion?.haematoma ?? null, this.host.engine.time);
    this.forearmChecks.push({ t: this.host.wall(), grade: f.grade });
    this.version++;
    return { grade: f.grade, text: f.text };
  }

  /** What the hand feels moving the catheter now: none, some or marked drag (from the hub axial force). */
  drag(): "none" | "some" | "marked" {
    const n = this.hubAxialN;
    return n >= MP_RADIAL_LIVE.avulsionN / 2 ? "marked" : n >= 4 * MP_RADIAL_LIVE.baseN ? "some" : "none";
  }
}

const SPASM_CONTROLS = new WeakMap<object, RadialSpasmControl>();

/** The radial spasm controls of a lab session (one per session, made on first use). */
export function radialSpasmControlFor(host: SpasmSessionHost): RadialSpasmControl {
  let c = SPASM_CONTROLS.get(host);
  if (!c) {
    c = new RadialSpasmControl(host);
    SPASM_CONTROLS.set(host, c);
  }
  return c;
}

declare module "../lab/controls/types" {
  interface LabCapabilities {
    /** the radial spasm measures and the forearm check (diag-spasm-states) */
    radialSpasm: RadialSpasmControl;
  }
}

let spasmPackIds: ReadonlySet<string> | null = null;
/** The scenarios of this pack (spasm.ts): the ones that get the held catheter-tip spasm model. */
export function isSpasmPackScenario(id: string | undefined): boolean {
  spasmPackIds ??= new Set(spasmScenarios.map((x) => x.id));
  return id !== undefined && spasmPackIds.has(id);
}

/**
 * Set the patient up for the spasm model at the start of a case (also used by tests): the held
 * catheter-tip spasm model for this pack's scenarios only (every other case keeps the engine's legacy
 * dynamics until a decision widens it), and a radial artery for a radial case.
 */
export function setUpSpasm(engine: PatientEngine, caseData: { accessRoute: AccessRoute; scenarioId?: string }, setup: SpasmSetup | undefined = caseData.scenarioId ? spasmSetups[caseData.scenarioId] : undefined): void {
  if (isSpasmPackScenario(caseData.scenarioId)) engine.setTipSpasmModel(engine.tipSpasmModelForTree());
  if (caseData.accessRoute === "femoral") return;
  if (!engine.radial) {
    engine.setRadialAccess({
      sheathOdMm: SHEATHS[setup?.sheath ?? "6"].odMm,
      ...(setup?.radialDiamMm !== undefined ? { radialDiamMm: setup.radialDiamMm } : {}),
      ...(setup?.exchanges !== undefined ? { exchanges: setup.exchanges } : {}),
      ...(setup?.startLevel !== undefined ? { startLevel: setup.startLevel } : {}),
      ...(setup?.startImpulse !== undefined ? { startImpulse: setup.startImpulse } : {}),
    });
  }
  if (setup?.vasopressor && !engine.vasopressorRunning()) engine.startInfusion({ drug: setup.vasopressor.drug, rate: setup.vasopressor.rateUgMin });
}

/**
 * The diagnostic session module for spasm (src/ui/sim/modules/ registers it); see the section comment
 * above. Its id is SPASM_MODULE_ID.
 */
export const SPASM_MODULE_ID = "spasm";

export function createSpasmSessionModule(): SessionModule {
  let host: SpasmSessionHost | null = null;
  let control: RadialSpasmControl | null = null;
  let acc = 0;
  let lastIns: number | null = null;
  let lastTorque: number | null = null;
  let lastCatheter: string | null = null;
  let lastSource: "fed" | "hub" | null = null;
  let lastPainT = -Infinity;
  return {
    id: SPASM_MODULE_ID,
    attach(session) {
      host = session as unknown as SpasmSessionHost;
      const st = host.store.getState();
      setUpSpasm(host.engine, st.caseData);
      control = radialSpasmControlFor(host);
      host.provideCapability("radialSpasm", control);
      lastCatheter = st.catheterId;
      return () => {
        host?.provideCapability("radialSpasm", null);
        host = null;
        control = null;
      };
    },
    step(dt) {
      const h = host;
      const c = control;
      if (!h || !c) return;
      acc += dt;
      if (acc < MP_SPASM_MODULE.stepS) return;
      const span = acc;
      acc = 0;
      const e = h.engine;
      const st = h.store.getState();
      const t = h.wall();
      // catheter-tip spasm on the side the catheter tip is in
      const tip = e.tipInput;
      if ((tip.location === "ostium" || tip.location === "coronary") && tip.side && e.tipSpasm()[tip.side] >= MP_SPASM_MODULE.ostialAt) h.events.raise("ostial-spasm", MP_SPASM_MODULE.ostialHoldS, t, "spasm");
      const r = e.radial;
      if (!r) return;
      const phys = h.physics?.active ? h.physics : null;
      // the hand's movement at the hub: under the rod mechanics the catheter push it has commanded (the
      // reported insertion there moves in steps as shaft nodes cross the skin, and the tip sticks and
      // slips in a gripping spasm, either of which would read as a jerk), else the hub's insertion
      const source = phys ? "fed" : "hub";
      const ins = phys ? phys.catheterFedMm : st.controls.insertion;
      const tq = st.controls.torque;
      if (source !== lastSource) {
        lastSource = source;
        lastIns = null;
      }
      // a catheter change goes through the artery: an exchange. setCatheter resets the controls, so this
      // evaluation reads no movement (the change of insertion is the reset, not a withdrawal)
      if (lastCatheter !== null && st.catheterId !== lastCatheter) {
        r.exchange();
        lastCatheter = st.catheterId;
        lastIns = ins;
        lastTorque = tq;
        c.hubAxialN = 0;
        return;
      }
      lastCatheter = st.catheterId;
      // a jump no hand makes (a case load, a parked start): re-read the controls, no movement
      if (lastIns !== null && Math.abs(ins - lastIns) > MP_SPASM_MODULE.maxHandMmS * span) {
        lastIns = ins;
        lastTorque = tq;
        c.hubAxialN = 0;
        return;
      }
      // the catheter's movement through the arm since the last evaluation
      const speed = lastIns === null ? 0 : (ins - lastIns) / span;
      const turning = lastTorque !== null && Math.abs(tq - lastTorque) > 1e-3;
      lastIns = ins;
      lastTorque = tq;
      const moving = Math.abs(speed) >= MP_SPASM_MODULE.movingMmS || turning;
      const level = r.level;
      const contactMm = phys ? phys.radialContactMm() : MP_SPASM_MODULE.contactMm;
      const geom = { catheterOdMm: MP_SPASM_MODULE.catheterOdMm, radialDiamMm: r.setup.radialDiamMm, lubricated: r.lubrication() };
      if (phys) phys.setRadialSpasm(r.avulsed ? 0 : level, geom);
      // the grip has one source in both catheter models: the shared model's (the solver's lumen only
      // narrows, RADIAL_SPASM_LUMEN.friction 1), over the catheter length the rod mechanics measure
      const grip = { level: r.avulsed ? 0 : level, contactMm, ...geom };
      c.hubAxialN = Math.abs(speed) >= MP_SPASM_MODULE.movingMmS ? hubAxialForceN(grip, speed) : 0;
      c.hubSpeedMmS = speed;
      c.contactMm = contactMm;
      // forearm pain when the spasm grips the catheter, more when it is moved (not chest pain)
      const pain = spasmPain(r.avulsed ? 0 : level, moving);
      if (pain > 0 && t - lastPainT >= MP_SPASM_MODULE.painEveryS) {
        e.forearmPain(pain);
        lastPainT = t;
      }
      if (!r.avulsed && level >= MP_RADIAL_LIVE.significantAt && (moving || pain > 0)) h.events.raise("radial-spasm", MP_SPASM_MODULE.radialHoldS, t, "spasm");
      // a forceful pull through a gripping spasm avulses the artery (withdrawal only)
      if (!r.avulsed && speed < 0 && avulses(level, c.hubAxialN)) {
        r.avulsed = true;
        const haematoma = forearmHaematomaAfterAvulsion(e.time, c.hubAxialN, MP_RADIAL_LIVE.avulsionN);
        c.avulsion = { t, hubAxialN: c.hubAxialN, level, haematoma };
        e.forearmPain(1, { vagal: true });
        h.events.hold(["haematoma", "bleeding"], t, "spasm");
        c.version++;
      }
    },
  };
}
