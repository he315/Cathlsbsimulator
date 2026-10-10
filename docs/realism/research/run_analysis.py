"""Per-run measurements on real cine runs (CoronaryDominance library, Philips, 15 frames/s).

For each run (frames decoded with JPEG draft scaling, Pillow):
  vessel signal v(t): local "black top-hat" at 256 px: blur(F, r=6) - blur(F, r=1), fraction of
      central-crop pixels (32..224) darker than their surroundings by > 22 grey levels.
      Thin dark structures (contrast-filled vessels, catheter, wire) raise it; slow global brightness
      changes and large-scale motion barely affect it.
  global motion: blurred 128 px frames (Gaussian r=3), consecutive-pair SAD block matching on the
      central crop (20..108) over +-8 px, every 2nd frame, summed into a trajectory (x(t), y(t)).
Writes one JSON object per run.
"""
import json, os, sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

LIB, OUT = sys.argv[1], sys.argv[2]
T = 22


def load(path, S):
    im = Image.open(path)
    im.draft("L", (S, S))
    im = im.convert("L")
    if im.size != (S, S):
        im = im.resize((S, S), Image.BILINEAR)
    return im


def vessel_frac(f256):
    d = ImageChops.subtract(f256.filter(ImageFilter.GaussianBlur(6)), f256.filter(ImageFilter.GaussianBlur(1))).crop((32, 32, 224, 224))
    h = d.histogram()
    return sum(h[T + 1 :]) / sum(h)


C0, C1 = 20, 108


def pair_shift(a, b, R=8):
    ac = a.crop((C0, C0, C1, C1))
    best = (1e9, 0, 0)
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            m = ImageStat.Stat(ImageChops.difference(ac, b.crop((C0 + dx, C0 + dy, C1 + dx, C1 + dy)))).mean[0]
            if m < best[0]:
                best = (m, dx, dy)
    return best[1], best[2]


idx = json.load(open(os.path.join(LIB, "index.json")))
with open(OUT, "w") as out:
    for p in idx["patients"]:
        for r in p["runs"]:
            d = os.path.join(LIB, r["id"])
            paths = [os.path.join(d, f) for f in r["frames"]]
            if len(paths) < 6:
                continue
            f256 = [load(q, 256) for q in paths]
            v = [round(vessel_frac(f), 4) for f in f256]
            b128 = [f.resize((128, 128), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3)) for f in f256]
            traj = [(0, 0, 0)]
            x = y = 0
            for i in range(2, len(b128), 2):
                dx, dy = pair_shift(b128[i - 2], b128[i])
                x += dx
                y += dy
                traj.append((i, x, y))
            out.write(json.dumps({"study": p["id"], "dominance": p.get("dominance"), "category": p.get("category"), "id": r["id"], "artery": r["artery"], "n": len(paths), "fps": r["fps"], "angles": r.get("angles"), "tags": r.get("tags"), "v": v, "traj": traj}) + "\n")
            out.flush()
