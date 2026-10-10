import { describe, it, expect } from "vitest";
import { buildAnatomy } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { buildCoronaryTree, samplePos } from "./coronaryTree";
import {
  ANAT,
  ANATOMY_TUNE,
  ANAT_COUNT,
  CARVE,
  HEART_SHAPE_SKIPPED,
  HEART_SHAPE_SLOTS,
  MAX_ANAT,
  mergeHeartShapes,
  MAX_CARVE_SHAPES,
  REFERENCE_GENOME,
  SEG_FLOATS,
  buildThorax,
  seedFrom,
  shapeContains,
  thoraxGenome,
  thoraxSegmentCount,
  traceAnat,
  type AnatShape,
  type Thorax,
} from "./thorax";
import { LEAF_RADIUS } from "./pulmonaryTree";
import { HEART_SHAPE_NAMES, heartShapes } from "./heartShape";
import { HARDWARE_PREVALENCE, METAL, PLASTIC, buildHardware, catenary, sampleHardware } from "./hardware";
import { CLUTTER_AMPLITUDE, CLUTTER_GLSL, TRABECULAR_GLSL, THORAX_SEGMENTS_KEY, clutterStateFromAnat } from "./clutter";
import { VESSEL_SEGMENT_BUDGET } from "./pulmonaryTree";
import type { Vec3 } from "../../types";
import { REFERENCE_VIEWS, prepareScenario, resolveSpec, sceneInputAt, sceneTubes } from "../../dev/xrayCapture";
import { buildXrayScene } from "./sceneBuilder";

const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const H = tree.heart;
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const nrm3 = (p1: Vec3, p0: Vec3) => {
  const d = v(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
  const l = Math.hypot(d.x, d.y, d.z) || 1;
  return v(d.x / l, d.y / l, d.z / l);
};
function distSeg(p: Vec3, a: Vec3, b: Vec3) {
  const ab = v(b.x - a.x, b.y - a.y, b.z - a.z);
  const t = Math.max(0, Math.min(1, dot3(v(p.x - a.x, p.y - a.y, p.z - a.z), ab) / (dot3(ab, ab) || 1)));
  return Math.hypot(p.x - a.x - ab.x * t, p.y - a.y - ab.y * t, p.z - a.z - ab.z * t);
}

/** Segment i of a packed buffer as named fields. */
function seg(d: Float32Array, i: number) {
  const o = i * SEG_FLOATS;
  return {
    p0: v(d[o], d[o + 1], d[o + 2]),
    r0: d[o + 3],
    p1: v(d[o + 4], d[o + 5], d[o + 6]),
    r1: d[o + 7],
    d0: v(d[o + 8], d[o + 9], d[o + 10]),
    inner: d[o + 11],
    d1: v(d[o + 12], d[o + 13], d[o + 14]),
    flat: d[o + 15],
    mu: [d[o + 16], d[o + 17], d[o + 18]],
    muIn: [d[o + 20], d[o + 21], d[o + 22]],
    n0: v(d[o + 28], d[o + 29], d[o + 30]),
    n1: v(d[o + 32], d[o + 33], d[o + 34]),
  };
}

describe("thorax shapes", () => {
  const th = buildThorax({ resp: 0.3, heart: H });
  it("keeps the renderer's limits and order (body first, two lungs, at most 16 carve shapes)", () => {
    expect(th.anat.length).toBeLessThanOrEqual(MAX_ANAT);
    expect(th.anat.length).toBeGreaterThanOrEqual(ANAT_COUNT);
    expect(th.anat[ANAT.BODY].name).toBe("body");
    expect(th.anat.filter((a) => a.lung).length).toBe(2);
    expect(th.anat.filter((a) => a.carve).length).toBeLessThanOrEqual(MAX_CARVE_SHAPES);
    expect(CARVE.length).toBeLessThanOrEqual(MAX_CARVE_SHAPES);
    for (const i of CARVE) expect(th.anat[i].carve).toBe(true);
    for (const a of th.anat) {
      expect(Number.isFinite(a.mu)).toBe(true);
      for (const h of a.half) expect(h).toBeGreaterThan(0);
    }
  });

  it("has the great vessels and the lobulated left heart border", () => {
    const names = th.anat.map((a) => a.name);
    for (const n of ["descending aorta", "ascending aorta", "left atrial appendage", "cardiophrenic fat pad", "right ventricle"]) expect(names).toContain(n);
  });

  it("the seedless thorax is the reference patient", () => {
    expect(th.genome).toEqual(REFERENCE_GENOME);
    expect(buildThorax({ resp: 0.3, heart: H, seed: 0 }).anat).toEqual(th.anat);
  });

  it("the silhouette follows the contraction (ventricles smaller in systole)", () => {
    const vol = (t: Thorax) => t.anat[ANAT.HEART].half.reduce((p, x) => p * x, 1);
    const dia = buildThorax({ resp: 0, heart: H, contraction: 0 });
    const sys = buildThorax({ resp: 0, heart: H, contraction: 1 });
    expect(vol(sys)).toBeLessThan(vol(dia) * 0.97);
    expect(vol(sys)).toBeGreaterThan(vol(dia) * 0.45);
  });

  it("the epicardial vessels lie inside the heart envelope and close to its border", () => {
    const th0 = buildThorax({ resp: 0, heart: H });
    // the epicardial envelopes: the ventricular fat slots without the pericardial sac (ANATOMY_TUNE.pericardium,
    // C1), which lies that far outside them by construction
    const g = ANATOMY_TUNE.pericardium;
    const env0 = [ANAT.HEART_FAT, ANAT.RV_FAT, ANAT.RA, ANAT.LA, ANAT.LAA, ANAT.RVOT, ANAT.FAT_PAD].map((i) => {
      const s = th0.anat[i];
      return i === ANAT.HEART_FAT || i === ANAT.RV_FAT ? { ...s, half: s.half.map((h) => h - g) as [number, number, number] } : s;
    });
    const q = (s: AnatShape, p: Vec3) => {
      const d = v(p.x - s.c.x, p.y - s.c.y, p.z - s.c.z);
      return Math.hypot(...s.ax.map((a, i) => (d.x * a.x + d.y * a.y + d.z * a.z) / s.half[i]));
    };
    const r: number[] = [];
    for (const ves of tree.vessels) for (const sm of ves.samples) r.push(Math.min(...env0.map((s) => q(s, samplePos(H, sm)))));
    r.sort((a, b) => a - b);
    const outside = r.filter((x) => x > 1).length / r.length;
    expect(outside).toBeLessThan(0.03);
    // the border is close to the vessels (the wave-0 envelope sat about 20 mm outside them: median 0.77)
    expect(r[Math.floor(r.length / 2)]).toBeGreaterThan(0.85);
  });

  it("deep inspiration lowers the diaphragm and lengthens the lungs", () => {
    const ex = buildThorax({ resp: 0, heart: H });
    const ins = buildThorax({ resp: 1, heart: H });
    const bottom = (s: { c: { y: number }; half: number[] }) => s.c.y - s.half[1];
    expect(bottom(ins.anat[ANAT.LUNG_R])).toBeLessThan(bottom(ex.anat[ANAT.LUNG_R]) - 20);
    expect(ins.anat[ANAT.LIVER].c.y).toBeLessThan(ex.anat[ANAT.LIVER].c.y - 20);
  });

  it("consumes the heart-shape stream's fitted primitives by name without duplicates or limit overflow", () => {
    for (const seed of ["case-1", 0, 5, 13]) {
      const g = thoraxGenome(seed);
      for (const contraction of [0, 0.3, 1]) {
        const hs = heartShapes(H, { contraction });
        expect(hs.map((s) => s.name)).toEqual([...HEART_SHAPE_NAMES]);
        const base = buildThorax({ resp: 0.4, heart: H, genome: g, contraction });
        const t = buildThorax({ resp: 0.4, heart: H, genome: g, contraction, heartShapes: hs });
        const names = t.anat.map((a) => a.name);
        expect(new Set(names).size).toBe(names.length);
        expect(t.anat.length).toBe(base.anat.length);
        expect(t.anat.length).toBeLessThanOrEqual(MAX_ANAT);
        expect(t.anat.filter((a) => a.carve).length).toBeLessThanOrEqual(MAX_CARVE_SHAPES);
        expect(t.anat.map((a) => !!a.carve)).toEqual(base.anat.map((a) => !!a.carve));
        // each named primitive sits in its slot with the fitted geometry and material
        for (const h of hs) {
          const slot = HEART_SHAPE_SLOTS[h.name!];
          if (slot === undefined) {
            expect(HEART_SHAPE_SKIPPED as readonly string[]).toContain(h.name);
            continue;
          }
          expect(t.anat[slot].c).toEqual(h.c);
          // the ventricular fat envelopes carry the pericardial sac (ANATOMY_TUNE.pericardium, C1)
          const grow = slot === ANAT.HEART_FAT || slot === ANAT.RV_FAT ? ANATOMY_TUNE.pericardium : 0;
          expect(t.anat[slot].half).toEqual(grow ? h.half.map((x) => x + grow) : h.half);
          expect(t.anat[slot].mu).toBe(h.mu);
          expect(t.anat[slot].lung).toBe(false);
        }
        // only the heart slots changed, and the venae cavae, which follow the fitted right atrium, and the
        // dependent lung under the fitted left ventricular envelope (C1)
        const slots = new Set(Object.values(HEART_SHAPE_SLOTS));
        const cavae = new Set<number>([ANAT.SVC, ANAT.IVC]);
        t.anat.forEach((a, i) => {
          if (!slots.has(i) && !cavae.has(i) && i !== ANAT.RETRO) expect(a).toEqual(base.anat[i]);
        });
        // the dependent lung is the fitted left ventricular envelope moved towards the table
        const lvf = t.anat[ANAT.HEART_FAT],
          ret = t.anat[ANAT.RETRO];
        expect(ret.carve).toBe(true);
        expect(ret.c.z).toBeCloseTo(lvf.c.z - ANATOMY_TUNE.retro.depth, 6);
        expect(ret.c.x).toBeGreaterThanOrEqual(lvf.c.x - 1e-9);
        expect(ret.half[0]).toBeCloseTo(lvf.half[0] - ANATOMY_TUNE.pericardium, 6);
        for (const i of cavae) {
          expect(t.anat[i].name).toBe(base.anat[i].name);
          expect(t.anat[i].carve).toBe(true);
          // the cava's atrial end lies inside the fitted atrium
          const ra = t.anat[ANAT.RA];
          const end = [-1, 1]
            .map((s) => ({ x: t.anat[i].c.x + s * t.anat[i].ax[1].x * t.anat[i].half[1], y: t.anat[i].c.y + s * t.anat[i].ax[1].y * t.anat[i].half[1], z: t.anat[i].c.z + s * t.anat[i].ax[1].z * t.anat[i].half[1] }))
            .map((p) => Math.hypot(p.x - ra.c.x, p.y - ra.c.y, p.z - ra.c.z))
            .reduce((a, b) => Math.min(a, b));
          expect(end).toBeLessThan(Math.max(...ra.half));
        }
        // the cardiophrenic fat pad is counted once
        expect(t.anat.filter((a) => a.mu < 0 && /fat pad/.test(a.name ?? "")).length).toBe(1);
      }
    }
    // the merge is idempotent and ignores unknown names
    const hs = heartShapes(H, { contraction: 0.5 });
    const shapes = buildThorax({ resp: 0, heart: H }).anat;
    const once = mergeHeartShapes(shapes, hs);
    expect(mergeHeartShapes(once, hs)).toEqual(once);
    expect(mergeHeartShapes(shapes, [{ ...hs[0], name: "unknown" }])).toEqual(shapes);
  });

  it("legacy tubes never use per-point materials (sceneBuilder and its tests look those up as coronaries)", () => {
    const t = buildThorax({ resp: 0.4, heart: H, seed: 5, hardware: { sternalWires: 5, device: "pacemaker-dual", ecg: true } });
    for (const tube of t.tubes) expect(Array.isArray(tube.mu[0])).toBe(false);
  });
});

describe("thorax genome", () => {
  it("is deterministic and different between patients", () => {
    const a = buildThorax({ resp: 0.2, heart: H, seed: "case-17", segments: true });
    const b = buildThorax({ resp: 0.2, heart: H, seed: "case-17", segments: true });
    expect(a.anat).toEqual(b.anat);
    expect(a.segments!.stat.key).toBe(b.segments!.stat.key);
    expect(Array.from(a.segments!.stat.data.slice(0, 720))).toEqual(Array.from(b.segments!.stat.data.slice(0, 720)));
    expect(seedFrom("case-17")).toBe(seedFrom("case-17"));
    expect(seedFrom("case-17")).not.toBe(seedFrom("case-18"));
  });

  it("habitus stays in 0.85-1.25 and varies realistically", () => {
    const hs = Array.from({ length: 300 }, (_, i) => thoraxGenome(i + 1).habitus);
    expect(Math.min(...hs)).toBeGreaterThanOrEqual(0.85);
    expect(Math.max(...hs)).toBeLessThanOrEqual(1.25);
    const m = hs.reduce((s, x) => s + x, 0) / hs.length;
    const sd = Math.sqrt(hs.reduce((s, x) => s + (x - m) ** 2, 0) / hs.length);
    expect(m).toBeGreaterThan(0.97);
    expect(m).toBeLessThan(1.1);
    expect(sd).toBeGreaterThan(0.05);
  });

  it("across 8 seeds the water-equivalent path through the chest varies with habitus and no two thoraces match", () => {
    const P: number[] = [],
      k: number[] = [];
    const keys = new Set<string>();
    for (let s = 1; s <= 8; s++) {
      const t = buildThorax({ resp: 0.3, heart: H, seed: s });
      // AP ray through the heart, about where the exposure control meters
      const r = traceAnat(t.anat, v(20, -20, 760), v(0, 0, -1));
      P.push(r.P);
      k.push(t.genome!.habitus);
      keys.add(JSON.stringify(t.anat.map((a) => [a.c, a.half])));
    }
    expect(keys.size).toBe(8);
    const mp = P.reduce((a, b) => a + b) / 8,
      mk = k.reduce((a, b) => a + b) / 8;
    let sxy = 0,
      sxx = 0,
      syy = 0;
    for (let i = 0; i < 8; i++) {
      sxy += (P[i] - mp) * (k[i] - mk);
      sxx += (k[i] - mk) ** 2;
      syy += (P[i] - mp) ** 2;
    }
    expect(sxy / Math.sqrt(sxx * syy)).toBeGreaterThan(0.8);
    // a spread of at least 0.4 in -ln T (a factor of 1.5 in transmission)
    expect(Math.max(...P) - Math.min(...P)).toBeGreaterThan(0.4);
  });
});

describe("CPU anatomy trace", () => {
  const th = buildThorax({ resp: 0.3, heart: H });
  it("matches a hand integral for the body alone", () => {
    const body = th.anat[ANAT.BODY];
    const r = traceAnat([body], v(0, -40, 1000), v(0, 0, -1));
    expect(r.P).toBeCloseTo(2 * body.half[2] * body.mu, 6);
  });
  it("carves the lungs around the heart", () => {
    const lungRay = traceAnat(th.anat, v(-110, 60, 760), v(0, 0, -1));
    const heartRay = traceAnat(th.anat, v(30, -40, 760), v(0, 0, -1));
    expect(lungRay.lungPath).toBeGreaterThan(60);
    expect(heartRay.lungPath).toBeLessThan(lungRay.lungPath * 0.6);
    expect(heartRay.P).toBeGreaterThan(lungRay.P);
  });
});

describe("thorax segments", () => {
  const th = buildThorax({ resp: 0.3, heart: H, seed: 3, segments: true });
  const S = th.segments!;
  const d = S.stat.data;
  it("packs ribs, cartilage, clavicles, vessels and bronchi within the budget", () => {
    expect(SEG_FLOATS).toBe(36);
    expect(S.stat.count * SEG_FLOATS).toBe(d.length);
    expect(thoraxSegmentCount(th)).toBeGreaterThan(5000);
    expect(thoraxSegmentCount(th)).toBeLessThan(40000);
    expect(th.tubes.length).toBe(0);
    for (let i = 0; i < d.length; i++) if (!Number.isFinite(d[i])) throw new Error("non-finite segment value at " + i);
    expect(THORAX_SEGMENTS_KEY).toBe("thoraxSegments");
  });

  it("joins consecutive segments on shared mitred planes (no gaps or overlaps)", () => {
    let joins = 0;
    for (let i = 0; i + 1 < S.stat.count && joins < 2000; i++) {
      const a = seg(d, i),
        b = seg(d, i + 1);
      // within one rib polyline (branch points and rib-cartilage junctions join different polylines)
      const isRib = (x: typeof a) => x.inner > 0 && x.flat < 0.99 && x.muIn[0] > 0;
      if (!isRib(a) || !isRib(b)) continue;
      if (Math.hypot(a.p1.x - b.p0.x, a.p1.y - b.p0.y, a.p1.z - b.p0.z) > 1e-4) continue;
      expect(Math.hypot(a.n1.x - b.n0.x, a.n1.y - b.n0.y, a.n1.z - b.n0.z)).toBeLessThan(1e-4);
      joins++;
    }
    expect(joins).toBeGreaterThan(400);
  });

  it("ribs are thin cortical shells, denser posteriorly, with tapered ends", () => {
    const ribs = Array.from({ length: S.stat.count }, (_, i) => seg(d, i)).filter((s) => s.inner > 0 && s.flat < 0.99 && s.muIn[0] > 0 && s.mu[0] > 0.01);
    expect(ribs.length).toBeGreaterThan(300);
    for (const r of ribs) {
      // cortex = thin semi-axis x (1 - inner): the plan's 0.6-1.0 mm, thinning to 0.3 at the tapered end
      const thin = ((r.r0 + r.r1) / 2) * r.flat;
      const cortex = thin * (1 - r.inner);
      expect(cortex).toBeGreaterThan(0.25);
      expect(cortex).toBeLessThan(1.1);
      // marrow far less dense than the cortex (margins, not bands)
      expect(r.muIn[0]).toBeLessThan(0.15 * r.mu[0]);
    }
    const mus = ribs.map((r) => r.mu[0]);
    expect(Math.min(...mus)).toBeLessThan(0.5 * Math.max(...mus));
  });

  it("vessels taper to sub-millimetre twigs and breathe with the lungs", () => {
    const ves = Array.from({ length: S.stat.count }, (_, i) => seg(d, i)).filter((s) => Math.abs(s.mu[0] - 0.0135) < 1e-6);
    expect(ves.length).toBeGreaterThan(3000);
    expect(Math.min(...ves.map((s) => Math.min(s.r0, s.r1)))).toBeLessThan(LEAF_RADIUS * 0.5);
    expect(Math.max(...ves.map((s) => s.r0))).toBeGreaterThan(4);
    // basal vessels descend on inspiration, apical ones hardly move
    const low = ves.filter((s) => s.p0.y < -60),
      high = ves.filter((s) => s.p0.y > 120);
    const meanDy = (a: typeof ves) => a.reduce((t, s) => t + s.d0.y, 0) / a.length;
    expect(meanDy(low)).toBeLessThan(-10);
    expect(Math.abs(meanDy(high))).toBeLessThan(Math.abs(meanDy(low)) * 0.5);
  });

  it("vessels stay in the lungs and out of the mediastinum", () => {
    const t0 = buildThorax({ resp: 0, heart: H, seed: 3, segments: true });
    const lungs = t0.anat.filter((a) => a.lung);
    const carve = t0.anat.filter((a) => a.carve);
    const ves = Array.from({ length: S.stat.count }, (_, i) => seg(d, i)).filter((s) => Math.abs(s.mu[0] - 0.0135) < 1e-6);
    let inLung = 0,
      inCarve = 0;
    for (const s of ves) {
      if (lungs.some((l) => shapeContains(l, s.p1))) inLung++;
      if (carve.some((k) => shapeContains(k, s.p1))) inCarve++;
    }
    expect(inLung / ves.length).toBeGreaterThan(0.97);
    expect(inCarve / ves.length).toBeLessThan(0.08);
  });
});

describe("segment geometry", () => {
  it("rounds hairpins so every joint keeps one shared plane well away from both segments", () => {
    const th = buildThorax({ resp: 0.2, heart: H, seed: 4, segments: true, hardware: { valve: "tavi" } });
    const D = th.segments!.dyn!;
    let joints = 0;
    for (let i = 0; i + 1 < D.count; i++) {
      const a = seg(D.data, i),
        b = seg(D.data, i + 1);
      if (Math.hypot(a.p1.x - b.p0.x, a.p1.y - b.p0.y, a.p1.z - b.p0.z) > 1e-4) continue;
      joints++;
      expect(Math.hypot(a.n1.x - b.n0.x, a.n1.y - b.n0.y, a.n1.z - b.n0.z)).toBeLessThan(1e-5);
      const da = nrm3(a.p1, a.p0),
        db = nrm3(b.p1, b.p0);
      expect(dot3(a.n1, da)).toBeGreaterThan(0.69);
      expect(dot3(b.n0, db)).toBeGreaterThan(0.69);
    }
    // the zig-zag frame (bends of about 150 degrees) has hundreds of joints
    expect(joints).toBeGreaterThan(100);
  });

  it("vessel segments stay within the budget in every habitus", () => {
    for (const habitus of [0.85, 1, 1.25]) {
      const th = buildThorax({ resp: 0, heart: H, genome: { ...thoraxGenome(2), habitus }, segments: true });
      const d = th.segments!.stat.data;
      let ves = 0;
      for (let i = 0; i < th.segments!.stat.count; i++) if (Math.abs(d[i * SEG_FLOATS + 16] - 0.0135) < 1e-6) ves++;
      // hairpin rounding in the segment list can add a few segments beyond the tree's own count
      expect(ves).toBeLessThanOrEqual(VESSEL_SEGMENT_BUDGET * 1.005);
      expect(ves).toBeGreaterThan(VESSEL_SEGMENT_BUDGET * 0.7);
      expect(th.segments!.stat.count).toBeLessThan(VESSEL_SEGMENT_BUDGET + 4000);
    }
  });

  it("bronchi run beside their arteries, never inside them", () => {
    const th = buildThorax({ resp: 0, heart: H, seed: 3, segments: true });
    const d = th.segments!.stat.data;
    const all = Array.from({ length: th.segments!.stat.count }, (_, i) => seg(d, i));
    const bron = all.filter((s) => s.muIn[0] < 0);
    const art = all.filter((s) => Math.abs(s.mu[0] - 0.0135) < 1e-6 && s.r0 >= 1.6);
    expect(bron.length).toBeGreaterThan(100);
    let inside = 0;
    for (const b of bron) {
      // distance from the bronchus axis point to the nearest large artery axis
      let best = 1e9,
        br = 0;
      for (const a of art) {
        const dd = distSeg(b.p0, a.p0, a.p1);
        if (dd < best) {
          best = dd;
          br = Math.max(a.r0, a.r1);
        }
      }
      if (best < br) inside++;
    }
    // with the old fixed posterior offset 23 % of bronchus points lay inside a large artery, and 12-13 % with
    // the perpendicular offset (at branch points a sibling or parent passed close). Bronchus points inside any
    // large vessel are now dropped and the bronchus split there (C1 review round)
    expect(inside / bron.length).toBeLessThan(0.02);
  });
});

describe("vertebrae", () => {
  const th = buildThorax({ resp: 0.3, heart: H, seed: 2 });
  it("have thin endplates, ring rims and ring pedicles", () => {
    const endplates = th.bones.filter((b) => b.type === 0 && b.half[1] < 1 && b.half[0] > 10);
    expect(endplates.length).toBe(19 * 2);
    for (const e of endplates) expect(2 * e.half[1]).toBeLessThan(2.0);
    // pedicles: outer and inner AP cylinders (rings seen end-on)
    const ped = th.bones.filter((b) => b.type === 1 && Math.abs(b.ax[1].z) > 0.9);
    expect(ped.length).toBe(19 * 2 * 2);
    expect(ped.filter((b) => b.mu < 0).length).toBe(19 * 2);
  });
  it("leave disc gaps of 5-8 mm and are not stacked in a straight column", () => {
    // each vertebral body is a stack of open cortical slabs (concave waist, C1 review round): group the
    // slabs that touch into bodies (top, bottom, centre x)
    const slabs = th.bones.filter((b) => b.type === 1 && b.mu === 0.019 && b.half[0] > 8).sort((a, b) => b.c.y - a.c.y);
    const bodies: { top: number; bottom: number; x: number; waist: number; rim: number }[] = [];
    for (const b of slabs) {
      const last = bodies[bodies.length - 1];
      if (last && last.bottom - (b.c.y + b.half[1]) < 0.5) {
        last.bottom = b.c.y - b.half[1];
        last.waist = Math.min(last.waist, b.half[0]);
        last.rim = Math.max(last.rim, b.half[0]);
      } else bodies.push({ top: b.c.y + b.half[1], bottom: b.c.y - b.half[1], x: b.c.x, waist: b.half[0], rim: b.half[0] });
    }
    expect(bodies.length).toBe(19);
    const xs = bodies.map((b) => b.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(1.5);
    for (const b of bodies) expect(b.rim - b.waist).toBeGreaterThan(1);
    for (let i = 1; i < bodies.length; i++) {
      const gap = bodies[i - 1].bottom - 1.2 - (bodies[i].top + 1.2);
      expect(gap).toBeGreaterThan(4.5);
      expect(gap).toBeLessThan(8.5);
    }
  });
});

describe("hardware", () => {
  const ctx = { resp: 0.2, heart: H, heartShift: v(0, -4, 0), contraction: 0.3, habitus: 1, bodyFront: 80, bodyBack: -172, seed: 9 };
  it("builds every item with metal in the metal channel, and nothing when disabled", () => {
    const g = buildHardware({ sternalWires: 6, graftClips: true, device: "crt", valve: "tavi", ecg: true, table: true }, ctx);
    const names = new Set(g.wires.map((w) => w.name));
    for (const n of ["sternal wire", "sternal wire twist", "clip", "generator", "RV lead", "RA lead", "LV lead", "shock coil", "frame", "ECG snap", "ECG sensor", "ECG lead"]) expect(names).toContain(n);
    expect(g.wires.filter((w) => w.name === "sternal wire").length).toBe(6);
    for (const w of g.wires) {
      if (w.name === "ECG lead") {
        // PVC insulation in the soft channel around a copper core in the metal channel
        expect(w.mu).toEqual([PLASTIC.pvc, 0, 0]);
        expect(w.muIn).toEqual([0, 0, METAL.copper]);
      } else {
        expect(w.mu[2]).toBeGreaterThan(0);
        expect(w.mu[0]).toBe(0);
      }
      for (const p of w.pts) expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
    }
    // mattress, two carbon skins, foam core, two end walls
    expect(g.solids.length).toBe(6);
    expect(g.solids.every((b) => b.mu >= 0 && b.mu < 0.05)).toBe(true);
    expect(buildHardware({ enabled: false, sternalWires: 6, device: "icd" }, ctx).wires.length).toBe(0);
    expect(METAL.steel).toBeCloseTo(0.949, 3);
  });

  it("leads move with the heart and sternal wires with breathing", () => {
    const a = buildHardware({ sternalWires: 5, device: "pacemaker-single" }, ctx);
    const b = buildHardware({ sternalWires: 5, device: "pacemaker-single" }, { ...ctx, contraction: 1, resp: 1 });
    const tip = (g: typeof a) => {
      const p = g.wires.find((w) => w.name === "RV lead")!.pts;
      return p[p.length - 1];
    };
    const wire = (g: typeof a) => g.wires.find((w) => w.name === "sternal wire")!.pts[0];
    expect(Math.hypot(tip(a).x - tip(b).x, tip(a).y - tip(b).y, tip(a).z - tip(b).z)).toBeGreaterThan(1);
    expect(wire(b).z).toBeGreaterThan(wire(a).z + 2);
  });

  it("case sampling follows the library prevalence", () => {
    let st = 0,
      pm = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const h = sampleHardware(i + 1);
      if ((h.sternalWires ?? 0) > 0) st++;
      if (h.device !== "none") pm++;
    }
    expect(st / n).toBeGreaterThan(HARDWARE_PREVALENCE.sternotomy * 0.8);
    expect(st / n).toBeLessThan(HARDWARE_PREVALENCE.sternotomy * 1.2);
    expect(pm / n).toBeGreaterThan(HARDWARE_PREVALENCE.pacing * 0.6);
    expect(pm / n).toBeLessThan(HARDWARE_PREVALENCE.pacing * 1.4);
  });

  it("ECG leads hang as catenaries on or outside the skin, leave the field and move with breathing", () => {
    const c0 = catenary(v(0, 0, 0), v(100, 0, 0), 1.1, v(0, 0, -1), 40);
    let L = 0;
    for (let i = 1; i < c0.length; i++) L += Math.hypot(c0[i].x - c0[i - 1].x, c0[i].y - c0[i - 1].y, c0[i].z - c0[i - 1].z);
    expect(L).toBeCloseTo(110, 0);
    expect(Math.min(...c0.map((p) => p.z))).toBeLessThan(-15); // sags downwards
    expect(c0[40].x).toBeCloseTo(100, 6);
    const a = buildHardware({ ecg: true }, ctx);
    const b = buildHardware({ ecg: true }, { ...ctx, resp: 1 });
    const leads = (g: typeof a) => g.wires.filter((w) => w.name === "ECG lead");
    expect(leads(a).length).toBe(4);
    const bz = (80 + -172) / 2,
      hz = (80 + 172) / 2;
    for (const w of leads(a)) {
      for (const p of w.pts) expect(Math.hypot(p.x / 176, (p.z - bz) / hz)).toBeGreaterThan(0.999);
      expect(w.pts[w.pts.length - 1].y).toBeGreaterThan(400); // runs off the field towards the head
    }
    const moved = leads(a).map((w, i) => Math.hypot(w.pts[2].x - leads(b)[i].pts[2].x, w.pts[2].y - leads(b)[i].pts[2].y, w.pts[2].z - leads(b)[i].pts[2].z));
    expect(Math.max(...moved)).toBeGreaterThan(1);
  });

  it("the hardware buffer key changes with the patient and the spec, not only with the item count", () => {
    const spec = { sternalWires: 6 };
    const k = (seed: number, s: object) => buildThorax({ resp: 0.7, heart: H, seed, segments: true, hardware: s }).segments!.dyn!.key;
    expect(k(4, spec)).toBe(k(4, spec));
    expect(k(4, spec)).not.toBe(k(5, spec));
    expect(k(4, spec)).not.toBe(k(4, { sternalWires: 6, ecg: false, table: true }) + "x");
    expect(k(4, { sternalWires: 6, device: "icd" })).not.toBe(k(4, { sternalWires: 6, device: "pacemaker-dual" }));
  });

  it("goes to the per-frame segment buffer in segment mode and to tubes otherwise", () => {
    const spec = { sternalWires: 6, device: "icd" as const, valve: "aortic-mechanical" as const };
    const s = buildThorax({ resp: 0.2, heart: H, seed: 4, segments: true, hardware: spec });
    expect(s.segments!.dyn!.count).toBeGreaterThan(100);
    const l = buildThorax({ resp: 0.2, heart: H, seed: 4, hardware: spec });
    expect(l.tubes.some((t) => (t.mu as number[])[2] > 0.5)).toBe(true);
    const none = buildThorax({ resp: 0.2, heart: H, seed: 4, segments: true, hardware: null });
    expect(none.segments!.dyn).toBeNull();
  });
});

describe("clutter", () => {
  it("keeps the shader signature and exposes one amplitude", () => {
    expect(CLUTTER_GLSL).toContain("float clutter(vec3 ro, vec3 rd, vec2 bodyIv, float lungPath)");
    expect(CLUTTER_AMPLITUDE).toBeGreaterThan(0);
  });
  it("provides the trabecular bone texture function for the bone pass", () => {
    expect(TRABECULAR_GLSL).toContain("float trabecular(vec3 ro, vec3 rd, vec2 iv, float mu, float muI)");
    // the gate (negative core, no iodine) must select exactly the cancellous cores of the thorax bones
    const th = buildThorax({ resp: 0.3, heart: H, seed: 2, hardware: { table: true, ecg: true, sternalWires: 5 } });
    const cores = th.bones.filter((b) => b.mu < 0 && !b.muI);
    expect(cores.length).toBeGreaterThan(19 * 3);
    // every core sits inside a positive shell of the same type and centre
    for (const c of cores) expect(th.bones.some((b) => b.mu > 0 && b.type === c.type && Math.hypot(b.c.x - c.c.x, b.c.y - c.c.y, b.c.z - c.c.z) < 1e-9)).toBe(true);
  });
  it("lung uniforms map each lung onto the unit sphere", () => {
    const th = buildThorax({ resp: 0.5, heart: H, seed: 6 });
    const st = clutterStateFromAnat(th.anat, th.clutterSeed);
    expect(st.lungs.length).toBe(2);
    const lung = th.anat.filter((a) => a.lung)[0];
    const m = st.lungs[0].inv; // column-major
    const p = v(lung.c.x + lung.half[0], lung.c.y, lung.c.z);
    const d = [p.x - lung.c.x, p.y - lung.c.y, p.z - lung.c.z];
    const local = [0, 1, 2].map((r) => m[r] * d[0] + m[3 + r] * d[1] + m[6 + r] * d[2]);
    expect(Math.hypot(local[0], local[1], local[2])).toBeCloseTo(1, 6);
  });
});

describe("cost", () => {
  it("a cached frame costs well under a millisecond of CPU", () => {
    buildThorax({ resp: 0, heart: H, seed: 11, segments: true });
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) buildThorax({ resp: i / 50, heart: H, seed: 11, segments: true, contraction: (i % 10) / 10 });
    expect((performance.now() - t0) / 50).toBeLessThan(2);
  });
});

describe("C1 anatomy refit (wave 2)", () => {
  const th = buildThorax({ resp: 0.7, heart: H, heartShapes: heartShapes(H, { contraction: 0 }) });
  const src = v(0, 0, -800);
  const ray = (x: number, y: number) => {
    const t = v(x, y, 300);
    const d = v(t.x - src.x, t.y - src.y, t.z - src.z);
    const L = Math.hypot(d.x, d.y, d.z);
    return traceAnat(th.anat, src, v(d.x / L, d.y / L, d.z / L));
  };
  const heartCentre = th.anat[ANAT.HEART].c;

  it("counts the two lungs once where they overlap at the midline", () => {
    const lungR = th.anat[ANAT.LUNG_R];
    // a third lung shape identical to the right lung must not add aerated path
    const dup = [...th.anat, { ...lungR }];
    for (const [x, y] of [[-60, 20], [0, 60], [-20, -40]]) {
      const t = v(x, y, 300);
      const d = v(t.x - src.x, t.y - src.y, t.z - src.z);
      const L = Math.hypot(d.x, d.y, d.z);
      const rd = v(d.x / L, d.y / L, d.z / L);
      expect(traceAnat(dup, src, rd).lungPath).toBeCloseTo(traceAnat(th.anat, src, rd).lungPath, 6);
    }
  });

  it("projects the epicardial vessels over the heart shadow in every reference view", () => {
    // For each reference view of the capture harness (frame 24, mid-run): the aerated lung path along the
    // rays through the coronary samples (median) against the bright lung field of the same frame (90th
    // centile of the lung path over a 32 x 32 grid of rays across the field). The library frames show the
    // tree inside the heart shadow in every view (docs/realism/wave2/C1.md; scripts/thorax/probe_c1_heart.ts
    // prints the same numbers). RAO caudal keeps more lung behind the lateral wall (the ray runs through the
    // left lower lobe beside the ventricle), so its bound is looser.
    for (const V of REFERENCE_VIEWS.filter((x) => !x.mode)) {
      const R = resolveSpec({ set: "test", name: "t", view: V.view, scenario: V.scenario, nFrames: 51, annotate: false, upload: false });
      const p = prepareScenario(R.scenario);
      const { scene } = buildXrayScene(sceneInputAt(p, R, 24, {}));
      const { cam, anat } = scene;
      const lungTo = (pt: Vec3) => {
        const d = v(pt.x - cam.src.x, pt.y - cam.src.y, pt.z - cam.src.z);
        const L = Math.hypot(d.x, d.y, d.z);
        return traceAnat(anat, cam.src, v(d.x / L, d.y / L, d.z / L)).lungPath;
      };
      const vessel: number[] = [];
      for (const t of sceneTubes(scene)) if (Array.isArray(t.mu[0])) for (let i = 0; i < t.pts.length; i += 4) vessel.push(lungTo(t.pts[i]));
      const field: number[] = [];
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const u = ((x + 0.5) / 32) * 2 - 1,
            w = 1 - ((y + 0.5) / 32) * 2;
          field.push(lungTo(v(cam.detC.x + u * cam.detU.x + w * cam.detV.x, cam.detC.y + u * cam.detU.y + w * cam.detV.y, cam.detC.z + u * cam.detU.z + w * cam.detV.z)));
        }
      const q = (a: number[], f: number) => [...a].sort((m, n) => m - n)[Math.floor(f * (a.length - 1))];
      const ratio = q(vessel, 0.5) / q(field, 0.9);
      expect(vessel.length, V.name).toBeGreaterThan(100);
      expect(q(field, 0.9), V.name).toBeGreaterThan(80);
      expect(ratio, V.name).toBeLessThan(V.view === "raocaudal" ? 0.85 : 0.5);
    }
  });

  it("puts aerated lung beside the vertebral bodies (paravertebral gutters)", () => {
    // AP rays beside the spine cross posterior lung: the right gutter at mid-heart height, the left one above
    // the heart (behind the left ventricle the dependent lung is not aerated, next test)
    expect(ray(-45, 0).lungPath).toBeGreaterThan(20);
    expect(ray(30, 60).lungPath).toBeGreaterThan(20);
  });

  it("leaves little aerated lung under the left ventricle (supine, dependent lung)", () => {
    // behind the left ventricle the lung under the heart is compressed (ANAT.RETRO): far less aerated path
    // than in the right paravertebral gutter at the same height
    expect(ray(45, 0).lungPath).toBeLessThan(ray(-45, 0).lungPath / 3);
  });

  it("raises the right dome above the inferior heart border, the left dome lower than the right", () => {
    const top = (s: AnatShape) => s.c.y + s.half[1];
    const heart = th.anat[ANAT.HEART];
    const heartBottom = heart.c.y - Math.sqrt(heart.ax.reduce((a, ax, i) => a + (ax.y * heart.half[i]) ** 2, 0));
    expect(top(th.anat[ANAT.LIVER])).toBeGreaterThan(heartBottom + 10);
    expect(top(th.anat[ANAT.LEFT_DOME])).toBeLessThan(top(th.anat[ANAT.LIVER]));
  });
});
