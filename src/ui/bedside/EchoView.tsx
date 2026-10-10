import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Haemo, Pockets, SalineResult, EchoWindow } from "../../simulation/pericardiocentesis";

// ---------------------------------------------------------------------------
// Schematic transthoracic echo for tamponade teaching. Four views:
// subcostal four-chamber, apical four-chamber, parasternal long axis and the
// IVC. The effusion is drawn to scale from the pocket depth at each window;
// the walls move with the cardiac cycle and show RA systolic collapse, RV
// diastolic collapse, a swinging heart and a plethoric IVC when present. The
// needle, agitated-saline bubbles and a loculated posterior collection are
// overlaid. The component animates itself from a phase ref (no parent churn).
// ---------------------------------------------------------------------------

export type EchoViewId = "subcostal" | "apical" | "plax" | "ivc";

export const VIEW_FOR_WINDOW: Record<EchoWindow, EchoViewId> = {
  subxiphoid: "subcostal",
  apical: "apical",
  parasternal: "plax",
};

export interface EchoClock {
  /** cardiac phase 0..1 (0 = QRS) */
  phase: number;
  /** beat counter */
  beat: number;
  /** inspiration 0..1 */
  insp: number;
}

export interface NeedleOverlay {
  window: EchoWindow;
  /** mm beyond the parietal pericardium (negative = still outside) */
  beyondPericardium: number;
}

const MM = 2.0; // px per mm

export default function EchoView({
  view,
  clockRef,
  haemo,
  pockets,
  regional,
  extras,
  saline,
  needle,
}: {
  view: EchoViewId;
  clockRef: MutableRefObject<EchoClock>;
  haemo: Haemo;
  pockets: Pockets;
  regional: boolean;
  extras: string[];
  saline: { result: SalineResult; at: number } | null;
  needle: NeedleOverlay | null;
}) {
  const [clk, setClk] = useState<EchoClock>({ phase: 0, beat: 0, insp: 0 });
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 40) {
        last = now;
        setClk({ ...clockRef.current });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [clockRef]);

  const ph = clk.phase;
  const systole = ph < 0.35 ? Math.sin((Math.PI * ph) / 0.35) : 0; // ventricular contraction 0..1
  const diastole = ph >= 0.35 && ph < 0.95 ? Math.sin((Math.PI * (ph - 0.35)) / 0.6) : 0;
  const atrialRelax = ph < 0.3 ? Math.sin((Math.PI * ph) / 0.3) : 0; // RA collapses in early ventricular systole
  const sev = haemo.severity;
  const swing = haemo.alternans ? (clk.beat % 2 === 0 ? 1 : -1) * 7 * systole : 0;
  const rvIndent = haemo.rvCollapse ? 12 * sev * diastole : 0;
  const raIndent = haemo.raCollapse ? 10 * Math.max(0.3, sev) * atrialRelax : 0;
  const bubblesAge = saline ? (performance.now() - saline.at) / 1000 : 99;
  const showBubbles = saline && bubblesAge < 6 && saline.result !== "none";

  return (
    <div className="relative">
      <svg viewBox="0 0 300 250" className="w-full block rounded-md border border-line bg-black">
        <defs>
          <clipPath id={`sector-${view}`}>
            <path d="M150 8 L 8 210 A 240 240 0 0 0 292 210 Z" />
          </clipPath>
          <filter id={`speckle-${view}`}>
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed={view.length * 7} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
          </filter>
          <filter id={`blur-${view}`}>
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <g clipPath={`url(#sector-${view})`}>
          <rect width="300" height="250" fill="#060606" />
          <g filter={`url(#blur-${view})`}>
            {view === "subcostal" && <Subcostal pockets={pockets} rvIndent={rvIndent} raIndent={raIndent} swing={swing} systole={systole} regional={regional} sev={sev} />}
            {view === "apical" && <Apical pockets={pockets} rvIndent={rvIndent} raIndent={raIndent} swing={swing} systole={systole} regional={regional} />}
            {view === "plax" && <Plax pockets={pockets} rvIndent={rvIndent} swing={swing} systole={systole} regional={regional} />}
            {view === "ivc" && <Ivc plethoric={haemo.plethoricIvc} insp={clk.insp} />}
          </g>
          {showBubbles && view !== "ivc" && <Bubbles view={view} result={saline!.result} pockets={pockets} t={bubblesAge} />}
          {needle && VIEW_FOR_WINDOW[needle.window] === view && <Needle view={view} pockets={pockets} beyond={needle.beyondPericardium} />}
          <rect width="300" height="250" filter={`url(#speckle-${view})`} opacity="0.22" />
        </g>
        <path d="M150 8 L 8 210 A 240 240 0 0 0 292 210 Z" fill="none" stroke="#1f2937" />
        <text x="8" y="16" fontSize="9" fill="#A6ADB8" fontFamily="ui-monospace, monospace">
          {view === "subcostal" ? "SUBCOSTAL 4C" : view === "apical" ? "APICAL 4C" : view === "plax" ? "PLAX" : "SUBCOSTAL IVC"}
        </text>
        <text x="292" y="16" fontSize="9" fill="#A6ADB8" textAnchor="end" fontFamily="ui-monospace, monospace">
          HR {haemo.hr}
        </text>
        <EcgTrace phase={ph} />
      </svg>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {view !== "ivc" && (
          <span className="chip">
            pocket {Math.round(view === "subcostal" ? pockets.subxiphoid : view === "apical" ? pockets.apical : pockets.parasternal)} mm
            {view === "plax" && ` · posterior ${Math.round(pockets.posterior)} mm`}
          </span>
        )}
        {haemo.raCollapse && view !== "ivc" && <span className="chip text-warn border-warn/40">RA systolic collapse</span>}
        {haemo.rvCollapse && view !== "ivc" && <span className="chip text-danger border-danger/40">RV diastolic collapse</span>}
        {haemo.alternans && view !== "ivc" && <span className="chip text-warn border-warn/40">swinging heart</span>}
        {haemo.leftHeartCompression && <span className="chip text-danger border-danger/40">LA / LV compression</span>}
        {view === "ivc" && (
          <span className={`chip ${haemo.plethoricIvc ? "text-danger border-danger/40" : ""}`}>
            {haemo.plethoricIvc ? "plethoric IVC, little respiratory collapse" : "IVC collapses with inspiration"}
          </span>
        )}
        {extras.map((e) => (
          <span key={e} className="chip">
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

function EcgTrace({ phase }: { phase: number }) {
  // tiny ECG with a moving cursor along the bottom of the echo frame
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const q = i / 60;
    const r = Math.exp(-(((q - 0.05) / 0.012) ** 2)) * 10 - Math.exp(-(((q - 0.08) / 0.01) ** 2)) * 3 + Math.exp(-(((q - 0.35) / 0.05) ** 2)) * 3;
    pts.push(`${100 + q * 100},${238 - r}`);
  }
  return (
    <g>
      <polyline points={pts.join(" ")} fill="none" stroke="#3ef2a4" strokeWidth={1} opacity={0.8} />
      <circle cx={100 + phase * 100} cy={238} r={1.8} fill="#eaf2ff" />
    </g>
  );
}

interface PartProps {
  pockets: Pockets;
  rvIndent: number;
  raIndent?: number;
  swing: number;
  systole: number;
  regional: boolean;
  sev?: number;
}

const wall = "#c9c9c9";
const tissue = "#5b5b5b";

function Subcostal({ pockets, rvIndent, raIndent = 0, swing, systole, regional }: PartProps) {
  // near field: liver; then effusion; then RV free wall; far field LV, atria
  const liverBottom = 62;
  const eff = pockets.subxiphoid * MM;
  const rvTop = liverBottom + eff;
  const post = pockets.posterior * MM;
  const s = systole;
  return (
    <g>
      <path d={`M0 20 L300 20 L300 ${liverBottom} Q150 ${liverBottom + 8} 0 ${liverBottom} Z`} fill={tissue} opacity={0.75} />
      <text x="60" y="44" fontSize="8" fill="#9ca3af">liver</text>
      {eff > 2 && <text x="200" y={liverBottom + eff / 2 + 3} fontSize="8" fill="#6b7280">effusion</text>}
      <g transform={`translate(${swing} 0)`}>
        {/* RV free wall with diastolic indentation */}
        <path
          d={`M40 ${rvTop + 10} Q150 ${rvTop - 4 + rvIndent * 1.6} 250 ${rvTop + 18}`}
          stroke={wall}
          strokeWidth={6}
          fill="none"
        />
        {/* RV cavity */}
        <path d={`M48 ${rvTop + 16} Q150 ${rvTop + 4 + rvIndent * 1.6} 244 ${rvTop + 24} L232 ${rvTop + 52 - s * 4} Q150 ${rvTop + 40} 60 ${rvTop + 48} Z`} fill="#050505" />
        {/* septum */}
        <path d={`M60 ${rvTop + 50} Q150 ${rvTop + 42 - s * 3} 236 ${rvTop + 56}`} stroke={wall} strokeWidth={7} fill="none" />
        {/* LV cavity and lateral wall */}
        <path d={`M66 ${rvTop + 60} Q150 ${rvTop + 52} 232 ${rvTop + 64} L222 ${rvTop + 100 - s * 10} Q150 ${rvTop + 106 - s * 8} 78 ${rvTop + 98} Z`} fill="#050505" />
        <path d={`M76 ${rvTop + 104 - s * 4} Q150 ${rvTop + 114 - s * 10} 224 ${rvTop + 106 - s * 8}`} stroke={wall} strokeWidth={8} fill="none" />
        {/* RA (image left, far) and LA */}
        <path d={`M22 ${rvTop + 36} Q${30 + raIndent * 2} ${rvTop + 60} 24 ${rvTop + 86}`} stroke={wall} strokeWidth={4} fill="none" />
        <text x="30" y={rvTop + 66} fontSize="8" fill="#9ca3af">RA</text>
        <text x="140" y={rvTop + 30} fontSize="8" fill="#9ca3af">RV</text>
        <text x="140" y={rvTop + 84} fontSize="8" fill="#9ca3af">LV</text>
        {/* posterior pericardium and any posterior fluid */}
        <path d={`M70 ${rvTop + 122} Q150 ${rvTop + 130} 228 ${rvTop + 120}`} stroke={wall} strokeWidth={3} fill="none" opacity={0.8} />
        {regional && (
          <path d={`M80 ${rvTop + 112} Q150 ${rvTop + 118 + post * 0.6} 222 ${rvTop + 110} L222 ${rvTop + 130 + post * 0.4} Q150 ${rvTop + 134 + post} 80 ${rvTop + 128} Z`} fill="#7a7a7a" opacity={0.7} />
        )}
      </g>
    </g>
  );
}

function Apical({ pockets, rvIndent, raIndent = 0, swing, systole, regional }: PartProps) {
  const eff = pockets.apical * MM;
  const apexY = 30 + eff;
  const s = systole;
  return (
    <g>
      <rect x="0" y="0" width="300" height="30" fill={tissue} opacity={0.5} />
      {eff > 2 && <text x="190" y={30 + eff / 2 + 3} fontSize="8" fill="#6b7280">effusion</text>}
      <g transform={`translate(${swing} 0)`}>
        {/* epicardial outline around apex */}
        <path d={`M150 ${apexY} Q80 ${apexY + 40} 70 ${apexY + 150} L230 ${apexY + 150} Q220 ${apexY + 40} 150 ${apexY}`} stroke={wall} strokeWidth={6} fill="#050505" />
        {/* septum */}
        <path d={`M150 ${apexY + 12} L${148} ${apexY + 120}`} stroke={wall} strokeWidth={7} />
        {/* RV (image left) indentation of free wall in diastole */}
        <path d={`M150 ${apexY + 6} Q${92 + rvIndent * 1.5} ${apexY + 50} ${84 + rvIndent} ${apexY + 120}`} stroke={wall} strokeWidth={5} fill="none" />
        {/* LV (image right) */}
        <path d={`M152 ${apexY + 8} Q${214 - s * 8} ${apexY + 46} ${214 - s * 6} ${apexY + 120}`} stroke={wall} strokeWidth={8} fill="none" />
        {/* AV plane */}
        <path d={`M76 ${apexY + 124} L224 ${apexY + 124}`} stroke={wall} strokeWidth={3} opacity={0.6} />
        {/* atria */}
        <path d={`M78 ${apexY + 128} Q${84 + raIndent * 2} ${apexY + 150} 98 ${apexY + 178}`} stroke={wall} strokeWidth={4} fill="none" />
        <path d={`M222 ${apexY + 128} Q216 ${apexY + 152} 204 ${apexY + 178}`} stroke={wall} strokeWidth={4} fill="none" />
        <path d={`M150 ${apexY + 126} L150 ${apexY + 178}`} stroke={wall} strokeWidth={3} />
        <text x="104" y={apexY + 80} fontSize="8" fill="#9ca3af">RV</text>
        <text x="182" y={apexY + 80} fontSize="8" fill="#9ca3af">LV</text>
        <text x="106" y={apexY + 160} fontSize="8" fill="#9ca3af">RA</text>
        <text x="180" y={apexY + 160} fontSize="8" fill="#9ca3af">LA</text>
        {regional && <path d={`M154 ${apexY + 180} Q200 ${apexY + 200} 236 ${apexY + 170} L236 ${apexY + 196} Q200 ${apexY + 222} 154 ${apexY + 200} Z`} fill="#7a7a7a" opacity={0.7} />}
      </g>
    </g>
  );
}

function Plax({ pockets, rvIndent, swing, systole, regional }: PartProps) {
  const ant = pockets.parasternal * MM;
  const post = Math.min(60, pockets.posterior * MM);
  const top = 34 + ant;
  const s = systole;
  return (
    <g>
      <rect x="0" y="0" width="300" height="34" fill={tissue} opacity={0.5} />
      <g transform={`translate(${swing} 0)`}>
        {/* RV free wall (anterior) with diastolic indentation */}
        <path d={`M40 ${top} Q150 ${top + rvIndent * 1.4} 240 ${top + 4}`} stroke={wall} strokeWidth={5} fill="none" />
        <text x="120" y={top + 20} fontSize="8" fill="#9ca3af">RV</text>
        {/* septum and aortic root */}
        <path d={`M30 ${top + 34} Q130 ${top + 30} 190 ${top + 34}`} stroke={wall} strokeWidth={7} fill="none" />
        <path d={`M190 ${top + 30} L280 ${top + 30} M190 ${top + 66} L280 ${top + 66}`} stroke={wall} strokeWidth={4} />
        <text x="226" y={top + 52} fontSize="8" fill="#9ca3af">Ao</text>
        {/* LV cavity and posterior wall */}
        <text x="100" y={top + 62} fontSize="8" fill="#9ca3af">LV</text>
        <path d={`M30 ${top + 96 - s * 10} Q130 ${top + 104 - s * 12} 200 ${top + 90}`} stroke={wall} strokeWidth={8} fill="none" />
        {/* LA */}
        <path d={`M200 ${top + 74} Q240 ${top + 118} 280 ${top + 76}`} stroke={wall} strokeWidth={4} fill="none" />
        <text x="232" y={top + 96} fontSize="8" fill="#9ca3af">LA</text>
        {/* posterior pericardium, with posterior fluid anterior to the descending aorta */}
        <path d={`M30 ${top + 106 + post} Q140 ${top + 116 + post} 260 ${top + 124 + post}`} stroke={wall} strokeWidth={3} fill="none" />
        {regional && <path d={`M60 ${top + 104} Q150 ${top + 112} 250 ${top + 120} L250 ${top + 120 + post} Q150 ${top + 112 + post} 60 ${top + 104 + post} Z`} fill="#7a7a7a" opacity={0.7} />}
        <circle cx={218} cy={top + 140 + post} r={10} stroke={wall} strokeWidth={3} fill="#050505" />
        <text x="232" y={top + 160 + post} fontSize="7" fill="#9ca3af">desc Ao</text>
      </g>
    </g>
  );
}

function Ivc({ plethoric, insp }: { plethoric: boolean; insp: number }) {
  const base = plethoric ? 26 : 18;
  const collapse = plethoric ? 0.08 : 0.6;
  const d = base * (1 - collapse * insp);
  return (
    <g>
      <rect x="0" y="20" width="300" height="50" fill={tissue} opacity={0.7} />
      <text x="40" y="46" fontSize="8" fill="#9ca3af">liver</text>
      <path d={`M20 ${120 - d / 2} Q150 ${118 - d / 2} 260 ${112 - d / 2}`} stroke={wall} strokeWidth={4} fill="none" />
      <path d={`M20 ${120 + d / 2} Q150 ${118 + d / 2} 260 ${112 + d / 2}`} stroke={wall} strokeWidth={4} fill="none" />
      <text x="120" y={122} fontSize="8" fill="#9ca3af">IVC</text>
      <path d="M260 90 Q290 110 260 140" stroke={wall} strokeWidth={4} fill="none" />
      <text x="266" y="118" fontSize="8" fill="#9ca3af">RA</text>
    </g>
  );
}

function Bubbles({ view, result, pockets, t }: { view: EchoViewId; result: SalineResult; pockets: Pockets; t: number }) {
  const dots: { x: number; y: number }[] = [];
  const fade = Math.max(0, 1 - t / 6);
  for (let i = 0; i < 28; i++) {
    const a = Math.sin(i * 12.9898 + t * 1.7) * 0.5 + 0.5;
    const b = Math.sin(i * 78.233 + t * 1.1) * 0.5 + 0.5;
    if (result === "pericardial") {
      if (view === "subcostal") dots.push({ x: 40 + a * 220, y: 62 + b * pockets.subxiphoid * MM });
      else if (view === "apical") dots.push({ x: 70 + a * 160, y: 30 + b * pockets.apical * MM });
      else dots.push({ x: 40 + a * 200, y: 34 + b * pockets.parasternal * MM });
    } else {
      // inside a chamber
      if (view === "subcostal") {
        const top = 62 + pockets.subxiphoid * MM;
        dots.push({ x: 70 + a * 160, y: result === "lv" ? top + 64 + b * 34 : top + 20 + b * 22 });
      } else if (view === "apical") {
        const apexY = 30 + pockets.apical * MM;
        dots.push({ x: result === "lv" ? 160 + a * 45 : 95 + a * 45, y: apexY + 40 + b * 70 });
      } else {
        const top = 34 + pockets.parasternal * MM;
        dots.push({ x: 60 + a * 150, y: result === "lv" ? top + 44 + b * 40 : top + 8 + b * 18 });
      }
    }
  }
  return (
    <g opacity={fade}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.6} fill="#f8fafc" />
      ))}
    </g>
  );
}

function Needle({ view, pockets, beyond }: { view: EchoViewId; pockets: Pockets; beyond: number }) {
  // The needle comes in from the near field toward the pocket.
  const periY = view === "subcostal" ? 62 : view === "apical" ? 30 : 34;
  const x0 = view === "subcostal" ? 60 : view === "apical" ? 120 : 110;
  const tipY = periY + Math.max(-25, beyond) * MM;
  const tipX = x0 + (tipY - 8) * 0.35;
  void pockets;
  return (
    <g>
      <line x1={x0 - 30} y1={0} x2={tipX} y2={tipY} stroke="#f8fafc" strokeWidth={2} opacity={0.85} />
      <circle cx={tipX} cy={tipY} r={2.4} fill="#ffffff" />
    </g>
  );
}
