"""
Shared helpers for the realism harness (Python standard library plus macOS `sips`).

Two pipelines are kept apart, because absolute noise and texture numbers depend on the
encoding:

  lossless  frames as stored by the dataset authors: CoronaryDominance domain-shift .npz
            (exact 8-bit values stored as float64, frame border removed and resized to
            512 px by the authors) and CADICA PNG (512 px, 8-bit).
  matched   512 x 512 px, 8-bit, JPEG quality 72 written by `sips` and decoded by `sips`:
            the encoding of the app's library (scripts/angio_library/common.py and
            dominance_common.mjs use exactly `sips -s format jpeg -s formatOptions 72`).

Simulator captures enter the matched pipeline the same way the library was built:
bilinear resample of the full canvas to 512 x 512 (resample512 below), round to 8 bit,
PNG, `sips` JPEG q72, decode. Library JPEGs are decoded with the same `sips` call.

Every image in this package is a flat row-major array('d') of 512 x 512 grey levels
(0 = black, 255 = white; iodine and bone are dark), unless a function says otherwise.
"""

import array
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from itertools import accumulate
from operator import itemgetter, mul, sub

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts", "angio_library"))
from common import read_npy, read_png_gray, scalar, write_png_gray  # noqa: E402

LIB = os.path.join(ROOT, "datasets", "library")
DS_ROOT = os.path.join(ROOT, "datasets", "extracted", "CoronaryDominance", "anonymous_nonframe_domain_shift_dataset")
CADICA_ROOT = os.path.join(ROOT, "datasets", "extracted", "CADICA", "CADICA", "selectedVideos")
CAPTURES = os.path.join(ROOT, "datasets", "tmp", "captures")
CACHE = os.path.join(ROOT, "datasets", "tmp", "realism")
TARGETS = os.path.join(LIB, "realism_targets.json")
os.makedirs(CACHE, exist_ok=True)

W = H = 512
JPEG_QUALITY = 72


# ---------------------------------------------------------------------------
# small statistics helpers
# ---------------------------------------------------------------------------
def quantile(v, q):
    """Linear-interpolated quantile (same rule as numpy's default) of a list; None when empty."""
    v = sorted(x for x in v if x is not None and x == x)
    if not v:
        return None
    if len(v) == 1:
        return v[0]
    pos = q * (len(v) - 1)
    lo = int(math.floor(pos))
    hi = min(len(v) - 1, lo + 1)
    return v[lo] + (v[hi] - v[lo]) * (pos - lo)


def median(v):
    return quantile(v, 0.5)


def lower_median(v):
    """The element at index n//2 of the sorted list: the rule the audit scripts used."""
    v = sorted(x for x in v if x is not None and x == x)
    return v[len(v) // 2] if v else None


def summarise(values):
    """median, IQR, p10/p90, min/max and n of a list of per-run values."""
    v = [x for x in values if x is not None and x == x]
    if not v:
        return None
    return {
        "n": len(v),
        "median": round(median(v), 4),
        "iqr": [round(quantile(v, 0.25), 4), round(quantile(v, 0.75), 4)],
        "p10_p90": [round(quantile(v, 0.1), 4), round(quantile(v, 0.9), 4)],
        "min_max": [round(min(v), 4), round(max(v), 4)],
    }


def band_of(summary):
    """Pass band for a target: the central 80% (p10-p90) when n >= 10, otherwise the observed range."""
    if summary is None:
        return None, None
    if summary["n"] >= 10:
        return summary["p10_p90"], "p10-p90 of per-run values"
    if summary["n"] >= 3:
        return summary["min_max"], "observed range (n < 10)"
    return summary["min_max"], "observed values (n < 3): indicative only"


# ---------------------------------------------------------------------------
# decoding
# ---------------------------------------------------------------------------
def to_f(px):
    return array.array("d", array.array("B", px))


def _read_bmp_grey(path):
    """Grey bytes from a 24-bit BMP written by sips (top-down or bottom-up)."""
    with open(path, "rb") as f:
        d = f.read()
    import struct

    off = struct.unpack("<I", d[10:14])[0]
    w, h = struct.unpack("<ii", d[18:26])
    bpp = struct.unpack("<H", d[28:30])[0]
    ah = abs(h)
    ch = bpp // 8
    stride = (w * ch + 3) & ~3
    rows = []
    for y in range(ah):
        o = off + y * stride
        rows.append(d[o : o + w * ch : ch])
    if h > 0:
        rows.reverse()
    return w, ah, b"".join(rows)


def _key(path):
    st = os.stat(path)
    return hashlib.sha1(f"{os.path.abspath(path)}|{st.st_size}|{st.st_mtime_ns}".encode()).hexdigest()[:20]


def decode_many(paths):
    """Decode image files (JPEG or PNG) with sips into grey bytes, cached under datasets/tmp/realism/dec.
    Returns a list of (w, h, bytes)."""
    dec = os.path.join(CACHE, "dec")
    os.makedirs(dec, exist_ok=True)
    out = [None] * len(paths)
    todo = []
    for i, p in enumerate(paths):
        k = _key(p)
        raw = os.path.join(dec, k + ".u8")
        if os.path.exists(raw):
            with open(raw, "rb") as f:
                b = f.read()
            w = int.from_bytes(b[:4], "little")
            h = int.from_bytes(b[4:8], "little")
            if len(b) == 8 + w * h:
                out[i] = (w, h, b[8:])
            else:
                todo.append((i, p, raw))
        else:
            todo.append((i, p, raw))
    for c in range(0, len(todo), 64):
        chunk = todo[c : c + 64]
        with tempfile.TemporaryDirectory(dir=CACHE) as td:
            # sips names outputs after the input basename (and resolves symbolic links), so give each
            # input a unique name with a hard link, or a copy across file systems
            ins = []
            for j, (i, p, raw) in enumerate(chunk):
                q = os.path.join(td, f"in{j:03d}" + os.path.splitext(p)[1].lower())
                try:
                    os.link(os.path.abspath(p), q)
                except OSError:
                    shutil.copy(p, q)
                ins.append(q)
            od = os.path.join(td, "o")
            os.makedirs(od)
            subprocess.run(["sips", "-s", "format", "bmp", *ins, "--out", od], check=True, capture_output=True)
            for j, (i, p, raw) in enumerate(chunk):
                w, h, px = _read_bmp_grey(os.path.join(od, f"in{j:03d}.bmp"))
                tmp = f"{raw}.{os.getpid()}.tmp"
                with open(tmp, "wb") as f:
                    f.write(w.to_bytes(4, "little") + h.to_bytes(4, "little") + px)
                os.replace(tmp, raw)  # atomic: parallel workers never read a partial file
                out[i] = (w, h, px)
    return out


def load_image(path):
    """Any PNG/JPEG file as (w, h, array('d'))."""
    if path.lower().endswith(".png"):
        w, h, px = read_png_gray(path)
    else:
        w, h, px = decode_many([path])[0]
    return w, h, to_f(px)


def jpeg_roundtrip_many(frames_u8, w=W, h=H, quality=JPEG_QUALITY):
    """8-bit frames (bytes) -> sips JPEG at `quality` -> decoded grey bytes. The library encoder."""
    out = []
    with tempfile.TemporaryDirectory(dir=CACHE) as td:
        pngs = []
        for j, px in enumerate(frames_u8):
            p = os.path.join(td, f"f{j:04d}.png")
            write_png_gray(p, w, h, px)
            pngs.append(p)
        jd = os.path.join(td, "j")
        os.makedirs(jd)
        for c in range(0, len(pngs), 64):
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(quality), *pngs[c : c + 64], "--out", jd], check=True, capture_output=True)
        bd = os.path.join(td, "b")
        os.makedirs(bd)
        jpgs = [os.path.join(jd, f"f{j:04d}.jpg") for j in range(len(pngs))]
        for c in range(0, len(jpgs), 64):
            subprocess.run(["sips", "-s", "format", "bmp", *jpgs[c : c + 64], "--out", bd], check=True, capture_output=True)
        for j in range(len(pngs)):
            out.append(_read_bmp_grey(os.path.join(bd, f"f{j:04d}.bmp"))[2])
    return out


def to_u8(img):
    return bytes(0 if v <= 0 else 255 if v >= 255 else int(v + 0.5) for v in img)


# ---------------------------------------------------------------------------
# datasets
# ---------------------------------------------------------------------------
_STUDY = None


def _study_map():
    global _STUDY
    if _STUDY is None:
        _STUDY = {}
        for dom in ("Left_Dominance", "Right_Dominance"):
            base = os.path.join(DS_ROOT, dom)
            if not os.path.isdir(base):
                continue
            for s in os.listdir(base):
                if s.startswith("Study"):
                    _STUDY[s[5:10]] = os.path.join(base, s)
    return _STUDY


def npz_path_for_run(run_id):
    """cd-01031-LCA-6 -> source npz (same ordering rule as build_dominance.mjs)."""
    _, pid, artery, k = run_id.split("-")
    study = _study_map().get(pid)
    if not study:
        raise FileNotFoundError(run_id)
    files = []
    for art in ("LCA", "RCA"):
        d = os.path.join(study, art)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith(".npz"):
                    files.append((os.path.join(d, f), art))
    files.sort(key=lambda x: x[0])
    f, art = files[int(k) - 1]
    if art != artery:
        raise ValueError((run_id, f))
    return f


def load_npz_run(run_id, frames=None):
    """(list of frames as array('d'), meta) from the lossless npz."""
    p = npz_path_for_run(run_id)
    with zipfile.ZipFile(p) as z:
        d, shape, payload = read_npy(z.read("pixel_array.npy"))
        meta = {}
        for n in z.namelist():
            if n != "pixel_array.npy":
                dd, sh, pl = read_npy(z.read(n))
                meta[n[:-4]] = scalar(dd, sh, pl)
    n, h, w = shape
    if (h, w) != (H, W) or d != "<f8":
        raise ValueError((run_id, shape, d))
    size = h * w * 8
    idx = range(n) if frames is None else [i for i in frames if 0 <= i < n]
    out = []
    for i in idx:
        a = array.array("d")
        a.frombytes(payload[i * size : (i + 1) * size])
        out.append(a)
    meta["nframes"] = n
    return out, meta


def cadica_png(run_id, k):
    p, v = run_id.split("_")
    return os.path.join(CADICA_ROOT, p, v, "input", f"{run_id}_{k:05d}.png")


def cadica_frames(run_id):
    p, v = run_id.split("_")
    d = os.path.join(CADICA_ROOT, p, v, "input")
    return sorted(f for f in os.listdir(d) if f.endswith(".png"))


# ---------------------------------------------------------------------------
# fast image operations on flat 2-D arrays
# ---------------------------------------------------------------------------
def _box_sums_rows(rows, r, n):
    """Shrinking-window box sums of radius r along each row (list of sequences of length n)."""
    hi = [min(n, x + r + 1) for x in range(n)]
    lo = [max(0, x - r) for x in range(n)]
    ghi = itemgetter(*hi)
    glo = itemgetter(*lo)
    out = []
    for row in rows:
        c = [0.0]
        c.extend(accumulate(row))
        out.append(list(map(sub, ghi(c), glo(c))))
    return out


def box_mean(img, r, w=W, h=H):
    """Mean over the (2r+1)^2 box, shrinking at the borders (same as the audit's integral image)."""
    rows = [img[y * w : (y + 1) * w] for y in range(h)]
    hs = _box_sums_rows(rows, r, w)
    cols = [list(c) for c in zip(*hs)]
    vs = _box_sums_rows(cols, r, h)
    cntx = [min(w, x + r + 1) - max(0, x - r) for x in range(w)]
    cnty = [min(h, y + r + 1) - max(0, y - r) for y in range(h)]
    out = array.array("d", bytes(8 * w * h))
    for x in range(w):
        col = vs[x]
        cx = cntx[x]
        # write column x
        vals = [s / (cx * cy) for s, cy in zip(col, cnty)]
        out[x :: w] = array.array("d", vals)
    return out


def bin2(img, w=W, h=H):
    """2 x 2 mean binning."""
    out = array.array("d", bytes(8 * (w // 2) * (h // 2)))
    hw = w // 2
    for y in range(h // 2):
        r0 = img[2 * y * w : (2 * y + 1) * w]
        r1 = img[(2 * y + 1) * w : (2 * y + 2) * w]
        s = list(map(sum, zip(r0[0::2], r0[1::2], r1[0::2], r1[1::2])))
        out[y * hw : (y + 1) * hw] = array.array("d", [v * 0.25 for v in s])
    return out


def binn(img, f, w=W, h=H):
    """f x f mean binning (w, h divisible by f)."""
    ow, oh = w // f, h // f
    out = array.array("d", bytes(8 * ow * oh))
    inv = 1.0 / (f * f)
    for y in range(oh):
        acc = [0.0] * ow
        for j in range(f):
            row = img[(y * f + j) * w : (y * f + j + 1) * w]
            for i in range(f):
                acc = list(map(float.__add__, acc, row[i::f]))
        out[y * ow : (y + 1) * ow] = array.array("d", [v * inv for v in acc])
    return out


def resample512(img, w, h, margin=0.0, out_size=512):
    """Bilinear resample of a w x h image to out_size^2, dropping `margin` px on every side.
    Sample positions are margin + x * (w - 1.01 - 2*margin) / (out_size - 1) (the audit's rule)."""
    n = out_size
    sx = (w - 1.01 - 2 * margin) / (n - 1)
    sy = (h - 1.01 - 2 * margin) / (n - 1)
    xs = [margin + x * sx for x in range(n)]
    x0 = [int(x) for x in xs]
    fx = [x - i for x, i in zip(xs, x0)]
    gx = [1 - f for f in fx]
    g0 = itemgetter(*x0)
    g1 = itemgetter(*[i + 1 for i in x0])
    # horizontal pass on the source rows we need
    need = {}
    ys = [margin + y * sy for y in range(n)]
    for yv in ys:
        y0 = int(yv)
        for yy in (y0, y0 + 1):
            if yy not in need:
                row = img[yy * w : (yy + 1) * w]
                a = g0(row)
                b = g1(row)
                need[yy] = list(map(float.__add__, map(mul, a, gx), map(mul, b, fx)))
    out = array.array("d", bytes(8 * n * n))
    for y, yv in enumerate(ys):
        y0 = int(yv)
        f = yv - y0
        a = need[y0]
        b = need[y0 + 1]
        g = 1 - f
        out[y * n : (y + 1) * n] = array.array("d", [p * g + q * f for p, q in zip(a, b)])
    return out


def crop(img, x0, y0, cw, ch, w=W):
    out = array.array("d")
    for y in range(y0, y0 + ch):
        out.extend(img[y * w + x0 : y * w + x0 + cw])
    return out


def block(img, x0, y0, bw, bh, w=W):
    return [list(img[(y0 + j) * w + x0 : (y0 + j) * w + x0 + bw]) for j in range(bh)]


def detrend_plane(b):
    """Least-squares plane removal on a 2-D list block; returns (residual block, mean)."""
    bh, bw = len(b), len(b[0])
    n = bw * bh
    xs = [i - (bw - 1) / 2 for i in range(bw)]
    ys = [j - (bh - 1) / 2 for j in range(bh)]
    sxx = sum(x * x for x in xs) * bh
    syy = sum(y * y for y in ys) * bw
    m = sum(sum(r) for r in b) / n
    colsum = [sum(c) for c in zip(*b)]
    rowsum = [sum(r) for r in b]
    sx = sum(c * x for c, x in zip(colsum, xs))
    sy = sum(r * y for r, y in zip(rowsum, ys))
    ax, ay = sx / sxx, sy / syy
    axs = [m + ax * x for x in xs]
    return [[v - a - ay * y for v, a in zip(row, axs)] for row, y in zip(b, ys)], m


def solve(A, b):
    n = len(b)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        if abs(M[c][c]) < 1e-12:
            continue
        for r in range(n):
            if r != c:
                f = M[r][c] / M[c][c]
                if f:
                    for k in range(c, n + 1):
                        M[r][k] -= f * M[c][k]
    return [M[i][n] / M[i][i] if abs(M[i][i]) > 1e-12 else 0.0 for i in range(n)]


# ---------------------------------------------------------------------------
# FFT and power spectra
# ---------------------------------------------------------------------------
_TW = {}


def fft(x):
    """Iterative radix-2 FFT of a list of complex/real numbers (length a power of two)."""
    n = len(x)
    a = list(x)
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    tw = _TW.get(n)
    if tw is None:
        tw = [complex(math.cos(-2 * math.pi * k / n), math.sin(-2 * math.pi * k / n)) for k in range(n // 2)]
        _TW[n] = tw
    L = 2
    while L <= n:
        half = L // 2
        step = n // L
        ws = tw[::step][:half]
        for i in range(0, n, L):
            for k in range(half):
                u = a[i + k]
                v = a[i + k + half] * ws[k]
                a[i + k] = u + v
                a[i + k + half] = u - v
        L <<= 1
    return a


def fft2(b):
    rows = [fft(r) for r in b]
    cols = [fft(list(c)) for c in zip(*rows)]
    return [list(r) for r in zip(*cols)]


def hann2(n):
    w = [0.5 - 0.5 * math.cos(2 * math.pi * (i + 0.5) / n) for i in range(n)]
    return [[w[j] * w[i] for i in range(n)] for j in range(n)]


_HANN = {}
_RADIAL = {}


def radial_ps(b, nbins=None, detrend=True, exclude_axes=False):
    """Radially averaged power spectrum of a square block (plane-detrended, Hann-windowed).
    Returns a list of (f cycles/px, power)."""
    n = len(b)
    res = detrend_plane(b)[0] if detrend else b
    hw = _HANN.get(n)
    if hw is None:
        hw = hann2(n)
        _HANN[n] = (hw, sum(x * x for r in hw for x in r))
        hw = _HANN[n]
    win, wsum = hw
    xb = [list(map(mul, r, wr)) for r, wr in zip(res, win)]
    F = fft2(xb)
    nb = nbins or n // 2
    key = (n, nb, exclude_axes)
    lut = _RADIAL.get(key)
    if lut is None:
        lut = []
        for v in range(n):
            fv = v if v <= n // 2 else v - n
            row = []
            for u in range(n):
                fu = u if u <= n // 2 else u - n
                k = int(math.hypot(fu, fv) + 0.5)
                if exclude_axes and (fu == 0 or fv == 0):
                    k = 0
                row.append(k if 1 <= k < nb else 0)
            lut.append(row)
        _RADIAL[key] = lut
    acc = [0.0] * nb
    cnt = [0] * nb
    for v in range(n):
        Fr = F[v]
        lr = lut[v]
        for u in range(n):
            k = lr[u]
            if k:
                c = Fr[u]
                acc[k] += (c.real * c.real + c.imag * c.imag) / wsum
                cnt[k] += 1
    return [(k / n, acc[k] / cnt[k]) for k in range(1, nb) if cnt[k]]


def loglog_slope(ps, f0, f1):
    pts = [(math.log(f), math.log(p)) for f, p in ps if f0 <= f <= f1 and p > 0]
    n = len(pts)
    if n < 3:
        return float("nan")
    mx = sum(p[0] for p in pts) / n
    my = sum(p[1] for p in pts) / n
    sxx = sum((p[0] - mx) ** 2 for p in pts)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in pts)
    return sxy / sxx


# ---------------------------------------------------------------------------
# sampling and profiles
# ---------------------------------------------------------------------------
def bil(img, x, y, w=W, h=H):
    if x < 0 or y < 0 or x > w - 1.001 or y > h - 1.001:
        return float("nan")
    x0, y0 = int(x), int(y)
    fx, fy = x - x0, y - y0
    i = y0 * w + x0
    return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + w] * (1 - fx) + img[i + w + 1] * fx) * fy


def profile(img, cx, cy, nx, ny, half=20, step=0.25):
    """Profile through (cx, cy) along unit normal (nx, ny), offsets -half..half px."""
    n = int(half / step)
    return [(k * step, bil(img, cx + nx * k * step, cy + ny * k * step)) for k in range(-n, n + 1)]


def save_img(img, out, w=W, h=H):
    write_png_gray(out, w, h, to_u8(img))


# ---------------------------------------------------------------------------
# misc
# ---------------------------------------------------------------------------
def load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, obj, indent=1):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.{os.getpid()}.tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=indent)
    os.replace(tmp, path)


def rel(path):
    return os.path.relpath(path, ROOT)
