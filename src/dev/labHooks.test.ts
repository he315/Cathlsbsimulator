// Dev hooks (found-lab-session-plumbing): window.__lab[name] in DEV, nothing when disabled, and the
// hooks surviving the diagnostic lab assigning its own session to window.__lab.
//   npx vitest run src/dev/labHooks.test.ts
import { describe, expect, it, vi } from "vitest";
import { registerLabHook, registerLabHookOn, type LabHook } from "./labHooks";

const hook = (tag: string, steps: number[] = []): LabHook => ({
  context: () => ({ lab: "pci", phase: "wire", events: ["wire-not-crossing"] }),
  tips: () => [`tip-${tag}`],
  state: () => ({ tag }),
  step: (s) => {
    steps.push(s);
  },
});

type W = { __lab?: Record<string, unknown> & { [k: string]: unknown }; __labHooks?: Record<string, LabHook> };

describe("registerLabHookOn", () => {
  it("installs __lab[name] with context, tips, state and step", () => {
    const w: W = {};
    const steps: number[] = [];
    registerLabHookOn(w, "pci", hook("a", steps), true);
    const h = w.__lab!.pci as LabHook;
    expect(h.context()).toEqual({ lab: "pci", phase: "wire", events: ["wire-not-crossing"] });
    expect(h.tips()).toEqual(["tip-a"]);
    expect(h.state()).toEqual({ tag: "a" });
    h.step!(2);
    expect(steps).toEqual([2]);
    expect(Object.keys(w.__labHooks!)).toEqual(["pci"]);
  });

  it("installs nothing when disabled (a production build)", () => {
    const w: W = {};
    const off = registerLabHookOn(w, "pci", hook("a"), false);
    off();
    expect(w.__lab).toBeUndefined();
    expect(w.__labHooks).toBeUndefined();
  });

  it("keeps the hooks when a lab assigns its own object to __lab, without shadowing its properties", () => {
    const w: W = {};
    registerLabHookOn(w, "pci", hook("a"), true);
    const session = { startInjection: () => true, step: (dt: number) => dt };
    (w as Record<string, unknown>).__lab = session; // what the diagnostic lab does in DEV
    expect(w.__lab).toBe(session);
    expect((w.__lab!.pci as LabHook).tips()).toEqual(["tip-a"]);
    // a hook named like one of the session's own members does not replace it
    registerLabHookOn(w, "step", hook("b"), true);
    expect(w.__lab!.step).toBe(session.step);
    expect((w.__labHooks!.step as LabHook).tips()).toEqual(["tip-b"]);
  });

  it("warns once when a hook is left off __lab because the session has that name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const w: W = {};
      const session = { startInjection: () => true, engine: { tag: "session" } };
      (w as Record<string, unknown>).__lab = session;
      registerLabHookOn(w, "engine", hook("e"), true);
      registerLabHookOn(w, "pci", hook("p"), true); // re-attaches every hook, engine included
      expect(w.__lab!.engine).toBe(session.engine);
      expect((w.__labHooks!.engine as LabHook).tips()).toEqual(["tip-e"]);
      const msgs = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('"engine"'));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]).toContain("__labHooks");
    } finally {
      warn.mockRestore();
    }
  });

  it("with no session assigned, __lab is a holder of the hooks, not a session", () => {
    const w: W = {};
    const off = registerLabHookOn(w, "pci", hook("a"), true);
    expect(w.__lab).toBeTruthy();
    expect(typeof w.__lab!.startInjection).toBe("undefined");
    off();
    expect(w.__lab).toBeUndefined();
  });

  it("adds hooks to an object already on __lab", () => {
    const session = { startInjection: () => true };
    const w: W = { __lab: session };
    registerLabHookOn(w, "case", hook("c"), true);
    expect(w.__lab).toBe(session);
    expect((w.__lab!.case as LabHook).state()).toEqual({ tag: "c" });
  });

  it("removes a hook, and a stale remover does not remove its replacement", () => {
    const w: W = {};
    const offA = registerLabHookOn(w, "pci", hook("a"), true);
    registerLabHookOn(w, "pci", hook("b"), true);
    offA();
    expect((w.__lab!.pci as LabHook).tips()).toEqual(["tip-b"]);
    const offC = registerLabHookOn(w, "bench", hook("c"), true);
    offC();
    expect(w.__lab!.bench).toBeUndefined();
    expect(Object.keys(w.__labHooks!)).toEqual(["pci"]);
  });
});

describe("__lab without a lab session", () => {
  it("is undefined once every hook is removed, so a missing session is still detectable", () => {
    const w: W = {};
    const off = registerLabHookOn(w, "pci", hook("a"), true);
    expect(w.__lab).toBeDefined();
    off();
    expect(w.__lab).toBeUndefined();
    // a session assigned later is still returned, and gets the hooks registered after it
    const session = { startInjection: () => true };
    (w as Record<string, unknown>).__lab = session;
    expect(w.__lab).toBe(session);
    registerLabHookOn(w, "bench", hook("b"), true);
    expect((w.__lab!.bench as LabHook).tips()).toEqual(["tip-b"]);
  });

  it("a hook removed while a session is assigned is gone from the holder too", () => {
    const w: W = {};
    registerLabHookOn(w, "keep", hook("k"), true);
    const offA = registerLabHookOn(w, "pci", hook("a"), true);
    const session = { startInjection: () => true };
    (w as Record<string, unknown>).__lab = session;
    offA();
    (w as Record<string, unknown>).__lab = undefined; // the lab unmounts
    expect(w.__lab!.pci).toBeUndefined();
    expect((w.__lab!.keep as LabHook).tips()).toEqual(["tip-k"]);
  });
});

describe("registerLabHook", () => {
  it("installs on globalThis under vitest (a DEV build) and returns a remover", () => {
    const off = registerLabHook("labhooks-test", hook("g"));
    const g = globalThis as unknown as W;
    expect((g.__lab!["labhooks-test"] as LabHook).tips()).toEqual(["tip-g"]);
    off();
    expect(g.__lab?.["labhooks-test"]).toBeUndefined();
  });
});
