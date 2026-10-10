// pci-lab-shell-session: the PCI device drawing moved from src/ui/sections/AngioPci.tsx into the
// composer src/ui/pci/pciDevicesRender.ts (render/core.ts holds the wire, balloon, stent, dissection and
// perforation drawing). The device scenes of the realism baseline and a complication state must draw
// exactly what they drew before the move: these digests were taken from the pre-move code (the
// AngioPci.tsx of datasets/tmp/wp-snapshots/pci-lab-shell-session) on the same scenes.
import { describe, expect, it } from "vitest";
import { baselineSpecs, prepareFor, resolveSpec, sceneInputAt } from "../../dev/xrayCapture";
import { buildXrayScene } from "../../render/xray/sceneBuilder";
import type { Sample } from "../../render/xray/coronaryTree";
import type { BonePrim, TubeSpec } from "../../render/xray/thorax";
import type { Vec3, VesselId } from "../../types";
import { pciDevices as viaSection, pciFlowMods as flowViaSection } from "../sections/AngioPci";
import { PCI_RENDER_MODULES, pciDevices, pciFlowMods } from "./pciDevicesRender";
import { setup, start, wireToTarget } from "../../simulation/pci/testSetup";
import { inflate, loadDevice, moveDevice } from "../../simulation/angioPci";

/** FNV-1a over numbers rounded to 1e-5: a stable digest of what a draw returns. */
function digest(xs: number[]): string {
  let h = 0x811c9dc5;
  for (const x of xs) {
    const s = Number.isFinite(x) ? (Math.round(x * 1e5) / 1e5).toFixed(5) : String(x);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= 0x2c;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function flat(out: { tubes: TubeSpec[]; bones: BonePrim[] }): number[] {
  const xs: number[] = [out.tubes.length, out.bones.length];
  for (const t of out.tubes) {
    xs.push(t.pts.length);
    for (const p of t.pts) xs.push(p.x, p.y, p.z);
    for (const r of t.r) xs.push(r);
    xs.push(...(t.mu as (number | number[])[]).flat());
  }
  for (const b of out.bones) {
    xs.push(b.type, b.c.x, b.c.y, b.c.z, ...b.half, b.mu, b.muI ?? -1);
    for (const a of b.ax) xs.push(a.x, a.y, a.z);
  }
  return xs;
}

const place = (sm: Sample): Vec3 => ({ x: sm.ell * 10, y: sm.phi * 10, z: sm.h * 10 });

/** Digests of the four baseline device scenes (frame 0 and 25) and of a complication state, from the pre-move code. */
const GOLDEN: Record<string, string> = {"dev_guide@0":"ca3794a8","dev_guide@25":"ca3794a8","dev_wire@0":"7892e8a7","dev_wire@25":"7892e8a7","dev_balloon@0":"dfd09a94","dev_balloon@25":"dfd09a94","dev_stent@0":"40cefa8e","dev_stent@25":"40cefa8e","complication":"ef085c0c"};

function deviceSceneDigests(draw: typeof pciDevices): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of baselineSpecs("golden").filter((s) => s.devices)) {
    const R = resolveSpec(spec);
    const p = prepareFor(R);
    for (const k of [0, 25]) {
      const sink: { place?: (sm: Sample) => Vec3 } = {};
      const inp = sceneInputAt(p, R, k, sink);
      let captured: { tubes: TubeSpec[]; bones: BonePrim[] } | null = null;
      const pci = p.pci!;
      buildXrayScene({
        ...inp,
        extras: (pl, ctx) => {
          captured = draw(p.s, pci.st, pci.g, p.tree, pl, ctx, pci.atm);
          return captured;
        },
      });
      out[`${spec.name}@${k}`] = digest(flat(captured!));
    }
  }
  return out;
}

function complicationDigest(draw: typeof pciDevices): string {
  const su = setup("lad-focal");
  let st = wireToTarget(su, start(su));
  st = loadDevice(st, "balloon", "semi-compliant", 2.5, 15);
  st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
  st = inflate(su.s, su.g, st, 12);
  st = { ...st, dissection: { vessel: su.g.lesion.vessel as VesselId, atMm: su.g.lesion.centreMm, lengthMm: 8, kind: "lesion" }, perforation: { atMm: su.g.lesion.endMm, grade: 2 }, cineRuns: 3 };
  const a = draw(su.s, st, su.g, su.tree, place, { bolusT: null, injecting: false }, 12);
  const b = draw(su.s, st, su.g, su.tree, place, { bolusT: 1.2, injecting: true }, 12);
  return digest([...flat(a), ...flat(b)]);
}

describe("PCI device drawing after the move to the render registry", () => {
  it("AngioPci.tsx re-exports the composer's pciDevices and pciFlowMods", () => {
    expect(viaSection).toBe(pciDevices);
    expect(flowViaSection).toBe(pciFlowMods);
  });

  it("the composer finds render/core.ts by glob", () => {
    expect(PCI_RENDER_MODULES.map((m) => m.id)).toContain("core");
  });

  it("the baseline device scenes and a complication state draw what they drew before the move", () => {
    const now = { ...deviceSceneDigests(pciDevices), complication: complicationDigest(pciDevices) };
    expect(now).toEqual(GOLDEN);
  });
});
