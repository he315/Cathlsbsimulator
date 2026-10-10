// Tips from the wire and microcatheter event sources (pci-wire-microcatheter), driven in the tortuous
// circumflex scenario of the wiring pack (src/simulation/pci/scenarios/packs/wiring.launch.ts): the wire
// pushed on into a small distal vessel shows the collimation tip, a forced, caught stiff tip under the
// intima shows the true-lumen tip once named, and every waiting.ts entry naming this package is
// satisfiable from what the PCI lab now raises.
//   npx vitest run src/ui/lab/pciEvents/wire.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { launch as WIRING_LAUNCH } from "../../../simulation/pci/scenarios/packs/wiring.launch";
import { moveWire, setWireKind, shapeTip, torqueWire, type PciState } from "../../../simulation/angioPci";
import { injectMicrocatheter, loadMicrocatheter, moveMicrocatheter, removeMicrocatheter, torqueMicrocatheter } from "../../../simulation/pci/actions/wire";
import { inject } from "../../../simulation/pci/actions/imaging";
import { takeOff } from "../../../simulation/pci/geometry";
import { PciLabSession } from "../../pci/PciLabSession";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext } from "../pciTips";
import { MICRO_NEEDED_STALLS, PCI_EVENT_SOURCES, raises as WIRE_RAISES, stallsWithoutMicro } from "./wire";

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

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(id: string, scenarioIdFromPack = true): PciLabSession {
  if (scenarioIdFromPack) expect(WIRING_LAUNCH.scenarios!.some((s) => s.id === id), `${id} is in the wiring pack`).toBe(true);
  const x = new PciLabSession({ scenarioId: id, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(when: LabTip["when"], list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  return any(when.phase, u("phases")) && any(when.event, u("events")) && (when.requires ?? []).every((e) => u("events").has(e)) && any(when.imaging, u("imaging")) && !when.technique?.length && !when.procedure?.length && !when.route?.length;
}

/** Into the circumflex with the guide engaged (the 'guide-engaged' start of the session's own state). */
function inCircumflex(x: PciLabSession, st0: PciState = x.st): PciState {
  const g = x.g;
  let st: PciState = { ...st0, guide: { ...st0.guide, engaged: true }, wire: { ...st0.wire, guideEngaged: true } };
  const lcx = g.byName.get("LCx")!;
  for (let i = 0; i < 40 && st.route[st.route.length - 1] !== "LCx"; i++) {
    st = turnTo(st, takeOff(g, lcx).azimuth);
    st = moveWire(x.s, g, st, 2);
  }
  return st;
}

function turnTo(st0: PciState, az: number): PciState {
  let st = st0;
  for (let i = 0; i < 60; i++) {
    const e = Math.atan2(Math.sin(az - st.wire.tip), Math.cos(az - st.wire.tip));
    if (Math.abs(e) < 0.1) break;
    st = torqueWire(st, Math.sign(e) * Math.min(0.35, Math.abs(e) + 0.05));
  }
  return st;
}

describe("wire event tips in lcx-om-tortuous", () => {
  it("after the push that raises 'wire-distal-position', the tips include pci-mon-wire-tip-collimation", () => {
    const x = lab("lcx-om-tortuous");
    let st = inCircumflex(x);
    expect(st.route).toContain("LCx");
    const before = pciTipContext({ ...x.snapshot(), state: st });
    expect(before.events).not.toContain("wire-distal-position");
    expect(ids(before)).not.toContain("pci-mon-wire-tip-collimation");
    // the action: the wire pushed on into the small distal circumflex
    for (let i = 0; i < 120 && !st.wire.distal.inDanger; i++) {
      const b = st.tipMm;
      st = moveWire(x.s, x.g, st, 2);
      if (st.route[st.route.length - 1] !== "LCx" || st.tipMm <= b) st = turnTo(moveWire(x.s, x.g, st, -4), st.wire.tip + Math.PI);
    }
    expect(st.wire.distal.inDanger).toBe(true);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.events).toContain("wire-distal-position");
    expect(ids(ctx)).toContain("pci-mon-wire-tip-collimation");
  });

  it("after the forced push that raises 'wire-subintimal' (a long bend caught on the wall, a stiff tip), the tips include pci-wire-confirm-true-lumen once it is named", () => {
    const x = lab("lcx-om-tortuous");
    let st = setWireKind(x.st, "polymer-tapered");
    st = shapeTip(st, { primaryDeg: 60, primaryMm: 4, secondaryDeg: 0, secondaryMm: 0 });
    st = inCircumflex(x, st);
    // push on until the long bend catches the wall, then force it
    for (let i = 0; i < 80 && !st.wire.wallCaught && !st.wire.subintimal; i++) st = moveWire(x.s, x.g, st, 1);
    expect(st.wire.wallCaught ?? st.wire.subintimal).not.toBeNull();
    const caught = pciTipContext({ ...x.snapshot(), state: st, recognised: ["wire-subintimal"] });
    expect(ids(caught)).not.toContain("pci-wire-confirm-true-lumen");
    // the action: forcing the caught stiff tip
    for (let i = 0; i < 3 && !st.wire.subintimal; i++) st = moveWire(x.s, x.g, st, 2);
    expect(st.wire.subintimal).not.toBeNull();
    expect(st.log.some((r) => r.kind === "wire-subintimal")).toBe(true);
    // the operator sees the tip's free, out-of-step motion (what the lab shows), not the word 'subintimal'
    expect(st.events.some((e) => /unusually freely/.test(e.text))).toBe(true);
    expect(st.events.some((e) => /ectopics/.test(e.text))).toBe(false);
    expect(st.events.some((e) => /subintimal/i.test(e.text))).toBe(false);
    // behind the recognition gate until named
    const unnamed = pciTipContext({ ...x.snapshot(), state: st });
    expect(unnamed.events).not.toContain("wire-subintimal");
    const ctx = pciTipContext({ ...x.snapshot(), state: st, recognised: ["wire-subintimal"] });
    expect(ctx.phase).toBe("wire");
    expect(ctx.events).toContain("wire-subintimal");
    expect(ids(ctx)).toContain("pci-wire-confirm-true-lumen");
  });

  it("three stalled pushes at an occlusion with a workhorse raise 'microcatheter-needed'; withdrawing a used microcatheter over a short wire raises 'microcatheter-removal', loading one does not", () => {
    const x = lab("rca-cto", false);
    let st: PciState = { ...x.st, guide: { ...x.st.guide, engaged: true }, wire: { ...x.st.wire, guideEngaged: true } };
    for (let i = 0; i < 200 && !(st.route.includes("RCA") && st.tipMm >= x.g.lesion.startMm - 0.1); i++) st = moveWire(x.s, x.g, st, 1);
    // a continued push (hand steps against the cap) is one stall episode, not one per step
    for (let i = 0; i < 2; i++) st = moveWire(x.s, x.g, st, 0.5);
    expect(stallsWithoutMicro(st)).toBe(1);
    // each push from a free tip (after easing back) that stalls again is a new one
    for (let k = 0; k < MICRO_NEEDED_STALLS; k++) {
      st = moveWire(x.s, x.g, st, -2);
      st = moveWire(x.s, x.g, st, 3);
    }
    expect(stallsWithoutMicro(st)).toBeGreaterThanOrEqual(MICRO_NEEDED_STALLS);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.events).toContain("microcatheter-needed");
    expect(ids(ctx, 40)).toContain("pci-microcath-when-needed");
    // loading a microcatheter starts the count again
    st = loadMicrocatheter(st, "mc-large");
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).not.toContain("microcatheter-needed");
    // a microcatheter just loaded is parked in the guide: no removal yet
    expect(st.wire.micro!.tipMm).toBeLessThanOrEqual(0);
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).not.toContain("microcatheter-removal");
    st = moveMicrocatheter(x.s, x.g, st, 300);
    st = moveMicrocatheter(x.s, x.g, st, -300);
    const removal = pciTipContext({ ...x.snapshot(), state: st });
    expect(removal.events).toContain("microcatheter-removal");
    st = removeMicrocatheter(x.s, x.g, st, { technique: "trap", balloon: { diameterMm: 2.5, lengthMm: 20, atm: 18 } });
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).toContain("microcatheter-removal");
  });

  it("a support wire's pseudolesions, once an injection shows them, raise 'new-narrowing-tortuous'", () => {
    const x = lab("lcx-om-tortuous");
    let st = inCircumflex(x);
    for (let i = 0; i < 200 && st.tipMm < x.g.lesion.endMm + 20; i++) {
      st = moveWire(x.s, x.g, st, 1);
      if (st.route[st.route.length - 1] !== "LCx" || st.wire.fold) st = turnTo(moveWire(x.s, x.g, st, -5), st.wire.tip + Math.PI);
    }
    expect(st.wire.crossed).toBe(true);
    st = loadMicrocatheter(st, "mc-large");
    st = moveMicrocatheter(x.s, x.g, st, 400);
    st = setWireKind(st, "support", { g: x.g });
    expect(st.wiring?.pseudo).not.toBeNull();
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).not.toContain("new-narrowing-tortuous");
    // the pseudolesions lie along the stiff shaft, proximal to the microcatheter tip: a selective injection
    // through it fills only the vessel beyond its tip and does not show them
    expect(st.wiring!.pseudo!.sites.every((p) => p.atMm < st.wire.micro!.tipMm)).toBe(true);
    st = injectMicrocatheter(x.s, x.g, { ...st, t: st.t + 1 });
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).not.toContain("new-narrowing-tortuous");
    // a guide injection does
    st = inject(x.s, { ...st, t: st.t + 1 });
    expect(pciTipContext({ ...x.snapshot(), state: st }).events).toContain("new-narrowing-tortuous");
  });

  it("an over-rotated microcatheter is logged but raises no entrapment event (the entrapment bail-outs do not apply)", () => {
    const x = lab("lcx-om-tortuous");
    let st = inCircumflex(x);
    st = loadMicrocatheter(st, "mc-large");
    for (let i = 0; i < 12; i++) st = torqueMicrocatheter(st, 2 * Math.PI);
    expect(st.wire.micro!.damaged).toBe(true);
    expect(st.events.some((e) => /over-rotated/.test(e.text))).toBe(true);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.events).not.toContain("equipment-entrapment");
    for (const id of ["pci-gx-fracture-retrieval", "pci-balloon-trap-in-guide"]) expect(ids(ctx, 40)).not.toContain(id);
    expect(WIRE_RAISES.events).not.toContain("equipment-entrapment");
  });
});

describe("reachability of the waiting tips (pci-wire-microcatheter)", () => {
  const all: LabRaises[] = declared();
  /**
   * what the PCI lab raised before this package's event source; the later flow source (pci-flow-closure,
   * ./flow.ts) is left out too, since it also raises new-narrowing
   */
  const without: LabRaises[] = declared(/(^|\/)(wire|flow)\.ts$/);

  it("raises is derived from the sources and uses the shared vocabulary", () => {
    expect(WIRE_RAISES.lab).toBe("pci");
    expect([...WIRE_RAISES.events].sort()).toEqual([...new Set(PCI_EVENT_SOURCES.map((s) => s.event))].sort());
    for (const e of ["microcatheter-needed", "microcatheter-removal", "wire-out-of-guide", "second-wire-with-device", "new-narrowing-tortuous"]) expect(WIRE_RAISES.events).toContain(e);
  });

  it("every waiting.ts entry naming pci-wire-microcatheter becomes satisfiable, so the pci waiting count falls by at least their number", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === "pci-wire-microcatheter");
    expect(entries.length).toBeGreaterThan(0);
    const tips = entries.flatMap((w) => w.tips);
    expect(all.length).toBe(without.length + 2);
    const newly: string[] = [];
    for (const id of tips) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip.when, all), `${id} is satisfiable`).toBe(true);
      if (!satisfiable(tip.when, without)) newly.push(id);
    }
    // the tips this package's events make reachable (the rest were already reachable through the base sources)
    expect(newly.sort()).toEqual(["pci-cto-antegrade-trap-exchange", "pci-eqb-trapping-balloon-size", "pci-lima-pseudolesion", "pci-microcath-no-overspin", "pci-microcath-when-needed"].sort());
    // the waiting count for the pci lab: tips listed and not yet satisfiable falls by every entry of this package
    const pciWaiting = (list: readonly LabRaises[]) =>
      LAB_TIPS.filter((t) => t.lab === "pci" && WAITING_TIPS.some((w) => w.tips.includes(t.id)) && !satisfiable(t.when, list)).length;
    expect(pciWaiting(without) - pciWaiting(all)).toBeGreaterThanOrEqual(newly.length);
    expect(pciWaiting(all)).toBeLessThanOrEqual(pciWaiting(without) - newly.length);
    for (const id of tips) expect(LAB_TIPS.filter((t) => t.lab === "pci" && t.id === id && !satisfiable(t.when, all))).toEqual([]);
  });

  it("the deferred retargets naming pci-wire-microcatheter are satisfiable under their new triggers", () => {
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-wire-microcatheter");
    expect(deferred.length).toBeGreaterThan(0);
    for (const d of deferred) expect(satisfiable(d.when, all), d.tipId).toBe(true);
  });
});
