// ---------------------------------------------------------------------------
// The one intravascular imaging renderer (pci-bench-imaging-unify): draws an
// IvusFrame from src/simulation/pci/ivus.ts as the console would show it, for
// the IVUS and OCT bench and the PCI lab's imaging console alike.
//
// What the modality shows (the image only; no labels of the findings):
//   IVUS  grey-scale speckle; ring-down around the catheter; the EEM as a bright
//         adventitial ring; calcium as a bright leading arc with an acoustic shadow
//         behind it and no back edge; attenuated (lipid-rich) plaque as a shadow
//         without a bright leading edge; struts as bright points; the wire with
//         its shadow
//   OCT   bronze speckle, a dark lumen (flushed), no ring-down; calcium as a
//         sharp-bordered, signal-poor region whose thickness can be measured;
//         a lipid pool as a signal-poor region with a diffuse border under a
//         bright cap, hiding the media behind it; struts with shadows; red
//         thrombus attenuating, white thrombus not
// Signal fades beyond the depth each modality images from the lumen
// (MP_PENETRATION_MM in src/simulation/pci/ivus.ts, a MODEL PARAMETER within
// the module's 4 to 8 mm for IVUS and 2 to 3.5 mm for OCT, Oxford,
// src/content/manual/pci-manual/15-imaging.ts): one radial mask over the tissue.
// Geometry comes from the frame (lumen and EEM outlines per angle, arcs,
// struts), so the drawing and every measurement agree. The image is an SVG
// with a fractal-noise speckle filter (cheap enough at bench rates; a canvas
// renderer can replace it if a live pullback lags).
// ---------------------------------------------------------------------------

import { useId } from "react";
import { MP_PENETRATION_MM, type IvusFrame } from "../../simulation/pci/ivus";

export interface IntravascularViewProps {
  frame: IvusFrame;
  /** pixels per mm (default 28: a field of view of about 10.7 mm) */
  pxPerMm?: number;
  /** accessible name; defaults to the modality and position */
  label?: string;
  className?: string;
}

const C = 150;
const R_FIELD = 148;

type Pt = [number, number];
const pt = (r: number, a: number, s: number): Pt => [C + r * s * Math.cos(a), C + r * s * Math.sin(a)];
const fmtPt = ([x, y]: Pt) => `${x.toFixed(1)},${y.toFixed(1)}`;

/** Closed outline through polar radii (mm) at the frame's angles. */
function outline(theta: number[], r: number[], s: number): string {
  return theta.map((a, i) => fmtPt(pt(r[i], a, s))).join(" ");
}

/** Interpolated radius of a polar outline at angle a. */
function radiusAt(theta: number[], r: number[], a: number): number {
  const n = theta.length;
  const step = (2 * Math.PI) / n;
  const u = (((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / step;
  const i = Math.floor(u) % n;
  const f = u - Math.floor(u);
  return r[i] * (1 - f) + r[(i + 1) % n] * f;
}

/** An annular sector between radii r0 and r1 (px) about the image centre, from angle a0 to a1. */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${(C + r * Math.cos(a)).toFixed(1)},${(C + r * Math.sin(a)).toFixed(1)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r0, a0)} A${r0},${r0} 0 ${large} 1 ${p(r0, a1)} L${p(r1, a1)} A${r1},${r1} 0 ${large} 0 ${p(r1, a0)} Z`;
}

/** A band that follows the lumen outline: from lumen + d0 to lumen + d1 (mm) over an arc. */
function bandOverLumen(f: IvusFrame, a0: number, a1: number, d0: (a: number) => number, d1: (a: number) => number, s: number, steps = 24): string {
  const out: string[] = [];
  const back: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const a = a0 + ((a1 - a0) * k) / steps;
    const rl = radiusAt(f.theta, f.lumen, a);
    out.push(fmtPt(pt(rl + d0(a), a, s)));
    back.push(fmtPt(pt(rl + d1(a), a, s)));
  }
  return `M${out.join(" L")} L${back.reverse().join(" L")} Z`;
}

export default function IntravascularView({ frame: f, pxPerMm = 28, label, className = "" }: IntravascularViewProps) {
  const uid = useId().replace(/:/g, "");
  const s = pxPerMm;
  const ivus = f.modality === "IVUS";
  const eemMax = Math.max(...f.eem);
  const speckle = `spk-${uid}`;
  const soft = `soft-${uid}`;
  const clip = `clip-${uid}`;
  const depth = `depth-${uid}`;
  const depthGrad = `depthg-${uid}`;
  // tissue signal: full to 60% of the penetration depth beyond the mean lumen radius, gone at the full depth
  const meanLumen = f.lumen.reduce((a, b) => a + b, 0) / Math.max(1, f.lumen.length);
  const pen = MP_PENETRATION_MM[f.modality];
  const stop = (mm: number) => Math.max(0, Math.min(1, (mm * s) / R_FIELD));
  const tissue = ivus ? "#3b3b3b" : "#3a2a1d";
  const plaqueFill = ivus ? "#8d8d8d" : "#c99b6a";
  const lumenFill = ivus ? "#141414" : "#050302";
  const bright = ivus ? "#f4f4f4" : "#ffe9c9";
  const shadow = ivus ? "#060606" : "#0b0705";
  // the native lumen at the calcium and lipid angles (the stent may prop the lumen open past it)
  const ca = f.calcium;
  const lip = f.lipid;
  const caDepth = (a: number) => (ca ? Math.max(0.05, ca.r - radiusAt(f.theta, f.lumen, a)) : 0);
  const name = label ?? `${f.modality} frame at ${f.mm.toFixed(1)} mm`;
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={name} className={`w-full max-w-[300px] rounded-full ${className}`} style={{ background: ivus ? "#0a0a0a" : "#050302" }}>
      <defs>
        <filter id={speckle} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={ivus ? 0.9 : 0.65} numOctaves={2} seed={Math.round(f.mm * 4) % 97} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={ivus ? 1.1 : 0.75} />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <filter id={soft} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
        <clipPath id={clip}>
          <circle cx={C} cy={C} r={R_FIELD} />
        </clipPath>
        <radialGradient id={depthGrad} gradientUnits="userSpaceOnUse" cx={C} cy={C} r={R_FIELD}>
          <stop offset={stop(meanLumen + 0.6 * pen)} stopColor="#fff" />
          <stop offset={stop(meanLumen + pen)} stopColor="#000" />
        </radialGradient>
        <mask id={depth} maskUnits="userSpaceOnUse" x={0} y={0} width={300} height={300}>
          <rect x={0} y={0} width={300} height={300} fill={`url(#${depthGrad})`} />
        </mask>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <g mask={`url(#${depth})`}>
          {/* periadventitial tissue */}
          <circle cx={C} cy={C} r={R_FIELD} fill={tissue} filter={`url(#${speckle})`} opacity={0.6} />
          {/* adventitia: a bright ring on IVUS, a softer band on OCT */}
          <polygon points={outline(f.theta, f.eem.map((r) => r + 0.22), s)} fill="none" stroke={ivus ? "#d6d6d6" : "#b98c60"} strokeWidth={ivus ? 6 : 4} opacity={0.75} filter={`url(#${speckle})`} />
          {/* media: a thin dark band at the EEM */}
          <polygon points={outline(f.theta, f.eem, s)} fill={plaqueFill} filter={`url(#${speckle})`} />
          <polygon points={outline(f.theta, f.eem, s)} fill="none" stroke={ivus ? "#2b2b2b" : "#4a3020"} strokeWidth={2} opacity={0.8} />

          {/* calcium */}
          {ca &&
            (ivus ? (
              <g>
                {/* acoustic shadow: everything behind the leading edge is lost, including the EEM */}
                <path d={bandOverLumen(f, ca.from, ca.to, (a) => caDepth(a), () => 20, s)} fill={shadow} />
                <path d={bandOverLumen(f, ca.from, ca.to, (a) => caDepth(a), (a) => caDepth(a) + 0.12, s)} fill={bright} />
              </g>
            ) : (
              <path
                d={bandOverLumen(f, ca.from, ca.to, (a) => caDepth(a), (a) => caDepth(a) + (ca.thicknessMm ?? 0.3), s)}
                fill="#2c1f16"
                stroke="#f0d7b6"
                strokeWidth={1.2}
              />
            ))}

          {/* lipid-rich plaque */}
          {lip &&
            (ivus ? (
              // attenuation: a shadow without a bright leading edge
              <path d={bandOverLumen(f, lip.from, lip.to, () => 0.35, () => 20, s)} fill="rgba(6,6,6,0.82)" filter={`url(#${soft})`} />
            ) : (
              <g>
                {/* signal-poor pool with a diffuse border, hiding the media behind it */}
                <path d={bandOverLumen(f, lip.from, lip.to, () => 0.12, () => 20, s)} fill="rgba(14,9,6,0.9)" filter={`url(#${soft})`} />
                {/* the fibrous cap: a bright rim over the pool (drawn 80 µm when the scenario states no cap: a drawing value, not a measurement) */}
                <path d={bandOverLumen(f, lip.from, lip.to, () => 0, () => Math.max(0.04, (lip.capUm ?? 80) / 1000), s)} fill="#f3dcc0" opacity={0.9} />
              </g>
            ))}
        </g>

        {/* side-branch ostium: the lumen opens through the wall */}
        {f.sideBranch && (
          <path
            d={sector(radiusAt(f.theta, f.lumen, f.sideBranch.theta) * s * 0.9, R_FIELD, f.sideBranch.theta - f.sideBranch.halfWidth, f.sideBranch.theta + f.sideBranch.halfWidth)}
            fill={lumenFill}
          />
        )}

        {/* lumen: blood speckle on IVUS, flushed and dark on OCT */}
        <polygon points={outline(f.theta, f.lumen, s)} fill={lumenFill} />
        {ivus && <polygon points={outline(f.theta, f.lumen, s)} fill="#2d2d2d" filter={`url(#${speckle})`} opacity={0.35} />}

        {/* thrombus: a mass on the plaque side of the lumen */}
        {f.thrombus && (
          <g>
            <path
              d={bandOverLumen(
                f,
                (ca?.from ?? lip?.from ?? 0.3) + 0.2,
                (ca?.from ?? lip?.from ?? 0.3) + 1.3,
                () => -Math.min(0.6, Math.min(...f.lumen) * 0.5),
                () => 0,
                s
              )}
              fill={ivus ? "#7a7a7a" : f.thrombusType === "white" ? "#f1dcc4" : "#b07a55"}
              filter={`url(#${speckle})`}
            />
            {!ivus && f.thrombusType !== "white" && (
              <path d={bandOverLumen(f, (ca?.from ?? lip?.from ?? 0.3) + 0.25, (ca?.from ?? lip?.from ?? 0.3) + 1.25, () => 0, () => 20, s)} fill="rgba(5,3,2,0.8)" />
            )}
          </g>
        )}

        {/* dissection flap: a thin bright membrane in the lumen */}
        {f.flap && (
          <path
            d={(() => {
              const steps = 16;
              const pts: string[] = [];
              for (let k = 0; k <= steps; k++) {
                const a = f.flap!.from + ((f.flap!.to - f.flap!.from) * k) / steps;
                pts.push(fmtPt(pt(Math.min(f.flap!.r, radiusAt(f.theta, f.lumen, a) * 0.92), a, s)));
              }
              return `M${pts.join(" L")}`;
            })()}
            fill="none"
            stroke={bright}
            strokeWidth={1.6}
            opacity={0.9}
          />
        )}

        {/* stent struts, every layer */}
        {f.struts.map((st, i) => {
          const [x, y] = pt(st.r, st.theta, s);
          return (
            <g key={i}>
              {!ivus && <path d={`M${x.toFixed(1)},${y.toFixed(1)} L${(x + Math.cos(st.theta) * 40).toFixed(1)},${(y + Math.sin(st.theta) * 40).toFixed(1)}`} stroke="#000" strokeWidth={4} opacity={0.75} />}
              <rect x={x - 2} y={y - 2} width={4} height={4} fill="#ffffff" transform={`rotate(${((st.theta * 180) / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`} opacity={st.layer > 0 ? 0.85 : 1} />
            </g>
          );
        })}

        {/* guidewire and its shadow */}
        {(() => {
          const [x, y] = pt(f.wire.r, f.wire.theta, s);
          const a = f.wire.theta;
          return (
            <g>
              <path d={`M${x.toFixed(1)},${y.toFixed(1)} L${(C + Math.cos(a - 0.06) * R_FIELD).toFixed(1)},${(C + Math.sin(a - 0.06) * R_FIELD).toFixed(1)} L${(C + Math.cos(a + 0.06) * R_FIELD).toFixed(1)},${(C + Math.sin(a + 0.06) * R_FIELD).toFixed(1)} Z`} fill="#000" opacity={0.85} />
              <circle cx={x} cy={y} r={2.6} fill={bright} />
            </g>
          );
        })()}

        {/* imaging catheter: ring-down on IVUS */}
        <circle cx={C} cy={C} r={ivus ? 14 : 12} fill="#000" stroke={ivus ? "#a3a3a3" : "#6b4c34"} strokeWidth={ivus ? 3 : 2} />
        {ivus && <circle cx={C} cy={C} r={19} fill="none" stroke="#bdbdbd" strokeWidth={4} opacity={0.35} filter={`url(#${speckle})`} />}

        {/* 1 mm scale */}
        <line x1={22} y1={278} x2={22 + s} y2={278} stroke="#fff" strokeWidth={2} />
        <text x={22} y={270} fontSize={13} fill="#fff">
          1 mm
        </text>
        {eemMax * s > R_FIELD && <circle cx={C} cy={C} r={R_FIELD - 1} fill="none" stroke="#000" strokeWidth={2} />}
      </g>
    </svg>
  );
}
