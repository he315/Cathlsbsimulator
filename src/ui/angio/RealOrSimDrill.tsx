// "Real or simulated?": a blinded two-choice drill. Each trial plays a real CoronaryDominance run and a
// simulated run filmed at the same C-arm angles, side by side in random order, and the reader picks the
// real one. Simulated clips live in datasets/library/sim-clips/<id>/ (index.json) and were encoded exactly
// like the library (cropped to the field, 512 px, JPEG quality 72 by sips, same frame count and frame rate;
// scripts/realism/make_clip.py), so compression cannot give the answer away.
// Results stay in this browser (localStorage) and can be exported as JSON for pooling across readers.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { angleName, loadLibrary, standardView, type LibRun } from "./library";

interface SimClip {
  id: string;
  realRun: string;
  artery: "LCA" | "RCA";
  angles: { primary: number; secondary: number };
  family: string | null;
  fps: number;
  frames: string[];
}

interface SimIndex {
  clips: SimClip[];
  pipeline?: string;
}

interface Pair {
  clip: SimClip;
  real: LibRun;
  base: string;
  /** frames both clips play */
  n: number;
  view: string;
}

interface Trial {
  t: string;
  reader: string;
  clip: string;
  realRun: string;
  artery: string;
  view: string;
  realSide: "left" | "right";
  choice: "left" | "right";
  correct: boolean;
  rtMs: number;
}

const LOG_KEY = "cathmaster.realOrSim.v1";
const READER_KEY = "cathmaster.realOrSim.reader";

function readLog(): Trial[] {
  try {
    const s = localStorage.getItem(LOG_KEY);
    const v = s ? (JSON.parse(s) as Trial[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeLog(v: Trial[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: the session still works, results are not kept */
  }
}

function readReader(): string {
  try {
    return localStorage.getItem(READER_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Wilson score interval for a proportion (95%). */
export function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 1];
  const z = 1.959964;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

export interface DrillStats {
  n: number;
  correct: number;
  accuracy: number;
  ci: [number, number];
  meanRtMs: number;
  byView: { view: string; n: number; correct: number; accuracy: number; ci: [number, number] }[];
}

export function drillStats(log: Trial[]): DrillStats {
  const n = log.length;
  const correct = log.filter((t) => t.correct).length;
  const views = [...new Set(log.map((t) => t.view))].sort();
  return {
    n,
    correct,
    accuracy: n ? correct / n : 0,
    ci: wilson(correct, n),
    meanRtMs: n ? log.reduce((a, t) => a + t.rtMs, 0) / n : 0,
    byView: views.map((v) => {
      const sub = log.filter((t) => t.view === v);
      const c = sub.filter((t) => t.correct).length;
      return { view: v, n: sub.length, correct: c, accuracy: sub.length ? c / sub.length : 0, ci: wilson(c, sub.length) };
    }),
  };
}

const randInt = (n: number) => {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  } catch {
    return Math.floor(Math.random() * n);
  }
};

export default function RealOrSimDrill() {
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [excluded, setExcluded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Trial[]>(readLog);
  const [reader, setReader] = useState(readReader);
  const [trial, setTrial] = useState<{ pair: Pair; realSide: "left" | "right"; seq: number } | null>(null);
  const trialSeq = useRef(0);
  const [answer, setAnswer] = useState<"left" | "right" | null>(null);
  const [ready, setReady] = useState(false);
  const shownAt = useRef(0);
  // the trial whose frames are on screen: the reaction-time origin is set once per trial
  const shownFor = useRef<string | null>(null);
  const used = useRef<Set<string>>(new Set());

  // load the library and the simulated clips, and pair them
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [lib, simRes] = await Promise.all([loadLibrary(), fetch("/angio-library/sim-clips/index.json", { cache: "no-store" })]);
        if (!simRes.ok) throw new Error("no simulated clips");
        const sim = (await simRes.json()) as SimIndex;
        const runs = new Map<string, LibRun>();
        for (const d of lib) if (d.dataset === "CoronaryDominance") for (const p of d.patients) for (const r of p.runs) runs.set(r.id, r);
        const out: Pair[] = [];
        let bad = 0;
        for (const c of sim.clips ?? []) {
          const real = runs.get(c.realRun);
          // a pair is used only when the angles agree within 1 degree and the rates match
          if (!real || !real.angles || Math.abs(real.angles.primary - c.angles.primary) > 1 || Math.abs(real.angles.secondary - c.angles.secondary) > 1 || real.fps !== c.fps) {
            bad++;
            continue;
          }
          const n = Math.min(real.frames.length, c.frames.length);
          out.push({ clip: c, real, base: `/angio-library/sim-clips/${c.id}/`, n, view: `${c.artery} ${standardView(c.angles) ?? "other"}` });
        }
        if (alive) {
          setPairs(out);
          setExcluded(bad);
        }
      } catch (e) {
        if (alive) {
          setPairs([]);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const next = useCallback(() => {
    if (!pairs || !pairs.length) return;
    let pool = pairs.filter((p) => !used.current.has(p.clip.id));
    if (!pool.length) {
      used.current.clear();
      pool = pairs;
    }
    const pair = pool[randInt(pool.length)];
    used.current.add(pair.clip.id);
    shownFor.current = null;
    setTrial({ pair, realSide: randInt(2) === 0 ? "left" : "right", seq: (trialSeq.current += 1) });
    setAnswer(null);
    setReady(false);
  }, [pairs]);

  useEffect(() => {
    if (pairs && pairs.length && !trial) next();
  }, [pairs, trial, next]);

  const choose = useCallback(
    (side: "left" | "right") => {
      if (!trial || answer || !ready) return;
      const t: Trial = {
        t: new Date().toISOString(),
        reader: reader.trim() || "unnamed",
        clip: trial.pair.clip.id,
        realRun: trial.pair.real.id,
        artery: trial.pair.clip.artery,
        view: trial.pair.view,
        realSide: trial.realSide,
        choice: side,
        correct: side === trial.realSide,
        rtMs: Math.round(performance.now() - shownAt.current),
      };
      setAnswer(side);
      setLog((l) => {
        const v = [...l, t];
        writeLog(v);
        return v;
      });
    },
    [trial, answer, ready, reader]
  );

  // keyboard: 1 / left arrow = left, 2 / right arrow = right, N or Enter = next pair
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "1" || e.key === "ArrowLeft") choose("left");
      else if (e.key === "2" || e.key === "ArrowRight") choose("right");
      else if ((e.key === "n" || e.key === "Enter") && answer) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, next, answer]);

  const stats = useMemo(() => drillStats(log), [log]);

  // the two clips of the current trial, built once per trial so parent re-renders (typing in the reader
  // field, answering) do not reload the frames, restart playback or move the reaction-time origin
  const shown = useMemo(() => {
    if (!trial) return null;
    const real = { base: trial.pair.real.base, frames: trial.pair.real.frames };
    const sim = { base: trial.pair.base, frames: trial.pair.clip.frames };
    return trial.realSide === "left" ? { left: real, right: sim } : { left: sim, right: real };
  }, [trial]);

  const onReady = useCallback(() => {
    if (!trial) return;
    const id = `${trial.seq}`;
    if (shownFor.current === id) return;
    shownFor.current = id;
    shownAt.current = performance.now();
    setReady(true);
  }, [trial]);

  const exportLog = () => {
    const blob = new Blob([JSON.stringify({ drill: "real-or-simulated", exported: new Date().toISOString(), stats, trials: log }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `real-or-simulated-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const clearLog = () => {
    if (!window.confirm("Delete every trial stored in this browser?")) return;
    setLog([]);
    writeLog([]);
  };

  if (pairs === null) return <div className="panel p-4 text-[13px] text-ink-soft">Loading the real and simulated runs…</div>;
  if (!pairs.length)
    return (
      <div className="notice notice-info">
        <div>
          No simulated clips are available{error ? ` (${error})` : ""}. They are built locally: capture the drill set in a development build
          (window.__xrayCapture.drill()) after <span className="font-mono">python3 scripts/realism/make_clip.py plan</span>, then run{" "}
          <span className="font-mono">python3 scripts/realism/make_clip.py build drill</span>.
        </div>
      </div>
    );


  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-8 space-y-3">
        <div className="panel">
          <div className="panel-head">
            <span>Which run is real?</span>
            {trial && <span className="chip">{angleName(trial.pair.clip.angles)} · {trial.pair.clip.artery}</span>}
          </div>
          <div className="p-3">
            {trial && shown && (
              <DualPlayer
                key={trial.seq}
                left={shown.left}
                right={shown.right}
                n={trial.pair.n}
                fps={trial.pair.clip.fps}
                onReady={onReady}
                reveal={answer ? trial.realSide : null}
              />
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button className="btn btn-accent" disabled={!ready || !!answer} onClick={() => choose("left")}>
                Left is real <kbd className="kbd ml-1">1</kbd>
              </button>
              <button className="btn btn-accent" disabled={!ready || !!answer} onClick={() => choose("right")}>
                Right is real <kbd className="kbd ml-1">2</kbd>
              </button>
              {answer && (
                <button className="btn" onClick={next}>
                  Next pair <kbd className="kbd ml-1">N</kbd>
                </button>
              )}
              {!ready && <span className="text-[12px] text-ink-faint">Loading frames…</span>}
            </div>
            {answer && trial && (
              <div className={`notice mt-3 ${answer === trial.realSide ? "notice-good" : "notice-warn"}`}>
                <div>
                  {answer === trial.realSide ? "Correct." : "Not this time."} The real run was on the {trial.realSide}: CoronaryDominance run {trial.pair.real.id} (CC0),{" "}
                  {angleName(trial.pair.real.angles)}. The simulated run was filmed at the same angles and passed through the same 512 px, JPEG quality 72 encoding.
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[12px] text-ink-faint leading-relaxed">
          Both clips play the same number of frames at the acquisition rate (15 frames/s). Nothing on screen identifies the source before you answer. A result near 50% means the
          simulation cannot be told apart from real cine by this reader; a fair test needs several experienced readers who did not build the simulator, each reading every pair once.
        </p>
      </div>

      <div className="xl:col-span-4 space-y-3">
        <div className="panel p-3 space-y-2 text-[13px]">
          <label className="stat-label block" htmlFor="ros-reader">
            Reader
          </label>
          <input
            id="ros-reader"
            className="field w-full"
            placeholder="initials or study code"
            value={reader}
            onChange={(e) => {
              setReader(e.target.value);
              try {
                localStorage.setItem(READER_KEY, e.target.value);
              } catch {
                /* not kept */
              }
            }}
          />
          <div className="text-[12px] text-ink-faint">
            {pairs.length} pairs{excluded ? ` (${excluded} clips skipped: angles, frame rate or real run did not match)` : ""}.
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>Results in this browser</span>
            <span className="text-[12px] text-ink-faint font-normal">{stats.n} trials</span>
          </div>
          <div className="p-3 space-y-3 text-[13px]">
            <div className="flex items-end gap-4">
              <div className="stat">
                <span className="stat-label">Correct</span>
                <span className="metric text-2xl text-ink">{stats.n ? `${Math.round(stats.accuracy * 100)}%` : "–"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">95% CI</span>
                <span className="stat-value">{stats.n ? `${Math.round(stats.ci[0] * 100)}–${Math.round(stats.ci[1] * 100)}%` : "–"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Mean time</span>
                <span className="stat-value">{stats.n ? `${(stats.meanRtMs / 1000).toFixed(1)} s` : "–"}</span>
              </div>
            </div>
            {stats.n > 0 && (
              <div className={`notice ${stats.ci[0] <= 0.5 && stats.ci[1] >= 0.5 ? "notice-good" : "notice-info"}`}>
                <div>{stats.ci[0] <= 0.5 && stats.ci[1] >= 0.5 ? "The interval includes 50%: no evidence that real and simulated runs can be told apart." : stats.ci[0] > 0.5 ? "Above chance: the simulated runs can still be recognised." : "Below chance: the simulated runs are being taken for real."}</div>
              </div>
            )}
            {stats.byView.length > 0 && (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-ink-faint text-left">
                    <th className="font-normal py-1">View</th>
                    <th className="font-normal">Trials</th>
                    <th className="font-normal">Correct</th>
                    <th className="font-normal">95% CI</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byView.map((v) => (
                    <tr key={v.view} className="border-t border-line text-ink-soft">
                      <td className="py-1">{v.view}</td>
                      <td className="font-mono">{v.n}</td>
                      <td className="font-mono">{Math.round(v.accuracy * 100)}%</td>
                      <td className="font-mono">
                        {Math.round(v.ci[0] * 100)}–{Math.round(v.ci[1] * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex gap-2">
              <button className="btn" onClick={exportLog} disabled={!stats.n}>
                Export JSON
              </button>
              <button className="btn btn-ghost" onClick={clearLog} disabled={!stats.n}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Two clips on one clock: same frame index, same size, same display path. */
function DualPlayer({
  left,
  right,
  n,
  fps,
  onReady,
  reveal,
}: {
  left: { base: string; frames: string[] };
  right: { base: string; frames: string[] };
  n: number;
  fps: number;
  onReady: () => void;
  reveal: "left" | "right" | null;
}) {
  const cl = useRef<HTMLCanvasElement>(null);
  const cr = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<{ l: HTMLImageElement[]; r: HTMLImageElement[] }>({ l: [], r: [] });
  const [loaded, setLoaded] = useState(0);
  const total = 2 * n;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  // the load effect depends on primitive keys only, so a new props object with the same clips does not
  // reload the frames (the parent also keys this component per trial)
  const srcRef = useRef({ left, right });
  srcRef.current = { left, right };
  const leftKey = `${left.base}|${left.frames.slice(0, n).join(",")}`;
  const rightKey = `${right.base}|${right.frames.slice(0, n).join(",")}`;
  useEffect(() => {
    let alive = true;
    setLoaded(0);
    const load = (src: { base: string; frames: string[] }) =>
      src.frames.slice(0, n).map((f) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = im.onerror = () => alive && setLoaded((k) => k + 1);
        im.src = src.base + f;
        return im;
      });
    imgs.current = { l: load(srcRef.current.left), r: load(srcRef.current.right) };
    return () => {
      alive = false;
    };
  }, [leftKey, rightKey, n]);

  const done = loaded >= total;
  useEffect(() => {
    if (done) readyRef.current();
  }, [done, leftKey, rightKey]);

  useEffect(() => {
    if (!done) return;
    let raf = 0;
    const t0 = performance.now();
    const draw = (cv: HTMLCanvasElement | null, im: HTMLImageElement | undefined) => {
      if (!cv || !im || !im.naturalWidth) return;
      const g = cv.getContext("2d");
      if (!g) return;
      g.imageSmoothingEnabled = true;
      g.drawImage(im, 0, 0, cv.width, cv.height);
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const k = Math.floor(((now - t0) / 1000) * fps) % n;
      draw(cl.current, imgs.current.l[k]);
      draw(cr.current, imgs.current.r[k]);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done, fps, n]);

  const frame = (side: "left" | "right", ref: RefObject<HTMLCanvasElement>) => (
    <div className={`relative bg-black rounded-md overflow-hidden border ${reveal === side ? "border-good" : "border-line"}`}>
      <canvas ref={ref} width={512} height={512} className="w-full h-auto block aspect-square" />
      {reveal && <div className={`absolute top-2 left-2 chip bg-base-900 ${reveal === side ? "text-good" : "text-ink-soft"}`}>{reveal === side ? "Real" : "Simulated"}</div>}
      {!done && <div className="absolute inset-0 grid place-items-center text-[12px] text-ink-faint">{Math.round((100 * loaded) / Math.max(1, total))}%</div>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {frame("left", cl)}
      {frame("right", cr)}
    </div>
  );
}
