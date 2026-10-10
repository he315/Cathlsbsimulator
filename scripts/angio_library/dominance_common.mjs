// Shared helpers for the CoronaryDominance converters: a minimal zip reader for
// .npz files, a .npy parser, a greyscale PNG writer and the frame conversion.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

export function readZip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("no zip directory");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const lnlen = buf.readUInt16LE(local + 26);
    const lxlen = buf.readUInt16LE(local + 28);
    const start = local + 30 + lnlen + lxlen;
    const raw = buf.subarray(start, start + csize);
    entries[name.replace(/\.npy$/, "")] = method === 0 ? raw : zlib.inflateRawSync(raw);
    p += 46 + nlen + xlen + clen;
  }
  return entries;
}

export function readNpy(b) {
  const major = b[6];
  const hlen = major === 1 ? b.readUInt16LE(8) : b.readUInt32LE(8);
  const start = major === 1 ? 10 : 12;
  const header = b.toString("latin1", start, start + hlen);
  const descr = /'descr':\s*'([^']+)'/.exec(header)[1];
  const shapeTxt = /'shape':\s*\(([^)]*)\)/.exec(header)[1];
  const shape = shapeTxt
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  return { descr, shape, data: b.subarray(start + hlen) };
}

export function scalar(npy) {
  const { descr, data } = npy;
  if (descr === "|b1") return data[0] === 1;
  if (descr === "<f8") return Buffer.from(data).readDoubleLE(0);
  if (descr === "<f4") return Buffer.from(data).readFloatLE(0);
  if (descr === "<i8") return Number(Buffer.from(data).readBigInt64LE(0));
  return null;
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function pngGray(w, h, px) {
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0;
    px.copy(raw, y * (w + 1) + 1, y * w, (y + 1) * w);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0))]);
}

/** Matches Left|Right_Dominance/StudyNNNNN_<uid>/LCA|RCA/ in an archive path. */
export const STUDY_RE = /(Left|Right)_Dominance[\\/](Study(\d+)_[^\\/]+)[\\/](LCA|RCA)[\\/]/;

/**
 * Convert one .npz run (already unzipped into entries) to JPEG frames in
 * outRoot/runId and return its index record, or null when the frames are unusable.
 */
export function convertRun(entries, runId, artery, outRoot, tmpRoot, maxFrames = 120) {
  if (!entries.pixel_array) return null;
  const pa = readNpy(entries.pixel_array);
  const [nf, h, w] = pa.shape;
  if (!nf || !h || !w) return null;
  if (pa.descr !== "<f8" && pa.descr !== "<f4" && pa.descr !== "|u1") return null;
  const copy = new Uint8Array(pa.data);
  const n = nf * h * w;
  const arr = pa.descr === "<f8" ? new Float64Array(copy.buffer, 0, n) : pa.descr === "<f4" ? new Float32Array(copy.buffer, 0, n) : copy;
  const tmp = path.join(tmpRoot, runId);
  fs.mkdirSync(tmp, { recursive: true });
  const frames = [];
  const px = Buffer.alloc(w * h);
  for (let i = 0; i < Math.min(nf, maxFrames); i++) {
    const off = i * w * h;
    for (let k = 0; k < w * h; k++) {
      const v = arr[off + k];
      px[k] = v < 0 ? 0 : v > 255 ? 255 : v + 0.5;
    }
    const name = `f${String(i + 1).padStart(3, "0")}`;
    fs.writeFileSync(path.join(tmp, name + ".png"), pngGray(w, h, px));
    frames.push(name + ".jpg");
  }
  const outDir = path.join(outRoot, runId);
  fs.mkdirSync(outDir, { recursive: true });
  const pngs = fs
    .readdirSync(tmp)
    .filter((x) => x.endsWith(".png"))
    .map((x) => path.join(tmp, x));
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "72", ...pngs, "--out", outDir], { stdio: "ignore" });
  for (const p of pngs) fs.unlinkSync(p);
  fs.rmdirSync(tmp);
  const num = (k) => (entries[k] ? scalar(readNpy(entries[k])) : null);
  const prim = num("primary_angle");
  const sec = num("secondary_angle");
  return {
    id: runId,
    fps: 15,
    artery,
    frames,
    angles: Number.isFinite(prim) && Number.isFinite(sec) ? { primary: prim, secondary: sec } : null,
    tags: { occlusion: num("is_occlusion"), collaterals: num("is_collaterals"), artefact: num("is_artifact"), uncertain: num("is_undefined_type") },
  };
}

export const DATASET_META = {
  dataset: "CoronaryDominance",
  citation:
    "Kruzhilov I, Mazanov G, Ponomarchuk A, Zubkova G, Shadrin A, Utegenov R, Blinov P, Bessonov I. CoronaryDominance: angiogram dataset for coronary dominance classification. Sci Data 2025.",
  doi: "https://doi.org/10.1038/s41597-025-04676-8",
  licence: "CC0 1.0",
  licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  changes: "Frames converted from floating point to 8-bit and re-encoded as JPEG (quality 72); runs truncated to 120 frames.",
  system: "Philips Allura Clarity / Azurion, 15 frames/s",
};
