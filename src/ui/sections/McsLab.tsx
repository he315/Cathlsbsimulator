// Mechanical circulatory support lab: the balloon pump timing console, the microaxial flow pump
// and VA-ECMO, running on a lumped model of the circulation, each opened by the device-choice
// step (mcs-console-split-select-and-tips). The consoles live in src/ui/mcs/; this file hosts the
// tabs, the scenario chosen in each and the launches from lessons and cases (useLabLaunch for the
// iabp, impella and ecmo sims). Every console runs its own session (useLabRun): mode, tips under
// the run's policy, criteria-based scoring and window.__lab.mcs in DEV builds.
import { useCallback, useState } from "react";
import { useUiStore } from "../../state/useUiStore";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import SectionShell from "../SectionShell";
import { SELECT_PRESETS, SELECT_PRESET_BY_ID } from "../../simulation/mcs/deviceChoice";
import { MCS_CONSOLES, type McsConsole } from "../lab/mcsTips";
import { CONSOLE_LABEL, type PickItem } from "../mcs/shared";
import IabpConsole, { IABP_CASES } from "../mcs/IabpConsole";
import ImpellaConsole, { IMP_CASES } from "../mcs/ImpellaConsole";
import EcmoConsole, { ECMO_CASES } from "../mcs/EcmoConsole";
import DeviceChoice from "../mcs/DeviceChoice";

/** Each console's own cases (the device-choice presets open every console). */
export const CONSOLE_CASES: Record<McsConsole, readonly PickItem[]> = { iabp: IABP_CASES, impella: IMP_CASES, ecmo: ECMO_CASES };

/** The scenario a console opens on: the device-choice step comes first. */
export const DEFAULT_SCENARIO = SELECT_PRESETS[0].id;

const isConsole = (x: unknown): x is McsConsole => (MCS_CONSOLES as readonly unknown[]).includes(x);

/**
 * Where a launch opens: a device-choice preset on the console the launch names; a console case on
 * the console that owns it, whichever of the three sims named it (the presets file declares them
 * all under one sim, src/content/lab/presets/mcs/core.launch.ts). Null for an unknown scenario.
 */
export function resolveMcsLaunch(sim: McsConsole, p: LaunchParams): { tab: McsConsole; scenario: string | null; mode: LaunchMode | null } | null {
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  const id = p.scenario ?? p.preset;
  if (!id) return { tab: sim, scenario: null, mode };
  if (SELECT_PRESET_BY_ID[id]) return { tab: sim, scenario: id, mode };
  const owner = MCS_CONSOLES.find((c) => CONSOLE_CASES[c].some((k) => k.id === id));
  return owner ? { tab: owner, scenario: id, mode } : null;
}

export default function McsLab() {
  const [tab, setTab] = useState<McsConsole>(() => {
    const simTab = useUiStore.getState().simTab;
    return isConsole(simTab) ? simTab : "iabp";
  });
  const [scen, setScen] = useState<Record<McsConsole, string>>({ iabp: DEFAULT_SCENARIO, impella: DEFAULT_SCENARIO, ecmo: DEFAULT_SCENARIO });
  const [launchMode, setLaunchMode] = useState<LaunchMode | null>(null);
  const [runKey, setRunKey] = useState(0);

  const onLaunch = useCallback((sim: McsConsole, p: LaunchParams) => {
    const l = resolveMcsLaunch(sim, p);
    if (!l) {
      if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) console.warn(`mcs launch: unknown scenario "${p.scenario ?? p.preset}"`);
      return;
    }
    const scenario = l.scenario;
    setTab(l.tab);
    if (scenario) setScen((s) => ({ ...s, [l.tab]: scenario }));
    setLaunchMode(l.mode);
    setRunKey((k) => k + 1);
  }, []);
  useLabLaunch("iabp", (p) => onLaunch("iabp", p));
  useLabLaunch("impella", (p) => onLaunch("impella", p));
  useLabLaunch("ecmo", (p) => onLaunch("ecmo", p));

  const onScenario = (id: string) => {
    setScen((s) => ({ ...s, [tab]: id }));
    setLaunchMode(null);
    setRunKey((k) => k + 1);
  };
  const pickTab = (t: McsConsole) => {
    setTab(t);
    setLaunchMode(null);
  };

  const scenario = scen[tab];
  const preset = SELECT_PRESET_BY_ID[scenario];
  const key = `${tab}:${scenario}:${runKey}`;
  const onRestart = () => setRunKey((k) => k + 1);
  const props = { scenarioId: scenario, onScenario, launchMode, runKey, onRestart };

  return (
    <SectionShell
      title="Mechanical circulatory support"
      subtitle="Choose the support, then run a balloon pump, a microaxial flow pump or VA-ECMO on a physiological model of the circulation"
      actions={
        <div className="seg" role="tablist" aria-label="Console">
          {MCS_CONSOLES.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`seg-btn !px-3 !py-1 ${tab === t ? "seg-btn-active" : ""}`} onClick={() => pickTab(t)}>
              {CONSOLE_LABEL[t]}
            </button>
          ))}
        </div>
      }
    >
      {preset ? (
        <DeviceChoice key={key} consoleId={tab} profile={preset} cases={CONSOLE_CASES[tab]} onScenario={onScenario} launchMode={launchMode} runKey={runKey} />
      ) : tab === "iabp" ? (
        <IabpConsole key={key} {...props} />
      ) : tab === "impella" ? (
        <ImpellaConsole key={key} {...props} />
      ) : (
        <EcmoConsole key={key} {...props} />
      )}
      <p className="text-[12px] text-ink-faint mt-6 max-w-4xl">
        Teaching model. Device behaviour is simplified (pump curves, position effects, oxygenation and mixing) to show the direction and interaction of effects. It is not a
        substitute for the device instructions for use or local protocols.
      </p>
    </SectionShell>
  );
}
