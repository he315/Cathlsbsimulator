// C1 (wave 2) probe: world extents (mm) of every anatomy shape for one capture frame, and the isocentre.
//   npx vite-node scripts/thorax/probe_c1_extent.ts -- <view preset> <scenario> [k]
import { prepareScenario, resolveSpec, sceneInputAt } from "../../src/dev/xrayCapture";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";

const args = process.argv.slice(2).filter((a) => a !== "--");
const view = args[0] ?? "apcranial";
const scenario = args[1] ?? "lad-focal";
const k = Number(args[2] ?? 2);
const R = resolveSpec({ set: "probe", name: "p", view, scenario, nFrames: 51, injection: null, annotate: false, upload: false });
const p = prepareScenario(R.scenario);
const inp = sceneInputAt(p, R, k, {});
const r = buildXrayScene(inp);
const ext = (s: { ax: { x: number; y: number; z: number }[]; half: number[] }, d: "x" | "y" | "z") => Math.sqrt(s.ax.reduce((a, ax, i) => a + (ax[d] * s.half[i]) ** 2, 0));
console.log("iso", JSON.stringify(r.iso), "field", inp.field, "cArm", JSON.stringify(R.cArm));
for (const s of r.scene.anat) {
  const f = (d: "x" | "y" | "z") => `${(s.c[d] - ext(s, d)).toFixed(0)}..${(s.c[d] + ext(s, d)).toFixed(0)}`;
  console.log((s.name ?? "?").padEnd(34), "x", f("x").padEnd(12), "y", f("y").padEnd(12), "z", f("z").padEnd(12), "mu", s.mu.toFixed(4), s.lung ? "lung" : "", s.carve ? "carve" : "");
}
