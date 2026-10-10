// ---------------------------------------------------------------------------
// The PCI lab's device drawing and live flow conditions (pci-lab-shell-session).
//
// pciDevices composes the device drawing from every src/ui/pci/render/*.ts
// (each exports `id`, `order` and `draw(st, g, x)` returning tubes and bone
// primitives in world coordinates), in order, so a device package adds a file
// instead of editing this one. render/core.ts holds the wire, balloon, stent,
// dissection and perforation drawing that lived in
// src/ui/sections/AngioPci.tsx. pciFlowMods gives the contrast transport the
// lab's live flow (an inflated balloon stops antegrade contrast beyond it;
// slow flow is regional, beyond the treated lesion).
//
// AngioPci.tsx re-exports both, so the segments demo, the realism-baseline
// device captures (src/dev/xrayCapture.ts) and their tests keep importing
// them from there.
// ---------------------------------------------------------------------------

import type { CoronaryTree, Sample } from "../../render/xray/coronaryTree";
import type { TransportMods } from "../../render/xray/contrastTransport";
import type { BonePrim, TubeSpec } from "../../render/xray/thorax";
import { sampleAtMm, type PciGeom, type PciScenario, type PciState } from "../../simulation/angioPci";
import type { Vec3 } from "../../types";

/** What a device drawing module receives besides the state and the geometry. */
export interface PciDrawContext {
  s: PciScenario;
  /** the coronary tree drawn this frame (its lumen follows the treatment) */
  tree: CoronaryTree;
  /** the heart-surface mapping of this frame: a tree sample to world coordinates */
  place: (sm: Sample) => Vec3;
  /** the run in progress (seconds since the press) and whether contrast is flowing */
  ctx: { bolusT: number | null; injecting: boolean };
  /** the indeflator's pressure (atm) */
  atm: number;
}

export interface PciDrawResult {
  tubes: TubeSpec[];
  bones: BonePrim[];
}

/** A file under src/ui/pci/render/. */
export interface PciRenderModule {
  id: string;
  /** drawing order, ascending (core is 0) */
  order: number;
  draw: (st: PciState, g: PciGeom, x: PciDrawContext) => PciDrawResult;
}

/** Collect the render modules from glob results (path to module); throws on a malformed or duplicate module. */
export function collectRenderModules(files: Record<string, Partial<PciRenderModule>>): PciRenderModule[] {
  const out: PciRenderModule[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(files).sort()) {
    const m = files[path];
    if (!m || typeof m.id !== "string" || !m.id) throw new Error(`PCI render file ${path} exports no id`);
    if (typeof m.draw !== "function") throw new Error(`PCI render file ${path} exports no draw()`);
    if (!Number.isFinite(m.order)) throw new Error(`PCI render file ${path} exports no order`);
    const prev = seen.get(m.id);
    if (prev) throw new Error(`PCI render id '${m.id}' is declared by ${prev} and ${path}`);
    seen.set(m.id, path);
    out.push({ id: m.id, order: m.order!, draw: m.draw });
  }
  return out.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const FILES = import.meta.glob<Partial<PciRenderModule>>(["./render/*.ts", "!./render/*.test.ts"], { eager: true });

/** Every device drawing module, in drawing order. */
export const PCI_RENDER_MODULES: readonly PciRenderModule[] = collectRenderModules(FILES);

/** Wire, balloon, stents and contrast staining for this frame, in world coordinates (every render module, in order). */
export function pciDevices(
  s: PciScenario,
  st: PciState,
  g: PciGeom,
  tree: CoronaryTree,
  place: (sm: Sample) => Vec3,
  ctx: { bolusT: number | null; injecting: boolean },
  atm: number
): PciDrawResult {
  const x: PciDrawContext = { s, tree, place, ctx, atm };
  if (PCI_RENDER_MODULES.length === 1) return PCI_RENDER_MODULES[0].draw(st, g, x);
  const tubes: TubeSpec[] = [];
  const bones: BonePrim[] = [];
  for (const m of PCI_RENDER_MODULES) {
    const r = m.draw(st, g, x);
    tubes.push(...r.tubes);
    bones.push(...r.bones);
  }
  return { tubes, bones };
}

/** Slow-flow (no-reflow) flow share beyond the treated lesion (model parameter; the earlier lab's 0.3 flow scale). */
export const NO_REFLOW_SCALE = 0.3;

/** Live flow conditions of the PCI lab for the contrast transport (balloon occlusion, regional no-reflow). */
export function pciFlowMods(s: PciScenario, st: PciState, g: PciGeom, tree: CoronaryTree): TransportMods {
  const mods: TransportMods = {};
  const dev = st.device;
  if (dev && dev.inflated) {
    const at = sampleAtMm(g, st.route, Math.max(0, dev.centreMm - dev.lengthMm / 2));
    if (at) {
      const v = tree.vessels.find((x) => x.name === at.v.name) ?? at.v;
      const i = Math.max(0, Math.min(v.param.length - 1, Math.round(at.idx)));
      mods.occlusions = [{ vessel: v.name, param: v.param[i], fraction: 1 }];
    }
  }
  if (st.slowFlow) {
    const v = tree.vessels.find((x) => x.lesionId === s.target.vessel && x.kind !== "collateral");
    if (v) mods.noReflow = { vessel: v.name, param: s.target.position, scale: NO_REFLOW_SCALE };
  }
  return mods;
}
