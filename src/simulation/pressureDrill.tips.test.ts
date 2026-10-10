// Tip integration of the pressure recognition drill (diag-pressure-recognition-drill), beside its event source
// (src/simulation/pressureDrill.ts, which exports `raises`): in a scenario of
// src/content/practice/diag-pressure-recognition-drill.launch.ts, after its first action (the first answer),
// the reveal's context brings the damping tips; the drill's raises use the shared vocabulary; and no
// waiting.ts entry is left waiting on this package.
//   npx vitest run src/simulation/pressureDrill.tips.test.ts
import { describe, expect, it } from "vitest";
import { DRILL_ITEMS, DRILL_EVENTS, DrillSession, drillContext, drillSetFromParams, drillTips, raises, runDrillItem, setTypes } from "./pressureDrill";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, tipScore, tipsFor } from "../content/lab/tips";
import { WAITING_TIPS } from "../content/lab/raisable/waiting";
import { launch } from "../content/practice/diag-pressure-recognition-drill.launch";

const PKG = "diag-pressure-recognition-drill";
const ids = (ctx: Parameters<typeof tipsFor>[0]) => tipsFor(ctx, 20).map((t) => t.id);

describe("the drill's tips", () => {
  it("in scenario 'pressure-damping', after its first action, tipsFor(ctx, 20) includes diag-damped-stepwise and diag-ventricularised-stay-out", () => {
    const scenario = launch.scenarios!.find((s) => s.id === "pressure-damping")!;
    const set = drillSetFromParams({ scenario: scenario.id })!;
    expect(set).toBe("damping");
    // The criterion depends on the first item of the order: a scenario whose first trace is free or aortic
    // stenosis raises no damping event, so its first reveal does not bring the damping tips. This case takes
    // a seed whose first trace is the catheter-tip spasm item (it ventricularises, then falls); the next test
    // covers every damping-set item whose trace damps, whatever the order.
    const seed = Array.from({ length: 200 }, (_, i) => `first-${i}`).find((s) => new DrillSession(set, s).current()?.type === "spasm");
    expect(seed).toBeDefined();
    const session = new DrillSession(set, seed!);
    expect(session.context()).toBeNull();
    const first = session.current()!;
    const mark = session.answer({ name: "spasm", action: "withdraw", confidence: 0.8, elapsedS: 7 });
    expect(mark.correct).toBe(true);
    expect(first.type).toBe("spasm");
    const got = ids(session.context()!);
    expect(got).toEqual(expect.arrayContaining(["diag-damped-stepwise", "diag-ventricularised-stay-out"]));
    // and the spasm tip of the same lesson
    expect(got).toContain("diag-ostial-spasm-withdraw-nitrate");
  });

  it("every item of the damping set whose trace reads damped, wedged or ventricularised brings a damping tip on its reveal (drillTips, the reveal's limit)", () => {
    let checked = 0;
    for (const type of setTypes("damping"))
      for (const p of DRILL_ITEMS[type].patients) {
        const r = runDrillItem(type, p);
        if (r.label !== "damped" && r.label !== "wedged" && r.label !== "ventricularised") continue;
        checked++;
        const got = drillTips(r).map((t) => t.id);
        expect({ type, p, damping: got.includes("diag-damped-stepwise") || got.includes("diag-ventricularised-stay-out") }).toEqual({ type, p, damping: true });
      }
    expect(checked).toBeGreaterThan(0);
  });

  it("before any trace has damped, the damping tips are not shown (a free trace brings the test-puff tip)", () => {
    const free = runDrillItem("free", DRILL_ITEMS.free.patients[0]);
    const got = ids(drillContext(free));
    expect(got).not.toContain("diag-damped-stepwise");
    expect(got).not.toContain("diag-ventricularised-stay-out");
    expect(got).toContain("diag-test-puff-then-recheck");
  });

  it("each item's reveal shows the tips of its pattern", () => {
    const p = DRILL_ITEMS.free.patients[0];
    expect(ids(drillContext(runDrillItem("damped", p)))).toContain("diag-damped-stepwise");
    expect(ids(drillContext(runDrillItem("ventricularised", p)))).toContain("diag-ventricularised-stay-out");
    expect(ids(drillContext(runDrillItem("hypo-nitrate", p)))).toContain("diag-hypo-after-vasodilator");
    // slow, then low: the vagal sequence tip, on a drill patient whose vasovagal reaction slows the heart below the bradycardia threshold
    const slow = DRILL_ITEMS["hypo-vagal"].patients.map((q) => runDrillItem("hypo-vagal", q)).find((r) => r.events.includes("bradycardia"));
    expect(slow).toBeDefined();
    expect(ids(drillContext(slow!))).toContain("diag-vagal-sequence");
  });

  it("raises: the diagnostic lab at the injection step, in the shared vocabulary, covering every event a trace raised", () => {
    expect(raises.lab).toBe("diagnostic");
    for (const ph of raises.phases) expect(LAB_PHASES.diagnostic as readonly string[]).toContain(ph);
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    const p = DRILL_ITEMS.free.patients[0];
    for (const type of Object.keys(DRILL_ITEMS) as (keyof typeof DRILL_ITEMS)[]) for (const e of runDrillItem(type, p).events) expect(DRILL_EVENTS).toContain(e);
  });

  it("every waiting.ts entry naming diag-pressure-recognition-drill is satisfiable by the drill's raises (there are none: the request's tips were made reachable by diag-pressure-transducer)", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG);
    for (const w of mine)
      for (const id of w.tips) {
        const tip = LAB_TIPS.find((t) => t.id === id)!;
        const ctx = { lab: raises.lab, phases: [...raises.phases], events: [...raises.events] };
        expect({ id, ok: tipScore(tip, ctx) !== null }).toEqual({ id, ok: true });
      }
    expect(mine.length).toBe(0);
    // the request's four tips are matched by what the drill raises
    for (const id of ["diag-damped-stepwise", "diag-ventricularised-stay-out", "diag-test-puff-then-recheck", "diag-ostial-spasm-withdraw-nitrate"]) {
      const tip = LAB_TIPS.find((t) => t.id === id)!;
      expect(tip).toBeDefined();
      const ctx = { lab: raises.lab, phase: "inject" as const, events: [...(tip.when.event ?? [])] };
      expect({ id, ok: tipScore(tip, ctx) !== null }).toEqual({ id, ok: true });
      for (const e of tip.when.event ?? []) expect(raises.events).toContain(e);
    }
  });
});
