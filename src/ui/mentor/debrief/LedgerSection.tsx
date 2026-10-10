// ---------------------------------------------------------------------------
// The debrief's Decisions tab (found-mentor-registries): the run's decision
// ledger (src/mentor/ledger.ts), grouped by stage in the order the stages
// came, each decision with what was given, what was expected and the lesson
// that teaches it; then the tips shown during the run and, in a separate
// list, the tips linked to decisions that were not shown, each with its lesson. Shown only after the case, in
// the debrief, so the expected answers never reach a live screen.
//
// The tip registry and the tip card (BlockRenderer, which brings the cine
// player and the angio library) are both loaded on demand, so neither is in
// the debrief's chunk. Each tips heading appears only while loading or when
// one of its tip ids resolves.
// ---------------------------------------------------------------------------

import { useEffect, useState, type ComponentType } from "react";
import type { DecisionRecord } from "../../../mentor/ledger";
import type { LabTip } from "../../../content/lab/tips";
import { useTipsModule } from "../../lab/useLabTips";
import type { DebriefSection, DebriefSectionProps } from "./index";

type TipCardComponent = ComponentType<{ tip: LabTip }>;
let tipCardCache: TipCardComponent | null = null;

/** Load the lab's tip card (BlockRenderer's TipCard) once; later renders use it at once. */
export function loadTipCard(): Promise<TipCardComponent> {
  if (tipCardCache) return Promise.resolve(tipCardCache);
  return import("../../content/BlockRenderer").then((m) => (tipCardCache = m.TipCard));
}

function useTipCard(): TipCardComponent | null {
  const [card, setCard] = useState<TipCardComponent | null>(() => tipCardCache);
  useEffect(() => {
    let alive = true;
    if (!tipCardCache) loadTipCard().then((c) => alive && setCard(() => c));
    return () => {
      alive = false;
    };
  }, []);
  return card;
}

function LessonButton({ lessonId, onOpenLesson }: { lessonId: string; onOpenLesson: (id: string) => void }) {
  return (
    <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" data-lesson={lessonId} onClick={() => onOpenLesson(lessonId)}>
      Open lesson
    </button>
  );
}

function DecisionRow({ d, onOpenLesson }: { d: DecisionRecord; onOpenLesson: (id: string) => void }) {
  return (
    <li className="rounded-lg border border-line bg-base-800 p-3" data-decision={d.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-ink">{d.label}</span>
        <span className={`text-[13px] ${d.correct ? "text-good" : "text-danger"}`}>{d.correct ? "As expected" : "Not as expected"}</span>
      </div>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
        <dt className="text-ink-faint">You</dt>
        <dd className="text-ink">{d.given}</dd>
        <dt className="text-ink-faint">Expected</dt>
        <dd className="text-ink-soft">{d.expected}</dd>
      </dl>
      {d.lessonId && (
        <div className="mt-2">
          <LessonButton lessonId={d.lessonId} onOpenLesson={onOpenLesson} />
        </div>
      )}
    </li>
  );
}

type TipsModule = NonNullable<ReturnType<typeof useTipsModule>>;

/** One titled list of tip cards; nothing when no id is given or none resolves to a tip. */
function TipList({
  title,
  ids,
  tipsMod,
  TipCard,
  onOpenLesson,
}: {
  title: string;
  ids: string[];
  tipsMod: TipsModule | null;
  TipCard: TipCardComponent | null;
  onOpenLesson: (id: string) => void;
}) {
  const tips: LabTip[] = tipsMod ? ids.map((id) => tipsMod.TIP_BY_ID[id]).filter((t): t is LabTip => !!t) : [];
  if (ids.length === 0 || (tipsMod && TipCard && tips.length === 0)) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {!tipsMod || !TipCard ? (
        <p className="mt-1 text-[13px] text-ink-faint">Loading tips...</p>
      ) : (
        tips.map((t) => (
          <div key={t.id} data-tip={t.id}>
            <TipCard tip={t} />
            <div className="-mt-2 mb-2">
              <LessonButton lessonId={t.lessonId} onOpenLesson={onOpenLesson} />
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export function LedgerSection({ model, onOpenLesson }: DebriefSectionProps) {
  const tipsMod = useTipsModule();
  const TipCard = useTipCard();
  const { decisions, summary } = model.ledger;
  // tips shown during the run, then the tips linked to decisions that were not shown
  const shownIds: string[] = [];
  for (const t of model.tipsShown) if (!shownIds.includes(t.id)) shownIds.push(t.id);
  const linkedIds: string[] = [];
  for (const d of decisions) for (const id of d.tipIds ?? []) if (!shownIds.includes(id) && !linkedIds.includes(id)) linkedIds.push(id);

  return (
    <div className="space-y-4">
      {decisions.length > 0 ? (
        <>
          <p className="text-[13px] text-ink-soft">
            {summary.correct} of {summary.total} decision{summary.total === 1 ? "" : "s"} matched the expected answer.
            {summary.lessonsToReview.length > 0 && ` ${summary.lessonsToReview.length} lesson${summary.lessonsToReview.length === 1 ? "" : "s"} to review.`}
          </p>
          {summary.stages.map((stage) => (
            <section key={stage} aria-label={stage}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{stage.replace(/-/g, " ")}</h3>
              <ul className="space-y-2">
                {decisions
                  .filter((d) => d.stage === stage)
                  .map((d) => (
                    <DecisionRow key={d.id} d={d} onOpenLesson={onOpenLesson} />
                  ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <p className="text-[13px] text-ink-soft">No scored decisions were recorded in this run.</p>
      )}

      <TipList title="Tips shown during the run" ids={shownIds} tipsMod={tipsMod} TipCard={TipCard} onOpenLesson={onOpenLesson} />
      <TipList title="Tips for these decisions" ids={linkedIds} tipsMod={tipsMod} TipCard={TipCard} onOpenLesson={onOpenLesson} />
    </div>
  );
}

export const section: DebriefSection = {
  id: "ledger",
  label: "Decisions",
  order: 100,
  applies: ({ model }) => (model.ledger?.decisions.length ?? 0) > 0 || (model.tipsShown?.length ?? 0) > 0,
  Component: LedgerSection,
};
