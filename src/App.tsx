import { Suspense, lazy, useEffect, type ComponentType } from "react";
import type { SectionId } from "./types";
import { useUiStore } from "./state/useUiStore";
import { useProgressStore } from "./state/useProgressStore";
import { SHORT_DISCLAIMER } from "./data/teachingText";
import { dueIds } from "./simulation/srs";
import { todayStr } from "./utils/storage";
import { angioDueKeys } from "./ui/angio/library";
import { dueSkills } from "./progress/schedule";

// Every section is its own chunk so the first load stays fast.
const SECTIONS: Record<SectionId, ComponentType> = {
  dashboard: lazy(() => import("./ui/sections/Dashboard")),
  pathway: lazy(() => import("./ui/sections/Pathway")),
  "case-studies": lazy(() => import("./ui/sections/CaseStudies")),
  "angio-real": lazy(() => import("./ui/sections/RealAngiograms")),
  "angio-pci": lazy(() => import("./ui/sections/AngioPci")),
  review: lazy(() => import("./ui/sections/Review")),
  references: lazy(() => import("./ui/sections/References")),
  glossary: lazy(() => import("./ui/sections/Glossary")),
  calculators: lazy(() => import("./ui/sections/Calculators")),
  haemo: lazy(() => import("./ui/sections/HaemoLab")),
  "pci-bench": lazy(() => import("./ui/sections/PciBench")),
  physiology: lazy(() => import("./ui/sections/PhysiologyLab")),
  mcs: lazy(() => import("./ui/sections/McsLab")),
  "structural-lab": lazy(() => import("./ui/sections/StructuralLab")),
  bedside: lazy(() => import("./ui/sections/BedsideLab")),
  daily: lazy(() => import("./ui/sections/DailyPlan")),
  curriculum: lazy(() => import("./ui/sections/Curriculum")),
  free: lazy(() => import("./ui/sections/FreeLab")),
  procedure: lazy(() => import("./ui/sections/ProcedureLab")),
  challenge: lazy(() => import("./ui/sections/Challenge")),
  anatomy: lazy(() => import("./ui/sections/AnatomyLab")),
  "catheter-lab": lazy(() => import("./ui/sections/CatheterLab")),
  "view-trainer": lazy(() => import("./ui/sections/ViewTrainer")),
  "pressure-trainer": lazy(() => import("./ui/sections/PressureTrainer")),
  atlas: lazy(() => import("./ui/sections/Atlas")),
  cases: lazy(() => import("./ui/sections/CaseLibrary")),
  pathology: lazy(() => import("./ui/sections/Pathology")),
  mistakes: lazy(() => import("./ui/sections/MistakeReview")),
  analytics: lazy(() => import("./ui/sections/Analytics")),
  settings: lazy(() => import("./ui/sections/Settings")),
};

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Learn",
    items: [
      { id: "dashboard", label: "Home", icon: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
      { id: "pathway", label: "Academy", icon: "M2 7l10-4 10 4-10 4L2 7zm4 2.6V15c0 1.7 2.7 3 6 3s6-1.3 6-3V9.6" },
      { id: "review", label: "Review", icon: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" },
      { id: "case-studies", label: "Case studies", icon: "M4 5h16v14H4zM8 9h8M8 13h5" },
      { id: "angio-real", label: "Real angiograms", icon: "M4 4h16v16H4zM7 15c2-5 4-7 10-8M10 12l2 4" },
    ],
  },
  {
    title: "Coronary simulators",
    items: [
      { id: "procedure", label: "Full procedure", icon: "M4 20c4-8 8-12 16-16M14 4h6v6" },
      { id: "free", label: "Cath lab", icon: "M12 3v18M3 12h18M6 6l12 12" },
      { id: "angio-pci", label: "PCI in the cath lab", icon: "M4 20c3-6 6-9 10-11M14 9l3-3M9 14h6v3H9z" },
      { id: "pci-bench", label: "PCI bench (IVUS/OCT)", icon: "M3 12h18M7 9v6M17 9v6M10 10h4v4h-4z" },
      { id: "physiology", label: "Pressure wire", icon: "M3 17l5-6 4 4 7-9" },
      { id: "view-trainer", label: "View trainer", icon: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
    ],
  },
  {
    title: "Haemodynamics and devices",
    items: [
      { id: "haemo", label: "Haemodynamics lab", icon: "M2 12h4l2-6 4 12 2-6h8" },
      { id: "mcs", label: "Mechanical support", icon: "M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" },
      { id: "structural-lab", label: "TAVI · TEER · LAAO", icon: "M12 3l8 5v8l-8 5-8-5V8z" },
      { id: "bedside", label: "Pacing · pericardium", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "calculators", label: "Calculators", icon: "M6 3h12v18H6zM9 7h6M9 12h1M14 12h1M9 16h1M14 16h1" },
      { id: "atlas", label: "Anatomy atlas", icon: "M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2z" },
      { id: "glossary", label: "Glossary", icon: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" },
      { id: "references", label: "References", icon: "M7 4h10v16l-5-3-5 3z" },
    ],
  },
  {
    title: "Skills",
    items: [
      { id: "anatomy", label: "Anatomy lab", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
      { id: "catheter-lab", label: "Catheters and wires", icon: "M4 20c0-8 6-8 6-14a3 3 0 0 1 6 0" },
      { id: "pressure-trainer", label: "Pressure safety", icon: "M3 12h4l3-8 4 16 3-8h4" },
      { id: "pathology", label: "Pathology", icon: "M4 12h16M12 4v16" },
      { id: "challenge", label: "Assessment", icon: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" },
      { id: "cases", label: "Angio case library", icon: "M4 4h16v16H4zM4 9h16" },
    ],
  },
  {
    title: "Progress",
    items: [
      { id: "daily", label: "Daily plan", icon: "M4 5h16v15H4zM4 9h16M9 3v4M15 3v4" },
      { id: "curriculum", label: "Angio curriculum", icon: "M5 4h14v16H5zM9 8h6M9 12h6" },
      { id: "analytics", label: "Competencies and logbook", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
      { id: "mistakes", label: "Mistake review", icon: "M12 8v5M12 16h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
      { id: "settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .2-1.3-1.3.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L6 7.2 4 7 3 10l2 1v2l-2 1 1 3 2-.2 1.3 1.3-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.3 2 .2 1-3-2-1z" },
    ],
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function App() {
  const section = useUiStore((s) => s.section);
  const setSection = useUiStore((s) => s.setSection);
  const hydrate = useProgressStore((s) => s.hydrate);
  const hydrated = useProgressStore((s) => s.hydrated);
  const profile = useProgressStore((s) => s.profile);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const Section = SECTIONS[section];
  const today = todayStr();
  // Quiz items, mentor skill cards, real-angiogram reads and procedural skills share the Review badge.
  const due = dueIds(profile.quizMemory, today).length + angioDueKeys(today).length + dueSkills(profile.skillMemory, profile.entrustment, today).length;
  const lessonsRead = Object.keys(profile.lessonsDone).length;
  const logged = profile.logbook.filter((r) => !r.aggregateOf).length;

  return (
    <div className="h-screen flex bg-base-900 text-ink">
      <aside className="w-[248px] shrink-0 border-r border-line bg-base-800 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-tint shrink-0" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7FAEFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v6" />
              <path d="M12 9c-4 2-6 6-6 12" />
              <path d="M12 9c4 2 6 6 6 12" />
              <path d="M12 9v12" />
            </svg>
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-ink">CathMaster</div>
            <div className="text-xs text-ink-faint mt-0.5">Interventional cardiology</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1 space-y-4" aria-label="Main">
          {NAV.map((g) => (
            <div key={g.title}>
              <div className="px-2.5 pb-1 text-xs text-ink-faint">{g.title}</div>
              <div className="space-y-px">
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSection(it.id)}
                    aria-current={section === it.id ? "page" : undefined}
                    className={`nav-item w-full ${section === it.id ? "nav-item-active" : ""}`}
                  >
                    <Icon d={it.icon} />
                    <span className="truncate flex-1 text-left">{it.label}</span>
                    {it.id === "review" && due > 0 && (
                      <span className="rounded-full bg-[#2a2213] text-warn text-xs px-1.5 font-mono leading-5">{due}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-4 py-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-mono text-sm text-ink">{lessonsRead}</div>
              <div className="text-xs text-ink-faint">lessons</div>
            </div>
            <div>
              <div className="font-mono text-sm text-ink">{Object.keys(profile.quizMemory).length}</div>
              <div className="text-xs text-ink-faint">questions</div>
            </div>
            <div>
              <div className="font-mono text-sm text-ink">{logged}</div>
              <div className="text-xs text-ink-faint">logged</div>
            </div>
          </div>
          <p className="text-xs leading-snug text-ink-faint">{SHORT_DISCLAIMER}</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
        {hydrated ? (
          <Suspense fallback={<div className="p-8 text-ink-faint">Loading…</div>}>
            <Section />
          </Suspense>
        ) : (
          <div className="p-8 text-ink-faint">Loading…</div>
        )}
      </main>
    </div>
  );
}
