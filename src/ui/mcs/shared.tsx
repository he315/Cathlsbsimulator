// Shared parts of the MCS lab consoles (mcs-console-split-select-and-tips): read-outs, targets,
// the scenario picker, the stage bar, the patient-event adapter and the session hook that gives
// every console its run (useLabRun), its tips (src/ui/lab/mcsTips.ts) and window.__lab.mcs.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import type { LaunchMode } from "../../content/schema";
import type { BeatStats } from "../../simulation/circulation";
import { SELECT_PRESETS, SESSION_POINTS, type McsSessionScore } from "../../simulation/mcs/deviceChoice";
import { registerLabHook } from "../../dev/labHooks";
import { runCaseId, useLabRun, type UseLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import { PatientEventAdapter } from "../lab/patientEvents";
import { mcsVitals, type McsConsole, type McsStage } from "../lab/mcsTips";
import type { LabTip } from "../../content/lab/tips";

/** Console names in the lab's chrome: generic device names (HANDOVER 6.5). */
export const CONSOLE_LABEL: Record<McsConsole, string> = {
  iabp: "Balloon pump",
  impella: "Microaxial pump",
  ecmo: "VA-ECMO",
};

/** The same names as nouns in running text ("Go to the balloon pump console"); acronyms keep their case. */
export const CONSOLE_NOUN: Record<McsConsole, string> = {
  iabp: "balloon pump",
  impella: "microaxial pump",
  ecmo: "VA-ECMO",
};

export const f0 = (x?: number) => (x === undefined || !Number.isFinite(x) ? "—" : Math.round(x).toString());
export const f1 = (x?: number) => (x === undefined || !Number.isFinite(x) ? "—" : x.toFixed(1));
export const f2 = (x?: number) => (x === undefined || !Number.isFinite(x) ? "—" : x.toFixed(2));

export function Readout({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "warn" | "danger" }) {
  const col = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="rounded-md border border-line bg-base-800/70 px-2.5 py-1.5">
      <div className="text-[12px] text-ink-faint">{label}</div>
      <div className={`metric font-mono text-[19px] ${col}`}>
        {value}
        {unit && <span className="text-[12px] text-ink-faint ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export interface Goal {
  label: string;
  ok: boolean;
}

/**
 * The targets of a case. Whether each is met is shown live only as a teaching aid (guided practice,
 * showProgress); otherwise the list is the task, and the ticks appear once the targets are held.
 */
export function Goals({ goals, done, showProgress = true }: { goals: Goal[]; done: boolean; showProgress?: boolean }) {
  const show = showProgress || done;
  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="stat-label">Targets</span>
        {done && <span className="chip border-good/40 text-good">achieved</span>}
      </div>
      <ul className="space-y-0.5 text-[13px]">
        {goals.map((g) => (
          <li key={g.label} className={show && g.ok ? "text-good" : "text-ink-soft"}>
            {show ? (g.ok ? "✓" : "○") : "·"} {g.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** All goals held continuously for `hold` seconds of model time → done; `onDone` is called once per run. */
export function useGoalHold(goals: Goal[], elapsed: number, resetKey: string, onDone: () => void, hold = 8): boolean {
  const since = useRef<number | null>(null);
  const [done, setDone] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;
  useEffect(() => {
    since.current = null;
    setDone(false);
  }, [resetKey]);
  const all = goals.length > 0 && goals.every((g) => g.ok);
  useEffect(() => {
    if (done) return;
    if (!all) {
      since.current = null;
      return;
    }
    if (since.current === null) since.current = elapsed;
    if (elapsed - since.current >= hold) {
      setDone(true);
      cb.current();
    }
  }, [all, elapsed, done, hold]);
  return done;
}

/** One scenario of a console's picker. */
export interface PickItem {
  id: string;
  title: string;
}

/** The scenario picker: the device-choice presets first (the step at the start of each console), then the console's cases. */
export function ScenarioPicker({ value, cases, onChange }: { value: string; cases: readonly PickItem[]; onChange: (id: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Scenario" className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink w-full sm:w-auto min-w-0 max-w-full sm:max-w-[320px]">
      <optgroup label="Choose the support">
        {SELECT_PRESETS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.title}
          </option>
        ))}
      </optgroup>
      <optgroup label="Run the device">
        {cases.map((k) => (
          <option key={k.id} value={k.id}>
            {k.title}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

const STAGE_LABEL: Record<McsStage, string> = {
  select: "Choosing the support",
  insert: "Insertion",
  position: "Positioning",
  manage: "Running the device",
  wean: "Weaning",
  complication: "Complication",
};

/** Where the run is now, and the learner's step into weaning once the targets are met. */
export function StageBar({ stage, canWean, onWean }: { stage: McsStage; canWean: boolean; onWean: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-soft" role="group" aria-label="Stage">
      <span className="stat-label">Stage</span>
      <span className="chip">{STAGE_LABEL[stage]}</span>
      {canWean && stage !== "wean" && (
        <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onWean}>
          Begin weaning
        </button>
      )}
    </div>
  );
}

/**
 * Patient events from the shared adapter (hypotension with its hold, VF), read from a console's beat
 * statistics in model time; a new run starts a new adapter.
 */
export function usePatientEvents(stats: BeatStats | null, rhythm: "sinus" | "vf", hr: number, elapsed: number, resetKey: string): LabEvent[] {
  const adapter = useMemo(() => new PatientEventAdapter(), [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => adapter.update(mcsVitals(stats, rhythm, hr, elapsed)), [adapter, stats, rhythm, hr, elapsed]);
}

export interface McsSessionOptions {
  console: McsConsole;
  scenarioId: string;
  caseName: string;
  launchMode: LaunchMode | null;
  runKey: string | number;
  context: LabContext;
  /** for window.__lab.mcs */
  state: () => unknown;
  step?: (seconds: number, dt?: number) => void;
}

export interface McsSession {
  run: UseLabRun;
  tips: LabTip[];
  visible: boolean;
}

/** The console's run, tips under the run's policy, and window.__lab.mcs in DEV builds. */
export function useMcsSession(o: McsSessionOptions): McsSession {
  const run = useLabRun(o.console, runCaseId(o.console, o.scenarioId), o.launchMode, { runKey: o.runKey, caseName: o.caseName });
  const { tips, visible } = useContextTips(o.context, run);
  const live = useRef(o);
  live.current = o;
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(
    () =>
      registerLabHook("mcs", {
        context: () => live.current.context,
        tips: () => selectTips(loadedTips(), live.current.context, runRef.current.run).map((t) => t.id),
        state: () => ({ console: live.current.console, scenario: live.current.scenarioId, ...(live.current.state() as object) }),
        events: () => live.current.context.events ?? [],
        step: (seconds: number, dt?: number) => live.current.step?.(seconds, dt),
      }),
    []
  );
  return { run, tips, visible };
}

/**
 * The learner ends the case before the targets are held: the run is logged as it stands (a failed
 * run when the targets were not met). Hidden once the run is finished.
 */
export function EndCase({ finished, onEnd }: { finished: boolean; onEnd: () => void }) {
  if (finished) return null;
  return (
    <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onEnd}>
      End case
    </button>
  );
}

/**
 * The outcome of a finished console run (scoreMcsSession): score, pass or fail and each criterion
 * against its maximum, with a restart of the same case.
 */
export function SessionDebrief({ result, harmLabel, showEfficiency = false, onRestart }: { result: McsSessionScore; harmLabel: string; showEfficiency?: boolean; onRestart?: () => void }) {
  const P = SESSION_POINTS;
  const c = result.criteria;
  const rows: { label: string; got: number; max: number }[] = [
    { label: "Targets held", got: c.targets, max: P.targets },
    { label: harmLabel, got: c.harmFree, max: P.harmFree },
    ...(showEfficiency ? [{ label: "Adjustments kept to those needed", got: c.efficiency, max: P.efficiency }] : []),
  ];
  return (
    <div className="panel p-3 space-y-2 text-[13px] animate-fadein" data-testid="mcs-session-debrief">
      <div className="flex items-center justify-between gap-2">
        <span className="stat-label">Run result</span>
        <span className={`chip ${result.passed ? "border-good/40 text-good" : "border-danger/40 text-danger"}`}>{result.passed ? "passed" : "not passed"}</span>
      </div>
      <div className="font-mono text-[19px] text-ink">{result.score} / 100</div>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className={`flex justify-between gap-2 ${r.got >= r.max ? "text-good" : "text-warn"}`}>
            <span>{r.label}</span>
            <span className="font-mono">
              {r.got} / {r.max}
            </span>
          </li>
        ))}
        {c.critical < 0 && (
          <li className="flex justify-between gap-2 text-danger font-semibold">
            <span>Critical errors</span>
            <span className="font-mono">{c.critical}</span>
          </li>
        )}
      </ul>
      {!result.passed && c.targets === 0 && <div className="text-ink-soft">The run ended before every target was held.</div>}
      {onRestart && (
        <button type="button" className="btn !text-[12px]" onClick={onRestart}>
          Restart this case
        </button>
      )}
    </div>
  );
}

/** The console's layout: scenario brief with the picker, then the console's own content. */
export function ScenarioHeader({ brief, picker, children }: { brief: string; picker: ReactNode; children?: ReactNode }) {
  return (
    <div className="panel p-4 flex flex-wrap items-start gap-3">
      <div className="flex-1 min-w-[min(16rem,100%)]">
        <div className="stat-label mb-1">Scenario</div>
        <div className="text-[14.5px] text-ink">{brief}</div>
        {children}
      </div>
      {picker}
    </div>
  );
}
