// ---------------------------------------------------------------------------
// Coronary wire actions: advance and withdraw, torque, exchange, tip shaping,
// pinning, and the wire events (branch entry, prolapse, crossing,
// subintimal tracking, distal danger zone) turned into log and telemetry.
//
// pci-wire-microcatheter adds the microcatheter as a rail device on the wire
// (load, advance and withdraw, rotate, backflow check, selective injection,
// removal by trapping, hydraulic exchange, an extension wire or a plain pull),
// exchange and reshaping through it without losing position, the deflection
// balloon for an angulated branch, the pseudolesions a support wire makes,
// and the exercise score of the held-out wiring exercises. What the operator
// sees is logged; what only the debrief may name (a subintimal course) is
// telemetry.
// ---------------------------------------------------------------------------

import { DEVICE_BY_ID, WIRE_SPEC as WIRE_SPECS, type GuideFrench, type WireKind } from "../equipment";
import {
  cloneWire,
  EXCHANGE_LENGTH_CM,
  HYDRAULIC_ATM,
  exchangeThroughMicro,
  initialWire,
  loadMicro,
  microFarBehindTip,
  microInVessel,
  moveMicro,
  moveWireBy,
  prolapseBranch,
  pseudolesionSites,
  removeMicro,
  rotateHub,
  rotateMicro,
  shapeTip as shapeWireTip,
  tipDirection,
  torqueLag,
  updateFriction,
  type MicroEvent,
  type MicroId,
  type MicroRemoval,
  type TipShape,
  type TrapBalloon,
  type WireEvent,
  type WireState,
} from "../coronaryWire";
import { guideSpec } from "../guide";
import { branchesOf, pathTo } from "../geometry";
import { initialPressureWire } from "../pressureWire";
import { onValveOpened, onWirePush } from "../../complications/engine";
import { takeOff, wrap } from "../geometry";
import { rnd, rngFrom } from "../rng";
import { ostiumFraction, ostiumSpan } from "../stentGeometry";
import { applyBailout } from "../../complications/engine";
import {
  activeRailOf,
  ensureRails,
  lesionCover,
  lesionNow,
  log,
  railsOf,
  refDAt,
  sampleAtMm,
  selectRail,
  syncMirrors,
  syncRail,
  syncWire,
  tele,
  twoWires,
  wireOf,
  wiringOf,
  withNotes,
  withRail,
  type PciGeom,
  type PciScenario,
  type PciState,
  type Placed,
  type RailCell,
  type RailState,
  type WiringRecord,
} from "../state";
import type { PciRuntimeScenario } from "../scenarios/legacy";

/** The side branch the active target lesion declares (a bifurcation lesion's sideBranch), if any. */
export function targetSideBranch(s: PciScenario): string | null {
  const r = s as PciRuntimeScenario;
  return r.lesions?.[r.targetIdx ?? 0]?.sideBranch?.vessel ?? null;
}

export { DEFAULT_SHAPE } from "../coronaryWire";

/** Wire labels and notes (equipment.ts), kept here for existing imports. */
export const WIRE_SPEC: Record<WireKind, { label: string; note: string }> = WIRE_SPECS;

/** World-space bend direction of the wire tip at the current tip position (rest geometry). */
export function tipBend(g: PciGeom, st: PciState) {
  const d = tipDirection(g, st.wire);
  if (!d) return null;
  const lateral = { x: d.N.x * Math.cos(st.wire.tip) + d.B.x * Math.sin(st.wire.tip), y: d.N.y * Math.cos(st.wire.tip) + d.B.y * Math.sin(st.wire.tip), z: d.N.z * Math.cos(st.wire.tip) + d.B.z * Math.sin(st.wire.tip) };
  return { T: d.T, bend: lateral, dir: d.d, angle: d.bend };
}

/** The named vessels from the ostium to the lesion. */
export function pathToTarget(g: PciGeom, s: PciScenario): string[] {
  void s;
  return pathTo(g, g.lesion.vessel);
}

export function branchLabel(name: string): string {
  const map: Record<string, string> = {
    LM: "left main",
    LAD: "LAD",
    LCx: "circumflex",
    RCA: "right coronary artery",
    RAMUS: "ramus intermedius",
    PDA: "posterior descending artery",
    PLV: "posterolateral branch",
    PL2: "second posterolateral branch",
    AM: "acute marginal branch",
    RV: "right ventricular branch",
    CONUS: "conus branch",
  };
  if (map[name]) return map[name];
  if (/^D\d/.test(name)) return `diagonal branch (${name})`;
  if (/^S\d/.test(name)) return `septal perforator (${name})`;
  if (/^OM\d/.test(name)) return `obtuse marginal branch (${name})`;
  return name;
}

/** Turn the wire engine's events into the event log, telemetry and counters. */
function handleWireEvents(s: PciScenario, g: PciGeom, st0: PciState, w: WireState, events: WireEvent[]): PciState {
  let st = syncWire(st0, w);
  const path = pathTo(g, g.lesion.vessel);
  // the declared side branch of a bifurcation target is wired on purpose: it is not off the route
  const side = targetSideBranch(s);
  for (const e of events) {
    switch (e.kind) {
      case "branch": {
        // a second wire put into a branch at the target (a side branch protected or wired on purpose) is on route
        const onRoute = path.includes(e.vessel) || e.vessel === side || (activeRailOf(st0) === 1 && branchAtTarget(g, e.vessel));
        const septal = /^S\d/.test(e.vessel);
        if (!onRoute) st = { ...st, counters: { ...st.counters, offRouteBranches: st.counters.offRouteBranches + 1, septalEntries: st.counters.septalEntries + (septal ? 1 : 0) } };
        st = log(st, onRoute ? "info" : "warn", `Wire entered the ${branchLabel(e.vessel)}.${septal ? " Pull back and turn the tip away from the septum." : ""}`);
        st = tele(st, "wire-branch", { branch: e.vessel, onRoute, septal });
        break;
      }
      case "catch":
        st = log(st, "warn", `The tip catches on the origin of the ${branchLabel(e.vessel)}.`);
        break;
      case "fold":
        st = log(
          st,
          "warn",
          e.reason === "cap"
            ? "The wire buckles against the occlusion cap and forms a loop. It needs more tip load or a tapered tip."
            : e.reason === "lesion"
              ? "The tip buckles at the lesion: it will not pass. A polymer-jacketed or tapered wire may slide through."
              : e.reason === "branch"
                ? "The tip folds back on itself at the branch origin (prolapsed); the loop advances past."
                : e.reason === "wall"
                  ? "The tip, held against the wall, folds into a small loop."
                  : "The tip has buckled against the end of the vessel."
        );
        break;
      case "prolapse":
        st = log(st, "warn", `The wire prolapses out of the ${branchLabel(e.vessel)} back into the main vessel.`);
        st = tele(st, "wire-prolapse", { branch: e.vessel, atMm: e.atMm });
        break;
      case "wall-catch":
        st = log(st, "warn", "The tip catches on the vessel wall and stops moving with the hub.");
        st = tele(st, "wire-wall-catch", { atMm: e.atMm, primaryMm: st.wire.shape.primaryMm });
        break;
      case "hairpin-entry":
        st = log(st, "info", `On the pull-back the reversed tip hooks into the ${branchLabel(e.vessel)}.`);
        st = tele(st, "wire-hairpin-entry", { branch: e.vessel, dissected: e.dissected });
        break;
      case "deflected":
        st = log(st, "info", `The deflection balloon turns the wire into the ${branchLabel(e.vessel)}.`);
        break;
      case "unfold":
        st = log(st, "info", "The loop is withdrawn and the tip shape reforms.");
        break;
      case "crossed": {
        // pci-two-rail-engine: the support advice is for the first crossing of an unstented lesion. The second
        // wire on its way to the side branch, or a wire re-crossing a lesion already stented (a rewire), gets a
        // neutral line; the telemetry is tagged with the rail (1 or 2) and whether the lesion was stented, so a
        // reader can tell these crossings from the first one.
        const rail = st.rails ? activeRailOf(st) + 1 : 1;
        const stented = st.stents.some((p) => lesionCover(g, p.route, p.fromMm, p.toMm) > 0);
        if (rail === 2) st = log(st, "info", "The second wire passes the lesion.");
        else if (stented) st = log(st, "info", "The wire passes back through the stented lesion.");
        else st = log(st, "good", "Wire across the lesion. Take it well into the distal vessel for support.");
        st = tele(st, "wire-crossed", rail === 1 && !stented ? {} : { rail, stented });
        break;
      }
      case "subintimal":
        st = tele(st, "wire-subintimal", { atMm: e.atMm });
        // what the operator sees (pm-wiring-navigate: abnormal course and motion): the course itself is named
        // only in the debrief. The monitor is not coupled to a subintimal wire (no ectopics are drawn), so the
        // message names only what the lab shows: the tip's feel and its motion with the beat.
        st = log(st, "warn", "The tip moves unusually freely and does not follow the vessel with each beat; check its course in a second view.");
        break;
      case "true-lumen":
        st = tele(st, "wire-true-lumen", {});
        break;
      case "danger-zone":
        if (e.entered) {
          st = log(st, "warn", "Wire tip in a small distal vessel: keep it still and pull back a little.");
          st = tele(st, "wire-distal", { atMm: e.atMm });
        }
        break;
      case "distal-push": {
        const v = st.wire.route[st.wire.route.length - 1];
        const r = onWirePush(st.cx, st.t, { route: st.wire.route, vessel: v, atMm: e.atMm, gfMm: e.gfMm, vesselD: 2 * e.radiusMm, hydrophilic: st.wire.kind === "polymer" || st.wire.kind === "cto" });
        st = withNotes({ ...st, cx: r.cx }, r.notes);
        if (e.atEnd && !st.wire.fold) st = log(st, "warn", "Wire tip at the distal end of the vessel. Keep it still and pull back a little.");
        break;
      }
      case "guide-blocked":
        st = log(st, "warn", "The guide is not seated in the ostium: the wire would fall into the aortic root. Engage the guide first.");
        break;
      case "whip":
        st = { ...st, counters: { ...st.counters, whips: st.counters.whips + 1 } };
        st = log(st, "warn", "The tip whips round suddenly after storing torque.");
        break;
      case "stall": {
        // stalls at the lesion feed the 'microcatheter-needed' event (pciEvents/wire.ts): one record per stall
        // episode (a push from a free tip that stalls), not per hand step of a continued push
        if (st0.wire.stallMm > 0) break;
        const atLesion = st.wire.route[st.wire.route.length - 1] === g.lesion.vessel && st.wire.tipMm >= g.lesion.startMm - 1 && st.wire.tipMm <= g.lesion.endMm;
        st = tele(st, "wire-stall", { kind: st.wire.kind, atLesion, micro: !!st.wire.micro && st.wire.micro.tipMm > 0, needGf: e.needGf, haveGf: e.haveGf });
        break;
      }
    }
  }
  return refreshPseudo(g, syncMirrors(st), st0);
}

/** Store a changed wiring record. */
function withWiring(st: PciState, f: (r: WiringRecord) => Partial<WiringRecord>): PciState {
  const r = wiringOf(st);
  return { ...st, wiring: { ...r, ...f(r) } };
}

/**
 * Keep the pseudolesion record in step with the wire: a support wire's stiff shaft in the bends makes them
 * (logged once, as the operator sees them on the next injection); partly withdrawing it resolves them;
 * pulling it back behind the lesion while they are present is counted (pm-wiring-tortuosity: an acute
 * closure could then not be treated).
 */
function refreshPseudo(g: PciGeom, st: PciState, before: PciState): PciState {
  const sites = pseudolesionSites(g, st.wire);
  const prev = wiringOf(st).pseudo;
  if (sites.length && !prev) {
    st = withWiring(st, () => ({ pseudo: { since: st.t, sites } }));
    return tele(st, "pseudolesion", { sites: sites.length });
  }
  if (!sites.length && prev) {
    const behind = before.wire.crossed && !st.wire.crossed;
    st = withWiring(st, (r) => ({ pseudo: null, pulledBehindLesion: r.pulledBehindLesion + (behind ? 1 : 0) }));
    st = tele(st, "pseudolesion-resolved", { behindLesion: behind });
    return log(st, behind ? "warn" : "info", behind ? "The narrowings resolve, but the wire is now behind the lesion." : "With the soft segment of the wire in the bends, the new narrowings resolve.");
  }
  if (sites.length && prev && sites.length !== prev.sites.length) return withWiring(st, () => ({ pseudo: { since: prev.since, sites } }));
  return st;
}

/**
 * Advance (+) or withdraw (−) the wire by d mm. With two rails and stents in place the rail records follow the move
 * (pci-two-rail-engine, railsAfterMove): a slow pull-back from beyond a carina that lets the tip fall into
 * the branch origin, the strut cell a wire crosses into a branch through, a wire passing outside a stent's
 * proximal struts, and a jailed or under-strut wire pulled back out of the stent.
 */
export function moveWire(s: PciScenario, g: PciGeom, st0: PciState, d: number): PciState {
  const st = moveWireCore(s, g, st0, d);
  // one wire (no second rail loaded): exactly the single-wire engine
  if (st === st0 || !st0.stents.length || !st0.rails) return st;
  return railsAfterMove(g, st0, st, d);
}

function moveWireCore(s: PciScenario, g: PciGeom, st0: PciState, d: number): PciState {
  if (st0.finished) return st0;
  if (st0.device && st0.device.centreMm + st0.device.lengthMm / 2 > -5 && d < 0 && st0.tipMm + d < st0.device.centreMm + st0.device.lengthMm / 2 + 5) {
    return log(st0, "warn", "Withdraw the balloon or stent before pulling the wire back past it.");
  }
  const w = wireOf(st0);
  const r = moveWireBy(g, w, d, lesionNow(s, g, st0));
  let st = handleWireEvents(s, g, st0, r.w, r.events);
  if (d > 0) st = { ...st, wireTime: st.wireTime };
  // the tip has just left the guide into the coronary (pm-wiring-shape-load: advance it to the guide tip under fluoroscopy)
  if (st0.tipMm <= 0 && st.tipMm > 0) st = tele(st, "wire-out-of-guide", { atMm: st.tipMm });
  return st;
}

/** Rotate the torque device by dRad. The tip follows with lag, and whips when stored torque releases. */
export function torqueWire(st0: PciState, dRad: number): PciState {
  const r = rotateHub(wireOf(st0), dRad);
  let st = syncWire(st0, r.w);
  for (const e of r.events)
    if (e.kind === "whip") {
      st = { ...st, counters: { ...st.counters, whips: st.counters.whips + 1 } };
      st = log(st, "warn", "The tip whips round suddenly after storing torque.");
    }
  return st;
}

/**
 * Exchange the coronary wire: with the wire pulled back into the guide, or through a microcatheter in the
 * vessel, which keeps the route and the tip position (the new wire is advanced to where the old one was).
 * `lengthCm` chooses a short (about 180-190 cm) or exchange-length (300 cm) wire; default: the current length.
 */
export function setWireKind(st: PciState, k: WireKind, opts: { lengthCm?: number; g?: PciGeom } = {}): PciState {
  if (!WIRE_SPECS[k]) return log(st, "warn", "Unknown wire.");
  const cur = wireOf(st);
  const deviceInGuide = !!st.device && (st.device.stage === "in-guide" || st.device.stage === "backloaded");
  if (microInVessel(cur)) {
    // the microcatheter keeps the course only as far as its own tip (coronaryWire MP_MC_EXCHANGE_KEEP_MM)
    const far = microFarBehindTip(cur);
    if (far && !opts.g) return log(st, "warn", "The microcatheter is well behind the wire tip: advance it close to the tip before exchanging the wire through it.");
    const w = exchangeThroughMicro(cur, k, opts);
    let n = syncWire(st, w);
    n = { ...n, pressure: k === "pressure" ? initialPressureWire(n.rng) : null };
    n = withWiring(n, (r) => ({ exchangesThroughMicro: r.exchangesThroughMicro + 1 }));
    n = tele(n, "wire-exchange", { kind: k, throughMicro: true, deviceInGuide });
    n = far
      ? log(n, "warn", `${WIRE_SPECS[k].label} exchanged in through the microcatheter; it comes out at the microcatheter tip, and the course beyond must be wired again.`)
      : log(n, "info", `${WIRE_SPECS[k].label} exchanged in through the microcatheter; its tip is where the last one was.`);
    // with the geometry the pseudolesion record follows at once; otherwise on the next wire move
    return opts.g ? refreshPseudo(opts.g, n, st) : n;
  }
  if (st.tipMm > 0) return log(st, "warn", "Pull the wire back into the guide before exchanging it, or exchange it through a microcatheter.");
  const w = initialWire(k, st.route[0] === "RCA" ? "right" : "left", {
    seed: `${st.rng.s}:${k}`,
    guideEngaged: st.guide.engaged,
    guideTurning: guideSpec(st.guide).curveTurning,
    shape: st.wire.shape,
    lengthCm: opts.lengthCm ?? cur.lengthCm,
  });
  w.tipMm = st.tipMm;
  w.route = [st.route[0]];
  w.micro = cur.micro ? { ...cur.micro } : null;
  let n = syncWire(st, w);
  if (k === "pressure") n = { ...n, pressure: initialPressureWire(n.rng) };
  else n = { ...n, pressure: null };
  n = tele(n, "wire-loaded", { kind: k, deviceInGuide, lengthCm: w.lengthCm });
  return log(n, "info", `${WIRE_SPECS[k].label} loaded.`);
}

/**
 * Reshape the wire tip (primary and secondary bend, or a reversed hairpin): with the wire out of the
 * coronary, or through a microcatheter in the vessel without losing position.
 */
export function shapeTip(st: PciState, shape: TipShape, opts: { g?: PciGeom } = {}): PciState {
  const before = wireOf(st);
  const r = shapeWireTip(before, shape, opts.g);
  if (!r.ok && r.reason === "micro-far") return log(st, "warn", "The microcatheter is well behind the wire tip: advance it close to the tip before reshaping the wire through it.");
  if (!r.ok) return log(st, "warn", "Take the wire out of the coronary to reshape the tip, or reshape it through a microcatheter.");
  const lost = before.tipMm > 0 && r.w.tipMm < before.tipMm - 0.5;
  let n = syncWire(st, r.w);
  if (before.tipMm > 0) n = withWiring(n, (x) => ({ exchangesThroughMicro: x.exchangesThroughMicro + 1 }));
  n = tele(n, "wire-shaped", { ...shape, throughMicro: before.tipMm > 0 });
  if (lost) n = log(n, "warn", "The reshaped wire comes out at the microcatheter tip; the course beyond must be wired again.");
  if (shape.reversed) {
    const slippery = WIRE_SPECS[r.w.kind].category === "polymer-jacketed";
    return log(n, slippery ? "info" : "warn", `Wire tip reversed into a hairpin about ${shape.primaryMm} mm from the tip; load it bend first.${slippery ? "" : " The hairpin is made with a polymer-jacketed wire."}`);
  }
  return log(n, "info", `Tip shaped: ${shape.primaryDeg}° bend ${shape.primaryMm} mm from the tip${shape.secondaryDeg ? `, secondary ${shape.secondaryDeg}° at ${shape.secondaryMm} mm` : ""}.`);
}

/** Hold the wire still while devices move ("I have the wire"). */
export function pinWire(st: PciState, on: boolean): PciState {
  return syncWire(st, { ...cloneWire(st.wire), pinned: on });
}

/** Current torque lag (deg) of the wire, for a teaching read-out. */
export function wireTorqueLagDeg(g: PciGeom, st: PciState): number {
  const w = cloneWire(st.wire);
  updateFriction(g, w);
  return (torqueLag(w) * 180) / Math.PI;
}

// ---------------------------------------------------------------------------
// Microcatheter (pci-wire-microcatheter)
// ---------------------------------------------------------------------------

/** The microcatheter categories as the lab offers them (catalogue labels, generic names). */
export const MICROCATHETERS: readonly { id: MicroId; label: string; note: string }[] = (["mc-large", "mc-small", "mc-angulated", "mc-deflectable", "mc-dual", "mc-plaque"] as const).map((id) => ({
  id,
  label: DEVICE_BY_ID[id]?.label ?? id,
  note: DEVICE_BY_ID[id]?.notes[0] ?? "",
}));

/** Contrast given by one selective microcatheter injection (mL) — MODEL PARAMETER. */
export const MP_MC_INJECTION_ML = 2;

/** Put a microcatheter on the wire (it rides the wire and is parked inside the guide). */
export function loadMicrocatheter(st: PciState, id: MicroId): PciState {
  if (st.wire.micro) return log(st, "warn", "A microcatheter is already on the wire.");
  if (st.device) return log(st, "warn", "Withdraw the balloon or stent before loading a microcatheter.");
  const w = loadMicro(wireOf(st), id);
  const n = tele(syncWire(st, w), "micro-load", { id });
  return log(n, "info", `${DEVICE_BY_ID[id]?.label ?? "Microcatheter"} loaded over the wire, inside the guide.`);
}

function handleMicroEvents(st0: PciState, events: (WireEvent | MicroEvent)[]): PciState {
  let st = st0;
  for (const e of events) {
    if (e.kind === "micro-at-tip") st = log(st, "info", "The microcatheter is at the wire tip: advance the wire first.");
    else if (e.kind === "micro-guide-blocked") st = log(st, "warn", "The guide is not seated: the microcatheter stays inside it.");
    else if (e.kind === "micro-left-guide") st = tele(st, "micro-left-guide", {});
    else if (e.kind === "micro-damage") {
      st = log(st, "danger", "The microcatheter has been over-rotated: it is deformed and binds the wire. Replace it.");
      st = tele(st, "micro-damage", { turns: e.turns });
    }
  }
  return st;
}

/** Advance (+) or withdraw (−) the microcatheter over the wire. */
export function moveMicrocatheter(s: PciScenario, g: PciGeom, st0: PciState, d: number): PciState {
  if (st0.finished || !st0.wire.micro) return st0;
  const les = lesionNow(s, g, st0);
  const r = moveMicro(g, wireOf(st0), d, les);
  if (r.w.micro?.damaged && d > 0) return log(st0, "warn", "The damaged microcatheter binds the wire and will not advance.");
  const wireEvents = r.events.filter((e): e is WireEvent => !e.kind.startsWith("micro-"));
  let st = handleWireEvents(s, g, st0, r.w, wireEvents);
  st = handleMicroEvents(st, r.events);
  const dragged = Math.abs(r.migratedMm) > 0.05;
  if (dragged) st = { ...st, counters: { ...st.counters, wireMigrationMm: st.counters.wireMigrationMm + Math.abs(r.migratedMm) } };
  // telemetry only for the moves that matter (not every hand step): reaching the wire tip, parking back in
  // the guide, or dragging the wire (leaving the guide has its own record, micro-left-guide)
  const from = st0.wire.micro!.tipMm;
  const to = st.wire.micro?.tipMm ?? from;
  const atTip = r.events.some((e) => e.kind === "micro-at-tip");
  const parked = from > 0 && to <= 0;
  if (atTip || parked || dragged) st = tele(st, "micro-move", { d, tipMm: to, atTip, parked, migratedMm: r.migratedMm });
  return st;
}

/** Rotate the microcatheter hub (a plaque modification type advances anticlockwise, with a turn limit). */
export function torqueMicrocatheter(st0: PciState, dRad: number): PciState {
  if (!st0.wire.micro) return st0;
  const r = rotateMicro(wireOf(st0), dRad);
  return handleMicroEvents(syncWire(st0, r.w), r.events);
}

/**
 * Check for backflow from the microcatheter hub before injecting through it. Blood returns from a
 * true-lumen position; from a subintimal one it does not (what the operator sees).
 */
export function checkMicroBackflow(st0: PciState): PciState {
  const m = st0.wire.micro;
  if (!m || m.tipMm <= 0) return log(st0, "info", "The microcatheter is not in the vessel.");
  const w = cloneWire(st0.wire);
  w.micro = { ...m, backflowAt: st0.t };
  const sub = !!w.subintimal && m.tipMm >= w.subintimal.fromMm;
  const st = tele(syncWire(st0, w), "micro-backflow", { blood: !sub });
  return log(st, sub ? "warn" : "info", sub ? "No blood returns from the microcatheter hub." : "Blood returns freely from the microcatheter hub.");
}

/**
 * A selective injection through the microcatheter: contrast fills only the vessel beyond its tip
 * (render/wire.ts draws it). Without a backflow check it is counted; from a subintimal position it stains
 * the wall and extends the dissection plane (pm-wiring-navigate: a distal microcatheter injection extends it).
 */
export function injectMicrocatheter(s: PciScenario, g: PciGeom, st0: PciState): PciState {
  void s;
  const m = st0.wire.micro;
  if (!m || m.tipMm <= 0) return log(st0, "warn", "Advance the microcatheter into the vessel before injecting through it.");
  if (DEVICE_BY_ID[m.id]?.contrastThroughLumen === false) return log(st0, "warn", "Contrast cannot be injected through this microcatheter.");
  const checked = m.backflowAt !== null;
  const sub = !!st0.wire.subintimal && m.tipMm >= st0.wire.subintimal.fromMm;
  let st: PciState = { ...st0, contrastMl: st0.contrastMl + MP_MC_INJECTION_ML, lastInjectionT: st0.t };
  st = withWiring(st, (r) => ({
    microInjection: { t: st0.t, route: st0.wire.route.slice(), fromMm: m.tipMm, subintimal: sub },
    uncheckedMicroInjections: r.uncheckedMicroInjections + (checked ? 0 : 1),
    subintimalMicroInjections: r.subintimalMicroInjections + (sub ? 1 : 0),
  }));
  st = tele(st, "micro-injection", { checked, subintimal: sub, atMm: m.tipMm, vessel: st0.wire.route[st0.wire.route.length - 1] });
  if (!checked) st = log(st, "warn", "Injected through the microcatheter without checking for backflow.");
  if (sub) return log(st, "danger", "The contrast stains the wall beyond the microcatheter tip and does not clear.");
  void g;
  return log(st, "info", "Selective injection: the vessel beyond the microcatheter tip fills.");
}

export interface MicroRemovalOptions {
  technique: MicroRemoval;
  balloon?: TrapBalloon;
  hydraulicAtm?: number;
}

/**
 * Remove the microcatheter over the wire (coronaryWire.removeMicro): trapping, hydraulic exchange, an
 * extension wire, or a plain pull. Opening the valve for the trapping balloon, the indeflator or the
 * extension lets air in until the guide is back-bled (aspirated) before the next injection.
 */
export function removeMicrocatheter(s: PciScenario, g: PciGeom, st0: PciState, o: MicroRemovalOptions): PciState {
  if (!st0.wire.micro) return log(st0, "info", "No microcatheter on the wire.");
  const before = wireOf(st0);
  const r = removeMicro(g, before, lesionNow(s, g, st0), { technique: o.technique, french: st0.guide.french as GuideFrench, balloon: o.balloon, hydraulicAtm: o.hydraulicAtm });
  let st = tele(st0, "micro-removal", { technique: o.technique, outcome: r.outcome, migratedMm: r.migratedMm, hold: r.trap?.hold ?? null, lengthCm: before.lengthCm });
  if (r.outcome === "not-in-guide") return log(st, "warn", "Withdraw the microcatheter into the guide before trapping.");
  if (r.outcome === "pressure-high") return log(st, "warn", `That is above the ${HYDRAULIC_ATM[0]}-${HYDRAULIC_ATM[1]} atm range for a hydraulic exchange: lower the pressure.`);
  if (r.outcome === "cannot-trap") return log(st, "warn", `This guide cannot take a trapping balloon beside this microcatheter (it needs ${DEVICE_BY_ID[before.micro!.id]?.trapMinFrench ?? 8} Fr).`);
  if (r.outcome === "trapped-device") return log(st, "warn", "The balloon is proximal to the microcatheter's distal marker and traps the microcatheter too: deflate and advance it past the marker.");
  st = handleWireEvents(s, g, st, r.w, r.events);
  if (o.technique !== "pull" && before.lengthCm < EXCHANGE_LENGTH_CM) st = { ...st, cx: onValveOpened(st.cx) };
  const moved = Math.abs(r.migratedMm);
  if (moved > 0.05) st = { ...st, counters: { ...st.counters, wireMigrationMm: st.counters.wireMigrationMm + moved } };
  const slippery = ["polymer-jacketed", "stiff-tip"].includes(WIRE_SPECS[before.kind].category);
  if (r.outcome === "wire-lost") {
    st = withWiring(st, (x) => ({ wiresLost: x.wiresLost + 1 }));
    return log(st, "danger", "The short wire came out with the microcatheter: the wire position is lost.");
  }
  if (o.technique === "hydraulic" && slippery && before.lengthCm < EXCHANGE_LENGTH_CM) {
    st = withWiring(st, (x) => ({ hydraulicOverSlippery: x.hydraulicOverSlippery + 1 }));
    return log(st, "danger", "The pressurised microcatheter drives the slippery wire forward into the distal vessel.");
  }
  if (moved > 5) return log(st, "warn", `Microcatheter out, but the wire has come back about ${Math.round(moved)} mm.`);
  return log(st, "good", "Microcatheter removed; the wire tip has not moved. Back-bleed the valve before the next injection.");
}

/**
 * A deflection balloon in the main vessel just beyond the origin of the angulated branch on the route to
 * the target (pm-wiring-tortuosity, solution 4): the wire cannot continue in the main vessel and prolapses
 * less. While it is up the main vessel beyond it is occluded.
 */
export function setDeflectionBalloon(s: PciScenario, g: PciGeom, st0: PciState, on: boolean): PciState {
  const w = cloneWire(st0.wire);
  if (!on) {
    if (!w.deflector) return st0;
    w.deflector = null;
    return log(tele(syncWire(st0, w), "deflection-balloon", { on: false }), "info", "Deflection balloon deflated and withdrawn.");
  }
  // the angulated branches on the way to the lesion, and the target's declared side branch
  const side = targetSideBranch(s);
  const path = [...pathTo(g, g.lesion.vessel), ...(side ? [side] : [])];
  for (let i = 1; i < path.length; i++) {
    const child = g.byName.get(path[i]);
    if (!child?.parent || !prolapseBranch(g, child)) continue;
    const parent = child.parent.name;
    const at = branchesOf(g, parent).find((b) => b.c.name === child.name)?.atMm;
    if (at === undefined) continue;
    w.deflector = { vessel: parent, atMm: at + 3, branch: child.name };
    const st = tele(syncWire(st0, w), "deflection-balloon", { on: true, branch: child.name });
    return log(st, "warn", `Deflection balloon inflated in the ${branchLabel(parent)} just beyond the ${branchLabel(child.name)}: the vessel beyond it is occluded while it is up.`);
  }
  return log(st0, "info", "No acutely angled branch on the way to the lesion to deflect into.");
}

/** What the held-out wiring exercises score (pm-wiring-navigate): off-route entries, wire time, contrast, prolapses, subintimal tracking, distal excursions. */
export function wiringScore(st: PciState): { offRouteEntries: number; septalEntries: number; wireTimeS: number; contrastMl: number; prolapses: number; subintimal: boolean; distalEntries: number; crossed: boolean } {
  return {
    offRouteEntries: st.counters.offRouteBranches,
    septalEntries: st.counters.septalEntries,
    wireTimeS: st.wireTime,
    contrastMl: st.contrastMl,
    prolapses: st.log.filter((r) => r.kind === "wire-prolapse").length,
    subintimal: st.log.some((r) => r.kind === "wire-subintimal"),
    distalEntries: st.wire.distal.entries,
    crossed: st.wire.crossed,
  };
}

// ---------------------------------------------------------------------------
// Two rails (pci-two-rail-engine)
//
// A second coronary wire rides in the same guide on its own rail (state.ts
// RailState). The legacy fields are the rail the hands work on; setActiveRail
// moves the hands. With two rails and a deployed stent the wire's moves keep
// the rail records:
//  - a slow pull-back from beyond a branch's carina with the tip aimed at the
//    branch lets the tip fall into the origin (cp-bifurcation-provisional-sb:
//    "advance beyond the carina, aim the tip at the branch and withdraw
//    slowly; when the tip falls into the branch origin, push forward through
//    that cell"); the next push into the branch crosses there;
//  - a wire entering a branch whose origin lies under a stent it is inside
//    crosses a strut cell: where along the ostium gives the cell (RailCell);
//    going forward the tip meets the ostium's first, proximal, cells;
//  - a wire advanced across a stent's proximal edge from outside it may pass
//    outside the struts (underStrut, more often at a malapposed edge, never
//    with a knuckled tip), and devices on it then stop at that edge;
//  - a jailed or under-strut wire pulled back out of the stent is free again.
// What the operator sees is logged (the wire going through the struts into
// the branch); the cell and an under-strut course are telemetry and rail
// records, for imaging, the technique machines and the debrief.
// ---------------------------------------------------------------------------

/** A crossing at or beyond this fraction of the ostium (0 proximal edge, 1 carina) is a 'distal' cell — MODEL PARAMETER. */
export const MP_CELL_DISTAL_U = 0.5;
/** A crossing at or beyond this fraction is the cell at the carina itself ('carina') — MODEL PARAMETER. */
export const MP_CELL_CARINA_U = 0.85;
/** Where a wire going forward meets the ostium and drops into it (fraction of the ostium) — MODEL PARAMETER. */
export const MP_ADVANCE_ENTRY_U = 0.25;
/** The tip falls into a branch origin on a pull-back when aimed within this of the branch's take-off azimuth (rad) — MODEL PARAMETER. */
export const MP_FALL_AZ_TOL = 0.5;
/** A second wire's branch counts as at the target when its origin is within this of the lesion (mm) — MODEL PARAMETER. */
export const MP_SECOND_WIRE_TARGET_ZONE_MM = 12;
/**
 * A wire advanced across a deployed stent's proximal edge passes outside the struts with this chance, plus
 * this much per mm of strut-to-wall gap at the edge, at most the cap (pm-prep-and-stent#5: a wire that passed
 * under a strut) — MODEL PARAMETERS.
 */
export const MP_UNDER_STRUT_P = 0.03;
export const MP_UNDER_STRUT_P_PER_GAP_MM = 0.8;
export const MP_UNDER_STRUT_P_MAX = 0.6;
/** A strut-to-wall gap above this (mm) at the edge names the cause 'malapposed-edge' — MODEL PARAMETER (the stent-geometry malapposition threshold is 0.4 mm). */
export const MP_UNDER_STRUT_GAP_MM = 0.1;

/** The chance that a wire advanced across a stent's proximal edge passes outside its struts, with a strut-to-wall gap of `gapMm` there. */
export function underStrutChance(gapMm: number): number {
  return Math.min(MP_UNDER_STRUT_P_MAX, MP_UNDER_STRUT_P + MP_UNDER_STRUT_P_PER_GAP_MM * Math.max(0, gapMm));
}

/** The cell for a crossing at fraction `u` of the ostium. */
export function cellOf(u: number): RailCell {
  if (u >= MP_CELL_CARINA_U) return "carina";
  if (u >= MP_CELL_DISTAL_U) return "distal";
  return "proximal";
}

/** A distal-cell crossing (distal or at the carina): it scaffolds the ostium; a proximal cell leaves struts across it. */
export function cellScaffoldsOstium(cell: RailCell | null): boolean {
  return cell === "distal" || cell === "carina";
}

/** The branch's origin lies on the way to the target within MP_SECOND_WIRE_TARGET_ZONE_MM of the lesion. */
function branchAtTarget(g: PciGeom, vessel: string): boolean {
  const c = g.byName.get(vessel);
  if (!c?.parent) return false;
  const path = pathTo(g, g.lesion.vessel);
  if (!path.includes(c.parent.name)) return false;
  const at = branchesOf(g, c.parent.name).find((b) => b.c.name === vessel)?.atMm;
  if (at === undefined) return false;
  return at >= g.lesion.startMm - MP_SECOND_WIRE_TARGET_ZONE_MM && at <= g.lesion.endMm + MP_SECOND_WIRE_TARGET_ZONE_MM;
}

/** A side branch whose origin lies under a deployed stent. */
interface OstiumUnder {
  stentIdx: number;
  branch: string;
  parent: string;
  atMm: number;
  sbD: number;
  azimuth: number;
  proxMm: number;
  carinaMm: number;
}

/** The side branches whose origins lie under the deployed stents. */
export function ostiaUnderStents(g: PciGeom, stents: readonly Placed[]): OstiumUnder[] {
  const out: OstiumUnder[] = [];
  stents.forEach((p, stentIdx) => {
    for (const v of p.route) {
      for (const b of branchesOf(g, v)) {
        if (p.route.includes(b.c.name) || b.terminal) continue;
        if (b.atMm < p.fromMm + 0.3 || b.atMm > p.toMm - 0.3) continue;
        const to = takeOff(g, b.c);
        const sbD = 2 * to.childRadius;
        const o = ostiumSpan(b.atMm, sbD, to.polar);
        out.push({ stentIdx, branch: b.c.name, parent: v, atMm: b.atMm, sbD, azimuth: to.azimuth, proxMm: o.proxMm, carinaMm: o.carinaMm });
      }
    }
  });
  return out;
}

/** The stent lies on this route at `mm` (the route and the stent's own route pass through the same vessel there). */
function stentOnRoute(g: PciGeom, p: Placed, route: string[], mm: number): boolean {
  if (mm < p.fromMm || mm > p.toMm) return false;
  const a = sampleAtMm(g, route, mm);
  const b = sampleAtMm(g, p.route, mm);
  return !!a && !!b && a.v.name === b.v.name;
}

/** The rail's wire lies outside this stent (jailed beside it, or passed under its proximal struts). */
function outsideStent(r: RailState, stentIdx: number): boolean {
  return r.jailed?.stentIdx === stentIdx || r.underStrut?.stentIdx === stentIdx;
}

/** The rail bookkeeping after a wire move (moveWire): fall-in, cell crossing, under-strut, freed wires. */
function railsAfterMove(g: PciGeom, st0: PciState, st1: PciState, d: number): PciState {
  let st = syncRail(st1);
  const i = activeRailOf(st);
  const rail = railsOf(st)[i];
  const before = st0.wire;
  const w = st.wire;
  const ostia = ostiaUnderStents(g, st.stents);

  // a jailed or under-strut wire pulled back proximal to the stent is free again
  const jail = rail.jailed;
  if (jail && w.tipMm < (st.stents[jail.stentIdx]?.fromMm ?? -Infinity)) {
    st = tele(withRail(st, i, () => ({ jailed: null })), "jailed-wire-freed", { rail: i, branch: jail.branch });
  }
  const us = railsOf(st)[i].underStrut;
  if (us && w.tipMm < us.edgeMm) st = tele(withRail(st, i, () => ({ underStrut: null })), "wire-under-strut-cleared", { rail: i });

  // the rest models a second wire beside a stent (one wire on explicit rails, the in-stent start, keeps the
  // single-wire engine apart from the clearing above)
  if (!twoWires(st)) return st;

  // a branch entered through a stent's struts
  const entered = w.route.length > before.route.length ? w.route[w.route.length - 1] : null;
  if (entered) {
    const o = ostia.find((x) => x.branch === entered && before.route.includes(x.parent) && !outsideStent(railsOf(st)[i], x.stentIdx));
    if (o) st = crossCell(g, st, i, o);
  }
  // the tip falls into a branch origin on a slow pull-back from beyond its carina
  if (d < 0 && !entered && !w.fold && !w.shape.reversed) {
    const last = w.route[w.route.length - 1];
    for (const o of ostia) {
      if (o.parent !== last || outsideStent(railsOf(st)[i], o.stentIdx)) continue;
      if (!stentOnRoute(g, st.stents[o.stentIdx], w.route, o.atMm)) continue;
      if (!(before.tipMm > w.tipMm && w.tipMm >= o.proxMm && w.tipMm <= o.carinaMm)) continue;
      if (Math.abs(wrap(w.tip - o.azimuth)) > MP_FALL_AZ_TOL) continue;
      const u = Math.max(0, Math.min(1, ostiumFraction(w.tipMm, o)));
      const nw = cloneWire(w);
      nw.tipMm = o.atMm;
      nw.caught = { vessel: o.branch, atMm: o.atMm };
      st = syncWire(st, nw);
      st = withRail(st, i, () => ({ fallIn: { branch: o.branch, stentIdx: o.stentIdx, atMm: o.atMm, u, t: st.t } }));
      st = log(st, "info", `The tip drops into the origin of the ${branchLabel(o.branch)}.`);
      break;
    }
  }
  // a fall-in the wire has moved away from is lost
  const fi = railsOf(st)[i].fallIn;
  if (fi && !entered && Math.abs(st.wire.tipMm - fi.atMm) > 1e-6) st = withRail(st, i, () => ({ fallIn: null }));

  // forward across a stent's proximal edge from outside it: the wire may pass outside the struts
  if (d > 0) {
    st.stents.forEach((p, stentIdx) => {
      if (!(before.tipMm < p.fromMm && st.wire.tipMm >= p.fromMm)) return;
      if (!stentOnRoute(g, p, st.wire.route, p.fromMm + 0.01)) return;
      const r = railsOf(st)[i];
      if (outsideStent(r, stentIdx)) return;
      const n = r.edgeCrossings;
      st = withRail(st, i, () => ({ edgeCrossings: n + 1 }));
      if (st.wire.fold) return; // a knuckled tip cannot pass under a strut
      const lumen = refDAt(g, p.route, p.fromMm + 0.01);
      const gap = Math.max(0, (lumen - (p.ringD[0] ?? p.diameter)) / 2);
      if (rnd(rngFrom(`under-strut:${st.rng.s}:${i}:${n}`)) >= underStrutChance(gap)) return;
      const cause = gap > MP_UNDER_STRUT_GAP_MM ? "malapposed-edge" : "strut-edge";
      st = withRail(st, i, () => ({ underStrut: { stentIdx, edgeMm: p.fromMm, cause, t: st.t } }));
      st = tele(st, "wire-under-strut", { rail: i, stentIdx, edgeMm: p.fromMm, gapMm: gap, cause });
    });
  }
  return st;
}

/** Record the cell a wire crossed into a branch, and what it does for a compromised branch. */
function crossCell(g: PciGeom, st0: PciState, i: 0 | 1, o: OstiumUnder): PciState {
  void g;
  const r = railsOf(st0)[i];
  const fell = r.fallIn && r.fallIn.branch === o.branch ? r.fallIn : null;
  const u = fell ? fell.u : MP_ADVANCE_ENTRY_U;
  const cell = cellOf(u);
  let st = withRail(st0, i, () => ({ cell, fallIn: null, crossing: { stentIdx: o.stentIdx, branch: o.branch, atMm: o.atMm, u, cell, approach: fell ? "withdraw" : "advance", t: st0.t } }));
  st = tele(st, "wire-cell", { rail: i, branch: o.branch, cell, u, approach: fell ? "withdraw" : "advance", stentIdx: o.stentIdx });
  st = log(st, "info", `Wire through the stent struts into the ${branchLabel(o.branch)}.`);
  // a compromised branch rewired through the struts (complications/sideBranch.ts bailoutSideBranch)
  if (st.cx.list.some((c) => c.kind === "side-branch" && c.vessel === o.branch && c.stage !== "resolved")) {
    const b = applyBailout(st.cx, "rewire-side-branch", st.t, { wireInBranch: (v) => v === o.branch });
    st = withNotes({ ...st, cx: b.cx }, b.notes);
  }
  return st;
}

/**
 * A side branch with a wire of either rail in it (jailed there, or rewired through the struts) whose ostium a
 * stent has compromised, seen by the operator since: an injection after the compromise began (the cue, a
 * pinched ostium filling slowly, shows on it). What a two-rail event source raises as 'side-branch-compromise'
 * in the optimise phase, as src/ui/lab/pciEvents/pressureWire.ts does in the physiology phase; the grade and
 * the cause stay for the recognition step.
 */
export function railBranchCompromiseSeen(st: PciState): boolean {
  if (!st.rails) return false;
  const branches = railsOf(st)
    .map((r) => r.jailed?.branch ?? (r.crossing && r.wire?.route.includes(r.crossing.branch) ? r.crossing.branch : null))
    .filter((b): b is string => !!b);
  if (!branches.length) return false;
  const seenAfter = (t0: number) => st.lastInjectionT !== null && st.lastInjectionT >= t0;
  return st.cx.list.some((c) => c.kind === "side-branch" && (c.stage === "prodrome" || c.stage === "overt") && branches.includes(c.vessel) && seenAfter(c.t0));
}

/**
 * Load a second coronary wire into the guide (rail 1, or whichever rail has no wire), alongside the first:
 * the start of every two-wire technique (a jailed side-branch wire, a buddy wire, parallel wiring). The hands
 * stay on the rail they are on; setActiveRail moves them.
 */
export function loadSecondWire(st0: PciState, kind: WireKind = "workhorse", opts: { lengthCm?: number } = {}): PciState {
  if (!WIRE_SPECS[kind]) return log(st0, "warn", "Unknown wire.");
  const st = ensureRails(st0);
  // the empty rail (rail 1, or rail 0 when its wire was taken out with the hands on rail 1)
  const slot: 0 | 1 | null = !st.rails![1].wire ? 1 : !st.rails![0].wire ? 0 : null;
  if (slot === null) return log(st0, "warn", "A second wire is already in the guide.");
  const w = initialWire(kind, st.route[0] === "RCA" ? "right" : "left", {
    seed: `${st.rng.s}:rail1:${kind}`,
    guideEngaged: st.guide.engaged,
    guideTurning: guideSpec(st.guide).curveTurning,
    lengthCm: opts.lengthCm,
  });
  w.route = [st0.wire.route[0]];
  let n = withRail(st, slot, () => ({ wire: w, jailed: null, cell: null, crossing: null, underStrut: null, fallIn: null, edgeForcing: 0 }));
  n = tele(n, "wire-loaded", { kind, rail: slot, lengthCm: w.lengthCm });
  return log(n, "info", `Second wire (${WIRE_SPECS[kind].label}) loaded into the guide beside the first.`);
}

/** Move the hands to rail `i` (its wire, the device and indeflator on it). Refused while the balloon in the hands is up. */
export function setActiveRail(st0: PciState, i: 0 | 1): PciState {
  if (activeRailOf(st0) === i) return st0;
  // the indeflator in the hands steps only for the rail they are on: a balloon left up on the other rail would stay up unseen
  if (st0.device && (st0.device.inflated || st0.ind.fill > 0.05)) return log(st0, "warn", "Deflate the balloon before working on the other wire.");
  const st = selectRail(st0, i);
  if (st === st0) return log(st0, "warn", i === 1 ? "There is no second wire in the guide." : "There is no wire on that rail.");
  return tele(st, "rail-active", { rail: i });
}

/**
 * Pull rail `i`'s wire out of the patient (a jailed wire with gentle traction: cp-bifurcation-provisional-jailed).
 * The hands move to the other rail when they were on this one; the last wire is not removed this way. A jailed
 * wire taken out before a new wire is in its branch is recorded ('jailed-wire-removed', rewired false).
 */
export function removeRailWire(st0: PciState, i: 0 | 1): PciState {
  const rails = railsOf(st0);
  const other: 0 | 1 = i === 0 ? 1 : 0;
  if (!rails[i].wire) return st0;
  if (!rails[other].wire) return log(st0, "warn", "Exchange or withdraw the only wire with the wire controls.");
  if (rails[i].device) return log(st0, "warn", "Withdraw the device on that wire first.");
  let st = activeRailOf(st0) === i ? selectRail(st0, other) : ensureRails(st0);
  const jail = rails[i].jailed;
  if (jail) {
    const rewired = !!rails[other].wire && rails[other].wire!.route.includes(jail.branch) && rails[other].crossing?.branch === jail.branch;
    st = tele(st, "jailed-wire-removed", { rail: i, branch: jail.branch, rewired, jailedMm: jail.jailedMm });
  }
  st = withRail(st, i, () => ({ wire: null, pressure: null, jailed: null, cell: null, crossing: null, underStrut: null, fallIn: null, edgeForcing: 0 }));
  st = tele(st, "wire-removed", { rail: i });
  return log(st, "info", jail ? "The jailed wire is withdrawn with gentle traction." : "The wire is withdrawn.");
}

/**
 * Helpers shared with other action modules. The default export is not re-exported by angioPci.ts's
 * `export *`, so these stay out of the public facade.
 */
const wireInternal = { handleWireEvents };
export default wireInternal;
