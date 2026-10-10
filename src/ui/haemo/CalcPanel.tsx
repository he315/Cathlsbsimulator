// The calculations of the haemodynamics lab (split from HaemoLab.tsx and made learner-entered by
// haemo-study-session-and-tips). The learner works out each number from the recorded pressures and
// saturations and enters it; the entry is graded against gradedTruth() within CALC_TOLERANCE and the
// formula is shown once an entry is made (in guided mode it can be shown on request first). The
// accepted / outside-tolerance verdict is a guided aid: supervised, independent and exam runs show
// only what was entered, and the verdict and reference value appear in the debrief. For the shock presets the after-PCI set ends with the
// decision table from the module (pm-support-choice-rv) and the learner's choice of action.
import { useState } from "react";
import type { AssessmentMode } from "../../mentor/types";
import {
  CALCS,
  SHOCK_ACTIONS,
  SHOCK_TABLE,
  SHOCK_TABLE_SOURCE,
  calcAvailable,
  calcBlocked,
  currentSet,
  recorderTimings,
  studyScenario,
  type CalcKey,
  type CalcSpec,
  type HaemoAction,
  type HaemoStudyState,
} from "../../simulation/haemoStudy";

export interface CalcPanelProps {
  study: HaemoStudyState;
  dispatch: (a: HaemoAction) => void;
  mode: AssessmentMode;
}

const fmt = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d) : "—");

export default function CalcPanel({ study, dispatch, mode }: CalcPanelProps) {
  const open = study.calcOpen;
  const s = studyScenario(study);
  const m = currentSet(study);
  const locked = study.answer !== null;
  const timings = recorderTimings(study);
  const haveCO = calcAvailable(study, "co");
  return (
    <div className="panel">
      <div className="panel-head">
        <button type="button" className="flex items-center gap-2 text-left" aria-expanded={open} onClick={() => dispatch({ type: "calc-panel", open: !open })}>
          <span aria-hidden className="inline-block w-3 text-ink-faint">
            {open ? "−" : "+"}
          </span>
          Calculations
        </button>
        <span className="font-mono normal-case tracking-normal text-ink-faint">{Object.keys(m.entries).length} entered</span>
      </div>
      {!open ? (
        <p className="px-3 py-2 text-[12.5px] text-ink-faint">Open to work out output, resistances, power, PAPi and valve areas from what you have recorded.</p>
      ) : (
        <div className="p-3 space-y-2 text-[13px]">
          {CALCS.map((c) => (
            <CalcRow
              key={`${study.set}:${c.key}`}
              spec={c}
              available={calcAvailable(study, c.key)}
              entry={m.entries[c.key]}
              formulaShown={!!study.formulaShown[c.key]}
              canAskFormula={mode === "guided"}
              showVerdict={mode === "guided"}
              blocked={calcBlocked(study, c.key)}
              locked={locked}
              note={inputsNote(c.key, study, timings)}
              onEnter={(v) => dispatch({ type: "enter", key: c.key, value: v })}
              onShowFormula={() => dispatch({ type: "show-formula", key: c.key })}
            />
          ))}
          {haveCO && s.tdUnreliable && <div className="text-warn text-[12px]">Thermodilution: {s.tdUnreliable}.</div>}
          {study.set === "post" && <ShockDecision study={study} dispatch={dispatch} locked={locked} />}
        </div>
      )}
    </div>
  );
}

/** Recorder values a formula needs that are not in the pressure table (valve timings and gradients). */
function inputsNote(key: CalcKey, study: HaemoStudyState, t: { sep: number; dfp: number; hr: number }): string | undefined {
  const r = currentSet(study).rec;
  if (key === "ava" && r.aorticMeanGradient !== undefined) return `recorder: mean LV–Ao gradient ${r.aorticMeanGradient} mmHg · SEP ${fmt(t.sep, 2)} s · HR ${t.hr}`;
  if (key === "mva" && r.mitralMeanGradient !== undefined) return `recorder: mean wedge–LV gradient ${r.mitralMeanGradient} mmHg · DFP ${fmt(t.dfp, 2)} s · HR ${t.hr}`;
  return undefined;
}

function CalcRow({
  spec,
  available,
  entry,
  formulaShown,
  canAskFormula,
  showVerdict,
  blocked,
  locked,
  note,
  onEnter,
  onShowFormula,
}: {
  spec: CalcSpec;
  available: boolean;
  entry?: { value: number; attempts: number; accepted: boolean };
  formulaShown: boolean;
  canAskFormula: boolean;
  /** show the accepted / outside-tolerance verdict (guided mode only) */
  showVerdict: boolean;
  /** why the calculation does not apply to this scenario, if it does not */
  blocked?: string;
  locked: boolean;
  note?: string;
  onEnter: (v: number) => void;
  onShowFormula: () => void;
}) {
  const [text, setText] = useState("");
  const value = Number(text.replace(",", "."));
  const valid = text.trim() !== "" && Number.isFinite(value);
  const submit = () => {
    if (!valid) return;
    onEnter(value);
    setText("");
  };
  return (
    <div className={`rounded-md border px-2.5 py-1.5 ${available ? "border-line bg-base-800/60" : "border-line/50 opacity-60"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-soft">
          {spec.label}
          {spec.unit && <span className="text-ink-faint"> ({spec.unit})</span>}
        </span>
        {available && !locked ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              aria-label={`${spec.label} entry`}
              inputMode="decimal"
              className="w-20 bg-base-900 border border-line rounded px-1.5 py-0.5 text-right font-mono text-ink"
              value={text}
              placeholder={entry ? String(entry.value) : ""}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn !px-2 !py-0.5 !text-[12px]" disabled={!valid}>
              Check
            </button>
          </form>
        ) : (
          <span className="font-mono text-ink">{entry ? entry.value : "—"}</span>
        )}
      </div>
      {!available ? (
        <div className="text-[12px] text-ink-faint mt-0.5">{blocked ?? `needs ${spec.need}`}</div>
      ) : (
        <>
          {entry && (
            <div className={`text-[12px] mt-0.5 ${!showVerdict ? "text-ink-soft" : entry.accepted ? "text-good" : "text-warn"}`}>
              {`${entry.value} ${spec.unit}`.trim()}
              {showVerdict ? `: ${entry.accepted ? "accepted" : "outside tolerance, check the inputs and try again"}` : " entered"}
              {entry.attempts > 1 ? ` · ${entry.attempts} entries` : ""}
            </div>
          )}
          {note && <div className="text-[12px] text-ink-faint mt-0.5 font-mono">{note}</div>}
          {entry || formulaShown ? (
            <div className="text-[12px] text-ink-faint mt-0.5">{spec.formula}</div>
          ) : (
            canAskFormula && (
              <button type="button" className="text-[12px] text-accent hover:underline mt-0.5" onClick={onShowFormula}>
                Show the formula
              </button>
            )
          )}
        </>
      )}
    </div>
  );
}

function ShockDecision({ study, dispatch, locked }: { study: HaemoStudyState; dispatch: (a: HaemoAction) => void; locked: boolean }) {
  const chosen = currentSet(study).decision;
  return (
    <div className="rounded-md border border-line px-2.5 py-2 mt-3">
      <div className="stat-label mb-1">After PCI: escalate or wean</div>
      <table className="w-full text-[12px] mb-2">
        <tbody>
          {SHOCK_TABLE.map((r) => (
            <tr key={r.finding} className="border-b border-line/50 align-top">
              <td className="py-1 pr-2 text-ink-soft">{r.finding}</td>
              <td className="py-1 text-ink-faint">{r.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[11.5px] text-ink-faint mb-2">From {SHOCK_TABLE_SOURCE}.</div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Decision after PCI">
        {SHOCK_ACTIONS.map((a) => (
          <button key={a.id} type="button" disabled={locked} className={`btn !py-1 !text-[12px] ${chosen === a.id ? "btn-accent" : ""}`} onClick={() => dispatch({ type: "decide", action: a.id })}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
