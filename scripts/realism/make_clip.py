"""
Simulated clips for the "Real or simulated?" drill (src/ui/angio/RealOrSimDrill.tsx).

  python3 scripts/realism/make_clip.py plan [--per-family 3] [--seed 5]
      choose real CoronaryDominance runs (clean: no artefact, occlusion or uncertain tags) balanced over
      view families and write datasets/library/sim-clips/plan.json: for each pair the real run, its exact
      C-arm angles, frame count and frame rate, and its measured heart rate.
  (browser, development build)   await window.__xrayCapture.drill("drill")
      films the simulated half of every pair at the same angles (src/dev/xrayCapture.ts).
  python3 scripts/realism/make_clip.py build drill
      converts the capture sequences into clips through the library's own encoding: crop to the collimated
      field, bilinear resample to 512 x 512, 8-bit, `sips -s format jpeg -s formatOptions 72` per frame
      (scripts/angio_library/common.py), writes datasets/library/sim-clips/<id>/fNNN.jpg and index.json.
  python3 scripts/realism/make_clip.py verify
      checks every clip against its real run: angles within 1 degree, same frame rate, same frame count.

Any capture sequence can also be turned into a clip: build <set> uses every sequence of the set; sequences
without a paired real run are written with realRun = null (the drill skips them).
"""

import argparse
import datetime
import os
import random
import shutil
import subprocess
import sys
import tempfile

import imlib
import metrics
import sources
from views import family

CLIPS = os.path.join(imlib.LIB, "sim-clips")
MAX_FRAMES = 90
FAMILIES = {
    "LCA": ["RAO-CAU", "AP-CRA", "LAO-CRA", "RAO-CRA", "LAO-CAU", "AP-0", "AP-CAU"],
    "RCA": ["LAO-0", "RAO-0", "LAO-CRA", "AP-CRA"],
}


def _target_median(doc, metric, profile, pipeline):
    for t in doc.get("targets", []):
        if t["metric"] == metric and t["profile"] == profile and t["pipeline"] == pipeline and t["artery"] == "any" and t["view"] == "any":
            return t["median"]
    return None


def plan(per_family, seed):
    doc = imlib.load_json(imlib.TARGETS, {})
    inj = _target_median(doc, "timing.f10_s", "cd-ds", "lossless")
    hr_med = _target_median(doc, "heart_rate.bpm", "cd-ds", "matched")
    if inj is None or hr_med is None:
        sys.exit("realism_targets.json is missing timing.f10_s or heart_rate.bpm: run the library measurement first")
    rng = random.Random(seed)
    pool = {}
    for prof in ("cd-ds", "cd-main"):
        for e in sources.library_index(prof):
            a = e.get("angles")
            tags = e.get("tags") or {}
            if not a or e.get("artery") not in ("LCA", "RCA") or len(e["frames"]) < 30 or e.get("fps") != 15:
                continue
            if any(tags.get(k) for k in ("artefact", "occlusion", "uncertain")):
                continue
            fam = family((a["primary"], a["secondary"]))
            pool.setdefault((e["artery"], fam), []).append((prof, e))
    items = []
    for art, fams in FAMILIES.items():
        for fam in fams:
            cands = pool.get((art, fam), [])
            rng.shuffle(cands)
            for prof, e in cands[:per_family]:
                n = min(len(e["frames"]), MAX_FRAMES)
                # heart rate of this run from its own frames (m2_dynamics.py method); library median if no clear period
                run = sources.LibraryRun(prof, "matched", e)
                fr = run.frames(list(range(n)))
                hr = metrics.heart_rate(fr, 15).get("hr_bpm")
                items.append({
                    "id": f"sim-{e['id']}",
                    "realRun": e["id"],
                    "realProfile": prof,
                    "artery": art,
                    "angles": {"primary": e["angles"]["primary"], "secondary": e["angles"]["secondary"]},
                    "family": fam,
                    "nFrames": n,
                    "fps": 15,
                    "heartRate": round(hr if hr and 40 <= hr <= 130 else hr_med, 1),
                    "hrSource": "this run (autocorrelation of frame differences)" if hr and 40 <= hr <= 130 else "library median (no clear period in this run)",
                })
    os.makedirs(CLIPS, exist_ok=True)
    doc_out = {
        "created": datetime.datetime.now().isoformat(timespec="seconds"),
        "note": "Pairs for the Real or simulated? drill. The simulated run is filmed at the real run's exact angles, frame count and frame rate.",
        "injectionAt": round(inj, 3),
        "injectionAtSource": "median first-appearance time (timing.f10_s, cd-ds lossless) in datasets/library/realism_targets.json",
        "items": items,
    }
    imlib.save_json(os.path.join(CLIPS, "plan.json"), doc_out)
    print(f"wrote {imlib.rel(os.path.join(CLIPS, 'plan.json'))}: {len(items)} pairs; injection at {inj:.2f} s")


def _convert(task):
    set_name, seq = task
    meta, paths = sources.capture_sequences(set_name)[seq]
    sources.CaptureRun(set_name, seq, meta, paths, "lossless").box()
    return seq


def build(set_name, jobs=None):
    seqs = sources.capture_sequences(set_name)
    if not seqs:
        sys.exit(f"no captures in datasets/tmp/captures/{set_name}/")
    # crop, resample and encode every sequence in parallel first (cached under datasets/tmp/realism/cap)
    from multiprocessing import Pool

    with Pool(jobs or max(1, (os.cpu_count() or 2) - 2)) as pool:
        pool.map(_convert, [(set_name, s) for s in sorted(seqs) if seqs[s][0]])
    index_path = os.path.join(CLIPS, "index.json")
    index = imlib.load_json(index_path, {"clips": []})
    by_id = {c["id"]: c for c in index.get("clips", [])}
    for seq, (meta, paths) in sorted(seqs.items()):
        if not meta:
            print(f"skip {seq}: no metadata")
            continue
        run = sources.CaptureRun(set_name, seq, meta, paths, "lossless")
        frames = run.frames(which="lossless")
        note = (meta.get("spec") or {}).get("note") or {}
        real = note.get("realRun")
        cid = seq if seq.startswith("sim-") else f"sim-{seq}"
        out = os.path.join(CLIPS, cid)
        if os.path.isdir(out):
            shutil.rmtree(out)
        os.makedirs(out)
        with tempfile.TemporaryDirectory(dir=imlib.CACHE) as td:
            pngs = []
            for i, f in enumerate(frames):
                p = os.path.join(td, f"f{i + 1:03d}.png")
                imlib.write_png_gray(p, 512, 512, imlib.to_u8(f))
                pngs.append(p)
            for c in range(0, len(pngs), 64):
                subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(imlib.JPEG_QUALITY), *pngs[c : c + 64], "--out", out], check=True, capture_output=True)
        names = sorted(f for f in os.listdir(out) if f.endswith(".jpg"))
        ca = meta.get("cArm") or {}
        by_id[cid] = {
            "id": cid,
            "realRun": real,
            "artery": meta.get("artery"),
            "angles": {"primary": ca.get("laoRao"), "secondary": ca.get("cranialCaudal")},
            "family": family((ca.get("laoRao"), ca.get("cranialCaudal"))) if ca else None,
            "fps": meta.get("fps"),
            "frames": names,
            "captureSet": set_name,
            "created": meta.get("created"),
            "spec": {k: (meta.get("spec") or {}).get(k) for k in ("scenario", "fieldCm", "mode", "heartRate", "injection", "seed", "res")},
        }
        print(f"{cid}: {len(names)} frames")
    index = {
        "dataset": "CathMaster simulator clips",
        "pipeline": "crop to the collimated field, bilinear resample to 512 x 512, 8-bit, sips JPEG quality 72 per frame (the library encoding)",
        "generator": "scripts/realism/make_clip.py",
        "updated": datetime.datetime.now().isoformat(timespec="seconds"),
        "clips": sorted(by_id.values(), key=lambda c: c["id"]),
    }
    imlib.save_json(index_path, index)
    print(f"wrote {imlib.rel(index_path)}: {len(index['clips'])} clips")
    return verify()


def _dqt(path):
    """JPEG quantisation tables (DQT segments) of a file: identical tables mean the same encoder and quality."""
    with open(path, "rb") as f:
        d = f.read()
    i, out = 2, []
    while i + 4 <= len(d) and d[i] == 0xFF:
        m = d[i + 1]
        L = int.from_bytes(d[i + 2 : i + 4], "big")
        if m == 0xDB:
            out.append(d[i + 4 : i + 2 + L])
        if m == 0xDA:
            break
        i += 2 + L
    return out


def verify():
    index = imlib.load_json(os.path.join(CLIPS, "index.json"), {"clips": []})
    real = {}
    for prof in ("cd-ds", "cd-main"):
        for e in sources.library_index(prof):
            real[e["id"]] = e
    bad = 0
    for c in index["clips"]:
        e = real.get(c.get("realRun"))
        problems = []
        if not e:
            problems.append("no paired real run")
        else:
            a = e.get("angles") or {}
            if abs(a.get("primary", 1e9) - c["angles"]["primary"]) > 1 or abs(a.get("secondary", 1e9) - c["angles"]["secondary"]) > 1:
                problems.append(f"angles {c['angles']} vs real {a}")
            if e.get("fps") != c.get("fps"):
                problems.append(f"fps {c.get('fps')} vs {e.get('fps')}")
            if min(len(e["frames"]), MAX_FRAMES) != len(c["frames"]):
                problems.append(f"frames {len(c['frames'])} vs real {len(e['frames'])}")
        missing = [f for f in c["frames"] if not os.path.exists(os.path.join(CLIPS, c["id"], f))]
        if e and not missing and c["frames"]:
            prof_dir = "dominance" if c["realRun"].startswith("cd-") else "dominance-main"
            rp = os.path.join(imlib.LIB, prof_dir, e.get("dir", e["id"]), e["frames"][0])
            if os.path.exists(rp) and _dqt(rp) != _dqt(os.path.join(CLIPS, c["id"], c["frames"][0])):
                problems.append("JPEG quantisation tables differ from the real run (encoder or quality mismatch)")
        if missing:
            problems.append(f"{len(missing)} frame files missing")
        if problems:
            bad += 1
            print(f"  {c['id']}: " + "; ".join(problems))
    print(f"verify: {len(index['clips']) - bad}/{len(index['clips'])} clips paired correctly")
    return 0 if bad == 0 else 1


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("plan")
    p.add_argument("--per-family", type=int, default=3)
    p.add_argument("--seed", type=int, default=5)
    b = sub.add_parser("build")
    b.add_argument("set")
    sub.add_parser("verify")
    a = ap.parse_args()
    if a.cmd == "plan":
        plan(a.per_family, a.seed)
    elif a.cmd == "build":
        sys.exit(build(a.set))
    else:
        sys.exit(verify())


if __name__ == "__main__":
    main()
