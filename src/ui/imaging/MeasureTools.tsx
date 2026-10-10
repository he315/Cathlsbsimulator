// ---------------------------------------------------------------------------
// Intravascular measuring tools, shared by the IVUS and OCT bench and the PCI
// lab (pci-bench-measure-and-plan). The learner measures on the frame the way a
// console's tools do: trace an outline (area, and its mean diameter), a caliper
// (a diameter or a distance), an arc protractor about the catheter (a calcium or
// lipid arc) and a thickness caliper (calcium thickness, OCT only: IVUS cannot
// see behind calcium). PullbackMarkers places markers along the pullback, snapping
// to frames and to markers already placed, and reads the length between two.
//
// The tools report only what the learner measured. They show no finding of their
// own (no plaque burden, no area the learner did not trace), so they are safe on
// a live lab screen in every mode. Geometry is the frame's: the overlay shares
// IntravascularView's coordinates (a 300 × 300 view box, centre 150, pxPerMm),
// and the arithmetic is src/simulation/bench/measure.ts.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { IvusFrame } from "../../simulation/pci/ivus";
import { arcDegBetween, distanceMm, meanDiameterMm, polygonAreaMm2, snapMm, type Pt } from "../../simulation/bench/measure";

export type MeasureToolId = "trace" | "caliper" | "arc" | "thickness";

export type Measurement =
  | { tool: "trace"; areaMm2: number; meanDiameterMm: number }
  | { tool: "caliper"; mm: number }
  | { tool: "arc"; deg: number }
  | { tool: "thickness"; mm: number };

export const TOOL_LABEL: Record<MeasureToolId, string> = { trace: "Trace area", caliper: "Caliper", arc: "Arc", thickness: "Thickness" };

const C = 150;
const VIEW = 300;

/** Why a tool cannot be used on this frame, or null. */
export function toolBlocked(tool: MeasureToolId, frame: IvusFrame): string | null {
  if (tool === "thickness" && frame.modality === "IVUS") return "IVUS cannot see behind calcium (acoustic shadow): thickness is not measurable.";
  return null;
}

/** The text of a measurement, as the read-out shows it. */
export function measurementText(m: Measurement): string {
  switch (m.tool) {
    case "trace":
      return `${m.areaMm2.toFixed(2)} mm² (mean diameter ${m.meanDiameterMm.toFixed(2)} mm)`;
    case "caliper":
      return `${m.mm.toFixed(2)} mm`;
    case "arc":
      return `${m.deg.toFixed(0)}°`;
    case "thickness":
      return `${m.mm.toFixed(2)} mm thick`;
  }
}

export interface MeasureToolsProps {
  frame: IvusFrame;
  /** the image to measure on (an IntravascularView of the same frame, at the same pxPerMm) */
  children: ReactNode;
  pxPerMm?: number;
  tools?: readonly MeasureToolId[];
  /** why this frame cannot be measured at all (the aorta, uncleared blood); the tools are disabled */
  blocked?: string | null;
  /** called with each finished measurement */
  onMeasure?: (m: Measurement) => void;
  /** actions for the last measurement (for example "use as the MLA") */
  actions?: (m: Measurement) => ReactNode;
  className?: string;
}

export default function MeasureTools({ frame, children, pxPerMm = 28, tools = ["trace", "caliper", "arc", "thickness"], blocked = null, onMeasure, actions, className = "" }: MeasureToolsProps) {
  const [tool, setTool] = useState<MeasureToolId>(tools[0] ?? "trace");
  const [pts, setPts] = useState<Pt[]>([]);
  const [last, setLast] = useState<Measurement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const s = pxPerMm;
  const toolBlock = blocked ?? toolBlocked(tool, frame);

  // a new frame starts a new measurement
  useEffect(() => {
    setPts([]);
  }, [frame.mm, frame.modality]);

  const finish = (m: Measurement) => {
    setLast(m);
    setPts([]);
    onMeasure?.(m);
  };

  const toMm = (clientX: number, clientY: number): Pt | null => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const x = ((clientX - r.left) * VIEW) / r.width;
    const y = ((clientY - r.top) * VIEW) / r.height;
    return [(x - C) / s, (y - C) / s];
  };

  const onClick = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (toolBlock) return;
    const p = toMm(e.clientX, e.clientY);
    if (!p) return;
    const next = [...pts, p];
    if (tool === "trace") {
      setPts(next);
      return;
    }
    if (next.length < 2) {
      setPts(next);
      return;
    }
    const [a, b] = next;
    if (tool === "caliper") finish({ tool, mm: distanceMm(a, b) });
    else if (tool === "thickness") finish({ tool, mm: distanceMm(a, b) });
    else finish({ tool: "arc", deg: arcDegBetween(a, b) });
  };

  const closeTrace = () => {
    if (pts.length < 3) return;
    const a = polygonAreaMm2(pts);
    finish({ tool: "trace", areaMm2: a, meanDiameterMm: meanDiameterMm(a) });
  };

  const px = (p: Pt) => [C + p[0] * s, C + p[1] * s] as const;
  const hint =
    toolBlock ??
    (tool === "trace"
      ? "Click round the outline, then close the trace."
      : tool === "arc"
        ? "Click the start of the arc, then its end, going clockwise."
        : tool === "thickness"
          ? "Click the leading edge of the calcium, then its back edge."
          : "Click the two ends of the distance.");

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Measuring tools">
        <div className="seg">
          {tools.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === tool}
              className={`seg-btn ${t === tool ? "seg-btn-active" : ""}`}
              onClick={() => {
                setTool(t);
                setPts([]);
              }}
            >
              {TOOL_LABEL[t]}
            </button>
          ))}
        </div>
        {tool === "trace" && (
          <button type="button" className="btn h-8 px-2.5 text-[12.5px]" disabled={pts.length < 3 || !!toolBlock} onClick={closeTrace}>
            Close trace
          </button>
        )}
        <button type="button" className="btn btn-ghost h-8 px-2.5 text-[12.5px]" disabled={!pts.length} onClick={() => setPts([])}>
          Clear
        </button>
      </div>
      <div className="relative w-full max-w-[300px]">
        {children}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className={`absolute inset-0 h-full w-full ${toolBlock ? "cursor-not-allowed" : "cursor-crosshair"}`}
          onClick={onClick}
          role="presentation"
        >
          {tool === "arc" &&
            pts.map((p, i) => {
              const a = Math.atan2(p[1], p[0]);
              return <line key={`r${i}`} x1={C} y1={C} x2={C + Math.cos(a) * 146} y2={C + Math.sin(a) * 146} stroke="#4F8EF7" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.9} />;
            })}
          {tool === "trace" && pts.length > 1 && <polyline points={pts.map((p) => px(p).join(",")).join(" ")} fill="none" stroke="#4F8EF7" strokeWidth={1.5} />}
          {(tool === "caliper" || tool === "thickness") && pts.length === 1 && <circle cx={px(pts[0])[0]} cy={px(pts[0])[1]} r={6} fill="none" stroke="#4F8EF7" strokeWidth={1} />}
          {pts.map((p, i) => {
            const [x, y] = px(p);
            return <circle key={i} cx={x} cy={y} r={2.6} fill="#4F8EF7" />;
          })}
        </svg>
      </div>
      <p className={`text-[12px] ${toolBlock ? "text-warn" : "text-ink-faint"}`}>{hint}</p>
      {last && (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]" aria-live="polite">
          <span className="text-ink-soft">{TOOL_LABEL[last.tool]}:</span>
          <span className="metric text-ink">{measurementText(last)}</span>
          {actions?.(last)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markers along the pullback
// ---------------------------------------------------------------------------

export interface PullbackMarkerDef {
  id: string;
  label: string;
}

export interface PullbackMarkersProps {
  /** pullback extent (mm from the proximal end) */
  fromMm: number;
  toMm: number;
  cursorMm: number;
  onCursor: (mm: number) => void;
  defs: readonly PullbackMarkerDef[];
  markers: Readonly<Record<string, number | undefined>>;
  onMark: (id: string, mm: number) => void;
  /** the two markers whose distance is the length (default the first two) */
  lengthBetween?: readonly [string, string];
  onLength?: (mm: number) => void;
}

/** A pullback position slider with markers that snap to frames (every 0.25 mm) and to each other. */
export function PullbackMarkers({ fromMm, toMm, cursorMm, onCursor, defs, markers, onMark, lengthBetween, onLength }: PullbackMarkersProps) {
  const placed = Object.values(markers).filter((v): v is number => typeof v === "number");
  const [a, b] = lengthBetween ?? [defs[0]?.id, defs[1]?.id];
  const ma = a ? markers[a] : undefined;
  const mb = b ? markers[b] : undefined;
  const length = ma !== undefined && mb !== undefined ? Math.abs(mb - ma) : null;
  const span = Math.max(1e-6, toMm - fromMm);
  return (
    <div className="space-y-2 text-[12.5px]">
      <div className="flex items-center gap-2">
        <span className="text-ink-faint whitespace-nowrap">Position</span>
        <input
          type="range"
          min={fromMm}
          max={toMm}
          step={0.25}
          value={cursorMm}
          aria-label="Pullback position (mm)"
          onChange={(e) => onCursor(snapMm(Number(e.target.value), placed, 0))}
          className="w-full accent-[#4F8EF7]"
        />
        <span className="metric text-ink w-16 text-right">{cursorMm.toFixed(2)} mm</span>
      </div>
      <div className="relative h-4 rounded bg-base-900 border border-line" aria-hidden>
        {defs.map((d) => {
          const v = markers[d.id];
          if (v === undefined) return null;
          return <span key={d.id} className="absolute top-0 h-full w-0.5 bg-accent" style={{ left: `${(100 * (v - fromMm)) / span}%` }} title={d.label} />;
        })}
        <span className="absolute top-0 h-full w-0.5 bg-ink" style={{ left: `${(100 * (cursorMm - fromMm)) / span}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {defs.map((d) => (
          <button key={d.id} type="button" className="btn h-7 px-2 text-[12px]" onClick={() => onMark(d.id, snapMm(cursorMm, placed.filter((p) => p !== markers[d.id])))}>
            {d.label}
            {markers[d.id] !== undefined ? ` · ${markers[d.id]!.toFixed(2)}` : ""}
          </button>
        ))}
      </div>
      {length !== null && (
        <div className="flex items-center gap-2">
          <span className="text-ink-soft">Length between the markers:</span>
          <span className="metric text-ink">{length.toFixed(2)} mm</span>
          {onLength && (
            <button type="button" className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => onLength(length)}>
              Use as the stent length
            </button>
          )}
        </div>
      )}
    </div>
  );
}
