// 2D centreline shape metrics, identical for real traces and simulator projections.
// Input: polyline in pixels (or mm with mmPerPx = 1). Resampled every 1 mm, smoothed (3-sample moving
// average, two passes) to suppress pixel staircase, then:
//  - arc length, chord, arc/chord
//  - SOAM: sum of absolute turning angles per cm (deg/cm)
//  - inflections per cm: sign changes of the turning angle where |turn| > 4 deg per mm-step on both sides
//  - large bends: count of windows (10 mm) whose net turn exceeds 60 deg
export function shapeMetrics(pts, mmPerPx) {
  const s = mmPerPx ?? 1;
  const P = pts.map(([x, y]) => [x * s, y * s]);
  // resample at 1 mm
  const R = [P[0]];
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    let [x0, y0] = P[i - 1];
    const [x1, y1] = P[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (acc + seg >= 1) {
      const t = (1 - acc) / seg;
      x0 = x0 + (x1 - x0) * t; y0 = y0 + (y1 - y0) * t;
      R.push([x0, y0]);
      seg = Math.hypot(x1 - x0, y1 - y0);
      acc = 0;
    }
    acc += seg;
  }
  let Q = R;
  for (let pass = 0; pass < 2; pass++) Q = Q.map((p, i) => { if (i === 0 || i === Q.length - 1) return p; return [(Q[i - 1][0] + p[0] + Q[i + 1][0]) / 3, (Q[i - 1][1] + p[1] + Q[i + 1][1]) / 3]; });
  let L = 0; for (let i = 1; i < Q.length; i++) L += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]);
  const chord = Math.hypot(Q[Q.length - 1][0] - Q[0][0], Q[Q.length - 1][1] - Q[0][1]);
  // turning angles using 2 mm chords to further suppress noise
  const turns = [];
  for (let i = 2; i < Q.length - 2; i++) {
    const a1 = Math.atan2(Q[i][1] - Q[i - 2][1], Q[i][0] - Q[i - 2][0]), a2 = Math.atan2(Q[i + 2][1] - Q[i][1], Q[i + 2][0] - Q[i][0]);
    let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    turns.push((d * 180) / Math.PI / 2); // per mm
  }
  const soam = turns.reduce((a, t) => a + Math.abs(t), 0) / Math.max(1, turns.length) * 10; // deg per cm
  let infl = 0, lastSign = 0;
  for (const t of turns) { if (Math.abs(t) < 4) continue; const sg = Math.sign(t); if (lastSign && sg !== lastSign) infl++; lastSign = sg; }
  let bends = 0;
  for (let i = 0; i + 10 < turns.length; i += 5) { const net = turns.slice(i, i + 10).reduce((a, b) => a + b, 0); if (Math.abs(net) > 60) bends++; }
  return { lengthMm: +L.toFixed(1), chordMm: +chord.toFixed(1), arcChord: +(L / Math.max(1e-6, chord)).toFixed(3), soamDegPerCm: +soam.toFixed(1), inflPerCm: +((10 * infl) / Math.max(1, L)).toFixed(2), bends60Per10mm: bends, units: mmPerPx ? "mm" : "px" };
}
