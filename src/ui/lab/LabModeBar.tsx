// The session mode bar every lab shows (found-lab-session-plumbing): the mode the run is in
// (guided, supervised or independent practice, or an exam), and in supervised and independent
// practice the learner's way to ask for help, which shows the tips from then on and is counted
// against entrustment. Guided practice needs no button (tips are shown as they apply); exams offer
// no help. Nothing here reports a score or the state of the procedure (labScreens: no live scores,
// no state chips).
import type { ReactNode } from "react";
import type { AssessmentMode } from "../../mentor/types";
// The labels live in a plain module so this file exports only its component (React Fast Refresh).
import { MODE_LABEL } from "./labRun";

export interface LabModeBarProps {
  mode: AssessmentMode;
  /** when the learner first asked for help (useLabRun), or null */
  helpAskedAt: number | null;
  /** ask for help (useLabRun's askHelp) */
  onAskHelp?: () => void;
  /** further controls of the lab, on the right */
  children?: ReactNode;
  className?: string;
}

export default function LabModeBar({ mode, helpAskedAt, onAskHelp, children, className = "" }: LabModeBarProps) {
  const canAsk = (mode === "supervised" || mode === "independent") && !!onAskHelp;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="Session">
      <span className="chip" title={mode === "exam" ? "No tips or hints in an exam; safety stops still apply" : undefined}>
        {MODE_LABEL[mode]}
      </span>
      {canAsk &&
        (helpAskedAt === null ? (
          <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onAskHelp} title="Shows the tips for what you are doing; counted as a hint">
            Ask for help
          </button>
        ) : (
          <span className="text-xs text-ink-faint">Tips on</span>
        ))}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
