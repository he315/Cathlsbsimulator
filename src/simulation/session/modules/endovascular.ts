// ---------------------------------------------------------------------------
// Full-case session module 'endovascular' (access-cx-endovascular-control).
//
// Endovascular control from the opposite groin, and the cold leg treated by
// its cause. The rules, grades and findings are pure functions in
// src/simulation/access/endovascular.ts with their sources; the route over
// the aortic bifurcation is route.ts buildCrossoverRoute3D, walked by the 1-D
// wire and catheter of procedure.ts (buildCrossoverRoute, stepWire,
// stepCatheter); the controls are src/ui/access/EndovascularPanel.tsx and the
// image is drawn by src/ui/access/AccessFluoroView.tsx from draw().
//
// What the learner does:
//   - a bleed (a scenario's hole in the external iliac or common femoral
//     artery, or in a small branch): the nurse reports the signs; the learner
//     says the suspicion or acts on it, opens the other femoral artery as
//     another access site (the session's own multi-site flow), brings a
//     shaped crossover catheter up to the aortic bifurcation and leads over
//     it with the wire (the tip aimed from the hooked catheter), images the
//     iliofemoral arteries through it (the extravasation is drawn, never
//     named), moves the device position along the wire to the hole and
//     inflates the occlusion balloon at low pressure (the flow stops and the
//     patient stops losing blood), checks a branch for retrograde filling,
//     upsizes to the 7 Fr long crossover sheath, and places the device that
//     fits the vessel and the segment, where its geometry decides what it
//     covers (the hole, the femoral bifurcation, a branch's mouth);
//   - a cold leg (a scenario's cause, or one the learner's own technique
//     caused in any femoral case: an injection through the sheath against a
//     damped trace, a wire (the session's or the crossover wire) forced
//     until it buckles in the iliofemoral arteries, a side arm flushed
//     without aspirating and discarding first, as the session's sheath-prep
//     record scores it): the nurse reports the
//     symptoms; the learner examines the leg (the six Ps, the pulses, the toe
//     pleth, the skin), names it (acute limb ischaemia or cholesterol
//     embolisation), orders angiography of the leg from the other groin or
//     not, reads the image, and treats by the cause.
// Nothing on the live screen names the injury or the cause: the image and
// the examination are results to be read, the learner's reading and call
// are graded in the ledger and the debrief.
//
// Tips: the module reports 'bleeding' once the learner suspects the bleed or
// acts on it, 'limb-ischaemia' once the learner names the leg's picture or
// orders angiography of it, and 'dissection' once the learner reads a flap on
// the angiogram; each opens the case's femoral access 'complication' context
// (src/ui/access/caseTips.ts), with access-cx-iliofemoral-balloon-first,
// access-cx-small-branch-embolise, access-cx-iliac-dissection-crossover,
// access-cx-cold-leg-six-ps and access-closure-cold-leg. In a large-bore case
// (the scenario says so) a suspected bleed also opens an MCS complication
// context with the large-bore procedure, for mcs-cx-covered-stent-site.
// `raises` declares both for the reachability report.
//
// A case without a scenario episode is unchanged until the learner's own
// technique causes a cold leg; the live hazards draw from the module's own
// seeded generator, never the session's, so other modules' draws do not move.
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { CaseSession, LogLine } from "../caseSession";
import type { CaseSessionModule } from "./index";
import type { Vec3 } from "../../../types";
import { Rng } from "../../../utils/random";
import { MP_RP } from "../../access/bleeding";
import { SHEATHS, type SheathId } from "../../access/closure";
import { tubeAt } from "../../access/site";
import {
  ANGIO_READING_LABEL,
  ENDO_DEVICE_LABEL,
  ENDO_SOURCED,
  ENDO_VESSEL_LABEL,
  LEG_CALL_LABEL,
  LEG_TREATMENT_LABEL,
  MP_ENDO,
  angioTruth,
  expectedLegTreatment,
  forcedWireDissectionP,
  gradeDevice,
  gradeLegAngio,
  gradeLegCall,
  gradeLegTreatment,
  injectionDissectionP,
  isBranch,
  isDefinitive,
  isStent,
  legFindings,
  legOcclusionLevel,
  type AngioReading,
  type DeviceVerdict,
  type EndoDevice,
  type EndoInjury,
  type EndoTarget,
  type EndoVessel,
  type LegCall,
  type LegCause,
  type LegFindings,
  type LegLesion,
  type LegTreatment,
} from "../../access/endovascular";
import { MP_CROSSOVER, MP_LIMB, branchOriginS, buildCrossoverRoute3D, crossoverSAtSiteX, siteToAortic, targetLimbPoint, type CrossoverRoute3D } from "../../access/route";
import { buildCrossoverRoute, initialWire, segmentAt, stepCatheter, stepWire, type Route, type WireState } from "../../procedure";
import { cycleCuff } from "../emergencies";

export const ENDOVASCULAR_MODULE_ID = "endovascular";

/** The events this module reports (each only after the learner's own call or action). */
export const ENDO_EVENTS = ["bleeding", "dissection", "limb-ischaemia"] as const satisfies readonly LabEvent[];

/**
 * What this module can report (the reachability report reads it): its events into the case's femoral access
 * contexts, where they open the 'complication' context, and an MCS complication context with the large-bore
 * procedure and bleeding in a large-bore case.
 */
export const raises: readonly LabRaises[] = [
  { lab: "access", phases: ["complication"], events: ENDO_EVENTS, routes: ["femoral"] },
  { lab: "mcs", phases: ["complication"], events: ["bleeding"], procedures: ["large-bore"] },
];

const LESSON_BLEED = "cm-access-complications-femoral-bleeding";
const LESSON_LARGE = "cm-access-complications-large-bore";
const LESSON_LIMB = "cm-access-complications-limb";
const T_BALLOON = ["access-cx-iliofemoral-balloon-first", "mcs-cx-largebore-bleed-balloon"];
const T_DEVICE = ["access-cx-iliofemoral-balloon-first", "access-cx-small-branch-embolise", "mcs-cx-covered-stent-site"];
const T_BRANCH = ["access-cx-small-branch-embolise"];
const T_LEG = ["access-cx-cold-leg-six-ps", "access-closure-cold-leg"];
const T_DISSECTION = ["access-cx-iliac-dissection-crossover", "access-cx-cold-leg-six-ps"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A scenario's bleed (scenario settings: MODEL PARAMETERS of the scenario unless cited there). */
export interface EndoBleedConfig {
  kind: "bleed";
  injury: EndoInjury;
  /** whole-blood loss while it bleeds (mL/min), what it reaches untreated (mL), and what is already lost at onset (mL) */
  rateMlMin: number;
  totalMl: number;
  initialMl?: number;
  onsetAfterMin: number;
  /** the bleeding groin (default the planned femoral site's) */
  side?: "right" | "left";
  report?: string;
  /** the case was a large-bore one (the MCS context's procedure) */
  largeBore?: boolean;
}

/** A scenario's cold leg. */
export interface EndoLegConfig {
  kind: "leg";
  lesion: LegLesion;
  onsetAfterMin: number;
  side?: "right" | "left";
  report?: string;
}

export type EndoConfig = EndoBleedConfig | EndoLegConfig;

export interface EndoBleed {
  onsetT: number;
  injury: EndoInjury;
  side: "right" | "left";
  rateMlMin: number;
  leftMl: number;
  lostMl: number;
  sealed: { t: number; by: EndoDevice } | null;
  /** the flow has been stopped by the balloon since then (s), or null */
  occludedSinceT: number | null;
  /** the first time the flow was stopped (s), or null */
  firstOccludedT: number | null;
}

export interface EndoLeg {
  onsetT: number;
  lesion: LegLesion;
  side: "right" | "left";
  source: "scenario" | "technique";
  treated: { t: number; by: LegTreatment } | null;
}

export interface CrossState {
  /** the access groin's site and the target groin's site */
  siteId: string;
  targetSiteId: string;
  route3d: CrossoverRoute3D;
  route: Route;
  wire: WireState;
  wireKind: "j" | "hydrophilic";
  catheterPos: number;
  /** the 7 Fr long crossover sheath is across the bifurcation */
  longSheath: boolean;
}

export interface EndoResult {
  ok: boolean;
  text: string;
  verdict?: DeviceVerdict;
}

export type EndoStep = "retrograde" | "long-sheath" | "seal" | "leg-treat";

export interface EndoState {
  config: EndoConfig | null;
  pendingOnsetT: number | null;
  learnerFromT: number | null;
  bleed: EndoBleed | null;
  leg: EndoLeg | null;
  /** a leg problem the learner's technique caused, presenting then (s) */
  pendingLeg: { at: number; lesion: LegLesion; side: "right" | "left"; report: string } | null;
  /** the learner said the bleed aloud or acted on it */
  suspectedT: number | null;
  /** the learner's call on the leg, and when */
  legCall: { t: number; call: LegCall } | null;
  legExaminedT: number | null;
  legAngioOrderedT: number | null;
  /** an angiogram taken while the leg problem was in hand */
  legImagedT: number | null;
  cross: CrossState | null;
  /** the device position on the crossover wire (crossover s, mm) */
  deviceS: number;
  balloon: { inflated: "low" | "high" | null; t: number | null };
  stents: { s: number; lenMm: number; device: EndoDevice }[];
  coils: Vec3[];
  angios: { t: number; fromS: number; truth: AngioReading }[];
  reading: { t: number; reading: AngioReading } | null;
  retrograde: { t: number; branch: EndoVessel; filling: boolean }[];
  placed: { t: number; device: EndoDevice; target: EndoTarget; s: number; correct: boolean; effect: DeviceVerdict["effect"] }[];
  profundaLost: boolean;
  inProgress: { what: EndoStep; at: number; label: string; device?: EndoDevice; leg?: LegTreatment; branch?: EndoVessel }[];
  results: { t: number; title: string; text: string }[];
  note: string | null;
  decided: string[];
}

export interface EndovascularModule extends CaseSessionModule {
  id: typeof ENDOVASCULAR_MODULE_ID;
  readonly state: EndoState;
  actions: {
    configure: (cfg: EndoConfig) => void;
    learnerControl: () => void;
    /** the learner says it: a suspected iliofemoral bleed */
    suspect: () => EndoResult;
    startCrossover: (wireKind?: "j" | "hydrophilic") => EndoResult;
    crossWire: (advance: number, torque: number) => void;
    crossCatheter: (advance: number) => void;
    longSheath: () => EndoResult;
    /** the device position along the crossover wire: to s, or moved by mm */
    deviceTo: (s: number) => number;
    moveDevice: (mm: number) => number;
    inflate: (pressure: "low" | "high") => EndoResult;
    deflate: () => EndoResult;
    angiogram: () => EndoResult;
    read: (reading: AngioReading) => EndoResult;
    checkRetrograde: () => EndoResult;
    deploy: (device: EndoDevice, target?: EndoTarget) => EndoResult;
    examineLeg: () => LegFindings;
    callLeg: (call: LegCall) => EndoResult;
    legAngiography: () => EndoResult;
    treatLeg: (t: LegTreatment) => EndoResult;
    /** the panel shows itself: an episode in hand, or a femoral artery sheath in each groin */
    visible: () => boolean;
    crossoverActive: () => boolean;
    /** where the hole is on a site's own route (crossover-free sheath puffs), or null */
    extravasationOnRoute: (siteId: string) => number | null;
    /** a hole in the common femoral artery below a site's sheath tip, for its femoral angiogram, or null */
    groinExtravasation: (siteId: string) => { p: Vec3; t: Vec3 } | null;
    /** a hole in a small branch of a site's groin, for its own sheath puff or femoral angiogram (with the branch's site tube id and the hole's site x, so the view can fill the branch up to it), or null */
    branchExtravasation: (siteId: string) => { p: Vec3; t: Vec3; branchId: string; x: number } | null;
    /** how far up a site's own route (mm from its sheath tip) a puff runs before the crossover's inflated balloon in that groin stops it, or null */
    occlusionOnRoute: (siteId: string) => number | null;
    /** what the crossover image holds now, for AccessFluoroView (the same object while nothing it shows changes) */
    draw: () => EndoDraw | null;
    /** the crossover s of the hole, of a branch origin, of the leg lesion (tests and the debrief) */
    holeS: () => number | null;
    lesionS: () => number | null;
  };
}

/** What the fluoroscopy view draws of the crossover. */
export interface EndoDraw {
  route3d: CrossoverRoute3D;
  wire: WireState;
  wireKind: "j" | "hydrophilic";
  aimHeading: number;
  catheterPos: number;
  balloon: { s: number; lenMm: number; inflated: boolean };
  stents: { s: number; lenMm: number }[];
  coils: Vec3[];
  /** the last angiogram (its time, for the view's fade) and what it shows now */
  angio: { t: number; fromS: number; stopS: number | null; flapS: number | null; extravasation: { p: Vec3; t: Vec3 } | null; profundaLost: boolean } | null;
  targetSiteId: string;
}

/** The endovascular module of a session, if attached. */
export function endovascularOf(s: Pick<CaseSession, "mod">): EndovascularModule | undefined {
  return s.mod<EndovascularModule>(ENDOVASCULAR_MODULE_ID);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmtMin = (sec: number) => `${Math.round(sec / 6) / 10} min`;
/** The French size a site sheath takes (closure.ts SHEATHS, as caseSession.catheterFr reads it); 0 without one. */
const sheathFrOf = (id: SheathId | undefined): number => (id ? (SHEATHS[id]?.fr ?? 0) : 0);
/** The sheath preparation ledger id caseSession records for a femoral site (its femoralDecisionId). */
const sheathPrepId = (x: { origin: "planned" | "added"; id: string }) => (x.origin === "planned" ? "sheath-aspirate-then-flush" : `sheath-aspirate-then-flush-${x.id}`);

type EnginePort = { fluid?(ml: number, overS?: number): void };

// ---------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------

export function createSessionModule(): EndovascularModule {
  let s: CaseSession = null as unknown as CaseSession;
  let rng: Rng | null = null;
  /**
   * live-hazard bookkeeping: femoral angiograms and wrong sheath flushes (ledger records, by id and time) already
   * seen, and the last log line read (the log is capped by splice, so it is found by reference, not by index)
   */
  const seenAngio = new Map<string, number>();
  const seenFlush = new Set<string>();
  let lastLog: LogLine | undefined;

  const st: EndoState = {
    config: null,
    pendingOnsetT: null,
    learnerFromT: null,
    bleed: null,
    leg: null,
    pendingLeg: null,
    suspectedT: null,
    legCall: null,
    legExaminedT: null,
    legAngioOrderedT: null,
    legImagedT: null,
    cross: null,
    deviceS: 0,
    balloon: { inflated: null, t: null },
    stents: [],
    coils: [],
    angios: [],
    reading: null,
    retrograde: [],
    placed: [],
    profundaLost: false,
    inProgress: [],
    results: [],
    note: null,
    decided: [],
  };

  const now = () => round1(s.tS);
  const eng = () => s.patient as unknown as EnginePort;
  const log = (kind: "action" | "nurse" | "result" | "patient" | "event", text: string) => s.logEntry(kind, text);
  const tel = (kind: string, data: Record<string, unknown>) => s.telemetry.push({ tWall: now(), tPatient: s.patient.clockState().t, kind: `endovascular.${kind}`, data });
  const learner = () => st.learnerFromT !== null && !s.teamSetup;
  const touch = () => {
    if (st.learnerFromT === null && !s.teamSetup) st.learnerFromT = now();
  };
  const inHand = () => !!st.bleed || !!st.leg;
  const once = (id: string) => {
    if (!learner() || !inHand() || st.decided.includes(id)) return false;
    st.decided.push(id);
    return true;
  };
  const decide = (id: string, label: string, correct: boolean, expected: string, given: string, lessonId: string, tipIds: string[]) => {
    if (!learner() || !inHand()) return;
    const prev = s.decisions().find((d) => d.id === id);
    if (prev && !prev.correct) return;
    s.decide({ id, stage: "endovascular", label, correct, expected, given, lessonId, tipIds });
  };
  const record = (text: string) => {
    log("action", text);
    tel("action", { text });
  };
  const refuse = (text: string): EndoResult => {
    st.note = text;
    return { ok: false, text };
  };
  const done = (text: string, verdict?: DeviceVerdict): EndoResult => {
    st.note = text;
    return { ok: true, text, ...(verdict ? { verdict } : {}) };
  };
  const later = (p: EndoState["inProgress"][number]) => st.inProgress.push(p);
  const underway = (what: EndoStep) => st.inProgress.some((p) => p.what === what);
  const result = (title: string, text: string) => {
    st.results.push({ t: now(), title, text });
    log("result", `${title}: ${text}`);
  };
  const largeBore = () => st.config?.kind === "bleed" && !!st.config.largeBore;
  const bleedLesson = () => (largeBore() ? LESSON_LARGE : LESSON_BLEED);

  // -------------------------------------------------------------------------
  // sites and geometry
  // -------------------------------------------------------------------------

  /** The groin the problem is in: the scenario's, else the planned femoral site's. */
  const targetSide = (): "right" | "left" => st.bleed?.side ?? st.leg?.side ?? st.config?.side ?? s.sites.find((x) => x.siteKind === "femoral")?.side ?? "right";
  const femoralSite = (side: "right" | "left") => s.sites.find((x) => x.siteKind === "femoral" && x.route === "femoral" && x.side === side);
  const contralateral = () => {
    const x = femoralSite(targetSide() === "right" ? "left" : "right");
    return x && x.sheath && !x.sheath.venous ? x : undefined;
  };
  const targetSite = () => femoralSite(targetSide());
  const targetLandmarks = (): { bifurcationX?: number; ligamentX?: number } => targetSite()?.site.landmarks ?? {};

  /** The crossover s of the bleeding hole (the branch's origin for a branch), or null. */
  const holeS = (): number | null => {
    const c = st.cross;
    const b = st.bleed;
    if (!c || !b) return null;
    if (isBranch(b.injury.vessel)) return branchOriginS(c.route3d, targetSite()?.site, b.injury.vessel) ?? crossoverSAtSiteX(c.route3d, b.injury.siteX);
    return crossoverSAtSiteX(c.route3d, b.injury.siteX);
  };
  const lesionS = (): number | null => {
    const c = st.cross;
    const l = st.leg;
    return c && l ? crossoverSAtSiteX(c.route3d, l.lesion.siteX) : null;
  };
  const femBifS = (): number | null => {
    const c = st.cross;
    return c ? crossoverSAtSiteX(c.route3d, targetLandmarks().bifurcationX ?? 0) : null;
  };
  const balloonRange = () => ({ lo: st.deviceS - MP_ENDO.balloonLenMm / 2, hi: st.deviceS + MP_ENDO.balloonLenMm / 2 });

  /** The balloon stops the flow to the hole: inflated beyond the bifurcation, over the hole or above it. */
  const occluding = (): boolean => {
    const c = st.cross;
    const h = holeS();
    if (!c || h === null || !st.balloon.inflated) return false;
    const r = balloonRange();
    return r.hi >= c.route3d.bifurcationS + 2 && r.lo <= h + MP_ENDO.coverMarginMm && c.wire.branch === "main" && c.wire.pos >= r.hi - 1;
  };
  /** An inflated balloon in the target iliac artery: the leg's inflow is stopped (the lesson's reasoning, 997). */
  const balloonInLimb = (): boolean => {
    const c = st.cross;
    return !!c && !!st.balloon.inflated && balloonRange().hi >= c.route3d.bifurcationS + 2;
  };

  // -------------------------------------------------------------------------
  // episodes
  // -------------------------------------------------------------------------

  const startBleed = (c: EndoBleedConfig) => {
    if (st.bleed) return;
    const b: EndoBleed = {
      onsetT: now(),
      injury: { ...c.injury },
      side: c.side ?? targetSide(),
      rateMlMin: c.rateMlMin,
      leftMl: Math.max(0, c.totalMl),
      lostMl: 0,
      sealed: null,
      occludedSinceT: null,
      firstOccludedT: null,
    };
    st.bleed = b;
    if ((c.initialMl ?? 0) > 0) {
      b.lostMl += c.initialMl!;
      eng().fluid?.(-c.initialMl! * MP_RP.stressedShare, 60);
    }
    if (c.report) log("nurse", c.report);
    cycleCuff(s, 1);
    s.holdLapse(ENDOVASCULAR_MODULE_ID);
    tel("onset", { kind: "bleed", vessel: b.injury.vessel });
  };

  const startLeg = (lesion: LegLesion, side: "right" | "left", source: EndoLeg["source"], report?: string) => {
    if (st.leg) return;
    st.leg = { onsetT: now(), lesion: { ...lesion }, side, source, treated: null };
    if (report) log("nurse", report);
    tel("onset", { kind: "leg", cause: lesion.cause, source });
  };

  const bleedStep = (h: number) => {
    const b = st.bleed;
    if (!b || b.sealed || b.leftMl <= 0) return;
    if (occluding()) return;
    const ml = Math.min(b.leftMl, (b.rateMlMin * h) / 60);
    if (ml <= 0) return;
    b.leftMl -= ml;
    b.lostMl += ml;
    eng().fluid?.(-ml * MP_RP.stressedShare, 1);
  };

  const sealBy = (d: EndoDevice) => {
    const b = st.bleed;
    if (!b || b.sealed) return;
    b.sealed = { t: now(), by: d };
    log("result", d === "surgery" ? "Back from theatre: the artery has been repaired." : "Check angiogram: no contrast leaves the artery.");
    s.releaseLapse(ENDOVASCULAR_MODULE_ID);
    if (b.injury.vessel === "common-femoral" && !st.profundaLost && once("bifurcation"))
      decide("endo-bifurcation", "The femoral bifurcation left uncovered", true, "Never a stent across the femoral bifurcation (surgery for a hole there)", "Bifurcation clear", LESSON_LARGE, ["mcs-cx-covered-stent-site"]);
    tel("sealed", { by: d });
  };

  // -------------------------------------------------------------------------
  // live hazards: the learner's own technique in any femoral case
  // -------------------------------------------------------------------------

  const draw = (p: number) => {
    rng ??= new Rng(`endovascular:${s.seed}`);
    return rng.next() < p;
  };
  const scheduleLeg = (lesion: LegLesion, side: "right" | "left") => {
    if (st.leg || st.pendingLeg || st.config) return;
    const report = `The patient says the ${side} foot hurts and feels numb.`;
    st.pendingLeg = { at: s.tS + MP_ENDO.legOnsetS, lesion, side, report };
    tel("hazard", { cause: lesion.cause });
  };

  /** The learner's wrong sheath flushes (caseSession's sheath-prep ledger records), by site, not yet drawn on. */
  const wrongFlushes = (): { key: string; site: CaseSession["sites"][number] }[] => {
    const out: { key: string; site: CaseSession["sites"][number] }[] = [];
    const ds = s.decisions();
    for (const x of s.sites) {
      if (x.siteKind !== "femoral" || x.route !== "femoral") continue;
      const id = sheathPrepId(x);
      const d = ds.find((r) => r.id === id);
      if (d && !d.correct && !seenFlush.has(`${id}@${d.t}`)) out.push({ key: `${id}@${d.t}`, site: x });
    }
    return out;
  };
  /** Mark what is already there as seen: the team's injections, flushes and log at attach, in the start state and at handover. */
  const seedSeen = () => {
    for (const x of s.sites) if (x.femoralAngio) seenAngio.set(x.id, x.femoralAngio.t);
    for (const f of wrongFlushes()) seenFlush.add(f.key);
    lastLog = s.log[s.log.length - 1];
  };

  const liveHazards = () => {
    if (s.teamSetup) {
      seedSeen();
      return;
    }
    if (st.config) return;
    const X0 = MP_LIMB.sheathTipSiteX;
    for (const x of s.sites) {
      if (x.siteKind !== "femoral" || x.route !== "femoral") continue;
      // an injection through the sheath against a damped trace
      const a = x.femoralAngio;
      if (a && seenAngio.get(x.id) !== a.t) {
        seenAngio.set(x.id, a.t);
        if (draw(injectionDissectionP({ waveform: a.waveform, wireIn: a.wireIn }))) scheduleLeg({ cause: "iliac-dissection", siteX: X0 + 5 }, x.side);
      }
    }
    // a clot flushed out of the sheath: only the learner's flush of a sheath not aspirated and discarded first (the
    // sheath-prep record caseSession scores wrong), once per record; a catheter through a dirty sheath carries its
    // clot in the catheter lumen (caseSession's own clot path), not down the leg
    for (const f of wrongFlushes()) {
      seenFlush.add(f.key);
      if (draw(MP_ENDO.clotEmbolusP)) scheduleLeg({ cause: "embolus", siteX: (f.site.site.landmarks.bifurcationX ?? 0) - 40 }, f.site.side);
    }
    // a wire forced until it buckles in the iliofemoral arteries: the log lines since the last one read, in order.
    // The buckle springs the wire back 3 mm (procedure.ts), so the segment is looked for there as well; the wire is
    // read at this slow tick (no session hook passes its position at the buckle)
    let i = s.log.length - 1;
    while (i >= 0 && s.log[i] !== lastLog) i--;
    for (let k = i + 1; k < s.log.length; k++) {
      const l = s.log[k];
      if (l.text !== "The wire buckled." || s.access !== "femoral" || s.activeSite.siteKind !== "femoral") continue;
      const seg = segmentAt(s.route, s.wire.pos).id;
      const back = segmentAt(s.route, s.wire.pos + 3).id;
      const iliofemoral = seg === "femoral" || seg === "iliac" || back === "femoral" || back === "iliac";
      if (iliofemoral && draw(forcedWireDissectionP(s.wireKind))) scheduleLeg({ cause: "iliac-dissection", siteX: X0 + Math.max(5, s.wire.pos) }, s.activeSite.side);
    }
    lastLog = s.log[s.log.length - 1];
  };

  // -------------------------------------------------------------------------
  // timers
  // -------------------------------------------------------------------------

  const finishDue = () => {
    for (let i = st.inProgress.length - 1; i >= 0; i--) {
      const p = st.inProgress[i];
      if (s.tS < p.at) continue;
      st.inProgress.splice(i, 1);
      switch (p.what) {
        case "retrograde": {
          const filling = !!st.bleed && st.bleed.injury.vessel === p.branch && !!st.bleed.injury.retrograde;
          st.retrograde.push({ t: now(), branch: p.branch!, filling });
          result("Selective injection of the branch", filling ? "The branch beyond its mouth also fills backwards, from the other side." : "The branch fills from its mouth only; nothing fills it backwards.");
          break;
        }
        case "long-sheath":
          if (st.cross) st.cross.longSheath = true;
          log("action", `The ${ENDO_SOURCED.crossoverSheathFr} Fr long crossover sheath is over the bifurcation.`);
          break;
        case "seal":
          sealBy(p.device!);
          break;
        case "leg-treat":
          if (st.leg && !st.leg.treated) {
            st.leg.treated = { t: now(), by: p.leg! };
            log("result", p.leg === "surgery" ? "Back from theatre." : "Check angiogram: the leg fills to the foot.");
          }
          break;
      }
    }
  };

  // -------------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------------

  const configure = (cfg: EndoConfig) => {
    st.config = cfg.kind === "bleed" ? { ...cfg, injury: { ...cfg.injury } } : { ...cfg, lesion: { ...cfg.lesion } };
    st.pendingOnsetT = s.tS + Math.max(0, cfg.onsetAfterMin) * 60;
  };

  const learnerControl = () => {
    st.learnerFromT = now();
    seedSeen();
    if (st.config) st.pendingOnsetT = s.tS + Math.max(0, st.config.onsetAfterMin) * 60;
  };

  const markSuspected = () => {
    if (st.bleed && st.suspectedT === null) st.suspectedT = now();
  };

  const suspect = (): EndoResult => {
    touch();
    if (st.suspectedT !== null) return refuse("Already said.");
    st.suspectedT = now();
    record("Said aloud: a suspected bleed from the iliofemoral arteries.");
    return done("Noted.");
  };

  const startCrossover = (wireKind: "j" | "hydrophilic" = "j"): EndoResult => {
    touch();
    if (st.cross) return refuse("The crossover catheter is already in.");
    const acc = contralateral();
    const tgt = targetSite();
    if (!acc || !tgt) return refuse("Get access in the other groin first: open the other femoral artery as another access site, with a sheath in it.");
    if (s.wireInBody || s.catheter?.inBody) return refuse("Take the catheter and wire out first.");
    if (s.busy) return refuse("Wait for the step in hand to finish.");
    if (s.activeSiteId !== acc.id && !s.setActiveSite(acc.id)) return refuse("Work at the other groin first.");
    const lm = tgt.site.landmarks;
    const route3d = buildCrossoverRoute3D(acc.wireRoute.geom, tgt.wireRoute.geom, { ligamentX: lm.ligamentX, bifurcationX: lm.bifurcationX });
    st.cross = { siteId: acc.id, targetSiteId: tgt.id, route3d, route: buildCrossoverRoute(route3d), wire: initialWire(), wireKind, catheterPos: 0, longSheath: false };
    st.deviceS = 0;
    record(`A shaped crossover catheter on a ${wireKind === "j" ? "J" : "hydrophilic"} wire in through the ${acc.side} femoral sheath.`);
    return done("In.");
  };

  const hooked = (c: CrossState) => !!c.route.junction && c.catheterPos >= c.route.junction.atS - MP_ENDO.hookMm;

  /**
   * The crossover wire forced until it buckles in an iliac or external iliac segment of either limb (read where it
   * buckled): the same live hazard as the session's own wire, outside the endovascular scenarios.
   */
  const crossBuckle = (c: CrossState) => {
    log("event", "The crossover wire buckled.");
    if (s.teamSetup || st.config) return;
    const id = segmentAt(c.route, c.wire.pos).id;
    if (id !== "iliac" && id !== "femoral") return;
    const X0 = MP_LIMB.sheathTipSiteX;
    const bif = c.route3d.bifurcationS;
    const tgt = s.siteById(c.targetSiteId);
    const acc = s.siteById(c.siteId);
    if (c.wire.pos > bif + MP_CROSSOVER.bifHalfMm && tgt) {
      if (draw(forcedWireDissectionP(c.wireKind))) scheduleLeg({ cause: "iliac-dissection", siteX: X0 + Math.max(5, c.route3d.targetTipS - c.wire.pos) }, tgt.side);
    } else if (c.wire.pos < bif - MP_CROSSOVER.bifHalfMm && acc) {
      if (draw(forcedWireDissectionP(c.wireKind))) scheduleLeg({ cause: "iliac-dissection", siteX: X0 + Math.max(5, c.wire.pos) }, acc.side);
    }
  };

  const crossWire = (advance: number, torque: number) => {
    const c = st.cross;
    if (!c) return;
    touch();
    const r = stepWire(c.wire, c.route, { advance, torque, breath: false, hydrophilic: c.wireKind === "hydrophilic", hooked: hooked(c) }, 0.033);
    const { events, ...w } = r;
    c.wire = w;
    for (const e of events) {
      if (e.kind === "wrong-turn") log("event", "The wire went straight up the abdominal aorta.");
      if (e.kind === "segment" && e.id === "iliac" && w.pos > c.route3d.bifurcationS) log("event", "The wire is over the bifurcation.");
      if (e.kind === "buckle") crossBuckle(c);
    }
    // the devices ride on the wire: the position cannot lie beyond its tip
    st.deviceS = Math.min(st.deviceS, Math.max(0, c.wire.pos - MP_ENDO.balloonLenMm / 2));
  };

  const crossCatheter = (advance: number) => {
    const c = st.cross;
    if (!c) return;
    touch();
    const r = stepCatheter({ pos: c.catheterPos, resistance: 0, message: "" }, c.wire, c.route, advance, 2, 8);
    c.catheterPos = r.pos;
  };

  const overTheTop = () => !!st.cross && st.cross.wire.branch === "main" && st.cross.wire.pos > st.cross.route3d.bifurcationS + 30;

  const longSheath = (): EndoResult => {
    touch();
    const c = st.cross;
    if (!c) return refuse("Bring the crossover catheter in first.");
    if (c.longSheath || underway("long-sheath")) return refuse("Already done.");
    if (!overTheTop()) return refuse("Lead over the bifurcation with the wire first.");
    record(`Exchange over the wire for a ${ENDO_SOURCED.crossoverSheathFr} Fr long crossover sheath across the bifurcation.`);
    later({ what: "long-sheath", at: s.tS + MP_ENDO.longSheathS, label: "Long crossover sheath" });
    return done("Under way.");
  };

  const deviceTo = (x: number): number => {
    const c = st.cross;
    if (!c) return st.deviceS;
    const max = Math.max(0, c.wire.pos - MP_ENDO.balloonLenMm / 2);
    st.deviceS = Math.max(0, Math.min(max, x));
    return st.deviceS;
  };
  const moveDevice = (mm: number) => deviceTo(st.deviceS + mm);

  const inflate = (pressure: "low" | "high"): EndoResult => {
    touch();
    const c = st.cross;
    if (!c) return refuse("Bring the crossover catheter in first.");
    if (c.wire.branch !== "main" || st.deviceS < 1) return refuse("Bring the balloon out along the wire first.");
    if (st.balloon.inflated === pressure) return refuse("Already up.");
    st.balloon = { inflated: pressure, t: now() };
    record(`Occlusion balloon up at ${pressure} pressure.`);
    const b = st.bleed;
    if (b && occluding()) {
      markSuspected();
      b.occludedSinceT ??= now();
      b.firstOccludedT ??= now();
      cycleCuff(s, 1);
    }
    if (b && once("balloon-pressure"))
      decide("endo-balloon-pressure", "The occlusion balloon at low pressure", pressure === "low", "A balloon at low pressure across the bleeding point, or above it in the iliac artery", `${pressure === "low" ? "Low" : "High"} pressure`, bleedLesson(), T_BALLOON);
    return done("The balloon is up.");
  };

  const deflate = (): EndoResult => {
    if (!st.balloon.inflated) return refuse("The balloon is down.");
    st.balloon = { inflated: null, t: now() };
    if (st.bleed) st.bleed.occludedSinceT = null;
    record("Occlusion balloon down.");
    return done("Down.");
  };

  const truthNow = (): AngioReading => angioTruth({ injury: st.bleed?.injury ?? null, sealed: !!st.bleed?.sealed, leg: st.leg?.lesion.cause ?? null, legTreated: !!st.leg?.treated });

  const angiogram = (): EndoResult => {
    touch();
    const c = st.cross;
    if (!c) return refuse("Bring the crossover catheter in first.");
    s.patient.contrast(MP_ENDO.angioMl, "root");
    st.angios.push({ t: now(), fromS: c.catheterPos, truth: truthNow() });
    record(`${MP_ENDO.angioMl} mL contrast through the crossover catheter.`);
    if (st.bleed) markSuspected();
    if (st.leg && c.catheterPos > c.route3d.bifurcationS) st.legImagedT ??= now();
    return done("Injected.");
  };

  const read = (reading: AngioReading): EndoResult => {
    touch();
    const last = st.angios[st.angios.length - 1];
    if (!last) return refuse("Take an angiogram first.");
    st.reading = { t: now(), reading };
    record(`Angiogram read as: ${ANGIO_READING_LABEL[reading].toLowerCase()}.`);
    if (once("angio-read"))
      decide("endo-angio-read", "Read the crossover angiogram", reading === last.truth, ANGIO_READING_LABEL[last.truth], ANGIO_READING_LABEL[reading], st.leg ? LESSON_LIMB : LESSON_BLEED, st.leg ? T_DISSECTION : T_DEVICE);
    return done("Noted.");
  };

  /** The branch whose mouth lies at the device position, if any. */
  const branchHere = (): EndoVessel | null => {
    const c = st.cross;
    const site = targetSite()?.site;
    if (!c || !site) return null;
    let best: { id: EndoVessel; d: number } | null = null;
    for (const id of ["iea", "lcia"] as const) {
      const o = branchOriginS(c.route3d, site, id);
      if (o === null) continue;
      const d = Math.abs(o - st.deviceS);
      if (d <= MP_ENDO.branchReachMm && (!best || d < best.d)) best = { id, d };
    }
    return best?.id ?? null;
  };

  const checkRetrograde = (): EndoResult => {
    touch();
    if (!st.angios.length) return refuse("Image the arteries first.");
    if (underway("retrograde")) return refuse("Already under way.");
    const br = branchHere();
    if (!br) return refuse("Bring the microcatheter to the mouth of a branch first.");
    record(`Selective injection through a microcatheter in the ${ENDO_VESSEL_LABEL[br]}.`);
    later({ what: "retrograde", at: s.tS + MP_ENDO.retrogradeS, label: "Selective injection", branch: br });
    return done("Under way.");
  };

  const deploy = (device: EndoDevice, target: EndoTarget = "main"): EndoResult => {
    touch();
    const c = st.cross;
    const b = st.bleed;
    if (device !== "surgery") {
      if (!c) return refuse("Bring the crossover catheter in first.");
      if (!st.angios.length) return refuse("Image the arteries first.");
      if (!overTheTop()) return refuse("Lead over the bifurcation with the wire first.");
    }
    if (underway("seal")) return refuse("A device is already going in.");
    const sheathFr = c?.longSheath ? ENDO_SOURCED.crossoverSheathFr : sheathFrOf(c ? s.siteById(c.siteId)?.sheath?.id : undefined);
    if (!b) {
      record(`${ENDO_DEVICE_LABEL[device]} (${target === "branch" ? "into the branch" : "in the artery"}).`);
      return done("Placed.");
    }
    const h = holeS() ?? -1e9;
    const fb = femBifS() ?? 1e9;
    const half = isStent(device) ? MP_ENDO.stentLenMm / 2 : 0;
    const geo = {
      coversHole: isStent(device) && st.deviceS - half + MP_ENDO.coverMarginMm <= h && st.deviceS + half - MP_ENDO.coverMarginMm >= h,
      coversBifurcation: isStent(device) && st.deviceS - half <= fb && st.deviceS + half >= fb,
      branchHere: branchHere(),
    };
    const occludedFirst = b.firstOccludedT !== null;
    const retrogradeChecked = !!geo.branchHere && st.retrograde.some((r) => r.branch === geo.branchHere);
    if (isStent(device) && c && c.wire.pos < st.deviceS + half) return refuse("Advance the wire beyond the stent's far end first.");
    const v = gradeDevice(b.injury, device, target, geo, { occludedFirst, retrogradeChecked, sheathFr });
    const where = device === "surgery" ? "" : target === "branch" ? " into the branch" : " in the artery";
    record(`${ENDO_DEVICE_LABEL[device]}${where}${v.effect === "refused" ? ": could not be placed" : ""}.`);
    markSuspected();
    // the checks a refusal shows were missed
    if (v.refusedBy === "sheath" && once("sheath-size"))
      decide("endo-sheath-size", "The sheath checked for the stent", false, `A covered stent needs a ${ENDO_SOURCED.coveredStentSheathFr} Fr sheath: upsize (the long crossover sheath) before it`, `Tried through a ${sheathFr} Fr sheath`, LESSON_LARGE, ["mcs-cx-covered-stent-site"]);
    if (v.refusedBy === "diameter" && once("diameter"))
      decide("endo-diameter", "The artery's size checked for the covered stent", false, `No covered stent is smaller than ${ENDO_SOURCED.coveredStentMinMm} mm: a small branch takes coils or a stent over its mouth`, "Tried in an artery too small for one", LESSON_LARGE, T_BRANCH);
    if (v.effect === "refused") {
      if (v.refusedBy === "reach" && once("device"))
        decide("endo-device", "The device for the vessel and the segment", false, v.expected, `${ENDO_DEVICE_LABEL[device]} (${v.reasons.join(" ")})`, LESSON_BLEED, T_DEVICE);
      // what the operator meets, not the grading (v.reasons stay in the ledger)
      const diam = target === "branch" ? (b.injury.branchMm ?? 2) : b.injury.vesselMm;
      st.note =
        v.refusedBy === "sheath"
          ? `The stent will not pass the ${sheathFr} Fr sheath.`
          : v.refusedBy === "reach"
            ? "The coil will not go that far out in the branch."
            : device !== "bare-stent" && diam < ENDO_SOURCED.coveredStentMinMm
              ? "No covered stent is that small."
              : "The stent will not go into the branch.";
      return { ok: false, text: v.reasons.join(" "), verdict: v };
    }
    if (isStent(device) && once("sheath-size")) decide("endo-sheath-size", "The sheath checked for the stent", true, `A covered stent needs a ${ENDO_SOURCED.coveredStentSheathFr} Fr sheath`, `Through a ${sheathFr} Fr sheath`, LESSON_LARGE, ["mcs-cx-covered-stent-site"]);
    if (isDefinitive(device) && device !== "surgery" && once("balloon-first"))
      decide("endo-balloon-first", "No definitive device before balloon occlusion", occludedFirst, "A low-pressure balloon stops the flow before any definitive treatment", occludedFirst ? `Balloon occlusion at ${fmtMin((b.firstOccludedT ?? now()) - b.onsetT)}, then the device` : `${ENDO_DEVICE_LABEL[device]} with the hole still bleeding`, bleedLesson(), T_BALLOON);
    if ((device === "coils" || device === "sealant") && target === "branch" && geo.branchHere === b.injury.vessel && device === "coils" && once("retrograde"))
      decide("endo-retrograde", "Retrograde filling excluded before coiling", retrogradeChecked, "A selective injection shows that nothing fills the hole backwards before the coils go in", retrogradeChecked ? "Checked first" : "Coiled without the check", LESSON_BLEED, T_BRANCH);
    if (once("device")) decide("endo-device", "The device for the vessel and the segment", v.correct, v.expected, `${ENDO_DEVICE_LABEL[device]}${v.reasons.length ? ` (${v.reasons.join(" ")})` : ""}`, isBranch(b.injury.vessel) ? LESSON_BLEED : LESSON_LARGE, T_DEVICE);
    if (v.profundaLost && !st.profundaLost) {
      st.profundaLost = true;
      log("result", "The stent's end lies below the femoral bifurcation.");
      if (once("bifurcation")) decide("endo-bifurcation", "The femoral bifurcation left uncovered", false, "Never a stent across the femoral bifurcation (surgery for a hole there)", "The stent covers the bifurcation: the profunda is lost", LESSON_LARGE, ["mcs-cx-covered-stent-site"]);
    }
    st.placed.push({ t: now(), device, target, s: st.deviceS, correct: v.correct, effect: v.effect });
    if (isStent(device)) st.stents.push({ s: st.deviceS, lenMm: MP_ENDO.stentLenMm, device });
    if ((device === "coils" || device === "sealant") && target === "branch" && geo.branchHere && device === "coils") {
      const site = targetSite()?.site;
      const ox = site?.branches.find((t) => t.id === geo.branchHere)?.xFrom ?? b.injury.siteX;
      if (c) st.coils.push(targetLimbPoint(c.route3d, site, ox, { id: geo.branchHere, alongMm: Math.max(4, (b.injury.alongMm ?? 10) - 4) }).p);
    }
    if (device === "prolonged-balloon") {
      if (!st.balloon.inflated) inflate("low");
      return done("Holding the balloon up.", v);
    }
    if (v.effect === "seals") {
      const sec = device === "surgery" ? MP_ENDO.surgeryS : isStent(device) ? MP_ENDO.stentS : device === "coils" ? MP_ENDO.coilS : MP_ENDO.sealantS;
      later({ what: "seal", at: s.tS + sec, label: ENDO_DEVICE_LABEL[device], device });
      return done("Under way.", v);
    }
    return done("Placed.", v);
  };

  const examineLeg = (): LegFindings => {
    touch();
    const l = st.leg;
    const cause = l && !l.treated ? l.lesion.cause : null;
    const level = cause ? legOcclusionLevel(cause) : null;
    const f = legFindings({ cause, occludedAt: level ?? (balloonInLimb() ? "iliac" : null) });
    st.legExaminedT ??= now();
    record(`The ${targetSide()} leg examined.`);
    result("The leg", f.text);
    const b = st.bleed;
    if (b?.sealed && once("leg-after")) decide("endo-leg-after", "The leg checked after the fix", true, "Check the distal pulses and image the leg after the repair", `Examined at ${fmtMin(now() - b.sealed.t)} after the seal`, LESSON_LIMB, T_LEG);
    return f;
  };

  const callLeg = (call: LegCall): EndoResult => {
    touch();
    st.legCall = { t: now(), call };
    record(`Called: ${LEG_CALL_LABEL[call].toLowerCase()}.`);
    const g = gradeLegCall(st.leg && !st.leg.treated ? st.leg.lesion.cause : null, call);
    if (st.leg && once("leg-call")) decide("endo-leg-call", "Acute limb ischaemia told from cholesterol embolisation", g.correct, g.expected, LEG_CALL_LABEL[call], LESSON_LIMB, T_LEG);
    return done("Noted.");
  };

  const legAngiography = (): EndoResult => {
    touch();
    st.legAngioOrderedT ??= now();
    const g = gradeLegAngio(st.leg && !st.leg.treated ? st.leg.lesion.cause : null);
    if (st.leg && once("leg-angio")) decide("endo-leg-angio", "Emergency angiography of the leg", g.correct, g.expected, "Ordered angiography of the leg from the other groin", LESSON_LIMB, T_LEG);
    record("Angiography of the leg from the other groin asked for.");
    const c = st.cross;
    if (!c) return refuse(contralateral() ? "Bring the crossover catheter up over the bifurcation to image the leg." : "Get access in the other groin first: open the other femoral artery as another access site.");
    if (c.catheterPos <= c.route3d.bifurcationS) return refuse("Bring the crossover catheter over the bifurcation first.");
    return angiogram();
  };

  const treatLeg = (t: LegTreatment): EndoResult => {
    touch();
    const l = st.leg;
    if (!l) {
      record(`${LEG_TREATMENT_LABEL[t]}.`);
      return done("Noted.");
    }
    if (l.treated || st.inProgress.some((p) => p.what === "leg-treat")) return refuse("Already under way.");
    const c = st.cross;
    const ls = lesionS();
    const trueLumen = !!c && ls !== null && c.wire.branch === "main" && c.wire.pos >= ls + 20;
    const g = gradeLegTreatment(l.lesion.cause, t, { trueLumen, imaged: st.legImagedT !== null });
    record(`${LEG_TREATMENT_LABEL[t]}${g.effect === "refused" ? ": not yet" : ""}.`);
    // not yet possible (no image of the leg, no wire in the true lumen): nothing is graded
    if (g.effect === "refused") {
      st.note = st.legImagedT === null ? "Image the leg first." : "Not yet possible.";
      return { ok: false, text: g.reasons.join(" ") };
    }
    if (once("leg-treatment")) decide("endo-leg-treatment", "The leg treated by its cause", g.correct, expectedLegTreatment(l.lesion.cause), `${LEG_TREATMENT_LABEL[t]}${g.reasons.length ? ` (${g.reasons.join(" ")})` : ""}`, LESSON_LIMB, l.lesion.cause.includes("dissection") ? T_DISSECTION : T_LEG);
    if (g.effect === "restores") {
      if (t === "se-stent" && ls !== null) st.stents.push({ s: ls + 10, lenMm: MP_ENDO.stentLenMm, device: "bare-stent" });
      later({ what: "leg-treat", at: s.tS + (t === "surgery" ? MP_ENDO.surgeryS : MP_ENDO.legTreatS), label: LEG_TREATMENT_LABEL[t], leg: t });
      return done("Under way.");
    }
    return done("Noted.");
  };

  // -------------------------------------------------------------------------
  // what the view draws
  // -------------------------------------------------------------------------

  const extravasationVisible = () => !!st.bleed && !st.bleed.sealed && !occluding();

  const extravasationOnRoute = (siteId: string): number | null => {
    const b = st.bleed;
    const tgt = targetSite();
    if (!b || !tgt || tgt.id !== siteId || !extravasationVisible() || isBranch(b.injury.vessel)) return null;
    const X0 = MP_LIMB.sheathTipSiteX;
    return b.injury.siteX >= X0 ? b.injury.siteX - X0 : null;
  };

  const groinExtravasation = (siteId: string): { p: Vec3; t: Vec3 } | null => {
    const b = st.bleed;
    const tgt = targetSite();
    if (!b || !tgt || tgt.id !== siteId || !extravasationVisible() || b.injury.vessel !== "common-femoral") return null;
    const g = tgt.wireRoute.geom;
    const a = tgt.site.tubes.find((t) => t.id === tgt.site.arteryId);
    if (!a) return null;
    const y = a.yRef + a.dy * (b.injury.siteX - a.xRef);
    const z = a.zRef + a.dz * (b.injury.siteX - a.xRef);
    const p0 = siteToAorticSafe(g, tgt.site, b.injury.siteX, y, z);
    const p1 = siteToAorticSafe(g, tgt.site, b.injury.siteX + 1, y + a.dy, z + a.dz);
    const d = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
    const n = Math.hypot(d.x, d.y, d.z) || 1;
    return { p: p0, t: { x: d.x / n, y: d.y / n, z: d.z / n } };
  };

  /** A hole in a small branch (inferior epigastric, lateral circumflex iliac) of a site's groin, for its own sheath puff or femoral angiogram, or null. */
  const branchExtravasation = (siteId: string): { p: Vec3; t: Vec3; branchId: string; x: number } | null => {
    const b = st.bleed;
    const tgt = targetSite();
    if (!b || !tgt || tgt.id !== siteId || !extravasationVisible() || !isBranch(b.injury.vessel)) return null;
    const br = tgt.site.branches.find((t) => t.id === b.injury.vessel);
    if (!br) return null;
    const x = Math.min(br.xTo, br.xFrom + (b.injury.alongMm ?? 15));
    const c0 = tubeAt(br, x);
    const c1 = tubeAt(br, x + 1);
    const g = tgt.wireRoute.geom;
    const p0 = siteToAorticSafe(g, tgt.site, x, c0.y, c0.z);
    const p1 = siteToAorticSafe(g, tgt.site, x + 1, c1.y, c1.z);
    const d = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
    const n = Math.hypot(d.x, d.y, d.z) || 1;
    return { p: p0, t: { x: d.x / n, y: d.y / n, z: d.z / n }, branchId: br.id, x };
  };

  /**
   * The crossover's inflated balloon in the target groin's iliac or femoral artery, on that groin's own route: the
   * route's s from its sheath tip to the balloon's near end (the crossover s runs down the target side, its sheath
   * tip at route3d.targetTipS), so the target sheath's puff stops there. Null without an inflated balloon beyond the
   * bifurcation on the wire, for another site, or with the balloon wholly below the sheath tip.
   */
  const occlusionOnRoute = (siteId: string): number | null => {
    const c = st.cross;
    const tgt = targetSite();
    if (!c || !tgt || tgt.id !== siteId || !st.balloon.inflated || c.wire.branch !== "main") return null;
    const r = balloonRange();
    if (r.hi < c.route3d.bifurcationS + 2 || r.lo > c.route3d.targetTipS) return null;
    return Math.max(0, c.route3d.targetTipS - r.hi);
  };

  /**
   * The crossover image's state, rebuilt only when something it shows changes (the view asks every frame): the
   * crossover, its wire (replaced on each step), catheter and device positions, the balloon, the devices placed, the
   * angiograms, the bleed and the leg.
   */
  let drawKey: unknown[] = [];
  let drawMemo: EndoDraw | null = null;
  const drawState = (): EndoDraw | null => {
    const c = st.cross;
    if (!c) return (drawMemo = null);
    const b = st.bleed;
    const k = [c, c.wire, c.wireKind, c.catheterPos, st.deviceS, st.balloon, st.stents.length, st.coils.length, st.angios.length, b, b?.sealed, st.leg, st.leg?.treated, st.profundaLost, targetSite()?.site];
    if (drawMemo && k.length === drawKey.length && k.every((x, i) => x === drawKey[i])) return drawMemo;
    drawKey = k;
    return (drawMemo = buildDraw());
  };
  const buildDraw = (): EndoDraw | null => {
    const c = st.cross;
    if (!c) return null;
    const last = st.angios[st.angios.length - 1] ?? null;
    let angio: EndoDraw["angio"] = null;
    if (last) {
      const b = st.bleed;
      const l = st.leg && !st.leg.treated ? st.leg : null;
      const ls = lesionS();
      const stops: number[] = [];
      if (st.balloon.inflated && balloonRange().hi >= c.route3d.bifurcationS) stops.push(Math.max(last.fromS, balloonRange().lo));
      if (l && (l.lesion.cause === "plug" || l.lesion.cause === "embolus") && ls !== null) stops.push(ls);
      const stopS = stops.length ? Math.min(...stops) : null;
      const flapS = l && (l.lesion.cause === "iliac-dissection" || l.lesion.cause === "cfa-dissection") && ls !== null ? ls : null;
      let extravasation: { p: Vec3; t: Vec3 } | null = null;
      const h = holeS();
      if (b && h !== null && extravasationVisible() && (stopS === null || h <= stopS)) {
        const site = targetSite()?.site;
        extravasation = isBranch(b.injury.vessel)
          ? targetLimbPoint(c.route3d, site, b.injury.siteX, { id: b.injury.vessel, alongMm: b.injury.alongMm ?? 15 })
          : targetLimbPoint(c.route3d, site, b.injury.siteX);
      }
      angio = { t: last.t, fromS: last.fromS, stopS, flapS, extravasation, profundaLost: st.profundaLost };
    }
    const j = c.route.junction;
    return {
      route3d: c.route3d,
      wire: c.wire,
      wireKind: c.wireKind,
      aimHeading: j ? j.targetHeading : 0,
      catheterPos: c.catheterPos,
      balloon: { s: st.deviceS, lenMm: MP_ENDO.balloonLenMm, inflated: !!st.balloon.inflated },
      stents: st.stents.map((x) => ({ s: x.s, lenMm: x.lenMm })),
      coils: [...st.coils],
      angio,
      targetSiteId: c.targetSiteId,
    };
  };

  // -------------------------------------------------------------------------
  // clock
  // -------------------------------------------------------------------------

  const slowTick = (h: number) => {
    if (st.pendingOnsetT !== null && st.config && s.tS >= st.pendingOnsetT && !s.teamSetup) {
      const c = st.config;
      st.pendingOnsetT = null;
      if (c.kind === "bleed") startBleed(c);
      else startLeg(c.lesion, c.side ?? targetSide(), "scenario", c.report);
    }
    liveHazards();
    if (st.pendingLeg && s.tS >= st.pendingLeg.at) {
      const p = st.pendingLeg;
      st.pendingLeg = null;
      startLeg(p.lesion, p.side, "technique", p.report);
    }
    const b = st.bleed;
    if (b) {
      bleedStep(h);
      if (occluding()) {
        b.occludedSinceT ??= now();
        b.firstOccludedT ??= now();
        if (b.injury.sealsWithBalloon && !b.sealed && now() - b.occludedSinceT >= MP_ENDO.prolongedS) sealBy("prolonged-balloon");
      } else b.occludedSinceT = null;
      if (b.sealed && !st.decided.includes("leg-after") && now() - b.sealed.t >= MP_ENDO.legAfterS && once("leg-after"))
        decide("endo-leg-after", "The leg checked after the fix", false, "Check the distal pulses and image the leg after the repair", `Not examined within ${fmtMin(MP_ENDO.legAfterS)} of the seal`, LESSON_LIMB, T_LEG);
    }
    finishDue();
  };

  const events = (): readonly LabEvent[] => {
    const out: LabEvent[] = [];
    if (st.suspectedT !== null) out.push("bleeding");
    if (st.reading?.reading === "flap") out.push("dissection");
    if ((st.legCall && st.legCall.call !== "normal") || st.legAngioOrderedT !== null) out.push("limb-ischaemia");
    return out;
  };

  const tipContexts = (): readonly LabContext[] => (largeBore() && st.suspectedT !== null ? [{ lab: "mcs", phase: "complication", events: ["bleeding"], procedures: ["large-bore"] }] : []);

  const mod: EndovascularModule = {
    id: ENDOVASCULAR_MODULE_ID,
    state: st,
    attach(session) {
      s = session;
      seedSeen();
      return () => {
        s.releaseLapse(ENDOVASCULAR_MODULE_ID);
      };
    },
    slowTick,
    events,
    tipContexts,
    actions: {
      configure,
      learnerControl,
      suspect,
      startCrossover,
      crossWire,
      crossCatheter,
      longSheath,
      deviceTo,
      moveDevice,
      inflate,
      deflate,
      angiogram,
      read,
      checkRetrograde,
      deploy,
      examineLeg,
      callLeg,
      legAngiography,
      treatLeg,
      visible: () => inHand() || !!st.cross || (!!contralateral() && !!targetSite()?.sheath),
      crossoverActive: () => !!st.cross && s.activeSiteId === st.cross.siteId,
      extravasationOnRoute,
      groinExtravasation,
      branchExtravasation,
      occlusionOnRoute,
      draw: drawState,
      holeS,
      lesionS,
    },
  };
  return mod;
}

/** A site-frame point of a groin in the aortic frame (route.ts siteToAortic). */
function siteToAorticSafe(g: CrossoverRoute3D["target"], site: Parameters<typeof targetLimbPoint>[1], x: number, y: number, z: number): Vec3 {
  return site ? siteToAortic(g, site, { x, y, z }) : g.path.pts[0];
}
