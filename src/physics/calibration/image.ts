// ---------------------------------------------------------------------------
// Node-only image helpers for the catheter-shape calibration (trace.ts):
// JPEG frames of the real library are converted to PNG with macOS `sips`
// (cached in the system temp directory) and decoded here with zlib. Grey
// 8-bit output. Node built-ins are loaded by name so the browser build and
// the app's type check never see them; the app never imports this module.
// ---------------------------------------------------------------------------

export interface Grey {
  w: number;
  h: number;
  /** row-major grey levels 0..255 */
  px: Float32Array;
}

interface NodeMods {
  fs: {
    existsSync(p: string): boolean;
    readFileSync(p: string): Uint8Array & { readUInt32BE(o: number): number; toString(enc: string, a: number, b: number): string; subarray(a: number, b: number): Uint8Array };
    writeFileSync(p: string, d: string | Uint8Array): void;
    mkdirSync(p: string, o: { recursive: boolean }): void;
    readdirSync(p: string): string[];
  };
  zlib: { inflateSync(b: Uint8Array): Uint8Array; deflateSync(b: Uint8Array): Uint8Array };
  cp: { execFileSync(cmd: string, args: string[], o: { stdio: string }): void };
  os: { tmpdir(): string };
  path: { join(...p: string[]): string; resolve(...p: string[]): string; dirname(p: string): string };
  crypto: { createHash(a: string): { update(s: string): { digest(e: string): string } } };
}

let mods: NodeMods | null = null;

/** Load the Node built-ins (call once before any other function here). */
export async function nodeMods(): Promise<NodeMods> {
  if (mods) return mods;
  const imp = (n: string) => import(/* @vite-ignore */ n);
  const [fs, zlib, cp, os, path, crypto] = await Promise.all(["node:fs", "node:zlib", "node:child_process", "node:os", "node:path", "node:crypto"].map(imp));
  mods = { fs, zlib, cp, os, path, crypto } as unknown as NodeMods;
  return mods;
}

function m(): NodeMods {
  if (!mods) throw new Error("call nodeMods() first");
  return mods;
}

/** Repository root (three levels above this file). */
export function repoRoot(): string {
  const { path } = m();
  return path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), "../../..");
}

function cacheDir(): string {
  const { os, path, fs } = m();
  const d = path.join(os.tmpdir(), "cathmaster-i3-png");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function jpgToPng(p: string): string {
  const { crypto, path, fs, cp } = m();
  const h = crypto.createHash("md5").update(p).digest("hex").slice(0, 16);
  const out = path.join(cacheDir(), h + ".png");
  if (!fs.existsSync(out)) cp.execFileSync("sips", ["-s", "format", "png", p, "--out", out], { stdio: "ignore" });
  return out;
}

/** Decode an 8-bit PNG (grey, grey+alpha, RGB or RGBA) to grey levels. */
export function readPng(p: string): Grey {
  const { fs, zlib } = m();
  const d = fs.readFileSync(p);
  let off = 8, w = 0, h = 0, bd = 0, ct = 0;
  const idat: Uint8Array[] = [];
  const u32 = (o: number) => ((d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) >>> 0;
  while (off < d.length) {
    const len = u32(off);
    const type = String.fromCharCode(d[off + 4], d[off + 5], d[off + 6], d[off + 7]);
    const data = d.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = u32(off + 8);
      h = u32(off + 12);
      bd = data[8];
      ct = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bd !== 8) throw new Error(`PNG bit depth ${bd} not supported`);
  const ch = ct === 0 ? 1 : ct === 2 ? 3 : ct === 4 ? 2 : ct === 6 ? 4 : 0;
  if (!ch) throw new Error(`PNG colour type ${ct} not supported`);
  let total = 0;
  for (const b of idat) total += b.length;
  const cat = new Uint8Array(total);
  let o2 = 0;
  for (const b of idat) {
    cat.set(b, o2);
    o2 += b.length;
  }
  const raw = zlib.inflateSync(cat);
  const stride = w * ch;
  const out = new Float32Array(w * h);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  let p0 = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p0++];
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = raw[p0++];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) out[y * w + x] = ch >= 3 ? (cur[x * ch] + cur[x * ch + 1] + cur[x * ch + 2]) / 3 : cur[x * ch];
    prev.set(cur);
  }
  return { w, h, px: out };
}

export function readJpg(p: string): Grey {
  return readPng(jpgToPng(p));
}

// --- PNG encoding (RGB) for the QC overlays --------------------------------

const crcT = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc(out.subarray(4, 8 + data.length)));
  return out;
}

/** Write an RGB image (row-major, 3 bytes per pixel) as PNG. */
export function writePngRgb(p: string, w: number, h: number, rgb: Uint8Array): void {
  const { fs, zlib } = m();
  const raw = new Uint8Array(h * (1 + 3 * w));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + 3 * w)] = 0;
    raw.set(rgb.subarray(3 * w * y, 3 * w * (y + 1)), y * (1 + 3 * w) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", new Uint8Array(0))];
  let n = 0;
  for (const q of parts) n += q.length;
  const all = new Uint8Array(n);
  let o = 0;
  for (const q of parts) {
    all.set(q, o);
    o += q.length;
  }
  fs.writeFileSync(p, all);
}
