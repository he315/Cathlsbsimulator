import { describe, expect, it } from "vitest";
import { buildAnatomy } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { buildCoronaryTree } from "./coronaryTree";
import { heartShapes } from "./heartShape";
import { clockStateAt, motionAt } from "./heartMotion";
import { ANAT, MU, buildThorax, shapeContains } from "./thorax";
import { buildXrayScene } from "./sceneBuilder";
import {
  DEVICE_MODEL,
  DEVICE_MU,
  HELIUM_MU,
  deviceLandmarks,
  deviceTips,
  deviceTubes,
  ellipsoidRadius,
  frToRadiusMm,
  heartShiftFor,
  iabpInflationAt,
  venousCourse,
  type DeviceContext,
  type DeviceSpec,
  type DeviceTube,
} from "./deviceTubes";

const CASES = CASE_LIBRARY.slice(0, 4);

function ctxFor(i = 0, resp = 0): DeviceContext {
  const c = CASES[i];
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  return { heart: tree.heart, resp, seed: c.id };
}

const part = (tubes: DeviceTube[], name: string) => tubes.find((t) => t.part === name);
const ch = (t: DeviceTube, k: 0 | 1 | 2) => (Array.isArray(t.mu[0]) ? (t.mu as [number, number, number][])[0][k] : (t.mu as [number, number, number])[k]);
const last = <T,>(a: T[]) => a[a.length - 1];
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const ALL: DeviceSpec[] = [
  { kind: "iabp", tipBelowCarinaMm: 0, inflation: 1 },
  { kind: "microaxial-pump" },
  { kind: "ecmo" },
  { kind: "pacing-lead", route: "femoral", to: "rv-apex" },
  { kind: "pacing-lead", route: "rij", to: "rvot", advance: 0.5 },
  { kind: "rhc-catheter", route: "rij", to: "wedge" },
  { kind: "rhc-catheter", route: "left-subclavian", to: "pa", balloon: false },
  { kind: "pericardial", needleDepthMm: 80, wireMm: 90, sacContrast: 1 },
  { kind: "transseptal", stage: "tenting" },
];

describe("deviceTubes: IABP", () => {
  it("an IABP tip 2 cm below the carina yields a tube whose radio-opaque tip is at that height", () => {
    for (let i = 0; i < CASES.length; i++) {
      const ctx = ctxFor(i);
      const d = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: 20 }]);
      const marker = part(d.tubes, "tip marker")!;
      expect(marker).toBeTruthy();
      // the marker is the radio-opaque part: metal channel, far denser than the polymer shaft
      expect(ch(marker, 2)).toBeGreaterThan(1);
      expect(ch(part(d.tubes, "shaft")!, 2)).toBe(0);
      const tip = last(marker.pts);
      expect(tip.y).toBeCloseTo(d.landmarks.carina.y - 20, 1);
      expect(d.positions.iabp!.tipBelowCarinaMm).toBeCloseTo(20, 1);
      // the marker is the distal end of the catheter: nothing of the IABP lies above it
      for (const t of d.tubes) for (const p of t.pts) expect(p.y).toBeLessThanOrEqual(tip.y + 1e-6);
    }
  });

  it("the carina landmark is the bottom of the thorax's trachea, and the tip at carina level lies left of the spine's midline in the descending aorta", () => {
    const ctx = ctxFor(0);
    const L = deviceLandmarks(ctx);
    const th = buildThorax({ resp: 0, heart: ctx.heart, seed: ctx.seed });
    const tr = th.anat[ANAT.TRACHEA];
    expect(tr.c.y - tr.half[1]).toBeCloseTo(L.carina.y, 6);
    expect(tr.c.x).toBeCloseTo(L.carina.x, 6);
    const d = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: 0 }]);
    const tip = d.positions.iabp!.tip;
    expect(tip.y).toBeCloseTo(L.carina.y, 1);
    // projected over the left side of the vertebral column in AP (the descending aorta), behind the carina
    expect(tip.x).toBeGreaterThan(5);
    expect(tip.x).toBeLessThan(35);
    expect(tip.z).toBeLessThan(L.carina.z);
    // the left subclavian origin is above the carina: a tip at the carina is below it
    expect(d.positions.iabp!.tipBelowLeftSubclavianMm).toBeGreaterThan(0);
  });

  it("helium attenuates less than soft tissue: the inflated balloon is a negative excess, absent when deflated", () => {
    expect(HELIUM_MU).toBeLessThan(MU.soft);
    expect(DEVICE_MU.gasExcess).toBeLessThan(0);
    expect(DEVICE_MU.gasExcess).toBeCloseTo(HELIUM_MU - MU.soft, 12);
    const ctx = ctxFor(0);
    const on = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: 20, inflation: 1 }]);
    const gas = part(on.tubes, "balloon gas")!;
    expect(ch(gas, 0)).toBeLessThan(0);
    expect(Math.max(...gas.r)).toBeGreaterThan(frToRadiusMm(DEVICE_MODEL.iabp.fr) * 2);
    // the balloon holds about its nominal volume (40 mL) over its tapered length
    let vol = 0;
    for (let i = 1; i < gas.pts.length; i++) vol += Math.PI * ((gas.r[i] + gas.r[i - 1]) / 2) ** 2 * dist(gas.pts[i], gas.pts[i - 1]);
    expect(vol / 1000).toBeGreaterThan(36);
    expect(vol / 1000).toBeLessThan(44);
    const off = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: 20, inflation: 0 }]);
    expect(part(off.tubes, "balloon gas")).toBeUndefined();
    expect(Math.max(...part(off.tubes, "membrane")!.r)).toBeCloseTo(DEVICE_MODEL.iabp.foldedRadiusMm, 6);
    // the balloon lies below the tip, in the descending aorta
    const p = on.positions.iabp!;
    expect(p.balloonTop.y).toBeLessThan(p.tip.y);
    expect(p.balloonTop.y - p.balloonBottom.y).toBeGreaterThan(150);
  });

  it("from the left groin the IABP comes up the left iliac artery, its tip still at the requested height", () => {
    for (let i = 0; i < CASES.length; i++) {
      const d = deviceTubes(ctxFor(i), [{ kind: "iabp", tipBelowCarinaMm: 20, side: "left" }]);
      expect(part(d.tubes, "shaft")!.pts[0].x).toBeGreaterThan(0);
      expect(d.positions.iabp!.tipBelowCarinaMm).toBeCloseTo(20, 1);
      expect(d.positions.iabp!.clamped).toBe(false);
      const r = deviceTubes(ctxFor(i), [{ kind: "iabp", tipBelowCarinaMm: 20 }]);
      expect(part(r.tubes, "shaft")!.pts[0].x).toBeLessThan(0);
    }
  });

  it("too high: a request above the arch apex advances the tip past the apex and past the left subclavian origin", () => {
    for (let i = 0; i < CASES.length; i++) {
      const ctx = ctxFor(i);
      const ok = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: 0 }]).positions.iabp!;
      expect(ok.tipPastLeftSubclavianMm).toBeLessThan(0);
      expect(ok.pastArchApexMm).toBe(0);
      const a = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: -40 }]).positions.iabp!;
      const b = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: -60 }]).positions.iabp!;
      expect(a.clamped).toBe(false);
      // the apex is about 22 mm above the carina: the excess height is run on along the arch
      expect(a.pastArchApexMm).toBeGreaterThan(10);
      expect(b.pastArchApexMm).toBeCloseTo(a.pastArchApexMm + 20, 1);
      expect(a.tipPastLeftSubclavianMm).toBeGreaterThan(a.pastArchApexMm);
      // the tip is now on the far side of the arch: it no longer rises, it comes down towards the ascending aorta
      expect(b.tip.y).toBeLessThan(a.tip.y + 1e-6);
      expect(b.tip.z).toBeGreaterThan(a.tip.z);
      // far beyond the end of the course: clamped at the valve
      const c = deviceTubes(ctx, [{ kind: "iabp", tipBelowCarinaMm: -2000 }]).positions.iabp!;
      expect(c.clamped).toBe(true);
    }
  });

  it("counterpulsation from the clock: deflated in systole, inflated in diastole", () => {
    expect(iabpInflationAt({ tInBeat: 0.1, endSystole: 0.3, rr: 0.8 })).toBe(0);
    expect(iabpInflationAt({ tInBeat: 0.55, endSystole: 0.3, rr: 0.8 })).toBe(1);
    expect(iabpInflationAt({ tInBeat: 0.79, endSystole: 0.3, rr: 0.8 })).toBeLessThan(0.5);
  });
});

describe("deviceTubes: the other devices", () => {
  it("microaxial pump: inlet 3.5 cm below the valve inside the left ventricle, outlet and motor above the valve", () => {
    for (let i = 0; i < CASES.length; i++) {
      const d = deviceTubes(ctxFor(i), [{ kind: "microaxial-pump" }]);
      const p = d.positions.pump!;
      expect(p.inletBelowValveMm).toBeCloseTo(35, 6);
      expect(p.inletInLv).toBe(true);
      expect(p.outletAboveValveMm).toBeGreaterThan(5);
      expect(part(d.tubes, "motor")).toBeTruthy();
      expect(ch(part(d.tubes, "shaft")!, 0)).toBeGreaterThan(0);
      expect(part(d.tubes, "shaft")!.r[0]).toBeCloseTo(frToRadiusMm(9), 9);
    }
    const deep = deviceTubes(ctxFor(0), [{ kind: "microaxial-pump", inletBelowValveMm: 60 }]);
    expect(deep.positions.pump!.inletBelowValveMm).toBeCloseTo(60, 6);
  });

  it("microaxial pump: the inlet is not in the left ventricle at the valve plane, above it, or against the far wall", () => {
    for (let i = 0; i < CASES.length; i++) {
      const at = (mm: number) => deviceTubes(ctxFor(i), [{ kind: "microaxial-pump", inletBelowValveMm: mm }]).positions.pump!.inletInLv;
      expect(at(0)).toBe(false);
      expect(at(-10)).toBe(false);
      expect(at(5)).toBe(false);
      expect(at(35)).toBe(true);
      expect(at(110)).toBe(false);
    }
  });

  it("ECMO: the 25 Fr venous cannula tip is at the SVC-RA junction, which lies on the right atrium's surface", () => {
    for (let i = 0; i < CASES.length; i++) {
      const d = deviceTubes(ctxFor(i), [{ kind: "ecmo" }]);
      const L = d.landmarks;
      expect(ellipsoidRadius(L.ra, L.svcRaJunction)).toBeCloseTo(1, 3);
      expect(dist(d.positions.ecmo!.venousTip!, L.svcRaJunction)).toBeLessThan(2);
      expect(part(d.tubes, "venous cannula")!.r[0]).toBeCloseTo(frToRadiusMm(25), 9);
      expect(part(d.tubes, "arterial cannula")!.r[0]).toBeCloseTo(frToRadiusMm(17), 9);
      expect(d.positions.ecmo!.arterialTip!.y).toBeCloseTo(DEVICE_MODEL.ecmo.arterialTipY, -1);
    }
    const low = deviceTubes(ctxFor(0), [{ kind: "ecmo", venousTipMm: -20, arterial: false }]);
    expect(low.positions.ecmo!.venousTipToJunctionMm).toBeCloseTo(-20, 6);
    expect(ellipsoidRadius(low.landmarks.ra, low.positions.ecmo!.venousTip!)).toBeLessThan(1);
    expect(part(low.tubes, "arterial cannula")).toBeUndefined();
  });

  it("ECMO: the arterial cannula goes in the groin opposite the venous one, and the arterial tip is in the iliac artery", () => {
    for (let i = 0; i < CASES.length; i++) {
      const r = deviceTubes(ctxFor(i), [{ kind: "ecmo" }]);
      expect(part(r.tubes, "venous cannula")!.pts[0].x).toBeLessThan(0);
      expect(part(r.tubes, "arterial cannula")!.pts[0].x).toBeGreaterThan(0);
      const l = deviceTubes(ctxFor(i), [{ kind: "ecmo", side: "left" }]);
      expect(part(l.tubes, "venous cannula")!.pts[0].x).toBeGreaterThan(0);
      expect(part(l.tubes, "arterial cannula")!.pts[0].x).toBeLessThan(0);
      // the left-sided venous cannula still reaches the SVC-RA junction
      expect(dist(l.positions.ecmo!.venousTip!, l.landmarks.svcRaJunction)).toBeLessThan(2);
      // below the aortic bifurcation (the femoral course joins the aorta at y = -330) and off the midline
      for (const d of [r, l]) {
        const tip = d.positions.ecmo!.arterialTip!;
        expect(tip.y).toBeLessThan(-330);
        expect(Math.abs(tip.x)).toBeGreaterThan(5);
      }
    }
  });

  it("the thorax-fixed landmarks stay inside the matching anatomy shapes of the thorax", () => {
    for (let i = 0; i < CASES.length; i++) {
      const ctx = ctxFor(i);
      const L = deviceLandmarks(ctx);
      const hs = heartShiftFor(0);
      const th = buildThorax({ resp: 0, heart: ctx.heart, seed: ctx.seed, heartShift: hs, heartShapes: heartShapes(ctx.heart).map((s) => ({ ...s, c: { x: s.c.x + hs.x, y: s.c.y + hs.y, z: s.c.z + hs.z } })) });
      const ra = th.anat[ANAT.RA];
      expect(dist(ra.c, L.ra.c)).toBeLessThan(1e-6);
      expect(shapeContains(th.anat[ANAT.SVC], L.stations["svc-high"])).toBe(true);
      expect(shapeContains(th.anat[ANAT.IVC], { x: (L.ivcRaJunction.x + L.ivcLow.x) / 2, y: (L.ivcRaJunction.y + L.ivcLow.y) / 2, z: (L.ivcRaJunction.z + L.ivcLow.z) / 2 })).toBe(true);
      expect(shapeContains(th.anat[ANAT.LA], L.stations.la)).toBe(true);
      expect(shapeContains(th.anat[ANAT.ASC_AORTA], { x: L.aorticValve.x + 1, y: L.aorticValve.y + 20, z: L.aorticValve.z })).toBe(true);
    }
  });

  it("pacing lead and right heart catheter follow the venous course of their route", () => {
    expect(venousCourse("femoral", "rv-apex")).toEqual(["femoral", "iliac", "ivc-low", "ivc", "ra", "rv-inflow", "rv-mid", "rv-apex"]);
    expect(venousCourse("rij", "wedge")).toEqual(["neck", "svc-high", "svc", "ra", "rv-inflow", "rvot", "pa", "rpa", "wedge"]);
    expect(venousCourse("left-subclavian", "ra")).toEqual(["subclavian", "innominate", "svc-high", "svc", "ra"]);
    const ctx = ctxFor(0);
    const d = deviceTubes(ctx, [{ kind: "pacing-lead", route: "femoral", to: "rv-apex" }]);
    expect(dist(d.positions.pacing!.tip, d.landmarks.stations["rv-apex"])).toBeLessThan(1e-6);
    expect(ch(part(d.tubes, "tip electrode")!, 2)).toBeGreaterThan(ch(part(d.tubes, "conductor")!, 2));
    // the coiled conductor is hollow: a metal tube and an empty core on the same points (as hardware.ts leads)
    const cond = part(d.tubes, "conductor")!;
    const core = part(d.tubes, "conductor core")!;
    expect(core.pts).toBe(cond.pts);
    expect(ch(core, 2)).toBeCloseTo(-ch(cond, 2), 12);
    expect(core.r[0] / cond.r[0]).toBeCloseTo(DEVICE_MODEL.lead.conductorInner, 9);
    const half = deviceTubes(ctx, [{ kind: "pacing-lead", route: "femoral", to: "rv-apex", advance: 0.5 }]);
    const L = half.landmarks.stations;
    const mid = { x: (L["rv-mid"].x + L["rv-apex"].x) / 2, y: (L["rv-mid"].y + L["rv-apex"].y) / 2, z: (L["rv-mid"].z + L["rv-apex"].z) / 2 };
    expect(dist(half.positions.pacing!.tip, mid)).toBeLessThan(1e-6);
    const w = deviceTubes(ctx, [{ kind: "rhc-catheter", route: "rij", to: "wedge" }]);
    expect(w.positions.rhc!.course).toContain("pa");
    expect(ch(part(w.tubes, "balloon gas")!, 0)).toBeLessThan(0);
    const flat = deviceTubes(ctx, [{ kind: "rhc-catheter", route: "rij", to: "wedge", balloon: false }]);
    expect(part(flat.tubes, "balloon gas")).toBeUndefined();
  });

  it("pericardial needle, J wire and the contrast-outlined sac", () => {
    const ctx = ctxFor(0);
    const none = deviceTubes(ctx, [{ kind: "pericardial", needleDepthMm: 0 }]);
    expect(none.bones).toHaveLength(0);
    expect(none.tubes).toHaveLength(0);
    const p0 = none.positions.pericardial!;
    expect(p0.skinToSacMm).not.toBeNull();
    expect(p0.skinToEpicardiumMm! - p0.skinToSacMm!).toBeCloseTo(DEVICE_MODEL.pericardial.effusionMm, -0.5);
    // short of the sac, in it, beyond the epicardium
    const short = deviceTubes(ctx, [{ kind: "pericardial", needleDepthMm: p0.skinToSacMm! - 5 }]).positions.pericardial!;
    expect(short.tipInSac).toBe(false);
    const inSac = (p0.skinToSacMm! + p0.skinToEpicardiumMm!) / 2;
    const d = deviceTubes(ctx, [{ kind: "pericardial", needleDepthMm: inSac, wireMm: 100, sacContrast: 1 }]);
    const pp = d.positions.pericardial!;
    expect(pp.tipInSac).toBe(true);
    expect(pp.tipBeyondEpicardium).toBe(false);
    expect(pp.wireInSacMm).toBeGreaterThan(60);
    const deep = deviceTubes(ctx, [{ kind: "pericardial", needleDepthMm: p0.skinToEpicardiumMm! + 3 }]).positions.pericardial!;
    expect(deep.tipBeyondEpicardium).toBe(true);
    // the sac: an iodine shell (outer positive, inner the same negative), nothing in the soft or metal channel
    expect(d.bones).toHaveLength(2);
    expect(d.bones[0].muI!).toBeGreaterThan(0);
    expect(d.bones[1].muI!).toBeCloseTo(-d.bones[0].muI!, 12);
    expect(d.bones[0].mu).toBe(0);
    // the wire beyond the needle stays between the epicardium and the parietal layer
    const wire = part(d.tubes, "j wire")!;
    const inner = d.landmarks.pericardium;
    const outer = { ...inner, half: inner.half.map((h) => h + DEVICE_MODEL.pericardial.effusionMm) as [number, number, number] };
    // the points off the needle's track (the wire inside the needle runs along it)
    const needle = part(d.tubes, "needle")!;
    const a = needle.pts[0];
    const b = last(needle.pts);
    const offTrack = (q: { x: number; y: number; z: number }) => {
      const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const t = Math.max(0, Math.min(1, ((q.x - a.x) * ab.x + (q.y - a.y) * ab.y + (q.z - a.z) * ab.z) / (ab.x ** 2 + ab.y ** 2 + ab.z ** 2)));
      return dist(q, { x: a.x + ab.x * t, y: a.y + ab.y * t, z: a.z + ab.z * t });
    };
    const beyond = wire.pts.filter((q) => offTrack(q) > 1);
    expect(beyond.length).toBeGreaterThan(20);
    for (const q of beyond) {
      expect(ellipsoidRadius(inner, q)).toBeGreaterThan(1);
      expect(ellipsoidRadius(outer, q)).toBeLessThan(1.01);
    }
  });

  it("the pericardial needle's skin entry and direction are fixed in the body while the heart breathes under it", () => {
    const spec: DeviceSpec[] = [{ kind: "pericardial", needleDepthMm: 40 }];
    const a = part(deviceTubes(ctxFor(0, 0), spec).tubes, "needle")!;
    const b = part(deviceTubes(ctxFor(0, 1), spec).tubes, "needle")!;
    expect(dist(a.pts[0], b.pts[0])).toBeLessThan(1e-9);
    expect(dist(last(a.pts), last(b.pts))).toBeLessThan(1e-9);
    const sa = deviceTubes(ctxFor(0, 0), spec).positions.pericardial!.skinToSacMm!;
    const sb = deviceTubes(ctxFor(0, 1), spec).positions.pericardial!.skinToSacMm!;
    expect(Math.abs(sa - sb)).toBeGreaterThan(1);
  });

  it("a J wire passed into the sac stays in it while the patient breathes and the heart beats under the needle", () => {
    for (let i = 0; i < CASES.length; i++) {
      const base = ctxFor(i);
      const p0 = deviceTubes(base, [{ kind: "pericardial", needleDepthMm: 0 }]).positions.pericardial!;
      // the needle just inside the rest sac entry: breathing moves the instantaneous entry past the tip
      const spec: DeviceSpec[] = [{ kind: "pericardial", needleDepthMm: p0.skinToSacMm! + 2, wireMm: 120 }];
      let outsideFrames = 0;
      let minWire = Infinity;
      let maxWire = 0;
      for (let k = 0; k < 30; k++) {
        const resp = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / 30);
        const motion = motionAt(clockStateAt(k * 0.137, 72));
        const p = deviceTubes({ ...base, resp, motion }, spec).positions.pericardial!;
        if (!p.tipInSac) outsideFrames++;
        minWire = Math.min(minWire, p.wireInSacMm);
        maxWire = Math.max(maxWire, p.wireInSacMm);
      }
      if (i === 0) expect(outsideFrames).toBeGreaterThan(0); // the instantaneous check does see the sac move
      expect(minWire).toBeGreaterThan(60);
      expect(maxWire - minWire).toBeLessThan(15);
    }
    // a wire not passed into the sac (tip short of it at rest) runs on along the track in every frame
    const base = ctxFor(0);
    const p0 = deviceTubes(base, [{ kind: "pericardial", needleDepthMm: 0 }]).positions.pericardial!;
    for (const resp of [0, 0.5, 1]) {
      const p = deviceTubes({ ...base, resp }, [{ kind: "pericardial", needleDepthMm: p0.skinToSacMm! - 8, wireMm: 60 }]).positions.pericardial!;
      expect(p.wireInSacMm).toBe(0);
    }
    // the host's latch overrides the rest decision
    const latched = deviceTubes({ ...base, resp: 1 }, [{ kind: "pericardial", needleDepthMm: p0.skinToSacMm! - 3, wireMm: 100, wireInSac: true }]).positions.pericardial!;
    expect(latched.wireInSacMm).toBeGreaterThan(60);
    const unlatched = deviceTubes(base, [{ kind: "pericardial", needleDepthMm: p0.skinToSacMm! + 2, wireMm: 100, wireInSac: false }]).positions.pericardial!;
    expect(unlatched.wireInSacMm).toBe(0);
  });

  it("transseptal: the fossa lies on the right atrium's surface; tenting stays short of the left atrium, crossing enters it", () => {
    for (let i = 0; i < CASES.length; i++) {
      const ctx = ctxFor(i);
      const f = deviceTubes(ctx, [{ kind: "transseptal", stage: "fossa" }]);
      expect(ellipsoidRadius(f.landmarks.ra, f.landmarks.fossa)).toBeCloseTo(1, 3);
      expect(f.positions.transseptal!.tipToFossaMm).toBeCloseTo(0, 6);
      expect(deviceTubes(ctx, [{ kind: "transseptal", stage: "tenting" }]).positions.transseptal!.crossed).toBe(false);
      const x = deviceTubes(ctx, [{ kind: "transseptal", stage: "crossed" }]);
      expect(x.positions.transseptal!.crossed).toBe(true);
      expect(ellipsoidRadius(x.landmarks.la, x.positions.transseptal!.tip)).toBeLessThan(1);
      const hi = deviceTubes(ctx, [{ kind: "transseptal", stage: "svc" }]).positions.transseptal!.tip;
      expect(hi.y).toBeGreaterThan(f.landmarks.svcRaJunction.y + 20);
    }
  });
});

describe("deviceTubes: renderer inputs", () => {
  it("every device gives valid tubes (two or more finite points, positive radii, finite channels) in every case and breathing state", () => {
    for (let i = 0; i < CASES.length; i++)
      for (const resp of [0, 0.5, 1]) {
        const d = deviceTubes(ctxFor(i, resp), ALL);
        expect(d.tubes.length).toBeGreaterThan(30);
        for (const t of d.tubes) {
          expect(t.pts.length).toBeGreaterThanOrEqual(2);
          expect(t.r.length).toBe(t.pts.length);
          for (const p of t.pts) expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
          for (const r of t.r) expect(r).toBeGreaterThan(0);
          for (const k of [0, 1, 2] as const) expect(Number.isFinite(ch(t, k))).toBe(true);
        }
        // one position per device kind (the last device of a kind is reported)
        expect(deviceTips(d).length).toBe(7);
      }
  });

  it("is deterministic, and breathing moves the heart-anchored devices down with the diaphragm", () => {
    const a = deviceTubes(ctxFor(0, 0), ALL);
    const b = deviceTubes(ctxFor(0, 0), ALL);
    expect(JSON.stringify(a.tubes)).toBe(JSON.stringify(b.tubes));
    const insp = deviceTubes(ctxFor(0, 1), ALL);
    expect(insp.positions.pacing!.tip.y).toBeLessThan(a.positions.pacing!.tip.y - 20);
    // the carina does not move with the heart
    expect(insp.landmarks.carina).toEqual(a.landmarks.carina);
  });

  it("goes through buildXrayScene's public extras hook unchanged", () => {
    const c = CASES[0];
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const d = deviceTubes({ heart: tree.heart, resp: 0.3, seed: c.id }, [{ kind: "iabp", tipBelowCarinaMm: 0, inflation: 1 }]);
    const res = buildXrayScene({
      model,
      caseData: c,
      tree,
      catheterRoot: [],
      catheterNodes: [
        { x: 0, y: 3000, z: 0 },
        { x: 1, y: 3001, z: 0 },
      ],
      legacyCatheter: false,
      french: 6,
      bolus: null,
      t: 1,
      breathHold: 0.3,
      cArm: { laoRao: 0, cranialCaudal: 0 },
      mode: "fluoro",
      frame: 1,
      patientSeed: c.id,
      segments: false,
      extras: () => ({ tubes: d.tubes, bones: d.bones }),
    });
    for (const t of d.tubes) expect(res.scene.tubes).toContain(t);
  });
});
