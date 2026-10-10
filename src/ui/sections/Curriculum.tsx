import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { PHASES, phaseForDay } from "../../data/curriculum";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import SectionShell from "../SectionShell";

export default function Curriculum() {
  const profile = useProgressStore((s) => s.profile);
  const setCurrentDay = useProgressStore((s) => s.setCurrentDay);
  const launch = useUiStore((s) => s.launch);
  const setSection = useUiStore((s) => s.setSection);

  const current = phaseForDay(profile.currentDay);

  const startPhaseCase = (phaseId: number) => {
    const target = Math.min(5, Math.max(1, Math.ceil(phaseId / 2)));
    const pool = CASE_LIBRARY.filter((c) => c.difficulty === target);
    const c = (pool.length ? pool : CASE_LIBRARY)[Math.floor(Math.random() * (pool.length || CASE_LIBRARY.length))];
    launch(c, "case");
  };

  return (
    <SectionShell
      title="Guided curriculum"
      subtitle="A 365-day, 9-phase path from spatial orientation to complex, safe diagnostic angiography."
      actions={<button className="btn" onClick={() => setSection("daily")}>Today's drills</button>}
    >
      <div className="panel p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="stat-label">Training day</span>
          <span className="font-mono text-ink">{profile.currentDay} / 365</span>
        </div>
        <input
          type="range"
          min={1}
          max={365}
          value={profile.currentDay}
          onChange={(e) => setCurrentDay(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-[12px] text-ink-faint mt-1">
          Currently in <span className="text-accent">{current.name}</span> — {current.focus}
        </div>
      </div>

      <div className="space-y-2">
        {PHASES.map((p) => {
          const active = p.id === current.id;
          const passed = profile.currentDay > p.dayEnd;
          return (
            <div
              key={p.id}
              className={`panel p-4 ${active ? "border-accent/50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`chip ${passed ? "text-good" : active ? "text-accent" : ""}`}>
                      Phase {p.id}
                    </span>
                    <span className="text-sm font-medium text-ink">{p.name}</span>
                  </div>
                  <div className="text-[12px] text-ink-faint mt-1">
                    Days {p.dayStart}–{p.dayEnd} · {p.focus}
                  </div>
                </div>
                <button className="btn shrink-0" onClick={() => startPhaseCase(p.id)}>
                  Practice
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.topics.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
