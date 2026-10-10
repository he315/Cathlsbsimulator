import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catheterFamily } from "../../content/lab/tips";
import {
  BURR_SIZES_MM,
  CROSSING_WIRE_KINDS,
  DEVICES,
  DEVICE_BY_ID,
  DEVICE_EVENTS,
  EXTENSION_ID_IN,
  EXTENSION_ID_MM,
  GUIDES,
  GUIDE_BY_ID,
  GUIDE_FRENCH,
  GUIDE_LUMEN,
  NC_FRAC_PER_ATM,
  WIRE_SPEC,
  boxLabel,
  burrMinFrench,
  canTrapIn,
  chartDiameter,
  deviceFor,
  deviceImaging,
  deviceTipEvents,
  devicesOf,
  extensionInnerDiameterIn,
  fitsThrough,
  inflatable,
  laserMinFrench,
  lumenLeftMm,
  smallestGuideForMm,
  trappingBalloonFor,
  type DeviceClass,
  type DeviceSpec,
  type WireKind,
} from "./equipment";

/** Every lesson, case and quiz id written in the manual curriculum (the sources must point into it). */
function manualLessonIds(): Set<string> {
  const files = import.meta.glob<string>(["../../content/manual/*/*.ts", "!../../content/manual/**/*.test.ts"], { query: "?raw", import: "default", eager: true });
  const ids = new Set<string>();
  for (const text of Object.values(files)) for (const m of text.matchAll(/\bid: "([a-z0-9-]+)"/g)) ids.add(m[1]);
  return ids;
}

const hasProvenance = (x: { sources: string[]; modelParam: true | string[] }) => x.sources.length > 0 || x.modelParam === true || x.modelParam.length > 0;

describe("compliance charts", () => {
  const balloons = DEVICES.filter(inflatable);

  it("chartDiameter is monotone in pressure for every balloon, stent and covered stent at every size", () => {
    expect(balloons.length).toBeGreaterThanOrEqual(16);
    for (const spec of balloons) {
      for (const d of spec.diameters) {
        let prev = -Infinity;
        for (let atm = 0; atm <= spec.rbpAtm(d) + 4; atm += 0.25) {
          const mm = chartDiameter(spec, d, atm);
          expect(mm, `${spec.id} ${d} mm at ${atm} atm`).toBeGreaterThanOrEqual(prev - 1e-9);
          prev = mm;
        }
        // the label size is reached at nominal pressure (within the in vitro chart's rounding)
        expect(Math.abs(chartDiameter(spec, d, spec.nominalAtm(d)) - d), `${spec.id} ${d} mm at nominal`).toBeLessThan(0.08);
      }
    }
  });

  it("a non-compliant balloon grows less per atm than a semi-compliant one", () => {
    const perAtm = (spec: DeviceSpec, d: number) => (chartDiameter(spec, d, spec.rbpAtm(d)) - chartDiameter(spec, d, spec.nominalAtm(d))) / (spec.rbpAtm(d) - spec.nominalAtm(d));
    for (const d of [2.0, 2.5, 3.0, 3.5, 4.0]) expect(perAtm(DEVICE_BY_ID.nc, d)).toBeLessThan(perAtm(DEVICE_BY_ID.sc, d));
    expect(perAtm(DEVICE_BY_ID.nc, 3.0) / 3.0).toBeCloseTo(NC_FRAC_PER_ATM, 3);
    // the very-high-pressure balloon is a non-compliant design too
    expect(perAtm(DEVICE_BY_ID.vhp, 3.0)).toBeLessThan(perAtm(DEVICE_BY_ID.sc, 3.0));
  });

  it("the standard kinds still resolve to their original specs", () => {
    expect(deviceFor("balloon", "semi-compliant").id).toBe("sc");
    expect(deviceFor("balloon", "non-compliant").id).toBe("nc");
    expect(deviceFor("balloon", "scoring").id).toBe("scoring");
    expect(deviceFor("balloon", "ivl").id).toBe("ivl");
    expect(deviceFor("stent", "semi-compliant").id).toBe("des");
  });
});

describe("provenance", () => {
  const lessons = manualLessonIds();
  const checkSources = (what: string, sources: string[]) => {
    for (const s of sources) {
      if (s.startsWith("inherited: ")) continue;
      if (s.startsWith("docs/")) {
        const file = s.split(":")[0];
        expect(existsSync(join(__dirname, "../../..", file)), `${what}: ${file}`).toBe(true);
        continue;
      }
      const lesson = s.split(":")[0];
      expect(lessons.has(lesson), `${what}: source '${s}' names no lesson in src/content/manual`).toBe(true);
    }
  };

  it("every DeviceSpec has sources or modelParam, and each source names a lesson of the module text", () => {
    expect(lessons.size).toBeGreaterThan(200);
    expect(lessons.has("eq-balloons-stents-cart-specialty")).toBe(true);
    expect(lessons.has("no-such-lesson")).toBe(false);
    for (const d of DEVICES) {
      expect(hasProvenance(d), d.id).toBe(true);
      checkSources(d.id, d.sources);
    }
    for (const g of GUIDES) {
      expect(hasProvenance(g), g.id).toBe(true);
      checkSources(g.id, g.sources);
    }
    for (const [k, w] of Object.entries(WIRE_SPEC)) {
      expect(hasProvenance(w), k).toBe(true);
      checkSources(k, w.sources);
    }
  });

  it("ids are unique and the catalogue covers every class the requests name", () => {
    expect(new Set(DEVICES.map((d) => d.id)).size).toBe(DEVICES.length);
    const classes: DeviceClass[] = ["balloon", "stent", "covered-stent", "microcatheter", "extension", "aspiration", "ivus", "oct", "atherectomy", "laser", "snare", "embolic-protection", "coil", "re-entry"];
    for (const c of classes) expect(devicesOf(c).length, c).toBeGreaterThan(0);
    const types = new Set(devicesOf("balloon").map((d) => d.balloonType));
    for (const t of ["semi-compliant", "non-compliant", "scoring", "cutting", "ivl", "otw", "small", "dcb", "very-high-pressure", "trapping", "flaring"]) expect(types.has(t as never), t).toBe(true);
  });

  it("no product name reaches a label or note", () => {
    const brand = /\b(xience|promus|resolute|synergy|graftmaster|papyrus|pk papyrus|guideliner|guidezilla|telescope|trapliner|finecross|corsair|turnpike|caravel|tornus|venture|supercross|twin-pass|rotablator|rotapro|diamondback|elca|shockwave|angiosculpt|wolverine|scoreflex|opn|nc trek|emerge|sapphire|fielder|sion|pilot|gaia|confianza|wiggle|rg3|r350|filterwire|spider|stingray|crossboss|eaucath|launcher|mach 1|vista brite|heartrail)\b/i;
    for (const d of DEVICES) for (const t of [d.label, ...d.notes]) expect(brand.test(t), `${d.id}: ${t}`).toBe(false);
    for (const g of GUIDES) expect(brand.test(g.label + g.note), g.id).toBe(false);
    for (const w of Object.values(WIRE_SPEC)) expect(brand.test(w.label + w.note), w.label).toBe(false);
  });
});

describe("guide-size limits", () => {
  it("a 2.0 mm burr reports minimum guide 7 Fr; the burr limits follow Table 19.1", () => {
    const rota = DEVICE_BY_ID.rota;
    expect(rota.minFrench(2.0)).toBe(7);
    expect([...rota.diameters]).toEqual([...BURR_SIZES_MM]);
    for (const d of [1.25, 1.5, 1.75]) expect(rota.minFrench(d)).toBe(6);
    for (const d of [2.15, 2.25]) expect(rota.minFrench(d)).toBe(8);
    for (const d of [2.38, 2.5]) expect(rota.minFrench(d)).toBeNull();
    // and the stated limits agree with the guide lumens of Table 30.4 for every burr (the text starts at 6 Fr)
    for (const d of BURR_SIZES_MM) {
      const byLumen = smallestGuideForMm(d);
      expect(byLumen === null ? null : Math.max(6, byLumen), `${d} mm`).toBe(burrMinFrench(d));
    }
  });

  it("guide lumens are the Table 30.4 values and grow with French size", () => {
    expect([...GUIDE_FRENCH]).toEqual([5, 6, 7, 8]);
    expect(GUIDE_LUMEN[5].idIn).toEqual([0.058, 0.059]);
    expect(GUIDE_LUMEN[6].idIn).toEqual([0.07, 0.072]);
    expect(GUIDE_LUMEN[7].idIn).toEqual([0.081, 0.081]);
    expect(GUIDE_LUMEN[8].idIn).toEqual([0.09, 0.091]);
    for (let i = 1; i < GUIDE_FRENCH.length; i++) expect(GUIDE_LUMEN[GUIDE_FRENCH[i]].idMm[0]).toBeGreaterThan(GUIDE_LUMEN[GUIDE_FRENCH[i - 1]].idMm[1]);
  });

  it("extension inner diameters match Table 30.5, and the box prints them", () => {
    expect(EXTENSION_ID_IN).toEqual({ "5": [0.041, 0.046], "5.5": [0.051, 0.051], "6": [0.056, 0.057], "7": [0.062, 0.063], "8": [0.071, 0.072] });
    expect(EXTENSION_ID_MM).toEqual({ "5": [1.04, 1.17], "5.5": [1.3, 1.3], "6": [1.42, 1.45], "7": [1.57, 1.6], "8": [1.8, 1.83] });
    const ext = DEVICE_BY_ID.extension;
    expect(ext.diameters).toEqual([5, 5.5, 6, 7, 8]);
    expect(ext.lengths).toEqual([25, 40]);
    for (const fr of ext.diameters) expect(ext.innerDiameterIn!(fr)).toEqual(EXTENSION_ID_IN[String(fr)]);
    const label = boxLabel(ext, 6, 25);
    expect(label.size).toBe("6 Fr, 25 cm");
    expect(label.lines).toContainEqual({ k: "Inner diameter", v: "0.056–0.057 in" });
    // an 8 Fr extension leaves about a 6 Fr guide's bore; a 6 Fr extension less than a 5 Fr guide's
    expect(EXTENSION_ID_IN["8"][0]).toBeCloseTo(GUIDE_LUMEN[6].idIn[0] + 0.001, 3);
    expect(EXTENSION_ID_IN["6"][1]).toBeLessThan(GUIDE_LUMEN[5].idIn[0]);
  });

  it("what passes through an extension: the request's 1.5 mm burr through a 6 Fr extension in a 7 Fr guide cannot be loaded", () => {
    const rota = DEVICE_BY_ID.rota;
    expect(fitsThrough(rota, 1.5, 7, 6)).toBe(false);
    expect(fitsThrough(rota, 1.25, 7, 6)).toBe(true);
    expect(fitsThrough(rota, 1.5, 8, 7)).toBe(true);
    expect(fitsThrough(rota, 2.0, 6)).toBe(false);
    expect(fitsThrough(rota, 2.0, 7)).toBe(true);
    expect(fitsThrough(DEVICE_BY_ID.des, 3.0, 6, 6)).toBe(true);
    // an extension larger than the guide cannot go in
    expect(fitsThrough(DEVICE_BY_ID.des, 3.0, 6, 7)).toBe(false);
    // 7 Fr aspiration needs a 7 Fr guide
    expect(fitsThrough(DEVICE_BY_ID.aspiration, 7, 6)).toBe(false);
    expect(fitsThrough(DEVICE_BY_ID.aspiration, 6, 6)).toBe(true);
  });

  it("an extension size Table 30.5 does not list is never given another row's bore", () => {
    expect(lumenLeftMm(7, 6.5)).toBe(0);
    expect(fitsThrough(DEVICE_BY_ID.rota, 1.25, 7, 6.5)).toBe(false);
    expect(() => extensionInnerDiameterIn(6.5)).toThrow(/Table 30.5/);
    expect(() => DEVICE_BY_ID.extension.innerDiameterIn!(6.5)).toThrow();
    expect(DEVICE_BY_ID["extension-trap"].innerDiameterIn!(7)).toEqual(EXTENSION_ID_IN["7"]);
  });

  it("covered stents offer exactly the listed diameters, French sizes, pressure and shortening", () => {
    const sandwich = DEVICE_BY_ID.covered;
    const pu = DEVICE_BY_ID["covered-pu"];
    expect(devicesOf("covered-stent").map((d) => d.id)).toEqual(["covered", "covered-pu"]);
    expect(sandwich.diameters).toEqual([2.8, 3.5, 4.0, 4.5, 4.8]);
    expect(sandwich.lengths).toEqual([16, 19, 26]);
    expect(pu.diameters).toEqual([2.5, 3.0, 3.5, 4.0, 4.5, 5.0]);
    expect(pu.lengths).toEqual([15, 20, 26]);
    expect(sandwich.diameters.map(sandwich.minFrench)).toEqual([6, 6, 6, 7, 7]);
    expect(pu.diameters.map(pu.minFrench)).toEqual([5, 5, 5, 5, 6, 6]);
    for (const d of sandwich.diameters) expect(sandwich.nominalAtm(d)).toBeGreaterThanOrEqual(15);
    expect(sandwich.shorteningMmPerEnd).toBe(1.6);
    expect(sandwich.blockAndDeliverFrench).toBe(8);
    expect([2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((d) => pu.dilatationLimit!(d))).toEqual([3.5, 3.5, 4.65, 4.65, 5.63, 5.63]);
  });

  it("trapping: balloon sizes by guide, the deflectable microcatheter needs 8 Fr, the orbital crown 7 Fr and no standard extension", () => {
    expect(trappingBalloonFor(6)).toEqual([2.5]);
    expect(trappingBalloonFor(7)).toEqual([2.5, 3.0]);
    expect(trappingBalloonFor(8)).toEqual([3.0]);
    expect(canTrapIn(DEVICE_BY_ID["mc-deflectable"], 7)).toBe(false);
    expect(canTrapIn(DEVICE_BY_ID["mc-deflectable"], 8)).toBe(true);
    expect(canTrapIn(DEVICE_BY_ID["mc-large"], 6)).toBe(true);
    expect(canTrapIn(DEVICE_BY_ID.otw, 6)).toBe(false);
    expect(canTrapIn(DEVICE_BY_ID.reentry, 6)).toBe(false);
    const orbital = DEVICE_BY_ID.orbital;
    expect(canTrapIn(orbital, 6)).toBe(false);
    expect(canTrapIn(orbital, 7)).toBe(true);
    expect(canTrapIn(orbital, 8, { spec: DEVICE_BY_ID.extension, fr: 8 })).toBe(false);
    expect(canTrapIn(orbital, 8, { spec: DEVICE_BY_ID["extension-trap"], fr: 8 })).toBe(true);
  });

  it("microcatheters come in the five categories, 135 or 150 cm, over a 0.014 in. wire", () => {
    const kinds = devicesOf("microcatheter").map((d) => d.kind);
    expect(kinds).toEqual(["large", "small", "angulated", "deflectable", "dual-lumen", "plaque-modification"]);
    for (const m of devicesOf("microcatheter")) {
      expect(m.usableCmOptions).toEqual([135, 150]);
      expect(m.wireIn).toBe(0.014);
    }
    const pm = DEVICE_BY_ID["mc-plaque"];
    expect(pm.rotation).toEqual({ advance: "anticlockwise", maxTurns: 20 });
    expect(pm.contrastThroughLumen).toBe(false);
  });

  it("imaging catheters: rotational and phased-array IVUS and OCT, with the OCT hand-injection guide rule", () => {
    expect(deviceImaging(DEVICE_BY_ID.ivus)).toBe("ivus");
    expect(deviceImaging(DEVICE_BY_ID["ivus-phased"])).toBe("ivus");
    expect(deviceImaging(DEVICE_BY_ID.oct)).toBe("oct");
    expect(DEVICE_BY_ID.oct.imaging!.pullbackMmS).toEqual([18, 36]);
    expect(DEVICE_BY_ID.oct.imaging!.guideHandInjectionMinFrench).toBe(6);
    expect(DEVICE_BY_ID.ivus.profileMm(0)).toBeLessThan(DEVICE_BY_ID["ivus-phased"].profileMm(0));
    expect(deviceImaging(DEVICE_BY_ID.sc)).toBeUndefined();
  });

  it("laser 0.9 mm in 6 Fr; small balloons lose profile after one inflation; the cutting balloon inflates slowly", () => {
    expect(DEVICE_BY_ID.laser.diameters).toEqual([0.9, 1.4, 1.7, 2.0]);
    expect(DEVICE_BY_ID.laser.minFrench(0.9)).toBe(6);
    // larger catheters: smallest Table 30.4 lumen at least the catheter diameter, never below 6 Fr, null when none
    expect([1.4, 1.7, 2.0].map(laserMinFrench)).toEqual([6, 6, 7]);
    expect(laserMinFrench(2.4)).toBeNull();
    expect(DEVICE_BY_ID.small.diameters).toEqual([1.0, 1.25, 1.5]);
    expect(DEVICE_BY_ID.small.profileAfterInflation!).toBeGreaterThan(1);
    expect(DEVICE_BY_ID.cutting.maxInflateAtmPerS).toBeCloseTo(0.2, 6);
    expect(DEVICE_BY_ID.cutting.rbpAtm(3)).toBe(12);
    expect(DEVICE_BY_ID.vhp.rbpAtm(3)).toBe(35);
    expect(DEVICE_BY_ID["scoring-wire"].nominalAtm(0.6)).toBe(25);
    expect(DEVICE_BY_ID["scoring-wire"].rbpAtm(0.6)).toBe(30);
    // non-compliant balloons cross less well than semi-compliant ones
    expect(DEVICE_BY_ID.nc.profileMm(3)).toBeGreaterThan(DEVICE_BY_ID.sc.profileMm(3));
    expect(DEVICE_BY_ID.small.profileMm(1.0)).toBeLessThan(DEVICE_BY_ID.sc.profileMm(1.5));
  });

  it("drug-eluting stents 2.25-5.0 mm × 8-48 mm, with the 5.75 mm limit for the largest", () => {
    const des = DEVICE_BY_ID.des;
    expect(des.diameters[0]).toBe(2.25);
    expect(des.diameters[des.diameters.length - 1]).toBe(5.0);
    expect(des.lengths[0]).toBe(8);
    expect(des.lengths[des.lengths.length - 1]).toBe(48);
    expect(des.dilatationLimit!(5.0)).toBe(5.75);
    expect(des.dilatationLimit!(3.0)).toBe(3.5);
    // the 5.75 mm limit is sourced for the 5.0 mm stent only; its use for 4.5 mm is labelled
    expect(des.dilatationLimit!(4.5)).toBe(5.75);
    expect((des.modelParam as string[]).some((m) => /dilatationLimit for 4\.5 mm/.test(m))).toBe(true);
  });
});

describe("box label", () => {
  it("shows nominal, rated burst pressure and expiry for every class", () => {
    const classes = new Set(DEVICES.map((d) => d.cls));
    for (const cls of classes) {
      for (const spec of devicesOf(cls)) {
        const d = spec.diameters[0];
        const l = spec.lengths[0];
        const label = boxLabel(spec, d, l, { useBy: "2027-01-31" });
        const k = label.lines.map((x) => x.k);
        expect(k, spec.id).toContain("Use by");
        expect(label.lines).toContainEqual({ k: "Use by", v: "2027-01-31" });
        if (inflatable(spec)) {
          expect(label.lines, spec.id).toContainEqual({ k: "Nominal pressure", v: `${spec.nominalAtm(d)} atm` });
          expect(label.lines, spec.id).toContainEqual({ k: "Rated burst pressure", v: `${spec.rbpAtm(d)} atm` });
          expect(label.chart.atm.length, spec.id).toBeGreaterThan(0);
        } else {
          expect(k, spec.id).not.toContain("Rated burst pressure");
        }
        expect(k, spec.id).toContain("Guide");
      }
    }
  });

  it("expiry is a date on the box; whether it has passed is for the engine, not printed", () => {
    const fresh = boxLabel(DEVICE_BY_ID.covered, 3.5, 16, { useBy: "2027-01-31", today: "2026-10-08" });
    const old = boxLabel(DEVICE_BY_ID.covered, 3.5, 16, { useBy: "2026-09-30", today: "2026-10-08" });
    expect(fresh.expired).toBe(false);
    expect(old.expired).toBe(true);
    expect(old.lines.some((x) => /expired/i.test(x.v))).toBe(false);
    expect(boxLabel(DEVICE_BY_ID.sc, 2.5, 15).expired).toBe(false);
  });

  it("keeps the sizes and charts the indeflator and the bench read", () => {
    expect(boxLabel(DEVICE_BY_ID.des, 3.0, 18).size).toBe("3.00 × 18 mm");
    expect(boxLabel(DEVICE_BY_ID.des, 3.0, 18).chart.source).toBe("ifu");
    expect(boxLabel(DEVICE_BY_ID.rota, 1.5, 0).size).toBe("1.50 mm");
    expect(boxLabel(DEVICE_BY_ID.ivus, 0, 0).size).toBe("");
    expect(boxLabel(DEVICE_BY_ID.rota, 2.5, 0).lines).toContainEqual({ k: "Guide", v: "Larger than 8 F" });
    expect(boxLabel(DEVICE_BY_ID.cutting, 3.0, 10).lines).toContainEqual({ k: "Inflation", v: "No faster than 1 atm every 5 s" });
  });

  it("the guide line agrees with the catalogue's minimum, and the label chart note does not overstate its provenance", () => {
    for (const [spec, d, l] of [[DEVICE_BY_ID.sc, 2.5, 15], [DEVICE_BY_ID.des, 3.0, 18]] as const) {
      const label = boxLabel(spec, d, l);
      expect(label.lines).toContainEqual({ k: "Guide", v: `${spec.minFrench(d)} F or larger` });
      expect(label.lines.some((x) => /inner diameter at least/i.test(x.v))).toBe(false);
    }
    expect(boxLabel(DEVICE_BY_ID.des, 3.0, 18).chartNote).toMatch(/to be re-verified/);
    expect(boxLabel(DEVICE_BY_ID.sc, 2.5, 15).chartNote).toMatch(/Teaching model chart/);
  });
});

describe("wires and guides", () => {
  it("wire kinds cover Brilakis's seven categories, with externalisation at 330 cm and the pressure wire", () => {
    const cats = new Set(Object.values(WIRE_SPEC).map((w) => w.category));
    expect([...cats].sort()).toEqual(["atherectomy", "externalisation", "polymer-jacketed", "pressure", "stiff-tip", "support", "workhorse"]);
    expect(WIRE_SPEC.externalisation.lengthsCm).toContain(330);
    expect(WIRE_SPEC.atherectomy.lengthsCm).toEqual([330]);
    expect(WIRE_SPEC.pressure.sensorMm).toBe(30);
    expect(WIRE_SPEC.pressure.sources.some((x) => x.startsWith("pm-physiology-setup:"))).toBe(true);
    expect(WIRE_SPEC.pressure.sources.some((x) => x.startsWith("inherited:"))).toBe(false);
    // a live selector can offer only the kinds the module text lets cross a lesion
    expect(CROSSING_WIRE_KINDS).toContain("workhorse");
    for (const k of ["support-waved", "externalisation", "atherectomy"] as WireKind[]) expect(CROSSING_WIRE_KINDS).not.toContain(k);
    expect(WIRE_SPEC["support-waved"].crossing).toBe("no");
    expect(WIRE_SPEC.atherectomy.crossing).toBe("discouraged");
    // tip loads sit inside the sourced ranges
    expect(WIRE_SPEC.workhorse.tipLoadGf).toBeLessThanOrEqual(1);
    expect(WIRE_SPEC.polymer.tipLoadGf).toBeGreaterThanOrEqual(0.8);
    expect(WIRE_SPEC.polymer.tipLoadGf).toBeLessThanOrEqual(2.1);
    expect(WIRE_SPEC["polymer-tapered"].tipLoadGf).toBeGreaterThanOrEqual(1.7);
    expect(WIRE_SPEC["polymer-tapered"].tipLoadGf).toBeLessThanOrEqual(4.1);
    // polymer-jacketed and stiff tips injure more than a workhorse
    for (const k of ["polymer", "polymer-tapered", "cto"] as WireKind[]) expect(WIRE_SPEC[k].injuryFactor).toBeGreaterThan(WIRE_SPEC.workhorse.injuryFactor);
  });

  it("the guide list is the one the requests ask for, and every guide maps to a tip catheter family where one exists", () => {
    const ids = GUIDES.map((g) => g.id);
    for (const id of ["EBU3.0", "EBU3.5", "EBU3.75", "EBU4.0", "EBU4.5", "JL3.5", "JL4", "JL5", "AL1", "AL2", "AR1", "AR2", "JR4", "IKL", "IKR", "WR", "HS", "MP"]) expect(ids, id).toContain(id);
    expect(catheterFamily("EBU4.5")).toBe("EBU");
    expect(catheterFamily("JL5")).toBe("JL");
    expect(catheterFamily("AL2")).toBe("AL");
    expect(catheterFamily("AR2")).toBe("AR");
    expect(catheterFamily("IKL")).toBe("IKL");
    expect(catheterFamily("IKR")).toBe("IKR");
    expect(catheterFamily("MP")).toBe("MP");
    for (const g of GUIDES) if (catheterFamily(g.id)) expect(catheterFamily(g.id)).toBe(g.family);
  });

  it("guide back-up follows the sourced grading: extra-backup over Judkins left, Amplatz over Judkins right", () => {
    const left = GUIDES.filter((g) => g.family === "EBU");
    const jl = GUIDES.filter((g) => g.family === "JL");
    for (const e of left) for (const j of jl) expect(e.backupN).toBeGreaterThan(j.backupN);
    expect(GUIDE_BY_ID.AL1.backupN).toBeGreaterThan(GUIDE_BY_ID.JR4.backupN);
    expect(GUIDE_BY_ID.AR1.backupN).toBeGreaterThan(GUIDE_BY_ID.JR4.backupN);
    expect(GUIDE_BY_ID.HS.backupN).toBeGreaterThan(GUIDE_BY_ID.AR2.backupN);
    // Oxford's LAD grading puts AL2 between JL and EBU; on the RCA it ranks with AL1
    expect(GUIDE_BY_ID.AL2.backupN).toBeGreaterThan(GUIDE_BY_ID["JL3.5"].backupN);
    expect(GUIDE_BY_ID.AL2.backupN).toBeLessThan(GUIDE_BY_ID["EBU3.5"].backupN);
    expect(GUIDE_BY_ID.AL2.backupBySide!.right!).toBeGreaterThan(GUIDE_BY_ID.AR2.backupN);
  });
});

describe("tip vocabulary", () => {
  const on = (spec: DeviceSpec, extra: Partial<Parameters<typeof deviceTipEvents>[0]> = {}) => deviceTipEvents({ spec, diameter: spec.diameters[0], inArtery: true, active: true, ...extra });

  it("the device class and kind give the events the lab tips are written for", () => {
    expect(on(DEVICE_BY_ID.rota)).toContain("atherectomy-rotational");
    expect(on(DEVICE_BY_ID.orbital)).toContain("atherectomy-orbital");
    expect(on(DEVICE_BY_ID.laser)).toContain("laser-active");
    expect(on(DEVICE_BY_ID.ivl)).toContain("ivl-active");
    expect(on(DEVICE_BY_ID.extension)).toContain("extension-in-place");
    expect(on(DEVICE_BY_ID["epd-sheath"])).toContain("epd-deployed");
    expect(on(DEVICE_BY_ID["snare-coronary"])).toContain("snare-in-use");
    // nothing while the device is still in the guide, and atherectomy only while running
    expect(deviceTipEvents({ spec: DEVICE_BY_ID.rota, diameter: 1.5, inArtery: false, active: true })).toEqual([]);
    expect(on(DEVICE_BY_ID.rota, { active: false })).toEqual([]);
    expect(on(DEVICE_BY_ID.nc, { active: false, stalledAtLesion: true })).toEqual(["balloon-uncrossable"]);
    expect(on(DEVICE_BY_ID.nc, { atm: 20, waist: true, diameter: 3 })).toContain("balloon-undilatable");
    expect(on(DEVICE_BY_ID.nc, { atm: 16, waist: true, diameter: 3 })).not.toContain("balloon-undilatable");
    expect(on(DEVICE_BY_ID.des, { atm: 14, waist: true, diameter: 3 })).toContain("stent-underexpanded");
    // a stent still being inflated towards nominal is not yet underexpanded; after an earlier inflation it is
    expect(on(DEVICE_BY_ID.des, { atm: 4, waist: true, diameter: 3, inflatedBefore: false })).not.toContain("stent-underexpanded");
    expect(on(DEVICE_BY_ID.des, { atm: 0, active: false, waist: true, diameter: 3, inflatedBefore: true })).toContain("stent-underexpanded");
    for (const spec of DEVICES) for (const e of on(spec, { stalledAtLesion: true, waist: true, atm: 99 })) expect(DEVICE_EVENTS).toContain(e);
  });
});
