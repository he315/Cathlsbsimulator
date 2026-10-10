// Tips from the base PCI event sources (pci-tip-context), driven from scenarios of the core pack
// (src/simulation/pci/scenarios/packs/core.launch.ts): the case events at finish (cto, bifurcation) and
// the device events at lesion preparation (a balloon that will not cross, a balloon that will not
// dilate). The tips moved here from pci-scenario-registry and pci-device-catalogue wait on this
// package's event source in waiting.ts; no entry names either of those packages any more.
//   npx vitest run src/ui/lab/pciEvents/base.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { TIP_BY_ID, tipScore, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { launch as CORE_LAUNCH } from "../../../simulation/pci/scenarios/packs/core.launch";
import { advanceDevice, backloadDevice, checkLabel, engageGuide, inflate, loadDevice, moveDevice, moveWire, pinWire, prepareDevice, requestDevice, setValve, startPci, type PciState } from "../../../simulation/angioPci";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import { PciLabSession } from "../../pci/PciLabSession";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext, type PciTipSnapshot } from "../pciTips";
import { DEVICE_WIRE_MARGIN_MM, STALL_ZONE_MM, raises } from "./base";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(id: string): PciLabSession {
  expect(CORE_LAUNCH.scenarios!.some((s) => s.id === id), `${id} is a core scenario`).toBe(true);
  const x = new PciLabSession({ scenarioId: id, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(tip: LabTip, list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  const w = tip.when;
  return any(w.phase, u("phases")) && any(w.event, u("events")) && (w.requires ?? []).every((e) => u("events").has(e)) && any(w.imaging, u("imaging")) && !w.technique?.length && !w.procedure?.length && !w.route?.length;
}

describe("case events at finish (moved from pci-scenario-registry)", () => {
  it("rca-cto: 'cto' is held from the start, and opening the finish step shows pci-post-ecg-complex", () => {
    const x = lab("rca-cto");
    expect(pciTipContext(x.snapshot()).events).toContain("cto");
    expect(ids(pciTipContext(x.snapshot()))).not.toContain("pci-post-ecg-complex");
    // the action: the operator opens the sign-out (finish) step
    x.setFinishStep(true);
    const ctx = pciTipContext(x.snapshot());
    expect(ctx.phase).toBe("finish");
    expect(ctx.events).toContain("cto");
    expect(ids(ctx)).toContain("pci-post-ecg-complex");
    // finishing the case keeps it
    x.finish();
    expect(ids(pciTipContext(x.snapshot()))).toContain("pci-post-ecg-complex");
  });

  it("a bifurcation target (the lad-focal lesion just after the first diagonal, declared as a bifurcation site) shows pci-post-ecg-bifurcation at finish", () => {
    // No core scenario declares a bifurcation yet (pci-bifurcation-provisional adds them); the event comes
    // from the target lesion's declared site, as it will in those packs.
    const x = lab("lad-focal");
    const def = x.resolved.def;
    const bif = { ...def, lesions: def.lesions.map((l, i) => (i === 0 ? { ...l, sites: [...(l.sites ?? []), "bifurcation" as const] } : l)) };
    x.setFinishStep(true);
    const plain = pciTipContext(x.snapshot());
    expect(plain.events).not.toContain("bifurcation");
    expect(ids(plain)).not.toContain("pci-post-ecg-bifurcation");
    const ctx = pciTipContext({ ...x.snapshot(), definition: bif });
    expect(ctx.phase).toBe("finish");
    expect(ctx.events).toContain("bifurcation");
    expect(ids(ctx)).toContain("pci-post-ecg-bifurcation");
  });
});

describe("device events at lesion preparation (moved from pci-device-catalogue)", () => {
  /** rca-calcified with the wire across and pinned, on a strong-support guide (as the catalogue test). */
  function across(x: PciLabSession): PciState {
    const st = startPci({ def: x.resolved.def, scenario: x.s }, x.g, "wire-across");
    return pinWire({ ...st, guide: { ...st.guide, id: "AL1" } }, true);
  }

  it("rca-calcified: a non-compliant balloon pushed until it stops at the tight calcified lesion raises balloon-uncrossable and shows pci-eqb-standard-first", () => {
    const x = lab("rca-calcified");
    let st: PciState = { ...across(x), severity: 92, resistance: 0.62 };
    st = setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "nc", 3.0, 15)))), true);
    st = advanceDevice(x.s, x.g, st, 1);
    // push in short steps until a push no longer advances it (the operator sees it stop; the guide takes the push)
    let stopped = false;
    for (let i = 0; i < 400 && !stopped; i++) {
      const was = st.device!.centreMm;
      st = advanceDevice(x.s, x.g, st, 0.5);
      stopped = st.device!.centreMm <= was + 0.05;
    }
    expect(stopped).toBe(true);
    // the push against the calcified lesion moved the guide back out of the ostium (the lesion load exceeds its back-up)
    const pushed = pciTipContext({ ...x.snapshot(), state: st });
    expect(st.guide.engaged).toBe(false);
    expect(pushed.phase).toBe("guide");
    expect(pushed.events).toEqual(expect.arrayContaining(["guide-backout", "poor-guide-support", "balloon-uncrossable"]));
    expect(ids(pushed)).toContain("pci-mon-guide-backout");
    // the operator re-engages the guide over the wire: back at lesion preparation with a balloon that will not cross
    st = engageGuide(x.s, st);
    expect(st.guide.engaged).toBe(true);
    // half a minute later the back-out has lapsed (TRANSIENT_HOLD_S); the balloon still sits stalled at the lesion
    st = { ...st, t: st.t + 31 };
    const snap: PciTipSnapshot = { ...x.snapshot(), state: st };
    const ctx = pciTipContext(snap);
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-uncrossable");
    // the event integration: the tip's trigger matches this context and the tip is among those that apply
    const tip = TIP_BY_ID["pci-eqb-standard-first"];
    expect(tipScore(tip, ctx), JSON.stringify(tip.when)).not.toBeNull();
    expect(ids(ctx, 200)).toContain("pci-eqb-standard-first");
    // the acceptance check: within the top 20. Its rank depends on how many other PCI tips match
    // lesion-prep with calcified-lesion or balloon-uncrossable; a new tip there can push it out of the
    // top 20 although the checks above still hold.
    expect(ids(ctx)).toContain("pci-eqb-standard-first");
    // pulled back off the lesion, the balloon is no longer stalled there
    const back = moveDevice(st, -12);
    expect(pciTipContext({ ...snap, state: back }).events).not.toContain("balloon-uncrossable");
  });

  it("lad-focal: a balloon or stent held at the distal wire limit inside the lesion (too little wire beyond it) is not uncrossable", () => {
    const x = lab("lad-focal");
    const L = x.g.lesion;
    // the wire across, then pulled back until its tip lies just beyond the lesion end
    let base: PciState = pinWire(startPci({ def: x.resolved.def, scenario: x.s }, x.g, "wire-across"), true);
    base = moveWire(x.s, x.g, base, L.endMm + 0.6 - base.tipMm);
    expect(base.tipMm).toBeGreaterThan(L.endMm);
    expect(base.tipMm - DEVICE_WIRE_MARGIN_MM).toBeLessThan(L.endMm);
    // both the delivery path (advanceDevice) and the assisted path (moveDevice, which writes a 'move'
    // record for every push, so repeated pushes at the limit read as a push that did not move it)
    const cases = [
      ["sc", 2.5, 15, "balloon-uncrossable", "advance"],
      ["des", 3.0, 18, "stent-uncrossable", "advance"],
      ["sc", 2.5, 15, "balloon-uncrossable", "assisted"],
      ["des", 3.0, 18, "stent-uncrossable", "assisted"],
    ] as const;
    for (const [spec, d, len, event, path] of cases) {
      let st = setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(base, spec, d, len)))), true);
      st = advanceDevice(x.s, x.g, st, 1);
      // push in short steps until the engine stops the device at the wire limit, then push again
      for (let i = 0; i < 400; i++) st = path === "advance" ? advanceDevice(x.s, x.g, st, 0.5) : moveDevice(st, 0.5);
      const distal = st.device!.centreMm + st.device!.lengthMm / 2;
      expect(distal, `${spec} ${path}`).toBeGreaterThanOrEqual(L.startMm - STALL_ZONE_MM);
      expect(distal, `${spec} ${path}`).toBeLessThan(L.endMm);
      expect(distal, `${spec} ${path}`).toBeCloseTo(st.tipMm - DEVICE_WIRE_MARGIN_MM, 1);
      const snap: PciTipSnapshot = { ...x.snapshot(), state: st };
      expect(pciTipContext(snap).events, `${spec} ${path}`).not.toContain(event);
      // the wire advanced but the device not yet pushed again: still nothing says the lesion stops it
      const wired = moveWire(x.s, x.g, st, 20);
      expect(wired.tipMm, `${spec} ${path}`).toBeGreaterThan(st.tipMm + 5);
      expect(pciTipContext({ ...snap, state: wired }).events, `${spec} ${path}`).not.toContain(event);
    }
  });

  it("rca-calcified: a non-compliant balloon held at its rated pressure with a waist raises balloon-undilatable and shows pci-eqb-know-the-chart", () => {
    const x = lab("rca-calcified");
    let st: PciState = { ...across(x), resistance: 0.85 };
    st = loadDevice(st, "balloon", "non-compliant", 3.0, 15);
    st = moveDevice(st, x.g.lesion.centreMm - st.device!.centreMm);
    const rbp = DEVICE_BY_ID.nc.rbpAtm(3.0);
    st = inflate(x.s, x.g, st, rbp);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-undilatable");
    expect(ids(ctx)).toContain("pci-eqb-know-the-chart");
    // a balloon below its rated pressure is not yet undilatable
    let low: PciState = loadDevice({ ...across(x), resistance: 0.85 }, "balloon", "non-compliant", 3.0, 15);
    low = moveDevice(low, x.g.lesion.centreMm - low.device!.centreMm);
    low = inflate(x.s, x.g, low, 8);
    expect(pciTipContext({ ...x.snapshot(), state: low }).events).not.toContain("balloon-undilatable");
  });
});

describe("waiting.ts", () => {
  it("no entry names pci-scenario-registry or pci-device-catalogue; their tips wait on this package and are satisfiable from base.ts's raises", () => {
    for (const pkg of ["pci-scenario-registry", "pci-device-catalogue"]) {
      expect(WAITING_TIPS.filter((w) => w.raisedBy === pkg), pkg).toEqual([]);
      expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === pkg), pkg).toEqual([]);
    }
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "pci-tip-context").flatMap((w) => w.tips);
    for (const id of ["pci-post-ecg-complex", "pci-post-ecg-bifurcation", "pci-eqb-know-the-chart", "pci-eqb-standard-first"]) expect(mine, id).toContain(id);
    for (const id of ["pci-post-ecg-complex", "pci-eqb-know-the-chart", "pci-eqb-standard-first"]) expect(satisfiable(TIP_BY_ID[id], [raises]), id).toBe(true);
    // the bifurcation tip becomes satisfiable once a registered scenario declares a bifurcation site
    // (REGISTERED_CASE_EVENTS derives from the registry); no core scenario does, the wiring pack's
    // lcx-om-tortuous does (pci-wire-microcatheter)
    expect(satisfiable(TIP_BY_ID["pci-post-ecg-bifurcation"], [{ ...raises, events: raises.events.filter((e) => e !== "bifurcation") }])).toBe(false);
    expect(satisfiable(TIP_BY_ID["pci-post-ecg-bifurcation"], [raises])).toBe(true);
  });
});
