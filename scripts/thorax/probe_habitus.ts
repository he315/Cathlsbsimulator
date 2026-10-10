// Habitus check (critique 27): central-ray water-equivalent path and the ADRC's steady-state cine
// technique for 8 seeded patients in three library-median views. Two path models:
//   trace: traceAnat line integral of the patient's own thorax shapes / MU.soft (soft-tissue equivalent)
//   adrc:  adrc.ts patientPath with the genome's body half-axes (the analytic model sceneBuilder uses)
// Run: npx vite-node scripts/thorax/probe_habitus.ts
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildThorax, MU, traceAnat, ANAT } from "../../src/render/xray/thorax";
import { cameraBasis } from "../../src/simulation/projection";
import { patientPath, steadyState } from "../../src/render/xray/adrc";

const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const VIEWS: Record<string, { laoRao: number; cranialCaudal: number }> = {
  AP_CRA: { laoRao: 1, cranialCaudal: 29 },
  LAO_CAU: { laoRao: 25, cranialCaudal: -26 },
  RAO_CAU: { laoRao: -18, cranialCaudal: -15 },
};
const iso = { x: 20, y: -20, z: -10 };
const rows: Record<string, number | string>[] = [];
for (let seed = 1; seed <= 8; seed++) {
  const th = buildThorax({ resp: 0.7, heart: tree.heart, seed });
  const body = th.anat[ANAT.BODY];
  const row: Record<string, number | string> = { seed, habitus: +th.genome!.habitus.toFixed(3) };
  for (const [name, arm] of Object.entries(VIEWS)) {
    const f = cameraBasis(arm).forward;
    const ro = { x: iso.x - f.x * 1500, y: iso.y - f.y * 1500, z: iso.z - f.z * 1500 };
    const P = traceAnat(th.anat, ro, f).P;
    const traceCm = P / MU.soft / 10;
    const pp = patientPath(arm, { body: { a: body.half[0], b: body.half[2] } });
    const sTrace = steadyState({ mode: "cine" }, { ...pp, waterCm: traceCm });
    const sAdrc = steadyState({ mode: "cine" }, pp);
    row[`${name}_traceCm`] = +traceCm.toFixed(1);
    row[`${name}_kvTrace`] = +sTrace.technique.kvp.toFixed(1);
    row[`${name}_adrcCm`] = +pp.waterCm.toFixed(1);
    row[`${name}_kvAdrc`] = +sAdrc.technique.kvp.toFixed(1);
  }
  rows.push(row);
}
console.table(rows);
for (const k of Object.keys(rows[0]).filter((k) => k.includes("kv") || k.includes("Cm"))) {
  const v = rows.map((r) => r[k] as number);
  const m = v.reduce((a, b) => a + b) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
  console.log(k, "min", Math.min(...v), "max", Math.max(...v), "sd", sd.toFixed(2));
}
