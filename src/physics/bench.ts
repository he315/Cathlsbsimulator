// ---------------------------------------------------------------------------
// Device-physics bench: measures what the worker spends per rendered frame on
// this machine for typical loads (catheter in the root; catheter plus a wire
// leading through the arch) and chooses a configuration that keeps it within
// its budget (default 2 ms per 66.7 ms frame, i.e. 15 frames/s).
//
//   PHYSICS_BENCH=frames HOGS=n npx vite-node src/physics/bench.ts   full-frame bench under load
//   PHYSICS_BENCH=1 npx vite-node src/physics/bench.ts               solver-only report (wave 1)
//
// The worker (host.ts) calls autoConfig() at init when the scene asks for
// config "auto", with a factory that builds the scene's own geometry. autoConfig
// measures each validated configuration in turn (finest first) and keeps the
// first whose measured cost is within AUTO_MARGIN of the budget; nothing is
// extrapolated. Only configurations in VALIDATED_CONFIGS are returned: the
// solver settings at which the scripted manoeuvres were shown to keep their
// outcomes (robustness.ts; table in docs/realism/wave1/S7.md). If none fits,
// the cheapest measured one is returned and flagged over budget.
// ---------------------------------------------------------------------------

import type { EngineConfig, PhysicsEngine } from "./engine";
import * as S from "./scenarios";

export interface BenchCase {
  name: string;
  bodies: number;
  substeps: number;
  msPerSubstep: number;
  /** solver time per rendered frame at the configured substep rate and frame rate (ms) */
  msPerFrame: number;
}

export interface BenchReport {
  substepHz: number;
  segmentScale: number;
  fps: number;
  cases: BenchCase[];
}

/**
 * Solver settings validated by the robustness matrix (same outcomes for every required manoeuvre on
 * the frozen and the live geometry), finest first. 2 iterations, trust region "rod".
 */
export const VALIDATED_CONFIGS: ReadonlyArray<Pick<EngineConfig, "substepHz" | "segmentScale">> = [
  { substepHz: 120, segmentScale: 1.0 },
  { substepHz: 120, segmentScale: 1.2 },
  { substepHz: 120, segmentScale: 1.4 },
];

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function timeCase(
  name: string,
  setup: () => ReturnType<typeof S.makeEngine>,
  drive: (eng: ReturnType<typeof S.makeEngine>, i: number) => void,
  bodies: (eng: ReturnType<typeof S.makeEngine>) => number,
  substepHz: number,
  fps: number,
  seconds: number,
  repeats: number
): BenchCase {
  const per: number[] = [];
  let nb = 0, subs = 0;
  for (let r = 0; r < repeats; r++) {
    const eng = setup();
    // warm-up (JIT) before timing
    for (let i = 0; i < 5; i++) drive(eng, i);
    const steps0 = eng.steps;
    const t0 = now();
    const n = Math.round(seconds / 0.1);
    for (let i = 0; i < n; i++) drive(eng, i);
    const ms = now() - t0;
    subs = eng.steps - steps0;
    per.push(ms / subs);
    nb = bodies(eng);
  }
  per.sort((a, b) => a - b);
  const med = per[Math.floor(per.length / 2)];
  return { name, bodies: nb, substeps: subs, msPerSubstep: med, msPerFrame: med * (substepHz / fps) };
}

/** Time the solver on the standard loads (median of `repeats` runs of `seconds` patient time each). */
export function runBench(cfg: Partial<EngineConfig> = {}, fps = 15, seconds = 2, repeats = 3): BenchReport {
  const substepHz = cfg.substepHz ?? 120;
  const cases: BenchCase[] = [];
  // 1. a JL4 in the root, being turned and advanced
  cases.push(
    timeCase(
      "catheter in the root",
      () => {
        const eng = S.makeEngine("femoral", "normal", cfg);
        eng.loadCatheter("JL4", { tipS: eng.lumens.routeLength - 60, facing: S.LAO_LEFT });
        eng.step(0.3);
        return eng;
      },
      (eng, i) => {
        eng.command({ kind: "torque", device: "catheter", rad: 0.05 });
        eng.command({ kind: "push", device: "catheter", mm: i % 2 ? 1 : -1 });
        eng.step(0.1);
      },
      (eng) => eng.catheter!.rod.n,
      substepHz, fps, seconds, repeats
    )
  );
  // 2. a JR4 over a J wire leading 60 mm, advanced through the arch
  cases.push(
    timeCase(
      "catheter and wire through the arch",
      () => {
        const eng = S.makeEngine("femoral", "normal", cfg);
        eng.loadCatheter("JR4", { tipS: eng.lumens.routeLength - 160, facing: S.LAO_LEFT });
        eng.loadWire("J", { advance: 60 });
        eng.step(0.3);
        return eng;
      },
      (eng) => {
        eng.command({ kind: "push", device: "catheter", mm: 2 });
        eng.step(0.1);
      },
      (eng) => eng.catheter!.rod.n + (eng.wire ? eng.wire.rod.n - eng.wire.start : 0),
      substepHz, fps, seconds, repeats
    )
  );
  return { substepHz, segmentScale: cfg.segmentScale ?? 1, fps, cases };
}

export interface ConfigChoice extends Pick<EngineConfig, "substepHz" | "segmentScale"> {
  /** predicted worst-case solver time per frame (ms) at this configuration */
  predictedMs: number;
  /** no validated configuration fits the budget on this machine */
  overBudget: boolean;
}

/**
 * Wave-1 choice by extrapolation, kept for offline use: the finest validated configuration whose
 * predicted worst-case cost is at most margin x budget, from a report measured at one configuration,
 * assuming cost scales with 1/segmentScale and with the substep rate. That assumption over-predicts
 * the saving of a coarser configuration (measured: scale 1.2 at 2.04 ms where 1.94 ms was predicted),
 * so autoConfig no longer uses it; it measures every configuration it considers (chooseMeasured).
 */
export function chooseConfig(report: BenchReport, budgetMs = 2, margin = 1): ConfigChoice {
  const worst = Math.max(...report.cases.map((c) => c.msPerFrame));
  const predict = (c: Pick<EngineConfig, "substepHz" | "segmentScale">) =>
    worst * (report.segmentScale / c.segmentScale) * (c.substepHz / report.substepHz);
  for (const c of VALIDATED_CONFIGS) {
    const p = predict(c);
    if (p <= margin * budgetMs) return { ...c, predictedMs: p, overBudget: false };
  }
  const last = VALIDATED_CONFIGS[VALIDATED_CONFIGS.length - 1];
  return { ...last, predictedMs: predict(last), overBudget: true };
}

/**
 * Full-frame cost: what the worker spends per rendered frame, not only in the solver. Each frame
 * steps the engine to the next 1/fps of patient time and reads everything a frame carries (catheter
 * and wire read-outs with their node and contact-force arrays, wind-up, and the classifier), as
 * PhysicsHost.step does. Returns per-case median and 95th centile over the timed frames.
 */
export interface FrameCase {
  name: string;
  bodies: number;
  frames: number;
  medianMs: number;
  p95Ms: number;
  /** process CPU time per frame (ms, mean over the timed frames; Node only, else NaN) */
  cpuMs: number;
}

function cpuNow(): number {
  const p = (globalThis as { process?: { cpuUsage?: () => { user: number; system: number } } }).process;
  if (!p?.cpuUsage) return NaN;
  const u = p.cpuUsage();
  return (u.user + u.system) / 1000;
}

/** Builds an engine for the bench at a solver configuration (the scene the worker will run). */
export type EngineFactory = (cfg: Partial<EngineConfig>) => PhysicsEngine;

/**
 * The app's geometry: the live anatomy (anatomy.ts / thorax.ts) with the arch branches, femoral route,
 * normal root. More contact work than the frozen fixture, so the bench does not under-estimate the app.
 */
export const liveArchEngine: EngineFactory = (cfg) => {
  const prev = S.scenarioDefaults.archBranches;
  S.scenarioDefaults.archBranches = true;
  try {
    return S.makeEngine("femoral", "normal", cfg, [], true);
  } finally {
    S.scenarioDefaults.archBranches = prev;
  }
};

/** The frozen regression fixture (fixtures.ts), for comparison with the wave-1 figures. */
export const fixtureEngine: EngineFactory = (cfg) => S.makeEngine("femoral", "normal", cfg, [], false);

interface FrameLoad {
  name: string;
  setup: (make: EngineFactory, cfg: Partial<EngineConfig>) => PhysicsEngine;
  drive: (eng: PhysicsEngine, i: number) => void;
}

/** The two standard loads: a JL4 being turned and moved to and fro in the root; a JR4 over a J wire advanced through the arch. */
const FRAME_LOADS: FrameLoad[] = [
  {
    name: "catheter in the root",
    setup: (make, cfg) => {
      const eng = make(cfg);
      eng.loadCatheter("JL4", { tipS: eng.lumens.routeLength - 60, facing: S.LAO_LEFT });
      eng.step(0.3);
      return eng;
    },
    drive: (eng, i) => {
      eng.command({ kind: "torque", device: "catheter", rad: 0.03 });
      eng.command({ kind: "push", device: "catheter", mm: i % 4 < 2 ? 0.7 : -0.7 });
    },
  },
  {
    name: "catheter and wire through the arch",
    setup: (make, cfg) => {
      const eng = make(cfg);
      eng.loadCatheter("JR4", { tipS: eng.lumens.routeLength - 160, facing: S.LAO_LEFT });
      eng.loadWire("J", { advance: 60 });
      eng.step(0.3);
      return eng;
    },
    drive: (eng) => {
      eng.command({ kind: "push", device: "catheter", mm: 1.3 });
    },
  },
];

export function frameBench(cfg: Partial<EngineConfig> = {}, fps = 15, seconds = 2, make: EngineFactory = liveArchEngine): FrameCase[] {
  const out: FrameCase[] = [];
  for (const c of FRAME_LOADS) {
    const eng = c.setup(make, cfg);
    const frame = () => {
      eng.step(1 / fps);
      eng.readDevice(eng.catheter!);
      eng.readWire();
      eng.classify();
    };
    for (let i = 0; i < 8; i++) {
      c.drive(eng, i);
      frame();
    }
    const ms: number[] = [];
    const n = Math.max(1, Math.round(seconds * fps));
    const c0 = cpuNow();
    for (let i = 0; i < n; i++) {
      c.drive(eng, i);
      const t0 = now();
      frame();
      ms.push(now() - t0);
    }
    const cpuMs = (cpuNow() - c0) / n;
    ms.sort((a, b) => a - b);
    out.push({
      cpuMs,
      name: c.name,
      bodies: eng.catheter!.rod.n + (eng.wire ? eng.wire.rod.n - eng.wire.start : 0),
      frames: n,
      medianMs: ms[Math.floor(n / 2)],
      p95Ms: ms[Math.min(n - 1, Math.floor(0.95 * n))],
    });
  }
  return out;
}

/**
 * Fraction of the budget a configuration's measured cost may use when "auto" chooses it (model
 * parameter). The init measurement is short and the load on a laptop changes; with no margin, a
 * configuration measured just under the budget at init ran 2-7% over it in the longer bench
 * (docs/realism/wave2/I3.md, budget section).
 */
export const AUTO_MARGIN = 0.85;

export interface MeasuredConfig extends Pick<EngineConfig, "substepHz" | "segmentScale"> {
  /** measured worst-case full-frame cost (ms per 1/fps frame): the larger of the loads' medians */
  worstMs: number;
}

/**
 * Choose from measured costs: the finest validated configuration whose measured worst-case cost is at
 * most margin x budget. If none is, the cheapest measured one, flagged over budget when its cost
 * exceeds the budget itself. Configurations not in VALIDATED_CONFIGS are ignored.
 */
export function chooseMeasured(measured: MeasuredConfig[], budgetMs = 2, margin = AUTO_MARGIN): ConfigChoice {
  const valid = VALIDATED_CONFIGS.map((v) => measured.find((m) => m.segmentScale === v.segmentScale && m.substepHz === v.substepHz)).filter(
    (m): m is MeasuredConfig => !!m && Number.isFinite(m.worstMs)
  );
  if (!valid.length) throw new Error("bench: no validated configuration was measured");
  for (const m of valid) {
    if (m.worstMs <= margin * budgetMs) return { substepHz: m.substepHz, segmentScale: m.segmentScale, predictedMs: m.worstMs, overBudget: false };
  }
  const cheapest = valid.reduce((a, b) => (b.worstMs < a.worstMs ? b : a));
  return { substepHz: cheapest.substepHz, segmentScale: cheapest.segmentScale, predictedMs: cheapest.worstMs, overBudget: cheapest.worstMs > budgetMs };
}

/** Worst-case full-frame cost of one configuration: the larger load median, each the median of `repeats` short runs. */
export function measureConfig(cfg: Pick<EngineConfig, "substepHz" | "segmentScale">, fps = 15, seconds = 0.8, repeats = 3, make: EngineFactory = liveArchEngine): MeasuredConfig {
  const reps: number[][] = [];
  for (let r = 0; r < repeats; r++) reps.push(frameBench(cfg, fps, seconds, make).map((c) => c.medianMs));
  const med = reps[0].map((_, k) => reps.map((x) => x[k]).sort((a, b) => a - b)[Math.floor(repeats / 2)]);
  return { ...cfg, worstMs: Math.max(...med) };
}

/**
 * "auto" at worker init: measure the full-frame cost (frameBench: solver plus read-outs and classifier)
 * of each validated configuration, finest first, on the scene's own geometry (`make`; by default the
 * live anatomy with the arch branches), and stop at the first whose worst-case median over three short
 * repeats is within AUTO_MARGIN of the budget. Nothing is extrapolated from one configuration to
 * another. `measured` lists every configuration timed.
 */
export function autoConfig(budgetMs = 2, fps = 15, make: EngineFactory = liveArchEngine, margin = AUTO_MARGIN): ConfigChoice & { measured: MeasuredConfig[]; initMs: number } {
  const t0 = now();
  const measured: MeasuredConfig[] = [];
  for (const c of VALIDATED_CONFIGS) {
    const m = measureConfig(c, fps, 0.8, 3, make);
    measured.push(m);
    if (m.worstMs <= margin * budgetMs) break;
  }
  return { ...chooseMeasured(measured, budgetMs, margin), measured, initMs: now() - t0 };
}

/**
 * Background load for the bench CLI: busy-looping child processes standing in for a loaded laptop
 * (other tabs, the renderer, other programs). Node only.
 */
async function withLoad<T>(hogs: number, f: () => T): Promise<T> {
  if (hogs <= 0) return f();
  const cpName = "node:child_process";
  const cp = (await import(/* @vite-ignore */ cpName)) as { spawn(cmd: string, args: string[], o: { stdio: string }): { kill(): void } };
  const kids = Array.from({ length: hogs }, () => cp.spawn(process_execPath(), ["-e", "for(;;){}"], { stdio: "ignore" }));
  try {
    return f();
  } finally {
    for (const k of kids) k.kill();
  }
}

function process_execPath(): string {
  return (globalThis as { process?: { execPath?: string } }).process?.execPath ?? "node";
}

export function formatReport(r: BenchReport): string {
  const lines = [`substep ${r.substepHz} Hz, segment scale ${r.segmentScale}, ${r.fps} frames/s`];
  for (const c of r.cases) {
    lines.push(`  ${c.name}: ${c.bodies} bodies, ${c.msPerSubstep.toFixed(3)} ms per substep, ${c.msPerFrame.toFixed(2)} ms per frame`);
  }
  return lines.join("\n");
}

// CLI: PHYSICS_BENCH=1 npx vite-node src/physics/bench.ts
const proc = (globalThis as { process?: { argv?: string[]; env?: Record<string, string | undefined> } }).process;
const isMain = proc?.env?.PHYSICS_BENCH === "1" || proc?.env?.PHYSICS_BENCH === "frames" || (proc?.argv ?? []).some((a) => /physics[\\/]bench\.ts$/.test(a));
if (isMain && proc?.env?.PHYSICS_BENCH === "frames") {
  // full-frame bench under extra load: PHYSICS_BENCH=frames HOGS=8 [GEOMETRY=fixture] npx vite-node src/physics/bench.ts
  const hogs = Number(proc?.env?.HOGS ?? 0);
  const make = proc?.env?.GEOMETRY === "fixture" ? fixtureEngine : liveArchEngine;
  const seconds = Number(proc?.env?.SECONDS ?? 3);
  await withLoad(hogs, () => {
    const auto = autoConfig(2, 15, make);
    console.log(
      `geometry ${proc?.env?.GEOMETRY === "fixture" ? "frozen fixture" : "live anatomy with arch branches"}; extra busy processes ${hogs}; ` +
        `auto (${auto.initMs.toFixed(0)} ms at init; measured ${auto.measured.map((m) => `${m.segmentScale}: ${m.worstMs.toFixed(2)}`).join(", ")} ms) -> scale ${auto.segmentScale}${auto.overBudget ? ", over budget" : ""}`
    );
    const long: Record<number, number> = {};
    for (const c of VALIDATED_CONFIGS) {
      const r = frameBench(c, 15, seconds, make);
      long[c.segmentScale] = Math.max(...r.map((x) => x.medianMs));
      console.log(`  scale ${c.segmentScale}: ` + r.map((x) => `${x.name} (${x.bodies} bodies) median ${x.medianMs.toFixed(2)} ms, p95 ${x.p95Ms.toFixed(2)} ms, CPU ${x.cpuMs.toFixed(2)} ms`).join("; "));
    }
    console.log(`  auto's choice in the ${seconds} s bench: worst median ${long[auto.segmentScale].toFixed(2)} ms (${long[auto.segmentScale] <= 2 ? "within" : "over"} 2 ms)`);
    return 0;
  });
} else if (isMain) {
  const base = runBench();
  console.log(formatReport(base));
  const choice = chooseConfig(base);
  console.log(
    `budget 2 ms/frame → substep ${choice.substepHz} Hz, segment scale ${choice.segmentScale.toFixed(2)} (predicted ${choice.predictedMs.toFixed(2)} ms${choice.overBudget ? ", over budget" : ""})`
  );
  for (const c of VALIDATED_CONFIGS.slice(1)) console.log(formatReport(runBench(c)));
  console.log(formatReport(runBench({ substepHz: 240 })));
}
