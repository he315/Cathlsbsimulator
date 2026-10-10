// The injection hazard model of the diagnostic lab (diag-rhythm-haemodynamic-events): VF from what the
// injection did, sustained VT from LV contact, SVT ended by AV nodal block, the new rhythms and a volume
// deficit; and the engine's defaults are unchanged when the model is off.
//   npx vitest run src/simulation/patient/injectionHazard.test.ts
import { describe, expect, it } from "vitest";
import { PatientEngine } from "./engine";
import { MP_INJECTION_HAZARD, dwellVfProbability, injectionVfPerMl, injectionVfProbability } from "./responses";
import { MP_INTERACTION } from "./pharmacology";

const CONUS_TIP = { location: "coronary" as const, side: "right" as const, gap: 0.09, conus: true };
const FREE_TIP = { location: "ostium" as const, side: "right" as const, gap: 0.8 };

describe("the injection hazard model", () => {
  it("100 seeded conus injections produce VF in some but not all; 100 selective free-trace injections produce none", () => {
    let conusVf = 0;
    let freeVf = 0;
    for (let i = 1; i <= 100; i++) {
      const conus = new PatientEngine({ seed: `conus-${i}` });
      conus.setInjectionHazards({});
      conus.setTip(CONUS_TIP);
      // a 7 mL hand injection (the lab's standard push) with the tip in the conus branch
      const r = conus.injectionHazard(7, "right", { tipState: "damped", conus: true, coronary: true });
      if (r) {
        conusVf++;
        expect(r).toBe("injection into the conus branch");
        expect(conus.vitals().rhythmKind).toBe("vf");
      }
      const free = new PatientEngine({ seed: `free-${i}` });
      free.setInjectionHazards({});
      free.setTip(FREE_TIP);
      if (free.injectionHazard(7, "right", { tipState: "aortic", conus: false, coronary: true })) freeVf++;
      // the contrast itself books without a second VF draw
      free.contrast(7, "right", { hazard: false });
      if (free.vitals().rhythmKind === "vf") freeVf++;
    }
    expect(conusVf).toBeGreaterThan(0);
    expect(conusVf).toBeLessThan(100);
    expect(freeVf).toBe(0);
  });

  it("the hazard per mL: the conus highest, a damped or ventricularised trace, a wedged catheter, a plugging gap; a free trace none, a root puff none", () => {
    const m = MP_INJECTION_HAZARD;
    const conus = injectionVfPerMl(m, { tipState: "damped", conus: true, coronary: true }).perMl;
    const damped = injectionVfPerMl(m, { tipState: "damped", conus: false, coronary: true, gap: 0.5 }).perMl;
    const vent = injectionVfPerMl(m, { tipState: "ventricularised", conus: false, coronary: true, gap: 0.5 }).perMl;
    const wedged = injectionVfPerMl(m, { tipState: "wedged", conus: false, coronary: true, gap: 0.5 }).perMl;
    const plugged = injectionVfPerMl(m, { tipState: "damped", conus: false, coronary: true, gap: 0 }).perMl;
    const free = injectionVfPerMl(m, { tipState: "aortic", conus: false, coronary: true, gap: 0.8 }).perMl;
    const root = injectionVfPerMl(m, { tipState: "damped", conus: true, coronary: false }).perMl;
    expect(conus).toBeGreaterThan(damped);
    expect(vent).toBe(damped);
    expect(damped).toBeGreaterThan(wedged);
    expect(plugged).toBeGreaterThan(damped);
    expect(free).toBe(0);
    expect(root).toBe(0);
    expect(injectionVfProbability(m, 7, { tipState: "aortic", conus: false, coronary: true, gap: 0.8 })).toBe(0);
    // the dwell term grows with the seconds the contrast is held
    expect(dwellVfProbability(m, 7, 8)).toBeGreaterThan(dwellVfProbability(m, 7, 4));
    expect(dwellVfProbability(m, 7, 0)).toBe(0);
  });

  it("is off by default: contrast() keeps the legacy draw, injectionHazard and contrastDwell do nothing, and the snapshot carries no model", () => {
    const e = new PatientEngine({ seed: "off" });
    expect(e.injectionHazards()).toBeNull();
    e.setTip(CONUS_TIP);
    expect(e.injectionHazard(50, "right", { tipState: "damped", conus: true, coronary: true })).toBeNull();
    expect(e.contrastDwell(50, 100)).toBeNull();
    expect(e.snapshot().inj).toBeUndefined();
    // with the model on, the snapshot restores it and its generator
    e.setInjectionHazards({ dwellPerMlS: 0.001 });
    const sn = e.snapshot();
    expect(sn.inj?.model.dwellPerMlS).toBe(0.001);
    const f = new PatientEngine({ seed: "off" });
    f.restore(sn);
    expect(f.injectionHazards()?.dwellPerMlS).toBe(0.001);
  });

  it("contrast held in the artery fibrillates some patients over 20 s and none over no time", () => {
    let vf = 0;
    for (let i = 1; i <= 40; i++) {
      const e = new PatientEngine({ seed: `dwell-${i}` });
      e.setInjectionHazards({});
      expect(e.contrastDwell(7, 0)).toBeNull();
      for (let k = 0; k < 400; k++) if (e.contrastDwell(7, 0.05)) {
        vf++;
        break;
      }
    }
    expect(vf).toBeGreaterThan(0);
    expect(vf).toBeLessThan(40);
  });
});

describe("rhythms from the model and the scenarios", () => {
  it("catheter contact with the LV wall brings sustained VT in some patients, more often with a long QT, and an antiarrhythmic ends it", () => {
    const count = (qtc: number) => {
      let n = 0;
      for (let i = 1; i <= 12; i++) {
        const e = new PatientEngine({ seed: `lv-${i}` });
        if (qtc) e.profile.baseline.qtc = qtc;
        e.setInjectionHazards({});
        e.setTip({ location: "lv", lvContact: true });
        for (let t = 0; t < 60; t += 0.5) {
          e.advance(0.5);
          if (e.vitals().rhythmKind === "vt") {
            n++;
            break;
          }
        }
      }
      return n;
    };
    const normal = count(0);
    const long = count(MP_INTERACTION.longQtcS + 0.07);
    expect(long).toBeGreaterThan(normal);
    expect(long).toBeGreaterThan(0);
    // the VT persists without treatment, and lidocaine ends it in time
    const e = new PatientEngine({ seed: "vt-lido" });
    e.setInjectionHazards({});
    e.forceRhythm("vt", "test", 165);
    e.advance(20);
    expect(e.vitals().rhythmKind).toBe("vt");
    e.giveDrug("lidocaine", 100, "iv");
    for (let t = 0; t < 400 && e.vitals().rhythmKind === "vt"; t += 1) e.advance(1);
    expect(e.vitals().rhythmKind).toBe("sinus");
  });

  it("forceRhythm gives AF at a set rate, a sustained SVT without P waves and 2:1 block; adenosine ends the SVT and a synchronised shock converts AF and SVT", () => {
    const e = new PatientEngine({ seed: "svt" });
    e.setInjectionHazards({});
    e.forceRhythm("svt", "test", 180);
    e.advance(6);
    const v = e.vitals();
    expect(v.rhythmKind).toBe("svt");
    expect(v.rhythm).toBe("Narrow-complex tachycardia");
    expect(v.hr!).toBeGreaterThan(165);
    e.giveDrug("adenosine", 6000, "iv");
    for (let t = 0; t < 20 && e.vitals().rhythmKind === "svt"; t += 0.5) e.advance(0.5);
    expect(e.vitals().rhythmKind).toBe("sinus");

    const af = new PatientEngine({ seed: "af-150" });
    af.setInjectionHazards({});
    af.forceRhythm("af", "test", 150);
    af.advance(8);
    expect(af.vitals().rhythmKind).toBe("af");
    expect(af.vitals().hr!).toBeGreaterThan(135);
    let converted = false;
    for (let k = 0; k < 4 && !converted; k++) {
      af.charge(200);
      af.advance(6);
      af.clearForShock();
      converted = af.cardiovert() === "converted";
    }
    expect(converted).toBe(true);
    expect(af.vitals().rhythmKind).toBe("sinus");

    const block = new PatientEngine({ seed: "mobitz" });
    block.forceRhythm("mobitz2");
    block.advance(5);
    expect(block.vitals().av).toBe(2);
  });

  it("a synchronised shock in VF delivers nothing and keeps the charge", () => {
    const e = new PatientEngine({ seed: "sync-vf" });
    e.forceRhythm("vf");
    e.charge(200);
    e.advance(6);
    expect(e.cardiovert()).toBe("no-change");
    expect(e.vitals().defib.charged).toBe(200);
    expect(e.vitals().rhythmKind).toBe("vf");
  });

  it("a volume deficit lowers the pressure of the same patient, and EngineOptions.volumeDeficitMl applies it at the start", () => {
    const a = new PatientEngine({ seed: "dry" });
    const b = new PatientEngine({ seed: "dry", volumeDeficitMl: 520 });
    a.advance(30);
    b.advance(30);
    expect(b.vitals().aortaTrue.mean).toBeLessThan(a.vitals().aortaTrue.mean - 3);
  });
});
