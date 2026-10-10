// ---------------------------------------------------------------------------
// One case from arrival to handover on one clock (plan stream S16).
//
// The trainee drives the case in any order. What stops an action is the
// physical state (no wire through a needle that is not in a lumen, no sheath
// without a wire, no catheter without a sheath), never a phase list. What is
// skipped has a physical consequence:
//   - no time-out before the first skin puncture: a critical error;
//   - no local anaesthetic: pain on puncture, anxiety, more spasm;
//   - a catheter put in dry, a wire pulled without back-bleeding: air in the
//     lumen; flushing it without aspirating sends air into the aorta;
//   - a catheter left in without flushing while the blood is not
//     anticoagulated: clot in the lumen, which a flush sends downstream;
//   - a manifold line not flushed: air in the line, a damped trace and an
//     air-embolism hazard at the first injection;
//   - a transducer not zeroed or not levelled: offset pressures;
//   - no heparin on a radial case, no patent haemostasis, a long band time,
//     a sheath bigger than the artery: a higher chance of radial occlusion;
//   - a femoral sheath pulled with a long ACT, a short or misplaced
//     compression, a high or low puncture: haematoma, pseudoaneurysm or a
//     retroperitoneal bleed that presents later.
// Each step takes time. Long steps (compression, band time, recovery) run as
// a time-lapse: `tick()` advances wall time plus a slice of the pending lapse,
// so the screen stays live; tests call `runPending()`.
//
// The patient is any object with the PatientEngine's methods (PatientPort):
// the lab passes the real engine, so heparin, ACT, contrast, vagal reactions,
// pressures and blood loss all come from S9's engine on the same clock.
//
// Scenarios, modules and the ledger (proc-foundation-scenarios-ledger):
//   - a named scenario (scenarios/*.ts) sets patient, chart and site
//     overrides, scripted events keyed by session hooks, delayed events and a
//     start stage that the autopilot (autopilot.ts) fast-forwards to;
//   - session modules (modules/*.ts) are attached to every session and
//     reached with session.mod(id): new behaviour goes in a module file, and
//     this file is edited only for the core access and closure flow;
//   - every scored step writes a DecisionRecord through decide(); finish()
//     returns them and the lab's run (useLabRun) puts them in the logbook row.
//
// What the session gives its modules (repair-session-flow): placeNeedle and
// femoralDevice ask each module's gate() first and say its refusal as a stop
// line; say() and logEntry() are the attending's lines and the case log for
// modules; finish() ends a case a module postponed before any puncture
// (postponement(), the planning module's hold and delay) without a closed
// site, and the summary carries `postponed`; holdLapse(by, rate) and
// releaseLapse(by) set a femoral compression, band or recovery time-lapse
// aside while an emergency is under way (the session is free and the orders
// work; the lapse runs on in the background at rate times the wall clock, 0
// paused), allowed only when lapseHoldsOn (the live lab sets it; tests and the
// autopilot keep every lapse running through); teamSetup is true while a
// scenario's start state runs (runAsTeam), so a module counts what it does as
// the team's; moduleTipContexts() gathers the modules' own lab contexts for
// the tips panel (src/ui/access/caseTips.ts), and after an ad hoc PCI came
// back the PCI finish context with the PCI's own flags (pci-adhoc-handover:
// kept out of the case's events, where an access context would read a
// coronary perforation or dissection as an access one).
//
// Tip context (proc-tip-context): accessStep() says which access step the
// learner is at (puncture, wire, sheath) and at which site; activeEvents()
// gives the tip events active now, from the session's own EventLog (the
// access events below, raised from what the operator sees or feels, and the
// patient events of the shared adapter, sampled from the engine's vitals),
// the scenario's scripted events and each module's events(). The panel
// (src/ui/access/caseTips.ts) turns them into one context per lab and
// records the tips it showed through noteTipsShown().
//
// Several access sites (access-multi-site): a case holds `sites`, each with
// its own ultrasound anatomy, puncture model, wire route, local anaesthetic,
// sheath, closure and delayed events, and one of them is active. The fields
// the rest of the lab reads (access, site, pm, route, local, sheath, radial,
// femoral, delayed and the radial closure results) are getters and setters
// on the active site, so a one-site case behaves as before. addSite() opens
// another site once the planned one has been punctured (radial to femoral,
// the other groin, a femoral vein); setActiveSite() moves the work there;
// the wire and catheter are bound to the site they went in through, so the
// site changes only with them out. closureDone() holds once every site that
// had a sheath is closed, and the closure and recovery hooks fire then. Each
// site schedules its own delayed events on its own seed, and a scenario's
// delayed events are added once per case, so no bleed is counted twice. A
// femoral crossover in an anticoagulated patient is scored on whether, before
// the needle, the artery was imaged (noteProbeImage, from the ultrasound
// view, which counts only with the probe on the skin: setProbeOn) and the
// groin screened (noteFluoroscopy, from the fluoroscopy view): both, as the
// tip access-crossover-anticoagulated-care asks.
//
// The femoral puncture (access-femoral-puncture), Brilakis 4.2 steps 3-8: a
// metal marker moved on AP fluoroscopy and the skin marked over the lower
// edge of the femoral head (placeFemoralMarker, markFemoralHead; scored at
// the first skin pass of a femoral artery site); a plugged needle (scripted)
// gives no blood until it is taken out and flushed (flushNeedle); the
// 0.018 inch micro-wire takes its course (ultrasound.ts), seen only when the
// groin is screened with the wire in (noteFluoroscopy): a wire in a branch or
// down the leg raises wire-misdirected, an entry below or above the femoral
// head raises wrong-height. A dilator or sheath over a misplaced wire is a
// critical stop. The sheath scores the entry (over the head, above the
// bifurcation, within two skin passes) and a deep artery the needle angle and
// skin entry (about 45 degrees, entry moved down the leg).
//
// Upsizing, sheath preparation and the femoral angiogram
// (access-femoral-upsizing-angiogram; Brilakis 4.2, steps 9-15, as
// src/simulation/access/upsizing.ts gives them): each site holds an
// UpsizingState. The wire for the needle is chosen (setAccessWire: a
// hydrophilic wire through a needle is scored, and pulling it back through
// the needle shears its jacket); the skin is nicked over the needle or a
// dilator (refused with a sheath in); the micropuncture dilator goes over the
// 0.018 inch wire, the inner dilator and wire come out, a 0.035 inch wire goes
// to the aorta and the dilator comes off; the sheath (10, 25 or 45 cm) goes
// over it with the wire left in. A sheath straight over the 0.018 inch wire is
// still possible and is scored. Scripted resistances (scriptUpsizing) stop the
// dilator or the sheath until the matching fix; a second push without a fix is
// forcing, a ledger failure; a subintimal sheath goes in quietly and shows a
// damped side-arm trace (transduceSheath raises pressure-damped), and any
// injection through it is a critical error. The sheath is aspirated
// (aspirateSheath, 3-4 mL discarded) and then flushed with a second syringe
// (flushSheathSide); flushing first is scored wrong, and a catheter put
// through a sheath not aspirated since the last catheter came out picks up
// clot (its lumen holds clot, which aspirate() later finds). The femoral
// angiogram (femoralAngiogram) records the view, magnification, volume, the
// wire and the waveform and is scored on them; its structured report
// (submitFemoralAngioReport) is graded against the anatomy and kept on the
// site as femoralAngioReport for the closure.
//
// Femoral closure and hands-on compression (access-closure-femoral-manual;
// lessons pm-closure-plan and pm-closure-femoral-compression): a scenario sets
// the end-of-case context (setClosureContext: a staged PCI or support device
// due, ooze around the sheath, atheroma, heavy calcium, an old plug) and may
// move the team's puncture for its start state (relocateTeamPuncture). The
// learner answers the four questions of the closure algorithm
// (answerClosureQuestions) and chooses the closure (chooseClosure), both
// graded by src/simulation/access/closurePlan.ts against the anatomy at the
// entry (closureAnatomy) and the state now (closureEndState). Manual
// compression is hands-on (src/simulation/access/compression.ts): the
// preparation checklist (confirmPrep, with the saline and the vagal kit given
// through the emergencies module when it is attached), the blood pressure
// lowered if raised (lowerBloodPressure), protamine only once the coronary
// equipment is out (giveProtamine: dose graded and capped, a hypotensive
// reaction 5-10 minutes later more likely with a fast injection), then
// startCompression pulls the sheath under the fingers, setHands moves and
// presses them, the session clock steps the compression (oozing, a groin
// swelling, the plug forming, the distal flow under occlusive pressure),
// holdCompression lets time pass with the hands kept on, and
// releaseCompression closes the site once the plug holds (lifting before it
// does bleeds again). Its time-weighted position error, pressure adequacy and
// the systolic pressure at the pull feed femoralRisk, whose draws present
// later through scheduleDelayed. The groin, the foot pulses and a clear
// dressing follow (checkGroin, checkFootPulses, applyDressing). The rule for
// the ACT and the timer is Brilakis's or Oxford's (setCompressionRule). The
// vasovagal reaction and the tamponade look-alike at the pull are the
// emergencies module's (scripted by the closure scenarios), treated with the
// hands kept on. The ACT measured above the sheath-pull threshold at a
// femoral closure raises act-high; blood at the nick raises bleeding and a
// swelling the operator can see raises haematoma.
//
// The radial sequence (access-radial-sequence; lessons pm-access-radial-puncture,
// pm-access-radial-sheath, pm-antithrombotics-heparin, pm-engaging-spasm and
// cm-access-complications-radial-bleeding): each radial site holds a
// RadialAccessState. The arm is positioned (setArm, setWristExtended; a patient
// who cannot supinate is offered another route, not the wrist). The local
// anaesthetic is a volume (giveLocal; order('local', mL)), aspirated first or
// not, infiltrated at the probe: above about 1 mL it raises a bleb that
// flattens the artery for a minute or two (ultrasound.ts). The puncture is
// single-wall or through-and-through (throughAndThrough: one stroke through
// both walls, then the flash on slow withdrawal). The artery's tone is the
// shared spasm model (src/simulation/access/radialSpasm.ts), stepped from
// arrival: repeated passes, pain without a working local and anxiety without
// sedation narrow the artery and slow the flash; nitroglycerin under the
// tongue, under the skin or around the artery (giveNitrate), sedation, a
// vasodilator through the sheath and time relax it, and a pass made while the
// artery is felt to be in spasm is scored as stabbing. Once the wire is in
// the arm the wire model's own spasm (procedure.ts) carries on as before; the
// shared tone keeps running (the sheath, the exchanges and the cocktail count
// in it) for the forearm images and the debrief, and its floor input in
// procedure.ts is left for diag-spasm-states to couple. At the needle tip the
// wire meets a side-wall bevel (rotateBevel) or an unextended wrist. Up the
// forearm, resistance is imaged, not pushed (forearmAngiogram, through a
// catheter just below the wire tip; a sheath puff shows the same): the image
// shows a loop, spasm or extravasation. A tight loop (a scenario setting) is
// crossed by balloon-assisted tracking (startBat, advanceBat); a hydrophilic
// wire forced against it can perforate, and the catheter brought across the
// hole over the wire seals it in most runs, otherwise a long balloon at low
// pressure (sealPerforation). The vasodilator goes through the aspirated side
// arm (or the Oxford cocktail, order('radial-cocktail')), the sheath is
// secured before the catheters (secureSheath), and the heparin goes in after
// the sheath, or, only where the previous report called the arm extremely
// tortuous (site override extremeTortuosity), is held until the catheter
// reaches the aortic root: the 'radial-heparin' decision scores both. The
// procedure.ts wire model stays a 1-D abstraction: the loop, the balloon and
// the seal are rules, labelled as such there and in MP_RADIAL_SEQUENCE.
//
// Radial closure (access-closure-radial; lessons pm-closure-radial,
// pm-engaging-spasm, cm-access-complications-radial-bleeding and -other): the
// radial sheath comes out at the end of the case whatever the ACT (waiting with
// it in, wait(), is scored at the pull: 'radial-sheath-out-now'); a vasodilator
// goes through the side arm mixed with blood (sideArmVasodilator); the band is
// centred along the wrist (applyBand's centreX, setBandPosition) against the
// skin nick and the arterial hole, which lies proximal to the nick by the
// artery's depth over the tangent of the needle angle (radialPunctureGeometry,
// closure.ts radialHoleOffsetMm), so a band off the hole bleeds into the
// forearm (a swelling above the band raises haematoma) or at the wrist; a
// second band goes against the first (addSecondBand); an intravenous
// antiplatelet infusion raises the bleeding threshold. The finger pleth is live
// (plethNow) and goes with the ulnar artery compressed when the band occludes
// the radial. pullRadialSheath does not move a sheath gripped by spasm (the
// shared tone at MP_RADIAL_CLOSURE.gripAt; raises radial-spasm);
// forceRadialSheath through spasm avulses the artery (a critical error, and a
// graded forearm haematoma is scheduled); the rescue is the vasodilator, the
// sedation orders, warmth (warmForearm), a lubricious solution
// (lubricateSheath) and the upper-arm cuff for 5 minutes (upperArmCuff), which
// act through the shared spasm model. The band position, the traction and the
// band time (1-2 h) are scored. Follow-up vignettes (presentRadialLate,
// assessRadialLate) present a radial pseudoaneurysm or a sterile granuloma for
// the learner to name and plan.
//
// The recovery ward (proc-recovery-ward; src/simulation/session/ward.ts): once
// every site is closed the patient reaches the ward (`ward`, a Ward the session
// steps on its clock). The learner writes the observation schedule and the
// mobilisation plan (setWardPlan, scored against Oxford's routine for the route);
// the nurse takes each set at the times the schedule gives, and the learner
// reviews them (reviewWardSet). A recovery time-lapse (observe, observeToNextSet)
// stops when the ward finds something. The ward presents the new delayed kinds
// (chest pain after PCI, tamponade, stroke; the creatinine rise at the 48-72 hour
// review, wardFollowUp) and, once its plan is written, the access haematomas,
// which are then found only at a site check (or when large enough for the patient
// to complain), so a skipped check lets them grow; each found event is answered
// from a first-action menu (wardAct). A lab's report (returnFromLab's `report`,
// or teamLabReport in a scenario's start state) gives the stents a chest pain
// after PCI occludes and the wireless exchanges of the cholesterol vignette. At
// the table: the end-of-case neurological check (neuroCheckAtTable) and an
// embolic stroke after a flushed clot or air (the clot-flushed and air-embolism
// criticals), which raises neuro-deficit and stops the case (handover refused).
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyCase, AnatomyVariant, VesselId } from "../../types";
import type { TelemetryEvent } from "./types";
import type { DoseOrder } from "../patient/pharmacology";
import type { Vitals } from "../patient/engine";
import type { ClockState } from "../clock/cardiacClock";
import type { TipInput } from "../patient/transducer";
import type { PatientProfile } from "../patient/patient";
import { INDICATION_LABEL, generatePatient, caseWithPatient, type Indication } from "../patient/patient";
import { PatientEngine } from "../patient/engine";
import { generateCase } from "../caseGenerator";
import { SeededRng } from "../patient/rng";
import { buildAnatomy, type AnatomyModel } from "../anatomy";
import { buildRoute, initialWire, obstructSegment, stepWire, stepCatheter, segmentAt, tightenLoop, type Route, type WireState, type CatheterState, type WireEvent } from "../procedure";
import { buildRoute3D, type SegmentId } from "../access/route";
import { buildAccessSite, entryVsHead, inExtent, tubeAt, type AccessSite, type ArmPosition, type UsTube } from "../access/site";
import { MP_RADIAL_SPASM, freshRadialSpasm, spasmDrive, spasmOnExchange, spasmOnPass, stepRadialSpasm, type RadialSpasmFactors, type RadialSpasmState, type SpasmTerm } from "../access/radialSpasm";
import { MP_NEEDLE, PunctureModel, type MicroWireCourse, type NeedlePose, type PunctureEvent, type Flashback } from "../access/ultrasound";
import {
  MP_UPSIZING,
  SOURCED_UPSIZING,
  chooseAccessWire,
  exchangeToStiffWire as upExchangeToStiffWire,
  femoralAngioTruth,
  fixKinkedWire as upFixKinkedWire,
  freshUpsizing,
  gradeFemoralAngioReport,
  insertMicroDilator as upInsertMicroDilator,
  insertSheath as upInsertSheath,
  insertWire035 as upInsertWire035,
  ipsilateralOblique,
  needleOut,
  removeDilator as upRemoveDilator,
  removeInnerDilator as upRemoveInnerDilator,
  restartPass,
  sheathRemoved,
  skinNick as upSkinNick,
  spreadTrack as upSpreadTrack,
  useStiffDilator as upUseStiffDilator,
  wireThroughNeedle,
  type AccessWireKind,
  type FemoralAngioAnswer,
  type FemoralAngioGrade,
  type SheathLengthCm,
  type UpsizeResistance,
  type UpsizeResult,
  type UpsizingState,
  type Wire035Kind,
} from "../access/upsizing";
import {
  SHEATHS,
  FEMORAL,
  MP_BAND,
  MP_BAND_POSITION,
  MP_RADIAL_CLOSURE,
  RADIAL_LATE,
  RADIAL_LATE_DX_LABEL,
  RADIAL_LATE_PLAN_LABEL,
  RADIAL_SPASM_RESCUE,
  bandStatus,
  gradeRadialLate,
  plethNow,
  radialBandStatus,
  radialHoleOffsetMm,
  radialThresholds,
  plethWithUlnarCompression,
  sheathGripped,
  raoRisk,
  femoralRisk,
  scheduleDelayed,
  haematomaCm,
  easyGradeFromSize,
  type SheathId,
  type BandStatus,
  type BandThresholds,
  type BarbeauClass,
  type BandBleedSite,
  type BandOnArm,
  type RadialBandStatus,
  type RadialLateDx,
  type RadialLateKind,
  type RadialLatePlan,
  type DelayedEvent,
  type DelayedKind,
  type FemoralRisk,
  type RiskTerm,
} from "../access/closure";
import {
  CLOSURE_ALGORITHM,
  CLOSURE_CHOICE_LABEL,
  closureAlgorithm,
  gradeClosureAnswers,
  gradeClosureChoice,
  keptSheathSwap,
  type AnswerGrade,
  type ChoiceGrade,
  type ClosureAnatomy,
  type ClosureAnswers,
  type ClosureChoice,
  type ClosureEndState,
} from "../access/closurePlan";
import {
  COMPRESSION,
  MP_COMPRESSION,
  PREP_CHECKLIST,
  actAllowsPull,
  freshCompression,
  gradeProtamine,
  haemostatic,
  protamineReactionChance,
  requiredMinutes,
  requiredMinutesText,
  stepCompressionInPlace,
  summariseCompression,
  swellingCm,
  underTheFingers,
  type CompressionRule,
  type CompressionState,
  type CompressionSummary,
  type Hands,
  type PrepItem,
  type ProtamineGrade,
} from "../access/compression";
import { cycleCuff, LOCAL_ANAESTHETIC } from "./emergencies";
import { TIME_OUT_ITEMS } from "../../mentor/prebrief";
import { visibilityFor, type VisibilityPolicy } from "../../mentor/visibility";
import type { AssessmentMode, EntrustmentLevel } from "../../mentor/types";
import { DecisionLedger, type DecisionRecord } from "../../mentor/ledger";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import type { SiteOverrides } from "../access/site";
import { contrastState, type ActReading, type AnticoagRoute, type AntithromboticState, type ContrastState, type HeparinDose, type LabReport, type PciTarget, type WithHandover } from "./handover";
import { MP_WARD, Ward, type WardActionId, type WardHost, type WardMobilisation, type WardSchedule } from "./ward";
import type { RoutePlanModule } from "./modules/routePlan";
import { actTarget, type ActDevice, type ActRegimen, type ActTarget } from "../pci/lesionAssessment";
import { applyProfileOverrides, parseHookSpec, scenarioById, DEFAULT_SCENARIO_ID, type ProcedureScenario, type ScenarioStart, type ScriptedEvent, type SessionHook } from "./scenarios/index";
import { CASE_SESSION_MODULES, instantiateCaseModules, type CaseGateArgs, type CaseGatedAction, type CasePostponement, type CaseSessionModule, type CaseSessionModuleFactory } from "./modules/index";
import { fastForward, fastForwardSteps } from "./autopilot";
// the shared tip-event plumbing (found-lab-session-plumbing): framework-free modules, no React
import { EventLog } from "../../ui/lab/eventLog";
import { PATIENT_EVENTS, PATIENT_EVENT_THRESHOLDS, PatientEventAdapter, type PatientEvent } from "../../ui/lab/patientEvents";

// ---------------------------------------------------------------------------
// The patient interface (PatientEngine satisfies it)
// ---------------------------------------------------------------------------

export interface PatientPort {
  readonly profile: PatientProfile;
  readonly transducer: { zero(): void; setAir(ml: number): void; setHeight(cm: number): void };
  advance(dt: number): void;
  give(o: DoseOrder): void;
  stimulus(kind: "puncture" | "sheath" | "radial-spasm" | "cocktail" | "balloon" | "catheter", magnitude?: number): void;
  measureAct(): number;
  vitals(): Vitals;
  clockState(): ClockState;
  contrast(ml: number, side: "left" | "right" | "root" | "lv"): void;
  setTip(tip: TipInput): void;
  holdBreath(level: number | null): void;
  fluid(ml: number, overS?: number): void;
  setOcclusion(id: string, o: { vessel: string; param: number; fraction: number }): void;
  clearOcclusion(id: string): void;
  drainEvents(): TelemetryEvent[];
  /** cuff pressure now (optional) */
  startNibp?(): void;
  /** blood entering the pericardium (mL/s) and drained from it (optional; the recovery ward's tamponade, proc-recovery-ward) */
  setPericardialInflow?(mlPerS: number): void;
  drainPericardium?(ml: number): number;
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS: how long each step takes (s), and the hazard rules. */
export const MP_SESSION = {
  chartItemS: 15,
  consentS: 180,
  timeOutS: 60,
  localS: 20,
  /** local anaesthetic takes effect after (s) */
  localOnsetS: 45,
  drugS: 25,
  sheathS: 20,
  sheathFlushS: 15,
  catheterPrepS: 20,
  exchangeStepS: 10,
  zeroS: 10,
  levelS: 10,
  bandS: 60,
  deviceS: 120,
  plethCheckS: 20,
  actS: 60,
  puffS: 5,
  /** most time-lapse per tick (s) so the screen stays live */
  lapsePerTick: 20,
  /** a module's refusal (gate) said again within this time is not repeated (s; a UI setting, MODEL PARAMETER) */
  stopRepeatS: 5,
  /** without a flush, blood in a catheter lumen clots after this long (s) when the ACT is below `clotActS` */
  clotAfterS: 150,
  clotActS: 200,
  /** air embolism into the aortic root: transient occlusion of the right coronary (s) */
  airEmbolismS: 45,
  /** transducer height offset before levelling (cm), uniform in ± this */
  transducerOffsetCm: 12,
  /** shed blood moves into the engine's stressed volume at this share (the rest is buffered by the unstressed pool) */
  bleedStressedShare: 0.35,
  /** IA vasodilator: effect per dose unit and decay (s) */
  gtnEffectPer100Ug: 0.45,
  gtnTauS: 260,
  verapamilEffectPerMg: 0.25,
  verapamilTauS: 1800,
  /** haematoma growth from open holes (mL/min per hole), scaled by the ACT */
  holeBleedMlMin: 0.4,
  /** contrast per sheath-side-arm puff (mL) */
  puffMl: 4,
  /** blind advance: wire advanced in a limb segment with the beam off or the tip out of the field (mm) before the attending stops it */
  blindMm: 25,
  /** how far a puff through a radial sheath fills the arm (mm; the fluoroscopy view draws the same length) */
  radialPuffMm: 190,
};

/**
 * The femoral puncture's scoring and timings (access-femoral-puncture). The angles and the deep-artery
 * case are Brilakis 4.2, step 6 ('for an artery about 2 cm deep, enter at about 45 degrees; for one
 * about 4 cm deep, keep the 45 degree angle and move the skin entry further down the leg ... rather than
 * steepening to about 70 degrees'); 'first or second pass' is the success criterion of lab request
 * pm-access#1. The rest are MODEL PARAMETERS.
 */
export const MP_FEMORAL_PUNCTURE = {
  /** MODEL PARAMETER: the skin mark counts as on the lower edge of the femoral head within this distance (mm) */
  markToleranceMm: 6,
  /** MODEL PARAMETER: a CFA whose near wall lies at least this deep at the crease is scored as a deep artery (mm) */
  deepNearWallMm: 30,
  /** 'about 45 degrees' (Brilakis 4.2, step 6) as a band, deg (the band is a MODEL PARAMETER) */
  about45Deg: [38, 52] as [number, number],
  /** 'steepening to about 70 degrees', Brilakis's second option, as a band, deg (the band is a MODEL PARAMETER) */
  steepDeg: [60, 75] as [number, number],
  /** lab request pm-access#1: arterial entry 'on the first or second pass' */
  passes: 2,
  /** MODEL PARAMETERS: time to take the needle out and flush it, and to mark the skin (s) */
  flushNeedleS: 15,
  markS: 10,
};

/**
 * The radial sequence's numbers (access-radial-sequence). Sourced ones cite the module text; the rest are MODEL
 * PARAMETERS (docs/realism/facts/pkg-access-radial-sequence.md).
 */
export const MP_RADIAL_SEQUENCE = {
  /** the one-touch local at the wrist: Brilakis's 'about 1 mL' (pm-access-radial-puncture, step 4) */
  defaultLocalMl: 1,
  /** the volume scored as right: Brilakis about 1 mL, Oxford 1-2 mL (LOCAL_ANAESTHETIC.radialMl, emergencies.ts) */
  localMaxMl: LOCAL_ANAESTHETIC.radialMl[1],
  /** MODEL PARAMETER: a bleb still flattening the artery by at least this share where the needle meets it counts as punctured through */
  blebScoredSquash: 0.2,
  /** lab request pm-access#4: access 'with no more than two passes' */
  passes: 2,
  /** MODEL PARAMETERS: a local nitrate's effect on the radial tone at its peak, and its fall (s) */
  nitrateEffect: 0.6,
  nitrateTauS: 600,
  /** MODEL PARAMETER: the wire pushed this far (mm) against resistance in the forearm, without imaging it first, is forcing */
  pushTolMm: 25,
  /** MODEL PARAMETER: 'a catheter brought up to just below the wire tip' (pm-access-radial-sheath, step 6): within this (mm) */
  angioBelowTipMm: 40,
  /** MODEL PARAMETERS (drawing and reading): the forearm angiogram fills this far ahead of the catheter tip and back from it (mm) */
  angioAheadMm: 120,
  angioBackMm: 10,
  /** MODEL PARAMETER (drawing): the share of the contrast's iodine left in the forearm artery ahead of a catheter injection; a sheath puff mixes with more blood (0.5) */
  angioIodineShare: 0.8,
  /** 'half out of the tip at 3-6 atm' (tip access-cx-radial-loop-bat; Brilakis 29.2 and 5.3) */
  batAtm: [3, 6] as [number, number],
  /** MODEL PARAMETERS: balloon-assisted tracking needs the catheter within this of the wire tip (mm); the catheter tip runs this far behind the balloon tip (mm); it ends this far past the loop (mm) */
  batTipMm: 25,
  batLeadMm: 8,
  batPastMm: 10,
  /** MODEL PARAMETER: the catheter across a perforation over the wire 'seals most radial perforations' (tip access-cx-radial-perforation-cover): this share of runs */
  sealCatheterP: 0.85,
  /** MODEL PARAMETERS: the wire counts as across the hole this far beyond it (mm), and as lost this far below it (mm) */
  wireAcrossMm: 15,
  wireLostMm: 5,
  /** MODEL PARAMETERS: the catheter held across the hole (s); the long balloon inflated at low pressure 'for a prolonged time' (s) */
  sealCatheterS: 60,
  sealBalloonS: 300,
  /** Oxford's cocktail into the radial artery before catheterisation (pm-access-radial-sheath, steps 9-10): 'heparin 2500 IU, verapamil 2.5 mg and GTN 200-400 micrograms' */
  cocktail: { heparinU: 2500, verapamilMg: 2.5, gtnUg: 200 },
  /** MODEL PARAMETER: a through-and-through stroke carries the needle this far past the back wall (mm), so the bevel is clear of the lumen */
  strokeBeyondMm: 1.5,
  /** MODEL PARAMETERS: time to position the arm, secure the sheath, give a local nitrate, set up the balloon (s) */
  armS: 20,
  secureS: 30,
  nitrateS: 20,
  batSetupS: 60,
};

/** Nitroglycerin for spasm before the sheath (Brilakis 4.3): under the tongue, under the skin, or around the artery mixed 1:1 with 1% lidocaine. */
export type NitrateRoute = "sublingual" | "subcutaneous" | "periarterial";
export const NITRATE_ROUTES: readonly { id: NitrateRoute; label: string }[] = [
  { id: "sublingual", label: "Nitroglycerin under the tongue" },
  { id: "subcutaneous", label: "Nitroglycerin under the skin" },
  { id: "periarterial", label: "Nitroglycerin around the artery, mixed 1:1 with 1% lidocaine" },
];

/** How the sheath is secured (pm-access-radial-sheath, steps 9-10). */
export type SheathSecure = "haemostat" | "dressing" | "suture" | "clasp";
export const SHEATH_SECURES: readonly { id: SheathSecure; label: string }[] = [
  { id: "haemostat", label: "Side arm clipped to the drape" },
  { id: "dressing", label: "Transparent adhesive dressing" },
  { id: "suture", label: "Sutured to the skin" },
  { id: "clasp", label: "Clasp of a sheath extension" },
];

/** A forearm angiogram or sheath puff at a radial site, and what its image showed (kept for the debrief; never shown as text live). */
export interface ForearmAngioRecord {
  t: number;
  ml: number;
  /** through a catheter (its tip at fromS along the route) or through the sheath (fromS 0) */
  via: "catheter" | "sheath";
  fromS: number;
  /** the catheter was just below the wire tip */
  belowTip: boolean;
  shows: { loop: boolean; spasm: boolean; extravasation: boolean };
}

/** A perforation of a forearm artery by a forced wire (access-radial-sequence). */
export interface ArmPerforation {
  /** where along the route (mm from the sheath tip) */
  s: number;
  at: number;
  sealed: boolean;
  sealedAt: number | null;
  method: "catheter" | "balloon" | null;
  /** the wire was pulled back below the hole before it was sealed */
  wireLost: boolean;
  attempts: number;
  /** the perforation is the team's (a scenario's start state), not the learner's */
  team?: boolean;
}

/** The radial sequence at one radial site (access-radial-sequence). */
export interface RadialAccessState {
  /** the artery's tone (radialSpasm.ts) */
  spasm: RadialSpasmState;
  /** the local anaesthetic infiltrated at the wrist, each injection (byTeam: a scenario's start state) */
  localGiven: { t: number; ml: number; aspirated: boolean; byTeam?: boolean }[];
  /** local nitrates before the sheath */
  nitrates: { t: number; route: NitrateRoute }[];
  /** when the artery was first felt to be in spasm at the puncture (s), and the passes made while it was */
  spasmFeltAt: number | null;
  stabsInSpasm: number;
  /** the scenario settings of the arm */
  extremeTortuosity: boolean;
  tightLoop: boolean;
  /** how the sheath was secured, or null */
  secured: SheathSecure | null;
  /** the sheath slipped back on a catheter exchange (it was not secured) */
  slipped: boolean;
  /** catheters put through this artery, and the exchanges among them */
  catheterLoads: number;
  exchanges: number;
  /** the first vasodilator through the sheath: when, and whether the side arm had been aspirated */
  vasodilator: { t: number; aspirated: boolean } | null;
  /** the forearm images */
  angios: ForearmAngioRecord[];
  /** resistance first met in the forearm (s), and the length pushed against it without imaging it */
  armResistanceAt: number | null;
  pushedAgainstMm: number;
  /** balloon-assisted tracking under way (its pressure, atm), and the last pressure used */
  bat: { atm: number; at: number } | null;
  batAtm: number | null;
  /** how the loop was crossed, once it was */
  loopCrossed: "bat" | "wire" | null;
  perforation: ArmPerforation | null;
  /** a scenario's scripted outcome of the catheter-across seal */
  sealScript: "seal" | "fail" | null;
  /** the radial heparin decision waits for the root (extreme tortuosity, no heparin when the catheter went in) */
  heparinPending: boolean;
  /** access-closure-radial: time waited at the end of the case with the sheath in and the catheter out (s; optional for older states) */
  closureWaitS?: number;
  /**
   * access-closure-radial: what was done at the end of the case to let the sheath slide out: a vasodilator through
   * the side arm (and whether it was mixed with blood drawn back), warmth over the forearm, a lubricious solution
   * and the upper-arm cuff above systolic for 5 minutes (session times, s, or null)
   */
  closureRescue?: ClosureRescue;
}

/** The spasm rescue at a radial closure (access-closure-radial). */
export interface ClosureRescue {
  vasodilatorAt: number | null;
  mixedWithBlood: boolean;
  warmedAt: number | null;
  lubricatedAt: number | null;
  /** when the cuff was let down after its 5 minutes */
  cuffDownAt: number | null;
}

/** A fresh radial sequence state, with the scenario's arm settings. */
export function freshRadialAccess(o: SiteOverrides | undefined): RadialAccessState {
  return {
    spasm: freshRadialSpasm(),
    localGiven: [],
    nitrates: [],
    spasmFeltAt: null,
    stabsInSpasm: 0,
    extremeTortuosity: !!o?.extremeTortuosity,
    tightLoop: !!o?.tightLoop,
    secured: null,
    slipped: false,
    catheterLoads: 0,
    exchanges: 0,
    vasodilator: null,
    angios: [],
    armResistanceAt: null,
    pushedAgainstMm: 0,
    bat: null,
    batAtm: null,
    loopCrossed: null,
    perforation: null,
    sealScript: null,
    heparinPending: false,
  };
}

/**
 * Tip events the session raises from its own state (proc-tip-context), each from something the
 * operator sees, feels or is told, never from a hidden diagnosis:
 *   venous-flashback  dark, non-pulsatile blood at the needle hub or from a sheath side arm
 *   no-flashback      the blood at the hub stopping on this skin pass after it was seen, or the
 *                     wire pushed with no lumen at the bevel
 *   radial-spasm      the patient's arm pain on a wire move, or resistance felt on a wire or
 *                     catheter move in the arm with spasm at MP_TIPS.spasmLevel; at the puncture,
 *                     a needle move with the artery's tone at that level (the artery narrows on
 *                     the image and the flash slows); a forearm image that shows the narrowing
 *                     (access-radial-sequence)
 *   radial-loop       the wire buckling at a radial loop, or a forearm image with the loop in it
 *   perforation       an arm branch perforated by the wire (raised with bleeding) until it is sealed;
 *                     a forearm image that shows the extravasation
 *   bleeding          a perforated arm branch, oozing under the band, a visible bleed still running
 *   haematoma         a groin or forearm swelling or lump the nurse reports
 *   pressure-damped   an overdamped trace on the monitor while the catheter is connected
 *   air               air sent into the aortic root
 *   wire-resistance   resistance felt on the access wire at the needle, or the micro-wire stopping in
 *                     a small branch (access-femoral-puncture)
 *   wire-misdirected  the groin screened with the micro-wire in a branch or running down the leg
 *   wrong-height      the groin screened with the micro-wire entering below or above the femoral head
 *   no-flashback      also: no blood at the hub of a plugged needle whose tip lies in a lumen
 *   dilator-resistance the micropuncture dilator or the sheath will not advance (access-femoral-upsizing-angiogram)
 *   pressure-damped   also: a damped trace from a sheath side arm when it is transduced
 *   act-high          an ACT measured at a femoral closure that does not yet allow the sheath out by
 *                     hand under the learner's rule (access-closure-femoral-manual)
 *   bleeding          also: blood welling up at the skin nick under compression, or after lifting the
 *                     hands before the puncture held
 *   haematoma         also: a groin swelling under compression large enough to see
 * A retroperitoneal bleed raises nothing here: its cue is the hypotension, which the patient adapter
 * raises. src/ui/access/caseTips.ts declares these for the reachability report.
 */
export const CASE_SESSION_EVENTS = ["venous-flashback", "no-flashback", "radial-spasm", "radial-loop", "perforation", "bleeding", "haematoma", "pressure-damped", "air", "wire-resistance", "wire-misdirected", "wrong-height", "dilator-resistance", "act-high"] as const satisfies readonly LabEvent[];
export type CaseSessionEvent = (typeof CASE_SESSION_EVENTS)[number];

/**
 * Patient events the full case can raise through the shared adapter (src/ui/lab/patientEvents.ts).
 * The case never puts a catheter in the LV and shows no echo, so the LVEDP events and a pericardial
 * effusion never arise; the ACT is read only once the case has gone to PCI (no ACT goal applies to
 * a diagnostic case).
 */
export const CASE_PATIENT_EVENTS: readonly PatientEvent[] = PATIENT_EVENTS.filter((e) => e !== "pericardial-effusion" && e !== "high-lvedp" && e !== "pulmonary-oedema");

/** The access step the learner is at, the site and the route the tips are written for. */
export interface CaseAccessStep {
  /** puncture until the wire runs free; wire while it is at the needle; sheath from needle removal until the sheath is flushed; null after that */
  step: "puncture" | "wire" | "sheath" | null;
  site: "femoral" | "radial";
  route: "femoral" | "radial";
}

/** MODEL PARAMETERS of the tip events (not from a source). */
export const MP_TIPS = {
  /** the patient events are sampled from the vitals at most this often, s of session time */
  sampleS: 1,
  /** radial spasm level (wire.spasm, 0..1) raised as 'radial-spasm' when felt on a wire or catheter move in the arm: the level raoFactors counts as spasm */
  spasmLevel: 0.5,
};

/** How each arm position reads in the log and the debrief. */
export const ARM_LABEL: Record<ArmPosition, string> = {
  supinated: "Supinated on an arm board",
  "across-body": "Brought across the abdomen palm up",
  neutral: "Neutral, not supinated",
};

/** Intravenous vasopressors whose infusion counts in the radial tone (Brilakis 4.3: 'intravenous vasopressors'). */
const PRESSOR_DRUGS: ReadonlySet<string> = new Set(["noradrenaline", "adrenaline", "phenylephrine", "metaraminol", "vasopressin", "dopamine"]);

/** Intravenous antiplatelet infusions that count in the radial band's bleeding threshold (access-closure-radial; the drugs the module names: 'a glycoprotein IIb/IIIa inhibitor or cangrelor'). */
const ANTIPLATELET_INFUSIONS: ReadonlySet<string> = new Set(["cangrelor", "eptifibatide", "tirofiban"]);

/** MODEL PARAMETER (a session setting): the radial tone is stepped at most this often, s of session time. */
const MP_RADIAL_TONE_STEP_S = 0.5;

/** Delayed kinds that only the recovery ward presents (proc-recovery-ward): never as the nurse's report at their time. */
const WARD_ONLY_DELAYED: readonly DelayedEvent["kind"][] = ["chest-pain-post-pci", "tamponade", "stroke", "creatinine-rise"];
/** A pulse as the ward's chart words it. */
const wardPulseWord = (f: "normal" | "weak" | "absent") => (f === "normal" ? "normal" : f === "weak" ? "weak" : "not felt");

/** Delayed findings the nurse reports as a visible swelling or bleed (the others raise nothing visible). */
const VISIBLE_SWELLING: readonly DelayedEvent["kind"][] = ["groin-haematoma", "forearm-haematoma", "pseudoaneurysm"];

/** Sourced doses offered as one-touch orders (facts/C5.md). */
export const SOURCED_DOSES = {
  /** "at least 5,000 U or 50 U/kg" after sheath insertion (Eltelbany 2024); 50 U/kg up to 5000 U (Mason 2018) */
  radialHeparinU: 5000,
  radialHeparinUPerKg: 50,
  /** "2.5 mg verapamil and 200 μg nitroglycerin" (Abboud 2013, in Rashid 2016); GTN 100-200 µg and verapamil 5 mg (Eltelbany 2024) */
  verapamilMg: 2.5,
  verapamilHighMg: 5,
  gtnUg: 200,
  gtnLowUg: 100,
  /** PCI: 70-100 U/kg titrated to ACT 250-300 s (2011 ACCF/AHA/SCAI table, S9 facts) */
  pciHeparinUPerKg: [70, 100] as [number, number],
  pciActS: [250, 300] as [number, number],
  /** a hemostasis duration of 2 hours (Mason 2018 statement) */
  bandHours: 2,
};

/**
 * The PCI heparin dose at the hand-over to ad hoc PCI (proc-heparin-act-handover), from lesson
 * pm-antithrombotics-heparin (src/content/manual/pci-manual/03-antithrombotics.ts:64-65, Brilakis 3.4
 * and 20.3): 70-100 units/kg as a bolus with no GP IIb/IIIa inhibitor and no cangrelor, 50-70
 * units/kg with one. The ACT goals are ACT_TARGETS_S (src/simulation/pci/lesionAssessment.ts, the
 * lesson's goal table, 03-antithrombotics.ts:119-121); the redose through the arterial sheath when
 * the IV line is doubtful is the lesson's step 3 (03-antithrombotics.ts:88, 98, 151).
 */
export const SOURCED_PCI_HEPARIN = {
  uPerKg: SOURCED_DOSES.pciHeparinUPerKg,
  uPerKgWithIvAntiplatelet: [50, 70] as [number, number],
};

/**
 * The tip events the hand-over gate raises (scenarios/heparin.ts raises): the gate's tip context carries
 * these and no other case events, so its tips are about the dose, the ACT and the contrast left.
 */
export const PCI_GATE_EVENTS = ["low-act", "high-contrast-volume"] as const satisfies readonly LabEvent[];

/** MODEL PARAMETERS of the hand-over gate (docs/realism/facts/pkg-proc-heparin-act-handover.md). */
export const MP_PCI_GATE = {
  /** the case's ACT machine: the one whose heparin-alone goal (250-300 s) the case has always used (SOURCED_DOSES.pciActS) */
  actDevice: "hemotec" as ActDevice,
  /** a total heparin dose within this many units of the range counts as in it (doses are drawn up in round numbers) */
  doseToleranceU: 500,
  /** chance that the IV cannula has tissued when the PCI bolus goes into it, in a case whose scenario does not set the line */
  tissuedChance: 0.03,
  /** looking at and flushing the IV cannula takes this long, s */
  inspectS: 15,
  /** putting in a new IV cannula takes this long, s */
  resiteS: 120,
};

/** The peripheral IV cannula: running into the vein, or tissued (the drug goes into the tissues, not the circulation). */
export type IvLineState = "patent" | "tissued";

/**
 * The hand-over gate before ad hoc PCI (proc-heparin-act-handover): the PCI heparin dose the learner
 * gives, counting what was already given, and the ACT measured against the target before wiring.
 */
export interface PciGate {
  /** session time the gate opened (s) */
  openedAt: number;
  /** the heparin given at the gate: the first dose is the scored decision, later ones are redoses */
  doses: HeparinDose[];
  /** the ACTs measured since the gate opened */
  acts: ActReading[];
  /** session time the case went on to PCI through the gate (s), or null */
  passedAt: number | null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChartItemId = "indication" | "allergies" | "renal" | "anticoag" | "weight" | "history" | "consent-form";

export interface ChartEntry {
  id: ChartItemId;
  label: string;
  /** what the chart says */
  text: string;
  reviewed: boolean;
  at?: number;
}

export type OrderId =
  | "local"
  | "heparin-radial"
  | "heparin-weight"
  | "heparin-pci"
  | "verapamil"
  | "verapamil-high"
  | "gtn"
  | "gtn-low"
  | "midazolam"
  | "fentanyl"
  | "atropine"
  | "metaraminol"
  | "hydrocortisone"
  | "chlorphenamine"
  | "fluid"
  | "protamine"
  | "radial-cocktail";

export interface OrderRecord {
  id: OrderId;
  label: string;
  t: number;
  dose: number;
  unit: string;
  route: string;
}

export type LogKind = "action" | "event" | "attending" | "nurse" | "patient" | "result";

export interface LogLine {
  t: number;
  kind: LogKind;
  text: string;
}

export interface AttendingLine {
  id: string;
  t: number;
  text: string;
  severity: "safety" | "technique" | "efficiency";
  /** stop: the action is blocked */
  stop: boolean;
  critical: boolean;
}

export type CatheterId = "JR4" | "JL4" | "TIG" | "AL1" | "pigtail";

export interface CatheterOnTable {
  id: CatheterId;
  /** flushed with saline on the table before going in */
  prepped: boolean;
  inBody: boolean;
  /** tip position along the route (mm from the sheath tip) */
  pos: number;
  lumenAir: boolean;
  lumenClot: boolean;
  /** time of the last flush or aspiration (s) */
  lastFlushAt: number;
}

export interface ExchangeState {
  /** the wire is inside the catheter (wire-led) */
  wireInCatheter: boolean;
  wireOut: boolean;
  backBled: boolean;
  aspirated: boolean;
  flushed: boolean;
  lineFlushed: boolean;
  connected: boolean;
  zeroed: boolean;
  levelled: boolean;
  traceChecked: boolean;
}

export interface Complication {
  id: string;
  t: number;
  label: string;
  severity: "minor" | "major";
  critical: boolean;
  /** a complication the PCI lab returned (pci-adhoc-handover): listed with the case's, graded by the PCI lab, not by the case's pass rule */
  source?: "pci";
}

export interface RadialClosure {
  kind: "radial-band";
  volumeMl: number;
  appliedAt: number;
  sheathOut: boolean;
  sheathOutAt: number | null;
  ulnarCompression: boolean;
  /** pleth checks with the ulnar artery compressed */
  checks: { t: number; cls: BarbeauClass; bleeding: boolean }[];
  patentDocumented: boolean;
  oozeMl: number;
  bandOffAt: number | null;
  /**
   * access-closure-radial (all optional, so a closure recorded before it reads as a band centred over the hole):
   * the band's centre, the skin nick and the arterial hole along the forearm (site x, mm, + proximal), as taken
   * when the band went on; a second band against the first; what the hole has bled into the forearm and at the
   * wrist (mL); the attempts at the sheath, whether it was gripped and whether it was forced (and the artery
   * avulsed); the band's centre against the hole when the sheath came out (mm). The spasm rescue is the
   * site's (RadialAccessState.closureRescue), since it can come before the band.
   */
  centreX?: number;
  skinX?: number;
  holeX?: number;
  second?: { volumeMl: number; centreX: number; at: number } | null;
  forearmMl?: number;
  wristMl?: number;
  pullAttempts?: number;
  gripped?: boolean;
  forced?: boolean;
  avulsed?: boolean;
  offsetAtPullMm?: number | null;
  /** when the closure was finished (finishRadialClosure: band time planned, delayed events drawn), once per site */
  finishedAt?: number | null;
}

export interface FemoralClosure {
  kind: "femoral";
  method: "manual" | "device";
  startedAt: number;
  minutes: number;
  positionErrorMm: number;
  actAtPull: number;
  deviceFailed: boolean;
  angiogram: boolean;
  risk: FemoralRisk;
}

export type Workspace = "chart" | "access" | "fluoro" | "table" | "closure" | "recovery" | "handover";

export interface HandoverNote {
  site: AccessRoute | "";
  sheath: SheathId | "";
  closure: string;
  heparinU: number | null;
  lastActS: number | null;
  contrastMl: number | null;
  fluoroMin: number | null;
  complications: string[];
  bandOffHours: number | null;
  checks: string[];
  free: string;
  /**
   * Every site that had a sheath, as siteKey()s (access-multi-site). truth() fills it only when the
   * case used more than one site, and the note is graded on it only then.
   */
  sites?: string[];
}

export interface HandoverGrade {
  items: { field: string; expected: string; given: string; correct: boolean }[];
  correct: number;
  total: number;
}

/** What the diagnostic or PCI lab receives (see docs/realism/wave2/C5.md, "Handover integration"). */
export interface SessionHandover {
  lab: "diagnostic" | "pci";
  caseData: AnatomyCase;
  profile: PatientProfile;
  access: AccessRoute;
  sheath: SheathId;
  catheterId: CatheterId | null;
  catheterInAscendingAorta: boolean;
  tS: number;
  heparinU: number;
  lastAct: { t: number; act: number } | null;
  contrastMl: number;
  contrastBudgetMl: number | null;
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
  line: { zeroed: boolean; levelled: boolean; lineAir: boolean; lumenAir: boolean; lumenClot: boolean; pressureOffsetMmHg: number };
  hazards: { airEmbolism: number; catheterThrombus: number };
  /** PCI only: what still has to happen before the first device */
  pciReady?: { heparinTopUpU: number; actTargetS: [number, number] };
  notes: string[];
  /** the case's assessment mode (pci-adhoc-handover: the receiving lab runs in it; absent: the lab's own) */
  mode?: AssessmentMode;
}

/**
 * What the PCI lab returned to the case (pci-adhoc-handover): its LabReport, the target the report chose and
 * how the choice compares with the case truth, kept for the recovery and discharge steps.
 */
export interface PciOutcome {
  report: LabReport;
  /** the report's target the PCI treated (null: none was handed over) */
  target: PciTarget | null;
  /**
   * the choice against the case truth (from the PCI lab's case definition): the lesion treated, how the report's
   * target was matched, the culprit and its vessel, and the debrief's line on it
   */
  targetCheck: { lesionId: string; match?: string; culpritId: string | null; culpritVessel?: VesselId | null; isCulprit: boolean | null; text?: string } | null;
  /** session time the case came back (s) */
  returnedAt: number;
}

/** The follow-up the recovery and discharge steps read from a returned PCI (hb-after-the-procedure#5). */
export interface PciFollowUp {
  /** complications the PCI recorded (each with its tip events) */
  complications: LabReport["complications"];
  /** the finish-phase flags the case keeps (complication, dose, contrast and complex-lesion events) */
  events: LabEvent[];
  highRadiationDose: boolean;
  highContrastVolume: boolean;
}

export interface SessionTotals {
  contrastMl: number;
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
}

export interface SessionSummary {
  caseId: string;
  access: AccessRoute;
  durationS: number;
  /** no critical error and no major complication of the case's own (a returned PCI's are listed, not counted); never for a postponed case */
  passed: boolean;
  criticalErrors: number;
  complications: Complication[];
  totals: SessionTotals;
  heparinU: number;
  devices: string[];
  raoProbability: number | null;
  raoTerms: RiskTerm[];
  femoralTerms: RiskTerm[];
  handover: HandoverGrade | null;
  /** the scenario the case ran */
  scenarioId: string;
  /** every scored decision of the case, in the order made (the ledger) */
  decisions: DecisionRecord[];
  /** the lab tips the case panel showed, in the order first shown (for the debrief) */
  tipsShown: string[];
  /** the case was postponed before any puncture (the planning module's hold and delay): when, and why */
  postponed?: CasePostponement;
  /** an ad hoc PCI came back (pci-adhoc-handover): the choice of target against the case truth, and its debrief line */
  pci?: { targetCheck: NonNullable<PciOutcome["targetCheck"]> | null; text: string | null };
}

// ---------------------------------------------------------------------------
// Access sites (access-multi-site)
// ---------------------------------------------------------------------------

/** What a site is for: the radial artery, the common femoral artery, or the common femoral vein. */
export type SiteKindId = "radial" | "femoral" | "femoral-vein";
export const SITE_KINDS: readonly SiteKindId[] = ["radial", "femoral", "femoral-vein"];
export type SiteSide = "right" | "left";

/** The sheath in a site. */
export interface SiteSheath {
  id: SheathId;
  insertedAt: number;
  aspirated: boolean;
  flushed: boolean;
  /** the sheath is in a vein (wanted at a femoral vein site, a misplacement anywhere else) */
  venous: boolean;
  /** length (cm): 10, 25 or 45 (access-femoral-upsizing-angiogram; absent on sheaths from before it) */
  lengthCm?: SheathLengthCm;
  /** aspirated since it went in or since the last catheter came out: the next catheter or guide may go in */
  aspiratedForNext?: boolean;
  /** thrombus in the sheath: it was flushed, or a catheter went through it, without aspiration (found-handover-contract SheathState.clot) */
  clot?: boolean;
  /** the sheath lies subintimally (a scripted event): no arterial waveform, and nothing is to be injected through it */
  subintimal?: boolean;
  /** what the side arm showed when it was last transduced, or null */
  waveform?: "arterial" | "damped" | "venous" | null;
  /** what the transducer displayed when the side arm was last transduced (the reading shown under the strip) */
  waveformText?: string;
}

/** A femoral angiogram taken at a site (access-femoral-upsizing-angiogram). */
export interface FemoralAngioRecord {
  t: number;
  ml: number;
  /** C-arm angle, + LAO */
  laoDeg: number;
  magnified: boolean;
  /** a wire through the sheath in the aorta */
  wireIn: boolean;
  /** the side-arm waveform checked before it (and what it showed) */
  waveform: "arterial" | "damped" | "venous" | null;
}

/** The learner's structured report of the femoral angiogram, graded against the anatomy (kept for the closure). */
export interface FemoralAngioReport {
  t: number;
  /** the time of the angiogram this report read (FemoralAngioRecord.t) */
  angioT: number;
  given: FemoralAngioAnswer;
  truth: FemoralAngioAnswer;
  grade: FemoralAngioGrade;
}

/** How a site was closed, and the radial closure's results. */
export interface SiteClosureState {
  radial: RadialClosure | null;
  femoral: FemoralClosure | null;
  /** a femoral vein site: the sheath out and pressure held (s), or null */
  venousAt: number | null;
  /** a sheath angiogram was read at this groin */
  angiogram: boolean;
  raoRisk: { probability: number; terms: RiskTerm[] } | null;
  bandHours: number;
  radialOccluded: boolean | null;
  /** hands-on manual compression at a femoral artery site (access-closure-femoral-manual), or null */
  compression?: CompressionState | null;
  /** the sheath kept in, sutured, for a staged PCI or a support device: when, and the short length it was swapped to */
  kept?: { t: number; swappedToCm: number | null } | null;
  /** the closure algorithm's answers and the closure chosen at this site */
  plan?: { answers: AnswerGrade | null; choice: { choice: ClosureChoice; grade: ChoiceGrade; t: number } | null };
  /** after the compression: the groin looked at, the foot pulses felt, the clear dressing (s, or null) */
  aftercare?: { groinT: number | null; pulsesT: number | null; dressingT: number | null };
}

/** The end-of-case context a closure scenario sets (setClosureContext); a random case has none of it. */
export interface ClosureContext {
  stagedPciSoon: boolean;
  supportDeviceLikely: boolean;
  oozeAroundSheath: boolean;
  /** significant atheroma at the puncture (the angiogram's disease, apart from calcium) */
  atheroma: boolean;
  /** an old collagen plug's filling defect in this groin (days since the plug) */
  oldPlugDays: number | null;
}

/** One access site of the case: its own anatomy, puncture model, wire route, sheath, closure and delayed events. */
export interface AccessSiteState {
  id: string;
  /** the wire route's access (a femoral vein site keeps 'femoral') */
  route: AccessRoute;
  side: SiteSide;
  siteKind: SiteKindId;
  /** the case's first site, or one added with addSite */
  origin: "planned" | "added";
  site: AccessSite;
  /** the vessel the needle is aimed at in this site's ultrasound image (the artery, or the vein at a vein site) */
  target: UsTube | null;
  pm: PunctureModel;
  /** the wire route from this site's sheath tip to the aortic root */
  wireRoute: Route;
  local: { given: boolean; at: number };
  sheath: SiteSheath | null;
  closure: SiteClosureState;
  delayed: DelayedEvent[];
  /** the sheath size once it came out (for the handover truth) */
  sheathHistory: SheathId | "";
  /**
   * The ultrasound probe is on the skin at this site. It is at the planned site from the start, as the
   * lab has always had it; at an added site it is off until the operator places it (setProbeOn), so a
   * puncture there can be made by palpation alone.
   */
  probeOn: boolean;
  /** session time the site was added, its first skin pass, and when the target vessel was first imaged on ultrasound or the groin screened */
  addedAt: number;
  firstPassAt: number | null;
  usImagedAt: number | null;
  fluoroAt: number | null;
  /**
   * The femoral head marker (access-femoral-puncture): where the metal marker's tip lies on the skin and
   * where the skin was marked (site x, mm), and when the groin was screened with the micro-wire in, and
   * whether a misdirected wire or a wrong-height entry has been on screen. `markerSeenX` is the marker
   * position last shown on an AP frame of the groin, and `markSeen` whether the skin was marked at a marker
   * position that had been seen on AP fluoroscopy.
   */
  markerX: number | null;
  markX: number | null;
  markerSeenX: number | null;
  markSeen: boolean;
  wireScreenedAt: number | null;
  misdirectedSeen: boolean;
  wrongHeightSeen: boolean;
  /** the upsizing at this site (access-femoral-upsizing-angiogram) */
  up: UpsizingState;
  /** the last femoral angiogram taken here, and its report */
  femoralAngio: FemoralAngioRecord | null;
  femoralAngioReport: FemoralAngioReport | null;
  /** the radial sequence at this site (access-radial-sequence; unused at a groin) */
  radialSeq: RadialAccessState;
}

/** The handover key of a site: kind and side, e.g. 'femoral:left'. */
export const siteKey = (st: Pick<AccessSiteState, "siteKind" | "side">): string => `${st.siteKind}:${st.side}`;

/** Every site key a case can hold, in the order the handover lists them. */
export const SITE_KEYS: readonly string[] = SITE_KINDS.flatMap((k) => (["right", "left"] as const).map((side) => siteKey({ siteKind: k, side })));

/** A site key in words: 'left femoral artery'. */
export function siteKeyLabel(key: string): string {
  const [kind, side] = key.split(":");
  return `${side} ${kind === "radial" ? "radial artery" : kind === "femoral" ? "femoral artery" : "femoral vein"}`;
}

/** Where the band's centre is against the skin nick, in words (what the operator sees on the wrist). */
export function bandFromNick(mmAboveNick: number): string {
  const d = Math.round(mmAboveNick);
  return d === 0 ? "centred on the skin nick" : `centred ${Math.abs(d)} mm ${d > 0 ? "above" : "below"} the skin nick`;
}

/**
 * What the operator sees when the hole under a band bleeds (closure.ts BandBleedSite). Bleeding into the forearm
 * shows only once the swelling is large enough to see (forearmMl >= MP_BAND_POSITION.visibleSwellingMl); before
 * that the wrist looks dry and the text is empty.
 */
export function bleedText(site: BandBleedSite, forearmMl = Infinity): string {
  switch (site) {
    case "forearm":
      return forearmMl >= MP_BAND_POSITION.visibleSwellingMl ? "The wrist is dry but the forearm is filling just above the band." : "";
    case "wrist":
      return "Blood is oozing at the wrist below the band.";
    case "puncture":
      return "Blood is oozing at the puncture under the band.";
    default:
      return "";
  }
}

/** A site in words: 'right radial artery', 'left femoral vein'. */
export const siteLabel = (st: Pick<AccessSiteState, "siteKind" | "side">): string => siteKeyLabel(siteKey(st));

/** Delayed findings that belong to one kind of site (a scenario's are added at the closure of a site they fit). */
const GROIN_DELAYED: readonly DelayedKind[] = ["groin-haematoma", "pseudoaneurysm", "av-fistula", "retroperitoneal-bleed"];
const WRIST_DELAYED: readonly DelayedKind[] = ["forearm-haematoma", "radial-occlusion"];
const delayedFits = (k: DelayedKind, st: AccessSiteState) => (GROIN_DELAYED.includes(k) ? st.route === "femoral" : WRIST_DELAYED.includes(k) ? st.siteKind === "radial" : true);

/** A hand-over with the found-handover-contract extensions this session fills in. */
export type CaseHandover = WithHandover<SessionHandover>;

export interface CaseSessionOptions {
  seed: string;
  access: AccessRoute;
  caseData: AnatomyCase;
  patient: PatientPort;
  mode?: AssessmentMode;
  entrustment?: EntrustmentLevel;
  /** the scenario (chart and site overrides, scripted and delayed events); default: the default scenario */
  scenario?: ProcedureScenario;
  /** session modules to attach (default: every registered module file) */
  modules?: readonly CaseSessionModuleFactory[];
  /** the stage the case opens at (the autopilot plays it there; default the chart) */
  start?: ScenarioStart;
}

/** The ledger stage of a scored step (the workspace where the decision is made). */
export type DecisionStage = "chart" | "access" | "fluoro" | "table" | "closure" | "recovery" | "handover";

const round = (x: number, k = 1) => Math.round(x * k) / k;

// ---------------------------------------------------------------------------
// The session
// ---------------------------------------------------------------------------

export class CaseSession {
  readonly seed: string;
  readonly caseData: AnatomyCase;
  readonly profile: PatientProfile;
  readonly patient: PatientPort;
  readonly mode: AssessmentMode;
  readonly policy: VisibilityPolicy;
  readonly model: AnatomyModel;
  /** the case's access sites, in the order they were opened (access-multi-site); one is active */
  readonly sites: AccessSiteState[] = [];
  private activeIdx = 0;
  /** the site the catheter last went in through (the working site of the handover) */
  private catheterSiteId: string | null = null;
  /** the scenario's delayed events already added to a site */
  private scenarioDelayedUsed = new Set<unknown>();

  /** session clock (s since arrival) */
  tS = 0;
  /** time-lapse still to run (s) and what it is for */
  pending = 0;
  pendingLabel = "";
  private pendingDone: (() => void) | null = null;
  /** the running lapse is a long one a module may hold (a femoral compression, a band's or the recovery's time) */
  private pendingLong = false;
  /**
   * Modules may hold a long time-lapse when an emergency begins (holdLapse). The live lab turns this on;
   * a session built for a test or played by the autopilot keeps every lapse running through, as before.
   */
  lapseHoldsOn = false;
  /** the long time-lapse set aside by holdLapse: what is left of it, its label and what runs at its end */
  private held: { left: number; label: string; done: (() => void) | null } | null = null;
  /** who holds it, and the rate each lets it run at (times the wall clock; 0: paused) */
  private readonly lapseHolders = new Map<string, number>();
  /** a scenario's start state is running (openAtStart): what it does is the team's */
  private startStateRunning = false;

  chart: Record<ChartItemId, ChartEntry>;
  consent = { obtained: false, at: 0 };
  timeOut: { checked: Record<string, boolean>; completedAt: number | null; falseConfirmations: string[] } = { checked: {}, completedAt: null, falseConfirmations: [] };
  contrastBudgetMl: number | null = null;
  orders: OrderRecord[] = [];
  acts: { t: number; act: number }[] = [];
  private ia: { kind: "gtn" | "verapamil"; t: number; dose: number }[] = [];
  heparinU = 0;

  wire: WireState = initialWire();
  wireKind: "j" | "hydrophilic" = "j";
  wireInBody = false;
  catheter: CatheterOnTable | null = null;
  ex: ExchangeState = { wireInCatheter: false, wireOut: false, backBled: false, aspirated: false, flushed: false, lineFlushed: false, connected: false, zeroed: false, levelled: false, traceChecked: false };
  breath = false;
  /** the trainee's C-arm angle (+LAO) and whether the wire tip is imaged now (set by the fluoroscopy view) */
  laoDeg = 0;
  /** the fluoroscopy view is magnified (a smaller field; set by the fluoroscopy view) */
  magnified = false;
  tipImaged = false;
  beamOn = false;
  private blindMm = 0;
  spasmSeen = 0;
  transducerHeightCm: number;

  hazards = { airEmbolism: 0, catheterThrombus: 0 };
  complications: Complication[] = [];
  criticalErrors = 0;
  log: LogLine[] = [];
  attending: AttendingLine[] = [];
  telemetry: TelemetryEvent[] = [];

  totals: SessionTotals = { contrastMl: 0, fluoroS: 0, karMGy: 0, kapGyCm2: 0 };
  /** dose already booked by the labs this session handed over to */
  private labTotals: SessionTotals = { contrastMl: 0, fluoroS: 0, karMGy: 0, kapGyCm2: 0 };
  /** dose from this lab's own fluoroscopy (set by the view) */
  private ownDose = { fluoroS: 0, karMGy: 0, kapGyCm2: 0 };

  handedOver: "none" | "diagnostic" | "pci" = "none";
  labsDone: ("diagnostic" | "pci")[] = [];
  /** what the PCI lab returned (pci-adhoc-handover; null until a PCI came back with a report) */
  pciOutcome: PciOutcome | null = null;
  /** the target the study report chose, as the hand-over to PCI carries it (toPci) */
  private pciTargetChosen: PciTarget | null = null;
  /** PCI reports received so far (numbers each return's complications, so a second return keeps its own) */
  private pciReturns = 0;
  /** a report the lab left for returnFromLab (stageLabReport), with the PCI's target check */
  private stagedReport: { report: LabReport; target?: PciTarget | null; targetCheck?: PciOutcome["targetCheck"] } | null = null;
  /** delayed events found so far, at every site */
  presented: DelayedEvent[] = [];
  /** the recovery ward (proc-recovery-ward): the plan, the sets of observations, the ward's events, the table's stroke */
  readonly ward: Ward;
  /** delayed events the ward has taken (begun on the ward; presented once it finds them) */
  private wardTaken = new Set<DelayedEvent>();
  /** when the last catheter came out (the end-of-case neurological check counts from then) */
  private lastCatheterOutAt: number | null = null;
  private activeBleeds: { ev: DelayedEvent; left: number }[] = [];
  /** a follow-up vignette's start state: the case the patient comes back from drew no delayed events (setTeamCourseUneventful) */
  private teamUneventful = false;
  /**
   * The pressures the band thresholds are read from (mmHg): the mean and systolic, smoothed over
   * MP_BAND.thresholdSmoothingS of patient time, so a band near a threshold does not flicker with each beat.
   */
  private bandPressures: { map: number; sys: number } | null = null;
  note: HandoverNote | null = null;
  grade: HandoverGrade | null = null;
  finished = false;
  /** the scenario this case runs (overrides already applied to the profile by newCaseSession) */
  readonly scenario: ProcedureScenario;
  /** where the case opened: past 'access', the earlier steps were played by the autopilot, not the learner */
  readonly startStage: ScenarioStart;
  /** every heparin bolus given (found-handover-contract AnticoagState) */
  heparinDoses: HeparinDose[] = [];
  /** the hand-over gate before ad hoc PCI (openPciGate), or null */
  pciGate: PciGate | null = null;
  /** the IV cannula: set by a scenario (setIvLine), or drawn at the first PCI bolus into it; null until then (patent) */
  private ivLine: IvLineState | null = null;
  /** what the operator found when the IV cannula was last looked at, or null */
  ivLineInspected: { t: number; finding: IvLineState } | null = null;
  /** When the IV cannula was last looked at or replaced (the finding above is cleared by a new cannula; this is not). */
  private ivLineCheckedAt: number | null = null;
  /** the case's plan includes a GP IIb/IIIa inhibitor or cangrelor for the PCI (planIvAntiplatelet) */
  private ivAntiplateletPlan = false;
  /** session time of the learner's first request for help ('Ask the attending'), or null */
  helpAskedAt: number | null = null;
  /** when each session hook first fired (s) */
  hookAt: Partial<Record<SessionHook, number>> = {};
  private readonly ledger = new DecisionLedger();
  private readonly modules: CaseSessionModule[] = [];
  private readonly moduleDisposers: (() => void)[] = [];
  /** scripted events not yet fired (hook spec parsed once), and the events the fired ones raised */
  private scriptPending: { hook: SessionHook; afterS: number; ev: ScriptedEvent }[] = [];
  private scriptRaised: LabEvent[] = [];
  private rng: SeededRng;
  private airUntil = 0;
  private lid = 0;
  /**
   * The case's tip events (proc-tip-context) on the patient's clock (the clock the patient-event
   * adapter raises on; it runs with the session clock): transient access and patient events with the
   * shared hold, visible findings held for the rest of the case. Every onset is written to the
   * telemetry as 'lab.event' for the debrief.
   */
  readonly tipEvents: EventLog = new EventLog({ clock: () => this.patient.clockState().t, sink: (kind, data, t) => this.telemetry.push({ tWall: round(this.tS, 10), tPatient: t, kind, data }) });
  /**
   * The patient-event adapter. Its contrast ceiling counts the contrast the diagnostic and PCI labs
   * reported on return (labTotals) with the engine's own, as the case totals do (refreshTotals).
   */
  private readonly patientTipEvents = new PatientEventAdapter(this.tipEvents, {
    contrastHigh: (c) => (c.totalMl + this.labTotals.contrastMl) / Math.max(1, c.macdMl) >= PATIENT_EVENT_THRESHOLDS.contrastFraction,
  });
  private tipSampleAt = -Infinity;
  /** blood has been seen at the needle hub on this skin pass */
  private passHadFlash = false;
  /** a through-and-through stroke is under way: the hub is not read until it ends (access-radial-sequence) */
  private strokeInProgress = false;
  /** session time not yet stepped into the radial tone (it is stepped at most every MP_RADIAL_TONE_STEP_S) */
  private radialToneAcc = 0;
  /** intravenous vasopressor infusions running now (from the engine's events), for the radial tone */
  private pressorOn = new Set<string>();
  /** intravenous antiplatelet infusions running (cangrelor, a glycoprotein IIb/IIIa inhibitor; access-closure-radial: the band's bleeding threshold) */
  private antiplateletOn = new Set<string>();
  /** the lab tips the case panel has shown, with the session time each was first shown */
  tipsShown: { id: string; t: number }[] = [];

  // femoral closure and hands-on compression (access-closure-femoral-manual)
  /** the end-of-case context a closure scenario sets (setClosureContext) */
  closureContext: ClosureContext = { stagedPciSoon: false, supportDeviceLikely: false, oozeAroundSheath: false, atheroma: false, oldPlugDays: null };
  /** whose rule the ACT and the timer follow (setCompressionRule) */
  compressionRule: CompressionRule = "brilakis";
  /** the compression preparation, each item's time (null: not done) */
  prep: Record<PrepItem, number | null> = { monitoring: null, "vagal-kit": null, saline: null, gloves: null, bp: null };
  /** protamine doses given, and the hypotensive reaction one of them brought (truth: never shown live) */
  protamine: { t: number; mg: number; rate: "slow" | "fast"; grade: ProtamineGrade }[] = [];
  private protamineReaction: { from: number; to: number } | null = null;
  private bpLoweredUntil: number | null = null;
  /** the session's own loss of vascular tone (the antihypertensive, a protamine reaction), and that of every other writer (a cause run) */
  private vasoOwn = 0;
  private vasoOther = 0;
  /** the engine's own setter, once the session composes its share with the other writers' (see applyVasodilation) */
  private vasoRaw: ((x: number) => void) | null = null;
  private protamineRng: SeededRng | null = null;
  private skinReprepAt: number | null = null;

  constructor(o: CaseSessionOptions) {
    this.seed = o.seed;
    this.caseData = o.caseData;
    this.patient = o.patient;
    this.profile = o.patient.profile;
    this.mode = o.mode ?? "guided";
    this.policy = visibilityFor(this.mode, o.entrustment ?? 2);
    this.scenario = o.scenario ?? scenarioById(DEFAULT_SCENARIO_ID) ?? { id: DEFAULT_SCENARIO_ID, title: "Random patient", lessonIds: [] };
    this.startStage = o.start ?? "chart";
    // an event whose spec does not parse never fires (the registry refuses such files)
    for (const ev of this.scenario.script ?? []) {
      const spec = parseHookSpec(ev.at);
      if (spec) this.scriptPending.push({ hook: spec.hook, afterS: spec.afterS, ev });
    }
    this.model = buildAnatomy(o.caseData);
    this.sites.push(this.makeSite("site-1", o.access === "femoral" ? "femoral" : "radial", o.access === "radial-left" ? "left" : "right", "planned"));
    this.rng = new SeededRng(`session:${o.seed}`);
    this.ward = new Ward(this.wardHost());
    this.transducerHeightCm = round(this.rng.range(-MP_SESSION.transducerOffsetCm, MP_SESSION.transducerOffsetCm), 1);
    this.patient.transducer.setHeight(this.transducerHeightCm);
    this.patient.setTip({ location: "outside", valveOpen: true });
    this.chart = this.buildChart();
    this.say(`${this.profile.ageY}-year-old ${this.profile.sex === "M" ? "man" : "woman"} on the table for coronary angiography. Review the chart before we start.`, "efficiency");
    this.logLine("event", `Patient arrived. Planned access: ${accessLabel(this.access)}.`);
    for (const m of instantiateCaseModules(o.modules ?? CASE_SESSION_MODULES)) {
      this.modules.push(m);
      const dispose = m.attach(this);
      if (typeof dispose === "function") this.moduleDisposers.push(dispose);
    }
    this.fireHook("arrival");
  }

  private siteOverrides(): SiteOverrides | undefined {
    return this.scenario.site;
  }

  // -------------------------------------------------------------------------
  // access sites (access-multi-site)
  // -------------------------------------------------------------------------

  /**
   * A new site: its anatomy, puncture model and wire route. The planned site takes the scenario's site
   * overrides. Each groin is its own anatomy (the left one drawn on its own seed), and the artery and
   * vein of one groin share it; a femoral vein site targets the common femoral vein.
   */
  private makeSite(id: string, kind: SiteKindId, side: SiteSide, origin: "planned" | "added"): AccessSiteState {
    const route: AccessRoute = kind === "radial" ? (side === "left" ? "radial-left" : "radial-right") : "femoral";
    const profile = kind !== "radial" && side === "left" ? { ...this.profile, seed: `${this.profile.seed}:left-groin` } : this.profile;
    const ov = origin === "planned" ? this.siteOverrides() : undefined;
    const base = buildAccessSite(route, profile, ov);
    const site: AccessSite = kind === "femoral-vein" ? { ...base, side, arteryId: "cfv" } : { ...base, side };
    const geom = kind !== "radial" && side === "left" ? buildRoute3D("femoral", this.caseData, this.model, 0, "left") : undefined;
    const wireRoute = buildRoute(route, this.caseData, this.model, geom);
    // a tight radial loop (a scenario setting): only balloon-assisted tracking crosses it
    if (kind === "radial" && ov?.tightLoop) tightenLoop(wireRoute);
    return {
      id,
      route,
      side,
      siteKind: kind,
      origin,
      site,
      target: site.tubes.find((t) => t.id === site.arteryId) ?? null,
      pm: new PunctureModel(site),
      wireRoute,
      local: { given: false, at: 0 },
      sheath: null,
      closure: { radial: null, femoral: null, venousAt: null, angiogram: false, raoRisk: null, bandHours: SOURCED_DOSES.bandHours, radialOccluded: null, compression: null, kept: null, plan: { answers: null, choice: null }, aftercare: { groinT: null, pulsesT: null, dressingT: null } },
      delayed: [],
      sheathHistory: "",
      probeOn: origin === "planned",
      addedAt: this.tS,
      firstPassAt: null,
      usImagedAt: null,
      fluoroAt: null,
      markerX: null,
      markX: null,
      markerSeenX: null,
      markSeen: false,
      wireScreenedAt: null,
      misdirectedSeen: false,
      wrongHeightSeen: false,
      up: freshUpsizing(),
      femoralAngio: null,
      femoralAngioReport: null,
      radialSeq: freshRadialAccess(kind === "radial" ? ov : undefined),
    };
  }

  /** The site the operator is working at now. */
  get activeSite(): AccessSiteState {
    return this.sites[this.activeIdx];
  }

  get activeSiteId(): string {
    return this.activeSite.id;
  }

  siteById(id: string): AccessSiteState | undefined {
    return this.sites.find((x) => x.id === id);
  }

  // the active site's state, as the one-site session had it
  get access(): AccessRoute {
    return this.activeSite.route;
  }
  get site(): AccessSite {
    return this.activeSite.site;
  }
  get pm(): PunctureModel {
    return this.activeSite.pm;
  }
  get route(): Route {
    return this.activeSite.wireRoute;
  }
  get local(): { given: boolean; at: number } {
    return this.activeSite.local;
  }
  set local(v: { given: boolean; at: number }) {
    this.activeSite.local = v;
  }
  get sheath(): SiteSheath | null {
    return this.activeSite.sheath;
  }
  set sheath(v: SiteSheath | null) {
    this.activeSite.sheath = v;
  }
  get radial(): RadialClosure | null {
    return this.activeSite.closure.radial;
  }
  set radial(v: RadialClosure | null) {
    this.activeSite.closure.radial = v;
  }
  get femoral(): FemoralClosure | null {
    return this.activeSite.closure.femoral;
  }
  set femoral(v: FemoralClosure | null) {
    this.activeSite.closure.femoral = v;
  }
  get delayed(): DelayedEvent[] {
    return this.activeSite.delayed;
  }
  set delayed(v: DelayedEvent[]) {
    this.activeSite.delayed = v;
  }
  get raoRiskNow(): { probability: number; terms: RiskTerm[] } | null {
    return this.activeSite.closure.raoRisk;
  }
  set raoRiskNow(v: { probability: number; terms: RiskTerm[] } | null) {
    this.activeSite.closure.raoRisk = v;
  }
  get radialOccluded(): boolean | null {
    return this.activeSite.closure.radialOccluded;
  }
  set radialOccluded(v: boolean | null) {
    this.activeSite.closure.radialOccluded = v;
  }
  get radialBandHours(): number {
    return this.activeSite.closure.bandHours;
  }
  set radialBandHours(v: number) {
    this.activeSite.closure.bandHours = v;
  }
  private get femoralAngio(): boolean {
    return this.activeSite.closure.angiogram;
  }
  private set femoralAngio(v: boolean) {
    this.activeSite.closure.angiogram = v;
  }

  /**
   * The site is closed: band on with the sheath out, femoral haemostasis started (a device, or a hands-on
   * compression released once the puncture held), a venous sheath out under pressure, or a femoral sheath
   * kept in, sutured, for a staged PCI or a support device.
   */
  siteClosed(st: AccessSiteState): boolean {
    return (!!st.closure.radial && st.closure.radial.sheathOut) || (!!st.closure.femoral && st.closure.femoral.minutes > 0) || st.closure.venousAt !== null || !!st.closure.kept;
  }

  /** Sites with a sheath (or a wire through an open puncture, or a hands-on compression under way) still to close. */
  openSites(): AccessSiteState[] {
    return this.sites.filter((x) => !this.siteClosed(x) && (!!x.sheath || (!!x.pm.st.wire && x.pm.st.needleRemoved) || (!!x.closure.compression && x.closure.compression.releasedAt === null)));
  }

  /** The site the catheter last went in through, else the planned one (the handover's working site). */
  workingSite(): AccessSiteState {
    return (this.catheterSiteId && this.siteById(this.catheterSiteId)) || this.sites[0];
  }

  /** The active site has a needle in the skin or a wire in a vessel without a sheath over it. */
  private midPuncture(st: AccessSiteState): boolean {
    if (st.sheath || this.siteClosed(st)) return false;
    const p = st.pm.st;
    return (!!p.needle && p.needle.inserted > 0 && !p.needleRemoved) || (!!p.wire && p.needleRemoved);
  }

  /** Why another site cannot be opened now, or null when it can. */
  addSiteBlocked(kind: SiteKindId, side: SiteSide): string | null {
    if (this.finished) return "The case is finished.";
    if (this.busy) return "Wait for the step in hand to finish.";
    // the rule is about the planned site: once another site is open, a further one can be added before it is punctured
    const p = this.sites[0];
    if (this.sites.length === 1 && p.pm.st.passes === 0 && !p.sheath && !this.siteClosed(p)) return "Puncture the planned site first; until then the planned access can still be changed.";
    const a = this.activeSite;
    if (this.wireInBody || this.catheter?.inBody) return "Take the catheter and wire out before you start at another site.";
    if (this.midPuncture(a)) return "Finish this puncture, or withdraw and press, before you start at another site.";
    if (this.sites.some((x) => x.siteKind === kind && x.side === side)) return `The ${siteLabel({ siteKind: kind, side })} is already in use in this case.`;
    return null;
  }

  /**
   * Open another access site once the planned one has been punctured: the radial artery of either
   * arm, or the common femoral artery or vein of either groin. The new site becomes the active one;
   * returns it, or null (the attending says why) when it cannot be opened now.
   */
  addSite(kind: SiteKindId, side: SiteSide): AccessSiteState | null {
    const why = this.addSiteBlocked(kind, side);
    if (why) {
      this.say(why, "technique");
      return null;
    }
    const st = this.makeSite(`site-${this.sites.length + 1}`, kind, side, "added");
    this.sites.push(st);
    this.activeIdx = this.sites.length - 1;
    this.logLine("action", `Another access site: the ${siteLabel(st)}.`);
    this.emit("site-add", { id: st.id, kind, side });
    return st;
  }

  /** Work at another site. Refused while the wire or catheter is in through the active one, or mid-puncture. */
  setActiveSite(id: string): boolean {
    const i = this.sites.findIndex((x) => x.id === id);
    if (i < 0) return false;
    if (i === this.activeIdx) return true;
    // a time lapse (a closure above all) finishes at the site it started at
    if (this.busy) {
      this.say("Wait for the step in hand to finish.", "technique");
      return false;
    }
    if (this.wireInBody || this.catheter?.inBody) {
      this.say("Take the catheter and wire out before you work at another site.", "technique");
      return false;
    }
    if (this.midPuncture(this.activeSite)) {
      this.say("Finish this puncture, or withdraw and press, before you move to another site.", "technique");
      return false;
    }
    this.activeIdx = i;
    this.logLine("action", `Working at the ${siteLabel(this.activeSite)}.`);
    this.emit("site-active", { id });
    return true;
  }

  /**
   * The ultrasound view reports its image (each frame it draws): when the active site's target vessel is
   * in the image, the time is kept as the site's ultrasound guidance. Returns whether the target vessel
   * has been imaged at this site with the probe on. It runs every frame, so once the time is kept it
   * returns at once.
   */
  noteProbeImage(): boolean {
    const st = this.activeSite;
    if (!st.probeOn) return false;
    if (st.usImagedAt !== null) return true;
    const p = st.pm.probe;
    const t = st.target;
    if (!t || !inExtent(t, p.x)) return false;
    const c = tubeAt(t, p.x);
    const across = p.orient === "short" ? Math.abs(c.y - p.y) + t.r < MP_NEEDLE.footprintMm / 2 : Math.abs(c.y - p.y) < t.r;
    const inView = across && c.z + t.r < p.depthMm;
    if (inView) st.usImagedAt = round(this.tS, 10);
    return inView;
  }

  /** Put the ultrasound probe on the skin at the active site, or lift it off (the image is then blank). */
  setProbeOn(on: boolean): void {
    const st = this.activeSite;
    if (st.probeOn === on) return;
    st.probeOn = on;
    this.logLine("action", on ? `Ultrasound probe on the ${siteLabel(st)}.` : "Ultrasound probe lifted off the skin.");
  }

  /**
   * The fluoroscopy view reports an exposed frame at a table station (`view` the C-arm view, 'ap' by default):
   * the groin screened at a femoral site counts as fluoroscopic guidance, and an AP frame of the groin with the
   * marker on the skin shows where its tip lies against the femoral head.
   */
  noteFluoroscopy(stationId: string, view = "ap"): void {
    const st = this.activeSite;
    if (st.route === "femoral" && stationId === "groin" && st.fluoroAt === null) st.fluoroAt = round(this.tS, 10);
    if (st.siteKind === "femoral" && stationId === "groin") {
      if (view === "ap" && st.markerX !== null && st.firstPassAt === null && !st.sheath) st.markerSeenX = st.markerX;
      this.screenMicroWire(st);
    }
  }

  /**
   * The groin screened with the micro-wire in and no sheath over it (Brilakis 4.2, step 8): the image shows
   * where the wire entered against the femoral head and where it runs. A wire in a branch or down the leg
   * raises wire-misdirected; an entry below or above the femoral head raises wrong-height.
   */
  private screenMicroWire(st: AccessSiteState): void {
    const p = st.pm.st;
    if (st.sheath || !p.wire || p.wire.state !== "intraluminal" || !p.arteriotomy) return;
    if (st.wireScreenedAt === null) st.wireScreenedAt = round(this.tS, 10);
    if (st.pm.wireMisdirected()) {
      st.misdirectedSeen = true;
      this.raiseTip("wire-misdirected");
    }
    const h = entryVsHead(st.site, p.arteriotomy.x);
    if (h === "below" || h === "above") {
      st.wrongHeightSeen = true;
      this.raiseTip("wrong-height");
    }
  }

  // -------------------------------------------------------------------------
  // the femoral head marker and the needle (access-femoral-puncture)
  // -------------------------------------------------------------------------

  /** Where the metal marker's tip lies on the skin at the active femoral site (site x, mm), or null. */
  get femoralMarkerX(): number | null {
    return this.activeSite.markerX;
  }

  /** Where the skin was marked at the active femoral site (site x, mm), or null. */
  get femoralMarkX(): number | null {
    return this.activeSite.markX;
  }

  /** Lay the metal marker on the skin with its tip at site x (moved on AP fluoroscopy). Femoral artery sites only. */
  placeFemoralMarker(x: number): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "femoral" || !Number.isFinite(x)) return false;
    st.markerX = round(Math.max(-60, Math.min(120, x)), 10);
    return true;
  }

  /** Mark the skin at the marker's tip (Brilakis 4.2, step 3). It can be marked again before the puncture. */
  markFemoralHead(): boolean {
    const st = this.activeSite;
    if (this.busy || st.siteKind !== "femoral" || st.markerX === null) return false;
    st.markX = st.markerX;
    st.markSeen = st.markerSeenX !== null && st.markerSeenX === st.markerX;
    this.logLine("action", "Skin marked at the tip of the marker.");
    this.emit("femoral-mark", { x: st.markX, site: st.id });
    this.spend(MP_FEMORAL_PUNCTURE.markS, "Marking the skin");
    return true;
  }

  /** Take the needle out and flush it (Brilakis 4.2.6.3, no blood return). Refused with a wire through it. */
  flushNeedle(): boolean {
    if (this.busy) return false;
    if (!this.pm.flushNeedle()) {
      this.say(this.pm.st.wire ? "Take the wire out before you flush the needle." : "There is no needle to flush.", "technique");
      return false;
    }
    this.passHadFlash = false;
    this.logLine("action", "Needle withdrawn and flushed.");
    this.spend(MP_FEMORAL_PUNCTURE.flushNeedleS, "Flushing the needle");
    return true;
  }

  /** A scenario's scripted access events at the active site (public, for scenario scripts). */
  scriptAccess(o: { needlePlugged?: boolean; microWireCourse?: MicroWireCourse }): void {
    this.pm.script(o);
    this.emit("script.access", { ...o });
  }

  /** Make a segment of the active site's wire route impassable (a scenario setting: see procedure.ts obstructSegment). */
  obstructRoute(segment: SegmentId): boolean {
    return obstructSegment(this.activeSite.wireRoute, segment);
  }

  /** A site's own seed for its delayed events: the planned site keeps the case seed. */
  private siteSeed(st: AccessSiteState): string {
    return st.origin === "planned" ? this.seed : `${this.seed}:${st.id}`;
  }

  /** A closure decision's id: the plain id unless another site has already recorded it. */
  private siteDecisionId(base: string): string {
    const owner = this.closureDecisionSite.get(base);
    if (!owner) this.closureDecisionSite.set(base, this.activeSite.id);
    return owner && owner !== this.activeSite.id ? `${base}-${this.activeSite.id}` : base;
  }
  private readonly closureDecisionSite = new Map<string, string>();

  // -------------------------------------------------------------------------
  // modules, hooks and scripted events
  // -------------------------------------------------------------------------

  /** A session module by id (its instance, with its actions); undefined when none is attached. */
  mod<T extends CaseSessionModule = CaseSessionModule>(id: string): T | undefined {
    return this.modules.find((m) => m.id === id) as T | undefined;
  }

  /** The ids of the attached modules, in attach order. */
  moduleIds(): string[] {
    return this.modules.map((m) => m.id);
  }

  /**
   * Ask every module whether it refuses `action` (CaseSessionModule.gate). The first refusal is said as
   * an attending stop line (not repeated within MP_SESSION.stopRepeatS) and the action is refused.
   */
  private gated<A extends CaseGatedAction>(action: A, args: CaseGateArgs[A]): boolean {
    for (const m of this.modules) {
      const why = m.gate?.(action, args);
      if (!why) continue;
      this.say(why, "safety", { stop: true, repeatAfterS: MP_SESSION.stopRepeatS });
      return true;
    }
    return false;
  }

  /** The lab contexts the modules report now (CaseSessionModule.tipContexts), in attach order. */
  moduleTipContexts(): LabContext[] {
    const out: LabContext[] = [];
    for (const m of this.modules) for (const c of m.tipContexts?.() ?? []) out.push(c);
    // a returned PCI: its finish context with the PCI's own complication, dose and contrast flags (pci-adhoc-handover)
    const fu = this.pciFollowUp();
    if (fu && fu.events.length) out.push({ lab: "pci", phase: "finish", events: [...fu.events] });
    return out;
  }

  /** Detach the modules (the lab calls this when the case is replaced). */
  dispose(): void {
    for (const d of this.moduleDisposers.splice(0)) d();
  }

  /** Events raised by the scenario's scripted events so far and by the modules now. */
  scenarioEvents(): LabEvent[] {
    const out = [...this.scriptRaised];
    for (const m of this.modules) for (const e of m.events?.() ?? []) if (!out.includes(e)) out.push(e);
    return out;
  }

  // -------------------------------------------------------------------------
  // tip context (proc-tip-context)
  // -------------------------------------------------------------------------

  /**
   * The access step the learner is at, and the site: puncture until the wire runs free in a lumen;
   * wire while it runs through the needle; sheath from the needle's removal until the sheath has been
   * aspirated and flushed; null once it has, and after closure.
   */
  accessStep(): CaseAccessStep {
    const radial = this.access !== "femoral";
    const site = radial ? "radial" : "femoral";
    const st = this.pm.st;
    const free = st.wire?.state === "intraluminal";
    let step: CaseAccessStep["step"];
    if (this.siteClosed(this.activeSite) || this.sheath?.flushed) step = null;
    else if (this.sheath || (st.needleRemoved && free)) step = "sheath";
    else if (free && st.needle && st.needle.inserted > 0) step = "wire";
    else step = "puncture";
    return { step, site, route: site };
  }

  /**
   * The tip events active now: the session's own (CASE_SESSION_EVENTS) and the patient's
   * (CASE_PATIENT_EVENTS) from its EventLog, then the scenario's scripted events and each module's
   * events(). Each once, in that order.
   */
  activeEvents(): LabEvent[] {
    const out = this.tipEvents.active();
    for (const e of this.scenarioEvents()) if (!out.includes(e)) out.push(e);
    return out;
  }

  /** The case panel showed these tips: each is recorded once, with the time it was first shown. */
  noteTipsShown(ids: readonly string[]): void {
    for (const id of ids) if (!this.tipsShown.some((x) => x.id === id)) this.tipsShown.push({ id, t: round(this.tS, 10) });
  }

  /** Raise one of the session's tip events (transient, default hold unless `holdS`). */
  private raiseTip(e: CaseSessionEvent, holdS?: number): void {
    this.tipEvents.raise(e, holdS, undefined, "case");
  }

  /** What the needle hub shows after a needle move: dark venous blood, or a flashback that has stopped. */
  private hubTipEvents(): void {
    const n = this.pm.st.needle;
    if (!n || n.inserted <= 0 || this.pm.st.needleRemoved) return;
    const f = this.flashback();
    if (f.kind !== "none") this.passHadFlash = true;
    // at a femoral vein site dark blood is what the operator is looking for, not a warning
    if (f.kind === "venous" && this.activeSite.siteKind !== "femoral-vein") this.raiseTip("venous-flashback");
    else if (f.kind === "none" && this.passHadFlash) this.raiseTip("no-flashback");
    // a plugged needle with its tip in a lumen: the image shows the tip inside, the hub stays empty
    else if (f.plugged && f.vessel && f.lumenFraction >= 0.5) this.raiseTip("no-flashback");
  }

  /** Tip events read from the state now (at most every MP_TIPS.sampleS of session time). */
  private sampleTipEvents(): void {
    if (this.tS - this.tipSampleAt < MP_TIPS.sampleS) return;
    this.tipSampleAt = this.tS;
    const v = this.patient.vitals();
    // the ACT is read only once the case has gone to PCI: the adapter's goal is the PCI ACT goal
    const pci = this.handedOver === "pci" || this.labsDone.includes("pci");
    const lastAct = this.acts.length ? this.acts[this.acts.length - 1].act : null;
    this.patientTipEvents.update(v, { actMeasuredS: pci ? lastAct : null, lvTrace: false, echo: false });
    if (this.armPerforationOpen() && !this.closureDone()) {
      this.raiseTip("perforation");
      this.raiseTip("bleeding");
    }
    for (const st of this.sites) if (st.closure.radial?.sheathOut && st.closure.radial.bandOffAt === null && this.bandStatusFor(st)?.bleeding) this.raiseTip("bleeding");
    if (this.activeBleeds.some((b) => b.left > 0 && (VISIBLE_SWELLING.includes(b.ev.kind) || b.ev.kind === "rebleed"))) this.raiseTip("bleeding");
    // under the fingers: blood at the skin nick, and a groin swelling large enough to see
    for (const st of this.sites) {
      const c = st.closure.compression;
      if (!c || c.releasedAt !== null) continue;
      if (c.oozeMlMin > 0) this.raiseTip("bleeding");
      if (c.haematomaMl >= MP_COMPRESSION.visibleHaematomaMl) this.tipEvents.hold(["haematoma"], undefined, "case");
    }
    if (this.ex.connected && v.transducer?.verdict === "overdamped") this.raiseTip("pressure-damped");
    if (this.pciGateOpen) this.pciGateContrast();
  }

  /** A session moment: record when it first happened, run the scripted events keyed to it and tell the modules. */
  private fireHook(hook: SessionHook): void {
    const first = this.hookAt[hook] === undefined;
    if (first) this.hookAt[hook] = this.tS;
    if (first) this.runScript();
    for (const m of this.modules) m.onHook?.(hook);
  }

  /** Fire every scripted event whose hook has happened and whose delay has passed. */
  private runScript(): void {
    const pending = this.scriptPending;
    if (!pending.length) return;
    // runs every frame: nothing is allocated unless an event is due
    let anyDue = false;
    for (let i = 0; i < pending.length && !anyDue; i++) {
      const at = this.hookAt[pending[i].hook];
      anyDue = at !== undefined && this.tS >= at + pending[i].afterS;
    }
    if (!anyDue) return;
    // take the due events out before firing any, so an event that fires a hook (and so runScript) sees the rest
    const due: ScriptedEvent[] = [];
    for (let i = 0; i < pending.length; ) {
      const p = pending[i];
      const at = this.hookAt[p.hook];
      if (at !== undefined && this.tS >= at + p.afterS) {
        due.push(p.ev);
        pending.splice(i, 1);
      } else i++;
    }
    for (const ev of due) {
      for (const e of ev.events ?? []) if (!this.scriptRaised.includes(e)) this.scriptRaised.push(e);
      if (ev.log) this.logLine(ev.log.kind, ev.log.text);
      if (ev.complication) this.complication(ev.complication.id, ev.complication.label, ev.complication.severity);
      ev.run?.(this);
      this.emit("script", { at: ev.at, events: ev.events ?? [] });
    }
  }

  // -------------------------------------------------------------------------
  // the decision ledger
  // -------------------------------------------------------------------------

  /**
   * Record a scored decision (src/mentor/ledger.ts). A decision recorded again under the same id
   * replaces the earlier one. Shown only in the debrief and the handover summary after the case.
   */
  decide(rec: Omit<DecisionRecord, "t" | "stage"> & { t?: number; stage?: DecisionStage | string }): DecisionRecord {
    const r = this.ledger.add({ ...rec, t: round(rec.t ?? this.tS, 10), stage: rec.stage ?? "table" });
    this.emit("decision", { id: r.id, correct: r.correct });
    return r;
  }

  /**
   * Record a decision that is scored each time the step is done (each catheter, each flush): a
   * step done wrongly once stays wrong for the case, so a later clean repeat does not hide it.
   */
  private decideOnce(rec: Parameters<CaseSession["decide"]>[0]): void {
    const prev = this.ledger.get(rec.id);
    if (prev && !prev.correct) return;
    this.decide(rec);
  }

  /** The decisions so far, in the order first made. */
  decisions(): DecisionRecord[] {
    return this.ledger.all();
  }

  /**
   * Empty the ledger once the autopilot has played the case to its start stage: those decisions
   * were the autopilot's, not the learner's, so the debrief and the logbook row never show them.
   */
  clearAutopilotDecisions(): void {
    this.ledger.clear();
    // the team's pushes against forearm resistance are not the learner's (access-radial-sequence)
    for (const st of this.sites) {
      st.radialSeq.armResistanceAt = null;
      st.radialSeq.pushedAgainstMm = 0;
      // the team's wait at the end of its PCI is not the learner's (access-closure-radial)
      st.radialSeq.closureWaitS = 0;
    }
  }

  /** The learner asks the attending for help: the first request time is kept (tips follow from it). */
  askHelp(): number {
    if (this.helpAskedAt === null) this.helpAskedAt = round(this.tS, 10);
    this.logLine("action", "Asked the attending for help.");
    this.emit("help", {});
    return this.helpAskedAt;
  }

  // -------------------------------------------------------------------------
  // clock
  // -------------------------------------------------------------------------

  get busy(): boolean {
    return this.pending > 0.01;
  }

  /**
   * Queue a step that takes `s` seconds; `done` runs when the time has passed. `long` marks a lapse a
   * module may hold (a femoral compression, a band's or the recovery's time); a step queued onto a long
   * lapse keeps it long.
   */
  private spend(s: number, label: string, done?: () => void, long = false): void {
    this.pendingLong = this.busy ? this.pendingLong || long : long;
    this.pending += s;
    this.pendingLabel = label;
    if (done) {
      const prev = this.pendingDone;
      this.pendingDone = () => {
        prev?.();
        done();
      };
    }
  }

  /**
   * Advance wall time `dt` (s) plus a slice of any pending time-lapse, and of a held lapse its rate
   * times `dt` (a paused one none: tick(0), the skip button and the tests, does not run it).
   */
  tick(dt: number): void {
    const wall = Math.max(0, dt);
    let lapse = Math.min(this.pending, MP_SESSION.lapsePerTick);
    const h = this.held;
    const background = h ? Math.min(h.left, wall * this.heldRate()) : 0;
    if (h) h.left -= background;
    this.advanceClock(wall + background);
    // the lapse's slice in the patient's own steps: a hold that begins during it (an emergency's onset,
    // seen by a module's slowTick) takes what is left of the lapse, the rest of this slice included
    while (lapse > 1e-9 && this.pending > 1e-9 && !(this.held && this.held !== h)) {
      const c = Math.min(lapse, 5, this.pending);
      this.pending -= c;
      lapse -= c;
      this.advanceClock(c);
    }
    if (this.pending <= 0.01) {
      this.pending = 0;
      const d = this.pendingDone;
      this.pendingDone = null;
      d?.();
    }
    // a held lapse that has run out in the background ends as it would have (its holders are let go)
    if (h && this.held === h && h.left <= 0.01) {
      this.held = null;
      this.lapseHolders.clear();
      this.emit("lapse-ended-held", { label: h.label });
      h.done?.();
    }
  }

  // -------------------------------------------------------------------------
  // holding a long time-lapse (repair-session-flow)
  // -------------------------------------------------------------------------

  /** The rate a held lapse runs at: the slowest holder's. */
  private heldRate(): number {
    let r = Infinity;
    for (const v of this.lapseHolders.values()) r = Math.min(r, v);
    return Number.isFinite(r) ? r : 0;
  }

  /**
   * A module (`by`) holds the running femoral compression, band or recovery time-lapse, as when an
   * emergency begins during it: the lapse is set aside, so the session is free (orders, the emergency
   * orders, a look) and the clock runs at the wall clock, with the held lapse running on in the
   * background at `rate` times the wall clock (0, the default: paused). Several holders: the slowest
   * rate. Returns false when holds are off (lapseHoldsOn), or no long lapse runs and none is held.
   * A lapse already held takes the new holder.
   */
  holdLapse(by: string, rate = 0): boolean {
    if (!this.lapseHoldsOn) return false;
    const r = Math.max(0, Number.isFinite(rate) ? rate : 0);
    if (this.held) {
      this.lapseHolders.set(by, r);
      return true;
    }
    if (!(this.pending > 0.01) || !this.pendingLong) return false;
    this.held = { left: this.pending, label: this.pendingLabel, done: this.pendingDone };
    this.pending = 0;
    this.pendingDone = null;
    this.pendingLong = false;
    this.lapseHolders.set(by, r);
    this.logLine("event", `${this.held.label}: time-lapse ${r > 0 ? "slowed" : "paused"}.`);
    this.emit("lapse-held", { by, rate: r, leftS: round(this.held.left, 10) });
    return true;
  }

  /**
   * The holder lets go; once no holder is left the lapse goes back on the clock (after any step queued
   * meanwhile) and its end runs as before. Returns false when this holder held nothing.
   */
  releaseLapse(by: string): boolean {
    if (!this.lapseHolders.delete(by)) return false;
    const h = this.held;
    if (!h || this.lapseHolders.size > 0) return true;
    this.held = null;
    this.logLine("event", `${h.label}: time-lapse resumed.`);
    this.spend(h.left, h.label, h.done ?? undefined, true);
    this.emit("lapse-released", { by, leftS: round(h.left, 10) });
    return true;
  }

  /** The held lapse now: its label, what is left (s), who holds it and the rate it runs at; null when none. */
  get lapseHeld(): { label: string; leftS: number; by: string[]; rate: number } | null {
    const h = this.held;
    return h ? { label: h.label, leftS: h.left, by: [...this.lapseHolders.keys()], rate: this.heldRate() } : null;
  }

  /** True while a scenario's start state runs (openAtStart): what it does (a team puncture) is the team's. */
  get teamSetup(): boolean {
    return this.startStateRunning;
  }

  /** Run a scenario's start state as the team's (newCaseSession and newCaseSessionStepped, through openAtStart). */
  runAsTeam(fn: () => void): void {
    const was = this.startStateRunning;
    this.startStateRunning = true;
    try {
      fn();
    } finally {
      this.startStateRunning = was;
    }
  }

  /** Run all pending time at once (tests, and the skip button). */
  runPending(): void {
    let guard = 0;
    while (this.busy && guard++ < 100000) this.tick(0);
  }

  /** Let `s` seconds pass with nothing done (observation). */
  wait(s: number, label = "Waiting"): void {
    this.spend(s, label);
  }

  /**
   * The learner's explicit wait for the ACT to fall with the radial sheath still in at the end of the case
   * (access-closure-radial; pm-closure-radial). Only this wait counts against 'radial-sheath-out-now': time
   * spent on emergencies, planning or between the labs goes through wait() and is not counted.
   */
  waitWithSheathIn(s: number, label = "Waiting for the ACT to fall, the sheath in"): void {
    const st = this.activeSite;
    if (st.siteKind === "radial" && this.sheath && !this.catheter?.inBody && !st.closure.radial?.sheathOut && s > 0)
      st.radialSeq.closureWaitS = (st.radialSeq.closureWaitS ?? 0) + s;
    this.wait(s, label);
  }

  private advanceClock(dt: number): void {
    if (dt <= 0) return;
    // advance the patient in chunks so the slow consequences below see time pass
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(left, 5);
      this.patient.advance(h);
      this.tS += h;
      left -= h;
      this.slowTick(h);
    }
    for (const e of this.patient.drainEvents()) {
      this.telemetry.push(e);
      this.notePressor(e);
    }
    if (this.telemetry.length > 4000) this.telemetry.splice(0, this.telemetry.length - 4000);
  }

  /** Consequences that accrue with time. */
  private slowTick(h: number): void {
    // the smoothed pressures the band thresholds read (access-closure-radial)
    {
      const now = this.mapSys();
      const p = this.bandPressures;
      if (!p) this.bandPressures = { map: now.map, sys: now.sys };
      else {
        const k = 1 - Math.exp(-h / MP_BAND.thresholdSmoothingS);
        p.map += (now.map - p.map) * k;
        p.sys += (now.sys - p.sys) * k;
      }
    }
    // haematoma from open holes in the vessel wall (before the sheath plugs its own), at each site still open
    const act = this.actTrue();
    const actK = Math.max(0.6, act / 130);
    for (const st of this.sites) {
      if (this.siteClosed(st)) continue;
      const holes = st.pm.openHoles();
      st.pm.st.haematomaMl += (holes.arterial * MP_SESSION.holeBleedMlMin * actK + holes.venous * 0.1) * (h / 60);
    }
    // catheter lumen: stagnant blood clots when not anticoagulated
    const c = this.catheter;
    if (c && c.inBody && !c.lumenClot && this.ex.wireOut && this.tS - c.lastFlushAt > MP_SESSION.clotAfterS && act < MP_SESSION.clotActS) {
      c.lumenClot = true;
      this.hazards.catheterThrombus = Math.max(this.hazards.catheterThrombus, 0.6);
      this.emit("hazard.catheter-thrombus", {});
    }
    // the radial arteries' tone (radialSpasm.ts), at every radial site still open
    this.stepRadialTone(h);
    // spasm relaxes or builds with time (anxiety, vasodilators), even when the wire is still
    if (this.wireInBody && this.access !== "femoral") {
      const r = stepWire(this.wire, this.route, { advance: 0, torque: 0, breath: this.breath, hydrophilic: this.wireKind === "hydrophilic", ...this.spasmInputs() }, h);
      this.wire = { ...this.wire, spasm: r.spasm };
    }
    // air embolism clears
    if (this.airUntil && this.tS >= this.airUntil) {
      this.patient.clearOcclusion("air-embolism");
      this.airUntil = 0;
      this.logLine("event", "The ST changes settle as the air clears from the coronary.");
    }
    // hands-on femoral compression (each femoral site): the fingers on the hole, the blood it loses into the groin
    // (stepped in place: this runs about every frame while the hands are on)
    let sysNow: number | null = null;
    for (const site of this.sites) {
      const c = site.closure.compression;
      if (!c || c.releasedAt !== null) continue;
      sysNow ??= this.patient.vitals().aortaTrue.sys;
      const lost = stepCompressionInPlace(c, h, act, sysNow);
      if (lost > 0) this.patient.fluid(-lost * MP_SESSION.bleedStressedShare, 1);
    }
    // band: oozing when under-compressed (each radial site); a band off the hole bleeds into the forearm or at the wrist
    for (const site of this.sites) {
      const r = site.closure.radial;
      if (!r || !r.sheathOut || r.bandOffAt !== null) continue;
      const st = this.bandStatusFor(site);
      if (!st || !st.bleeding) continue;
      const ml = st.oozeMlMin * (h / 60);
      r.oozeMl += ml;
      if (st.bleedSite === "forearm") {
        const before = r.forearmMl ?? 0;
        r.forearmMl = before + ml;
        if (before < MP_BAND_POSITION.visibleSwellingMl && r.forearmMl >= MP_BAND_POSITION.visibleSwellingMl) {
          this.logLine("result", "A firm, tender swelling is coming up just above the band.");
          this.tipEvents.hold(["haematoma"], undefined, "case");
        }
      } else if (st.bleedSite === "wrist") r.wristMl = (r.wristMl ?? 0) + ml;
    }
    // delayed events present (each site's own list; each event once); the ward takes its own kinds, and the
    // access haematomas once its plan is written, and presents them when an observation finds them
    for (const site of this.sites)
      for (const ev of site.delayed) {
        if (this.presented.includes(ev) || this.wardTaken.has(ev)) continue;
        if (this.tS >= ev.atS) {
          if (this.ward.takes(ev)) {
            this.wardTaken.add(ev);
            this.ward.onset(ev);
          } else if (!WARD_ONLY_DELAYED.includes(ev.kind)) {
            this.presented.push(ev);
            this.presentDelayed(ev);
          }
        }
      }
    // the attending stops the case for a stroke on the table
    this.tableStrokeWatch();
    // the ward's sets and findings; a recovery time-lapse stops at a finding
    if (this.ward.step() && this.pending > 0.01 && this.pendingLabel.startsWith("Recovery")) {
      this.pending = 0;
      this.logLine("event", "Recovery: the nurse calls you.");
    }
    // active bleeding into the engine
    for (const b of this.activeBleeds) {
      if (b.left <= 0) continue;
      const ml = Math.min(b.left, (b.ev.bleedMlMin * h) / 60);
      b.left -= ml;
      if (ml > 0) this.patient.fluid(-ml * MP_SESSION.bleedStressedShare, 1);
    }
    // scripted events keyed to a time after a hook ('recovery+40min'), then the modules
    this.runScript();
    for (const m of this.modules) m.slowTick?.(h);
    // the session's own vasodilation, after the modules' cause runs have written theirs
    if (this.bpLoweredUntil !== null || this.protamineReaction || this.vasoOwn > 0) this.applyVasodilation();
    this.sampleTipEvents();
  }

  // -------------------------------------------------------------------------
  // logging, attending, telemetry
  // -------------------------------------------------------------------------

  private logLine(kind: LogKind, text: string): void {
    const last = this.log[this.log.length - 1];
    if (last && last.text === text && last.kind === kind) return;
    this.log.push({ t: round(this.tS, 10), kind, text });
    if (this.log.length > 300) this.log.splice(0, this.log.length - 300);
  }

  private emit(kind: string, data?: Record<string, unknown>): void {
    this.telemetry.push({ tWall: round(this.tS, 10), tPatient: this.patient.clockState().t, kind: `session.${kind}`, data });
  }

  /**
   * The attending speaks if the visibility policy allows this kind of line in this mode: a stop line
   * always (critical in exam), a safety line outside exam, a technique or efficiency line as the mentor
   * level allows. With `repeatAfterS`, the same text said within that time is not said again (a second
   * click on a refused action). Public for the session modules (modules/index.ts), which speak only
   * through this.
   */
  say(text: string, severity: AttendingLine["severity"], o: { stop?: boolean; critical?: boolean; repeatAfterS?: number } = {}): AttendingLine | null {
    const allowed = o.stop || severity === "safety" ? true : this.policy.mentor === "full" ? true : this.policy.mentor === "faded" ? severity === "technique" : false;
    if (this.mode === "exam" && !o.stop) return null;
    if (!allowed) return null;
    if (o.repeatAfterS !== undefined) {
      const last = this.attending[this.attending.length - 1];
      if (last && last.text === text && round(this.tS, 10) - last.t < o.repeatAfterS) return null;
    }
    const line: AttendingLine = { id: `a${++this.lid}`, t: round(this.tS, 10), text, severity, stop: !!o.stop, critical: !!o.critical || (this.mode === "exam" && !!o.stop) };
    this.attending.push(line);
    this.logLine("attending", text);
    return line;
  }

  /** A line in the case log at the session time (the session modules write the log only through this). */
  logEntry(kind: LogKind, text: string): void {
    this.log.push({ t: round(this.tS, 10), kind, text });
    if (this.log.length > 300) this.log.splice(0, this.log.length - 300);
  }

  private critical(id: string, label: string): void {
    if (this.complications.some((c) => c.id === id && c.critical)) return;
    this.criticalErrors++;
    this.complications.push({ id, t: this.tS, label, severity: "major", critical: true });
    this.emit("critical", { id, label });
  }

  private complication(id: string, label: string, severity: "minor" | "major", source?: "pci"): void {
    if (this.complications.some((c) => c.id === id)) return;
    this.complications.push({ id, t: this.tS, label, severity, critical: false, ...(source ? { source } : {}) });
    this.emit("complication", { id, label, severity });
  }

  // -------------------------------------------------------------------------
  // chart, consent, time-out
  // -------------------------------------------------------------------------

  private buildChart(): Record<ChartItemId, ChartEntry> {
    const p = this.profile;
    const rng = new SeededRng(`chart:${this.seed}`);
    const inr = p.anticoagulation === "warfarin" ? round(rng.range(1.8, 3.2), 10) : null; // MODEL PARAMETER range
    // a scenario's DOAC (profile.doac) gives the agent and the time since the dose; otherwise drawn
    const doacH = p.anticoagulation === "doac" ? (p.doac ? round(p.doac.hoursSinceDose, 10) : Math.round(rng.range(12, 48))) : null; // MODEL PARAMETER range
    const hist = rng.next();
    const history =
      hist < 0.12
        ? "Previous coronary angiography through the right radial artery; a weak right radial pulse is documented since."
        : hist < 0.2
        ? "Previous coronary bypass grafting with a left internal mammary artery graft."
        : hist < 0.28
        ? "Previous femoral angiography with a small groin haematoma."
        : "No previous arterial access.";
    const allergyText =
      p.allergies.contrast === "previous-severe"
        ? "Previous severe reaction to iodinated contrast."
        : p.allergies.contrast === "previous-mild"
        ? "Previous mild reaction to iodinated contrast (urticaria)."
        : "No known contrast reaction.";
    const other = p.allergies.other.length ? ` Other: ${p.allergies.other.join(", ")}.` : "";
    const anticoag =
      p.anticoagulation === "warfarin"
        ? `Warfarin for atrial fibrillation; INR today ${inr}.`
        : p.anticoagulation === "doac"
        ? `${p.doac ? `${p.doac.agent[0].toUpperCase()}${p.doac.agent.slice(1)} (direct oral anticoagulant)` : "Direct oral anticoagulant"}; last dose ${doacH} h ago.`
        : "No oral anticoagulant.";
    const rf = [p.risk.diabetes && "diabetes", p.risk.hypertension && "hypertension", p.risk.dyslipidaemia && "dyslipidaemia", p.risk.smoker && "smoker"].filter(Boolean).join(", ");
    const chart: Record<ChartItemId, ChartEntry> = {
      indication: { id: "indication", label: "Indication and ECG", text: `${INDICATION_LABEL[p.indication]}. ${rf ? rf[0].toUpperCase() + rf.slice(1) + "." : ""} ${p.baseline.rhythm === "af" ? "Atrial fibrillation" : "Sinus rhythm"}, LVEF ${p.lvef}%.`, reviewed: false },
      allergies: { id: "allergies", label: "Allergies", text: allergyText + other, reviewed: false },
      renal: { id: "renal", label: "Renal function", text: `Creatinine ${p.renal.creatinineUmolL} µmol/L; eGFR ${p.renal.egfr} mL/min/1.73 m² (CKD-EPI 2021); creatinine clearance ${p.renal.crclMlMin} mL/min (Cockcroft-Gault). Maximum contrast dose ${p.renal.macdMl} mL (Cigarroa).`, reviewed: false },
      anticoag: { id: "anticoag", label: "Anticoagulation", text: anticoag, reviewed: false },
      weight: { id: "weight", label: "Height and weight", text: `${p.heightCm} cm, ${p.weightKg} kg (BMI ${round(p.bmi, 10)}).`, reviewed: false },
      history: { id: "history", label: "Previous access", text: history, reviewed: false },
      "consent-form": { id: "consent-form", label: "Consent form", text: "Signed for coronary angiography and possible angioplasty.", reviewed: false },
    };
    // a scenario's chart text replaces the generated text of that item
    for (const [id, text] of Object.entries(this.scenario.chart ?? {}) as [ChartItemId, string | undefined][]) if (text && chart[id]) chart[id].text = text;
    return chart;
  }

  reviewChart(id: ChartItemId): void {
    const e = this.chart[id];
    if (e.reviewed || this.busy) return;
    e.reviewed = true;
    e.at = this.tS;
    this.spend(MP_SESSION.chartItemS, `Reading: ${e.label.toLowerCase()}`);
    this.logLine("action", `Chart: ${e.label.toLowerCase()} reviewed.`);
    this.emit("chart", { id });
    if (id === "renal") {
      this.contrastBudgetMl = this.profile.renal.macdMl;
      this.say(`Contrast budget for this patient: ${this.profile.renal.macdMl} mL by the Cigarroa formula.`, "efficiency");
    }
    if (id === "allergies" && this.profile.allergies.contrast !== "none")
      this.say("A previous contrast reaction. Make sure the team knows, the plan is agreed with the attending and resuscitation drugs are ready.", "safety");
    if (id === "anticoag" && this.profile.anticoagulation !== "none" && this.access === "femoral")
      this.say("This patient is anticoagulated. A radial-first approach is recommended for all patients; think about the femoral route.", "technique");
  }

  confirmConsent(): void {
    if (this.consent.obtained || this.busy) return;
    this.consent = { obtained: true, at: this.tS };
    this.spend(MP_SESSION.consentS, "Confirming consent with the patient");
    this.logLine("action", "Consent confirmed with the patient: procedure, risks, alternatives.");
    this.emit("consent", {});
  }

  /** Items the team confirms aloud. Each must be backed by the chart. */
  timeOutItems() {
    return TIME_OUT_ITEMS.filter((i) => !i.pci);
  }

  private chartBacking(item: string): ChartItemId[] {
    switch (item) {
      case "patient":
        return ["indication", "consent-form"];
      case "allergy":
        return ["allergies"];
      case "renal":
        return ["renal"];
      case "anticoag":
        return ["anticoag"];
      case "access":
        return ["history"];
      default:
        return [];
    }
  }

  confirmTimeOutItem(id: string): void {
    if (this.timeOut.checked[id]) return;
    this.timeOut.checked[id] = true;
    const missing = this.chartBacking(id).filter((c) => !this.chart[c].reviewed);
    if (missing.length) {
      this.timeOut.falseConfirmations.push(id);
      this.say(`You confirmed "${TIME_OUT_ITEMS.find((i) => i.id === id)?.text.toLowerCase()}" but you have not read the ${missing.map((m) => this.chart[m].label.toLowerCase()).join(" and ")}. What does it say?`, "safety");
    }
    if (this.timeOutItems().every((i) => this.timeOut.checked[i.id]) && this.timeOut.completedAt === null) {
      this.timeOut.completedAt = this.tS;
      this.spend(MP_SESSION.timeOutS, "Team time-out");
      this.logLine("action", "Time-out completed by the team.");
      this.emit("time-out", { falseConfirmations: this.timeOut.falseConfirmations.length });
      const unread = this.timeOut.falseConfirmations.map((x) => TIME_OUT_ITEMS.find((i) => i.id === x)?.text.toLowerCase() ?? x);
      this.decide({
        id: "time-out-backed",
        stage: "chart",
        label: "Time-out items confirmed from the chart",
        correct: unread.length === 0,
        expected: "Every item read in the chart before it was confirmed aloud",
        given: unread.length ? `Confirmed without reading the chart: ${unread.join("; ")}` : "Every item backed by the chart",
        lessonId: "pm-planning-steps",
        tipIds: ["pci-mon-time-out"],
      });
      this.fireHook("time-out");
    }
  }

  get timeOutDone(): boolean {
    return this.timeOut.completedAt !== null;
  }

  // -------------------------------------------------------------------------
  // orders
  // -------------------------------------------------------------------------

  /** One-touch and user-dosed orders. `dose` is required for the user-dosed drugs (sedation, rescue drugs). */
  order(id: OrderId, dose?: number): OrderRecord | null {
    if (this.busy) return null;
    const p = this.profile;
    let rec: OrderRecord | null = null;
    const give = (o: DoseOrder, label: string, unit: string) => {
      // a tissued IV cannula: the drug goes into the tissues, not the circulation (proc-heparin-act-handover)
      const delivered = this.ivDelivers(o.route);
      if (delivered) this.patient.give(o);
      rec = { id, label, t: this.tS, dose: o.dose, unit, route: o.route.toUpperCase() };
      if (o.drug === "heparin") this.heparinDoses.push({ u: o.dose, t: round(this.tS, 10), route: o.route === "ia" ? "ia" : "iv", delivered });
    };
    switch (id) {
      case "local":
        if (this.local.given) return null;
        // at the wrist the local is a volume infiltrated at the probe (access-radial-sequence), aspirated first
        if (this.activeSite.siteKind === "radial") return this.giveLocal(dose && dose > 0 ? dose : MP_RADIAL_SEQUENCE.defaultLocalMl, { aspirate: true }) ? this.orders[this.orders.length - 1] : null;
        this.local = { given: true, at: this.tS };
        this.spend(MP_SESSION.localS, "Local anaesthetic to the skin");
        rec = { id, label: "Lidocaine 2% to the skin and subcutaneous tissue", t: this.tS, dose: 0, unit: "", route: "SC" };
        this.patient.stimulus("puncture", 0.15);
        break;
      case "heparin-radial":
        give({ drug: "heparin", dose: SOURCED_DOSES.radialHeparinU, route: this.sheath ? "ia" : "iv" }, `Heparin ${SOURCED_DOSES.radialHeparinU} U`, "U");
        this.heparinU += SOURCED_DOSES.radialHeparinU;
        break;
      case "heparin-weight": {
        const u = Math.round((p.weightKg * SOURCED_DOSES.radialHeparinUPerKg) / 100) * 100;
        give({ drug: "heparin", dose: u, route: this.sheath ? "ia" : "iv" }, `Heparin ${u} U (${SOURCED_DOSES.radialHeparinUPerKg} U/kg)`, "U");
        this.heparinU += u;
        break;
      }
      case "heparin-pci": {
        const u = this.pciTopUpU();
        if (u <= 0) {
          this.say("The heparin already given meets the PCI dose. Check the ACT.", "technique");
          return null;
        }
        give({ drug: "heparin", dose: u, route: "iv" }, `Heparin ${u} U (top-up to ${this.pciDoseRangeUPerKg()[0]} U/kg)`, "U");
        this.heparinU += u;
        break;
      }
      case "verapamil":
      case "verapamil-high": {
        if (!this.sheath) return this.needSheath("Verapamil goes into the radial artery through the sheath.");
        const mg = id === "verapamil" ? SOURCED_DOSES.verapamilMg : SOURCED_DOSES.verapamilHighMg;
        give({ drug: "verapamil", dose: mg, route: "ia" }, `Verapamil ${mg} mg intra-arterial`, "mg");
        this.ia.push({ kind: "verapamil", t: this.tS, dose: mg });
        this.patient.stimulus("cocktail", 0.3);
        break;
      }
      case "gtn":
      case "gtn-low": {
        if (!this.sheath) return this.needSheath("Glyceryl trinitrate for spasm goes into the artery through the sheath.");
        const ug = id === "gtn" ? SOURCED_DOSES.gtnUg : SOURCED_DOSES.gtnLowUg;
        give({ drug: "gtn", dose: ug, route: "ia" }, `Glyceryl trinitrate ${ug} µg intra-arterial`, "µg");
        this.ia.push({ kind: "gtn", t: this.tS, dose: ug });
        break;
      }
      case "midazolam":
      case "fentanyl":
      case "atropine":
      case "metaraminol":
      case "hydrocortisone":
      case "chlorphenamine": {
        if (!(dose && dose > 0)) return null;
        const units: Record<string, string> = { midazolam: "mg", fentanyl: "µg", atropine: "mg", metaraminol: "mg", hydrocortisone: "mg", chlorphenamine: "mg" };
        give({ drug: id, dose, route: "iv" }, `${id[0].toUpperCase()}${id.slice(1)} ${dose} ${units[id]} IV`, units[id]);
        break;
      }
      case "fluid": {
        const ml = dose && dose > 0 ? dose : 250;
        this.patient.fluid(ml, 600);
        rec = { id, label: `Crystalloid ${ml} mL IV`, t: this.tS, dose: ml, unit: "mL", route: "IV" };
        break;
      }
      case "radial-cocktail": {
        // Oxford's cocktail into the radial artery before catheterisation (pm-access-radial-sheath, steps 9-10)
        if (!this.sheath || this.access === "femoral") return this.needSheath("The radial cocktail goes into the radial artery through the sheath.");
        const c = MP_RADIAL_SEQUENCE.cocktail;
        give({ drug: "heparin", dose: c.heparinU, route: "ia" }, `Radial cocktail: heparin ${c.heparinU} IU, verapamil ${c.verapamilMg} mg and glyceryl trinitrate ${c.gtnUg} µg intra-arterial`, "");
        this.heparinU += c.heparinU;
        this.patient.give({ drug: "verapamil", dose: c.verapamilMg, route: "ia" });
        this.patient.give({ drug: "gtn", dose: c.gtnUg, route: "ia" });
        this.ia.push({ kind: "verapamil", t: this.tS, dose: c.verapamilMg }, { kind: "gtn", t: this.tS, dose: c.gtnUg });
        this.patient.stimulus("cocktail", 0.3);
        break;
      }
    }
    if (!rec) return null;
    const r: OrderRecord = rec;
    this.orders.push(r);
    this.radialAfterOrder(id);
    if (id !== "local") this.spend(MP_SESSION.drugS, `Giving ${r.label.toLowerCase()}`);
    this.logLine("action", `Given: ${r.label}.`);
    this.emit("order", { id, dose: r.dose, unit: r.unit, route: r.route });
    return r;
  }

  private needSheath(text: string): null {
    this.say(text, "technique");
    return null;
  }

  /**
   * Units still needed to reach the lower PCI dose (70 U/kg, or 50 U/kg with an IV antiplatelet agent planned), counting what
   * was given, rounded up to 500 U so the total it names is never below the lower bound.
   */
  pciTopUpU(): number {
    const need = this.profile.weightKg * this.pciDoseRangeUPerKg()[0];
    return Math.max(0, Math.ceil((need - this.heparinU) / 500) * 500);
  }

  measureAct(): number | null {
    if (this.busy) return null;
    const act = this.patient.measureAct();
    this.acts.push({ t: this.tS, act });
    this.spend(MP_SESSION.actS, "Activated clotting time");
    this.logLine("result", `ACT ${act} s.`);
    // at a femoral closure (the sheath in, the catheter out) an ACT at or above the sheath-pull threshold is the operator's number to wait on
    // (held until a lower reading or until the sheath is dealt with)
    if (this.activeSite.siteKind === "femoral" && this.sheath && !this.catheter?.inBody) {
      if (!actAllowsPull(this.compressionRule, act, this.sinceLastHeparinS())) this.tipEvents.hold(["act-high"], undefined, "case");
      else this.tipEvents.clear("act-high");
    }
    this.pciGateAfterAct(act);
    return act;
  }

  /** Seconds since the last heparin dose (null: none given). */
  private sinceLastHeparinS(): number | null {
    return this.heparinDoses.length ? this.tS - this.heparinDoses[this.heparinDoses.length - 1].t : null;
  }

  /**
   * The ACT the operator knows: the last measurement, when one was taken after the last heparin dose
   * (an earlier one no longer stands); null otherwise.
   */
  private knownAct(): number | null {
    const last = this.acts.length ? this.acts[this.acts.length - 1] : null;
    if (!last) return null;
    const lastHeparin = this.heparinDoses.length ? this.heparinDoses[this.heparinDoses.length - 1].t : null;
    return lastHeparin === null || last.t >= lastHeparin ? last.act : null;
  }

  /** True ACT now (for consequences; not shown until measured). */
  private actTrue(): number {
    return this.patient.vitals().actTrue;
  }

  /** IA vasodilator effect at the radial artery now (0..1), model of the local effect of GTN and verapamil. */
  vasodilatorEffect(): number {
    let e = 0;
    for (const d of this.ia) {
      const age = this.tS - d.t;
      if (d.kind === "gtn") e += (d.dose / 100) * MP_SESSION.gtnEffectPer100Ug * Math.exp(-age / MP_SESSION.gtnTauS);
      else e += d.dose * MP_SESSION.verapamilEffectPerMg * Math.exp(-age / MP_SESSION.verapamilTauS);
    }
    return Math.min(1, e);
  }

  private spasmInputs() {
    const s = this.patient.vitals().symptoms;
    const pain = this.local.given ? 0 : 0.2;
    return { vasodilator: this.vasodilatorEffect(), anxiety: Math.min(1, s.anxiety + pain), sedation: s.drowsy, laoDeg: this.laoDeg };
  }

  // -------------------------------------------------------------------------
  // access: ultrasound and puncture
  // -------------------------------------------------------------------------

  /** Change the planned route (before any puncture). */
  setAccess(a: AccessRoute): boolean {
    const st0 = this.sites[0];
    if (this.sites.length > 1 || st0.pm.st.passes > 0 || st0.sheath) return false;
    if (st0.siteKind === "radial" && st0.site.arm?.cannotSupinate && a === "femoral") this.decideCannotSupinate(st0, true);
    const fresh = this.makeSite(st0.id, a === "femoral" ? "femoral" : "radial", a === "radial-left" ? "left" : "right", "planned");
    // the local anaesthetic already given stays with the case's planned site
    fresh.local = st0.local;
    this.sites[0] = fresh;
    this.activeIdx = 0;
    this.logLine("action", `Access changed to ${accessLabel(a)}.`);
    return true;
  }

  placeNeedle(pose: NeedlePose): boolean {
    if (this.busy || this.sheath) return false;
    if (this.gated("placeNeedle", { pose })) return false;
    if (!this.timeOutDone && this.policy.timeOutRequired) {
      this.say("Stop. We have not done the time-out.", "safety", { stop: true });
      return false;
    }
    return this.pm.placeNeedle(pose);
  }

  advanceNeedle(mm: number): PunctureEvent[] {
    if (this.busy) return [];
    if (!this.timeOutDone && this.policy.timeOutRequired && this.pm.st.needle?.inserted === 0 && mm > 0) {
      this.say("Stop. We have not done the time-out.", "safety", { stop: true });
      return [];
    }
    this.pm.phase = this.patient.clockState().phase;
    this.syncRadialTone();
    const ev = this.pm.advanceNeedle(mm);
    for (const e of ev) this.onPuncture(e);
    if (!this.strokeInProgress) this.hubTipEvents();
    this.radialNeedleFeel();
    return ev;
  }

  redirectNeedle(angleDeg: number, yawDeg: number): PunctureEvent[] {
    const ev = this.pm.redirect(angleDeg, yawDeg);
    for (const e of ev) this.onPuncture(e);
    this.hubTipEvents();
    return ev;
  }

  flashback(): Flashback {
    this.pm.phase = this.patient.clockState().phase;
    this.syncRadialTone();
    return this.pm.flashback();
  }

  advanceAccessWire(mm: number): PunctureEvent[] {
    if (this.busy) return [];
    const p = this.pm.st;
    const needleIn = !!p.needle && p.needle.inserted > 0 && !p.needleRemoved;
    // the wire chosen for the needle (access-femoral-upsizing-angiogram): scored on its first feed of the pass
    if (mm > 0 && needleIn && !p.wire) this.wireIntoNeedle();
    // a hydrophilic wire pulled back through the needle: its jacket shears on the bevel (Brilakis 5.2)
    if (mm < 0 && needleIn && p.wire && this.activeSite.up.wireKind === "hydrophilic") this.jacketSheared();
    this.syncRadialTone();
    const ev = this.pm.advanceWire(mm);
    for (const e of ev) this.onPuncture(e);
    return ev;
  }

  removeNeedle(): boolean {
    const ok = this.pm.removeNeedle();
    if (ok) {
      needleOut(this.activeSite.up);
      this.logLine("action", "Needle removed over the wire.");
    } else this.say("Only remove the needle once the wire is running freely in the artery.", "technique");
    return ok;
  }

  abandonPass(): void {
    this.pm.abandonPass();
    this.pm.removeDilator();
    restartPass(this.activeSite.up);
    this.logLine("action", "Wire and needle withdrawn; pressure held over the site.");
    this.spend(60, "Holding pressure over the puncture");
  }

  private onPuncture(e: PunctureEvent): void {
    const pain = this.local.given && this.tS - this.local.at > MP_SESSION.localOnsetS ? 0.15 : 0.6;
    switch (e.kind) {
      case "skin-pass":
        this.passHadFlash = false;
        if (this.hookAt.puncture === undefined) this.firstPuncture();
        if (this.activeSite.firstPassAt === null) this.sitePuncture(this.activeSite);
        if (!this.timeOutDone) {
          this.critical("no-time-out", "Skin punctured before the time-out");
          this.say("We have punctured the skin without a time-out. Stop and do it now.", "safety", { stop: true, critical: true });
        }
        this.patient.stimulus("puncture", pain);
        if (pain > 0.3) {
          this.logLine("patient", "Ow, that is sharp.");
          if (!this.local.given) this.say("No local anaesthetic? The patient felt that. Pain and anxiety make spasm more likely.", "technique");
        }
        if (this.pm.st.passes > 1) this.logLine("event", `Skin pass ${this.pm.st.passes}.`);
        if (this.activeSite.siteKind === "radial") this.radialSkinPass(pain > 0.3);
        break;
      case "rolled":
        this.logLine("event", "The artery rolled away from the needle tip.");
        this.say("You hit the edge of the artery and it rolled. Centre the vessel under the probe and aim at its middle.", "technique");
        break;
      case "front-wall":
        this.patient.stimulus("puncture", pain * 0.6);
        if (this.activeSite.siteKind === "femoral-vein") {
          if (e.artery) this.say("Bright, pulsatile blood: that is the artery. The femoral vein lies medial to it.", "safety");
          else this.logLine("event", "Needle in the vein.");
          break;
        }
        if (e.artery && !e.target) {
          // a small accessory profunda branch over the femoral head (a scenario setting) arises above the bifurcation
          if (e.vessel === "accessory-profunda") {
            this.say("That is not the common femoral artery.", "safety");
            this.complication("branch-stick", "Puncture of a small femoral branch", "minor");
          } else {
            this.say("That is not the common femoral artery. You are below the bifurcation.", "safety");
            this.complication("low-stick", "Puncture below the femoral bifurcation", "minor");
          }
        }
        if (!e.artery) this.logLine("event", "Needle in a vein.");
        if (e.target && this.pm.st.arterialPunctures > 1) this.logLine("event", `Arterial puncture ${this.pm.st.arterialPunctures}.`);
        break;
      case "back-wall":
        // the deep wall lies below the infiltrated skin and subcutaneous tissue: it hurts
        this.patient.stimulus("puncture", Math.max(0.45, pain));
        this.logLine("patient", "Ow, that one is deep.");
        if (e.artery) this.logLine("event", "Through the back wall of the artery.");
        break;
      case "nerve":
        this.patient.stimulus("puncture", 0.9);
        this.logLine("patient", "Electric pain shooting down the leg.");
        this.say("That was the nerve. Redirect medially.", "safety");
        break;
      case "wire-free":
        if (e.venous) {
          this.logLine("event", this.activeSite.siteKind === "femoral-vein" ? "The wire ran freely into the vein." : "The wire ran freely.");
        } else {
          this.logLine("event", "The wire ran freely into the artery.");
          this.decideDeepEntry();
          this.fireHook("micro-wire");
        }
        break;
      case "wire-course":
        // where the wire runs is seen only on fluoroscopy (screenMicroWire): telemetry only
        this.emit("micro-wire-course", { course: e.course, site: this.activeSite.id });
        break;
      case "deflected":
        this.patient.stimulus("puncture", pain * 0.5);
        this.logLine("event", "The needle grates on something hard and slides off the wall.");
        this.say("The needle will not go through there. Look at that stretch of wall on ultrasound and choose another.", "technique");
        break;
      case "wire-resistance":
        this.raiseTip("wire-resistance");
        if (e.reason === "no-lumen" || e.reason === "plugged") this.raiseTip("no-flashback");
        this.say(
          e.reason === "partial-bevel"
            ? "Resistance. The bevel is only partly in the lumen. Do not push; adjust until the flashback is brisk and pulsatile."
            : e.reason === "steep"
            ? "The needle is too steep; the wire is hitting the back wall. Flatten the needle a little."
            : e.reason === "no-lumen"
            ? "No flashback, no wire. The needle is not in the artery."
            : e.reason === "plugged"
            ? "No blood at the hub and the wire will not pass. Do not push it."
            : e.reason === "branch"
            ? "Resistance. Do not push: screen the wire and see where it is going."
            : e.reason === "bevel-side" || e.reason === "wrist-flexed"
            ? "Good blood, but the wire stops at the needle tip. Do not push it."
            : "Resistance. Withdraw the needle slowly until pulsatile flow returns.",
          "technique",
        );
        break;
      case "wire-subintimal":
        this.patient.stimulus("puncture", 0.8);
        this.complication("subintimal", "Subintimal wire at the puncture site", "minor");
        this.say("Stop. The wire has gone into the wall. Take it out, hold pressure, and puncture again.", "safety", { stop: true });
        break;
      case "redirect-blocked":
        this.say("Withdraw to just under the skin before you change direction.", "technique");
        break;
      case "tenting":
        break;
    }
  }

  /** The first skin puncture: the decisions made before it are scored now. */
  private firstPuncture(): void {
    const radial = this.access !== "femoral";
    this.decide({
      id: "time-out-before-puncture",
      stage: "access",
      label: "Team time-out before the first skin puncture",
      correct: this.timeOutDone,
      expected: "Time-out completed before the skin was punctured",
      given: this.timeOutDone ? "Time-out completed first" : "Skin punctured before the time-out",
      lessonId: "pm-monitoring-checklist",
      tipIds: ["pci-mon-time-out"],
    });
    const local = this.local.given;
    const settled = local && this.tS - this.local.at > MP_SESSION.localOnsetS;
    this.decide({
      id: "local-anaesthetic",
      stage: "access",
      label: "Local anaesthetic before the puncture",
      correct: settled,
      expected: "Local anaesthetic given and allowed to work before the needle goes in",
      given: !local ? "No local anaesthetic" : settled ? "Given and allowed to work" : "Given, but the needle went in before it had worked",
      lessonId: radial ? "pm-access-radial-puncture" : "cm-patient-complications-vasovagal",
      tipIds: radial ? ["access-radial-one-ml-local"] : ["access-vagal-prevention"],
    });
    if (this.profile.anticoagulation !== "none")
      this.decide({
        id: "anticoagulated-route",
        stage: "access",
        label: "Access route for a patient on an oral anticoagulant",
        correct: radial,
        expected: "Radial access",
        given: accessLabel(this.access)[0].toUpperCase() + accessLabel(this.access).slice(1),
        lessonId: "pm-antithrombotics-oac",
        tipIds: ["access-anticoagulated-go-radial", "access-planning-anticoagulated"],
      });
    this.fireHook("puncture");
  }

  /**
   * The first skin pass at a site: an added common femoral artery site in a patient on heparin or an
   * oral anticoagulant (a crossover) is scored on its imaging guidance: the artery seen on ultrasound
   * and the groin screened on fluoroscopy before the needle went in, both, as the tip
   * access-crossover-anticoagulated-care asks (Brilakis 4.1; Oxford ch 3, 'Anticoagulation issues';
   * pm-antithrombotics-oac). Either one alone is recorded as such and is not as expected.
   */
  private sitePuncture(st: AccessSiteState): void {
    st.firstPassAt = round(this.tS, 10);
    if (st.siteKind === "femoral") this.decideHeadMarked(st);
    if (st.siteKind === "radial") this.radialFirstPass(st);
    if (st.origin !== "added" || st.siteKind !== "femoral") return;
    if (this.heparinU <= 0 && this.profile.anticoagulation === "none") return;
    const us = st.usImagedAt !== null;
    const fl = st.fluoroAt !== null;
    const earlier = this.sites.filter((x) => x !== st && x.origin === "added" && x.siteKind === "femoral" && x.firstPassAt !== null).length;
    this.decide({
      id: earlier ? `crossover-puncture-guided-${st.id}` : "crossover-puncture-guided",
      stage: "access",
      label: "Femoral crossover in an anticoagulated patient under imaging guidance",
      correct: us && fl,
      expected: "The artery seen on ultrasound, and the groin screened on fluoroscopy, before the needle goes in",
      given: us && fl ? "Ultrasound of the artery and fluoroscopy of the groin before the puncture" : us ? "Ultrasound of the artery before the puncture; the groin not screened on fluoroscopy" : fl ? "Fluoroscopy of the groin before the puncture; no ultrasound image of the artery" : "Punctured without ultrasound or fluoroscopy",
      lessonId: "pm-antithrombotics-oac",
      tipIds: ["access-crossover-anticoagulated-care"],
    });
  }

  /** A femoral decision's id: the plain id at the planned site, suffixed with the site at an added one. */
  private femoralDecisionId(base: string, st: AccessSiteState): string {
    return st.origin === "planned" ? base : `${base}-${st.id}`;
  }

  /**
   * The first skin pass at a femoral artery site: was the inferior border of the femoral head marked on
   * fluoroscopy first (Brilakis 4.2, step 3; within MP_FEMORAL_PUNCTURE.markToleranceMm)?
   */
  private decideHeadMarked(st: AccessSiteState): void {
    const edge = st.site.landmarks.headFrom;
    if (edge === undefined) return;
    const mx = st.markX;
    const d = mx === null ? null : mx - edge;
    const seen = mx !== null && st.markSeen;
    const ok = d !== null && seen && Math.abs(d) <= MP_FEMORAL_PUNCTURE.markToleranceMm;
    this.decide({
      id: this.femoralDecisionId("femoral-head-marked", st),
      stage: "access",
      label: "Lower edge of the femoral head marked on fluoroscopy before the puncture",
      correct: ok,
      expected: "A metal marker moved on AP fluoroscopy until its tip lies on the lower edge of the femoral head, and the skin marked there",
      given:
        d === null
          ? "The skin was not marked"
          : !seen
            ? "Marked without an AP image of the marker"
            : ok
              ? "Marked on the lower edge of the femoral head"
              : `Marked ${Math.round(Math.abs(d))} mm ${d > 0 ? "above" : "below"} the lower edge of the femoral head`,
      lessonId: "pm-access-femoral-puncture",
      tipIds: ["access-femoral-head-marker"],
    });
  }

  /**
   * The wire runs free in the target artery of a deep femoral site (near wall at least
   * MP_FEMORAL_PUNCTURE.deepNearWallMm at the crease): Brilakis 4.2, step 6, keeps about 45 degrees and
   * moves the skin entry down the leg, or steepens to about 70 degrees as the second option; either way the
   * artery must be entered over the femoral head.
   */
  private decideDeepEntry(): void {
    const st = this.activeSite;
    const n = this.pm.st.needle;
    const ax = this.pm.st.arteriotomy;
    if (st.siteKind !== "femoral" || !n || !ax || ax.vessel !== st.site.arteryId || !st.target) return;
    const nearWall = tubeAt(st.target, 0).z - st.target.r;
    if (nearWall < MP_FEMORAL_PUNCTURE.deepNearWallMm) return;
    const h = entryVsHead(st.site, ax.x);
    const over = h === "lower-half" || h === "upper-half";
    const [a0, a1] = MP_FEMORAL_PUNCTURE.about45Deg;
    const [s0, s1] = MP_FEMORAL_PUNCTURE.steepDeg;
    const about45 = n.angleDeg >= a0 && n.angleDeg <= a1;
    const steep = n.angleDeg >= s0 && n.angleDeg <= s1;
    this.decideOnce({
      id: this.femoralDecisionId("femoral-deep-entry", st),
      stage: "access",
      label: "Needle angle and skin entry for a deep common femoral artery",
      correct: over && (about45 || steep),
      expected: "About 45 degrees with the skin entry moved down the leg (or steeper, about 70 degrees, as the second option), entering the artery over the femoral head",
      given: `${Math.round(n.angleDeg)} degree needle, skin entry ${Math.round(n.entryX)} mm from the crease; the artery entered ${over ? `over the ${h === "lower-half" ? "lower" : "upper"} half of` : h === "below" ? "below" : "above"} the femoral head`,
      lessonId: "pm-access-femoral-puncture",
      tipIds: ["access-femoral-deep-move-caudal"],
    });
  }

  /**
   * The sheath goes into a femoral artery site: the entry over the femoral head, above the bifurcation and
   * below the ligament, within MP_FEMORAL_PUNCTURE.passes skin passes (lab request pm-access#1; Brilakis
   * 4.2, steps 6-8).
   */
  private decideFemoralEntry(st: AccessSiteState): void {
    const ax = st.pm.st.arteriotomy;
    if (!ax) return;
    const h = entryVsHead(st.site, ax.x);
    const over = h === "lower-half" || h === "upper-half";
    const cls = st.pm.arteriotomyClass();
    const passes = st.pm.st.passes;
    const inPasses = passes <= MP_FEMORAL_PUNCTURE.passes;
    const half = `over the ${h === "lower-half" ? "lower" : "upper"} half of the femoral head`;
    const where = !over ? (h === "below" ? "below the femoral head" : "above the femoral head") : cls === "low" ? `${half}, below the bifurcation` : cls === "high" ? `${half}, above the inguinal ligament` : `${half}, above the bifurcation`;
    this.decide({
      id: this.femoralDecisionId("femoral-entry", st),
      stage: "access",
      label: "Common femoral artery entered over the femoral head and above the bifurcation",
      correct: over && cls === "ok" && inPasses,
      expected: `Arterial entry over the femoral head (its lower half unless a high bifurcation leaves only the upper half), above the bifurcation and below the inguinal ligament, within ${MP_FEMORAL_PUNCTURE.passes} skin passes; a wrong-height entry taken out and punctured again`,
      given: `Sheath in ${where}, after ${passes} skin pass${passes === 1 ? "" : "es"}`,
      lessonId: "pm-access-femoral-puncture",
      tipIds: ["access-femoral-scan-bifurcation", "access-femoral-repuncture-wrong-height"],
    });
  }

  /**
   * A dilator or sheath over a micro-wire in a branch or down the leg: the attending stops it (Brilakis 4.2,
   * step 7). Returns true when it stopped the step.
   */
  private stopOverMisplacedWire(): boolean {
    if (!(this.activeSite.siteKind === "femoral" && this.pm.st.needleRemoved && this.pm.wireMisdirected())) return false;
    this.critical("sheath-over-misplaced-wire", "Sheath advanced over a misplaced micropuncture wire");
    this.say(
      this.activeSite.misdirectedSeen
        ? "Stop. That wire is not where it should be: pull it back and redirect it before anything goes over it."
        : "Stop. Nothing goes over that wire until you have seen where it runs.",
      "safety",
      { stop: true, critical: true },
    );
    this.decide({
      id: this.femoralDecisionId("sheath-over-misplaced-wire", this.activeSite),
      stage: "access",
      label: "Nothing advanced over a misplaced micropuncture wire",
      correct: false,
      expected: "Screen the micropuncture wire; withdraw and redirect it under fluoroscopy before any dilator or sheath",
      given: "A dilator or sheath was advanced over a wire in a branch or running down the leg",
      lessonId: "pm-access-femoral-sheath",
      tipIds: ["access-femoral-screen-micro-wire", "access-wire-never-push"],
    });
    return true;
  }

  /**
   * Insert the sheath over the access wire: at a femoral site over the 0.035 inch wire after upsizing, or
   * straight over the 0.018 inch wire (scored); `lengthCm` 10, 25 or 45 (Brilakis 4.2, step 13).
   */
  insertSheath(id: SheathId, lengthCm: SheathLengthCm = 10): boolean {
    if (this.busy) return false;
    // (with the needle still in, the sheath cannot go on at all: the ordinary technique line below)
    if (this.stopOverMisplacedWire()) return false;
    const pst = this.pm.st;
    const st = this.activeSite;
    if (!pst.needleRemoved || !pst.wire || pst.wire.state !== "intraluminal" || pst.sheathFr) {
      this.say("The sheath goes over a wire that runs freely in the lumen, after the needle is out.", "technique");
      return false;
    }
    // the needle came out over the wire (whatever took it out): the upsizing is past the needle
    needleOut(st.up);
    if (st.up.stage === "micro-dilator" || st.up.stage === "outer-dilator" || st.up.stage === "outer-dilator-035") {
      this.say("Take the dilator off first: the sheath goes over the wire alone.", "technique");
      return false;
    }
    const r = upInsertSheath(st.up, lengthCm);
    if (!r.ok) {
      this.upsizeOutcome(r, "sheath");
      return false;
    }
    const ok = this.pm.insertSheath(SHEATHS[id].fr);
    if (!ok) {
      this.say("The sheath goes over a wire that runs freely in the lumen, after the needle is out.", "technique");
      return false;
    }
    const venous = this.site.tubes.find((t) => t.id === this.pm.st.arteriotomy?.vessel)?.kind === "vein";
    this.sheath = { id, insertedAt: this.tS, aspirated: false, flushed: false, venous, lengthCm, aspiratedForNext: false, clot: false, subintimal: st.up.subintimal, waveform: null };
    this.patient.stimulus("sheath", this.local.given ? 0.25 : 0.7);
    this.spend(MP_SESSION.sheathS, `Inserting the ${SHEATHS[id].label} sheath`);
    this.logLine("action", `${SHEATHS[id].label} sheath inserted${st.route === "femoral" ? ` (${lengthCm} cm)` : ""}.`);
    if (st.siteKind === "femoral" && !venous) this.decideUpsized(st);
    if (this.access !== "femoral") {
      const ratio = this.profile.radialDiamMm / SHEATHS[id].odMm;
      if (ratio < 1) this.say(`The radial artery is ${this.profile.radialDiamMm.toFixed(1)} mm and this sheath is ${SHEATHS[id].odMm} mm across. A sheath bigger than the artery raises the risk of occlusion.`, "technique");
      this.radialSheathIn(st);
    }
    if (this.activeSite.siteKind === "femoral" && !venous) this.decideFemoralEntry(this.activeSite);
    const cls = this.pm.arteriotomyClass();
    if (cls === "high" && this.activeSite.siteKind === "femoral") {
      this.complication("high-stick", "Femoral puncture above the inguinal ligament", "major");
      this.say("This puncture is high, above the inguinal ligament. Bleeding here can go into the retroperitoneum.", "safety");
    }
    this.emit("sheath", { id, venous, site: cls });
    this.fireHook("sheath-in");
    return true;
  }

  /** Aspirate and flush the sheath side arm (both steps at once, done right: aspirate and discard, then a second syringe). */
  flushSheath(): void {
    if (!this.sheath || this.busy) return;
    this.sheath.aspirated = true;
    this.sheath.aspiratedForNext = true;
    this.sheath.clot = false;
    this.sheath.flushed = true;
    this.decideSheathPrep(true, "fresh");
    this.spend(MP_SESSION.sheathFlushS, "Aspirating and flushing the sheath");
    this.sideArmBlood(true);
  }

  /**
   * What the side arm gives back on aspiration: dark venous blood, bright arterial blood, or little from a subintimal
   * sheath. `flushed` is true only for the one-step flushSheath(); aspirateSheath() alone has not flushed yet.
   */
  private sideArmBlood(flushed: boolean): void {
    if (!this.sheath) return;
    if (this.sheath.subintimal) {
      this.logLine("result", "Only a little blood comes back through the side arm, slowly.");
      return;
    }
    if (this.activeSite.siteKind === "femoral-vein") {
      if (this.sheath.venous) this.logLine("result", `Dark, non-pulsatile blood aspirated${flushed ? "; venous sheath flushed" : ""}.`);
      else {
        this.logLine("result", "Bright red pulsatile blood from the side arm.");
        this.say("That blood is bright red and pulses. This sheath is in the artery, not the vein.", "safety");
      }
    } else if (this.sheath.venous) {
      this.raiseTip("venous-flashback");
      this.logLine("result", "Dark, non-pulsatile blood from the side arm.");
      this.say("That blood is dark and does not pulse. The sheath is in a vein.", "safety");
    } else this.logLine("result", `Bright red pulsatile blood aspirated${flushed ? "; sheath flushed" : ""}.`);
  }

  /** Take a venous or misplaced sheath out and hold pressure; the site can be punctured again. */
  removeSheathAndCompress(): void {
    if (!this.sheath) return;
    const st = this.activeSite;
    const wasVenous = this.sheath.venous;
    const wasSubintimal = !!this.sheath.subintimal;
    sheathRemoved(st.up);
    this.pm.removeDilator();
    // at a femoral vein site, a sheath in the vein coming out under pressure is the closure; a sheath
    // that went into the artery there is a misplaced sheath, removed like one at any other site
    const planned = st.siteKind === "femoral-vein" && wasVenous;
    const arterialAtVein = st.siteKind === "femoral-vein" && !wasVenous;
    // artery and vein in the same groin: the arterial sheath out first, the venous a few minutes later (Brilakis, pm-closure-femoral-compression)
    if (planned) {
      const artery = this.sites.find((x) => x.siteKind === "femoral" && x.side === st.side);
      if (artery && (artery.sheath || artery.closure.compression || artery.closure.femoral))
        this.decide({
          id: this.femoralDecisionId("femoral-artery-before-vein", st),
          stage: "closure",
          label: "Arterial sheath out before the venous sheath in the same groin",
          correct: !artery.sheath,
          expected: "The arterial sheath first, the venous sheath a few minutes later",
          given: artery.sheath ? "The venous sheath came out first" : "Arterial first",
          lessonId: "pm-closure-femoral-compression",
          tipIds: ["access-artery-vein-same-groin"],
        });
    }
    if (planned) {
      st.sheathHistory = this.sheath.id;
      st.closure.venousAt = round(this.tS, 10);
    }
    this.sheath = null;
    this.pm.removeSheath();
    this.pm.abandonPass();
    this.pm.st.sheathFr = null;
    this.wireInBody = false;
    this.wire = initialWire();
    this.spend(
      wasVenous ? 300 : 600,
      "Holding pressure after removing the sheath",
      planned
        ? () => {
            this.emit("closure", { delayed: [], site: st.id });
            this.onSiteClosed(st);
          }
        : undefined,
    );
    this.logLine("action", "Sheath removed; pressure held.");
    if (wasVenous && !planned) this.complication("venous-sheath", "Sheath placed in a vein and removed", "minor");
    // a subintimal sheath taken out: the site is changed or punctured again (Brilakis 5.2)
    if (wasSubintimal) this.decideSubintimalHandled(st, true);
    // MODEL PARAMETER: the arterial sheath at a venous site counts as a minor complication (the lab's own grading)
    if (arterialAtVein) this.complication("arterial-sheath-at-vein", "Sheath placed in the artery at a venous site and removed", "minor");
  }

  // -------------------------------------------------------------------------
  // upsizing, sheath preparation and the femoral angiogram (access-femoral-upsizing-angiogram)
  // -------------------------------------------------------------------------

  /** The active site's upsizing state (read-only use: the session's methods change it). */
  get upsizing(): UpsizingState {
    return this.activeSite.up;
  }

  /** The active site's femoral angiogram report, once submitted (for the closure), or null. */
  get femoralAngioReport(): FemoralAngioReport | null {
    return this.activeSite.femoralAngioReport;
  }

  /** A scenario's scripted resistances during upsizing at the active site (public, for scenario scripts). */
  scriptUpsizing(o: { resistance?: UpsizeResistance[] }): void {
    const up = this.activeSite.up;
    for (const k of o.resistance ?? []) if (!up.pending.includes(k)) up.pending.push(k);
    this.emit("script.upsizing", { resistance: [...(o.resistance ?? [])] });
  }

  /** A site decision id: the plain id at the planned site, suffixed with the site at an added one. */
  private upDecisionId(base: string): string {
    return this.femoralDecisionId(base, this.activeSite);
  }

  /**
   * Choose the wire for the access needle: the 0.018 inch micropuncture wire, or a polymer-jacketed hydrophilic
   * wire, which must not go through a needle (pm-to-the-root-table; Brilakis 5.2, Oxford ch 4). The attending
   * cautions when it is chosen with the needle in.
   */
  setAccessWire(kind: AccessWireKind): boolean {
    const st = this.activeSite;
    const r = chooseAccessWire(st.up, kind);
    if (!r.ok) {
      this.say(r.why ?? "Not now.", "technique");
      return false;
    }
    const p = this.pm.st;
    const needleIn = !!p.needle && p.needle.inserted > 0 && !p.needleRemoved;
    this.logLine("action", kind === "hydrophilic" ? "Hydrophilic wire on the table for the needle." : "0.018 inch micropuncture wire for the needle.");
    if (kind === "hydrophilic" && needleIn) this.say("Not through the needle: a polymer-jacketed wire can have its jacket sheared off when it is pulled back. Keep it for use through a sheath or catheter.", "safety");
    return true;
  }

  /** The first feed of a wire through the needle on this pass: the wire choice is scored. */
  private wireIntoNeedle(): void {
    const st = this.activeSite;
    wireThroughNeedle(st.up);
    const hydro = st.up.wireKind === "hydrophilic";
    this.decideOnce({
      id: this.upDecisionId("no-hydrophilic-through-needle"),
      stage: "access",
      label: "No hydrophilic wire through the access needle",
      correct: !hydro,
      expected: "The micropuncture (or standard) wire through the needle; a polymer-jacketed wire only through a sheath or catheter",
      given: hydro ? "A hydrophilic wire was passed through the needle" : "The micropuncture wire through the needle",
      lessonId: "pm-to-the-root-table",
      tipIds: ["access-root-no-hydrophilic-through-needle", "access-wire-never-push"],
    });
  }

  /** A hydrophilic wire pulled back through the needle: the jacket shears on the bevel (once per case). */
  private jacketSheared(): void {
    if (this.complications.some((c) => c.id === "wire-jacket-sheared")) return;
    this.complication("wire-jacket-sheared", "Polymer jacket sheared from a hydrophilic wire pulled back through the needle", "minor");
    this.logLine("event", "The wire drags at the needle bevel as it comes back.");
    this.say("Stop pulling. A hydrophilic wire pulled back through a needle can lose its jacket: take the needle and the wire out together.", "safety");
  }

  /** What an upsizing step that was refused or stopped tells the operator, and what it scores. */
  private upsizeOutcome(r: UpsizeResult, what: "dilator" | "sheath"): void {
    if (r.event) this.raiseTip(r.event);
    if (r.wireFelt && r.event !== "wire-resistance") this.raiseTip("wire-resistance");
    if (r.log) this.logLine("event", r.log);
    if (r.met) this.say(`Stop. Do not push the ${what}: work out why it will not go.`, "technique");
    if (r.forced) {
      this.say(`Do not force the ${what}. Fix the cause first.`, "safety");
      this.decideOnce({
        id: this.upDecisionId("upsizing-not-forced"),
        stage: "access",
        label: "Resistance during upsizing met with a fix, not force",
        correct: false,
        expected: "Stop at the first resistance, screen, and apply the matching fix: nick and spread the track, a stiffer dilator, pull back or cut a kinked wire, exchange to a stiffer wire",
        given: `The ${what} was pushed again against the same resistance without a fix`,
        lessonId: "pm-access-troubleshoot",
        tipIds: ["access-dilator-will-not-pass", "access-wire-never-push"],
      });
    }
    if (!r.event && !r.met && !r.forced && r.why) this.say(r.why, "technique");
  }

  /** A successful upsizing step: logged, timed, and the resistance it fixed recorded. */
  private upsizeDone(r: UpsizeResult, s: number, label: string): boolean {
    if (!r.ok) {
      this.upsizeOutcome(r, "dilator");
      return false;
    }
    if (r.log) this.logLine("action", r.log);
    if (r.resolved) this.emit("upsizing.fixed", { kind: r.resolved });
    this.spend(s, label);
    return true;
  }

  /** Nick the skin: over the needle or a dilator at the groin, where the wire enters at the wrist; refused with a sheath in. */
  skinNick(): boolean {
    if (this.busy) return false;
    const st = this.activeSite;
    const p = this.pm.st;
    const needleIn = !!p.needle && p.needle.inserted > 0 && !p.needleRemoved;
    if (!needleIn && !p.wire && !st.sheath) {
      this.say("Nick the skin over the needle once it is in the artery, or over the dilator.", "technique");
      return false;
    }
    const r = upSkinNick(st.up, { femoral: st.route === "femoral", needleIn, sheathIn: !!st.sheath });
    if (!r.ok && st.sheath) {
      this.say(r.why ?? "Not with a sheath in.", "safety", { stop: true });
      this.decide({
        id: this.upDecisionId("skin-nick-safe"),
        stage: "access",
        label: "Skin nick made over the needle or a dilator, never over a sheath",
        correct: false,
        expected: "Nick over the needle, or after the micropuncture dilator is in; never with a sheath in place",
        given: "A nick was attempted with the sheath in",
        lessonId: "pm-access-femoral-sheath",
        tipIds: ["access-dilator-will-not-pass"],
      });
      return false;
    }
    if (!r.ok) {
      this.say(r.why ?? "Not now.", "technique");
      return false;
    }
    if (!this.ledger.get(this.upDecisionId("skin-nick-safe")))
      this.decide({
        id: this.upDecisionId("skin-nick-safe"),
        stage: "access",
        label: "Skin nick made over the needle or a dilator, never over a sheath",
        correct: true,
        expected: "Nick over the needle, or after the micropuncture dilator is in; never with a sheath in place",
        given: `Nicked over the ${st.up.nick.over ?? "needle"}`,
        lessonId: "pm-access-femoral-sheath",
      });
    return this.upsizeDone(r, MP_UPSIZING.nickS, "Skin nick");
  }

  /** Spread the track with a haemostat along the nick. */
  spreadTrack(): boolean {
    if (this.busy) return false;
    return this.upsizeDone(upSpreadTrack(this.activeSite.up), MP_UPSIZING.spreadS, "Spreading the track");
  }

  /** Advance the micropuncture dilator over the 0.018 inch wire (a femoral site, needle out). */
  insertMicroDilator(): boolean {
    if (this.busy) return false;
    const st = this.activeSite;
    if (st.route !== "femoral") {
      this.say("At the wrist the sheath goes straight over the wire.", "technique");
      return false;
    }
    const p = this.pm.st;
    if (!p.needleRemoved || !p.wire || p.wire.state !== "intraluminal") {
      this.say(p.needleRemoved ? "The dilator goes over a wire that runs freely in the artery." : "Take the needle out over the wire first.", "technique");
      return false;
    }
    if (this.stopOverMisplacedWire()) return false;
    needleOut(st.up);
    const r = upInsertMicroDilator(st.up);
    if (!r.ok) {
      this.upsizeOutcome(r, "dilator");
      return false;
    }
    // MODEL drawing size of the micropuncture dilator (French), not a device dimension the lab scores
    this.pm.insertDilator(4);
    return this.upsizeDone(r, MP_UPSIZING.dilatorS, "Micropuncture dilator over the wire");
  }

  /** Use a stiffer micropuncture dilator. */
  useStiffDilator(): boolean {
    if (this.busy) return false;
    return this.upsizeDone(upUseStiffDilator(this.activeSite.up), MP_UPSIZING.fixS, "A stiffer dilator");
  }

  /** A kinked 0.018 inch wire: pull it back a little, or cut off the kinked part. */
  fixKinkedWire(how: "pull-back-wire" | "cut-kink"): boolean {
    if (this.busy) return false;
    return this.upsizeDone(upFixKinkedWire(this.activeSite.up, how), MP_UPSIZING.fixS, how === "cut-kink" ? "Cutting off the kinked wire" : "Pulling the wire back");
  }

  /** Take the inner dilator and the 0.018 inch wire out, leaving the outer dilator in the artery. */
  removeInnerDilator(): boolean {
    if (this.busy) return false;
    return this.upsizeDone(upRemoveInnerDilator(this.activeSite.up), MP_UPSIZING.innerOutS, "Inner dilator and wire out");
  }

  /** Pass a 0.035 inch wire (standard or stiff) through the outer dilator to the abdominal aorta. */
  insertWire035(kind: Wire035Kind = "standard"): boolean {
    if (this.busy) return false;
    const ok = this.upsizeDone(upInsertWire035(this.activeSite.up, kind), MP_UPSIZING.wire035S, "0.035 inch wire to the aorta");
    if (ok) this.pm.exchangeWire(MP_UPSIZING.wire035Mm);
    return ok;
  }

  /** Take the outer dilator off the 0.035 inch wire. */
  removeDilator(): boolean {
    if (this.busy) return false;
    const ok = this.upsizeDone(upRemoveDilator(this.activeSite.up), MP_UPSIZING.dilatorOutS, "Dilator out");
    if (ok) this.pm.removeDilator();
    return ok;
  }

  /** Sheath back out, and the 0.035 inch wire exchanged through a dilator for a stiff one. */
  exchangeToStiffWire(): boolean {
    if (this.busy) return false;
    return this.upsizeDone(upExchangeToStiffWire(this.activeSite.up), MP_UPSIZING.exchangeS, "Exchanging for a stiff wire");
  }

  /** Put a 0.035 inch wire through the sheath into the aorta (before the femoral angiogram, when none is in). */
  wireThroughSheath(): boolean {
    const st = this.activeSite;
    if (this.busy || !st.sheath || this.catheter?.inBody || st.up.wireLeftIn) return false;
    st.up.wireLeftIn = true;
    this.logLine("action", "0.035 inch wire through the sheath into the aorta.");
    this.spend(MP_UPSIZING.wire035S, "Wire through the sheath");
    return true;
  }

  /** Is the upsizing done the sourced way (scored when the sheath goes into a femoral artery)? */
  private decideUpsized(st: AccessSiteState): void {
    this.decideOnce({
      id: this.femoralDecisionId("upsized-to-035", st),
      stage: "access",
      label: "Upsized through the micropuncture dilator to a 0.035 inch wire before the sheath",
      correct: st.up.viaWire035,
      expected: "Micropuncture dilator over the 0.018 inch wire, inner dilator and wire out, a 0.035 inch wire to the aorta, then the sheath over it",
      given: st.up.viaWire035 ? "Upsized to a 0.035 inch wire first" : "The sheath went straight over the 0.018 inch wire",
      lessonId: "pm-access-femoral-sheath",
      tipIds: ["access-femoral-screen-micro-wire"],
    });
  }

  /** Aspirate 3-4 mL from the sheath side arm and discard it (Brilakis 4.2, step 14). */
  aspirateSheath(): boolean {
    const sh = this.sheath;
    if (!sh || this.busy) return false;
    sh.aspirated = true;
    sh.aspiratedForNext = true;
    sh.clot = false;
    this.spend(MP_UPSIZING.aspirateS, "Aspirating the side arm");
    this.logLine("action", `${SOURCED_UPSIZING.aspirateMl[0]}-${SOURCED_UPSIZING.aspirateMl[1]} mL drawn from the side arm and discarded.`);
    this.sideArmBlood(false);
    return true;
  }

  /**
   * Flush the sheath side arm with heparinised saline, from a second, clean syringe (`fresh`) or from the syringe
   * just aspirated into (`same`). Flushing before aspirating is scored wrong and leaves the sheath's thrombus in it.
   */
  flushSheathSide(syringe: "fresh" | "same" = "fresh"): boolean {
    const sh = this.sheath;
    if (!sh || this.busy) return false;
    const aspirated = !!(sh.aspiratedForNext ?? sh.aspirated);
    if (!aspirated) {
      sh.clot = true;
      this.say("Aspirate first: whatever is in the sheath goes into the artery with that flush, and clot stays behind.", "technique");
    } else if (syringe === "same") this.say("Not with the syringe you aspirated into: what you drew back goes straight into the artery.", "technique");
    sh.flushed = true;
    this.decideSheathPrep(aspirated, syringe);
    this.spend(MP_UPSIZING.flushS, "Flushing the side arm");
    this.logLine("action", `Side arm flushed with heparinised saline${syringe === "same" ? " from the aspiration syringe" : " from a second syringe"}.`);
    return true;
  }

  /** The sheath preparation's decision: aspirate and discard first, then flush with a second syringe (scored once wrong, stays wrong). */
  private decideSheathPrep(aspirated: boolean, syringe: "fresh" | "same"): void {
    const ok = aspirated && syringe === "fresh";
    this.decideOnce({
      id: this.upDecisionId("sheath-aspirate-then-flush"),
      stage: "access",
      label: "Sheath aspirated and discarded, then flushed with a second syringe",
      correct: ok,
      expected: `Draw ${SOURCED_UPSIZING.aspirateMl[0]}-${SOURCED_UPSIZING.aspirateMl[1]} mL from the side arm and discard it, then flush with a separate syringe of heparinised saline`,
      given: !aspirated ? "Flushed before aspirating" : syringe === "same" ? "Flushed with the syringe used to aspirate" : "Aspirated, then flushed with a second syringe",
      lessonId: "pm-to-the-root-table",
      tipIds: ["access-sheath-two-syringes", "access-root-sheath-aspirate-flush"],
    });
  }

  /**
   * Transduce the sheath side arm on the manifold: an arterial waveform, a low venous trace, or a damped,
   * flat trace from a subintimal sheath (raised as pressure-damped; Brilakis 5.2).
   */
  transduceSheath(): { trace: "arterial" | "damped" | "venous"; displayed: string } | null {
    const sh = this.sheath;
    if (!sh || this.busy) return null;
    const v = this.patient.vitals();
    const trace: "arterial" | "damped" | "venous" = sh.subintimal ? "damped" : sh.venous ? "venous" : "arterial";
    sh.waveform = trace;
    this.spend(MP_UPSIZING.transduceS, "Transducing the side arm");
    // The transducer shows numbers; the reading of them ('damped, no arterial waveform') is a guided aid only.
    const [fs, fd] = MP_UPSIZING.dampedReadingOfDia;
    const reading =
      trace === "arterial"
        ? `${Math.round(v.aortaTrue.sys)}/${Math.round(v.aortaTrue.dia)} mmHg`
        : trace === "damped"
          ? `${Math.round(v.aortaTrue.dia * fs)}/${Math.round(v.aortaTrue.dia * fd)} mmHg`
          : "low, without arterial pulsation";
    const displayed = trace === "damped" && this.mode === "guided" ? `${reading} (damped, no arterial waveform)` : reading;
    sh.waveformText = displayed;
    if (trace === "damped") this.raiseTip("pressure-damped");
    this.logLine("result", `Side-arm trace: ${displayed}.`);
    return { trace, displayed };
  }

  /** Contrast went through a subintimal sheath: a critical error (Brilakis 5.2: change site rather than inject). */
  private injectedSubintimal(): void {
    this.critical("subintimal-injection", "Contrast injected through a subintimal sheath");
    this.say("Stop. Nothing goes through a sheath without an arterial waveform: you are injecting into the wall.", "safety", { stop: true, critical: true });
    this.decideSubintimalHandled(this.activeSite, false);
  }

  /** A subintimal sheath: changed rather than injected through (scored once wrong, stays wrong). */
  private decideSubintimalHandled(st: AccessSiteState, changed: boolean): void {
    this.decideOnce({
      id: this.femoralDecisionId("subintimal-sheath-not-injected", st),
      stage: "access",
      label: "A sheath without an arterial waveform taken out, not injected through",
      correct: changed,
      expected: "Transduce the side arm; with no arterial waveform take the sheath out and change site, without injecting through it",
      given: changed ? "Taken out without an injection" : "Contrast injected through it",
      lessonId: "pm-access-troubleshoot",
      tipIds: ["access-no-waveform-sheath", "access-root-femoral-no-waveform"],
    });
  }

  /** The femoral angiogram's technique, scored on the last angiogram at the site (Brilakis 4.2, step 15). */
  private fireAngioDecision(st: AccessSiteState): void {
    const a = st.femoralAngio;
    if (!a) return;
    const [m0, m1] = SOURCED_UPSIZING.angioMl;
    const [d0, d1] = SOURCED_UPSIZING.obliqueDeg;
    const ipsi = ipsilateralOblique(a.laoDeg, st.side);
    const volOk = a.ml >= m0 && a.ml <= m1;
    const wave = a.waveform === "arterial";
    const view = a.laoDeg === 0 ? "AP" : `${a.laoDeg > 0 ? "LAO" : "RAO"} ${Math.abs(Math.round(a.laoDeg))}`;
    const misses = [!ipsi && `view ${view}`, a.magnified && "magnified", !volOk && `${a.ml} mL`, !a.wireIn && "no wire in the aorta", !wave && (a.waveform ? `waveform ${a.waveform}, not arterial` : "waveform not checked")].filter(Boolean);
    this.decide({
      id: this.femoralDecisionId("femoral-angio-technique", st),
      stage: "fluoro",
      label: "Femoral angiogram: wire in, waveform checked, ipsilateral oblique, low magnification, 5-10 mL",
      correct: misses.length === 0,
      expected: `A wire through the sheath in the aorta and an undamped waveform first; ${st.side === "right" ? "RAO" : "LAO"} ${d0}-${d1} degrees, low magnification, about ${m0}-${m1} mL`,
      given: misses.length ? `Not as expected: ${misses.join(", ")}` : `${view}, low magnification, ${a.ml} mL, wire in, waveform checked`,
      lessonId: "pm-access-femoral-sheath",
      tipIds: ["access-femoral-sheath-angiogram", "access-sheath-two-syringes"],
    });
  }

  /**
   * The learner's structured report of the femoral angiogram at the active femoral artery site: graded against
   * the anatomy (femoralAngioTruth), recorded in the ledger and kept on the site for the closure. Null before an
   * angiogram has been taken there.
   */
  submitFemoralAngioReport(ans: FemoralAngioAnswer): FemoralAngioGrade | null {
    const st = this.activeSite;
    const ax = this.pm.st.arteriotomy;
    if (st.siteKind !== "femoral" || !st.femoralAngio || !ax) {
      this.say("Take the femoral angiogram first.", "technique");
      return null;
    }
    const truth = femoralAngioTruth(st.site, ax, this.pm.arteriotomyClass());
    const grade = gradeFemoralAngioReport(ans, truth);
    // scored once per angiogram: a report made again after the grade was shown, without a new angiogram, is
    // kept on the site for the closure but does not change the ledger
    const prev = st.femoralAngioReport;
    const scored = !!prev && prev.angioT === st.femoralAngio.t;
    st.femoralAngioReport = { t: round(this.tS, 10), angioT: st.femoralAngio.t, given: { ...ans }, truth, grade };
    if (!scored) {
      this.decide({
        id: this.femoralDecisionId("femoral-angio-report", st),
        stage: "fluoro",
        label: "Femoral angiogram read: puncture against the bifurcation and the inferior epigastric artery, size and disease",
        correct: grade.correct === grade.total,
        expected: grade.items.map((i) => `${i.label}: ${i.expected}`).join("; "),
        given: grade.items.map((i) => `${i.label}: ${i.given}`).join("; "),
        lessonId: "pm-access-femoral-sheath",
        tipIds: ["access-femoral-sheath-angiogram", "access-closure-device-criteria"],
      });
    }
    this.logLine("action", "Femoral angiogram reported.");
    this.emit("femoral-angio-report", { correct: grade.correct, total: grade.total });
    return grade;
  }

  // -------------------------------------------------------------------------
  // the radial sequence (access-radial-sequence)
  // -------------------------------------------------------------------------

  /** The active site's radial sequence state (meaningful at a radial site). */
  get radialSeq(): RadialAccessState {
    return this.activeSite.radialSeq;
  }

  /** The radial artery's tone at the active site now, 0..1 (truth: the live screens show only its signs). */
  radialTone(): number {
    return this.activeSite.siteKind === "radial" ? this.activeSite.radialSeq.spasm.level : 0;
  }

  /** What drives the active radial site's tone now, term by term (for the debrief). */
  radialSpasmTerms(): SpasmTerm[] {
    const st = this.activeSite;
    return st.siteKind === "radial" ? spasmDrive(this.radialSpasmFactors(st)).terms : [];
  }

  /** The effect of the local nitrates at a radial site now (0..1; MP_RADIAL_SEQUENCE.nitrateEffect, nitrateTauS). */
  nitrateEffect(st: AccessSiteState = this.activeSite): number {
    let e = 0;
    for (const d of st.radialSeq.nitrates) e = Math.max(e, MP_RADIAL_SEQUENCE.nitrateEffect * Math.exp(-Math.max(0, this.tS - d.t) / MP_RADIAL_SEQUENCE.nitrateTauS));
    return e;
  }

  /** The spasm model's inputs at a radial site now. */
  private radialSpasmFactors(st: AccessSiteState): RadialSpasmFactors {
    const p = this.profile;
    const working = st.local.given && this.tS - st.local.at > MP_SESSION.localOnsetS;
    const touched = st.pm.st.passes > 0 || !!st.sheath;
    return {
      radialDiamMm: p.radialDiamMm,
      ageY: p.ageY,
      female: p.sex === "F",
      smoker: !!p.risk?.smoker,
      anxiety: this.patient.vitals().symptoms.anxiety,
      pain: touched && !working ? 1 : 0,
      sheathOdMm: st.sheath ? SHEATHS[st.sheath.id].odMm : null,
      exchanges: st.radialSeq.exchanges,
      // the closure rescue (warmth, the cuff let down) acts as vasodilatation at the artery (access-closure-radial)
      vasodilator: st.sheath ? Math.min(1, this.vasodilatorEffect() + this.closureRelief(st)) : 0,
      nitrate: this.nitrateEffect(st),
      vasopressor: this.pressorOn.size > 0,
    };
  }

  /** Step the tone of every open radial site (from slowTick). */
  private stepRadialTone(h: number): void {
    this.radialToneAcc += h;
    if (this.radialToneAcc < MP_RADIAL_TONE_STEP_S) return;
    const dt = this.radialToneAcc;
    this.radialToneAcc = 0;
    for (const st of this.sites) {
      if (st.siteKind !== "radial" || this.siteClosed(st)) continue;
      stepRadialSpasm(st.radialSeq.spasm, this.radialSpasmFactors(st), dt);
      st.pm.spasm = st.radialSeq.spasm.level;
      st.pm.nowS = this.tS;
    }
  }

  /** The active site's puncture model reads the tone and the time now (before a needle or wire move). */
  private syncRadialTone(): void {
    const st = this.activeSite;
    st.pm.nowS = this.tS;
    if (st.siteKind === "radial") st.pm.spasm = st.radialSeq.spasm.level;
  }

  /** An intravenous vasopressor infusion started or stopped (the engine's events). */
  private notePressor(e: TelemetryEvent): void {
    if (e.kind !== "drug.infusion" && e.kind !== "drug.infusion-stopped") return;
    const d = String(e.data?.drug ?? "");
    if (ANTIPLATELET_INFUSIONS.has(d)) {
      if (e.kind === "drug.infusion" && Number(e.data?.rate ?? 1) > 0) this.antiplateletOn.add(d);
      else this.antiplateletOn.delete(d);
      return;
    }
    if (!PRESSOR_DRUGS.has(d)) return;
    if (e.kind === "drug.infusion" && Number(e.data?.rate ?? 1) > 0) this.pressorOn.add(d);
    else this.pressorOn.delete(d);
  }

  /**
   * Local anaesthetic at the wrist: `ml` infiltrated at the probe, aspirating first unless `aspirate` is false
   * (Brilakis: about 1 mL after aspirating; Oxford 1-2 mL; never into the artery). It can be topped up; above about
   * 1 mL the bleb flattens the artery for a minute or two (ultrasound.ts). Elsewhere it is the one-touch local.
   */
  giveLocal(ml: number, o: { aspirate?: boolean; byTeam?: boolean } = {}): boolean {
    if (this.busy || !(ml > 0)) return false;
    const st = this.activeSite;
    if (st.siteKind !== "radial") return !!this.order("local");
    if (st.sheath) {
      this.say("The sheath is in: the local anaesthetic was for the puncture.", "technique");
      return false;
    }
    const aspirate = o.aspirate ?? true;
    const v = round(ml, 10);
    if (!st.local.given) st.local = { given: true, at: this.tS };
    st.pm.infiltrate(v, this.tS);
    st.radialSeq.localGiven.push({ t: round(this.tS, 10), ml: v, aspirated: aspirate, ...(o.byTeam ? { byTeam: true } : {}) });
    const rec: OrderRecord = { id: "local", label: `Lidocaine 1% ${v} mL at the wrist${aspirate ? ", aspirated first" : ", without aspirating"}`, t: this.tS, dose: v, unit: "mL", route: "SC" };
    this.orders.push(rec);
    this.patient.stimulus("puncture", 0.15);
    this.spend(MP_SESSION.localS, "Local anaesthetic at the wrist");
    this.logLine("action", `Given: ${rec.label}.`);
    this.emit("order", { id: "local", dose: v, unit: "mL", route: "SC", aspirated: aspirate });
    return true;
  }

  /**
   * Position the arm at the active radial site before the puncture (pm-access-radial-puncture, step 2). The site is
   * rebuilt in the new position (the probe, the local anaesthetic and the blebs stay). A patient who cannot supinate
   * keeps the forearm neutral.
   */
  setArm(position: ArmPosition): boolean {
    const st = this.activeSite;
    const arm = st.site.arm;
    if (this.busy || st.siteKind !== "radial" || !arm) return false;
    if (arm.position === position) return true;
    if (arm.cannotSupinate && position !== "neutral") {
      this.logLine("patient", "I can't turn my hand over that far.");
      return false;
    }
    const needleIn = !!st.pm.st.needle && st.pm.st.needle.inserted > 0;
    if (st.pm.st.passes > 0 || st.sheath || needleIn) {
      this.say("Position the arm before the puncture.", "technique");
      return false;
    }
    const ov: SiteOverrides = { ...(st.origin === "planned" ? this.siteOverrides() ?? {} : {}), armPosition: position, wristFlexed: !arm.wristExtended };
    const site: AccessSite = { ...buildAccessSite(st.route, this.profile, ov), side: st.side };
    const pm = new PunctureModel(site, st.pm.st);
    pm.probe = st.pm.probe;
    st.site = site;
    st.pm = pm;
    st.target = site.tubes.find((t) => t.id === site.arteryId) ?? null;
    this.syncRadialTone();
    this.spend(MP_RADIAL_SEQUENCE.armS, "Positioning the arm");
    this.logLine("action", `Arm: ${ARM_LABEL[position].toLowerCase()}.`);
    this.emit("radial-arm", { position });
    return true;
  }

  /** Extend the wrist over a roll, or let it rest (radial; any time before the sheath). */
  setWristExtended(on: boolean): boolean {
    const st = this.activeSite;
    const arm = st.site.arm;
    if (st.siteKind !== "radial" || !arm || st.sheath) return false;
    if (arm.wristExtended === on) return true;
    arm.wristExtended = on;
    this.logLine("action", on ? "Wrist extended over a roll." : "Wrist let down from the roll.");
    this.emit("radial-wrist", { extended: on });
    return true;
  }

  /** Turn the needle's bevel towards the lumen (radial: a wire stopped at the tip by a side-wall entry then passes). */
  rotateBevel(): boolean {
    if (this.activeSite.siteKind !== "radial" || !this.pm.rotateBevel()) return false;
    this.logLine("action", "Needle bevel turned towards the lumen.");
    return true;
  }

  /**
   * A through-and-through puncture (pm-access-radial-puncture, step 5): the needle goes on through both walls in one
   * stroke, so the brief back-bleeding on the way is not seen at the hub; the flash comes back as the needle is
   * withdrawn slowly into the lumen, and the wire is advanced then. Radial sites only.
   */
  throughAndThrough(): PunctureEvent[] {
    const st = this.activeSite;
    const n = this.pm.st.needle;
    if (this.busy || st.siteKind !== "radial" || !n || this.pm.st.needleRemoved || this.pm.st.wire) return [];
    const tgt = st.site.arteryId;
    const out: PunctureEvent[] = [];
    this.strokeInProgress = true;
    try {
      for (let k = 0; k < 400 && !this.pm.st.walls[tgt]?.backHole && n.inserted < this.pm.maxLength; k++) {
        const ev = this.advanceNeedle(0.1);
        out.push(...ev);
        if (this.busy) break;
      }
      // the stroke carries the bevel clear of the back wall
      if (this.pm.st.walls[tgt]?.backHole) out.push(...this.advanceNeedle(MP_RADIAL_SEQUENCE.strokeBeyondMm));
    } finally {
      this.strokeInProgress = false;
    }
    this.passHadFlash = false;
    this.logLine("action", "Needle passed on through both walls in one movement.");
    return out;
  }

  /** Nitroglycerin for spasm before the sheath (Brilakis 4.3): its local effect on the radial tone only (no dose is given in the module text). */
  giveNitrate(route: NitrateRoute): boolean {
    const st = this.activeSite;
    if (this.busy || st.siteKind !== "radial") return false;
    st.radialSeq.nitrates.push({ t: round(this.tS, 10), route });
    const label = NITRATE_ROUTES.find((r) => r.id === route)?.label ?? "Nitroglycerin";
    this.spend(MP_RADIAL_SEQUENCE.nitrateS, label);
    this.logLine("action", `Given: ${label.toLowerCase()}.`);
    this.emit("radial-nitrate", { route });
    return true;
  }

  /** Secure the sheath (pm-access-radial-sheath, steps 9-10): before any catheter goes through it. */
  secureSheath(method: SheathSecure): boolean {
    if (this.busy || !this.sheath) return false;
    const rs = this.activeSite.radialSeq;
    rs.secured = method;
    rs.slipped = false;
    const label = SHEATH_SECURES.find((m) => m.id === method)?.label ?? "Secured";
    this.spend(MP_RADIAL_SEQUENCE.secureS, "Securing the sheath");
    this.logLine("action", `Sheath secured: ${label.toLowerCase()}.`);
    this.emit("sheath-secured", { method });
    return true;
  }

  /**
   * A scenario's scripted radial events (public, for scenario scripts): the outcome of the catheter-across seal, and a
   * start state's perforation marked as the team's (with the team's push against the forearm resistance forgotten).
   */
  scriptRadial(o: { sealOutcome?: "seal" | "fail"; perforationIsTeams?: boolean }): void {
    const rs = this.activeSite.radialSeq;
    if (o.sealOutcome) rs.sealScript = o.sealOutcome;
    if (o.perforationIsTeams) {
      if (rs.perforation) rs.perforation.team = true;
      rs.armResistanceAt = null;
      rs.pushedAgainstMm = 0;
    }
    this.emit("script.radial", { ...o });
  }

  /**
   * A forearm angiogram (pm-access-radial-sheath, step 6): contrast through a catheter brought up to just below the
   * wire tip, which shows tortuosity, a loop, spasm or extravasation. Without a catheter in the arm it is a puff
   * through the sheath. Returns what was recorded (the image is the fluoroscopy view's), or null.
   */
  forearmAngiogram(ml: number = MP_SESSION.puffMl): ForearmAngioRecord | null {
    const st = this.activeSite;
    if (this.busy || st.siteKind !== "radial" || !this.sheath) return null;
    const c = this.catheter;
    if (!c?.inBody || c.pos >= this.route.aortaStart) {
      if (!this.sheathPuff(ml)) return null;
      return st.radialSeq.angios[st.radialSeq.angios.length - 1] ?? null;
    }
    const [p0, p1] = MP_UPSIZING.puffClampMl;
    const v = round(Math.max(p0, Math.min(p1, ml)), 10);
    this.patient.contrast(v, "root");
    this.spend(MP_SESSION.puffS, "Contrast through the catheter");
    this.logLine("action", `${v} mL contrast through the catheter in the forearm.`);
    const rec = this.readForearmImage("catheter", v, c.pos, MP_RADIAL_SEQUENCE.angioAheadMm, MP_RADIAL_SEQUENCE.angioBackMm);
    if (!rec.belowTip) this.say("Bring the catheter up to just below the wire tip before you inject, so the picture shows what the wire is up against.", "technique");
    return rec;
  }

  /** What a forearm image shows (from a catheter at fromS, or the sheath): the cues it raises, recorded for the debrief. */
  private readForearmImage(via: "catheter" | "sheath", ml: number, fromS: number, aheadMm: number, backMm = 0): ForearmAngioRecord {
    const st = this.activeSite;
    const rs = st.radialSeq;
    const s0 = Math.max(0, fromS - backMm);
    const s1 = fromS + aheadMm;
    const loopSeg = this.route.segments.find((x) => x.id === "loop");
    const loop = !!loopSeg && loopSeg.start < s1 && loopSeg.end > s0;
    const tone = Math.max(rs.spasm.level, this.wireInBody ? this.wire.spasm : 0);
    const spasm = tone >= MP_TIPS.spasmLevel;
    const p = rs.perforation;
    const extravasation = !!p && !p.sealed && p.s >= s0 - 5 && p.s <= s1 + 5;
    const gap = this.wire.pos - fromS;
    const belowTip = via === "catheter" && this.wireInBody && gap >= 0 && gap <= MP_RADIAL_SEQUENCE.angioBelowTipMm;
    const rec: ForearmAngioRecord = { t: round(this.tS, 10), ml, via, fromS: round(fromS, 10), belowTip, shows: { loop, spasm, extravasation } };
    rs.angios.push(rec);
    if (loop) this.raiseTip("radial-loop");
    if (spasm) this.raiseTip("radial-spasm");
    if (extravasation) {
      this.raiseTip("perforation");
      this.raiseTip("bleeding");
    }
    if (rs.armResistanceAt !== null)
      this.decideOnce({
        id: this.femoralDecisionId("forearm-resistance-imaged", st),
        stage: "fluoro",
        label: "Resistance in the forearm imaged, not pushed",
        correct: true,
        expected: "Stop, screen the wire and image the artery through a catheter brought up to just below the wire tip",
        given: via === "catheter" ? "Imaged through a catheter in the forearm" : "Imaged with a puff through the sheath",
        lessonId: "pm-access-radial-sheath",
        tipIds: ["access-radial-wire-resists"],
      });
    this.emit("forearm-angio", { via, fromS: rec.fromS });
    return rec;
  }

  /**
   * Balloon-assisted tracking (tip access-cx-radial-loop-bat, Brilakis 29.2 and 5.3): a small compliant balloon half
   * out of the catheter tip, inflated at `atm`, so the catheter edge cannot cut the wall. Needs the catheter in the
   * arm close behind the wire tip.
   */
  startBat(atm: number): boolean {
    const st = this.activeSite;
    const c = this.catheter;
    if (this.busy || st.siteKind !== "radial" || !c?.inBody || !this.wireInBody || this.ex.wireOut || c.pos >= this.route.aortaStart) {
      this.say("Balloon-assisted tracking needs the catheter in the arm over a wire.", "technique");
      return false;
    }
    if (this.wire.pos - c.pos > MP_RADIAL_SEQUENCE.batTipMm) {
      this.say("Bring the catheter up to the wire tip first.", "technique");
      return false;
    }
    const a = round(Math.max(1, Math.min(20, atm)), 10);
    st.radialSeq.bat = { atm: a, at: round(this.tS, 10) };
    st.radialSeq.batAtm = a;
    this.spend(MP_RADIAL_SEQUENCE.batSetupS, "Balloon half out of the catheter tip");
    this.logLine("action", `Small compliant balloon half out of the catheter tip, inflated to ${a} atm.`);
    this.emit("bat", { atm: a });
    return true;
  }

  /** Advance the catheter and the inflated balloon together (mm), the wire inside; ends past the loop. */
  advanceBat(mm: number): WireEvent[] {
    const st = this.activeSite;
    const rs = st.radialSeq;
    const c = this.catheter;
    if (!rs.bat || !c?.inBody || !this.wireInBody || this.busy) return [];
    const before = this.wire;
    const r = stepWire(this.wire, this.route, { advance: mm, torque: 0, breath: this.breath, hydrophilic: this.wireKind === "hydrophilic", rand: this.rng.next(), bat: true, ...this.spasmInputs() }, 0.033);
    const { events, ...w } = r;
    this.wire = w;
    for (const e of events) this.onWire(e);
    // the catheter tip runs just behind the balloon
    c.pos = Math.max(c.pos, Math.min(this.wire.pos - MP_RADIAL_SEQUENCE.batLeadMm, this.route.aortaStart));
    this.radialWireMove(before, mm);
    const loop = this.route.segments.find((x) => x.id === "loop");
    if (!loop || c.pos > loop.end + MP_RADIAL_SEQUENCE.batPastMm) this.stopBat();
    return events;
  }

  /** Deflate the balloon and take it out (the catheter stays where it is). */
  stopBat(): void {
    const rs = this.activeSite.radialSeq;
    if (!rs.bat) return;
    rs.bat = null;
    this.logLine("action", "Balloon deflated and taken out.");
  }

  /**
   * Cover a forearm perforation over the wire (tip access-cx-radial-perforation-cover): the catheter brought across the
   * hole and held there seals most (MP_RADIAL_SEQUENCE.sealCatheterP, or the scenario's script); a long balloon
   * inflated at low pressure across it for a prolonged time seals it. Whether it held is seen on the next image.
   */
  sealPerforation(method: "catheter" | "balloon"): boolean {
    const st = this.activeSite;
    const rs = st.radialSeq;
    const c = this.catheter;
    if (this.busy || st.siteKind !== "radial" || !c?.inBody || !this.wireInBody || this.ex.wireOut) {
      this.say("That needs the catheter in the arm over a wire.", "technique");
      return false;
    }
    const p = rs.perforation;
    const at = p ? p.s : c.pos;
    if (this.wire.pos < at + MP_RADIAL_SEQUENCE.wireAcrossMm) {
      this.say("Get the wire well across that segment first.", "technique");
      return false;
    }
    c.pos = Math.max(c.pos, Math.min(at + 5, this.wire.pos - 5));
    if (method === "catheter") {
      this.spend(MP_RADIAL_SEQUENCE.sealCatheterS, "Catheter held across the segment");
      this.logLine("action", "Catheter advanced over the wire across the segment and held there.");
    } else {
      this.spend(MP_RADIAL_SEQUENCE.sealBalloonS, "Long balloon at low pressure across the segment");
      this.logLine("action", "Long balloon inflated at low pressure across the segment for a prolonged time.");
    }
    if (p && !p.sealed) {
      p.attempts++;
      const ok = method === "balloon" ? true : rs.sealScript ? rs.sealScript === "seal" : this.rng.next() < MP_RADIAL_SEQUENCE.sealCatheterP;
      if (ok) {
        p.sealed = true;
        p.sealedAt = round(this.tS, 10);
        p.method = method;
        this.tipEvents.clear("perforation");
        this.tipEvents.clear("bleeding");
        this.decidePerforationSealed(st, true);
      }
    }
    this.emit("radial-seal", { method });
    return true;
  }

  /** A forearm perforation's decision: sealed over the wire, with the wire kept across (scored once wrong, stays wrong). */
  private decidePerforationSealed(st: AccessSiteState, sealed: boolean): void {
    const p = st.radialSeq.perforation;
    if (!p) return;
    this.decideOnce({
      id: this.femoralDecisionId("radial-perforation-sealed", st),
      stage: "fluoro",
      label: "Forearm perforation covered with the wire kept across it",
      correct: sealed && !p.wireLost,
      expected: "Keep the wire across the damaged segment and advance a catheter through it; failing that, a long balloon at low pressure across the hole",
      given: !sealed ? "Not sealed before the closure" : `Sealed by the ${p.method === "balloon" ? "long balloon" : "catheter across it"}${p.wireLost ? ", after the wire had been pulled back below the hole" : ""}`,
      lessonId: "cm-access-complications-radial-bleeding",
      tipIds: ["access-cx-radial-perforation-cover"],
    });
  }

  /** A forced wire perforated a forearm artery at a radial site: where, for the image and the seal. */
  private radialPerforated(): void {
    const st = this.activeSite;
    if (st.siteKind !== "radial") return;
    const rs = st.radialSeq;
    if (!rs.perforation) rs.perforation = { s: round(this.wire.perforationS ?? this.wire.pos, 10), at: round(this.tS, 10), sealed: false, sealedAt: null, method: null, wireLost: false, attempts: 0 };
    if (rs.tightLoop && rs.loopCrossed === null) this.decideLoopCrossed(st, false);
  }

  /** An unsealed forearm perforation at any radial site (or one from before this sequence's record). */
  private armPerforationOpen(): boolean {
    let recorded = false;
    for (const st of this.sites) {
      const p = st.radialSeq.perforation;
      if (!p) continue;
      recorded = true;
      if (!p.sealed) return true;
    }
    return !recorded && this.wire.perforation;
  }

  /** The tight loop's decision: crossed by balloon-assisted tracking at 3-6 atm, without a perforation. */
  private decideLoopCrossed(st: AccessSiteState, crossed: boolean): void {
    const rs = st.radialSeq;
    const [a0, a1] = MP_RADIAL_SEQUENCE.batAtm;
    const atmOk = rs.batAtm !== null && rs.batAtm >= a0 && rs.batAtm <= a1;
    const learnerPerforated = !!rs.perforation && !rs.perforation.team;
    const ok = crossed && rs.loopCrossed === "bat" && atmOk && !learnerPerforated;
    this.decideOnce({
      id: this.femoralDecisionId("radial-loop-crossed", st),
      stage: "fluoro",
      label: "A tight radial loop crossed by balloon-assisted tracking, not forced",
      correct: ok,
      expected: `A small compliant balloon half out of the catheter tip at ${a0}-${a1} atm, advanced with the catheter; never a wire forced round the loop`,
      given: learnerPerforated
        ? "A hydrophilic wire forced against the loop perforated the artery"
        : rs.loopCrossed === "bat"
          ? `Balloon-assisted tracking at ${rs.batAtm} atm`
          : "Crossed without balloon-assisted tracking",
      lessonId: "cm-access-complications-radial-bleeding",
      tipIds: ["access-cx-radial-loop-bat"],
    });
  }

  /** After a wire move in the arm: pushing against forearm resistance, the wire kept across a perforation, the loop crossed. */
  private radialWireMove(before: WireState, advance: number): void {
    const st = this.activeSite;
    const rs = st.radialSeq;
    const seg = segmentAt(this.route, before.pos);
    const arm = seg.id === "radial" || seg.id === "loop" || seg.id === "brachial";
    // pushed and it did not go: resistance in the forearm, which is imaged rather than pushed
    if (arm && advance > 0 && this.wire.branch === "main" && this.wire.pos - before.pos < 0.3 * advance) {
      if (rs.armResistanceAt === null) rs.armResistanceAt = round(this.tS, 10);
      const imaged = rs.angios.some((a) => a.t >= rs.armResistanceAt!);
      if (!imaged) {
        rs.pushedAgainstMm += advance;
        if (rs.pushedAgainstMm > MP_RADIAL_SEQUENCE.pushTolMm)
          this.decideOnce({
            id: this.femoralDecisionId("forearm-resistance-imaged", st),
            stage: "fluoro",
            label: "Resistance in the forearm imaged, not pushed",
            correct: false,
            expected: "Stop, screen the wire and image the artery through a catheter brought up to just below the wire tip",
            given: `The wire pushed on against resistance in the ${seg.name.toLowerCase()} without an image of the artery`,
            lessonId: "pm-access-radial-sheath",
            tipIds: ["access-radial-wire-resists"],
          });
      }
    }
    // the wire kept across a perforation until it is sealed
    const p = rs.perforation;
    if (p && !p.sealed && this.wire.pos < p.s - MP_RADIAL_SEQUENCE.wireLostMm) p.wireLost = true;
    // the loop crossed
    const loop = this.route.segments.find((x) => x.id === "loop");
    if (loop && rs.loopCrossed === null && before.pos < loop.end && this.wire.pos >= loop.end && this.wire.branch === "main") {
      rs.loopCrossed = rs.bat ? "bat" : "wire";
      if (rs.tightLoop) this.decideLoopCrossed(st, true);
    }
  }

  /** A needle move at the wrist with the artery's tone at the spasm level: it narrows on the image and the flash slows. */
  private radialNeedleFeel(): void {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || st.sheath) return;
    const n = st.pm.st.needle;
    if (!n || n.inserted <= 0 || st.radialSeq.spasm.level < MP_TIPS.spasmLevel) return;
    this.raiseTip("radial-spasm");
    const rs = st.radialSeq;
    // a spasm that stops the wire is a complication, as one that grips the wire later is (procedure.ts spasmTrap)
    if (rs.spasm.level >= MP_RADIAL_SPASM.poorFlashAt) this.complication("radial-spasm", "Radial artery spasm", "minor");
    if (rs.spasmFeltAt !== null) return;
    rs.spasmFeltAt = round(this.tS, 10);
    this.patient.stimulus("radial-spasm", 0.5);
    this.logLine("patient", "My wrist is aching.");
    this.logLine("event", "The artery looks smaller on the image and the flash comes slowly.");
    this.say("The artery is tight. Do not keep stabbing at it.", "technique");
  }

  /** A skin pass at a radial site: a pass into an artery felt to be in spasm is stabbing; the tone's impulse; the bleb. */
  private radialSkinPass(painful: boolean): void {
    const st = this.activeSite;
    const rs = st.radialSeq;
    this.syncRadialTone();
    if (rs.spasmFeltAt !== null && rs.spasm.level >= MP_TIPS.spasmLevel && st.pm.st.passes > 1) {
      rs.stabsInSpasm++;
      this.decideOnce({
        id: this.femoralDecisionId("radial-spasm-stabbing", st),
        stage: "access",
        label: "Spasm at the puncture handled without repeated stabbing",
        correct: false,
        expected: "Stop; nitroglycerin and more sedation, wait for the artery to relax, or move to another artery",
        given: `Skin pass ${st.pm.st.passes} made with the artery still in spasm`,
        lessonId: "pm-access-radial-puncture",
        tipIds: ["access-radial-puncture-spasm"],
      });
    }
    spasmOnPass(rs.spasm, painful);
    this.decideBleb(st);
  }

  /** A pass through a bleb that still flattens the artery where the needle meets it (Brilakis: wait 1-2 minutes or move). */
  private decideBleb(st: AccessSiteState): void {
    const n = st.pm.st.needle;
    const art = st.target;
    // a large bleb is one above Oxford's 1-2 mL (scored correct on 'radial-local-volume'); a smaller one is not an item
    if (!n || !art || !(st.pm.st.blebs ?? []).some((b) => b.ml > MP_RADIAL_SEQUENCE.localMaxMl)) return;
    const th = (n.angleDeg * Math.PI) / 180;
    const xHit = n.entryX + tubeAt(art, n.entryX).z / Math.max(0.2, Math.tan(th));
    const through = st.pm.blebSquash(xHit) >= MP_RADIAL_SEQUENCE.blebScoredSquash;
    this.decideOnce({
      id: this.femoralDecisionId("radial-bleb-response", st),
      stage: "access",
      label: "An artery flattened by a large bleb of local anaesthetic: wait or move",
      correct: !through,
      expected: "Wait 1-2 minutes for the artery to recover, or puncture at another point along it",
      given: through ? "Punctured where the bleb still flattened the artery" : "Waited for the artery to recover, or moved along it",
      lessonId: "pm-access-radial-puncture",
      tipIds: ["access-radial-one-ml-local"],
    });
  }

  /** The first skin pass at a radial site: the arm and the local anaesthetic are scored. */
  private radialFirstPass(st: AccessSiteState): void {
    const arm = st.site.arm;
    if (arm?.cannotSupinate) this.decideCannotSupinate(st, false);
    else if (arm) {
      const want: ArmPosition = st.side === "left" ? "across-body" : "supinated";
      this.decide({
        id: this.femoralDecisionId("radial-arm-position", st),
        stage: "access",
        label: "Arm positioned for the radial puncture",
        correct: arm.position === want && arm.wristExtended,
        expected: st.side === "left" ? "The left arm brought across the abdomen palm up, the wrist extended" : "Supinated on an arm board, the wrist extended",
        given: `${ARM_LABEL[arm.position]}, the wrist ${arm.wristExtended ? "extended" : "not extended"}`,
        lessonId: "pm-access-radial-puncture",
      });
    }
    const given = st.radialSeq.localGiven.filter((l) => !l.byTeam);
    if (given.length) {
      const ml = round(given.reduce((a, l) => a + l.ml, 0), 10);
      const asp = given.every((l) => l.aspirated);
      const [lo, hi] = LOCAL_ANAESTHETIC.radialMl;
      this.decide({
        id: this.femoralDecisionId("radial-local-volume", st),
        stage: "access",
        label: "About 1 mL of local anaesthetic at the wrist, aspirating first",
        correct: ml <= MP_RADIAL_SEQUENCE.localMaxMl && asp,
        expected: `About ${lo} mL (Oxford ${lo}-${hi} mL), aspirating before injecting so none goes into the artery`,
        given: `${ml} mL${asp ? ", aspirated first" : ", not aspirated before injecting"}`,
        lessonId: "pm-access-radial-puncture",
        tipIds: ["access-radial-one-ml-local"],
      });
    }
  }

  /** A forearm that cannot be supinated: punctured at the wrist anyway, or moved to another route. */
  private decideCannotSupinate(st: AccessSiteState, changed: boolean): void {
    this.decide({
      id: "radial-cannot-supinate",
      stage: "access",
      label: "A forearm that cannot be supinated: another route",
      correct: changed,
      expected: "The distal radial or the femoral artery rather than the radial artery at the wrist of a forearm that cannot be turned palm up",
      given: changed ? "Changed to the femoral artery before the puncture" : "Punctured the radial artery at the wrist of the unsupinated forearm",
      lessonId: "pm-access-radial-puncture",
    });
  }

  /** The sheath is in at a radial site: the passes, and spasm at the puncture handled without stabbing. */
  private radialSheathIn(st: AccessSiteState): void {
    const rs = st.radialSeq;
    const passes = st.pm.st.passes;
    this.decide({
      id: this.femoralDecisionId("radial-passes", st),
      stage: "access",
      label: "Radial artery entered within two skin passes",
      correct: passes <= MP_RADIAL_SEQUENCE.passes,
      expected: `Sheath in after no more than ${MP_RADIAL_SEQUENCE.passes} skin passes`,
      given: `${passes} skin pass${passes === 1 ? "" : "es"}`,
      lessonId: "pm-access-radial-puncture",
      tipIds: ["access-radial-puncture-spasm"],
    });
    if (rs.spasmFeltAt !== null && rs.stabsInSpasm === 0)
      this.decideOnce({
        id: this.femoralDecisionId("radial-spasm-stabbing", st),
        stage: "access",
        label: "Spasm at the puncture handled without repeated stabbing",
        correct: true,
        expected: "Stop; nitroglycerin and more sedation, wait for the artery to relax, or move to another artery",
        given: "No further pass until the artery had relaxed",
        lessonId: "pm-access-radial-puncture",
        tipIds: ["access-radial-puncture-spasm"],
      });
  }

  /** A catheter goes in through a radial sheath: exchanges count in the tone; the sheath secured and the vasodilator, before the first. */
  private radialCatheterIn(): void {
    const st = this.activeSite;
    const rs = st.radialSeq;
    if (rs.catheterLoads > 0) {
      rs.exchanges++;
      spasmOnExchange(rs.spasm);
    }
    rs.catheterLoads++;
    if (rs.slipped && !rs.secured) this.say("The sheath has slipped back. Secure it before the next catheter.", "technique");
    if (rs.catheterLoads > 1) return;
    this.decide({
      id: this.femoralDecisionId("radial-sheath-secured", st),
      stage: "table",
      label: "Radial sheath secured before the catheters",
      correct: !!rs.secured,
      expected: "Secured before any catheter goes through it: the side arm clipped to the drape, a transparent dressing, a suture or a clasp",
      given: rs.secured ? (SHEATH_SECURES.find((m) => m.id === rs.secured)?.label ?? "Secured") : "Not secured",
      lessonId: "pm-access-radial-sheath",
      tipIds: ["access-radial-thin-sheath-vasodilator"],
    });
    const v = rs.vasodilator;
    this.decide({
      id: this.femoralDecisionId("radial-vasodilator", st),
      stage: "table",
      label: "Vasodilator through the aspirated side arm before the first catheter",
      correct: !!v && v.aspirated,
      expected: "Aspirate 3-4 mL from the side arm, then a vasodilator through it (for example verapamil or nitroglycerin), before the first catheter",
      given: !v ? "No vasodilator" : v.aspirated ? "Given through the aspirated side arm" : "Given before the side arm was aspirated",
      lessonId: "pm-access-radial-sheath",
      tipIds: ["access-radial-thin-sheath-vasodilator"],
    });
  }

  /** A catheter comes out of a radial sheath that was not secured: the sheath slides back (a model rule). Heparin
   *  held for the root is missed only when the catheter got there; out before it (an exchange in the arm, or a
   *  crossover to another artery) the decision stays pending and the next catheter re-arms it. */
  private radialCatheterOut(atRoot: boolean): void {
    const rs = this.activeSite.radialSeq;
    if (atRoot) this.radialHeparinMissed();
    if (rs.secured || rs.slipped) return;
    rs.slipped = true;
    this.logLine("event", "The unsecured sheath slid partly out of the wrist as the catheter came out.");
  }

  /** After an order at a radial site: the first vasodilator through the sheath, and heparin held to the root. */
  private radialAfterOrder(id: OrderId): void {
    const st = this.activeSite;
    // heparin held for the root is resolved wherever it is given, including at another artery after a crossover
    const heparin = id === "heparin-radial" || id === "heparin-weight" || id === "heparin-pci" || id === "radial-cocktail";
    if (heparin) {
      const crossed = st.siteKind !== "radial";
      for (const site of this.sites) {
        const rp = site.radialSeq;
        if (!rp.heparinPending) continue;
        rp.heparinPending = false;
        this.decideOnce({
          id: "radial-heparin",
          stage: "table",
          label: "Heparin on a radial case before the catheter goes up the arm",
          correct: true,
          expected: "Heparin after the sheath, or held until the catheter reaches the aortic root",
          given: crossed
            ? `Held; given after crossing over (${this.heparinU} U)`
            : this.catheterInAorta
              ? `Held until the catheter reached the aortic root, then ${this.heparinU} U`
              : `${this.heparinU} U with the catheter in the arm`,
          lessonId: "pm-antithrombotics-heparin",
          tipIds: ["access-radial-heparin-timing", "diag-delay-heparin-tortuous-arm"],
        });
      }
    }
    if (st.siteKind !== "radial") return;
    const rs = st.radialSeq;
    const vaso = id === "verapamil" || id === "verapamil-high" || id === "gtn" || id === "gtn-low" || id === "radial-cocktail";
    if (vaso && this.sheath && !rs.vasodilator) rs.vasodilator = { t: round(this.tS, 10), aspirated: !!this.sheath.aspirated };
  }

  /** Heparin held for the root but never given: scored when the catheter is handed over or comes out. */
  private radialHeparinMissed(): void {
    for (const st of this.sites) {
      const rs = st.radialSeq;
      if (!rs.heparinPending || this.heparinU > 0) {
        rs.heparinPending = false;
        continue;
      }
      rs.heparinPending = false;
      this.decideOnce({
        id: "radial-heparin",
        stage: "table",
        label: "Heparin on a radial case before the catheter goes up the arm",
        correct: false,
        expected: "Heparin after the sheath, or held until the catheter reaches the aortic root and given then",
        given: "No heparin",
        lessonId: "pm-antithrombotics-heparin",
        tipIds: ["access-radial-heparin-timing", "diag-delay-heparin-tortuous-arm"],
      });
    }
  }

  // -------------------------------------------------------------------------
  // wire and catheter navigation
  // -------------------------------------------------------------------------

  setWireKind(k: "j" | "hydrophilic"): void {
    if (this.wireInBody) return;
    this.wireKind = k;
  }

  /** Flush the catheter on the table (before it goes in). */
  prepCatheter(id: CatheterId): void {
    if (this.busy) return;
    if (this.catheter?.inBody) return;
    this.catheter = { id, prepped: true, inBody: false, pos: 0, lumenAir: false, lumenClot: false, lastFlushAt: this.tS };
    this.spend(MP_SESSION.catheterPrepS, `Flushing the ${id} catheter`);
    this.logLine("action", `${id} catheter flushed with heparinised saline on the table.`);
  }

  /** Put the wire into the catheter and both into the sheath (wire-led). Without prepping, the lumen holds air. */
  loadCatheter(id: CatheterId): boolean {
    if (this.busy) return false;
    if (!this.sheath) return !!this.needSheath("There is no sheath yet.");
    if (this.sheath.venous || this.activeSite.siteKind === "femoral-vein") {
      this.say("Not through this sheath: it is in a vein.", "safety", { stop: true });
      return false;
    }
    if (this.catheter?.inBody) return false;
    // a subintimal sheath: the wire stops at its tip (Brilakis 5.2, in pm-access-troubleshoot: 'If a wire will
    // not advance once the sheath is in ...'); the cue is felt, never named
    if (this.sheath.subintimal) {
      this.raiseTip("wire-resistance");
      this.logLine("event", "The wire will not advance beyond the sheath tip.");
      this.say("The wire stops at the sheath tip. Do not push it: find out why before anything goes through this sheath.", "technique");
      return false;
    }
    this.catheterSiteId = this.activeSite.id;
    if (!this.catheter || this.catheter.id !== id) this.catheter = { id, prepped: false, inBody: false, pos: 0, lumenAir: true, lumenClot: false, lastFlushAt: this.tS };
    this.catheter.inBody = true;
    // a catheter back in: the case is not over, so an earlier wait with the sheath in was not a closure wait
    this.activeSite.radialSeq.closureWaitS = 0;
    this.catheter.lumenAir = !this.catheter.prepped;
    // a sheath not aspirated since it went in, or since the last catheter came out, holds thrombus that the
    // catheter picks up (pm-to-the-root lab request 1): its lumen holds clot until it is aspirated at the root
    const sh = this.sheath;
    const dirty = !(sh.aspiratedForNext ?? sh.aspirated) || !!sh.clot;
    if (dirty) {
      sh.clot = true;
      this.catheter.lumenClot = true;
      this.hazards.catheterThrombus = Math.max(this.hazards.catheterThrombus, 0.6);
      this.emit("hazard.sheath-clot", {});
    }
    this.activeSite.up.wireLeftIn = false;
    this.wireInBody = true;
    this.ex = { ...this.ex, wireInCatheter: true, wireOut: false, backBled: false, aspirated: false, flushed: false, connected: false, traceChecked: false };
    this.wire = initialWire();
    const radialSite = this.activeSite.siteKind === "radial";
    const rsq = this.activeSite.radialSeq;
    this.logLine("action", `${this.wireKind === "j" ? "J wire" : "Hydrophilic wire"} and ${id} catheter into the sheath.`);
    if (!this.catheter.prepped) this.say("That catheter went in dry. Its lumen is full of air.", "safety");
    if (this.access !== "femoral" && this.heparinU === 0 && !rsq.extremeTortuosity) this.say("No heparin yet. On a radial case it goes in after the sheath, to protect the artery.", "technique");
    if (radialSite) this.radialCatheterIn();
    this.emit("catheter-in", { id, prepped: this.catheter.prepped });
    const ready = !dirty && this.sheath.flushed;
    this.decideOnce({
      id: "sheath-aspirated",
      stage: "table",
      label: "Sheath aspirated and flushed before each catheter",
      correct: ready,
      expected: "Side arm aspirated, then flushed, before the first catheter and again before each later catheter or guide",
      given: ready ? "Aspirated and flushed" : dirty ? "Not aspirated since the sheath went in or the last catheter came out" : "Aspirated but not flushed",
      lessonId: "pm-to-the-root-table",
      tipIds: ["access-root-sheath-aspirate-flush", "access-sheath-two-syringes"],
    });
    this.decideOnce({
      id: "catheter-prepped",
      stage: "table",
      label: "Catheter flushed on the table before it went in",
      correct: this.catheter.prepped,
      expected: "Flushed with heparinised saline before insertion",
      given: this.catheter.prepped ? "Flushed first" : "Inserted dry",
      lessonId: "pm-to-the-root-table",
    });
    // the radial heparin: after the sheath; where the previous report called the arm extremely tortuous it may be held
    // until the catheter reaches the aortic root (Brilakis 4.3, pm-access-radial-sheath steps 9-10), so the decision waits
    if (this.access !== "femoral") {
      if (this.heparinU === 0 && rsq.extremeTortuosity) rsq.heparinPending = true;
      else
        this.decideOnce({
          id: "radial-heparin",
          stage: "table",
          label: "Heparin on a radial case before the catheter goes up the arm",
          correct: this.heparinU > 0,
          expected: rsq.extremeTortuosity ? "Heparin after the sheath, or held until the catheter reaches the aortic root" : "Heparin given after the sheath",
          given: this.heparinU > 0 ? `${this.heparinU} U given` : "No heparin",
          lessonId: "pm-antithrombotics-heparin",
          tipIds: rsq.extremeTortuosity ? ["access-radial-heparin-timing", "diag-delay-heparin-tortuous-arm"] : ["access-radial-heparin-timing"],
        });
    }
    this.fireHook("catheter-in");
    return true;
  }

  /** Push or torque the wire (mm, rad); `imaged` says whether the tip is visible on fluoroscopy now. */
  commandWire(advance: number, torque: number): WireEvent[] {
    if (!this.wireInBody || this.ex.wireOut || this.busy) return [];
    if (this.sheath?.venous) return [];
    const seg = segmentAt(this.route, this.wire.pos);
    const limb = ["radial", "loop", "brachial", "subclavian", "femoral", "iliac", "innom", "arch"].includes(seg.id);
    if (advance > 0 && (!this.beamOn || !this.tipImaged) && limb) {
      this.blindMm += advance;
      if (this.blindMm > MP_SESSION.blindMm) {
        this.blindMm = 0;
        this.say("Never advance a wire you cannot see. Put your foot on the fluoroscopy pedal and find the tip.", "safety", { stop: this.policy.mentor !== "full" });
        this.emit("blind-advance", { seg: seg.id });
        this.decideWireImaged(false);
      }
    }
    const before = this.wire;
    const r = stepWire(this.wire, this.route, { advance, torque, breath: this.breath, hydrophilic: this.wireKind === "hydrophilic", rand: this.rng.next(), ...this.spasmInputs() }, 0.033);
    const { events, ...w } = r;
    this.wire = w;
    for (const e of events) this.onWire(e);
    if (this.activeSite.siteKind === "radial") this.radialWireMove(before, advance);
    this.spasmSeen = Math.max(this.spasmSeen, this.wire.spasm);
    // spasm is felt as resistance on a move, not while the wire is still
    if (this.access !== "femoral" && advance !== 0 && this.wire.spasm >= MP_TIPS.spasmLevel) this.raiseTip("radial-spasm");
    this.patient.setTip({ location: "outside", valveOpen: !this.ex.connected, lvContact: this.wire.lvContact });
    return events;
  }

  private onWire(e: WireEvent): void {
    switch (e.kind) {
      case "segment":
        this.emit("wire.segment", { id: e.id });
        break;
      case "wrong-turn":
        this.logLine("event", `The wire went into the ${e.label}.`);
        if (this.access !== "femoral") this.say("The wire is heading down the descending aorta. Pull back above the arch, swing to a left anterior oblique view, and point the tip towards the ascending aorta. A deep breath helps.", "technique");
        else this.say("The wire has gone up into the left subclavian artery. Pull back into the arch and let the J tip find the ascending aorta.", "safety");
        break;
      case "back-on-route":
        this.logLine("event", "Wire back in the arch.");
        break;
      case "perforation":
        this.raiseTip("perforation");
        this.raiseTip("bleeding");
        this.complication("forearm-perforation", "Arm branch perforated by a forced hydrophilic wire", "major");
        this.radialPerforated();
        this.patient.stimulus("radial-spasm", 0.9);
        this.logLine("patient", "Sharp pain in the forearm.");
        this.say(
          this.catheter?.inBody
            ? "Stop pushing. A hydrophilic wire forced against resistance can perforate a small branch. Inject a little contrast through the catheter, brought up to just below the wire tip, to see the anatomy."
            : "Stop pushing. A hydrophilic wire forced against resistance can perforate a small branch. Inject a little contrast through the sheath to see the anatomy.",
          "safety",
          { stop: true },
        );
        break;
      case "spasm":
        this.raiseTip("radial-spasm");
        this.patient.stimulus("radial-spasm", 0.7);
        this.logLine("patient", "My arm is really hurting.");
        this.complication("radial-spasm", "Radial artery spasm", "minor");
        this.say("That is spasm. Stop moving, give intra-arterial verapamil or glyceryl trinitrate through the sheath, and wait. What feels like spasm can be a loop: a puff of contrast through the sheath will tell you.", "technique");
        break;
      case "buckle":
        // buckling at a radial loop is what the operator sees of the loop on fluoroscopy (the buckle springs the wire
        // back 3 mm, procedure.ts, so the loop is looked for where the tip was)
        if (segmentAt(this.route, this.wire.pos).id === "loop" || segmentAt(this.route, this.wire.pos + 3).id === "loop") this.raiseTip("radial-loop");
        this.logLine("event", "The wire buckled.");
        break;
      case "lv-contact":
        this.logLine("event", "Ectopic beats as the wire touches the valve.");
        break;
      case "aorta":
        this.logLine("event", "Wire in the ascending aorta.");
        break;
      case "root":
        this.logLine("event", "Wire at the aortic root.");
        break;
    }
  }

  /** Scored once against the case: the wire advanced only under fluoroscopy (wrong from the first blind advance on). */
  private decideWireImaged(seen: boolean): void {
    const prev = this.ledger.get("wire-under-fluoroscopy");
    if (prev && !prev.correct) return;
    this.decide({
      id: "wire-under-fluoroscopy",
      stage: "fluoro",
      label: "Wire advanced only with its tip on fluoroscopy",
      correct: seen,
      expected: "Every advance of the wire through the limb and the arch under fluoroscopy",
      given: seen ? "Advanced under fluoroscopy" : "Advanced blind",
      lessonId: "pm-to-the-root-advance",
      tipIds: this.access === "femoral" ? ["access-cx-iliac-wire-fluoro"] : undefined,
    });
  }

  /** Advance the catheter over the wire (mm). */
  commandCatheter(advance: number): void {
    const c = this.catheter;
    if (!c || !c.inBody || this.busy) return;
    if (this.ex.wireOut && advance > 0 && c.pos < this.route.aortaStart) {
      this.say("Not without a wire in front of it through the arm.", "safety", { stop: true });
      return;
    }
    const od = (this.catheterFr() / 3) * 1.0;
    const r = stepCatheter({ pos: c.pos, resistance: 0, message: "" }, this.wire, this.route, advance, od, this.profile.radialDiamMm);
    c.pos = r.pos;
    if (r.spasmDelta > 0) this.wire = { ...this.wire, spasm: Math.min(1, this.wire.spasm + r.spasmDelta) };
    // a radial artery in spasm grips the catheter shaft: resistance felt on the move
    if (this.access !== "femoral" && advance !== 0 && this.wire.spasm >= MP_TIPS.spasmLevel) this.raiseTip("radial-spasm");
    if (r.message) this.logLine("event", r.message);
    if (this.catheterInAorta && this.hookAt.root === undefined) this.fireHook("root");
  }

  catheterFr(): number {
    return this.sheath ? SHEATHS[this.sheath.id].fr : 6;
  }

  get catheterInAorta(): boolean {
    return !!this.catheter?.inBody && this.catheter.pos >= this.route.aortaStart - 2;
  }

  /** A puff of contrast through the sheath side arm (roadmap of the arm or groin), `ml` mL (default MP_SESSION.puffMl). */
  sheathPuff(ml: number = MP_SESSION.puffMl): boolean {
    if (!this.sheath || this.busy) return false;
    const [p0, p1] = MP_UPSIZING.puffClampMl;
    const v = Math.round(Math.max(p0, Math.min(p1, ml)) * 10) / 10;
    if (this.sheath.subintimal) this.injectedSubintimal();
    this.patient.contrast(v, "root");
    this.spend(MP_SESSION.puffS, "Contrast through the sheath");
    this.logLine("action", `${v} mL contrast through the sheath side arm.`);
    if (this.activeSite.siteKind === "radial") this.readForearmImage("sheath", v, 0, MP_SESSION.radialPuffMm);
    return true;
  }

  // -------------------------------------------------------------------------
  // exchanges at the root
  // -------------------------------------------------------------------------

  /** Pull the wire out of the catheter; `backBleed` lets blood fill the hub before the next step. */
  pullWire(backBleed: boolean): void {
    if (!this.catheter?.inBody || this.ex.wireOut || this.busy) return;
    if (!this.catheterInAorta) {
      this.say("Bring the catheter up into the ascending aorta before you take the wire out.", "technique");
      return;
    }
    this.ex.wireOut = true;
    this.ex.wireInCatheter = false;
    this.ex.backBled = backBleed;
    this.wireInBody = false;
    // pulling the wire draws air in at the hub unless the hub is allowed to back-bleed, which also expels it
    this.catheter.lumenAir = !backBleed;
    this.catheter.lastFlushAt = this.tS;
    this.spend(MP_SESSION.exchangeStepS, "Removing the wire");
    this.logLine("action", backBleed ? "Wire removed; the hub allowed to back-bleed." : "Wire removed.");
  }

  /** Aspirate the catheter to waste: removes air and clot from the lumen. */
  aspirate(): void {
    const c = this.catheter;
    if (!c?.inBody || !this.ex.wireOut || this.busy) return;
    this.ex.aspirated = true;
    const found = [c.lumenAir && "air bubbles", c.lumenClot && "a small clot"].filter(Boolean);
    c.lumenAir = false;
    c.lumenClot = false;
    c.lastFlushAt = this.tS;
    this.hazards.catheterThrombus = 0;
    this.spend(MP_SESSION.exchangeStepS, "Aspirating to waste");
    this.logLine("result", found.length ? `Aspirated to waste: ${found.join(" and ")} in the syringe.` : "Aspirated to waste: blood only.");
  }

  /** Flush the catheter. Air or clot still in the lumen goes into the aorta. */
  flush(): void {
    const c = this.catheter;
    if (!c?.inBody || !this.ex.wireOut || this.busy) return;
    this.decideOnce({
      id: "aspirate-before-flush",
      stage: "table",
      label: "Catheter cleared of air and clot before it was flushed",
      correct: !c.lumenAir && !c.lumenClot,
      expected: "Back-bleed or aspirate to waste first, then flush",
      given: c.lumenAir || c.lumenClot ? `Flushed with ${[c.lumenAir && "air", c.lumenClot && "clot"].filter(Boolean).join(" and ")} in the lumen` : "Cleared first",
      lessonId: "pm-engaging-trace",
      tipIds: ["diag-aspirate-before-engaging"],
    });
    if (c.lumenAir) {
      this.airEmbolism("Air flushed from the catheter into the aortic root");
      c.lumenAir = false;
    }
    if (c.lumenClot) {
      this.critical("clot-flushed", "Catheter clot flushed into the aorta");
      this.say("You flushed a clot into the aorta. Always aspirate before you flush.", "safety", { stop: true, critical: true });
      c.lumenClot = false;
      this.tableEmbolism("clot");
    }
    this.ex.flushed = true;
    c.lastFlushAt = this.tS;
    this.spend(MP_SESSION.exchangeStepS, "Flushing the catheter");
    this.logLine("action", "Catheter flushed with heparinised saline.");
  }

  private airEmbolism(label: string): void {
    this.critical("air-embolism", label);
    this.hazards.airEmbolism = 1;
    // air in the root rises to the anterior (right) coronary ostium: a transient occlusion (model)
    this.patient.setOcclusion("air-embolism", { vessel: "RCA", param: 0.15, fraction: 1 });
    this.airUntil = this.tS + MP_SESSION.airEmbolismS;
    this.raiseTip("air", MP_SESSION.airEmbolismS);
    this.logLine("patient", "Chest tightness.");
    this.say("Air embolism. That came from the catheter. Aspirate first, always.", "safety", { stop: true, critical: true });
    this.tableEmbolism("air");
  }

  /** Flush the manifold line (wet-to-wet). */
  flushLine(): void {
    if (this.busy) return;
    this.ex.lineFlushed = true;
    this.patient.transducer.setAir(0);
    this.spend(MP_SESSION.exchangeStepS, "Flushing the manifold line");
    this.logLine("action", "Manifold and line flushed; no bubbles.");
  }

  /** Connect the catheter to the manifold. An unflushed line carries air. */
  connectManifold(): void {
    const c = this.catheter;
    if (!c?.inBody || !this.ex.wireOut || this.busy) return;
    this.ex.connected = true;
    this.decideOnce({
      id: "line-flushed",
      stage: "table",
      label: "Manifold and line flushed before connecting",
      correct: this.ex.lineFlushed,
      expected: "Line flushed free of bubbles, then a wet-to-wet connection",
      given: this.ex.lineFlushed ? "Flushed first" : "Connected with air in the line",
      lessonId: "pm-to-the-root-table",
      tipIds: ["diag-root-manifold-ready", "diag-root-air-in-line"],
    });
    if (!this.ex.lineFlushed) {
      this.patient.transducer.setAir(0.05);
      this.hazards.airEmbolism = Math.max(this.hazards.airEmbolism, 0.7);
      this.say("There are bubbles in the line. The trace will be damped, and that air goes into the patient with the first injection.", "safety");
    }
    if (!this.ex.aspirated && !this.ex.flushed) this.hazards.airEmbolism = Math.max(this.hazards.airEmbolism, c.lumenAir ? 0.9 : 0.3);
    this.patient.setTip({ location: "aorta", gap: 1, valveOpen: false });
    this.spend(MP_SESSION.exchangeStepS, "Connecting to the manifold");
    this.logLine("action", "Catheter connected to the manifold.");
  }

  /** Zero the transducer (open to air). */
  zero(): void {
    if (this.busy) return;
    this.patient.transducer.zero();
    this.ex.zeroed = true;
    this.spend(MP_SESSION.zeroS, "Zeroing the transducer");
    this.logLine("action", "Transducer zeroed to air.");
  }

  /** Level the transducer at the mid-chest (phlebostatic axis). */
  level(): void {
    if (this.busy) return;
    this.transducerHeightCm = 0;
    this.patient.transducer.setHeight(0);
    this.ex.levelled = true;
    this.spend(MP_SESSION.levelS, "Levelling the transducer");
    this.logLine("action", "Transducer levelled at the mid-chest.");
  }

  /** Displayed minus true aortic mean pressure now (mmHg). */
  pressureOffset(): number {
    const v = this.patient.vitals();
    if (!v.art) return 0;
    return v.art.mean - v.aortaTrue.mean;
  }

  /** Look at the aortic trace and record it. */
  checkTrace(): { displayed: string; offset: number; damped: boolean } | null {
    if (!this.ex.connected) return null;
    const v = this.patient.vitals();
    const off = this.pressureOffset();
    this.ex.traceChecked = true;
    const disp = v.art ? `${Math.round(v.art.sys)}/${Math.round(v.art.dia)} (${Math.round(v.art.mean)})` : "no trace";
    this.logLine("result", `Aortic pressure ${disp} mmHg.`);
    const damped = v.transducer.verdict === "overdamped";
    if (Math.abs(off) > 5) this.say(`Does ${disp} fit this patient? The cuff pressure says otherwise. Have you zeroed and levelled the transducer?`, "technique");
    if (damped) this.say("That trace is damped. Look for air in the line.", "technique");
    return { displayed: disp, offset: off, damped };
  }

  // -------------------------------------------------------------------------
  // handover to the diagnostic and PCI labs
  // -------------------------------------------------------------------------

  setBreath(on: boolean): void {
    this.breath = on;
    this.patient.holdBreath(on ? 0.95 : null);
  }

  /** Dose booked by this lab's fluoroscopy (from its DoseTracker). */
  setOwnDose(d: { fluoroS: number; karMGy: number; kapGyCm2: number }): void {
    this.ownDose = { ...d };
    this.refreshTotals();
  }

  private refreshTotals(): void {
    const c = this.patient.vitals().contrast.totalMl;
    this.totals = {
      contrastMl: round(c + this.labTotals.contrastMl, 10),
      fluoroS: round(this.ownDose.fluoroS + this.labTotals.fluoroS, 10),
      karMGy: round(this.ownDose.karMGy + this.labTotals.karMGy, 10),
      kapGyCm2: round(this.ownDose.kapGyCm2 + this.labTotals.kapGyCm2, 100),
    };
  }

  /** Is the catheter ready for injections? Lists what is missing. */
  readiness(): string[] {
    const miss: string[] = [];
    if (!this.catheterInAorta) miss.push("catheter in the ascending aorta");
    if (!this.ex.wireOut) miss.push("wire out");
    if (!this.ex.aspirated) miss.push("aspirated");
    if (!this.ex.flushed) miss.push("flushed");
    if (!this.ex.connected) miss.push("connected to the manifold");
    if (!this.ex.zeroed) miss.push("transducer zeroed");
    if (!this.ex.levelled) miss.push("transducer levelled");
    if (!this.ex.traceChecked) miss.push("aortic trace checked");
    return miss;
  }

  /** Hand the case to the diagnostic lab (or straight to PCI). Same access, heparin, contrast and dose. */
  handover(lab: "diagnostic" | "pci" = "diagnostic"): CaseHandover | null {
    // a stroke on the table stops the case (proc-recovery-ward)
    if (this.tableStrokeStops()) return null;
    if (!this.sheath || !this.catheter?.inBody) {
      this.say("There is nothing to hand over yet: no catheter in the aorta.", "technique");
      return null;
    }
    const miss = this.readiness();
    const lineAir = this.hazards.airEmbolism > 0.5 && !this.ex.lineFlushed;
    if (lineAir) this.critical("air-in-line", "Injection line not flushed before handing over to the angiography");
    if (miss.length) this.say(`Before we inject: ${miss.join(", ")}.`, miss.includes("flushed") || miss.includes("aspirated") ? "safety" : "technique");
    this.refreshTotals();
    this.handedOver = lab;
    const lastAct = this.acts[this.acts.length - 1] ?? null;
    this.logLine("action", `Handed over to the ${lab === "pci" ? "angioplasty" : "angiography"}.`);
    this.emit("handover", { lab, missing: miss });
    this.decideOnce({
      id: "transducer-zero-level",
      stage: "table",
      label: "Transducer zeroed and levelled before the first injection",
      correct: this.ex.zeroed && this.ex.levelled,
      expected: "Levelled at the mid-chest and zeroed to air",
      given: [this.ex.levelled ? "levelled" : "not levelled", this.ex.zeroed ? "zeroed" : "not zeroed"].join(", ").replace(/^./, (x) => x.toUpperCase()),
      lessonId: "pm-monitoring-transducers",
      tipIds: ["haemo-mon-zero-level"],
    });
    if (!this.ledger.get("wire-under-fluoroscopy")) this.decideWireImaged(true);
    this.radialHeparinMissed();
    this.fireHook("handover");
    const sheathId = this.sheath.id;
    const catheter = this.catheter;
    return {
      lab,
      caseData: this.caseData,
      profile: this.profile,
      access: this.access,
      sheath: sheathId,
      catheterId: catheter.id,
      catheterInAscendingAorta: this.catheterInAorta,
      tS: this.tS,
      heparinU: this.heparinU,
      lastAct,
      contrastMl: this.totals.contrastMl,
      contrastBudgetMl: this.contrastBudgetMl,
      fluoroS: this.totals.fluoroS,
      karMGy: this.totals.karMGy,
      kapGyCm2: this.totals.kapGyCm2,
      line: { zeroed: this.ex.zeroed, levelled: this.ex.levelled, lineAir, lumenAir: !!catheter.lumenAir, lumenClot: !!catheter.lumenClot, pressureOffsetMmHg: round(this.pressureOffset(), 10) },
      hazards: { ...this.hazards },
      pciReady: lab === "pci" ? { heparinTopUpU: this.pciTopUpU(), actTargetS: this.pciActRange() } : undefined,
      notes: miss.map((m) => `Not done: ${m}`),
      mode: this.mode,
      // the target the study report chose (pci-adhoc-handover: the PCI lab builds its scenario on it)
      ...(lab === "pci" && this.pciTargetChosen ? { pciTarget: { ...this.pciTargetChosen } } : {}),
      // found-handover-contract extensions (additive; a lab that does not read them is unchanged)
      anticoag: { doses: this.heparinDoses.map((d) => ({ ...d })), infusions: [], lastAct: lastAct ? { ...lastAct } : null, targetS: lab === "pci" ? this.pciActRange() : null },
      antithrombotic: this.antithrombotic(),
      contrast: contrastState(this.totals.contrastMl, this.contrastBudgetMl),
      sheathState: { clot: !!this.sheath?.clot, aspirated: !!this.sheath?.aspirated && !!this.sheath?.flushed && (this.sheath?.aspiratedForNext ?? true) },
    };
  }

  /** The antithrombotics this session knows of: the patient's oral anticoagulant (no antiplatelet is recorded here yet). */
  antithrombotic(): AntithromboticState {
    const p = this.profile;
    const oac = p.anticoagulation === "none" ? null : p.anticoagulation === "doac" ? { kind: "doac" as const, ...(p.doac ? { agent: p.doac.agent, hoursSinceDose: p.doac.hoursSinceDose } : {}) } : { kind: "warfarin" as const };
    return { oac, aspirin: null, p2y12: null, infusions: [] };
  }

  /**
   * Ad hoc PCI after the diagnostic study: same access; heparin to the PCI dose and ACT target first.
   * Through the hand-over gate (openPciGate) the dose and the ACT are the learner's decisions, and in
   * guided and supervised mode the case does not go on until an ACT at target has been measured
   * after the last heparin dose; without a gate (a direct call) the attending names the top-up.
   */
  toPci(o: { target?: PciTarget | null } = {}): CaseHandover | null {
    // the target chosen in the study report (diag-study-report), with the strategy 'adhoc' (pci-adhoc-handover)
    if (o.target) this.choosePciTarget(o.target);
    const g = this.pciGate && this.pciGate.passedAt === null ? this.pciGate : null;
    if (g) return this.passPciGate(g);
    const top = this.pciTopUpU();
    const [lo, hi] = this.pciDoseRangeUPerKg();
    const [aLo, aHi] = this.pciActRange();
    if (top > 0) this.say(`For angioplasty the heparin goes up to ${lo}-${hi} U/kg: another ${top} U, then an ACT of ${aLo}-${aHi} s.`, "safety");
    return this.handover("pci");
  }

  // -------------------------------------------------------------------------
  // the ad hoc PCI's target and outcome (pci-adhoc-handover)
  // -------------------------------------------------------------------------

  /** The target the study report chose for ad hoc PCI: the hand-over to PCI carries it with the strategy 'adhoc'. */
  choosePciTarget(t: PciTarget | null): void {
    this.pciTargetChosen = t ? { ...t, strategy: "adhoc" } : null;
  }

  /** The target the hand-over to PCI carries (null: none chosen). */
  pciTarget(): PciTarget | null {
    return this.pciTargetChosen ? { ...this.pciTargetChosen } : null;
  }

  /**
   * A lab leaves its report for the return (the PCI lab's LabReport, with the target it treated and the
   * comparison with the case truth); returnFromLab takes it when its caller passes no report.
   */
  stageLabReport(report: LabReport, extra: { target?: PciTarget | null; targetCheck?: PciOutcome["targetCheck"] } = {}): void {
    this.stagedReport = { report, ...extra };
  }

  /**
   * The PCI is back: its outcome is kept, and its complications join the case's list (named with the PCI's
   * label, numbered by the return, marked as the PCI's: the case's pass rule leaves them to the PCI lab's own
   * grading). Its finish-phase flags (complications, dose, contrast, complex lesions) are not case events (an
   * access context would read a coronary perforation or dissection as an access one): pciFollowUp() keeps
   * them, and moduleTipContexts() gives them to the PCI finish context for the rest of the case.
   */
  private receivePciOutcome(report: LabReport, target: PciTarget | null, targetCheck: PciOutcome["targetCheck"]): void {
    this.pciOutcome = { report, target: target ? { ...target } : null, targetCheck: targetCheck ? { ...targetCheck } : null, returnedAt: round(this.tS, 10) };
    const n = ++this.pciReturns;
    for (const c of report.complications) this.complication(`pci-${n}-${c.id}`, `During the PCI: ${c.label}`, c.severity, "pci");
    const stents = report.stents.length;
    this.logLine("event", `The angioplasty report: ${stents ? `${stents} stent${stents > 1 ? "s" : ""}` : "no stent"}, final TIMI ${report.finalTimi ?? "not recorded"}${report.complications.length ? `, ${report.complications.map((c) => c.label).join(", ")}` : ", no complication"}.`);
  }

  /** What the recovery and discharge steps follow up from the PCI (null until a PCI came back with a report). */
  pciFollowUp(): PciFollowUp | null {
    const o = this.pciOutcome;
    if (!o) return null;
    const events = [...new Set([...(o.report.events ?? []), ...o.report.complications.flatMap((c) => c.events ?? [])])];
    return {
      complications: o.report.complications.map((c) => ({ ...c, ...(c.events ? { events: [...c.events] } : {}) })),
      events,
      highRadiationDose: events.includes("high-radiation-dose"),
      highContrastVolume: events.includes("high-contrast-volume"),
    };
  }

  // -------------------------------------------------------------------------
  // the hand-over gate before ad hoc PCI (proc-heparin-act-handover)
  // -------------------------------------------------------------------------

  /** A scenario sets the IV cannula (a tissued line is found only by looking at it). */
  setIvLine(state: IvLineState): void {
    this.ivLine = state;
  }

  /** A scenario's plan: a GP IIb/IIIa inhibitor or cangrelor will be given during the PCI. */
  planIvAntiplatelet(on = true): void {
    this.ivAntiplateletPlan = on;
  }

  /** Does a dose by this route reach the circulation? Only the IV route depends on the cannula. */
  private ivDelivers(route: string): boolean {
    return route !== "iv" || this.ivLine !== "tissued";
  }

  /** The IV cannula at the gate (a PCI bolus or a look at it): the scenario's, or drawn once (the rare tissued line) from the case's own stream. */
  private ivLineAtBolus(): IvLineState {
    if (this.ivLine === null) this.ivLine = new SeededRng(`iv-line:${this.seed}`).chance(MP_PCI_GATE.tissuedChance) ? "tissued" : "patent";
    return this.ivLine;
  }

  /** An IV antiplatelet agent is planned for the PCI, or running: the case's plan or an infusion running on the pumps. */
  ivAntiplateletPlanned(): boolean {
    return this.ivAntiplateletPlan || this.antiplateletOn.size > 0;
  }

  /** What anticoagulates the PCI: heparin, with or without an IV antiplatelet agent (the ACT target follows it). */
  pciRegimen(): ActRegimen {
    return { anticoagulant: "heparin", ivAntiplatelet: this.ivAntiplateletPlanned() };
  }

  /** The ACT target for the PCI on the case's machine (lesionAssessment.ts actTarget). */
  pciActTarget(): ActTarget {
    return actTarget(this.pciRegimen(), MP_PCI_GATE.actDevice);
  }

  /** The ACT goal range for the PCI, s. */
  pciActRange(): [number, number] {
    const t = this.pciActTarget();
    return [t.minS, t.maxS ?? t.minS];
  }

  /** The PCI heparin dose range, U/kg (SOURCED_PCI_HEPARIN). */
  pciDoseRangeUPerKg(): [number, number] {
    return this.ivAntiplateletPlanned() ? SOURCED_PCI_HEPARIN.uPerKgWithIvAntiplatelet : SOURCED_PCI_HEPARIN.uPerKg;
  }

  /** The gate is open and the case has not yet gone on to PCI through it. */
  get pciGateOpen(): boolean {
    return !!this.pciGate && this.pciGate.passedAt === null;
  }

  /**
   * Open the hand-over gate before ad hoc PCI: the catheter is in the aorta and the diagnostic study
   * is done or under way. The heparin dose and the ACT are now the learner's to decide.
   */
  openPciGate(): PciGate | null {
    if (this.pciGateOpen) return this.pciGate;
    if (!this.sheath || !this.catheter?.inBody) {
      this.say("There is nothing to hand over yet: no catheter in the aorta.", "technique");
      return null;
    }
    this.pciGate = { openedAt: round(this.tS, 10), doses: [], acts: [], passedAt: null };
    this.logLine("action", "Hand-over to ad hoc PCI: the PCI heparin dose and the ACT first.");
    this.emit("pci-gate", { open: true });
    this.say("Before we wire: what heparin has gone in, and when, and what is the ACT now?", "technique");
    this.pciGateContrast();
    return this.pciGate;
  }

  /** Close the gate without going on to PCI (the case continues at the table). */
  closePciGate(): void {
    if (!this.pciGateOpen) return;
    this.pciGate = null;
    this.tipEvents.clear("low-act");
    this.logLine("action", "Hand-over to PCI put off.");
    this.emit("pci-gate", { open: false });
  }

  /**
   * Give heparin at the gate: `u` units IV (through the cannula) or IA (through the sheath side arm).
   * The first dose is the scored PCI dose; a dose into a tissued cannula never reaches the circulation.
   */
  givePciHeparin(u: number, route: AnticoagRoute): HeparinDose | null {
    const g = this.pciGateOpen ? this.pciGate : null;
    if (!g || this.busy || !(u > 0) || !Number.isFinite(u)) return null;
    if (route === "ia" && !this.sheath) return this.needSheath("Heparin through the side arm needs a sheath.");
    const dose = Math.round(u);
    const delivered = route === "ia" || this.ivLineAtBolus() === "patent";
    if (delivered) this.patient.give({ drug: "heparin", dose, route });
    const rec: HeparinDose = { u: dose, t: round(this.tS, 10), route, delivered };
    const lowBefore = this.pciGateLow();
    this.heparinDoses.push(rec);
    g.doses.push({ ...rec });
    this.heparinU += dose;
    const label = `Heparin ${dose} U ${route === "ia" ? "through the sheath side arm" : "IV"}`;
    this.orders.push({ id: "heparin-pci", label, t: this.tS, dose, unit: "U", route: route.toUpperCase() });
    this.spend(MP_SESSION.drugS, `Giving ${label.toLowerCase()}`);
    this.logLine("action", `Given: ${label}.`);
    this.emit("order", { id: "heparin-pci", dose, unit: "U", route: route.toUpperCase(), gate: true });
    if (g.doses.length === 1) this.decidePciDose(`${dose} U ${route === "ia" ? "IA" : "IV"}`);
    else if (lowBefore) this.decideLowActResponse(route);
    return rec;
  }

  /** Look at and flush the IV cannula: a tissued line is swollen and does not run. */
  inspectIvCannula(): IvLineState | null {
    if (this.busy) return null;
    // a line not yet set: at the gate it is the same seeded draw as at the PCI bolus (whichever comes
    // first); before the gate it is running and stays unset, so the rare tissued line stays possible
    const finding: IvLineState = this.ivLine ?? (this.pciGateOpen ? this.ivLineAtBolus() : "patent");
    this.ivLineInspected = { t: round(this.tS, 10), finding };
    this.ivLineCheckedAt = round(this.tS, 10);
    this.spend(MP_PCI_GATE.inspectS, "Checking the IV cannula");
    this.logLine("result", finding === "tissued" ? "IV cannula: the site is swollen and cool and the flush does not run." : "IV cannula: flushes freely; the site looks normal.");
    this.emit("iv-line", { inspected: finding });
    return finding;
  }

  /** Put in a new IV cannula. */
  resiteIvCannula(): void {
    if (this.busy) return;
    this.ivLine = "patent";
    this.ivLineInspected = null;
    this.ivLineCheckedAt = round(this.tS, 10);
    this.spend(MP_PCI_GATE.resiteS, "Putting in a new IV cannula");
    this.logLine("action", "A new IV cannula is in.");
    this.emit("iv-line", { resited: true });
  }

  /** The ACT measured at the gate: the operator's number against the PCI target ('low-act' while it is below). */
  private pciGateAfterAct(act: number): void {
    const g = this.pciGateOpen ? this.pciGate : null;
    if (!g) return;
    g.acts.push({ t: round(this.tS, 10), act });
    const t = this.pciActTarget();
    if (act < t.minS) this.tipEvents.hold(["low-act"], undefined, "case");
    else this.tipEvents.clear("low-act");
    // above the target range: the gate lets it pass (only the lower bound holds the case); guided mode says so
    if (this.mode === "guided" && t.maxS != null && act > t.maxS) this.say(`ACT ${act} s is above the ${t.minS}-${t.maxS} s target range: no more heparin before the PCI.`, "safety");
  }

  /** The last ACT at the gate was measured after the last heparin dose and is below target. */
  private pciGateLow(): boolean {
    const known = this.knownAct();
    return this.pciGateOpen && known !== null && known < this.pciActTarget().minS;
  }

  /** Contrast at the gate: over the case's budget raises 'high-contrast-volume' for the rest of the case. */
  private pciGateContrast(): void {
    const c = this.contrastNow();
    if (c.budgetMl !== null && c.usedMl > c.budgetMl) this.tipEvents.hold(["high-contrast-volume"], undefined, "case");
  }

  /** The contrast used so far (this lab's and the labs'), the case's budget and what is left of it. */
  contrastNow(): ContrastState {
    this.refreshTotals();
    return contrastState(this.totals.contrastMl, this.contrastBudgetMl);
  }

  /** Why the gate does not let the case go on now (null: an ACT at target since the last dose). */
  pciGateProblem(): string | null {
    const known = this.knownAct();
    const [lo, hi] = this.pciActRange();
    const guided = this.mode === "guided";
    if (known === null) return guided ? `Measure the ACT after the last heparin dose first: the target is ${lo}-${hi} s.` : "Before we wire: what is the ACT since the last dose?";
    if (known < lo) return guided ? `ACT ${known} s is below the ${lo}-${hi} s target: more heparin, then measure again.` : `ACT ${known} s. That is not enough to wire on.`;
    return null;
  }

  /** The gate holds the case (guided and supervised mode: the attending stops it); independent and exam runs go on and are scored. */
  pciGateHolds(): boolean {
    return this.mode === "guided" || this.mode === "supervised";
  }

  /** Guided mode's teaching aid at the gate: the heparin still to give and the ACT target. Null outside guided mode. */
  pciGateHint(): { stillToGiveU: number; doseUPerKg: [number, number]; actS: [number, number]; ivAntiplatelet: boolean } | null {
    if (this.mode !== "guided" || !this.pciGateOpen) return null;
    return { stillToGiveU: this.pciTopUpU(), doseUPerKg: this.pciDoseRangeUPerKg(), actS: this.pciActRange(), ivAntiplatelet: this.ivAntiplateletPlanned() };
  }

  /**
   * The PCI tip context at the gate: the PCI plan and the step before the wire (the ACT before any coronary device),
   * with the gate's own events (PCI_GATE_EVENTS: 'low-act', 'high-contrast-volume'). The case's other events stay
   * with the case panel's tip contexts.
   */
  pciGateTipContext(): LabContext | null {
    if (!this.pciGateOpen) return null;
    return { lab: "pci", phase: "plan", phases: ["wire"], events: this.activeEvents().filter((e) => (PCI_GATE_EVENTS as readonly string[]).includes(e)) };
  }

  /** Go on to PCI through the gate: held in guided and supervised mode until the ACT is at target; scored either way. */
  private passPciGate(g: PciGate): CaseHandover | null {
    const why = this.pciGateProblem();
    if (why && this.pciGateHolds()) {
      this.say(why, "safety", { stop: true });
      return null;
    }
    if (!g.doses.length) this.decidePciDose("No further heparin at the hand-over");
    const known = this.knownAct();
    const [lo, hi] = this.pciActRange();
    this.decide({
      id: "pci-act-before-wiring",
      stage: "handover",
      label: "An ACT at the PCI target, measured after the last heparin dose, before the coronary is wired",
      correct: why === null,
      expected: `An ACT of at least ${lo} s (target ${lo}-${hi} s) measured after the last dose`,
      // only the lower bound holds or fails the gate; an ACT above the range is named, not failed
      given: known === null ? "No ACT measured after the last dose" : `ACT ${known} s${known > hi && this.pciActTarget().maxS != null ? `, above the ${lo}-${hi} s target range` : ""}`,
      lessonId: "pm-antithrombotics-heparin",
      tipIds: ["pci-act-before-coronary-devices", "pci-act-device-targets", "pci-low-act-redose"],
    });
    const h = this.handover("pci");
    if (!h) return null;
    g.passedAt = round(this.tS, 10);
    // the PCI lab owns the ACT from here: the gate's 'low-act' does not follow the case (even when an independent run went on below target)
    this.tipEvents.clear("low-act");
    this.emit("pci-gate", { passed: true, act: known });
    return h;
  }

  /** The PCI heparin dose: the total charted (counting what was given before the gate) within the range for the plan. */
  private decidePciDose(given: string): void {
    const w = this.profile.weightKg;
    const [lo, hi] = this.pciDoseRangeUPerKg();
    const total = this.heparinU;
    const before = total - (this.pciGate?.doses ?? []).reduce((a, d) => a + d.u, 0);
    const tol = MP_PCI_GATE.doseToleranceU;
    const correct = total >= lo * w - tol && total <= hi * w + tol;
    const gpi = this.ivAntiplateletPlanned();
    this.decide({
      id: "pci-heparin-dose",
      stage: "handover",
      label: "PCI heparin dose at the hand-over, counting what was already given",
      correct,
      expected: `${lo}-${hi} U/kg in all${gpi ? " with a GP IIb/IIIa inhibitor or cangrelor planned" : ""}: ${Math.round(lo * w)}-${Math.round(hi * w)} U, ${before} U already given`,
      given: `${given}; ${total} U in all (${Math.round(total / w)} U/kg)`,
      lessonId: "pm-antithrombotics-heparin",
      tipIds: ["pci-act-device-targets"],
    });
  }

  /** A redose after a low ACT: when the IV line has tissued, it goes through the sheath, or the line is checked first. */
  private decideLowActResponse(route: AnticoagRoute): void {
    const g = this.pciGate;
    const ivDoses = g ? g.doses.filter((d) => d.route === "iv") : [];
    if (!ivDoses.some((d) => !d.delivered) || this.ledger.get("low-act-line-checked")) return;
    const lastIv = ivDoses[ivDoses.length - 1];
    const checked = this.ivLineCheckedAt !== null && this.ivLineCheckedAt >= (g?.openedAt ?? 0);
    const correct = route === "ia" || (checked && this.ivLine === "patent");
    this.decide({
      id: "low-act-line-checked",
      stage: "handover",
      label: "Low ACT after an IV bolus: the line checked, the redose through the sheath",
      correct,
      expected: "Check the IV cannula, and give the redose through the arterial sheath if the line is doubtful",
      given: route === "ia" ? "Redosed through the sheath side arm" : checked ? `Redosed IV after checking the cannula${this.ivLine === "patent" ? " (re-sited)" : ""}` : `Redosed IV into the same cannula (last IV dose ${lastIv?.u ?? 0} U)`,
      lessonId: "pm-antithrombotics-heparin",
      tipIds: ["pci-low-act-redose"],
    });
  }

  /**
   * The case comes back from a lab with that lab's totals (added to this session's).
   * `patientAdvanced`: the lab ran this session's own patient engine (the continuous hand-over), so
   * the patient has already lived the lab time and its contrast is already in the engine's total; the
   * session clock catches up without advancing the patient again, and `contrastMl` should be 0.
   */
  returnFromLab(lab: "diagnostic" | "pci", t: { contrastMl: number; fluoroS: number; karMGy?: number; kapGyCm2?: number; durationS?: number; patientAdvanced?: boolean; report?: LabReport }): void {
    // the lab's report (found-handover-contract LabReport): the recovery ward reads its stents and wireless exchanges;
    // a report the lab staged (stageLabReport) when the caller passes none
    const staged = this.stagedReport && this.stagedReport.report.lab === (lab === "pci" ? "angio-pci" : "diagnostic") ? this.stagedReport : null;
    this.stagedReport = null;
    const report = t.report ?? staged?.report;
    if (report) this.ward.reports.push(report);
    this.labTotals.contrastMl += Math.max(0, t.contrastMl);
    this.labTotals.fluoroS += Math.max(0, t.fluoroS);
    this.labTotals.karMGy += Math.max(0, t.karMGy ?? 0);
    this.labTotals.kapGyCm2 += Math.max(0, t.kapGyCm2 ?? 0);
    if (!this.labsDone.includes(lab)) this.labsDone.push(lab);
    this.handedOver = "none";
    if (t.patientAdvanced) {
      // the session clock follows the patient's (the lab advanced the same engine)
      let left = Math.max(0, Math.min(t.durationS ?? 0, 3600));
      while (left > 1e-9) {
        const h = Math.min(left, 5);
        this.tS += h;
        left -= h;
        this.slowTick(h);
      }
      for (const e of this.patient.drainEvents()) this.telemetry.push(e);
    }
    // the time spent in the other lab passes on this clock too (as a time-lapse, so the screen stays live)
    else if (t.durationS && t.durationS > 0) this.spend(Math.min(t.durationS, 3600), lab === "pci" ? "Angioplasty" : "Angiography");
    this.refreshTotals();
    this.logLine("event", `Back from the ${lab === "pci" ? "angioplasty" : "angiography"}: contrast ${round(this.totals.contrastMl)} mL so far.`);
    if (lab === "pci" && report) this.receivePciOutcome(report, staged?.target !== undefined ? staged.target : this.pciTargetChosen, staged?.targetCheck ?? null);
    if (this.contrastBudgetMl !== null && this.totals.contrastMl > this.contrastBudgetMl) {
      this.say(`We are over the contrast budget of ${this.contrastBudgetMl} mL.`, "safety");
      // over the case's budget: the kidney tips of the finish follow for the rest of the case (proc-heparin-act-handover)
      this.tipEvents.hold(["high-contrast-volume"], undefined, "case");
    }
    this.fireHook("return");
  }

  // -------------------------------------------------------------------------
  // closure
  // -------------------------------------------------------------------------

  /** Take the catheter out (over a wire when the radial artery is in spasm). */
  removeCatheter(): void {
    const c = this.catheter;
    if (!c?.inBody || this.busy) return;
    if (this.access !== "femoral" && this.wire.spasm > 0.75) {
      this.patient.stimulus("radial-spasm", 0.8);
      this.say("Pulling through a spastic artery hurts and can tear it. Give a vasodilator and wait first.", "safety");
    }
    const atRoot = this.catheterInAorta;
    c.inBody = false;
    c.pos = 0;
    this.wireInBody = false;
    this.ex.connected = false;
    if (this.activeSite.siteKind === "radial") this.radialCatheterOut(atRoot);
    // before the next catheter or guide the sheath is aspirated again (pm-to-the-root-table)
    const cs = (this.catheterSiteId && this.siteById(this.catheterSiteId)?.sheath) || this.sheath;
    if (cs) cs.aspiratedForNext = false;
    this.patient.setTip({ location: "outside", valveOpen: true });
    this.spend(MP_SESSION.exchangeStepS, "Removing the catheter");
    this.logLine("action", "Catheter removed.");
    this.lastCatheterOutAt = this.tS;
    this.fireHook("catheter-out");
  }

  /** Every site that had a sheath is closed (and at least one was). */
  closureDone(): boolean {
    return this.sites.some((x) => this.siteClosed(x)) && this.openSites().length === 0;
  }

  private mapSys(): { map: number; sys: number } {
    const v = this.patient.vitals();
    return { map: v.aortaTrue.mean, sys: v.aortaTrue.sys };
  }

  bandThresholds(): BandThresholds {
    return this.bandThresholdsFor(this.activeSite);
  }

  private bandThresholdsFor(st: AccessSiteState): BandThresholds {
    // the band presses against the pressure of the last several beats, not the one beat now (MP_BAND.thresholdSmoothingS)
    const { map, sys } = this.bandPressures ?? this.mapSys();
    const id = st.sheath?.id ?? (st.sheathHistory || null);
    return radialThresholds({ map, sys, actS: this.actTrue(), fr: id ? SHEATHS[id].fr : 6, antiplatelet: this.antiplateletOn.size > 0 });
  }

  /** The band (and a second band) on the wrist at a site, each against the arterial hole (access-closure-radial). */
  private bandsFor(st: AccessSiteState): BandOnArm[] {
    const r = st.closure.radial;
    if (!r) return [];
    const hole = r.holeX ?? r.centreX ?? 0;
    const out: BandOnArm[] = [{ volumeMl: r.volumeMl, offsetMm: (r.centreX ?? hole) - hole }];
    if (r.second) out.push({ volumeMl: r.second.volumeMl, offsetMm: r.second.centreX - hole });
    return out;
  }

  bandNow(): RadialBandStatus | null {
    return this.bandStatusFor(this.activeSite);
  }

  private bandStatusFor(st: AccessSiteState): RadialBandStatus | null {
    const r = st.closure.radial;
    if (!r) return null;
    return radialBandStatus(this.bandsFor(st), this.bandThresholdsFor(st), r.sheathOut);
  }

  /**
   * The skin nick and the arterial hole at a radial site (site x, mm, + proximal): the puncture model's own
   * skin entry and arteriotomy; without one of them, the other and the near wall's depth over the tangent of
   * the needle angle (radialHoleOffsetMm). Null at a groin or before any puncture.
   */
  radialPunctureGeometry(st: AccessSiteState = this.activeSite): { skinX: number; holeX: number } | null {
    if (st.siteKind !== "radial") return null;
    const r = st.closure.radial;
    if (r?.skinX !== undefined && r.holeX !== undefined) return { skinX: r.skinX, holeX: r.holeX };
    const ax = st.pm.st.arteriotomy;
    const n = st.pm.st.needle;
    const art = st.site.tubes.find((t) => t.id === st.site.arteryId);
    const depthAt = (x: number) => (art ? Math.max(0, tubeAt(art, x).z - art.r) : 0);
    if (ax && n) return { skinX: n.entryX, holeX: ax.x };
    if (ax) return { skinX: ax.x - radialHoleOffsetMm(depthAt(ax.x), st.site.typicalAngleDeg), holeX: ax.x };
    if (n) return { skinX: n.entryX, holeX: n.entryX + radialHoleOffsetMm(depthAt(n.entryX), n.angleDeg) };
    return null;
  }

  /**
   * A closure scenario's start state (access-closure-radial): the team's radial puncture made at `angleDeg` from
   * the skin, so the skin nick lies the near wall's depth over the tangent of that angle distal to the arterial
   * hole (the arteriotomy stays where the sheath is). Only with the sheath in and the catheter out at a radial
   * site (public, for scenario start states).
   */
  setTeamRadialEntry(angleDeg: number): boolean {
    const st = this.activeSite;
    const ax = this.pm.st.arteriotomy;
    const n = this.pm.st.needle;
    if (st.siteKind !== "radial" || !this.sheath || this.catheter?.inBody || !ax || !n || this.radial) return false;
    const art = st.site.tubes.find((t) => t.id === st.site.arteryId);
    const depth = art ? Math.max(0, tubeAt(art, ax.x).z - art.r) : 0;
    n.angleDeg = Math.max(10, Math.min(80, angleDeg));
    n.entryX = ax.x - radialHoleOffsetMm(depth, n.angleDeg);
    return true;
  }

  /**
   * A closure scenario's start state: the sheath the team's PCI left in at this radial site (a 7 Fr sheath put in
   * over a wire for the PCI). Only with the catheter out (public, for scenario start states).
   */
  setTeamSheath(id: SheathId): boolean {
    if (!this.sheath || this.catheter?.inBody || this.radial || this.activeSite.siteKind !== "radial") return false;
    this.sheath.id = id;
    this.pm.st.sheathFr = SHEATHS[id].fr;
    return true;
  }

  /**
   * A closure scenario's start state: catheter exchanges the team made through this radial artery during the PCI
   * (they count in the artery's tone, radialSpasm.ts). Public, for scenario start states.
   */
  addTeamExchanges(n: number): void {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !(n > 0)) return;
    st.radialSeq.exchanges += Math.round(n);
  }

  /**
   * A follow-up vignette's start state (access-closure-radial): the case the patient comes back from was
   * uneventful, so the team's radial closure draws no delayed events (no occlusion, no haematoma) and nothing
   * from the case competes with the problem the patient returns with. Only before the radial closure is
   * finished (public, for scenario start states).
   */
  setTeamCourseUneventful(): boolean {
    if (this.activeSite.siteKind !== "radial" || this.radial?.finishedAt != null || this.delayed.length) return false;
    this.teamUneventful = true;
    return true;
  }

  /**
   * A scenario's start state: the team's hand-over line, logged now, after the team's work, so it is the latest
   * line in the log (and, for the attending's, the caption) when the learner takes the case over (public, for
   * scenario start states).
   */
  handOverNote(kind: "nurse" | "attending", text: string): void {
    // the attending's hand-over is case information, not coaching: it is captioned in every mode but the exam
    // (where no attending caption is shown) and always logged
    if (kind === "attending" && this.mode !== "exam") this.attending.push({ id: `a${++this.lid}`, t: round(this.tS, 10), text, severity: "technique", stop: false, critical: false });
    this.logLine(kind, text);
  }

  /** The spasm rescue at the active radial site's closure (created on first use). */
  private rescueOf(st: AccessSiteState = this.activeSite): ClosureRescue {
    st.radialSeq.closureRescue ??= { vasodilatorAt: null, mixedWithBlood: false, warmedAt: null, lubricatedAt: null, cuffDownAt: null };
    return st.radialSeq.closureRescue;
  }

  /**
   * What the closure rescue adds to the vasodilator input of the spasm model at a radial site (0..1): warmth over
   * the forearm, and the ischaemic vasodilatation after the upper-arm cuff, fading (MP_RADIAL_CLOSURE). Zero
   * until either is done, so every other case is unchanged.
   */
  private closureRelief(st: AccessSiteState): number {
    const rc = st.radialSeq.closureRescue;
    if (!rc) return 0;
    let e = 0;
    if (rc.warmedAt !== null) e = Math.max(e, MP_RADIAL_CLOSURE.warmRelief);
    if (rc.cuffDownAt !== null) e = Math.max(e, MP_RADIAL_CLOSURE.cuffRelief * Math.exp(-Math.max(0, this.tS - rc.cuffDownAt) / MP_RADIAL_CLOSURE.cuffTauS));
    return e;
  }

  /** The sheath is gripped by spasm at the active radial site now (what the operator feels on a pull; truth). */
  sheathGrippedNow(): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !this.sheath) return false;
    return sheathGripped(st.radialSeq.spasm.level, st.radialSeq.closureRescue?.lubricatedAt != null);
  }

  /**
   * Step 2 of the radial closure (pm-closure-radial; Brilakis 11.2): a vasodilator through the side arm, mixed 1:1
   * with blood drawn back through the sheath (`mixWithBlood`, default true): verapamil, glyceryl trinitrate or
   * both, at the session's sourced doses (the orders 'verapamil' and 'gtn').
   */
  sideArmVasodilator(kind: "verapamil" | "gtn" | "both" = "verapamil", o: { mixWithBlood?: boolean } = {}): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !this.sheath || this.radial?.sheathOut || this.busy) return false;
    const mix = o.mixWithBlood !== false;
    if (mix) {
      this.sheath.aspirated = true;
      this.logLine("action", "Blood drawn back through the side arm and mixed 1:1 with the vasodilator.");
    }
    let given = false;
    if (kind === "verapamil" || kind === "both") given = !!this.order("verapamil") || given;
    if (kind === "both") this.runPendingQuietly();
    if (kind === "gtn" || kind === "both") given = !!this.order("gtn") || given;
    if (!given) return false;
    const rc = this.rescueOf(st);
    rc.vasodilatorAt = round(this.tS, 10);
    rc.mixedWithBlood = mix;
    return true;
  }

  /** Let a queued step finish before the next order of one action (each order takes time and refuses while busy). */
  private runPendingQuietly(): void {
    let guard = 0;
    while (this.busy && guard++ < 1000) this.tick(0);
  }

  /** Warm blankets or gauze soaked in warm sterile saline over the forearm (spasm rescue). */
  warmForearm(): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !this.sheath || this.radial?.sheathOut || this.busy) return false;
    const rc = this.rescueOf(st);
    if (rc.warmedAt === null) rc.warmedAt = round(this.tS, 10);
    this.spend(60, "Warming the forearm");
    this.logLine("action", "Warm saline-soaked gauze and a warm blanket over the forearm.");
    return true;
  }

  /** A lubricious solution around the sheath at the skin (spasm rescue). */
  lubricateSheath(): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !this.sheath || this.radial?.sheathOut || this.busy) return false;
    const rc = this.rescueOf(st);
    if (rc.lubricatedAt === null) rc.lubricatedAt = round(this.tS, 10);
    this.spend(30, "Lubricating the sheath");
    this.logLine("action", "Lubricious solution applied around the sheath at the skin.");
    return true;
  }

  /**
   * An upper-arm cuff inflated above systolic for 5 minutes and then let down (spasm rescue: the ischaemia relaxes
   * the artery; RADIAL_SPASM_RESCUE.cuffMin from the module text). The 5 minutes pass as a time-lapse.
   */
  upperArmCuff(): boolean {
    const st = this.activeSite;
    if (st.siteKind !== "radial" || !this.sheath || this.radial?.sheathOut || this.busy) return false;
    const sys = Math.round(this.mapSys().sys);
    this.logLine("action", `Upper-arm cuff inflated above systolic (${sys} mmHg) for ${RADIAL_SPASM_RESCUE.cuffMin} minutes.`);
    this.spend(RADIAL_SPASM_RESCUE.cuffMin * 60, "Upper-arm cuff above systolic", () => {
      this.rescueOf(st).cuffDownAt = round(this.tS, 10);
      this.logLine("action", "Cuff let down.");
    });
    return true;
  }

  /**
   * Put the radial band on over the sheath (inflated to `ml`) with its centre at `centreX` (site x, mm; by default
   * over the arterial hole, the autopilot's clean technique), then pull the sheath out under it.
   */
  applyBand(ml: number, centreX?: number): void {
    if (this.access === "femoral" || !this.sheath || this.radial || this.busy) return;
    if (this.catheter?.inBody) {
      this.say("Take the catheter out first.", "technique");
      return;
    }
    // closing the wrist ends the case at this artery: heparin still held for the root is scored as missed
    this.radialHeparinMissed();
    const g = this.radialPunctureGeometry();
    const holeX = g?.holeX ?? 0;
    const skinX = g?.skinX ?? holeX;
    const c = this.clampBandX(centreX ?? holeX, skinX);
    this.radial = {
      kind: "radial-band",
      volumeMl: ml,
      appliedAt: this.tS,
      sheathOut: false,
      sheathOutAt: null,
      ulnarCompression: false,
      checks: [],
      patentDocumented: false,
      oozeMl: 0,
      bandOffAt: null,
      centreX: c,
      skinX,
      holeX,
      second: null,
      forearmMl: 0,
      wristMl: 0,
      pullAttempts: 0,
      gripped: false,
      forced: false,
      avulsed: false,
      offsetAtPullMm: null,
    };
    this.spend(MP_SESSION.bandS, "Applying the radial band");
    this.logLine("action", `Radial band applied over the sheath, ${bandFromNick(c - skinX)}, and inflated with ${ml} mL.`);
  }

  /** A band centre kept on the wrist (site x, mm): from 25 mm below the skin nick to 40 mm above it (a display and control range). */
  private clampBandX(x: number, skinX: number): number {
    return Math.round(Math.max(skinX - 25, Math.min(skinX + 40, x)) * 2) / 2;
  }

  /**
   * Move the band along the wrist (its centre to site x `centreX`, mm). With the sheath out this is letting it down,
   * moving it and inflating it again to the same volume.
   */
  setBandPosition(centreX: number): boolean {
    const r = this.radial;
    if (!r || r.bandOffAt !== null || this.busy) return false;
    const skinX = r.skinX ?? r.holeX ?? 0;
    r.centreX = this.clampBandX(centreX, skinX);
    if (r.sheathOut) {
      this.spend(30, "Moving the band");
      this.logLine("action", `Band let down, moved to ${bandFromNick(r.centreX - skinX)} and inflated again to ${r.volumeMl} mL.`);
    }
    return true;
  }

  /**
   * A second band placed against the proximal edge of the first (Oxford ch 3, for a haematoma just proximal to
   * the band; Brilakis: reposition or add a second band), inflated with `ml` (default the first band's volume).
   */
  addSecondBand(ml?: number): boolean {
    const r = this.radial;
    if (!r || r.second || r.bandOffAt !== null || this.busy) return false;
    const v = Math.max(0, Math.min(MP_BAND.maxMl, ml ?? r.volumeMl));
    const hole = r.holeX ?? r.centreX ?? 0;
    r.second = { volumeMl: Math.round(v * 2) / 2, centreX: (r.centreX ?? hole) + MP_BAND_POSITION.secondBandSpacingMm, at: round(this.tS, 10) };
    this.spend(MP_SESSION.bandS, "Applying a second band");
    this.logLine("action", `Second band placed against the proximal edge of the first and inflated with ${r.second.volumeMl} mL.`);
    return true;
  }

  /**
   * Pull the sheath out under the band, gently. A sheath gripped by spasm does not come (the artery's tone at
   * MP_RADIAL_CLOSURE.gripAt or above): the operator feels it held, the patient feels it, and it stays in.
   * Returns 'out', 'gripped', or null when there is nothing to pull.
   */
  pullRadialSheath(): "out" | "gripped" | null {
    const r = this.radial;
    if (!r || r.sheathOut || !this.sheath || this.busy) return null;
    r.pullAttempts = (r.pullAttempts ?? 0) + 1;
    if (this.sheathGrippedNow()) {
      r.gripped = true;
      this.tipEvents.hold(["radial-spasm"], undefined, "case");
      this.patient.stimulus("radial-spasm", 0.6);
      this.complication("radial-spasm", "Radial artery spasm", "minor");
      this.logLine("result", "The sheath will not come: it is held fast, and the patient winces as you pull.");
      this.say("It is gripped. Do not pull harder: release the spasm first.", "safety");
      return "gripped";
    }
    this.sheathOutUnderBand();
    return "out";
  }

  /**
   * Pull the sheath out by force. Through a gripping spasm this avulses the radial artery (Brilakis 11.2.4,
   * 29.2.3: 'Never pull hard'): a critical error, and a forearm haematoma follows (scheduleDelayed's `avulsion`).
   */
  forceRadialSheath(): "out" | "avulsed" | null {
    const r = this.radial;
    if (!r || r.sheathOut || !this.sheath || this.busy) return null;
    r.pullAttempts = (r.pullAttempts ?? 0) + 1;
    r.forced = true;
    const gripped = this.sheathGrippedNow();
    if (gripped) {
      r.gripped = true;
      r.avulsed = true;
      this.patient.stimulus("radial-spasm", 1);
      this.critical("radial-avulsion", "Radial artery avulsed by forced sheath removal through spasm");
      this.raiseTip("radial-spasm");
      this.raiseTip("bleeding");
      this.logLine("result", "The sheath tears free; the patient cries out with pain along the forearm.");
      // the forearm swells at once, where the operator can inspect it (pm-engaging lab request 4); the scheduled
      // haematoma (finishRadialClosure) carries its progression in recovery
      r.forearmMl = Math.max(r.forearmMl ?? 0, MP_BAND_POSITION.visibleSwellingMl);
      this.tipEvents.hold(["haematoma"], undefined, "case");
      this.logLine("result", "A tense swelling is coming up along the forearm above the band.");
      this.say("Stop. Pulling a gripped sheath out by force can avulse the radial artery: watch the forearm now.", "safety", { critical: true });
    }
    this.sheathOutUnderBand();
    return gripped ? "avulsed" : "out";
  }

  /** The sheath is out under the band: the removal's decisions, what the wrist shows, the hook. */
  private sheathOutUnderBand(): void {
    const r = this.radial!;
    const st = this.activeSite;
    r.sheathOut = true;
    r.sheathOutAt = this.tS;
    const hole = r.holeX ?? r.centreX ?? 0;
    r.offsetAtPullMm = round((r.centreX ?? hole) - hole, 10);
    this.pm.removeSheath();
    if (!r.avulsed) this.tipEvents.clear("radial-spasm");
    this.logLine("action", r.forced ? "Sheath pulled out by force under the band." : "Sheath removed under the band.");
    this.decideRadialRemoval(st, r);
    const b = this.bandNow();
    const seen = b?.bleeding ? bleedText(b.bleedSite, r.forearmMl ?? 0) : "";
    if (seen) this.logLine("result", seen);
    this.fireHook("sheath-pull");
  }

  /** The radial sheath's removal, scored when it comes out (access-closure-radial; pm-closure-radial). */
  private decideRadialRemoval(st: AccessSiteState, r: RadialClosure): void {
    const waited = st.radialSeq.closureWaitS ?? 0;
    this.decide({
      id: this.siteDecisionId("radial-sheath-out-now"),
      stage: "closure",
      label: "Radial sheath out at the end of the case, whatever the ACT",
      correct: waited <= 0,
      expected: "Out as soon as the case ends, even with a high ACT or an intravenous antiplatelet infusion running; a radial sheath is not left in for the ACT to fall",
      given: waited > 0 ? `Waited ${Math.round(waited / 60)} min with the sheath in` : "Out without waiting",
      lessonId: "pm-closure-radial",
      tipIds: ["access-radial-remove-now"],
    });
    const off = r.offsetAtPullMm ?? 0;
    const skin = (r.centreX ?? 0) - (r.skinX ?? r.centreX ?? 0);
    this.decide({
      id: this.siteDecisionId("radial-band-position"),
      stage: "closure",
      label: "Band centred over the arterial hole, just proximal to the skin nick",
      correct: Math.abs(off) <= MP_BAND_POSITION.flatHalfMm,
      expected: `Over the arterial hole, which lay ${Math.round((r.holeX ?? 0) - (r.skinX ?? 0))} mm above the skin nick`,
      given: `${bandFromNick(skin)[0].toUpperCase()}${bandFromNick(skin).slice(1)}: ${Math.abs(Math.round(off))} mm ${off < 0 ? "distal" : "proximal"} to the hole`,
      lessonId: "pm-closure-radial",
      tipIds: ["access-radial-band-inflation", "access-cx-radial-band-proximal"],
    });
    this.decide({
      id: this.siteDecisionId("radial-sheath-traction"),
      stage: "closure",
      label: "No forceful traction on the radial sheath",
      correct: !r.forced,
      expected: "A gripped sheath released first (vasodilator, sedation, warmth, a lubricious solution, an upper-arm cuff for 5 minutes), then withdrawn gently",
      given: r.forced ? (r.avulsed ? "Pulled out by force through spasm: the artery was avulsed" : "Pulled out by force") : r.gripped ? "Gripped; released, then withdrawn gently" : "Withdrawn gently",
      lessonId: r.gripped ? "pm-engaging-spasm" : "pm-closure-radial",
      tipIds: ["access-radial-spasm-no-traction"],
    });
  }

  setBandVolume(ml: number): void {
    if (!this.radial || this.radial.bandOffAt !== null) return;
    const v = Math.max(0, Math.min(MP_BAND.maxMl, ml));
    this.radial.volumeMl = Math.round(v * 2) / 2;
    const st = this.bandNow();
    const seen = st?.bleeding ? bleedText(st.bleedSite, this.radial.forearmMl ?? 0) : "";
    this.logLine("action", `Band ${this.radial.volumeMl} mL.${seen ? ` ${seen}` : ""}`);
  }

  setUlnarCompression(on: boolean): void {
    if (!this.radial) return;
    this.radial.ulnarCompression = on;
    this.logLine("action", on ? "Ulnar artery compressed at the wrist." : "Ulnar compression released.");
  }

  /**
   * The finger pleth now (the pulse oximeter on the index finger): with the ulnar artery compressed it shows the
   * radial artery under the band, lost when the band occludes it and back when it is loosened. A monitor reading.
   */
  plethNow(): { cls: BarbeauClass; amplitude: number } {
    const r = this.radial;
    const th = r ? this.bandThresholds() : undefined;
    return plethNow({ band: r && r.bandOffAt === null ? this.bandNow() : null, ulnarCompressed: !!r?.ulnarCompression && r.bandOffAt === null, radialOccluded: r?.bandOffAt != null && !!this.radialOccluded, th });
  }

  /** Pulse oximeter on the index finger, ulnar artery compressed: is the radial artery open under the band? */
  plethCheck(): { cls: BarbeauClass; bleeding: boolean } | null {
    if (!this.radial || this.busy) return null;
    const th = this.bandThresholds();
    const st = this.bandNow() ?? bandStatus(this.radial.volumeMl, th, this.radial.sheathOut);
    const r = plethWithUlnarCompression(st, false, th);
    const res = { t: this.tS, cls: r.cls, bleeding: st.bleeding };
    this.radial.checks.push(res);
    if (this.radial.sheathOut && r.cls !== "D" && !st.bleeding) this.radial.patentDocumented = true;
    this.spend(MP_SESSION.plethCheckS, "Pleth check with ulnar compression");
    this.logLine("result", r.cls === "D" ? "Pleth lost with the ulnar artery compressed: the band is occluding the radial artery." : `Pleth present with the ulnar artery compressed (pattern ${r.cls})${st.bleeding ? ", but the site oozes" : ""}.`);
    return { cls: r.cls, bleeding: st.bleeding };
  }

  /**
   * Femoral: an angiogram through the sheath in the groin (Brilakis 4.2, step 15), `ml` of contrast (default
   * MP_UPSIZING.angioDefaultMl) in the C-arm view `laoDeg` (+ LAO; default the fluoroscopy view's) at
   * `magnified` or not. It is scored on the view (the ipsilateral oblique, 20-30 degrees), the magnification
   * (low), the volume (5-10 mL), the wire in the aorta and the waveform checked first. What it shows is read
   * on the image and reported (submitFemoralAngioReport): the returned line says only what was done.
   */
  femoralAngiogram(o: { ml?: number; laoDeg?: number; magnified?: boolean } = {}): string | null {
    if (this.access !== "femoral" || !this.sheath || this.activeSite.siteKind === "femoral-vein" || this.busy) return null;
    const st = this.activeSite;
    const [p0, p1] = MP_UPSIZING.puffClampMl;
    const ml = Math.round(Math.max(p0, Math.min(p1, o.ml ?? MP_UPSIZING.angioDefaultMl)) * 10) / 10;
    const laoDeg = o.laoDeg ?? this.laoDeg;
    const magnified = o.magnified ?? this.magnified;
    const wireIn = st.up.wireLeftIn && !this.catheter?.inBody;
    const waveform = this.sheath.waveform ?? null;
    if (!this.sheathPuff(ml)) return null;
    st.femoralAngio = { t: round(this.tS, 10), ml, laoDeg, magnified, wireIn, waveform };
    if (this.femoral) this.femoral.angiogram = true;
    this.femoralAngio = true;
    // the technique is scored only on an angiogram taken in a stated C-arm view (the fluoroscopy workspace
    // always gives one); a call without a view (another screen) is not scored against a view left from before
    if (o.laoDeg !== undefined) this.fireAngioDecision(st);
    const view = laoDeg === 0 ? "AP" : `${laoDeg > 0 ? "LAO" : "RAO"} ${Math.abs(Math.round(laoDeg))}`;
    const text = `Femoral angiogram: ${ml} mL through the sheath in ${view}${magnified ? ", magnified" : ""}. Read the groin on the image and report it.`;
    this.logLine("action", text);
    this.emit("femoral-angiogram", { ml, laoDeg, magnified, wireIn, waveform });
    return text;
  }

  /** Femoral: pull the sheath and compress by hand for `minutes`, `positionErrorMm` from the arteriotomy. */
  femoralManual(minutes: number, positionErrorMm: number): void {
    if (this.access !== "femoral" || this.activeSite.siteKind === "femoral-vein" || !this.sheath || this.femoral || this.busy || this.held) return;
    if (this.catheter?.inBody) return void this.say("Take the catheter out first.", "technique");
    const act = this.actTrue();
    if (act > FEMORAL.actForSheathPullS) this.say(`The ACT is about ${Math.round(act)} s. Sheaths come out once it is under ${FEMORAL.actForSheathPullStrictS}-${FEMORAL.actForSheathPullS} s.`, "safety");
    if (this.acts.length === 0 && this.heparinU > 0) this.say("You pulled the sheath without checking the ACT.", "technique");
    const risk = femoralRisk(this.femoralFactors("manual", act, minutes, positionErrorMm));
    this.femoral = { kind: "femoral", method: "manual", startedAt: this.tS, minutes, positionErrorMm, actAtPull: act, deviceFailed: false, angiogram: this.femoralAngio, risk };
    this.decideFemoralAct(act);
    const over = positionErrorMm < 6;
    const long = minutes >= FEMORAL.manualMinutes;
    this.decide({
      id: this.siteDecisionId("femoral-compression"),
      stage: "closure",
      label: "Manual compression over the arteriotomy for long enough",
      correct: over && long,
      expected: `Fingers above the skin nick, over the arteriotomy, for at least ${FEMORAL.manualMinutes} min`,
      given: `${over ? "Over the arteriotomy" : `${Math.round(positionErrorMm)} mm from the arteriotomy`}, ${minutes} min`,
      lessonId: "pm-closure-femoral-compression",
      tipIds: ["access-compression-hands-above"],
    });
    this.pm.removeSheath();
    this.fireHook("sheath-pull");
    this.logLine("action", `Sheath removed; manual compression for ${minutes} min, ${positionErrorMm < 6 ? "over the arteriotomy" : `${Math.round(positionErrorMm)} mm from the arteriotomy`}.`);
    const site = this.activeSite;
    this.spend(minutes * 60, `Manual compression (${minutes} min)`, () => this.afterClosure(site), true);
  }

  /**
   * Femoral: a closure device (fails sometimes; then manual compression). With `kind` (the closure plan of
   * access-closure-femoral-manual) the device class is graded against the algorithm, unless chooseClosure
   * already did (`chosen`), and the skin preparation before it is scored; without it, as before.
   */
  femoralDevice(kind?: "suture-device" | "collagen-plug", chosen = false): void {
    if (this.access !== "femoral" || this.activeSite.siteKind === "femoral-vein" || !this.sheath || this.femoral || this.busy || this.held) return;
    if (this.gated("femoralDevice", { kind })) return;
    if (this.catheter?.inBody) return void this.say("Take the catheter out first.", "technique");
    if (kind && !chosen) this.scoreClosureChoice(kind);
    if (kind)
      this.decide({
        id: this.siteDecisionId("femoral-device-skin-prep"),
        stage: "closure",
        label: "Skin prepared again before the closure device",
        correct: this.skinReprepAt !== null,
        expected: "The groin prepared again with antiseptic immediately before the device",
        given: this.skinReprepAt !== null ? "Prepared again" : "Not prepared again",
        lessonId: "pm-closure-plan",
        tipIds: ["access-closure-reprep-skin"],
      });
    const act = this.actTrue();
    const failed = this.rng.next() < FEMORAL.deviceFailure;
    const stick = this.pm.arteriotomyClass();
    if (!this.femoralAngio) this.say("No femoral angiogram before the device? You do not know where the sheath enters the artery.", "technique");
    const risk = femoralRisk(this.femoralFactors(failed ? "manual" : "device", act, failed ? 15 : 0, 0));
    this.femoral = { kind: "femoral", method: failed ? "manual" : "device", startedAt: this.tS, minutes: failed ? 15 : 0.01, positionErrorMm: 0, actAtPull: act, deviceFailed: failed, angiogram: this.femoralAngio, risk };
    if (stick !== "ok") this.say("A closure device in a high or low puncture is a problem.", "safety");
    this.decide({
      id: this.siteDecisionId("femoral-angiogram"),
      stage: "closure",
      label: "Femoral angiogram read before a closure device",
      correct: this.femoralAngio,
      expected: "Sheath angiogram showing where the sheath enters the artery",
      given: this.femoralAngio ? "Angiogram read first" : "Device without an angiogram",
      lessonId: "pm-closure-plan",
      tipIds: ["access-closure-device-criteria"],
    });
    this.pm.removeSheath();
    this.fireHook("sheath-pull");
    this.logLine("action", failed ? "The closure device failed; manual compression for 15 min." : "Closure device deployed; haemostasis.");
    const site = this.activeSite;
    this.spend(MP_SESSION.deviceS + (failed ? 900 : 0), failed ? "Device failed: manual compression" : "Deploying the closure device", () => this.afterClosure(site), failed);
  }

  /**
   * Manual compression waits for the ACT (FEMORAL thresholds, sourced): measured and under the
   * threshold. Without heparin there is nothing to wait for (the same rule femoralManual says aloud).
   */
  private decideFemoralAct(act: number): void {
    const noHeparin = this.heparinU === 0;
    const measured = this.acts.length > 0 || noHeparin;
    const low = act <= FEMORAL.actForSheathPullS;
    this.decide({
      id: this.siteDecisionId("femoral-act"),
      stage: "closure",
      label: "ACT checked before the femoral sheath came out",
      correct: measured && low,
      expected: `ACT measured and under ${FEMORAL.actForSheathPullStrictS}-${FEMORAL.actForSheathPullS} s before manual compression`,
      given: noHeparin ? "No heparin given" : !measured ? "Pulled without an ACT" : low ? "Measured and low enough" : "Pulled with the ACT still high",
      lessonId: "pm-antithrombotics-heparin",
      tipIds: ["access-femoral-sheath-act"],
    });
  }

  private femoralFactors(method: "manual" | "device", act: number, minutes: number, err: number) {
    const cls = this.pm.arteriotomyClass();
    return {
      method,
      actAtPullS: act,
      minutes,
      positionErrorMm: err,
      stick: (cls === "high" ? "high" : cls === "low" ? "low" : "ok") as "ok" | "high" | "low",
      backWalls: this.pm.st.backWalls,
      fr: this.catheterFr(),
      anticoagulated: this.profile.anticoagulation !== "none",
      angiogramBeforeDevice: this.femoralAngio,
    };
  }

  /** The arteriotomy is cranial to the skin entry by depth / tan(angle): where to press (mm from the skin nick). */
  arteriotomyOffsetMm(): number {
    const n = this.pm.st.needle;
    const ax = this.pm.st.arteriotomy;
    if (!n || !ax) return 0;
    return ax.x - n.entryX;
  }

  // -------------------------------------------------------------------------
  // femoral closure plan (access-closure-femoral-manual; pm-closure-plan)
  // -------------------------------------------------------------------------

  /** A closure scenario's end-of-case context (public, for scenario start states). */
  setClosureContext(c: Partial<ClosureContext>): void {
    this.closureContext = { ...this.closureContext, ...c };
  }

  /**
   * A closure scenario's start state: the team's puncture entered at site x `x` (and `vessel`, default the
   * artery it entered), the needle track moved with it so the skin nick keeps its distance below the
   * arteriotomy. Only with the sheath in and the catheter out at a femoral artery site (public, for
   * scenario start states).
   */
  relocateTeamPuncture(o: { x: number; vessel?: string }): boolean {
    const st = this.activeSite;
    const ax = this.pm.st.arteriotomy;
    if (st.siteKind !== "femoral" || !this.sheath || this.catheter?.inBody || !ax) return false;
    const d = o.x - ax.x;
    const vessel = o.vessel ?? ax.vessel;
    if (!st.site.tubes.some((t) => t.id === vessel)) return false;
    for (const h of this.pm.st.holes) if (h.vessel === ax.vessel && h.plugged && !h.back) {
      h.x += d;
      h.vessel = vessel;
    }
    this.pm.st.arteriotomy = { x: o.x, vessel };
    if (this.pm.st.needle) this.pm.st.needle.entryX += d;
    return true;
  }

  /** The end-of-case state the closure algorithm reads (the ACT and pressure now, the sheath, the context). */
  closureEndState(): ClosureEndState {
    const { sys } = this.mapSys();
    return {
      actS: this.actTrue(),
      sysMmHg: sys,
      sheathFr: this.sheath ? SHEATHS[this.sheath.id].fr : this.activeSite.closure.compression?.fr ?? 6,
      sheathLengthCm: this.sheath?.lengthCm ?? 10,
      stagedPciSoon: this.closureContext.stagedPciSoon,
      supportDeviceLikely: this.closureContext.supportDeviceLikely,
      oozeAroundSheath: this.closureContext.oozeAroundSheath,
    };
  }

  /**
   * The end-of-case state the learner's decisions are graded against: the ACT is the one the operator
   * knows (the last measurement since the last heparin), the true ACT only when none was measured. The
   * outcome model keeps the true ACT.
   */
  private decisionEndState(): ClosureEndState {
    const st = this.closureEndState();
    const known = this.knownAct();
    return known === null ? st : { ...st, actS: known };
  }

  /**
   * What the femoral angiogram shows at the active femoral artery site's entry (the truth the closure plan
   * is graded against): femoralAngioTruth with the branch, the high stick (above the ligament model's line
   * or the lowest point of the inferior epigastric artery), calcium as heavy calcium, and the context's
   * atheroma and old plug. Null at another site or without an arteriotomy.
   */
  closureAnatomy(): ClosureAnatomy | null {
    const st = this.activeSite;
    const ax = this.pm.st.arteriotomy;
    if (st.siteKind !== "femoral" || !ax) return null;
    const cls = this.pm.arteriotomyClass();
    const t = femoralAngioTruth(st.site, ax, cls);
    const branch = ax.vessel !== st.site.arteryId && ax.vessel !== "sfa" && ax.vessel !== "pfa";
    return {
      highStick: cls === "high" || t.iea === "above",
      atOrBelowBifurcation: t.bifurcation === "at-or-below" && !branch,
      inBranch: branch,
      over5mm: t.over5mm && !branch,
      atheroma: this.closureContext.atheroma,
      heavyCalcium: st.site.calcium.length > 0,
      oldPlug: this.closureContext.oldPlugDays !== null && this.closureContext.oldPlugDays <= CLOSURE_ALGORITHM.recentPlugDays,
    };
  }

  /** The learner's answers to the four questions at the active femoral site, graded in order and recorded. */
  answerClosureQuestions(ans: ClosureAnswers): AnswerGrade | null {
    const a = this.closureAnatomy();
    if (!a || this.siteClosed(this.activeSite)) return null;
    const grade = gradeClosureAnswers(ans, closureAlgorithm(this.decisionEndState(), a));
    const plan = (this.activeSite.closure.plan ??= { answers: null, choice: null });
    const scored = !!plan.answers;
    plan.answers = grade;
    if (!scored)
      this.decide({
        id: this.siteDecisionId("femoral-closure-algorithm"),
        stage: "closure",
        label: "The femoral closure algorithm's four questions, in order",
        correct: grade.correct,
        expected: grade.items.map((i) => `${i.label} ${i.expected}`).join("; "),
        given: grade.items.map((i) => `${i.label} ${i.given}`).join("; "),
        lessonId: "pm-closure-plan",
        tipIds: ["access-closure-sheath-stays", "access-closure-device-criteria", "access-closure-high-stick"],
      });
    this.logLine("action", "Closure plan: the four questions answered.");
    return grade;
  }

  /**
   * Grade a closure choice now and record it (the closure the learner goes on to do). Only the first choice
   * at a site is scored: a later one returns the first's grade. The ACT rules are graded against the ACT
   * the learner knew (decisionEndState). The caution of an 'acceptable' choice is said only as a guided aid;
   * otherwise it is left to the ledger and the debrief.
   */
  private scoreClosureChoice(choice: ClosureChoice): ChoiceGrade | null {
    const a = this.closureAnatomy();
    if (!a) return null;
    const plan = (this.activeSite.closure.plan ??= { answers: null, choice: null });
    if (plan.choice) return plan.choice.grade;
    const grade = gradeClosureChoice(this.decisionEndState(), a, choice);
    plan.choice = { choice, grade, t: round(this.tS, 10) };
    this.decide({
      id: this.siteDecisionId("femoral-closure-choice"),
      stage: "closure",
      label: "Femoral closure chosen by the algorithm",
      correct: grade.verdict !== "wrong",
      expected: grade.expected,
      given: `${CLOSURE_CHOICE_LABEL[choice]}${grade.reasons.length ? ` (${grade.reasons.join(" ")})` : ""}`,
      lessonId: "pm-closure-plan",
      tipIds: ["access-closure-device-criteria", "access-closure-high-stick", "access-closure-sheath-stays"],
    });
    if (grade.verdict === "acceptable" && this.policy.overlays.labels) for (const r of grade.reasons) this.say(r, "technique");
    return grade;
  }

  /**
   * The closure the learner chooses at the active femoral site, graded against the algorithm. Keeping the
   * sheath sutures it in (a long sheath swapped for a short one) and closes the site for now; waiting
   * sutures it in until the ACT falls; a device deploys it (femoralDevice); hand compression is then done
   * with the hands (startCompression). Null where no femoral closure can be chosen.
   */
  chooseClosure(choice: ClosureChoice): ChoiceGrade | null {
    if (this.access !== "femoral" || this.activeSite.siteKind !== "femoral" || !this.sheath || this.busy || this.siteClosed(this.activeSite)) return null;
    if (this.catheter?.inBody) {
      this.say("Take the catheter out first.", "technique");
      return null;
    }
    const prior = this.activeSite.closure.plan?.choice ?? null;
    if (prior) {
      // the first choice stands; the one change of plan is hand compression once a wait has let the ACT fall
      if (prior.choice === "wait-then-compress" && choice === "manual-compression") return this.decideCompressAfterWait();
      this.logLine("action", `The closure plan stands: ${CLOSURE_CHOICE_LABEL[prior.choice].toLowerCase()}.`);
      return prior.grade;
    }
    const grade = this.scoreClosureChoice(choice);
    if (!grade) return null;
    if (choice === "keep-suture") this.keepSheathSutured();
    else if (choice === "wait-then-compress") {
      this.spend(MP_SESSION.sheathS, "Suturing the sheath to the skin");
      this.logLine("action", "Sheath sutured in place; the ACT to be rechecked before it comes out.");
    } else if (choice === "suture-device" || choice === "collagen-plug") this.femoralDevice(choice, true);
    else this.logLine("action", "Closure: the sheath to come out under manual compression.");
    return grade;
  }

  /**
   * After 'wait, then compress': the sheath to come out by hand now, recorded as its own item, graded on
   * the ACT the learner knows (question 4: below 180 s).
   */
  private decideCompressAfterWait(): ChoiceGrade | null {
    const a = this.closureAnatomy();
    if (!a) return null;
    const grade = gradeClosureChoice(this.decisionEndState(), a, "manual-compression");
    const known = this.knownAct();
    this.decide({
      id: this.siteDecisionId("femoral-closure-after-wait"),
      stage: "closure",
      label: "After the wait: hand compression once the ACT had fallen",
      correct: grade.verdict !== "wrong" && known !== null,
      expected: `A measured ACT below ${CLOSURE_ALGORITHM.manualActS} s before the sheath comes out by hand`,
      given: known === null ? "Compression chosen without a measured ACT" : `Compression chosen at a measured ACT of ${Math.round(known)} s`,
      lessonId: "pm-closure-plan",
      tipIds: ["access-femoral-sheath-act"],
    });
    this.logLine("action", "Closure: the sheath to come out under manual compression after the wait.");
    return grade;
  }

  /** Prepare the groin again with antiseptic before a closure device (Brilakis 11.1 and 29.1). */
  reprepSkin(): void {
    if (this.busy) return;
    this.skinReprepAt = round(this.tS, 10);
    this.spend(MP_SESSION.chartItemS, "Preparing the groin again");
    this.logLine("action", "The groin prepared again with antiseptic.");
  }

  /** Keep the femoral sheath in, sutured, swapped for a short one when long (question 1); the site is closed for now. */
  private keepSheathSutured(): void {
    const st = this.activeSite;
    const sh = this.sheath;
    if (!sh) return;
    const swap = keptSheathSwap(sh.lengthCm ?? 10);
    if (swap !== null) sh.lengthCm = swap as SheathLengthCm;
    st.closure.kept = { t: round(this.tS, 10), swappedToCm: swap };
    this.spend(MP_SESSION.sheathS + (swap !== null ? MP_SESSION.sheathS : 0), "Suturing the sheath in");
    this.logLine("action", `Sheath kept in and sutured to the skin${swap !== null ? `, exchanged for a ${swap} cm sheath` : ""}.`);
    this.onSiteClosed(st);
  }

  // -------------------------------------------------------------------------
  // hands-on manual compression (access-closure-femoral-manual; pm-closure-femoral-compression)
  // -------------------------------------------------------------------------

  /** Brilakis's or Oxford's rule for the ACT and the timer. */
  setCompressionRule(r: CompressionRule): void {
    this.compressionRule = r;
  }

  /**
   * Confirm a preparation item before the femoral sheath comes out. The saline and the vagal kit are given
   * through the emergencies module when it is attached (so its vagal prevention follows them); the
   * monitoring sets the cuff cycling every minute; the blood pressure item reads the cuff. Returns what was
   * done, or null.
   */
  confirmPrep(item: PrepItem): string | null {
    if (this.busy) return null;
    const em = this.mod("emergencies") as { actions?: { order?: (id: string) => { ok: boolean; text: string } } } | undefined;
    let text = PREP_CHECKLIST.find((p) => p.id === item)?.label ?? item;
    if (item === "saline" && em?.actions?.order) em.actions.order("saline-drip");
    if (item === "vagal-kit" && em?.actions?.order) {
      em.actions.order("atropine-ready");
      em.actions.order("fluid-ready");
    }
    if (item === "monitoring") cycleCuff(this, 1);
    if (item === "bp") {
      const { sys, map } = this.mapSys();
      text = `Cuff ${Math.round(sys)}/${Math.round(map)} mmHg (systolic/mean)`;
    }
    if (this.prep[item] === null) this.prep[item] = round(this.tS, 10);
    this.logLine("action", `Before the sheath comes out: ${text}.`);
    return text;
  }

  /**
   * Lower a raised blood pressure before the sheath comes out: a titratable agent according to local
   * protocol (the lesson names no drug or dose, so neither is given here); its effect is a MODEL PARAMETER.
   */
  lowerBloodPressure(): boolean {
    if (this.busy) return false;
    this.bpLoweredUntil = this.tS + MP_COMPRESSION.bpLoweringS;
    this.applyVasodilation();
    this.spend(MP_SESSION.drugS, "Lowering the blood pressure");
    this.logLine("action", "A titratable antihypertensive given, according to local protocol.");
    return true;
  }

  /**
   * Protamine to reverse heparin before the sheath comes out (Brilakis 11.1; pm-closure-femoral-compression):
   * refused while a catheter or wire is in (all coronary equipment out first); a dose above 50 mg is capped
   * at 50 mg and scored wrong, as is a dose outside 1-1.5 mg per 100 U of the heparin given. After stenting
   * the stent-thrombosis caution is said. A hypotensive reaction may follow 5-10 minutes later, more likely
   * with a fast injection (its chance is a MODEL PARAMETER).
   */
  giveProtamine(mg: number, rate: "slow" | "fast" = "slow"): ProtamineGrade | null {
    if (this.busy || !(mg > 0)) return null;
    const equipmentIn = !!this.catheter?.inBody || this.wireInBody;
    const grade = gradeProtamine({ mg, heparinU: this.heparinU, equipmentIn });
    this.decide({
      id: "protamine-dose",
      stage: "closure",
      label: "Protamine: only with the coronary equipment out, dosed to the heparin, no more than 50 mg",
      correct: grade.correct && rate === "slow",
      expected: `${grade.expected}`,
      given: grade.refused ? "Ordered with a catheter or wire still in" : `${grade.givenMg} mg ${rate === "slow" ? "slowly" : "fast"}${grade.reasons.length ? ` (${grade.reasons.join(" ")})` : ""}`,
      lessonId: "pm-closure-femoral-compression",
      tipIds: ["pci-protamine-only-after-equipment-out", "access-femoral-sheath-act"],
    });
    if (grade.refused) {
      this.say("Not while a catheter or wire is in: protamine only once all the equipment is out.", "safety");
      return grade;
    }
    if (this.labsDone.includes("pci") || this.handedOver === "pci") this.say("Reversing heparin after stenting carries a risk of stent thrombosis.", "safety");
    if (mg > COMPRESSION.protamineMaxMg) this.say(`Protamine is capped at ${COMPRESSION.protamineMaxMg} mg.`, "safety");
    this.patient.give({ drug: "protamine", dose: grade.givenMg, route: "iv" });
    this.protamine.push({ t: round(this.tS, 10), mg: grade.givenMg, rate, grade });
    const rng = (this.protamineRng ??= new SeededRng(`protamine:${this.seed}`));
    if (!this.protamineReaction && rng.next() < protamineReactionChance(rate)) {
      const [a, b] = COMPRESSION.protamineReactionAfterS;
      const from = this.tS + rng.range(a, b);
      this.protamineReaction = { from, to: from + MP_COMPRESSION.protamineReactionS };
    }
    this.orders.push({ id: "protamine", label: `Protamine ${grade.givenMg} mg IV`, t: this.tS, dose: grade.givenMg, unit: "mg", route: "IV" });
    this.spend(rate === "slow" ? MP_COMPRESSION.protamineSlowS : MP_SESSION.drugS, `Protamine ${grade.givenMg} mg ${rate === "slow" ? "slowly" : ""}`.trim());
    this.logLine("action", `Given: protamine ${grade.givenMg} mg IV${rate === "slow" ? ", slowly" : ""}.`);
    this.emit("order", { id: "protamine", dose: grade.givenMg, unit: "mg", route: "IV" });
    return grade;
  }

  /**
   * The loss of vascular tone of the session's own effects (the antihypertensive, a protamine reaction),
   * sent to the engine when it changes. The engine holds one value, which a hypotension cause run also
   * writes; so from the session's first effect on, the engine's setter is wrapped to send the larger of
   * the session's share and the other writers' last value, and neither wipes out the other.
   */
  private applyVasodilation(): void {
    let f = 0;
    if (this.bpLoweredUntil !== null && this.tS < this.bpLoweredUntil) f = Math.max(f, MP_COMPRESSION.bpLoweringVasodilation);
    const r = this.protamineReaction;
    const reacting = !!r && this.tS >= r.from && this.tS < r.to;
    if (reacting) f = Math.max(f, MP_COMPRESSION.protamineVasodilation);
    if (Math.abs(f - this.vasoOwn) < 1e-6) return;
    if (!this.vasoRaw && !(f > 0 && this.composeVasodilation())) return;
    if (f > 0 && this.vasoOwn < MP_COMPRESSION.protamineVasodilation && reacting) this.emit("protamine-reaction", {});
    this.vasoOwn = f;
    this.vasoRaw?.(Math.max(this.vasoOther, f));
  }

  /** Wrap the engine's vasodilation setter so other writers' values are kept beside the session's (false: the port has none). */
  private composeVasodilation(): boolean {
    const port = this.patient as unknown as { setVasodilation?: (x: number) => void; snapshot?: () => { form?: { vasodilation?: number } } };
    if (!port.setVasodilation) return false;
    const raw = port.setVasodilation.bind(port);
    this.vasoOther = port.snapshot?.().form?.vasodilation ?? 0;
    port.setVasodilation = (x: number) => {
      this.vasoOther = Math.max(0, x);
      raw(Math.max(this.vasoOther, this.vasoOwn));
    };
    this.vasoRaw = raw;
    return true;
  }

  /** The compression at the active site now (null: none started). */
  get compression(): CompressionState | null {
    return this.activeSite.closure.compression ?? null;
  }

  /**
   * Pull the femoral artery sheath under the fingers and start pressing (pm-closure-femoral-compression,
   * steps 4-6): `hands` from the skin nick (mm; default 2 cm above it at firm pressure). Scored now: the ACT
   * against the rule, the preparation, a raised pressure not lowered, and the closure choice if none was
   * made. The sheath-pull hook fires (a scenario's vagal reaction or tamponade look-alike begins here).
   */
  startCompression(hands: Partial<Hands> = {}): boolean {
    const st = this.activeSite;
    if (this.access !== "femoral" || st.siteKind !== "femoral" || !this.sheath || this.femoral || this.busy || this.siteClosed(st) || st.closure.compression) return false;
    if (this.catheter?.inBody) {
      this.say("Take the catheter out first.", "technique");
      return false;
    }
    const ax = this.pm.st.arteriotomy;
    const n = this.pm.st.needle;
    const hole = { xMm: ax && n ? ax.x - n.entryX : 0, yMm: 0 };
    const act = this.actTrue();
    const { sys } = this.mapSys();
    const fr = SHEATHS[this.sheath.id].fr;
    if (!st.closure.plan?.choice) this.scoreClosureChoice("manual-compression");
    else if (st.closure.plan.choice.choice === "wait-then-compress" && !this.decisions().some((d) => d.id === this.siteDecisionId("femoral-closure-after-wait"))) this.decideCompressAfterWait();
    this.decideCompressionAct(act);
    this.decidePrep(sys);
    st.closure.compression = freshCompression({ hole, fr, rule: this.compressionRule, hands: { xMm: hands.xMm ?? 20, yMm: hands.yMm ?? 0, pressure: hands.pressure ?? 0.65 }, t: this.tS, actS: act, sysMmHg: sys });
    // a provisional record while the hands are on (minutes 0: the site is not closed until the release), so the
    // emergencies module's removal drill sees a manual compression at the pull; the release replaces it
    this.femoral = { kind: "femoral", method: "manual", startedAt: this.tS, minutes: 0, positionErrorMm: 0, actAtPull: act, deviceFailed: false, angiogram: this.femoralAngio, risk: femoralRisk(this.femoralFactors("manual", act, 0, 0)) };
    st.sheathHistory = this.sheath.id;
    sheathRemoved(st.up);
    this.pm.removeSheath();
    this.sheath = null;
    this.tipEvents.clear("act-high");
    this.logLine("action", "Fingers on the groin; the sheath pulled with a small back-bleed, pressure held.");
    this.fireHook("sheath-pull");
    return true;
  }

  /** Move or press the fingers (mm from the skin nick; pressure 0..1). */
  setHands(h: Partial<Hands>): void {
    const c = this.compression;
    if (!c || c.releasedAt !== null) return;
    c.hands = { xMm: h.xMm ?? c.hands.xMm, yMm: h.yMm ?? c.hands.yMm, pressure: Math.max(0, Math.min(1, h.pressure ?? c.hands.pressure)) };
  }

  /** Keep the hands as they are for `minutes` (a time-lapse; the emergency orders stay available). */
  holdCompression(minutes: number): void {
    const c = this.compression;
    if (!c || c.releasedAt !== null || this.busy || this.held || !(minutes > 0)) return;
    this.spend(minutes * 60, `Holding pressure (${minutes} min)`, undefined, true);
  }

  /** What the operator feels and sees under the fingers now. */
  compressionFeel(): string | null {
    const c = this.compression;
    if (!c || c.releasedAt !== null) return null;
    return underTheFingers(c, this.actTrue(), this.mapSys().sys);
  }

  /** The compression's minutes so far, the rule's minutes, and whether the time has reached them (the timer the operator watches). */
  compressionTimer(): { minutes: number; requiredMin: number; text: string } | null {
    const c = this.compression;
    if (!c) return null;
    const minutes = Math.round((((c.releasedAt ?? this.tS) - c.startedAt) / 60) * 10) / 10;
    return { minutes, requiredMin: requiredMinutes(c.rule, c.fr), text: requiredMinutesText(c.rule, c.fr) };
  }

  /**
   * Lift the hands. Before the puncture holds it bleeds again (the hands come off, the plug is undone and the
   * compression goes on); once it holds the site is closed: the outcome model is drawn from the compression
   * and the delayed events scheduled. Returns whether it held, with the compression's summary.
   */
  releaseCompression(): { held: boolean; summary: CompressionSummary } | null {
    const st = this.activeSite;
    const c = st.closure.compression;
    if (!c || c.releasedAt !== null || this.busy) return null;
    const act = this.actTrue();
    if (!haemostatic(c, act)) {
      c.rebleeds += 1;
      c.plugMin = 0;
      c.hands = { ...c.hands, pressure: 0 };
      this.raiseTip("bleeding");
      this.logLine("result", "Blood wells up from the puncture as the fingers lift.");
      this.say("It is still bleeding. Press again, over the arterial hole, and hold.", "technique");
      return { held: false, summary: summariseCompression(c, this.tS) };
    }
    c.releasedAt = this.tS;
    const sum = summariseCompression(c, this.tS);
    const need = requiredMinutes(c.rule, c.fr);
    const cls = this.pm.arteriotomyClass();
    const risk = femoralRisk({
      method: "manual",
      actAtPullS: c.actAtPull,
      minutes: sum.minutes,
      positionErrorMm: sum.positionErrorMm,
      stick: cls === "high" ? "high" : cls === "low" ? "low" : "ok",
      backWalls: this.pm.st.backWalls,
      fr: c.fr,
      anticoagulated: this.profile.anticoagulation !== "none",
      angiogramBeforeDevice: this.femoralAngio,
      requiredMinutes: need,
      pressureAdequacy: sum.pressureAdequacy,
      sysAtPullMmHg: c.sysAtPull,
    });
    this.femoral = { kind: "femoral", method: "manual", startedAt: c.startedAt, minutes: sum.minutes, positionErrorMm: sum.positionErrorMm, actAtPull: c.actAtPull, deviceFailed: false, angiogram: this.femoralAngio, risk };
    const over = sum.over;
    const long = sum.minutes >= need;
    const firm = sum.pressureAdequacy >= 0.8 && sum.occlusiveMin <= MP_COMPRESSION.occlusiveMinForPulses;
    this.decide({
      id: this.siteDecisionId("femoral-compression"),
      stage: "closure",
      label: "Manual compression over the arteriotomy, firm, for long enough",
      correct: over && long && firm && c.rebleeds === 0,
      expected: `Fingers above the skin nick, over the arteriotomy, firm but not occlusive, for ${requiredMinutesText(c.rule, c.fr)} and until haemostasis`,
      given: `${over ? "Over the arteriotomy" : `Off the arteriotomy for ${sum.offTargetMin} of ${sum.minutes} min`} (fingers on average ${sum.positionErrorMm} mm from it${over && sum.offTargetMin > 0 ? `, off it for ${sum.offTargetMin} min` : ""}), enough pressure ${Math.round(sum.pressureAdequacy * 100)}% of the time${sum.occlusiveMin > 0 ? `, occlusive for ${sum.occlusiveMin} min` : ""}, ${sum.minutes} min${c.rebleeds ? `, lifted ${c.rebleeds} time(s) before it held` : ""}`,
      lessonId: "pm-closure-femoral-compression",
      tipIds: ["access-compression-hands-above", "access-compression-bleeding"],
    });
    if (sum.occlusiveMin > MP_COMPRESSION.occlusiveMinForPulses) this.complication("distal-pulses-reduced", "Foot pulses reduced after prolonged occlusive compression", "minor");
    this.logLine("action", `Pressure released after ${sum.minutes} min; the puncture holds.`);
    this.decideAftercare();
    this.afterClosure(st);
    return { held: true, summary: sum };
  }

  /** Look at and feel the groin after the compression (or during it). */
  checkGroin(): string | null {
    const st = this.activeSite;
    const c = st.closure.compression;
    if (!c) return null;
    const ml = c.haematomaMl + st.pm.st.haematomaMl;
    const text = ml >= MP_COMPRESSION.visibleHaematomaMl ? `A swelling in the groin, about ${Math.round(swellingCm(ml))} cm across.` : "The groin is soft, with no swelling.";
    const ac = (st.closure.aftercare ??= { groinT: null, pulsesT: null, dressingT: null });
    if (c.releasedAt !== null && ac.groinT === null) ac.groinT = round(this.tS, 10);
    this.spend(MP_SESSION.plethCheckS, "Checking the groin");
    this.logLine("result", text);
    if (c.releasedAt !== null) this.decideAftercare();
    return text;
  }

  /** Feel the foot pulses (dorsalis pedis and posterior tibial). */
  checkFootPulses(): string | null {
    const st = this.activeSite;
    const c = st.closure.compression;
    if (!c) return null;
    const text =
      c.releasedAt === null
        ? c.occluded
          ? "No foot pulses while you press."
          : "Foot pulses present while you press."
        : c.occlusiveS / 60 > MP_COMPRESSION.occlusiveMinForPulses
          ? "The foot pulses are weaker than before the compression."
          : "Foot pulses present.";
    const ac = (st.closure.aftercare ??= { groinT: null, pulsesT: null, dressingT: null });
    if (c.releasedAt !== null && ac.pulsesT === null) ac.pulsesT = round(this.tS, 10);
    this.spend(MP_SESSION.plethCheckS, "Feeling the foot pulses");
    this.logLine("result", text);
    if (c.releasedAt !== null) this.decideAftercare();
    return text;
  }

  /** A clear sterile dressing over the puncture once the compression is off. */
  applyDressing(): boolean {
    const st = this.activeSite;
    const c = st.closure.compression;
    if (!c || c.releasedAt === null) return false;
    const ac = (st.closure.aftercare ??= { groinT: null, pulsesT: null, dressingT: null });
    if (ac.dressingT !== null) return false;
    ac.dressingT = round(this.tS, 10);
    this.spend(MP_SESSION.plethCheckS, "Dressing the groin");
    this.logLine("action", "A clear sterile dressing over the puncture.");
    this.decideAftercare();
    return true;
  }

  /** The checks after the compression (Brilakis 11.1.6 steps 8-10), scored as they stand; re-recorded as each is done. */
  private decideAftercare(): void {
    const st = this.activeSite;
    const c = st.closure.compression;
    if (!c || c.releasedAt === null) return;
    const ac = st.closure.aftercare ?? { groinT: null, pulsesT: null, dressingT: null };
    const done = [ac.groinT !== null && "groin checked", ac.pulsesT !== null && "foot pulses felt", ac.dressingT !== null && "clear dressing"].filter(Boolean) as string[];
    this.decide({
      id: this.siteDecisionId("femoral-aftercare"),
      stage: "closure",
      label: "After the compression: the groin, the foot pulses and a clear dressing",
      correct: done.length === 3,
      expected: "Groin checked for a haematoma, distal pulses felt, a clear sterile dressing",
      given: done.length ? done.join(", ").replace(/^./, (x) => x.toUpperCase()) : "None of the three",
      lessonId: "pm-closure-femoral-compression",
      tipIds: ["access-compression-hands-above"],
    });
  }

  /** The ACT at the pull against the learner's rule (measured, and under the threshold or Oxford's time). */
  private decideCompressionAct(act: number): void {
    const noHeparin = this.heparinU === 0;
    const last = this.acts.length ? this.acts[this.acts.length - 1] : null;
    const lastHeparin = this.heparinDoses.length ? this.heparinDoses[this.heparinDoses.length - 1].t : null;
    const since = lastHeparin === null ? null : this.tS - lastHeparin;
    const rule = this.compressionRule;
    const measuredOk = noHeparin || (!!last && actAllowsPull(rule, last.act, since));
    const trueOk = noHeparin || actAllowsPull(rule, act, since);
    const threshold = rule === "brilakis" ? `below ${COMPRESSION.brilakisActS} s (Brilakis)` : `below ${COMPRESSION.oxfordActS[0]}-${COMPRESSION.oxfordActS[1]} s, or ${COMPRESSION.oxfordAfterH[0]}-${COMPRESSION.oxfordAfterH[1]} h after the heparin (Oxford)`;
    // only what the operator knows is said: the true ACT stays in the ledger and the debrief
    const known = this.knownAct();
    if (!noHeparin && known === null) this.say(`No ACT has been measured since the heparin. A femoral sheath comes out by hand once it is ${threshold}.`, "safety");
    else if (!measuredOk && last) this.say(`The last ACT measured was ${Math.round(last.act)} s. A femoral sheath comes out by hand once it is ${threshold}.`, "safety");
    this.decide({
      id: this.siteDecisionId("femoral-act"),
      stage: "closure",
      label: "ACT checked before the femoral sheath came out",
      correct: measuredOk && trueOk,
      expected: `ACT measured and ${threshold} before manual compression`,
      given: noHeparin ? "No heparin given" : !last ? `Pulled without an ACT (about ${Math.round(act)} s)` : `Pulled at a measured ACT of ${Math.round(last.act)} s`,
      lessonId: "pm-antithrombotics-heparin",
      tipIds: ["access-femoral-sheath-act"],
    });
  }

  /** The preparation before the pull (Brilakis 11.1.6 steps 1-3) and a raised pressure lowered first. */
  private decidePrep(sys: number): void {
    const missing = PREP_CHECKLIST.filter((p) => p.id !== "bp" && this.prep[p.id] === null).map((p) => p.label.toLowerCase());
    this.decide({
      id: this.siteDecisionId("femoral-compression-prep"),
      stage: "closure",
      label: "Prepared before the femoral sheath came out",
      correct: missing.length === 0,
      expected: PREP_CHECKLIST.filter((p) => p.id !== "bp").map((p) => p.label).join("; "),
      given: missing.length ? `Not done: ${missing.join("; ")}` : "All done",
      lessonId: "pm-closure-femoral-compression",
      tipIds: ["access-compression-prepare", "access-vagal-prevention"],
    });
    const raised = sys > MP_COMPRESSION.raisedSysMmHg;
    const lowered = this.bpLoweredUntil !== null;
    if (raised || this.prep.bp !== null)
      this.decide({
        id: this.siteDecisionId("femoral-compression-bp"),
        stage: "closure",
        label: "Blood pressure checked, and a raised pressure lowered, before the sheath came out",
        correct: this.prep.bp !== null && (!raised || lowered),
        expected: `The pressure read before the pull, and a raised pressure (systolic above ${MP_COMPRESSION.raisedSysMmHg} mmHg, a simulator setting) lowered with a titratable agent first`,
        given: `${this.prep.bp !== null ? "Read" : "Not read"}; systolic ${Math.round(sys)} mmHg at the pull${raised ? (lowered ? ", lowered first" : ", not lowered") : ""}`,
        lessonId: "pm-closure-femoral-compression",
        tipIds: ["access-compression-prepare"],
      });
  }

  /** Radial: finish haemostasis (band on, sheath out); schedule the band removal and delayed events. */
  finishRadialClosure(bandHours: number): void {
    // once per site: a closure whose draw gave no delayed events is finished too (radial.finishedAt)
    if (!this.radial || !this.radial.sheathOut || this.delayed.length || this.radial.finishedAt != null || this.busy) return;
    this.radial.finishedAt = this.tS;
    const r = raoRisk(this.raoFactors(bandHours));
    this.raoRiskNow = r;
    this.radialBandHours = bandHours;
    this.decide({
      id: this.siteDecisionId("patent-haemostasis"),
      stage: "closure",
      label: "Radial artery shown to be open under the band",
      correct: this.radial.patentDocumented,
      expected: "Pleth present with the ulnar artery compressed, and a dry site",
      given: this.radial.patentDocumented ? "Patency documented" : "Patency not documented",
      lessonId: "pm-closure-radial",
      tipIds: ["access-radial-patency-check"],
    });
    // 'Leave the band on for 1–2 hours: longer raises the risk of occlusion' (pm-closure-radial, step 5)
    this.decide({
      id: this.siteDecisionId("radial-band-time"),
      stage: "closure",
      label: "Band set to come off at 1-2 hours",
      correct: bandHours >= 1 && bandHours <= 2,
      expected: "Off at 1-2 hours; longer raises the risk of radial occlusion",
      given: `Off after ${bandHours.toFixed(1)} h`,
      lessonId: "pm-closure-radial",
      tipIds: ["access-radial-patency-check"],
    });
    this.afterClosure();
  }

  raoFactors(bandHours: number) {
    const sheathOd = this.sheath ? SHEATHS[this.sheath.id].odMm : 2.67;
    return {
      heparinU: this.heparinU,
      heparinUPerKg: this.heparinU / this.profile.weightKg,
      patentHaemostasis: !!this.radial?.patentDocumented,
      bandHours,
      arteryToSheath: this.profile.radialDiamMm / sheathOd,
      ulnarCompression: !!this.radial?.ulnarCompression,
      // spasm felt on the wire, or a sheath gripped at removal (access-closure-radial)
      spasm: this.spasmSeen > 0.5 || !!this.radial?.gripped,
      punctures: Math.max(1, this.pm.st.arterialPunctures),
      warfarin: this.profile.anticoagulation === "warfarin",
    };
  }

  /**
   * A site's haemostasis is done: its delayed events are drawn and its sheath is recorded. The site is
   * the one the closure started at (a femoral closure ends after its time lapse), so the work runs with
   * that site active and the active site is put back before the case moves on.
   */
  private afterClosure(site: AccessSiteState = this.activeSite): void {
    const idx = this.sites.indexOf(site);
    if (idx < 0) return;
    const prev = this.activeIdx;
    this.activeIdx = idx;
    let drawn = false;
    try {
      drawn = this.drawClosure(site);
    } finally {
      this.activeIdx = prev;
    }
    if (drawn) this.onSiteClosed(site);
  }

  /** The closure's work at `site`, which is the active site while it runs; false when it was already done. */
  private drawClosure(site: AccessSiteState): boolean {
    if (this.delayed.length) return false;
    this.noteSheath();
    const closedAt = this.tS;
    const seed = this.siteSeed(site);
    if (this.access === "femoral" && this.femoral) {
      this.delayed = scheduleDelayed({ route: "femoral", closedAtS: closedAt, seed, femoral: this.femoral.risk });
    } else if (this.radial && this.teamUneventful) {
      // a follow-up vignette: the case the patient comes back from was uneventful (setTeamCourseUneventful)
      this.delayed = [];
      this.radialOccluded = false;
    } else if (this.radial) {
      this.delayed = scheduleDelayed({
        route: "radial",
        closedAtS: closedAt,
        seed,
        rao: this.raoRiskNow ?? raoRisk(this.raoFactors(this.radialBandHours)),
        // a perforation sealed over the wire no longer bleeds into the forearm (access-radial-sequence)
        forearmPerforation: this.activeSite.radialSeq.perforation ? !this.activeSite.radialSeq.perforation.sealed : this.wire.perforation || this.complications.some((c) => c.id === "forearm-perforation"),
        bandOozeMl: this.radial.oozeMl,
        radialPunctures: this.pm.st.arterialPunctures,
        avulsion: !!this.radial.avulsed,
      });
      this.radialOccluded = this.delayed.some((d) => d.kind === "radial-occlusion");
      const perf = this.activeSite.radialSeq.perforation;
      if (perf && !perf.sealed) this.decidePerforationSealed(this.activeSite, false);
    }
    // the scenario's own delayed events, on top of those drawn: each once per case, at the closure of
    // the first site it fits (a groin finding at a groin, a wrist finding at a wrist), and every one
    // still unused at the last closure
    const last = this.openSites().filter((x) => x !== site).length === 0;
    for (const d of this.scenario.delayed ?? []) {
      if (this.scenarioDelayedUsed.has(d) || !(last || delayedFits(d.kind, site))) continue;
      this.scenarioDelayedUsed.add(d);
      this.delayed.push({ kind: d.kind, atS: closedAt + d.afterMin * 60, bleedMlMin: d.bleedMlMin ?? 0, totalMl: d.totalMl ?? 0, report: d.report, finding: d.finding, severity: d.severity });
      if (d.kind === "radial-occlusion" && this.radial) this.radialOccluded = true;
    }
    this.delayed.sort((a, b) => a.atS - b.atS);
    this.sheath = null;
    this.emit("closure", { delayed: this.delayed.map((d) => d.kind), ...(this.sites.length > 1 ? { site: site.id } : {}) });
    return true;
  }

  /**
   * A site's closure is complete. Once every site is closed the patient goes to recovery (the closure
   * and recovery hooks fire), and the active site becomes a radial site whose band is still on, if the
   * case has one, so the recovery checks of the band reach it.
   */
  private onSiteClosed(site: AccessSiteState): void {
    this.tipEvents.clear("act-high");
    if (!this.closureDone()) {
      const left = this.openSites();
      this.logLine("event", `Haemostasis at the ${siteLabel(site)}. Still to close: ${left.map((x) => `the ${siteLabel(x)}`).join(", ")}.`);
      return;
    }
    this.logLine("event", "Haemostasis achieved. The patient goes to recovery.");
    const band = this.sites.findIndex((x) => !!x.closure.radial && x.closure.radial.bandOffAt === null);
    if (band >= 0 && this.sites.length > 1 && !this.wireInBody && !this.catheter?.inBody) this.activeIdx = band;
    this.fireHook("closure");
    this.ward.arrive(this.tS);
    this.fireHook("recovery");
  }

  private presentDelayed(ev: DelayedEvent): void {
    if (ev.kind === "radial-occlusion") return; // found only when the band comes off and patency is checked
    this.logLine("nurse", ev.report);
    this.presentFinding(ev, ev.finding, ev.severity);
    if (ev.bleedMlMin > 0) this.activeBleeds.push({ ev, left: ev.totalMl });
    if (ev.kind === "retroperitoneal-bleed") this.say("Hypotension after a femoral case with no visible haematoma is a retroperitoneal bleed until proven otherwise.", "safety");
    if (ev.kind === "forearm-haematoma") {
      const g = easyGradeFromSize(haematomaCm(ev.totalMl), false, false);
      this.logLine("result", `Forearm haematoma, EASY grade ${["0", "I", "II", "III", "IV", "V"][g]}.`);
    }
  }

  /**
   * A delayed finding is presented: what is visible (a swelling or lump stays for the rest of the case, a rebleed
   * is bleeding) and its complication. The nurse's line is the caller's (the session's report, or the ward's).
   */
  private presentFinding(ev: DelayedEvent, finding: string, severity: "minor" | "major"): void {
    if (VISIBLE_SWELLING.includes(ev.kind)) this.tipEvents.hold(["haematoma"], undefined, "case");
    if (ev.kind === "rebleed") this.raiseTip("bleeding");
    this.complication(ev.kind, finding, severity);
  }

  /** Recovery: let time pass (time-lapse). On the ward it stops when the ward finds something. */
  observe(minutes: number): void {
    if (!this.closureDone() || this.busy || this.held) return;
    this.spend(minutes * 60, `Recovery: observing ${minutes} min`, undefined, true);
  }

  // -------------------------------------------------------------------------
  // the recovery ward (proc-recovery-ward)
  // -------------------------------------------------------------------------

  /** What the ward reads from the session and may do to it. */
  private wardHost(): WardHost {
    const working = () => this.workingSite();
    return {
      seed: this.seed,
      now: () => this.tS,
      vitals: () => this.patient.vitals(),
      route: () => (working().route === "femoral" ? "femoral" : "radial"),
      closure: () => {
        const w = working();
        return w.route !== "femoral" ? "radial-band" : w.closure.femoral?.method === "device" ? "device" : "manual";
      },
      sheathFr: () => {
        const w = working();
        const id = w.sheath?.id ?? (w.sheathHistory || null);
        return id ? SHEATHS[id].fr : (w.closure.compression?.fr ?? 6);
      },
      bandOn: () => this.sites.some((x) => !!x.closure.radial && x.closure.radial.sheathOut && x.closure.radial.bandOffAt === null),
      // the PCI's LabReport gives the stents; until the live lab passes one back, the case's own PCI counts
      stented: () => this.ward.reports.some((r) => r.stents.length > 0) || this.labsDone.includes("pci"),
      stentSite: () => {
        const st = this.ward.reports.flatMap((r) => r.stents)[0];
        if (!st) {
          // no report: the case's own PCI, at its first lesion (the target)
          const l = this.labsDone.includes("pci") ? this.caseData.lesions[0] : undefined;
          return l ? { vessel: l.vessel, param: l.position } : null;
        }
        const lesion = this.caseData.lesions.find((l) => l.vessel === st.vessel);
        return { vessel: st.vessel, param: lesion ? lesion.position : MP_WARD.stentParamDefault };
      },
      siteText: () => this.wardSiteText(),
      pulseText: () => this.wardPulseText(),
      heparinU: () => this.heparinU,
      sex: () => this.profile.sex,
      baselineCreatinineUmolL: () => this.profile.renal.creatinineUmolL,
      teamTable: () => this.startStage === "recovery",
      catheterOutAt: () => this.lastCatheterOutAt,
      busy: () => this.busy,
      decide: (r) => this.decide(r),
      log: (kind, text) => this.logLine(kind, text),
      spend: (sec, label) => this.spend(sec, label),
      holdTip: (events) => this.tipEvents.hold(events, undefined, "ward"),
      clearTip: (e) => this.tipEvents.clear(e),
      bleed: (ev) => {
        if (ev.bleedMlMin > 0) this.activeBleeds.push({ ev, left: ev.totalMl });
      },
      stopBleed: (ev) => {
        for (const b of this.activeBleeds) if (b.ev === ev) b.left = 0;
      },
      present: (ev, finding, severity) => {
        if (!this.presented.includes(ev)) this.presented.push(ev);
        this.presentFinding(ev, finding, severity);
      },
      occlude: (id, vessel, param) => this.patient.setOcclusion(id, { vessel, param, fraction: 1 }),
      clearOcclusion: (id) => this.patient.clearOcclusion(id),
      pericardialInflow: (ml) => this.patient.setPericardialInflow?.(ml),
      drainPericardium: (ml) => this.patient.drainPericardium?.(ml) ?? 0,
    };
  }

  /** The working site as it looks and feels on the ward, with no ward event under way. */
  private wardSiteText(): string {
    const w = this.workingSite();
    if (w.route === "femoral") return "The groin is soft and dry, without swelling.";
    const r = w.closure.radial;
    if (r && r.bandOffAt === null) {
      const b = this.bandStatusFor(w);
      const bleed = b ? bleedText(b.bleedSite, r.forearmMl ?? 0) : "";
      return bleed || "Band on, the wrist dry; the hand pink and warm.";
    }
    return "The wrist is dry; the hand pink and warm.";
  }

  /**
   * The femoral, popliteal and foot pulses on the punctured side as the nurse feels them now (the route-plan module's,
   * when attached). The model has no popliteal pulse of its own: it is read as the weaker of the femoral and foot
   * pulses. The comparison with the pulses examined before access is the learner's (wardStartPulses).
   */
  private wardPulseText(): string {
    const w = this.workingSite();
    const rp = this.mod<RoutePlanModule>("route-plan");
    if (!rp) return "Femoral, popliteal and foot pulses felt.";
    const side = w.side;
    const fem = rp.actions.pulseNow(`femoral-${side}`);
    const foot = rp.actions.pulseNow(`pedal-${side}`);
    const rank = { normal: 0, weak: 1, absent: 2 } as const;
    const pop = rank[fem] >= rank[foot] ? fem : foot;
    return `Femoral ${wardPulseWord(fem)}, popliteal ${wardPulseWord(pop)}, foot ${wardPulseWord(foot)}.`;
  }

  /**
   * The pulses on the working side as recorded before access (the route-plan module's examination), for the ward's
   * chart to show beside the nurse's sets: the femoral and foot pulses after a femoral case, the radial and ulnar
   * after a radial one. Null when no module or no examination before access.
   */
  wardStartPulses(): string | null {
    const rp = this.mod<RoutePlanModule>("route-plan");
    if (!rp) return null;
    const w = this.workingSite();
    const start = rp.actions.startPulses();
    const ids = w.route === "femoral" ? ([["femoral", "Femoral"], ["pedal", "foot"]] as const) : ([["radial", "Radial"], ["ulnar", "ulnar"]] as const);
    const parts = ids.flatMap(([a, label]) => {
      const f = start.find((p) => p.id === `${a}-${w.side}`)?.finding;
      return f ? [`${label} ${wardPulseWord(f)}`] : [];
    });
    return parts.length ? `${parts.join(", ")}.` : null;
  }

  /** The learner writes the ward's observation schedule and mobilisation plan (once; scored). */
  setWardPlan(schedule: WardSchedule, mobilise: WardMobilisation): ReturnType<Ward["setPlan"]> {
    if (!this.closureDone() || this.busy) return null;
    return this.ward.setPlan(schedule, mobilise);
  }

  /** Let the ward run to its next scheduled set of observations (a recovery time-lapse; stops at a finding). */
  observeToNextSet(): boolean {
    const next = this.ward.nextDueRel();
    const at = this.ward.arrivedAt;
    if (next === null || at === null || !this.closureDone() || this.busy || this.held) return false;
    const s = Math.max(1, at + next - this.tS);
    this.spend(s, `Recovery: to the next observations`, undefined, true);
    return true;
  }

  /** Review one set of observations (or all of them). */
  reviewWardSet(i: number | "all"): boolean {
    return i === "all" ? this.ward.reviewAll() > 0 : this.ward.review(i);
  }

  /** The learner's action on a ward event (null when refused). */
  wardAct(eventId: string, action: WardActionId): string | null {
    if (this.busy) return null;
    return this.ward.act(eventId, action);
  }

  /** The 48-72 hour review: the creatinine result (the scenario's rise, or unchanged). Returns the result line. */
  wardFollowUp(): string | null {
    if (!this.ward.arrived || this.busy || this.ward.followUpAt !== null) return null;
    this.ward.followUpAt = round(this.tS, 10);
    let found: string | null = null;
    for (const site of this.sites)
      for (const ev of site.delayed) {
        if (ev.kind !== "creatinine-rise" || this.wardTaken.has(ev)) continue;
        this.wardTaken.add(ev);
        this.ward.onset(ev, true);
        found = ev.finding;
      }
    if (found) return found;
    const line = `Creatinine at 48-72 hours: ${this.profile.renal.creatinineUmolL} µmol/L, unchanged from before the procedure.`;
    this.logLine("result", line);
    return line;
  }

  /** The end-of-case neurological check at the table: the patient asked to speak and move all four limbs. */
  neuroCheckAtTable(): string | null {
    if (this.busy) return null;
    const f = this.ward.neuroCheckAtTable();
    this.logLine("action", "Asked the patient to speak and to move all four limbs.");
    this.logLine("result", f);
    this.spend(MP_SESSION.plethCheckS, "Checking speech and limbs");
    return f;
  }

  /**
   * A scenario's start state: what a lab the team ran reported (the PCI's stents, the diagnostic lab's wireless
   * exchanges), its contrast and dose added to the case as returnFromLab adds them, without its hook or time.
   */
  teamLabReport(report: LabReport): void {
    const lab = report.lab === "angio-pci" ? "pci" : "diagnostic";
    this.ward.reports.push(report);
    this.labTotals.contrastMl += Math.max(0, report.contrastMl);
    this.labTotals.fluoroS += Math.max(0, report.dose.fluoroS);
    this.labTotals.karMGy += Math.max(0, report.dose.karMGy);
    this.labTotals.kapGyCm2 += Math.max(0, report.dose.kapGyCm2);
    if (!this.labsDone.includes(lab)) this.labsDone.push(lab);
    this.refreshTotals();
    const budget = this.contrastBudgetMl ?? this.profile.renal.macdMl;
    if (this.totals.contrastMl > budget) this.tipEvents.hold(["high-contrast-volume"], undefined, "case");
  }

  /**
   * A scenario's start state (table-embolic-stroke): the catheter has sat at the root with the wire out and
   * without a flush while the films were reviewed, and blood has clotted in its lumen. Only with the catheter in
   * and the wire out (public, for scenario start states).
   */
  teamLeftCatheterUnflushed(): boolean {
    const c = this.catheter;
    if (!c?.inBody || !this.ex.wireOut) return false;
    c.lumenClot = true;
    c.lastFlushAt = this.tS - MP_SESSION.clotAfterS;
    this.ex.aspirated = false;
    this.ex.flushed = false;
    this.hazards.catheterThrombus = Math.max(this.hazards.catheterThrombus, 0.6);
    this.handOverNote("attending", "Handover: the catheter has been sitting at the root while the films were reviewed. Get it ready for the next injection.");
    return true;
  }

  /** The stroke on the table stops the case: no more coronary work until the stroke team has seen the patient. */
  private tableStrokeStops(): boolean {
    const t = this.ward.tableStroke;
    if (!t) return false;
    this.tableStopSaid = true;
    this.say("We stop here. Nothing more goes into the coronaries until the stroke team has seen the patient.", "safety", { stop: true, repeatAfterS: MP_SESSION.stopRepeatS });
    return true;
  }

  /**
   * Clot or air sent into the aorta: an embolic stroke may follow (the ward decides; the nurse's line is the ward's).
   * It raises neuro-deficit, and the attending stops the case once the learner has made a first move, or after
   * MP_WARD.tableStopAfterS without one (tableStrokeWatch), so the stop does not give away the first action.
   */
  private tableEmbolism(cause: "clot" | "air"): void {
    this.ward.tableEmbolism(cause);
  }

  /** The attending has stopped the case for the stroke on the table. */
  private tableStopSaid = false;

  /** The attending stops the case after the learner's first action on a stroke on the table, or after a short wait without one. */
  private tableStrokeWatch(): void {
    const e = this.ward.tableStroke;
    if (this.tableStopSaid || !e || e.foundS === null) return;
    if (!e.actions.length && this.tS - e.foundS < MP_WARD.tableStopAfterS) return;
    this.tableStopSaid = true;
    this.say(
      e.actions.length ? "We stop here. Nothing more goes into the coronaries until the stroke team has seen the patient." : "Stop. Nothing more goes into the coronaries until the stroke team has seen the patient.",
      "safety",
      { stop: true },
    );
  }

  /** Remove the radial band (at the planned time) and check radial patency with the reverse Barbeau test. */
  removeBand(): BarbeauClass | null {
    if (!this.radial || this.radial.bandOffAt !== null || this.busy) return null;
    this.radial.bandOffAt = this.tS;
    const hours = this.radial.sheathOutAt !== null ? (this.tS - this.radial.sheathOutAt) / 3600 : 0;
    if (!this.delayed.length && this.radial.finishedAt == null) this.finishRadialClosure(hours);
    // band time actually used decides occlusion if not yet decided by the plan
    if (this.radialOccluded === null) this.radialOccluded = this.delayed.some((d) => d.kind === "radial-occlusion");
    const r = plethWithUlnarCompression(null, !!this.radialOccluded);
    this.logLine("action", `Band removed after ${hours.toFixed(1)} h.`);
    this.logLine("result", r.cls === "D" ? "No radial pulse; the thumb pleth is lost with the ulnar artery compressed (reverse Barbeau D): radial artery occlusion." : `Radial pulse present; pleth maintained with the ulnar artery compressed (pattern ${r.cls}).`);
    if (r.cls === "D") this.complication("radial-occlusion", "Radial artery occlusion", "minor");
    return r.cls;
  }

  // -------------------------------------------------------------------------
  // late radial problems at follow-up (access-closure-radial; cm-access-complications-radial-other)
  // -------------------------------------------------------------------------

  /** A follow-up vignette after the case, once it is closed: what the patient shows, and the learner's assessment. */
  radialLate: { kind: RadialLateKind; at: number; assessed: { dx: RadialLateDx; plan: RadialLatePlan; t: number; correct: boolean } | null } | null = null;

  /**
   * A follow-up vignette (a scenario's start state, once the case is closed): the patient comes back weeks later
   * with what RADIAL_LATE[kind] describes (seen and felt only; the problem is the learner's to name).
   */
  presentRadialLate(kind: RadialLateKind): boolean {
    if (!this.closureDone() || this.radialLate) return false;
    this.radialLate = { kind, at: round(this.tS, 10), assessed: null };
    this.logLine("nurse", RADIAL_LATE[kind].presentation);
    return true;
  }

  /** The learner names the late problem and its plan; scored once (the debrief shows the grade). */
  assessRadialLate(dx: RadialLateDx, plan: RadialLatePlan): { dxCorrect: boolean; planCorrect: boolean } | null {
    const v = this.radialLate;
    if (!v || v.assessed || this.busy) return null;
    const g = gradeRadialLate(v.kind, dx, plan);
    v.assessed = { dx, plan, t: round(this.tS, 10), correct: g.dxCorrect && g.planCorrect };
    this.decide({
      id: "radial-late-assessment",
      stage: "recovery",
      label: "Late radial problem at follow-up named and planned",
      correct: g.dxCorrect && g.planCorrect,
      expected: g.expected,
      given: `${RADIAL_LATE_DX_LABEL[dx]}: ${RADIAL_LATE_PLAN_LABEL[plan].toLowerCase()}`,
      lessonId: "cm-access-complications-radial-other",
      tipIds: [],
    });
    // named only after the learner's assessment
    if (v.kind === "radial-pseudoaneurysm") this.complication("radial-pseudoaneurysm", "Radial pseudoaneurysm at follow-up", "minor");
    else this.complication("sterile-granuloma", "Sterile granuloma at follow-up", "minor");
    this.logLine("action", "Follow-up assessment recorded.");
    return { dxCorrect: g.dxCorrect, planCorrect: g.planCorrect };
  }

  // -------------------------------------------------------------------------
  // handover note and finish
  // -------------------------------------------------------------------------

  /** Ground truth for the handover note. */
  truth(): HandoverNote {
    this.refreshTotals();
    const comp = this.complications.filter((c) => !c.critical).map((c) => c.id);
    const used = this.sites.filter((x) => !!x.sheath || !!x.sheathHistory);
    if (this.sites.length > 1 && used.length > 1) {
      // several sites: the working site (where the catheter went in) and every site with its checks
      const work = this.workingSite();
      const radial = used.find((x) => x.siteKind === "radial");
      const checks: string[] = [];
      for (const x of used) for (const c of x.route === "femoral" ? ["groin", "distal-pulses", "observations"] : ["radial-pulse", "hand-perfusion", "observations"]) if (!checks.includes(c)) checks.push(c);
      return {
        site: work.route,
        sheath: (work.sheath?.id ?? work.sheathHistory) as SheathId | "",
        closure: work.route === "femoral" ? (work.closure.femoral?.method === "device" ? "device" : "manual") : "radial-band",
        heparinU: this.heparinU,
        lastActS: this.acts.length ? this.acts[this.acts.length - 1].act : null,
        contrastMl: this.totals.contrastMl,
        fluoroMin: round(this.totals.fluoroS / 60, 10),
        complications: comp,
        bandOffHours: radial ? radial.closure.bandHours : null,
        checks,
        free: "",
        sites: SITE_KEYS.filter((k) => used.some((x) => siteKey(x) === k)),
      };
    }
    // one site in use: that site, not the active one (a site added after closure may have no sheath)
    const one = this.sites.length > 1 ? (used[0] ?? this.workingSite()) : this.activeSite;
    return {
      site: one.route,
      sheath: (one.sheath?.id ?? one.sheathHistory) as SheathId | "",
      closure: one.route === "femoral" ? (one.closure.femoral?.method === "device" ? "device" : "manual") : "radial-band",
      heparinU: this.heparinU,
      lastActS: this.acts.length ? this.acts[this.acts.length - 1].act : null,
      contrastMl: this.totals.contrastMl,
      fluoroMin: round(this.totals.fluoroS / 60, 10),
      complications: comp,
      bandOffHours: one.route === "femoral" ? null : one.closure.bandHours,
      checks: one.route === "femoral" ? ["groin", "distal-pulses", "observations"] : ["radial-pulse", "hand-perfusion", "observations"],
      free: "",
    };
  }

  private get sheathHistory(): SheathId | "" {
    return this.activeSite.sheathHistory;
  }
  private set sheathHistory(v: SheathId | "") {
    this.activeSite.sheathHistory = v;
  }
  submitHandover(n: HandoverNote): HandoverGrade {
    for (const x of this.sites) if (x.sheath) x.sheathHistory = x.sheath.id;
    const t = this.truth();
    const items: HandoverGrade["items"] = [];
    const num = (field: string, exp: number | null, given: number | null, tol: number) =>
      items.push({ field, expected: exp === null ? "not measured" : String(exp), given: given === null ? "blank" : String(given), correct: exp === null ? given === null : given !== null && Math.abs(given - exp) <= tol });
    const multi = !!t.sites;
    const siteWords = (a: AccessRoute) => (multi && a === "femoral" ? "femoral" : accessLabel(a));
    items.push({ field: "Access site", expected: multi ? siteLabel(this.workingSite()) : accessLabel(t.site as AccessRoute), given: n.site ? siteWords(n.site) : "blank", correct: n.site === t.site });
    if (t.sites) {
      const exp = [...t.sites].sort().join(",");
      const giv = [...new Set(n.sites ?? [])].sort().join(",");
      items.push({ field: "Access sites and lines", expected: t.sites.map(siteKeyLabel).join(", "), given: n.sites?.length ? n.sites.map(siteKeyLabel).join(", ") : "blank", correct: exp === giv });
    }
    items.push({ field: "Sheath", expected: t.sheath ? SHEATHS[t.sheath as SheathId].label : "-", given: n.sheath ? SHEATHS[n.sheath as SheathId].label : "blank", correct: !t.sheath || n.sheath === t.sheath || (!!n.sheath && SHEATHS[n.sheath as SheathId].fr === SHEATHS[t.sheath as SheathId].fr) });
    items.push({ field: "Closure", expected: t.closure, given: n.closure || "blank", correct: n.closure === t.closure });
    num("Heparin (U)", t.heparinU, n.heparinU, 0);
    num("Last ACT (s)", t.lastActS, n.lastActS, 0);
    num("Contrast (mL)", t.contrastMl === null ? null : round(t.contrastMl), n.contrastMl, Math.max(5, (t.contrastMl ?? 0) * 0.1));
    num("Fluoroscopy (min)", t.fluoroMin, n.fluoroMin, Math.max(0.5, (t.fluoroMin ?? 0) * 0.2));
    const expC = [...t.complications].sort().join(", ") || "none";
    const givC = [...n.complications].sort().join(", ") || "none";
    items.push({ field: "Complications", expected: expC, given: givC, correct: expC === givC });
    if (t.bandOffHours !== null) num("Band off after (h)", t.bandOffHours, n.bandOffHours, 0.5);
    const checksOk = t.checks.every((c) => n.checks.includes(c));
    items.push({ field: "Checks asked of the ward", expected: t.checks.join(", "), given: n.checks.join(", ") || "blank", correct: checksOk });
    const correct = items.filter((i) => i.correct).length;
    this.note = n;
    this.grade = { items, correct, total: items.length };
    const wrong = items.filter((i) => !i.correct).map((i) => i.field.toLowerCase());
    this.decide({
      id: "handover-note",
      stage: "handover",
      label: "Handover note to the ward",
      correct: wrong.length === 0,
      expected: "Every item of the note matches the case",
      given: wrong.length ? `${correct} of ${items.length} correct; check ${wrong.join(", ")}` : `All ${items.length} items correct`,
      lessonId: "hb-after-the-procedure-report",
      tipIds: ["diag-post-ward-handover"],
    });
    this.logLine("action", "Handover note written.");
    this.emit("handover-note", { correct, total: items.length });
    return this.grade;
  }

  /**
   * The case a module ended (the planning module's hold and delay), the module's id, and whether it came
   * before any puncture (the first skin pass; no site has a sheath): only then can finish() end it
   * without a closed site. Null while no module has ended the case.
   */
  postponement(): (CasePostponement & { by: string; beforePuncture: boolean }) | null {
    for (const m of this.modules) {
      const p = m.postponed?.();
      if (!p) continue;
      const beforePuncture = this.hookAt.puncture === undefined && this.sites.every((x) => !x.sheath && x.firstPassAt === null);
      return { t: p.t, text: p.text, by: m.id, beforePuncture };
    }
    return null;
  }

  /**
   * End the case: summary for the logbook and debrief. A case postponed before any puncture ends here
   * as it is (the summary carries `postponed`); otherwise every access site must be closed first.
   */
  finish(): SessionSummary | null {
    const pp = this.postponement();
    const postponed = pp && pp.beforePuncture ? { t: pp.t, text: pp.text } : null;
    // a held compression, band or recovery time is still under way (an emergency paused it): the site is not done with
    if (this.held && !postponed) {
      this.say(`${this.held.label} is still under way.`, "safety");
      return null;
    }
    if (!postponed && !this.closureDone()) {
      this.say(this.sites.length > 1 ? "The case is not finished until every access site is closed." : "The case is not finished until the access site is closed.", "safety");
      return null;
    }
    this.finished = true;
    // the ward's record closes with the case: sets not reviewed and events not answered are scored
    this.ward.close();
    this.refreshTotals();
    const sheathOf = (x: AccessSiteState) => (x.sheath ? SHEATHS[x.sheath.id].label + " sheath" : x.sheathHistory ? SHEATHS[x.sheathHistory].label + " sheath" : "");
    const sheaths = this.sites.length > 1 ? this.sites.map(sheathOf) : [sheathOf(this.activeSite)];
    const devices = [...sheaths, this.catheter?.id ?? "", this.wireKind === "j" ? "J wire" : "hydrophilic wire"].filter(Boolean);
    // a postponed case is never a pass (no access was done), the same as its logbook row
    // a PCI's complications are listed but graded by the PCI lab (pci-adhoc-handover), not by the case's pass rule
    const passed = !postponed && this.criticalErrors === 0 && !this.complications.some((c) => c.severity === "major" && c.source !== "pci");
    const pciCheck = this.pciOutcome?.targetCheck ?? null;
    return {
      caseId: this.caseData.id,
      access: this.sites.length > 1 ? this.workingSite().route : this.access,
      durationS: round(this.tS),
      passed,
      criticalErrors: this.criticalErrors,
      complications: [...this.complications],
      totals: { ...this.totals },
      heparinU: this.heparinU,
      devices,
      raoProbability: this.raoRiskNow?.probability ?? null,
      raoTerms: this.raoRiskNow?.terms ?? [],
      femoralTerms: this.femoral?.risk.terms ?? [],
      handover: this.grade,
      scenarioId: this.scenario.id,
      decisions: this.decisions(),
      tipsShown: this.tipsShown.map((x) => x.id),
      ...(postponed ? { postponed } : {}),
      ...(this.pciOutcome ? { pci: { targetCheck: pciCheck ? { ...pciCheck } : null, text: pciCheck?.text ?? null } } : {}),
    };
  }

  /** Remember the sheath size once it comes out (for the handover truth). */
  noteSheath(): void {
    if (this.sheath) this.sheathHistory = this.sheath.id;
  }
}

export function accessLabel(a: AccessRoute): string {
  return a === "radial-right" ? "right radial" : a === "radial-left" ? "left radial" : "right femoral";
}

export interface NewCaseOptions {
  /** the patient and anatomy seed (default: the scenario's seed; one of the two is required) */
  seed?: string;
  /** planned access (default: the scenario's, else right radial) */
  access?: AccessRoute;
  indication?: Indication;
  mode?: AssessmentMode;
  entrustment?: EntrustmentLevel;
  variants?: AnatomyVariant[];
  /** a scenario, or a registered scenario id (scenarios/*.ts); default 'default' */
  scenario?: ProcedureScenario | string;
  /** the stage to open at (default: the scenario's start, else the chart) */
  start?: ScenarioStart;
  /** session modules to attach (default: every registered module file) */
  modules?: readonly CaseSessionModuleFactory[];
}

/** The case before the autopilot plays it: session and engine, and the stage to open at. */
function buildCase(o: NewCaseOptions): { session: CaseSession; engine: PatientEngine; scenario: ProcedureScenario | undefined; start: ScenarioStart } {
  const scenario = typeof o.scenario === "string" ? scenarioById(o.scenario) : o.scenario ?? scenarioById(DEFAULT_SCENARIO_ID);
  if (typeof o.scenario === "string" && !scenario) throw new Error(`unknown full-case scenario '${o.scenario}'`);
  const seed = o.seed ?? scenario?.seed;
  if (!seed) throw new Error("newCaseSession needs a seed (or a scenario with one)");
  const access = o.access ?? scenario?.access ?? "radial-right";
  const indication = o.indication ?? scenario?.indication;
  const profile = applyProfileOverrides(generatePatient(seed, indication ? { indication } : {}), scenario?.profile);
  const base = generateCase(`proc-${seed}`, { access, focus: "right", forceVariants: o.variants ?? scenario?.variants }, "rand");
  const caseData = { ...caseWithPatient(base, profile), accessRoute: access };
  const engine = new PatientEngine({ profile });
  engine.advance(8);
  const start = o.start ?? scenario?.start ?? "chart";
  const session = new CaseSession({ seed, access, caseData, patient: engine, mode: o.mode ?? scenario?.mode, entrustment: o.entrustment, scenario, modules: o.modules, start });
  return { session, engine, scenario, start };
}

/** After the autopilot: the scenario's start state, then the ledger emptied of what the learner did not do. */
function openAtStart(b: ReturnType<typeof buildCase>): void {
  // the start state is the team's work (a puncture it makes has the team's pre-puncture checklist)
  const state = b.scenario?.state;
  if (state) b.session.runAsTeam(() => state(b.session));
  if (b.start !== "chart" || b.scenario?.state) b.session.clearAutopilotDecisions();
}

/**
 * A new case: patient, anatomy and engine from one seed. The engine is warmed up so the patient is
 * at rest. A scenario's profile overrides are applied after generatePatient (renal function and the
 * contrast ceiling recomputed), its site overrides go to buildAccessSite, and the session is
 * fast-forwarded to the start stage by the autopilot, whose decisions are then cleared. When the
 * autopilot fails the half-played session is disposed and the AutopilotError rethrown.
 */
export function newCaseSession(o: NewCaseOptions): { session: CaseSession; engine: PatientEngine } {
  const b = buildCase(o);
  try {
    if (b.start !== "chart") fastForward(b.session, b.start);
    openAtStart(b);
  } catch (e) {
    b.session.dispose();
    throw e;
  }
  return { session: b.session, engine: b.engine };
}

/**
 * newCaseSession played one autopilot step at a time: `pause` runs between steps (the lab yields to
 * the browser so the page paints and stays responsive). Returns null when `cancelled` turns true
 * between steps (a newer case was asked for); the session is then disposed.
 */
export async function newCaseSessionStepped(
  o: NewCaseOptions,
  pause: () => Promise<void>,
  cancelled: () => boolean = () => false,
): Promise<{ session: CaseSession; engine: PatientEngine } | null> {
  // the first pause comes before anything is built, so the lab can paint its 'Preparing' line
  await pause();
  if (cancelled()) return null;
  const b = buildCase(o);
  try {
    if (b.start !== "chart") {
      const it = fastForwardSteps(b.session, b.start);
      while (!it.next().done) {
        await pause();
        if (cancelled()) {
          b.session.dispose();
          return null;
        }
      }
    }
    openAtStart(b);
  } catch (e) {
    b.session.dispose();
    throw e;
  }
  return { session: b.session, engine: b.engine };
}
