"""
Library run selections. Where the phase-1 audit used a fixed list, the list is copied here; where it
used a seeded random sample, the same Python `random` calls are replayed on the same index order so the
same runs come out (m5_contrast.py, m2_dynamics.py: seed 11; field.py: seed 3; m7_pct.py: first 25 per
view family in index order).
"""

import random

from sources import library_index
from views import family

# noise2.py (run_all.sh step 1)
AUDIT_NOISE_CDDS = ["cd-01031-LCA-6", "cd-01031-LCA-8", "cd-01031-LCA-4", "cd-01031-RCA-10", "cd-01029-LCA-7", "cd-01033-LCA-3",
                    "cd-01034-LCA-4", "cd-01036-RCA-6", "cd-01037-LCA-2", "cd-01040-LCA-3", "cd-01045-LCA-3", "cd-01032-RCA-5", "cd-01048-LCA-5"]
AUDIT_NOISE_CADICA = ["p10_v1", "p1_v1", "p2_v1", "p5_v1", "p13_v1", "p20_v2", "p25_v5", "p31_v5", "p36_v3", "p40_v1"]
AUDIT_NOISE_CDMAIN = ["cdm-00002-LCA-2", "cdm-00003-LCA-4", "cdm-00004-LCA-3", "cdm-00002-RCA-6", "cdm-00005-LCA-1"]

# timing.py: 49 random clean runs (timing_runs.txt plus cd-01031-LCA-6, in the order of timing2_npz.json)
AUDIT_TIMING_CDDS = """
cd-01031-LCA-6 cd-01056-LCA-7 cd-01043-LCA-5 cd-01135-RCA-7 cd-01032-RCA-6 cd-01034-RCA-7 cd-01156-LCA-2 cd-01039-LCA-4
cd-01133-LCA-1 cd-01165-RCA-2 cd-01033-LCA-5 cd-01153-LCA-3 cd-01048-LCA-3 cd-01031-LCA-8 cd-01037-RCA-9 cd-01141-LCA-4
cd-01139-LCA-1 cd-01034-LCA-5 cd-01050-LCA-1 cd-01039-LCA-2 cd-01158-LCA-1 cd-01140-LCA-2 cd-01033-RCA-6 cd-01160-LCA-2
cd-01041-LCA-4 cd-01048-RCA-8 cd-01174-LCA-2 cd-01174-LCA-1 cd-01033-RCA-7 cd-01163-LCA-3 cd-01166-LCA-1 cd-01136-LCA-2
cd-01033-LCA-1 cd-01048-LCA-7 cd-01032-RCA-5 cd-01159-LCA-1 cd-01042-LCA-3 cd-01054-LCA-4 cd-01043-LCA-1 cd-01157-LCA-2
cd-01041-LCA-1 cd-01162-LCA-2 cd-01055-RCA-6 cd-01159-LCA-2 cd-01045-RCA-7 cd-01040-LCA-1 cd-01165-LCA-1 cd-01176-LCA-3
cd-01046-LCA-2
""".split()
# settle.py: the first 20 runs of timing_runs.txt
AUDIT_SETTLE_CDDS = AUDIT_TIMING_CDDS[1:21]

# texture.py (run_all.sh step 5): frame 2 (cd-ds) and frame 1 (CADICA)
AUDIT_TEXTURE_CDDS = ["cd-01031-LCA-6", "cd-01031-LCA-8", "cd-01031-LCA-4", "cd-01031-RCA-10", "cd-01029-LCA-7", "cd-01033-LCA-3", "cd-01040-LCA-3", "cd-01032-RCA-5"]
AUDIT_TEXTURE_CADICA = ["p10_v1", "p2_v1", "p31_v5"]


def timing_runs():
    return list(AUDIT_TIMING_CDDS)


def m5_selection():
    """m5_contrast.py: random.seed(11); per subset in order, runs with >= 30 frames shuffled, first 60."""
    random.seed(11)
    out = {}
    for prof in ("cd-ds", "cd-main", "cadica"):
        rr = [e["id"] for e in library_index(prof) if len(e["frames"]) >= 30]
        random.shuffle(rr)
        out[prof] = rr[:60]
    return out


def m2_selection():
    """m2_dynamics.py: random.seed(11); (cd-ds 90, cd-main 60, cadica 60) runs with >= 30 frames."""
    random.seed(11)
    out = {}
    for prof, n in (("cd-ds", 90), ("cd-main", 60), ("cadica", 60)):
        rr = [e["id"] for e in library_index(prof) if len(e["frames"]) >= 30]
        random.shuffle(rr)
        out[prof] = rr[:n]
    return out


def field_selection(n=80):
    """field.py frames_for(): per source random.seed(3) then random.sample(all run ids, n)."""
    out = {}
    for prof in ("cd-ds", "cadica", "cd-main", "angiocad"):
        random.seed(3)
        runs = [e["id"] for e in library_index(prof)]
        out[prof] = random.sample(runs, n)
    return out


M7_GROUPS = [("LCA", "RAO-CRA"), ("LCA", "RAO-CAU"), ("LCA", "LAO-CRA"), ("LCA", "LAO-CAU"), ("LCA", "AP-CRA"), ("RCA", "LAO-0")]


def m7_selection(per=25):
    """m7_pct.py: runs with angles and >= 20 frames from cd-ds then cd-main in index order, grouped by
    (artery, family), first 25 per group. Returns {group: [(profile, id)]} for all groups found."""
    groups = {}
    for prof in ("cd-ds", "cd-main"):
        for e in library_index(prof):
            a = e.get("angles")
            if not a or len(e["frames"]) < 20:
                continue
            k = (e["artery"], family((a["primary"], a["secondary"])))
            groups.setdefault(k, []).append((prof, e["id"]))
    return {k: v[:per] for k, v in groups.items()}
