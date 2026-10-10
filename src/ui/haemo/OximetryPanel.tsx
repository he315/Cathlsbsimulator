// The oximetry run of the haemodynamics lab (split from HaemoLab.tsx): a sample button per site
// showing the saturation once drawn. The step-up reading (the level, and the Flamm mixed venous
// saturation for an atrial step-up) is an interpretation, so it is shown only as a guided teaching aid
// or in the debrief; the learner reads the run otherwise.
import { flammMixedVenous } from "../../simulation/calc";
import type { SatSite, StepUp } from "../../simulation/haemo";
import { SAT_SITES } from "../../simulation/haemoStudy";

export interface OximetryPanelProps {
  sats: Partial<Record<SatSite, number>>;
  onSample: (site: SatSite) => void;
  /** the scenario's step-up, shown when showInterpretation is on and the run is complete */
  step: StepUp;
  /** show the step-up reading (guided mode or the debrief) */
  showInterpretation: boolean;
  disabled?: boolean;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function OximetryPanel({ sats, onSample, step, showInterpretation, disabled = false }: OximetryPanelProps) {
  const complete = SAT_SITES.every((k) => sats[k] !== undefined);
  return (
    <div className="panel">
      <div className="panel-head">Oximetry run</div>
      <div className="grid grid-cols-3 gap-1.5 p-3">
        {SAT_SITES.map((k) => (
          <button key={k} className="btn !py-1 !text-[12px] flex-col !gap-0" disabled={disabled} onClick={() => onSample(k)}>
            <span className="text-ink-faint text-[12px]">{k}</span>
            <span className="font-mono text-ink">{sats[k] !== undefined ? pct(sats[k]!) : "sample"}</span>
          </button>
        ))}
      </div>
      {complete && showInterpretation && (
        <div className="px-3 pb-3 text-[13px] text-ink-soft">
          Step-up: <span className={step === "none" ? "text-good" : "text-warn"}>{step === "none" ? "none" : `${step} level`}</span>
          {step === "atrial" && sats.SVC !== undefined && sats.IVC !== undefined && <span className="text-ink-faint"> · Flamm mixed venous {pct(flammMixedVenous(sats.SVC, sats.IVC))}</span>}
        </div>
      )}
    </div>
  );
}
