// Bedside orders for adenosine's arrhythmias in the pressure-wire lab (physiology-hyperaemia-and-
// adenosine; Brilakis 3.2 and 12.2, lessons pm-physiology-indices and pm-lab-drugs-microvascular):
// heart block is watched and waited out with the patient coughing, with brief CPR and temporary pacing
// if block without an escape rhythm persists; VF is defibrillated (charge, stand clear, shock); AF that
// does not revert is cardioverted with a synchronised shock. A hand-off opens the temporary pacing lab
// on its adenosine block scenario.
//
// The panel shows only what the team has been asked to do (CPR running, pacing on) and the
// defibrillator's own charge indicator (charging, charged): a shock before the charge is complete
// delivers nothing, and the log says so. The rhythm is read
// from the monitor; nothing here names it. The orders reach the patient engine through the session
// (pwSession.applyPwActionToEngine) and are scored in the debrief against the arrhythmias the monitor
// showed.
import { useUiStore } from "../../state/useUiStore";
import type { PwAction, PwOrder, PwSessionState } from "../../simulation/pci/pwSession";

export interface OrdersPanelProps {
  session: PwSessionState;
  dispatch: (a: PwAction) => void;
  disabled?: boolean;
}

/** The pacing lab's in-lab adenosine block scenario, with the block that persists (src/content/lab/presets/bedside/pacing.launch.ts). */
export const PACING_HANDOFF = { sim: "pacing", params: { scenario: "inlab-adenosine-avb", variant: "persistent" } } as const;

export default function OrdersPanel({ session: s, dispatch, disabled }: OrdersPanelProps) {
  const openSim = useUiStore((u) => u.openSim);
  const d = !!disabled;
  const go = (order: PwOrder) => dispatch({ type: "order", order });
  const charging = s.defib.chargingSince !== null;
  const ready = s.defib.charged;
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">Orders</div>
      <div className="grid grid-cols-2 gap-1.5">
        <button className="btn !px-2" onClick={() => go("cough")} disabled={d}>
          Ask to cough
        </button>
        <button className="btn !px-2" onClick={() => go("wait")} disabled={d}>
          Wait and watch
        </button>
      </div>
      <button className={`btn w-full !justify-start ${s.cpr ? "btn-danger" : ""}`} onClick={() => go(s.cpr ? "cpr-stop" : "cpr-start")} disabled={d}>
        {s.cpr ? "Stop CPR" : "Start CPR"}
      </button>
      <button className={`btn w-full !justify-start ${s.pacing ? "btn-good" : ""}`} onClick={() => go(s.pacing ? "pace-off" : "pace-on")} disabled={d}>
        {s.pacing ? "Temporary pacing off" : "Temporary pacing on"}
      </button>
      <div className="flex items-center justify-between pt-1">
        <div className="stat-label">Defibrillator</div>
        {/* the device's own charge indicator, as the operator sees it on the defibrillator */}
        <span className={`chip ${ready ? "text-good" : charging ? "text-warn" : ""}`} aria-live="polite">
          <span className="led" />
          {charging ? "Charging…" : ready ? "Charged" : "Not charged"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button className="btn !px-2" onClick={() => go("charge")} disabled={d}>
          Charge
        </button>
        <button className="btn !px-2" onClick={() => go("clear")} disabled={d}>
          Clear
        </button>
        <button className="btn btn-danger !px-2" onClick={() => go("shock")} disabled={d}>
          Shock
        </button>
      </div>
      <button className="btn w-full !justify-start" onClick={() => go("cardiovert")} disabled={d}>
        Synchronised shock (cardioversion)
      </button>
      <button className="btn btn-ghost w-full !justify-start text-[13px]" onClick={() => openSim(PACING_HANDOFF.sim, { ...PACING_HANDOFF.params })} disabled={d}>
        Hand over to the temporary pacing lab
      </button>
    </div>
  );
}
