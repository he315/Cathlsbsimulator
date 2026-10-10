// ---------------------------------------------------------------------------
// Longitudinal (L-mode) view of a pullback, shared by the IVUS and OCT bench and
// the PCI lab's imaging console (pci-bench-imaging-unify). It is built from the
// same frames as the cross-section (src/simulation/pci/ivus.ts), sampled along
// the pullback: the lumen and the EEM as a cut through the frames, calcium as
// a bright leading border (IVUS) or a measurable band (OCT), the stent's struts,
// and the cursor of the frame on show. Proximal is on the left.
//
// pci-bench-stent-platforms-sizing: a planned stent may carry its delivery
// balloon's marker bands, drawn apart from the planned stent edges, and the view
// may shade stretches with no measurable coronary lumen (the aorta proximal to an
// ostium, blood an OCT flush did not clear). Both are optional, so the PCI lab's
// console is unchanged.
// ---------------------------------------------------------------------------

import { useId } from "react";
import { ivusFrame, type IvusContext, type IvusFrame } from "../../simulation/pci/ivus";

/** One column of the longitudinal view, from one frame. */
export interface LongitudinalSample {
  mm: number;
  /** equivalent radii of the lumen and the EEM areas (mm) */
  lumenR: number;
  eemR: number;
  /** stent radius when the frame is stented */
  stentR: number | null;
  calcium: boolean;
  /** OCT: the calcium's thickness where it is measurable */
  calciumMm: number | null;
}

/** The longitudinal samples of a pullback from `fromMm` to `toMm`, from the frame generator. */
export function longitudinalSamples(ctx: IvusContext, fromMm: number, toMm: number, n = 120): LongitudinalSample[] {
  const out: LongitudinalSample[] = [];
  for (let i = 0; i <= n; i++) {
    const mm = fromMm + ((toMm - fromMm) * i) / n;
    out.push(sampleOf(ivusFrame(ctx, mm, 36)));
  }
  return out;
}

/** A frame as one longitudinal column. */
export function sampleOf(f: IvusFrame): LongitudinalSample {
  return {
    mm: f.mm,
    lumenR: Math.sqrt(f.areas.lumen / Math.PI),
    eemR: Math.sqrt(f.areas.eem / Math.PI),
    stentR: f.areas.stent !== null ? Math.sqrt(f.areas.stent / Math.PI) : null,
    calcium: !!f.calcium,
    calciumMm: f.calcium?.thicknessMm ?? null,
  };
}

export interface LongitudinalViewProps {
  samples: readonly LongitudinalSample[];
  modality: "IVUS" | "OCT";
  /** the frame on show (mm) */
  cursorMm: number;
  onCursor?: (mm: number) => void;
  /** planned stent extent, drawn as an outline before it is deployed, with its marker bands when given (mm) */
  planned?: { fromMm: number; toMm: number; diameterMm: number; markers?: readonly (readonly [number, number])[] } | null;
  /** stretches with no measurable coronary lumen: the aorta, or blood an OCT flush did not clear */
  regions?: readonly { fromMm: number; toMm: number; kind: "aorta" | "uncleared" }[];
  className?: string;
}

const REGION_LABEL = { aorta: "aorta", uncleared: "not cleared" } as const;

export default function LongitudinalView({ samples, modality, cursorMm, onCursor, planned, regions, className = "" }: LongitudinalViewProps) {
  const uid = useId().replace(/:/g, "");
  const W = 760,
    H = 164,
    pad = 30,
    cy = 70;
  const from = samples[0]?.mm ?? 0;
  const to = samples[samples.length - 1]?.mm ?? 1;
  const span = Math.max(1e-6, to - from);
  const sx = (mm: number) => pad + ((W - 2 * pad) * (mm - from)) / span;
  const maxR = Math.max(2.5, ...samples.map((s) => s.eemR)) + 0.5;
  const sy = (r: number) => (r / maxR) * 58;
  const ivus = modality === "IVUS";
  const band = (r: (s: LongitudinalSample) => number) =>
    samples.map((s) => `${sx(s.mm).toFixed(1)},${(cy - sy(r(s))).toFixed(1)}`).join(" ") +
    " " +
    [...samples]
      .reverse()
      .map((s) => `${sx(s.mm).toFixed(1)},${(cy + sy(r(s))).toFixed(1)}`)
      .join(" ");
  const step = samples.length > 1 ? sx(samples[1].mm) - sx(samples[0].mm) : 4;
  const ticks: number[] = [];
  for (let m = Math.ceil(from / 10) * 10; m <= to; m += 10) ticks.push(m);
  const pick = (clientX: number, el: SVGSVGElement) => {
    if (!onCursor) return;
    const r = el.getBoundingClientRect();
    const mm = from + ((((clientX - r.left) / r.width) * W - pad) / (W - 2 * pad)) * span;
    onCursor(Math.max(from, Math.min(to, mm)));
  };
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${modality} longitudinal view, ${from.toFixed(0)} to ${to.toFixed(0)} mm, frame at ${cursorMm.toFixed(1)} mm`}
        className={`w-full ${onCursor ? "cursor-crosshair" : ""}`}
        onClick={(e) => pick(e.clientX, e.currentTarget)}
      >
        <defs>
          <filter id={`lspk-${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.25" numOctaves={2} seed={7} />
            <feColorMatrix type="saturate" values="0" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>
        <rect x={pad} y={cy - 62} width={W - 2 * pad} height={124} fill={ivus ? "#0b0b0b" : "#060403"} />
        <polygon points={band((s) => s.eemR + 0.35)} fill={ivus ? "#4a4a4a" : "#4a3322"} filter={`url(#lspk-${uid})`} />
        <polygon points={band((s) => s.eemR)} fill={ivus ? "#8a8a8a" : "#b98d60"} filter={`url(#lspk-${uid})`} />
        <polygon points={band((s) => s.lumenR)} fill={ivus ? "#161616" : "#040302"} />
        {/* calcium: a bright leading border, with its shadow on IVUS or its thickness on OCT */}
        {samples.map((s, i) =>
          s.calcium ? (
            <g key={`ca${i}`}>
              {ivus ? (
                <>
                  <rect x={sx(s.mm) - step / 2} y={cy - 62} width={step + 0.5} height={62 - sy(s.lumenR) - 1} fill="#050505" />
                  <rect x={sx(s.mm) - step / 2} y={cy - sy(s.lumenR) - 3} width={step + 0.5} height={2.5} fill="#f2f2f2" />
                </>
              ) : (
                <rect x={sx(s.mm) - step / 2} y={cy - sy(s.lumenR + 0.1 + (s.calciumMm ?? 0.3))} width={step + 0.5} height={sy(s.calciumMm ?? 0.3)} fill="#2c1f16" stroke="#f0d7b6" strokeWidth={0.4} />
              )}
            </g>
          ) : null
        )}
        {/* stent struts */}
        {samples.map((s, i) =>
          s.stentR !== null && i % 2 === 0 ? (
            <g key={`st${i}`}>
              <rect x={sx(s.mm) - 1} y={cy - sy(s.stentR) - 1} width={2} height={2} fill="#fff" />
              <rect x={sx(s.mm) - 1} y={cy + sy(s.stentR) - 1} width={2} height={2} fill="#fff" />
            </g>
          ) : null
        )}
        {(regions ?? []).map((r, i) => (
          <g key={`rg${i}`} data-part={`region-${r.kind}`}>
            <rect x={sx(r.fromMm)} y={cy - 62} width={Math.max(1, sx(r.toMm) - sx(r.fromMm))} height={124} fill={r.kind === "aorta" ? "#000" : ivus ? "#2a2a2a" : "#3a1f17"} opacity={0.72} />
            <text x={sx(r.fromMm) + 3} y={cy - 46} fontSize={15} fill="#A6ADB8">
              {REGION_LABEL[r.kind]}
            </text>
          </g>
        ))}
        {planned?.markers?.map(([a, b], i) => (
          <rect key={`mk${i}`} data-part="planned-marker" x={sx(a)} y={cy - sy(planned.diameterMm / 2) - 6} width={Math.max(2, sx(b) - sx(a))} height={sy(planned.diameterMm / 2) * 2 + 12} fill="#ECEEF1" opacity={0.85} />
        ))}
        {planned && (
          <rect
            x={sx(planned.fromMm)}
            y={cy - sy(planned.diameterMm / 2) - 1}
            width={Math.max(1, sx(planned.toMm) - sx(planned.fromMm))}
            height={sy(planned.diameterMm / 2) * 2 + 2}
            fill="none"
            stroke="#4F8EF7"
            strokeDasharray="5 3"
          />
        )}
        {/* the frame on show: the warn token of the design system */}
        <line x1={sx(cursorMm)} y1={4} x2={sx(cursorMm)} y2={H - 26} stroke="#E9B95A" strokeWidth={1.5} />
        <text x={sx(from)} y={H - 6} fontSize={15} fill="#858D99">
          proximal
        </text>
        <text x={sx(to)} y={H - 6} fontSize={15} fill="#858D99" textAnchor="end">
          distal
        </text>
        {ticks
          .filter((m) => m > from + 6 && m < to - 6)
          .map((m) => (
            <text key={m} x={sx(m)} y={H - 6} fontSize={15} fill="#858D99" textAnchor="middle">
              {m} mm
            </text>
          ))}
      </svg>
      {onCursor && (
        <input
          type="range"
          aria-label="Frame position along the pullback"
          min={from}
          max={to}
          step={0.25}
          value={cursorMm}
          onChange={(e) => onCursor(Number(e.target.value))}
          className="w-full"
        />
      )}
    </div>
  );
}
