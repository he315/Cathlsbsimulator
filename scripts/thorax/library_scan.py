"""
S4 library scans on the lossless CoronaryDominance domain-shift set (Philips Azurion, 8-bit
values in npz, 512 px). Python stdlib only; uses docs/realism/research/imlib.py.

  python3 library_scan.py sheets            -> contact sheets of frame 2 of every study's first run
                                               (for finding frames with sternal wires or devices;
                                               written to a scratch folder outside the repository,
                                               $S4_SHEETS or imlib.TMP/s4_sheets)
  python3 library_scan.py grey              -> per-patient pre-contrast median grey (frame 2 of the
                                               first run, central 80 %), spread across patients
  python3 library_scan.py wires <run|capture.png> <x0> <y0> <x1> <y1> [frame]
                                            -> darkest line profiles across sternal-wire pixels in a
                                               box: depth (grey levels below the local 15 px median
                                               background) and FWHM (px) of each wire crossing

Only statistics are written into the repository; contact sheets go to the scratch folder.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(PROJ, "docs", "realism", "research"))
import imlib  # noqa: E402
from common import write_png_gray  # noqa: E402

OUT = os.path.join(HERE, "out")
SHEETS = os.environ.get("S4_SHEETS", os.path.join(imlib.TMP, "s4_sheets"))  # scratch, outside the repository


def studies():
    """(patient id, first readable run id) for every study in the domain-shift set, sorted."""
    out = []
    for dom in ("Left_Dominance", "Right_Dominance"):
        base = os.path.join(imlib.DS_ROOT, dom)
        for s in sorted(os.listdir(base)):
            pid = s[5:10]
            for art in ("LCA", "RCA"):
                d = os.path.join(base, s, art)
                if os.path.isdir(d) and any(f.endswith(".npz") for f in os.listdir(d)):
                    # run numbering as npz_path_for_run: files of LCA then RCA sorted by path
                    files = sorted(
                        [(os.path.join(base, s, a, f), a) for a in ("LCA", "RCA") if os.path.isdir(os.path.join(base, s, a)) for f in os.listdir(os.path.join(base, s, a)) if f.endswith(".npz")]
                    )
                    for k, (fp, a) in enumerate(files, 1):
                        try:
                            frame(f"cd-{pid}-{a}-{k}")
                        except Exception:  # a few archives are truncated
                            continue
                        out.append((pid, f"cd-{pid}-{a}-{k}"))
                        break
                    break
    return sorted(set(out))


def frame(run, k=2):
    fr, meta = imlib.load_npz_run(run, frames=[k])
    return fr[0], meta


def sheets():
    os.makedirs(SHEETS, exist_ok=True)
    st = studies()
    T = 170  # thumbnail size (3x downsampling)
    cols, rows = 6, 5
    index = {}
    for sh in range(0, len(st), cols * rows):
        page = st[sh : sh + cols * rows]
        W, H = cols * T, rows * T
        px = bytearray(W * H)
        for n, (pid, run) in enumerate(page):
            img, meta = frame(run)
            ox, oy = (n % cols) * T, (n // cols) * T
            for y in range(T):
                for x in range(T):
                    s = 0.0
                    for dy in range(3):
                        for dx in range(3):
                            s += img[(min(511, y * 3 + dy)) * 512 + min(511, x * 3 + dx)]
                    px[(oy + y) * W + ox + x] = int(max(0, min(255, s / 9)))
            index[f"sheet{sh // (cols * rows):02d}[{n // cols},{n % cols}]"] = run
        write_png_gray(os.path.join(SHEETS, f"sheet{sh // (cols * rows):02d}.png"), W, H, bytes(px))
    json.dump(index, open(os.path.join(SHEETS, "index.json"), "w"), indent=1)
    print(len(st), "studies,", (len(st) + cols * rows - 1) // (cols * rows), "sheets in", SHEETS)


def grey():
    rows = []
    for pid, run in studies():
        img, meta = frame(run)
        c = sorted(img[y * 512 + x] for y in range(51, 461) for x in range(51, 461))
        rows.append({"run": run, "p50": c[len(c) // 2], "p5": c[len(c) // 20], "p95": c[(19 * len(c)) // 20], "lao": meta.get("primary_angle"), "cran": meta.get("secondary_angle")})
    v = sorted(r["p50"] for r in rows)
    n = len(v)
    m = sum(v) / n
    sd = (sum((x - m) ** 2 for x in v) / n) ** 0.5
    res = {"n": n, "median": v[n // 2], "q25": v[n // 4], "q75": v[(3 * n) // 4], "p10": v[n // 10], "p90": v[(9 * n) // 10], "mean": round(m, 2), "sd": round(sd, 2)}
    json.dump({"summary": res, "rows": [{k: r[k] for k in ("p50", "p5", "p95", "lao", "cran")} for r in rows]}, open(os.path.join(OUT, "library_grey.json"), "w"), indent=1)
    print(json.dumps(res))


def load_any(run, k=2):
    """A library run id (lossless npz frame k) or a renderer capture (.png, cropped 4 % and
    resampled to 512 px as texture.py does)."""
    if run.endswith(".png"):
        import texture

        img, _ = texture.load_any(f"png:{run}:0")
        return img
    return frame(run, k)[0]


def wires(run, x0, y0, x1, y1, k=2):
    """Profiles across the darkest wire pixels in a box: for each local minimum at least 12 levels
    below the 15 px median background, depth and FWHM along the direction of steepest curvature
    (horizontal or vertical, whichever is narrower)."""
    img = load_any(run, k)
    g = lambda x, y: img[max(0, min(511, y)) * 512 + max(0, min(511, x))]  # noqa: E731
    found = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            v = g(x, y)
            if v > min(g(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                continue
            best = None
            for dx, dy in ((1, 0), (0, 1), (1, 1), (1, -1)):
                prof = [g(x + dx * t, y + dy * t) for t in range(-15, 16)]
                bg = sorted(prof[:6] + prof[-6:])[6]
                depth = bg - v
                half = bg - depth / 2
                # FWHM by linear interpolation either side of the centre
                def edge(sign):
                    for t in range(1, 15):
                        a, b = prof[15 + sign * (t - 1)], prof[15 + sign * t]
                        if b >= half:
                            return t - 1 + (half - a) / (b - a + 1e-9)
                    return 15

                w = (edge(1) + edge(-1)) * (2 ** 0.5 if dx and dy else 1)
                if best is None or w < best[1]:
                    best = (depth, w)
            if best and best[0] >= 12:
                found.append(best)
    found.sort(key=lambda t: -t[0])
    top = found[: max(1, len(found) // 4)]  # the deepest quarter: wire cores, not their shoulders
    d = sorted(t[0] for t in top)
    w = sorted(t[1] for t in top)
    res = {"run": run, "box": [x0, y0, x1, y1], "n": len(top), "depth_median": d[len(d) // 2], "depth_q25": d[len(d) // 4], "depth_q75": d[(3 * len(d)) // 4], "fwhm_median": round(w[len(w) // 2], 2), "fwhm_q25": round(w[len(w) // 4], 2), "fwhm_q75": round(w[(3 * len(w)) // 4], 2)}
    print(json.dumps(res))
    return res


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "sheets":
        sheets()
    elif cmd == "grey":
        grey()
    elif cmd == "wires":
        a = sys.argv[2:]
        wires(a[0], int(a[1]), int(a[2]), int(a[3]), int(a[4]), int(a[5]) if len(a) > 5 else 2)
