import { useRef, type PointerEvent as RPointerEvent } from "react";
import LiveTrace from "../sim/LiveTrace";
import {
  areaDerivedDiameter,
  DEPTH_TARGET,
  CORONARY_HEIGHT_FLAG_MM,
  SINUS_FLAG_MM,
  COURSE,
  type TaviScenario,
  type ValvePlatform,
  type CalciumGrade,
  type PvlGrade,
  type CourseSample,
  type TaviCourse,
} from "../../simulation/tavi";
import { clamp, svgPoint } from "./common";

// Original SVG schematics for the TAVI lab. All drawings are diagrammatic.

const CAL_COUNT: Record<CalciumGrade | "mild" | "moderate" | "severe", number> = {
  none: 0,
  mild: 2,
  moderate: 4,
  severe: 7,
};

// ---------------------------------------------------------------------------
// CT: double-oblique annulus view
// ---------------------------------------------------------------------------

export function CtAnnulusView({ s, showTrace, showCalipers }: { s: TaviScenario; showTrace: boolean; showCalipers: boolean }) {
  const k = 7.2; // px per mm
  const cx = 180;
  const cy = 150;
  const rx = (s.annulus.maxDiameterMm / 2) * k;
  const ry = (s.annulus.minDiameterMm / 2) * k;
  const tilt = -18;
  const calc = CAL_COUNT[s.leafletCalcium] + CAL_COUNT[s.lvotCalcium];
  const spots = Array.from({ length: calc }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180 + 0.4;
    const r = 0.72 + ((i * 37) % 10) / 40;
    return { x: Math.cos(a) * rx * r, y: Math.sin(a) * ry * r, s: 3 + ((i * 7) % 4) };
  });
  return (
    <svg viewBox="0 0 360 300" className="w-full block max-h-[420px]">
      <defs>
        <radialGradient id="ct-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#3b3f44" />
          <stop offset="100%" stopColor="#0d0f12" />
        </radialGradient>
        <radialGradient id="ct-blood" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#c9ced3" />
          <stop offset="100%" stopColor="#8d9399" />
        </radialGradient>
      </defs>
      <rect width="360" height="300" fill="url(#ct-bg)" />
      <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
        {/* myocardium and annular tissue */}
        <ellipse rx={rx + 22} ry={ry + 20} fill="#55595e" />
        <ellipse rx={rx} ry={ry} fill="url(#ct-blood)" />
        {s.bicuspid ? (
          <line x1={-rx * 0.15} y1={-ry} x2={rx * 0.25} y2={ry} stroke="#e8ecef" strokeWidth="3" opacity="0.85" />
        ) : (
          <g stroke="#6b7177" strokeWidth="1.2" opacity="0.7">
            <line x1="0" y1="0" x2="0" y2={-ry} />
            <line x1="0" y1="0" x2={rx * 0.87} y2={ry * 0.5} />
            <line x1="0" y1="0" x2={-rx * 0.87} y2={ry * 0.5} />
          </g>
        )}
        {spots.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.s} fill="#ffffff" opacity="0.95" />
        ))}
        {showTrace && (
          <ellipse rx={rx} ry={ry} fill="none" stroke="#4F8EF7" strokeWidth="1.6" strokeDasharray="5 3" />
        )}
        {showCalipers && (
          <g fontFamily="monospace" fontSize="10">
            <line x1={-rx} y1="0" x2={rx} y2="0" stroke="#E9B95A" strokeWidth="1.3" />
            <line x1={-rx} y1="-5" x2={-rx} y2="5" stroke="#E9B95A" />
            <line x1={rx} y1="-5" x2={rx} y2="5" stroke="#E9B95A" />
            <line x1="0" y1={-ry} x2="0" y2={ry} stroke="#4CC38A" strokeWidth="1.3" />
            <line x1="-5" y1={-ry} x2="5" y2={-ry} stroke="#4CC38A" />
            <line x1="-5" y1={ry} x2="5" y2={ry} stroke="#4CC38A" />
          </g>
        )}
      </g>
      {showCalipers && (
        <g fontFamily="monospace" fontSize="10">
          <text x="10" y="284" fill="#E9B95A">
            Dmax {s.annulus.maxDiameterMm.toFixed(1)} mm
          </text>
          <text x="120" y="284" fill="#4CC38A">
            Dmin {s.annulus.minDiameterMm.toFixed(1)} mm
          </text>
        </g>
      )}
      {showTrace && (
        <text x="230" y="284" fill="#4F8EF7" fontFamily="monospace" fontSize="10">
          {s.annulus.areaMm2.toFixed(0)} mm² · {s.annulus.perimeterMm.toFixed(1)} mm
        </text>
      )}
      <text x="10" y="16" fill="#A6ADB8" fontSize="10">
        Double-oblique, systolic phase
      </text>
      <text x="350" y="16" fill="#858D99" fontSize="9" textAnchor="end">
        {s.bicuspid ? "Bicuspid, calcified raphe" : "Tricuspid"}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CT: root and coronary heights (stretched coronal reconstruction)
// ---------------------------------------------------------------------------

export function CtRootView({ s }: { s: TaviScenario }) {
  const k = 6;
  const cx = 180;
  const yA = 228; // annular plane
  const ann = (areaDerivedDiameter(s.annulus.areaMm2) / 2) * k;
  const sov = (s.sinusDiameterMm / 2) * k;
  const stj = (s.stjDiameterMm / 2) * k;
  const yStj = yA - 21 * k; // diagrammatic STJ height
  const yL = yA - s.coronaryHeightLeftMm * k;
  const yR = yA - s.coronaryHeightRightMm * k;
  const root = `M ${cx - ann} ${yA + 40} L ${cx - ann} ${yA}
    C ${cx - sov - 6} ${yA - 30}, ${cx - sov - 6} ${yStj + 30}, ${cx - stj} ${yStj}
    L ${cx - stj - 4} 8 L ${cx + stj + 4} 8 L ${cx + stj} ${yStj}
    C ${cx + sov + 6} ${yStj + 30}, ${cx + sov + 6} ${yA - 30}, ${cx + ann} ${yA}
    L ${cx + ann} ${yA + 40} Z`;
  const narrow = s.sinusDiameterMm < SINUS_FLAG_MM;
  const hTone = (h: number) => (h >= CORONARY_HEIGHT_FLAG_MM ? "#4CC38A" : narrow ? "#E5534B" : "#E9B95A");
  return (
    <svg viewBox="0 0 360 300" className="w-full block max-h-[420px]">
      <rect width="360" height="300" fill="#0d0f12" />
      <path d={root} fill="#8e959c" stroke="#b9c0c6" strokeWidth="1" />
      {/* leaflets */}
      <path
        d={`M ${cx - ann} ${yA} Q ${cx - ann * 0.4} ${yA - 30} ${cx - 4} ${yA - 46}`}
        stroke={s.leafletCalcium === "severe" ? "#ffffff" : "#d4d9dd"}
        strokeWidth={s.leafletCalcium === "severe" ? 6 : s.leafletCalcium === "moderate" ? 4 : 2.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx + ann} ${yA} Q ${cx + ann * 0.4} ${yA - 30} ${cx + 4} ${yA - 46}`}
        stroke={s.leafletCalcium === "severe" ? "#ffffff" : "#d4d9dd"}
        strokeWidth={s.leafletCalcium === "severe" ? 6 : s.leafletCalcium === "moderate" ? 4 : 2.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* coronaries */}
      <path d={`M ${cx - sov + 2} ${yL} q -30 -6 -62 -26`} stroke="#8e959c" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d={`M ${cx + sov - 2} ${yR} q 30 -4 60 -22`} stroke="#8e959c" strokeWidth="7" fill="none" strokeLinecap="round" />
      <text x={cx - sov - 64} y={yL - 30} fill="#A6ADB8" fontSize="9">
        Left main
      </text>
      <text x={cx + sov + 18} y={yR - 26} fill="#A6ADB8" fontSize="9">
        RCA
      </text>
      {/* annular plane */}
      <line x1="20" y1={yA} x2="340" y2={yA} stroke="#4F8EF7" strokeDasharray="5 3" />
      <text x="22" y={yA + 13} fill="#4F8EF7" fontSize="9">
        Annular plane
      </text>
      {/* heights */}
      <g fontFamily="monospace" fontSize="10">
        <line x1={cx - sov + 18} y1={yA} x2={cx - sov + 18} y2={yL} stroke={hTone(s.coronaryHeightLeftMm)} strokeWidth="1.5" />
        <text x={cx - sov + 22} y={(yA + yL) / 2 + 4} fill={hTone(s.coronaryHeightLeftMm)}>
          {s.coronaryHeightLeftMm.toFixed(1)}
        </text>
        <line x1={cx + sov - 18} y1={yA} x2={cx + sov - 18} y2={yR} stroke={hTone(s.coronaryHeightRightMm)} strokeWidth="1.5" />
        <text x={cx + sov - 48} y={(yA + yR) / 2 + 4} fill={hTone(s.coronaryHeightRightMm)}>
          {s.coronaryHeightRightMm.toFixed(1)}
        </text>
        {/* SOV and STJ */}
        <line x1={cx - sov - 4} y1={yA - 70} x2={cx + sov + 4} y2={yA - 70} stroke={narrow ? "#E5534B" : "#A6ADB8"} strokeDasharray="3 2" />
        <text x={cx} y={yA - 74} fill={narrow ? "#E5534B" : "#A6ADB8"} textAnchor="middle">
          SOV {s.sinusDiameterMm.toFixed(1)}
        </text>
        <line x1={cx - stj} y1={yStj} x2={cx + stj} y2={yStj} stroke="#A6ADB8" strokeDasharray="3 2" />
        <text x={cx} y={yStj - 4} fill="#A6ADB8" textAnchor="middle">
          STJ {s.stjDiameterMm.toFixed(1)}
        </text>
      </g>
      <text x="10" y="16" fill="#A6ADB8" fontSize="10">
        Root reconstruction (mm)
      </text>
      <text x="350" y="292" fill="#858D99" fontSize="9" textAnchor="end">
        Flag: height &lt;{CORONARY_HEIGHT_FLAG_MM} mm with SOV &lt;{SINUS_FLAG_MM} mm
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CT: LVOT and membranous septum
// ---------------------------------------------------------------------------

export function CtSeptumView({ s, depthMm, platform }: { s: TaviScenario; depthMm: number; platform: ValvePlatform }) {
  const k = 9;
  const yA = 110;
  const xS = 150; // septal wall
  const ms = s.membranousSeptumMm * k;
  const yD = yA + depthMm * k;
  const deeper = depthMm > s.membranousSeptumMm;
  const t = DEPTH_TARGET[platform];
  return (
    <svg viewBox="0 0 360 300" className="w-full block max-h-[420px]">
      <rect width="360" height="300" fill="#0d0f12" />
      {/* LVOT blood pool */}
      <path d={`M ${xS} 20 L ${xS} 290 L 330 290 L 330 20 Z`} fill="#868d94" />
      {/* aortic wall above, membranous then muscular septum below */}
      <rect x={xS - 40} y="20" width="40" height={yA - 20} fill="#3c4045" />
      <rect x={xS - 16} y={yA} width="16" height={ms} fill="#6d7a87" />
      <rect x={xS - 56} y={yA + ms} width="56" height={290 - yA - ms} fill="#4a4e53" />
      {/* MS bracket and label on the left */}
      <line x1={xS - 22} y1={yA} x2={xS - 22} y2={yA + ms} stroke="#a9c0d6" strokeWidth="1.5" />
      <line x1={xS - 26} y1={yA} x2={xS - 18} y2={yA} stroke="#a9c0d6" />
      <line x1={xS - 26} y1={yA + ms} x2={xS - 18} y2={yA + ms} stroke="#a9c0d6" />
      <text x={xS - 30} y={yA + ms / 2 + 4} fill="#a9c0d6" fontSize="10" fontFamily="monospace" textAnchor="end">
        MS {s.membranousSeptumMm.toFixed(1)} mm
      </text>
      <circle cx={xS - 4} cy={yA + ms + 4} r="4" fill="#E9B95A" />
      <text x={xS - 62} y={yA + ms + 22} fill="#E9B95A" fontSize="8" textAnchor="end">
        Conduction axis
      </text>
      <text x={xS - 62} y={yA + ms + 44} fill="#A6ADB8" fontSize="9" textAnchor="end">
        Muscular septum
      </text>
      {/* annular plane */}
      <line x1="20" y1={yA} x2="340" y2={yA} stroke="#4F8EF7" strokeDasharray="5 3" />
      <text x="22" y={yA - 5} fill="#4F8EF7" fontSize="9">
        Annular plane
      </text>
      {/* teaching band */}
      <rect x={xS} y={yA + t.ideal[0] * k} width="180" height={(t.ideal[1] - t.ideal[0]) * k} fill="#4CC38A" opacity="0.12" />
      {/* planned inflow */}
      <line x1={xS} y1={yD} x2="330" y2={yD} stroke={deeper ? "#E5534B" : "#ECEEF1"} strokeWidth="2" />
      <text x="326" y={yD + 14} fill={deeper ? "#E5534B" : "#ECEEF1"} fontSize="10" fontFamily="monospace" textAnchor="end">
        planned inflow {depthMm.toFixed(1)} mm{deeper ? " (below MS)" : ""}
      </text>
      <text x="10" y="16" fill="#A6ADB8" fontSize="10">
        Coronal LVOT: membranous septum
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CT: iliofemoral access
// ---------------------------------------------------------------------------

export function AccessView({ s, minVesselMm }: { s: TaviScenario; minVesselMm: number }) {
  const amp = s.access.tortuosity === "severe" ? 26 : s.access.tortuosity === "moderate" ? 16 : s.access.tortuosity === "mild" ? 8 : 2;
  const calc = CAL_COUNT[s.access.calcification];
  const w = clamp(s.access.mldMm * 1.6, 5, 16);
  const legR = `M 180 30 L 180 70 C 200 100, ${230 + amp} 120, ${236 - amp} 160 S ${250 + amp} 220, 262 270`;
  const legL = `M 180 70 C 160 100, ${130 - amp} 120, ${124 + amp} 160 S ${110 - amp} 220, 98 270`;
  const k = 10;
  const margin = s.access.mldMm - minVesselMm;
  return (
    <svg viewBox="0 0 360 300" className="w-full block max-h-[420px]">
      <rect width="360" height="300" fill="#0d0f12" />
      <path d={legR} stroke="#8e959c" strokeWidth={w + 4} fill="none" strokeLinecap="round" />
      <path d={legL} stroke="#8e959c" strokeWidth={w + 4} fill="none" strokeLinecap="round" />
      <path d="M 180 10 L 180 72" stroke="#8e959c" strokeWidth="22" strokeLinecap="round" />
      {Array.from({ length: calc * 2 }, (_, i) => (
        <circle key={i} cx={i % 2 ? 236 + ((i * 13) % 20) - 10 : 124 + ((i * 11) % 20) - 10} cy={130 + ((i * 29) % 110)} r="2.6" fill="#ffffff" />
      ))}
      {/* MLD marker */}
      <circle cx={236 - amp} cy="160" r={w / 2 + 7} fill="none" stroke="#E9B95A" strokeDasharray="3 2" />
      <text x={248 - amp + w} y="164" fill="#E9B95A" fontSize="10" fontFamily="monospace">
        MLD {s.access.mldMm.toFixed(1)} mm
      </text>
      {/* cross-section to scale */}
      <g transform="translate(60 230)">
        <circle r={(s.access.mldMm / 2) * k} fill="#868d94" stroke="#b9c0c6" />
        <circle
          r={(minVesselMm / 2) * k}
          fill="none"
          stroke={margin < 0 ? "#E5534B" : margin < 0.5 ? "#E9B95A" : "#4CC38A"}
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <text x="0" y={-(Math.max(minVesselMm, s.access.mldMm) / 2) * k - 6} fill="#A6ADB8" fontSize="9" textAnchor="middle">
          Lumen vs minimum vessel
        </text>
      </g>
      <text x="10" y="16" fill="#A6ADB8" fontSize="10">
        Iliofemoral CT angiogram
      </text>
      <text x="350" y="16" fill="#858D99" fontSize="9" textAnchor="end">
        calcium {s.access.calcification}, tortuosity {s.access.tortuosity}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Fluoroscopy: coplanar deployment view
// ---------------------------------------------------------------------------

export interface FluoroState {
  platform: ValvePlatform;
  sizeMm: number;
  depthMm: number;
  /** 0 crimped … 1 fully expanded (SE expands from the inflow) */
  expansion: number;
  balloon: number; // 0 … 1 balloon inflation (predilatation, BE deployment or post-dilatation)
  balloonDiameterMm?: number;
  pacing: boolean;
  showOverlay: boolean;
  contrast: null | { pvl: PvlGrade; blockedCoronary: "left" | "right" | null };
  draggable: boolean;
  /** valve not yet on the table (e.g. during predilatation) */
  hideValve?: boolean;
}

const K = 6.5; // px per mm
const YA = 236; // annular plane
const CXF = 270;

function frameHeightMm(platform: ValvePlatform, size: number) {
  return platform === "balloon-expandable" ? 0.68 * size : 1.7 * size;
}

/** Expanded width (mm) at fraction t from inflow (0) to outflow (1). */
function profileMm(platform: ValvePlatform, size: number, t: number) {
  if (platform === "balloon-expandable") return size;
  if (t < 0.25) return size * (1.02 - 0.5 * t * 0.6);
  if (t < 0.55) return size * 0.92;
  return size * (0.92 + (t - 0.55) * 0.75);
}

export function FluoroDeployView({
  s,
  st,
  onDepth,
}: {
  s: TaviScenario;
  st: FluoroState;
  onDepth?: (d: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ y0: number; d0: number } | null>(null);
  const ann = (areaDerivedDiameter(s.annulus.areaMm2) / 2) * K;
  const sov = (s.sinusDiameterMm / 2) * K;
  const stj = (s.stjDiameterMm / 2) * K;
  const yStj = YA - 21 * K;
  const H = frameHeightMm(st.platform, st.sizeMm);
  const yIn = YA + st.depthMm * K;
  const rows = 8;
  const crimp = 8;
  const cols = 6;

  // Frame geometry per row boundary (bottom = inflow).
  const rowsY = Array.from({ length: rows + 1 }, (_, i) => yIn - (i / rows) * H * K);
  const rowHalf = rowsY.map((_, i) => {
    const t = i / rows;
    const e =
      st.platform === "self-expanding" ? clamp(st.expansion * (rows + 2) - i, 0, 1) : clamp(st.expansion, 0, 1);
    const w = crimp + (profileMm(st.platform, st.sizeMm, t) - crimp) * e;
    return (w / 2) * K;
  });

  const struts: string[] = [];
  for (let i = 0; i < rows; i++) {
    const y0 = rowsY[i];
    const y1 = rowsY[i + 1];
    const h0 = rowHalf[i];
    const h1 = rowHalf[i + 1];
    for (let c = 0; c <= cols; c++) {
      const f = c / cols;
      const xa0 = CXF - h0 + 2 * h0 * f;
      const xa1 = CXF - h1 + 2 * h1 * f;
      const f2 = (c + 0.5) / cols;
      const xb1 = CXF - h1 + 2 * h1 * Math.min(1, f2);
      if (c < cols) struts.push(`M ${xa0} ${y0} L ${xb1} ${y1}`);
      if (c > 0) {
        const fm = (c - 0.5) / cols;
        const xm1 = CXF - h1 + 2 * h1 * fm;
        struts.push(`M ${xa0} ${y0} L ${xm1} ${y1}`);
      }
      if (i === 0 || i === rows - 1) struts.push(`M ${xa0} ${y0} L ${xa1} ${y1}`);
    }
  }

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (!st.draggable || !onDepth || !svgRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    drag.current = { y0: p.y, d0: st.depthMm };
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag.current || !onDepth || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    const d = drag.current.d0 + (p.y - drag.current.y0) / K;
    onDepth(Math.round(clamp(d, -6, 12) * 2) / 2);
  };
  const onUp = () => {
    drag.current = null;
  };

  const t = DEPTH_TARGET[st.platform];
  const yTop = rowsY[rows];
  const pvlW = st.contrast ? (st.contrast.pvl === "moderate" ? 34 : st.contrast.pvl === "mild" ? 16 : 0) : 0;
  const yMs = YA + s.membranousSeptumMm * K;
  const balloonHalf = ((st.balloonDiameterMm ?? st.sizeMm) / 2) * K * st.balloon;
  const balloonLen = Math.max(H, 22) * K * 0.9;
  const balloonCy = st.balloonDiameterMm ? YA - 4 : yIn - (H * K) / 2;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 540 420"
      className={`w-full block select-none ${st.draggable ? "cursor-ns-resize" : ""}`}
      style={{ touchAction: "none" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <defs>
        <radialGradient id="fl-field" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#3a424b" />
          <stop offset="70%" stopColor="#1c2228" />
          <stop offset="100%" stopColor="#07090b" />
        </radialGradient>
      </defs>
      <rect width="540" height="420" fill="url(#fl-field)" />
      {/* spine shadow and ribs for context */}
      <rect x="420" y="0" width="60" height="420" fill="#2b3239" opacity="0.6" />
      {[60, 150, 240, 330].map((y) => (
        <path key={y} d={`M 0 ${y} Q 200 ${y - 30} 540 ${y + 10}`} stroke="#2e353c" strokeWidth="10" fill="none" opacity="0.5" />
      ))}

      {/* contrast in the root */}
      {st.contrast && (
        <g opacity="0.9">
          <path
            d={`M ${CXF - ann} ${YA} C ${CXF - sov - 6} ${YA - 30}, ${CXF - sov - 6} ${yStj + 30}, ${CXF - stj} ${yStj}
                L ${CXF - stj - 4} 0 L ${CXF + stj + 4} 0 L ${CXF + stj} ${yStj}
                C ${CXF + sov + 6} ${yStj + 30}, ${CXF + sov + 6} ${YA - 30}, ${CXF + ann} ${YA} Z`}
            fill="#c9d2da"
            opacity="0.55"
          />
          {st.contrast.blockedCoronary !== "left" && (
            <path d={`M ${CXF + sov - 6} ${YA - s.coronaryHeightLeftMm * K} q 40 -10 90 -40 t 60 -30`} stroke="#c9d2da" strokeWidth="6" fill="none" opacity="0.7" />
          )}
          {st.contrast.blockedCoronary === "left" && (
            <path d={`M ${CXF + sov - 6} ${YA - s.coronaryHeightLeftMm * K} q 10 -3 16 -6`} stroke="#c9d2da" strokeWidth="6" fill="none" opacity="0.7" />
          )}
          {st.contrast.blockedCoronary !== "right" && (
            <path d={`M ${CXF - sov + 6} ${YA - s.coronaryHeightRightMm * K} q -40 0 -80 30 t -50 60`} stroke="#c9d2da" strokeWidth="5" fill="none" opacity="0.7" />
          )}
          {pvlW > 0 && (
            <path
              d={`M ${CXF - ann + 6} ${YA + 4} q ${-pvlW * 0.4} ${pvlW} ${pvlW * 0.2} ${pvlW * 2.2} q ${pvlW * 0.5} ${-pvlW * 0.6} ${pvlW * 0.2} ${-pvlW * 2.2} Z`}
              fill="#c9d2da"
              opacity="0.5"
            />
          )}
        </g>
      )}

      {/* faint roadmap outline of the root */}
      <path
        d={`M ${CXF - ann} ${YA + 60} L ${CXF - ann} ${YA} C ${CXF - sov - 6} ${YA - 30}, ${CXF - sov - 6} ${yStj + 30}, ${CXF - stj} ${yStj} L ${CXF - stj - 4} 0`}
        stroke="#7d8892"
        strokeDasharray="3 4"
        fill="none"
        opacity="0.5"
      />
      <path
        d={`M ${CXF + ann} ${YA + 60} L ${CXF + ann} ${YA} C ${CXF + sov + 6} ${YA - 30}, ${CXF + sov + 6} ${yStj + 30}, ${CXF + stj} ${yStj} L ${CXF + stj + 4} 0`}
        stroke="#7d8892"
        strokeDasharray="3 4"
        fill="none"
        opacity="0.5"
      />
      {/* native leaflet calcium */}
      {Array.from({ length: CAL_COUNT[s.leafletCalcium] + 1 }, (_, i) => (
        <circle
          key={i}
          cx={CXF - ann * 0.8 + ((i * 41) % Math.max(1, Math.round(ann * 1.6)))}
          cy={YA - 8 - ((i * 17) % 22)}
          r={2 + (i % 3)}
          fill="#e8edf2"
          opacity="0.55"
        />
      ))}

      {/* pigtail in the non-coronary cusp */}
      <path d={`M ${CXF - 60} 0 C ${CXF - 66} 120, ${CXF - ann + 10} 190, ${CXF - ann + 14} ${YA - 10}`} stroke="#e8edf2" strokeWidth="2" fill="none" />
      <circle cx={CXF - ann + 20} cy={YA - 4} r="7" stroke="#e8edf2" strokeWidth="2" fill="none" />
      <text x={CXF - ann + 20} y={YA + 22} fill="#A6ADB8" fontSize="10" textAnchor="middle">
        NCC
      </text>

      {/* guidewire into the LV */}
      <path d={`M ${CXF} 0 L ${CXF} ${yIn + 40} C ${CXF} ${yIn + 120}, ${CXF + 90} ${yIn + 140}, ${CXF + 60} ${yIn + 90} C ${CXF + 40} ${yIn + 70}, ${CXF + 10} ${yIn + 110}, ${CXF + 40} ${yIn + 130}`} stroke="#e8edf2" strokeWidth="1.5" fill="none" />
      {/* delivery system */}
      {!st.hideValve && (
        <g>
          <rect x={CXF - 5} y="0" width="10" height={Math.max(0, yTop - 4)} fill="#4b5560" stroke="#aab4be" strokeWidth="0.8" />
          <path d={`M ${CXF - 5} ${yIn + 2} L ${CXF} ${yIn + 26} L ${CXF + 5} ${yIn + 2} Z`} fill="#aab4be" />
        </g>
      )}

      {/* balloon */}
      {st.balloon > 0.02 && (
        <ellipse cx={CXF} cy={balloonCy} rx={Math.max(4, balloonHalf)} ry={balloonLen / 2} fill="#b8c4cf" opacity="0.35" stroke="#dbe3ea" />
      )}

      {/* valve frame */}
      {!st.hideValve && (
        <g>
          <path d={struts.join(" ")} stroke="#f2f5f8" strokeWidth="1.6" fill="none" />
          <line x1={CXF - rowHalf[0]} y1={yIn} x2={CXF + rowHalf[0]} y2={yIn} stroke="#ffffff" strokeWidth="2.4" />
        </g>
      )}

      {/* overlay */}
      {st.showOverlay && (
        <g>
          <rect x={CXF - 140} y={YA + t.ideal[0] * K} width="280" height={(t.ideal[1] - t.ideal[0]) * K} fill="#4CC38A" opacity="0.1" />
          <line x1="40" y1={YA} x2="500" y2={YA} stroke="#4F8EF7" strokeDasharray="6 4" />
          <text x="496" y={YA - 5} fill="#4F8EF7" fontSize="10" textAnchor="end">
            Annular plane (cusp nadirs)
          </text>
          <line x1={CXF + ann + 30} y1={YA} x2={CXF + ann + 30} y2={yMs} stroke="#a9c0d6" strokeWidth="2" />
          <text x={CXF + ann + 36} y={(YA + yMs) / 2 + 4} fill="#a9c0d6" fontSize="9">
            MS {s.membranousSeptumMm.toFixed(1)} mm (CT)
          </text>
        </g>
      )}

      {/* depth readout */}
      <g fontFamily="monospace" fontSize="11" opacity={st.hideValve ? 0 : 1}>
        <line x1={CXF - rowHalf[0] - 18} y1={YA} x2={CXF - rowHalf[0] - 18} y2={yIn} stroke="#E9B95A" strokeWidth="1.5" />
        <text x={CXF - rowHalf[0] - 24} y={(YA + yIn) / 2 + 4} fill="#E9B95A" textAnchor="end">
          {Math.abs(st.depthMm).toFixed(1)} mm {st.depthMm >= 0 ? "below" : "above"}
        </text>
      </g>

      <text x="12" y="18" fill="#A6ADB8" fontSize="11">
        Coplanar view: hinge points in line, pigtail in the NCC
      </text>
      {st.pacing && (
        <text x="528" y="18" fill="#E5534B" fontSize="11" textAnchor="end">
          RAPID PACING
        </text>
      )}
      {st.draggable && (
        <text x="528" y="410" fill="#858D99" fontSize="10" textAnchor="end">
          Drag up or down to set depth
        </text>
      )}
    </svg>
  );
}

export { frameHeightMm };

// ---------------------------------------------------------------------------
// Assess step: the monitor through the post-deployment course, and the root
// injection (structural-tips-and-tavi-course). Both show only what the operator
// would see: the ECG, the arterial line and whether each coronary fills when the
// root is injected. Waveform shapes are schematic.
// ---------------------------------------------------------------------------

/** Monitor trace colours (tailwind.config.js: ecg, art; only on monitors). */
const ECG_COLOUR = "#4FE0A0";
const ART_COLOUR = "#FF7A85";

const gauss = (x: number, mu: number, w: number) => Math.exp(-((x - mu) * (x - mu)) / (2 * w * w));

/** A schematic ECG beat, mV, at `tau` s after the beat starts, with the ST segment shifted by `stMm` (1 mm = 0.1 mV). */
function ecgBeat(tau: number, wide: boolean, stMm: number, spike: boolean): number {
  const k = wide ? 2.2 : 1;
  let v = 0;
  if (spike) v += 1.6 * gauss(tau, 0.16, 0.002);
  v += -0.1 * gauss(tau, 0.18, 0.008 * k) + 1.0 * gauss(tau, 0.2, 0.011 * k) - 0.25 * gauss(tau, 0.22 + 0.02 * (k - 1), 0.009 * k);
  const st = stMm * 0.1;
  if (tau > 0.23 && tau < 0.5) v += st * Math.min(1, (tau - 0.23) / 0.02) * Math.min(1, (0.5 - tau) / 0.06);
  v += (wide ? -0.25 : 0.3) * gauss(tau, 0.42, 0.05);
  return v;
}

/** The ECG of a course sample at time t (s), for one lead. */
export function courseEcg(sample: CourseSample, t: number, stMm: number): number {
  if (sample.rhythm === "chb") {
    // atria at their own rate, ventricles at the escape rate with wide complexes
    const pp = 60 / COURSE.chbAtrialHr;
    const tp = ((t % pp) + pp) % pp;
    const p = 0.12 * gauss(tp, 0.08, 0.02);
    const rr = 60 / sample.hr;
    return p + ecgBeat(((t % rr) + rr) % rr, true, stMm, false);
  }
  const rr = 60 / Math.max(1, sample.hr);
  const tau = ((t % rr) + rr) % rr;
  if (sample.rhythm === "rapid-pacing") return ecgBeat(tau + 0.14, true, 0, true);
  if (sample.rhythm === "paced") return ecgBeat(tau, true, stMm, true);
  return 0.12 * gauss(tau, 0.08, 0.02) + ecgBeat(tau, false, stMm, false);
}

/** The arterial pressure of a course sample at time t (s), mmHg. */
export function courseArt(sample: CourseSample, t: number): number {
  const rr = 60 / Math.max(1, sample.hr);
  const phi = (((t % rr) + rr) % rr) / rr;
  const up = 0.14;
  const shape = phi < up ? Math.sin((phi / up) * (Math.PI / 2)) : Math.exp(-(phi - up) * 3) * (1 + 0.06 * gauss(phi, 0.38, 0.02));
  return sample.dia + (sample.sys - sample.dia) * Math.min(1, shape);
}

export function CourseMonitor({
  course,
  sampleAt,
  clock,
  now,
}: {
  course: TaviCourse;
  /** the course at time t, s */
  sampleAt: (t: number) => CourseSample;
  /** the course clock, s */
  clock: () => number;
  /** the sample on the numeric read-outs */
  now: CourseSample;
}) {
  const lead = (l: "II" | "V5") => ({
    fn: (t: number) => {
      const smp = sampleAt(t);
      return courseEcg(smp, t, l === course.stLead ? smp.stMm : 0);
    },
    color: ECG_COLOUR,
    label: l,
    width: 1.4,
  });
  // One strip per lead, so each label sits on its own trace. LiveTrace draws its unit once at the
  // top right and the sweep paints over it, so the strips carry no unit; the read-outs name them.
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 items-stretch">
        <div className="space-y-1">
          <LiveTrace channels={[lead("II")]} min={-1.4} max={1.8} height={64} seconds={6} unit="" gridStep={1} clock={clock} />
          <LiveTrace channels={[lead("V5")]} min={-1.4} max={1.8} height={64} seconds={6} unit="" gridStep={1} clock={clock} />
        </div>
        <div className="flex flex-col justify-center rounded-md border border-line px-2 py-1.5 font-mono">
          <span className="stat-label">HR</span>
          <span className="text-xl leading-none" style={{ color: ECG_COLOUR }}>
            {Math.round(now.hr)}
          </span>
          <span className="text-[12px] text-ink-faint mt-0.5">bpm</span>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 items-stretch">
        <LiveTrace channels={[{ fn: (t: number) => courseArt(sampleAt(t), t), color: ART_COLOUR, label: "ART", width: 2 }]} min={0} max={160} height={120} seconds={6} unit="" clock={clock} />
        <div className="flex flex-col justify-center rounded-md border border-line px-2 py-1.5 font-mono">
          <span className="stat-label">ART mmHg</span>
          <span className="text-base leading-none" style={{ color: ART_COLOUR }}>
            {Math.round(now.sys)}/{Math.round(now.dia)}
          </span>
          <span className="text-[12px] text-ink-faint mt-0.5">({Math.round(now.map)})</span>
        </div>
      </div>
    </div>
  );
}

/** The latest root injection: when it was done and what filled. */
export interface RootInjection {
  t: number;
  leftFills: boolean;
  rightFills: boolean;
}

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/**
 * Schematic of the root injection in a shallow LAO view: the root, the valve frame and each coronary
 * filled to its branches or ending as a stump at the ostium.
 */
export function RootInjectionView({ injection }: { injection: RootInjection | null }) {
  const W = 300;
  const H = 170;
  const cx = 150;
  const root = "M 120 160 L 120 120 C 96 104, 98 70, 122 54 L 120 0 L 180 0 L 178 54 C 202 70, 204 104, 180 120 L 180 160 Z";
  const left = "M 194 92 C 220 80, 240 70, 262 48 M 236 70 C 250 82, 268 96, 284 120 M 262 48 C 272 36, 282 30, 294 26";
  const right = "M 106 96 C 84 92, 64 104, 52 126 C 44 140, 40 152, 34 166 M 64 106 C 52 102, 40 98, 26 100";
  const fillOn = "#c9d2da";
  // the accessible name says what the picture shows, in the same neutral terms (which vessel is
  // opacified, which ends at its ostium), so a screen-reader user reads the image, not a verdict
  const label = injection
    ? `Root injection at ${mmss(injection.t)}, LAO projection: ${injection.rightFills ? "right coronary opacified to its branches" : "right coronary ostium only"}; ${injection.leftFills ? "left coronary opacified to its branches" : "left coronary ostium only"}`
    : "Root injection schematic, LAO projection: no root injection yet";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" role="img" aria-label={label}>
      <rect width={W} height={H} fill="#11161b" />
      {injection ? (
        <g>
          <path d={root} fill={fillOn} opacity="0.5" />
          {injection.leftFills ? <path d={left} stroke={fillOn} strokeWidth="5" fill="none" opacity="0.8" /> : <path d="M 180 94 L 196 90" stroke={fillOn} strokeWidth="5" fill="none" opacity="0.8" />}
          {injection.rightFills ? <path d={right} stroke={fillOn} strokeWidth="4.5" fill="none" opacity="0.8" /> : <path d="M 120 96 L 104 96" stroke={fillOn} strokeWidth="4.5" fill="none" opacity="0.8" />}
        </g>
      ) : (
        <path d={root} fill="none" stroke="#7d8892" strokeDasharray="3 4" opacity="0.6" />
      )}
      {/* valve frame */}
      <g stroke="#f2f5f8" strokeWidth="1.2" fill="none" opacity="0.85">
        <rect x={cx - 26} y="112" width="52" height="34" />
        <path d={`M ${cx - 26} 129 L ${cx + 26} 129 M ${cx - 9} 112 L ${cx - 9} 146 M ${cx + 9} 112 L ${cx + 9} 146`} />
      </g>
      {/* pigtail */}
      <path d="M 132 0 C 130 40, 126 80, 128 104" stroke="#e8edf2" strokeWidth="1.6" fill="none" />
      <circle cx="132" cy="108" r="5" stroke="#e8edf2" strokeWidth="1.6" fill="none" />
      <text x="8" y="14" fill="#A6ADB8" fontSize="10">
        {injection ? `Root injection at ${mmss(injection.t)}` : "No root injection yet"}
      </text>
      <text x="8" y="27" fill="#A6ADB8" fontSize="9">
        LAO projection
      </text>
      {/* vessel names only, placed by the ostia, so they say which artery is which and not whether it fills */}
      <text x="202" y="114" fill="#A6ADB8" fontSize="9">
        LCA
      </text>
      <text x="86" y="114" fill="#A6ADB8" fontSize="9">
        RCA
      </text>
    </svg>
  );
}
