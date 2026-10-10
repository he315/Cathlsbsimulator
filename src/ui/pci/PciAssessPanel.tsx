import { useState } from "react";
import type { PciState } from "../../simulation/pci/state";
import { SIZING_LABEL, type SizingBasis } from "../../simulation/pci/lesionAssessment";
import { chooseSizing, sizingBases, sizingImaging, submitEstimate, type LesionMeasurement } from "../../simulation/pci/actions/assessment";
import { boxLabel, chartDiameter, deviceFor } from "../../simulation/pci/equipment";
import type { PciLabSession } from "./PciLabSession";
import { usePciSession } from "./consoles/registry";

// ---------------------------------------------------------------------------
// The trainee's lesion measurement and the sizing choice (pci-assessment-policy-qca).
//
// The measurement is the trainee's own: QCA on a stored run on the reference
// monitor (calibrated on the guide, recorded from the QCA steps), or a visual
// estimate entered here. Nothing on this panel comes from the case's truth:
// before a measurement it says so and offers no size. The sizing basis (the
// distal reference, the mean of the references, or the trainee's own IVUS
// reference after an IVUS run) gives the size chooseSizing implies, shown as
// the tray's default with the box label and the compliance chart of the
// catalogue (equipment.ts boxLabel and chartDiameter); the learner still takes
// and loads the device. The measurement is 'lesion-estimate' telemetry for the
// debrief's 'assess' subskill (submitEstimate).
// ---------------------------------------------------------------------------

/**
 * Apply an assessment to the session's engine state. The session has no public entry for it yet, so this
 * uses applyAssessment() when the session offers one, else its own state update (an assessment is not a
 * hand action and is not asked of the attending's safety stops). False when neither exists or the case is over.
 */
export function applyAssessment(session: PciLabSession, f: (x: PciState) => PciState): boolean {
  const x = session as unknown as {
    applyAssessment?: (fn: (st: PciState) => PciState) => boolean;
    update?: (fn: (st: PciState) => PciState) => void;
    disposed?: boolean;
    finished?: boolean;
  };
  if (typeof x.applyAssessment === "function") return x.applyAssessment(f);
  if (x.disposed || x.finished) return false;
  if (typeof x.update === "function") {
    x.update.call(session, f);
    return true;
  }
  return false;
}

/** Record the trainee's measurement (QCA or a visual estimate) as the case's lesion estimate. */
export function recordMeasurement(session: PciLabSession, m: LesionMeasurement): boolean {
  return applyAssessment(session, (st) => submitEstimate(session.g, st, m));
}

/** Size from a basis, on the trainee's own measurements (no size without them). */
export function recordSizing(session: PciLabSession, basis: SizingBasis): boolean {
  return applyAssessment(session, (st) => chooseSizing(session.g, st, basis, sizingImaging(st)));
}

/** The tray default a sizing implies: the stent's box (catalogue label) and its chart at nominal and rated burst pressure. */
export function trayDefault(sizing: NonNullable<PciState["sizing"]>) {
  const spec = deviceFor("stent", "semi-compliant");
  const box = boxLabel(spec, sizing.diameter, sizing.lengthMm);
  return {
    title: box.title,
    size: box.size,
    nominalAtm: box.nominalAtm,
    rbpAtm: box.rbpAtm,
    atNominalMm: chartDiameter(spec, sizing.diameter, box.nominalAtm),
    atRbpMm: chartDiameter(spec, sizing.diameter, box.rbpAtm),
    chartNote: box.chartNote,
  };
}

/**
 * Input sanity limits of the visual estimate (reference under 8 mm, length under 100 mm): MODEL PARAMETERS
 * (docs/realism/facts/pkg-pci-assessment-policy-qca.md), to catch a mistyped entry, not clinical thresholds.
 */
export const VISUAL_MAX_REF_MM = 8;
export const VISUAL_MAX_LENGTH_MM = 100;

/**
 * The basis label on the trainee's measurement: a single reference (a visual estimate, no proximal and
 * distal pair) is the trainee's reference estimate, not a measured distal reference.
 */
export function basisLabel(b: SizingBasis, est?: LesionMeasurement): string {
  if (b === "distal-reference" && est && (est.refProxMm === undefined || est.refDistMm === undefined)) return "Your reference estimate";
  return SIZING_LABEL[b];
}

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export default function PciAssessPanel({ session, onClose }: { session: PciLabSession; onClose?: () => void }) {
  usePciSession(session);
  const st = session.st;
  const est = st.estimate?.est as LesionMeasurement | undefined;
  const imaging = sizingImaging(st);
  const bases = sizingBases(st, imaging);
  const [basis, setBasis] = useState<SizingBasis>("distal-reference");
  const [visual, setVisual] = useState({ ref: "", mld: "", len: "" });
  const [showVisual, setShowVisual] = useState(false);
  const v = { ref: num(visual.ref), mld: num(visual.mld), len: num(visual.len) };
  const visualOk = v.ref > 0 && v.mld >= 0 && v.mld < v.ref && v.len > 0 && v.ref < VISUAL_MAX_REF_MM && v.len < VISUAL_MAX_LENGTH_MM;
  const chosen = bases.includes(basis) ? basis : bases[0];
  const tray = st.sizing ? trayDefault(st.sizing) : null;
  const ds = est && est.refMm > 0 ? Math.round(100 * (1 - est.mldMm / est.refMm)) : null;

  return (
    <section className="panel space-y-2 p-3 text-[13px]" aria-label="Lesion measurement and sizing">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">Measurement and sizing</span>
        {onClose && (
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      {est ? (
        <div className="space-y-0.5" aria-label="Your measurement">
          <div className="text-[12px] text-ink-faint">Your measurement ({est.method === "qca" ? `QCA, calibrated on a ${est.french ?? "?"} Fr catheter` : est.method === "visual" ? "visual estimate" : "estimate"})</div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[13px]">
            <dt className="text-ink-faint">Reference</dt>
            <dd className="text-ink">
              {est.refMm.toFixed(2)} mm
              {est.refProxMm !== undefined && est.refDistMm !== undefined ? ` (prox ${est.refProxMm.toFixed(2)}, dist ${est.refDistMm.toFixed(2)})` : ""}
            </dd>
            <dt className="text-ink-faint">MLD</dt>
            <dd className="text-ink">{est.mldMm.toFixed(2)} mm</dd>
            {ds !== null && (
              <>
                <dt className="text-ink-faint">Diameter stenosis</dt>
                <dd className="text-ink">{ds} %</dd>
              </>
            )}
            <dt className="text-ink-faint">Lesion length</dt>
            <dd className="text-ink">{est.lengthMm.toFixed(1)} mm</dd>
          </dl>
        </div>
      ) : (
        <p className="text-ink-soft">No measurement yet. Run QCA on a stored run on the reference monitor (calibrate on the guide, then mark the segment and record it), or enter your visual estimate.</p>
      )}

      <div>
        <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => setShowVisual(!showVisual)} aria-expanded={showVisual}>
          {showVisual ? "Hide the visual estimate" : "Enter a visual estimate"}
        </button>
        {showVisual && (
          <div className="mt-1 flex flex-wrap items-end gap-2">
            {(
              [
                ["ref", "Reference, mm"],
                ["mld", "MLD, mm"],
                ["len", "Length, mm"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex flex-col text-[12px] text-ink-faint">
                {label}
                <input className="field h-8 w-20" inputMode="decimal" value={visual[k]} onChange={(e) => setVisual({ ...visual, [k]: e.target.value.replace(/[^0-9.]/g, "") })} aria-label={label} />
              </label>
            ))}
            <button className="btn h-8" disabled={!visualOk} onClick={() => recordMeasurement(session, { refMm: v.ref, mldMm: v.mld, lengthMm: v.len, method: "visual" })}>
              Record estimate
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-line pt-2">
        <div className="text-[12px] text-ink-faint">Size the stent from</div>
        {bases.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <select className="field h-8 py-0" value={chosen} onChange={(e) => setBasis(e.target.value as SizingBasis)} aria-label="Sizing basis">
              {bases.map((b) => (
                <option key={b} value={b}>
                  {basisLabel(b, est)}
                </option>
              ))}
            </select>
            <button className="btn btn-accent h-8" onClick={() => chosen && recordSizing(session, chosen)}>
              Choose this size
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-ink-faint">
            {imaging ? "Measure the lesion length first (QCA or your estimate); your IVUS reference gives the diameter, not the length." : "Measure the lesion first; the size follows from your measurement, not from the case."}
          </p>
        )}
        {tray && st.sizing && (
          <div className="space-y-0.5" aria-label="Tray default">
            <div className="text-ink">
              Tray default: {tray.title}, {tray.size}
            </div>
            <div className="font-mono text-[12px] text-ink-soft">
              nominal {tray.nominalAtm} atm: {tray.atNominalMm.toFixed(2)} mm · RBP {tray.rbpAtm} atm: {tray.atRbpMm.toFixed(2)} mm
            </div>
            <div className="text-[12px] text-ink-faint">
              {basisLabel(st.sizing.basis, est)}. {tray.chartNote} Take the device from the tray and load it yourself.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
