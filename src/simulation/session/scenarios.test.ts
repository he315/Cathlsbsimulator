import { describe, it, expect } from "vitest";
import { CaseSession, newCaseSession, newCaseSessionStepped } from "./caseSession";
import { aimedPose, fastForward, stageReached, gainAccess, prepare, AutopilotError } from "./autopilot";
import { applyProfileOverrides, collectScenarios, habitusFromBmi, parseHookSpec, PROCEDURE_SCENARIOS, SCENARIO_BY_ID, type ProcedureScenario } from "./scenarios/index";
import type { LaunchFile } from "../../content/schema";
import { collectCaseModules, instantiateCaseModules, type CaseSessionModule } from "./modules/index";
import { buildAccessSite } from "../access/site";
import { cigarroaMacd, generatePatient } from "../patient/patient";
import { FEMORAL } from "../access/closure";
import type { SessionHook } from "./scenarios/index";

// proc-foundation-scenarios-ledger: scenarios, the autopilot, session modules and the ledger.

describe("autopilot", () => {
  for (const [seed, access] of [
    ["ff-radial-1", "radial-right"],
    ["ff-femoral-1", "femoral"],
  ] as const) {
    it(`fastForward(session, 'closure') on a ${access} seed leaves a sheath in, the catheter out, heparin given and closureDone() false`, () => {
      const { session: s } = newCaseSession({ seed, access });
      expect(fastForward(s, "closure")).toBe("closure");
      expect(s.sheath).not.toBeNull();
      expect(s.catheter).not.toBeNull();
      expect(s.catheter!.inBody).toBe(false);
      expect(s.heparinU).toBeGreaterThan(0);
      expect(s.closureDone()).toBe(false);
      expect(s.criticalErrors).toBe(0);
      expect(s.complications).toEqual([]);
      expect(s.labsDone).toContain("diagnostic");
    });
  }

  it("the autopilot leaves no complication on left and right radial cases at 'closure'", () => {
    for (const access of ["radial-right", "radial-left"] as const) {
      for (const n of [1, 2]) {
        const { session: s } = newCaseSession({ seed: `ff-spasm-${access}-${n}`, access, start: "closure" });
        expect(s.complications.map((c) => c.id)).toEqual([]);
        expect(s.spasmSeen).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("each stage is reached in turn and the autopilot never goes back", () => {
    const { session: s } = newCaseSession({ seed: "ff-steps", access: "radial-right" });
    expect(stageReached(s)).toBe("chart");
    expect(fastForward(s, "access")).toBe("access");
    expect(s.timeOutDone && s.local.given && !s.sheath).toBe(true);
    expect(fastForward(s, "sheath-in")).toBe("sheath-in");
    expect(s.sheath?.flushed).toBe(true);
    expect(fastForward(s, "post-diagnostic")).toBe("post-diagnostic");
    expect(s.catheterInAorta).toBe(true);
    const t = s.tS;
    expect(fastForward(s, "access")).toBe("post-diagnostic");
    expect(s.tS).toBe(t);
  });

  it("fastForward to 'recovery' closes the site cleanly on both routes", () => {
    for (const access of ["radial-right", "femoral"] as const) {
      const { session: s } = newCaseSession({ seed: `ff-rec-${access}`, access });
      expect(fastForward(s, "recovery")).toBe("recovery");
      expect(s.closureDone()).toBe(true);
      if (access === "femoral") expect(s.femoral!.actAtPull).toBeLessThanOrEqual(FEMORAL.actForSheathPullS);
      else expect(s.radial!.patentDocumented).toBe(true);
    }
  });

  it("a scenario start runs the autopilot inside newCaseSession", () => {
    const { session: s } = newCaseSession({ seed: "ff-start", access: "radial-right", scenario: "default", start: "sheath-in" });
    expect(s.sheath).not.toBeNull();
    expect(s.scenario.id).toBe("default");
    expect(s.startStage).toBe("sheath-in");
    expect(newCaseSession({ seed: "ff-start", access: "radial-right" }).session.startStage).toBe("chart");
  });

  it("a case opened at 'closure' holds none of the autopilot's decisions", () => {
    const { session: s } = newCaseSession({ seed: "ff-clear", access: "femoral", start: "closure" });
    expect(stageReached(s)).toBe("closure");
    expect(s.decisions()).toEqual([]);
    // the learner's own steps from there are recorded as usual
    s.femoralDevice();
    s.runPending();
    expect(s.decisions().map((d) => d.id)).toEqual(["femoral-angiogram"]);
  });

  it("the stepped build pauses between steps, reaches the stage with an empty ledger, and stops when cancelled", async () => {
    let pauses = 0;
    const made = await newCaseSessionStepped({ seed: "ff-stepped", access: "radial-right", start: "closure" }, async () => void pauses++);
    expect(made).not.toBeNull();
    expect(stageReached(made!.session)).toBe("closure");
    expect(made!.session.decisions()).toEqual([]);
    expect(pauses).toBeGreaterThan(5);
    const log: string[] = [];
    let n = 0;
    const gone = await newCaseSessionStepped(
      { seed: "ff-stepped", access: "radial-right", start: "closure", modules: [() => ({ id: "probe", attach: () => () => void log.push("dispose") })] },
      async () => void n++,
      () => n > 3,
    );
    expect(gone).toBeNull();
    expect(log).toEqual(["dispose"]);
  });

  it("a session whose start cannot be reached is disposed before the error is rethrown", () => {
    const log: string[] = [];
    const scenario: ProcedureScenario = {
      id: "ff-fail",
      title: "Fails",
      lessonIds: [],
      seed: "ff-fail",
      start: "access",
      state: () => {
        throw new AutopilotError("access", "test");
      },
    };
    expect(() => newCaseSession({ scenario, modules: [() => ({ id: "probe", attach: () => () => void log.push("dispose") })] })).toThrow(AutopilotError);
    expect(log).toEqual(["dispose"]);
  });
});

describe("scenarios", () => {
  it("the registry holds the default scenario, which overrides nothing", () => {
    expect(SCENARIO_BY_ID.default).toBeDefined();
    expect(PROCEDURE_SCENARIOS.map((s) => s.id)).toContain("default");
    const plain = newCaseSession({ seed: "sc-plain", access: "radial-right" }).session;
    const dflt = newCaseSession({ seed: "sc-plain", access: "radial-right", scenario: "default" }).session;
    expect(dflt.profile).toEqual(plain.profile);
    expect(dflt.chart).toEqual(plain.chart);
    expect(() => newCaseSession({ seed: "x", scenario: "no-such-scenario" })).toThrow(/unknown full-case scenario/);
  });

  it("newCaseSession({ scenario }) with a DOAC and raised creatinine override shows them in session.chart with a recomputed MACD", () => {
    const seed = "sc-doac";
    const base = generatePatient(seed);
    const scenario: ProcedureScenario = {
      id: "test-doac-ckd",
      title: "Test: DOAC and raised creatinine",
      lessonIds: [],
      seed,
      profile: { doac: { agent: "apixaban", hoursSinceDose: 10 }, creatinineUmolL: 210 },
    };
    const { session: s, engine } = newCaseSession({ scenario, access: "radial-right" });
    const p = s.profile;
    expect(p.anticoagulation).toBe("doac");
    expect(p.doac).toEqual({ agent: "apixaban", hoursSinceDose: 10 });
    expect(p.renal.creatinineUmolL).toBe(210);
    const mgdl = Math.round((210 / 88.4) * 100) / 100;
    expect(p.renal.macdMl).toBe(Math.round(cigarroaMacd(p.weightKg, mgdl)));
    expect(p.renal.macdMl).toBeLessThan(base.renal.macdMl);
    expect(p.renal.crclMlMin).toBeLessThan(base.renal.crclMlMin);
    expect(engine.profile.renal.macdMl).toBe(p.renal.macdMl);
    expect(s.chart.anticoag.text).toMatch(/Apixaban \(direct oral anticoagulant\); last dose 10 h ago/);
    expect(s.chart.renal.text).toContain("Creatinine 210 µmol/L");
    expect(s.chart.renal.text).toContain(`Maximum contrast dose ${p.renal.macdMl} mL`);
    s.reviewChart("renal");
    expect(s.contrastBudgetMl).toBe(p.renal.macdMl);
  });

  it("chart text and site overrides apply; a site without overrides is unchanged", () => {
    const profile = generatePatient("sc-site");
    expect(buildAccessSite("femoral", profile, {})).toEqual(buildAccessSite("femoral", profile));
    const hi = buildAccessSite("femoral", profile, { bifurcationX: 30, ligamentX: 50 });
    expect(hi.landmarks.bifurcationX).toBe(30);
    expect(hi.landmarks.ligamentX).toBe(50);
    const deep = buildAccessSite("radial-right", profile, { radialDepthMm: 7 });
    const art = deep.tubes.find((t) => t.id === "radial-artery")!;
    expect(art.zRef).toBeCloseTo(7 + art.r, 6);
    const { session: s } = newCaseSession({
      access: "femoral",
      scenario: { id: "test-site", title: "Test site", lessonIds: [], seed: "sc-site", site: { bifurcationX: 30 }, chart: { history: "Previous femoral closure device in the right groin." } },
    });
    expect(s.site.landmarks.bifurcationX).toBe(30);
    expect(s.chart.history.text).toBe("Previous femoral closure device in the right groin.");
    expect(s.setAccess("radial-right")).toBe(true);
    expect(s.setAccess("femoral")).toBe(true);
    expect(s.site.landmarks.bifurcationX).toBe(30);
  });

  it("scripted events fire at their hooks, including a time after a hook; scenario delayed events present in recovery", () => {
    const fired: string[] = [];
    const scenario: ProcedureScenario = {
      id: "test-script",
      title: "Test script",
      lessonIds: [],
      seed: "sc-script",
      access: "radial-right",
      script: [
        { at: "micro-wire", events: ["radial-spasm"], run: () => fired.push("micro-wire") },
        { at: "sheath-pull", log: { kind: "nurse", text: "Test: the sheath is out." } },
        { at: "recovery+40min", complication: { id: "test-late", label: "Test late event", severity: "minor" }, run: () => fired.push("recovery+40") },
      ],
      delayed: [{ kind: "forearm-haematoma", afterMin: 20, totalMl: 30, bleedMlMin: 1, report: "Test: swelling at the wrist.", finding: "Test finding.", severity: "minor" }],
    };
    const { session: s } = newCaseSession({ scenario, start: "sheath-in" });
    expect(fired).toEqual(["micro-wire"]);
    expect(s.scenarioEvents()).toContain("radial-spasm");
    fastForward(s, "recovery");
    expect(s.log.some((l) => l.kind === "nurse" && l.text === "Test: the sheath is out.")).toBe(true);
    expect(s.delayed.some((d) => d.report === "Test: swelling at the wrist.")).toBe(true);
    s.observe(30);
    s.runPending();
    expect(s.presented.some((d) => d.report === "Test: swelling at the wrist.")).toBe(true);
    expect(fired).toEqual(["micro-wire"]);
    s.observe(15);
    s.runPending();
    expect(fired).toEqual(["micro-wire", "recovery+40"]);
    expect(s.complications.some((c) => c.id === "test-late")).toBe(true);
  });

  it("the registry refuses duplicate ids, unknown starts and unknown hooks", () => {
    const a = { scenarios: [{ id: "a", title: "A", lessonIds: [] }] };
    expect(() => collectScenarios({ "./x.ts": a, "./y.ts": a })).toThrow(/declared in/);
    expect(() => collectScenarios({ "./x.ts": { scenarios: [{ id: "b", title: "B", lessonIds: [], start: "nowhere" }] } })).toThrow(/unknown start/);
    expect(() => collectScenarios({ "./x.ts": { scenarios: [{ id: "c", title: "C", lessonIds: [], script: [{ at: "lunch" }] }] } })).toThrow(/unknown hook/);
    expect(() => collectScenarios({ "./x.ts": {} })).toThrow(/does not export/);
    expect(parseHookSpec("recovery+40min")).toEqual({ hook: "recovery", afterS: 2400 });
    expect(parseHookSpec("sheath-pull")).toEqual({ hook: "sheath-pull", afterS: 0 });
    expect(parseHookSpec("recovery+")).toBeNull();
  });

  it("profile overrides recompute BMI and renal function from the sourced formulas", () => {
    const p = generatePatient("sc-bmi");
    const q = applyProfileOverrides(p, { weightKg: p.weightKg + 20 });
    expect(q.bmi).toBeGreaterThan(p.bmi);
    expect(q.renal.crclMlMin).toBeGreaterThan(p.renal.crclMlMin);
    expect(applyProfileOverrides(p, undefined)).toBe(p);
  });

  it("a height or weight override recomputes habitus with generatePatient's mapping", () => {
    // the duplicated mapping matches generatePatient on generated patients
    for (const seed of ["hb-1", "hb-2", "hb-3", "hb-4", "hb-5"]) {
      const g = generatePatient(seed);
      expect(habitusFromBmi(g.bmi)).toBe(g.habitus);
    }
    const p = generatePatient("sc-habitus");
    const lean = applyProfileOverrides(p, { heightCm: 180, weightKg: 50 });
    const heavy = applyProfileOverrides(p, { heightCm: 160, weightKg: 120 });
    expect(lean.habitus).toBe(habitusFromBmi(lean.bmi));
    expect(heavy.habitus).toBe(habitusFromBmi(heavy.bmi));
    expect(lean.habitus).toBeLessThan(heavy.habitus);
    expect(applyProfileOverrides(p, { lvef: 40 }).habitus).toBe(p.habitus);
  });

  it("every scenario's heldOut flag matches its .launch.ts entry", () => {
    const launches = import.meta.glob<{ launch: LaunchFile }>("./scenarios/*.launch.ts", { eager: true });
    const heldOut = new Map<string, boolean>();
    for (const f of Object.values(launches)) for (const sc of f.launch.scenarios ?? []) heldOut.set(sc.id, !!sc.heldOut);
    for (const sc of PROCEDURE_SCENARIOS) {
      expect(heldOut.has(sc.id), sc.id).toBe(true);
      expect(!!sc.heldOut, sc.id).toBe(heldOut.get(sc.id));
    }
  });
});

describe("session modules", () => {
  function probe(log: string[]): () => CaseSessionModule {
    return () => {
      let session: CaseSession | null = null;
      let ticks = 0;
      return {
        id: "probe",
        attach(s) {
          session = s;
          log.push("attach");
          return () => log.push("dispose");
        },
        slowTick() {
          ticks++;
        },
        onHook(h: SessionHook) {
          log.push(`hook:${h}`);
        },
        events: () => (session && session.sheath ? ["bleeding"] : []),
        actions: {
          ticks: () => ticks,
        },
      };
    };
  }

  it("a module is attached, ticked, told of hooks, reached with mod(id) and its events merged", () => {
    const log: string[] = [];
    const { session: s } = newCaseSession({ seed: "mod-1", access: "radial-right", modules: [probe(log)] });
    expect(log).toEqual(["attach", "hook:arrival"]);
    expect(s.moduleIds()).toEqual(["probe"]);
    const m = s.mod<CaseSessionModule & { actions: { ticks: () => number } }>("probe")!;
    expect(m).toBeDefined();
    expect(s.mod("absent")).toBeUndefined();
    expect(s.scenarioEvents()).toEqual([]);
    prepare(s);
    gainAccess(s);
    expect(m.actions.ticks()).toBeGreaterThan(0);
    expect(log).toContain("hook:time-out");
    expect(log).toContain("hook:puncture");
    expect(log).toContain("hook:micro-wire");
    expect(log).toContain("hook:sheath-in");
    expect(s.scenarioEvents()).toEqual(["bleeding"]);
    s.dispose();
    expect(log[log.length - 1]).toBe("dispose");
  });

  it("the registry refuses a file without a factory and duplicate ids", () => {
    expect(() => collectCaseModules({ "./x.ts": {} })).toThrow(/createSessionModule/);
    const f = () => ({ id: "same", attach() {} });
    expect(() => instantiateCaseModules([f, f])).toThrow(/used twice/);
    expect(() => instantiateCaseModules([() => ({ id: "", attach() {} })])).toThrow(/no id/);
  });
});

describe("decision ledger", () => {
  it("session.decide() records appear in finish().decisions, with the scored steps of a clean case", () => {
    const { session: s } = newCaseSession({ seed: "led-1", access: "radial-right" });
    fastForward(s, "recovery");
    s.decide({ id: "custom", stage: "recovery", label: "A custom decision", correct: false, expected: "x", given: "y", lessonId: "pm-closure-radial" });
    s.submitHandover(s.truth());
    const sum = s.finish()!;
    expect(sum).not.toBeNull();
    const ids = sum.decisions.map((d) => d.id);
    for (const id of ["time-out-backed", "time-out-before-puncture", "local-anaesthetic", "sheath-aspirated", "catheter-prepped", "radial-heparin", "aspirate-before-flush", "line-flushed", "transducer-zero-level", "wire-under-fluoroscopy", "patent-haemostasis", "custom", "handover-note", "planning-problem", "pre-puncture-checklist"]) expect(ids).toContain(id);
    // the autopilot's clean technique is scored as expected everywhere (access-route-decision: the
    // autopilot does not state a route plan, feel the pulses or watch the site, so the route-plan
    // module's 'route-' decisions are left out here; routePlan's own tests score them)
    expect(sum.decisions.filter((d) => d.id !== "custom" && !d.id.startsWith("route-")).every((d) => d.correct)).toBe(true);
    expect(sum.decisions.find((d) => d.id === "custom")!.correct).toBe(false);
    expect(sum.scenarioId).toBe("default");
  });

  it("a femoral sheath pulled without heparin needs no ACT", () => {
    const { session: s } = newCaseSession({ seed: "led-noheparin", access: "femoral" });
    prepare(s);
    gainAccess(s);
    s.runPending();
    expect(s.heparinU).toBe(0);
    s.femoralManual(FEMORAL.manualMinutes, 3);
    s.runPending();
    const act = s.decisions().find((d) => d.id === "femoral-act")!;
    expect(act.correct).toBe(true);
    expect(act.given).toBe("No heparin given");
  });

  it("errors are recorded as decisions that were not as expected", () => {
    const { session: s } = newCaseSession({ seed: "led-2", access: "femoral" });
    // puncture without a time-out or local anaesthetic
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    s.advanceNeedle(1);
    const d = Object.fromEntries(s.decisions().map((r) => [r.id, r]));
    expect(d["time-out-before-puncture"].correct).toBe(false);
    expect(d["local-anaesthetic"].correct).toBe(false);
    expect(d["time-out-before-puncture"].stage).toBe("access");
  });

  it("a step done wrongly once stays wrong when it is repeated cleanly", () => {
    const { session: s } = newCaseSession({ seed: "led-sticky", access: "radial-right", start: "sheath-in" });
    expect(s.loadCatheter("TIG")).toBe(true); // dry
    expect(s.decisions().find((d) => d.id === "catheter-prepped")!.correct).toBe(false);
    s.removeCatheter();
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    expect(s.decisions().find((d) => d.id === "catheter-prepped")!.correct).toBe(false);
    expect(s.decisions().filter((d) => d.id === "catheter-prepped")).toHaveLength(1);
  });

  it("the hand-over carries the found-handover-contract extensions", () => {
    const { session: s } = newCaseSession({ seed: "led-3", access: "radial-right", start: "post-diagnostic" });
    const h = s.toPci()!;
    expect(h.anticoag!.doses.length).toBeGreaterThan(0);
    expect(h.anticoag!.doses.reduce((a, x) => a + x.u, 0)).toBe(h.heparinU);
    expect(h.anticoag!.targetS).toEqual([250, 300]);
    expect(h.contrast!.usedMl).toBe(h.contrastMl);
    expect(h.contrast!.budgetMl).toBe(s.contrastBudgetMl);
    expect(h.sheathState!.aspirated).toBe(true);
  });
});
