// The transducer and manifold set-up of the haemodynamics lab (haemo-transducer-and-setup): level the
// transducer at the mid-thoracic level, zero it to air, run and read a fast-flush test, clear what
// damps the line, and flush the manifold's ports before anything is injected through it. The panel
// shows what an operator sees (where the transducer sits when it is checked, whether the monitor has
// been zeroed, the flush response, a bubble that is visible); what was wrong and the true pressures
// appear only in the debrief, after the diagnosis is submitted. Generic device names only.
import { useMemo } from "react";
import {
  LEVEL_LANDMARKS,
  LINE_FIXES,
  MANIFOLD_PORTS,
  CHAIN_DT_S,
  displayedMeasure,
  setupChecks,
  setupDebrief,
  landmarkHeightCm,
  setupLineSpec,
  shownChambers,
  studySetup,
  type HaemoAction,
  type HaemoStudyState,
  type SetupFault,
  type TransducerSetup,
} from "../../simulation/haemoStudy";
import { Transducer, type FlushReading } from "../../simulation/patient/transducer";
import type { ChamberMeasure } from "../../simulation/haemo";

export interface SetupPanelProps {
  study: HaemoStudyState;
  dispatch: (a: HaemoAction) => void;
  /** controls are locked once the study is submitted */
  disabled?: boolean;
}

const READING_LABEL: Record<FlushReading, string> = {
  optimal: "One or two oscillations (normal)",
  overdamped: "No oscillation (overdamped)",
  underdamped: "Several oscillations (underdamped)",
};

const FAULT_LABEL: Record<SetupFault, string> = {
  "not-level": "not level",
  "not-zeroed": "not zeroed",
  "open-to-air": "open to air",
  overdamped: "overdamped line",
  underdamped: "underdamped line",
  optimal: "",
};

/** The response of the line to a fast flush released at a baseline pressure, as the monitor's frozen flush strip shows it. */
export function flushStrip(su: TransducerSetup, baseline: number): { t: number; p: number }[] {
  const tr = new Transducer(setupLineSpec(su));
  tr.setAir(su.line.airMl);
  tr.setLumenPlug(su.line.clot);
  tr.zero();
  tr.st.x = baseline;
  for (let t = 0; t < 0.2; t += CHAIN_DT_S) tr.step(CHAIN_DT_S, baseline);
  tr.fastFlush();
  const out: { t: number; p: number }[] = [];
  const flushS = tr.st.flushLeftS ?? 0;
  let t = 0;
  for (; t < flushS - 0.06; t += CHAIN_DT_S) tr.step(CHAIN_DT_S, baseline);
  for (let i = 0; t < flushS + 0.4; t += CHAIN_DT_S, i++) {
    const y = tr.step(CHAIN_DT_S, baseline);
    if (i % 2 === 0) out.push({ t, p: y });
  }
  return out;
}

/** Time grid of the frozen flush strip, s (MODEL PARAMETER: one small square of a 25 mm/s strip), so that the ringing period can be read. */
export const FLUSH_GRID_S = 0.04;

function FlushStrip({ pts }: { pts: { t: number; p: number }[] }) {
  if (pts.length < 2) return null;
  const w = 320;
  const h = 84;
  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t;
  const lo = Math.min(...pts.map((q) => q.p));
  const hi = Math.max(...pts.map((q) => q.p));
  const span = Math.max(1, hi - lo);
  const x = (t: number) => ((t - t0) / (t1 - t0)) * w;
  const d = pts.map((q, i) => `${i ? "L" : "M"}${x(q.t).toFixed(1)},${(4 + (1 - (q.p - lo) / span) * (h - 8)).toFixed(1)}`).join("");
  const grid: number[] = [];
  for (let t = t0 + FLUSH_GRID_S; t < t1; t += FLUSH_GRID_S) grid.push(x(t));
  return (
    <div className="monitor rounded-md">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[84px]" role="img" aria-label="Fast-flush response">
        <g className="text-ink-faint" stroke="currentColor" strokeOpacity={0.3} strokeWidth={0.5}>
          {grid.map((gx, i) => (
            <line key={i} x1={gx} x2={gx} y1={0} y2={h} />
          ))}
        </g>
        <path d={d} fill="none" className="text-spo2" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <div className="px-2 pb-1 text-right font-mono text-[11px] text-ink-faint">grid {Math.round(FLUSH_GRID_S * 1000)} ms</div>
    </div>
  );
}

const fmtM = (m: ChamberMeasure, ch: string) =>
  ch === "RA" || ch === "PCWP" ? `a ${m.a} · v ${m.v} · mean ${m.mean}` : ch === "LV" || ch === "RV" ? `${m.sys} / ${m.dia} · EDP ${m.edp}` : `${m.sys} / ${m.dia} · mean ${m.mean}`;

export default function SetupPanel({ study, dispatch, disabled = false }: SetupPanelProps) {
  const su = studySetup(study);
  const locked = disabled || study.answer !== null;
  const shown = shownChambers(study);
  const catheterIn = study.rhc >= 0 || study.lhc !== "none";
  const shownMean = shown.length ? displayedMeasure(study, shown[0]).mean : 0;
  const baseline = Number.isFinite(shownMean) ? shownMean : 0;
  // the strip of the last flush, frozen when it was run
  const strip = useMemo(() => (su.flushes > 0 ? flushStrip(su, baseline) : []), [su.flushes]);
  const tableNote = su.tableCm === 0 ? null : `The table has been ${su.tableCm > 0 ? "raised" : "lowered"} ${Math.abs(su.tableCm)} cm since the study began.`;
  const checkNote =
    su.lastCheck === null ? null : su.lastCheck === "level" ? "The transducer sits at the mid-thoracic level." : su.lastCheck === "above" ? "The transducer sits above the mid-thoracic level." : "The transducer sits below the mid-thoracic level.";

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Transducer and manifold</span>
        <span className="font-mono normal-case tracking-normal text-ink-faint">{su.mount === "pole" ? "pole-mounted transducer" : "transducer on the table rail"}</span>
      </div>
      <div className="p-3 grid md:grid-cols-2 gap-4 text-[13px]">
        <div className="space-y-2">
          <div className="stat-label">Level</div>
          <div className="seg">
            {(["pole", "table"] as const).map((m) => (
              <button key={m} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${su.mount === m ? "seg-btn-active" : ""}`} disabled={locked} onClick={() => dispatch({ type: "setup-mount", mount: m })}>
                {m === "pole" ? "on the pole" : "on the table rail"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {LEVEL_LANDMARKS.map((l) => (
              <button key={l.id} className={`btn !justify-start !text-left !py-1 ${su.landmark === l.id ? "btn-accent" : ""}`} disabled={locked} onClick={() => dispatch({ type: "setup-level", landmark: l.id })}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost !py-1" disabled={locked} onClick={() => dispatch({ type: "setup-check-level" })}>
              Check the level
            </button>
            {checkNote && <span className="text-ink-soft">{checkNote}</span>}
          </div>
          {tableNote && <p className="text-ink-soft">{tableNote}</p>}

          <div className="stat-label pt-1">Zero</div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="seg">
              {(["patient", "air"] as const).map((to) => (
                <button key={to} className={`seg-btn !px-2 !py-0.5 !text-[12px] ${(to === "air") === su.openToAir ? "seg-btn-active" : ""}`} disabled={locked} onClick={() => dispatch({ type: "setup-stopcock", to })}>
                  {to === "air" ? "open to air" : "open to patient"}
                </button>
              ))}
            </div>
            <button className="btn btn-good !py-1" disabled={locked} onClick={() => dispatch({ type: "setup-zero" })}>
              Zero
            </button>
            <span className={`chip font-mono ${su.zeroed ? "text-good" : "text-ink-faint"}`}>{su.zeroed ? "zeroed" : "not zeroed"}</span>
          </div>
          {!su.zeroed && su.zeroRefused > 0 && <p className="text-ink-soft">The monitor will not zero while the transducer is open to the patient.</p>}
        </div>

        <div className="space-y-2">
          <div className="stat-label">Line</div>
          <div className="text-ink-soft">{su.line.long ? `Long extension line (${setupLineSpec(su).lineCm} cm) between manifold and transducer` : "Short standard line between manifold and transducer"}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-accent !py-1" disabled={locked} onClick={() => dispatch({ type: "setup-fast-flush" })}>
              Fast flush
            </button>
            {su.flushes > 0 && <span className="text-ink-faint">flush test {su.flushes}</span>}
          </div>
          {strip.length > 0 && <FlushStrip pts={strip} />}
          {su.awaitingReading && (
            <div className="space-y-1">
              <div className="text-ink-soft">What did the flush show?</div>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(READING_LABEL) as FlushReading[]).map((r) => (
                  <button key={r} className="btn !py-1 !text-[12px]" disabled={locked} onClick={() => dispatch({ type: "setup-read-flush", reading: r })}>
                    {READING_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {LINE_FIXES.map((f) => (
              <button key={f.id} className="btn btn-ghost !py-1 !text-[12px]" disabled={locked || (f.id === "standard-line" && !su.line.long)} onClick={() => dispatch({ type: "setup-fix", fix: f.id })}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="stat-label">Manifold</div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {su.manifold.map((p, i) => {
              const seen = p.air && !p.hidden;
              return (
                <div key={i} className="flex items-center justify-between gap-2 border border-line rounded-md px-2 py-1">
                  <span>
                    Port {i + 1} <span className="text-ink-faint">({MANIFOLD_PORTS[i]})</span>
                  </span>
                  <span className={`font-mono text-[12px] ${seen ? "text-danger" : "text-ink-faint"}`}>{seen ? "air bubble" : "no air seen"}</span>
                  <button className="btn btn-ghost !py-0.5 !text-[12px]" disabled={locked} onClick={() => dispatch({ type: "manifold-flush", port: i })}>
                    Flush port
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost !py-1" disabled={locked} onClick={() => dispatch({ type: "manifold-inspect" })}>
              Inspect the manifold
            </button>
            <button className="btn !py-1" disabled={locked || !catheterIn} title={catheterIn ? undefined : "Needs a catheter in the patient"} onClick={() => dispatch({ type: "manifold-inject" })}>
              Flush the catheter through the manifold
            </button>
          </div>
        </div>
      </div>
      {study.answer !== null && (su.preset || setupDebrief(study).some((r) => r.faults.length > 0)) && <SetupDebrief study={study} />}
    </div>
  );
}

/** The set-up checks, the recorded against the true pressures and the flush readings (after the diagnosis). */
export function SetupDebrief({ study }: { study: HaemoStudyState }) {
  const su = studySetup(study);
  const checks = setupChecks(study);
  const rows = setupDebrief(study);
  return (
    <div className="border-t border-line p-3 space-y-3 text-[13px]">
      <div className="stat-label">Set-up debrief</div>
      {su.airInjected && <p className="text-danger font-semibold">Critical error: air was injected through the manifold.</p>}
      {su.preset === "setup-v4-level" && <p className="text-ink-soft">The colleague who set up the study had levelled the transducer with the V4 electrode, about {Math.round(landmarkHeightCm("v4") - landmarkHeightCm("mid-thoracic"))} cm above the mid-thoracic level.</p>}
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.key} className={c.ok ? "text-good" : "text-danger"}>
            {c.ok ? "✓" : "✗"} {c.label}
          </li>
        ))}
      </ul>
      {su.readings.length > 0 && (
        <div>
          <div className="stat-label mb-1">Fast-flush readings</div>
          <ul className="space-y-0.5">
            {su.readings.map((r, i) => (
              <li key={i} className={r.given === r.expected ? "text-good" : "text-danger"}>
                Flush {i + 1}: read as {r.given}; the line was {r.expected}
              </li>
            ))}
          </ul>
        </div>
      )}
      {rows.length > 0 && (
        <table className="w-full font-mono text-[12.5px]">
          <thead>
            <tr className="text-ink-faint text-left">
              <th className="px-2 py-1 font-normal">Chamber</th>
              <th className="px-2 py-1 font-normal">Recorded</th>
              <th className="px-2 py-1 font-normal">True</th>
              <th className="px-2 py-1 font-normal">Set-up at the time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.set}-${r.chamber}`} className="border-t border-line/50">
                <td className="px-2 py-1">
                  {r.chamber === "PCWP" ? "Wedge" : r.chamber}
                  {r.set !== "base" ? ` (${r.set === "pre" ? "before PCI" : "after PCI"})` : ""}
                </td>
                <td className="px-2 py-1">{fmtM(r.recorded, r.chamber)}</td>
                <td className="px-2 py-1">{fmtM(r.truth, r.chamber)}</td>
                <td className={`px-2 py-1 ${r.faults.length ? "text-danger" : "text-good"}`}>{r.faults.length ? r.faults.map((f) => FAULT_LABEL[f]).join(", ") : "sound"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-ink-soft">
        A level error shifts every pressure, the mean included; a damped or ringing line changes the systolic and diastolic values while the mean stays close, so decide on the mean until the line is fixed.
      </p>
    </div>
  );
}
