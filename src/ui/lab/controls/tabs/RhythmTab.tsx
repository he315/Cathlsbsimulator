import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";
import type { DefibMode, PacingKind, ReconsiderAs, RhythmCapability, RhythmResult } from "../../../sim/labSession";
import { useUiStore } from "../../../../state/useUiStore";

// Rhythm (diag-rhythm-haemodynamic-events): the orders the arrhythmias and the vagal reactions of the
// diagnostic lab need. The defibrillator's mode, energy, charge, stand clear and shock (a synchronised
// shock in VF does not discharge, as a real one waits for an R wave); compressions; external pacing
// as a bridge and a transvenous wire, each with its set-up time, and overdrive pacing of VT through the
// wire; flat with the legs raised; the arrest and rhythm drugs at the doses the module text states, which
// the attending checks against the chart; the time noted for a vagal diagnosis and the look for another
// cause. The tab shows only what the team has done and what the looks found: the rhythm is read from the
// monitor and nothing here names it or the cause. The lab provides the orders as the 'rhythm'
// capability (src/ui/sim/labSession.ts RhythmOrders), which declares it.

/** The temporary pacing lab's in-lab scenario of a slow rhythm after a right coronary injection (src/content/lab/presets/bedside/pacing.launch.ts). */
export const PACING_PRACTICE = { sim: "pacing", params: { scenario: "inlab-rca-chb-rbbb" } } as const;

const LOOK_LABEL: Record<ReconsiderAs, string> = {
  bleeding: "Look for bleeding (groin, pelvis)",
  tamponade: "Echo for pericardial fluid",
  infarction: "12-lead ECG",
};

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function useCapabilityVersion(cap: RhythmCapability) {
  const sub = useCallback((fn: () => void) => cap.subscribe(fn), [cap]);
  useSyncExternalStore(
    sub,
    () => cap.version(),
    () => cap.version()
  );
  // the charge, the set-up times and the vagal clock move without an order: a gentle refresh while the tab is open
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1e9), 1000);
    return () => clearInterval(id);
  }, []);
}

function Rhythm({ target }: ControlTabProps) {
  const cap = target.capability("rhythm");
  if (!cap) return <div className="text-[12px] text-ink-faint">No rhythm orders in this lab.</div>;
  return <RhythmPanel cap={cap} />;
}

function RhythmPanel({ cap }: { cap: RhythmCapability }) {
  useCapabilityVersion(cap);
  const openSim = useUiStore((u) => u.openSim);
  const [result, setResult] = useState<RhythmResult | null>(null);
  const [rate, setRate] = useState(70);
  const r = cap.readout();
  const d = r.defib;
  const pacingText =
    r.pacing.state === "off" ? "Not pacing" : r.pacing.state === "setting-up" ? `${r.pacing.kind === "external" ? "Pads" : "Wire"} being set up, ${r.pacing.readyInS ?? 0} s` : `${r.pacing.kind === "external" ? "External" : "Transvenous"} pacing at ${r.pacing.rateBpm}/min`;
  const pace = (k: PacingKind) => setResult(cap.orderPacing(k, rate));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="space-y-1">
          <div className="text-[12px] text-ink-faint">Defibrillator</div>
          <div className="seg" role="group" aria-label="Mode">
            {(["unsynchronised", "synchronised"] as DefibMode[]).map((m) => (
              <button key={m} className={`seg-btn ${m === d.mode ? "seg-btn-active" : ""}`} aria-pressed={m === d.mode} onClick={() => cap.setMode(m)}>
                {m === "synchronised" ? "Sync on" : "Sync off"}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Energy">
            {cap.energies.map((j) => (
              <button key={j} className={`seg-btn ${j === d.energyJ ? "seg-btn-active" : ""}`} aria-pressed={j === d.energyJ} onClick={() => cap.setEnergy(j)}>
                {j} J
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button className="btn h-8 px-2 text-[13px]" onClick={() => cap.charge()} disabled={d.charging || d.charged > 0}>
              {d.charging ? "Charging" : d.charged > 0 ? `${d.charged} J ready` : `Charge ${d.energyJ} J`}
            </button>
            <button className={`btn h-8 px-2 text-[13px] ${d.cleared ? "!border-accent" : ""}`} onClick={() => cap.clear()}>
              All clear
            </button>
            <button className="btn btn-danger h-8 px-2 text-[13px]" onClick={() => setResult(cap.shock())} disabled={!(d.charged > 0)}>
              Shock
            </button>
          </div>
          <div className="text-[11.5px] text-ink-faint">Shocks this case: {d.shocks}</div>
        </div>

        <div className="space-y-1">
          <div className="text-[12px] text-ink-faint">Circulation</div>
          <div className="flex flex-wrap gap-1">
            <button className={`btn h-8 px-2 text-[13px] ${r.cpr ? "!border-accent" : ""}`} aria-pressed={r.cpr} onClick={() => cap.setCpr(!r.cpr)}>
              {r.cpr ? "Stop compressions" : "Start compressions"}
            </button>
            <button className={`btn h-8 px-2 text-[13px] ${r.legsUp ? "!border-accent" : ""}`} aria-pressed={r.legsUp} onClick={() => cap.setLegsUp(!r.legsUp)}>
              {r.legsUp ? "Legs down" : "Flat, legs up"}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[12px] text-ink-faint">Pacing</div>
          <div className="text-[13px]" aria-live="polite">
            {pacingText}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <label className="flex items-center gap-1 text-[12px] text-ink-faint">
              Rate
              <input className="field h-7 w-14 text-[13px]" inputMode="numeric" value={rate} onChange={(e) => setRate(Math.max(30, Math.min(150, Number(e.target.value) || 70)))} aria-label="Pacing rate per minute" />
              /min
            </label>
            <button className="btn h-7 px-2 text-[12px]" onClick={() => pace("external")}>
              External pacing
            </button>
            <button className="btn h-7 px-2 text-[12px]" onClick={() => pace("transvenous")}>
              Transvenous wire
            </button>
            {r.pacing.state !== "off" && (
              <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => cap.stopPacing()}>
                Stop pacing
              </button>
            )}
            {r.pacing.state === "pacing" && r.pacing.kind === "transvenous" && (
              <button className="btn h-7 px-2 text-[12px]" onClick={() => setResult(cap.overdrive())} title="Pace faster than the tachycardia, then stop abruptly after capture">
                Overdrive
              </button>
            )}
          </div>
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => openSim(PACING_PRACTICE.sim, { ...PACING_PRACTICE.params })}>
            Practise placing the wire in the pacing lab
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Drugs and fluid (the team gives them)</div>
        <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Rhythm drugs">
          {cap.drugs.map((e) => (
            <button key={e.id} className="btn h-7 px-2 text-[12px]" title={`Dose: ${e.source}`} onClick={() => setResult(cap.give(e.id))}>
              {e.label} {e.doseText}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-ink-faint">Vagal treatment</span>
        <span className="stat-value text-[13px]">{r.vagal.sinceTreatedS === null ? "None given" : `${mmss(r.vagal.sinceTreatedS)} ago`}</span>
        <div className="seg" role="group" aria-label="Time limit">
          {cap.vagalLimits.map((s) => (
            <button key={s} className={`seg-btn ${s === r.vagal.limitS ? "seg-btn-active" : ""}`} aria-pressed={s === r.vagal.limitS} onClick={() => cap.setVagalTimeLimit(s)}>
              Reconsider at {s / 60} min
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[12px] text-ink-faint">Another cause</span>
        {(Object.keys(LOOK_LABEL) as ReconsiderAs[]).map((k) => (
          <button key={k} className="btn h-7 px-2 text-[12px]" onClick={() => setResult(cap.reconsider(k))}>
            {LOOK_LABEL[k]}
          </button>
        ))}
        <button className="btn h-7 px-2 text-[12px]" onClick={() => setResult(cap.treat("control-bleeding"))}>
          Bleeding measures
        </button>
        <button className="btn h-7 px-2 text-[12px]" onClick={() => setResult(cap.treat("drain-pericardium"))}>
          Drain the pericardium
        </button>
      </div>

      {r.findings.length > 0 && (
        <ul className="space-y-0.5 text-[12px] text-ink-soft" aria-label="Findings">
          {r.findings.slice(-3).map((f, i) => (
            <li key={i}>{f.text}</li>
          ))}
        </ul>
      )}

      {result && (
        <div className={`notice ${!result.ok && result.reason === "stopped" ? "notice-warn" : "notice-info"}`} role="status">
          {!result.ok && result.utterance ? `Attending: ${result.text}` : result.text}
        </div>
      )}

      {r.log.length > 0 && (
        <ul className="space-y-0.5 text-[12px] text-ink-soft" aria-label="Rhythm orders">
          {r.log
            .slice()
            .reverse()
            .map((o, i) => (
              <li key={i}>
                <span className="font-mono text-ink-faint">{mmss(o.t)}</span> {o.text}
                {o.note ? `: ${o.note}` : ""}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "rhythm",
  label: "Rhythm",
  // after the core tabs (10 to 40) and the drugs (45)
  order: 47,
  labs: ["diagnostic"],
  // only where the lab provides its rhythm orders (a bare target without capabilities shows nothing)
  visible: (t: LabControlsTarget) => typeof t.capability === "function" && t.capability("rhythm") !== null,
  Component: Rhythm,
};
