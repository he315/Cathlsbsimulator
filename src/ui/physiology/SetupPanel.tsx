// Steps 1 to 3 of a pressure-wire study (lesson pm-physiology-setup, Brilakis 12.2): zero the wire
// outside the body, introduce it, bring the sensor to the guide tip, remove the introducer, flush
// the guide and the aortic line, then equalise. The panel shows what the operator has done, never
// whether the set-up is right: that is read from the traces (physiology-engine-unify-and-setup).
import type { PwAction, PwSessionState } from "../../simulation/pci/pwSession";

export interface SetupPanelProps {
  session: PwSessionState;
  dispatch: (a: PwAction) => void;
  disabled?: boolean;
}

function Step({ done, onClick, children, accent, disabled }: { done?: boolean; onClick: () => void; children: string; accent?: boolean; disabled?: boolean }) {
  return (
    <button className={`btn w-full !justify-start ${done ? "btn-good" : accent ? "btn-accent" : ""}`} onClick={onClick} disabled={disabled}>
      {done !== undefined ? (done ? "✓ " : "○ ") : ""}
      {children}
    </button>
  );
}

export default function SetupPanel({ session: s, dispatch, disabled }: SetupPanelProps) {
  const d = !!disabled;
  // ticks show what the operator has done in this study, not whether the set-up is right
  const did = (t: PwAction["type"]) => s.did.includes(t);
  return (
    <div className="panel p-3 space-y-1.5">
      <div className="stat-label">1 · Set up</div>
      <div className="text-[12px] text-ink-faint">Wire {s.wireIn ? "in the guide" : "outside the body"}{s.wireId > 1 ? ` (wire ${s.wireId})` : ""}</div>
      <Step done={s.zeroed} onClick={() => dispatch({ type: "zero" })} disabled={d}>
        Flush and zero the wire
      </Step>
      <Step done={did("check-connections")} onClick={() => dispatch({ type: "check-connections" })} disabled={d}>
        Check the connections
      </Step>
      {s.deviceInGuide && (
        <Step onClick={() => dispatch({ type: "remove-device" })} disabled={d}>
          Remove the balloon from the guide
        </Step>
      )}
      <Step done={s.wireIn} onClick={() => dispatch({ type: "introduce" })} disabled={d || s.wireIn}>
        Introduce the wire through the valve
      </Step>
      <Step done={did("remove-introducer")} onClick={() => dispatch({ type: "remove-introducer" })} disabled={d}>
        Remove the introducer
      </Step>
      <Step done={did("flush-guide")} onClick={() => dispatch({ type: "flush-guide" })} disabled={d}>
        Flush the guide with saline
      </Step>
      <Step done={did("flush-aortic-line")} onClick={() => dispatch({ type: "flush-aortic-line" })} disabled={d}>
        Flush and zero the aortic line
      </Step>
      <Step done={s.gtn} onClick={() => dispatch({ type: "gtn" })} disabled={d}>
        Intracoronary nitrate (local protocol)
      </Step>
      <Step done={s.eq !== null} accent onClick={() => dispatch({ type: "equalise" })} disabled={d || !s.wireIn}>
        Equalise Pd to Pa
      </Step>
      <div className="stat-label pt-1">Wire or guide problems</div>
      <Step onClick={() => dispatch({ type: "reshape-wire" })} disabled={d}>
        Reshape the wire tip
      </Step>
      <Step onClick={() => dispatch({ type: "new-wire" })} disabled={d}>
        Open a new pressure wire
      </Step>
      <Step onClick={() => dispatch({ type: "change-guide" })} disabled={d}>
        Change to a better-fitting guide
      </Step>
    </div>
  );
}
