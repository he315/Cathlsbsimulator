import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { chartDiameter } from "../../../simulation/pci/equipment";
import { holdSeconds, INDEFLATOR_MAX_ATM } from "../../../simulation/pci/indeflator";
import { deviceSpecOf } from "../../../simulation/pci/actions/devices";
import { pullNegativeNow, screwRate, SCREW_RATES, setPlungerLock, setScrewRate, turnScrew } from "../inputBindings/indeflator";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";

// ---------------------------------------------------------------------------
// The indeflator console (pci-indeflator): the inflation device at the table.
//
// Read-outs: the needle dial (0-30 atm) with the device's labelled nominal and
// rated burst pressures marked, the pressure and the screw's target, the hold
// timer (seconds at the target), the plunger lock and the vacuum. The setting:
// the screw rate. The hand on the device is the binding's
// (src/ui/pci/inputBindings/indeflator.ts): the on-screen screw (drag it, or
// focus it and use the arrow keys), the lock and the negative pull call the
// same handlers the hands reach through the input target with this console
// closed. The balloon's filling is for the fluoroscopy image to show; only in
// guided practice does the console add the device's chart diameter at the
// pressure (a teaching aid: the chart, not the lesion). No live read-out says
// what the lesion did.
//
// Follow-up (LAB_BUILD_PLAN section 2: consoles show read-outs and settings,
// the hands act): the on-screen screw, Lock and Pull negative stay only while
// no key or gamepad axis sends indeflator:inflate, aspirate or pin. When the
// input keymap maps them (src/input/settings.ts and the keyboard and gamepad
// sources), remove these three controls, keeping the dial, the read-outs and
// the screw rate, or show them only in guided mode as a teaching aid.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "indeflator", label: "Indeflator", order: 30 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink font-mono";
/** Pixels of drag for one atmosphere turned on the screw — MODEL PARAMETER (UI choice, docs/realism/facts/pkg-pci-indeflator.md). */
const PX_PER_ATM = 8;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

/** The needle dial: 0-30 atm over 270 degrees, marks every 2 atm, the label's nominal and rated burst pressures. */
function Dial({ atm, nominal, rbp }: { atm: number; nominal: number | null; rbp: number | null }) {
  const S = 132;
  const c = S / 2;
  const R = 54;
  const ang = (p: number) => ((-225 + (270 * Math.max(0, Math.min(INDEFLATOR_MAX_ATM, p))) / INDEFLATOR_MAX_ATM) * Math.PI) / 180;
  const at = (p: number, r: number): [number, number] => [c + r * Math.cos(ang(p)), c + r * Math.sin(ang(p))];
  const ticks = [];
  for (let p = 0; p <= INDEFLATOR_MAX_ATM; p += 2) {
    const [x1, y1] = at(p, R);
    const [x2, y2] = at(p, p % 10 === 0 ? R - 9 : R - 5);
    ticks.push(<line key={p} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink-faint" strokeWidth={p % 10 === 0 ? 1.5 : 1} />);
  }
  const labels = [0, 10, 20, 30].map((p) => {
    const [x, y] = at(p, R - 18);
    return (
      <text key={p} x={x} y={y + 4} textAnchor="middle" className="fill-ink-faint font-mono" fontSize={10}>
        {p}
      </text>
    );
  });
  const mark = (p: number | null, cls: string, key: string) => {
    if (p === null) return null;
    const [x1, y1] = at(p, R + 2);
    const [x2, y2] = at(p, R + 9);
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} className={cls} strokeWidth={3} />;
  };
  const [nx, ny] = at(Math.max(0, atm), R - 6);
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`Indeflator dial: ${atm.toFixed(1)} atm`} className="block shrink-0">
      <circle cx={c} cy={c} r={R + 10} className="fill-base-800 stroke-line-strong" strokeWidth={1} />
      {ticks}
      {labels}
      {mark(nominal, "stroke-accent", "nominal")}
      {mark(rbp, "stroke-warn", "rbp")}
      <line x1={c} y1={c} x2={nx} y2={ny} className="stroke-ink" strokeWidth={2} strokeLinecap="round" />
      <circle cx={c} cy={c} r={4} className="fill-ink" />
      <text x={c} y={c + 30} textAnchor="middle" className="fill-ink font-mono" fontSize={15}>
        {atm < 0 ? "vac" : atm.toFixed(1)}
      </text>
      <text x={c} y={c + 42} textAnchor="middle" className="fill-ink-faint" fontSize={9}>
        atm
      </text>
    </svg>
  );
}

/** The on-screen screw: drag up to turn it in, down to turn it out; arrow keys when focused (Shift: 0.5 atm). */
function Screw({ disabled, target, onTurn }: { disabled: boolean; target: number; onTurn: (atm: number) => void }) {
  const drag = useRef<{ y: number; acc: number } | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, acc: 0 };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.acc += (d.y - e.clientY) / PX_PER_ATM;
    d.y = e.clientY;
    const whole = d.acc >= 0 ? Math.floor(d.acc * 2) / 2 : Math.ceil(d.acc * 2) / 2;
    if (whole !== 0) {
      d.acc -= whole;
      onTurn(whole);
    }
  };
  const up = () => {
    drag.current = null;
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = e.shiftKey ? 0.5 : 1;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") onTurn(step);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") onTurn(-step);
    else return;
    e.preventDefault();
  };
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Indeflator screw"
      aria-disabled={disabled}
      aria-valuemin={0}
      aria-valuemax={INDEFLATOR_MAX_ATM}
      aria-valuenow={Math.round(target * 10) / 10}
      aria-valuetext={`screw at ${target.toFixed(1)} atm: drag up to turn in, down to turn out`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      className={`flex h-[132px] w-12 touch-none select-none flex-col items-center justify-between rounded border border-line bg-base-800 py-2 focus:outline-none focus-visible:shadow-glow ${disabled ? "opacity-50" : "cursor-ns-resize"}`}
      title="The screw: drag up to turn it in, down to turn it out (arrow keys when focused)"
    >
      <span className="text-[11px] text-ink-faint">in</span>
      <div className="flex w-8 flex-1 flex-col justify-center gap-1 py-1" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-px w-full bg-line-strong" />
        ))}
      </div>
      <span className="text-[11px] text-ink-faint">out</span>
    </div>
  );
}

export default function IndeflatorConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  const st = session.st;
  const dev = st.device;
  const ind = st.ind;
  const [rate, setRate] = useState(() => screwRate(session));
  const inflatable = !!dev && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent");
  const spec = dev && inflatable ? deviceSpecOf(dev) : null;
  const nominal = spec && dev ? spec.nominalAtm(dev.diameter) : null;
  const rbp = spec && dev ? spec.rbpAtm(dev.diameter) : null;
  const guided = session.policy.mode === "guided";
  const atm = ind.atm;
  const hold = holdSeconds(ind);
  const disabled = !inflatable || !!dev?.ruptured;
  const locked = !!ind.locked;
  const changeRate = (r: number) => {
    setScrewRate(session, r);
    setRate(screwRate(session));
  };
  return (
    <div className="space-y-2 text-[13px]" aria-label="Indeflator">
      <Row label="Device">
        {dev && inflatable && spec ? `${spec.label} ${dev.diameter.toFixed(2)} × ${dev.lengthMm} mm` : "no balloon or stent on the wire"}
      </Row>
      {spec && (
        <Row label="Label">
          nominal {nominal} atm · rated burst {rbp} atm{spec.maxInflateAtmPerS ? ` · at most ${spec.maxInflateAtmPerS} atm/s` : ""}
        </Row>
      )}
      <div className="flex items-center gap-3">
        <Dial atm={atm} nominal={nominal} rbp={rbp} />
        <Screw disabled={disabled || locked} target={ind.negative ? 0 : ind.target} onTurn={(d) => turnScrew(session, d)} />
        <div className="min-w-0 flex-1 space-y-1">
          <Row label="Pressure">{atm < 0 ? "vacuum" : `${atm.toFixed(1)} atm`}</Row>
          <Row label="Screw at">{ind.negative ? "pulled back" : `${ind.target.toFixed(1)} atm`}</Row>
          <Row label="Hold">{!ind.negative && atm > 0.5 ? `${hold.toFixed(0)} s` : "–"}</Row>
          <Row label="Plunger">{locked ? "locked" : "free"}</Row>
          {guided && dev && spec && atm > 0.5 && (
            <Row label="Chart diameter">
              {chartDiameter(spec, dev.diameter, atm).toFixed(2)} mm <span className="text-ink-faint">(guided)</span>
            </Row>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          Screw rate
          <select value={rate} onChange={(e) => changeRate(Number(e.target.value))} className={SELECT} aria-label="Screw rate">
            {SCREW_RATES.map((r) => (
              <option key={r} value={r}>
                {r} atm/s
              </option>
            ))}
          </select>
        </label>
        <button className="btn !py-1 text-[12px]" disabled={disabled} aria-pressed={locked} onClick={() => setPlungerLock(session, !locked)} title="Lock the plunger so the pressure holds, or unlock it to turn the screw or pull back">
          {locked ? "Unlock" : "Lock"}
        </button>
        <button className="btn !py-1 text-[12px]" disabled={!inflatable || locked || ind.negative} onClick={() => pullNegativeNow(session)} title="Pull the plunger back and lock it in vacuum: the balloon empties over seconds">
          Pull negative
        </button>
      </div>
      <div className="text-[12px] text-ink-faint">The hands turn the screw and pull the plunger; the image shows the balloon.</div>
    </div>
  );
}
