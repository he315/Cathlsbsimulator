// Spaced practice: quiz questions, procedural skills, mentor skill cards and
// real-angiogram reads due today, then the weakest modules.
import { useMemo, useState } from "react";
import type { QuizItem } from "../../content/schema";
import type { MistakeCode } from "../../types";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { dueIds, partitionDue } from "../../simulation/srs";
import { caseById, generateBatch } from "../../simulation/caseGenerator";
import { todayStr } from "../../utils/storage";
import { useContent } from "../content/useContent";
import QuizRunner from "../content/QuizRunner";
import SectionShell from "../SectionShell";
import { angioDueKeys, loadResults, requestDrill } from "../angio/library";
import { cardForCode, resolveDiagnosticStart, SKILL_CARD_TEMPLATES } from "../../mentor/skillCards";
import { MISTAKE_INFO } from "../../data/teachingText";
import { moduleMastery3 } from "../../progress/mastery";
import { dueSkills } from "../../progress/schedule";
import { EPA_BY_ID } from "../../progress/competency";
import { LevelBadge, startPractice } from "../../progress/ui";
import type { EpaId } from "../../progress/types";

const SESSION = 20;

export default function Review() {
  const content = useContent();
  const profile = useProgressStore((s) => s.profile);
  const armCard = useProgressStore((s) => s.armCard);
  const openPathway = useUiStore((s) => s.openPathway);
  const setSection = useUiStore((s) => s.setSection);
  const [session, setSession] = useState<QuizItem[] | null>(null);
  const [seed, setSeed] = useState("r0");
  const [opened, setOpened] = useState("");
  const [pciCard, setPciCard] = useState<{ title: string; scenario: string } | null>(null);
  // Re-read the drill results whenever the profile changes (a finished drill set logs a row).
  const drillLog = useMemo(() => loadResults(), [profile]);

  const index = useMemo(() => {
    const m = new Map<string, { q: QuizItem; trackId: string; moduleId: string; module: string }>();
    content?.TRACKS.forEach((t) =>
      t.modules.forEach((mod) => mod.quiz.forEach((q) => m.set(q.id, { q, trackId: t.id, moduleId: mod.id, module: mod.title })))
    );
    return m;
  }, [content]);

  if (!content) return <div className="p-8 text-ink-faint">Loading…</div>;

  const today = todayStr();
  const { quiz: quizDueAll, cards } = partitionDue(dueIds(profile.quizMemory, today));
  const due = quizDueAll.filter((id) => index.has(id));
  const dueCards = cards.filter((id) => SKILL_CARD_TEMPLATES[id.split(":").slice(1).join(":") as MistakeCode]);
  const skills = dueSkills(profile.skillMemory, profile.entrustment, today);
  const reads = angioDueKeys(today).length;
  const answered = Object.keys(profile.quizMemory).filter((id) => index.has(id));
  const totalQ = index.size;
  const mastered = answered.filter((id) => (profile.quizMemory[id]?.reps ?? 0) >= 2).length;

  const weak = content.TRACKS.flatMap((t) =>
    t.modules
      .filter((m) => m.quiz.some((q) => profile.quizMemory[q.id]))
      .map((m) => ({ t, m, mm: moduleMastery3(m, profile, drillLog) }))
  )
    .filter((x) => x.mm.overall < 70)
    .sort((a, b) => a.mm.overall - b.mm.overall)
    .slice(0, 6);

  const startDue = () => {
    setSeed(`r${Date.now()}`);
    setSession(due.slice(0, SESSION).map((id) => index.get(id)!.q));
  };
  const startMixed = () => {
    // unseen items first, then the rest, shuffled
    const unseen = [...index.keys()].filter((id) => !profile.quizMemory[id]);
    const pool = (unseen.length >= SESSION ? unseen : [...index.keys()]).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setSeed(`m${Date.now()}`);
    setSession(pool.slice(0, SESSION).map((id) => index.get(id)!.q));
  };

  const launchCard = (id: string) => {
    const code = id.split(":").slice(1).join(":") as MistakeCode;
    const { template } = cardForCode(code);
    if (template.start.kind === "pci") {
      // The PCI lab does not take a scenario from outside yet: arm the card on the scenario's
      // sim key, so the next finished session on that scenario grades it, and say so before
      // the learner leaves this screen.
      armCard(id, code, `pci-${template.start.scenario}`);
      setPciCard({ title: template.title, scenario: template.start.scenario });
      return;
    }
    const start = template.start;
    const c = (start.caseId ? caseById(start.caseId) : undefined) ?? generateBatch(start.preset, 1, `card:${id}:${Date.now()}`)[0];
    const pos = resolveDiagnosticStart(start, c);
    useSimulatorStore.getState().loadCase(c, "case");
    if (pos) useSimulatorStore.setState({ catheterId: pos.catheterId, controls: pos.controls });
    armCard(id, code, c.id);
    setSection("free");
  };

  return (
    <SectionShell
      title="Review"
      subtitle="Spaced practice: questions, procedural skills and real-angiogram reads come back just before you would lose them"
      actions={session && <button className="btn" onClick={() => setSession(null)}>End session</button>}
    >
      {session ? (
        <div className="max-w-3xl">
          <QuizRunner key={seed} items={session} title="Review session" shuffleSeed={seed} />
        </div>
      ) : (
        <div className="max-w-5xl space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="panel p-4">
              <div className="stat-label">Questions due</div>
              <div className={`metric text-3xl font-semibold mt-1 ${due.length ? "text-warn" : "text-good"}`}>{due.length}</div>
            </div>
            <div className="panel p-4">
              <div className="stat-label">Procedural skills due</div>
              <div className={`metric text-3xl font-semibold mt-1 ${skills.length + dueCards.length ? "text-warn" : "text-good"}`}>{skills.length + dueCards.length}</div>
            </div>
            <div className="panel p-4">
              <div className="stat-label">Real-angiogram reads due</div>
              <div className={`metric text-3xl font-semibold mt-1 ${reads ? "text-warn" : "text-good"}`}>{reads}</div>
            </div>
            <div className="panel p-4">
              <div className="stat-label">Questions retained (2+ in a row)</div>
              <div className="metric text-3xl font-semibold mt-1 text-ink">
                {mastered}
                <span className="text-base text-ink-faint">/{answered.length} answered</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-accent" disabled={due.length === 0} onClick={startDue}>
              Review {Math.min(SESSION, due.length)} due question{due.length === 1 ? "" : "s"}
            </button>
            <button className="btn" disabled={totalQ === 0} onClick={startMixed}>
              Mixed practice ({Math.min(SESSION, totalQ)} questions)
            </button>
            <button
              className="btn"
              disabled={reads === 0}
              onClick={() => {
                requestDrill("review");
                setSection("angio-real");
              }}
            >
              {reads} real-angiogram read{reads === 1 ? "" : "s"} due
            </button>
          </div>

          <div className="panel">
            <div className="panel-head">Procedural skills due today</div>
            {skills.length === 0 && dueCards.length === 0 ? (
              <div className="p-4 text-sm text-ink-faint">
                Nothing due. Every session schedules its activity again: a pass pushes it further out, a session that is not passed brings it back tomorrow. Extra passes before the due date do not
                push it further.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {skills.map((s) => (
                  <SkillRow key={s.epa} epa={s.epa} reason={s.reason === "refresher" ? "Refresher: the level has lapsed" : `Due since ${s.due}`} onGo={() => setOpened(startPractice(s.epa, profile.logbook))} />
                ))}
                {dueCards.map((id) => {
                  const code = id.split(":").slice(1).join(":") as MistakeCode;
                  const t = SKILL_CARD_TEMPLATES[code];
                  return (
                    <div key={id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                      <span className="chip">skill card</span>
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-[14px] text-ink">{t.title}</div>
                        <div className="text-[12px] text-ink-faint">{MISTAKE_INFO[code]?.label ?? code}: {t.brief}</div>
                      </div>
                      <button className="btn btn-accent" onClick={() => launchCard(id)}>
                        Start
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {pciCard && (
              <div className="notice notice-info !rounded-none border-x-0 border-b-0 flex-wrap items-center">
                <span className="flex-1">
                  {pciCard.title}: in the PCI lab choose the {pciCard.scenario} scenario. Your next finished session on it grades this card (passed, with no critical error).
                </span>
                <button className="btn btn-accent !h-7" onClick={() => setSection("angio-pci")}>
                  Open the PCI lab
                </button>
              </div>
            )}
            {opened && <div className="px-4 py-2 border-t border-line text-[12px] text-ink-faint">{opened}</div>}
          </div>

          <div className="panel p-4">
            <div className="panel-head -mx-4 -mt-4 mb-3 px-4">Weakest modules</div>
            {weak.length === 0 ? (
              <div className="text-sm text-ink-faint">Answer some module quizzes and your weakest areas will appear here.</div>
            ) : (
              <div className="space-y-2">
                {weak.map(({ t, m, mm }) => (
                  <button
                    key={m.id}
                    onClick={() => openPathway({ trackId: t.id, moduleId: m.id, tab: mm.apply !== undefined && mm.apply < mm.quiz ? "cases" : "lessons" })}
                    className="w-full flex items-center gap-3 text-left hover:bg-base-600/60 rounded-md px-2 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-ink truncate">{m.title}</div>
                      <div className="text-[12px] text-ink-faint">
                        {t.title} · read {Math.round(100 * mm.read)}% · quiz {Math.round(100 * mm.quiz)}%{mm.apply !== undefined ? ` · apply ${Math.round(100 * mm.apply)}%` : ""}
                      </div>
                    </div>
                    <div className="w-40 h-1.5 rounded-full bg-base-500 overflow-hidden">
                      <div className="h-full bg-warn" style={{ width: `${mm.overall}%` }} />
                    </div>
                    <span className="font-mono text-[12px] text-ink-soft w-9 text-right">{mm.overall}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function SkillRow({ epa, reason, onGo }: { epa: EpaId; reason: string; onGo: () => void }) {
  const rec = useProgressStore((s) => s.profile.entrustment[epa]);
  return (
    <div className="px-4 py-3 flex flex-wrap items-center gap-3">
      <LevelBadge rec={rec} size="sm" />
      <div className="flex-1 min-w-[220px]">
        <div className="text-[14px] text-ink">{EPA_BY_ID[epa].title}</div>
        <div className={`text-[12px] ${rec?.expired ? "text-warn" : "text-ink-faint"}`}>{reason}</div>
      </div>
      <button className="btn btn-accent" onClick={onGo}>
        Practise
      </button>
    </div>
  );
}
