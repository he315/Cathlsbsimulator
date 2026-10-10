// ---------------------------------------------------------------------------
// The structured assessment of a complication (pci-cx-recognition). The lab
// shows cues only (what the image, the trace and the patient show); the
// learner names and grades what happened here before the lab names it:
//  - when flow fails, the cause-finding checklist first (keep the wire;
//    image the stent edges and the distal vessel in two projections or with
//    intravascular imaging; check the pressure, the ECG and the ACT), then
//    the cause;
//  - a dissection: its NHLBI type (A-F) after the contrast has washed out;
//  - a perforation: its location and Ellis grade;
//  - the TIMI flow grade beyond the segment.
// Opened from the Assess control, or by the attending in guided practice. In
// supervised and independent practice it is attending dialogue in the drawer
// (the procedure runs on); in guided practice and exams it is a dialogue over
// the lab that holds the clock. The answer is scored by the engine
// (scoreRecognition); the score is shown here only in guided practice, and
// otherwise in the debrief. The live log shows only the learner's own answer.
// Grade wording: NHLBI types as src/simulation/complications/dissection.ts
// lists them; Ellis grades as the lab request cm-perforation#0 words them
// (docs/curriculum/lab-requests/cm-perforation.json) and the module's table
// gives them (src/content/manual/complication-management/03-perforation.ts:
// crater; blush without an exit hole of 1 mm or more; streaming through an
// exit hole of 1 mm or more; cavity spilling into a chamber or vessel).
// ---------------------------------------------------------------------------

import { useState } from "react";
import type { PerforationSite, RecognisedCause, RecognitionAnswer, Recognition } from "../../simulation/complications/types";

export const CAUSES: readonly { v: RecognisedCause; label: string }[] = [
  { v: "dissection", label: "Dissection" },
  { v: "thrombus", label: "Thrombus" },
  { v: "no-reflow", label: "No-reflow (distal embolisation)" },
  { v: "air", label: "Air" },
  { v: "spasm", label: "Spasm" },
  { v: "perforation", label: "Perforation" },
  { v: "side-branch", label: "Side branch closed or pinched" },
];

export const NHLBI: readonly { v: string; label: string }[] = [
  { v: "A", label: "A: radiolucency" },
  { v: "B", label: "B: double lumen" },
  { v: "C", label: "C: persistent extraluminal stain" },
  { v: "D", label: "D: spiral" },
  { v: "E", label: "E: persistent filling defect" },
  { v: "F", label: "F: occlusion" },
];

export const ELLIS: readonly { v: string; label: string }[] = [
  { v: "I", label: "I: crater" },
  { v: "II", label: "II: blush, no exit hole of 1 mm or more" },
  { v: "III", label: "III: jet through an exit hole of 1 mm or more" },
  { v: "III-CS", label: "III-CS: spilling into a chamber or vessel" },
];

export const SITES: readonly { v: PerforationSite; label: string }[] = [
  { v: "large-vessel", label: "Large vessel" },
  { v: "distal", label: "Distal vessel" },
  { v: "collateral", label: "Collateral" },
];

const TIMI = [0, 1, 2, 3] as const;

/**
 * How the assessment is presented in a mode: attending dialogue in the drawer while the procedure runs on
 * (supervised and independent practice), or a dialogue over the lab that holds the procedure clock and
 * the hands (guided practice and exams). The plan's rule for forms (LAB_BUILD_PLAN.md section 2).
 */
export function recognitionPresentation(mode: "guided" | "supervised" | "independent" | "exam"): { variant: "modal" | "drawer"; holdsClock: boolean; blocksHands: boolean } {
  const blocks = mode === "guided" || mode === "exam";
  return { variant: blocks ? "modal" : "drawer", holdsClock: blocks, blocksHands: blocks };
}

/**
 * What an open assessment does to the lab in a mode (PciLab.tsx applies this): whether the frame loop
 * advances the procedure clock, whether hand input reaches the session, and which session modal the
 * Assess control opens ('recognition', the blocking dialogue, or 'attending', the drawer).
 */
export function assessmentEffects(
  mode: "guided" | "supervised" | "independent" | "exam",
  assessOpen: boolean,
  finished = false
): { stepClock: boolean; handsEnabled: boolean; modalId: "recognition" | "attending" } {
  const p = recognitionPresentation(mode);
  return {
    stepClock: !(assessOpen && p.holdsClock && !finished),
    handsEnabled: !(assessOpen && p.blocksHands),
    modalId: p.variant === "modal" ? "recognition" : "attending",
  };
}

export interface RecognitionFormProps {
  /** dialogue over the lab (guided practice, exam) or attending dialogue in the drawer */
  variant: "modal" | "drawer";
  /** show the score after the submission (guided practice only) */
  showScore: boolean;
  /** submit the assessment; returns the recognition it produced, or null when there was nothing to recognise */
  onSubmit: (answer: RecognitionAnswer) => { recognition: Recognition | null } | null;
  onClose: () => void;
  /** the attending's prompt (guided practice) */
  prompt?: string;
}

function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T | undefined; options: readonly { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] text-ink-soft">{label}</div>
      <div className="seg flex-wrap" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.v)} type="button" aria-pressed={o.v === value} className={`seg-btn ${o.v === value ? "seg-btn-active" : ""}`} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-[#4F8EF7]" />
      <span>{label}</span>
    </label>
  );
}

/** Right at the first attempt (as the mentor's metrics score it): good; assessed otherwise: warn; never assessed: danger. */
export function assessmentClass(rec: Recognition | null): string {
  if (!rec) return "text-danger";
  const firstRight = rec.first ? rec.first.correct : rec.score.correct;
  return firstRight && rec.score.correct ? "text-good" : "text-warn";
}

/**
 * The debrief's line for one assessment: the first attempt as the mentor's metrics score it (time from the
 * first sign, and what it named when wrong), then the later attempt when there was one.
 */
export function assessmentSummary(rec: Recognition | null): string {
  if (!rec) return "Not assessed.";
  const cause = (c: string) => c.replace("-", " ");
  const verdict = rec.score.correct ? "cause and grade right" : `named as ${cause(rec.answer.cause)}${rec.score.cause ? ", grade wrong" : ""}`;
  if (!rec.first) return `Assessed ${Math.round(rec.delayS)} s after its first sign; ${verdict}.`;
  const first = rec.first.correct ? "right" : `named as ${cause(rec.first.cause)}`;
  return `First assessed ${Math.round(rec.first.delayS)} s after its first sign, ${first}; at attempt ${rec.attempt ?? 2} (${Math.round(rec.delayS)} s), ${verdict}.`;
}

/** The answer is complete: a cause, the grade it asks for, and the TIMI grade. */
export function answerComplete(a: Partial<RecognitionAnswer>): a is RecognitionAnswer {
  if (!a.cause || a.timi === undefined) return false;
  if (a.cause === "dissection") return !!a.nhlbi;
  if (a.cause === "perforation") return !!a.ellis && !!a.site;
  return true;
}

const yesNo = (v: boolean | null) => (v === null ? null : v ? "right" : "wrong");

export default function RecognitionForm({ variant, showScore, onSubmit, onClose, prompt }: RecognitionFormProps) {
  const [a, setA] = useState<Partial<RecognitionAnswer>>({ checks: { wireKept: false, imaged: false, pressureEcgAct: false } });
  const [done, setDone] = useState<{ recognition: Recognition | null } | null>(null);
  const checks = a.checks ?? {};
  const set = (patch: Partial<RecognitionAnswer>) => setA((x) => ({ ...x, ...patch }));
  const submit = () => {
    if (!answerComplete(a)) return;
    const r = onSubmit(a);
    if (r) setDone(r);
  };
  const shell = variant === "modal" ? "panel w-full max-w-xl space-y-3 p-4 text-[13px]" : "space-y-3 border-b border-line px-4 py-3 text-[13px]";
  if (done) {
    const rec = done.recognition;
    const s = rec?.score;
    return (
      <section className={shell} role={variant === "modal" ? "dialog" : "region"} aria-label="Assessment">
        <div className="text-[14px] font-semibold text-ink">Assessment recorded</div>
        {showScore && s ? (
          <ul className="space-y-0.5 text-[12.5px]">
            <li className={s.cause ? "text-good" : "text-danger"}>Cause: {yesNo(s.cause)}</li>
            {s.grade !== null && <li className={s.grade ? "text-good" : "text-danger"}>Grade: {yesNo(s.grade)}</li>}
            {s.site !== null && <li className={s.site ? "text-good" : "text-danger"}>Location: {yesNo(s.site)}</li>}
            {s.timi !== null && <li className={s.timi ? "text-good" : "text-danger"}>TIMI flow: {yesNo(s.timi)}</li>}
            <li className="text-ink-soft">Seconds from the first sign: {Math.round(rec!.delayS)}</li>
          </ul>
        ) : showScore && !rec ? (
          <p className="text-[12.5px] text-ink-soft">Nothing had gone wrong when you assessed: keep looking at the image, the trace and the patient.</p>
        ) : (
          <p className="text-[12.5px] text-ink-soft">The attending will go over it in the debrief.</p>
        )}
        <button type="button" className="btn btn-accent" onClick={onClose}>
          Back to the case
        </button>
      </section>
    );
  }
  return (
    <section className={shell} role={variant === "modal" ? "dialog" : "region"} aria-label="Assess what has changed">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[14px] font-semibold text-ink">Assess what has changed</div>
        <button type="button" className="btn btn-ghost px-2 py-1 text-[12px]" onClick={onClose}>
          Not now
        </button>
      </div>
      {prompt && <div className="notice notice-info text-[12.5px]">{prompt}</div>}
      <div className="space-y-1">
        <div className="text-[12px] text-ink-soft">If flow has failed, before naming the cause</div>
        <Check label="Keep the wire across" checked={!!checks.wireKept} onChange={(v) => set({ checks: { ...checks, wireKept: v } })} />
        <Check label="Image the stent edges and the distal vessel in two projections, or with IVUS or OCT" checked={!!checks.imaged} onChange={(v) => set({ checks: { ...checks, imaged: v } })} />
        <Check label="Check the pressure, the ECG and the ACT" checked={!!checks.pressureEcgAct} onChange={(v) => set({ checks: { ...checks, pressureEcgAct: v } })} />
      </div>
      <Seg label="Cause" value={a.cause} options={CAUSES} onChange={(v) => set({ cause: v })} />
      {a.cause === "dissection" && <Seg label="NHLBI type, after the contrast has washed out" value={a.nhlbi} options={NHLBI} onChange={(v) => set({ nhlbi: v })} />}
      {a.cause === "perforation" && (
        <>
          <Seg label="Location" value={a.site} options={SITES} onChange={(v) => set({ site: v })} />
          <Seg label="Ellis grade" value={a.ellis} options={ELLIS} onChange={(v) => set({ ellis: v })} />
        </>
      )}
      <Seg label="TIMI flow beyond the segment" value={a.timi} options={TIMI.map((v) => ({ v, label: `TIMI ${v}` }))} onChange={(v) => set({ timi: v })} />
      <button type="button" className="btn btn-accent" disabled={!answerComplete(a)} onClick={submit}>
        Record the assessment
      </button>
    </section>
  );
}
