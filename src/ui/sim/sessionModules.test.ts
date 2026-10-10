// Diagnostic lab session modules (diag-tip-context): the glob registry's checks, and the session's
// calls into a module (attach, step, onInject, events into the tip context, dispose).
//   npx vitest run src/ui/sim/sessionModules.test.ts
import { describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { findStartControls } from "../../mentor/skillCards";
import { DiagnosticLabSession } from "./labSession";
import { SESSION_MODULES, collectSessionModules, instantiateSessionModules, type SessionInjection, type SessionModule } from "./modules";

const g = () => useSimulatorStore.getState();
const routine = CASE_LIBRARY[0];

describe("the session module registry", () => {
  it("collects factories in file order and refuses a file without one", () => {
    const a = () => ({ id: "a", attach: () => undefined });
    const b = () => ({ id: "b", attach: () => undefined });
    expect(collectSessionModules({ "./b.ts": { createSessionModule: b }, "./a.ts": { createSessionModule: a } }).map((m) => m.file)).toEqual(["./a.ts", "./b.ts"]);
    expect(() => collectSessionModules({ "./x.ts": { raises: { lab: "diagnostic", phases: [], events: [] } } })).toThrow(/createSessionModule/);
  });

  it("refuses a module without an id or attach, and a duplicate id", () => {
    expect(() => instantiateSessionModules([() => ({ id: "", attach: () => undefined })])).toThrow(/no id/);
    expect(() => instantiateSessionModules([() => ({ id: "x" }) as unknown as SessionModule])).toThrow(/attach/);
    const m = () => ({ id: "same", attach: () => undefined });
    expect(() => instantiateSessionModules([m, m])).toThrow(/twice/);
  });

  it("the registry loads (no module files yet is a valid registry)", () => {
    expect(Array.isArray(SESSION_MODULES)).toBe(true);
    for (const m of SESSION_MODULES) expect(typeof m.create).toBe("function");
  });
});

describe("the session runs its modules", () => {
  it("attaches, steps, tells of injections, merges events into the tip context and detaches on dispose", () => {
    g().loadCase(routine, "free");
    const calls = { attached: 0, steps: 0, detached: 0, injections: [] as SessionInjection[] };
    const fixture = (): SessionModule => ({
      id: "fixture",
      attach: (s) => {
        expect(s).toBeInstanceOf(DiagnosticLabSession);
        calls.attached++;
        return () => calls.detached++;
      },
      step: () => calls.steps++,
      onInject: (ev) => calls.injections.push(ev),
      events: () => ["contrast-hold-up"],
    });
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [fixture] });
    expect(calls.attached).toBe(1);
    expect(s.modules.map((m) => m.id)).toEqual(["fixture"]);
    s.step(0.1);
    s.step(0.1);
    expect(calls.steps).toBe(2);
    expect(s.tipContext().events).toContain("contrast-hold-up");
    expect(s.activeEvents()).toContain("contrast-hold-up");
    // an injection on a seated catheter
    const t = findStartControls(routine, g().catheterId, "selective-lm") ?? findStartControls(routine, g().catheterId, "selective-rca");
    if (!t) throw new Error("no start state");
    g().commandInsertion(t.insertion - g().controls.cmdInsertion);
    g().commandTorque(t.torque - g().controls.cmdTorque);
    for (let i = 0; i < 120; i++) g().tick(0.033);
    g().aspirate();
    expect(s.startInjection()).toBe(true);
    expect(calls.injections).toHaveLength(1);
    expect(calls.injections[0]).toMatchObject({ catheterId: g().catheterId });
    expect(["left", "right"]).toContain(calls.injections[0].side);
    expect(calls.injections[0].outcome).toBe(g().lastInjection?.outcome);
    s.releaseInjection();
    s.dispose();
    expect(calls.detached).toBe(1);
  });
});
