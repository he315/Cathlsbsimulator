// ---------------------------------------------------------------------------
// Guide actions: choice and exchange, engagement by hand from the aortic root,
// seating, turning off the ostium, guide extension, buddy wire and the
// back-up read-out.
//
// pci-guide-engagement: the hands move the guide (handGuide). Out of the
// ostium they drive the analytic engagement model of the diagnostic lab
// (classifyGuide in ../guide.ts) until the classifier reports a selective
// engagement of the case's coronary; the guide then settles at a seeded depth
// and coaxiality. Engaged, a push seats it deeper, a pull draws it back (and
// out of the ostium, dragging an unpinned wire with it), and a rotation turns
// it off the coaxial position and, far enough, off the ostium while the wire
// stays. Over a wire in the vessel a push takes the guide back in. Rotation
// that the shaft stores instead of passing to the tip is twist; too much
// kinks it. After every change the wire learns where the guide points it
// (guideWireAim) and whether the guide's tip lets it out (syncGuideWire).
// The engagement events the tips read are in src/ui/lab/pciEvents/guide.ts.
// ---------------------------------------------------------------------------

import { EXCHANGE_LENGTH_CM, cloneWire } from "../coronaryWire";
import { GUIDE_BY_ID, type GuideFrench, type GuideLengthCm } from "../equipment";
import {
  MP_TURN_OFF_RAD,
  MP_COAX_PER_RAD,
  MP_WIRE_DRAG_ON_PULL,
  backupForce,
  classifyGuide,
  coaxialFromAlignment,
  engage,
  engageRng,
  engagesSide,
  guideBlocksWire,
  guideCatheterType,
  guideSite,
  guideSpec,
  guideWireAim,
  initialGuide,
  releaseTwist,
  rootStart,
  seat,
  settleOnEngage,
  twistGuide,
  zoneOf,
  type GuideRoot,
  type GuideSite,
  type GuideState,
} from "../guide";
import type { AnatomyModel } from "../../anatomy";
import { log, syncWire, tele, type PciGeom, type PciScenario, type PciState } from "../state";
import { aortoOstial } from "./imaging";
import { moveWire } from "./wire";

/** Options of a guide choice: French size, length and side holes (the catalogue's). */
export interface GuideChoice {
  french?: GuideFrench;
  lengthCm?: GuideLengthCm;
  sideHoles?: boolean;
}

/** Choose a different guide (only with nothing in the coronary): it comes up to the aortic root. */
export function selectGuide(st: PciState, id: string, o: GuideChoice = {}): PciState {
  if (!GUIDE_BY_ID[id]) return st;
  if (st.tipMm > 0 || st.device) return log(st, "warn", "Withdraw the wire and devices before exchanging the guide.");
  const spec = GUIDE_BY_ID[id];
  const gs = initialGuide(id, false, o.french ?? st.guide.french, { lengthCm: o.lengthCm ?? st.guide.lengthCm, sideHoles: o.sideHoles ?? st.guide.sideHoles, side: st.guide.side });
  const w = { ...cloneWire(st.wire), guideEngaged: false, guideTurning: spec.curveTurning, aim: null, exitBlocked: false };
  const n = tele(syncWire({ ...st, guide: gs }, w), "guide-select", { id, french: gs.french, lengthCm: gs.lengthCm ?? 100, sideHoles: !!gs.sideHoles });
  return log(n, "info", `${spec.label} ${gs.french} Fr guide in the aortic root.`);
}

/** Cached geometry facts of the guide's site, per geometry and side. */
const SITES = new WeakMap<PciGeom, Partial<Record<"left" | "right", GuideSite>>>();
function siteOf(g: PciGeom, side: "left" | "right"): GuideSite {
  let m = SITES.get(g);
  if (!m) SITES.set(g, (m = {}));
  return (m[side] ??= guideSite(g, side));
}

/** The ostium the guide engages: its lumen and an aorto-ostial lesion's stenosis now. */
function withSite(gs: GuideState, s: PciScenario, g: PciGeom | undefined, st: PciState): GuideState {
  if (!g) return gs;
  const site = siteOf(g, s.side);
  const ostial = aortoOstial(s, g) ? Math.max(0, Math.min(0.99, st.severity / 100)) : 0;
  return { ...gs, ostiumMm: site.ostiumMm, ...(ostial > 0 ? { ostialStenosis: ostial } : {}) };
}

/**
 * Tell the wire what the guide does to it: where the guide points it as it leaves the tip (with the
 * geometry), the coronary it is seated in, and whether a guide sitting against the wall stops it.
 */
export function syncGuideWire(s: PciScenario, st: PciState, g?: PciGeom): PciState {
  const gs = st.guide;
  const aim = g ? guideWireAim(gs, s.side, siteOf(g, s.side)) : null;
  const home = s.side === "left" ? "LM" : "RCA";
  const blocked = guideBlocksWire(gs);
  const w0 = st.wire;
  if ((w0.aim ?? null) === aim && w0.home === home && !!w0.exitBlocked === blocked) return st;
  return syncWire(st, { ...cloneWire(w0), aim, home, exitBlocked: blocked });
}

/** Engage the guide in the ostium (or re-engage over the wire after a back-out): the assisted engagement. */
export function engageGuide(s: PciScenario, st: PciState, g?: PciGeom): PciState {
  const spec = guideSpec(st.guide);
  if (spec.side !== "both" && spec.side !== s.side) return log(st, "warn", `A ${spec.label} does not suit the ${s.side === "left" ? "left" : "right"} coronary.`);
  const overWire = st.tipMm > 5;
  const gs0 = engage(st.guide, overWire ? 0.8 : 0.85);
  // a guide the hands have moved carries engagement fields: they reset; a case's own guide stays as it was
  const moved = gs0.zone !== undefined || gs0.nearSince != null || !!gs0.offAxisRad;
  const gs = withSite(moved ? { ...gs0, zone: undefined, nearSince: null, offAxisRad: 0 } : gs0, s, g, st);
  const w = { ...cloneWire(st.wire), guideEngaged: true };
  let n = log(syncWire({ ...st, guide: gs }, w), "good", overWire ? "Guide re-engaged over the wire." : `${spec.label} engaged in the ostium.`);
  n = tele(n, "guide-engage", { depthMm: gs.depthMm, coaxial: gs.coaxial, overWire, assisted: true });
  return syncGuideWire(s, n, g);
}

/**
 * Turn an engaged guide's tip by tipRad: it leaves its coaxial position (MP_COAX_PER_RAD) and, past
 * MP_TURN_OFF_RAD, the ostium. Returns the guide and whether it has turned off (still engaged then; the
 * caller takes it out of the ostium).
 */
function turnEngaged(gs: GuideState, tipRad: number): { gs: GuideState; off: boolean; offRad: number } {
  const off0 = gs.offAxisRad ?? 0;
  const off = off0 + tipRad;
  const coaxial = Math.max(0, Math.min(1, gs.coaxial - MP_COAX_PER_RAD * (Math.abs(off) - Math.abs(off0))));
  return { gs: { ...gs, offAxisRad: off, coaxial }, off: Math.abs(off) > MP_TURN_OFF_RAD, offRad: off };
}

/** Take a guide turned past MP_TURN_OFF_RAD off the ostium (the wire stays in the vessel). */
function turnOff(st: PciState, gs: GuideState, root?: GuideRoot): PciState {
  const off: GuideState = { ...gs, engaged: false, depthMm: -1, coaxial: 0, offAxisRad: 0, zone: "near", nearSince: st.t };
  if (root) off.root = root;
  let n: PciState = { ...st, guide: off };
  n = syncWire(n, { ...cloneWire(n.wire), guideEngaged: n.tipMm > 3 });
  return log(tele(n, "guide-disengage", { how: "turn" }), "info", n.tipMm > 3 ? "Guide turned off the ostium; the wire stays in the vessel." : "Guide turned off the ostium.");
}

/**
 * Rotation of the guide's hub: the share the shaft stores is twist (a kink past MP_KINK_TWIST_RAD, freed by
 * untwisting), the rest reaches the tip. Returns the state with the guide's twist and kink logged, and the
 * rotation that reached the tip.
 */
function twistStep(st: PciState, rad: number): { st: PciState; tipRad: number } {
  const wasKinked = !!st.guide.kinked;
  const r = twistGuide(st.guide, rad);
  let n: PciState = { ...st, guide: r.gs };
  if (r.gs.kinked && !wasKinked) {
    n = log(n, "danger", "The guide tip no longer follows the hub.");
    n = tele(n, "guide-kink", { twistRad: r.gs.twistRad ?? 0 });
  } else if (wasKinked && !r.gs.kinked) n = log(n, "info", "The guide tip follows the hub again.");
  return { st: n, tipRad: r.tipRad };
}

/**
 * The shaft's own bookkeeping of a hand movement when the rod physics moves the tip (PCI_ROD_GUIDE): the
 * rotation's stored twist and kink, and the twist an axial movement releases. The tip's rotation is the
 * physics'; it is not applied here.
 */
export function twistOnly(st: PciState, rad: number, mm = 0): PciState {
  if (st.finished) return st;
  let n = st;
  if (rad) n = twistStep(n, rad).st;
  if (mm && n.guide.twistRad) n = { ...n, guide: releaseTwist(n.guide, mm).gs };
  return n;
}

/**
 * Deep-seat (+) or withdraw (−) the guide. The movement releases stored twist into the tip, which turns
 * it off its coaxial position (and, far enough, off the ostium) before it seats.
 */
export function seatGuide(st: PciState, mm: number, s?: PciScenario, g?: PciGeom): PciState {
  if (!st.guide.engaged) return log(st, "warn", "The guide is not engaged.");
  const rel = releaseTwist(st.guide, mm);
  let gs0 = rel.gs;
  // a guide that started engaged (or was engaged without the geometry) learns its ostium now
  if (s && g && gs0.ostiumMm === undefined) gs0 = withSite(gs0, s, g, st);
  if (rel.tipRad) {
    const t = turnEngaged(gs0, rel.tipRad);
    if (t.off) {
      const n = turnOff(st, t.gs);
      return s ? syncGuideWire(s, n, g) : n;
    }
    gs0 = t.gs;
  }
  const gs = seat(gs0, mm);
  let n: PciState = { ...st, guide: gs };
  if (!gs.engaged) {
    n = log(n, "warn", "The guide has come out of the ostium.");
    n = syncWire(n, { ...cloneWire(n.wire), guideEngaged: n.tipMm > 3 });
    n = tele(n, "guide-disengage", { how: "pull" });
    // pulled back out of the ostium, the guide drags an unpinned wire with it
    if (s && g && mm < 0 && n.tipMm > 0 && !n.wire.pinned) {
      const drag = MP_WIRE_DRAG_ON_PULL * -mm;
      if (drag > 0.2) {
        const before = n.tipMm;
        n = moveWire(s, g, n, -drag);
        // the distance is for the debrief; the learner judges it from the image
        n = log(tele(n, "guide-drag-wire", { mm: Math.max(0, before - n.tipMm) }), "warn", "Pulling the guide back has drawn the wire back.");
      }
    }
  } else if (gs.depthMm > 3 && st.guide.depthMm <= 3) n = log(n, "warn", "The guide is deep-seated: more back-up, but watch the pressure and the ostium.");
  return s ? syncGuideWire(s, n, g) : n;
}

/** Where the hub has the tip of a guide that has just left the ostium: at the ostium's height, a little above, facing it. */
function rootAtOstium(model: AnatomyModel, gs: GuideState, side: "left" | "right", aboveMm: number, offRad = 0): GuideRoot {
  const cath = guideCatheterType(gs.id);
  const b = cath.behaviour;
  const os = side === "left" ? model.lm : model.rca;
  const gain = 0.55 + b.torqueResponse * 0.45;
  return { insertion: b.seatHeight - (os.height + aboveMm), torque: (os.az - b.naturalAzimuth) / gain + offRad / gain };
}

/** The case's own salt for an engagement's seeded settle: the case's device generator (not advanced) and the time. */
function saltOf(st: PciState, what: string): string {
  return `${what}:${st.rng?.s ?? 0}:${st.t.toFixed(2)}`;
}

/** One movement of the guide by the hands. */
export interface GuideHand {
  /** mm of hub travel (+ advance, − withdraw) */
  mm?: number;
  /** rad of hub rotation (+ clockwise seen from the operator) */
  rad?: number;
}

/**
 * The hands on the guide (pci-guide-engagement). Out of the ostium the analytic engagement model moves
 * the tip in the root and engages it when the classifier says so; engaged, a push seats it, a pull draws
 * it back and out, a rotation turns it off the coaxial position (and off the ostium). `model` is the
 * case's aortic root (the session's AnatomyModel); `g` gives the ostium and the wire's aim.
 */
export function handGuide(s: PciScenario, g: PciGeom | undefined, model: AnatomyModel, st0: PciState, hand: GuideHand): PciState {
  if (st0.finished) return st0;
  const mm = hand.mm ?? 0;
  const rad = hand.rad ?? 0;
  if (!mm && !rad) return st0;
  let st = st0;
  // rotation: some of it is stored in the shaft (twist), the rest reaches the tip
  let tipRad = 0;
  if (rad) {
    const r = twistStep(st, rad);
    st = r.st;
    tipRad += r.tipRad;
  }
  let gs = st.guide;
  // axial movement out of the ostium lets stored twist reach the tip (an engaged guide's seat does it in seatGuide)
  if (mm && !gs.engaged) {
    const r = releaseTwist(gs, mm);
    gs = r.gs;
    tipRad += r.tipRad;
  }
  st = { ...st, guide: gs };

  if (gs.engaged) {
    // a guide that started engaged (or was engaged without the geometry) learns its ostium now
    if (gs.ostiumMm === undefined) {
      gs = withSite(gs, s, g, st);
      st = { ...st, guide: gs };
    }
    // turning an engaged guide: off its coaxial position, and off the ostium past MP_TURN_OFF_RAD (the wire stays)
    if (tipRad) {
      const t = turnEngaged(gs, tipRad);
      if (t.off) return syncGuideWire(s, turnOff(st, t.gs, rootAtOstium(model, t.gs, s.side, 1, t.offRad)), g);
      gs = t.gs;
      st = { ...st, guide: gs };
    }
    if (mm) {
      // seatGuide releases the stored twist into the tip (turning it) and seats the guide
      st = seatGuide(st, mm, s, g);
      // out of the ostium (drawn back, or turned off by the released twist): the tip a little above it
      if (!st.guide.engaged) st = { ...st, guide: { ...st.guide, root: rootAtOstium(model, st.guide, s.side, 2), zone: "near", nearSince: st.t } };
    }
    return syncGuideWire(s, st, g);
  }

  // out of the ostium over a wire in the vessel: a push takes the guide back in along the wire
  if (mm > 0 && st.tipMm > 5 && gs.zone !== "lv") {
    const settled = settleOnEngage(gs, { depthMm: 0, coaxial: 0.85 }, engageRng(gs, saltOf(st, "over-wire")));
    st = { ...st, guide: withSite(settled, s, g, st) };
    st = syncWire(st, { ...cloneWire(st.wire), guideEngaged: true });
    st = log(tele(st, "guide-engage", { depthMm: st.guide.depthMm, coaxial: st.guide.coaxial, overWire: true }), "good", "Guide re-engaged over the wire.");
    return syncGuideWire(s, st, g);
  }

  // in the root: the analytic model
  const cath = guideCatheterType(gs.id);
  const root0 = gs.root ?? rootStart(model, cath);
  const root: GuideRoot = { insertion: root0.insertion + mm, torque: root0.torque + tipRad };
  gs = { ...gs, root };
  const e = classifyGuide(model, gs);
  const zone = zoneOf(e, s.side);
  const spec = guideSpec(gs);
  if (engagesSide(e, s.side) && (spec.side === "both" || spec.side === s.side)) {
    gs = settleOnEngage(gs, { depthMm: e.depth, coaxial: coaxialFromAlignment(s.side === "left" ? e.alignmentLm : e.alignmentRca) }, engageRng(gs, saltOf(st, "hand")));
    st = { ...st, guide: withSite(gs, s, g, st) };
    st = syncWire(st, { ...cloneWire(st.wire), guideEngaged: true });
    st = log(tele(st, "guide-engage", { depthMm: st.guide.depthMm, coaxial: st.guide.coaxial, overWire: false }), "good", "The guide tip jumps into the ostium.");
    return syncGuideWire(s, st, g);
  }
  const nearSince = zone === "near" ? (gs.nearSince ?? st.t) : null;
  if (zone === "lv" && gs.zone !== "lv") st = log(st, "danger", "The guide has prolapsed through the aortic valve.");
  if (zone !== gs.zone) st = tele(st, "guide-zone", { zone, kind: e.kind });
  return { ...st, guide: { ...gs, zone, nearSince } };
}

/**
 * Exchange the guide over the wire in the vessel (pm-engaging-exchange): only over an exchange-length
 * wire, or with the wire held by a trapping balloon or an extension wire; otherwise the wire comes out
 * with the old guide. The new guide is advanced over the wire and engaged.
 */
export function exchangeGuideOverWire(s: PciScenario, st: PciState, id: string, o: GuideChoice & { hold?: "trap" | "extension" } = {}, g?: PciGeom): PciState {
  const spec = GUIDE_BY_ID[id];
  if (!spec) return st;
  // over a wire in the vessel the new guide is engaged in this coronary: a guide for the other side is refused, as engageGuide and handGuide refuse it
  if (st.tipMm > 5 && spec.side !== "both" && spec.side !== s.side) return log(st, "warn", `A ${spec.label} does not suit the ${s.side === "left" ? "left" : "right"} coronary.`);
  if (st.device) return log(st, "warn", "Remove the balloon or stent before exchanging the guide.");
  if (st.guide.extensionMm !== null) return log(st, "warn", "Withdraw the guide extension before exchanging the guide.");
  if (st.guide.buddy) return log(st, "warn", "Remove the buddy wire before exchanging the guide.");
  if (st.tipMm <= 5) return selectGuide(st, id, o);
  if (st.wire.micro) return log(st, "warn", "Exchange the wire through the microcatheter and remove it before exchanging the guide.");
  const french = o.french ?? st.guide.french;
  const kept = (st.wire.lengthCm ?? 0) >= EXCHANGE_LENGTH_CM || !!o.hold;
  if (!kept) {
    // the old guide comes off over a short wire: the wire comes out with it, back in the guide with nothing
    // held, caught, folded or stored (its danger-zone record stays for the debrief)
    const w0 = cloneWire(st.wire);
    const home = s.side === "left" ? "LM" : "RCA";
    const out = {
      ...w0,
      tipMm: -25,
      route: [home],
      crossed: false,
      fold: null,
      caught: null,
      subintimal: null,
      deflector: null,
      wallCaught: null,
      pinned: false,
      stallMm: 0,
      tipForceGf: 0,
      axialN: 0,
      mS: 0,
      mK: 0,
      grip: 0,
      offset: w0.hub - w0.tip,
      distal: { ...w0.distal, inDanger: false },
    };
    const n = selectGuide(syncWire(st, out), id, o);
    return log(tele(n, "guide-exchange", { id, french, kept: false }), "danger", "The wire came out with the guide: a short wire cannot hold its position during a guide exchange.");
  }
  const gs0 = initialGuide(id, false, french, { lengthCm: o.lengthCm ?? st.guide.lengthCm, sideHoles: o.sideHoles ?? st.guide.sideHoles, side: st.guide.side });
  const settled = settleOnEngage({ ...gs0, engagements: (st.guide.engagements ?? 0) + 1 }, { depthMm: 0, coaxial: 0.85 }, engageRng(gs0, saltOf(st, "exchange")));
  let n: PciState = { ...st, guide: withSite(settled, s, g, st) };
  n = syncWire(n, { ...cloneWire(n.wire), guideEngaged: true, guideTurning: spec.curveTurning });
  n = tele(n, "guide-exchange", { id, french, kept: true, hold: o.hold ?? "exchange-length" });
  n = log(n, "good", `${spec.label} ${french} Fr guide advanced over the wire and engaged; the wire is still distal.`);
  return syncGuideWire(s, n, g);
}

/** Guide extension in (depth mm) or out (null). */
export function setExtension(st: PciState, depthMm: number | null): PciState {
  if (depthMm !== null && !st.guide.engaged) return log(st, "warn", "Engage the guide before advancing a guide extension.");
  if (depthMm !== null && st.tipMm < 30) return log(st, "warn", "Take the wire well into the distal vessel before advancing a guide extension.");
  let n: PciState = { ...st, guide: { ...st.guide, extensionMm: depthMm } };
  // pushing the extension into a stent's proximal edge compresses it
  if (depthMm !== null) {
    n = {
      ...n,
      stents: n.stents.map((p) => {
        const overrun = depthMm - p.fromMm;
        return overrun > 0 && overrun < p.toMm - p.fromMm ? { ...p, compressionMm: Math.max(p.compressionMm, Math.min(4, overrun)) } : p;
      }),
    };
    if (n.stents.some((p, i) => p.compressionMm > st.stents[i].compressionMm)) n = log(n, "danger", "The guide extension has been pushed into the stent's proximal edge: the stent is compressed.");
  }
  return log(n, "info", depthMm === null ? "Guide extension withdrawn." : `Guide extension advanced ${Math.round(depthMm)} mm into the vessel.`);
}

/** A buddy wire alongside the working wire. */
export function setBuddyWire(st: PciState, on: boolean): PciState {
  if (on && st.tipMm < 30) return log(st, "warn", "Wire the vessel first; the buddy wire follows it.");
  return log({ ...st, guide: { ...st.guide, buddy: on } }, "info", on ? "Buddy wire placed alongside the working wire." : "Buddy wire removed.");
}

/** Guide back-up now (N) for a teaching read-out. */
export function guideBackupN(st: PciState): number {
  return backupForce(st.guide);
}
