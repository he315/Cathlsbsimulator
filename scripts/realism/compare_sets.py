"""
Row-by-row comparison of two scorecards written by report.py (C1, wave 2).

  python3 scripts/realism/compare_sets.py <base set> <new set> [--pipeline matched|lossless] [--all] [--section S]

Prints the headline of both, the per-section pass counts, every row whose pass/fail result changed
(lost rows first), and with --all every scored row with both values. Rows are matched on
(metric, label, artery, view); only rows report.py scores (a simulator value and a target with at least
3 real runs) are counted, as in its headline.
"""

import argparse
import json
import os
import sys

import imlib


def load(set_name, pipeline):
    p = os.path.join(imlib.CACHE, "reports", set_name, f"scorecard_{pipeline}.json")
    with open(p) as f:
        return json.load(f)


def scored(rows):
    out = {}
    for r in rows:
        if r.get("indicative") or r.get("pass") is None or r.get("value") is None:
            continue
        out[(r["metric"], r["label"], r.get("artery"), r.get("view"))] = r
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base")
    ap.add_argument("new")
    ap.add_argument("--pipeline", default="matched")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--section", default=None)
    a = ap.parse_args()
    A = scored(load(a.base, a.pipeline)["rows"])
    B = scored(load(a.new, a.pipeline)["rows"])
    for name, S in ((a.base, A), (a.new, B)):
        print(f"{name}: {sum(1 for r in S.values() if r['pass'])} of {len(S)}")
    secs = sorted({r["section"] for r in list(A.values()) + list(B.values())})
    print(f"{'section':<14} {a.base:>12} {a.new:>12}")
    for s in secs:
        fa = [r for r in A.values() if r["section"] == s]
        fb = [r for r in B.values() if r["section"] == s]
        print(f"{s:<14} {sum(r['pass'] for r in fa):>5}/{len(fa):<6} {sum(r['pass'] for r in fb):>5}/{len(fb):<6}")
    keys = sorted(set(A) | set(B), key=lambda k: (k[0], k[2] or "", k[3] or ""))

    def fmt(r):
        if r is None:
            return "        -"
        return f"{r['value']:>9.3f}" if isinstance(r["value"], (int, float)) else f"{str(r['value']):>9}"

    def band(r):
        t = (r or {}).get("target") or {}
        b = t.get("band")
        return f"{b[0]:.3f}..{b[1]:.3f}" if b else ""

    for title, cond in (("LOST (pass -> fail or missing)", lambda ra, rb: ra and ra["pass"] and not (rb and rb["pass"])), ("GAINED (fail -> pass)", lambda ra, rb: rb and rb["pass"] and not (ra and ra["pass"]))):
        print(f"\n{title}")
        for k in keys:
            ra, rb = A.get(k), B.get(k)
            if cond(ra, rb):
                r = rb or ra
                print(f"  {r['label'][:58]:<58} {(k[2] or '')[:4]:<4} {(k[3] or '')[:8]:<8} {fmt(ra)} -> {fmt(rb)}   band {band(r)}")
    if a.all:
        print("\nALL")
        for k in keys:
            ra, rb = A.get(k), B.get(k)
            r = rb or ra
            if a.section and r["section"] != a.section:
                continue
            res = ("P" if ra and ra["pass"] else "f") + ("P" if rb and rb["pass"] else "f")
            print(f"  {res} {r['label'][:58]:<58} {(k[2] or '')[:4]:<4} {(k[3] or '')[:8]:<8} {fmt(ra)} -> {fmt(rb)}   band {band(r)}")


if __name__ == "__main__":
    sys.exit(main())
