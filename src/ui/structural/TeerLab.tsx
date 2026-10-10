// Mitral TEER lab: TOE plan, transseptal puncture, steering, grasp and assessment on the teaching
// scenarios of src/simulation/teer.ts.
//
// structural-tips-and-tavi-course: the run (useLabRun: mode, help, decisions, one logbook row) and
// the structural tips for the step (src/ui/lab/structuralTips.ts: the transseptal step reports access
// with the TEER and transseptal procedures) in the tips panel; window.__lab.structural in DEV builds.
// A lesson or case opens a scenario through StructuralLab's launch.
//
// structural-transseptal-hands-on: the transseptal step is the hands-on puncture
// (TransseptalStage.tsx on src/simulation/transseptal.ts) in place of the fossa point-picker. The site
// it secures is scored by assessTransseptal and scoreTeer exactly as a picked point was. The
// transseptal presets (ts-*, src/content/lab/presets/structural/transseptal.launch.ts) are drills:
// they open at the transseptal step on their TEER patient and end in the puncture's own debrief.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TEER_SCENARIOS,
  TEER_HEIGHT_TEXT,
  GRADIENT_FLAG_MMHG,
  SMALL_MVA_CM2,
  assessTransseptal,
  baselineGradient,
  coaptationY,
  grasp,
  rotationError,
  segmentAt,
  targetArmAngle,
  teerOutcome,
  scoreTeer,
  type DevicePlacement,
  type DeviceWidth,
  type FossaPoint,
  type GraspResult,
  type PlacedDevice,
  type TeerScenario,
  type TransseptalResult,
} from "../../simulation/teer";
import {
  createTransseptal,
  scoreTransseptal,
  transseptalDecisions,
  transseptalEvents,
  transseptalPoint,
  transseptalPreset,
  transseptalStep,
  TS_PRESETS,
  type TsAction,
  type TsPreset,
  type TsState,
} from "../../simulation/transseptal";
import { PASS_SCORE } from "../../progress/logbook";
import { registerLabHook } from "../../dev/labHooks";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import { teerTipContext, type TeerStep } from "../lab/structuralTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import type { StructuralLaunch } from "../sections/StructuralLab";
import { TransseptalControls, TransseptalDebrief, TransseptalSummary, TransseptalViews } from "./TransseptalStage";
import { EnFaceView, BicommissuralView, LvotView, DopplerStrip } from "./TeerViews";
import {
  Panel,
  Seg,
  StepRail,
  Toggle,
  Slider,
  Readout,
  Teach,
  RiskList,
  ScoreBadge,
  DeductionList,
  Disclaimer,
  TONE_TEXT,
  type Tone,
} from "./common";

type Step = TeerStep;

const STEPS: { id: Step; label: string }[] = [
  { id: "plan", label: "TOE plan" },
  { id: "transseptal", label: "Transseptal" },
  { id: "steer", label: "Steer and align" },
  { id: "grasp", label: "Grasp" },
  { id: "assess", label: "Assess" },
  { id: "debrief", label: "Debrief" },
];

const START: DevicePlacement = { x: -0.15, y: 0.3, armAngleDeg: 45, width: "narrow" };

const ADEQ_TONE: Record<GraspResult["anteriorAdequacy"], Tone> = { adequate: "good", partial: "warn", poor: "danger" };

/** A fresh hands-on puncture for a TEER case (a preset's variant in a drill). */
const freshTransseptal = (drill: TsPreset | undefined): TsState => createTransseptal({ variant: drill?.variant, host: "teer" });

/** The complications of the puncture, by name, for the logbook (after the run). */
function transseptalComplications(st: TsState): string[] {
  const out: string[] = [];
  if (st.dilator === "aorta") out.push("aortic puncture with dilator");
  else if (st.needle === "aorta") out.push("aortic needle puncture");
  if (st.air === "embolised") out.push("air embolism");
  if (st.vagalT !== null) out.push("septal vagal reflex");
  if (st.posteriorExit && st.cathetersOutT !== null) out.push("posterior exit, delayed tamponade");
  if (st.bleeds.includes("la-wall")) out.push("left atrial wall injury");
  return out;
}

/** What the DEV hook reports about the puncture. */
function punctureSummary(st: TsState) {
  return { stage: st.stage, zone: st.zone, clockH: st.clockH, contact: st.contact, crossedAt: st.crossedAt, checks: st.checks, events: transseptalEvents(st), t: st.t, critical: st.critical };
}

export default function TeerLab({ launch = null, onLaunchTaken }: { launch?: StructuralLaunch | null; onLaunchTaken?: () => void } = {}) {
  // a TEER scenario id, or a transseptal preset id (a drill on that preset's TEER patient)
  const [scenarioId, setScenarioId] = useState(TEER_SCENARIOS[0].id);
  const drill = transseptalPreset(scenarioId);
  const teerId = drill ? drill.teerScenario : scenarioId;
  const s: TeerScenario = TEER_SCENARIOS.find((x) => x.id === teerId) ?? TEER_SCENARIOS[0];
  const [step, setStep] = useState<Step>("plan");
  const [width, setWidth] = useState<DeviceWidth>("narrow");
  const [fossa, setFossa] = useState<FossaPoint>({ si: 0, ap: 0 });
  const [tsState, setTsState] = useState<TsState>(() => freshTransseptal(undefined));
  const dispatchTs = useCallback((a: TsAction) => setTsState((x) => transseptalStep(x, a)), []);
  const [hints, setHints] = useState(false);
  const [ts, setTs] = useState<TransseptalResult | null>(null);
  const [current, setCurrent] = useState<DevicePlacement>({ ...START });
  const [devices, setDevices] = useState<PlacedDevice[]>([]);
  const [pending, setPending] = useState<PlacedDevice | null>(null);
  const [regrasps, setRegrasps] = useState(0);
  const [gradeBefore, setGradeBefore] = useState<number[]>([]);
  const [colour, setColour] = useState(true);
  const [guide, setGuide] = useState(false);
  const [launchMode, setLaunchMode] = useState<StructuralLaunch["mode"]>(null);
  const [runKey, setRunKey] = useState(0);
  const recorded = useRef(false);

  const run = useLabRun("teer", runCaseId("teer", drill ? drill.id : s.id), launchMode, {
    runKey,
    caseName: drill ? `Structural lab, transseptal puncture: ${drill.variant.title}` : `Structural lab, TEER: ${s.title}`,
  });
  const runRef = useRef(run);
  runRef.current = run;

  const reset = (id = scenarioId, mode?: StructuralLaunch["mode"]) => {
    if (mode !== undefined) setLaunchMode(mode);
    setRunKey((k) => k + 1);
    setScenarioId(id);
    const preset = transseptalPreset(id);
    // a drill opens at the loaded transseptal system; a TEER case at its TOE plan
    setStep(preset ? "transseptal" : "plan");
    setTsState(freshTransseptal(preset));
    setWidth("narrow");
    setFossa({ si: 0, ap: 0 });
    setTs(null);
    setCurrent({ ...START });
    setDevices([]);
    setPending(null);
    setRegrasps(0);
    setGradeBefore([]);
    setGuide(false);
    recorded.current = false;
  };
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // a launch from a lesson or case: the scenario and the mode, applied once (every TEER scenario opens at
  // its TOE plan, a transseptal preset at the transseptal step)
  useEffect(() => {
    if (!launch) return;
    resetRef.current(launch.scenario, launch.mode);
    onLaunchTaken?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a launch is applied once, by its seq
  }, [launch?.seq]);

  const liveTs = assessTransseptal("teer", fossa, s.septalHeightBaseCm, s.heightTargetCm);
  const heightCm = ts?.heightCm ?? liveTs.heightCm;
  const drillScore = useMemo(() => (drill && step === "debrief" ? scoreTransseptal(tsState, ts) : null), [drill, step, tsState, ts]);
  // a TEER case stopped at the puncture (the surgeon took over): its debrief is the puncture's, with no device
  const abandoned = !drill && tsState.stage === "abandoned";
  const abandonSite = abandoned && transseptalPoint(tsState) ? ts : null;
  const abandonScore = useMemo(() => (abandoned && step === "debrief" ? scoreTransseptal(tsState, abandonSite) : null), [abandoned, step, tsState, abandonSite]);
  // a completed TEER case: the puncture's own deductions beside the device score (the site is scored by scoreTeer)
  const punctureScore = useMemo(() => (!drill && !abandoned && step === "debrief" ? scoreTransseptal(tsState, null) : null), [drill, abandoned, step, tsState]);
  const all = useMemo(() => (pending ? [...devices, pending] : devices), [devices, pending]);
  const outcome = useMemo(() => teerOutcome(s, all), [s, all]);
  const baseline = useMemo(() => teerOutcome(s, []), [s]);
  const released = useMemo(() => teerOutcome(s, devices), [s, devices]);
  const placementWithWidth: DevicePlacement = { ...current, width };
  const err = rotationError(current.armAngleDeg, current.x);
  const dy = current.y - coaptationY(current.x);

  const score = useMemo(
    () =>
      step === "debrief" && ts && !drill && !abandoned
        ? scoreTeer(s, { transseptal: ts, devices, gradeBeforeEachExtraDevice: gradeBefore, regrasps })
        : null,
    [step, ts, s, devices, gradeBefore, regrasps, drill, abandoned]
  );
  // the puncture's decisions go into the run's ledger once the left atrium is left behind
  const recordTransseptal = (st: TsState) => {
    const r = runRef.current;
    for (const dcs of transseptalDecisions(st)) r.decide(dcs);
  };
  // a drill: logged once, when its debrief opens
  useEffect(() => {
    if (step !== "debrief" || !drill || !drillScore || recorded.current) return;
    recorded.current = true;
    const r = runRef.current;
    recordTransseptal(tsState);
    r.finish({
      score: drillScore.score,
      passed: drillScore.score >= PASS_SCORE.default && drillScore.critical.length === 0,
      criticalErrors: drillScore.critical.length,
      complications: transseptalComplications(tsState),
      metrics: { ivcDrops: tsState.ivcDrops, checks: tsState.checks.length, pericardialMl: Math.round(tsState.pericardialMl), durationS: Math.round(tsState.t) },
      durationS: Math.round(tsState.t),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, drillScore]);
  // stopped at the puncture: logged once with the puncture's score, failed, no device (its decisions were recorded by endPuncture)
  useEffect(() => {
    if (step !== "debrief" || !abandonScore || recorded.current) return;
    recorded.current = true;
    runRef.current.finish({
      score: abandonScore.score,
      passed: false,
      criticalErrors: abandonScore.critical.length + (abandonSite?.danger ? 1 : 0),
      complications: transseptalComplications(tsState),
      metrics: { ivcDrops: tsState.ivcDrops, checks: tsState.checks.length, pericardialMl: Math.round(tsState.pericardialMl), durationS: Math.round(tsState.t) },
      durationS: Math.round(tsState.t),
      devices: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, abandonScore]);
  useEffect(() => {
    if (step !== "debrief" || !score || recorded.current) return;
    recorded.current = true;
    const r = runRef.current;
    if (ts)
      r.decide({
        id: "transseptal-site",
        stage: "access",
        label: "Transseptal puncture site",
        correct: ts.quality === "ideal" && !ts.danger,
        expected: `Posterior, mid-to-superior, ${s.heightTargetCm[0]}–${s.heightTargetCm[1]} cm above the mitral annular plane`,
        given: `${ts.heightCm.toFixed(1)} cm, ${ts.quality}${ts.danger ? ", unsafe site" : ""}`,
        lessonId: "hb-mitral-tricuspid-laa-teer-procedure",
        tipIds: ["structural-teer-height-coaptation"],
      });
    r.finish({
      score: score.score,
      passed: score.score >= PASS_SCORE.default,
      // the site's danger zone, as before, and the puncture's own critical errors (a dilator without the four confirmations, into the aorta)
      criticalErrors: (ts?.danger ? 1 : 0) + tsState.critical.length,
      complications: transseptalComplications(tsState),
      metrics: { devices: devices.length, regrasps, residualMr: outcome.mrGrade, gradientMmHg: Math.round(outcome.gradientMmHg * 10) / 10 },
      devices: devices.map(() => "edge-to-edge repair device"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, score]);

  // ----- tips -----
  const tipContext = useMemo(() => teerTipContext({ step, transseptal: tsState }), [step, tsState]);
  const { tips, visible } = useContextTips(tipContext, run);
  const live = useRef({ step, s, devices: devices.length, ts, tsState, drill: drill?.id ?? null });
  live.current = { step, s, devices: devices.length, ts, tsState, drill: drill?.id ?? null };
  // DEV: window.__lab.structural
  const ctxNow = useCallback(() => teerTipContext({ step: live.current.step, transseptal: live.current.tsState }), []);
  useEffect(
    () =>
      registerLabHook("structural", {
        context: ctxNow,
        tips: () => selectTips(loadedTips(), ctxNow(), runRef.current.run).map((t) => t.id),
        state: () => ({
          procedure: "teer",
          scenario: live.current.drill ?? live.current.s.id,
          step: live.current.step,
          devices: live.current.devices,
          transseptal: live.current.ts,
          puncture: punctureSummary(live.current.tsState),
        }),
        events: () => ctxNow()?.events ?? [],
      }),
    [ctxNow]
  );
  const exam = run.mode === "exam";
  const aids = hints && !exam;

  // the left atrium is secured: the site goes to the TEER steps exactly as a picked point did
  const continueFromPuncture = () => {
    const p = transseptalPoint(tsState);
    if (!p) return;
    recordTransseptal(tsState);
    setFossa(p);
    setTs(assessTransseptal("teer", p, s.septalHeightBaseCm, s.heightTargetCm));
    setStep("steer");
  };
  // the puncture stopped the procedure (the surgeon took over), or a drill finished
  const endPuncture = () => {
    const p = transseptalPoint(tsState) ?? fossa;
    setTs(assessTransseptal("teer", p, s.septalHeightBaseCm, s.heightTargetCm));
    if (!drill) recordTransseptal(tsState);
    setStep("debrief");
  };
  useEffect(() => {
    if (drill && step === "transseptal" && (tsState.stage === "done" || tsState.stage === "abandoned")) endPuncture();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a drill ends once, when the stage does
  }, [drill, step, tsState.stage]);

  const doGrasp = () => {
    const g = grasp(s, placementWithWidth, heightCm);
    setPending({ placement: placementWithWidth, grasp: g });
    setStep("grasp");
  };
  const regrasp = () => {
    setRegrasps((r) => r + 1);
    setPending(null);
    setStep("steer");
  };
  const releaseAndFinish = () => {
    if (pending) setDevices((d) => [...d, pending]);
    setPending(null);
    setStep("debrief");
  };
  const releaseAndAdd = () => {
    if (!pending) return;
    const gradeNow = teerOutcome(s, [...devices, pending]).mrGrade;
    setDevices((d) => [...d, pending]);
    setGradeBefore((g) => [...g, gradeNow]);
    setPending(null);
    setCurrent({ ...START, x: pending.placement.x > 0 ? pending.placement.x - 0.35 : pending.placement.x + 0.35 });
    setStep("steer");
  };

  const mrTone = (g: number): Tone => (g <= 1 ? "good" : g === 2 ? "warn" : "danger");
  const gradTone = (g: number): Tone => (g > GRADIENT_FLAG_MMHG ? "danger" : g > 4 ? "warn" : "good");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-line bg-base-800 px-2 py-1 text-sm text-ink"
            value={scenarioId}
            onChange={(e) => reset(e.target.value, null)}
          >
            <optgroup label="TEER">
              {TEER_SCENARIOS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Transseptal puncture drills">
              {TS_PRESETS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.variant.title}
                </option>
              ))}
            </optgroup>
          </select>
          <button className="btn btn-ghost" onClick={() => reset()}>
            Restart case
          </button>
          <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()} />
        </div>
        <StepRail steps={STEPS} current={step} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ------------------------------ viewer ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {step === "transseptal" || ((drill || abandoned) && step === "debrief") ? (
            <Panel title="Transseptal puncture" right={!exam && step === "transseptal" ? <Toggle label="Guided aids" checked={hints} onChange={setHints} /> : undefined}>
              <TransseptalViews state={tsState} procedure="teer" baseCm={s.septalHeightBaseCm} heightTarget={s.heightTargetCm} aids={aids && step === "transseptal"} />
            </Panel>
          ) : (
            <>
              <Panel
                title={step === "plan" ? "3D TOE: mitral valve from the left atrium" : "3D TOE guidance"}
                bodyClass="p-0"
                right={
                  <div className="flex items-center gap-3">
                    <Toggle label="Colour" checked={colour} onChange={setColour} />
                    {(step === "steer" || step === "grasp") && <Toggle label="Perpendicular guide" checked={guide} onChange={setGuide} />}
                  </div>
                }
              >
                <div className="monitor rounded-b-lg overflow-hidden">
                  <EnFaceView
                    jets={step === "plan" ? s.jets : step === "grasp" ? released.remainingJets : outcome.remainingJets}
                    devices={devices.map((d) => ({ p: d.placement, width: d.placement.width }))}
                    current={
                      step === "steer"
                        ? { p: placementWithWidth, width }
                        : pending && (step === "grasp" || step === "assess")
                        ? { p: pending.placement, width: pending.placement.width }
                        : null
                    }
                    colour={colour}
                    showGuide={guide}
                    interactive={step === "steer"}
                    onMove={(x, y) => setCurrent((c) => ({ ...c, x, y }))}
                    onRotate={(d) => setCurrent((c) => ({ ...c, armAngleDeg: (c.armAngleDeg + d + 180) % 180 }))}
                  />
                </div>
              </Panel>
              {(step === "steer" || step === "grasp" || step === "assess") && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <BicommissuralView p={step === "steer" ? placementWithWidth : pending?.placement ?? null} inLv={step !== "steer"} />
                  <LvotView
                    p={step === "steer" ? placementWithWidth : pending?.placement ?? null}
                    grasp={step === "steer" ? null : pending?.grasp ?? null}
                    inLv={step !== "steer"}
                    large={step === "grasp"}
                  />
                </div>
              )}
            </>
          )}

          {step === "debrief" && !drill && !abandoned && (
            <Panel title="Debrief: risks and their reasons">
              <RiskList
                initiallyOpen
                risks={[
                  { key: "slda", label: outcome.slda.label, level: outcome.slda.level, reasons: outcome.slda.reasons },
                  { key: "stenosis", label: outcome.stenosis.label, level: outcome.stenosis.level, reasons: outcome.stenosis.reasons },
                ]}
              />
              <div className="mt-3">
                <Teach title="Iatrogenic ASD">{outcome.iasdNote}</Teach>
              </div>
            </Panel>
          )}
        </div>

        {/* ------------------------------ controls ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {step === "plan" && (
            <>
              <Panel title="Patient">
                <p className="text-xs text-ink-soft leading-relaxed">{s.vignette}</p>
                <p className="text-xs text-ink mt-2">{s.mechanism}</p>
                <p className="text-[12px] text-accent mt-2">{s.focus}</p>
              </Panel>
              <Panel title="Baseline TOE">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="MR" value={`${s.baselineMr}+`} tone="danger" small />
                  <Readout label="MVA" value={s.mvaCm2.toFixed(1)} unit="cm²" tone={s.mvaCm2 < SMALL_MVA_CM2 ? "warn" : undefined} small />
                  <Readout label="Mean grad." value={baselineGradient(s).toFixed(1)} unit="mmHg" small />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Readout label="LVEF" value={`${s.lvefPct}`} unit="%" small />
                  {s.flailGapMm !== undefined && <Readout label="Flail gap" value={`${s.flailGapMm}`} unit="mm" small />}
                  {s.flailWidthMm !== undefined && <Readout label="Flail width" value={`${s.flailWidthMm}`} unit="mm" small />}
                  {s.coaptationDepthMm !== undefined && <Readout label="Coapt. depth" value={`${s.coaptationDepthMm}`} unit="mm" small />}
                </div>
                <ul className="mt-3 space-y-0.5 text-[12px] text-ink-soft">
                  {s.jets.map((j, i) => (
                    <li key={i}>
                      • {j.label} <span className="text-ink-faint">({segmentAt(j.x)})</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Device">
                <div className="space-y-3">
                  <Seg
                    options={[
                      { id: "narrow", label: "Narrow arms" },
                      { id: "wide", label: "Wide arms" },
                    ]}
                    value={width}
                    onChange={setWidth}
                  />
                  <Teach>
                    A wider device covers more of a broad jet but leaves a smaller orifice. In a small valve, every
                    millimetre of device costs area. Baseline MVA below {SMALL_MVA_CM2.toFixed(1)} cm² is outside the
                    anatomical criterion in the device IFU.
                  </Teach>
                  <button className="btn btn-accent w-full" onClick={() => setStep("transseptal")}>
                    Plan the transseptal puncture
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
                procedure="teer"
                baseCm={s.septalHeightBaseCm}
                heightTarget={s.heightTargetCm}
                aids={aids}
                exam={exam}
                drill={!!drill}
                onContinue={continueFromPuncture}
                continueLabel="Continue: steer the guide to the valve"
                onAbandon={endPuncture}
              />
              {aids && <Teach>{TEER_HEIGHT_TEXT}</Teach>}
            </>
          )}

          {step === "debrief" && drill && drillScore && (
            <>
              <TransseptalDebrief state={tsState} score={drillScore} />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => reset()}>
                  Repeat the drill
                </button>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    const i = TS_PRESETS.findIndex((x) => x.id === scenarioId);
                    reset(TS_PRESETS[(i + 1) % TS_PRESETS.length].id);
                  }}
                >
                  Next drill
                </button>
              </div>
            </>
          )}

          {step === "steer" && (
            <Panel title={devices.length > 0 ? `Device ${devices.length + 1}: steer and align` : "Steer and align"}>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Segment" value={segmentAt(current.x)} small />
                  <Readout label="Rotation error" value={err.toFixed(0)} unit="°" tone={err <= 10 ? "good" : err <= 20 ? "warn" : "danger"} small />
                  <Readout
                    label="A–P offset"
                    value={Math.abs(dy) < 0.05 ? "centred" : dy > 0 ? "anterior" : "posterior"}
                    tone={Math.abs(dy) < 0.05 ? "good" : Math.abs(dy) < 0.12 ? "warn" : "danger"}
                    small
                  />
                </div>
                <Slider
                  label="Arm rotation"
                  value={current.armAngleDeg}
                  min={0}
                  max={179}
                  step={1}
                  unit="°"
                  onChange={(v) => setCurrent((c) => ({ ...c, armAngleDeg: v }))}
                />
                <Teach>
                  Drag the device over the jet origin and centre it on the coaptation line. Rotate the arms until they
                  are perpendicular to the line: end-on in the intercommissural view, fully open in the LVOT view.
                  {current.x > 0.55 || current.x < -0.55
                    ? ` Near the commissure the line curves: perpendicular here is about ${targetArmAngle(current.x).toFixed(0)}°, not 90°.`
                    : ""}
                </Teach>
                <button className="btn btn-accent w-full" onClick={doGrasp}>
                  Advance into the LV and grasp
                </button>
              </div>
            </Panel>
          )}

          {step === "grasp" && pending && (
            <Panel title="Check the grasp">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Readout
                    label="Anterior insertion"
                    value={`${Math.round(pending.grasp.anterior * 100)}% of arm`}
                    tone={ADEQ_TONE[pending.grasp.anteriorAdequacy]}
                    small
                  />
                  <Readout
                    label="Posterior insertion"
                    value={`${Math.round(pending.grasp.posterior * 100)}% of arm`}
                    tone={ADEQ_TONE[pending.grasp.posteriorAdequacy]}
                    small
                  />
                </div>
                {pending.grasp.notes.length > 0 && (
                  <ul className="space-y-0.5">
                    {pending.grasp.notes.map((n, i) => (
                      <li key={i} className="text-[12px] text-warn">
                        • {n}
                      </li>
                    ))}
                  </ul>
                )}
                <Teach>
                  Confirm both leaflets sit deep in the arms in the LVOT view before closing. Inadequate insertion of
                  one leaflet is the setting for single-leaflet device attachment.
                </Teach>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn" onClick={regrasp}>
                    Open and re-grasp
                  </button>
                  <button className="btn btn-accent" onClick={() => setStep("assess")}>
                    Close and assess
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === "assess" && pending && (
            <Panel title="Assess before release">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Residual MR" value={`${outcome.mrGrade}+`} tone={mrTone(outcome.mrGrade)} small />
                  <Readout label="MVA" value={outcome.mvaCm2.toFixed(1)} unit="cm²" small />
                  <Readout label="Mean grad." value={outcome.gradientMmHg.toFixed(1)} unit="mmHg" tone={gradTone(outcome.gradientMmHg)} small />
                </div>
                <div className="monitor rounded-md overflow-hidden">
                  <DopplerStrip gradient={outcome.gradientMmHg} flag={outcome.gradientFlag} />
                </div>
                <div className="text-[12px] text-ink-faint">
                  Baseline {baseline.mrGrade}+ MR, {baselineGradient(s).toFixed(1)} mmHg. Gradient flag above{" "}
                  {GRADIENT_FLAG_MMHG} mmHg is a cohort-derived threshold of concern, not a guideline value.
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Single-leaflet attachment risk</span>
                  <span className={TONE_TEXT[outcome.slda.level === "high" ? "danger" : outcome.slda.level === "moderate" ? "warn" : "good"]}>
                    {outcome.slda.level}
                  </span>
                </div>
                <Teach>
                  Release when MR is reduced with an acceptable gradient. Add a device only for a significant residual
                  jet and only if the gradient allows it.
                </Teach>
                <div className="grid grid-cols-1 gap-2">
                  <button className="btn btn-accent" onClick={releaseAndFinish}>
                    Release and finish
                  </button>
                  <button className="btn" onClick={releaseAndAdd} disabled={devices.length >= 2}>
                    Release and add another device
                  </button>
                  <button className="btn" onClick={regrasp}>
                    Open and re-grasp
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === "debrief" && abandoned && abandonScore && (
            <>
              <Panel title="Procedure stopped at the puncture">
                <p className="text-xs text-ink-soft">The surgical team took over; no device was implanted and the mitral valve was not treated.</p>
              </Panel>
              <TransseptalDebrief state={tsState} score={abandonScore} />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => reset()}>
                  Repeat case
                </button>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    const i = TEER_SCENARIOS.findIndex((x) => x.id === scenarioId);
                    reset(TEER_SCENARIOS[(i + 1) % TEER_SCENARIOS.length].id);
                  }}
                >
                  Next case
                </button>
              </div>
            </>
          )}

          {step === "debrief" && score && (
            <>
              <Panel title="Score">
                <div className="space-y-3">
                  <ScoreBadge score={score.score} />
                  <DeductionList items={score.deductions} />
                </div>
              </Panel>
              {punctureScore && <TransseptalSummary score={punctureScore} />}
              <Panel title="Result">
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Residual MR" value={`${outcome.mrGrade}+`} tone={mrTone(outcome.mrGrade)} small />
                  <Readout label="Mean grad." value={outcome.gradientMmHg.toFixed(1)} unit="mmHg" tone={gradTone(outcome.gradientMmHg)} small />
                  <Readout label="Devices" value={`${devices.length}`} small />
                </div>
                {ts && (
                  <p className="text-[12px] text-ink-faint mt-2">
                    Transseptal height {ts.heightCm.toFixed(1)} cm ({ts.quality}). Re-grasps: {regrasps}.
                  </p>
                )}
              </Panel>
              <Panel title="Teaching points">
                <ul className="space-y-1 text-xs text-ink-soft">
                  {s.teachingPoints.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </Panel>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => reset()}>
                  Repeat case
                </button>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    const i = TEER_SCENARIOS.findIndex((x) => x.id === scenarioId);
                    reset(TEER_SCENARIOS[(i + 1) % TEER_SCENARIOS.length].id);
                  }}
                >
                  Next case
                </button>
              </div>
            </>
          )}

          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={tipContext?.events ?? []} />

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
