import { useRef } from "react";

// A rotary dial for device consoles. Drag up / down (or use the − / +
// buttons) to step the value. Stepping is delegated to `step` so each
// dial can have device-like increments.

export default function Knob({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  color = "#4F8EF7",
  disabled,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: (v: number, dir: 1 | -1) => number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const acc = useRef(0);
  const drag = useRef(false);
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const a0 = -225;
  const a1 = 45;
  const ang = a0 + (a1 - a0) * frac;
  const R = 26;
  const C = 34;
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
  };
  const arc = (from: number, to: number, r: number) => {
    const [x0, y0] = pt(from, r);
    const [x1, y1] = pt(to, r);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const [px, py] = pt(ang, R - 7);
  const bump = (dir: 1 | -1) => {
    if (disabled) return;
    const nv = step(value, dir);
    if (nv !== value) onChange(nv);
  };

  return (
    <div className={`flex flex-col items-center gap-1 select-none ${disabled ? "opacity-40" : ""}`} title={hint}>
      <span className="stat-label">{label}</span>
      <svg
        width={68}
        height={68}
        viewBox="0 0 68 68"
        className={disabled ? "" : "cursor-ns-resize touch-none"}
        onPointerDown={(e) => {
          if (disabled) return;
          drag.current = true;
          acc.current = 0;
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          acc.current += -e.movementY;
          while (acc.current > 9) {
            acc.current -= 9;
            bump(1);
          }
          while (acc.current < -9) {
            acc.current += 9;
            bump(-1);
          }
        }}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        <circle cx={C} cy={C} r={R + 4} fill="#121417" stroke="#22262C" />
        <path d={arc(a0, a1, R)} stroke="#22303f" strokeWidth={4} fill="none" strokeLinecap="round" />
        {frac > 0.001 && <path d={arc(a0, ang, R)} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />}
        <circle cx={C} cy={C} r={R - 8} fill="url(#knobGrad)" stroke="#33404f" />
        <line x1={C} y1={C} x2={px} y2={py} stroke="#ECEEF1" strokeWidth={2.5} strokeLinecap="round" />
        <defs>
          <radialGradient id="knobGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#3a4757" />
            <stop offset="100%" stopColor="#151c26" />
          </radialGradient>
        </defs>
      </svg>
      <div className="flex items-center gap-1">
        <button className="btn px-1.5 py-0 text-xs" disabled={disabled} onClick={() => bump(-1)} aria-label={`Decrease ${label}`}>
          −
        </button>
        <span className="metric font-mono text-sm text-ink min-w-[3.6rem] text-center">
          {format(value)}
          <span className="text-[12px] text-ink-faint ml-0.5">{unit}</span>
        </span>
        <button className="btn px-1.5 py-0 text-xs" disabled={disabled} onClick={() => bump(1)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}
