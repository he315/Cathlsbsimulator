// ---------------------------------------------------------------------------
// Hand bindings of the pressure wire (pci-pressure-wire-console).
//
// The pressure wire is the coronary wire once the wire has been exchanged for
// it (setWireKind 'pressure'), so the hands hold it in the input layer's
// 'wire014' slot, the one the PCI lab puts on the table. The hands:
//   advance, withdraw  move the wire (mm of hub travel) with the sensor 3 cm
//                      behind its tip; while a pullback is being recorded each
//                      move adds the reading at the new sensor position, so a
//                      pullback by hand draws the curve with the console closed
// Torque and pin stay on the input target's built-in route (torqueWire,
// pinWire), as for any coronary wire. For any other wire these handlers
// return false and the built-in route moves it as before.
//
// The console (src/ui/pci/consoles/PressureWireConsole.tsx) holds the
// read-outs and the settings; the session-level helpers it shares with these
// bindings live here (a console file exports only its meta and component):
// the case's set-up faults armed on the wire (once per case: the aortic line
// is kept across a wire exchange), the operator action path asked of the
// attending, the guide syringe's contrast for equalisation, and the stored
// run used for co-registration with the placement of the wire's route on its
// image (the camera the live monitor rendered the run with).
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import { samplePos, type CoronaryTree, type Sample } from "../../../render/xray/coronaryTree";
import { CINE_BREATH_HOLD, makeCamera, treeCentre } from "../../../render/xray/sceneBuilder";
import { DIAPHRAGM_DESCENT } from "../../../render/xray/thorax";
import type { Motion } from "../../../render/xray/heart";
import type { XrayCamera } from "../../../render/xray/XrayRenderer";
import type { CArm, Vec3 } from "../../../types";
import { toWorld, type AnatomyModel } from "../../../simulation/anatomy";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { moveWire } from "../../../simulation/pci/actions/wire";
import {
  armPressureWire,
  equalisePressure,
  pwFaultsFromParams,
  pwFlushAorticLine,
  pwKeepLine,
  pwSetupOf,
  pwWithAorticLine,
  pwZeroTransducer,
  samplePullback,
  type PwAorticLine,
} from "../../../simulation/pci/actions/pressure";
import type { PwLabFault } from "../../../simulation/pci/pressureWire";
import { MP_LEVEL_TOL_CM, type Transducer } from "../../../simulation/patient/transducer";
import { useSeriesStore, type StoredSeries } from "../../../state/useSeriesStore";

/** The attending's action names the pressure-wire actions are asked under (PciLabSession PciAction). */
export type PressureActionName = "advance-wire" | "wire-kind" | "flush-guide" | "drug";

/** What the pressure-wire bindings and the console need of a session (PciLabSession satisfies it). */
export interface PressureSession {
  readonly s: PciScenario | { side: "left" | "right" };
  readonly g: PciGeom;
  readonly st: PciState;
  /** the tree as drawn now (the lesions and stents as they are) */
  readonly drawTree?: CoronaryTree;
  /** the launch the case opened with (its 'pwFault' param names the set-up faults) */
  readonly options?: { launch?: { params?: Readonly<Record<string, string>> } | null };
  /** the guide's syringe: its lumen's contrast fraction (1 contrast, 0 saline after a flush) */
  readonly syringes?: { guide: { primed: number } };
  readonly caseId?: string;
  /** the patient's anatomy model (the world transform the scene renders with) */
  readonly model?: AnatomyModel;
  /** the table top (the scene's iso-centre moves with it) */
  readonly table?: { state: { x: number; y: number; height: number } };
  /** a contralateral catheter: the scene centres on both coronaries */
  readonly dual?: boolean;
  /** the patient engine: its arterial line's Transducer is the aortic line the pressure wire's Pa channel reads */
  readonly engine?: { readonly transducer: Transducer };
  /** called after every lab step (the loose transducer's drift is carried to the patient's line here) */
  onStep?(fn: (dt: number) => void): () => void;
  /** a public entry for an engine change asked of the attending (preferred when present) */
  applyPressureAction?(action: PressureActionName, f: (x: PciState) => PciState): boolean;
}

const scen = (x: PressureSession) => x.s as PciScenario;
const treeOf = (x: PressureSession): CoronaryTree => (x.drawTree ?? (x.g as unknown as { tree: CoronaryTree }).tree) as CoronaryTree;

/** The set-up faults the session's case opened with. */
export const sessionPwFaults = (x: PressureSession) => pwFaultsFromParams(x.options?.launch?.params ?? null);

// --- the patient's arterial line ------------------------------------------------------------------
//
// The pressure wire's aortic channel is the patient's arterial line: the Transducer of the patient engine, the
// one the monitor's Zero ART, Level and Re-prime line buttons act on and the monitor's 'zero required' alert
// reads. Its zero, level and air are mirrored into the wire's set-up before and after every pressure-wire
// action (pwWithAorticLine), so equalisation checks what the monitor shows; the console's team steps act on
// it; the case's 'pwFault' faults are put into it once per patient; and a loose transducer's drift, which the
// wire's set-up runs on the procedure clock (pressureWire.ts stepPressureWire), is carried into it after every
// lab step, so the monitor drifts with the console. Without an engine (a headless caller) the set-up is the
// wire's own, as before.

const transducerOf = (x: PressureSession): Transducer | null => x.engine?.transducer ?? null;

/** The drift (mmHg) already carried into each line, and the lines the case's faults have been put into. */
const pushedDrift = new WeakMap<Transducer, number>();
const faultedLines = new WeakSet<Transducer>();
const watched = new WeakSet<object>();

/** The patient's arterial line as the monitor has it (its offset without the loose transducer's drift the wire's set-up carries), or null. */
export function aorticLineOf(session: PressureSession): PwAorticLine | null {
  const tr = transducerOf(session);
  if (!tr) return null;
  const t = tr.st;
  return {
    zeroed: t.zeroed,
    levelled: Math.abs(t.heightCm) <= MP_LEVEL_TOL_CM,
    airMl: t.airMl,
    offsetMmHg: tr.hydrostatic() + t.drift - t.zeroRef - (pushedDrift.get(tr) ?? 0),
  };
}

/** Put the case's set-up faults into the patient's line, once per line: air in it, not zeroed (unless zeroed already). */
function faultLine(tr: Transducer, faults: readonly PwLabFault[]) {
  if (faultedLines.has(tr) || !faults.length) return;
  faultedLines.add(tr);
  if (faults.includes("line-air")) tr.setFault("air-bubble");
  if (faults.includes("transducer-unzeroed") && !tr.st.zeroed) tr.setFault("unzeroed");
}

/** Carry the loose transducer's drift (the wire's set-up, mmHg) into the patient's line. */
function carryDrift(tr: Transducer, driftMmHg: number | undefined) {
  if (driftMmHg === undefined || !Number.isFinite(driftMmHg)) return;
  const d = driftMmHg - (pushedDrift.get(tr) ?? 0);
  if (!d) return;
  tr.st.drift += d;
  pushedDrift.set(tr, driftMmHg);
}

/** After every lab step, carry the drift of the loaded wire's set-up into the line (subscribed once per session). */
function watchDrift(session: PressureSession) {
  if (watched.has(session) || typeof session.onStep !== "function" || !transducerOf(session)) return;
  watched.add(session);
  session.onStep(() => {
    const tr = transducerOf(session);
    const set = pwSetupOf(session.st);
    if (tr && set) carryDrift(tr, set.paDriftMmHg);
  });
}

/** The state with the wire's aortic channel mirrored from the patient's line (what the console draws from). */
export function withAorticLine(session: PressureSession, st: PciState = session.st): PciState {
  return pwWithAorticLine(st, aorticLineOf(session));
}

/**
 * Apply an engine change to the session as an operator action, asked of the attending first (as
 * src/ui/pci/inputBindings/wire.ts applyWireAction): a public applyPressureAction when the session has one,
 * else PciLabSession's act(). The case's set-up faults are armed on the loaded wire, and the wire's aortic
 * channel is the patient's arterial line. `onLine` acts on that line (a team step), once the attending has let
 * the action through. False when the session has no action entry or the attending stopped it.
 */
export function applyPressureAction(session: PressureSession, action: PressureActionName, f: (x: PciState) => PciState, onLine?: (tr: Transducer) => void): boolean {
  watchDrift(session);
  const g = armed(session, f, onLine);
  if (typeof session.applyPressureAction === "function") return session.applyPressureAction(action, g);
  const act = (session as unknown as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, action, g);
  if (import.meta.env?.DEV) throw new Error("applyPressureAction: the PCI session offers neither applyPressureAction() nor act(); the pressure wire's actions cannot reach the engine.");
  return false;
}

/**
 * The change with the set-up armed before it (a wire already loaded) and after it (the wire it loads; the case's
 * faults only once per case), the aortic channel mirrored from the patient's line before and after it (the line's
 * own step, `onLine`, between), and the aortic line recorded when it has changed. The session applies it once,
 * when the attending lets the action through, so the line is touched only then.
 */
function armed(session: PressureSession, f: (x: PciState) => PciState, onLine?: (tr: Transducer) => void): (x: PciState) => PciState {
  const faults = sessionPwFaults(session);
  return (x) => {
    const tr = transducerOf(session);
    if (tr) faultLine(tr, faults);
    let n = f(withAorticLine(session, armPressureWire(x, faults)));
    n = armPressureWire(n, faults);
    if (tr) {
      carryDrift(tr, pwSetupOf(n)?.paDriftMmHg);
      onLine?.(tr);
    }
    return pwKeepLine(withAorticLine(session, n));
  };
}

/** The team zeroes the aortic transducer to air and levels it at the heart: the wire's set-up and the patient's line (the monitor's Zero ART and Level). */
export function zeroTransducerInSession(session: PressureSession): boolean {
  return applyPressureAction(session, "wire-kind", (st) => pwZeroTransducer(st), (tr) => {
    tr.level();
    tr.zero();
  });
}

/** The team flushes the aortic line through the transducer: the wire's set-up and the patient's line (the monitor's Re-prime line). */
export function flushAorticLineInSession(session: PressureSession): boolean {
  return applyPressureAction(session, "wire-kind", (st) => pwFlushAorticLine(st), (tr) => tr.reprime());
}

/**
 * The state side of a step the attending has already allowed through another session entry (the guide flush:
 * session.flushGuide() asked it), applied without asking a second time; through the action path when the
 * session has no such entry.
 */
export function applyPressureFollowUp(session: PressureSession, action: PressureActionName, f: (x: PciState) => PciState): boolean {
  const update = (session as unknown as { update?: (fn: (x: PciState) => PciState) => void }).update;
  if (typeof session.applyPressureAction !== "function" && typeof update === "function") {
    update.call(session, armed(session, f));
    return true;
  }
  return applyPressureAction(session, action, f);
}

/** Equalise through the session, with the guide syringe's own contrast state. */
export function equaliseInSession(session: PressureSession): boolean {
  const primed = session.syringes?.guide.primed;
  return applyPressureAction(session, "wire-kind", (st) => equalisePressure(scen(session), session.g, st, treeOf(session), primed === undefined ? {} : { guideContrast: primed }));
}

/**
 * The stored angiogram for co-registration: the run of this case a pullback was recorded against (its number,
 * `frameId`) when it is still on the reference monitor, else the last cine run of the case; null without one.
 */
export function storedRunFor(session: PressureSession, frameId: number | null = null): StoredSeries | null {
  const mine = useSeriesStore.getState().series.filter((r) => !session.caseId || r.caseId === session.caseId);
  if (frameId !== null) {
    const hit = mine.find((r) => r.number === frameId);
    if (hit) return hit;
  }
  const cine = mine.filter((r) => r.kind === "cine");
  return cine.length ? cine[cine.length - 1] : null;
}

/** The C-arm of a stored run (its first frame). */
export const storedRunCArm = (r: StoredSeries): CArm => r.cArm;

/** Darkness of the vessel along the route on a frame is judged this far around each point, mm — MODEL PARAMETER (a search window for the route's placement on the frame, which is drawn at rest and ignores the heart's motion). */
const MP_COREG_WINDOW_MM = 2;
/** ... against the background this far from each point, mm — MODEL PARAMETER (outside a coronary artery's lumen and the window). */
const MP_COREG_RING_MM = 6;
/** Route points scored per frame at most (spread along the route). */
const COREG_POINTS = 48;

/**
 * How opacified the route is on a frame: the mean, over route points inside the image, of the local background
 * (the median of a ring around the point) less the darkest pixel near the point. NaN without a point to score.
 */
function routeContrast(f: Uint8Array, w: number, h: number, pts: readonly { x: number; y: number }[], win: number, ring: number): number {
  const ringN = 16;
  let sum = 0,
    n = 0;
  const vals: number[] = new Array(ringN);
  for (const p of pts) {
    const cx = Math.round(p.x),
      cy = Math.round(p.y);
    if (cx - ring < 0 || cy - ring < 0 || cx + ring >= w || cy + ring >= h) continue;
    let lo = 255;
    for (let y = cy - win; y <= cy + win; y++) for (let x = cx - win; x <= cx + win; x++) lo = Math.min(lo, f[y * w + x]);
    for (let k = 0; k < ringN; k++) {
      const a = (2 * Math.PI * k) / ringN;
      vals[k] = f[Math.round(cy + ring * Math.sin(a)) * w + Math.round(cx + ring * Math.cos(a))];
    }
    vals.sort((a, b) => a - b);
    sum += (vals[ringN / 2 - 1] + vals[ringN / 2]) / 2 - lo;
    n++;
  }
  return n ? sum / n : NaN;
}

/**
 * The frame of a stored run the console shows (index), or -1 without frames: the one marked as the reference on
 * the reference monitor (where the trainee picks the end-diastolic frame, as for QCA), else the frame on which the
 * route (`route`: the route's points on the run's image, as the co-registration places them) is most opacified,
 * judged against the local background (routeContrast), not the image's mean: the renderer's exposure control
 * makes a frame before the contrast arrives as dark on average as one at peak opacification. Without a route to
 * score, the darkest frame on average (sampled every 16th pixel).
 */
export function storedFrameIndex(run: Pick<StoredSeries, "id" | "frames"> & Partial<Pick<StoredSeries, "w" | "h" | "mmPerPxIso">>, route: readonly { x: number; y: number }[] = []): number {
  const n = run.frames.length;
  if (!n) return -1;
  const ref = useSeriesStore.getState().refFrame[run.id];
  if (ref !== undefined && ref >= 0 && ref < n) return ref;
  const w = run.w ?? 0,
    h = run.h ?? 0;
  if (route.length && w > 0 && h > 0 && run.frames[0].length >= w * h) {
    const pxPerMm = run.mmPerPxIso && run.mmPerPxIso > 0 ? 1 / run.mmPerPxIso : w / 200;
    const win = Math.max(1, Math.round(MP_COREG_WINDOW_MM * pxPerMm));
    const ring = Math.max(win + 2, Math.round(MP_COREG_RING_MM * pxPerMm));
    const step = Math.max(1, Math.ceil(route.length / COREG_POINTS));
    const pts = route.filter((_, i) => i % step === 0);
    let best = -1,
      bestScore = -Infinity;
    for (let k = 0; k < n; k++) {
      const c = routeContrast(run.frames[k], w, h, pts, win, ring);
      if (Number.isFinite(c) && c > bestScore) {
        bestScore = c;
        best = k;
      }
    }
    if (best >= 0) return best;
  }
  let best = 0,
    bestMean = Infinity;
  for (let k = 0; k < n; k++) {
    const f = run.frames[k];
    let sum = 0,
      c = 0;
    for (let i = 0; i < f.length; i += 16) {
      sum += f[i];
      c++;
    }
    const m = c ? sum / c : Infinity;
    if (m < bestMean) {
      bestMean = m;
      best = k;
    }
  }
  return best;
}

/**
 * Weight of the breathing shift at the aortic root, as the scene builder's rootW (src/render/xray/sceneBuilder.ts
 * buildXrayScene: breathing moves the heart more than the tethered root; not exported there).
 */
const SCENE_ROOT_W = 0.45;

/** The camera and iso-centre the live monitor rendered a stored run with (the table as it is now: a run does not store it). */
export function storedRunCamera(session: PressureSession, run: Pick<StoredSeries, "cArm" | "fieldCm">): { cam: XrayCamera; iso: Vec3 } {
  const tree = treeOf(session);
  const side = session.dual ? "both" : scen(session).side;
  const c = treeCentre(tree, side);
  const tbl = session.table?.state;
  const iso = tbl ? { x: c.x + tbl.x, y: c.y + tbl.y, z: c.z - tbl.height } : c;
  return { cam: makeCamera(run.cArm, iso, run.fieldCm * 10), iso };
}

/** A world point on the detector, uv -1..1 (as XrayRenderer.project). */
function detectorUv(cam: XrayCamera, p: Vec3): { u: number; v: number } {
  const n0 = { x: cam.detC.x - cam.src.x, y: cam.detC.y - cam.src.y, z: cam.detC.z - cam.src.z };
  const sid = Math.hypot(n0.x, n0.y, n0.z);
  const d = { x: p.x - cam.src.x, y: p.y - cam.src.y, z: p.z - cam.src.z };
  const along = Math.max(1, (d.x * n0.x + d.y * n0.y + d.z * n0.z) / sid);
  const mag = sid / along;
  const q = { x: cam.src.x + d.x * mag - cam.detC.x, y: cam.src.y + d.y * mag - cam.detC.y, z: cam.src.z + d.z * mag - cam.detC.z };
  const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
  return { u: dot(q, cam.detU) / dot(cam.detU, cam.detU), v: dot(q, cam.detV) / dot(cam.detV, cam.detV) };
}

/**
 * Place a heart-surface sample on a stored run's image (pixels, x right, y down): its rest position (diastole;
 * `o.motion`, a frame's heart motion, when it is known), moved by the held inspiration of a cine run as the scene
 * moves it, in the world frame of the patient's model, projected through the camera the run was rendered with.
 */
export function storedRunPlace(
  session: PressureSession,
  run: Pick<StoredSeries, "cArm" | "fieldCm" | "w" | "h" | "kind">,
  o: { motion?: Motion } = {}
): (s: Sample) => { x: number; y: number } {
  const { cam } = storedRunCamera(session, run);
  const H = session.g.tree.heart;
  // cine is filmed in held inspiration (sceneBuilder CINE_BREATH_HOLD); a stored fluoroscopy loop's breathing is not stored
  const resp = run.kind === "cine" ? CINE_BREATH_HOLD : 0;
  const shift = { x: 0, y: -0.85 * DIAPHRAGM_DESCENT * resp, z: 3 * resp };
  const model = session.model;
  return (s) => {
    const p0 = samplePos(H, s, o.motion);
    const w = SCENE_ROOT_W + (1 - SCENE_ROOT_W) * s.w;
    const p = { x: p0.x + shift.x * w, y: p0.y + shift.y * w, z: p0.z + shift.z * w };
    const q = detectorUv(cam, model ? toWorld(model, p) : p);
    return { x: ((q.u + 1) / 2) * run.w, y: ((1 - q.v) / 2) * run.h };
  };
}

/** Move the pressure wire and, while a pullback is recording, add the reading at the new sensor position. */
export function movePressureWire(session: PressureSession, mm: number): boolean {
  const s = scen(session);
  return applyPressureAction(session, "advance-wire", (st) => samplePullback(s, session.g, moveWire(s, session.g, st, mm), treeOf(session)));
}

const isPressure = (x: PressureSession) => x.st.wireKind === "pressure" && !!x.st.pressure;

export const binding: PciInputBinding = {
  device: "wire014",
  actions: {
    advance: ({ session }, mm) => {
      const x = session as unknown as PressureSession;
      if (!isPressure(x)) return false;
      return movePressureWire(x, Math.abs(mm));
    },
    withdraw: ({ session }, mm) => {
      const x = session as unknown as PressureSession;
      if (!isPressure(x)) return false;
      return movePressureWire(x, -Math.abs(mm));
    },
  },
};
