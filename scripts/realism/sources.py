"""
Run sources for the realism harness: library runs (lossless or matched pipeline) and simulator
capture sets, behind one interface so every metric sees identical 512 x 512 frames.

Profiles (named by dataset, not by product line: both CoronaryDominance subsets list
"Philips Allura Clarity / Azurion" in their metadata, so the two cannot be told apart):
  cd-ds     CoronaryDominance domain-shift subset (datasets/library/dominance); lossless npz exists
  cd-main   CoronaryDominance main subset (datasets/library/dominance-main); JPEG only
  cadica    CADICA (Siemens Artis Zee per its metadata); lossless PNG exists
  angiocad  AngioCAD (system and frame rate not stated); JPEG only, never used for temporal targets
  sim       simulator capture sets (datasets/tmp/captures/<set>/)
"""

import glob
import json
import os
import re
import struct

import imlib
import metrics
from views import family

PROFILE_DIRS = {"cd-ds": "dominance", "cd-main": "dominance-main", "cadica": "cadica", "angiocad": "angiocad"}
LOSSLESS = {"cd-ds", "cadica"}
# acquisition frame rates from the dataset metadata (index.json "system" field); AngioCAD: not stated
FPS = {"cd-ds": 15, "cd-main": 15, "cadica": 10, "angiocad": None}

_INDEX = {}


def library_index(profile):
    """List of run dicts {id, artery, angles, fps, frames, tags, patient} for a profile, in index order."""
    if profile not in _INDEX:
        d = imlib.load_json(os.path.join(imlib.LIB, PROFILE_DIRS[profile], "index.json"), {"patients": []})
        runs = []
        for p in d["patients"]:
            for r in p["runs"]:
                rr = dict(r)
                rr["patient"] = p["id"]
                rr["dir"] = r.get("dir", r["id"])
                runs.append(rr)
        _INDEX[profile] = runs
    return _INDEX[profile]


class Run:
    """One cine run as 512 x 512 frames through one pipeline."""

    def __init__(self, profile, pipeline, rid, fps, artery=None, angles=None, nframes=None, meta=None):
        self.profile = profile
        self.pipeline = pipeline
        self.id = rid
        self.fps = fps
        self.artery = artery
        self.angles = angles
        self.family = family(angles) if angles else None
        self._n = nframes
        self.meta = meta or {}

    @property
    def key(self):
        return f"{self.profile}:{self.pipeline}:{self.id}"

    def n(self):
        return self._n

    def frames(self, idx=None):
        raise NotImplementedError

    def describe(self):
        return {"id": self.id, "profile": self.profile, "pipeline": self.pipeline, "artery": self.artery, "family": self.family, "angles": self.angles, "fps": self.fps}


class LibraryRun(Run):
    def __init__(self, profile, pipeline, entry):
        if pipeline == "lossless" and profile not in LOSSLESS:
            raise ValueError(f"no lossless source for {profile}")
        a = entry.get("angles")
        angles = (a["primary"], a["secondary"]) if a else None
        super().__init__(profile, pipeline, entry["id"], FPS[profile], entry.get("artery"), angles, len(entry["frames"]))
        self.entry = entry
        self._cache = {}

    def n(self):
        if self.pipeline == "lossless" and self.profile == "cadica":
            return len(imlib.cadica_frames(self.id))
        if self.pipeline == "lossless" and self.profile == "cd-ds":
            if "n" not in self._cache:
                # the npz holds the full run (the JPEG library is truncated at 120 frames)
                fr, meta = imlib.load_npz_run(self.id, frames=[])
                self._cache["n"] = meta["nframes"]
            return self._cache["n"]
        return self._n

    def frames(self, idx=None):
        n = self.n()
        idx = list(range(n)) if idx is None else [i for i in idx if 0 <= i < n]
        if self.pipeline == "lossless":
            if self.profile == "cd-ds":
                fr, _ = imlib.load_npz_run(self.id, frames=idx)
                return fr
            names = imlib.cadica_frames(self.id)
            p, v = self.id.split("_")
            out = []
            for i in idx:
                w, h, px = imlib.read_png_gray(os.path.join(imlib.CADICA_ROOT, p, v, "input", names[i]))
                img = imlib.to_f(px)
                out.append(img if (w, h) == (512, 512) else imlib.resample512(img, w, h))
            return out
        base = os.path.join(imlib.LIB, PROFILE_DIRS[self.profile], self.entry["dir"])
        paths = [os.path.join(base, self.entry["frames"][i]) for i in idx]
        out = []
        for w, h, px in imlib.decode_many(paths):
            img = imlib.to_f(px)
            out.append(img if (w, h) == (512, 512) else imlib.resample512(img, w, h))
        return out


def library_run(profile, pipeline, rid):
    for e in library_index(profile):
        if e["id"] == rid:
            return LibraryRun(profile, pipeline, e)
    raise KeyError(rid)


# ---------------------------------------------------------------------------
# simulator capture sets
# ---------------------------------------------------------------------------
META_MAGIC = b"XCMETA1\n"


def read_meta_png(path):
    """Capture metadata travels as a grey PNG whose pixel bytes are XCMETA1\\n + 8-digit length + JSON
    (the dev server's capture endpoint accepts only .png); see src/dev/xrayCapture.ts encodeMetaPng."""
    w, h, px = imlib.read_png_gray(path)
    if not px.startswith(META_MAGIC):
        raise ValueError(f"not a capture metadata file: {path}")
    n = int(px[len(META_MAGIC) : len(META_MAGIC) + 8])
    o = len(META_MAGIC) + 8
    return json.loads(px[o : o + n].decode("utf-8"))


def gather_set(name):
    """Move flat captures datasets/tmp/captures/<set>__*.png into datasets/tmp/captures/<set>/ (the dev
    endpoint cannot write sub-folders) and return the folder."""
    d = os.path.join(imlib.CAPTURES, name)
    os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(imlib.CAPTURES, f"{name}__*.png")):
        os.replace(f, os.path.join(d, os.path.basename(f)[len(name) + 2 :]))
    return d


def capture_sequences(name):
    """{sequence name: (meta or None, [frame paths in order])} for a capture set."""
    d = gather_set(name)
    seqs = {}
    for f in sorted(os.listdir(d)):
        m = re.match(r"^(.*)_f(\d{3,4})\.png$", f)
        if m:
            seqs.setdefault(m.group(1), [None, []])[1].append((int(m.group(2)), os.path.join(d, f)))
    for f in sorted(os.listdir(d)):
        if f.endswith(".meta.png"):
            s = f[: -len(".meta.png")]
            if s in seqs:
                seqs[s][0] = read_meta_png(os.path.join(d, f))
    return {k: (v[0], [p for _, p in sorted(v[1])]) for k, v in seqs.items()}


class CaptureRun(Run):
    """A captured simulator sequence. Matched pipeline: crop the collimated border (field box of the mean
    frame), bilinear resample to 512, round to 8 bit, sips JPEG q72, decode: the library's encoding.
    Lossless pipeline: the same crop and resample without JPEG. `full512` gives the uncropped canvas
    resampled to 512 (used only by the field-edge metric)."""

    def __init__(self, set_name, seq, meta, paths, pipeline="matched"):
        meta = meta or {}
        spec = meta.get("spec", {})
        ca = meta.get("cArm") or spec.get("cArm")
        angles = (ca["laoRao"], ca["cranialCaudal"]) if ca else None
        super().__init__("sim", pipeline, f"{set_name}/{seq}", meta.get("fps", spec.get("fps", 15)), meta.get("artery"), angles, len(paths), meta)
        self.paths = paths
        self.set_name = set_name
        self.seq = seq
        self._conv = None
        # result-cache stamp: changes whenever the capture files change
        self._stamp = imlib.hashlib.sha1("|".join(f"{p}:{os.path.getmtime(p)}" for p in paths).encode()).hexdigest()[:16]

    def _native(self):
        out = []
        for p in self.paths:
            w, h, px = imlib.read_png_gray(p)
            out.append((w, h, imlib.to_f(px)))
        return out

    def box(self):
        """In-field box (native px) and native size; cached in the metadata cache."""
        if self._conv is None:
            self._convert()
        return self._conv["box"], self._conv["size"]

    def _cache_dir(self):
        h = imlib.hashlib.sha1("|".join(f"{p}:{os.path.getmtime(p)}" for p in self.paths).encode()).hexdigest()[:16]
        return os.path.join(imlib.CACHE, "cap", f"{self.set_name}__{self.seq}__{h}")

    def _convert(self):
        d = self._cache_dir()
        info = imlib.load_json(os.path.join(d, "info.json"))
        if info and os.path.exists(os.path.join(d, "matched.u8")) and (os.path.exists(os.path.join(d, "lossless.f4")) or os.path.exists(os.path.join(d, "lossless.f8"))):
            self._conv = info
            return
        os.makedirs(d, exist_ok=True)
        nat = self._native()
        w, h = nat[0][0], nat[0][1]
        meanimg = imlib.array.array("d", bytes(8 * w * h))
        for _, _, img in nat:
            meanimg = imlib.array.array("d", map(float.__add__, meanimg, img))
        meanimg = imlib.array.array("d", [v / len(nat) for v in meanimg])
        x0, y0, x1, y1 = metrics.field_box(meanimg, w, h)
        cw, ch = x1 - x0, y1 - y0
        loss = []
        for _, _, img in nat:
            c = imlib.crop(img, x0, y0, cw, ch, w)
            loss.append(imlib.resample512(c, cw, ch))
        matched = imlib.jpeg_roundtrip_many([imlib.to_u8(f) for f in loss])
        with open(os.path.join(d, "matched.u8"), "wb") as f:
            f.write(b"".join(matched))
        # lossless frames as float32 (C1, wave 2: the bilinear resample of 8-bit captures needs no more
        # precision, and float64 caches cost 1.7 GB per capture set); the uncropped canvas resample
        # ("full", field-edge metric only) is computed on demand from the PNGs instead of being cached
        with open(os.path.join(d, "lossless.f4"), "wb") as f:
            for a in loss:
                f.write(imlib.array.array("f", a).tobytes())
        self._conv = {"box": [x0, y0, x1, y1], "size": [w, h], "n": len(nat)}
        imlib.save_json(os.path.join(d, "info.json"), self._conv)

    def frames(self, idx=None, which=None):
        if self._conv is None:
            self._convert()
        n = self._conv["n"]
        idx = list(range(n)) if idx is None else [i for i in idx if 0 <= i < n]
        which = which or self.pipeline
        d = self._cache_dir()
        out = []
        if which == "matched":
            with open(os.path.join(d, "matched.u8"), "rb") as f:
                b = f.read()
            for i in idx:
                out.append(imlib.to_f(b[i * 262144 : (i + 1) * 262144]))
        elif which == "lossless":
            f4 = os.path.join(d, "lossless.f4")
            wide = not os.path.exists(f4)  # caches written before C1 hold float64
            with open(os.path.join(d, "lossless.f8") if wide else f4, "rb") as f:
                b = f.read()
            nb = 8 if wide else 4
            for i in idx:
                a = imlib.array.array("d" if wide else "f")
                a.frombytes(b[i * 262144 * nb : (i + 1) * 262144 * nb])
                out.append(a if wide else imlib.array.array("d", a))
        else:
            for i in idx:
                w, h, px = imlib.read_png_gray(self.paths[i])
                out.append(imlib.resample512(imlib.to_f(px), w, h))
        return out

    def to512(self, x, y):
        """Native canvas px -> 512 analysis px (crop then the resample512 mapping)."""
        (x0, y0, x1, y1), _ = self.box()
        cw, ch = x1 - x0, y1 - y0
        return ((x - x0) * 511 / (cw - 1.01), (y - y0) * 511 / (ch - 1.01))

    def scale512(self):
        """512 analysis px per native px."""
        (x0, y0, x1, y1), _ = self.box()
        return 511 / (x1 - x0 - 1.01)


def capture_runs(name, pipeline="matched"):
    return [CaptureRun(name, seq, meta, paths, pipeline) for seq, (meta, paths) in sorted(capture_sequences(name).items()) if paths]
