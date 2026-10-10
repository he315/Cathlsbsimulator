import { useEffect, useRef, useState } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { catheterById } from "../../data/catheters";
import { WIRES } from "../../data/wires";
import { haptics } from "../../simulation/haptics";
import { COLORS } from "./helpers";

// ---------------------------------------------------------------------------
// CatheterHub — the mouse-first control deck. You grab the virtual hub and
// drag it the way you'd hold a real torque device at the groin/wrist:
//   • drag ↕  : push forward (advance) / pull back (withdraw)
//   • drag ↔  : twist clockwise / counter-clockwise (torque)
//   • wheel   : micro advance / withdraw
//   • ⇧ Shift : fine (0.15×) mode for both axes
//   • ⌥ Alt   : torque-only (lock insertion — pure twist)
//   • ⌃/⌘     : hold / stabilise (freeze — steady the hands)
//   • dbl-clk : relax load (bleed off stored twist / push, tip does NOT jump)
// The commanded (hub) position is what your hands dial in; the tip lags toward
// it through the dynamics model, so the gap you SEE here is real wind-up / lag.
// ---------------------------------------------------------------------------

const INSERT_SENS = 0.05; // insertion units per px of vertical drag
const TORQUE_SENS = 0.006; // radians per px of horizontal drag
const WHEEL_INSERT = 0.02; // insertion units per wheel delta
const WIRE_SENS = 0.16; // wire units per px of vertical drag
const MICRO = 0.15; // Shift fine-mode multiplier

const R2D = 180 / Math.PI;

// Insertion ruler window (unitless "depth", shown as mm for flavour).
const DEPTH_MIN = -12;
const DEPTH_MAX = 44;
const depthPct = (v: number) =>
  Math.max(0, Math.min(1, (v - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)));

function meterColor(v: number): string {
  return v > 0.66 ? COLORS.danger : v > 0.33 ? COLORS.warn : COLORS.good;
}

/**
 * What the hub's aspirate button needs from the lab: the lab session's aspirate (DiagnosticLabSession),
 * which judges the return against the tip and the lumen, raises its hazards (aspiration-failed,
 * catheter-plugged, air) and records the outcome in the store and on the gauze.
 */
export interface HubSession {
  aspirate(): unknown;
}

/**
 * The hub's aspirate: through the lab session when there is one (its judgement, hazards and record
 * apply); the store's own aspirate only for a host with no session.
 */
export function aspirateFromHub(session: HubSession | null | undefined): void {
  if (session) session.aspirate();
  else useSimulatorStore.getState().aspirate();
}

export default function CatheterHub({ session = null }: { session?: HubSession | null }) {
  const catheterId = useSimulatorStore((s) => s.catheterId);
  const wireId = useSimulatorStore((s) => s.wireId);
  const insertion = useSimulatorStore((s) => s.controls.insertion);
  const cmdInsertion = useSimulatorStore((s) => s.controls.cmdInsertion);
  const torque = useSimulatorStore((s) => s.controls.torque);
  const cmdTorque = useSimulatorStore((s) => s.controls.cmdTorque);
  const wireInsertion = useSimulatorStore((s) => s.controls.wireInsertion);
  const forwardPressure = useSimulatorStore((s) => s.controls.forwardPressure);
  const windup = useSimulatorStore((s) => s.controls.windup);
  const resistance = useSimulatorStore((s) => s.controls.resistance);
  const whip = useSimulatorStore((s) => s.controls.whip);
  const engKind = useSimulatorStore((s) => s.engagement.kind);
  const isSelective = useSimulatorStore((s) => s.engagement.isSelective);
  const conus = useSimulatorStore((s) => s.engagement.conus);
  const aspirated = useSimulatorStore((s) => s.aspirated);
  const arrhythmia = useSimulatorStore((s) => s.arrhythmia);
  const fluoroLive = useSimulatorStore((s) => s.fluoroLive);

  const cath = catheterById(catheterId);
  const wire = WIRES.find((w) => w.id === wireId);

  // Live modifier state (for the mode chip + cursor). Cheap; only re-renders on
  // a modifier key transition.
  const [mods, setMods] = useState({ shift: false, alt: false, ctrl: false });
  useEffect(() => {
    const upd = (e: KeyboardEvent) =>
      setMods({ shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey });
    window.addEventListener("keydown", upd);
    window.addEventListener("keyup", upd);
    return () => {
      window.removeEventListener("keydown", upd);
      window.removeEventListener("keyup", upd);
    };
  }, []);

  // --- Hub grip drag ---
  const gripRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    drag.current = true;
    gripRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    if (e.ctrlKey || e.metaKey) return; // hold / stabilise — freeze
    const st = useSimulatorStore.getState();
    // Pseudo-haptic control→display gain: a loaded catheter drags heavier.
    const micro = (e.shiftKey ? MICRO : 1) * haptics.gain();
    if (!e.altKey && e.movementY) st.commandInsertion(-e.movementY * INSERT_SENS * micro);
    if (e.movementX) st.commandTorque(e.movementX * TORQUE_SENS * micro);
  };
  const onUp = (e: React.PointerEvent) => {
    drag.current = false;
    gripRef.current?.releasePointerCapture(e.pointerId);
  };

  // Native, non-passive wheel handler so we can suppress page scroll.
  useEffect(() => {
    const el = gripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const micro = (e.shiftKey ? MICRO : 1) * haptics.gain();
      useSimulatorStore.getState().commandInsertion(-e.deltaY * WHEEL_INSERT * micro);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // --- Wire slider drag ---
  const wireRef = useRef<HTMLDivElement>(null);
  const wireDrag = useRef(false);
  const onWireDown = (e: React.PointerEvent) => {
    wireDrag.current = true;
    wireRef.current?.setPointerCapture(e.pointerId);
  };
  const onWireMove = (e: React.PointerEvent) => {
    if (!wireDrag.current || !e.movementY) return;
    const micro = e.shiftKey ? MICRO : 1;
    useSimulatorStore.getState().commandWire(-e.movementY * WIRE_SENS * micro);
  };
  const onWireUp = (e: React.PointerEvent) => {
    wireDrag.current = false;
    wireRef.current?.releasePointerCapture(e.pointerId);
  };

  // --- Fluoro pedal (press & hold) ---
  const pedalDown = () => useSimulatorStore.getState().setFluoroLive(true);
  const pedalUp = () => useSimulatorStore.getState().setFluoroLive(false);

  const pushPct = Math.min(1, forwardPressure / 4.5);
  const twistPct = Math.min(1, Math.abs(windup) / 1.1);
  const resistPct = Math.min(1, resistance);

  const modeChip = mods.ctrl
    ? { label: "HOLD", color: COLORS.safe }
    : mods.alt
    ? { label: "TORQUE-ONLY", color: COLORS.accent }
    : mods.shift
    ? { label: "FINE", color: COLORS.good }
    : null;

  // Dial geometry (SVG 200×200, centre 100,100).
  const cmdDeg = cmdTorque * R2D;
  const tipDeg = torque * R2D;
  const wirePct = Math.max(0, Math.min(1, wireInsertion / 40));

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Catheter hub</span>
        <span className="normal-case font-normal text-ink-faint">
          {cath?.name ?? catheterId}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* ---- Grip + torque dial ---- */}
        <div className="flex gap-3">
          <div
            ref={gripRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onDoubleClick={() => useSimulatorStore.getState().relaxLoad()}
            className={`relative shrink-0 select-none touch-none rounded-xl border border-line bg-base-800/70 ${
              mods.ctrl ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{ width: 168, height: 168 }}
            title="Drag: ↕ advance/withdraw · ↔ torque. Wheel: micro. Shift: fine. Alt: torque-only. Ctrl/Cmd: hold. Double-click: relax load."
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              {/* outer ring */}
              <circle cx={100} cy={100} r={86} fill="none" stroke="#1d2836" strokeWidth={10} />
              {/* degree ticks every 30° */}
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                const r0 = 78;
                const r1 = 88;
                return (
                  <line
                    key={i}
                    x1={100 + Math.sin(a) * r0}
                    y1={100 - Math.cos(a) * r0}
                    x2={100 + Math.sin(a) * r1}
                    y2={100 - Math.cos(a) * r1}
                    stroke="#33465c"
                    strokeWidth={i % 3 === 0 ? 3 : 1.5}
                  />
                );
              })}
              {/* tip (actual delivered torque) — faint ghost */}
              <g transform={`rotate(${tipDeg} 100 100)`}>
                <line x1={100} y1={100} x2={100} y2={26} stroke={COLORS.dim} strokeWidth={3} />
                <circle cx={100} cy={26} r={4} fill={COLORS.dim} />
              </g>
              {/* commanded (hub / your hands) — bright */}
              <g transform={`rotate(${cmdDeg} 100 100)`}>
                <line
                  x1={100}
                  y1={100}
                  x2={100}
                  y2={22}
                  stroke={whip > 0.35 ? COLORS.danger : COLORS.accent}
                  strokeWidth={4}
                />
                <circle
                  cx={100}
                  cy={22}
                  r={5}
                  fill={whip > 0.35 ? COLORS.danger : COLORS.accent}
                />
              </g>
              {/* grip knurl — rotates with the hand (commanded) */}
              <g transform={`rotate(${cmdDeg} 100 100)`}>
                <circle cx={100} cy={100} r={34} fill="#0f1620" stroke="#2a3a4d" strokeWidth={2} />
                {Array.from({ length: 16 }).map((_, i) => {
                  const a = (i * 22.5 * Math.PI) / 180;
                  return (
                    <line
                      key={i}
                      x1={100 + Math.sin(a) * 24}
                      y1={100 - Math.cos(a) * 24}
                      x2={100 + Math.sin(a) * 33}
                      y2={100 - Math.cos(a) * 33}
                      stroke="#3a506b"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            </svg>
            {/* centre readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[12px] font-mono text-ink-faint">TWIST</div>
              <div className="text-lg font-mono text-ink leading-none">
                {Math.round(cmdDeg)}°
              </div>
              <div className="text-[12px] font-mono text-ink-faint mt-0.5">
                tip {Math.round(tipDeg)}°
              </div>
            </div>
            {/* mode chip */}
            {modeChip && (
              <div
                className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[12px] font-mono px-1.5 py-0.5 rounded pointer-events-none"
                style={{ color: modeChip.color, border: `1px solid ${modeChip.color}` }}
              >
                {modeChip.label}
              </div>
            )}
          </div>

          {/* ---- Wire slider ---- */}
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-mono text-ink-faint mb-1">WIRE</div>
            <div
              ref={wireRef}
              onPointerDown={onWireDown}
              onPointerMove={onWireMove}
              onPointerUp={onWireUp}
              onPointerCancel={onWireUp}
              className="relative w-8 flex-1 rounded-md border border-line bg-base-800/70 cursor-ns-resize touch-none select-none"
              style={{ minHeight: 132 }}
              title="Drag ↕ to advance / retract the guidewire lead"
            >
              {/* fill from bottom = lead length */}
              <div
                className="absolute left-0 right-0 bottom-0 rounded-b-md"
                style={{
                  height: `${wirePct * 100}%`,
                  background: "#2B4370",
                }}
              />
              {/* thumb */}
              <div
                className="absolute left-1/2 -translate-x-1/2 h-2.5 w-10 rounded-sm bg-ink-soft shadow"
                style={{ bottom: `calc(${wirePct * 100}% - 5px)` }}
              />
            </div>
            <div className="text-[12px] font-mono text-ink-faint mt-1 text-center leading-tight">
              {wireInsertion.toFixed(0)}
              <br />
              <span className="text-ink-faint/70">{wire?.tipShape ?? "J"}</span>
            </div>
          </div>
        </div>

        {/* ---- Insertion depth ruler ---- */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="stat-label">Insertion depth</span>
            <span className="text-[12px] font-mono text-ink">
              {insertion.toFixed(1)}
              <span className="text-ink-faint"> / cmd {cmdInsertion.toFixed(1)}</span>
            </span>
          </div>
          <div className="relative h-4 rounded bg-base-800 border border-line overflow-hidden">
            {/* seat line at depth 0 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-ink-faint/60"
              style={{ left: `${depthPct(0) * 100}%` }}
            />
            {/* commanded ghost */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent/50"
              style={{ left: `${depthPct(cmdInsertion) * 100}%` }}
            />
            {/* actual delivered tip */}
            <div
              className="absolute top-0.5 bottom-0.5 w-1 rounded bg-accent"
              style={{ left: `calc(${depthPct(insertion) * 100}% - 2px)` }}
            />
          </div>
        </div>

        {/* ---- Load / resistance meters ---- */}
        <div className="space-y-1.5">
          <Meter label="PUSH" pct={pushPct} value={forwardPressure} />
          <Meter label="TWIST" pct={twistPct} value={Math.abs(windup)} />
          <Meter label="RESIST" pct={resistPct} value={resistance} />
          {whip > 0.35 && (
            <div className="text-[12px] font-mono text-danger animate-pulseline">
              ⚡ torque whip — the loaded tip snapped free
            </div>
          )}
        </div>

        {/* ---- Pedals ---- */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onPointerDown={pedalDown}
            onPointerUp={pedalUp}
            onPointerLeave={pedalUp}
            onPointerCancel={pedalUp}
            className={`btn touch-none ${fluoroLive ? "btn-danger" : ""}`}
            title="Hold for live fluoroscopy (or hold F)"
          >
            <span className="kbd">F</span> {fluoroLive ? "● live" : "fluoro"}
          </button>
          <button
            className="btn btn-accent"
            onClick={() => useSimulatorStore.getState().inject()}
            title="Inject contrast / cine (Space)"
          >
            <span className="kbd">␣</span> inject
          </button>
          <button
            className="btn"
            onClick={() => useSimulatorStore.getState().checkPressure()}
            title="Check pressure at the tip (P)"
          >
            <span className="kbd">P</span> press
          </button>
        </div>

        {/* ---- Aspirate (confirm free blood return before injecting) ---- */}
        <button
          className={`btn w-full ${
            aspirated === "clean" ? "btn-good" : aspirated === "no-return" ? "btn-danger" : ""
          }`}
          onClick={() => aspirateFromHub(session)}
          title="Aspirate to confirm free blood return before injecting"
        >
          {aspirated === "clean"
            ? "✓ aspirate — free blood return"
            : aspirated === "no-return"
            ? "✕ aspirate — NO return, reposition"
            : "aspirate before injecting"}
        </button>

        {/* ---- VF emergency ---- */}
        {arrhythmia === "vf" && (
          <button
            className="btn btn-danger w-full animate-pulseline"
            onClick={() => useSimulatorStore.getState().defibrillate()}
            title="Deliver a shock to restore sinus rhythm"
          >
            ⚡ VF — DEFIBRILLATE
          </button>
        )}

        {/* ---- Status line ---- */}
        <div className="text-[12px] font-mono text-ink-faint">
          {conus ? (
            <span className="text-danger">conus over-selection — withdraw; do NOT inject (VF)</span>
          ) : isSelective ? (
            <span className="text-good">seated · coaxial — aspirate, then inject</span>
          ) : (
            <span>tip: {engKind}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Meter({ label, pct, value }: { label: string; pct: number; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-mono text-ink-faint w-11">{label}</span>
      <div className="flex-1 h-1.5 rounded bg-black/50 overflow-hidden">
        <div
          className="h-full transition-[width] duration-75"
          style={{ width: `${Math.round(pct * 100)}%`, background: meterColor(pct) }}
        />
      </div>
      <span className="text-[12px] font-mono text-ink-faint w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
