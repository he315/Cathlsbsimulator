// The device-choice step and session scoring of the MCS lab (mcs-console-split-select-and-tips).
//   npx vitest run src/simulation/mcs/deviceChoice.test.ts
import { describe, expect, it } from "vitest";
import moduleText from "../../content/manual/pci-manual/16-support-choice.ts?raw";
import {
  SELECT_PRESETS,
  SELECT_PRESET_BY_ID,
  SUPPORT_THRESHOLDS,
  choiceLesson,
  expectedChoice,
  haemodynamicState,
  inSentence,
  profileEvents,
  scoreChoice,
  scoreMcsSession,
  type SupportChoice,
  type SupportProfile,
} from "./deviceChoice";

const P = (id: string) => SELECT_PRESET_BY_ID[id];

/** The first accepted answer of the algorithm, with the trade-off stated where it is needed. */
function correct(p: SupportProfile): SupportChoice {
  const e = expectedChoice(p);
  return { classification: e.classifications[0], device: e.devices[0], finding: e.findings[0], tradeOffStated: e.tradeOffRequired };
}

describe("device choice: the presets", () => {
  it("has the seven presets the plan names", () => {
    expect(SELECT_PRESETS.map((p) => p.id)).toEqual(["select-chip-lm", "select-mech-av", "select-lv-thrombus", "select-severe-ar", "select-biv-hypoxaemia", "select-simple-lesion", "select-arrest"]);
  });

  it("each preset's correct choice and finding score full marks", () => {
    for (const p of SELECT_PRESETS) {
      const e = expectedChoice(p);
      // every accepted combination scores full marks
      for (const classification of e.classifications)
        for (const device of e.devices)
          for (const finding of e.findings) {
            const r = scoreChoice(p, { classification, device, finding, tradeOffStated: e.tradeOffRequired });
            expect(r.score, `${p.id} ${classification} ${device} ${finding}`).toBe(100);
            expect(r.passed).toBe(true);
            expect(r.critical).toEqual([]);
          }
    }
  });

  it("each preset lands on the branch it was written for", () => {
    const want: Record<string, { cls: string[]; dev: string[]; finding: string }> = {
      "select-chip-lm": { cls: ["upfront", "standby"], dev: ["microaxial"], finding: "both-axes" },
      "select-mech-av": { cls: ["upfront", "standby"], dev: ["iabp", "va-ecmo"], finding: "mechanical-av" },
      "select-lv-thrombus": { cls: ["upfront", "standby"], dev: ["iabp", "va-ecmo"], finding: "lv-thrombus" },
      "select-severe-ar": { cls: ["upfront", "standby"], dev: ["change-plan"], finding: "severe-ar" },
      "select-biv-hypoxaemia": { cls: ["shock"], dev: ["va-ecmo"], finding: "hypoxaemia-despite-ventilation" },
      "select-simple-lesion": { cls: ["none"], dev: ["none"], finding: "normal-low-risk" },
      "select-arrest": { cls: ["arrest"], dev: ["va-ecmo"], finding: "cardiac-arrest" },
    };
    for (const p of SELECT_PRESETS) {
      const e = expectedChoice(p);
      expect(e.classifications, p.id).toEqual(want[p.id].cls);
      expect(e.devices, p.id).toEqual(want[p.id].dev);
      expect(e.findings, p.id).toEqual([want[p.id].finding]);
      expect(e.path.length, p.id).toBeGreaterThan(0);
    }
  });

  it("a microaxial pump with LV thrombus is critical, and so is one with a mechanical aortic valve", () => {
    const lv = scoreChoice(P("select-lv-thrombus"), { ...correct(P("select-lv-thrombus")), device: "microaxial" });
    expect(lv.critical).toEqual(["Microaxial flow pump with LV thrombus"]);
    expect(lv.passed).toBe(false);
    expect(lv.deviceOk).toBe(false);
    const av = scoreChoice(P("select-mech-av"), { ...correct(P("select-mech-av")), device: "microaxial" });
    expect(av.critical).toEqual(["Microaxial flow pump with a mechanical aortic valve"]);
    expect(av.passed).toBe(false);
  });

  it("each contraindication ignored is its own critical error", () => {
    const both: SupportProfile = { ...P("select-mech-av"), echo: { ...P("select-mech-av").echo, lvThrombus: true } };
    const r = scoreChoice(both, { classification: "upfront", device: "microaxial", finding: "both-axes", tradeOffStated: true });
    expect(r.critical).toHaveLength(2);
    expect(r.passed).toBe(false);
  });

  it("upfront and standby are both accepted for both axes only with the trade-off stated", () => {
    const p = P("select-chip-lm");
    for (const cls of ["upfront", "standby"] as const) {
      expect(scoreChoice(p, { classification: cls, device: "microaxial", finding: "both-axes", tradeOffStated: true }).classificationOk).toBe(true);
      expect(scoreChoice(p, { classification: cls, device: "microaxial", finding: "both-axes", tradeOffStated: false }).classificationOk).toBe(false);
    }
  });

  it("a wrong finding costs its points but not the choice", () => {
    const p = P("select-chip-lm");
    const r = scoreChoice(p, { ...correct(p), finding: "lv-thrombus" });
    expect(r.passed).toBe(true);
    expect(r.score).toBe(80);
  });

  it("arrest: anything but VA-ECMO is wrong, a balloon pump included", () => {
    const p = P("select-arrest");
    const r = scoreChoice(p, { classification: "arrest", device: "iabp", finding: "cardiac-arrest" });
    expect(r.deviceOk).toBe(false);
    expect(r.wrong.join(" ")).toMatch(/Only VA-ECMO/);
  });

  it("the profile raises only what is on the screen", () => {
    expect(profileEvents(P("select-biv-hypoxaemia"))).toEqual(expect.arrayContaining(["hypotension", "ventilated"]));
    expect(profileEvents(P("select-arrest"))).toEqual(expect.arrayContaining(["vf", "hypotension"]));
    expect(profileEvents(P("select-simple-lesion"))).toEqual([]);
    expect(profileEvents(P("select-biv-hypoxaemia"))).not.toContain("cardiogenic-shock");
  });
});

describe("device choice: the algorithm's other branches", () => {
  const base = P("select-chip-lm");
  const shock: SupportProfile = { ...base, bp: { sys: 80, dia: 50 }, onPressors: true, lactate: 5, procedure: "primary-pci", ci: 1.6 };

  it("classifies by the module's thresholds", () => {
    expect(haemodynamicState(P("select-simple-lesion"))).toBe("normal");
    expect(haemodynamicState(base)).toBe("abnormal");
    expect(haemodynamicState(shock)).toBe("shock");
    expect(haemodynamicState(P("select-arrest"))).toBe("arrest");
    // a low pressure without hypoperfusion is not shock
    expect(haemodynamicState({ ...shock, lactate: 1.5 })).toBe("abnormal");
  });

  it("standby for one axis, none for neither", () => {
    const highRiskNormal: SupportProfile = { ...P("select-simple-lesion"), procedure: "atherectomy" };
    expect(expectedChoice(highRiskNormal).classifications).toEqual(["standby"]);
    expect(expectedChoice(highRiskNormal).findings).toEqual(["high-risk-procedure"]);
    const abnormalLowRisk: SupportProfile = { ...base, procedure: "simple" };
    expect(expectedChoice(abnormalLowRisk).classifications).toEqual(["standby"]);
  });

  it("the iliofemoral route: over 5 mm without severe calcium or tortuosity, else an alternative route, else a balloon pump", () => {
    const narrow: SupportProfile = { ...base, iliofemoral: { minLumenMm: 5, severeCalcium: false, severeTortuosity: false } };
    expect(expectedChoice(narrow).devices).toEqual(["iabp"]);
    expect(expectedChoice({ ...narrow, alternativeRoute: true }).devices).toEqual(["microaxial"]);
    const calcified: SupportProfile = { ...base, iliofemoral: { minLumenMm: 8, severeCalcium: true, severeTortuosity: false } };
    expect(expectedChoice(calcified).devices).toEqual(["iabp"]);
  });

  it("an aortic aneurysm rules out the balloon pump and severe PAD VA-ECMO; dissection or uncontrolled bleeding leaves none", () => {
    const av = P("select-mech-av");
    expect(expectedChoice({ ...av, aorticAneurysm: true }).devices).toEqual(["va-ecmo"]);
    expect(expectedChoice({ ...av, severePad: true }).devices).toEqual(["iabp"]);
    expect(expectedChoice({ ...av, aorticDissection: true }).devices).toEqual(["change-plan"]);
    expect(expectedChoice({ ...av, bleeding: "uncontrolled" }).devices).toEqual(["change-plan"]);
  });

  it("shock: isolated RV failure needs a right-sided device and a left-sided one is wrong", () => {
    const rv: SupportProfile = { ...shock, rhc: { ra: 17, paSys: 30, paDia: 22, wedge: 12, svo2: 50 } };
    expect(expectedChoice(rv).devices).toEqual(["right-sided"]);
    const r = scoreChoice(rv, { classification: "shock", device: "microaxial", finding: "rv-failure" });
    expect(r.deviceOk).toBe(false);
    expect(r.wrong.join(" ")).toMatch(/left-sided device/);
  });

  it("shock: both ventricles failing accepts VA-ECMO or left and right devices together", () => {
    const biv: SupportProfile = { ...shock, rhc: { ra: 16, paSys: 34, paDia: 25, wedge: 28, svo2: 40 } };
    expect(expectedChoice(biv).devices).toEqual(["va-ecmo", "combined"]);
  });

  it("shock: a balloon pump is wrong for severe LV shock; a microaxial pump is right; pre-shock may take a balloon pump", () => {
    const lv: SupportProfile = { ...shock, rhc: { ra: 8, paSys: 40, paDia: 24, wedge: 28, svo2: 45 } };
    expect(expectedChoice(lv).devices).toEqual(["microaxial"]);
    const r = scoreChoice(lv, { classification: "shock", device: "iabp", finding: "severe-lv-shock" });
    expect(r.deviceOk).toBe(false);
    expect(r.wrong.join(" ")).toMatch(/not enough for severe shock/);
    expect(expectedChoice({ ...lv, ci: 2.3 }).devices).toEqual(["iabp", "microaxial"]);
    expect(expectedChoice({ ...lv, refractory: true }).devices).toEqual(["va-ecmo"]);
    // severe shock with the pump contraindicated: VA-ECMO, not a balloon pump
    expect(expectedChoice({ ...lv, echo: { ...lv.echo, lvThrombus: true } }).devices).toEqual(["va-ecmo"]);
  });

  it("shock: VA-ECMO before oxygenation and ventilation are optimised is wrong", () => {
    const hyp: SupportProfile = { ...P("select-biv-hypoxaemia"), ventilation: "high-flow" };
    expect(expectedChoice(hyp).findings).not.toContain("hypoxaemia-despite-ventilation");
    const r = scoreChoice(hyp, { classification: "shock", device: "microaxial", finding: "biventricular-failure" });
    expect(r.deviceOk).toBe(false);
    const ecmoEarly = scoreChoice({ ...hyp, rhc: { ra: 8, paSys: 40, paDia: 24, wedge: 28, svo2: 45 } }, { classification: "shock", device: "va-ecmo", finding: "severe-lv-shock" });
    expect(ecmoEarly.wrong.join(" ")).toMatch(/before oxygenation and ventilation/);
  });

  it("every threshold is the module's", () => {
    const t = moduleText.replace(/\s+/g, " ");
    expect(t).toContain('"Pulmonary capillary wedge pressure", "Above 18 mmHg"');
    expect(SUPPORT_THRESHOLDS.lvFailureWedge).toBe(18);
    expect(t).toContain('"Below 0.9", "Right ventricular failure"');
    expect(SUPPORT_THRESHOLDS.rvFailurePapi).toBe(0.9);
    expect(t).toContain("Wedge above 25 mmHg with mixed venous saturation below 50%");
    expect([SUPPORT_THRESHOLDS.oedemaWedge, SUPPORT_THRESHOLDS.svo2Warn]).toEqual([25, 50]);
    expect(t).toContain("RA pressure above 12 mmHg or PAPi below 0.9");
    expect(SUPPORT_THRESHOLDS.rvFailureRa).toBe(12);
    expect(t).toContain("Systolic below 90 mmHg for more than 30 minutes, or drugs needed to hold it there");
    expect(t).toContain("lactate above 2 mmol/L");
    expect([SUPPORT_THRESHOLDS.shockSystolic, SUPPORT_THRESHOLDS.shockLactate]).toEqual([90, 2]);
    expect(t).toContain("Pre-shock with a cardiac index above 2.0 L/min/m²");
    expect(SUPPORT_THRESHOLDS.preShockIndex).toBe(2.0);
    expect(t).toContain("must be more than 5 mm wide, without severe calcium, severe tortuosity");
    expect(SUPPORT_THRESHOLDS.iliofemoralMinMm).toBe(5);
  });
});

describe("session scoring", () => {
  it("no score floor remains: a session can score 0", () => {
    const s = scoreMcsSession({ targetsMet: false, harms: 5, criticalErrors: 1 });
    expect(s.score).toBe(0);
    expect(s.passed).toBe(false);
  });

  it("a run with two critical errors fails, whatever else it did", () => {
    const s = scoreMcsSession({ targetsMet: true, harms: 0, criticalErrors: 2 });
    expect(s.passed).toBe(false);
    expect(s.score).toBe(40);
  });

  it("a clean run scores 100 and passes; harms and extra moves cost points without a floor", () => {
    expect(scoreMcsSession({ targetsMet: true, harms: 0, criticalErrors: 0 })).toMatchObject({ score: 100, passed: true });
    expect(scoreMcsSession({ targetsMet: true, harms: 2, criticalErrors: 0 }).score).toBe(80);
    expect(scoreMcsSession({ targetsMet: true, harms: 9, criticalErrors: 0, extraMoves: 9 }).score).toBe(60);
  });

  it("the old floors are gone from the consoles", async () => {
    const files = import.meta.glob("../../ui/mcs/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const lab = (await import("../../ui/sections/McsLab.tsx?raw")).default;
    for (const src of [...Object.values(files), lab]) {
      expect(src).not.toMatch(/Math\.max\(\s*(40|50)\s*,/);
      expect(src).not.toMatch(/recordSim\(/);
    }
  });
});

describe("device choice: the lesson each decision points to", () => {
  it("arrest to the CPR lesson, shock to the shock lesson, the axes to 'when', a contraindication to 'which'", () => {
    const got = Object.fromEntries(SELECT_PRESETS.map((p) => [p.id, choiceLesson(p)]));
    expect(got).toEqual({
      "select-chip-lm": "pm-support-choice-when",
      "select-mech-av": "pm-support-choice-which",
      "select-lv-thrombus": "pm-support-choice-which",
      "select-severe-ar": "pm-support-choice-which",
      "select-biv-hypoxaemia": "pm-support-choice-shock",
      "select-simple-lesion": "pm-support-choice-when",
      "select-arrest": "pm-support-choice-cpr",
    });
  });

  it("every lesson named is a lesson of the module", () => {
    for (const p of SELECT_PRESETS) expect(moduleText).toContain(`id: "${choiceLesson(p)}"`);
  });
});

describe("device choice: the debrief path wording", () => {
  it("keeps acronyms upper case inside a sentence", () => {
    expect(inSentence("LV thrombus")).toBe("LV thrombus");
    expect(inSentence("Isolated RV failure")).toBe("isolated RV failure");
    expect(inSentence("Mechanical aortic valve")).toBe("mechanical aortic valve");
    const line = expectedChoice(P("select-lv-thrombus")).path.find((l) => l.startsWith("Microaxial pump contraindicated"));
    expect(line).toContain("LV thrombus");
    expect(line).not.toContain("lv thrombus");
  });
});
