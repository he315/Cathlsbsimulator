import { describe, it, expect, beforeAll } from "vitest";

// The UI store remembers navigation in localStorage; give node a working one so the test can read
// back exactly what was saved.
const mem = new Map<string, string>();
beforeAll(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (k: string) => mem.get(k) ?? null,
    key: (i: number) => [...mem.keys()][i] ?? null,
    removeItem: (k: string) => void mem.delete(k),
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
  };
});

const savedNav = () => [...mem.entries()].filter(([k]) => k.endsWith("nav")).map(([, v]) => v);

describe("lab launch store", () => {
  it("openSim('haemo', { scenario: 'pe-massive' }) is taken once, then null, and never reaches NavMemory", async () => {
    const { useUiStore } = await import("./useUiStore");
    const { useLabLaunchStore, takeLaunch } = await import("./useLabLaunchStore");
    useUiStore.getState().openSim("haemo", { scenario: "pe-massive" });
    expect(useUiStore.getState().section).toBe("haemo");
    expect(useUiStore.getState().simTab).toBe("haemo");
    expect(useLabLaunchStore.getState().peek("haemo")).toEqual({ scenario: "pe-massive" });
    expect(useLabLaunchStore.getState().take("haemo")).toEqual({ scenario: "pe-massive" });
    expect(useLabLaunchStore.getState().take("haemo")).toBeNull();
    expect(takeLaunch("haemo")).toBeNull();
    const nav = savedNav();
    expect(nav.length).toBeGreaterThan(0);
    for (const v of nav) {
      expect(v).not.toContain("pe-massive");
      expect(v).not.toContain("scenario");
    }
  });

  it("the latest link wins, a plain open clears a stale request, and take returns a copy", async () => {
    const { useUiStore } = await import("./useUiStore");
    const { useLabLaunchStore } = await import("./useLabLaunchStore");
    const s = () => useLabLaunchStore.getState();
    useUiStore.getState().openSim("iabp", { scenario: "a", mode: "guided" });
    expect(s().peek("iabp")).toEqual({ scenario: "a", mode: "guided" });
    useUiStore.getState().openSim("iabp");
    expect(s().peek("iabp")).toBeNull();
    useUiStore.getState().openSim("iabp", { scenario: "a" });
    useUiStore.getState().openSim("impella", { scenario: "b" });
    expect(s().peek("iabp")).toBeNull();
    expect(Object.keys(s().pending)).toEqual(["impella"]);
    const p = s().take("impella")!;
    p.scenario = "changed";
    expect(s().take("impella")).toBeNull();
    const seq = s().seq;
    s().request("ecmo", { scenario: "c" });
    expect(s().pending.ecmo?.seq).toBe(seq + 1);
    s().clear();
    expect(s().peek("ecmo")).toBeNull();
  });

  it("angio-real drills keep their own pending drill and leave no launch behind", async () => {
    const { useUiStore } = await import("./useUiStore");
    const { useLabLaunchStore } = await import("./useLabLaunchStore");
    const { takeRequestedDrill } = await import("../ui/angio/library");
    useUiStore.getState().openSim("angio-real", { drill: "view", artery: "LCA" });
    expect(takeRequestedDrill()).toEqual({ drill: "view", params: { artery: "LCA" } });
    expect(useLabLaunchStore.getState().peek("angio-real")).toBeNull();
  });

  it("subscribeLabLaunch takes a pending request at once and each new one while subscribed, once each", async () => {
    const { useLabLaunchStore, subscribeLabLaunch } = await import("./useLabLaunchStore");
    const s = () => useLabLaunchStore.getState();
    s().clear();
    s().request("tavi", { scenario: "first" });
    const got: Record<string, string>[] = [];
    const stop = subscribeLabLaunch("tavi", (p) => got.push(p));
    expect(got).toEqual([{ scenario: "first" }]);
    expect(s().peek("tavi")).toBeNull();
    s().request("teer", { scenario: "other-lab" });
    expect(got).toHaveLength(1);
    expect(s().peek("teer")).toEqual({ scenario: "other-lab" });
    s().request("tavi", { scenario: "second", mode: "supervised" });
    expect(got).toEqual([{ scenario: "first" }, { scenario: "second", mode: "supervised" }]);
    expect(s().peek("tavi")).toBeNull();
    expect(s().peek("teer")).toBeNull();
    stop();
    s().request("tavi", { scenario: "after" });
    expect(got).toHaveLength(2);
    expect(s().peek("tavi")).toEqual({ scenario: "after" });
    s().clear();
  });

  it("leaving the lab's section by any route drops its pending request", async () => {
    const { useUiStore } = await import("./useUiStore");
    const { useLabLaunchStore, subscribeLabLaunch } = await import("./useLabLaunchStore");
    const s = () => useLabLaunchStore.getState();
    const ui = () => useUiStore.getState();
    s().clear();
    // A lesson link to the Haemodynamics lab that the lab never takes...
    ui().openSim("haemo", { scenario: "pe-massive" });
    expect(s().peek("haemo")).toEqual({ scenario: "pe-massive" });
    // ...survives while the learner stays in that section...
    ui().setSection("haemo");
    expect(s().peek("haemo")).toEqual({ scenario: "pe-massive" });
    // ...and is dropped once they leave by the sidebar,
    ui().setSection("dashboard");
    expect(s().peek("haemo")).toBeNull();
    // so returning later by the sidebar delivers nothing.
    ui().setSection("haemo");
    const got: unknown[] = [];
    subscribeLabLaunch("haemo", (p) => got.push(p))();
    expect(got).toEqual([]);
    // Other routes out of a section drop it too.
    ui().openSim("impella", { scenario: "b" });
    ui().openCase("some-case");
    expect(s().peek("impella")).toBeNull();
    ui().openSim("tavi", { scenario: "c" });
    ui().openPathway({});
    expect(s().peek("tavi")).toBeNull();
    // openSim to another lab in another section replaces the request and keeps its own.
    ui().openSim("pacing", { scenario: "d" });
    ui().openSim("haemo", { scenario: "e" });
    expect(s().peek("pacing")).toBeNull();
    expect(s().peek("haemo")).toEqual({ scenario: "e" });
    s().clear();
  });
});
