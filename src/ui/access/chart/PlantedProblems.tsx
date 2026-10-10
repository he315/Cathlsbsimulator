// The full case's pre-procedure record and pre-puncture checklist (proc-chart-planted-problems): a
// chart section (src/ui/access/chart/index.ts) over the session module 'planning'
// (src/simulation/session/modules/planning.ts). It shows what an operator would read and do: the
// record's items (read one at a time, each takes chart time), the actions on the chart with what
// each returned, and Oxford's checklist before the needle. Nothing here says which item is the
// planted problem or whether an action was right; that is in the debrief's ledger.
import { useState } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import { PLANNING_ACTIONS, PRE_PUNCTURE_CHECKLIST, planningActionLabel, type PlanningActionId } from "../../../simulation/session/planning";
import { planningOf } from "../../../simulation/session/modules/planning";

function PlantedProblemsSection({ session, act }: CaseSectionProps) {
  const m = planningOf(session);
  const [choice, setChoice] = useState<PlanningActionId>("proceed");
  if (!m) return null;
  const st = m.state;
  const busy = session.busy;
  const ended = !!st.postponed;
  const spo2Refused = !!st.note && st.note.startsWith("SpO2") && st.note.includes("Give oxygen");
  const gated = session.policy.timeOutRequired && !st.checklistByTeam;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-medium text-ink-soft">Pre-procedure record</div>
        {st.record.items.map((it) => {
          const read = st.reviewed[it.id] !== undefined;
          return (
            <div key={it.id} className="rounded-md border border-line p-2.5" data-record-item={it.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-ink">{it.label}</span>
                {!read && (
                  <button className="btn btn-ghost" disabled={busy} onClick={() => act((x) => planningOf(x)?.actions.readItem(it.id))}>
                    Read
                  </button>
                )}
              </div>
              {read && (
                <ul className="mt-1 flex flex-col gap-0.5">
                  {it.lines.map((l, i) => (
                    <li key={i} className="text-[13px] text-ink-soft leading-snug">
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-medium text-ink-soft">Act on the chart</div>
        {ended ? (
          <div className="notice notice-warn">{st.postponed!.text} Start a new patient to continue.</div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select className="field flex-1 min-w-0" value={choice} onChange={(e) => setChoice(e.target.value as PlanningActionId)} aria-label="Action on the chart">
              {PLANNING_ACTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {planningActionLabel(a.id, st.record.facts.setting)}
                </option>
              ))}
            </select>
            <button className="btn" disabled={busy} onClick={() => act((x) => planningOf(x)?.actions.act(choice))}>
              Record action
            </button>
          </div>
        )}
        {st.actions.length > 0 && (
          <ul className="flex flex-col gap-1">
            {st.actions.map((a, i) => (
              <li key={i} className="text-[12px] text-ink-soft leading-snug">
                <span className="text-ink">{planningActionLabel(a.id, st.record.facts.setting)}.</span>
                {a.result ? ` ${a.result}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!st.checklistByTeam && !ended && (
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-medium text-ink-soft">Before the first puncture</div>
          <div className="flex flex-col gap-1.5">
            {PRE_PUNCTURE_CHECKLIST.map((c) => (
              <label key={c.id} className="flex items-start gap-2 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={st.checklist[c.id] !== undefined}
                  disabled={st.checklist[c.id] !== undefined || busy}
                  onChange={() => act((x) => planningOf(x)?.actions.confirmCheck(c.id))}
                />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
          {st.note && !st.actions.some((a) => a.result === st.note) && <p className="text-[12px] text-ink-faint leading-snug">{st.note}</p>}
          {spo2Refused && (
            <button className="btn btn-ghost self-start" disabled={busy} onClick={() => act((x) => planningOf(x)?.actions.giveOxygen())}>
              Start oxygen
            </button>
          )}
          {gated && !m.actions.checklistDone() && <p className="text-[12px] text-ink-faint leading-snug">In this mode the needle waits for the time-out and this checklist.</p>}
        </div>
      )}
    </div>
  );
}

export const section: CaseSection = {
  id: "planted-problems",
  title: "Pre-procedure record and checklist",
  order: 10,
  applies: (s) => !!planningOf(s),
  Component: PlantedProblemsSection,
};
