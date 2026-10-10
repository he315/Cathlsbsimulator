// Tip integration of the PCI scenario registry (pci-scenario-registry). The registry declares the
// scenario events of each definition (registry.scenarioEvents: lesion sites, calcium grade 2 and the
// case-wide events); the PCI lab's tip context raises them for the whole run (pci-tip-context, which
// owns the PCI event sources and the 'finish' phase). These checks show that the events the
// registry declares are the ones the tips gate on.
import { describe, expect, it } from "vitest";
import { tipsFor, type LabContext } from "../../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS } from "../../../content/lab/raisable/waiting";
import { launch as CORE_LAUNCH } from "./packs/core.launch";
import { scenarios as CORE } from "./packs/core";
import { pciScenarioDef, scenarioEvents } from "./registry";
import { resolveScenario } from "./generate";
import type { PciScenarioDef } from "./types";

const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

describe("PCI scenario events and the lab tips", () => {
  it("in a core scenario with a CTO target, the finish-phase context with its events shows pci-post-ecg-complex", () => {
    expect(CORE_LAUNCH.scenarios!.some((s) => s.id === "rca-cto")).toBe(true);
    const r = resolveScenario("rca-cto");
    expect(r.events).toContain("cto");
    expect(ids({ lab: "pci", phase: "finish", events: r.events, vessel: "RCA" })).toContain("pci-post-ecg-complex");
    // without the scenario event the tip stays hidden (it requires 'cto')
    expect(ids({ lab: "pci", phase: "finish", events: [], vessel: "RCA" })).not.toContain("pci-post-ecg-complex");
  });

  it("a bifurcation target's declared site gives the event pci-post-ecg-bifurcation requires", () => {
    // No core scenario is a bifurcation; the bifurcation packs (pci-bifurcation-provisional and
    // pci-bifurcation-two-stent) add them. A definition declaring the site raises the event.
    const bif: PciScenarioDef = { ...CORE[0], id: "fixture-bifurcation", lesions: [{ ...CORE[0].lesions[0], sites: ["bifurcation"], medina: [1, 1, 1] }] };
    const events = scenarioEvents(bif);
    expect(events).toEqual(["bifurcation"]);
    expect(ids({ lab: "pci", phase: "finish", events, vessel: "LAD" })).toContain("pci-post-ecg-bifurcation");
    expect(ids({ lab: "pci", phase: "finish", events: scenarioEvents(pciScenarioDef("lad-focal")!), vessel: "LAD" })).not.toContain("pci-post-ecg-bifurcation");
  });

  it("no waiting.ts entry names pci-scenario-registry as its raiser", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === "pci-scenario-registry")).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-scenario-registry")).toEqual([]);
  });
});
