// The full case's chart, consent and time-out, with the chart sections registered in src/ui/access/chart/.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
import { useProcedureStore } from "../../../state/useProcedureStore";
import type { ChartItemId } from "../../../simulation/session/caseSession";
import { CHART_SECTIONS } from "../chart";
import { clock, useSession } from "../panels";
import { AccessPicker } from "./AccessPicker";

export function ChartPanel() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const items = Object.values(s.chart);
  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Chart, consent and time-out</span>
        <span className="normal-case tracking-normal text-ink-faint text-[12px]">{s.profile.ageY} y, {s.profile.sex === "M" ? "man" : "woman"}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-md border border-line p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-ink">{it.label}</span>
                {!it.reviewed && (
                  <button className="btn btn-ghost" disabled={s.busy} onClick={() => act((x) => x.reviewChart(it.id as ChartItemId))}>
                    Read
                  </button>
                )}
              </div>
              {it.reviewed && <p className="text-[13px] text-ink-soft mt-1 leading-snug">{it.text}</p>}
            </div>
          ))}
          {s.contrastBudgetMl !== null && <div className="notice notice-info">Contrast budget agreed: {s.contrastBudgetMl} mL.</div>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-md border border-line p-2.5 flex items-center justify-between gap-2">
            <span className="text-[13px] text-ink">Consent confirmed with the patient</span>
            {s.consent.obtained ? (
              <span className="chip">done</span>
            ) : (
              <button className="btn btn-ghost" disabled={s.busy} onClick={() => act((x) => x.confirmConsent())}>
                Confirm
              </button>
            )}
          </div>
          <div className="rounded-md border border-line p-2.5">
            <div className="text-[13px] text-ink mb-2">Team time-out</div>
            <div className="flex flex-col gap-1.5">
              {s.timeOutItems().map((i) => (
                <label key={i.id} className="flex items-start gap-2 text-[13px] text-ink-soft">
                  <input type="checkbox" checked={!!s.timeOut.checked[i.id]} disabled={!!s.timeOut.checked[i.id] || s.busy} onChange={() => act((x) => x.confirmTimeOutItem(i.id))} className="mt-1" />
                  <span>{i.text}</span>
                </label>
              ))}
            </div>
            {s.timeOutDone && <p className="text-[12px] text-ink-faint mt-2">Time-out completed at {clock(s.timeOut.completedAt!)}.</p>}
          </div>
          <div className="rounded-md border border-line p-2.5">
            <div className="text-[13px] text-ink mb-1">Planned access</div>
            <AccessPicker />
            <p className="text-[12px] text-ink-faint mt-2 leading-snug">The route can change until the first skin puncture.</p>
          </div>
          {CHART_SECTIONS.filter((sec) => sec.applies?.(s) ?? true).map((sec) => (
            <section key={sec.id} className="rounded-md border border-line p-2.5" aria-label={sec.title} data-section={sec.id}>
              <div className="text-[13px] text-ink mb-2">{sec.title}</div>
              <sec.Component session={s} act={act} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
