import { useSimulatorStore } from "../../state/useSimulatorStore";

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="stat">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span className="font-mono text-xs text-ink">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded bg-base-800 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${value}%`, background: tone }} />
      </div>
    </div>
  );
}

export default function Scorebar() {
  const score = useSimulatorStore((s) => s.score);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Bar label="Safety" value={score.safetyScore} tone="#E5534B" />
      <Bar label="Efficiency" value={score.efficiencyScore} tone="#E9B95A" />
      <Bar label="Anatomy" value={score.anatomyScore} tone="#56B6E8" />
      <Bar label="Overall" value={score.finalScore} tone="#4CC38A" />
    </div>
  );
}
