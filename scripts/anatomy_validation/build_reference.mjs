// Build reference.json: real-library measurements that anatomy.test.ts and sim_metrics.ts compare against.
//
// Inputs (data/, copied from the anatomy-motion audit run of the library tools in library/):
//   realskel.json      vessel-mask extents and skeleton statistics per view (library/realskel.mjs)
//   realskel_nocath.json, realskel_fill_nocath.json  the same masks with the catheter removed, peak frame
//                      and whole filling phase (library/realskel_nocath.mjs)
//   motion_trace2.json NCC landmark tracks along traced centrelines (library/track.mjs via mtrace)
//   traces/*.json      minimal-path centrelines of real vessels and catheter shafts (library/trace.mjs)
// Scale: 2.0 mm per catheter width in px (6 F catheter), per run where the width was measured,
// else the library median 6.5 px (cathwidth.json); 0.31 mm/px for the motion tracks.
//
// usage: node scripts/anatomy_validation/build_reference.mjs
import fs from "node:fs";
import path from "node:path";
import { bands } from "./library/spectrum.mjs";
import { shapeMetrics } from "./library/shape.mjs";

const here = decodeURIComponent(new URL(".", import.meta.url).pathname);
const data = (f) => JSON.parse(fs.readFileSync(path.join(here, "data", f), "utf8"));
const q = (a, p) => {
  const s = a.filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y);
  if (!s.length) return null;
  const i = (s.length - 1) * p;
  const lo = Math.floor(i),
    hi = Math.ceil(i);
  return +(s[lo] + (s[hi] - s[lo]) * (i - lo)).toFixed(2);
};
const summary = (a) => ({ n: a.length, p10: q(a, 0.1), p25: q(a, 0.25), median: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9) });

// ---- extents ----
const skel = data("realskel.json");
const extents = {};
for (const [view, runs] of Object.entries(skel)) {
  const w = [],
    h = [],
    lr = [],
    cc = [];
  for (const r of runs) {
    const mm = 2.0 / (r.cathPx || 6.5);
    w.push(r.extPx[0] * mm);
    h.push(r.extPx[1] * mm);
    lr.push(r.ang[0]);
    cc.push(r.ang[1]);
  }
  extents[view] = { runs: runs.map((r) => r.id), angle: { laoRao: q(lr, 0.5), cranialCaudal: q(cc, 0.5) }, widthMm: summary(w), heightMm: summary(h) };
}

// ---- vessel-only extents (library/realskel_nocath.mjs): catheter chain removed from the peak-frame mask
// ("peak", misses late-filling and faint distal vessels, so a lower bound) and from the whole filling phase
// ("fill", temporal maximum over the filling frames, widened by the cardiac motion, so an upper bound) ----
const vesselOnly = {};
for (const [mode, file] of [["peak", "realskel_nocath.json"], ["fill", "realskel_fill_nocath.json"]]) {
  if (!fs.existsSync(path.join(here, "data", file))) continue;
  for (const [view, runs] of Object.entries(data(file))) {
    const w = [], h = [];
    for (const r of runs) {
      const mm = 2.0 / (r.cathPx || 6.5);
      w.push(r.extPxNoCath[0] * mm);
      h.push(r.extPxNoCath[1] * mm);
    }
    vesselOnly[view] = vesselOnly[view] ?? { angle: extents[view].angle };
    vesselOnly[view][mode] = { widthMm: summary(w), heightMm: summary(h) };
  }
}

// ---- tortuosity bands and LM+LAD length ----
const tort = { LAD_RAOcra: [], RCA_LAO: [], CATH: [] };
const ladLength = [];
for (const f of fs.readdirSync(path.join(here, "data", "traces")).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(path.join(here, "data", "traces", f), "utf8"));
  const b = bands(d.path, d.mmPerPx);
  const key = d.label.startsWith("CATH") ? "CATH" : d.label.startsWith("LAD") ? "LAD_RAOcra" : "RCA_LAO";
  tort[key].push({ label: d.label, ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, typeof v === "number" ? +v.toFixed(2) : v])) });
  if (key === "LAD_RAOcra") ladLength.push(shapeMetrics(d.path, d.mmPerPx).lengthMm);
}
const bandSummary = (k) => ({
  b3_8: summary(tort[k].map((x) => x.b3_8)),
  b8_20: summary(tort[k].map((x) => x.b8_20)),
  b20_60: summary(tort[k].map((x) => x.b20_60)),
  traces: tort[k],
});

// ---- motion ----
const mt = data("motion_trace2.json");
const MMPX = 0.31;
const motion = { RCA_LAO: [], LAD_RAOcra: [] };
for (const [k, v] of Object.entries(mt)) {
  const key = k.startsWith("RCA") ? "RCA_LAO" : "LAD_RAOcra";
  for (const lm of v.lms) if (lm.p1090 != null) motion[key].push(+(lm.p1090 * MMPX).toFixed(2));
}
// ---- xtrack scan-line tracks (docs/realism/research/xtrack.py outputs, Azurion npz runs, 512 px, 15 frames/s);
// view angles from the library index; "y…" lines are horizontal scan lines, "x…" lines vertical ----
const research = path.join(here, "../../docs/realism/research");
const angles = {};
for (const name of ["dominance", "dominance-main"]) {
  const idx = path.join(here, "../../datasets/library", name, "index.json");
  if (!fs.existsSync(idx)) continue;
  for (const p of JSON.parse(fs.readFileSync(idx, "utf8")).patients) for (const r of p.runs) if (r.angles) angles[r.id] = { laoRao: +r.angles.primary.toFixed(1), cranialCaudal: +r.angles.secondary.toFixed(1) };
}
const xtrackLines = [];
for (const f of fs.existsSync(research) ? fs.readdirSync(research).filter((x) => /^xtrack_cd-.*\.json$/.test(x)) : []) {
  for (const r of JSON.parse(fs.readFileSync(path.join(research, f), "utf8"))) {
    const [run, line] = r.name.split(":");
    const m = /_(x|y)\d+/.exec(line);
    xtrackLines.push({ run, line, angle: angles[run] ?? null, orient: m ? (m[1] === "y" ? "h" : "v") : null, rangePx: r.range_px, stepMedianPx: r.step_median, stepP90Px: r.step_p90, frames: r.frames, lost: r.lost });
  }
}

const ref = {
  provenance:
    "Built by scripts/anatomy_validation/build_reference.mjs from data/ (outputs of library/*.mjs run on datasets/library CoronaryDominance cines during the anatomy-motion audit). mm assume a 6 F catheter (2.0 mm); scale by 0.83 if 5 F.",
  extents,
  extentsVesselOnly: vesselOnly,
  tortuosity: { LAD_RAOcra: bandSummary("LAD_RAOcra"), RCA_LAO: bandSummary("RCA_LAO"), catheterNoiseFloor: bandSummary("CATH") },
  lmLadLengthRAOcraMm: summary(ladLength),
  motionP1090Mm: {
    RCA_LAO: summary(motion.RCA_LAO),
    LAD_RAOcra: summary(motion.LAD_RAOcra),
    ratio: +(q(motion.RCA_LAO, 0.5) / q(motion.LAD_RAOcra, 0.5)).toFixed(2),
  },
  // values reported by the audit tools whose per-run outputs were not kept as JSON (quoted from
  // docs/realism/phase1-research-and-plan.json, measurementTargets and the anatomy-motion audit)
  xtrackLines,
  quoted: {
    transectCrossingsMedian: { LCA_RAOcra: 8, LCA_APcra: 7, LCA_LAOcra: 4, source: "library/transect2.mjs, 15/14/10 runs" },
    xtrackPx512: {
      LAD: { range: [16, 31], stepMedian: [2.0, 3.2], stepP90: [4.3, 8.8], stepMax: 11 },
      RCA: { range: [28, 46], stepMedian: [2.7, 9.0], stepP90: [8.3, 12.2], stepMax: 14.2 },
      catheterShaft: { range: 15, stepMax: 5.3 },
      source: "docs/realism/research/xtrack.py on Azurion npz runs, 512 px, 15 frames/s",
    },
    medianSpeedMmS: { RCA: 48, LAD: 17, noiseFloor: 4.6, source: "library/track.mjs NCC tracks, 0.31 mm/px, 15 frames/s" },
    proximalLandmarkMm: [6, 25],
    lmRegionPerBeatMm: 8,
    heartRateBpm: { median: 65.4, iqr: [60.1, 71.5] },
  },
};
fs.writeFileSync(path.join(here, "reference.json"), JSON.stringify(ref, null, 1));
console.log("extents", JSON.stringify(Object.fromEntries(Object.entries(extents).map(([k, v]) => [k, [v.widthMm.median, v.heightMm.median, v.angle]]))));
console.log("tortuosity LAD", JSON.stringify(ref.tortuosity.LAD_RAOcra.b8_20), "RCA", JSON.stringify(ref.tortuosity.RCA_LAO.b8_20));
console.log("3-8", JSON.stringify(ref.tortuosity.LAD_RAOcra.b3_8), "cath", JSON.stringify(ref.tortuosity.catheterNoiseFloor.b3_8));
console.log("LM+LAD length", JSON.stringify(ref.lmLadLengthRAOcraMm));
console.log("motion", JSON.stringify(ref.motionP1090Mm));
