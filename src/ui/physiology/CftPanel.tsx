// The coronary function test in ANOCA (physiology-anoca-cft; lesson pm-physiology-microvascular): a
// whole study on its own model clock, for the physiology lab to show in place of the pressure-wire
// panels when one of the ANOCA presets is chosen (src/simulation/physiology/ach.ts ANOCA_PRESETS).
//
// The operator gives low-dose GTN, injects saline for the resting and hyperaemic transit times (the
// volume and how briskly are chosen per injection; inconsistent injections scatter), runs IV adenosine
// and watches for its markers, reads CFR, IMR and FFR from the console, checks the drift at the ostium,
// prepares the room (pads, pacing, nitrate, atropine), then gives acetylcholine by the chosen regimen,
// side and route, films two views, asks about the pain, treats spasm and slowing, aspirates the guide
// and assigns the endotype and treatment direction.
//
// The screen shows what an operator sees: the pressure traces (the aortic trace stops while anything is
// injected through the guide), the ECG (the slowing, AV block and ST change are drawn, never named), the
// console's numbers, what the patient says and the narrowing on the last angiogram run as the operator
// judges it by eye (ach.ts angioEstimate; the measured value only with the guided aids or after the
// classification). Why a reading is wrong, the order errors and the answer appear only in the debrief,
// after the classification; the hyperaemia percentage and the log's hints (why an action went wrong,
// what to do next) appear only as guided teaching aids. Tips come from physiologyTips.ts
// (cftTipContext, rankCftTips) under the run's policy, and the run is logged once, at the
// classification. DEV: window.__lab["physiology-cft"] (context, tips, state, step, dispatch).
import { useCallback, useEffect, useRef, useState } from "react";
import { CUTOFF, TD_SALINE_ML, distalBeat } from "../../simulation/physiology";
import {
  ACH_PROTOCOLS,
  ANOCA_PRESETS,
  CFT_CHECKLIST,
  CFT_GTN_MAX_UG,
  CFT_IV_ADENOSINE_UG_KG_MIN,
  CFT_VIEWS,
  ENDOTYPES,
  MP_SPASM_LENGTH_MM,
  MP_SPASM_POS,
  TREATMENTS,
  adenosineRunning,
  cftCaseWith,
  cftHyperaemia,
  cftItems,
  cftPreset,
  cftPressures,
  cftReadings,
  cftReducer,
  cftVitals,
  constrictionNow,
  endotypeOf,
  initialCftState,
  nextAchStep,
  scoreCft,
  tdLastThree,
  wireOffset,
  type AchRegimen,
  type CftAction,
  type CftIvSite,
  type CftRoute,
  type CftSide,
  type CftState,
  type CftTreatment,
  type CftVitals,
  type Endotype,
} from "../../simulation/physiology/ach";
import { PATIENT_EVENT_THRESHOLDS } from "../lab/patientEvents";
import type { LaunchMode } from "../../content/schema";
import type { LabEvent } from "../../content/lab/tips";
import { registerLabHook } from "../../dev/labHooks";
import { cftTipContext, rankCftTips } from "../lab/physiologyTips";
import { runCaseId, useLabRun } from "../lab/labRun";
import { labScreens } from "../lab/visibility";
import { loadedTips, selectTips, tipsVisible, useTipsModule } from "../lab/useLabTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import LiveTrace from "../sim/LiveTrace";
import VesselStrip from "./VesselStrip";

/** Model clock step, s (setInterval, never requestAnimationFrame): 50 Hz, as the physiology lab's MODEL_STEP_S — MODEL PARAMETER. */
export const CFT_STEP_S = 0.02;
/** Where the assistant parked the sensor, mm beyond the guide tip (the lesson: at least 5 cm) — display. */
const SENSOR_MM = 60;

// --- traces drawn from the model -----------------------------------------------------------------

// The beat at a hyperaemia and an acetylcholine constriction, by preset, guide position, h and the
// constriction each to the nearest 0.02 (numeric key, cached). Spasm upstream of the sensor lowers Pd.
const beatCache = new Map<number, { pa: number[]; pd: number[] }>();
function beat(s: CftState, h: number, constriction: number): { pa: number[]; pd: number[] } {
  const hq = Math.round(h * 50);
  const cq = Math.max(0, Math.round(constriction * 50));
  const deep = s.guide === "deep";
  const key = ((Math.max(0, ANOCA_PRESETS.indexOf(cftPreset(s))) * 2 + (deep ? 1 : 0)) * 51 + cq) * 51 + hq;
  let b = beatCache.get(key);
  if (!b) {
    if (beatCache.size >= 400) beatCache.clear();
    b = distalBeat(cftCaseWith(s, cq / 50), hq / 50, 80, 0, deep);
    beatCache.set(key, b);
  }
  return b;
}

/** What the traces need at one moment, computed once per model step and shared by the three channels. */
interface TraceSnap {
  v: CftVitals;
  b: { pa: number[]; pd: number[] };
  shift: number;
  offset: number;
}
let snapState: CftState | null = null;
const snaps = new Map<number, TraceSnap>();
/** The trace snapshot at time t (no later than the model's time), memoised per state and model step. */
function snapAt(s: CftState, t: number): TraceSnap {
  if (snapState !== s) {
    snapState = s;
    snaps.clear();
  }
  const k = Math.round(Math.min(t, s.t) / CFT_STEP_S);
  let x = snaps.get(k);
  if (!x) {
    const tt = Math.min(k * CFT_STEP_S, s.t);
    const v = cftVitals(s, tt);
    x = { v, b: beat(s, cftHyperaemia(s, tt), constrictionNow(s, tt)), shift: v.map - cftPreset(s).case.map, offset: wireOffset(s, tt) };
    if (snaps.size >= 64) snaps.clear();
    snaps.set(k, x);
  }
  return x;
}

const phaseOf = (t: number, hr: number) => {
  const x = (t * Math.max(20, hr)) / 60;
  return x - Math.floor(x);
};

/** The aortic (guide) pressure the recorder draws at time t: zero while the recording is interrupted. */
export function cftPaAt(s: CftState, t: number): number {
  const { v, b, shift } = snapAt(s, t);
  if (!v.aorticTrace) return 0;
  return b.pa[Math.floor(phaseOf(t, v.hr) * b.pa.length)] + shift;
}

/** The distal (sensor) pressure at time t, with the wire's offset. */
export function cftPdAt(s: CftState, t: number): number {
  const { v, b, shift, offset } = snapAt(s, t);
  return b.pd[Math.floor(phaseOf(t, v.hr) * b.pd.length)] + shift + offset;
}

const g = (x: number, c: number, w: number, a: number) => a * Math.exp(-(((x - c) / w) ** 2));

/** A schematic ECG lead at time t, mV: P, QRS, ST and T; with AV block the P waves march through at the sinus rate. */
export function cftEcgAt(s: CftState, t: number): number {
  const { v } = snapAt(s, t);
  const rr = 60 / Math.max(20, v.hr);
  const st = v.ecg === "st-elevation" ? 0.3 : v.ecg === "st-depression" ? -0.18 : 0;
  const qrs = (tau: number, wide: boolean) => {
    const k = wide ? 1.8 : 1;
    return g(tau, 0.16, 0.012 * k, -0.12) + g(tau, 0.18, 0.012 * k, 1.1) + g(tau, 0.2, 0.014 * k, -0.25) + (tau > 0.23 && tau < 0.36 ? st : 0) + g(tau, 0.42, 0.05, 0.3 + st * 0.5);
  };
  if (v.av === 3) {
    const pp = 60 / Math.max(20, v.sinusHr);
    const tp = t - Math.floor(t / pp) * pp;
    const tv = t - Math.floor(t / rr) * rr;
    return g(tp, 0.05, 0.025, 0.15) + qrs(tv, !v.paced);
  }
  const tau = t - Math.floor(t / rr) * rr;
  return g(tau, 0.05, 0.025, 0.15) + qrs(tau, false);
}

/**
 * The narrowing of the last angiogram run for the vessel strip: as the operator judges it by eye
 * (CftAngio.looks) on the live screen, the measured value only when `measured` (the guided aids, or
 * after the classification).
 */
export function angioStripLesions(s: CftState, measured: boolean): { id: string; pos: number; ds: number; lengthMm: number }[] {
  const a = s.angios[s.angios.length - 1];
  if (!a) return [];
  const ds = measured ? a.constriction : a.looks;
  return ds > 0.05 ? [{ id: "ach", pos: MP_SPASM_POS, ds, lengthMm: MP_SPASM_LENGTH_MM }] : [];
}

// --- the panel -----------------------------------------------------------------------------------

export interface CftPanelProps {
  presetId: string;
  mode?: LaunchMode | null;
  /** events a launch added for the run */
  extra?: readonly LabEvent[];
  seed?: string;
}

const num = (x: string) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

export default function CftPanel({ presetId, mode = null, extra = [], seed = "1" }: CftPanelProps) {
  const [runKey, setRunKey] = useState(0);
  const ref = useRef<CftState>(initialCftState(presetId, seed));
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // a new preset (or a repeat) starts a fresh study
  useEffect(() => {
    ref.current = initialCftState(presetId, `${seed}:${runKey}`);
    bump();
  }, [presetId, seed, runKey, bump]);

  const s = ref.current;
  const p = cftPreset(s);
  const run = useLabRun("physiology", runCaseId("physiology", presetId), mode, { runKey: `${presetId}:${runKey}`, caseName: `Coronary function test: ${p.title}` });
  const runRef = useRef(run);
  runRef.current = run;

  const dispatch = useCallback(
    (a: CftAction) => {
      const before = ref.current;
      const after = cftReducer(before, a);
      ref.current = after;
      if (a.type === "classify" && !before.answer && after.answer) {
        const lr = runRef.current;
        const pr = cftPreset(after);
        lr.decide({ id: "endotype", stage: "decision", label: "Endotype", correct: after.answer.endotype === pr.endotype, expected: endotypeOf(pr.endotype).label, given: endotypeOf(after.answer.endotype).label, lessonId: "pm-physiology-microvascular" });
        for (const it of cftItems(after)) if (it.id !== "endotype") lr.decide({ id: `cft-${it.id}`, stage: "physiology", label: it.label, correct: it.ok, expected: "done", given: it.ok ? "done" : "not done", lessonId: it.lessonId, ...(it.tipIds ? { tipIds: it.tipIds } : {}) });
        const sc = scoreCft(after);
        lr.finish({ score: sc.score, passed: sc.passed, metrics: sc.metrics, durationS: Math.round(after.t) });
      }
      bump();
    },
    [bump]
  );

  // the model clock: lab time follows wall time in CFT_STEP_S steps (at most 0.5 s per call)
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      ref.current = cftReducer(ref.current, { type: "tick", dt });
    }, CFT_STEP_S * 1000);
    const ui = setInterval(bump, 250);
    return () => {
      clearInterval(id);
      clearInterval(ui);
    };
  }, [bump]);

  const mod = useTipsModule();
  const context = cftTipContext(s, { extra });
  const visible = tipsVisible(run);
  const tips = visible && mod ? rankCftTips(mod, selectTips(mod, context, run, 40), context, 5) : [];

  // DEV: window.__lab["physiology-cft"]
  useEffect(
    () =>
      registerLabHook("physiology-cft", {
        context: () => cftTipContext(ref.current, { extra }),
        tips: () => {
          const m = loadedTips();
          const ctx = cftTipContext(ref.current, { extra });
          return rankCftTips(m, selectTips(m, ctx, runRef.current.run, 40), ctx, 5).map((t) => t.id);
        },
        state: () => ({ session: ref.current, vitals: cftVitals(ref.current), readings: cftReadings(ref.current) }),
        events: () => cftTipContext(ref.current, { extra }).events ?? [],
        step: (seconds: number, dt = CFT_STEP_S) => {
          let left = Math.max(0, seconds);
          while (left > 1e-9) {
            const h = Math.min(dt, left);
            ref.current = cftReducer(ref.current, { type: "tick", dt: h });
            left -= h;
          }
          bump();
        },
        dispatch,
      } as Parameters<typeof registerLabHook>[1] & { dispatch: (a: CftAction) => void }),
    [dispatch, bump, extra]
  );

  const screens = labScreens(run.policy);
  const aids = screens.attendingDrawer;
  const done = s.answer !== null;
  const v = cftVitals(s);
  const pr = cftPressures(s);
  const rd = cftReadings(s);
  const h = cftHyperaemia(s);
  const lastAngio = s.angios[s.angios.length - 1];
  const measured = aids || done;
  const shown = angioStripLesions(s, measured);

  return (
    <div className="space-y-4">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp(s.t)} />
      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="panel p-4">
            <div className="stat-label mb-1">Case</div>
            <div className="text-[14.5px] text-ink leading-relaxed">{p.brief}</div>
          </div>

          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span>Aortic (guide) and distal (sensor) pressure</span>
              <span className="font-mono normal-case tracking-normal">
                <span className="text-art">Pa {v.aorticTrace ? Math.round(pr.pa) : "--"}</span> · <span className="text-yellow-300">Pd {Math.round(pr.pd)}</span> ·{" "}
                <span className="text-yellow-300">Pd/Pa {v.aorticTrace ? pr.pdpa.toFixed(2) : "--"}</span>
              </span>
            </div>
            {aids && <div className="px-3 py-1 text-[12px] text-ink-faint border-b border-line">Teaching aid: hyperaemia {Math.round(h * 100)}%</div>}
            <div className="p-2 monitor">
              <LiveTrace
                channels={[
                  { fn: (t) => cftPaAt(ref.current, t), color: "#ff5d6c", label: "Pa" },
                  { fn: (t) => cftPdAt(ref.current, t), color: "#facc15", label: "Pd" },
                ]}
                min={0}
                max={160}
                height={170}
                seconds={5}
                clock={() => ref.current.t}
              />
            </div>
            <div className="panel-head">
              <span>ECG</span>
              <span className="font-mono normal-case tracking-normal text-good">HR {Math.round(v.hr)}</span>
            </div>
            <div className="p-2 monitor">
              <LiveTrace channels={[{ fn: (t) => cftEcgAt(ref.current, t), color: "#4ade80", label: "II" }]} min={-0.8} max={1.4} height={90} seconds={5} unit="mV" gridStep={1} clock={() => ref.current.t} />
            </div>
            <div className="px-3 py-2 text-[13px] text-ink-soft border-t border-line" aria-live="polite">
              {v.pain >= PATIENT_EVENT_THRESHOLDS.chestPainScore ? "The patient says: \"I've got the pain in my chest.\"" : v.systemic ? "The patient says they can feel the drug working." : "The patient is comfortable."}
            </div>
            <VesselStrip lesions={[...p.case.lesions, ...shown]} lengthMm={p.case.lengthMm} diffuse={p.case.diffuse} sensorMm={SENSOR_MM} sensorFromTipMm={30} wireIn guideEngaged disabled />
            <div className="px-3 pb-2 text-[12px] text-ink-faint">{lastAngio ? `Last angiogram: ${CFT_VIEWS.find((x) => x.id === lastAngio.view)?.label} at ${Math.round(lastAngio.t)} s` : "No angiogram recorded in this study yet."}</div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Thermo s={s} dispatch={dispatch} disabled={done} />
            <Drugs s={s} dispatch={dispatch} disabled={done} />
            <Ach s={s} dispatch={dispatch} disabled={done} />
          </div>

          <Classify key={`${presetId}:${runKey}`} s={s} dispatch={dispatch} onRepeat={() => setRunKey((k) => k + 1)} />
        </div>

        <div className="xl:col-span-4 space-y-4">
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp(s.t)} events={context.events} />
          <div className="panel p-3">
            <div className="stat-label mb-2">Console</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[13px]">
              <Read label="CFR" value={rd.cfr !== null ? rd.cfr.toFixed(1) : "--"} />
              <Read label="IMR" value={rd.imr !== null ? String(Math.round(rd.imr)) : "--"} />
              <Read label="FFR" value={rd.ffr !== null ? rd.ffr.toFixed(2) : "--"} />
            </div>
            <Series label="Resting Tmn, s" times={rd.rest} />
            <Series label="Hyperaemic Tmn, s" times={rd.hyp} />
          </div>
          <div className="panel p-3 max-h-[320px] overflow-auto">
            <div className="stat-label mb-1">Log</div>
            <ul className="text-[12.5px] space-y-0.5 font-mono">
              {s.log
                .slice(-40)
                .reverse()
                .map((e, i) => (
                  <li key={i} className={e.bad && measured ? "text-warn" : "text-ink-soft"}>
                    {Math.round(e.t)} s · {e.label}: {e.value}
                    {e.note ? ` (${e.note})` : ""}
                    {e.hint && measured ? ` (${e.hint})` : ""}
                  </li>
                ))}
            </ul>
          </div>
          <div className="panel p-3 text-[12px] text-ink-faint leading-relaxed">
            Thresholds used: FFR ≤ {CUTOFF.ffr} means an epicardial lesion; CFR &lt; {CUTOFF.cfr} (CorMicA; UK consensus &lt; {CUTOFF.cfrUk}); IMR ≥ {CUTOFF.imr}; drift at the ostium {CUTOFF.cftDrift} or more means re-equalise and repeat. Three transit
            times within 10%. Doses are typical; follow local protocol.
          </div>
        </div>
      </div>
    </div>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line px-2 py-1.5">
      <div className="stat-label">{label}</div>
      <div className="text-ink text-[15px]">{value}</div>
    </div>
  );
}

function Series({ label, times }: { label: string; times: readonly number[] }) {
  const last = new Set(tdLastThree(times).map((_, i) => times.length - 1 - i));
  return (
    <div className="mt-2">
      <div className="stat-label">{label}</div>
      <div className="text-[12.5px] font-mono text-ink-soft flex flex-wrap gap-x-2">
        {times.length ? times.map((t, i) => <span key={i} className={last.has(i) ? "text-ink" : "text-ink-faint"}>{t.toFixed(2)}</span>) : <span className="text-ink-faint">none</span>}
      </div>
    </div>
  );
}

interface PartProps {
  s: CftState;
  dispatch: (a: CftAction) => void;
  disabled: boolean;
}

function Thermo({ s, dispatch, disabled: d }: PartProps) {
  const [vol, setVol] = useState(String(TD_SALINE_ML.min));
  const [brisk, setBrisk] = useState(true);
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">Thermodilution and wire</div>
      <div className="flex items-center gap-1.5">
        <select className="field !h-8" value={vol} onChange={(e) => setVol(e.target.value)} disabled={d} aria-label="Saline volume, mL">
          {["2", "3", "4", "5"].map((x) => (
            <option key={x} value={x}>
              {x} mL
            </option>
          ))}
        </select>
        <select className="field !h-8" value={brisk ? "brisk" : "slow"} onChange={(e) => setBrisk(e.target.value === "brisk")} disabled={d} aria-label="Injection speed">
          <option value="brisk">brisk</option>
          <option value="slow">slow</option>
        </select>
      </div>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "saline", volumeMl: num(vol), brisk })} disabled={d}>
        Inject room-temperature saline
      </button>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "drift-check" })} disabled={d}>
        Drift check at the ostium
      </button>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "re-equalise" })} disabled={d}>
        Re-equalise at the guide tip
      </button>
      <button className="btn btn-ghost w-full !justify-start text-[13px]" onClick={() => dispatch({ type: "guide", position: s.guide === "deep" ? "engaged" : "deep" })} disabled={d}>
        {s.guide === "deep" ? "Back the guide off to a coaxial position" : "Seat the guide more deeply"}
      </button>
    </div>
  );
}

function Drugs({ s, dispatch, disabled: d }: PartProps) {
  const [gtn, setGtn] = useState(String(CFT_GTN_MAX_UG));
  const [rate, setRate] = useState(String(CFT_IV_ADENOSINE_UG_KG_MIN));
  const [site, setSite] = useState<CftIvSite>("peripheral");
  const running = adenosineRunning(s);
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">Drugs and orders</div>
      <div className="flex items-center gap-1.5">
        <input type="number" min={0} className="field w-20 !h-8" value={gtn} onChange={(e) => setGtn(e.target.value)} disabled={d} aria-label="Intracoronary GTN, µg" />
        <span className="text-[12px] text-ink-faint">µg</span>
        <button className="btn !px-2" onClick={() => num(gtn) > 0 && dispatch({ type: "gtn", doseUg: num(gtn) })} disabled={d || !(num(gtn) > 0)}>
          IC GTN
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <input type="number" min={0} className="field w-20 !h-8" value={rate} onChange={(e) => setRate(e.target.value)} disabled={d || running} aria-label="IV adenosine, µg/kg/min" />
        <select className="field !h-8" value={site} onChange={(e) => setSite(e.target.value as CftIvSite)} disabled={d || running} aria-label="Vein">
          <option value="peripheral">antecubital</option>
          <option value="central">central</option>
        </select>
      </div>
      <button className={`btn w-full !justify-start ${running ? "btn-good" : ""}`} onClick={() => dispatch(running ? { type: "stop-adenosine" } : { type: "iv-adenosine", rate: num(rate), site })} disabled={d || (!running && !(num(rate) > 0))}>
        {running ? "Stop IV adenosine" : "Start IV adenosine (µg/kg/min)"}
      </button>
      <div className="grid grid-cols-2 gap-1.5">
        <button className="btn !px-2" onClick={() => dispatch({ type: "ic-nitrate" })} disabled={d}>
          IC nitrate
        </button>
        <button className="btn !px-2" onClick={() => dispatch({ type: "ic-atropine" })} disabled={d}>
          IC atropine
        </button>
        <button className="btn !px-2" onClick={() => dispatch({ type: "iv-atropine" })} disabled={d || s.ivAtropineAt !== null}>
          IV atropine
        </button>
        <button className={`btn !px-2 ${s.pacing ? "btn-good" : ""}`} onClick={() => dispatch({ type: "pacing", on: !s.pacing })} disabled={d}>
          {s.pacing ? "Pacing off" : "Pacing on"}
        </button>
      </div>
      <button className="btn btn-ghost w-full !justify-start text-[13px]" onClick={() => dispatch({ type: "ask-pain" })} disabled={d}>
        Ask: "Is this your usual pain?"
      </button>
    </div>
  );
}

function Ach({ s, dispatch, disabled: d }: PartProps) {
  const [regimen, setRegimen] = useState<AchRegimen>("uk-bolus");
  const [side, setSide] = useState<CftSide>("left");
  const [route, setRoute] = useState<CftRoute>("guide");
  const step = nextAchStep(s, regimen, side);
  const next = step !== null ? ACH_PROTOCOLS[regimen].steps[side][step] : null;
  const fmt = (x: number) => (x < 1 ? x.toFixed(2) : String(Math.round(x * 10) / 10));
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">Acetylcholine</div>
      <div className="space-y-0.5">
        {CFT_CHECKLIST.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <input type="checkbox" checked={s.checklist.includes(c.id)} onChange={() => dispatch({ type: "check", item: c.id })} disabled={d || s.checklist.includes(c.id)} />
            {c.label}
          </label>
        ))}
      </div>
      <select className="field !h-8 w-full" value={regimen} onChange={(e) => setRegimen(e.target.value as AchRegimen)} disabled={d} aria-label="Regimen">
        {(Object.keys(ACH_PROTOCOLS) as AchRegimen[]).map((r) => (
          <option key={r} value={r}>
            {r === "uk-bolus" ? "Single bolus" : r === "stepped" ? "Stepped boluses" : "Graded infusion"}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <select className="field !h-8" value={side} onChange={(e) => setSide(e.target.value as CftSide)} disabled={d} aria-label="Coronary">
          <option value="left">left coronary</option>
          <option value="right">RCA</option>
        </select>
        <select className="field !h-8" value={route} onChange={(e) => setRoute(e.target.value as CftRoute)} disabled={d} aria-label="Route">
          <option value="guide">via the guide</option>
          <option value="microcatheter">via a microcatheter</option>
        </select>
      </div>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "ach", regimen, side, route })} disabled={d || !next}>
        {next ? `Give ${fmt(next.doseUg)} µg over ${next.durationS} s` : "Regimen complete"}
      </button>
      <div className="grid grid-cols-3 gap-1.5">
        <button className="btn !px-2" onClick={() => dispatch({ type: "stop-ach" })} disabled={d}>
          Stop
        </button>
        <button className="btn !px-2" onClick={() => dispatch({ type: "aspirate-guide" })} disabled={d}>
          Aspirate
        </button>
        <button className="btn !px-2" onClick={() => dispatch({ type: "flush-guide" })} disabled={d}>
          Flush
        </button>
      </div>
      <div className="stat-label pt-1">Angiogram</div>
      <div className="grid grid-cols-2 gap-1.5">
        {CFT_VIEWS.map((x) => (
          <button key={x.id} className="btn !px-2 text-[12px]" onClick={() => dispatch({ type: "angio", view: x.id })} disabled={d}>
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Classify({ s, dispatch, onRepeat }: { s: CftState; dispatch: (a: CftAction) => void; onRepeat: () => void }) {
  const [endotype, setEndotype] = useState<Endotype | null>(null);
  const [treatment, setTreatment] = useState<CftTreatment | null>(null);
  const p = cftPreset(s);
  const done = s.answer !== null;
  const items = done ? cftItems(s) : [];
  return (
    <div className="panel p-4">
      <div className="stat-label mb-2">Endotype and treatment direction</div>
      <div className="grid md:grid-cols-2 gap-2">
        {ENDOTYPES.map((e) => {
          const right = done && e.id === p.endotype;
          const chosen = (done ? s.answer!.endotype : endotype) === e.id;
          return (
            <button
              key={e.id}
              disabled={done}
              onClick={() => setEndotype(e.id)}
              className={`text-left rounded-lg border px-3 py-2 text-[14px] ${!done ? (chosen ? "border-accent/60 text-ink" : "border-line hover:border-accent/50 text-ink-soft") : right ? "border-good/60 bg-good/[0.08] text-ink" : chosen ? "border-danger/60 bg-danger/[0.08]" : "border-line opacity-50"}`}
            >
              {e.label}
            </button>
          );
        })}
      </div>
      <select className="field mt-2 w-full" value={treatment ?? ""} onChange={(e) => setTreatment((e.target.value || null) as CftTreatment | null)} disabled={done} aria-label="Treatment direction">
        <option value="">Treatment direction…</option>
        {TREATMENTS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      {!done && (
        <button className="btn mt-2" disabled={!endotype} onClick={() => endotype && dispatch({ type: "classify", endotype, treatment })}>
          Record the endotype
        </button>
      )}
      {done && (
        <div className="mt-3 animate-fadein text-[14px] text-ink-soft leading-relaxed">
          <p>{p.teaching}</p>
          <p className="text-[13px] mt-1">{endotypeOf(p.endotype).definition}.</p>
          <div className="stat-label mt-3 mb-1">The study</div>
          <ul className="text-[13px] space-y-0.5">
            {items.map((it) => (
              <li key={it.id} className={it.ok ? "text-good" : "text-warn"}>
                {it.ok ? "✓" : "○"} {it.label}
              </li>
            ))}
          </ul>
          {s.errors.length > 0 && (
            <>
              <div className="stat-label mt-3 mb-1">Order and safety</div>
              <ul className="text-[13px] space-y-0.5">
                {s.errors.map((e) => (
                  <li key={e.id} className="text-warn">
                    {Math.round(e.t)} s · {e.label}
                  </li>
                ))}
              </ul>
            </>
          )}
          {s.injections.some((i) => i.problems.length) && (
            <>
              <div className="stat-label mt-3 mb-1">Injections not to trust</div>
              <ul className="text-[13px] space-y-0.5">
                {s.injections
                  .filter((i) => i.problems.length)
                  .map((i, k) => (
                    <li key={k} className="text-warn">
                      {Math.round(i.t)} s · {i.state === "rest" ? "rest" : "hyperaemia"} {i.tmn.toFixed(2)} s: {i.problems.join("; ")}
                    </li>
                  ))}
              </ul>
            </>
          )}
          <button className="btn mt-3" onClick={onRepeat}>
            Repeat this study
          </button>
        </div>
      )}
    </div>
  );
}
