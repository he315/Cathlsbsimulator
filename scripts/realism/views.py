"""
View-family classification used by every per-view target and by the scorecard.

primary angle: + LAO, - RAO; secondary: + cranial, - caudal (DICOM 0018,1510 / 0018,1511 as stored
in the library index.json files and as used by the simulator's CArm {laoRao, cranialCaudal}).

A run is LAO or RAO when |primary| >= 15 degrees, otherwise AP; CRA or CAU when |secondary| >= 15,
otherwise 0. This is the threshold of the audit's grey-percentile script (m7_pct.py) and of the app's
standardView() in src/ui/angio/library.ts, so per-view targets and the drill agree.
"""

FAMILY_THRESHOLD_DEG = 15


def family(angles, thr=FAMILY_THRESHOLD_DEG):
    if not angles:
        return None
    p, s = angles
    lr = "LAO" if p >= thr else ("RAO" if p <= -thr else "AP")
    cc = "CRA" if s >= thr else ("CAU" if s <= -thr else "0")
    return f"{lr}-{cc}"


# The reference views of the scorecard (plan S0's five plus RAO cranial, the view of the real LAD traces): artery and view family, with the C-arm preset
# id of src/data/viewPresets.ts used to capture them.
REFERENCE_VIEWS = [
    {"name": "lad_raocau", "artery": "LCA", "family": "RAO-CAU", "preset": "raocaudal", "scenario": "lad-focal"},
    {"name": "lad_raocra", "artery": "LCA", "family": "RAO-CRA", "preset": "raocranial", "scenario": "lad-focal"},
    {"name": "lad_apcra", "artery": "LCA", "family": "AP-CRA", "preset": "apcranial", "scenario": "lad-focal"},
    {"name": "lad_laocra", "artery": "LCA", "family": "LAO-CRA", "preset": "laocranial", "scenario": "lad-focal"},
    {"name": "rca_lao", "artery": "RCA", "family": "LAO-0", "preset": "rcalao", "scenario": "rca-calcified"},
    {"name": "rca_rao", "artery": "RCA", "family": "RAO-0", "preset": "rcarao", "scenario": "rca-calcified"},
]
