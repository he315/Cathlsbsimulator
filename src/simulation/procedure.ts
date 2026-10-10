// ---------------------------------------------------------------------------
// Wire and catheter navigation from the sheath to the aortic root.
//
// The route is the device-physics access lumen (access/route.ts, built on
// S7's lumen.ts): real lengths in millimetres, segments named after the
// arteries the wire passes. The 0.035-inch wire is a 1-D object along it:
// you push it (advance), torque it (the shaped tip turns with lag and
// overshoot), and some places only open with the right manoeuvre:
//   - a radial loop needs the tip aimed into the true lumen, or a hydrophilic
//     wire; forcing it buckles the wire, and forcing a hydrophilic wire can
//     perforate a small branch (forearm haematoma later);
//   - a tortuous subclavian straightens when the patient takes and holds a
//     deep breath;
//   - a tortuous iliac needs the tip aimed;
//   - at the junction with the aorta an arm wire turns down the descending
//     aorta unless it is aimed at the ascending aorta (aiming is easier in a
//     left anterior oblique view, where the arch opens up, and a deep breath
//     helps); a femoral wire can enter the left subclavian at the arch;
//   - the radial artery goes into spasm with rough handling, anxiety and
//     pain, and relaxes with an intra-arterial vasodilator and sedation;
//   - a segment marked as an obstruction (a scenario setting, set through
//     obstructSegment) never opens, whatever the manoeuvre: the wire that
//     reaches it stops, and pushing on buckles it and provokes spasm.
// A femoral route may start in either groin (access-multi-site): its label
// names the side of its geometry.
// The radial sequence (access-radial-sequence) adds three rules, labelled as
// rules: a radial loop can be made tight (a scenario setting, tightenLoop),
// which no 0.035 inch wire crosses, aimed or hydrophilic; balloon-assisted
// tracking (input.bat: a small balloon half out of the catheter tip, advanced
// with it) opens any loop and cannot perforate; and the artery's tone from
// the shared spasm model (radialSpasm.ts) can be a floor under the wire's
// own spasm (input.spasmFloor: the input diag-spasm-states couples; the full
// case does not pass it, so its wire behaves as before). Where a forced hydrophilic wire perforated is
// kept (perforationS), so the angiogram shows the extravasation there and a
// catheter can be brought across it.
// The crossover (access-cx-endovascular-control): buildCrossoverRoute walks
// route.ts's crossover route from one groin over the aortic bifurcation to
// the other. Its junction is the bifurcation: a wire passes over it only
// with its tip aimed into the other common iliac artery, and the tip can be
// aimed there only from a shaped catheter brought up to the bifurcation
// (input.hooked); any wire not so aimed goes straight on up the abdominal
// aorta (the wrong turn). The route has no aortic root: its far end is the
// other leg.
// The catheter follows over the wire and cannot lead it through the arm.
// This is a teaching abstraction of the wire, not a finite-element rod; the
// rod solver is used in the diagnostic lab.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyCase } from "../types";
import { clamp01 } from "../utils/math";
import { buildAnatomy, type AnatomyModel } from "./anatomy";
import { buildRoute3D, type CrossoverRoute3D, type Route3D, type SegmentId } from "./access/route";

export type Hazard = "none" | "loop" | "tortuous" | "spasm-prone" | "junction" | "obstruction";

export interface WireSegment {
  id: SegmentId;
  name: string;
  start: number; // mm from the sheath tip at segment entry
  end: number;
  hazard: Hazard;
  /** manoeuvre required to pass a hazard segment ('bat': only balloon-assisted tracking crosses it) */
  maneuver?: "torque" | "breath" | "bat";
  /** for a torque segment, the tip heading (rad) that finds the true lumen */
  targetHeading?: number;
  teach: string;
}

export interface Route {
  access: AccessRoute;
  /** the limb the route starts in (the groin of a femoral route) */
  side: "right" | "left";
  label: string;
  segments: WireSegment[];
  totalLength: number;
  /** pos at which the wire enters the ascending aorta */
  aortaStart: number;
  /** the junction with the aorta: aim towards `targetHeading`, otherwise the wire takes the wrong turn */
  junction: { atS: number; label: string; wrongLength: number; targetHeading: number } | null;
  /** the 3D geometry the fluoroscopy view draws */
  geom: Route3D;
  /** a crossover route over the aortic bifurcation (buildCrossoverRoute): its junction needs a hooked catheter */
  crossover?: boolean;
}

const TEACH: Record<SegmentId, string> = {
  radial: "The radial artery is small and spasms if handled roughly. Advance the wire gently and never force it.",
  loop: "A radial loop will not pass on a push. Turn the tip into the true lumen, then advance gently. Forcing it prolapses the loop; a hydrophilic wire crosses, but never push it against resistance.",
  brachial: "A straight run up the arm; the wire tracks easily.",
  subclavian: "The subclavian is often tortuous at the shoulder. A deep breath held by the patient drops the shoulder and straightens it.",
  innom: "The brachiocephalic trunk leads into the arch. Point the tip towards the ascending aorta, not down the descending aorta.",
  femoral: "The external iliac artery. Keep the soft J tip leading and watch it on fluoroscopy.",
  iliac: "The common iliac artery widens towards the aorta.",
  abd: "A free run up the abdominal aorta; keep the tip in view.",
  desc: "Follow the aorta up past the diaphragm.",
  arch: "Round the arch: the J tip naturally follows the outer curve into the ascending aorta. Watch for the head and neck vessels.",
  asc: "You are in the ascending aorta above the valve.",
  root: "Stop at the root; the catheter engages the coronary from here.",
  "aortic-bif": "The aortic bifurcation. Bring the shaped catheter up to it, turn its tip towards the other iliac artery, then lead over it with the wire.",
  cfa: "The common femoral artery, over the femoral head. Its bifurcation lies below.",
  sfa: "Below the femoral bifurcation.",
};

/** MODEL PARAMETERS of the wire model (facts/C5.md). */
export const MP_WIRE = {
  /** heading spring stiffness (1/s²) and damping ratio */
  headingK: 34,
  headingZeta: 0.5,
  /** aim window (rad) in an AP view, widened in LAO up to `aimWindowLao` at 30 degrees */
  aimWindow: 0.5,
  aimWindowLao: 0.85,
  /** resistance: free segment, hazard passed, hazard not passed */
  rFree: 0.08,
  rPassed: 0.2,
  rBlocked: 0.85,
  /** spasm: rise per mm advanced against resistance in the arm, rise per second from anxiety, relaxation per second */
  spasmPerMmWork: 0.012,
  spasmAnxietyPerS: 0.004,
  spasmRelaxPerS: 0.02,
  /** extra relaxation per second at a full vasodilator effect */
  spasmVasodilatorPerS: 0.25,
  /** spasm level that traps devices */
  spasmTrap: 0.75,
  /** hydrophilic wire forced against resistance in the arm: perforation chance per mm pushed */
  perforationPerMm: 0.02,
  /** buckle gain per mm pushed against a closed segment, and its release */
  bucklePerMm: 0.05,
};

/** Signed angular difference a-b wrapped to [-π, π]. */
function angDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Build the wire route for a case: real lengths from the access lumen, hazards from the variants. */
export function buildRoute(access: AccessRoute, caseData: AnatomyCase, model?: AnatomyModel, geom?: Route3D): Route {
  const m = model ?? buildAnatomy(caseData);
  const g = geom ?? buildRoute3D(access, caseData, m, 0);
  const has = (v: string) => caseData.variants.includes(v as never);
  const femoral = access === "femoral";
  const segments: WireSegment[] = g.segments.map((s) => {
    const seg: WireSegment = { id: s.id, name: s.name, start: s.start, end: s.end, hazard: "none", teach: TEACH[s.id] };
    if (s.id === "radial") seg.hazard = "spasm-prone";
    if (s.id === "loop") Object.assign(seg, { hazard: "loop", maneuver: "torque", targetHeading: 0.9 });
    if (s.id === "subclavian" && has("tortuous-subclavian")) Object.assign(seg, { hazard: "tortuous", maneuver: "breath" });
    if (s.id === "femoral" && has("tortuous-iliac")) Object.assign(seg, { hazard: "tortuous", maneuver: "torque", targetHeading: -0.8 });
    if (s.id === "iliac" && has("tortuous-iliac")) Object.assign(seg, { hazard: "tortuous", maneuver: "torque", targetHeading: 0.6 });
    if ((!femoral && s.id === "innom") || (femoral && s.id === "arch")) seg.hazard = "junction";
    return seg;
  });
  const side = access === "radial-left" ? "Left radial" : access === "radial-right" ? "Right radial" : g.side === "left" ? "Left femoral" : "Right femoral";
  const junction = g.wrong
    ? { atS: g.wrong.atS, label: g.wrong.label, wrongLength: g.wrong.path.cum[g.wrong.path.cum.length - 1] - g.wrong.atS, targetHeading: femoral ? 0 : -0.7 }
    : null;
  return { access, side: g.side, label: `${side} to aortic root`, segments, totalLength: g.path.cum[g.path.cum.length - 1], aortaStart: g.aortaStart, junction, geom: g };
}

/**
 * The wire route over the aortic bifurcation from one groin to the other (access-cx-endovascular-control), on
 * route.ts's crossover geometry. The bifurcation is the junction: aim the tip, from a shaped catheter hooked on it,
 * into the other common iliac artery (targetHeading), or the wire goes up the abdominal aorta.
 */
export function buildCrossoverRoute(g: CrossoverRoute3D): Route {
  const segments: WireSegment[] = g.segments.map((sg) => {
    const seg: WireSegment = { id: sg.id, name: sg.name, start: sg.start, end: sg.end, hazard: "none", teach: TEACH[sg.id] };
    if (sg.id === "aortic-bif") seg.hazard = "junction";
    return seg;
  });
  const total = g.path.cum[g.path.cum.length - 1];
  const w = g.wrong!;
  return {
    access: "femoral",
    side: g.side,
    label: `${g.side === "left" ? "Left" : "Right"} femoral over the bifurcation to the ${g.targetSide} leg`,
    segments,
    totalLength: total,
    aortaStart: g.aortaStart,
    junction: { atS: w.atS, label: w.label, wrongLength: w.path.cum[w.path.cum.length - 1] - w.atS, targetHeading: MP_CROSSOVER_WIRE.targetHeading },
    geom: g,
    crossover: true,
  };
}

/** MODEL PARAMETERS of the crossover wire: the tip heading (rad) that points over the bifurcation into the other iliac. */
export const MP_CROSSOVER_WIRE = { targetHeading: 1.2 } as const;

/**
 * Mark the route's segment `id` as an obstruction that no wire passes (a scenario setting: a radial
 * route the wire cannot cross, so the case has to cross over). Returns false when the route has no
 * such segment. The route object is changed in place.
 */
export function obstructSegment(route: Route, id: SegmentId): boolean {
  const seg = route.segments.find((s) => s.id === id);
  if (!seg) return false;
  seg.hazard = "obstruction";
  delete seg.maneuver;
  delete seg.targetHeading;
  // what the operator is told is what is felt, not why (the obstruction is the scenario's, not shown)
  seg.teach = "A puff of contrast through the sheath shows the vessel ahead.";
  return true;
}

/**
 * Make the route's radial loop tight (a scenario setting, access-radial-sequence): no 0.035 inch wire crosses it,
 * aimed or hydrophilic; only balloon-assisted tracking does. Returns false when the route has no loop. In place.
 */
export function tightenLoop(route: Route): boolean {
  const seg = route.segments.find((s) => s.id === "loop");
  if (!seg) return false;
  seg.maneuver = "bat";
  delete seg.targetHeading;
  seg.teach = "The wire will not go round this. Do not force it: image it, then cross it another way.";
  return true;
}

export function segmentAt(route: Route, pos: number): WireSegment {
  for (const s of route.segments) if (pos >= s.start && pos < s.end) return s;
  return route.segments[route.segments.length - 1];
}

export interface WireState {
  /** mm advanced from the sheath tip */
  pos: number;
  /** which path the tip is on: the route, or the wrong turn at the junction */
  branch: "main" | "wrong";
  buckle: number; // 0..1 stored proximal looping / prolapse
  spasm: number; // 0..1 radial constriction
  resistance: number; // 0..1 felt right now
  /** actual tip heading (rad); torque rotates it, with lag */
  heading: number;
  /** commanded heading at the operator's fingers */
  cmdHeading: number;
  hVel: number;
  /** stored twist not yet delivered to the tip */
  windup: number;
  /** transient whip when stored twist snaps free, 0..1 */
  whip: number;
  /** tip aimed into the true lumen of the current torque segment or junction */
  aimed: boolean;
  /** a small arm branch was perforated by a forced hydrophilic wire */
  perforation: boolean;
  /** where along the route it happened (mm from the sheath tip), once it has (access-radial-sequence) */
  perforationS?: number;
  /** the tip touches the valve or has prolapsed into the ventricle */
  lvContact: boolean;
  message: string;
  status: "ok" | "resist" | "buckle" | "spasm" | "aim" | "wrong" | "arrived";
  reachedAorta: boolean;
  reachedRoot: boolean;
}

export const initialWire = (): WireState => ({
  pos: 0,
  branch: "main",
  buckle: 0,
  spasm: 0,
  resistance: 0,
  heading: 0,
  cmdHeading: 0,
  hVel: 0,
  windup: 0,
  whip: 0,
  aimed: true,
  perforation: false,
  lvContact: false,
  message: "",
  status: "ok",
  reachedAorta: false,
  reachedRoot: false,
});

export interface WireInput {
  advance: number; // mm this step (negative = withdraw)
  torque: number; // rad of torque commanded this step
  breath: boolean; // the patient holds a deep breath
  hydrophilic: boolean;
  /** intra-arterial vasodilator effect at the radial artery now (0..1) */
  vasodilator?: number;
  /** patient anxiety (0..1) and sedation effect (0..1) */
  anxiety?: number;
  sedation?: number;
  /** current C-arm angle (deg, + LAO) */
  laoDeg?: number;
  /** deterministic random draw in [0, 1) for this step (perforation) */
  rand?: number;
  /** balloon-assisted tracking: a balloon half out of the catheter tip carries the wire through a loop (access-radial-sequence) */
  bat?: boolean;
  /** the radial artery's tone from the shared spasm model (radialSpasm.ts): the wire's spasm does not fall below it */
  spasmFloor?: number;
  /** a crossover route: the shaped catheter's tip is hooked on the bifurcation, so the wire tip can be aimed over it */
  hooked?: boolean;
}

export type WireEvent =
  | { kind: "segment"; id: SegmentId }
  | { kind: "wrong-turn"; label: string }
  | { kind: "back-on-route" }
  | { kind: "perforation" }
  | { kind: "spasm" }
  | { kind: "buckle" }
  | { kind: "lv-contact" }
  | { kind: "aorta" }
  | { kind: "root" };

/** Advance the wire one step. Pure and deterministic. */
export function stepWire(prev: WireState, route: Route, input: WireInput, dt: number): WireState & { events: WireEvent[] } {
  const events: WireEvent[] = [];
  const seg = segmentAt(route, prev.pos);
  const inArm = route.access !== "femoral";
  let pos = prev.pos;
  let branch = prev.branch;
  let buckle = prev.buckle;
  let spasm = prev.spasm;
  let perforation = prev.perforation;
  let perforationS = prev.perforationS;
  let status: WireState["status"] = "ok";
  let message = "";

  // --- torque to tip heading (underdamped spring: lags, then overshoots) ---
  const cmdHeading = prev.cmdHeading + input.torque;
  const kH = MP_WIRE.headingK;
  const cH = 2 * Math.sqrt(kH) * MP_WIRE.headingZeta;
  const hVel = prev.hVel + (kH * (cmdHeading - prev.heading) - cH * prev.hVel) * dt;
  const heading = prev.heading + hVel * dt;
  const windup = cmdHeading - heading;
  let whip = prev.whip * Math.pow(0.86, dt / 0.016);
  if (Math.abs(prev.windup) > 0.6 && Math.abs(windup) < 0.2) whip = Math.min(1, Math.abs(hVel) / 6);

  // --- aiming ---
  const lao = Math.max(0, Math.min(30, input.laoDeg ?? 0));
  const window = MP_WIRE.aimWindow + ((MP_WIRE.aimWindowLao - MP_WIRE.aimWindow) * lao) / 30;
  const j = route.junction;
  const nearJunction = !!j && branch === "main" && prev.pos > j.atS - 25 && prev.pos < j.atS + 2;
  const needsAim = (seg.maneuver === "torque" && seg.targetHeading !== undefined && !(input.bat && seg.hazard === "loop")) || nearJunction;
  const target = nearJunction ? j!.targetHeading : seg.targetHeading ?? 0;
  // over the aortic bifurcation the tip can be aimed only from a shaped catheter hooked on it
  const crossing = !!route.crossover;
  const aimed = needsAim ? Math.abs(angDiff(heading, target)) < window && !(crossing && nearJunction && !input.hooked) : true;

  // --- does the current segment open? ---
  let open = true;
  if (branch === "main") {
    if (seg.hazard === "obstruction") open = false;
    else if (seg.hazard === "loop" && input.bat) open = true;
    else if (seg.maneuver === "bat") open = false;
    else if (seg.hazard === "tortuous" && seg.maneuver === "breath") open = input.breath;
    else if (seg.maneuver === "torque") open = aimed || input.hydrophilic;
  }
  const radialLumen = 1 - 0.7 * spasm;
  const spasmDrag = inArm ? Math.max(0, spasm - 0.25) * 0.8 : 0;
  const base = branch === "wrong" ? MP_WIRE.rFree : seg.hazard === "none" || seg.hazard === "junction" || seg.hazard === "spasm-prone" ? MP_WIRE.rFree : open ? MP_WIRE.rPassed : MP_WIRE.rBlocked;
  let resistance = clamp01(base + spasmDrag + buckle * 0.4 + Math.abs(windup) * 0.18 + whip * 0.5);

  if (input.advance > 0) {
    if (open && resistance < 0.8 && radialLumen > 0.3) {
      const eff = input.advance * (1 - resistance * 0.6) * (1 - buckle * 0.5);
      // the junction: aimed (or helped by a deep breath) goes to the ascending aorta, otherwise the wrong turn
      if (j && branch === "main" && prev.pos < j.atS && prev.pos + eff >= j.atS) {
        const helped = aimed || (inArm && input.breath && Math.abs(angDiff(heading, target)) < window * 1.6);
        const strayFemoral = !inArm && !aimed && (input.hydrophilic || Math.abs(angDiff(heading, target)) > 1.5);
        // over the bifurcation only an aimed tip turns down the other iliac; anything else runs straight up the aorta
        if ((inArm && !helped) || strayFemoral || (crossing && !aimed)) {
          branch = "wrong";
          events.push({ kind: "wrong-turn", label: j.label });
        }
      }
      pos += eff;
      buckle = Math.max(0, buckle - input.advance * 0.02);
      if (resistance > 0.45) status = "resist";
      if (inArm) spasm = clamp01(spasm + input.advance * resistance * MP_WIRE.spasmPerMmWork);
    } else {
      // will not pass: the pushed length loops proximally; shoving an arm artery provokes spasm
      buckle = clamp01(buckle + input.advance * MP_WIRE.bucklePerMm);
      if (inArm) spasm = clamp01(spasm + input.advance * MP_WIRE.spasmPerMmWork * 1.6);
      if (input.hydrophilic && !input.bat && inArm && (seg.id === "radial" || seg.id === "loop" || seg.id === "brachial")) {
        const r = input.rand ?? 1;
        if (!perforation && r < input.advance * MP_WIRE.perforationPerMm) {
          perforation = true;
          perforationS = pos;
          events.push({ kind: "perforation" });
        }
      }
      status = needsAim && !aimed ? "aim" : seg.hazard === "loop" ? "buckle" : radialLumen <= 0.3 ? "spasm" : "resist";
      message =
        radialLumen <= 0.3
          ? "The wire will not move: the radial artery has clamped down."
          : needsAim && !aimed
          ? "The tip is not pointing into the lumen. Turn it, then advance."
          : seg.maneuver === "breath"
          ? `Resistance at the ${seg.name.toLowerCase()}. Ask the patient to take a deep breath and hold it.`
          : seg.maneuver === "bat"
          ? "Resistance. Do not force it."
          : `Resistance. Do not force it. ${seg.teach}`;
    }
  } else if (input.advance < 0) {
    pos = Math.max(0, pos + input.advance);
    buckle = Math.max(0, buckle + input.advance * 0.04);
    if (inArm && spasm > 0.4) spasm = clamp01(spasm + -input.advance * 0.004); // pulling through a spastic artery hurts too
  }

  // back on the route after withdrawing above the junction
  if (branch === "wrong" && j && pos < j.atS - 1) {
    branch = "main";
    events.push({ kind: "back-on-route" });
  }
  const maxPos = branch === "wrong" && j ? j.atS + j.wrongLength : crossing ? route.totalLength : route.totalLength + 6;
  pos = Math.min(pos, maxPos);

  if (buckle > 0.9) {
    pos = Math.max(0, pos - 3);
    buckle = 0.55;
    status = "buckle";
    events.push({ kind: "buckle" });
    message = "The wire is looping. Withdraw, then advance gently once the tip is aimed or the patient breathes.";
  }

  // spasm: anxiety drives it while devices are in the arm; vasodilators and sedation relax it
  if (inArm) {
    const anx = (input.anxiety ?? 0.4) * (1 - 0.7 * (input.sedation ?? 0));
    spasm = clamp01(spasm + dt * MP_WIRE.spasmAnxietyPerS * anx - dt * spasm * (MP_WIRE.spasmRelaxPerS + MP_WIRE.spasmVasodilatorPerS * (input.vasodilator ?? 0)));
    // the artery's own tone (radialSpasm.ts) is a floor under the wire's spasm
    if (input.spasmFloor !== undefined) spasm = Math.max(spasm, clamp01(input.spasmFloor));
  }
  if (spasm > MP_WIRE.spasmTrap && prev.spasm <= MP_WIRE.spasmTrap) events.push({ kind: "spasm" });
  if (spasm > MP_WIRE.spasmTrap) {
    status = "spasm";
    message = "The patient has forearm pain and the wire is gripped: radial spasm. Stop, and give an intra-arterial vasodilator through the sheath.";
  }

  const newSeg = segmentAt(route, pos);
  if (branch === "main" && newSeg.id !== seg.id) events.push({ kind: "segment", id: newSeg.id });
  resistance = clamp01(base + (inArm ? Math.max(0, spasm - 0.25) * 0.8 : 0) + buckle * 0.4 + Math.abs(windup) * 0.18 + whip * 0.5);
  // a crossover route has no aorta, root or valve at its end
  const reachedAorta = !crossing && branch === "main" && pos >= route.aortaStart;
  const reachedRoot = !crossing && branch === "main" && pos >= route.totalLength - 1.5;
  const lvContact = !crossing && branch === "main" && pos > route.totalLength + 2;
  if (reachedAorta && !prev.reachedAorta) events.push({ kind: "aorta" });
  if (reachedRoot && !prev.reachedRoot) events.push({ kind: "root" });
  if (lvContact && !prev.lvContact) events.push({ kind: "lv-contact" });
  if (branch === "wrong" && !message) {
    status = "wrong";
    message = j ? `The wire is going down the ${j.label}. Withdraw above the junction, turn the tip and advance again.` : "";
  } else if (lvContact && !message) message = "The wire is pushing on the valve: ectopic beats. Withdraw a little.";
  else if (reachedRoot && !message) {
    status = "arrived";
    message = "The wire is in the aortic root. Bring the catheter up over it.";
  } else if (!message) message = needsAim ? (crossing && nearJunction && !input.hooked ? "Bring the shaped catheter up to the bifurcation, then turn the wire tip over it." : "Turn the tip towards the lumen, then advance gently.") : newSeg.teach;

  return { pos, branch, buckle, spasm, resistance, heading, cmdHeading, hVel, windup, whip, aimed, perforation, ...(perforationS !== undefined ? { perforationS } : {}), lvContact, message, status, reachedAorta, reachedRoot, events };
}

// ---------------------------------------------------------------------------
// Catheter over the wire
// ---------------------------------------------------------------------------

export interface CatheterState {
  /** tip position along the route (mm from the sheath tip) */
  pos: number;
  resistance: number;
  message: string;
}

/** MODEL PARAMETERS of the catheter tracking. */
export const MP_CATH = {
  /** the catheter must stay this far behind the wire tip in the arm or the iliacs (mm) */
  leadMm: 15,
  /** extra resistance per unit spasm when the catheter is in the radial artery */
  spasmResistance: 1.1,
};

/**
 * Advance the catheter over the wire. It cannot lead the wire through the limb (it would scrape the wall); in the
 * ascending aorta it may go a little ahead once the wire is parked.
 */
export function stepCatheter(c: CatheterState, w: WireState, route: Route, advance: number, catheterOdMm: number, arteryMm: number): CatheterState & { spasmDelta: number } {
  const limit = w.branch === "main" ? (w.pos >= route.aortaStart ? Math.max(w.pos - 2, route.aortaStart) : w.pos - MP_CATH.leadMm) : Math.min(w.pos, route.junction?.atS ?? w.pos) - MP_CATH.leadMm;
  const inRadial = route.access !== "femoral" && c.pos < (route.segments.find((s) => s.id === "brachial")?.start ?? 0) + 40;
  const lumen = arteryMm * (1 - 0.7 * w.spasm);
  const tight = inRadial ? Math.max(0, catheterOdMm / Math.max(0.3, lumen) - 1) : 0;
  const resistance = clamp01(0.1 + tight * MP_CATH.spasmResistance + (route.access !== "femoral" ? w.spasm * 0.4 : 0));
  let pos = c.pos;
  let message = "";
  let spasmDelta = 0;
  if (advance > 0) {
    if (pos + advance > limit) {
      message = w.pos < route.aortaStart ? "Lead with the wire: advance the wire first, then follow it with the catheter." : "The catheter is at the wire tip.";
      pos = Math.max(pos, Math.min(limit, pos + advance));
    } else if (resistance > 0.85) {
      message = "The catheter is gripped in the radial artery. Stop and treat the spasm.";
      spasmDelta = advance * 0.01;
    } else {
      pos += advance * (1 - resistance * 0.5);
      if (route.access !== "femoral") spasmDelta = advance * resistance * 0.004;
    }
  } else if (advance < 0) pos = Math.max(0, pos + advance);
  return { pos, resistance, message, spasmDelta };
}
