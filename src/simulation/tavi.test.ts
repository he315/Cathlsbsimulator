import { describe, it, expect } from "vitest";
import {
  TAVI_SCENARIOS,
  VALVE_SIZES,
  CHART_RULE,
  RISK_ORDER,
  areaDerivedDiameter,
  perimeterDerivedDiameter,
  ellipseArea,
  ellipsePerimeter,
  eccentricityIndex,
  oversizingPct,
  teachingChart,
  suggestedSizes,
  deliverySystemFor,
  accessMarginMm,
  CORONARY_HEIGHT_FLAG_MM,
  SINUS_FLAG_MM,
  assessTavi,
  bestTaviPlan,
  scoreTavi,
  levelFromScore,
  depthBand,
  taviFindings,
  LEVEL_VALUE,
  COURSE,
  COURSE_RESPONSE,
  taviCourse,
  courseAt,
  courseRng,
  scoreTaviCourse,
  type CourseActions,
  type TaviPlan,
  type TaviScenario,
  type RiskLevel,
} from "./tavi";

const byId = (id: string): TaviScenario => {
  const s = TAVI_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
};

const plan = (over: Partial<TaviPlan> = {}): TaviPlan => ({
  access: "transfemoral",
  platform: "balloon-expandable",
  sizeMm: 26,
  targetDepthMm: 3,
  finalDepthMm: 3,
  predilatation: false,
  postDilatation: false,
  rapidPacing: true,
  coronaryProtection: false,
  ...over,
});

const lv = (l: RiskLevel) => LEVEL_VALUE[l];

describe("annulus geometry", () => {
  it("derives mean diameters with the correct formulas", () => {
    // A circle of diameter 23 mm: both derived diameters return 23.
    const area = Math.PI * 11.5 * 11.5;
    const perim = Math.PI * 23;
    expect(areaDerivedDiameter(area)).toBeCloseTo(23, 6);
    expect(perimeterDerivedDiameter(perim)).toBeCloseTo(23, 6);
    // Known values
    expect(perimeterDerivedDiameter(75.4)).toBeCloseTo(75.4 / Math.PI, 9);
    expect(areaDerivedDiameter(415)).toBeCloseTo(2 * Math.sqrt(415 / Math.PI), 9);
  });

  it("ellipse helpers reduce to the circle and respect the isoperimetric inequality", () => {
    expect(ellipseArea(20, 20)).toBeCloseTo(Math.PI * 100, 6);
    expect(ellipsePerimeter(20, 20)).toBeCloseTo(Math.PI * 20, 6);
    const p = ellipsePerimeter(20, 26);
    const a = ellipseArea(20, 26);
    expect(perimeterDerivedDiameter(p)).toBeGreaterThan(areaDerivedDiameter(a));
    expect(eccentricityIndex(20, 20)).toBe(0);
    expect(eccentricityIndex(20, 25)).toBeCloseTo(0.2, 9);
  });
});

describe("scenario integrity", () => {
  it("has 5–7 unique synthetic cases", () => {
    expect(TAVI_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(TAVI_SCENARIOS.length).toBeLessThanOrEqual(7);
    expect(new Set(TAVI_SCENARIOS.map((s) => s.id)).size).toBe(TAVI_SCENARIOS.length);
    for (const s of TAVI_SCENARIOS) expect(s.vignette.toLowerCase()).toContain("synthetic");
  });

  it.each(TAVI_SCENARIOS.map((s) => [s.id, s] as const))("%s: measurements are internally consistent", (_id, s) => {
    const a = s.annulus;
    expect(a.minDiameterMm).toBeLessThan(a.maxDiameterMm);
    // Reported area and perimeter agree with an ellipse of the min/max diameters (traced contours run slightly long).
    expect(Math.abs(a.areaMm2 / ellipseArea(a.minDiameterMm, a.maxDiameterMm) - 1)).toBeLessThan(0.02);
    expect(Math.abs(a.perimeterMm / ellipsePerimeter(a.minDiameterMm, a.maxDiameterMm) - 1)).toBeLessThan(0.02);
    // Isoperimetric inequality: Dp ≥ Da for any closed contour.
    expect(perimeterDerivedDiameter(a.perimeterMm)).toBeGreaterThanOrEqual(areaDerivedDiameter(a.areaMm2));
    // Mean diameters lie between min and max.
    const da = areaDerivedDiameter(a.areaMm2);
    expect(da).toBeGreaterThan(a.minDiameterMm);
    expect(da).toBeLessThan(a.maxDiameterMm);
    // Root anatomy: sinuses wider than the annulus, STJ narrower than the sinuses.
    expect(s.sinusDiameterMm).toBeGreaterThan(a.maxDiameterMm);
    expect(s.stjDiameterMm).toBeLessThan(s.sinusDiameterMm);
    expect(s.membranousSeptumMm).toBeGreaterThan(0);
    expect(s.lvefPct).toBeGreaterThan(10);
    expect(s.lvefPct).toBeLessThan(80);
    // Every annulus has at least one listed size on each platform.
    expect(suggestedSizes("balloon-expandable", a).length).toBeGreaterThan(0);
    expect(suggestedSizes("self-expanding", a).length).toBeGreaterThan(0);
  });

  it("covers the required teaching themes", () => {
    const s = TAVI_SCENARIOS;
    expect(s.some((x) => x.bicuspid)).toBe(true);
    expect(s.some((x) => x.rbbb)).toBe(true);
    expect(
      s.some((x) => Math.min(x.coronaryHeightLeftMm, x.coronaryHeightRightMm) < CORONARY_HEIGHT_FLAG_MM && x.sinusDiameterMm < SINUS_FLAG_MM)
    ).toBe(true);
    expect(s.some((x) => x.lvotCalcium === "severe")).toBe(true);
    expect(s.some((x) => x.access.calcification === "severe")).toBe(true);
    expect(s.some((x) => x.annulus.areaMm2 <= 430)).toBe(true);
  });
});

describe("illustrative teaching chart", () => {
  it("is generated from its rule, ordered, and contiguous except the documented smallest-size gap", () => {
    for (const platform of ["balloon-expandable", "self-expanding"] as const) {
      const rows = teachingChart(platform);
      expect(rows.map((r) => r.sizeMm)).toEqual(VALVE_SIZES[platform]);
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].min).toBeLessThan(rows[i].max);
        if (i > 0) {
          expect(rows[i].min).toBeGreaterThan(rows[i - 1].min);
          const gap = rows[i].min > rows[i - 1].max;
          // Only the balloon-expandable 20→23 step (a 32% jump in nominal area) leaves a "between sizes" gap.
          expect(gap).toBe(platform === "balloon-expandable" && i === 1);
        }
      }
    }
    // An annulus inside that gap has no listed size.
    expect(suggestedSizes("balloon-expandable", { areaMm2: 330, perimeterMm: 65, minDiameterMm: 18.8, maxDiameterMm: 22.4 })).toEqual([]);
  });

  it("windows agree in magnitude with labelled sizing principles (docs/SIM_FACTS.md items 1–2)", () => {
    // Balloon-expandable: modest undersizing to about +23% area oversizing.
    expect(CHART_RULE["balloon-expandable"].minOversizePct).toBeGreaterThanOrEqual(-5);
    expect(CHART_RULE["balloon-expandable"].maxOversizePct).toBeLessThanOrEqual(25);
    // Self-expanding: always oversized by perimeter, up to about +30%.
    expect(CHART_RULE["self-expanding"].minOversizePct).toBeGreaterThan(5);
    expect(CHART_RULE["self-expanding"].maxOversizePct).toBeLessThanOrEqual(32);
  });

  it("uses area for balloon-expandable and perimeter for self-expanding", () => {
    expect(CHART_RULE["balloon-expandable"].metric).toBe("area");
    expect(CHART_RULE["self-expanding"].metric).toBe("perimeter");
  });

  it("suggested sizes have oversizing inside the rule window", () => {
    for (const s of TAVI_SCENARIOS) {
      for (const platform of ["balloon-expandable", "self-expanding"] as const) {
        const rule = CHART_RULE[platform];
        for (const size of suggestedSizes(platform, s.annulus)) {
          const os = oversizingPct(platform, size, s.annulus);
          expect(os).toBeGreaterThanOrEqual(rule.minOversizePct - 1e-9);
          expect(os).toBeLessThanOrEqual(rule.maxOversizePct + 1e-9);
        }
      }
    }
  });

  it("oversizing rises with valve size", () => {
    const a = byId("tavi-standard").annulus;
    for (const platform of ["balloon-expandable", "self-expanding"] as const) {
      const v = VALVE_SIZES[platform].map((sz) => oversizingPct(platform, sz, a));
      for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1]);
    }
  });
});

describe("access arithmetic", () => {
  it("compares the MLD with the delivery system's minimum vessel diameter", () => {
    expect(accessMarginMm(5.5, 5)).toBeCloseTo(0.5, 9);
    expect(accessMarginMm(4.6, 5)).toBeLessThan(0);
    // The largest size needs the larger system.
    expect(deliverySystemFor("balloon-expandable", 29).minVesselMm).toBeGreaterThan(deliverySystemFor("balloon-expandable", 23).minVesselMm);
    expect(deliverySystemFor("self-expanding", 26).minVesselMm).toBe(5);
  });
});

describe("risk model", () => {
  it("maps scores to levels with one shared rule", () => {
    expect(levelFromScore(0)).toBe("low");
    expect(levelFromScore(1)).toBe("low");
    expect(levelFromScore(2)).toBe("moderate");
    expect(levelFromScore(3)).toBe("moderate");
    expect(levelFromScore(4)).toBe("high");
  });

  it("every risk returns reasons and a level", () => {
    for (const s of TAVI_SCENARIOS) {
      const o = assessTavi(s, plan({ sizeMm: suggestedSizes("balloon-expandable", s.annulus)[0] }));
      for (const k of RISK_ORDER) {
        expect(["low", "moderate", "high"]).toContain(o.risks[k].level);
        expect(Array.isArray(o.risks[k].reasons)).toBe(true);
        if (o.risks[k].level !== "low") expect(o.risks[k].reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it("PVL and embolisation fall as the valve size increases (undersizing)", () => {
    const s = byId("tavi-standard");
    const sizes = VALVE_SIZES["balloon-expandable"];
    const pvl = sizes.map((sz) => assessTavi(s, plan({ sizeMm: sz })).risks.pvl.score);
    const emb = sizes.map((sz) => assessTavi(s, plan({ sizeMm: sz })).risks.embolisation.score);
    for (let i = 1; i < sizes.length; i++) {
      expect(pvl[i]).toBeLessThanOrEqual(pvl[i - 1]);
      expect(emb[i]).toBeLessThanOrEqual(emb[i - 1]);
    }
    expect(assessTavi(s, plan({ sizeMm: 20 })).risks.pvl.level).not.toBe("low");
  });

  it("annular rupture rises with balloon-expandable oversizing and LVOT calcium", () => {
    const s = byId("tavi-standard");
    const sizes = VALVE_SIZES["balloon-expandable"];
    const rup = sizes.map((sz) => assessTavi(s, plan({ sizeMm: sz })).risks.rupture.score);
    for (let i = 1; i < sizes.length; i++) expect(rup[i]).toBeGreaterThanOrEqual(rup[i - 1]);
    const calcified: TaviScenario = { ...s, lvotCalcium: "severe" };
    expect(assessTavi(calcified, plan({ sizeMm: 29 })).risks.rupture.level).toBe("high");
    expect(assessTavi(calcified, plan({ sizeMm: 29 })).risks.rupture.score).toBeGreaterThan(
      assessTavi(s, plan({ sizeMm: 29 })).risks.rupture.score
    );
  });

  it("self-expanding valves carry less rupture risk than balloon-expandable in LVOT calcium", () => {
    const s = byId("tavi-bicuspid-lvot");
    const be = assessTavi(s, plan({ platform: "balloon-expandable", sizeMm: 26 })).risks.rupture;
    const se = assessTavi(s, plan({ platform: "self-expanding", sizeMm: 29, finalDepthMm: 4, targetDepthMm: 4 })).risks.rupture;
    expect(lv(se.level)).toBeLessThan(lv(be.level));
  });

  it("post-dilatation trades PVL for rupture risk", () => {
    const s = byId("tavi-bicuspid-lvot");
    const before = assessTavi(s, plan({ sizeMm: 26 }));
    const after = assessTavi(s, plan({ sizeMm: 26, postDilatation: true }));
    expect(after.risks.pvl.score).toBeLessThan(before.risks.pvl.score);
    expect(after.risks.rupture.score).toBeGreaterThan(before.risks.rupture.score);
  });

  it("implant depth: too high and too deep both worsen PVL; too high worsens embolisation", () => {
    const s = byId("tavi-standard");
    const at = (d: number) => assessTavi(s, plan({ finalDepthMm: d, targetDepthMm: d }));
    expect(at(3).risks.pvl.score).toBeLessThan(at(-1).risks.pvl.score);
    expect(at(3).risks.pvl.score).toBeLessThan(at(10).risks.pvl.score);
    const emb = [4, 2, 0.5, -1, -3].map((d) => at(d).risks.embolisation.score);
    for (let i = 1; i < emb.length; i++) expect(emb[i]).toBeGreaterThanOrEqual(emb[i - 1]);
    expect(at(-3).risks.embolisation.level).toBe("high");
  });

  it("balloon-expandable deployment without rapid pacing moves the valve aortic and raises embolisation", () => {
    const s = byId("tavi-standard");
    const paced = assessTavi(s, plan());
    const unpaced = assessTavi(s, plan({ rapidPacing: false }));
    expect(unpaced.depthMm).toBeLessThan(paced.depthMm);
    expect(unpaced.risks.embolisation.score).toBeGreaterThan(paced.risks.embolisation.score);
  });

  it("conduction risk rises with depth, pre-existing RBBB and a self-expanding frame", () => {
    const s = byId("tavi-standard");
    const depths = [1, 3, 5, 7, 9];
    const c = depths.map((d) => assessTavi(s, plan({ finalDepthMm: d, targetDepthMm: d })).risks.conduction.score);
    for (let i = 1; i < c.length; i++) expect(c[i]).toBeGreaterThanOrEqual(c[i - 1]);
    const withRbbb = assessTavi({ ...s, rbbb: true }, plan()).risks.conduction.score;
    expect(withRbbb).toBeGreaterThan(assessTavi(s, plan()).risks.conduction.score);
    const se = assessTavi(s, plan({ platform: "self-expanding", sizeMm: 29 })).risks.conduction.score;
    expect(se).toBeGreaterThan(assessTavi(s, plan()).risks.conduction.score);
  });

  it("implanting deeper than the membranous septum flags conduction risk", () => {
    const s = byId("tavi-conduction");
    const shallow = assessTavi(s, plan({ finalDepthMm: 1, targetDepthMm: 1 })).risks.conduction;
    const deep = assessTavi(s, plan({ finalDepthMm: 5, targetDepthMm: 5 })).risks.conduction;
    expect(lv(deep.level)).toBeGreaterThan(lv(shallow.level));
    expect(deep.reasons.join(" ")).toMatch(/membranous septum/);
    expect(deep.level).toBe("high");
  });

  it("coronary obstruction needs a low ostium (<12 mm); narrow sinuses (<30 mm) and bulky leaflets add to it", () => {
    const low = byId("tavi-low-coronary");
    expect(assessTavi(low, plan({ sizeMm: 23 })).risks.coronary.level).toBe("high");
    const wideSinus: TaviScenario = { ...low, sinusDiameterMm: 34 };
    expect(assessTavi(wideSinus, plan({ sizeMm: 23 })).risks.coronary.score).toBeLessThan(
      assessTavi(low, plan({ sizeMm: 23 })).risks.coronary.score
    );
    const highOstia: TaviScenario = { ...low, coronaryHeightLeftMm: 12, coronaryHeightRightMm: 16 };
    expect(assessTavi(highOstia, plan({ sizeMm: 23 })).risks.coronary.level).toBe("low");
    // A low ostium alone, with wide sinuses and thin leaflets, stays low.
    const lowOnly: TaviScenario = { ...low, sinusDiameterMm: 33, leafletCalcium: "moderate" };
    expect(assessTavi(lowOnly, plan({ sizeMm: 23 })).risks.coronary.level).toBe("low");
    expect(assessTavi(low, plan({ sizeMm: 23 })).risks.coronary.reasons.join(" ")).toMatch(/VTC/);
  });

  it("small annulus: intra-annular balloon-expandable valves carry more gradient risk than supra-annular", () => {
    const s = byId("tavi-small-annulus");
    const be = assessTavi(s, plan({ sizeMm: 20 })).risks.gradient;
    const se = assessTavi(s, plan({ platform: "self-expanding", sizeMm: 26, finalDepthMm: 4, targetDepthMm: 4 })).risks.gradient;
    expect(lv(be.level)).toBeGreaterThan(lv(se.level));
  });

  it("vascular risk follows the MLD margin and calcification; alternative access removes the iliac component", () => {
    const s = byId("tavi-hostile-access");
    const tf = assessTavi(s, plan({ sizeMm: 23 }));
    expect(tf.accessMarginMm).not.toBeNull();
    expect(tf.accessMarginMm!).toBeLessThan(0);
    expect(tf.risks.vascular.level).toBe("high");
    const alt = assessTavi(s, plan({ sizeMm: 23, access: "alternative" }));
    expect(alt.accessMarginMm).toBeNull();
    expect(lv(alt.risks.vascular.level)).toBeLessThan(lv(tf.risks.vascular.level));
    const narrower: TaviScenario = { ...byId("tavi-standard"), access: { mldMm: 4.8, calcification: "mild", tortuosity: "mild" } };
    expect(assessTavi(narrower, plan()).risks.vascular.score).toBeGreaterThan(assessTavi(byId("tavi-standard"), plan()).risks.vascular.score);
  });

  it("depth bands are ordered", () => {
    expect(depthBand("balloon-expandable", -1)).toBe("too-high");
    expect(depthBand("balloon-expandable", 3)).toBe("ideal");
    expect(depthBand("balloon-expandable", 9)).toBe("too-deep");
  });

  it("findings follow the levels", () => {
    const s = byId("tavi-low-coronary");
    const f = taviFindings(s, assessTavi(s, plan({ sizeMm: 23 })));
    expect(f.some((x) => x.key === "coronary" && x.tone === "danger")).toBe(true);
  });
});

describe("best plan and scoring", () => {
  it("the model's best plan matches each case's teaching point", () => {
    expect(bestTaviPlan(byId("tavi-small-annulus")).plan.platform).toBe("self-expanding");
    expect(bestTaviPlan(byId("tavi-hostile-access")).plan.access).toBe("alternative");
    const cond = bestTaviPlan(byId("tavi-conduction"));
    expect(cond.plan.finalDepthMm).toBeLessThan(byId("tavi-conduction").membranousSeptumMm);
    const low = bestTaviPlan(byId("tavi-low-coronary"));
    expect(low.plan.coronaryProtection).toBe(true);
    const std = bestTaviPlan(byId("tavi-standard"));
    for (const k of RISK_ORDER) expect(std.outcome.risks[k].level).toBe("low");
  });

  it("scores are 0–100 and the best plan scores 100", () => {
    for (const s of TAVI_SCENARIOS) {
      const b = bestTaviPlan(s);
      expect(scoreTavi(s, b.plan).score).toBe(100);
      const bad = plan({ sizeMm: 20, finalDepthMm: -3, targetDepthMm: 3, rapidPacing: false });
      const sc = scoreTavi(s, bad).score;
      expect(sc).toBeGreaterThanOrEqual(0);
      expect(sc).toBeLessThan(100);
    }
  });

  it("is deterministic", () => {
    const s = byId("tavi-bicuspid-lvot");
    expect(JSON.stringify(assessTavi(s, plan()))).toBe(JSON.stringify(assessTavi(s, plan())));
    expect(scoreTavi(s, plan()).score).toBe(scoreTavi(s, plan()).score);
  });
});

// ---------------------------------------------------------------------------
// Post-deployment course (structural-tips-and-tavi-course)
// ---------------------------------------------------------------------------

const courseFor = (id: string, p: TaviPlan, actions: CourseActions = {}) => {
  const s = byId(id);
  return taviCourse(s, p, assessTavi(s, p), courseRng(s.id), actions);
};
const obstructionPlan = (): TaviPlan => byId("tavi-coronary-obstruction").deployed!;
const afterPacing = (c: ReturnType<typeof courseFor>) => c.samples.filter((x) => x.t >= c.pacingEndS);

describe("post-deployment course", () => {
  it("the coronary obstruction scenario opens deployed, unprotected, in a high-risk left coronary root", () => {
    const s = byId("tavi-coronary-obstruction");
    expect(s.deployed).toBeDefined();
    const o = assessTavi(s, s.deployed!);
    expect(o.risks.coronary.level).toBe("high");
    expect(s.deployed!.coronaryProtection).toBe(false);
    expect(s.deployed!.platform).toBe("balloon-expandable");
    expect(s.sex).toBe("F");
  });

  it("is deterministic and sampled every second for the course's length", () => {
    const a = courseFor("tavi-standard", plan());
    const b = courseFor("tavi-standard", plan());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.samples.length).toBe(Math.round(COURSE.durationS / COURSE.stepS) + 1);
    expect(courseAt(a, 12.7).t).toBe(12);
    expect(courseAt(a, 9999).t).toBe(COURSE.durationS);
  });

  it("an uncomplicated release: the pressure recovers above 65 within seconds of pacing stopping and stays there", () => {
    const c = courseFor("tavi-standard", plan());
    expect(c.obstruction).toBeNull();
    expect(c.pacingEndS).toBe(COURSE.rapidPacingTailS);
    for (const x of c.samples.filter((x) => x.t < c.pacingEndS)) expect(x.rhythm).toBe("rapid-pacing");
    const recovered = afterPacing(c).find((x) => x.map >= 65)!;
    expect(recovered.t - c.pacingEndS).toBeLessThan(10);
    expect(c.samples.filter((x) => x.t >= recovered.t + 5).every((x) => x.map >= 65 && x.stMm < 1)).toBe(true);
  });

  it("obstruction: the pressure stays below 65 after pacing and keeps falling, ST rises and the left coronary does not fill", () => {
    const c = courseFor("tavi-coronary-obstruction", obstructionPlan());
    expect(c.obstruction).toBe("left");
    expect(c.stLead).toBe("V5");
    const after = afterPacing(c);
    expect(after.every((x) => x.map < 65)).toBe(true);
    expect(after.every((x) => !x.leftFills && x.rightFills)).toBe(true);
    expect(courseAt(c, 300).map).toBeLessThan(courseAt(c, 30).map);
    expect(courseAt(c, 60).stMm).toBeGreaterThan(1);
  });

  it("rescue restores flow after the model's delay, sooner with a protection wire; actions do not change earlier samples", () => {
    const base = courseFor("tavi-coronary-obstruction", obstructionPlan());
    const c = courseFor("tavi-coronary-obstruction", obstructionPlan(), { rootInjectionS: 20, rescueS: 30 });
    expect(c.reflowS).toBe(30 + COURSE.rescueReflowS);
    expect(courseAt(c, c.reflowS! - 1).leftFills).toBe(false);
    expect(courseAt(c, c.reflowS!).leftFills).toBe(true);
    expect(courseAt(c, c.reflowS! + 60).map).toBeGreaterThan(65);
    expect(courseAt(c, c.reflowS! + 60).stMm).toBeLessThan(1);
    expect(JSON.stringify(c.samples.slice(0, c.reflowS!))).toBe(JSON.stringify(base.samples.slice(0, c.reflowS!)));
    const prot = courseFor("tavi-coronary-obstruction", { ...obstructionPlan(), coronaryProtection: true }, { rescueS: 30 });
    expect(prot.reflowS).toBe(30 + COURSE.rescueReflowProtectedS);
  });

  it("ST elevation of 1 mm or more appears only while the mean pressure is below 65, after pacing", () => {
    for (const s of TAVI_SCENARIOS)
      for (const p of [plan(), plan({ platform: "self-expanding", sizeMm: 29, rapidPacing: false }), plan({ sizeMm: 20, finalDepthMm: 0 })])
        for (const actions of [{}, { rescueS: 20 }, { rescueS: 200, pacingS: 40 }]) {
          const c = taviCourse(s, p, assessTavi(s, p), courseRng(s.id), actions);
          for (const x of c.samples) if (x.stMm >= 1) expect(x.t >= c.pacingEndS && x.map < 65).toBe(true);
        }
  });

  it("complete heart block with pre-existing RBBB and a high conduction risk; pacing restores the rate", () => {
    const s = byId("tavi-conduction");
    const deep = plan({ sizeMm: 29, finalDepthMm: 6, targetDepthMm: 6 });
    expect(assessTavi(s, deep).risks.conduction.level).toBe("high");
    const c = courseFor("tavi-conduction", deep);
    expect(c.chbS).toBe(c.pacingEndS + COURSE.chbOnsetS);
    expect(courseAt(c, c.chbS! + 20).rhythm).toBe("chb");
    expect(courseAt(c, c.chbS! + 20).hr).toBeLessThan(50);
    const paced = courseFor("tavi-conduction", deep, { pacingS: c.chbS! + 10 });
    expect(courseAt(paced, c.chbS! + 40).rhythm).toBe("paced");
    expect(courseAt(paced, c.chbS! + 60).map).toBeGreaterThan(65);
  });
});

describe("post-dilatation at the assess step", () => {
  it("a post-dilatation that raises the rupture risk to high starts the rupture course from that moment", () => {
    // every scenario and plan whose rupture risk is below high as released and high once post-dilated
    const cases: { s: TaviScenario; p: TaviPlan }[] = [];
    for (const s of TAVI_SCENARIOS)
      for (const p of [plan(), ...VALVE_SIZES["balloon-expandable"].map((sizeMm) => plan({ sizeMm })), ...(s.deployed ? [s.deployed] : [])])
        if (assessTavi(s, p).risks.rupture.level !== "high" && assessTavi(s, { ...p, postDilatation: true }).risks.rupture.level === "high") cases.push({ s, p });
    expect(cases.length).toBeGreaterThan(0);
    for (const { s, p } of cases) {
      const at = 60;
      const base = taviCourse(s, p, assessTavi(s, p), courseRng(s.id));
      const c = taviCourse(s, p, assessTavi(s, p), courseRng(s.id), { postDilatationS: at });
      expect(base.rupture).toBe(false);
      expect(c.rupture).toBe(true);
      expect(c.ruptureS).toBe(at);
      // earlier samples do not change; the pressure falls afterwards with both coronaries filling
      expect(JSON.stringify(c.samples.slice(0, at))).toBe(JSON.stringify(base.samples.slice(0, at)));
      expect(courseAt(c, at + 120).map).toBeLessThan(courseAt(base, at + 120).map);
      expect(courseAt(c, at + 240).map).toBeLessThan(COURSE_RESPONSE.lowMapMmHg);
      if (c.obstruction === null) expect(c.samples.every((x) => x.leftFills && x.rightFills)).toBe(true);
    }
  });

  it("a post-dilatation that leaves the rupture risk below high does not change the course", () => {
    const s = byId("tavi-standard");
    const p = plan();
    expect(assessTavi(s, { ...p, postDilatation: true }).risks.rupture.level).not.toBe("high");
    const base = taviCourse(s, p, assessTavi(s, p), courseRng(s.id));
    const c = taviCourse(s, p, assessTavi(s, p), courseRng(s.id), { postDilatationS: 60 });
    expect(c.ruptureS).toBeNull();
    expect(JSON.stringify(c.samples)).toBe(JSON.stringify(base.samples));
  });
});

describe("course response scoring", () => {
  const s = byId("tavi-coronary-obstruction");
  const deployed = s.deployed!;
  const respond = (actions: CourseActions, endS = 330) => {
    const course = taviCourse(s, deployed, assessTavi(s, deployed), courseRng(s.id), actions);
    return { course, actions, endS, planByLearner: false };
  };

  it("in 'tavi-coronary-obstruction' root injection within 60 s scores better than waiting 3 min", () => {
    const pe = COURSE.rapidPacingTailS;
    const prompt = scoreTavi(s, deployed, undefined, respond({ rootInjectionS: pe + 30, rescueS: pe + 45 }));
    const waited = scoreTavi(s, deployed, undefined, respond({ rootInjectionS: pe + 180, rescueS: pe + 195 }));
    expect(prompt.score).toBeGreaterThan(waited.score);
    expect(prompt.score).toBe(100);
    expect(waited.deductions.some((d) => /Root injection 180 s after pacing stopped/.test(d.reason))).toBe(true);
  });

  it("waiting worsens the outcome: later reflow, longer ischaemic time", () => {
    const pe = COURSE.rapidPacingTailS;
    const early = scoreTaviCourse(respond({ rootInjectionS: pe + 20, rescueS: pe + 30 }).course, { rootInjectionS: pe + 20, rescueS: pe + 30 }, 330);
    const late = scoreTaviCourse(respond({ rootInjectionS: pe + 200, rescueS: pe + 210 }).course, { rootInjectionS: pe + 200, rescueS: pe + 210 }, 330);
    expect(early.ischaemicS!).toBeLessThanOrEqual(COURSE_RESPONSE.ischaemiaRecoveredS);
    expect(late.ischaemicS!).toBeGreaterThan(early.ischaemicS!);
    expect(late.outcome).not.toBe(early.outcome);
  });

  it("no injection and no rescue costs the most; a rescue called late after the injection costs too", () => {
    const pe = COURSE.rapidPacingTailS;
    const nothing = scoreTavi(s, deployed, undefined, respond({})).score;
    const lateRescue = scoreTavi(s, deployed, undefined, respond({ rootInjectionS: pe + 20, rescueS: pe + 200 })).score;
    const prompt = scoreTavi(s, deployed, undefined, respond({ rootInjectionS: pe + 20, rescueS: pe + 30 })).score;
    expect(nothing).toBeLessThan(lateRescue);
    expect(lateRescue).toBeLessThan(prompt);
    // actions after the learner left the assess step do not count
    expect(scoreTavi(s, deployed, undefined, respond({ rootInjectionS: pe + 20, rescueS: pe + 30 }, pe + 10)).score).toBe(nothing);
  });

  it("does not double-penalise the coronary risk: the plan is scored only when the learner made it", () => {
    const pe = COURSE.rapidPacingTailS;
    const r = respond({ rootInjectionS: pe + 20, rescueS: pe + 30 });
    const byLearner = scoreTavi(s, deployed, undefined, { ...r, planByLearner: true });
    const byScenario = scoreTavi(s, deployed, undefined, r);
    expect(byLearner.deductions.some((d) => /without planned coronary protection/.test(d.reason))).toBe(true);
    expect(byScenario.deductions).toEqual([]);
    // the course deductions never mention the plan's risk
    for (const d of scoreTaviCourse(r.course, r.actions, 330).deductions) expect(d.reason).not.toMatch(/protection|risk/i);
  });

  it("without a response the score is the plan's alone, as before", () => {
    for (const sc of TAVI_SCENARIOS) expect(scoreTavi(sc, bestTaviPlan(sc).plan).score).toBe(100);
  });

  it("complete heart block left unpaced when the learner leaves the assess step is a miss, even within the first minute", () => {
    const cs = byId("tavi-conduction");
    const deep = plan({ sizeMm: 29, finalDepthMm: 6, targetDepthMm: 6 });
    const c = taviCourse(cs, deep, assessTavi(cs, deep), courseRng(cs.id));
    expect(c.chbS).not.toBeNull();
    const missed = scoreTaviCourse(c, {}, c.chbS! + 20);
    expect(missed.deductions.some((d) => /Complete heart block was not paced/.test(d.reason))).toBe(true);
    // paced in time: no deduction; left before the block began: no deduction
    expect(scoreTaviCourse(c, { pacingS: c.chbS! + 10 }, c.chbS! + 20).deductions).toEqual([]);
    expect(scoreTaviCourse(c, {}, c.chbS! - 1).deductions).toEqual([]);
    // paced too late
    expect(scoreTaviCourse(c, { pacingS: c.chbS! + COURSE_RESPONSE.paceWithinS + 5 }, c.chbS! + 200).deductions.map((d) => d.points)).toEqual([6]);
  });

  it("a rescue called with a stable pressure and filling coronaries costs a little", () => {
    const std = byId("tavi-standard");
    const c = taviCourse(std, plan(), assessTavi(std, plan()), courseRng(std.id), { rescueS: 40 });
    const r = scoreTaviCourse(c, { rescueS: 40 }, 120);
    expect(r.deductions.map((d) => d.points)).toEqual([3]);
  });
});
