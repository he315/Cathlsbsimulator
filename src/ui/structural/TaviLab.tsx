// TAVI lab: CT plan, access, positioning, deployment and assessment of a valve on the teaching
// scenarios of src/simulation/tavi.ts.
//
// structural-tips-and-tavi-course: the run (useLabRun: mode, help, decisions, one logbook row), the
// structural tips for the step and the post-deployment course (src/ui/lab/structuralTips.ts) in the
// tips panel, and at the assess step the course itself: a monitor (ECG and arterial line), a root
// injection that shows whether each coronary fills, and the calls the operator can make (rescue PCI
// and the surgeon, pacing through the temporary wire). A post-dilatation at that step enters the
// course from its moment, so a raised rupture risk shows as a falling pressure. The course runs on
// its own clock from the moment the valve is released; window.__lab.structural.step(seconds)
// advances it by hand in DEV builds. A lesson or case opens a scenario through StructuralLab's launch.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TAVI_SCENARIOS,
  CHART_LABEL,
  CHART_RULE,
  COURSE_RESPONSE,
  PLATFORM_LABEL,
  RISK_ORDER,
  VALVE_SIZES,
  DEPTH_TARGET,
  areaDerivedDiameter,
  perimeterDerivedDiameter,
  eccentricityIndex,
  annulusMetric,
  teachingChart,
  oversizingPct,
  deliverySystemFor,
  accessMarginMm,
  assessTavi,
  taviFindings,
  pvlGrade,
  bestTaviPlan,
  scoreTavi,
  scoreTaviCourse,
  effectiveDepth,
  depthBand,
  taviCourse,
  courseAt,
  courseRng,
  type CourseActions,
  type TaviPlan,
  type TaviScenario,
  type ValvePlatform,
  type RiskLevel,
} from "../../simulation/tavi";
import { PASS_SCORE } from "../../progress/logbook";
import { registerLabHook } from "../../dev/labHooks";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import { taviTipContext, type TaviStep } from "../lab/structuralTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import type { StructuralLaunch } from "../sections/StructuralLab";
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
  LevelChip,
  TONE_TEXT,
  animate,
  clamp,
  type Tone,
} from "./common";
import { CtAnnulusView, CtRootView, CtSeptumView, AccessView, FluoroDeployView, CourseMonitor, RootInjectionView, frameHeightMm, type RootInjection } from "./TaviViews";

type Step = TaviStep;

const STEPS: { id: Step; label: string }[] = [
  { id: "plan", label: "CT plan" },
  { id: "access", label: "Access" },
  { id: "position", label: "Position" },
  { id: "deploy", label: "Deploy" },
  { id: "assess", label: "Assess" },
  { id: "debrief", label: "Debrief" },
];

const START_DEPTH = -5;

function freshPlan(): TaviPlan {
  return {
    access: "transfemoral",
    platform: "balloon-expandable",
    sizeMm: VALVE_SIZES["balloon-expandable"][1],
    targetDepthMm: 3,
    finalDepthMm: START_DEPTH,
    predilatation: false,
    postDilatation: false,
    rapidPacing: false,
    coronaryProtection: false,
  };
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;
const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** How often the course clock refreshes the read-outs and the tip context, ms. */
const COURSE_TICK_MS = 250;

export default function TaviLab({ launch = null, onLaunchTaken }: { launch?: StructuralLaunch | null; onLaunchTaken?: () => void } = {}) {
  const [scenarioId, setScenarioId] = useState(TAVI_SCENARIOS[0].id);
  const s = TAVI_SCENARIOS.find((x) => x.id === scenarioId) ?? TAVI_SCENARIOS[0];
  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<TaviPlan>(() => freshPlan());
  const [ctView, setCtView] = useState<"annulus" | "root" | "septum">("annulus");
  const [trace, setTrace] = useState(true);
  const [calipers, setCalipers] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [predilDone, setPredilDone] = useState(false);
  const [balloon, setBalloon] = useState(0);
  const [balloonD, setBalloonD] = useState<number | undefined>(undefined);
  const [expansion, setExpansion] = useState(0);
  const [release, setRelease] = useState(0);
  const [recaptures, setRecaptures] = useState(0);
  const [jump, setJump] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pvlBefore, setPvlBefore] = useState<RiskLevel | null>(null);
  const [postDone, setPostDone] = useState(false);
  // the post-deployment course: the plan as released, what the operator did, the clock
  const [deployedPlan, setDeployedPlan] = useState<TaviPlan | null>(null);
  const [planByLearner, setPlanByLearner] = useState(true);
  const [actions, setActions] = useState<CourseActions>({});
  const [injection, setInjection] = useState<RootInjection | null>(null);
  const [courseT, setCourseT] = useState(0);
  const [endS, setEndS] = useState<number | null>(null);
  const [launchMode, setLaunchMode] = useState<StructuralLaunch["mode"]>(null);
  const [runKey, setRunKey] = useState(0);
  const clock = useRef<{ t: number; wall: number | null }>({ t: 0, wall: null });
  const cancel = useRef<(() => void) | null>(null);
  const recorded = useRef(false);

  useEffect(() => () => cancel.current?.(), []);

  const run = useLabRun("tavi", runCaseId("tavi", s.id), launchMode, { runKey, caseName: `Structural lab, TAVI: ${s.title}` });
  const runRef = useRef(run);
  runRef.current = run;

  /** Open a scenario: at the plan step, or at the assess step when it comes with its valve deployed. */
  const reset = useCallback((id: string, opts: { start?: string | null; mode?: StructuralLaunch["mode"] } = {}) => {
    cancel.current?.();
    const sc = TAVI_SCENARIOS.find((x) => x.id === id) ?? TAVI_SCENARIOS[0];
    const deployed = sc.deployed && opts.start !== "plan" ? sc.deployed : null;
    setScenarioId(sc.id);
    setCtView("annulus");
    setPredilDone(false);
    setBalloon(0);
    setBalloonD(undefined);
    setRelease(0);
    setRecaptures(0);
    setJump(0);
    setBusy(false);
    setPostDone(false);
    setActions({});
    setInjection(null);
    setEndS(null);
    clock.current = { t: 0, wall: null };
    setCourseT(0);
    recorded.current = false;
    if (deployed) {
      setPlan({ ...deployed });
      setDeployedPlan({ ...deployed });
      setPlanByLearner(false);
      setPvlBefore(assessTavi(sc, deployed).risks.pvl.level);
      setExpansion(1);
      setStep("assess");
    } else {
      setPlan(freshPlan());
      setDeployedPlan(null);
      setPlanByLearner(true);
      setPvlBefore(null);
      setExpansion(0);
      setStep("plan");
    }
    if (opts.mode !== undefined) setLaunchMode(opts.mode);
    setRunKey((k) => k + 1);
  }, []);

  // a launch from a lesson or case: the scenario, its start and the mode, applied once
  useEffect(() => {
    if (!launch) return;
    reset(launch.scenario, { start: launch.start, mode: launch.mode });
    onLaunchTaken?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a launch is applied once, by its seq
  }, [launch?.seq]);

  const up = (p: Partial<TaviPlan>) => setPlan((x) => ({ ...x, ...p }));
  const outcome = useMemo(() => assessTavi(s, plan), [s, plan]);
  const be = plan.platform === "balloon-expandable";
  const system = deliverySystemFor(plan.platform, plan.sizeMm);
  const margin = accessMarginMm(s.access.mldMm, system.minVesselMm);

  // ----- the post-deployment course -----
  const course = useMemo(() => (deployedPlan ? taviCourse(s, deployedPlan, assessTavi(s, deployedPlan), courseRng(s.id), actions) : null), [s, deployedPlan, actions]);
  const courseRunning = step === "assess" && !!course;
  const courseNow = useCallback(() => clock.current.t + (clock.current.wall !== null ? (performance.now() - clock.current.wall) / 1000 : 0), []);
  useEffect(() => {
    if (!courseRunning) {
      clock.current = { t: courseNow(), wall: null };
      return;
    }
    clock.current = { t: clock.current.t, wall: performance.now() };
    const id = window.setInterval(() => {
      const t = courseNow();
      clock.current = { t, wall: performance.now() };
      setCourseT(t);
    }, COURSE_TICK_MS);
    return () => {
      window.clearInterval(id);
      clock.current = { t: courseNow(), wall: null };
    };
  }, [courseRunning, courseNow]);
  const sample = course ? courseAt(course, courseT) : null;
  const sampleAt = useCallback((t: number) => courseAt(course!, t), [course]);

  const injectRoot = () => {
    if (!course) return;
    const t = courseNow();
    const smp = courseAt(course, t);
    setInjection({ t, leftFills: smp.leftFills, rightFills: smp.rightFills });
    setActions((a) => (a.rootInjectionS != null ? a : { ...a, rootInjectionS: t }));
  };
  const callRescue = () => setActions((a) => (a.rescueS != null ? a : { ...a, rescueS: courseNow() }));
  const paceWire = () => setActions((a) => (a.pacingS != null ? a : { ...a, pacingS: courseNow() }));

  // ----- scoring and the logbook row -----
  const response = useMemo(() => (course && endS !== null ? { course, actions, endS, planByLearner } : undefined), [course, actions, endS, planByLearner]);
  const score = useMemo(() => (step === "debrief" ? scoreTavi(s, plan, pvlBefore ?? undefined, response) : null), [step, s, plan, pvlBefore, response]);
  const courseScore = useMemo(() => (response ? scoreTaviCourse(response.course, response.actions, response.endS) : null), [response]);
  const best = useMemo(() => (step === "debrief" ? bestTaviPlan(s) : null), [step, s]);

  useEffect(() => {
    if (step !== "debrief" || !score || recorded.current) return;
    recorded.current = true;
    const r = runRef.current;
    if (response && course) {
      const c = course;
      const inj = actions.rootInjectionS ?? null;
      const resc = actions.rescueS ?? null;
      if (c.obstruction) {
        const late = inj === null ? null : inj - c.pacingEndS;
        r.decide({
          id: "root-injection",
          stage: "assess",
          label: "Root injection for hypotension after pacing",
          correct: late !== null && late <= COURSE_RESPONSE.injectWithinS,
          expected: `Within ${COURSE_RESPONSE.injectWithinS} s of pacing stopping`,
          given: late === null ? "Not done" : `${Math.round(late)} s`,
          lessonId: "hb-tavi-coronary",
          tipIds: ["structural-tavi-hypotension-coronary"],
        });
        r.decide({
          id: "coronary-rescue",
          stage: "assess",
          label: "Rescue PCI and the surgeon called",
          correct: resc !== null && resc - (inj ?? c.pacingEndS) <= COURSE_RESPONSE.rescueWithinS,
          expected: "Called at once once the coronary did not fill",
          given: resc === null ? "Not called" : `${Math.round(resc - (inj ?? c.pacingEndS))} s after the ${inj !== null ? "injection" : "pressure fell"}`,
          lessonId: "hb-tavi-coronary",
          tipIds: ["structural-tavi-hypotension-coronary"],
        });
      }
      // the block is a decision only once it has appeared on the monitor (as in scoreTaviCourse)
      if (c.chbS !== null && endS !== null && endS >= c.chbS) {
        const p = actions.pacingS != null && actions.pacingS <= endS ? actions.pacingS : null;
        r.decide({
          id: "chb-pacing",
          stage: "assess",
          label: "Pacing for complete heart block",
          correct: p !== null && p - c.chbS <= COURSE_RESPONSE.paceWithinS,
          expected: "Pace through the temporary wire",
          given: p === null ? "Not paced" : `Paced ${Math.max(0, Math.round(p - c.chbS))} s after the block`,
          lessonId: "hb-tavi-procedure",
          tipIds: ["structural-tavi-pacing-wire-decision"],
        });
      }
    }
    if (pvlBefore) {
      const expected = pvlBefore === "high" ? "Post-dilate" : pvlBefore === "low" ? "Accept without post-dilatation" : "Either, weighing leak against rupture risk";
      r.decide({
        id: "post-dilatation",
        stage: "assess",
        label: "Post-dilatation decision",
        correct: pvlBefore === "moderate" || (pvlBefore === "high") === plan.postDilatation,
        expected,
        given: plan.postDilatation ? "Post-dilated" : "Accepted",
        lessonId: "hb-tavi-vascular-stroke",
        tipIds: ["structural-tavi-pvr-mechanism"],
      });
    }
    const missedRescue = !!course?.obstruction && (actions.rescueS == null || (endS !== null && actions.rescueS > endS));
    r.finish({
      score: score.score,
      passed: score.score >= PASS_SCORE.default && !missedRescue,
      criticalErrors: missedRescue ? 1 : 0,
      complications: course?.obstruction ? ["coronary obstruction"] : [],
      metrics: {
        ...(courseScore?.ischaemicS != null ? { ischaemicS: Math.round(courseScore.ischaemicS) } : {}),
        ...(actions.rootInjectionS != null && course ? { rootInjectionS: Math.round(actions.rootInjectionS - course.pacingEndS) } : {}),
        oversizingPct: Math.round(outcome.oversizingPct),
        depthMm: Math.round(outcome.depthMm * 10) / 10,
      },
      devices: [`${plan.sizeMm} mm ${plan.platform} valve`],
      ...(plan.access === "transfemoral" ? { access: "femoral" as const } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the run is logged once, when the debrief opens
  }, [step, score]);

  // ----- tips -----
  const courseSecond = Math.floor(courseT);
  const tipContext = useMemo(() => taviTipContext({ step, course, courseT: courseSecond }), [step, course, courseSecond]);
  const { tips, visible } = useContextTips(tipContext, run);

  // DEV: window.__lab.structural
  const live = useRef({ step, s, plan, course, actions, injection, deployedPlan });
  live.current = { step, s, plan, course, actions, injection, deployedPlan };
  useEffect(
    () =>
      registerLabHook("structural", {
        context: () => taviTipContext({ step: live.current.step, course: live.current.course, courseT: courseNow() }),
        tips: () => selectTips(loadedTips(), taviTipContext({ step: live.current.step, course: live.current.course, courseT: courseNow() }), runRef.current.run).map((t) => t.id),
        state: () => {
          const c = live.current.course;
          const t = courseNow();
          return {
            procedure: "tavi",
            scenario: live.current.s.id,
            step: live.current.step,
            plan: live.current.plan,
            course: c ? { t, sample: courseAt(c, t), pacingEndS: c.pacingEndS, actions: live.current.actions, injection: live.current.injection } : null,
          };
        },
        events: () => taviTipContext({ step: live.current.step, course: live.current.course, courseT: courseNow() })?.events ?? [],
        step: (seconds: number) => {
          clock.current = { t: courseNow() + Math.max(0, seconds), wall: clock.current.wall !== null ? performance.now() : null };
          setCourseT(clock.current.t);
        },
      }),
    [courseNow]
  );

  // ----- actions -----
  const runPredil = () => {
    setBusy(true);
    setBalloonD(Math.max(18, Math.round(areaDerivedDiameter(s.annulus.areaMm2)) - 3));
    cancel.current = animate(
      700,
      (t) => setBalloon(t),
      () =>
        (cancel.current = animate(
          600,
          (t) => setBalloon(1 - t),
          () => {
            setBalloon(0);
            setBalloonD(undefined);
            setPredilDone(true);
            setBusy(false);
          }
        ))
    );
  };

  const inflateBE = () => {
    setBusy(true);
    const unpaced = !plan.rapidPacing;
    cancel.current = animate(
      1300,
      (t) => {
        setBalloon(t);
        setExpansion(t);
        if (unpaced) setJump(t);
      },
      () =>
        (cancel.current = animate(
          500,
          (t) => setBalloon(1 - t),
          () => {
            setBalloon(0);
            setBusy(false);
            finishDeployment();
          }
        ))
    );
  };

  const finishDeployment = () => {
    setPvlBefore(assessTavi(s, plan).risks.pvl.level);
    setDeployedPlan({ ...plan });
    setActions({});
    setInjection(null);
    clock.current = { t: 0, wall: null };
    setCourseT(0);
    setStep("assess");
  };

  const setSeRelease = (v: number) => {
    setRelease(v);
    setExpansion(v / 100);
  };

  const recapture = () => {
    setRecaptures((r) => r + 1);
    setSeRelease(0);
  };

  const postDilate = () => {
    setBusy(true);
    setBalloonD(plan.sizeMm);
    cancel.current = animate(
      800,
      (t) => setBalloon(t),
      () =>
        (cancel.current = animate(
          500,
          (t) => setBalloon(1 - t),
          () => {
            setBalloon(0);
            setBalloonD(undefined);
            up({ postDilatation: true });
            // the course follows the post-dilated valve from now (a raised rupture risk starts its course)
            setActions((a) => (a.postDilatationS != null ? a : { ...a, postDilatationS: courseNow() }));
            setPostDone(true);
            setBusy(false);
          }
        ))
    );
  };

  const finishAssess = () => {
    setEndS(courseNow());
    setStep("debrief");
  };

  // ----- derived for the fluoroscopy view -----
  const deployedDepth = step === "assess" || step === "debrief" ? effectiveDepth(plan) : plan.finalDepthMm - 3 * jump;
  // findings of the root aortogram and echo, shown once the root has been injected; the coronaries
  // are read from the injection itself and the rhythm from the monitor, so neither is listed here
  const findings = taviFindings(s, outcome).filter((f) => f.key !== "coronary" && !(f.key === "conduction" && course?.chbS != null));
  const blocked = injection ? (!injection.leftFills ? "left" : !injection.rightFills ? "right" : null) : null;
  const lockDepth = step === "deploy" && (be ? busy || expansion > 0 : release >= 35);
  const exam = run.mode === "exam";
  // while the monitor shows a course event (low pressure, ST shift, slow rhythm or block, all on screen)
  // the valve findings are drawn in neutral tone, so a good-tone paravalvular line does not read as a
  // verdict on the patient; the events come from the tip context, so nothing hidden sets the tone
  const neutralFindings = (tipContext?.events?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-line bg-base-800 px-2 py-1 text-sm text-ink"
            value={scenarioId}
            onChange={(e) => reset(e.target.value, { mode: null })}
          >
            {TAVI_SCENARIOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={() => reset(scenarioId)}>
            Restart case
          </button>
          <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()} />
        </div>
        <StepRail steps={STEPS} current={step} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ------------------------------ viewer ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {(step === "plan" || step === "access") && (
            <Panel
              title={step === "plan" ? "Planning CT" : "Access CT"}
              bodyClass="p-0"
              right={
                step === "plan" ? (
                  <Seg
                    options={[
                      { id: "annulus", label: "Annulus" },
                      { id: "root", label: "Root and coronaries" },
                      { id: "septum", label: "Membranous septum" },
                    ]}
                    value={ctView}
                    onChange={setCtView}
                  />
                ) : undefined
              }
            >
              <div className="monitor rounded-b-lg overflow-hidden">
                {step === "access" ? (
                  <AccessView s={s} minVesselMm={system.minVesselMm} />
                ) : ctView === "annulus" ? (
                  <CtAnnulusView s={s} showTrace={trace} showCalipers={calipers} />
                ) : ctView === "root" ? (
                  <CtRootView s={s} />
                ) : (
                  <CtSeptumView s={s} depthMm={plan.targetDepthMm} platform={plan.platform} />
                )}
              </div>
              {step === "plan" && ctView === "annulus" && (
                <div className="flex gap-4 px-3 py-2 border-t border-line">
                  <Toggle label="Area and perimeter trace" checked={trace} onChange={setTrace} />
                  <Toggle label="Min and max diameters" checked={calipers} onChange={setCalipers} />
                </div>
              )}
            </Panel>
          )}

          {step === "assess" && course && sample && (
            <Panel title="Monitor" right={<span className="font-mono text-[12px] text-ink-faint">{mmss(courseT)} after release</span>}>
              <div className="monitor rounded-md overflow-hidden p-2">
                <CourseMonitor course={course} sampleAt={sampleAt} clock={courseNow} now={sample} />
              </div>
              <p className="text-[12px] text-ink-faint mt-1.5">A labelled teaching model of the minutes after release, not a haemodynamic simulation.</p>
            </Panel>
          )}

          {(step === "position" || step === "deploy" || step === "assess" || step === "debrief") && (
            <Panel
              title="Fluoroscopy"
              bodyClass="p-0"
              right={!exam ? <Toggle label="CT overlay" checked={overlay} onChange={setOverlay} /> : undefined}
            >
              <div className="monitor rounded-b-lg overflow-hidden">
                <FluoroDeployView
                  s={s}
                  st={{
                    platform: plan.platform,
                    sizeMm: plan.sizeMm,
                    depthMm: deployedDepth,
                    expansion: step === "assess" || step === "debrief" ? 1 : expansion,
                    balloon,
                    balloonDiameterMm: balloonD,
                    pacing: (step === "assess" && sample?.rhythm === "rapid-pacing") || (plan.rapidPacing && (busy || step === "deploy")),
                    showOverlay: overlay && !exam,
                    contrast: injection && step === "assess" ? { pvl: pvlGrade(outcome.risks.pvl.level), blockedCoronary: blocked } : null,
                    draggable: (step === "position" || step === "deploy") && !lockDepth && !busy,
                    hideValve: step === "position" && plan.predilatation && !predilDone,
                  }}
                  onDepth={(d) => up({ finalDepthMm: d })}
                />
              </div>
            </Panel>
          )}

          {step === "debrief" && score && best && (
            <Panel title="Debrief: risks and their reasons">
              <RiskList
                initiallyOpen
                risks={RISK_ORDER.map((k) => ({
                  key: k,
                  label: outcome.risks[k].label,
                  level: outcome.risks[k].level,
                  reasons: outcome.risks[k].reasons,
                }))}
              />
            </Panel>
          )}
        </div>

        {/* ------------------------------ controls ------------------------------ */}
        <div className="space-y-3 min-w-0">
          {step === "plan" && <PlanControls s={s} plan={plan} up={up} next={() => setStep("access")} />}

          {step === "access" && (
            <Panel title="Access route">
              <div className="space-y-3">
                <p className="text-xs text-ink-soft">
                  {plan.sizeMm} mm {plan.platform}: <span className="text-ink">{system.label}</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Min vessel" value={system.minVesselMm.toFixed(1)} unit="mm" small />
                  <Readout label="MLD" value={s.access.mldMm.toFixed(1)} unit="mm" small />
                  <Readout
                    label="Margin"
                    value={`${margin >= 0 ? "+" : ""}${margin.toFixed(1)}`}
                    unit="mm"
                    tone={margin < 0 ? "danger" : margin < 0.5 ? "warn" : "good"}
                    small
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Readout label="Calcium" value={s.access.calcification} small />
                  <Readout label="Tortuosity" value={s.access.tortuosity} small />
                </div>
                <Seg
                  options={[
                    { id: "transfemoral", label: "Transfemoral" },
                    { id: "alternative", label: "Alternative access" },
                  ]}
                  value={plan.access}
                  onChange={(v) => up({ access: v })}
                />
                <Teach>
                  Compare the minimal luminal diameter along the whole iliofemoral course with the minimum vessel
                  diameter for the delivery system. Circumferential calcium cannot stretch, so it tolerates less
                  mismatch. The minimum diameters here are illustrative; check the IFU of the actual system.
                </Teach>
                <div className="flex justify-between">
                  <button className="btn" onClick={() => setStep("plan")}>
                    Back
                  </button>
                  <button className="btn btn-accent" onClick={() => setStep("position")}>
                    Cross the valve
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === "position" && (
            <Panel title="Position in the coplanar view">
              <div className="space-y-3">
                {plan.predilatation && !predilDone ? (
                  <>
                    <Teach title="Balloon valvuloplasty">
                      Predilate under rapid pacing before the valve crosses. In a low-coronary root, a simultaneous root
                      injection shows where the leaflet goes.
                    </Teach>
                    <button className="btn btn-accent w-full" disabled={busy} onClick={runPredil}>
                      Inflate valvuloplasty balloon (rapid pacing)
                    </button>
                  </>
                ) : (
                  <>
                    <DepthReadouts plan={plan} depth={plan.finalDepthMm} />
                    <Slider
                      label="Implant depth (inflow below annulus)"
                      value={plan.finalDepthMm}
                      min={-6}
                      max={12}
                      step={0.5}
                      unit="mm"
                      onChange={(v) => up({ finalDepthMm: v })}
                    />
                    <Toggle
                      label="Rapid ventricular pacing during deployment"
                      checked={plan.rapidPacing}
                      onChange={(v) => up({ rapidPacing: v })}
                      hint={
                        be
                          ? "Required for balloon expansion: it drops the stroke volume so the valve is not ejected."
                          : "Optional for a self-expanding valve; often used at a moderate rate for stability during release."
                      }
                    />
                    <Teach>
                      Pigtail in the non-coronary cusp marks the annular plane. Planned depth{" "}
                      <span className="font-mono text-ink">{plan.targetDepthMm.toFixed(1)} mm</span>; teaching band{" "}
                      {DEPTH_TARGET[plan.platform].ideal[0]}–{DEPTH_TARGET[plan.platform].ideal[1]} mm.
                    </Teach>
                    <button className="btn btn-accent w-full" onClick={() => setStep("deploy")}>
                      Ready to deploy
                    </button>
                  </>
                )}
              </div>
            </Panel>
          )}

          {step === "deploy" && (
            <Panel title={be ? "Balloon deployment" : "Controlled release"}>
              <div className="space-y-3">
                <DepthReadouts plan={plan} depth={deployedDepth} />
                {be ? (
                  <>
                    <Teach tone={plan.rapidPacing ? "good" : "danger"}>
                      {plan.rapidPacing
                        ? "Pacing on: pulse pressure falls, then inflate slowly and hold."
                        : "Pacing is off. Inflating against a full stroke volume can eject the valve aortic."}
                    </Teach>
                    <button className="btn btn-accent w-full" disabled={busy || expansion > 0} onClick={inflateBE}>
                      Inflate balloon
                    </button>
                    <button className="btn w-full" disabled={busy || expansion > 0} onClick={() => setStep("position")}>
                      Back to positioning
                    </button>
                  </>
                ) : (
                  <>
                    <Slider
                      label="Release"
                      value={release}
                      min={0}
                      max={100}
                      step={1}
                      unit="%"
                      onChange={(v) => setSeRelease(Math.max(v, release))}
                    />
                    {release < 35 && (
                      <Slider
                        label="Depth while the inflow is still mobile"
                        value={plan.finalDepthMm}
                        min={-6}
                        max={12}
                        step={0.5}
                        unit="mm"
                        onChange={(v) => up({ finalDepthMm: v })}
                      />
                    )}
                    <Teach tone={release >= 80 ? "warn" : "accent"}>
                      {release < 35
                        ? "The inflow is opening. Depth can still be adjusted."
                        : release < 80
                        ? "The frame has engaged the annulus. Check depth; recapture if it is wrong."
                        : "Past the point of recapture in this teaching model. Complete the release."}
                    </Teach>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn" disabled={release < 35 || release >= 80} onClick={recapture}>
                        Recapture
                      </button>
                      <button className="btn btn-accent" disabled={release < 100} onClick={finishDeployment}>
                        Detach valve
                      </button>
                    </div>
                    {recaptures > 0 && <p className="text-[12px] text-ink-faint">Recaptures: {recaptures}</p>}
                  </>
                )}
              </div>
            </Panel>
          )}

          {step === "assess" && (
            <Panel title="Assess the result">
              <div className="space-y-3">
                {!planByLearner && <p className="text-xs text-ink-soft leading-relaxed">{s.vignette}</p>}
                <div className="monitor rounded-md overflow-hidden">
                  <RootInjectionView injection={injection} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn" disabled={busy} onClick={injectRoot}>
                    Root injection
                  </button>
                  <button className="btn" disabled={actions.rescueS != null} onClick={callRescue}>
                    {actions.rescueS != null ? `Rescue called ${mmss(actions.rescueS)}` : "Call rescue PCI and the surgeon"}
                  </button>
                  <button className="btn col-span-2" disabled={actions.pacingS != null} onClick={paceWire}>
                    {actions.pacingS != null ? `Pacing through the temporary wire from ${mmss(actions.pacingS)}` : "Pace through the temporary wire"}
                  </button>
                </div>
                {injection ? (
                  <div className="space-y-1.5">
                    <div className="stat-label">Valve function</div>
                    <ul className="space-y-1.5">
                      {findings.map((f, i) => (
                        <li key={i} className={`text-xs leading-snug ${neutralFindings ? "text-ink-soft" : TONE_TEXT[f.tone as Tone]}`}>
                          • {f.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-faint">Inject the root and image the valve to judge the result.</p>
                )}
                <Teach>
                  Decide on post-dilatation. It improves frame expansion and paravalvular sealing, but adds radial
                  force across the annulus and any LVOT calcium.
                </Teach>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn" disabled={busy || postDone} onClick={postDilate}>
                    Post-dilate
                  </button>
                  <button className="btn btn-accent" disabled={busy} onClick={finishAssess}>
                    {postDone ? "Finish case" : "Accept result"}
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === "debrief" && score && best && (
            <>
              <Panel title="Score">
                <div className="space-y-3">
                  <ScoreBadge score={score.score} />
                  <DeductionList items={score.deductions} />
                  {!planByLearner && <p className="text-[12px] text-ink-faint">The valve was deployed by the scenario, so only the assessment and the response are scored.</p>}
                </div>
              </Panel>
              {courseScore && (
                <Panel title="After release">
                  <p className="text-xs text-ink-soft leading-relaxed">{courseScore.outcome}</p>
                  <p className="text-[12px] text-ink-faint mt-2">
                    Root injection {actions.rootInjectionS != null && course ? `${Math.round(actions.rootInjectionS - course.pacingEndS)} s after pacing stopped` : "not done"}; rescue{" "}
                    {actions.rescueS != null ? `called at ${mmss(actions.rescueS)}` : "not called"}. The course is a labelled teaching model, not a haemodynamic simulation.
                  </p>
                </Panel>
              )}
              <Panel title="Lowest-risk plan in this model">
                <div className="space-y-2 text-xs text-ink-soft">
                  <p>
                    {best.plan.access === "transfemoral" ? "Transfemoral" : "Alternative access"},{" "}
                    {PLATFORM_LABEL[best.plan.platform].toLowerCase()} {best.plan.sizeMm} mm, depth about{" "}
                    {best.plan.finalDepthMm.toFixed(1)} mm
                    {best.plan.predilatation ? ", predilatation" : ""}
                    {best.plan.postDilatation ? ", post-dilatation" : ""}
                    {best.plan.coronaryProtection ? ", coronary protection" : ""}.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {RISK_ORDER.filter((k) => best.outcome.risks[k].level !== "low").map((k) => (
                      <span key={k} className="flex items-center gap-1">
                        <span className="text-ink-faint">{best.outcome.risks[k].label}:</span>
                        <LevelChip level={best.outcome.risks[k].level} />
                      </span>
                    ))}
                    {RISK_ORDER.every((k) => best.outcome.risks[k].level === "low") && (
                      <span className="text-good">All risks low.</span>
                    )}
                  </div>
                </div>
              </Panel>
              <Panel title="Teaching points">
                <ul className="space-y-1 text-xs text-ink-soft">
                  {s.teachingPoints.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </Panel>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => reset(scenarioId)}>
                  Repeat case
                </button>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    const i = TAVI_SCENARIOS.findIndex((x) => x.id === scenarioId);
                    reset(TAVI_SCENARIOS[(i + 1) % TAVI_SCENARIOS.length].id);
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


// ---------------------------------------------------------------------------

function DepthReadouts({ plan, depth }: { plan: TaviPlan; depth: number }) {
  const H = frameHeightMm(plan.platform, plan.sizeMm);
  const vent = clamp(depth / H, 0, 1) * 100;
  const band = depthBand(plan.platform, depth);
  const tone: Tone = band === "ideal" ? "good" : band === "high" || band === "deep" ? "warn" : "danger";
  const label: Record<typeof band, string> = {
    "too-high": "Too high",
    high: "High",
    ideal: "In band",
    deep: "Deep",
    "too-deep": "Too deep",
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      <Readout label="Depth" value={depth.toFixed(1)} unit="mm" tone={tone} small />
      <Readout label="Ventricular" value={vent.toFixed(0)} unit="%" small />
      <Readout label="Band" value={label[band]} tone={tone} small />
    </div>
  );
}

function PlanControls({
  s,
  plan,
  up,
  next,
}: {
  s: TaviScenario;
  plan: TaviPlan;
  up: (p: Partial<TaviPlan>) => void;
  next: () => void;
}) {
  const a = s.annulus;
  const rule = CHART_RULE[plan.platform];
  const chart = teachingChart(plan.platform);
  const metric = annulusMetric(plan.platform, a);
  const os = oversizingPct(plan.platform, plan.sizeMm, a);
  const setPlatform = (p: ValvePlatform) => {
    const sizes = VALVE_SIZES[p];
    up({ platform: p, sizeMm: sizes.includes(plan.sizeMm) ? plan.sizeMm : sizes[1] });
  };
  return (
    <>
      <Panel title="Patient">
        <p className="text-xs text-ink-soft leading-relaxed">{s.vignette}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="chip">
            {s.age} {s.sex}
          </span>
          <span className="chip">BSA {s.bsaM2.toFixed(2)} m²</span>
          <span className="chip">LVEF {s.lvefPct}%</span>
          <span className={`chip ${s.rbbb ? "text-warn border-warn/40" : ""}`}>{s.rbbb ? "RBBB" : "No RBBB"}</span>
          <span className={`chip ${s.bicuspid ? "text-warn border-warn/40" : ""}`}>{s.bicuspid ? "Bicuspid" : "Tricuspid"}</span>
        </div>
        <p className="text-[12px] text-accent mt-2">{s.focus}</p>
      </Panel>

      <Panel title="CT measurements">
        <table className="w-full text-xs">
          <tbody className="[&_td]:py-0.5">
            <Row k="Annular area" v={`${a.areaMm2.toFixed(0)} mm²`} />
            <Row k="Annular perimeter" v={`${a.perimeterMm.toFixed(1)} mm`} />
            <Row k="Min / max diameter" v={`${a.minDiameterMm.toFixed(1)} / ${a.maxDiameterMm.toFixed(1)} mm`} />
            <Row k="Perimeter-derived (P/π)" v={`${perimeterDerivedDiameter(a.perimeterMm).toFixed(1)} mm`} />
            <Row k="Area-derived (2√(A/π))" v={`${areaDerivedDiameter(a.areaMm2).toFixed(1)} mm`} />
            <Row k="Eccentricity (1 − min/max)" v={eccentricityIndex(a.minDiameterMm, a.maxDiameterMm).toFixed(2)} />
            <Row k="Coronary height L / R" v={`${s.coronaryHeightLeftMm.toFixed(1)} / ${s.coronaryHeightRightMm.toFixed(1)} mm`} />
            <Row k="SOV / STJ" v={`${s.sinusDiameterMm.toFixed(1)} / ${s.stjDiameterMm.toFixed(1)} mm`} />
            <Row k="Membranous septum" v={`${s.membranousSeptumMm.toFixed(1)} mm`} />
            <Row k="LVOT / leaflet calcium" v={`${s.lvotCalcium} / ${s.leafletCalcium}`} />
          </tbody>
        </table>
      </Panel>

      <Panel title="Valve choice">
        <div className="space-y-3">
          <Seg
            options={[
              { id: "balloon-expandable", label: "Balloon-expandable" },
              { id: "self-expanding", label: "Self-expanding" },
            ]}
            value={plan.platform}
            onChange={setPlatform}
          />
          <div className="rounded-md border border-line overflow-hidden">
            <div className="px-2 py-1 text-[12px] text-warn bg-warn/5 border-b border-line">
              {CHART_LABEL}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-faint">
                  <th className="text-left font-normal px-2 py-1">Size</th>
                  <th className="text-left font-normal px-2 py-1">
                    Annular {rule.metric} ({rule.metric === "area" ? "mm²" : "mm"})
                  </th>
                </tr>
              </thead>
              <tbody>
                {chart.map((r) => {
                  const hit = metric >= r.min && metric <= r.max;
                  const sel = r.sizeMm === plan.sizeMm;
                  return (
                    <tr
                      key={r.sizeMm}
                      onClick={() => up({ sizeMm: r.sizeMm })}
                      className={`cursor-pointer ${sel ? "bg-accent/15" : "hover:bg-base-500/50"}`}
                    >
                      <td className="px-2 py-1 font-mono text-ink">{r.sizeMm} mm</td>
                      <td className="px-2 py-1 font-mono text-ink-soft">
                        {r.min.toFixed(rule.metric === "area" ? 0 : 1)}–{r.max.toFixed(rule.metric === "area" ? 0 : 1)}
                        {hit && <span className="ml-2 text-accent">◂ patient</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-2 py-1.5 text-[12px] text-ink-faint border-t border-line leading-snug">{rule.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Readout
              label={`Patient ${rule.metric}`}
              value={metric.toFixed(rule.metric === "area" ? 0 : 1)}
              unit={rule.metric === "area" ? "mm²" : "mm"}
              small
            />
            <Readout
              label={`${plan.sizeMm} mm oversizing`}
              value={fmtPct(os)}
              tone={os < rule.minOversizePct || os > rule.maxOversizePct ? "warn" : "good"}
              small
            />
          </div>
          <Slider
            label="Target implant depth"
            value={plan.targetDepthMm}
            min={-2}
            max={10}
            step={0.5}
            unit="mm"
            onChange={(v) => up({ targetDepthMm: v })}
          />
          <Toggle
            label="Predilatation (balloon valvuloplasty)"
            checked={plan.predilatation}
            onChange={(v) => up({ predilatation: v })}
            hint="Helps frame expansion in heavy leaflet calcium; also tests leaflet behaviour near a low ostium."
          />
          <Toggle
            label="Coronary protection"
            checked={plan.coronaryProtection}
            onChange={(v) => up({ coronaryProtection: v })}
            hint="Wire, with or without an undeployed stent, parked in the threatened coronary before deployment."
          />
          <button className="btn btn-accent w-full" onClick={next}>
            Plan access
          </button>
        </div>
      </Panel>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="text-ink-faint pr-2">{k}</td>
      <td className="text-right font-mono text-ink">{v}</td>
    </tr>
  );
}
