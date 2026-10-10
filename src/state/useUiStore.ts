import { create } from "zustand";
import type { AnatomyCase, SectionId, SimMode } from "../types";
import type { AngioSimId, LaunchParams, SimId, TrackId } from "../content/schema";
import type { EpaId } from "../progress/types";
import { useSimulatorStore } from "./useSimulatorStore";
import { useLabLaunchStore } from "./useLabLaunchStore";
import { loadJSON, saveJSON } from "../utils/storage";
import { requestDrill } from "../ui/angio/library";

/** A simulator destination: the SimIds plus the real-angiogram and PCI-lab targets (S13). */
export type SimTarget = SimId | AngioSimId;

/** Where each simulator lives in the app (some share a tabbed section). */
export const SIM_SECTION: Record<SimTarget, { section: SectionId; label: string }> = {
  cathlab: { section: "free", label: "Coronary cath lab" },
  procedure: { section: "procedure", label: "Full procedure (access → wire)" },
  views: { section: "view-trainer", label: "View trainer" },
  haemo: { section: "haemo", label: "Haemodynamics lab" },
  "pci-bench": { section: "pci-bench", label: "PCI bench" },
  physiology: { section: "physiology", label: "Pressure wire lab" },
  iabp: { section: "mcs", label: "IABP console" },
  impella: { section: "mcs", label: "Impella console" },
  ecmo: { section: "mcs", label: "VA-ECMO circuit" },
  tavi: { section: "structural-lab", label: "TAVI lab" },
  teer: { section: "structural-lab", label: "TEER lab" },
  laao: { section: "structural-lab", label: "LAAO lab" },
  pacing: { section: "bedside", label: "Temporary pacing" },
  pericardiocentesis: { section: "bedside", label: "Pericardiocentesis" },
  pressure: { section: "pressure-trainer", label: "Pressure recognition drill" },
  "angio-real": { section: "angio-real", label: "Real angiograms" },
  "angio-pci": { section: "angio-pci", label: "PCI in the cath lab" },
};

export type ProgressTab = "competencies" | "logbook" | "trends";

export interface PathwayTarget {
  trackId?: TrackId;
  moduleId?: string;
  lessonId?: string;
  tab?: "lessons" | "quiz" | "cases";
}

interface UiStore {
  section: SectionId;
  sidebarOpen: boolean;
  /** deep-link target inside the Pathway section */
  pathway: PathwayTarget;
  /** which tab a multi-sim section should open on */
  simTab: SimTarget | null;
  /** case study to open in the Case Studies section */
  caseId: string | null;
  /** tab of the Competencies and logbook section, and the EPA it should open on */
  progressTab: ProgressTab;
  focusEpa: EpaId | null;
  setSection: (s: SectionId) => void;
  toggleSidebar: () => void;
  /** Load a case into the simulator and jump to the given lab section. */
  launch: (c: AnatomyCase, mode: SimMode, section?: SectionId) => void;
  openPathway: (t: PathwayTarget) => void;
  /**
   * Open a simulator. `params` (LaunchParams: scenario, variant, seed, start, mode, technique,
   * workspace, step, preset, events) go to useLabLaunchStore, which the lab takes once; they are
   * never remembered in NavMemory. Opening without params clears any request still pending for
   * that lab; a new request replaces any other; and a request is dropped once the section changes
   * to one that is not its lab's (see the rules in useLabLaunchStore). "angio-real" with a `drill`
   * param keeps its own pending drill (requestDrill).
   */
  openSim: (sim: SimTarget, params?: LaunchParams) => void;
  openCase: (caseId: string) => void;
  openProgress: (tab: ProgressTab, epa?: EpaId | null) => void;
}

/** Where the learner was, restored on reload. Pending lab launches are deliberately not part of it. */
interface NavMemory {
  section: SectionId;
  pathway: PathwayTarget;
  simTab: SimTarget | null;
  caseId: string | null;
  progressTab?: ProgressTab;
  focusEpa?: EpaId | null;
}
const NAV_KEY = "nav";
const remembered = loadJSON<Partial<NavMemory>>(NAV_KEY, {});

export const useUiStore = create<UiStore>((set) => ({
  section: remembered.section ?? "dashboard",
  sidebarOpen: true,
  pathway: remembered.pathway ?? {},
  simTab: remembered.simTab ?? null,
  caseId: remembered.caseId ?? null,
  progressTab: remembered.progressTab ?? "competencies",
  focusEpa: remembered.focusEpa ?? null,
  setSection: (s) => set({ section: s }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
  launch: (c, mode, section = "free") => {
    useSimulatorStore.getState().loadCase(c, mode);
    set({ section });
  },
  openPathway: (t) => set({ section: "pathway", pathway: t }),
  openSim: (sim, params) => {
    if (sim === "angio-real" && params?.drill) {
      const { drill, ...rest } = params;
      requestDrill(drill, rest);
      useLabLaunchStore.getState().request(sim);
    } else useLabLaunchStore.getState().request(sim, params);
    set({ section: SIM_SECTION[sim].section, simTab: sim });
  },
  openCase: (caseId) => set({ section: "case-studies", caseId }),
  openProgress: (tab, epa = null) => set({ section: "analytics", progressTab: tab, focusEpa: epa }),
}));

// Lifetime rule 3 (useLabLaunchStore): leaving a lab's section by any route drops the request
// pending for that lab, so it cannot fire on a later, unrelated visit.
useUiStore.subscribe((s, prev) => {
  if (s.section === prev.section) return;
  useLabLaunchStore.getState().dropWhere((sim) => SIM_SECTION[sim].section !== s.section);
});

useUiStore.subscribe((s) => {
  const mem: NavMemory = { section: s.section, pathway: s.pathway, simTab: s.simTab, caseId: s.caseId, progressTab: s.progressTab, focusEpa: s.focusEpa };
  saveJSON(NAV_KEY, mem);
});
