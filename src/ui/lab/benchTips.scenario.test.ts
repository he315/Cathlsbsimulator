// Tip integration of the IVUS and OCT bench, driven from scenarios of
// src/content/lab/presets/pci-bench/core.launch.ts (pci-bench-imaging-unify): the launch links and the
// practice index, the tips after the actions that raise slow-flow and dissection, the waiting.ts
// entries this package was expected to make satisfiable, and the bench screen itself.
//   npx vitest run src/ui/lab/benchTips.scenario.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch, validateLaunchLinks } from "../../content/validateLaunch";
import { ALL_CASES, TRACKS } from "../../content/index";
import { launch } from "../../content/lab/presets/pci-bench/core.launch";
import { BENCH_BY_ID, BENCH_LESIONS, applyPrep, deploy, initialState } from "../../simulation/pciBench";
import { practiceForLesson } from "../content/practiceIndex";
import PciBench, { BENCH_START_STEPS, benchHookState, launchBench } from "../sections/PciBench";
import { BIF_RAISES } from "../../simulation/bench/bifurcation";
import { LESION_BENCH_RAISES, benchTipContext, raises } from "./benchTips";

const PKG = "pci-bench-imaging-unify";
const FILE = "presets/pci-bench/core.launch.ts";

// ---------------------------------------------------------------------------
// The reachability rule (as src/content/lab/reachability.test.ts applies it), over the same raises files
// ---------------------------------------------------------------------------
type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
const RAISE_MODULES = import.meta.glob<RaisesExport>(["./pciEvents/*.ts", "../sim/modules/*.ts", "../../simulation/session/modules/*.ts", "./*Context.ts", "../**/*Tips.ts", "!**/*.test.ts"], {
  eager: true,
  import: "raises",
});

function declared(skip?: string): LabRaises[] {
  const out: LabRaises[] = [];
  for (const [file, exp] of Object.entries(RAISE_MODULES)) {
    if (!exp || (skip && file.endsWith(skip))) continue;
    out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  }
  return out;
}

/** Whether a tip's trigger can match in its lab given the union of what that lab declares (the report's over-approximation). */
function satisfiable(tip: LabTip, when: TipTrigger, list: readonly LabRaises[]): boolean {
  const mine = list.filter((r) => r.lab === tip.lab);
  if (!mine.length) return false;
  const u = (k: "phases" | "events" | "imaging" | "procedures" | "routes" | "techniques") => new Set(mine.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  const ev = u("events");
  return (
    any(when.phase, u("phases")) &&
    any(when.event, ev) &&
    (when.requires ?? []).every((e) => ev.has(e)) &&
    any(when.procedure, u("procedures")) &&
    any(when.route, u("routes")) &&
    any(when.technique, u("techniques")) &&
    any(when.imaging, u("imaging"))
  );
}

const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);

/**
 * Waiting tips the bench cannot make satisfiable, and why: no PCI raises declaration yet reports
 * the wire phase with wire-prolapse (the PCI lab's event sources), and the long-pullback tip needs the
 * physiology phase, which the bench never reports (the physiology lab would have to raise long-lesion).
 */
const NOT_BY_BENCH: Record<string, string> = {
  "pci-ocx-large-vessel-side-branch": "phase wire with wire-prolapse: wiring is not on the bench",
  "pci-ocx-long-pullback": "phase physiology: the bench has no pressure-wire step; needs long-lesion from the physiology lab",
};

describe("launch links", () => {
  it("declares every bench lesion, and only those, under the pci-bench sim", () => {
    expect(launch.sim).toBe("pci-bench");
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(BENCH_LESIONS.map((l) => l.id).sort());
    const known = buildKnownLaunch({ [FILE]: { launch } });
    expect(known.problems).toEqual([]);
  });

  it("every named lessonId and caseId resolves, and every link passes validation", () => {
    const known = buildKnownLaunch({ [FILE]: { launch } });
    const errs = validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, known).filter((e) => e.includes("pci-bench"));
    expect(errs).toEqual([]);
  });

  it("starts are the bench's start steps; links carry a modality", () => {
    for (const sc of launch.scenarios!) for (const st of sc.starts ?? []) expect(BENCH_START_STEPS as readonly string[]).toContain(typeof st === "string" ? st : st.id);
    for (const l of launch.links ?? []) expect(["IVUS", "OCT"]).toContain(l.params?.modality);
  });

  it("practiceIndex lists every scenario in core.launch.ts under each lesson and case it names", () => {
    for (const sc of launch.scenarios!) {
      for (const lessonId of sc.lessonIds) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "pci-bench" && x.scenario === sc.id && x.source.endsWith(FILE));
        expect(e.length, `${sc.id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].params.scenario).toBe(sc.id);
      }
    }
    const oct = practiceForLesson("pm-imaging-oct").filter((x) => x.sim === "pci-bench");
    expect(oct.map((x) => x.scenario)).toEqual(expect.arrayContaining(["calcified-rca", "lipid-acs"]));
    expect(oct.every((x) => x.params.modality === "OCT" && x.params.start === "image")).toBe(true);
  });

  it("a launch opens the named lesion at its start step and modality; an unknown scenario is refused", () => {
    expect(launchBench({ scenario: "calcified-rca", start: "prep", modality: "oct", mode: "supervised" })).toMatchObject({ session: { lesionId: "calcified-rca", step: "prep", modality: "OCT" }, mode: "supervised" });
    // a step past imaging needs a modality: IVUS when none is given
    expect(launchBench({ scenario: "focal-lad", start: "stent" })!.session).toMatchObject({ step: "stent", modality: "IVUS" });
    // the first pullback leaves the modality to the learner; a direct caller may say "step"
    expect(launchBench({ scenario: "distal-lm", step: "image" })!.session).toMatchObject({ step: "image", modality: null });
    // a later step cannot be a start; a bad mode is ignored
    expect(launchBench({ scenario: "focal-lad", start: "assess", mode: "nonsense" })).toMatchObject({ session: { step: "image" }, mode: null });
    expect(launchBench({ scenario: "no-such-lesion" })).toBeNull();
    // the dev hook's state follows the launch
    expect(benchHookState(launchBench({ scenario: "lipid-acs", start: "prep", modality: "OCT" })!.session)).toMatchObject({ scenario: "lipid-acs", step: "prep", modality: "OCT", deployed: false });
  });
});

describe("tips from bench scenarios", () => {
  it("lipid-acs: after aggressive predilatation raises slow-flow, the explain-the-unexpected tip appears", () => {
    const l = BENCH_BY_ID["lipid-acs"];
    const st = applyPrep(l, initialState(), { kind: "balloon", balloon: "semi-compliant", diameter: 3.5, atm: 8 });
    const ctx = benchTipContext(l, "prep", st, null, "OCT");
    expect(ctx.events).toContain("slow-flow");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-principles-explain-unexpected");
  });

  it("focal-lad: after a stent edge landed in plaque raises dissection, the stop-after-complication tip appears at optimise", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 8, proxEdge: 17, atm: 16 }, [], "IVUS");
    const ctx = benchTipContext(l, "optimise", initialState(), r, "IVUS");
    expect(ctx.phase).toBe("optimise");
    expect(ctx.events).toContain("dissection");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-stop-after-complication");
  });

  it("the imaging and long-lesion tips this package raises appear in their scenarios", () => {
    const lm = benchTipContext(BENCH_BY_ID["distal-lm"], "image", initialState(), null, "IVUS");
    expect(tipsFor(lm, 40).map((t) => t.id)).toContain("pci-ocx-large-vessel-ivus");
    const long = benchTipContext(BENCH_BY_ID["long-taper"], "prep", initialState(), null, "IVUS");
    expect(tipsFor(long, 40).map((t) => t.id)).toContain("pci-ocx-long-distal-first");
  });

  it("small-diagonal: the small-vessel tips appear at plan and imaging, and at lesion preparation", () => {
    const l = BENCH_BY_ID["small-diagonal"];
    expect(launch.scenarios!.some((sc) => sc.id === l.id && sc.lessonIds.includes("cp-other-complex-vessel-size"))).toBe(true);
    const plan = benchTipContext(l, "image", initialState(), null, null);
    expect(plan.phase).toBe("plan");
    expect(plan.events).toContain("small-vessel");
    expect(tipsFor(plan, 40).map((t) => t.id)).toContain("pci-ocx-small-vessel-nitrate");
    const imaging = benchTipContext(l, "image", initialState(), null, "IVUS");
    expect(imaging.phase).toBe("imaging");
    expect(tipsFor(imaging, 40).map((t) => t.id)).toContain("pci-ocx-small-vessel-nitrate");
    const prep = benchTipContext(l, "prep", initialState(), null, "IVUS");
    expect(prep.phase).toBe("lesion-prep");
    expect(tipsFor(prep, 40).map((t) => t.id)).toContain("pci-ocx-small-vessel-prep");
  });
});

describe("waiting.ts entries naming this package", () => {
  it("names the eight vessel-size and long-lesion tips", () => {
    expect(WAITING.length).toBe(8);
    for (const id of Object.keys(NOT_BY_BENCH)) expect(WAITING).toContain(id);
  });

  it("every entry the bench can raise becomes satisfiable with the bench's raises, and none without them", () => {
    const withBench = declared();
    const without = declared("/benchTips.ts");
    expect(withBench.some((r) => r === raises)).toBe(true);
    const ready = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, withBench));
    const before = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, without));
    expect(before).toEqual([]);
    // the union over-approximates: the long-pullback tip passes it only through the physiology lab's phase,
    // and no single screen raises that phase with long-lesion, so it is not counted as the bench's
    expect(ready.filter((id) => !(id in NOT_BY_BENCH)).sort()).toEqual(WAITING.filter((id) => !(id in NOT_BY_BENCH)).sort());
    // reachable on the bench itself: phase, events and imaging from the bench's own raises. Since
    // repair-bench-host-wiring the export also carries the bifurcation bench's declaration (BIF_RAISES, whose
    // physiology phase belongs to a provisional step), so the check is made per screen: the lesion bench's
    // declaration, and the bifurcation bench's, neither of which raises physiology with long-lesion
    const benchOnly = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, [LESION_BENCH_RAISES]));
    expect(benchOnly.sort()).toEqual(WAITING.filter((id) => !(id in NOT_BY_BENCH)).sort());
    expect(benchOnly).not.toContain("pci-ocx-long-pullback");
    expect(satisfiable(TIP_BY_ID["pci-ocx-long-pullback"], TIP_BY_ID["pci-ocx-long-pullback"].when, [BIF_RAISES])).toBe(false);
    for (const e of LESION_BENCH_RAISES.events) expect(raises.events).toContain(e);
    expect(benchOnly.length).toBeGreaterThanOrEqual(4);
  });
});

describe("the bench screen", () => {
  it("renders the first pullback with the modality still to choose, and the step tabs", () => {
    const html = renderToString(createElement(PciBench));
    expect(html).toContain("PCI bench");
    expect(html).toContain("Choose IVUS or OCT to start the pullback.");
    expect(html).toContain("5 · Final imaging");
    // the lesion picker names each scenario by its launch title, which does not give the finding away
    for (const sc of launch.scenarios!) expect(html).toContain(sc.title);
    for (const l of BENCH_LESIONS) if (!launch.scenarios!.some((sc) => sc.title === l.title)) expect(html).not.toContain(l.title);
  });
});
