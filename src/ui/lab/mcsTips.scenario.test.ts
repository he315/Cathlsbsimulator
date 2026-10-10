// Tip integration of the MCS lab, driven from a scenario of src/content/lab/presets/mcs/core.launch.ts
// (mcs-console-split-select-and-tips), and the waiting.ts entries this package was expected to make
// satisfiable.
//   npx vitest run src/ui/lab/mcsTips.scenario.test.ts
import { describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch } from "../../content/lab/presets/mcs/core.launch";
import { SELECT_PRESET_BY_ID, profileEvents } from "../../simulation/mcs/deviceChoice";
import { mcsTipContext, raises, type McsConsole, type McsStage } from "./mcsTips";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import { SELECT_PRESETS } from "../../simulation/mcs/deviceChoice";

const PKG = "mcs-console-split-select-and-tips";

/** The same rule as reachability.test.ts: a trigger can match given what a lab raises. */
function satisfiable(tip: LabTip, when: TipTrigger, r: LabRaises): boolean {
  if (tip.lab !== r.lab) return false;
  const any = (want: readonly string[] | undefined, have: readonly string[] | undefined) => !want?.length || want.some((x) => (have ?? []).includes(x));
  return (
    any(when.phase, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.includes(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}

/** The waiting tips this package was expected to raise. */
const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);

/**
 * Waiting tips that are satisfiable from the lab's merged raises (the reachability report's union
 * over every console) but that no console context shows yet: the balloon pump console has no
 * insertion, positioning or fault stage and runs no circulation, so it raises no hypotension or limb
 * ischaemia (mcs-iabp-insertion-and-troubleshooting adds them); bleeding comes only from the balloon
 * pump's retroperitoneal-bleed case (which also puts that console in its complication phase, where
 * the stopped-balloon tip belongs: the module's answer to that case rules out switching the pump off),
 * so the ECMO cannula bleed waits for the cannulation stage of mcs-ecmo-cannulation-and-management.
 */
const UNION_ONLY: string[] = [
  "mcs-cx-ecmo-cannula-bleed",
  "mcs-cx-iabp-ischaemic-leg",
  "mcs-iabp-kit-wire",
  "mcs-iabp-limb",
  "mcs-iabp-poor-augmentation",
  "mcs-iabp-tip-carina",
  "mcs-iabp-vacuum-valve",
];

describe("MCS tips from a core.launch.ts scenario", () => {
  it("select-biv-hypoxaemia: loading the preset raises hypotension; the shock-severity and contraindication tips appear at phase select", () => {
    expect(launch.scenarios?.some((s) => s.id === "select-biv-hypoxaemia")).toBe(true);
    const p = SELECT_PRESET_BY_ID["select-biv-hypoxaemia"];
    // before the preset is loaded there is no profile and no event
    const before = mcsTipContext("impella", "select", null);
    expect(before.events).toEqual([]);
    expect(tipsFor(before, 20).map((t) => t.id)).not.toContain("mcs-select-shock-severity");
    // the action: the console opens on the preset, whose blood pressure is on the screen
    const ctx = mcsTipContext("impella", "select", null, { events: profileEvents(p) });
    expect(ctx.events).toContain("hypotension");
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("mcs-select-shock-severity");
    expect(ids).toContain("mcs-select-impella-contraindications");
  });

  it("at phase select every console shows the contraindication tip", () => {
    for (const kind of ["iabp", "impella", "ecmo"] as const) {
      const ctx = mcsTipContext(kind, "select", null, { events: profileEvents(SELECT_PRESET_BY_ID["select-chip-lm"]) });
      expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("mcs-select-impella-contraindications");
    }
  });

  it("every waiting.ts entry naming this package becomes satisfiable", () => {
    expect(WAITING.length).toBeGreaterThan(50);
    const nowSatisfiable = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises));
    expect(WAITING.filter((id) => !nowSatisfiable.includes(id))).toEqual([]);
    // the reachability waiting count for the mcs lab falls by their number
    expect(nowSatisfiable.length).toBe(WAITING.length);
    // without this package's raises none of them is satisfiable
    const none: LabRaises = { lab: "mcs", phases: [], events: [] };
    expect(WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, none))).toEqual([]);
  });

  it("every mcs tip outside waiting.ts stays satisfiable", () => {
    const listed = new Set(WAITING_TIPS.flatMap((g) => g.tips));
    const mcs = LAB_TIPS.filter((t) => t.lab === "mcs" && !listed.has(t.id));
    for (const t of mcs) expect(satisfiable(t, t.when, raises), t.id).toBe(true);
  });

  it("which waiting tips a console can actually show now (the union over-approximates)", () => {
    // the contexts the consoles produce: the device-choice step on every preset; then per console the
    // stages it reaches and the events it can raise there (see the console files)
    const subsets = (xs: LabEvent[]): LabEvent[][] => xs.reduce<LabEvent[][]>((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]);
    const ctxs: LabContext[] = [];
    for (const kind of ["iabp", "impella", "ecmo"] as McsConsole[]) for (const p of SELECT_PRESETS) ctxs.push(mcsTipContext(kind, "select", null, { events: profileEvents(p) }));
    const reach: [McsConsole, McsStage[], LabEvent[], boolean][] = [
      ["iabp", ["manage", "wean"], ["bleeding"], false],
      ["impella", ["position", "manage", "wean"], ["hypotension", "suction"], false],
      ["ecmo", ["insert", "manage", "wean"], ["hypotension", "vf"], false],
      ["ecmo", ["insert", "manage", "wean"], ["hypotension", "vf"], true],
      // the arterial bubble is there only before flow starts
      ["ecmo", ["insert"], ["hypotension", "vf", "air"], false],
      ["ecmo", ["insert"], ["hypotension", "vf", "air"], true],
    ];
    for (const [kind, stages, evs, vent] of reach)
      for (const stage of stages)
        for (const e of subsets(evs)) {
          ctxs.push(mcsTipContext(kind, stage, null, { events: e, vent }));
          if (kind === "impella") ctxs.push(mcsTipContext(kind, stage, null, { events: e, impellaPosition: "ventricle" }));
          if (kind === "ecmo") ctxs.push(mcsTipContext(kind, stage, null, { events: e, vent, legNirs: 40 }));
        }
    const shown = new Set(ctxs.flatMap((c) => tipsFor(c, 1000).map((t) => t.id)));
    const unionOnly = WAITING.filter((id) => !shown.has(id));
    // tips the reachability report counts as ready only because another console raises the phase or
    // event: they need the insertion and fault stages of the later MCS packages
    expect(unionOnly.sort()).toEqual(UNION_ONLY.slice().sort());
  });
});
