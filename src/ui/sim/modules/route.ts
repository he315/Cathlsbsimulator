// ---------------------------------------------------------------------------
// From the sheath to the root (diag-route-wire-led-radial): a diagnostic
// session module, and the route controls the table-side Route tab
// (src/ui/lab/controls/tabs/RouteTab.tsx) and the image (FluoroView) use
// through the 'route' capability.
//
// A scenario with startAt 'sheath' opens with the catheter just out of the
// sheath tip over a leading J wire (src/ui/physics/physicsDevices.ts
// ROUTE_START). The rod mechanics carry it to the root; this module reads the
// route mechanics every quarter second (DiagnosticPhysics.routeMechanics) and:
//   - raises the tips' events: wire-not-leading (the catheter pushed in the
//     route beyond its wire), dissection (the accumulator above its threshold,
//     once a puff under the beam shows it), wire-in-lv (the wire tip through
//     the valve; it also gives ectopic beats while it touches the ventricle and
//     the catheter tip is not there), wire-resistance and radial-loop (a wire
//     or the catheter stalls at the loop, or a puff under the beam shows it),
//     new-narrowing-tortuous with new-narrowing (a puff through the catheter,
//     imaged, shows the straightened loop's accordion narrowings), haematoma
//     (a forearm branch perforated by forcing, until a catheter across it
//     seals it) and perforation (once a puff under the beam shows the
//     extravasation), and air (a dry connection);
//   - offers the hand actions of the route: the wires (J, narrow J,
//     hydrophilic, 0.014 in, straight, 260 and 300 cm), transducing the sheath's
//     side arm, puffs through the side arm or the catheter, balloon-assisted
//     tracking, the question whether the narrowings are disease or
//     pseudolesions, and after the wire comes out the wet connection: aspirate
//     2–3 mL, connect while the manifold drips (a dry connection puts air in
//     the line), draw back and discard, fill the catheter with contrast to its
//     tip (pm-to-the-root-advance, Brilakis and Oxford as the module text
//     gives them, 06-to-the-root.ts:538-568);
//   - for a sheath start, refuses an injection through a catheter that is not
//     connected to the manifold;
//   - chooses the table station the image follows (the limb the wire is in).
//
// Nothing here says what the operator could not see: the step log records
// what each action showed (a waveform, a loop on the puff, a gauze), and the
// score is for the debrief. Every number is a MODEL PARAMETER
// (docs/realism/facts/pkg-diag-route-wire-led-radial.md) unless it cites the
// module text.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { Vec3 } from "../../../types";
import type { AnatomyModel } from "../../../simulation/anatomy";
import type { PatientEngine } from "../../../simulation/patient/engine";
import { MP_ENGINE } from "../../../simulation/patient/engine";
import type { Injector } from "../../../simulation/injection";
import { buildRoute3D, forearmAngioTubes, limbExtras, MP_PSEUDOLESION, nearestRouteS, puffTubes, withStraightenedLoop, type Route3D } from "../../../simulation/access/route";
import { IODINE_MG_PER_ML } from "../../../simulation/injection";
import type { BonePrim, TubeSpec } from "../../../render/xray/thorax";
import { ROUTE_WIRES, scenarioStartAt, usePhysicsSettings, type DiagnosticPhysics, type PhysicsMode, type RouteMechanics } from "../../physics/physicsDevices";
import type { useSimulatorStore } from "../../../state/useSimulatorStore";
import type { PedalState } from "../../../simulation/session/types";
import { setTableHub } from "../../lab/TableView";
import type { SessionModule } from "./index";

/** The module's id in the session. */
export const ROUTE_MODULE_ID = "route";

/** The events this module raises in the diagnostic lab. */
export const ROUTE_EVENTS = [
  "wire-not-leading",
  "dissection",
  "wire-in-lv",
  "wire-resistance",
  "radial-loop",
  "new-narrowing",
  "new-narrowing-tortuous",
  "perforation",
  "haematoma",
  "air",
] as const satisfies readonly LabEvent[];

/** What the route module reports (the reachability report reads it): the route's events while the catheter is advanced or exchanged. */
export const raises: LabRaises = {
  lab: "diagnostic",
  phases: ["advance", "exchange"],
  events: ROUTE_EVENTS,
  routes: ["radial", "femoral"],
};

/**
 * MODEL PARAMETERS of the module:
 *   holdS              how long each event stays raised after it was last reported (s)
 *   dryConnectionAirMl air a dry connection puts into the line (mL)
 *   puffMl             contrast of one puff through the side arm or the catheter (mL)
 *   puffS              how long a puff's contrast stays on the image: rise, hold, fade (s)
 *   sheathPuffMm       how far up the artery a side-arm puff fills (mm from the sheath tip): radial, femoral
 *   catheterPuffMm     a puff through the catheter fills this far ahead of its tip and behind it (mm)
 *   pseudolesionAt     the loop's straightening from which a catheter puff shows the accordion narrowings
 *   aspirateMinMl, aspirateMaxMl   the aspiration the module text asks for: "Draw back 2–3 mL and discard it"
 *                      (06-to-the-root.ts:538)
 */
export const MP_ROUTE_MODULE = {
  holdS: { notLeading: 6, dissection: 600, wireInLv: 2, resistance: 20, loop: 120, narrowing: 120, perforation: 600, air: 30 },
  dryConnectionAirMl: 0.3,
  puffMl: 3,
  puffS: { rise: 0.4, hold: 1.2, fade: 2 },
  sheathPuffMm: { radial: 230, femoral: 140 },
  catheterPuffMm: { ahead: 120, back: 40 },
  pseudolesionAt: 0.5,
  /**
   * the iodine of a puff as diluted by the blood in a limb artery, through the side arm and through the catheter.
   * Both are hand puffs into the same forearm artery, so both take the access lab's forearm angiogram share
   * (MP_RADIAL_SEQUENCE.angioIodineShare). The side arm first took AccessFluoroView's 0.5, which drew the loop
   * too faint to read on the diagnostic lab's wider field (in-app check, 10 October 2026).
   */
  iodineShare: { sheath: 0.8, catheter: 0.8 },
  aspirateMinMl: 2,
  aspirateMaxMl: 3,
};

/**
 * How long (lab s) the route controls wait for the physics frames to show a wire action before they take
 * the frames as they come again. Not a clinical figure: the worker's frames arrive a step (1/60 s) or
 * two late; this only bounds the wait if a frame never shows the action.
 */
const PENDING_WIRE_S = 1;

/** The connection of the catheter hub to the manifold after the wire comes out. */
export type RouteConnection = "wire-in" | "open" | "aspirated" | "connected" | "drawn-back" | "filled";

export const ROUTE_STEPS = ["transduce", "puff-sheath", "puff-catheter", "image", "wire", "remove-wire", "aspirate", "connect-wet", "connect-dry", "draw-back", "fill", "inject-refused", "bat", "bat-off", "answer", "station"] as const;
export type RouteStep = (typeof ROUTE_STEPS)[number];

export interface RouteStepEntry {
  step: RouteStep;
  /** lab time, s */
  t: number;
  /** what the operator saw or did (shown in the tab's log) */
  observed: string;
}

/** What the debrief reads (never shown live). */
export interface RouteScore {
  startAt: "root" | "sheath";
  /** catheter advance (mm) made in the route without the wire leading */
  notLeadingAdvanceMm: number;
  dissection: boolean;
  /** seconds of lab time the wire tip spent in the ventricle */
  wireInLvS: number;
  /** connections made without aspirating (or back-bleeding) first, and dry connections */
  connectedWithoutAspiration: number;
  dryConnections: number;
  /** the catheter was filled with contrast to its tip before the first injection */
  filledBeforeInjection: boolean | null;
  /** the resistance algorithm's order: transduced, imaged from below, then another wire */
  transducedFirst: boolean;
  imagedBeforeRewire: boolean;
  /** balloon-assisted tracking used, and the loop straightened (0..1) */
  bat: boolean;
  loopStraighten: number;
  pseudolesionAnswer: "pseudolesion" | "disease" | null;
  perforation: { sealed: boolean } | null;
  routeLostExchanges: number;
  puffs: number;
  contrastMl: number;
}

/** A puff the image shows: when, through what, from where on the route drawing (Route3D arclength, mm). */
export interface RoutePuff {
  t: number;
  via: "sheath" | "catheter";
  fromS: number;
}

/** The lab session as the route module uses it (DiagnosticLabSession satisfies it structurally). */
export interface RouteHost {
  readonly physics: DiagnosticPhysics | null;
  readonly engine: PatientEngine;
  readonly injector: Injector;
  readonly model: AnatomyModel;
  readonly pedal: PedalState;
  readonly events: { raise(event: LabEvent, holdS?: number, t?: number, source?: string): boolean; clear(event: LabEvent): void };
  /** whether the rod mechanics runs in this session, and why not (DiagnosticLabSession.physicsMode) */
  readonly physicsMode?: PhysicsMode;
  beforeInject: (() => boolean) | null;
  wall(): number;
  aspirate(pull?: number): unknown;
  provideCapability(k: "route", v: RouteControl | null): void;
  /** the diagnostic store (the case, and loadCase to open it again with the rod mechanics) */
  readonly store: Pick<typeof useSimulatorStore, "getState" | "setState">;
}

const STATION_LABEL = (r: Route3D, id: string) => r.stations.find((s) => s.id === id)?.label ?? id;

/**
 * The route controls of one lab session. Read-outs say what the operator would see or feel; the score is
 * the debrief's.
 */
export class RouteControl {
  readonly steps: RouteStepEntry[] = [];
  connection: RouteConnection = "wire-in";
  /** the table station the image is centred on: 'auto' follows the leading tip; 'chest' is the lab's usual field */
  station = "auto";
  pseudolesionAsked = false;
  pseudolesionAnswer: "pseudolesion" | "disease" | null = null;
  puffs: RoutePuff[] = [];
  contrastMl = 0;
  private version = 0;
  private geomFor: unknown = null;
  private geom: Route3D | null = null;
  private airAddedMl = 0;
  private aspiratedBeforeConnect = false;
  private connectedWithoutAspiration = 0;
  private dryConnections = 0;
  private filledBeforeInjection: boolean | null = null;
  private wireInLvS = 0;
  private batUsed = false;
  private lastWireId: string | null;
  /**
   * The wire the newest action expects the frames to show (null: out), until a frame shows it. With the
   * worker, frames arrive a step late: a frame from before removeWire still has the wire in it, and one
   * from before chooseWire has none, and neither may undo the action's connection state.
   */
  private pendingWire: { id: string | null; ageS: number } | null = null;

  constructor(readonly host: RouteHost) {
    this.lastWireId = this.wireId();
  }

  /** The rod mechanics is running (the route exists only there). */
  available(): boolean {
    return !!this.host.physics?.active;
  }

  get startAt(): "root" | "sheath" {
    return this.host.physics?.startAt ?? "root";
  }

  /** Where the case's scenario opens (its startAt), whether or not the rod mechanics runs. */
  scenarioStartAt(): "root" | "sheath" {
    return scenarioStartAt(this.host.store.getState().caseData.scenarioId);
  }

  /**
   * A scenario that opens at the sheath while the rod mechanics is off (the route exists only there):
   * why it is off (the session's physicsMode), and whether choosing the rod mechanics in Settings would
   * start it (not when the learner already chose it and the solver still cannot run here). Null otherwise.
   */
  mechanicsOff(): { reason: string | null; canSwitch: boolean } | null {
    if (this.available() || this.scenarioStartAt() !== "sheath") return null;
    let choice: string | null = null;
    try {
      choice = usePhysicsSettings.getState().choice;
    } catch {
      // settings store unavailable
    }
    return { reason: this.host.physicsMode?.reason ?? null, canSwitch: choice !== "rod" };
  }

  /**
   * Choose the rod mechanics in Settings and open this case again with it, keeping the session's policy
   * and overlays (a launch's mode). The lab builds a new session for the reloaded case. False when there
   * is nothing to switch.
   */
  useRodMechanics(): boolean {
    const off = this.mechanicsOff();
    if (!off?.canSwitch) return false;
    usePhysicsSettings.getState().setChoice("rod");
    const st = this.host.store.getState();
    const { caseData, mode, difficulty, policy, overlays } = st;
    st.loadCase(caseData, mode, difficulty);
    this.host.store.setState({ policy, overlays });
    return true;
  }

  rev(): number {
    return this.version;
  }

  mechanics(): RouteMechanics | null {
    return this.host.physics?.routeMechanics() ?? null;
  }

  /** The access route as drawn (stations, limb anatomy, the puffs), built once per case. */
  route3D(): Route3D | null {
    const st = this.host.store.getState();
    const c = st.caseData;
    if (this.geomFor !== c) {
      this.geomFor = c;
      try {
        this.geom = buildRoute3D(c.accessRoute, c, this.host.model);
      } catch {
        this.geom = null;
      }
    }
    return this.geom;
  }

  /** The route as drawn now: its radial loop straightened as far as the physics loop is (route.ts withStraightenedLoop). */
  drawnRoute(): Route3D | null {
    const g = this.route3D();
    if (!g) return null;
    const f = this.host.physics?.radialLoopStraighten ?? 0;
    if (f !== this.drawnFor.f || g !== this.drawnFor.g) this.drawnFor = { f, g, r: withStraightenedLoop(g, f) };
    return this.drawnFor.r;
  }

  private drawnFor: { f: number; g: Route3D | null; r: Route3D | null } = { f: NaN, g: null, r: null };

  /** Whether a puff (through the side arm, or the catheter with its tip at fromS on the drawn route) fills the radial loop's stretch. */
  puffCoversLoop(via: "sheath" | "catheter", fromS: number): boolean {
    const g = this.drawnRoute();
    const loop = g?.segments.find((s) => s.id === "loop");
    if (!g || !loop) return false;
    const P = MP_ROUTE_MODULE;
    const reach = via === "sheath" ? P.sheathPuffMm.radial : fromS + P.catheterPuffMm.ahead;
    const from = via === "sheath" ? 0 : fromS - P.catheterPuffMm.back;
    // a straightened loop's stretch reaches as far as its pseudolesions (route.ts MP_PSEUDOLESION)
    const straight = (this.host.physics?.radialLoopStraighten ?? 0) >= P.pseudolesionAt;
    const a = straight ? loop.start - MP_PSEUDOLESION.beforeMm : loop.start;
    const b = straight ? loop.end + MP_PSEUDOLESION.afterMm : loop.end;
    return reach >= a && from <= b;
  }

  /** The wire in the catheter (physics id), or null when it is out. */
  wireId(): string | null {
    return this.mechanics()?.wireId ?? null;
  }

  wires() {
    return ROUTE_WIRES;
  }

  // --- actions ---------------------------------------------------------------------

  /** Put another wire in the catheter (the one in it comes out through the hub). */
  chooseWire(id: string): boolean {
    const p = this.host.physics;
    if (!p?.active) return false;
    const ok = p.chooseWire(id);
    if (ok) {
      this.connection = "wire-in";
      this.pendingWire = { id, ageS: 0 };
      this.lastWireId = id;
      this.record("wire", `${ROUTE_WIRES.find((w) => w.id === id)?.label ?? id} in the catheter.`);
    }
    return ok;
  }

  /** Take the wire out through the catheter hub: the hub is open and back-bleeds. */
  removeWire(): void {
    const p = this.host.physics;
    if (!p?.active) return;
    p.removeWireFromCatheter();
    this.pendingWire = { id: null, ageS: 0 };
    this.lastWireId = null;
    this.onWireOut();
    this.record("remove-wire", "The wire is out; blood drips back from the hub.");
  }

  /**
   * Transduce the sheath's side arm: the trace the side arm gives. An arterial waveform when the sheath
   * tip lies free in the artery (the module text: no waveform means a subintimal sheath or, from the
   * radial, severe spasm; 06-to-the-root.ts:686). This lab's sheaths lie in the lumen.
   */
  transduceSideArm(): string {
    const hr = this.host.engine.vitals().hr;
    const text = hr !== null ? "An arterial waveform from the sheath's side arm." : "No waveform from the side arm.";
    this.record("transduce", text);
    return text;
  }

  /** A puff of contrast through the sheath's side arm or the catheter (shown on the image with the beam on). */
  puff(via: "sheath" | "catheter"): boolean {
    const p = this.host.physics;
    const r = this.mechanics();
    const g = this.drawnRoute();
    if (!p?.active || !r || !g) return false;
    if (via === "catheter" && r.wireLeadMm !== null) {
      this.record("puff-catheter", "The wire is in the catheter: take it out to inject through the catheter.");
      return false;
    }
    let fromS = 0;
    if (via === "catheter") {
      if (!r.catheterTip) return false;
      fromS = nearestRouteS(g, { x: r.catheterTip[0], y: r.catheterTip[1], z: r.catheterTip[2] });
    }
    const t = this.host.wall();
    this.puffs.push({ t, via, fromS });
    if (this.puffs.length > 8) this.puffs.shift();
    this.contrastMl += MP_ROUTE_MODULE.puffMl;
    this.host.engine.contrast(MP_ROUTE_MODULE.puffMl, "root");
    // what the puff shows is recorded only once the image has shown it (look(), with the beam on)
    this.record(via === "sheath" ? "puff-sheath" : "puff-catheter", via === "sheath" ? "Contrast through the side arm." : "Contrast through the catheter.");
    return true;
  }

  /** Whether a puff fills the route drawing's arclength atS (the stretch the image's puff draws: route.ts puffTubes, forearmAngioTubes). */
  puffShows(p: RoutePuff, atS: number | null): boolean {
    if (atS === null) return false;
    const g = this.drawnRoute();
    if (!g) return false;
    const P = MP_ROUTE_MODULE;
    if (p.via === "sheath") return atS <= (g.access === "femoral" ? P.sheathPuffMm.femoral : P.sheathPuffMm.radial) + 5;
    const s0 = Math.max(0, p.fromS - P.catheterPuffMm.back);
    const s1 = p.fromS + P.catheterPuffMm.ahead;
    return atS >= s0 - 5 && atS <= s1 + 5;
  }

  /**
   * The image of a puff at full strength with the beam on (the module's step): what it showed, once per
   * puff, into the step log, and what it showed for the tips. Without the beam a puff shows nothing.
   */
  look(p: RoutePuff & { strength: number }, beamOn: boolean): { loop: boolean; narrowings: boolean; dissection: boolean; perforation: boolean } | null {
    if (!beamOn || p.strength < 1 || this.lookedAt === p.t) return null;
    this.lookedAt = p.t;
    const straight = this.host.physics?.radialLoopStraighten ?? 0;
    const covers = this.puffCoversLoop(p.via, p.fromS);
    const loop = covers && straight < MP_ROUTE_MODULE.pseudolesionAt;
    const narrowings = covers && straight >= MP_ROUTE_MODULE.pseudolesionAt && p.via === "catheter";
    const dissection = this.puffShows(p, this.drawnS("dissection"));
    const perforation = this.puffShows(p, this.drawnS("perforation"));
    let seen = p.via === "sheath" ? "The contrast fills the artery ahead of the sheath." : "The contrast fills the artery ahead of the catheter tip.";
    if (loop) seen += " The artery turns a full loop.";
    if (narrowings) {
      seen += " The artery runs straight where it looped, with narrowings along it.";
      this.pseudolesionAsked = true;
    }
    if (dissection) seen += " A thin track of contrast stays along the wall.";
    if (perforation) seen += " Contrast spreads out of the artery into the forearm.";
    this.record("image", seen);
    return { loop, narrowings, dissection, perforation };
  }

  private lookedAt = NaN;

  /** Aspirate the open catheter: the module text's 2–3 mL onto the gauze. */
  aspirate(): void {
    if (this.connection !== "open" && this.connection !== "aspirated") {
      this.record("aspirate", this.connection === "wire-in" ? "The wire is still in the catheter." : "The catheter is connected: aspirate through the manifold.");
      return;
    }
    this.host.aspirate(0.4);
    this.connection = "aspirated";
    this.aspiratedBeforeConnect = true;
    this.record("aspirate", `${MP_ROUTE_MODULE.aspirateMinMl}–${MP_ROUTE_MODULE.aspirateMaxMl} mL drawn back and discarded onto the gauze.`);
  }

  /** Connect the manifold to the catheter hub: wet (while the manifold drips) or dry (air in the line). */
  connect(wet: boolean): void {
    if (this.connection !== "open" && this.connection !== "aspirated") return;
    if (!this.aspiratedBeforeConnect) this.connectedWithoutAspiration++;
    const t = this.host.wall();
    if (wet) this.record("connect-wet", "Connected meniscus to meniscus while the manifold drips.");
    else {
      this.dryConnections++;
      const tr = this.host.engine.transducer;
      tr.setAir(tr.st.airMl + MP_ROUTE_MODULE.dryConnectionAirMl);
      this.airAddedMl += MP_ROUTE_MODULE.dryConnectionAirMl;
      this.host.events.raise("air", MP_ROUTE_MODULE.holdS.air, t, "route");
      this.record("connect-dry", "Connected dry: a bubble shows in the line.");
    }
    this.connection = "connected";
    this.version++;
  }

  /** Draw back into the manifold syringe and discard what comes (air or debris from the connection). */
  drawBack(): void {
    if (this.connection !== "connected" && this.connection !== "drawn-back") return;
    const tr = this.host.engine.transducer;
    if (this.airAddedMl > 0) {
      tr.setAir(Math.max(0, tr.st.airMl - this.airAddedMl));
      this.airAddedMl = 0;
    }
    this.connection = "drawn-back";
    this.record("draw-back", "Drawn back into the manifold syringe and discarded.");
  }

  /** Fill the catheter with contrast to its tip. */
  fillToTip(): void {
    if (this.connection !== "connected" && this.connection !== "drawn-back") return;
    this.host.injector.primed = 1;
    this.connection = "filled";
    this.record("fill", "Contrast to the catheter tip.");
  }

  /** Balloon-assisted tracking at `atm` (null: deflated and withdrawn). */
  setBat(atm: number | null): boolean {
    const p = this.host.physics;
    if (!p?.active) return false;
    const ok = p.setBat(atm);
    if (!ok) {
      this.record("bat", "There is no wire beyond the catheter tip for the balloon to ride on.");
      return false;
    }
    if (atm === null) this.record("bat-off", "Balloon deflated and withdrawn into the catheter.");
    else {
      this.batUsed = true;
      this.record("bat", `Balloon half out of the catheter tip, inflated to ${atm} atm.`);
    }
    return true;
  }

  /** The learner's call on the narrowings of a straightened loop. */
  answerPseudolesion(a: "pseudolesion" | "disease"): void {
    if (!this.pseudolesionAsked) return;
    this.pseudolesionAnswer = a;
    this.record("answer", a === "pseudolesion" ? "Called the narrowings pseudolesions of the straightened artery." : "Called the narrowings disease.");
  }

  setStation(id: string): void {
    this.station = id;
    const g = this.route3D();
    this.record("station", id === "auto" ? "The table follows the wire." : `Table to the ${g ? STATION_LABEL(g, id).toLowerCase() : id}.`);
  }

  // --- the image -------------------------------------------------------------------

  /** The station the image is centred on now, or null for the lab's usual field over the chest. */
  stationNow(): { id: string; label: string; c: Vec3 } | null {
    const g = this.route3D();
    if (!g || !this.available()) return null;
    let id = this.station;
    if (id === "auto") {
      if (this.startAt !== "sheath") return null;
      const r = this.mechanics();
      const tip = r ? (r.wireLeadMm !== null && r.wireLeadMm > 0 ? r.wireTip : r.catheterTip ?? r.wireTip) : null;
      if (!tip) return null;
      let best = Infinity;
      for (const s of g.stations) {
        const d = Math.hypot(s.c.x - tip[0], s.c.y - tip[1], s.c.z - tip[2]);
        if (d < best) {
          best = d;
          id = s.id;
        }
      }
    }
    if (id === "chest" || id === "auto") return null;
    const s = g.stations.find((x) => x.id === id);
    return s ? { id: s.id, label: s.label, c: s.c } : null;
  }

  /** The puff on the image now, with its strength (0..1), or null. */
  puffNow(t = this.host.wall()): (RoutePuff & { strength: number }) | null {
    const p = this.puffs[this.puffs.length - 1];
    if (!p) return null;
    const a = t - p.t;
    const S = MP_ROUTE_MODULE.puffS;
    const strength = a < 0 ? 0 : a < S.rise ? a / S.rise : a < S.hold ? 1 : Math.max(0, 1 - (a - S.hold) / S.fade);
    return strength > 0.01 ? { ...p, strength } : null;
  }

  /** The route drawing's arclength (Route3D) of a physics route arclength's point, for the perforation and the dissection. */
  drawnS(kind: "perforation" | "dissection"): number | null {
    const r = this.mechanics();
    const g = this.drawnRoute();
    const p = this.host.physics;
    if (!r || !g || !p) return null;
    const at = kind === "perforation" ? (r.perforation && !r.perforation.sealed ? r.perforation.s : null) : r.dissection?.s ?? null;
    if (at === null) return null;
    const out = this.pointBuf;
    p.devices.lumenSet().routePoint(at, out);
    return nearestRouteS(g, { x: out[0], y: out[1], z: out[2] });
  }

  private readonly pointBuf = new Float64Array(6);

  // --- the score --------------------------------------------------------------------

  score(): RouteScore {
    const r = this.mechanics();
    const steps = this.steps.map((s) => s.step);
    const firstWire = steps.indexOf("wire");
    const firstImage = steps.findIndex((s) => s === "puff-catheter" || s === "puff-sheath");
    const firstTransduce = steps.indexOf("transduce");
    return {
      startAt: this.startAt,
      notLeadingAdvanceMm: r?.notLeadingAdvanceMm ?? 0,
      dissection: !!r?.dissection,
      wireInLvS: this.wireInLvS,
      connectedWithoutAspiration: this.connectedWithoutAspiration,
      dryConnections: this.dryConnections,
      filledBeforeInjection: this.filledBeforeInjection,
      transducedFirst: firstTransduce >= 0 && (firstImage < 0 || firstTransduce < firstImage) && (firstWire < 0 || firstTransduce < firstWire),
      imagedBeforeRewire: firstImage >= 0 && (firstWire < 0 || firstImage < firstWire),
      bat: this.batUsed,
      loopStraighten: this.host.physics?.radialLoopStraighten ?? 0,
      pseudolesionAnswer: this.pseudolesionAnswer,
      perforation: r?.perforation ? { sealed: r.perforation.sealed } : null,
      routeLostExchanges: this.host.physics?.routeLostExchanges ?? 0,
      puffs: steps.filter((s) => s === "puff-catheter" || s === "puff-sheath").length,
      contrastMl: this.contrastMl,
    };
  }

  // --- the session's hooks ------------------------------------------------------------

  /** An injection is about to start: refused at a sheath start while the catheter is not connected (true: allowed). */
  allowInjection(): boolean {
    if (this.startAt !== "sheath" || !this.available()) return true;
    const ok = this.connection === "connected" || this.connection === "drawn-back" || this.connection === "filled";
    if (!ok) {
      this.record("inject-refused", this.connection === "wire-in" ? "The syringe is not connected: the wire is in the catheter." : "The syringe is not connected to the catheter.");
      return false;
    }
    if (this.filledBeforeInjection === null) this.filledBeforeInjection = this.connection === "filled";
    return true;
  }

  private onWireOut(): void {
    if (this.connection === "wire-in") {
      this.connection = "open";
      this.aspiratedBeforeConnect = false;
      this.host.injector.flush();
      this.version++;
    }
  }

  /** Keep the connection, the time in the ventricle and the table view current (the module's step). */
  poll(dt: number): void {
    const r = this.mechanics();
    if (!r) return;
    const wid = r.wireId;
    // a frame from before the newest wire action says nothing about the wire now (at most PENDING_WIRE_S)
    const p = this.pendingWire;
    const stale = !!p && wid !== p.id && (p.ageS += dt) < PENDING_WIRE_S;
    if (!stale) {
      this.pendingWire = null;
      if (wid === null && this.lastWireId !== null) this.onWireOut();
      if (wid !== null && this.lastWireId === null && this.connection !== "wire-in") {
        this.connection = "wire-in";
        this.version++;
      }
      this.lastWireId = wid;
    }
    if (r.wireInLv) this.wireInLvS += dt;
    setTableHub(this.startAt === "sheath" ? { connected: this.connection === "connected" || this.connection === "drawn-back" || this.connection === "filled", wireInHub: this.lastWireId !== null, bat: !!this.host.physics?.bat } : null);
  }

  private record(step: RouteStep, observed: string): void {
    this.steps.push({ step, t: this.host.wall(), observed });
    this.version++;
  }
}

/** What the image adds for the route: the limb (when the table is at a limb station), the puff, and the station to centre on. */
export interface RouteDrawing {
  bones: BonePrim[];
  tubes: TubeSpec[];
  /** the station's field centre (aortic frame), or null for the lab's usual field */
  station: Vec3 | null;
}

const limbCache = new WeakMap<Route3D, BonePrim[]>();

/** The route's additions to the image now (FluoroView), or null when the route adds nothing. */
export function routeDrawing(c: RouteControl | null, model: AnatomyModel, t?: number): RouteDrawing | null {
  if (!c || !c.available()) return null;
  const g = c.route3D();
  if (!g) return null;
  const stn = c.stationNow();
  const p = c.puffNow(t);
  if (!stn && !p) return null;
  let bones: BonePrim[] = [];
  if (stn) {
    bones = limbCache.get(g) ?? limbExtras(g, model);
    limbCache.set(g, bones);
  }
  const tubes: TubeSpec[] = [];
  if (p) {
    const f = c.host.physics?.radialLoopStraighten ?? 0;
    const femoral = g.access === "femoral";
    const perforationS = c.drawnS("perforation");
    const dissectionS = c.drawnS("dissection");
    if (p.via === "sheath")
      tubes.push(
        ...puffTubes(g, model, {
          strength: p.strength,
          lengthMm: femoral ? MP_ROUTE_MODULE.sheathPuffMm.femoral : MP_ROUTE_MODULE.sheathPuffMm.radial,
          spasm: 0,
          mgPerMl: IODINE_MG_PER_ML * MP_ROUTE_MODULE.iodineShare.sheath,
          perforationS,
          dissectionS,
          loopStraighten: f,
        }),
      );
    else
      tubes.push(
        ...forearmAngioTubes(g, model, {
          fromS: p.fromS,
          strength: p.strength,
          mgPerMl: IODINE_MG_PER_ML * MP_ROUTE_MODULE.iodineShare.catheter,
          spasm: 0,
          aheadMm: MP_ROUTE_MODULE.catheterPuffMm.ahead,
          backMm: MP_ROUTE_MODULE.catheterPuffMm.back,
          perforationS,
          dissectionS,
          loopStraighten: f,
        }),
      );
  }
  return { bones, tubes, station: stn ? stn.c : null };
}

declare module "../../lab/controls/types" {
  interface LabCapabilities {
    /** the route from the sheath to the root (diag-route-wire-led-radial) */
    route: RouteControl;
  }
}

const ROUTE_GUARD = Symbol("route-inject-guard");
type GuardedInject = (() => boolean) & { [ROUTE_GUARD]?: true; prev?: (() => boolean) | null };

/**
 * A premature ventricular beat from the wire touching the ventricle. The patient engine counts ventricular
 * contact only for a catheter tip in the LV (TipInput.lvContact with location 'lv'); a wire tip through the
 * valve with the catheter in the root has no input there, so the module asks the engine for the beat
 * itself, at the engine's own chance per beat (MP_ENGINE.pvcPerBeatLvContact). The engine's method is not
 * public; a later engine change (a wire-contact input) can replace this call.
 */
function wireEctopicBeat(engine: PatientEngine): boolean {
  const e = engine as unknown as { prematureBeat?: () => void };
  if (typeof e.prematureBeat !== "function") return false;
  e.prematureBeat();
  return true;
}

/** A small deterministic generator for the ectopy draws (seeded by the case). */
function lcg(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

/** The diagnostic session module of the route (registered by this file). */
export function createSessionModule(): SessionModule {
  let host: RouteHost | null = null;
  let control: RouteControl | null = null;
  let acc = 0;
  let lastInBeat = -1;
  let rand: () => number = Math.random;
  let perforationShown = false;
  let dissectionShown = false;
  let lastNotLed = -Infinity;
  const guard = () => {
    const h = host;
    const c = control;
    if (!h || !c) return;
    const cur = h.beforeInject as GuardedInject | null;
    if (cur && cur[ROUTE_GUARD]) return;
    const prev = cur;
    const f: GuardedInject = () => {
      if (prev && !prev()) return false;
      return c.allowInjection();
    };
    f[ROUTE_GUARD] = true;
    f.prev = prev;
    h.beforeInject = f;
  };
  return {
    id: ROUTE_MODULE_ID,
    attach(session) {
      host = session as unknown as RouteHost;
      // the table strip's hub belongs to this session from here (a session not disposed leaves no hub behind)
      setTableHub(null);
      control = new RouteControl(host);
      rand = lcg(host.store.getState().caseData.id ?? "route");
      host.provideCapability("route", control);
      guard();
      return () => {
        const h = host;
        if (h) {
          const cur = h.beforeInject as GuardedInject | null;
          if (cur && cur[ROUTE_GUARD]) h.beforeInject = cur.prev ?? null;
          h.provideCapability("route", null);
        }
        setTableHub(null);
        host = null;
        control = null;
      };
    },
    step(dt) {
      const h = host;
      const c = control;
      if (!h || !c) return;
      // ectopy from the wire, beat by beat (a new beat: the time in the beat starts again). r.lvContact is
      // the wire's contact only while the catheter tip is not in the ventricle, where the engine counts it.
      const r = c.mechanics();
      const cs = h.engine.clockState();
      if (cs.tInBeat < lastInBeat && r?.lvContact && rand() < MP_ENGINE.pvcPerBeatLvContact) wireEctopicBeat(h.engine);
      lastInBeat = cs.tInBeat;
      acc += dt;
      if (acc < 0.25) return;
      const step = acc;
      acc = 0;
      guard();
      c.poll(step);
      if (!r) return;
      const t = h.wall();
      const H = MP_ROUTE_MODULE.holdS;
      // the catheter was pushed beyond its wire since the last look (the solver clock of the frame)
      if (r.lastNotLeadingT !== null && r.lastNotLeadingT > lastNotLed) {
        lastNotLed = r.lastNotLeadingT;
        h.events.raise("wire-not-leading", H.notLeading, t, "route");
      }
      if (r.wireInLv) h.events.raise("wire-in-lv", H.wireInLv, t, "route");
      if (r.stalled?.device === "wire") h.events.raise("wire-resistance", H.resistance, t, "route");
      if (r.loop?.stalled) h.events.raise("radial-loop", H.loop, t, "route");
      // what a puff shows, with the beam on: the loop, the straightened loop's narrowings, a dissection or a
      // perforation are named only once the image has shown them (r.dissection stays in the score)
      const p = c.puffNow(t);
      const seen = p ? c.look(p, h.pedal.fluoro || h.pedal.cine) : null;
      if (seen) {
        if (seen.loop) h.events.raise("radial-loop", H.loop, t, "route");
        if (seen.narrowings) {
          h.events.raise("new-narrowing", H.narrowing, t, "route");
          h.events.raise("new-narrowing-tortuous", H.narrowing, t, "route");
        }
        if (seen.dissection && !dissectionShown) {
          dissectionShown = true;
          h.events.raise("dissection", H.dissection, t, "route");
        }
        if (seen.perforation && !perforationShown) {
          perforationShown = true;
          h.events.raise("perforation", H.perforation, t, "route");
        }
      }
      // the swelling of a perforated forearm branch shows without an image
      if (r.perforation && !r.perforation.sealed) h.events.raise("haematoma", H.perforation, t, "route");
    },
  };
}
