// The physiology lab's rig (physiology-engine-unify-and-setup; its engine adapter from
// physiology-hyperaemia-and-adenosine): the pressure-wire session on a PatientEngine and a model clock, as window.__lab.physiology drives it. The browser check of the
// dev hook is a separate stage; this checks the same calls without a page.
//   npx vitest run src/ui/sections/PhysiologyLab.test.ts
import { describe, expect, it, vi } from "vitest";
import { ADENOSINE } from "../../simulation/patient/pharmacology";
import { PRESET_BY_ID, consoleReading } from "../../simulation/pci/pwSession";
import { PHYSIOLOGY_PATIENT_EVENTS } from "../lab/physiologyTips";
import { generatePatient } from "../../simulation/patient/patient";
import { PATIENT_EVENT_THRESHOLDS } from "../lab/patientEvents";
import { IC_ADENOSINE_UG, IC_GTN_UG, MP_MIN_REST_HR, PhysiologyRig, guideTip, launchPreset, physiologyProfile } from "./PhysiologyLab";
import { LEFT_MAIN_PRESETS } from "../../simulation/physiology";
import { GREY_ZONE_HANDOFF, greyZoneHandoffAvailable } from "../bench/PlanForm";

describe("the physiology rig on the model clock", () => {
  it("a slow seeded resting rate is kept above the bradycardia threshold, so the event (and its adenosine tip) waits for adenosine", () => {
    expect(MP_MIN_REST_HR).toBeGreaterThan(PATIENT_EVENT_THRESHOLDS.bradycardiaHr);
    const preset = PRESET_BY_ID["fault-ebu-lcx"];
    // seeds whose generated stable-angina patient rests at the generator's floor, where beat-to-beat variation
    // took the displayed rate under the threshold before the floor was raised
    const seeds = Array.from({ length: 2000 }, (_, i) => String(i)).filter((k) => generatePatient(`physiology:${preset.id}:${k}`, { indication: "SA" }).baseline.hr <= PATIENT_EVENT_THRESHOLDS.bradycardiaHr + 1).slice(0, 3);
    expect(seeds.length, "no seed drew a resting rate at the threshold").toBeGreaterThan(0);
    for (const seed of seeds) {
      expect(physiologyProfile(preset, seed).baseline.hr).toBeGreaterThanOrEqual(MP_MIN_REST_HR);
      const rig = new PhysiologyRig(preset.id, seed);
      for (let i = 0; i < 20; i++) {
        rig.step(1);
        expect(rig.context().events, `seed ${seed} at ${i + 1} s`).not.toContain("bradycardia");
      }
    }
  });

  it("step(30) advances the session and the engine by 30 s of lab time; context() reports phase physiology", () => {
    const rig = new PhysiologyRig("lad-intermediate", "rig");
    const e0 = rig.engine.time;
    rig.step(30);
    expect(rig.t).toBeCloseTo(30, 6);
    expect(rig.engine.time - e0).toBeCloseTo(30, 3);
    const ctx = rig.context();
    expect(ctx).toMatchObject({ lab: "pci", phase: "physiology", vessel: "LAD" });
  });

  it("the patient's mean aortic pressure is fitted to the case and fed into it", () => {
    const p = physiologyProfile(PRESET_BY_ID["lad-intermediate"], "fit");
    expect(p.baseline.rhythm).toBe("sinus");
    const rig = new PhysiologyRig("lad-intermediate", "fit");
    rig.step(5);
    const map = rig.vitals().aortaTrue.mean;
    expect(Math.abs(map - 92)).toBeLessThan(4);
    expect(Math.abs(rig.session.map - map)).toBeLessThanOrEqual(0.5 + 3);
  });

  it("a clean set-up: the distal trace lies on the aortic trace at the guide tip, and Pd/Pa reads 1.00 after equalising", () => {
    const rig = new PhysiologyRig("lad-intermediate", "clean");
    for (const a of ["zero", "introduce", "remove-introducer", "flush-guide"] as const) rig.dispatch({ type: a });
    rig.dispatch({ type: "sensor", mm: 0 });
    rig.step(3);
    rig.dispatch({ type: "equalise" });
    rig.step(2);
    expect(consoleReading(rig.session).pdpa).toBeCloseTo(1, 2);
    // over the last beat the two displayed channels differ only by the wire's residual offset
    const t = rig.t;
    const diffs = Array.from({ length: 50 }, (_, i) => rig.pdAt(t - 0.9 + i * 0.018) - rig.paAt(t - 0.9 + i * 0.018));
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length);
    expect(Math.abs(mean)).toBeLessThan(4);
    expect(sd).toBeLessThan(6);
    // distal to the lesion at hyperaemia the trace falls below Pa
    rig.dispatch({ type: "sensor", mm: 100 });
    rig.dispatch({ type: "hyperaemia", mode: "iv" });
    rig.step(25);
    const t2 = rig.t;
    const pa = Array.from({ length: 50 }, (_, i) => rig.paAt(t2 - 0.9 + i * 0.018)).reduce((a, b) => a + b, 0) / 50;
    const pd = Array.from({ length: 50 }, (_, i) => rig.pdAt(t2 - 0.9 + i * 0.018)).reduce((a, b) => a + b, 0) / 50;
    expect(pd).toBeLessThan(pa - 10);
  });

  it("air in the aortic line reaches the engine's transducer; the deeply seated guide is a damped tip on the engine", () => {
    const air = new PhysiologyRig("fault-air-aortic", "air");
    air.step(2);
    expect(air.vitals().transducer.verdict).toBe("overdamped");
    expect(air.context().pressure).toBe("damped");
    air.dispatch({ type: "flush-aortic-line" });
    air.step(2);
    expect(air.vitals().transducer.verdict).not.toBe("overdamped");

    const wedge = new PhysiologyRig("guide-wedge", "wedge");
    expect(guideTip(wedge.session)).toMatchObject({ location: "ostium", side: "left" });
    wedge.step(4);
    expect(["damped", "ventricularised"]).toContain(wedge.vitals().tipState);
    expect(["damped", "ventricularised"]).toContain(wedge.context().pressure);
    wedge.dispatch({ type: "guide", engaged: false });
    wedge.step(4);
    expect(wedge.vitals().tipState).toBe("aortic");
  });

  it("IV adenosine reaches the engine: the mean pressure falls, and on a seed that draws it, AV block with bradycardia and hypotension (every declared patient event)", () => {
    // seed "b13" draws the engine's complete AV block (ADENOSINE.completeAvBlock.iv) for this preset
    const rig = new PhysiologyRig("lad-intermediate", "b13");
    rig.step(2);
    const map0 = rig.vitals().aortaTrue.mean;
    rig.dispatch({ type: "hyperaemia", mode: "iv" });
    const seen = new Set<string>();
    let minMap = Infinity;
    for (let i = 0; i < 40; i++) {
      rig.step(1);
      minMap = Math.min(minMap, rig.vitals().aortaTrue.mean);
      for (const e of rig.context().events ?? []) seen.add(e);
    }
    expect(minMap).toBeLessThan(map0 - 4);
    expect(rig.session.map).toBeLessThan(map0);
    for (const e of PHYSIOLOGY_PATIENT_EVENTS) expect([...seen], e).toContain(e);
    // stopping the infusion lets the block go
    rig.dispatch({ type: "hyperaemia", mode: "none" });
    rig.step(60);
    expect(rig.vitals().av).toBe(0);
  });

  it("without block, IV adenosine still lowers the pressure (the sign that hyperaemia is real)", () => {
    const rig = new PhysiologyRig("rca-negative", "s3");
    rig.step(5);
    const map0 = rig.vitals().aortaTrue.mean;
    rig.dispatch({ type: "hyperaemia", mode: "iv" });
    rig.step(60);
    expect(rig.vitals().aortaTrue.mean).toBeLessThan(map0 - 4);
    expect(rig.context().events).not.toContain("av-block");
  });

  it("the IC bolus goes to the engine at the lesson's dose for the guide's side, the nitrate at 200 µg; the IV infusion at 140 µg/kg/min", () => {
    const rca = new PhysiologyRig("rca-negative", "ic");
    const give = vi.spyOn(rca.engine, "giveDrug");
    const start = vi.spyOn(rca.engine, "startInfusion");
    const stop = vi.spyOn(rca.engine, "stopInfusion");
    rca.dispatch({ type: "hyperaemia", mode: "ic" });
    expect(give).toHaveBeenLastCalledWith("adenosine", IC_ADENOSINE_UG.right, "ic", { side: "right" });
    expect(IC_ADENOSINE_UG.right).toBe(100);
    rca.dispatch({ type: "gtn" });
    expect(give).toHaveBeenLastCalledWith("gtn", IC_GTN_UG, "ic", { side: "right" });
    rca.dispatch({ type: "hyperaemia", mode: "iv" });
    expect(start).toHaveBeenCalledWith({ drug: "adenosine", rate: ADENOSINE.ivStandardUgKgMin, site: "central" });
    rca.dispatch({ type: "hyperaemia", mode: "none" });
    expect(stop).toHaveBeenCalledWith("adenosine");
    const lad = new PhysiologyRig("lad-intermediate", "ic");
    const g2 = vi.spyOn(lad.engine, "giveDrug");
    lad.dispatch({ type: "hyperaemia", mode: "ic" });
    expect(g2).toHaveBeenLastCalledWith("adenosine", IC_ADENOSINE_UG.left, "ic", { side: "left" });
  });

  it("the rig gives the engine what the operator does through the session's adapter: the dose, rate and site as delivered, none of a saline swap, and the bedside orders", () => {
    const rate = ADENOSINE.ivStandardUgKgMin;
    // a tissued hand line: the infusion reaches the engine at the fraction delivered, not at full strength through a central vein
    const tissued = new PhysiologyRig("iv-tissued-line", "line");
    const start = vi.spyOn(tissued.engine, "startInfusion");
    tissued.dispatch({ type: "hyperaemia", mode: "iv", rateUgKgMin: rate, site: "hand" });
    expect(start).toHaveBeenCalledTimes(1);
    const inf = start.mock.calls[0][0];
    expect(inf).toMatchObject({ drug: "adenosine", rate, site: "peripheral" });
    expect(inf.delivered).toBeGreaterThan(0);
    expect(inf.delivered).toBeLessThan(1);
    // a saline swap: the infusion runs but the engine receives no adenosine
    const swap = new PhysiologyRig("saline-swap", "swap");
    const s2 = vi.spyOn(swap.engine, "startInfusion");
    swap.dispatch({ type: "hyperaemia", mode: "iv", rateUgKgMin: rate, site: "central" });
    expect(swap.session.hyper.mode).toBe("iv");
    expect(s2).not.toHaveBeenCalled();
    // the operator's own IC dose (not the fixed dose by side), and the bedside orders
    const rca = new PhysiologyRig("ic-rca-dose", "dose");
    const give = vi.spyOn(rca.engine, "giveDrug");
    const cough = vi.spyOn(rca.engine, "cough");
    rca.dispatch({ type: "hyperaemia", mode: "ic", doseUg: 60, fast: false });
    expect(give).toHaveBeenCalledTimes(1);
    expect(give.mock.calls[0][0]).toBe("adenosine");
    expect(give.mock.calls[0][1]).toBeLessThanOrEqual(60);
    expect(give.mock.calls[0][3]).toMatchObject({ side: "right", vessel: "RCA", fast: false });
    rca.dispatch({ type: "order", order: "cough" });
    expect(cough).toHaveBeenCalledTimes(1);
  });

  it("the preset's hazard model is set up on the engine, and the rhythm the monitor shows reaches the session's arrhythmia record", () => {
    const plain = new PhysiologyRig("lad-intermediate", "vf");
    expect(plain.engine.adenosineHazards()).toBeNull();
    const rig = new PhysiologyRig("adenosine-vf", "vf");
    // the model is on; its forced VF has been spent on the colleague's bolus, given before the start
    expect(rig.engine.adenosineHazards()).not.toBeNull();
    expect(rig.engine.adenosineHazards()?.force).toBeNull();
    let vf = false;
    for (let i = 0; i < 60 && !vf; i++) {
      rig.step(0.5);
      vf = rig.vitals().rhythmKind === "vf";
    }
    expect(vf, "the colleague's fast push brought no VF").toBe(true);
    rig.step(0.5);
    expect(rig.session.arrhythmias.map((x) => x.kind)).toContain("vf");
    expect(rig.context().events).toContain("vf");
  });

  it("the defibrillator in the rig: a shock 1 s after Charge delivers nothing; charged (6 s), cleared and shocked, VF gives way to sinus rhythm", () => {
    const rig = new PhysiologyRig("adenosine-vf", "vf");
    let vf = false;
    for (let i = 0; i < 60 && !vf; i++) {
      rig.step(0.5);
      vf = rig.vitals().rhythmKind === "vf";
    }
    expect(vf, "the colleague's fast push brought no VF").toBe(true);
    // too early: the engine is still charging, so nothing is delivered and nothing is recorded
    rig.dispatch({ type: "order", order: "charge" });
    rig.step(1);
    expect(rig.session.defib.chargingSince).not.toBeNull();
    rig.dispatch({ type: "order", order: "clear" });
    rig.dispatch({ type: "order", order: "shock" });
    expect(rig.session.log[0].value).toBe("Not charged: no shock delivered");
    expect(rig.session.orders.map((o) => o.order)).not.toContain("shock");
    rig.step(2);
    expect(rig.engine.vitals().defib.shocks).toBe(0);
    expect(rig.vitals().rhythmKind).toBe("vf");
    // charged: the session follows the engine's defibrillator
    rig.step(6);
    expect(rig.session.defib).toEqual({ chargingSince: null, charged: true });
    expect(rig.engine.vitals().defib.charged).toBeGreaterThan(0);
    rig.dispatch({ type: "order", order: "clear" });
    rig.dispatch({ type: "order", order: "shock" });
    rig.step(2);
    expect(rig.engine.vitals().defib.shocks).toBe(1);
    expect(rig.vitals().rhythmKind).toBe("sinus");
    expect(rig.session.arrhythmias.find((a) => a.kind === "vf")?.end).not.toBeNull();
    expect(rig.session.defib.charged).toBe(false);
  });

  it("a launch names a preset by scenario (or preset), a mode and events; unknown ids are refused", () => {
    expect(launchPreset({ scenario: "fault-ebu-lcx", mode: "supervised" })).toEqual({ presetId: "fault-ebu-lcx", mode: "supervised", events: [] });
    expect(launchPreset({ preset: "drift", events: "total-occlusion,not-an-event" })).toEqual({ presetId: "drift", mode: null, events: ["total-occlusion"] });
    expect(launchPreset({ scenario: "nope" })).toBeNull();
    // the hyperaemia presets are listed, so a launch opens them
    for (const id of ["ic-rca-dose", "iv-tissued-line", "iv-caffeine", "saline-swap", "contrast-ffr", "adenosine-vf"]) expect(launchPreset({ scenario: id, mode: "guided" })?.presetId, id).toBe(id);
    const rig = new PhysiologyRig("drift", "ev", ["total-occlusion"]);
    expect(rig.context().events).toContain("total-occlusion");
  });

  it("the left main and aorto-ostial presets open from a launch, and the IVUS bench's grey-zone hand-off opens 'lm-intermediate' (physiology-left-main-and-ostial)", () => {
    for (const p of LEFT_MAIN_PRESETS) expect(launchPreset({ scenario: p.id, mode: "guided" })?.presetId, p.id).toBe(p.id);
    expect(greyZoneHandoffAvailable()).toBe(true);
    const l = launchPreset(GREY_ZONE_HANDOFF.params);
    expect(l?.presetId).toBe("lm-intermediate");
    const rig = new PhysiologyRig(l!.presetId, "gz");
    expect(rig.session.presetId).toBe("lm-intermediate");
    expect(rig.session.lmBranch).toBe("LAD");
    expect(rig.context().vessel).toBe("LM");
    expect(rig.context().events).toContain("left-main-lesion");
    // the branch selector reaches the session through the rig
    rig.dispatch({ type: "branch", id: "LCx" });
    expect(rig.session.lmBranch).toBe("LCx");
  });

  it("every lesion of a branched preset has a plain-English label, and stenting logs the label rather than the id", () => {
    for (const p of LEFT_MAIN_PRESETS) {
      if (!p.model) continue;
      for (const l of [...p.model.lm.lesions, ...p.model.branches.flatMap((b) => b.case.lesions)]) {
        expect(l.label, `${p.id} ${l.id}`).toBeTruthy();
        expect(l.label).not.toMatch(/-/);
      }
    }
    const rig = new PhysiologyRig("lm-masked-by-lad", "lbl");
    rig.dispatch({ type: "stent", lesionId: "lad-proximal" });
    expect(rig.session.treated).toEqual(["lad-proximal"]);
    expect(rig.session.log[0]).toMatchObject({ label: "Stent", value: "proximal LAD lesion stented" });
  });

  it("'ostial-lm-damped' in the rig: the seated guide is a wedged left tip on the engine and the context reads the guide pressure damped", () => {
    const rig = new PhysiologyRig("ostial-lm-damped", "os");
    expect(guideTip(rig.session)).toMatchObject({ location: "ostium", side: "left" });
    rig.step(2);
    const ctx = rig.context();
    expect(["damped", "ventricularised"]).toContain(ctx.pressure);
    expect(ctx.events).toEqual(expect.arrayContaining(["left-main-lesion", "aorto-ostial-lesion"]));
    rig.dispatch({ type: "guide", engaged: false });
    expect(guideTip(rig.session)).toEqual({ location: "aorta" });
  });
});
