import { readPng, writePng } from "./img.mjs";
const [out, ...files] = process.argv.slice(2);
const ims = files.map(readPng);
const W = 1024, Hh = 512 * Math.ceil(ims.length / 2);
const px = new Uint8Array(W * Hh).fill(0);
ims.forEach((im, k) => { const ox = (k % 2) * 512, oy = Math.floor(k / 2) * 512; for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) px[(oy + y) * W + ox + x] = im.px[y * im.w + x]; });
writePng(out, W, Hh, px);
