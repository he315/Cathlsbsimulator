import { useSimulatorStore } from "../../state/useSimulatorStore";
import { engColor } from "./helpers";
import { MISTAKE_INFO, masteryLabel } from "../../data/teachingText";
import type { SimEvent } from "../../types";
import Scorebar from "./Scorebar";

function eventTone(code: SimEvent["code"]): string {
  if (code === "engaged" || code === "diagnostic-injection") return "text-good";
  if (code === "info") return "text-ink-faint";
  return "text-danger";
}

export default function CoachPanel({ showObjectives = true }: { showObjectives?: boolean }) {
  const eng = useSimulatorStore((s) => s.engagement);
  const caseData = useSimulatorStore((s) => s.caseData);
  const events = useSimulatorStore((s) => s.events);
  const finished = useSimulatorStore((s) => s.finished);
  const coach = useSimulatorStore((s) => s.coach);
  const score = useSimulatorStore((s) => s.score);
  const lastHint = useSimulatorStore((s) => s.lastHint);

  const recent = [...events].slice(-7).reverse();

  if (finished && coach) {
    const mastery = masteryLabel(score.finalScore);
    return (
      <div className="panel animate-fadein">
        <div className="panel-head">
          <span>Case debrief</span>
          <span className="font-mono normal-case text-ink">{score.finalScore}/100</span>
        </div>
        <div className="p-3 space-y-3 text-sm">
          <div className={`text-${mastery.tone} font-semibold`}>{mastery.label}</div>
          <Scorebar />
          <div>
            <div className="font-medium text-ink">{coach.headline}</div>
            <p className="text-ink-soft mt-1 leading-snug">{coach.detail}</p>
          </div>
          {coach.positives.length > 0 && (
            <ul className="space-y-1">
              {coach.positives.map((p, i) => (
                <li key={i} className="text-good text-xs">+ {p}</li>
              ))}
            </ul>
          )}
          {coach.recommendation && (
            <div className="rounded-md border border-accent/30 bg-accent/10 p-2 text-xs text-ink-soft">
              <span className="text-accent font-medium">Drill: </span>
              {coach.recommendation.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Coach</span>
        <span
          className="normal-case font-normal font-mono text-[12px]"
          style={{ color: engColor(eng) }}
        >
          {eng.kind}
        </span>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-sm leading-snug" style={{ color: engColor(eng) }}>
          {eng.message}
        </p>

        {lastHint && (
          <div className="rounded-md border border-accent/30 bg-accent/10 p-2 text-xs text-ink-soft">
            {lastHint}
          </div>
        )}

        <Scorebar />

        {showObjectives && (
          <div className="space-y-1">
            <div className="stat-label">Objectives</div>
            {caseData.objectives.map((o, i) => (
              <div key={i} className="text-xs text-ink-soft">• {o}</div>
            ))}
          </div>
        )}

        {caseData.traps.length > 0 && showObjectives && (
          <div className="space-y-1">
            <div className="stat-label">Watch out for</div>
            {caseData.traps.slice(0, 3).map((t, i) => (
              <div key={i} className="text-xs text-warn/90">! {t}</div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <div className="stat-label">Event log</div>
          {recent.length === 0 && <div className="text-xs text-ink-faint">No events yet.</div>}
          {recent.map((e, i) => (
            <div key={i} className={`text-[12px] leading-snug ${eventTone(e.code)}`}>
              <span className="font-mono text-ink-faint">{e.t.toFixed(0)}s </span>
              {labelFor(e)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function labelFor(e: SimEvent): string {
  if (e.code === "engaged") return "Selective engagement";
  if (e.code === "diagnostic-injection") return "Diagnostic run obtained";
  if (e.code === "info") return e.message;
  const info = (MISTAKE_INFO as Record<string, { label: string }>)[e.code];
  return info ? info.label : e.message;
}
