// The haemodynamic study session (haemo-study-session-and-tips): phases from the catheters, events,
// learner-entered calculations graded against derive(), the shock decision table and the score.
//   npx vitest run src/simulation/haemoStudy.test.ts
import { describe, expect, it } from "vitest";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID, derive, measure, mixedVenousSat, withSet, type HaemoScenario } from "./haemo";
import { bsaDuBois } from "./calc";
import {
  CALC_KEYS,
  CALC_TOLERANCE,
  SHOCK_TABLE,
  calcAvailable,
  calcBlocked,
  currentSet,
  dataChecklist,
  diagnosisOptions,
  expectedDecision,
  haemoStudyReducer,
  initialStudy,
  recorderTimings,
  referenceValue,
  requiredCalcs,
  scoreStudy,
  shockRow,
  shownChambers,
  studyEvents,
  studyPhase,
  studyScenario,
  studyTruth,
  withinTolerance,
  HAEMO_LONG_LINE_CM,
  HAEMO_LINE,
  MANIFOLD_PORTS,
  MP_PRESET_AIR_ML,
  MP_TABLE_MOVE_CM,
  MP_UNZEROED_OFFSET_MMHG,
  SETUP_PRESETS,
  displayedMeasure,
  heightAboveLevelCm,
  lineReading,
  preparedSetup,
  setupChecks,
  setupComplete,
  finalRecordSound,
  setupDebrief,
  setupOffsetMmHg,
  setupTransducer,
  studySetup,
  type CalcKey,
  type HaemoAction,
  type HaemoStudyState,
  type TransducerSetup,
} from "./haemoStudy";

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);

/** A complete right heart study with the arterial line, the Fick pair recorded at each position. */
function rightHeartStudy(id: string, start?: string): HaemoStudyState {
  let st = play(initialStudy(id, start), { type: "art-line", on: true });
  for (let i = 0; i < 4; i++) st = play(st, { type: "rhc-advance" }, { type: "record" });
  return play(st, { type: "sat", site: "PA" }, { type: "sat", site: "Ao" });
}

describe("phase follows the catheters", () => {
  it("setup before any catheter; right-heart from RA to wedge; back to setup when withdrawn", () => {
    let st = initialStudy("normal");
    expect(studyPhase(st)).toEqual({ phase: "setup", phases: [] });
    st = play(st, { type: "art-line", on: true });
    expect(studyPhase(st).phase).toBe("setup");
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      st = play(st, { type: "rhc-advance" });
      seen.push(`${shownChambers(st)[0]}:${studyPhase(st).phase}`);
    }
    expect(seen).toEqual(["RA:right-heart", "RV:right-heart", "PA:right-heart", "PCWP:right-heart"]);
    for (let i = 0; i < 4; i++) st = play(st, { type: "rhc-withdraw" });
    expect(studyPhase(st).phase).toBe("setup");
  });

  it("left-heart with the pigtail in; both catheters report both phases, the one moved last first", () => {
    let st = play(initialStudy("normal"), { type: "lhc", position: "Ao" });
    expect(studyPhase(st)).toEqual({ phase: "left-heart", phases: [] });
    st = play(st, { type: "rhc-advance" });
    expect(studyPhase(st)).toEqual({ phase: "right-heart", phases: ["left-heart"] });
    st = play(st, { type: "lhc", position: "LV" });
    expect(studyPhase(st)).toEqual({ phase: "left-heart", phases: ["right-heart"] });
  });

  it("valves for a simultaneous LV + aortic or LV + wedge recording in a valve study only", () => {
    const lvAo = (id: string) => studyPhase(play(initialStudy(id), { type: "lhc", position: "LV" }, { type: "art-line", on: true })).phase;
    expect(lvAo("aortic-stenosis")).toBe("valves");
    expect(lvAo("hocm")).toBe("valves");
    expect(lvAo("normal")).toBe("left-heart");
    const ms = play(initialStudy("mitral-stenosis"), { type: "rhc-advance" }, { type: "rhc-advance" }, { type: "rhc-advance" }, { type: "rhc-advance" }, { type: "lhc", position: "LV" });
    expect(studyPhase(ms)).toEqual({ phase: "valves", phases: ["left-heart", "right-heart"] });
  });

  it("shunts during a saturation run, until a catheter moves; the Fick pair alone is not a run", () => {
    let st = play(initialStudy("asd"), { type: "sat", site: "PA" }, { type: "sat", site: "Ao" });
    expect(studyPhase(st).phase).toBe("setup");
    st = play(st, { type: "sat", site: "SVC" });
    expect(studyPhase(st).phase).toBe("shunts");
    st = play(st, { type: "sat", site: "PA" });
    expect(studyPhase(st).phase).toBe("shunts");
    st = play(st, { type: "rhc-advance" });
    expect(studyPhase(st).phase).toBe("right-heart");
  });

  it("calculations while the panel is open, whatever the catheters do", () => {
    let st = play(initialStudy("normal"), { type: "rhc-advance" }, { type: "calc-panel", open: true });
    expect(studyPhase(st).phase).toBe("calculations");
    st = play(st, { type: "calc-panel", open: false });
    expect(studyPhase(st).phase).toBe("right-heart");
  });

  it("a pigtail on the right reaches the main PA and cannot wedge", () => {
    let st = play(initialStudy("pe-high-risk"), { type: "rhc-catheter", catheter: "pigtail" });
    for (let i = 0; i < 6; i++) st = play(st, { type: "rhc-advance" });
    expect(shownChambers(st)).toEqual(["PA"]);
  });
});

describe("events", () => {
  it("the scenario's own events for the whole study, plus launch events", () => {
    expect(studyEvents(initialStudy("aortic-stenosis"))).toEqual(["aortic-stenosis"]);
    expect(studyEvents(initialStudy("normal"))).toEqual([]);
    expect(studyEvents(initialStudy("normal", null, ["vasopressor"]))).toEqual(["vasopressor"]);
    const st = play(initialStudy("normal"), { type: "raise", event: "ventilated" });
    expect(studyEvents(st)).toEqual(["ventilated"]);
    expect(studyEvents(play(st, { type: "clear-event", event: "ventilated" }))).toEqual([]);
  });

  it("hypotension once a MAP below 65 mmHg is on the screen or recorded, not before", () => {
    const st = initialStudy("shock-lv");
    expect(studyEvents(st)).not.toContain("hypotension");
    const art = play(st, { type: "art-line", on: true });
    expect(studyEvents(art)).toContain("hypotension");
    const rec = play(art, { type: "record" }, { type: "art-line", on: false });
    expect(studyEvents(rec)).toContain("hypotension");
    // after PCI the MAP is above 65: not hypotensive
    const post = play(rec, { type: "next-set" }, { type: "art-line", on: true });
    expect(studyEvents(post)).not.toContain("hypotension");
    // the fifteen original scenarios all have a MAP of at least 65 mmHg
    expect(studyEvents(play(initialStudy("lv-shock"), { type: "art-line", on: true }))).not.toContain("hypotension");
  });
});

describe("learner-entered calculations", () => {
  it("CPO 0.01 W off is accepted and 0.05 W off rejected", () => {
    const st = rightHeartStudy("shock-lv");
    expect(calcAvailable(st, "cpo")).toBe(true);
    const cpo = studyTruth(st).cpo;
    const near = play(st, { type: "enter", key: "cpo", value: cpo + 0.01 });
    expect(currentSet(near).entries.cpo).toMatchObject({ accepted: true, firstAccepted: true, attempts: 1 });
    const far = play(st, { type: "enter", key: "cpo", value: cpo - 0.05 });
    expect(currentSet(far).entries.cpo).toMatchObject({ accepted: false, firstAccepted: false });
    // a second, correct entry is accepted but the first one counts for the score
    const again = play(far, { type: "enter", key: "cpo", value: cpo });
    expect(currentSet(again).entries.cpo).toMatchObject({ accepted: true, firstAccepted: false, attempts: 2 });
  });

  it("tolerances: PAPi 0.1, Qp:Qs 0.1, SVR 10%", () => {
    expect(withinTolerance("papi", 1.69, 1.6)).toBe(true);
    expect(withinTolerance("papi", 1.75, 1.6)).toBe(false);
    expect(withinTolerance("qpqs", 2.09, 2.0)).toBe(true);
    expect(withinTolerance("qpqs", 2.15, 2.0)).toBe(false);
    expect(withinTolerance("svr", 19.5, 18)).toBe(true);
    expect(withinTolerance("svr", 20, 18)).toBe(false);
    expect(CALC_TOLERANCE.cpo.abs).toBe(0.02);
    expect(withinTolerance("cpo", NaN, 0.5)).toBe(false);
  });

  it("a calculation needs its inputs: no entry is taken before the data are recorded", () => {
    const st = initialStudy("normal");
    expect(calcAvailable(st, "co")).toBe(false);
    const after = play(st, { type: "enter", key: "co", value: 5 });
    expect(after).toBe(st);
    // the valve area needs the simultaneous recording
    const as = rightHeartStudy("aortic-stenosis");
    expect(calcAvailable(as, "ava")).toBe(false);
    const sim = play(as, { type: "lhc", position: "LV" }, { type: "record" });
    expect(calcAvailable(sim, "ava")).toBe(true);
    expect(currentSet(sim).rec.aorticMeanGradient).toBe(Math.round(derive(SCENARIO_BY_ID["aortic-stenosis"]).aortic.mean));
    const ava = referenceValue(studyTruth(sim), "ava");
    expect(currentSet(play(sim, { type: "enter", key: "ava", value: ava + 0.05 })).entries.ava?.accepted).toBe(true);
  });

  it("each entry is graded against derive() of the set being measured", () => {
    const pre = rightHeartStudy("shock-biv");
    const post = play(pre, { type: "next-set" }, { type: "record" }, { type: "sat", site: "PA" }, { type: "sat", site: "Ao" });
    expect(post.set).toBe("post");
    expect(studyTruth(post).cpo).toBeCloseTo(derive(withSet(SCENARIO_BY_ID["shock-biv"], "post")).cpo, 10);
    // the pre-PCI CPO is not accepted after PCI
    const preCpo = studyTruth(pre).cpo;
    expect(currentSet(play(post, { type: "enter", key: "cpo", value: preCpo })).entries.cpo?.accepted).toBe(false);
    // the pre set keeps its own recordings
    expect(post.sets.pre?.rec.chambers.PCWP).toBeDefined();
  });
});

/** Every recording a full study makes: each right heart position, LV + wedge + aorta together, the whole saturation run. */
function fullStudy(id: string, start?: string): HaemoStudyState {
  let st = rightHeartStudy(id, start);
  st = play(st, { type: "lhc", position: "LV" }, { type: "record" });
  for (const k of ["SVC", "IVC", "RA", "RV", "PA", "Ao"] as const) st = play(st, { type: "sat", site: k });
  return st;
}

/** A learner's answer to a calculation, worked out only from what the lab screen shows. */
function fromScreen(st: HaemoStudyState, key: CalcKey): number {
  const s = studyScenario(st);
  const r = currentSet(st).rec;
  const c = r.chambers;
  const sat = (k: keyof typeof r.sats) => Math.round(r.sats[k]! * 100) / 100; // shown as whole per cent
  const bsa = Math.round(bsaDuBois(s.heightCm, s.weightKg) * 100) / 100; // shown to 2 dp
  const vo2 = 125 * bsa; // the formula's assumption
  const shownSats = { SVC: sat("SVC"), IVC: sat("IVC"), RA: sat("RA"), RV: sat("RV"), PA: sat("PA"), Ao: sat("Ao") };
  const mv = mixedVenousSat({ ...s, sats: shownSats } as HaemoScenario); // the chamber proximal to any step-up
  const ao = shownSats.Ao;
  const co = vo2 / (13.6 * s.hb * (ao - mv));
  const qp = vo2 / (13.6 * s.hb * (ao - shownSats.PA)); // PvO₂ = SaO₂
  const t = recorderTimings(st);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  switch (key) {
    case "co":
      return co;
    case "ci":
      return co / bsa;
    case "svr":
      return (c.Ao!.mean - c.RA!.mean) / co;
    case "pvr":
      return (c.PA!.mean - c.PCWP!.mean) / qp;
    case "tpg":
      return c.PA!.mean - c.PCWP!.mean;
    case "qpqs":
      return (ao - mv) / (ao - shownSats.PA);
    case "cpo":
      return (c.Ao!.mean * co) / 451;
    case "papi":
      return (c.PA!.sys - c.PA!.dia) / c.RA!.mean;
    case "ava":
      return (co * 1000) / (t.hr * r2(t.sep) * 44.3 * Math.sqrt(r.aorticMeanGradient!));
    case "mva":
      return (co * 1000) / (t.hr * r2(t.dfp) * 37.7 * Math.sqrt(r.mitralMeanGradient!));
  }
}

describe("the reference is reachable from the screen", () => {
  it("every required calculation in every scenario and set, worked out from the displayed values, is accepted", () => {
    const misses: string[] = [];
    let checked = 0;
    for (const s of HAEMO_SCENARIOS) {
      const starts = s.sets ? ["pre", "post"] : [undefined];
      for (const start of starts) {
        const st = fullStudy(s.id, start);
        for (const key of requiredCalcs(s)) {
          expect(calcAvailable(st, key), `${s.id}/${start ?? "base"} ${key} available`).toBe(true);
          const v = fromScreen(st, key);
          const ref = referenceValue(studyTruth(st), key);
          checked += 1;
          if (!withinTolerance(key, v, ref)) misses.push(`${s.id}/${start ?? "base"} ${key}: screen ${v.toFixed(3)} vs ref ${ref.toFixed(3)}`);
          // and the reducer accepts it at the first entry
          expect(currentSet(play(st, { type: "enter", key, value: v })).entries[key]?.firstAccepted).toBe(withinTolerance(key, v, ref));
        }
      }
    }
    expect(misses).toEqual([]);
    expect(checked).toBeGreaterThan(HAEMO_SCENARIOS.length);
  });

  it("every available calculation, required or not, is reachable from the screen", () => {
    const misses: string[] = [];
    for (const s of HAEMO_SCENARIOS) {
      for (const start of s.sets ? ["pre", "post"] : [undefined]) {
        const st = fullStudy(s.id, start);
        for (const key of CALC_KEYS) {
          if (!calcAvailable(st, key)) continue;
          const v = fromScreen(st, key);
          const ref = referenceValue(studyTruth(st), key);
          if (!withinTolerance(key, v, ref)) misses.push(`${s.id}/${start ?? "base"} ${key}: screen ${v.toFixed(3)} vs ref ${ref.toFixed(3)}`);
        }
      }
    }
    expect(misses).toEqual([]);
  });

  it("Qp:Qs in the ASD and VSR follows the displayed saturations (PvO₂ = SaO₂); derive() keeps the model's pulmonary venous value", () => {
    for (const id of ["asd", "vsr"]) {
      const st = fullStudy(id);
      const sats = currentSet(st).rec.sats;
      const s = SCENARIO_BY_ID[id];
      const mv = mixedVenousSat(s);
      const learner = (sats.Ao! - mv) / (sats.Ao! - sats.PA!);
      expect(currentSet(play(st, { type: "enter", key: "qpqs", value: learner })).entries.qpqs?.accepted).toBe(true);
      expect(referenceValue(studyTruth(st), "qpqs")).toBeCloseTo(learner, 10);
      // derive() is unchanged and still uses the hidden pulmonary venous saturation
      expect(derive(s).qpqs).not.toBeCloseTo(learner, 1);
      expect(studyTruth(st).qpqs).toBeGreaterThan(1.5);
    }
    // with the systemic CO in a shunt, PVR is not accepted: it divides by Qp
    const asd = fullStudy("asd");
    const d = studyTruth(asd);
    expect(withinTolerance("pvr", (d.mpap - d.pawp) / d.co, d.pvr)).toBe(false);
    expect(d.pvr).toBeCloseTo((d.mpap - d.pawp) / d.qp, 10);
  });

  it("no Gorlin aortic valve area in HOCM: blocked with the fixed-orifice caveat", () => {
    const st = fullStudy("hocm");
    expect(currentSet(st).rec.simLVAo).toBe(true);
    expect(calcAvailable(st, "ava")).toBe(false);
    expect(calcBlocked(st, "ava")).toMatch(/fixed orifice: not valid for dynamic LVOT obstruction/);
    expect(play(st, { type: "enter", key: "ava", value: 1 })).toBe(st);
    expect(calcBlocked(fullStudy("aortic-stenosis"), "ava")).toBeUndefined();
  });
});

describe("the shock decision table", () => {
  it("rows follow the module: wean, right-sided, more support, right-sided if RV dysfunction is suspected", () => {
    expect(shockRow(0.7, 1.2).expected).toBe("wean");
    expect(shockRow(0.5, 0.6).expected).toBe("right-sided");
    expect(shockRow(0.5, 1.2).expected).toBe("more-support");
    expect(shockRow(0.7, 0.6)).toBe(SHOCK_TABLE[3]);
    expect(SHOCK_TABLE[3].expected).toBe("right-sided");
    // the action text is the module's wording (src/content/manual/pci-manual/16-support-choice.ts)
    expect(SHOCK_TABLE.map((r) => r.action)).toEqual([
      "Wean vasopressors and inotropes; decide whether the pump comes out in the lab or stays",
      "Consider right-sided support",
      "Consider more support: a more powerful device, or transfer to an LVAD or transplant centre",
      "Consider right-sided support if RV dysfunction is suspected clinically",
    ]);
  });

  it("the shock-biv post set routes to the right-sided (biventricular) row; shock-lv to wean; shock-rv to the RV-suspected row", () => {
    const row = (id: string) => {
      const d = derive(withSet(SCENARIO_BY_ID[id], "post"));
      return shockRow(d.cpo, d.papi);
    };
    expect(row("shock-biv")).toBe(SHOCK_TABLE[1]);
    expect(row("shock-biv").action).toMatch(/right-sided support/);
    expect(row("shock-lv")).toBe(SHOCK_TABLE[0]);
    expect(row("shock-rv")).toBe(SHOCK_TABLE[3]);
    expect(expectedDecision(SCENARIO_BY_ID["shock-biv"])).toBe("right-sided");
    expect(expectedDecision(SCENARIO_BY_ID.normal)).toBeNull();
  });

  it("the decision is taken in the after-PCI set only, and a launch can start there", () => {
    const pre = initialStudy("shock-biv");
    expect(play(pre, { type: "decide", action: "wean" })).toBe(pre);
    const post = initialStudy("shock-biv", "post");
    expect(post.set).toBe("post");
    expect(post.sets.pre).toBeUndefined();
    expect(currentSet(play(post, { type: "decide", action: "right-sided" })).decision).toBe("right-sided");
    // a scenario without sets ignores the start
    expect(initialStudy("normal", "post").set).toBe("base");
  });
});

describe("checklist, diagnosis and score", () => {
  it("the data checklist of the original scenarios is unchanged", () => {
    expect(dataChecklist(SCENARIO_BY_ID.normal).map((q) => q.key)).toEqual(["RA", "RV", "PA", "PCWP", "Ao", "sats"]);
    expect(dataChecklist(SCENARIO_BY_ID["aortic-stenosis"]).map((q) => q.key)).toContain("lvao");
    expect(dataChecklist(SCENARIO_BY_ID.asd).map((q) => q.key)).toContain("run");
    expect(dataChecklist(SCENARIO_BY_ID["lv-shock"]).map((q) => q.key)).toContain("LV");
  });

  it("a complete shock study with the right numbers, decision and diagnosis passes; a wrong decision does not", () => {
    let st = rightHeartStudy("shock-biv");
    const enter = (s: HaemoStudyState) => {
      const d = studyTruth(s);
      return play(s, { type: "enter", key: "co", value: d.co }, { type: "enter", key: "cpo", value: d.cpo }, { type: "enter", key: "papi", value: d.papi });
    };
    st = enter(st);
    st = play(st, { type: "next-set" }, { type: "art-line", on: true });
    for (let i = 0; i < 4; i++) st = play(st, { type: "rhc-withdraw" });
    for (let i = 0; i < 4; i++) st = play(st, { type: "rhc-advance" }, { type: "record" });
    st = enter(play(st, { type: "sat", site: "PA" }, { type: "sat", site: "Ao" }));
    const idx = diagnosisOptions(SCENARIO_BY_ID["shock-biv"]).indexOf(SCENARIO_BY_ID["shock-biv"].diagnosis);
    const good = play(st, { type: "decide", action: "right-sided" }, { type: "answer", index: idx });
    const r = scoreStudy(good);
    expect(r.passed).toBe(true);
    expect(r.metrics).toMatchObject({ calcsAccepted: 6, calcsRequired: 6, decisionCorrect: 1 });
    expect(r.score).toBe(100);
    const bad = scoreStudy(play(st, { type: "decide", action: "wean" }, { type: "answer", index: idx }));
    expect(bad.passed).toBe(false);
    expect(bad.score).toBeLessThan(100);
    // the study is a record once submitted
    expect(play(good, { type: "rhc-withdraw" })).toBe(good);
  });

  it("every scenario loads, and an unknown one is refused", () => {
    for (const s of HAEMO_SCENARIOS) expect(initialStudy(s.id).scenarioId).toBe(s.id);
    expect(() => initialStudy("nope")).toThrow(/unknown/);
  });
});

// ---------------------------------------------------------------------------
// Transducer set-up (haemo-transducer-and-setup)
// ---------------------------------------------------------------------------

const SET_UP: HaemoAction[] = [
  { type: "setup-level", landmark: "mid-thoracic" },
  { type: "setup-stopcock", to: "air" },
  { type: "setup-zero" },
  { type: "setup-stopcock", to: "patient" },
];
const FLUSH_ALL = MANIFOLD_PORTS.map((_, port): HaemoAction => ({ type: "manifold-flush", port }));
const recordedRA = (st: HaemoStudyState) => currentSet(play(st, { type: "record" })).rec.chambers.RA!;
const trueRA = (st: HaemoStudyState) => measure(studyScenario(st), "RA");
const withSetup = (st: HaemoStudyState, patch: Partial<TransducerSetup>): HaemoStudyState => ({ ...st, setup: { ...studySetup(st), ...patch } });

describe("transducer set-up: levelling and zeroing", () => {
  it("a transducer 10 cm above the level under-reads RA by about 7.4 mmHg; re-levelling and zeroing remove it; a table move with a pole transducer re-introduces it", () => {
    // set up by someone else: zeroed, but level with the V4 electrode
    let st = play(initialStudy("pah", "setup-v4-level"), { type: "rhc-advance" });
    expect(heightAboveLevelCm(studySetup(st))).toBe(10);
    expect(setupOffsetMmHg(studySetup(st))).toBeCloseTo(-7.4, 1);
    expect(recordedRA(st).mean - trueRA(st).mean).toBeCloseTo(-7.4, 0);
    expect(recordedRA(st).a! - trueRA(st).a!).toBeCloseTo(-7.4, 0);
    // level at the mid-thoracic level, then zero to air: the reading is true
    st = play(st, ...SET_UP);
    expect(recordedRA(st)).toEqual(trueRA(st));
    // lower the table 10 cm with the transducer on a pole: 10 cm above the level again
    const lowered = play(st, { type: "setup-table", deltaCm: -10 });
    expect(heightAboveLevelCm(studySetup(lowered))).toBe(10);
    expect(recordedRA(lowered).mean - trueRA(st).mean).toBeCloseTo(-7.4, 0);
    // raised 10 cm, the transducer is below the level and reads high
    const raised = play(st, { type: "setup-table", deltaCm: 10 });
    expect(recordedRA(raised).mean - trueRA(st).mean).toBeCloseTo(7.4, 0);
    // a transducer on the table rail moves with the table
    const rail = play(withSetup(st, { mount: "table" }), { type: "setup-table", deltaCm: 10 });
    expect(recordedRA(rail)).toEqual(trueRA(st));
  });

  it("the phase stays 'setup' until the transducer is zeroed and level; the catheter's phase rides along", () => {
    let st = initialStudy("normal", "setup-table-move");
    expect(studyPhase(st).phase).toBe("setup");
    // the table-move preset raises the table at insertion only once the set-up is done: insert first here
    st = play(st, { type: "rhc-advance" });
    expect(studyPhase(st)).toEqual({ phase: "setup", phases: ["right-heart"] });
    st = play(st, { type: "setup-level", landmark: "mid-thoracic" });
    expect(studyPhase(st).phase).toBe("setup");
    st = play(st, { type: "setup-stopcock", to: "air" }, { type: "setup-zero" });
    // open to air: still setting up
    expect(studyPhase(st).phase).toBe("setup");
    st = play(st, { type: "setup-stopcock", to: "patient" });
    expect(studyPhase(st)).toEqual({ phase: "right-heart", phases: [] });
  });

  it("zeroing needs the transducer open to air; open to air every channel reads the zero offset", () => {
    let st = play(initialStudy("normal", "setup-overdamped-air"), { type: "setup-level", landmark: "mid-thoracic" }, { type: "rhc-advance" });
    expect(studySetup(st).zeroed).toBe(false);
    expect(recordedRA(play(st, { type: "setup-fix", fix: "reprime" })).mean - trueRA(st).mean).toBeCloseTo(MP_UNZEROED_OFFSET_MMHG, 0);
    st = play(st, { type: "setup-zero" });
    expect(studySetup(st)).toMatchObject({ zeroed: false, zeroRefused: 1 });
    st = play(st, { type: "setup-stopcock", to: "air" });
    expect(displayedMeasure(st, "RA")).toMatchObject({ mean: MP_UNZEROED_OFFSET_MMHG, a: MP_UNZEROED_OFFSET_MMHG });
    st = play(st, { type: "setup-zero" });
    expect(displayedMeasure(st, "RA")).toMatchObject({ mean: 0, sys: 0 });
    st = play(st, { type: "setup-stopcock", to: "patient" }, { type: "setup-fix", fix: "reprime" });
    expect(recordedRA(st)).toEqual(trueRA(st));
  });

  it("the table moves even when the catheter went in before the set-up was done", () => {
    let st = play(initialStudy("normal", "setup-table-move"), ...FLUSH_ALL, { type: "rhc-advance" }, ...SET_UP);
    expect(studySetup(st)).toMatchObject({ tableMoved: false, tableMovePending: true });
    st = play(st, { type: "rhc-advance" });
    expect(studySetup(st)).toMatchObject({ tableMoved: true, tableMovePending: false, tableCm: MP_TABLE_MOVE_CM });
    expect(studyPhase(st).phase).toBe("setup");
    expect(recordedRA(play(st, { type: "rhc-withdraw" })).mean - trueRA(st).mean).toBeCloseTo(7.4, 0);
    // it moves once only
    expect(studySetup(play(st, { type: "rhc-withdraw" }, { type: "rhc-advance" })).tableCm).toBe(MP_TABLE_MOVE_CM);
    expect(setupChecks(st).map((c) => c.key)).toContain("relevel");
  });

  it("a transducer moved to the table rail before the table moves stays level, and the check is met", () => {
    let st = play(initialStudy("normal", "setup-table-move"), ...FLUSH_ALL, ...SET_UP, { type: "setup-mount", mount: "table" });
    expect(studySetup(st).mount).toBe("table");
    // moving the mount keeps the height, so the set-up is still complete
    expect(setupComplete(studySetup(st))).toBe(true);
    st = play(st, { type: "rhc-advance" });
    expect(studySetup(st)).toMatchObject({ tableMoved: true, relevelledAfterMove: true });
    expect(recordedRA(st)).toEqual(trueRA(st));
    expect(studyPhase(st).phase).toBe("right-heart");
    // the same mount again changes nothing
    expect(play(st, { type: "setup-mount", mount: "table" })).toBe(st);
  });

  it("the table-move preset raises the table at the first insertion after the set-up; re-levelling is detected", () => {
    let st = play(initialStudy("normal", "setup-table-move"), ...FLUSH_ALL, ...SET_UP);
    expect(studySetup(st).tableMoved).toBe(false);
    st = play(st, { type: "rhc-advance" });
    expect(studySetup(st)).toMatchObject({ tableMoved: true, tableCm: MP_TABLE_MOVE_CM, relevelledAfterMove: false });
    expect(studyPhase(st)).toEqual({ phase: "setup", phases: ["right-heart"] });
    expect(recordedRA(st).mean - trueRA(st).mean).toBeCloseTo(7.4, 0);
    st = play(st, { type: "setup-level", landmark: "mid-thoracic" });
    expect(studySetup(st).relevelledAfterMove).toBe(true);
    expect(recordedRA(st)).toEqual(trueRA(st));
    // a level check reports what an operator sees
    expect(studySetup(play(st, { type: "setup-check-level" })).lastCheck).toBe("level");
    expect(studySetup(play(st, { type: "setup-level", landmark: "v4" }, { type: "setup-check-level" })).lastCheck).toBe("above");
  });

  it("right heart and wedge pressures recorded after a proper set-up are within 2 mmHg of the true values", () => {
    let st = play(initialStudy("normal", "setup-table-move"), ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "setup-level", landmark: "mid-thoracic" });
    for (const c of ["RA", "RV", "PA", "PCWP"] as const) {
      if (c !== "RA") st = play(st, { type: "rhc-advance" });
      st = play(st, { type: "record" });
      const rec = currentSet(st).rec.chambers[c]!;
      const tru = measure(studyScenario(st), c);
      for (const k of ["sys", "dia", "mean"] as const) expect(Math.abs(rec[k] - tru[k]), `${c} ${k}`).toBeLessThanOrEqual(2);
    }
  });
});

describe("transducer set-up: the fast-flush test and the line", () => {
  const reading = (patch: Partial<TransducerSetup["line"]>) => lineReading({ ...preparedSetup(), line: { ...preparedSetup().line, ...patch } }).reading;

  it("fast-flush verdicts: optimal for the default line, overdamped with 0.3 mL air, underdamped with a 300 cm line", () => {
    expect(reading({})).toBe("optimal");
    expect(MP_PRESET_AIR_ML).toBe(0.3);
    expect(reading({ airMl: 0.3 })).toBe("overdamped");
    expect(HAEMO_LONG_LINE_CM).toBe(300);
    expect(reading({ long: true })).toBe("underdamped");
    // the other causes of overdamping the module names: a kink and clot
    expect(reading({ kinked: true })).toBe("overdamped");
    expect(reading({ clot: true })).toBe("overdamped");
    // the default line by its dynamics: above 24 Hz, in the optimal damping band, one or two visible oscillations
    const d = setupTransducer(preparedSetup()).dynamic();
    expect(d.fnHz).toBeGreaterThan(24);
    expect(d.zeta).toBeGreaterThanOrEqual(0.55);
    expect(d.zeta).toBeLessThanOrEqual(0.7);
    expect(d.verdict).toBe("optimal");
    expect(lineReading(preparedSetup()).oscillations).toBeGreaterThanOrEqual(1);
    expect(lineReading(preparedSetup()).oscillations).toBeLessThanOrEqual(2);
    expect(HAEMO_LINE.dampingGain).toBeDefined();
  });

  it("the long line rings visibly: more than two oscillations, a natural frequency under 24 Hz and a systolic overshoot", () => {
    const long = { ...preparedSetup(), line: { ...preparedSetup().line, long: true } };
    expect(lineReading(long).oscillations).toBeGreaterThan(2);
    const d = setupTransducer(long).dynamic();
    expect(d.fnHz).toBeLessThan(24);
    expect(d.zeta).toBeLessThan(0.35);
    // through the long line, set up otherwise right: systolic over-read, the mean close
    let st = play(initialStudy("normal", "setup-underdamped-long-line"), ...FLUSH_ALL, ...SET_UP, { type: "art-line", on: true });
    for (let i = 0; i < 3; i++) st = play(st, { type: "rhc-advance" });
    expect(shownChambers(st)).toEqual(["PA", "Ao"]);
    const s = studyScenario(st);
    const pa = displayedMeasure(st, "PA");
    const ao = displayedMeasure(st, "Ao");
    expect(pa.sys).toBeGreaterThan(measure(s, "PA").sys);
    expect(ao.sys).toBeGreaterThanOrEqual(measure(s, "Ao").sys + 2);
    expect(Math.abs(ao.mean - measure(s, "Ao").mean)).toBeLessThanOrEqual(1);
    // replaced with a standard line, the read-out is true again
    const fixed = play(st, { type: "setup-fix", fix: "standard-line" });
    expect(displayedMeasure(fixed, "PA")).toEqual(measure(s, "PA"));
    expect(displayedMeasure(fixed, "Ao")).toEqual(measure(s, "Ao"));
  });

  it("the overdamped preset: the flush is read and graded, the air is cleared, and pressure-damped is raised only while it lasts", () => {
    let st = play(initialStudy("normal", "setup-overdamped-air"), ...SET_UP);
    expect(studyEvents(st)).not.toContain("pressure-damped");
    st = play(st, { type: "setup-fast-flush" });
    expect(studySetup(st)).toMatchObject({ flushes: 1, awaitingReading: true, lastFlush: { reading: "overdamped" } });
    expect(studyEvents(st)).toContain("pressure-damped");
    st = play(st, { type: "setup-read-flush", reading: "overdamped" });
    expect(studySetup(st).readings).toEqual([{ given: "overdamped", expected: "overdamped" }]);
    // one reading per flush
    expect(play(st, { type: "setup-read-flush", reading: "optimal" })).toBe(st);
    // an overdamped line under-reads systolic and over-reads diastolic, the mean stays close
    const inPA = play(st, { type: "rhc-advance" }, { type: "rhc-advance" }, { type: "rhc-advance" });
    const pa = displayedMeasure(inPA, "PA");
    const paTrue = measure(studyScenario(inPA), "PA");
    expect(pa.sys).toBeLessThan(paTrue.sys - 2);
    expect(pa.dia).toBeGreaterThan(paTrue.dia + 2);
    expect(Math.abs(pa.mean - paTrue.mean)).toBeLessThanOrEqual(2);
    st = play(inPA, { type: "setup-fix", fix: "reprime" });
    expect(lineReading(studySetup(st)).reading).toBe("optimal");
    expect(studyEvents(st)).not.toContain("pressure-damped");
    st = play(st, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" });
    expect(studySetup(st).readings.map((r) => r.given === r.expected)).toEqual([true, true]);
  });

  it("the underdamped preset: a long extension reads underdamped until replaced; a wrong reading is recorded as wrong", () => {
    let st = play(initialStudy("normal", "setup-underdamped-long-line"), ...SET_UP, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" });
    expect(studySetup(st).readings).toEqual([{ given: "optimal", expected: "underdamped" }]);
    st = play(st, { type: "setup-fix", fix: "standard-line" }, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" });
    expect(studySetup(st).readings[1]).toEqual({ given: "optimal", expected: "optimal" });
  });
});

describe("transducer set-up: the manifold", () => {
  it("injecting through an unflushed manifold raises air and is a critical error", () => {
    const st = play(initialStudy("normal", "setup-table-move"), ...SET_UP);
    // no catheter in the patient: nothing is injected
    expect(play(st, { type: "manifold-inject" })).toBe(st);
    const inj = play(st, { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(studySetup(inj).airInjected).toBe(true);
    expect(studyEvents(inj)).toContain("air");
    const idx = diagnosisOptions(SCENARIO_BY_ID.normal).indexOf(SCENARIO_BY_ID.normal.diagnosis);
    const r = scoreStudy(play(inj, { type: "answer", index: idx }));
    expect(r.correct).toBe(true);
    expect(r.passed).toBe(false);
    expect(r.metrics.criticalErrors).toBe(1);
    // flushed first, nothing goes in
    const clean = play(st, ...FLUSH_ALL, { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(studySetup(clean)).toMatchObject({ airInjected: false, injections: 1 });
    expect(studyEvents(clean)).not.toContain("air");
  });

  it("the assistant's manifold hides one bubble until it is inspected; flushing every port clears it unseen", () => {
    const st = play(initialStudy("normal", "setup-hidden-bubble"), ...SET_UP, { type: "rhc-advance" });
    const visible = (s: HaemoStudyState) => studySetup(s).manifold.filter((p) => p.air && !p.hidden).length;
    expect(visible(st)).toBe(0);
    expect(studySetup(st).manifold.filter((p) => p.air)).toHaveLength(1);
    const looked = play(st, { type: "manifold-inspect" });
    expect(visible(looked)).toBe(1);
    expect(studySetup(play(st, { type: "manifold-inject" })).airInjected).toBe(true);
    expect(studySetup(play(st, ...FLUSH_ALL, { type: "manifold-inject" })).airInjected).toBe(false);
  });
});

describe("transducer set-up: presets, recording and the debrief", () => {
  it("a normal study begins set up and records the true pressures with no debrief fields; the original studies are unchanged", () => {
    for (const s of HAEMO_SCENARIOS) {
      const st0 = initialStudy(s.id);
      expect(studySetup(st0).preset, s.id).toBeNull();
      expect(setupComplete(studySetup(st0)), s.id).toBe(true);
      const st = play(st0, { type: "art-line", on: true }, { type: "rhc-advance" }, { type: "record" });
      const rec = currentSet(st).rec;
      expect(rec.chambers.RA, s.id).toEqual(measure(studyScenario(st), "RA"));
      expect(rec.chambers.Ao, s.id).toEqual(measure(studyScenario(st), "Ao"));
      expect(rec.truth, s.id).toBeUndefined();
      expect(rec.faults, s.id).toBeUndefined();
      expect(scoreStudy(st).metrics.setupChecks, s.id).toBeUndefined();
    }
    // a state from before the set-up existed reads as prepared
    const { setup: _drop, ...old } = initialStudy("normal");
    void _drop;
    expect(displayedMeasure(old as HaemoStudyState, "RA")).toEqual(measure(SCENARIO_BY_ID.normal, "RA"));
  });

  it("the V4 preset does not show where the colleague levelled the transducer; an unknown action changes nothing", () => {
    const st = initialStudy("pah", "setup-v4-level");
    expect(studySetup(st).landmark).toBeNull();
    expect(heightAboveLevelCm(studySetup(st))).toBe(10);
    expect(haemoStudyReducer(st, { type: "setup-nonsense" } as unknown as HaemoAction)).toBe(st);
  });

  it("the record check follows the final data: a pressure recorded through a fault and recorded again right passes", () => {
    let st = play(initialStudy("pah", "setup-v4-level"), { type: "rhc-advance" }, { type: "record" });
    expect(finalRecordSound(st)).toBe(false);
    expect(setupChecks(st).find((c) => c.key === "records")!.ok).toBe(false);
    st = play(st, ...SET_UP, { type: "record" });
    expect(finalRecordSound(st)).toBe(true);
    expect(setupChecks(st).find((c) => c.key === "records")!.ok).toBe(true);
    // the count of faulty recordings is kept as a metric
    expect(studySetup(st).recordsFaulty).toBe(1);
    expect(finalRecordSound(initialStudy("pah", "setup-v4-level"))).toBe(false);
  });

  it("with nothing recorded the record check says so instead of reporting a set-up fault", () => {
    const st = play(initialStudy("normal", "setup-hidden-bubble"), ...SET_UP, { type: "rhc-advance" });
    const rec = setupChecks(st).find((c) => c.key === "records")!;
    expect(rec.ok).toBe(false);
    expect(rec.label).toMatch(/No pressures recorded/);
    const done = play(st, { type: "record" });
    expect(setupChecks(done).find((c) => c.key === "records")!.label).toMatch(/^Every pressure/);
  });

  it("the left-heart catheter takes only its own positions", () => {
    const st = initialStudy("normal");
    expect(haemoStudyReducer(st, { type: "lhc", position: "aortic-root" } as unknown as HaemoAction)).toBe(st);
    expect(play(st, { type: "lhc", position: "Ao" }).lhc).toBe("Ao");
  });

  it("every preset loads at its start; an unknown start leaves a prepared set-up", () => {
    for (const p of SETUP_PRESETS) expect(studySetup(initialStudy("normal", p)).preset).toBe(p);
    expect(studySetup(initialStudy("normal", "nope")).preset).toBeNull();
    // a shock preset still reads its sets from the start
    expect(initialStudy("shock-lv", "post").set).toBe("post");
  });

  it("recorded pressures keep the truth and the faults for the debrief; a careful study passes with every set-up check met", () => {
    let st = initialStudy("pah", "setup-v4-level");
    st = play(st, { type: "rhc-advance" }, { type: "record" });
    st = play(st, ...SET_UP, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" }, { type: "record" });
    const rows = setupDebrief(st);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ chamber: "RA", faults: [] });
    expect(rows[0].recorded).toEqual(rows[0].truth);
    expect(studySetup(st)).toMatchObject({ recordsFaulty: 1, recordsClean: 1 });
    const faulty = play(initialStudy("pah", "setup-v4-level"), { type: "rhc-advance" }, { type: "record" });
    expect(setupDebrief(faulty)[0].faults).toEqual(["not-level"]);
    expect(setupDebrief(faulty)[0].recorded.mean).toBeLessThan(setupDebrief(faulty)[0].truth.mean);

    // a careful study from the table-move preset
    let good = play(initialStudy("normal", "setup-table-move"), ...FLUSH_ALL, ...SET_UP, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" }, { type: "art-line", on: true });
    good = play(good, { type: "rhc-advance" }, { type: "setup-level", landmark: "mid-thoracic" });
    for (let i = 0; i < 4; i++) good = play(good, ...(i ? [{ type: "rhc-advance" } as HaemoAction] : []), { type: "record" });
    good = play(good, { type: "manifold-inject" });
    const idx = diagnosisOptions(SCENARIO_BY_ID.normal).indexOf(SCENARIO_BY_ID.normal.diagnosis);
    good = play(good, { type: "answer", index: idx });
    const checks = setupChecks(good);
    expect(checks.filter((c) => !c.ok)).toEqual([]);
    expect(checks.map((c) => c.key)).toContain("relevel");
    const r = scoreStudy(good);
    expect(r.passed).toBe(true);
    expect(r.metrics).toMatchObject({ setupChecksMet: checks.length, criticalErrors: 0, recordedWithSetupFault: 0 });
    // the study is a record once submitted
    expect(play(good, { type: "setup-zero" })).toBe(good);
  });
});
