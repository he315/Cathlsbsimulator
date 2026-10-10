"""Measure contrast timing and table panning in real cine runs (CoronaryDominance library).

For each run:
  - frames decoded at 128 px (JPEG DCT draft scaling), central crop to avoid collimator edges
  - baseline = per-pixel lightest value across the run (approximates the no-contrast state)
  - darkness(t) = baseline - frame(t); c(t) = fraction of crop pixels darker than baseline by > T
  - c normalised to [0,1]; arrival = first frame with c_norm >= 0.2; peak = argmax;
    plateau = frames with c_norm >= 0.5; washout = first frame after peak with c_norm < 0.5
  - global shift: blurred frame t vs blurred frame 0, SAD search +-14 px (128 px scale)
Outputs one JSON line per run.
"""
import json, os, sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

LIB = sys.argv[1]
OUT = sys.argv[2]
T = int(sys.argv[3]) if len(sys.argv) > 3 else 35
S = 128
C0, C1 = 20, 108  # central crop in 128 px frame


def load(path):
    im = Image.open(path)
    im.draft("L", (S, S))
    im = im.convert("L")
    if im.size != (S, S):
        im = im.resize((S, S), Image.BILINEAR)
    return im


def frac_dark(base, fr):
    d = ImageChops.subtract(base, fr).crop((C0, C0, C1, C1))
    h = d.histogram()
    n = sum(h)
    return sum(h[T + 1 :]) / n


def shift(a, b, R=14):
    # a, b blurred full frames; compare b shifted by (dx,dy) to a on the central crop
    ac = a.crop((C0, C0, C1, C1))
    best = None
    for dy in range(-R, R + 1, 2):
        for dx in range(-R, R + 1, 2):
            bc = b.crop((C0 + dx, C0 + dy, C1 + dx, C1 + dy))
            m = ImageStat.Stat(ImageChops.difference(ac, bc)).mean[0]
            if best is None or m < best[0]:
                best = (m, dx, dy)
    # refine at 1 px
    m0, bx, by = best
    for dy in range(by - 1, by + 2):
        for dx in range(bx - 1, bx + 2):
            bc = b.crop((C0 + dx, C0 + dy, C1 + dx, C1 + dy))
            m = ImageStat.Stat(ImageChops.difference(ac, bc)).mean[0]
            if m < best[0]:
                best = (m, dx, dy)
    return best[1], best[2]


idx = json.load(open(os.path.join(LIB, "index.json")))
with open(OUT, "w") as out:
    for p in idx["patients"]:
        for r in p["runs"]:
            d = os.path.join(LIB, r["id"])
            frames = [load(os.path.join(d, f)) for f in r["frames"]]
            n = len(frames)
            if n < 8:
                continue
            base = frames[0]
            for f in frames[1:]:
                base = ImageChops.lighter(base, f)
            c = [frac_dark(base, f) for f in frames]
            lo, hi = min(c), max(c)
            cn = [(x - lo) / (hi - lo) if hi > lo else 0 for x in c]
            arrival = next((i for i, x in enumerate(cn) if x >= 0.2), None)
            peak = max(range(n), key=lambda i: cn[i])
            above = [i for i, x in enumerate(cn) if x >= 0.5]
            wash = next((i for i in range(peak, n) if cn[i] < 0.5), None)
            # global shifts at a few sample frames relative to frame 0
            bl = [f.filter(ImageFilter.GaussianBlur(3)) for f in frames]
            samp = sorted(set([0, n // 4, n // 2, (3 * n) // 4, n - 1]))
            shifts = [(i,) + shift(bl[0], bl[i]) for i in samp]
            out.write(
                json.dumps(
                    {
                        "id": r["id"],
                        "artery": r["artery"],
                        "n": n,
                        "fps": r["fps"],
                        "angles": r.get("angles"),
                        "c": [round(x, 4) for x in c],
                        "cn0": round(cn[0], 3),
                        "arrival": arrival,
                        "peak": peak,
                        "plateau": len(above),
                        "wash": wash,
                        "range": round(hi - lo, 4),
                        "shifts": shifts,
                    }
                )
                + "\n"
            )
            out.flush()
