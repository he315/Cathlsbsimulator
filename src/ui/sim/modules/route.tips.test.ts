// ---------------------------------------------------------------------------
// The route session module's tips (diag-route-wire-led-radial): the radial loop scenario with the rod
// mechanics, where the J-led catheter stalls at the loop and the route module raises 'radial-loop'; the
// resistance and balloon-assisted tracking tips then appear. The waiting.ts entries naming this package
// are satisfiable from the lab's raises exports (the route module's among them), and the practice index
// lists the three scenarios under their lessons (route.launch.ts).
//
// The plan's acceptance names diag-wire-leads-to-root for the tips; that scenario is the femoral study of
// the wire-led advance (the iliac acceptance), where no radial loop can arise, so the loop's tips are
// shown in diag-radial-loop-algorithm, the scenario with the loop, and the femoral scenario is checked
// for the advance tip it teaches.
//   npx vitest run src/ui/sim/modules/route.tips.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { FINISH_EVENTS } from "../../../mentor/report";
import { practiceForLesson } from "../../content/practiceIndex";
import { DiagnosticLabSession, labScenarioById, type SessionPhysicsOptions } from "../labSession";
import { ROUTE_EVENTS, raises as routeRaises } from "./route";
import { launch as routeLaunch } from "../../../simulation/diagnosticScenarios/route.launch";

const g = () => useSimulatorStore.getState();
const T = 120_000;
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };
const PKG = "diag-route-wire-led-radial";

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

function open(id: string, catheterId: string): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, DEFAULT_SCENARIO_SEED, labScenarioById)!, "free", "beginner");
  g().setCatheter(catheterId);
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: PHYS });
  s.setTimeOutDone(true);
  sessions.push(s);
  return s;
}
const stepper = (s: DiagnosticLabSession) => (sec: number) => {
  for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
};
const ids = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

describe("the route module's raises", () => {
  it("declares only the vocabulary's names, in the diagnostic lab's phases", () => {
    for (const e of ROUTE_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const p of routeRaises.phases) expect(LAB_PHASES.diagnostic as readonly string[]).toContain(p);
    expect(routeRaises.lab).toBe("diagnostic");
    expect(routeRaises.routes).toEqual(expect.arrayContaining(["radial", "femoral"]));
  });
});

describe("tips at the radial loop", () => {
  it("diag-radial-loop-algorithm: after the stall at the loop that raises 'radial-loop', tipsFor(ctx, 20) includes diag-root-resistance-transduce-image and diag-root-balloon-assisted-tracking", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.3);
    expect(s.events.history().some((x) => x.event === "radial-loop" && x.source === "route")).toBe(false);
    // the action: the catheter advanced over the J wire until both stop at the loop
    for (let i = 0; i < 80 && p.routeMechanics()?.loop?.stalled !== "catheter"; i++) {
      p.command({ kind: "push", device: "catheter", mm: 3 });
      adv(0.1);
    }
    adv(0.3);
    expect(s.events.history().some((x) => x.event === "radial-loop" && x.source === "route")).toBe(true);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("advance");
    expect(ctx.route).toBe("radial");
    expect(ctx.events).toContain("radial-loop");
    expect(ids(s)).toEqual(expect.arrayContaining(["diag-root-resistance-transduce-image", "diag-root-balloon-assisted-tracking"]));
  }, T);

  // Before the stall nothing has met the loop, so its tips must not show yet. The tip context adds
  // 'radial-loop' from the case's variant on the arm (src/ui/lab/diagnosticContext.ts:414, owned by another
  // package), so the drawer names the loop from the first frame. it.fails until that line skips sheath
  // starts (`&& session.physics?.startAt !== "sheath"`); then make this an ordinary it().
  it.fails("diag-radial-loop-algorithm: before anything has met the loop, 'radial-loop' is not in the context and its tips do not show (blocked on diagnosticContext.ts:414)", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    stepper(s)(0.3);
    expect(s.tipContext().phase).toBe("advance");
    expect(s.tipContext().events).not.toContain("radial-loop");
    expect(ids(s)).not.toContain("diag-root-resistance-transduce-image");
  }, T);

  it("diag-wire-leads-to-root: from the sheath the advance tip shows (diag-root-wire-leads)", () => {
    const s = open("diag-wire-leads-to-root", "JL4");
    stepper(s)(0.5);
    expect(s.tipContext().phase).toBe("advance");
    expect(ids(s)).toContain("diag-root-wire-leads");
  }, T);
});

// ---------------------------------------------------------------------------
// Waiting entries and the practice links
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
/** The same sources the reachability report reads (src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<RaisesExport>(
  [
    "../../lab/pciEvents/*.ts",
    "./*.ts",
    "../../../simulation/session/modules/*.ts",
    "../../lab/*Context.ts",
    "../../**/*Tips.ts",
    "../../angio/labels.ts",
    "../../angio/simFlowDrill.ts",
    "../../../simulation/haemo/*.ts",
    "../../../simulation/session/scenarios/heparin.ts",
    "../../../mentor/bridge/pciSession.ts",
    "../../../simulation/session/ward.ts",
    "!**/*.test.ts",
  ],
  { eager: true, import: "raises" }
);

type Raised = { phases: Set<string>; events: Set<string>; techniques: Set<string>; imaging: Set<string>; procedures: Set<string>; routes: Set<string> };
function merge(list: readonly LabRaises[]): Partial<Record<string, Raised>> {
  const out: Partial<Record<string, Raised>> = {};
  for (const r of list) {
    const m = (out[r.lab] ??= { phases: new Set(), events: new Set(), techniques: new Set(), imaging: new Set(), procedures: new Set(), routes: new Set() });
    r.phases.forEach((x) => m.phases.add(x));
    r.events.forEach((x) => m.events.add(x));
    r.techniques?.forEach((x) => m.techniques.add(x));
    r.imaging?.forEach((x) => m.imaging.add(x));
    r.procedures?.forEach((x) => m.procedures.add(x));
    r.routes?.forEach((x) => m.routes.add(x));
  }
  return out;
}
const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, r: Raised | undefined): boolean {
  return (
    !!r &&
    any(phases, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.has(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}
const satisfiable = (tip: LabTip, raised: Partial<Record<string, Raised>>) =>
  satisfiableIn(tip.when, tip.when.phase, raised[tip.lab]) || (tip.alsoIn ?? []).some((a) => satisfiableIn(tip.when, a.phase, raised[a.lab]));

/** What the registered sources raise, with or without the route module's raises. */
function declared(withRoute: boolean): LabRaises[] {
  const out: LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: [...FINISH_EVENTS] }];
  for (const exp of Object.values(RAISE_MODULES)) if (exp) out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  const without = out.filter((r) => r !== routeRaises);
  return withRoute ? [...without, routeRaises] : without;
}

/** Diagnostic tips listed in waiting.ts that no lab can show yet. */
function stillWaiting(raised: Partial<Record<string, Raised>>): string[] {
  const listed = new Set<string>([...WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips), ...DEFERRED_RETARGETS.map((d) => d.tipId)]);
  return LAB_TIPS.filter((t) => t.lab === "diagnostic" && listed.has(t.id) && !satisfiable(t, raised)).map((t) => t.id);
}

describe("reachability", () => {
  it("the route module's file is one of the sources the report reads", () => {
    expect(Object.values(RAISE_MODULES)).toContain(routeRaises);
  });

  it("every waiting.ts entry naming diag-route-wire-led-radial is satisfiable with the lab's raises, so the diagnostic waiting count falls by at least their number", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const retargets = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    expect(entries.length + retargets.length).toBeGreaterThanOrEqual(1);
    const withRoute = merge(declared(true));
    for (const id of entries) expect(satisfiable(TIP_BY_ID[id], withRoute), id).toBe(true);
    for (const d of retargets) expect(satisfiableIn(d.when, d.when.phase, withRoute[TIP_BY_ID[d.tipId].lab]), d.tipId).toBe(true);
    const before = stillWaiting(merge(declared(false)));
    const after = stillWaiting(withRoute);
    expect(before.length - after.length).toBeGreaterThanOrEqual(entries.filter((id) => before.includes(id)).length);
    for (const id of entries) expect(after).not.toContain(id);
  });

  it("practiceIndex lists diag-wire-leads-to-root, diag-radial-loop-algorithm and diag-exchange-long-wire under pm-to-the-root-advance, pm-to-the-root-radial and pm-engaging-exchange (from route.launch.ts)", () => {
    const under = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab");
    const want: [string, string][] = [
      ["pm-to-the-root-advance", "diag-wire-leads-to-root"],
      ["pm-to-the-root-radial", "diag-radial-loop-algorithm"],
      ["pm-engaging-exchange", "diag-exchange-long-wire"],
    ];
    for (const [lesson, scenario] of want) {
      const e = under(lesson).find((x) => x.scenario === scenario);
      expect(e, `${scenario} under ${lesson}`).toBeDefined();
      expect(e!.source).toMatch(/route\.launch\.ts$/);
    }
    expect(routeLaunch.scenarios!.map((s) => s.id).sort()).toEqual(want.map((w) => w[1]).sort());
  });
});
