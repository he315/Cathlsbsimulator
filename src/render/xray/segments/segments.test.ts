import { describe, it, expect } from "vitest";
import { SegmentBatchBuilder, tubesToSegments, segmentsFromScene, SEG_FLOATS, decodeHostSlot, encodeHostRange, PREV_FLOATS, encodeHostExt, expandHostSlot, HOST_RANGE_MAX, HOST_EXT_MAX, USER_PLANE, type SegmentBatch } from "./segmentPack";
import { roundConeInterval, integrateRay, integratePixel, thinValue, type RayContext } from "./integrator";
import { binSegments, binnerOptions, FLAG_SS } from "./tileBinner";
import { camInfo, rayThroughPixel, withDefaults, type SegmentConfig } from "./config";
import { buildThinLut, thinLookup, thinProfileExact, erfApprox, THIN_RHO_MAX, thinSigmaPx, DEFAULT_PSF, GAUSS_W15_PER_SIGMA } from "./thinLut";
import type { TubeSpec, XrayCamera } from "./types";
import type { Vec3 } from "../../../types";
import { type V, v, rng, sub, dot3, norm, segOf, insideCone, march, testCam, ctxFor, EXACT_ONLY, randomCone, rayNear } from "./testUtil";

// ---------------------------------------------------------------------------
describe("round cone interval (closed form)", () => {
  it("matches brute-force membership on random cones and rays (interval length within 0.5 %)", () => {
    const r = rng(11);
    let tested = 0,
      worst = 0;
    const out = [0, 0];
    for (let c = 0; c < 300; c++) {
      const cone = randomCone(r);
      const b = new SegmentBatchBuilder();
      const g = b.addGroup([1, 0, 0]);
      b.addSegment(g, v(...cone.p0), cone.r0, v(...cone.p1), cone.r1, 1, 1);
      const s = segOf(b.finish(), 0);
      const mid: V = [(cone.p0[0] + cone.p1[0]) / 2, (cone.p0[1] + cone.p1[1]) / 2, (cone.p0[2] + cone.p1[2]) / 2];
      for (let k = 0; k < 4; k++) {
        const { o, d } = rayNear(r, mid, 4);
        const tc = dot3(sub(mid, o), d);
        const oL: V = [o[0] + tc * d[0], o[1] + tc * d[1], o[2] + tc * d[2]];
        const hit = roundConeInterval(sub(oL, cone.p0), d, sub(cone.p1, cone.p0), cone.r0, cone.r1, out);
        const len = hit ? out[1] - out[0] : 0;
        // brute force: count inside samples over a window that contains the solid
        const span = Math.hypot(...sub(cone.p1, cone.p0)) + 2 * Math.max(cone.r0, cone.r1) + 1;
        const N = 4000;
        let inside = 0,
          first = Infinity,
          last = -Infinity;
        for (let i = 0; i < N; i++) {
          const t = -span + ((i + 0.5) * 2 * span) / N;
          const p: V = [oL[0] + t * d[0], oL[1] + t * d[1], oL[2] + t * d[2]];
          if (insideCone(p, s) >= 0) {
            inside++;
            first = Math.min(first, t);
            last = Math.max(last, t);
          }
        }
        const ref = (inside * 2 * span) / N;
        const h = (2 * span) / N;
        if (ref > 20 * h) {
          tested++;
          // the brute-force length is quantised to the sample spacing h
          const rel = Math.abs(len - ref) / ref;
          worst = Math.max(worst, rel - (2.5 * h) / ref);
          // convex: inside samples form one run
          expect(last - first + h).toBeCloseTo(ref, 6);
          if (hit) {
            expect(Math.abs(out[0] - first)).toBeLessThan(1.5 * h);
            expect(Math.abs(out[1] - last)).toBeLessThan(1.5 * h);
          }
        } else if (ref === 0) expect(len).toBeLessThan(3 * h);
      }
    }
    expect(tested).toBeGreaterThan(400);
    expect(worst).toBeLessThan(0.005);
  });

  it("end caps are spherical: a ray along the axis gets L + r0 + r1; an end-on segment is a round disc", () => {
    const out = [0, 0];
    // along the axis
    expect(roundConeInterval([0, 0, -50], [0, 0, 1], [0, 0, 3], 1.2, 0.7, out)).toBe(true);
    expect(out[1] - out[0]).toBeCloseTo(3 + 1.2 + 0.7, 9);
    // equal radii, rays parallel to the axis at distance d: path = L + 2 sqrt(r^2 - d^2) (two caps)
    for (const dd of [0, 0.3, 0.6, 0.9, 0.99]) {
      roundConeInterval([dd, 0, -50], [0, 0, 1], [0, 0, 3], 1, 1, out);
      expect(out[1] - out[0]).toBeCloseTo(3 + 2 * Math.sqrt(1 - dd * dd), 9);
    }
    // no square caps: beyond the radius there is nothing, at any azimuth
    for (let a = 0; a < 8; a++) {
      const x = 1.0001 * Math.cos(a),
        y = 1.0001 * Math.sin(a);
      expect(roundConeInterval([x, y, -50], [0, 0, 1], [0, 0, 3], 1, 1, out)).toBe(false);
    }
    // perpendicular ray past the end, inside the end sphere: chord of the sphere, not of a cylinder
    roundConeInterval([-50, 0, 3.5], [1, 0, 0], [0, 0, 3], 1, 1, out);
    expect(out[1] - out[0]).toBeCloseTo(2 * Math.sqrt(1 - 0.25), 9);
  });

  it("handles a sphere containing the other (degenerate cone) and zero length", () => {
    const out = [0, 0];
    expect(roundConeInterval([-50, 0, 0], [1, 0, 0], [0.2, 0, 0], 2, 0.5, out)).toBe(true);
    expect(out[1] - out[0]).toBeCloseTo(4, 9);
    expect(roundConeInterval([-50, 0.5, 0], [1, 0, 0], [0, 0, 0], 1, 1, out)).toBe(true);
    expect(out[1] - out[0]).toBeCloseTo(2 * Math.sqrt(0.75), 9);
  });
});

// ---------------------------------------------------------------------------
/**
 * Random vessel-like trees as renderer tubes: a wandering chain whose radius drifts by up to
 * 10 % per sample and turns by up to 0.5 rad per sample, with sample spacing 0.8-2.5 mm
 * (spacing below the radius, as in the coronary tree), concentration drifting by up to 15 %, and
 * sometimes a branch leaving from one of its samples. Returns the tubes and, per segment of
 * tubesToSegments(tubes), the tree it belongs to (for the union reference).
 */
function randomTrees(r: () => number, nTrees: number, spread = 6) {
  const tubes: TubeSpec[] = [];
  const treeOfTube: number[] = [];
  for (let tr = 0; tr < nTrees; tr++) {
    const mu: [number, number, number] = [r() < 0.5 ? 0.02 : 0, 0.2 + r(), r() < 0.3 ? 1 : 0];
    const pts: Vec3[] = [];
    const rad: number[] = [];
    const conc: number[] = [];
    let p: V = [(r() - 0.5) * spread, (r() - 0.5) * spread, (r() - 0.5) * spread];
    let dir = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
    let rr = 0.5 + r() * 1.3;
    let cc = 0.6 + r() * 0.8;
    const nS = 4 + Math.floor(r() * 8);
    for (let i = 0; i < nS; i++) {
      pts.push(v(...p));
      rad.push(rr);
      conc.push(cc);
      // turn by an angle up to 0.5 rad about a random perpendicular axis
      const rnd = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      const perp = norm(sub(rnd, dir.map((x) => x * dot3(rnd, dir)) as V));
      const ang = r() * 0.5;
      dir = norm([dir[0] * Math.cos(ang) + perp[0] * Math.sin(ang), dir[1] * Math.cos(ang) + perp[1] * Math.sin(ang), dir[2] * Math.cos(ang) + perp[2] * Math.sin(ang)]);
      const step = 0.8 + r() * 1.7;
      p = [p[0] + dir[0] * step, p[1] + dir[1] * step, p[2] + dir[2] * step];
      rr = Math.min(2, Math.max(0.3, rr * (1 + (r() - 0.5) * 0.2)));
      cc = cc * (1 + (r() - 0.5) * 0.3);
    }
    tubes.push({ pts, r: rad, mu: conc.map((c) => [mu[0] * c, mu[1] * c, mu[2] * c] as [number, number, number]) });
    treeOfTube.push(tr);
    if (r() < 0.6) {
      const at = 1 + Math.floor(r() * (nS - 2));
      const a = pts[at];
      const pd = norm(sub([pts[at + 1].x, pts[at + 1].y, pts[at + 1].z], [a.x, a.y, a.z]));
      const rnd = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      const perp = norm(sub(rnd, pd.map((x) => x * dot3(rnd, pd)) as V));
      const ang = 0.5 + r() * 0.9; // 30-80 degrees
      const bd: V = norm([pd[0] * Math.cos(ang) + perp[0] * Math.sin(ang), pd[1] * Math.cos(ang) + perp[1] * Math.sin(ang), pd[2] * Math.cos(ang) + perp[2] * Math.sin(ang)]);
      const r0 = rad[at] * (0.5 + r() * 0.3);
      const bp: Vec3[] = [a];
      for (let k = 1; k <= 4; k++) bp.push(v(a.x + bd[0] * 1.5 * k, a.y + bd[1] * 1.5 * k, a.z + bd[2] * 1.5 * k));
      const c0 = conc[at];
      tubes.push({ pts: bp, r: bp.map((_, k) => r0 * (1 - 0.05 * k)), mu: bp.map((_, k) => [mu[0] * c0 * (1 - 0.03 * k), mu[1] * c0 * (1 - 0.03 * k), mu[2] * c0 * (1 - 0.03 * k)] as [number, number, number]) });
      treeOfTube.push(tr);
    }
  }
  const segTree: number[] = [];
  tubes.forEach((t, i) => {
    for (let k = 0; k < Math.max(1, t.pts.length - 1); k++) segTree.push(treeOfTube[i]);
  });
  return { tubes, segTree };
}

describe("union integral against ray marching", () => {
  it("random vessel trees (chains with taper, bends and branches): geometry exact, concentration attribution small", () => {
    const r = rng(5);
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    // geometry: each tree at one constant concentration; attribution: concentration drifting
    // along the vessels (inside an overlap the integrator uses the higher-priority member's
    // concentration, the reference the nearer axis's, so these differ by design)
    const errs = { geom: [] as number[], conc: [] as number[] };
    for (let scene = 0; scene < 60; scene++) {
      const { tubes, segTree } = randomTrees(r, 1 + Math.floor(r() * 3));
      const unit = tubes.map((t) => {
        const m = (t.mu as [number, number, number][])[0];
        const l = Math.hypot(m[0], m[1], m[2]);
        return { ...t, mu: [m[0] / l, m[1] / l, m[2] / l] as [number, number, number] };
      });
      const rays = Array.from({ length: 10 }, () => rayNear(r, [0, 0, 0], 8));
      for (const [kind, set] of [["conc", tubes], ["geom", unit]] as const) {
        const batch = tubesToSegments(set);
        expect(batch.count).toBe(segTree.length);
        for (const { o, d } of rays) {
          const tc = dot3(sub([0, 0, 0], o), d);
          const res = integrateRay(batch, null, 0, 0, o, d, d, ctx).P;
          let ref = march(batch, o, d, tc - 30, tc + 30, 4000, (i) => segTree[i]);
          const tot = Math.abs(ref[0]) + Math.abs(ref[1]) + Math.abs(ref[2]);
          if (tot < 0.05) continue;
          const errOf = (q: V) => (Math.abs(res[0] - q[0]) + Math.abs(res[1] - q[1]) + Math.abs(res[2] - q[2])) / tot;
          // a disagreement is re-marched 8x finer (several boundaries in one reference step)
          if (errOf(ref) > 0.005) ref = march(batch, o, d, tc - 30, tc + 30, 32000, (i) => segTree[i]);
          errs[kind].push(errOf(ref));
        }
      }
    }
    const q = (e: number[], f: number) => e[Math.min(e.length - 1, Math.floor(e.length * f))];
    for (const k of ["geom", "conc"] as const) {
      const e = errs[k].sort((a, b) => a - b);
      // eslint-disable-next-line no-console
      console.log(`union vs ray marching (${k === "geom" ? "constant concentration" : "drifting concentration"}): ${e.length} rays, median ${(q(e, 0.5) * 100).toFixed(3)} %, p95 ${(q(e, 0.95) * 100).toFixed(3)} %, p99 ${(q(e, 0.99) * 100).toFixed(3)} %, worst ${(e[e.length - 1] * 100).toFixed(3)} %`);
      expect(e.length).toBeGreaterThan(150);
    }
    const g = errs.geom,
      c = errs.conc;
    expect(q(g, 0.95)).toBeLessThan(0.002);
    expect(q(g, 0.99)).toBeLessThan(0.005);
    expect(g[g.length - 1]).toBeLessThan(0.01);
    expect(q(c, 0.95)).toBeLessThan(0.005);
    expect(c[c.length - 1]).toBeLessThan(0.03);
  });

  it("does not double count at joints: a straight chain equals one long capsule", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const b1 = new SegmentBatchBuilder();
    const g1 = b1.addGroup([0, 1, 0]);
    const pts: Vec3[] = [];
    for (let i = 0; i <= 10; i++) pts.push(v(-5 + i, 0, 0));
    b1.addChain(g1, pts, pts.map(() => 1), 1);
    const chain = b1.finish();
    const b2 = new SegmentBatchBuilder();
    const g2 = b2.addGroup([0, 1, 0]);
    b2.addSegment(g2, v(-5, 0, 0), 1, v(5, 0, 0), 1, 1, 1);
    const one = b2.finish();
    const r = rng(3);
    for (let k = 0; k < 200; k++) {
      const { o, d } = rayNear(r, [0, 0, 0], 4);
      const a = integrateRay(chain, null, 0, 0, o, d, d, ctx).P[1];
      const c = integrateRay(one, null, 0, 0, o, d, d, ctx).P[1];
      expect(a).toBeCloseTo(c, 6);
    }
  });

  it("a bent constant-radius chain is near-exact at its joints (bisector partition)", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const pts: Vec3[] = [];
    // an arc of radius 8 mm sampled every 1 mm, tube radius 1.5 mm
    for (let i = 0; i <= 12; i++) pts.push(v(8 * Math.cos(i / 8), 8 * Math.sin(i / 8), 0));
    const batch = tubesToSegments([{ pts, r: pts.map(() => 1.5), mu: [0, 1, 0] }]);
    const r = rng(17);
    let worst = 0;
    for (let k = 0; k < 60; k++) {
      const { o, d } = rayNear(r, [6, 4, 0], 6);
      const tc = dot3(sub([6, 4, 0], o), d);
      const a = integrateRay(batch, null, 0, 0, o, d, d, ctx).P[1];
      const ref = march(batch, o, d, tc - 15, tc + 15, 3000, () => 0)[1];
      if (ref > 0.05) worst = Math.max(worst, Math.abs(a - ref) / ref);
    }
    expect(worst).toBeLessThan(5e-3);
  });

  it("bifurcation origin: no dark dot (at most the larger chord + 1 %), and no gap", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    // parent along x, child leaving from the parent's sample at x = 0 at 60 degrees
    const parent: TubeSpec = { pts: [v(-6, 0, 0), v(-3, 0, 0), v(0, 0, 0), v(3, 0, 0), v(6, 0, 0)], r: [1.5, 1.5, 1.5, 1.4, 1.4], mu: [0, 0.2, 0] };
    const cd = [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), 0];
    const child: TubeSpec = { pts: [0, 1, 2, 4, 6].map((s) => v(cd[0] * s, cd[1] * s, 0)), r: [1.1, 1.05, 1.0, 0.95, 0.9], mu: [0, 0.2, 0] };
    const joined = tubesToSegments([parent, child]);
    // the child's first segment carries the parent's segments either side of the branch point
    // (slot A, one range)
    const [hf, hc] = decodeHostSlot(joined.data[4 * SEG_FLOATS + 19]);
    expect(hf).toBeLessThanOrEqual(1);
    expect(hf + hc - 1).toBeGreaterThanOrEqual(2);
    const separate = tubesToSegments([parent, child], { autoJoin: false });
    const pOnly = tubesToSegments([parent]);
    const cOnly = tubesToSegments([child]);
    const r = rng(9);
    let doubled = 0,
      worst = 0;
    for (let k = 0; k < 150; k++) {
      const { o, d } = rayNear(r, [0.3, 0.3, 0], 2.5);
      const u = integrateRay(joined, null, 0, 0, o, d, d, ctx).P[1];
      const s = integrateRay(separate, null, 0, 0, o, d, d, ctx).P[1];
      const tc = dot3(sub([0, 0, 0], o), d);
      const ref = march(joined, o, d, tc - 12, tc + 12, 2000, () => 0)[1];
      if (ref > 0.02) worst = Math.max(worst, Math.abs(u - ref) / ref);
      if (s > u + 1e-6) doubled++;
    }
    expect(worst).toBeLessThan(0.01);
    expect(doubled).toBeGreaterThan(8); // separate tubes do double count here
    // straight down through the branch point: at most the larger single chord
    const o: V = [0, 0, 400];
    const dd: V = [0, 0, -1];
    const u0 = integrateRay(joined, null, 0, 0, o, dd, dd, ctx).P[1];
    const a0 = integrateRay(pOnly, null, 0, 0, o, dd, dd, ctx).P[1];
    const c0 = integrateRay(cOnly, null, 0, 0, o, dd, dd, ctx).P[1];
    expect(u0).toBeLessThanOrEqual(Math.max(a0, c0) * 1.01);
    expect(u0).toBeGreaterThanOrEqual(Math.max(a0, c0) * 0.99);
  });

  it("depth complexity is unbounded: 300 coincident-pixel segments add exactly", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const b = new SegmentBatchBuilder();
    const g = b.addGroup([0, 1, 0]);
    // 300 separate short capsules stacked along the beam, each a disc of path 2 r end-on
    for (let i = 0; i < 300; i++) b.addSegment(g, v(0, 0, -150 + i), 0.3, v(0.4, 0, -150 + i), 0.3, 1, 1);
    const batch = b.finish();
    const P = integrateRay(batch, null, 0, 0, [0.2, 0, 400], [0, 0, -1], [0, 0, -1], ctx).P[1];
    expect(P).toBeCloseTo(300 * 0.6, 4); // float32 storage of the radius
  });
});

describe("real coronary tree", () => {
  // The synthetic patient's tree (CASE_LIBRARY[0]) as tubes with constant concentration, linked by
  // the tree's own parent relation. The reference is boundary-refined ray marching with a step of
  // at most 0.12 of the smallest radius near the ray, over every segment near it; members of one
  // family (a coronary tree) form one union, different families add (as in the integrator).
  type Setup = { batch: SegmentBatch; tubes: TubeSpec[]; names: string[]; par: ({ tube: number; at: number } | null)[]; first: number[]; segTube: Int32Array; root: number[] };
  let S: Setup | null = null;
  const setup = async (): Promise<Setup> => {
    if (S) return S;
    const { buildAnatomy } = await import("../../../simulation/anatomy");
    const { CASE_LIBRARY } = await import("../../../simulation/caseGenerator");
    const { buildCoronaryTree, samplePos } = await import("../coronaryTree");
    const cs = CASE_LIBRARY[0];
    const tree = buildCoronaryTree(buildAnatomy(cs), cs);
    const tubes: TubeSpec[] = tree.vessels.map((vv) => ({ pts: vv.samples.map((sm) => samplePos(tree.heart, sm)), r: vv.radii, mu: [0, 0.2, 0] as [number, number, number] }));
    const idx = new Map(tree.vessels.map((vv, i) => [vv.name, i]));
    const par = tree.vessels.map((vv) => (vv.parent && idx.has(vv.parent.name) ? { tube: idx.get(vv.parent.name)!, at: vv.parent.index } : null));
    const batch = tubesToSegments(tubes, { parentOf: (_t, i) => par[i] });
    const first: number[] = [];
    const segTube = new Int32Array(batch.count);
    let acc = 0;
    tubes.forEach((t, i) => {
      first.push(acc);
      const n = Math.max(1, t.pts.length - 1);
      segTube.fill(i, acc, acc + n);
      acc += n;
    });
    const root = tubes.map((_, t) => {
      let r = t;
      for (let k = 0; par[r] && k < tubes.length; k++) r = par[r]!.tube;
      return r;
    });
    S = { batch, tubes, names: tree.vessels.map((vv) => vv.name), par, first, segTube, root };
    return S;
  };

  /** Integrator against the family-union reference for one ray; also how a failing ray fails. */
  function compareRay(s: Setup, o: V, d: V, ctx: RayContext) {
    const { batch, segTube, root } = s;
    const near: number[] = [];
    let ta = Infinity,
      tb = -Infinity,
      minR = Infinity;
    for (let i = 0; i < batch.count; i++) {
      const sg = segOf(batch, i);
      const reach = Math.max(sg.r0, sg.r1) + Math.hypot(...sub(sg.p1, sg.p0)) + 0.1;
      for (const e of [sg.p0, sg.p1]) {
        const q = sub(e, o);
        const t = dot3(q, d);
        if (dot3(q, q) - t * t < reach * reach) {
          if (near[near.length - 1] !== i) near.push(i);
          ta = Math.min(ta, t - 5);
          tb = Math.max(tb, t + 5);
          minR = Math.min(minR, sg.r0, sg.r1);
        }
      }
    }
    if (!near.length) return null;
    const sb: SegmentBatch = { ...batch, count: near.length, data: new Float32Array(near.length * SEG_FLOATS) };
    near.forEach((i, j) => sb.data.set(batch.data.subarray(i * SEG_FLOATS, (i + 1) * SEG_FLOATS), j * SEG_FLOATS));
    let step = Math.min(0.05, 0.12 * minR);
    let ref = march(sb, o, d, ta, tb, Math.ceil((tb - ta) / step), (j) => root[segTube[near[j]]])[1];
    const res = integrateRay(batch, near, 0, near.length, o, d, d, ctx).P[1];
    if (ref > 0 && Math.abs(res - ref) / ref > 0.005) {
      // the reference refines one boundary per step; where several fall in one step (a grazing ray
      // past a joint) it errs by up to a few per cent, so a disagreement is re-marched 8x finer
      step /= 8;
      ref = march(sb, o, d, ta, tb, Math.ceil((tb - ta) / step), (j) => root[segTube[near[j]]])[1];
    }
    return { ref, res, err: ref > 0 ? Math.abs(res - ref) / ref : 0, near, ta, tb, step };
  }

  /** Does the ray pass through two same-family segments of different tubes that do not list each other? */
  function unresolvedOnRay(s: Setup, near: number[], o: V, d: V, ta: number, tb: number, step: number) {
    const lists = (i: number, j: number) => [19, 23, 15].some((off) => expandHostSlot(s.batch.data[i * SEG_FLOATS + off], s.batch.hostExtra).includes(j));
    const segs = near.map((i) => segOf(s.batch, i));
    for (let t = ta; t < tb; t += step) {
      const p: V = [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];
      const inside = near.filter((_, k) => insideCone(p, segs[k]) >= 0);
      for (let a = 0; a < inside.length; a++)
        for (let b = a + 1; b < inside.length; b++) {
          const i = inside[a],
            j = inside[b];
          const ti = s.segTube[i],
            tj = s.segTube[j];
          if (s.root[ti] !== s.root[tj]) continue;
          if (ti === tj ? Math.abs(i - j) > 8 && !lists(i, j) && !lists(j, i) : !lists(i, j) && !lists(j, i)) return true;
        }
    }
    return false;
  }

  const quant = (e: number[], f: number) => e[Math.min(e.length - 1, Math.floor(e.length * f))];
  const pct = (x: number) => (x * 100).toFixed(3);

  it("random rays through the tree: union geometry against ray marching (median, p95, p99, worst)", async () => {
    const s = await setup();
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const pts = s.tubes.flatMap((t) => t.pts);
    const r = rng(3);
    const errs: number[] = [];
    let unresolved = 0,
      partition = 0;
    for (let k = 0; k < 1500; k++) {
      const P = pts[Math.floor(r() * pts.length)];
      const d = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      const aim: V = [P.x + (r() - 0.5) * 3, P.y + (r() - 0.5) * 3, P.z + (r() - 0.5) * 3];
      const o: V = [aim[0] - 400 * d[0], aim[1] - 400 * d[1], aim[2] - 400 * d[2]];
      const c = compareRay(s, o, d, ctx);
      if (!c || c.ref < 0.02) continue;
      if (c.err > 0.01) {
        // classify: an overlap the host slots do not cover (a generator artefact: see the notes),
        // or the joint partition's own approximation
        if (unresolvedOnRay(s, c.near, o, d, c.ta, c.tb, c.step)) {
          unresolved++;
          continue;
        }
        partition++;
      }
      errs.push(c.err);
    }
    errs.sort((a, b) => a - b);
    // eslint-disable-next-line no-console
    console.log(
      `real tree, random rays: ${errs.length} rays, median ${pct(quant(errs, 0.5))} %, p95 ${pct(quant(errs, 0.95))} %, p99 ${pct(quant(errs, 0.99))} %, worst ${pct(errs[errs.length - 1])} %; ` +
        `over 1 %: ${partition} joint partition, ${unresolved} through unresolved overlaps (excluded); batch.unresolvedOverlaps ${s.batch.unresolvedOverlaps}`
    );
    expect(errs.length).toBeGreaterThan(600);
    expect(quant(errs, 0.5)).toBeLessThan(0.001);
    expect(quant(errs, 0.95)).toBeLessThan(0.005);
    expect(quant(errs, 0.99)).toBeLessThan(0.02);
    expect(unresolved).toBeLessThanOrEqual(3);
    expect(errs[errs.length - 1]).toBeLessThan(0.05);
  }, 300000);

  it("branch origins: three rays through the first segments of every branch match ray marching (p99 under 2 %)", async () => {
    const s = await setup();
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const r = rng(11);
    const rows: { err: number; name: string }[] = [];
    for (let c = 0; c < s.tubes.length; c++)
    for (let rep = 0; rep < 3; rep++) {
      if (!s.par[c] || s.tubes[c].pts.length < 2) continue;
      // the first segment (twice) and the second
      const sg = segOf(s.batch, s.first[c] + (rep === 2 && s.tubes[c].pts.length > 2 ? 1 : 0));
      const f = r();
      const P: V = [sg.p0[0] + f * (sg.p1[0] - sg.p0[0]), sg.p0[1] + f * (sg.p1[1] - sg.p0[1]), sg.p0[2] + f * (sg.p1[2] - sg.p0[2])];
      const d = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      const rr = sg.r0 * 0.9;
      const aim: V = [P[0] + (r() - 0.5) * rr, P[1] + (r() - 0.5) * rr, P[2] + (r() - 0.5) * rr];
      const o: V = [aim[0] - 400 * d[0], aim[1] - 400 * d[1], aim[2] - 400 * d[2]];
      const cmp = compareRay(s, o, d, ctx);
      if (!cmp || cmp.ref < 0.02) continue;
      rows.push({ err: cmp.err, name: s.names[c] });
    }
    const errs = rows.map((x) => x.err).sort((a, b) => a - b);
    const worst = rows.reduce((a, b) => (b.err > a.err ? b : a));
    // eslint-disable-next-line no-console
    console.log(`real tree, branch origins: ${errs.length} rays, median ${pct(quant(errs, 0.5))} %, p95 ${pct(quant(errs, 0.95))} %, p99 ${pct(quant(errs, 0.99))} %, worst ${pct(worst.err)} % (${worst.name})`);
    expect(errs.length).toBeGreaterThan(450);
    expect(quant(errs, 0.95)).toBeLessThan(0.01);
    expect(quant(errs, 0.99)).toBeLessThan(0.02);
    expect(worst.err).toBeLessThan(0.04);
  }, 300000);
});

describe("hollow shells, ellipses and the laminar profile", () => {
  it("catheter wall: outer minus inner union is the analytic shell chord", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const pts = [v(-10, 0, 0), v(-5, 0, 0), v(0, 0, 0), v(5, 0, 0), v(10, 0, 0)];
    const Ro = 1.0,
      Ri = 0.68;
    const batch = tubesToSegments([
      { pts, r: pts.map(() => Ro), mu: [0, 0.32, 0] },
      { pts, r: pts.map(() => Ri), mu: [0, -0.32, 0] },
    ]);
    expect(batch.groups.length).toBe(2);
    expect(batch.groups[0].featureMm).toBeCloseTo(Ro - Ri, 6);
    for (let k = 0; k <= 50; k++) {
      const y = (k / 50) * 1.1;
      const o: V = [0.37, y, 300];
      const d: V = [0, 0, -1];
      const P = integrateRay(batch, null, 0, 0, o, d, d, ctx).P[1];
      const ch = (R: number) => (y < R ? 2 * Math.sqrt(R * R - y * y) : 0);
      expect(P).toBeCloseTo(0.32 * (ch(Ro) - ch(Ri)), 6);
    }
    // the tram-track: lumen centre lighter than the wall edge
    const at = (y: number) => integrateRay(batch, null, 0, 0, [0, y, 300], [0, 0, -1], [0, 0, -1], ctx).P[1];
    expect(at(0.7)).toBeGreaterThan(2 * at(0));
  });

  it("a hollow tube (catheter, stent) is open at its cut ends: no dome, flat rim", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const pts = [v(0, 0, -10), v(0, 0, -5), v(0, 0, 0)];
    const batch = tubesToSegments([
      { pts, r: pts.map(() => 1.0), mu: [0, 0.32, 0] },
      { pts, r: pts.map(() => 0.68), mu: [0, -0.32, 0] },
    ]);
    const along = (x: number) => integrateRay(batch, null, 0, 0, [x, 0, 400], [0, 0, -1], [0, 0, -1], ctx).P[1];
    // looking down the bore: the lumen is empty, the wall is the full 10 mm of tube
    expect(along(0)).toBeCloseTo(0, 6);
    expect(along(0.85)).toBeCloseTo(0.32 * 10, 4);
    // just beyond the cut end, across the axis: nothing (a capped tube would show its dome here)
    const beyond = integrateRay(batch, null, 0, 0, [-400, 0, 0.3], [1, 0, 0], [1, 0, 0], ctx).P[1];
    expect(beyond).toBeCloseTo(0, 9);
  });

  it("elliptical (flattened) sections match brute force", () => {
    const r = rng(21);
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    let worst = 0;
    for (let c = 0; c < 20; c++) {
      const b = new SegmentBatchBuilder();
      const g = b.addGroup([1, 0, 0]);
      const cone = randomCone(r);
      const thin = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      b.addSegment(g, v(...cone.p0), cone.r0 + 0.5, v(...cone.p1), cone.r1 + 0.5, 1, 1, { thinDir: v(...thin), thinRatio: 0.3 + r() * 0.6 });
      const batch = b.finish();
      for (let k = 0; k < 5; k++) {
        const { o, d } = rayNear(r, cone.p0, 2);
        const tc = dot3(sub(cone.p0, o), d);
        const P = integrateRay(batch, null, 0, 0, o, d, d, ctx).P[0];
        const ref = march(batch, o, d, tc - 12, tc + 12, 12000)[0];
        if (ref > 0.1) worst = Math.max(worst, Math.abs(P - ref) / ref);
      }
    }
    expect(worst).toBeLessThan(0.01);
  });

  it("laminar profile: chord integral 2h (1 - k (d^2 + h^2/3) / R^2)", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const R = 1.5;
    for (const k of [0, 0.4, 1]) {
      const b = new SegmentBatchBuilder();
      const g = b.addGroup([0, 1, 0]);
      b.addSegment(g, v(-20, 0, 0), R, v(20, 0, 0), R, 1, 1, { k });
      const batch = b.finish();
      for (const dd of [0, 0.5, 1.0, 1.4]) {
        const h = Math.sqrt(R * R - dd * dd);
        const P = integrateRay(batch, null, 0, 0, [1, dd, 300], [0, 0, -1], [0, 0, -1], ctx).P[1];
        expect(P).toBeCloseTo(2 * h * (1 - (k * (dd * dd + (h * h) / 3)) / (R * R)), 6);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe("thin-object path", () => {
  const lut = buildThinLut();

  it("erf approximation is within 2e-7 of direct integration", () => {
    for (let x = -3; x <= 3; x += 0.25) {
      let s = 0;
      const n = 4000;
      for (let i = 0; i < n; i++) {
        const u = ((i + 0.5) * x) / n;
        s += Math.exp(-u * u);
      }
      const ref = ((2 / Math.sqrt(Math.PI)) * s * x) / n;
      expect(Math.abs(erfApprox(x) - ref)).toBeLessThan(2e-7);
    }
  });

  it("the LUT reproduces the blurred chord (max error under 1 % of the peak) and integrates to 1", () => {
    const r = rng(4);
    for (let k = 0; k < 300; k++) {
      const rho = r() * (THIN_RHO_MAX - 0.01);
      const x = r() * (rho + 3.5);
      const exact = rho > 1e-3 ? thinProfileExact(x, rho, 800) / (Math.PI * rho * rho) : Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
      const peak = rho > 1e-3 ? thinProfileExact(0, rho, 800) / (Math.PI * rho * rho) : 1 / Math.sqrt(2 * Math.PI);
      expect(Math.abs(thinLookup(lut, x, rho) - exact)).toBeLessThan(0.01 * peak);
    }
    for (const rho of [0, 0.3, 1, 2.5, 5, 7.9]) {
      let s = 0;
      const h = 0.002;
      for (let x = -rho - 6; x <= rho + 6; x += h) s += thinLookup(lut, x, rho) * h;
      expect(s).toBeCloseTo(1, 2);
    }
  });

  it("conserves the integral: pi r^2 L c over the image, any obliquity", () => {
    const cam = testCam(200);
    const res = 768;
    const ci = camInfo(cam, res);
    const cfg = withDefaults({ thinLoPx: 50, thinHiPx: 60 }); // everything thin
    const r = rng(8);
    for (let k = 0; k < 6; k++) {
      const dir = norm([r() - 0.5, r() - 0.5, (r() - 0.5) * 2]);
      const L = 6 + r() * 6;
      const rad = 0.1 + r() * 0.15;
      const p0: V = [(-dir[0] * L) / 2, (-dir[1] * L) / 2, (-dir[2] * L) / 2];
      const b: V = [dir[0] * L, dir[1] * L, dir[2] * L];
      const mag = ci.sid / 760;
      const sigO = (thinSigmaPx(cfg.psf, 760, ci.sid, ci.mmPerPx) * ci.mmPerPx) / mag;
      // integrate over the detector plane, converting pixel area to the object plane
      let s = 0;
      const pxObj = ci.mmPerPx / mag;
      const half = Math.ceil((L * mag) / ci.mmPerPx / 2 + 12);
      const d = [0, 0, 0];
      for (let py = res / 2 - half; py < res / 2 + half; py++)
        for (let px = res / 2 - half; px < res / 2 + half; px++) {
          rayThroughPixel(ci, px + 0.5, py + 0.5, d);
          const tc = dot3(sub([0, 0, 0], ci.src), d);
          const w: V = [ci.src[0] + tc * d[0] - p0[0], ci.src[1] + tc * d[1] - p0[1], ci.src[2] + tc * d[2] - p0[2]];
          s += thinValue(w, d, b, L, rad, rad, 1, 1, 0, sigO, lut);
        }
      // the projected footprint of a pixel in the plane through the centre, perpendicular to the beam
      const ref = Math.PI * rad * rad * L;
      expect(Math.abs((s * pxObj * pxObj) / ref - 1)).toBeLessThan(0.02);
    }
  });

  it("a 0.014 inch wire shows under 2 % integral variation along its length (no beading)", () => {
    const cam = testCam(200);
    const res = 768;
    const ctx = ctxFor(cam, res); // default thin band: the wire is thin
    const b = new SegmentBatchBuilder();
    const g = b.addGroup([0, 0, 1.9]);
    // slanted wire through the iso plane, sampled every 1.2 mm like the PCI wire
    const pts: Vec3[] = [];
    const ang = 0.37;
    for (let s = -40; s <= 40; s += 1.2) pts.push(v(s * Math.cos(ang), s * Math.sin(ang), 0));
    b.addChain(g, pts, pts.map(() => 0.178), 1);
    const batch = b.finish();
    const bins = binSegments(batch, cam, res, ctx.cfg);
    // integral across the wire, per image column, over the middle of the wire
    const ci = ctx.ci;
    const mag = ci.sid / 760;
    const rpx = (0.178 * mag) / ci.mmPerPx;
    expect(rpx).toBeGreaterThan(0.7);
    expect(rpx).toBeLessThan(1.0);
    const sums: number[] = [];
    for (let px = res / 2 - 60; px < res / 2 + 60; px++) {
      const xmm = ((px + 0.5) / res - 0.5) * 200; // detector mm
      const yc = res / 2 + ((xmm * Math.tan(ang)) / 200) * res;
      let s = 0;
      for (let py = Math.floor(yc) - 10; py <= Math.floor(yc) + 10; py++) s += integratePixel(batch, bins, px, py, ctx)[2];
      sums.push(s);
    }
    const mean = sums.reduce((a, c) => a + c, 0) / sums.length;
    const dev = Math.max(...sums.map((x) => Math.abs(x / mean - 1)));
    expect(dev).toBeLessThan(0.02);
    // and its integral is the wire's (pi r^2 per mm of wire, mu 1.9), per column of width 1 px
    const colObj = ci.mmPerPx / mag; // object-plane column width
    const expectPerCol = (1.9 * Math.PI * 0.178 * 0.178 * colObj) / Math.cos(ang) / (colObj * colObj);
    expect(Math.abs(mean / expectPerCol - 1)).toBeLessThan(0.02);
  });

  it("default focal sigma is the 0.6 nominal spot read as a 15 % width", () => {
    expect(GAUSS_W15_PER_SIGMA).toBeCloseTo(3.896, 3);
    expect(DEFAULT_PSF.focalSigmaMm).toBeCloseTo(0.154, 3);
  });
});

// ---------------------------------------------------------------------------
describe("tile binning", () => {
  function randomScene(seed: number, nChains: number): SegmentBatch {
    const r = rng(seed);
    const b = new SegmentBatchBuilder();
    for (let c = 0; c < nChains; c++) {
      const g = b.addGroup([0, 0.2, r() < 0.3 ? 1 : 0]);
      const pts: Vec3[] = [];
      let p: V = [(r() - 0.5) * 120, (r() - 0.5) * 120, (r() - 0.5) * 60];
      let dir = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
      const n = 4 + Math.floor(r() * 30);
      const rad: number[] = [];
      for (let i = 0; i < n; i++) {
        pts.push(v(...p));
        rad.push(r() < 0.3 ? 0.1 + r() * 0.2 : 0.3 + r() * 2);
        dir = norm([dir[0] + (r() - 0.5) * 0.8, dir[1] + (r() - 0.5) * 0.8, dir[2] + (r() - 0.5) * 0.8]);
        const st = 0.5 + r() * 3;
        p = [p[0] + dir[0] * st, p[1] + dir[1] * st, p[2] + dir[2] * st];
      }
      b.addChain(g, pts, rad, 1);
    }
    return b.finish();
  }

  it("brute force: no pixel is missing a segment that contributes to it", () => {
    const cam = testCam(200);
    const res = 256;
    for (const seed of [1, 2, 3]) {
      const batch = randomScene(seed, 30);
      const cfg = withDefaults({});
      const bins = binSegments(batch, cam, res, cfg);
      const ctx = { ci: camInfo(cam, res), cfg, lut: buildThinLut() };
      let missing = 0,
        checked = 0;
      // per segment alone: every pixel where it contributes must list it
      const listed = (px: number, py: number, i: number) => {
        const t = Math.floor(py / bins.tile) * bins.tilesX + Math.floor(px / bins.tile);
        const off = bins.header[t * 2],
          cnt = bins.header[t * 2 + 1] & 0xffffff;
        for (let k = 0; k < cnt; k++) if (bins.index[off + k] === i) return true;
        return false;
      };
      for (let i = 0; i < batch.count; i += 3) {
        const one: SegmentBatch = { ...batch, count: 1, data: batch.data.slice(i * SEG_FLOATS, (i + 1) * SEG_FLOATS) };
        one.data[11] = 0;
        one.data[19] = -1;
        one.data[23] = -1;
        one.groups = [batch.groups[batch.data[i * SEG_FLOATS + 11] | 0]];
        const solo = binSegments(one, cam, res, cfg);
        // contributions anywhere on screen, with an all-covering list
        const all = new Uint32Array([0]);
        // search window: the projected ends +- 40 px (radii here are at most 15 px)
        const ci = ctx.ci;
        const pr = (x: number, y: number, z: number) => {
          const dz = z - ci.src[2];
          const mag = ci.sid / -dz;
          return [((mag * x) / 100 + 1) * 0.5 * res, ((mag * y) / 100 + 1) * 0.5 * res];
        };
        const o16 = i * SEG_FLOATS;
        const e0 = pr(batch.data[o16], batch.data[o16 + 1], batch.data[o16 + 2]);
        const e1 = pr(batch.data[o16 + 4], batch.data[o16 + 5], batch.data[o16 + 6]);
        const wx0 = Math.max(0, Math.floor(Math.min(e0[0], e1[0]) - 40)),
          wx1 = Math.min(res - 1, Math.ceil(Math.max(e0[0], e1[0]) + 40));
        const wy0 = Math.max(0, Math.floor(Math.min(e0[1], e1[1]) - 40)),
          wy1 = Math.min(res - 1, Math.ceil(Math.max(e0[1], e1[1]) + 40));
        for (let py = wy0; py <= wy1; py += 1)
          for (let px = wx0; px <= wx1; px += 1) {
            const t = Math.floor(py / solo.tile) * solo.tilesX + Math.floor(px / solo.tile);
            // evaluate the solo segment at this pixel as if listed (sub-samples like the shader)
            const hdr = new Uint32Array([0, 1 | (solo.header[t * 2 + 1] & 0xff000000) | (FLAG_SS << 24)]);
            const fake = { ...solo, tilesX: 1, tilesY: 1, tile: 4096, header: hdr, index: all };
            const P = integratePixel(one, fake, px, py, ctx);
            if (Math.abs(P[0]) + Math.abs(P[1]) + Math.abs(P[2]) > 1e-7) {
              checked++;
              if (!listed(px, py, i)) missing++;
            }
          }
      }
      expect(checked).toBeGreaterThan(1000);
      expect(missing).toBe(0);
    }
  }, 120000);

  it("overflow: entries past capacity are dropped, counted, and never indexed out of range", () => {
    const cam = testCam(200);
    const batch = randomScene(7, 60);
    const full = binSegments(batch, cam, 256, {});
    const cap = Math.floor(full.stats.entries / 3);
    const lim = binSegments(batch, cam, 256, { capacity: cap });
    expect(lim.stats.entries).toBe(cap);
    expect(lim.stats.dropped).toBe(full.stats.entries - cap);
    for (let t = 0; t < lim.tilesX * lim.tilesY; t++) {
      const off = lim.header[t * 2],
        cnt = lim.header[t * 2 + 1] & 0xffffff;
      expect(off + cnt).toBeLessThanOrEqual(cap);
      for (let k = 0; k < cnt; k++) expect(lim.index[off + k]).toBeLessThan(batch.count);
    }
  });

  it("tile lists hold each segment once, in ascending order", () => {
    const cam = testCam(200);
    const batch = randomScene(9, 40);
    const bins = binSegments(batch, cam, 256, {});
    for (let t = 0; t < bins.tilesX * bins.tilesY; t++) {
      const off = bins.header[t * 2],
        cnt = bins.header[t * 2 + 1] & 0xffffff;
      for (let k = 1; k < cnt; k++) expect(bins.index[off + k]).toBeGreaterThan(bins.index[off + k - 1]);
    }
  });

  it("the block pre-cull changes nothing but the work done (zoomed, off-centre and moving views)", () => {
    const batch = randomScene(31, 120);
    const prev = new Float32Array(batch.count * PREV_FLOATS);
    for (let i = 0; i < batch.count; i++)
      for (let e = 0; e < 2; e++) for (let k = 0; k < 3; k++) prev[i * PREV_FLOATS + e * 4 + k] = batch.data[i * SEG_FLOATS + e * 4 + k] - 0.4 * (k + 1);
    const moving: SegmentBatch = { ...batch, prev, motion: { dtS: 1 / 15, pulseS: 0.008 } };
    const cams: XrayCamera[] = [testCam(40), { ...testCam(50), src: v(40, -30, 760), detC: v(40, -30, -300) }, testCam(200)];
    let culledSomewhere = false;
    try {
      for (const b of [batch, moving])
        for (const cam of cams) {
          binnerOptions.preCull = "off";
          const plain = binSegments(b, cam, 384, {});
          const plainIdx = plain.index.slice(0, plain.stats.entries);
          binnerOptions.preCull = "on";
          const culled = binSegments(b, cam, 384, {});
          expect(Array.from(culled.header)).toEqual(Array.from(plain.header));
          expect(Array.from(culled.index.slice(0, culled.stats.entries))).toEqual(Array.from(plainIdx));
          if (plain.stats.onScreen < b.count * 0.5) culledSomewhere = true;
        }
    } finally {
      binnerOptions.preCull = "auto";
    }
    expect(culledSomewhere).toBe(true);
  });

  it("bins 30,000 segments within the CPU budget (time relative to a minimal reference loop)", () => {
    const cam = testCam(200);
    const batch = randomScene(12, 1700); // about 30k segments
    expect(batch.count).toBeGreaterThan(25000);
    let bins = binSegments(batch, cam, 768, {}); // warm up
    // reference: the irreducible work (project both ends of every segment, write every entry)
    const ci = camInfo(cam, 768);
    const sink = new Uint32Array(bins.stats.entries);
    const refLoop = () => {
      const t0 = performance.now();
      const d = batch.data;
      let acc = 0;
      for (let i = 0; i < batch.count; i++) {
        const o = i * SEG_FLOATS;
        for (let e = 0; e < 8; e += 4) {
          const dx = d[o + e] - ci.src[0],
            dy = d[o + e + 1] - ci.src[1],
            dz = d[o + e + 2] - ci.src[2];
          const m = ci.sid / (dx * ci.n[0] + dy * ci.n[1] + dz * ci.n[2]);
          acc += m * (dx * ci.pu[0] + dy * ci.pu[1] + dz * ci.pu[2]) + m * (dx * ci.pv[0] + dy * ci.pv[1] + dz * ci.pv[2]);
        }
      }
      for (let k = 0; k < sink.length; k++) sink[k] = k ^ (acc | 0);
      return performance.now() - t0;
    };
    refLoop();
    const times: number[] = [],
      refs: number[] = [];
    for (let k = 0; k < 9; k++) {
      refs.push(refLoop());
      bins = binSegments(batch, cam, 768, {}, bins.index);
      times.push(bins.stats.ms);
    }
    times.sort((a, b) => a - b);
    refs.sort((a, b) => a - b);
    const ratio = times[4] / refs[4];
    // eslint-disable-next-line no-console
    console.log(`binSegments: ${batch.count} segments, ${bins.stats.entries} entries, median ${times[4].toFixed(2)} ms, reference loop ${refs[4].toFixed(2)} ms, ratio ${ratio.toFixed(1)}`);
    // 5-6 on an M-series laptop (idle or loaded alike, since both loops slow together)
    expect(ratio).toBeLessThan(10);
  });
});

// ---------------------------------------------------------------------------
describe("intra-pulse motion", () => {
  it("blurs a moving vessel across the pulse and conserves its integral", () => {
    const cam = testCam(200);
    const res = 512;
    const ci = camInfo(cam, res);
    const mag = ci.sid / 760;
    const pxObj = ci.mmPerPx / mag;
    // a vessel along y (radius 1.2 mm) moving along x by 30 px per frame; pulse 8 ms at 15 fps:
    // displacement within the pulse d = 30 x 0.008 x 15 = 3.6 px
    const shift = 30 * pxObj;
    const mk = (dx: number) => [0, 1, 2, 3, 4, 5, 6].map((k) => v(dx, -30 + 10 * k, 0));
    const tubes: TubeSpec[] = [{ pts: mk(0), r: mk(0).map(() => 1.2), mu: [0, 0.2, 0] }];
    const prevTubes: TubeSpec[] = [{ pts: mk(-shift), r: mk(0).map(() => 1.2), mu: [0, 0.2, 0] }];
    const still = tubesToSegments(tubes);
    const moving = tubesToSegments(tubes, { prevTubes, motion: { dtS: 1 / 15, pulseS: 0.008 } });
    const cfg = { ssFeaturePx: 0 }; // no anti-aliasing: isolate the motion samples
    const ctx = ctxFor(cam, res, cfg);
    const bS = binSegments(still, cam, res, cfg);
    const bM = binSegments(moving, cam, res, cfg);
    expect(bM.stats.motionTiles).toBeGreaterThan(0);
    const row = (batch: SegmentBatch, bins: ReturnType<typeof binSegments>) => {
      const out: number[] = [];
      for (let px = res / 2 - 20; px < res / 2 + 20; px++) out.push(integratePixel(batch, bins, px, res / 2, ctx)[1]);
      return out;
    };
    const a = row(still, bS),
      b = row(moving, bM);
    const sum = (x: number[]) => x.reduce((p, c) => p + c, 0);
    const moment = (x: number[]) => {
      const S = sum(x);
      const m = x.reduce((p, c, i) => p + c * i, 0) / S;
      return x.reduce((p, c, i) => p + c * (i - m) ** 2, 0) / S;
    };
    // transmission averaging lowers the summed path slightly (Jensen); path averaging keeps it
    const ctxP = ctxFor(cam, res, { ...cfg, transmissionAverage: false });
    const bP: number[] = [];
    for (let px = res / 2 - 20; px < res / 2 + 20; px++) bP.push(integratePixel(moving, bM, px, res / 2, ctxP)[1]);
    expect(Math.abs(sum(bP) / sum(a) - 1)).toBeLessThan(0.01);
    expect(sum(b)).toBeLessThan(sum(a));
    // variance grows by that of three equally weighted samples at -d/3, 0, +d/3: 2 d^2 / 27
    const d = 30 * 0.008 * 15;
    const extra = moment(bP) - moment(a);
    expect(extra).toBeGreaterThan(0.8 * ((2 * d * d) / 27));
    expect(extra).toBeLessThan(1.2 * ((2 * d * d) / 27));
  });
});

describe("end-on chains", () => {
  it("a chain seen end-on (rays along its length) is integrated without double counting", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const b = new SegmentBatchBuilder();
    const g = b.addGroup([0, 1, 0]);
    const pts: Vec3[] = [];
    for (let i = 0; i <= 30; i++) pts.push(v(0.05 * Math.sin(i * 0.3), 0.05 * Math.cos(i * 0.3), -15 + i));
    b.addChain(g, pts, pts.map((_, i) => 1 + 0.05 * Math.sin(i * 0.7)), pts.map((_, i) => 1 + 0.1 * Math.cos(i * 0.5)));
    const batch = b.finish();
    for (const [x, y] of [
      [0.1, 0.05],
      [0.5, -0.3],
      [0.8, 0.2],
    ]) {
      const o: V = [x, y, 400];
      const d: V = [0, 0, -1];
      const P = integrateRay(batch, null, 0, 0, o, d, d, ctx).P[1];
      const ref = march(batch, o, d, 400 - 20, 400 + 20, 8000, () => 0)[1];
      expect(Math.abs(P / ref - 1)).toBeLessThan(0.01);
    }
  });
});

describe("tubesToSegments", () => {
  it("keeps coaxial overlays additive (coil over wire core, calcium on the lumen) and links true branches", () => {
    const wire = [0, 1, 2, 3, 4, 5].map((i) => v(i, 0, 0));
    const coil = wire.slice(3);
    const vessel = [0, 1, 2, 3].map((i) => v(0, i, 5));
    const branch = [v(0, 1, 5), v(1, 1.5, 5), v(2, 2, 5)];
    const calc = vessel.slice(1, 3);
    const tubes: TubeSpec[] = [
      { pts: wire, r: wire.map(() => 0.178), mu: [0, 0, 1.9] },
      { pts: vessel, r: vessel.map(() => 1.5), mu: vessel.map(() => [0, 0.2, 0] as [number, number, number]) },
      { pts: coil, r: coil.map(() => 0.178), mu: [0, 0, 6.5] },
      { pts: calc, r: [2.4, 2.4], mu: [0.055, 0, 0] },
      { pts: branch, r: [1, 0.9, 0.8], mu: branch.map(() => [0, 0.18, 0] as [number, number, number]) },
    ];
    const b = tubesToSegments(tubes);
    expect(b.groups.length).toBe(5);
    // segment layout: wire 0-4, vessel 5-7, coil 8-9, calcium 10, branch 11-12
    const host = (i: number) => [19, 23, 15].flatMap((off) => {
      const [f, c] = decodeHostSlot(b.data[i * SEG_FLOATS + off]);
      return Array.from({ length: c }, (_, k) => f + k);
    });
    for (const i of [8, 9, 10]) expect(host(i)).toEqual([]);
    // vessel segments either side of its sample 1 (and the next one, which it also overlaps)
    expect(host(11)).toEqual(expect.arrayContaining([5, 6]));
    expect(host(11).every((h) => h >= 5 && h <= 7)).toBe(true);
    // concentration carries the magnitude along the group's unit direction
    expect(b.groups[1].mu).toEqual([0, 1, 0]);
    expect(b.data[5 * SEG_FLOATS + 8]).toBeCloseTo(0.2, 6);
    // interior joints have bisector planes, chain ends spherical caps
    expect(Math.hypot(b.data[16], b.data[17], b.data[18])).toBe(0);
    expect(Math.hypot(b.data[20], b.data[21], b.data[22])).toBeCloseTo(1, 6);
  });

  it("splits non-proportional per-sample materials by channel", () => {
    const pts = [v(0, 0, 0), v(1, 0, 0), v(2, 0, 0)];
    const b = tubesToSegments([{ pts, r: [1, 1, 1], mu: [[0.1, 0, 0], [0, 0.2, 0], [0.1, 0.2, 0]] }]);
    expect(b.groups.length).toBe(2);
  });

  it("feature flag helper moves tubes onto extra.segments", () => {
    const scene = { cam: testCam(), tubes: [{ pts: [v(0, 0, 0), v(1, 0, 0)], r: [1, 1], mu: [0, 1, 0] as [number, number, number] }], extra: { other: 1 } };
    const s2 = segmentsFromScene(scene);
    expect(s2.tubes.length).toBe(0);
    expect((s2.extra as Record<string, unknown>).other).toBe(1);
    expect(((s2.extra as Record<string, unknown>).segments as SegmentBatch).count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
describe("host slots", () => {
  it("encode and decode singles, ranges and extension references exactly in float32", () => {
    const f32 = new Float32Array(1);
    for (const first of [0, 1, 5000, 30000, 524287 - HOST_RANGE_MAX])
      for (let c = 1; c <= HOST_RANGE_MAX; c++) {
        f32[0] = encodeHostRange(first, c);
        expect(decodeHostSlot(f32[0])).toEqual([first, c]);
      }
    f32[0] = encodeHostExt(12345);
    expect(decodeHostSlot(f32[0])).toEqual([12345, -1]);
    expect(decodeHostSlot(-1)).toEqual([0, 0]);
    expect(() => encodeHostRange(3, HOST_RANGE_MAX + 1)).toThrow();
    // an extension list: values four per texel, ended by -1
    const extra = new Float32Array([encodeHostRange(10, 3), 20, encodeHostRange(40, 2), -1]);
    expect(expandHostSlot(encodeHostExt(0), extra)).toEqual([10, 11, 12, 20, 40, 41]);
  });

  it("a plane given to addSegment never reads a neighbour (no NaN at index 0 or at the end)", () => {
    const ctx = ctxFor(testCam(), 512, { ...EXACT_ONLY, backfillSlope: 0 });
    const b = new SegmentBatchBuilder();
    const g = b.addGroup([0, 1, 0]);
    // strongly tapered (so the back-fill would run) with unit-length planes at both ends
    b.addSegment(g, v(0, 0, 0), 1.5, v(4, 0, 0), 0.5, 1, 1, { startPlane: v(1, 0.3, 0), endPlane: v(-1, 0.2, 0) });
    const batch = b.finish();
    expect(Math.hypot(batch.data[16], batch.data[17], batch.data[18])).toBeCloseTo(USER_PLANE, 5);
    // the same record written by hand with unit planes (as a foreign producer might): index 0 has
    // no previous segment, and the last segment no next one
    const raw: SegmentBatch = { ...batch, data: batch.data.slice() };
    for (const k of [16, 17, 18, 20, 21, 22]) raw.data[k] /= USER_PLANE;
    const r = rng(4);
    for (let k = 0; k < 100; k++) {
      const { o, d } = rayNear(r, [2, 0, 0], 4);
      const a = integrateRay(batch, null, 0, 0, o, d, d, ctx).P[1];
      const c = integrateRay(raw, null, 0, 0, o, d, d, ctx).P[1];
      expect(Number.isFinite(a)).toBe(true);
      expect(Number.isFinite(c)).toBe(true);
      expect(c).toBeCloseTo(a, 6); // the plane normals differ by float32 rounding of the rescale
    }
  });

  it("an extension list removes every host it names", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    const b = new SegmentBatchBuilder();
    const g = b.addGroup([0, 1, 0]);
    // five separate capsules crossing a long one; the long one (added last) removes all five
    for (let k = 0; k < 5; k++) b.addSegment(g, v(-8 + 4 * k, -3, 0.3 * k), 0.8, v(-8 + 4 * k, 3, 0.3 * k), 0.8, 1, 1);
    const long = b.addSegment(g, v(-10, 0, 0), 0.7, v(10, 0, 0), 0.7, 1, 1);
    expect(b.setHostList(long, 0, [encodeHostRange(0, 2), 2, encodeHostRange(3, 2)])).toBe(0);
    expect(b.hostList(long)).toEqual([0, 1, 2, 3, 4]);
    const batch = b.finish();
    const r = rng(8);
    let worst = 0;
    for (let k = 0; k < 120; k++) {
      const { o, d } = rayNear(r, [-8 + 4 * Math.floor(r() * 5), 0, 0], 2);
      const tc = dot3(sub([0, 0, 0], o), d);
      const ref = march(batch, o, d, tc - 25, tc + 25, 5000, () => 0)[1];
      if (ref < 0.05) continue;
      worst = Math.max(worst, Math.abs(integrateRay(batch, null, 0, 0, o, d, d, ctx).P[1] - ref) / ref);
    }
    expect(worst).toBeLessThan(0.003);
  });
});

// ---------------------------------------------------------------------------
describe("vessel families", () => {
  /** A parent along x and two children that leave 10 mm apart and cross 10 mm above it. */
  function crossingSiblings(order: "parent-first" | "children-first") {
    const parent: TubeSpec = { pts: Array.from({ length: 21 }, (_, i) => v(-10 + i, 0, 0)), r: Array(21).fill(1), mu: [0, 0.2, 0] };
    const da = norm([0.5, 1, 0]),
      db = norm([-0.5, 1, 0]);
    const ca: TubeSpec = { pts: Array.from({ length: 15 }, (_, i) => v(-6 + da[0] * i, da[1] * i, 0)), r: Array(15).fill(0.6), mu: [0, 0.2, 0] };
    const cb: TubeSpec = { pts: Array.from({ length: 15 }, (_, i) => v(4 + db[0] * i, db[1] * i, 0)), r: Array(15).fill(0.55), mu: [0, 0.2, 0] };
    if (order === "parent-first") return { tubes: [parent, ca, cb], parentOf: (_t: TubeSpec, i: number) => (i === 0 ? null : { tube: 0, at: i === 1 ? 4 : 14 }) };
    return { tubes: [ca, cb, parent], parentOf: (_t: TubeSpec, i: number) => (i === 2 ? null : { tube: 2, at: i === 0 ? 4 : 14 }) };
  }

  it("children that run into each other away from their origins are counted once", () => {
    const ctx = ctxFor(testCam(), 512, EXACT_ONLY);
    for (const order of ["parent-first", "children-first"] as const) {
      const { tubes, parentOf } = crossingSiblings(order);
      const joined = tubesToSegments(tubes, { parentOf });
      const additive = tubesToSegments(tubes, { parentOf, familyUnion: false });
      expect(joined.unresolvedOverlaps).toBe(0);
      const r = rng(21);
      let worst = 0,
        doubled = 0,
        n = 0;
      const targets: V[] = [[-1, 10, 0], [-6, 0.5, 0], [4, 0.5, 0]];
      for (let k = 0; k < 75; k++) {
        // near the crossing (-1, 10, 0) and near both origins
        const target = targets[k % 3];
        const { o, d } = rayNear(r, target, 2);
        const tc = dot3(sub(target, o), d);
        const ref = march(joined, o, d, tc - 25, tc + 25, 5000, () => 0)[1];
        if (ref < 0.02) continue;
        n++;
        const u = integrateRay(joined, null, 0, 0, o, d, d, ctx).P[1];
        const a = integrateRay(additive, null, 0, 0, o, d, d, ctx).P[1];
        worst = Math.max(worst, Math.abs(u - ref) / ref);
        if (a > ref * 1.01) doubled++;
      }
      expect(n).toBeGreaterThan(45);
      expect(worst).toBeLessThan(0.005);
      expect(doubled).toBeGreaterThan(5); // without the family pass the crossing adds
    }
  });

  it("reuses the previous frame's host slots when the layout is unchanged (topologyFrom)", () => {
    const { tubes, parentOf } = crossingSiblings("parent-first");
    const a = tubesToSegments(tubes, { parentOf });
    // the next frame: every point moved a little, same layout
    const moved = tubes.map((t) => ({ ...t, pts: t.pts.map((p) => v(p.x + 0.05, p.y - 0.03, p.z + 0.02)) }));
    const fresh = tubesToSegments(moved, { parentOf });
    const reused = tubesToSegments(moved, { parentOf, topologyFrom: a });
    expect(reused.topologyKey).toBe(a.topologyKey);
    expect(Array.from(reused.data)).toEqual(Array.from(fresh.data));
    // a changed layout is not reused
    const longer = [...moved.slice(0, 2), { ...moved[2], pts: [...moved[2].pts, v(0, 20, 0)], r: [...moved[2].r, 0.5] }];
    const b = tubesToSegments(longer, { parentOf, topologyFrom: a });
    expect(b.topologyKey).not.toBe(a.topologyKey);
    expect(Array.from(b.data)).toEqual(Array.from(tubesToSegments(longer, { parentOf }).data));
  });
});
