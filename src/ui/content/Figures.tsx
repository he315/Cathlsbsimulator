// ---------------------------------------------------------------------------
// Original teaching figures, drawn as SVG. Every FigureId in content/schema.ts
// has a component here. Schematics are deliberately simplified and labelled
// "not to scale"; numeric annotations are typical textbook values only.
// ---------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { FigureId } from "../../content/schema";
import { iabpPressure, CORRECT_TIMING } from "../../simulation/iabp";

const C = {
  bg: "#070b11",
  grid: "rgba(79,142,247,0.07)",
  ink: "#ECEEF1",
  soft: "#A6ADB8",
  faint: "#858D99",
  vessel: "#c3d3ea",
  accent: "#4F8EF7",
  warn: "#E9B95A",
  danger: "#E5534B",
  good: "#4CC38A",
  art: "#ff5d6c",
  ecg: "#3ef2a4",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  line: "#22262C",
};

type Pt = [number, number];

/** Cosine-interpolated curve through keyframes (t, value). */
function curve(keys: Pt[], n = 240): Pt[] {
  const out: Pt[] = [];
  const t0 = keys[0][0];
  const t1 = keys[keys.length - 1][0];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    let k = 0;
    while (k < keys.length - 2 && keys[k + 1][0] < t) k++;
    const [ta, va] = keys[k];
    const [tb, vb] = keys[k + 1];
    const f = tb === ta ? 0 : (t - ta) / (tb - ta);
    const s = (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, f)))) / 2;
    out.push([t, va + (vb - va) * s]);
  }
  return out;
}

function path(pts: Pt[], sx: (t: number) => number, sy: (v: number) => number) {
  return pts.map(([t, v], i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
}

function Frame({ w = 560, h = 320, children }: { w?: number; h?: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto rounded-md" style={{ background: C.bg }} role="img">
      <defs>
        <pattern id="figgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={C.grid} strokeWidth="1" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.soft} />
        </marker>
        <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.art} />
        </marker>
        <marker id="arrowBlue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
        </marker>
      </defs>
      <rect width={w} height={h} fill="url(#figgrid)" />
      {children}
    </svg>
  );
}

function T({
  x,
  y,
  children,
  size = 11,
  fill = C.soft,
  anchor = "start",
  weight,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontWeight={weight} fontFamily="system-ui, sans-serif">
      {children}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Coronary tree (shared geometry for the tree and the segment map)
// ---------------------------------------------------------------------------
const TREE: { id: string; d: string; w: number; label?: [number, number, string] }[] = [
  { id: "LM", d: "M292,74 L326,96", w: 6, label: [300, 70, "LM"] },
  { id: "LAD", d: "M326,96 C352,128 372,170 392,215 C405,245 418,270 428,292", w: 4.5, label: [412, 300, "LAD"] },
  { id: "D1", d: "M346,128 C368,136 392,142 418,150", w: 2.6, label: [422, 152, "D1"] },
  { id: "D2", d: "M378,186 C398,192 420,198 446,204", w: 2.3, label: [450, 207, "D2"] },
  { id: "S1", d: "M338,114 C330,126 322,138 314,152", w: 1.6, label: [296, 160, "septal"] },
  { id: "S2", d: "M364,160 C356,172 350,184 344,196", w: 1.4 },
  { id: "LCx", d: "M326,96 C356,94 392,98 424,112 C452,124 474,146 486,176", w: 4, label: [490, 182, "LCx"] },
  { id: "OM1", d: "M412,106 C424,128 434,150 440,178", w: 2.6, label: [430, 192, "OM1"] },
  { id: "OM2", d: "M462,132 C468,152 472,176 472,204", w: 2.3, label: [462, 218, "OM2"] },
  { id: "RCA", d: "M254,76 C226,86 196,104 172,132 C150,160 144,196 156,232 C168,262 204,284 252,292", w: 4.5, label: [138, 150, "RCA"] },
  { id: "conus", d: "M244,80 C246,64 254,52 266,44", w: 1.6, label: [270, 42, "conus"] },
  { id: "SAN", d: "M222,92 C212,80 204,66 200,50", w: 1.4, label: [170, 48, "SA nodal"] },
  { id: "AM", d: "M152,196 C172,212 196,226 222,238", w: 2.2, label: [226, 244, "AM"] },
  { id: "PDA", d: "M252,292 C284,298 318,302 356,304", w: 2.6, label: [360, 308, "PDA"] },
  { id: "PLV", d: "M252,292 C266,276 280,264 300,254", w: 2.4, label: [304, 252, "PLV"] },
];

function TreeBase({ dim = false }: { dim?: boolean }) {
  return (
    <g>
      {/* heart silhouette and grooves */}
      <path
        d="M200,60 C130,80 110,190 160,260 C210,320 330,330 420,305 C500,280 520,190 490,130 C460,70 380,50 300,56 Z"
        fill="rgba(120,60,70,0.10)"
        stroke="rgba(255,255,255,0.06)"
      />
      <circle cx={272} cy={62} r={22} fill="rgba(160,170,190,0.08)" stroke={C.faint} strokeDasharray="3 3" />
      <T x={272} y={30} anchor="middle" size={10} fill={C.faint}>
        aortic root
      </T>
      {TREE.map((s) => (
        <path
          key={s.id}
          d={s.d}
          fill="none"
          stroke={dim ? "rgba(195,211,234,0.45)" : C.vessel}
          strokeWidth={s.w}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function CoronaryTree() {
  return (
    <Frame h={330}>
      <TreeBase />
      {TREE.filter((s) => s.label).map((s) => (
        <T key={s.id} x={s.label![0]} y={s.label![1]} size={11} fill={C.ink}>
          {s.label![2]}
        </T>
      ))}
      <T x={16} y={300} size={10} fill={C.faint}>
        Right-dominant circulation · schematic, not to scale
      </T>
      <T x={16} y={316} size={10} fill={C.faint}>
        AM acute marginal · OM obtuse marginal · PDA posterior descending · PLV posterolateral
      </T>
    </Frame>
  );
}

const SEGMENTS: [number, number, string, string][] = [
  [212, 96, "1", "Proximal RCA"],
  [150, 186, "2", "Mid RCA"],
  [196, 278, "3", "Distal RCA"],
  [316, 314, "4", "PDA (RCA)"],
  [290, 254, "16", "Posterolateral (RCA)"],
  [312, 92, "5", "Left main"],
  [344, 112, "6", "Proximal LAD"],
  [378, 196, "7", "Mid LAD"],
  [418, 268, "8", "Apical LAD"],
  [392, 132, "9", "First diagonal"],
  [424, 190, "10", "Second diagonal"],
  [376, 90, "11", "Proximal LCx"],
  [432, 152, "12a", "First obtuse marginal"],
  [476, 164, "12b", "Second obtuse marginal"],
  [492, 150, "13", "Distal LCx"],
];

function AhaSegments() {
  return (
    <Frame w={640} h={330}>
      <g transform="translate(-40,0)">
        <TreeBase dim />
        {SEGMENTS.map(([x, y, n]) => (
          <g key={n}>
            <circle cx={x} cy={y} r={10} fill="#0d1a33" stroke={C.accent} />
            <T x={x} y={y + 3.5} anchor="middle" size={n.length > 2 ? 8 : 9.5} fill={C.ink} weight={600}>
              {n}
            </T>
          </g>
        ))}
      </g>
      <g transform="translate(486,22)">
        <T x={0} y={0} size={10} fill={C.faint}>
          Segment (modified AHA / SYNTAX)
        </T>
        {SEGMENTS.map(([, , n, name], i) => (
          <g key={n} transform={`translate(0,${16 + i * 18})`}>
            <T x={0} y={0} size={10} fill={C.accent} weight={600}>
              {n}
            </T>
            <T x={26} y={0} size={10} fill={C.soft}>
              {name}
            </T>
          </g>
        ))}
      </g>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// C-arm angulation compass
// ---------------------------------------------------------------------------
function ViewsCompass() {
  const cx = 280,
    cy = 165,
    sx = 3.6,
    sy = 3.0;
  const P = (lao: number, cran: number): Pt => [cx + lao * sx, cy - cran * sy];
  const views: { at: Pt; name: string; shows: string; col: string; dx?: number; dy?: number; anchor?: "start" | "end" | "middle" }[] = [
    { at: P(-30, -25), name: "RAO caudal", shows: "LM bifurcation · prox LCx · OMs", col: C.accent, dx: -8, dy: 16, anchor: "end" },
    { at: P(-30, 30), name: "RAO cranial", shows: "mid/distal LAD · diagonals open", col: C.accent, dx: -8, dy: -8, anchor: "end" },
    { at: P(0, 35), name: "AP cranial", shows: "mid/distal LAD · septals", col: C.accent, dx: 0, dy: -12, anchor: "middle" },
    { at: P(40, 28), name: "LAO cranial", shows: "LAD–diagonal bifurcations · RCA crux", col: C.accent, dx: 8, dy: -8 },
    { at: P(45, -25), name: "LAO caudal ('spider')", shows: "LM · ostial LAD and LCx", col: C.accent, dx: 8, dy: 16 },
    { at: P(0, -30), name: "AP caudal", shows: "LM · proximal LCx", col: C.accent, dx: 0, dy: 20, anchor: "middle" },
    { at: P(35, 0), name: "LAO 30–45°", shows: "RCA ('C' shape)", col: C.art, dx: 8, dy: 4 },
    { at: P(-30, 0), name: "RAO 30°", shows: "mid RCA · PDA length ('L')", col: C.art, dx: -8, dy: 4, anchor: "end" },
  ];
  return (
    <Frame h={330}>
      <line x1={cx - 52 * sx} y1={cy} x2={cx + 52 * sx} y2={cy} stroke={C.faint} />
      <line x1={cx} y1={cy - 46 * sy} x2={cx} y2={cy + 46 * sy} stroke={C.faint} />
      {[15, 30, 45].map((r) => (
        <ellipse key={r} cx={cx} cy={cy} rx={r * sx} ry={r * sy} fill="none" stroke="rgba(255,255,255,0.05)" />
      ))}
      <T x={cx - 52 * sx} y={cy - 6} size={11} fill={C.ink} weight={600}>
        RAO
      </T>
      <T x={cx + 52 * sx} y={cy - 6} size={11} fill={C.ink} anchor="end" weight={600}>
        LAO
      </T>
      <T x={cx + 6} y={cy - 46 * sy + 10} size={11} fill={C.ink} weight={600}>
        CRANIAL
      </T>
      <T x={cx + 6} y={cy + 46 * sy - 2} size={11} fill={C.ink} weight={600}>
        CAUDAL
      </T>
      {views.map((v) => (
        <g key={v.name}>
          <circle cx={v.at[0]} cy={v.at[1]} r={5} fill={v.col} />
          <T x={v.at[0] + (v.dx ?? 0)} y={v.at[1] + (v.dy ?? 0)} size={10.5} fill={C.ink} anchor={v.anchor} weight={600}>
            {v.name}
          </T>
          <T x={v.at[0] + (v.dx ?? 0)} y={v.at[1] + (v.dy ?? 0) + 12} size={9.5} fill={C.soft} anchor={v.anchor}>
            {v.shows}
          </T>
        </g>
      ))}
      <circle cx={16} cy={312} r={4} fill={C.accent} />
      <T x={24} y={315} size={10} fill={C.faint}>
        left coronary
      </T>
      <circle cx={100} cy={312} r={4} fill={C.art} />
      <T x={108} y={315} size={10} fill={C.faint}>
        right coronary · typical starting angles; adjust to the patient
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Wiggers diagram
// ---------------------------------------------------------------------------
function Wiggers() {
  const x0 = 60,
    x1 = 540;
  const sx = (t: number) => x0 + (x1 - x0) * t;
  const yP = (p: number) => 230 - p * 1.55; // pressure panel
  const lv = curve([
    [0, 5], [0.08, 9], [0.12, 8], [0.14, 10], [0.19, 80], [0.3, 120], [0.42, 108], [0.48, 92], [0.56, 5], [0.7, 4], [1, 6],
  ]);
  const ao = curve([
    [0, 84], [0.19, 79], [0.3, 117], [0.42, 106], [0.475, 92], [0.49, 88], [0.51, 94], [0.6, 92], [1, 82],
  ]);
  const la = curve([
    [0, 5], [0.08, 10], [0.13, 6], [0.16, 8], [0.3, 4], [0.52, 12], [0.6, 5], [0.68, 4], [1, 5],
  ]);
  const ecg = curve([
    [0, 0], [0.02, 0], [0.05, 4], [0.08, 0], [0.12, 0], [0.13, -3], [0.145, 22], [0.16, -6], [0.175, 0], [0.34, 0], [0.4, 6], [0.46, 0], [1, 0],
  ], 400);
  const yE = (v: number) => 290 - v * 1.2;
  const events: [number, string][] = [
    [0.14, "MC"], [0.19, "AO"], [0.48, "AC"], [0.56, "MO"],
  ];
  return (
    <Frame h={320}>
      {events.map(([t, l]) => (
        <g key={l}>
          <line x1={sx(t)} y1={28} x2={sx(t)} y2={300} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 4" />
          <T x={sx(t)} y={22} anchor="middle" size={10} fill={C.warn}>
            {l}
          </T>
        </g>
      ))}
      <path d={path(ao, sx, yP)} fill="none" stroke={C.art} strokeWidth={2} />
      <path d={path(lv, sx, yP)} fill="none" stroke={C.cyan} strokeWidth={2} />
      <path d={path(la, sx, yP)} fill="none" stroke={C.violet} strokeWidth={2} />
      <path d={path(ecg, sx, yE)} fill="none" stroke={C.ecg} strokeWidth={1.6} />
      {[0, 40, 80, 120].map((p) => (
        <g key={p}>
          <line x1={x0 - 4} y1={yP(p)} x2={x0} y2={yP(p)} stroke={C.faint} />
          <T x={x0 - 8} y={yP(p) + 3.5} anchor="end" size={9} fill={C.faint}>
            {p}
          </T>
        </g>
      ))}
      <T x={14} y={yP(60)} size={9} fill={C.faint}>
        mmHg
      </T>
      <T x={sx(0.31)} y={yP(124)} size={10} fill={C.art}>
        aorta
      </T>
      <T x={sx(0.24)} y={yP(60)} size={10} fill={C.cyan}>
        LV
      </T>
      <T x={sx(0.52) + 4} y={yP(18)} size={10} fill={C.violet}>
        LA (v)
      </T>
      <T x={sx(0.07)} y={yP(16)} size={10} fill={C.violet}>
        a
      </T>
      <T x={sx(0.5)} y={yP(98)} size={9.5} fill={C.soft}>
        notch
      </T>
      <T x={x0} y={314} size={10} fill={C.ecg}>
        ECG
      </T>
      {[
        [0.14, 0.19, "IVC"],
        [0.19, 0.48, "ejection"],
        [0.48, 0.56, "IVR"],
        [0.56, 1.0, "ventricular filling"],
      ].map(([a, b, l]) => (
        <T key={l as string} x={(sx(a as number) + sx(b as number)) / 2} y={40} anchor="middle" size={9.5} fill={C.faint}>
          {l as string}
        </T>
      ))}
      <T x={x1} y={314} anchor="end" size={9} fill={C.faint}>
        MC/MO mitral close/open · AO/AC aortic open/close
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Right-heart catheter waveforms (advancing RA → RV → PA → wedge)
// ---------------------------------------------------------------------------
function RhcWaveforms() {
  const beat = (kind: "ra" | "rv" | "pa" | "w"): Pt[] => {
    switch (kind) {
      case "ra":
        return [[0, 3], [0.12, 6], [0.2, 3], [0.26, 4.5], [0.4, 2], [0.68, 6], [0.8, 2], [1, 3]];
      case "rv":
        return [[0, 2], [0.1, 5], [0.16, 6], [0.24, 24], [0.38, 25], [0.5, 4], [0.56, 1], [0.8, 3], [1, 4]];
      case "pa":
        return [[0, 11], [0.16, 10], [0.26, 24], [0.38, 23], [0.5, 15], [0.53, 13], [0.56, 15], [1, 11]];
      case "w":
        return [[0, 8], [0.12, 11], [0.24, 7], [0.48, 6], [0.72, 12], [0.84, 7], [1, 8]];
    }
  };
  const segs: { kind: "ra" | "rv" | "pa" | "w"; label: string; range: string; col: string }[] = [
    { kind: "ra", label: "RA", range: "mean ≈ 2–6", col: C.violet },
    { kind: "rv", label: "RV", range: "≈ 15–30 / 2–8", col: C.cyan },
    { kind: "pa", label: "PA", range: "≈ 15–30 / 4–12", col: C.art },
    { kind: "w", label: "PCWP", range: "mean ≈ 6–12", col: C.warn },
  ];
  const sy = (v: number) => 250 - v * 7;
  const W = 120;
  return (
    <Frame h={300}>
      {[0, 10, 20, 30].map((p) => (
        <g key={p}>
          <line x1={40} y1={sy(p)} x2={540} y2={sy(p)} stroke="rgba(255,255,255,0.05)" />
          <T x={34} y={sy(p) + 3.5} anchor="end" size={9} fill={C.faint}>
            {p}
          </T>
        </g>
      ))}
      {segs.map((s, i) => {
        const ox = 50 + i * W;
        const pts: Pt[] = [];
        for (let b = 0; b < 2; b++) {
          for (const [t, v] of curve(beat(s.kind), 60)) pts.push([b * 0.5 + t * 0.5, v]);
        }
        return (
          <g key={s.kind}>
            <path d={path(pts, (t) => ox + t * (W - 8), sy)} fill="none" stroke={s.col} strokeWidth={2} />
            <T x={ox + W / 2 - 4} y={34} anchor="middle" size={12} fill={s.col} weight={700}>
              {s.label}
            </T>
            <T x={ox + W / 2 - 4} y={50} anchor="middle" size={9.5} fill={C.soft}>
              {s.range}
            </T>
            {i > 0 && <line x1={ox - 4} y1={60} x2={ox - 4} y2={262} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />}
          </g>
        );
      })}
      <T x={56} y={sy(7.4)} size={9} fill={C.violet}>a</T>
      <T x={90} y={sy(7.4)} size={9} fill={C.violet}>v</T>
      <T x={78} y={sy(0.2)} size={9} fill={C.violet}>y</T>
      <T x={418} y={sy(13)} size={9} fill={C.warn}>a</T>
      <T x={459} y={sy(13.6)} size={9} fill={C.warn}>v</T>
      <T x={40} y={286} size={9.5} fill={C.faint}>
        mmHg · typical resting values in adults; RV diastolic pressure rises through diastole, PA diastolic does not
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// IABP 1:2 waveform (generated by the simulator's own model)
// ---------------------------------------------------------------------------
function IabpTiming() {
  const h = { systolic: 110, diastolic: 70, hr: 80 };
  const s = { ...CORRECT_TIMING, ratio: 2 as const };
  const pts: Pt[] = [];
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i <= 120; i++) {
      const ph = i / 120;
      pts.push([b + ph, iabpPressure(ph, b + 1, s, h).p]);
    }
  }
  const sx = (t: number) => 50 + t * 240;
  const sy = (p: number) => 280 - (p - 40) * 2.6;
  const mark = (t: number, p: number, l: string, txt: string, dy = -10) => (
    <g key={l}>
      <circle cx={sx(t)} cy={sy(p)} r={3.5} fill={C.warn} />
      <T x={sx(t)} y={sy(p) + dy} anchor="middle" size={11} fill={C.warn} weight={700}>
        {l}
      </T>
      <title>{txt}</title>
    </g>
  );
  // beat index 1 = unassisted (ratio 2), beat 2 = assisted
  const peakAug = Math.max(...pts.filter(([t]) => t > 1.36 && t < 1.7).map(([, p]) => p));
  return (
    <Frame h={330}>
      {[60, 80, 100, 120, 140].map((p) => (
        <g key={p}>
          <line x1={46} y1={sy(p)} x2={540} y2={sy(p)} stroke="rgba(255,255,255,0.05)" />
          <T x={40} y={sy(p) + 3.5} anchor="end" size={9} fill={C.faint}>
            {p}
          </T>
        </g>
      ))}
      <path d={path(pts, sx, sy)} fill="none" stroke={C.art} strokeWidth={2.2} />
      {mark(0.1, 110, "A", "Unassisted systole")}
      {mark(0.36, iabpPressure(0.36, 1, s, h).p, "B", "Dicrotic notch — inflation point", 16)}
      {mark(0.99, iabpPressure(0.99, 1, s, h).p, "C", "Unassisted end-diastolic pressure", 18)}
      {mark(1.42, peakAug, "D", "Peak augmented diastolic pressure")}
      {mark(1.985, iabpPressure(0.985, 2, s, h).p, "E", "Assisted end-diastolic pressure (lower)", 18)}
      <g transform="translate(330,28)">
        {[
          ["A", "unassisted systole"],
          ["B", "dicrotic notch → inflate here"],
          ["C", "unassisted end-diastole"],
          ["D", "augmented diastole (should exceed A)"],
          ["E", "assisted end-diastole (should be below C)"],
        ].map(([k, v], i) => (
          <g key={k} transform={`translate(0,${i * 15})`}>
            <T x={0} y={0} size={10} fill={C.warn} weight={700}>
              {k}
            </T>
            <T x={14} y={0} size={10} fill={C.soft}>
              {v}
            </T>
          </g>
        ))}
      </g>
      <T x={50} y={318} size={9.5} fill={C.faint}>
        1:2 assist so the unassisted and assisted beats can be compared · mmHg
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Impella position
// ---------------------------------------------------------------------------
function ImpellaPosition() {
  return (
    <Frame h={330}>
      {/* aorta and LV outline */}
      <path d="M232,20 L232,120 C232,140 220,150 210,160" fill="none" stroke={C.faint} strokeWidth={2} />
      <path d="M300,20 L300,120 C300,140 316,150 330,160" fill="none" stroke={C.faint} strokeWidth={2} />
      <path
        d="M210,160 C150,200 160,290 250,310 C330,320 380,270 360,200 C352,176 342,166 330,160"
        fill="rgba(200,80,90,0.07)"
        stroke={C.faint}
        strokeWidth={2}
      />
      {/* aortic valve */}
      <line x1={210} y1={160} x2={250} y2={170} stroke={C.soft} strokeWidth={2.5} />
      <line x1={330} y1={160} x2={290} y2={170} stroke={C.soft} strokeWidth={2.5} />
      <T x={340} y={164} size={10} fill={C.soft}>
        aortic valve
      </T>
      {/* mitral */}
      <path d="M200,178 C186,194 182,206 186,218" fill="none" stroke={C.violet} strokeWidth={2} />
      <T x={120} y={214} size={10} fill={C.violet}>
        mitral apparatus
      </T>
      {/* device */}
      <path d="M266,10 L266,140 C266,180 262,210 258,232" fill="none" stroke="#9aa9bd" strokeWidth={7} strokeLinecap="round" />
      <rect x={259} y={88} width={14} height={30} rx={3} fill="#3b4a5e" stroke={C.cyan} />
      <T x={312} y={102} size={10} fill={C.cyan}>
        outlet (ascending aorta)
      </T>
      <line x1={310} y1={99} x2={276} y2={100} stroke={C.cyan} markerEnd="url(#arrow)" />
      <rect x={251} y={212} width={14} height={22} rx={3} fill="#3b4a5e" stroke={C.good} />
      <T x={300} y={240} size={10} fill={C.good}>
        inlet (in LV)
      </T>
      <line x1={298} y1={237} x2={268} y2={226} stroke={C.good} markerEnd="url(#arrow)" />
      {/* pigtail */}
      <path d="M258,234 C256,256 268,268 278,262 C288,254 280,242 270,248" fill="none" stroke="#9aa9bd" strokeWidth={3} />
      <T x={292} y={276} size={10} fill={C.soft}>
        pigtail free in the LV cavity
      </T>
      {/* distance marker */}
      <line x1={196} y1={166} x2={196} y2={224} stroke={C.warn} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <T x={30} y={186} size={10} fill={C.warn}>
        inlet ≈ 3.5 cm below
      </T>
      <T x={30} y={199} size={10} fill={C.warn}>
        the valve (CP; check IFU)
      </T>
      <T x={16} y={318} size={9.5} fill={C.faint}>
        Too deep: inlet against the wall or mitral apparatus (suction, arrhythmia, haemolysis). Too shallow: inlet in the aorta, no unloading.
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// VA-ECMO circuit (peripheral femoro-femoral)
// ---------------------------------------------------------------------------
function EcmoCircuit() {
  return (
    <Frame h={330}>
      {/* simplified body: heart and aorta */}
      <path d="M150,60 C120,90 120,140 160,160 C200,175 240,160 250,130 C258,100 240,70 210,60 Z" fill="rgba(200,80,90,0.08)" stroke={C.faint} />
      <T x={168} y={116} size={10} fill={C.soft}>
        heart
      </T>
      <path d="M230,64 C250,40 290,40 300,70 L300,250" fill="none" stroke={C.faint} strokeWidth={8} opacity={0.45} />
      <T x={308} y={150} size={10} fill={C.soft}>
        descending aorta
      </T>
      <path d="M170,170 L170,250" fill="none" stroke={C.faint} strokeWidth={8} opacity={0.35} />
      <T x={110} y={210} size={10} fill={C.soft}>
        IVC
      </T>
      {/* venous drainage cannula */}
      <path d="M170,150 L170,280 L170,300 C170,312 180,316 200,316 L400,316" fill="none" stroke={C.accent} strokeWidth={4} markerEnd="url(#arrowBlue)" />
      <T x={30} y={146} size={10} fill={C.accent}>
        drainage cannula tip
      </T>
      <T x={30} y={159} size={10} fill={C.accent}>
        at IVC/RA junction
      </T>
      {/* pump & oxygenator */}
      <circle cx={430} cy={300} r={24} fill="#0d1a33" stroke={C.ink} />
      <T x={430} y={304} anchor="middle" size={10} fill={C.ink}>
        pump
      </T>
      <rect x={470} y={190} width={56} height={64} rx={6} fill="#0d1a33" stroke={C.good} />
      <T x={498} y={218} anchor="middle" size={10} fill={C.good}>
        oxy-
      </T>
      <T x={498} y={231} anchor="middle" size={10} fill={C.good}>
        genator
      </T>
      <T x={498} y={182} anchor="middle" size={9.5} fill={C.soft}>
        sweep gas → CO₂
      </T>
      <path d="M454,300 C480,300 498,290 498,256" fill="none" stroke={C.accent} strokeWidth={4} markerEnd="url(#arrowBlue)" />
      {/* arterial return */}
      <path d="M498,190 C498,150 470,120 420,120 L340,120 C320,120 310,200 306,240" fill="none" stroke={C.art} strokeWidth={4} markerEnd="url(#arrowRed)" />
      <T x={380} y={112} size={10} fill={C.art}>
        return cannula (femoral artery)
      </T>
      <path d="M306,240 L304,196" fill="none" stroke={C.art} strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#arrowRed)" />
      <T x={318} y={262} size={9.5} fill={C.art}>
        retrograde aortic flow
      </T>
      {/* distal perfusion cannula */}
      <path d="M340,120 L340,200 C340,214 330,220 320,222" fill="none" stroke={C.art} strokeWidth={2} opacity={0.75} />
      <T x={350} y={200} size={9.5} fill={C.art}>
        distal perfusion cannula (limb)
      </T>
      {/* mixing zone */}
      <ellipse cx={292} cy={58} rx={30} ry={13} fill="rgba(245,179,1,0.12)" stroke={C.warn} strokeDasharray="3 3" />
      <T x={330} y={50} size={10} fill={C.warn}>
        mixing zone moves with native LV output
      </T>
      <T x={16} y={24} size={10} fill={C.faint}>
        Check right radial SpO₂/ABG: native output with poor lung function can perfuse the heart and brain with desaturated blood.
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// TAVI implant depth
// ---------------------------------------------------------------------------
function TaviDepth() {
  return (
    <Frame h={330}>
      {/* aorta / annulus */}
      <path d="M180,20 C180,80 170,120 190,150" fill="none" stroke={C.faint} strokeWidth={2} />
      <path d="M380,20 C380,80 390,120 370,150" fill="none" stroke={C.faint} strokeWidth={2} />
      <path d="M190,150 C210,170 230,175 280,175 C330,175 350,170 370,150" fill="none" stroke={C.soft} strokeWidth={2} />
      <line x1={150} y1={176} x2={420} y2={176} stroke={C.warn} strokeDasharray="5 4" />
      <T x={424} y={180} size={10} fill={C.warn}>
        annulus (cusp nadirs)
      </T>
      {/* LVOT and septum */}
      <path d="M190,150 C176,190 170,240 176,300" fill="none" stroke={C.faint} strokeWidth={2} />
      <path d="M370,150 C384,190 392,240 386,300" fill="none" stroke={C.faint} strokeWidth={2} />
      <rect x={168} y={182} width={10} height={36} fill="rgba(167,139,250,0.35)" stroke={C.violet} />
      <T x={40} y={196} size={10} fill={C.violet}>
        membranous septum
      </T>
      <circle cx={174} cy={230} r={5} fill={C.danger} />
      <T x={40} y={234} size={10} fill={C.danger}>
        conduction axis (His)
      </T>
      {/* valve frame */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={210 + i * 23} y1={60} x2={210 + i * 23} y2={204} stroke="#8a9bb4" strokeWidth={1.2} opacity={0.8} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M206,${68 + i * 19} L${352},${68 + i * 19}`} stroke="#8a9bb4" strokeWidth={1} opacity={0.5} />
      ))}
      <line x1={440} y1={176} x2={440} y2={204} stroke={C.good} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <T x={448} y={194} size={10} fill={C.good}>
        implant depth
      </T>
      <T x={448} y={207} size={9.5} fill={C.soft}>
        (below annulus)
      </T>
      <g transform="translate(16,262)">
        <T x={0} y={0} size={10} fill={C.soft}>
          Deeper implantation compresses the conduction tissue beneath the membranous septum: more LBBB and pacemakers.
        </T>
        <T x={0} y={16} size={10} fill={C.soft}>
          Too high risks embolisation, paravalvular leak or coronary obstruction. A short membranous septum lowers the margin.
        </T>
        <T x={0} y={32} size={10} fill={C.faint}>
          Target depth is device-specific: follow the manufacturer's guidance.
        </T>
      </g>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Medina classification
// ---------------------------------------------------------------------------
function Medina() {
  const combos = ["1,1,1", "1,1,0", "1,0,1", "0,1,1", "1,0,0", "0,1,0", "0,0,1"];
  const truth = new Set(["1,1,1", "1,0,1", "0,1,1"]);
  return (
    <Frame h={300}>
      <path d="M60,240 L170,150 L300,90" fill="none" stroke={C.vessel} strokeWidth={14} strokeLinecap="round" />
      <path d="M170,150 L240,230" fill="none" stroke={C.vessel} strokeWidth={10} strokeLinecap="round" />
      <circle cx={112} cy={197} r={13} fill="#0d1a33" stroke={C.warn} strokeWidth={2} />
      <T x={112} y={201} anchor="middle" size={11} fill={C.warn} weight={700}>1</T>
      <circle cx={240} cy={118} r={13} fill="#0d1a33" stroke={C.warn} strokeWidth={2} />
      <T x={240} y={122} anchor="middle" size={11} fill={C.warn} weight={700}>2</T>
      <circle cx={210} cy={196} r={13} fill="#0d1a33" stroke={C.warn} strokeWidth={2} />
      <T x={210} y={200} anchor="middle" size={11} fill={C.warn} weight={700}>3</T>
      <T x={40} y={270} size={10} fill={C.soft}>1 proximal main branch</T>
      <T x={250} y={80} size={10} fill={C.soft}>2 distal main branch</T>
      <T x={232} y={250} size={10} fill={C.soft}>3 side branch</T>
      <g transform="translate(360,40)">
        <T x={0} y={0} size={10.5} fill={C.ink} weight={600}>
          1 = ≥50% stenosis, 0 = not
        </T>
        {combos.map((c, i) => (
          <g key={c} transform={`translate(0,${22 + i * 22})`}>
            <rect x={0} y={-13} width={64} height={18} rx={4} fill={truth.has(c) ? "rgba(245,179,1,0.15)" : "rgba(255,255,255,0.03)"} stroke={truth.has(c) ? C.warn : C.line} />
            <T x={32} y={0} anchor="middle" size={11} fill={truth.has(c) ? C.warn : C.soft} weight={600}>
              {c}
            </T>
          </g>
        ))}
        <T x={76} y={22} size={9.5} fill={C.warn}>
          highlighted = "true" bifurcation
        </T>
        <T x={76} y={36} size={9.5} fill={C.soft}>
          (both main branch and side
        </T>
        <T x={76} y={50} size={9.5} fill={C.soft}>
          branch diseased)
        </T>
      </g>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Ellis perforation classification
// ---------------------------------------------------------------------------
function Ellis() {
  const panel = (x: number, title: string, desc: string[], draw: ReactNode) => (
    <g transform={`translate(${x},0)`} key={title}>
      <rect x={6} y={14} width={128} height={290} rx={6} fill="rgba(255,255,255,0.02)" stroke="#22262C" />
      <T x={70} y={34} anchor="middle" size={12} fill={C.ink} weight={700}>
        {title}
      </T>
      <path d="M70,52 L70,200" stroke={C.vessel} strokeWidth={12} strokeLinecap="round" />
      {draw}
      {desc.map((d, i) => (
        <T key={i} x={14} y={232 + i * 14} size={9.5} fill={C.soft}>
          {d}
        </T>
      ))}
    </g>
  );
  return (
    <Frame h={316}>
      {panel(0, "Type I", ["Extraluminal crater", "without extravasation"], <path d="M76,118 C92,112 98,126 92,134 C86,140 78,136 76,132" fill={C.vessel} opacity={0.9} />)}
      {panel(140, "Type II", ["Pericardial or myocardial", "blush, no jet of", "extravasation"], <ellipse cx={92} cy={126} rx={18} ry={22} fill="rgba(195,211,234,0.35)" />)}
      {panel(280, "Type III", ["Contrast streaming", "through a ≥1 mm", "exit hole"], (
        <g>
          <path d="M76,124 C100,118 116,120 128,112" stroke={C.vessel} strokeWidth={5} fill="none" />
          <path d="M100,116 L126,96 M104,128 L130,136" stroke={C.vessel} strokeWidth={2.5} opacity={0.7} />
        </g>
      ))}
      {panel(420, "Cavity spilling", ["Perforation into a", "chamber, e.g. LV,", "RV or coronary sinus"], (
        <g>
          <rect x={86} y={120} width={44} height={60} rx={10} fill="rgba(200,80,90,0.1)" stroke={C.faint} />
          <path d="M76,126 C90,130 98,140 108,150" stroke={C.vessel} strokeWidth={4} fill="none" />
          <ellipse cx={110} cy={156} rx={14} ry={10} fill="rgba(195,211,234,0.4)" />
        </g>
      ))}
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// NHLBI dissection classification
// ---------------------------------------------------------------------------
function NhlbiDissection() {
  const items: { k: string; d: string[]; draw: ReactNode }[] = [
    { k: "A", d: ["Small radiolucency in", "the lumen, clears with", "the contrast"], draw: <ellipse cx={60} cy={80} rx={3} ry={10} fill={C.bg} /> },
    { k: "B", d: ["Parallel tracts / double", "lumen during injection,", "little persistence"], draw: <line x1={60} y1={58} x2={60} y2={108} stroke={C.bg} strokeWidth={2} /> },
    { k: "C", d: ["Extraluminal cap that", "persists after contrast", "clears"], draw: <path d="M68,70 C82,66 84,84 70,88" fill={C.vessel} /> },
    { k: "D", d: ["Spiral filling", "defect"], draw: <path d="M52,54 C70,64 50,74 68,84 C52,94 70,102 54,112" stroke={C.bg} strokeWidth={2.5} fill="none" /> },
    { k: "E", d: ["New persistent", "filling defect"], draw: <rect x={52} y={74} width={16} height={18} rx={4} fill={C.bg} /> },
    { k: "F", d: ["Any of the above with", "reduced flow or total", "occlusion"], draw: <rect x={50} y={88} width={20} height={36} fill={C.bg} /> },
  ];
  return (
    <Frame h={300}>
      {items.map((it, i) => (
        <g key={it.k} transform={`translate(${10 + i * 92},10)`}>
          <rect x={0} y={0} width={86} height={278} rx={6} fill="rgba(255,255,255,0.02)" stroke="#22262C" />
          <T x={43} y={22} anchor="middle" size={13} fill={i >= 2 ? C.warn : C.ink} weight={700}>
            {it.k}
          </T>
          <g transform="translate(-17,10)">
            <path d="M60,40 L60,140" stroke={C.vessel} strokeWidth={14} strokeLinecap="round" />
            {it.draw}
          </g>
          {it.d.map((l, j) => (
            <T key={j} x={6} y={186 + j * 13} size={9} fill={C.soft}>
              {l}
            </T>
          ))}
        </g>
      ))}
      <T x={12} y={296} size={9.5} fill={C.faint}>
        Types C–F carry a substantially higher risk of acute closure and usually need treatment (highlighted).
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// CTO crossing strategy (simplified hybrid approach)
// ---------------------------------------------------------------------------
function CtoAlgorithm() {
  const box = (x: number, y: number, w: number, h: number, lines: string[], col = C.accent) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#0d1a33" stroke={col} />
      {lines.map((l, i) => (
        <T key={i} x={x + w / 2} y={y + 16 + i * 13} anchor="middle" size={10} fill={C.ink}>
          {l}
        </T>
      ))}
    </g>
  );
  const arrow = (d: string) => <path d={d} fill="none" stroke={C.soft} strokeWidth={1.4} markerEnd="url(#arrow)" />;
  return (
    <Frame w={600} h={340}>
      {box(200, 10, 200, 34, ["Dual injection · study the angiogram"])}
      {arrow("M300,44 L300,62")}
      {box(150, 62, 300, 60, ["Assess four features:", "proximal cap · lesion length (≥20 mm?)", "distal target quality · interventional collaterals"], C.warn)}
      {arrow("M200,122 L110,160")}
      {arrow("M300,122 L300,160")}
      {arrow("M400,122 L490,160")}
      {box(20, 160, 180, 60, ["Clear cap, short lesion", "→ antegrade wire", "escalation"])}
      {box(210, 160, 180, 60, ["Clear cap, long lesion,", "good distal target", "→ antegrade dissection/re-entry"])}
      {box(400, 160, 180, 60, ["Ambiguous cap or poor", "distal target, usable", "collaterals → retrograde"])}
      {arrow("M110,220 L250,268")}
      {arrow("M300,220 L300,262")}
      {arrow("M490,220 L350,268")}
      {box(150, 262, 300, 44, ["No progress? Switch strategy early", "(time, contrast, radiation budgets)"], C.good)}
      <T x={12} y={332} size={9.5} fill={C.faint}>
        Simplified teaching summary of hybrid-style decision making. Real practice adds IVUS-guided cap puncture and other options.
      </T>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Balloon / stent compliance (illustrative)
// ---------------------------------------------------------------------------
function StentCompliance() {
  const sx = (atm: number) => 60 + atm * 23;
  const sy = (mm: number) => 270 - (mm - 2.6) * 300;
  const sc: Pt[] = Array.from({ length: 17 }, (_, i) => {
    const a = 4 + i * 0.75;
    return [a, 3.0 + (a - 8) * 0.035];
  });
  const nc: Pt[] = Array.from({ length: 13 }, (_, i) => {
    const a = 8 + i;
    return [a, 3.0 + (a - 12) * 0.015];
  });
  return (
    <Frame h={320}>
      {[0, 4, 8, 12, 16, 20].map((a) => (
        <g key={a}>
          <line x1={sx(a)} y1={40} x2={sx(a)} y2={276} stroke="rgba(255,255,255,0.05)" />
          <T x={sx(a)} y={292} anchor="middle" size={9.5} fill={C.faint}>
            {a}
          </T>
        </g>
      ))}
      {[2.8, 3.0, 3.2, 3.4].map((d) => (
        <g key={d}>
          <line x1={56} y1={sy(d)} x2={540} y2={sy(d)} stroke="rgba(255,255,255,0.05)" />
          <T x={50} y={sy(d) + 3.5} anchor="end" size={9.5} fill={C.faint}>
            {d.toFixed(1)}
          </T>
        </g>
      ))}
      <T x={300} y={310} anchor="middle" size={10} fill={C.soft}>
        inflation pressure (atm)
      </T>
      <T x={14} y={30} size={10} fill={C.soft}>
        diameter (mm)
      </T>
      <path d={path(sc, sx, sy)} fill="none" stroke={C.cyan} strokeWidth={2.2} />
      <path d={path(nc, sx, sy)} fill="none" stroke={C.warn} strokeWidth={2.2} />
      <circle cx={sx(8)} cy={sy(3.0)} r={4} fill={C.cyan} />
      <T x={sx(8) - 6} y={sy(3.0) - 8} anchor="end" size={9.5} fill={C.cyan}>
        nominal
      </T>
      <circle cx={sx(14)} cy={sy(3.21)} r={4} fill={C.danger} />
      <T x={sx(14) - 4} y={sy(3.21) - 9} anchor="end" size={9.5} fill={C.danger}>
        RBP
      </T>
      <circle cx={sx(12)} cy={sy(3.0)} r={4} fill={C.warn} />
      <T x={sx(12) + 6} y={sy(3.0) + 16} size={9.5} fill={C.warn}>
        nominal
      </T>
      <circle cx={sx(20)} cy={sy(3.12)} r={4} fill={C.danger} />
      <T x={sx(20) - 4} y={sy(3.12) + 18} anchor="end" size={9.5} fill={C.danger}>
        RBP
      </T>
      <g transform="translate(70,52)">
        <line x1={0} y1={0} x2={22} y2={0} stroke={C.cyan} strokeWidth={2.2} />
        <T x={28} y={4} size={10} fill={C.soft}>
          semi-compliant: grows appreciably with pressure (predilatation)
        </T>
        <line x1={0} y1={16} x2={22} y2={16} stroke={C.warn} strokeWidth={2.2} />
        <T x={28} y={20} size={10} fill={C.soft}>
          non-compliant: nearly fixed diameter, high pressure (post-dilatation)
        </T>
      </g>
      <T x={300} y={252} anchor="middle" size={9.5} fill={C.faint}>
        Illustrative curves for a 3.0 mm device. Always read the actual compliance chart on the packaging.
      </T>
    </Frame>
  );
}

const FIGURES: Record<FigureId, () => JSX.Element> = {
  "coronary-tree": CoronaryTree,
  "aha-segments": AhaSegments,
  "views-compass": ViewsCompass,
  wiggers: Wiggers,
  "rhc-waveforms": RhcWaveforms,
  "iabp-timing": IabpTiming,
  "impella-position": ImpellaPosition,
  "ecmo-circuit": EcmoCircuit,
  "tavi-depth": TaviDepth,
  medina: Medina,
  ellis: Ellis,
  "nhlbi-dissection": NhlbiDissection,
  "cto-algorithm": CtoAlgorithm,
  "stent-compliance": StentCompliance,
};

export default function Figure({ id, caption }: { id: FigureId; caption?: string }) {
  const F = FIGURES[id];
  return (
    <figure className="my-4">
      <div className="border border-line rounded-lg overflow-hidden">{F ? <F /> : null}</div>
      {caption && <figcaption className="text-[12px] text-ink-faint mt-1.5 leading-snug">{caption}</figcaption>}
    </figure>
  );
}
