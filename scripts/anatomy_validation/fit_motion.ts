// Fit of the motion model parameters that no opened source gives (heartMotion.ts DEFAULT_AMPLITUDES.trans
// magnitude, radial and the whole-heart rotation vector wholeRot) to two library motion measurements at once: the NCC landmark P10-P90 along the principal
// axis (LAD RAO cranial, RCA LAO; reference.json motionP1090Mm) and the xtrack scan-line tracks (LAD and RCA
// lines; reference.json xtrackLines, which see the motion across the vessel). Grid search; prints both per setting.
// usage: npx vite-node scripts/anatomy_validation/fit_motion.ts [nGenomes=10] [settings]
//   settings: ";"-separated "transScale,radial,rotX,rotY,rotZ[,rvSwing[,tapse]]" (rotation vector in degrees, aortic
//   frame: x patient left, y superior, z anterior; rvSwing in degrees and tapse in mm absolute, default the current
//   values), e.g. "1,0.12,0,0,0;1,0.08,0,0,6"
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase } from "../../src/types";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { DEFAULT_AMPLITUDES } from "../../src/render/xray/heartMotion";
import { landmarkMotion, scanlineMotion, xtrackSpec, quantile as q } from "./metrics";
import ref from "./reference.json";

const n = +(process.argv[2] ?? 10);
const mk = (id: string): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
const trees = Array.from({ length: n }, (_, i) => { const c = mk(`motion-${i}`); const model = buildAnatomy(c); return { model, tree: buildCoronaryTree(model, c) }; });
const amp = DEFAULT_AMPLITUDES as { trans: { x: number; y: number; z: number }; radial: number };
const t0 = { ...amp.trans };
const r0 = amp.radial;
const lines = (ref as any).xtrackLines.filter((l: any) => xtrackSpec(l));
const realX = (v: string, k: "rangePx" | "stepMedianPx" | "stepP90Px") => q(lines.filter((l: any) => xtrackSpec(l)!.vessel === v).map((l: any) => l[k]), 0.5);
console.log("real: LAD p1090", ref.motionP1090Mm.LAD_RAOcra.median, "RCA p1090", ref.motionP1090Mm.RCA_LAO.median, "| xtrack LAD", realX("LAD", "rangePx"), realX("LAD", "stepMedianPx"), realX("LAD", "stepP90Px"), "RCA", realX("RCA", "rangePx"), realX("RCA", "stepMedianPx"), realX("RCA", "stepP90Px"));
const settings = (process.argv[3] ?? "1,0.12,0,0,0").split(";").map((x) => x.split(",").map(Number));
const a2 = amp as unknown as { wholeRot: { x: number; y: number; z: number }; rvSwing: number; tapse: number };
const w0 = { ...a2.wholeRot };
const sw0 = a2.rvSwing,
  tp0 = a2.tapse;
for (const [kt, rad, rx, ry, rz, sw, tp] of settings) {
  amp.trans = { x: t0.x * kt, y: t0.y * kt, z: t0.z * kt };
  amp.radial = rad;
  a2.wholeRot = { x: rx ?? 0, y: ry ?? 0, z: rz ?? 0 };
  a2.rvSwing = Number.isFinite(sw) ? sw : sw0;
  a2.tapse = Number.isFinite(tp) ? tp : tp0;
  const lad = trees.flatMap(({ model, tree }) => landmarkMotion(tree, model, ["LM", "LAD"], { laoRao: -29, cranialCaudal: 25 }, 65));
  const rca = trees.flatMap(({ model, tree }) => landmarkMotion(tree, model, ["RCA"], { laoRao: 27, cranialCaudal: -2 }, 65));
  const agg: Record<string, number[][]> = { LAD: [[], [], []], RCA: [[], [], []] };
  for (const l of lines) {
    const sp = xtrackSpec(l)!;
    const r = trees.map(({ model, tree }) => scanlineMotion(tree, model, sp.chain, l.angle, sp.frac, l.orient)).filter((x): x is NonNullable<typeof x> => !!x);
    agg[sp.vessel][0].push(q(r.map((x) => x.range), 0.5));
    agg[sp.vessel][1].push(q(r.map((x) => x.stepMedian), 0.5));
    agg[sp.vessel][2].push(q(r.map((x) => x.stepP90), 0.5));
  }
  const m = (a: number[]) => q(a, 0.5).toFixed(1);
  const l1 = lad.flatMap((x) => x.p1090),
    r1 = rca.flatMap((x) => x.p1090);
  console.log(
    `trans x${kt} radial ${rad} rot (${rx},${ry},${rz}) rvSwing ${a2.rvSwing} tapse ${a2.tapse}: p1090 LAD ${m(l1)} RCA ${m(r1)} ratio ${(q(r1, 0.5) / q(l1, 0.5)).toFixed(2)} LAD step ${m(lad.flatMap((x) => x.stepMedianPx))}/${m(lad.flatMap((x) => x.stepP90Px))} | xtrack LAD ${m(agg.LAD[0])} ${m(agg.LAD[1])} ${m(agg.LAD[2])} RCA ${m(agg.RCA[0])} ${m(agg.RCA[1])} ${m(agg.RCA[2])}`
  );
}
a2.wholeRot = w0;
a2.rvSwing = sw0;
a2.tapse = tp0;
amp.trans = t0;
amp.radial = r0;
