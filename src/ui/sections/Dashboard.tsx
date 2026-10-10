// Home: where you are on the path, what to do next, and quick access to every lab.
import { useMemo } from "react";
import type { Module, Track } from "../../content/schema";
import type { SimId } from "../../content/schema";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import type { SectionId } from "../../types";
import { dueIds } from "../../simulation/srs";
import { todayStr } from "../../utils/storage";
import { useContent } from "../content/useContent";
import { STAGES, Ring } from "../content/mastery";
import { angioDueKeys, loadResults } from "../angio/library";
import { moduleMastery3, trackMastery3 } from "../../progress/mastery";
import { dueSkills } from "../../progress/schedule";
import { EPA_IDS, LEVEL_LABEL } from "../../progress/competency";
import type { EpaId } from "../../progress/types";

// stroke icons (24-unit paths) for the simulator cards
const ICON = {
  procedure: "M4 20c4-8 8-12 16-16M14 4h6v6",
  cathlab: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 4v16M4 12h16",
  pci: "M4 20c3-6 6-9 10-11M9 13h6v3H9z",
  angio: "M4 4h16v16H4zM7 15c2-5 4-7 10-8",
  bench: "M3 12h18M7 9v6M17 9v6M10 10h4v4h-4z",
  physiology: "M3 17l5-6 4 4 7-9",
  haemo: "M2 12h4l2-6 4 12 2-6h8",
  mcs: "M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z",
  structural: "M12 3l8 5v8l-8 5-8-5V8z",
  bedside: "M13 2L4 14h7l-1 8 9-12h-7z",
  views: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

interface Card {
  key: string;
  title: string;
  blurb: string;
  icon: string;
  sim?: SimId;
  section?: SectionId;
  /** the competency this simulator trains; its level in force shows on the card */
  epa: EpaId;
}

const CARDS: Card[] = [
  { key: "cathlab", sim: "cathlab", epa: "diag-study", title: "Diagnostic cath lab", icon: ICON.cathlab, blurb: "Engage the left and right coronaries under live fluoroscopy and record standard views." },
  { key: "pci", section: "angio-pci", epa: "pci-simple", title: "PCI in the cath lab", icon: ICON.pci, blurb: "Wire, prepare, stent and optimise a lesion on the beating heart." },
  { key: "angio", section: "angio-real", epa: "diag-report", title: "Real angiograms", icon: ICON.angio, blurb: "De-identified cine runs with reading drills scored against expert labels." },
  { key: "procedure", sim: "procedure", epa: "access-femoral", title: "Full procedure", icon: ICON.procedure, blurb: "Radial or femoral access, wire to the root, engage and inject." },
  { key: "physiology", sim: "physiology", epa: "coronary-physiology", title: "Pressure wire", icon: ICON.physiology, blurb: "FFR, resting ratios, pullbacks, CFR and IMR, with drift and guide wedging." },
  { key: "bench", sim: "pci-bench", epa: "lesion-assess", title: "PCI bench", icon: ICON.bench, blurb: "IVUS and OCT-guided preparation, stenting and optimisation." },
  { key: "haemo", sim: "haemo", epa: "haemo-cath", title: "Haemodynamics lab", icon: ICON.haemo, blurb: "Right and left heart catheterisation on 15 teaching scenarios." },
  { key: "iabp", sim: "iabp", epa: "mcs-support", title: "Balloon pump console", icon: ICON.mcs, blurb: "Choose the support, then time counterpulsation on a live console." },
  { key: "impella", sim: "impella", epa: "mcs-support", title: "Microaxial pump console", icon: ICON.mcs, blurb: "Performance levels, position, suction and RV failure." },
  { key: "ecmo", sim: "ecmo", epa: "mcs-support", title: "VA-ECMO circuit", icon: ICON.mcs, blurb: "ECPR, LV distension and differential hypoxaemia." },
  { key: "tavi", sim: "tavi", epa: "structural-tavi", title: "TAVI lab", icon: ICON.structural, blurb: "CT planning, deployment depth and complications." },
  { key: "teer", sim: "teer", epa: "structural-mitral-laao", title: "TEER lab", icon: ICON.structural, blurb: "Transseptal height, clip alignment and grasping." },
  { key: "laao", sim: "laao", epa: "structural-mitral-laao", title: "LAAO lab", icon: ICON.structural, blurb: "Sizing, compression and release criteria." },
  { key: "pacing", sim: "pacing", epa: "bedside-emergency", title: "Temporary pacing", icon: ICON.bedside, blurb: "Wire position, thresholds and troubleshooting." },
  { key: "pericardio", sim: "pericardiocentesis", epa: "bedside-emergency", title: "Pericardiocentesis", icon: ICON.bedside, blurb: "Echo-guided drainage of tamponade." },
  { key: "views", sim: "views", epa: "diag-study", title: "View trainer", icon: ICON.views, blurb: "Recognise and choose angiographic projections." },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function nextLesson(tracks: Track[], done: Record<string, number>): { t: Track; m: Module; lessonId: string } | null {
  for (const st of [1, 2, 3, 4, 5]) {
    for (const t of tracks) {
      for (const m of t.modules) {
        if (m.stage !== st) continue;
        const l = m.lessons.find((x) => !done[x.id]);
        if (l) return { t, m, lessonId: l.id };
      }
    }
  }
  return null;
}

export default function Dashboard() {
  const profile = useProgressStore((s) => s.profile);
  const openPathway = useUiStore((s) => s.openPathway);
  const openSim = useUiStore((s) => s.openSim);
  const setSection = useUiStore((s) => s.setSection);
  const openCase = useUiStore((s) => s.openCase);
  const openProgress = useUiStore((s) => s.openProgress);
  const content = useContent();

  const today = todayStr();
  const quizDue = dueIds(profile.quizMemory, today).length;
  const readsDue = angioDueKeys(today).length;
  const skillsDue = dueSkills(profile.skillMemory, profile.entrustment, today).length;
  const due = quizDue + readsDue + skillsDue;
  const lessonsRead = Object.keys(profile.lessonsDone).length;
  const answered = Object.keys(profile.quizMemory).length;
  const retained = Object.values(profile.quizMemory).filter((m) => m.reps >= 2).length;
  const logged = profile.logbook.filter((r) => !r.aggregateOf).length;
  const examPasses = profile.logbook.filter((r) => r.mode === "exam" && r.passed).length;
  const levelOf = (e: EpaId) => profile.entrustment[e]?.effective ?? 0;
  const entrusted = EPA_IDS.filter((e) => levelOf(e) >= 3).length;
  const started = EPA_IDS.filter((e) => levelOf(e) >= 1).length;
  // Re-read the drill results whenever the profile changes (a finished drill set logs a row).
  const drillLog = useMemo(() => loadResults(), [profile]);

  const tracks = content?.TRACKS ?? [];
  const totalLessons = tracks.reduce((a, t) => a + t.modules.reduce((b, m) => b + m.lessons.length, 0), 0);
  const totalQ = tracks.reduce((a, t) => a + t.modules.reduce((b, m) => b + m.quiz.length, 0), 0);
  const nl = content ? nextLesson(tracks, profile.lessonsDone) : null;
  const stagePct = (st: number) => {
    const mods = tracks.flatMap((t) => t.modules).filter((m) => m.stage === st);
    if (mods.length === 0) return 0;
    return Math.round(mods.reduce((a, m) => a + moduleMastery3(m, profile, drillLog).overall, 0) / mods.length);
  };
  const currentStage = STAGES.find((s) => stagePct(s.stage) < 70)?.stage ?? 5;
  const featured = content?.PUBLISHED_CASES.filter((c) => !profile.caseRecords[c.id]).slice(0, 3) ?? [];

  const stageInfo = STAGES.find((s) => s.stage === currentStage)!;
  const continueNext = () =>
    nl ? openPathway({ trackId: nl.t.id, moduleId: nl.m.id, lessonId: nl.lessonId, tab: "lessons" }) : setSection("pathway");

  return (
    <div className="min-h-full">
      <header className="flex flex-wrap items-center justify-between gap-3 px-8 pt-6 pb-5 border-b border-line">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold text-ink">{greeting()}</h1>
          <p className="text-sm text-ink-soft mt-1">
            Stage {currentStage} of 5 · {stageInfo.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => setSection("review")} disabled={due === 0}>
            {due > 0 ? `Review ${due} due` : "Nothing due"}
          </button>
          <button className="btn btn-accent" onClick={continueNext}>
            Continue learning
          </button>
        </div>
      </header>

      <div className="max-w-[1160px] px-8 pt-8 pb-12 space-y-8">
        <section className="panel p-7 flex flex-wrap items-center gap-8" aria-label="Your pathway">
          <div className="flex-1 min-w-[320px] space-y-3">
            <div className="text-[13px] font-medium text-accent">Up next</div>
            <h2 className="text-[26px] leading-tight font-semibold text-ink">{nl ? nl.m.title : "Open the Academy"}</h2>
            <p className="text-ink-soft max-w-xl">{nl ? nl.m.summary ?? stageInfo.goal : stageInfo.goal}</p>
            {nl && (
              <div className="flex flex-wrap gap-4 text-[13px] text-ink-faint">
                <span>{nl.m.lessons.length} lessons</span>
                <span>{nl.m.quiz.length} questions</span>
                <span>{nl.t.title}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn btn-accent" onClick={continueNext}>
                {nl ? "Start module" : "Open the Academy"}
              </button>
              <button className="btn" onClick={() => setSection("pathway")}>
                View pathway
              </button>
            </div>
          </div>
          <ol className="flex-1 min-w-[360px] grid grid-cols-5 gap-2" aria-label="Stages">
            {STAGES.map((st) => {
              const pct = stagePct(st.stage);
              const here = st.stage === currentStage;
              return (
                <li key={st.stage}>
                  <button onClick={() => setSection("pathway")} className="w-full text-left space-y-2 group" title={st.goal}>
                    <span className="bar block">
                      <span style={{ width: `${Math.max(here ? 4 : 0, pct)}%` }} className={pct >= 80 ? "!bg-good" : ""} />
                    </span>
                    <span className={`block text-xs ${here ? "text-ink" : "text-ink-soft"} group-hover:text-ink`}>
                      {st.stage} {st.name.split(" ")[0]}
                    </span>
                    <span className="block text-xs text-ink-faint font-mono">{pct}%</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Progress">
          <Stat label="Lessons read" value={`${lessonsRead}`} of={totalLessons} />
          <Stat label="Questions answered" value={`${answered}`} of={totalQ} />
          <Stat label="Due for review" value={`${due}`} tone={due > 0 ? "warn" : undefined} sub={`${quizDue} questions · ${readsDue} reads · ${skillsDue} skills`} />
          <Stat label="Logbook" value={`${logged}`} sub={`${examPasses} exam passes · ${entrusted} activities at level III+`} />
        </section>

        <section aria-labelledby="sims" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 id="sims" className="text-[17px] font-semibold text-ink">
              Simulators
            </h2>
            <span className="text-[13px] text-ink-faint">Entrustment level in force for the competency each one trains</span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {CARDS.map((c) => {
              const lv = levelOf(c.epa);
              return (
                <button
                  key={c.key}
                  onClick={() => (c.sim ? openSim(c.sim) : setSection(c.section!))}
                  className="panel p-5 text-left flex flex-col gap-2.5 hover:border-line-strong hover:bg-base-600 transition-colors"
                >
                  <span className="flex items-center justify-between">
                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-accent-tint" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7FAEFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </span>
                    {lv > 0 && (
                      <span className="chip font-mono" title={LEVEL_LABEL[lv].detail}>
                        level {LEVEL_LABEL[lv].roman}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-ink">{c.title}</span>
                  <span className="text-[13px] text-ink-soft leading-snug">{c.blurb}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="panel lg:col-span-2">
            <div className="panel-head">Tracks</div>
            <div className="p-3">
              {!content ? (
                <div className="text-sm text-ink-faint p-2">Loading…</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-1">
                  {tracks.map((t) => (
                    <button key={t.id} onClick={() => openPathway({ trackId: t.id })} className="flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-base-600 text-left">
                      <Ring pct={trackMastery3(t.modules, profile, drillLog)} size={34} stroke={3.5} />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink truncate">{t.title}</span>
                        <span className="block text-xs text-ink-faint">Stage {t.stage}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="panel flex flex-col">
            <div className="panel-head">Published cases to try</div>
            <div className="p-3 flex-1">
              {featured.length === 0 ? (
                <div className="text-sm text-ink-faint p-2">{content ? "You have tried every published case." : "Loading…"}</div>
              ) : (
                <div className="space-y-1">
                  {featured.map((c) => (
                    <button key={c.id} onClick={() => openCase(c.id)} className="block w-full text-left rounded-md px-2.5 py-2 hover:bg-base-600">
                      <span className="block text-[13px] text-ink">{c.title}</span>
                      <span className="block text-xs text-ink-faint line-clamp-1">{c.provenance.kind === "published" ? c.provenance.citation : ""}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="border-t border-line px-4 py-3 text-xs text-ink-faint text-left hover:text-ink" onClick={() => openProgress("competencies")}>
              Simulator entrustment: {started} of {EPA_IDS.length} activities started, {entrusted} at level III or above · {logged} sessions logged
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, of, sub, tone }: { label: string; value: string; of?: number; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div className="panel px-5 py-4">
      <div className="text-[13px] text-ink-soft">{label}</div>
      <div className={`metric text-[26px] font-medium mt-1.5 ${tone === "warn" ? "text-warn" : tone === "good" ? "text-good" : "text-ink"}`}>
        {value}
        {of ? <span className="text-sm text-ink-faint"> / {of}</span> : null}
      </div>
      {sub && <div className="text-xs text-ink-faint mt-1">{sub}</div>}
    </div>
  );
}
