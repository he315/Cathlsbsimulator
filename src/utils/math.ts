import type { Vec3 } from "../types";

export const V = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const scale = (a: Vec3, s: number): Vec3 => ({
  x: a.x * s,
  y: a.y * s,
  z: a.z * s,
});

export const dot = (a: Vec3, b: Vec3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const length = (a: Vec3): number => Math.sqrt(dot(a, a));

export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b));

export const normalize = (a: Vec3): Vec3 => {
  const l = length(a);
  if (l < 1e-9) return V(0, 1, 0);
  return scale(a, 1 / l);
};

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

export const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

export const clamp01 = (x: number): number => clamp(x, 0, 1);

export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;

/** angle between two vectors in radians */
export const angleBetween = (a: Vec3, b: Vec3): number => {
  const c = clamp(dot(normalize(a), normalize(b)), -1, 1);
  return Math.acos(c);
};

/** rotate a vector around the Y axis (superior/inferior axis) */
export const rotateY = (v: Vec3, rad: number): Vec3 => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
};

/** rotate a vector around the X axis (left-right axis) */
export const rotateX = (v: Vec3, rad: number): Vec3 => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
};

/** rotate around the Z axis (antero-posterior) */
export const rotateZ = (v: Vec3, rad: number): Vec3 => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
};

/** Catmull-Rom smoothing of a polyline for nicer 3D tubes / 2D curves */
export function smoothPolyline(points: Vec3[], subdivisions = 6): Vec3[] {
  if (points.length < 3) return points;
  const out: Vec3[] = [];
  const p = points;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        z:
          0.5 *
          (2 * p1.z +
            (-p0.z + p2.z) * t +
            (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
            (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
      });
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

/** sample a point along a polyline at parameter t in [0,1] */
export function pointAlong(points: Vec3[], t: number): Vec3 {
  if (points.length === 0) return V();
  if (points.length === 1) return points[0];
  const clamped = clamp01(t);
  const scaled = clamped * (points.length - 1);
  const i = Math.floor(scaled);
  const frac = scaled - i;
  if (i >= points.length - 1) return points[points.length - 1];
  return lerpVec(points[i], points[i + 1], frac);
}

export const round = (x: number, d = 0): number => {
  const f = Math.pow(10, d);
  return Math.round(x * f) / f;
};
