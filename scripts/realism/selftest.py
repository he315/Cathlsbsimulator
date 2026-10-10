"""
Self-test of the realism metrics on synthetic images with known answers (Python stdlib; about 20 s).

  python3 scripts/realism/selftest.py

Checks: noise SD and autocorrelation of white and of 2-tap-filtered noise, temporal correlation of an
AR(1) noise sequence, vessel profile width/depth/shape of a Gaussian line, catheter tram-track of a hollow
tube, timing features of a known curve, cross-section tracking of a moving line, field-box detection,
resampling identity, and the capture metadata PNG round trip.
"""

import array
import math
import os
import random
import sys
import tempfile

import imlib
import metrics
import sources

FAIL = []


def check(name, value, lo, hi):
    ok = value is not None and lo <= value <= hi
    print(f"  {'ok  ' if ok else 'FAIL'} {name}: {value if value is None else round(value, 4)} (expected {lo} to {hi})")
    if not ok:
        FAIL.append(name)


def flat(v=128.0):
    return array.array("d", [v]) * (512 * 512)


def main():
    rnd = random.Random(1)
    print("noise")
    sd = 3.0
    base = array.array("d", [100 + 60 * (x / 511) for y in range(512) for x in range(512)])
    frames = [array.array("d", [b + rnd.gauss(0, sd) for b in base]) for _ in range(38)]
    r = metrics.noise(frames)
    check("white noise sigma_t", r["sigma_t_median"], 2.85, 3.15)
    check("white noise lag-1", r["acf_lag1"], -0.05, 0.05)
    check("white noise temporal rho", r["rho_temporal"], -0.1, 0.1)
    # horizontal 2-tap average: lag-1 correlation 0.5 horizontally, 0 vertically
    fr2 = []
    for _ in range(38):
        w = [rnd.gauss(0, sd) for _ in range(512 * 512 + 1)]
        fr2.append(array.array("d", [b + 0.5 * (w[i] + w[i + 1]) * math.sqrt(2) for i, b in enumerate(base)]))
    r2 = metrics.noise(fr2)
    check("2-tap noise horizontal lag-1", r2["acf_h"][0], 0.44, 0.56)
    check("2-tap noise vertical lag-1", r2["acf_v"][0], -0.06, 0.06)
    # AR(1) in time with rho = 0.5
    prev = [rnd.gauss(0, sd) for _ in range(512 * 512)]
    fr3 = []
    for _ in range(38):
        prev = [0.5 * p + math.sqrt(1 - 0.25) * rnd.gauss(0, sd) for p in prev]
        fr3.append(array.array("d", [b + p for b, p in zip(base, prev)]))
    check("AR(1) temporal rho (true 0.5)", metrics.noise(fr3)["rho_temporal"], 0.42, 0.58)

    print("vessel profile")
    s = 4.0 / 2.3548  # FWHM 4 px
    img = array.array("d", [150 - 50 * math.exp(-((x - 256.3) ** 2) / (2 * s * s)) for y in range(512) for x in range(512)])
    v = metrics.vessel_profiles([img], [[256.3, 150], [256.3, 350]])
    check("Gaussian line FWHM (4 px)", v["fwhm_px"], 3.8, 4.25)
    # vessel.py smooths each profile over 1.25 px (5 samples at 0.25 px) before measuring: a FWHM-4 Gaussian
    # loses a few percent of its depth and gains a little width
    check("Gaussian line depth (50, minus smoothing)", v["depth"], 46.5, 50.5)
    check("Gaussian line w80/w20 (0.372)", v["w80_w20"], 0.34, 0.40)

    print("catheter tram-track")
    # hollow tube, outer radius 3.6 px, inner 2.0 px: wall path length 2(sqrt(R^2-d^2) - sqrt(r^2-d^2)),
    # 8 grey levels per px of wall, blurred with a Gaussian of sigma 0.7 px
    R_, r_ = 3.6, 2.0

    def L(d):
        d = abs(d)
        if d >= R_:
            return 0.0
        return 2 * (math.sqrt(R_ * R_ - d * d) - (math.sqrt(r_ * r_ - d * d) if d < r_ else 0.0))

    xs = [i * 0.05 for i in range(-200, 201)]
    prof = {}
    for x in range(180, 221):
        acc = 0.0
        wsum = 0.0
        for u in xs:
            w = math.exp(-((x - 200.0 - u) ** 2) / (2 * 0.7 * 0.7))
            acc += w * L(u)
            wsum += w
        prof[x] = 160 - 8 * acc / wsum
    imgc = array.array("d", [prof.get(x, 160.0) for y in range(512) for x in range(512)])
    c = metrics.catheter_profile([imgc], [[200, 100], [200, 300]])
    check("hollow tube wall separation (about 2 x inner radius = 4 px)", c["wall_sep_px"], 3.4, 4.6)
    check("hollow tube lumen contrast (wall minus centre path, blurred)", c["lumen_contrast"], 6, 22)
    check("hollow tube outer FWHM (about 6.5 px)", c["outer_fwhm_px"], 5.5, 7.5)

    print("timing")
    S = [100] * 5 + [100 + 900 * min(1, (k / 20)) for k in range(1, 30)] + [1000 - 30 * k for k in range(15)]
    t = metrics.timing_features(S, 15)
    check("f10 frame", t["f10"], 6, 7)
    check("f90 frame", t["f90"], 22, 23)
    check("end_rel", t["end_rel"], 0.45, 0.6)

    print("cross-section tracking")
    seq = []
    for k in range(30):
        x0 = 256 + 10 * math.sin(2 * math.pi * k / 15)
        seq.append(array.array("d", [150 - 60 * math.exp(-((x - x0) ** 2) / 8) for y in range(512) for x in range(512)]))
    tr = metrics.track_stats(seq, 0, 256, 256, 1, 0)
    check("tracked range (true 20 px)", tr["range_px"], 19, 21)
    check("tracked largest step (true 4.16 px)", tr["step_max"], 3.8, 4.5)

    print("field box and resampling")
    w = 768
    img = array.array("d", [0.0 if (x < 6 or x >= 762 or y < 6 or y >= 762) else 140.0 for y in range(w) for x in range(w)])
    box = metrics.field_box(img, w, w)
    check("field box left edge (6)", box[0], 6, 6)
    check("field box right edge (762)", box[2], 762, 762)
    ident = imlib.resample512(base, 512, 512)
    check("resample512 of a 512 image: max abs change", max(abs(a - b) for a, b in zip(ident, base)), 0, 0.2)

    print("centre-line geometry (geometry.py ports)")
    import geometry

    straight = [(x, 100.0) for x in range(0, 400)]
    b0 = geometry.tangent_bands(straight, 0.5)
    check("straight line: 8-20 mm band RMS (deg)", b0["b8_20"], 0, 1e-6)
    # sinusoid of wavelength 12 mm and amplitude 0.5 mm: tangent amplitude atan(2 pi A / L) = 14.7 deg,
    # RMS 10.4 deg, carried mostly by the 8-20 mm band and little by the 20-60 mm band
    wav = [(x * 0.1, 0.5 * math.sin(2 * math.pi * x * 0.1 / 12)) for x in range(0, 2000)]
    bw = geometry.tangent_bands(wav, 1.0)
    check("12-mm sinusoid: 8-20 mm band carries it (deg)", bw["b8_20"], 4, 11)
    check("12-mm sinusoid: 20-60 mm band small (deg)", bw["b20_60"], 0, 2)
    sm = geometry.shape_metrics(straight, 0.5)
    check("straight 399 px at 0.5 mm/px: length (mm)", sm["length_mm"], 198, 200)
    check("track P10-P90 of a 10-px oscillation", geometry.p10p90_major([(5 * math.sin(k / 3), 2.0) for k in range(60)]), 8, 10.1)
    print("contrast arrival")
    S = [10, 10, 10, 12, 20, 40, 60, 80, 100, 100, 90, 70, 60, 55, 50]
    a = metrics.arrival_features(S, 15)
    check("arrival frame at 30% of the rise (frame 5)", a["arrival30"], 5, 5)
    check("still >= 50% over the last 3 frames (55 >= 55)", a["end3_ge50"], 1, 1)

    print("metadata PNG")
    import json

    obj = {"spec": {"set": "x"}, "annotations": [{"k": 0, "vessels": []}], "text": "ü"}
    body = json.dumps(obj).encode()
    head = b"XCMETA1\n" + str(len(body)).zfill(8).encode()
    data = head + body
    W = 1024
    Hh = -(-len(data) // W)
    with tempfile.TemporaryDirectory(dir=imlib.CACHE) as td:
        p = os.path.join(td, "m.meta.png")
        imlib.write_png_gray(p, W, Hh, data + bytes(W * Hh - len(data)))
        back = sources.read_meta_png(p)
    check("metadata round trip", 1.0 if back == obj else 0.0, 1, 1)

    print(f"\n{'all checks passed' if not FAIL else 'FAILED: ' + ', '.join(FAIL)}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
