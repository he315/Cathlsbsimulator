// ---------------------------------------------------------------------------
// PCI procedure state: the types every action module shares, the initial
// state, the geometry wrappers and the shared internal helpers (event log,
// telemetry, wire mirrors, complication mirrors, lesion geometry).
//
// This file imports no action module (src/simulation/pci/actions/*): the
// actions depend on the state, never the other way round. facade.test.ts
// checks it.
//
// The public symbols are re-exported by name from src/simulation/angioPci.ts;
// the helpers below the "Internal helpers" banner are for the action modules
// only and are not part of the angioPci facade.
// ---------------------------------------------------------------------------

import type { PathologyKind, VesselId } from "../../types";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import { DEVICE_BY_ID, GUIDE_BY_ID, deviceFor, type BalloonKind, type DeviceSpec, type WireKind } from "./equipment";
import { cloneWire, initialWire, type LesionNow, type WireState } from "./coronaryWire";
import { initialGuide, type GuideState } from "./guide";
import { initialIndeflator, type IndeflatorState } from "./indeflator";
import {
  pciGeom as buildGeom,
  radiusAtMm,
  routeEndMm,
  routeSamples as geomRouteSamples,
  sampleAtMm as geomSampleAtMm,
  takeOffAngle as geomTakeOffAngle,
  type PciGeom as Geom,
} from "./geometry";
import { rngFrom, type RngState } from "./rng";
import type { PressureWireState } from "./pressureWire";
import type { IvusRun } from "./ivus";
import type { CaliperEstimate, EstimateScore, SizingBasis } from "./lesionAssessment";
import { initialCx, type CxNote, type CxState } from "../complications/engine";

export type PciGeom = Geom;

export interface PciScenario {
  id: string;
  title: string;
  /** clinical vignette (synthetic) */
  brief: string;
  side: "left" | "right";
  guide: string;
  target: { vessel: VesselId; position: number; severity: number; lengthMm: number; kind: PathologyKind };
  /** 0 none, 1 moderate, 2 severe calcium */
  calcium: 0 | 1 | 2;
  thrombus: boolean;
  /** recommended working views (view preset ids) */
  views: string[];
  /** what the case teaches */
  points: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** lipid-rich culprit (no-reflow risk); optional */
  lipid?: boolean;
}

export type DeviceKind = "balloon" | "stent" | "covered-stent" | "ivus" | "extension";

export type DeviceStage = "box" | "checked" | "prepared" | "backloaded" | "in-guide";

export interface Device {
  kind: DeviceKind;
  specId: string;
  balloon: BalloonKind;
  /** nominal diameter (mm) */
  diameter: number;
  lengthMm: number;
  /** centre position along the wire route (mm from the ostium; negative = inside the guide) */
  centreMm: number;
  atm: number;
  inflated: boolean;
  stage: DeviceStage;
  labelChecked: boolean;
  prepared: boolean;
  /** the steps were done by the team (headless or assisted use) */
  assisted: boolean;
  /** this balloon's burst pressure (drawn) */
  burstAtm: number;
  ruptured: boolean;
  /** a stent already deployed from this delivery balloon */
  deployed: boolean;
  /** highest pressure whose effect on the lesion has been applied (atm) */
  appliedAtm: number;
  /**
   * a stent damaged on the way (pci-device-delivery): pulled back into a guide that was not coaxial
   * ('guide-tip'), or forced against a guide extension's collar ('collar'). Absent or null: intact. The
   * operator sees it only when the device is out on the table; pci-equipment-loss reads it.
   */
  deformed?: { at: "guide-tip" | "collar"; t: number } | null;
  // ---- the table workflow (pci-equipment-tray); absent on devices loaded by the assisted path ----
  /** the contrast mixture in the prep syringe and the balloon (absent: the team's usual 1:1) */
  mixture?: BalloonMixture | null;
  /** air left in the balloon's inflation lumen, 0..1 of what an unprepared balloon holds (absent: none) */
  airFraction?: number;
  /** negative suction cycles with the plunger up at the prep station */
  suctionCycles?: number;
  /** the indeflator is connected to the balloon's hub */
  indeflatorConnected?: boolean;
  /** the box this device came from (the cart's), with its use-by date; absent: a fresh box from the team */
  box?: { useBy: string; expired: boolean } | null;
  /** air the device carries into the guide when it is introduced (mL, an unprepared device) */
  carriedAirMl?: number;
}

/**
 * The prep syringe's mixture (pm-prep-and-stent-balloon-choose, Step 4: "usually half contrast and half
 * saline"; a weaker mixture inflates and deflates faster but is harder to see): '1:1' contrast and saline,
 * '1:2' one part contrast to two of saline, 'saline' alone, 'none' (no syringe filled: air).
 */
export type BalloonMixture = "1:1" | "1:2" | "saline" | "none";

/** One box on the equipment cart (pci-equipment-tray, src/simulation/pci/cart.ts). */
export interface CartBox {
  specId: string;
  diameter: number;
  lengthMm: number;
  /** boxes of this size on the shelf */
  qty: number;
  /** use-by date printed on the front box (YYYY-MM-DD) */
  useBy: string;
  /** boxes behind the front one are in date; the front one may not be */
  expiredFront: boolean;
}

/** The cart: what is stocked, in which sizes and with which use-by dates, on the case's date. */
export interface CartStock {
  /** the scenario's stock id (absent: the full catalogue) */
  id: string;
  /** the case's date (YYYY-MM-DD) */
  today: string;
  boxes: CartBox[];
}

/** What the table workflow keeps (pci-equipment-tray): the truth for the debrief and the attending, never shown live. */
export interface TrayRecord {
  cart: CartStock | null;
  /** the cart was checked before the first wire or device, and when */
  cartCheckedT: number | null;
  /** cart items the learner flagged at the check (spec ids) */
  cartFlags: string[];
  restocked: boolean;
  /** label read-backs: what the box said */
  labelChecks: { t: number; specId: string; diameter: number; lengthMm: number; useBy: string; expired: boolean }[];
  /** boxes returned unopened (an expired box sent back) */
  returned: { t: number; specId: string; expired: boolean }[];
  /** devices from out-of-date boxes taken into the guide */
  expiredUsed: { t: number; specId: string; diameter: number; lengthMm: number; useBy: string }[];
  /** the guide has been back-bled and aspirated since the valve was last opened or a device was removed */
  guideClear: boolean;
  /** a device removal (or the case start) since which the wire tip has not been checked with an injection */
  lastRemovalT: number | null;
  /** the pre-device checklist at each introduction: wire tip checked by an injection, wire tip out of a small branch, guide cleared */
  checklist: { t: number; wireChecked: boolean; wireInSmallBranch: boolean; guideClear: boolean }[];
  /** steps the scrub nurse did on request */
  assisted: { t: number; step: string }[];
  /** the coronary wire's table set-up, for the wire now on the table */
  wireSetup: WireSetup | null;
  /** wires loaded through the valve and whether the tip was damaged on the way */
  wireLoads: { t: number; kind: string; damaged: boolean; cause: string | null }[];
}

/** How the coronary wire was set up at the table (pm-wiring-shape-load, Brilakis wiring steps 3 to 5). */
export interface WireSetup {
  /** the haemostatic valve on the Y-connector: a standard rotating valve or an automated one */
  yConnector: "rotating" | "automated";
  /** an introducer was used */
  introducer: boolean;
  /** the shaped tip was withdrawn fully into the introducer */
  tipHidden: boolean;
  /** the introducer was passed all the way through the valve */
  throughValve: boolean;
  /** where the torque device was tightened (cm from the wire tip), or null if none */
  torqueDeviceCm: number | null;
}

export interface Placed {
  vessel: VesselId;
  fromMm: number;
  toMm: number;
  /** expanded diameter (mm) in the stent body and at the lesion */
  diameter: number;
  atLesion: number;
  /** route the stent sits on, nominal size and labelled length */
  route: string[];
  nominal: number;
  labelLengthMm: number;
  /** expanded diameter of each ring (mm), proximal to distal */
  ringD: number[];
  compressionMm: number;
  covered: boolean;
  /**
   * diameter the stent lost at the lesion after it expanded (acute recoil, mm), until a post-dilatation
   * opens it again (pci-indeflator; absent or 0: none)
   */
  recoilMm?: number;
  /**
   * the proximal stent a kiss left oval (pci-two-rail-engine): its span (route mm) and the ratio of its long
   * to its short axis, until a POT inside it rounds it again (absent or null: round)
   */
  oval?: { fromMm: number; toMm: number; ratio: number } | null;
  /**
   * an old stent the case opens with, its lumen narrowed by restenosis (the in-stent start of
   * pm-prep-and-stent#5, PciStartSetup.underStrut): a balloon over the lesion inside it dilates the lesion
   * rather than post-dilating the stent (absent: a stent placed in this case)
   */
  restenosed?: boolean;
}

export interface PciEvent {
  t: number;
  tone: "info" | "good" | "warn" | "danger";
  text: string;
}

/** Telemetry for the mentor (S11 event names). */
export interface PciTelemetry {
  t: number;
  kind: string;
  data: Record<string, unknown>;
}

export interface PciState {
  // ---- wire (mirrors of `wire` kept for existing readers) ----
  wireKind: WireKind;
  route: string[];
  tipMm: number;
  tipAngle: number;
  wire: WireState;
  // ---- guide and table ----
  guide: GuideState;
  valveOpen: boolean;
  device: Device | null;
  ind: IndeflatorState;
  // ---- lesion ----
  severity: number;
  resistance: number;
  predilated: boolean;
  stents: Placed[];
  // ---- complications (engine) and legacy mirrors ----
  cx: CxState;
  dissection: null | { vessel: VesselId; atMm: number; lengthMm: number; kind: "lesion" | "edge" };
  perforation: null | { atMm: number; grade: 1 | 2 | 3 };
  slowFlow: boolean;
  geographicMiss: boolean;
  balloonRupture: boolean;
  // ---- drugs and checks ----
  heparinGiven: boolean;
  act: { value: number; t: number } | null;
  /** true ACT from the patient engine (null: assumed anticoagulated) */
  actTrue: number | null;
  protamine: boolean;
  oxygen: boolean;
  aspirated: boolean;
  /** hyperaemia now (0..1), from the patient engine or the headless curve */
  hyperaemia: number;
  // ---- assessment ----
  estimate: { est: CaliperEstimate; score: EstimateScore; t: number } | null;
  qcaRevealed: boolean;
  sizing: { basis: SizingBasis; diameter: number; lengthMm: number } | null;
  pressure: PressureWireState | null;
  ivus: IvusRun | null;
  // ---- bookkeeping ----
  contrastMl: number;
  fluoroS: number;
  cineRuns: number;
  wireTime: number;
  lastInjectionT: number | null;
  injectedSinceDeviceMove: boolean;
  counters: {
    offRouteBranches: number;
    septalEntries: number;
    whips: number;
    guideBackouts: number;
    wireMigrationMm: number;
    deployWithoutRun: number;
    unpreparedDevices: number;
    uncheckedLabels: number;
    actSkipped: number;
    oversizedOutsideLesion: number;
    postdilatedInStent: boolean;
    melonSeeds: number;
    /** devices whose distal end left the guide tip for the coronary with the beam off (pci-device-delivery) */
    unscreened: number;
  };
  events: PciEvent[];
  log: PciTelemetry[];
  rng: RngState;
  t: number;
  finished: boolean;
  /** wiring, microcatheter and pseudolesion record (pci-wire-microcatheter); absent means none yet */
  wiring?: WiringRecord;
  /** inflation record (pci-indeflator); absent means none yet */
  inflation?: InflationRecord;
  /** delivery and support record (pci-device-delivery); absent means none yet */
  delivery?: DeliveryRecord;
  /** the table workflow's record (pci-equipment-tray: cart, labels, preparation, the guide cleared); absent means none yet */
  tray?: TrayRecord;
  /**
   * The two rails (pci-two-rail-engine): each a coronary wire with the device and indeflator on it. The
   * legacy fields above (wire, wireKind, route, tipMm, tipAngle, device, ind, pressure) are the rail the
   * hands are working on, rails[activeRail]; syncRail() writes them back into it and every rail action
   * calls it. Absent until a second wire is loaded or a wire crosses a stent's struts (railsOf gives the
   * single-rail view then), so a single-wire case keeps exactly the state it had before.
   */
  rails?: [RailState, RailState];
  /** the rail the hands work on now (absent: 0) */
  activeRail?: 0 | 1;
}

// ---------------------------------------------------------------------------
// Two rails (pci-two-rail-engine)
// ---------------------------------------------------------------------------

/**
 * The strut cell through which a wire crossed from inside a deployed stent into a side branch, by where it
 * crossed along the branch ostium (0 at its proximal edge, 1 at the carina; MP_CELL_DISTAL_U and
 * MP_CELL_CARINA_U in actions/wire.ts): 'carina' the cell at the carina itself, 'distal' a cell in the half
 * of the ostium next to the carina, 'proximal' a cell in its proximal half. The first two are the
 * distal-cell crossing cp-bifurcation-provisional-sb teaches ("through a cell close to the carina"); a
 * proximal cell leaves struts across the ostium.
 */
export type RailCell = "distal" | "carina" | "proximal";

/** A wire left outside a stent deployed beside it: jailed between the struts and the wall. */
export interface RailJail {
  /** index of the stent in PciState.stents */
  stentIdx: number;
  /** the vessel the jailed wire lies in (a side branch, or the main vessel for a buddy wire) */
  branch: string;
  /** where the wire leaves the stent (route mm: the branch origin, or the stent's distal end) */
  atMm: number;
  /** length of wire trapped under the stent (mm) */
  jailedMm: number;
  t: number;
}

/** How a wire crossed through a stent's struts into a side branch. */
export interface RailCrossing {
  stentIdx: number;
  branch: string;
  /** the branch origin (route mm on the parent) */
  atMm: number;
  /** where along the ostium it crossed (0 proximal edge … 1 carina) */
  u: number;
  cell: RailCell;
  /** 'withdraw': it fell into the origin on a slow pull-back from beyond the carina; 'advance': it met the ostium going forward */
  approach: "withdraw" | "advance";
  t: number;
  /** a later balloon across the take-off (a final POT with its marker at the carina) narrowed the opened cell */
  narrowed?: boolean;
}

/** A wire that passed outside a stent's struts at its proximal edge: devices on it stop at that edge. */
export interface RailUnderStrut {
  stentIdx: number;
  /** the stent edge the devices stop at (route mm) */
  edgeMm: number;
  cause: "malapposed-edge" | "strut-edge" | "start";
  t: number;
}

export interface RailState {
  /** the rail's coronary wire (null: no wire on this rail) */
  wire: WireState | null;
  device: Device | null;
  ind: IndeflatorState;
  /** the pressure-wire session of this rail's wire (a pressure wire on this rail) */
  pressure: PressureWireState | null;
  jailed: RailJail | null;
  /** the cell the wire crossed into a branch through a deployed stent (null: none) */
  cell: RailCell | null;
  crossing: RailCrossing | null;
  underStrut: RailUnderStrut | null;
  /** the tip has fallen into a branch origin inside a stent on a pull-back; the next push into it crosses there */
  fallIn: { branch: string; stentIdx: number; atMm: number; u: number; t: number } | null;
  /** bites forced on against the stent edge a device stalls at (pm-prep-and-stent#5: the old stent deforms) */
  edgeForcing: number;
  /** stent edges this wire has crossed going forward (the draws of the under-strut model) */
  edgeCrossings: number;
}

/** An empty rail: no wire, no device. */
export function emptyRail(): RailState {
  return { wire: null, device: null, ind: initialIndeflator(), pressure: null, jailed: null, cell: null, crossing: null, underStrut: null, fallIn: null, edgeForcing: 0, edgeCrossings: 0 };
}

/** The active rail's index (0 when the state has one rail). */
export function activeRailOf(st: Pick<PciState, "activeRail">): 0 | 1 {
  return st.activeRail === 1 ? 1 : 0;
}

/** Write the legacy fields (the rail the hands work on) back into rails[activeRail]. No-op with one rail. */
export function syncRail(st: PciState): PciState {
  if (!st.rails) return st;
  const i = activeRailOf(st);
  const r = st.rails[i];
  if (r.wire === st.wire && r.device === st.device && r.ind === st.ind && r.pressure === st.pressure) return st;
  const rails = st.rails.slice() as [RailState, RailState];
  rails[i] = { ...r, wire: st.wire, device: st.device, ind: st.ind, pressure: st.pressure };
  return { ...st, rails };
}

/** Both rails as they are now (the active one from the legacy fields); one rail and an empty one before a second wire. */
export function railsOf(st: PciState): [RailState, RailState] {
  if (st.rails) return syncRail(st).rails!;
  return [{ ...emptyRail(), wire: st.wire, device: st.device, ind: st.ind, pressure: st.pressure }, emptyRail()];
}

/**
 * Two wires are in the guide: both rails hold a wire. The test the two-rail models use (the jail, the cell
 * crossing, the carina-shift exposure, a balloon through the struts, the kiss); a state whose rails were made
 * explicit for one wire (the in-stent start's under-strut wire) keeps the single-wire models.
 */
export function twoWires(st: Pick<PciState, "rails">): boolean {
  return !!st.rails && st.rails[0].wire !== null && st.rails[1].wire !== null;
}

/** The state with its rails made explicit (rail 0 the current wire, rail 1 empty), the hands on rail 0. */
export function ensureRails(st: PciState): PciState {
  if (st.rails) return syncRail(st);
  return { ...st, rails: railsOf(st), activeRail: 0 };
}

/** Change one rail's record (not its wire, device or indeflator: those are the legacy fields for the active rail). */
export function withRail(st0: PciState, i: 0 | 1, f: (r: RailState) => Partial<RailState>): PciState {
  const st = ensureRails(st0);
  const rails = st.rails!.slice() as [RailState, RailState];
  rails[i] = { ...rails[i], ...f(rails[i]) };
  return { ...st, rails };
}

/**
 * Put the hands on rail `i`: the legacy fields become that rail's wire, device, indeflator and pressure
 * wire. Refused (unchanged) when the rail has no wire.
 */
export function selectRail(st0: PciState, i: 0 | 1): PciState {
  if (activeRailOf(st0) === i && (i === 0 || st0.rails)) return st0;
  const st = ensureRails(st0);
  const r = st.rails![i];
  if (!r.wire) return st0;
  const w = r.wire;
  return { ...st, activeRail: i, wire: w, wireKind: w.kind, route: w.route.slice(), tipMm: w.tipMm, tipAngle: w.tip, device: r.device, ind: r.ind, pressure: r.pressure };
}

/**
 * The support options for a device that will not go (pm-prep-and-stent-support, Brilakis 9.7 and 23.1).
 * Who records each (actions/devices.ts recordSupport, or noteSupport once per series of bites for a hand
 * action): forward-push, advanceDevice (the guide held during a push that needs more than the guide alone holds); deep-seat and
 * partial-wire-withdrawal, the PCI input target (a guide push or a wire pull with a device out in the
 * vessel); buddy-wire, support-wire, anchor-balloon, deep-breath, guide-extension and support-catheter, the
 * support console and the actions it calls; guide-exchange, the guide exchange (actions/guide.ts
 * exchangeGuideOverWire, not yet: it is outside pci-device-delivery's files).
 */
export type SupportOption =
  | "forward-push"
  | "deep-seat"
  | "guide-exchange"
  | "buddy-wire"
  | "support-wire"
  | "partial-wire-withdrawal"
  | "anchor-balloon"
  | "deep-breath"
  | "guide-extension"
  | "support-catheter";

/** What the delivery actions keep (pci-device-delivery): the truth for the debrief and the attending, never shown live. */
export interface DeliveryRecord {
  /** device withdrawals that drew the guide deeper into the vessel, and by how much in all (mm) */
  suckIns: number;
  suckInMm: number;
  /** how far the guide's back-outs pulled an unpinned wire back (mm in all) */
  wireRetreatMm: number;
  /** stents deformed (at the guide tip on withdrawal, at an extension's collar) */
  deformedStents: number;
  /** guide extension advanced beyond the guide tip over the bare wire (mm in all) */
  extensionBareMm: number;
  /** pushes on the extension stopped by a straddling balloon that was still inflated (inchworming without deflating) */
  extensionBlocked: number;
  /** times the extension's proximal collar left the guide */
  collarOut: number;
  /** device pushes stopped at the extension's collar (a catching stent or a wire wrapped round the push rod) */
  collarStalls: number;
  /** anchor balloons sized above 1:1 to their branch or inflated outside the low-pressure range */
  anchorBreaches: number;
  /** support catheters landed in less than the landing zone they need */
  shortLandings: number;
  /** attempts to take a support catheter out by trapping (it needs an exchange-length wire) */
  supportTrapAttempts: number;
  /** the support options used, in order */
  support: { option: SupportOption; t: number }[];
}

/** The delivery record of a state, with the defaults when absent. */
export function deliveryOf(st: Pick<PciState, "delivery">): DeliveryRecord {
  return (
    st.delivery ?? {
      suckIns: 0,
      suckInMm: 0,
      wireRetreatMm: 0,
      deformedStents: 0,
      extensionBareMm: 0,
      extensionBlocked: 0,
      collarOut: 0,
      collarStalls: 0,
      anchorBreaches: 0,
      shortLandings: 0,
      supportTrapAttempts: 0,
      support: [],
    }
  );
}

/**
 * What a start state opens with beyond the guide and the wire (pci-device-delivery): a device already on
 * the wire, pushed by the team in short bites until it stopped (the delivery physics decides where), and
 * the guide as the failed push left it. Declared on a scenario pack's start (PciStartDef & { setup }) and
 * applied by actions/devices.ts applyStartSetup after the wire is parked across. Every number is a
 * teaching value of a synthetic case.
 */
export interface PciStartSetup {
  device?: {
    /** catalogue id (src/simulation/pci/equipment.ts DEVICE_BY_ID) */
    specId: string;
    diameter: number;
    lengthMm: number;
  };
  /** the guide's coaxiality during the push that failed (absent: as the start left it) */
  pushCoaxial?: number;
  /** the guide after the failed push: its depth beyond the ostium (mm, negative backed out) and coaxiality (absent: as the push left it) */
  guide?: { depthMm: number; coaxial: number };
  /**
   * an old stent across the target lesion, with the wire parked across passing outside its proximal struts
   * (pm-prep-and-stent#5, the in-stent restenosis variant; pci-two-rail-engine): the stent's size, centred
   * on the lesion. Applied before the device push, so a device in the setup stops at the old stent's edge.
   */
  underStrut?: { diameter: number; lengthMm: number };
}

/**
 * What a predilatation left (pci-indeflator): the states of the stent-or-not decision. 'good' a result
 * to stent; 'slow-flow' slow flow or no-reflow without a dissection; 'dissection' a flow-limiting
 * dissection; 'waist' a waist that persists; 'small-vessel' a very small distal vessel.
 */
export type PredilOutcome = "good" | "slow-flow" | "dissection" | "waist" | "small-vessel";

/** What the inflation actions keep beyond the indeflator itself (pci-indeflator). */
export interface InflationRecord {
  /** the inflation model's own draws (recoil, imposed outcomes), so they never shift the other draws */
  rng: RngState;
  /** the first predilatation's result (the truth, for the debrief; never shown on the live screens) */
  predil: null | { t: number; outcome: PredilOutcome; imposed: boolean };
  /** balloons pulled back before they had emptied */
  pulledBeforeDeflation: number;
  /** guide depth gained (mm) by those pulls, in all */
  guideDrawnInMm: number;
  /** cutting balloons inflated faster than their labelled rate, or above their rated pressure */
  cuttingRuleBreaches: number;
  /** inflations that ended with a waist at or above the rated burst pressure after a hold of the rule's length */
  undilatable: number;
}

/** The inflation record of a state, with the defaults when absent. */
export function inflationOf(st: Pick<PciState, "inflation" | "rng">): InflationRecord {
  return (
    st.inflation ?? {
      rng: rngFrom(`inflation:${st.rng.s}`),
      predil: null,
      pulledBeforeDeflation: 0,
      guideDrawnInMm: 0,
      cuttingRuleBreaches: 0,
      undilatable: 0,
    }
  );
}

/** What the wire and microcatheter actions keep beyond the wire itself (pci-wire-microcatheter). */
export interface WiringRecord {
  /** pseudolesions a support wire has made at the bends (since: procedure time they appeared) */
  pseudo: null | { since: number; sites: { vessel: string; atMm: number }[] };
  /** the last selective injection through the microcatheter */
  microInjection: null | { t: number; route: string[]; fromMm: number; subintimal: boolean };
  /** microcatheter injections made without a backflow check, and those made from a subintimal position */
  uncheckedMicroInjections: number;
  subintimalMicroInjections: number;
  /** the wire came out with a microcatheter pulled over a short wire */
  wiresLost: number;
  /** hydraulic exchanges over a polymer-jacketed or stiff-tip wire */
  hydraulicOverSlippery: number;
  /** the wire was pulled back behind the lesion while pseudolesions were being checked */
  pulledBehindLesion: number;
  /** wire exchanges and reshapes made through a microcatheter */
  exchangesThroughMicro: number;
}

/** The wiring record of a state, with the defaults when absent. */
export function wiringOf(st: Pick<PciState, "wiring">): WiringRecord {
  return (
    st.wiring ?? {
      pseudo: null,
      microInjection: null,
      uncheckedMicroInjections: 0,
      subintimalMicroInjections: 0,
      wiresLost: 0,
      hydraulicOverSlippery: 0,
      pulledBehindLesion: 0,
      exchangesThroughMicro: 0,
    }
  );
}

/** The tray record of a state, with the defaults when absent (no cart opened yet, the guide clear at the start). */
export function trayOf(st: Pick<PciState, "tray">): TrayRecord {
  return (
    st.tray ?? {
      cart: null,
      cartCheckedT: null,
      cartFlags: [],
      restocked: false,
      labelChecks: [],
      returned: [],
      expiredUsed: [],
      guideClear: true,
      lastRemovalT: null,
      checklist: [],
      assisted: [],
      wireSetup: null,
      wireLoads: [],
    }
  );
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export interface InitOptions {
  /** start with the guide seated (headless scripts) or out of the ostium (the lab) */
  guideEngaged?: boolean;
  guide?: string;
  seed?: string | number;
  /** heparin given before the case (headless default true: the team has anticoagulated) */
  heparinised?: boolean;
}

export function initialPci(s: PciScenario, opts: InitOptions = {}): PciState {
  const engaged = opts.guideEngaged ?? true;
  const guideId = opts.guide ?? s.guide;
  const gs = initialGuide(guideId, engaged, 6);
  const seed = opts.seed ?? `pci-${s.id}`;
  const wire = initialWire("workhorse", s.side, { seed: `${seed}:wire`, guideEngaged: engaged, guideTurning: (GUIDE_BY_ID[guideId] ?? GUIDE_BY_ID.JL4).curveTurning });
  const heparinised = opts.heparinised ?? true;
  return {
    wireKind: wire.kind,
    route: wire.route.slice(),
    tipMm: wire.tipMm,
    tipAngle: wire.tip,
    wire,
    guide: gs,
    valveOpen: false,
    device: null,
    ind: initialIndeflator(),
    severity: s.target.severity,
    resistance: s.calcium === 2 ? 0.62 : s.calcium === 1 ? 0.32 : 0.08,
    predilated: false,
    stents: [],
    cx: initialCx(`${seed}:cx`),
    dissection: null,
    perforation: null,
    slowFlow: false,
    geographicMiss: false,
    balloonRupture: false,
    heparinGiven: heparinised,
    act: null,
    actTrue: null,
    protamine: false,
    oxygen: false,
    aspirated: false,
    hyperaemia: 0,
    estimate: null,
    qcaRevealed: false,
    sizing: null,
    pressure: null,
    ivus: null,
    contrastMl: 0,
    fluoroS: 0,
    cineRuns: 0,
    wireTime: 0,
    lastInjectionT: null,
    injectedSinceDeviceMove: false,
    counters: {
      offRouteBranches: 0,
      septalEntries: 0,
      whips: 0,
      guideBackouts: 0,
      wireMigrationMm: 0,
      deployWithoutRun: 0,
      unpreparedDevices: 0,
      uncheckedLabels: 0,
      actSkipped: 0,
      oversizedOutsideLesion: 0,
      postdilatedInStent: false,
      melonSeeds: 0,
      unscreened: 0,
    },
    events: [
      {
        t: 0,
        tone: "info",
        text: engaged ? `${GUIDE_BY_ID[guideId]?.label ?? guideId} guide engaged. Choose a working view and inject to see the lesion.` : `${GUIDE_BY_ID[guideId]?.label ?? guideId} guide in the aortic root. Engage the ostium, then inject.`,
      },
    ],
    log: [{ t: 0, kind: "case-start", data: { scenario: s.id, seed: String(seed) } }],
    rng: rngFrom(`${seed}:devices`),
    t: 0,
    finished: false,
  };
}

// ---------------------------------------------------------------------------
// Geometry (re-exported from pci/geometry.ts)
// ---------------------------------------------------------------------------

/** Index the tree for wire navigation. `refTree` is the same anatomy without lesions (for reference diameters). */
export function pciGeom(s: PciScenario, tree: CoronaryTree, refTree: CoronaryTree): PciGeom {
  return buildGeom(s, tree, refTree);
}
export const sampleAtMm = geomSampleAtMm;
export const routeSamples = geomRouteSamples;
export const takeOffAngle = geomTakeOffAngle;
export { routeEndMm };

/** The target lesion as the devices meet it now. */
export function lesionNow(s: PciScenario, g: PciGeom, st: Pick<PciState, "severity">): LesionNow {
  const mld = g.lesion.refDiameter * (1 - st.severity / 100);
  const occlusion = st.severity >= 95 ? (s.target.kind === "cto" ? "cto" : s.target.kind === "thrombotic" ? "thrombotic" : "cto") : "none";
  return { vessel: g.lesion.vessel, startMm: g.lesion.startMm, endMm: g.lesion.endMm, mldMm: mld, occlusion: st.severity >= 95 ? occlusion : "none", calcium: s.calcium };
}

// ---------------------------------------------------------------------------
// Internal helpers (action modules only; not re-exported by angioPci.ts)
// ---------------------------------------------------------------------------

/** Append an operator-facing event (st.events). */
export const log = (st: PciState, tone: PciEvent["tone"], text: string): PciState => ({ ...st, events: [...st.events, { t: st.t, tone, text }] });
/** Append a telemetry record (st.log) for the mentor and the tip context. */
export const tele = (st: PciState, kind: string, data: Record<string, unknown> = {}): PciState => ({ ...st, log: [...st.log, { t: st.t, kind, data }] });

/** Fold complication-engine notes into the event log and telemetry, then refresh the legacy mirrors. */
export function withNotes(st: PciState, notes: CxNote[]): PciState {
  let out = st;
  for (const n of notes) {
    out = log(out, n.tone, n.text);
    if (n.type === "event") out = tele(out, "complication", { kind: n.kind, id: n.id });
  }
  return syncMirrors(out);
}

/** Store a wire state and its legacy mirrors (wireKind, route, tipMm, tipAngle), and the active rail with them. */
export function syncWire(st: PciState, w: WireState): PciState {
  return syncRail({ ...st, wire: w, wireKind: w.kind, route: w.route.slice(), tipMm: w.tipMm, tipAngle: w.tip });
}

/** Wire state with any legacy fields a caller has set directly (tipAngle, route, tipMm) folded in. */
export function wireOf(st: PciState): WireState {
  const w = cloneWire(st.wire);
  if (st.tipAngle !== w.tip) {
    // a caller set the tip direction directly (scripts): the tip turns with no stored torque
    w.tip = st.tipAngle;
    w.hub = st.tipAngle + w.offset;
  }
  if (st.tipMm !== w.tipMm) w.tipMm = st.tipMm;
  if (st.route.join("/") !== w.route.join("/")) w.route = st.route.slice();
  if (st.wireKind !== w.kind) w.kind = st.wireKind;
  w.guideEngaged = st.guide.engaged || w.tipMm > 3;
  return w;
}

/** Legacy mirrors (dissection, perforation, slow flow) from the complication engine. */
export function syncMirrors(st: PciState): PciState {
  const live = st.cx.list.filter((c) => c.stage !== "resolved");
  const dis = live.filter((c) => c.kind === "dissection").sort((a, b) => b.severity - a.severity)[0];
  const perf = live.filter((c) => c.kind === "perforation").sort((a, b) => b.severity - a.severity)[0];
  const slow = live.some((c) => c.kind === "no-reflow" || (c.kind === "thrombus" && c.data.embolised));
  return {
    ...st,
    dissection: dis ? { vessel: (dis.vessel as VesselId) ?? "LAD", atMm: dis.atMm, lengthMm: dis.lengthMm, kind: dis.cause.includes("edge") ? "edge" : "lesion" } : null,
    perforation: perf ? { atMm: perf.atMm, grade: perf.grade === "I" ? 1 : perf.grade === "II" ? 2 : 3 } : null,
    slowFlow: slow,
  };
}

/** Local reference diameter (mm) at a route position. */
export function refDAt(g: PciGeom, route: string[], mm: number): number {
  return 2 * radiusAtMm(g, route, mm, true);
}

/** Overlap (0..1) of a span with the lesion, when on the lesion's route. */
export function lesionCover(g: PciGeom, route: string[], from: number, to: number): number {
  if (!route.includes(g.lesion.vessel)) return 0;
  const a = Math.max(from, g.lesion.startMm);
  const b = Math.min(to, g.lesion.endMm);
  return Math.max(0, b - a) / (g.lesion.endMm - g.lesion.startMm);
}

/** 0..1 lesion profile at a route position on the lesion vessel (1 at the centre). */
export function lesionShape(g: PciGeom, mm: number): number {
  const L = g.lesion;
  const half = (L.endMm - L.startMm) / 2;
  const d = Math.abs(mm - L.centreMm) / Math.max(0.5, half);
  return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
}

/** The catalogue spec of a device on the table. */
export function specOf(dev: Device): DeviceSpec {
  return DEVICE_BY_ID[dev.specId] ?? deviceFor(dev.kind === "stent" ? "stent" : "balloon", dev.balloon);
}
