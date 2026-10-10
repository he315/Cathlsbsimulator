// ---------------------------------------------------------------------------
// The bifurcation bench's imaging (pci-bench-bifurcation): a longitudinal view
// of the main vessel, the side branch and the carina with the stents drawn as
// struts (the SB stent's protrusion, a crushed segment, the double layer of a
// culotte, the TAP neocarina, a distal dissection), and a cross-section at one
// of four places: the proximal MV at the carina (oval shape, apposition, layers),
// the SB ostium seen from the MV (the struts across it), the distal MV (stretch)
// and the SB. Both are drawn from the bench state (src/simulation/bench/
// bifurcation.ts); the strut layout is a simplified teaching geometry, and the
// view says so. IVUS and OCT differ in how they draw the wall and the struts
// (OCT struts cast shadows; IVUS shows speckle), not in what they show.
// ---------------------------------------------------------------------------

import { useId, useMemo } from "react";
import { bifMetrics, geometryOf, type BifState } from "../../simulation/bench/bifurcation";
import type { Modality } from "../../simulation/imaging/types";

export type BifSection = "proximal" | "ostium" | "distal" | "sb";
export const BIF_SECTIONS: readonly { id: BifSection; label: string }[] = [
  { id: "proximal", label: "Proximal MV at the carina" },
  { id: "ostium", label: "SB ostium, from the MV" },
  { id: "distal", label: "Distal MV" },
  { id: "sb", label: "Side branch" },
];

export interface BifurcationViewProps {
  state: BifState;
  modality: Modality;
  section: BifSection;
  onSection?: (s: BifSection) => void;
  /** show the measured read-outs (guided mode, or once the technique is finished) */
  showReadouts: boolean;
  className?: string;
}

/** Deterministic speckle points for the IVUS background. */
function speckle(n: number, seed: number, w: number, h: number): [number, number, number][] {
  let x = seed >>> 0;
  const rnd = () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) out.push([rnd() * w, rnd() * h, 0.15 + 0.5 * rnd()]);
  return out;
}

/** A zig-zag strut line from (x0, y) to (x1, y) with peaks of height a. */
function zigzag(x0: number, x1: number, y: number, a: number, pitch = 7): string {
  const pts: string[] = [];
  const n = Math.max(1, Math.round(Math.abs(x1 - x0) / pitch));
  for (let i = 0; i <= n; i++) pts.push(`${(x0 + ((x1 - x0) * i) / n).toFixed(1)},${(y + (i % 2 ? a : -a)).toFixed(1)}`);
  return pts.join(" ");
}

export default function BifurcationView({ state, modality, section, onSection, showReadouts, className = "" }: BifurcationViewProps) {
  const uid = useId().replace(/:/g, "");
  const g = geometryOf(state);
  const m = bifMetrics(state);
  const oct = modality === "OCT";

  // --- longitudinal geometry (px) ------------------------------------------------------------
  const W = 760,
    H = 300,
    pad = 30,
    cy = 205;
  const k = (W - 2 * pad) / (g.proxLenMm + g.distLenMm);
  const xc = pad + g.proxLenMm * k;
  const rP = (g.proxRefMm / 2) * k;
  const rD = (g.distRefMm / 2) * k;
  const rS = (g.sbRefMm / 2) * k;
  const th = (g.angleDeg * Math.PI) / 180;
  const ostW = (g.sbRefMm / Math.sin(th)) * k;
  // SB axis from the middle of its ostium on the upper wall, up and distally at the branch angle
  const sbO = { x: xc - ostW / 2, y: cy - rD };
  const dir = { x: Math.cos(th), y: -Math.sin(th) };
  const nrm = { x: Math.sin(th), y: Math.cos(th) };
  const sbLen = g.sbLenMm * k;
  const at = (s: number, off: number) => ({ x: sbO.x + dir.x * s + nrm.x * off, y: sbO.y + dir.y * s + nrm.y * off });
  const sbA = at(0, -rS),
    sbB = at(sbLen, -rS),
    sbC = at(sbLen, rS),
    sbD = at(0, rS);
  const taper = 2 * k;
  const mvTop = `M${pad},${cy - rP} L${xc - ostW - taper},${cy - rP} L${xc - ostW},${cy - rD}`;
  const mvBottom = `M${pad},${cy + rP} L${xc - taper},${cy + rP} L${xc + taper},${cy + rD} L${W - pad},${cy + rD}`;
  const lumen = `M${pad},${cy - rP} L${xc - ostW - taper},${cy - rP} L${xc - ostW},${cy - rD} L${sbD.x},${sbD.y} L${sbC.x},${sbC.y} L${sbB.x},${sbB.y} L${sbA.x},${sbA.y} L${xc},${cy - rD} L${W - pad},${cy - rD} L${W - pad},${cy + rD} L${xc + taper},${cy + rD} L${xc - taper},${cy + rP} L${pad},${cy + rP} Z`;

  const strut = oct ? "#f2f4f6" : "#e8eaee";
  const wallStroke = oct ? "#b9a68a" : "#8e939c";
  const bg = "#07080a";
  const lumenFill = oct ? "#0b0c0e" : "#1a1c20";

  const mv = state.mvStent?.deployed ? state.mvStent : null;
  const sb = state.sbStent;
  const mvFrom = mv ? xc - mv.proxMm * k : 0;
  const mvTo = mv ? Math.min(W - pad, mvFrom + mv.lengthMm * k) : 0;
  const proxStentR = Math.max(0, (m.proxStentMm || 0) / 2) * k;
  const distStentR = mv ? (Math.max(mv.nominalMm, state.distalMaxD || 0) / 2) * k : 0;
  const dissected = state.findings.some((f) => f.kind === "distal-dissection");
  const sbEdge = state.findings.some((f) => f.kind === "sb-edge-dissection");
  const culotte = state.technique === "culotte" || state.firstBranch !== null;

  // struts across the SB ostium: one bar per tenth of the metal coverage
  const bars = Math.round((state.sbCoverage || 0) * 10);
  const ostiumBars = Array.from({ length: bars }, (_, i) => sbO.x - ostW / 2 + ((i + 0.5) * ostW) / Math.max(1, bars));

  // section cursors (mm from the carina)
  const cursors: { id: BifSection; x: number; y: number }[] = [
    { id: "proximal", x: xc - ostW - 3 * k, y: cy },
    { id: "ostium", x: sbO.x, y: sbO.y - 6 },
    { id: "distal", x: xc + 5 * k, y: cy },
    { id: "sb", x: at(g.sbLenMm * 0.55 * k, 0).x, y: at(g.sbLenMm * 0.55 * k, 0).y },
  ];

  const pts = useMemo(() => speckle(oct ? 0 : 900, 7 + g.id.length, W, H), [oct, g.id]);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-md" role="img" aria-label={`Longitudinal ${modality} view of the bifurcation`}>
        <defs>
          <clipPath id={`${uid}-lumen`}>
            <path d={lumen} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill={bg} />
        {pts.map(([x, y, o], i) => (
          <circle key={i} cx={x} cy={y} r={0.9} fill="#9aa0a8" opacity={o * 0.35} />
        ))}
        <path d={lumen} fill={lumenFill} />
        <path d={mvTop} fill="none" stroke={wallStroke} strokeWidth={oct ? 2.4 : 3} />
        <path d={mvBottom} fill="none" stroke={wallStroke} strokeWidth={oct ? 2.4 : 3} />
        <line x1={sbD.x} y1={sbD.y} x2={sbC.x} y2={sbC.y} stroke={wallStroke} strokeWidth={oct ? 2.4 : 3} />
        <line x1={xc} y1={cy - rD} x2={sbB.x} y2={sbB.y} stroke={wallStroke} strokeWidth={oct ? 2.4 : 3} />
        <line x1={xc - ostW} y1={cy - rD} x2={sbA.x} y2={sbA.y} stroke={wallStroke} strokeWidth={oct ? 2.4 : 3} />

        <g clipPath={`url(#${uid}-lumen)`}>
          {/* MV stent: proximal part at the POT / kiss diameter, distal part at its own */}
          {mv && (
            <g stroke={strut} strokeWidth={1.3} fill="none">
              <polyline points={zigzag(mvFrom, xc - ostW, cy - proxStentR + 2, 2.5)} />
              <polyline points={zigzag(mvFrom, xc - taper, cy + proxStentR - 2, 2.5)} />
              <polyline points={zigzag(xc, mvTo, cy - distStentR + 2, 2.5)} />
              <polyline points={zigzag(xc + taper, mvTo, cy + distStentR - 2, 2.5)} />
            </g>
          )}
          {/* the struts across the SB ostium */}
          {(mv || sb?.deployed) &&
            ostiumBars.map((x, i) => <line key={i} x1={x - 3} y1={cy - rD - 1} x2={x + 3} y2={cy - rD + 5} stroke={strut} strokeWidth={1.6} />)}
          {/* SB stent: along the branch and back into the MV by its protrusion; flattened when crushed */}
          {sb?.deployed && (
            <g stroke={strut} strokeWidth={1.3} fill="none">
              {(() => {
                const s1 = at(Math.min(sbLen, sb.lengthMm * k), -rS + 2);
                const s0 = at(0, -rS + 2);
                const t1 = at(Math.min(sbLen, sb.lengthMm * k), rS - 2);
                const t0 = at(0, rS - 2);
                return (
                  <>
                    <line x1={s0.x} y1={s0.y} x2={s1.x} y2={s1.y} strokeDasharray="3 3" />
                    <line x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} strokeDasharray="3 3" />
                  </>
                );
              })()}
              {sb.proxMm > 0 && !sb.crushed && culotte && <polyline points={zigzag(xc - ostW - sb.proxMm * k, xc - ostW, cy - rP + 6, 2.2)} />}
              {sb.proxMm > 0 && !sb.crushed && !culotte && (
                // the protruding segment stands in the MV lumen; in TAP it is the neocarina
                <polygon points={`${xc - ostW},${cy - rD} ${xc - ostW + 2},${cy - rD + sb.proxMm * k} ${xc - ostW + 6},${cy - rD + sb.proxMm * k} ${xc - ostW / 3},${cy - rD}`} fill={strut} fillOpacity={0.35} stroke={strut} />
              )}
              {sb.crushed && <polyline points={zigzag(xc - ostW - state.crushedMm * k, xc, cy - rP + 4, 1.1, 4)} strokeWidth={2} />}
            </g>
          )}
          {/* culotte double layer */}
          {state.doubleLayerMm > 0 && culotte && <rect x={xc - ostW - state.doubleLayerMm * k} y={cy - proxStentR} width={state.doubleLayerMm * k} height={2 * proxStentR} fill={strut} opacity={0.08} />}
          {/* dissections */}
          {dissected && mv && <polyline points={zigzag(mvTo - 4, mvTo + 22, cy + rD - 6, 3, 5)} stroke="#d6dbe1" strokeWidth={1.2} fill="none" />}
        </g>
        {sbEdge && sb && (() => {
          const e = at(Math.min(sbLen, sb.lengthMm * k) + 2, 0);
          return <polyline points={`${e.x - 8},${e.y + 3} ${e.x - 2},${e.y - 4} ${e.x + 4},${e.y + 2} ${e.x + 10},${e.y - 3}`} stroke="#d6dbe1" strokeWidth={1.2} fill="none" />;
        })()}

        {/* carina and section cursors */}
        <circle cx={xc} cy={cy - rD} r={2.5} className="fill-accent" />
        {cursors.map((c) => (
          <g key={c.id} onClick={() => onSection?.(c.id)} style={{ cursor: onSection ? "pointer" : undefined }} role="button" aria-label={BIF_SECTIONS.find((s) => s.id === c.id)!.label}>
            <circle cx={c.x} cy={c.y} r={9} className={section === c.id ? "fill-accent stroke-accent" : "fill-transparent stroke-ink-faint"} fillOpacity={0.25} strokeWidth={1.2} />
            <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={11} className="fill-ink font-mono">
              {c.id === "proximal" ? "A" : c.id === "ostium" ? "B" : c.id === "distal" ? "C" : "D"}
            </text>
          </g>
        ))}
        {/* the caption sits below the vessel, clear of the side branch at every preset's angle */}
        <text x={pad} y={H - 12} fontSize={12} className="fill-ink-soft font-sans">
          {g.mvName}: proximal on the left · {g.sbName} above · carina marked
        </text>
      </svg>

      <div className="grid sm:grid-cols-[260px_1fr] gap-3 mt-3 items-start">
        <CrossSection uid={uid} state={state} section={section} oct={oct} />
        <div className="space-y-1.5 text-[13px]">
          <div className="seg" role="tablist" aria-label="Cross-section">
            {BIF_SECTIONS.map((s, i) => (
              <button key={s.id} type="button" role="tab" aria-selected={section === s.id} className={`seg-btn ${section === s.id ? "seg-btn-active" : ""}`} onClick={() => onSection?.(s.id)}>
                {"ABCD"[i]}
              </button>
            ))}
          </div>
          <div className="text-ink-soft">{BIF_SECTIONS.find((s) => s.id === section)!.label}</div>
          {showReadouts ? (
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 mt-2 font-mono text-[12.5px]">
              <dt className="text-ink-soft font-sans">SB ostium covered by metal</dt>
              <dd className="text-ink">{m.sbOstiumMetalPct}%</dd>
              <dt className="text-ink-soft font-sans">Oval index, proximal stent</dt>
              <dd className="text-ink">{m.proxStentMm ? m.ovalIndex.toFixed(2) : "–"}</dd>
              <dt className="text-ink-soft font-sans">Proximal stent diameter</dt>
              <dd className="text-ink">{m.proxStentMm ? `${m.proxStentMm.toFixed(2)} mm` : "–"}</dd>
              <dt className="text-ink-soft font-sans">Proximal strut-to-wall gap</dt>
              <dd className="text-ink">{m.proxStentMm ? `${m.proxMalappositionMm.toFixed(2)} mm` : "–"}</dd>
              <dt className="text-ink-soft font-sans">Distal MV stretch</dt>
              <dd className="text-ink">{m.distalStretchPct ? `${m.distalStretchPct}% of reference` : "–"}</dd>
              <dt className="text-ink-soft font-sans">Neocarina</dt>
              <dd className="text-ink">{m.neocarinaMm ? `${m.neocarinaMm.toFixed(1)} mm` : "none"}</dd>
              <dt className="text-ink-soft font-sans">Double layer</dt>
              <dd className="text-ink">{m.doubleLayerMm ? `${m.doubleLayerMm.toFixed(1)} mm` : "none"}</dd>
            </dl>
          ) : (
            <p className="text-ink-faint text-[12.5px] mt-2">Read the images; the measured values are given at the final assessment.</p>
          )}
          <p className="text-ink-faint text-[12px] mt-2">Teaching geometry: struts, layers and the oval shape are simplified.</p>
        </div>
      </div>
    </div>
  );
}

/** One cross-section, 260 px square. */
function CrossSection({ uid, state, section, oct }: { uid: string; state: BifState; section: BifSection; oct: boolean }) {
  const g = geometryOf(state);
  const m = bifMetrics(state);
  const S = 260,
    c = S / 2;
  const scale = 26; // px per mm
  const wall = oct ? "#b9a68a" : "#7d838c";
  const strut = "#f2f4f6";
  const shadow = "#000000";
  const ring = (rx: number, ry: number, n: number, gap = 0, key = "r", offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n + offset;
      const x = c + Math.cos(a) * (rx - gap),
        y = c + Math.sin(a) * (ry - gap);
      return (
        <g key={`${key}${i}`}>
          {oct && <line x1={x} y1={y} x2={c + Math.cos(a) * (rx + 26)} y2={c + Math.sin(a) * (ry + 26)} stroke={shadow} strokeWidth={4} opacity={0.8} />}
          <rect x={x - 2.4} y={y - 1.2} width={4.8} height={2.4} fill={strut} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />
        </g>
      );
    });
  let body: JSX.Element;
  if (section === "proximal") {
    const R = (g.proxRefMm / 2) * scale;
    const d = m.proxStentMm;
    const sq = Math.sqrt(m.ovalIndex || 1);
    const rx = (d / 2) * scale * sq,
      ry = (d / 2) * scale / sq;
    const layered = state.doubleLayerMm > 0;
    body = (
      <>
        <ellipse cx={c} cy={c} rx={R + 16} ry={R + 16} fill="none" stroke={wall} strokeWidth={14} opacity={0.55} />
        <ellipse cx={c} cy={c} rx={R} ry={R} fill="#050506" stroke={wall} strokeWidth={2} />
        {d > 0 && ring(rx, ry, 14, 0, "a")}
        {d > 0 && layered && ring(rx, ry, 14, 6, "b", 0.2)}
        {d > 0 && state.sbStent?.crushed && Array.from({ length: 5 }, (_, i) => <rect key={`cr${i}`} x={c - 20 + i * 9} y={c - ry + 3} width={5} height={2.4} fill={strut} />)}
      </>
    );
  } else if (section === "ostium") {
    const R = (g.sbRefMm / 2) * scale;
    const bars = Math.round((state.sbCoverage || 0) * 10);
    body = (
      <>
        <circle cx={c} cy={c} r={R + 20} fill="#1a1b1e" />
        <circle cx={c} cy={c} r={R} fill="#050506" stroke={wall} strokeWidth={2} />
        <clipPath id={`${uid}-ostium`}>
          <circle cx={c} cy={c} r={R} />
        </clipPath>
        <g clipPath={`url(#${uid}-ostium)`}>
          {Array.from({ length: bars }, (_, i) => {
            const x = c - R + ((i + 0.5) * 2 * R) / Math.max(1, bars);
            return <polyline key={i} points={zigzag(c - R, c + R, x, 5, 9).split(" ").map((p) => p.split(",").reverse().join(",")).join(" ")} stroke={strut} strokeWidth={2} fill="none" />;
          })}
        </g>
      </>
    );
  } else if (section === "distal") {
    const R = (g.distRefMm / 2) * scale;
    const mv = state.mvStent?.deployed ? state.mvStent : null;
    const d = mv ? Math.max(mv.nominalMm, state.distalMaxD) : 0;
    const dissected = state.findings.some((f) => f.kind === "distal-dissection");
    body = (
      <>
        <circle cx={c} cy={c} r={Math.max(R, (d / 2) * scale) + 16} fill="none" stroke={wall} strokeWidth={14} opacity={0.55} />
        <circle cx={c} cy={c} r={Math.max(R, (d / 2) * scale)} fill="#050506" stroke={wall} strokeWidth={2} />
        {d > 0 && ring((d / 2) * scale, (d / 2) * scale, 12, 0, "d")}
        {dissected && <path d={`M${c + R - 4},${c - 18} q 22,10 6,30`} stroke="#d6dbe1" strokeWidth={2} fill="none" />}
      </>
    );
  } else {
    const R = (g.sbRefMm / 2) * scale;
    const sb = state.sbStent?.deployed ? state.sbStent : null;
    body = (
      <>
        <circle cx={c} cy={c} r={R + 16} fill="none" stroke={wall} strokeWidth={14} opacity={0.55} />
        <circle cx={c} cy={c} r={R} fill="#050506" stroke={wall} strokeWidth={2} />
        {sb && ring((sb.nominalMm / 2) * scale, (sb.nominalMm / 2) * scale, 10, 0, "s")}
      </>
    );
  }
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[260px] h-auto rounded-md" role="img" aria-label="Cross-section">
      <rect x={0} y={0} width={S} height={S} fill="#07080a" />
      {body}
      <text x={10} y={S - 10} fontSize={11} className="fill-ink-faint font-mono">
        1 mm
      </text>
      <line x1={50} y1={S - 14} x2={50 + scale} y2={S - 14} className="stroke-ink-faint" strokeWidth={2} />
    </svg>
  );
}
