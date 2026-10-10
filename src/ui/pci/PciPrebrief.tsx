// ---------------------------------------------------------------------------
// The PCI pre-brief and plan (pci-attending): the case as the attending
// presents it with two to four questions (PCI_PREBRIEFS), then the plan form:
// one field per step of Brilakis's fourteen-step plan, each linking to the
// lesson that teaches it, the contrast ceiling, the complication forecast
// (the two or three likeliest, from Brilakis's location tree, with the first
// move for each), the support plan, the bail-out kit in the room, the
// operator's own state, the step most likely to go wrong and, in a CTO, the
// stopping rules. Then the team time-out (PciTimeOut).
//
// In guided practice and exams it is a dialogue over the lab that holds the
// hands; in supervised and independent practice it is attending dialogue in
// the drawer. In guided practice the teaching aids show the contrast rules
// computed for this patient and the teaching after each answer; the other
// modes show neither (no ground truth on a live screen). In exams there are no
// lesson links (the Academy is the curriculum). Once agreed, the plan reopens
// read-only: the debrief compares the case with the plan as agreed.
// ---------------------------------------------------------------------------

import { useId, useState } from "react";
import type { PciAttending } from "./usePciAttending";
import { FORECAST_COMPLICATIONS, type ForecastComplication, type PciPlanStepId, type SupportPlan } from "../../mentor/prebrief";
import { pciContrastBudget } from "../../mentor/bridge/pciSession";
import { BAILOUT_KIT, FIRST_MOVES, FORECAST_LABELS, OPERATOR_STATES, PCI_PLAN_FIELDS, PCI_PLAN_LESSONS } from "../../content/mentor/prebriefs";
import { openLesson } from "../content/openLesson";
import PciTimeOut, { FormTips } from "./PciTimeOut";

export interface PciPrebriefProps {
  attending: PciAttending;
  variant: "modal" | "drawer";
  /** guided practice: the teaching aids (teaching after each answer, the contrast rules for this patient) */
  teachingAids: boolean;
  /** the guide and the start, as the case brief states them */
  facts: string[];
  /** launch problems to show */
  problems?: string[];
  /** the learner may see tips now (guided practice, or after asking for help) */
  tipsVisible?: boolean;
  onClose?: () => void;
}

function LessonLink({ id, show = true }: { id: string; show?: boolean }) {
  if (!show) return null;
  return (
    <button type="button" className="text-[12px] text-accent underline-offset-2 hover:underline" onClick={() => void openLesson(id)} title="Opens the lesson in the Academy (leaves the lab)">
      Lesson
    </button>
  );
}

export default function PciPrebrief({ attending: a, variant, teachingAids, facts, problems = [], tipsVisible = false, onClose }: PciPrebriefProps) {
  const width = variant === "modal" ? "w-full max-w-3xl" : "w-full";
  const title = a.stage === "brief" ? "Case brief" : a.stage === "plan" ? "The plan" : "Time-out";
  return (
    <section className={`panel ${width} text-[13px]`} role="dialog" aria-label={title}>
      <div className="panel-head">
        <span>
          {title}: {a.session.s.title}
        </span>
        <div className="seg" aria-label="Pre-brief steps">
          {(["brief", "plan", "timeout"] as const).map((s) => (
            <span key={s} className={`seg-btn ${a.stage === s ? "seg-btn-active" : ""}`} aria-current={a.stage === s ? "step" : undefined}>
              {s === "brief" ? "Brief" : s === "plan" ? "Plan" : "Time-out"}
            </span>
          ))}
        </div>
      </div>
      <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
        {a.stage === "brief" && <Brief a={a} teachingAids={teachingAids} facts={facts} problems={problems} />}
        {a.stage === "plan" && <FormTips ids={["pci-planning-fourteen-steps", "pci-planning-bailout-kit"]} visible={tipsVisible} />}
        {a.stage === "plan" && <PlanForm a={a} teachingAids={teachingAids} />}
        {a.stage === "plan" && a.planSubmitted && (
          <button type="button" className="btn btn-accent" onClick={() => a.submitPlan()}>
            {a.timeOutDone ? "Back to the case" : "Next: the time-out"}
          </button>
        )}
        {a.stage === "timeout" && <PciTimeOut attending={a} tipsVisible={tipsVisible} />}
        {!a.blocking && (
          <div className="border-t border-line pt-2 text-[12px] text-ink-faint">
            The case runs while you talk this through.{" "}
            {onClose && (
              <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={onClose}>
                Back to the table
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Brief({ a, teachingAids, facts, problems }: { a: PciAttending; teachingAids: boolean; facts: string[]; problems: string[] }) {
  const pb = a.prebrief;
  const all = pb.questions.every((q) => a.answers[q.id]);
  return (
    <>
      <p className="leading-relaxed text-ink">{pb.presentation}</p>
      <div className="flex flex-wrap gap-3 font-mono text-[12px] text-ink-soft">
        {facts.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      {problems.length > 0 && (
        <div className="notice notice-warn text-[12px]" role="status">
          {problems.join(" ")}
        </div>
      )}
      <ol className="space-y-3">
        {pb.questions.map((q, i) => {
          const chosen = a.answers[q.id];
          return (
            <li key={q.id} className="space-y-1.5">
              <div className="text-ink">
                {i + 1}. {q.prompt}
              </div>
              <div className="flex flex-col gap-1">
                {q.options.map((o) => (
                  <button key={o.id} type="button" className={`rounded border px-2 py-1 text-left ${chosen === o.id ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`} onClick={() => a.answer(q.id, o.id)} aria-pressed={chosen === o.id}>
                    {o.text}
                  </button>
                ))}
              </div>
              {teachingAids && chosen && <p className={`text-[12px] ${q.correct.includes(chosen) ? "text-good" : "text-warn"}`}>{q.teaching}</p>}
            </li>
          );
        })}
      </ol>
      <p className="text-[12px] text-ink-faint">Synthetic patient; images are rendered by a physical X-ray model, not taken from patients.</p>
      <button type="button" className="btn btn-accent" disabled={!all} onClick={() => a.toPlan()}>
        Next: the plan
      </button>
    </>
  );
}

/** A prompt run on after a label: the first letter lower-cased, unless it opens an acronym ("ACC/AHA class ..."). */
export function lowerFirst(p: string): string {
  return /^[A-Z][a-z]/.test(p) ? p[0].toLowerCase() + p.slice(1) : p;
}

function PlanForm({ a, teachingAids }: { a: PciAttending; teachingAids: boolean }) {
  const p = a.plan;
  const locked = a.planSubmitted;
  const L = a.lessonsAllowed;
  const [riskOpen, setRiskOpen] = useState(false);
  const uid = useId();
  const budget = teachingAids ? pciContrastBudget({ ...a.source(), planContrastMl: undefined }) : null;
  const profile = a.session.engine.profile;
  const setStep = (id: PciPlanStepId, v: string) => a.setPlan({ steps: { [id]: v } });
  const toggleForecast = (c: ForecastComplication) => {
    const has = p.forecast.some((f) => f.complication === c);
    if (has) a.setPlan({ forecast: p.forecast.filter((f) => f.complication !== c) });
    else if (p.forecast.length < 3) a.setPlan({ forecast: [...p.forecast, { complication: c, firstMove: "" }] });
  };
  const ready = p.contrastCeilingMl > 0 && p.forecast.length >= 2 && p.forecast.every((f) => f.firstMove) && !!p.support && !!p.operatorState;
  return (
    <fieldset disabled={locked} className="space-y-3">
      {locked && <p className="text-[12px] text-ink-faint">The plan as agreed at the brief. It stands for the debrief.</p>}
      <div className="flex items-center justify-between">
        <p className="text-ink-soft">One line for each step. A step you cannot answer is the one to sort out now.</p>
        <LessonLink id={PCI_PLAN_LESSONS.plan} show={L} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PCI_PLAN_FIELDS.filter((f) => f.id !== "support").map((f) => (
          <div key={f.id} className="flex flex-col gap-1 text-[12px] text-ink-faint">
            <span className="flex items-center justify-between">
              <label htmlFor={`${uid}-${f.id}`}>
                {f.step}. {f.label}: {lowerFirst(f.prompt)}
              </label>
              <LessonLink id={f.lessonId} show={L} />
            </span>
            <select id={`${uid}-${f.id}`} className="field" value={p.steps[f.id] ?? ""} onChange={(e) => setStep(f.id, e.target.value)}>
              <option value="">Choose</option>
              {f.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 text-[12px] text-ink-faint" role="group" aria-labelledby={`${uid}-guide`}>
          <span id={`${uid}-guide`}>Guide size</span>
          <div className="seg">
            {[6, 7, 8].map((fr) => (
              <button key={fr} type="button" className={`seg-btn ${p.guideFrench === fr ? "seg-btn-active" : ""}`} onClick={() => a.setPlan({ guideFrench: fr })}>
                {fr} Fr
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">
          Contrast ceiling (mL)
          <input className="field w-28 font-mono" type="number" min={0} step={10} value={p.contrastCeilingMl || ""} onChange={(e) => a.setPlan({ contrastCeilingMl: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <span className="font-mono text-[12px] text-ink-soft">
          eGFR {Math.round(profile.renal.egfr)} mL/min/1.73 m², CrCl {Math.round(profile.renal.crclMlMin)} mL/min, {profile.weightKg} kg
        </span>
      </div>
      {budget && (
        <div className="notice notice-info text-[12px]" aria-label="Teaching aid">
          Teaching aid: {budget.rules.map((r) => `${r.label} ${Math.round(r.availableMl)} mL (${r.formula})`).join("; ")}. The stricter is {budget.stricter.label}.
        </div>
      )}

      <fieldset className="space-y-1.5">
        <legend className="flex w-full items-center justify-between text-[12px] text-ink-faint">
          <span>The two or three likeliest complications, and your first move for each</span>
          <LessonLink id={PCI_PLAN_LESSONS.forecast} show={L} />
        </legend>
        <div className="flex flex-wrap gap-1">
          {FORECAST_COMPLICATIONS.map((c) => {
            const on = p.forecast.some((f) => f.complication === c);
            return (
              <button key={c} type="button" className={`rounded border px-2 py-0.5 text-[12px] ${on ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`} aria-pressed={on} onClick={() => toggleForecast(c)}>
                {FORECAST_LABELS[c]}
              </button>
            );
          })}
        </div>
        {p.forecast.map((f) => (
          <label key={f.complication} className="flex flex-col gap-1 text-[12px] text-ink-faint">
            First move for {lowerFirst(FORECAST_LABELS[f.complication])}
            <select className="field" value={f.firstMove} onChange={(e) => a.setPlan({ forecast: p.forecast.map((x) => (x.complication === f.complication ? { ...x, firstMove: e.target.value } : x)) })}>
              <option value="">Choose</option>
              {FIRST_MOVES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <fieldset className="space-y-1">
          <legend className="flex w-full items-center justify-between text-[12px] text-ink-faint">
            <span>14. Haemodynamic support</span>
            <LessonLink id="pm-support-choice-when" show={L} />
          </legend>
          <div className="flex flex-col gap-1">
            {(PCI_PLAN_FIELDS.find((f) => f.id === "support")?.options ?? []).map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-ink-soft">
                <input type="radio" name="pci-support" checked={p.support === o.id} onChange={() => a.setPlan({ support: o.id as SupportPlan })} />
                {o.text}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-1">
          <legend className="flex w-full items-center justify-between text-[12px] text-ink-faint">
            <span>Bail-out kit in the room</span>
            <LessonLink id={PCI_PLAN_LESSONS.bailout} show={L} />
          </legend>
          {BAILOUT_KIT.map((k) => (
            <label key={k.id} className="flex items-center gap-2 text-ink-soft">
              <input type="checkbox" checked={p.bailoutKit.includes(k.id)} onChange={(e) => a.setPlan({ bailoutKit: e.target.checked ? [...p.bailoutKit, k.id] : p.bailoutKit.filter((x) => x !== k.id) })} />
              {k.text}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 text-[12px] text-ink-faint" role="group" aria-labelledby={`${uid}-state`}>
          <span className="flex items-center gap-2">
            <span id={`${uid}-state`}>Your own state</span> <LessonLink id={PCI_PLAN_LESSONS.state} show={L} />
          </span>
          <div className="seg">
            {OPERATOR_STATES.map((s) => (
              <button key={s.id} type="button" className={`seg-btn ${p.operatorState === s.id ? "seg-btn-active" : ""}`} onClick={() => a.setPlan({ operatorState: s.id })}>
                {s.text}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-ghost h-8 text-[12px]" onClick={() => setRiskOpen((v) => !v)} aria-expanded={riskOpen}>
          The step most likely to go wrong
        </button>
      </div>
      {riskOpen && (
        <select className="field" value={p.riskiestStep ?? ""} onChange={(e) => a.setPlan({ riskiestStep: (e.target.value || null) as PciPlanStepId | null })} aria-label="The step most likely to go wrong">
          <option value="">Choose</option>
          {PCI_PLAN_FIELDS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.step}. {f.label}
            </option>
          ))}
        </select>
      )}
      {a.facts.cto && (
        <fieldset className="flex flex-wrap items-end gap-3">
          <legend className="flex w-full items-center justify-between text-[12px] text-ink-faint">
            <span>Stopping rules for the CTO attempt</span>
            <LessonLink id={PCI_PLAN_LESSONS.stopRules} show={L} />
          </legend>
          {(
            [
              ["karGy", "Air kerma (Gy)"],
              ["contrastXCrcl", "Contrast (× CrCl)"],
              ["minutes", "Time (min)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1 text-[12px] text-ink-faint">
              {label}
              <input className="field w-24 font-mono" type="number" min={0} step={0.5} value={p.stopRules?.[k] ?? ""} onChange={(e) => a.setPlan({ stopRules: { ...(p.stopRules ?? {}), [k]: Number(e.target.value) || undefined } })} />
            </label>
          ))}
        </fieldset>
      )}
      {!locked && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-accent" disabled={!ready} onClick={() => a.submitPlan()}>
            Agree the plan
          </button>
          {!ready && <span className="text-[12px] text-ink-faint">Set the ceiling, name two or three complications with a first move each, the support and your state.</span>}
        </div>
      )}
    </fieldset>
  );
}
