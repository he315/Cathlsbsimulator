import { useEffect, useRef, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import {
  coaptationY,
  targetArmAngle,
  rotationError,
  DEVICE_REACH,
  type DevicePlacement,
  type JetComponent,
  type GraspResult,
} from "../../simulation/teer";
import { clamp, svgPoint } from "./common";

// Original schematics for TEER: a 3D en-face ("surgical") view of the mitral
// valve from the left atrium, and two orthogonal x-plane TOE views.

const CX = 180;
const CY = 158;
const R = 122; // x scale
const RY = 96; // y scale

const toPx = (x: number, y: number) => ({ px: CX + x * R, py: CY - y * RY });

function coaptPath(): string {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -0.96 + (1.92 * i) / 40;
    const { px, py } = toPx(x, coaptationY(x));
    pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(" ");
}

function JetBlob({ x, severity, id }: { x: number; severity: number; id: string }) {
  if (severity < 0.08) return null;
  const { px, py } = toPx(x, coaptationY(x));
  const r = 8 + Math.sqrt(severity) * 17;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#fff36b" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ff7a2f" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#2f7bff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#14c38e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={px} cy={py} rx={r} ry={r * 0.75} fill={`url(#${id})`} />
    </g>
  );
}

function DeviceGlyph({
  p,
  active,
  width,
}: {
  p: DevicePlacement;
  active: boolean;
  width: "narrow" | "wide";
}) {
  const { px, py } = toPx(p.x, p.y);
  const w = width === "wide" ? 9 : 6;
  const arm = 22;
  // SVG rotation is clockwise with y down; arm angle is anticlockwise from the lateral–medial axis.
  return (
    <g transform={`translate(${px} ${py}) rotate(${-p.armAngleDeg})`}>
      <line x1={-arm} y1="0" x2={arm} y2="0" stroke={active ? "#ECEEF1" : "#A6ADB8"} strokeWidth={w * 0.5} strokeLinecap="round" />
      <rect x={-4} y={-w / 2} width="8" height={w} rx="2" fill={active ? "#4F8EF7" : "#858D99"} stroke="#121417" />
    </g>
  );
}

export function EnFaceView({
  jets,
  devices,
  current,
  colour,
  showGuide,
  onMove,
  onRotate,
  interactive,
}: {
  jets: JetComponent[];
  devices: { p: DevicePlacement; width: "narrow" | "wide" }[];
  current: { p: DevicePlacement; width: "narrow" | "wide" } | null;
  colour: boolean;
  showGuide: boolean;
  onMove?: (x: number, y: number) => void;
  onRotate?: (deltaDeg: number) => void;
  interactive: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onMove) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    const x = clamp((p.x - CX) / R, -0.92, 0.92);
    const y = clamp(-(p.y - CY) / RY, -0.85, 0.85);
    onMove(x, y);
  };
  // Wheel rotates the device; a non-passive listener stops the page scrolling meanwhile.
  const rotateRef = useRef(onRotate);
  const activeRef = useRef(interactive);
  rotateRef.current = onRotate;
  activeRef.current = interactive;
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      if (!activeRef.current || !rotateRef.current) return;
      e.preventDefault();
      rotateRef.current(e.deltaY > 0 ? -3 : 3);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);
  const guide = current
    ? (() => {
        const { px, py } = toPx(current.p.x, coaptationY(current.p.x));
        const a = (targetArmAngle(current.p.x) * Math.PI) / 180;
        return { x1: px - Math.cos(a) * 40, y1: py + Math.sin(a) * 40, x2: px + Math.cos(a) * 40, y2: py - Math.sin(a) * 40 };
      })()
    : null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 360 310"
      className={`w-full block select-none ${interactive ? "cursor-move" : ""}`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (!interactive) return;
        drag.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => drag.current && interactive && move(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerLeave={() => (drag.current = false)}
    >
      <defs>
        <radialGradient id="ef-tissue" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#c98f86" />
          <stop offset="100%" stopColor="#7d4a45" />
        </radialGradient>
      </defs>
      <rect width="360" height="310" fill="#120c0d" />
      {/* aorta at 12 o'clock and appendage at 9 o'clock */}
      <circle cx={CX} cy={CY - RY - 34} r="30" fill="#2a1a1c" stroke="#6b3f44" />
      <text x={CX} y={CY - RY - 30} fontSize="11" fill="#c97a84" textAnchor="middle">
        Ao
      </text>
      <path d={`M ${CX - R - 6} ${CY - 26} q -34 -6 -30 22 q 6 18 30 10`} fill="#2a1a1c" stroke="#6b3f44" />
      <text x={CX - R - 30} y={CY + 30} fontSize="10" fill="#c97a84">
        LAA
      </text>
      {/* annulus and leaflets */}
      <ellipse cx={CX} cy={CY} rx={R + 8} ry={RY + 8} fill="#3a2426" stroke="#8a5a55" strokeWidth="3" />
      <ellipse cx={CX} cy={CY} rx={R} ry={RY} fill="url(#ef-tissue)" />
      {/* posterior scallop clefts */}
      {[-0.36, 0.36].map((x) => {
        const a = toPx(x, coaptationY(x));
        const b = toPx(x * 1.25, -0.98);
        return <line key={x} x1={a.px} y1={a.py} x2={b.px} y2={b.py} stroke="#5d3431" strokeWidth="1.5" />;
      })}
      <path d={coaptPath()} stroke="#2b1517" strokeWidth="3" fill="none" />
      {/* labels */}
      {[
        ["A1", -0.6, 0.42],
        ["A2", 0, 0.32],
        ["A3", 0.6, 0.42],
        ["P1", -0.62, -0.42],
        ["P2", 0, -0.55],
        ["P3", 0.62, -0.42],
      ].map(([t, x, y]) => {
        const p = toPx(x as number, y as number);
        return (
          <text key={t as string} x={p.px} y={p.py} fontSize="10" fill="#f3d3cc" opacity="0.7" textAnchor="middle">
            {t}
          </text>
        );
      })}
      <text x={CX - R + 4} y={CY + 4} fontSize="8" fill="#f3d3cc" opacity="0.6">
        AL
      </text>
      <text x={CX + R - 14} y={CY + 4} fontSize="8" fill="#f3d3cc" opacity="0.6">
        PM
      </text>

      {colour && jets.map((j, i) => <JetBlob key={i} id={`jet-${i}`} x={j.x} severity={j.severity} />)}

      {devices.map((d, i) => (
        <DeviceGlyph key={i} p={d.p} active={false} width={d.width} />
      ))}
      {current && showGuide && guide && (
        <line x1={guide.x1} y1={guide.y1} x2={guide.x2} y2={guide.y2} stroke="#4CC38A" strokeDasharray="4 3" strokeWidth="1.5" />
      )}
      {current && <DeviceGlyph p={current.p} active width={current.width} />}
      {current && (
        <circle
          cx={toPx(current.p.x, current.p.y).px}
          cy={toPx(current.p.x, current.p.y).py}
          r={DEVICE_REACH[current.width] * R}
          fill="none"
          stroke="#4F8EF7"
          strokeOpacity="0.25"
          strokeDasharray="2 3"
        />
      )}

      <text x="8" y="14" fontSize="10" fill="#A6ADB8">
        3D en-face, surgical view
      </text>
      <text x="352" y="14" fontSize="9" fill="#858D99" textAnchor="end">
        {colour ? "Colour Doppler on" : "Colour Doppler off"}
      </text>
      {interactive && (
        <text x="352" y="302" fontSize="9" fill="#858D99" textAnchor="end">
          Drag to steer · wheel to rotate
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// X-plane views
// ---------------------------------------------------------------------------

function Fan({ children, label, angle }: { children: ReactNode; label: string; angle: string }) {
  return (
    <div className="monitor rounded-md relative overflow-hidden">
      <div className="absolute left-2 top-1 text-[12px] text-ink-faint">{label}</div>
      <div className="absolute right-2 top-1 text-[12px] font-mono text-ink-faint">{angle}</div>
      <svg viewBox="0 0 240 150" className="w-full block">
        <path d="M120 8 L232 140 A 160 160 0 0 1 8 140 Z" fill="#0c1116" stroke="#1d2731" />
        {children}
      </svg>
    </div>
  );
}

/**
 * Intercommissural view (classically P3–A2–P1 from left to right). When the
 * arms are perpendicular to the coaptation line they are seen end-on here.
 */
export function BicommissuralView({ p, inLv }: { p: DevicePlacement | null; inLv: boolean }) {
  const yV = 96;
  const err = p ? rotationError(p.armAngleDeg, p.x) : 0;
  const open = Math.abs(Math.sin((err * Math.PI) / 180)) * 22 + 2;
  const x = p ? 120 - p.x * 80 : 120;
  const yD = inLv ? yV + 14 : yV - 22;
  return (
    <Fan label="Intercommissural" angle="~60°">
      <path d={`M 34 ${yV - 4} Q 120 ${yV + 6} 206 ${yV - 4}`} stroke="#c98f86" strokeWidth="3" fill="none" />
      <text x="36" y={yV + 18} fontSize="8" fill="#858D99">P3 (medial)</text>
      <text x="110" y={yV + 18} fontSize="8" fill="#858D99">A2</text>
      <text x="168" y={yV + 18} fontSize="8" fill="#858D99">P1 (lateral)</text>
      <text x="112" y="40" fontSize="8" fill="#858D99">LA</text>
      <text x="112" y="136" fontSize="8" fill="#858D99">LV</text>
      {p && (
        <g>
          <line x1={x} y1="14" x2={x} y2={yD} stroke="#A6ADB8" strokeWidth="3" />
          <path d={`M ${x - open} ${yD + 10} L ${x} ${yD} L ${x + open} ${yD + 10}`} stroke="#ECEEF1" strokeWidth="2" fill="none" />
        </g>
      )}
      {p && (
        <text x="232" y="146" fontSize="8" fill={err > 20 ? "#E9B95A" : "#858D99"} textAnchor="end">
          {err > 20 ? "Arms visible: rotate" : "Arms end-on"}
        </text>
      )}
    </Fan>
  );
}

/** LVOT view (~120–140°): anterior leaflet towards the LVOT, posterior opposite. Arms seen open. */
export function LvotView({
  p,
  grasp,
  inLv,
  large,
}: {
  p: DevicePlacement | null;
  grasp: GraspResult | null;
  inLv: boolean;
  large?: boolean;
}) {
  const yV = 92;
  const err = p ? rotationError(p.armAngleDeg, p.x) : 0;
  const open = Math.abs(Math.cos((err * Math.PI) / 180)) * 26 + 2;
  const dy = p ? p.y - coaptationY(p.x) : 0;
  const x = 120 - dy * 120; // anterior (A2) is to the right of screen
  const yD = inLv ? yV + 18 : yV - 22;
  const insA = grasp ? grasp.anterior : 0;
  const insP = grasp ? grasp.posterior : 0;
  const closed = !!grasp;
  return (
    <div>
      <Fan label={large ? "LVOT view: grasp check" : "LVOT view"} angle="~120–140°">
        <text x="40" y="40" fontSize="8" fill="#858D99">LA</text>
        <text x="186" y="128" fontSize="8" fill="#858D99">LVOT / Ao</text>
        <text x="40" y="128" fontSize="8" fill="#858D99">LV</text>
        {/* posterior leaflet (left) and anterior leaflet (right) */}
        <path d={`M 52 ${yV - 10} Q 90 ${yV - 4} ${closed ? x - 4 : 112} ${closed ? yD + 4 : yV + 8}`} stroke="#c98f86" strokeWidth="3" fill="none" />
        <path d={`M 196 ${yV - 14} Q 150 ${yV - 4} ${closed ? x + 4 : 128} ${closed ? yD + 4 : yV + 8}`} stroke="#c98f86" strokeWidth="3" fill="none" />
        <text x="54" y={yV - 16} fontSize="8" fill="#c98f86">P2</text>
        <text x="180" y={yV - 20} fontSize="8" fill="#c98f86">A2</text>
        {p && (
          <g>
            <line x1={x} y1="14" x2={x} y2={yD} stroke="#A6ADB8" strokeWidth="3" />
            {closed ? (
              <path d={`M ${x - 5} ${yD + 16} L ${x} ${yD} L ${x + 5} ${yD + 16}`} stroke="#ECEEF1" strokeWidth="2.4" fill="none" />
            ) : (
              <path d={`M ${x - open} ${yD + 12} L ${x} ${yD} L ${x + open} ${yD + 12}`} stroke="#ECEEF1" strokeWidth="2.4" fill="none" />
            )}
          </g>
        )}
        {grasp && (
          <g fontSize="8" fontFamily="monospace">
            <rect x="14" y="140" width="60" height="5" fill="#1d2731" />
            <rect x="14" y="140" width={60 * insP} height="5" fill={insP >= 0.67 ? "#4CC38A" : insP >= 0.4 ? "#E9B95A" : "#E5534B"} />
            <rect x="166" y="140" width="60" height="5" fill="#1d2731" />
            <rect x="166" y="140" width={60 * insA} height="5" fill={insA >= 0.67 ? "#4CC38A" : insA >= 0.4 ? "#E9B95A" : "#E5534B"} />
          </g>
        )}
      </Fan>
    </div>
  );
}

/** Small colour-Doppler style residual MR and gradient panel. */
export function DopplerStrip({ gradient, flag }: { gradient: number; flag: boolean }) {
  // Diastolic mitral inflow envelopes; taller peaks for higher gradients.
  const peak = clamp(gradient / 12, 0.1, 1) * 70;
  const beats = [0, 1, 2];
  return (
    <svg viewBox="0 0 240 90" className="w-full block">
      <rect width="240" height="90" fill="#06090c" />
      <line x1="0" y1="14" x2="240" y2="14" stroke="#1d2731" />
      {beats.map((b) => {
        const x0 = 12 + b * 76;
        return (
          <path
            key={b}
            d={`M ${x0} 14 L ${x0 + 6} ${14 + peak} L ${x0 + 22} ${14 + peak * 0.55} L ${x0 + 34} ${14 + peak * 0.3} L ${x0 + 42} ${14 + peak * 0.7} L ${x0 + 52} 14 Z`}
            fill={flag ? "#E5534B" : "#A6ADB8"}
            opacity="0.55"
          />
        );
      })}
      <text x="232" y="84" fontSize="9" fill={flag ? "#E5534B" : "#A6ADB8"} textAnchor="end" fontFamily="monospace">
        mean {gradient.toFixed(1)} mmHg
      </text>
    </svg>
  );
}
