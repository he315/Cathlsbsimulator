// LAAO lab: TOE measurement, transseptal puncture, filling and sizing, hands-on deployment of each device
// family, the release checks and the follow-up visit, on the teaching scenarios of src/simulation/laao.ts.
//
// structural-tips-and-tavi-course: the run (useLabRun: mode, help, decisions, one logbook row) and
// the structural tips for the step (src/ui/lab/structuralTips.ts: measure and size are the plan, the
// transseptal step is access with the LAAO and transseptal procedures, deploy reports position until
// unsheathing starts, the PASS check is the assessment) in the tips panel; window.__lab.structural in
// DEV builds. A lesson or case opens a scenario through StructuralLab's launch.
//
// structural-transseptal-hands-on: the transseptal step is the hands-on puncture
// (TransseptalStage.tsx on src/simulation/transseptal.ts) in place of the fossa point-picker; the site
// it secures is scored by assessTransseptal and scoreLaao exactly as a picked point was.
//
// structural-laao-device-mechanics: after crossing, the size step shows the mean left atrial pressure,
// offers a fluid challenge and re-measurement, and compares CT, TOE and fluoroscopy; the coaxial line
// is judged against the CT morphology (laaoCoaxial). The deploy step is the deployment state machine
// (laaoDeployStep): the plug's pigtail, sheath markers, fluid-to-fluid connection and unsheathing; the
// lobe-and-disc device's ball, push and disc; both movements are offered for both devices, so a
// transferred movement is the learner's own. The PASS step holds the family's checks (measure, tug,
// colour in four planes, shape and wait for the lobe-and-disc device), recapture and a neutral release
// button. A follow-up visit at 6–12 weeks follows the release; the laao-drt-followup preset opens there
// (start "followup"). The follow-up step reports the assessment phase to the tip context; the deploy
// and PASS steps add the deployment's 'air' event and 'complication' (deployEvents, deployComplication).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LAAO_SCENARIOS,
  TOE_ANGLES,
  MORPHOLOGY_LABEL,
  DEVICE_LABEL,
  LEAK_LIMIT_MM,
  LEAK_LABEL,
  POSITION_BANDS,
  SIZING_LABEL,
  LA_LOADED_MMHG,
  LA_FLUID_TRIGGER_MMHG,
  MODALITY_LABEL,
  FOLLOWUP_ACTIONS,
  FOLLOWUP_ACTION_LABEL,
  FOLLOWUP_WEEKS,
  PLUG_TUG_TIP_BACK_CM,
  LOBE_TUG_TIP_BACK_CM,
  compressionWindow,
  compressionLabel,
  deviceSizes,
  deviceLengthMm,
  discDiameter,
  compressionPct,
  sizingDimension,
  landingZoneDepthMm,
  appendageWallMm,
  assessLaao,
  bestLaaoPlan,
  scoreLaao,
  scoreLaaoFollowUp,
  assessSizing,
  assessFollowUp,
  followUpFinding,
  laaoCoaxial,
  laaoPunctureQuality,
  laaoFilling,
  laPressureAfterFluid,
  toeMeasurementsAt,
  modalityReading,
  createLaaoDeploy,
  laaoDeployStep,
  deployPlan,
  deployUnsheathed,
  deployEvents,
  deployComplication,
  markerToWallMm,
  releaseCriteria,
  releaseDecisionCorrect,
  type AngleMeasurement,
  type DeployAction,
  type FollowUpAction,
  type LaaoDeployState,
  type LaaoDeviceType,
  type LaaoPlan,
  type LaaoScenario,
  type PassStatus,
  type ToeAngle,
} from "../../simulation/laao";
import { assessTransseptal, type FossaPoint, type TransseptalResult } from "../../simulation/teer";
import { createTransseptal, scoreTransseptal, transseptalDecisions, transseptalEvents, transseptalPoint, transseptalStep, type TsAction, type TsState } from "../../simulation/transseptal";
import type { LabContext, LabPhase } from "../../content/lab/tips";
import { PASS_SCORE } from "../../progress/logbook";
import { registerLabHook } from "../../dev/labHooks";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import { laaoTipContext, type LaaoStep } from "../lab/structuralTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import type { StructuralLaunch } from "../sections/StructuralLab";
import { TransseptalControls, TransseptalDebrief, TransseptalSummary, TransseptalViews } from "./TransseptalStage";
import { LaaFluoroView, LaaToeView } from "./LaaoViews";
import { Panel, Seg, StepRail, Toggle, Slider, Readout, Teach, RiskList, ScoreBadge, DeductionList, Disclaimer, TONE_TEXT, type Tone } from "./common";

/** The lab's steps: the tip context's LAAO steps and the follow-up visit (reported as the assessment). */
type Step = LaaoStep | "followup";

const STEPS: { id: Step; label: string }[] = [
  { id: "measure", label: "TOE measure" },
  { id: "transseptal", label: "Transseptal" },
  { id: "size", label: "Fill and size" },
  { id: "deploy", label: "Deploy" },
  { id: "pass", label: "PASS check" },
  { id: "followup", label: "Follow-up" },
  { id: "debrief", label: "Debrief" },
];

const PASS_TONE: Record<PassStatus, Tone> = { pass: "good", borderline: "warn", fail: "danger" };
const SEPTAL_BASE_CM = 3.4;
const FLUID_STEP_ML = 250;
const TUG_OPTIONS = [1, 2, 3, 4, 5, 6];

interface Reading {
  m: AngleMeasurement;
  /** mean LA pressure when it was measured; null before crossing (not yet known) */
  laMmHg: number | null;
}

/**
 * The step a launch opens at: a scenario that already has a released device opens at the follow-up visit
 * (with no start, or start "followup"); every other launch opens at the TOE measurements.
 */
export function launchStep(s: LaaoScenario, start: string | null): Step {
  return s.deployed && (start === null || start === "followup") ? "followup" : "measure";
}

/** The tip context: the step's (follow-up as the assessment), with the deployment's events and complication. */
export function laaoLabTipContext(step: Step, deploy: LaaoDeployState | null, tsState: TsState): LabContext | null {
  const tipStep: LaaoStep = step === "followup" ? "pass" : step;
  const base = laaoTipContext({ step: tipStep, unsheathed: deploy ? deployUnsheathed(deploy) : false, transseptal: tsState });
  if (!base || !deploy || (step !== "deploy" && step !== "pass")) return base;
  const events = deployEvents(deploy);
  const complication = deployComplication(deploy);
  if (!events.length && !complication) return base;
  const phases: LabPhase[] = [...(base.phases ?? [])];
  if (!phases.includes("complication")) phases.push("complication");
  const had = base.events ?? [];
  return { ...base, events: [...had, ...events.filter((e) => !had.includes(e))], phases };
}

export default function LaaoLab({ launch = null, onLaunchTaken }: { launch?: StructuralLaunch | null; onLaunchTaken?: () => void } = {}) {
  const [scenarioId, setScenarioId] = useState(LAAO_SCENARIOS[0].id);
  const s = LAAO_SCENARIOS.find((x) => x.id === scenarioId) ?? LAAO_SCENARIOS[0];
  const [step, setStep] = useState<Step>("measure");
  const [angle, setAngle] = useState<ToeAngle>(0);
  const [readings, setReadings] = useState<Partial<Record<ToeAngle, Reading>>>({});
  const [fossa, setFossa] = useState<FossaPoint>({ si: 0, ap: 0 });
  const [tsState, setTsState] = useState<TsState>(() => createTransseptal({ host: "laao" }));
  const dispatchTs = useCallback((a: TsAction) => setTsState((x) => transseptalStep(x, a)), []);
  const [hints, setHints] = useState(false);
  const [ts, setTs] = useState<TransseptalResult | null>(null);
  const [type, setType] = useState<LaaoDeviceType>(s.device ?? "plug");
  const [sizeMm, setSizeMm] = useState(deviceSizes(s.device ?? "plug")[2]);
  const [fluidMl, setFluidMl] = useState(0);
  const [angiogram, setAngiogram] = useState(false);
  const [deploy, setDeploy] = useState<LaaoDeployState | null>(null);
  const [laAtSizing, setLaAtSizing] = useState<number[]>([]);
  const [holdSheath, setHoldSheath] = useState(false);
  const [wetConnect, setWetConnect] = useState(false);
  const [ballMm, setBallMm] = useState(6);
  const [pullBackMm, setPullBackMm] = useState(2);
  const [tugCm, setTugCm] = useState(3);
  const [colour, setColour] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUpAction | null>(null);
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [launchMode, setLaunchMode] = useState<StructuralLaunch["mode"]>(null);
  const [runKey, setRunKey] = useState(0);
  const recorded = useRef(false);

  const run = useLabRun("laao", runCaseId("laao", s.id), launchMode, { runKey, caseName: `Structural lab, LAAO: ${s.title}` });
  const runRef = useRef(run);
  runRef.current = run;

  const reset = (id = scenarioId, mode?: StructuralLaunch["mode"], start: string | null = null) => {
    const sc = LAAO_SCENARIOS.find((x) => x.id === id) ?? LAAO_SCENARIOS[0];
    const first = launchStep(sc, start);
    if (mode !== undefined) setLaunchMode(mode);
    setRunKey((k) => k + 1);
    setScenarioId(sc.id);
    setStep(first);
    setAngle(0);
    setReadings({});
    setFossa({ si: 0, ap: 0 });
    setTsState(createTransseptal({ host: "laao" }));
    setHints(false);
    setTs(null);
    const fam = sc.deployed?.type ?? sc.device ?? "plug";
    setType(fam);
    setSizeMm(sc.deployed?.sizeMm ?? deviceSizes(fam)[2]);
    setFluidMl(0);
    setAngiogram(false);
    setDeploy(null);
    setLaAtSizing([]);
    setHoldSheath(false);
    setWetConnect(false);
    setBallMm(6);
    setPullBackMm(2);
    setTugCm(3);
    setColour(false);
    setFollowUp(null);
    setFollowUpOnly(first === "followup");
    recorded.current = false;
  };
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // a launch from a lesson or case: the scenario, the mode and the start, applied once
  useEffect(() => {
    if (!launch) return;
    resetRef.current(launch.scenario, launch.mode, launch.start);
    onLaunchTaken?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a launch is applied once, by its seq
  }, [launch?.seq]);

  // ----- filling and the coaxial line -----
  const filling = laaoFilling(s);
  const crossed = ts !== null;
  const laNow = laPressureAfterFluid(s, fluidMl);
  const toeNow = useMemo(() => toeMeasurementsAt(s, laNow), [s, laNow]);
  const coaxial = laaoCoaxial(s, fossa, SEPTAL_BASE_CM);
  const punctureQuality = laaoPunctureQuality(s, fossa, SEPTAL_BASE_CM);

  const plan: LaaoPlan = useMemo(() => {
    if (followUpOnly && s.deployed) return s.deployed;
    if (deploy) return deployPlan(deploy, { coaxial, transseptalDanger: ts?.danger ?? false });
    return { type, sizeMm, positionMm: POSITION_BANDS[type].ideal[0], coaxial, recaptures: 0, transseptalDanger: ts?.danger ?? false };
  }, [followUpOnly, s, deploy, coaxial, ts, type, sizeMm]);
  const outcome = useMemo(() => assessLaao(s, plan), [s, plan]);
  const criteria = useMemo(() => releaseCriteria(s, plan), [s, plan]);
  const finding = useMemo(() => followUpFinding(s, outcome.leakMm), [s, outcome.leakMm]);
  // before the device: the plane as measured, else as it is now; at the table: the appendage at the pressure reached
  // (assessLaao keeps the loaded appendage); in the debrief and at follow-up: the loaded appendage
  const shownM: AngleMeasurement =
    step === "measure" || step === "size"
      ? (readings[angle]?.m ?? toeNow.find((x) => x.angle === angle) ?? s.measurements[0])
      : step === "deploy" || step === "pass"
        ? (toeNow.find((x) => x.angle === angle) ?? s.measurements[0])
        : (s.measurements.find((x) => x.angle === angle) ?? s.measurements[0]);
  const released = deploy?.stage === "released" || followUpOnly;

  // stopped at the puncture (the surgeon took over): the debrief is the puncture's, with no device
  const abandoned = tsState.stage === "abandoned";
  const abandonSite = abandoned && transseptalPoint(tsState) ? ts : null;
  const abandonScore = useMemo(() => (abandoned && step === "debrief" ? scoreTransseptal(tsState, abandonSite) : null), [abandoned, step, tsState, abandonSite]);
  // a completed case: the puncture's own deductions beside the device score (the site is scored by scoreLaao)
  const punctureScore = useMemo(() => (!abandoned && !followUpOnly && step === "debrief" ? scoreTransseptal(tsState, null) : null), [abandoned, followUpOnly, step, tsState]);
  const measuredAngles = TOE_ANGLES.filter((a) => readings[a]);
  const score = useMemo(
    () =>
      step === "debrief" && ts && !abandoned && !followUpOnly && deploy
        ? scoreLaao(s, {
            plan,
            anglesMeasured: measuredAngles,
            transseptalQuality: punctureQuality,
            transseptalDanger: ts.danger,
            released,
            mechanics: { deploy, laAtMeasureMmHg: laAtSizing, fluidMl, coaxial, followUp },
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the score is read when the debrief opens
    [step, ts, s, plan, released, abandoned, followUpOnly, deploy, laAtSizing, fluidMl, coaxial, followUp, punctureQuality]
  );
  const followScore = useMemo(() => (step === "debrief" && followUpOnly ? scoreLaaoFollowUp(finding, followUp) : null), [step, followUpOnly, finding, followUp]);
  const best = useMemo(() => (step === "debrief" && !followUpOnly ? bestLaaoPlan(s) : null), [step, s, followUpOnly]);

  // stopped at the puncture: logged once with the puncture's score, failed, no device and no device decisions
  useEffect(() => {
    if (step !== "debrief" || !abandonScore || recorded.current) return;
    recorded.current = true;
    runRef.current.finish({
      score: abandonScore.score,
      passed: false,
      criticalErrors: abandonScore.critical.length + (abandonSite?.danger ? 1 : 0),
      metrics: { anglesMeasured: measuredAngles.length, pericardialMl: Math.round(tsState.pericardialMl), durationS: Math.round(tsState.t) },
      devices: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, abandonScore]);

  // the follow-up drill: one decision and its score
  useEffect(() => {
    if (step !== "debrief" || !followScore || recorded.current) return;
    recorded.current = true;
    const r = runRef.current;
    const v = followUp ? assessFollowUp(finding, followUp) : null;
    r.decide({
      id: "follow-up",
      stage: "assess",
      label: "Follow-up finding managed",
      correct: !!v?.correct,
      expected: FOLLOWUP_ACTION_LABEL[v?.expected ?? assessFollowUp(finding, "continue-plan").expected],
      given: followUp ? FOLLOWUP_ACTION_LABEL[followUp] : "none",
      lessonId: "hb-mitral-tricuspid-laa-laao-implant",
      tipIds: ["structural-laao-drt-anticoagulate"],
    });
    r.finish({ score: followScore.score, passed: followScore.score >= PASS_SCORE.default, criticalErrors: v?.correct ? 0 : 1, metrics: { followUpWeeks: finding.weeks }, devices: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, followScore]);

  useEffect(() => {
    if (step !== "debrief" || !score || !deploy || recorded.current) return;
    recorded.current = true;
    const r = runRef.current;
    r.decide({
      id: "measure-four-angles",
      stage: "plan",
      label: "Appendage measured at every TOE angle",
      correct: measuredAngles.length === TOE_ANGLES.length,
      expected: TOE_ANGLES.map((a) => `${a}°`).join(", "),
      given: measuredAngles.length ? measuredAngles.map((a) => `${a}°`).join(", ") : "none",
      lessonId: "hb-mitral-tricuspid-laa-laao-plan",
      tipIds: ["structural-laao-largest-measurement"],
    });
    const sizing = assessSizing(s, deploy.family, deploy.sizeMm, laAtSizing);
    r.decide({
      id: "fill-before-sizing",
      stage: "plan",
      label: "Measured with the atrium loaded",
      correct: sizing.loaded,
      expected: `Mean left atrial pressure above ${LA_LOADED_MMHG} mmHg in every plane used`,
      given: laAtSizing.length ? `${Math.min(...laAtSizing)}–${Math.max(...laAtSizing)} mmHg` : "not measured after crossing",
      lessonId: "hb-mitral-tricuspid-laa-laao-plan",
      tipIds: ["structural-laao-fill-before-sizing"],
    });
    r.decide({
      id: "size-largest",
      stage: "plan",
      label: "Sized from the largest valid measurement",
      correct: sizing.largeEnough,
      expected: `${sizing.referenceMm} mm or larger`,
      given: `${deploy.sizeMm} mm`,
      lessonId: "hb-mitral-tricuspid-laa-laao-plan",
      tipIds: ["structural-laao-largest-measurement"],
    });
    if ((s.axis ?? "superior-anterior") === "reverse-posterior")
      r.decide({
        id: "puncture-from-ct",
        stage: "access",
        label: "Puncture site chosen from the CT",
        correct: coaxial,
        expected: "Inferior, central or anterior",
        given: transseptalPoint(tsState) ? `${coaxial ? "coaxial" : "not coaxial"} from the site used` : "none",
        lessonId: "hb-mitral-tricuspid-laa-laao-plan",
        tipIds: ["structural-laao-puncture-from-ct"],
      });
    const moveFlags = deploy.flags.filter((f) => f.id === "plug-push" || f.id === "lobe-pull-sheath" || f.id === "lobe-push-before-ball");
    r.decide({
      id: "deployment-movement",
      stage: "deploy",
      label: "Each device deployed with its own movement",
      correct: moveFlags.length === 0,
      expected: deploy.family === "plug" ? "Hold the cable, withdraw the sheath" : "Ball, push the cable for the lobe, pull the sheath for the disc",
      given: moveFlags.length ? moveFlags.map((f) => f.text).join(" ") : "As expected",
      lessonId: "hb-mitral-tricuspid-laa-laao-implant",
      tipIds: deploy.family === "plug" ? ["structural-laao-plug-unsheathe"] : ["structural-laao-disc-ball-push"],
    });
    const anchors = deploy.flags.some((f) => f.id === "anchors-in-sheath" || f.id === "redeploy-damaged");
    if (deploy.family === "lobe-disc")
      r.decide({
        id: "anchors-out-of-sheath",
        stage: "deploy",
        label: "Anchors kept out of the sheath",
        correct: !anchors,
        expected: "Partial recapture only to the lobe marker",
        given: anchors ? "Anchors entered the sheath" : "As expected",
        lessonId: "hb-mitral-tricuspid-laa-laao-implant",
        tipIds: ["structural-laao-anchors-in-sheath"],
      });
    r.decide({
      id: "release-criteria",
      stage: "assess",
      label: "Release only when every criterion is met",
      correct: releaseDecisionCorrect(deploy.release),
      expected: deploy.family === "plug" ? "PASS checked and met" : "Shape, tug, four-plane seal and a wait, all met",
      given: !deploy.release ? "Not released" : releaseDecisionCorrect(deploy.release) ? "All met" : [...deploy.release.missing, ...deploy.release.unmet].join("; "),
      lessonId: "hb-mitral-tricuspid-laa-laao-implant",
      tipIds: [deploy.family === "plug" ? "structural-laao-plug-pass" : "structural-laao-disc-criteria"],
    });
    if (followUp) {
      const v = assessFollowUp(finding, followUp);
      r.decide({
        id: "follow-up",
        stage: "assess",
        label: "Follow-up finding managed",
        correct: v.correct,
        expected: FOLLOWUP_ACTION_LABEL[v.expected],
        given: FOLLOWUP_ACTION_LABEL[followUp],
        lessonId: "hb-mitral-tricuspid-laa-laao-implant",
        tipIds: ["structural-laao-drt-anticoagulate"],
      });
    }
    r.finish({
      score: score.score,
      passed: score.score >= PASS_SCORE.default && outcome.allPass && releaseDecisionCorrect(deploy.release),
      // the site's danger zone, as before, the puncture's own critical errors and the deployment's
      criticalErrors: (ts?.danger ? 1 : 0) + tsState.critical.length + deploy.flags.filter((f) => f.severity === "critical").length,
      metrics: { recaptures: deploy.recaptures, anglesMeasured: measuredAngles.length, leakMm: Math.round(outcome.leakMm * 10) / 10, fluidMl, devicesUsed: deploy.devicesUsed },
      devices: [`${deploy.sizeMm} mm ${deploy.family === "plug" ? "plug" : "lobe-and-disc"} occluder`],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, score]);

  // ----- tips -----
  const tipContext = useMemo(() => laaoLabTipContext(step, deploy, tsState), [step, deploy, tsState]);
  const { tips, visible } = useContextTips(tipContext, run);
  const live = useRef({ step, s, deploy, readings, tsState, laNow, fluidMl });
  live.current = { step, s, deploy, readings, tsState, laNow, fluidMl };
  // DEV: window.__lab.structural
  const ctxNow = useCallback(() => laaoLabTipContext(live.current.step, live.current.deploy, live.current.tsState), []);
  useEffect(
    () =>
      registerLabHook("structural", {
        context: ctxNow,
        tips: () => selectTips(loadedTips(), ctxNow(), runRef.current.run).map((t) => t.id),
        state: () => {
          const t = live.current.tsState;
          const d = live.current.deploy;
          return {
            procedure: "laao",
            scenario: live.current.s.id,
            step: live.current.step,
            measured: TOE_ANGLES.filter((a) => live.current.readings[a]),
            laMeanMmHg: live.current.laNow,
            fluidMl: live.current.fluidMl,
            recaptures: d?.recaptures ?? 0,
            deploy: d ? { family: d.family, sizeMm: d.sizeMm, stage: d.stage, pigtail: d.pigtail, sheathTipMm: d.sheathTipMm, positionMm: d.positionMm, connection: d.connection, flags: d.flags.map((f) => f.id), release: d.release } : null,
            puncture: { stage: t.stage, zone: t.zone, clockH: t.clockH, contact: t.contact, crossedAt: t.crossedAt, checks: t.checks, events: transseptalEvents(t), t: t.t, critical: t.critical },
          };
        },
        events: () => ctxNow()?.events ?? [],
      }),
    [ctxNow]
  );
  const exam = run.mode === "exam";
  const aids = hints && !exam;
  // TransseptalStage's site aid marks the usual inferior-posterior site; for a reverse or posteriorly bent
  // appendage it would teach the wrong site, so its aids stay off until that stage takes the scenario's axis
  const tsAids = aids && (s.axis ?? "superior-anterior") === "superior-anterior";

  // the left atrium is secured: the site goes to sizing; the mean LA pressure is now known
  const continueFromPuncture = () => {
    const p = transseptalPoint(tsState);
    if (!p) return;
    for (const dcs of transseptalDecisions(tsState)) runRef.current.decide(dcs);
    setFossa(p);
    setTs(assessTransseptal("laao", p, SEPTAL_BASE_CM));
    setStep("size");
  };
  // the puncture stopped the procedure (the surgeon took over)
  const abandonAtPuncture = () => {
    const p = transseptalPoint(tsState) ?? fossa;
    for (const dcs of transseptalDecisions(tsState)) runRef.current.decide(dcs);
    setTs(assessTransseptal("laao", p, SEPTAL_BASE_CM));
    setStep("debrief");
  };

  // ----- actions -----
  const measureHere = () => {
    const m = toeNow.find((x) => x.angle === angle)!;
    setReadings((r) => ({ ...r, [angle]: { m, laMmHg: crossed ? laNow : null } }));
  };
  const remeasureAll = () => {
    const next: Partial<Record<ToeAngle, Reading>> = {};
    for (const a of TOE_ANGLES) next[a] = { m: toeNow.find((x) => x.angle === a)!, laMmHg: laNow };
    setReadings(next);
  };
  const giveFluid = () => setFluidMl((v) => Math.min(FLUID_STEP_ML * 6, v + FLUID_STEP_ML));
  const setDeviceType = (t: LaaoDeviceType) => {
    setType(t);
    const sizes = deviceSizes(t);
    setSizeMm(sizes[Math.floor(sizes.length / 2)]);
  };
  const startDeploy = () => {
    // the pressure each plane was measured at (before crossing the pressure is the starting one)
    setLaAtSizing(TOE_ANGLES.map((a) => readings[a]).filter((r): r is Reading => !!r).map((r) => r.laMmHg ?? filling.laMeanMmHg));
    setDeploy(createLaaoDeploy(s, type, sizeMm));
    setBallMm(landingZoneDepthMm(sizeMm) - LOBE_HALF);
    setStep("deploy");
  };
  // the deployment moves on from the latest state (a ref, so two actions in one render both apply)
  const deployRef = useRef(deploy);
  deployRef.current = deploy;
  const act = (a: DeployAction) => {
    const x = deployRef.current;
    if (!x) return;
    const next = laaoDeployStep(s, x, a, coaxial);
    deployRef.current = next;
    setDeploy(next);
    if (next.stage === "deployed" && x.stage !== "deployed") setStep("pass");
    else if (next.stage === "released") setStep("followup");
    else if (next.stage !== "deployed" && x.stage === "deployed") setStep("deploy");
  };
  // colour Doppler sweeps the plane on screen
  useEffect(() => {
    if (step === "pass" && colour && deploy?.stage === "deployed" && !deploy.colourPlanes.includes(angle)) act({ kind: "colour", angle });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a plane is recorded when it is viewed in colour
  }, [step, colour, angle, deploy?.stage, deploy?.colourPlanes.length]);

  const showDevice = step === "deploy" || step === "pass" || step === "followup" || (step === "debrief" && !abandoned);
  const drawStage: "ball" | "lobe-open" | "deployed" | null = followUpOnly
    ? "deployed"
    : !deploy
      ? null
      : deploy.stage === "ball"
        ? "ball"
        : deploy.stage === "lobe-open"
          ? "lobe-open"
          : deploy.stage === "deployed" || deploy.stage === "released"
            ? "deployed"
            : null;
  const deviceDraw =
    showDevice && drawStage
      ? { type: plan.type, sizeMm: plan.sizeMm, positionMm: plan.positionMm, expansion: 1, tug: 0, anchor: outcome.anchor, stage: drawStage }
      : null;
  const planesLeft = TOE_ANGLES.filter((a) => !deploy?.colourPlanes.includes(a));
  const sealShown = !!deploy && planesLeft.length === 0;
  const m135 = toeNow.find((x) => x.angle === 135) ?? s.measurements[0];
  const measuredMinDepth = measuredAngles.length ? Math.min(...measuredAngles.map((a) => readings[a]!.m.depthMm)) : null;
  const missing = TOE_ANGLES.filter((a) => !readings[a]);
  const ct = modalityReading(s, "ct");
  const dim = (r: { ostiumMm: number; landingZoneMm: number }) => (type === "plug" ? r.ostiumMm : r.landingZoneMm);
  const toeMax = measuredAngles.length ? Math.max(...measuredAngles.map((a) => sizingDimension(type, readings[a]!.m))) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <select className="min-w-0 max-w-full truncate rounded-md border border-line bg-base-800 px-2 py-1 text-sm text-ink" value={scenarioId} onChange={(e) => reset(e.target.value, null)}>
            {LAAO_SCENARIOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={() => reset(scenarioId, undefined, followUpOnly ? "followup" : null)}>
            Restart case
          </button>
          <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()} />
        </div>
        <StepRail steps={STEPS} current={step} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ------------------------------ viewer ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {step === "transseptal" || (abandoned && step === "debrief") ? (
            <Panel title="Transseptal puncture" right={!exam && step === "transseptal" ? <Toggle label="Guided aids" checked={hints} onChange={setHints} /> : undefined}>
              <TransseptalViews state={tsState} procedure="laao" baseCm={SEPTAL_BASE_CM} aids={tsAids && step === "transseptal"} />
            </Panel>
          ) : (
            <Panel
              title={step === "followup" ? `TOE at ${finding.weeks} weeks` : `TOE: ${MORPHOLOGY_LABEL[s.morphology].toLowerCase()} appendage`}
              bodyClass="p-0"
            >
              {/* the plane and colour controls sit in a wrapping row under the header, so a narrow pane never clips them */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-3 py-2">
                <Seg options={TOE_ANGLES.map((a) => ({ id: a, label: `${a}°` }))} value={angle} onChange={setAngle} />
                {(step === "pass" || step === "followup" || step === "debrief") && <Toggle label="Colour" checked={colour} onChange={setColour} />}
              </div>
              <div className="monitor rounded-b-lg overflow-hidden">
                <LaaToeView
                  m={shownM}
                  morph={s.morphology}
                  measured={!!readings[angle] && !showDevice}
                  device={deviceDraw}
                  leakMm={step === "pass" || step === "followup" || step === "debrief" ? (step === "followup" ? finding.leakMm : outcome.leakMm) : 0}
                  colour={colour}
                  thrombusMm={step === "followup" && finding.drt ? finding.drtMm : 0}
                  label={step === "followup" ? "follow-up TOE, LAA view" : undefined}
                />
              </div>
            </Panel>
          )}

          {(step === "deploy" || step === "pass") && deploy && (
            <Panel title="Fluoroscopy" bodyClass="p-0" right={!exam ? <Toggle label="Guided aids" checked={hints} onChange={setHints} /> : undefined}>
              <div className="rounded-b-lg overflow-hidden">
                <LaaFluoroView
                  m={m135}
                  sheathTipMm={deploy.sheathTipMm}
                  pigtail={deploy.pigtail}
                  family={deploy.family}
                  device={{ family: deploy.family, sizeMm: deploy.sizeMm, stage: deploy.stage, positionMm: deploy.positionMm }}
                  opacified={deploy.pigtail !== "none" || angiogram || deploy.family === "lobe-disc"}
                  aids={aids}
                  markerToWallMm={markerToWallMm(s, deploy.sheathTipMm)}
                  wallMm={appendageWallMm(s)}
                />
              </div>
            </Panel>
          )}

          {step === "pass" && deploy?.measured && (
            <Panel title="Compression at each plane">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-faint">
                    <th className="text-left font-normal py-1">Angle</th>
                    <th className="text-left font-normal py-1">{SIZING_LABEL[plan.type]}</th>
                    <th className="text-left font-normal py-1">Device</th>
                    <th className="text-right font-normal py-1">Compression</th>
                  </tr>
                </thead>
                <tbody>
                  {outcome.compression.byAngle.map((a) => (
                    <tr key={a.angle} className={a.angle === angle ? "bg-accent/10" : ""}>
                      <td className="py-0.5 font-mono">{a.angle}°</td>
                      <td className="py-0.5 font-mono">{a.referenceMm} mm</td>
                      <td className="py-0.5 font-mono">{plan.sizeMm} mm</td>
                      <td className="py-0.5 font-mono text-right">{a.pct.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[12px] text-ink-faint mt-1.5">
                Compression = (nominal − measured) / nominal. {plan.type === "plug" ? "Plug" : "Lobe"}: {compressionLabel(plan.type)}.
              </p>
            </Panel>
          )}

          {step === "debrief" && !abandoned && !followUpOnly && (
            <Panel title="Debrief: risks and their reasons">
              <RiskList
                initiallyOpen
                risks={[
                  { key: "emb", label: outcome.embolisation.label, level: outcome.embolisation.level, reasons: outcome.embolisation.reasons },
                  { key: "eff", label: outcome.effusion.label, level: outcome.effusion.level, reasons: outcome.effusion.reasons },
                ]}
              />
              {deploy && deploy.flags.length > 0 && (
                <div className="mt-3">
                  <Teach title="Deployment record" tone="warn">
                    <ul className="space-y-0.5">
                      {deploy.flags.map((f, i) => (
                        <li key={i}>
                          • <span className={f.severity === "critical" ? "text-danger" : f.severity === "major" ? "text-warn" : ""}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </Teach>
                </div>
              )}
              <div className="mt-3">
                <Teach title="Device-related thrombus: counselling and follow-up">
                  <ul className="space-y-0.5">
                    {outcome.drtNotes.map((n, i) => (
                      <li key={i}>• {n}</li>
                    ))}
                  </ul>
                </Teach>
              </div>
            </Panel>
          )}
        </div>

        {/* ------------------------------ controls ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {step === "measure" && (
            <>
              <Panel title="Patient">
                <p className="text-xs text-ink-soft leading-relaxed">{s.vignette}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="chip">{MORPHOLOGY_LABEL[s.morphology]}</span>
                  {s.axis === "reverse-posterior" && <span className="chip">Proximal segment bends posteriorly</span>}
                </div>
                <p className="text-[12px] text-accent mt-2">{s.focus}</p>
              </Panel>
              <Panel title="Planning CT">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Max ostium" value={`${ct.ostiumMm}`} unit="mm" small />
                  <Readout label="Landing zone" value={`${ct.landingZoneMm}`} unit="mm" small />
                  <Readout label="Depth" value={`${ct.depthMm}`} unit="mm" small />
                </div>
                <p className="text-[12px] text-ink-faint mt-1.5">
                  {s.axis === "reverse-posterior"
                    ? "Reverse chicken-wing: the proximal appendage bends back posteriorly before the wing."
                    : "The neck angles superiorly and anteriorly; the body points superior-anterior."}{" "}
                  Measured at 30–40% of the RR interval.
                </p>
              </Panel>
              <Panel title="Measure at each angle">
                <div className="space-y-3">
                  <button className="btn btn-accent w-full" disabled={!!readings[angle]} onClick={measureHere}>
                    {readings[angle] ? `Measured at ${angle}°` : `Measure at ${angle}°`}
                  </button>
                  <ReadingsTable readings={readings} angle={angle} />
                  <Teach>
                    The appendage is oval and its axis curves. Measure the ostium, the landing zone about 10–12 mm inside,
                    and the usable depth at 0°, 45°, 90° and 135°, at end-systole. Size to the largest value, check compression at the
                    smallest.
                  </Teach>
                  <button className="btn w-full" onClick={() => setStep("transseptal")}>
                    {missing.length > 0 ? `Continue (${missing.length} angle${missing.length > 1 ? "s" : ""} not measured)` : "Plan the transseptal puncture"}
                  </button>
                </div>
              </Panel>
            </>
          )}

          {step === "transseptal" && (
            <>
              <TransseptalControls
                key={runKey}
                state={tsState}
                dispatch={dispatchTs}
                procedure="laao"
                baseCm={SEPTAL_BASE_CM}
                aids={tsAids}
                exam={exam}
                drill={false}
                onContinue={continueFromPuncture}
                continueLabel="Continue: fill and size"
                onAbandon={abandonAtPuncture}
              />
              <Teach>
                Most appendages point anteriorly and superiorly: an inferior and posterior puncture lines the sheath up with
                the axis. Read the planning CT first; a reverse chicken-wing or a posteriorly bent neck needs an inferior but
                central or anterior site.
                {aids && !tsAids ? " The puncture aids are off for this appendage: they mark the usual site, so plan this one from the CT." : ""}
              </Teach>
            </>
          )}

          {step === "size" && (
            <>
              <Panel title="Left atrial pressure">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Readout label="Mean LA pressure" value={laNow.toFixed(1)} unit="mmHg" small />
                    <Readout label="Fluid given" value={`${fluidMl}`} unit="mL" small />
                  </div>
                  <p className="text-[12px] text-ink-faint">LVEF {filling.lv === "normal" ? "preserved" : "reduced, history of heart failure"}.</p>
                  <button className="btn w-full" onClick={giveFluid} disabled={fluidMl >= FLUID_STEP_ML * 6}>
                    Give {FLUID_STEP_ML} mL saline
                  </button>
                  <Teach>
                    Confirm the measurements with a mean left atrial pressure above {LA_LOADED_MMHG} mmHg. Below {LA_FLUID_TRIGGER_MMHG}–{LA_LOADED_MMHG} mmHg, a
                    fluid challenge of 250–1,000 mL by LV function and heart failure history.
                  </Teach>
                </div>
              </Panel>
              <Panel title="Measurements">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn" onClick={measureHere}>
                      Measure at {angle}°
                    </button>
                    <button className="btn" onClick={remeasureAll}>
                      Re-measure all four
                    </button>
                  </div>
                  <ReadingsTable readings={readings} angle={angle} withPressure />
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-ink-faint">
                        <th className="text-left font-normal">Modality</th>
                        <th className="text-right font-normal">Max {type === "plug" ? "ostium" : "landing zone"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-0.5">{MODALITY_LABEL.ct}</td>
                        <td className="font-mono text-right">{dim(ct)} mm</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{MODALITY_LABEL.toe} (your planes)</td>
                        <td className="font-mono text-right">{toeMax !== null ? `${toeMax} mm` : "–"}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{MODALITY_LABEL.fluoro}</td>
                        <td className="font-mono text-right">{angiogram ? `${dim(modalityReading(s, "fluoro"))} mm` : "–"}</td>
                      </tr>
                    </tbody>
                  </table>
                  <button className="btn w-full" disabled={angiogram} onClick={() => setAngiogram(true)}>
                    {angiogram ? "Appendage angiogram done (RAO caudal)" : "Appendage angiogram (RAO caudal)"}
                  </button>
                </div>
              </Panel>
              <Panel title="Choose the device">
                <div className="space-y-3">
                  <Seg
                    options={[
                      { id: "plug", label: DEVICE_LABEL.plug },
                      { id: "lobe-disc", label: DEVICE_LABEL["lobe-disc"] },
                    ]}
                    value={type}
                    onChange={setDeviceType}
                  />
                  <div className="flex flex-wrap gap-1">
                    {deviceSizes(type).map((d) => (
                      <button key={d} className={`btn px-2 py-1 text-xs ${d === sizeMm ? "btn-accent" : ""}`} onClick={() => setSizeMm(d)}>
                        {d} mm
                      </button>
                    ))}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-ink-faint">
                        <th className="text-left font-normal">Angle</th>
                        <th className="text-right font-normal">{type === "plug" ? "Ostium" : "Landing zone"}</th>
                        <th className="text-right font-normal">Compression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOE_ANGLES.map((a) => {
                        const r = readings[a];
                        const ref = r ? sizingDimension(type, r.m) : null;
                        const c = ref !== null ? compressionPct(sizeMm, ref) : null;
                        return (
                          <tr key={a}>
                            <td className="font-mono py-0.5">{a}°</td>
                            <td className="font-mono text-right">{ref !== null ? `${ref} mm` : "not measured"}</td>
                            <td className="font-mono text-right">{c !== null ? `${c.toFixed(0)}%` : "–"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-2 gap-2">
                    <Readout label={type === "plug" ? "Depth needed (≈½ diameter)" : "Lobe length"} value={deviceLengthMm(type, sizeMm).toFixed(1)} unit="mm" small />
                    {type === "lobe-disc" ? (
                      <Readout label="Disc" value={discDiameter(sizeMm).toFixed(0)} unit="mm" small />
                    ) : (
                      <Readout label="Measured depth (min)" value={measuredAngles.length ? `${Math.min(...measuredAngles.map((a) => readings[a]!.m.depthMm))}` : "–"} unit="mm" small />
                    )}
                  </div>
                  <Teach>
                    {type === "plug"
                      ? "The plug sits at the ostium: size it against the maximum ostium width (from the circumflex to 1–2 cm inside the ridge). It needs usable depth of about half its diameter."
                      : `The lobe anchors in the landing zone about ${landingZoneDepthMm(sizeMm)} mm inside for this size: size it against the maximum landing zone. The disc must be wider than the ostium.`}{" "}
                    Window {compressionWindow(type).min}–{compressionWindow(type).max}%: {compressionLabel(type)}. Device geometry here is generic and
                    illustrative.
                  </Teach>
                  <button className="btn btn-accent w-full" onClick={startDeploy}>
                    Take the device to the table
                  </button>
                </div>
              </Panel>
            </>
          )}

          {step === "deploy" && deploy && <DeployControls x={deploy} measuredMinDepth={measuredMinDepth} act={act} holdSheath={holdSheath} setHoldSheath={setHoldSheath} wet={wetConnect} setWet={setWetConnect} ballMm={ballMm} setBallMm={setBallMm} onBack={() => { setDeploy(null); setStep("size"); }} />}

          {step === "pass" && deploy && (
            <Panel title={deploy.family === "plug" ? "Release checks (PASS)" : "Release checks"}>
              <div className="space-y-2.5">
                {deploy.family === "plug" ? (
                  <>
                    <CritRow letter="P" title="Position" c={criteria[0]} shown={deploy.measured} hidden="Measure the device in the four planes." aids={aids} />
                    <CritRow letter="A" title="Anchor" c={criteria[1]} shown={!!deploy.tug} hidden={`Tug the cable with the catheter tip ${PLUG_TUG_TIP_BACK_CM[0]}–${PLUG_TUG_TIP_BACK_CM[1]} cm from the hub.`} aids={aids} />
                    <CritRow letter="S" title="Size" c={criteria[2]} shown={deploy.measured} hidden="Measure the shoulder in every plane." aids={aids} />
                    <CritRow letter="S" title="Seal" c={criteria[3]} shown={sealShown} hidden={`Colour Doppler in every plane (${planesLeft.map((a) => `${a}°`).join(", ")} still to sweep; ${LEAK_LABEL}).`} aids={aids} />
                  </>
                ) : (
                  criteria.map((c) => {
                    const shown = c.id === "anchor" ? !!deploy.tug : c.id === "seal" ? sealShown : deploy.shapeChecked;
                    const hidden = c.id === "anchor" ? `Tug with the sheath tip about ${LOBE_TUG_TIP_BACK_CM} cm from the device.` : c.id === "seal" ? `Colour Doppler in every plane (${planesLeft.map((a) => `${a}°`).join(", ") || "done"}).` : "Check the shape after the tug.";
                    return <CritRow key={c.id} letter="•" title={c.label} c={c} shown={shown} hidden={hidden} aids={aids} />;
                  })
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="btn" onClick={() => act({ kind: "measure-device" })} disabled={deploy.measured}>
                    Measure the device
                  </button>
                  <button className="btn" onClick={() => setColour(true)} disabled={colour}>
                    Colour Doppler
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ink-faint shrink-0">Tip back</span>
                  <Seg options={TUG_OPTIONS.map((c) => ({ id: c, label: `${c} cm` }))} value={tugCm} onChange={setTugCm} />
                </div>
                <button className="btn w-full" onClick={() => act({ kind: "tug", tipBackCm: tugCm })}>
                  Tug test
                </button>
                {deploy.family === "lobe-disc" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn" onClick={() => act({ kind: "check-shape" })} disabled={deploy.shapeChecked || !deploy.tug}>
                      Check the shape
                    </button>
                    <button className="btn" onClick={() => act({ kind: "wait", min: 1 })}>
                      Wait 1 min ({deploy.waitedMin})
                    </button>
                  </div>
                )}
                <RecaptureControls x={deploy} act={act} pullBackMm={pullBackMm} setPullBackMm={setPullBackMm} />
                <button className="btn btn-accent w-full" onClick={() => act({ kind: "release" })}>
                  Release the device
                </button>
                {deploy.log.length > 0 && <p className="text-[12px] text-ink-faint">{deploy.log[deploy.log.length - 1]}</p>}
              </div>
            </Panel>
          )}

          {step === "followup" && (
            <Panel title={`Follow-up at ${finding.weeks} weeks (${FOLLOWUP_WEEKS[0]}–${FOLLOWUP_WEEKS[1]})`}>
              <div className="space-y-2.5">
                {followUpOnly && <p className="text-xs text-ink-soft leading-relaxed">{s.vignette}</p>}
                <p className="text-xs text-ink-soft">
                  Atrial face of the device:{" "}
                  {finding.drt ? `a homogeneous echodensity adherent to the device surface, ${finding.drtMm} mm, mobile at its tip.` : "smooth, no echodensity."}
                </p>
                <p className="text-xs text-ink-soft">
                  Peri-device flow on colour Doppler: {colour ? (finding.leakMm > 0 ? `a ${finding.leakMm.toFixed(1)} mm jet.` : "none.") : "turn colour on to look."}
                </p>
                <div className="space-y-1.5">
                  {FOLLOWUP_ACTIONS.map((a) => (
                    <button key={a} className={`btn w-full text-left ${followUp === a ? "btn-accent" : ""}`} aria-pressed={followUp === a} onClick={() => setFollowUp(a)}>
                      {FOLLOWUP_ACTION_LABEL[a]}
                    </button>
                  ))}
                </div>
                <button className="btn btn-accent w-full" disabled={!followUp} onClick={() => setStep("debrief")}>
                  Record the plan and finish
                </button>
              </div>
            </Panel>
          )}

          {step === "debrief" && abandoned && abandonScore && (
            <>
              <Panel title="Procedure stopped at the puncture">
                <p className="text-xs text-ink-soft">The surgical team took over; no device was implanted.</p>
              </Panel>
              <TransseptalDebrief state={tsState} score={abandonScore} />
              <NextButtons onRepeat={() => reset()} onNext={() => reset(LAAO_SCENARIOS[(LAAO_SCENARIOS.findIndex((x) => x.id === scenarioId) + 1) % LAAO_SCENARIOS.length].id)} />
            </>
          )}

          {step === "debrief" && followScore && (
            <>
              <Panel title="Score">
                <div className="space-y-3">
                  <ScoreBadge score={followScore.score} />
                  <DeductionList items={followScore.deductions} />
                </div>
              </Panel>
              <Panel title="Teaching points">
                <ul className="space-y-1 text-xs text-ink-soft">
                  {s.teachingPoints.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </Panel>
              <NextButtons onRepeat={() => reset(scenarioId, undefined, "followup")} onNext={() => reset(LAAO_SCENARIOS[(LAAO_SCENARIOS.findIndex((x) => x.id === scenarioId) + 1) % LAAO_SCENARIOS.length].id)} />
            </>
          )}

          {step === "debrief" && score && best && deploy && (
            <>
              <Panel title="Score">
                <div className="space-y-3">
                  <ScoreBadge score={score.score} />
                  <DeductionList items={score.deductions} />
                </div>
              </Panel>
              {punctureScore && <TransseptalSummary score={punctureScore} />}
              <Panel title="Released device">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Device" value={`${deploy.sizeMm} mm`} small />
                  <Readout label="Leak" value={outcome.leakMm.toFixed(1)} unit="mm" tone={outcome.leakMm >= LEAK_LIMIT_MM ? "danger" : outcome.leakMm > 0 ? "warn" : "good"} small />
                  <Readout label="Recaptures" value={`${deploy.recaptures}`} small />
                </div>
                <p className="text-[12px] text-ink-faint mt-2">
                  {DEVICE_LABEL[deploy.family]}, compression {outcome.compression.min.toFixed(0)}–{outcome.compression.max.toFixed(0)}%; sized at a mean LA pressure of{" "}
                  {laAtSizing.length ? `${Math.min(...laAtSizing)}` : "–"} mmHg; {coaxial ? "coaxial" : "non-coaxial"} sheath.
                </p>
              </Panel>
              <Panel title="Reference plan in this model">
                <p className="text-xs text-ink-soft">
                  One plan that meets its release criteria with low risks: {DEVICE_LABEL[best.plan.type].toLowerCase()} {best.plan.sizeMm} mm at {best.plan.positionMm.toFixed(1)} mm, with
                  coaxial access, measured with the atrium loaded.
                  {outcome.allPass && releaseDecisionCorrect(deploy.release) ? " Your device also met its release criteria." : ""}
                </p>
              </Panel>
              <Panel title="Teaching points">
                <ul className="space-y-1 text-xs text-ink-soft">
                  {s.teachingPoints.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </Panel>
              <NextButtons onRepeat={() => reset()} onNext={() => reset(LAAO_SCENARIOS[(LAAO_SCENARIOS.findIndex((x) => x.id === scenarioId) + 1) % LAAO_SCENARIOS.length].id)} />
            </>
          )}

          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={tipContext?.events ?? []} />

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}

/** Half the illustrative lobe length: the ball is moved so the lobe centres on the landing zone. */
const LOBE_HALF = 4;

function ReadingsTable({ readings, angle, withPressure = false }: { readings: Partial<Record<ToeAngle, Reading>>; angle: ToeAngle; withPressure?: boolean }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-ink-faint">
          <th className="text-left font-normal">Angle</th>
          <th className="text-right font-normal">Ostium</th>
          <th className="text-right font-normal">Landing zone</th>
          <th className="text-right font-normal">Depth</th>
          {withPressure && <th className="text-right font-normal">LA mean</th>}
        </tr>
      </thead>
      <tbody>
        {TOE_ANGLES.map((a) => {
          const r = readings[a];
          return (
            <tr key={a} className={a === angle ? "bg-accent/10" : ""}>
              <td className="font-mono py-0.5">{a}°</td>
              <td className="font-mono text-right">{r ? r.m.ostiumMm : "–"}</td>
              <td className="font-mono text-right">{r ? r.m.landingZoneMm : "–"}</td>
              <td className="font-mono text-right">{r ? r.m.depthMm : "–"}</td>
              {withPressure && <td className="font-mono text-right">{r ? (r.laMmHg === null ? "before crossing" : `${r.laMmHg}`) : "–"}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DeployControls({
  x,
  measuredMinDepth,
  act,
  holdSheath,
  setHoldSheath,
  wet,
  setWet,
  ballMm,
  setBallMm,
  onBack,
}: {
  x: LaaoDeployState;
  /** the learner's own shallowest measured depth, not the loaded appendage */
  measuredMinDepth: number | null;
  act: (a: DeployAction) => void;
  holdSheath: boolean;
  setHoldSheath: (v: boolean) => void;
  wet: boolean;
  setWet: (v: boolean) => void;
  ballMm: number;
  setBallMm: (v: number) => void;
  onBack: () => void;
}) {
  const plug = x.family === "plug";
  return (
    <Panel title={`Position and deploy: ${x.sizeMm} mm ${DEVICE_LABEL[x.family].toLowerCase()}`}>
      <div className="space-y-3">
        {x.stage === "sheath" && (
          <>
            {plug && x.pigtail === "none" && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <Readout label="Sheath across the septum" value={x.sheathAcrossCm.toFixed(1)} unit="cm" small />
                  <div className="grid grid-cols-2 gap-1">
                    <button className="btn px-1 text-xs" onClick={() => act({ kind: "sheath-across", cm: x.sheathAcrossCm - 0.5 })}>
                      Pull 5 mm
                    </button>
                    <button className="btn px-1 text-xs" onClick={() => act({ kind: "sheath-across", cm: x.sheathAcrossCm + 0.5 })}>
                      Push 5 mm
                    </button>
                  </div>
                </div>
                <button className="btn w-full" onClick={() => act({ kind: "pigtail" })}>
                  Turn the marker pigtail into the deepest lobe
                </button>
              </div>
            )}
            <div>
              <p className="text-[12px] text-ink-faint mb-1">{plug ? "Access sheath" : "Delivery sheath"}</p>
              <div className="grid grid-cols-4 gap-1">
                {[-5, -2, 2, 5].map((mm) => (
                  <button key={mm} className="btn px-1 text-xs" onClick={() => act({ kind: "advance-sheath", mm })}>
                    {mm > 0 ? `Advance ${mm}` : `Withdraw ${-mm}`} mm
                  </button>
                ))}
              </div>
            </div>
            {plug && x.pigtail === "in-lobe" && (
              <div className="space-y-1.5">
                <Toggle label="Hold the sheath still" checked={holdSheath} onChange={setHoldSheath} />
                <button className="btn w-full" onClick={() => act({ kind: "remove-pigtail", holdSheath })}>
                  Remove the pigtail
                </button>
              </div>
            )}
            {(!plug || x.pigtail !== "in-lobe") && (
              <div className="space-y-1.5">
                <Toggle label="Valve low, back-bleeding; delivery catheter flushed" checked={wet} onChange={setWet} />
                <button className="btn btn-accent w-full" onClick={() => act({ kind: "connect", wet })}>
                  Insert and connect the device
                </button>
              </div>
            )}
            <Teach>
              {plug
                ? "Pigtail into the deepest lobe, sheath over it with the distal marker (5 mm behind the tip) kept at least 5 mm from the wall. The proximal bands show where the loaded 21, 27 and 33 mm devices will end. Leave the pigtail in until the device is ready."
                : "Take the delivery sheath to the ostium, directly or over a pigtail, then prepare the device without air."}
            </Teach>
          </>
        )}

        {(x.stage === "loaded" || x.stage === "ball" || x.stage === "lobe-open") && (
          <>
            {x.stage === "loaded" && plug && <Toggle label="Ventilation held" checked={x.ventilationHeld} onChange={(v) => act({ kind: "ventilation", held: v })} />}
            {x.stage === "ball" && (
              <>
                <Slider label="Sheath and ball inside the ostium" value={ballMm} min={-4} max={14} step={0.5} unit="mm" onChange={setBallMm} />
                <button className="btn w-full" onClick={() => act({ kind: "move-ball", toMm: ballMm })}>
                  Move sheath and ball together
                </button>
              </>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button className="btn" onClick={() => act({ kind: "unsheathe" })}>
                Hold the cable, withdraw the sheath
              </button>
              <button className="btn" onClick={() => act({ kind: "push-cable" })}>
                Fix the sheath, push the cable
              </button>
            </div>
            <p className="text-[12px] text-ink-faint">
              {x.stage === "loaded" ? "The device is in the sheath." : x.stage === "ball" ? "The lobe is a ball at the sheath tip." : "The lobe is open; the disc is still in the sheath."}
            </p>
            {x.stage === "lobe-open" && <RecaptureControls x={x} act={act} pullBackMm={0} setPullBackMm={() => undefined} />}
          </>
        )}

        {x.stage === "removed" && (
          <div className="space-y-1.5">
            <p className="text-xs text-ink-soft">The device is out of the patient.</p>
            <button className="btn w-full" onClick={() => act({ kind: "new-device" })}>
              Reload with a new device
            </button>
            <button className="btn w-full" onClick={() => act({ kind: "redeploy-same" })}>
              Advance the same device again
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Readout label="Measured depth (min)" value={measuredMinDepth === null ? "–" : `${measuredMinDepth}`} unit="mm" small />
          <Readout label="Recaptures" value={`${x.recaptures}`} small />
        </div>
        {x.log.length > 0 && <p className="text-[12px] text-ink-faint">{x.log[x.log.length - 1]}</p>}
        {x.stage === "sheath" && (
          <button className="btn w-full" onClick={onBack}>
            Back to sizing
          </button>
        )}
      </div>
    </Panel>
  );
}

function RecaptureControls({ x, act, pullBackMm, setPullBackMm }: { x: LaaoDeployState; act: (a: DeployAction) => void; pullBackMm: number; setPullBackMm: (v: number) => void }) {
  if (x.family === "plug")
    return (
      <div className="space-y-1.5 border-t border-line pt-2">
        <Slider label="Partial recapture: move the device" value={pullBackMm} min={-6} max={6} step={1} unit="mm" onChange={setPullBackMm} format={(v) => (v < 0 ? `${-v} back` : v > 0 ? `${v} forward` : "0")} />
        <div className="grid grid-cols-2 gap-2">
          <button className="btn text-xs" onClick={() => act({ kind: "partial-recapture", advanceMm: pullBackMm })}>
            Re-advance to the barbs and move
          </button>
          <button className="btn text-xs" onClick={() => act({ kind: "partial-recapture", pastBarbs: true })}>
            Re-advance past the resistance
          </button>
        </div>
        <button className="btn w-full text-xs" onClick={() => act({ kind: "full-recapture" })}>
          Full recapture
        </button>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-line pt-2">
      <button className="btn text-xs" onClick={() => act({ kind: "partial-recapture" })}>
        Re-sheath to the lobe marker
      </button>
      <button className="btn text-xs" onClick={() => act({ kind: "partial-recapture", anchorsIn: true })}>
        Re-sheath the whole lobe
      </button>
    </div>
  );
}

/**
 * One release criterion. After its check the learner sees the observation (measurements, tug behaviour,
 * leak size) and grades it; the verdict and its colour are a guided aid only, never in exam.
 */
export function CritRow({ letter, title, c, shown, hidden, aids }: { letter: string; title: string; c: { met: boolean; text: string }; shown: boolean; hidden: string; aids: boolean }) {
  const verdict = shown && aids;
  const toneCls = verdict ? TONE_TEXT[c.met ? PASS_TONE.pass : PASS_TONE.fail] : shown ? "text-ink-soft" : TONE_TEXT.faint;
  return (
    <div className="flex gap-2">
      <div className={`h-6 w-6 shrink-0 rounded border flex items-center justify-center font-mono text-xs ${toneCls} border-current`}>{letter}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink">{title}</span>
          <span className={`text-[12px] ${toneCls}`} data-crit-verdict={verdict ? (c.met ? "met" : "not-met") : shown ? "checked" : "unchecked"}>
            {verdict ? (c.met ? "Guided aid: met" : "Guided aid: not met") : shown ? "checked" : "not checked"}
          </span>
        </div>
        <p className="text-[12px] text-ink-soft leading-snug">{shown ? c.text : hidden}</p>
      </div>
    </div>
  );
}

function NextButtons({ onRepeat, onNext }: { onRepeat: () => void; onNext: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button className="btn" onClick={onRepeat}>
        Repeat case
      </button>
      <button className="btn btn-accent" onClick={onNext}>
        Next case
      </button>
    </div>
  );
}
