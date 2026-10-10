// ---------------------------------------------------------------------------
// Coronary lumens from the render tree (TreeVessel samples and radii), so the
// physics and the image share one coronary geometry.
//
// Frame. The physics runs in the aortic frame attached to the root. The render
// places a coronary sample at moveWorld(samplePos(H, s, motion), w) with the
// root carried at weight rootW and the heart at rootW + (1 − rootW)·s.w
// (sceneBuilder). Relative to the root a sample therefore moves by
// heartShift·(1 − rootW)·s.w, and that is what we add here. The renderer then
// applies moveWorld(p, rootW) to every device node (see S7.md integration):
// no motion is counted twice.
//
// The adapter is written against the structural shape of the tree and takes
// samplePos as a parameter, so it does not break when coronaryTree.ts grows
// fields. coronaryInputsFromRenderTree() binds the real samplePos.
//
// Anatomy variants (diag-anatomy-variants). The ostia are the render tree's:
// every vessel without a parent opens on the root where the tree starts it
// (the left main, or the LAD with separate ostia, the RCA, the conus, and a
// circumflex with its own ostium), so an anomalous origin is a lumen the rod
// can enter wherever the image shows it, and ostiaFromTree() reports them in
// the classifier's names. A circumflex from the proximal RCA is a branch that
// leaves the RCA within branchWithinMm, so it is kept as a lumen too.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../types";
import type { CoronaryInput } from "./lumen";
import { samplePos as treeSamplePos } from "../render/xray/coronaryTree";

export interface TreeVesselLike {
  name: string;
  side: "left" | "right";
  samples: { w: number }[];
  radii: number[];
  pathMm: number[];
  parent?: { name: string; index: number };
}

export interface TreeLike {
  heart: unknown;
  vessels: TreeVesselLike[];
  /** bypass grafts on the ascending aorta (coronaryTree.ts CoronaryTree.grafts); occludedFrom ends an occluded graft's stump */
  grafts?: (TreeVesselLike & { occludedFrom?: number })[];
}

/** Prefix of a graft lumen's name (the render tree's graft name, anatomy.ts GRAFT_PREFIX; repeated so the physics does not import the anatomy). */
export const GRAFT_LUMEN_PREFIX = "GRAFT:";

/** The graft id of a lumen or reading vessel name ('GRAFT:svg-rca' gives 'svg-rca'), or null for a native vessel. */
export function graftLumenId(name: string | null | undefined): string | null {
  return name && name.startsWith(GRAFT_LUMEN_PREFIX) ? name.slice(GRAFT_LUMEN_PREFIX.length) : null;
}

export type SamplePosFn = (heart: never, s: never, m?: { contraction: number }) => Vec3;

export interface CoronaryMotion {
  /** 0 diastole … 1 end-systole (the render's contraction at this clock time) */
  contraction: number;
  /** breathing translation of the heart (render heartShift) */
  heartShift?: Vec3;
  /** weight of the breathing shift carried by the root (render rootW, default 0.45) */
  rootW?: number;
}

export interface CoronarySelect {
  /** keep samples up to this distance from the ostium (mm); a catheter or a short wire reaches no further */
  maxPathMm?: number;
  /** keep branches that arise within this distance of the ostium (mm) */
  branchWithinMm?: number;
  /** ignore vessels thinner than this at their origin (mm) */
  minRadius?: number;
}

/**
 * Proximal coronary lumens at one clock time: the native vessels, then the grafts (diag-grafts-svg). A graft is a
 * lumen opening on the ascending aorta at its ostium (its first sample, which the root carries), so a catheter tip can
 * enter it there; an occluded graft is only its stump. Its name is the tree's (GRAFT_LUMEN_PREFIX + id) and its side
 * that of its target, so the classifier reads an engaged graft as an engagement on that side and the reading's vessel
 * names the graft.
 */
export function coronaryInputsFromTree(tree: TreeLike, samplePos: SamplePosFn, motion: CoronaryMotion, sel: CoronarySelect = {}): CoronaryInput[] {
  const out = nativeInputs(tree, samplePos, motion, sel);
  for (const g of tree.grafts ?? []) {
    const end = g.occludedFrom !== undefined && g.occludedFrom >= 0 ? Math.min(g.samples.length, g.occludedFrom + 1) : g.samples.length;
    const one = nativeInputs({ heart: tree.heart, vessels: [{ ...g, samples: g.samples.slice(0, end), radii: g.radii.slice(0, end), pathMm: g.pathMm.slice(0, end), parent: undefined }] }, samplePos, motion, { ...sel, minRadius: 0 });
    out.push(...one);
  }
  return out;
}

function nativeInputs(tree: TreeLike, samplePos: SamplePosFn, motion: CoronaryMotion, sel: CoronarySelect): CoronaryInput[] {
  const maxPath = sel.maxPathMm ?? 80;
  const within = sel.branchWithinMm ?? 30;
  const minR = sel.minRadius ?? 0.6;
  const rootW = motion.rootW ?? 0.45;
  const hs = motion.heartShift ?? { x: 0, y: 0, z: 0 };
  const m = { contraction: motion.contraction };
  const out: CoronaryInput[] = [];
  for (const v of tree.vessels) {
    if (!v.samples.length || v.pathMm.length !== v.samples.length) continue;
    const offset = v.pathMm[0] ?? 0;
    if (v.parent && offset > within) continue;
    if ((v.radii[0] ?? 0) < minR) continue;
    const pts: Vec3[] = [];
    const radii: number[] = [];
    for (let i = 0; i < v.samples.length; i++) {
      if (v.pathMm[i] > maxPath) break;
      const s = v.samples[i];
      const p = samplePos(tree.heart as never, s as never, m);
      const k = (1 - rootW) * s.w;
      pts.push({ x: p.x + hs.x * k, y: p.y + hs.y * k, z: p.z + hs.z * k });
      radii.push(v.radii[i]);
    }
    if (pts.length >= 2) out.push({ name: v.name, side: v.side, pts, radii, offsetMm: offset });
  }
  return out;
}

/** Same, bound to the render tree's samplePos. */
export function coronaryInputsFromRenderTree(tree: TreeLike, motion: CoronaryMotion, sel: CoronarySelect = {}): CoronaryInput[] {
  return coronaryInputsFromTree(tree, treeSamplePos as unknown as SamplePosFn, motion, sel);
}

/** An ostium on the root, in the engagement classifier's names (src/physics/lumen.ts OstiumInfo). */
export interface TreeOstium {
  name: "lm" | "rca" | "conus" | "left2";
  vessel: string;
  side: "left" | "right";
  pos: Vec3;
  /** unit take-off direction (from the first sample along the first `dirMm` of the vessel) */
  dir: Vec3;
}

/**
 * The ostia of the render tree: the first sample of every vessel that has no parent (the vessels that open on the
 * root), at rest, in the aortic frame. The left main (or the LAD when it has its own ostium) is 'lm', the RCA 'rca',
 * the conus 'conus', and a circumflex with its own ostium (separate in the left sinus, or anomalous in the right)
 * 'left2'. Other parentless vessels (none today) are left out.
 */
export function ostiaFromTree(tree: TreeLike & { vessels: (TreeVesselLike & { samples: { w: number }[] })[] }, samplePos: SamplePosFn, dirMm = 3): TreeOstium[] {
  const out: TreeOstium[] = [];
  const names: Record<string, TreeOstium["name"]> = { LM: "lm", RCA: "rca", CONUS: "conus", LCx: "left2" };
  const hasLm = tree.vessels.some((v) => v.name === "LM" && !v.parent);
  for (const v of tree.vessels) {
    if (v.parent || v.samples.length < 2) continue;
    const name = v.name === "LAD" && !hasLm ? "lm" : names[v.name];
    if (!name) continue;
    const p0 = samplePos(tree.heart as never, v.samples[0] as never);
    let k = 1;
    while (k < v.samples.length - 1 && v.pathMm[k] - v.pathMm[0] < dirMm) k++;
    const p1 = samplePos(tree.heart as never, v.samples[k] as never);
    const d = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
    const l = Math.hypot(d.x, d.y, d.z) || 1;
    out.push({ name, vessel: v.name, side: v.side, pos: p0, dir: { x: d.x / l, y: d.y / l, z: d.z / l } });
  }
  return out;
}

/** Same, bound to the render tree's samplePos. */
export function ostiaFromRenderTree(tree: Parameters<typeof ostiaFromTree>[0], dirMm = 3): TreeOstium[] {
  return ostiaFromTree(tree, treeSamplePos as unknown as SamplePosFn, dirMm);
}
