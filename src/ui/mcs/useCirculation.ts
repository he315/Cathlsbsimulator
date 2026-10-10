// Runs the lumped circulation model in real time and buffers traces for display.
//
// CirculationRunner holds the model, the trace ring buffers and the clock, without React, so a
// console and a test step it the same way. useCirculation drives a runner from animation frames
// and also gives the console step(seconds), which advances the model by hand: window.__lab.mcs
// uses it while the browser pane is hidden (animation frames pause there). A caller may inject
// its own circulation or engine (anything with the Circulation interface below, for example the
// shared patient engine of the shock chain): the runner then uses that object as it is, with its
// own clock and its own patient state, and neither clones nor settles it; the console's settings
// reach it as devices only, never as a patient (that would overwrite the engine's own patient).
import { useCallback, useEffect, useRef, useState } from "react";
import { Circulation, impellaPosition, type BeatStats, type Devices, type Patient, type SimState, type StepInfo } from "../../simulation/circulation";

const N = 4096; // ring buffer length (≈16 s at 250 Hz)
const MASK = N - 1;
const DTS = 0.004;
/** Model time run before a fresh model is shown, s (the model settles from its initial volumes). */
export const SETTLE_S = 20;
/** The longest real-time frame the loop advances in one go, s (a stalled tab does not jump). */
const MAX_FRAME_S = 0.05;

export interface Traces {
  art: Float32Array; // right radial / aortic root pressure
  lv: Float32Array;
  pa: Float32Array;
  placement: Float32Array; // microaxial pump placement signal
  motor: Float32Array; // microaxial pump motor current proxy
  ecmoFlow: Float32Array;
}

/** What the runner needs of a circulation: the model's own Circulation, or an injected engine with the same interface. */
export interface CirculationLike {
  patient: Patient;
  devices: Devices;
  s: Pick<SimState, "t">;
  run(seconds: number, sample?: (t: number, info: StepInfo, s: SimState) => void): void;
  average(k?: number): BeatStats | null;
}

export interface CirculationOptions {
  /** an injected circulation or engine, used as it is (no clone, no settling, its own clock, its own patient; the runner writes devices only) */
  engine?: CirculationLike | null;
  /** model time to settle a fresh model, s (default SETTLE_S) */
  settleS?: number;
}

function newTraces(): Traces {
  return { art: new Float32Array(N), lv: new Float32Array(N), pa: new Float32Array(N), placement: new Float32Array(N), motor: new Float32Array(N), ecmoFlow: new Float32Array(N) };
}

/** A circulation with its traces and clock, stepped by frames or by hand. */
export class CirculationRunner {
  sim: CirculationLike | null = null;
  readonly traces: Traces = newTraces();
  /** model time at the last step, s */
  clock = 0;
  /** model time when the current run started (0 for a fresh model; an injected engine's time when it was taken) */
  private t0 = 0;
  /** the model is an injected engine: its patient is its own, the runner writes devices only */
  private injected = false;

  /** Start a run: a fresh, settled model of this patient and devices, or the injected engine. */
  reset(patient: Patient, devices: Devices, opts: CirculationOptions = {}): void {
    this.injected = !!opts.engine;
    if (opts.engine) {
      this.sim = opts.engine;
      this.sim.devices = structuredClone(devices);
    } else {
      const c = new Circulation(structuredClone(patient), structuredClone(devices));
      c.run(opts.settleS ?? SETTLE_S);
      c.s.t = 0;
      this.sim = c;
    }
    this.t0 = this.sim.s.t;
    this.clock = this.sim.s.t;
  }

  /** Live parameter changes without resetting the model's state (devices only for an injected engine). */
  setParams(patient: Patient, devices: Devices): void {
    if (!this.sim) return;
    if (!this.injected) this.sim.patient = structuredClone(patient);
    this.sim.devices = structuredClone(devices);
  }

  /** Advance the model by `seconds` of model time, sampling the traces at 250 Hz. */
  advance(seconds: number): void {
    const c = this.sim;
    if (!c || !(seconds > 0)) return;
    const T = this.traces;
    c.run(seconds, (t, info) => {
      const i = Math.floor(t / DTS) & MASK;
      T.art[i] = info.P.root;
      T.lv[i] = info.P.lv;
      T.pa[i] = info.P.pa;
      const imp = c.devices.impella;
      if (imp?.on) {
        const pos = impellaPosition(imp.depth);
        T.placement[i] = pos === "ventricle" ? info.P.lv : info.P.root;
        const dp = pos === "correct" || pos === "shallow" || pos === "deep" ? info.P.root - info.P.lv : 0;
        T.motor[i] = imp.pLevel * 60 + dp * 3;
      } else {
        T.placement[i] = 0;
        T.motor[i] = 0;
      }
      T.ecmoFlow[i] = info.F.ecmo * 0.06;
    });
    this.clock = c.s.t;
  }

  /** Mean of the last three beats (null before the first beat). */
  stats(): BeatStats | null {
    return this.sim?.average(3) ?? null;
  }

  /** Model time since the run started, s. */
  elapsed(): number {
    return this.clock - this.t0;
  }

  read(buf: keyof Traces): (t: number) => number {
    return (t: number) => this.traces[buf][Math.floor(t / DTS) & MASK];
  }
}

export interface UseCirculation {
  sim: { readonly current: CirculationLike | null };
  stats: BeatStats | null;
  /** model time since the run started, s */
  elapsed: number;
  clock: () => number;
  read: (buf: keyof Traces) => (t: number) => number;
  /** advance the model by hand (window.__lab.mcs.step), s of model time */
  step: (seconds: number, dt?: number) => void;
  runner: CirculationRunner;
}

export function useCirculation(patient: Patient, devices: Devices, resetKey: string, opts: CirculationOptions = {}): UseCirculation {
  const runnerRef = useRef<CirculationRunner | null>(null);
  if (!runnerRef.current) runnerRef.current = new CirculationRunner();
  const runner = runnerRef.current;
  const [stats, setStats] = useState<BeatStats | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const publish = useCallback(() => {
    setStats(runner.stats());
    setElapsed(runner.elapsed());
  }, [runner]);

  // (re)create on reset (or take the injected engine), settle before showing
  useEffect(() => {
    runner.reset(patient, devices, optsRef.current);
    publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, opts.engine]);

  // live parameter changes without resetting the state
  useEffect(() => {
    runner.setParams(patient, devices);
  }, [runner, patient, devices]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!runner.sim) return;
      const dt = Math.min(MAX_FRAME_S, (now - last) / 1000);
      last = now;
      runner.advance(dt);
      if (now - lastUi > 400) {
        lastUi = now;
        publish();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [runner, publish]);

  const step = useCallback(
    (seconds: number, dt = MAX_FRAME_S) => {
      if (!(seconds > 0)) return;
      const h = Math.max(1e-3, dt);
      for (let left = seconds; left > 1e-9; left -= h) runner.advance(Math.min(h, left));
      publish();
    },
    [runner, publish]
  );

  const sim = {
    get current() {
      return runner.sim;
    },
  };
  return { sim, stats, elapsed, clock: () => runner.clock, read: (buf) => runner.read(buf), step, runner };
}
