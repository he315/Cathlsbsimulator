// ---------------------------------------------------------------------------
// InputCalibration: set up the hands and feet.
//
//  - Devices: what is connected (keyboard, mouse, trackpad, gamepads, MIDI and
//    USB foot switches, the torquer); permission for MIDI and HID is asked only
//    when the user presses the connect button.
//  - Calibration: screen scale by matching an ID-1 card outline (85.60 mm), then
//    mouse counts per millimetre by sliding the mouse a known distance (the card
//    edge or a ruler) with the button held, and the same for a two-finger
//    trackpad swipe. Stored per device ("mouse:raw", "mouse:os", "mouse:css",
//    "trackpad").
//  - Gains and grip geometry, keyboard and gamepad speeds, haptics.
//  - Pedal test with per-source indicators and pedal learning for MIDI and HID.
//  - A live table to try the grips.
//
// Settings persist in localStorage (input/settings.ts).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_GRIP_GEOMETRY,
  ID1_CARD_LONG_MM,
  ID1_CARD_SHORT_MM,
  CSS_PX_PER_MM,
  gripGeometry,
  type GripGeometry,
  type InputSettings,
  type KeyAction,
  type SettingsPatch,
} from "../../input/settings";
import type { InputSystem } from "../../input/system";
import type { GripTarget, HandCommand, SourceStatus } from "../../input/types";
import { useHandView, useInputSystem, usePedals, useSources } from "../../input/useInput";
import TableView from "./TableView";

export interface InputCalibrationProps {
  /** use the lab's input system; otherwise the screen makes its own */
  system?: InputSystem | null;
  onClose?: () => void;
}

const GRIP_LABEL: Record<GripTarget, string> = {
  sheath: "Sheath hub",
  wire035: "J wire (0.035 in)",
  catheter: "Catheter hub",
  wire014: "Coronary wire",
  wire014b: "Second coronary wire",
  balloon: "Balloon shaft",
  balloon2: "Device on the second wire",
  stent: "Stent shaft",
  pressureWire: "Pressure wire",
  ivus: "Imaging catheter",
  pigtail: "Pigtail catheter",
  syringe: "Syringe plunger",
};

const KEY_LABEL: Record<KeyAction, string> = {
  pedalFluoro: "Fluoroscopy pedal (hold)",
  pedalCine: "Cine pedal (hold)",
  advance: "Advance gripped device",
  withdraw: "Withdraw gripped device",
  rollCw: "Roll clockwise",
  rollCcw: "Roll anticlockwise",
  pinAuto: "Left hand holds the partner device",
  pinWire: "Left hand holds the wire",
  pinGuide: "Left hand holds the guide",
  pinSheath: "Left hand holds the sheath",
  grip1: "Right hand to device 1",
  grip2: "Right hand to device 2",
  grip3: "Right hand to device 3",
  grip4: "Right hand to device 4",
  grip5: "Right hand to device 5",
  gripNext: "Right hand to next device",
  inject: "Push the plunger (hold)",
  flush: "Saline flush (hold)",
  aspirate: "Draw back (hold)",
  portToggle: "Syringe port contrast / saline",
  carmLao: "C-arm towards LAO",
  carmRao: "C-arm towards RAO",
  carmCran: "C-arm cranial",
  carmCaud: "C-arm caudal",
  fine: "Fine control (with arrows: table)",
};

function keyName(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    ShiftLeft: "Shift",
    ShiftRight: "Right shift",
    Space: "Space",
    Tab: "Tab",
  };
  return map[code] ?? code;
}

function describe(c: HandCommand): string {
  switch (c.kind) {
    case "push":
      return `${c.mm >= 0 ? "Advance" : "Withdraw"} ${GRIP_LABEL[c.device].toLowerCase()} ${Math.abs(c.mm).toFixed(1)} mm`;
    case "torque":
      return `Roll ${GRIP_LABEL[c.device].toLowerCase()} ${((c.rad * 180) / Math.PI).toFixed(0)}°`;
    case "pin":
      return `${c.on ? "Pin" : "Release"} ${GRIP_LABEL[c.device].toLowerCase()}`;
    case "grip":
      return c.device ? `${c.hand === "right" ? "Right" : "Left"} hand grips ${GRIP_LABEL[c.device].toLowerCase()}` : `${c.hand === "right" ? "Right" : "Left"} hand lets go`;
    case "regrip":
      return "Regrip";
  }
}

// --- small UI parts ---------------------------------------------------------------------

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-ink-soft">
        {label}
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Slider({ value, min, max, step, onChange, unit, digits = 2 }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; digits?: number }) {
  return (
    <span className="flex items-center gap-2">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-36" />
      <span className="metric w-20 text-right text-[13px] text-ink">
        {value.toFixed(digits)}
        {unit ? ` ${unit}` : ""}
      </span>
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />;
}

function StatusChip({ s }: { s: SourceStatus }) {
  const text = !s.supported ? "Not available" : s.connected ? "Connected" : "Not connected";
  const colour = !s.supported ? "text-ink-faint" : s.connected ? "text-good" : "text-ink-faint";
  return (
    <span className="chip">
      <span className={`led ${colour}`} />
      {text}
    </span>
  );
}

/** A floor foot switch, drawn as hardware; the lamp lights while held. */
function FootSwitch({ label, on, holders }: { label: string; on: boolean; holders: string[] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 90" width={132} height={99} aria-label={`${label} pedal ${on ? "pressed" : "up"}`} role="img">
        <path d="M 8 80 L 112 80 L 104 30 L 16 30 Z" fill="#22262c" stroke="#2e343c" strokeWidth={2} />
        <path d={on ? "M 22 72 L 98 72 L 94 44 L 26 44 Z" : "M 22 66 L 98 66 L 92 34 L 28 34 Z"} fill={on ? "#3a3f46" : "#30353c"} stroke="#454c55" strokeWidth={1.5} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={32 + i * 2} y1={(on ? 50 : 42) + i * 5} x2={88 - i * 2} y2={(on ? 50 : 42) + i * 5} stroke="#454c55" strokeWidth={1.5} />
        ))}
        <circle cx={60} cy={18} r={7} fill={on ? "#E9B95A" : "#2a2e34"} stroke="#454c55" strokeWidth={1.5} />
      </svg>
      <span className="text-[13px] text-ink">{label}</span>
      <span className="min-h-[20px] text-xs text-ink-faint">{on ? holders.join(", ") : "Released"}</span>
    </div>
  );
}

// --- calibration panel ------------------------------------------------------------------------

function useTicker(active: boolean, ms = 80) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((n) => (n + 1) % 1e9), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

function CalibrationPanel({ sys, settings, update }: { sys: InputSystem; settings: InputSettings; update: (p: SettingsPatch) => void }) {
  const [distance, setDistance] = useState(ID1_CARD_LONG_MM);
  const [phase, setPhase] = useState<"idle" | "mouse" | "trackpad">("idle");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [scale, setScale] = useState(settings.screenPxPerMm ?? CSS_PX_PER_MM);
  const padRef = useRef<HTMLDivElement | null>(null);
  useTicker(phase !== "idle");

  // the calibration pad receives the mouse and trackpad while this panel is open
  useEffect(() => {
    const el = padRef.current;
    if (!el) return;
    const offMouse = sys.mouse.attach(el);
    const offPad = sys.trackpad.attach(el);
    return () => {
      offMouse();
      offPad();
    };
  }, [sys]);

  const finishMouse = useCallback(() => {
    const r = sys.mouse.finishCalibration(distance);
    setPhase("idle");
    if (document.pointerLockElement) document.exitPointerLock();
    if (!r) {
      setResult({ ok: false, text: "That run was too short or out of range. Try again with a steady, straight slide." });
      return;
    }
    sys.setCalibration(r.key, r.cal);
    const mode = r.key === "mouse:raw" ? "raw counts" : r.key === "mouse:os" ? "OS-adjusted counts" : "screen pixels, no pointer lock";
    setResult({ ok: true, text: `Saved ${r.cal.mmPerCount.toFixed(4)} mm per count (${mode}, ${Math.round(r.cal.counts ?? 0)} counts).` });
  }, [sys, distance]);

  // a mouse run ends when the button comes up after some travel
  useEffect(() => {
    if (phase !== "mouse") return;
    const up = (e: MouseEvent) => {
      if (e.button === 0 && sys.mouse.calibrationCounts() > 0) finishMouse();
    };
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, [phase, sys, finishMouse]);

  const startMouse = () => {
    setResult(null);
    sys.mouse.startCalibration();
    if (padRef.current) sys.mouse.requestLock(padRef.current);
    setPhase("mouse");
  };
  const startTrackpad = () => {
    setResult(null);
    sys.trackpad.startCalibration();
    setPhase("trackpad");
  };
  const finishTrackpad = () => {
    const r = sys.trackpad.finishCalibration(distance);
    setPhase("idle");
    if (!r) {
      setResult({ ok: false, text: "No usable swipe was recorded. Swipe once, steadily, then press finish." });
      return;
    }
    sys.setCalibration(r.key, r.cal);
    setResult({ ok: true, text: `Saved ${r.cal.mmPerCount.toFixed(4)} mm per pixel of scroll for the trackpad.` });
  };
  const cancel = () => {
    sys.mouse.cancelCalibration();
    sys.trackpad.cancelCalibration();
    if (document.pointerLockElement) document.exitPointerLock();
    setPhase("idle");
  };

  const counts = phase === "mouse" ? sys.mouse.calibrationCounts() : phase === "trackpad" ? sys.trackpad.calibrationCounts() : 0;
  const key = phase === "trackpad" ? "trackpad" : sys.mouse.calibrationKey();
  const estimateMm = counts * (settings.calibration[key]?.mmPerCount ?? 0);
  const rulerPx = distance * scale;
  const ticks = [];
  for (let mm = 0; mm <= distance; mm += 1) {
    const x = mm * scale;
    const h = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6;
    ticks.push(<line key={mm} x1={x + 1} y1={0} x2={x + 1} y2={h} stroke="#858D99" strokeWidth={1} />);
  }

  const cal = (k: string) => settings.calibration[k];
  const calText = (k: string) => {
    const c = cal(k);
    return c ? `${c.mmPerCount.toFixed(4)} mm${c.method === "measured" ? "" : " (default)"}` : "None";
  };

  return (
    <div className="panel">
      <div className="panel-head">Calibration</div>
      <div className="space-y-4 p-4">
        <section>
          <h3 className="mb-1 text-[13px] font-semibold text-ink">Screen scale</h3>
          <p className="mb-2 text-[13px] text-ink-soft">Hold a bank or ID card against the screen and adjust until the outline matches its edges. This makes the ruler and drags on the table true to size.</p>
          <div className="flex flex-wrap items-center gap-4">
            <div style={{ width: ID1_CARD_LONG_MM * scale, height: ID1_CARD_SHORT_MM * scale }} className="rounded-[3mm] border-2 border-dashed border-line-strong" aria-label="Card outline" />
            <div className="flex flex-col gap-2">
              <Slider value={scale} min={2} max={8} step={0.01} onChange={setScale} unit="px/mm" />
              <div className="flex gap-2">
                <button className="btn btn-accent" onClick={() => update({ screenPxPerMm: scale })}>
                  Save scale
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setScale(CSS_PX_PER_MM);
                    update({ screenPxPerMm: null });
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-[13px] font-semibold text-ink">Hand travel</h3>
          <p className="mb-2 text-[13px] text-ink-soft">
            Lay a card or ruler on the desk beside the mouse. Press start, hold the left button and slide the mouse straight along it, then let go. For the trackpad, press start, swipe two fingers once along the card, then press finish.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-ink-soft">Distance</span>
            <div className="seg">
              <button className={`seg-btn ${distance === ID1_CARD_LONG_MM ? "seg-btn-active" : ""}`} onClick={() => setDistance(ID1_CARD_LONG_MM)}>
                Card edge, 85.6 mm
              </button>
              <button className={`seg-btn ${distance === 100 ? "seg-btn-active" : ""}`} onClick={() => setDistance(100)}>
                Ruler, 100 mm
              </button>
            </div>
            <input className="field w-24" type="number" min={20} max={300} step={0.1} value={distance} onChange={(e) => setDistance(Math.max(20, Math.min(300, Number(e.target.value) || ID1_CARD_LONG_MM)))} aria-label="Distance in millimetres" />
            <span className="text-[13px] text-ink-faint">mm</span>
          </div>
          <div ref={padRef} className="monitor relative mb-3 select-none overflow-hidden rounded-lg p-4" style={{ cursor: phase === "mouse" ? "crosshair" : "default", touchAction: "none" }}>
            <svg width={Math.min(rulerPx + 4, 1400)} height={36} aria-label="Ruler" role="img">
              {ticks}
              <rect x={1} y={20} width={Math.max(0, Math.min(rulerPx, estimateMm * scale))} height={6} fill="#4F8EF7" opacity={phase === "idle" ? 0 : 0.8} />
            </svg>
            <div className="mt-2 text-[13px] text-ink-soft">
              {phase === "mouse"
                ? sys.mouse.isLocked
                  ? `Recording: ${Math.round(counts)} counts. Let go of the button at the end of the card.`
                  : "Hold the left button here and slide the mouse."
                : phase === "trackpad"
                ? `Recording: ${Math.round(counts)} px of swipe.`
                : "Ready."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-accent" onClick={startMouse} disabled={phase !== "idle"}>
              Start mouse
            </button>
            <button className="btn" onClick={startTrackpad} disabled={phase !== "idle"}>
              Start trackpad
            </button>
            {phase === "trackpad" && (
              <button className="btn btn-accent" onClick={finishTrackpad}>
                Finish
              </button>
            )}
            {phase !== "idle" && (
              <button className="btn btn-ghost" onClick={cancel}>
                Cancel
              </button>
            )}
          </div>
          {result && <div className={`notice mt-3 ${result.ok ? "notice-good" : "notice-warn"}`}>{result.text}</div>}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
            <dt className="text-ink-faint">Mouse, raw counts</dt>
            <dd className="metric text-ink">{calText("mouse:raw")}</dd>
            <dt className="text-ink-faint">Mouse, OS-adjusted</dt>
            <dd className="metric text-ink">{calText("mouse:os")}</dd>
            <dt className="text-ink-faint">Mouse, no pointer lock</dt>
            <dd className="metric text-ink">{calText("mouse:css")}</dd>
            <dt className="text-ink-faint">Trackpad, per pixel</dt>
            <dd className="metric text-ink">{calText("trackpad")}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}

// --- gains panel ------------------------------------------------------------------------------

function GainsPanel({ settings, update }: { settings: InputSettings; update: (p: SettingsPatch) => void }) {
  const [target, setTarget] = useState<GripTarget>("catheter");
  const geom = gripGeometry(settings, target);
  const setGeom = (p: Partial<GripGeometry>) => update({ grip: { geometry: { ...settings.grip.geometry, [target]: { ...geom, ...p } } } });
  const resetGeom = () => {
    const g = { ...settings.grip.geometry };
    delete g[target];
    update({ grip: { geometry: g } });
  };
  const maxRad = geom.rollSpanMm > 0 ? (2 * (geom.rollSpanMm / 2)) / geom.diameterMm : 0;

  return (
    <div className="panel">
      <div className="panel-head">Gains and grips</div>
      <div className="divide-y divide-line px-4">
        <div className="py-2">
          <Row label="Push gain" hint="Device millimetres per millimetre of hand travel; 1 is one to one">
            <Slider value={settings.gains.push} min={0.25} max={3} step={0.05} onChange={(v) => update({ gains: { push: v } })} />
          </Row>
          <Row label="Roll gain" hint="Multiplies the rotation from fingertip travel">
            <Slider value={settings.gains.roll} min={0.25} max={3} step={0.05} onChange={(v) => update({ gains: { roll: v } })} />
          </Row>
          <Row label="Invert roll">
            <Toggle checked={settings.gains.invertRoll} onChange={(v) => update({ gains: { invertRoll: v } })} />
          </Row>
          <Row label="Invert push">
            <Toggle checked={settings.gains.invertPush} onChange={(v) => update({ gains: { invertPush: v } })} />
          </Row>
          <Row label="Hand move between devices">
            <Slider value={settings.grip.switchMs} min={0} max={800} step={10} onChange={(v) => update({ grip: { switchMs: v } })} unit="ms" digits={0} />
          </Row>
          <Row label="Plunger travel for a firm push">
            <Slider value={settings.grip.plungerTravelMm} min={4} max={40} step={1} onChange={(v) => update({ grip: { plungerTravelMm: v } })} unit="mm" digits={0} />
          </Row>
          <Row label="Torque device on the coronary wire">
            <Toggle checked={settings.grip.torqueDevice} onChange={(v) => update({ grip: { torqueDevice: v } })} />
          </Row>
          <Row label="Unpinned wire follows the device" hint="For the older engine only; the device physics handles this itself">
            <Toggle checked={settings.grip.emulateCoupling} onChange={(v) => update({ grip: { emulateCoupling: v } })} />
          </Row>
        </div>

        <div className="py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">Grip geometry</span>
            <select className="field" value={target} onChange={(e) => setTarget(e.target.value as GripTarget)} aria-label="Device">
              {(Object.keys(DEFAULT_GRIP_GEOMETRY) as GripTarget[]).map((t) => (
                <option key={t} value={t}>
                  {GRIP_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <Row label="Diameter between the fingers">
            <Slider value={geom.diameterMm} min={0.2} max={20} step={0.05} onChange={(v) => setGeom({ diameterMm: v })} unit="mm" />
          </Row>
          <Row label="Fingertip travel per grip">
            <Slider value={geom.rollSpanMm} min={0} max={60} step={1} onChange={(v) => setGeom({ rollSpanMm: v })} unit="mm" digits={0} />
          </Row>
          <Row label="Hand travel per grip">
            <Slider value={geom.pushSpanMm} min={5} max={150} step={1} onChange={(v) => setGeom({ pushSpanMm: v })} unit="mm" digits={0} />
          </Row>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-ink-faint">
              Roll per grip each way: <span className="metric">{((maxRad * 180) / Math.PI).toFixed(0)}°</span>
            </span>
            <button className="btn btn-ghost" onClick={resetGeom}>
              Reset to default
            </button>
          </div>
        </div>

        <div className="py-2">
          <Row label="Keyboard advance speed">
            <Slider value={settings.keyboard.pushMmPerS} min={2} max={60} step={1} onChange={(v) => update({ keyboard: { pushMmPerS: v } })} unit="mm/s" digits={0} />
          </Row>
          <Row label="Keyboard roll speed">
            <Slider value={settings.keyboard.rollMmPerS} min={2} max={60} step={1} onChange={(v) => update({ keyboard: { rollMmPerS: v } })} unit="mm/s" digits={0} />
          </Row>
          <Row label="Gamepad stick dead zone">
            <Slider value={settings.gamepad.deadzone} min={0} max={0.4} step={0.01} onChange={(v) => update({ gamepad: { deadzone: v } })} />
          </Row>
          <Row label="Gamepad advance speed">
            <Slider value={settings.gamepad.pushMmPerS} min={2} max={80} step={1} onChange={(v) => update({ gamepad: { pushMmPerS: v } })} unit="mm/s" digits={0} />
          </Row>
          <Row label="Gamepad C-arm speed">
            <Slider value={settings.gamepad.carmDegPerS} min={1} max={30} step={0.5} onChange={(v) => update({ gamepad: { carmDegPerS: v } })} unit="°/s" digits={1} />
          </Row>
        </div>

        <div className="py-2">
          <Row label="Pointer lock" hint="Click the table to take the device; Esc gives the pointer back">
            <Toggle checked={settings.pointerLock.enabled} onChange={(v) => update({ pointerLock: { enabled: v } })} />
          </Row>
          <Row label="Raw mouse counts" hint="Turns off OS acceleration where the browser allows it">
            <Toggle checked={settings.pointerLock.unadjusted} onChange={(v) => update({ pointerLock: { unadjusted: v } })} />
          </Row>
          <Row label="Trackpad natural scrolling">
            <Toggle checked={settings.trackpad.naturalScroll} onChange={(v) => update({ trackpad: { naturalScroll: v } })} />
          </Row>
          <Row label="Ignore trackpad inertia">
            <Toggle checked={settings.trackpad.momentumFilter} onChange={(v) => update({ trackpad: { momentumFilter: v } })} />
          </Row>
          <Row label="Heavier feel against resistance" hint="Hand travel moves the device less when the device pushes back">
            <Toggle checked={settings.haptics.pseudo} onChange={(v) => update({ haptics: { pseudo: v } })} />
          </Row>
          <Row label="Strength">
            <Slider value={settings.haptics.strength} min={0} max={1} step={0.05} onChange={(v) => update({ haptics: { strength: v } })} />
          </Row>
          <Row label="Gamepad rumble">
            <Toggle checked={settings.gamepad.rumble} onChange={(v) => update({ gamepad: { rumble: v } })} />
          </Row>
        </div>
      </div>
    </div>
  );
}

// --- devices and pedals ----------------------------------------------------------------------

function DevicesPanel({ sys, sources, settings, update }: { sys: InputSystem; sources: SourceStatus[]; settings: InputSettings; update: (p: SettingsPatch) => void }) {
  const [learning, setLearning] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const learnMidi = async (action: "fluoro" | "cine") => {
    setLearning(`midi-${action}`);
    setMsg(null);
    try {
      const b = await sys.midi.learn(action);
      update({ midi: { bindings: [...settings.midi.bindings.filter((x) => !(x.kind === b.kind && x.number === b.number)), b] } });
      setMsg({ ok: true, text: `MIDI ${b.kind === "cc" ? `controller ${b.number}` : `note ${b.number}`} now works the ${action === "fluoro" ? "fluoroscopy" : "cine"} pedal.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLearning(null);
    }
  };
  const learnHid = async (action: "fluoro" | "cine") => {
    setLearning(`hid-${action}`);
    setMsg(null);
    try {
      const b = await sys.hid.learn(action);
      update({ hid: { bindings: [...settings.hid.bindings.filter((x) => x.action !== action || x.device !== b.device), b] } });
      setMsg({ ok: true, text: `USB switch learnt for the ${action === "fluoro" ? "fluoroscopy" : "cine"} pedal.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLearning(null);
    }
  };

  const action = (s: SourceStatus) => {
    if (s.kind === "midi" && s.supported) {
      return (
        <div className="flex flex-wrap gap-2">
          {!sys.midi.connected && (
            <button className="btn" onClick={() => void sys.midi.connect()}>
              Connect MIDI pedal
            </button>
          )}
          {sys.midi.connected && (
            <>
              <button className="btn" disabled={learning !== null} onClick={() => void learnMidi("fluoro")}>
                {learning === "midi-fluoro" ? "Press the pedal…" : "Learn fluoroscopy pedal"}
              </button>
              <button className="btn" disabled={learning !== null} onClick={() => void learnMidi("cine")}>
                {learning === "midi-cine" ? "Press the pedal…" : "Learn cine pedal"}
              </button>
            </>
          )}
        </div>
      );
    }
    if (s.kind === "hid" && s.supported) {
      return (
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => void sys.hid.connect("pedal")}>
            Choose USB foot switch
          </button>
          {s.connected && (
            <>
              <button className="btn" disabled={learning !== null} onClick={() => void learnHid("fluoro")}>
                {learning === "hid-fluoro" ? "Press the pedal…" : "Learn fluoroscopy pedal"}
              </button>
              <button className="btn" disabled={learning !== null} onClick={() => void learnHid("cine")}>
                {learning === "hid-cine" ? "Press the pedal…" : "Learn cine pedal"}
              </button>
            </>
          )}
        </div>
      );
    }
    if (s.kind === "torquer" && s.supported) {
      return (
        <button className="btn" onClick={() => void sys.hid.connect("torquer")}>
          Choose torquer
        </button>
      );
    }
    if (s.kind === "gamepad" && s.connected) {
      return (
        <button className="btn" onClick={() => sys.haptics.pulse(0.8, 220)}>
          Test rumble
        </button>
      );
    }
    return null;
  };

  return (
    <div className="panel">
      <div className="panel-head">Devices</div>
      <ul className="divide-y divide-line">
        {sources.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-ink">{s.label}</span>
              <StatusChip s={s} />
            </div>
            {s.detail && <span className="text-xs text-ink-faint">{s.detail}</span>}
            {action(s)}
          </li>
        ))}
      </ul>
      <div className="space-y-2 px-4 pb-4">
        <div className="notice notice-info">Many USB foot switches type keys. Set yours to send F for fluoroscopy and C for cine and it works with no setup.</div>
        {msg && <div className={`notice ${msg.ok ? "notice-good" : "notice-warn"}`}>{msg.text}</div>}
      </div>
    </div>
  );
}

function PedalPanel({ sys }: { sys: InputSystem }) {
  const pedals = usePedals(sys);
  return (
    <div className="panel">
      <div className="panel-head">Pedal test</div>
      <div className="flex justify-around px-4 py-4">
        <FootSwitch label="Fluoroscopy" on={pedals.fluoro} holders={sys.pedals.holders("fluoro")} />
        <FootSwitch label="Cine" on={pedals.cine} holders={sys.pedals.holders("cine")} />
      </div>
      <p className="px-4 pb-4 text-[13px] text-ink-soft">Each pedal is live only while held. Releasing it, losing window focus or unplugging the device stops the beam at once.</p>
    </div>
  );
}

// --- main ------------------------------------------------------------------------------------

export default function InputCalibration({ system, onClose }: InputCalibrationProps) {
  const own = useInputSystem({ loop: !system });
  const sys = system ?? own;
  const [settings, setSettings] = useState<InputSettings>(() => sys.getSettings());
  const sources = useSources(sys);
  const hands = useHandView(sys);
  const [last, setLast] = useState<string>("");

  const update = useCallback(
    (p: SettingsPatch) => {
      sys.updateSettings(p);
      setSettings(sys.getSettings());
    },
    [sys]
  );

  useEffect(() => {
    setSettings(sys.getSettings());
    const offs = [sys.bus.on("hand", (c) => setLast(describe(c))), sys.bus.on("calibrated", () => setSettings(sys.getSettings()))];
    return () => offs.forEach((f) => f());
  }, [sys]);

  // keyboard for the pedal test and the try-it table (the lab re-attaches its own on return)
  useEffect(() => sys.keyboard.attach(window), [sys]);

  // restore devices granted earlier (no prompt)
  useEffect(() => {
    void sys.hid.restore();
  }, [sys]);

  const km = settings.keyboard.keymap;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Hands and pedals</h2>
          <p className="text-[13px] text-ink-soft">Set up the mouse, trackpad, gamepad and foot switches, then try the grips on the table below.</p>
        </div>
        {onClose && (
          <button className="btn" onClick={onClose}>
            Done
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <DevicesPanel sys={sys} sources={sources} settings={settings} update={update} />
          <PedalPanel sys={sys} />
        </div>
        <div className="flex flex-col gap-4">
          <CalibrationPanel sys={sys} settings={settings} update={update} />
          <GainsPanel settings={settings} update={update} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span>Try the grips</span>
          <span className="text-xs font-normal text-ink-faint">
            {hands?.right.transition ? "Moving the right hand…" : hands?.right.at ? `Right hand: ${GRIP_LABEL[hands.right.at].toLowerCase()}${hands.right.gripped ? ", gripping" : ""}` : "Right hand free"}
            {hands?.left.pinnedDevice ? ` · left hand holds the ${GRIP_LABEL[hands.left.pinnedDevice].toLowerCase()}` : ""}
          </span>
        </div>
        <div className="p-3">
          <TableView input={sys} height={240} state={{ setup: "guide", present: ["sheath", "catheter", "wire014", "balloon"] }} />
          <div className="mt-2 min-h-[20px] text-[13px] text-ink-soft">{last || "Click a device to move the right hand to it, then press and drag on it."}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Keys</div>
        <div className="grid gap-x-6 gap-y-1 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(KEY_LABEL) as KeyAction[]).map((a) => (
            <div key={a} className="flex items-center justify-between gap-3 py-0.5 text-[13px]">
              <span className="text-ink-soft">{KEY_LABEL[a]}</span>
              <span className="flex gap-1">
                {km[a].map((c) => (
                  <span key={c} className="kbd" style={{ fontSize: 12 }}>
                    {keyName(c)}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="px-4 pb-4 text-xs text-ink-faint">
          Gamepad: left stick moves the gripped device, right stick the C-arm, d-pad the table, left trigger fluoroscopy, right trigger cine, left bumper pins the partner device, right bumper the guide, A and B change device, Y the syringe port.
        </p>
      </div>
    </div>
  );
}
