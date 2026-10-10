// A pressure-wire pullback curve: Pd/Pa (hyperaemic) or the resting wave-free ratio against the
// sensor position, guide tip on the left. Extracted from the physiology lab so that the PCI lab's
// pressure-wire console draws the same plot (physiology-engine-unify-and-setup).
import { CUTOFF } from "../../simulation/physiology";

export interface PullbackPoint {
  /** sensor position along the vessel, 0 = guide tip, 1 = distal */
  x: number;
  ratio: number;
}

export interface PullbackPlotProps {
  pts: readonly PullbackPoint[];
  kind: "FFR" | "resting";
  /** positions to mark faintly (the lesions the angiogram shows), 0..1 */
  marks?: readonly number[];
  /** the threshold line (default FFR ≤ 0.80, wave-free ratio ≤ 0.89, physiology.ts CUTOFF) */
  cutoff?: number;
  className?: string;
}

export default function PullbackPlot({ pts, kind, marks = [], cutoff, className = "" }: PullbackPlotProps) {
  const W = 760,
    H = 180,
    x0 = 50,
    x1 = 740,
    y0 = 20,
    y1 = 150;
  const lo = Math.min(0.6, ...pts.map((p) => p.ratio)) - 0.02;
  const sx = (x: number) => x0 + (x1 - x0) * x;
  const sy = (r: number) => y1 - ((r - lo) / (1.02 - lo)) * (y1 - y0);
  const cut = cutoff ?? (kind === "FFR" ? CUTOFF.ffr : CUTOFF.nhpr);
  return (
    <div className={`panel ${className}`}>
      <div className="panel-head">
        <span>{kind === "FFR" ? "Hyperaemic" : "Resting wave-free"} pullback</span>
        <span className="normal-case tracking-normal text-ink-faint">a sharp step means a focal lesion; a gradual slope means diffuse disease</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${kind === "FFR" ? "Hyperaemic" : "Resting"} pullback curve`}>
        <line x1={x0} y1={sy(cut)} x2={x1} y2={sy(cut)} stroke="#E9B95A" strokeDasharray="4 4" />
        <text x={x1} y={sy(cut) - 4} fontSize={12} fill="#E9B95A" textAnchor="end">
          {cut}
        </text>
        {[1, 0.9, 0.8, 0.7]
          .filter((v) => v > lo)
          .map((v) => (
            <text key={v} x={x0 - 6} y={sy(v) + 4} fontSize={12} fill="#858D99" textAnchor="end">
              {v.toFixed(1)}
            </text>
          ))}
        {marks.map((m, i) => (
          <line key={i} x1={sx(m)} y1={y0} x2={sx(m)} y2={y1} stroke="rgba(255,255,255,0.08)" />
        ))}
        {pts.length > 1 && <polyline points={pts.map((p) => `${sx(p.x)},${sy(p.ratio)}`).join(" ")} fill="none" stroke="#facc15" strokeWidth={2} />}
        <text x={x0} y={H - 8} fontSize={12} fill="#858D99">
          guide tip
        </text>
        <text x={x1} y={H - 8} fontSize={12} fill="#858D99" textAnchor="end">
          distal
        </text>
      </svg>
    </div>
  );
}
