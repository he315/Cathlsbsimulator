// The balloon pump console: counterpulsation timing on the arterial trace (src/simulation/iabp.ts).
// Split out of McsLab.tsx (mcs-console-split-select-and-tips); the run, its tips and its score go
// through useMcsSession (useLabRun) instead of the old floored recordSim.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LiveTrace from "../sim/LiveTrace";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import { mcsTipContext, type McsStage } from "../lab/mcsTips";
import type { LaunchMode } from "../../content/schema";
import type { LabEvent } from "../../content/lab/tips";
import { CORRECT_TIMING, NOTCH, TIMING_TEACH, iabpMetrics, iabpPressure, timingErrors, type IabpSettings } from "../../simulation/iabp";
import { scoreMcsSession, type McsSessionScore } from "../../simulation/mcs/deviceChoice";
import { EndCase, Readout, SessionDebrief, ScenarioHeader, ScenarioPicker, StageBar, f0, useMcsSession } from "./shared";

export interface IabpCase {
  id: string;
  title: string;
  brief: string;
  start: IabpSettings;
  /** a complication the console reports for the whole case (the tip context's events) */
  events?: readonly LabEvent[];
  /** the assist ratio the case needs, when the fix is the ratio rather than the timing */
  ratio?: IabpSettings["ratio"];
  /** adjustments the case is expected to need (IABP_EXPECTED_MOVES when absent) */
  expectedMoves?: number;
}

export const IABP_CASES: IabpCase[] = [
  {
    id: "late-deflation",
    title: "Ward call: 'the balloon looks odd'",
    brief: "Post-infarct septal rupture awaiting surgery, balloon pump 1:1. The nurse reports the assisted end-diastolic pressure is higher than before.",
    start: { ...CORRECT_TIMING, deflate: 1.07 },
  },
  {
    id: "early-inflation",
    title: "New operator set-up",
    brief: "High-risk PCI patient. The balloon was started on manual timing by someone unfamiliar with the console.",
    start: { ...CORRECT_TIMING, inflate: 0.27 },
  },
  {
    id: "early-deflation",
    title: "Recurrent angina on support",
    brief: "Unstable angina bridged to CABG with a balloon pump. Chest pain recurs; the augmentation looks short.",
    start: { ...CORRECT_TIMING, deflate: 0.7 },
  },
  {
    id: "late-inflation",
    title: "Poor augmentation",
    brief: "Cardiogenic shock on a balloon pump. The augmented pressure seems low and the notch is clearly visible.",
    start: { ...CORRECT_TIMING, inflate: 0.47 },
  },
  {
    // the check question of lesson pm-support-devices-iabp-run (Brilakis 14.3): with anticoagulation
    // stopped for a retroperitoneal bleed, the balloon runs at 1:1 to limit thrombus on it
    id: "retroperitoneal-bleed",
    title: "Back pain and a falling haemoglobin",
    brief:
      "An hour after a balloon pump was placed during high-risk PCI, and left at 1:2 since the timing check, the patient becomes hypotensive with back pain and a falling haemoglobin. CT shows a retroperitoneal haematoma and the team has stopped heparin. The pump is still needed.",
    start: { ...CORRECT_TIMING },
    events: ["bleeding"],
    ratio: 1,
    expectedMoves: 1,
  },
];

/** Adjustments a timing case is expected to need; each one more costs efficiency points (scoreMcsSession). */
export const IABP_EXPECTED_MOVES = 4;

/** Input events on one control closer together than this are one adjustment (a slider drag fires one per step), ms. */
export const ADJUSTMENT_SETTLE_MS = 400;

/**
 * Counts adjustments, not input events: a slider drag or a run of quick key presses on one control
 * is one adjustment; a pause longer than ADJUSTMENT_SETTLE_MS or a change of control starts the next.
 */
export class MoveCounter {
  private control: string | null = null;
  private last = -Infinity;
  /** An input on `control` at time `now` (ms); true when it starts a new adjustment. */
  input(control: string, now: number): boolean {
    const fresh = control !== this.control || now - this.last > ADJUSTMENT_SETTLE_MS;
    this.control = control;
    this.last = now;
    return fresh;
  }
  /** A discrete control (a button): always one adjustment. */
  press(control: string, now: number): true {
    this.control = control;
    this.last = now;
    return true;
  }
}

export interface ConsoleProps {
  scenarioId: string;
  onScenario: (id: string) => void;
  launchMode: LaunchMode | null;
  runKey: number;
  /** restarts the same case (a new run) */
  onRestart?: () => void;
}

export default function IabpConsole({ scenarioId, onScenario, launchMode, runKey, onRestart }: ConsoleProps) {
  const c = IABP_CASES.find((x) => x.id === scenarioId) ?? IABP_CASES[0];
  const [s, setS] = useState<IabpSettings>({ ...c.start, ratio: 2 });
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [result, setResult] = useState<McsSessionScore | null>(null);
  const [stage, setStage] = useState<McsStage>("manage");
  const h = { systolic: 98, diastolic: 58, hr: 85 };
  const T = 60 / h.hr;
  const errs = timingErrors(s);
  const m = iabpMetrics(s, h);

  const counter = useRef(new MoveCounter());
  useEffect(() => {
    counter.current = new MoveCounter();
  }, [c.id, runKey]);
  /** a slider input; one drag counts as one adjustment */
  const slide = (control: "inflate" | "deflate", v: number) => {
    setS((p) => ({ ...p, [control]: v }));
    if (counter.current.input(control, performance.now())) setMoves((n) => n + 1);
  };
  /** a button press; one adjustment each */
  const press = (patch: Partial<IabpSettings>) => {
    setS((p) => ({ ...p, ...patch }));
    counter.current.press("ratio", performance.now());
    setMoves((n) => n + 1);
  };

  const context = useMemo(() => mcsTipContext("iabp", stage, null, { events: c.events }), [stage, c.events]);
  const state = useCallback(() => ({ stage, settings: s, moves, solved, errors: errs }), [stage, s, moves, solved, errs]);
  const { run, tips, visible } = useMcsSession({ console: "iabp", scenarioId: c.id, caseName: `Balloon pump: ${c.title}`, launchMode, runKey: `${c.id}-${runKey}`, context, state });
  // the teaching aids (the named timing error, the slider position words, the read-out colours and
  // the "late" label on the strip) are shown live in guided practice, otherwise once the case ends
  const reveal = run.mode === "guided" || solved || run.finished;
  const expectedMoves = c.expectedMoves ?? IABP_EXPECTED_MOVES;
  const ratioMet = c.ratio === undefined || s.ratio === c.ratio;
  const complications = useMemo(() => (c.events?.includes("bleeding") ? ["retroperitoneal bleeding"] : []), [c.events]);
  const endCase = () => {
    const sc = scoreMcsSession({ targetsMet: false, harms: 0, criticalErrors: 0, extraMoves: Math.max(0, moves - expectedMoves) });
    setResult(sc);
    run.finish({ score: sc.score, passed: sc.passed, criticalErrors: 0, complications, metrics: { moves, ...sc.criteria }, devices: ["balloon pump"] });
  };

  useEffect(() => {
    if (!solved && errs.length === 0 && m.effective && ratioMet && moves > 0) {
      setSolved(true);
      const sc = scoreMcsSession({ targetsMet: true, harms: 0, criticalErrors: 0, extraMoves: Math.max(0, moves - expectedMoves) });
      setResult(sc);
      run.finish({ score: sc.score, passed: sc.passed, criticalErrors: 0, complications, metrics: { moves, ...sc.criteria }, devices: ["balloon pump"] });
    }
  }, [errs.length, m.effective, ratioMet, moves, solved, run, expectedMoves, complications]);

  const art = (t: number) => {
    const beat = Math.floor(t / T);
    return iabpPressure((t / T) % 1, beat, s, h).p;
  };
  // ECG: a simple PQRST so the trigger relationship is visible
  const ecg = (t: number) => {
    const ph = (t / T) % 1;
    const g = (mu: number, sd: number, a: number) => a * Math.exp(-((ph - mu) ** 2) / (2 * sd * sd));
    return 30 + g(0.92, 0.012, 4) - g(0.985, 0.004, 3) + g(0.995, 0.004, 26) - g(0.006, 0.004, 6) + g(0.3, 0.035, 7);
  };

  return (
    <div className="space-y-4">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()}>
        <StageBar stage={stage} canWean={solved} onWean={() => setStage("wean")} />
        <EndCase finished={run.finished} onEnd={endCase} />
      </LabModeBar>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <ScenarioHeader brief={c.brief} picker={<ScenarioPicker value={c.id} cases={IABP_CASES} onChange={onScenario} />} />
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span>Arterial pressure · assist {s.ratio === 1 ? "1:1" : s.ratio === 2 ? "1:2" : "1:3"}</span>
              <span className="normal-case tracking-normal text-ink-faint">set 1:2 to compare assisted and unassisted beats</span>
            </div>
            <div className="p-2 monitor">
              <LiveTrace
                channels={[
                  { fn: art, color: "#ff5d6c", label: "ART", width: 2.2 },
                  { fn: ecg, color: "#3ef2a4", label: "ECG", width: 1.4 },
                ]}
                min={20}
                max={140}
                height={230}
                seconds={5}
              />
            </div>
          </div>
          <TimingStrip s={s} h={h} reveal={reveal} />
        </div>
        <div className="xl:col-span-4 space-y-4">
          {run.finished && result && <SessionDebrief result={result} harmLabel="Free of harmful episodes" showEfficiency onRestart={onRestart} />}
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
          <div className="panel p-3 space-y-3">
            <div className="stat-label">Console</div>
            <div>
              <div className="flex justify-between text-[12px] text-ink-soft">
                <span>Inflation</span>
                <span className="font-mono">{reveal ? (s.inflate < NOTCH - 0.025 ? "earlier" : s.inflate > NOTCH + 0.04 ? "later" : "at the notch") : `${Math.round(s.inflate * T * 1000)} ms after R`}</span>
              </div>
              <input type="range" min={0.2} max={0.6} step={0.005} value={s.inflate} onChange={(e) => slide("inflate", Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-[12px] text-ink-soft">
                <span>Deflation</span>
                <span className="font-mono">{reveal ? (s.deflate > 1 ? "into systole" : s.deflate < 0.88 ? "mid-diastole" : "end-diastole") : `${Math.round(s.deflate * T * 1000)} ms after R`}</span>
              </div>
              <input type="range" min={0.6} max={1.12} step={0.005} value={s.deflate} onChange={(e) => slide("deflate", Number(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-soft">Assist ratio</span>
              <div className="seg">
                {([1, 2, 3] as const).map((r) => (
                  <button key={r} className={`seg-btn ${s.ratio === r ? "seg-btn-active" : ""}`} onClick={() => press({ ratio: r })}>
                    1:{r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="panel p-3 grid grid-cols-2 gap-2">
            <Readout label="Unassisted systolic" value={f0(m.unassistedSys)} unit="mmHg" />
            <Readout label="Augmented diastolic" value={f0(m.augDiastolic)} unit="mmHg" tone={reveal ? (m.augDiastolic > m.unassistedSys ? "good" : "warn") : undefined} />
            <Readout label="Unassisted EDP" value={f0(m.unassistedEdp)} unit="mmHg" />
            <Readout label="Assisted EDP" value={f0(m.assistedEdp)} unit="mmHg" tone={reveal ? (m.assistedEdp < m.unassistedEdp ? "good" : "danger") : undefined} />
            <Readout label="Assisted systolic" value={f0(m.assistedSys)} unit="mmHg" tone={reveal ? (m.assistedSys < m.unassistedSys ? "good" : "warn") : undefined} />
            {reveal && <Readout label="Counterpulsation" value={m.effective ? "effective" : "poor"} tone={m.effective ? "good" : "danger"} />}
          </div>
          <div className="panel p-3">
            <div className="stat-label mb-1.5">Assessment</div>
            {!reveal ? (
              <div className="text-[13px] text-ink-faint">Read the assisted and unassisted beats on the frozen strip and set the timing.</div>
            ) : errs.length === 0 ? (
              <>
                <div className="text-[13px] text-good">Timing correct: inflation at the dicrotic notch, deflation just before systole.</div>
                {c.ratio !== undefined && (
                  <div className={`text-[13px] mt-1 ${ratioMet ? "text-good" : "text-warn"}`}>
                    {c.ratio === 1 ? "Without anticoagulation, run the balloon at 1:1 to limit thrombus forming on it." : `Run the balloon at 1:${c.ratio}.`}
                  </div>
                )}
              </>
            ) : (
              errs.map((e) => (
                <div key={e} className="mb-2">
                  <div className="text-[13px] text-warn font-semibold">{TIMING_TEACH[e].label}</div>
                  <div className="text-[13px] text-ink-soft">{TIMING_TEACH[e].look}</div>
                  <div className="text-[12px] text-ink-faint">{TIMING_TEACH[e].harm}</div>
                </div>
              ))
            )}
            {solved && <div className="chip border-good/40 text-good mt-1">fixed in {moves} adjustments</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimingStrip({ s, h, reveal }: { s: IabpSettings; h: { systolic: number; diastolic: number; hr: number }; reveal: boolean }) {
  const W = 760,
    H = 170;
  const pts: string[] = [];
  const s2 = { ...s, ratio: 2 as const };
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * 2;
    const beat = Math.floor(t) + 1; // beat 1 unassisted, beat 2 assisted
    const p = iabpPressure(t % 1, beat === 1 ? 1 : 2, s2, h).p;
    pts.push(`${20 + (i / 400) * (W - 40)},${H - 20 - (p - 30) * 1.15}`);
  }
  const x = (ph: number) => 20 + ((1 + ph) / 2) * (W - 40);
  return (
    <div className="panel">
      <div className="panel-head">
        <span>Frozen 1:2 strip for timing</span>
        <span className="normal-case tracking-normal text-ink-faint">first beat unassisted, second assisted</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polyline points={pts.join(" ")} fill="none" stroke="#ff5d6c" strokeWidth={2} />
        <line x1={x(s.inflate)} y1={10} x2={x(s.inflate)} y2={H - 12} stroke="#4F8EF7" strokeDasharray="4 3" />
        <text x={x(s.inflate) + 4} y={20} fontSize={11} fill="#4F8EF7">
          inflate
        </text>
        <line x1={x(Math.min(s.deflate, 1))} y1={10} x2={x(Math.min(s.deflate, 1))} y2={H - 12} stroke="#E9B95A" strokeDasharray="4 3" />
        <text x={x(Math.min(s.deflate, 1)) - 4} y={20} fontSize={11} fill="#E9B95A" textAnchor="end">
          deflate{reveal && s.deflate > 1 ? " (late)" : ""}
        </text>
        <line x1={x(NOTCH)} y1={H - 14} x2={x(NOTCH)} y2={H - 4} stroke="#A6ADB8" />
        <text x={x(NOTCH)} y={H - 2} fontSize={10} fill="#A6ADB8" textAnchor="middle">
          notch
        </text>
      </svg>
    </div>
  );
}
