// Band-limited RMS of the tangent-angle signal along traced centrelines (1 mm sampling):
// difference-of-moving-averages bands  ~3-8 mm, 8-20 mm, 20-60 mm wavelength.
import fs from "node:fs";
export function bands(pts, mmPerPx) {
  const s = mmPerPx;
  const P = pts.map(([x, y]) => [x * s, y * s]);
  const R = [P[0]]; let acc = 0;
  for (let i = 1; i < P.length; i++) { let [x0, y0] = P[i - 1]; const [x1, y1] = P[i]; let seg = Math.hypot(x1 - x0, y1 - y0); while (acc + seg >= 1) { const t = (1 - acc) / seg; x0 += (x1 - x0) * t; y0 += (y1 - y0) * t; R.push([x0, y0]); seg = Math.hypot(x1 - x0, y1 - y0); acc = 0; } acc += seg; }
  // tangent angle (unwrapped), 2 mm chord
  const th = []; let prev = null;
  for (let i = 1; i < R.length - 1; i++) { let a = Math.atan2(R[i + 1][1] - R[i - 1][1], R[i + 1][0] - R[i - 1][0]); if (prev !== null) { while (a - prev > Math.PI) a -= 2 * Math.PI; while (a - prev < -Math.PI) a += 2 * Math.PI; } th.push(a); prev = a; }
  const ma = (x, w) => x.map((_, i) => { let s = 0, c = 0; for (let k = -w; k <= w; k++) if (x[i + k] !== undefined) { s += x[i + k]; c++; } return s / c; });
  const a1 = ma(th, 1), a4 = ma(th, 4), a10 = ma(th, 10), a30 = ma(th, 30);
  const rms = (a, b) => { let s = 0, n = 0; for (let i = 30; i < th.length - 30; i++) { s += (a[i] - b[i]) ** 2; n++; } return n ? (Math.sqrt(s / n) * 180) / Math.PI : null; };
  return { n: th.length, b3_8: rms(a1, a4), b8_20: rms(a4, a10), b20_60: rms(a10, a30) };
}
if ((process.argv[1] || "").endsWith("spectrum.mjs")) {
  const out = {};
  for (const f of fs.readdirSync("traces").filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync("traces/" + f, "utf8"));
    const b = bands(d.path, d.mmPerPx);
    out[d.label] = b;
    console.log(d.label, JSON.stringify(Object.fromEntries(Object.entries(b).map(([k, v]) => [k, typeof v === "number" ? +v.toFixed(1) : v]))));
  }
}
