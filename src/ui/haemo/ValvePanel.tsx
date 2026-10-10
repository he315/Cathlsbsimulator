// The aortic valve study of the haemodynamics lab (haemo-aortic-stenosis-studies): the echo report
// and the cross-or-not decision, the crossing manoeuvre (catheter and wire, aortogram, attempts at
// the orifice, the manipulation monitor, a possible neurological event, the exchange to a pigtail),
// the gradient by method, and the staged dobutamine study with the results table the learner fills
// in. The state is the pure reducer of src/simulation/haemo/avCrossing.ts; this panel keeps the
// haemodynamic study in step (the catheter in the LV, the aortic channel of a second arterial catheter,
// the hypotension event during dobutamine).
//
// What an operator sees is live: the report, the recorder's numbers, the attempts, the time at the
// valve and a forceful push. The manipulation quality, the embolic risk, the verdicts and the reference
// values are a guided aid, and appear for everyone once the diagnosis is submitted.
// Generic device names only.
import { useEffect, useRef, useState } from "react";
import type { AssessmentMode } from "../../mentor/types";
import { sample, type HaemoScenario } from "../../simulation/haemo";
import { EMPTY_RECORDED, currentSet, rhcPath, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import {
  AVA_TOLERANCE,
  CROSS_CATHETERS,
  CROSS_WIRES,
  CT_CALCIUM_TEXT,
  GRADIENT_METHODS,
  LFLG_RESPONSE_TEXT,
  NO_RESP,
  STAGE_SV_REL_TOLERANCE,
  avDecisions,
  avScenario,
  avStageScenario,
  avStudyEvents,
  avStudyReducer,
  canAttempt,
  crossingSummary,
  ctCalciumReading,
  currentStageLive,
  femoralGradient,
  femoralPressure,
  initialAvStudy,
  lflgResponse,
  stageReference,
  stopCriteria,
  type AvAction,
  type AvDecision,
  type AvStudyState,
  type GradientMethod,
  type StageRecord,
} from "../../simulation/haemo/avCrossing";
import LiveTrace, { type TraceChannel } from "../sim/LiveTrace";

export interface ValvePanelProps {
  study: HaemoStudyState;
  dispatch: (a: HaemoAction) => void;
  /** controls are locked once the study is submitted */
  disabled?: boolean;
  /** the run's mode: guided practice shows the verdicts and the monitor's score as they happen */
  mode?: AssessmentMode;
  /** each scored decision, for the run's ledger, when it is made or changes */
  onDecide?: (d: AvDecision) => void;
  /** a starting state (tests) */
  initial?: AvStudyState;
}

const LV_COLOUR = "#3ef2a4";
const AO_COLOUR = "#ff5d6c";
const fmt = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d) : "—");

/** A fresh seed for each run, so repeat practice meets a chance per attempt, not a fixed sequence (the reducer tests keep the scenario's default seed). */
const runSeed = () => (Math.random() * 2 ** 32) >>> 0;

/** A study just loaded: nothing recorded, no catheter moved (a reload of the same scenario starts the valve study again). */
const isFresh = (st: HaemoStudyState) => st.lastAction === "start" && st.lastCatheter === null && currentSet(st).rec === EMPTY_RECORDED && st.answer === null;

export default function ValvePanel({ study, dispatch, disabled = false, mode, onDecide, initial }: ValvePanelProps) {
  const [av, setAv] = useState<AvStudyState>(() => initial ?? initialAvStudy(study.scenarioId, runSeed()));
  const avRef = useRef(av);
  avRef.current = av;
  const studyRef = useRef(study);
  studyRef.current = study;
  /** whether this panel raised the study's hypotension event */
  const raisedHypo = useRef(false);
  const decided = useRef(new Map<string, string>());

  const s = avScenario(av);
  const locked = disabled || study.answer !== null;
  const reveal = mode === "guided" || study.answer !== null;

  /** Keep the haemodynamic study in step with a change of the valve study. */
  const sync = (prev: AvStudyState, next: AvStudyState) => {
    const st = studyRef.current;
    if (!prev.inLv && next.inLv && st.lhc !== "LV") dispatch({ type: "lhc", position: "LV" });
    if (prev.inLv && !next.inLv && st.lhc === "LV") dispatch({ type: "lhc", position: "Ao" });
    if (!prev.secondArterial && next.secondArterial && !st.artLine) dispatch({ type: "art-line", on: true });
    const hypo = avStudyEvents(next).includes("hypotension");
    if (hypo && !raisedHypo.current && !st.raised.includes("hypotension")) {
      raisedHypo.current = true;
      dispatch({ type: "raise", event: "hypotension" });
    } else if (!hypo && raisedHypo.current) {
      raisedHypo.current = false;
      dispatch({ type: "clear-event", event: "hypotension" });
    }
    if (onDecide)
      for (const d of avDecisions(next)) {
        const key = JSON.stringify(d);
        if (decided.current.get(d.id) !== key) {
          decided.current.set(d.id, key);
          onDecide(d);
        }
      }
  };

  const act = (a: AvAction) => {
    const prev = avRef.current;
    const next = avStudyReducer(prev, a);
    if (next === prev) return;
    avRef.current = next;
    setAv(next);
    sync(prev, next);
  };

  // A reload of the scenario (the study is fresh again after work was done) starts the valve study again.
  const wasFresh = useRef(isFresh(study));
  useEffect(() => {
    const fresh = isFresh(study);
    if (fresh && !wasFresh.current) {
      const next = initialAvStudy(study.scenarioId, runSeed());
      avRef.current = next;
      setAv(next);
      // a repeat carries the study's raised events over: drop the hypotension this panel raised
      if (raisedHypo.current && study.raised.includes("hypotension")) dispatch({ type: "clear-event", event: "hypotension" });
      raisedHypo.current = false;
      decided.current.clear();
    }
    wasFresh.current = fresh;
  }, [study]);

  // The catheter left the LV from the catheter controls: the valve has to be crossed again.
  useEffect(() => {
    if (study.lhc !== "LV" && avRef.current.inLv) act({ type: "withdraw" });
    // act reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study.lhc]);

  const inRoot = study.lhc === "Ao";
  const halted = av.neuro === "pending" || av.neuro === "stopped";

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <div className="flex items-center justify-between">
        <div className="stat-label">Aortic valve</div>
        {av.decision && <span className="chip">{av.decision === "cross" ? "Crossing planned" : "Valve not to be crossed"}</span>}
      </div>

      <EchoReport s={s} av={av} reveal={reveal} onShowCt={() => act({ type: "show-ct" })} locked={locked} />

      {!av.decision || (av.attempts === 0 && av.passages === 0 && !locked) ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-soft">Cross the aortic valve?</span>
          <div className="seg">
            <button className={`seg-btn !px-2.5 !py-1 ${av.decision === "cross" ? "seg-btn-active" : ""}`} disabled={locked} onClick={() => act({ type: "decide", decision: "cross" })}>
              Cross the valve
            </button>
            <button className={`seg-btn !px-2.5 !py-1 ${av.decision === "no-cross" ? "seg-btn-active" : ""}`} disabled={locked} onClick={() => act({ type: "decide", decision: "no-cross" })}>
              Do not cross: coronary angiography only
            </button>
          </div>
        </div>
      ) : null}

      {av.decision === "no-cross" && <p className="text-[13px] text-ink-soft">The valve stays uncrossed. The left heart part of the study is the aortic root pressure and the coronary angiogram.</p>}

      {av.decision === "cross" && (
        <>
          <Crossing av={av} act={act} inRoot={inRoot} locked={locked} reveal={reveal} />
          {av.neuro === "pending" && (
            <div className="notice notice-danger flex-col">
              <div>The patient has become drowsy with slurred speech and a weak right arm.</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-accent" disabled={locked} onClick={() => act({ type: "neuro", response: "stop" })}>
                  Stop manipulation, call the stroke team
                </button>
                <button className="btn" disabled={locked} onClick={() => act({ type: "neuro", response: "continue" })}>
                  Carry on with the study
                </button>
              </div>
            </div>
          )}
          {av.neuro === "stopped" && <div className="notice notice-info">Manipulation stopped and the stroke team called. The valve study ends here.</div>}
          <Gradients av={av} act={act} study={study} locked={locked || halted} reveal={reveal} />
          {s.modifiers?.length ? <Dobutamine av={av} act={act} study={study} locked={locked || halted} reveal={reveal} /> : null}
        </>
      )}

      {study.answer !== null && <Debrief av={av} />}
    </div>
  );
}

function EchoReport({ s, av, reveal, onShowCt, locked }: { s: HaemoScenario; av: AvStudyState; reveal: boolean; onShowCt: () => void; locked: boolean }) {
  const spec = s.avStudy!;
  const ct = spec.ctCalcium;
  // a calcium score that is part of the written report is shown with it; otherwise it is requested
  const ctInReport = !!ct && !s.modifiers?.length;
  const canRequest = !!ct && !ctInReport && !av.ctShown;
  return (
    <div className="rounded-md border border-line p-2.5">
      <div className="stat-label mb-1">Echo report and referral</div>
      <ul className="space-y-0.5 text-[13px] text-ink">
        {spec.report.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {ct && (av.ctShown || ctInReport) && (
        <div className="mt-1.5 text-[13px] text-ink">
          CT valve calcium score: <span className="font-mono">{ct.agatston}</span> Agatston units ({ct.sex === "male" ? "man" : "woman"})
          {reveal && <span className="text-ink-soft"> · {CT_CALCIUM_TEXT[ctCalciumReading(ct)]}</span>}
        </div>
      )}
      {canRequest && (
        <button className="btn mt-2 !py-0.5 !text-[12px]" disabled={locked || !av.infusionStopped} onClick={onShowCt} title="Requested once the dobutamine study is finished">
          Request the CT valve calcium score
        </button>
      )}
    </div>
  );
}

function Crossing({ av, act, inRoot, locked, reveal }: { av: AvStudyState; act: (a: AvAction) => void; inRoot: boolean; locked: boolean; reveal: boolean }) {
  const kitLocked = locked || av.inLv || av.wireAcross;
  const halted = av.neuro === "pending" || av.neuro === "stopped";
  const sum = crossingSummary(av);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-ink-soft w-16">Catheter</span>
        <div className="seg">
          {CROSS_CATHETERS.map((c) => (
            <button key={c.id} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${av.catheter === c.id ? "seg-btn-active" : ""}`} disabled={kitLocked} title={reveal ? c.note : undefined} onClick={() => act({ type: "catheter", catheter: c.id })}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-ink-soft w-16">Wire</span>
        <div className="seg">
          {CROSS_WIRES.map((w) => (
            <button key={w.id} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${av.wire === w.id ? "seg-btn-active" : ""}`} disabled={kitLocked} title={reveal ? w.note : undefined} onClick={() => act({ type: "wire", wire: w.id })}>
              {w.label}
            </button>
          ))}
        </div>
      </div>
      {!inRoot && !av.inLv && <p className="text-[12.5px] text-ink-faint">Put the catheter in the aortic root (left heart controls above) to work at the valve.</p>}
      <div className="flex flex-wrap gap-1.5">
        <button className="btn !py-1" disabled={locked || halted || !inRoot || av.aortogram || av.inLv} onClick={() => act({ type: "aortogram", inRoot })}>
          Aortogram
        </button>
        <button className="btn btn-accent !py-1" disabled={locked || !inRoot || !canAttempt(av)} onClick={() => act({ type: "attempt", style: "controlled", inRoot })}>
          Probe the orifice
        </button>
        <button className="btn !py-1" disabled={locked || !inRoot || !canAttempt(av)} onClick={() => act({ type: "attempt", style: "forceful", inRoot })}>
          Push harder
        </button>
        <button className="btn btn-accent !py-1" disabled={locked || halted || !av.wireAcross || av.inLv} onClick={() => act({ type: "advance" })}>
          Follow with the catheter into the LV
        </button>
        {av.inLv && !av.pigtailInLv && (
          <button className="btn !py-1" disabled={locked || halted} onClick={() => act({ type: "exchange" })}>
            Exchange for a pigtail over an exchange-length J wire
          </button>
        )}
      </div>
      {av.aortogram && <AortogramSketch />}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="chip font-mono">attempts {av.attempts}</span>
        <span className="chip font-mono">at the valve {av.valveTimeS} s</span>
        {av.forceful > 0 && <span className="chip font-mono text-warn">forceful pushes {av.forceful}</span>}
        {av.wireAcross && !av.inLv && <span className="chip text-good">wire across</span>}
        {av.inLv && <span className="chip text-good">{av.pigtailInLv ? "pigtail in the LV" : "catheter in the LV"}</span>}
        {reveal && av.attempts > 0 && (
          <>
            <span className="chip font-mono">manipulation quality {sum.quality}</span>
            <span className={`chip ${sum.risk === "high" ? "text-danger" : sum.risk === "rising" ? "text-warn" : ""}`}>embolic risk {sum.risk}</span>
          </>
        )}
      </div>
      {av.flag && <div className="notice notice-warn">{av.flag}.</div>}
    </div>
  );
}

/** A schematic aortogram of the root: the domed, calcified leaflets and the jet through the narrow opening (the 'Prussian helmet' landmark). */
function AortogramSketch() {
  return (
    <figure className="rounded-md border border-line bg-[#0b0d10] p-2">
      <svg viewBox="0 0 220 140" className="w-full max-w-[280px]" role="img" aria-label="Schematic aortogram: domed leaflets with a narrow central opening and a jet into the LV">
        <path d="M70 10 C70 50 60 70 62 84 L158 84 C160 70 150 50 150 10 Z" fill="#3a3f47" />
        <path d="M62 84 C80 60 100 58 106 84 Z" fill="#c9ced6" />
        <path d="M158 84 C140 60 120 58 114 84 Z" fill="#c9ced6" />
        <path d="M106 84 L114 84 L118 130 L102 130 Z" fill="#7f8792" opacity="0.75" />
        <path d="M40 86 C60 90 80 92 110 92 C140 92 160 90 180 86 L196 136 L24 136 Z" fill="none" stroke="#2e343c" strokeWidth="2" />
        <text x="110" y="24" textAnchor="middle" fill="#a6adb8" fontSize="10">ascending aorta</text>
        <text x="110" y="122" textAnchor="middle" fill="#a6adb8" fontSize="9">jet</text>
      </svg>
      <figcaption className="text-[12px] text-ink-soft">Aortogram (schematic): the leaflets dome towards the aorta; the opening sits where the jet starts.</figcaption>
    </figure>
  );
}

function Gradients({ av, act, study, locked, reveal }: { av: AvStudyState; act: (a: AvAction) => void; study: HaemoStudyState; locked: boolean; reveal: boolean }) {
  const can = (m: GradientMethod) => av.inLv && (m === "simultaneous" ? av.secondArterial : m === "femoral" ? study.artLine : true);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="stat-label">Gradient</span>
        <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <input type="checkbox" checked={av.secondArterial} disabled={locked} onChange={(e) => act({ type: "second-arterial", on: e.target.checked })} /> second arterial catheter in the ascending aorta
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GRADIENT_METHODS.map((m) => (
          <button key={m.id} className="btn !py-1 !text-[12px]" disabled={locked || !can(m.id)} title={reveal ? m.note : undefined} onClick={() => act({ type: "record-gradient", method: m.id, artLine: study.artLine })}>
            Record: {m.label}
          </button>
        ))}
      </div>
      {av.gradients.length > 0 && (
        <ul className="text-[12.5px] font-mono text-ink space-y-0.5">
          {av.gradients.map((g, i) => (
            <li key={i}>
              {GRADIENT_METHODS.find((m) => m.id === g.method)!.label}
              {g.stage !== null && g.stage > 0 ? ` (dobutamine stage ${g.stage})` : ""}: {g.mean !== undefined ? `mean ${g.mean} mmHg` : `peak-to-peak ${g.peakToPeak} mmHg`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dobutamine({ av, act, study, locked, reveal }: { av: AvStudyState; act: (a: AvAction) => void; study: HaemoStudyState; locked: boolean; reveal: boolean }) {
  const s = avScenario(av);
  const mods = s.modifiers!;
  const pos = study.rhc >= 0 ? rhcPath(study.rhcCatheter)[study.rhc] : null;
  const outputReady = pos === "PA" || pos === "PCWP";
  const reference = av.secondArterial || study.artLine;
  const live = currentStageLive(av);
  const x = avStageScenario(av);
  const femoral = !av.secondArterial && study.artLine;
  const channels: TraceChannel[] = [
    { fn: (t: number) => sample(x, "LV", t, NO_RESP), color: LV_COLOUR, label: "LV", width: 2 },
    ...(reference ? [{ fn: (t: number) => (femoral ? femoralPressure(x, t) : sample(x, "Ao", t, NO_RESP)), color: AO_COLOUR, label: femoral ? "Fem" : "Ao", width: 2 }] : []),
  ];
  const top = Math.max(160, Math.ceil((x.lv.sys * 1.15) / 20) * 20);
  const met = live ? stopCriteria(live) : [];
  const rows = mods.map((m, i) => ({ m, i, r: av.stages[i] })).filter((x) => x.r);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="stat-label">Dobutamine study</span>
        <span className="text-[12px] text-ink-faint">Stepwise, 5 then 10 up to 20 micrograms/kg/min; stop at a mean gradient of 40 mmHg or more, marked tachycardia, arrhythmia, hypotension or symptoms.</span>
      </div>
      <ul className="text-[12px] text-ink-soft flex flex-wrap gap-x-3">
        <li className={av.inLv ? "text-good" : ""}>LV pressure {av.inLv ? "✓" : "needed"}</li>
        <li className={reference ? "text-good" : ""}>aortic pressure {reference ? (femoral ? "(side-arm)" : "(second catheter)") : "needed"}</li>
        <li className={outputReady ? "text-good" : ""}>right heart catheter for output {outputReady ? "✓" : "in the PA needed"}</li>
      </ul>
      <div className="flex flex-wrap items-center gap-1.5">
        {av.stage === null ? (
          <button className="btn btn-accent !py-1" disabled={locked || !av.inLv} onClick={() => act({ type: "dobutamine", step: "baseline" })}>
            Baseline measurements
          </button>
        ) : (
          <>
            <span className="chip font-mono">{av.infusionStopped ? "Infusion stopped: back to baseline" : mods[av.stage].label}</span>
            <button className="btn !py-1" disabled={locked || av.infusionStopped || av.stage >= mods.length - 1} onClick={() => act({ type: "dobutamine", step: "increase" })}>
              {av.stage === 0 ? "Start the infusion" : "Increase the dose"}
            </button>
            <button className="btn !py-1" disabled={locked || av.infusionStopped || av.stage === 0} onClick={() => act({ type: "dobutamine", step: "stop" })}>
              Stop the infusion
            </button>
            <button className="btn btn-accent !py-1" disabled={locked || av.infusionStopped || !av.inLv || !reference || !outputReady || !!av.stages[av.stage]} onClick={() => act({ type: "record-stage", artLine: study.artLine, outputReady })}>
              Record this stage
            </button>
          </>
        )}
      </div>
      {av.stage !== null && live && (
        <>
          <div className="monitor rounded-md overflow-hidden">
            <LiveTrace channels={channels} min={0} max={top} height={150} seconds={5} />
          </div>
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            <span className="chip font-mono">HR {live.hr}</span>
            <span className="chip font-mono">MAP {Math.round(live.map)}</span>
            {outputReady && <span className="chip font-mono">output {fmt(live.co, 2)} L/min</span>}
            <span className="chip font-mono">SEP {fmt(live.sep, 2)} s</span>
            {reference && (
              <span className="chip font-mono">
                mean gradient {Math.round(femoral ? femoralGradient(x) : live.meanGradient)} mmHg{femoral ? " (LV to side-arm)" : ""}
              </span>
            )}
            {reveal && <span className="chip font-mono">Gorlin area (live) {fmt(live.ava, 2)} cm²</span>}
          </div>
          {reveal && met.length > 0 && !av.infusionStopped && <div className="notice notice-warn">Stop criterion met: {met.join(", ")}.</div>}
        </>
      )}
      {rows.length > 0 && (
        <table className="w-full text-[12.5px] font-mono">
          <thead>
            <tr className="text-ink-faint text-left">
              <th className="font-normal py-1">Stage</th>
              <th className="font-normal">HR</th>
              <th className="font-normal">Output</th>
              <th className="font-normal">SEP</th>
              <th className="font-normal">Mean grad.</th>
              <th className="font-normal">SV (mL)</th>
              <th className="font-normal">AVA (cm²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, i, r }) => (
              <tr key={m.id} className="border-t border-line/50">
                <td className="py-1">{m.dose === 0 ? "baseline" : `${m.dose}`}</td>
                <td>{r!.hr}</td>
                <td>{r!.co.toFixed(2)}</td>
                <td>{r!.sep.toFixed(2)}</td>
                <td>
                  {r!.meanGradient}
                  {r!.method === "femoral" ? " (fem)" : ""}
                </td>
                <td>
                  <StageInput r={r!} field="sv" locked={locked} reveal={reveal} onEnter={(v) => act({ type: "stage-entry", stage: i, field: "sv", value: v })} />
                </td>
                <td>
                  <StageInput r={r!} field="ava" locked={locked} reveal={reveal} onEnter={(v) => act({ type: "stage-entry", stage: i, field: "ava", value: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > 0 && <p className="text-[12px] text-ink-faint">SV (mL) = output (L/min) × 1000 ÷ HR. Gorlin AVA = output (mL/min) ÷ (HR × SEP × 44.3 × √mean gradient). Write the stage, output, gradient and area together: the decision rests on how they move.</p>}
    </div>
  );
}

function StageInput({ r, field, locked, reveal, onEnter }: { r: StageRecord; field: "sv" | "ava"; locked: boolean; reveal: boolean; onEnter: (v: number) => void }) {
  const [text, setText] = useState("");
  const e = r[field];
  const submit = () => {
    const v = Number(text);
    if (text.trim() && Number.isFinite(v)) onEnter(v);
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        className="field !h-7 !w-16 !px-1.5 !text-[12.5px]"
        inputMode="decimal"
        aria-label={field === "sv" ? "stroke volume" : "Gorlin valve area"}
        value={text}
        disabled={locked}
        placeholder={e ? String(e.value) : ""}
        onChange={(ev) => setText(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && submit()}
        onBlur={submit}
      />
      {e && reveal && <span className={e.accepted ? "text-good" : "text-warn"}>{e.accepted ? "✓" : `✗ ${fmt(stageReference(r, field), field === "sv" ? 0 : 2)}`}</span>}
    </span>
  );
}

function Debrief({ av }: { av: AvStudyState }) {
  const s = avScenario(av);
  const decisions = avDecisions(av);
  const sum = crossingSummary(av);
  const response = lflgResponse(s);
  return (
    <div className="rounded-md border border-line p-2.5 space-y-1 text-[13px]">
      <div className="stat-label">Valve study debrief</div>
      <p className="text-ink-soft">{s.avStudy!.why}</p>
      {sum.unnecessary && <p className="text-warn">Unnecessary crossing: the valve was passed although the non-invasive data did not call for it.</p>}
      {av.attempts > 0 && (
        <p className="text-ink-soft">
          Crossing: {sum.attempts} attempt{sum.attempts === 1 ? "" : "s"}, {sum.seconds} s at the valve, manipulation quality {sum.quality}, embolic risk {sum.risk}.
        </p>
      )}
      {response && <p className="text-ink-soft">Dobutamine response: {LFLG_RESPONSE_TEXT[response]}.</p>}
      <ul className="space-y-0.5">
        {decisions.map((d) => (
          <li key={d.id} className={d.correct ? "text-good" : "text-warn"}>
            {d.correct ? "✓" : "✗"} {d.label}: {d.given}
            {d.correct ? "" : ` (expected: ${d.expected})`}
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-ink-faint">
        Stage table tolerances: stroke volume within {Math.round(STAGE_SV_REL_TOLERANCE * 100)}%, area within {AVA_TOLERANCE.abs} cm² (model parameters of this lab).
      </p>
    </div>
  );
}
