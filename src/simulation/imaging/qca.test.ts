import { describe, expect, it } from "vitest";
import { analyseSegment, calibrateOnCatheter, measureProfile, resamplePath, synthFrame } from "./qca";

// Synthetic frame with known sizes: a 6 Fr (2.0 mm) contrast-filled catheter and a 3.0 mm
// vessel with a 1.2 mm (60 %) stenosis, at 0.3 mm per pixel of the stored 512 frame (about a
// 20 cm field at the isocentre), blurred and noisy like the stored cine.
const MM_PER_PX = 0.3;
function frame(seed: number, blurPx = 1) {
  const prof: number[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const st = Math.exp(-((x - 0.5) ** 2) / (2 * 0.06 ** 2));
    prof.push((3 - 1.8 * st) / MM_PER_PX);
  }
  return synthFrame(
    220,
    120,
    [
      { pts: [{ x: 10, y: 25 }, { x: 210, y: 28 }], diamPx: 2 / MM_PER_PX, mu: 0.07 },
      { pts: [{ x: 15, y: 80 }, { x: 205, y: 90 }], diamPx: prof, mu: 0.06 },
    ],
    { blurPx, noise: 3, seed }
  );
}

describe("trainee QCA", () => {
  it("resamples a path at the requested spacing", () => {
    const p = resamplePath([{ x: 0, y: 0 }, { x: 10, y: 0 }], 1);
    expect(p.length).toBe(11);
    expect(p[5].x).toBeCloseTo(5, 9);
  });

  it("finds both edges of a dark tube", () => {
    const f = synthFrame(60, 40, [{ pts: [{ x: 5, y: 20 }, { x: 55, y: 20 }], diamPx: 10, mu: 0.06 }], { blurPx: 0.8, noise: 0, seed: 1 });
    const e = measureProfile(f, { x: 30, y: 20 }, { x: 0, y: 1 })!;
    expect(e).not.toBeNull();
    expect(Math.abs((e.left + e.right) / 2)).toBeLessThan(0.3);
    // steepest-slope edges of a cylinder lie inside its outer wall
    expect(e.widthPx).toBeGreaterThan(7.5);
    expect(e.widthPx).toBeLessThan(10.5);
  });

  it("calibration on a 6 Fr catheter gives errors within published QCA bounds (Keane 1995)", () => {
    const mld: number[] = [];
    const ref: number[] = [];
    const cal: number[] = [];
    const ds: number[] = [];
    for (const blur of [0.8, 1.2]) {
      for (let seed = 1; seed <= 6; seed++) {
        const f = frame(seed, blur);
        const c = calibrateOnCatheter(f, { x: 40, y: 25.5 }, { x: 180, y: 27.5 }, 6)!;
        expect(c).not.toBeNull();
        cal.push(c.mmPerPx / MM_PER_PX - 1);
        const r = analyseSegment(f, [{ x: 25, y: 80.5 }, { x: 195, y: 89.5 }], c.mmPerPx)!;
        expect(r).not.toBeNull();
        mld.push(r.mldMm - 1.2);
        ref.push(r.refMm - 3.0);
        ds.push(r.dsPct - 60);
      }
    }
    const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    const sd = (a: number[]) => Math.sqrt(a.reduce((s, x) => s + (x - mean(a)) ** 2, 0) / (a.length - 1));
    // accuracy (mean signed error) and precision (SD) of the MLD within the range Keane et al. reported
    // for ten systems (accuracy +0.07 to +0.31 mm, precision 0.14 to 0.24 mm): |bias| <= 0.31, SD <= 0.24
    expect(Math.abs(mean(mld))).toBeLessThanOrEqual(0.31);
    expect(sd(mld)).toBeLessThanOrEqual(0.24);
    expect(Math.abs(mean(ref))).toBeLessThanOrEqual(0.31);
    // the catheter is a few pixels wide: its calibration is not exact (the weakest step, Lienard 2002)
    expect(Math.abs(mean(cal))).toBeGreaterThan(0.01);
    expect(Math.abs(mean(cal))).toBeLessThan(0.3);
    // the stenosis is found and graded in the right band
    expect(Math.abs(mean(ds))).toBeLessThan(10);
  });

  it("refuses a segment with nothing to measure", () => {
    const f = synthFrame(80, 60, [], { noise: 3, seed: 4 });
    expect(analyseSegment(f, [{ x: 10, y: 30 }, { x: 70, y: 30 }], 0.3)).toBeNull();
    expect(calibrateOnCatheter(f, { x: 10, y: 30 }, { x: 70, y: 30 }, 6)).toBeNull();
  });
});

describe("QCA marks", () => {
  it("snap to the dark structure under the click", async () => {
    const { snapToVessel } = await import("./qca");
    const f = synthFrame(60, 40, [{ pts: [{ x: 5, y: 20 }, { x: 55, y: 20 }], diamPx: 6, mu: 0.08 }], { blurPx: 0.8, noise: 2, seed: 3 });
    const p = snapToVessel(f, { x: 30, y: 16 });
    expect(Math.abs(p.y - 20)).toBeLessThanOrEqual(1);
    // nothing within reach: the click stays near where it was
    const q = snapToVessel(f, { x: 30, y: 5 }, 3);
    expect(Math.abs(q.y - 5)).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// diag-qca-measurement: both references and their average, the derived area
// stenosis, and the verdict on a reported measurement (foreshortened frame,
// accuracy against the model in the reported view, the worse view).
// ---------------------------------------------------------------------------

describe("references on a tapering vessel (diag-qca-measurement)", () => {
  // a vessel tapering linearly from 4.5 mm to 2.1 mm, with a 60 % stenosis of the local reference at its middle
  const prox = 4.5;
  const dist = 2.1;
  const TRUE_DS = 60;
  function tapering(seed: number) {
    const prof: number[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const ref = prox + (dist - prox) * x;
      const st = Math.exp(-((x - 0.5) ** 2) / (2 * 0.05 ** 2));
      prof.push((ref * (1 - (TRUE_DS / 100) * st)) / MM_PER_PX);
    }
    return synthFrame(240, 120, [
      { pts: [{ x: 10, y: 25 }, { x: 230, y: 27 }], diamPx: 2 / MM_PER_PX, mu: 0.07 },
      { pts: [{ x: 10, y: 80 }, { x: 230, y: 86 }], diamPx: prof, mu: 0.06 },
    ], { blurPx: 1, noise: 3, seed });
  }

  it("the averaged reference gives %DS within 5 points of the truth; the proximal reference alone overestimates by more than 5", async () => {
    const { referenceStenosis } = await import("./qca");
    for (let seed = 1; seed <= 4; seed++) {
      const f = tapering(seed);
      const c = calibrateOnCatheter(f, { x: 40, y: 25.5 }, { x: 200, y: 26.5 }, 6)!;
      expect(c).not.toBeNull();
      // marks from normal to normal, symmetric about the lesion
      const r = analyseSegment(f, [{ x: 40, y: 80.8 }, { x: 200, y: 85.2 }], c.mmPerPx)!;
      expect(r).not.toBeNull();
      expect(r.refProxMm).toBeGreaterThan(r.refDistMm);
      expect(r.refAvgMm).toBeCloseTo((r.refProxMm + r.refDistMm) / 2, 9);
      expect(Math.abs(r.dsAvgPct - TRUE_DS), `seed ${seed}: average ${r.dsAvgPct.toFixed(1)}`).toBeLessThanOrEqual(5);
      expect(r.dsProxPct - TRUE_DS, `seed ${seed}: proximal ${r.dsProxPct.toFixed(1)}`).toBeGreaterThan(5);
      // the distal reference alone understates it
      expect(r.dsDistPct).toBeLessThan(r.dsAvgPct);
      // the result's fields are the shared formula's
      expect(referenceStenosis(r.mldMm, r.refProxMm, r.refDistMm).dsAvgPct).toBeCloseTo(r.dsAvgPct, 9);
    }
  });

  it("the stenosis lesson's worked example: references 3.4 and 2.6 mm, MLD 0.9 mm give 70 % on the average, about 74 % proximal and 65 % distal", async () => {
    const { referenceStenosis } = await import("./qca");
    const x = referenceStenosis(0.9, 3.4, 2.6);
    expect(x.refAvgMm).toBeCloseTo(3.0, 9);
    expect(x.dsAvgPct).toBeCloseTo(70, 6);
    expect(Math.round(x.dsProxPct)).toBe(74);
    expect(Math.round(x.dsDistPct)).toBe(65);
  });

  it("area stenosis is derived from the diameters assuming a circular lumen: 1 - (MLD/ref)^2", async () => {
    const { areaStenosisPct, diameterStenosisPct } = await import("./qca");
    expect(areaStenosisPct(1.5, 3)).toBeCloseTo(75, 9);
    expect(diameterStenosisPct(1.5, 3)).toBeCloseTo(50, 9);
    expect(areaStenosisPct(0.9, 3)).toBeCloseTo(91, 9);
    expect(areaStenosisPct(1, 0)).toBe(0);
  });
});

describe("a reported measurement (diag-qca-measurement)", () => {
  const result = (dsAvgPct: number) => ({ mldMm: 1, refProxMm: 3.2, refDistMm: 2.8, refAvgMm: 3, dsAvgPct, dsProxPct: dsAvgPct + 2, dsDistPct: dsAvgPct - 2, areaStenosisPct: 80, segmentLengthMm: 14 });
  const ORTHO = { laoRao: -30, cranialCaudal: 0 };
  const FORE = { laoRao: 45, cranialCaudal: -25 };
  // run 1: a foreshortened view of the segment; run 2: the orthogonal view that lays it out, where the lesion is worse
  const byRun = [
    { run: 1, view: "LAO 45  CAU 25", cArm: FORE, pctDS: 70, foreshortening: 0.6 },
    { run: 2, view: "RAO 30  CRA 0", cArm: ORTHO, pctDS: 66, foreshortening: 0.95 },
  ];

  it("the foreshortening threshold is the view coverage's adequacy threshold", async () => {
    const { QCA_FORESHORTENED_BELOW } = await import("./qca");
    const { DEFAULT_COVERAGE } = await import("../../mentor/coverage");
    expect(QCA_FORESHORTENED_BELOW).toBe(DEFAULT_COVERAGE.minForeshortening);
  });

  it("a report from a frame with foreshortening 0.6 is flagged; one from the orthogonal 0.95 view within 5 points passes", async () => {
    const { buildQcaReport, qcaVerdicts, isForeshortened } = await import("./qca");
    expect(isForeshortened(0.6)).toBe(true);
    expect(isForeshortened(0.95)).toBe(false);
    expect(isForeshortened(undefined)).toBe(false);
    const fore = buildQcaReport(result(72), { caseId: "c", at: 1, tWall: 10, run: 1, cArm: FORE, segment: "7", foreshortening: 0.6, truth: { lesionIndex: 0, pctDS: 70, byRun } });
    expect(fore.foreshortened).toBe(true);
    expect(fore.view).toBe("LAO 45  CAU 25");
    expect(fore.dsPct).toBe(72);
    expect(fore.lengthMm).toBe(14);
    const [v1] = qcaVerdicts([fore]);
    expect(v1.foreshortened).toBe(true);
    expect(v1.pass).toBe(false);
    // the worse view that lays the segment out is the orthogonal one (the foreshortened view is not counted)
    expect(v1.worse?.run).toBe(2);

    const ortho = buildQcaReport(result(63), { caseId: "c", at: 2, tWall: 20, run: 2, cArm: ORTHO, segment: "7", foreshortening: 0.95, truth: { lesionIndex: 0, pctDS: 66, byRun } });
    expect(ortho.foreshortened).toBe(false);
    const [v2] = qcaVerdicts([fore, ortho]);
    // the later report of the same lesion stands; both views were measured
    expect(v2.report).toBe(ortho);
    expect(v2.measuredRuns).toEqual([1, 2]);
    expect(v2.errorPct).toBeCloseTo(-3, 9);
    expect(v2.withinTolerance).toBe(true);
    expect(v2.milderView).toBe(false);
    expect(v2.pass).toBe(true);
    // 6 points off fails the tolerance
    const off = buildQcaReport(result(60), { caseId: "c", at: 3, tWall: 30, run: 2, cArm: ORTHO, segment: "7", foreshortening: 0.95, truth: { lesionIndex: 0, pctDS: 66, byRun } });
    expect(qcaVerdicts([off])[0].pass).toBe(false);
  });

  it("a report from the milder of two adequate views names the worse view", async () => {
    const { buildQcaReport, qcaVerdicts } = await import("./qca");
    const views = [
      { run: 1, view: "RAO 30  CRA 0", cArm: ORTHO, pctDS: 40, foreshortening: 0.9 },
      { run: 2, view: "LAO 60  CRA 0", cArm: { laoRao: 60, cranialCaudal: 0 }, pctDS: 68, foreshortening: 0.85 },
    ];
    const mild = buildQcaReport(result(42), { caseId: "c", at: 1, tWall: 10, run: 1, cArm: ORTHO, segment: "7", foreshortening: 0.9, truth: { lesionIndex: 0, pctDS: 40, byRun: views } });
    const [v] = qcaVerdicts([mild]);
    // close to the model in the view measured, but judged against the worse view, the one the lesson says to report
    expect(v.truePct).toBe(40);
    expect(v.targetPct).toBe(68);
    expect(v.targetRun).toBe(2);
    expect(v.withinTolerance).toBe(false);
    expect(v.milderView).toBe(true);
    expect(v.worse?.run).toBe(2);
    expect(v.pass).toBe(false);
  });

  it("the accuracy is judged against the worse view: worse 70, the reported view 66, a report of 61 fails", async () => {
    const { buildQcaReport, qcaVerdicts } = await import("./qca");
    const views = [
      { run: 1, view: "RAO 30  CRA 0", cArm: ORTHO, pctDS: 66, foreshortening: 0.9 },
      { run: 2, view: "LAO 60  CRA 0", cArm: { laoRao: 60, cranialCaudal: 0 }, pctDS: 70, foreshortening: 0.85 },
    ];
    const rep = buildQcaReport(result(61), { caseId: "c", at: 1, tWall: 10, run: 1, cArm: ORTHO, segment: "7", foreshortening: 0.9, truth: { lesionIndex: 0, pctDS: 66, byRun: views } });
    const [v] = qcaVerdicts([rep]);
    // the worse view is within the tolerance of the reported one, so this is not the milder-view fault
    expect(v.milderView).toBe(false);
    expect(v.targetPct).toBe(70);
    expect(v.errorPct).toBeCloseTo(-9, 9);
    expect(v.withinTolerance).toBe(false);
    expect(v.pass).toBe(false);
    // the same number reported against the worse view's own value passes there
    const inWorse = buildQcaReport(result(67), { caseId: "c", at: 2, tWall: 20, run: 2, cArm: views[1].cArm, segment: "7", foreshortening: 0.85, truth: { lesionIndex: 0, pctDS: 70, byRun: views } });
    const [w] = qcaVerdicts([inWorse]);
    expect(w.targetRun).toBe(2);
    expect(w.pass).toBe(true);
  });

  it("the second view counts views the learner measured, not views stored: two adequate runs stored, one measured, is one view", async () => {
    const { buildQcaReport, qcaVerdicts } = await import("./qca");
    const { qcaGaps } = await import("../../mentor/debriefChecks/qca");
    const views = [
      { run: 1, view: "RAO 30  CRA 0", cArm: ORTHO, pctDS: 66, foreshortening: 0.9 },
      { run: 2, view: "LAO 60  CRA 0", cArm: { laoRao: 60, cranialCaudal: 0 }, pctDS: 68, foreshortening: 0.85 },
    ];
    const one = buildQcaReport(result(66), { caseId: "c", at: 1, tWall: 10, run: 2, cArm: views[1].cArm, segment: "7", foreshortening: 0.85, truth: { lesionIndex: 0, pctDS: 68, byRun: views } });
    const [v] = qcaVerdicts([one]);
    expect(v.views.map((x) => x.run)).toEqual([1, 2]);
    expect(v.measuredAdequateRuns).toEqual([2]);
    expect(v.oneView).toBe(true);
    const gaps = qcaGaps([one]);
    const gap = gaps.find((x) => x.id.startsWith("qca-one-view"));
    expect(gap).toBeDefined();
    expect(gap!.teaching).toContain("run 1");
    // measured in both: no second-view gap
    const two = buildQcaReport(result(66), { caseId: "c", at: 2, tWall: 20, run: 1, cArm: ORTHO, segment: "7", foreshortening: 0.9, truth: { lesionIndex: 0, pctDS: 66, byRun: views } });
    const again = buildQcaReport(result(66), { caseId: "c", at: 3, tWall: 30, run: 2, cArm: views[1].cArm, segment: "7", foreshortening: 0.85, truth: { lesionIndex: 0, pctDS: 68, byRun: views } });
    expect(qcaVerdicts([two, again])[0].oneView).toBe(false);
    expect(qcaGaps([two, again]).some((x) => x.id.startsWith("qca-one-view"))).toBe(false);
  });

  it("the report log keeps a case's reports from the session's start", async () => {
    const { buildQcaReport, reportQca, qcaReportsFor, clearQcaReports } = await import("./qca");
    clearQcaReports();
    const mk = (caseId: string, at: number) => buildQcaReport(result(50), { caseId, at, tWall: 0, run: 1, cArm: ORTHO, segment: "7", truth: { lesionIndex: 0, pctDS: 50, byRun: [] } });
    reportQca(mk("a", 100));
    reportQca(mk("b", 200));
    reportQca(mk("a", 300));
    expect(qcaReportsFor("a").map((r) => r.at)).toEqual([100, 300]);
    expect(qcaReportsFor("a", 200).map((r) => r.at)).toEqual([300]);
    // a finished session's window ends at its end: a later session's reports are not its own
    expect(qcaReportsFor("a", 0, 200).map((r) => r.at)).toEqual([100]);
    clearQcaReports();
    expect(qcaReportsFor("a")).toEqual([]);
  });
});
