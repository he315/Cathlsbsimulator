import { useState, type ReactNode } from "react";
import { WIRE_SPEC, type WireKind } from "../../../simulation/pci/equipment";
import { DEFAULT_SHAPE, HYDRAULIC_ATM, type MicroId, type MicroRemoval, type TipShape } from "../../../simulation/pci/coronaryWire";
import { MICROCATHETERS, removeMicrocatheter, setDeflectionBalloon, setWireKind, shapeTip, loadMicrocatheter, wireTorqueLagDeg } from "../../../simulation/pci/actions/wire";
import { applyWireAction } from "../inputBindings/wire";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The wire console (pci-wire-microcatheter): read-outs and settings only. The
// hands advance, withdraw and torque the wire and the microcatheter, and work
// the syringe on the microcatheter hub (src/ui/pci/inputBindings/wire.ts and
// the input target's wire route); this console chooses the wire class and its
// length, shapes the tip (primary bend length and angle, a secondary bend, or
// a reversed hairpin) with the drawn shape previewed against a vessel size the
// operator picks, loads a microcatheter of a chosen category, sets up its
// removal (trapping balloon size, length and pressure; hydraulic pressure; an
// extension wire) and the deflection balloon. It shows what the operator
// knows at the table (wire, length, torque at the hub, the microcatheter's
// position relative to the wire tip as both markers show it), never the
// wire's course: a subintimal or off-route wire is for the image and the
// debrief.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "wire", label: "Wire and microcatheter", order: 20 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";
const PREVIEW_VESSELS = [2.0, 2.5, 3.0, 3.5] as const;
const WIRE_LENGTHS = [190, 300] as const;
const TRAP_DIAMETERS = [2.0, 2.5, 3.0] as const;
const TRAP_LENGTHS = [12, 15, 20, 25] as const;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

/** The shaped tip drawn to scale beside two walls a chosen vessel diameter apart. */
function TipPreview({ shape, vesselMm }: { shape: TipShape; vesselMm: number }) {
  const W = 260;
  const H = 96;
  const pxPerMm = shape.reversed ? 6 : 22;
  const cy = H / 2;
  const half = (vesselMm / 2) * pxPerMm;
  // build the wire from its tip backwards: the primary segment, the secondary segment, then the shaft
  const pts: [number, number][] = [];
  let x = W - 18;
  let y = cy;
  let ang = 0;
  if (shape.reversed) {
    const len = shape.primaryMm * pxPerMm;
    pts.push([x - len, cy - 7], [x - 6, cy - 7], [x, cy], [x - 6, cy + 7], [x - len * 0.9, cy + 7]);
  } else {
    const a1 = (shape.primaryDeg * Math.PI) / 180;
    const a2 = ((shape.secondaryDeg || 0) * Math.PI) / 180;
    const l1 = shape.primaryMm * pxPerMm;
    const l2 = Math.max(0, (shape.secondaryMm || 0) - shape.primaryMm) * pxPerMm;
    const tip: [number, number] = [x, y];
    pts.push(tip);
    // walk back from the tip along the primary segment (it points up at a1 + a2 from the shaft)
    ang = a1 + (shape.secondaryDeg ? a2 : 0);
    x -= l1 * Math.cos(ang);
    y += l1 * Math.sin(ang);
    pts.push([x, y]);
    if (shape.secondaryDeg) {
      ang = a2;
      x -= l2 * Math.cos(ang);
      y += l2 * Math.sin(ang);
      pts.push([x, y]);
    }
    pts.push([8, y]);
    // centre the shaft in the vessel
    const dy = cy - y;
    for (const p of pts) p[1] += dy;
  }
  const fits = shape.reversed || shape.primaryMm <= vesselMm;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tip shape preview" className="block rounded border border-line bg-base-800">
      <line x1={0} x2={W} y1={cy - half} y2={cy - half} className="stroke-line-strong" strokeWidth={1.5} />
      <line x1={0} x2={W} y1={cy + half} y2={cy + half} className="stroke-line-strong" strokeWidth={1.5} />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" className={fits ? "stroke-ink" : "stroke-ink-soft"} strokeWidth={2} strokeLinejoin="round" />
      <text x={6} y={H - 6} className="fill-ink-faint font-mono" fontSize={11}>
        {shape.reversed ? `hairpin, ${shape.primaryMm} mm` : `${shape.primaryMm} mm at ${shape.primaryDeg}° · vessel ${vesselMm.toFixed(1)} mm`}
      </text>
    </svg>
  );
}

function WireSection({ session }: { session: PciLabSession }) {
  const st = session.st;
  const w = st.wire;
  const [kind, setKind] = useState<WireKind>(st.wireKind);
  const [lengthCm, setLengthCm] = useState<number>(w.lengthCm ?? 190);
  const spec = WIRE_SPEC[kind];
  const turns = w.hub / (2 * Math.PI);
  return (
    <div className="space-y-1.5">
      <Row label="Wire">{WIRE_SPEC[st.wireKind].label}</Row>
      <Row label="Length">{w.lengthCm ?? 190} cm</Row>
      <Row label="Torque device">
        {turns >= 0 ? "+" : ""}
        {turns.toFixed(2)} turns · lag {wireTorqueLagDeg(session.g, st).toFixed(0)}°
      </Row>
      <Row label="Held">{w.pinned ? "pinned by the left hand" : "free"}</Row>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <select value={kind} onChange={(e) => setKind(e.target.value as WireKind)} className={SELECT} aria-label="Wire class">
          {(Object.keys(WIRE_SPEC) as WireKind[]).map((k) => (
            <option key={k} value={k}>
              {WIRE_SPEC[k].label}
              {WIRE_SPEC[k].crossing === "no" ? " (exchange in)" : ""}
            </option>
          ))}
        </select>
        <select value={lengthCm} onChange={(e) => setLengthCm(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Wire length">
          {WIRE_LENGTHS.map((l) => (
            <option key={l} value={l}>
              {l} cm
            </option>
          ))}
        </select>
        <button
          className="btn !py-1 text-[12px]"
          onClick={() => applyWireAction(session, "wire-kind", (x) => setWireKind(x, kind, { lengthCm, g: session.g }))}
          title="Load this wire (with the wire back in the guide), or exchange it through a microcatheter in the vessel"
        >
          Load or exchange
        </button>
      </div>
      <div className="text-[12px] text-ink-faint">{spec.note}</div>
    </div>
  );
}

function ShapeSection({ session }: { session: PciLabSession }) {
  const cur = session.st.wire.shape;
  const [shape, setShape] = useState<TipShape>({ ...DEFAULT_SHAPE, ...cur });
  const [vesselMm, setVesselMm] = useState<number>(3.0);
  const set = (p: Partial<TipShape>) => setShape((s) => ({ ...s, ...p }));
  return (
    <div className="space-y-1.5">
      <Row label="Tip now">{cur.reversed ? "hairpin" : `${cur.primaryMm} mm at ${cur.primaryDeg}°${cur.secondaryDeg ? `, ${cur.secondaryDeg}° at ${cur.secondaryMm} mm` : ""}`}</Row>
      <TipPreview shape={shape} vesselMm={vesselMm} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-ink-soft">
        <label className="flex items-center justify-between gap-2">
          Primary bend
          <input type="range" min={0} max={90} step={5} value={shape.primaryDeg} disabled={shape.reversed} onChange={(e) => set({ primaryDeg: Number(e.target.value) })} aria-label="Primary bend angle" />
        </label>
        <span className="font-mono">{shape.primaryDeg}°</span>
        <label className="flex items-center justify-between gap-2">
          Bend length
          <input type="range" min={0.5} max={5} step={0.5} value={shape.reversed ? 3 : shape.primaryMm} disabled={shape.reversed} onChange={(e) => set({ primaryMm: Number(e.target.value) })} aria-label="Primary bend length" />
        </label>
        <span className="font-mono">{shape.reversed ? "30" : shape.primaryMm} mm</span>
        <label className="flex items-center justify-between gap-2">
          Second bend
          <input type="range" min={0} max={45} step={5} value={shape.secondaryDeg} disabled={shape.reversed} onChange={(e) => set({ secondaryDeg: Number(e.target.value), secondaryMm: Number(e.target.value) ? Math.max(shape.secondaryMm, 8) : 0 })} aria-label="Secondary bend angle" />
        </label>
        <span className="font-mono">{shape.secondaryDeg ? `${shape.secondaryDeg}° at ${shape.secondaryMm} mm` : "none"}</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!shape.reversed} onChange={(e) => setShape(e.target.checked ? { primaryDeg: 180, primaryMm: 30, secondaryDeg: 0, secondaryMm: 0, reversed: true } : { ...DEFAULT_SHAPE })} />
          Reversed (hairpin)
        </label>
        <label className="flex items-center justify-end gap-1">
          Preview in
          <select value={vesselMm} onChange={(e) => setVesselMm(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Preview vessel diameter">
            {PREVIEW_VESSELS.map((d) => (
              <option key={d} value={d}>
                {d.toFixed(1)} mm
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn !py-1 text-[12px]" onClick={() => applyWireAction(session, "wire-kind", (x) => shapeTip(x, shape, { g: session.g }))} title="Shape the tip (wire out of the coronary, or through a microcatheter in the vessel)">
        Shape the tip
      </button>
    </div>
  );
}

function MicroSection({ session }: { session: PciLabSession }) {
  const st = session.st;
  const m = st.wire.micro;
  const [id, setId] = useState<MicroId>("mc-large");
  const [technique, setTechnique] = useState<MicroRemoval>("trap");
  const [trapD, setTrapD] = useState<number>(st.guide.french >= 7 ? 3.0 : 2.5);
  const [trapL, setTrapL] = useState<number>(20);
  const [trapAtm, setTrapAtm] = useState<number>(16);
  const [beyond, setBeyond] = useState(true);
  const [hydAtm, setHydAtm] = useState<number>(16);
  const info = MICROCATHETERS.find((c) => c.id === (m?.id ?? id));
  return (
    <div className="space-y-1.5">
      {m ? (
        <>
          <Row label="Microcatheter">{info?.label}</Row>
          <Row label="Its tip">{m.tipMm <= 0 ? "inside the guide" : `${Math.max(0, st.tipMm - m.tipMm).toFixed(0)} mm behind the wire tip`}</Row>
          <Row label="Hub">
            {m.turns >= 0 ? "+" : ""}
            {m.turns.toFixed(1)} turns{m.damaged ? " · deformed, binds the wire" : ""}
          </Row>
          <Row label="Backflow">{m.backflowAt !== null ? "checked here" : "not checked here"}</Row>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <select value={technique} onChange={(e) => setTechnique(e.target.value as MicroRemoval)} className={SELECT} aria-label="Removal technique">
              <option value="trap">Trapping balloon</option>
              <option value="hydraulic">Hydraulic exchange</option>
              <option value="extension">Extension wire</option>
              <option value="pull">Pull it out</option>
            </select>
            {technique === "trap" && (
              <>
                <select value={trapD} onChange={(e) => setTrapD(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Trapping balloon diameter">
                  {TRAP_DIAMETERS.map((d) => (
                    <option key={d} value={d}>
                      {d.toFixed(1)} mm
                    </option>
                  ))}
                </select>
                <select value={trapL} onChange={(e) => setTrapL(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Trapping balloon length">
                  {TRAP_LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l} mm
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[12px] text-ink-soft">
                  <input type="range" min={6} max={20} value={trapAtm} onChange={(e) => setTrapAtm(Number(e.target.value))} aria-label="Trapping pressure" />
                  <span className="font-mono">{trapAtm} atm</span>
                </label>
                <label className="flex items-center gap-1 text-[12px] text-ink-soft">
                  <input type="checkbox" checked={beyond} onChange={(e) => setBeyond(e.target.checked)} />
                  beyond its distal marker
                </label>
              </>
            )}
            {technique === "hydraulic" && (
              <label className="flex items-center gap-1 text-[12px] text-ink-soft">
                <input type="range" min={6} max={HYDRAULIC_ATM[1]} value={hydAtm} onChange={(e) => setHydAtm(Number(e.target.value))} aria-label="Hydraulic pressure" />
                <span className="font-mono">{hydAtm} atm</span>
              </label>
            )}
            <button
              className="btn !py-1 text-[12px]"
              onClick={() =>
                applyWireAction(session, "remove-device", (x) =>
                  removeMicrocatheter(session.s, session.g, x, { technique, balloon: { diameterMm: trapD, lengthMm: trapL, atm: trapAtm, beyondMarker: beyond }, hydraulicAtm: hydAtm })
                )
              }
            >
              Remove the microcatheter
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={id} onChange={(e) => setId(e.target.value as MicroId)} className={SELECT} aria-label="Microcatheter category">
            {MICROCATHETERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button className="btn !py-1 text-[12px]" onClick={() => applyWireAction(session, "load-device", (x) => loadMicrocatheter(x, id))} title="Over the wire, into the guide">
            Load microcatheter
          </button>
        </div>
      )}
      <div className="text-[12px] text-ink-faint">{info?.note}</div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          className="btn !py-1 text-[12px]"
          aria-pressed={!!st.wire.deflector}
          onClick={() => applyWireAction(session, "load-device", (x) => setDeflectionBalloon(session.s, session.g, x, !x.wire.deflector))}
          title="A balloon in the main vessel just beyond the angulated branch's origin"
        >
          {st.wire.deflector ? "Deflate the deflection balloon" : "Deflection balloon"}
        </button>
      </div>
    </div>
  );
}

export default function WireConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  return (
    <div className="space-y-4 text-[13px]" aria-label="Wire and microcatheter">
      <WireSection session={session} />
      <ShapeSection session={session} />
      <MicroSection session={session} />
    </div>
  );
}
