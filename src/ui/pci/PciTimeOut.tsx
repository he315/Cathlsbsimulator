// ---------------------------------------------------------------------------
// The PCI team time-out (pci-attending; pm-monitoring#4): the time-out items
// of every lab (timeOutItems('pci')) and the PCI items from the module text
// (Oxford, pm-monitoring-checklist: everyone knows the brief and sign in,
// consent and the whiteboard, the equipment checked and ready, the exposure
// authorised under IR(ME)R, who defibrillates, the plan said aloud). The whole
// team must be in the room: in some cases one member has stepped out and the
// time-out waits for them (the attending refuses to run it with anyone
// missing; trying is recorded in the debrief).
// ---------------------------------------------------------------------------

import { useEffect, useReducer } from "react";
import type { PciAttending } from "./usePciAttending";
import { PCI_TEAM_MEMBERS } from "../../mentor/prebrief";
import { PCI_PLAN_LESSONS } from "../../content/mentor/prebriefs";
import { openLesson } from "../content/openLesson";
import { useTipsModule } from "../lab/useLabTips";

/**
 * The module's own tips for a form (the time-out, the plan, the sign-out), shown when the learner may see
 * tips (guided practice, or after asking for help; never in exams): teaching at the moment it applies.
 */
export function FormTips({ ids, visible }: { ids: readonly string[]; visible: boolean }) {
  const mod = useTipsModule();
  if (!visible || !mod) return null;
  const tips = ids.map((id) => mod.TIP_BY_ID[id]).filter(Boolean);
  if (!tips.length) return null;
  return (
    <ul className="space-y-1 rounded border border-line px-3 py-2 text-[12.5px]" aria-label="Tips">
      {tips.map((t) => (
        <li key={t.id}>
          <span className="font-semibold text-ink">{t.title}.</span> <span className="text-ink-soft">{t.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PciTimeOut({ attending: a, tipsVisible = false }: { attending: PciAttending; tipsVisible?: boolean }) {
  // the absent member comes back on lab time: look again while they are out
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const missing = a.missingMember();
  useEffect(() => {
    if (!missing) return;
    const id = setInterval(bump, 1000);
    return () => clearInterval(id);
  }, [missing]);
  const present = a.presentMembers();
  const items = a.timeOutItems();
  const allChecked = items.every((i) => a.timeOut.checked[i.id]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-ink-soft">Read each item aloud with the whole team, then run the time-out.</p>
        {a.lessonsAllowed && (
          <button type="button" className="text-[12px] text-accent underline-offset-2 hover:underline" onClick={() => void openLesson(PCI_PLAN_LESSONS.timeOut)} title="Opens the lesson in the Academy (leaves the lab)">
            Lesson
          </button>
        )}
      </div>
      <FormTips ids={["pci-mon-time-out"]} visible={tipsVisible} />
      <div className="flex flex-wrap gap-1.5" aria-label="The team">
        {PCI_TEAM_MEMBERS.map((m) => {
          const here = present.includes(m.id);
          return (
            <span key={m.id} className={`chip ${here ? "" : "!text-warn"}`}>
              {m.label}
              {here ? "" : ": out of the room"}
            </span>
          );
        })}
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex items-start gap-2 text-ink">
              <input type="checkbox" className="mt-0.5" checked={!!a.timeOut.checked[i.id]} onChange={(e) => a.checkTimeOut(i.id, e.target.checked)} />
              <span>{i.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-accent" disabled={!allChecked} onClick={() => a.runTimeOut()}>
          Run the time-out
        </button>
        {!a.blocking && !a.required && (
          <button type="button" className="btn" onClick={() => a.startCase()}>
            Start without a time-out
          </button>
        )}
        {missing && <span className="text-[12px] text-ink-faint">The {missing} is out of the room.</span>}
      </div>
    </div>
  );
}
