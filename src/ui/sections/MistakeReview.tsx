import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { coachLongitudinal } from "../../simulation/adaptiveCoach";
import { MISTAKE_INFO } from "../../data/teachingText";
import type { MistakeRecord } from "../../types";
import SectionShell from "../SectionShell";

export default function MistakeReview() {
  const mistakes = useProgressStore((s) => s.profile.mistakes);
  const setSection = useUiStore((s) => s.setSection);

  const insight = coachLongitudinal(mistakes);
  const ledger = (Object.values(mistakes) as MistakeRecord[]).sort(
    (a, b) => b.count - a.count
  );
  const total = ledger.reduce((a, b) => a + b.count, 0);

  return (
    <SectionShell
      title="Mistake review"
      subtitle="Your recurring error patterns, ranked — with the drill that fixes each one."
    >
      <div className="panel p-4 mb-4 border-accent/30">
        <div className="text-[12px] text-accent mb-1">Coach</div>
        <div className="text-sm text-ink font-medium">{insight.headline}</div>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">{insight.detail}</p>
        {insight.recommendation && (
          <button
            className="btn btn-accent mt-3"
            onClick={() => setSection(insight.recommendation!.section)}
          >
            Go to: {insight.recommendation.text}
          </button>
        )}
      </div>

      {ledger.length === 0 ? (
        <div className="panel p-8 text-center text-ink-faint">
          No mistakes logged yet. Complete a few cases and your error patterns will appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {ledger.map((m) => {
            const info = MISTAKE_INFO[m.code];
            if (!info) return null;
            const pct = total ? Math.round((m.count / total) * 100) : 0;
            const contexts = Array.from(new Set(m.contexts)).slice(0, 3);
            return (
              <div key={m.code} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{info.label}</span>
                      <span className="chip text-danger">{m.count}×</span>
                      <span className="chip">{pct}%</span>
                    </div>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">{info.explain}</p>
                    {contexts.length > 0 && (
                      <div className="text-[12px] text-ink-faint mt-1">
                        Seen in: {contexts.join(", ")}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn shrink-0"
                    onClick={() => setSection(info.drillSection)}
                  >
                    Drill
                  </button>
                </div>
                <div className="text-[12px] text-good mt-2">→ {info.drill}</div>
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
