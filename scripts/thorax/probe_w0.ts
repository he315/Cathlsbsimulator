// Wave-0 thorax size, for the CPU budget comparison with the S4 legacy path.
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildThorax } from "./w0/thoraxW0";
const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const t0 = performance.now();
for (let i = 0; i < 20; i++) buildThorax({ resp: i / 20, heart: tree.heart });
const th = buildThorax({ resp: 0.3, heart: tree.heart });
console.log(JSON.stringify({ msPerBuild: +((performance.now() - t0) / 21).toFixed(3), tubes: th.tubes.length, pts: th.tubes.reduce((s, t) => s + t.pts.length, 0), bones: th.bones.length, anat: th.anat.length }));
