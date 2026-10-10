import { buildCoronaryTree } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { buildXrayScene } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { buildAnatomy } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { CASE_LIBRARY } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/caseGenerator";
const c: any = CASE_LIBRARY[0];
const model = buildAnatomy(c);
let t0 = performance.now();
const tree = buildCoronaryTree(model, c);
console.log("tree build ms", (performance.now()-t0).toFixed(1));
console.log("vessels", tree.vessels.length, "samples", tree.vessels.reduce((a,v)=>a+v.samples.length,0));
const bolus = { filled: tree.vessels.map(v=>v.fillId), plume: "none", side: "left", t: 1.5, injectDur: 1.8, peak: 1 } as any;
for (let k=0;k<3;k++){
t0 = performance.now();
const r = buildXrayScene({ model, caseData: c, tree, catheterRoot: [{x:0,y:54,z:0},{x:10,y:20,z:5}], french: 6, bolus, t: k*0.07, cArm:{laoRao:-24,cranialCaudal:-19}, mode:"cine", frame:k } as any);
const ms = performance.now()-t0;
const segs = r.scene.tubes.reduce((a,tb)=>a+Math.max(0,tb.pts.length-1),0);
console.log("scene ms", ms.toFixed(2), "tubes", r.scene.tubes.length, "segments", segs, "bones", r.scene.bones.length, "anat", r.scene.anat.length);
}
