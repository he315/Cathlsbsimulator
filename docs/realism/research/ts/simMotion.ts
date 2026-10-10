const ROOT = "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src";
const { buildAnatomy } = await import(ROOT + "/simulation/anatomy.ts");
const { CASE_LIBRARY } = await import(ROOT + "/simulation/caseGenerator.ts");
const { buildCoronaryTree } = await import(ROOT + "/render/xray/coronaryTree.ts");
const { buildXrayScene } = await import(ROOT + "/render/xray/sceneBuilder.ts");
const { XrayRenderer } = await import(ROOT + "/render/xray/XrayRenderer.ts");

const c = CASE_LIBRARY[0];
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);
const views: Record<string, { laoRao: number; cranialCaudal: number }> = {
  AP: { laoRao: 0, cranialCaudal: 0 },
  "RAO30-CAU25": { laoRao: -30, cranialCaudal: -25 },
  "LAO40-CRA25": { laoRao: 40, cranialCaudal: 25 },
  LAO30: { laoRao: 30, cranialCaudal: 0 },
};
// identify tubes for vessels: buildXrayScene pushes thorax tubes first, then opacified vessels in tree order.
function sceneAt(t: number, view: { laoRao: number; cranialCaudal: number }, side: "left" | "right", breathHold: number | null) {
  const filled = side === "left" ? ["LM", "LAD", "LCx", "D1", "D2", "OM1", "OM2", "SEPTAL", "RAMUS"] : ["RCA", "CONUS", "AM", "PDA", "PLV"];
  return buildXrayScene({
    model, caseData: c, tree, catheterRoot: [{ x: 0, y: 30, z: 0 }, { x: 0, y: 20, z: 5 }], french: 6, wire: null,
    bolus: { filled: filled as any, plume: "none", side, t: 2, injectDur: 3, peak: 1 },
    t, cArm: view as any, mode: "cine", frame: 0, centreOn: side, breathHold, heartRate: 65, field: 230,
  } as any);
}
const fps = 15;
for (const [vn, view] of Object.entries(views)) {
  for (const side of ["left", "right"] as const) {
    if ((side === "right") !== (vn === "LAO30")) continue;
    for (const bh of [0.3, null] as (number | null)[]) {
      const names = side === "left" ? ["LAD", "LCx", "D1", "OM1"] : ["RCA", "PDA", "AM"];
      // track each vessel's sample points through 3 s
      const T = bh === null ? 8.6 : 60 / 65 * 3;
      const N = Math.round(T * fps);
      let worstPtp = 0, midPtps: number[] = [], speeds: number[] = [];
      for (const name of names) {
        const vi = tree.vessels.findIndex((v: any) => v.name === name);
        const v = tree.vessels[vi];
        const idxs = [0.25, 0.5, 0.75].map((f) => Math.round(f * (v.samples.length - 1)));
        const traj: { u: number; v: number }[][] = idxs.map(() => []);
        for (let k = 0; k < N; k++) {
          const { scene } = sceneAt(k / fps, view, side, bh);
          // find tube with matching length = vessel samples length (first opacified vessel tube of that size after thorax)
          const tube = scene.tubes.find((tb: any) => tb.pts.length === v.samples.length && Array.isArray(tb.mu[0]) && tb.mu[0][1] > 0);
          if (!tube) continue;
          idxs.forEach((ix, j) => { const p = XrayRenderer.project(scene.cam, tube.pts[ix]); traj[j].push({ u: p.u, v: p.v }); });
        }
        traj.forEach((tr, j) => {
          if (tr.length < 2) return;
          const us = tr.map((p) => p.u), vs = tr.map((p) => p.v);
          const ptp = Math.hypot(Math.max(...us) - Math.min(...us), Math.max(...vs) - Math.min(...vs)) * 256; // px at 512
          if (j === 1) midPtps.push(ptp);
          worstPtp = Math.max(worstPtp, ptp);
          for (let k = 1; k < tr.length; k++) speeds.push(Math.hypot(tr[k].u - tr[k - 1].u, tr[k].v - tr[k - 1].v) * 256);
        });
      }
      speeds.sort((a, b) => a - b);
      const p95 = speeds[Math.floor(0.95 * (speeds.length - 1))];
      console.log(`${vn} ${side} breath=${bh === null ? "free" : "held"}: mid-vessel ptp px@512 ${midPtps.map((x) => x.toFixed(1)).join(",")} (max any ${worstPtp.toFixed(1)}; ${(100 * Math.max(...midPtps) / 512).toFixed(1)}% width); P95 speed ${p95.toFixed(1)} px/frame; median ${speeds[Math.floor(speeds.length / 2)].toFixed(1)}`);
    }
  }
}
