// Tips on two rails (pci-two-rail-engine). The plan asks for scenario lad-isr at start wire-under-strut; no
// scenario pack declares it, so the bifurcation is the core pack's lad-focal with its target declared a
// bifurcation site (as base.tips.test.ts does, until pci-bifurcation-provisional adds its packs): the second
// wire in the second diagonal (D2, just beyond the lesion), the main-vessel stent deployed over it.
//
// The action that raises 'side-branch-compromise' is that deployment: the side-branch exposure
// (complications/sideBranch.ts, with the carina shift on two rails) draws the compromise of D2. The base
// source names it only once recognised, and a named complication puts the tip context in the complication
// phase, where the rewiring and kissing tips (phase optimise) do not show. What the operator sees, the jailed
// branch pinched on the next injection, is railBranchCompromiseSeen (actions/wire.ts); a two-rail event
// source raising 'side-branch-compromise' from it (in the optimise phase, as pressureWire.ts does in the
// physiology phase) brings pci-bif-rewire-distal-cell and pci-bif-kissing-size. That source belongs in
// src/ui/lab/pciEvents/, outside this package's files; the test gives it to pciTipContext directly.
//   npx vitest run src/ui/lab/pciEvents/twoRail.tips.test.ts
import { describe, expect, it } from "vitest";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PCI_DEF_BY_ID } from "../../../simulation/pci/scenarios/registry";
import { initialCx } from "../../../simulation/complications/engine";
import { deflate, inflate, inject, loadDevice, moveDevice, moveWire, removeDevice, type PciState } from "../../../simulation/angioPci";
import { loadSecondWire, railBranchCompromiseSeen, setActiveRail } from "../../../simulation/pci/actions/wire";
import { railsOf } from "../../../simulation/pci/state";
import { takeOff } from "../../../simulation/pci/geometry";
import { setup, start, turnTipTo, wireToTarget } from "../../../simulation/pci/testSetup";
import { pciTipContext, type PciTipSnapshot } from "../pciTips";
import { PCI_EVENT_SOURCES, type PciEventSource } from "./index";
import { raisesFrom } from "./base";

const su = setup("lad-focal");
const { s, g } = su;
const SB = "D2";
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The two-rail source the plan's event file would export. */
const TWO_RAIL_SOURCE: PciEventSource = { event: "side-branch-compromise", active: (snap) => railBranchCompromiseSeen(snap.state) };

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(tip: LabTip, list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  const w = tip.when;
  return any(w.phase, u("phases")) && any(w.event, u("events")) && (w.requires ?? []).every((e) => u("events").has(e)) && any(w.imaging, u("imaging")) && !w.technique?.length && !w.procedure?.length && !w.route?.length;
}

/** Steer the active rail's wire into `branch` and `beyondMm` along it (as src/simulation/pci/twoRail.test.ts does). */
function wireToBranch(st0: PciState, branch: string, beyondMm = 12): PciState {
  let st = st0;
  const child = g.byName.get(branch)!;
  const parent = child.parent!.name;
  const at = g.byName.get(parent)!.pathMm[child.parent!.index];
  for (let guard = 0; guard < 400; guard++) {
    const cur = st.route[st.route.length - 1];
    if (cur === branch && st.tipMm >= at + beyondMm) break;
    if (cur !== branch && cur !== parent && cur !== "LM") {
      st = moveWire(s, g, st, -4);
      continue;
    }
    if (cur === "LM") st = turnTipTo(st, takeOff(g, g.byName.get(parent)!).azimuth);
    else if (cur === parent) {
      if (st.tipMm > at + 0.5) {
        st = moveWire(s, g, st, -Math.min(6, st.tipMm - at + 2));
        continue;
      }
      if (st.tipMm < at - 8) {
        const v = g.byName.get(parent)!;
        const ahead = (g.children.get(parent) ?? []).filter((c) => v.pathMm[c.parent!.index] > st.tipMm && c.name !== branch).sort((a, b) => a.parent!.index - b.parent!.index)[0];
        if (ahead && v.pathMm[ahead.parent!.index] < at) st = turnTipTo(st, takeOff(g, ahead).azimuth + Math.PI);
        else st = turnTipTo(st, takeOff(g, child).azimuth);
      } else st = turnTipTo(st, takeOff(g, child).azimuth);
    }
    st = moveWire(s, g, st, 1.5);
  }
  return st;
}

/** Wire 1 across the lesion, wire 2 steered into D2. */
function twoWires(): PciState {
  const st = setActiveRail(loadSecondWire(wireToTarget(su, start(su))), 1);
  return setActiveRail(wireToBranch(st, SB), 0);
}

/** The main-vessel stent over the lesion and D2's origin (2.5 x 20 mm at 12 atm), the balloon out, then a check injection. */
function deployMv(st0: PciState): PciState {
  let st = loadDevice(st0, "stent", "semi-compliant", 2.5, 20);
  st = moveDevice(st, 68 - st.device!.centreMm);
  st = inflate(s, g, st, 12);
  st = removeDevice({ ...deflate(st), valveOpen: true });
  return inject(s, st);
}

describe("two rails: side-branch compromise at the jailed diagonal and the bifurcation tips", () => {
  const base = twoWires();
  // the complication engine's own draw decides the compromise; the first seed of its generator that draws it
  let seed = -1;
  let stented: PciState | null = null;
  for (let k = 0; k < 200 && !stented; k++) {
    const st = deployMv({ ...base, cx: initialCx(`two-rail-tips:${k}:cx`) });
    if (st.cx.list.some((c) => c.kind === "side-branch" && c.vessel === SB)) {
      seed = k;
      stented = st;
    }
  }
  const def = PCI_DEF_BY_ID["lad-focal"];
  const bif = { ...def, lesions: def.lesions.map((l, i) => (i === 0 ? { ...l, sites: [...(l.sites ?? []), "bifurcation" as const] } : l)) };
  const snap = (st: PciState, o: Partial<PciTipSnapshot> = {}): PciTipSnapshot => ({ t: st.t, state: st, lesion: g.lesion, definition: bif, ...o });

  it("the deployment over the jailed D2 wire draws the compromise for some seed of the complication engine", () => {
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(railsOf(stented!)[1].jailed?.branch).toBe(SB);
    expect(railBranchCompromiseSeen(stented!)).toBe(true);
  });

  it("before the stent: optimise tips absent; after it, the two-rail source raises 'side-branch-compromise' in the optimise phase", () => {
    const pre = pciTipContext(snap(base), [...PCI_EVENT_SOURCES, TWO_RAIL_SOURCE]);
    expect(pre.events).not.toContain("side-branch-compromise");
    expect(ids(pre)).not.toContain("pci-bif-rewire-distal-cell");
    const ctx = pciTipContext(snap(stented!), [...PCI_EVENT_SOURCES, TWO_RAIL_SOURCE]);
    expect(ctx.phase).toBe("optimise");
    expect(ctx.events).toEqual(expect.arrayContaining(["bifurcation", "side-branch-compromise"]));
    const tips = ids(ctx);
    expect(tips).toContain("pci-bif-rewire-distal-cell");
    expect(tips).toContain("pci-bif-kissing-size");
  });

  it("with the registered sources alone the compromise is named only once recognised, and then the phase is 'complication'", () => {
    const plain = pciTipContext(snap(stented!));
    expect(plain.events).not.toContain("side-branch-compromise");
    const named = pciTipContext(snap(stented!, { recognised: true }));
    expect(named.events).toContain("side-branch-compromise");
    expect(named.phase).toBe("complication");
    expect(ids(named)).not.toContain("pci-bif-rewire-distal-cell");
  });

  it("no waiting.ts entry names pci-two-rail-engine; the two tips are satisfiable from a two-rail source's raises with a bifurcation case", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === "pci-two-rail-engine")).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-two-rail-engine")).toEqual([]);
    const two = raisesFrom([TWO_RAIL_SOURCE], { phases: ["optimise"], events: ["bifurcation"] });
    for (const id of ["pci-bif-rewire-distal-cell", "pci-bif-kissing-size"]) {
      expect(satisfiable(TIP_BY_ID[id], [two]), id).toBe(true);
      expect(satisfiable(TIP_BY_ID[id], [{ ...two, events: two.events.filter((e) => e !== "side-branch-compromise") }]), id).toBe(false);
    }
  });
});
