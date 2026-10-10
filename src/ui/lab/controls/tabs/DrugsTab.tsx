import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";
import { menuDoses, type DrugMenuEntry, type DrugOrderRecord, type DrugResult, type DrugsCapability } from "../../../sim/modules/drugs";
import type { AssessmentMode } from "../../../../mentor/types";
import type { DrugVia } from "../../../../mentor/rules/diagDrugs";
import TableView, { type TableState } from "../../TableView";

// Drugs (diag-lab-drugs): order a drug, dose and route; the team reads the order back, draws up an
// intracoronary or intra-arterial syringe for the operator or gives an IV or IM drug itself. The panel
// shows the monitor's systolic pressure and the time since the last vasodilator, and makes no
// recommendation: the doses offered are those the module text states for each drug, and any other
// dose can be typed. The lab provides the orders as the 'drugs' capability
// (src/ui/sim/modules/drugs.ts), which declares it.

/** How each way of giving a drug is named in the panel (generic connectors, no product names). */
const VIA_LABEL: Record<DrugVia, string> = {
  manifold: "Through the manifold",
  "y-connector": "Needle through the Y-connector",
  sheath: "Sheath side arm",
  team: "Team gives",
};

/** The same, inside a sentence (the syringe chips and the order log). */
const VIA_INLINE: Record<DrugVia, string> = {
  manifold: "through the manifold",
  "y-connector": "needle through the Y-connector",
  sheath: "sheath side arm",
  team: "team gives",
};

/**
 * The inset's table: the sheath and the catheter, with an empty control syringe supplied by the host so
 * the table's own plunger preview (an animation-frame loop) does not run behind a read-only inset.
 */
const INSET_STATE: Partial<TableState> = {
  setup: "diagnostic",
  present: ["sheath", "catheter"],
  syringe: { volMl: 0, contrastMl: 0, salineMl: 0, bloodMl: 0, airMl: 0 },
};

const STATUS_LABEL: Record<DrugOrderRecord["status"], string> = {
  "with-team": "with the team",
  "on-table": "on the table",
  given: "given",
  declined: "declined",
  stopped: "stopped",
};

const TEAM_STATUS: Record<string, string> = { queried: "queried", readback: "read back", "in-progress": "drawing up", cancelled: "cancelled", refused: "refused", done: "done" };

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmt(dose: number, unit: DrugMenuEntry["unit"]): string {
  const n = Number.isInteger(dose) ? dose.toLocaleString("en-GB") : String(+dose.toFixed(2));
  return `${n} ${unit === "U" ? "units" : unit}`;
}

function teamRouteLabel(e: DrugMenuEntry): string {
  return e.teamRoute === "im" ? "Team gives (IM)" : "Team gives (IV)";
}

function useCapabilityVersion(cap: DrugsCapability) {
  const sub = useCallback((fn: () => void) => cap.subscribe(fn), [cap]);
  useSyncExternalStore(
    sub,
    () => cap.version(),
    () => cap.version()
  );
  // the clock and the monitor move without an order: a gentle refresh while the tab is open
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1e9), 1000);
    return () => clearInterval(id);
  }, []);
}

function Drugs({ target, policy }: ControlTabProps) {
  const cap = target.capability("drugs");
  if (!cap) return <div className="text-[12px] text-ink-faint">No drug orders in this lab.</div>;
  return <DrugsPanel cap={cap} mode={policy.mode} />;
}

function DrugsPanel({ cap, mode }: { cap: DrugsCapability; mode: AssessmentMode }) {
  useCapabilityVersion(cap);
  const [entryId, setEntryId] = useState(cap.menu[0].id);
  const entry = cap.menu.find((e) => e.id === entryId) ?? cap.menu[0];
  const [via, setVia] = useState<DrugVia>(entry.vias[0]);
  const [dose, setDose] = useState<number | null>(null);
  const [other, setOther] = useState("");
  const [result, setResult] = useState<DrugResult | null>(null);
  const viaNow = entry.vias.includes(via) ? via : entry.vias[0];
  const doses = menuDoses(entry, viaNow);
  // the reminder before the first nitrate is a guided aid: guided and supervised modes only
  const aids = mode === "guided" || mode === "supervised";

  const sys = cap.monitorSystolic();
  const since = cap.sinceVasodilatorS();
  const orders = cap.orders();
  const onTable = cap.onTable();
  const lines = cap.lines(5);
  // the read-back answers only while there is something to answer or cancel
  const readback = cap.readbackPending();
  const cancellable = cap.teamOrderOpen();
  const anyNitrate = orders.some((o) => o.drug === "gtn");
  const syringe = cap.tableSyringe();
  const typed = Number(other.replace(",", "."));
  const chosen = other.trim() ? (Number.isFinite(typed) && typed > 0 ? typed : null) : dose;

  const pick = (id: string) => {
    const e = cap.menu.find((x) => x.id === id);
    setEntryId(id);
    setDose(null);
    setOther("");
    if (e && !e.vias.includes(via)) setVia(e.vias[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
        <div className="stat">
          <span className="stat-label">Systolic on the monitor</span>
          <span className="stat-value" aria-live="polite">
            {sys ? `${sys.sys} mmHg` : "No reading"}
            {sys?.source === "cuff" && <span className="ml-1.5 text-[12px] text-ink-faint">cuff</span>}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Since the last vasodilator</span>
          <span className="stat-value">{since === null ? "None given" : mmss(since)}</span>
        </div>
        {cap.hasTeam() && (
          <button className="btn h-8 px-2 text-[13px]" onClick={() => cap.askPde5()} title="Ask the patient about PDE-5 inhibitors">
            Ask about PDE-5 inhibitors
          </button>
        )}
      </div>

      {aids && !anyNitrate && <div className="text-[12px] text-ink-faint">Before the first nitrate: PDE-5 inhibitors asked about, and the echo checked for outflow tract obstruction.</div>}

      <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Drug">
        {cap.menu.map((e) => (
          <button key={e.id} className={`btn h-7 px-2 text-[12px] ${e.id === entry.id ? "!border-accent !text-ink" : ""}`} aria-pressed={e.id === entry.id} onClick={() => pick(e.id)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {entry.vias.length > 1 ? (
          <div className="seg" role="group" aria-label="Route">
            {entry.vias.map((v) => (
              <button
                key={v}
                className={`seg-btn ${v === viaNow ? "seg-btn-active" : ""}`}
                aria-pressed={v === viaNow}
                onClick={() => {
                  setVia(v);
                  if (dose !== null && !menuDoses(entry, v).includes(dose)) setDose(null);
                }}
              >
                {v === "team" ? teamRouteLabel(entry) : VIA_LABEL[v]}
              </button>
            ))}
          </div>
        ) : (
          <span className="chip">{viaNow === "team" ? teamRouteLabel(entry) : VIA_LABEL[viaNow]}</span>
        )}
        <div className="seg" role="group" aria-label="Dose">
          {doses.map((d) => (
            <button
              key={d}
              className={`seg-btn ${d === dose && !other.trim() ? "seg-btn-active" : ""}`}
              aria-pressed={d === dose && !other.trim()}
              onClick={() => {
                setDose(d);
                setOther("");
              }}
            >
              {fmt(d, entry.unit)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[12px] text-ink-faint">
          Other
          <input className="field h-7 w-20 text-[13px]" inputMode="decimal" value={other} onChange={(e) => setOther(e.target.value)} aria-label={`Other dose, ${entry.unit === "U" ? "units" : entry.unit}`} />
          <span>{entry.unit === "U" ? "units" : entry.unit}</span>
        </label>
        <button
          className="btn btn-accent h-8 px-3 text-[13px]"
          disabled={chosen === null}
          onClick={() => {
            if (chosen === null) return;
            setResult(cap.order({ entryId: entry.id, dose: chosen, via: viaNow }));
          }}
        >
          Order
        </button>
      </div>
      <div className="text-[11.5px] text-ink-faint">Doses shown: {entry.source}.</div>

      {onTable.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {onTable.map((r) => (
            <span key={r.id} className="flex items-center gap-1.5">
              <span className="chip">
                {r.label} {fmt(r.dose, r.unit)}, {VIA_INLINE[r.via]}
              </span>
              <button className="btn h-7 px-2 text-[12px]" onClick={() => setResult(cap.give(r.id))}>
                Give
              </button>
              <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => setResult(cap.discard(r.id))} title="Take this syringe off the table without giving it">
                Discard
              </button>
            </span>
          ))}
        </div>
      )}

      {syringe && (
        <div className="w-full max-w-[360px] overflow-hidden rounded-md border border-line">
          <TableView readOnly attachTrackpad={false} cropToDrug drug={syringe} height={110} state={INSET_STATE} />
        </div>
      )}

      {result && !result.ok && (
        <div className={`notice ${result.reason === "stopped" || result.reason === "declined" ? "notice-warn" : "notice-info"}`} role="status">
          {result.utterance ? `Attending: ${result.text}` : result.text}
        </div>
      )}

      {(lines.length > 0 || cancellable) && (
        <div className="space-y-0.5 text-[12px]" aria-label="Team">
          {lines.map((l, i) => (
            <div key={i} className="text-ink-soft">
              <span className="font-mono text-ink-faint">{l.clock}</span> <span className="capitalize text-ink-faint">{l.speaker}</span>: {l.text}
            </div>
          ))}
          {cancellable && (
            <div className="flex gap-1">
              {readback && (
                <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => cap.confirm()} title="Confirm the last read-back">
                  Correct
                </button>
              )}
              <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => cap.reject()} title="Reject the last read-back, or cancel the newest open order">
                No, cancel
              </button>
            </div>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <ul className="space-y-0.5 text-[12px] text-ink-soft" aria-label="Drug orders">
          {orders
            .slice(-5)
            .reverse()
            .map((r) => {
              const team = r.status === "with-team" ? cap.teamStatus(r) : null;
              return (
                <li key={r.id}>
                  <span className="font-mono text-ink-faint">{r.clock ?? mmss(r.t)}</span> {r.label} {fmt(r.dose, r.unit)}, {r.via === "team" ? (r.route === "im" ? "IM" : "IV") : VIA_INLINE[r.via]}: {team ? TEAM_STATUS[team] ?? team : STATUS_LABEL[r.status]}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "drugs",
  label: "Drugs",
  // after the core tabs (10 to 40)
  order: 45,
  labs: ["diagnostic"],
  // only where the lab provides its drug orders (a bare target without capabilities shows nothing)
  visible: (t: LabControlsTarget) => typeof t.capability === "function" && t.capability("drugs") !== null,
  Component: Drugs,
};
