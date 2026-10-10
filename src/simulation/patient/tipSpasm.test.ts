// diag-spasm-states: catheter-tip spasm in the patient engine (responses.ts TipSpasmModel) and the
// radial artery the engine hosts for a radial case (PatientEngine.setRadialAccess).
//   npx vitest run src/simulation/patient/tipSpasm.test.ts
import { describe, expect, it } from "vitest";
import { scenarioCase } from "../caseGenerator";
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { engineOptionsForCase } from "../../ui/sim/labSession";
import { PatientEngine, ostialRadii } from "./engine";
import { MP_RESP, MP_TIP_SPASM, tipSpasmSusceptibility } from "./responses";
import type { TipPressureState } from "./transducer";

function engineFor(id: string) {
  const c = scenarioCase(id, "1")!;
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  return { c, tree, engine: new PatientEngine({ ...engineOptionsForCase(c), tree, lesions: c.lesions }) };
}

/** A JR4 seated deep in the RCA with the wall contact the simple model gives a deep seat (transducer.ts tipFromEngagement). */
const DEEP_RCA = { location: "ostium" as const, side: "right" as const, gap: 0.1, runoff: 0.2, wallContact: 0.6 };

describe("catheter-tip spasm in a small non-dominant RCA (diag-catheter-tip-spasm-rca)", () => {
  it("the scenario's RCA is small and non-dominant, and so more susceptible than an average RCA", () => {
    const { c, tree } = engineFor("diag-catheter-tip-spasm-rca");
    expect(c.dominance).toBe("left");
    const r = ostialRadii(tree).right!;
    expect(r).toBeLessThan(MP_TIP_SPASM.refRadiusMm);
    expect(tipSpasmSusceptibility(r)).toBeGreaterThan(1.2);
    expect(tipSpasmSusceptibility(2.4)).toBe(1);
  });

  it("with wallContact 0.6 engine spasm rises, tipState ventricularises then falls, and after withdrawal plus GTN 100 µg spasm halves within 120 s", () => {
    const { engine } = engineFor("diag-catheter-tip-spasm-rca");
    engine.setTipSpasmModel(engine.tipSpasmModelForTree());
    engine.advance(10);
    engine.setTip(DEEP_RCA);
    const states: TipPressureState[] = [];
    const spasm: number[] = [];
    const tipMean: number[] = [];
    for (let i = 0; i < 24; i++) {
      engine.advance(2.5);
      const v = engine.vitals();
      states.push(v.tipState);
      spasm.push(engine.tipSpasm().right);
      tipMean.push(v.art?.mean ?? NaN);
    }
    // spasm rises
    for (let i = 1; i < spasm.length; i++) expect(spasm[i]).toBeGreaterThanOrEqual(spasm[i - 1] - 1e-9);
    expect(spasm[spasm.length - 1]).toBeGreaterThan(0.3);
    // the trace ventricularises, then keeps falling (damped or wedged, the pressure lower), after the
    // first seconds in which the column settles from the aortic pressure (samples from 5 s on)
    const firstV = states.indexOf("ventricularised", 2);
    const firstFall = states.findIndex((s, i) => i > firstV && (s === "damped" || s === "wedged"));
    expect(firstV).toBeGreaterThanOrEqual(2);
    expect(firstFall).toBeGreaterThan(firstV);
    expect(states[states.length - 1]).toMatch(/damped|wedged/);
    expect(tipMean[tipMean.length - 1]).toBeLessThan(tipMean[firstV] - 10);
    // withdrawal to the aorta and 100 µg of intracoronary nitroglycerin: the spasm halves within 120 s
    const peak = engine.tipSpasm().right;
    engine.setTip({ location: "aorta" });
    expect(engine.giveDrug("gtn", 100, "ic", { side: "right" }).ok).toBe(true);
    let halvedAt: number | null = null;
    for (let t = 1; t <= 120; t++) {
      engine.advance(1);
      if (halvedAt === null && engine.tipSpasm().right <= peak / 2) halvedAt = t;
    }
    expect(halvedAt).not.toBeNull();
    expect(halvedAt!).toBeLessThanOrEqual(120);
    expect(engine.vitals().tipState).toBe("aortic");
  });

  it("withdrawal alone does not relieve it within 120 s: the nitrate does (the module text's sequence)", () => {
    const { engine } = engineFor("diag-catheter-tip-spasm-rca");
    engine.setTipSpasmModel(engine.tipSpasmModelForTree());
    engine.advance(10);
    engine.setTip(DEEP_RCA);
    engine.advance(60);
    const peak = engine.tipSpasm().right;
    engine.setTip({ location: "aorta" });
    engine.advance(120);
    expect(engine.tipSpasm().right).toBeGreaterThan(peak / 2);
  });

  it("a gentle coaxial re-engagement after the nitrate does not provoke it again", () => {
    const { engine } = engineFor("diag-catheter-tip-spasm-rca");
    engine.setTipSpasmModel(engine.tipSpasmModelForTree());
    engine.advance(10);
    engine.setTip(DEEP_RCA);
    engine.advance(60);
    engine.setTip({ location: "aorta" });
    engine.giveDrug("gtn", 100, "ic", { side: "right" });
    engine.advance(120);
    // a selective coaxial seat (tipFromEngagement: wall contact 0.1)
    engine.setTip({ location: "ostium", side: "right", gap: 0.8, wallContact: 0.1 });
    engine.advance(60);
    expect(engine.tipSpasm().right).toBeLessThan(0.05);
    expect(engine.vitals().tipState).toBe("aortic");
  });

  it("is off by default: without the model the engine keeps the legacy dynamics (every other lab unchanged)", () => {
    const a = engineFor("diag-catheter-tip-spasm-rca").engine;
    expect(a.tipSpasmModel()).toBeNull();
    a.advance(10);
    a.setTip(DEEP_RCA);
    a.advance(60);
    // the legacy target: MP_RESP.spasmGain × (0.6 − 0.2), with its 25 s time constant
    const legacy = MP_RESP.spasmGain * 0.4;
    expect(a.tipSpasm().right).toBeGreaterThan(0.85 * legacy);
    expect(a.tipSpasm().right).toBeLessThan(legacy + 1e-6);
    a.setTip({ location: "aorta" });
    a.advance(120);
    expect(a.tipSpasm().right).toBeLessThan(0.02);
  });
});

describe("the radial artery the engine hosts (PatientEngine.setRadialAccess)", () => {
  it("is off by default; once given, a vasopressor infusion and an intra-arterial vasodilator act on it", () => {
    const { engine } = engineFor("diag-ohca-vasopressor-radial");
    expect(engine.radial).toBeNull();
    engine.setRadialAccess({ sheathOdMm: 2.67, radialDiamMm: 2.0 });
    expect(engine.radial).not.toBeNull();
    const calm = engineFor("diag-ohca-vasopressor-radial").engine;
    calm.setRadialAccess({ sheathOdMm: 2.67, radialDiamMm: 2.0 });
    engine.startInfusion({ drug: "noradrenaline", rate: 10 });
    expect(engine.vasopressorRunning()).toBe(true);
    engine.advance(120);
    calm.advance(120);
    expect(engine.radial!.level).toBeGreaterThan(calm.radial!.level);
    // verapamil into the artery (the drugs tab gives it through the engine)
    const before = engine.radial!.level;
    expect(engine.giveDrug("verapamil", 2.5, "ia").ok).toBe(true);
    expect(engine.radial!.vasodilatorEffect()).toBeGreaterThan(0.5);
    engine.advance(120);
    expect(engine.radial!.level).toBeLessThan(before);
    // the snapshot carries it
    const sn = engine.snapshot();
    expect(sn.radial?.doses.length).toBe(1);
  });

  it("forearm pain is the radial host's, reported apart from the chest pain, and nothing without a radial artery", () => {
    const { engine } = engineFor("diag-radial-spasm-entrapment");
    engine.forearmPain(1);
    expect(engine.vitals().symptoms.forearmPain).toBeUndefined();
    engine.setRadialAccess({ sheathOdMm: 2.67, radialDiamMm: 1.9 });
    engine.advance(2);
    const chest = engine.vitals().symptoms.chestPain;
    engine.forearmPain(0.8);
    const v = engine.vitals();
    expect(v.symptoms.forearmPain!).toBeGreaterThan(3);
    expect(v.symptoms.chestPain).toBe(chest);
    // it fades once the spasm stops hurting
    engine.advance(120);
    expect(engine.vitals().symptoms.forearmPain!).toBeLessThan(0.5);
  });
});

describe("snapshot and restore of the spasm state", () => {
  it("round-trips the tip spasm model and the radial host, and a snapshot without them clears them", () => {
    const { engine } = engineFor("diag-catheter-tip-spasm-rca");
    const bare = engine.snapshot();
    expect(bare.tipSpasm).toBeUndefined();
    expect(bare.radial).toBeUndefined();
    engine.setTipSpasmModel(engine.tipSpasmModelForTree());
    engine.setRadialAccess({ sheathOdMm: 2.67, radialDiamMm: 2.0 });
    engine.advance(10);
    engine.setTip(DEEP_RCA);
    engine.advance(30);
    engine.forearmPain(0.6);
    const sn = engine.snapshot();
    expect(sn.tipSpasm).toEqual(engine.tipSpasmModel());
    expect(sn.radial?.pain).toBeGreaterThan(0);
    // restored into an engine with the legacy dynamics: the held model comes back with the spasm level
    const other = engineFor("diag-catheter-tip-spasm-rca").engine;
    other.restore(sn);
    expect(other.tipSpasmModel()).toEqual(engine.tipSpasmModel());
    expect(other.tipSpasm()).toEqual(engine.tipSpasm());
    expect(other.radial).not.toBeNull();
    expect(other.radial!.pain).toBeCloseTo(engine.radial!.pain, 9);
    // the two step alike after the restore
    engine.advance(20);
    other.advance(20);
    expect(other.tipSpasm().right).toBeCloseTo(engine.tipSpasm().right, 9);
    // a snapshot without them clears a stale host and the model
    other.restore(bare);
    expect(other.radial).toBeNull();
    expect(other.tipSpasmModel()).toBeNull();
  });

  it("tipSpasm fills a caller's object, and epicardialDilation reads the cached effects", () => {
    const { engine } = engineFor("diag-catheter-tip-spasm-rca");
    const out = { left: -1, right: -1 };
    expect(engine.tipSpasm(out)).toBe(out);
    expect(out).toEqual(engine.tipSpasm());
    engine.giveDrug("gtn", 100, "ic", { side: "right" });
    engine.advance(5);
    expect(engine.epicardialDilation).toBeGreaterThan(0.3);
    expect(engine.epicardialDilation).toBeCloseTo(engine.pharm.effects().epicardialDilation, 2);
  });
});
