import { useEffect, useMemo, useRef, useState } from "react";
import { QCA_FORESHORTENED_BELOW, QCA_PARAMS, analyseSegment, calibrateOnCatheter, isForeshortened, snapToVessel, type Calibration, type GrayFrame, type Pt, type QcaResult } from "../../simulation/imaging/qca";

// ---------------------------------------------------------------------------
// The trainee's QCA on a stored frame of the reference monitor:
//   1. (policy "after-estimate") the trainee's visual estimate of the stenosis first;
//   2. calibration: two marks along the catheter, its French size;
//   3. the segment: marks from normal proximal to normal distal (two or more);
//   4. the result, labelled as the trainee's own measurement.
// The tool measures pixels only (src/simulation/imaging/qca.ts); it never
// reads the case's lesions.
//
// pci-assessment-policy-qca: the host may set the catheter's French size (the
// PCI lab passes its guide's), offer to record the result as the trainee's
// lesion measurement (onRecord; the PCI lab's submitEstimate), and show a
// teaching hint in guided practice. A stored frame with no image (the WebGL
// read-back failed) cannot be measured: the tool says so and shows no number.
// measureQca and qcaMeasurement are the panel's own steps, pure, for the tests.
//
// diag-qca-measurement: the diagnostic lab's host passes `report`. The result
// then shows the proximal and distal references and their average, the
// diameter stenosis on the average (the stenosis lesson's formula), the
// one-ended stenosis on either reference alone (the error a tapering vessel
// gives), the area stenosis derived from the diameters (assuming a circular
// lumen) and the length from normal to normal. The learner names the segment
// and reports the measurement with the run's view (the report box sits above
// the numbers, so the action is in sight in the reference monitor's short
// pane; the report goes to the log the debrief reads); in guided practice only
// (the host passes `foreshortening`, a teaching aid) a frame that foreshortens
// the named segment is flagged here, in other modes in the debrief. Without
// `report` the result is the earlier one (the PCI lab).
// ---------------------------------------------------------------------------

export type QcaStep = "estimate" | "calibrate" | "segment" | "result";

export interface QcaState {
  step: QcaStep;
  estimatePct: string;
  french: number;
  calMarks: Pt[];
  cal: Calibration | null;
  segMarks: Pt[];
  result: QcaResult | null;
  error: string;
}

/** The catheter size the calibration starts from when the host gives none (the tool's earlier default). */
export const QCA_DEFAULT_FRENCH = 6;

export function useQca(needEstimate: boolean, french: number = QCA_DEFAULT_FRENCH) {
  const [s, setS] = useState<QcaState>(() => fresh(needEstimate, french));
  return {
    s,
    reset: () => setS(fresh(needEstimate, french)),
    set: (p: Partial<QcaState>) => setS((o) => ({ ...o, ...p })),
    setFn: setS,
  };
}

function fresh(needEstimate: boolean, french: number): QcaState {
  return { step: needEstimate ? "estimate" : "calibrate", estimatePct: "", french, calMarks: [], cal: null, segMarks: [], result: null, error: "" };
}

/**
 * Grey-level range below which a stored frame is taken as having no image (a blank buffer from a failed
 * read-back, or an unexposed frame). MODEL PARAMETER of the tool (docs/realism/facts/pkg-pci-assessment-policy-qca.md).
 */
export const QCA_MIN_FRAME_RANGE = 8;

/** Can this stored frame be measured (it holds an image, not a blank buffer)? */
export function frameMeasurable(f: GrayFrame | null | undefined): boolean {
  if (!f || !f.data.length || f.w < 8 || f.h < 8) return false;
  let lo = 255,
    hi = 0;
  // every 7th pixel is enough to tell an image from a uniform buffer
  for (let i = 0; i < f.data.length; i += 7) {
    const v = f.data[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
    if (hi - lo >= QCA_MIN_FRAME_RANGE) return true;
  }
  return false;
}

/** The panel's measurement in one call: calibrate on the catheter between two marks, then analyse the segment. */
export function measureQca(frame: GrayFrame, m: { french: number; calMarks: [Pt, Pt]; segMarks: Pt[] }): { cal: Calibration; result: QcaResult } | { error: string } {
  const cal = calibrateOnCatheter(frame, m.calMarks[0], m.calMarks[1], m.french);
  if (!cal) return { error: CAL_ERROR };
  if (m.segMarks.length < 2) return { error: "Mark the segment with two or more points." };
  const result = analyseSegment(frame, m.segMarks, cal.mmPerPx);
  if (!result) return { error: SEG_ERROR };
  return { cal, result };
}

/** A QCA result as the trainee's lesion measurement (refMm, mldMm, lengthMm with the proximal and distal references). */
export interface QcaMeasurement {
  refMm: number;
  mldMm: number;
  lengthMm: number;
  refProxMm: number;
  refDistMm: number;
  method: "qca";
  visualDsPct?: number;
  mmPerPx: number;
  french: number;
}

export function qcaMeasurement(r: QcaResult, cal: Pick<Calibration, "mmPerPx" | "french">, visualDsPct?: number): QcaMeasurement {
  return {
    refMm: r.refMm,
    mldMm: r.mldMm,
    // no narrowing below the lesion threshold: the segment's length stands for the lesion's
    lengthMm: r.lesionLengthMm > 0 ? r.lesionLengthMm : r.segmentLengthMm,
    refProxMm: r.refProxMm,
    refDistMm: r.refDistMm,
    method: "qca",
    ...(visualDsPct !== undefined && Number.isFinite(visualDsPct) ? { visualDsPct } : {}),
    mmPerPx: cal.mmPerPx,
    french: cal.french,
  };
}

const CAL_ERROR = "No catheter edges found between those marks. Mark two points along the catheter shaft, a few millimetres apart.";
const SEG_ERROR = "The vessel edges could not be followed between those marks. Place the marks on the vessel, from normal segment to normal segment.";

export type QcaApi = ReturnType<typeof useQca>;

/** Consecutive segments sharing a group, in their given order (ungrouped segments stay bare options). */
export function segmentGroups<T extends { group?: string }>(segments: readonly T[]): { group: string | null; items: T[] }[] {
  const out: { group: string | null; items: T[] }[] = [];
  for (const x of segments) {
    const g = x.group ?? null;
    const last = out[out.length - 1];
    if (last && last.group === g) last.items.push(x);
    else out.push({ group: g, items: [x] });
  }
  return out;
}

/** The diagnostic lab's reporting host (diag-qca-measurement). */
export interface QcaReportHost {
  /** the segments the learner may name (SYNTAX labels with their names; a group puts them under a vessel heading) */
  segments: readonly { label: string; name: string; group?: string }[];
  /** the stored run and its view, as the monitor names them ('Run 3, LAO 30  CAU 25') */
  runLabel: string;
  /** foreshortening of a segment in this frame's view: passed in guided practice only (a teaching aid) */
  foreshortening?: (segment: string) => number | undefined;
  /** send the measurement and the named segment to the study's QCA reports */
  onReport: (r: QcaResult, segment: string) => void;
}

/** The guided teaching aid's warning for a foreshortened frame (null: not foreshortened, or not known). */
export function foreshorteningWarning(segment: string, f: number | undefined): string | null {
  if (!isForeshortened(f)) return null;
  return `This view shows segment ${segment} at ${Math.round(f! * 100)}% of its length (below ${Math.round(QCA_FORESHORTENED_BELOW * 100)}%): a foreshortened lesion looks shorter and tighter. Measure it in a view that lays the segment out.`;
}

/** The fraction of the reference that marks the extent of a narrowing, as the result labels it (QCA_PARAMS.lesionFraction). */
const LESION_FRACTION_TEXT = `${Math.round(QCA_PARAMS.lesionFraction * 100)} %`;

/** The diagnostic result: both references and their average, the stenoses, the derived area stenosis, the length. */
export function DiagnosticQcaResult({ r, estimatePct }: { r: QcaResult; estimatePct?: number }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[13px]" data-qca-result="diagnostic">
      <dt className="text-ink-faint">MLD</dt>
      <dd className="text-ink">{r.mldMm.toFixed(2)} mm</dd>
      <dt className="text-ink-faint">Proximal reference</dt>
      <dd className="text-ink">{r.refProxMm.toFixed(2)} mm</dd>
      <dt className="text-ink-faint">Distal reference</dt>
      <dd className="text-ink">{r.refDistMm.toFixed(2)} mm</dd>
      <dt className="text-ink-faint">Average reference</dt>
      <dd className="text-ink">{r.refAvgMm.toFixed(2)} mm</dd>
      <dt className="text-ink-faint">Diameter stenosis</dt>
      <dd className="text-ink">{Math.round(r.dsAvgPct)} % (average reference)</dd>
      <dt className="text-ink-faint">One-ended reference</dt>
      <dd className="text-ink">
        {Math.round(r.dsProxPct)} % proximal, {Math.round(r.dsDistPct)} % distal
      </dd>
      <dt className="text-ink-faint">Area stenosis</dt>
      <dd className="text-ink">{Math.round(r.areaStenosisPct)} % (derived, circular lumen)</dd>
      <dt className="text-ink-faint">Length, normal to normal</dt>
      <dd className="text-ink">{r.segmentLengthMm.toFixed(1)} mm</dd>
      <dt className="text-ink-faint">Below {LESION_FRACTION_TEXT} of reference</dt>
      <dd className="text-ink">{r.lesionLengthMm > 0 ? `${r.lesionLengthMm.toFixed(1)} mm` : "none"}</dd>
      {estimatePct !== undefined && (
        <>
          <dt className="text-ink-faint">Your estimate</dt>
          <dd className="text-ink">{Math.round(estimatePct)} %</dd>
        </>
      )}
    </dl>
  );
}

/** Name the segment and report the measurement (the diagnostic lab). */
function QcaReportBox({ host, result }: { host: QcaReportHost; result: QcaResult }) {
  const [segment, setSegment] = useState("");
  const [reported, setReported] = useState<{ r: QcaResult; segment: string } | null>(null);
  const done = !!reported && reported.r === result && reported.segment === segment;
  const warning = segment && host.foreshortening ? foreshorteningWarning(segment, host.foreshortening(segment)) : null;
  return (
    <div className="space-y-1.5" data-qca-report>
      <div className="flex flex-wrap items-center gap-2">
        <select className="field h-8 py-0 text-[13px]" aria-label="Segment measured" value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">Segment measured</option>
          {segmentGroups(host.segments).map(({ group, items }) => {
            const options = items.map((x) => (
              <option key={x.label} value={x.label}>
                {x.label} {x.name}
              </option>
            ));
            return group ? (
              <optgroup key={group} label={group}>
                {options}
              </optgroup>
            ) : (
              options
            );
          })}
        </select>
        <button
          className="btn btn-accent h-8"
          disabled={!segment || done}
          onClick={() => {
            if (!segment) return;
            host.onReport(result, segment);
            setReported({ r: result, segment });
          }}
          title="Record this measurement for the debrief (the latest report of a lesion stands)"
        >
          {done ? "Reported" : "Report this measurement"}
        </button>
      </div>
      <div className="text-[12px] text-ink-faint">{host.runLabel}</div>
      {warning && (
        <div className="notice notice-warn !py-2 text-[12px]" role="status" data-qca-foreshortened>
          {warning}
        </div>
      )}
    </div>
  );
}

/** Click handling and drawing over the reference image (frame pixel coordinates). */
export function QcaOverlay({ api, frame }: { api: QcaApi; frame: GrayFrame }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { s, set } = api;

  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const k = c.width / frame.w;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineWidth = 1.2 / k;
    const dot = (p: Pt, col: string) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc(p.x, p.y, 2.2 / k * 2, 0, Math.PI * 2);
      g.fill();
    };
    const line = (pts: Pt[], col: string) => {
      if (pts.length < 2) return;
      g.strokeStyle = col;
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke();
    };
    // calibration marks: amber; segment marks and edges: blue (interface accent, not monitor trace colours)
    s.calMarks.forEach((p) => dot(p, "#E9B95A"));
    line(s.calMarks, "rgba(233,185,90,0.7)");
    s.segMarks.forEach((p) => dot(p, "#4F8EF7"));
    if (s.result) {
      line(s.result.trace.leftEdge.slice(2, -2), "#4F8EF7");
      line(s.result.trace.rightEdge.slice(2, -2), "#4F8EF7");
      const i = s.result.mldTraceIndex;
      const a = s.result.trace.leftEdge[i];
      const b = s.result.trace.rightEdge[i];
      if (a && b) line([a, b], "#ECEEF1");
    } else line(s.segMarks, "rgba(79,142,247,0.6)");
  }, [s, frame]);

  const active = s.step === "calibrate" || s.step === "segment";
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!active) return;
    const r = e.currentTarget.getBoundingClientRect();
    // a click lands on the dark structure under it (snapped within a few pixels, as QCA packages do)
    const p = snapToVessel(frame, { x: ((e.clientX - r.left) / r.width) * frame.w, y: ((e.clientY - r.top) / r.height) * frame.h });
    if (s.step === "calibrate") {
      const marks = [...s.calMarks, p].slice(-2);
      if (marks.length === 2) {
        const cal = calibrateOnCatheter(frame, marks[0], marks[1], s.french);
        if (!cal) set({ calMarks: [], error: CAL_ERROR });
        else set({ calMarks: marks, cal, step: "segment", error: "" });
      } else set({ calMarks: marks, error: "" });
    } else if (s.step === "segment") set({ segMarks: [...s.segMarks, p], error: "" });
  };

  return (
    <canvas
      ref={ref}
      width={1024}
      height={1024}
      onClick={onClick}
      className={`absolute inset-0 h-full w-full ${active ? "cursor-crosshair" : "pointer-events-none"}`}
      aria-label={active ? (s.step === "calibrate" ? "Mark the catheter" : "Mark the segment") : undefined}
    />
  );
}

/** Steps, numbers and actions. */
export function QcaPanel({
  api,
  frame,
  onClose,
  onRecord,
  hint,
  report,
}: {
  api: QcaApi;
  frame: GrayFrame;
  onClose: () => void;
  /** record the result as the trainee's lesion measurement (the PCI lab) */
  onRecord?: (m: QcaMeasurement) => void;
  /** a teaching hint shown with the steps (guided practice only; the host decides) */
  hint?: React.ReactNode;
  /** the diagnostic lab's reporting (diag-qca-measurement); absent: the earlier result (the PCI lab) */
  report?: QcaReportHost;
}) {
  const { s, set, reset } = api;
  const [recorded, setRecorded] = useState<QcaResult | null>(null);
  const measure = () => {
    if (!s.cal || s.segMarks.length < 2) return;
    const r = analyseSegment(frame, s.segMarks, s.cal.mmPerPx);
    if (!r) set({ error: SEG_ERROR });
    else set({ result: r, step: "result", error: "" });
  };
  const est = Number(s.estimatePct);
  const estOk = s.estimatePct !== "" && Number.isFinite(est) && est >= 0 && est <= 100;
  const calErrHint = useMemo(() => (s.cal ? `${s.cal.widthPx.toFixed(1)} px across, ${s.cal.n} positions` : ""), [s.cal]);

  return (
    <div className="space-y-2 text-[13px]" aria-label="QCA">
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink">QCA on this frame</span>
        <span className="flex gap-1">
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={reset}>
            Restart
          </button>
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={onClose}>
            Close
          </button>
        </span>
      </div>
      {hint && s.step !== "result" && <div className="notice !py-2 text-[12px]">{hint}</div>}
      {s.step === "estimate" && (
        <div className="space-y-1.5">
          <p className="text-ink-soft">First, your visual estimate of the worst diameter stenosis on this frame.</p>
          <div className="flex items-center gap-2">
            <input className="field h-8 w-20" inputMode="numeric" value={s.estimatePct} onChange={(e) => set({ estimatePct: e.target.value.replace(/[^0-9.]/g, "") })} aria-label="Visual estimate, percent" />
            <span className="text-ink-faint">%</span>
            <button className="btn btn-accent h-8" disabled={!estOk} onClick={() => set({ step: "calibrate" })}>
              Next
            </button>
          </div>
        </div>
      )}
      {s.step === "calibrate" && (
        <div className="space-y-1.5">
          <p className="text-ink-soft">Calibrate on the catheter: click two points along its shaft, a few millimetres apart, where it is straight and not overlapped.</p>
          <label className="flex items-center gap-2 text-ink-soft">
            Catheter size
            <select className="field h-8 py-0" value={s.french} onChange={(e) => set({ french: Number(e.target.value), calMarks: [], cal: null })}>
              {[4, 5, 6, 7, 8].map((f) => (
                <option key={f} value={f}>
                  {f} Fr
                </option>
              ))}
            </select>
          </label>
          <div className="text-[12px] text-ink-faint">{s.calMarks.length} of 2 marks</div>
        </div>
      )}
      {s.step === "segment" && (
        <div className="space-y-1.5">
          <p className="text-ink-soft">Mark the segment from normal vessel proximal to normal vessel distal (two clicks, more to follow a bend), then measure.</p>
          <div className="text-[12px] text-ink-faint">
            Calibration {s.cal ? `${s.cal.mmPerPx.toFixed(3)} mm per pixel (catheter ${calErrHint})` : ""}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-accent h-8" disabled={s.segMarks.length < 2} onClick={measure}>
              Measure
            </button>
            <button className="btn h-8" disabled={!s.segMarks.length} onClick={() => set({ segMarks: s.segMarks.slice(0, -1) })}>
              Undo mark
            </button>
          </div>
        </div>
      )}
      {s.step === "result" && s.result && (
        <div className="space-y-1.5" aria-label="Your measurement">
          <div className="text-[12px] text-ink-faint">Your measurement: edge detection on your marks and your calibration</div>
          {report && <QcaReportBox host={report} result={s.result} />}
          {report ? (
            <DiagnosticQcaResult r={s.result} estimatePct={estOk ? est : undefined} />
          ) : (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[13px]">
            <dt className="text-ink-faint">MLD</dt>
            <dd className="text-ink">{s.result.mldMm.toFixed(2)} mm</dd>
            <dt className="text-ink-faint">Reference</dt>
            <dd className="text-ink">{s.result.refMm.toFixed(2)} mm</dd>
            <dt className="text-ink-faint">Diameter stenosis</dt>
            <dd className="text-ink">{Math.round(s.result.dsPct)} %</dd>
            <dt className="text-ink-faint">Lesion length</dt>
            <dd className="text-ink">{s.result.lesionLengthMm > 0 ? `${s.result.lesionLengthMm.toFixed(1)} mm` : `no narrowing below ${LESION_FRACTION_TEXT} of reference`}</dd>
            <dt className="text-ink-faint">Segment</dt>
            <dd className="text-ink">{s.result.segmentLengthMm.toFixed(1)} mm</dd>
            {estOk && (
              <>
                <dt className="text-ink-faint">Your estimate</dt>
                <dd className="text-ink">{Math.round(est)} %</dd>
              </>
            )}
          </dl>
          )}
          <p className="text-[12px] text-ink-faint">
            QCA carries its own error: calibration on a catheter a few pixels wide, foreshortening in this view, and edge detection on a noisy frame. Measure in the view that lays the segment out longest.
          </p>
          {onRecord && s.cal && (
            <button
              className="btn btn-accent h-8"
              disabled={recorded === s.result}
              onClick={() => {
                if (!s.result || !s.cal) return;
                onRecord(qcaMeasurement(s.result, s.cal, estOk ? est : undefined));
                setRecorded(s.result);
              }}
              title="Use this as your lesion measurement for sizing (it replaces an earlier one)"
            >
              {recorded === s.result ? "Recorded as your measurement" : "Record as my measurement"}
            </button>
          )}
        </div>
      )}
      {s.error && <div className="notice notice-warn !py-2">{s.error}</div>}
    </div>
  );
}
