// ---------------------------------------------------------------------------
// Catheter silhouette tracing in the pre-contrast first frame of real runs
// (CoronaryDominance library, datasets/library/dominance*/), for the rest-
// shape calibration (calibrate.ts, docs/realism/wave2/I3.md).
//
//   TRACE=1 npx vite-node src/physics/calibration/trace.ts -- [out.json] [qcDir] [filter]
//
// For every run with C-arm angles (artefact-tagged runs skipped) the first
// frame is traced with ridge.ts from each entry candidate on the field edge;
// the longest trace that ends at a tip inside the field is kept. Runs are
// written with their trace (tip first, px), the angles, the per-run outer
// catheter width and simple quality figures. QC sheets (24 runs per sheet,
// trace in red, tip in blue) are written to qcDir for visual acceptance;
// the accepted list lives in traces.json (see select.ts).
// ---------------------------------------------------------------------------

import { nodeMods, readJpg, repoRoot, writePngRgb, type Grey } from "./image";
import { ridgeMap, entryCandidates, followRidge, widthAt, valleyDepth, resamplePolyline, polylineLength, bilinear, type TraceResult } from "./ridge";

export interface RunInfo {
  id: string;
  dataset: "dominance" | "dominance-main";
  artery: "LCA" | "RCA";
  primary: number;
  secondary: number;
  dir: string;
  frame: string;
}

export interface RawTrace {
  id: string;
  dataset: string;
  artery: "LCA" | "RCA";
  primary: number;
  secondary: number;
  frame: string;
  /** tip first, px (x right, y down), 1 px spacing */
  px: [number, number][];
  lengthPx: number;
  widthPx: number | null;
  meanR: number;
  end: TraceResult["end"];
  /** distal 70 mm: median valley depth (grey levels) and the fraction of points deeper than 3 levels */
  depthMed: number;
  depthFrac: number;
  /** exposed field box */
  field: { x0: number; y0: number; x1: number; y1: number };
}

export async function listRuns(): Promise<RunInfo[]> {
  const { fs, path } = await nodeMods();
  const lib = path.join(repoRoot(), "datasets", "library");
  const out: RunInfo[] = [];
  for (const ds of ["dominance", "dominance-main"] as const) {
    const f = path.join(lib, ds, "index.json");
    if (!fs.existsSync(f)) continue;
    const idx = JSON.parse(new TextDecoder().decode(fs.readFileSync(f))) as {
      patients: { runs: { id: string; artery: string; frames: string[]; angles?: { primary: number; secondary: number } | null; tags?: { artefact?: boolean } }[] }[];
    };
    for (const p of idx.patients) {
      for (const r of p.runs) {
        if (!r.angles || r.tags?.artefact) continue;
        if (r.artery !== "LCA" && r.artery !== "RCA") continue;
        out.push({ id: r.id, dataset: ds, artery: r.artery, primary: r.angles.primary, secondary: r.angles.secondary, dir: path.join(lib, ds, r.id), frame: r.frames[0] });
      }
    }
  }
  return out;
}

export function traceFrame(im: Grey): { best: TraceResult | null; widthPx: number | null; field: RawTrace["field"]; depthMed: number; depthFrac: number } {
  const m = ridgeMap(im, 2);
  const cands = entryCandidates(m, 8);
  let best: TraceResult | null = null;
  let bestScore = -Infinity;
  for (const e of cands) {
    const tr = followRidge(m, e.x, e.y, e.dx, e.dy);
    if (tr.end !== "tip") continue;
    const L = polylineLength(tr.pts);
    if (L < 60) continue;
    // a catheter ends inside the field, not at its lower edge; prefer long, strong traces
    const sc = L * Math.min(1, tr.meanR / 4);
    if (sc > bestScore) {
      bestScore = sc;
      best = tr;
    }
  }
  let widthPx: number | null = null;
  if (best) {
    const ws: number[] = [];
    const p = best.pts;
    for (let i = 4; i < p.length - 4; i += 3) {
      const dx = p[i + 3][0] - p[i - 3][0], dy = p[i + 3][1] - p[i - 3][1], l = Math.hypot(dx, dy) || 1;
      const wd = widthAt(m.G, m.w, m.h, p[i][0], p[i][1], dx / l, dy / l);
      if (wd !== null) ws.push(wd);
    }
    ws.sort((a, b) => a - b);
    widthPx = ws.length >= 5 ? ws[Math.floor(ws.length / 2)] : null;
  }
  let depthMed = 0, depthFrac = 0;
  if (best) {
    // distal 70 mm (the trace runs entry -> tip here)
    const p = best.pts;
    const nD = Math.min(p.length - 4, Math.round(70 / 0.3077 / 1.5));
    const ds: number[] = [];
    for (let i = p.length - 4; i > p.length - 4 - nD && i >= 3; i--) {
      const dx = p[i + 3][0] - p[i - 3][0], dy = p[i + 3][1] - p[i - 3][1], l = Math.hypot(dx, dy) || 1;
      ds.push(valleyDepth(m.G, m.w, m.h, p[i][0], p[i][1], dx / l, dy / l));
    }
    if (ds.length) {
      depthFrac = ds.filter((d) => d > 3).length / ds.length;
      ds.sort((a, b) => a - b);
      depthMed = ds[Math.floor(ds.length / 2)];
    }
  }
  return { best, widthPx, field: m.field, depthMed, depthFrac };
}

/** QC tile: a full-resolution crop around the distal part of the trace, trace drawn as sparse dots so the catheter stays visible. */
export function overlay(im: Grey, pts: [number, number][], size = 256, distalPx = 220): { w: number; h: number; rgb: Uint8Array } {
  const n = Math.min(pts.length, distalPx);
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) {
    cx += pts[i][0];
    cy += pts[i][1];
  }
  cx = n ? cx / n : im.w / 2;
  cy = n ? cy / n : im.h / 2;
  const ox = Math.round(Math.max(0, Math.min(im.w - size, cx - size / 2)));
  const oy = Math.round(Math.max(0, Math.min(im.h - size, cy - size / 2)));
  const w = size, h = size;
  const rgb = new Uint8Array(3 * w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(255, im.px[(oy + y) * im.w + ox + x]));
      rgb[3 * (y * w + x)] = v;
      rgb[3 * (y * w + x) + 1] = v;
      rgb[3 * (y * w + x) + 2] = v;
    }
  }
  const dot = (x: number, y: number, c: [number, number, number], r: number) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const xx = Math.round(x - ox) + dx, yy = Math.round(y - oy) + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) rgb.set(c, 3 * (yy * w + xx));
      }
  };
  for (let i = 0; i < pts.length; i += 4) dot(pts[i][0] + 6, pts[i][1], [255, 40, 40], 0);
  if (pts.length) dot(pts[0][0], pts[0][1], [40, 120, 255], 1);
  // 60 mm along the trace from the tip (at the library 6F scale) marked in green
  const k60 = Math.round(60 / 0.3077);
  if (pts.length > k60) dot(pts[k60][0], pts[k60][1], [40, 220, 40], 1);
  return { w, h, rgb };
}

export function sheet(tiles: { w: number; h: number; rgb: Uint8Array }[], cols: number): { w: number; h: number; rgb: Uint8Array } {
  const tw = tiles[0].w, th = tiles[0].h;
  const rows = Math.ceil(tiles.length / cols);
  const W = cols * tw, H = rows * th;
  const rgb = new Uint8Array(3 * W * H);
  tiles.forEach((t, k) => {
    const ox = (k % cols) * tw, oy = Math.floor(k / cols) * th;
    for (let y = 0; y < th; y++) rgb.set(t.rgb.subarray(3 * y * tw, 3 * (y + 1) * tw), 3 * ((oy + y) * W + ox));
    // tile separator
    for (let y = 0; y < th; y++) rgb.set([0, 160, 0], 3 * ((oy + y) * W + ox));
    for (let x = 0; x < tw; x++) rgb.set([0, 160, 0], 3 * (oy * W + ox + x));
  });
  return { w: W, h: H, rgb };
}

/**
 * Automatic pre-filter before the visual QC (tracing parameters): the trace ends at a tip at least
 * 15 px inside the exposed field, is at least 80 mm long at the library 6F scale (0.3077 mm/px,
 * S0 facts), has a plausible outer width (4-10 px), and over its distal 70 mm is a dark valley (median
 * depth at least 8 grey levels, at least 85% of points deeper than 3 levels): edges and gaps are not.
 */
export function autoAccept(t: RawTrace): boolean {
  const [x, y] = t.px[0];
  const f = t.field;
  const inside = x > f.x0 + 15 && x < f.x1 - 15 && y > f.y0 + 15 && y < f.y1 - 15;
  return t.end === "tip" && inside && t.lengthPx * 0.3077 >= 80 && t.widthPx !== null && t.widthPx >= 4 && t.widthPx <= 10 && t.depthMed >= 8 && t.depthFrac >= 0.85;
}

const PER_SHEET = 16;
const proc = (globalThis as { process?: { argv?: string[]; env?: Record<string, string | undefined> } }).process;
if (proc?.env?.TRACE === "1") {
  const { fs, path } = await nodeMods();
  const args = (proc.argv ?? []).slice(2).filter((a) => a !== "--" && !/trace\.ts$/.test(a));
  const outFile = args[0] ?? path.join(repoRoot(), "src/physics/calibration/raw-traces.json");
  const qcDir = args[1] ?? "";
  const filter = args[2] ? new RegExp(args[2]) : null;
  if (qcDir) fs.mkdirSync(qcDir, { recursive: true });
  let runs = await listRuns();
  if (filter) runs = runs.filter((r) => filter.test(r.id));
  const out: RawTrace[] = [];
  const tiles: { w: number; h: number; rgb: Uint8Array }[] = [];
  const order: string[] = [];
  let n = 0;
  let sheetNo = 0;
  for (const r of runs) {
    n++;
    let im: Grey;
    try {
      im = readJpg(path.join(r.dir, r.frame));
    } catch {
      continue;
    }
    const { best, widthPx, field, depthMed, depthFrac } = traceFrame(im);
    if (!best) continue;
    // tip first, 1 px spacing
    const px = resamplePolyline(best.pts.slice().reverse(), 1).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] as [number, number]);
    const rec: RawTrace = { id: r.id, dataset: r.dataset, artery: r.artery, primary: r.primary, secondary: r.secondary, frame: r.frame, px, lengthPx: polylineLength(px), widthPx, meanR: best.meanR, end: best.end, depthMed, depthFrac, field };
    out.push(rec);
    if (qcDir && autoAccept(rec)) {
      tiles.push(overlay(im, px));
      order.push(r.id);
      if (tiles.length === PER_SHEET) {
        const s = sheet(tiles, 4);
        writePngRgb(path.join(qcDir, `qc-${String(sheetNo).padStart(3, "0")}.png`), s.w, s.h, s.rgb);
        fs.writeFileSync(path.join(qcDir, `qc-${String(sheetNo).padStart(3, "0")}.json`), JSON.stringify(order));
        tiles.length = 0;
        order.length = 0;
        sheetNo++;
      }
    }
    if (n % 100 === 0) console.log(`${n}/${runs.length} runs, ${out.length} traced`);
  }
  if (qcDir && tiles.length) {
    const s = sheet(tiles, 4);
    const k = String(sheetNo).padStart(3, "0");
    writePngRgb(path.join(qcDir, `qc-${k}.png`), s.w, s.h, s.rgb);
    fs.writeFileSync(path.join(qcDir, `qc-${k}.json`), JSON.stringify(order));
  }
  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log(`traced ${out.length} of ${runs.length} runs → ${outFile}`);
}
