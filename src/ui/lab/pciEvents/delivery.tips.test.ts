// Tips from device delivery (pci-device-delivery), driven in rca-stuck-stent from its 'stent-stuck-bend2'
// start with the hands on the devices (the PCI input target, no console): the stent pushed on at the bend
// raises stent-uncrossable and shows pci-delivery-withdraw-coaxial; after it is withdrawn, a non-compliant
// balloon pushed at the lesion edge raises balloon-uncrossable and shows pci-delivery-small-bites. The radial
// route through the tortuous subclavian raises subclavian-tortuosity (this package's event source). Every
// waiting.ts entry naming this package is satisfiable from what the PCI lab raises.
//
// The start's equipment (the stent at the bend, the guide backed out) is applied here through the session's
// action path with applyStartSetup, as startPci will once it calls it (the package report names the change
// to src/simulation/pci/actions/scenario.ts).
//   npx vitest run src/ui/lab/pciEvents/delivery.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PciLabSession } from "../../pci/PciLabSession";
import { PciInputTarget } from "../../pci/pciInputTarget";
import { resolvePciLaunch } from "../../pci/launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { applyStartSetup, backloadDevice, checkLabel, prepareDevice, requestDevice, setValve } from "../../../simulation/angioPci";
import { applyDeliveryAction } from "../../pci/inputBindings/support";
import { pciTipContext } from "../pciTips";
import { PCI_EVENT_SOURCES, raises as DELIVERY_RAISES, radialSubclavianTortuosity } from "./delivery";

const PKG = "pci-device-delivery";

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
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** rca-stuck-stent at 'stent-stuck-bend2' with its equipment, and an input target (no console open). */
function rig() {
  const r = resolvePciLaunch({ scenario: "rca-stuck-stent", start: "stent-stuck-bend2", mode: "guided" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  expect(x.startDef.id).toBe("stent-stuck-bend2");
  expect(applyDeliveryAction(x, "load-device", (st) => applyStartSetup(x.s, x.g, st, x.startDef))).toBe(true);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  expect(x.openConsoleId()).toBeNull();
  return { x, t };
}

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((tip) => tip.id);
const ctxOf = (x: PciLabSession) => pciTipContext(x.snapshot());
const distalOf = (x: PciLabSession) => x.st.device!.centreMm + x.st.device!.lengthMm / 2;

describe("device delivery tips in rca-stuck-stent from 'stent-stuck-bend2' (pci-device-delivery)", () => {
  it("opens with the stent stuck: phase stent, stent-uncrossable, poor-guide-support and subclavian-tortuosity", () => {
    const { x } = rig();
    const ctx = ctxOf(x);
    expect(x.st.device?.kind).toBe("stent");
    expect(x.st.guide.depthMm).toBeLessThan(0);
    expect(ctx.phase).toBe("stent");
    for (const e of ["stent-uncrossable", "poor-guide-support", "subclavian-tortuosity"]) expect(ctx.events, e).toContain(e);
    expect(ids(ctx)).toContain("pci-gx-radial-long-cylinder");
  });

  it("after the push that raises 'stent-uncrossable' the tips include pci-delivery-withdraw-coaxial; after the push that raises 'balloon-uncrossable', pci-delivery-small-bites", () => {
    const { x, t } = rig();
    // eased back off the bend: the stall is gone
    expect(t.hand({ kind: "push", device: "stent", mm: -4 })).toBe(true);
    const off = ctxOf(x);
    expect(off.events).not.toContain("stent-uncrossable");
    expect(ids(off)).not.toContain("pci-delivery-withdraw-coaxial");
    // the action: the hands push the stent at the bend again until it stops
    const d0 = distalOf(x);
    for (let i = 0; i < 8; i++) t.hand({ kind: "push", device: "stent", mm: 1 });
    expect(distalOf(x)).toBeGreaterThan(d0);
    const stuck = ctxOf(x);
    expect(stuck.events).toContain("stent-uncrossable");
    expect(ids(stuck)).toContain("pci-delivery-withdraw-coaxial");
    // the guide made coaxial over the wire, the stent comes out (pulled back into the guide by hand, intact) and a
    // non-compliant balloon goes in from the valve
    expect(x.engageGuide()).toBe(true);
    for (let i = 0; i < 10; i++) t.hand({ kind: "push", device: "stent", mm: -10 });
    expect(x.st.device!.deformed ?? null).toBeNull();
    // pulling the stent back against the calcium drew the guide in: the hands draw it back to the ostium
    expect(x.st.guide.depthMm).toBeGreaterThan(1);
    for (let i = 0; i < 20 && x.st.guide.depthMm > 0.5; i++) t.perform("catheter", "withdraw", 1);
    expect(x.st.guide.engaged).toBe(true);
    expect(x.removeDevice()).toBe(true);
    expect(applyDeliveryAction(x, "load-device", (st) => setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "nc", 3.0, 12)))), true))).toBe(true);
    for (let i = 0; i < 200 && x.st.device!.centreMm + 6 < x.g.lesion.startMm - 10; i++) t.hand({ kind: "push", device: "balloon", mm: 10 });
    const before = ctxOf(x);
    expect(before.events).not.toContain("balloon-uncrossable");
    // every tip that applies (not only the first 20): stalled with the guide still seated (the stalled bite backs it
    // out progressively, guide.ts MP_SHAFT_SLACK_MM) the context stays lesion-prep, where the calcium tips rank first
    expect(ids(before, LAB_TIPS.length)).not.toContain("pci-delivery-small-bites");
    // the action: small pushes on the balloon at the lesion edge until it stops
    for (let i = 0; i < 40 && !(ctxOf(x).events ?? []).includes("balloon-uncrossable"); i++) t.hand({ kind: "push", device: "balloon", mm: 1 });
    const ctx = ctxOf(x);
    expect(ctx.events).toContain("balloon-uncrossable");
    expect(ids(ctx, LAB_TIPS.length)).toContain("pci-delivery-small-bites");
    // the guide has started to back out without leaving the ostium
    expect(x.st.guide.depthMm).toBeLessThan(0);
    expect(x.st.guide.engaged).toBe(true);
    // the pushes went through the delivery physics (the balloon was not carried through the stall)
    expect(distalOf(x)).toBeLessThan(x.g.lesion.endMm);
  });
});

describe("reachability of the waiting tips (pci-device-delivery)", () => {
  const all: LabRaises[] = declared();
  /** what the PCI lab raised before this package's event source */
  const without: LabRaises[] = declared(/(^|\/)delivery\.ts$/);

  it("raises is derived from the sources and uses the shared vocabulary", () => {
    expect(DELIVERY_RAISES.lab).toBe("pci");
    expect([...DELIVERY_RAISES.events].sort()).toEqual([...new Set(PCI_EVENT_SOURCES.map((s) => s.event))].sort());
    expect(DELIVERY_RAISES.events).toContain("subclavian-tortuosity");
    expect(all.length).toBe(without.length + 1);
    // the radial route matters: the same anatomy by the femoral route does not raise it
    const snap = { state: {} as never, lesion: { vessel: "RCA", startMm: 50, endMm: 60 } };
    expect(radialSubclavianTortuosity({ ...snap, scenario: { target: { kind: "calcified" }, accessRoute: "radial-right", anatomy: { variants: ["tortuous-subclavian"] } } as never })).toBe(true);
    expect(radialSubclavianTortuosity({ ...snap, scenario: { target: { kind: "calcified" }, accessRoute: "femoral", anatomy: { variants: ["tortuous-subclavian"] } } as never })).toBe(false);
  });

  it(`every waiting.ts entry naming ${PKG} is satisfiable from what the PCI lab raises`, () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    expect(waiting.length + deferred.length).toBeGreaterThan(0);
    for (const id of waiting) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(TIP_BY_ID[id].when, all), `${id} is satisfiable`).toBe(true);
    }
    for (const d of deferred) expect(satisfiable(d.when, all), `${d.tipId} (retarget) is satisfiable`).toBe(true);
    const pciWaiting = (list: readonly LabRaises[]) => LAB_TIPS.filter((t) => t.lab === "pci" && waiting.includes(t.id) && !satisfiable(t.when, list)).length;
    expect(pciWaiting(all)).toBe(0);
    // they were already satisfiable from the base and guide sources before this file (extension-in-place,
    // aorto-ostial-lesion, pressure-damped, catheter-too-deep): the count does not fall because of it
    console.info(`${PKG}: waiting tips ${waiting.join(", ")}; deferred ${deferred.map((d) => d.tipId).join(", ")}; unsatisfiable without this file: ${pciWaiting(without)}`);
  });
});
