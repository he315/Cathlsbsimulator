import type { CatheterType, EngagementState, PressureState, Vec3, VesselId } from "../../types";
import { LEFT_VESSELS } from "../../simulation/anatomy";
import type { AnatomyModel } from "../../simulation/anatomy";
import type { ControlState, TipState } from "../../simulation/engagement";
import { V, add, scale, normalize } from "../../utils/math";

export const v3 = (p: Vec3): [number, number, number] => [p.x, p.y, p.z];

type CatheterFamily = "judkins" | "amplatz" | "guide" | "universal" | "mp" | "pigtail";

function catheterFamily(cath: CatheterType): CatheterFamily {
  if (cath.category === "pigtail") return "pigtail";
  if (cath.category === "guide") return "guide";
  if (cath.id.startsWith("AL") || cath.id.startsWith("AR")) return "amplatz";
  if (cath.id.startsWith("MP")) return "mp";
  if (cath.category === "universal") return "universal";
  return "judkins";
}

// Catmull–Rom sampling through a set of knots → a smooth catheter centreline.
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

function sampleSpline(knots: Vec3[], perSeg: number): Vec3[] {
  if (knots.length < 2) return knots.slice();
  const get = (i: number) => knots[Math.max(0, Math.min(knots.length - 1, i))];
  const pts: Vec3[] = [];
  for (let i = 0; i < knots.length - 1; i++) {
    for (let j = 0; j < perSeg; j++) {
      pts.push(catmull(get(i - 1), get(i), get(i + 1), get(i + 2), j / perSeg));
    }
  }
  pts.push(knots[knots.length - 1]);
  return pts;
}

// A pigtail's looped tip — a small closed curl tangent at the tip.
function pigtailLoop(C: Vec3, dir: Vec3, R: number): Vec3[] {
  const rad = Math.max(2.4, R * 0.16);
  const d = normalize(V(dir.x, 0, dir.z));
  const center = add(C, scale(d, rad));
  const u = normalize(V(-d.z, 0, d.x)); // horizontal perpendicular
  const w = V(0, 1, 0);
  const pts: Vec3[] = [];
  for (let k = 0; k <= 11; k++) {
    const a = (k / 11) * Math.PI * 2;
    pts.push(add(center, add(scale(u, Math.cos(a) * rad), scale(w, Math.sin(a) * rad))));
  }
  return pts;
}

// Build the catheter body as a preshaped curve in the aortic frame whose SHAPE
// depends on the catheter family: a Judkins hooks straight to the ostium; an
// Amplatz reaches across to rest its secondary curve on the opposite cusp; a
// guide rests broadly on the far wall for backup; a multipurpose runs almost
// straight; a pigtail ends in a loop. Returned points are in the aortic frame —
// apply toWorld() before projecting / rendering.
export function catheterPath(
  model: AnatomyModel,
  tip: TipState,
  cath?: CatheterType,
  _controls?: ControlState
): Vec3[] {
  const fam = cath ? catheterFamily(cath) : "judkins";
  const right = cath ? cath.target === "right" || cath.id.startsWith("JR") || cath.id.startsWith("AR") : false;
  const R = model.sinusRadius;
  const C: Vec3 = { x: tip.pos.x, y: tip.pos.y, z: tip.pos.z };
  const dir = normalize(tip.dir);
  const topH = model.sinusTopY + 40;
  // unit vector across the root, away from the tip (toward the opposite wall)
  const opp = normalize(V(-C.x || -0.01, 0, -C.z || -0.01));

  if (fam === "pigtail") {
    const A = V(0, topH, 0);
    const curve = hermite(A, V(0, -1, 0), C, normalize(add(V(0, -1, 0), scale(dir, 0.3))), 24);
    return [V(0, topH + 20, 0), ...curve, ...pigtailLoop(C, tip.dir, R)];
  }

  // Where the secondary curve rests, and the tangent the catheter has there: the
  // preformed shape is a smooth, tangent-continuous curve from the shaft in the
  // ascending aorta, through that contact, into the ostium along its axis.
  let W: Vec3;
  switch (fam) {
    case "guide":
      // extra-backup guides lie along the opposite wall, below the ostium, then sweep up into it
      W = add(scale(opp, R * 0.92), V(0, C.y - 9, 0));
      break;
    case "amplatz":
      // the secondary curve sits down in the opposite cusp
      W = add(scale(opp, R * 0.6), V(0, model.valvePlaneY + 4, 0));
      break;
    case "mp":
      W = add(scale(C, 0.45), V(0, C.y + 12, 0));
      break;
    case "universal":
      W = add(scale(opp, R * 0.55), V(0, C.y + 6, 0));
      break;
    default:
      // Judkins: a left curve rests on the opposite wall a little above the ostium; a right
      // curve leaves the shaft high and turns about 90 degrees into the ostium
      W = right ? add(add(C, scale(dir, -14)), V(0, 14, 0)) : add(scale(opp, R * 0.82), V(0, C.y + 7, 0));
  }
  const A = V(0, Math.max(topH - 6, W.y + 20), 0);
  const tA = V(0, -1, 0);
  const tW = normalize(add(normalize(sub3(C, W)), V(0, fam === "guide" || fam === "amplatz" ? 0.15 : -0.45, 0)));
  const tC = dir;
  const leg1 = hermite(A, scale(tA, len3(sub3(W, A)) * 1.1), W, scale(tW, len3(sub3(W, A)) * 1.1), 16);
  const leg2 = hermite(W, scale(tW, len3(sub3(C, W)) * 1.2), C, scale(tC, len3(sub3(C, W)) * 1.2), 16);
  const shaft = [V(0, topH + 20, 0), V(0, (topH + 20 + A.y) / 2, 0)];
  const out = [...shaft, ...leg1, ...leg2.slice(1)];
  out.push(add(C, scale(dir, fam === "amplatz" ? 3.0 : 2.4)));
  return out;
}

/** Cubic Hermite curve from p0 to p1 with end tangents t0, t1 (scaled), n segments. */
function hermite(p0: Vec3, t0: Vec3, p1: Vec3, t1: Vec3, n: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const t2 = t * t,
      t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1,
      h10 = t3 - 2 * t2 + t,
      h01 = -2 * t3 + 3 * t2,
      h11 = t3 - t2;
    out.push({
      x: h00 * p0.x + h10 * t0.x + h01 * p1.x + h11 * t1.x,
      y: h00 * p0.y + h10 * t0.y + h01 * p1.y + h11 * t1.y,
      z: h00 * p0.z + h10 * t0.z + h01 * p1.z + h11 * t1.z,
    });
  }
  return out;
}
const sub3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len3 = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/** Grey level (0..255) → CSS rgb string. */
export const grey = (v: number): string => {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${c},${c},${c})`;
};

export const COLORS = {
  good: "#4CC38A",
  safe: "#56B6E8",
  warn: "#E9B95A",
  danger: "#E5534B",
  accent: "#4F8EF7",
  left: "#8ab4ff",
  right: "#e5a06b",
  dim: "#3a4a5e",
  contrast: "#f4f8ff",
};

export function engColor(e: EngagementState): string {
  if (e.kind === "in-lv" || e.isDangerous || e.isDeep) return COLORS.danger;
  if (e.isSelective) return COLORS.good;
  if (e.kind.startsWith("coaxial")) return COLORS.safe;
  if (e.kind.startsWith("near") || e.kind === "non-selective") return COLORS.warn;
  return COLORS.accent;
}

export function pressureColor(p: PressureState): string {
  if (p.warning === "danger") return COLORS.danger;
  if (p.warning === "caution") return COLORS.warn;
  return COLORS.good;
}

export function vesselColor(id: VesselId): string {
  return LEFT_VESSELS.includes(id) ? COLORS.left : COLORS.right;
}

export function warnClass(w: PressureState["warning"] | "ok" | "caution" | "danger"): string {
  if (w === "danger") return "text-danger";
  if (w === "caution") return "text-warn";
  return "text-good";
}
