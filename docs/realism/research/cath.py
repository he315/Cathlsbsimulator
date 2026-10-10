"""Catheter (hollow tube) profile: profiles along the normal every 1 px, aligned on the
darkness centroid (weights max(0, bg - I) within +-8 px, bg = mean at 10-14 px), averaged.
Reports the outer FWHM, the wall-to-wall separation (two minima) and the lumen 'tram-track'
contrast (central maximum above the mean of the two wall minima)."""
import json, math, sys, imlib
def measure(frames, pts, half=16):
    acc = None; n = 0
    for img in frames:
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            L = math.hypot(x1 - x0, y1 - y0); tx, ty = (x1 - x0) / L, (y1 - y0) / L; nx, ny = -ty, tx
            s = 0.0
            while s < L:
                cx, cy = x0 + tx * s, y0 + ty * s
                pr = imlib.profile(img, cx, cy, nx, ny, half=half, step=0.25)
                if any(v != v for _, v in pr): s += 1; continue
                bg = sum(v for o, v in pr if 10 <= abs(o) <= 14) / len([1 for o, v in pr if 10 <= abs(o) <= 14])
                w = [(o, max(0.0, bg - v)) for o, v in pr if abs(o) <= 8]
                sw = sum(x for _, x in w)
                if sw <= 0: s += 1; continue
                c = sum(o * x for o, x in w) / sw
                pr2 = imlib.profile(img, cx + nx * c, cy + ny * c, nx, ny, half=half - 4, step=0.25)
                if any(v != v for _, v in pr2): s += 1; continue
                if acc is None: acc = [[o, 0.0] for o, _ in pr2]
                for i, (o, v) in enumerate(pr2): acc[i][1] += v
                n += 1
                s += 1.0
    prof = [(o, v / n) for o, v in acc]
    bg = sum(v for o, v in prof if 9 <= abs(o) <= 12) / len([1 for o, v in prof if 9 <= abs(o) <= 12])
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
    return {"n": n, "bg": round(bg, 1), "depth": round(bg - mn, 1), "outer_fwhm_px": round(fw, 2) if fw else None,
            "wall_sep_px": sep, "lumen_contrast": round(lumen, 1) if lumen is not None else None,
            "profile": [(o, round(v, 1)) for o, v in prof if abs(o * 2 - round(o * 2)) < 1e-6]}
if __name__ == "__main__":
    jobs = json.loads(open(sys.argv[1]).read())
    for j in jobs:
        if j["src"] == "npz":
            fr, _ = imlib.load_npz_run(j["run"], frames=j["frames"])
        else:
            fr = []
            for f in j["files"]:
                w, h, px = imlib.read_png_gray(f); fr.append(imlib.resample512(imlib.to_f(px), w, h))
        r = measure(fr, j["pts"])
        p = r.pop("profile")
        print(j["name"], json.dumps(r))
        print("   ", " ".join(f"{o:g}:{v:.0f}" for o, v in p if abs(o) <= 9))
