// ---------------------------------------------------------------------------
// Hand injection of contrast through a manifold, tubing and the catheter.
//
// The operator pushes the plunger of a syringe on the manifold. The force on
// the plunger sets the syringe pressure (force / barrel area, less plunger
// friction); the pressure drives contrast through the tubing and the catheter
// lumen against the coronary (aortic) pressure at the tip. At hand-injection
// flows the flow in the catheter is laminar (Reynolds number about 300-600),
// so the resistance is Poiseuille's, 128 mu L / (pi d^4), or the concentric
// annulus formula when a guidewire or a device shaft sits in the lumen, plus
// the kinetic-energy loss of the jet leaving the tip (rho u^2 / 2).
//
// The hand does not apply force instantly: the commanded force is reached with
// a first-order rise and released with a first-order fall. The syringe holds a
// finite volume, so a long hold ends when it is empty. The catheter lumen holds
// a dead volume: whatever it contained before the push (contrast after a test
// puff, saline after a flush) leaves the tip first.
//
// Everything is tabulated as an InjectionTrace (flow and injectate strength at
// the catheter tip at fixed time steps from the operator's press), which the
// contrast transport (render/xray/contrastTransport.ts) mixes with coronary
// flow. Two producers:
//   - planTrace(plan): a whole planned injection (the capture harness, tests,
//     the default when a scene is given no trace);
//   - Injector: the lab's syringe in real time, for "press" and "hold".
// Constants and their sources: docs/realism/facts/I1.md (step 2).
// ---------------------------------------------------------------------------

/** Iodine concentration of the contrast agent (mg I / mL). */
export const IODINE_MG_PER_ML = 350;
/** Absolute viscosity of a 350 mg I/mL non-ionic agent (Pa s) at 20 and 37 deg C (product label, facts/I1.md). */
export const CONTRAST_VISCOSITY = { at20C: 20.4e-3, at37C: 10.4e-3 } as const;
/** Specific gravity of the same agent at 37 deg C (label) -> density, kg/m^3. */
export const CONTRAST_DENSITY = 1406;
/**
 * Highest syringe pressure reached by hand (psi); Zhang et al. 2016, epub 2015 (facts/I1.md): "By using hand injection, it
 * was generally not possible to reach a maximum injection pressure exceeding 50 psi". The abstract does not give
 * the syringe size. What limits the hand is its force, so the model treats the limit as a plunger force: the
 * force that gives 50 psi on the lab's 10 mL control syringe (MAX_HAND_FORCE_N, an assumption labelled in
 * facts/I1.md). A smaller-bore syringe reaches a higher pressure with the same force.
 */
export const MAX_HAND_PRESSURE_PSI = 50;
export const PSI = 6894.76;
/** Mean aortic (coronary ostial) pressure the tip injects against (mmHg); the patient model's resting MAP. */
export const OSTIAL_PRESSURE_MMHG = 93;
const MMHG = 133.322;

// ---- model parameters (facts/I1.md, "model parameters") ----------------------
/** Contrast temperature in the catheter: warmed to body temperature (model choice). */
export const CONTRAST_VISCOSITY_USED: number = CONTRAST_VISCOSITY.at37C;
/** Control syringe: nominal volume (mL) and barrel bore (mm). */
export const SYRINGE_ML = 10;
export const SYRINGE_BORE_MM = 14.5;
/** Largest plunger force of the hand (N): MAX_HAND_PRESSURE_PSI on the 10 mL control syringe's bore (model assumption). */
export const MAX_HAND_FORCE_N = MAX_HAND_PRESSURE_PSI * PSI * Math.PI * (SYRINGE_BORE_MM / 2000) ** 2;
/** Plunger seal friction (N). */
export const PLUNGER_FRICTION_N = 3;
/** Manifold, stopcocks and the short connecting line: length and bore (mm). */
export const TUBING = { lengthMm: 500, idMm: 2.4 };
/**
 * Hand force rise and release time constants (s; model parameters). The thumb comes off the plunger quickly, so
 * the flow stops within a few tenths of a second of the end of the push. The compliance of the syringe, manifold
 * and line is neglected (no sourced value): nothing keeps flowing once the force is gone. Persistence of contrast
 * after the push comes from the transport (distal transit, laminar wall layer, blush), not from the syringe.
 */
export const HAND_RISE_S = 0.12;
export const HAND_FALL_S = 0.1;
/**
 * Time from the operator's press (the cine pedal goes down) to the start of the push (s). Library
 * calibrated: chosen so the measured first appearance and arrival match the real runs (facts/I1.md).
 */
export const OPERATOR_DELAY_S = 0.3;
/**
 * Syringe push of a standard injection (s). Library calibrated with the fast release above: pushes of 1.8, 2.2 and
 * 2.5 s were filmed on the S0 views (sets i1s3a-c, 51 frames); 1.8 s washes out too early (end-of-run level median
 * 0.03 of the peak against the real 0.44; timing 48 of 66 rows), 2.2 and 2.5 s both reach 56 of 66 and 2.2 s
 * uses less contrast (facts/I1.md). The S0 capture default (1.8 s) should follow this constant.
 */
export const STANDARD_PUSH_S = 2.2;
/**
 * Flow the operator aims for in a standard injection (mL/s): inside the label's 3-14 mL per injection and the
 * handbook's 5-10 mL (left) once multiplied by the standard push (8.5 mL left through a 6 Fr guide); the right
 * standard run is 5.3 mL, just above the handbook's 3-5 mL (facts/I1.md).
 */
export const TARGET_FLOW_ML_S = { left: 4.0, right: 2.5 } as const;
/** Test puff: a few millilitres (handbook), pushed briskly. */
export const PUFF = { volumeMl: 2, flowMlS: 3.0 } as const;
/** "Forceful" injection: the aimed flow is raised by this factor (still capped by the hand's pressure). */
export const FORCEFUL_FACTOR = 1.5;
/**
 * Standard cine run (s): the library's median run length (timing.run_s, CoronaryDominance lossless, 49 runs;
 * realism_targets.json). A run lasts at least this long and at least CINE_TAIL_S past the end of the push.
 */
export const CINE_RUN_S = 3.4;
export const CINE_TAIL_S = CINE_RUN_S - (OPERATOR_DELAY_S + STANDARD_PUSH_S);
/** 0.014 inch coronary guidewire (mm). */
export const WIRE_014_MM = 0.3556;
/**
 * A wire or shaft in the lumen lies against the wall (an eccentric annulus), which passes more flow than the
 * concentric annulus formula gives; its resistance is divided by this gain, never below the open tube's
 * (model parameter).
 */
export const ECCENTRIC_FLOW_GAIN = 2.5;
/** Equivalent diameter of a rapid-exchange balloon or stent shaft lying in the guide (mm; model parameter). */
export const DEVICE_SHAFT_MM = 0.65;
/** Equivalent obstruction of a wire and a device shaft sharing the lumen (equal total area). */
export function lumenObstruction(wire: boolean, device: boolean): number {
  const a = (wire ? WIRE_014_MM * WIRE_014_MM : 0) + (device ? DEVICE_SHAFT_MM * DEVICE_SHAFT_MM : 0);
  return Math.sqrt(a);
}
/** Time step of an InjectionTrace (s). */
export const TRACE_DT = 0.005;

/** Development only: window.__injectionTune overrides the operator delay and hand time constants (calibration). */
function tune(): { delay: number; rise: number; fall: number } {
  const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ? (globalThis as { __injectionTune?: { delay?: number; rise?: number; fall?: number } }).__injectionTune : undefined;
  return { delay: dev?.delay ?? OPERATOR_DELAY_S, rise: dev?.rise ?? HAND_RISE_S, fall: dev?.fall ?? HAND_FALL_S };
}

// ---------------------------------------------------------------------------
// catheters
// ---------------------------------------------------------------------------

export interface CatheterLumen {
  /** lumen inner diameter (mm) */
  idMm: number;
  /** length (mm) */
  lengthMm: number;
  /** what sits in the lumen during the injection (mm diameter; 0.36 for a 0.014 inch wire) */
  obstructionMm?: number;
  label?: string;
}

/**
 * Catheter lumens (inner diameters from the manufacturers' published specifications, facts/I1.md; 100 cm).
 * The 7 Fr guide is a model parameter (no specification opened).
 */
export const LUMENS = {
  "diag-5": { idMm: 1.19, lengthMm: 1000, label: "5 Fr diagnostic" },
  "diag-6": { idMm: 1.42, lengthMm: 1000, label: "6 Fr diagnostic" },
  "guide-6": { idMm: 1.80, lengthMm: 1000, label: "6 Fr guide" },
  "guide-7": { idMm: 1.98, lengthMm: 1000, label: "7 Fr guide" },
} as const satisfies Record<string, CatheterLumen>;
export type LumenId = keyof typeof LUMENS;

/** The lumen the scene builder assumes from the French size when nothing else is known (5 Fr diagnostic, 6-7 Fr guides). */
export function lumenForFrench(french: number, guide?: boolean): CatheterLumen {
  if (french <= 5) return LUMENS["diag-5"];
  if (french >= 7) return LUMENS["guide-7"];
  return guide === false ? LUMENS["diag-6"] : LUMENS["guide-6"];
}

/**
 * The lumen of a catalogue catheter (diag-injection-run-quality): a guide's or a diagnostic catheter's of its
 * French size. A 4 Fr diagnostic lumen is not offered (no manufacturer's inner diameter has been opened, facts
 * I1.md), so a size below 5 Fr is refused rather than guessed.
 */
export function lumenForCatheter(c: { french: number; guide: boolean }): CatheterLumen {
  if (c.french < 5) throw new Error(`no sourced lumen for a ${c.french} Fr catheter`);
  if (c.guide) return c.french >= 7 ? LUMENS["guide-7"] : LUMENS["guide-6"];
  return c.french <= 5 ? LUMENS["diag-5"] : LUMENS["diag-6"];
}

/**
 * Hand force on the plunger (diag-injection-run-quality). The lab's hands report the plunger as a fraction of a
 * full push (0..1, src/input: the keyboard's inject key gives settings.keyboard.plungerForce, 0.7 by default, and
 * half that with the fine modifier; a gamepad or a hand gives any value). The operator's aimed flow scales with that
 * fraction, so the keyboard's default push is the standard injection (TARGET_FLOW_ML_S) and a full push about
 * FORCEFUL_FACTOR of it, always capped by the hand's largest force (MAX_HAND_FORCE_N) through the lumen in use.
 * MODEL PARAMETER: the fraction that gives the standard aimed flow (the keyboard's default plunger force).
 */
export const STANDARD_PLUNGER = 0.7;

/** The aimed-flow factor of a plunger fraction (0..1): 1 at STANDARD_PLUNGER, linear, never negative. */
export function plungerAimFactor(fraction: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : STANDARD_PLUNGER)) / STANDARD_PLUNGER;
}

/** Dead volume of a lumen (mL). */
export function deadVolumeMl(c: CatheterLumen): number {
  const r = c.idMm / 2;
  const ri = (c.obstructionMm ?? 0) / 2;
  return (Math.PI * (r * r - ri * ri) * c.lengthMm) / 1000;
}

/**
 * Laminar resistance of a tube or concentric annulus (Pa per mL/s).
 * Tube: 128 mu L / (pi d^4). Annulus (outer R, inner a): 8 mu L / (pi [R^4 - a^4 - (R^2 - a^2)^2 / ln(R/a)]).
 */
export function laminarResistance(idMm: number, lengthMm: number, mu = CONTRAST_VISCOSITY_USED, obstructionMm = 0): number {
  const R = idMm / 2000; // m
  const L = lengthMm / 1000;
  const a = Math.min(obstructionMm / 2000, R * 0.95);
  let g: number;
  if (a <= 1e-6) g = Math.pow(R, 4);
  else g = Math.pow(R, 4) - Math.pow(a, 4) - Math.pow(R * R - a * a, 2) / Math.log(R / a);
  let perM3 = (8 * mu * L) / (Math.PI * g); // Pa s / m^3
  if (a > 1e-6) perM3 = Math.max((8 * mu * L) / (Math.PI * Math.pow(R, 4)), perM3 / ECCENTRIC_FLOW_GAIN);
  return perM3 * 1e-6; // Pa per mL/s
}

/** Kinetic loss coefficient of the jet at the tip: dP = k Q^2 (Pa per (mL/s)^2). */
export function jetLossCoeff(c: CatheterLumen, rho = CONTRAST_DENSITY): number {
  const r = c.idMm / 2000;
  const ri = (c.obstructionMm ?? 0) / 2000;
  const A = Math.PI * (r * r - ri * ri);
  return (0.5 * rho) / (A * A) * 1e-12;
}

export interface Circuit {
  /** total laminar resistance, Pa per mL/s */
  R: number;
  /** jet loss, Pa per (mL/s)^2 */
  k: number;
  /** syringe barrel area, m^2 */
  area: number;
  /** pressure at the tip (Pa) */
  pTip: number;
  /** catheter dead volume (mL) */
  deadMl: number;
}

export function circuitFor(c: CatheterLumen, o: { mu?: number; ostialMmHg?: number; syringeBoreMm?: number } = {}): Circuit {
  const mu = o.mu ?? CONTRAST_VISCOSITY_USED;
  const R = laminarResistance(c.idMm, c.lengthMm, mu, c.obstructionMm ?? 0) + laminarResistance(TUBING.idMm, TUBING.lengthMm, mu);
  const bore = (o.syringeBoreMm ?? SYRINGE_BORE_MM) / 2000;
  return { R, k: jetLossCoeff(c), area: Math.PI * bore * bore, pTip: (o.ostialMmHg ?? OSTIAL_PRESSURE_MMHG) * MMHG, deadMl: deadVolumeMl(c) };
}

/** Flow (mL/s) for a plunger force (N). */
export function flowForForce(cc: Circuit, forceN: number): number {
  const dp = Math.max(0, forceN - PLUNGER_FRICTION_N) / cc.area - cc.pTip;
  if (dp <= 0) return 0;
  // k Q^2 + R Q - dp = 0
  if (cc.k <= 0) return dp / cc.R;
  return (-cc.R + Math.sqrt(cc.R * cc.R + 4 * cc.k * dp)) / (2 * cc.k);
}

/** Syringe pressure (Pa) that drives `q` mL/s. */
export function pressureForFlow(cc: Circuit, q: number): number {
  return cc.pTip + cc.R * q + cc.k * q * q;
}

/** Plunger force (N) for a flow, and the hand's maximum. */
export function forceForFlow(cc: Circuit, q: number): number {
  return pressureForFlow(cc, q) * cc.area + PLUNGER_FRICTION_N;
}
/** The hand's largest plunger force (N): the same whatever the syringe, so a narrower barrel reaches a higher pressure. */
export function maxHandForce(_cc?: Circuit): number {
  return MAX_HAND_FORCE_N;
}

// ---------------------------------------------------------------------------
// plans and traces
// ---------------------------------------------------------------------------

export type InjectionKind = "standard" | "puff" | "forceful" | "held";

export interface InjectionPlan {
  kind: InjectionKind;
  side: "left" | "right";
  catheter: CatheterLumen;
  /** press to start of push (s); default OPERATOR_DELAY_S */
  delayS?: number;
  /** push duration (s); Infinity while held */
  pushS?: number;
  /** aimed flow (mL/s); default from the side and kind */
  targetFlow?: number;
  /** explicit plunger force (N) instead of an aimed flow (a future syringe UI) */
  forceN?: number;
  /** volume cap (mL): syringe content or the planned volume */
  volumeMl?: number;
  /** fraction of the lumen that holds contrast before the push (1 after a test puff, 0 after a saline flush) */
  primed?: number;
  /** syringe barrel bore (mm); default the 10 mL control syringe */
  syringeBoreMm?: number;
}

export interface InjectionTrace {
  /** sample step (s); sample i is at time i dt after the press */
  dt: number;
  /** flow at the tip (mL/s) */
  q: number[];
  /** injectate strength leaving the tip (fraction of full-strength contrast) */
  c: number[];
  /** time the push started and ended (s since the press); pushEnd is null while still pushing */
  pushStart: number;
  pushEnd: number | null;
  /** volume delivered so far (mL) */
  volumeMl: number;
  /** contrast (full-strength equivalent) delivered so far (mL) */
  contrastMl: number;
  /** peak syringe pressure (psi) */
  peakPsi: number;
  side: "left" | "right";
  kind: InjectionKind;
  /** the syringe ran empty */
  empty?: boolean;
  /** catheter dead volume (mL) and the share of it that held contrast before the push */
  deadMl?: number;
  primed?: number;
  /** volume delivered after the end of the push, while the hand released the plunger (mL) */
  tailMl?: number;
}

/** Aimed flow for a plan (mL/s). */
export function aimedFlow(p: Pick<InjectionPlan, "kind" | "side" | "targetFlow">): number {
  if (p.targetFlow !== undefined) return p.targetFlow;
  if (p.kind === "puff") return PUFF.flowMlS;
  const base = TARGET_FLOW_ML_S[p.side];
  return p.kind === "forceful" ? base * FORCEFUL_FACTOR : base;
}

/** Commanded plunger force for a plan, capped by the hand. */
export function commandForce(p: InjectionPlan, cc: Circuit): number {
  const want = p.forceN ?? forceForFlow(cc, aimedFlow(p));
  return Math.min(maxHandForce(cc), Math.max(0, want));
}

/**
 * Integrates a syringe push into trace samples. The state is kept by the caller so the lab can run it in
 * real time (Injector) and the planner in one go (planTrace).
 */
interface PushState {
  t: number;
  force: number;
  syringeMl: number;
  pushedMl: number;
  oldMl: number;
  oldC: number;
}

function stepPush(st: PushState, cc: Circuit, fCmd: number, dt: number, T = tune()): { q: number; c: number } {
  const tau = fCmd > st.force ? T.rise : T.fall;
  st.force += (fCmd - st.force) * (1 - Math.exp(-dt / tau));
  let q = st.syringeMl > 0 ? flowForForce(cc, st.force) : 0;
  if (q * dt > st.syringeMl) q = st.syringeMl / dt;
  const dv = q * dt;
  st.syringeMl -= dv;
  // what leaves the tip: the old lumen contents first, then fresh contrast from the syringe
  let c = 1;
  if (dv > 0) {
    const fromOld = Math.min(st.oldMl, dv);
    c = (fromOld * st.oldC + (dv - fromOld) * 1) / dv;
    st.oldMl -= fromOld;
  } else c = st.oldMl > 0 ? st.oldC : 1;
  st.pushedMl += dv;
  st.t += dt;
  return { q, c };
}

const planCache = new Map<string, InjectionTrace>();

/** A complete planned injection, tabulated until the flow has stopped. Cached by its parameters. */
export function planTrace(p: InjectionPlan): InjectionTrace {
  const T = tune();
  const key = JSON.stringify([p.kind, p.side, p.catheter.idMm, p.catheter.lengthMm, p.catheter.obstructionMm ?? 0, p.delayS, p.pushS, p.targetFlow, p.forceN, p.volumeMl, p.primed, p.syringeBoreMm, T]);
  const hit = planCache.get(key);
  if (hit) return hit;
  const cc = circuitFor(p.catheter, { syringeBoreMm: p.syringeBoreMm });
  const delay = p.delayS ?? T.delay;
  const vol = p.volumeMl ?? (p.kind === "puff" ? PUFF.volumeMl : SYRINGE_ML);
  // a puff ends on its volume; a held plan without an end pushes until the syringe is empty
  const push = p.kind === "puff" && p.pushS === undefined ? Infinity : p.pushS ?? STANDARD_PUSH_S;
  const fCmd = commandForce(p, cc);
  const primed = p.primed ?? 1;
  const st: PushState = { t: 0, force: 0, syringeMl: vol, pushedMl: 0, oldMl: cc.deadMl, oldC: primed };
  const q: number[] = [];
  const c: number[] = [];
  let peak = 0;
  let pushEnd: number | null = null;
  const nDelay = Math.round(delay / TRACE_DT);
  for (let i = 0; i < nDelay; i++) {
    q.push(0);
    c.push(primed);
  }
  st.t = nDelay * TRACE_DT;
  const tEndMax = delay + (Number.isFinite(push) ? push : 60) + 8 * T.fall + 0.5;
  let contrast = 0;
  let tail = 0;
  while (st.t < tEndMax) {
    const pushing = st.t < delay + push && st.syringeMl > 1e-6;
    if (!pushing && pushEnd === null) pushEnd = st.t;
    const s = stepPush(st, cc, pushing ? fCmd : 0, TRACE_DT, T);
    q.push(s.q);
    c.push(s.c);
    contrast += s.q * TRACE_DT * s.c;
    if (!pushing) tail += s.q * TRACE_DT;
    peak = Math.max(peak, (st.force - PLUNGER_FRICTION_N) / cc.area / PSI);
    if (pushEnd !== null && s.q < 1e-4) break;
  }
  const tr: InjectionTrace = {
    dt: TRACE_DT,
    q,
    c,
    pushStart: delay,
    pushEnd: pushEnd ?? st.t,
    volumeMl: st.pushedMl,
    contrastMl: contrast,
    peakPsi: peak,
    side: p.side,
    kind: p.kind,
    empty: st.syringeMl <= 1e-6,
    deadMl: cc.deadMl,
    primed,
    tailMl: tail,
  };
  if (planCache.size > 200) planCache.clear();
  planCache.set(key, tr);
  return tr;
}

/** The standard injection the scene builder assumes when it is given no trace (and the lab's press). */
export function standardPlan(side: "left" | "right", catheter: CatheterLumen, pushS = STANDARD_PUSH_S): InjectionPlan {
  return { kind: "standard", side, catheter, pushS };
}

/** Flow at time t (s since the press) from a trace (0 outside it). */
export interface LumenFill {
  /** position of the contrast front from the hub (0 hub ... 1 tip) */
  front: number;
  /** strength hub-side of the front (fresh syringe contents) and tip-side (what the lumen held before) */
  behind: number;
  ahead: number;
}

/**
 * What the catheter lumen holds at time t of a run: the syringe's contrast displaces the old contents as a plug
 * from the hub, so the front reaches the tip once the dead volume has been pushed.
 */
export function lumenFillAt(tr: InjectionTrace, t: number): LumenFill {
  const ahead = tr.primed ?? 1;
  const dead = tr.deadMl ?? 0;
  if (dead <= 0) return { front: 1, behind: 1, ahead };
  const n = Math.min(tr.q.length, Math.max(0, Math.floor(t / tr.dt)));
  let v = 0;
  for (let i = 0; i < n; i++) v += tr.q[i] * tr.dt;
  return { front: Math.min(1, v / dead), behind: 1, ahead };
}

export function traceAt(tr: InjectionTrace, t: number): { q: number; c: number } {
  const x = t / tr.dt;
  const i = Math.floor(x);
  if (i < 0) return { q: 0, c: tr.c[0] ?? 1 };
  if (i >= tr.q.length - 1) {
    const n = tr.q.length - 1;
    return { q: n >= 0 && tr.pushEnd === null ? tr.q[n] : 0, c: n >= 0 ? tr.c[n] : 1 };
  }
  const f = x - i;
  return { q: tr.q[i] * (1 - f) + tr.q[i + 1] * f, c: tr.c[i] * (1 - f) + tr.c[i + 1] * f };
}

// ---------------------------------------------------------------------------
// the lab's syringe (real time)
// ---------------------------------------------------------------------------

export interface InjectorStats {
  /** contrast delivered in this case (mL) */
  totalMl: number;
  injections: number;
  puffs: number;
  last: { volumeMl: number; tailMl: number; peakFlow: number; peakPsi: number; kind: InjectionKind; empty: boolean } | null;
}

/**
 * The manifold syringe of one lab. start() begins a run at the press (the cine starts then; the push
 * follows after the operator delay), release() ends a held push, advance(nowS) integrates in real time.
 * A press shorter than the standard push becomes a standard injection; a longer hold pushes until release
 * or until the syringe is empty. The syringe is refilled between runs; the catheter keeps whatever it
 * holds (contrast after any push longer than its dead volume).
 */
export class Injector {
  catheter: CatheterLumen;
  /** fraction of the lumen holding contrast (1 = primed with contrast) */
  primed: number;
  readonly stats: InjectorStats = { totalMl: 0, injections: 0, puffs: 0, last: null };
  private run: { trace: InjectionTrace; plan: InjectionPlan; t0: number; st: PushState; cc: Circuit; release: number | null; fCmd: number; peakQ: number; aimFactor: number } | null = null;

  constructor(catheter: CatheterLumen, o: { primed?: number } = {}) {
    this.catheter = catheter;
    this.primed = o.primed ?? 1;
  }

  /** The lumen now holds saline (after a flush or a pressure-line clear). */
  flush() {
    this.primed = 0;
  }

  setCatheter(c: CatheterLumen) {
    if (c.idMm !== this.catheter.idMm || c.lengthMm !== this.catheter.lengthMm || (c.obstructionMm ?? 0) !== (this.catheter.obstructionMm ?? 0)) this.catheter = c;
  }

  get active(): boolean {
    return !!this.run;
  }

  /** The live trace of the current run (time 0 = the press), or null. */
  get trace(): InjectionTrace | null {
    return this.run?.trace ?? null;
  }

  /** Seconds since the current run's press. */
  elapsed(nowS: number): number | null {
    return this.run ? nowS - this.run.t0 : null;
  }

  /**
   * Press: a new run. `kind` "held" pushes until release(); "standard" and "forceful" push for
   * STANDARD_PUSH_S unless held longer; "puff" delivers PUFF.volumeMl.
   */
  start(nowS: number, plan: Omit<InjectionPlan, "catheter"> & { catheter?: CatheterLumen }): InjectionTrace {
    this.finish();
    const p: InjectionPlan = { ...plan, catheter: plan.catheter ?? this.catheter };
    const cc = circuitFor(p.catheter, { syringeBoreMm: p.syringeBoreMm });
    const vol = p.volumeMl ?? (p.kind === "puff" ? PUFF.volumeMl : SYRINGE_ML);
    const st: PushState = { t: 0, force: 0, syringeMl: vol, pushedMl: 0, oldMl: cc.deadMl, oldC: this.primed };
    const trace: InjectionTrace = { dt: TRACE_DT, q: [], c: [], pushStart: p.delayS ?? tune().delay, pushEnd: null, volumeMl: 0, contrastMl: 0, peakPsi: 0, side: p.side, kind: p.kind, deadMl: cc.deadMl, primed: this.primed, tailMl: 0 };
    this.run = { trace, plan: p, t0: nowS, st, cc, release: null, fCmd: commandForce(p, cc), peakQ: 0, aimFactor: 1 };
    return trace;
  }

  /**
   * The hand changes its force during the push (diag-injection-run-quality): the aimed flow becomes `factor` times
   * the plan's (plungerAimFactor), from now on; the hand's rise and fall time constants smooth the change. Ignored
   * without a run, after the push has ended, or for a plan with an explicit plunger force.
   */
  setAim(factor: number) {
    const r = this.run;
    if (!r || r.trace.pushEnd !== null || r.plan.forceN !== undefined || !Number.isFinite(factor)) return;
    const base = aimedFlow(r.plan);
    r.aimFactor = Math.max(0, factor);
    r.fCmd = commandForce({ ...r.plan, targetFlow: base * r.aimFactor }, r.cc);
  }

  /** The aimed-flow factor of the current run (1 when the hand has not changed it), or null without a run. */
  get aimFactor(): number | null {
    return this.run ? this.run.aimFactor : null;
  }

  /** The circuit of the current run (resistance, jet loss, dead volume), or null. */
  get circuit(): Circuit | null {
    return this.run?.cc ?? null;
  }

  /** Release the plunger (end of a hold). A release before the standard push has elapsed keeps the standard push. */
  release(nowS: number) {
    const r = this.run;
    if (!r || r.release !== null) return;
    r.release = nowS - r.t0;
  }

  /** Push end time (s since the press) the run is heading for, given the release so far. */
  private pushEndFor(r: NonNullable<Injector["run"]>): number {
    const start = r.trace.pushStart;
    if (r.plan.kind === "puff") return Infinity; // ends on volume
    const std = r.plan.pushS ?? STANDARD_PUSH_S;
    if (r.plan.kind === "held") return r.release === null ? Infinity : Math.max(start, r.release);
    // a press is a standard push; holding beyond it extends the push until release
    return start + Math.max(std, (r.release ?? Infinity) - start);
  }

  /** Integrate up to nowS (seconds, the lab's wall clock). Returns the live trace. */
  advance(nowS: number): InjectionTrace | null {
    const r = this.run;
    if (!r) return null;
    const tr = r.trace;
    const tNow = Math.min(nowS - r.t0, 120);
    const start = tr.pushStart;
    while (r.st.t + TRACE_DT <= tNow + 1e-9) {
      const t = r.st.t;
      let s: { q: number; c: number };
      if (t < start) {
        s = { q: 0, c: r.st.oldMl > 0 ? r.st.oldC : 1 };
        r.st.t += TRACE_DT;
      } else {
        // a press released before the standard push ends still gets the standard push
        const end = this.pushEndFor(r);
        const pushing = t < end && r.st.syringeMl > 1e-6;
        if (!pushing && tr.pushEnd === null) tr.pushEnd = t;
        s = stepPush(r.st, r.cc, pushing ? r.fCmd : 0, TRACE_DT);
        tr.peakPsi = Math.max(tr.peakPsi, Math.max(0, r.st.force - PLUNGER_FRICTION_N) / r.cc.area / PSI);
      }
      tr.q.push(s.q);
      tr.c.push(s.c);
      tr.volumeMl += s.q * TRACE_DT;
      tr.contrastMl += s.q * TRACE_DT * s.c;
      if (tr.pushEnd !== null) tr.tailMl = (tr.tailMl ?? 0) + s.q * TRACE_DT;
      r.peakQ = Math.max(r.peakQ, s.q);
    }
    if (r.st.syringeMl <= 1e-6) tr.empty = true;
    return tr;
  }

  /** True once the push is over and the flow has stopped. */
  done(): boolean {
    const r = this.run;
    if (!r) return true;
    const q = r.trace.q;
    return r.trace.pushEnd !== null && (q.length === 0 || q[q.length - 1] < 1e-4);
  }

  /** Close the current run: book its volume and update what the lumen holds. */
  finish() {
    const r = this.run;
    if (!r) return;
    const tr = r.trace;
    if (tr.pushEnd === null) tr.pushEnd = r.st.t;
    const dead = r.cc.deadMl;
    // lumen contents after the push: what is left of the old contents, the rest fresh contrast
    this.primed = dead > 0 ? Math.min(1, (r.st.oldMl * r.st.oldC + Math.max(0, dead - r.st.oldMl)) / dead) : 1;
    this.stats.totalMl += tr.volumeMl;
    if (tr.volumeMl > 0.05) {
      if (r.plan.kind === "puff") this.stats.puffs++;
      else this.stats.injections++;
      this.stats.last = { volumeMl: tr.volumeMl, tailMl: tr.tailMl ?? 0, peakFlow: r.peakQ, peakPsi: tr.peakPsi, kind: r.plan.kind, empty: !!tr.empty };
    }
    this.run = null;
  }
}
