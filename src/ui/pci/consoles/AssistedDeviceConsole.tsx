import { useState } from "react";
import { BALLOON_SPEC, balloonDiameter, balloonPressures, stentDiameter, stentPressures, type BalloonKind } from "../../../simulation/pciBench";
import { WIRE_SPEC, type WireKind } from "../../../simulation/angioPci";
import { GUIDE_BY_ID } from "../../../simulation/pci/equipment";
import { DEVICE_DIAMETERS, DEVICE_LENGTHS, INDEFLATOR_RANGE, PCI_INJECTION_KINDS, type PciLabSession } from "../PciLabSession";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";

// ---------------------------------------------------------------------------
// The assisted device console (pci-lab-shell-session): the earlier PCI lab's
// controls, with the scrub team doing the device steps. A balloon or stent is
// loaded with its label checked, prepared, backloaded, the valve opened and
// the guide aspirated (loadDevice, Device.assisted), and moves along the wire
// without the delivery physics; the indeflator inflates to the set pressure
// at once. It served every mode until pci-equipment-tray; from that package
// on its guide, wire and assisted device sections are shown in guided
// practice only, and the equipment tray (EquipmentTray.tsx: cart, label,
// preparation, backload, valve and aspiration) serves every mode. The
// injection section (the injection kind, the flush, the contralateral
// injection and the intracoronary vasodilator) has no other console, so it is
// shown in every mode.
// The console shows device read-outs and settings (box size, nominal and
// rated burst pressure, diameter at pressure), not where the devices are: the
// image shows that.
// ---------------------------------------------------------------------------

// The device menu (DEVICE_DIAMETERS, DEVICE_LENGTHS, INDEFLATOR_RANGE, deviceSizeFor) lives in
// PciLabSession.ts: a console file exports only `meta` and its component, so Fast Refresh keeps the
// lab mounted while the file is edited (registry.ts tells the refresh runtime to ignore `meta`).
export const meta: PciConsoleMeta = { id: "assisted-devices", label: "Guide, wire and devices", order: 10 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";

function Guide({ session }: { session: PciLabSession }) {
  const gs = session.st.guide;
  const label = GUIDE_BY_ID[gs.id]?.label ?? gs.id;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="stat-label">Guide</span>
        <span className="font-mono text-[12px] text-ink-soft">
          {label} {gs.french} Fr
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button className="btn !py-1 text-[12px]" onClick={() => session.engageGuide()} title="Engage the guide in the ostium (or re-engage it over the wire)">
          Engage the guide
        </button>
      </div>
    </div>
  );
}

function Wire({ session }: { session: PciLabSession }) {
  const st = session.st;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="stat-label">Guidewire</span>
        <select value={st.wireKind} onChange={(e) => session.setWireKind(e.target.value as WireKind)} className={SELECT} aria-label="Guidewire">
          {(Object.keys(WIRE_SPEC) as WireKind[]).map((k) => (
            <option key={k} value={k}>
              {WIRE_SPEC[k].label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-[12px] text-ink-faint">{WIRE_SPEC[st.wireKind].note}</div>
      <div className="flex flex-wrap gap-1.5">
        <button className="btn !py-1 text-[12px]" onClick={() => session.moveWire(-5)}>
          Pull 5
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.moveWire(-2)}>
          Pull 2
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.moveWire(2)}>
          Push 2
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.moveWire(5)}>
          Push 5
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.torqueWire(-Math.PI / 9)}>
          Torque anticlockwise
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.torqueWire(Math.PI / 9)}>
          Torque clockwise
        </button>
      </div>
    </div>
  );
}

function Devices({ session }: { session: PciLabSession }) {
  const [devKind, setDevKind] = useState<"balloon" | "stent">("balloon");
  const [balloon, setBalloon] = useState<BalloonKind>("semi-compliant");
  const [diam, setDiam] = useState(2.5);
  const [len, setLen] = useState(15);
  const dev = session.st.device;
  const atm = session.indeflatorAtm;
  if (!dev)
    return (
      <div className="space-y-1">
        <span className="stat-label">Balloon or stent</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={devKind} onChange={(e) => setDevKind(e.target.value as "balloon" | "stent")} className={SELECT} aria-label="Device">
            <option value="balloon">Balloon</option>
            <option value="stent">Drug-eluting stent</option>
          </select>
          {devKind === "balloon" && (
            <select value={balloon} onChange={(e) => setBalloon(e.target.value as BalloonKind)} className={SELECT} aria-label="Balloon type">
              {(Object.keys(BALLOON_SPEC) as BalloonKind[]).map((k) => (
                <option key={k} value={k}>
                  {BALLOON_SPEC[k].label}
                </option>
              ))}
            </select>
          )}
          <select value={diam} onChange={(e) => setDiam(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Diameter">
            {DEVICE_DIAMETERS.map((d) => (
              <option key={d} value={d}>
                {d.toFixed(2)} mm
              </option>
            ))}
          </select>
          <select value={len} onChange={(e) => setLen(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Length">
            {DEVICE_LENGTHS.map((l) => (
              <option key={l} value={l}>
                {l} mm
              </option>
            ))}
          </select>
          <button className="btn btn-accent !py-1 text-[12px]" onClick={() => session.loadDevice(devKind, balloon, diam, len)} title="The scrub team checks the label, prepares the device, backloads it and opens the valve">
            Load on the wire
          </button>
        </div>
      </div>
    );
  // nominal and rated burst pressures from the bench catalogue at this device's nominal diameter
  // (the earlier lab hard-coded the stent's as 10 and 16 atm, with no source)
  const { nominalAtm: nominal, rbpAtm: rbp } = dev.kind === "stent" ? stentPressures(dev.diameter) : balloonPressures(dev.balloon, dev.diameter);
  const dNow = dev.kind === "stent" ? stentDiameter(dev.diameter, atm) : balloonDiameter(dev.balloon, dev.diameter, atm);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="stat-label">Balloon or stent</span>
        <span className="text-[12px] text-ink">
          {dev.kind === "stent" ? "Stent" : BALLOON_SPEC[dev.balloon].label + " balloon"} {dev.diameter.toFixed(2)} × {dev.lengthMm} mm{dev.inflated ? ` · inflated ${dev.atm.toFixed(0)} atm` : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button className="btn !py-1 text-[12px]" onClick={() => session.advanceDevice(-5)}>
          Back 5
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.advanceDevice(-1)}>
          Back 1
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.advanceDevice(1)}>
          Forward 1
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.advanceDevice(5)}>
          Forward 5
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.removeDevice()}>
          Withdraw
        </button>
      </div>
      <div className="flex items-center justify-between text-[12px] text-ink-soft">
        <span>Indeflator {atm} atm</span>
        <span className="font-mono">
          nominal {nominal} · RBP {rbp} · {dNow.toFixed(2)} mm
        </span>
      </div>
      <input type="range" min={INDEFLATOR_RANGE[0]} max={INDEFLATOR_RANGE[1]} value={atm} onChange={(e) => session.setIndeflatorAtm(Number(e.target.value))} className="w-full" aria-label="Indeflator pressure" />
      <div className="flex gap-1.5">
        {!dev.inflated ? (
          <button className="btn btn-accent !py-1 text-[12px]" onClick={() => session.inflate()}>
            Inflate to {atm} atm{dev.kind === "stent" ? " (deploy)" : ""}
          </button>
        ) : (
          <button className="btn !py-1 text-[12px]" onClick={() => session.deflate()}>
            Deflate
          </button>
        )}
      </div>
    </div>
  );
}

function Injection({ session }: { session: PciLabSession }) {
  const s = session.s;
  const other = s.side === "left" ? "right" : "left";
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="stat-label">Injection</span>
        <div className="flex gap-1">
          {PCI_INJECTION_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => session.setInjectionKind(k.id)}
              title={k.title}
              aria-pressed={session.injKind === k.id}
              className={`rounded border px-2 py-0.5 text-[12px] ${session.injKind === k.id ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-soft"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          className="btn btn-accent !py-1 touch-none text-[12px]"
          onPointerDown={() => session.inject({ autoCine: true })}
          onPointerUp={() => session.releaseInjection()}
          onPointerLeave={() => session.releaseInjection()}
          onPointerCancel={() => session.releaseInjection()}
          title="Press for a standard injection with cine; hold to inject for longer (Space)"
        >
          Cine injection (Space)
        </button>
        <button className="btn !py-1 text-[12px]" onClick={() => session.flushGuide()} title="Clear the guide's contrast with saline (before pressure measurement); the next injection pushes the saline out first">
          Flush guide{session.guideFlushed ? " (saline in lumen)" : ""}
        </button>
        {session.dual && (
          <button
            className="btn !py-1 touch-none text-[12px]"
            onPointerDown={() => session.inject({ side: other, kind: "standard", autoCine: true })}
            onPointerUp={() => session.releaseInjection()}
            onPointerLeave={() => session.releaseInjection()}
            onPointerCancel={() => session.releaseInjection()}
            title="Shift and Space"
          >
            Contralateral injection ({other} catheter)
          </button>
        )}
        {s.thrombus && (
          <button className="btn !py-1 text-[12px]" onClick={() => session.giveVasodilator()}>
            Intracoronary vasodilator
          </button>
        )}
      </div>
      {session.lastRun && <div className="font-mono text-[12px] text-ink-faint">last {session.lastRun}</div>}
    </div>
  );
}

export default function AssistedDeviceConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  // the assisted device path is guided practice only (pci-equipment-tray); the injection controls serve every mode
  const guided = session.policy.mode === "guided";
  return (
    <div className="space-y-3 text-[13px]" aria-label="Guide, wire and devices">
      {guided && <Guide session={session} />}
      {guided && <Wire session={session} />}
      {guided && <Devices session={session} />}
      <Injection session={session} />
    </div>
  );
}
