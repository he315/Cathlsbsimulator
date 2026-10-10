import { runs, readJpg } from "./img.mjs";
import path from "node:path";
const r = runs("dominance-main").find((x) => x.id === "cdm-00931-LCA-1");
console.log(r.frames.slice(0, 5), r.frames.length);
const ims = r.frames.map((f) => readJpg(path.join(r.dir, f)));
const w = 512, h = 512, mx = new Uint8Array(w * h);
for (const im of ims) for (let k = 0; k < w * h; k++) if (im.px[k] > mx[k]) mx[k] = im.px[k];
console.log(ims.map((im) => { let c = 0; for (let y = 32; y < h - 32; y += 2) for (let x = 32; x < w - 32; x += 2) if (mx[y * w + x] - im.px[y * w + x] > 28) c++; return c; }).join(" "));
