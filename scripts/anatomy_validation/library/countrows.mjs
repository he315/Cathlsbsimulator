import { maskFrom } from "./skel.mjs";
const N = 512;
export function countRows(v) {
  const m = maskFrom(v, 12, 7, 80, 24);
  const ys = []; for (let i = 0; i < N * N; i++) if (m[i]) ys.push((i / N) | 0);
  if (ys.length < 500) return null;
  ys.sort((a, b) => a - b);
  const y0 = ys[Math.floor(ys.length * 0.1)], y1 = ys[Math.floor(ys.length * 0.9)];
  const counts = [];
  for (let f = 0.3; f <= 0.71; f += 0.1) {
    const y = Math.round(y0 + (y1 - y0) * f);
    const row = []; for (let x = 0; x < N; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += v[(y + k) * N + x]; row.push(s / 5); }
    let c = 0; for (let x = 26; x < N - 26; x++) if (row[x] > 7 && row[x] >= Math.max(...row.slice(x - 3, x + 4)) && row[x] > row[x + 1]) c++;
    counts.push(c);
  }
  return counts;
}
