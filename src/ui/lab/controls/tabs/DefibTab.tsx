import type { ControlTab, ControlTabProps } from "../types";

// The patient: breathing (breath-hold for cine) and the defibrillator.

function Patient({ target }: ControlTabProps) {
  const breathHeld = target.breathHeld();
  const defib = target.defibReadout();
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Breathing</div>
        <button className={`btn h-8 px-2 text-[13px] ${breathHeld ? "!border-accent" : ""}`} onClick={() => target.holdBreath(!breathHeld)} title="Ask the patient to breathe in and hold (B)">
          {breathHeld ? "Breathe normally" : "Breathe in and hold"} <span className="kbd">B</span>
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Defibrillator</div>
        <div className="flex gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => target.charge()} disabled={defib.charging || defib.charged > 0}>
            {defib.charging ? "Charging" : defib.charged > 0 ? `${defib.charged} J ready` : "Charge 200 J"}
          </button>
          <button className={`btn h-8 px-2 text-[13px] ${defib.cleared ? "!border-accent" : ""}`} onClick={() => target.clearForShock()}>
            All clear
          </button>
          <button className="btn btn-danger h-8 px-2 text-[13px]" onClick={() => target.shock()} disabled={!(defib.charged > 0)}>
            Shock
          </button>
        </div>
      </div>
    </div>
  );
}

export const tab: ControlTab = {
  id: "patient",
  label: "Patient",
  order: 40,
  labs: ["diagnostic", "pci"],
  Component: Patient,
};
