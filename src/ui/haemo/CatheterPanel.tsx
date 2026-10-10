// The catheter controls of the haemodynamics lab (split from HaemoLab.tsx): the right heart catheter,
// the left heart pigtail and the sheath side-arm, respiration and catheter-tip extrasystoles.
//
// The right heart catheter is steered by hand (haemo-rhc-manoeuvre): a multipurpose, balloon-tipped or
// pigtail catheter from the femoral or jugular vein is flushed, inserted, advanced gently or firmly,
// withdrawn and turned under fluoroscopy, on the torque-directed model of
// src/simulation/rightHeartCatheter.ts (the pacing lab's chamber-zone map with side branches, the RA
// loop, the outflow tract and the wedge). The patient can be asked for a deep breath, a soft J wire
// can be passed, the balloon inflated, help called, and the catheter's problems and the rhythm managed
// from the same controls, whatever has happened, so the controls never say what has gone wrong. The
// recorder follows the tip through the study's rhc-advance and rhc-withdraw, the catheter's events reach
// the tip context through the study's 'raise' action, and ectopy turns the trace's extrasystoles on
// (rhcSyncActions). The debrief of the passage is shown once the study is submitted, and its scored
// decisions go to onDecide when the lab passes it.
//
// A launch at one of the presets of src/content/lab/presets/haemo/rhc.launch.ts (RHC_PRESETS) opens the
// catheter at that preset: the controls read the start from the pending launch before the lab takes it.
// In DEV builds window.__lab.haemoRhc exposes the catheter's state, an act() for its actions and a
// step() of lab time, for checking the lab while the pane is hidden.
//
// In an aortic valve study (a scenario with an echo report, haemo-aortic-stenosis-studies) the LV is
// reached only through the crossing manoeuvre of ValvePanel, shown here below the catheter controls.
// Generic device names only.
import { useCallback, useEffect, useRef, useState } from "react";
import type { LabEvent } from "../../content/lab/tips";
import type { AssessmentMode } from "../../mentor/types";
import { SCENARIO_BY_ID } from "../../simulation/haemo";
import { isAvStudy, type AvDecision } from "../../simulation/haemo/avCrossing";
import type { HaemoAction, HaemoStudyState, LhcPosition } from "../../simulation/haemoStudy";
import { rhcPath } from "../../simulation/haemoStudy";
import {
  RHC_DEFAULT_HR,
  RHC_PROFILES,
  RHC_STEP,
  RHC_TREATMENTS,
  initialRhc,
  isRhcPreset,
  rhcChamberIndex,
  rhcDecisions,
  rhcStep,
  rhcSummary,
  rhcSyncActions,
  type RhcAction,
  type RhcEnv,
  type RhcPresetId,
  type RhcProfile,
  type RhcRoute,
  type RhcState,
} from "../../simulation/rightHeartCatheter";
import { peekLaunch, useLabLaunchStore } from "../../state/useLabLaunchStore";
import { registerLabHook } from "../../dev/labHooks";
import { haemoTipContext } from "../lab/haemoTips";
import RhcFluoro from "./RhcFluoro";
import ValvePanel from "./ValvePanel";

export interface CatheterPanelProps {
  /** the study (the whole state when the scenario may be an aortic valve study) */
  study: Pick<HaemoStudyState, "rhc" | "rhcCatheter" | "lhc" | "artLine" | "resp" | "pvc"> & Partial<HaemoStudyState>;
  dispatch: (a: HaemoAction) => void;
  /** controls are locked once the study is submitted */
  disabled?: boolean;
  /** the run's mode, for the valve study's guided aids */
  mode?: AssessmentMode;
  /** the scored decisions (the valve study's and the right heart passage's), for the run's ledger */
  onDecide?: (d: AvDecision) => void;
}

/** The whole study state, when the caller passed it. */
const fullStudy = (st: CatheterPanelProps["study"]): HaemoStudyState | null =>
  st.scenarioId !== undefined && st.sets !== undefined && st.raised !== undefined && st.lastAction !== undefined ? (st as HaemoStudyState) : null;

const PROFILE_LABEL: Record<RhcProfile, string> = { multipurpose: "multipurpose", balloon: "balloon-tipped", pigtail: "pigtail" };
const PROFILE_TITLE: Record<RhcProfile, string> = {
  multipurpose: "Torque-directed end-hole catheter; wedges with a gentle advance on a breath in",
  balloon: "Balloon-tipped flotation catheter; inflate the balloon to float and wedge",
  pigtail: "Angiographic pigtail: reaches the main PA, cannot wedge",
};
const ROUTE_LABEL: Record<RhcRoute, string> = { femoral: "femoral vein", rij: "jugular vein" };

/**
 * Scenario conditions that count as structural heart disease for the choice of AF drug (Oxford gives
 * flecainide only without it). MODEL PARAMETER: a reading of the scenario's own events.
 */
const STRUCTURAL: readonly LabEvent[] = ["aortic-stenosis", "low-flow-aortic-stenosis", "mitral-stenosis", "hocm", "constriction", "restriction", "atrial-shunt", "ventricular-shunt", "cardiogenic-shock"];

/** A random seed for a new passage (the episode variants differ between runs). */
const freshSeed = () => (Math.floor(Math.random() * 2 ** 32) >>> 0) || 1;

/** The preset a pending haemo launch asks for: the preset, null for a launch without one, undefined when none is pending. */
function pendingPreset(): RhcPresetId | null | undefined {
  const p = peekLaunch("haemo");
  if (!p) return undefined;
  return isRhcPreset(p.start) ? p.start : null;
}

/** A new passage: the preset, or the catheter the study has (a pigtail stays a pigtail). */
function newPassage(preset: RhcPresetId | null, study: CatheterPanelProps["study"], seed = freshSeed()): RhcState {
  const st = initialRhc(preset, seed);
  if (!preset && study.rhcCatheter === "pigtail") return { ...st, profile: "pigtail" };
  return st;
}

/**
 * Whether the study is a new one (a load, a launch, a repeat, another scenario) rather than the same study
 * after an action that leaves it at its start. initialStudy() gives a new `sets` object with nothing in it;
 * resp, art-line, pvc, raise, clear-event, show-formula and answer keep the same `sets`, and the only
 * action that changes `sets` while the study is still at its start (a post-PCI decision) leaves a decision in it.
 */
export function isNewStudy(prevSets: unknown, study: Pick<HaemoStudyState, "lastAction" | "sets">): boolean {
  if (study.lastAction !== "start" || study.sets === prevSets) return false;
  return Object.values(study.sets).every((m) => !m || m.decision === undefined);
}

const nowS = () => (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;

export default function CatheterPanel({ study, dispatch, disabled = false, mode, onDecide }: CatheterPanelProps) {
  const path = rhcPath(study.rhcCatheter);
  const { lhc } = study;
  const full = fullStudy(study);
  const scenario = full ? SCENARIO_BY_ID[full.scenarioId] : undefined;
  const valveStudy = full && isAvStudy(scenario) ? full : null;

  // --- the right heart catheter --------------------------------------------------------------
  const [rhc, setRhc] = useState<RhcState>(() => newPassage(null, study, 1));
  const [now, setNow] = useState(0);
  const [screening, setScreening] = useState(true);
  const rhcRef = useRef(rhc);
  const studyRef = useRef(study);
  studyRef.current = study;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const decideRef = useRef(onDecide);
  decideRef.current = onDecide;
  /** lab time: seconds since the passage began, plus whatever the dev hook stepped */
  const clock = useRef({ t0: nowS(), offset: 0 });
  const labNow = () => nowS() - clock.current.t0 + clock.current.offset;
  /** what the sync raised on the study, whether it turned the extrasystoles on, the chamber it last brought the study to, the decisions sent */
  const owned = useRef<{ events: LabEvent[]; pvc: boolean; chamber: number; decided: Set<string> }>({ events: [], pvc: false, chamber: -2, decided: new Set() });
  /** the preset of a pending launch (read before the lab takes it) */
  const pending = useRef<RhcPresetId | null | undefined>(pendingPreset());
  /** the measurement sets of the study last seen (a new object only for a new study) */
  const seenSets = useRef<unknown>(null);

  const env = (): RhcEnv => {
    const st = studyRef.current;
    const sc = st.scenarioId ? SCENARIO_BY_ID[st.scenarioId] : undefined;
    return { resp: st.resp, hr: sc?.hr ?? RHC_DEFAULT_HR, structural: !!sc?.events?.some((e) => STRUCTURAL.includes(e)) };
  };

  /** Bring the study in line with the catheter and send any new scored decision. */
  const sync = useCallback((next: RhcState) => {
    const st = studyRef.current;
    const raised = st.raised ?? [];
    const s = rhcSyncActions({ rhc: st.rhc, rhcCatheter: st.rhcCatheter, lhc: st.lhc, pvc: st.pvc, raised }, next, owned.current.events, owned.current.pvc, owned.current.chamber);
    owned.current.events = s.owned;
    owned.current.pvc = s.pvcOwned;
    owned.current.chamber = s.chamber;
    for (const a of s.actions) dispatchRef.current(a);
    for (const d of rhcDecisions(next)) {
      const key = `${d.id}:${d.given}`;
      if (owned.current.decided.has(key)) continue;
      owned.current.decided.add(key);
      decideRef.current?.(d);
    }
  }, []);

  const commit = useCallback(
    (next: RhcState) => {
      rhcRef.current = next;
      setRhc(next);
      setNow(next.t);
      sync(next);
    },
    [sync]
  );

  const act = useCallback(
    (a: RhcAction) => {
      if (studyRef.current.answer != null) return;
      commit(rhcStep(rhcRef.current, a, labNow(), env()));
    },
    // env and labNow read refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit]
  );

  /** Start a new passage (a new study, a launch, a repeat) and clear what the old one raised. */
  const reset = useCallback(
    (preset: RhcPresetId | null) => {
      const st = studyRef.current;
      const raised = st.raised ?? [];
      const clear = owned.current.events.filter((e) => raised.includes(e));
      for (const e of clear) dispatchRef.current({ type: "clear-event", event: e });
      if (owned.current.pvc && st.pvc) dispatchRef.current({ type: "pvc", on: false });
      owned.current = { events: [], pvc: false, chamber: -2, decided: new Set() };
      clock.current = { t0: nowS(), offset: 0 };
      const next = newPassage(preset, st);
      rhcRef.current = next;
      setRhc(next);
      setNow(0);
      if (next.inserted) sync(next);
    },
    [sync]
  );

  // a new study (another scenario, a launch, a repeat): a new passage, at the launch's preset if it named one
  const lastScenario = useRef<string | undefined>(full?.scenarioId);
  useEffect(() => {
    if (!full || !isNewStudy(seenSets.current, full)) return;
    // a launch still pending will replace this study as soon as the lab takes it: wait for that one
    if (peekLaunch("haemo")) return;
    seenSets.current = full.sets;
    const p = pending.current;
    pending.current = undefined;
    const keep = lastScenario.current === full.scenarioId ? rhcRef.current.preset : null;
    lastScenario.current = full.scenarioId;
    reset(p !== undefined ? p : keep);
  });

  // launches that arrive while the lab is open: note the preset before the lab takes the request
  useEffect(
    () =>
      useLabLaunchStore.subscribe((s, prev) => {
        if (s.pending.haemo && s.pending.haemo !== prev.pending.haemo) pending.current = pendingPreset();
      }),
    []
  );

  // the clock: time-based events (VT runs, AF, engage-fail, the shaft relaxing) and the ECG strip
  useEffect(() => {
    if (disabled) return;
    const id = setInterval(() => {
      const prev = rhcRef.current;
      const next = rhcStep(prev, { type: "tick" }, labNow(), env());
      // what the operator last noticed stays on the screen until something new happens
      commit(next.messages.length ? next : { ...next, messages: prev.messages });
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, commit]);

  // DEV: window.__lab.haemoRhc
  useEffect(
    () =>
      registerLabHook("haemoRhc", {
        context: () => (fullStudy(studyRef.current) ? haemoTipContext(studyRef.current as HaemoStudyState) : null),
        tips: () => [],
        state: () => rhcRef.current,
        step: (seconds: number) => {
          clock.current.offset += Math.max(0, seconds);
          commit(rhcStep(rhcRef.current, { type: "tick" }, labNow(), env()));
        },
        act,
      } as Parameters<typeof registerLabHook>[1] & { act: (a: RhcAction) => void }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [act, commit]
  );

  const inserted = rhc.inserted;
  const knotOpen = !!rhc.knot && !rhc.knot.resolved;
  const idx = rhcChamberIndex(rhc);
  const off = disabled || !inserted;
  const sinusRate = scenario?.hr ?? RHC_DEFAULT_HR;

  return (
    <>
      <div className="md:col-span-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="stat-label">Right heart catheter</div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="seg" title={inserted ? "Withdraw the catheter to change the route" : undefined}>
              {(["femoral", "rij"] as const).map((r) => (
                <button key={r} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${rhc.route === r ? "seg-btn-active" : ""}`} disabled={disabled || inserted} onClick={() => act({ type: "route", route: r })}>
                  {ROUTE_LABEL[r]}
                </button>
              ))}
            </div>
            <div className="seg" title={inserted ? "Withdraw the catheter to change it" : undefined}>
              {RHC_PROFILES.map((c) => (
                <button key={c} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${rhc.profile === c ? "seg-btn-active" : ""}`} disabled={disabled || inserted} onClick={() => act({ type: "profile", profile: c })} title={PROFILE_TITLE[c]}>
                  {PROFILE_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* the chamber the recorder shows (read from the waveform) */}
        <div className="flex gap-1" aria-label="Recorder position">
          {path.map((c, i) => (
            <span
              key={c}
              className={`flex-1 text-center rounded px-1 py-1 text-[12px] font-mono border ${i === idx ? "border-accent text-ink bg-accent/15" : i < Math.max(idx, 0) ? "border-line text-ink-soft" : "border-line text-ink-faint"}`}
            >
              {c === "PCWP" ? "wedge" : c}
            </span>
          ))}
        </div>

        <RhcFluoro st={rhc} now={now} sinusRate={sinusRate} live={screening && inserted} />

        <div className="flex flex-wrap items-center gap-1.5">
          <button className="btn !px-2" disabled={disabled || rhc.flushed} onClick={() => act({ type: "flush" })} title="Flush the catheter and connect it to the transducer">
            Flush and connect
          </button>
          <button className={`btn !px-2 ${rhc.flushed && !inserted ? "btn-accent" : ""}`} disabled={disabled || inserted} onClick={() => act({ type: "insert" })}>
            Insert
          </button>
          <label className="flex items-center gap-1 text-[12px] text-ink-soft ml-auto">
            <input type="checkbox" checked={screening} disabled={disabled} onChange={(e) => setScreening(e.target.checked)} /> screening
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "withdraw", cm: RHC_STEP.firm })} title="Withdraw 2 cm">
            ◂◂ Withdraw
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "withdraw", cm: RHC_STEP.gentle })} title="Withdraw a little">
            ◂ Back
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "rotate", deg: -30 })} title="Turn the hub anticlockwise">
            ↺ Turn
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "rotate", deg: 30 })} title="Turn the hub clockwise">
            Turn ↻
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "advance", cm: RHC_STEP.gentle })} title="Advance gently">
            Advance ▸
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "advance", cm: RHC_STEP.firm })} title="Push firmly (2 cm)">
            Push ▸▸
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button className="btn !px-2" disabled={disabled} onClick={() => act({ type: "deep-breath" })}>
            Ask for a deep breath
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "wire", on: !rhc.wire })}>
            {rhc.wire ? "Remove the J wire" : "Pass a soft J wire"}
          </button>
          {rhc.profile === "balloon" && (
            <button className="btn !px-2" disabled={off} onClick={() => act({ type: "balloon", up: !rhc.balloon })}>
              {rhc.balloon ? "Deflate the balloon" : "Inflate the balloon"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-ink-faint mr-1">If the catheter will not behave</span>
          <button className="btn !px-2" disabled={disabled} onClick={() => act({ type: "call-help" })}>
            Call an experienced operator
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "wire-advance" })}>
            Advance the wire to free it
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "pull-tight" })}>
            Pull it tight
          </button>
          <button className="btn !px-2" disabled={off} onClick={() => act({ type: "remove-with-sheath" })}>
            Remove with the sheath
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-ink-faint mr-1">Rhythm</span>
          {RHC_TREATMENTS.map((x) => (
            <button key={x.id} className="btn !px-2 !py-0.5 !text-[12px]" disabled={disabled} onClick={() => act({ type: "treat", treatment: x.id })}>
              {x.label}
            </button>
          ))}
        </div>

        {rhc.messages.length > 0 && <div className="text-[13px] text-ink-soft" aria-live="polite">{rhc.messages.join(" ")}</div>}
        {knotOpen && rhc.knot!.helpAt !== null && <div className="text-[12px] text-ink-faint">An experienced operator is with you.</div>}

        {disabled && <RhcDebrief st={rhc} />}
      </div>
      <div>
        <div className="stat-label mb-1.5">{valveStudy ? "Left heart catheter and arterial line" : "Left heart (pigtail) and arterial line"}</div>
        <div className="flex items-center gap-1.5">
          <div className="seg">
            {(["none", "Ao", "LV"] as LhcPosition[]).map((p) => {
              // in a valve study the LV is reached by the crossing manoeuvre below, not by a click
              const viaValve = !!valveStudy && p === "LV";
              return (
                <button
                  key={p}
                  className={`seg-btn !px-2.5 !py-1 ${lhc === p ? "seg-btn-active" : ""}`}
                  disabled={disabled || viaValve}
                  title={viaValve ? "Cross the valve with the aortic valve controls below" : undefined}
                  onClick={() => dispatch({ type: "lhc", position: p })}
                >
                  {p === "none" ? "out" : p === "Ao" ? "aortic root" : viaValve ? "LV" : "cross into LV"}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1 text-[12px] text-ink-soft ml-auto">
            <input type="checkbox" checked={study.artLine} disabled={disabled} onChange={(e) => dispatch({ type: "art-line", on: e.target.checked })} /> sheath side-arm
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <input type="checkbox" checked={study.resp} disabled={disabled} onChange={(e) => dispatch({ type: "resp", on: e.target.checked })} /> respiration
        </label>
        <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <input type="checkbox" checked={study.pvc} disabled={disabled} onChange={(e) => dispatch({ type: "pvc", on: e.target.checked })} /> provoke extrasystoles (catheter tip)
        </label>
      </div>
      {valveStudy && (
        <div className="md:col-span-2">
          <ValvePanel key={valveStudy.scenarioId} study={valveStudy} dispatch={dispatch} disabled={disabled} mode={mode} onDecide={onDecide} />
        </div>
      )}
    </>
  );
}

/** The passage's debrief, once the study is submitted: what happened, the errors and the scored decisions. */
export function RhcDebrief({ st }: { st: RhcState }) {
  const decisions = rhcDecisions(st);
  return (
    <div className="border-t border-line pt-2 mt-1 space-y-1">
      <div className="stat-label">Right heart passage debrief</div>
      <ul className="text-[13px] text-ink-soft space-y-0.5">
        {rhcSummary(st).map((s) => (
          <li key={s}>{s}</li>
        ))}
        {st.errors.map((e) => (
          <li key={e.id} className={e.critical ? "text-danger" : "text-warn"}>
            {e.critical ? "Critical: " : ""}
            {e.text}
          </li>
        ))}
        {decisions.map((d) => (
          <li key={d.id}>
            {d.label}: {d.correct ? "correct" : "not as advised"} ({d.given}; expected: {d.expected})
          </li>
        ))}
      </ul>
    </div>
  );
}
