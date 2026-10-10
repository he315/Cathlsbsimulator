// The lab tips panel every lab uses (found-lab-session-plumbing): the technique tips for the current
// moment (useContextTips), each linked to the lesson that teaches it, in a collapsible panel. The
// policy decides what it shows: guided practice shows tips as they become relevant; supervised and
// independent practice show an 'Ask for a tip' button until the learner asks (useLabRun's askHelp);
// exams render nothing. In DEV builds a last row lists the events active now, for checking the
// lab's tip context; it is never in a production build.
import { useState } from "react";
import type { AssessmentMode } from "../../mentor/types";
import type { LabEvent, LabTip } from "../../content/lab/tips";
import { TipCard } from "../content/BlockRenderer";
import { openLesson } from "../content/openLesson";

const DEV = !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

export interface LabTipsPanelProps {
  tips: readonly LabTip[];
  /** whether the policy lets the learner see tips now (useContextTips) */
  visible: boolean;
  mode: AssessmentMode;
  /** ask for help (useLabRun's askHelp); the button shows while tips are hidden */
  onAskHelp?: () => void;
  /** events active now (EventLog.active): shown in DEV builds only */
  events?: readonly LabEvent[];
  title?: string;
  /** start collapsed (default open) */
  defaultCollapsed?: boolean;
  className?: string;
}

export default function LabTipsPanel({ tips, visible, mode, onAskHelp, events, title = "Technique", defaultCollapsed = false, className = "" }: LabTipsPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (mode === "exam") return null;
  const count = visible && tips.length ? ` (${tips.length})` : "";
  return (
    <section className={`panel ${className}`} aria-label={title}>
      <div className="panel-head">
        <button type="button" className="flex items-center gap-2 text-left text-[13px] font-semibold text-ink" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
          <span aria-hidden className="inline-block w-3 text-ink-faint">
            {collapsed ? "+" : "−"}
          </span>
          {title}
          <span className="font-normal text-ink-faint">{count}</span>
        </button>
        {!visible && onAskHelp && (
          <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onAskHelp}>
            Ask for a tip
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="px-4 py-3">
          {!visible ? (
            <p className="text-[12.5px] text-ink-faint">Tips for what you are doing appear here when you ask for help.</p>
          ) : tips.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">No tip for this moment. Keep going, or ask the attending.</p>
          ) : (
            <div className="max-h-[42vh] overflow-y-auto">
              {tips.map((t) => (
                <div key={t.id}>
                  <TipCard tip={t} />
                  <button type="button" className="-mt-2 mb-2 text-[12px] text-accent hover:underline" onClick={() => void openLesson(t.lessonId)}>
                    Read the lesson
                  </button>
                </div>
              ))}
            </div>
          )}
          {DEV && events && (
            <p className="mt-2 border-t border-line pt-2 font-mono text-[12px] text-ink-faint" data-dev="lab-events">
              Events: {events.length ? events.join(", ") : "none"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
