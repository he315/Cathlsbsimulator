// ---------------------------------------------------------------------------
// Scripted manoeuvres, shared by manoeuvres.test.ts, the robustness matrix
// (robustness.ts, manoeuvres.matrix.test.ts) and later demonstrations. Each
// procedure only issues hand commands through scenarios.ts and reads the
// engagement classifier; nothing here moves a rod or decides an outcome.
//
// Every procedure is run from several starting positions (how far up the
// aorta the catheter is parked before it is advanced over the wire) and
// returns counts, because catheter work is sensitive to the start in the way
// real catheter work is.
// ---------------------------------------------------------------------------

import { innerDeviceSpec } from "./catheterShapes";
import * as S from "./scenarios";
import type { EngagementReading } from "./engagementClassifier";
import type { PhysicsEngine } from "./engine";
import type { AnatomyVariant, RootSize } from "../types";

export const STARTS = [50, 60, 70, 80, 90];
/** Twelve starts (45 to 100 mm), for reliability comparisons finer than one start in five. */
export const STARTS12 = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

/** Protocol switches (the robustness harness compares variants). */
/** jrWithdraw: gain (mm per mm of height error) of the operator's height correction during JR4 rotation; 0 = none. */
export const protocol = {
  jlWithdraw: true,
  jrWithdraw: 1,
  whipLoad: 8,
  backupPushes: 24,
  azTolDeg: 15,
  /** Judkins left / radial universal technique: hub turn per correction (rad) and step limit */
  jlTurn: 0.1,
  jlSteps: 24,
  /** to-and-fro amplitude (mm) used when the tip has not followed the last turn by jlStallDeg; 0 = never */
  jlJiggle: 0,
  /** direction the operator presents the curve in before seating (null: scenarios.LAO_LEFT) */
  jlFacing: null as [number, number, number] | null,
  jlStallDeg: 2,
  jrSteps: 22,
  /** Amplatz technique: the curve counts as seated in the sinus while its lowest point is within alSeatMm of the valve plane; advance and withdrawal per 0.5 s step (mm); step limit */
  alSeatMm: 12,
  alAdvance: 1.5,
  alWithdraw: 1,
  alSteps: 30,
};

/** Engaged: the tip is inside the vessel lumen beyond the ostium (same rule on both sides). */
export const engagedLm = (r: EngagementReading) => r.ostium === "lm" && r.depthMm > 0;
export const engagedRca = (r: EngagementReading) => r.ostium === "rca" && r.depthMm > 0;

/** Catheter over the J wire from the right femoral artery into the root, wire withdrawn; null if it never reached the root. */
export function femoralInRoot(cath: string, tipBack: number, root: RootSize = "normal", facing?: [number, number, number]): PhysicsEngine | null {
  const eng = S.makeEngine("femoral", root);
  S.parkOverWire(eng, cath, { tipBack, facing });
  if (!S.advanceToRoot(eng)) return null;
  S.withdrawWire(eng);
  return eng;
}

/**
 * Standard Judkins left technique ("minimal manipulation"): in the root with the wire out, the
 * operator watches the tip on fluoroscopy and makes small corrections every 0.5 s:
 * - height: above the expected level of the left main, a small advance; below it, a small
 *   withdrawal (at most 2 mm); at the level, a gentle 1 mm advance;
 * - direction: when the tip sits more than 25° away from the expected direction of the left main
 *   around the root, a small turn (0.1 rad) towards it.
 * The operator does not see the ostium (no contrast). The expected level and direction are the
 * anatomy's left main height minus 1 mm and its azimuth, standing for what an operator knows of the
 * usual ostial position. With protocol.jlWithdraw false the operator only advances (2 mm per step),
 * the earlier open-loop script.
 */
export function judkinsLeftTechnique(eng: PhysicsEngine, closedLoop = protocol.jlWithdraw, steps = protocol.jlSteps): EngagementReading[] {
  const first = eng.classify()!;
  if (engagedLm(first)) return [first];
  if (!closedLoop) return [first, ...S.runTrajectory(eng, { pushMm: 2, steps: 15, dt: 0.5, until: engagedLm })];
  const lm = eng.scene.model.lm;
  const target = lm.pos.y - 1;
  const azLm = Math.atan2(lm.pos.z, lm.pos.x);
  const out = [first];
  let prevAz = NaN;
  let turned = false;
  for (let i = 0; i < steps; i++) {
    const tip = S.tipOf(eng);
    const err = tip[1] - target;
    const push = Math.abs(err) < 1 ? 1 : Math.max(-2, Math.min(2, err));
    let dAz = azLm - Math.atan2(tip[2], tip[0]);
    while (dAz > Math.PI) dAz -= 2 * Math.PI;
    while (dAz < -Math.PI) dAz += 2 * Math.PI;
    const az = Math.atan2(tip[2], tip[0]);
    // the tip did not follow the last turn (torque held up in the shaft)
    const stalled = turned && Math.abs(az - prevAz) < (protocol.jlStallDeg * Math.PI) / 180;
    prevAz = az;
    turned = Math.abs(dAz) > (protocol.azTolDeg * Math.PI) / 180;
    // clockwise (positive) carries the tip towards increasing azimuth
    if (turned) eng.command({ kind: "torque", device: "catheter", rad: protocol.jlTurn * Math.sign(dAz) });
    if (stalled && protocol.jlJiggle > 0) {
      // a small to-and-fro movement while turning frees the curve from the wall and lets the stored torque reach the tip
      eng.command({ kind: "push", device: "catheter", mm: push + protocol.jlJiggle });
      eng.step(0.25);
      eng.command({ kind: "push", device: "catheter", mm: -protocol.jlJiggle });
      eng.step(0.25);
    } else {
      eng.command({ kind: "push", device: "catheter", mm: push });
      eng.step(0.5);
    }
    const r = eng.classify()!;
    out.push(r);
    if (engagedLm(r)) break;
  }
  return out;
}

export interface Jl4Result {
  starts: number;
  reachedRoot: number;
  engaged: number;
  enteredRca: number;
  enteredLv: number;
}

export function jl4Engagement(cath = "JL4", root: RootSize = "normal", starts = STARTS): Jl4Result {
  const r: Jl4Result = { starts: starts.length, reachedRoot: 0, engaged: 0, enteredRca: 0, enteredLv: 0 };
  for (const back of starts) {
    const eng = femoralInRoot(cath, back, root, protocol.jlFacing ?? undefined);
    if (!eng) continue;
    r.reachedRoot++;
    const tr = judkinsLeftTechnique(eng);
    if (tr.some(engagedLm)) r.engaged++;
    if (tr.some((x) => x.ostium === "rca")) r.enteredRca++;
    if (tr.some((x) => x.inLV)) r.enteredLv++;
  }
  return r;
}

export interface DeepSeatResult {
  /** start (tip back, mm) at which the catheter first engaged, or null */
  start: number | null;
  depth0: number;
  deepest: number;
  deep: boolean;
  /** the tip stayed in the target vessel throughout the push */
  stayed: boolean;
  inLv: boolean;
}

/**
 * Deep seating: once the left main (or the RCA) is engaged with the standard technique (the first
 * start that engages at least 2 mm into the vessel), the catheter is pushed on, 2 mm per 0.5 s for 8 steps (left) or 1 mm per
 * 0.5 s (right), and the depth along the vessel is recorded.
 */
export function deepSeat(cath: string, ostium: "lm" | "rca", starts = STARTS): DeepSeatResult {
  for (const back of starts) {
    const eng = femoralInRoot(cath, back);
    if (!eng) continue;
    const tr = ostium === "lm" ? judkinsLeftTechnique(eng) : jr4Technique(eng, 0.15);
    const at = tr[tr.length - 1];
    // a stably engaged catheter: at least 2 mm into the vessel
    if (!(ostium === "lm" ? engagedLm(at) : engagedRca(at)) || at.depthMm < 2) continue;
    const side = ostium === "lm" ? "left" : "right";
    const pushed = S.runTrajectory(eng, { pushMm: ostium === "lm" ? 2 : 1, steps: 8, dt: 0.5 });
    const depths = pushed.filter((r) => r.side === side).map((r) => r.depthMm);
    return {
      start: back,
      depth0: at.depthMm,
      deepest: depths.length ? Math.max(...depths) : at.depthMm,
      deep: pushed.some((r) => r.deep),
      stayed: pushed.every((r) => r.side === side),
      inLv: pushed.some((r) => r.inLV),
    };
  }
  return { start: null, depth0: 0, deepest: 0, deep: false, stayed: false, inLv: false };
}

/**
 * Judkins right technique: the tip is brought up from the cusp to the ostial level, then the hub is
 * turned slowly (0.15 rad per 0.5 s, up to 22 steps: 3.3 rad, about half a turn). The operator watches the tip on fluoroscopy and keeps it at the
 * ostial level with small advances or withdrawals (at most 1.5 mm per step): a turning JR4 tip dives
 * towards the valve, so in practice this is "gentle clockwise torque while slowly withdrawing". The
 * operator does not see the ostium (no contrast); the level held is the expected ostial height,
 * 2 mm below the anatomy's RCA ostium.
 */
export function jr4Technique(eng: PhysicsEngine, torque: number, gain = protocol.jrWithdraw): EngagementReading[] {
  S.moveTipToHeight(eng, 12, -1.5, 40);
  const target = eng.scene.model.rca.pos.y - 2;
  const out: EngagementReading[] = [];
  for (let i = 0; i < protocol.jrSteps; i++) {
    const y = S.tipOf(eng)[1];
    const push = gain > 0 ? Math.max(-1.5, Math.min(1.5, gain * (y - target))) : 0;
    if (torque) eng.command({ kind: "torque", device: "catheter", rad: torque });
    if (push) eng.command({ kind: "push", device: "catheter", mm: push });
    eng.step(0.5);
    const r = eng.classify()!;
    out.push(r);
    if (engagedRca(r)) break;
  }
  return out;
}

export interface Jr4Result {
  starts: number;
  clockwise: number;
  anticlockwise: number;
  still: number;
  /** hub rotation (rad) at engagement for the clockwise starts that engaged */
  rotationAtEngagement: number[];
}

export function jr4Torque(starts = STARTS, withdraw = protocol.jrWithdraw): Jr4Result {
  const r: Jr4Result = { starts: starts.length, clockwise: 0, anticlockwise: 0, still: 0, rotationAtEngagement: [] };
  for (const back of starts) {
    let eng = femoralInRoot("JR4", back);
    if (eng) {
      const tr = jr4Technique(eng, 0.15, withdraw);
      if (tr.some(engagedRca)) {
        r.clockwise++;
        r.rotationAtEngagement.push(0.15 * tr.length);
      }
    }
    eng = femoralInRoot("JR4", back);
    if (eng && jr4Technique(eng, -0.15, withdraw).some(engagedRca)) r.anticlockwise++;
    eng = femoralInRoot("JR4", back);
    if (eng && jr4Technique(eng, 0, withdraw).some(engagedRca)) r.still++;
  }
  return r;
}

/** Over-torque: a JR4 turned steadily clockwise (1.2 rad/s) stores twist and releases it as a tip jump. */
export function overTorque(back = 50, load = protocol.whipLoad): { peakTorsion: number; whip: boolean; jumpDeg: number } {
  const eng = femoralInRoot("JR4", back);
  if (!eng) return { peakTorsion: 0, whip: false, jumpDeg: 0 };
  S.moveTipToHeight(eng, 12, -1.5, 40);
  // the catheter is kept loaded (pushed a few mm into the sinus), as when an operator turns a
  // catheter whose tip is caught against the sinus wall
  if (load) {
    eng.command({ kind: "push", device: "catheter", mm: load });
    eng.step(0.3);
  }
  let prevAz = S.tipAzimuth(eng);
  let peak = 0;
  let jump = 0;
  for (let i = 0; i < 160; i++) {
    eng.command({ kind: "torque", device: "catheter", rad: 0.06 });
    eng.step(0.05);
    const cat = eng.readDevice(eng.catheter!);
    peak = Math.max(peak, Math.abs(cat.reaction.torsion));
    const az = S.tipAzimuth(eng);
    let d = az - prevAz;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    prevAz = az;
    // the hub turned 3.4° in this step; a tip jump four times that is a release of stored twist
    if (Math.abs(d) > 4 * 3.4 && peak > 0.5) {
      jump = Math.abs(d);
      return { peakTorsion: peak, whip: true, jumpDeg: jump };
    }
  }
  return { peakTorsion: peak, whip: false, jumpDeg: jump };
}

/** Pushing too far: a JR4 caught in the left sinus, pushed 8 mm at a time, folds onto the valve. */
export function prolapse(starts = [50, 70, 90]): { starts: number; prolapsedAtStart: number; prolapsed: number } {
  let prolapsed = 0, atStart = 0;
  for (const back of starts) {
    const eng = femoralInRoot("JR4", back);
    if (!eng) continue;
    if (eng.classify()!.prolapsed) {
      atStart++;
      continue;
    }
    if (S.runTrajectory(eng, { pushMm: 8, steps: 10, dt: 0.6, until: (r) => r.prolapsed }).some((r) => r.prolapsed)) prolapsed++;
  }
  return { starts: starts.length, prolapsedAtStart: atStart, prolapsed };
}

export interface BackupResult {
  starts: number;
  engaged: number;
  /** the guide tip retreated at least 3 mm along the vessel, or left it */
  backedOut: number;
  /** in the control the guide stayed in the vessel and moved less than 1.5 mm */
  controlStayed: number;
  /** per engaged start: depth before, smallest depth while pushing (−Infinity = left the vessel), control depth change */
  detail: { depth0: number; minDepth: number; controlChange: number }[];
}

/**
 * Guide back-up: a guide engaged in the left main; a stiff device shaft is pushed out of it, 8 mm per
 * 0.5 s for 12 s, on until it meets resistance (the closed distal end of the modelled coronary lumen
 * stands in for a lesion). The compressed device opens the guide's curves and the guide backs out:
 * its tip retreats along the vessel (by at least 3 mm) or leaves it. In the control (same time, no
 * push) it stays.
 */
export function guideBackup(guide = "JL4G", starts = [60, 75, 90], pushes = protocol.backupPushes): BackupResult {
  const r: BackupResult = { starts: starts.length, engaged: 0, backedOut: 0, controlStayed: 0, detail: [] };
  for (const back of starts) {
    const eng = femoralInRoot(guide, back);
    if (!eng) continue;
    const tr = judkinsLeftTechnique(eng);
    if (!engagedLm(tr[tr.length - 1])) continue;
    // let the guide settle at the ostium (no push)
    S.runTrajectory(eng, { steps: 2, dt: 0.5 });
    if (!engagedLm(eng.classify()!)) continue;
    r.engaged++;
    eng.removeWire();
    eng.loadWire(innerDeviceSpec(), { advance: -60, slot: "balloon" });
    eng.step(0.5);
    const depth0 = eng.classify()!.depthMm;
    const snap = eng.snapshot();
    for (let i = 0; i < pushes; i++) eng.step(0.5);
    const ctl = eng.classify()!;
    const controlChange = ctl.side === "left" ? ctl.depthMm - depth0 : -Infinity;
    if (ctl.side === "left" && Math.abs(controlChange) < 1.5) r.controlStayed++;
    eng.restore(snap);
    let minDepth = depth0;
    for (let i = 0; i < pushes; i++) {
      eng.command({ kind: "push", device: "balloon", mm: 8 });
      eng.step(0.5);
      const c = eng.classify()!;
      minDepth = Math.min(minDepth, c.side === "left" && c.vessel ? c.depthMm : -Infinity);
      if (minDepth === -Infinity) break;
    }
    if (minDepth <= depth0 - 3) r.backedOut++;
    r.detail.push({ depth0, minDepth, controlChange });
  }
  return r;
}

/**
 * Radial universal (Tiger-type) catheter from the right radial artery to the left main: over the J
 * wire into the root, wire out, then the same closed-loop corrections as the Judkins left technique
 * (small advances or withdrawals to the expected ostial level, small turns towards the expected
 * direction of the left main). The net hub rotation used is reported (negative = anticlockwise; the
 * Oxford notes describe anticlockwise rotation for the left coronary with this catheter).
 */
export function tigerLeft(starts = [40, 50, 60, 70, 80]): { starts: number; reachedRoot: number; engaged: number; netRotation: number[] } {
  const r = { starts: starts.length, reachedRoot: 0, engaged: 0, netRotation: [] as number[] };
  for (const back of starts) {
    const eng = S.makeEngine("radial-right", "normal");
    S.parkOverWire(eng, "TIG", { tipBack: back, facing: S.LAO_LEFT });
    if (!S.advanceToRoot(eng, 24, 4, 80)) continue;
    r.reachedRoot++;
    S.withdrawWire(eng);
    const roll0 = eng.catheter!.hubRoll;
    const tr = judkinsLeftTechnique(eng, true, 30);
    if (tr.some(engagedLm)) {
      r.engaged++;
      r.netRotation.push(eng.catheter!.hubRoll - roll0);
    }
  }
  return r;
}

/**
 * Amplatz technique for the left coronary (facts I3: Johnson Francis, "pushing the catheter will
 * cause disengagement and pulling the catheter will cause deeper engagement of the Amplatz
 * catheter"; the curve is seated in the left sinus and the tip is brought to the ostium from below).
 * In the root with the wire out, every 0.5 s the operator, watching the tip on fluoroscopy:
 * - pulls back 3 mm when the tip has dropped through the valve;
 * - re-seats the curve with a 2 mm advance when the curve has lifted out of the sinus (its lowest
 *   point more than alSeatMm above the valve plane);
 * - otherwise advances 1.5 mm while the tip is below the expected ostial level (the tip rides up
 *   the sinus wall) and withdraws 1 mm once it is at or above it (the tip turns down and outwards,
 *   into the ostium);
 * - turns 0.1 rad towards the expected direction of the left main when the tip is more than 15°
 *   away, as in the Judkins left technique.
 * The level is the anatomy's left main height minus 1 mm; the operator does not see the ostium.
 */
export function amplatzLeftTechnique(eng: PhysicsEngine, steps = protocol.alSteps): EngagementReading[] {
  const first = eng.classify()!;
  if (engagedLm(first)) return [first];
  const lm = eng.scene.model.lm;
  const target = lm.pos.y - 1;
  const azLm = Math.atan2(lm.pos.z, lm.pos.x);
  const out = [first];
  for (let i = 0; i < steps; i++) {
    const tip = S.tipOf(eng);
    const seated = lowestDistal(eng, 80) - eng.scene.model.valvePlaneY <= protocol.alSeatMm;
    // a tip that has dropped through the valve is pulled back first
    const push = out[out.length - 1].inLV ? -3 : !seated ? 2 : tip[1] < target ? protocol.alAdvance : -protocol.alWithdraw;
    eng.command({ kind: "push", device: "catheter", mm: push });
    let dAz = azLm - Math.atan2(tip[2], tip[0]);
    while (dAz > Math.PI) dAz -= 2 * Math.PI;
    while (dAz < -Math.PI) dAz += 2 * Math.PI;
    if (Math.abs(dAz) > (protocol.azTolDeg * Math.PI) / 180) eng.command({ kind: "torque", device: "catheter", rad: 0.1 * Math.sign(dAz) });
    eng.step(0.5);
    const r = eng.classify()!;
    out.push(r);
    if (engagedLm(r)) break;
  }
  return out;
}

/** Lowest height (y) of the catheter's distal `len` mm (what the operator sees of the curve in the sinus). */
export function lowestDistal(eng: PhysicsEngine, len: number): number {
  const r = eng.readDevice(eng.catheter!);
  let lo = Infinity, u = 0;
  for (let k = r.count - 1; k > 0 && u < len; k--) {
    lo = Math.min(lo, r.nodes[3 * k + 1]);
    u += Math.hypot(r.nodes[3 * k] - r.nodes[3 * k - 3], r.nodes[3 * k + 1] - r.nodes[3 * k - 2], r.nodes[3 * k + 2] - r.nodes[3 * k - 1]);
  }
  return lo;
}

/** An Amplatz catheter over the J wire from the femoral route into the root, wire withdrawn (as femoralInRoot). */
export function amplatzInRoot(cath: string, tipBack: number, root: RootSize = "normal"): PhysicsEngine | null {
  return femoralInRoot(cath, tipBack, root);
}

export interface AmplatzResult extends Jl4Result {
  /** engaged starts in which the classifier called the seated catheter prolapsed */
  prolapsedWhileEngaged: number;
  /** readings (over all starts) with the catheter seated in the cusp before engagement that were called prolapsed */
  prolapsedSeated: number;
  /** per engaged start: depth at engagement, after a 3 mm withdrawal, and after a 6 mm push */
  paradox: { depth0: number; afterPull: number; afterPush: number; pushedOut: boolean }[];
}

/**
 * Amplatz left engagement from the standard starts, with the paradoxical response checked in each
 * engaged start: a 3 mm withdrawal (1 mm per 0.5 s) and, from the same state, a 6 mm push.
 */
export function amplatzEngagement(cath = "AL1", root: RootSize = "normal", starts = STARTS): AmplatzResult {
  const r: AmplatzResult = { starts: starts.length, reachedRoot: 0, engaged: 0, enteredRca: 0, enteredLv: 0, prolapsedWhileEngaged: 0, prolapsedSeated: 0, paradox: [] };
  for (const back of starts) {
    const eng = amplatzInRoot(cath, back, root);
    if (!eng) continue;
    r.reachedRoot++;
    const tr = amplatzLeftTechnique(eng);
    r.prolapsedSeated += tr.filter((x) => x.prolapsed && !x.inLV).length;
    if (tr.some((x) => x.ostium === "rca")) r.enteredRca++;
    if (tr.some((x) => x.inLV)) r.enteredLv++;
    const at = tr[tr.length - 1];
    // an empty trajectory (the technique gave up at once) is a start that did not engage
    if (!at || !engagedLm(at)) continue;
    r.engaged++;
    eng.step(0.5);
    const settled = eng.classify()!;
    if (settled.prolapsed) r.prolapsedWhileEngaged++;
    const snap = eng.snapshot();
    const pulled = S.runTrajectory(eng, { pushMm: -1, steps: 3, dt: 0.5 });
    const afterPull = pulled[pulled.length - 1];
    eng.restore(snap);
    const pushed = S.runTrajectory(eng, { pushMm: 2, steps: 3, dt: 0.5 });
    const afterPush = pushed[pushed.length - 1];
    r.paradox.push({
      depth0: settled.depthMm,
      afterPull: afterPull.side === "left" && afterPull.vessel ? afterPull.depthMm : -Infinity,
      afterPush: afterPush.side === "left" && afterPush.vessel ? afterPush.depthMm : -Infinity,
      pushedOut: !engagedLm(afterPush),
    });
  }
  return r;
}

// ---------------------------------------------------------------------------
// The engagement technique set (diag-engagement-technique-set). The module
// text these procedures follow (src/content/manual/pci-manual/07-engaging.ts):
// - femoral left main over the looped J wire (Brilakis): "Bring the catheter
//   over the wire until its tip lies 2–3 cm above the floor of the right
//   coronary cusp, level with the upward limb of the J" (:489), withdraw the
//   wire and let the catheter fold into the left cusp (:605, :1470); a tip
//   pushed down onto the floor of the right cusp only goes deeper there (:497);
// - the right radial left set: a JL3.5 (or a universal curve) from the right
//   radial (Oxford, 06-to-the-root.ts:350, :453), engaged with the same small
//   corrections as the Judkins left technique;
// - a short left main, where a JL keeps entering the LAD and one size larger
//   usually reaches the circumflex (Oxford, :551-560, :608).
// Heights, step sizes and counts below are MODEL PARAMETERS of the scripted
// operator (docs/realism/facts/pkg-diag-engagement-technique-set.md).
// ---------------------------------------------------------------------------

/** Options shared by the engagement-set procedures: the root, the starts and the geometry (the frozen fixture, or the live app anatomy). */
export interface EngagementSetOpts {
  root?: RootSize;
  starts?: readonly number[];
  /** the live anatomy.ts / thorax.ts geometry instead of the frozen fixture */
  live?: boolean;
  variants?: AnatomyVariant[];
}

/** The right radial starts (mm of the tip back from the top of the root), as tigerLeft uses. */
export const RADIAL_STARTS = [40, 50, 60, 70, 80];

export interface RadialLeftResult extends Jl4Result {
  /** the vessel holding the tip when it first engaged, per engaged start */
  vessels: (string | null)[];
}

/**
 * A left catheter from the right radial artery to the left main: over the J wire into the root (the
 * radial approach steps of tigerLeft), wire out, then the Judkins left technique's closed-loop
 * corrections (30 steps). Counts the starts that reach the root, engage the left main, or enter the
 * RCA or the ventricle on the way.
 */
export function radialLeftEngagement(cath: string, o: EngagementSetOpts = {}): RadialLeftResult {
  const starts = o.starts ?? RADIAL_STARTS;
  const r: RadialLeftResult = { starts: starts.length, reachedRoot: 0, engaged: 0, enteredRca: 0, enteredLv: 0, vessels: [] };
  for (const back of starts) {
    const eng = S.makeEngine("radial-right", o.root ?? "normal", {}, o.variants ?? [], !!o.live);
    S.parkOverWire(eng, cath, { tipBack: back, facing: S.LAO_LEFT });
    if (!S.advanceToRoot(eng, 24, 4, 80)) continue;
    r.reachedRoot++;
    S.withdrawWire(eng);
    const tr = judkinsLeftTechnique(eng, true, 30);
    const hit = tr.find(engagedLm);
    if (hit) {
      r.engaged++;
      r.vessels.push(hit.vessel);
    }
    if (tr.some((x) => x.ostium === "rca")) r.enteredRca++;
    if (tr.some((x) => x.inLV)) r.enteredLv++;
  }
  return r;
}

/** The parked heights of the looped-wire technique: 2–3 cm above the floor of the right cusp, and on the floor (mm above the valve plane). */
export const FOLD_PARK = { aboveMm: 20, floorMm: 3 };

/** Scripted operator of the looped-wire technique (MODEL PARAMETERS): wire advance per step until its tip is within loopMm of the valve plane, the catheter's height tolerance, and its step limit. */
export const FOLD_PROTOCOL = { wireStepMm: 4, wireSteps: 30, loopMm: 4, heightTolMm: 1.5, heightSteps: 40, cathStepMaxMm: 3 };

export interface FoldOverResult {
  starts: number;
  reachedRoot: number;
  /** after the wire was withdrawn the tip lay in the left half of the root: nearer the left main than the RCA, out of the ventricle */
  foldedLeft: number;
  /** the Judkins left technique then engaged the left main */
  engagedAfter: number;
  enteredLv: number;
}

/**
 * Femoral left main over a J wire looped on the aortic valve (Brilakis, pm-engaging-left): the
 * catheter is advanced over the wire into the root; the wire is advanced until its J reaches the valve
 * and loops there; with the wire held, the catheter is brought to `parkMm` above the valve plane; the
 * wire is withdrawn and the curve re-forms. The tip's place is then read (foldedLeft), and the Judkins
 * left technique is run from there (engagedAfter).
 */
export function foldOverJWire(cath = "JL4", parkMm: number = FOLD_PARK.aboveMm, o: EngagementSetOpts = {}): FoldOverResult {
  const starts = o.starts ?? STARTS;
  const P = FOLD_PROTOCOL;
  const r: FoldOverResult = { starts: starts.length, reachedRoot: 0, foldedLeft: 0, engagedAfter: 0, enteredLv: 0 };
  for (const back of starts) {
    const eng = S.makeEngine("femoral", o.root ?? "normal", {}, o.variants ?? [], !!o.live);
    S.parkOverWire(eng, cath, { tipBack: back });
    if (!S.advanceToRoot(eng)) continue;
    r.reachedRoot++;
    const vp = eng.scene.model.valvePlaneY;
    const w = eng.wire!;
    // the J wire advanced until it meets the valve and loops there
    for (let k = 0; k < P.wireSteps; k++) {
      if (eng.readDevice(w).tip[1] < vp + P.loopMm) break;
      eng.command({ kind: "push", device: w.slot, mm: P.wireStepMm });
      eng.step(0.2);
    }
    // the wire held, the catheter brought to the parked height over it
    eng.command({ kind: "pin", device: w.slot, on: true });
    const target = vp + parkMm;
    for (let k = 0; k < P.heightSteps; k++) {
      const y = S.tipOf(eng)[1];
      if (Math.abs(y - target) < P.heightTolMm) break;
      eng.command({ kind: "push", device: "catheter", mm: Math.max(-P.cathStepMaxMm, Math.min(P.cathStepMaxMm, y - target)) });
      eng.step(0.2);
    }
    eng.command({ kind: "pin", device: w.slot, on: false });
    S.withdrawWire(eng);
    const at = eng.classify()!;
    if (at.inLV) r.enteredLv++;
    if (!at.inLV && at.distanceToLm < at.distanceToRca) r.foldedLeft++;
    const tr = judkinsLeftTechnique(eng);
    if (tr.some(engagedLm)) r.engagedAfter++;
    if (tr.some((x) => x.inLV)) r.enteredLv++;
  }
  return r;
}

export interface ShortLmResult {
  starts: number;
  engaged: number;
  /** engaged starts in which a gentle seating push carried the tip into the LAD first, or into the circumflex first */
  lad: number;
  lcx: number;
  /** engaged starts that stayed at the left main (at the bifurcation of a short left main, whose injection fills both branches) */
  stayedLm: number;
}

/** The gentle seating push after engagement in the short left main (MODEL PARAMETERS): mm per 0.5 s step, and steps. */
export const SHORT_LM_SEAT = { pushMm: 1, steps: 6 };

/**
 * A Judkins left in a short left main (the 'short-lm' variant, live geometry): engaged with the
 * standard technique (femoral, or the right radial approach), then seated with a gentle push
 * (SHORT_LM_SEAT); records which branch the tip enters first, if any.
 */
export function shortLmEntry(cath: string, route: "femoral" | "radial-right" = "femoral", o: EngagementSetOpts = {}): ShortLmResult {
  const starts = o.starts ?? STARTS12;
  const r: ShortLmResult = { starts: starts.length, engaged: 0, lad: 0, lcx: 0, stayedLm: 0 };
  for (const back of starts) {
    const eng = S.makeEngine(route, o.root ?? "normal", {}, ["short-lm", ...(o.variants ?? [])], true);
    S.parkOverWire(eng, cath, { tipBack: back, facing: S.LAO_LEFT });
    if (!(route === "femoral" ? S.advanceToRoot(eng) : S.advanceToRoot(eng, 24, 4, 80))) continue;
    S.withdrawWire(eng);
    const tr = judkinsLeftTechnique(eng, true, 30);
    const at = tr[tr.length - 1];
    // an empty trajectory (the technique gave up at once) is a start that did not engage
    if (!at || !engagedLm(at)) continue;
    r.engaged++;
    const seq = [at, ...S.runTrajectory(eng, { pushMm: SHORT_LM_SEAT.pushMm, steps: SHORT_LM_SEAT.steps, dt: 0.5 })];
    const first = seq.find((x) => x.vessel === "LAD" || x.vessel === "LCx")?.vessel;
    if (first === "LAD") r.lad++;
    else if (first === "LCx") r.lcx++;
    else r.stayedLm++;
  }
  return r;
}
