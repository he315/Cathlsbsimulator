// IVUS and OCT bench, step 2: lesion preparation with the catalogue's balloons,
// lithotripsy and rotational atherectomy (pci-bench-imaging-unify). Sizes and
// pressures come from src/simulation/pci/equipment.ts through pciBench.ts, so
// the diameter shown at a pressure is the one the bench applies. The log names
// what happened to the vessel (and the calcium modification) only in guided
// practice, a teaching aid; otherwise it lists the actions and the events are
// named after the final pullback.
import { useState } from "react";
import {
  BALLOON_KINDS,
  BALLOON_SPEC,
  BURR_SIZES,
  balloonDiameter,
  balloonPressures,
  balloonSizes,
  type BalloonKind,
  type BenchLesion,
  type BenchState,
  type PrepAction,
} from "../../simulation/pciBench";
import { BenchPicker } from "./ImagePanel";

type PrepKind = BalloonKind | "rota";

/** The size nearest `d` among `sizes`. */
const nearest = (sizes: readonly number[], d: number) => sizes.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a), sizes[0]);

export interface PrepPanelProps {
  lesion: BenchLesion;
  state: BenchState;
  onPrep: (a: PrepAction, label: string) => void;
  /** the actions taken, each with the events it caused */
  log: readonly { action: string; events: readonly string[] }[];
  /** guided practice: the log names the events and the calcium modification shows */
  guided: boolean;
  next: () => void;
  /** mean reference lumen diameter (mm), for the burr-to-artery ratio the operator works out */
  refD: number;
}

export default function PrepPanel({ lesion, state, onPrep, log, guided, next, refD }: PrepPanelProps) {
  const [kind, setKind] = useState<PrepKind>("semi-compliant");
  const [d, setD] = useState(2.5);
  const [atm, setAtm] = useState(10);
  const [cycles, setCycles] = useState(2);
  const [burr, setBurr] = useState(1.5);
  const sizes = kind === "rota" ? [] : balloonSizes(kind);
  const dia = kind === "rota" ? d : nearest(sizes, d);
  const p = kind === "rota" ? null : balloonPressures(kind, dia);
  const run = () => {
    if (kind === "rota") onPrep({ kind: "rota", burrMm: burr }, `Rotational atherectomy, ${burr.toFixed(2)} mm burr (ratio ${(burr / refD).toFixed(2)})`);
    else if (kind === "ivl") onPrep({ kind: "ivl", diameter: dia, cycles }, `${BALLOON_SPEC.ivl.label} ${dia.toFixed(2)} mm, ${cycles} × 10 pulses at 4 atm`);
    else onPrep({ kind: "balloon", balloon: kind, diameter: dia, atm }, `${BALLOON_SPEC[kind].label} ${dia.toFixed(2)} mm at ${atm} atm (${balloonDiameter(kind, dia, atm).toFixed(2)} mm)`);
  };
  return (
    <div className="panel p-4 space-y-3 text-[13px]">
      <div className="stat-label">Lesion preparation</div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Device">
        {[...BALLOON_KINDS, "rota" as const].map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded border px-2 py-1 text-[12px] ${kind === k ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-soft"}`}
          >
            {k === "rota" ? "Rotational atherectomy" : BALLOON_SPEC[k].label}
          </button>
        ))}
      </div>
      {kind === "rota" ? (
        <BenchPicker label="Burr (mm)" values={BURR_SIZES} value={burr} fmt={(v) => v.toFixed(2)} onChange={setBurr} />
      ) : (
        <>
          <BenchPicker label="Balloon diameter (mm)" values={sizes} value={dia} fmt={(v) => v.toFixed(2)} onChange={setD} />
          {kind === "ivl" ? (
            <BenchPicker label="Cycles of 10 pulses" values={[1, 2, 4, 6, 8]} value={cycles} fmt={(v) => `${v}`} onChange={setCycles} />
          ) : (
            <div>
              <div className="flex justify-between text-ink-soft">
                <span>Pressure</span>
                <span className="font-mono">
                  {atm} atm → {balloonDiameter(kind, dia, atm).toFixed(2)} mm
                </span>
              </div>
              <input type="range" aria-label="Inflation pressure (atm)" min={2} max={(p?.rbpAtm ?? 20) + 6} step={1} value={atm} onChange={(e) => setAtm(Number(e.target.value))} className="w-full" />
              {p && (
                <div className="text-[12px] text-ink-faint">
                  Device chart: nominal {p.nominalAtm} atm, rated burst {p.rbpAtm} atm. Lesion resistance is not in the chart.
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-accent" onClick={run}>
          {kind === "rota" ? "Ablate" : kind === "ivl" ? "Deliver pulses" : "Inflate"}
        </button>
        <button type="button" className="btn" onClick={next}>
          Choose stent →
        </button>
      </div>
      {guided && lesion.calcium && <div className="text-[12px] text-ink-faint">Calcium modification so far: {(state.mod * 100).toFixed(0)}%</div>}
      {log.length > 0 && (
        <div className="border-t border-line pt-2 space-y-0.5 text-[12px] max-h-48 overflow-y-auto" aria-label="Preparation log">
          {log.map((g, i) => (
            <div key={i}>
              <div className="text-ink-soft">{g.action}</div>
              {guided &&
                g.events.map((e, j) => (
                  <div key={j} className={e.startsWith("⚠") ? "text-danger" : "text-warn"}>
                    {e}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
