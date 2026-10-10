// The coronary function test in ANOCA (physiology-anoca-cft): the four presets meet their endotype's
// definitions, the study runs in the UK consensus order, acetylcholine is active only while a dose is
// being given or read, the order and safety errors are recorded, and the endotype answer is scored.
//   npx vitest run src/simulation/physiology/ach.test.ts
import { describe, expect, it } from "vitest";
import { ANOCA_SCENARIOS } from "../../content/lab/presets/physiology/anoca.launch";
import { CUTOFF, thermodilution } from "../physiology";
import { MP_SUBMAXIMAL_H } from "../pci/pwSession";
import {
  ACH_PROTOCOLS,
  ANOCA_PRESETS,
  ANOCA_PRESET_BY_ID,
  CFT_GTN_MAX_UG,
  CFT_IV_ADENOSINE_UG_KG_MIN,
  ENDOTYPES,
  MP_ACH_ESCAPE_HR,
  MP_ANGIO_EYE_STEP,
  achProvocation,
  adenosineRunning,
  cftCase,
  cftCaseWith,
  cftHyperaemia,
  cftItems,
  cftMarkers,
  cftPressures,
  cftReadings,
  cftReducer,
  cftVitals,
  classifyEndotype,
  constrictionNow,
  initialCftState,
  presetFindings,
  scoreCft,
  symptomsNow,
  twoViewsApart,
  viewSeparationDeg,
  type CftAction,
  type CftState,
} from "./ach";

const run = (s: CftState, ...as: CftAction[]) => as.reduce(cftReducer, s);
const tick = (s: CftState, seconds: number, step = 0.5, watch?: (s: CftState) => void) => {
  for (let i = 0; i < Math.round(seconds / step); i++) {
    s = cftReducer(s, { type: "tick", dt: step });
    watch?.(s);
  }
  return s;
};

/** Inject until three agree (at most `max` injections). */
function injectUntilAgree(s: CftState, state: "rest" | "hyp", max = 12): CftState {
  for (let i = 0; i < max; i++) {
    s = run(s, { type: "saline", volumeMl: 3, brisk: true }, { type: "tick", dt: 5 });
    const r = cftReadings(s);
    if (state === "rest" ? r.restAgree : r.hypAgree) return s;
  }
  return s;
}

/** The adenosine part in the UK order: GTN, resting Tmn, IV adenosine, hyperaemic Tmn, stop, drift check (re-equalise and repeat if needed). */
function adenosinePart(presetId: string, seed = "1"): CftState {
  let s = initialCftState(presetId, seed);
  s = run(s, { type: "gtn", doseUg: 200 });
  s = tick(s, 5);
  s = injectUntilAgree(s, "rest");
  for (let attempt = 0; attempt < 2; attempt++) {
    s = run(s, { type: "iv-adenosine", rate: CFT_IV_ADENOSINE_UG_KG_MIN, site: "central" });
    s = tick(s, 150);
    s = injectUntilAgree(s, "hyp");
    s = run(s, { type: "stop-adenosine" });
    s = tick(s, 120);
    s = run(s, { type: "drift-check" });
    if (s.driftChecks[s.driftChecks.length - 1].ok) break;
    s = run(s, { type: "re-equalise" });
  }
  return s;
}

/** The acetylcholine part done properly: checklist, baseline views, the UK bolus, views, the pain question, nitrate for spasm. */
function achPart(s: CftState, side: "left" | "right" = "left"): CftState {
  s = run(s, { type: "check", item: "pads" }, { type: "check", item: "pacing" }, { type: "check", item: "nitrate" }, { type: "check", item: "atropine" });
  s = run(s, { type: "angio", view: "rao-caudal" }, { type: "angio", view: "lao-cranial" });
  s = run(s, { type: "ach", regimen: "uk-bolus", side, route: "guide" });
  s = tick(s, 18);
  s = run(s, { type: "angio", view: "rao-caudal" }, { type: "angio", view: "lao-cranial" }, { type: "ask-pain" });
  if (s.doses.some((d) => d.response.spasm)) s = run(s, { type: "ic-nitrate" });
  return tick(s, 90);
}

describe("presets and their answers", () => {
  it("anoca.launch.ts declares the ANOCA presets of ach.ts with their own titles, which do not name the endotype", () => {
    expect(ANOCA_SCENARIOS.map((x) => x.id).sort()).toEqual(ANOCA_PRESETS.map((p) => p.id).sort());
    expect(ANOCA_PRESETS.map((p) => p.id).sort()).toEqual(["anoca-cmd", "anoca-epicardial-spasm", "anoca-microvascular-spasm", "anoca-normal"]);
    for (const x of ANOCA_SCENARIOS) {
      expect(ANOCA_PRESET_BY_ID[x.id].title).toBe(x.title);
      expect(x.title).not.toMatch(/spasm|microvascular|vasospas|normal study|non-cardiac|endothel/i);
    }
  });

  it("each preset's answer is the endotype its true values meet by the lesson's definitions (CorMicA and UK cut-offs agree)", () => {
    for (const p of ANOCA_PRESETS) {
      const f = presetFindings(p);
      expect(classifyEndotype(f), p.id).toBe(p.endotype);
      expect(classifyEndotype(f, CUTOFF.cfrUk), `${p.id} (UK CFR cut-off)`).toBe(p.endotype);
      expect(ENDOTYPES.some((e) => e.id === p.endotype)).toBe(true);
    }
  });

  it("acceptance: in 'anoca-cmd' CFR and IMR are on the abnormal side with FFR > 0.80; the others have normal CFR and IMR", () => {
    const td = thermodilution(ANOCA_PRESET_BY_ID["anoca-cmd"].case);
    expect(td.ffr).toBeGreaterThan(CUTOFF.ffr);
    expect(td.cfr).toBeLessThan(CUTOFF.cfr);
    expect(td.imr).toBeGreaterThanOrEqual(CUTOFF.imr);
    for (const id of ["anoca-epicardial-spasm", "anoca-microvascular-spasm", "anoca-normal"]) {
      const t = thermodilution(ANOCA_PRESET_BY_ID[id].case);
      expect(t.ffr, id).toBeGreaterThan(CUTOFF.ffr);
      expect(t.cfr, id).toBeGreaterThan(CUTOFF.cfrUk);
      expect(t.imr, id).toBeLessThan(CUTOFF.imr);
    }
    // and as the console reads them in a study
    const s = adenosinePart("anoca-cmd");
    const r = cftReadings(s);
    expect(r.restAgree && r.hypAgree).toBe(true);
    expect(r.ffr!).toBeGreaterThan(CUTOFF.ffr);
    expect(r.cfr!).toBeLessThan(CUTOFF.cfr);
    expect(r.imr!).toBeGreaterThanOrEqual(CUTOFF.imr);
  });

  it("acceptance: three inconsistent injections scatter more than three consistent ones", () => {
    const spread = (volumes: number[], brisk: boolean[], seed: string) => {
      let s = run(initialCftState("anoca-cmd", seed), { type: "gtn", doseUg: 200 });
      volumes.forEach((v, i) => (s = run(s, { type: "saline", volumeMl: v, brisk: brisk[i] })));
      const t = cftReadings(s).rest;
      return (Math.max(...t) - Math.min(...t)) / Math.min(...t);
    };
    let good = 0,
      bad = 0,
      agreeGood = 0,
      agreeBad = 0;
    const N = 200;
    for (let k = 0; k < N; k++) {
      const g = spread([3, 3, 3], [true, true, true], `g${k}`);
      const b = spread([3, 4.5, 2], [true, false, true], `b${k}`);
      good += g;
      bad += b;
      if (g <= 0.1) agreeGood++;
      if (b <= 0.1) agreeBad++;
    }
    expect(bad / N).toBeGreaterThan((2 * good) / N);
    expect(agreeGood).toBeGreaterThan(agreeBad);
  });
});

describe("the study in the UK order", () => {
  for (const p of ANOCA_PRESETS)
    it(`'${p.id}': the full study in order, with the right endotype and treatment, passes with every item done`, () => {
      let s = adenosinePart(p.id);
      s = achPart(s);
      const exp = ENDOTYPES.find((e) => e.id === p.endotype)!;
      s = run(s, { type: "classify", endotype: p.endotype, treatment: exp.treatment });
      expect(s.errors.map((e) => e.id)).toEqual([]);
      const items = cftItems(s);
      expect(items.filter((i) => !i.ok).map((i) => i.id)).toEqual([]);
      const sc = scoreCft(s);
      expect(sc.passed).toBe(true);
      expect(sc.endotypeCorrect).toBe(true);
      expect(sc.score).toBe(100);
    });

  it("hyperaemia markers appear with IV adenosine (systemic signs, ventricularised trace, lost notch, separated pressures) and not at rest", () => {
    let s = run(initialCftState("anoca-normal"), { type: "gtn", doseUg: 200 });
    expect(cftMarkers(s).confirmed).toBe(false);
    s = run(s, { type: "iv-adenosine", rate: CFT_IV_ADENOSINE_UG_KG_MIN, site: "peripheral" });
    s = tick(s, 10);
    expect(cftMarkers(s).confirmed).toBe(false);
    s = tick(s, 140);
    const m = cftMarkers(s);
    expect(m).toMatchObject({ systemic: true, ventricularised: true, notchLost: true, separated: true, confirmed: true });
    // a peripheral vein reaches 90% later than a central one (the engine's IV model)
    const at = (site: "central" | "peripheral", t: number) => cftHyperaemia(tick(run(initialCftState("anoca-normal"), { type: "iv-adenosine", rate: 140, site }), t));
    expect(at("central", 60)).toBeGreaterThan(at("peripheral", 60));
    // the systemic signs: heart rate up, pressure down
    const v = cftVitals(s);
    expect(v.hr).toBeGreaterThan(70);
    expect(v.map).toBeLessThan(ANOCA_PRESET_BY_ID["anoca-normal"].case.map);
  });

  it("hyperaemic injections before hyperaemia is established are flagged and recorded as an order error", () => {
    let s = run(initialCftState("anoca-cmd"), { type: "gtn", doseUg: 200 });
    s = injectUntilAgree(s, "rest");
    s = run(s, { type: "iv-adenosine", rate: 140, site: "peripheral" }, { type: "tick", dt: 10 }, { type: "saline", volumeMl: 3, brisk: true });
    expect(s.errors.map((e) => e.id)).toContain("hyp-before-hyperaemia");
    expect(s.injections[s.injections.length - 1].problems).toContain("hyperaemia not established");
  });

  it("a learner who injects as soon as the four markers show is not penalised (every preset, either vein)", () => {
    for (const p of ANOCA_PRESETS)
      for (const site of ["central", "peripheral"] as const) {
        let s = run(initialCftState(p.id), { type: "gtn", doseUg: 200 });
        s = injectUntilAgree(s, "rest");
        s = run(s, { type: "iv-adenosine", rate: CFT_IV_ADENOSINE_UG_KG_MIN, site });
        let before = s;
        for (let i = 0; i < 600 && !cftMarkers(s).confirmed; i++) {
          before = s;
          s = cftReducer(s, { type: "tick", dt: 0.5 });
        }
        expect(cftMarkers(s).confirmed, `${p.id} ${site}`).toBe(true);
        // confirmed markers mean the hyperaemia is maximal for the study
        expect(cftHyperaemia(s)).toBeGreaterThanOrEqual(MP_SUBMAXIMAL_H);
        const ok = run(s, { type: "saline", volumeMl: 3, brisk: true });
        expect(ok.errors.map((e) => e.id), `${p.id} ${site}`).not.toContain("hyp-before-hyperaemia");
        // half a second earlier, before the markers, the injection is flagged
        const early = run(before, { type: "saline", volumeMl: 3, brisk: true });
        expect(early.errors.map((e) => e.id), `${p.id} ${site}`).toContain("hyp-before-hyperaemia");
      }
  });

  it("a reading before the nitrate, and a large nitrate dose, are order errors", () => {
    let s = run(initialCftState("anoca-cmd"), { type: "saline", volumeMl: 3, brisk: true });
    expect(s.errors.map((e) => e.id)).toContain("reading-before-gtn");
    s = run(initialCftState("anoca-cmd"), { type: "gtn", doseUg: CFT_GTN_MAX_UG + 300 });
    expect(s.errors.map((e) => e.id)).toContain("gtn-large");
  });

  it("a large nitrate before the test masks epicardial spasm (the lesson's pitfall)", () => {
    let s = initialCftState("anoca-epicardial-spasm");
    s = run(s, { type: "gtn", doseUg: 1000 }, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 20);
    expect(constrictionNow(s)).toBeLessThan(0.9);
    expect(symptomsNow(s).pain).toBe(0);
  });

  it("the drift check at the module's threshold: 0.03 or more means re-equalise and repeat; acetylcholine without it is an order error", () => {
    // the drifting preset, measured without a drift check
    let s = initialCftState("anoca-microvascular-spasm");
    s = run(s, { type: "gtn", doseUg: 200 });
    s = injectUntilAgree(s, "rest");
    s = run(s, { type: "iv-adenosine", rate: 140, site: "central" });
    s = tick(s, 150);
    s = injectUntilAgree(s, "hyp");
    s = run(s, { type: "stop-adenosine" });
    s = tick(s, 120);
    s = run(s, { type: "drift-check" });
    const dc = s.driftChecks[0];
    expect(Math.abs(dc.pdpa - 1)).toBeGreaterThanOrEqual(CUTOFF.cftDrift);
    expect(dc.ok).toBe(false);
    // the guided aid flags the drift when it is found (hints show only under guided aids)
    const entry = s.log[s.log.length - 1];
    expect(entry.label).toBe("Pd/Pa at the ostium");
    expect(entry).toMatchObject({ hint: "drift of 0.03 or more: re-equalise and repeat", bad: true });
    // re-equalising discards the hyperaemic series: they have to be repeated
    const re = run(s, { type: "re-equalise" });
    expect(cftReadings(re).hypAgree).toBe(false);
    // going on to acetylcholine without repeating is an order error
    const on = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    expect(on.errors.map((e) => e.id)).toContain("ach-before-drift");
    // a preset without drift passes its first check
    const ok = adenosinePart("anoca-cmd");
    expect(ok.driftChecks[0].ok).toBe(true);
    const okEntry = ok.log.find((e) => e.label === "Pd/Pa at the ostium");
    expect(okEntry?.hint).toBeUndefined();
    expect(okEntry?.bad).toBeFalsy();
  });
});

describe("acetylcholine (acceptance)", () => {
  it("ach-provocation is present only while an acetylcholine dose is active: never during adenosine, which refuses acetylcholine while it runs", () => {
    let s = adenosinePart("anoca-cmd");
    expect(achProvocation(s)).toBe(false);
    // with adenosine running acetylcholine is not given
    let during = run(s, { type: "iv-adenosine", rate: 140, site: "central" });
    during = tick(during, 30);
    during = run(during, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    expect(during.doses).toEqual([]);
    expect(achProvocation(during)).toBe(false);
    // the dose: active while it is given and read, then not
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    const seen: boolean[] = [];
    s = tick(s, 120, 1, (x) => {
      seen.push(achProvocation(x));
      if (achProvocation(x)) expect(adenosineRunning(x)).toBe(false);
    });
    const step = ACH_PROTOCOLS["uk-bolus"].steps.left[0];
    expect(seen.slice(0, step.durationS + 50).every(Boolean)).toBe(true);
    expect(seen[seen.length - 1]).toBe(false);
  });

  it("acceptance: acetylcholine before the resting thermodilution is an order error, and the test then fails", () => {
    let s = run(initialCftState("anoca-normal"), { type: "gtn", doseUg: 200 }, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    expect(s.errors.map((e) => e.id)).toEqual(expect.arrayContaining(["ach-before-rest-td", "ach-before-adenosine", "ach-before-drift"]));
    s = tick(s, 90);
    // adenosine measurements after acetylcholine are flagged too
    s = run(s, { type: "iv-adenosine", rate: 140, site: "central" });
    expect(s.errors.map((e) => e.id)).toContain("adenosine-after-ach");
    s = run(s, { type: "classify", endotype: "non-cardiac", treatment: "reassure" });
    expect(cftItems(s).find((i) => i.id === "order")?.ok).toBe(false);
    expect(scoreCft(s).passed).toBe(false);
  });

  it("acceptance: each preset's endotype answer is scored (a wrong answer fails the endotype item and the study)", () => {
    for (const p of ANOCA_PRESETS) {
      const base = achPart(adenosinePart(p.id));
      const wrong = ENDOTYPES.find((e) => e.id !== p.endotype && e.id !== "obstructive")!;
      const w = run(base, { type: "classify", endotype: wrong.id, treatment: wrong.treatment });
      expect(cftItems(w).find((i) => i.id === "endotype")?.ok, p.id).toBe(false);
      expect(scoreCft(w).endotypeCorrect, p.id).toBe(false);
      expect(scoreCft(w).passed, p.id).toBe(false);
      const r = run(base, { type: "classify", endotype: p.endotype, treatment: ENDOTYPES.find((e) => e.id === p.endotype)!.treatment });
      expect(scoreCft(r).endotypeCorrect, p.id).toBe(true);
    }
  });

  it("the responses meet the module's criteria: epicardial spasm 90% or more with the usual pain and ST elevation; microvascular spasm pain and ST depression without it; none in microvascular angina or the normal study", () => {
    const peak = (id: string) => {
      let s = adenosinePart(id);
      s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
      s = tick(s, 20);
      return { c: constrictionNow(s), sym: symptomsNow(s) };
    };
    const epi = peak("anoca-epicardial-spasm");
    expect(epi.c).toBeGreaterThanOrEqual(0.9);
    expect(epi.sym).toMatchObject({ usualPain: true, ecg: "st-elevation" });
    const mvs = peak("anoca-microvascular-spasm");
    expect(mvs.c).toBeLessThan(0.9);
    expect(mvs.sym).toMatchObject({ usualPain: true, ecg: "st-depression" });
    for (const id of ["anoca-cmd", "anoca-normal"]) {
      const n = peak(id);
      expect(n.c, id).toBeLessThan(0.2);
      expect(n.sym.pain, id).toBe(0);
    }
  });

  it("severe epicardial spasm upstream of the parked sensor lowers distal pressure, and Pd recovers once nitrate relieves it", () => {
    let s = adenosinePart("anoca-epicardial-spasm");
    const before = cftPressures(s).pdpa;
    expect(before).toBeGreaterThan(0.9);
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 25);
    expect(constrictionNow(s)).toBeGreaterThanOrEqual(0.9);
    const peak = cftPressures(s);
    expect(peak.pdpa).toBeLessThan(0.7);
    expect(peak.pa - peak.pd).toBeGreaterThan(20);
    const relieved = tick(run(s, { type: "ic-nitrate" }), 60);
    expect(constrictionNow(relieved)).toBe(0);
    expect(cftPressures(relieved).pdpa).toBeGreaterThan(0.9);
    // no constriction (or dilatation) leaves the case as the preset has it
    expect(cftCaseWith(s, 0).lesions).toEqual(cftCase(s).lesions);
    expect(cftCaseWith(s, -0.1).lesions).toEqual(cftCase(s).lesions);
  });

  it("intracoronary nitrate relieves spasm; without it the spasm persists and the debrief marks it", () => {
    let s = adenosinePart("anoca-epicardial-spasm");
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 25);
    const untreated = tick(s, 100);
    expect(constrictionNow(untreated)).toBeGreaterThanOrEqual(0.9);
    expect(achProvocation(untreated)).toBe(true);
    const treated = tick(run(s, { type: "ic-nitrate" }), 40);
    expect(constrictionNow(treated)).toBe(0);
    expect(cftItems(run(untreated, { type: "classify", endotype: "vasospastic-angina" })).find((i) => i.id === "reversed")?.ok).toBe(false);
  });

  it("the stepped regimen goes up a dose at a time; the next dose waits for the response; a dose after a positive test is an order error", () => {
    let s = adenosinePart("anoca-epicardial-spasm");
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
    expect(s.doses.map((d) => d.doseUg)).toEqual([20]);
    s = run(s, { type: "tick", dt: 10 }, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
    expect(s.doses.length).toBe(1); // still being read
    s = tick(s, 85);
    expect(constrictionNow(s)).toBe(0);
    s = run(s, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
    expect(s.doses.map((d) => d.doseUg)).toEqual([20, 50]);
    s = tick(s, 20);
    expect(constrictionNow(s)).toBeGreaterThanOrEqual(0.9);
    s = tick(run(s, { type: "ic-nitrate" }), 100);
    s = run(s, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
    expect(s.errors.map((e) => e.id)).toContain("dose-after-positive");
  });

  it("acetylcholine slows the heart; an RCA dose brings AV block (a labelled hazard) that pacing covers and IV atropine lifts; RCA testing without pacing available is a safety error", () => {
    let s = adenosinePart("anoca-cmd");
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 12);
    expect(cftVitals(s).hr).toBeLessThan(50);
    expect(cftVitals(s).av).toBe(0);
    s = tick(s, 100);
    expect(cftVitals(s).hr).toBeGreaterThan(60);
    // the RCA without pacing available
    let r = run(s, { type: "ach", regimen: "uk-bolus", side: "right", route: "guide" });
    expect(r.errors.map((e) => e.id)).toContain("rca-without-pacing");
    r = tick(r, 12);
    expect(cftVitals(r)).toMatchObject({ av: 3, hr: MP_ACH_ESCAPE_HR });
    expect(cftVitals(run(r, { type: "pacing", on: true })).hr).toBe(70);
    expect(cftVitals(run(r, { type: "iv-atropine" })).av).toBe(0);
    // with pacing available it is no error
    const ok = run(s, { type: "check", item: "pacing" }, { type: "ach", regimen: "uk-bolus", side: "right", route: "guide" });
    expect(ok.errors.map((e) => e.id)).not.toContain("rca-without-pacing");
  });

  it("an infusion through the guide interrupts the aortic trace (a microcatheter keeps it), and flushing without aspirating gives an extra bolus", () => {
    let s = run(adenosinePart("anoca-normal"), { type: "check", item: "pads" });
    let g = run(s, { type: "ach", regimen: "infusion", side: "left", route: "guide" });
    g = tick(g, 30);
    expect(cftVitals(g).aorticTrace).toBe(false);
    const m = tick(run(s, { type: "ach", regimen: "infusion", side: "left", route: "microcatheter" }), 30);
    expect(cftVitals(m).aorticTrace).toBe(true);
    // finish the infusion: three strengths
    g = tick(g, 200);
    g = run(g, { type: "ach", regimen: "infusion", side: "left", route: "guide" });
    g = tick(g, 190);
    g = run(g, { type: "ach", regimen: "infusion", side: "left", route: "guide" });
    g = tick(g, 190);
    expect(g.doses.length).toBe(3);
    expect(g.guideAchUg).toBeGreaterThan(0);
    const flushed = run(g, { type: "flush-guide" });
    expect(flushed.errors.map((e) => e.id)).toContain("unaspirated-flush");
    expect(flushed.doses[flushed.doses.length - 1].regimen).toBe("accidental");
    expect(achProvocation(flushed)).toBe(true);
    const aspirated = run(g, { type: "aspirate-guide" }, { type: "flush-guide" }, { type: "angio", view: "rao-caudal" });
    expect(aspirated.errors.map((e) => e.id)).not.toContain("unaspirated-flush");
    expect(aspirated.doses.length).toBe(3);
    s = aspirated;
  });

  it("the live log stays neutral: why an action went wrong is a hint (guided aids), not the note", () => {
    let g = run(adenosinePart("anoca-normal"), { type: "check", item: "pads" });
    for (let k = 0; k < 3; k++) g = tick(run(g, { type: "ach", regimen: "infusion", side: "left", route: "guide" }), 190);
    const flushed = run(g, { type: "flush-guide" });
    const e = flushed.log[flushed.log.length - 1];
    expect(e).toMatchObject({ label: "Guide flush", value: "done" });
    expect(e.note).toBeUndefined();
    expect(e.hint).toMatch(/acetylcholine/);
    const during = run(initialCftState("anoca-normal"), { type: "iv-adenosine", rate: 140, site: "central" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    const r = during.log[during.log.length - 1];
    expect(r).toMatchObject({ label: "Acetylcholine", value: "not given" });
    expect(r.note).toBeUndefined();
    expect(r.hint).toMatch(/adenosine/);
    const re = run(initialCftState("anoca-normal"), { type: "re-equalise" });
    expect(re.log[re.log.length - 1].note).toBeUndefined();
  });

  it("an angiogram records the measured narrowing and the operator's eyeball estimate, read to the nearest 10%", () => {
    for (const seed of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
      let s = run(initialCftState("anoca-epicardial-spasm", seed), { type: "gtn", doseUg: 200 }, { type: "check", item: "pads" });
      s = run(s, { type: "angio", view: "rao-caudal" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "microcatheter" });
      s = tick(s, 18);
      s = run(s, { type: "angio", view: "lao-cranial" });
      for (const a of s.angios) {
        expect(Math.abs(Math.round(a.looks * 100)) % Math.round(MP_ANGIO_EYE_STEP * 100) === 0, String(a.looks)).toBe(true);
        expect(Math.abs(a.looks - a.constriction)).toBeLessThanOrEqual(0.3);
      }
      expect(s.angios[1].constriction).toBeGreaterThan(0.5);
      expect(s.angios[1].looks).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("stepped doses more than 3 minutes apart (ACH_PROTOCOLS.stepped.maxGapS) are marked in the debrief", () => {
    expect(ACH_PROTOCOLS.stepped.maxGapS).toBe(180);
    const step = (wait: number) => {
      let s = run(adenosinePart("anoca-normal"), { type: "check", item: "pads" }, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
      s = tick(s, wait);
      s = run(s, { type: "ach", regimen: "stepped", side: "left", route: "guide" });
      expect(s.doses.filter((d) => d.regimen === "stepped").length).toBe(2);
      return cftItems(s).find((i) => i.id === "step-gap-left");
    };
    expect(step(100)?.ok).toBe(true);
    expect(step(260)?.ok).toBe(false);
  });

  it("during AV block the P waves run at the sinus rate, not the escape rate", () => {
    let s = run(adenosinePart("anoca-normal"), { type: "check", item: "pads" }, { type: "check", item: "pacing" }, { type: "ach", regimen: "uk-bolus", side: "right", route: "guide" });
    s = tick(s, 12);
    const v = cftVitals(s);
    expect(v.av).toBe(3);
    expect(v.sinusHr).toBeGreaterThan(v.hr);
  });

  it("two views at least 30° apart", () => {
    expect(viewSeparationDeg("rao-caudal", "lao-cranial")).toBeGreaterThanOrEqual(30);
    expect(viewSeparationDeg("rao-caudal", "rao-caudal")).toBe(0);
    expect(twoViewsApart(["rao-caudal"])).toBe(false);
    expect(twoViewsApart(["rao-caudal", "rao-cranial"])).toBe(true);
  });
});
