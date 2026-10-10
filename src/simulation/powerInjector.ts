// ---------------------------------------------------------------------------
// The power (pressure) injector for chambers and large vessels (diag-lv-aorta-task).
//
// The module text describes it (hb-cardiac-catheterisation, Equipment,
// src/content/manual/cath-handbook/04-cardiac-catheterisation.ts:166): it
// "delivers a set volume of contrast at an exact rate"; air is expelled from
// the reservoir before connecting, the catheter is firmly attached, and the
// operator watches the screen throughout, ready to stop if the catheter moves
// or the myocardium stains. The ventriculogram lesson gives the settings
// (04-cardiac-catheterisation.ts:1248): 30–35 mL at 10–15 mL/s, a rise time of
// 0.1–0.5 s to reduce catheter whip, reduced (for example 30 mL at 10 mL/s)
// with impaired LV function or an LVEDP above 25 mmHg; the aortogram 40–60 mL
// at 20 mL/s (:1451).
//
// The injector here: the operator sets volume, rate, rise time and the
// pressure limit; purges the air (the air check) and arms it; the cine pedal
// fires it. Arming without the air check is refused. While firing it delivers
// the set rate after a linear rise, capped at the flow whose pressure through
// the catheter's lumen reaches the limit (the same circuit as the hand
// syringe, src/simulation/injection.ts circuitFor), until the set volume has
// gone; stop() ends it at once. The trace it writes is the lab's
// InjectionTrace, so the ventriculogram and aortogram renderer
// (src/render/xray/lvGram.ts) opacify from it exactly as from a hand push.
//
// Every number that is not one of the module text's settings is a MODEL
// PARAMETER (docs/realism/facts/pkg-diag-lv-aorta-task.md).
// ---------------------------------------------------------------------------

import { circuitFor, pressureForFlow, PSI, TRACE_DT, type CatheterLumen, type InjectionTrace } from "./injection";

/** What the operator sets on the injector's console. */
export interface PowerInjectorSettings {
  /** volume to deliver, mL */
  volumeMl: number;
  /** flow rate, mL/s */
  rateMlS: number;
  /** linear rise from zero to the set rate, s */
  riseS: number;
  /** pressure limit, psi */
  pressureLimitPsi: number;
}

/**
 * Limits of the console's settings and its defaults. MODEL PARAMETERS: the module text gives clinical
 * settings, not the range a console offers or its default pressure limit. The default volume and rate are
 * the lower end of Oxford's ventriculogram setting (30 mL at 10 mL/s, 04-cardiac-catheterisation.ts:1248);
 * the default rise is that lesson's "about one-hundredth of the flow rate" at 10 mL/s.
 */
export const MP_POWER_INJECTOR = {
  volumeMl: { min: 1, max: 100 },
  rateMlS: { min: 1, max: 30 },
  riseS: { min: 0, max: 1 },
  pressureLimitPsi: { min: 100, max: 1200 },
  defaults: { volumeMl: 30, rateMlS: 10, riseS: 0.1, pressureLimitPsi: 600 } as PowerInjectorSettings,
  /** delay from the cine pedal to the start of the push (the module text: "start the injection a few frames into acquisition"), s */
  fireDelayS: 0.3,
};

/** The module text's ventriculogram and aortogram settings, for the console's presets and the attending (sources above). */
export const LV_GRAM_SETTINGS = {
  /** usual ventriculogram: 30–35 mL at 10–15 mL/s */
  usual: { volumeMl: [30, 35], rateMlS: [10, 15] },
  /** reduced with impaired LV function or an LVEDP above reduceAboveLvedp: for example 30 mL at 10 mL/s */
  reduced: { volumeMl: 30, rateMlS: 10 },
  reduceAboveLvedp: 25,
  /** rise time some operators add: 0.1–0.5 s */
  riseS: [0.1, 0.5],
} as const;
export const AORTOGRAM_SETTINGS = { volumeMl: [40, 60], rateMlS: 20 } as const;

export type PowerInjectorState = "idle" | "purged" | "armed" | "firing" | "done";

export type ArmRefusal = "air-check" | "no-lumen" | "settings";

/** One delivered (or stopped) power injection. */
export interface PowerInjection {
  settings: PowerInjectorSettings;
  /** lab time the pedal fired it, s */
  firedAt: number;
  trace: InjectionTrace;
  /** the injection was stopped by the operator before the set volume */
  stopped: boolean;
  /** the pressure limit capped the rate at some point */
  pressureLimited: boolean;
}

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

/** Settings brought inside the console's limits (non-finite values take the default). */
export function clampSettings(s: Partial<PowerInjectorSettings>): PowerInjectorSettings {
  const L = MP_POWER_INJECTOR;
  const f = (x: number | undefined, d: number, r: { min: number; max: number }) => clamp(Number.isFinite(x) ? (x as number) : d, r.min, r.max);
  return {
    volumeMl: f(s.volumeMl, L.defaults.volumeMl, L.volumeMl),
    rateMlS: f(s.rateMlS, L.defaults.rateMlS, L.rateMlS),
    riseS: f(s.riseS, L.defaults.riseS, L.riseS),
    pressureLimitPsi: f(s.pressureLimitPsi, L.defaults.pressureLimitPsi, L.pressureLimitPsi),
  };
}

/** Injector pressure (psi) that drives `q` mL/s through the lumen (catheter and the connecting line). */
export function pressurePsiFor(lumen: CatheterLumen, q: number): number {
  const cc = circuitFor(lumen);
  return pressureForFlow(cc, Math.max(0, q)) / PSI;
}

/** The largest flow (mL/s) whose pressure through the lumen stays at or under the limit (psi). */
export function flowAtPressureLimit(lumen: CatheterLumen, limitPsi: number): number {
  const cc = circuitFor(lumen);
  const dp = limitPsi * PSI - cc.pTip;
  if (dp <= 0) return 0;
  if (cc.k <= 0) return dp / cc.R;
  return (-cc.R + Math.sqrt(cc.R * cc.R + 4 * cc.k * dp)) / (2 * cc.k);
}

/**
 * The complete trace of a power injection fired at t = 0 with these settings (what the injector will deliver
 * if nobody stops it). Sample i is at i * TRACE_DT; the push starts after `delayS`.
 */
export function plannedTrace(settings: PowerInjectorSettings, lumen: CatheterLumen, o: { delayS?: number; side?: "left" | "right" } = {}): { trace: InjectionTrace; pressureLimited: boolean } {
  const s = clampSettings(settings);
  const delay = o.delayS ?? MP_POWER_INJECTOR.fireDelayS;
  const qMax = Math.min(s.rateMlS, flowAtPressureLimit(lumen, s.pressureLimitPsi));
  const limited = qMax < s.rateMlS - 1e-9;
  const q: number[] = [];
  const c: number[] = [];
  const nDelay = Math.round(delay / TRACE_DT);
  for (let i = 0; i < nDelay; i++) {
    q.push(0);
    c.push(1);
  }
  let vol = 0;
  let t = 0;
  let peakPsi = 0;
  // the push: a linear rise to the set rate, capped by the pressure limit, until the volume has gone
  while (vol < s.volumeMl - 1e-9 && t < 600) {
    const aim = s.riseS > 0 ? s.rateMlS * Math.min(1, (t + TRACE_DT) / s.riseS) : s.rateMlS;
    let qi = Math.min(aim, qMax);
    if (vol + qi * TRACE_DT > s.volumeMl) qi = (s.volumeMl - vol) / TRACE_DT;
    q.push(qi);
    c.push(1);
    vol += qi * TRACE_DT;
    peakPsi = Math.max(peakPsi, pressurePsiFor(lumen, qi));
    t += TRACE_DT;
    if (qMax <= 0) break;
  }
  const pushEnd = delay + t;
  // the flow stops with the piston (one sample of zero closes the trace)
  q.push(0);
  c.push(1);
  const trace: InjectionTrace = {
    dt: TRACE_DT,
    q,
    c,
    pushStart: delay,
    pushEnd,
    volumeMl: vol,
    contrastMl: vol,
    peakPsi,
    side: o.side ?? "left",
    kind: "standard",
    deadMl: 0,
    primed: 1,
    tailMl: 0,
  };
  return { trace, pressureLimited: limited };
}

/** Volume (mL) of a trace delivered by time t (s since the fire). */
export function deliveredBy(tr: InjectionTrace, t: number): number {
  const n = Math.min(tr.q.length, Math.max(0, Math.floor(t / tr.dt)));
  let v = 0;
  for (let i = 0; i < n; i++) v += tr.q[i] * tr.dt;
  return v;
}

/** Peak flow of a trace, mL/s. */
export function peakFlow(tr: InjectionTrace): number {
  let m = 0;
  for (const x of tr.q) if (x > m) m = x;
  return m;
}

/**
 * The injector on the lab's table. purge() is the air check (air expelled from the reservoir and the line run
 * wet as it is connected); arm() is refused without it; fire(t) on the cine pedal starts the planned trace; the
 * lab reads its live trace with traceAt(t) and active(t); stop(t) ends it early. After an injection the air
 * check has to be done again before the next arming (the syringe is refilled and reconnected).
 */
export class PowerInjector {
  settings: PowerInjectorSettings = { ...MP_POWER_INJECTOR.defaults };
  state: PowerInjectorState = "idle";
  /** the injection in progress or the last one */
  current: PowerInjection | null = null;
  readonly history: PowerInjection[] = [];
  /** why the last arm() was refused, or null */
  lastRefusal: ArmRefusal | null = null;
  private lumen: CatheterLumen | null = null;
  private plan: InjectionTrace | null = null;

  constructor(lumen: CatheterLumen | null = null) {
    this.lumen = lumen;
  }

  /** The catheter lumen the injector is connected to (null: not connected). Disarms if it changes. */
  connect(lumen: CatheterLumen | null): void {
    if (lumen === this.lumen) return;
    this.lumen = lumen;
    if (this.state === "armed" || this.state === "purged") this.state = "idle";
  }

  get connected(): boolean {
    return !!this.lumen;
  }

  /** Change the settings (clamped to the console's limits). Changing them disarms an armed injector. */
  set(s: Partial<PowerInjectorSettings>): PowerInjectorSettings {
    if (this.state === "firing") return this.settings;
    this.settings = clampSettings({ ...this.settings, ...s });
    if (this.state === "armed") this.state = "purged";
    return this.settings;
  }

  /** The air check: air expelled from the reservoir and the line, the connection made wet. */
  purge(): void {
    if (this.state === "firing") return;
    this.state = this.state === "armed" ? "armed" : "purged";
  }

  /** Arm for the next cine run. Refused (false, with lastRefusal) without the air check or without a catheter. */
  arm(): boolean {
    if (this.state === "firing") return false;
    if (!this.lumen) {
      this.lastRefusal = "no-lumen";
      return false;
    }
    if (this.state !== "purged" && this.state !== "armed") {
      this.lastRefusal = "air-check";
      return false;
    }
    this.lastRefusal = null;
    this.state = "armed";
    return true;
  }

  disarm(): void {
    if (this.state === "armed") this.state = "purged";
  }

  get armed(): boolean {
    return this.state === "armed";
  }

  /** The planned injection at the current settings through the connected lumen (null when not connected). */
  preview(): { trace: InjectionTrace; pressureLimited: boolean } | null {
    return this.lumen ? plannedTrace(this.settings, this.lumen) : null;
  }

  /** Fire the armed injector at lab time t (the cine pedal). Returns the injection, or null when not armed. */
  fire(t: number, side: "left" | "right" = "left"): PowerInjection | null {
    if (this.state !== "armed" || !this.lumen) return null;
    const p = plannedTrace(this.settings, this.lumen, { side });
    this.plan = p.trace;
    this.current = { settings: { ...this.settings }, firedAt: t, trace: p.trace, stopped: false, pressureLimited: p.pressureLimited };
    this.history.push(this.current);
    this.state = "firing";
    return this.current;
  }

  /** Seconds since the current injection was fired (null without one). */
  elapsed(t: number): number | null {
    return this.current ? Math.max(0, t - this.current.firedAt) : null;
  }

  /** Whether contrast is still being pushed at lab time t. */
  pushing(t: number): boolean {
    const c = this.current;
    if (!c || this.state !== "firing") return false;
    const el = t - c.firedAt;
    return el < (c.trace.pushEnd ?? 0);
  }

  /** Advance to lab time t: the injection ends (state 'done') once its push is over. */
  advance(t: number): void {
    const c = this.current;
    if (!c || this.state !== "firing") return;
    if (t - c.firedAt >= (c.trace.pushEnd ?? 0)) this.state = "done";
  }

  /**
   * Stop the injection at lab time t (the operator's stop, or a run that must end): the trace is cut at that
   * sample and its volume is what had gone. No effect when nothing is firing.
   */
  stop(t: number): void {
    const c = this.current;
    if (!c || this.state !== "firing") return;
    const el = Math.max(0, t - c.firedAt);
    const base = this.plan ?? c.trace;
    const n = Math.min(base.q.length, Math.max(0, Math.floor(el / base.dt)));
    const q = base.q.slice(0, n);
    const cc = base.c.slice(0, n);
    q.push(0);
    cc.push(1);
    let vol = 0;
    for (const x of q) vol += x * base.dt;
    const pushEnd = Math.max(base.pushStart, Math.min(base.pushEnd ?? el, el));
    c.trace = { ...base, q, c: cc, pushEnd, volumeMl: vol, contrastMl: vol };
    c.stopped = vol < c.settings.volumeMl - 1e-6;
    this.state = "done";
  }

  /** After an injection: the syringe is refilled and the line reconnected, so the air check is due again. */
  reset(): void {
    if (this.state === "firing") return;
    this.state = "idle";
  }
}
