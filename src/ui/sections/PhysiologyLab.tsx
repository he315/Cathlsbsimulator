// Pressure-wire lab: set up the wire (zero, introduce, introducer out, flush, equalise), cross,
// hyperaemia, FFR and the wave-free ratio, pullback, thermodilution CFR/IMR, the drift check and a
// treatment decision (physiology-engine-unify-and-setup).
//
// The study is a pressure-wire session (src/simulation/pci/pwSession.ts), the same reducer the PCI
// lab's pressure-wire console uses, with the set-up faults of lesson pm-physiology-setup as presets.
// The patient is a PatientEngine (profile fitted to the preset's mean aortic pressure) on a model
// clock: a setInterval steps the engine and the session at 50 Hz (MODEL_STEP_S), never
// requestAnimationFrame, and window.__lab.physiology.step(seconds) advances it by hand in DEV builds.
// Each step feeds the engine's mean aortic pressure, heart rate and rhythm into the case
// (pwSession.pwPatientInput), and what the operator does is given to the engine through the session's
// adapter (pwSession.setUpPwEngine once the engine is built, applyPwActionToEngine after each action):
// the vasodilator at the dose, rate, route and site as delivered (none of a saline swap, part of it
// through a tissued line), the guide flush, contrast, the intracoronary nitrate and the bedside orders,
// with the preset's caffeine and adenosine hazard model, so the blood pressure, heart rate and rhythm
// answer them (a fall in pressure, AV block, AF or VF where the preset asks for them); the aortic (guide)
// channel is the engine's transduced arterial line, so air in it and contrast in the guide damp the
// trace the operator sees (Transducer.setAir, Transducer.setContrast), and a guide that obstructs
// the ostium is a tip input to the engine. The distal channel is the engine's tip pressure less the
// stenosis loss of physiology.ts at the sensor, with the wire's offset.
//
// The screen shows what an operator sees: the traces, the console's Pa, Pd and Pd/Pa, and the log.
// Why a reading is wrong appears only as a guided teaching aid and in the debrief; the case's
// teaching text appears only after the decision. Tips come from src/ui/lab/physiologyTips.ts under
// the run's policy (useLabRun); the run is logged once, at the decision.
//
// Left main and aorto-ostial presets (physiology-left-main-and-ostial): in a branched preset the strip
// shows the left main and both branches with a selector that steers the wire into the LAD or the
// circumflex (session action "branch"), the distal channel is labelled with the branch, the last
// pullback of each branch is kept for comparison, and the debrief names the branch of each measurement.
// The trace head shows whether the guide is engaged, as the operator knows it.
import { useCallback, useEffect, useRef, useState } from "react";
import { CUTOFF, HR, bifurcationPos, presetView, reading } from "../../simulation/physiology";
import { PatientEngine, SAMPLE_HZ, type Vitals } from "../../simulation/patient/engine";
import { generatePatient, type PatientProfile } from "../../simulation/patient/patient";
import type { TipInput } from "../../simulation/patient/transducer";
import {
  IC_ADENOSINE_LEGACY_UG,
  IC_GTN_UG as PW_IC_GTN_UG,
  MP_INTRODUCER_LEAK_MMHG,
  MP_INTRODUCER_TAU_S,
  MP_LM_LENGTH_MM,
  PHYSIOLOGY_PRESETS,
  PRESET_BY_ID,
  SENSOR_FROM_TIP_MM,
  applyPwActionToEngine,
  consoleReading,
  decisionAccepted,
  hyperaemia,
  initialPwSession,
  measuredCase,
  pathCase,
  presetLesions,
  processItems,
  pwPatientInput,
  pwSessionReducer,
  scorePwSession,
  sensorX,
  sessionCase,
  sessionPreset,
  setUpPwEngine,
  type PhysiologyPreset,
  type PwAction,
  type PwSessionState,
} from "../../simulation/pci/pwSession";
import { LAB_EVENTS, type LabContext, type LabEvent } from "../../content/lab/tips";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { registerLabHook } from "../../dev/labHooks";
import { PATIENT_EVENT_THRESHOLDS, PatientEventAdapter } from "../lab/patientEvents";
import { physiologyTipContext, rankPhysiologyTips } from "../lab/physiologyTips";
import { runCaseId, useLabRun } from "../lab/labRun";
import { labScreens } from "../lab/visibility";
import { loadedTips, selectTips, tipsVisible, useTipsModule } from "../lab/useLabTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import SetupPanel from "../physiology/SetupPanel";
import MeasurePanel, { MeasurementLog, ThermoPanel } from "../physiology/MeasurePanel";
import TraceView from "../physiology/TraceView";
import PullbackPlot from "../physiology/PullbackPlot";
import VesselStrip from "../physiology/VesselStrip";
import SectionShell from "../SectionShell";

// --- the rig: engine and session on the model clock (no React) ---------------------------------

/** Model clock step, s: the engine and the session advance together at 50 Hz — MODEL PARAMETER. */
export const MODEL_STEP_S = 0.02;
/** Open fraction of the ostium around an engaged guide that does not obstruct it (transducer.ts TipInput.gap) — MODEL PARAMETER. */
export const MP_GUIDE_ENGAGED_GAP = 0.8;
/** ... and around a deeply seated guide (the value tipFromEngagement uses for a deep left guide) — MODEL PARAMETER. */
export const MP_GUIDE_WEDGE_GAP = 0.13;
/** Intracoronary adenosine bolus per side the plain IC action gives, µg (pwSession.IC_ADENOSINE_LEGACY_UG, cited there). */
export const IC_ADENOSINE_UG = IC_ADENOSINE_LEGACY_UG;
/** Intracoronary nitrate (GTN), µg (pwSession.IC_GTN_UG, cited there). */
export const IC_GTN_UG = PW_IC_GTN_UG;
/** Pulse pressure the profile is built with before its MAP is fitted, mmHg (physiology.ts aorticPressure uses 45) — MODEL PARAMETER. */
const MP_PULSE_MMHG = 45;
/**
 * Lowest resting heart rate the profile keeps, bpm: this margin above the bradycardia event threshold
 * (patientEvents.ts PATIENT_EVENT_THRESHOLDS.bradycardiaHr), so a slow seeded resting rate does not raise
 * the bradycardia event (and its adenosine heart-block tip) before any adenosine is given — MODEL PARAMETER.
 */
export const MP_MIN_REST_HR = PATIENT_EVENT_THRESHOLDS.bradycardiaHr + 5;

/**
 * A patient for a preset: a seeded stable-angina profile in sinus rhythm, its resting rate at least
 * MP_MIN_REST_HR, whose resting mean aortic pressure is fitted to the case's MAP (one correction after a
 * 6 s probe of the engine).
 */
export function physiologyProfile(preset: PhysiologyPreset, seed: string): PatientProfile {
  const p0 = generatePatient(`physiology:${preset.id}:${seed}`, { indication: "SA" });
  const target = preset.case.map;
  let p: PatientProfile = { ...p0, baseline: { ...p0.baseline, rhythm: "sinus", hr: Math.max(p0.baseline.hr, MP_MIN_REST_HR), sbp: Math.round(target + (2 * MP_PULSE_MMHG) / 3), dbp: Math.round(target - MP_PULSE_MMHG / 3) } };
  const probe = new PatientEngine({ profile: p, lesions: [] });
  probe.setTip({ location: "aorta" });
  probe.advance(6);
  const k = target / Math.max(30, probe.vitals().aortaTrue.mean);
  p = { ...p, baseline: { ...p.baseline, sbp: Math.round(p.baseline.sbp * k), dbp: Math.round(p.baseline.dbp * k) } };
  return p;
}

/** The guide as a tip input to the engine: in the aorta when disengaged, at the ostium when engaged. */
export function guideTip(s: PwSessionState): TipInput {
  if (!s.guideEngaged) return { location: "aorta" };
  const c = sessionCase(s);
  return { location: "ostium", side: c.vessel === "RCA" ? "right" : "left", gap: c.guideObstructs ? MP_GUIDE_WEDGE_GAP : MP_GUIDE_ENGAGED_GAP };
}

export class PhysiologyRig {
  readonly engine: PatientEngine;
  session: PwSessionState;
  /** events a launch added for the whole run */
  readonly extra: LabEvent[];
  private readonly adapter = new PatientEventAdapter();
  private patientEv: LabEvent[] = [];
  private beats: { t: number; rr: number }[] = [];
  /** engine time at lab time 0 */
  private readonly t0: number;

  constructor(presetId: string, seed = "1", extra: LabEvent[] = []) {
    this.session = initialPwSession(presetId, seed);
    this.extra = extra;
    this.engine = new PatientEngine({ profile: physiologyProfile(sessionPreset(this.session), seed), lesions: [] });
    this.engine.transducer.zero();
    this.applyLine();
    // the preset's caffeine, adenosine hazard model and a colleague's bolus; the session keeps the patient's dominance
    this.session = setUpPwEngine(this.engine, this.session);
    this.t0 = this.engine.time;
  }

  /** Lab time, s. */
  get t(): number {
    return this.session.t;
  }

  dispatch(a: PwAction): void {
    const before = this.session;
    this.session = pwSessionReducer(before, a);
    this.applyLine();
    // what the operator did, as the engine receives it (nothing when the action changed nothing)
    applyPwActionToEngine(this.engine, before, this.session, a);
  }

  /** Carry the session's aortic line and guide position over to the engine. */
  private applyLine(): void {
    const s = this.session;
    this.engine.transducer.setAir(s.airMl);
    this.engine.transducer.setContrast(s.contrastFrac);
    this.engine.setTip(guideTip(s));
  }

  /** Advance the engine and the session by `seconds` of lab time in MODEL_STEP_S steps. */
  step(seconds: number, dt = MODEL_STEP_S): void {
    let left = Math.max(0, seconds);
    while (left > 1e-9) {
      const h = Math.min(dt, left);
      this.engine.advance(h);
      for (const b of this.engine.drainBeats()) this.beats.push({ t: b.t, rr: b.rr });
      if (this.beats.length > 40) this.beats.splice(0, this.beats.length - 40);
      this.engine.drainEvents();
      const v = this.engine.vitals();
      this.patientEv = this.adapter.update(v);
      this.session = pwSessionReducer(this.session, { type: "tick", dt: h, patient: pwPatientInput(v) });
      left -= h;
    }
  }

  vitals(): Vitals {
    return this.engine.vitals();
  }

  context(): LabContext {
    return physiologyTipContext(this.session, this.engine.vitals(), { patientEvents: this.patientEv, extra: this.extra });
  }

  /** A monitor sample of the engine at lab time t (nearest; clamped to the samples held). */
  private sample(ring: Float32Array, t: number): number {
    const tr = this.engine.trace;
    if (!tr.count) return 0;
    const tNew = tr.t[tr.idx(0)];
    const k = Math.max(0, Math.min(tr.count - 1, Math.round((tNew - (t + this.t0)) * SAMPLE_HZ)));
    return ring[tr.idx(k)];
  }

  /** The displayed aortic (guide) pressure: the engine's transduced line, with the introducer's leak and lag. */
  paAt(t: number): number {
    const s = this.session;
    const art = this.engine.trace.art;
    if (!s.introducer) return this.sample(art, t);
    // a first-order lag approximated by the mean over two time constants
    const n = Math.max(1, Math.round(2 * MP_INTRODUCER_TAU_S * SAMPLE_HZ));
    let sum = 0;
    for (let i = 0; i < n; i++) sum += this.sample(art, t - i / SAMPLE_HZ);
    return sum / n - MP_INTRODUCER_LEAK_MMHG;
  }

  /** Cardiac phase (0..1) of engine time te from the R waves. */
  private phaseAt(te: number): number {
    for (let i = this.beats.length - 1; i >= 0; i--) {
      const b = this.beats[i];
      if (b.t <= te) {
        const rr = i + 1 < this.beats.length ? this.beats[i + 1].t - b.t : b.rr;
        return Math.min(0.999, (te - b.t) / Math.max(0.2, rr));
      }
    }
    return 0;
  }

  /** The displayed distal pressure: the tip pressure at the guide tip less the stenosis loss at the sensor, with the wire's offset. */
  pdAt(t: number): number {
    const s = this.session;
    const rr = 60 / Math.max(20, s.hr || HR);
    const tl = t - s.wireLag * rr;
    const ph = this.phaseAt(tl + this.t0);
    const c = measuredCase(s);
    const r = reading(c, ph * (60 / HR), sensorX(s), hyperaemia(s, t), s.guideEngaged, 0);
    return this.sample(this.engine.trace.tipTrue, tl) - (r.pa - r.pd) + s.wire.offset;
  }
}

// --- launch -----------------------------------------------------------------------------------

/** The preset, mode and events a launch asks for, or null when it names no known preset. */
export function launchPreset(p: LaunchParams): { presetId: string; mode: LaunchMode | null; events: LabEvent[] } | null {
  const id = p.scenario ?? p.preset ?? PHYSIOLOGY_PRESETS[0].id;
  if (!PRESET_BY_ID[id]) return null;
  const raw: unknown = (p as Record<string, unknown>).events;
  const names = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : []).map((e) => String(e).trim()).filter(Boolean);
  const events = names.filter((e): e is LabEvent => (LAB_EVENTS as readonly string[]).includes(e));
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { presetId: id, mode, events };
}

const DECISIONS: { id: PhysiologyPreset["case"]["decision"]; label: string }[] = [
  { id: "treat", label: "Physiologically significant: treat with PCI" },
  { id: "defer", label: "Not significant or not focal: defer PCI, optimise medical therapy" },
  { id: "treat-first-then-remeasure", label: "Treat the lesion with the larger step first, then re-measure" },
  { id: "microvascular", label: "No epicardial target: microvascular dysfunction, treat medically and consider spasm testing" },
  // physiology-left-main-and-ostial: where pressure cannot settle a left main (downstream disease, a high right atrial pressure)
  { id: "imaging", label: "Physiology cannot settle this lesion: assess it with intravascular imaging" },
];

// --- the lab ------------------------------------------------------------------------------------

export default function PhysiologyLab() {
  const [presetId, setPresetId] = useState(PHYSIOLOGY_PRESETS[0].id);
  const [launchMode, setLaunchMode] = useState<LaunchMode | null>(null);
  const [runKey, setRunKey] = useState(0);
  const rigRef = useRef<PhysiologyRig | null>(null);
  if (!rigRef.current) rigRef.current = new PhysiologyRig(presetId, "1");
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const rig = rigRef.current;
  const s = rig.session;
  const preset = sessionPreset(s);
  const c = sessionCase(s);

  const run = useLabRun("physiology", runCaseId("physiology", presetId), launchMode, { runKey, caseName: `Pressure wire lab: ${preset.title}` });
  const runRef = useRef(run);
  runRef.current = run;

  const load = useCallback(
    (id: string, mode: LaunchMode | null, events: LabEvent[] = []) => {
      rigRef.current = new PhysiologyRig(id, String(Date.now() % 100000), events);
      setPresetId(id);
      setLaunchMode(mode);
      setRunKey((k) => k + 1);
      bump();
    },
    [bump]
  );

  useLabLaunch("physiology", (p) => {
    const l = launchPreset(p);
    if (l) load(l.presetId, l.mode, l.events);
  });

  const dispatch = useCallback(
    (a: PwAction) => {
      const r = rigRef.current!;
      const before = r.session;
      r.dispatch(a);
      if (a.type === "decide" && !before.decision && r.session.decision) {
        const st = r.session;
        const p = sessionPreset(st);
        const lr = runRef.current;
        const label = (id?: string | null) => DECISIONS.find((d) => d.id === id)?.label ?? "none";
        lr.decide({ id: "decision", stage: "decision", label: "Treat or defer", correct: decisionAccepted(p, st.decision), expected: label(p.case.decision), given: label(st.decision), lessonId: "pm-physiology-when", tipIds: ["pci-phys-decide-before-measuring"] });
        for (const it of processItems(st)) lr.decide({ id: `setup-${it.id}`, stage: "physiology", label: it.label, correct: it.ok, expected: "done", given: it.ok ? "done" : "not done", lessonId: it.lessonId, ...(it.tipIds ? { tipIds: it.tipIds } : {}) });
        const sc = scorePwSession(st);
        lr.finish({ score: sc.score, passed: sc.passed, metrics: sc.metrics, durationS: Math.round(st.t) });
      }
      bump();
    },
    [bump]
  );

  // the model clock: lab time follows wall time in MODEL_STEP_S steps (at most 0.1 s per call)
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      rigRef.current?.step(dt);
    }, MODEL_STEP_S * 1000);
    const ui = setInterval(bump, 250);
    return () => {
      clearInterval(id);
      clearInterval(ui);
    };
  }, [bump]);

  // tips: the shared score, then the step's lessons (rankPhysiologyTips)
  const mod = useTipsModule();
  const context = rig.context();
  const visible = tipsVisible(run);
  const tips = visible && mod ? rankPhysiologyTips(mod, selectTips(mod, context, run, 40), context, s, 5) : [];

  // DEV: window.__lab.physiology
  useEffect(
    () =>
      registerLabHook("physiology", {
        context: () => rigRef.current!.context(),
        tips: () => {
          const r = rigRef.current!;
          const m = loadedTips();
          const ctx = r.context();
          return rankPhysiologyTips(m, selectTips(m, ctx, runRef.current.run, 40), ctx, r.session, 5).map((t) => t.id);
        },
        state: () => {
          const r = rigRef.current!;
          const v = r.vitals();
          return { session: r.session, console: r.session.wireIn ? consoleReading(r.session) : null, patient: { map: v.aortaTrue.mean, hr: v.hr, rhythm: v.rhythm, tipState: v.tipState, transducer: v.transducer } };
        },
        events: () => rigRef.current!.context().events ?? [],
        step: (seconds: number, dt?: number) => {
          rigRef.current!.step(seconds, dt);
          bump();
        },
        dispatch,
      } as Parameters<typeof registerLabHook>[1] & { dispatch: (a: PwAction) => void }),
    [dispatch, bump]
  );

  const screens = labScreens(run.policy);
  const aids = screens.attendingDrawer;
  const decided = s.decision !== null;
  // the controls lock at the decision, and open again once a lesion is stented for the re-measurement
  const locked = decided && s.treated.length === 0;
  const readout = s.wireIn ? consoleReading(s) : null;
  const h = hyperaemia(s);
  const items = decided ? processItems(s) : [];
  const recorded = s.records.filter((r) => r.kind === "ffr" || r.kind === "rest");
  // the vessel the wire runs along (the path into the active branch of a left main) and the branch selector
  const path = pathCase(s);
  const lm = preset.leftMain?.model ? preset.leftMain : null;
  const branchLabel = (id?: string | null) => lm?.branches.find((b) => b.id === id)?.label ?? id ?? "";
  const bif = bifurcationPos(path);
  const stentable = presetLesions(preset);

  return (
    <SectionShell
      title="Pressure wire lab"
      subtitle="Set up the pressure wire, recognise the faults that make a reading wrong, then measure: stenosis pressure loss, autoregulation, hyperaemia and phasic flow"
      actions={
        <select value={presetId} onChange={(e) => load(e.target.value, null)} className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink max-w-[340px]" aria-label="Case">
          {PHYSIOLOGY_PRESETS.map((k, i) => (
            <option key={k.id} value={k.id}>
              {i + 1}. {k.title}
            </option>
          ))}
        </select>
      }
    >
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp(s.t)} className="mb-4" />
      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="panel p-4">
            <div className="stat-label mb-1">Case</div>
            <div className="text-[14.5px] text-ink leading-relaxed">{preset.brief}</div>
          </div>

          <div className="panel overflow-hidden">
            <TraceView
              paAt={(t) => rigRef.current!.paAt(t)}
              pdAt={s.wireIn ? (t) => rigRef.current!.pdAt(t) : null}
              clock={() => rigRef.current!.t}
              readout={readout}
              aside={aids ? `Teaching aid: hyperaemia ${Math.round(h * 100)}%` : undefined}
              branchLabel={lm && s.lmBranch ? branchLabel(s.lmBranch) : undefined}
              guide={s.guideEngaged ? "engaged" : "disengaged"}
            />
            <VesselStrip
              lesions={path.lesions}
              treated={s.treated}
              lengthMm={path.lengthMm}
              diffuse={path.diffuse}
              sensorMm={s.sensorMm}
              sensorFromTipMm={SENSOR_FROM_TIP_MM}
              wireIn={s.wireIn}
              guideEngaged={s.guideEngaged}
              sideBranch={preset.case.vessel === "LAD" ? { atMm: MP_LM_LENGTH_MM, active: s.branch === "side", label: "circumflex" } : undefined}
              branches={lm && s.lmBranch && bif !== null ? { lmMm: bif * path.lengthMm, options: lm.branches, active: s.lmBranch, onSelect: (id) => dispatch({ type: "branch", id }) } : undefined}
              onSensor={(mm) => dispatch({ type: "sensor", mm })}
              disabled={locked || !!s.pullback?.active}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <SetupPanel session={s} dispatch={dispatch} disabled={locked} />
            <MeasurePanel session={s} dispatch={dispatch} disabled={locked} />
          </div>

          {s.pullback && s.pullback.pts.length > 1 && (!lm || s.pullback.active) && <PullbackPlot pts={s.pullback.pts} kind={s.pullback.kind} marks={c.lesions.map((l) => l.pos)} />}
          {lm &&
            lm.branches.map((b) => {
              const pb = s.branchPullbacks[b.id];
              if (!pb || pb.pts.length < 2) return null;
              return (
                <div key={b.id}>
                  <div className="stat-label mb-1">Pullback from the {b.label}</div>
                  <PullbackPlot pts={pb.pts} kind={pb.kind} marks={presetView(lm, b.id, s.treated).lesions.map((l) => l.pos)} />
                </div>
              );
            })}

          <div className="panel p-4">
            <div className="stat-label mb-2">Decision</div>
            <div className="grid md:grid-cols-2 gap-2">
              {DECISIONS.map((d) => {
                const right = decisionAccepted(preset, d.id);
                return (
                  <button
                    key={d.id}
                    disabled={decided}
                    onClick={() => dispatch({ type: "decide", id: d.id })}
                    className={`text-left rounded-lg border px-3 py-2 text-[14px] ${
                      !decided ? "border-line hover:border-accent/50 text-ink-soft" : right ? "border-good/60 bg-good/[0.08] text-ink" : d.id === s.decision ? "border-danger/60 bg-danger/[0.08]" : "border-line opacity-50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            {decided && (
              <div className="mt-3 animate-fadein text-[14px] text-ink-soft leading-relaxed">
                <p>{preset.case.teaching}</p>
                <div className="stat-label mt-3 mb-1">Set-up and technique</div>
                <ul className="text-[13px] space-y-0.5">
                  {items.map((p) => (
                    <li key={p.id} className={p.ok ? "text-good" : "text-warn"}>
                      {p.ok ? "✓" : "○"} {p.label}
                    </li>
                  ))}
                </ul>
                {recorded.length > 0 && (
                  <>
                    <div className="stat-label mt-3 mb-1">Your measurements</div>
                    <ul className="text-[13px] space-y-0.5">
                      {recorded.map((r, i) => (
                        <li key={i} className={r.valid ? "text-ink-soft" : "text-warn"}>
                          {r.kind === "ffr" ? `FFR ${r.pdpa.toFixed(2)}` : `Resting Pd/Pa ${r.pdpa.toFixed(2)}, wave-free ratio ${r.wfp.toFixed(2)}`}
                          {r.branch ? ` (${branchLabel(r.branch)})` : ""}
                          {r.valid ? "" : `: not trustworthy (${r.problems.join("; ")})`}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {stentable.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stentable.map((l) => (
                      <button key={l.id} className="btn" disabled={s.treated.includes(l.id)} onClick={() => dispatch({ type: "stent", lesionId: l.id })}>
                        Stent the {l.label ?? l.id} lesion, then re-measure
                      </button>
                    ))}
                  </div>
                )}
                <button className="btn mt-3" onClick={() => load(presetId, launchMode, rig.extra)}>
                  Repeat this case
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp(s.t)} events={context.events} />
          <MeasurementLog session={s} showAids={aids} />
          <ThermoPanel session={s} dispatch={dispatch} disabled={locked} />
          <div className="panel p-3 text-[12px] text-ink-faint leading-relaxed">
            Thresholds used: FFR ≤ {CUTOFF.ffr}, wave-free ratio ≤ {CUTOFF.nhpr}, resting Pd/Pa ≤ {CUTOFF.pdpa}, CFR &lt; {CUTOFF.cfr}, IMR ≥ {CUTOFF.imr}; drift check Pd/Pa 0.98-1.02 at the guide tip. The sensor measures only the
            lesions proximal to it. Hyperaemia onset and the pullback are time-compressed here.
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
