// The ad hoc or delayed PCI decision gate of the full case (proc-adhoc-gate). It replaces the
// diagnostic lab's 'Proceed to ad hoc PCI' button: at the end of the diagnostic stage it shows what
// the operator has in front of them (the study report's decision and target, or the team's report of a
// study the case opened after, with 'Review the angiogram' to the diagnostic lab; the contrast used against
// the case's budget, screening time, air kerma and kerma-area product, the consent wording, the centre's
// capabilities, any complication so far, the patient now and the time of day) and asks for the
// decision and the reasons to defer that apply (Brilakis 7.3). A STEMI call that the case schedules
// interrupts while the decision is pending and must be acknowledged first. Nothing on the gate says
// which reasons apply: the decision is scored on the case's ledger and shown in the debrief.
// The rules and the facts are src/simulation/session/adhoc.ts; the store keeps the gate
// (useProcedureStore: adhoc, decideAdHoc, acknowledgeAdHocCall). While it is open its tips are the
// diagnostic finish with the dose events when present (adHocTipContext): the three decision tips first,
// the same in every case, then the rest without the acquisition tips (adHocGateTips).
import { useEffect, useMemo, useState } from "react";
import { useProcedureStore } from "../../state/useProcedureStore";
import { ADHOC_GATE_TIP_DEPTH, AD_HOC_CHOICE_LABEL, CENTRE_LABEL, adHocGateTips, adHocTipContext, reportDecisionLabel, timeOfDay, type AdHocChoice, type CentreCapabilities } from "../../simulation/session/adhoc";
import { DEFERRAL_REASONS, type DeferralReason, type StudyDecision } from "../../mentor/report";
import type { PciTarget } from "../../simulation/session/handover";
import { INDICATION_LABEL } from "../../simulation/patient/patient";
import LabTipsPanel from "../lab/LabTipsPanel";
import { tipsVisible, useTipsModule } from "../lab/useLabTips";
import { clockText } from "./orders/Heparin";

/** The choice a study report's decision starts the gate on (the learner may change it). */
function choiceFromReport(d: StudyDecision | null | undefined): AdHocChoice | null {
  if (d === "adhoc") return "proceed";
  if (d === "heart-team" || d === "staged" || d === "no-pci") return "defer";
  return null;
}

function targetText(t: PciTarget): string {
  return [t.vessel, t.segment, t.qcaPct !== null ? `your QCA ${t.qcaPct}%` : null, t.lengthMm !== null ? `${t.lengthMm} mm` : null].filter(Boolean).join(", ");
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-base-800 p-2.5">
      <div className="stat-label">{label}</div>
      <div className="mt-1 text-[13px] text-ink-soft">{children}</div>
    </div>
  );
}

export interface AdHocGateProps {
  /** back to the case's workspaces with the decision still pending */
  onHide?: () => void;
  className?: string;
}

export default function AdHocGate({ onHide, className = "" }: AdHocGateProps) {
  const s = useProcedureStore((x) => x.session);
  const g = useProcedureStore((x) => x.adhoc);
  useProcedureStore((x) => x.version);
  const decide = useProcedureStore((x) => x.decideAdHoc);
  const acknowledge = useProcedureStore((x) => x.acknowledgeAdHocCall);
  const askHelp = useProcedureStore((x) => x.askHelp);
  const toDiagnostic = useProcedureStore((x) => x.toDiagnostic);
  const inputs = useProcedureStore.getState().adHocInputs();
  const report = inputs?.report ?? null;
  const [choice, setChoice] = useState<AdHocChoice | null>(() => choiceFromReport(report?.decision));
  const [reasons, setReasons] = useState<DeferralReason[]>(() => [...(report?.reasons ?? [])]);
  const mod = useTipsModule();
  const visible = s ? tipsVisible({ mode: s.mode, helpAskedAt: s.helpAskedAt }) : false;
  const ctx = inputs ? adHocTipContext(inputs) : null;
  const key = JSON.stringify(ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tracked by the context's content key
  const tips = useMemo(() => (mod && ctx && visible ? adHocGateTips(mod.tipsFor(ctx, ADHOC_GATE_TIP_DEPTH)) : []), [mod, key, visible]);
  useEffect(() => {
    if (s && tips.length) s.noteTipsShown(tips.map((t) => t.id));
  }, [s, tips]);

  if (!s || !g || g.outcome || !inputs) return null;
  const c = inputs.contrast;
  const pct = c.budgetMl ? Math.min(100, Math.round((c.usedMl / c.budgetMl) * 100)) : null;
  const callPending = !!inputs.interruption && g.acknowledgedAt === null;
  const centre = Object.keys(CENTRE_LABEL) as (keyof CentreCapabilities)[];
  const canRecord = !!choice && !callPending && !s.busy && (choice === "proceed" || reasons.length > 0);
  const toggle = (id: DeferralReason) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  return (
    <section className={`panel flex flex-col ${className}`} aria-label="Ad hoc or delayed PCI" data-adhoc-gate>
      <div className="panel-head">
        <span>Ad hoc or delayed PCI</span>
        <span className="flex items-center gap-2">
          <span className="chip font-mono" title="Time of day" data-adhoc-clock>
            Time of day {timeOfDay(inputs.clockMin)}
          </span>
          {onHide && (
            <button type="button" className="btn btn-ghost" onClick={onHide}>
              Back to the case
            </button>
          )}
        </span>
      </div>

      {inputs.interruption && (
        <div className={`notice ${callPending ? "notice-danger" : "notice-warn"} mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]`} role="alert" data-adhoc-call>
          <span>{inputs.interruption.text}</span>
          {callPending && (
            <button type="button" className="btn btn-accent" onClick={acknowledge}>
              Acknowledge
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-2">
          <Fact label="Study report">
            {report ? (
              <>
                <div className="text-ink">{reportDecisionLabel(report.decision)}</div>
                <div className="mt-0.5">{report.target ? `Target: ${targetText(report.target)}` : "No PCI target named"}</div>
              </>
            ) : inputs.facts.studyFindings ? (
              <div className="text-ink" data-adhoc-findings>
                {inputs.facts.studyFindings}
              </div>
            ) : (
              <>
                <div className="text-ink">No study report submitted for this case</div>
                <div className="mt-0.5">No PCI target named</div>
              </>
            )}
            {/* the angiogram in the diagnostic lab: a study report filed there is read here when the case comes back */}
            <button type="button" className="btn btn-ghost mt-1.5" disabled={s.busy} onClick={toDiagnostic} data-adhoc-review>
              Review the angiogram
            </button>
          </Fact>
          <Fact label="Contrast so far">
            <div className="flex items-baseline gap-2">
              <span className="metric text-ink" data-adhoc-contrast>
                {Math.round(c.usedMl)} mL
              </span>
              <span>{c.budgetMl !== null ? `of a ${c.budgetMl} mL budget, ${Math.round(c.remainingMl ?? 0)} mL left` : "no budget set for this case"}</span>
            </div>
            {pct !== null && (
              <div className="bar mt-1.5" aria-label={`Contrast ${pct}% of the budget`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            )}
          </Fact>
          <Fact label="Radiation so far">
            Screening <span className="metric text-ink">{clockText(inputs.fluoroS)}</span> · air kerma <span className="metric text-ink">{Math.round(inputs.karMGy)} mGy</span> · KAP{" "}
            <span className="metric text-ink">{Math.round(inputs.kapGyCm2 * 10) / 10} Gy·cm²</span>
          </Fact>
          <Fact label="Consent form">“{inputs.consent.wording || "No consent form wording on the chart"}”</Fact>
          <Fact label="Patient now">
            {INDICATION_LABEL[inputs.indication]} · chest pain {inputs.chestPain}/10
            {inputs.facts.patientWishes ? <div className="mt-0.5">{inputs.facts.patientWishes}</div> : null}
            {inputs.facts.preparation ? <div className="mt-0.5">{inputs.facts.preparation}</div> : null}
            {inputs.facts.fatigue ? <div className="mt-0.5">{inputs.facts.fatigue}</div> : null}
          </Fact>
          <Fact label="Complications so far">
            {inputs.complications.length ? (
              <ul className="list-disc pl-4">
                {inputs.complications.map((x) => (
                  <li key={x.id}>{x.label}</li>
                ))}
              </ul>
            ) : (
              "None recorded"
            )}
          </Fact>
          <Fact label="This centre">
            <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              {centre.map((k) => (
                <li key={k} className={inputs.centre[k] ? "text-ink-soft" : "text-ink-faint line-through"}>
                  {CENTRE_LABEL[k]}
                </li>
              ))}
            </ul>
          </Fact>
        </div>

        <div className="border-t border-line px-4 py-3">
          <h3 className="text-[13px] font-semibold text-ink">Decision</h3>
          <div className="seg mt-2 flex-wrap">
            {(["proceed", "defer"] as const).map((d) => (
              <button key={d} type="button" data-adhoc-choice={d} className={`seg-btn ${choice === d ? "seg-btn-active" : ""}`} aria-pressed={choice === d} disabled={callPending} onClick={() => setChoice(d)}>
                {AD_HOC_CHOICE_LABEL[d]}
              </button>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-ink-faint">Reasons to defer that apply (Brilakis 7.3)</div>
          <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
            {DEFERRAL_REASONS.map((x) => (
              <label key={x.id} className="flex items-start gap-2 text-[13px] text-ink-soft" title={x.detail}>
                <input className="mt-1" type="checkbox" disabled={callPending} checked={reasons.includes(x.id)} onChange={() => toggle(x.id)} data-adhoc-reason={x.id} />
                <span>
                  <span className="text-ink">{x.title}</span>: {x.detail}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] text-ink-faint">
              {callPending ? "Answer the call first." : choice === "defer" && !reasons.length ? "Tick the reasons that make you stop." : choice === "proceed" ? "Next: the PCI heparin dose and the ACT at the table." : choice === "defer" ? "Next: closure, with a note to plan a staged PCI." : ""}
            </span>
            <button type="button" className="btn btn-accent" disabled={!canRecord} onClick={() => choice && decide(choice, reasons)} data-adhoc-record>
              Record the decision
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <LabTipsPanel tips={tips} visible={visible} mode={s.mode} onAskHelp={askHelp} events={ctx?.events ?? []} title="Tips" />
        </div>
      </div>
    </section>
  );
}
