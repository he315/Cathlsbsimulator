// Tips from the inflation event sources (pci-indeflator), driven in the calcified mid-RCA scenario of the core
// pack. The case is opened at 'wire across' and a non-compliant balloon is put in the lesion: the state the plan
// calls 'balloon-in-lesion' (the core pack declares no such start yet, so the test builds it with the lab's own
// actions). Held at its rated burst pressure for 10 s the balloon keeps a waist and 'balloon-undilatable' is
// raised (pci-balloon-waist-stop); a predilatation whose drawn outcome is slow flow raises 'slow-flow'
// (pci-stent-not-into-no-reflow). Every waiting.ts entry naming this package becomes satisfiable, and the
// practice index lists the scenarios under the balloon lessons.
//   npx vitest run src/ui/lab/pciEvents/inflation.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { deflate, inflate, loadDevice, moveDevice, removeDevice, stepPci, type PciState } from "../../../simulation/angioPci";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import { imposePredilatationOutcome, predilatationStart, pullIndeflatorNegative, setIndeflator } from "../../../simulation/pci/actions/inflation";
import { PciLabSession } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext, sourceActive } from "../pciTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../content/practiceIndex";
import { launch as INDEFLATOR_LAUNCH } from "../../../content/practice/pci-indeflator.launch";
import { INFLATION_EVENT_HOLD_S, PCI_EVENT_SOURCES, raises as INFLATION_RAISES } from "./inflation";

const PKG = "pci-indeflator";

/** Every raises export the reachability report reads (the same globs as src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../pciEvents/*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
const declared = (skip?: RegExp): LabRaises[] =>
  Object.entries(RAISE_MODULES)
    .filter(([file, exp]) => !!exp && (!skip || !skip.test(file)))
    .flatMap(([, exp]) => (Array.isArray(exp) ? exp : [exp as LabRaises]))
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

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const source = (event: string) => PCI_EVENT_SOURCES.find((s) => s.event === event)!;

function lab(scenario: string, events?: string): PciLabSession {
  const r = resolvePciLaunch({ scenario, start: "wire-across", mode: "supervised", ...(events ? { events } : {}) });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

/** rca-calcified at 'wire across' with a 3.0 x 12 mm non-compliant balloon centred on the lesion ('balloon-in-lesion'). */
function balloonInLesion(): { x: PciLabSession; st: PciState } {
  const x = lab("rca-calcified");
  let st = loadDevice(x.st, "balloon", "non-compliant", 3.0, 12);
  st = moveDevice(st, x.g.lesion.centreMm - st.device!.centreMm);
  return { x, st };
}

function run(x: PciLabSession, st0: PciState, seconds: number): PciState {
  let st = st0;
  for (let t = 0; t < seconds - 1e-9; t += 0.25) st = stepPci(x.s, x.g, st, 0.25);
  return st;
}

describe("inflation event tips in rca-calcified (pci-indeflator)", () => {
  it("held at its rated burst pressure for 10 s the balloon keeps a waist: 'balloon-undilatable', and the tips include pci-balloon-waist-stop", () => {
    const { x, st: inLesion } = balloonInLesion();
    const rbp = DEVICE_BY_ID.nc.rbpAtm(3.0);
    // the action: screw to the rated burst pressure at 3 atm/s and hold
    let st = run(x, setIndeflator(inLesion, rbp, 3), 8);
    const early = pciTipContext({ ...x.snapshot(), state: st });
    expect(early.phase).toBe("lesion-prep");
    expect(sourceActive(source("balloon-undilatable"), { ...x.snapshot(), state: st })).toBe(false);
    st = run(x, st, 12);
    const snap = { ...x.snapshot(), state: st };
    expect(sourceActive(source("balloon-undilatable"), snap)).toBe(true);
    const ctx = pciTipContext(snap);
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-undilatable");
    expect(ids(ctx)).toContain("pci-balloon-waist-stop");
    // after the deflation this file's record holds it for INFLATION_EVENT_HOLD_S, then it lapses (base.ts keeps
    // the catalogue's own waist event while that balloon stays on the wire); with the balloon out it is gone
    st = run(x, pullIndeflatorNegative(x.s, x.g, st), 1);
    expect(sourceActive(source("balloon-undilatable"), { ...x.snapshot(), state: st })).toBe(true);
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).toContain("balloon-undilatable");
    st = run(x, st, INFLATION_EVENT_HOLD_S + 2);
    expect(sourceActive(source("balloon-undilatable"), { ...x.snapshot(), state: st })).toBe(false);
    st = removeDevice(st);
    expect(st.device).toBeNull();
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).not.toContain("balloon-undilatable");
  });

  it("after the deflation that recorded it, another balloon on the wire does not keep 'balloon-undilatable' (it has not been tried)", () => {
    const { x, st: inLesion } = balloonInLesion();
    const rbp = DEVICE_BY_ID.nc.rbpAtm(3.0);
    let st = run(x, setIndeflator(inLesion, rbp, 3), 20);
    st = run(x, pullIndeflatorNegative(x.s, x.g, st), 1);
    expect(st.log.some((e) => e.kind === "balloon-undilatable")).toBe(true);
    expect(sourceActive(source("balloon-undilatable"), { ...x.snapshot(), state: st })).toBe(true);
    // the same balloon swapped in place for a scoring balloon (no load record): not the balloon that was tried
    const swapped: PciState = { ...st, device: { ...st.device!, specId: "scoring", balloon: "scoring" } };
    expect(sourceActive(source("balloon-undilatable"), { ...x.snapshot(), state: swapped })).toBe(false);
    // the balloon emptied and removed, a scoring balloon loaded and centred within the event's hold
    st = run(x, st, 15);
    st = removeDevice(st);
    st = loadDevice(st, "balloon", "scoring", 3.0, 12);
    st = moveDevice(st, x.g.lesion.centreMm - st.device!.centreMm);
    expect(st.device!.specId).not.toBe("nc");
    const t0 = [...st.log].reverse().find((e) => e.kind === "balloon-undilatable")!.t;
    expect(st.t - t0).toBeLessThan(INFLATION_EVENT_HOLD_S);
    const snap = { ...x.snapshot(), state: st };
    expect(sourceActive(source("balloon-undilatable"), snap)).toBe(false);
    expect(pciTipContext(snap).events).not.toContain("balloon-undilatable");
  });

  it("a predilatation whose drawn outcome is slow flow raises 'slow-flow', and the tips include pci-stent-not-into-no-reflow", () => {
    const { x } = balloonInLesion();
    const before = predilatationStart(x.s, x.g, x.st, { outcome: "good" });
    const plain = pciTipContext({ ...x.snapshot(), state: before });
    expect(plain.phase).toBe("lesion-prep");
    expect(plain.events).not.toContain("slow-flow");
    expect(ids(plain)).not.toContain("pci-stent-not-into-no-reflow");
    // the action: the team's predilatation, its outcome drawn as slow flow
    const st = predilatationStart(x.s, x.g, x.st, { outcome: "slow-flow" });
    expect(st.slowFlow).toBe(true);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("slow-flow");
    expect(ids(ctx)).toContain("pci-stent-not-into-no-reflow");
    // the same imposed on a lesion already predilated by hand
    const hand = imposePredilatationOutcome(x.s, x.g, before, "slow-flow");
    expect(pciTipContext({ ...x.snapshot(), state: hand }).events).toContain("slow-flow");
  });

  it("a rupture above the drawn burst pressure raises 'balloon-rupture' while the ruptured balloon is on the wire", () => {
    const { x, st: inLesion } = balloonInLesion();
    const burst = inLesion.device!.burstAtm;
    let st = setIndeflator(inLesion, Math.min(30, burst + 1), 2);
    for (let t = 0; t < 20 && !st.balloonRupture; t += 0.25) st = stepPci(x.s, x.g, st, 0.25);
    expect(st.balloonRupture).toBe(true);
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).toContain("balloon-rupture");
  });

  it("an under-expanded stent (expansion ratio below 0.8) raises 'stent-underexpanded'; a recoiled aorto-ostial stent raises 'stent-recoil'", () => {
    const x = lab("rca-calcified");
    let st = loadDevice(x.st, "stent", "semi-compliant", 3.0, 23);
    st = moveDevice(st, x.g.lesion.centreMm - st.device!.centreMm);
    st = removeDevice(deflate(inflate(x.s, x.g, st, 9)));
    const p = st.stents[0];
    expect(p.atLesion / p.diameter).toBeLessThan(0.8);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("optimise");
    expect(ctx.events).toContain("stent-underexpanded");
    // recoil: a stent that expanded and lost diameter at an aorto-ostial lesion
    const recoiled: PciState = { ...st, stents: [{ ...p, atLesion: p.diameter * 0.85, recoilMm: 0.4 }] };
    const snap = { ...x.snapshot(), state: recoiled, start: { events: ["aorto-ostial-lesion" as const] } };
    const rctx = pciTipContext(snap);
    expect(rctx.events).toContain("stent-recoil");
    expect(rctx.events).not.toContain("stent-underexpanded");
  });
});

describe("reachability of the waiting tips (pci-indeflator)", () => {
  const all: LabRaises[] = declared();
  const without: LabRaises[] = declared(/(^|\/)inflation\.ts$/);
  // repair-bench-host-wiring: the lesion bench (benchTips.ts) also raises stent-recoil at optimise on an aorto-ostial lesion
  const withoutEither: LabRaises[] = declared(/(^|\/)(inflation|benchTips)\.ts$/);

  it("raises is derived from the sources and uses the shared vocabulary", () => {
    expect(INFLATION_RAISES.lab).toBe("pci");
    expect([...INFLATION_RAISES.events].sort()).toEqual([...new Set(PCI_EVENT_SOURCES.map((s) => s.event))].sort());
    expect(INFLATION_RAISES.events).toEqual(expect.arrayContaining(["balloon-undilatable", "balloon-rupture", "stent-underexpanded", "stent-recoil"]));
    expect(INFLATION_RAISES.phases).toEqual(expect.arrayContaining(["lesion-prep", "stent", "optimise"]));
    expect(all.length).toBe(without.length + 1);
  });

  it("every waiting.ts entry naming pci-indeflator becomes satisfiable, and the pci waiting count falls by at least their number", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === PKG);
    for (const id of entries.flatMap((w) => w.tips)) {
      const tip = LAB_TIPS.find((t) => t.id === id);
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip!.when, all), `${id} is satisfiable`).toBe(true);
    }
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    expect(deferred.map((d) => d.tipId)).toEqual(["pci-ostial-recoil"]);
    for (const d of deferred) {
      expect(satisfiable(d.when, all), `${d.tipId} with this package`).toBe(true);
      expect(satisfiable(d.when, withoutEither), `${d.tipId} without this package or the bench`).toBe(false);
      expect(satisfiable(d.when, without), `${d.tipId} through the bench`).toBe(true);
    }
    const pciWaiting = (list: readonly LabRaises[]) => LAB_TIPS.filter((t) => t.lab === "pci" && WAITING_TIPS.some((w) => w.tips.includes(t.id)) && !satisfiable(t.when, list)).length;
    expect(pciWaiting(without) - pciWaiting(all)).toBeGreaterThanOrEqual(entries.flatMap((w) => w.tips).length);
    // the deferred retargets ready for the catch-up fall by the entries naming this package
    const deferredBlocked = (list: readonly LabRaises[]) => DEFERRED_RETARGETS.filter((d) => LAB_TIPS.some((t) => t.id === d.tipId && t.lab === "pci") && !satisfiable(d.when, list)).length;
    expect(deferredBlocked(withoutEither) - deferredBlocked(all)).toBeGreaterThanOrEqual(deferred.length);
    // the tips this package targets are reachable from the PCI lab's raises
    for (const id of ["pci-balloon-waist-stop", "pci-stent-not-into-no-reflow", "pci-balloon-rupture-suction", "pci-balloon-watermelon", "pci-balloon-inflation-numbers", "pci-balloon-withdraw-deflated"]) {
      expect(satisfiable(LAB_TIPS.find((t) => t.id === id)!.when, all), id).toBe(true);
    }
  });
});

describe("practice links (pci-indeflator)", () => {
  it("practiceIndex lists rca-calcified and lad-focal under pm-prep-and-stent-balloon-choose, -balloon-inflate and -when from this package's .launch.ts", () => {
    expect(INDEFLATOR_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["pm-prep-and-stent-balloon-choose", "pm-prep-and-stent-balloon-inflate", "pm-prep-and-stent-when"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && /pci-indeflator\.launch\.ts$/.test(e.source));
      expect(mine.map((e) => e.scenario).sort(), lesson).toEqual(["lad-focal", "rca-calcified"]);
      for (const e of mine) {
        expect(e.start).toBe("wire-across");
        expect(e.params).toMatchObject({ scenario: e.scenario, start: "wire-across", mode: "guided" });
      }
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("pci-indeflator"))).toEqual([]);
  });

  it("each link opens the PCI lab with the wire across the lesion", () => {
    for (const l of INDEFLATOR_LAUNCH.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, start: l.start!, mode: "guided" });
      expect(r.problems).toEqual([]);
      const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
      sessions.push(x);
      expect(x.startDef.id).toBe("wire-across");
      expect(x.st.tipMm).toBeGreaterThan(x.g.lesion.endMm);
    }
  });
});
