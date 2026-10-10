// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/thorax.ts
var v = (x, y, z) => ({ x, y, z });
var I3 = [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)];

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder.ts
function contraction(phase) {
  const q = (phase % 1 + 1) % 1;
  if (q < 0.08) return 0;
  if (q < 0.38) return Math.sin((q - 0.08) / 0.3 * Math.PI * 0.5);
  if (q < 0.55) return Math.cos((q - 0.38) / 0.17 * Math.PI * 0.5);
  return 0;
}

// simquiet.ts
for (const hr of [60, 72, 90]) {
  const fps = 15, n = 600;
  const x = [];
  for (let k = 0; k < n; k++) x.push(contraction(k / fps * hr / 60));
  const sp = x.slice(1).map((v2, i) => Math.abs(v2 - x[i]));
  const s = sp.slice().sort((a, b) => a - b);
  const pk2 = s[Math.floor(s.length * 0.95)];
  const quiet = sp.filter((v2) => v2 < 0.25 * pk2).length / sp.length;
  console.log("HR", hr, "quiet fraction at 15 f/s", quiet.toFixed(2));
}
var f = (q) => contraction(q);
var on = 0;
var pk = 0;
var off = 0;
for (let q = 0; q < 1; q += 1e-3) {
  if (!on && f(q) > 0.05) on = q;
  if (f(q) > f(pk)) pk = q;
  if (pk && f(q) < 0.05 && q > pk && !off) off = q;
}
console.log("onset", on.toFixed(3), "peak", pk.toFixed(3), "return <5%", off.toFixed(3));
