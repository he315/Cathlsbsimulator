import { describe, it, expect } from "vitest";
import type { CArm } from "../../types";
import { buildAnatomy } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import type { InjectionTrace } from "../../simulation/injection";
import type { LvWallState } from "../../simulation/patient/engine";
import { buildCoronaryTree } from "./coronaryTree";
import { makeHeart, V3 } from "./heart";
import { clockStateAt, motionAt, WALL_MOTION_SCALE } from "./heartMotion";
import { fitVentricles, heartShapes, heartChambers } from "./heartShape";
import { buildXrayScene, type SceneInput } from "./sceneBuilder";
import { XrayRenderer } from "./XrayRenderer";
import {
  ANOMALOUS_CX,
  cavityMeanChord,
  cavityProfile,
  cavityVolumeMl,
  ellipsoidMeanChord,
  iliofemoralExtras,
  laCavity,
  lvCavity,
  lvGramContrast,
  lvGramFrame,
  profileVolume,
  segmentAreaChange,
  segmentClasses,
  segmentsFromEngine,
  silhouetteEdges,
  viewDirection,
  LV_CAVITY,
  LV_PUFF,
  CAVITY_DRAW,
  cavityTubes,
  injectionPuff,
  isCavityGuide,
  sliceAt,
  type LvCavity,
  type LvGramSpec,
} from "./lvGram";

const H = makeHeart(1);
const HR = 70;
const RR = 60 / HR;
const RAO30: CArm = { laoRao: -30, cranialCaudal: 0 };
const LAO60CRA20: CArm = { laoRao: 60, cranialCaudal: 20 };
const LAO: CArm = { laoRao: 60, cranialCaudal: 0 };
const ES = clockStateAt(clockStateAt(0, HR).endSystole - 0.001, HR);
const ED = clockStateAt(RR - 0.0005, HR);
const mES = motionAt(ES, H);
const mED = motionAt(ED, H);

/** A power-injector style trace: `ml` of full-strength contrast at `rate` mL/s from 0.2 s after the press. */
function trace(ml: number, rate: number): InjectionTrace {
  const dt = 0.01;
  const end = 0.2 + ml / rate;
  const q = Array.from({ length: Math.ceil(12 / dt) }, (_, i) => (i * dt >= 0.2 && i * dt < end ? rate : 0));
  return { dt, q, c: q.map(() => 1), pushStart: 0.2, pushEnd: end, volumeMl: ml, contrastMl: ml, peakPsi: 0, side: "left", kind: "standard" };
}

const areaChange = (spec: LvGramSpec, view: CArm) => segmentAreaChange(lvCavity(H, mED, spec), lvCavity(H, mES, spec), view);

describe("LV cavity and segmental wall motion", () => {
  it("has a normal ejection fraction at a scale of 1, and the motion follows the patient clock", () => {
    const p = cavityProfile(H, {});
    const edv = cavityVolumeMl(p, 0),
      esv = cavityVolumeMl(p, 1);
    const ef = (100 * (edv - esv)) / edv;
    expect(edv).toBeGreaterThan(90);
    expect(edv).toBeLessThan(170);
    expect(ef).toBeGreaterThan(55);
    expect(ef).toBeLessThan(72);
    // lower LVEF, smaller excursion
    const p30 = cavityProfile(H, { ef: 30 });
    expect((cavityVolumeMl(p30, 0) - cavityVolumeMl(p30, 1)) / cavityVolumeMl(p30, 0)).toBeLessThan((edv - esv) / edv - 0.15);
    // end-diastole is the rest cavity; the cavity is inside the epicardial LV
    expect(lvCavity(H, mED).env).toBe(0);
    expect(lvCavity(H, mES).env).toBeGreaterThan(0.95);
    const lv = fitVentricles(H).lv;
    for (const s of lvCavity(H, undefined).slices) {
      const r = V3.sub(s.c, lv.c);
      const q = [0, 1, 2].reduce((a, i) => a + (V3.dot(r, lv.ax[i]) / lv.half[i]) ** 2, 0);
      expect(q).toBeLessThan(1);
    }
  });

  it("RAO 30 profiles the anterior and inferior walls; LAO 60 cranial 20 the septal and posterolateral walls", () => {
    const mid = (view: CArm) => silhouetteEdges(lvCavity(H, mED), view).find((e) => e.u > 0.4)!.edges.map((e) => e.wall).sort();
    expect(mid(RAO30)).toEqual(["anterior", "inferior"]);
    expect(mid(LAO60CRA20)).toEqual(["posterolateral", "septal"]);
  });

  it("an akinetic anterior segment's projected area change in RAO 30 is under 10% of a normal segment's; a dyskinetic one moves outward", () => {
    const normal = areaChange({}, RAO30);
    expect(normal.anterior!).toBeGreaterThan(150);
    const aki = areaChange({ segments: { anterior: "akinetic" } }, RAO30);
    expect(Math.abs(aki.anterior!)).toBeLessThan(0.1 * normal.anterior!);
    // the other walls keep their motion
    expect(aki.inferior!).toBeGreaterThan(0.9 * normal.inferior!);
    const dys = areaChange({ segments: { anterior: "dyskinetic" } }, RAO30);
    expect(dys.anterior!).toBeLessThan(0);
    // the anterior edge itself lies further out at end-systole than at end-diastole
    const edgeAt = (m: typeof mES) => silhouetteEdges(lvCavity(H, m, { segments: { anterior: "dyskinetic" } }), RAO30).find((e) => e.u > 0.4)!.edges.find((e) => e.wall === "anterior")!.d;
    expect(edgeAt(mES)).toBeGreaterThan(edgeAt(mED));
    // hypokinesis lies between
    const hypo = areaChange({ segments: { anterior: "hypokinetic" } }, RAO30);
    expect(hypo.anterior!).toBeGreaterThan(0.2 * normal.anterior!);
    expect(hypo.anterior!).toBeLessThan(0.7 * normal.anterior!);
  });

  it("an akinetic apex, an akinetic septum, and takotsubo ballooning", () => {
    const normal = areaChange({}, RAO30);
    const apical = areaChange({ segments: { apical: "akinetic" } }, RAO30);
    expect(Math.abs(apical.apical!)).toBeLessThan(0.15 * normal.apical!);
    const nL = areaChange({}, LAO60CRA20);
    const sep = areaChange({ segments: { septal: "akinetic" } }, LAO60CRA20);
    expect(Math.abs(sep.septal!)).toBeLessThan(0.15 * nL.septal!);
    expect(sep.posterolateral!).toBeGreaterThan(0.85 * nL.posterolateral!);
    const tako = areaChange({ takotsubo: true }, RAO30);
    expect(tako.apical!).toBeLessThan(0);
    expect(tako.anterior!).toBeGreaterThan(0);
    expect(segmentClasses({ takotsubo: true }).apical).toBe("dyskinetic");
  });

  it("the wall-motion classes keep their order", () => {
    expect(WALL_MOTION_SCALE.normal).toBeGreaterThan(WALL_MOTION_SCALE.hypokinetic);
    expect(WALL_MOTION_SCALE.hypokinetic).toBeGreaterThan(WALL_MOTION_SCALE.akinetic);
    expect(WALL_MOTION_SCALE.akinetic).toBeGreaterThan(WALL_MOTION_SCALE.dyskinetic);
    expect(segmentClasses({ segments: { inferior: "akinetic", anterior: 0.5 } })).toMatchObject({ inferior: "akinetic", anterior: "hypokinetic", septal: "normal" });
  });
});

/** LA and LV mean projected densities over a run (concentration times mean chord). */
function mrRun(grade: 1 | 2 | 3 | 4) {
  const spec: LvGramSpec = { mr: grade };
  const profile = cavityProfile(H, spec);
  const { la } = laCavity(H, undefined, spec);
  const laMl = ((4 / 3) * Math.PI * la.half[0] * la.half[1] * la.half[2]) / 1000;
  const chordLa = ellipsoidMeanChord(la, viewDirection(RAO30));
  const chordLv = cavityMeanChord(lvCavity(H, undefined, spec, profile), RAO30);
  const tr = trace(30, 12);
  const out: { t: number; lv: number; la: number; laC: number }[] = [];
  for (let t = 0.3; t < 10; t += 0.02) {
    const c = lvGramContrast({ profile, spec, trace: tr, site: "lv", t, clock: clockStateAt(t, HR), laMl });
    out.push({ t, lv: c.lv * chordLv, la: c.la * chordLa, laC: c.la });
  }
  return { out, pushEnd: tr.pushEnd! };
}
/** End-systolic LA/LV density ratios in the beats that follow the push. */
function lateRatios(r: ReturnType<typeof mrRun>) {
  return r.out.filter((x) => x.t > r.pushEnd + RR && x.t < r.pushEnd + 5 * RR && Math.abs(clockStateAt(x.t, HR).tInBeat - ES.tInBeat) < 0.011).map((x) => x.la / x.lv);
}
/** The LA's lowest over highest concentration within each beat after the push. */
function perBeatClearing(r: ReturnType<typeof mrRun>) {
  const out: number[] = [];
  for (let b = Math.ceil(r.pushEnd / RR) + 1; b < Math.ceil(r.pushEnd / RR) + 5; b++) {
    const seg = r.out.filter((x) => x.t >= b * RR && x.t < (b + 1) * RR).map((x) => x.laC);
    out.push(Math.min(...seg) / Math.max(...seg));
  }
  return out;
}

describe("mitral and aortic regurgitation (Oxford's density grades)", () => {
  it("MR grade III gives LA mean opacity close to the LV's; grade I clears each beat", () => {
    const g3 = lateRatios(mrRun(3));
    expect(g3.length).toBeGreaterThan(2);
    for (const r of g3) {
      expect(r).toBeGreaterThan(0.8);
      expect(r).toBeLessThan(1.25);
    }
    const r1 = mrRun(1);
    // minimal: well below the LV at its peak, and each beat empties most of what the beat put in
    expect(Math.max(...r1.out.map((x) => x.la)) / Math.max(...r1.out.map((x) => x.lv))).toBeLessThan(0.2);
    for (const k of perBeatClearing(r1)) expect(k).toBeLessThan(0.45);
  });

  it("grades rise in order, grade IV denser than the LV and grade II less dense", () => {
    const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    const g = ([1, 2, 3, 4] as const).map((k) => mean(lateRatios(mrRun(k))));
    expect(g[0]).toBeLessThan(g[1]);
    expect(g[1]).toBeLessThan(g[2]);
    expect(g[2]).toBeLessThan(g[3]);
    expect(g[1]).toBeLessThan(0.9);
    expect(g[3]).toBeGreaterThan(1.15);
  });

  it("AR: the LV fills from a root injection by grade (II less dense than the aorta, III equal, IV denser)", () => {
    const at = (grade: 1 | 2 | 3 | 4) => {
      const spec: LvGramSpec = { ar: grade };
      const profile = cavityProfile(H, spec);
      const chordLv = cavityMeanChord(lvCavity(H, undefined, spec, profile), LAO);
      const chordAo = (Math.PI / 4) * 30; // ascending aorta, 15 mm radius, seen side on
      const tr = trace(50, 20);
      let best = 0,
        ratio = 0;
      for (let t = 0.3; t < 10; t += 0.02) {
        const c = lvGramContrast({ profile, spec, trace: tr, site: "root", t, clock: clockStateAt(t, HR), laMl: 59 });
        if (c.lv * chordLv > best) {
          best = c.lv * chordLv;
          ratio = (c.lv * chordLv) / (c.aorta * chordAo);
        }
      }
      return ratio;
    };
    const r = ([1, 2, 3, 4] as const).map(at);
    expect(r[0]).toBeLessThan(0.3);
    expect(r[1]).toBeLessThan(0.8);
    expect(r[2]).toBeGreaterThan(0.8);
    expect(r[2]).toBeLessThan(1.25);
    expect(r[3]).toBeGreaterThan(1.25);
    // no AR: the LV stays clear on an aortogram
    const none = lvGramContrast({ profile: cavityProfile(H, {}), spec: {}, trace: trace(50, 20), site: "root", t: 2, clock: clockStateAt(2, HR), laMl: 59 });
    expect(none.lv).toBe(0);
    expect(none.aorta).toBeGreaterThan(0.05);
  });

  it("an ectopic beat and a catheter on the mitral apparatus add regurgitation", () => {
    const base = { profile: cavityProfile(H, { mr: 1 }), trace: trace(30, 12), site: "lv" as const, t: 3 + ES.tInBeat, clock: clockStateAt(3 + ES.tInBeat, HR), laMl: 59 };
    const a = lvGramContrast({ ...base, spec: { mr: 1 } });
    const b = lvGramContrast({ ...base, spec: { mr: 1, ectopic: true } });
    const c = lvGramContrast({ ...base, profile: cavityProfile(H, { mr: 1, catheterMr: true }), spec: { mr: 1, catheterMr: true } });
    expect(b.la).toBeGreaterThan(a.la * 1.3);
    expect(c.la).toBeGreaterThan(a.la * 2);
  });
});

describe("engine coupling", () => {
  /** LV regions in the six directions round the heart and one apical, Frank axes (x left, y inferior, z posterior). */
  function wall(isch: Partial<Record<"anterior" | "inferior" | "apical" | "lateral" | "septal", number>>, necrosis = 0): LvWallState {
    const toFrank = (p: { x: number; y: number; z: number }): [number, number, number] => {
      const n = V3.nrm(p);
      return [n.x, -n.y, -n.z];
    };
    const at = (phi: number, l = 0) => toFrank(V3.add(V3.sc(H.L, l), V3.add(V3.sc(H.A, Math.cos((phi * Math.PI) / 180)), V3.sc(H.S, Math.sin((phi * Math.PI) / 180)))));
    const reg = (name: keyof typeof isch, dir: [number, number, number], territory: "LAD" | "LCx" | "RCA") => ({ dir, territory, demand: 1, ischaemia: isch[name] ?? 0, necrosis: isch[name] ? necrosis : 0 });
    return {
      regions: [reg("anterior", at(45), "LAD"), reg("septal", at(-45), "LAD"), reg("lateral", at(135), "LCx"), reg("inferior", at(-135), "RCA"), reg("apical", at(0, 2), "LAD")],
      baselineEf: 60,
      ef: 55,
      ectopic: false,
    };
  }

  it("regional ischaemia and necrosis set the wall motion of the segments they point to", () => {
    const lad = segmentsFromEngine(H, wall({ anterior: 1, apical: 1 }));
    const cls = segmentClasses(lad);
    expect(cls.anterior).toBe("akinetic");
    expect(cls.apical).toBe("akinetic");
    expect(cls.inferior).toBe("normal");
    const inf = segmentClasses(segmentsFromEngine(H, wall({ inferior: 0.5 })));
    expect(inf.inferior).toBe("hypokinetic");
    expect(inf.anterior).toBe("normal");
    const aneurysm = segmentClasses(segmentsFromEngine(H, wall({ apical: 1 }, 1)));
    expect(aneurysm.apical).toBe("dyskinetic");
    // the case's spec keeps what the engine does not say
    expect(segmentsFromEngine(H, wall({}), { mr: 2, ef: 45 })).toMatchObject({ mr: 2, ef: 45 });
    expect(segmentsFromEngine(H, wall({})).ef).toBe(60);
  });
});

describe("findings and the aortogram", () => {
  const frame = (spec: LvGramSpec, site: "lv" | "root", t: number, m = mES) =>
    lvGramFrame({
      H,
      m,
      spec,
      trace: site === "lv" ? trace(30, 12) : trace(50, 20),
      site,
      t,
      clock: clockStateAt(t, HR),
      full: 0.2,
      sinusRadius: 16,
      toHeart: (p) => p,
      toAortic: (p) => p,
    });

  it("a ventriculogram fills the LV, the outflow tract and (by ejection) the aorta; no stain without one", () => {
    const f = frame({}, "lv", 2.5);
    expect(f.contrast.lv).toBeGreaterThan(0.05);
    expect(f.contrast.aorta).toBeGreaterThan(0.01);
    expect(f.contrast.la).toBe(0);
    expect(f.contrast.stain).toBe(0);
    // the sampling guide comes first and shares the cavity's points; the cavity follows it
    expect(isCavityGuide(f.tubes[0])).toBe(true);
    const cav = f.tubes[1];
    expect(f.tubes[0].pts).toBe(cav.pts);
    expect(cav.thin).toBeDefined();
    expect(cav.pts.length).toBeGreaterThan(CAVITY_DRAW.minSamples);
    expect(cav.pts.length).toBeLessThanOrEqual(CAVITY_DRAW.maxSamples + 1);
    // it tapers to the apex
    expect(cav.r[cav.r.length - 1]).toBeLessThan(0.1 * Math.max(...cav.r));
    expect(Math.max(...(cav.mu as [number, number, number][]).map((m) => m[1]))).toBeGreaterThan(0.01);
  });

  it("thrombus, stain with a pericardial crescent, VSD jet, grafts, the anomalous circumflex and AS each add their primitives", () => {
    const plain = frame({}, "lv", 2.5);
    const thr = frame({ thrombus: true }, "lv", 2.5);
    const defect = thr.bones.filter((b) => (b.muI ?? 0) < 0);
    expect(defect.length).toBe(1);
    // the defect lies inside the cavity near the apex
    const tip = thr.cavity.apex;
    expect(Math.hypot(defect[0].c.x - tip.x, defect[0].c.y - tip.y, defect[0].c.z - tip.z)).toBeLessThan(0.3 * thr.cavity.lengthMm);
    const st = frame({ stain: { segment: "inferior", pericardial: true } }, "lv", 2.5);
    expect(st.contrast.stain).toBeGreaterThan(0.3);
    expect(st.tubes.length).toBe(plain.tubes.length + 1); // the crescent
    expect(st.bones.length).toBe(plain.bones.length + 1); // the stain
    // the stain persists after the LV has cleared
    const late = frame({ stain: { segment: "inferior" } }, "lv", 11);
    expect(late.contrast.stain).toBeGreaterThan(5 * late.contrast.lv);
    const vsd = frame({ vsd: { site: "muscular" } }, "lv", 2.4 + ES.tInBeat * 0.5);
    expect(vsd.contrast.rv).toBeGreaterThan(0.005);
    const ao = frame({ graftStumps: 2, aorticStenosis: true, anomalousCx: true }, "root", RR + ES.tInBeat - 0.08, mES);
    expect(ao.contrast.ejecting).toBe(true);
    const metal = ao.tubes.filter((t) => !Array.isArray(t.mu[0]) && (t.mu as number[])[2] > 0);
    expect(metal.length).toBe(2);
    expect(ao.bones.some((b) => (b.muI ?? 0) < 0)).toBe(true); // domed valve
    expect(ao.tubes.some((t) => !Array.isArray(t.mu[0]) && (t.mu as number[])[1] < 0)).toBe(true); // systolic jet
  });

  it("the anomalous circumflex is seen end-on (a dot) behind the root in RAO 30, and as a line in LAO", () => {
    const d = viewDirection(RAO30);
    const seg = V3.sub(ANOMALOUS_CX[3], ANOMALOUS_CX[1]);
    const len = Math.hypot(seg.x, seg.y, seg.z);
    const inPlane = (dd: typeof d) => Math.hypot(seg.x - dd.x * V3.dot(seg, dd), seg.y - dd.y * V3.dot(seg, dd), seg.z - dd.z * V3.dot(seg, dd));
    expect(inPlane(d) / len).toBeLessThan(0.25);
    expect(inPlane(viewDirection(LAO)) / len).toBeGreaterThan(0.7);
    // behind the aortic root, not through it
    for (const p of ANOMALOUS_CX.slice(1, 4)) expect(Math.hypot(p.x, p.z)).toBeGreaterThan(16);
  });

  it("the left atrium of the ventriculogram sits where the heart silhouette draws it", () => {
    const { la } = laCavity(H, mES, {});
    const drawn = heartChambers(H, mES).la;
    expect(Math.hypot(la.c.x - drawn.c.x, la.c.y - drawn.c.y, la.c.z - drawn.c.z)).toBeLessThan(1e-9);
    expect(la.half[0]).toBeLessThan(drawn.half[0]);
  });

  it("the iliofemoral run fills both iliac axes from a pigtail above the bifurcation", () => {
    const c = CASE_LIBRARY[0];
    const model = buildAnatomy(c);
    const ex = iliofemoralExtras(model, trace(20, 20), 0.2);
    const before = ex(() => ({ x: 0, y: 0, z: 0 }), { bolusT: null, injecting: false });
    expect(before.tubes!.length).toBe(0);
    expect(before.bones!.length).toBe(3); // pelvis and both femoral heads
    const during = ex(() => ({ x: 0, y: 0, z: 0 }), { bolusT: 1.2, injecting: true });
    expect(during.tubes!.length).toBe(3);
    for (const t of during.tubes!) expect(Math.max(...(t.mu as [number, number, number][]).map((m) => m[1]))).toBeGreaterThan(0.01);
  });
});

describe("compartment integration, directions and the MR scheme", () => {
  it("successive frames advance the model to the same state as a fresh integration", () => {
    for (const spec of [{ mr: 2 }, { ar: 3 }, { vsd: { site: "muscular" } }] as LvGramSpec[]) {
      for (const site of ["lv", "root"] as const) {
        const profile = cavityProfile(H, spec);
        const tr = trace(30, 12);
        const at = (t: number, tt: InjectionTrace) => lvGramContrast({ profile, spec, trace: tt, site, t, clock: clockStateAt(t, HR), laMl: 59 });
        let last = at(0, tr);
        for (let i = 1; i <= 300; i++) last = at((i * 10) / 300, tr);
        const fresh = at(10, trace(30, 12));
        for (const k of ["lv", "pool", "la", "aorta", "rv"] as const) expect(Math.abs(last[k] - fresh[k])).toBeLessThan(1e-6);
        expect(last.ejecting).toBe(fresh.ejecting);
      }
    }
  });

  it("the volume curve is tabulated once per profile and matches the exact volume", () => {
    const p = cavityProfile(H, { mr: 3 });
    expect(cavityProfile(H, { mr: 3 })).toBe(p);
    for (const e of [0, 0.13, 0.5, 0.77, 1]) expect(Math.abs(profileVolume(p, e) - cavityVolumeMl(p, e))).toBeLessThan(0.05);
  });

  it("the stain builds from the whole push and persists beyond 30 s, clearing slowly", () => {
    const spec: LvGramSpec = { stain: { segment: "inferior" } };
    const profile = cavityProfile(H, spec);
    const tr = trace(30, 12);
    const at = (t: number) => lvGramContrast({ profile, spec, trace: tr, site: "lv", t, clock: clockStateAt(t, HR), laMl: 59 }).stain;
    const s20 = at(20);
    expect(s20).toBeGreaterThan(0.5);
    const s40 = at(40);
    expect(s40).toBeGreaterThan(0.9 * s20);
    expect(s40).toBeLessThan(s20);
  });

  it("directions turn with the aortic tilt: the cavity's thin axis stays across its long axis", () => {
    const th = (7 * Math.PI) / 180;
    const rot = (p: { x: number; y: number; z: number }) => V3.v(p.x * Math.cos(th) - p.y * Math.sin(th), p.x * Math.sin(th) + p.y * Math.cos(th), p.z);
    const f = lvGramFrame({ H, m: mES, spec: { thrombus: true }, trace: trace(30, 12), site: "lv", t: 2.5, clock: clockStateAt(2.5, HR), full: 0.2, sinusRadius: 16, toHeart: rot, toAortic: rot });
    const cav = f.tubes.find((t) => t.thin)!;
    expect(cav.thin).toBeDefined();
    for (let i = 1; i < cav.pts.length - 1; i++) {
      const tg = V3.nrm(V3.sub(cav.pts[i + 1], cav.pts[i - 1]));
      expect(Math.abs(V3.dot(cav.thin!.dir[i], tg))).toBeLessThan(1e-6);
    }
    // the thrombus lies along the world long axis
    const thr = f.bones.find((b) => (b.muI ?? 0) < 0)!;
    const Lw = V3.nrm(V3.sub(cav.pts[cav.pts.length - 1], cav.pts[0]));
    expect(Math.abs(V3.dot(thr.ax[0], Lw))).toBeGreaterThan(1 - 1e-6);
  });

  it("pulmonary-vein reflux belongs to the Sellers scheme's grade 4, not to Oxford's grade IV", () => {
    const fr = (spec: LvGramSpec) =>
      lvGramFrame({ H, m: mES, spec, trace: trace(30, 12), site: "lv", t: 4, clock: clockStateAt(4, HR), full: 0.2, sinusRadius: 16, toHeart: (p) => p, toAortic: (p) => p });
    const oxford = fr({ mr: 4 });
    const sellers = fr({ mr: 4, mrScheme: "sellers" });
    expect(oxford.contrast.la).toBeGreaterThan(0.002);
    expect(fr({}).tubes.length).toBe(oxford.tubes.length);
    expect(sellers.tubes.length).toBe(oxford.tubes.length + 4);
  });

  it("the outflow tract runs from beyond the cavity's base to the valve and tapers into the base", () => {
    const f = lvGramFrame({ H, m: mES, spec: {}, trace: trace(30, 12), site: "lv", t: 2.5, clock: clockStateAt(2.5, HR), full: 0.2, sinusRadius: 16, toHeart: (p) => p, toAortic: (p) => p });
    const lvot = f.bones.filter((b) => b.half[1] === LV_CAVITY.lvotRadiusMm && (b.muI ?? 0) > 0);
    expect(lvot.length).toBe(1);
    const b = lvot[0];
    expect(b.muI).toBeCloseTo(0.2 * f.contrast.lv, 9);
    // centred on the valve side of the cavity's base plane, its basal tip reaching no further than the base
    expect(V3.dot(V3.sub(b.c, f.cavity.base), f.cavity.L)).toBeLessThan(0);
    const tip = [V3.add(b.c, V3.sc(b.ax[0], b.half[0])), V3.sub(b.c, V3.sc(b.ax[0], b.half[0]))].map((p) => V3.dot(V3.sub(p, f.cavity.base), f.cavity.L));
    expect(Math.max(...tip)).toBeLessThan(1);
    // the valve end reaches the aortic valve (origin of the aortic frame)
    const valveEnd = [V3.add(b.c, V3.sc(b.ax[0], b.half[0])), V3.sub(b.c, V3.sc(b.ax[0], b.half[0]))].map((p) => Math.hypot(p.x, p.y, p.z));
    expect(Math.min(...valveEnd)).toBeLessThan(3);
  });
});

describe("scene integration", () => {
  const c = CASE_LIBRARY[0];
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const base = (o: Partial<SceneInput>): SceneInput => ({
    model,
    caseData: c,
    tree,
    catheterRoot: [{ x: 0, y: 54, z: 0 }, { x: 0, y: 20, z: 0 }, { x: 4, y: -10, z: -8 }],
    french: 6,
    bolus: null,
    t: 2,
    cArm: RAO30,
    mode: "cine",
    frame: 1,
    ...o,
  });

  it("without an LV or root injection the scene is unchanged by an lvGram spec", () => {
    // the first build primes the previous-frame state (motion blur), so that a and b each follow a frame at the same time
    buildXrayScene(base({}));
    const a = buildXrayScene(base({})).scene;
    const b = buildXrayScene(base({ lvGram: { mr: 3, segments: { anterior: "akinetic" }, thrombus: true, stain: { segment: "inferior" } } })).scene;
    expect(b.tubes).toEqual(a.tubes);
    expect(b.bones).toEqual(a.bones);
  });

  it("heartShapes draws the chambers exactly as before the heartChambers refactor", () => {
    // recorded from heartShapes(makeHeart(1), end-systole at 70/min) of the pre-package heartShape.ts
    const before: [string, [number, number, number], [number, number, number]][] = [
      ["lv myocardium", [36.732753, -31.313902, -12.243709], [62.758051, 37.287361, 39.891876]],
      ["lv epicardial fat", [36.732753, -31.313902, -12.243709], [65.758051, 40.287361, 42.891876]],
      ["rv myocardium", [34.476978, -46.269242, 7.514209], [39.427807, 34.763094, 29.183869]],
      ["rv epicardial fat", [34.476978, -46.269242, 7.514209], [42.427807, 37.763094, 32.183869]],
      ["right atrium", [-11.998376, -32.635987, -7.19912], [30, 30, 26]],
      ["left atrium", [23.671985, -23.438276, -50.3634], [24, 22, 34]],
      ["left atrial appendage", [63.08701, 2.486481, -24.948421], [16, 9, 11]],
      ["right ventricular outflow", [19.938608, 3.622356, 4.96499], [26, 16, 20]],
      ["cardiophrenic fat pad", [14.846624, -68.91102, -12.431291], [26, 14, 18]],
      ["aortic root", [0, 12, 0], [16, 17, 17]],
    ];
    const now = heartShapes(H, mES);
    expect(now.map((s) => s.name)).toEqual(before.map((x) => x[0]));
    now.forEach((s, i) => {
      const [, c, half] = before[i];
      expect(Math.max(Math.abs(s.c.x - c[0]), Math.abs(s.c.y - c[1]), Math.abs(s.c.z - c[2]))).toBeLessThan(1e-5);
      for (let k = 0; k < 3; k++) expect(Math.abs(s.half[k] - half[k])).toBeLessThan(1e-5);
    });
    // a fresh motion object (no cached fit) gives the same shapes
    expect(heartShapes(H, motionAt(ES, H))).toEqual(now);
  });

  it("a stain outlasts its run: drawn without a bolus from the seconds since the push, and not without them", () => {
    const plain = buildXrayScene(base({})).scene;
    const later = buildXrayScene(base({ lvGram: { stain: { segment: "inferior", pericardial: true, sinceS: 20 } } })).scene;
    expect(later.bones.length).toBe(plain.bones.length + 1);
    const stain = later.bones.filter((b) => (b.muI ?? 0) > 0 && b.half[0] === 11 && b.half[1] === 3.5);
    expect(stain.length).toBe(1);
    expect(later.tubes.length).toBe(plain.tubes.length + 1); // the crescent
    const much = buildXrayScene(base({ lvGram: { stain: { segment: "inferior", sinceS: 2000 } } })).scene;
    expect(much.bones.length).toBe(plain.bones.length);
  });

  it("a ventriculogram replaces the ellipsoid with the segmented cavity, contracting with the case's pattern", () => {
    const tr = trace(30, 12);
    const run = (t: number, spec: LvGramSpec) =>
      buildXrayScene(base({ t, clock: { ...clockStateAt(t, HR), resp: 0, breathHold: true, rhythm: "sinus" } as never, bolus: { filled: [], plume: "none", side: null, t, injectDur: 2.5, peak: 0, lv: true, trace: tr }, lvGram: spec }));
    const tEd = 2 * RR + RR - 0.002,
      tEs = 3 * RR + ES.tInBeat;
    const r = run(tEs, { segments: { anterior: "akinetic" } });
    expect(r.lvGram).toBeDefined();
    expect(r.lvGram!.lv).toBeGreaterThan(0.02);
    // no big uniform iodine ellipsoid from before: the cavity is a tube with an elliptical cross-section
    expect(r.scene.bones.some((b) => (b.muI ?? 0) > 0 && b.half[0] > 30)).toBe(false);
    const cavity = (sc: typeof r.scene) => sc.tubes.filter((t) => t.thin && Array.isArray(t.mu[0]) && (t.mu as [number, number, number][]).some((m) => m[1] > 0));
    expect(cavity(r.scene).length).toBe(1);
    // projected width of the cavity at mid-length shrinks from end-diastole to end-systole
    const width = (t: number) => {
      const sc = run(t, {}).scene;
      const tube = cavity(sc)[0];
      // the cross-section nearest 40% of the way from the base to the apex
      const len = (i: number) => Math.hypot(tube.pts[i].x - tube.pts[0].x, tube.pts[i].y - tube.pts[0].y, tube.pts[i].z - tube.pts[0].z);
      const total = len(tube.pts.length - 1);
      let i = 0;
      while (i < tube.pts.length - 1 && len(i) < 0.4 * total) i++;
      const a = XrayRenderer.project(sc.cam, tube.pts[i]);
      return tube.r[i] * a.mag;
    };
    expect(width(tEs)).toBeLessThan(width(tEd));
  });

  it("an aortogram opacifies the root and the arch, and nothing else of the left heart without AR", () => {
    const tr = trace(50, 20);
    const t = 1.6;
    const r = buildXrayScene(base({ t, bolus: { filled: [], plume: "root", side: null, t, injectDur: 2.5, peak: 0, aortogram: true, trace: tr } }));
    expect(r.lvGram!.aorta).toBeGreaterThan(0.05);
    expect(r.lvGram!.lv).toBe(0);
    const ar = buildXrayScene(base({ t: 4, bolus: { filled: [], plume: "root", side: null, t: 4, injectDur: 2.5, peak: 0, aortogram: true, trace: tr }, lvGram: { ar: 3 } }));
    expect(ar.lvGram!.lv).toBeGreaterThan(0.02);
  });
});

describe("smooth cavity outline and the injection puff", () => {
  /** Largest turn (deg) of a silhouette edge between consecutive drawn cross-sections, below `uMax` of the length. */
  const maxTurn = (cav: LvCavity, us: number[], view: CArm, edge: 0 | 1, uMax: number) => {
    const d = viewDirection(view);
    const Lp = V3.sub(cav.L, V3.sc(d, V3.dot(cav.L, d)));
    const lenP = cav.lengthMm * Math.hypot(Lp.x, Lp.y, Lp.z);
    const drawn: LvCavity = { ...cav, slices: us.map((u) => sliceAt(cav, u)) };
    const e = silhouetteEdges(drawn, view);
    const pts = e.map((s) => ({ x: s.u * lenP, y: s.edges[edge].d }));
    let worst = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      if (e[i].u > uMax) break;
      const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      const b = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
      let t = Math.abs(b - a);
      if (t > Math.PI) t = 2 * Math.PI - t;
      worst = Math.max(worst, (t * 180) / Math.PI);
    }
    return worst;
  };
  /** The u of the drawn cross-sections of a cavity tube (by distance along the axis). */
  const drawnUs = (cav: LvCavity, tube: { pts: { x: number; y: number; z: number }[] }) => tube.pts.map((p) => V3.dot(V3.sub(p, cav.base), cav.L) / cav.lengthMm);

  it("draws the cavity densely, with a smooth outline in RAO 30 and LAO 60 cranial 20", () => {
    for (const [spec, view, m] of [
      [{ segments: { anterior: "akinetic" } }, RAO30, mES],
      [{}, RAO30, mED],
      [{}, LAO60CRA20, mES],
    ] as [LvGramSpec, CArm, typeof mES][]) {
      const cav = lvCavity(H, m, spec);
      const tubes = cavityTubes(cav, (p) => p, () => 1, undefined, viewDirection(view));
      expect(tubes.length).toBe(2);
      const us = drawnUs(cav, tubes[1]);
      // no step longer than CAVITY_DRAW.sampleMm along the axis
      for (let i = 1; i < us.length; i++) expect((us[i] - us[i - 1]) * cav.lengthMm).toBeLessThan(CAVITY_DRAW.sampleMm + 1e-6);
      // the old spacing (0.6 of the local radius): what the ribbon path's drop rule left of the cavity before
      const sparse: number[] = [];
      for (let u = 0; u < 1; ) {
        sparse.push(u);
        const s = sliceAt(cav, u);
        u += Math.max(0.015, (0.6 * Math.max((s.radii.anterior + s.radii.inferior) / 2, (s.radii.posterolateral + s.radii.septal) / 2)) / cav.lengthMm);
      }
      sparse.push(1);
      for (const edge of [0, 1] as const) {
        const now = maxTurn(cav, us, view, edge, 0.9);
        const before = maxTurn(cav, sparse, view, edge, 0.9);
        expect(now).toBeLessThan(12);
        expect(now).toBeLessThan(0.5 * before);
      }
    }
  });

  it("keeps the sparse spacing (no guide) when the long axis runs end-on to the ray", () => {
    const cav = lvCavity(H, mES, {});
    const tubes = cavityTubes(cav, (p) => p, () => 1, undefined, cav.L);
    expect(tubes.length).toBe(1);
    expect(tubes[0].thin).toBeDefined();
    expect(tubes[0].pts.length).toBeLessThan(CAVITY_DRAW.minSamples);
  });

  it("interpolated cross-sections match the profile's at its own positions", () => {
    const cav = lvCavity(H, mES, { segments: { anterior: "dyskinetic" } });
    for (const i of [0, 5, 13, 20, 27]) {
      const s = sliceAt(cav, cav.slices[i].u);
      for (const w of ["anterior", "inferior", "septal", "posterolateral"] as const) expect(Math.abs(s.radii[w] - cav.slices[i].radii[w])).toBeLessThan(1e-6);
      expect(Math.hypot(s.c.x - cav.slices[i].c.x, s.c.y - cav.slices[i].c.y, s.c.z - cav.slices[i].c.z)).toBeLessThan(1e-6);
    }
  });

  // a hand injection into the LV through a coronary catheter: about 6 mL at 3 mL/s
  const hand = trace(6, 3);
  const handFrame = (t: number, tip?: { x: number; y: number; z: number } | null) => {
    const clock = clockStateAt(t, HR);
    return lvGramFrame({ H, m: motionAt(clock, H), spec: {}, trace: hand, site: "lv", t, clock, full: 0.2, sinusRadius: 16, toHeart: (p) => p, toAortic: (p) => p, tip });
  };
  /** the puff's shells: iodine ellipsoids along the cavity's long axis (the outflow tract runs to the valve instead) */
  const puffOf = (f: ReturnType<typeof handFrame>) => f.bones.filter((b) => (b.muI ?? 0) > 0 && b.type === 0 && Math.abs(V3.dot(b.ax[0], f.cavity.L)) > 0.999);

  it("an inadvertent hand injection into the LV shows as a dense puff at the catheter tip that washes out within two beats", () => {
    const full = 0.2;
    for (const t of [1.0, 1.6]) {
      const f = handFrame(t);
      const p = puffOf(f);
      expect(p.length).toBe(LV_PUFF.shells.length);
      // the puff's central column (mm of full-strength contrast) across the beam, against a proximal coronary's
      // (a 3.5 mm lumen at full strength) and against the mixed cavity's mean column
      const column = p.reduce((s, b) => s + (2 * b.half[1] * b.muI!) / full, 0);
      expect(column).toBeGreaterThan(3.5);
      expect(column).toBeGreaterThan(4 * cavityMeanChord(f.cavity, RAO30) * f.contrast.lv);
      // iodine is conserved: the shells hold the unmixed contrast between them
      const held = p.reduce((s, b) => s + (((4 / 3) * Math.PI * b.half[0] * b.half[1] * b.half[2]) / 1000) * (b.muI! / full), 0);
      expect(Math.abs(held - f.contrast.poolMl)).toBeLessThan(1e-6 + 0.01 * f.contrast.poolMl);
      // nested: the edge fades (outer shells larger and less concentrated)
      for (let i = 1; i < p.length; i++) {
        expect(p[i].half[0]).toBeGreaterThan(p[i - 1].half[0]);
        expect(p[i].muI!).toBeLessThan(p[i - 1].muI!);
      }
    }
    // at the catheter tip: a tip in the anterior mid-cavity moves the puff there (inside the cavity)
    const f0 = handFrame(1.0);
    const s = f0.cavity.slices[14];
    const tip = V3.add(s.axisPt, V3.sc(f0.cavity.e1, 0.5 * s.radii.anterior));
    const atTip = puffOf(handFrame(1.0, tip))[0];
    expect(V3.dot(V3.sub(atTip.c, s.axisPt), f0.cavity.e1)).toBeGreaterThan(0.1 * s.radii.anterior);
    expect(Math.abs(V3.dot(V3.sub(atTip.c, f0.cavity.base), f0.cavity.L) - s.u * f0.cavity.lengthMm)).toBeLessThan(2);
    // a tip far outside the cavity is clamped inside it
    const far = injectionPuff(f0.cavity, 1, V3.add(f0.cavity.apex, V3.sc(f0.cavity.e2, 80)))[0];
    const ua = V3.dot(V3.sub(far.c, f0.cavity.base), f0.cavity.L) / f0.cavity.lengthMm;
    expect(ua).toBeLessThanOrEqual(LV_PUFF.maxU + 1e-9);
    // washed out within two beats of the end of the push: no puff, and the mixed cavity faint
    const late = handFrame(hand.pushEnd! + 2 * RR);
    expect(puffOf(late).length).toBe(0);
    expect(cavityMeanChord(late.cavity, RAO30) * late.contrast.lv).toBeLessThan(1.5);
  });
});
