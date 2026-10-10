// Single-best-answer quiz runner. Every answer feeds the spaced-repetition
// memory, so items answered wrongly come back sooner in Review, and the local
// item-response log (p-value and point-biserial per item, S13).
import { useMemo, useState } from "react";
import type { QuizItem } from "../../content/schema";
import { useProgressStore } from "../../state/useProgressStore";
import RefList from "./RefList";
import RichText from "./RichText";
import { logItemResponse } from "./CasePlayer";

/** Deterministic shuffle so option order changes between items but is stable on re-render. */
function order(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

const DIFF = ["", "core", "applied", "advanced"];

export default function QuizRunner({
  items,
  title,
  onDone,
  shuffleSeed = "",
}: {
  items: QuizItem[];
  title?: string;
  onDone?: (correct: number, total: number) => void;
  shuffleSeed?: string;
}) {
  const answerQuiz = useProgressStore((s) => s.answerQuiz);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  // One "learner" per run of the quiz for the item analytics (a retake is a new attempt).
  const [attempt, setAttempt] = useState(() => `quiz:${Date.now()}`);
  const q = items[i];
  // Items whose explanation refers to options by position keep their authored order.
  const ord = useMemo(() => {
    if (!q) return [];
    const positional = /\b(option [A-E]|(first|second|third|fourth|fifth|last) option)\b/i.test(q.explanation);
    return positional ? q.options.map((_, i) => i) : order(q.options.length, q.id + shuffleSeed);
  }, [q, shuffleSeed]);

  if (items.length === 0) return <div className="text-sm text-ink-faint">No questions here yet.</div>;

  if (!q) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((100 * correct) / results.length);
    return (
      <div className="panel p-6 text-center">
        <div className="stat-label">{title ?? "Quiz"} complete</div>
        <div className={`metric text-5xl font-semibold mt-2 ${pct >= 80 ? "text-good" : pct >= 60 ? "text-warn" : "text-danger"}`}>
          {pct}%
        </div>
        <div className="text-ink-soft text-sm mt-1">
          {correct} of {results.length} correct. Items you missed are scheduled for review tomorrow.
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="btn btn-accent"
            onClick={() => {
              setI(0);
              setPicked(null);
              setResults([]);
              setAttempt(`quiz:${Date.now()}`);
            }}
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  const choose = (opt: number) => {
    if (picked !== null) return;
    setPicked(opt);
    const ok = opt === q.answer;
    answerQuiz(q.id, ok);
    logItemResponse(attempt, q.id, ok);
    setResults((r) => [...r, ok]);
  };
  const next = () => {
    const ni = i + 1;
    setPicked(null);
    setI(ni);
    if (ni >= items.length) onDone?.(results.filter(Boolean).length, items.length);
  };

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="chip">
            {i + 1} / {items.length}
          </span>
          <span className="chip">{DIFF[q.difficulty]}</span>
        </div>
        <div className="flex gap-1">
          {items.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 w-5 rounded-full ${
                k < results.length ? (results[k] ? "bg-good" : "bg-danger") : k === i ? "bg-accent" : "bg-base-400"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="text-[15px] leading-relaxed text-ink mb-4">
        <RichText text={q.stem} />
      </div>
      <div className="space-y-2">
        {ord.map((oi, k) => {
          const isAns = oi === q.answer;
          const isPicked = oi === picked;
          const state =
            picked === null
              ? "border-line hover:border-accent/50 hover:bg-accent/[0.05]"
              : isAns
                ? "border-good/60 bg-good/[0.08]"
                : isPicked
                  ? "border-danger/60 bg-danger/[0.08]"
                  : "border-line opacity-60";
          return (
            <button
              key={oi}
              onClick={() => choose(oi)}
              disabled={picked !== null}
              className={`w-full text-left flex gap-3 rounded-lg border px-3 py-2.5 transition-colors ${state}`}
            >
              <span className="font-mono text-[12px] text-ink-faint mt-0.5">{String.fromCharCode(65 + k)}</span>
              <span className="text-[14px] text-ink-soft">
                <RichText text={q.options[oi]} />
              </span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 animate-fadein">
          <div className={`text-sm font-semibold ${picked === q.answer ? "text-good" : "text-danger"}`}>
            {picked === q.answer ? "Correct" : "Not quite"}
          </div>
          <div className="text-[14px] text-ink-soft leading-relaxed mt-1">
            <RichText text={q.explanation} />
          </div>
          <RefList ids={q.refs} />
          <div className="flex justify-end mt-3">
            <button className="btn btn-accent" onClick={next}>
              {i + 1 < items.length ? "Next question" : "Finish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
