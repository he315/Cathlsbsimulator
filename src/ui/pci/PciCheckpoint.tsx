import { useState } from "react";
import { CHECKPOINT_DECISIONS, PROGRESS_CLAIMS, decisionLabel, type BudgetCheckpoint, type BudgetReadout, type CheckpointAnswer, type CheckpointDecision, type ProgressClaim } from "../../simulation/pci/budgets";

// ---------------------------------------------------------------------------
// The stop-or-continue checkpoint (pci-budgets-stop-rules), the contrast and
// time counters, and the debrief's list of checkpoint decisions.
//
// The checkpoint opens when the contrast total crosses the warning threshold
// or the ceiling, or the air kerma reaches the limit. The learner states the
// progress (crossed, making progress, no progress) and decides: continue with
// a named next step, change strategy, bail out (CTO), stage or stop. In
// guided practice and exams it is a dialogue and the beam stays off until it
// is answered (PciLabSession.checkpointHoldsBeam); in supervised and
// independent practice it is attending dialogue in the drawer. Each threshold
// shows its source. The verdict is shown after the answer only in guided
// practice; the debrief lists every decision with the dose, contrast and time.
// ---------------------------------------------------------------------------

/** The contrast counter's colour: warning from 50% of the ceiling, danger at the ceiling. */
export function contrastTone(fraction: number): "ok" | "warn" | "danger" {
  if (!(fraction >= 0.5)) return "ok";
  return fraction >= 1 ? "danger" : "warn";
}

const TONE_CLASS = { ok: "text-ink", warn: "text-warn", danger: "text-danger" } as const;

const minutes = (s: number) => `${Math.round(s / 60)} min`;
const gy = (mGy: number) => `${(mGy / 1000).toFixed(2)} Gy`;

const REASON_TITLE: Record<BudgetCheckpoint["reason"], string> = {
  "contrast-warning": "Contrast close to the ceiling",
  "contrast-ceiling": "Contrast at the ceiling",
  "radiation-limit": "Air kerma at the limit",
};

export interface PciCheckpointProps {
  checkpoint: BudgetCheckpoint;
  variant: "modal" | "drawer";
  /** a CTO case: bail out is offered */
  cto: boolean;
  /** show the ceiling's figure (the plan set it, or the teaching aids are on) */
  showCeiling: boolean;
  /** show the verdict after the answer (guided practice) */
  showVerdict: boolean;
  onAnswer: (a: CheckpointAnswer) => BudgetCheckpoint | null;
  onClose: () => void;
}

/** The stop-or-continue checkpoint. */
export default function PciCheckpoint({ checkpoint, variant, cto, showCeiling, showVerdict, onAnswer, onClose }: PciCheckpointProps) {
  const [progress, setProgress] = useState<ProgressClaim | undefined>(undefined);
  const [decision, setDecision] = useState<CheckpointDecision | undefined>(undefined);
  const [nextStep, setNextStep] = useState("");
  const [done, setDone] = useState<BudgetCheckpoint | null>(null);
  const needsStep = decision === "continue" || decision === "change-strategy";
  const complete = !!progress && !!decision && (!needsStep || nextStep.trim().length > 0);
  const shell = variant === "modal" ? "panel w-full max-w-xl space-y-3 p-4 text-[13px]" : "space-y-3 border-b border-line px-4 py-3 text-[13px]";
  const at = checkpoint.at;
  const submit = () => {
    if (!complete) return;
    const r = onAnswer({ decision: decision!, progress: progress!, nextStep: needsStep ? nextStep.trim() : undefined });
    if (r) setDone(r);
  };
  if (done?.answer) {
    const a = done.answer;
    return (
      <section className={shell} role={variant === "modal" ? "dialog" : "region"} aria-label="Checkpoint decision">
        <div className="text-[14px] font-semibold text-ink">Decision recorded: {decisionLabel(a.decision)}</div>
        {showVerdict ? (
          <p className={`text-[12.5px] ${a.unscored ? "text-ink-soft" : a.correct ? "text-good" : "text-warn"}`}>
            {a.unscored ? `Not scored: it rests on the progress you reported. The rule: ${a.expected}.` : a.correct ? "That follows the stopping rules." : `The rules point to: ${a.expected}.`}{" "}
            <span className="text-ink-faint">({a.source.book})</span>
          </p>
        ) : (
          <p className="text-[12.5px] text-ink-soft">The attending will go over it in the debrief.</p>
        )}
        <button type="button" className="btn btn-accent" onClick={onClose}>
          Back to the case
        </button>
      </section>
    );
  }
  const decisions = CHECKPOINT_DECISIONS.filter((d) => cto || !d.ctoOnly);
  return (
    <section className={shell} role={variant === "modal" ? "dialog" : "region"} aria-label="Stop or continue">
      <div className="text-[14px] font-semibold text-ink">Stop or continue: {REASON_TITLE[checkpoint.reason].toLowerCase()}</div>
      <div className="notice notice-info text-[12.5px]">{checkpoint.text}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[12px] text-ink-soft">
        <dt>Contrast</dt>
        <dd>
          {Math.round(at.contrastMl)} mL{showCeiling ? ` of ${Math.round(at.ceilingMl)} mL` : ""}
        </dd>
        <dt>Air kerma</dt>
        <dd>
          {gy(at.karMGy)} (limit {gy(at.karLimitMGy)})
        </dd>
        <dt>Time</dt>
        <dd>{minutes(at.elapsedS)}</dd>
      </dl>
      <div className="text-[12px] text-ink-faint">Sources: {[...new Set(checkpoint.sources.map((s) => s.book))].join("; ")}</div>
      <Seg label="Where are you?" value={progress} options={PROGRESS_CLAIMS.map((p) => ({ v: p.id, label: p.label }))} onChange={setProgress} />
      <Seg label="Decision" value={decision} options={decisions.map((d) => ({ v: d.id, label: d.label, title: d.title }))} onChange={setDecision} />
      {needsStep && (
        <label className="block space-y-1">
          <span className="text-[12px] text-ink-soft">The next step</span>
          <input className="field h-8 w-full" value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="For example: a stiffer wire with a microcatheter" />
        </label>
      )}
      <button type="button" className="btn btn-accent" disabled={!complete} onClick={submit}>
        Record the decision
      </button>
    </section>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: readonly { v: T; label: string; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] text-ink-soft">{label}</div>
      <div className="seg flex-wrap" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.v} type="button" title={o.title} aria-pressed={o.v === value} className={`seg-btn ${o.v === value ? "seg-btn-active" : ""}`} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The counters the team keeps: contrast (against the ceiling when it is shown, warning colour from 50%),
 * the air kerma against its limit, and the elapsed time. The contrast colour is ground truth (the
 * patient's computed ceiling), so it is shown only when the ceiling itself is shown: with teaching aids
 * or once the learner has agreed a plan figure. The row is one fixed-height line so the dose panel
 * below keeps its space; it scrolls sideways if the column is too narrow.
 */
export function BudgetCounters({ budget, showCeiling }: { budget: BudgetReadout; showCeiling: boolean }) {
  const c = budget.contrast;
  const r = budget.radiation;
  const tone = showCeiling ? contrastTone(c.fraction) : "ok";
  const karTone = r.karMGy >= r.limitMGy ? "danger" : r.karMGy >= r.limitMGy / 2 ? "warn" : "ok";
  return (
    <div className="flex h-6 shrink-0 flex-nowrap items-center gap-x-3 overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 font-mono text-[11px] text-ink-soft" aria-label="Contrast, air kerma and time">
      <span className={TONE_CLASS[tone]} data-tone={tone} title={showCeiling ? `${c.label}${c.sourceRef ? ` (${c.sourceRef.book})` : ""}` : "contrast given"}>
        contrast {Math.round(c.totalMl)}
        {showCeiling ? `/${Math.round(c.ceilingMl)}` : ""} mL
      </span>
      <span className={TONE_CLASS[karTone]} title="air kerma against the limit">
        kerma {(r.karMGy / 1000).toFixed(2)}/{gy(r.limitMGy)}
      </span>
      {r.doseRateHigh && (
        <span className="text-warn" title="dose rate">
          {r.doseRateMGyMin.toFixed(0)} mGy/min
        </span>
      )}
      <span title="elapsed time">{minutes(budget.elapsedS)}</span>
    </div>
  );
}

/** The debrief's checkpoint decisions, with the dose, contrast and time at each. */
export function CheckpointReview({ checkpoints }: { checkpoints: readonly BudgetCheckpoint[] }) {
  if (!checkpoints.length) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[12px] text-ink-faint">Stop-or-continue checkpoints</div>
      <ul className="space-y-0.5">
        {checkpoints.map((cp) => {
          const a = cp.answer;
          const nums = `contrast ${Math.round(cp.at.contrastMl)} of ${Math.round(cp.at.ceilingMl)} mL, air kerma ${gy(cp.at.karMGy)}, ${minutes(cp.at.elapsedS)}`;
          return (
            <li key={cp.id} className={!a ? "text-danger" : a.unscored ? "text-ink-soft" : a.correct ? "text-good" : "text-warn"}>
              {REASON_TITLE[cp.reason]} ({nums}): {a ? `${decisionLabel(a.decision)}${a.nextStep ? ` (${a.nextStep})` : ""}; progress stated as ${a.progress.replace("-", " ")}.${a.unscored ? ` Not scored: the rule is ${a.expected} (${a.source.book}).` : a.correct ? "" : ` The rules point to ${a.expected} (${a.source.book}).`}` : "not answered."}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
