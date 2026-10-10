// Computes the simulator's own contrast time course from the real scene builder code.
// Signal = projected iodine content of all opacified coronary tubes (sum mu_iodine * pi r^2 * ds),
// sampled at 15 frames/s from the instant the user presses "inject" (which is also the start of cine).
const ROOT = "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src";
import { buildAnatomy, LEFT_VESSELS, RIGHT_VESSELS } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { CASE_LIBRARY } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/caseGenerator";
import { buildCoronaryTree } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { buildXrayScene } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
void ROOT;

function signal(scene: any, iodineOnlyCoronary: boolean): number {
  let s = 0;
  for (const t of scene.tubes) {
    if (!Array.isArray(t.mu[0])) continue; // coronary tubes carry per-sample mu arrays
    for (let i = 1; i < t.pts.length; i++) {
      const a = t.pts[i - 1], b = t.pts[i];
      const ds = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      const mu = (t.mu[i] as number[])[1];
      s += mu * Math.PI * t.r[i] * t.r[i] * ds;
    }
  }
  void iodineOnlyCoronary;
  return s;
}

function run(label: string, side: "left" | "right", duration: number, injectFrac: number, peak: number, cineLen: number) {
  const c = CASE_LIBRARY[0];
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const filled = side === "left" ? LEFT_VESSELS : RIGHT_VESSELS;
  const root = [{ x: 0, y: 60, z: 0 }, { x: 0, y: 20, z: 0 }];
  const vals: number[] = [];
  const n = Math.round(cineLen * 15);
  for (let f = 0; f < n; f++) {
    const t = f / 15;
    const { scene } = buildXrayScene({
      model, caseData: c, tree, catheterRoot: root as any, french: 5, wire: null,
      bolus: { filled: filled as any, plume: "none", side, t, injectDur: duration * injectFrac, peak, lv: false } as any,
      t: 10 + t, cArm: { laoRao: -30, cranialCaudal: -20 }, field: 250, centreOn: side, pan: { x: 0, y: 0, z: 0 }, mode: "cine", breathHold: 0.7, frame: f,
    } as any);
    vals.push(signal(scene, true));
  }
  const v0 = vals[0], vmax = Math.max(...vals);
  const rise = vmax - v0;
  const arr = vals.findIndex((x) => x >= v0 + 0.3 * rise);
  const above = vals.filter((x) => x >= v0 + 0.5 * rise).length;
  const pk = vals.indexOf(vmax);
  const endFrac = (vals[vals.length - 1] - v0) / rise;
  console.log(JSON.stringify({ label, frames: n, arrival_s: arr / 15, peak_s: pk / 15, above50_s: above / 15, end_fraction_of_peak: +endFrac.toFixed(2), curve: vals.map((x) => +(x / vmax).toFixed(2)) }));
}

// diagnostic lab (useSimulatorStore.inject): duration 4.8 s, FluoroView injectDur = 0.52 * duration, peak 0.95
run("diagnostic-left", "left", 4.8, 0.52, 0.95, 4.8);
run("diagnostic-right", "right", 4.8, 0.52, 0.95, 4.8);
// PCI lab (AngioPci PciFluoro): cine lasts 4.2 s, injectDur 1.8 s, peak 1
run("pci-left", "left", 1.8 / 1, 1.0, 1.0, 4.2);
