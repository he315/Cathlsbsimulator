// The drill under React's StrictMode (src/main.tsx wraps the app in it): a launch that mounts the trainer,
// such as openSim('pressure', { set: 'damping' }) from a lesson, starts the drill even though the dev build
// unmounts and remounts the section once, after the launch has been taken. Rendered with a minimal
// in-memory host on react-reconciler in a concurrent root, which double-invokes effects under StrictMode as
// react-dom's createRoot does; the monitor is stubbed (it draws on a canvas).
//   npx vitest run src/ui/sections/PressureTrainer.strict.test.ts
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { StrictMode, createElement, useEffect } from "react";
import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import { useLabLaunchStore } from "../../state/useLabLaunchStore";

vi.mock("../lab/HaemoMonitor", () => ({ default: () => null }));

interface HostNode {
  type: string;
  props: Record<string, unknown>;
  children: HostNode[];
  text?: string;
}
const detach = (p: HostNode, c: HostNode) => {
  const i = p.children.indexOf(c);
  if (i >= 0) p.children.splice(i, 1);
};
const insert = (p: HostNode, c: HostNode, before: HostNode) => {
  detach(p, c);
  p.children.splice(p.children.indexOf(before), 0, c);
};
const host = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,
  createInstance: (type: string, props: Record<string, unknown>): HostNode => ({ type, props, children: [] }),
  createTextInstance: (text: string): HostNode => ({ type: "#text", props: {}, children: [], text }),
  appendInitialChild: (p: HostNode, c: HostNode) => void p.children.push(c),
  appendChild: (p: HostNode, c: HostNode) => void p.children.push(c),
  appendChildToContainer: (p: HostNode, c: HostNode) => void p.children.push(c),
  insertBefore: insert,
  insertInContainerBefore: insert,
  removeChild: detach,
  removeChildFromContainer: detach,
  finalizeInitialChildren: () => false,
  prepareUpdate: () => true,
  commitUpdate: (n: HostNode, _u: unknown, _t: string, _o: unknown, props: Record<string, unknown>) => void (n.props = props),
  commitTextUpdate: (n: HostNode, _o: string, text: string) => void (n.text = text),
  resetTextContent: () => {},
  shouldSetTextContent: () => false,
  getRootHostContext: () => ({}),
  getChildHostContext: (c: unknown) => c,
  getPublicInstance: (n: HostNode) => n,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},
  clearContainer: (p: HostNode) => void (p.children = []),
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  getCurrentEventPriority: () => DefaultEventPriority,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  detachDeletedInstance: () => {},
  hideInstance: () => {},
  unhideInstance: () => {},
  hideTextInstance: () => {},
  unhideTextInstance: () => {},
};
const renderer = Reconciler(host as unknown as Parameters<typeof Reconciler>[0]);

const text = (n: HostNode): string => (n.type === "#text" ? (n.text ?? "") : n.children.map(text).join(" "));

type DrillHook = { state: () => { phase: string; set: string; index: number; total: number } };
const g = globalThis as unknown as Record<string, unknown>;
const saved: Record<string, unknown> = {};

beforeAll(() => {
  for (const k of ["window", "requestAnimationFrame", "cancelAnimationFrame", "IS_REACT_ACT_ENVIRONMENT"]) saved[k] = g[k];
  // the section's timers and its DEV hook live on window; the trace player asks for animation frames
  g.window = globalThis;
  g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.IS_REACT_ACT_ENVIRONMENT = false;
});
afterAll(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete g[k];
    else g[k] = v;
  }
});

async function until(ok: () => boolean, ms: number): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (ok()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return ok();
}

describe("PressureTrainer under StrictMode", () => {
  it("a pending launch (set 'damping') mounted under StrictMode reaches the first item, not a permanent 'Preparing'", async () => {
    const { default: PressureTrainer } = await import("./PressureTrainer");
    let effectRuns = 0;
    // counts mount-effect runs: two under StrictMode's double invocation shows the remount really happened
    function Probe() {
      useEffect(() => {
        effectRuns++;
      }, []);
      return null;
    }
    useLabLaunchStore.getState().request("pressure", { set: "damping", seed: "strict-1" });
    const container: HostNode = { type: "root", props: {}, children: [] };
    const root = renderer.createContainer(container, 1, null, false, null, "", () => {}, null);
    renderer.updateContainer(createElement(StrictMode, null, createElement(Probe), createElement(PressureTrainer)), root, null, null);

    const hook = () => (g.window as Record<string, unknown>).__pressureDrill as DrillHook | undefined;
    const reached = await until(() => hook()?.state().phase === "item", 15000);
    expect(effectRuns).toBe(2);
    expect(useLabLaunchStore.getState().pending.pressure).toBeUndefined();
    expect(reached).toBe(true);
    const st = hook()!.state();
    expect(st.set).toBe("damping");
    expect(st.index).toBe(0);
    expect(text(container)).not.toContain("Preparing the next trace");
    expect(text(container)).toContain("What is the trace?");

    renderer.updateContainer(null, root, null, null);
    await until(() => container.children.length === 0, 2000);
  }, 30000);
});
