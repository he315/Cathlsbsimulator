// physiology-post-pci-handover: the post-PCI study's tip context (physiology.ts postPciTipContext and
// postPciEvents, the event source of a post-PCI study) reaches the tips of lesson pm-physiology-after-pci
// at the PCI lab's optimisation step, and the pullback that finds the loss inside the stent raises
// stent-underexpanded, which brings the underexpansion caution. No waiting.ts entry names this package;
// the check below computes that and holds for any that are added.
//   npx vitest run src/simulation/physiology.postPci.tips.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../content/lab/raisable/waiting";
import { POST_PCI_SCENARIOS } from "../content/lab/presets/physiology/postPci.launch";
import { POST_PCI_PRESETS, POST_PCI_PRESET_BY_ID, POST_PCI_RAISES, postPciEvents, postPciTipContext } from "./physiology";

const PKG = "physiology-post-pci-handover";
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

describe("the post-PCI study's tips (acceptance)", () => {
  it("in 'post-pci-instent-step' (postPci.launch.ts), at phase 'optimise', tipsFor(ctx, 20) includes pci-phys-post-pci-pullback; after the pullback that raises 'stent-underexpanded' it includes pci-perf-size-and-pressure", () => {
    expect(POST_PCI_SCENARIOS.map((s) => s.id)).toContain("post-pci-instent-step");
    const c = POST_PCI_PRESET_BY_ID["post-pci-instent-step"].case;
    const before = postPciTipContext(c, { pulledBack: false });
    expect(before.phase).toBe("optimise");
    expect(before.phases).toBeUndefined();
    expect(before.vessel).toBe("LAD");
    expect(before.events).toEqual([]);
    expect(ids(before)).toContain("pci-phys-post-pci-pullback");
    expect(ids(before)).not.toContain("pci-perf-size-and-pressure");
    // the action: the pullback through the stent, which finds the pressure lost inside it
    const after = postPciTipContext(c, { pulledBack: true });
    expect(after.events).toContain("stent-underexpanded");
    expect(ids(after)).toContain("pci-perf-size-and-pressure");
    // the pullback tip is still drawn, behind the underexpansion tips the event brings
    expect(tipsFor(after, 100).map((t) => t.id)).toContain("pci-phys-post-pci-pullback");
  });

  it("only the in-stent variant raises stent-underexpanded, and only once the pullback is done", () => {
    for (const p of POST_PCI_PRESETS) {
      expect(postPciEvents(p.case, { pulledBack: false }), p.id).toEqual([]);
      expect(postPciEvents(p.case, { pulledBack: true }), p.id).toEqual(p.variant === "instent" ? ["stent-underexpanded"] : []);
      expect(ids(postPciTipContext(p.case, { pulledBack: false })), p.id).toContain("pci-phys-post-pci-pullback");
    }
  });

  it("POST_PCI_RAISES uses the shared vocabulary and declares what the context reports", () => {
    expect(POST_PCI_RAISES.lab).toBe("pci");
    for (const ph of POST_PCI_RAISES.phases) expect((LAB_PHASES.pci as readonly string[]).includes(ph), ph).toBe(true);
    for (const e of POST_PCI_RAISES.events) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    for (const p of POST_PCI_PRESETS) {
      const ctx = postPciTipContext(p.case, { pulledBack: true });
      for (const ph of [ctx.phase!, ...(ctx.phases ?? [])]) expect(POST_PCI_RAISES.phases).toContain(ph);
      for (const e of ctx.events ?? []) expect(POST_PCI_RAISES.events).toContain(e);
    }
  });
});

// --- reachability from the study's raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInPci = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "pci" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "pci" && satisfiableIn(tip.when, a.phase, rs));

describe("reachability (acceptance)", () => {
  it("every waiting.ts entry naming physiology-post-pci-handover becomes satisfiable, so the pci waiting count falls by at least their number", () => {
    const mine = [...WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips), ...DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG).map((d) => d.tipId)];
    const missing = WAITING_TIPS.filter((w) => w.raisedBy === PKG)
      .flatMap((w) => w.tips)
      .filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], [POST_PCI_RAISES]));
    expect(missing).toEqual([]);
    for (const d of DEFERRED_RETARGETS.filter((x) => x.raisedBy === PKG)) expect(satisfiableIn(d.when, d.when.phase, [POST_PCI_RAISES]), d.tipId).toBe(true);
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => pciWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], rs)).length;
    const before = stillWaiting([]);
    const after = stillWaiting([POST_PCI_RAISES]);
    console.info(`waiting.ts entries naming ${PKG}: ${mine.length}; pci tips still waiting: ${before} -> ${after} with the post-PCI study's raises`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
    // the request's tip (pm-physiology#8) and the underexpansion caution are satisfiable from the study alone
    for (const id of ["pci-phys-post-pci-pullback", "pci-perf-size-and-pressure"]) expect(satisfiableInPci(TIP_BY_ID[id], [POST_PCI_RAISES]), id).toBe(true);
  });
});
