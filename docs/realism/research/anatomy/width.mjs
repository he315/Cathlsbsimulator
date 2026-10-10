// Edge-to-edge width of a dark tubular structure (catheter or vessel) across its axis.
// usage: node width.mjs <set/run> <frame0> "x1,y1,x2,y2;..."  (axis segments; width sampled every 2 px along each)
import { readJpg, LIB } from "./img.mjs";
import path from "node:path";
const [run, fi, segs] = process.argv.slice(2);
const im = readJpg(path.join(LIB, run, `f${String(+fi + 1).padStart(3, "0")}.jpg`));
const { w, h, px } = im;
const at = (x, y) => {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const g = (a, b) => px[Math.min(h - 1, Math.max(0, b)) * w + Math.min(w - 1, Math.max(0, a))];
  return g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy;
};
export function widthAt(cx, cy, ux, uy, half = 16) {
  // perpendicular (nx, ny); average 5 parallel profiles 1 px apart along the axis
  const nx = -uy, ny = ux;
  const prof = [];
  for (let t = -half; t <= half; t += 0.25) {
    let s = 0;
    for (let a = -2; a <= 2; a++) s += at(cx + nx * t + ux * a, cy + ny * t + uy * a);
    prof.push(s / 5);
  }
  // smooth lightly
  const sm = prof.map((_, i) => { let s = 0, c = 0; for (let k = -2; k <= 2; k++) if (prof[i + k] !== undefined) { s += prof[i + k]; c++; } return s / c; });
  const mid = Math.floor(sm.length / 2);
  // minimum near the centre
  let im0 = mid; for (let i = mid - 16; i <= mid + 16; i++) if (sm[i] < sm[im0]) im0 = i;
  const grad = sm.map((v, i) => (i > 0 && i < sm.length - 1 ? (sm[i + 1] - sm[i - 1]) / 2 : 0));
  let L = im0, R = im0;
  for (let i = im0; i > 2; i--) if (grad[i] < grad[L]) L = i; // falling edge (bright -> dark) left of the minimum
  for (let i = im0; i < sm.length - 3; i++) if (grad[i] > grad[R]) R = i;
  const bg = (sm[2] + sm[sm.length - 3]) / 2;
  return { width: (R - L) * 0.25, depth: bg - sm[im0] };
}
if (segs) {
  for (const sgm of segs.split(";")) {
    const [x1, y1, x2, y2] = sgm.split(",").map(Number);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const ws = [];
    for (let s = 0; s <= len; s += 2) ws.push(widthAt(x1 + ux * s, y1 + uy * s, ux, uy));
    const W = ws.map((q) => q.width).sort((a, b) => a - b);
    console.log(`${sgm}: median width ${W[Math.floor(W.length / 2)].toFixed(2)} px (n=${W.length}, IQR ${W[Math.floor(W.length / 4)].toFixed(2)}-${W[Math.floor((3 * W.length) / 4)].toFixed(2)}), depth ${(ws.reduce((a, q) => a + q.depth, 0) / ws.length).toFixed(0)}`);
  }
}
