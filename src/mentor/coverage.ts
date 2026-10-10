// ---------------------------------------------------------------------------
// View coverage per coronary segment.
//
// For every acquired cine run, each opacified segment is projected through the
// run's C-arm angles (projection.ts cameraBasis, orthographic) and scored for
//   - foreshortening: projected length / true length (1 = shown at full length)
//   - overlap: fraction of the segment's samples that land within `overlapMm`
//     of another opacified segment (or the catheter) that is at least
//     `overlap3dMm` away in 3D, i.e. superimposed on the image but not touching.
// A view is adequate for a segment when foreshortening >= minForeshortening and
// overlap <= maxOverlap. A segment is "seen" when it is adequate in at least
// `minViews` views whose directions differ by >= distinctViewDeg. A segment that
// was opacified but never adequate is flagged foreshortened-only (or
// overlapped-only).
//
// All thresholds are model parameters for expert calibration, not literature
// values (see docs/realism/facts/S11.md).
//
// Segment labels come through the SegmentGeometry interface; treeSegments.ts
// adapts the S3b coronary tree (SYNTAX labels per sample).
// ---------------------------------------------------------------------------

import type { CArm, Dominance, Vec3 } from "../types";
import { cameraBasis, type CameraBasis } from "../simulation/projection";

export interface SegmentPolyline {
  /** SYNTAX label, e.g. "6" (proximal LAD) */
  label: string;
  side: "left" | "right";
  /** centreline (mm, world frame) */
  points: Vec3[];
}

export interface SegmentGeometry {
  /** one or more polylines per label */
  segments: SegmentPolyline[];
  /** catheter centreline in the same frame (optional) */
  catheter?: Vec3[];
}

export interface CoverageRun {
  id: string;
  cArm: CArm;
  /** which coronary was opacified in this run */
  side: "left" | "right" | "both";
  /** labels opacified (default: every segment on the side) */
  opacified?: string[];
  /** false when the injection was not diagnostic (the run then counts for nothing) */
  diagnostic?: boolean;
  tWall?: number;
}

export interface CoverageParams {
  /** model parameter: minimum projected/true length for an adequate view */
  minForeshortening: number;
  /** model parameter: maximum overlapped fraction for an adequate view */
  maxOverlap: number;
  /** model parameter: projected distance (mm at the isocentre) that counts as superimposed */
  overlapMm: number;
  /** model parameter: minimum 3D separation for a superimposition to count as overlap */
  overlap3dMm: number;
  /** model parameter: adequate views needed to call a segment seen */
  minViews: number;
  /** model parameter: two views count as distinct when their directions differ by this much */
  distinctViewDeg: number;
  /** resampling step along centrelines (mm) */
  stepMm: number;
}

export const DEFAULT_COVERAGE: CoverageParams = {
  minForeshortening: 0.8,
  maxOverlap: 0.25,
  overlapMm: 2.0,
  overlap3dMm: 8,
  minViews: 2,
  distinctViewDeg: 20,
  stepMm: 1.5,
};

export interface SegmentViewScore {
  runId: string;
  cArm: CArm;
  foreshortening: number;
  /** overlap with other opacified segments, 0..1 */
  overlap: number;
  /** overlap with the catheter, 0..1 */
  catheterOverlap: number;
  /** foreshortening × (1 − max(overlap, catheterOverlap)) */
  score: number;
  adequate: boolean;
}

export interface SegmentCoverage {
  label: string;
  side: "left" | "right";
  views: SegmentViewScore[];
  /** distinct adequate views */
  adequateViews: number;
  seen: boolean;
  /** opacified in at least one diagnostic run */
  imaged: boolean;
  bestScore: number;
  /** imaged, never adequate, and the best foreshortening was below the threshold */
  foreshortenedOnly: boolean;
  /** imaged, never adequate, foreshortening was fine but overlap was not */
  overlappedOnly: boolean;
}

export interface CoverageResult {
  segments: SegmentCoverage[];
  /** required labels that were not seen */
  missing: string[];
  /** required labels flagged foreshortened-only */
  foreshortenedOnly: string[];
}

// --- geometry helpers -----------------------------------------------------------

const dist3 = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function polyLength(p: Vec3[]): number {
  let l = 0;
  for (let i = 1; i < p.length; i++) l += dist3(p[i], p[i - 1]);
  return l;
}

/** Resample a polyline at ~step mm (keeps both ends). */
export function resample(p: Vec3[], step: number): Vec3[] {
  if (p.length < 2) return p.slice();
  const out: Vec3[] = [p[0]];
  let carry = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const b = p[i];
    const d = dist3(a, b);
    let s = step - carry;
    while (s <= d) {
      const t = s / d;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
      s += step;
    }
    carry = d - (s - step);
  }
  const last = p[p.length - 1];
  if (dist3(out[out.length - 1], last) > 1e-6) out.push(last);
  return out;
}

const proj = (p: Vec3, b: CameraBasis) => ({ x: p.x * b.right.x + p.y * b.right.y + p.z * b.right.z, y: p.x * b.up.x + p.y * b.up.y + p.z * b.up.z });

/** Foreshortening of a set of polylines (length-weighted). */
export function foreshortening(polys: Vec3[][], b: CameraBasis): number {
  let l3 = 0;
  let l2 = 0;
  for (const p of polys) {
    for (let i = 1; i < p.length; i++) {
      l3 += dist3(p[i], p[i - 1]);
      const a = proj(p[i - 1], b);
      const c = proj(p[i], b);
      l2 += Math.hypot(c.x - a.x, c.y - a.y);
    }
  }
  return l3 > 1e-6 ? l2 / l3 : 0;
}

/**
 * Foreshortening of one labelled segment in a given C-arm view, for the live
 * attending (MentorInput.targetForeshortening). Undefined when the label is not
 * in the geometry. Cheap: one projection per centreline sample, no resampling.
 */
export function segmentForeshortening(g: SegmentGeometry, label: string, cArm: CArm): number | undefined {
  const polys = g.segments.filter((s) => s.label === label && s.points.length >= 2).map((s) => s.points);
  if (!polys.length) return undefined;
  return foreshortening(polys, cameraBasis(cArm));
}

interface Pt {
  x: number;
  y: number;
  w: Vec3;
}

/** Uniform 2D hash grid for "any point within r" queries. */
class Grid {
  private cells = new Map<string, Pt[]>();
  constructor(private r: number) {}
  private key(x: number, y: number) {
    return `${Math.floor(x / this.r)},${Math.floor(y / this.r)}`;
  }
  add(p: Pt) {
    const k = this.key(p.x, p.y);
    const c = this.cells.get(k);
    if (c) c.push(p);
    else this.cells.set(k, [p]);
  }
  /** true when some point is within r on the image and at least min3d away in 3D */
  hit(q: Pt, min3d: number): boolean {
    const cx = Math.floor(q.x / this.r);
    const cy = Math.floor(q.y / this.r);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const c = this.cells.get(`${cx + dx},${cy + dy}`);
        if (!c) continue;
        for (const p of c) if (Math.hypot(p.x - q.x, p.y - q.y) < this.r && dist3(p.w, q.w) >= min3d) return true;
      }
    return false;
  }
}

function angleBetweenViews(a: CArm, b: CArm): number {
  const fa = cameraBasis(a).forward;
  const fb = cameraBasis(b).forward;
  const d = Math.max(-1, Math.min(1, fa.x * fb.x + fa.y * fb.y + fa.z * fb.z));
  return (Math.acos(d) * 180) / Math.PI;
}

/** Group a geometry's polylines by label, resampled. */
function byLabel(g: SegmentGeometry, step: number): Map<string, { side: "left" | "right"; polys: Vec3[][] }> {
  const m = new Map<string, { side: "left" | "right"; polys: Vec3[][] }>();
  for (const s of g.segments) {
    if (s.points.length < 2) continue;
    const e = m.get(s.label) ?? { side: s.side, polys: [] };
    e.polys.push(resample(s.points, step));
    m.set(s.label, e);
  }
  return m;
}

/** Score every opacified segment in one view. */
export function scoreRun(g: SegmentGeometry, run: CoverageRun, params: CoverageParams = DEFAULT_COVERAGE, labels?: Map<string, { side: "left" | "right"; polys: Vec3[][] }>): Map<string, SegmentViewScore> {
  const lab = labels ?? byLabel(g, params.stepMm);
  const b = cameraBasis(run.cArm);
  const opac = new Set(run.opacified ?? [...lab.entries()].filter(([, v]) => run.side === "both" || v.side === run.side).map(([k]) => k));
  const cath = new Grid(params.overlapMm);
  if (g.catheter && g.catheter.length > 1)
    for (const w of resample(g.catheter, params.stepMm)) {
      const p2 = proj(w, b);
      cath.add({ x: p2.x, y: p2.y, w });
    }
  const out = new Map<string, SegmentViewScore>();
  for (const [label, v] of lab) {
    if (!opac.has(label)) continue;
    const f = foreshortening(v.polys, b);
    // overlap: superimposed on another opacified segment's samples (not its own)
    const others = new Grid(params.overlapMm);
    for (const [l2, v2] of lab) {
      if (l2 === label || !opac.has(l2)) continue;
      for (const poly of v2.polys)
        for (const w of poly) {
          const p2 = proj(w, b);
          others.add({ x: p2.x, y: p2.y, w });
        }
    }
    let n = 0;
    let hit = 0;
    let hitC = 0;
    for (const poly of v.polys)
      for (const w of poly) {
        const p2 = proj(w, b);
        const q: Pt = { x: p2.x, y: p2.y, w };
        n++;
        if (others.hit(q, params.overlap3dMm)) hit++;
        if (cath.hit(q, params.overlap3dMm)) hitC++;
      }
    const overlap = n ? hit / n : 0;
    const catheterOverlap = n ? hitC / n : 0;
    const score = f * (1 - Math.max(overlap, catheterOverlap));
    out.set(label, {
      runId: run.id,
      cArm: run.cArm,
      foreshortening: f,
      overlap,
      catheterOverlap,
      score,
      adequate: f >= params.minForeshortening && Math.max(overlap, catheterOverlap) <= params.maxOverlap,
    });
  }
  return out;
}

/** Coverage over a set of runs. `required` defaults to every label in the geometry. */
export function computeCoverage(g: SegmentGeometry, runs: CoverageRun[], required?: string[], params: CoverageParams = DEFAULT_COVERAGE): CoverageResult {
  const lab = byLabel(g, params.stepMm);
  const per = new Map<string, SegmentViewScore[]>();
  for (const r of runs) {
    if (r.diagnostic === false) continue;
    for (const [label, s] of scoreRun(g, r, params, lab)) {
      const a = per.get(label) ?? [];
      a.push(s);
      per.set(label, a);
    }
  }
  const segments: SegmentCoverage[] = [];
  for (const [label, v] of lab) {
    const views = per.get(label) ?? [];
    const adequate = views.filter((x) => x.adequate);
    // count adequate views with distinct directions (greedy)
    const distinct: CArm[] = [];
    for (const a of adequate) if (distinct.every((d) => angleBetweenViews(d, a.cArm) >= params.distinctViewDeg)) distinct.push(a.cArm);
    const imaged = views.length > 0;
    const seen = distinct.length >= params.minViews;
    const bestF = views.reduce((m, x) => Math.max(m, x.foreshortening), 0);
    segments.push({
      label,
      side: v.side,
      views,
      adequateViews: distinct.length,
      seen,
      imaged,
      bestScore: views.reduce((m, x) => Math.max(m, x.score), 0),
      foreshortenedOnly: imaged && adequate.length === 0 && bestF < params.minForeshortening,
      overlappedOnly: imaged && adequate.length === 0 && bestF >= params.minForeshortening,
    });
  }
  segments.sort((a, b) => labelOrder(a.label) - labelOrder(b.label));
  const req = required ?? segments.map((s) => s.label);
  const have = new Map(segments.map((s) => [s.label, s]));
  const missing = req.filter((l) => have.has(l) && !have.get(l)!.seen);
  const fs = req.filter((l) => have.get(l)?.foreshortenedOnly);
  return { segments, missing, foreshortenedOnly: fs };
}

/** Sort key for SYNTAX labels: "1" < "2" < ... < "9" < "9a" < "10" ... */
export function labelOrder(l: string): number {
  const m = /^(\d+)([a-z]?)$/.exec(l);
  if (!m) return 1e6;
  return +m[1] * 10 + (m[2] ? m[2].charCodeAt(0) - 96 : 0);
}

/**
 * SYNTAX segments a complete study of a side should show. Only labels present
 * in the patient's tree are required (a case without a ramus has no "12").
 */
export function requiredSegments(focus: "left" | "right" | "both", dominance: Dominance, present?: string[]): string[] {
  const right = ["1", "2", "3"];
  if (dominance !== "left") right.push("4", "16");
  const left = ["5", "6", "7", "8", "9", "11", "12a", "13"];
  if (dominance === "left") left.push("15", "14");
  const want = focus === "left" ? left : focus === "right" ? right : [...left, ...right];
  return present ? want.filter((l) => present.includes(l)) : want;
}

/** Plain-language segment names for the debrief. */
export const SEGMENT_NAMES: Record<string, string> = {
  "1": "proximal RCA",
  "2": "mid RCA",
  "3": "distal RCA",
  "4": "right PDA",
  "16": "right posterolateral",
  "16a": "right posterolateral 1",
  "16b": "right posterolateral 2",
  "16c": "right posterolateral 3",
  "5": "left main",
  "6": "proximal LAD",
  "7": "mid LAD",
  "8": "apical LAD",
  "9": "first diagonal",
  "9a": "first diagonal a",
  "10": "second diagonal",
  "10a": "second diagonal a",
  "11": "proximal circumflex",
  "12": "intermediate (ramus)",
  "12a": "first obtuse marginal",
  "12b": "second obtuse marginal",
  "13": "distal circumflex",
  "14": "left posterolateral",
  "14a": "left posterolateral a",
  "14b": "left posterolateral b",
  "15": "left PDA",
};

export const segmentName = (l: string): string => SEGMENT_NAMES[l] ?? `segment ${l}`;

// --- standardised loops ------------------------------------------------------------

/**
 * View family of a C-arm position, with the same thresholds as the library's
 * standardView() (src/ui/angio/library.ts): |primary| < 15 is AP, |secondary| >= 15
 * is cranial or caudal, LAO >= 70 is lateral. The thresholds are an app convention.
 */
export function viewFamily(c: CArm): string {
  const p = c.laoRao;
  const s = c.cranialCaudal;
  const ap = Math.abs(p) < 15;
  if (ap && s >= 15) return "AP cranial";
  if (ap && s <= -15) return "AP caudal";
  if (ap) return "AP";
  if (p < 0 && s >= 15) return "RAO cranial";
  if (p < 0 && s <= -15) return "RAO caudal";
  if (p < 0) return "RAO";
  if (p >= 70) return "Left lateral";
  if (s >= 15) return "LAO cranial";
  if (s <= -15) return "LAO caudal";
  return "LAO";
}

/**
 * Count standardised loops: diagnostic runs, one per (side, view family).
 * A repeat in a family already covered for that side is redundant.
 */
export function standardisedLoops(runs: CoverageRun[]): { count: number; redundant: CoverageRun[]; families: string[] } {
  const seen = new Set<string>();
  const redundant: CoverageRun[] = [];
  for (const r of runs) {
    if (r.diagnostic === false) continue;
    const k = `${r.side}:${viewFamily(r.cArm)}`;
    if (seen.has(k)) redundant.push(r);
    else seen.add(k);
  }
  return { count: seen.size, redundant, families: [...seen] };
}
