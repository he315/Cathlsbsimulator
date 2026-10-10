// ---------------------------------------------------------------------------
// The PCI lab's core device drawing (pci-lab-shell-session): deployed stents,
// the coronary wire with its bent tip and radiopaque coil, the balloon or
// stent delivery system (folded, inflated with diluted contrast, crimped or
// expanding), a dissection's contrast-filled false channel and a
// perforation's extravasated contrast. Moved unchanged from
// src/ui/sections/AngioPci.tsx; the composer src/ui/pci/pciDevicesRender.ts
// finds this file by glob and adds what later device packages draw.
// ---------------------------------------------------------------------------

import { MU, type BonePrim, type TubeSpec } from "../../../render/xray/thorax";
import { balloonDiameter, stentDiameter } from "../../../simulation/pciBench";
import { routeSamples, sampleAtMm, tipBend, type PciGeom, type PciState } from "../../../simulation/angioPci";
import type { Vec3 } from "../../../types";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "core";
/** First in the composition (the devices later packages add are drawn after these). */
export const order = 0;

/** Wire, balloon, stents and contrast staining for this frame, in world coordinates. */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  const { tree, place, ctx } = x;
  const tubes: TubeSpec[] = [];
  const bones: BonePrim[] = [];
  const iodine = (mg: number) => MU.iodinePerMg * mg;
  const radiusAt = (mm: number) => {
    const a = sampleAtMm(g, st.route, mm);
    if (!a) return 1;
    const v = tree.vessels.find((t) => t.name === a.v.name) ?? a.v;
    return v.radii[Math.min(v.radii.length - 1, Math.round(a.idx))];
  };

  // ---- deployed stents: thin metal shells that follow the lumen ----
  for (const p of st.stents) {
    const route = st.route;
    const sm = routeSamples(g, route, p.fromMm, p.toMm, 0.8);
    if (sm.length < 2) continue;
    const pts = sm.map(place);
    const r = sm.map((_, i) => radiusAt(p.fromMm + ((p.toMm - p.fromMm) * i) / (sm.length - 1)) + 0.05);
    tubes.push({ pts, r: r.map((v) => v + 0.09), mu: [0, 0, 0.9] });
    tubes.push({ pts, r, mu: [0, 0, -0.9] });
  }

  // ---- wire ----
  if (st.tipMm > 0) {
    const sm = routeSamples(g, st.route, 0, st.tipMm, 1.2);
    const pts = sm.map(place);
    if (pts.length >= 2) {
      // bent tip, pointing the way the operator has torqued it
      const tb = tipBend(g, st);
      const a = pts[pts.length - 2],
        b = pts[pts.length - 1];
      const T = norm({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
      if (tb) {
        const d = norm(addv(scalev(T, Math.cos(0.6)), scalev(tb.bend, Math.sin(0.6))));
        pts.push(addv(b, scalev(d, 1.5)), addv(b, scalev(d, 3)));
      }
      tubes.push({ pts, r: pts.map(() => 0.178), mu: [0, 0, 1.9] });
      // radiopaque distal coil (last ~30 mm)
      let acc = 0;
      const coil: Vec3[] = [pts[pts.length - 1]];
      for (let i = pts.length - 2; i >= 0 && acc < 30; i--) {
        acc += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y, pts[i + 1].z - pts[i].z);
        coil.unshift(pts[i]);
      }
      tubes.push({ pts: coil, r: coil.map(() => 0.178), mu: [0, 0, 6.5] });
    }
  }

  // ---- balloon / stent delivery system ----
  const dev = st.device;
  if (dev && dev.centreMm + dev.lengthMm / 2 > 0) {
    const from = Math.max(0, dev.centreMm - dev.lengthMm / 2);
    const to = dev.centreMm + dev.lengthMm / 2;
    const sm = routeSamples(g, st.route, from, to, 0.6);
    const pts = sm.map(place);
    if (pts.length >= 2) {
      const markers = (mm: number) => {
        const m = routeSamples(g, st.route, mm - 0.5, mm + 0.5, 0.5).map(place);
        if (m.length >= 2) tubes.push({ pts: m, r: m.map(() => 0.42), mu: [0, 0, 3.2] });
      };
      if (dev.inflated) {
        const nominalD = dev.kind === "stent" ? stentDiameter(dev.diameter, dev.atm) : balloonDiameter(dev.balloon, dev.diameter, dev.atm);
        // waist where the lesion resists
        const yieldF = Math.max(0, 1 - Math.max(0, dev.atm - 6) / 20);
        const r = sm.map((_, i) => {
          const mm = from + ((to - from) * i) / Math.max(1, sm.length - 1);
          const inLes = st.route.includes(g.lesion.vessel) && mm > g.lesion.startMm && mm < g.lesion.endMm;
          const f = inLes ? 0.5 + 0.5 * Math.cos((Math.PI * (mm - g.lesion.centreMm)) / ((g.lesion.endMm - g.lesion.startMm) / 2)) : 0;
          const waist = 1 - st.resistance * (st.stents.length ? 0.6 : 1) * yieldF * f;
          // tapered shoulders
          const edge = Math.min(1, Math.min(mm - from, to - mm) / 1.5 + 0.35);
          return (nominalD / 2) * waist * edge;
        });
        // diluted contrast (about 1:1) fills the balloon
        tubes.push({ pts, r, mu: [0, iodine(175), 0] });
        if (dev.kind === "stent") {
          tubes.push({ pts, r: r.map((v) => v + 0.09), mu: [0, 0, 0.9] });
          tubes.push({ pts, r, mu: [0, 0, -0.9] });
        }
      } else {
        // folded balloon (nearly radiolucent) or crimped stent (a faint dense sleeve)
        if (dev.kind === "stent") {
          tubes.push({ pts, r: pts.map(() => 0.58), mu: [0, 0, 0.55] });
          tubes.push({ pts, r: pts.map(() => 0.46), mu: [0, 0, -0.55] });
        } else tubes.push({ pts, r: pts.map(() => 0.45), mu: [0.02, 0, 0] });
      }
      markers(dev.centreMm - dev.lengthMm / 2 + 0.6);
      markers(dev.centreMm + dev.lengthMm / 2 - 0.6);
    }
  }

  // ---- dissection: a contrast-filled false channel beside the lumen, staining after injections ----
  if (st.dissection) {
    const d = st.dissection;
    const sm = routeSamples(g, st.route, d.atMm - d.lengthMm / 2, d.atMm + d.lengthMm / 2, 0.8);
    if (sm.length >= 2) {
      const pts = sm.map(place);
      const r0 = radiusAt(d.atMm);
      const n = sideways(pts);
      const off = pts.map((p) => addv(p, scalev(n, r0 + 0.25)));
      const mg = ctx.bolusT !== null ? 260 : 70;
      tubes.push({ pts: off, r: off.map((_, i) => 0.32 * Math.sin((Math.PI * (i + 0.5)) / off.length)), mu: [0, iodine(mg), 0] });
    }
  }

  // ---- perforation: extravasated contrast that grows with each injection ----
  if (st.perforation) {
    const at = sampleAtMm(g, st.route, st.perforation.atMm);
    if (at) {
      const c = place(at.s);
      const R = 3 + 2.5 * st.perforation.grade + Math.min(6, st.cineRuns * 0.4);
      const mg = ctx.bolusT !== null ? 120 : 45;
      bones.push({ type: 0, c, ax: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }], half: [R, R * 0.7, R], mu: 0, muI: iodine(mg) / 3 });
    }
  }
  return { tubes, bones };
}

const addv = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scalev = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
/** A unit vector perpendicular to a short polyline. */
function sideways(pts: Vec3[]): Vec3 {
  const a = pts[0],
    b = pts[pts.length - 1];
  const T = norm({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
  const up = Math.abs(T.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  return norm({ x: T.y * up.z - T.z * up.y, y: T.z * up.x - T.x * up.z, z: T.x * up.y - T.y * up.x });
}
