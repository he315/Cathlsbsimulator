// Heart-cycle analysis of tracked landmark trajectories.
// For each run: dominant period (frames) from the mean autocorrelation of the landmark displacement series,
// per-landmark cardiac peak-to-peak (median over beats of max-min along principal axis), the low-speed
// ("quiet") fraction of the cycle, and the rise/fall asymmetry.
import fs from "node:fs";
export function analyse(file, fps = 15) {
  const r = JSON.parse(fs.readFileSync(file, "utf8"));
  const L = r.landmarks.filter((l) => l.n >= 20 && l.meanC > 0.6);
  if (!L.length) return null;
  // align series on frame index
  const acs = [];
  for (const l of L) {
    const x = l.proj, n = x.length, m = x.reduce((a, b) => a + b) / n;
    const ac = [];
    for (let lag = 0; lag < Math.min(40, n - 6); lag++) {
      let s = 0, s0 = 0;
      for (let i = 0; i + lag < n; i++) s += (x[i] - m) * (x[i + lag] - m);
      for (let i = 0; i < n; i++) s0 += (x[i] - m) ** 2;
      ac.push(s / s0);
    }
    acs.push(ac);
  }
  const len = Math.min(...acs.map((a) => a.length));
  const mac = Array.from({ length: len }, (_, k) => acs.reduce((s, a) => s + a[k], 0) / acs.length);
  // first local maximum after the first zero crossing, within 0.35..1.6 s
  let period = null;
  for (let k = Math.round(0.35 * fps); k < Math.min(len - 1, Math.round(1.6 * fps)); k++) if (mac[k] > mac[k - 1] && mac[k] >= mac[k + 1] && mac[k] > 0.15) { period = k; break; }
  const out = { run: r.run, n: L.length, periodFrames: period, hr: period ? +((60 * fps) / period).toFixed(0) : null, acPeak: period ? +mac[period].toFixed(2) : null, lms: [] };
  for (const l of L) {
    const x = l.proj;
    // per-beat extent
    let p2p = [];
    if (period) for (let s = 0; s + period <= x.length; s += period) { const seg = x.slice(s, s + period); p2p.push(Math.max(...seg) - Math.min(...seg)); }
    p2p.sort((a, b) => a - b);
    const med = p2p.length ? p2p[Math.floor(p2p.length / 2)] : null;
    const sp = l.speed.slice().sort((a, b) => a - b);
    const pk = sp[Math.floor(sp.length * 0.95)] || sp[sp.length - 1];
    const quiet = l.speed.filter((v) => v < 0.25 * pk).length / l.speed.length;
    out.lms.push({ k: l.k, start: l.start, beatP2P: med != null ? +med.toFixed(1) : null, runP2P: l.p2pMajor, quiet: +quiet.toFixed(2), peakSpeed: +pk.toFixed(1) });
  }
  return out;
}
if ((process.argv[1] || "").endsWith("period.mjs") && process.argv[2]) {
  for (const f of process.argv.slice(2)) console.log(JSON.stringify(analyse(f)));
}
