"""
Run-level measurements: each function takes a Run (sources.py) and returns a JSON-able dict. The
same functions measure library runs and simulator captures. Results are cached per run under
datasets/tmp/realism/results/<metric>/ (delete the folder to force a re-measure).
"""

import hashlib
import json
import os

import imlib
import metrics

RESULTS = os.path.join(imlib.CACHE, "results")
VERSION = 3  # bump to invalidate cached results when a method changes


def _cache_path(metric, run, extra=""):
    h = hashlib.sha1(f"{VERSION}|{metric}|{run.key}|{extra}|{getattr(run, '_stamp', '')}".encode()).hexdigest()[:16]
    safe = run.key.replace("/", "_").replace(":", "_")
    return os.path.join(RESULTS, metric, f"{safe}__{h}.json")


def cached(metric, run, fn, extra="", use_cache=True):
    p = _cache_path(metric, run, extra)
    if use_cache:
        r = imlib.load_json(p)
        if r is not None and not (isinstance(r, dict) and "error" in r and "Error" in r["error"]):
            return r  # cached result (exceptions are retried; method-level "no result" outcomes are kept)
    try:
        r = fn()
    except Exception as e:  # a failed run is recorded, not fatal
        r = {"error": f"{type(e).__name__}: {e}"}
    imlib.save_json(p, r, indent=None)
    return r


def _sparse(run, idx):
    """Frames at the given indices as a list indexable by frame number (None elsewhere)."""
    n = run.n()
    idx = sorted({i for i in idx if 0 <= i < n})
    fr = run.frames(idx)
    out = [None] * n
    for i, f in zip(idx, fr):
        out[i] = f
    return out


def m_noise(run):
    def f():
        n = run.n()
        ks = [k for k in metrics.NOISE_PAIRS if k + 1 < n]
        need = set()
        for k in ks:
            need.update((k - 1, k, k + 1))
        r = metrics.noise(_sparse(run, need), ks)
        if r is None:
            return {"error": "too few static blocks or frames"}
        return r

    return cached("noise", run, f)


def m_settle(run):
    return cached("settle", run, lambda: metrics.settle(run.frames(list(range(11)))) or {"error": "fewer than 11 frames"})


def m_still(run, k=2):
    """Pre-contrast single-frame metrics on frame k: texture terciles, 256-px spectrum, automatic border
    halo, thin dark-line count."""

    def f():
        if run.n() <= k:
            return {"error": f"run has {run.n()} frame(s); frame index {k} needed"}
        img = run.frames([k])[0]
        return {"frame": k, "texture": metrics.texture(img), "spectrum": metrics.spectrum256(img), "edge_auto": metrics.edge_auto(img), "ridges": metrics.ridges(img)}

    return cached("still", run, f, extra=str(k))


def m_ridge(run):
    """ridge.py base: median ridge count over pre-contrast frames 1-3."""

    def f():
        c = [metrics.ridges(img) for img in run.frames([1, 2, 3])]
        tot = sorted(sum(x) for x in c)
        return {"counts": c, "base": tot[len(tot) // 2]}

    return cached("ridge", run, f)


def m_sequence(run, fps=None, pre_k=2):
    """Whole-run metrics: contrast timing, local contrast, opacified area, heart rate, mid-run grey
    percentiles, block-matching motion and the thin-line count at the peak frame.

    pre_k: frame index of the pre-contrast local-contrast measure (library: 2, as the audit). None when the
    run has no pre-contrast frame (a capture whose bolus starts with the first frame): the "pre" value is
    then reported as null rather than measured on an opacified frame."""

    def f():
        fr = run.frames()
        if len(fr) < 6:
            return {"error": "fewer than 6 frames"}
        rate = fps or run.fps
        sig = [metrics.timing_signal(img) for img in fr]
        out = {"n": len(fr), "fps": rate}
        out["timing"] = metrics.timing_features([c for _, c in sig], rate)
        out["timing_all"] = metrics.timing_features([s for s, _ in sig], rate)
        out["signal_major"] = [c for _, c in sig]
        pre = metrics.local_contrast_p99(fr[min(pre_k, len(fr) - 1)]) if pre_k is not None else None
        peaks = [(metrics.local_contrast_p99(fr[k]), k) for k in range(8, min(39, len(fr)), 4)]
        out["local_contrast"] = {"pre": None if pre is None else round(pre, 2), "pre_frame": pre_k, "peak": round(max(peaks)[0], 2) if peaks else None, "peak_frame": max(peaks)[1] if peaks else None}
        out["opacified"] = metrics.opacified(fr)
        out["heart_rate"] = metrics.heart_rate(fr, rate) if rate else None
        out["pct_mid"] = metrics.grey_percentiles(fr[len(fr) // 2])
        out["block_motion"] = metrics.block_motion(fr)
        if out["timing"]:
            pk = out["timing"]["peak_frame"]
            out["ridges_peak"] = metrics.ridges(fr[pk])
        return out

    # the default pre-contrast frame keeps the original cache key, so library results stay valid
    return cached("sequence", run, f, extra=str(fps) if pre_k == 2 else f"{fps}|pre{pre_k}")


def arrival(seq):
    """Contrast arrival features from a cached m_sequence result (its per-frame opacified-pixel signal),
    so the library does not need re-measuring. See metrics.arrival_features."""
    if not isinstance(seq, dict) or "error" in seq or not seq.get("signal_major"):
        return None
    return metrics.arrival_features(seq["signal_major"], seq.get("fps"))


def m_pct(run):
    """m7_pct.py: grey percentiles of the mid-run frame."""

    def f():
        n = run.n()
        return metrics.grey_percentiles(run.frames([n // 2])[0])

    return cached("pct", run, f)


def m_field(run, k=2, which=None):
    def f():
        if run.n() <= k:
            return {"error": f"run has {run.n()} frame(s); frame index {k} needed"}
        img = run.frames([k], which=which)[0] if which else run.frames([k])[0]
        return {"frame": k, "field": metrics.field_edge(img), "rings": metrics.ring_profile(img), "straight_edges": metrics.straight_edges(img)}

    return cached("field", run, f, extra=f"{k}|{which}")


def m_job(run, job):
    """A hand-picked audit job (vessel / catheter / edge / xtrack) on this run's pipeline."""

    def f():
        kind = job["kind"]
        if kind == "xtrack":
            idx = list(range(job["f0"], job["f1"] + 1))
            fr = run.frames(idx)
            x, y, dx, dy = job["line"]
            r = metrics.track_stats(fr, job["fk"] - job["f0"], x, y, dx, dy, search=job.get("search", 14))
            return r or {"error": "track lost"}
        fr = run.frames(job["frames"])
        if kind == "vessel":
            return metrics.vessel_profiles(fr, job["pts"], notrack=job.get("notrack", False), half=job.get("half", 18)) or {"error": "no profiles"}
        if kind == "catheter":
            return metrics.catheter_profile(fr, job["pts"]) or {"error": "no profiles"}
        if kind == "edge":
            r = metrics.edge_polyline(fr, job["poly"])
            return r or {"error": "no edge"}
        return {"error": f"unknown kind {kind}"}

    return cached("job", run, f, extra=json.dumps(job, sort_keys=True))
