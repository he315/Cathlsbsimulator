// The pressure-wire console's trace: the aortic (guide) pressure Pa and the distal (sensor) pressure
// Pd on one sweep, with the console's mean read-outs. The channels are functions of lab time, so
// the lab draws from its model clock (the patient engine's monitor samples and the wire model), not
// from wall time. Used by the physiology lab and the PCI lab's pressure-wire console
// (physiology-engine-unify-and-setup).
//
// physiology-left-main-and-ostial: in a branched case the distal channel names the branch the sensor
// is in (Pd LAD, Pd LCx), and the head says whether the guide is engaged, as the operator knows it;
// an engaged guide on an ostial lesion shows as a damped Pa trace, which the trace draws as it is.
import type { ReactNode } from "react";
import LiveTrace from "../sim/LiveTrace";

export interface TraceViewProps {
  /** displayed Pa and Pd at lab time t, mmHg */
  paAt: (t: number) => number;
  pdAt: ((t: number) => number) | null;
  /** lab time now, s */
  clock: () => number;
  /** the console's cycle-mean read-outs (null: no wire connected) */
  readout: { pa: number; pd: number; pdpa: number } | null;
  height?: number;
  seconds?: number;
  /** a line under the read-out (guided teaching aids only) */
  aside?: ReactNode;
  /** the branch the sensor is in, in a branched case (LAD, LCx): labels the distal channel */
  branchLabel?: string;
  /** whether the guide sits engaged in the ostium or has been backed off into the aorta */
  guide?: "engaged" | "disengaged";
}

/** The distal channel's label: Pd, or Pd with the branch the sensor is in. */
export const pdLabel = (branchLabel?: string) => (branchLabel ? `Pd ${branchLabel}` : "Pd");

export default function TraceView({ paAt, pdAt, clock, readout, height = 200, seconds = 5, aside, branchLabel, guide }: TraceViewProps) {
  const pd = pdLabel(branchLabel);
  const channels = [{ fn: paAt, color: "#ff5d6c", label: "Pa" }, ...(pdAt ? [{ fn: pdAt, color: "#facc15", label: pd }] : [])];
  return (
    <div>
      <div className="panel-head">
        <span className="flex items-center gap-2">
          <span>Aortic (guide) and distal (sensor) pressure</span>
          {guide && <span className="chip">{guide === "engaged" ? "guide engaged" : "guide disengaged"}</span>}
        </span>
        <span className="font-mono normal-case tracking-normal">
          {readout ? (
            <>
              <span className="text-art">Pa {Math.round(readout.pa)}</span> · <span className="text-yellow-300">{pd} {Math.round(readout.pd)}</span> · <span className="text-yellow-300">Pd/Pa {readout.pdpa.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-ink-faint">pressure wire not connected</span>
          )}
        </span>
      </div>
      {aside && <div className="px-3 py-1 text-[12px] text-ink-faint border-b border-line">{aside}</div>}
      <div className="p-2 monitor">
        <LiveTrace channels={channels} min={0} max={160} height={height} seconds={seconds} clock={clock} />
      </div>
    </div>
  );
}
