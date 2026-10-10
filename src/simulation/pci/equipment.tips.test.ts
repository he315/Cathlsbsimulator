// Tip integration of the device catalogue. The PCI event-source registry (src/ui/lab/pciEvents/) is not
// built yet, so this drives the current PCI tip context (src/ui/lab/pciTips.ts) and adds the events the
// catalogue maps the active device onto (deviceTipEvents), as an event source will.
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_TIPS, tipScore, tipsFor, type LabContext } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { pciTipContext } from "../../ui/lab/pciTips";
import { advanceDevice, backloadDevice, checkLabel, inflate, loadDevice, moveDevice, pinWire, prepareDevice, requestDevice, setValve, type PciState } from "../angioPci";
import { DEVICE_BY_ID, DEVICE_EVENTS, chartDiameter, deviceTipEvents } from "./equipment";
import { setup, start, wireToTarget } from "./testSetup";

const ID = "rca-calcified";

function across() {
  const su = setup(ID);
  let st: PciState = start(su, { guide: "AL1" });
  st = pinWire(wireToTarget(su, st, 30), true);
  return { su, st };
}

function ctxWith(st: PciState, su: ReturnType<typeof setup>, extra: ReturnType<typeof deviceTipEvents>): LabContext {
  const ctx = pciTipContext(st, { vessel: su.g.lesion.vessel, startMm: su.g.lesion.startMm, endMm: su.g.lesion.endMm });
  return { ...ctx, events: [...(ctx.events ?? []), ...extra] };
}

describe("device catalogue tips in the calcified RCA scenario", () => {
  it("a non-compliant balloon that stalls at a tight calcified lesion makes pci-eqb-standard-first reachable at lesion-prep", () => {
    const { su } = across();
    let { st } = across();
    st = { ...st, severity: 92, resistance: 0.62 };
    st = requestDevice(st, "nc", 3.0, 15);
    st = checkLabel(st);
    st = prepareDevice(st);
    st = backloadDevice(st);
    st = setValve(st, true);
    st = advanceDevice(su.s, su.g, st, 1);
    // push until the balloon stops advancing, then stop pushing (as an operator would, before the guide backs out)
    for (let i = 0; i < 70; i++) {
      const was = st.device!.centreMm;
      const next = advanceDevice(su.s, su.g, st, 2);
      if (!next.guide.engaged || next.device!.centreMm <= was + 0.05) break;
      st = next;
    }
    const dev = st.device!;
    const distal = dev.centreMm + dev.lengthMm / 2;
    const stalled = distal >= su.g.lesion.startMm - 2 && distal < su.g.lesion.endMm;
    expect(stalled).toBe(true);
    const ctx = ctxWith(st, su, deviceTipEvents({ spec: DEVICE_BY_ID.nc, diameter: 3.0, inArtery: dev.centreMm > 0, active: false, stalledAtLesion: stalled }));
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-uncrossable");
    // The tip applies and no tip matches this context more specifically: the only tips that outscore it do so
    // by the 0.5 tone bonus of a caution or bailout tip. Many PCI tips tie on phase and event; score ties are
    // broken by trigger specificity and then registry order (tips.ts compareTied), which keeps it in the top 20.
    const tip = LAB_TIPS.find((t) => t.id === "pci-eqb-standard-first")!;
    expect(tip).toBeDefined();
    const toneBonus = (t: (typeof LAB_TIPS)[number]) => (t.tone === "caution" || t.tone === "bailout" ? 0.5 : 0);
    const topMatch = Math.max(...LAB_TIPS.map((t) => { const sc = tipScore(t, ctx); return sc === null ? -1 : sc - toneBonus(t); }));
    expect(tipScore(tip, ctx)).toBe(topMatch);
    expect(tipScore(tip, ctx)).toBe(5); // phase +1, event +4
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-eqb-standard-first");
  });

  it("a non-compliant balloon held at its rated pressure with a waist makes pci-eqb-know-the-chart reachable at lesion-prep", () => {
    const { su } = across();
    let { st } = across();
    st = { ...st, resistance: 0.85 };
    st = loadDevice(st, "balloon", "non-compliant", 3.0, 15);
    const centre = (su.g.lesion.startMm + su.g.lesion.endMm) / 2;
    st = moveDevice(st, centre - st.device!.centreMm);
    const rbp = DEVICE_BY_ID.nc.rbpAtm(3.0);
    st = inflate(su.s, su.g, st, rbp);
    // the operator sees the waist on the inflated balloon; the engine reports it in its event log
    const waist = st.events.slice(-6).some((e) => /waist persists/.test(e.text));
    expect(waist).toBe(true);
    const ctx = ctxWith(st, su, deviceTipEvents({ spec: DEVICE_BY_ID.nc, diameter: 3.0, inArtery: true, active: true, atm: rbp, waist }));
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-undilatable");
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("pci-eqb-know-the-chart");
    // the chart the tip tells the operator to read: a 3.0 mm non-compliant balloon at its rated pressure
    expect(chartDiameter(DEVICE_BY_ID.nc, 3.0, rbp)).toBeCloseTo(3.19, 2);
  });

  it("no waiting.ts entry names pci-device-catalogue, and every device event is a tip-vocabulary name", () => {
    const mine = [...WAITING_TIPS.filter((w) => w.raisedBy === "pci-device-catalogue"), ...DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-device-catalogue")];
    expect(mine).toEqual([]);
    // every device event the catalogue can produce is a name of the tip vocabulary
    expect(DEVICE_EVENTS.length).toBeGreaterThan(0);
    for (const e of DEVICE_EVENTS) expect(LAB_EVENTS).toContain(e);
    // the two equipment tips this package exercises wait on the PCI tip context, where the dependency is recorded
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === "pci-tip-context").flatMap((w) => w.tips);
    expect(waiting).toContain("pci-eqb-know-the-chart");
    expect(waiting).toContain("pci-eqb-standard-first");
  });
});
