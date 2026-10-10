window.save = async (name, body) => (await fetch('/save?name=' + encodeURIComponent(name), { method: 'POST', body })).status;
window.savePng = async (name, g, n) => {
  const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  const ctx = cv.getContext('2d'); const id = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = Math.max(0, Math.min(255, Math.round(g[i]))); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  ctx.putImageData(id, 0, 0);
  const b = await new Promise((r) => cv.toBlob(r, 'image/png'));
  return save(name, b);
};
window.IDX = {};
window.idxReady = (async () => { for (const ds of ['dominance', 'cadica', 'angiocad', 'dominance-main']) IDX[ds] = await (await fetch('lib/' + ds + '/index.json')).json(); })();
window.runsOf = (ds) => IDX[ds].patients.flatMap((p) => p.runs.map((r) => ({ ...r, pid: p.id })));
window.pickRuns = (ds, n, seed = 1) => {
  const rs = runsOf(ds).filter((r) => r.frames.length >= 12 && !(r.tags && r.tags.artefact));
  const out = []; let s = seed;
  for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; out.push(rs[s % rs.length]); }
  return out;
};
window.frameUrl = (ds, id, k) => { const r = runsOf(ds).find((x) => x.id === id); return 'lib/' + ds + '/' + id + '/' + r.frames[k]; };
window.sheet = async (name, items, S = 512) => {
  const n = Math.ceil(Math.sqrt(items.length));
  const cv = document.createElement('canvas'); cv.width = n * S; cv.height = n * S;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < items.length; i++) {
    const { url, label } = items[i];
    const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const x = (i % n) * S, y = Math.floor(i / n) * S;
    ctx.drawImage(bmp, x, y, S, S);
    ctx.strokeStyle = 'rgba(255,0,0,0.5)'; ctx.lineWidth = 1;
    for (let g = 64; g < S; g += 64) { ctx.beginPath(); ctx.moveTo(x + g, y); ctx.lineTo(x + g, y + S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + g); ctx.lineTo(x + S, y + g); ctx.stroke(); }
    ctx.fillStyle = '#ff0'; ctx.font = '20px monospace'; ctx.fillText(i + ': ' + label, x + 6, y + 22);
  }
  const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.85));
  return save(name, b);
};
window.crop = async (name, src, x0, y0, w, h, scale = 4) => {
  let bmp;
  if (typeof src === 'string') bmp = await createImageBitmap(await (await fetch(src)).blob());
  else { const { d, n } = src; const cv0 = document.createElement('canvas'); cv0.width = n; cv0.height = n; const c0 = cv0.getContext('2d'); const id = c0.createImageData(n, n); for (let i = 0; i < n * n; i++) { const v = Math.max(0, Math.min(255, Math.round(d[i]))); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; } c0.putImageData(id, 0, 0); bmp = cv0; }
  const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bmp, x0, y0, w, h, 0, 0, w * scale, h * scale);
  const b = await new Promise((r) => cv.toBlob(r, 'image/png'));
  return save(name, b);
};
window.bil = (img, W, x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; const g = (xx, yy) => img[Math.max(0, Math.min(W - 1, yy)) * W + Math.max(0, Math.min(W - 1, xx))]; return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy; };
/** mean cross-profile of a dark line structure, each sample re-centred on its darkness centroid */
window.prof2 = (img, W, ax, ay, bx, by, half = 12, step = 0.25) => {
  const L = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / L, ty = (by - ay) / L, nx = -ty, ny = tx;
  const K = Math.round((2 * half) / step) + 1; const xs = [...Array(K)].map((_, k) => -half + k * step);
  const acc = new Float64Array(K); let cnt = 0;
  for (let s = 0; s <= L; s += 1) {
    const cx = ax + tx * s, cy = ay + ty * s;
    const p = xs.map((o) => bil(img, W, cx + nx * o, cy + ny * o));
    const srt = [...p].sort((a, b) => a - b); const med = srt[Math.floor(K * 0.7)];
    let sw = 0, sx = 0; p.forEach((v, k) => { const w = Math.max(0, med - v) ** 2; sw += w; sx += w * xs[k]; });
    const c = sw > 0 ? sx / sw : 0; if (Math.abs(c) > 6) continue;
    for (let k = 0; k < K; k++) acc[k] += bil(img, W, cx + nx * (xs[k] + c), cy + ny * (xs[k] + c));
    cnt++;
  }
  const prof = [...acc].map((v) => v / cnt);
  const outer = prof.filter((_, k) => Math.abs(xs[k]) >= half - 2.5); const bg = outer.reduce((a, b) => a + b, 0) / outer.length;
  const mn = Math.min(...prof); const hl = (bg + mn) / 2; let l = null, r = null;
  for (let k = 0; k < K; k++) if (prof[k] <= hl) { l = xs[k]; break; }
  for (let k = K - 1; k >= 0; k--) if (prof[k] <= hl) { r = xs[k]; break; }
  let g = 0; for (let k = 1; k < K; k++) g = Math.max(g, Math.abs(prof[k] - prof[k - 1]) / step);
  let ov = -1e9; for (let k = 0; k < K; k++) if ((xs[k] < l - 0.75 && xs[k] > l - 5) || (xs[k] > r + 0.75 && xs[k] < r + 5)) ov = Math.max(ov, prof[k]);
  // lumen contrast: profile value at centre relative to wall minima
  const ci = Math.floor(K / 2);
  return { n: cnt, bg: +bg.toFixed(1), depth: +(bg - mn).toFixed(1), outerWidth: +(r - l).toFixed(2), maxGradPerDepth: +(g / (bg - mn)).toFixed(3), overshoot: +((ov - bg) / (bg - mn)).toFixed(3), centreRel: +((bg - prof[ci]) / (bg - mn)).toFixed(3), prof: prof.filter((_, k) => k % 2 === 0).map((v) => +v.toFixed(1)) };
};
document.title = 'harness+helpers';
