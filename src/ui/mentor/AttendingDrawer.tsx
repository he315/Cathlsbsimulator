// ---------------------------------------------------------------------------
// The attending drawer: what the attending has said this case, the time-out
// conversation ("Talk me through your plan" with the learner's choices), and
// the learner's own requests for help. It never shows a score, a metric or the
// engagement state: the learner reads the image and the trace.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import type { AssessmentMode, FrameOption, MentorUtterance } from "../../mentor/types";
import { clock } from "../../mentor/debrief";

export interface AttendingDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: AssessmentMode;
  utterances: MentorUtterance[];
  /** wall time of the case start, for mm:ss stamps */
  t0?: number;
  /** learner asks for help (counts as a hint) */
  onAskHelp?: () => void;
  /** learner asks the attending to demonstrate (deferred this wave) */
  onShowMe?: () => void;
  showMeAvailable?: boolean;
  /** learner answers a time-out with a frame */
  onFrame?: (utteranceId: string, frame: FrameOption) => void;
  /** technique tips for the current moment (src/ui/lab/TechniqueTips.tsx) */
  technique?: React.ReactNode;
}

export default function AttendingDrawer({ open, onClose, mode, utterances, t0 = 0, onAskHelp, onShowMe, showMeAvailable = false, onFrame, technique }: AttendingDrawerProps) {
  const [answered, setAnswered] = useState<Record<string, FrameOption>>({});
  const items = useMemo(() => utterances.slice().reverse(), [utterances]);
  const exam = mode === "exam";
  if (!open) return null;
  return (
    <aside className="panel flex h-full w-[340px] max-w-full flex-col" aria-label="Attending">
      <div className="panel-head">
        <span>Attending</span>
        <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={onClose}>
          Close
        </button>
      </div>
      {exam ? (
        <div className="notice notice-info m-3">Assessment in progress. Your attending is watching and will step in only for safety.</div>
      ) : (
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
          <button type="button" className="btn text-[13px]" onClick={onAskHelp} disabled={!onAskHelp}>
            Ask for help
          </button>
          <button type="button" className="btn text-[13px]" onClick={onShowMe} disabled={!showMeAvailable || !onShowMe} title={showMeAvailable ? undefined : "Demonstration is not available yet"}>
            Show me
          </button>
          <span className="w-full text-xs text-ink-faint">Asking for help is noted for your debrief.</span>
        </div>
      )}
      {technique}
      <ol className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {items.length === 0 && <li className="text-[13px] text-ink-faint">{exam ? "No interventions so far." : "Nothing said yet. Talk through what you are doing if you like; the attending is listening."}</li>}
        {items.map((u) => {
          const stop = u.level >= 5 || u.blocking;
          const chosen = answered[u.id];
          return (
            <li key={u.id} className={`rounded-lg border px-3 py-2 ${stop ? "border-[#5c2a27] bg-[#2a1615]" : "border-line bg-base-800"}`}>
              <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
                <span className="font-mono">{clock(u.tWall - t0)}</span>
                {stop && <span className="text-danger">Stopped</span>}
              </div>
              <p className={`text-[14px] leading-snug ${stop ? "text-[#f2938c]" : "text-ink"}`}>{u.text}</p>
              {u.frames && u.frames.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {chosen ? (
                    <>
                      <p className="text-[13px] text-ink-soft">You: {chosen.text}</p>
                      <p className="text-[13px] leading-snug text-ink">{chosen.teaching}</p>
                    </>
                  ) : (
                    u.frames.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="btn w-full justify-start text-left text-[13px]"
                        onClick={() => {
                          setAnswered((a) => ({ ...a, [u.id]: f }));
                          onFrame?.(u.id, f);
                        }}
                      >
                        {f.text}
                      </button>
                    ))
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
