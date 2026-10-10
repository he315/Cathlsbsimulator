"""Build the AngioCAD part of the real-angiogram library straight from the RAR volumes.

Source: Hosseini MS, Naghsh-Nilchi AR, Safayani M, Sadeghi M, Shirvani E, Danesh M,
Miramirkhani A. AngioCAD: a publicly available X-ray angiography dataset for coronary
artery stenosis and CAD detection. Zenodo 2025. https://doi.org/10.5281/zenodo.15826856
Licence CC BY 4.0.

The archive stores PNG frames (AngioCAD_Dataset/<patient>/<series>/frame_NNNN.png).
Selected members are streamed with `unar -o -` in one pass and split by the member
sizes from `lsar -l -i`, so nothing large is unpacked to disk. Each series becomes a
run of JPEG frames; patients carry the clinical data (AngioCAD_Features.xlsx) and the
segment stenosis grades (AngioCAD_Labels.xlsx). The Right/Left Coronary Series
columns map each series to its artery.

Usage: python3 scripts/angio_library/build_angiocad.py [max_frames_per_run]
"""

import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import ROOT, read_xlsx, save_json  # noqa: E402

RAW = os.path.join(ROOT, "datasets", "raw", "AngioCAD")
OUT = os.path.join(ROOT, "datasets", "library", "angiocad")
TMP = os.path.join(ROOT, "datasets", "tmp", "angiocad")
ARCHIVE = os.path.join(RAW, "AngioCAD_Dataset.part1.rar")
MAX_FRAMES = int(sys.argv[1]) if len(sys.argv) > 1 else 90
SEGMENTS = ["LM", "Prox LAD", "Mid LAD", "Dist LAD", "1st dig", "2nd dig", "Prox LCX", "Mid LCX", "Dist LCX", "OM", "Prox RCA", "Mid RCA", "Dist RCA", "PDA", "PLB"]
SEG_NAME = {"1st dig": "D1", "2nd dig": "D2", "Prox LCX": "Prox LCx", "Mid LCX": "Mid LCx", "Dist LCX": "Dist LCx", "PLB": "PLB"}


def series_set(spec):
    """'3-9' -> {3..9}; '5' -> {5}; '1-2, 4' -> {1, 2, 4}."""
    out = set()
    for part in re.split(r"[,;]", str(spec or "")):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^(\d+)\s*-\s*(\d+)$", part)
        if m:
            out.update(range(int(m.group(1)), int(m.group(2)) + 1))
        elif part.isdigit():
            out.add(int(part))
    return out


def yes(v):
    return str(v).strip() in ("1", "1.0", "True", "true", "yes")


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    labels = {str(r["ID"]).strip(): r for r in read_xlsx(os.path.join(RAW, "AngioCAD_Labels.xlsx")) if r.get("ID")}
    feats = {str(r["ID"]).strip(): r for r in read_xlsx(os.path.join(RAW, "AngioCAD_Features.xlsx")) if r.get("ID")}

    listing = subprocess.run(["lsar", "-l", "-i", ARCHIVE], capture_output=True, text=True, check=True).stdout
    members = []
    every = []  # every file entry, in archive order (the stream carries all of them)
    for line in listing.splitlines():
        f = re.match(r"^\s*(\d+)\.\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+(.+)$", line)
        if not f:
            continue
        every.append({"index": int(f.group(1)), "size": int(f.group(2)), "name": f.group(3)})
        m = re.match(r"^AngioCAD_Dataset/(\d+)/(\d+)/frame_(\d+)\.png$", f.group(3))
        if m:
            members.append({"index": int(f.group(1)), "size": int(f.group(2)), "pid": m.group(1), "series": int(m.group(2)), "frame": int(m.group(3))})
    if not members:
        raise SystemExit("no frames listed (are all four volumes present?)")
    runs = {}
    for mem in members:
        runs.setdefault((mem["pid"], mem["series"]), []).append(mem)
    selected = []
    for key, fr in runs.items():
        fr.sort(key=lambda x: x["frame"])
        selected.extend(fr[:MAX_FRAMES])
    selected.sort(key=lambda x: x["index"])
    print(f"{len(runs)} runs from {len({k[0] for k in runs})} patients; streaming {len(selected)} of {len(members)} frames")

    # resume: runs already converted
    index_path = os.path.join(OUT, "index.json")
    done_runs = set(d for d in os.listdir(OUT) if os.path.isdir(os.path.join(OUT, d)))

    pending = {}  # (pid, series) -> remaining count
    for mem in selected:
        pending[(mem["pid"], mem["series"])] = pending.get((mem["pid"], mem["series"]), 0) + 1
    converted = {}

    def finish(key):
        pid, ser = key
        run_id = f"ac-{int(pid):03d}-{ser}"
        src = os.path.join(TMP, run_id)
        dst = os.path.join(OUT, run_id)
        pngs = sorted(f for f in os.listdir(src) if f.endswith(".png"))
        os.makedirs(dst, exist_ok=True)
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "72", "-Z", "512"] + [os.path.join(src, p) for p in pngs] + ["--out", dst], capture_output=True, check=True)
        shutil.rmtree(src)
        converted[key] = len(pngs)

    wanted = {m["index"]: m for m in selected}
    every.sort(key=lambda x: x["index"])
    proc = subprocess.Popen(["unar", "-q", "-o", "-", ARCHIVE], stdout=subprocess.PIPE)
    for ent in every:
        data = proc.stdout.read(ent["size"])
        if len(data) != ent["size"]:
            raise SystemExit(f"stream ended early at member {ent['index']}")
        mem = wanted.get(ent["index"])
        if mem is None:
            continue
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise SystemExit(f"stream out of step at member {mem['index']} (not a PNG)")
        key = (mem["pid"], mem["series"])
        run_id = f"ac-{int(mem['pid']):03d}-{mem['series']}"
        if run_id not in done_runs:
            d = os.path.join(TMP, run_id)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, f"f{mem['frame'] + 1:03d}.png"), "wb") as fh:
                fh.write(data)
        pending[key] -= 1
        if pending[key] == 0 and run_id not in done_runs:
            finish(key)
            if len(converted) % 50 == 0:
                print("runs converted", len(converted), flush=True)
    proc.wait()

    # index
    patients = []
    for pid in sorted({k[0] for k in runs}, key=int):
        lab = labels.get(pid, {})
        ft = feats.get(pid, {})
        right = series_set(lab.get("Right Coronary Series") or ft.get("Right Coronary Series"))
        left = series_set(lab.get("Left Coronary Series") or ft.get("Left Coronary Series"))
        prs = []
        for ser in sorted(s for (p, s) in runs if p == pid):
            run_id = f"ac-{int(pid):03d}-{ser}"
            d = os.path.join(OUT, run_id)
            if not os.path.isdir(d):
                continue
            frames = sorted(f for f in os.listdir(d) if f.endswith(".jpg"))
            if not frames:
                continue
            prs.append({"id": run_id, "fps": 15, "artery": "RCA" if ser in right else "LCA" if ser in left else None, "frames": frames})
        if not prs:
            continue
        segs = {SEG_NAME.get(s, s): str(lab.get(s)).strip() for s in SEGMENTS if lab.get(s) not in (None, "")}
        sex = (ft.get("Sex") or "").strip().lower()
        try:
            lvef = f"{round(float(ft.get('LVEF')) * 100)}%" if ft.get("LVEF") not in (None, "") else None
        except ValueError:
            lvef = None
        try:
            gensini = round(float(ft.get("Gensini Score")), 1) if ft.get("Gensini Score") not in (None, "") else None
        except ValueError:
            gensini = None
        dom = (ft.get("dominance") or "").strip().lower()
        patients.append(
            {
                "id": f"ac-{int(pid):03d}",
                "age": (ft.get("Age") or None),
                "sex": "M" if sex.startswith("m") else "F" if sex.startswith("f") else None,
                "indication": (ft.get("Diagnosis") or None),
                "lvef": lvef,
                "diabetes": yes(ft.get("DM")),
                "smoker": yes(ft.get("Current Smoker")),
                "hypertension": yes(ft.get("HTN")),
                "dyslipidaemia": yes(ft.get("Hyperlipidemia")),
                "dominance": dom if dom in ("left", "right") else None,
                "gensini": gensini,
                "segments": segs,
                "runs": prs,
            }
        )
    save_json(
        index_path,
        {
            "dataset": "AngioCAD",
            "citation": "Hosseini MS, Naghsh-Nilchi AR, Safayani M, Sadeghi M, Shirvani E, Danesh M, Miramirkhani A. AngioCAD: a publicly available X-ray angiography dataset for coronary artery stenosis and CAD detection. Zenodo 2025.",
            "doi": "https://doi.org/10.5281/zenodo.15826856",
            "licence": "CC BY 4.0",
            "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
            "changes": f"PNG frames re-encoded as JPEG (quality 72), at most 512 pixels, first {MAX_FRAMES} frames of each series. The acquisition frame rate is not stated in the dataset; runs play at 15 frames/s.",
            "system": "Frame rate not stated; played at 15 frames/s",
            "patients": patients,
        },
    )
    print("patients", len(patients), "runs", sum(len(p["runs"]) for p in patients))


if __name__ == "__main__":
    main()
