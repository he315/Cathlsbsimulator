import { useCallback, useEffect, useRef, useState } from "react";
import { useUiStore } from "../../state/useUiStore";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { TAVI_SCENARIOS } from "../../simulation/tavi";
import { TEER_SCENARIOS } from "../../simulation/teer";
import { TS_PRESETS } from "../../simulation/transseptal";
import { LAAO_SCENARIOS } from "../../simulation/laao";
import SectionShell from "../SectionShell";
import TaviLab from "../structural/TaviLab";
import TeerLab from "../structural/TeerLab";
import LaaoLab from "../structural/LaaoLab";

// Structural heart lab: TAVI, mitral TEER and LAAO as stepwise procedures
// (plan → access → position → deploy → assess → decide) on original
// schematics, with deterministic qualitative risk models and a debrief.
//
// A lesson or case opens a procedure at a scenario through the launch store
// (structural-tips-and-tavi-course). The core scenarios are declared under the
// "tavi" sim (src/content/lab/presets/structural/core.launch.ts), so a launch for
// any of the three sims is resolved to the procedure that owns its scenario.
// The transseptal drills (ts-*, src/content/lab/presets/structural/transseptal.launch.ts,
// TS_PRESETS of src/simulation/transseptal.ts) belong to the TEER procedure, which opens them
// at the transseptal step (repair-structural-bedside-launch).

type Tab = "tavi" | "teer" | "laao";

const TABS: { id: Tab; label: string; subtitle: string }[] = [
  {
    id: "tavi",
    label: "TAVI",
    subtitle: "Read the planning CT, choose the valve and route, land it at the right depth and judge the result.",
  },
  {
    id: "teer",
    label: "TEER",
    subtitle: "Puncture the septum, steer to the jet, align the arms with the coaptation line and weigh MR against gradient.",
  },
  {
    id: "laao",
    label: "LAAO",
    subtitle: "Measure at four angles, size to the largest, deploy and release only when position, anchor, size and seal pass.",
  },
];

/** A launch as a procedure receives it: the scenario, the step to open at and the mode; seq tells a new launch from one already applied. */
export interface StructuralLaunch {
  scenario: string;
  /** the start (a step id of the procedure), when the launch names one */
  start: string | null;
  mode: LaunchMode | null;
  seq: number;
}

/**
 * The procedure that owns a launch's scenario, whichever of the three sims the link names (a
 * transseptal drill, ts-*, is owned by TEER); a launch without a known scenario opens the named
 * sim's procedure as it is. The start may be given as `start` or `step`.
 */
export function resolveStructuralLaunch(sim: Tab, p: LaunchParams): { tab: Tab; scenario: string | null; start: string | null; mode: LaunchMode | null } {
  const id = p.scenario ?? p.preset ?? null;
  const owner: Tab | null = !id
    ? null
    : TAVI_SCENARIOS.some((s) => s.id === id)
      ? "tavi"
      : TEER_SCENARIOS.some((s) => s.id === id) || TS_PRESETS.some((t) => t.id === id)
        ? "teer"
        : LAAO_SCENARIOS.some((s) => s.id === id)
          ? "laao"
          : null;
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { tab: owner ?? sim, scenario: owner ? id : null, start: p.start ?? p.step ?? null, mode };
}

function initialTab(simTab: string | null): Tab {
  return simTab === "teer" || simTab === "laao" || simTab === "tavi" ? simTab : "tavi";
}

export default function StructuralLab() {
  const simTab = useUiStore((s) => s.simTab);
  const [tab, setTab] = useState<Tab>(() => initialTab(simTab));
  const [launch, setLaunch] = useState<Partial<Record<Tab, StructuralLaunch>>>({});
  // The tab a launch resolved to, with the sim the link named: openSim sets the launch before it sets
  // simTab, so the simTab effect below must not undo a launch whose scenario belongs to another tab.
  const launched = useRef<{ sim: Tab; tab: Tab } | null>(null);
  // Follow deep links from lessons ("open the TEER lab") while already mounted.
  useEffect(() => {
    if (simTab === "tavi" || simTab === "teer" || simTab === "laao") setTab(launched.current?.sim === simTab ? launched.current.tab : simTab);
    launched.current = null;
  }, [simTab]);

  const seq = useRef(0);
  const onLaunch = useCallback((sim: Tab, p: LaunchParams) => {
    const r = resolveStructuralLaunch(sim, p);
    launched.current = { sim, tab: r.tab };
    setTab(r.tab);
    if (!r.scenario) return;
    const n = ++seq.current;
    const l: StructuralLaunch = { scenario: r.scenario, start: r.start, mode: r.mode, seq: n };
    setLaunch((prev) => ({ ...prev, [r.tab]: l }));
  }, []);
  // a procedure applies its launch once and hands it back, so a later visit to the tab starts afresh
  const taken = useCallback((t: Tab) => setLaunch((l) => {
    const next = { ...l };
    delete next[t];
    return next;
  }), []);
  useLabLaunch("tavi", (p) => onLaunch("tavi", p));
  useLabLaunch("teer", (p) => onLaunch("teer", p));
  useLabLaunch("laao", (p) => onLaunch("laao", p));

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <SectionShell
      title="Structural heart lab"
      subtitle={active.subtitle}
      actions={
        <div className="seg">
          {TABS.map((t) => (
            <button key={t.id} className={`seg-btn ${tab === t.id ? "seg-btn-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {tab === "tavi" && <TaviLab launch={launch.tavi ?? null} onLaunchTaken={() => taken("tavi")} />}
      {tab === "teer" && <TeerLab launch={launch.teer ?? null} onLaunchTaken={() => taken("teer")} />}
      {tab === "laao" && <LaaoLab launch={launch.laao ?? null} onLaunchTaken={() => taken("laao")} />}
    </SectionShell>
  );
}
