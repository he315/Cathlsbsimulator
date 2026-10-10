import { useRef } from "react";
import { WINDOW_INFO, type EchoWindow, type Trajectory, type Pockets } from "../../simulation/pericardiocentesis";

// ---------------------------------------------------------------------------
// Needle entry planner: a frontal view of the chest and upper abdomen with
// the surface anatomy that matters (xiphisternum, costal margins, sternum,
// internal mammary arteries, liver, lung edges, cardiac outline, apex). Click
// an entry window, drag from the entry point to aim the needle, and set the
// angle to the skin in the side inset. Parasternal and apical entries can be
// moved medially / laterally and placed on either border of the rib.
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };

const ENTRY: Record<EchoWindow, Pt> = {
  subxiphoid: { x: 160, y: 188 },
  apical: { x: 204, y: 160 },
  parasternal: { x: 174, y: 124 },
};

/** Reference direction (aim 0) in the frontal plane for each window. */
const REF: Record<EchoWindow, Pt> = {
  subxiphoid: { x: 238, y: 42 }, // left shoulder
  apical: { x: 62, y: 42 }, // right shoulder
  parasternal: { x: 174, y: 124 }, // straight in (no frontal aim)
};

export function entryPoint(t: Trajectory): Pt {
  const e = ENTRY[t.window];
  const dx = t.window === "subxiphoid" ? 0 : t.lateral * 16;
  const dy = t.window === "subxiphoid" ? 0 : t.ribEdge === "below-rib" ? -6 : 0;
  return { x: e.x + dx, y: e.y + dy };
}

function refAngle(w: EchoWindow, from: Pt): number {
  const r = REF[w];
  return Math.atan2(r.y - from.y, r.x - from.x);
}

export default function NeedlePlanner({
  traj,
  onChange,
  pockets,
  disabled,
}: {
  traj: Trajectory | null;
  onChange: (t: Trajectory) => void;
  pockets: Pockets;
  disabled?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const pick = (w: EchoWindow) => {
    if (disabled) return;
    // Start each window slightly off the ideal so the operator has to set it deliberately.
    if (w === "subxiphoid") onChange({ window: w, angle: 45, aim: -20, lateral: 0, ribEdge: "above-rib" });
    else if (w === "apical") onChange({ window: w, angle: 40, aim: 0, lateral: 0.25, ribEdge: "below-rib" });
    else onChange({ window: w, angle: 85, aim: 0, lateral: -0.5, ribEdge: "below-rib" });
  };

  const toLocal = (e: React.PointerEvent): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 300 };
  };

  const aimFromPointer = (p: Pt) => {
    if (!traj || traj.window === "parasternal") return;
    const ep = entryPoint(traj);
    const a = Math.atan2(p.y - ep.y, p.x - ep.x);
    let d = ((a - refAngle(traj.window, ep)) * 180) / Math.PI;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    // For the subxiphoid window, rotating toward the right shoulder (anticlockwise on screen) is medial / rightward (negative).
    // For the apical window, rotating toward the left (clockwise on screen) is lateral (positive).
    const aim = traj.window === "subxiphoid" ? d : -d;
    onChange({ ...traj, aim: Math.max(-60, Math.min(60, Math.round(aim))) });
  };

  const ep = traj ? entryPoint(traj) : null;
  let aimEnd: Pt | null = null;
  if (traj && ep) {
    if (traj.window === "parasternal") aimEnd = ep;
    else {
      const base = refAngle(traj.window, ep);
      const a = base + (((traj.window === "subxiphoid" ? traj.aim : -traj.aim) * Math.PI) / 180);
      const len = 70 * Math.cos(((traj.angle * Math.PI) / 180) * 0.6);
      aimEnd = { x: ep.x + Math.cos(a) * len, y: ep.y + Math.sin(a) * len };
    }
  }

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className={`w-full block rounded-md border border-line bg-base-800 ${disabled ? "opacity-60" : "cursor-crosshair touch-none"}`}
        onPointerDown={(e) => {
          if (disabled || !traj) return;
          dragging.current = true;
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          const p = toLocal(e);
          if (p) aimFromPointer(p);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const p = toLocal(e);
          if (p) aimFromPointer(p);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* torso */}
        <path d="M40 30 Q150 10 260 30 L268 120 Q262 220 236 290 L64 290 Q38 220 32 120 Z" fill="#1B1F24" stroke="#2E343C" />
        {/* lungs */}
        <path d="M52 50 Q100 36 136 44 L136 170 Q96 186 56 170 Z" fill="#22303f" opacity={0.6} />
        {/* left lung with its cardiac notch, which leaves the pericardium uncovered beside the left sternal edge */}
        <path d="M164 44 Q200 36 248 50 L246 168 Q226 176 214 172 L198 152 Q186 122 182 100 L166 90 Z" fill="#22303f" opacity={0.6} />
        <text x="66" y="110" fontSize="8" fill="#858D99">R lung</text>
        <text x="216" y="100" fontSize="8" fill="#858D99">L lung</text>
        {/* ribs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i} stroke="#33404f" strokeWidth={2} fill="none" opacity={0.7}>
            <path d={`M140 ${58 + i * 20} Q100 ${54 + i * 20} 56 ${68 + i * 22}`} />
            <path d={`M160 ${58 + i * 20} Q200 ${54 + i * 20} 244 ${68 + i * 22}`} />
          </g>
        ))}
        {/* costal margins */}
        <path d="M150 176 Q110 196 66 232" stroke="#4b5b6e" strokeWidth={3} fill="none" />
        <path d="M150 176 Q190 196 234 232" stroke="#4b5b6e" strokeWidth={3} fill="none" />
        {/* liver: below the right costal margin and across the midline */}
        <path d="M60 200 Q100 186 150 196 Q176 202 186 214 Q150 232 70 236 Z" fill="#5b2a2a" opacity={0.55} />
        <text x="84" y="222" fontSize="8" fill="#c08080">liver</text>
        {/* heart outline with effusion halo */}
        <path d="M128 84 Q110 100 116 140 Q124 172 170 176 Q206 174 210 158 Q214 132 186 106 Q166 86 140 80 Z" fill="none" stroke="#7f1d1d" strokeWidth={Math.max(1.5, Math.min(10, pockets.subxiphoid / 3))} opacity={0.35} />
        <path d="M128 84 Q110 100 116 140 Q124 172 170 176 Q206 174 210 158 Q214 132 186 106 Q166 86 140 80 Z" fill="#3a1418" stroke="#E5534B" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <text x="150" y="136" fontSize="8" fill="#fca5a5" textAnchor="middle">heart</text>
        {/* sternum and xiphoid */}
        <rect x={140} y={40} width={20} height={130} rx={4} fill="#3a4757" opacity={0.85} />
        <path d="M144 170 L156 170 L150 182 Z" fill="#3a4757" />
        {/* internal mammary arteries, just lateral to each sternal edge */}
        <line x1={136} y1={44} x2={136} y2={170} stroke="#E5534B" strokeWidth={1.2} strokeDasharray="2 3" opacity={0.85} />
        <line x1={164} y1={44} x2={164} y2={170} stroke="#E5534B" strokeWidth={1.2} strokeDasharray="2 3" opacity={0.85} />
        <text x="166" y="54" fontSize="7" fill="#fca5a5">int. mammary a.</text>
        {/* shoulders */}
        <circle cx={REF.subxiphoid.x} cy={REF.subxiphoid.y} r={3} fill="#4F8EF7" />
        <text x={REF.subxiphoid.x - 4} y={REF.subxiphoid.y - 6} fontSize="7" fill="#8ab4ff" textAnchor="end">L shoulder</text>
        <circle cx={REF.apical.x} cy={REF.apical.y} r={3} fill="#4F8EF7" />
        <text x={REF.apical.x + 4} y={REF.apical.y - 6} fontSize="7" fill="#8ab4ff">R shoulder</text>
        {/* apex beat */}
        <circle cx={ENTRY.apical.x} cy={ENTRY.apical.y} r={9} fill="none" stroke="#E9B95A" strokeDasharray="2 2" opacity={0.6} />

        {/* window markers */}
        {(Object.keys(ENTRY) as EchoWindow[]).map((w) => {
          const p = ENTRY[w];
          const active = traj?.window === w;
          return (
            <g
              key={w}
              className={disabled ? "" : "cursor-pointer"}
              onPointerDown={(e) => {
                e.stopPropagation();
                pick(w);
              }}
            >
              <circle cx={p.x} cy={p.y} r={7} fill={active ? "#4F8EF7" : "#15181C"} stroke={active ? "#ECEEF1" : "#4F8EF7"} strokeWidth={1.5} opacity={0.9} />
              <text x={p.x + (w === "apical" ? 10 : 10)} y={p.y + (w === "subxiphoid" ? 14 : 3)} fontSize="8" fill="#ECEEF1">
                {WINDOW_INFO[w].label} ({Math.round(pockets[w])} mm)
              </text>
            </g>
          );
        })}

        {/* planned needle */}
        {traj && ep && aimEnd && (
          <g pointerEvents="none">
            <line x1={ep.x} y1={ep.y} x2={aimEnd.x} y2={aimEnd.y} stroke="#e5e7eb" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={ep.x} cy={ep.y} r={3.5} fill="#e5e7eb" />
            {traj.window === "parasternal" && <circle cx={ep.x} cy={ep.y} r={7} fill="none" stroke="#e5e7eb" strokeWidth={1.5} />}
          </g>
        )}
      </svg>

      {traj && (
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 items-center">
          <AngleInset angle={traj.angle} />
          <div className="space-y-2">
            <label className="block text-[12px] text-ink-soft">
              <span className="stat-label">Angle to skin: {traj.angle}°</span>
              <input
                type="range"
                className="w-full"
                min={5}
                max={90}
                step={1}
                value={traj.angle}
                disabled={disabled}
                onChange={(e) => onChange({ ...traj, angle: Number(e.target.value) })}
              />
            </label>
            {traj.window !== "parasternal" && (
              <div className="text-[12px] text-ink-soft">
                Aim: {traj.aim === 0 ? "straight at" : `${Math.abs(traj.aim)}° ${traj.aim < 0 ? "medial / rightward of" : "lateral / leftward of"}`} {WINDOW_INFO[traj.window].aimRef}
                <span className="text-ink-faint"> (drag on the chest to aim)</span>
              </div>
            )}
            {traj.window !== "subxiphoid" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="stat-label">Entry</span>
                <button className="btn text-xs py-0.5" disabled={disabled} onClick={() => onChange({ ...traj, lateral: Math.max(-1, Math.round((traj.lateral - 0.25) * 100) / 100) })}>
                  ◀ medial
                </button>
                <button className="btn text-xs py-0.5" disabled={disabled} onClick={() => onChange({ ...traj, lateral: Math.min(1, Math.round((traj.lateral + 0.25) * 100) / 100) })}>
                  lateral ▶
                </button>
                <div className="seg">
                  <button
                    className={`seg-btn ${traj.ribEdge === "above-rib" ? "seg-btn-active" : ""}`}
                    disabled={disabled}
                    onClick={() => onChange({ ...traj, ribEdge: "above-rib" })}
                  >
                    upper border of rib below
                  </button>
                  <button
                    className={`seg-btn ${traj.ribEdge === "below-rib" ? "seg-btn-active" : ""}`}
                    disabled={disabled}
                    onClick={() => onChange({ ...traj, ribEdge: "below-rib" })}
                  >
                    lower border of rib above
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AngleInset({ angle }: { angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const x1 = 14;
  const y1 = 36;
  const x2 = x1 + Math.cos(rad) * 70;
  const y2 = y1 + Math.sin(rad) * 70;
  return (
    <svg viewBox="0 0 110 100" className="w-full block rounded border border-line bg-base-800">
      <line x1={0} y1={36} x2={110} y2={36} stroke="#A6ADB8" strokeWidth={1.5} />
      <text x={70} y={30} fontSize="8" fill="#858D99">skin</text>
      <rect x={0} y={36} width={110} height={64} fill="#1B1F24" opacity={0.6} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${x1 + 22} ${y1} A 22 22 0 0 1 ${x1 + Math.cos(rad) * 22} ${y1 + Math.sin(rad) * 22}`} stroke="#4F8EF7" fill="none" />
      <text x={x1 + 26} y={y1 + 14} fontSize="9" fill="#8ab4ff">{angle}°</text>
    </svg>
  );
}
