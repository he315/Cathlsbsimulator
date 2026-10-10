"""
Image-forensics helpers for real coronary cine frames (Python stdlib only).

Sources:
  * CoronaryDominance domain-shift set (Philips Azurion), lossless 8-bit values stored as
    float64 in .npz under datasets/extracted/CoronaryDominance/... (frame border removed and
    resized to 512 px by the dataset authors).
  * CADICA (Siemens Artis Zee) lossless 8-bit PNG under datasets/extracted/CADICA/....
  * The app's JPEG library (datasets/library/...), JPEG q72: used for viewing and for the
    Allura Clarity "main" set, never for noise statistics.

PNG decoding uses read_png_gray from scripts/angio_library/common.py; JPEG is converted with
macOS sips.
"""

import array
import cmath
import math
import os
import subprocess
import sys
import zipfile

PROJ = "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator"
sys.path.insert(0, os.path.join(PROJ, "scripts", "angio_library"))
from common import read_npy, read_png_gray, scalar, write_png_gray  # noqa: E402

SCR = "/private/tmp/claude-502/cathmaster-research"
TMP = os.path.join(SCR, "tmp")
os.makedirs(TMP, exist_ok=True)

LIB = os.path.join(PROJ, "datasets", "library")
DS_ROOT = os.path.join(PROJ, "datasets", "extracted", "CoronaryDominance", "anonymous_nonframe_domain_shift_dataset")
CADICA_ROOT = os.path.join(PROJ, "datasets", "extracted", "CADICA", "CADICA", "selectedVideos")

W = H = 512


# ---------------------------------------------------------------------------
# loading
# ---------------------------------------------------------------------------
def to_f(px: bytes):
    return array.array("d", array.array("B", px))


def load_png(path):
    w, h, px = read_png_gray(path)
    assert (w, h) == (W, H), (path, w, h)
    return to_f(px)


def load_jpg(path):
    out = os.path.join(TMP, "j_" + str(abs(hash(path))) + ".png")
    if not os.path.exists(out):
        subprocess.run(["sips", "-s", "format", "png", path, "--out", out], capture_output=True)
    return load_png(out)


_NPZ_CACHE = {}


def npz_path_for_run(run_id):
    """cd-01031-LCA-6 -> source npz (same ordering rule as build_dominance.mjs)."""
    pid, artery, k = run_id.split("-")[1], run_id.split("-")[2], int(run_id.split("-")[3])
    study = None
    for dom in ("Left_Dominance", "Right_Dominance"):
        base = os.path.join(DS_ROOT, dom)
        for s in os.listdir(base):
            if s.startswith("Study" + pid + "_"):
                study = os.path.join(base, s)
    assert study, run_id
    files = []
    for art in ("LCA", "RCA"):
        d = os.path.join(study, art)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith(".npz"):
                    files.append((os.path.join(d, f), art))
    files.sort(key=lambda x: x[0])
    f, art = files[k - 1]
    assert art == artery, (run_id, f)
    return f


def load_npz_run(run_id, frames=None):
    """Return (list of frames as array('d'), meta) from the lossless npz."""
    p = npz_path_for_run(run_id)
    with zipfile.ZipFile(p) as z:
        d, shape, payload = read_npy(z.read("pixel_array.npy"))
        meta = {}
        for n in z.namelist():
            if n != "pixel_array.npy":
                dd, sh, pl = read_npy(z.read(n))
                meta[n[:-4]] = scalar(dd, sh, pl)
    n, h, w = shape
    assert (h, w) == (H, W) and d == "<f8"
    size = h * w * 8
    idx = range(n) if frames is None else [i for i in frames if i < n]
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
# basic image ops on flat arrays (row-major, W x H)
# ---------------------------------------------------------------------------
def integral(img, w=W, h=H):
    S = array.array("d", [0.0]) * ((w + 1) * (h + 1))
    for y in range(h):
        run = 0.0
        ro = y * w
        so = (y + 1) * (w + 1)
        sp = y * (w + 1)
        for x in range(w):
            run += img[ro + x]
            S[so + x + 1] = S[sp + x + 1] + run
    return S


def box_mean(img, r, w=W, h=H):
    S = integral(img, w, h)
    out = array.array("d", [0.0]) * (w * h)
    W1 = w + 1
    for y in range(h):
        y0 = max(0, y - r)
        y1 = min(h, y + r + 1)
        for x in range(w):
            x0 = max(0, x - r)
            x1 = min(w, x + r + 1)
            s = S[y1 * W1 + x1] - S[y0 * W1 + x1] - S[y1 * W1 + x0] + S[y0 * W1 + x0]
            out[y * w + x] = s / ((y1 - y0) * (x1 - x0))
    return out


def block(img, x0, y0, bw, bh, w=W):
    return [[img[(y0 + j) * w + x0 + i] for i in range(bw)] for j in range(bh)]


def detrend_plane(b):
    """Least-squares plane removal on a 2-D list block; returns residual block."""
    bh, bw = len(b), len(b[0])
    n = bw * bh
    xs = [i - (bw - 1) / 2 for i in range(bw)]
    ys = [j - (bh - 1) / 2 for j in range(bh)]
    sxx = sum(x * x for x in xs) * bh
    syy = sum(y * y for y in ys) * bw
    m = sum(sum(r) for r in b) / n
    sx = sum(b[j][i] * xs[i] for j in range(bh) for i in range(bw))
    sy = sum(b[j][i] * ys[j] for j in range(bh) for i in range(bw))
    ax, ay = sx / sxx, sy / syy
    return [[b[j][i] - m - ax * xs[i] - ay * ys[j] for i in range(bw)] for j in range(bh)], m


def detrend_quad(b):
    """Remove a 2-D quadratic surface (least squares via normal equations, 6 terms)."""
    bh, bw = len(b), len(b[0])
    pts = []
    for j in range(bh):
        for i in range(bw):
            x = (i - (bw - 1) / 2) / bw
            y = (j - (bh - 1) / 2) / bh
            pts.append(((1.0, x, y, x * x, x * y, y * y), b[j][i]))
    k = 6
    A = [[0.0] * k for _ in range(k)]
    r = [0.0] * k
    for f, v in pts:
        for a in range(k):
            r[a] += f[a] * v
            fa = f[a]
            Aa = A[a]
            for c in range(k):
                Aa[c] += fa * f[c]
    coef = solve(A, r)
    m = sum(v for _, v in pts) / len(pts)
    out = [[0.0] * bw for _ in range(bh)]
    idx = 0
    for j in range(bh):
        for i in range(bw):
            f, v = pts[idx]
            out[j][i] = v - sum(coef[a] * f[a] for a in range(k))
            idx += 1
    return out, m


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


def sd2(b):
    v = [x for r in b for x in r]
    m = sum(v) / len(v)
    return math.sqrt(sum((x - m) ** 2 for x in v) / (len(v) - 1))


def acf_block(res, maxlag=4):
    """Normalised autocorrelation of a zero-mean residual block at horizontal and vertical lags."""
    bh, bw = len(res), len(res[0])
    var = sum(x * x for r in res for x in r) / (bw * bh)
    hx, vy = [], []
    for L in range(1, maxlag + 1):
        s = 0.0
        n = 0
        for j in range(bh):
            r = res[j]
            for i in range(bw - L):
                s += r[i] * r[i + L]
                n += 1
        hx.append(s / n / var)
        s = 0.0
        n = 0
        for j in range(bh - L):
            r0, r1 = res[j], res[j + L]
            for i in range(bw):
                s += r0[i] * r1[i]
                n += 1
        vy.append(s / n / var)
    return hx, vy, var


# ---------------------------------------------------------------------------
# FFT (radix-2) and power spectra
# ---------------------------------------------------------------------------
def fft(x):
    n = len(x)
    j = 0
    a = list(x)
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    L = 2
    while L <= n:
        ang = -2 * math.pi / L
        wl = complex(math.cos(ang), math.sin(ang))
        for i in range(0, n, L):
            wv = 1 + 0j
            for k in range(L // 2):
                u = a[i + k]
                v = a[i + k + L // 2] * wv
                a[i + k] = u + v
                a[i + k + L // 2] = u - v
                wv *= wl
        L <<= 1
    return a


def fft2(b):
    rows = [fft(r) for r in b]
    n = len(b)
    cols = [fft([rows[j][i] for j in range(n)]) for i in range(len(b[0]))]
    # cols[i][j] = F(u=i? ) -> return as F[v][u]
    return [[cols[i][j] for i in range(len(cols))] for j in range(n)]


def hann2(n):
    w = [0.5 - 0.5 * math.cos(2 * math.pi * (i + 0.5) / n) for i in range(n)]
    return [[w[j] * w[i] for i in range(n)] for j in range(n)]


def radial_ps(b, nbins=None):
    """Radially averaged power spectrum of a square block (detrended, Hann-windowed).
    Returns list of (f cycles/px, power)."""
    n = len(b)
    res, _ = detrend_plane(b)
    hw = hann2(n)
    wsum = sum(x * x for r in hw for x in r)
    xb = [[res[j][i] * hw[j][i] for i in range(n)] for j in range(n)]
    F = fft2(xb)
    nb = nbins or n // 2
    acc = [0.0] * nb
    cnt = [0] * nb
    for v in range(n):
        fv = v if v <= n // 2 else v - n
        for u in range(n):
            fu = u if u <= n // 2 else u - n
            r = math.hypot(fu, fv)
            k = int(r + 0.5)
            if 1 <= k < nb:
                acc[k] += abs(F[v][u]) ** 2 / wsum
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
# sampling, profiles
# ---------------------------------------------------------------------------
def bil(img, x, y, w=W, h=H):
    if x < 0 or y < 0 or x > w - 1.001 or y > h - 1.001:
        return float("nan")
    x0, y0 = int(x), int(y)
    fx, fy = x - x0, y - y0
    i = y0 * w + x0
    return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + w] * (1 - fx) + img[i + w + 1] * fx) * fy


def profile(img, cx, cy, nx, ny, half=20, step=0.25):
    """Profile through (cx,cy) along unit normal (nx,ny), offsets -half..half px."""
    n = int(half / step)
    return [(k * step, bil(img, cx + nx * k * step, cy + ny * k * step)) for k in range(-n, n + 1)]


def save_crop(img, x0, y0, cw, ch, scale, out, w=W, marks=()):
    """Write an enlarged crop (nearest neighbour) with optional cross marks for coordinate picking."""
    ow, oh = cw * scale, ch * scale
    px = bytearray(ow * oh)
    for j in range(oh):
        sy = y0 + j // scale
        for i in range(ow):
            sx = x0 + i // scale
            v = img[sy * w + sx] if 0 <= sx < w and 0 <= sy < H else 0
            px[j * ow + i] = max(0, min(255, int(v)))
    # tick marks every 20 source px along the crop edges, dots every 20 px inside
    for j in range(oh):
        sy = y0 + j / scale
        for i in range(ow):
            sx = x0 + i / scale
            onx = abs(sx % 20) < 1 / scale
            ony = abs(sy % 20) < 1 / scale
            if (onx and ony) or (onx and j < 6) or (ony and i < 6):
                px[j * ow + i] = 255
    for (mx, my) in marks:
        cxp, cyp = int((mx - x0) * scale), int((my - y0) * scale)
        for d in range(-6, 7):
            for (a, b) in ((cxp + d, cyp), (cxp, cyp + d)):
                if 0 <= a < ow and 0 <= b < oh:
                    px[b * ow + a] = 255
    write_png_gray(out, ow, oh, bytes(px))


def save_img(img, out, w=W, h=H):
    write_png_gray(out, w, h, bytes(max(0, min(255, int(v + 0.5))) for v in img))


def ncc_track(frames, x, y, r=7, search=12, update=True):
    """Track a point by normalised cross-correlation (template from previous frame).
    Returns list of (x, y, score) per frame (integer + parabolic sub-pixel)."""
    out = [(x, y, 1.0)]
    cx, cy = x, y
    tmpl_src = frames[0]
    tx, ty = int(round(cx)), int(round(cy))
    for f in range(1, len(frames)):
        T = [tmpl_src[(ty + j) * W + tx + i] for j in range(-r, r + 1) for i in range(-r, r + 1)]
        mT = sum(T) / len(T)
        Tz = [t - mT for t in T]
        sT = math.sqrt(sum(t * t for t in Tz)) or 1
        img = frames[f]
        best = (-2, 0, 0)
        scores = {}
        bx0, by0 = int(round(cx)), int(round(cy))
        for dy in range(-search, search + 1):
            for dx in range(-search, search + 1):
                px, py = bx0 + dx, by0 + dy
                if px - r < 0 or py - r < 0 or px + r >= W or py + r >= H:
                    continue
                P = [img[(py + j) * W + px + i] for j in range(-r, r + 1) for i in range(-r, r + 1)]
                mP = sum(P) / len(P)
                num = 0.0
                sP = 0.0
                for k in range(len(P)):
                    p = P[k] - mP
                    num += p * Tz[k]
                    sP += p * p
                s = num / (sT * (math.sqrt(sP) or 1))
                scores[(dx, dy)] = s
                if s > best[0]:
                    best = (s, dx, dy)
        s, dx, dy = best

        def sub(a, b, c):
            d = a - 2 * b + c
            return 0.0 if d == 0 else 0.5 * (a - c) / d

        ox = sub(scores.get((dx - 1, dy), s), s, scores.get((dx + 1, dy), s))
        oy = sub(scores.get((dx, dy - 1), s), s, scores.get((dx, dy + 1), s))
        nx_, ny_ = bx0 + dx + ox, by0 + dy + oy
        out.append((nx_, ny_, s))
        cx, cy = nx_, ny_
        if update:
            tmpl_src = img
            tx, ty = bx0 + dx, by0 + dy
    return out


def resample512(img, w, h, margin=0):
    """Bilinear resample of a w x h image (optionally dropping `margin` px on every side) to 512 x 512."""
    out = array.array("d", [0.0]) * (512 * 512)
    sx = (w - 1.01 - 2 * margin) / 511
    sy = (h - 1.01 - 2 * margin) / 511
    for y in range(512):
        for x in range(512):
            out[y * 512 + x] = bil(img, margin + x * sx, margin + y * sy, w, h)
    return out
