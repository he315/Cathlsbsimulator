import { useRef, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import type { FossaPoint, TransseptalProcedure } from "../../simulation/teer";
import { septalHeightCm } from "../../simulation/teer";
import { clamp, svgPoint } from "./common";

// Transseptal puncture planner: drag the needle tip on an en-face map of the
// fossa ovalis (seen from the right atrium) and watch the three TOE views that
// are used to confirm the site: bicaval (superior–inferior), aortic short-axis
// (anterior–posterior) and four-chamber (height above the mitral annulus).
//
// structural-transseptal-hands-on: the TEER and LAAO labs now reach the site by hand
// (TransseptalStage.tsx), which reuses the three TOE views exported below. The en-face map stays as a
// guided teaching aid (mapOnly), shown only when aids are on and never in an exam: it draws the
// contact point, which an operator does not see directly.

const CX = 150;
const CY = 122;
const RX = 84;
const RY = 72;

function toSvg(p: FossaPoint) {
  return { x: CX - p.ap * RX, y: CY - p.si * RY };
}

function fromSvg(x: number, y: number): FossaPoint {
  let ap = -(x - CX) / RX;
  let si = -(y - CY) / RY;
  const r = Math.hypot(ap, si);
  if (r > 0.97) {
    ap = (ap / r) * 0.97;
    si = (si / r) * 0.97;
  }
  return { ap, si };
}

export default function FossaPicker({
  procedure,
  baseCm,
  value,
  onChange,
  showTarget,
  locked,
  mapOnly,
  caption,
}: {
  procedure: TransseptalProcedure;
  baseCm: number;
  value: FossaPoint;
  onChange?: (p: FossaPoint) => void;
  showTarget: boolean;
  locked?: boolean;
  /** draw the en-face map alone (the guided aid of the hands-on stage) */
  mapOnly?: boolean;
  /** text in the map's corner (default: the drag prompt) */
  caption?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const tip = toSvg(value);
  const heightCm = septalHeightCm(baseCm, value);

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (locked || !svgRef.current) return;
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    onChange?.(fromSvg(p.x, p.y));
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    onChange?.(fromSvg(p.x, p.y));
  };
  const onUp = () => {
    dragging.current = false;
  };

  // Target region in fossa coordinates.
  const target =
    procedure === "teer" ? { si: [0, 0.75], ap: [-0.85, -0.05] } : { si: [-0.85, -0.1], ap: [-0.85, -0.05] };
  const tA = toSvg({ si: target.si[1], ap: target.ap[1] });
  const tB = toSvg({ si: target.si[0], ap: target.ap[0] });

  const map = (
      <div className="monitor rounded-md relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 300 250"
          className={`w-full block select-none ${locked ? "" : "cursor-crosshair"}`}
          style={{ touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <defs>
            <radialGradient id="fp-fossa" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#3a2f35" />
              <stop offset="100%" stopColor="#241d22" />
            </radialGradient>
            <clipPath id="fp-clip">
              <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
            </clipPath>
          </defs>
          {/* septal wall */}
          <rect x="18" y="22" width="264" height="210" rx="40" fill="#1a1517" stroke="#3a3036" />
          {/* aortic root bulge (anterior–superior) */}
          <circle cx={CX - RX - 6} cy={CY - RY + 6} r="34" fill="#2a1c1f" stroke="#7a3b44" strokeWidth="1.5" />
          <text x={CX - RX - 6} y={CY - RY + 10} textAnchor="middle" fontSize="11" fill="#c97a84">
            Ao
          </text>
          {/* limbus and fossa */}
          <ellipse cx={CX} cy={CY} rx={RX + 10} ry={RY + 10} fill="#2c2328" stroke="#4a3d44" strokeWidth="6" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#fp-fossa)" stroke="#5b4a53" />
          {showTarget && (
            <g clipPath="url(#fp-clip)">
              {/* danger zone next to the aorta */}
              <rect x={CX - RX} y={CY - RY} width={RX * 0.5} height={RY * 2} fill="#E5534B" opacity="0.13" />
              <rect
                x={tA.x}
                y={tA.y}
                width={tB.x - tA.x}
                height={tB.y - tA.y}
                fill="#4CC38A"
                opacity="0.12"
                stroke="#4CC38A"
                strokeDasharray="4 3"
              />
            </g>
          )}
          {/* orientation labels */}
          <text x={CX} y="16" textAnchor="middle" fontSize="10" fill="#A6ADB8">
            Superior (SVC)
          </text>
          <text x={CX} y="246" textAnchor="middle" fontSize="10" fill="#A6ADB8">
            Inferior (IVC)
          </text>
          <text x="8" y="246" fontSize="8" fill="#858D99">
            RA view of the septum
          </text>
          <text x="10" y={CY + 4} fontSize="10" fill="#A6ADB8" transform={`rotate(-90 10 ${CY + 4})`} textAnchor="middle">
            Anterior
          </text>
          <text x="292" y={CY + 4} fontSize="10" fill="#A6ADB8" transform={`rotate(90 292 ${CY + 4})`} textAnchor="middle">
            Posterior
          </text>
          {/* crosshair */}
          <line x1={CX - RX} y1={CY} x2={CX + RX} y2={CY} stroke="#4a3d44" strokeDasharray="2 4" />
          <line x1={CX} y1={CY - RY} x2={CX} y2={CY + RY} stroke="#4a3d44" strokeDasharray="2 4" />
          {/* needle tip */}
          <circle cx={tip.x} cy={tip.y} r="12" fill="#4F8EF7" opacity="0.15" />
          <circle cx={tip.x} cy={tip.y} r="5" fill="#ECEEF1" stroke="#4F8EF7" strokeWidth="2" />
        </svg>
        <div className="absolute right-2 bottom-1.5 text-[12px] text-ink-faint">
          {caption ?? (locked ? "Crossed" : "Drag to position the needle tip")}
        </div>
      </div>
  );
  if (mapOnly) return map;
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {map}
      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2">
        <BicavalView si={value.si} />
        <ShortAxisView ap={value.ap} />
        <FourChamberView heightCm={heightCm} />
      </div>
    </div>
  );
}

function Sector({ children, label, angle }: { children: ReactNode; label: string; angle: string }) {
  return (
    <div className="monitor rounded-md relative overflow-hidden">
      <div className="absolute left-2 top-1 text-[12px] text-ink-faint">{label}</div>
      <div className="absolute right-2 top-1 text-[12px] font-mono text-ink-faint">{angle}</div>
      <svg viewBox="0 0 200 92" className="w-full block">
        <path d="M100 6 L190 88 A 130 130 0 0 1 10 88 Z" fill="#0c1116" stroke="#1d2731" />
        {children}
      </svg>
    </div>
  );
}

/** Tent depth drawn in the views: the indentation in mm maps to pixels (MODEL PARAMETER of the drawing). */
const tentPx = (mm: number | undefined) => (mm === undefined ? 13 : Math.max(2, Math.min(20, mm * 1.1)));

/**
 * The bicaval view. si: where the tent is (superior +1); tentMm: its depth (default the picker's);
 * tip: no tent, the tip shown in the right atrium at this si (null: off the image); crossed: the needle
 * through the septum.
 */
export function BicavalView({ si, tentMm, tip, crossed }: { si: number; tentMm?: number; tip?: number | null; crossed?: boolean }) {
  // Septum from IVC (left) to SVC (right); tent moves towards the SVC when superior.
  const x = 100 + si * 55;
  const h = tentPx(tentMm);
  const noTent = tip !== undefined;
  const tx = tip === null || tip === undefined ? null : 100 + tip * 55;
  return (
    <Sector label="Bicaval: superior–inferior" angle="~90–110°">
      <path d="M 30 62 Q 100 50 170 62" stroke="#8b7c86" strokeWidth="2.5" fill="none" />
      <text x="34" y="80" fontSize="8" fill="#858D99">IVC</text>
      <text x="152" y="80" fontSize="8" fill="#858D99">SVC</text>
      <text x="92" y="38" fontSize="8" fill="#858D99">LA</text>
      <text x="92" y="82" fontSize="8" fill="#858D99">RA</text>
      {!noTent && !crossed && (
        <>
          <path d={`M ${x - 8} ${57} Q ${x} ${57 - h} ${x + 8} ${57}`} stroke="#ECEEF1" strokeWidth="2" fill="none" />
          <circle cx={x} cy={57 - h * 0.7} r="2.4" fill="#4F8EF7" />
        </>
      )}
      {crossed && (
        <g data-needle="crossed">
          <line x1={x} y1={72} x2={x} y2={40} stroke="#ECEEF1" strokeWidth="1.6" />
          <circle cx={x} cy={40} r="2.4" fill="#4F8EF7" />
        </g>
      )}
      {tx !== null && <circle cx={tx} cy={70} r="2.4" fill="#4F8EF7" />}
    </Sector>
  );
}

/**
 * The aortic short-axis view. aortaR: the root's radius on the image (a dilated root is larger); tent and
 * crossed as in the bicaval view; towardsAorta: the tent stays and the needle runs from it towards the root.
 */
export function ShortAxisView({ ap, aortaR = 15, tentMm, noTent, crossed, towardsAorta }: { ap: number; aortaR?: number; tentMm?: number; noTent?: boolean; crossed?: boolean; towardsAorta?: boolean }) {
  // Septum from the aorta (anterior, left of screen) to posterior (right).
  const x = 100 - ap * 50;
  const h = tentPx(tentMm);
  const y0 = 57 - (x - 100) * 0.1;
  return (
    <Sector label="Aortic short axis: anterior–posterior" angle="~30–60°">
      <circle cx={44 + (aortaR - 15) * 0.6} cy="66" r={aortaR} fill="#1b1416" stroke="#7a3b44" />
      <text x={38 + (aortaR - 15) * 0.6} y="69" fontSize="8" fill="#c97a84">Ao</text>
      <path d="M 60 62 Q 110 52 172 46" stroke="#8b7c86" strokeWidth="2.5" fill="none" />
      <text x="120" y="34" fontSize="8" fill="#858D99">LA</text>
      <text x="120" y="80" fontSize="8" fill="#858D99">RA</text>
      {!noTent && !crossed && (
        <>
          <path d={`M ${x - 8} ${y0} Q ${x} ${y0 - h} ${x + 8} ${y0 - 2}`} stroke="#ECEEF1" strokeWidth="2" fill="none" />
          <circle cx={x} cy={y0 - h * 0.7} r="2.4" fill="#4F8EF7" />
        </>
      )}
      {crossed && (
        <g data-needle="crossed">
          <line x1={x} y1={y0 + 14} x2={x} y2={y0 - 16} stroke="#ECEEF1" strokeWidth="1.6" />
          <circle cx={x} cy={y0 - 16} r="2.4" fill="#4F8EF7" />
        </g>
      )}
      {towardsAorta && !crossed && (
        <g data-needle="towards-aorta">
          <line x1={x} y1={y0 - h * 0.7} x2={44 + (aortaR - 15) * 0.6 + aortaR * 0.5} y2={66 - aortaR * 0.3} stroke="#ECEEF1" strokeWidth="1.6" />
          <circle cx={44 + (aortaR - 15) * 0.6 + aortaR * 0.5} cy={66 - aortaR * 0.3} r="2.4" fill="#4F8EF7" />
        </g>
      )}
    </Sector>
  );
}

/** The four-chamber view with the measured height from the tent to the mitral annular plane (no tent: the measurement is not shown). */
export function FourChamberView({ heightCm, noTent }: { heightCm: number; noTent?: boolean }) {
  // Mitral annular plane fixed; tent rises with height (px per cm).
  const yMv = 80;
  const pxPerCm = 11;
  const yT = clamp(yMv - heightCm * pxPerCm, 20, yMv - 4);
  return (
    <Sector label="Four-chamber: height" angle="~0°">
      <line x1="100" y1="18" x2="100" y2="86" stroke="#8b7c86" strokeWidth="2.5" />
      <line x1="104" y1={yMv} x2="176" y2={yMv} stroke="#a0b4c8" strokeWidth="2" />
      <text x="150" y={yMv - 4} fontSize="7" fill="#858D99">MV annulus</text>
      <text x="138" y="34" fontSize="8" fill="#858D99">LA</text>
      <text x="58" y="34" fontSize="8" fill="#858D99">RA</text>
      {!noTent && (
        <>
          <path d={`M 100 ${yT - 7} Q 112 ${yT} 100 ${yT + 7}`} stroke="#ECEEF1" strokeWidth="2" fill="none" />
          <line x1="118" y1={yT} x2="118" y2={yMv} stroke="#4F8EF7" strokeDasharray="2 2" />
          <text x="122" y={(yT + yMv) / 2 + 3} fontSize="9" fill="#ECEEF1" fontFamily="monospace">
            {heightCm.toFixed(1)} cm
          </text>
        </>
      )}
    </Sector>
  );
}
