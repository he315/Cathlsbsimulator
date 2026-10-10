"""
Realism scorecard for a simulator capture set.

  python3 scripts/realism/report.py <set> [--profile cd-ds] [--pipeline matched|lossless] [--jobs N]

Reads datasets/tmp/captures/<set>/ (flat <set>__*.png files from the dev server are gathered into the
folder first), passes every frame through the same pipeline as the library (crop to the collimated field,
bilinear resample to 512, 8-bit, sips JPEG q72 for the matched pipeline), measures every metric with the
library code (measure.py / metrics.py) and compares it with datasets/library/realism_targets.json.

Hand-picked polylines of the audit are replaced for captures by the projected geometry recorded in the
capture metadata (vessel centre lines, catheter, rib margins), so vessel, catheter, rib and motion
measures run on the same anatomy the renderer drew. Writes datasets/tmp/realism/reports/<set>/
scorecard.json and scorecard.md and copies the JSON to datasets/tmp/realism_report.json.

Runs whose capture spec has role "device" (PCI device scenes) or "live" (sequences filmed through a lab's
own render path by its dev hooks), see src/dev/xrayCapture.ts, are measured with the same code but have no
real reference band of their own yet: they are listed as measurements (JSON key "measurements", markdown
section "Measurements outside the pass count") and never enter the rows, the headline or compare_sets.py.
"""

import argparse
import datetime
import json
import math
import os
import sys
import time
from multiprocessing import Pool

import geometry
import imlib
import measure
import metrics
import sources
from views import family

# ---------------------------------------------------------------------------
# per-run work
# ---------------------------------------------------------------------------


def _still_frame(run):
    """Frame for the single-frame background metrics (texture, spectrum, ridges, halo): frame 2, the
    library's frame (measure.m_still), when it is free of coronary contrast. The press starts the cine
    run and the push follows the operator's delay (injection.ts), so frames 0-2 of a capture are
    pre-contrast; the strict test is _pre_frame's (coronary iodine at most 1% of the run's peak).
    Wave 2 (C1): this used the bolus clock alone, which counts from the press, and so fell back to
    frame 0, the noisiest frame of the run (settling factor 1.58 against 1.30 at frame 2)."""
    k = _pre_frame(run)
    if k is not None:
        return k
    bt = run.meta.get("bolusT") or []
    if len(bt) > 2 and (bt[2] is None or bt[2] <= 0):
        return 2
    return 0


def _pre_frame(run):
    """Strict pre-contrast frame for local_contrast.pre: the largest k <= 2 (the library uses frame 2)
    whose coronary iodine (capture annotations) is at most 1% of the run's peak, or whose bolus has not
    started when the metadata has no iodine. None when every candidate frame already holds contrast."""
    anns = {a.get("k"): a for a in run.meta.get("annotations") or []}
    io = {k: a.get("iodine") for k, a in anns.items() if a.get("iodine") is not None}
    if io:
        pk = max(io.values()) or 0
        ok = [k for k in (2, 1, 0) if k in io and io[k] <= 0.01 * pk]
        return ok[0] if ok else None
    bt = run.meta.get("bolusT") or []
    ok = [k for k in (2, 1, 0) if k < len(bt) and (bt[k] is None or bt[k] < 0)]
    return ok[0] if ok else None


def _is_fluoro(meta):
    return ((meta or {}).get("spec") or {}).get("mode") == "fluoro"


def _is_flush(meta):
    """A cine companion without contrast (spec.injection null): the guide holds saline, as in the library's
    hand-picked unfilled-catheter segments. It feeds only the unfilled-catheter rows (C1, wave 2)."""
    sp = (meta or {}).get("spec") or {}
    return sp.get("mode", "cine") == "cine" and "injection" in sp and sp.get("injection") is None


def _role(meta):
    """How the scorecard treats a run: "scorecard" (pass count), or "device" / "live" (measurements only,
    realism-baseline). From spec.role; captures made before the role existed are scorecard runs unless they
    came from a lab hook (spec.source) or drew devices (spec.devices)."""
    m = meta or {}
    sp = m.get("spec") or {}
    r = sp.get("role") or m.get("role")
    if r:
        return r
    if sp.get("source") not in (None, "offscreen"):
        return "live"
    if sp.get("devices"):
        return "device"
    return "scorecard"


def _ann(run, k):
    for a in run.meta.get("annotations") or []:
        if a.get("k") == k:
            return a
    return None


def _to512(run, pts):
    return [list(run.to512(x, y)) for x, y in pts]


def _inside(p, m=20):
    return m <= p[0] <= 511 - m and m <= p[1] <= 511 - m


def _clip_poly(poly, m=20):
    """Longest run of consecutive points inside the analysis frame."""
    best, cur = [], []
    for p in poly:
        if _inside(p, m):
            cur.append(p)
        else:
            if len(cur) > len(best):
                best = cur
            cur = []
    return cur if len(cur) > len(best) else best


def _poly_len(poly):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(poly, poly[1:]))


LARGE = {"LCA": [("LM", 0.0, 1.0), ("LAD", 0.05, 0.45), ("LCx", 0.05, 0.45)], "RCA": [("RCA", 0.05, 0.75)]}
SMALL_EXCLUDE = {"LM", "LAD", "LCx", "RCA"}


def vessel_polys(run, k, artery, which):
    a = _ann(run, k)
    if not a or not a.get("vessels"):
        return []
    side = "left" if artery == "LCA" else "right"
    out = []
    for v in a["vessels"]:
        if v["side"] != side:
            continue
        if which == "large":
            sel = [(f0, f1) for n, f0, f1 in LARGE[artery] if n == v["name"]]
            if not sel:
                continue
            f0, f1 = sel[0]
            pts = [p for p, f in zip(v["pts"], v["f"]) if f0 <= f <= f1]
        else:
            if v["name"] in SMALL_EXCLUDE:
                continue
            # the distal half of side branches, where the projected radius is under 1.5 px (FWHM ~2-3 px)
            pts = [p for p, f, r in zip(v["pts"], v["f"], v["r"]) if f >= 0.5 and r * run.scale512() < 1.5]
        poly = _clip_poly(_to512(run, pts))
        if len(poly) >= 2 and _poly_len(poly) >= 12:
            out.append((v["name"], poly))
    return out


def _catheter_jobs(run, meta, frames):
    """Catheter wall profiles on the shaft away from the tip (middle half of the visible course)."""
    cres = []
    for k in frames:
        a = _ann(run, k)
        if not a or not a.get("catheter"):
            continue
        poly = _clip_poly(_to512(run, a["catheter"]["pts"]), 24)
        if len(poly) < 4:
            continue
        m0, m1 = len(poly) // 4, max(len(poly) // 4 + 2, 3 * len(poly) // 4)
        seg = poly[m0:m1]
        fr = run.frames([k])
        r = measure.cached("capjob", run, lambda fr=fr, seg=seg: metrics.catheter_profile(fr, seg) or {"error": "no profiles"}, extra=f"cath|{k}")
        if "error" not in r:
            r["name"] = f"catheter@{k}"
            cres.append(r)
    return cres


def run_capture(task):
    """All measurements for one capture run. task = (set, seq, pipeline)."""
    set_name, seq, pipeline = task
    seqs = sources.capture_sequences(set_name)
    meta, paths = seqs[seq]
    run = sources.CaptureRun(set_name, seq, meta, paths, pipeline)
    out = {"run": seq, "artery": run.artery, "angles": run.angles, "family": run.family, "fps": run.fps, "n": run.n(), "box": run.box()[0], "native": run.box()[1]}
    ks = _still_frame(run)
    out["still_frame"] = ks
    out["mode"] = "fluoro" if _is_fluoro(meta) else "flush" if _is_flush(meta) else "cine"
    out["role"] = _role(meta)
    if out["role"] != "scorecard":
        sp = (meta or {}).get("spec") or {}
        out["context"] = {"source": sp.get("source", "offscreen"), "devices": sp.get("devices"), "pci": (meta or {}).get("pci"), "lab": (meta or {}).get("lab"), "res": (meta or {}).get("res")}
    if out["mode"] == "flush":
        out["jobs"] = {"catheter": _catheter_jobs(run, meta, [k for k in (4, 7, 10) if k < run.n()])} if meta and meta.get("annotations") else {}
        out["perf"] = (meta or {}).get("msPerFrame")
        return out
    out["noise"] = measure.m_noise(run)
    out["settle"] = measure.m_settle(run)
    if out["mode"] == "fluoro":
        # fluoroscopy runs feed the noise comparison with cine and, having no bolus (the guide holds
        # saline), the unfilled-catheter profile (C1, wave 2; see compare())
        out["jobs"] = {"catheter": _catheter_jobs(run, meta, [k for k in (10, 20, 30) if k < run.n()])} if meta and meta.get("annotations") else {}
        out["perf"] = (meta or {}).get("msPerFrame")
        return out
    out["still"] = measure.m_still(run, k=ks)
    pk_pre = _pre_frame(run)
    out["pre_frame"] = pk_pre
    out["sequence"] = measure.m_sequence(run, pre_k=pk_pre)
    out["arrival"] = measure.arrival(out["sequence"])
    out["geometry"] = geometry.capture_geometry(meta, run.artery or "LCA")
    out["field"] = measure.m_field(run, k=0, which="full")
    out["pct"] = measure.m_pct(run)
    seq_r = out["sequence"] if "error" not in out["sequence"] else {}
    tm = seq_r.get("timing") or {}
    pk = tm.get("peak_frame")
    n = run.n()
    jobs = {}
    art = run.artery or "LCA"
    if meta and meta.get("annotations") and pk is not None:
        # vessel profiles at the peak-opacification frame and two neighbours
        pk_frames = [k for k in (pk - 2, pk, pk + 2) if 0 <= k < n]
        for which, grp in (("large", "vessel-large"), ("small", "vessel-small")):
            res = []
            for k in pk_frames:
                fr = run.frames([k])
                for name, poly in vessel_polys(run, k, art, which):
                    r = measure.cached("capjob", run, lambda fr=fr, poly=poly: metrics.vessel_profiles(fr, poly) or {"error": "no profiles"}, extra=f"{grp}|{k}|{name}")
                    if "error" not in r:
                        r["name"] = f"{name}@{k}"
                        res.append(r)
            jobs[grp] = res
        # unfilled catheter: pre-contrast frames, or frames after the syringe stopped (+0.3 s); used only
        # when the set has no fluoroscopy companion (compare())
        bt = meta.get("bolusT") or []
        inj = (meta.get("spec") or {}).get("injection") or {}
        dur = inj.get("duration", 1.8) if inj else 0
        unf = [k for k in range(n) if k < len(bt) and (bt[k] is None or bt[k] <= 0 or bt[k] > dur + 0.3)]
        cf = unf[:3] if unf and unf[0] < 3 else unf[-6::2]
        jobs["catheter"] = _catheter_jobs(run, meta, cf)
        # rib margins on the still frame
        rres = []
        a = _ann(run, ks)
        if a and a.get("ribs"):
            fr = run.frames([ks])
            cands = []
            for i, rb in enumerate(a["ribs"]):
                for side in ("upper", "lower"):
                    poly = _clip_poly(_to512(run, rb[side]), 24)
                    if len(poly) >= 3 and _poly_len(poly) >= 40:
                        cands.append((i, side, poly))
            for i, side, poly in cands[:8]:
                r = measure.cached("capjob", run, lambda fr=fr, poly=poly: metrics.vessel_profiles(fr, poly) or {"error": "no profiles"}, extra=f"rib|{ks}|{i}|{side}")
                if "error" not in r:
                    r["name"] = f"rib{i}-{side}"
                    rres.append(r)
        jobs["rib-margin"] = rres
        # cross-section motion tracking (xtrack) from the half-filling frame on
        f50 = tm.get("f50") or pk
        f0 = max(0, f50)
        f1 = min(n - 1, f0 + 26)
        fk = min(f1, max(f0, pk))
        mres = {}
        if f1 - f0 >= 8:
            fr = run.frames(list(range(f0, f1 + 1)))
            a = _ann(run, fk)
            lines = []
            if a:
                target = ("LAD", 0.3) if art == "LCA" else ("RCA", 0.5)
                for v in a.get("vessels") or []:
                    if v["name"] == target[0]:
                        i = min(range(len(v["f"])), key=lambda j: abs(v["f"][j] - target[1]))
                        p = run.to512(*v["pts"][i])
                        q0 = run.to512(*v["pts"][max(0, i - 1)])
                        q1 = run.to512(*v["pts"][min(len(v["pts"]) - 1, i + 1)])
                        tx, ty = q1[0] - q0[0], q1[1] - q0[1]
                        L = math.hypot(tx, ty) or 1
                        lines.append((f"motion-{target[0]}", p, (-ty / L, tx / L)))
                if a.get("catheter") and len(a["catheter"]["pts"]) > 6:
                    poly = _clip_poly(_to512(run, a["catheter"]["pts"]), 48)
                    if len(poly) > 4:
                        i = len(poly) // 2
                        tx, ty = poly[i + 1][0] - poly[i - 1][0], poly[i + 1][1] - poly[i - 1][1]
                        L = math.hypot(tx, ty) or 1
                        lines.append(("motion-cath", poly[i], (-ty / L, tx / L)))
            for grp, p, (dx, dy) in lines:
                r = measure.cached("capjob", run, lambda fr=fr, p=p, dx=dx, dy=dy: metrics.track_stats(fr, fk - f0, p[0], p[1], dx, dy) or {"error": "track lost"}, extra=f"x|{grp}|{f0}|{fk}")
                if "error" not in r:
                    r.pop("pos", None)
                    mres[grp] = r
            # ground truth from the projected geometry (not image-based): same point every frame
            gt = {}
            target = ("LAD", 0.3) if art == "LCA" else ("RCA", 0.5)
            pts = []
            for k in range(f0, f1 + 1):
                ak = _ann(run, k)
                for v in (ak or {}).get("vessels") or []:
                    if v["name"] == target[0]:
                        i = min(range(len(v["f"])), key=lambda j: abs(v["f"][j] - target[1]))
                        pts.append(run.to512(*v["pts"][i]))
            if len(pts) > 3:
                st = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:])]
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                gt = {"vessel": target[0], "range_2d_px": round(math.hypot(max(xs) - min(xs), max(ys) - min(ys)), 2), "step_max": round(max(st), 2), "step_median": round(imlib.median(st), 2)}
            out["motion_geometry"] = gt
        jobs["xtrack"] = mres
    out["jobs"] = jobs
    out["perf"] = (meta or {}).get("msPerFrame")
    return out


# ---------------------------------------------------------------------------
# comparison with targets
# ---------------------------------------------------------------------------


def target_for(doc, metric, profile, pipeline, artery="any", view="any"):
    """Most specific target first (artery and view, then artery, then view, then neither; the asked
    pipeline before the other). A specific target with fewer than 3 real values gives way to a more
    general one with 3 or more; when none has 3, the most specific one found is returned."""
    T = doc["targets"]
    first = None
    for pipe in (pipeline, "lossless" if pipeline == "matched" else "matched"):
        for art, vw in ((artery, view), (artery, "any"), ("any", view), ("any", "any")):
            for t in T:
                if t["metric"] == metric and t["profile"] == profile and t["pipeline"] == pipe and t["artery"] == art and t["view"] == vw:
                    if t["n"] >= 3:
                        return t
                    first = first or t
    return first


def dig(d, path):
    for k in (path.split("/") if "/" in path else path.split(".")):
        if isinstance(d, dict):
            d = d.get(k)
        else:
            return None
    return d if isinstance(d, (int, float)) and d == d else None


ROWS = [
    # (section, metric, getter on run result, per_artery, label)
    ("Noise", "noise.sigma_t", "noise.sigma_t_median", False, "temporal noise SD"),
    ("Noise", "noise.dark_bright_ratio", "noise.dark_bright_ratio", False, "noise dark/bright ratio (96-127 / 160-191)"),
    ("Noise", "noise.acf_lag1", "noise.acf_lag1", False, "noise autocorrelation lag 1"),
    ("Noise", "noise.acf_lag2", "noise.acf_lag2", False, "noise autocorrelation lag 2"),
    ("Noise", "noise.nps_low_frac", "noise.nps_low_frac", False, "NPS fraction below 0.1 cycles/px"),
    ("Noise", "noise.nps_hi_lo", "noise.nps_hi_lo", False, "NPS high/low ratio"),
    ("Noise", "noise.rho_temporal", "noise.rho_temporal", False, "frame-to-frame noise correlation"),
    ("Noise", "settle.first_pair_ratio", "settle.first_pair_ratio", False, "run-start noise settling (pair 0-1 / 9-10)"),
    ("Background", "texture.bandpass_rms.bright", "still.texture.bright.bandpass_rms", False, "lung band-pass 4-32 px RMS (bright tiles)"),
    ("Background", "texture.bandpass_rms.mid", "still.texture.mid.bandpass_rms", False, "band-pass RMS (mid tiles)"),
    ("Background", "texture.bandpass_rms.dark", "still.texture.dark.bandpass_rms", False, "band-pass RMS (dark tiles)"),
    ("Background", "texture.power_0.125.bright", "still/texture/bright/power_at_f/0.125", False, "power at 0.125 cycles/px (bright)"),
    ("Background", "texture.slope_hi.bright", "still.texture.bright.slope_hi", False, "spectrum slope 0.1-0.3 cycles/px (bright)"),
    ("Background", "spectrum.beta_lo", "still.spectrum.beta_lo", False, "background spectrum beta 0.008-0.08"),
    ("Background", "spectrum.band_power", "still.spectrum.band_power", False, "background band power 0.008-0.08"),
    ("Background", "ridges.pre_frame", "still.ridges_total", False, "thin dark-line pixels (pre-contrast)"),
    ("Background", "local_contrast.pre", "sequence.local_contrast.pre", True, "local contrast p99, pre-contrast"),
    ("Borders", "halo_auto.overshoot", "still.edge_auto.overshoot", False, "large-border bright overshoot"),
    ("Borders", "halo_auto.overshoot_rel_step", "still.edge_auto.overshoot_rel_step", False, "overshoot / step"),
    ("Borders", "halo_auto.overshoot_peak_px", "still.edge_auto.overshoot_peak_px", False, "overshoot peak distance"),
    ("Borders", "halo_auto.undershoot", "still.edge_auto.undershoot", False, "dark-side undershoot"),
    ("Contrast", "local_contrast.peak", "sequence.local_contrast.peak", True, "local contrast p99, peak frame"),
    ("Contrast", "opacified.area10", "sequence.opacified.area10", True, "opacified area > 10 levels"),
    ("Contrast", "opacified.area20", "sequence.opacified.area20", True, "opacified area > 20 levels"),
    ("Contrast", "opacified.peakD", "sequence.opacified.peakD", True, "peak mean darkening"),
    ("Timing", "timing.f10_s", "sequence.timing.f10_s", True, "first appearance (10%)"),
    ("Timing", "timing.f50_s", "sequence.timing.f50_s", True, "50% filling"),
    ("Timing", "timing.f90_s", "sequence.timing.f90_s", True, "90% filling"),
    ("Timing", "timing.rise_s", "sequence.timing.rise_s", True, "rise 10-90%"),
    ("Timing", "timing.frames_ge90", "sequence.timing.frames_ge90", True, "frames at >= 90%"),
    ("Timing", "timing.wash50_after_peak_s", "sequence.timing.wash50_after_peak_s", True, "50% washout after peak"),
    ("Timing", "timing.end_rel", "sequence.timing.end_rel", True, "end-of-run level / peak"),
    ("Timing", "timing.run_s", "sequence.timing.run_s", True, "run length"),
    ("Motion", "heart_rate.bpm", "sequence.heart_rate.hr_bpm", False, "heart rate from frame differences"),
    ("Motion", "motion_block.median", "sequence.block_motion.median", True, "block-matching motion, median"),
    ("Motion", "motion_block.p90", "sequence.block_motion.p90", True, "block-matching motion, p90"),
    ("Motion", "motion_block.max", "sequence.block_motion.max", True, "block-matching motion, max"),
    ("Field", "field.edge02_rel", "field.field.edge02_rel", False, "outer 0-2 px vs 16-32 px band"),
    ("Field", "field.edge24_rel", "field.field.edge24_rel", False, "2-4 px vs 16-32 px band"),
    ("Field", "field.edge816_rel", "field.field.edge816_rel", False, "8-16 px vs 16-32 px band"),
    ("Field", "field.corner_rel", "field.field.corner_rel", False, "corners vs 16-32 px band"),
]

JOB_ROWS = [
    ("Vessels", "vessel.vessel-large", "vessel-large", ["fwhm_px", "depth", "w80_w20", "edge10_90_px", "halo"], "large vessels at peak opacification"),
    ("Vessels", "vessel.vessel-small", "vessel-small", ["fwhm_px", "depth"], "smallest visible branches"),
    ("Bone", "vessel.rib-margin", "rib-margin", ["fwhm_px", "depth"], "rib margins"),
    ("Catheter", "catheter.catheter", "catheter", ["outer_fwhm_px", "wall_sep_px", "lumen_contrast", "depth"], "unfilled guide catheter"),
]
X_ROWS = [("motion-LAD", "LAD"), ("motion-RCA", "RCA"), ("motion-cath", "catheter shaft")]


def compare(doc, runs, profile, pipeline):
    rows = []

    def add(section, metric, label, values, artery="any", view="any", prof=None, per_run=None):
        vals = [v for v in values if v is not None]
        t = target_for(doc, metric, prof or profile, pipeline, artery, view)
        val = imlib.median(vals) if vals else None
        ok = None
        if val is not None and t:
            ok = t["band"][0] <= val <= t["band"][1]
        indicative = bool(t and t.get("indicative"))
        rows.append({"indicative": indicative, "section": section, "metric": metric, "label": label, "artery": artery, "view": view, "value": None if val is None else round(val, 4), "per_run": per_run or {}, "n_runs": len(vals), "target": None if not t else {"median": t["median"], "band": t["band"], "n": t["n"], "profile": t["profile"], "pipeline": t["pipeline"], "artery": t["artery"], "view": t["view"]}, "pass": ok})

    fluoro = [r for r in runs if r.get("mode") == "fluoro"]
    flush = [r for r in runs if r.get("mode") == "flush"]
    runs = [r for r in runs if r.get("mode") == "cine"]
    for r in runs:
        st = r.get("still") or {}
        if isinstance(st, dict) and st.get("ridges"):
            st["ridges_total"] = sum(st["ridges"])
    groups = sorted({(r["artery"], r.get("family") or "any") for r in runs if r.get("artery")})
    for section, metric, path, per_art, label in ROWS:
        if per_art:
            # per artery and view family; target_for falls back to the artery-level target when the
            # view family has fewer than 3 real runs
            for art, fam in groups:
                rr = [r for r in runs if r.get("artery") == art and (r.get("family") or "any") == fam]
                add(section, metric, label, [dig(r, path) for r in rr], artery=art, view=fam, per_run={r["run"]: dig(r, path) for r in rr})
        else:
            add(section, metric, label, [dig(r, path) for r in runs], per_run={r["run"]: dig(r, path) for r in runs})
    # contrast arrival (run_analysis.py definition on the harness signal), per artery and view family
    for key, metric, label in (("arrival30_s", "arrival.arrival30_s", "contrast arrival (30% of rise)"), ("above50_s", "arrival.above50_s", "time above 50% of rise"), ("arrival_at_frame0", "arrival.at_frame0", "contrast present in the first frame (0/1)")):
        for art, fam in groups:
            rr = [r for r in runs if r.get("artery") == art and (r.get("family") or "any") == fam]
            add("Timing", metric, label, [(r.get("arrival") or {}).get(key) for r in rr], artery=art, view=fam, per_run={r["run"]: (r.get("arrival") or {}).get(key) for r in rr})
    # noise by grey level (20-level bins) against the cd-ds profile (the same reference as the overall
    # noise SD row). The plan's flat 5-6 grey-level curve was measured on cd-main (JPEG main subset); its
    # bands are in the targets file under profile cd-main and are shown in the JSON as `alt_target`.
    bins = sorted({b for r in runs for b in ((r.get("noise") or {}).get("sigma_t_by_grey20") or {})}, key=lambda s: int(s.split("-")[0]))
    for b in bins:
        add("Noise", f"noise.sigma_t_by_grey20.{b}", f"noise SD at grey {b} (cd-ds)", [((r.get("noise") or {}).get("sigma_t_by_grey20") or {}).get(b) for r in runs], prof="cd-ds", per_run={r["run"]: ((r.get("noise") or {}).get("sigma_t_by_grey20") or {}).get(b) for r in runs})
        alt = target_for(doc, f"noise.sigma_t_by_grey20.{b}", "cd-main", "matched")
        if alt:
            rows[-1]["alt_target"] = {"profile": "cd-main", "median": alt["median"], "band": alt["band"], "n": alt["n"]}
    # fluoroscopy must be noisier than cine at equal grey (plan measurementTargets; physics of the lower
    # per-frame dose, not a library band): median over shared 20-level bins of sigma_fluoro / sigma_cine
    for fr in fluoro:
        base = fr["run"].replace("_fluoro", "")
        cine = next((r for r in runs if r["run"] == base), None) or next((r for r in runs if r.get("artery") == fr.get("artery") and r.get("family") == fr.get("family")), None)
        fb = (fr.get("noise") or {}).get("sigma_t_by_grey20") or {}
        cb = ((cine or {}).get("noise") or {}).get("sigma_t_by_grey20") or {}
        ratios = [fb[b] / cb[b] for b in fb if b in cb and cb[b]]
        val = imlib.median(ratios) if ratios else None
        rows.append({"indicative": False, "section": "Noise", "metric": "noise.fluoro_over_cine", "label": f"fluoro / cine noise SD at equal grey ({fr['run']} vs {(cine or {}).get('run')})", "artery": fr.get("artery") or "any", "view": fr.get("family") or "any", "value": None if val is None else round(val, 4), "per_run": {fr["run"]: val}, "n_runs": len(ratios), "target": {"median": None, "band": [1.0, None], "n": 0, "profile": "rule", "pipeline": pipeline, "artery": "any", "view": "any", "rule": "ratio > 1 (plan measurementTargets: fluoro must be noisier than cine at equal grey)"}, "pass": None if val is None else val > 1.0})
    # centre-line geometry and motion in mm (geometry.py): per artery and view family
    GEO = [("tortuosity.b3_8", "tortuosity band RMS 3-8 mm"), ("tortuosity.b8_20", "tortuosity band RMS 8-20 mm"), ("tortuosity.b20_60", "tortuosity band RMS 20-60 mm"), ("shape.length_mm", "projected LM+LAD length"), ("shape.arc_chord", "LM+LAD arc / chord"), ("extent.width_mm", "tree extent, width"), ("extent.height_mm", "tree extent, height"), ("motion_mm.p10p90", "landmark displacement P10-P90 (mm)"), ("motion_mm.speed_median", "landmark speed, median (mm/s)"), ("motion_mm.speed_p90", "landmark speed, 90th centile (mm/s)")]
    for metric, label in GEO:
        for art, fam in groups:
            rr = [r for r in runs if r.get("artery") == art and (r.get("family") or "any") == fam]
            vals = {r["run"]: (r.get("geometry") or {}).get(metric) for r in rr}
            if not any(v is not None for v in vals.values()):
                continue
            # the real length and extents exist only for their own view families: no fallback across views
            t = target_for(doc, metric, "cd-ds+cd-main", "matched", art, fam)
            if metric.startswith(("shape.", "extent.")) and t and t["view"] != fam:
                t = None
            add("Geometry", metric, label, list(vals.values()), artery=art, view=fam, prof="cd-ds+cd-main", per_run=vals)
            if metric.startswith(("shape.", "extent.")) and t is None:
                rows[-1]["target"], rows[-1]["pass"], rows[-1]["indicative"] = None, None, False
    # grey percentiles per run and view family
    for r in runs:
        if not r.get("family") or not r.get("pct") or "error" in r["pct"]:
            continue
        for q in ("p5", "p50", "p95"):
            add("Grey levels", f"grey.{q}", f"grey {q} ({r['run']})", [r["pct"].get(q)], artery=r["artery"], view=r["family"], prof="cd-ds+cd-main", per_run={r["run"]: r["pct"].get(q)})
    # annotation-driven profiles. The unfilled-catheter rows come from the cine companion without contrast
    # (flush) when the set has one, else from the fluoroscopy companion: the library's catheter lines are
    # hand-picked unfilled (saline) segments, and a capture's cine runs open with the guide primed with
    # contrast from the previous run (injection.ts), so only a run without a bolus shows the guide as the
    # library measured it (C1, wave 2).
    has_cath = lambda rr: any((r.get("jobs") or {}).get("catheter") for r in rr)
    cath_src = flush if has_cath(flush) else fluoro if has_cath(fluoro) else runs
    for section, metric, grp, fields, label in JOB_ROWS:
        for fld in fields:
            per = {}
            vals = []
            for r in (cath_src if grp == "catheter" else runs):
                js = (r.get("jobs") or {}).get(grp) or []
                v = [j.get(fld) for j in js if j.get(fld) is not None]
                if v:
                    per[r["run"]] = round(imlib.median(v), 3)
                    vals.extend(v)
            add(section, f"{metric}.{fld}", f"{label}: {fld}", vals, prof="cd-ds", per_run=per)
    for grp, label in X_ROWS:
        for fld in ("range_px", "step_median", "step_p90", "step_max"):
            per = {r["run"]: ((r.get("jobs") or {}).get("xtrack") or {}).get(grp, {}).get(fld) for r in runs}
            per = {k: v for k, v in per.items() if v is not None}
            add("Motion", f"xtrack.{grp}.{fld}", f"{label} cross-section track: {fld}", list(per.values()), prof="cd-ds", per_run=per)
    return rows


def _twin(run, runs):
    """The scorecard run filmed like a measurement run (same artery and view family, cine, nearest C-arm
    angles): for a device scene its device-free twin, for a live-path run the offscreen run of its view."""
    cands = [r for r in runs if r.get("mode") == "cine" and r.get("artery") == run.get("artery") and r.get("family") == run.get("family")]
    if not cands:
        return None
    a = run.get("angles") or (0, 0)
    return min(cands, key=lambda r: abs((r.get("angles") or (0, 0))[0] - a[0]) + abs((r.get("angles") or (0, 0))[1] - a[1]))


def measurement_rows(doc, mruns, runs, profile, pipeline):
    """Rows of the device and live-path runs (realism-baseline): each run is measured alone with compare(),
    so it gets every row the scorecard computes for its mode, artery and view family; the result is kept as a
    measurement. `in_band` says where the value falls against the real band (for reading only); `pass` is
    always None, so the headline and compare_sets.py never count these rows. `twin_value` is the same row
    measured alone on the run's twin (_twin: for a device scene the device-free run of its view), so the
    effect of the devices or of the live render path can be read row by row."""
    out = []
    twin_rows = {}
    for run in mruns:
        tw = _twin(run, runs)
        if tw and tw["run"] not in twin_rows:
            twin_rows[tw["run"]] = {(r["metric"], r["artery"], r["view"]): r.get("value") for r in compare(doc, [tw], profile, pipeline)}
        tv = twin_rows.get(tw["run"]) if tw else None
        for r in compare(doc, [run], profile, pipeline):
            if r.get("value") is None:
                continue
            out.append({**r, "measurement": True, "run": run["run"], "role": run.get("role"), "in_band": r["pass"], "pass": None, "indicative": False, "twin": tw["run"] if tw else None, "twin_value": None if tv is None else tv.get((r["metric"], r["artery"], r["view"]))})
    return out


def partition_runs(runs):
    """Split measured runs into (scorecard runs, measurement runs). Device and live-path runs are
    measurements, never part of the pass count (realism-baseline); a run without a role is a scorecard run."""
    score = [r for r in runs if r.get("role", "scorecard") == "scorecard"]
    meas = [r for r in runs if r.get("role", "scorecard") != "scorecard"]
    return score, meas


def fmt(v, nd=2):
    if v is None:
        return "n/a"
    if abs(v) >= 1000:
        return f"{v:,.0f}"
    return f"{v:.{nd}f}"


def markdown(set_name, rows, runs, profile, pipeline, elapsed, meas=None, mruns=None):
    meas = meas or []
    mruns = mruns or []
    n_pass = sum(1 for r in rows if r["pass"] and not r["indicative"])
    n_eval = sum(1 for r in rows if r["pass"] is not None and not r["indicative"])
    n_ind = sum(1 for r in rows if r["indicative"])
    L = [f"# Realism scorecard: capture set `{set_name}`", ""]
    L.append(f"Generated {datetime.datetime.now().isoformat(timespec='minutes')} by `scripts/realism/report.py` in {elapsed:.0f} s. Pipeline: **{pipeline}** ({'crop to the collimated field, bilinear resample to 512 x 512, 8-bit, sips JPEG q72' if pipeline == 'matched' else 'crop to the field and bilinear resample to 512 x 512, no JPEG'}). Targets: `datasets/library/realism_targets.json`, profile `{profile}` unless stated; pass = simulator median inside the target band (p10-p90 of real runs, or the observed range when fewer than 10).")
    L.append("")
    L.append(f"**{n_pass} of {n_eval} metrics inside the real band.** {n_ind} further rows compare with fewer than 3 real measurements and are shown as indicative only." + (f" {len(meas)} measurement rows from {len(mruns)} device and live-path runs are listed at the end and are not counted." if mruns else ""))
    L.append("")
    L.append("Per-artery rows are split by view family (scripts/realism/views.py, 15-degree rule). A row uses the target of its own artery and view family when that target has at least 3 real runs, otherwise the artery-level target; the band column names the source when it is not the row's own artery/view or the default profile. Geometry rows (tortuosity, length, extent, motion in mm) use the anatomy audit's real traces and tracks (scripts/realism/geometry.py); length and extent are compared only within their own view family. The fluoroscopy/cine row is a rule (ratio above 1), not a library band.")
    L.append("")
    L.append("| run | artery | view family | C-arm (LAO+/CRA+) | frames | field box (native px) | ms/frame scene + render |")
    L.append("|---|---|---|---|---|---|---|")
    for r in runs:
        pf = r.get("perf") or {}
        ang = r.get("angles")
        L.append(f"| {r['run']} | {r.get('artery')} | {r.get('family')} | {ang[0]:.0f} / {ang[1]:.0f} | {r.get('n')} | {r.get('box')} | {fmt(pf.get('scene'), 1)} + {fmt(pf.get('render'), 1)} |" if ang else f"| {r['run']} | | | | {r.get('n')} | {r.get('box')} | |")
    L.append("")
    sec = None
    for row in rows:
        if row["section"] != sec:
            sec = row["section"]
            L += ["", f"## {sec}", "", "| metric | artery / view | simulator | real median | real band | n real | result |", "|---|---|---|---|---|---|---|"]
        t = row["target"]
        av = "" if row["artery"] == "any" and row["view"] == "any" else f"{row['artery']} {row['view'] if row['view'] != 'any' else ''}".strip()
        res = "pass" if row["pass"] else ("no target" if t is None else ("no value" if row["value"] is None else "FAIL"))
        if row["indicative"] and t is not None and row["value"] is not None:
            res = ("inside" if row["pass"] else "outside") + " (indicative, n < 3)"
        if t and t.get("rule"):
            band = t["rule"]
        elif t:
            band = fmt(t["band"][0], 3) + " to " + fmt(t["band"][1], 3)
            # say where the band comes from when it is not the row's own artery/view or the default profile
            src = []
            if t.get("profile") not in (profile,):
                src.append(t["profile"])
            if (t.get("artery"), t.get("view")) != (row["artery"], row["view"]):
                src.append(f"{t.get('artery')}/{t.get('view')}")
            if src:
                band += f" ({', '.join(src)})"
        else:
            band = "n/a"
        L.append(f"| {row['label']} | {av} | {fmt(row['value'], 3)} | {fmt(t['median'], 3) if t and t.get('median') is not None else 'n/a'} | {band} | {t['n'] if t else ''} | {res} |")
    gt = [(r["run"], r.get("motion_geometry")) for r in runs if r.get("motion_geometry")]
    if gt:
        L += ["", "## Motion from the projected geometry (not image-based; for reference)", "", "| run | vessel point | 2-D range px | max step px/frame | median step |", "|---|---|---|---|---|"]
        for name, g in gt:
            L.append(f"| {name} | {g.get('vessel')} | {g.get('range_2d_px')} | {g.get('step_max')} | {g.get('step_median')} |")
    if mruns:
        L += ["", "## Measurements outside the pass count", ""]
        L.append("Device scenes (PCI devices drawn through the lab's pciDevices) and live-path runs (filmed through a lab's own render path by its dev hooks) have no real reference band of their own yet. Each run is measured alone with the scorecard's code; the band of the matching real target is shown for reading only, and none of these rows enters the headline or compare_sets.py. 'twin' is the same row measured alone on the scorecard run of the same artery and view family (for a device scene, its device-free twin).")
        L.append("'frame px' is the side of the captured frame; a live run filmed at another size than the run it is compared with is not comparable (xrayCapture refuses lab canvases under 512 px).")
        L += ["", "| run | role | source | stage / lab | artery | view family | frames | frame px | field box (native px) |", "|---|---|---|---|---|---|---|---|---|"]
        for r in mruns:
            c = r.get("context") or {}
            what = c.get("devices") or ""
            if c.get("lab"):
                lab = c["lab"]
                what = ", ".join(f"{k} {v}" for k, v in lab.items() if v not in (None, ""))
            L.append(f"| {r['run']} | {r.get('role')} | {c.get('source')} | {what} | {r.get('artery')} | {r.get('family')} | {r.get('n')} | {c.get('res') or ''} | {r.get('box')} |")
        for r in mruns:
            mr = [m for m in meas if m["run"] == r["run"]]
            if not mr:
                continue
            nin = sum(1 for m in mr if m["in_band"])
            L += ["", f"### {r['run']} ({r.get('role')}): {nin} of {len(mr)} values inside the real band (not counted)", "", f"| section | metric | artery / view | run | twin ({mr[0].get('twin') or 'none'}) | real band | inside |", "|---|---|---|---|---|---|---|"]
            for m in mr:
                t = m["target"]
                av = "" if m["artery"] == "any" and m["view"] == "any" else f"{m['artery']} {m['view'] if m['view'] != 'any' else ''}".strip()
                band = (t.get("rule") or (fmt(t["band"][0], 3) + " to " + fmt(t["band"][1], 3))) if t else "n/a"
                inside = "n/a" if m["in_band"] is None else ("yes" if m["in_band"] else "no")
                L.append(f"| {m['section']} | {m['label']} | {av} | {fmt(m['value'], 3)} | {fmt(m.get('twin_value'), 3)} | {band} | {inside} |")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("set")
    ap.add_argument("--profile", default="cd-ds")
    ap.add_argument("--pipeline", default="matched", choices=["matched", "lossless"])
    ap.add_argument("--jobs", type=int, default=max(1, min(8, (os.cpu_count() or 2) - 1)))
    ap.add_argument("--out", default=None, help="markdown output path (default datasets/tmp/realism/reports/<set>/scorecard.md)")
    a = ap.parse_args()
    t0 = time.time()
    doc = imlib.load_json(imlib.TARGETS)
    if not doc:
        sys.exit("no targets: run bash scripts/realism/run_all.sh --library-only first")
    seqs = sources.capture_sequences(a.set)
    if not seqs:
        sys.exit(f"no captures in datasets/tmp/captures/{a.set}/")
    # convert first (sips) so workers only read caches
    tasks = [(a.set, s, a.pipeline) for s in sorted(seqs)]
    for s in sorted(seqs):
        meta, paths = seqs[s]
        sources.CaptureRun(a.set, s, meta, paths, a.pipeline).box()
    if a.jobs > 1 and len(tasks) > 1:
        with Pool(min(a.jobs, len(tasks))) as pool:
            runs = pool.map(run_capture, tasks)
    else:
        runs = [run_capture(t) for t in tasks]
    runs, mruns = partition_runs(runs)
    rows = compare(doc, runs, a.profile, a.pipeline)
    meas = measurement_rows(doc, mruns, runs, a.profile, a.pipeline)
    elapsed = time.time() - t0
    out_dir = os.path.join(imlib.CACHE, "reports", a.set)
    os.makedirs(out_dir, exist_ok=True)
    res = {"set": a.set, "generated": datetime.datetime.now().isoformat(timespec="seconds"), "profile": a.profile, "pipeline": a.pipeline, "elapsed_s": round(elapsed, 1), "runs": runs, "rows": rows, "measurement_runs": mruns, "measurements": meas}
    imlib.save_json(os.path.join(out_dir, f"scorecard_{a.pipeline}.json"), res)
    imlib.save_json(os.path.join(imlib.ROOT, "datasets", "tmp", "realism_report.json"), res)
    md = markdown(a.set, rows, runs, a.profile, a.pipeline, elapsed, meas, mruns)
    mp = a.out or os.path.join(out_dir, f"scorecard_{a.pipeline}.md")
    with open(mp, "w") as f:
        f.write(md)
    # terminal table
    for row in rows:
        t = row["target"]
        flag = "pass" if row["pass"] else ("----" if row["pass"] is None else "FAIL")
        if row["indicative"]:
            flag = "ind."
        band = f"{fmt(t['band'][0])}..{fmt(t['band'][1])}" if t else "no target"
        av = "" if row["artery"] == "any" and row["view"] == "any" else f" [{row['artery']} {row['view']}]"
        print(f"{flag}  {row['label'][:52]:52s}{av:18s} sim {fmt(row['value']):>9s}   real {band}")
    for r in mruns:
        mr = [m for m in meas if m["run"] == r["run"]]
        print(f"meas  {r['run']} ({r.get('role')}): {len(mr)} rows measured, {sum(1 for m in mr if m['in_band'])} inside the real band (not counted)")
    n_pass = sum(1 for r in rows if r["pass"] and not r["indicative"])
    n_eval = sum(1 for r in rows if r["pass"] is not None and not r["indicative"])
    print(f"\n{n_pass}/{n_eval} metrics inside the real band; {len(meas)} measurement rows from {len(mruns)} device and live-path runs, not counted; {elapsed:.0f} s; wrote {imlib.rel(mp)}")


if __name__ == "__main__":
    main()
