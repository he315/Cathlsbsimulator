// usage: node gridview.mjs out.png <set/run> <frameIndex0> [x0 y0 size]  -> grid overlay (crop optional, scaled to ~768)
import { readJpg, writePng, LIB } from "./img.mjs";
import { toRgb, grid } from "./draw.mjs";
import path from "node:path";
const [out, run, fi, x0s, y0s, ss] = process.argv.slice(2);
const im = readJpg(path.join(LIB, run, `f${String(+fi + 1).padStart(3, "0")}.jpg`));
let src = im;
const x0 = +(x0s ?? 0), y0 = +(y0s ?? 0), S = +(ss ?? 512);
if (S < 512) {
  const px = new Uint8Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) px[y * S + x] = im.px[(y0 + y) * im.w + x0 + x];
  src = { w: S, h: S, px };
}
const scale = Math.max(1, Math.floor(768 / S));
const c = toRgb(src, scale);
// grid in original coordinates
const step = S <= 128 ? 8 : S <= 256 ? 16 : 32;
for (let g = Math.ceil(x0 / step) * step; g < x0 + S; g += step) {
  const X = (g - x0) * scale;
  for (let y = 0; y < c.h; y += 3) c.rgb.set(g % (step * 4) === 0 ? [0, 220, 255] : [0, 110, 150], (y * c.w + X) * 3);
}
for (let g = Math.ceil(y0 / step) * step; g < y0 + S; g += step) {
  const Y = (g - y0) * scale;
  for (let x = 0; x < c.w; x += 3) c.rgb.set(g % (step * 4) === 0 ? [0, 220, 255] : [0, 110, 150], (Y * c.w + x) * 3);
}
const { text } = await import("./draw.mjs");
for (let g = Math.ceil(x0 / (step * 2)) * step * 2; g < x0 + S; g += step * 2) text(c, (g - x0) * scale + 2, 2, g);
for (let g = Math.ceil(y0 / (step * 2)) * step * 2; g < y0 + S; g += step * 2) text(c, 2, (g - y0) * scale + 2, g);
writePng(out, c.w, c.h, c.rgb, 3);
