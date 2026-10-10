// ---------------------------------------------------------------------------
// The full case's autopilot (proc-foundation-scenarios-ledger).
//
// Plays a case forward with clean technique through public CaseSession
// methods only, so a scenario can open at any stage and tests share one way
// of getting there. The helpers were the test helpers of caseSession.test.ts:
//   aimedPose, prepare, advanceToFlash, gainAccess, navigate, exchange.
// fastForward(session, stage) chains them:
//   chart            nothing (the case as it arrives);
//   access           chart read and, in a case the autopilot plays from the
//                    chart, the pre-procedure record read and its planted
//                    problem acted on (proc-chart-planted-problems), consent,
//                    time-out, the manifold line flushed and the transducer
//                    zeroed, Oxford's pre-puncture checklist confirmed
//                    (oxygen first when the SpO2 is refused), local
//                    anaesthetic and its onset: ready to puncture;
//   sheath-in        at a femoral artery site the lower edge of the femoral
//                    head marked first and the micro-wire screened, and
//                    redirected when it runs into a branch or down the leg
//                    (access-femoral-puncture); then
//                    puncture, wire, at a femoral artery site the upsizing
//                    (nick over the needle, micropuncture dilator, inner
//                    dilator and wire out, 0.035 inch wire, dilator out,
//                    with the listed fix for any scripted resistance;
//                    access-femoral-upsizing-angiogram), sheath in,
//                    aspirated and then flushed with a second syringe, and
//                    the heparin order the lab offers for the route (the
//                    radial dose after the sheath, the weight-based dose on
//                    a femoral case) and, on a radial case, the lab's
//                    intra-arterial verapamil (SOURCED_DOSES.verapamilMg)
//                    so the catheter work after it causes no spasm;
//   post-diagnostic  catheter flushed, wired to the root, exchanged, line
//                    flushed, zeroed, levelled, trace checked, handed to the
//                    diagnostic lab and back (the autopilot does no
//                    angiogram, so that lab adds no contrast or dose);
//   closure          catheter out: the sheath stays in for closure;
//   recovery         haemostasis at every site with a sheath, the active
//                    one first (a patent radial band for the sourced band
//                    time, manual femoral compression for the sourced time
//                    once the ACT is under the sheath-pull threshold, or a
//                    femoral vein sheath out under pressure).
// crossover(session, side) is the access-multi-site step a scenario or test
// uses to convert to the femoral artery: catheter out, the new site opened,
// local anaesthetic, the artery imaged on ultrasound and the groin screened
// on fluoroscopy (each unless told not to) and the clean puncture of
// gainAccess.
// fastForwardSteps is the same run as a generator, one step per next(), so
// the lab can play it across tasks instead of freezing the page.
// The radial sequence (access-radial-sequence): at the wrist the local is
// the one-touch 1 mL, aspirated first (left to the learner when a scenario
// opening at 'access' says so: localByOperator); the arm is laid as the
// side needs it with the wrist extended; an artery tight enough to stop the
// wire before the puncture gets nitroglycerin under the skin and time; once the sheath is
// in, after the heparin and the verapamil, the sheath is secured; the wire
// is turned, not pushed, at a loop it must be aimed through, and a tight
// loop is crossed by balloon-assisted tracking.
// Every access package that changes the sequence updates this file.
//
// This file imports caseSession.ts for constants used inside functions
// only; caseSession.ts imports it back for newCaseSession, which is safe
// because nothing here runs at load time.
// ---------------------------------------------------------------------------

import { entryVsHead, tubeAt } from "../access/site";
import { segmentAt } from "../procedure";
import { FEMORAL, type SheathId } from "../access/closure";
import { FIXES_FOR, type UpsizeFix } from "../access/upsizing";
import type { CaseSession, CatheterId, SiteSide } from "./caseSession";
import { MP_RADIAL_SEQUENCE, SOURCED_DOSES } from "./caseSession";
import { MP_RADIAL_SPASM } from "../access/radialSpasm";
import { SCENARIO_STARTS, type ScenarioStart } from "./scenarios/index";
import { actionFits, PLANTED_PROBLEMS, PRE_PUNCTURE_CHECKLIST, problemsPresent, type ChecklistItemId } from "./planning";
import { planningOf, type PlanningModule } from "./modules/planning";
import type { AccessRoute } from "../../types";

/** Thrown when the autopilot cannot reach a stage (the case is left where it stopped). */
export class AutopilotError extends Error {
  constructor(stage: string, why: string) {
    super(`autopilot could not reach '${stage}': ${why}`);
    this.name = "AutopilotError";
  }
}

/** A needle pose aimed at the middle of the target artery in the recommended window. */
export function aimedPose(s: CaseSession, angleDeg?: number) {
  const site = s.site;
  const art = site.tubes.find((t) => t.id === site.arteryId)!;
  const x = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
  const c = tubeAt(art, x);
  const th = ((angleDeg ?? site.typicalAngleDeg) * Math.PI) / 180;
  const L = c.z / Math.sin(th);
  return { entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: angleDeg ?? site.typicalAngleDeg, yawDeg: 0 };
}

/**
 * Chart, the pre-procedure record and its planted problem, consent, time-out, the table and Oxford's
 * pre-puncture checklist, and local anaesthetic, each step's time run out, then the anaesthetic's
 * onset. The record, the table and the checklist are played only in a case the autopilot plays from
 * the chart (one opened later had them done by the team: modules/planning.ts). `record` false leaves
 * the record unread and its problem missed; `tablePrep` false leaves the manifold line unflushed and
 * the transducer unzeroed, and their two checklist items unconfirmed. Either lets a test leave the
 * step out and see what follows.
 */
export function prepare(s: CaseSession, o: { record?: boolean; tablePrep?: boolean; local?: boolean } = {}): void {
  for (const id of Object.keys(s.chart) as (keyof typeof s.chart)[]) {
    s.reviewChart(id);
    s.runPending();
  }
  const plan = planningOf(s);
  const own = !!plan && !plan.state.planningByTeam && !plan.state.postponed;
  if (own && (o.record ?? true)) playRecord(s, plan);
  s.confirmConsent();
  s.runPending();
  for (const i of s.timeOutItems()) s.confirmTimeOutItem(i.id);
  s.runPending();
  if (own) prePunctureChecklist(s, plan, o.tablePrep ?? true);
  if (o.local ?? true) giveLocalAndWait(s);
}

/** The local anaesthetic (at the wrist the one-touch 1 mL, aspirated first) and its onset. */
function giveLocalAndWait(s: CaseSession): void {
  s.runPending();
  s.order("local");
  s.runPending();
  s.wait(60);
  s.runPending();
}

/** The case leaves the local anaesthetic to the learner (a scenario opening at 'access': SiteOverrides.localByOperator). */
function localLeftToOperator(s: CaseSession): boolean {
  return !!s.scenario.site?.localByOperator && s.activeSite.origin === "planned" && s.activeSite.siteKind === "radial" && s.pm.st.passes === 0 && !s.sheath;
}

/**
 * At the wrist before the puncture: the arm laid as the side needs it (supinated, or the left arm across the body)
 * with the wrist extended, and an artery already tight given nitroglycerin under the skin and time to relax.
 */
function readyTheWrist(s: CaseSession): void {
  const st = s.activeSite;
  const arm = st.site.arm;
  if (st.siteKind !== "radial" || !arm) return;
  s.runPending();
  const want = st.side === "left" ? "across-body" : "supinated";
  if (!arm.cannotSupinate && arm.position !== want && st.pm.st.passes === 0) {
    s.setArm(want);
    s.runPending();
  }
  s.setWristExtended(true);
  if (s.radialTone() >= MP_RADIAL_SPASM.poorFlashAt) {
    s.giveNitrate("subcutaneous");
    s.runPending();
    for (let k = 0; k < 10 && s.radialTone() >= MP_RADIAL_SPASM.poorFlashAt; k++) {
      s.wait(60, "Waiting for the artery to relax");
      s.runPending();
    }
  }
}

/** The other radial artery: the clean answer to a fistula in the planned arm that keeps the route radial. */
const OTHER_RADIAL: Partial<Record<AccessRoute, AccessRoute>> = { "radial-right": "radial-left", "radial-left": "radial-right" };

/**
 * Read every item of the pre-procedure record and act on its planted problem with the first answer
 * that does not end the case (hold and delay does; for a DOAC past Oxford's hold, proceeding is the
 * accepted answer). A fistula in the planned arm moves the case to the other radial artery. The
 * autopilot keeps a caller's femoral route: before the first puncture the only other route the case
 * can be given is a radial one, so a recent plug in the planned groin is left for the case to show
 * (it is punctured and scored, and no closure device is used there), as is a DOAC inside both holds.
 */
function playRecord(s: CaseSession, m: PlanningModule): void {
  for (const item of m.state.record.items) {
    s.runPending();
    if (m.actions.readItem(item.id)) s.runPending();
  }
  const planted = m.state.record.planted;
  s.runPending();
  if (!planted) {
    m.actions.act("proceed");
    s.runPending();
    return;
  }
  const f = m.state.record.facts;
  // already acted on (by the caller), or no longer on this route: nothing more to do
  if (m.state.found || !problemsPresent(f, s.access).includes(planted)) return;
  const action = PLANTED_PROBLEMS[planted].correct.find((a) => a !== "hold-and-delay") ?? (actionFits(planted, "proceed", f).correct ? "proceed" : null);
  if (!action) return;
  if (action === "other-access") {
    const to = OTHER_RADIAL[s.access];
    if (!to) return;
    m.actions.act("other-access");
    s.runPending();
    if (!s.setAccess(to)) throw new AutopilotError("access", `the access could not be changed to ${to}`);
    s.runPending();
    return;
  }
  m.actions.act(action);
  s.runPending();
}

/** Autopilot settings (not clinical values): how long it waits on oxygen before rechecking the SpO2, s, and how often. */
const SPO2_RECHECK_S = 30;
const SPO2_RECHECKS = 10;

/** The table made ready (line flushed, transducer zeroed) and every item of Oxford's checklist confirmed. */
function prePunctureChecklist(s: CaseSession, m: PlanningModule, tablePrep: boolean): void {
  if (tablePrep) {
    s.runPending();
    s.flushLine();
    s.runPending();
    s.zero();
    s.runPending();
  }
  const backedByTable: readonly ChecklistItemId[] = ["manifold", "transducer"];
  for (const c of PRE_PUNCTURE_CHECKLIST) {
    if (!tablePrep && backedByTable.includes(c.id)) continue;
    s.runPending();
    if (m.actions.confirmCheck(c.id)) {
      s.runPending();
      continue;
    }
    // an item other than the SpO2 refused (the ECG in an arrest): stop rather than puncture
    if (c.id !== "spo2") throw new AutopilotError("access", `the checklist item '${c.id}' could not be confirmed${m.state.note ? ` (${m.state.note})` : ""}`);
    // no trace at all (no probe, or a patient not perfusing): oxygen does not help, so stop
    if (s.patient.vitals().spo2 === null) throw new AutopilotError("access", "no oximetry trace before the puncture");
    // the SpO2 refused: oxygen, then recheck as it rises
    if (m.actions.giveOxygen()) {
      for (let k = 0; k < SPO2_RECHECKS; k++) {
        s.wait(SPO2_RECHECK_S);
        s.runPending();
        if (m.actions.confirmCheck("spo2")) {
          s.runPending();
          break;
        }
      }
    }
  }
}

/**
 * Advance the needle in small steps until the flashback is arterial (or the needle is fully in, by default
 * its whole length). It stops early, without a flash, when the tip lies well inside a lumen with no blood
 * at the hub (a plugged needle: the ultrasound shows the tip inside), so the caller can flush the needle.
 */
export function advanceToFlash(s: CaseSession, maxMm = s.pm.maxLength): boolean {
  let mm = 0;
  while (mm < maxMm) {
    s.advanceNeedle(0.2);
    mm += 0.2;
    const f = s.flashback();
    if (f.kind === "arterial") return true;
    if (f.plugged && f.vessel && f.lumenFraction >= 0.8) return false;
  }
  return false;
}

/**
 * Mark the skin over the lower edge of the femoral head (Brilakis 4.2, step 3) at the active femoral artery
 * site, unless it is marked already: the marker laid with its tip on the head's inferior border.
 */
export function markFemoralHead(s: CaseSession): boolean {
  const st = s.activeSite;
  const edge = st.site.landmarks.headFrom;
  if (st.siteKind !== "femoral" || edge === undefined) return false;
  if (st.markX !== null) return true;
  s.runPending();
  // the marker laid on the head's lower edge, seen there on an AP frame of the groin, and the skin marked
  if (!s.placeFemoralMarker(edge)) return false;
  s.noteFluoroscopy("groin", "ap");
  if (!s.markFemoralHead()) return false;
  s.runPending();
  return true;
}

/**
 * Screen the groin with the micro-wire in (Brilakis 4.2, step 8) and, when it has turned into a branch or
 * down the leg, pull it back below the turn and advance it again. Returns whether it now runs up the artery.
 */
export function screenAndRedirectMicroWire(s: CaseSession, screen = true): boolean {
  if (screen) s.noteFluoroscopy("groin");
  for (let k = 0; k < 40 && s.pm.wireMisdirected(); k++) s.advanceAccessWire(-5);
  // a wire pulled right back into the needle is fed again from the bevel
  if (!s.pm.st.wire) s.advanceAccessWire(5);
  if (s.pm.st.wire?.state === "intraluminal" && s.pm.st.wire.beyondMm < 30) s.advanceAccessWire(30);
  return !s.pm.wireMisdirected();
}

/** Apply the first listed fix for the resistance blocking the upsizing now (the autopilot's clean answer). */
function fixBlocked(s: CaseSession): boolean {
  const b = s.upsizing.blocked;
  if (!b) return false;
  const tried: Record<UpsizeFix, () => boolean> = {
    nick: () => s.skinNick(),
    "enlarge-nick": () => s.skinNick(),
    spread: () => (s.upsizing.nick.done || s.skinNick()) && (s.runPending(), s.spreadTrack()),
    "stiff-dilator": () => s.useStiffDilator(),
    "pull-back-wire": () => s.fixKinkedWire("pull-back-wire"),
    "cut-kink": () => s.fixKinkedWire("cut-kink"),
    "exchange-stiff-wire": () => s.exchangeToStiffWire(),
    "change-site": () => false,
  };
  for (const f of FIXES_FOR[b.kind]) {
    s.runPending();
    if (tried[f]()) {
      s.runPending();
      if (!s.upsizing.blocked) return true;
    }
  }
  return false;
}

/** One upsizing step, retried once after the fix for a scripted resistance. */
function upsizeStep(s: CaseSession, step: () => boolean, what: string): void {
  s.runPending();
  if (step()) return s.runPending();
  if (!fixBlocked(s) || (s.runPending(), !step())) throw new AutopilotError("sheath-in", `${what} failed`);
  s.runPending();
}

/**
 * At a femoral artery site with the needle out over a screened micro-wire: dilator, exchange to a 0.035 inch wire and
 * dilator out (Brilakis 4.2, steps 10-11); the skin is nicked over the needle first by the caller.
 */
function upsizeToWire035(s: CaseSession): void {
  // from wherever the upsizing stands (a scenario may open part of the way through it)
  if (s.upsizing.stage === "micro-wire") upsizeStep(s, () => s.insertMicroDilator(), "the micropuncture dilator");
  if (s.upsizing.stage === "micro-dilator") upsizeStep(s, () => s.removeInnerDilator(), "removing the inner dilator");
  if (s.upsizing.stage === "outer-dilator") upsizeStep(s, () => s.insertWire035("standard"), "the 0.035 inch wire");
  if (s.upsizing.stage === "outer-dilator-035") upsizeStep(s, () => s.removeDilator(), "removing the dilator");
}

/** The sheath in (with the fix for a scripted resistance), aspirated and then flushed with a second syringe. */
function sheathInAndPrepare(s: CaseSession, sheath: SheathId): void {
  s.runPending();
  let ok = s.insertSheath(sheath);
  for (let k = 0; !ok && k < 3 && fixBlocked(s); k++) {
    s.runPending();
    ok = s.insertSheath(sheath);
  }
  if (!ok) throw new AutopilotError("sheath-in", "the sheath could not be inserted");
  s.runPending();
  s.aspirateSheath();
  s.runPending();
  s.flushSheathSide("fresh");
  s.runPending();
}

/**
 * Puncture, wire, needle out, sheath in, aspirated and flushed. At a femoral artery site the head is marked
 * first and the micro-wire screened before the needle comes out (`fluoroscopy` false leaves both out: a
 * puncture without fluoroscopy). Throws AutopilotError on a step that fails.
 */
export function gainAccess(s: CaseSession, sheath: SheathId = "6", o: { fluoroscopy?: boolean } = {}, again = 0): void {
  const fail = (why: string) => {
    throw new AutopilotError("sheath-in", why);
  };
  const femoral = s.activeSite.siteKind === "femoral";
  const fluoro = o.fluoroscopy ?? true;
  // a micro-wire already in (a scenario's start state): screened, and taken out when it entered at the wrong height
  const ax = s.pm.st.arteriotomy;
  if (femoral && s.pm.st.wire && !s.sheath && ax) {
    const h = entryVsHead(s.site, ax.x);
    if (fluoro) s.noteFluoroscopy("groin");
    if (h === "below" || h === "above") {
      s.abandonPass();
      s.runPending();
    }
  }
  const resume = s.pm.st.wire?.state === "intraluminal" && !s.sheath;
  if (femoral && fluoro) markFemoralHead(s);
  if (!resume) readyTheWrist(s);
  if (!resume) {
    if (!s.placeNeedle(aimedPose(s))) fail("the needle could not be placed");
    let flash = advanceToFlash(s);
    // no blood with the tip in the lumen: take the needle out, flush it and go again
    if (!flash && s.flashback().plugged) {
      s.runPending();
      if (!s.flushNeedle()) fail("the needle could not be flushed");
      s.runPending();
      flash = advanceToFlash(s);
    }
    if (!flash) fail("no arterial flashback");
    // a little further so the whole bevel is in the lumen
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
  }
  if (s.pm.st.wire?.state !== "intraluminal") fail(`the wire is ${s.pm.st.wire?.state ?? "not in"}`);
  if (femoral && !screenAndRedirectMicroWire(s, fluoro)) fail("the micro-wire could not be redirected up the artery");
  // at the groin the skin is nicked over the needle before it comes out (Brilakis 4.2, step 9)
  const needleIn = !!s.pm.st.needle && s.pm.st.needle.inserted > 0 && !s.pm.st.needleRemoved;
  if (femoral && needleIn && !s.upsizing.nick.done) {
    s.runPending();
    s.skinNick();
    s.runPending();
  }
  if (!s.pm.st.needleRemoved && !s.removeNeedle()) fail("the needle could not be removed");
  if (femoral) upsizeToWire035(s);
  sheathInAndPrepare(s, sheath);
  // at the groin the side arm is transduced before anything goes through it: a sheath without an arterial
  // waveform comes out and the artery is punctured again (Brilakis 5.2)
  if (femoral) {
    const t = s.transduceSheath();
    s.runPending();
    if (t?.trace === "damped") {
      if (again > 0) fail("the sheath had no arterial waveform twice");
      s.removeSheathAndCompress();
      s.runPending();
      gainAccess(s, sheath, o, again + 1);
    }
  }
}

/**
 * Convert to the common femoral artery of `side` (access-multi-site): the catheter out of the site it is
 * in, the new site opened and made active, local anaesthetic and its onset, the artery imaged on
 * ultrasound unless `ultrasound` is false and the groin screened on fluoroscopy unless `fluoroscopy`
 * is false (the session's record of a screened station; the autopilot books no dose for it), then the
 * clean puncture and sheath of gainAccess. Throws AutopilotError when a step fails.
 */
export function crossover(s: CaseSession, side: SiteSide = "right", o: { ultrasound?: boolean; fluoroscopy?: boolean; sheath?: SheathId } = {}): void {
  s.runPending();
  if (s.catheter?.inBody) {
    s.removeCatheter();
    s.runPending();
  }
  if (!s.addSite("femoral", side)) throw new AutopilotError("sheath-in", `the ${side} femoral site could not be opened`);
  s.order("local");
  s.runPending();
  s.wait(60);
  s.runPending();
  if (o.ultrasound ?? true) {
    s.setProbeOn(true);
    s.noteProbeImage();
  }
  if (o.fluoroscopy ?? true) s.noteFluoroscopy("groin");
  gainAccess(s, o.sheath, { fluoroscopy: o.fluoroscopy });
}

/** Drive the wire to the root with fluoroscopy on, aiming at the junction in LAO and breathing at the subclavian. */
export function navigate(s: CaseSession): void {
  drain(navigateSteps(s));
}

/** navigate() in slices: yields every NAV_TICKS_PER_STEP frames so a caller can let the page paint. */
function* navigateSteps(s: CaseSession): Generator<string, void, void> {
  s.beamOn = true;
  s.tipImaged = true;
  s.laoDeg = 30;
  let guard = 0;
  while (!s.wire.reachedRoot && guard++ < 6000) {
    const seg = segmentAt(s.route, s.wire.pos);
    s.setBreath(seg.id === "subclavian");
    // a tight radial loop: the catheter up to the wire tip, then balloon-assisted tracking past it
    if (seg.maneuver === "bat") {
      for (let i = 0; i < 400 && s.catheter?.inBody && s.wire.pos - s.catheter.pos > MP_RADIAL_SEQUENCE.batTipMm - 5; i++) s.commandCatheter(2);
      s.runPending();
      if (!s.radialSeq.bat && !s.startBat((MP_RADIAL_SEQUENCE.batAtm[0] + MP_RADIAL_SEQUENCE.batAtm[1]) / 2)) throw new AutopilotError("post-diagnostic", "balloon-assisted tracking could not be set up");
      s.runPending();
      for (let i = 0; i < 600 && s.radialSeq.bat; i++) {
        s.advanceBat(1.2);
        s.tick(0.033);
      }
      s.stopBat();
      continue;
    }
    const torque = seg.targetHeading !== undefined ? Math.sign(seg.targetHeading - s.wire.heading) * 0.03 : 0;
    // a segment that opens only to an aimed tip: turn first, then advance (never push an unaimed wire)
    const aimFirst = seg.maneuver === "torque" && seg.targetHeading !== undefined && !s.wire.aimed;
    s.commandWire(aimFirst ? 0 : 1.2, torque);
    if (s.wire.branch === "wrong") s.commandWire(-60, -0.5);
    s.commandCatheter(1.2);
    s.tick(0.033);
    if (guard % NAV_TICKS_PER_STEP === 0) yield "navigate";
  }
  s.setBreath(false);
  for (let i = 0; i < 800 && !s.catheterInAorta; i++) s.commandCatheter(2);
}

/** Frames of wire driving per autopilot step (an autopilot setting: how often a stepped run yields). */
const NAV_TICKS_PER_STEP = 300;

/** Run a generator to its end and return its value. */
function drain<T>(it: Generator<string, T, void>): T {
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

/** The exchange at the root; each step can be left out to test its consequence. */
export function exchange(s: CaseSession, o: { backBleed?: boolean; aspirate?: boolean; flushLine?: boolean; zero?: boolean; level?: boolean } = {}): void {
  s.pullWire(o.backBleed ?? true);
  s.runPending();
  if (o.aspirate ?? true) {
    s.aspirate();
    s.runPending();
  }
  s.flush();
  s.runPending();
  if (o.flushLine ?? true) {
    s.flushLine();
    s.runPending();
  }
  s.connectManifold();
  s.runPending();
  if (o.zero ?? true) {
    s.zero();
    s.runPending();
  }
  if (o.level ?? true) {
    s.level();
    s.runPending();
  }
  s.tick(3);
}

/** The catheter the autopilot uses for the route. */
export function autopilotCatheter(s: CaseSession): CatheterId {
  return s.access === "femoral" ? "JR4" : "TIG";
}

/** Which stage the case has reached (the furthest stage whose state holds). */
export function stageReached(s: CaseSession): ScenarioStart {
  if (s.closureDone()) return "recovery";
  if (s.sheath && s.labsDone.length > 0) return s.catheter?.inBody ? "post-diagnostic" : "closure";
  if (s.sheath) return "sheath-in";
  if (s.timeOutDone && (s.local.given || localLeftToOperator(s))) return "access";
  return "chart";
}

const order = (st: ScenarioStart) => SCENARIO_STARTS.indexOf(st);

/**
 * The femoral sheath comes out once the ACT is under the threshold (FEMORAL, sourced): measure, wait,
 * repeat. The 10 min between measurements and the 4 h cap are MODEL PARAMETERS (autopilot settings).
 * Throws AutopilotError when the ACT has not fallen by the cap (the autopilot never pulls on a high ACT).
 */
function* waitForFemoralAct(s: CaseSession): Generator<string, void, void> {
  for (let k = 0; k < 24; k++) {
    const act = s.measureAct();
    s.runPending();
    if (act !== null && act < FEMORAL.actForSheathPullStrictS) return;
    s.wait(600, "Waiting for the ACT to fall");
    s.runPending();
    yield "act-wait";
  }
  throw new AutopilotError("recovery", "the ACT did not fall below the sheath-pull threshold");
}

/** Radial band: on over the sheath, sheath out, deflate until the pleth returns without bleeding, band time as sourced. */
function closeRadial(s: CaseSession): void {
  // MODEL PARAMETER (autopilot setting): the band starts at the closure panel's default inflation and is adjusted from the pleth
  s.applyBand(15);
  s.runPending();
  s.pullRadialSheath();
  let ok = false;
  for (let k = 0; k < 24 && !ok; k++) {
    const r = s.plethCheck();
    s.runPending();
    if (!r) break;
    if (r.bleeding) s.setBandVolume((s.radial?.volumeMl ?? 10) + 1);
    else if (r.cls === "D") s.setBandVolume((s.radial?.volumeMl ?? 10) - 1);
    else ok = true;
  }
  if (!ok) throw new AutopilotError("recovery", "patent haemostasis was not found under the band");
  s.finishRadialClosure(SOURCED_DOSES.bandHours);
  s.runPending();
}

/**
 * Play the case forward to `stage` with clean technique, from wherever it is. A stage the case has
 * already passed is left alone (the autopilot never goes back). Returns the stage reached; throws
 * AutopilotError when a step fails.
 */
export function fastForward(s: CaseSession, stage: ScenarioStart): ScenarioStart {
  return drain(fastForwardSteps(s, stage));
}

/**
 * fastForward() as a resumable run: yields the name of each step done (prepare, access, heparin,
 * catheter, each slice of the wire drive, exchange, the diagnostic hand-over, catheter out, each
 * ACT wait, closure), so the lab can run one step per task and paint in between.
 */
export function* fastForwardSteps(s: CaseSession, stage: ScenarioStart): Generator<string, ScenarioStart, void> {
  const want = order(stage);
  if (want < 0) throw new AutopilotError(stage, "unknown stage");
  s.runPending();
  const at = () => order(stageReached(s));
  if (want >= order("access") && at() < order("access")) {
    // a case that leaves the local to the learner opens at 'access' without it (any later stage has it given)
    prepare(s, { local: !(stage === "access" && !!s.scenario.site?.localByOperator && s.activeSite.siteKind === "radial") });
    yield "prepare";
  }
  if (want >= order("sheath-in") && at() < order("sheath-in")) {
    if (!s.local.given) giveLocalAndWait(s);
    gainAccess(s);
    yield "access";
    if (s.heparinU === 0) s.order(s.access === "femoral" ? "heparin-weight" : "heparin-radial");
    s.runPending();
    // the lab's intra-arterial spasmolytic through a radial sheath (SOURCED_DOSES.verapamilMg), so
    // the autopilot's own catheter work never leaves the learner a spasm to answer for (each order
    // takes time, so the session must be idle before the next one is accepted)
    if (s.access !== "femoral" && s.vasodilatorEffect() <= 0) {
      if (!s.order("verapamil")) throw new AutopilotError("sheath-in", "the intra-arterial verapamil was not given");
      s.runPending();
    }
    // the radial sheath secured before the catheters (access-radial-sequence)
    if (s.access !== "femoral" && !s.radialSeq.secured) {
      s.secureSheath("dressing");
      s.runPending();
    }
    yield "heparin";
  }
  if (want >= order("post-diagnostic") && at() < order("post-diagnostic")) {
    // a sheath the autopilot did not put in (a scenario's start state) is cleared, and heparin given, before the catheter
    if (!s.catheter?.inBody && s.sheath && !(s.sheath.aspiratedForNext ?? s.sheath.aspirated)) {
      s.aspirateSheath();
      s.runPending();
      s.flushSheathSide("fresh");
      s.runPending();
    }
    if (!s.catheter?.inBody && s.heparinU === 0) {
      s.order(s.access === "femoral" ? "heparin-weight" : "heparin-radial");
      s.runPending();
    }
    if (!s.catheter?.inBody && s.access !== "femoral" && s.sheath) {
      if (!s.radialSeq.vasodilator) {
        s.order("verapamil");
        s.runPending();
      }
      if (!s.radialSeq.secured) {
        s.secureSheath("dressing");
        s.runPending();
      }
    }
    // a catheter already in (the learner loaded it) is carried on from where it is
    if (!s.catheter?.inBody) {
      const cath = autopilotCatheter(s);
      s.prepCatheter(cath);
      s.runPending();
      if (!s.loadCatheter(cath)) throw new AutopilotError("post-diagnostic", "the catheter could not be loaded");
      yield "catheter";
    }
    if (!s.ex.wireOut) yield* navigateSteps(s);
    if (!s.catheterInAorta) throw new AutopilotError("post-diagnostic", "the catheter did not reach the ascending aorta");
    exchange(s);
    s.checkTrace();
    yield "exchange";
    if (!s.handover("diagnostic")) throw new AutopilotError("post-diagnostic", "the case could not be handed over");
    s.returnFromLab("diagnostic", { contrastMl: 0, fluoroS: 0, durationS: 0 });
    s.runPending();
    yield "diagnostic";
  }
  if (want >= order("closure") && at() < order("closure")) {
    s.removeCatheter();
    s.runPending();
    yield "catheter-out";
  }
  if (want >= order("recovery") && at() < order("recovery")) {
    // every site with a sheath, the active one first (a one-site case closes its one site as before)
    const active = s.activeSite;
    const open = s.openSites().filter((x) => !!x.sheath).sort((a, b) => Number(b === active) - Number(a === active));
    for (const st of open) {
      if (!s.setActiveSite(st.id)) throw new AutopilotError("recovery", `could not move to the ${st.id} site`);
      if (st.siteKind === "femoral-vein") {
        s.removeSheathAndCompress();
        s.runPending();
      } else if (st.route === "femoral") {
        yield* waitForFemoralAct(s);
        s.femoralManual(FEMORAL.manualMinutes, 3);
        s.runPending();
      } else closeRadial(s);
    }
    if (!s.closureDone()) throw new AutopilotError("recovery", "haemostasis was not achieved");
    yield "closure";
  }
  return stageReached(s);
}
