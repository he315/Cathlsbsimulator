// Stent platforms, positioning feedback and the sizing presets of the bench (pci-bench-stent-platforms-sizing).
//   npx vitest run src/simulation/bench/platforms.test.ts
import { describe, expect, it } from "vitest";
import { DEVICE_BY_ID } from "../pci/equipment";
import { THIN_STRUT_DES, deliveryLayout, markerRelation } from "../pci/stentGeometry";
import {
  BENCH_BY_ID,
  BENCH_LESIONS,
  MEASURE_LESIONS,
  PLATFORM_LESIONS,
  angiographicReferenceMm,
  applyPrep,
  balloonDiameter,
  balloonPressures,
  benchFrameAt,
  benchRegion,
  deploy,
  eem,
  giveNitrate,
  initialState,
  injuredSegments,
  lumen,
  maxStentDiameter,
  preImaging,
  type BenchLesion,
  type PostDil,
  type PrepAction,
  type Stent,
} from "../pciBench";
import { DEFAULT_PLATFORM_ID, PLATFORMS, PLATFORM_BY_ID, checkPostDilatation, platformFor, platformsReaching, type PlatformId } from "./platforms";

const L = (id: string): BenchLesion => {
  const l = BENCH_BY_ID[id];
  if (!l) throw new Error(`no lesion ${id}`);
  return l;
};
const prep = (l: BenchLesion, actions: PrepAction[]) => actions.reduce((s, a) => applyPrep(l, s, a), initialState());
const crit = (r: ReturnType<typeof deploy>, start: string) => r.criteria.find((c) => c.label.startsWith(start));

describe("platforms: limits against the module table (eq-balloons-stents-cart-stent-build, Brilakis 10.1, 10.2, 22.3)", () => {
  it("there are five generic platforms, named by letter, with A the default", () => {
    expect(PLATFORMS.map((p) => p.id)).toEqual(["A", "B", "C", "D", "E"]);
    for (const p of PLATFORMS) expect(p.label).toBe(`Platform ${p.id}`);
    expect(DEFAULT_PLATFORM_ID).toBe("A");
    expect(platformFor(undefined).id).toBe("A");
    expect(platformFor("Z").id).toBe("A");
  });

  it("the smallest stent, 2.0 mm, is made on one platform; one platform is made up to 5.0 mm, expandable to 5.75 mm", () => {
    expect(PLATFORMS.filter((p) => p.offers(2.0)).map((p) => p.id)).toEqual(["B"]);
    expect(Math.min(...PLATFORMS.flatMap((p) => p.diameters))).toBe(2.0);
    const five = PLATFORMS.filter((p) => p.offers(5.0));
    expect(five.map((p) => p.id)).toEqual(["A"]);
    expect(five[0].limit(5.0)).toBe(5.75);
    expect(Math.max(...PLATFORMS.flatMap((p) => p.diameters))).toBe(5.0);
  });

  it("another platform's 4.0 mm stent also expands to 5.75 mm, and a third's 3.5 and 4.0 mm stents to 5.5 mm", () => {
    expect(PLATFORM_BY_ID.C.limit(4.0)).toBe(5.75);
    expect(PLATFORM_BY_ID.D.limit(3.5)).toBe(5.5);
    expect(PLATFORM_BY_ID.D.limit(4.0)).toBe(5.5);
    // two platforms reach 5.75 mm
    expect(PLATFORMS.filter((p) => p.diameters.some((d) => p.limit(d) === 5.75)).map((p) => p.id)).toEqual(["A", "C"]);
  });

  it("the 3.5-4.0 mm band's limits run from about 4.5 to 5.5 mm across platforms (5.75 for the one 4.0 mm stent the module names)", () => {
    for (const p of PLATFORMS) {
      if (p.offers(3.5)) {
        expect(p.limit(3.5), p.id).toBeGreaterThanOrEqual(4.5);
        expect(p.limit(3.5), p.id).toBeLessThanOrEqual(5.5);
      }
      if (p.offers(4.0)) {
        expect(p.limit(4.0), p.id).toBeGreaterThanOrEqual(4.5);
        expect(p.limit(4.0), p.id).toBeLessThanOrEqual(p.id === "C" ? 5.75 : 5.5);
      }
    }
    const at35 = PLATFORMS.filter((p) => p.offers(3.5)).map((p) => p.limit(3.5));
    expect(Math.min(...at35)).toBe(4.5);
    expect(Math.max(...at35)).toBe(5.5);
  });

  it("platform A is the catalogue's drug-eluting stent: its sizes, lengths and dilatation limits, and maxStentDiameter agrees", () => {
    const des = DEVICE_BY_ID.des;
    const a = PLATFORM_BY_ID.A;
    expect([...a.diameters]).toEqual(des.diameters);
    expect([...a.lengths]).toEqual(des.lengths);
    expect(a.design).toBe(THIN_STRUT_DES);
    for (const d of des.diameters) {
      expect(a.limit(d)).toBe(des.dilatationLimit!(d));
      expect(maxStentDiameter(d)).toBe(a.limit(d));
      expect(maxStentDiameter(d, "A")).toBe(a.limit(d));
    }
  });

  it("every band is sourced or a declared model parameter, the bands cover every size, and every limit is above its size", () => {
    for (const p of PLATFORMS) {
      for (const d of p.diameters) {
        const band = p.bands.find((b) => d >= b.fromMm - 1e-9 && d <= b.toMm + 1e-9);
        expect(band, `${p.id} ${d}`).toBeDefined();
        expect(p.limit(d)).toBeGreaterThan(d);
        expect(maxStentDiameter(d, p.id)).toBe(p.limit(d));
      }
      const unsourced = p.bands.filter((b) => !b.source);
      if (unsourced.length) expect(p.modelParam.some((m) => /limit/.test(m)), p.id).toBe(true);
      expect(p.sources.length).toBeGreaterThan(0);
    }
  });

  it("platforms differ in strut thickness, cell design, radial strength and marker placement; most lie inside their markers, one is centred", () => {
    const struts = PLATFORMS.map((p) => p.design.strutMm);
    expect(new Set(struts).size).toBe(PLATFORMS.length);
    for (const s of struts) {
      // inside the 50-140 µm span of the module's ISAR-STEREO-2 figures
      expect(s).toBeGreaterThanOrEqual(0.05);
      expect(s).toBeLessThanOrEqual(0.14);
    }
    const centred = PLATFORMS.filter((p) => markerRelation(p.design) === "centred").map((p) => p.id);
    expect(centred).toEqual(["C"]);
    expect(PLATFORMS.filter((p) => markerRelation(p.design) === "inside").length).toBeGreaterThan(PLATFORMS.length / 2);
    // closed cells: high radial strength (Oxford's design table)
    for (const p of PLATFORMS) expect(p.radialStrength === "strong").toBe(p.cell === "closed");
    expect(PLATFORMS.some((p) => p.cell === "closed")).toBe(true);
  });

  it("the PCI lab's THIN_STRUT_DES is unchanged", () => {
    expect({ ...THIN_STRUT_DES, crowns: [THIN_STRUT_DES.crowns(3.0), THIN_STRUT_DES.crowns(3.5)] }).toEqual({
      strutMm: 0.081,
      strutWidthMm: 0.09,
      ringMm: 0.95,
      gapMm: 0.3,
      crowns: [6, 9],
      connectorsPerGap: 3,
      crimpedD: 1.05,
      markerBeyondMm: 0.4,
      markerLenMm: 1.0,
      markerD: 0.75,
    });
  });

  it("the delivery layout separates the marker bands from the stent edges, or centres the edges on them", () => {
    const inside = deliveryLayout(PLATFORM_BY_ID.A.design, 18);
    expect(inside.stent).toEqual([0, 18]);
    expect(inside.markers[0][1]).toBeLessThan(0); // the proximal marker ends 0.4 mm before the stent
    expect(inside.markers[1][0]).toBeGreaterThan(18);
    expect(inside.edgeFromMarkerCentreMm).toBeCloseTo(0.9, 6);
    const centred = deliveryLayout(PLATFORM_BY_ID.C.design, 18);
    expect((centred.markers[0][0] + centred.markers[0][1]) / 2).toBeCloseTo(0, 6);
    expect((centred.markers[1][0] + centred.markers[1][1]) / 2).toBeCloseTo(18, 6);
    expect(centred.edgeFromMarkerCentreMm).toBeCloseTo(0, 6);
  });
});

describe("post-dilatation limits", () => {
  it("POT to 5.0 mm on a 3.5 mm platform with a 4.5 mm limit is flagged; within the limit it is not", () => {
    const withLimit45 = PLATFORMS.filter((p) => p.offers(3.5) && p.limit(3.5) === 4.5);
    expect(withLimit45.map((p) => p.id)).toEqual(["A", "E"]);
    for (const p of withLimit45) {
      const c = checkPostDilatation(p, 3.5, 5.0);
      expect(c.over).toBe(true);
      expect(c.byMm).toBeCloseTo(0.5, 6);
      expect(checkPostDilatation(p, 3.5, 4.5).over).toBe(false);
    }
    // on the bench: a 3.5 mm crossover stent from the LAD into a 4.8 mm left main, POT with a 5.0 mm NC balloon
    const l = L("lm-lad-crossover");
    const nominal = balloonPressures("non-compliant", 5.0).nominalAtm;
    expect(balloonDiameter("non-compliant", 5.0, nominal)).toBeCloseTo(5.0, 6);
    const stent: Stent = { diameter: 3.5, lengthMm: 23, proxEdge: 0, atm: 12, platformId: "A" };
    const pot: PostDil[] = [{ diameter: 5.0, atm: nominal, where: "proximal" }];
    const s = prep(l, [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 10 }]);
    const onA = deploy(l, s, stent, pot, "IVUS");
    const ev = onA.events.find((e) => e.kind === "stent-overdilated");
    expect(ev?.text).toContain("Platform A");
    expect(ev?.text).toContain("4.50");
    expect(onA.overexpansion).toMatchObject({ over: true, limitMm: 4.5 });
    expect(onA.limitMm).toBe(4.5);
    expect(onA.findings.find((f) => f.id === "overexpansion")).toMatchObject({ tipId: "pci-lm-stent-expansion-limit", lessonId: "cp-left-main-technique" });
    // the stent is held at its limit: never wider than 4.5 mm
    expect(onA.profile.every((q) => q.d <= 4.5 + 1e-9)).toBe(true);
    // platform D's 3.5 mm stent is labelled to 5.5 mm: the same POT is within its limit and opens the left main further
    const onD = deploy(l, s, { ...stent, platformId: "D" }, pot, "IVUS");
    expect(onD.events.some((e) => e.kind === "stent-overdilated")).toBe(false);
    expect(onD.overexpansion).toBeNull();
    expect(onD.maxMalapposition).toBeLessThan(onA.maxMalapposition);
    expect(onD.score).toBeGreaterThan(onA.score);
  });

  it("only a platform whose limit reaches the left main suits the crossover stent sized to the LAD", () => {
    const l = L("lm-lad-crossover");
    const pre = preImaging(l, "IVUS");
    expect(pre.proxRefLumen).toBeCloseTo(4.8, 1);
    expect(pre.distRefLumen).toBeLessThan(3.5);
    expect(platformsReaching(3.5, pre.proxRefLumen).map((p) => p.id)).toEqual(["D"]);
  });
});

describe("geographic miss against the recorded predilatation (pm-prep-and-stent-deploy, Brilakis 10.2.3)", () => {
  // the focal LAD with its angiographic lesion between 14 and 22 mm, so that a 12-24 mm stent covers the lesion itself
  const base = L("focal-lad");
  const l: BenchLesion = { ...base, id: "focal-lad-short", startMm: 14, endMm: 22 };

  it("predilatation over 10-25 mm with a stent over 12-24 mm reports a geographic miss", () => {
    const s = prep(l, [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10, fromMm: 10, lengthMm: 15 }]);
    expect(injuredSegments(l, s)).toEqual([expect.objectContaining({ fromMm: 10, toMm: 25, cause: "predilatation" })]);
    const r = deploy(l, s, { diameter: 3.0, lengthMm: 12, proxEdge: 12, atm: 12 }, [], "IVUS");
    expect(r.x0).toBe(12);
    expect(r.x1).toBe(24);
    expect(r.geographicMiss).toBe(true);
    expect(r.injuredUncovered).toHaveLength(1);
    expect(crit(r, "Lesion and every injured segment covered")?.ok).toBe(false);
    expect(r.findings.find((f) => f.id === "injured-uncovered")?.tipId).toBe("pci-stent-cover-injured-segment");
    // the same stent without a recorded balloon covers the lesion: no miss
    const unrecorded = deploy(l, prep(l, [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]), { diameter: 3.0, lengthMm: 12, proxEdge: 12, atm: 12 }, [], "IVUS");
    expect(unrecorded.geographicMiss).toBe(false);
    // a stent from 9 to 27 mm covers the injured segment
    const covered = deploy(l, s, { diameter: 3.0, lengthMm: 18, proxEdge: 9, atm: 12 }, [], "IVUS");
    expect(covered.geographicMiss).toBe(false);
    expect(covered.injuredUncovered).toEqual([]);
  });

  it("taper-lad: the scenario's 28 mm predilatation (10-38 mm) must be covered; a 24 mm stent over the lesion misses it", () => {
    const t = L("taper-lad");
    const s = initialState();
    const short = deploy(t, s, { diameter: 3.0, lengthMm: 23, proxEdge: 12, atm: 12, rapidPacing: true }, [], "IVUS");
    expect(short.geographicMiss).toBe(true);
    const long = deploy(t, s, { diameter: 3.0, lengthMm: 33, proxEdge: 7, atm: 12, rapidPacing: true }, [], "IVUS");
    expect(long.geographicMiss).toBe(false);
  });

  it("an oversized balloon dissects and the dissection lengthens the segment the stent must cover (small vessel)", () => {
    const sv = L("small-distal-225");
    const ok = prep(sv, [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.0, atm: 8, fromMm: 11, lengthMm: 8 }]);
    expect(ok.events.some((e) => e.kind === "dissection")).toBe(false);
    const over = prep(sv, [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 10, fromMm: 11, lengthMm: 8 }]);
    expect(over.events.some((e) => e.kind === "dissection")).toBe(true);
    const diss = injuredSegments(sv, over).find((g) => g.cause === "dissection")!;
    expect(diss.toMm).toBeGreaterThan(19);
    // a stent that covers the lesion and the balloon but not the dissection misses
    const st: Stent = { diameter: 2.5, lengthMm: 12, proxEdge: 9, atm: 12 };
    expect(deploy(sv, ok, st, [], "IVUS").geographicMiss).toBe(false);
    expect(deploy(sv, over, st, [], "IVUS").geographicMiss).toBe(true);
  });
});

describe("injured segments are recorded only for a balloon whose segment was recorded", () => {
  it("an unrecorded oversized semi-compliant balloon on the picker's lesions records no segment and does not change the miss", () => {
    let dissected = 0;
    for (const l of BENCH_LESIONS) {
      const s = prep(l, [{ kind: "balloon", balloon: "semi-compliant", diameter: 4.0, atm: 10 }]);
      if (s.events.some((e) => e.kind === "dissection" && e.where === "lesion")) dissected++;
      expect(s.injured ?? []).toEqual([]);
      const r = deploy(l, s, { diameter: 3.0, lengthMm: l.endMm - l.startMm + 6, proxEdge: Math.max(0, l.startMm - 3), atm: 12 }, [], "IVUS");
      const lesionCovered = r.x0 <= l.startMm && r.x1 >= l.endMm;
      expect(r.geographicMiss).toBe(!lesionCovered);
      expect(crit(r, "Whole lesion covered")).toBeDefined();
    }
    // the probe is meaningful: the oversized balloon does dissect several of these lesions
    expect(dissected).toBeGreaterThan(0);
  });

  it("rotational atherectomy's penalty (labelled a dissection) records no injured segment", () => {
    const l = L("small-distal-225");
    const rota = prep(l, [{ kind: "rota", burrMm: 1.25 }]);
    expect(rota.events.some((e) => e.kind === "dissection")).toBe(true);
    expect(rota.injured ?? []).toEqual([]);
  });
});

describe("cardiac motion and rapid pacing", () => {
  it("a swinging stent lands displaced unless rapid pacing is chosen", () => {
    const t = L("taper-lad");
    const st: Stent = { diameter: 3.0, lengthMm: 28, proxEdge: 10, atm: 12 };
    const moving = deploy(t, initialState(), st, [], "IVUS");
    expect(moving.motionShiftMm).toBeGreaterThan(0);
    expect(moving.x0).toBeCloseTo(10 + moving.motionShiftMm, 6);
    expect(moving.geographicMiss).toBe(true);
    expect(crit(moving, "Deployed with the stent steady")?.ok).toBe(false);
    expect(moving.findings.some((f) => f.id === "deployed-moving" && f.tipId === "pci-stent-cardiac-motion")).toBe(true);
    const moved = moving.findings.find((x) => x.id === "deployed-moving")!;
    expect(moved.text).toContain("Deploy once the position is stable");
    expect(moved.text).not.toContain("Wait for a stable position");
    const paced = deploy(t, initialState(), { ...st, rapidPacing: true }, [], "IVUS");
    expect(paced.motionShiftMm).toBe(0);
    expect(paced.x0).toBe(10);
    expect(paced.geographicMiss).toBe(false);
    expect(crit(paced, "Deployed with the stent steady")?.ok).toBe(true);
    // a lesion that does not move is unaffected
    const f = deploy(L("focal-lad"), initialState(), { diameter: 3.0, lengthMm: 18, proxEdge: 10, atm: 12 }, [], "IVUS");
    expect(f.motionShiftMm).toBe(0);
    expect(f.criteria.some((c) => c.label.startsWith("Deployed with the stent steady"))).toBe(false);
  });
});

describe("the aorto-ostial bench: four failure modes (cp-ostial-troubleshoot, Brilakis 15.1.10)", () => {
  it("'ostial-rca-short' with the stent ending 1 mm distal to the ostium passes the angiographic check and fails IVUS coverage", () => {
    const l = L("ostial-rca-short");
    const ostium = l.ostial!.aortaMm;
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 15, proxEdge: ostium + 1, atm: 14 }, [], "IVUS");
    expect(r.ostial).toMatchObject({ gapMm: 1, ivusCovered: false, angiographicallyCovered: true });
    expect(r.ostiumCovered).toBe(false);
    const c = crit(r, "Ostium covered")!;
    expect(c.ok).toBe(false);
    expect(c.label).toContain("check angiogram looked complete");
    expect(r.findings.find((f) => f.id === "ostium-missed")?.tipId).toBe("pci-ostial-missed-ostium");
    // the stent placed by its proximal marker at the ostium on a platform whose stent lies inside the markers falls short
    const inside = deliveryLayout(PLATFORM_BY_ID.A.design, 15).edgeFromMarkerCentreMm;
    expect(inside).toBeGreaterThan(0.5);
    const byMarker = deploy(l, initialState(), { diameter: 3.5, lengthMm: 15, proxEdge: ostium + inside, atm: 14 }, [], "IVUS");
    expect(byMarker.ostial!.ivusCovered).toBe(false);
    expect(byMarker.ostial!.angiographicallyCovered).toBe(true);
    // covering the ostium with 1-2 mm in the aorta passes both
    const good = deploy(l, initialState(), { diameter: 3.5, lengthMm: 15, proxEdge: ostium - 1.5, atm: 14 }, [], "IVUS");
    expect(good.ostial).toMatchObject({ ivusCovered: true, angiographicallyCovered: true, overhang: false });
    expect(crit(good, "Ostium covered")?.ok).toBe(true);
    expect(crit(good, "Overhang into the aorta")?.ok).toBe(true);
    // well beyond the balloon shoulder the angiogram shows the gap too
    expect(deploy(l, initialState(), { diameter: 3.5, lengthMm: 12, proxEdge: ostium + 4, atm: 14 }, [], "IVUS").ostial!.angiographicallyCovered).toBe(false);
  });

  it("overhang: a swing towards the aorta leaves several millimetres in the aorta, which a flare corrects; rapid pacing prevents it", () => {
    const l = L("ostial-overhang");
    const ostium = l.ostial!.aortaMm;
    const st: Stent = { diameter: 3.5, lengthMm: 15, proxEdge: ostium - 1.5, atm: 14 };
    const r = deploy(l, initialState(), st, [], "IVUS");
    expect(r.ostial!.protrusionMm).toBeGreaterThan(2);
    expect(r.ostial!.overhang).toBe(true);
    expect(crit(r, "Overhang into the aorta")?.ok).toBe(false);
    expect(r.findings.find((f) => f.id === "overhang")?.tipId).toBe("pci-ostial-overhang-flare");
    const flared = deploy(l, initialState(), st, [{ diameter: 4.0, atm: 14, where: "flare" }], "IVUS");
    expect(flared.ostial!.flared).toBe(true);
    expect(crit(flared, "Overhang into the aorta")?.ok).toBe(true);
    const paced = deploy(l, initialState(), { ...st, rapidPacing: true }, [], "IVUS");
    expect(paced.ostial!.overhang).toBe(false);
  });

  it("an ostial flare with an oversized balloon, the taught technique, is not counted as overdilatation", () => {
    const l = L("ostial-overhang");
    const st: Stent = { diameter: 3.5, lengthMm: 15, proxEdge: l.ostial!.aortaMm - 1.5, atm: 14, platformId: "A" };
    expect(PLATFORM_BY_ID.A.limit(3.5)).toBeLessThan(5.0);
    const flared = deploy(l, initialState(), st, [{ diameter: 5.0, atm: 14, where: "flare" }], "IVUS");
    expect(flared.events.some((e) => e.kind === "stent-overdilated")).toBe(false);
    expect(flared.findings.some((f) => f.id === "overexpansion")).toBe(false);
    // the same balloon over the whole stent is still beyond the limit
    const full = deploy(l, initialState(), st, [{ diameter: 5.0, atm: 14, where: "full" }], "IVUS");
    expect(full.events.some((e) => e.kind === "stent-overdilated")).toBe(true);
  });

  it("the overhang criterion also applies to the measuring presets' aorto-ostial lesions", () => {
    for (const id of ["ostial-lm-ivus", "aorto-ostial-rca"]) {
      const l = L(id);
      expect(MEASURE_LESIONS).toContain(l);
      expect(l.ostial).toBeDefined();
      const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 15, proxEdge: l.ostial!.aortaMm - 1, atm: 14 }, [], "IVUS");
      expect(crit(r, "Overhang into the aorta")).toBeDefined();
      expect(crit(r, "Ostium covered")).toBeDefined();
    }
  });

  it("fibrotic ostium: direct stenting leaves a waist (underexpansion), which is not recoil; preparation opens it", () => {
    const l = L("ostial-fibrotic");
    const ostium = l.ostial!.aortaMm;
    const st: Stent = { diameter: 3.5, lengthMm: 15, proxEdge: ostium - 1.5, atm: 14, rapidPacing: true };
    const post: PostDil[] = [{ diameter: 3.75, atm: 18, where: "full" }];
    const direct = deploy(l, initialState(), st, post, "IVUS");
    expect(direct.underexpansion).toBe("waist");
    expect(direct.recoilMm).toBe(0);
    expect(direct.findings.some((f) => f.id === "underexpansion-waist" && f.tipId === "pci-ostial-stent-underexpanded")).toBe(true);
    expect(direct.findings.some((f) => f.id === "recoil")).toBe(false);
    const prepared = deploy(l, prep(l, [{ kind: "ivl", diameter: 3.5, cycles: 6 }, { kind: "balloon", balloon: "non-compliant", diameter: 3.5, atm: 18 }]), st, post, "IVUS");
    expect(prepared.expansion).toBeGreaterThan(direct.expansion + 10);
  });

  it("recoil: the stent opens and then loses diameter; a platform of strong radial strength holds it", () => {
    const l = L("ostial-recoil");
    const ostium = l.ostial!.aortaMm;
    const s = prep(l, [{ kind: "balloon", balloon: "non-compliant", diameter: 3.5, atm: 16 }]);
    const st: Stent = { diameter: 4.0, lengthMm: 12, proxEdge: ostium - 1.5, atm: 14 };
    const post: PostDil[] = [{ diameter: 4.5, atm: 16, where: "full" }];
    const standard = deploy(l, s, st, post, "IVUS");
    expect(standard.recoilMm).toBeGreaterThan(0.25);
    expect(standard.profile.some((q) => q.acuteD !== undefined && q.acuteD > q.d)).toBe(true);
    expect(crit(standard, "No acute recoil")?.ok).toBe(false);
    expect(standard.findings.find((f) => f.id === "recoil")?.tipId).toBe("pci-ostial-recoil");
    if (standard.underexpansion) expect(standard.underexpansion).toBe("recoil");
    // post-dilating again does not stop it recurring
    expect(deploy(l, s, st, [...post, ...post], "IVUS").recoilMm).toBeGreaterThan(0.25);
    const strong = deploy(l, s, { ...st, platformId: "E" }, post, "IVUS");
    expect(strong.recoilMm).toBeLessThan(standard.recoilMm / 2);
    expect(crit(strong, "No acute recoil")?.ok).toBe(true);
    expect(strong.score).toBeGreaterThan(standard.score);
  });
});

describe("small and ectatic vessels (cp-other-complex-vessel-size, Brilakis 22.3)", () => {
  it("small-distal-225: under 2.5 mm, smaller on angiography before nitrate, outward remodelling at the lesion, a DCB option", () => {
    const l = L("small-distal-225");
    const pre = preImaging(l, "IVUS");
    expect(pre.distRefLumen).toBeCloseTo(2.25, 2);
    expect(pre.distRefLumen).toBeLessThan(2.5);
    expect(angiographicReferenceMm(l, initialState())).toBeLessThan(angiographicReferenceMm(l, giveNitrate(initialState())));
    expect(angiographicReferenceMm(l, giveNitrate(initialState()))).toBeCloseTo(pre.distRefLumen, 2);
    // remodelling: the EEM at the lesion is larger than the references' EEM
    const mid = (l.startMm + l.endMm) / 2;
    expect(benchFrameAt(l, mid, "IVUS").frame.areas.eem).toBeGreaterThan(benchFrameAt(l, l.segmentMm, "IVUS").frame.areas.eem);
    expect(l.dcbOption).toBe(true);
    // atherectomy in the small, non-calcified vessel is penalised and says why
    const rota = prep(l, [{ kind: "rota", burrMm: 1.25 }]);
    expect(rota.events.some((e) => e.kind === "dissection" && e.text.includes("2.5 mm"))).toBe(true);
  });

  it("ectatic-rca: OCT frames in the large proximal vessel are not cleared, IVUS frames are; the proximal segment needs a limit that reaches it", () => {
    const l = L("ectatic-rca");
    expect(preImaging(l, "IVUS").proxRefLumen).toBeGreaterThanOrEqual(4.4);
    expect(lumen(l, 2)).toBeGreaterThan(4.0);
    expect(benchRegion(l, 2, "OCT")).toBe("uncleared");
    expect(benchFrameAt(l, 2, "OCT").lumenMeasurable).toBe(false);
    expect(benchRegion(l, 2, "IVUS")).toBe("vessel");
    expect(benchFrameAt(l, 2, "IVUS").lumenMeasurable).toBe(true);
    // distal frames clear on OCT
    expect(benchRegion(l, 45, "OCT")).toBe("vessel");
    // the existing lesions are unaffected
    for (const x of [...BENCH_LESIONS, ...MEASURE_LESIONS]) if (!x.ostial) expect(benchRegion(x, 1, "OCT")).toBe("vessel");
  });
});

describe("the platform presets", () => {
  it("are their own list, held in BENCH_BY_ID beside the picker's and the measuring presets", () => {
    expect(PLATFORM_LESIONS.map((l) => l.id).sort()).toEqual(
      ["ectatic-rca", "lm-lad-crossover", "ostial-fibrotic", "ostial-overhang", "ostial-recoil", "ostial-rca-short", "small-distal-225", "taper-lad"].sort()
    );
    for (const l of PLATFORM_LESIONS) {
      expect(BENCH_BY_ID[l.id]).toBe(l);
      expect(BENCH_LESIONS).not.toContain(l);
      expect(MEASURE_LESIONS).not.toContain(l);
      // the aorta proximal to an ostium carries no plaque; every coronary position has some
      for (let x = l.ostial ? l.ostial.aortaMm : 0; x <= l.segmentMm; x += 1) expect(lumen(l, x)).toBeLessThan(eem(l, x));
    }
  });

  it("a default run (no platform, no pacing) on the picker's lesions behaves as before: platform A, no shift, no new criteria", () => {
    for (const l of BENCH_LESIONS) {
      const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 18, proxEdge: Math.max(0, l.startMm - 3), atm: 12 }, [], "IVUS");
      expect(r.platformId).toBe("A");
      expect(r.motionShiftMm).toBe(0);
      expect(r.recoilMm).toBe(0);
      expect(r.criteria.some((c) => /recoil|steady|Overhang/.test(c.label))).toBe(false);
    }
  });

  it("each platform's design is the stent the frames show (strut thickness)", () => {
    const l = L("taper-lad");
    for (const id of ["A", "E"] as PlatformId[]) {
      const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 33, proxEdge: 7, atm: 12, platformId: id, rapidPacing: true }, [], "IVUS");
      expect(r.geom.design.strutMm).toBe(PLATFORM_BY_ID[id].design.strutMm);
    }
  });
});

describe("pre-run briefs give no measured size away", () => {
  it("the sizing presets' briefs name no vessel diameter or lesion length; the teaching after the run does", () => {
    for (const id of ["taper-lad", "lm-lad-crossover", "ectatic-rca"]) {
      const l = PLATFORM_LESIONS.find((x) => x.id === id)!;
      // only recorded history may carry a number: the predilatation balloon and its pullback positions
      const sizes = (l.brief.match(/\d+(\.\d+)?\s*mm/g) ?? []).filter((m) => !/^(10|28|38)\s*mm$/.test(m));
      expect(sizes, id).toEqual([]);
      expect(l.teaching, id).toMatch(/\d\.\d+ mm/);
    }
  });
});
