// pci-tip-context: the PCI lab's tip hook. The context comes from the session's snapshot through
// pciTipContext, the tips through the shared useContextTips (the visibility policy), and each change
// of the context is written to the run's recorder as one 'tip-context' event.
//   npx vitest run src/ui/pci/usePciTips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import Reconciler from "react-reconciler";
import { LegacyRoot } from "react-reconciler/constants";
import * as tipsModule from "../../content/lab/tips";
import type { LabContext } from "../../content/lab/tips";
import type { RecordedEvent } from "../../mentor/types";
import { loadTips, type TipPolicy } from "../lab/useLabTips";
import { pciTipContext } from "../lab/pciTips";
import { useSeriesStore } from "../../state/useSeriesStore";
import { PciLabSession } from "./PciLabSession";
import { TIP_CONTEXT_EVENT, tipContextRecorder, usePciTips, type PciTips } from "./usePciTips";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

describe("tipContextRecorder", () => {
  it("writes one 'tip-context' event per change of the context, with the lab and patient clocks", () => {
    const events: RecordedEvent[] = [];
    let wall = 3;
    const record = tipContextRecorder({ recorder: { event: (e) => events.push(e) }, wall: () => wall, engine: { time: 40 } });
    const a: LabContext = { lab: "pci", phase: "guide", events: ["cto"], vessel: "RCA" };
    expect(record(a)).toBe(true);
    expect(record({ ...a, events: ["cto"] })).toBe(false); // same content
    expect(record(null)).toBe(false);
    wall = 9;
    expect(record({ ...a, phase: "wire" })).toBe(true);
    expect(events.map((e) => [e.kind, e.tWall, e.tPatient, e.ext, (e.data as unknown as LabContext).phase])).toEqual([
      [TIP_CONTEXT_EVENT, 3, 40, true, "guide"],
      [TIP_CONTEXT_EVENT, 9, 40, true, "wire"],
    ]);
    expect((events[0].data as unknown as LabContext).events).toEqual(["cto"]);
  });
});

// A renderer with no host elements, enough to run a hook across re-renders in the node environment
// (as src/ui/lab/useContextTips.test.ts).
function hookRenderer() {
  const noop = () => undefined;
  const r = Reconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: false,
    createInstance: () => ({}),
    createTextInstance: () => ({}),
    appendInitialChild: noop,
    appendChild: noop,
    appendChildToContainer: noop,
    removeChild: noop,
    removeChildFromContainer: noop,
    insertBefore: noop,
    insertInContainerBefore: noop,
    finalizeInitialChildren: () => false,
    prepareUpdate: () => null,
    commitUpdate: noop,
    commitTextUpdate: noop,
    shouldSetTextContent: () => false,
    getRootHostContext: () => ({}),
    getChildHostContext: (c: object) => c,
    getPublicInstance: (i: object) => i,
    prepareForCommit: () => null,
    resetAfterCommit: noop,
    preparePortalMount: noop,
    clearContainer: noop,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    getCurrentEventPriority: () => 16,
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur: noop,
    afterActiveInstanceBlur: noop,
    prepareScopeUpdate: noop,
    getInstanceFromScope: () => null,
    detachDeletedInstance: noop,
    now: Date.now,
  } as never);
  const root = r.createContainer({}, LegacyRoot, null, false, null, "", noop, null);
  return (el: ReturnType<typeof createElement>) => r.updateContainer(el, root, null, noop);
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("usePciTips", () => {
  it("gives the session's context and tips under the policy, and records each context change", async () => {
    await loadTips();
    const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
    sessions.push(x);
    const seen: PciTips[] = [];
    const Probe = (p: { policy: TipPolicy }) => {
      seen.push(usePciTips(x, p.policy));
      return null;
    };
    const render = hookRenderer();
    const guided: TipPolicy = { mode: "guided", helpAskedAt: null };
    render(createElement(Probe, { policy: guided }));
    await tick();
    const first = seen[seen.length - 1];
    expect(first.context).toEqual(pciTipContext(x.snapshot()));
    expect(first.context?.phase).toBe("guide");
    expect(first.visible).toBe(true);
    expect(first.tips.map((t) => t.id)).toEqual(tipsModule.tipsFor(first.context!, 5).map((t) => t.id));
    const recorded = () => x.recorder.events.filter((e) => e.kind === TIP_CONTEXT_EVENT);
    expect(recorded().map((e) => (e.data as unknown as LabContext).phase)).toEqual(["guide"]);
    // the case brief opens: the session publishes, the context moves to 'plan' and is recorded once
    x.openModal("prebrief");
    render(createElement(Probe, { policy: guided }));
    await tick();
    expect(seen[seen.length - 1].context?.phase).toBe("plan");
    render(createElement(Probe, { policy: guided }));
    await tick();
    expect(recorded().map((e) => (e.data as unknown as LabContext).phase)).toEqual(["guide", "plan"]);
    // an exam shows no tips; the context is still recorded
    render(createElement(Probe, { policy: { mode: "exam", helpAskedAt: null } }));
    await tick();
    const exam = seen[seen.length - 1];
    expect(exam.visible).toBe(false);
    expect(exam.tips).toEqual([]);
    expect(exam.context?.phase).toBe("plan");
  });
});
