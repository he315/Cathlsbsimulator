import { REFERENCE_VIEWS, prepareScenario, resolveSpec, sceneInputAt } from "../../src/dev/xrayCapture";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";
for (const V of REFERENCE_VIEWS) {
  const R = resolveSpec({ set: "probe", name: "p", view: V.view, scenario: V.scenario, nFrames: 51, annotate: false, upload: false, ...(V.mode ? { mode: V.mode } : {}) });
  const p = prepareScenario(R.scenario);
  const r = buildXrayScene(sceneInputAt(p, R, 20, {}));
  const ex = r.exposure as unknown as Record<string, number>;
  console.log(V.name.padEnd(12), "kVp", ex.kVp?.toFixed?.(1), "mA", ex.mA?.toFixed?.(0), "cu", ex.cuMm, "iodineGain", r.params.iodineGain?.toFixed(3), "metalGain", r.params.metalGain?.toFixed(3), "spr", r.params.spr?.toFixed(2), "counts", r.params.counts?.toFixed(0));
}
