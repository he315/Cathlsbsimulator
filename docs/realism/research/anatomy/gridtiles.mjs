import { readJpg, writePng, LIB } from "./img.mjs";
import { toRgb, text } from "./draw.mjs";
import fs from "node:fs"; import path from "node:path";
const picked = JSON.parse(fs.readFileSync("montage/picked.json", "utf8"));
const [view, which] = process.argv.slice(2);
const list = picked[view].slice(which === "b" ? 4 : 0, which === "b" ? 8 : 4);
const W = 1024, out = new Uint8Array(W * W * 3);
list.forEach((r, k) => {
  const set = r.id.startsWith("cdm") ? "dominance-main" : "dominance";
  const im = readJpg(path.join(LIB, set, r.id, `f${String(r.peak + 1).padStart(3, "0")}.jpg`));
  const c = toRgb(im, 1);
  for (let g = 0; g < 512; g += 32) { for (let y = 0; y < 512; y += 3) c.rgb.set(g % 128 === 0 ? [0, 220, 255] : [0, 100, 140], (y * 512 + g) * 3); for (let x = 0; x < 512; x += 3) c.rgb.set(g % 128 === 0 ? [0, 220, 255] : [0, 100, 140], (g * 512 + x) * 3); }
  for (let g = 64; g < 512; g += 64) { text(c, g + 2, 2, g); text(c, 2, g + 2, g); }
  const ox = (k % 2) * 512, oy = Math.floor(k / 2) * 512;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512 * 3; x++) out[((oy + y) * W + ox) * 3 + x] = c.rgb[y * 512 * 3 + x];
});
writePng(`grid/${view}_${which || "a"}.png`, W, W, out, 3);
console.log(list.map((r) => r.id + "@" + r.peak).join(" "));
