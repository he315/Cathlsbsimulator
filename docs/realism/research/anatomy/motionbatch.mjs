// Track landmarks in many runs per view and summarise cardiac motion.
import { runs } from "./img.mjs";
import { execFileSync } from "node:child_process";
import { analyse } from "./period.mjs";
import fs from "node:fs";
const spec = {
  RCA_LAO: (r) => r.artery === "RCA" && r.angles.primary > 20 && Math.abs(r.angles.secondary) < 12,
  LCA_RAOcra: (r) => r.artery === "LCA" && r.angles.primary < -10 && r.angles.secondary > 15,
  LCA_LAOcra: (r) => r.artery === "LCA" && r.angles.primary > 20 && r.angles.secondary > 12,
  LCA_RAOcau: (r) => r.artery === "LCA" && r.angles.primary < -12 && r.angles.secondary < -12,
  LCA_APcra: (r) => r.artery === "LCA" && Math.abs(r.angles.primary) < 10 && r.angles.secondary > 20,
};
const per = +(process.argv[2] || 10);
const all = [...runs("dominance-main"), ...runs("dominance")].filter((r) => r.angles && !r.tags?.artefact && r.frames.length >= 40);
const out = {};
for (const [view, f] of Object.entries(spec)) {
  const seen = new Set();
  const cand = all.filter(f).filter((r) => !seen.has(r.patient) && seen.add(r.patient));
  const step = Math.max(1, Math.floor(cand.length / per));
  const res = [];
  for (let i = 0; i < cand.length && res.length < per; i += step) {
    const r = cand[i];
    const rel = (r.id.startsWith("cdm") ? "dominance-main/" : "dominance/") + r.id;
    try { execFileSync("node", ["track.mjs", rel, "10"], { stdio: "ignore", timeout: 300000 }); } catch { continue; }
    const a = analyse(`tracks/${rel.replace("/", "__")}.json`);
    if (!a || !a.periodFrames) continue;
    res.push({ id: r.id, ang: [Math.round(r.angles.primary), Math.round(r.angles.secondary)], hr: a.hr, period: a.periodFrames, acPeak: a.acPeak, p2p: a.lms.map((l) => l.beatP2P).filter((x) => x != null), quiet: a.lms.map((l) => l.quiet), peakSpeed: a.lms.map((l) => l.peakSpeed) });
    process.stderr.write(view + " " + r.id + " hr " + a.hr + "\n");
  }
  out[view] = res;
}
fs.writeFileSync("motion_real.json", JSON.stringify(out, null, 1));
for (const [view, res] of Object.entries(out)) {
  const P = res.flatMap((r) => r.p2p).sort((a, b) => a - b), Q = res.flatMap((r) => r.quiet).sort((a, b) => a - b), HR = res.map((r) => r.hr).sort((a, b) => a - b);
  const q = (A, p) => A[Math.floor(p * (A.length - 1))];
  console.log(view, "runs", res.length, "landmarks", P.length, "beat p2p px p25/p50/p75/p90", q(P, 0.25), q(P, 0.5), q(P, 0.75), q(P, 0.9), "quiet frac p50", q(Q, 0.5), "HR p25/p50/p75", q(HR, 0.25), q(HR, 0.5), q(HR, 0.75));
}
