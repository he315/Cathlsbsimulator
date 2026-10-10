"""
Centre-line geometry and cardiac motion in millimetres: tortuosity band RMS, projected length, tree
extent, landmark displacement and speed. One code path for the real library and for simulator captures.

Real side. The anatomy-motion audit traced and tracked real CoronaryDominance runs with node scripts
(docs/realism/research/anatomy/: trace.mjs, track.mjs, realskel.mjs) and saved the per-run results
next to them. Those result files are the measured input here:

  traces/*.json        Dijkstra centre lines (512-px frame px) on peak-opacification frames, 9 runs
                       (LAD in RAO cranial, RCA in LAO) plus 3 catheter-shaft traces (noise floor)
  motion_trace2.json   NCC landmark tracks on the same 9 runs: P10-P90 displacement per landmark (px)
  tracks/*.json        the per-frame landmark tracks (speeds in px per frame, frame indices)
  realskel.json        vessel-mask p2-p98 extents (px) of 6-14 runs per view

The measures applied to them are ports of the audit's own code: tangent_bands() = spectrum.mjs bands(),
shape_metrics() = shape.mjs shapeMetrics(). px -> mm uses the audit's 6F calibration: median catheter
shaft width 6.5 px over 1,072 runs (cathwidth.mjs), 2.0 mm / 6.5 px = 0.3077 mm/px.

Simulator side. The capture metadata holds the projected centre lines (canvas px) of every frame, and
fine (undecimated) centre lines of the main vessels on two frames; mm uses the metadata's isoMmPerPx
(mm at the iso-centre plane per canvas px), as the audit measured the simulator (simspec.ts, simext.ts).
"""

import json
import math
import os

import imlib

ANAT = os.path.join(imlib.ROOT, "docs", "realism", "research", "anatomy")
SIXF_MM_PER_PX = 2.0 / 6.5  # cathwidth.mjs: median shaft width 6.5 px; 6F = 2.0 mm
SCRIPT = "scripts/realism/geometry.py (ports of docs/realism/research/anatomy/spectrum.mjs and shape.mjs)"


# ---------------------------------------------------------------------------
# centre-line measures (ports)
# ---------------------------------------------------------------------------
def resample_1mm(pts, mm_per_px):
    s = mm_per_px
    P = [(x * s, y * s) for x, y in pts]
    if not P:
        return []
    R = [P[0]]
    acc = 0.0
    for i in range(1, len(P)):
        x0, y0 = P[i - 1]
        x1, y1 = P[i]
        seg = math.hypot(x1 - x0, y1 - y0)
        while acc + seg >= 1:
            t = (1 - acc) / seg
            x0 += (x1 - x0) * t
            y0 += (y1 - y0) * t
            R.append((x0, y0))
            seg = math.hypot(x1 - x0, y1 - y0)
            acc = 0.0
        acc += seg
    return R


def tangent_bands(pts, mm_per_px):
    """spectrum.mjs bands(): RMS (degrees) of difference-of-moving-averages bands of the unwrapped
    tangent angle (2 mm chord) of the 1-mm resampled centre line: about 3-8, 8-20 and 20-60 mm."""
    R = resample_1mm(pts, mm_per_px)
    th = []
    prev = None
    for i in range(1, len(R) - 1):
        a = math.atan2(R[i + 1][1] - R[i - 1][1], R[i + 1][0] - R[i - 1][0])
        if prev is not None:
            while a - prev > math.pi:
                a -= 2 * math.pi
            while a - prev < -math.pi:
                a += 2 * math.pi
        th.append(a)
        prev = a

    def ma(x, w):
        out = []
        for i in range(len(x)):
            s = c = 0
            for k in range(-w, w + 1):
                if 0 <= i + k < len(x):
                    s += x[i + k]
                    c += 1
            out.append(s / c)
        return out

    a1, a4, a10, a30 = ma(th, 1), ma(th, 4), ma(th, 10), ma(th, 30)

    def rms(a, b):
        s = n = 0
        for i in range(30, len(th) - 30):
            s += (a[i] - b[i]) ** 2
            n += 1
        return math.sqrt(s / n) * 180 / math.pi if n else None

    return {"n": len(th), "b3_8": rms(a1, a4), "b8_20": rms(a4, a10), "b20_60": rms(a10, a30)}


def shape_metrics(pts, mm_per_px):
    """shape.mjs shapeMetrics(): 1-mm resampling, two passes of a 3-sample moving average, then arc
    length, chord and arc/chord (the turning-angle statistics of shape.mjs are not used here)."""
    Q = resample_1mm(pts, mm_per_px)
    if len(Q) < 3:
        return None
    for _ in range(2):
        Q = [p if i == 0 or i == len(Q) - 1 else ((Q[i - 1][0] + p[0] + Q[i + 1][0]) / 3, (Q[i - 1][1] + p[1] + Q[i + 1][1]) / 3) for i, p in enumerate(Q)]
    L = sum(math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]) for i in range(1, len(Q)))
    chord = math.hypot(Q[-1][0] - Q[0][0], Q[-1][1] - Q[0][1])
    return {"length_mm": round(L, 1), "chord_mm": round(chord, 1), "arc_chord": round(L / max(1e-6, chord), 3)}


def p10p90_major(track):
    """track.mjs: positions projected on the principal motion axis, P90 - P10 (same units as input)."""
    if len(track) < 4:
        return None
    mx = sum(p[0] for p in track) / len(track)
    my = sum(p[1] for p in track) / len(track)
    sxx = sum((p[0] - mx) ** 2 for p in track)
    syy = sum((p[1] - my) ** 2 for p in track)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in track)
    th = 0.5 * math.atan2(2 * sxy, sxx - syy)
    proj = sorted((p[0] - mx) * math.cos(th) + (p[1] - my) * math.sin(th) for p in track)
    return imlib.quantile(proj, 0.9) - imlib.quantile(proj, 0.1)


# ---------------------------------------------------------------------------
# real-library targets from the anatomy audit's result files
# ---------------------------------------------------------------------------
TRACE_GROUPS = {"LAD_RAOcra": ("LCA", "RAO-CRA", "LM+LAD"), "RCA_LAO": ("RCA", "LAO-0", "RCA")}
SKEL_VIEWS = {"LCA_RAOcau": ("LCA", "RAO-CAU"), "LCA_RAOcra": ("LCA", "RAO-CRA"), "LCA_APcra": ("LCA", "AP-CRA"), "LCA_LAOcau": ("LCA", "LAO-CAU"), "LCA_LAOcra": ("LCA", "LAO-CRA"), "RCA_LAO": ("RCA", "LAO-0"), "RCA_APcra": ("RCA", "AP-CRA")}


def _load(name):
    return imlib.load_json(os.path.join(ANAT, name))


def real_measurements():
    """Per-run (or per-landmark) real values, grouped: {(metric, artery, view): [(source, value)]}.
    Returns (groups, notes). Missing audit files give an empty result (targets are then absent)."""
    groups = {}
    notes = {}

    def put(metric, art, view, src, v):
        if v is not None:
            groups.setdefault((metric, art, view), []).append((src, round(v, 4)))

    tdir = os.path.join(ANAT, "traces")
    floor = []
    if os.path.isdir(tdir):
        for f in sorted(os.listdir(tdir)):
            if not f.endswith(".json"):
                continue
            d = _load(os.path.join("traces", f))
            if not d or not d.get("path"):
                continue
            label = d.get("label", f[:-5])
            b = tangent_bands(d["path"], d.get("mmPerPx", SIXF_MM_PER_PX))
            if label.startswith("CATH"):
                floor.append((label, b))
                continue
            grp = next((g for g in TRACE_GROUPS if label.startswith(g)), None)
            if not grp:
                continue
            art, view, vessel = TRACE_GROUPS[grp]
            run = d.get("run", label)
            for k in ("b3_8", "b8_20", "b20_60"):
                for vv in (view, "any"):
                    put(f"tortuosity.{k}", art, vv, run, b[k])
            sm = shape_metrics(d["path"], d.get("mmPerPx", SIXF_MM_PER_PX))
            if sm and art == "LCA":
                put("shape.length_mm", art, view, run, sm["length_mm"])
                put("shape.arc_chord", art, view, run, sm["arc_chord"])
    notes["catheter_floor"] = {lab: {k: (round(v, 2) if isinstance(v, float) else v) for k, v in b.items()} for lab, b in floor}

    m2 = _load("motion_trace2.json") or {}
    tl = _load("trace_landmarks.json") or {}
    for key, r in m2.items():
        grp = next((g for g in TRACE_GROUPS if key.startswith(g)), None)
        if not grp:
            continue
        art, view, _ = TRACE_GROUPS[grp]
        for lm in r.get("lms", []):
            if lm.get("p1090") is not None:
                for vv in (view, "any"):
                    put("motion_mm.p10p90", art, vv, f"{r.get('run', key)}#{lm['k']}", lm["p1090"] * SIXF_MM_PER_PX)
        # speeds from the per-frame tracks of the same landmarks: consecutive kept frames only
        t = tl.get(key)
        tr = _load(os.path.join("tracks", t["run"].replace("/", "__") + ".json")) if t else None
        for lm in (tr or {}).get("landmarks", []):
            sp = [x for i, x in enumerate(lm.get("speed") or []) if x is not None and lm["f"][i + 1] - lm["f"][i] == 1]
            if len(sp) >= 3:
                s = sorted(sp)
                src = f"{t['run']}#{lm['k']}"
                for vv in (view, "any"):
                    put("motion_mm.speed_median", art, vv, src, imlib.median(s) * SIXF_MM_PER_PX * 15)
                    put("motion_mm.speed_p90", art, vv, src, s[round(0.9 * (len(s) - 1))] * SIXF_MM_PER_PX * 15)

    sk = _load("realskel.json") or {}
    for key, runs in sk.items():
        if key not in SKEL_VIEWS:
            continue
        art, view = SKEL_VIEWS[key]
        for r in runs:
            e = r.get("extPx")
            if e and e[0] > 0:
                put("extent.width_mm", art, view, r["id"], e[0] * SIXF_MM_PER_PX)
                put("extent.height_mm", art, view, r["id"], e[1] * SIXF_MM_PER_PX)
    return groups, notes


METHODS = {
    "tortuosity.b3_8": ("degrees", "RMS of the tangent-angle band (+-1 minus +-4 mm moving averages, about 3-8 mm wavelength) of the centre line resampled at 1 mm (spectrum.mjs port); real: Dijkstra traces on peak-opacification frames (trace.mjs), 6F scale"),
    "tortuosity.b8_20": ("degrees", "as b3_8 with +-4 minus +-10 mm (about 8-20 mm wavelength)"),
    "tortuosity.b20_60": ("degrees", "as b3_8 with +-10 minus +-30 mm (about 20-60 mm wavelength)"),
    "shape.length_mm": ("mm", "projected LM+LAD arc length after 1-mm resampling and two 3-sample smoothing passes (shape.mjs port); real traces in RAO cranial at the 6F scale"),
    "shape.arc_chord": ("ratio", "arc length / chord of the same centre line"),
    "motion_mm.p10p90": ("mm", "per landmark (10-90% along the traced vessel): P90 - P10 of the position on the principal motion axis; real: NCC tracking on vesselness maps (track.mjs), 6F scale"),
    "motion_mm.speed_median": ("mm/s", "per landmark: median frame-to-frame speed between consecutive frames at 15 frames/s (px/frame x 0.3077 mm/px x 15 for real tracks)"),
    "motion_mm.speed_p90": ("mm/s", "per landmark: 90th centile of the frame-to-frame speed"),
    "extent.width_mm": ("mm", "p2-p98 horizontal extent of the opacified left or right tree; real: vessel mask of the peak frame (realskel.mjs) at the 6F scale; simulator: projected centre lines of vessels with radius >= 0.4 mm, points every canvas px"),
    "extent.height_mm": ("mm", "as width, vertical extent"),
}


def add_targets(tg):
    """Add the geometry targets to a targets.Targets collection; returns the audit-file notes."""
    groups, notes = real_measurements()
    for (metric, art, view), pairs in sorted(groups.items()):
        unit, meth = METHODS[metric]
        tg.add(metric, "cd-ds+cd-main", "matched", pairs, unit, meth, SCRIPT + "; audit results in docs/realism/research/anatomy/", artery=art, view=view, extra={"imported_from": "anatomy-motion audit result files (measured on the real library by the audit's node scripts; re-aggregated here)"})
    return notes


def reproduction_rows(check):
    """Re-derive the anatomy audit's published values from its own result files."""
    groups, _ = real_measurements()

    def med(metric, art, view):
        v = [x for _, x in groups.get((metric, art, view), [])]
        return imlib.median(v) if v else None

    def rng(metric, art, view, i):
        v = [x for _, x in groups.get((metric, art, view), [])]
        return (min(v) if i == 0 else max(v)) if v else None

    check("tortuosity 8-20 mm band, real LAD RAO cranial median (deg)", 11.2, med("tortuosity.b8_20", "LCA", "RAO-CRA"))
    check("tortuosity 8-20 mm band, real RCA LAO min (deg)", 6.5, rng("tortuosity.b8_20", "RCA", "LAO-0", 0))
    check("tortuosity 8-20 mm band, real RCA LAO max (deg)", 12.4, rng("tortuosity.b8_20", "RCA", "LAO-0", 1))
    check("projected LM+LAD length RAO cranial, median (mm)", 135, med("shape.length_mm", "LCA", "RAO-CRA"))
    check("NCC displacement P10-P90, RCA LAO median (mm)", 17.8, med("motion_mm.p10p90", "RCA", "LAO-0"))
    check("NCC displacement P10-P90, LAD RAO cranial median (mm)", 8.2, med("motion_mm.p10p90", "LCA", "RAO-CRA"))
    check("speed, RCA median of landmark medians (mm/s)", 48, med("motion_mm.speed_median", "RCA", "LAO-0"))
    check("speed, LAD median of landmark medians (mm/s)", 17, med("motion_mm.speed_median", "LCA", "RAO-CRA"), atol=0.5, why="published to whole mm/s")
    check("speed, RCA median of landmark 90th centiles (mm/s)", 104, med("motion_mm.speed_p90", "RCA", "LAO-0"))
    check("speed, LAD median of landmark 90th centiles (mm/s)", 38, med("motion_mm.speed_p90", "LCA", "RAO-CRA"))
    for view, w, h in (("RAO-CAU", 101, 98), ("RAO-CRA", 103, 94), ("AP-CRA", 94, 93), ("LAO-CRA", 102, 78)):
        check(f"LCA tree extent {view} width (mm)", w, med("extent.width_mm", "LCA", view))
        check(f"LCA tree extent {view} height (mm)", h, med("extent.height_mm", "LCA", view))


# ---------------------------------------------------------------------------
# simulator captures (from the capture metadata)
# ---------------------------------------------------------------------------
def _ann_by_k(meta):
    return {a["k"]: a for a in meta.get("annotations") or []}


def _vessel(a, name):
    for v in a.get("vessels") or []:
        if v["name"] == name:
            return v
    return None


def _fine(a, name):
    for v in a.get("fine") or []:
        if v["name"] == name:
            return v
    return None


def _main_line(a, artery, fine=True):
    """Ostium-to-distal centre line in canvas px: LM + LAD for the left, RCA for the right."""
    get = _fine if fine else _vessel
    names = ["LM", "LAD"] if artery == "LCA" else ["RCA"]
    pts = []
    for n in names:
        v = get(a, n)
        if not v:
            return None
        pts += [tuple(p) for p in v["pts"]]
    # drop duplicates at the LM/LAD join
    out = [pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > 1e-6:
            out.append(p)
    return out


def _interp(pts, f, fs):
    """Point at fraction f along a vessel from decimated pts with sample fractions fs."""
    for i in range(1, len(fs)):
        if fs[i] >= f:
            t = (f - fs[i - 1]) / max(1e-9, fs[i] - fs[i - 1])
            return (pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]))
    return tuple(pts[-1])


def capture_geometry(meta, artery):
    """All geometry measures of one capture run, or {} when the metadata lacks what is needed."""
    if not meta or not meta.get("annotations"):
        return {}
    iso = meta.get("isoMmPerPx")
    fps = meta.get("fps") or 15
    if not iso:
        return {}
    A = _ann_by_k(meta)
    out = {"mm_per_canvas_px": round(iso, 4)}
    # tortuosity and length on the fine centre lines
    tb = {"b3_8": [], "b8_20": [], "b20_60": []}
    lens, acs = [], []
    for k, a in sorted(A.items()):
        if not a.get("fine"):
            continue
        line = _main_line(a, artery, fine=True)
        if not line or len(line) < 10:
            continue
        b = tangent_bands(line, iso)
        for key in tb:
            if b[key] is not None:
                tb[key].append(b[key])
        sm = shape_metrics(line, iso)
        if sm:
            lens.append(sm["length_mm"])
            acs.append(sm["arc_chord"])
    for key, v in tb.items():
        if v:
            out[f"tortuosity.{key}"] = round(imlib.median(v), 3)
    if lens and artery == "LCA":
        out["shape.length_mm"] = round(imlib.median(lens), 1)
        out["shape.arc_chord"] = round(imlib.median(acs), 3)
    # landmarks at 10..90% of the ostium-to-distal arc length (frame 0), tracked through the run
    a0 = A.get(0)
    names = ["LM", "LAD"] if artery == "LCA" else ["RCA"]
    if a0 and all(_vessel(a0, n) for n in names):
        segs = []  # (name, f0, f1, length px) along the main line at frame 0
        total = 0.0
        for n in names:
            v = _vessel(a0, n)
            L = sum(math.hypot(v["pts"][i][0] - v["pts"][i - 1][0], v["pts"][i][1] - v["pts"][i - 1][1]) for i in range(1, len(v["pts"])))
            segs.append((n, L))
            total += L
        p10, med_speed, p90_speed = [], [], []
        for q in (0.1, 0.3, 0.5, 0.7, 0.9):
            s = q * total
            for n, L in segs:
                if s <= L or n == segs[-1][0]:
                    f = min(1.0, s / max(1e-9, L))
                    break
                s -= L
            track = []
            for k in sorted(A):
                v = _vessel(A[k], n)
                if v:
                    track.append(_interp(v["pts"], f, v["f"]))
            if len(track) < 6:
                continue
            r = p10p90_major(track)
            if r is not None:
                p10.append(r * iso)
            st = sorted(math.hypot(b[0] - a[0], b[1] - a[1]) * iso * fps for a, b in zip(track, track[1:]))
            med_speed.append(imlib.median(st))
            p90_speed.append(st[round(0.9 * (len(st) - 1))])
        if p10:
            out["motion_mm.p10p90"] = round(imlib.median(p10), 2)
            out["motion_mm.speed_median"] = round(imlib.median(med_speed), 2)
            out["motion_mm.speed_p90"] = round(imlib.median(p90_speed), 2)
            out["motion_mm.landmarks"] = {"p10p90": [round(x, 2) for x in p10], "speed_median": [round(x, 1) for x in med_speed]}
    # tree extent at the frame of peak iodine
    if A:
        kpk = max(A, key=lambda k: A[k].get("iodine") or 0)
        side = "left" if artery == "LCA" else "right"
        xs, ys = [], []
        for v in A[kpk].get("vessels") or []:
            if v["side"] != side:
                continue
            for i in range(1, len(v["pts"])):
                if min(v["r"][i - 1], v["r"][i]) * iso < 0.4:
                    continue
                (x0, y0), (x1, y1) = v["pts"][i - 1], v["pts"][i]
                n = max(1, int(math.hypot(x1 - x0, y1 - y0)))
                for j in range(n):
                    t = j / n
                    xs.append(x0 + t * (x1 - x0))
                    ys.append(y0 + t * (y1 - y0))
        if len(xs) > 50:
            out["extent.width_mm"] = round((imlib.quantile(xs, 0.98) - imlib.quantile(xs, 0.02)) * iso, 1)
            out["extent.height_mm"] = round((imlib.quantile(ys, 0.98) - imlib.quantile(ys, 0.02)) * iso, 1)
            out["extent_frame"] = kpk
    # 6F catheter scale check: projected outer diameter of the 6F guide in 512-px analysis px
    cath = [a.get("catheter") for a in A.values() if a.get("catheter")]
    if cath:
        d = [2 * r for c in cath[:5] for r in c["r"]]
        if d:
            out["catheter_outer_px_canvas"] = round(imlib.median(d), 2)
    return out


if __name__ == "__main__":
    groups, notes = real_measurements()
    for key, v in sorted(groups.items()):
        vals = [x for _, x in v]
        print(key, len(vals), round(imlib.median(vals), 2), round(min(vals), 2), round(max(vals), 2))
    print(json.dumps(notes, indent=1))
