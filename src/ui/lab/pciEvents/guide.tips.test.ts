// Tips from the guide engagement event sources (pci-guide-engagement), driven in lad-focal from its
// 'guide-in-root' start with the hands on the guide (the PCI input target, no console): seating the guide
// deep until the trace damps shows the damped-guide tip, turning it against the wall shows the
// wire-direction tip, waiting near the ostium without engaging shows the engagement-failure tip and
// over-rotating the shaft the kink tip; every waiting.ts entry naming this package is satisfiable from what
// the PCI lab now raises.
//   npx vitest run src/ui/lab/pciEvents/guide.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PciLabSession } from "../../pci/PciLabSession";
import { PciInputTarget } from "../../pci/pciInputTarget";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { GUIDE_ENGAGE_FAIL_S, GUIDE_NON_COAXIAL } from "../../../simulation/pci/guide";
import { pciTipContext } from "../pciTips";
import { PCI_EVENT_SOURCES, raises as GUIDE_RAISES } from "./guide";

const PKG = "pci-guide-engagement";

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

function rig(scenarioId = "lad-focal") {
  const x = new PciLabSession({ scenarioId, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "catheter", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  expect(x.startDef.id).toBe("guide-in-root");
  return { x, t };
}

const run = (x: PciLabSession, seconds: number, dt = 0.1) => {
  for (let s = 0; s < seconds - 1e-9; s += dt) x.step(dt);
};
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((tip) => tip.id);
/** The tip panel's context: the session's snapshot (usePciTips), with the guide pressure trace. */
const ctxOf = (x: PciLabSession) => pciTipContext(x.snapshot());

/** The hands engage the guide from the root: a 1 mm push every half second. */
function engageByHand(x: PciLabSession, t: PciInputTarget) {
  for (let i = 0; i < 60 && !x.st.guide.engaged; i++) {
    t.perform("catheter", "advance", 1);
    run(x, 0.5);
  }
  expect(x.st.guide.engaged).toBe(true);
}

describe("guide engagement tips in lad-focal from 'guide-in-root' (pci-guide-engagement)", () => {
  it("after the deep seat that raises 'pressure-damped', the tips include pci-guide-damped-work-outside", () => {
    const { x, t } = rig();
    expect(ctxOf(x).phase).toBe("guide");
    engageByHand(x, t);
    run(x, 2);
    const before = ctxOf(x);
    expect(before.events).not.toContain("pressure-damped");
    expect(ids(before)).not.toContain("pci-guide-damped-work-outside");
    // the action: the guide pushed in until the trace damps
    for (let i = 0; i < 16 && !["damped", "wedged"].includes(x.snapshot().guidePressure); i++) {
      t.perform("catheter", "advance", 1);
      run(x, 1.5);
    }
    const ctx = ctxOf(x);
    expect(["guide", "wire"]).toContain(ctx.phase);
    expect(ctx.events).toContain("pressure-damped");
    expect(ctx.events).toContain("catheter-too-deep");
    expect(ids(ctx)).toContain("pci-guide-damped-work-outside");
    // drawn back until the trace recovers, the event goes
    for (let i = 0; i < 20 && x.st.guide.depthMm > 1; i++) t.perform("catheter", "withdraw", 1);
    run(x, 3);
    expect(ctxOf(x).events).not.toContain("pressure-damped");
  });

  it("after the turn that raises 'non-coaxial', the tips include pci-guide-wire-direction", () => {
    const { x, t } = rig();
    engageByHand(x, t);
    const before = ctxOf(x);
    expect(before.phase).toBe("wire");
    expect(before.events).not.toContain("non-coaxial");
    // the action: the guide's hub turned until its tip sits against the wall
    for (let i = 0; i < 10 && x.st.guide.coaxial >= GUIDE_NON_COAXIAL; i++) t.perform("catheter", "torque", 0.15);
    expect(x.st.guide.engaged).toBe(true);
    const ctx = ctxOf(x);
    expect(ctx.phase).toBe("wire");
    expect(ctx.events).toContain("non-coaxial");
    expect(ids(ctx)).toContain("pci-guide-wire-direction");
  });

  it("near the ostium without engaging for 45 s raises 'engage-fail' (pci-gx-engage-when-guide-cannot); over-rotation raises 'catheter-kink' (pci-guide-kink-untwist)", () => {
    const { x, t } = rig();
    // engaged (the assisted console's engagement), then drawn back out: the guide hangs near the ostium
    x.engageGuide();
    for (let i = 0; i < 20 && x.st.guide.engaged; i++) t.perform("catheter", "withdraw", 1);
    expect(x.st.guide.engaged).toBe(false);
    expect(x.st.guide.zone).toBe("near");
    expect(ctxOf(x).events).not.toContain("engage-fail");
    run(x, GUIDE_ENGAGE_FAIL_S + 1);
    const ctx = ctxOf(x);
    expect(ctx.phase).toBe("guide");
    expect(ctx.events).toContain("engage-fail");
    expect(ids(ctx, 40)).toContain("pci-gx-engage-when-guide-cannot");
    // the hub turned on and on in one direction
    for (let i = 0; i < 40 && !x.st.guide.kinked; i++) t.perform("catheter", "torque", Math.PI);
    const kinked = ctxOf(x);
    expect(kinked.events).toContain("catheter-kink");
    expect(kinked.events).toContain("torque-not-transmitted");
    expect(ids(kinked, 40)).toContain("pci-guide-kink-untwist");
  });

  it("an aorto-ostial target is a case event", () => {
    const ctx = pciTipContext({ state: rig("rca-calcified").x.st, lesion: { vessel: "RCA", startMm: 2, endMm: 10 } });
    expect(ctx.events).toContain("aorto-ostial-lesion");
    expect(pciTipContext({ state: rig("rca-calcified").x.st, lesion: { vessel: "RCA", startMm: 40, endMm: 50 } }).events).not.toContain("aorto-ostial-lesion");
  });
});

describe("reachability of the waiting tips (pci-guide-engagement)", () => {
  const all: LabRaises[] = declared();
  /** what the PCI lab raised before this package's event source */
  const without: LabRaises[] = declared(/(^|\/)guide\.ts$/);

  it("raises is derived from the sources and uses the shared vocabulary", () => {
    expect(GUIDE_RAISES.lab).toBe("pci");
    expect(GUIDE_RAISES.phases).toEqual(["guide"]);
    expect([...GUIDE_RAISES.events].sort()).toEqual([...new Set(PCI_EVENT_SOURCES.map((s) => s.event))].sort());
    for (const e of ["engage-fail", "catheter-too-deep", "non-coaxial", "conus-selective", "catheter-kink", "torque-not-transmitted"]) expect(GUIDE_RAISES.events).toContain(e);
  });

  it(`every waiting.ts entry naming ${PKG} becomes satisfiable, so the pci waiting count falls by at least their number`, () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === PKG);
    expect(entries.length).toBeGreaterThan(0);
    const tips = entries.flatMap((w) => w.tips);
    expect(all.length).toBe(without.length + 1);
    const newly: string[] = [];
    for (const id of tips) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip.when, all), `${id} is satisfiable`).toBe(true);
      if (!satisfiable(tip.when, without)) newly.push(id);
    }
    expect(newly.sort()).toEqual([...tips].sort());
    const pciWaiting = (list: readonly LabRaises[]) => LAB_TIPS.filter((t) => t.lab === "pci" && WAITING_TIPS.some((w) => w.tips.includes(t.id)) && !satisfiable(t.when, list)).length;
    expect(pciWaiting(without) - pciWaiting(all)).toBeGreaterThanOrEqual(tips.length);
  });
});
