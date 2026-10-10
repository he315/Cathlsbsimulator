// ---------------------------------------------------------------------------
// Captions: what the team, the patient and the operator said, in order, with
// the time of day. Read-backs and questions are marked; the newest order still
// waiting for the operator gets "Correct" and "No" buttons, which send the same
// words as typing them. Captions are always on, so the lab works without sound.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import type { Team } from "../../simulation/team/team";
import { roleLabel } from "../../simulation/team/agent";
import type { Utterance } from "../../simulation/team/types";
import { useOpenOrder, useUtterances } from "./useTeam";

export interface CaptionsProps {
  team: Team | null;
  /** lines kept on screen */
  limit?: number;
  sedationRole?: "sedation-nurse" | "anaesthetist";
  /** hide the operator's own lines */
  hideOperator?: boolean;
  className?: string;
  /** fixed height in px (the list scrolls); default fills the parent */
  height?: number;
  /** "panel" (default): a full panel with its header. "overlay": the last few lines over the live image. */
  variant?: "panel" | "overlay";
}

const KIND_CHIP: Partial<Record<Utterance["kind"], string>> = {
  readback: "read-back",
  query: "question",
  callout: "callout",
};

export function CaptionLine({ u, sedationRole }: { u: Utterance; sedationRole?: "sedation-nurse" | "anaesthetist" }) {
  const op = u.speaker === "operator";
  const pt = u.speaker === "patient";
  const chip = KIND_CHIP[u.kind];
  return (
    <li className={`flex gap-2.5 px-3 py-1.5 ${op ? "bg-base-800/60" : ""}`} data-kind={u.kind} data-speaker={u.speaker}>
      <span className="w-11 shrink-0 pt-px font-mono text-xs text-ink-faint">{u.clock}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${op ? "text-accent" : pt ? "text-warn" : "text-ink-soft"}`}>{roleLabel(u.speaker, sedationRole)}</span>
          {chip && <span className="rounded border border-line-strong px-1.5 text-xs leading-5 text-ink-faint">{chip}</span>}
        </div>
        <p className={`text-[13px] leading-snug ${u.urgent ? "font-medium text-[#f2938c]" : op ? "text-ink-soft" : "text-ink"}`}>{u.text}</p>
      </div>
    </li>
  );
}

export default function Captions({ team, limit = 40, sedationRole = "sedation-nurse", hideOperator = false, className = "", height, variant = "panel" }: CaptionsProps) {
  const list = useUtterances(team, limit);
  const open = useOpenOrder(team);
  if (variant === "overlay") return <CaptionsOverlay list={hideOperator ? list.filter((u) => u.speaker !== "operator") : list} sedationRole={sedationRole} className={className} limit={limit} />;
  return <CaptionsPanel team={team} list={list} open={open} sedationRole={sedationRole} hideOperator={hideOperator} className={className} height={height} />;
}

/** The last lines, fading out after a while, over the bottom of the live image (no controls). */
function CaptionsOverlay({ list, sedationRole, className, limit }: { list: Utterance[]; sedationRole: "sedation-nurse" | "anaesthetist"; className: string; limit: number }) {
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef(new Map<number, number>());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  for (const u of list) if (!seen.current.has(u.id)) seen.current.set(u.id, Date.now());
  // a line stays for 8 s (model), the newest three at most
  const shown = list.filter((u) => now - (seen.current.get(u.id) ?? now) < 8000).slice(-Math.min(3, limit));
  if (!shown.length) return null;
  return (
    <ol className={`pointer-events-none flex flex-col gap-0.5 rounded-md bg-black/60 px-3 py-1.5 ${className}`} aria-live="polite" aria-label="Team captions">
      {shown.map((u) => (
        <li key={u.id} className="text-[13px] leading-snug">
          <span className={`mr-1.5 text-xs font-medium ${u.speaker === "operator" ? "text-accent" : u.speaker === "patient" ? "text-warn" : "text-ink-soft"}`}>{roleLabel(u.speaker, sedationRole)}</span>
          <span className={u.urgent ? "font-medium text-[#f2938c]" : "text-ink"}>{u.text}</span>
        </li>
      ))}
    </ol>
  );
}

function CaptionsPanel({ team, list, open, sedationRole, hideOperator, className, height }: { team: Team | null; list: Utterance[]; open: ReturnType<typeof useOpenOrder>; sedationRole: "sedation-nurse" | "anaesthetist"; hideOperator: boolean; className: string; height?: number }) {
  const end = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [list.length]);
  const shown = hideOperator ? list.filter((u) => u.speaker !== "operator") : list;
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`} aria-label="Team captions" style={height ? { height } : undefined}>
      <div className="panel-head">
        <span>Team</span>
        <span className="text-xs font-normal text-ink-faint">Ctrl K or ⌘K to speak</span>
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto py-1" aria-live="polite">
        {shown.length === 0 && <li className="px-3 py-2 text-[13px] text-ink-faint">Nothing said yet.</li>}
        {shown.map((u) => (
          <CaptionLine key={u.id} u={u} sedationRole={sedationRole} />
        ))}
        <div ref={end} />
      </ol>
      {open && team && (
        <div className="flex items-center gap-2 border-t border-line px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
            {open.status === "queried" ? "Question waiting" : "Read-back to confirm"}: {open.readbackText ?? open.raw}
          </span>
          <button type="button" className="btn btn-good px-2.5 py-1 text-xs" onClick={() => team.command("correct", "button")}>
            Correct
          </button>
          <button type="button" className="btn btn-ghost px-2.5 py-1 text-xs" onClick={() => team.command("no", "button")}>
            No
          </button>
        </div>
      )}
    </section>
  );
}
