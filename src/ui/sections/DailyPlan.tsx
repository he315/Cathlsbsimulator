// Today's plan: spaced practice that is due first (procedural skills, refreshers,
// the daily challenge, quiz review and real-angiogram reads), then the phase drills.
import { useMemo } from "react";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { generateDailySession, type DailyPriority } from "../../simulation/curriculumEngine";
import { INTENSITY_LABEL } from "../../data/curriculum";
import { dueIds } from "../../simulation/srs";
import { todayStr } from "../../utils/storage";
import type { DrillPlan, SectionId } from "../../types";
import SectionShell from "../SectionShell";
import { angioDueKeys, requestDrill } from "../angio/library";
import { dailyChallenge, dueSkills, nextRung } from "../../progress/schedule";
import { EPA_BY_ID } from "../../progress/competency";
import { ladderFor, LADDER_PARAMS } from "../../content/mentor/catalogue";
import { startPractice } from "../../progress/ui";
import type { EpaId } from "../../progress/types";

/** Model parameters: minutes given to each kind of due item. */
const MIN = { skill: 15, challenge: 20, readsPer: 1, quizPer: 1, cap: 30 };

const SECTION_FOR: Record<string, SectionId> = { diagnostic: "cases", reading: "angio-real", pci: "angio-pci", lab: "dashboard" };

export default function DailyPlan() {
  const profile = useProgressStore((s) => s.profile);
  const completeDay = useProgressStore((s) => s.completeDay);
  const setSection = useUiStore((s) => s.setSection);
  const today = todayStr();

  const { priority, actions } = useMemo(() => {
    const priority: DailyPriority[] = [];
    const actions: (() => void)[] = [];
    for (const s of dueSkills(profile.skillMemory, profile.entrustment, today).slice(0, 4)) {
      const e = EPA_BY_ID[s.epa];
      priority.push({
        kind: "case",
        title: `${s.reason === "refresher" ? "Refresher" : "Spaced practice"}: ${e.title}`,
        minutes: MIN.skill,
        target: `Rung ${nextRung(profile.logbook, s.epa)}`,
        section: SECTION_FOR[ladderFor(s.epa).kind] ?? "dashboard",
        reason: s.reason === "refresher" ? "level lapsed" : `due since ${s.due}`,
      });
      const epa: EpaId = s.epa;
      actions.push(() => void startPractice(epa, profile.logbook));
    }
    const dc = dailyChallenge(profile.logbook, profile.entrustment, profile.skillMemory, today);
    if (dc) {
      priority.push({ kind: "challenge", title: `Daily challenge: ${EPA_BY_ID[dc.epa].title}`, minutes: MIN.challenge, target: `Rung ${dc.rung}, no hints`, section: "challenge" });
      actions.push(() => setSection("challenge"));
    }
    const q = dueIds(profile.quizMemory, today).length;
    if (q > 0) {
      priority.push({ kind: "reflection", title: `Quiz review: ${q} due`, minutes: Math.min(MIN.cap, Math.max(5, q * MIN.quizPer)), target: "Spaced repetition", section: "review" });
      actions.push(() => setSection("review"));
    }
    const reads = angioDueKeys(today).length;
    if (reads > 0) {
      priority.push({ kind: "pathology", title: `Real-angiogram reads: ${reads} due`, minutes: Math.min(MIN.cap, Math.max(5, reads * MIN.readsPer)), target: "Runs read wrongly before", section: "angio-real" });
      actions.push(() => {
        requestDrill("review");
        setSection("angio-real");
      });
    }
    return { priority, actions };
  }, [profile.skillMemory, profile.entrustment, profile.logbook, profile.quizMemory, today, setSection]);

  const session = generateDailySession(profile.currentDay, profile.intensity, profile.mistakes, priority);
  const done = profile.completedDays.includes(profile.currentDay);

  const openDrill = (d: DrillPlan, i: number) => (i < actions.length ? actions[i]() : setSection(d.section));

  return (
    <SectionShell
      title={session.title}
      subtitle={`${INTENSITY_LABEL[profile.intensity]} · ${session.totalMinutes} min planned · ${session.phase.focus}`}
      actions={
        <button className={`btn ${done ? "" : "btn-good"}`} disabled={done} onClick={() => completeDay(profile.currentDay)}>
          {done ? "Day complete" : "Mark day complete"}
        </button>
      }
    >
      {session.adaptiveNote && (
        <div className="panel p-3 mb-4 border-accent/30">
          <div className="text-[12px] text-accent mb-1">Adaptive plan</div>
          <div className="text-sm text-ink-soft">{session.adaptiveNote}</div>
        </div>
      )}

      {priority.length > 0 && <div className="stat-label mb-2">Due today</div>}
      <div className="space-y-2">
        {session.drills.map((d, i) => (
          <div key={i}>
            {i === priority.length && priority.length > 0 && <div className="stat-label mt-5 mb-2">Phase {session.phase.id} drills</div>}
            <button onClick={() => openDrill(d, i)} className="panel p-3 w-full text-left flex items-center gap-3 hover:border-accent/40 transition-colors">
              <span className="chip w-14 justify-center font-mono">{d.minutes}m</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink truncate">{d.title}</span>
                <span className="block text-[12px] text-ink-faint">{d.target}</span>
              </span>
              <span className="text-ink-faint text-xs">open →</span>
            </button>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-ink-faint mt-4">
        Practice is spread across days on purpose: passes on one activity beyond {LADDER_PARAMS.dailyCountedPasses} a day still go in the logbook but do not count toward its ladder.
      </p>

      <div className="mt-6 panel p-4">
        <div className="stat-label mb-2">
          Phase {session.phase.id}: {session.phase.name}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {session.phase.topics.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
