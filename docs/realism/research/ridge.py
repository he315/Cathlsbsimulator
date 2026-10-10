"""
(4b) Vessel-tree richness: centreline length of opacified vessels.

Ridge pixel = a pixel that is a strict 1-D minimum across +-2 px horizontally or vertically
(I < both I[x-2], I[x+2], or both I[y-2], I[y+2]) and lies at least 12 grey levels below the
15x15 local mean. Counting ridge pixels approximates centreline length in px (orientation
dependence is the same for every image). Opacified length = ridge count at the peak-opacification
frame minus the median of the pre-contrast frames 1-3. Ridge pixels are also binned by local
depth (12-25, 25-50, >50 grey levels) as a proxy for small / medium / large vessels.
"""

import json
import sys

import imlib


def ridges(img):
    m = imlib.box_mean(img, 7)
    W = 512
    cnt = [0, 0, 0]
    for y in range(2, 510):
        o = y * W
        for x in range(2, 510):
            v = img[o + x]
            d = m[o + x] - v
            if d < 12:
                continue
            if (v < img[o + x - 2] and v < img[o + x + 2]) or (v < img[o + x - 2 * W] and v < img[o + x + 2 * W]):
                cnt[0 if d < 25 else 1 if d < 50 else 2] += 1
    return cnt


if __name__ == "__main__":
    kind = sys.argv[1]
    out = {}
    if kind == "npz":
        d = json.load(open(f"{imlib.SCR}/timing2_npz.json"))
        for rid, v in d.items():
            pk = v["major"]["peak_frame"]
            fr, _ = imlib.load_npz_run(rid, frames=[1, 2, 3, pk])
            base = sorted(sum(ridges(f)) for f in fr[:3])[1]
            r = ridges(fr[3])
            out[rid] = {"label": v["label"], "base": base, "peak": r, "delta": sum(r) - base}
            print(rid, out[rid], flush=True)
    else:
        import noise2
        import timing

        for name in sys.argv[2:]:
            fr, _ = noise2.load_run("cap", name)
            C = [timing.signal(f)[1] for f in fr[1:]]
            pk = 1 + C.index(max(C))
            base = sorted(sum(ridges(f)) for f in (fr[-1], fr[-2], fr[-3]))[1]
            r = ridges(fr[pk])
            out[name] = {"base_end": base, "peak": r, "delta": sum(r) - base, "peak_frame": pk}
            print(name, out[name], flush=True)
    json.dump(out, open(f"{imlib.SCR}/ridge_{kind}.json", "w"), indent=1)
