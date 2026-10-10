// ---------------------------------------------------------------------------
// PEARLS debrief (Eppich and Cheng 2015): reactions, description, analysis,
// summary. Results and the formative score are shown only after the learner
// has rated themselves, and every threshold is shown with its source.
//
// One debrief for every lab (found-mentor-registries): further tabs come from
// the section registry (src/ui/mentor/debrief/), shown after the four phases
// when they apply (the Decisions tab shows the run's decision ledger and the
// tips shown). Gaps, decisions and tips with a lesson offer 'Open lesson'.
// The skill cards the summary announces are put in the review schedule when
// the summary is shown (scheduleAnnouncedCards), so the announcement is true;
// only ids the schedule can hold are announced or counted.
// With the default lesson handler 'Open lesson' leaves the debrief for the
// Academy, so a note next to it says to finish the debrief first.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DebriefModel, Gap } from "../../mentor/debrief";
import { clock, withLedger } from "../../mentor/debrief";
import type { DecisionRecord } from "../../mentor/ledger";
import { isSchedulableCardId, scheduleCards, type ScheduledCards } from "../../mentor/skillCards";
import { describeStandard } from "../../mentor/standards";
import type { FrameOption } from "../../mentor/types";
import { useProgressStore } from "../../state/useProgressStore";
import { todayStr } from "../../utils/storage";
import { openLesson } from "../content/openLesson";
import { DEBRIEF_SECTIONS, sectionsFor, type DebriefSection } from "./debrief/index";

/**
 * Put the cards a debrief announced in the learner's review schedule (the progress store's review
 * memory, which the Review section reads), due today; already scheduled cards are brought forward,
 * none is graded. Returns what changed.
 */
export function scheduleAnnouncedCards(cardIds: readonly string[], today: string = todayStr()): ScheduledCards {
  const st = useProgressStore.getState();
  const res = scheduleCards(st.profile.quizMemory, cardIds, today);
  if (res.added.length || res.broughtForward.length) {
    useProgressStore.setState((s) => ({ profile: { ...s.profile, quizMemory: scheduleCards(s.profile.quizMemory, cardIds, today).memory } }));
    useProgressStore.getState().persist();
  }
  return res;
}

export interface DebriefResult {
  selfRatings: Record<string, number>;
  plus: string;
  delta: string;
  takeHome: string;
  /** frame chosen per advocacy-inquiry gap */
  frames: Record<string, string>;
}

export interface DebriefProps {
  model: DebriefModel;
  /** wall time of the case start, for mm:ss */
  t0?: number;
  /** the replay timeline, embedded in the description and analysis phases */
  replay?: ReactNode;
  /** move the replay to a time (clip start) */
  onSeek?: (tWall: number) => void;
  /** rewind to a gap's decision point and try again */
  onRewind?: (gap: Gap) => void;
  onFrameChosen?: (gap: Gap, frame: FrameOption) => void;
  onFinish: (r: DebriefResult) => void;
  /** the run's decision ledger (useLabRun's decisions()), when the model was built without it */
  decisions?: readonly DecisionRecord[];
  /** tip ids shown during the run, when the model was built without them */
  tipsShown?: readonly string[];
  /** open a lesson (default: the Academy) */
  onOpenLesson?: (lessonId: string) => void;
  /** schedule the announced skill cards (default: the review schedule, scheduleAnnouncedCards) */
  onScheduleCards?: (cardIds: readonly string[]) => void;
  /** the extra tabs (default: the registry) */
  sections?: readonly DebriefSection[];
}

type Phase = "reactions" | "description" | "analysis" | "summary";
type Tab = Phase | `section:${string}`;
const PHASES: { id: Phase; label: string }[] = [
  { id: "reactions", label: "Reactions" },
  { id: "description", label: "Description" },
  { id: "analysis", label: "Analysis" },
  { id: "summary", label: "Summary" },
];

const fmtValue = (v: number | undefined, unit?: string) => {
  if (v === undefined) return "not measured";
  if (unit === "s") return clock(v);
  return `${Math.round(v * 100) / 100}${unit ? " " + unit : ""}`;
};

const defaultOpenLesson = (id: string) => void openLesson(id);
const LEAVES_NOTE = "'Open lesson' opens the Academy and leaves this debrief; finish the debrief first to keep your notes.";
const defaultSchedule = (ids: readonly string[]) => void scheduleAnnouncedCards(ids);

export default function Debrief({ model: base, t0 = 0, replay, onSeek, onRewind, onFrameChosen, onFinish, decisions, tipsShown, onOpenLesson: hostOpenLesson, onScheduleCards = defaultSchedule, sections: registry = DEBRIEF_SECTIONS }: DebriefProps) {
  const model = useMemo(() => withLedger(base, decisions ?? [], tipsShown ?? []), [base, decisions, tipsShown]);
  const onOpenLesson = hostOpenLesson ?? defaultOpenLesson;
  // the default handler navigates away and unmounts the debrief, losing the learner's notes
  const lessonLeaves = !hostOpenLesson;
  const [phase, setPhase] = useState<Tab>("reactions");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [plus, setPlus] = useState("");
  const [delta, setDelta] = useState("");
  const [frames, setFrames] = useState<Record<string, string>>({});
  const [takeHome, setTakeHome] = useState("");
  const [ownTakeHome, setOwnTakeHome] = useState("");
  const rated = model.reactions.subSkills.every((s) => ratings[s.id]);

  const calibration = useMemo(
    () =>
      model.calibration.map((c) => {
        const self = ratings[c.subSkill];
        const d = self !== undefined && c.measured !== undefined ? Math.round((self - c.measured) * 10) / 10 : undefined;
        return { ...c, self, delta: d, flag: d === undefined ? undefined : d >= 2 ? "over-confident" : d <= -2 ? "under-confident" : undefined };
      }),
    [model.calibration, ratings]
  );

  const allowed = (p: Tab) => p === "reactions" || rated;
  const finalTakeHome = ownTakeHome.trim() || takeHome;
  const extra = useMemo(() => sectionsFor({ model, t0 }, registry), [model, t0, registry]);
  const tabs: { id: Tab; label: string }[] = [...PHASES, ...extra.map((x) => ({ id: `section:${x.id}` as Tab, label: x.label }))];
  const openSection = extra.find((x) => phase === `section:${x.id}`);

  // the cards the summary announces are scheduled once, when it is first shown
  const scheduled = useRef(false);
  const cards = useMemo(() => model.summary.cardsToSchedule.filter(isSchedulableCardId), [model.summary.cardsToSchedule]);
  useEffect(() => {
    if (phase !== "summary" || scheduled.current || !cards.length) return;
    scheduled.current = true;
    onScheduleCards(cards);
  }, [phase, cards, onScheduleCards]);

  return (
    <section className="panel mx-auto w-full max-w-[980px]" aria-label="Debrief">
      <div className="panel-head">
        <span>Debrief</span>
        <nav className="flex gap-1" role="tablist" aria-label="Debrief phases">
          {tabs.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={phase === p.id} disabled={!allowed(p.id)} className={`tab ${phase === p.id ? "tab-active" : ""} disabled:opacity-40`} onClick={() => setPhase(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4 p-4">
        {phase === "reactions" && (
          <div className="space-y-4">
            <p className="text-[14px] text-ink">{model.reactions.prompt}</p>
            <ul className="space-y-2">
              {model.reactions.subSkills.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] text-ink-soft">{s.label}</span>
                  <div className="seg" role="radiogroup" aria-label={s.label}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={ratings[s.id] === n} className={`seg-btn min-w-[32px] ${ratings[s.id] === n ? "seg-btn-active" : ""}`} onClick={() => setRatings((r) => ({ ...r, [s.id]: n }))}>
                        {n}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-faint">1 = I needed the attending to take over, 5 = I could do this unsupervised.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-ink-faint">
                What went well
                <textarea className="field h-auto py-2" rows={3} value={plus} onChange={(e) => setPlus(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-faint">
                What you would change
                <textarea className="field h-auto py-2" rows={3} value={delta} onChange={(e) => setDelta(e.target.value)} />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" disabled={!rated} onClick={() => setPhase("description")}>
                Continue
              </button>
            </div>
          </div>
        )}

        {phase === "description" && (
          <div className="space-y-4">
            <p className="text-[13px] text-ink-soft">What happened, from the record.</p>
            <ol className="space-y-1 font-mono text-[13px] text-ink">
              {model.description.narrative.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
            {replay}
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" onClick={() => setPhase("analysis")}>
                Continue
              </button>
            </div>
          </div>
        )}

        {phase === "analysis" && (
          <div className="space-y-4">
            {lessonLeaves && model.analysis.gaps.some((g) => g.lessonId) && <p className="text-xs text-ink-faint" data-note="lesson-leaves">{LEAVES_NOTE}</p>}
            {model.analysis.gaps.length === 0 && <div className="notice notice-good">Nothing to pick apart this time. Look at the summary for the numbers.</div>}
            {model.analysis.gaps.map((g, i) => (
              <article key={g.id} className="rounded-lg border border-line bg-base-800 p-3">
                <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-ink">
                    {i + 1}. {g.title}
                  </h3>
                  <span className="flex items-center gap-2 text-xs text-ink-faint">
                    <span className={`chip ${g.severity === "safety" ? "border-[#5c2a27] text-[#f2938c]" : ""}`}>{g.severity === "safety" ? "Safety" : g.severity === "technique" ? "Technique" : "Efficiency"}</span>
                    {g.occurrences > 1 && <span>{g.occurrences} times</span>}
                    <span className="font-mono">{clock(g.tWall - t0)}</span>
                  </span>
                </header>
                {g.strategy === "advocacy-inquiry" ? (
                  <div className="space-y-2">
                    <p className="text-[14px] leading-snug text-ink">{g.advocacy}</p>
                    <p className="text-[14px] text-ink">{g.inquiry}</p>
                    {!frames[g.id] ? (
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {(g.frames ?? []).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className="btn justify-start text-left text-[13px]"
                            onClick={() => {
                              setFrames((s) => ({ ...s, [g.id]: f.id }));
                              onFrameChosen?.(g, f);
                            }}
                          >
                            {f.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="notice notice-info">
                        <span>{g.frames?.find((f) => f.id === frames[g.id])?.teaching}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[14px] leading-snug text-ink">{g.directive}</p>
                    <p className="text-[13px] text-ink-soft">{g.teaching}</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.lessonId && (
                    <button type="button" className="btn text-[13px]" data-lesson={g.lessonId} onClick={() => onOpenLesson(g.lessonId!)}>
                      Open lesson
                    </button>
                  )}
                  {onSeek && (
                    <button type="button" className="btn text-[13px]" onClick={() => onSeek(g.clip.from)}>
                      Watch the moment
                    </button>
                  )}
                  {onRewind && g.rewind && (
                    <button type="button" className="btn text-[13px]" onClick={() => onRewind(g)}>
                      Try again from {clock(g.rewind.tWall - t0)}
                    </button>
                  )}
                </div>
              </article>
            ))}
            {replay}
            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" onClick={() => setPhase("summary")}>
                Continue
              </button>
            </div>
          </div>
        )}

        {phase === "summary" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold text-ink">Your take-home</h3>
              <div className="flex flex-col gap-1.5">
                {model.summary.takeHomeOptions.map((t) => (
                  <label key={t} className="flex cursor-pointer items-start gap-2 text-[14px] text-ink">
                    <input type="radio" name="takehome" className="mt-1 accent-[#2F6BD8]" checked={takeHome === t && !ownTakeHome} onChange={() => setTakeHome(t)} />
                    {t}
                  </label>
                ))}
                <input type="text" className="field" placeholder="Or in your own words: next time I will..." value={ownTakeHome} onChange={(e) => setOwnTakeHome(e.target.value)} />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-ink">Against the standard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-xs text-ink-faint">
                    <tr>
                      <th className="py-1.5 pr-3 font-normal">Measure</th>
                      <th className="py-1.5 pr-3 font-normal">You</th>
                      <th className="py-1.5 pr-3 font-normal">Standard</th>
                      <th className="py-1.5 pr-3 font-normal">Source</th>
                      <th className="py-1.5 font-normal">Met</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.summary.standards.map((r) => (
                      <tr key={r.standard.id} className="border-t border-line">
                        <td className="py-1.5 pr-3 text-ink">{r.standard.label}</td>
                        <td className="metric py-1.5 pr-3 text-ink">{fmtValue(r.value, r.standard.unit)}</td>
                        <td className="metric py-1.5 pr-3 text-ink-soft">{describeStandard(r.standard)}</td>
                        <td className="py-1.5 pr-3 text-xs text-ink-faint">{r.standard.source.url ? <a className="underline decoration-line-strong underline-offset-2 hover:text-ink" href={r.standard.source.url} target="_blank" rel="noreferrer">{r.standard.source.label}</a> : r.standard.source.label}</td>
                        <td className={`py-1.5 ${r.missing ? "text-ink-faint" : r.pass ? "text-good" : "text-danger"}`}>{r.missing ? "n/a" : r.pass ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                {model.summary.standards.filter((r) => !r.missing && r.pass).length} of {model.summary.standards.filter((r) => !r.missing).length} standards met. This summary is formative; progression uses the individual standards. {model.summary.passed ? "This attempt meets the standard." : "This attempt does not yet meet the standard."}
              </p>
            </div>

            {model.planVsExecution.length > 0 && (
              <div>
                <h3 className="mb-2 text-[14px] font-semibold text-ink">Plan and what happened</h3>
                <ul className="space-y-1 text-[13px]">
                  {model.planVsExecution.map((p) => (
                    <li key={p.id} className="flex flex-wrap gap-x-3">
                      <span className="w-40 text-ink-faint">{p.label}</span>
                      <span className="text-ink-soft">Planned: {p.planned}</span>
                      <span className="text-ink">Did: {p.actual}</span>
                      {p.kept !== null && <span className={p.kept ? "text-good" : "text-warn"}>{p.kept ? "as planned" : "changed"}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-ink">How your self-rating compares</h3>
              <ul className="space-y-1.5 text-[13px]">
                {calibration.map((c) => (
                  <li key={c.subSkill} className="flex flex-wrap items-center gap-3">
                    <span className="w-56 text-ink-soft">{c.label}</span>
                    <span className="metric text-ink">You {c.self ?? "-"}</span>
                    <span className="metric text-ink-soft">Measured {c.measured ?? "not measured"}</span>
                    {c.percentile !== undefined && <span className="text-xs text-ink-faint">better than {c.percentile}% of your attempts</span>}
                    {c.flag && <span className={c.flag === "over-confident" ? "text-warn" : "text-ink-faint"}>{c.flag === "over-confident" ? "You rated this higher than the record shows" : "You were harder on yourself than the record"}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {model.report && (
              <div>
                <h3 className="mb-2 text-[14px] font-semibold text-ink">Your report</h3>
                <ul className="space-y-1 text-[13px]">
                  {model.report.dominanceCorrect !== null && <li className={model.report.dominanceCorrect ? "text-good" : "text-danger"}>Dominance {model.report.dominanceCorrect ? "correct" : "incorrect"}</li>}
                  {model.report.items.map((it) => (
                    <li key={it.segment} className="flex flex-wrap gap-3">
                      <span className="w-48 text-ink-soft">{it.name}</span>
                      <span className="metric text-ink">You {it.learner}</span>
                      <span className="metric text-ink-soft">Actual {it.truth}</span>
                      <span className={it.correct ? "text-good" : it.adjacent ? "text-warn" : "text-danger"}>{it.correct ? "correct" : it.adjacent ? "one band off" : "incorrect"}</span>
                    </li>
                  ))}
                  {model.report.missed.length > 0 && <li className="text-danger">Missed: {model.report.missed.join(", ")}</li>}
                </ul>
              </div>
            )}

            {model.ledger.decisions.length > 0 && (
              <p className="text-[13px] text-ink-soft">
                Decisions: {model.ledger.summary.correct} of {model.ledger.summary.total} as expected.{" "}
                {extra.some((x) => x.id === "ledger") && (
                  <button type="button" className="text-accent hover:underline" onClick={() => setPhase("section:ledger")}>
                    See each decision
                  </button>
                )}
              </p>
            )}

            {cards.length > 0 && <div className="notice notice-info">Practice scheduled: {cards.length} short drill{cards.length === 1 ? "" : "s"} starting at the moment of each gap, in your review list from today.</div>}

            <div className="flex justify-end">
              <button type="button" className="btn btn-accent" disabled={!finalTakeHome} onClick={() => onFinish({ selfRatings: ratings, plus, delta, takeHome: finalTakeHome, frames })}>
                Finish debrief
              </button>
            </div>
          </div>
        )}

        {openSection && lessonLeaves && <p className="text-xs text-ink-faint" data-note="lesson-leaves">{LEAVES_NOTE}</p>}
        {openSection && <openSection.Component model={model} t0={t0} onOpenLesson={onOpenLesson} />}
      </div>
    </section>
  );
}
