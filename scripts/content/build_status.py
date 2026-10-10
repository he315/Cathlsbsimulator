#!/usr/bin/env python3
"""Build-status snapshot of the manual curriculum for the build dashboard.

Usage (from the project root):
  python3 scripts/content/build_status.py "<what is happening now>"

Reads:
  - module counts from the module files (runs `npx vite-node scripts/content/status.ts`)
  - the module-pipeline workflow journals listed in docs/curriculum/dashboard/runs.json
    (later runs override earlier ones for the same module; fixes are summed)
  - the batch list in docs/curriculum/dashboard/batches.json
  - lab requests in docs/curriculum/lab-requests/*.json
Writes docs/curriculum/dashboard/snapshot.json (aggregate counts only) and
docs/curriculum/dashboard/cathmaster-build.html (the page with the snapshot embedded).
Push the snapshot to the live page with ArtifactData set dashboard/current.
"""
import collections
import datetime
import glob
import json
import os
import subprocess
import sys

ROOT = os.getcwd()
D = os.path.join(ROOT, "docs", "curriculum", "dashboard")
WF = os.path.expanduser(
    "~/.claude/projects/-Users-qc25212-Downloads-Misc-Games-and-apps-Cath-Simulator/44008407-56ca-4c73-9f50-2b40e2ca2b8c/subagents/workflows"
)
STAGES = ["write", "source", "clinical", "fix", "recheck", "fix2"]
STEP = {"write": 1, "source": 2, "clinical": 2, "fix": 3, "recheck": 4, "fix2": 4, "done": 5, "pending": 0}
TRACKS = {
    "pci-manual": "PCI step by step",
    "complex-pci": "Complex lesions and patients",
    "complication-management": "Complications: prevent, recognise, treat",
    "equipment": "The equipment",
    "cath-handbook": "The catheter laboratory handbook",
}
LAB_NAME = {
    "angio-pci": "PCI lab", "pci": "PCI lab", "diagnostic": "Cath lab", "cathlab": "Cath lab", "procedure": "Full procedure",
    "access": "Full procedure", "physiology": "Pressure wire", "pci-bench": "PCI bench", "angio-real": "Real angiograms",
    "haemo": "Haemodynamics lab", "impella": "Mechanical support", "ecmo": "Mechanical support", "iabp": "Mechanical support",
    "mcs": "Mechanical support", "pacing": "Bedside", "pericardiocentesis": "Bedside", "bedside": "Bedside", "tavi": "Structural",
    "teer": "Structural", "laao": "Structural", "structural": "Structural",
}


def module_counts():
    out = subprocess.run(["npx", "vite-node", "scripts/content/status.ts"], capture_output=True, text=True, cwd=ROOT, timeout=170)
    line = [l for l in out.stdout.splitlines() if l.startswith("[")]
    return {m["id"]: m for m in json.loads(line[-1])} if line else {}


def journal(run):
    path = os.path.join(WF, run, "journal.jsonl")
    started, results = {}, {}
    if not os.path.exists(path):
        return started, results
    for l in open(path):
        try:
            e = json.loads(l)
        except Exception:
            continue
        if e.get("type") == "started":
            started[e["key"]] = e.get("label", "")
        elif e.get("type") == "result":
            results[e["key"]] = e.get("result")
    return started, results


def main():
    activity = sys.argv[1] if len(sys.argv) > 1 else ""
    plan = json.load(open(os.path.join(ROOT, "docs", "curriculum", "module-plan.json")))
    runs = json.load(open(os.path.join(D, "runs.json")))
    batches = json.load(open(os.path.join(D, "batches.json")))
    counts = module_counts()

    status, fixed_total, academy = {}, collections.Counter(), 0
    for run in runs:
        started, results = journal(run)
        per = collections.defaultdict(dict)
        for k, label in started.items():
            if label == "academy-fixes":
                r = results.get(k)
                if isinstance(r, dict):
                    academy += r.get("applied", 0)
                continue
            if ":" not in label:
                continue
            stage, mid = label.split(":", 1)
            stage = stage.replace("-retry", "")
            done = k in results
            res = results.get(k)
            prev = per[mid].get(stage)
            # keep a finished result over an unfinished attempt
            if prev is None or (not prev[0] and done) or (done and res is not None):
                per[mid][stage] = (done, res)
        for mid, stg in per.items():
            for s in ("fix", "fix2"):
                if s in stg and stg[s][0] and isinstance(stg[s][1], dict):
                    fixed_total[mid] += stg[s][1].get("applied", 0)
            findings = []
            for s in ("source", "clinical"):
                if s in stg and stg[s][0] and isinstance(stg[s][1], dict):
                    findings += stg[s][1].get("findings", [])
            rc = stg.get("recheck")
            done_all = (stg.get("fix2") or (False, None))[0] or (rc and rc[0] and isinstance(rc[1], dict) and not rc[1].get("findings"))
            running = [s for s in STAGES if s in stg and not stg[s][0]]
            last = [s for s in STAGES if s in stg][-1]
            prev = status.get(mid, {})
            status[mid] = {
                "state": "done" if done_all else "running",
                "stage": "done" if done_all else (running[0] if running else last),
                "found": len(findings) or prev.get("found", 0),
                "critical": sum(f.get("severity") == "critical" for f in findings) or prev.get("critical", 0),
                "major": sum(f.get("severity") == "major" for f in findings) or prev.get("major", 0),
            }
    for m in plan:
        status.setdefault(m["moduleId"], {"state": "pending", "stage": "pending", "found": 0, "critical": 0, "major": 0})
    # a module whose batch is not running any more but that never reached done is shown as stalled
    for b in batches:
        if b.get("state") != "running":
            for mid in b.get("moduleIds", []):
                if status.get(mid, {}).get("state") == "running":
                    status[mid]["state"] = "stalled"

    tracks, tot, taught = [], collections.Counter(), set()
    batch_of = {mid: b["name"] for b in batches for mid in b.get("moduleIds", [])}
    for tid, title in TRACKS.items():
        rows = []
        for m in [p for p in plan if p["track"] == tid]:
            mid = m["moduleId"]
            st, c = status[mid], counts.get(mid, {})
            row = {
                "id": mid, "title": m["title"], "batch": batch_of.get(mid, "").replace("Batch ", ""), "state": st["state"], "stage": st["stage"],
                "step": STEP.get(st["stage"], 0), "topics": len(m["topics"]),
                **{k: c.get(k, 0) for k in ("lessons", "quiz", "cases", "tips", "refs", "checks", "videos")},
                "found": st["found"], "major": st["major"], "critical": st["critical"], "fixed": fixed_total[mid],
            }
            rows.append(row)
            tot[st["state"]] += 1
            if st["state"] == "done":
                for k in ("lessons", "quiz", "cases", "tips", "refs", "checks", "videos"):
                    tot[k] += row[k]
                taught.update(c.get("topics", []))
            for k in ("found", "fixed", "critical", "major"):
                tot[k] += row[k]
        tracks.append({"id": tid, "title": title, "modules": rows})

    reqs = []
    for fp in glob.glob(os.path.join(ROOT, "docs", "curriculum", "lab-requests", "*.json")):
        try:
            reqs += json.load(open(fp))
        except Exception:
            pass
    lc = collections.defaultdict(lambda: {"P1": 0, "P2": 0, "P3": 0})
    for r in reqs:
        p = r.get("priority", "P3") if r.get("priority") in ("P1", "P2", "P3") else "P3"
        lc[LAB_NAME.get(r.get("lab"), "Other")][p] += 1
    labs = sorted(({"lab": k, **v} for k, v in lc.items()), key=lambda x: -(x["P1"] + x["P2"] + x["P3"]))

    now = datetime.datetime.now()
    load = os.getloadavg()
    snap = {
        "updatedAt": now.strftime("%Y-%m-%dT%H:%M"),
        "updatedLabel": f"{now.day} {now.strftime('%b %Y, %H:%M')}",
        "activity": activity,
        "load": [round(x, 1) for x in load],
        "cores": os.cpu_count(),
        "totals": {
            "modules": len(plan), "done": tot["done"], "running": tot["running"] + tot["stalled"], "pending": tot["pending"],
            "topicsTaught": len(taught), "topics": 247, **{k: tot[k] for k in ("lessons", "quiz", "cases", "tips", "refs", "checks", "videos")},
            "found": tot["found"], "fixed": tot["fixed"], "critical": tot["critical"], "major": tot["major"],
            "academy": academy + 2, "labRequests": len(reqs), "labP1": sum(1 for r in reqs if r.get("priority") == "P1"),
        },
        "tracks": tracks,
        "labs": labs,
        "batches": [{k: v for k, v in b.items() if k != "moduleIds"} for b in batches],
        "links": {"coverage": "https://claude.ai/artifact/RV7mBdM3QQ9UR4MheeoD5y"},
    }
    json.dump(snap, open(os.path.join(D, "snapshot.json"), "w"))
    page = open(os.path.join(D, "template.html")).read().replace("__SNAPSHOT__", json.dumps(snap).replace("</", "<\\/"))
    open(os.path.join(D, "cathmaster-build.html"), "w").write(page)
    print(json.dumps(snap["totals"]))


if __name__ == "__main__":
    main()
