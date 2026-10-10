// repair-bench-host-wiring: what run 3's bench packages built, wired into the bench screen and its tip source.
//   (1) PciBench: the optimise panel gets the deployed stent and the lesion (the platform's limit, the ostial
//       flare); the stent panel the procedure so far (balloons recorded on the bench); the pullback view the
//       planned stent's marker bands and the stretches without a measurable lumen
//   (2) benchTips: raises from every bench lesion (aorto-ostial-lesion declared), stent-recoil told apart from
//       stent-underexpanded, and the bifurcation bench's declaration merged in
//   (3) ImagePanel: the uncleared-blood note is generic (not "the flush escapes into the aorta")
//   (4) ImagePanel: an intracoronary nitroglycerin control that calls giveNitrate()
//   npx vitest run src/ui/lab/benchHostWiring.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  ALL_BENCH_LESIONS,
  BENCH_BY_ID,
  BENCH_LESIONS,
  MP_RECOIL_SIGNIFICANT_MM,
  angiographicReferenceMm,
  applyPrep,
  deploy,
  initialState,
  preImaging,
  type BenchState,
  type Modality,
  type PostDil,
  type Stent,
} from "../../simulation/pciBench";
import { BIF_RAISES } from "../../simulation/bench/bifurcation";
import { BIF_TECHNIQUES, TIP_BY_ID, tipScore, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import PciBench, { benchHookState, newSession, withNitrate, type BenchSession } from "../sections/PciBench";
import ImagePanel, { REGION_NOTE, nitrateReading } from "../bench/ImagePanel";
import { useBenchPlanStore } from "../bench/PlanForm";
import {
  BENCH_EVENT_TIPS,
  BENCH_RESULT_EVENTS,
  LESION_BENCH_RAISES,
  benchCaseEvents,
  benchEvents,
  benchResultEvents,
  benchTipContext,
  raises,
  stentRecoiled,
} from "./benchTips";

const noop = () => undefined;
/** static markup without React's text separators */
const render = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

afterEach(() => useBenchPlanStore.getState().reset());

/** A session at a step: the given state, stent and modality, deployed (with its post-dilatations) at optimise. */
function sessionAt(id: string, step: BenchSession["step"], stent: Stent, opts: { state?: BenchState; modality?: Modality; post?: PostDil[] } = {}): BenchSession {
  const l = BENCH_BY_ID[id];
  const modality = opts.modality ?? "IVUS";
  const state = opts.state ?? initialState();
  const post = opts.post ?? [];
  const result = step === "optimise" || step === "assess" ? deploy(l, state, stent, post, modality) : null;
  return { ...newSession(id, "image", modality), step, state, stent, post, result };
}
const bench = (s: BenchSession) => render(createElement(PciBench, { initial: { session: s, mode: "guided" } }));

// ---------------------------------------------------------------------------------------------------------
// (1) the bench screen's wiring
// ---------------------------------------------------------------------------------------------------------
describe("(1) PciBench passes the deployed stent, the procedure and the pullback overlays to the panels", () => {
  it("after deploying platform B the optimise panel shows platform B's limit, not platform A's", () => {
    // platform B's 2.25 mm stent is labelled to 2.75 mm; the catalogue (platform A) limit for 2.25 mm is larger
    const b = bench(sessionAt("small-diagonal", "optimise", { diameter: 2.25, lengthMm: 12, proxEdge: 9, atm: 12, platformId: "B" }));
    expect(b).toContain("stent limit 2.75 mm");
    expect(b).toContain("Platform B, 2.25 mm: do not dilate beyond 2.75 mm.");
    expect(b).toContain("beyond the stent&#x27;s labelled post-dilatation limit of 2.75 mm");
    const a = bench(sessionAt("focal-lad", "optimise", { diameter: 3.0, lengthMm: 18, proxEdge: 9, atm: 12, platformId: "A" }));
    expect(a).toContain("stent limit 3.50 mm");
    expect(a).toContain("Platform A, 3.00 mm");
    expect(a).not.toContain("Platform B");
  });

  it("offers the ostial flare at optimise for an aorto-ostial lesion only", () => {
    const ostial = BENCH_BY_ID["ostial-overhang"];
    const st: Stent = { diameter: 3.5, lengthMm: 15, proxEdge: Math.max(0, ostial.ostial!.aortaMm - 1.5), atm: 14 };
    expect(bench(sessionAt("ostial-overhang", "optimise", st))).toContain("flare the ostium");
    expect(bench(sessionAt("focal-lad", "optimise", { diameter: 3.0, lengthMm: 18, proxEdge: 9, atm: 12 }))).not.toContain("flare the ostium");
  });

  it("the stent panel draws the balloons recorded on the bench", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const state = applyPrep(l, initialState(), { kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10, fromMm: 8, lengthMm: 15 });
    expect(state.injured?.length).toBeGreaterThan(0);
    const stent: Stent = { diameter: 3.0, lengthMm: 18, proxEdge: 9, atm: 12 };
    const html = bench(sessionAt("focal-lad", "stent", stent, { state }));
    expect(html).toContain('data-part="injured"');
    expect(html).toContain("predilated 8–23 mm");
    // without a recorded balloon nothing is drawn
    expect(bench(sessionAt("focal-lad", "stent", stent))).not.toContain('data-part="injured"');
  });

  it("the pullback view draws the planned stent's marker bands at the stent step and shades the aorta", () => {
    const l = BENCH_BY_ID["ostial-rca-short"];
    const html = bench(sessionAt("ostial-rca-short", "stent", { diameter: 3.5, lengthMm: 15, proxEdge: Math.max(0, l.ostial!.aortaMm - 1.5), atm: 14 }));
    expect([...html.matchAll(/data-part="planned-marker"/g)]).toHaveLength(2);
    expect(html).toContain('data-part="region-aorta"');
    // no planned stent before the stent step
    expect(bench(sessionAt("ostial-rca-short", "prep", { diameter: 3.5, lengthMm: 15, proxEdge: 4, atm: 14 }))).not.toContain("planned-marker");
  });

  it("the pullback view shades the blood an OCT flush did not clear in the ectatic RCA, and not on IVUS", () => {
    const st: Stent = { diameter: 3.5, lengthMm: 23, proxEdge: 10, atm: 14 };
    expect(bench(sessionAt("ectatic-rca", "prep", st, { modality: "OCT" }))).toContain('data-part="region-uncleared"');
    expect(bench(sessionAt("ectatic-rca", "prep", st, { modality: "IVUS" }))).not.toContain('data-part="region-uncleared"');
  });
});

// ---------------------------------------------------------------------------------------------------------
// (2) the bench's tip source
// ---------------------------------------------------------------------------------------------------------

/** Whether a trigger can match given one declaration list (the reachability report's rule). */
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

describe("(2) benchTips: raises from every bench lesion", () => {
  it("declares the case events of every bench lesion, launch presets included, so aorto-ostial-lesion is declared", () => {
    expect(ALL_BENCH_LESIONS.length).toBeGreaterThan(BENCH_LESIONS.length);
    for (const l of ALL_BENCH_LESIONS) for (const e of benchCaseEvents(l)) expect(raises.events, `${l.id}: ${e}`).toContain(e);
    expect(BENCH_LESIONS.flatMap(benchCaseEvents)).not.toContain("aorto-ostial-lesion");
    expect(raises.events).toContain("aorto-ostial-lesion");
    // the event is raised at runtime for the presets that declare it
    expect(benchTipContext(BENCH_BY_ID["aorto-ostial-rca"], "image", initialState(), null, "IVUS").events).toContain("aorto-ostial-lesion");
  });

  it("makes pci-img-ostial-coverage satisfiable on the bench", () => {
    const tip = TIP_BY_ID["pci-img-ostial-coverage"];
    expect(tip.when.requires).toContain("aorto-ostial-lesion");
    expect(satisfiable(tip, tip.when, [raises])).toBe(true);
    // and the tip applies on the screen: the plan of the aorto-ostial RCA preset
    expect(tipScore(tip, benchTipContext(BENCH_BY_ID["aorto-ostial-rca"], "image", initialState(), null, null))).not.toBeNull();
  });
});

describe("(2) benchTips: stent-recoil is told apart from stent-underexpanded", () => {
  const recoilCase = () => {
    const l = BENCH_BY_ID["ostial-recoil"];
    const s = [{ kind: "balloon", balloon: "non-compliant", diameter: 3.5, atm: 16 } as const].reduce((acc, a) => applyPrep(l, acc, a), initialState());
    const r = deploy(l, s, { diameter: 4.0, lengthMm: 12, proxEdge: l.ostial!.aortaMm - 1.5, atm: 14 }, [{ diameter: 4.5, atm: 16, where: "full" }], "IVUS");
    return { l, s, r };
  };
  const waistCase = () => {
    const l = BENCH_BY_ID["ostial-fibrotic"];
    const s = initialState();
    const r = deploy(l, s, { diameter: 3.5, lengthMm: 15, proxEdge: l.ostial!.aortaMm - 1.5, atm: 14, rapidPacing: true }, [{ diameter: 3.75, atm: 18, where: "full" }], "IVUS");
    return { l, s, r };
  };

  it("a stent that opened and recoiled raises stent-recoil (at optimise and assess, not before), and not stent-underexpanded", () => {
    const { l, s, r } = recoilCase();
    expect(r.recoilMm).toBeGreaterThan(MP_RECOIL_SIGNIFICANT_MM);
    expect(stentRecoiled(r)).toBe(true);
    expect(benchEvents(l, "optimise", s, r)).toContain("stent-recoil");
    expect(benchEvents(l, "assess", s, r)).toContain("stent-recoil");
    expect(benchEvents(l, "stent", s, r)).not.toContain("stent-recoil");
    expect(benchEvents(l, "optimise", s, r)).not.toContain("stent-underexpanded");
  });

  it("a waist that never opened raises stent-underexpanded, not stent-recoil", () => {
    const { l, s, r } = waistCase();
    expect(r.underexpansion).toBe("waist");
    expect(stentRecoiled(r)).toBe(false);
    expect(benchEvents(l, "optimise", s, r)).toContain("stent-underexpanded");
    expect(benchEvents(l, "optimise", s, r)).not.toContain("stent-recoil");
  });

  it("the rule: the engine's recoil verdict or a loss beyond MP_RECOIL_SIGNIFICANT_MM is recoil; otherwise below 80% is underexpansion", () => {
    expect(benchResultEvents({ underexpansion: "recoil", recoilMm: 0.3, expansion: 70 })).toEqual(["stent-recoil"]);
    expect(benchResultEvents({ underexpansion: null, recoilMm: MP_RECOIL_SIGNIFICANT_MM + 0.01, expansion: 90 })).toEqual(["stent-recoil"]);
    expect(benchResultEvents({ underexpansion: "waist", recoilMm: 0, expansion: 70 })).toEqual(["stent-underexpanded"]);
    expect(benchResultEvents({ underexpansion: null, recoilMm: MP_RECOIL_SIGNIFICANT_MM, expansion: 95 })).toEqual([]);
  });

  it("pci-ostial-stent-underexpanded shows for the waist and not for the recoil; the recoil tip's pending trigger matches the recoil only", () => {
    const rc = recoilCase();
    const wc = waistCase();
    const recoilCtx = benchTipContext(rc.l, "optimise", rc.s, rc.r, "IVUS");
    const waistCtx = benchTipContext(wc.l, "optimise", wc.s, wc.r, "IVUS");
    const under = TIP_BY_ID["pci-ostial-stent-underexpanded"];
    expect(tipScore(under, waistCtx)).not.toBeNull();
    expect(tipScore(under, recoilCtx)).toBeNull();
    // the deferred retarget of pci-ostial-recoil (event stent-recoil) is matched by the recoil, not by the waist
    const retarget = DEFERRED_RETARGETS.find((d) => d.tipId === "pci-ostial-recoil");
    expect(retarget?.when.event).toContain("stent-recoil");
    const recoilTip = { ...TIP_BY_ID["pci-ostial-recoil"], when: retarget!.when };
    expect(tipScore(recoilTip, recoilCtx)).not.toBeNull();
    expect(tipScore(recoilTip, waistCtx)).toBeNull();
  });

  it("the stent's events are declared, and BENCH_EVENT_TIPS stays keyed by the procedure's event kinds", () => {
    for (const e of BENCH_RESULT_EVENTS) expect(raises.events).toContain(e);
    expect(Object.keys(BENCH_EVENT_TIPS).sort()).toEqual(["balloon-rupture", "burr-stall", "dissection", "no-reflow", "perforation", "stent-overdilated", "underexpanded-balloon"]);
  });
});

describe("(2) benchTips: the bifurcation bench's declaration is merged into raises", () => {
  it("raises carries BIF_RAISES's techniques, phases and events beside the lesion bench's", () => {
    expect([...(raises.techniques ?? [])].sort()).toEqual([...BIF_RAISES.techniques].sort());
    for (const t of ["provisional", "dk-crush", "culotte", "tap", "reverse-crush"] as const) expect(raises.techniques).toContain(t);
    for (const t of raises.techniques ?? []) expect(BIF_TECHNIQUES as readonly string[]).toContain(t);
    for (const p of [...BIF_RAISES.phases, ...LESION_BENCH_RAISES.phases]) expect(raises.phases).toContain(p);
    for (const e of [...BIF_RAISES.events, ...LESION_BENCH_RAISES.events]) expect(raises.events).toContain(e);
    expect(raises.events).toContain("side-branch-compromise");
    expect(raises.imaging).toEqual(["ivus", "oct"]);
  });

  it("the reachability report counts the bifurcation techniques: the two-stent retargets become satisfiable through benchTips", () => {
    const withBench = declared();
    const without = declared("/benchTips.ts");
    expect(withBench.some((r) => r === raises)).toBe(true);
    const twoStent = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-bifurcation-two-stent" && d.when.technique?.some((t) => t === "dk-crush" || t === "culotte" || t === "tap"));
    expect(twoStent.length).toBeGreaterThan(0);
    for (const d of twoStent) {
      const tip = TIP_BY_ID[d.tipId];
      if (!tip) continue;
      expect(satisfiable(tip, d.when, withBench), `${d.tipId} with the bench`).toBe(true);
      expect(satisfiable(tip, d.when, without), `${d.tipId} without the bench`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// (3) and (4) the image step
// ---------------------------------------------------------------------------------------------------------
describe("(3) ImagePanel: the note for frames without a measurable lumen", () => {
  it("is generic: it does not say the flush escapes into the aorta (wrong for the ectatic RCA)", () => {
    expect(REGION_NOTE.uncleared).not.toMatch(/aorta|ostium/i);
    expect(REGION_NOTE.uncleared).toMatch(/not cleared/i);
    expect(REGION_NOTE.aorta).toMatch(/aorta/);
  });
});

describe("(4) ImagePanel: intracoronary nitroglycerin", () => {
  it("shows a control that calls onNitrate, and once given the repeat injection's reading", () => {
    const l = BENCH_BY_ID["small-distal-225"];
    let calls = 0;
    const before = render(createElement(ImagePanel, { lesion: l, mode: "guided", modality: null, onModality: noop, pre: null, next: noop, nitrate: false, onNitrate: () => calls++ }));
    expect(before).toContain("Give nitroglycerin");
    expect(before).not.toContain("Repeat injection");
    const after = render(createElement(ImagePanel, { lesion: l, mode: "guided", modality: null, onModality: noop, pre: null, next: noop, nitrate: true, onNitrate: noop }));
    expect(after).not.toContain("Give nitroglycerin");
    expect(after).toContain(esc(nitrateReading(l, "guided")));
    expect(nitrateReading(l, "guided")).toContain(`${angiographicReferenceMm(l, { nitrate: true }).toFixed(1)} mm`);
    expect(nitrateReading(l, "guided")).toContain(`${angiographicReferenceMm(l, { nitrate: false }).toFixed(1)} mm on the first injection`);
    // outside guided practice the reading gives no number (after nitroglycerin it is the true size)
    for (const mode of ["supervised", "independent", "exam"] as const) {
      expect(nitrateReading(l, mode), mode).not.toMatch(/\d/);
      expect(nitrateReading(l, mode), mode).toMatch(/larger/);
      const shown = render(createElement(ImagePanel, { lesion: l, mode, modality: null, onModality: noop, pre: null, next: noop, nitrate: true, onNitrate: noop }));
      expect(shown, mode).toContain(esc(nitrateReading(l, mode)));
      expect(shown, mode).not.toContain(esc(nitrateReading(l, "guided")));
    }
    expect(nitrateReading(l)).not.toMatch(/\d/);
    // a lesion without spasm: no change, and no number
    expect(nitrateReading(BENCH_BY_ID["focal-lad"], "guided")).not.toMatch(/\d/);
    // without onNitrate the panel is as before
    expect(render(createElement(ImagePanel, { lesion: l, mode: "guided", modality: null, onModality: noop, pre: null, next: noop }))).not.toContain("nitroglycerin");
    expect(calls).toBe(0);
  });

  it("the bench session gives it once (giveNitrate), logs it, and angiographicReferenceMm follows", () => {
    const l = BENCH_BY_ID["small-distal-225"];
    const s0 = newSession(l.id);
    expect(angiographicReferenceMm(l, s0.state)).toBeCloseTo(l.spasm!.angioRefMm, 6);
    const s1 = withNitrate(s0);
    expect(s1.state.nitrate).toBe(true);
    expect(angiographicReferenceMm(l, s1.state)).toBeCloseTo(l.spasm!.afterNitrateRefMm, 6);
    // the true size: the reference after nitroglycerin is the distal reference the intravascular frames show
    expect(angiographicReferenceMm(l, s1.state)).toBeCloseTo(preImaging(l, "IVUS").distRefLumen, 2);
    expect(s1.log.map((e) => e.action)).toEqual(["Intracoronary nitroglycerin"]);
    expect(withNitrate(s1)).toBe(s1);
    expect(benchHookState(s1).nitrate).toBe(true);
    expect(benchHookState(s0).nitrate).toBe(false);
  });

  it("the bench screen shows the control at the image step and the reading once given", () => {
    const l = BENCH_BY_ID["small-distal-225"];
    const s0 = newSession(l.id);
    expect(bench(s0)).toContain("Give nitroglycerin");
    expect(bench(s0)).toContain('data-part="nitrate"');
    const s1 = withNitrate(s0);
    expect(bench(s1)).toContain(esc(nitrateReading(l, "guided")));
    expect(render(createElement(PciBench, { initial: { session: s1, mode: "exam" } }))).toContain(esc(nitrateReading(l, "exam")));
    // not on the later steps
    expect(bench({ ...s1, step: "prep", modality: "IVUS" })).not.toContain('data-part="nitrate"');
  });
});
