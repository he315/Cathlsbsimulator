// The Academy: stage roadmap → track → module (lessons, quiz, cases, practice).
import { useEffect, useMemo, useRef } from "react";
import type { Module, Track } from "../../content/schema";
import { useProgressStore } from "../../state/useProgressStore";
import { SIM_SECTION, useUiStore } from "../../state/useUiStore";
import { useContent } from "../content/useContent";
import BlockRenderer, { SourceList } from "../content/BlockRenderer";
import QuizRunner from "../content/QuizRunner";
import RefList from "../content/RefList";
import { ProvenanceBadge } from "../content/CasePlayer";
import { trackCounts, STAGES, Ring } from "../content/mastery";
import { moduleMastery3, trackMastery3, type ModuleMastery } from "../../progress/mastery";
import { EPA_BY_ID, LEVEL_LABEL } from "../../progress/competency";
import { DRILL_LABEL, loadResults, type DrillKind } from "../angio/library";
import { LevelBadge, RungTrack, startPractice } from "../../progress/ui";
import { ladderFor } from "../../content/mentor/catalogue";

/** The angio drill log, read once per mount (it lives in its own local store). */
function useDrillLog() {
  return useMemo(() => loadResults(), []);
}

const pc = (x: number | undefined) => (x === undefined ? "–" : `${Math.round(100 * x)}%`);

/** Read · Quiz · Apply chips for a module. */
function Parts({ mm }: { mm: ModuleMastery }) {
  const tone = (x?: number) => (x === undefined ? "" : x >= 1 ? "border-good/40 text-good" : x > 0 ? "" : "text-ink-faint");
  return (
    <>
      <span className={`chip ${tone(mm.read)}`} title="Lessons marked read">Read {pc(mm.read)}</span>
      <span className={`chip ${tone(mm.quiz)}`} title="Quiz items with at least two correct reviews in a row">Quiz {pc(mm.quiz)}</span>
      {mm.apply !== undefined && (
        <span className={`chip ${tone(mm.apply)}`} title="Skill: rungs cleared on the linked activities. Image reading: balanced accuracy on the linked real drills.">
          Apply {pc(mm.apply)}
        </span>
      )}
    </>
  );
}

function Loading() {
  return <div className="p-8 text-ink-faint">Loading curriculum…</div>;
}

function Crumbs({ track, mod }: { track?: Track; mod?: Module }) {
  const open = useUiStore((s) => s.openPathway);
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-faint mb-3">
      <button className="hover:text-ink" onClick={() => open({})}>
        Academy
      </button>
      {track && (
        <>
          <span>/</span>
          <button className="hover:text-ink" onClick={() => open({ trackId: track.id })}>
            {track.title}
          </button>
        </>
      )}
      {mod && (
        <>
          <span>/</span>
          <span className="text-ink-soft">{mod.title}</span>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Roadmap({ tracks }: { tracks: Track[] }) {
  const profile = useProgressStore((s) => s.profile);
  const open = useUiStore((s) => s.openPathway);
  const drillLog = useDrillLog();
  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <div className="text-[12px] tracking-[0.2em] text-accent font-semibold">CathMaster Academy</div>
        <h1 className="text-3xl font-semibold text-ink mt-1">From first principles to independent complex PCI</h1>
        <p className="text-ink-soft mt-2 max-w-3xl text-[14.5px] leading-relaxed">
          Five stages, ten tracks. Each module has lessons in plain clinical English, figures, a single-best-answer quiz that
          feeds your spaced-repetition review, branching cases, and a simulator task to practise the skill with your hands.
          Mastery has three parts shown separately: read the lessons, retain the quiz, and apply it on the linked simulator
          ladders and real-angiogram drills.
        </p>
      </div>
      <div className="space-y-6">
        {STAGES.map((st) => {
          const ts = tracks.filter((t) => t.stage === st.stage);
          if (ts.length === 0) return null;
          return (
            <section key={st.stage}>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="grid place-items-center w-7 h-7 rounded-full border border-accent/50 bg-accent/10 text-accent text-sm font-semibold">
                  {st.stage}
                </span>
                <h2 className="text-lg font-semibold text-ink">{st.name}</h2>
                <span className="text-[13px] text-ink-faint">{st.goal}</span>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {ts.map((t) => {
                  const pct = trackMastery3(t.modules, profile, drillLog);
                  const n = trackCounts(t);
                  return (
                    <button
                      key={t.id}
                      onClick={() => open({ trackId: t.id })}
                      className="panel text-left p-4 hover:panel-glow transition-shadow group"
                    >
                      <div className="flex items-start gap-3">
                        <Ring pct={pct} size={46} />
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-ink group-hover:text-accent transition-colors">{t.title}</div>
                          <div className="text-[13px] text-ink-faint mt-0.5 line-clamp-2">{t.tagline}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="chip">{n.modules} modules</span>
                        <span className="chip">{n.lessons} lessons</span>
                        <span className="chip">{n.quiz} questions</span>
                        {n.cases > 0 && <span className="chip">{n.cases} cases</span>}
                        {n.minutes > 0 && <span className="chip">~{Math.round(n.minutes / 60)} h</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TrackView({ t }: { t: Track }) {
  const profile = useProgressStore((s) => s.profile);
  const open = useUiStore((s) => s.openPathway);
  const drillLog = useDrillLog();
  const pct = trackMastery3(t.modules, profile, drillLog);
  return (
    <div className="p-6 max-w-5xl">
      <Crumbs track={t} />
      <div className="flex items-start gap-4">
        <Ring pct={pct} size={64} stroke={5} />
        <div>
          <div className="text-[12px] tracking-[0.2em] text-accent font-semibold">Stage {t.stage}</div>
          <h1 className="text-2xl font-semibold text-ink">{t.title}</h1>
          <p className="text-ink-soft mt-1 text-[14.5px] leading-relaxed max-w-3xl">{t.description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {t.modules.map((m, i) => {
          const mm = moduleMastery3(m, profile, drillLog);
          return (
            <button
              key={m.id}
              onClick={() => open({ trackId: t.id, moduleId: m.id, tab: "lessons" })}
              className="panel w-full text-left p-4 flex items-center gap-4 hover:panel-glow transition-shadow group"
            >
              <span className="font-mono text-ink-faint text-sm w-6 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-ink group-hover:text-accent transition-colors">{m.title}</div>
                <div className="text-[13px] text-ink-faint mt-0.5 line-clamp-2">{m.summary}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="chip">{m.lessons.length} lessons</span>
                  <Parts mm={mm} />
                  {(m.caseIds?.length ?? 0) > 0 && <span className="chip">{m.caseIds!.length} cases</span>}
                </div>
              </div>
              <Ring pct={mm.overall} size={42} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ModuleView({ t, m }: { t: Track; m: Module }) {
  const pathway = useUiStore((s) => s.pathway);
  const open = useUiStore((s) => s.openPathway);
  const openCase = useUiStore((s) => s.openCase);
  const openSim = useUiStore((s) => s.openSim);
  const profile = useProgressStore((s) => s.profile);
  const markLessonDone = useProgressStore((s) => s.markLessonDone);
  const drillLog = useDrillLog();
  const mm = moduleMastery3(m, profile, drillLog);
  const tab = pathway.tab ?? "lessons";
  const lesson = m.lessons.find((l) => l.id === pathway.lessonId) ?? m.lessons[0];
  const li = m.lessons.indexOf(lesson);
  const readerRef = useRef<HTMLDivElement>(null);
  const cases = useMemo(() => t.cases.filter((c) => m.caseIds?.includes(c.id)), [t, m]);
  const mi = t.modules.indexOf(m);
  const nextMod = t.modules[mi + 1];

  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [lesson?.id, tab]);

  const go = (patch: Partial<typeof pathway>) => open({ trackId: t.id, moduleId: m.id, ...pathway, ...patch });

  const tabs: { id: "lessons" | "quiz" | "cases"; label: string; n: number }[] = [
    { id: "lessons", label: "Lessons", n: m.lessons.length },
    { id: "quiz", label: "Quiz", n: m.quiz.length },
    { id: "cases", label: "Cases & practice", n: cases.length + (m.sims?.length ?? 0) + (mm.skill?.length ?? 0) },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-5 pb-3 border-b border-line">
        <Crumbs track={t} mod={m} />
        <div className="flex items-center gap-4">
          <Ring pct={mm.overall} size={48} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-ink">{m.title}</h1>
            <div className="text-[13px] text-ink-faint">{m.summary}</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Parts mm={mm} />
            </div>
          </div>
          <div className="seg">
            {tabs.map((x) => (
              <button key={x.id} className={`seg-btn !px-3 !py-1 !text-[12px] ${tab === x.id ? "seg-btn-active" : ""}`} onClick={() => go({ tab: x.id })}>
                {x.label} <span className="text-ink-faint">{x.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "lessons" && lesson && (
        <div className="flex-1 min-h-0 flex">
          <aside className="w-64 shrink-0 border-r border-line overflow-y-auto p-3 hidden lg:block">
            <div className="stat-label px-2 mb-2">Objectives</div>
            <ul className="text-[13px] text-ink-soft space-y-1 px-2 mb-4 list-disc pl-5">
              {m.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
            <div className="stat-label px-2 mb-1">Lessons</div>
            {m.lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => go({ lessonId: l.id, tab: "lessons" })}
                className={`nav-item w-full ${l.id === lesson.id ? "nav-item-active" : ""}`}
              >
                <span className={`grid place-items-center w-5 h-5 rounded-full text-[12px] shrink-0 ${profile.lessonsDone[l.id] ? "bg-good/20 text-good" : "bg-base-500 text-ink-faint"}`}>
                  {profile.lessonsDone[l.id] ? "✓" : i + 1}
                </span>
                <span className="truncate text-left text-[13px]">{l.title}</span>
              </button>
            ))}
          </aside>
          <div ref={readerRef} className="flex-1 min-w-0 overflow-y-auto">
            <article className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex items-center gap-2 text-[12px] text-ink-faint mb-1">
                <span>
                  Lesson {li + 1} of {m.lessons.length}
                </span>
                <span>·</span>
                <span>{lesson.minutes} min</span>
                {profile.lessonsDone[lesson.id] && <span className="chip border-good/40 text-good !py-0">read</span>}
              </div>
              <h2 className="text-2xl font-semibold text-ink mb-2">{lesson.title}</h2>
              <BlockRenderer blocks={lesson.blocks} />
              <SourceList sources={lesson.sources} />
              <RefList ids={lesson.refs} />
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-line">
                <button className="btn" disabled={li === 0} onClick={() => go({ lessonId: m.lessons[li - 1]?.id })}>
                  ← Previous
                </button>
                {li + 1 < m.lessons.length ? (
                  <button
                    className="btn btn-accent"
                    onClick={() => {
                      markLessonDone(lesson.id);
                      go({ lessonId: m.lessons[li + 1].id });
                    }}
                  >
                    Mark read · next lesson →
                  </button>
                ) : (
                  <button
                    className="btn btn-good"
                    onClick={() => {
                      markLessonDone(lesson.id);
                      go({ tab: "quiz" });
                    }}
                  >
                    Mark read · take the quiz →
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      )}

      {tab === "quiz" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <QuizRunner key={m.id} items={m.quiz} title={m.title} />
            {nextMod && (
              <div className="flex justify-end mt-4">
                <button className="btn" onClick={() => open({ trackId: t.id, moduleId: nextMod.id, tab: "lessons" })}>
                  Next module: {nextMod.title} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "cases" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {!!(mm.skill?.length || mm.reading?.length) && (
              <section>
                <div className="stat-label mb-2">Apply: evidence this module needs</div>
                <div className="space-y-2">
                  {mm.skill?.map((sk) => (
                    <div key={sk.epa} className="panel p-4 flex flex-wrap items-center gap-3">
                      <LevelBadge rec={profile.entrustment[sk.epa]} size="sm" />
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-[14px] text-ink font-medium">{EPA_BY_ID[sk.epa].title}</div>
                        <div className="text-[13px] text-ink-soft">
                          Clear rung {sk.target} on this ladder: two passes at that rung or above
                          {ladderFor(sk.epa).kind === "diagnostic" ? " on different cases" : ", on separate days when the rung has a single scenario"}. Cleared: {sk.cleared}. Level in force:{" "}
                          {LEVEL_LABEL[profile.entrustment[sk.epa]?.effective ?? 0].roman}.
                        </div>
                      </div>
                      <RungTrack cleared={sk.cleared} playable={ladderFor(sk.epa).playableRungs} />
                      <button className="btn btn-accent" onClick={() => startPractice(sk.epa, profile.logbook)}>
                        Practise
                      </button>
                    </div>
                  ))}
                  {mm.reading?.map((r) => (
                    <div key={r.drill} className="panel p-4 flex flex-wrap items-center gap-3">
                      <span className="led text-accent" />
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-[14px] text-ink font-medium">Real angiograms: {DRILL_LABEL[r.drill as DrillKind] ?? r.drill}</div>
                        <div className="text-[13px] text-ink-soft">
                          Balanced accuracy over all your answers{" "}
                          {Number.isFinite(r.balancedAccuracy) ? `${Math.round(100 * r.balancedAccuracy)}% (${r.n} answers)` : `not yet measured (${r.n} of 10 answers)`}; full credit at 80%.
                        </div>
                      </div>
                      <button className="btn btn-accent" onClick={() => openSim("angio-real", { drill: r.drill })}>
                        Open drill
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {(m.sims?.length ?? 0) > 0 && (
              <section>
                <div className="stat-label mb-2">Simulator practice</div>
                <div className="space-y-2">
                  {m.sims!.map((s, i) => (
                    <div key={i} className="panel p-4 flex items-center gap-3">
                      <span className="led text-accent" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-ink font-medium">{SIM_SECTION[s.sim]?.label ?? s.sim}</div>
                        <div className="text-[13px] text-ink-soft">{s.task}</div>
                      </div>
                      <button className="btn btn-accent" onClick={() => openSim(s.sim)}>
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section>
              <div className="stat-label mb-2">Cases</div>
              {cases.length === 0 ? (
                <div className="text-sm text-ink-faint">No cases attached to this module. Browse all cases in Case Studies.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {cases.map((c) => {
                    const rec = profile.caseRecords[c.id];
                    return (
                      <button key={c.id} onClick={() => openCase(c.id)} className="panel p-4 text-left hover:panel-glow transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                          <ProvenanceBadge c={c} />
                          {rec && <span className="chip font-mono">best {rec.best}%</span>}
                        </div>
                        <div className="text-[14.5px] font-semibold text-ink">{c.title}</div>
                        <div className="text-[13px] text-ink-faint mt-0.5 line-clamp-2">{c.summary}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Pathway() {
  const content = useContent();
  const pathway = useUiStore((s) => s.pathway);
  if (!content) return <Loading />;
  const t = content.TRACKS.find((x) => x.id === pathway.trackId);
  if (!t) return <Roadmap tracks={content.TRACKS} />;
  const m = t.modules.find((x) => x.id === pathway.moduleId);
  if (!m) return <TrackView t={t} />;
  return <ModuleView t={t} m={m} />;
}
