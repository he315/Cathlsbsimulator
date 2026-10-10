import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { removeDevice } from "../../../simulation/angioPci";
import {
  acqOf,
  armOct,
  calibrateImaging,
  clearViewImaging,
  imagingFrameAt,
  ivusContext,
  lastAssessment,
  loadImaging,
  purgeImaging,
  recordAssessment,
  recordImagingNitrate,
  recordCalciumRule,
  recordFinalChecklist,
  setImagingSettings,
  startImagingRun,
  aortoOstial,
} from "../../../simulation/pci/actions/imaging";
import { IVUS_PULLBACK_SPEEDS, OCT_MODES, MP_MISCALIBRATION_SCALE, MP_RINGDOWN_MM, acquisitionArtefacts, nextStepFor, type FrameArtefacts, type IvusFrame, type OctMode, type RunAssessment } from "../../../simulation/pci/ivus";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import IntravascularView from "../../imaging/IntravascularView";
import LongitudinalView, { longitudinalSamples, type LongitudinalSample } from "../../imaging/LongitudinalView";
import MeasureTools, { PullbackMarkers, type Measurement } from "../../imaging/MeasureTools";
import { applyImagingAction, flushSettings, nitrateGiven, octFlushThroughGuide, setFlushSettings } from "../inputBindings/imaging";
import { leftMainCase } from "../../lab/pciEvents/imaging";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The imaging console (pci-intravascular-imaging): IVUS and OCT in the PCI
// lab, on the frame generator and renderer the bench uses. Read-outs and
// settings only: the hands take the catheter along the wire, hold it, and push
// the OCT flush through the guide's syringe (src/ui/pci/inputBindings/imaging.ts).
//
// Here the operator chooses the catheter (rotational IVUS, phased-array IVUS or
// OCT, generic names), prepares it (flush or purge, calibration, clear view),
// sets the pullback (IVUS speed, OCT survey or high-resolution mode, the flush
// by injector or by hand, its rate and duration and the volume they make),
// starts the motor or enables the OCT run, and reads the run: the longitudinal
// view, the cross-section at the cursor with the measuring tools (trace, caliper,
// arc, thickness) and markers along the pullback for lengths. The trainee's
// numbers become the run's assessment; in guided practice the console says
// what those numbers call for. Nothing here shows the run's truth (ivusReport):
// that is for the debrief. In a calcified case the OCT calcium rule is asked
// before preparation, and after stenting the final-result checklist is
// recorded for the attending.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "imaging", label: "Intravascular imaging", order: 40 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";
const NUM = "w-16 bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink font-mono";
const PX_PER_MM = 26;

/** Imaging catheters in the console's menu: generic names from the catalogue. */
const CATHETERS = ["ivus", "ivus-phased", "oct"].filter((id) => !!DEVICE_BY_ID[id]);

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 border-t border-line pt-2 first:border-t-0 first:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      {children}
    </div>
  );
}

/** The acquisition's artefacts drawn over the cross-section (what the console image shows; no labels). */
function ArtefactOverlay({ frame }: { frame: IvusFrame }) {
  const a = frame.artefacts;
  if (!a) return null;
  const C = 150;
  const s = PX_PER_MM;
  return (
    <svg viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {a.noImage && <rect x={0} y={0} width={300} height={300} className="fill-black" />}
      {a.blood && !a.noImage && (
        <g>
          <defs>
            <filter id="ivi-blood">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
              <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.9 0" />
            </filter>
          </defs>
          <circle cx={C} cy={C} r={Math.max(...frame.lumen) * s} filter="url(#ivi-blood)" />
        </g>
      )}
      {a.ringDown && !a.noImage && <circle cx={C} cy={C} r={MP_RINGDOWN_MM * s} className="fill-white/80" />}
      {a.air && !a.noImage && <path d={`M${C},${C} L${C + 150 * Math.cos(-0.4)},${C + 150 * Math.sin(-0.4)} A150,150 0 0 1 ${C + 150 * Math.cos(0.5)},${C + 150 * Math.sin(0.5)} Z`} className="fill-black/85" />}
    </svg>
  );
}

function CatheterSection({ session }: { session: PciLabSession }) {
  const st = session.st;
  const acq = acqOf(st);
  const [specId, setSpecId] = useState<string>(CATHETERS[0] ?? "ivus");
  const dev = st.device;
  const label = acq ? DEVICE_BY_ID[acq.specId]?.label ?? acq.specId : null;
  return (
    <Section title="Catheter">
      {acq ? (
        <>
          <Row label="On the wire">{label}</Row>
          <Row label="Held">{acq.held ? "catheter and wire held" : "not held"}</Row>
          {acq.kinked && <div className="text-[12px] text-ink">No image from the catheter.</div>}
          <button className="btn !py-1 text-[12px]" disabled={!!st.ivus?.active} onClick={() => applyImagingAction(session, "remove-device", (x) => removeDevice(x))}>
            Take it out
          </button>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={specId} onChange={(e) => setSpecId(e.target.value)} className={SELECT} aria-label="Imaging catheter">
            {CATHETERS.map((id) => (
              <option key={id} value={id}>
                {DEVICE_BY_ID[id].label}
              </option>
            ))}
          </select>
          <button className="btn !py-1 text-[12px]" disabled={!!dev} onClick={() => applyImagingAction(session, "load-device", (x) => loadImaging(x, specId))} title="Open it onto the table and take it onto the wire, to the guide tip">
            Take onto the wire
          </button>
        </div>
      )}
    </Section>
  );
}

function PrepSection({ session }: { session: PciLabSession }) {
  const acq = acqOf(session.st)!;
  const act = (f: Parameters<typeof applyImagingAction>[2]) => applyImagingAction(session, "load-device", f);
  return (
    <Section title="Preparation">
      {acq.tech === "phased-array" ? (
        <>
          <Row label="Clear view">{acq.clearView ? "done" : "not done"}</Row>
          <button className="btn !py-1 text-[12px]" onClick={() => act((x) => clearViewImaging(session.s, session.g, x))} title="Press with the catheter in a roomy segment or at the root">
            Clear view
          </button>
        </>
      ) : (
        <>
          <Row label={acq.tech === "oct" ? "Purge (undiluted contrast)" : "Flush"}>{acq.purging ? "in progress" : acq.purged ? "done" : "not done"}</Row>
          {acq.tech === "oct" && <Row label="Calibration">{acq.calibrated || acq.calibratedWhilePurging ? "pressed" : "not done"}</Row>}
          <div className="flex flex-wrap gap-1.5">
            {acq.purging ? (
              <button className="btn !py-1 text-[12px]" onClick={() => act((x) => purgeImaging(x, "end"))}>
                Stop {acq.tech === "oct" ? "purging" : "flushing"}
              </button>
            ) : (
              <button className="btn !py-1 text-[12px]" onClick={() => act((x) => purgeImaging(x, "start"))}>
                {acq.tech === "oct" ? "Purge" : "Flush"}
              </button>
            )}
            {acq.tech === "oct" && (
              <button className="btn !py-1 text-[12px]" onClick={() => act((x) => calibrateImaging(x))}>
                Calibrate
              </button>
            )}
          </div>
        </>
      )}
    </Section>
  );
}

function RunSection({ session }: { session: PciLabSession }) {
  const st = session.st;
  const acq = acqOf(st)!;
  const run = st.ivus;
  const flush = flushSettings(session);
  const [, bump] = useState(0);
  const setFlush = (p: Parameters<typeof setFlushSettings>[1]) => {
    setFlushSettings(session, p);
    bump((n) => n + 1);
  };
  const act = (f: Parameters<typeof applyImagingAction>[2]) => applyImagingAction(session, "load-device", f);
  const recorded = run?.recorded ?? [];
  const span = runSpan(recorded);
  const pulled = span.hi - span.lo;
  // without a team the trainee reports the nitrate here; with one, the team's telemetry is read
  const teamNitrate = session.crew ? nitrateGiven(session) : false;
  return (
    <Section title="Pullback">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Row label="Intracoronary nitrate">{acq.nitrate || teamNitrate ? "given" : "not recorded"}</Row>
        {!session.crew && (
          <button className="btn !py-1 text-[12px]" disabled={acq.nitrate} onClick={() => act((x) => recordImagingNitrate(x))} title="Record that intracoronary nitrate was given before the run">
            Nitrate given
          </button>
        )}
      </div>
      {acq.tech === "oct" ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={acq.octMode} onChange={(e) => act((x) => setImagingSettings(x, { octMode: e.target.value as OctMode }))} className={SELECT} aria-label="OCT mode">
              {(Object.keys(OCT_MODES) as OctMode[]).map((m) => (
                <option key={m} value={m}>
                  {m === "survey" ? "Survey" : "High resolution"}: {OCT_MODES[m].lengthMm} mm at {OCT_MODES[m].speedMmS} mm/s
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
            <label className="flex items-center gap-1">
              <input type="radio" checked={flush.injector} onChange={() => setFlush({ injector: true })} /> Injector
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={!flush.injector} onChange={() => setFlush({ injector: false })} /> By hand
            </label>
            <label className="flex items-center gap-1">
              <input className={NUM} type="number" min={0.5} max={8} step={0.5} value={flush.rateMlS} onChange={(e) => setFlush({ rateMlS: Number(e.target.value) })} aria-label="Flush rate" /> mL/s
            </label>
            <label className="flex items-center gap-1">
              <input className={NUM} type="number" min={0.5} max={8} step={0.5} value={flush.durationS} onChange={(e) => setFlush({ durationS: Number(e.target.value) })} aria-label="Flush duration" /> s
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={flush.manualTrigger} onChange={(e) => setFlush({ manualTrigger: e.target.checked })} /> Trigger by hand
            </label>
          </div>
          <Row label="Flush volume">{(flush.rateMlS * flush.durationS).toFixed(1)} mL</Row>
          <Row label="Console">{acq.armed ? "enabled: inject to start" : "not enabled"}</Row>
          <div className="flex flex-wrap gap-1.5">
            <button className="btn !py-1 text-[12px]" disabled={acq.armed || !!run?.active} onClick={() => act((x) => armOct(x))} title="Enable the run; it starts when the flush clears the lumen">
              Enable
            </button>
            {flush.injector && (
              <button className="btn !py-1 text-[12px]" disabled={!!run?.active} onClick={() => octFlushThroughGuide(session)} title="The injector's start switch">
                Start injector
              </button>
            )}
          </div>
          {!flush.injector && <div className="text-[12px] text-ink-faint">By hand: push the flush on the guide syringe.</div>}
          {acq.flush && <Row label="Last flush">{`${acq.flush.volumeMl.toFixed(1)} mL · ${acq.contrastMl.toFixed(0)} mL with this catheter`}</Row>}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={acq.speedMmS} onChange={(e) => act((x) => setImagingSettings(x, { speedMmS: Number(e.target.value) }))} className={`${SELECT} font-mono`} aria-label="Pullback speed">
              {IVUS_PULLBACK_SPEEDS[acq.tech].map((v) => (
                <option key={v} value={v}>
                  {v} mm/s
                </option>
              ))}
            </select>
            <button className="btn !py-1 text-[12px]" disabled={!!run?.active} onClick={() => act((x) => startImagingRun(session.s, session.g, x, { nitrate: teamNitrate }))} title="Start the motorised pullback from where the transducer is">
              Start pullback
            </button>
          </div>
        </>
      )}
      <Row label="Run">{run?.active ? `recording · ${pulled.toFixed(1)} mm` : recorded.length > 1 ? `${pulled.toFixed(1)} mm recorded` : "none"}</Row>
    </Section>
  );
}

type Use = "msa" | "mla" | "proxRef" | "distRef" | "malapposition";
const USE_LABEL: Record<Use, string> = { msa: "MSA", mla: "MLA", proxRef: "Prox ref", distRef: "Dist ref", malapposition: "Malapposition" };

/** The span of a run's recorded positions (one pass, no spreads). */
function runSpan(recorded: readonly { mm: number }[]): { lo: number; hi: number } {
  let lo = Infinity,
    hi = -Infinity;
  for (const r of recorded) {
    if (r.mm < lo) lo = r.mm;
    if (r.mm > hi) hi = r.mm;
  }
  return recorded.length ? { lo, hi } : { lo: 0, hi: 0 };
}

/**
 * A longitudinal column as the acquisition recorded it: a jumped or blood-filled frame shows no wall (the
 * lumen, vessel and struts are not seen), and ring-down hides the lumen border within its near field.
 */
function maskSample(x: LongitudinalSample, a: FrameArtefacts): LongitudinalSample {
  if (a.noImage || a.jump || a.blood) return { ...x, lumenR: 0, eemR: 0, stentR: null, calcium: false, calciumMm: null };
  if (a.ringDown) return { ...x, lumenR: Math.max(x.lumenR, MP_RINGDOWN_MM) };
  return x;
}

function ReadSection({ session }: { session: PciLabSession }) {
  const st = session.st;
  const run = st.ivus;
  const acq = run?.acq ?? null;
  const recorded = run?.recorded ?? [];
  const { lo, hi } = useMemo(() => runSpan(recorded), [recorded]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [marks, setMarks] = useState<Record<string, number | undefined>>({});
  const [length, setLength] = useState<number | null>(null);
  const [vals, setVals] = useState<Partial<Record<Use, number>>>({});
  const [edge, setEdge] = useState<{ on: boolean; edge: "proximal" | "distal"; arcDeg: number; lengthMm: number }>({ on: false, edge: "distal", arcDeg: 0, lengthMm: 0 });
  const [thrombus, setThrombus] = useState(false);
  const tree = session.drawTree;
  const active = !!run?.active;
  const ostial = aortoOstial(session.s, session.g);
  // the run is read once it has stopped: nothing below is recomputed while it records
  const acqKey = acq ? `${acq.specId}|${acq.kinked}|${acq.purged}|${acq.clearView}|${acq.jumps.length}|${acq.flush?.t ?? ""}` : "";
  const ctxKey = active ? "live" : `${st.severity}|${st.stents.length}|${st.cx.list.length}|${lo}|${hi}|${acq?.modality}|${acqKey}`;
  const samples = useMemo(
    () => (active || !run || !acq || acq.kinked || !(hi > lo + 2) ? [] : longitudinalSamples(ivusContext(session.s, session.g, st, tree), lo, hi).map((x) => maskSample(x, acquisitionArtefacts(run, x.mm, { ostial })))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxKey]
  );
  const regions = useMemo(() => {
    const out: { fromMm: number; toMm: number; kind: "uncleared" }[] = [];
    if (active || !run || acq?.modality !== "OCT" || acq.kinked) return out;
    let from: number | null = null;
    for (let x = lo; x <= hi + 1e-9; x += 0.5) {
      const b = acquisitionArtefacts(run, x, { ostial }).blood;
      if (b && from === null) from = x;
      if (!b && from !== null) {
        out.push({ fromMm: from, toMm: x, kind: "uncleared" });
        from = null;
      }
    }
    if (from !== null) out.push({ fromMm: from, toMm: hi, kind: "uncleared" });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxKey]);
  const mm = Math.max(lo, Math.min(hi, cursor ?? (lo + hi) / 2));
  const frame = useMemo(
    () => (active || !acq || acq.kinked || !(hi > lo + 2) ? null : imagingFrameAt(session.s, session.g, st, tree, mm)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxKey, mm]
  );
  // the run viewer opens in a wide panel over the lab (the console slot is too short to trace a lumen in)
  const [viewerOpen, setViewerOpen] = useState(false);
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);
  if (!acq || !(hi > lo + 2 || active)) return null;
  if (active) {
    return (
      <Section title="Read the run">
        <div className="text-[12px] text-ink-faint">Recording: the run can be read when the pullback stops.</div>
      </Section>
    );
  }
  if (acq.kinked || !frame) {
    return (
      <Section title="Read the run">
        <div className="text-[12px] text-ink">No image.</div>
      </Section>
    );
  }
  // an OCT catheter not calibrated (or calibrated while purging) measures with the wrong scale: the tools themselves are off
  const scale = acq.modality === "OCT" && !acq.calibrated ? MP_MISCALIBRATION_SCALE : 1;
  const blocked = frame.artefacts?.noImage ? "No image." : frame.artefacts?.jump ? "This frame was skipped (the pullback jumped)." : null;
  const use = (m: Measurement, u: Use) => {
    const v = m.tool === "trace" ? m.areaMm2 : m.tool === "caliper" || m.tool === "thickness" ? m.mm : null;
    if (v === null) return;
    setVals((p) => ({ ...p, [u]: v }));
  };
  const postStent = st.stents.length > 0;
  const a: Omit<RunAssessment, "t"> = {
    modality: acq.modality,
    postStent,
    mlaMm2: vals.mla ?? null,
    msaMm2: vals.msa ?? null,
    proxRefMm2: vals.proxRef ?? null,
    distRefMm2: vals.distRef ?? null,
    malappositionMm: vals.malapposition ?? null,
    edgeDissection: edge.on ? { edge: edge.edge, arcDeg: edge.arcDeg, lengthMm: edge.lengthMm } : null,
    thrombus,
  };
  const last = lastAssessment(st);
  const guided = session.policy.mode === "guided";
  const stentD = st.stents.length ? st.stents[st.stents.length - 1].nominal : null;
  const outcome = (
    <>
      {last && <div className="text-[12px] text-ink-faint">Assessment recorded{last.msaMm2 != null ? `: MSA ${last.msaMm2.toFixed(2)} mm²` : ""}.</div>}
      {guided && last && last.postStent && <div className="text-[12px] text-ink">{nextStepFor(last, stentD).text}</div>}
    </>
  );
  const measured = (Object.keys(USE_LABEL) as Use[]).filter((u) => vals[u] !== undefined);
  return (
    <Section title="Read the run">
      <Row label="Recorded">{`${(hi - lo).toFixed(1)} mm`}</Row>
      {measured.length > 0 && <Row label="Measured">{measured.map((u) => USE_LABEL[u]).join(", ")}</Row>}
      <button className="btn !py-1 text-[12px]" onClick={() => setViewerOpen(true)} title="Open the run in a wide panel: the longitudinal view, the cross-section and the measuring tools">
        Read the run
      </button>
      {outcome}
      {viewerOpen &&
        createPortal(
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4" onMouseDown={(e) => e.target === e.currentTarget && setViewerOpen(false)} role="presentation">
            <div className="panel flex max-h-full w-full max-w-[980px] flex-col shadow-panel" role="dialog" aria-label="Read the run">
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <div className="text-[13px] font-semibold text-ink">
                  Read the run · {acq.modality} · {`${(hi - lo).toFixed(1)} mm`}
                </div>
                <button className="btn btn-ghost !py-1 text-[12px]" onClick={() => setViewerOpen(false)} title="Close (Esc)">
                  Close
                </button>
              </div>
              <div className="grid min-h-0 gap-3 overflow-y-auto p-3 md:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-2">
                  <LongitudinalView samples={samples} modality={acq.modality} cursorMm={mm} onCursor={setCursor} regions={regions} />
                  <PullbackMarkers
                    fromMm={lo}
                    toMm={hi}
                    cursorMm={mm}
                    onCursor={setCursor}
                    defs={[
                      { id: "prox", label: "Proximal edge" },
                      { id: "dist", label: "Distal edge" },
                    ]}
                    markers={marks}
                    onMark={(id, x) => setMarks((p) => ({ ...p, [id]: x }))}
                    onLength={setLength}
                  />
                  {length !== null && <Row label="Length between the markers">{`${length.toFixed(1)} mm`}</Row>}
                </div>
                <div className="space-y-2">
                  <div className="relative mx-auto w-full max-w-[300px]">
                    <MeasureTools frame={frame} pxPerMm={PX_PER_MM / scale} blocked={blocked} actions={(m) => (
                      <span className="flex flex-wrap gap-1">
                        {(Object.keys(USE_LABEL) as Use[])
                          .filter((u) => (u === "malapposition" ? m.tool === "caliper" : m.tool === "trace"))
                          .map((u) => (
                            <button key={u} className="btn btn-ghost !py-0.5 text-[11px]" onClick={() => use(m, u)}>
                              {USE_LABEL[u]}
                            </button>
                          ))}
                      </span>
                    )}>
                      <div className="relative">
                        <IntravascularView frame={frame} pxPerMm={PX_PER_MM} />
                        <ArtefactOverlay frame={frame} />
                      </div>
                    </MeasureTools>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {(Object.keys(USE_LABEL) as Use[]).map((u) => (
                      <Row key={u} label={USE_LABEL[u]}>
                        {vals[u] !== undefined ? (u === "malapposition" ? `${vals[u]!.toFixed(2)} mm` : `${vals[u]!.toFixed(2)} mm²`) : "–"}
                      </Row>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={edge.on} onChange={(e) => setEdge((p) => ({ ...p, on: e.target.checked }))} /> Edge dissection
                    </label>
                    {edge.on && (
                      <>
                        <select value={edge.edge} onChange={(e) => setEdge((p) => ({ ...p, edge: e.target.value as "proximal" | "distal" }))} className={SELECT} aria-label="Which edge">
                          <option value="proximal">proximal</option>
                          <option value="distal">distal</option>
                        </select>
                        <label className="flex items-center gap-1">
                          <input className={NUM} type="number" min={0} max={360} step={10} value={edge.arcDeg} onChange={(e) => setEdge((p) => ({ ...p, arcDeg: Number(e.target.value) }))} aria-label="Dissection arc" />°
                        </label>
                        <label className="flex items-center gap-1">
                          <input className={NUM} type="number" min={0} max={30} step={0.5} value={edge.lengthMm} onChange={(e) => setEdge((p) => ({ ...p, lengthMm: Number(e.target.value) }))} aria-label="Dissection length" /> mm
                        </label>
                      </>
                    )}
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={thrombus} onChange={(e) => setThrombus(e.target.checked)} /> Thrombus
                    </label>
                  </div>
                  <button
                    className="btn !py-1 text-[12px]"
                    onClick={() => {
                      // the left main thresholds: the case's own rule (a left main target, or a left main lesion named by the case)
                      const leftMain = leftMainCase(session.snapshot());
                      applyImagingAction(session, "load-device", (x) => recordAssessment(x, { ...a, leftMain }));
                    }}
                    title="Record what you measured and found on this run"
                  >
                    Record the assessment
                  </button>
                  {outcome}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Section>
  );
}

/** The OCT calcium rule, asked before preparation in a calcified case. */
function CalciumRule({ session }: { session: PciLabSession }) {
  const st = session.st;
  const [a, setA] = useState({ arcOver180: false, thicknessOver05: false, lengthOver5: false, modify: false });
  const done = st.log.some((r) => r.kind === "imaging-calcium-rule");
  // an OCT run before stenting whose lens started beyond the lesion (so the run covered it)
  const octRun = (st.ivus?.runs ?? []).some((r) => r.modality === "OCT" && r.stents === 0 && r.beyondLesion);
  if (session.s.calcium < 2 || st.stents.length > 0 || !octRun) return null;
  const score = (a.arcOver180 ? 2 : 0) + (a.thicknessOver05 ? 1 : 0) + (a.lengthOver5 ? 1 : 0);
  return (
    <Section title="Calcium on the OCT run">
      <div className="grid grid-cols-2 gap-1 text-[12px] text-ink-soft">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={a.arcOver180} onChange={(e) => setA((p) => ({ ...p, arcOver180: e.target.checked }))} /> Arc over 180°
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={a.thicknessOver05} onChange={(e) => setA((p) => ({ ...p, thicknessOver05: e.target.checked }))} /> Thickness over 0.5 mm
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={a.lengthOver5} onChange={(e) => setA((p) => ({ ...p, lengthOver5: e.target.checked }))} /> Length over 5 mm
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={a.modify} onChange={(e) => setA((p) => ({ ...p, modify: e.target.checked }))} /> Modify before stenting
        </label>
      </div>
      <Row label="Score">{score} of 4</Row>
      <button className="btn !py-1 text-[12px]" disabled={done} onClick={() => applyImagingAction(session, "load-device", (x) => recordCalciumRule(x, a))}>
        {done ? "Answer recorded" : "Record the answer"}
      </button>
    </Section>
  );
}

/** The final-result checklist, recorded for the attending after stenting. */
function FinalChecklist({ session }: { session: PciLabSession }) {
  const st = session.st;
  const [c, setC] = useState({ expansion: false, apposition: false, edges: false, coverage: false, flow: false });
  if (!st.stents.length || !(st.ivus?.assessments ?? []).some((x) => x.postStent)) return null;
  const done = st.log.some((r) => r.kind === "imaging-final-checklist");
  const items: [keyof typeof c, string][] = [
    ["expansion", "Expansion"],
    ["apposition", "Apposition"],
    ["edges", "Edges"],
    ["coverage", "Lesion covered"],
    ["flow", "Flow"],
  ];
  return (
    <Section title="Final result">
      <div className="flex flex-wrap gap-2 text-[12px] text-ink-soft">
        {items.map(([k, l]) => (
          <label key={k} className="flex items-center gap-1">
            <input type="checkbox" checked={c[k]} onChange={(e) => setC((p) => ({ ...p, [k]: e.target.checked }))} /> {l}
          </label>
        ))}
      </div>
      <button className="btn !py-1 text-[12px]" onClick={() => applyImagingAction(session, "load-device", (x) => recordFinalChecklist(x, c))}>
        {done ? "Record again" : "Record for the attending"}
      </button>
    </Section>
  );
}

export default function ImagingConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  const acq = acqOf(session.st);
  const last = session.st.ivus;
  return (
    <div className="space-y-2" aria-label="Intravascular imaging console">
      <CatheterSection session={session} />
      {acq && <PrepSection session={session} />}
      {acq && <RunSection session={session} />}
      {last?.acq && <ReadSection session={session} />}
      <CalciumRule session={session} />
      <FinalChecklist session={session} />
    </div>
  );
}
