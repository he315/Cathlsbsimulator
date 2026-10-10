// Automatic catheter-shaft width (px) per run: a dark 4-14 px valley chain that enters from the top edge.
import { runs, readJpg } from "./img.mjs";
import path from "node:path";
import fs from "node:fs";

function widthAtFactory(im) {
  const { w, h, px } = im;
  const at = (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (a, b) => px[Math.min(h - 1, Math.max(0, b)) * w + Math.min(w - 1, Math.max(0, a))];
    return g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy;
  };
  return (cx, cy, ux, uy, half = 14) => {
    const nx = -uy, ny = ux, prof = [];
    for (let t = -half; t <= half; t += 0.25) { let s = 0; for (let a = -2; a <= 2; a++) s += at(cx + nx * t + ux * a, cy + ny * t + uy * a); prof.push(s / 5); }
    const sm = prof.map((_, i) => { let s = 0, c = 0; for (let k = -2; k <= 2; k++) if (prof[i + k] !== undefined) { s += prof[i + k]; c++; } return s / c; });
    const mid = Math.floor(sm.length / 2);
    let im0 = mid; for (let i = mid - 12; i <= mid + 12; i++) if (sm[i] < sm[im0]) im0 = i;
    const grad = sm.map((v, i) => (i > 0 && i < sm.length - 1 ? (sm[i + 1] - sm[i - 1]) / 2 : 0));
    let L = im0, R = im0;
    for (let i = im0; i > 2; i--) if (grad[i] < grad[L]) L = i;
    for (let i = im0; i < sm.length - 3; i++) if (grad[i] > grad[R]) R = i;
    return { width: (R - L) * 0.25, depth: (sm[2] + sm[sm.length - 3]) / 2 - sm[im0], centreOff: (im0 - mid) * 0.25 };
  };
}

export function catheterWidth(im) {
  const { w, px } = im;
  const rows = [];
  for (let y = 6; y <= 70; y += 4) {
    const prof = [];
    for (let x = 0; x < w; x++) { let s = 0; for (let k = -1; k <= 1; k++) s += px[(y + k) * w + x]; prof.push(s / 3); }
    const mins = [];
    for (let x = 16; x < w - 16; x++) {
      const v = prof[x];
      if (v > prof[x - 1] || v > prof[x + 1]) continue;
      const bgL = Math.max(...prof.slice(x - 14, x - 6)), bgR = Math.max(...prof.slice(x + 7, x + 15));
      const depth = Math.min(bgL, bgR) - v;
      if (depth < 18) continue;
      mins.push({ x, depth });
    }
    rows.push({ y, mins });
  }
  // chains starting at the top row
  let best = null;
  for (const m0 of rows[0].mins) {
    const chain = [{ x: m0.x, y: rows[0].y }];
    let cx = m0.x;
    for (let r = 1; r < rows.length; r++) {
      const nxt = rows[r].mins.filter((m) => Math.abs(m.x - cx) <= 6).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0];
      if (!nxt) break;
      chain.push({ x: nxt.x, y: rows[r].y });
      cx = nxt.x;
    }
    if (!best || chain.length > best.length) best = chain;
  }
  if (!best || best.length < 6) return null;
  const wa = widthAtFactory(im);
  const ws = [];
  for (let i = 1; i < best.length - 1; i++) {
    const dx = best[i + 1].x - best[i - 1].x, dy = best[i + 1].y - best[i - 1].y, l = Math.hypot(dx, dy);
    const r = wa(best[i].x, best[i].y, dx / l, dy / l);
    if (r.width > 3 && r.width < 14 && Math.abs(r.centreOff) < 3) ws.push(r.width);
  }
  if (ws.length < 4) return null;
  ws.sort((a, b) => a - b);
  return { width: ws[Math.floor(ws.length / 2)], n: ws.length, spread: ws[Math.floor(ws.length * 0.75)] - ws[Math.floor(ws.length * 0.25)], top: best[0], len: best.length };
}

if (process.argv[1].endsWith("cathwidth.mjs")) {
  const all = [...runs("dominance-main"), ...runs("dominance")].filter((r) => r.angles && !r.tags?.artefact);
  const out = [];
  for (const r of all) {
    const im = readJpg(path.join(r.dir, r.frames[Math.floor(r.frames.length * 0.5)]));
    const c = catheterWidth(im);
    if (c && c.spread <= 1.5) out.push({ id: r.id, artery: r.artery, ...c });
  }
  fs.writeFileSync((process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)) + "cathwidth.json", JSON.stringify(out));
  const W = out.map((o) => o.width).sort((a, b) => a - b);
  const q = (p) => W[Math.floor(p * (W.length - 1))];
  console.log("runs scanned", all.length, "accepted", out.length, "width px p10/p25/p50/p75/p90", q(0.1), q(0.25), q(0.5), q(0.75), q(0.9));
  const hist = {};
  for (const x of W) hist[Math.round(x)] = (hist[Math.round(x)] || 0) + 1;
  console.log(JSON.stringify(hist));
}
