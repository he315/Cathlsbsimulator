// ===========================================================================
// Pressure recognition drill (diag-pressure-recognition-drill).
//
// Replaces the static gallery of drawn traces with a timed drill of traces the
// patient engine makes (src/simulation/pressureDrill.ts), played at real speed
// on the haemodynamic monitor (HaemoMonitor). For each item the learner reads
// the stem and the trace, names it, chooses the first action and states a
// confidence before the time limit; the reveal then gives the truth, the reason
// and the lab tips for the trace (tipsFor, diagnostic lab, injection step),
// with the damping scenario of the cath lab for a wrong answer. The summary
// gives agreement (Cohen's kappa on the names) and calibration (Brier score),
// and the session is recorded in the progress store.
//
// Opened from a lesson or the sidebar; openSim('pressure', { set }) or a
// scenario of src/content/practice/diag-pressure-recognition-drill.launch.ts
// opens a set directly. The live screen shows only the monitor and the stem;
// the trace's class appears only on the reveal.
// ===========================================================================

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useUiStore } from "../../state/useUiStore";
import { useProgressStore } from "../../state/useProgressStore";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import {
  DRILL_ACTIONS,
  DRILL_ACTION_LABEL,
  DRILL_NAMES,
  DRILL_NAME_LABEL,
  DRILL_SETS,
  DRILL_SET_LABEL,
  DrillRun,
  DrillSession,
  MP_DRILL,
  drillSetFromParams,
  drillStem,
  setTypes,
  type DrillAction,
  type DrillItemRef,
  type DrillMark,
  type DrillName,
  type DrillSet,
} from "../../simulation/pressureDrill";
import type { TipPressureState } from "../../simulation/patient/transducer";
import HaemoMonitor from "../lab/HaemoMonitor";
import { TipCard } from "../content/BlockRenderer";
import SectionShell from "../SectionShell";

/** The cath lab scenario a wrong answer offers (diag-pressure-transducer, diagnosticScenarios/pressure.ts). */
const DAMPING_SCENARIO = "diag-damping-causes";

const STATE_WORDS: Record<TipPressureState, string> = {
  aortic: "free (aortic)",
  damped: "damped",
  ventricularised: "ventricularised",
  wedged: "wedged",
  lv: "left ventricular",
  open: "open line",
  none: "no signal",
};

type Phase = "pick" | "item" | "reveal" | "summary";

/** Engine seconds of an item's run-up computed per slice while 'Preparing' shows, so the page keeps painting. */
const PREP_SLICE_S = 10;

/**
 * The live item's stem panel body: what the operator knows and the root pressure recorded first. It never
 * names the trace's class (PressureTrainer.test.ts checks every item's stems).
 */
export function ItemStem({ stem, baseline }: { stem: string; baseline: { sys: number; dia: number } }) {
  return (
    <div className="p-3 text-[13px] text-ink-soft leading-relaxed">
      <div>{stem}</div>
      <div className="mt-1 text-ink-faint">
        Root pressure recorded before anything was done: <span className="metric text-ink">{baseline.sys}/{baseline.dia}</span> mmHg
      </div>
    </div>
  );
}

/** Narrowest waveform the drill allows beside the monitor's numerics before it stacks them (px; layout, not a model value). */
const MIN_WAVE_PX = 280;
/** HaemoMonitor's numerics column, 10.5rem at the 16 px root (px). */
const NUMERICS_PX = 168;
/**
 * Below this frame width the numerics go under the waveform (in columns of at least 9rem), so the trace the drill asks
 * the learner to read keeps the full width (HaemoMonitor is shared: its own layout stays as it is).
 */
const STACKED =
  "[&_.monitor]:grid-cols-1 [&_.monitor>div:last-child]:grid [&_.monitor>div:last-child]:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] [&_.monitor>div:last-child]:border-l-0 [&_.monitor>div:last-child]:border-t [&_.monitor>div:last-child>div:last-child]:col-span-full";

/** The drill's monitor frame: waveform first when the frame is too narrow for the waveform and the numerics side by side. */
function DrillMonitor({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = (w: number) => setStacked(w < MIN_WAVE_PX + NUMERICS_PX);
    fit(el.clientWidth);
    const ro = new ResizeObserver((entries) => fit(entries[0]?.contentRect.width ?? el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={frame} data-stacked={stacked ? "" : undefined} className={stacked ? STACKED : "h-[340px]"}>
      {children}
    </div>
  );
}

function ChoiceGrid<T extends string>({ options, labels, value, onChange, disabled }: { options: readonly T[]; labels: Readonly<Record<T, string>>; value: T | null; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          aria-pressed={value === o}
          className={`text-left rounded-md border px-3 py-2 text-[13px] transition-colors disabled:opacity-60 ${value === o ? "border-accent bg-accent-tint text-ink" : "border-line-strong bg-[#181b20] text-ink-soft hover:text-ink hover:bg-base-600"}`}
          onClick={() => onChange(o)}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

function ConfidenceSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className="block text-[13px] text-ink-soft">
      <div className="flex items-center justify-between">
        <span>How sure are you that both are right?</span>
        <span className="metric text-ink">{Math.round(100 * value)}%</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={Math.round(100 * value)} disabled={disabled} onChange={(e) => onChange(Number(e.target.value) / 100)} className="w-full" />
    </label>
  );
}

export default function PressureTrainer() {
  const openSim = useUiStore((s) => s.openSim);
  const recordSim = useProgressStore((s) => s.recordSim);
  const [phase, setPhase] = useState<Phase>("pick");
  const [set, setSet] = useState<DrillSet>("damping");
  const sessionRef = useRef<DrillSession | null>(null);
  const [run, setRun] = useState<DrillRun | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [name, setName] = useState<DrillName | null>(null);
  const [action, setAction] = useState<DrillAction | null>(null);
  const [conf, setConf] = useState(0.7);
  const [elapsed, setElapsed] = useState(0);
  const [mark, setMark] = useState<DrillMark | null>(null);
  const recorded = useRef(false);
  /** the item on screen (the session's current item moves on as soon as it is answered) */
  const [item, setItem] = useState<DrillItemRef | null>(null);
  const committed = useRef(false);
  const answerRef = useRef({ name, action, conf });
  answerRef.current = { name, action, conf };
  /** the pending slice of the next item's run-up */
  const prepTimer = useRef<number | undefined>(undefined);
  /** the whole seconds left that the countdown last showed */
  const shownLeft = useRef(-1);

  const cancelPrep = useCallback(() => {
    window.clearTimeout(prepTimer.current);
    prepTimer.current = undefined;
  }, []);
  /** set when an unmount stopped a preparation part way (React's StrictMode remount resumes it) */
  const prepInterrupted = useRef(false);

  /** Build the current item's trace: its run-up is computed in slices before it plays. */
  const prepare = useCallback(
    (s: DrillSession) => {
      cancelPrep();
      const ref = s.current();
      if (!ref) {
        setPreparing(false);
        setRun(null);
        setItem(null);
        setPhase("summary");
        return;
      }
      committed.current = false;
      shownLeft.current = -1;
      setPreparing(true);
      setName(null);
      setAction(null);
      setConf(0.7);
      setElapsed(0);
      setMark(null);
      const step = (r: DrillRun) => {
        if (!r.preStep(PREP_SLICE_S)) {
          prepTimer.current = window.setTimeout(() => step(r), 0);
          return;
        }
        prepTimer.current = undefined;
        setRun(r);
        setItem(ref);
        setPreparing(false);
        setPhase("item");
      };
      // let the 'preparing' notice paint before the first slice
      prepTimer.current = window.setTimeout(() => step(new DrillRun(ref.type, ref.patientSeed, { deferPre: true })), 30);
    },
    [cancelPrep]
  );

  // Stop a pending preparation on unmount. In the dev build StrictMode unmounts and remounts every
  // component once, keeping its refs and state; the launch that began the session has been taken by
  // then, so the remount resumes the item whose preparation the simulated unmount stopped.
  useEffect(() => {
    if (prepInterrupted.current) {
      prepInterrupted.current = false;
      const s = sessionRef.current;
      if (s && !s.done) prepare(s);
    }
    return () => {
      if (prepTimer.current !== undefined) prepInterrupted.current = true;
      cancelPrep();
    };
  }, [cancelPrep, prepare]);

  const begin = useCallback(
    (s: DrillSet, seed?: string) => {
      const session = new DrillSession(s, seed ?? `${Date.now()}`);
      sessionRef.current = session;
      recorded.current = false;
      setSet(s);
      prepare(session);
    },
    [prepare]
  );

  useLabLaunch("pressure", (p) => begin(drillSetFromParams(p) ?? "all", p.seed));

  const commit = useCallback(() => {
    const s = sessionRef.current;
    if (!s || !run || s.done || committed.current) return;
    committed.current = true;
    const a = answerRef.current;
    const m = s.answer({ name: a.name, action: a.action, confidence: a.conf, elapsedS: run.elapsed });
    setMark(m);
    setPhase("reveal");
  }, [run]);

  const next = useCallback(() => {
    const s = sessionRef.current;
    if (s) prepare(s);
  }, [prepare]);

  // play the trace at real speed; the time limit runs on the trace's own clock
  useEffect(() => {
    if (!run || (phase !== "item" && phase !== "reveal")) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (dt > 0) run.advance(dt);
      if (phase === "item") {
        // re-render only when the countdown's whole seconds change
        const shown = Math.ceil(Math.max(0, MP_DRILL.answerLimitS - run.elapsed));
        if (shown !== shownLeft.current) {
          shownLeft.current = shown;
          setElapsed(run.elapsed);
        }
        if (run.elapsed >= MP_DRILL.answerLimitS) commit();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run, phase, commit]);

  // record the finished session once
  useEffect(() => {
    const s = sessionRef.current;
    if (phase !== "summary" || !s || recorded.current || !s.marks.length) return;
    recorded.current = true;
    recordSim("pressure-drill", s.summary().score);
  }, [phase, recordSim]);

  // dev hooks: the browser pane pauses requestAnimationFrame while hidden, so checks drive the drill here
  useEffect(() => {
    if (!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__pressureDrill = {
      state: () => {
        const s = sessionRef.current;
        return { phase, set, index: s?.index ?? 0, total: s?.items.length ?? 0, item, elapsed: run?.elapsed ?? 0, mark: mark ? { correct: mark.correct, unsafeInjection: mark.unsafeInjection, tips: mark.tips.map((t) => t.id) } : null };
      },
      start: (s: DrillSet, seed?: string) => begin(s, seed),
      advance: (seconds: number) => run?.advance(seconds),
      answer: (n: DrillName | null, a: DrillAction | null, c = 0.7) => {
        answerRef.current = { name: n, action: a, conf: c };
        commit();
      },
      next: () => next(),
    };
    return () => {
      delete w.__pressureDrill;
    };
  }, [phase, set, run, mark, item, begin, commit, next]);

  const session = sessionRef.current;
  const ref = item;
  const left = Math.ceil(Math.max(0, MP_DRILL.answerLimitS - elapsed));

  return (
    <SectionShell
      title="Pressure recognition drill"
      subtitle="Read the trace before you inject. Name each trace and choose your first action before the time runs out."
      actions={
        phase !== "pick" ? (
          <button
            className="btn"
            onClick={() => {
              cancelPrep();
              setPreparing(false);
              setPhase("pick");
            }}
          >
            Change set
          </button>
        ) : undefined
      }
    >
      {phase === "pick" && (
        <div className="max-w-3xl">
          <div className="panel p-4 mb-4">
            <div className="text-[13px] text-ink font-medium mb-1">How it works</div>
            <p className="text-[13px] text-ink-soft leading-relaxed">
              Each trace comes from the simulated patient and plays at real speed. The stem tells you the catheter, the root pressure recorded before anything was done, and what happens at 3 s. Name the trace, choose the first action and say how sure you are within {MP_DRILL.answerLimitS} s. Judge every trace against the one recorded before engaging.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {DRILL_SETS.map((s) => (
              <button key={s} className="panel p-4 text-left hover:border-line-strong" onClick={() => begin(s)}>
                <div className="text-sm text-ink font-medium">{DRILL_SET_LABEL[s]}</div>
                <div className="text-[12px] text-ink-faint mt-1">{setTypes(s).length} traces</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {preparing && <div className="notice-info text-[13px] mb-3">Preparing the next trace…</div>}

      {(phase === "item" || phase === "reveal") && run && ref && session && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
          <div className="min-w-0">
            <div className="panel mb-3">
              <div className="panel-head">
                <span>
                  Trace {phase === "reveal" ? session.index : session.index + 1} of {session.items.length}
                </span>
                {phase === "item" && <span className={`metric normal-case font-normal ${left < 4 ? "text-warn" : "text-ink-soft"}`}>{left} s left</span>}
              </div>
              <ItemStem stem={drillStem(ref)} baseline={run.baseline} />
            </div>
            <DrillMonitor>
              <HaemoMonitor key={`${session.index}:${ref.type}:${ref.patientSeed}`} engine={run.engine} showControls={false} sweepSeconds={6} className="h-full" />
            </DrillMonitor>
          </div>

          <div className="min-w-0">
            {phase === "item" && (
              <div className="panel p-3 flex flex-col gap-3">
                <div>
                  <div className="text-[13px] text-ink mb-1.5">What is the trace?</div>
                  <ChoiceGrid options={DRILL_NAMES} labels={DRILL_NAME_LABEL} value={name} onChange={setName} />
                </div>
                <div>
                  <div className="text-[13px] text-ink mb-1.5">Your first action</div>
                  <ChoiceGrid options={DRILL_ACTIONS} labels={DRILL_ACTION_LABEL} value={action} onChange={setAction} />
                </div>
                <ConfidenceSlider value={conf} onChange={setConf} />
                <button className="btn btn-accent" disabled={!name || !action} onClick={commit}>
                  Commit
                </button>
              </div>
            )}
            {phase === "reveal" && mark && (
              <Reveal
                mark={mark}
                last={session.done}
                onNext={next}
                onPractise={() => openSim("cathlab", { scenario: DAMPING_SCENARIO, mode: "guided" })}
              />
            )}
          </div>
        </div>
      )}

      {phase === "summary" && session && <Summary session={session} onAgain={() => begin(set)} />}
    </SectionShell>
  );
}

function Reveal({ mark, last, onNext, onPractise }: { mark: DrillMark; last: boolean; onNext: () => void; onPractise: () => void }) {
  const s = mark.spec;
  const verdict = mark.correct ? "Right" : !mark.inTime ? "Out of time" : "Not right";
  return (
    <div className="panel p-3 flex flex-col gap-2.5">
      <div className={`text-sm font-medium ${mark.correct ? "text-good" : "text-danger"}`}>{verdict}</div>
      {mark.unsafeInjection && <div className="notice-danger text-[13px]">An injection into this trace is what the module warns against.</div>}
      <div className="text-[13px] text-ink-soft">
        <div>
          <span className="text-ink-faint">The trace: </span>
          <span className="text-ink">{s.title}</span> <span className="text-ink-faint">(read as {STATE_WORDS[mark.result.label]})</span>
        </div>
        <div>
          <span className="text-ink-faint">First action: </span>
          <span className="text-ink">{s.actions.map((a) => DRILL_ACTION_LABEL[a]).join(", or ")}</span>
        </div>
        <div>
          <span className="text-ink-faint">You said: </span>
          {mark.answer.name ? DRILL_NAME_LABEL[mark.answer.name] : "no name"}; {mark.answer.action ? DRILL_ACTION_LABEL[mark.answer.action] : "no action"}
        </div>
      </div>
      <p className="text-[13px] text-ink-soft leading-relaxed">{s.why}</p>
      {mark.tips.length > 0 && (
        <div>
          {mark.tips.map((t) => (
            <TipCard key={t.id} tip={t} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-accent" onClick={onNext}>
          {last ? "See the summary" : "Next trace"}
        </button>
        {!mark.correct && (
          <button className="btn" onClick={onPractise}>
            Practise in the cath lab: damping
          </button>
        )}
      </div>
    </div>
  );
}

function fmt(x: number, d = 2): string {
  return Number.isFinite(x) ? x.toFixed(d) : "n/a";
}

function Summary({ session, onAgain }: { session: DrillSession; onAgain: () => void }) {
  const sum = session.summary();
  return (
    <div className="max-w-4xl">
      <div className="panel p-4 mb-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{sum.score}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Right</span>
          <span className="stat-value">
            {sum.correct}/{sum.n}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Agreement on names (kappa)</span>
          <span className="stat-value">
            {fmt(sum.kappa.kappa)} <span className="text-[12px] text-ink-faint">({fmt(sum.kappa.lo)} to {fmt(sum.kappa.hi)})</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Confidence (Brier, 0 is best)</span>
          <span className="stat-value">{fmt(sum.brier)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Unsafe injections</span>
          <span className={`stat-value ${sum.unsafeInjections ? "text-danger" : ""}`}>{sum.unsafeInjections}</span>
        </div>
      </div>
      <div className="panel overflow-x-auto mb-3">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-ink-faint">
              <th className="font-normal px-3 py-2">Trace</th>
              <th className="font-normal px-3 py-2">Your name</th>
              <th className="font-normal px-3 py-2">Your action</th>
              <th className="font-normal px-3 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {session.marks.map((m, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-2 text-ink">{m.spec.title}</td>
                <td className={`px-3 py-2 ${m.nameCorrect ? "text-ink-soft" : "text-danger"}`}>{m.answer.name ? DRILL_NAME_LABEL[m.answer.name] : "none"}</td>
                <td className={`px-3 py-2 ${m.actionCorrect ? "text-ink-soft" : "text-danger"}`}>{m.answer.action ? DRILL_ACTION_LABEL[m.answer.action] : "none"}</td>
                <td className={`px-3 py-2 ${m.correct ? "text-good" : "text-danger"}`}>{m.correct ? "Right" : m.inTime ? "Not right" : "Out of time"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-accent" onClick={onAgain}>
        Another set of traces
      </button>
    </div>
  );
}
