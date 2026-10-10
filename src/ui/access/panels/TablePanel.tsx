// The table: sheath preparation, catheter preparation and exchanges.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
//
// Sheath preparation (access-femoral-upsizing-angiogram): SheathPrep is the
// side arm of the sheath in the active site, shared with the ultrasound view:
// aspirate 3-4 mL and discard, then flush from a second syringe (or, wrongly,
// from the one just aspirated into), and transduce the side arm, whose trace
// is drawn as a monitor strip. Before a later catheter the sheath is
// aspirated again; nothing here says whether it was done, as an operator
// would only know from having done it.
//
// Diagnostic catheters (proc-preprocedure-orders): in the pre-procedure order
// sheet scenarios the catheter set (5 Fr without side holes, 6 Fr, or with
// side holes) is chosen here before the first catheter, and the contrast used
// so far is shown against the ceiling stated at the time-out, as the team
// would read it out.
//
// The end of the case (proc-recovery-ward): before the patient leaves the
// table the learner asks the patient to speak and move all four limbs (the
// finding is what the patient shows). A stroke on the table after a flushed
// clot or air (the patient's words and hand) opens a first-action menu here,
// which does not name the problem; the attending has stopped the case.
import { useState } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import type { CaseSession, CatheterId } from "../../../simulation/session/caseSession";
import { SHEATHS } from "../../../simulation/access/closure";
import { SOURCED_UPSIZING, sideArmTrace } from "../../../simulation/access/upsizing";
import { useSession } from "../panels";
import { preordersOf } from "../../../simulation/session/modules/preorders";
import { CATHETER_SET_LABEL, type CatheterSet } from "../../../simulation/session/preorders";
import { WARD_EVENT_RULES } from "../../../simulation/session/ward";

const CATHETERS: { id: CatheterId; label: string }[] = [
  { id: "TIG", label: "Radial universal (TIG)" },
  { id: "JR4", label: "Judkins right 4" },
  { id: "JL4", label: "Judkins left 4" },
  { id: "AL1", label: "Amplatz left 1" },
  { id: "pigtail", label: "Pigtail" },
];

export function TablePanel({ guided }: { guided: boolean }) {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const toDiagnostic = useProcedureStore((x) => x.toDiagnostic);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const [cath, setCath] = useState<CatheterId>(s.access === "femoral" ? "JR4" : "TIG");
  const c = s.catheter;
  const ex = s.ex;
  const busy = s.busy;
  const [trace, setTrace] = useState<string | null>(null);
  const step = (label: string, done: boolean, can: boolean, fn: () => void, danger = false) => (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5">
      <span className={`text-[13px] ${done ? "text-ink-faint" : "text-ink"}`}>{label}</span>
      <button className={`btn ${danger ? "btn-danger" : ""}`} disabled={!can || busy} onClick={fn}>
        {done ? "Again" : "Do"}
      </button>
    </div>
  );
  const miss = s.readiness();
  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Table: catheter, wire, manifold</span>
        <span className="normal-case tracking-normal text-ink-faint text-[12px]">{s.sheath ? `${SHEATHS[s.sheath.id].label} sheath in` : "no sheath"}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {s.sheath && <SheathPrep session={s} />}
          <CatheterPlan session={s} />
          <div className="text-[12px] text-ink-faint">Before it goes in</div>
          <select className="field" value={cath} onChange={(e) => setCath(e.target.value as CatheterId)} disabled={!!c?.inBody}>
            {CATHETERS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          {step("Flush the catheter with heparinised saline", !!c?.prepped && c.id === cath, !c?.inBody, () => act((x) => x.prepCatheter(cath)))}
          {step(
            "Wire into the catheter, both into the sheath",
            !!c?.inBody,
            !!s.sheath && !c?.inBody,
            () => {
              if (act((x) => x.loadCatheter(cath))) setWorkspace("fluoro");
            },
          )}
          <div className="text-[12px] text-ink-faint mt-2">At the root (catheter in the ascending aorta)</div>
          {step("Pull the wire, letting the hub back-bleed", ex.wireOut && ex.backBled, !!c?.inBody && !ex.wireOut, () => act((x) => x.pullWire(true)))}
          {step("Pull the wire straight out", ex.wireOut && !ex.backBled, !!c?.inBody && !ex.wireOut, () => act((x) => x.pullWire(false)))}
          {step("Aspirate to waste", ex.aspirated, ex.wireOut && !!c?.inBody, () => act((x) => x.aspirate()))}
          {step("Flush the catheter", ex.flushed, ex.wireOut && !!c?.inBody, () => act((x) => x.flush()))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[12px] text-ink-faint">Manifold and transducer</div>
          {step("Flush the manifold and line", ex.lineFlushed, true, () => act((x) => x.flushLine()))}
          {step("Connect the catheter to the manifold", ex.connected, ex.wireOut && !!c?.inBody, () => act((x) => x.connectManifold()))}
          {step("Zero the transducer to air", ex.zeroed, true, () => act((x) => x.zero()))}
          {step(`Level the transducer at the mid-chest${guided && !ex.levelled ? ` (now ${Math.abs(s.transducerHeightCm)} cm ${s.transducerHeightCm > 0 ? "above" : "below"})` : ""}`, ex.levelled, true, () => act((x) => x.level()))}
          {step("Look at the aortic trace", ex.traceChecked, ex.connected, () => {
            const r = act((x) => x.checkTrace());
            if (r) setTrace(r.displayed);
          })}
          {trace && <div className="text-[13px] font-mono text-ink-soft">Aortic {trace} mmHg</div>}
          {guided && miss.length > 0 && <div className="notice notice-info text-[12px]">Still to do before injecting: {miss.join(", ")}.</div>}
          <button className="btn btn-accent mt-1" disabled={!c?.inBody || busy} onClick={toDiagnostic}>
            Start the angiogram
          </button>
          <button className="btn" disabled={!c?.inBody || busy} onClick={() => act((x) => x.removeCatheter())}>
            Take the catheter out
          </button>
          <div className="text-[12px] text-ink-faint mt-2">Before the patient leaves the table</div>
          {step("Ask the patient to speak and to move all four limbs", !!s.ward.tableNeuroCheck, true, () => act((x) => x.neuroCheckAtTable()))}
          {s.ward.tableNeuroCheck && <div className="text-[13px] text-ink-soft">{s.ward.tableNeuroCheck.finding}</div>}
          <TableStroke session={s} />
        </div>
      </div>
    </div>
  );
}

/**
 * The order sheet scenarios' catheter set and the contrast against the stated ceiling
 * (proc-preprocedure-orders). Nothing here says which set is right.
 */
function CatheterPlan({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const m = preordersOf(s);
  if (!m?.state) return null;
  const st = m.state;
  const chosen = s.hookAt["catheter-in"] !== undefined || !!s.catheter?.inBody;
  const budget = m.actions.budget();
  return (
    <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">
      <div className="text-[13px] text-ink">Diagnostic catheters</div>
      <select
        className="field"
        value={st.catheterSet ?? ""}
        disabled={chosen || s.busy}
        onChange={(e) => e.target.value && act((x) => preordersOf(x)?.actions.setCatheterSet(e.target.value as CatheterSet))}
        aria-label="Diagnostic catheter set"
      >
        <option value="">Choose the set</option>
        {(Object.keys(CATHETER_SET_LABEL) as CatheterSet[]).map((id) => (
          <option key={id} value={id}>
            {CATHETER_SET_LABEL[id]}
          </option>
        ))}
      </select>
      {budget && (
        <div className="text-[12px] text-ink-soft">
          Contrast <span className="metric text-ink">{Math.round(budget.usedMl)}</span> of <span className="metric text-ink">{st.ceilingMl}</span> mL stated
        </div>
      )}
    </div>
  );
}

/**
 * The sheath's side arm: aspirate and discard, flush with a second syringe (or the same one), and transduce it.
 * The trace strip shows what the transducer shows; it is drawn from the sheath's state once the side arm has been
 * transduced, so it reads the same here and in the ultrasound view.
 */
export function SheathPrep({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const sh = s.sheath;
  if (!sh) return null;
  const busy = s.busy;
  const [a0, a1] = SOURCED_UPSIZING.aspirateMl;
  return (
    <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">
      <div className="text-[13px] text-ink">Sheath side arm</div>
      <button className="btn" disabled={busy} onClick={() => act((x) => x.aspirateSheath())}>
        Aspirate {a0}-{a1} mL and discard
      </button>
      <div className="grid grid-cols-2 gap-1">
        <button className="btn" disabled={busy} onClick={() => act((x) => x.flushSheathSide("fresh"))} title="Heparinised saline from a second, clean syringe">
          Flush: second syringe
        </button>
        <button className="btn" disabled={busy} onClick={() => act((x) => x.flushSheathSide("same"))} title="Heparinised saline from the syringe just used to aspirate">
          Flush: same syringe
        </button>
      </div>
      <button
        className="btn"
        disabled={busy || !!s.catheter?.inBody}
        onClick={() => act((x) => x.transduceSheath())}
      >
        Transduce the side arm
      </button>
      {sh.waveform && <SideArmTrace kind={sh.waveform} text={sh.waveformText ?? ""} />}
    </div>
  );
}

/** The side-arm pressure strip (a monitor: trace colours allowed). */
function SideArmTrace({ kind, text }: { kind: "arterial" | "damped" | "venous"; text: string }) {
  const ys = sideArmTrace(kind === "arterial" ? "arterial" : "damped");
  const pts = ys.map((y, i) => `${(i / (ys.length - 1)) * 300},${52 - y * 44}`).join(" ");
  return (
    <div className="monitor rounded-md p-2">
      <svg viewBox="0 0 300 56" className="w-full h-12" aria-label="side-arm pressure trace">
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" className="text-art" />
      </svg>
      <div className="text-[12px] text-ink-soft font-mono">{text}</div>
    </div>
  );
}

/** A stroke on the table: what the patient shows, what has been done, and the first-action menu (no name for it). */
function TableStroke({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const e = s.ward.tableStroke;
  if (!e) return null;
  const rule = WARD_EVENT_RULES[e.kind];
  const done = new Set(e.actions.map((a) => a.id));
  return (
    <div className="notice notice-danger flex flex-col gap-2 mt-1">
      <div className="text-[13px]">{e.report}</div>
      {e.actions.length > 0 && (
        <ol className="text-[12px] list-decimal pl-5">
          {e.actions.map((a, i) => (
            <li key={i}>
              {rule.options.find((o) => o.id === a.id)?.label}
              {a.result ? `: ${a.result}` : ""}
            </li>
          ))}
        </ol>
      )}
      {e.resolvedAt === null && (
        <div className="flex gap-1.5 flex-wrap">
          {rule.options.map((o) => (
            <button key={o.id} className="btn" disabled={s.busy || done.has(o.id)} onClick={() => act((x) => x.wardAct(e.id, o.id))}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
