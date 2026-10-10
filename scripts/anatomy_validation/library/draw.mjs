// Drawing helpers on RGB buffers: grid with numeric labels, markers, polylines, 3x5 digit font.
const FONT = {
  0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
};
export function toRgb(im, scale = 1) {
  const W = im.w * scale, H = im.h * scale;
  const rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = im.px[Math.floor(y / scale) * im.w + Math.floor(x / scale)];
    rgb.set([v, v, v], (y * W + x) * 3);
  }
  return { w: W, h: H, rgb };
}
export function put(c, x, y, col) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  c.rgb.set(col, (y * c.w + x) * 3);
}
export function text(c, x, y, str, col = [255, 255, 0], s = 2) {
  let ox = x;
  for (const ch of String(str)) {
    const g = FONT[ch];
    if (g) for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r][q] === "1") for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) put(c, ox + q * s + a, y + r * s + b, col);
    ox += 4 * s;
  }
}
export function grid(c, step = 32, scale = 1) {
  for (let g = 0; g < c.w; g += step * scale) for (let y = 0; y < c.h; y++) if ((g / scale) % (step * 4) === 0 || y % 4 === 0) put(c, g, y, (g / scale) % (step * 4) === 0 ? [0, 200, 255] : [0, 120, 160]);
  for (let g = 0; g < c.h; g += step * scale) for (let x = 0; x < c.w; x++) if ((g / scale) % (step * 4) === 0 || x % 4 === 0) put(c, x, g, (g / scale) % (step * 4) === 0 ? [0, 200, 255] : [0, 120, 160]);
  for (let gx = 0; gx < c.w; gx += step * 2 * scale) text(c, gx + 2, 2, gx / scale, [255, 255, 0]);
  for (let gy = step * 2 * scale; gy < c.h; gy += step * 2 * scale) text(c, 2, gy + 2, gy / scale, [255, 255, 0]);
}
export function marker(c, x, y, col = [255, 0, 0], r = 3) {
  for (let a = -r; a <= r; a++) { put(c, x + a, y, col); put(c, x, y + a, col); }
}
export function line(c, pts, col = [255, 0, 0]) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let k = 0; k <= n; k++) put(c, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, col);
  }
}
