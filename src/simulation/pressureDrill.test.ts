// The timed pressure-trace recognition drill (diag-pressure-recognition-drill): every item's engine trace
// reads its label, the aortic stenosis item is never damped, the order is seeded, and the marking.
//   npx vitest run src/simulation/pressureDrill.test.ts
import { describe, expect, it } from "vitest";
import {
  DRILL_CONTEXT_POOL,
  DRILL_ITEMS,
  DRILL_ITEM_TYPES,
  DRILL_NAME_LABEL,
  DRILL_PATIENTS,
  DRILL_SCENARIO_OF_SET,
  DRILL_SETS,
  DRILL_HYPOTENSION_SYS_MMHG,
  DrillRun,
  DrillSession,
  MP_DRILL,
  drillOrder,
  drillSetFromParams,
  drillStem,
  drillStemParts,
  drillTips,
  markAnswer,
  runDrillItem,
  setTypes,
  summarise,
  type DrillItemRef,
  type DrillName,
} from "./pressureDrill";
import { SAMPLE_HZ } from "./patient/engine";
import { classifyTip } from "./patient/transducer";
import { launch } from "../content/practice/diag-pressure-recognition-drill.launch";

/** Systolic and diastolic of a trace channel over the last `seconds` (the last beats of the window). */
function lastBeats(run: DrillRun, ch: "tipTrue" | "aoTrue", seconds = 1.2): { sys: number; dia: number } {
  const tr = run.engine.trace;
  const n = Math.min(tr.count, Math.round(SAMPLE_HZ * seconds));
  let sys = -Infinity;
  let dia = Infinity;
  for (let k = 0; k < n; k++) {
    const v = tr[ch][tr.idx(k)];
    sys = Math.max(sys, v);
    dia = Math.min(dia, v);
  }
  return { sys, dia };
}

describe("every item type produces a trace whose class matches its label", () => {
  for (const type of DRILL_ITEM_TYPES) {
    it(`${type}: on every drill patient the tip's classifyTip reads '${DRILL_ITEMS[type].tipLabel}' and the displayed trace '${DRILL_ITEMS[type].label}'`, () => {
      const spec = DRILL_ITEMS[type];
      for (const p of spec.patients) {
        const r = runDrillItem(type, p);
        expect({ p, label: r.label }).toEqual({ p, label: spec.label });
        expect({ p, tipLabel: r.tipLabel }).toEqual({ p, tipLabel: spec.tipLabel });
        // the window's action happened: the class before it was the free root trace (or the engaged seat of a hypotension item)
        expect(r.classes.length).toBeGreaterThanOrEqual(Math.floor(MP_DRILL.windowS / MP_DRILL.sampleEveryS));
      }
    });
  }

  it("classifyTip itself, on the tip and aortic pressures of the last beat, gives each tip-position item's label", () => {
    for (const type of ["free", "damped", "ventricularised", "wedged", "spasm", "aortic-stenosis", "side-hole-wedged", "lv"] as const) {
      const run = new DrillRun(type, DRILL_PATIENTS[0]);
      run.advance(MP_DRILL.windowS);
      const tip = lastBeats(run, "tipTrue");
      const ao = lastBeats(run, "aoTrue");
      expect({ type, cls: classifyTip(run.tip, tip.sys, tip.dia, ao.sys, ao.dia) }).toEqual({ type, cls: DRILL_ITEMS[type].tipLabel });
    }
  });

  it("the side-hole item is 'aortic' with gap 0: the end hole is wedged and the side holes keep the trace", () => {
    for (const p of DRILL_PATIENTS) {
      const r = runDrillItem("side-hole-wedged", p);
      expect(r.tip).toMatchObject({ location: "ostium", gap: 0, sideHoles: true });
      expect(r.label).toBe("aortic");
      expect(r.tipLabel).toBe("aortic");
      // the same seat without side holes is wedged
      expect(runDrillItem("wedged", p).tipLabel).toBe("wedged");
    }
  });

  it("the line faults are on the trace from the start of the window and damp it whatever the catheter does; the tip itself stays aortic", () => {
    for (const type of ["line-air", "line-off", "line-disconnected"] as const)
      for (const p of DRILL_PATIENTS) {
        const r = runDrillItem(type, p);
        expect({ type, p, every: r.classes.every((c) => c === "damped") }).toEqual({ type, p, every: true });
        expect(r.label).toBe("damped");
        expect(r.tipLabel).toBe("aortic");
        expect(r.events).toContain("transducer-fault");
      }
    // switched off and disconnected: still flat with the tip withdrawn free into the root
    for (const type of ["line-off", "line-disconnected"] as const) expect(runDrillItem(type, DRILL_PATIENTS[0]).tip.location).toBe("aorta");
    // air: damped in the root before the catheter moved, and after a coaxial seat with the side-hole catheter
    expect(runDrillItem("line-air", DRILL_PATIENTS[0]).tip).toMatchObject({ location: "ostium", gap: MP_DRILL.gap.coaxial, sideHoles: true });
  });

  it("the left ventricular trace: the tip crossed the valve as it was advanced; the diastolic falls far below the aortic diastolic", () => {
    for (const p of DRILL_PATIENTS) {
      const run = new DrillRun("lv", p);
      run.advance(MP_DRILL.windowS);
      expect(run.state()).toEqual({ label: "lv", tipLabel: "lv" });
      const tip = lastBeats(run, "tipTrue");
      const ao = lastBeats(run, "aoTrue");
      expect(tip.dia).toBeLessThan(ao.dia - 30);
    }
    const m = markAnswer({ type: "lv", patientSeed: DRILL_PATIENTS[0] }, { name: "lv", action: "inject", confidence: 0.5, elapsedS: 6 });
    expect(m.unsafeInjection).toBe(true);
    expect(markAnswer({ type: "lv", patientSeed: DRILL_PATIENTS[0] }, { name: "lv", action: "withdraw", confidence: 0.5, elapsedS: 6 }).correct).toBe(true);
  });

  it("a run-up computed in slices (deferPre, preStep) gives the same trace as one computed at construction", () => {
    for (const type of ["hypo-vagal", "line-air"] as const) {
      const direct = new DrillRun(type, DRILL_PATIENTS[1]);
      const sliced = new DrillRun(type, DRILL_PATIENTS[1], { deferPre: true });
      expect(sliced.ready).toBe(false);
      expect(sliced.elapsed).toBe(0);
      let slices = 0;
      while (!sliced.preStep(7)) slices++;
      expect(slices).toBeGreaterThanOrEqual(type === "hypo-vagal" ? 3 : 0);
      expect(sliced.t0).toBeCloseTo(direct.t0, 9);
      direct.advance(MP_DRILL.windowS);
      sliced.advance(MP_DRILL.windowS);
      expect(sliced.classes).toEqual(direct.classes);
      expect(sliced.engine.vitals().art).toEqual(direct.engine.vitals().art);
    }
  });

  it("catheter-tip spasm ventricularises after seating and then falls further, with the catheter not moved", () => {
    for (const p of DRILL_PATIENTS) {
      const r = runDrillItem("spasm", p);
      const after = r.classes.slice(Math.floor(MP_DRILL.eventAtS / MP_DRILL.sampleEveryS));
      const firstVent = after.indexOf("ventricularised");
      expect(firstVent).toBeGreaterThanOrEqual(0);
      expect(after.slice(firstVent + 1)).toContain("wedged");
      expect(r.events).toEqual(expect.arrayContaining(["pressure-ventricularised", "pressure-damped", "ostial-spasm"]));
    }
  });

  it("each true hypotension item stays low with the tip free in the root: true systolic below 90 mmHg (module rule of thumb) and a pulsatile, aortic trace", () => {
    for (const type of ["hypo-nitrate", "hypo-verapamil", "hypo-vagal", "hypo-hypovolaemia"] as const)
      for (const p of DRILL_PATIENTS) {
        const r = runDrillItem(type, p);
        expect(r.tip.location).toBe("aorta");
        expect({ type, p, low: r.end.trueSys < DRILL_HYPOTENSION_SYS_MMHG }).toEqual({ type, p, low: true });
        expect(r.end.trueSys).toBeLessThan(r.baseline.sys - 10);
        expect(r.events).toContain("hypotension");
        expect(r.label).toBe("aortic");
        expect(r.end.sys - r.end.dia).toBeGreaterThan(15);
      }
    // the vasovagal patient is slow
    expect(DRILL_PATIENTS.some((p) => runDrillItem("hypo-vagal", p).events.includes("bradycardia"))).toBe(true);
  });
});

describe("aortic stenosis is not damping", () => {
  it("the AS item is not damped: every displayed class through the window is aortic, on every drill patient", () => {
    for (const p of DRILL_PATIENTS) {
      const r = runDrillItem("aortic-stenosis", p);
      expect(r.classes.every((c) => c === "aortic")).toBe(true);
      expect(r.label).toBe("aortic");
      expect(r.events).not.toContain("pressure-damped");
      expect(r.events).toContain("aortic-stenosis");
      // the pulse is smaller than the same patient's free trace, and it matched its own root trace before seating
      const free = runDrillItem("free", p);
      expect(r.end.sys - r.end.dia).toBeLessThan(free.end.sys - free.end.dia);
      expect(Math.abs(r.end.sys - r.baseline.sys)).toBeLessThan(8);
    }
  });
});

describe("the stems do not name the answer", () => {
  const CLASS_WORDS = /damp|ventriculari|wedg|spasm|stenosis|hypotens|fault|free|aortic|left ventric|\blv\b/i;

  it("within each set, every part a stem can show (its action sentence, each context line) is shared by at least two names", () => {
    for (const set of DRILL_SETS) {
      const names = new Map<string, Set<DrillName>>();
      const add = (part: string, n: DrillName) => names.set(part, (names.get(part) ?? new Set<DrillName>()).add(n));
      for (const type of setTypes(set)) {
        const parts = drillStemParts(type);
        add(parts.action, DRILL_ITEMS[type].name);
        for (const c of parts.contexts) add(c, DRILL_ITEMS[type].name);
      }
      for (const [part, ns] of names) expect({ set, part, names: ns.size >= 2 }).toEqual({ set, part, names: true });
    }
  });

  it("within each set, no whole stem an item can show maps to a single name", () => {
    for (const set of DRILL_SETS) {
      const byStem = new Map<string, Set<DrillName>>();
      for (const type of setTypes(set))
        for (const context of drillStemParts(type).contexts) {
          const stem = drillStem({ type, patientSeed: DRILL_PATIENTS[0], context });
          byStem.set(stem, (byStem.get(stem) ?? new Set<DrillName>()).add(DRILL_ITEMS[type].name));
        }
      for (const [stem, ns] of byStem) expect({ set, stem, names: ns.size >= 2 }).toEqual({ set, stem, names: true });
    }
  });

  it("a session's drawn stems: one context line each, the item's own or one from the shared pool, the same for the same seed", () => {
    for (const set of DRILL_SETS)
      for (let i = 0; i < 10; i++) {
        const order = drillOrder(set, `stems-${i}`);
        expect(order).toEqual(drillOrder(set, `stems-${i}`));
        for (const ref of order) {
          const ctx = DRILL_ITEMS[ref.type].context ?? ref.context;
          expect(ctx !== undefined && drillStemParts(ref.type).contexts.includes(ctx)).toBe(true);
          expect(drillStem(ref).startsWith(`${ctx} `)).toBe(true);
        }
      }
    // the pool's lines are drawn, not fixed: more than one line appears for the free item across seeds
    const seen = new Set(Array.from({ length: 30 }, (_, i) => drillOrder("all", `pool-${i}`).find((r) => r.type === "free")!.context));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("no stem a drawn item can show contains a name's label or a word of the trace's class", () => {
    const labels = Object.values(DRILL_NAME_LABEL).map((l) => l.toLowerCase());
    for (const type of DRILL_ITEM_TYPES) {
      const parts = drillStemParts(type);
      for (const c of parts.contexts) {
        const stem = drillStem({ type, patientSeed: DRILL_PATIENTS[0], context: c });
        expect({ type, stem, cls: CLASS_WORDS.test(stem) }).toEqual({ type, stem, cls: false });
        for (const l of labels) expect(stem.toLowerCase()).not.toContain(l);
      }
    }
  });
});

describe("order, sets and launches", () => {
  it("the same seed gives the same order; another seed another order", () => {
    for (const set of DRILL_SETS) expect(drillOrder(set, "seed-a")).toEqual(drillOrder(set, "seed-a"));
    expect(new DrillSession("all", 42).items).toEqual(new DrillSession("all", 42).items);
    const orders = new Set(["a", "b", "c", "d", "e"].map((s) => drillOrder("all", s).map((r) => r.type).join(",")));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("stratified: every item type of a set appears once, on a drill patient", () => {
    for (const set of DRILL_SETS) {
      const o = drillOrder(set, "strata");
      expect(o.map((r) => r.type).sort()).toEqual(setTypes(set).sort());
      for (const r of o) expect(DRILL_PATIENTS).toContain(r.patientSeed);
    }
    expect(setTypes("all")).toEqual([...DRILL_ITEM_TYPES]);
    expect(setTypes("damping")).toEqual(expect.arrayContaining(["damped", "ventricularised", "aortic-stenosis", "side-hole-wedged"]));
  });

  it("the launch file declares one scenario per set, and a launch's set or scenario opens it", () => {
    expect(launch.sim).toBe("pressure");
    expect((launch.scenarios ?? []).map((s) => s.id).sort()).toEqual(Object.values(DRILL_SCENARIO_OF_SET).sort());
    expect(drillSetFromParams({ set: "damping" })).toBe("damping");
    expect(drillSetFromParams({ scenario: "pressure-faults", mode: "guided" })).toBe("faults");
    expect(drillSetFromParams({ set: "nonsense" })).toBeNull();
    expect(drillSetFromParams(null)).toBeNull();
  });
});

describe("marking", () => {
  const damped: DrillItemRef = { type: "damped", patientSeed: DRILL_PATIENTS[0] };

  it("answering 'inject' to a damped item scores wrong, is an unsafe injection, and the reveal shows the damping tip", () => {
    const m = markAnswer(damped, { name: "damped", action: "inject", confidence: 0.9, elapsedS: 5 });
    expect(m.correct).toBe(false);
    expect(m.nameCorrect).toBe(true);
    expect(m.actionCorrect).toBe(false);
    expect(m.unsafeInjection).toBe(true);
    expect(m.tips.map((t) => t.id)).toContain("diag-damped-stepwise");
  });

  it("the right name and first action within the time limit score right; out of time scores wrong", () => {
    expect(markAnswer(damped, { name: "damped", action: "withdraw", confidence: 0.8, elapsedS: 6 }).correct).toBe(true);
    expect(markAnswer(damped, { name: "damped", action: "withdraw", confidence: 0.8, elapsedS: MP_DRILL.answerLimitS + 0.5 }).correct).toBe(false);
    const as: DrillItemRef = { type: "aortic-stenosis", patientSeed: DRILL_PATIENTS[0] };
    // the AS trace mistaken for damping is wrong
    expect(markAnswer(as, { name: "damped", action: "withdraw", confidence: 0.6, elapsedS: 6 }).correct).toBe(false);
    expect(markAnswer(as, { name: "aortic-stenosis", action: "inject", confidence: 0.6, elapsedS: 6 }).correct).toBe(true);
    // a low trace with the tip free: checking the transducer or treating the patient are both a right first action
    const hypo: DrillItemRef = { type: "hypo-nitrate", patientSeed: DRILL_PATIENTS[0] };
    expect(markAnswer(hypo, { name: "hypotension", action: "check-transducer", confidence: 0.6, elapsedS: 6 }).correct).toBe(true);
    expect(markAnswer(hypo, { name: "hypotension", action: "treat-patient", confidence: 0.6, elapsedS: 6 }).correct).toBe(true);
  });

  it("summary: kappa on the names, the Brier score of the confidence, unsafe injections", () => {
    const s = new DrillSession("faults", "summary");
    for (const ref of s.items) s.answer({ name: DRILL_ITEMS[ref.type].name, action: DRILL_ITEMS[ref.type].actions[0], confidence: 1, elapsedS: 5 });
    const sum = s.summary();
    expect(sum.score).toBe(100);
    expect(sum.kappa.kappa).toBeCloseTo(1, 6);
    expect(sum.brier).toBe(0);
    expect(sum.unsafeInjections).toBe(0);
    const wrong = summarise(s.items.map((ref) => markAnswer(ref, { name: "free", action: "inject", confidence: 1, elapsedS: 5 })));
    expect(wrong.unsafeInjections).toBeGreaterThan(0);
    expect(wrong.brier).toBeGreaterThan(0);
    expect(wrong.kappa.kappa).toBeLessThan(0.5);
  });
});

describe("the reveal's tips are the item's own", () => {
  it("every reveal tip is tied to what the trace raised or read as; the test-puff tip appears only where the right first action is to inject", () => {
    for (const type of DRILL_ITEM_TYPES) {
      const spec = DRILL_ITEMS[type];
      for (const p of spec.patients) {
        const r = runDrillItem(type, p);
        for (const t of drillTips(r)) {
          const w = t.when;
          const tied = !!(w.event?.length || w.requires?.length || w.pressure?.length);
          const puff = t.id === "diag-test-puff-then-recheck";
          expect({ type, p, tip: t.id, ok: tied || (puff && spec.actions.includes("inject")) }).toEqual({ type, p, tip: t.id, ok: true });
        }
      }
    }
  });

  it("the damped reveal shows no test puff and no step-only filler; the free reveal shows the test puff without the breath-hold tip", () => {
    const damped = drillTips(runDrillItem("damped", DRILL_PATIENTS[0])).map((t) => t.id);
    expect(damped).toContain("diag-damped-stepwise");
    for (const id of ["diag-test-puff-then-recheck", "diag-rad-step-back-for-cine", "diag-nitrate-dose-by-pressure"]) expect(damped).not.toContain(id);
    const free = drillTips(runDrillItem("free", DRILL_PATIENTS[0])).map((t) => t.id);
    expect(free).toContain("diag-test-puff-then-recheck");
    expect(free).not.toContain("diag-acq-breath-hold");
  });
});
