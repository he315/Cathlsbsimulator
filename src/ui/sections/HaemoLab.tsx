// Haemodynamics lab: right and left heart catheterisation, oximetry run, the learner's own
// calculations and a diagnosis, on the teaching scenarios of src/simulation/haemo.ts.
//
// The study is a session (src/simulation/haemoStudy.ts) that knows where the catheters are, what has
// been recorded in each measurement set, the learner's entries and the events of the scenario; its
// phase and events feed the lab tips (src/ui/lab/haemoTips.ts) under the run's policy (useLabRun:
// guided practice shows tips as they apply, supervised and independent after asking for help, exams
// none). A lesson or case opens it at a scenario and start through the launch store
// (useLabLaunch("haemo")). In DEV builds window.__lab.haemo exposes the context, tips, state and a
// dispatch for checking the lab while the pane is hidden.
//
// The run's ledger gets the calculations, the shock decision and the diagnosis from dispatch, the
// transducer set-up decisions (setupDecisions(): the fast-flush readings, air through the manifold,
// re-levelling after the table moved) from dispatch too, and the valve study's and right heart
// passage's decisions from the catheter controls (onDecide), which follow the run's mode for their
// guided aids. A repeat restarts the study the way it began: the same start (a set-up preset, a shock
// preset's set) and the launch's events. Each run of a valve study gets new catheter controls (keyed on
// the run), so a repeat or a relaunch of the same valve scenario starts the valve study, its decisions
// and their ledger records again; the other scenarios keep one set of controls, whose right heart
// passage keeps its preset over a repeat.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID, stepUp } from "../../simulation/haemo";
import {
  CALC_BY_KEY,
  SHOCK_ACTIONS,
  currentSet,
  diagnosisOptions,
  expectedDecision,
  haemoStudyReducer,
  initialStudy,
  referenceValue,
  scoreStudy,
  setupDecisions,
  shownChambers,
  studyEvents,
  studyScenario,
  studySetup,
  studyTruth,
  type HaemoAction,
  type HaemoStudyState,
} from "../../simulation/haemoStudy";
import { bsaDuBois } from "../../simulation/calc";
import { isAvStudy } from "../../simulation/haemo/avCrossing";
import { LAB_EVENTS, type LabEvent } from "../../content/lab/tips";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { registerLabHook } from "../../dev/labHooks";
import { haemoTipContext } from "../lab/haemoTips";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import CatheterPanel from "../haemo/CatheterPanel";
import TracePanel, { RecordedPressures } from "../haemo/TracePanel";
import OximetryPanel from "../haemo/OximetryPanel";
import CalcPanel from "../haemo/CalcPanel";
import DiagnosisPanel from "../haemo/DiagnosisPanel";
import SectionShell from "../SectionShell";

const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "—");

/** How a study began: its scenario, the start it was opened at and the events raised for it. */
export interface StudyStart {
  scenarioId: string;
  start: string | null;
  events: LabEvent[];
}

/** The study a launch asks for (scenario, start and events), or null when it names no known scenario. */
export function launchStudy(p: LaunchParams): { state: HaemoStudyState; mode: LaunchMode | null; begun: StudyStart } | null {
  const id = p.scenario ?? HAEMO_SCENARIOS[0].id;
  if (!SCENARIO_BY_ID[id]) return null;
  // The schema defines events as a comma-separated string; tolerate an array from a direct caller.
  const raw: unknown = (p as Record<string, unknown>).events;
  const names = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [])
    .map((e) => String(e).trim())
    .filter(Boolean);
  const events = names.filter((e): e is LabEvent => (LAB_EVENTS as readonly string[]).includes(e));
  const dropped = names.filter((e) => !(LAB_EVENTS as readonly string[]).includes(e));
  if (dropped.length && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) console.warn(`haemo launch: unknown event name(s) ignored: ${dropped.join(", ")}`);
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  const start = p.start ?? null;
  return { state: initialStudy(id, start, events), mode, begun: { scenarioId: id, start, events } };
}

/**
 * The study a repeat starts: the scenario again at the start it began with (a set-up preset stays that
 * preset, a shock preset its set) and with the events it was opened with. Without a record of how it
 * began (or for another scenario), the start is read from the study itself: its set-up preset, else
 * the set it holds, and no events (those the study holds may have been raised during it).
 */
export function repeatStudy(study: HaemoStudyState, begun: StudyStart | null): { state: HaemoStudyState; begun: StudyStart } {
  const b: StudyStart =
    begun && begun.scenarioId === study.scenarioId
      ? begun
      : { scenarioId: study.scenarioId, start: studySetup(study).preset ?? (study.sets.pre ? "pre" : study.sets.post ? "post" : null), events: [] };
  return { state: initialStudy(b.scenarioId, b.start, b.events), begun: b };
}

/**
 * The key of the catheter controls: a valve study's controls are new for each run (its local valve
 * study, attempts and sent decisions start again on a repeat or a relaunch of the same scenario); the
 * other scenarios keep theirs, so the right heart passage's own new-study handling keeps its preset.
 */
export function catheterKey(study: HaemoStudyState, runKey: number): string {
  return isAvStudy(SCENARIO_BY_ID[study.scenarioId]) ? `av-${runKey}` : "rhc";
}

export default function HaemoLab() {
  const [study, setStudy] = useState<HaemoStudyState>(() => initialStudy(HAEMO_SCENARIOS[0].id));
  const [blind, setBlind] = useState(true);
  const [launchMode, setLaunchMode] = useState<LaunchMode | null>(null);
  const [runKey, setRunKey] = useState(0);
  const studyRef = useRef(study);
  studyRef.current = study;
  /** how the study began, for a repeat (the study shown on first mount is a prepared study of the first scenario) */
  const begunRef = useRef<StudyStart | null>({ scenarioId: HAEMO_SCENARIOS[0].id, start: null, events: [] });

  const base = SCENARIO_BY_ID[study.scenarioId];
  const s = studyScenario(study);
  const bsa = useMemo(() => bsaDuBois(base.heightCm, base.weightKg), [base]);

  const run = useLabRun("haemo", runCaseId("haemo", study.scenarioId), launchMode, { runKey, caseName: `Haemodynamics lab: ${base.title}` });
  const runRef = useRef(run);
  runRef.current = run;

  /** Apply an action, logging the scored ones in the run's ledger and finishing the run on a diagnosis. */
  const dispatch = useCallback((a: HaemoAction) => {
    const prev = studyRef.current;
    const next = haemoStudyReducer(prev, a);
    if (next === prev) return;
    studyRef.current = next;
    setStudy(next);
    // a dev hook's load begins a study: a repeat restarts it from there
    if (a.type === "load") begunRef.current = { scenarioId: a.scenarioId, start: a.start ?? null, events: [...(a.events ?? [])] };
    const r = runRef.current;
    const setLabel = next.set === "base" ? "" : next.set === "pre" ? " (before PCI)" : " (after PCI)";
    if (a.type === "enter") {
      const e = currentSet(next).entries[a.key];
      const spec = CALC_BY_KEY[a.key];
      if (e) r.decide({ id: `calc-${next.set}-${a.key}`, stage: "calculations", label: `${spec.label}${setLabel}`, correct: e.firstAccepted, expected: `${fmt(referenceValue(studyTruth(next), a.key), spec.dp)} ${spec.unit}`.trim(), given: `${e.value} ${spec.unit}`.trim(), lessonId: spec.lessonId });
    } else if (a.type === "decide") {
      const exp = expectedDecision(SCENARIO_BY_ID[next.scenarioId]);
      const label = (id?: string) => SHOCK_ACTIONS.find((x) => x.id === id)?.label ?? "none";
      if (exp) r.decide({ id: "shock-decision", stage: "calculations", label: "Decision after PCI", correct: a.action === exp, expected: label(exp), given: label(a.action), lessonId: "pm-support-choice-rv", tipIds: ["haemo-support-cpo-papi"] });
    }
    // the transducer set-up decisions this action settles (logged before a diagnosis finishes the run)
    const decided = new Set(r.run.decisions().map((d) => d.id));
    for (const d of setupDecisions(prev, next, a, decided)) r.decide(d);
    if (a.type === "answer") {
      const sc = SCENARIO_BY_ID[next.scenarioId];
      const given = diagnosisOptions(sc)[a.index];
      r.decide({ id: "diagnosis", stage: "diagnosis", label: "Diagnosis", correct: given === sc.diagnosis, expected: sc.diagnosis, given });
      const sc2 = scoreStudy(next);
      // air injected through the manifold is the set-up preset's critical error (scoreStudy's metrics carry it)
      r.finish({ score: sc2.score, passed: sc2.passed, metrics: sc2.metrics, criticalErrors: sc2.metrics.criticalErrors ?? 0 });
    }
  }, []);

  const load = useCallback((state: HaemoStudyState, mode: LaunchMode | null, begun: StudyStart) => {
    studyRef.current = state;
    begunRef.current = begun;
    setStudy(state);
    setLaunchMode(mode);
    setRunKey((k) => k + 1);
  }, []);

  useLabLaunch("haemo", (p) => {
    const l = launchStudy(p);
    if (l) load(l.state, l.mode, l.begun);
  });

  const reset = (id: string) => load(initialStudy(id), null, { scenarioId: id, start: null, events: [] });
  // a repeat restarts the study as it began (a set-up preset, or a shock preset after PCI, stays that preset)
  const repeat = () => {
    const r = repeatStudy(studyRef.current, begunRef.current);
    load(r.state, launchMode, r.begun);
  };

  // tips
  const context = useMemo(() => haemoTipContext(study), [study]);
  const { tips, visible } = useContextTips(context, run);
  const events = useMemo(() => studyEvents(study), [study]);

  // DEV: window.__lab.haemo
  useEffect(
    () =>
      registerLabHook("haemo", {
        context: () => haemoTipContext(studyRef.current),
        tips: () => selectTips(loadedTips(), haemoTipContext(studyRef.current), runRef.current.run).map((t) => t.id),
        state: () => studyRef.current,
        events: () => studyEvents(studyRef.current),
        dispatch,
      } as Parameters<typeof registerLabHook>[1] & { dispatch: (a: HaemoAction) => void }),
    [dispatch]
  );

  const m = currentSet(study);
  const shown = shownChambers(study);
  const locked = study.answer !== null;
  const guided = run.mode === "guided";
  const set = base.sets && study.set !== "base" ? base.sets[study.set] : null;

  return (
    <SectionShell
      title="Haemodynamics lab"
      subtitle="Right and left heart catheterisation on teaching scenarios. Every number is computed from the traces you see; you work out the derived values yourself."
      actions={
        <>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} /> hide diagnosis
          </label>
          <select value={study.scenarioId} onChange={(e) => reset(e.target.value)} className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink max-w-[320px]">
            {HAEMO_SCENARIOS.map((x, i) => (
              <option key={x.id} value={x.id}>
                {i + 1}. {blind ? x.title : `${x.title} — ${x.diagnosis}`}
              </option>
            ))}
          </select>
        </>
      }
    >
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()} className="mb-4" />
      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="panel p-4">
            <div className="stat-label mb-1">Patient</div>
            <div className="text-[14.5px] text-ink leading-relaxed">{base.brief}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip">HR {s.hr}</span>
              <span className="chip">
                {base.heightCm} cm · {base.weightKg} kg · BSA {fmt(bsa, 2)} m²
              </span>
              <span className="chip">Hb {base.hb} g/dL</span>
            </div>
            {set && (
              <div className="mt-3 border-t border-line pt-2">
                <div className="stat-label mb-0.5">Measurement set: {set.title}</div>
                <p className="text-[13.5px] text-ink-soft">{set.note}</p>
                {study.set === "pre" && (
                  <button className="btn btn-accent mt-2" disabled={locked} onClick={() => dispatch({ type: "next-set" })}>
                    PCI done: take the after-PCI set ▸
                  </button>
                )}
              </div>
            )}
          </div>

          <TracePanel scenario={s} shown={shown} resp={study.resp} pvc={study.pvc} onRecord={() => dispatch({ type: "record" })} study={study} dispatch={dispatch}>
            <CatheterPanel key={catheterKey(study, runKey)} study={study} dispatch={dispatch} disabled={locked} mode={run.mode} onDecide={(d) => run.decide(d)} />
          </TracePanel>

          <DiagnosisPanel study={study} onAnswer={(i) => dispatch({ type: "answer", index: i })} onRepeat={repeat} />
        </div>

        <div className="xl:col-span-4 space-y-4">
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={events} />
          <RecordedPressures rec={m.rec} title={set ? `Recorded pressures, ${set.title.charAt(0).toLowerCase() + set.title.slice(1)} (mmHg)` : undefined} />
          <OximetryPanel sats={m.rec.sats} onSample={(k) => dispatch({ type: "sat", site: k })} step={stepUp(s)} showInterpretation={guided || locked} disabled={locked} />
          <CalcPanel study={study} dispatch={dispatch} mode={run.mode} />
        </div>
      </div>
    </SectionShell>
  );
}
