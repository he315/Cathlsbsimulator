// Minimal image toolkit: JPEG -> PNG via sips, PNG decode/encode with zlib (Node stdlib only).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

export const LIB = decodeURIComponent(new URL("../../../datasets/library", import.meta.url).pathname);
const CACHE = (process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)) + "png";
fs.mkdirSync(CACHE, { recursive: true });

export function jpgToPng(p) {
  const h = crypto.createHash("md5").update(p).digest("hex").slice(0, 16);
  const out = path.join(CACHE, h + ".png");
  if (!fs.existsSync(out)) execFileSync("sips", ["-s", "format", "png", p, "--out", out], { stdio: "ignore" });
  return out;
}

export function readPng(p) {
  const d = fs.readFileSync(p);
  let off = 8, w = 0, h = 0, bd = 0, ct = 0;
  const idat = [];
  while (off < d.length) {
    const len = d.readUInt32BE(off);
    const type = d.toString("ascii", off + 4, off + 8);
    const data = d.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bd !== 8) throw new Error("bit depth " + bd);
  const ch = ct === 0 ? 1 : ct === 2 ? 3 : ct === 4 ? 2 : ct === 6 ? 4 : 0;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = new Uint8Array(w * h);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  let p0 = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p0++];
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = raw[p0++];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) out[y * w + x] = ch >= 3 ? Math.round((cur[x * ch] + cur[x * ch + 1] + cur[x * ch + 2]) / 3) : cur[x * ch];
    prev.set(cur);
  }
  return { w, h, px: out };
}

export function readJpg(p) { return readPng(jpgToPng(p)); }

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
/** write gray (ch=1) or RGB (ch=3) */
export function writePng(p, w, h, px, ch = 1) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = ch === 1 ? 0 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * ch + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * ch + 1)] = 0; for (let x = 0; x < w * ch; x++) raw[y * (w * ch + 1) + 1 + x] = px[y * w * ch + x]; }
  fs.writeFileSync(p, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}

export function loadIndex(name) { return JSON.parse(fs.readFileSync(path.join(LIB, name, "index.json"), "utf8")); }
export function runs(name) {
  const d = loadIndex(name);
  const out = [];
  for (const p of d.patients) for (const r of p.runs) out.push({ ...r, patient: p.id, dominance: p.dominance, dir: path.join(LIB, name, r.id) });
  return out;
}
