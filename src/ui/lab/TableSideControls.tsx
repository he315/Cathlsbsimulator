import { useState, useSyncExternalStore } from "react";
import type { InputSystem } from "../../input";
import { CONTROL_TABS, tabsFor } from "./controls/registry";
import type { ControlKit, ControlTab, HoldProps, LabControlsTarget, SegProps } from "./controls/types";

// ---------------------------------------------------------------------------
// Table-side controls: the foot switches (as buttons, for a mouse), the
// syringe, store fluoroscopy, and a strip of tabs discovered by glob from
// src/ui/lab/controls/tabs/ (C-arm and table, imaging, back table, patient and
// defibrillator, and whatever tabs later packages add). Everything goes
// through a lab-agnostic LabControlsTarget, which the diagnostic lab session
// implements (and the PCI lab session will). Every hold-to-run control stops
// when released, as on a real table (dead-man).
// ---------------------------------------------------------------------------

/** A button that acts while held (pointer or Enter/Space), and stops on release. */
function Hold({ onStart, onStop, children, title, className = "", disabled }: HoldProps) {
  const [down, setDown] = useState(false);
  const start = () => {
    if (down || disabled) return;
    setDown(true);
    onStart();
  };
  const stop = () => {
    if (!down) return;
    setDown(false);
    onStop();
  };
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={down}
      className={`btn h-8 select-none px-2 text-[13px] ${down ? "!border-accent !text-accent" : ""} ${className}`}
      onPointerDown={(e) => {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          stop();
        }
      }}
      onBlur={stop}
      data-input-direct=""
    >
      {children}
    </button>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label, fmt }: SegProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[86px] shrink-0 text-[12px] text-ink-faint">{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o)} role="radio" aria-checked={o === value} className={`seg-btn !px-2 !py-0.5 ${o === value ? "seg-btn-active" : ""}`} onClick={() => onChange(o)}>
            {fmt ? fmt(o) : String(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The control primitives every tab receives. */
const CONTROL_KIT: ControlKit = { Hold, Seg };

interface Props {
  /** the lab (DiagnosticLabSession, or any LabControlsTarget) */
  session: LabControlsTarget;
  input: InputSystem | null;
  /** the tab registry (tests pass a fixture set; the lab uses the glob registry) */
  tabs?: readonly ControlTab[];
  /** the tab open first (default: the first in the strip) */
  initialTab?: string;
}

/** Re-render when anything the controls show changes. */
function useControlsVersion(target: LabControlsTarget): number {
  return useSyncExternalStore(
    (fn) => target.subscribeControls(fn),
    () => target.controlsVersion(),
    () => target.controlsVersion()
  );
}

export default function TableSideControls({ session: target, input, tabs = CONTROL_TABS, initialTab }: Props) {
  useControlsVersion(target);
  const policy = target.controlsPolicy();
  const shown = tabsFor(target, policy, tabs);
  const [picked, setTab] = useState<string | null>(initialTab ?? null);
  // a tab that hides itself (or was never there) falls back to the first one shown
  const active = shown.find((t) => t.id === picked) ?? shown[0] ?? null;
  const pedalState = target.pedal;
  const pedal = (which: "fluoro" | "cine", on: boolean) => {
    if (input) input.emit({ t: "pedal", pedal: which, on, source: "ui" });
    else target.setPedal({ ...target.pedal, [which]: on });
  };
  const Active = active?.Component ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label="Table-side controls">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-2 py-1.5">
        <Hold onStart={() => pedal("fluoro", true)} onStop={() => pedal("fluoro", false)} title="Fluoroscopy pedal (hold F)" className={pedalState.fluoro ? "!border-accent" : ""}>
          Fluoro <span className="kbd">F</span>
        </Hold>
        <Hold onStart={() => pedal("cine", true)} onStop={() => pedal("cine", false)} title="Cine pedal (hold C): records a run" className={pedalState.cine ? "!border-accent" : ""}>
          Cine <span className="kbd">C</span>
        </Hold>
        <Hold onStart={() => target.startInjection()} onStop={() => target.releaseInjection()} title="Push the syringe (hold J); the push lasts while held">
          Inject <span className="kbd">J</span>
        </Hold>
        <button className="btn h-8 px-2 text-[13px]" onClick={() => target.aspirate()} title="Draw back on the syringe (L)">
          Aspirate <span className="kbd">L</span>
        </button>
        <button className="btn h-8 px-2 text-[13px]" onClick={() => target.storeFluoro()} disabled={!target.canStoreFluoro()} title="Store the last fluoroscopy sequence on the reference monitor (N)">
          Store fluoro <span className="kbd">N</span>
        </button>
      </div>
      <div className="flex overflow-x-auto border-b border-line px-1" role="tablist" aria-label="Control groups">
        {shown.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t} className={`tab !h-8 shrink-0 whitespace-nowrap !px-2 text-[13px] ${active === t ? "tab-active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 text-[13px]">{Active && <Active target={target} input={input} policy={policy} kit={CONTROL_KIT} />}</div>
    </div>
  );
}
