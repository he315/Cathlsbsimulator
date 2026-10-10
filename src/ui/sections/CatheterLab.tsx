import { useState } from "react";
import { CATHETERS } from "../../data/catheters";
import { WIRES } from "../../data/wires";
import { TEACHING } from "../../data/teachingText";
import SectionShell from "../SectionShell";

export default function CatheterLab() {
  const [id, setId] = useState(CATHETERS[0].id);
  const cath = CATHETERS.find((c) => c.id === id)!;
  const b = cath.behaviour;

  return (
    <SectionShell
      title="Catheter & wire lab"
      subtitle="How each preshaped curve finds its coronary — and where it fails."
    >
      <div className="grid lg:grid-cols-[16rem_1fr] gap-4">
        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {CATHETERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                c.id === id
                  ? "border-accent/50 bg-accent/10 text-ink"
                  : "border-line bg-base-700/60 text-ink-soft hover:bg-base-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{c.name}</span>
                <span className="chip">{c.target}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-ink">{cath.name}</h2>
              <div className="flex gap-1.5">
                <span className="chip">{cath.category}</span>
                <span className="chip">{cath.curveSize}</span>
                <span className="chip">{cath.aggressiveness}</span>
              </div>
            </div>
            <p className="text-sm text-ink-soft">{cath.bestUse}</p>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Info label="Usual target" value={cath.usualTarget} />
              <Info label="Support" value={cath.support} />
              <Info label="Best anatomy" value={cath.bestAnatomy} good />
              <Info label="Poor anatomy" value={cath.badAnatomy} bad />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="panel p-4">
              <div className="stat-label mb-2">Behaviour model</div>
              <MeterRow label="Reach (root fit)" value={b.reach} max={26} />
              <MeterRow label="Torque response" value={b.torqueResponse * 100} max={100} />
              <MeterRow label="Prolapse tendency" value={b.prolapseTendency * 100} max={100} tone="#E5534B" />
              <MeterRow label="Deep-seat risk" value={b.deepEngagementRisk * 100} max={100} tone="#E9B95A" />
              <div className="text-[12px] text-ink-faint mt-2">
                Reach ≈ sinus radius engages cleanly (small ≈ 14, normal ≈ 18, dilated ≈ 24).
              </div>
            </div>

            <div className="panel p-4">
              <div className="stat-label mb-2 text-danger">Common mistakes</div>
              <ul className="space-y-1.5 mb-3">
                {cath.commonMistakes.map((m, i) => (
                  <li key={i} className="text-xs text-ink-soft">! {m}</li>
                ))}
              </ul>
              <div className="stat-label mb-2 text-good">Teaching tips</div>
              <ul className="space-y-1.5">
                {cath.teachingTips.map((m, i) => (
                  <li key={i} className="text-xs text-ink-soft">• {m}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel p-4">
            <div className="stat-label mb-2">Guidewires</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {WIRES.map((w) => (
                <div key={w.id} className="rounded-md border border-line p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink">{w.name}</span>
                    <span className={`chip ${w.safetyProfile === "risky" ? "text-danger" : w.safetyProfile === "safe" ? "text-good" : ""}`}>
                      {w.safetyProfile}
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-faint mt-1">{w.teachingTips[0]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 text-sm text-ink-soft">
            <div className="stat-label mb-1">Principle</div>
            {TEACHING["catheter-choice"] ?? "Match the catheter curve to the aortic root: too small falls short of the ostium, too large crams the cusp and prolapses toward the ventricle."}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function Info({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`text-sm ${good ? "text-good" : bad ? "text-danger/90" : "text-ink-soft"}`}>{value}</div>
    </div>
  );
}

function MeterRow({ label, value, max, tone = "#4F8EF7" }: { label: string; value: number; max: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[12px] text-ink-faint">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded bg-base-800 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}
