import { readJpg, writePng, LIB } from "./img.mjs";
import path from "node:path";
// usage: node strip.mjs out.png set/run i1 i2 i3 i4 [scale]
const [out, run, ...idx] = process.argv.slice(2);
const ims = idx.map((i) => readJpg(path.join(LIB, run, `f${String(+i + 1).padStart(3, "0")}.jpg`)));
const s = 512, W = s * Math.min(2, ims.length), Hh = s * Math.ceil(ims.length / 2);
const px = new Uint8Array(W * Hh);
ims.forEach((im, k) => { const ox = (k % 2) * s, oy = Math.floor(k / 2) * s; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) px[(oy + y) * W + ox + x] = im.px[y * im.w + x]; });
writePng(out, W, Hh, px);
