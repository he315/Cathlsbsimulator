// The pressure wire in the vessel, as fluoroscopy shows it: the guide, the wire with its sensor
// (the proximal end of the radiopaque segment, 3 cm from the tip) and the narrowings the angiogram
// shows. Dragging the slider advances or withdraws the wire. Extracted from the physiology lab so
// that the PCI lab's pressure-wire console uses the same strip (physiology-engine-unify-and-setup).
// Positions are in mm beyond the guide tip; negative is inside the guide.
//
// A branched case (physiology-left-main-and-ostial) passes `branches`: the strip is then the path
// left main → the branch the wire is in, the other branch leaves at the bifurcation, and a selector
// under the strip puts the wire in the LAD or the circumflex. A lesion's `looksDs` (how narrow the
// angiogram shows it, a jailed ostium looking worse than it is) is what the strip draws and labels.

export interface StripLesion {
  id: string;
  /** position along the vessel 0..1 and diameter stenosis 0..1 (physiology.ts Lesion) */
  pos: number;
  ds: number;
  lengthMm: number;
  /** the stenosis as the angiogram shows it, when it differs from ds (physiology.ts Lesion.looksDs) */
  looksDs?: number;
}

/** A left main with its branches: the strip shows the path into the active branch. */
export interface StripBranches {
  /** length of the left main, mm beyond the guide tip (the bifurcation) */
  lmMm: number;
  options: readonly { id: string; label: string }[];
  /** the branch the wire is in */
  active: string;
  /** put the wire in another branch (absent: the selector is read-only) */
  onSelect?: (id: string) => void;
}

export interface VesselStripProps {
  lesions: readonly StripLesion[];
  treated?: readonly string[];
  /** vessel length, mm, and diffuse atheroma (physiology.ts CoronaryCase) */
  lengthMm: number;
  diffuse?: number;
  /** sensor position, mm beyond the guide tip */
  sensorMm: number;
  /** distance of the sensor behind the wire tip, mm */
  sensorFromTipMm: number;
  /** the wire is in the guide (otherwise only the guide is drawn) */
  wireIn: boolean;
  guideEngaged: boolean;
  /** the wire has gone into the side branch at the bifurcation, this far beyond the guide tip (mm) */
  sideBranch?: { atMm: number; active: boolean; label: string };
  /** a branched case: the left main and the branch the wire is in */
  branches?: StripBranches;
  onSensor?: (mm: number) => void;
  disabled?: boolean;
}

/** What the angiogram shows of a lesion (its looksDs when set). */
export const shownDs = (l: StripLesion) => l.looksDs ?? l.ds;

export default function VesselStrip({ lesions, treated = [], lengthMm, diffuse = 0, sensorMm, sensorFromTipMm, wireIn, guideEngaged, sideBranch, branches, onSensor, disabled }: VesselStripProps) {
  const W = 760,
    H = 92,
    gx = 110, // guide tip on screen
    x1 = 740,
    cy = 40;
  const minMm = -sensorFromTipMm;
  // inside the guide the strip is compressed onto the drawn guide (90 px for the sensor's distance from the tip)
  const pxMm = (mm: number) => (mm >= 0 ? gx + ((x1 - gx) * mm) / Math.max(1, lengthMm) : gx + (mm * 90) / Math.max(1, sensorFromTipMm));
  const px = (p: number) => pxMm(p * lengthMm);
  const r0 = 14;
  const N = 140;
  // a left main is wider than its branches
  const lmFrac = branches ? Math.max(0, Math.min(1, branches.lmMm / Math.max(1, lengthMm))) : 0;
  const radius = (p: number) => {
    let r = r0 * (1 - 0.25 * p) * (branches && p < lmFrac ? 1.3 : 1);
    for (const l of lesions) {
      if (treated.includes(l.id)) continue;
      const half = (l.lengthMm / lengthMm) * 0.5;
      const d = Math.abs(p - l.pos) / half;
      if (d < 1) r *= 1 - shownDs(l) * (0.5 + 0.5 * Math.cos(Math.PI * d));
    }
    r *= 1 - diffuse * 0.12 * Math.sin(p * 40) * 0.5 * p;
    return Math.max(1.2, r);
  };
  const top = Array.from({ length: N + 1 }, (_, i) => `${px(i / N)},${cy - radius(i / N)}`).join(" ");
  const bot = Array.from({ length: N + 1 }, (_, i) => `${px((N - i) / N)},${cy + radius((N - i) / N)}`).join(" ");
  const guideX = guideEngaged ? gx : gx - 16;
  const tipMm = sensorMm + sensorFromTipMm;
  const inSide = !!sideBranch?.active && tipMm > sideBranch.atMm;
  // the side branch leaves downwards at the bifurcation
  const bx = sideBranch ? pxMm(sideBranch.atMm) : 0;
  const sidePt = (mm: number) => ({ x: bx + (mm - (sideBranch?.atMm ?? 0)) * 3.2, y: cy + (mm - (sideBranch?.atMm ?? 0)) * 1.6 });
  const wirePath = () => {
    const start = `${guideX - 90},${cy}`;
    if (!inSide) return `${start} ${pxMm(tipMm)},${cy}`;
    const e = sidePt(tipMm);
    return `${start} ${bx},${cy} ${e.x},${Math.min(H - 4, e.y)}`;
  };
  const sensorPt = (() => {
    if (!inSide || sensorMm <= (sideBranch?.atMm ?? 0)) return { x: pxMm(sensorMm), y: cy };
    const p = sidePt(sensorMm);
    return { x: p.x, y: Math.min(H - 4, p.y) };
  })();
  const activeLabel = branches?.options.find((o) => o.id === branches.active)?.label ?? branches?.active;
  const others = branches ? branches.options.filter((o) => o.id !== branches.active) : [];
  const bifX = branches ? pxMm(branches.lmMm) : 0;
  return (
    <div className="px-3 pb-3 pt-2 border-t border-line">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={branches ? `Pressure wire in the left main and the ${activeLabel}` : "Pressure wire in the vessel"}>
        {branches && (
          <g>
            {others.map((o, i) => (
              <g key={o.id}>
                <line x1={bifX} y1={cy + 6} x2={bifX + 90} y2={cy + 50 - i * 8} stroke="rgba(195,211,234,0.45)" strokeWidth={12} strokeLinecap="round" />
                <text x={bifX + 96} y={cy + 52 - i * 8} fontSize={12} fill="#858D99">
                  {o.label}
                </text>
              </g>
            ))}
            <line x1={bifX} y1={cy - 24} x2={bifX} y2={cy - 18} stroke="#858D99" strokeWidth={1} />
            <text x={(gx + bifX) / 2} y={H - 2} fontSize={12} fill="#858D99" textAnchor="middle">
              LM
            </text>
            <text x={x1} y={cy + 30} fontSize={12} fill="#A6ADB8" textAnchor="end">
              {activeLabel}
            </text>
          </g>
        )}
        {sideBranch && (
          <g>
            <line x1={bx} y1={cy + 6} x2={bx + 90} y2={cy + 50} stroke="rgba(195,211,234,0.45)" strokeWidth={14} strokeLinecap="round" />
            <text x={bx + 96} y={cy + 52} fontSize={12} fill="#858D99">
              {sideBranch.label}
            </text>
          </g>
        )}
        <polygon points={`${top} ${bot}`} fill="rgba(195,211,234,0.18)" stroke="rgba(195,211,234,0.55)" />
        <rect x={guideX - 90} y={cy - 9} width={90} height={18} rx={3} fill="#2b3a50" stroke="#4F8EF7" />
        <text x={guideX - 86} y={cy - 13} fontSize={12} fill="#A6ADB8">
          guide
        </text>
        {wireIn && (
          <>
            <polyline points={wirePath()} fill="none" stroke="#d7dee8" strokeWidth={1.2} />
            <circle cx={sensorPt.x} cy={sensorPt.y} r={4.5} fill="#facc15" />
            <text x={sensorPt.x} y={H - 2} fontSize={12} fill="#facc15" textAnchor="middle">
              sensor
            </text>
          </>
        )}
        {lesions.map((l) => (
          <text key={l.id} x={px(l.pos)} y={12} fontSize={12} fill={treated.includes(l.id) ? "#4CC38A" : "#A6ADB8"} textAnchor="middle">
            {treated.includes(l.id) ? "stented" : `${Math.round(shownDs(l) * 100)}%`}
          </text>
        ))}
      </svg>
      <input
        type="range"
        min={minMm}
        max={lengthMm}
        step={0.5}
        value={sensorMm}
        disabled={disabled || !wireIn || !onSensor}
        onChange={(e) => onSensor?.(Number(e.target.value))}
        className="w-full"
        aria-label="Wire position"
      />
      <div className="grid grid-cols-3 gap-3 text-[12px] text-ink-faint">
        <span>wire tip at the guide tip</span>
        <span className="text-center">advance or withdraw the wire</span>
        <span className="text-right">{branches ? `distal ${activeLabel}` : "distal vessel"}</span>
      </div>
      {branches && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
          <span>Wire in</span>
          <div className="seg" role="radiogroup" aria-label="Branch for the pressure wire">
            {branches.options.map((o) => {
              const on = o.id === branches.active;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`seg-btn ${on ? "seg-btn-active" : ""}`}
                  disabled={disabled || !branches.onSelect || on}
                  onClick={() => branches.onSelect?.(o.id)}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
