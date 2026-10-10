// Geometry and motion audit of the CathMaster coronary tree (read-only use of project code).
import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos, type TreeVessel } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre, contraction } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { DIAPHRAGM_DESCENT } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/thorax";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
import fs from "node:fs";

type Vec3 = { x: number; y: number; z: number };
const dom = (process.argv[2] as "right" | "left" | "codominant") || "right";
const c: any = {
  id: "audit-" + dom,
  name: "audit",
  difficulty: 1,
  accessRoute: "femoral",
  rootSize: "normal",
  rootRotationDeg: 0,
  aortaTiltDeg: 0,
  dominance: dom,
  variants: [],
  pathology: "normal",
  lesions: [],
};
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);
const H = tree.heart;
const named = tree.vessels.filter((v) => !v.name.includes("twig") && !v.name.startsWith("collateral"));
const out: any = { dominance: dom, heart: { len: H.len, rA: H.rA, rAp: H.rAp, rS: H.rS, rSr: H.rSr, L: H.L, A: H.A, S: H.S, base: H.base } };

const len3 = (pts: Vec3[]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y, p.z - pts[i - 1].z) : 0), 0);
const world = (v: TreeVessel, e = 0, resp = 0) => {
  const shift = V3.v(0, -0.85 * DIAPHRAGM_DESCENT * resp, 3 * resp);
  const rootW = 0.45;
  return v.samples.map((s) => toWorld(model, V3.add(samplePos(H, s, { contraction: e }), V3.sc(shift, rootW + (1 - rootW) * s.w))));
};

out.vessels = named.map((v) => {
  const p = world(v);
  const L = len3(p);
  const chord = Math.hypot(p[p.length - 1].x - p[0].x, p[p.length - 1].y - p[0].y, p[p.length - 1].z - p[0].z);
  return { name: v.name, n: v.samples.length, lengthMm: +L.toFixed(1), chordMm: +chord.toFixed(1), tortuosity: +(L / chord).toFixed(3), d0: +(2 * v.radii[0]).toFixed(2), dMid: +(2 * v.radii[Math.floor(v.radii.length / 2)]).toFixed(2), d1: +(2 * v.radii[v.radii.length - 1]).toFixed(2), parent: v.parent?.name, parentAt: v.parent ? +(v.parent.index / (tree.vessels.find((x) => x.name === v.parent!.name)!.samples.length - 1)).toFixed(2) : null };
});
const twigs = tree.vessels.filter((v) => v.name.includes("twig"));
const byHost: Record<string, { n: number; meanLen: number; meanD: number }> = {};
for (const t of twigs) {
  const h = t.parent!.name;
  byHost[h] ??= { n: 0, meanLen: 0, meanD: 0 };
  byHost[h].n++;
  byHost[h].meanLen += len3(world(t));
  byHost[h].meanD += 2 * t.radii[0];
}
for (const k in byHost) { byHost[k].meanLen = +(byHost[k].meanLen / byHost[k].n).toFixed(1); byHost[k].meanD = +(byHost[k].meanD / byHost[k].n).toFixed(2); }
out.twigs = byHost;

// bifurcations: parent diameter just before the origin, daughters
function tangentAt(v: TreeVessel, i: number, span = 4) {
  const p = world(v);
  const a = p[Math.max(0, i)], b = p[Math.min(p.length - 1, i + span)];
  return V3.nrm(V3.sub(b, a));
}
const angle = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, V3.dot(a, b)))) * 180) / Math.PI;
const bif: any[] = [];
for (const v of named) {
  if (!v.parent) continue;
  const p = tree.vessels.find((x) => x.name === v.parent!.name)!;
  const i = v.parent.index;
  const dp = 2 * p.radii[Math.max(0, i - 2)];
  const dmain = 2 * p.radii[Math.min(p.radii.length - 1, i + 2)];
  const dside = 2 * v.radii[0];
  const atEnd = i >= p.samples.length - 2;
  // if the branch arises at the very end of the parent (LM), daughters are siblings
  const tSide = tangentAt(v, 0, 6);
  const tMain = atEnd ? null : tangentAt(p, i, 6);
  bif.push({ parent: p.name, branch: v.name, atEnd, Dp: +dp.toFixed(2), Dmain: +dmain.toFixed(2), Dside: +dside.toFixed(2), murrayRatio: atEnd ? null : +((dmain ** 3 + dside ** 3) / dp ** 3).toFixed(2), finet: atEnd ? null : +(dp / (dmain + dside)).toFixed(3), angleDeg: tMain ? +angle(tMain, tSide).toFixed(0) : null });
}
// LM bifurcation: LAD vs LCx
const LM = named.find((v) => v.name === "LM")!, LAD = named.find((v) => v.name === "LAD")!, LCX = named.find((v) => v.name === "LCx")!;
const dLM = 2 * LM.radii[LM.radii.length - 2], dLAD = 2 * LAD.radii[2], dLCX = 2 * LCX.radii[2];
out.lmBif = { dLM: +dLM.toFixed(2), dLAD: +dLAD.toFixed(2), dLCx: +dLCX.toFixed(2), murrayRatio: +((dLAD ** 3 + dLCX ** 3) / dLM ** 3).toFixed(2), finet: +(dLM / (dLAD + dLCX)).toFixed(3), angleLAD_LCx: +angle(tangentAt(LAD, 0, 8), tangentAt(LCX, 0, 8)).toFixed(0) };
out.bifurcations = bif;

// motion: displacement of landmarks between end-diastole and end-systole, and with respiration
const landmarks: [string, number][] = [["LM", 1], ["LAD", 0.15], ["LAD", 0.5], ["LAD", 0.9], ["LCx", 0.3], ["LCx", 0.9], ["OM1", 0.5], ["D1", 0.5], ["RCA", 0.1], ["RCA", 0.35], ["RCA", 0.6], ["RCA", 0.9], ["PDA", 0.5], ["AM", 0.5]];
const views: [string, number, number][] = [["RAO30CAU25", -30, -25], ["RAO30CRA30", -30, 30], ["AP0CRA35", 0, 35], ["LAO45CAU30", 45, -30], ["LAO30CRA25", 30, 25], ["LAO30", 30, 0], ["AP", 0, 0]];
const iso = treeCentre(tree, "both");
out.motion = [];
for (const [name, at] of landmarks) {
  const v = named.find((x) => x.name === name);
  if (!v) continue;
  const i = Math.round(at * (v.samples.length - 1));
  const traj: Vec3[] = [];
  for (let k = 0; k <= 40; k++) {
    const e = contraction(k / 40);
    const s = v.samples[i];
    traj.push(toWorld(model, samplePos(H, s, { contraction: e })));
  }
  const ed = traj[0];
  let maxd = 0, maxk = 0;
  traj.forEach((p, k) => { const d = Math.hypot(p.x - ed.x, p.y - ed.y, p.z - ed.z); if (d > maxd) { maxd = d; maxk = k; } });
  const es = traj[maxk];
  const respShift = (1 - 0.45) * v.samples[i].w + 0.45; // fraction of heart shift applied
  const proj: any = {};
  for (const [vn, lr, cc] of views) {
    const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, iso, 230);
    // project onto the iso plane (mm at iso) via the camera basis
    const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV);
    const d = V3.sub(es, ed);
    proj[vn] = +Math.hypot(V3.dot(d, u), V3.dot(d, w)).toFixed(1);
  }
  out.motion.push({ vessel: name, at, w: v.samples[i].w, cardiac3dMm: +maxd.toFixed(1), peakPhase: +(maxk / 40).toFixed(2), projectedMm: proj, respPerFullBreathMm: +(Math.hypot(0.85 * DIAPHRAGM_DESCENT, 3) * respShift).toFixed(1) });
}
fs.writeFileSync(`/private/tmp/claude-502/cathmaster-research/anatomy/simgeom_${dom}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 0).slice(0, 200));
