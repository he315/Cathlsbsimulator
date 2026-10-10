import { useEffect, useRef, useState } from "react";
import SectionShell from "../SectionShell";
import { useUiStore } from "../../state/useUiStore";
import { useLabLaunch, useLabLaunchStore } from "../../state/useLabLaunchStore";
import { useLabHandover, type LabTransfer } from "../../state/useLabHandoverStore";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import PacingLab from "../bedside/PacingLab";
import PericardioLab, { launchEvents, pericScenarioFor, type PericLaunch } from "../bedside/PericardioLab";
import type { BedsideTab } from "../lab/bedsideTips";

// Bedside procedures lab: temporary pacing and pericardiocentesis.
//
// The pacing tab (PacingLab) runs the bedside and in-lab bradycardia scenarios:
// initial management, transcutaneous bridge, venous access, lead position,
// threshold, sensing and troubleshooting. Its links (useLabLaunch "pacing":
// scenario, variant, mode) are taken by PacingLab itself; this lab only watches
// for them (watchPacingLinks) and switches to the pacing tab, so a pacing link
// that arrives while the pericardiocentesis tab is showing opens at once, even
// when simTab already reads "pacing" and so does not change.
//
// The pericardiocentesis tab takes its links (useLabLaunch, scenarios of
// src/content/lab/presets/bedside/pericardio.launch.ts) and the patients other
// labs send it (useLabHandover: a perforation from the PCI lab, continued on
// its engine). Both are taken here, whichever tab is showing, so that the tab
// opens on them.

type Tab = BedsideTab;

const TABS: { id: Tab; label: string }[] = [
  { id: "pacing", label: "Temporary pacing" },
  { id: "pericardiocentesis", label: "Pericardiocentesis" },
];

/** A pericardiocentesis link's scenario, mode and events (seq tells a new link from one already applied). */
export function resolvePericLaunch(p: LaunchParams, seq: number): PericLaunch {
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { scenario: pericScenarioFor(p.scenario ?? p.preset), mode, events: launchEvents(p.events), seq };
}

/**
 * Calls `onLink` when a pacing link is pending at the call and whenever a new one arrives, without
 * taking it: PacingLab's useLabLaunch("pacing") takes it once the pacing tab is mounted. Returns the
 * unsubscribe function.
 */
export function watchPacingLinks(onLink: () => void): () => void {
  if (useLabLaunchStore.getState().pending.pacing) onLink();
  return useLabLaunchStore.subscribe((st, prev) => {
    if (st.pending.pacing && st.pending.pacing !== prev.pending.pacing) onLink();
  });
}

export default function BedsideLab() {
  const simTab = useUiStore((s) => s.simTab);
  const [tab, setTab] = useState<Tab>(simTab === "pericardiocentesis" ? "pericardiocentesis" : "pacing");
  const [launch, setLaunch] = useState<PericLaunch | null>(null);
  const [transfer, setTransfer] = useState<LabTransfer | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (simTab === "pacing" || simTab === "pericardiocentesis") setTab(simTab);
  }, [simTab]);

  // a pacing link switches to the pacing tab whichever tab is showing; PacingLab then takes it
  useEffect(() => watchPacingLinks(() => setTab("pacing")), []);

  const transferRef = useRef<LabTransfer | null>(null);
  transferRef.current = transfer;

  useLabLaunch("pericardiocentesis", (p) => {
    const l = resolvePericLaunch(p, ++seq.current);
    setTab("pericardiocentesis");
    // a sender puts its patient and then opens this lab with a link: that link belongs to the
    // transfer, so it does not replace it; any other link is newer and wins
    if (transferRef.current && (l.scenario === null || l.scenario === "from-pci-perforation")) return;
    setLaunch(l);
    setTransfer(null);
  });
  useLabHandover("pericardiocentesis", (t) => {
    transferRef.current = t;
    setTransfer(t);
    setLaunch(null);
    setTab("pericardiocentesis");
  });

  return (
    <SectionShell
      title="Bedside procedures lab"
      subtitle={
        tab === "pacing"
          ? "Bradycardia at the bedside and in the lab: initial management, transcutaneous bridge, venous access, lead position, threshold, sensing and troubleshooting"
          : "Tamponade recognition, echo-guided needle planning, confirmation and drainage"
      }
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
      {tab === "pacing" ? <PacingLab /> : <PericardioLab launch={launch} transfer={transfer} />}
      <p className="mt-4 text-[12px] text-ink-faint">
        Educational simulation only, not a medical device. Model values are illustrative; follow local protocols, device instructions and senior supervision.
      </p>
    </SectionShell>
  );
}
