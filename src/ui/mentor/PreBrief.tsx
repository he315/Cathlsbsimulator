// ---------------------------------------------------------------------------
// Pre-brief and time-out before a case. The learner hears the case, commits to
// a plan, answers the attending's questions, then runs the time-out. In
// supervised and exam modes the beam stays off until the time-out is complete
// (the lab checks beamAllowed from mentor/visibility.ts).
//
// An acute coronary syndrome case of the diagnostic lab (diag-acs-scenarios,
// ACS_CASES in src/simulation/diagnosticScenarios/acs.ts) opens on an ECG step
// first: the presenting 12-lead with the learner's prediction, the
// reperfusion clock in STEMI mode, and the triage gate after a resuscitated
// arrest below the ECG it rests on (src/ui/lab/EcgPrebrief.tsx). The
// pre-brief cannot be completed until the prediction and the triage are
// committed; where the time-out is required that keeps the beam off. In the
// modes without one the lab's beam gate is to read acsBeamAllowed
// (EcgPrebrief.tsx) as well; until it does, the step asks for the reading
// before the first image rather than saying the beam is off.
// A culprit study shows its previous study on the plan step.
//
// The diagnostic plan step (diag-engagement-technique-set) asks for the left,
// right and guide catheters and their French sizes. On completion the stated
// catheters are kept for the patient (progress/logbook.ts
// recordStatedCatheters) for the debrief's comparison with the route and the
// root (rules/diagEngagement.ts scoreCatheterChoice); in guided mode, a
// teaching aid by the visibility policy (traps), the comparison is shown on
// the questions step. The catheters that worked on this patient's last study
// are shown in the chart (logbook.ts workedCathetersFor); the pre-brief starts
// the recorder that keeps them (startWorkedCatheterRecorder: the catheter of
// each filmed diagnostic run, by side). The lab shows the pre-brief only for a
// case with a chart, so until the recorder moves to a diagnostic session
// module (reported with this package) the catheters that worked are recorded
// only once a charted case has been opened: a session that has opened only
// cases without a chart records none.
// ---------------------------------------------------------------------------

import { Fragment, useEffect, useMemo, useState } from "react";
import type { AccessRoute } from "../../types";
import { gradeAnswers, timeOutComplete, timeOutItems, type AnswerResult, type ChartRow, type Prebrief, type ProcedurePlan, type TimeOutState } from "../../mentor/prebrief";
import { visibilityFor } from "../../mentor/visibility";
import type { AssessmentMode, Lab } from "../../mentor/types";
import { useSim } from "../lab/useLab";
import { acsCaseFor, type AcsCase, type AcsEcg } from "../../simulation/diagnosticScenarios/acs";
import EcgPrebrief, { OhcaTriageGate, PreviousStudyViewer, ReperfusionClock, acsPrebriefDone, useAcsAnswers, usePreviousStudy } from "../lab/EcgPrebrief";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { catheterById } from "../../data/catheters";
import { previousCathetersOf, recordStatedCatheters, recordWorkedCatheter, workedCathetersFor, type StatedCatheters, type WorkedCatheters } from "../../progress/logbook";
import { choiceCaseFor, scoreCatheterChoice, type CatheterChoiceScore } from "../../mentor/rules/diagEngagement";

export interface PreBriefResult {
  plan: ProcedurePlan;
  answers: AnswerResult[];
  timeOut: TimeOutState;
}

export interface PreBriefProps {
  prebrief: Prebrief;
  lab: Lab;
  mode: AssessmentMode;
  /** "next time I will..." from the previous case */
  previousTakeHome?: string;
  /** catheter ids to offer */
  catheters: string[];
  /** view presets to offer */
  views: { id: string; name: string }[];
  /** guide catheters and wires for PCI */
  guides?: string[];
  /** the patient chart, when the case carries one (mentor/prebrief.ts chartRows) */
  chart?: ChartRow[];
  onComplete: (r: PreBriefResult) => void;
  /** epoch ms provider (injected for tests) */
  now?: () => number;
  /**
   * The case's ACS front end. Absent: the diagnostic lab's current case is looked up in ACS_CASES
   * (by its scenario id); null: none.
   */
  acs?: AcsCase | null;
}

type Step = "ecg" | "plan" | "questions" | "timeout";

/** The diagnostic plan with the French sizes of the catheter step (diag-engagement-technique-set). */
type DiagPlan = ProcedurePlan & { french?: number; guideFrench?: number };

/** French sizes the catheter step offers: diagnostic catheters and guides (the operator's choice, not a recommendation). */
const DIAG_FRENCH = [4, 5, 6] as const;
const GUIDE_FRENCH = [6, 7, 8] as const;

const ACCESS: { id: AccessRoute; label: string }[] = [
  { id: "radial-right", label: "Right radial" },
  { id: "radial-left", label: "Left radial" },
  { id: "femoral", label: "Femoral" },
];

const STRATEGIES: { id: NonNullable<ProcedurePlan["strategy"]>; label: string }[] = [
  { id: "direct-stent", label: "Direct stenting" },
  { id: "predilate", label: "Pre-dilate, then stent" },
  { id: "prep-calcium", label: "Prepare calcium, then stent" },
  { id: "aspirate-thrombus", label: "Manage thrombus, then stent" },
  { id: "dual-injection", label: "Dual injection, then cross" },
];

export default function PreBrief({ prebrief, lab, mode, previousTakeHome, catheters, views, guides = [], chart, onComplete, now = Date.now, acs: acsProp }: PreBriefProps) {
  const caseData = useSim((s) => s.caseData);
  const acs = acsProp === undefined ? (lab === "diagnostic" ? acsCaseFor(caseData.scenarioId) : undefined) : acsProp ?? undefined;
  const hasEcgStep = !!(acs?.ecg || acs?.triage);
  const acsAnswers = useAcsAnswers(caseData.id);
  const acsDone = acsPrebriefDone(acs, acsAnswers);
  const previous = usePreviousStudy(caseData, acs?.previousStudy);
  const [step, setStep] = useState<Step>(hasEcgStep ? "ecg" : "plan");
  const [plan, setPlan] = useState<DiagPlan>({
    access: prebrief.planDefaults.access ?? "radial-right",
    catheters: { left: undefined, right: undefined, backup: [] },
    plannedViews: [],
    contrastBudgetMl: 0,
    anticipated: [],
    guide: prebrief.planDefaults.guide,
  });
  const [anticipated, setAnticipated] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const exam = mode === "exam";
  const required = visibilityFor(mode).timeOutRequired;
  const items = timeOutItems(lab);
  const done = timeOutComplete({ checked }, lab);
  const planOk = (plan.catheters.left || plan.catheters.right || lab === "pci") && plan.contrastBudgetMl > 0;
  const diagnostic = lab === "diagnostic";
  const guideOptions = guides.length ? guides : catheters.filter((id) => catheterById(id)?.category !== "pigtail");
  // the catheters that worked on this patient's last study, and the recorder that keeps them
  useEffect(() => {
    if (diagnostic) startWorkedCatheterRecorder();
  }, [diagnostic]);
  const worked = useMemo(() => (diagnostic ? workedCathetersFor(caseData.id) : undefined), [diagnostic, caseData.id]);
  const chartShown = useMemo(() => withWorkedCatheters(chart, worked), [chart, worked]);
  const stated = statedOf(plan);
  const choiceScore = catheterChoiceAid(mode, lab, stated, caseData);
  const allAnswered = prebrief.questions.every((q) => answers[q.id]);
  const graded = useMemo(() => gradeAnswers(prebrief.questions, answers), [prebrief.questions, answers]);

  const steps: Step[] = hasEcgStep ? ["ecg", "plan", "questions", "timeout"] : ["plan", "questions", "timeout"];
  const stepLabel = (x: Step) => (x === "ecg" ? (acs?.ecg ? "ECG" : "Triage") : x === "plan" ? "Plan" : x === "questions" ? "Questions" : "Time-out");

  const finish = () => {
    if (diagnostic) recordStatedCatheters(caseData.id, stated, now());
    onComplete({ plan: { ...plan, anticipated: anticipated.trim() ? anticipated.split(/\n|;/).map((s) => s.trim()).filter(Boolean) : [] }, answers: graded, timeOut: { checked, completedAt: done ? now() : undefined } });
  };

  const toggleView = (id: string) => setPlan((p) => ({ ...p, plannedViews: p.plannedViews.includes(id) ? p.plannedViews.filter((v) => v !== id) : [...p.plannedViews, id] }));

  return (
    <section className="panel mx-auto w-full max-w-[760px]" aria-label="Pre-brief">
      <div className="panel-head">
        <span>Pre-brief: {prebrief.title}</span>
        <div className="seg" role="tablist" aria-label="Pre-brief steps">
          {steps.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={step === s} className={`seg-btn ${step === s ? "seg-btn-active" : ""}`} onClick={() => setStep(s)}>
              {stepLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-[14px] leading-relaxed text-ink">{prebrief.presentation}</p>
        {chartShown && chartShown.length > 0 && <ChartPanel rows={chartShown} />}
        {previousTakeHome && (
          <div className="notice notice-info">
            <span>
              Last case you said: <span className="text-ink">{previousTakeHome}</span>
            </span>
          </div>
        )}

        {step === "ecg" && acs && (
          <div className="space-y-4">
            {acs.stemi && <ReperfusionClock caseId={caseData.id} diagnosisMinutesAgo={acs.stemi.diagnosisMinutesAgo} now={now} />}
            {acs.ecg && <EcgPrebrief acs={acs as AcsCase & { ecg: AcsEcg }} caseId={caseData.id} now={now} />}
            {/* the triage below the ECG it rests on, committed after the ECG reading */}
            {acs.triage && <OhcaTriageGate caseId={caseData.id} waitForEcg={!!acs.ecg} now={now} />}
            {!acsDone && (
              <div className="notice notice-warn" data-acs-beam-notice>
                {required ? `The beam stays off until you commit your reading of the ECG${acs.triage ? " and the triage decision" : ""}.` : `Commit your reading of the ECG${acs.triage ? " and the triage decision" : ""} before the first image.`}
              </div>
            )}
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" disabled={!acsDone} onClick={() => setStep("plan")}>
                Continue to the plan
              </button>
            </div>
          </div>
        )}

        {step === "plan" && (
          <div className="space-y-4">
            {previous && <PreviousStudyViewer study={previous} />}
            <fieldset className="space-y-2">
              <legend className="text-xs text-ink-faint">Access</legend>
              <div className="seg">
                {ACCESS.map((a) => (
                  <button key={a.id} type="button" className={`seg-btn ${plan.access === a.id ? "seg-btn-active" : ""}`} onClick={() => setPlan((p) => ({ ...p, access: a.id }))}>
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {lab === "diagnostic" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Left catheter
                  <select className="field" value={plan.catheters.left ?? ""} onChange={(e) => setPlan((p) => ({ ...p, catheters: { ...p.catheters, left: e.target.value || undefined } }))}>
                    <option value="">None</option>
                    {catheters.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Right catheter
                  <select className="field" value={plan.catheters.right ?? ""} onChange={(e) => setPlan((p) => ({ ...p, catheters: { ...p.catheters, right: e.target.value || undefined } }))}>
                    <option value="">None</option>
                    {catheters.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Backup
                  <select className="field" value={plan.catheters.backup[0] ?? ""} onChange={(e) => setPlan((p) => ({ ...p, catheters: { ...p.catheters, backup: e.target.value ? [e.target.value] : [] } }))}>
                    <option value="">None</option>
                    {catheters.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Diagnostic size
                  <select className="field" value={plan.french ?? ""} onChange={(e) => setPlan((p) => ({ ...p, french: e.target.value ? Number(e.target.value) : undefined }))}>
                    <option value="">Choose</option>
                    {DIAG_FRENCH.map((f) => (
                      <option key={f} value={f}>
                        {`${f} Fr`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Guide, if PCI follows
                  <select className="field" value={plan.guide ?? ""} onChange={(e) => setPlan((p) => ({ ...p, guide: e.target.value || undefined }))}>
                    <option value="">None</option>
                    {guideOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Guide size
                  <select className="field" value={plan.guideFrench ?? ""} disabled={!plan.guide} onChange={(e) => setPlan((p) => ({ ...p, guideFrench: e.target.value ? Number(e.target.value) : undefined }))}>
                    <option value="">Choose</option>
                    {GUIDE_FRENCH.map((f) => (
                      <option key={f} value={f}>
                        {`${f} Fr`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Guide
                  <select className="field" value={plan.guide ?? ""} onChange={(e) => setPlan((p) => ({ ...p, guide: e.target.value || undefined }))}>
                    <option value="">Choose</option>
                    {guides.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  First wire
                  <select className="field" value={plan.wire ?? ""} onChange={(e) => setPlan((p) => ({ ...p, wire: (e.target.value || undefined) as ProcedurePlan["wire"] }))}>
                    <option value="">Choose</option>
                    <option value="workhorse">Workhorse</option>
                    <option value="polymer">Polymer-jacketed</option>
                    <option value="cto">Stiff tapered</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Strategy
                  <select className="field" value={plan.strategy ?? ""} onChange={(e) => setPlan((p) => ({ ...p, strategy: (e.target.value || undefined) as ProcedurePlan["strategy"] }))}>
                    <option value="">Choose</option>
                    {STRATEGIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-faint">
                  Heparin (units per kg)
                  <input type="number" min={0} className="field" value={plan.heparinUnitsPerKg ?? ""} onChange={(e) => setPlan((p) => ({ ...p, heparinUnitsPerKg: e.target.value === "" ? undefined : Number(e.target.value) }))} />
                </label>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-xs text-ink-faint">Planned views</legend>
              <div className="flex flex-wrap gap-1.5">
                {views.map((v) => (
                  <button key={v.id} type="button" aria-pressed={plan.plannedViews.includes(v.id)} className={`chip cursor-pointer ${plan.plannedViews.includes(v.id) ? "border-accent text-ink" : ""}`} onClick={() => toggleView(v.id)}>
                    {v.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-ink-faint">
                Contrast budget (mL)
                <input type="number" min={0} className="field" value={plan.contrastBudgetMl || ""} onChange={(e) => setPlan((p) => ({ ...p, contrastBudgetMl: Math.max(0, Number(e.target.value) || 0) }))} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-faint">
                What do you expect to be difficult?
                <textarea className="field h-auto min-h-[36px] py-2" rows={2} value={anticipated} onChange={(e) => setAnticipated(e.target.value)} />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" disabled={!planOk} onClick={() => setStep("questions")}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-4">
            {choiceScore && <CatheterChoiceNotice score={choiceScore} />}
            {prebrief.questions.map((q, qi) => {
              const a = answers[q.id];
              const show = revealed[q.id] && !exam;
              const ok = a && q.correct.includes(a);
              return (
                <fieldset key={q.id} className="space-y-2">
                  <legend className="text-[14px] text-ink">
                    {qi + 1}. {q.prompt}
                  </legend>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {q.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={a === o.id}
                        disabled={revealed[q.id]}
                        className={`btn justify-start text-left text-[13px] ${a === o.id ? "border-accent" : ""}`}
                        onClick={() => setAnswers((s) => ({ ...s, [q.id]: o.id }))}
                      >
                        {o.text}
                      </button>
                    ))}
                  </div>
                  {a && !revealed[q.id] && (
                    <button type="button" className="btn btn-ghost text-[13px]" onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}>
                      Commit
                    </button>
                  )}
                  {show && (
                    <div className={`notice ${ok ? "notice-good" : "notice-warn"}`}>
                      <span>{q.teaching}</span>
                    </div>
                  )}
                  {revealed[q.id] && exam && <p className="text-xs text-ink-faint">Answer recorded. You will go through it in the debrief.</p>}
                </fieldset>
              );
            })}
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" disabled={!allAnswered || !prebrief.questions.every((q) => revealed[q.id])} onClick={() => setStep("timeout")}>
                Continue to time-out
              </button>
            </div>
          </div>
        )}

        {step === "timeout" && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-soft">The final check before the procedure. Everyone stops and listens.</p>
            <ul className="space-y-1.5">
              {items.map((it) => (
                <li key={it.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[#2F6BD8]" checked={!!checked[it.id]} onChange={(e) => setChecked((c) => ({ ...c, [it.id]: e.target.checked }))} />
                    {it.text}
                  </label>
                </li>
              ))}
            </ul>
            {required && !done && <div className="notice notice-warn">The beam stays off until the time-out is complete.</div>}
            {!acsDone && <div className="notice notice-warn">Commit your reading of the ECG{acs?.triage ? " and the triage decision" : ""} first.</div>}
            <div className="flex justify-end gap-2">
              {!required && !done && (
                <button type="button" className="btn" onClick={finish} disabled={!allAnswered || !acsDone}>
                  Start without time-out
                </button>
              )}
              <button type="button" className="btn btn-accent" onClick={finish} disabled={!done || !allAnswered || !acsDone}>
                Time-out complete, start case
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** The patient chart as the operator reads it before the case: what is recorded, nothing flagged. */
export function ChartPanel({ rows }: { rows: ChartRow[] }) {
  return (
    <section className="rounded-md border border-line bg-base-800 px-3 py-2.5" aria-label="Patient chart">
      <h2 className="mb-1.5 text-[12px] font-medium text-ink-faint">Chart</h2>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-[max-content_1fr]">
        {rows.map((r) => (
          <Fragment key={r.id}>
            <dt className="text-ink-faint">{r.label}</dt>
            <dd className="text-ink">{r.value}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The catheter step (diag-engagement-technique-set)
// ---------------------------------------------------------------------------

/** The plan's catheters as the logbook keeps them. */
function statedOf(plan: DiagPlan): StatedCatheters {
  return { access: plan.access, left: plan.catheters.left, right: plan.catheters.right, guide: plan.guide, french: plan.french, guideFrench: plan.guide ? plan.guideFrench : undefined };
}

const ROUTE_TEXT: Record<AccessRoute, string> = { femoral: "femoral", "radial-right": "right radial", "radial-left": "left radial" };

/** The chart rows with this patient's last-study catheters added to "Catheters that worked before" (the row mentor/prebrief.ts chartRows writes). */
export function withWorkedCatheters(rows: ChartRow[] | undefined, worked: WorkedCatheters | undefined): ChartRow[] | undefined {
  const prev = previousCathetersOf(worked);
  if (!prev.length) return rows;
  const text = `${prev.map((p) => `${p.catheterId} (${p.target})`).join("; ")}${worked?.route ? ` via ${ROUTE_TEXT[worked.route]}` : ""}, at the last study here`;
  const out = [...(rows ?? [])];
  const i = out.findIndex((r) => r.id === "catheters");
  if (i >= 0) out[i] = { ...out[i], value: `${out[i].value}; ${text}` };
  else out.push({ id: "catheters", label: "Catheters that worked before", value: text });
  return out;
}

/**
 * The comparison of the stated catheters with the route and the root, for the pre-brief's questions step. It reads
 * the case's root size and variants (ground truth), so it is a teaching aid: a score in the diagnostic lab when the
 * visibility policy shows traps (guided mode), null otherwise (supervised and exam modes, and the PCI lab).
 */
export function catheterChoiceAid(
  mode: AssessmentMode,
  lab: Lab,
  stated: StatedCatheters,
  caseData: Parameters<typeof choiceCaseFor>[0]
): CatheterChoiceScore | null {
  if (lab !== "diagnostic" || !visibilityFor(mode).traps) return null;
  return scoreCatheterChoice(stated, choiceCaseFor(caseData));
}

/** The guided comparison of the stated catheters with the route and the root (a teaching aid, shown in guided mode only). */
function CatheterChoiceNotice({ score }: { score: CatheterChoiceScore }) {
  const line = (label: string, v: CatheterChoiceScore["left"]) => (
    <li key={label}>
      <span className="text-ink">{label}:</span> {v.given ?? "none stated"}. {v.ok ? "Fits the route and the root." : `For this route and root: ${v.expected.join(", ")}.`} <span className="text-ink-faint">{v.why}</span>
    </li>
  );
  return (
    <div className={`notice ${score.ok && score.route.ok ? "notice-good" : "notice-info"}`} aria-label="Catheter choice">
      <ul className="space-y-1 text-[13px]">
        {!score.route.ok && <li>The case is planned from the {ROUTE_TEXT[score.route.expected]} route; you stated {ROUTE_TEXT[score.route.given]}.</li>}
        {line("Left", score.left)}
        {line("Right", score.right)}
        {score.guide && line("Guide", score.guide)}
        {score.guideFrenchAtOstium && !score.guideFrenchAtOstium.ok && <li>At an aorto-ostial lesion Brilakis uses a 6 Fr guide: larger guides damp more.</li>}
      </ul>
    </div>
  );
}

let recorderOff: (() => void) | null = null;

/**
 * Keep the catheters that worked (progress/logbook.ts recordWorkedCatheter): the catheter of each filmed
 * diagnostic run, by the side it filled, for the case loaded at the time. Started by the first diagnostic
 * pre-brief and kept for the app's lifetime (idempotent); returns the function that stops it (tests).
 */
export function startWorkedCatheterRecorder(store: typeof useSimulatorStore = useSimulatorStore): () => void {
  if (recorderOff) return recorderOff;
  let seen = store.getState().events.length;
  let caseId = store.getState().caseData.id;
  const unsub = store.subscribe((s) => {
    if (s.caseData.id !== caseId || s.events.length < seen) {
      caseId = s.caseData.id;
      seen = 0;
    }
    for (let i = seen; i < s.events.length; i++) {
      if (s.events[i].code !== "diagnostic-injection") continue;
      const side = s.bolus?.side ?? (s.engagement.target === "left" || s.engagement.target === "right" ? s.engagement.target : null);
      if (side === "left" || side === "right") recordWorkedCatheter(s.caseData.id, side, s.catheterId, s.caseData.accessRoute);
    }
    seen = s.events.length;
  });
  recorderOff = () => {
    unsub();
    recorderOff = null;
  };
  return recorderOff;
}
