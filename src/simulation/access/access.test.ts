import { describe, it, expect } from "vitest";
import { buildAccessSite, entryVsHead, tubeAt, tubeRadii, SOURCED_SITE, MP_SITE } from "./site";
import { MP_MICRO, PunctureModel, microWireCourse, renderBMode, type BModeBuffer } from "./ultrasound";
import {
  RAO_OR,
  RAO_BASE,
  raoRisk,
  femoralRisk,
  bandStatus,
  radialThresholds,
  plethWithUlnarCompression,
  scheduleDelayed,
  easyGradeFromSize,
  SHEATHS,
  FEMORAL,
} from "./closure";
import { buildRoute3D, limbExtras, puffTubes, pointAt, siteToAortic, femoralHeadCentre, femoralSheathPolyline, markerPolylines, microWirePolyline, MP_LIMB } from "./route";
import { toWorld } from "../anatomy";
import { SCENARIO_BY_ID } from "../session/scenarios/index";
import { MP_FEMORAL_PUNCTURE } from "../session/caseSession";
import { generatePatient } from "../patient/patient";
import { generateCase } from "../caseGenerator";
import { buildAnatomy } from "../anatomy";

const profile = (seed: string | number) => generatePatient(seed);

describe("access site anatomy", () => {
  it("radial artery depth follows the sourced mean, calibre from the patient", () => {
    const depths: number[] = [];
    for (let i = 0; i < 200; i++) {
      const p = profile(i + 1);
      const s = buildAccessSite("radial-right", p);
      const a = s.tubes.find((t) => t.id === s.arteryId)!;
      expect(a.r).toBeCloseTo(p.radialDiamMm / 2, 6);
      depths.push(tubeAt(a, SOURCED_SITE.radialMeasureXMm).z - a.r);
    }
    const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
    expect(mean).toBeGreaterThan(3.6);
    expect(mean).toBeLessThan(5.2);
  });

  it("femoral bifurcation lies over the crease in about three quarters of patients", () => {
    let over = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const s = buildAccessSite("femoral", profile(`f${i}`));
      if ((s.landmarks.bifurcationX ?? 99) <= 10) over++;
      expect(s.landmarks.targetFrom).toBeLessThan(s.landmarks.targetTo);
      // the vein lies medial to the artery
      const a = s.tubes.find((t) => t.id === "cfa")!;
      const v = s.tubes.find((t) => t.id === "cfv")!;
      expect(tubeAt(v, 20).y).toBeLessThan(tubeAt(a, 20).y);
    }
    expect(Math.abs(over / N - SOURCED_SITE.bifurcationOverCreaseShare)).toBeLessThan(0.06);
  });

  it("veins collapse under probe pressure; arteries do not until it is firm", () => {
    const s = buildAccessSite("femoral", profile("comp"));
    const v = s.tubes.find((t) => t.id === "cfv")!;
    const a = s.tubes.find((t) => t.id === "cfa")!;
    expect(tubeRadii(v, 0.5, 0).rz).toBeLessThan(v.r * 0.1);
    expect(tubeRadii(a, 0.5, 0).rz).toBeGreaterThan(a.r * 0.9);
    // the artery pulsates
    expect(tubeRadii(a, 0, 0.12).ry).toBeGreaterThan(tubeRadii(a, 0, 0.8).ry);
  });
});

describe("needle physics", () => {
  const aim = (pm: PunctureModel, dy = 0, tubeId?: string) => {
    const t = pm.site.tubes.find((x) => x.id === (tubeId ?? pm.site.arteryId))!;
    const x = (pm.site.landmarks.targetFrom + pm.site.landmarks.targetTo) / 2;
    const c = tubeAt(t, x);
    const th = (pm.site.typicalAngleDeg * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y + dy, angleDeg: pm.site.typicalAngleDeg, yawDeg: 0 });
  };

  it("the near wall tents before it gives", () => {
    const pm = new PunctureModel(buildAccessSite("femoral", profile("tent")));
    aim(pm);
    let tented = false;
    for (let i = 0; i < 400 && pm.st.arterialPunctures === 0; i++) {
      const ev = pm.advanceNeedle(0.1);
      if (ev.some((e) => e.kind === "tenting")) tented = true;
      if (tented && pm.st.arterialPunctures === 0) expect(pm.flashback().kind).toBe("none");
    }
    expect(tented).toBe(true);
    expect(pm.st.arterialPunctures).toBe(1);
  });

  it("an off-centre hit rolls a small radial artery away", () => {
    const pm = new PunctureModel(buildAccessSite("radial-right", profile("roll")));
    const a = pm.site.tubes.find((t) => t.id === pm.site.arteryId)!;
    aim(pm, a.r * 0.85);
    const all = [];
    for (let i = 0; i < 200; i++) all.push(...pm.advanceNeedle(0.1));
    expect(all.some((e) => e.kind === "rolled")).toBe(true);
    expect(pm.st.arterialPunctures).toBe(0);
  });

  it("a needle in the femoral vein gives dark, non-pulsatile flashback", () => {
    const pm = new PunctureModel(buildAccessSite("femoral", profile("vein")));
    pm.probe.pressure = 0;
    aim(pm, 0, "cfv");
    let f = pm.flashback();
    for (let i = 0; i < 700 && f.kind === "none"; i++) {
      pm.advanceNeedle(0.1);
      f = pm.flashback();
    }
    expect(f.kind).toBe("venous");
    expect(pm.st.veinPunctures).toBe(1);
  });

  it("a puncture above the inguinal ligament is classed as high", () => {
    const site = buildAccessSite("femoral", profile("high"));
    const pm = new PunctureModel(site);
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const x = site.landmarks.ligamentX! + 10;
    const c = tubeAt(a, x);
    const th = (45 * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: 45, yawDeg: 0 });
    for (let i = 0; i < 800 && pm.flashback().kind !== "arterial"; i++) pm.advanceNeedle(0.1);
    pm.advanceNeedle(0.6);
    pm.advanceWire(20);
    expect(pm.st.wire?.state).toBe("intraluminal");
    expect(pm.arteriotomyClass()).toBe("high");
  });

  it("the needle cannot be redirected with the tip deep", () => {
    const pm = new PunctureModel(buildAccessSite("femoral", profile("redir")));
    aim(pm);
    // shallow: redirecting is allowed
    pm.advanceNeedle(1);
    expect(pm.redirect(50, 0).length).toBe(0);
    // deep below the fat: blocked
    const th = (pm.st.needle!.angleDeg * Math.PI) / 180;
    pm.advanceNeedle((pm.site.fatMm + 4) / Math.sin(th));
    const before = pm.st.needle!.angleDeg;
    const ev = pm.redirect(before + 10, 0);
    expect(ev.some((e) => e.kind === "redirect-blocked")).toBe(true);
    expect(pm.st.needle!.angleDeg).toBe(before);
  });
});

describe("B-mode", () => {
  const buf = (w = 192, h = 192): BModeBuffer => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
  const meanAt = (b: BModeBuffer, pm: PunctureModel, u: number, d: number, r = 0.4) => {
    let s = 0,
      n = 0;
    for (let j = 0; j < b.height; j++)
      for (let i = 0; i < b.width; i++) {
        const uu = ((i + 0.5) / b.width) * 38 - 19;
        const dd = ((j + 0.5) / b.height) * pm.probe.depthMm;
        if (Math.hypot(uu - u, dd - d) < r) {
          s += b.data[(j * b.width + i) * 4];
          n++;
        }
      }
    return n ? s / n : NaN;
  };

  it("draws an anechoic lumen with a brighter wall above it, and a vein that vanishes under pressure", () => {
    const site = buildAccessSite("femoral", profile("bmode"));
    const pm = new PunctureModel(site);
    pm.probe.pressure = 0;
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const v = site.tubes.find((t) => t.id === "cfv")!;
    const ca = tubeAt(a, pm.probe.x);
    const cv = tubeAt(v, pm.probe.x);
    const b = buf();
    renderBMode(pm, b);
    const lumen = meanAt(b, pm, ca.y - pm.probe.y, ca.z, a.r * 0.5);
    const tissue = meanAt(b, pm, ca.y - pm.probe.y + a.r + 8, ca.z, 1.5);
    expect(lumen).toBeLessThan(tissue * 0.5);
    const veinOpen = meanAt(b, pm, cv.y - pm.probe.y, cv.z, v.r * 0.4);
    pm.probe.pressure = 0.8;
    renderBMode(pm, b);
    const veinPressed = meanAt(b, pm, cv.y - pm.probe.y, cv.z, v.r * 0.4);
    expect(veinPressed).toBeGreaterThan(veinOpen + 20);
  });

  it("costs less than a frame budget at 256 x 256", () => {
    const pm = new PunctureModel(buildAccessSite("radial-right", profile("perf")));
    const b = buf(256, 256);
    renderBMode(pm, b);
    const t0 = performance.now();
    for (let k = 0; k < 10; k++) renderBMode(pm, b, { frame: k });
    const ms = (performance.now() - t0) / 10;
    // about 1.5 ms (radial) and 4.6 ms (femoral, 266 x 329) in isolation; generous for a loaded machine
    expect(ms).toBeLessThan(30);
  });
});

describe("closure and outcomes", () => {
  it("odds ratios reproduce the quoted trial arms", () => {
    expect(RAO_BASE.events / RAO_BASE.n).toBeCloseTo(0.0507, 3);
    expect(RAO_OR.occlusive).toBeCloseTo(2.63, 1);
    expect(RAO_OR.lowHeparin).toBeCloseTo(2.1, 1);
    expect(RAO_OR.sixHours).toBeCloseTo(2.34, 1);
    expect(RAO_OR.noHeparin).toBeGreaterThan(40);
    const ok = raoRisk({ heparinU: 5000, heparinUPerKg: 70, patentHaemostasis: true, bandHours: 2, arteryToSheath: 1.1, ulnarCompression: false, spasm: false, punctures: 1, warfarin: false });
    const bad = raoRisk({ heparinU: 0, heparinUPerKg: 0, patentHaemostasis: false, bandHours: 6, arteryToSheath: 0.8, ulnarCompression: false, spasm: true, punctures: 3, warfarin: false });
    expect(ok.probability).toBeLessThan(0.05);
    expect(bad.probability).toBeGreaterThan(0.8);
    expect(bad.terms.length).toBeGreaterThan(4);
  });

  it("the band has a patent-haemostasis window between bleeding and occlusion", () => {
    const th = radialThresholds({ map: 93, sys: 130, actS: 250, fr: 6 });
    let bleed = 0,
      patent = 0,
      occl = 0;
    for (let ml = 0; ml <= 20; ml += 0.5) {
      const st = bandStatus(ml, th, true);
      if (st.bleeding) bleed++;
      else if (st.radialFlow) patent++;
      else occl++;
    }
    expect(bleed).toBeGreaterThan(0);
    expect(patent).toBeGreaterThan(2);
    expect(occl).toBeGreaterThan(0);
    expect(plethWithUlnarCompression(bandStatus(20, th, true), false, th).cls).toBe("D");
    expect(plethWithUlnarCompression(null, true).cls).toBe("D");
  });

  it("femoral risk rises with ACT at sheath removal, short compression and a low puncture", () => {
    const base = { method: "manual" as const, actAtPullS: 150, minutes: 15, positionErrorMm: 0, stick: "ok" as const, backWalls: 0, fr: 6, anticoagulated: false, angiogramBeforeDevice: true };
    const r0 = femoralRisk(base);
    expect(femoralRisk({ ...base, actAtPullS: 320 }).largeHaematoma).toBeGreaterThan(r0.largeHaematoma);
    expect(femoralRisk({ ...base, minutes: 5 }).largeHaematoma).toBeGreaterThan(r0.largeHaematoma);
    expect(femoralRisk({ ...base, stick: "low" }).pseudoaneurysm).toBeGreaterThan(r0.pseudoaneurysm);
    expect(femoralRisk({ ...base, stick: "high" }).retroperitoneal).toBeGreaterThan(r0.retroperitoneal * 10);
    expect(FEMORAL.deviceFailure).toBeCloseTo(0.031, 5);
  });

  it("delayed events are deterministic per seed and present after closure", () => {
    const f = { largeHaematoma: 0, pseudoaneurysm: 0, avFistula: 0, retroperitoneal: 1, terms: [] };
    const a = scheduleDelayed({ route: "femoral", closedAtS: 1000, seed: "d1", femoral: f });
    const b = scheduleDelayed({ route: "femoral", closedAtS: 1000, seed: "d1", femoral: f });
    expect(a).toEqual(b);
    expect(a[0].kind).toBe("retroperitoneal-bleed");
    expect(a[0].atS).toBeGreaterThan(1000 + 29 * 60);
    expect(easyGradeFromSize(4, false, false)).toBe(1);
    expect(easyGradeFromSize(12, false, false)).toBe(3);
    expect(easyGradeFromSize(12, true, false)).toBe(4);
  });

  it("sheath outer diameters are the sourced values", () => {
    expect(SHEATHS["6"].odMm).toBe(2.67);
    expect(SHEATHS["7"].odMm).toBe(3.02);
    expect(SHEATHS["6-thin"].odMm).toBe(2.46);
  });
});

describe("3D route and limb anatomy", () => {
  it("builds the arm and pelvis anatomy and a contrast puff with finite geometry", () => {
    for (const acc of ["radial-right", "radial-left", "femoral"] as const) {
      const c = generateCase(`r3-${acc}`, { access: acc }, "rand");
      const m = buildAnatomy(c);
      const r = buildRoute3D(acc, c, m);
      const prims = limbExtras(r, m);
      expect(prims.length).toBeGreaterThan(5);
      for (const p of prims) for (const k of [p.c.x, p.c.y, p.c.z, ...p.half]) expect(Number.isFinite(k)).toBe(true);
      const puff = puffTubes(r, m, { strength: 1, lengthMm: 120, spasm: 0.5, mgPerMl: 175 });
      expect(puff[0].pts.length).toBeGreaterThan(2);
      expect(r.stations.length).toBeGreaterThanOrEqual(4);
      // stations run from the limb to the chest
      expect(r.stations[r.stations.length - 1].id).toBe("chest");
      expect(pointAt(r.path, 0).p.y).toBeLessThan(pointAt(r.path, r.aortaStart).p.y);
    }
  });
});


// ---------------------------------------------------------------------------
// access-femoral-puncture: landmarks, calcium, the plugged needle, the micro-wire course and the groin on fluoroscopy
// ---------------------------------------------------------------------------

describe("femoral puncture: site landmarks and overrides", () => {
  it("the depth presets set the CFA's near wall at the crease, and the fat follows", () => {
    for (const d of [20, 40]) {
      const s = buildAccessSite("femoral", profile(`depth-${d}`), { nearWallMm: d });
      const a = s.tubes.find((t) => t.id === "cfa")!;
      expect(tubeAt(a, 0).z - a.r).toBeCloseTo(d, 6);
      expect(s.fatMm).toBeCloseTo(d - MP_SITE.presetFasciaMm, 6);
      expect(s.depthMm).toBeGreaterThan(d + 2 * a.r);
    }
  });

  it("a site without the new overrides keeps its anatomy; the radial site has no calcium or branches", () => {
    const p = profile("fp-same");
    const a = buildAccessSite("femoral", p);
    expect(buildAccessSite("femoral", p, {})).toEqual(a);
    // golden values from the groin model as it stood before this package (same seed): no extra rng draw,
    // the femoral head where it was
    const cfa = a.tubes.find((t) => t.id === "cfa")!;
    expect(a.fatMm).toBeCloseTo(19.75, 9);
    expect(cfa.r).toBeCloseTo(4.699607483307891, 9);
    expect(cfa.zRef + cfa.dz * (0 - cfa.xRef)).toBeCloseTo(29.310059382078297, 9);
    expect(a.landmarks.ligamentX).toBe(59);
    expect(a.landmarks.bifurcationX).toBe(-4);
    expect([a.landmarks.headFrom, a.landmarks.headTo]).toEqual([3, 51]);
    expect(a.tubes.map((t) => t.id)).toEqual(["cfa", "sfa", "pfa", "cfv", "femoral-nerve"]);
    expect(a.typicalAngleDeg).toBe(45);
    expect(a.bones).toHaveLength(1);
    const head = a.bones[0];
    expect([head.kind, head.shape, head.xRef, head.yRef, head.r, head.xFrom, head.xTo]).toEqual(["femoral-head", "sphere", 27, 6, 24, 3, 51]);
    expect(head.zRef).toBeCloseTo(75.24966686538619, 9);
    expect(a.calcium).toEqual([]);
    expect(a.landmarks.headX).toBe(Math.round(a.landmarks.ligamentX! * 0.45));
    expect(a.branches.map((b) => b.id)).toEqual(["iea", "lcia"]);
    // the branches arise above the ligament, the IEA medially and the LCIA laterally
    const iea = a.branches[0];
    const lcia = a.branches[1];
    expect(iea.xFrom).toBeGreaterThan(a.landmarks.ligamentX!);
    expect(tubeAt(iea, iea.xFrom + 20).y).toBeLessThan(0);
    expect(tubeAt(lcia, lcia.xFrom + 20).y).toBeGreaterThan(0);
    const r = buildAccessSite("radial-right", p);
    expect(r.calcium).toEqual([]);
    expect(r.branches).toEqual([]);
  });

  it("a small CFA and an accessory profunda branch are scenario settings of the groin", () => {
    const p = profile("fp-acc");
    const plain = buildAccessSite("femoral", p, { headX: 30 });
    expect(plain.tubes.some((t) => t.id === "accessory-profunda")).toBe(false);
    const s = buildAccessSite("femoral", p, { headX: 30, accessoryProfunda: true, smallCfaMm: 6 });
    expect(s.tubes.find((t) => t.id === "cfa")!.r).toBeCloseTo(3, 6);
    const acc = s.tubes.find((t) => t.id === "accessory-profunda")!;
    expect(acc.kind).toBe("artery");
    // it leaves the lateral CFA wall over the head and runs distally, laterally
    expect(acc.xTo).toBeGreaterThan(s.landmarks.headFrom!);
    expect(acc.xTo).toBeLessThan(s.landmarks.headX!);
    expect(tubeAt(acc, acc.xTo - 20).y).toBeGreaterThan(tubeAt(acc, acc.xTo).y);
  });

  it("in 'fem-high-bif' the bifurcation lies within the head window and a puncture at the head centre is classified low", () => {
    const sc = SCENARIO_BY_ID["fem-high-bif"];
    expect(sc).toBeDefined();
    const site = buildAccessSite("femoral", profile("fp-high-bif"), sc.site);
    const lm = site.landmarks;
    expect(lm.bifurcationX!).toBeGreaterThanOrEqual(lm.headFrom!);
    expect(lm.bifurcationX!).toBeLessThanOrEqual(lm.headTo!);
    // aim at the CFA's centre line over the head centre
    const pm = new PunctureModel(site);
    pm.probe.pressure = 0;
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const x = lm.headX!;
    const c = tubeAt(a, x);
    const th = (45 * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: 45, yawDeg: 0 });
    for (let i = 0; i < 900 && pm.flashback().kind !== "arterial"; i++) pm.advanceNeedle(0.1);
    pm.advanceNeedle(0.6);
    pm.advanceWire(5);
    pm.advanceWire(20);
    expect(pm.st.wire?.state).toBe("intraluminal");
    expect(pm.arteriotomyClass()).toBe("low");
    expect(pm.st.arteriotomy!.x).toBeLessThan(lm.bifurcationX! + 3);
  });

  it("anterior-wall calcium narrows the window to the clear stretch, and a needle into it glances off without entering", () => {
    const p = profile("fp-calc");
    const site = buildAccessSite("femoral", p, { ligamentX: 66, headX: 30, bifurcationX: -4, calcium: [{ fromX: 26, toX: 50 }] });
    expect(site.landmarks.targetTo).toBeLessThanOrEqual(26);
    expect(site.landmarks.targetTo - site.landmarks.targetFrom).toBeGreaterThanOrEqual(MP_SITE.clearWindowMm);
    // aim into the calcified stretch
    const pm = new PunctureModel(site);
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const x = 38;
    const c = tubeAt(a, x);
    const th = (45 * Math.PI) / 180;
    const L = (c.z - a.r) / Math.sin(th);
    pm.placeNeedle({ entryX: x - (c.z / Math.sin(th)) * Math.cos(th), entryY: c.y, angleDeg: 45, yawDeg: 0 });
    const ev = [];
    for (let i = 0; i < 600; i++) ev.push(...pm.advanceNeedle(0.1));
    expect(L).toBeGreaterThan(0);
    expect(ev.some((e) => e.kind === "tenting")).toBe(true);
    expect(ev.some((e) => e.kind === "deflected")).toBe(true);
    expect(pm.st.arterialPunctures).toBe(0);
    // the same pass over the clear stretch enters the artery
    const pm2 = new PunctureModel(site);
    const x2 = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
    const c2 = tubeAt(a, x2);
    pm2.placeNeedle({ entryX: x2 - (c2.z / Math.sin(th)) * Math.cos(th), entryY: c2.y, angleDeg: 45, yawDeg: 0 });
    for (let i = 0; i < 600 && pm2.flashback().kind !== "arterial"; i++) pm2.advanceNeedle(0.1);
    expect(pm2.st.arterialPunctures).toBe(1);
  });

  it("glancing off calcium starts only the target's wall again: another vessel's wall state on the pass is kept", () => {
    const site = buildAccessSite("femoral", profile("fp-calc"), { ligamentX: 66, headX: 30, bifurcationX: -4, calcium: [{ fromX: 26, toX: 50 }] });
    const pm = new PunctureModel(site);
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const c = tubeAt(a, 38);
    const th = (45 * Math.PI) / 180;
    pm.placeNeedle({ entryX: 38 - (c.z / Math.sin(th)) * Math.cos(th), entryY: c.y, angleDeg: 45, yawDeg: 0 });
    pm.advanceNeedle(0.1);
    // the vein already entered on this pass (its walls holed)
    const vein = { frontTent: 0, frontHole: true, backTent: 0, backHole: true, roll: 0 };
    pm.st.walls.cfv = { ...vein };
    const ev = [];
    for (let i = 0; i < 600; i++) ev.push(...pm.advanceNeedle(0.1));
    expect(ev.some((e) => e.kind === "deflected")).toBe(true);
    expect(pm.st.walls.cfv).toEqual(vein);
    expect(pm.st.walls.cfa?.glanced).toBe(true);
    expect(pm.st.veinPunctures).toBe(0);
  });

  it("the steeper groin wire limit is for the common femoral artery only: a 65 degree needle in the vein meets 'steep' resistance", () => {
    const site = buildAccessSite("femoral", profile("fp-steep"), { ligamentX: 66, headX: 30, bifurcationX: -4 });
    const wireAt = (tubeId: string) => {
      const pm = new PunctureModel(site);
      pm.probe.pressure = 0;
      const t = site.tubes.find((x) => x.id === tubeId)!;
      const x = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
      const c = tubeAt(t, x);
      const th = (65 * Math.PI) / 180;
      pm.placeNeedle({ entryX: x - (c.z / Math.sin(th)) * Math.cos(th), entryY: c.y, angleDeg: 65, yawDeg: 0 });
      const want = tubeId === "cfv" ? "venous" : "arterial";
      for (let i = 0; i < 900 && pm.flashback().kind !== want; i++) pm.advanceNeedle(0.1);
      expect(pm.flashback().kind, tubeId).toBe(want);
      pm.advanceNeedle(0.4);
      return { pm, ev: pm.advanceWire(5) };
    };
    const v = wireAt("cfv");
    expect(v.ev.find((e) => e.kind === "wire-resistance")).toMatchObject({ kind: "wire-resistance", reason: "steep" });
    expect(v.pm.st.wire?.state).not.toBe("intraluminal");
    const a = wireAt("cfa");
    expect(a.ev.some((e) => e.kind === "wire-resistance")).toBe(false);
    expect(a.pm.st.wire?.state).toBe("intraluminal");
  });

  it("calcium shows as a bright anterior wall with an acoustic shadow beneath it", () => {
    const p = profile("fp-calc-b");
    const o = { ligamentX: 66, headX: 30, bifurcationX: -4 };
    const plain = new PunctureModel(buildAccessSite("femoral", p, o));
    const calc = new PunctureModel(buildAccessSite("femoral", p, { ...o, calcium: [{ fromX: 30, toX: 50 }] }));
    const W = 192,
      H = 192;
    const draw = (pm: PunctureModel) => {
      pm.probe.x = 40;
      pm.probe.pressure = 0;
      const a = pm.site.tubes.find((t) => t.id === "cfa")!;
      pm.probe.y = tubeAt(a, 40).y;
      const b: BModeBuffer = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
      renderBMode(pm, b);
      const c = tubeAt(a, 40);
      // the column through the artery's centre: the anterior wall and the tissue just below the back wall
      const col = Math.floor(W / 2);
      const at = (z: number) => b.data[(Math.min(H - 1, Math.floor((z / pm.probe.depthMm) * H)) * W + col) * 4];
      const band = (z0: number, z1: number) => {
        let s = 0,
          n = 0;
        for (let z = z0; z <= z1; z += 0.1) {
          s += at(z);
          n++;
        }
        return s / n;
      };
      return { wall: band(c.z - a.r - 1.2, c.z - a.r), below: band(c.z + a.r + 1.5, c.z + a.r + 5) };
    };
    const a = draw(plain);
    const b = draw(calc);
    expect(b.wall).toBeGreaterThan(a.wall);
    expect(b.below).toBeLessThan(a.below * 0.5);
  });
});

describe("femoral puncture: plugged needle and micro-wire course", () => {
  const aimAt = (pm: PunctureModel, x: number, o: { angle?: number; yaw?: number } = {}) => {
    const a = pm.site.tubes.find((t) => t.id === pm.site.arteryId)!;
    const c = tubeAt(a, x);
    const angle = o.angle ?? 45;
    const th = (angle * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: angle, yawDeg: o.yaw ?? 0 });
  };

  it("a plugged needle gives no flash with its tip in the lumen until it is taken out and flushed", () => {
    const site = buildAccessSite("femoral", profile("fp-plug"), { ligamentX: 66, headX: 30, bifurcationX: -4 });
    const pm = new PunctureModel(site);
    pm.probe.pressure = 0;
    pm.script({ needlePlugged: true });
    const x = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
    aimAt(pm, x);
    let f = pm.flashback();
    for (let i = 0; i < 900 && !(f.vessel && f.lumenFraction >= 0.8); i++) {
      pm.advanceNeedle(0.1);
      f = pm.flashback();
    }
    expect(pm.st.arterialPunctures).toBe(1);
    expect(f.kind).toBe("none");
    expect(f.plugged).toBe(true);
    // the wire will not pass a plugged needle
    expect(pm.advanceWire(5).some((e) => e.kind === "wire-resistance" && e.reason === "plugged")).toBe(true);
    pm.advanceWire(-5);
    expect(pm.flushNeedle()).toBe(true);
    expect(pm.st.needle!.inserted).toBe(0);
    for (let i = 0; i < 900 && pm.flashback().kind !== "arterial"; i++) pm.advanceNeedle(0.1);
    expect(pm.flashback().kind).toBe("arterial");
  });

  it("the course rule: high and medial into the IEA, high and lateral into the LCIA, steep near the bifurcation down the leg, else up the iliac", () => {
    const site = buildAccessSite("femoral", profile("fp-course"), { ligamentX: 60, headX: 28, bifurcationX: 10, ieaOriginX: 50, lciaOriginX: 52 });
    const high = { x: 50 - MP_MICRO.branchReachMm + 5, vessel: "cfa" };
    expect(microWireCourse(site, high, { angleDeg: 45, yawDeg: -MP_MICRO.branchYawDeg - 1 })).toBe("iea");
    expect(microWireCourse(site, high, { angleDeg: 45, yawDeg: MP_MICRO.branchYawDeg + 1 })).toBe("lcia");
    expect(microWireCourse(site, high, { angleDeg: 45, yawDeg: 0 })).toBe("iliac");
    // far below the branch origins, a medial aim stays in the artery
    expect(microWireCourse(site, { x: 12, vessel: "cfa" }, { angleDeg: 45, yawDeg: -10 })).toBe("iliac");
    expect(microWireCourse(site, { x: 14, vessel: "cfa" }, { angleDeg: MP_MICRO.downLegAngleDeg + 2, yawDeg: 0 })).toBe("down-leg");
    expect(microWireCourse(site, { x: 30, vessel: "cfa" }, { angleDeg: 45, yawDeg: 0 }, "iea")).toBe("iea");
    expect(microWireCourse(site, { x: 30, vessel: "cfv" }, { angleDeg: 45, yawDeg: 0 }, "iea")).toBeNull();
    expect(microWireCourse(buildAccessSite("radial-right", profile("fp-course")), { x: 20, vessel: "radial-artery" }, { angleDeg: 35, yawDeg: -10 })).toBeNull();
  });

  it("a scripted IEA course: the wire turns into the branch and stops; pulled back below the turn it goes up the artery", () => {
    const site = buildAccessSite("femoral", profile("fp-iea"), { ligamentX: 60, headX: 28, bifurcationX: -5, ieaOriginX: 50 });
    const pm = new PunctureModel(site);
    pm.probe.pressure = 0;
    pm.script({ microWireCourse: "iea" });
    aimAt(pm, 28);
    for (let i = 0; i < 900 && pm.flashback().kind !== "arterial"; i++) pm.advanceNeedle(0.1);
    pm.advanceNeedle(0.6);
    const ev = [...pm.advanceWire(5), ...pm.advanceWire(30)];
    expect(ev.some((e) => e.kind === "wire-course" && e.course === "iea")).toBe(true);
    expect(pm.wireMisdirected()).toBe(true);
    // on into the small branch: it runs a short way and stops
    const more = pm.advanceWire(40);
    expect(more.some((e) => e.kind === "wire-resistance" && e.reason === "branch")).toBe(true);
    // back below the turn and on again: up the artery (the script is spent)
    while (pm.wireMisdirected()) pm.advanceWire(-5);
    pm.advanceWire(40);
    expect(pm.st.wireCourse).toBe("iliac");
    expect(pm.wireMisdirected()).toBe(false);
    expect(pm.st.wire!.resistance).toBeLessThan(0.5);
  });
});

describe("femoral puncture: the groin on fluoroscopy", () => {
  const setup = (seed: string) => {
    const c = generateCase(seed, { access: "femoral" }, "rand");
    const m = buildAnatomy(c);
    const r = buildRoute3D("femoral", c, m);
    return { m, r };
  };
  const headPrim = (prims: ReturnType<typeof limbExtras>) => prims.find((p) => p.type === 0 && p.half[0] === MP_LIMB.femoralHeadR && p.mu > 0)!;

  it("limbExtras head centre moves with the site landmarks, not the sheath tip", () => {
    const { m, r } = setup("fp-head");
    const p = profile("fp-head");
    const s20 = buildAccessSite("femoral", p, { ligamentX: 66, headX: 20 });
    const s40 = buildAccessSite("femoral", p, { ligamentX: 66, headX: 40 });
    const h20 = headPrim(limbExtras(r, m, s20)).c;
    const h40 = headPrim(limbExtras(r, m, s40)).c;
    // 20 mm further up the limb, and nowhere near a fixed offset from the sheath tip
    expect(Math.hypot(h40.x - h20.x, h40.y - h20.y, h40.z - h20.z)).toBeCloseTo(20, 0);
    const w20 = toWorld(m, femoralHeadCentre(r, s20)!);
    expect(Math.hypot(w20.x - h20.x, w20.y - h20.y, w20.z - h20.z)).toBeLessThan(1e-6);
    // the route's start (the sheath tip) is MP_LIMB.sheathTipSiteX up the limb: the head lies at its own site x below it
    const tip = pointAt(r.path, 0).p;
    const c20 = femoralHeadCentre(r, s20)!;
    const head = s20.bones[0];
    const along = Math.hypot(tip.x - c20.x, tip.y - c20.y);
    expect(along).toBeGreaterThan(MP_LIMB.sheathTipSiteX - head.xRef - 8);
    expect(along).toBeLessThan(MP_LIMB.sheathTipSiteX - head.xRef + 8);
    // without a site the head stays where it was drawn before (under the sheath tip)
    const old = headPrim(limbExtras(r, m)).c;
    const want = toWorld(m, { x: tip.x, y: tip.y - 6, z: tip.z - 42 });
    expect(Math.hypot(old.x - want.x, old.y - want.y, old.z - want.z)).toBeLessThan(1e-6);
  });

  it("on an AP image the marker's tip at the head's lower edge lies on the lower edge of the head as drawn", () => {
    const { r } = setup("fp-mark");
    const site = buildAccessSite("femoral", profile("fp-mark"), { ligamentX: 66, headX: 30 });
    const c = femoralHeadCentre(r, site)!;
    const tip = markerPolylines(r, site, site.landmarks.headFrom!)[0][0];
    // AP: the image plane is x (across) and y (along the body); the head's lowest point is its centre less its radius in y
    expect(Math.hypot(tip.x - c.x, tip.y - (c.y - MP_LIMB.femoralHeadR))).toBeLessThan(MP_FEMORAL_PUNCTURE.markToleranceMm);
  });

  it("the sheath and the micro-wire are drawn from the arteriotomy at its own site x; the IEA course turns medially", () => {
    const { r } = setup("fp-wire");
    const site = buildAccessSite("femoral", profile("fp-wire"), { ligamentX: 60, headX: 28, bifurcationX: -5, ieaOriginX: 50 });
    const a = site.tubes.find((t) => t.id === "cfa")!;
    const ax = 24;
    const sh = femoralSheathPolyline(r, site, ax);
    const atAx = siteToAortic(r, site, { x: ax, y: tubeAt(a, ax).y, z: tubeAt(a, ax).z });
    expect(Math.hypot(sh[1].x - atAx.x, sh[1].y - atAx.y, sh[1].z - atAx.z)).toBeLessThan(1e-6);
    const up = microWirePolyline(r, site, ax, 40, "iliac");
    const iea = microWirePolyline(r, site, ax, 40, "iea");
    // up the artery the wire stays on the centre line; into the IEA its end lies medial of it (medial is -lateral)
    const endUp = up[up.length - 1];
    const endIea = iea[iea.length - 1];
    const medialShift = (endIea.x - endUp.x) * -r.lateral.x;
    expect(medialShift).toBeGreaterThan(3);
    const down = microWirePolyline(r, site, ax, 40, "down-leg");
    expect(down[down.length - 1].y).toBeLessThan(atAx.y);
    expect(entryVsHead(site, ax)).toBe("lower-half");
  });
});

// ---------------------------------------------------------------------------
// access-radial-sequence: the arm, the local anaesthetic bleb, the artery's tone at the needle, the needle tip,
// through-and-through, the tight loop and balloon-assisted tracking, and the forearm on fluoroscopy
// ---------------------------------------------------------------------------

import { MP_LOCAL, MP_NEEDLE, blebSquashAt } from "./ultrasound";
import { forearmAngioTubes, extravasationTubes, MP_EXTRAVASATION } from "./route";
import { buildRoute, initialWire, stepWire, tightenLoop, segmentAt, type WireState } from "../procedure";
import { SeededRng } from "../patient/rng";

describe("radial sequence: the arm and the bleb", () => {
  it("the arm's default suits the side; a neutral forearm carries the artery deeper and to the thumb side", () => {
    const p = profile("arm-1");
    const right = buildAccessSite("radial-right", p);
    const left = buildAccessSite("radial-left", p);
    expect(right.arm).toEqual({ position: "supinated", wristExtended: true, cannotSupinate: false });
    expect(left.arm?.position).toBe("across-body");
    const neutral = buildAccessSite("radial-right", p, { cannotSupinate: true });
    expect(neutral.arm).toEqual({ position: "neutral", wristExtended: true, cannotSupinate: true });
    const a = right.tubes.find((t) => t.id === right.arteryId)!;
    const n = neutral.tubes.find((t) => t.id === neutral.arteryId)!;
    expect(n.zRef - a.zRef).toBeCloseTo(MP_SITE.neutralDeeperMm, 6);
    expect(n.yRef - a.yRef).toBeCloseTo(MP_SITE.neutralLateralMm, 6);
    // a site built without the radial overrides is the same as before them (the other tubes and the bones too)
    expect(buildAccessSite("radial-right", p, { wristFlexed: true }).tubes).toEqual(right.tubes);
  });

  it("3 mL infiltrated at the wrist flattens the radial lumen where it was given; 1 mL does not; it recovers in 1-2 minutes and away from it", () => {
    const site = buildAccessSite("radial-right", profile("bleb-lumen"));
    const art = site.tubes.find((t) => t.id === site.arteryId)!;
    const rz = (ml: number, ageS: number, dx = 0) => {
      const pm = new PunctureModel(site);
      pm.nowS = 100;
      pm.infiltrate(ml, 100 - ageS);
      const sc = pm.lumenScale(art);
      return tubeRadii(art, pm.probe.pressure, 0.3, sc ? sc(pm.probe.x + dx) : null).rz;
    };
    const free = tubeRadii(art, 0.15, 0.3).rz;
    expect(rz(1, 0)).toBeCloseTo(free, 6);
    expect(rz(3, 0)).toBeLessThan(free * 0.6);
    expect(rz(3, 0)).toBeLessThan(rz(2, 0));
    // after 2 minutes the artery is back to nearly its size, and 30 mm along it was never pressed much
    expect(rz(3, 120)).toBeGreaterThan(free * 0.95);
    expect(rz(3, 0, 30)).toBeGreaterThan(free * 0.9);
    expect(blebSquashAt([{ x: 0, y: 0, ml: 3, at: 0 }], 0, 0)).toBeCloseTo((3 - MP_LOCAL.freeMl) * MP_LOCAL.squashPerMl, 6);
  });

  it("3 mL of local without waiting fails the first pass more often over a seed set than 1 mL (an operator's aim varies from pass to pass)", () => {
    // one first pass per patient: aimed at the artery's centre under the probe with a seeded scatter of angle and
    // entry (the operator's, a test setting), advanced until the flash, 0.6 mm more, then the wire fed in steps
    const firstPass = (seed: string, ml: number): boolean => {
      const site = buildAccessSite("radial-right", profile(seed));
      const pm = new PunctureModel(site);
      pm.nowS = 100;
      pm.infiltrate(ml, 100);
      const rng = new SeededRng(`aim:${seed}`);
      const art = site.tubes.find((t) => t.id === site.arteryId)!;
      const x = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
      const c = tubeAt(art, x);
      const ang = site.typicalAngleDeg + rng.normal(0, 4);
      const th = (ang * Math.PI) / 180;
      const L = (c.z + rng.normal(0, 0.5)) / Math.sin(th);
      pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y + rng.normal(0, 0.5), angleDeg: ang, yawDeg: 0 });
      let flash = false;
      for (let mm = 0; mm < pm.maxLength && !flash; mm += 0.2) {
        pm.advanceNeedle(0.2);
        flash = pm.flashback().kind === "arterial";
      }
      if (!flash) return false;
      pm.advanceNeedle(0.6);
      pm.advanceWire(1);
      pm.advanceWire(1);
      pm.advanceWire(30);
      return pm.st.wire?.state === "intraluminal";
    };
    let fail1 = 0;
    let fail3 = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      if (!firstPass(`bleb-seed-${i}`, 1)) fail1++;
      if (!firstPass(`bleb-seed-${i}`, 3)) fail3++;
    }
    expect(fail3).toBeGreaterThan(fail1);
    // and 1 mL leaves a first-pass rate of the order the lesson quotes with ultrasound (RAUST: 64.8%)
    expect(fail1 / N).toBeLessThan(0.5);
  });

  it("a flattened artery is transfixed with no flash on the way in; drawn back, the flash returns", () => {
    // a 2.2 mm artery under a fresh 3 mL bleb: flat enough to close under the tent, open enough to bleed
    const site = buildAccessSite("radial-right", profile("bleb-transfix"), { arteryRadiusMm: 1.1 });
    const pm = new PunctureModel(site);
    pm.nowS = 0;
    pm.infiltrate(3, 0);
    const art = site.tubes.find((t) => t.id === site.arteryId)!;
    const x = pm.probe.x;
    const c = tubeAt(art, x);
    const th = (35 * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: 35, yawDeg: 0 });
    let seen = false;
    for (let i = 0; i < 80 && !pm.st.walls[art.id]?.backHole; i++) {
      pm.advanceNeedle(0.2);
      seen ||= pm.flashback().kind === "arterial";
    }
    expect(pm.st.walls[art.id]?.backHole).toBe(true);
    expect(seen).toBe(false);
    let back = false;
    for (let i = 0; i < 40 && !back; i++) {
      pm.advanceNeedle(-0.1);
      back = pm.flashback().kind !== "none";
    }
    expect(back).toBe(true);
    expect(MP_NEEDLE.transfixReopenMm).toBeGreaterThan(0);
  });

  it("the artery's tone narrows the lumen the needle meets and slows the flash; a poor flash will not take the wire", () => {
    // a 2.8 mm artery: narrowed by its tone, still open enough not to close under the tent
    const site = buildAccessSite("radial-right", profile("tone-1"), { arteryRadiusMm: 1.4 });
    const aim = (pm: PunctureModel) => {
      const art = site.tubes.find((t) => t.id === site.arteryId)!;
      const x = pm.probe.x;
      const c = tubeAt(art, x);
      const th = (35 * Math.PI) / 180;
      const L = c.z / Math.sin(th);
      pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: 35, yawDeg: 0 });
      for (let i = 0; i < 200 && pm.flashback().kind === "none"; i++) pm.advanceNeedle(0.1);
      pm.advanceNeedle(0.5);
    };
    const relaxed = new PunctureModel(site);
    aim(relaxed);
    expect(relaxed.flashback().kind).toBe("arterial");
    expect(relaxed.flashback().slow).toBeFalsy();
    const slow = new PunctureModel(site);
    slow.spasm = 0.5;
    aim(slow);
    expect(slow.flashback()).toMatchObject({ kind: "arterial", slow: true });
    const poor = new PunctureModel(site);
    poor.spasm = 0.75;
    aim(poor);
    expect(poor.flashback().kind).toBe("sluggish");
    const ev = poor.advanceWire(1);
    expect(ev).toContainEqual({ kind: "wire-resistance", reason: "partial-bevel" });
  });
});

describe("radial sequence: the needle tip and through-and-through", () => {
  const ready = (o: { wristFlexed?: boolean; offY?: number } = {}) => {
    const site = buildAccessSite("radial-right", profile("tip-1"), { wristFlexed: o.wristFlexed });
    const pm = new PunctureModel(site);
    const art = site.tubes.find((t) => t.id === site.arteryId)!;
    const x = pm.probe.x;
    const c = tubeAt(art, x);
    const th = (35 * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    pm.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y + (o.offY ?? 0), angleDeg: 35, yawDeg: 0 });
    for (let i = 0; i < 200 && pm.flashback().kind !== "arterial"; i++) pm.advanceNeedle(0.1);
    pm.advanceNeedle(0.4);
    return { pm, art };
  };

  it("an unextended wrist stops the wire at the tip despite good blood; extended, it passes", () => {
    const { pm, art } = ready({ wristFlexed: true });
    expect(pm.flashback().kind).toBe("arterial");
    expect(pm.advanceWire(1)).toContainEqual({ kind: "wire-resistance", reason: "wrist-flexed" });
    pm.site.arm!.wristExtended = true;
    pm.advanceWire(1);
    expect(pm.st.wire?.state).toBe("intraluminal");
    expect(pm.st.arteriotomy?.vessel).toBe(art.id);
  });

  it("an entry through the side of the artery stops the wire until the bevel is turned towards the lumen", () => {
    const { pm } = ready({ offY: 0.6 });
    expect(Math.abs(pm.st.entryEcc ?? 0)).toBeGreaterThanOrEqual(MP_NEEDLE.bevelSideEcc);
    expect(pm.flashback().kind).toBe("arterial");
    expect(pm.advanceWire(1)).toContainEqual({ kind: "wire-resistance", reason: "bevel-side" });
    expect(pm.rotateBevel()).toBe(true);
    pm.advanceWire(1);
    expect(pm.st.wire?.state).toBe("intraluminal");
  });
});

describe("radial sequence: the tight loop and balloon-assisted tracking (procedure.ts rules)", () => {
  const loopRoute = () => {
    const c = generateCase("tight-loop", { access: "radial-right", forceVariants: ["radial-loop"] }, "rand");
    const r = buildRoute("radial-right", c);
    expect(tightenLoop(r)).toBe(true);
    return r;
  };
  const toLoop = (r: ReturnType<typeof buildRoute>, hydrophilic: boolean, bat = false, n = 400, seed = "loop"): WireState => {
    const rng = new SeededRng(seed);
    let w: WireState = initialWire();
    for (let i = 0; i < n; i++) {
      const { events: _e, ...next } = stepWire(w, r, { advance: 1.2, torque: 0.02, breath: false, hydrophilic, bat, vasodilator: 1, anxiety: 0, rand: rng.next() }, 0.033);
      w = next;
      if (w.perforation) break;
    }
    return w;
  };

  it("no 0.035 inch wire crosses a tight loop, aimed or hydrophilic; forcing the hydrophilic wire perforates there", () => {
    const r = loopRoute();
    const loop = r.segments.find((s) => s.id === "loop")!;
    const j = toLoop(r, false);
    expect(j.pos).toBeLessThan(loop.end);
    expect(j.perforation).toBe(false);
    const h = toLoop(r, true);
    expect(h.pos).toBeLessThan(loop.end);
    expect(h.perforation).toBe(true);
    expect(h.perforationS).toBeGreaterThan(loop.start - 15);
    expect(h.perforationS).toBeLessThan(loop.end);
  });

  it("balloon-assisted tracking crosses it without a perforation, even with a hydrophilic wire", () => {
    const r = loopRoute();
    const loop = r.segments.find((s) => s.id === "loop")!;
    const w = toLoop(r, true, true, 400);
    expect(w.pos).toBeGreaterThan(loop.end);
    expect(w.perforation).toBe(false);
    expect(segmentAt(r, w.pos).id).not.toBe("loop");
  });

  it("balloon-assisted tracking cannot perforate, even when spasm stops a hydrophilic wire at the loop", () => {
    const r = loopRoute();
    const loop = r.segments.find((s) => s.id === "loop")!;
    const at: WireState = { ...initialWire(), pos: loop.start + 1, spasm: 1 };
    for (const bat of [true, false]) {
      const out = stepWire(at, r, { advance: 1.2, torque: 0, breath: false, hydrophilic: true, bat, vasodilator: 0, anxiety: 0, rand: 0 }, 0.033);
      expect(out.pos, `bat ${bat}`).toBe(at.pos);
      expect(out.events.some((e) => e.kind === "perforation"), `bat ${bat}`).toBe(!bat);
    }
  });

  it("the artery's tone is a floor under the wire's spasm", () => {
    const r = loopRoute();
    const { spasm } = stepWire(initialWire(), r, { advance: 0, torque: 0, breath: false, hydrophilic: false, spasmFloor: 0.4, vasodilator: 1 }, 1);
    expect(spasm).toBeCloseTo(0.4, 6);
  });
});

describe("radial sequence: the forearm on fluoroscopy", () => {
  it("the forearm station holds a loop; the angiogram follows it and shows extravasation at an unsealed hole", () => {
    const c = generateCase("forearm-angio", { access: "radial-right", forceVariants: ["radial-loop"] }, "rand");
    const m = buildAnatomy(c);
    const r = buildRoute3D("radial-right", c, m);
    expect(r.stations[0].id).toBe("forearm");
    const loop = r.segments.find((s) => s.id === "loop")!;
    const centre = r.stations[0].c;
    // the loop lies within the forearm field (about 18 cm across at the patient)
    expect(Math.hypot(pointAt(r.path, (loop.start + loop.end) / 2).p.x - centre.x, pointAt(r.path, (loop.start + loop.end) / 2).p.y - centre.y)).toBeLessThan(90);
    const plain = forearmAngioTubes(r, m, { fromS: loop.start - 20, strength: 1, mgPerMl: 175, spasm: 0, aheadMm: 120, backMm: 10 });
    expect(plain).toHaveLength(1);
    const leak = forearmAngioTubes(r, m, { fromS: loop.start - 20, strength: 1, mgPerMl: 175, spasm: 0, aheadMm: 120, backMm: 10, perforationS: loop.start });
    expect(leak.length).toBeGreaterThan(plain.length);
    for (const t of leak) for (const p of t.pts) for (const k of [p.x, p.y, p.z]) expect(Number.isFinite(k)).toBe(true);
    // a hole outside the filled stretch is not shown, and the sheath puff shows one within its length
    expect(forearmAngioTubes(r, m, { fromS: 10, strength: 1, mgPerMl: 175, spasm: 0, aheadMm: 30, backMm: 0, perforationS: loop.start })).toHaveLength(1);
    expect(puffTubes(r, m, { strength: 1, lengthMm: 190, spasm: 0, mgPerMl: 175, perforationS: loop.start }).length).toBeGreaterThan(1);
    expect(extravasationTubes(r, m, { atS: loop.start, strength: 0, mgPerMl: 175 })).toEqual([]);
  });

  it("the extravasation blush spreads in the image plane (across the beam), not along it", () => {
    const c = generateCase("forearm-angio", { access: "radial-right", forceVariants: ["radial-loop"] }, "rand");
    const m = buildAnatomy(c);
    const r = buildRoute3D("radial-right", c, m);
    const loop = r.segments.find((s) => s.id === "loop")!;
    const blush = extravasationTubes(r, m, { atS: loop.start, strength: 1, mgPerMl: 280 });
    // a stain on the hole plus the tracks
    expect(blush).toHaveLength(MP_EXTRAVASATION.tracks + 1);
    const hole = blush[0].pts.reduce((a, p) => ({ x: a.x + p.x / 2, y: a.y + p.y / 2, z: a.z + p.z / 2 }), { x: 0, y: 0, z: 0 });
    expect(blush[0].r[0]).toBeGreaterThanOrEqual(2.5);
    for (const t of blush.slice(1)) {
      const e = t.pts[t.pts.length - 1];
      const dx = e.x - hole.x,
        dy = e.y - hole.y,
        dz = e.z - hole.z;
      const inPlane = Math.hypot(dx, dy);
      // most of each track's reach shows on the image
      expect(inPlane).toBeGreaterThan(0.8 * Math.hypot(dx, dy, dz));
      expect(inPlane).toBeGreaterThan(3);
    }
  });
});
