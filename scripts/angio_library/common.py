"""
Shared helpers for building the real-angiogram library from the openly
licensed datasets in datasets/raw. Standard library only (plus macOS `sips`
for JPEG encoding), so nothing extra needs installing.

Output per run: a vertical JPEG film strip (one 512 px frame under the next)
that the app plays back as a cine loop, plus JSON metadata.
"""

import io
import json
import os
import pickle
import struct
import subprocess
import tempfile
import zipfile
import zlib
import ast
import xml.etree.ElementTree as ET

# keep temporary files inside the project (system temp may not be writable for sips in a sandbox)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
tempfile.tempdir = os.path.join(ROOT, "datasets", "tmp")
os.makedirs(tempfile.tempdir, exist_ok=True)

FRAME = 512
MAX_FRAMES = 120  # JPEG height limit (65,535 px) leaves room for 127 frames at 512 px


# ---------------------------------------------------------------------------
# .npy / .npz without numpy
# ---------------------------------------------------------------------------
class _Stub:
    """Minimal stand-ins so object-dtype arrays pickled by numpy can be read."""

    def __init__(self, *a, **k):
        self.items = None

    def __setstate__(self, state):
        # ndarray state: (version, shape, dtype, is_fortran, rawdata or list)
        if isinstance(state, tuple) and len(state) >= 5:
            self.items = state[4]
        else:
            self.items = state

    def __reduce__(self):
        return (_Stub, ())


def _reconstruct(*a, **k):
    return _Stub()


class _NpUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module.startswith("numpy"):
            if name in ("_reconstruct",):
                return _reconstruct
            return _Stub
        return super().find_class(module, name)


def read_npy(data: bytes):
    """Return (descr, shape, payload) where payload is bytes or a Python object."""
    if data[:6] != b"\x93NUMPY":
        raise ValueError("not an npy file")
    major = data[6]
    if major == 1:
        hlen = struct.unpack("<H", data[8:10])[0]
        start = 10
    else:
        hlen = struct.unpack("<I", data[8:12])[0]
        start = 12
    header = ast.literal_eval(data[start : start + hlen].decode("latin1"))
    payload = data[start + hlen :]
    descr = header["descr"]
    shape = tuple(header["shape"])
    if descr in ("|O", "O"):
        obj = _NpUnpickler(io.BytesIO(payload)).load()
        items = obj.items if isinstance(obj, _Stub) else obj
        if isinstance(items, list) and len(items) == 1:
            return descr, shape, items[0]
        return descr, shape, items
    return descr, shape, payload


def scalar(descr: str, shape, payload):
    """Decode a 0-d or 1-element array to a Python value."""
    if not isinstance(payload, (bytes, bytearray)):
        return payload
    if descr.startswith("<U") or descr.startswith(">U"):
        n = int(descr[2:])
        s = payload[: 4 * n].decode("utf-32-le" if descr[0] == "<" else "utf-32-be")
        return s.rstrip("\x00")
    if descr.startswith("|S"):
        return payload.rstrip(b"\x00").decode("latin1")
    if descr == "|b1":
        return bool(payload[0])
    fmt = {"<f8": "<d", "<f4": "<f", "<i8": "<q", "<i4": "<i", "<i2": "<h", "|u1": "<B", "|i1": "<b", "<u2": "<H"}.get(descr)
    if fmt:
        return struct.unpack(fmt, payload[: struct.calcsize(fmt)])[0]
    return None


def read_npz(path: str):
    out = {}
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            key = name[:-4] if name.endswith(".npy") else name
            out[key] = read_npy(z.read(name))
    return out


def frames_u8(descr: str, shape, payload: bytes):
    """Convert a frames×H×W array (float or uint8) to a list of uint8 frame byte strings."""
    n, h, w = shape
    if descr == "|u1":
        size = h * w
        return [payload[i * size : (i + 1) * size] for i in range(n)], h, w
    code = {"<f4": "f", "<f8": "d", "<u2": "H", "<i2": "h"}[descr]
    import array

    a = array.array(code)
    a.frombytes(payload)
    size = h * w
    lo = min(a)
    hi = max(a)
    scale = 255.0 / (hi - lo) if hi > lo and (hi > 255 or lo < 0) else 1.0
    off = lo if scale != 1.0 else 0.0
    frames = []
    for i in range(n):
        seg = a[i * size : (i + 1) * size]
        frames.append(bytes(max(0, min(255, int((v - off) * scale + 0.5))) for v in seg))
    return frames, h, w


# ---------------------------------------------------------------------------
# PNG / JPEG
# ---------------------------------------------------------------------------
def write_png_gray(path: str, w: int, h: int, pixels: bytes):
    raw = b"".join(b"\x00" + pixels[y * w : (y + 1) * w] for y in range(h))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 0, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 6)))
        f.write(chunk(b"IEND", b""))


def read_png_gray(path: str):
    """Decode an 8-bit greyscale or RGB(A) PNG to greyscale bytes (non-interlaced)."""
    with open(path, "rb") as f:
        data = f.read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", path
    pos = 8
    idat = b""
    w = h = depth = ctype = 0
    palette = None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos : pos + 4])[0]
        tag = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + ln]
        if tag == b"IHDR":
            w, h, depth, ctype = struct.unpack(">IIBB", body[:10])
        elif tag == b"PLTE":
            palette = body
        elif tag == b"IDAT":
            idat += body
        pos += 12 + ln
    if depth != 8:
        raise ValueError(f"unsupported bit depth {depth} in {path}")
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * ch
    out = bytearray(w * h)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]
        line = bytearray(raw[p + 1 : p + 1 + stride])
        p += 1 + stride
        if ft == 1:
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 255
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                left = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        prev = line
        if ch == 1:
            if ctype == 3 and palette:
                for x in range(w):
                    out[y * w + x] = palette[line[x] * 3]
            else:
                out[y * w : (y + 1) * w] = line
        else:
            for x in range(w):
                out[y * w + x] = line[x * ch]
    return w, h, bytes(out)


def resize_nearest(pixels: bytes, w: int, h: int, nw: int, nh: int) -> bytes:
    out = bytearray(nw * nh)
    for y in range(nh):
        sy = y * h // nh
        row = sy * w
        for x in range(nw):
            out[y * nw + x] = pixels[row + x * w // nw]
    return bytes(out)


def make_strip(frames, w: int, h: int, out_jpg: str, quality: int = 72) -> int:
    """Stack frames vertically into one JPEG film strip. Returns the number of frames written."""
    frames = frames[:MAX_FRAMES]
    if (w, h) != (FRAME, FRAME):
        frames = [resize_nearest(f, w, h, FRAME, FRAME) for f in frames]
        w = h = FRAME
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, "strip.png")
        write_png_gray(png, w, h * len(frames), b"".join(frames))
        os.makedirs(os.path.dirname(out_jpg), exist_ok=True)
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(quality), png, "--out", out_jpg],
            check=True,
            stdout=subprocess.DEVNULL,
        )
    return len(frames)


def write_poster(frame: bytes, w: int, h: int, out_jpg: str, size: int = 256):
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, "p.png")
        write_png_gray(png, w, h, frame)
        subprocess.run(["sips", "-Z", str(size), "-s", "format", "jpeg", "-s", "formatOptions", "70", png, "--out", out_jpg], check=True, stdout=subprocess.DEVNULL)


# ---------------------------------------------------------------------------
# .xlsx (first sheet) without third-party packages
# ---------------------------------------------------------------------------
def read_xlsx(path: str, sheet_index: int = 0):
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", ns):
                shared.append("".join(t.text or "" for t in si.iter("{%s}t" % ns["m"])))
        sheets = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))
        root = ET.fromstring(z.read(sheets[sheet_index]))
        rows = []
        for r in root.iter("{%s}row" % ns["m"]):
            row = {}
            for c in r.findall("m:c", ns):
                ref = c.get("r")
                col = "".join(ch for ch in ref if ch.isalpha())
                v = c.find("m:v", ns)
                t = c.get("t")
                if t == "s" and v is not None:
                    val = shared[int(v.text)]
                elif t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter("{%s}t" % ns["m"]))
                else:
                    val = v.text if v is not None else None
                row[col] = val
            rows.append(row)
    if not rows:
        return []
    header = rows[0]
    cols = sorted(header.keys(), key=lambda s: (len(s), s))
    names = [header[c] for c in cols]
    return [{names[i]: r.get(c) for i, c in enumerate(cols)} for r in rows[1:]]


def save_json(path: str, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, indent=1)
