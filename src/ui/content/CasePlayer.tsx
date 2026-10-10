// Branching case player. Best choice scores 2, acceptable 1, otherwise 0.
// A chosen option may jump to another step via `next` (often a consequence
// step: a complication or a recovery); otherwise the case continues with the
// next main step. Choices carry a stateDelta, so non-best decisions compound:
// the stability score falls and flags set earlier change what later steps and
// the outcome say.
//
// Each decision is also logged locally as an item response (case:<id>:<step>)
// for item analytics (p-value and point-biserial, see content/validate.ts).
import { useState } from "react";
import type { CaseStudy } from "../../content/schema";
import { nextStepId, itemStats, type ItemResponse, type ItemStat } from "../../content/validate";
import { useProgressStore } from "../../state/useProgressStore";
import RefList from "./RefList";
import RichText from "./RichText";

// ---------------------------------------------------------------------------
// Local item-response log (this browser only). QuizRunner can use the same log.
// ---------------------------------------------------------------------------
const ITEM_LOG_KEY = "cathmaster:v1:item-log";
const ITEM_LOG_MAX = 20000;

export function loadItemLog(): ItemResponse[] {
  try {
    const raw = globalThis.localStorage?.getItem(ITEM_LOG_KEY);
    return raw ? (JSON.parse(raw) as ItemResponse[]) : [];
  } catch {
    return [];
  }
}

/** Record one response. `attempt` identifies the respondent (one quiz or case attempt). */
export function logItemResponse(attempt: string, item: string, correct: boolean): void {
  try {
    const all = [...loadItemLog(), { learner: attempt, item, correct }].slice(-ITEM_LOG_MAX);
    globalThis.localStorage?.setItem(ITEM_LOG_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable: analytics are skipped
  }
}

/** p-value and point-biserial for every logged item. */
export function itemAnalytics(): Record<string, ItemStat> {
  return itemStats(loadItemLog());
}

export function ProvenanceBadge({ c }: { c: CaseStudy }) {
  return c.provenance.kind === "published" ? (
    <span className="chip border-good/40 text-good">published case</span>
  ) : (
    <span className="chip" title="Teaching case written for this app; not a real patient">
      teaching case
    </span>
  );
}

/** Stable per-step shuffle so the best option is not always in the same place. */
function optionOrder(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 2654435761);
    const j = (h >>> 0) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

interface Taken {
  stepId: string;
  option: number;
  points: number;
}

const START_STABILITY = 100;

/**
 * Stability change when an option has no authored stateDelta. Model parameters
 * (teaching score, not physiology): the best action costs nothing, an
 * acceptable one a little, any other choice more, so non-best choices compound.
 */
export const DEFAULT_STABILITY_DELTA = { best: 0, acceptable: -4, other: -10 } as const;

export function stabilityDelta(o: { best?: boolean; acceptable?: boolean; stateDelta?: { stability?: number } }): number {
  if (o.stateDelta?.stability !== undefined) return o.stateDelta.stability;
  return o.best ? DEFAULT_STABILITY_DELTA.best : o.acceptable ? DEFAULT_STABILITY_DELTA.acceptable : DEFAULT_STABILITY_DELTA.other;
}

export default function CasePlayer({ c, onExit }: { c: CaseStudy; onExit?: () => void }) {
  const recordCase = useProgressStore((s) => s.recordCase);
  const [stepId, setStepId] = useState<string | null>(null); // null = presentation screen
  const [lastMain, setLastMain] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [taken, setTaken] = useState<Taken[]>([]);
  const [done, setDone] = useState(false);
  const [stability, setStability] = useState(START_STABILITY);
  const [flags, setFlags] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(() => `${c.id}:${Date.now()}`);

  const step = stepId ? c.steps.find((s) => s.id === stepId) : undefined;
  const consequence = step?.kind === "consequence";

  const restart = () => {
    setStepId(null);
    setLastMain(null);
    setPicked(null);
    setTaken([]);
    setDone(false);
    setStability(START_STABILITY);
    setFlags([]);
    setAttempt(`${c.id}:${Date.now()}`);
  };

  const enter = (id: string | null) => {
    setStepId(id);
    const s = id ? c.steps.find((x) => x.id === id) : undefined;
    if (s && s.kind !== "consequence") setLastMain(s.id);
  };

  const choose = (k: number) => {
    if (!step || picked !== null) return;
    const o = step.options[k];
    const points = o.best ? 2 : o.acceptable ? 1 : 0;
    setPicked(k);
    setTaken((t) => [...t, { stepId: step.id, option: k, points }]);
    const d = stabilityDelta(o);
    if (d) setStability((v) => Math.max(0, Math.min(100, v + d)));
    if (o.stateDelta?.flags?.length) setFlags((f) => [...new Set([...f, ...o.stateDelta!.flags!])]);
    logItemResponse(attempt, `case:${c.id}:${step.id}`, !!(o.best || o.acceptable));
  };

  const advance = () => {
    if (!step || picked === null) return;
    const o = step.options[picked];
    const lm = step.kind === "consequence" ? lastMain : step.id;
    const nextId = nextStepId(c, o, lm);
    setPicked(null);
    if (!nextId) {
      const score = Math.round((100 * taken.reduce((a, t) => a + t.points, 0)) / Math.max(1, taken.length * 2));
      recordCase(c.id, score);
      setDone(true);
      return;
    }
    enter(nextId);
  };

  const score = Math.round((100 * taken.reduce((a, t) => a + t.points, 0)) / Math.max(1, taken.length * 2));
  const decisions = taken.length + (picked === null && step ? 1 : 0);
  const variants = (step?.variants ?? []).filter((v) => flags.includes(v.flag));
  const stabilityTone = stability >= 80 ? "text-good" : stability >= 50 ? "text-warn" : "text-danger";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <ProvenanceBadge c={c} />
        <span className="chip">stage {c.stage}</span>
        {onExit && (
          <button className="btn btn-ghost ml-auto !py-1" onClick={onExit}>
            ← All cases
          </button>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-ink">{c.title}</h2>
      <p className="text-ink-faint text-sm mt-1">{c.summary}</p>
      {c.provenance.kind === "published" && (
        <div className="text-[12px] text-ink-faint mt-2">
          Source: {c.provenance.citation}{" "}
          <a className="text-accent hover:underline" href={c.provenance.url} target="_blank" rel="noreferrer">
            original report
          </a>
          . Retold in summary for teaching; read the original for the full details.
        </div>
      )}

      {stepId === null && !done && (
        <div className="panel p-5 mt-4 animate-fadein">
          <div className="stat-label mb-1">Presentation</div>
          <p className="text-[14.5px] text-ink-soft leading-relaxed">
            <RichText text={c.presentation} />
          </p>
          {c.findings.length > 0 && (
            <>
              <div className="stat-label mt-4 mb-1">Findings</div>
              <ul className="list-disc pl-5 text-[14px] text-ink-soft space-y-1">
                {c.findings.map((f, i) => (
                  <li key={i}>
                    <RichText text={f} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="flex justify-end mt-4">
            <button className="btn btn-accent" onClick={() => enter(c.steps[0]?.id ?? null)}>
              Start the case
            </button>
          </div>
        </div>
      )}

      {step && !done && (
        <div className={`panel p-5 mt-4 animate-fadein ${consequence ? "border-warn/40" : ""}`} key={step.id}>
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="stat-label">{consequence ? "Consequence of your last decision" : `Decision ${decisions}`}</span>
            <div className="flex items-center gap-2">
              <span className="chip" title="Teaching score for the patient's course: it falls with choices that harm or delay, and does not represent a measured quantity">
                patient course <span className={`metric ${stabilityTone}`}>{stability}</span>
              </span>
              {taken.length > 0 && <span className="chip font-mono">{score}%</span>}
            </div>
          </div>
          <div className="bar mb-3" aria-hidden>
            <span style={{ width: `${stability}%` }} />
          </div>
          {step.info && (
            <div className="rounded-md border border-line bg-base-800/70 px-3 py-2 text-[14px] text-ink-soft mb-3 font-mono leading-relaxed">
              {step.info}
            </div>
          )}
          {variants.map((v) => (
            <div key={v.flag} className="notice notice-warn mb-3">
              <RichText text={v.info} />
            </div>
          ))}
          <div className="text-[15px] text-ink mb-3">
            <RichText text={step.prompt} />
          </div>
          <div className="space-y-2">
            {optionOrder(step.options.length, c.id + step.id).map((k) => {
              const o = step.options[k];
              const show = picked !== null;
              const cls = !show
                ? "border-line hover:border-accent/50 hover:bg-accent/[0.05]"
                : o.best
                  ? "border-good/60 bg-good/[0.08]"
                  : k === picked
                    ? o.acceptable
                      ? "border-warn/60 bg-warn/[0.08]"
                      : "border-danger/60 bg-danger/[0.08]"
                    : "border-line opacity-60";
              return (
                <button
                  key={k}
                  disabled={show}
                  onClick={() => choose(k)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${cls}`}
                >
                  <div className="text-[14px] text-ink-soft">
                    <RichText text={o.text} />
                  </div>
                  {show && (k === picked || o.best) && (
                    <div className="text-[13px] text-ink-faint mt-1.5 leading-relaxed">
                      <span className={o.best ? "text-good" : o.acceptable ? "text-warn" : "text-danger"}>
                        {o.best ? "Best: " : o.acceptable ? "Acceptable: " : "Problem: "}
                      </span>
                      <RichText text={o.feedback} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="flex justify-end mt-4">
              <button className="btn btn-accent" onClick={advance}>
                Continue
              </button>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="panel p-5 mt-4 animate-fadein">
          <div className="flex items-center justify-between">
            <div className="stat-label">Outcome</div>
            <span className={`metric text-3xl font-semibold ${score >= 80 ? "text-good" : score >= 60 ? "text-warn" : "text-danger"}`}>
              {score}%
            </span>
          </div>
          <p className="text-[14.5px] text-ink-soft leading-relaxed mt-2">
            <RichText text={c.outcome} />
          </p>
          {(c.outcomeVariants ?? [])
            .filter((v) => flags.includes(v.flag))
            .map((v) => (
              <p key={v.flag} className="text-[14.5px] text-ink-soft leading-relaxed mt-2">
                <RichText text={v.text} />
              </p>
            ))}
          <div className="text-[13px] text-ink-faint mt-2">
            Patient course score at the end: <span className={`metric ${stabilityTone}`}>{stability}</span> of 100 (a teaching score that falls with harmful or delayed choices).
          </div>
          <div className="stat-label mt-4 mb-1">Learning points</div>
          <ul className="list-disc pl-5 text-[14px] text-ink-soft space-y-1">
            {c.learningPoints.map((l, i) => (
              <li key={i}>
                <RichText text={l} />
              </li>
            ))}
          </ul>
          <RefList ids={c.refs} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn" onClick={restart}>
              Replay
            </button>
            {onExit && (
              <button className="btn btn-accent" onClick={onExit}>
                Back to cases
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
