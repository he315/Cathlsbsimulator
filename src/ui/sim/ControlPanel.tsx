import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CATHETERS } from "../../data/catheters";
import { WIRES } from "../../data/wires";
import { VIEW_PRESETS } from "../../data/viewPresets";

function Key({ k }: { k: string }) {
  return <span className="kbd">{k}</span>;
}

export default function ControlPanel({ hideHint = false }: { hideHint?: boolean }) {
  const s = useSimulatorStore();

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Setup &amp; views</span>
        <span className="normal-case font-normal text-ink-faint">hub is primary control</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Catheter selector */}
        <div>
          <div className="stat-label mb-1">Catheter (1–9)</div>
          <select
            className="w-full bg-base-800 border border-line rounded-md px-2 py-1.5 text-sm text-ink"
            value={s.catheterId}
            onChange={(e) => s.setCatheter(e.target.value)}
          >
            {CATHETERS.map((c, i) => (
              <option key={c.id} value={c.id}>
                {i < 9 ? `${i + 1}. ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Wire selector */}
        <div>
          <div className="stat-label mb-1">Guidewire</div>
          <select
            className="w-full bg-base-800 border border-line rounded-md px-2 py-1.5 text-sm text-ink"
            value={s.wireId}
            onChange={(e) => s.setWire(e.target.value)}
          >
            {WIRES.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* C-arm views */}
        <div>
          <div className="stat-label mb-1">C-arm view (←/→ rotate, V cycle)</div>
          <div className="flex flex-wrap gap-1">
            {VIEW_PRESETS.map((v) => (
              <button
                key={v.id}
                className="chip hover:bg-base-500 hover:text-ink"
                title={v.teach}
                onClick={() => s.applyViewPreset(v.id)}
              >
                {v.short}
              </button>
            ))}
          </div>
        </div>

        {/* Discrete keyboard / click controls — kept for accessibility and for
            trainees without a mouse. The hub above is the primary control. */}
        <details className="text-xs">
          <summary className="cursor-pointer stat-label select-none">
            Keyboard / click controls (accessibility)
          </summary>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button className="btn" onClick={() => s.rotate(-1)}>
              <Key k="A" /> rot ⟲
            </button>
            <button className="btn" onClick={() => s.advance()}>
              <Key k="W" /> advance
            </button>
            <button className="btn" onClick={() => s.rotate(1)}>
              <Key k="D" /> rot ⟳
            </button>
            <button className="btn" onClick={() => s.torque(-1)}>
              <Key k="Q" /> torque−
            </button>
            <button className="btn" onClick={() => s.withdraw()}>
              <Key k="S" /> withdraw
            </button>
            <button className="btn" onClick={() => s.torque(1)}>
              <Key k="E" /> torque+
            </button>
            <button className="btn" onClick={() => s.wire(-1)}>
              <Key k="↓" /> wire−
            </button>
            <button className="btn" onClick={() => s.wire(1)}>
              <Key k="↑" /> wire+
            </button>
            <button className="btn btn-ghost" onClick={() => s.checkPressure()}>
              <Key k="P" /> pressure
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button className="btn btn-accent" onClick={() => s.inject()}>
              <Key k="␣" /> Inject
            </button>
            {!hideHint ? (
              <button className="btn" onClick={() => s.hint()}>
                <Key k="H" /> Hint
              </button>
            ) : (
              <button className="btn" onClick={() => s.reset()}>
                <Key k="R" /> Reset
              </button>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
