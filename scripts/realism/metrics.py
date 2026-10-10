"""
Image metrics of the realism harness. Every function takes 512 x 512 frames (array('d'), grey
0-255, dense = dark) and returns plain numbers, so library runs and simulator captures are
measured by the same code. The methods are ports of the phase-1 audit scripts
(docs/realism/research/*.py); each docstring names its source and the exact rule.
"""

import math
from operator import mul, sub

import imlib
from imlib import H, W, box_mean, median, quantile

# ---------------------------------------------------------------------------
# field box: frames from the simulator carry a collimated black border; real library frames
# have it removed by the dataset authors. Anatomy metrics work inside the field.
# ---------------------------------------------------------------------------


def field_box(img, w, h, frac=0.2):
    """In-field bounding box (x0, y0, x1, y1), exclusive ends: edge rows/columns whose mean over the
    central half is below `frac` x the median of the central quarter are outside the field."""
    cvals = sorted(img[y * w + x] for y in range(h // 4, 3 * h // 4, 4) for x in range(w // 4, 3 * w // 4, 4))
    ref = cvals[len(cvals) // 2]
    thr = frac * ref

    def colmean(x):
        return sum(img[y * w + x] for y in range(h // 4, 3 * h // 4)) / (h // 2)

    def rowmean(y):
        return sum(img[y * w + w // 4 : y * w + 3 * w // 4]) / (w // 2)

    x0 = 0
    while x0 < w // 8 and colmean(x0) < thr:
        x0 += 1
    x1 = w
    while x1 > w - w // 8 and colmean(x1 - 1) < thr:
        x1 -= 1
    y0 = 0
    while y0 < h // 8 and rowmean(y0) < thr:
        y0 += 1
    y1 = h
    while y1 > h - h // 8 and rowmean(y1 - 1) < thr:
        y1 -= 1
    return x0, y0, x1, y1


# ---------------------------------------------------------------------------
# (1) temporal noise: noise2.py
# ---------------------------------------------------------------------------
B = 32
MARGIN = 16
N = B * B
_F = []
for _j in range(B):
    for _i in range(B):
        _x = (_i - (B - 1) / 2) / B
        _y = (_j - (B - 1) / 2) / B
        _F.append((1.0, _x, _y, _x * _x, _x * _y, _y * _y))


def _inv(A):
    n = len(A)
    M = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        pv = M[c][c]
        M[c] = [v / pv for v in M[c]]
        for r in range(n):
            if r != c and M[r][c]:
                f = M[r][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [row[n:] for row in M]


_A = [[sum(_F[n][a] * _F[n][c] for n in range(N)) for c in range(6)] for a in range(6)]
_Ai = _inv(_A)
_P = [[sum(_Ai[a][c] * _F[n][c] for c in range(6)) for n in range(N)] for a in range(6)]
_FT = [[_F[n][a] for n in range(N)] for a in range(6)]


def detrend(v):
    """Remove the least-squares quadratic surface from a 32 x 32 block (flat list)."""
    coef = [sum(map(mul, _P[a], v)) for a in range(6)]
    fit = [0.0] * N
    for a in range(6):
        c = coef[a]
        fit = [f + c * t for f, t in zip(fit, _FT[a])]
    return list(map(sub, v, fit))


def blk(img, x0, y0):
    out = []
    for j in range(B):
        o = (y0 + j) * W + x0
        out.extend(img[o : o + B])
    return out


def var(v, dof=6):
    return sum(map(mul, v, v)) / (len(v) - dof)


def acf(res, maxlag=4):
    v0 = sum(map(mul, res, res)) / N
    hx, vy = [], []
    rows = [res[j * B : (j + 1) * B] for j in range(B)]
    for L in range(1, maxlag + 1):
        s = sum(sum(map(mul, r[:-L], r[L:])) for r in rows)
        hx.append(s / ((B - L) * B) / v0)
        s = sum(sum(map(mul, rows[j], rows[j + L])) for j in range(B - L))
        vy.append(s / ((B - L) * B) / v0)
    return hx, vy


GRID = [(x0, y0) for y0 in range(MARGIN, H - MARGIN - B + 1, B) for x0 in range(MARGIN, W - MARGIN - B + 1, B)]
NOISE_PAIRS = (1, 3, 12, 20, 28, 36)


def noise(frames, ks=None):
    """noise2.py. For each k in ks (needs k-1, k, k+1): D = I[k+1] - I[k] in 32 x 32 blocks on a
    32-px grid with a 16-px margin, quadratic surface removed; saturated blocks (max >= 254.5 or
    min <= 0.5) skipped. Static blocks = lowest 30% of var(D) within each 32-grey bin of I[k] (bins
    with < 6 blocks dropped). sigma_t = SD(D)/sqrt(2). Temporal correlation rho = 3 - var(second
    difference)/var(D). ACF and radial NPS (Hann) of D. dark/bright ratio = sigma_t(96-127) /
    sigma_t(160-191). Also sigma_t in 20-grey bins (renderer-physics audit binning)."""
    n = len(frames)
    if ks is None:
        ks = [k for k in NOISE_PAIRS if k + 1 < n]
    ks = [k for k in ks if k >= 1 and k + 1 < n]
    if not ks:
        return None
    recs = []
    for k in ks:
        a, b, c = frames[k - 1], frames[k], frames[k + 1]
        for (x0, y0) in GRID:
            vb = blk(b, x0, y0)
            if max(vb) >= 254.5 or min(vb) <= 0.5:
                continue
            va = blk(a, x0, y0)
            vc = blk(c, x0, y0)
            d1 = detrend(list(map(sub, vc, vb)))
            d2 = detrend([p - 2 * q + r for p, q, r in zip(va, vb, vc)])
            recs.append({"k": k, "x": x0, "y": y0, "mean": sum(vb) / N, "v1": var(d1), "v2": var(d2), "d1": d1})
    bins = {}
    for r in recs:
        bins.setdefault(int(r["mean"] // 32) * 32, []).append(r)
    sel = []
    for g, v in bins.items():
        if len(v) < 6:
            continue
        v.sort(key=lambda r: r["v1"])
        sel.extend(v[: max(2, int(0.3 * len(v)))])
    if len(sel) < 6:
        return None
    out = {"pairs": len(ks), "n_static_blocks": len(sel)}
    sb = {}
    for r in sel:
        sb.setdefault(int(r["mean"] // 32) * 32, []).append(math.sqrt(r["v1"] / 2))
    byg = {f"{g}-{g + 31}": [round(imlib.lower_median(v), 3), len(v)] for g, v in sorted(sb.items())}
    out["sigma_t_by_grey"] = byg
    out["sigma_t_median"] = round(imlib.lower_median([math.sqrt(r["v1"] / 2) for r in sel]), 3)
    if "96-127" in byg and "160-191" in byg and byg["160-191"][0] > 0:
        out["dark_bright_ratio"] = round(byg["96-127"][0] / byg["160-191"][0], 3)
    else:
        out["dark_bright_ratio"] = None
    med = imlib.lower_median([r["v2"] / r["v1"] for r in sel])
    out["rho_temporal"] = round(3 - med, 3)
    hx = [0.0] * 4
    vy = [0.0] * 4
    for r in sel:
        a1, b1 = acf(r["d1"])
        for i in range(4):
            hx[i] += a1[i] / len(sel)
            vy[i] += b1[i] / len(sel)
    out["acf_h"] = [round(v, 3) for v in hx]
    out["acf_v"] = [round(v, 3) for v in vy]
    out["acf_lag1"] = round(0.5 * (hx[0] + vy[0]), 3)
    out["acf_lag2"] = round(0.5 * (hx[1] + vy[1]), 3)
    sub_ = sel[:: max(1, len(sel) // 80)]
    acc = None
    for r in sub_:
        ps = imlib.radial_ps([r["d1"][j * B : (j + 1) * B] for j in range(B)])
        tot = sum(p for _, p in ps)
        if acc is None:
            acc = [[f, 0.0] for f, _ in ps]
        for i, (f, p) in enumerate(ps):
            acc[i][1] += p / tot / len(sub_)
    out["nps_peak_cyc_px"] = round(max(acc, key=lambda q: q[1])[0], 3)
    out["nps_band_frac"] = {f"{a}-{b}": round(sum(p for f, p in acc if a < f <= b), 3) for a, b in [(0, 0.1), (0.1, 0.2), (0.2, 0.3), (0.3, 0.4), (0.4, 0.5)]}
    out["nps_low_frac"] = out["nps_band_frac"]["0-0.1"]
    lo = sum(p for f, p in acc if round(f * B) in (1, 2, 3))
    hi = sum(p for f, p in acc if round(f * B) in (13, 14, 15))
    out["nps_hi_lo"] = round(hi / lo, 4) if lo > 0 else None
    out["nps_curve"] = [[round(f, 4), round(p, 5)] for f, p in acc]
    # 20-grey bins (renderer-physics audit): lowest 30% of var(D) per bin, bins with < 5 blocks dropped
    b20 = {}
    for r in recs:
        b20.setdefault(int(r["mean"] // 20) * 20, []).append(r["v1"])
    by20 = {}
    for g, v in sorted(b20.items()):
        v.sort()
        s = v[: max(1, int(0.3 * len(v)))]
        if len(s) >= 5:
            by20[f"{g}-{g + 19}"] = round(imlib.lower_median([math.sqrt(x / 2) for x in s]), 3)
    out["sigma_t_by_grey20"] = by20
    return out


def settle(frames, npairs=10):
    """settle.py: temporal-difference noise for pairs (k, k+1), k = 0..npairs-1, from the lowest quartile
    of block variances (quadratic detrend, 32 x 32 blocks); returned relative to the last pair."""
    if len(frames) < npairs + 1:
        return None
    vals = []
    for k in range(npairs):
        a, b = frames[k], frames[k + 1]
        vs = []
        for (x0, y0) in GRID:
            vb = blk(b, x0, y0)
            if max(vb) >= 254.5 or min(vb) <= 0.5:
                continue
            va = blk(a, x0, y0)
            vs.append(var(detrend(list(map(sub, vb, va)))))
        if not vs:
            return None
        vs.sort()
        vals.append(math.sqrt(vs[len(vs) // 4] / 2))
    ref = vals[-1]
    if ref <= 0:
        return None
    return {"sigma_pairs": [round(v, 3) for v in vals], "ratio_to_last": [round(v / ref, 3) for v in vals], "first_pair_ratio": round(vals[0] / ref, 3)}


# ---------------------------------------------------------------------------
# (5) background texture: texture.py, plus the matched-pipeline spectrum of the renderer audit
# ---------------------------------------------------------------------------


def texture(img):
    """texture.py: 128 x 128 tiles on a 64-px grid (49 tiles), plane removed, Hann window, radial power
    spectrum; slopes over 0.016-0.1 and 0.1-0.3 cycles/px; tiles split into brightness terciles
    (bright = aerated lung). Band-pass RMS = 3 x 3 box mean minus 33 x 33 box mean, sampled every
    2 px in the tile interior (16-112 px)."""
    tiles = []
    for y0 in range(0, 512 - 128 + 1, 64):
        for x0 in range(0, 512 - 128 + 1, 64):
            t = imlib.block(img, x0, y0, 128, 128)
            m = sum(map(sum, t)) / (128 * 128)
            ps = imlib.radial_ps(t)
            tiles.append({"x": x0, "y": y0, "mean": m, "s_lo": imlib.loglog_slope(ps, 0.016, 0.1), "s_hi": imlib.loglog_slope(ps, 0.1, 0.3), "ps": ps})
    tiles.sort(key=lambda t: t["mean"])
    n = len(tiles)
    cls = {"dark": tiles[: n // 3], "mid": tiles[n // 3 : 2 * n // 3], "bright": tiles[2 * n // 3 :]}
    b3 = box_mean(img, 1)
    b33 = box_mean(img, 16)
    out = {}
    for k, ts in cls.items():
        rms = []
        for t in ts:
            s = 0.0
            c = 0
            for j in range(t["y"] + 16, t["y"] + 112, 2):
                o = j * 512
                a = b3[o + t["x"] + 16 : o + t["x"] + 112 : 2]
                b = b33[o + t["x"] + 16 : o + t["x"] + 112 : 2]
                d = list(map(sub, a, b))
                s += sum(map(mul, d, d))
                c += len(d)
            rms.append(math.sqrt(s / c))
        pw = {}
        for f in (0.016, 0.031, 0.062, 0.125, 0.25):
            vals = [min(t["ps"], key=lambda q: abs(q[0] - f))[1] for t in ts]
            pw[str(f)] = round(imlib.lower_median(vals), 2)
        out[k] = {
            "mean_grey": round(sum(t["mean"] for t in ts) / len(ts), 1),
            "slope_lo": round(imlib.lower_median([t["s_lo"] for t in ts if t["s_lo"] == t["s_lo"]]), 3),
            "slope_hi": round(imlib.lower_median([t["s_hi"] for t in ts if t["s_hi"] == t["s_hi"]]), 3),
            "bandpass_rms": round(imlib.lower_median(rms), 3),
            "power_at_f": pw,
        }
    return out


def spectrum256(img):
    """Renderer-physics audit: central 256 x 256 block, plane detrend, Hann window, 2-D FFT, radial
    average excluding the axes, log-log least-squares slope beta (reported positive) over
    0.008-0.08 and 0.08-0.3 cycles/px; band power = sum of radial-bin means over 0.008-0.08."""
    b = imlib.block(img, 128, 128, 256, 256)
    ps = imlib.radial_ps(b, exclude_axes=True)
    return {
        "beta_lo": round(-imlib.loglog_slope(ps, 0.008, 0.08), 3),
        "beta_hi": round(-imlib.loglog_slope(ps, 0.08, 0.3), 3),
        "band_power": round(sum(p for f, p in ps if 0.008 <= f <= 0.08), 1),
    }


# ---------------------------------------------------------------------------
# (4b) thin dark lines: ridge.py; local contrast: renderer-physics audit
# ---------------------------------------------------------------------------


def ridges(img):
    """ridge.py: pixel that is a strict 1-D minimum at +-2 px horizontally or vertically and at least 12
    grey levels below the 15 x 15 mean. Returns counts in depth classes 12-25, 25-50, > 50."""
    m = box_mean(img, 7)
    cnt = [0, 0, 0]
    for y in range(2, 510):
        o = y * 512
        row = img[o : o + 512]
        up = img[o - 1024 : o - 512]
        dn = img[o + 1024 : o + 1536]
        mr = m[o : o + 512]
        for x in range(2, 510):
            v = row[x]
            d = mr[x] - v
            if d < 12:
                continue
            if (v < row[x - 2] and v < row[x + 2]) or (v < up[x] and v < dn[x]):
                cnt[0 if d < 25 else 1 if d < 50 else 2] += 1
    return cnt


def local_contrast_p99(img, q=0.99, r=20, margin=0.1):
    """99th percentile of (41 x 41 box mean - pixel) over the central 80% of the frame."""
    m = box_mean(img, r)
    a = int(512 * margin)
    vals = []
    for y in range(a, 512 - a):
        o = y * 512
        vals.extend(map(sub, m[o + a : o + 512 - a], img[o + a : o + 512 - a]))
    vals.sort()
    return vals[int(q * (len(vals) - 1))]


# ---------------------------------------------------------------------------
# (7) contrast timing: timing.py; opacified area: m5_contrast.py; heart rate: m2_dynamics.py
# ---------------------------------------------------------------------------


def timing_signal(img):
    """timing.py: on the 2 x 2 binned frame, d = 15 x 15 box mean - pixel; returns (sum of d - 10 over
    d > 10, count of d > 30). The count ('major') is the audit's timing signal."""
    b = imlib.bin2(img)
    m = box_mean(b, 7, 256, 256)
    s = 0.0
    c = 0
    for d in map(sub, m, b):
        if d > 10:
            s += d - 10
            if d > 30:
                c += 1
    return s, c


def arrival_features(S, fps):
    """Contrast arrival as the audit's run_analysis summary (summarise.py timing()), applied to the
    harness's own opacified-pixel signal: baseline v0 = median of frames 0-1; arrival = first frame at or
    above v0 + 30% of the rise; time above 50% of the rise; whether the mean of the last 3 frames is still
    at or above 50%; whether arrival is frame 0 (contrast present from the first frame)."""
    if not S or len(S) < 6 or not fps:
        return None
    v0 = (S[0] + S[1]) / 2
    rise = max(S) - v0
    if rise <= 0:
        return None
    arr = next(i for i, x in enumerate(S) if x >= v0 + 0.3 * rise)
    half = v0 + 0.5 * rise
    above = sum(1 for x in S if x >= half)
    still = sum(S[-3:]) / 3 >= half
    return {"arrival30": arr, "arrival30_s": round(arr / fps, 3), "above50_s": round(above / fps, 3), "end3_ge50": 1.0 if still else 0.0, "arrival_at_frame0": 1.0 if arr == 0 else 0.0}


def timing_features(S, fps):
    """timing.py features. Baseline = min of frames 1-3 (frame 0 is atypical). f10/f50/f90 = first frames
    reaching 10/50/90% of (peak - baseline); wash50 = first frame after the peak below 50%."""
    if len(S) < 6:
        return None
    base = min(S[1:4])
    pk = max(S)
    ip = S.index(pk)
    rng = pk - base
    if rng <= 0:
        return None

    def first(th):
        for i in range(len(S)):
            if S[i] >= base + th * rng:
                return i
        return None

    def fall(th):
        for i in range(ip, len(S)):
            if S[i] < base + th * rng:
                return i
        return None

    f10, f50, f90 = first(0.1), first(0.5), first(0.9)
    w50 = fall(0.5)
    out = {
        "n": len(S),
        "fps": fps,
        "base": base,
        "peak": pk,
        "f10": f10,
        "f50": f50,
        "f90": f90,
        "rise_frames": (f90 - f10) if (f10 is not None and f90 is not None) else None,
        "peak_frame": ip,
        "frames_ge90": sum(1 for v in S if v >= base + 0.9 * rng),
        "wash50_after_peak": (w50 - ip) if w50 is not None else None,
        "end_rel": round((S[-1] - base) / rng, 3),
        "run_frames": len(S),
    }
    sec = {"f10": "f10_s", "f50": "f50_s", "f90": "f90_s", "rise_frames": "rise_s", "peak_frame": "peak_s", "wash50_after_peak": "wash50_after_peak_s", "run_frames": "run_s"}
    for k, ks in sec.items():
        v = out[k]
        out[ks] = round(v / fps, 3) if v is not None else None
    return out


def _small128(img):
    """512 -> 128 by 4 x 4 box mean, rounded to 8 bit (PIL BOX resize of an 'L' image)."""
    b = imlib.binn(img, 4)
    return [int(v + 0.5) for v in b]


def _central128(s, m=15):
    return [s[y * 128 + x] for y in range(m, 128 - m) for x in range(m, 128 - m)]


def opacified(frames):
    """m5_contrast.py: frames at 128 px (box), central 76% (12% margin); baseline = pixelwise lightest of
    frames 0-2; D_k = mean(max(0, baseline - frame_k)); at the peak frame: fraction of pixels more than
    10 and 20 levels below baseline and the median darkening of the > 10 pixels."""
    if len(frames) < 6:
        return None
    ims = [_central128(_small128(f)) for f in frames]
    Bs = list(map(max, ims[0], ims[1], ims[2]))
    D = []
    for im in ims:
        d = [b - v if b > v else 0 for b, v in zip(Bs, im)]
        D.append(sum(d) / len(d))
    k = max(range(len(D)), key=lambda i: D[i])
    diff = [b - v if b > v else 0 for b, v in zip(Bs, ims[k])]
    n = len(diff)
    a10 = sum(1 for v in diff if v > 10) / n
    a20 = sum(1 for v in diff if v > 20) / n
    big = [v for v in diff if v > 10]
    return {"peak_frame": k, "peakD": round(D[k], 3), "area10": round(a10, 4), "area20": round(a20, 4), "dark_in_area10": median(big) if big else 0}


def mean_abs_diff_series(frames):
    """m2_dynamics.py M series: mean |frame_k - frame_k-1| at 128 px (box) on the central 76%."""
    ims = [_central128(_small128(f)) for f in frames]
    M = [0.0]
    for i in range(1, len(ims)):
        M.append(sum(abs(a - b) for a, b in zip(ims[i], ims[i - 1])) / len(ims[i]))
    return M


def autocorr_period(x, lo, hi):
    """m2_dynamics.py: detrend with a centred moving average of `hi` frames, autocorrelation, highest
    local maximum between lags lo..hi, accepted if >= 0.25, parabolic refinement."""
    n = len(x)
    if n < hi * 2 + 4:
        return None
    w = hi
    y = []
    for i in range(n):
        a = max(0, i - w // 2)
        b = min(n, i + w // 2 + 1)
        y.append(x[i] - sum(x[a:b]) / (b - a))
    m = sum(y) / n
    y = [v - m for v in y]
    v0 = sum(v * v for v in y)
    if v0 <= 0:
        return None
    ac = [sum(y[i] * y[i + L] for i in range(n - L)) / v0 for L in range(hi + 2)]
    best = None
    for L in range(lo, hi + 1):
        if ac[L] > ac[L - 1] and ac[L] >= ac[L + 1] and (best is None or ac[L] > ac[best]):
            best = L
    if best is None or ac[best] < 0.25:
        return None
    a, b, c = ac[best - 1], ac[best], ac[best + 1]
    den = a - 2 * b + c
    off = 0.5 * (a - c) / den if den != 0 else 0
    return best + off, ac[best]


def heart_rate(frames, fps):
    M = mean_abs_diff_series(frames)
    hp = autocorr_period(M, max(2, int(fps * 0.33)), int(fps * 1.5))
    if not hp:
        return {"hr_bpm": None, "ac": None}
    return {"hr_bpm": round(60 * fps / hp[0], 2), "ac": round(hp[1], 3), "period_frames": round(hp[0], 2)}


# ---------------------------------------------------------------------------
# grey percentiles: m7_pct.py
# ---------------------------------------------------------------------------


def grey_percentiles(img, margin=0.12):
    """m7_pct.py: p5/p50/p95 (index int(q (n - 1)) of the sorted values) inside a 12% margin."""
    m = int(512 * margin)
    v = []
    for y in range(m, 512 - m):
        v.extend(img[y * 512 + m : y * 512 + 512 - m])
    v = sorted(int(x + 0.5) for x in v)
    return {f"p{q}": v[int(q / 100 * (len(v) - 1))] for q in (5, 50, 95)}


# ---------------------------------------------------------------------------
# (8) field: field.py
# ---------------------------------------------------------------------------


def border_bands(img):
    def band(w0, w1):
        s = 0.0
        c = 0
        for y in range(512):
            for x in range(512):
                d = min(x, y, 511 - x, 511 - y)
                if w0 <= d < w1:
                    s += img[y * 512 + x]
                    c += 1
        return s / c

    centre = sum(sum(img[y * 512 + 192 : y * 512 + 320]) for y in range(192, 320)) / (128 * 128)
    out = {"centre": round(centre, 2)}
    for a, b in ((0, 2), (2, 4), (4, 8), (8, 16), (16, 32), (32, 64)):
        out[f"{a}-{b}px"] = round(band(a, b), 2)
    return out


def ring_profile(img):
    acc = [0.0] * 12
    cnt = [0] * 12
    for y in range(512):
        for x in range(512):
            r = math.hypot((x - 255.5) / 256, (y - 255.5) / 256)
            k = min(11, int(r / 0.125))
            acc[k] += img[y * 512 + x]
            cnt[k] += 1
    return [round(a / c, 2) if c else None for a, c in zip(acc, cnt)]


def field_edge(img):
    """Per-frame field-edge numbers relative to the 16-32 px band: edge02 = band(0-2) - band(16-32),
    edge24 = band(2-4) - band(16-32), edge816 = band(8-16) - band(16-32); plus the corner means."""
    b = border_bands(img)
    ref = b["16-32px"]
    corners = [sum(img[(y0 + j) * 512 + x0 + i] for j in range(16) for i in range(16)) / 256 for (x0, y0) in ((0, 0), (496, 0), (0, 496), (496, 496))]
    return {
        "bands": b,
        "edge02_rel": round(b["0-2px"] - ref, 2),
        "edge24_rel": round(b["2-4px"] - ref, 2),
        "edge816_rel": round(b["8-16px"] - ref, 2),
        "corner_rel": round(sum(corners) / 4 - ref, 2),
    }


def straight_edges(img, thr=4.0, agree=0.7):
    found = []
    for x in range(8, 504):
        ds = sorted(img[y * 512 + x - 2] - img[y * 512 + x + 2] for y in range(16, 496, 2))
        med = ds[len(ds) // 2]
        if abs(med) >= thr:
            same = sum(1 for d in ds if d * med > 0) / len(ds)
            if same >= agree:
                found.append(("col", x, round(med, 1), round(same, 2)))
    for y in range(8, 504):
        ds = sorted(img[(y - 2) * 512 + x] - img[(y + 2) * 512 + x] for x in range(16, 496, 2))
        med = ds[len(ds) // 2]
        if abs(med) >= thr:
            same = sum(1 for d in ds if d * med > 0) / len(ds)
            if same >= agree:
                found.append(("row", y, round(med, 1), round(same, 2)))
    merged = []
    for f in found:
        if merged and merged[-1][0] == f[0] and f[1] - merged[-1][1] <= 3:
            if abs(f[2]) > abs(merged[-1][2]):
                merged[-1] = f
            continue
        merged.append(f)
    return merged


# ---------------------------------------------------------------------------
# cardiac motion by block matching (renderer-physics audit)
# ---------------------------------------------------------------------------


def block_motion(frames, k0=10, k1=24, bs=24, R=14, nblocks=10):
    """Exhaustive SSD block matching (+-R px) of the `nblocks` highest-variance bs x bs blocks between
    consecutive frames k0..k1; median over blocks per pair, then median / p90 / max over pairs."""
    ks = [k for k in range(k0, min(k1, len(frames) - 1))]
    if len(ks) < 3:
        return None
    per_pair = []
    for k in ks:
        a, b = frames[k], frames[k + 1]
        cands = []
        for y0 in range(R, 512 - R - bs + 1, bs):
            for x0 in range(R, 512 - R - bs + 1, bs):
                v = [a[(y0 + j) * 512 + x0 + i] for j in range(bs) for i in range(bs)]
                m = sum(v) / len(v)
                cands.append((sum((q - m) ** 2 for q in v), x0, y0))
        cands.sort(reverse=True)
        sh = []
        for _, x0, y0 in cands[:nblocks]:
            T = [a[(y0 + j) * 512 + x0 : (y0 + j) * 512 + x0 + bs] for j in range(bs)]
            best = None
            for dy in range(-R, R + 1):
                for dx in range(-R, R + 1):
                    s = 0.0
                    for j in range(bs):
                        o = (y0 + dy + j) * 512 + x0 + dx
                        d = list(map(sub, T[j], b[o : o + bs]))
                        s += sum(map(mul, d, d))
                        if best is not None and s >= best[0]:
                            break
                    if best is None or s < best[0]:
                        best = (s, dx, dy)
            sh.append(math.hypot(best[1], best[2]))
        per_pair.append(median(sh))
    return {"pairs": len(per_pair), "median": round(median(per_pair), 3), "p90": round(quantile(per_pair, 0.9), 3), "max": round(max(per_pair), 3)}


# ---------------------------------------------------------------------------
# (6b) cross-section tracking: xtrack.py
# ---------------------------------------------------------------------------


def track_line(frames, x, y, dx, dy, half=40, search=14):
    """xtrack.py: vessel centre along a fixed scan line (darkest local minimum of the 1-px smoothed
    profile whose depth vs 8-14 px either side is >= 40% of the first frame's, nearest the predicted
    position = previous + half the previous velocity; parabolic sub-pixel)."""
    L = math.hypot(dx, dy)
    dx /= L
    dy /= L
    offs = [o * 0.5 for o in range(-2 * half, 2 * half + 1)]
    out = []
    pos = 0.0
    vel = 0.0
    d0 = None
    for img in frames:
        prof = [imlib.bil(img, x + dx * o, y + dy * o) for o in offs]
        if any(v != v for v in prof):
            out.append((None, None))
            continue
        sm = [sum(prof[max(0, i - 2) : i + 3]) / len(prof[max(0, i - 2) : i + 3]) for i in range(len(prof))]

        def depth(i):
            lft = sm[max(0, i - 28) : max(1, i - 16)]
            rgt = sm[i + 16 : i + 28]
            if not lft or not rgt:
                return -1
            return 0.5 * (sum(lft) / len(lft) + sum(rgt) / len(rgt)) - sm[i]

        mins = [i for i in range(3, len(sm) - 3) if sm[i] <= sm[i - 1] and sm[i] <= sm[i + 1] and sm[i] <= sm[i - 3] and sm[i] <= sm[i + 3]]
        pred = pos + 0.5 * vel
        if d0 is None:
            mins = [i for i in mins if abs(offs[i]) <= 4]
            if not mins:
                return None
            i = min(mins, key=lambda k: sm[k])
            d0 = depth(i)
        else:
            good = [i for i in mins if depth(i) >= 0.4 * d0 and abs(offs[i] - pred) <= search]
            if not good:
                out.append((None, None))
                continue
            i = min(good, key=lambda k: abs(offs[k] - pred))
        a, b, c = sm[i - 1], sm[i], sm[i + 1]
        den = a - 2 * b + c
        sb = 0.5 * (a - c) / den if den else 0
        newpos = offs[i] + sb * 0.5
        vel = newpos - pos if out else 0.0
        pos = newpos
        out.append((round(pos, 2), round(depth(i), 1)))
    return out


def track_stats(frames, k0, x, y, dx, dy, search=14):
    """Track forward and backward from frame index k0; range, step median / p90 / max (px per frame)."""
    t1 = track_line(frames[k0:], x, y, dx, dy, search=search)
    t0 = track_line(frames[: k0 + 1][::-1], x, y, dx, dy, search=search)
    if t1 is None or t0 is None:
        return None
    t = t0[::-1][:-1] + t1
    p = [a for a, _ in t if a is not None]
    if len(p) < 4:
        return None
    d = sorted(abs(b - a) for a, b in zip(p, p[1:]))
    return {
        "frames": len(p),
        "range_px": round(max(p) - min(p), 2),
        "step_median": round(d[len(d) // 2], 3),
        "step_p90": round(d[int(0.9 * (len(d) - 1))], 3),
        "step_max": round(d[-1], 3),
        "lost": sum(1 for a, _ in t if a is None),
        "pos": p,
    }


# ---------------------------------------------------------------------------
# (3)/(4) cross-section profiles: vessel.py and cath.py
# ---------------------------------------------------------------------------


def _smooth(vals, k):
    out = []
    n = len(vals)
    for i in range(n):
        a = max(0, i - k)
        b = min(n, i + k + 1)
        out.append(sum(vals[a:b]) / (b - a))
    return out


def _width_at(off, vals, ci, level):
    L = R = None
    for i in range(ci, 0, -1):
        if vals[i - 1] >= level > vals[i] or vals[i - 1] >= level >= vals[i] and vals[i - 1] != vals[i]:
            L = off[i - 1] + (level - vals[i - 1]) / (vals[i] - vals[i - 1]) * (off[i] - off[i - 1])
            break
    for i in range(ci, len(vals) - 1):
        if vals[i + 1] >= level > vals[i] or vals[i + 1] >= level >= vals[i] and vals[i + 1] != vals[i]:
            R = off[i] + (level - vals[i]) / (vals[i + 1] - vals[i]) * (off[i + 1] - off[i])
            break
    if L is None or R is None:
        return None, None, None
    return R - L, L, R


def measure_profile(off, raw):
    """vessel.py profile measures: bg = mean of both sides 11-17 px from the darkest point within +-4 px;
    depth, FWHM, w80/w20 (ellipse chord 0.61, parabola 0.50, Gaussian 0.37), 10-90% edge distance and
    the bright rim (halo) 1-6 px outside the FWHM edges."""
    sm = _smooth(raw, 2)
    cand = [i for i, o in enumerate(off) if abs(o) <= 4]
    ci = min(cand, key=lambda i: sm[i])
    left = [v for o, v in zip(off, sm) if -17 <= o - off[ci] <= -11]
    right = [v for o, v in zip(off, sm) if 11 <= o - off[ci] <= 17]
    if len(left) + len(right) < 8 or not left or not right:
        return None
    bl = sum(left) / len(left)
    br = sum(right) / len(right)
    bg = 0.5 * (bl + br)
    depth = bg - sm[ci]
    if depth <= 0:
        return None
    fw, L, R = _width_at(off, sm, ci, bg - 0.5 * depth)
    w80, _, _ = _width_at(off, sm, ci, bg - 0.8 * depth)
    w20, _, _ = _width_at(off, sm, ci, bg - 0.2 * depth)
    w10, L10, R10 = _width_at(off, sm, ci, bg - 0.1 * depth)
    w90, L90, R90 = _width_at(off, sm, ci, bg - 0.9 * depth)
    if None in (fw, w80, w20, w10, w90):
        return None
    hl = [v for o, v in zip(off, sm) if L - 6 <= o <= L - 1]
    hr = [v for o, v in zip(off, sm) if R + 1 <= o <= R + 6]
    halo = 0.5 * ((max(hl) - bl) + (max(hr) - br)) if hl and hr else None
    return {"bg": bg, "depth": depth, "fwhm": fw, "w80_w20": w80 / w20 if w20 else None, "edge10_90": 0.5 * ((L90 - L10) + (R10 - R90)), "halo": halo, "centre": off[ci]}


def walk(img, pts, half=18, step=0.25, every=1.5, notrack=False):
    """vessel.py: walk a polyline every 1.5 px, profile along the local normal, re-centre on the darkest
    point (track clamped to +-6 px), re-sample centred."""
    profs = []
    track = 0.0
    off = None
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 1e-6:
            continue
        tx, ty = (x1 - x0) / L, (y1 - y0) / L
        nx, ny = -ty, tx
        s = 0.0
        while s < L:
            cx, cy = x0 + tx * s, y0 + ty * s
            pr = imlib.profile(img, cx + nx * track, cy + ny * track, nx, ny, half=half, step=step)
            off = [o for o, _ in pr]
            raw = [v for _, v in pr]
            if all(v == v for v in raw):
                m = measure_profile(off, raw)
                if m and notrack:
                    m["raw"] = raw
                    profs.append(m)
                elif m:
                    track = max(-6, min(6, track + m["centre"]))
                    pr2 = imlib.profile(img, cx + nx * track, cy + ny * track, nx, ny, half=half, step=step)
                    raw2 = [v for _, v in pr2]
                    if all(v == v for v in raw2):
                        m2 = measure_profile(off, raw2)
                        if m2:
                            m2["raw"] = raw2
                            profs.append(m2)
            s += every
    return profs, off


def vessel_profiles(frames, pts, notrack=False, half=18):
    """Medians over all profiles of all frames for one polyline (vessel.py job)."""
    allp = []
    off = None
    for img in frames:
        p, o = walk(img, pts, half=half, notrack=notrack)
        if o is not None:
            off = o
        allp.extend(p)
    if not allp:
        return None
    q = lambda k, f: quantile([p[k] for p in allp if p[k] is not None], f)
    return {
        "n": len(allp),
        "fwhm_px": round(imlib.lower_median([p["fwhm"] for p in allp]), 3),
        "fwhm_iqr": [round(q("fwhm", 0.25), 2), round(q("fwhm", 0.75), 2)],
        "depth": round(imlib.lower_median([p["depth"] for p in allp]), 2),
        "bg": round(imlib.lower_median([p["bg"] for p in allp]), 1),
        "w80_w20": round(imlib.lower_median([p["w80_w20"] for p in allp if p["w80_w20"] is not None]), 3),
        "edge10_90_px": round(imlib.lower_median([p["edge10_90"] for p in allp]), 3),
        "halo": round(imlib.lower_median([p["halo"] for p in allp if p["halo"] is not None]) or 0.0, 2),
    }


def catheter_profile(frames, pts, half=16):
    """cath.py: profiles along the normal every 1 px, aligned on the darkness centroid (weights
    max(0, bg - I) within +-8 px, bg = mean at 10-14 px), averaged. Outer FWHM, wall separation (two
    deepest minima within +-5 px) and the lumen contrast (central maximum above the wall minima)."""
    acc = None
    n = 0
    for img in frames:
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            if L < 1e-6:
                continue
            tx, ty = (x1 - x0) / L, (y1 - y0) / L
            nx, ny = -ty, tx
            s = 0.0
            while s < L:
                cx, cy = x0 + tx * s, y0 + ty * s
                pr = imlib.profile(img, cx, cy, nx, ny, half=half, step=0.25)
                s += 1.0
                if any(v != v for _, v in pr):
                    continue
                side = [v for o, v in pr if 10 <= abs(o) <= 14]
                bg = sum(side) / len(side)
                w = [(o, max(0.0, bg - v)) for o, v in pr if abs(o) <= 8]
                sw = sum(x for _, x in w)
                if sw <= 0:
                    continue
                c = sum(o * x for o, x in w) / sw
                pr2 = imlib.profile(img, cx + nx * c, cy + ny * c, nx, ny, half=half - 4, step=0.25)
                if any(v != v for _, v in pr2):
                    continue
                if acc is None:
                    acc = [[o, 0.0] for o, _ in pr2]
                for i, (o, v) in enumerate(pr2):
                    acc[i][1] += v
                n += 1
    if not n:
        return None
    prof = [(o, v / n) for o, v in acc]
    side = [v for o, v in prof if 9 <= abs(o) <= 12]
    bg = sum(side) / len(side)
    mn = min(v for o, v in prof)
    half_l = bg - 0.5 * (bg - mn)
    left = [o for (o, v), (o2, v2) in zip(prof, prof[1:]) if o < 0 and v >= half_l > v2]
    right = [o2 for (o, v), (o2, v2) in zip(prof, prof[1:]) if o2 > 0 and v < half_l <= v2]
    fw = (right[-1] - left[0]) if left and right else None
    inner = [(o, v) for o, v in prof if abs(o) <= 5]
    mins = [(o, v) for i, (o, v) in enumerate(inner[1:-1], 1) if v <= inner[i - 1][1] and v <= inner[i + 1][1]]
    mins = sorted(mins, key=lambda q: q[1])[:2]
    sep = abs(mins[0][0] - mins[1][0]) if len(mins) == 2 else None
    lumen = None
    if len(mins) == 2 and sep and sep > 1:
        a, b = sorted([mins[0][0], mins[1][0]])
        mid = max(v for o, v in prof if a <= o <= b)
        lumen = mid - 0.5 * (mins[0][1] + mins[1][1])
    return {"n": n, "bg": round(bg, 1), "depth": round(bg - mn, 2), "outer_fwhm_px": round(fw, 2) if fw else None, "wall_sep_px": sep, "lumen_contrast": round(lumen, 2) if lumen is not None else 0.0}


# ---------------------------------------------------------------------------
# (2) large-border halo: edge2.py (hand-drawn border) and an automatic variant
# ---------------------------------------------------------------------------


def describe_edge(prof):
    """edge.py describe(): plateaus 25-40 px either side (bright side at negative offsets), overshoot on
    the bright side and undershoot on the dark side within 25 px, their peak positions and extents,
    10-90% rise."""
    br = [v for o, v in prof if -40 <= o <= -25]
    dk = [v for o, v in prof if 25 <= o <= 40]
    A = sorted(br)[len(br) // 2]
    Bk = sorted(dk)[len(dk) // 2]
    step = A - Bk
    nearb = [(o, v) for o, v in prof if -25 <= o <= -0.5]
    neard = [(o, v) for o, v in prof if 0.5 <= o <= 25]
    ob = max(nearb, key=lambda q: q[1])
    ud = min(neard, key=lambda q: q[1])
    over = ob[1] - A
    under = Bk - ud[1]

    def back(points, peak, base, height):
        cand = [o for o, v in points if (abs(o) > abs(peak[0])) and abs(v - base) <= 0.25 * abs(height)]
        return min((abs(o) for o in cand), default=None)

    lo_lvl = Bk + 0.1 * step
    hi_lvl = Bk + 0.9 * step
    x90 = x10 = None
    for (o1, v1), (o2, v2) in zip(prof, prof[1:]):
        if -15 <= o1 <= 15:
            if x90 is None and (v1 - hi_lvl) * (v2 - hi_lvl) <= 0 and v1 != v2:
                x90 = o1 + (hi_lvl - v1) / (v2 - v1) * (o2 - o1)
            if (v1 - lo_lvl) * (v2 - lo_lvl) <= 0 and v1 != v2:
                x10 = o1 + (lo_lvl - v1) / (v2 - v1) * (o2 - o1)
    # drop over the near-edge 6 px on the dark side from the bright-side peak (the audit's "then drops 20-26 levels over about 6 px")
    at6 = [v for o, v in prof if 5.5 <= o <= 6.5]
    return {
        "bright_plateau": round(A, 2),
        "dark_plateau": round(Bk, 2),
        "step": round(step, 2),
        "overshoot": round(over, 2),
        "overshoot_rel_step": round(over / step, 4) if step else None,
        "overshoot_peak_px": round(-ob[0], 2),
        "overshoot_extent_px": back(nearb, ob, A, over),
        "undershoot": round(under, 2),
        "undershoot_peak_px": round(ud[0], 2),
        "drop_peak_to_6px": round(ob[1] - sum(at6) / len(at6), 2) if at6 else None,
        "rise_10_90_px": round(abs(x10 - x90), 2) if (x10 is not None and x90 is not None) else None,
    }


def edge_polyline(frames, poly, half=40):
    """edge2.py: every 2 px along the polyline, locate the maximum 6-px difference along the normal within
    +-14 px; offsets smoothed along the border (running median 7, then mean 9); profiles +-40 px at
    0.25 px centred on the smoothed border with the bright side at negative offsets; averaged."""
    acc = None
    cnt = 0
    for img in frames:
        samples = []
        for (x0, y0), (x1, y1) in zip(poly, poly[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            tx, ty = (x1 - x0) / L, (y1 - y0) / L
            nx, ny = -ty, tx
            s = 0.0
            while s < L:
                cx, cy = x0 + tx * s, y0 + ty * s
                best = None
                for k in range(-56, 57):
                    o = k * 0.25
                    d = imlib.bil(img, cx + nx * (o - 3), cy + ny * (o - 3)) - imlib.bil(img, cx + nx * (o + 3), cy + ny * (o + 3))
                    if d != d:
                        continue
                    if best is None or abs(d) > abs(best[1]):
                        best = (o, d)
                if best:
                    samples.append([cx, cy, nx, ny, best[0], best[1]])
                s += 2.0
        if len(samples) < 9:
            continue
        offs = [p[4] for p in samples]
        med = []
        for i in range(len(offs)):
            w = sorted(offs[max(0, i - 3) : i + 4])
            med.append(w[len(w) // 2])
        sm = []
        for i in range(len(med)):
            w = med[max(0, i - 4) : i + 5]
            sm.append(sum(w) / len(w))
        sign = 1 if sum(p[5] for p in samples) > 0 else -1
        for p, o in zip(samples, sm):
            cx, cy, nx, ny = p[0] + p[2] * o, p[1] + p[3] * o, p[2] * sign, p[3] * sign
            pr = imlib.profile(img, cx, cy, nx, ny, half=half, step=0.25)
            if any(v != v for _, v in pr):
                continue
            if acc is None:
                acc = [[q, 0.0] for q, _ in pr]
            for i, (q, v) in enumerate(pr):
                acc[i][1] += v
            cnt += 1
    if not cnt:
        return None
    prof = [(q, v / cnt) for q, v in acc]
    d = describe_edge(prof)
    d["n_profiles"] = cnt
    d["profile"] = [[q, round(v, 2)] for q, v in prof if abs(q - round(q)) < 1e-6 and abs(q) <= 30]
    return d


def edge_auto(img, top=0.03, min_step=20.0, spacing=8, half=40):
    """Automatic large-border halo (S0, no hand-drawn polylines; method parameters chosen by S0). The
    large-scale gradient g = M(p + 8 n) - M(p - 8 n) with M = 9 x 9 box mean is evaluated on an 8-px
    grid; candidates are the top 3% by |g| with |g| >= 20 grey levels whose gradient direction agrees
    (cosine > 0.8, magnitude > 0.5 |g|) at +-10 px along the border. Each candidate is re-located on the
    maximum 6-px difference within +-10 px along the normal; profiles (+-40 px, 0.25 px, bright side
    negative) are averaged and described as in edge.py. Run on pre-contrast frames."""
    M = box_mean(img, 4)

    def g(x, y):
        gx = imlib.bil(M, x + 8, y) - imlib.bil(M, x - 8, y)
        gy = imlib.bil(M, x, y + 8) - imlib.bil(M, x, y - 8)
        return gx, gy

    pts = []
    for y in range(56, 512 - 56, spacing):
        for x in range(56, 512 - 56, spacing):
            gx, gy = g(x, y)
            pts.append((math.hypot(gx, gy), x, y, gx, gy))
    pts.sort(reverse=True)
    keep = []
    for mag, x, y, gx, gy in pts[: max(10, int(top * len(pts)))]:
        if mag < min_step:
            break
        nx, ny = gx / mag, gy / mag
        tx, ty = -ny, nx
        ok = True
        for s in (-10, 10):
            hx, hy = g(x + tx * s, y + ty * s)
            hm = math.hypot(hx, hy)
            if hm < 0.5 * mag or (hx * nx + hy * ny) / (hm or 1) < 0.8:
                ok = False
                break
        if ok:
            keep.append((x, y, nx, ny))
    if len(keep) < 5:
        return None
    acc = None
    cnt = 0
    for x, y, nx, ny in keep:
        # gradient points from dark to bright; put the bright side at negative offsets: walk along -n
        ux, uy = -nx, -ny
        best = None
        for k in range(-40, 41):
            o = k * 0.25
            d = imlib.bil(img, x + ux * (o - 3), y + uy * (o - 3)) - imlib.bil(img, x + ux * (o + 3), y + uy * (o + 3))
            if d == d and (best is None or d > best[1]):
                best = (o, d)
        if not best:
            continue
        cx, cy = x + ux * best[0], y + uy * best[0]
        pr = imlib.profile(img, cx, cy, ux, uy, half=half, step=0.25)
        if any(v != v for _, v in pr):
            continue
        if acc is None:
            acc = [[q, 0.0] for q, _ in pr]
        for i, (q, v) in enumerate(pr):
            acc[i][1] += v
        cnt += 1
    if cnt < 5:
        return None
    prof = [(q, v / cnt) for q, v in acc]
    d = describe_edge(prof)
    d["n_profiles"] = cnt
    return d
