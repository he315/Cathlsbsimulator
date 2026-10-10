// ---------------------------------------------------------------------------
// SegmentGeometry from the coronary tree (S3b SYNTAX labels per sample).
// Positions are the rest geometry (or a given motion state, e.g. end-diastole),
// in the tree's world frame (mm). Kept separate from coverage.ts so the
// coverage maths does not depend on the renderer's tree module.
// ---------------------------------------------------------------------------

import type { Vec3, VesselId } from "../types";
import { samplePos, segmentSpans, type CoronaryTree } from "../render/xray/coronaryTree";
import type { Motion } from "../render/xray/heart";
import type { SegmentGeometry, SegmentPolyline } from "./coverage";

/** Every SYNTAX label present in a tree. */
export function treeLabels(t: CoronaryTree): string[] {
  const s = new Set<string>();
  for (const v of t.vessels) for (const l of v.segment ?? []) if (l) s.add(l);
  return [...s];
}

/** Build the coverage geometry from a tree. `catheter` is an optional centreline in the same frame. */
export function treeSegmentGeometry(t: CoronaryTree, opts: { motion?: Motion; catheter?: Vec3[] } = {}): SegmentGeometry {
  const segments: SegmentPolyline[] = [];
  const byName = new Map(t.vessels.map((v) => [v.name, v]));
  for (const label of treeLabels(t)) {
    for (const span of segmentSpans(t, label)) {
      const v = byName.get(span.vessel);
      if (!v) continue;
      // include the sample before the span so consecutive segments join without a gap
      const from = Math.max(0, span.from - 1);
      const pts: Vec3[] = [];
      for (let i = from; i <= span.to; i++) pts.push(samplePos(t.heart, v.samples[i], opts.motion));
      if (pts.length >= 2) segments.push({ label, side: v.side, points: pts });
    }
  }
  return { segments, catheter: opts.catheter };
}

/**
 * The SYNTAX label at a lesion position, for MentorInput.targetSegment: the
 * sample of the named vessel (TreeVessel.lesionId) whose `param` (0..1 along the
 * named vessel, the same scale as a case or PCI-scenario lesion `position`) is
 * nearest to `position`. Undefined when the tree has no labels for that vessel.
 */
export function segmentLabelAt(t: CoronaryTree, vessel: VesselId | string, position: number): string | undefined {
  let best: { d: number; label: string } | undefined;
  for (const v of t.vessels) {
    if (v.lesionId !== vessel || !v.segment) continue;
    for (let i = 0; i < v.param.length; i++) {
      const l = v.segment[i];
      if (!l) continue;
      const d = Math.abs(v.param[i] - position);
      if (!best || d < best.d) best = { d, label: l };
    }
  }
  return best?.label;
}
