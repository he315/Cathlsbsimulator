// Hyperaemia, measurement, pullback and drift check of a pressure-wire study, the console's log and
// thermodilution (physiology-engine-unify-and-setup). The log shows what the console shows; why a
// reading cannot be trusted (PwLogEntry.aid) appears only when the lab passes showAids (guided
// practice), and in the debrief.
//
// Hyperaemia (physiology-hyperaemia-and-adenosine): the operator chooses the agent, the route and the
// dose. Intracoronary adenosine with a dose in µg, given slowly or as a fast push, then a guide flush;
// IV adenosine at a rate in µg/kg/min through a chosen vein; contrast (8 mL) for contrast FFR. The
// checks an operator makes when hyperaemia seems to fail (the cannula, the drug labels, caffeine) and
// the monitor's rate and mean pressure (the signs that IV adenosine is working) sit beside them. No
// field is filled with the right dose and nothing on this panel says whether hyperaemia was reached.
// The bedside orders for adenosine's arrhythmias are in OrdersPanel, shown beneath once the lab passes
// the monitor's rhythm to the session (pwSession.pwPatientInput): a lab that does so also gives its
// engine the orders (applyPwActionToEngine), so the buttons act on the patient rather than only the log.
import { useState } from "react";
import { CUTOFF, thermodilution } from "../../simulation/physiology";
import { CONTRAST_FFR_ML, IV_ADENOSINE_UG_KG_MIN, PW_IV_SITES, measuredCase, sessionPreset, type PwAction, type PwIvSite, type PwSessionState } from "../../simulation/pci/pwSession";
import OrdersPanel from "./OrdersPanel";

export interface MeasurePanelProps {
  session: PwSessionState;
  dispatch: (a: PwAction) => void;
  disabled?: boolean;
}

/** A number typed into a field, or NaN when it is empty or not a number. */
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export default function MeasurePanel({ session: s, dispatch, disabled }: MeasurePanelProps) {
  const d = !!disabled || !!s.pullback?.active;
  const vessel = sessionPreset(s).case.vessel;
  // the IC dose has no default: choosing it for the vessel is the task; the IV rate starts at the lower standard rate
  const [icDose, setIcDose] = useState("");
  const [ivRate, setIvRate] = useState(String(IV_ADENOSINE_UG_KG_MIN.low));
  const [ivSite, setIvSite] = useState<PwIvSite>("hand");
  const running = s.hyper.mode !== "none";
  // a bolus or an infusion is offered only once a positive number is entered (an empty field sends nothing)
  const icReady = num(icDose) > 0;
  const ivReady = num(ivRate) > 0;
  return (
    <>
      <div className="panel p-3 space-y-1.5">
        <div className="stat-label">2 · Hyperaemia</div>
        <div className="text-[12px] text-ink-faint font-mono">
          HR {Math.round(s.hr)}/min · mean Pa {Math.round(s.map)} mmHg
        </div>
        <div className="text-[12px] text-ink-soft pt-0.5">Intracoronary adenosine into the {vessel}</div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className="field w-24 !h-8"
            value={icDose}
            placeholder="dose"
            aria-label="Intracoronary adenosine dose, µg"
            onChange={(e) => setIcDose(e.target.value)}
            disabled={d}
          />
          <span className="text-[12px] text-ink-faint">µg</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button className="btn !px-2" onClick={() => dispatch({ type: "hyperaemia", mode: "ic", doseUg: num(icDose), fast: false })} disabled={d || !icReady}>
            Inject slowly
          </button>
          <button className="btn !px-2" onClick={() => dispatch({ type: "hyperaemia", mode: "ic", doseUg: num(icDose), fast: true })} disabled={d || !icReady}>
            Fast push
          </button>
        </div>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "flush-guide" })} disabled={d}>
          Flush the guide
        </button>
        <div className="text-[12px] text-ink-soft pt-1">IV adenosine</div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className="field w-20 !h-8"
            value={ivRate}
            aria-label="IV adenosine rate, µg/kg/min"
            onChange={(e) => setIvRate(e.target.value)}
            disabled={d}
          />
          <span className="text-[12px] text-ink-faint">µg/kg/min</span>
        </div>
        <select className="field w-full !h-8" value={ivSite} onChange={(e) => setIvSite(e.target.value as PwIvSite)} disabled={d} aria-label="Venous access">
          {PW_IV_SITES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "hyperaemia", mode: "iv", rateUgKgMin: num(ivRate), site: ivSite })} disabled={d || !ivReady}>
          {s.hyper.mode === "iv" ? "Change the infusion" : "Start the infusion"}
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "hyperaemia", mode: "contrast", ml: CONTRAST_FFR_ML })} disabled={d}>
          Contrast {CONTRAST_FFR_ML} mL through the guide
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "hyperaemia", mode: "none" })} disabled={d || !running}>
          Stop adenosine
        </button>
        <button className={`btn w-full !justify-start ${s.guideEngaged ? "" : "btn-good"}`} onClick={() => dispatch({ type: "guide", engaged: !s.guideEngaged })} disabled={d}>
          {s.guideEngaged ? "Disengage the guide slightly" : "Re-engage the guide"}
        </button>
        <div className="stat-label pt-1">If hyperaemia seems to fail</div>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "check-line" })} disabled={d}>
          Look at the IV cannula
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "check-drug" })} disabled={d}>
          Check the syringe and bag labels
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "ask-caffeine" })} disabled={d}>
          Ask about caffeine today
        </button>
      </div>
      <div className="panel p-3 space-y-1.5">
        <div className="stat-label">3 · Measure</div>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "measure-rest" })} disabled={d}>
          Resting Pd/Pa and wave-free ratio
        </button>
        <button className="btn btn-accent w-full !justify-start" onClick={() => dispatch({ type: "measure-ffr" })} disabled={d}>
          FFR
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "pullback" })} disabled={d}>
          {s.pullback?.active ? "Pulling back…" : "Pullback to the guide tip"}
        </button>
        <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "drift-check" })} disabled={d}>
          Drift check at the guide tip
        </button>
      </div>
      {s.rhythm !== null && <OrdersPanel session={s} dispatch={dispatch} disabled={!!disabled} />}
    </>
  );
}

/** The console's log, newest first. */
export function MeasurementLog({ session: s, showAids }: { session: PwSessionState; showAids: boolean }) {
  return (
    <div className="panel">
      <div className="panel-head">Console</div>
      {s.log.length === 0 ? (
        <div className="p-3 text-[13px] text-ink-faint">Set up, equalise at the guide tip, cross the lesion, then measure.</div>
      ) : (
        <div className="divide-y divide-line/60">
          {s.log.map((m, i) => (
            <div key={`${m.t}-${i}`} className="px-3 py-1.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">{m.label}</span>
                <span className={`font-mono ${m.bad ? "text-warn" : "text-ink"}`}>{m.value}</span>
              </div>
              {m.note && <div className="text-[12px] text-ink-faint">{m.note}</div>}
              {showAids && m.aid && <div className="text-[12px] text-warn">{m.aid}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Thermodilution: resting and hyperaemic mean transit times, then CFR and IMR. */
export function ThermoPanel({ session: s, dispatch, disabled }: MeasurePanelProps) {
  const res = s.td.rest && s.td.hyp ? thermodilution(measuredCase(s)) : null;
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">Microvascular function (thermodilution)</div>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "thermo", state: "rest" })} disabled={disabled}>
        Saline injections at rest {s.td.rest ? `· Tmn ${s.td.rest.toFixed(2)} s` : ""}
      </button>
      <button className="btn w-full !justify-start" onClick={() => dispatch({ type: "thermo", state: "hyp" })} disabled={disabled}>
        Saline injections at hyperaemia {s.td.hyp ? `· Tmn ${s.td.hyp.toFixed(2)} s` : ""}
      </button>
      {res && (
        <div className="text-[13px] font-mono space-y-0.5 pt-1">
          <div>
            CFR {res.cfr.toFixed(1)} <span className="text-ink-faint">(Tmn rest ÷ Tmn hyperaemia; abnormal &lt; {CUTOFF.cfr})</span>
          </div>
          <div>
            IMR {res.imr.toFixed(0)} <span className="text-ink-faint">(Pd × Tmn hyperaemia; abnormal ≥ {CUTOFF.imr})</span>
          </div>
        </div>
      )}
    </div>
  );
}
