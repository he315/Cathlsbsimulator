// ---------------------------------------------------------------------------
// Angiographic geometry.
//
// The engagement/contrast model only needs a handful of named vessel
// centre-lines. But a schematic tree of a few straight segments never LOOKS
// like a real angiogram. This module enriches each named vessel — once per
// case — into organic, continuously-tapering centre-lines with natural
// tortuosity, and spawns fine distal side-branches that fade to hair-lines.
// The result is a dense, believable coronary tree that still projects and beats
// through the same cone-beam renderer. Everything is deterministic (seeded by
// vessel id) so a given case always looks identical.
// ---------------------------------------------------------------------------

import type { AnatomyModel } from "./anatomy";
import { toWorld } from "./anatomy";
import type { Vec3, VesselId } from "../types";
import { Rng } from "../utils/random";
import { V, add, scale, sub, cross, length } from "../utils/math";

// Safe normalize — a zero-length vector (coincident points) returns a fallback
// instead of NaN, which would otherwise propagate into the renderer.
function nrm(v: Vec3, fb: Vec3 = V(1, 0, 0)): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z);
  return l < 1e-6 ? fb : { x: v.x / l, y: v.y / l, z: v.z / l };
}

export interface AngioSeg {
  /** which named vessel's contrast fill controls this segment */
  fillId: VesselId;
  main: boolean;
  /** 0..1 position along the parent where this branch originates (0 = the trunk itself) */
  attach: number;
  /** proximal radius */
  radius: number;
  /** world-frame centre-line */
  world: Vec3[];
}

const MAIN = new Set<VesselId>(["LM", "LAD", "LCx", "RCA"]);

function catmull(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return {
    x: f(p0.x, p1.x, p2.x, p3.x),
    y: f(p0.y, p1.y, p2.y, p3.y),
    z: f(p0.z, p1.z, p2.z, p3.z),
  };
}

function smooth(pts: Vec3[], perSeg: number): Vec3[] {
  if (pts.length < 2) return pts.slice();
  const get = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const out: Vec3[] = [];
  for (let i = 0; i < pts.length - 1; i++)
    for (let j = 0; j < perSeg; j++) out.push(catmull(get(i - 1), get(i), get(i + 1), get(i + 2), j / perSeg));
  out.push(pts[pts.length - 1]);
  return out;
}

function perp(dir: Vec3): Vec3 {
  let p = cross(dir, V(0, 0, 1));
  if (length(p) < 1e-3) p = cross(dir, V(0, 1, 0));
  return nrm(p);
}

// Add organic tortuosity: displace interior points along a slowly-varying
// perpendicular wave, tapered to zero at both ends so junctions stay put.
function tortuous(pts: Vec3[], amp: number, rng: Rng): Vec3[] {
  if (pts.length < 4) return pts;
  const phase = rng.next() * Math.PI * 2;
  const freq = 1.4 + rng.next() * 2.2;
  return pts.map((p, i, arr) => {
    if (i === 0 || i === arr.length - 1) return p;
    const t = i / (arr.length - 1);
    const dir = nrm(sub(arr[Math.min(i + 1, arr.length - 1)], arr[i - 1]));
    const w = Math.sin(t * Math.PI * freq + phase) * amp * Math.sin(t * Math.PI);
    return add(p, scale(perp(dir), w));
  });
}

export function buildAngioGeometry(model: AnatomyModel): AngioSeg[] {
  const out: AngioSeg[] = [];
  for (const v of model.vessels) {
    const rng = new Rng("angio:" + v.id);
    const main = MAIN.has(v.id);
    let pts = smooth(v.points, 10);
    pts = tortuous(pts, v.radius * 1.15 + 0.5, rng);
    out.push({ fillId: v.id, main, attach: 0, radius: v.radius, world: pts.map((p) => toWorld(model, p)) });

    // Fine distal side-branches — more, and thinner, on the larger trunks.
    const nTw = Math.min(10, Math.round(v.radius * 4 + 1));
    for (let i = 0; i < nTw; i++) {
      const f = 0.18 + rng.next() * 0.68;
      const idx = Math.floor(f * (pts.length - 1));
      if (idx < 1 || idx >= pts.length - 1) continue;
      const base = pts[idx];
      const along = nrm(sub(pts[Math.min(idx + 1, pts.length - 1)], pts[idx - 1]));
      const side = rng.next() < 0.5 ? 1 : -1;
      const twdir = nrm(add(scale(perp(along), side), scale(along, 0.3 + rng.next() * 0.5)));
      const len = (1 - f) * v.radius * 8.5 * (0.5 + rng.next() * 1.0);
      const steps = 6;
      const tw: Vec3[] = [base];
      let cur = base;
      let dir = twdir;
      for (let k = 1; k <= steps; k++) {
        // wander a little as it runs distally
        dir = nrm(add(dir, scale(perp(dir), (rng.next() - 0.5) * 0.5)));
        cur = add(cur, add(scale(dir, len / steps), V(0, -len / steps * 0.15, 0)));
        tw.push(cur);
      }
      out.push({ fillId: v.id, main, attach: f, radius: Math.max(0.25, v.radius * 0.4), world: tw.map((p) => toWorld(model, p)) });
    }
  }
  return out;
}
