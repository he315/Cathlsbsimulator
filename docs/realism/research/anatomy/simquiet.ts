import { contraction } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
// displacement ∝ contraction(phase) for every vessel in the sim (single shared envelope)
for (const hr of [60, 72, 90]) {
  const fps = 15, n = 600;
  const x: number[] = []; for (let k = 0; k < n; k++) x.push(contraction((k / fps) * hr / 60));
  const sp = x.slice(1).map((v, i) => Math.abs(v - x[i]));
  const s = sp.slice().sort((a, b) => a - b); const pk = s[Math.floor(s.length * 0.95)];
  const quiet = sp.filter((v) => v < 0.25 * pk).length / sp.length;
  // time from onset (first frame > 5%) to peak, as a fraction of the cycle (continuous)
  console.log("HR", hr, "quiet fraction at 15 f/s", quiet.toFixed(2));
}
// continuous envelope landmarks
const f = (q: number) => contraction(q);
let on = 0, pk = 0, off = 0; for (let q = 0; q < 1; q += 0.001) { if (!on && f(q) > 0.05) on = q; if (f(q) > f(pk)) pk = q; if (pk && f(q) < 0.05 && q > pk && !off) off = q; }
console.log("onset", on.toFixed(3), "peak", pk.toFixed(3), "return <5%", off.toFixed(3));
