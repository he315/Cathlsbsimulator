"""
Build the CADICA part of the real-angiogram library.

Source: CADICA (Jiménez-Partinen et al., Expert Systems 2024;41:e13708),
Mendeley Data doi:10.17632/p9bpx9ctcv.5, CC BY 4.0.
Changes made for the app: PNG frames re-encoded as JPEG; metadata reorganised.

Output: datasets/library/cadica/<run>/<frame>.jpg and datasets/library/cadica/index.json
"""

import glob
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import read_xlsx, save_json  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "datasets", "extracted", "CADICA", "CADICA")
OUT = os.path.join(ROOT, "datasets", "library", "cadica")

GRADES = ["p0_20", "p20_50", "p50_70", "p70_90", "p90_98", "p99", "p100"]
GRADE_LABEL = {
    "p0_20": "<20%",
    "p20_50": "20–49%",
    "p50_70": "50–69%",
    "p70_90": "70–89%",
    "p90_98": "90–98%",
    "p99": "99% (functional occlusion)",
    "p100": "100% (total occlusion)",
}


def main():
    proj = json.load(open(os.path.join(SRC, "selectedVideos", "CADICAprojections.json")))
    artery = {}
    for k, runs in proj.items():
        a = "RCA" if "RCA" in k else "LCA"
        for r in runs:
            artery[r] = a
    clinical = {str(r["Patient ID"]): r for r in read_xlsx(os.path.join(SRC, "metadata.xlsx"))}

    patients = []
    pdirs = sorted(glob.glob(os.path.join(SRC, "selectedVideos", "p*")), key=lambda p: int(re.sub(r"\D", "", os.path.basename(p))))
    for pdir in pdirs:
        pid = os.path.basename(pdir)
        runs = []
        for vdir in sorted(glob.glob(os.path.join(pdir, "v*")), key=lambda p: int(re.sub(r"\D", "", os.path.basename(p)))):
            run = f"{pid}_{os.path.basename(vdir)}"
            frames = sorted(glob.glob(os.path.join(vdir, "input", "*.png")))
            if not frames:
                continue
            keyfile = os.path.join(vdir, f"{run}_selectedFrames.txt")
            keys = [l.strip() for l in open(keyfile)] if os.path.exists(keyfile) else []
            boxes = {}
            worst = None
            for gt in sorted(glob.glob(os.path.join(vdir, "groundtruth", "*.txt"))):
                idx = int(re.search(r"_(\d+)\.txt$", gt).group(1))
                bs = []
                for line in open(gt):
                    parts = line.split()
                    if len(parts) == 5:
                        x, y, w, h = (int(float(v)) for v in parts[:4])
                        g = parts[4]
                        bs.append([x, y, w, h, g])
                        if g in GRADES and (worst is None or GRADES.index(g) > GRADES.index(worst)):
                            worst = g
                if bs:
                    boxes[idx] = bs
            out_dir = os.path.join(OUT, run)
            if not os.path.isdir(out_dir) or len(os.listdir(out_dir)) < len(frames):
                os.makedirs(out_dir, exist_ok=True)
                subprocess.run(
                    ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "72", *frames, "--out", out_dir],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            names = [os.path.splitext(os.path.basename(f))[0] + ".jpg" for f in frames]
            key_idx = sorted(int(re.search(r"_(\d+)$", k).group(1)) for k in keys if re.search(r"_(\d+)$", k))
            runs.append(
                {
                    "id": run,
                    "artery": artery.get(run),
                    "fps": 10,
                    "frames": names,
                    "keyframes": key_idx,
                    "worst": worst,
                    "worstLabel": GRADE_LABEL.get(worst) if worst else "no lesion labelled",
                    "boxes": {str(k): v for k, v in boxes.items()},
                }
            )
            print(run, artery.get(run), len(frames), worst, flush=True)
        c = clinical.get(pid[1:], {})
        patients.append(
            {
                "id": pid,
                "age": c.get("Age (years)"),
                "sex": c.get("Sex"),
                "indication": c.get("Clinical indication for angiogrphy"),
                "lvef": c.get("Left ventricular ejection fraction"),
                "diabetes": c.get("Diabetes mellitus") == "1",
                "smoker": c.get("Smoker") == "1",
                "hypertension": c.get("High blood pressure") == "1",
                "dyslipidaemia": c.get("Dyslipidemia") == "1",
                "vesselsAffected": c.get("Number of vessels affected"),
                "maxDegree": c.get("Maximum degree of the coronary artery involvement"),
                "runs": runs,
            }
        )
    save_json(
        os.path.join(OUT, "index.json"),
        {
            "dataset": "CADICA",
            "citation": "Jiménez-Partinen A, Molina-Cabello MA, Thurnhofer-Hemsi K, et al. CADICA: a new dataset for coronary artery disease detection by using invasive coronary angiography. Expert Systems 2024;41(12):e13708.",
            "doi": "https://doi.org/10.17632/p9bpx9ctcv.5",
            "licence": "CC BY 4.0",
            "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
            "changes": "PNG frames re-encoded as JPEG (quality 72); labels reorganised into JSON.",
            "system": "Siemens Artis Zee, 10 frames/s",
            "patients": patients,
        },
    )
    print("patients", len(patients), "runs", sum(len(p["runs"]) for p in patients))


if __name__ == "__main__":
    main()
