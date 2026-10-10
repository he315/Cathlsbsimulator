import { useRef } from "react";
import {
  prevZone,
  directionOf,
  ZONE_LEN,
  type LeadState,
  type LeadZone,
  type AccessRoute,
  type TipDirection,
} from "../../simulation/pacing";

// ---------------------------------------------------------------------------
// Fluoroscopy schematic for temporary pacing: AP and lateral projections of
// the chest with the lead drawn along its course. Positive-contrast grey
// image (dense structures darker) like the cath-lab fluoro. In the lateral
// view anterior is on the LEFT of the image, so the right ventricle (anterior)
// and the coronary sinus (posterior, in the AV groove) separate clearly.
// ---------------------------------------------------------------------------

type Pt = readonly [number, number];
export type FluoroView = "ap" | "lat";

const SUP: Record<FluoroView, Partial<Record<LeadZone, Pt[]>>> = {
  ap: {
    ra: [[106, 92], [100, 112], [100, 132], [110, 150]],
    "rv-inflow": [[110, 150], [126, 156], [142, 160]],
    "rv-apex": [[142, 160], [158, 168], [172, 178]],
    "rv-septum": [[142, 160], [148, 148], [150, 136]],
    rvot: [[142, 160], [150, 142], [150, 120], [144, 102]],
    pa: [[144, 102], [152, 90], [168, 84], [184, 90]],
    cs: [[110, 150], [130, 150], [150, 140], [166, 124], [178, 108]],
    raa: [[110, 150], [112, 128], [118, 106]],
    ivc: [[110, 150], [111, 175], [112, 200]],
    hepatic: [[112, 200], [98, 208], [80, 220]],
    perforated: [[172, 178], [182, 185]],
  },
  lat: {
    ra: [[134, 92], [138, 112], [138, 132], [128, 150]],
    "rv-inflow": [[128, 150], [110, 158], [92, 164]],
    "rv-apex": [[92, 164], [74, 174], [60, 182]],
    "rv-septum": [[92, 164], [100, 152], [108, 142]],
    rvot: [[92, 164], [80, 142], [78, 118], [86, 100]],
    pa: [[86, 100], [100, 88], [120, 84], [140, 88]],
    cs: [[128, 150], [150, 150], [166, 138], [174, 120], [172, 102]],
    raa: [[128, 150], [112, 128], [100, 108]],
    ivc: [[128, 150], [138, 175], [144, 200]],
    hepatic: [[144, 200], [124, 210], [104, 222]],
    perforated: [[60, 182], [50, 189]],
  },
};

const SVC_RIJ: Record<FluoroView, Pt[]> = {
  ap: [[96, 0], [100, 30], [104, 60], [106, 92]],
  lat: [[140, 0], [138, 30], [136, 62], [134, 92]],
};
const SVC_LSC: Record<FluoroView, Pt[]> = {
  ap: [[204, 20], [164, 32], [126, 46], [108, 64], [106, 92]],
  lat: [[150, 14], [146, 40], [140, 64], [134, 92]],
};

const FEM: Record<FluoroView, Partial<Record<LeadZone, Pt[]>>> = {
  ap: {
    ivc: [[118, 240], [115, 216], [112, 192]],
    ra: [[112, 192], [110, 165], [103, 140], [102, 118], [106, 98]],
    hepatic: [[112, 192], [98, 200], [84, 212]],
    svc: [[106, 98], [105, 70], [103, 40]],
    "rv-inflow": [[106, 98], [96, 112], [94, 134], [104, 150], [124, 156], [142, 160]],
    cs: [[106, 98], [100, 122], [108, 146], [130, 150], [150, 140], [166, 124], [178, 108]],
  },
  lat: {
    ivc: [[150, 240], [148, 216], [144, 192]],
    ra: [[144, 192], [140, 165], [138, 140], [136, 118], [134, 98]],
    hepatic: [[144, 192], [126, 202], [108, 212]],
    svc: [[134, 98], [136, 70], [138, 40]],
    "rv-inflow": [[134, 98], [124, 112], [122, 132], [128, 148], [110, 158], [92, 164]],
    cs: [[134, 98], [140, 122], [132, 146], [150, 150], [166, 138], [174, 120], [172, 102]],
  },
};

const FEM_LOOP: Record<FluoroView, Pt[]> = {
  ap: [[96, 110], [93, 128], [99, 140]],
  lat: [[126, 110], [123, 128], [128, 140]],
};

function zonePts(route: AccessRoute, zone: LeadZone, view: FluoroView): Pt[] {
  if (zone === "svc" && route !== "femoral") return route === "left-subclavian" ? SVC_LSC[view] : SVC_RIJ[view];
  if (route === "femoral" && FEM[view][zone]) return FEM[view][zone]!;
  return SUP[view][zone] ?? [];
}

function chain(lead: LeadState): LeadZone[] {
  const zones: LeadZone[] = [lead.zone];
  let l: LeadState = lead;
  for (let i = 0; i < 12; i++) {
    const p = prevZone(l);
    if (!p) break;
    zones.unshift(p);
    l = { ...l, zone: p };
  }
  return zones;
}

function partial(pts: Pt[], f: number): Pt[] {
  if (pts.length < 2) return pts;
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let want = Math.max(0, Math.min(1, f)) * total;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = segs[i - 1];
    if (want >= d) {
      out.push(pts[i]);
      want -= d;
    } else {
      const r = d > 0 ? want / d : 0;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
      break;
    }
  }
  return out;
}

export function leadPolyline(lead: LeadState, view: FluoroView): Pt[] {
  if (lead.route === "epicardial") return [];
  const zs = chain(lead);
  const out: Pt[] = [];
  zs.forEach((z, i) => {
    const pts = zonePts(lead.route, z, view);
    const last = i === zs.length - 1;
    const use = last ? partial(pts, lead.pos / ZONE_LEN[z]) : pts;
    use.forEach((p, k) => {
      if (out.length && k === 0) return;
      out.push(p);
    });
  });
  if (lead.zone === "ra" && lead.loop && lead.route === "femoral") out.push(...FEM_LOOP[view]);
  return out;
}

const DIR_VEC: Record<FluoroView, Record<TipDirection, Pt>> = {
  ap: { tv: [1, 0.35], posterior: [0.35, -0.25], lateral: [-1, 0], superior: [0.2, -1] },
  lat: { tv: [-1, 0.25], posterior: [1, 0], lateral: [0.15, 0.35], superior: [-0.3, -1] },
};

export function FluoroImage({
  view,
  lead,
  live,
  label,
  onDrag,
  hint,
}: {
  view: FluoroView;
  lead: LeadState | null;
  live: boolean;
  label: string;
  onDrag?: (dx: number, dy: number) => void;
  hint?: string;
}) {
  const dragging = useRef(false);
  const pts = lead ? leadPolyline(lead, view) : [];
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const tip = pts[pts.length - 1];
  const dirV = lead ? DIR_VEC[view][directionOf(lead.rot)] : ([0, 0] as Pt);
  const fid = `fl-${view}`;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 240 240"
        className={`w-full aspect-square block rounded-md border border-line ${onDrag ? "cursor-grab touch-none" : ""}`}
        onPointerDown={(e) => {
          if (!onDrag) return;
          dragging.current = true;
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current && onDrag) onDrag(e.movementX, e.movementY);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <defs>
          <radialGradient id={`${fid}-bg`} cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#a9afb6" />
            <stop offset="70%" stopColor="#7d838b" />
            <stop offset="100%" stopColor="#30353b" />
          </radialGradient>
          <filter id={`${fid}-noise`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={view === "ap" ? 3 : 7} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
          </filter>
          <filter id={`${fid}-soft`}>
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <rect width="240" height="240" fill={`url(#${fid}-bg)`} />
        {view === "ap" ? <ApAnatomy fid={fid} /> : <LatAnatomy fid={fid} />}
        {lead?.route === "epicardial" && <EpicardialWires view={view} />}
        {d && (
          <g opacity={live ? 1 : 0.75}>
            <path d={d} stroke="#1a1d21" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} stroke="#3a3f45" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {tip && (
              <>
                <path
                  d={`M ${tip[0]} ${tip[1]} q ${dirV[0] * 4} ${dirV[1] * 4} ${dirV[0] * 7} ${dirV[1] * 7}`}
                  stroke="#111315"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx={tip[0] + dirV[0] * 7} cy={tip[1] + dirV[1] * 7} r={2.6} fill="#0b0c0d" />
                <rect x={tip[0] + dirV[0] * 3 - 1.6} y={tip[1] + dirV[1] * 3 - 1.6} width={3.2} height={3.2} fill="#0b0c0d" />
              </>
            )}
          </g>
        )}
        <rect width="240" height="240" filter={`url(#${fid}-noise)`} opacity={live ? 1 : 0.4} />
        {view === "lat" && (
          <>
            <text x="6" y="232" fontSize="9" fill="#1d2329" fontFamily="ui-monospace, monospace">ANT</text>
            <text x="212" y="232" fontSize="9" fill="#1d2329" fontFamily="ui-monospace, monospace">POST</text>
          </>
        )}
        {view === "ap" && (
          <>
            <text x="6" y="232" fontSize="9" fill="#1d2329" fontFamily="ui-monospace, monospace">R</text>
            <text x="226" y="232" fontSize="9" fill="#1d2329" fontFamily="ui-monospace, monospace">L</text>
          </>
        )}
        {!live && (
          <rect width="240" height="240" fill="#0E1013" opacity={0.25} />
        )}
      </svg>
      <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[12px] font-mono">
        <span className="text-[#0d1116] font-semibold">{label}</span>
      </div>
      <div className="absolute top-1.5 right-2 text-[12px] font-mono">
        {live ? <span className="text-danger animate-pulseline">● FLUORO</span> : <span className="text-[#3b2a00]">◌ LIH</span>}
      </div>
      {hint && <div className="absolute bottom-1.5 left-0 right-0 text-center text-[12px] text-[#1d2329]">{hint}</div>}
    </div>
  );
}

function ApAnatomy({ fid }: { fid: string }) {
  return (
    <g>
      {/* lungs slightly lucent */}
      <path d="M30 40 Q60 20 104 30 L104 200 Q60 214 26 196 Z" fill="#c4c9cf" opacity={0.25} />
      <path d="M136 30 Q186 20 214 42 L218 198 Q180 214 136 202 Z" fill="#c4c9cf" opacity={0.25} />
      {/* ribs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} opacity={0.22} stroke="#4b5158" strokeWidth={3} fill="none">
          <path d={`M112 ${34 + i * 22} Q70 ${26 + i * 22} 30 ${48 + i * 24}`} />
          <path d={`M128 ${34 + i * 22} Q170 ${26 + i * 22} 212 ${48 + i * 24}`} />
        </g>
      ))}
      {/* clavicles */}
      <path d="M40 22 Q80 30 112 26" stroke="#4b5158" strokeWidth={4} fill="none" opacity={0.35} />
      <path d="M128 26 Q160 30 200 22" stroke="#4b5158" strokeWidth={4} fill="none" opacity={0.35} />
      {/* spine */}
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={111} y={6 + i * 22} width={18} height={18} rx={3} fill="#5c6269" opacity={0.45} />
      ))}
      {/* cardiac silhouette */}
      <path
        filter={`url(#${fid}-soft)`}
        d="M104 78 Q92 92 94 118 Q92 150 100 176 Q112 196 150 198 Q190 196 200 178 Q206 150 186 122 Q170 98 150 84 Q140 72 122 70 Q110 70 104 78 Z"
        fill="#555b62"
        opacity={0.6}
      />
      {/* aortic knuckle and PA */}
      <path filter={`url(#${fid}-soft)`} d="M118 60 Q136 48 150 58 Q156 70 146 80 L124 80 Z" fill="#5c6269" opacity={0.5} />
      {/* diaphragm */}
      <path d="M20 200 Q60 178 112 196" stroke="#4a5057" strokeWidth={5} fill="none" opacity={0.55} />
      <path d="M128 202 Q180 186 224 206" stroke="#4a5057" strokeWidth={5} fill="none" opacity={0.55} />
      <path d="M20 200 Q60 178 112 196 L112 240 L20 240 Z" fill="#5c6269" opacity={0.35} />
      <path d="M128 202 Q180 186 224 206 L224 240 L128 240 Z" fill="#5c6269" opacity={0.3} />
    </g>
  );
}

function LatAnatomy({ fid }: { fid: string }) {
  return (
    <g>
      {/* sternum (anterior, left of image) */}
      <rect x={20} y={30} width={10} height={150} rx={4} fill="#4b5158" opacity={0.45} />
      {/* spine (posterior, right) */}
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={190} y={6 + i * 22} width={24} height={18} rx={3} fill="#5c6269" opacity={0.5} />
      ))}
      {/* cardiac silhouette */}
      <path
        filter={`url(#${fid}-soft)`}
        d="M40 150 Q38 110 70 92 Q100 76 136 82 Q166 92 174 126 Q178 160 160 186 Q130 204 86 200 Q48 194 40 150 Z"
        fill="#555b62"
        opacity={0.6}
      />
      {/* aorta / PA */}
      <path filter={`url(#${fid}-soft)`} d="M96 84 Q120 50 156 56 Q170 66 162 80 L130 86 Z" fill="#5c6269" opacity={0.45} />
      {/* diaphragm */}
      <path d="M14 198 Q100 176 226 206" stroke="#4a5057" strokeWidth={5} fill="none" opacity={0.55} />
      <path d="M14 198 Q100 176 226 206 L226 240 L14 240 Z" fill="#5c6269" opacity={0.32} />
    </g>
  );
}

function EpicardialWires({ view }: { view: FluoroView }) {
  // sternal wires and two thin epicardial pacing wires exiting below the sternum
  if (view === "ap")
    return (
      <g stroke="#1a1d21" fill="none">
        {[60, 80, 100, 120, 140].map((y) => (
          <ellipse key={y} cx={120} cy={y} rx={6} ry={2.5} strokeWidth={1.6} />
        ))}
        <path d="M150 190 Q140 205 130 228" strokeWidth={1} />
        <path d="M156 188 Q146 206 136 230" strokeWidth={1} />
      </g>
    );
  return (
    <g stroke="#1a1d21" fill="none">
      {[60, 80, 100, 120, 140].map((y) => (
        <ellipse key={y} cx={26} cy={y} rx={2} ry={3} strokeWidth={1.6} />
      ))}
      <path d="M60 190 Q40 205 30 228" strokeWidth={1} />
    </g>
  );
}
