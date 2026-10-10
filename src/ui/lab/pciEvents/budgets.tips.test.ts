// Tips from the budgets (pci-budgets-stop-rules), driven in multivessel-stable from 'guide-engaged': the
// injection that takes the contrast past the warning threshold (80% of the patient's ceiling) raises
// 'high-contrast-volume', and the tips then include pci-contrast-sparing-tactics and
// pci-planning-contrast-ceiling. This file's sources raise both budget events from the snapshot's budget
// read-out, kept at finish. Every waiting.ts entry naming this package is satisfiable from what the PCI lab
// raises (there are none today: the budget tips were filed under pci-tip-context, whose session already
// raised both events, so the waiting count does not change).
//   npx vitest run src/ui/lab/pciEvents/budgets.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PciLabSession } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext } from "../pciTips";
import { PCI_EVENT_SOURCES, budgetOf, raises as BUDGET_RAISES } from "./budgets";

const PKG = "pci-budgets-stop-rules";

/** Every raises export the reachability report reads (the same globs as src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../pciEvents/*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
const declared = (): LabRaises[] =>
  Object.values(RAISE_MODULES)
    .filter((exp) => !!exp)
    .flatMap((exp) => (Array.isArray(exp) ? exp : [exp as LabRaises]))
    .filter((r) => r.lab === "pci");

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(when: LabTip["when"], list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  return any(when.phase, u("phases")) && any(when.event, u("events")) && (when.requires ?? []).every((e) => u("events").has(e)) && any(when.imaging, u("imaging")) && !when.technique?.length && !when.procedure?.length && !when.route?.length;
}

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((tip) => tip.id);
const ctxOf = (x: PciLabSession) => pciTipContext(x.snapshot());

describe("budget tips in multivessel-stable (pci-budgets-stop-rules)", () => {
  it("after the injection that raises 'high-contrast-volume', tipsFor(ctx, 20) includes pci-contrast-sparing-tactics and pci-planning-contrast-ceiling", () => {
    const r = resolvePciLaunch({ scenario: "multivessel-stable", start: "guide-engaged", mode: "independent" });
    expect(r.problems).toEqual([]);
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    const before = ctxOf(x);
    expect(before.phase).toBe("wire");
    expect(before.events).not.toContain("high-contrast-volume");
    expect(ids(before)).not.toContain("pci-contrast-sparing-tactics");
    // the action: standard injections, a pause for the patient after each, until the warning threshold
    let raisedAt = -1;
    for (let i = 0; i < 20 && raisedAt < 0; i++) {
      expect(x.inject({ kind: "standard" })).toBe(true);
      for (let k = 0; k < 100 && x.bolusInfo(); k++) x.step(0.1);
      for (let k = 0; k < 200; k++) x.step(0.1);
      if ((ctxOf(x).events ?? []).includes("high-contrast-volume")) raisedAt = i;
    }
    expect(raisedAt).toBeGreaterThan(0);
    expect(x.budgetReadout().contrast.totalMl).toBeGreaterThanOrEqual(x.budgetReadout().contrast.warnAtMl);
    const ctx = ctxOf(x);
    expect(ctx.phase).toBe("wire");
    const shown = ids(ctx);
    expect(shown).toContain("pci-contrast-sparing-tactics");
    expect(shown).toContain("pci-planning-contrast-ceiling");
    // this file's sources alone raise it from the snapshot's budget read-out (no event log), and keep it at finish
    const snap = x.snapshot();
    expect(budgetOf(snap)?.contrast.warned).toBe(true);
    const bare = { ...snap, activeEvents: [], events: undefined, vitals: undefined };
    expect(pciTipContext(bare, PCI_EVENT_SOURCES).events).toContain("high-contrast-volume");
    expect(pciTipContext({ ...bare, finishing: true }, PCI_EVENT_SOURCES).events).toContain("high-contrast-volume");
  });

  it("raises is derived from the sources; the budget tips' triggers are satisfiable from what the PCI lab declares", () => {
    expect(BUDGET_RAISES).toEqual({ lab: "pci", phases: [], events: ["high-contrast-volume", "high-radiation-dose"] });
    const all = declared();
    for (const id of ["pci-contrast-sparing-tactics", "pci-planning-contrast-ceiling", "pci-caki-after-case", "pci-rad-skin-follow-up", "pci-stop-checkpoint", "pci-planning-radiation-limit", "pci-stage-on-dose", "pci-cto-strategy-stop-rules", "pci-mon-fatigue-defer"]) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip.when, all), id).toBe(true);
    }
  });

  it("every waiting.ts entry naming pci-budgets-stop-rules is satisfiable, so the pci lab's waiting count falls by at least their number", () => {
    const all = declared();
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG);
    const tips = mine.flatMap((w) => w.tips);
    for (const id of tips) expect(TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id].when, all), id).toBe(true);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    for (const d of deferred) expect(satisfiable(d.when, all), d.tipId).toBe(true);
    // the waiting count for the pci lab, counted as the reachability report does: entries still unsatisfiable
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips).filter((id) => TIP_BY_ID[id] && !satisfiable(TIP_BY_ID[id].when, all));
    for (const id of tips) expect(pciWaiting).not.toContain(id);
  });
});
