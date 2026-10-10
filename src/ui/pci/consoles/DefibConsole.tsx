import { useState, type ReactNode } from "react";
import { DEFIB_ENERGIES_J, MP_PCI_ARREST, type PciLabSession } from "../PciLabSession";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";

// ---------------------------------------------------------------------------
// The defibrillator and resuscitation console (pci-patient-coupling): device
// read-outs and settings only, as the machine and the team show them.
//
// The defibrillator: pads (on from the start in an acute case, otherwise
// applied in a few seconds), synchronised or unsynchronised mode, the energy,
// charge, all clear and shock, with the shock count and what the machine did
// (a synchronised machine finds no R wave to fire on in VF and keeps its
// charge: the module's 'defibrillator left in synchronised mode'). The patient
// can be asked to cough. Chest compressions by hand, or the mechanical
// compression device (fitting it pauses compressions for a few seconds; the
// piston then shows over the sternum in the image, render/cpr.ts), and
// pericardiocentesis. Nothing here names the rhythm or its cause: the monitor
// shows the rhythm and the debrief names the cause.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "defib", label: "Defibrillator and CPR", order: 60 };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

/** What the machine shows after a press of Shock (never the rhythm it produced). */
function shockText(r: ReturnType<PciLabSession["shock"]>, sync: boolean, joules: number): string {
  if (r === "no-pads") return "No pads connected: nothing delivered";
  if (r === "not-charged") return "Not charged";
  if (sync && r === "no-change") return "Synchronised: no R wave to fire on, not discharged";
  return `${sync ? "Synchronised shock" : "Shock"} delivered, ${joules} J`;
}

function cprText(mode: PciLabSession["cpr"]): string {
  if (mode === "manual") return "by hand";
  if (mode === "fitting") return "paused: fitting the device";
  if (mode === "mechanical") return "mechanical device running";
  return "none";
}

export default function DefibConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  const [last, setLast] = useState<string | null>(null);
  const [drained, setDrained] = useState<number | null>(null);
  const d = session.defib;
  const ro = session.defibReadout();
  const ready = ro.charged > 0;
  const pads = d.pads ? "on (sternum and apex)" : d.padsAt !== null ? "being applied" : "off";
  const mode = session.cpr;
  return (
    <div className="space-y-3 text-[13px]">
      <div className="space-y-1.5">
        <div className="text-[12px] font-medium text-ink">Defibrillator</div>
        <Row label="Pads">{pads}</Row>
        <Row label="Charge">{ro.charging ? "charging" : ready ? `${ro.charged} J ready` : "empty"}</Row>
        <Row label="Shocks delivered">{ro.shocks}</Row>
        <div className="flex flex-wrap items-center gap-1.5">
          {!d.pads && (
            <button className="btn !py-1 text-[12px]" disabled={d.padsAt !== null} onClick={() => session.setPads(true)} title={`Put the pads on the chest, over the sternum and the apex (about ${MP_PCI_ARREST.padsApplyS} s)`}>
              Apply pads
            </button>
          )}
          <div className="seg" role="radiogroup" aria-label="Defibrillator mode">
            <button role="radio" aria-checked={!d.sync} className={`seg-btn ${!d.sync ? "seg-btn-active" : ""}`} onClick={() => session.setDefibSync(false)}>
              Unsynchronised
            </button>
            <button role="radio" aria-checked={d.sync} className={`seg-btn ${d.sync ? "seg-btn-active" : ""}`} onClick={() => session.setDefibSync(true)}>
              Synchronised
            </button>
          </div>
        </div>
        <div className="seg" role="radiogroup" aria-label="Energy">
          {DEFIB_ENERGIES_J.map((j) => (
            <button key={j} role="radio" aria-checked={d.energyJ === j} className={`seg-btn font-mono ${d.energyJ === j ? "seg-btn-active" : ""}`} onClick={() => session.setDefibEnergy(j)} disabled={ro.charging || ready}>
              {j} J
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className="btn !py-1 text-[12px]" onClick={() => session.charge()} disabled={ro.charging || ready}>
            {ro.charging ? "Charging" : `Charge ${d.energyJ} J`}
          </button>
          <button className={`btn !py-1 text-[12px] ${ro.cleared ? "!border-accent" : ""}`} onClick={() => session.clearForShock()} aria-pressed={ro.cleared}>
            All clear
          </button>
          <button
            className="btn btn-danger !py-1 text-[12px]"
            disabled={!ready}
            onClick={() => {
              const sync = d.sync;
              const j = ro.charged;
              setLast(shockText(session.shock(), sync, j));
            }}
          >
            Shock
          </button>
        </div>
        {last && <div className="text-[12px] text-ink-soft">{last}</div>}
      </div>
      <div className="space-y-1.5">
        <div className="text-[12px] font-medium text-ink">Patient</div>
        <button className="btn !py-1 text-[12px]" onClick={() => session.askCough()} title="Ask the patient to cough forcefully and keep coughing">
          Ask the patient to cough
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="text-[12px] font-medium text-ink">Chest compressions</div>
        <Row label="Compressions">{cprText(mode)}</Row>
        <div className="flex flex-wrap gap-1.5">
          <button className="btn !py-1 text-[12px]" disabled={mode === "manual" || mode === "mechanical"} onClick={() => session.startCpr()}>
            Start compressions
          </button>
          <button className="btn !py-1 text-[12px]" disabled={mode === "fitting" || mode === "mechanical"} onClick={() => session.fitCompressionDevice()} title="Fit the mechanical compression device over the sternum (compressions pause while it is fitted)">
            Fit compression device
          </button>
          <button className="btn !py-1 text-[12px]" disabled={mode === "off"} onClick={() => session.stopCpr()}>
            Stop compressions
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-[12px] font-medium text-ink">Pericardium</div>
        <button className="btn !py-1 text-[12px]" onClick={() => setDrained(session.pericardiocentesis())} title="Pericardiocentesis under fluoroscopic and pressure guidance">
          Pericardiocentesis
        </button>
        {drained !== null && <div className="text-[12px] text-ink-soft">{drained >= 1 ? `${Math.round(drained)} mL of blood drained` : "Dry tap: nothing drained"}</div>}
      </div>
    </div>
  );
}
