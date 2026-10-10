// Write synthetic contrast-only rasters of a few genomes as PGM (convert with: sips -s format png x.pgm --out x.png).
// usage: npx vite-node scripts/anatomy_validation/render_raster.ts <outDir> [n=3]
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase } from "../../src/types";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { rasterMetrics } from "./metrics";
// minimal writer without node typings in the app tsconfig
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = (globalThis as any).process ? await import("node:fs" as string) : null;
const out = ((globalThis as any).process?.argv?.[2] as string) ?? ".";
const n = +(((globalThis as any).process?.argv?.[3] as string) ?? 3);
const views: [string, number, number, "left" | "right"][] = [["RAOcra", -29, 25, "left"], ["APcra", 0, 32, "left"], ["LAOcra", 30, 27, "left"], ["RAOcau", -31, -22, "left"], ["RCA_LAO", 27, -2, "right"]];
for (let i = 0; i < n; i++) {
  const c = { id: `genome-${i}`, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] } as unknown as AnatomyCase;
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  for (const [name, lr, cc, side] of views) {
    const r = rasterMetrics(tree, model, side, { laoRao: lr, cranialCaudal: cc }, i);
    const header = `P5\n512 512\n255\n`;
    const buf = new Uint8Array(header.length + r.image.length);
    for (let k = 0; k < header.length; k++) buf[k] = header.charCodeAt(k);
    buf.set(r.image, header.length);
    fs.writeFileSync(`${out}/g${i}_${name}.pgm`, buf);
    console.log(i, name, "crossings", r.crossings, "area10", (r.area10 * 100).toFixed(1));
  }
}
