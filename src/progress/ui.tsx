// Small shared pieces for the progression screens (Clinical Graphite classes only).
import { resolveCase } from "../simulation/caseGenerator";
import { ladderFor, READING_LADDERS } from "../content/mentor/catalogue";
import { useUiStore, type SimTarget } from "../state/useUiStore";
import { useProgressStore } from "../state/useProgressStore";
import { labPolicy, LEVEL_LABEL, roleFor } from "./competency";
import { nextPracticeCase, nextRung } from "./schedule";
import type { EntrustLevel, EntrustmentRecord, EpaId, LogbookEntry } from "./types";

/** The lab each non-diagnostic EPA practises in. */
export const EPA_SIM: Partial<Record<EpaId, SimTarget>> = {
  "haemo-cath": "haemo",
  "coronary-physiology": "physiology",
  "mcs-support": "iabp",
  "structural-tavi": "tavi",
  "structural-mitral-laao": "teer",
  "bedside-emergency": "pacing",
  "complication-bailout": "angio-pci",
  "pci-simple": "angio-pci",
  "pci-calcium": "angio-pci",
  "pci-stemi": "angio-pci",
  "pci-cto": "angio-pci",
};

/** How a practice session on this EPA is run and logged at the level in force, in words. */
export function policyText(epa: EpaId): string {
  const { mode } = labPolicy(useProgressStore.getState().profile.entrustment[epa]);
  return `${mode} practice, ${roleFor(mode)}`;
}

/**
 * Open the next practice step on an EPA's ladder, under the policy of the level in
 * force (labPolicy: guided as assistant up to level II, supervised at III, independent
 * from IV). Returns a short description of what opened.
 */
export function startPractice(epa: EpaId, logbook: LogbookEntry[]): string {
  const ui = useUiStore.getState();
  const l = ladderFor(epa);
  if (l.kind === "diagnostic") {
    const id = nextPracticeCase(logbook, epa, String(Date.now()));
    const c = id ? resolveCase(id) : undefined;
    if (c) {
      const how = policyText(epa);
      useProgressStore.getState().setActivePolicy(epa, c.id);
      ui.launch(c, "case");
      return `Rung ${nextRung(logbook, epa)}: ${c.name} (${how})`;
    }
  }
  const how = policyText(epa);
  useProgressStore.getState().setActivePolicy(epa);
  if (l.kind === "reading") {
    const r = READING_LADDERS[epa]!.find((x) => x.rung === nextRung(logbook, epa)) ?? READING_LADDERS[epa]![0];
    if (r.kind === "drill") ui.openSim("angio-real", { drill: r.drill });
    else ui.openSim(r.drill as SimTarget);
    return `Rung ${r.rung}: ${r.label} (${how})`;
  }
  const sim = EPA_SIM[epa];
  if (sim) ui.openSim(sim);
  return `Opened the lab (${how})`;
}

export function LevelBadge({ rec, size = "md" }: { rec?: EntrustmentRecord; size?: "sm" | "md" }) {
  const lv = (rec?.effective ?? 0) as EntrustLevel;
  const tone = rec?.expired ? "border-warn/60 text-warn" : lv >= 4 ? "border-good/60 text-good" : lv >= 3 ? "border-accent/60 text-accent" : lv >= 1 ? "border-line-strong text-ink-soft" : "border-line text-ink-faint";
  const dim = size === "sm" ? "w-8 h-6 text-[12px]" : "w-11 h-8 text-sm";
  return (
    <span className={`inline-grid place-items-center rounded-md border font-mono ${dim} ${tone}`} title={`${LEVEL_LABEL[lv].short}: ${LEVEL_LABEL[lv].detail}${rec?.expired ? " (expired: refresher due)" : ""}`}>
      {LEVEL_LABEL[lv].roman}
    </span>
  );
}

/** Five pips for levels I..V: filled = awarded and in force, outlined amber = awarded but expired. */
export function LevelPips({ rec }: { rec?: EntrustmentRecord }) {
  const aw = rec?.awarded ?? 0;
  const ef = rec?.effective ?? 0;
  return (
    <span className="inline-flex gap-1" aria-label={`Level ${LEVEL_LABEL[ef as EntrustLevel].roman}`}>
      {[1, 2, 3, 4, 5].map((L) => (
        <span key={L} className={`h-1.5 w-5 rounded-full ${L <= ef ? (L >= 4 ? "bg-good" : "bg-accent") : L <= aw ? "bg-warn/70" : "bg-base-500"}`} />
      ))}
    </span>
  );
}

export function RungTrack({ cleared, playable, total = 6 }: { cleared: number; playable: number; total?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Rungs cleared ${cleared} of ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((r) => (
        <span
          key={r}
          className={`grid place-items-center w-4 h-4 rounded-[3px] text-[10px] font-mono ${r <= cleared ? "bg-good/25 text-good" : r === cleared + 1 && r <= playable ? "border border-accent/60 text-accent" : r <= playable ? "border border-line-strong text-ink-faint" : "border border-dashed border-line text-ink-faint/50"}`}
          title={r <= cleared ? `Rung ${r} cleared` : r <= playable ? `Rung ${r}` : `Rung ${r}: needs the lab integration`}
        >
          {r}
        </span>
      ))}
    </span>
  );
}
