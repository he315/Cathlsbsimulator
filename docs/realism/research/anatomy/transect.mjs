// Count vessels crossing horizontal transects (real frames): vesselness peaks along rows in the middle of the tree.
import { readJpg, LIB } from "./img.mjs";
import { vesselness, maskFrom } from "./skel.mjs";
import path from "node:path";
const N = 512;
export function transectCount(px, thr = 8) {
  const v = vesselness(px);
  const m = maskFrom(v, 12, 7, 80, 24);
  const ys = []; for (let i = 0; i < N * N; i++) if (m[i]) ys.push((i / N) | 0);
  ys.sort((a, b) => a - b);
  const y0 = ys[Math.floor(ys.length * 0.1)], y1 = ys[Math.floor(ys.length * 0.9)];
  const counts = [];
  for (let f = 0.3; f <= 0.71; f += 0.1) {
    const y = Math.round(y0 + (y1 - y0) * f);
    const row = []; for (let x = 0; x < N; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += v[(y + k) * N + x]; row.push(s / 5); }
    let c = 0; for (let x = 26; x < N - 26; x++) if (row[x] > thr && row[x] >= row[x - 1] && row[x] > row[x + 1] && row[x] >= Math.max(...row.slice(x - 3, x + 4))) c++;
    counts.push(c);
  }
  return { counts, max: Math.max(...counts), med: counts.slice().sort((a, b) => a - b)[2] };
}
if ((process.argv[1] || "").endsWith("transect.mjs")) {
  for (const spec of process.argv.slice(2)) {
    const [run, fi] = spec.split("@");
    const im = readJpg(path.join(LIB, run, `f${String(+fi + 1).padStart(3, "0")}.jpg`));
    console.log(run, fi, JSON.stringify(transectCount(im.px)));
  }
}
