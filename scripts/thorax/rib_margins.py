"""
Rib-margin and vertebral-endplate depth, width and shape in a capture or real frame (S4 checks of
the plan's rib-margin and endplate targets).

Method: in a vertical band of columns over aerated lung (x0..x1 at 512 px), average the columns
(ribs run roughly horizontally there in RAO caudal / AP views) after shifting each column by the
local rib slope estimated by cross-correlation with the band centre, then find local minima of the
averaged vertical profile; depth = mean of the maxima within +-8 px minus the minimum, FWHM from
the half-depth crossings (linear interpolation), and the shape index w80/w20 (width at 80 % of the
depth over width at 20 %, as vessel.py). Reports minima deeper than 4 grey levels.
Usage: python3 rib_margins.py <png> x0 x1 [y0 y1]
"""
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "docs", "realism", "research"))
import texture  # noqa: E402


def main():
    p = sys.argv[1]
    x0, x1 = int(sys.argv[2]), int(sys.argv[3])
    y0 = int(sys.argv[4]) if len(sys.argv) > 4 else 20
    y1 = int(sys.argv[5]) if len(sys.argv) > 5 else 492
    if p.endswith(".jpg"):
        import imlib
        img = imlib.load_jpg(p)
    else:
        img, _ = texture.load_any(f"png:{p}:0")
    xc = (x0 + x1) // 2
    ref = [img[y * 512 + xc] for y in range(512)]
    prof = [0.0] * 512
    cnt = [0] * 512
    for x in range(x0, x1):
        col = [img[y * 512 + x] for y in range(512)]
        best, bs = -1e18, 0
        for s in range(-12, 13):
            acc = 0.0
            for y in range(y0 + 12, y1 - 12):
                acc += (col[y + s] - 128) * (ref[y] - 128)
            if acc > best:
                best, bs = acc, s
        for y in range(y0 + 12, y1 - 12):
            prof[y] += col[y + bs]
            cnt[y] += 1
    pr = [prof[y] / cnt[y] if cnt[y] else None for y in range(512)]
    out = []
    for y in range(y0 + 20, y1 - 20):
        v = pr[y]
        if v is None or any(pr[y + k] is None for k in range(-8, 9)):
            continue
        if not all(v <= pr[y + k] for k in range(-3, 4) if k):
            continue
        m = (max(pr[y - 8 : y - 1]) + max(pr[y + 2 : y + 9])) / 2
        d = m - v
        if d < 4:
            continue
        half = v + d / 2
        def cross(step):
            k = y
            while abs(k - y) < 12 and pr[k + step] is not None and pr[k + step] < half:
                k += step
            a, b = pr[k], pr[k + step]
            if a is None or b is None:
                return float(k)
            return k + step * ((half - a) / (b - a) if b != a else 0)
        fw = cross(1) - cross(-1)
        def width(frac):
            lev = v + d * (1 - frac)
            def cr(step):
                k = y
                while abs(k - y) < 12 and pr[k + step] is not None and pr[k + step] < lev:
                    k += step
                a, b = pr[k], pr[k + step]
                if a is None or b is None:
                    return float(k)
                return k + step * ((lev - a) / (b - a) if b != a else 0)
            return cr(1) - cr(-1)
        w80, w20 = width(0.8), width(0.2)
        out.append((y, round(d, 1), round(fw, 2), round(w80 / w20, 2) if w20 > 0 else float("nan")))
    for o in out:
        print("y %d depth %.1f fwhm %.2f w80/w20 %.2f" % o)


main()
