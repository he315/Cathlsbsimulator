"""
Measure the real library and write datasets/library/realism_targets.json.

  python3 scripts/realism/targets.py [--jobs N] [--quick] [--no-cache]

Every target is {metric, pipeline, profile, artery, view, median, iqr, p10_p90, min_max, n, band,
band_rule, unit, method, script, source_runs}. Bands: p10-p90 of the per-run values when n >= 10,
otherwise the observed range. All pixel quantities are in the 512 x 512 library frame (the dataset
authors' resampling for CoronaryDominance and CADICA; the harness's bilinear resample for captures).
After aggregation the audit's published medians are recomputed on the audit's own run selections and
checked (section "reproduction"): within 5%, or within the rounding of the published value where that is
wider (each row stores its tolerance and the reason).
"""

import argparse
import datetime
import json
import os
import sys
import time
from multiprocessing import Pool

import geometry
import imlib
import measure
import selections as S
import sources
from views import FAMILY_THRESHOLD_DEG, family

HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = imlib.load_json(os.path.join(HERE, "jobs", "library_jobs.json"), [])

PIPE_NOTE = {
    "lossless": "dataset frames as stored (CoronaryDominance domain-shift npz exact 8-bit values; CADICA PNG), 512 x 512",
    "matched": "512 x 512, 8-bit, JPEG quality 72 by macOS sips, decoded by sips (the app library's encoding)",
}


# ---------------------------------------------------------------------------
# task execution
# ---------------------------------------------------------------------------
def _work(task):
    fn, prof, pipe, rid, kw = task
    try:
        run = sources.library_run(prof, pipe, rid)
        return task, getattr(measure, fn)(run, **json.loads(kw))
    except Exception as e:
        return task, {"error": f"{type(e).__name__}: {e}"}


def execute(tasks, jobs):
    tasks = sorted(set(tasks))
    out = {}
    t0 = time.time()
    if jobs <= 1:
        it = map(_work, tasks)
    else:
        pool = Pool(jobs)
        it = pool.imap_unordered(_work, tasks, chunksize=1)
    for i, (task, res) in enumerate(it, 1):
        out[task] = res
        if i % 25 == 0 or i == len(tasks):
            print(f"  {i}/{len(tasks)} tasks, {time.time() - t0:.0f} s", flush=True)
    if jobs > 1:
        pool.close()
        pool.join()
    return out


def T(fn, prof, pipe, rid, **kw):
    return (fn, prof, pipe, rid, json.dumps(kw, sort_keys=True))


# ---------------------------------------------------------------------------
# selections per measurement
# ---------------------------------------------------------------------------
def plan(quick=False):
    m5 = S.m5_selection()
    m2 = S.m2_selection()
    fs = S.field_selection()
    m7 = S.m7_selection()
    timing = S.timing_runs()
    cut = (lambda v, n: v[:n]) if quick else (lambda v, n: v)
    sel = {
        "noise": [
            ("cd-ds", "lossless", S.AUDIT_NOISE_CDDS),
            ("cd-ds", "matched", S.AUDIT_NOISE_CDDS),
            ("cadica", "lossless", S.AUDIT_NOISE_CADICA),
            ("cadica", "matched", S.AUDIT_NOISE_CADICA),
            ("cd-main", "matched", S.AUDIT_NOISE_CDMAIN + [r for r in m5["cd-main"] if r not in S.AUDIT_NOISE_CDMAIN][:15]),
        ],
        "settle": [("cd-ds", "lossless", S.AUDIT_SETTLE_CDDS), ("cd-ds", "matched", S.AUDIT_SETTLE_CDDS)],
        "still": [
            ("cd-ds", "lossless", sorted(set(timing) | set(S.AUDIT_TEXTURE_CDDS))),
            ("cd-ds", "matched", sorted(set(timing) | set(S.AUDIT_TEXTURE_CDDS))),
            ("cd-main", "matched", m5["cd-main"]),
            ("cadica", "lossless", sorted(set(m5["cadica"]) | set(S.AUDIT_TEXTURE_CADICA))),
            ("cadica", "matched", sorted(set(m5["cadica"]) | set(S.AUDIT_TEXTURE_CADICA))),
            ("angiocad", "matched", fs["angiocad"]),
        ],
        "ridge": [("cd-ds", "lossless", timing), ("cd-ds", "matched", timing), ("cd-main", "matched", m5["cd-main"]), ("cadica", "matched", m5["cadica"])],
        "sequence": [
            ("cd-ds", "lossless", timing),
            ("cd-ds", "matched", sorted(set(timing) | set(m2["cd-ds"]))),
            ("cd-main", "matched", m2["cd-main"]),
            ("cadica", "lossless", m2["cadica"]),
            ("cadica", "matched", m2["cadica"]),
        ],
        "field": [
            ("cd-ds", "lossless", fs["cd-ds"]),
            ("cd-ds", "matched", fs["cd-ds"]),
            ("cadica", "lossless", fs["cadica"]),
            ("cd-main", "matched", fs["cd-main"]),
            ("angiocad", "matched", fs["angiocad"]),
        ],
        "pct": [(prof, "matched", [rid]) for k, v in m7.items() for prof, rid in v],
    }
    return {k: [(p, q, cut(ids, 6)) for p, q, ids in v] for k, v in sel.items()}, {"m5": m5, "m2": m2, "field": fs, "m7": m7, "timing": timing}


def still_frame(prof):
    # texture.py used frame index 2 for CoronaryDominance and 1 for CADICA (the second frame)
    return 1 if prof == "cadica" else 2


def build_tasks(sel):
    tasks = []
    for prof, pipe, ids in sel["noise"]:
        tasks += [T("m_noise", prof, pipe, r) for r in ids]
    for prof, pipe, ids in sel["settle"]:
        tasks += [T("m_settle", prof, pipe, r) for r in ids]
    for prof, pipe, ids in sel["still"]:
        tasks += [T("m_still", prof, pipe, r, k=still_frame(prof)) for r in ids]
    for prof, pipe, ids in sel["ridge"]:
        tasks += [T("m_ridge", prof, pipe, r) for r in ids]
    for prof, pipe, ids in sel["sequence"]:
        tasks += [T("m_sequence", prof, pipe, r) for r in ids]
    for prof, pipe, ids in sel["field"]:
        tasks += [T("m_field", prof, pipe, r, k=still_frame(prof)) for r in ids]
    for prof, pipe, ids in sel["pct"]:
        tasks += [T("m_pct", prof, pipe, r) for r in ids]
    for job in JOBS:
        prof = "cadica" if job.get("src") == "cadica" else "cd-ds"
        for pipe in ("lossless", "matched"):
            tasks.append(T("m_job", prof, pipe, job["run"], job=job))
    return tasks


# ---------------------------------------------------------------------------
# aggregation
# ---------------------------------------------------------------------------
def dig(d, path):
    for k in (path.split("/") if "/" in path else path.split(".")):
        if d is None:
            return None
        if isinstance(d, dict):
            d = d.get(k)
        elif isinstance(d, list):
            try:
                d = d[int(k)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    if isinstance(d, (int, float)) and d == d:
        return float(d)
    return None


class Targets:
    def __init__(self):
        self.items = []

    def add(self, metric, prof, pipe, pairs, unit, method, script, artery="any", view="any", extra=None):
        pairs = [(r, v) for r, v in pairs if v is not None]
        s = imlib.summarise([v for _, v in pairs])
        if s is None:
            return None
        band, rule = imlib.band_of(s)
        t = {"metric": metric, "pipeline": pipe, "profile": prof, "artery": artery, "view": view, **s, "band": band, "band_rule": rule, "indicative": s["n"] < 3, "unit": unit, "method": method, "script": script, "source_runs": sorted({r for r, _ in pairs})}
        if extra:
            t.update(extra)
        self.items.append(t)
        return t


_IDX = {}


def _index(results):
    key = id(results)
    if key not in _IDX:
        d = {}
        for (f, p, q, r, k), v in results.items():
            d.setdefault((f, p, q, r), []).append(v)
        _IDX.clear()
        _IDX[key] = d
    return _IDX[key]


def collect(results, fn, prof, pipe, ids, path, kw=None, run_filter=None):
    """[(run id, value)] for a metric path from cached task results."""
    out = []
    idx = _index(results)
    for rid in ids:
        if kw is None:
            cands = idx.get((fn, prof, pipe, rid), [])
        else:
            cands = [results.get((fn, prof, pipe, rid, json.dumps(kw, sort_keys=True)))]
        for res in cands:
            if not res or "error" in res:
                continue
            if run_filter and not run_filter(rid):
                continue
            out.append((rid, dig(res, path)))
    return out


_FAM = {}


def family_of(prof, rid):
    """View family of a library run from its index angles (views.py rule), or None."""
    if prof not in _FAM:
        _FAM[prof] = {}
        for e in sources.library_index(prof):
            a = e.get("angles")
            _FAM[prof][e["id"]] = family((a["primary"], a["secondary"])) if a else None
    return _FAM[prof].get(rid)


def artery_of(rid):
    if rid.startswith("cd"):
        return rid.split("-")[2]
    return None


def aggregate(results, sel, sels):
    tg = Targets()
    sc = "scripts/realism/measure.py, metrics.py"
    # ---- noise
    noise_paths = {
        "noise.sigma_t": ("sigma_t_median", "grey levels", "noise2.py: SD of consecutive-frame differences / sqrt(2) in the lowest-variance 30% of 32 x 32 blocks per 32-grey bin (quadratic surface removed), frame pairs 1, 3, 12, 20, 28, 36; median over blocks"),
        "noise.dark_bright_ratio": ("dark_bright_ratio", "ratio", "noise2.py: sigma_t in the 96-127 grey bin divided by sigma_t in the 160-191 bin"),
        "noise.acf_lag1": ("acf_lag1", "correlation", "noise2.py: normalised autocorrelation of the static-block frame differences at lag 1 (mean of horizontal and vertical)"),
        "noise.acf_lag2": ("acf_lag2", "correlation", "noise2.py: normalised autocorrelation of the static-block frame differences at lag 2 (mean of horizontal and vertical)"),
        "noise.rho_temporal": ("rho_temporal", "correlation", "noise2.py: rho = 3 - var(second difference)/var(first difference) in static blocks (AR(1) temporal correlation of the noise)"),
        "noise.nps_low_frac": ("nps_low_frac", "fraction", "noise2.py: fraction of the normalised radial NPS of the frame differences below 0.1 cycles/px"),
        "noise.nps_hi_lo": ("nps_hi_lo", "ratio", "NPS power in radial bins 13-15 over bins 1-3 (32-px blocks, 0.03-0.47 cycles/px)"),
    }
    for prof, pipe, ids in sel["noise"]:
        for m, (path, unit, meth) in noise_paths.items():
            tg.add(m, prof, pipe, collect(results, "m_noise", prof, pipe, ids, path), unit, meth, sc)
        for g in range(64, 224, 32):
            b = f"{g}-{g + 31}"
            tg.add(f"noise.sigma_t_by_grey.{b}", prof, pipe, collect(results, "m_noise", prof, pipe, ids, f"sigma_t_by_grey.{b}.0"), "grey levels", "noise2.py sigma_t per 32-grey bin of the block mean", sc)
        for g in range(60, 240, 20):
            b = f"{g}-{g + 19}"
            tg.add(f"noise.sigma_t_by_grey20.{b}", prof, pipe, collect(results, "m_noise", prof, pipe, ids, f"sigma_t_by_grey20.{b}"), "grey levels", "sigma_t of the lowest-variance 30% of blocks per 20-grey bin (bins with < 5 blocks dropped; renderer-physics audit binning)", sc)
    # ---- settling
    for prof, pipe, ids in sel["settle"]:
        tg.add("settle.first_pair_ratio", prof, pipe, collect(results, "m_settle", prof, pipe, ids, "first_pair_ratio"), "ratio", "settle.py: noise of frame pair (0,1) relative to pair (9,10), lowest-quartile block variance", sc)
        for k in range(9):
            tg.add(f"settle.ratio_pair{k}", prof, pipe, collect(results, "m_settle", prof, pipe, ids, f"ratio_to_last.{k}"), "ratio", f"settle.py: noise of frame pair ({k},{k + 1}) relative to pair (9,10)", sc)
    # ---- still frame: texture, spectrum, automatic border halo, ridges
    still_paths = {
        "texture.bandpass_rms.bright": ("texture.bright.bandpass_rms", "grey levels", "texture.py: RMS of (3 x 3 minus 33 x 33 box mean) in the brightest third of 128-px tiles (aerated lung), pre-contrast frame"),
        "texture.bandpass_rms.mid": ("texture.mid.bandpass_rms", "grey levels", "as bright, middle third of tiles"),
        "texture.bandpass_rms.dark": ("texture.dark.bandpass_rms", "grey levels", "as bright, darkest third (heart, spine, diaphragm)"),
        "texture.slope_lo.bright": ("texture.bright.slope_lo", "log-log slope", "texture.py: radial power spectrum slope 0.016-0.1 cycles/px, bright tiles"),
        "texture.slope_hi.bright": ("texture.bright.slope_hi", "log-log slope", "texture.py: slope 0.1-0.3 cycles/px, bright tiles"),
        "texture.power_0.125.bright": ("texture/bright/power_at_f/0.125", "power", "texture.py: power at 0.125 cycles/px, bright tiles"),
        "spectrum.beta_lo": ("spectrum.beta_lo", "slope (positive)", "central 256 x 256 block, plane detrend, Hann, radial average excluding axes, -slope over 0.008-0.08 cycles/px"),
        "spectrum.beta_hi": ("spectrum.beta_hi", "slope (positive)", "as beta_lo over 0.08-0.3 cycles/px"),
        "spectrum.band_power": ("spectrum.band_power", "power", "sum of radial-bin means over 0.008-0.08 cycles/px"),
        "halo_auto.overshoot": ("edge_auto.overshoot", "grey levels", "automatic large-border halo (metrics.edge_auto): bright-side overshoot above the 25-40 px plateau"),
        "halo_auto.overshoot_rel_step": ("edge_auto.overshoot_rel_step", "ratio", "overshoot / border step"),
        "halo_auto.overshoot_peak_px": ("edge_auto.overshoot_peak_px", "px", "distance of the bright-side peak from the border"),
        "halo_auto.undershoot": ("edge_auto.undershoot", "grey levels", "dark-side undershoot below the plateau"),
        "halo_auto.step": ("edge_auto.step", "grey levels", "border step between plateaus"),
        "halo_auto.rise_10_90_px": ("edge_auto.rise_10_90_px", "px", "10-90% border rise distance"),
        "ridges.pre_frame": ("ridges", "px", "ridge.py count on the pre-contrast frame (sum of depth classes)"),
    }
    for prof, pipe, ids in sel["still"]:
        kw = {"k": still_frame(prof)}
        for m, (path, unit, meth) in still_paths.items():
            if path == "ridges":
                pairs = [(r, sum(v["ridges"]) if v and "ridges" in v else None) for r, v in ((rid, results.get(("m_still", prof, pipe, rid, json.dumps(kw, sort_keys=True)))) for rid in ids)]
            else:
                pairs = collect(results, "m_still", prof, pipe, ids, path, kw=kw)
            tg.add(m, prof, pipe, pairs, unit, meth + f" (frame index {kw['k']})", sc)
    for prof, pipe, ids in sel["ridge"]:
        tg.add("ridges.pre_base", prof, pipe, collect(results, "m_ridge", prof, pipe, ids, "base"), "px", "ridge.py: strict 1-D minima at +-2 px at least 12 levels below the 15 x 15 mean; median count over pre-contrast frames 1-3", sc)
    # ---- sequences (no AngioCAD: acquisition frame rate not stated)
    seq_paths = {
        "timing.f10_s": ("timing.f10_s", "s", "timing.py: first frame with the opacified-pixel count (2 x 2 binned pixels > 30 levels below the 15 x 15 mean) above baseline + 10% of the rise; baseline = min of frames 1-3"),
        "timing.f50_s": ("timing.f50_s", "s", "timing.py 50% filling time"),
        "timing.f90_s": ("timing.f90_s", "s", "timing.py 90% filling time"),
        "timing.rise_s": ("timing.rise_s", "s", "timing.py rise: f90 minus f10 in seconds"),
        "timing.peak_s": ("timing.peak_s", "s", "timing.py time of the maximum opacified-pixel count"),
        "timing.frames_ge90": ("timing.frames_ge90", "frames", "frames at or above 90% of the rise"),
        "timing.wash50_after_peak_s": ("timing.wash50_after_peak_s", "s", "time from peak to the first frame below 50% (runs that reach it)"),
        "timing.end_rel": ("timing.end_rel", "fraction of peak", "count at the last frame relative to the rise"),
        "timing.run_s": ("timing.run_s", "s", "run length in seconds at the acquisition frame rate"),
        "timing.f10": ("timing.f10", "frames", "timing.py first appearance (10% of the rise) as a frame index at the run's frame rate"),
        "timing.f50": ("timing.f50", "frames", "timing.py 50% filling as a frame index"),
        "timing.f90": ("timing.f90", "frames", "timing.py 90% filling as a frame index"),
        "timing.rise_frames": ("timing.rise_frames", "frames", "timing.py rise 10-90% in frames"),
        "timing.peak_frame": ("timing.peak_frame", "frames", "timing.py frame index of the maximum opacified-pixel count"),
        "timing.wash50_after_peak": ("timing.wash50_after_peak", "frames", "timing.py frames from the peak to the first frame below 50% (runs that reach it)"),
        "timing.run_frames": ("timing.run_frames", "frames", "run length in frames (lossless npz holds the full run)"),
        "local_contrast.pre": ("local_contrast.pre", "grey levels", "99th percentile of (41 x 41 box mean - pixel) over the central 80%, pre-contrast frame 2"),
        "local_contrast.peak": ("local_contrast.peak", "grey levels", "as pre, maximum over frames 8-38 in steps of 4"),
        "opacified.area10": ("opacified.area10", "fraction", "m5_contrast.py: 128-px frames, central 76%; fraction of pixels > 10 levels below the pixelwise lightest of frames 0-2 at the frame of maximum mean darkening"),
        "opacified.area20": ("opacified.area20", "fraction", "as area10 with > 20 levels"),
        "opacified.peakD": ("opacified.peakD", "grey levels", "maximum over frames of the mean darkening below that baseline"),
        "heart_rate.bpm": ("heart_rate.hr_bpm", "beats/min", "m2_dynamics.py: autocorrelation period of the mean absolute frame difference (128 px), lag 0.33-1.5 s, accepted when the peak >= 0.25"),
        "motion_block.median": ("block_motion.median", "px/frame", "exhaustive SSD block matching (+-14 px) of the 10 highest-variance 24 x 24 blocks, frames 10-24: median over blocks per pair, median over pairs"),
        "motion_block.p90": ("block_motion.p90", "px/frame", "as median, 90th centile over pairs"),
        "motion_block.max": ("block_motion.max", "px/frame", "as median, maximum over pairs"),
    }
    arr_paths = {
        "arrival.arrival30_s": ("arrival30_s", "s", "run_analysis.py summary timing() on the harness signal: first frame at or above baseline (median of frames 0-1) + 30% of the rise"),
        "arrival.above50_s": ("above50_s", "s", "time with the signal at or above 50% of the rise"),
        "arrival.end3_ge50": ("end3_ge50", "fraction of runs", "share of runs whose last 3 frames average at or above 50% of the rise"),
        "arrival.at_frame0": ("arrival_at_frame0", "fraction of runs", "share of runs with arrival at frame 0 (contrast present in the first frame); audit: 0 of 1,314 runs"),
    }
    per_view = ("timing.", "local_contrast.", "opacified.", "motion_block.", "arrival.")
    for prof, pipe, ids in sel["sequence"]:
        series = {}
        for m, (path, unit, meth) in seq_paths.items():
            series[m] = (collect(results, "m_sequence", prof, pipe, ids, path), unit, meth)
        # arrival features derived from the cached per-frame signal (no re-measurement)
        idx = _index(results)
        for m, (key, unit, meth) in arr_paths.items():
            pairs = []
            for rid in ids:
                for res in idx.get(("m_sequence", prof, pipe, rid), []):
                    a = measure.arrival(res)
                    if a is not None:
                        pairs.append((rid, a.get(key)))
            series[m] = (pairs, unit, meth)
        for m, (pairs, unit, meth) in series.items():

            def add(pr, m=m, unit=unit, meth=meth, **kw):
                # 0/1 per-run indicators keep per-run values (so the band is p10-p90 of 0/1) and record
                # the share of runs; a capture run passes when its 0/1 value lies in the band
                vals = [v for _, v in pr if v is not None]
                extra = {"share_of_runs": round(sum(vals) / len(vals), 4)} if unit == "fraction of runs" and vals else None
                return tg.add(m, prof, pipe, pr, "0/1 per run" if extra else unit, meth, sc, extra=extra, **kw)

            add(pairs)
            if m.startswith(per_view) and prof != "cadica":
                for art in ("LCA", "RCA"):
                    add([(r, v) for r, v in pairs if artery_of(r) == art], artery=art)
                    # per view family (views.py rule): the scorecard prefers these when n >= 3
                    fams = sorted({family_of(prof, r) for r, _ in pairs if artery_of(r) == art and family_of(prof, r)})
                    for fam in fams:
                        add([(r, v) for r, v in pairs if artery_of(r) == art and family_of(prof, r) == fam], artery=art, view=fam)
    # ---- field edge
    for prof, pipe, ids in sel["field"]:
        kw = {"k": still_frame(prof)}
        for m, path, meth in (
            ("field.edge02_rel", "field.edge02_rel", "field.py bands: mean of the outer 0-2 px band minus the 16-32 px band, one early frame per run"),
            ("field.edge24_rel", "field.edge24_rel", "2-4 px band minus 16-32 px band"),
            ("field.edge816_rel", "field.edge816_rel", "8-16 px band minus 16-32 px band"),
            ("field.corner_rel", "field.corner_rel", "mean of the four 16 x 16 corners minus the 16-32 px band"),
        ):
            tg.add(m, prof, pipe, collect(results, "m_field", prof, pipe, ids, path, kw=kw), "grey levels", meth, sc)
        se = collect(results, "m_field", prof, pipe, ids, "frame", kw=kw)
        n_edges = sum(1 for rid in ids if (results.get(("m_field", prof, pipe, rid, json.dumps(kw, sort_keys=True))) or {}).get("straight_edges"))
        if se:
            tg.add("field.straight_edge_runs", prof, pipe, [("all", n_edges / len(se))], "fraction of runs", "field.py straight-edge detector (|median 4-px difference| >= 4 with >= 70% sign agreement over a full row or column)", sc)
    # ---- grey percentiles per view family (cd-ds and cd-main pooled, as m7_pct.py)
    m7 = sels["m7"]
    for (art, fam), members in m7.items():
        for q in ("p5", "p50", "p95"):
            pairs = []
            for prof, rid in members:
                r = results.get(("m_pct", prof, "matched", rid, json.dumps({}, sort_keys=True)))
                if r and "error" not in r:
                    pairs.append((rid, r.get(q)))
            tg.add(f"grey.{q}", "cd-ds+cd-main", "matched", pairs, "grey level", f"m7_pct.py: {q} of the mid-run frame inside a 12% margin; first 25 runs per view family in index order", sc, artery=art, view=fam)
    # ---- hand-picked audit jobs
    groups = {}
    for job in JOBS:
        prof = "cadica" if job.get("src") == "cadica" else "cd-ds"
        for pipe in ("lossless", "matched"):
            r = results.get(T("m_job", prof, pipe, job["run"], job=job))
            if job.get("use", True):
                groups.setdefault((job["kind"], job["group"], prof, pipe), []).append((job, r))
    job_fields = {
        "vessel": ["fwhm_px", "depth", "w80_w20", "edge10_90_px", "halo"],
        "catheter": ["outer_fwhm_px", "wall_sep_px", "lumen_contrast", "depth"],
        "edge": ["overshoot", "overshoot_rel_step", "overshoot_peak_px", "undershoot", "drop_peak_to_6px", "step", "rise_10_90_px"],
        "xtrack": ["range_px", "step_median", "step_p90", "step_max"],
    }
    meth = {
        "vessel": "vessel.py on hand-picked polylines (audit jobs): profiles every 1.5 px, re-centred, bg 11-17 px; medians per job",
        "catheter": "cath.py on hand-picked unfilled catheter segments: centroid-aligned mean profile",
        "edge": "edge2.py on hand-drawn borders: smoothed border location, mean profile +-40 px, bright side negative",
        "xtrack": "xtrack.py cross-section tracking on hand-picked scan lines, forward and backward from the picked frame (px per frame at 15 frames/s)",
    }
    for (kind, grp, prof, pipe), items in sorted(groups.items()):
        for fld in job_fields[kind]:
            pairs = [(j["name"], dig(r, fld)) for j, r in items if r and "error" not in r]
            unit = "px" if fld.endswith("px") else "grey levels" if fld in ("depth", "halo", "lumen_contrast", "overshoot", "undershoot", "step", "drop_peak_to_6px") else "px/frame" if fld.startswith("step") else "ratio"
            tg.add(f"{kind}.{grp}.{fld}", prof, pipe, pairs, unit, meth[kind], sc, extra={"jobs": [j["name"] for j, r in items]})
            if kind == "xtrack":
                # per view family of the job's run (hand-picked lines: small n, mostly indicative)
                byfam = {}
                for j, r in items:
                    if r and "error" not in r:
                        fam = family_of(prof, j["run"])
                        if fam:
                            byfam.setdefault((artery_of(j["run"]) or "any", fam), []).append((j["name"], dig(r, fld)))
                for (art, fam), pr in sorted(byfam.items()):
                    tg.add(f"{kind}.{grp}.{fld}", prof, pipe, pr, unit, meth[kind], sc, artery=art, view=fam, extra={"jobs": [n for n, _ in pr]})
    # ---- centre-line geometry and motion in mm (anatomy-motion audit result files; geometry.py)
    tg.geometry_notes = geometry.add_targets(tg)
    return tg


# ---------------------------------------------------------------------------
# reproduction of the audit's published values on the audit's own selections
# ---------------------------------------------------------------------------
def reproduction(results, sels):
    rows = []

    def check(what, audit, value, tol=0.05, atol=0.0, why=None):
        """Pass when |harness - audit| <= max(tol x |audit|, atol). atol is used only where the published
        value is rounded more coarsely than 5% (why says so); within_5pct records the strict 5% test."""
        ok = strict = None
        if value is not None and audit is not None:
            d = abs(value - audit)
            strict = d <= 0.05 * abs(audit) + 1e-9
            ok = d <= max(tol * abs(audit), atol) + 1e-9
        row = {"what": what, "audit": audit, "harness": None if value is None else round(value, 4), "tol": tol, "within_tol": ok, "within_5pct": strict}
        if atol:
            row["atol"] = atol
        if why:
            row["tol_reason"] = why
        rows.append(row)

    def vals(fn, prof, pipe, ids, path, kw=None):
        return [v for _, v in collect(results, fn, prof, pipe, ids, path, kw=kw) if v is not None]

    lm = imlib.lower_median
    v = vals("m_noise", "cd-ds", "lossless", S.AUDIT_NOISE_CDDS, "sigma_t_median")
    check("noise SD, Azurion lossless, median of 13 runs (grey levels)", 3.28, lm(v))
    v = vals("m_noise", "cd-ds", "lossless", S.AUDIT_NOISE_CDDS, "dark_bright_ratio")
    check("noise dark/bright ratio, median of 13 runs", 1.13, lm(v))
    v = vals("m_noise", "cd-ds", "lossless", S.AUDIT_NOISE_CDDS, "acf_h.0")
    check("noise lag-1 autocorrelation (horizontal), median", 0.30, lm(v))
    v = vals("m_noise", "cd-ds", "lossless", S.AUDIT_NOISE_CDDS, "rho_temporal")
    check("temporal noise correlation rho, median", 0.08, lm(v), atol=0.005, why="published to 2 decimals (0.08), so +-0.005")
    v = vals("m_noise", "cadica", "lossless", S.AUDIT_NOISE_CADICA, "sigma_t_median")
    check("noise SD, CADICA lossless, median of 10 runs", 2.0, lm(v))
    v = vals("m_noise", "cadica", "lossless", S.AUDIT_NOISE_CADICA, "acf_h.0")
    check("noise lag-1, CADICA, median", 0.575, lm(v))
    v = vals("m_settle", "cd-ds", "lossless", S.AUDIT_SETTLE_CDDS, "ratio_to_last.0")
    check("settling: first pair / pair 9-10, median of 20 runs", 1.48, lm(v))
    v = vals("m_still", "cd-ds", "lossless", S.AUDIT_TEXTURE_CDDS, "texture.bright.bandpass_rms", kw={"k": 2})
    check("lung band-pass 4-32 px RMS, bright tiles, median of 8 runs", 8.7, lm(v))
    v = vals("m_ridge", "cd-ds", "lossless", sels["timing"], "base")
    check("thin dark-line pixels pre-contrast, lower quartile (49 runs)", 10800, imlib.quantile(v, 0.25))
    check("thin dark-line pixels pre-contrast, upper quartile (49 runs)", 14100, imlib.quantile(v, 0.75))
    for path, audit, label in (("timing.f10", 6, "f10 frame"), ("timing.f50", 15, "f50 frame"), ("timing.f90", 29, "f90 frame"), ("timing.rise_frames", 19, "rise 10-90% (frames)"), ("timing.peak_frame", 32, "peak frame"), ("timing.frames_ge90", 5, "frames >= 90%"), ("timing.run_frames", 51, "run length (frames)"), ("timing.end_rel", 0.52, "end-of-run level / peak")):
        check(f"timing {label}, median of 49 runs", audit, lm(vals("m_sequence", "cd-ds", "lossless", sels["timing"], path)))
    v = vals("m_sequence", "cd-ds", "lossless", sels["timing"], "timing.wash50_after_peak")
    check("timing 50% washout after peak (frames), median of runs that reach it", 10, lm(v))
    check("runs reaching 50% washout (audit 28 of 49)", 28, len(v))
    for art, audit in (("LCA", 18), ("RCA", 29)):
        v = [x for r, x in collect(results, "m_sequence", "cd-ds", "lossless", sels["timing"], "timing.rise_frames") if artery_of(r) == art and x is not None]
        check(f"timing rise (frames), {art} median", audit, lm(v))
    m5 = sels["m5"]
    for prof, a10, a20, pk in (("cd-ds", None, None, None),):
        pass
    v10 = vals("m_sequence", "cd-ds", "matched", m5["cd-ds"], "opacified.area10")
    v20 = vals("m_sequence", "cd-ds", "matched", m5["cd-ds"], "opacified.area20")
    vD = vals("m_sequence", "cd-ds", "matched", m5["cd-ds"], "opacified.peakD")
    check("opacified area > 10 levels, median (cd-ds, m5 selection)", 0.225, imlib.median(v10))
    check("opacified area > 20 levels, median", 0.109, imlib.median(v20))
    check("peak mean darkening D, median", 7.34, imlib.median(vD))
    hr = vals("m_sequence", "cd-ds", "matched", sels["m2"]["cd-ds"], "heart_rate.hr_bpm")
    check("heart rate cd-ds, median (m2 selection)", 65.4, imlib.median(hr))
    check("runs with an accepted heart-rate period (audit 35 of 90)", 35, len(hr))
    # field mean-image bands = mean over runs of per-run bands (bands are linear in the image)
    for prof, pipe, kind, audit in (("cd-ds", "lossless", "Azurion", [137.4, 140.8, 143.9, 145.4, 145.1]), ("cadica", "lossless", "Siemens", [77.7, 85.7, 98.5, 117.6, 132.5]), ("cd-main", "matched", "Allura (cd-main JPEG)", [137.2, 144.4, 146.0, 145.1, 144.6]), ("angiocad", "matched", "AngioCAD", [39.0, 61.1, 78.8, 109.5, 131.4])):
        kw = {"k": still_frame(prof)}
        for b, a in zip(("0-2px", "2-4px", "4-8px", "8-16px", "16-32px"), audit):
            v = vals("m_field", prof, pipe, sels["field"][prof], f"field.bands.{b}", kw=kw)
            check(f"field mean-image band {b}, {kind}", a, sum(v) / len(v) if v else None)
    pct_audit = {("LCA", "RAO-CRA"): (94, 139, 219), ("LCA", "RAO-CAU"): (93, 132, 196), ("LCA", "LAO-CRA"): (98, 136, 197), ("LCA", "LAO-CAU"): (98, 145, 211), ("LCA", "AP-CRA"): (95, 129, 201), ("RCA", "LAO-0"): (93, 140, 197)}
    for g, aud in pct_audit.items():
        members = sels["m7"].get(g, [])
        for q, a in zip(("p5", "p50", "p95"), aud):
            v = []
            for prof, rid in members:
                r = results.get(("m_pct", prof, "matched", rid, json.dumps({}, sort_keys=True)))
                if r and "error" not in r:
                    v.append(r[q])
            check(f"grey {q} {g[0]} {g[1]} (median of {len(v)})", a, imlib.median(v))
    # hand-picked jobs (single values)
    jobs = {j["name"]: j for j in JOBS}

    def job(name, fld):
        j = jobs.get(name)
        if not j:
            return None
        prof = "cadica" if j.get("src") == "cadica" else "cd-ds"
        r = results.get(T("m_job", prof, "lossless", j["run"], job=j))
        return dig(r, fld) if r and "error" not in r else None

    for name, fw, dp, sh in (("LM_RAOcau", 9.6, 92, 0.41), ("LAD_prox_RAOcau", 7.6, 68, 0.35), ("LCx_RAOcau", 7.3, 47, 0.43), ("LAD_mid_APcra", 4.1, 39, 0.51), ("RCA_prox_LAO25", 5.1, 74, 0.34), ("RCA_mid_LAO25", 3.9, 48, 0.49), ("RCA_dist_LAO25", 4.0, 45, 0.43)):
        check(f"vessel {name} FWHM px", fw, job(name, "fwhm_px"))
        check(f"vessel {name} depth", dp, job(name, "depth"))
        check(f"vessel {name} w80/w20", sh, job(name, "w80_w20"))
    # the audit lists the three catheters as 01031 RAO caudal, 01048 RAO caudal, 01031 LAO cranial
    for name, fw, lum in (("real_cath_01031_RAOcau", 7.75, 25.5), ("real_cath_01048_RAOcau", 9.75, 12.8), ("real_cath_01031_LAOcra", 7.0, 2.8)):
        check(f"catheter {name} outer FWHM px", fw, job(name, "outer_fwhm_px"))
        check(f"catheter {name} lumen contrast", lum, job(name, "lumen_contrast"))
    for name, rng, med_, p90, mx in (("cd-01031-LCA-6:LAD_prox_x250", 31.2, 3.15, 6.62, 8.17), ("cd-01031-LCA-4:LAD_mid_y240", 31.2, 2.23, 8.8, 10.71), ("cd-01048-LCA-5:LAD_prox_x300", 15.9, 1.97, 4.34, 6.25), ("cd-01032-RCA-5:RCA_mid_y285", 45.5, 8.99, 12.16, 14.24), ("cd-01032-RCA-5:RCA_dist_x155", 27.8, 2.71, 8.34, 11.4), ("cd-01031-RCA-10:cath_shaft_y212", 15.0, 2.1, 4.13, 5.31)):
        check(f"motion {name} range px", rng, job(name, "range_px"))
        check(f"motion {name} step max", mx, job(name, "step_max"))
    # centre-line geometry and motion in mm from the anatomy audit's result files
    geometry.reproduction_rows(check)
    # contrast arrival: the audit's figure used a different signal (run_analysis.py vessel fraction on
    # 1,314 runs); the harness signal on its timing selection is compared for information only
    arr = []
    for rid in sels["timing"]:
        for res in _index(results).get(("m_sequence", "cd-ds", "lossless", rid), []):
            a = measure.arrival(res)
            if a and artery_of(rid) == "RCA":
                arr.append(a["arrival30_s"])
    rows.append({"what": "arrival 30% of rise, RCA median s (audit 0.67 s on a different signal; information only)", "audit": 0.67, "harness": round(imlib.median(arr), 3) if arr else None, "tol": None, "within_tol": None, "within_5pct": None, "information_only": True})
    return rows


def jpeg_effect(results, sels):
    """Same runs measured lossless (npz) and matched (sips JPEG q72 library frames): median ratios."""
    rows = []
    for fn, ids, path, label, kw in (
        ("m_noise", S.AUDIT_NOISE_CDDS, "sigma_t_median", "noise SD", None),
        ("m_noise", S.AUDIT_NOISE_CDDS, "acf_lag1", "noise lag-1", None),
        ("m_noise", S.AUDIT_NOISE_CDDS, "dark_bright_ratio", "dark/bright ratio", None),
        ("m_still", sels["timing"], "texture.bright.bandpass_rms", "lung band-pass RMS", {"k": 2}),
        ("m_ridge", sels["timing"], "base", "thin-line count", None),
        ("m_sequence", sels["timing"], "local_contrast.pre", "local contrast pre", None),
    ):
        a = dict(collect(results, fn, "cd-ds", "lossless", ids, path, kw=kw))
        b = dict(collect(results, fn, "cd-ds", "matched", ids, path, kw=kw))
        r = [b[k] / a[k] for k in a if k in b and a[k] and b[k] is not None]
        rows.append({"metric": label, "runs": len(r), "matched_over_lossless_median": round(imlib.median(r), 4) if r else None, "iqr": [round(imlib.quantile(r, 0.25), 4), round(imlib.quantile(r, 0.75), 4)] if r else None})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 2))
    ap.add_argument("--quick", action="store_true", help="first 6 runs of each selection (smoke test; does not write the targets file)")
    ap.add_argument("--out", default=imlib.TARGETS)
    a = ap.parse_args()
    sel, sels = plan(a.quick)
    tasks = build_tasks(sel)
    print(f"library measurement: {len(set(tasks))} tasks on {a.jobs} workers", flush=True)
    results = execute(tasks, a.jobs)
    # exceptions are errors; method-level outcomes ("too few static blocks", "run has 1 frame") are skips
    errors = [(t[0], t[1], t[2], t[3], r["error"]) for t, r in results.items() if isinstance(r, dict) and "error" in r and "Error" in r["error"]]
    skipped = [(t[0], t[1], t[2], t[3], r["error"]) for t, r in results.items() if isinstance(r, dict) and "error" in r and "Error" not in r["error"]]
    tg = aggregate(results, sel, sels)
    rep = reproduction(results, sels)
    doc = {
        "version": 1,
        "generated": datetime.datetime.now().isoformat(timespec="seconds"),
        "generator": "scripts/realism/targets.py (bash scripts/realism/run_all.sh --library-only)",
        "frame": "All pixel quantities refer to 512 x 512 frames: the CoronaryDominance and CADICA frames as resized by the dataset authors; simulator captures are cropped to the collimated field and bilinearly resampled to 512 x 512 by the harness.",
        "pipelines": PIPE_NOTE,
        "profiles": {
            "cd-ds": "CoronaryDominance domain-shift subset (metadata: Philips Allura Clarity / Azurion, 15 frames/s)",
            "cd-main": "CoronaryDominance main subset (same metadata; noise differs from cd-ds, so kept apart)",
            "cadica": "CADICA (metadata: Siemens Artis Zee, 10 frames/s)",
            "angiocad": "AngioCAD (system and frame rate not stated); spatial metrics only, excluded from all temporal targets",
            "cd-ds+cd-main": "both CoronaryDominance subsets pooled (grey percentiles, as m7_pct.py)",
        },
        "viewFamilies": {"threshold_deg": FAMILY_THRESHOLD_DEG, "rule": "LAO/RAO when |primary| >= 15 deg else AP; CRA/CAU when |secondary| >= 15 deg else 0 (scripts/realism/views.py)"},
        "bandRule": "p10-p90 of per-run values when n >= 10, otherwise the observed range",
        "temporalExclusions": ["angiocad"],
        "targets": tg.items,
        "reproduction": rep,
        "jpegEffect": jpeg_effect(results, sels),
        "geometryNotes": getattr(tg, "geometry_notes", {}),
        "errors": errors[:200],
        "skipped": skipped[:400],
    }
    ok = sum(1 for r in rep if r["within_tol"])
    n_checked = sum(1 for r in rep if r["within_tol"] is not None)
    print(f"\nreproduction of audit values: {ok}/{n_checked} within tolerance ({len(rep) - n_checked} rows information only or without a value)")
    for r in rep:
        flag = "ok " if r["within_tol"] else ("-- " if r["within_tol"] is None else "XX ")
        print(f"  {flag} {r['what']}: audit {r['audit']}  harness {r['harness']}")
    print(f"{len(tg.items)} targets; {len(errors)} task errors; {len(skipped)} tasks skipped by method rules")
    if a.quick:
        out = os.path.join(imlib.CACHE, "realism_targets.quick.json")
    else:
        out = a.out
    imlib.save_json(out, doc)
    print("wrote", imlib.rel(out))


if __name__ == "__main__":
    sys.exit(main())
