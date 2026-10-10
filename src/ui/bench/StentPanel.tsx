// IVUS and OCT bench, step 3: choose, place and deploy the stent
// (pci-bench-imaging-unify; platforms, positioning and rapid pacing from
// pci-bench-stent-platforms-sizing).
//
// The stent is one of the generic platforms of src/simulation/bench/platforms.ts:
// its sizes, lengths and labelled post-dilatation limit by size band, its strut
// thickness and cell design, and where its stent ends sit against the delivery
// balloon's markers. Pressures and the compliance chart are the catalogue's
// drug-eluting stent (src/simulation/pci/equipment.ts). The stent is placed by
// its proximal marker, as on fluoroscopy; the drawing shows the marker bands and
// the stent edges apart (just inside the markers on most platforms, centred on
// them on one; cp-ostial-stent), the recorded predilatation the stent must
// cover, and the ostium of an aorto-ostial lesion. When the lesion makes the
// stent swing with each beat the drawing swings with it, unless rapid pacing is
// chosen for the deployment.
import {
  injuredSegments,
  plaqueBurden,
  stentDiameter,
  stentPressures,
  stentPlatform,
  type BenchLesion,
  type BenchState,
  type Stent,
} from "../../simulation/pciBench";
import { PLATFORMS, nearestOffered, type StentPlatform } from "../../simulation/bench/platforms";
import { deliveryLayout, markerRelation } from "../../simulation/pci/stentGeometry";
import { BenchPicker } from "./ImagePanel";

export interface StentPanelProps {
  lesion: BenchLesion;
  stent: Stent;
  setStent: (f: (s: Stent) => Stent) => void;
  deploy: () => void;
  /** the procedure so far, for the predilatations recorded on the bench (the scenario's own record shows without it) */
  state?: BenchState | null;
}

/** Cardiac cycle of the swing animation (s) — MODEL PARAMETER (a resting rate of about 75 per minute). */
const MP_BEAT_S = 0.8;

const um = (mm: number) => `${Math.round(mm * 1000)} µm`;

/** One line describing a platform for the picker: sizes, limit for the size, struts, cells and markers. */
export function platformFacts(p: StentPlatform, nominal: number): string {
  const sizes = `${Math.min(...p.diameters).toFixed(2)}–${Math.max(...p.diameters).toFixed(2)} mm`;
  const markers = markerRelation(p.design) === "centred" ? "stent ends at the centre of each marker" : "stent just inside the markers";
  return `${sizes}; labelled post-dilatation limit for ${nominal.toFixed(2)} mm: ${p.limit(nominal).toFixed(2)} mm; struts ${um(p.design.strutMm)}; ${p.cell} cell; ${markers}.`;
}

/**
 * The delivery system on the vessel axis: the recorded predilatation, the ostium, the stent and its two marker
 * bands, and a magnified view of the proximal end where the marker and the stent edge are told apart.
 */
export function DeliveryDrawing({ lesion: l, stent, state, swingMm }: { lesion: BenchLesion; stent: Stent; state?: BenchState | null; swingMm: number }) {
  const p = stentPlatform(stent);
  const lay = deliveryLayout(p.design, stent.lengthMm);
  const W = 360,
    pad = 12,
    axisY = 46;
  const sx = (mm: number) => pad + ((W - 2 * pad) * mm) / l.segmentMm;
  const scale = (W - 2 * pad) / l.segmentMm;
  const x0 = stent.proxEdge;
  const injured = injuredSegments(l, state);
  // the magnified proximal end: 4 mm either side of the proximal stent edge, in its own scale
  const ZW = 150,
    zoom = ZW / 6;
  const zx = (mm: number) => 8 + (mm - (lay.markers[0][0] - 1)) * zoom;
  const swing = swingMm > 0 ? (
    <animateTransform attributeName="transform" type="translate" values={`0 0; ${(swingMm * scale).toFixed(1)} 0; 0 0; ${(-swingMm * scale).toFixed(1)} 0; 0 0`} dur={`${MP_BEAT_S}s`} repeatCount="indefinite" />
  ) : null;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} 164`} role="img" aria-label={`Delivery system: ${p.label}, stent and marker bands on the vessel axis`} className="w-full min-w-[300px]">
        {l.ostial && (
          <g>
            <rect x={sx(0)} y={18} width={sx(l.ostial.aortaMm) - sx(0)} height={56} fill="#1B1F24" />
            <text x={sx(0) + 2} y={30} fontSize={11} fill="#858D99">
              aorta
            </text>
            <line x1={sx(l.ostial.aortaMm)} y1={16} x2={sx(l.ostial.aortaMm)} y2={76} stroke="#858D99" strokeDasharray="3 2" data-part="ostium" />
          </g>
        )}
        <line x1={sx(0)} y1={axisY} x2={sx(l.segmentMm)} y2={axisY} stroke="#2E343C" strokeWidth={10} strokeLinecap="round" />
        {injured.map((g, i) => (
          <g key={i} data-part="injured">
            <rect x={sx(g.fromMm)} y={66} width={Math.max(1, sx(g.toMm) - sx(g.fromMm))} height={4} fill="#E9B95A" opacity={0.8} />
            <text x={sx(g.fromMm)} y={82} fontSize={11} fill="#E9B95A">
              {g.cause === "dissection" ? "dissected" : "predilated"} {g.fromMm.toFixed(0)}–{g.toMm.toFixed(0)} mm
            </text>
          </g>
        ))}
        <g data-part="delivery">
          {swing}
          <line x1={sx(x0 + lay.markers[0][0] - 3)} y1={axisY} x2={sx(x0 + lay.markers[1][1] + 3)} y2={axisY} stroke="#A6ADB8" strokeWidth={1.5} />
          <rect data-part="stent" x={sx(x0)} y={axisY - 6} width={Math.max(1, stent.lengthMm * scale)} height={12} fill="none" stroke="#A6ADB8" strokeWidth={1} strokeDasharray="2 1.5" />
          {lay.markers.map(([a, b], i) => (
            <rect key={i} data-part="marker-band" x={sx(x0 + a)} y={axisY - 4} width={Math.max(2, (b - a) * scale)} height={8} fill="#ECEEF1" />
          ))}
        </g>
        {/* the proximal end, magnified: marker band and stent edge */}
        <g transform="translate(0 106)">
          <text x={8} y={0} fontSize={11} fill="#858D99">
            Proximal end, magnified
          </text>
          <line x1={zx(lay.markers[0][0] - 1)} y1={30} x2={zx(lay.markers[0][0] + 5)} y2={30} stroke="#A6ADB8" strokeWidth={1.5} />
          <rect data-part="stent-zoom" x={zx(0)} y={20} width={zx(lay.markers[0][0] + 5) - zx(0)} height={20} fill="none" stroke="#A6ADB8" strokeDasharray="3 2" />
          <rect data-part="marker-zoom" x={zx(lay.markers[0][0])} y={23} width={(lay.markers[0][1] - lay.markers[0][0]) * zoom} height={14} fill="#ECEEF1" />
          <line data-part="stent-edge" x1={zx(0)} y1={12} x2={zx(0)} y2={48} stroke="#4F8EF7" strokeWidth={1.5} />
          <text x={ZW + 18} y={26} fontSize={11} fill="#A6ADB8">
            stent edge (blue)
          </text>
          <text x={ZW + 18} y={40} fontSize={11} fill="#A6ADB8">
            {lay.edgeFromMarkerCentreMm > 1e-6 ? `${lay.edgeFromMarkerCentreMm.toFixed(1)} mm inside the marker centre` : "at the marker centre"}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function StentPanel({ lesion: l, stent, setStent, deploy, state }: StentPanelProps) {
  const platform = stentPlatform(stent);
  const p = stentPressures(stent.diameter);
  const edge = deliveryLayout(platform.design, stent.lengthMm).edgeFromMarkerCentreMm;
  const marker = stent.proxEdge - edge;
  const distal = Math.min(l.segmentMm, stent.proxEdge + stent.lengthMm);
  const swinging = !!l.motion && !stent.rapidPacing;
  const choose = (next: StentPlatform) =>
    setStent((s) => {
      // the proximal marker stays where it was placed; the stent edge follows the new platform's geometry
      const keepMarker = s.proxEdge - deliveryLayout(stentPlatform(s).design, s.lengthMm).edgeFromMarkerCentreMm;
      const diameter = nearestOffered(next.diameters, s.diameter);
      const lengthMm = nearestOffered(next.lengths, s.lengthMm);
      return { ...s, platformId: next.id, diameter, lengthMm, proxEdge: keepMarker + deliveryLayout(next.design, lengthMm).edgeFromMarkerCentreMm };
    });
  const placeMarker = (m: number) => setStent((s) => ({ ...s, proxEdge: m + deliveryLayout(stentPlatform(s).design, s.lengthMm).edgeFromMarkerCentreMm }));
  return (
    <div className="panel p-4 space-y-3 text-[13px]">
      <div className="stat-label">Stent</div>
      <div>
        <div className="text-ink-soft mb-1">Platform</div>
        <div className="seg flex-wrap" role="group" aria-label="Platform">
          {PLATFORMS.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === platform.id} className={`seg-btn ${x.id === platform.id ? "seg-btn-active" : ""}`} onClick={() => choose(x)}>
              {x.id}
            </button>
          ))}
        </div>
        <div className="mt-1 text-[12px] text-ink-soft">{platform.summary}</div>
        <div className="text-[12px] text-ink-faint">{platformFacts(platform, stent.diameter)}</div>
      </div>
      <BenchPicker label="Diameter (nominal, mm)" values={platform.diameters} value={stent.diameter} fmt={(d) => d.toFixed(2)} onChange={(d) => setStent((s) => ({ ...s, diameter: d }))} />
      <BenchPicker
        label="Length (mm)"
        values={platform.lengths}
        value={stent.lengthMm}
        fmt={(d) => `${d}`}
        onChange={(d) => setStent((s) => ({ ...s, lengthMm: d, proxEdge: marker + deliveryLayout(stentPlatform(s).design, d).edgeFromMarkerCentreMm }))}
      />
      <div>
        <div className="flex justify-between text-ink-soft">
          <span>Proximal marker</span>
          <span className="font-mono">
            {marker.toFixed(1)} mm · stent {stent.proxEdge.toFixed(1)}–{distal.toFixed(1)} mm
          </span>
        </div>
        <input type="range" aria-label="Proximal marker position (mm)" min={0} max={l.segmentMm - 4} step={0.25} value={marker} onChange={(e) => placeMarker(Number(e.target.value))} className="w-full" />
      </div>
      <DeliveryDrawing lesion={l} stent={stent} state={state} swingMm={swinging ? l.motion!.amplitudeMm : 0} />
      {l.motion && <div className="text-[12px] text-warn">{stent.rapidPacing ? "Rapid pacing during deployment: the stent is steady." : "The stent swings with each beat."}</div>}
      <label className="flex items-center gap-2 text-ink-soft">
        <input type="checkbox" checked={!!stent.rapidPacing} onChange={(e) => setStent((s) => ({ ...s, rapidPacing: e.target.checked }))} />
        Rapid pacing during deployment
      </label>
      <div>
        <div className="flex justify-between text-ink-soft">
          <span>Deployment pressure</span>
          <span className="font-mono">
            {stent.atm} atm → {stentDiameter(stent.diameter, stent.atm).toFixed(2)} mm
          </span>
        </div>
        <input type="range" aria-label="Deployment pressure (atm)" min={6} max={p.rbpAtm + 4} step={1} value={stent.atm} onChange={(e) => setStent((s) => ({ ...s, atm: Number(e.target.value) }))} className="w-full" />
        <div className="text-[12px] text-ink-faint">
          Device chart: nominal {p.nominalAtm} atm, rated burst {p.rbpAtm} atm; do not dilate beyond {platform.limit(stent.diameter).toFixed(2)} mm.
        </div>
      </div>
      <div className="text-[12px] text-ink-soft">
        Edges: proximal at plaque burden {(plaqueBurden(l, stent.proxEdge) * 100).toFixed(0)}%, distal at {(plaqueBurden(l, distal) * 100).toFixed(0)}%.
      </div>
      <button type="button" className="btn btn-accent" onClick={deploy}>
        Deploy → optimise
      </button>
    </div>
  );
}
