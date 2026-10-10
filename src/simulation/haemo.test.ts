import { describe, it, expect } from "vitest";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID, applyModifier, derive, gorlinLive, measure, sample, stepUp, timeline, inspiration, withSet, RESP_PERIOD, type Derived } from "./haemo";
import { bsaDuBois, gorlinAVA } from "./calc";

const S = SCENARIO_BY_ID;

describe("haemodynamic scenario library", () => {
  it("has unique ids and a diagnosis distinct from its distractors", () => {
    const ids = new Set(HAEMO_SCENARIOS.map((s) => s.id));
    expect(ids.size).toBe(HAEMO_SCENARIOS.length);
    for (const s of HAEMO_SCENARIOS) {
      expect(s.distractors).not.toContain(s.diagnosis);
      expect(s.distractors.length).toBeGreaterThanOrEqual(3);
      expect(s.keyFindings.length).toBeGreaterThan(0);
    }
  });

  it("timeline is ordered and fits inside the cycle at every heart rate used", () => {
    for (const s of HAEMO_SCENARIOS) {
      const t = timeline(s);
      expect(t.tA).toBeLessThan(t.tMC);
      expect(t.tMC).toBeLessThan(t.tAO);
      expect(t.tAO).toBeLessThan(t.tAC);
      expect(t.tAC).toBeLessThan(t.tMO);
      expect(t.tMO).toBeLessThan(t.T);
      expect(t.dfp).toBeGreaterThan(0.1);
    }
  });

  it("waveforms are continuous across the beat boundary", () => {
    for (const s of HAEMO_SCENARIOS) {
      const T = 60 / s.hr;
      for (const ch of ["RA", "RV", "PA", "PCWP", "LV", "Ao"] as const) {
        const a = sample(s, ch, T - 1e-4, { respiration: false, pvc: false });
        const b = sample(s, ch, T + 1e-4, { respiration: false, pvc: false });
        expect(Math.abs(a - b)).toBeLessThan(1.5);
      }
    }
  });
});

describe("normal study", () => {
  const d = derive(S.normal);
  it("pressures and output in the normal range", () => {
    expect(d.rap).toBeLessThanOrEqual(8);
    expect(d.mpap).toBeLessThanOrEqual(20);
    expect(d.pawp).toBeLessThanOrEqual(12);
    expect(d.ci).toBeGreaterThan(2.5);
    expect(d.pvr).toBeLessThan(2);
    expect(d.qpqs).toBeCloseTo(1, 2);
    expect(stepUp(S.normal)).toBe("none");
    expect(d.aortic.mean).toBeLessThan(3);
  });
});

describe("valve lesions", () => {
  it("severe aortic stenosis: gradient and Gorlin area", () => {
    const d = derive(S["aortic-stenosis"]);
    expect(d.aortic.mean).toBeGreaterThan(40);
    expect(d.aortic.ava).toBeLessThan(1.0);
  });
  it("mitral stenosis: diastolic gradient and area", () => {
    const d = derive(S["mitral-stenosis"]);
    expect(d.mitral.mean).toBeGreaterThan(10);
    expect(d.mitral.mva).toBeLessThan(1.5);
    expect(measure(S["mitral-stenosis"], "LV").edp!).toBeLessThan(12);
  });
  it("acute MR: giant v wave without a step-up", () => {
    const w = measure(S["acute-mr"], "PCWP");
    expect(w.v! - w.mean).toBeGreaterThan(15);
    expect(stepUp(S["acute-mr"])).toBe("none");
  });
  it("acute AR: LVEDP approaches aortic diastolic and exceeds PAWP", () => {
    const lv = measure(S["acute-ar"], "LV");
    const ao = measure(S["acute-ar"], "Ao");
    expect(ao.dia - lv.edp!).toBeLessThan(5);
    expect(lv.edp!).toBeGreaterThan(derive(S["acute-ar"]).pawp);
  });
});

describe("pericardial versus myocardial disease", () => {
  it("constriction: equalisation and RVEDP/RVSP > 1/3", () => {
    const lv = measure(S.constriction, "LV");
    const rv = measure(S.constriction, "RV");
    expect(Math.abs(lv.edp! - rv.edp!)).toBeLessThanOrEqual(5);
    expect(rv.edp! / rv.sys).toBeGreaterThan(1 / 3);
    expect(rv.sys).toBeLessThan(55);
  });
  it("restriction: LVEDP − RVEDP > 5 and PASP > 55", () => {
    const lv = measure(S.restriction, "LV");
    const rv = measure(S.restriction, "RV");
    expect(lv.edp! - rv.edp!).toBeGreaterThan(5);
    expect(rv.edp! / rv.sys).toBeLessThan(1 / 3);
    expect(rv.sys).toBeGreaterThan(55);
  });
  it("constriction shows discordant LV/RV systolic change with inspiration; restriction concordant", () => {
    const peakSys = (id: string, ch: "LV" | "RV", inspiratory: boolean) => {
      const s = S[id];
      const T = 60 / s.hr;
      // find the beat nearest peak inspiration (t ≈ RESP_PERIOD/2) or end-expiration (t ≈ RESP_PERIOD)
      const centre = inspiratory ? RESP_PERIOD / 2 : RESP_PERIOD;
      let best = -Infinity;
      for (let t = centre - T / 2; t < centre + T / 2; t += 0.002) best = Math.max(best, sample(s, ch, t, { respiration: true, pvc: false }));
      return best;
    };
    const dLVc = peakSys("constriction", "LV", true) - peakSys("constriction", "LV", false);
    const dRVc = peakSys("constriction", "RV", true) - peakSys("constriction", "RV", false);
    expect(dLVc).toBeLessThan(0);
    expect(dRVc).toBeGreaterThan(0);
    const dLVr = peakSys("restriction", "LV", true) - peakSys("restriction", "LV", false);
    const dRVr = peakSys("restriction", "RV", true) - peakSys("restriction", "RV", false);
    expect(Math.sign(dLVr)).toBe(Math.sign(dRVr));
  });
  it("tamponade: pulsus paradoxus > 10 mmHg and equal diastolic pressures", () => {
    const s = S.tamponade;
    const T = 60 / s.hr;
    const peakAo = (centre: number) => {
      let best = -Infinity;
      for (let t = centre - T / 2; t < centre + T / 2; t += 0.002) best = Math.max(best, sample(s, "Ao", t, { respiration: true, pvc: false }));
      return best;
    };
    expect(peakAo(RESP_PERIOD) - peakAo(RESP_PERIOD / 2)).toBeGreaterThan(10);
    const d = derive(s);
    const rv = measure(s, "RV");
    expect(Math.abs(d.rap - d.pawp)).toBeLessThanOrEqual(4);
    expect(Math.abs(rv.edp! - d.pawp)).toBeLessThanOrEqual(4);
  });
  it("Kussmaul: RA pressure rises on inspiration in RV infarction", () => {
    const s = S["rv-infarct"];
    const avg = (c: number) => {
      let sum = 0,
        n = 0;
      for (let t = c - 0.4; t < c + 0.4; t += 0.01) {
        sum += sample(s, "RA", t, { respiration: true, pvc: false });
        n++;
      }
      return sum / n;
    };
    expect(avg(RESP_PERIOD / 2)).toBeGreaterThan(avg(RESP_PERIOD));
    expect(inspiration(RESP_PERIOD / 2)).toBeCloseTo(1, 5);
  });
});

describe("HOCM versus fixed AS after an extrasystole", () => {
  const postPvc = (id: string, ch: "LV" | "Ao") => {
    const s = S[id];
    const T = 60 / s.hr;
    // beat index 5 is the potentiated beat, beat 3 is a normal reference beat
    const peak = (b: number) => {
      let best = -Infinity;
      for (let t = b * T; t < (b + 1) * T; t += 0.002) best = Math.max(best, sample(s, ch, t, { respiration: false, pvc: true }));
      return best;
    };
    return peak(5) - peak(3);
  };
  it("HOCM: LV up, aortic down (Brockenbrough)", () => {
    expect(postPvc("hocm", "LV")).toBeGreaterThan(20);
    expect(postPvc("hocm", "Ao")).toBeLessThan(-10);
  });
  it("valvular AS: both rise", () => {
    expect(postPvc("aortic-stenosis", "LV")).toBeGreaterThan(0);
    expect(postPvc("aortic-stenosis", "Ao")).toBeGreaterThan(0);
  });
});

describe("pulmonary hypertension and shock", () => {
  it("PAH is pre-capillary by ESC/ERS 2022 definitions", () => {
    const d = derive(S.pah);
    expect(d.mpap).toBeGreaterThan(20);
    expect(d.pawp).toBeLessThanOrEqual(15);
    expect(d.pvr).toBeGreaterThan(2);
  });
  it("IpcPH: high wedge, PVR ≤ 2", () => {
    const d = derive(S.ipcph);
    expect(d.mpap).toBeGreaterThan(20);
    expect(d.pawp).toBeGreaterThan(15);
    expect(d.pvr).toBeLessThanOrEqual(2);
  });
  it("LV shock: low CI and CPO, RV coping", () => {
    const d = derive(S["lv-shock"]);
    expect(d.ci).toBeLessThan(2.2);
    expect(d.cpo).toBeLessThan(0.6);
    expect(d.papi).toBeGreaterThan(0.9);
    expect(d.raPawp).toBeLessThan(0.8);
  });
  it("RV infarction: high RA/PAWP and low PAPi", () => {
    const d = derive(S["rv-infarct"]);
    expect(d.raPawp).toBeGreaterThan(0.8);
    expect(d.papi).toBeLessThan(0.9);
  });
});

describe("shunts", () => {
  it("ASD: atrial step-up and Qp:Qs ≥ 1.5", () => {
    expect(stepUp(S.asd)).toBe("atrial");
    expect(derive(S.asd).qpqs).toBeGreaterThan(1.5);
  });
  it("VSR: ventricular step-up and Qp:Qs ≥ 1.5", () => {
    expect(stepUp(S.vsr)).toBe("ventricular");
    expect(derive(S.vsr).qpqs).toBeGreaterThan(1.5);
  });
});

// ---------------------------------------------------------------------------
// haemo-study-session-and-tips: the fifteen original scenarios are unchanged; the added scenarios
// and measurement sets sit on the side of each module threshold they are written to teach.
// ---------------------------------------------------------------------------

const DERIVE_KEYS = ["bsa", "vo2", "mixedVenous", "co", "ci", "qp", "qpqs", "map", "mpap", "rap", "pawp", "svr", "pvr", "tpg", "dpg", "cpo", "papi", "raPawp", "aorticMean", "aorticP2P", "aorticPeak", "ava", "mitralMean", "mva", "sep", "dfp"] as const;
// derive() for the fifteen original scenarios, recorded before haemo-study-session-and-tips changed haemo.ts (10 significant digits; null = NaN)
const DERIVE_BEFORE: Record<string, (number | null)[]> = {
  "normal": [1.903136532, 237.8920665, 0.75, 5.432317923, 2.854402631, 5.432317923, 1, 93, 15, 4, 8, 16.38342992, 1.288584376, 7, 2, 1.120189727, 3.75, 0.5, 0.7155951935, 2, 2.97398835, null, 2.093175068, 3.254764913, 0.3, 0.4371428571],
  "aortic-stenosis": [1.710683234, 213.8354043, 0.68, 4.492340425, 2.62605042, 4.492340425, 1, 90, 26, 6, 17, 18.69849389, 2.00341006, 9, 1, 0.8964759164, 3.666666667, 0.3529411765, 45.83790176, 87, 98.49594447, 0.6118502683, 4.39392175, 2.11483206, 0.34, 0.3733333333],
  "mitral-stenosis": [1.598859156, 199.8573945, 0.65, 3.792360427, 2.371916509, 3.792360427, 1, 90, 37, 9, 19, 21.35872936, 4.746384302, 18, 9, 0.7567903292, 3, 0.4736842105, 0.1601930428, 0, 0.9777403825, null, 15.13025857, 0.9427593519, 0.2771809306, 0.3345263865],
  "constriction": [1.802771715, 225.3464644, 0.63, 3.74877669, 2.07945169, 3.74877669, 1, 86, 25, 15, 18, 18.9395117, 1.867275802, 7, 0, 0.7148443356, 1.2, 0.8333333333, 0.8764119221, 3, 3.508539437, null, 4.336090643, 1.844144185, 0.2675647755, 0.2942534063],
  "restriction": [1.825118699, 228.1398374, 0.61, 3.834282982, 2.100840336, 3.834282982, 1, 84, 36, 14, 24, 18.25634684, 3.129659459, 12, 2, 0.7141458325, 2.285714286, 0.5833333333, 1.594942614, 5, 5.554589651, null, 5.208429468, 1.594434712, 0.280624304, 0.349375696],
  "tamponade": [1.809707802, 226.2134752, 0.56, 3.380760928, 1.868125299, 3.380760928, 1, 76, 24, 14, 16, 18.33906665, 2.366331181, 8, 1, 0.5697069413, 1.071428571, 0.875, 0.4996254949, 2, 2.305338959, null, 0.4729316386, null, 0.2310623953, 0.157412181],
  "hocm": [2.017482504, 252.185313, 0.73, 5.328459115, 2.641142664, 5.328459115, 1, 94, 19, 5, 14, 16.70276492, 0.9383575799, 5, -1, 1.110587931, 3.4, 0.3571428571, 35.28812511, 76, 83.54060627, 0.9782703441, 3.010192685, 2.615858285, 0.3043797937, 0.4579731475],
  "pah": [1.636737341, 204.5921676, 0.63, 3.357933423, 2.051601891, 3.357933423, 1, 84, 51, 12, 8, 21.44175924, 12.8054951, 43, 26, 0.625424407, 4, 1.5, 0.12023529, 0, 0.7919653195, null, 2.713692448, 2.172754881, 0.2616835128, 0.2704904002],
  "ipcph": [2.045352394, 255.6690493, 0.57, 3.570597303, 1.74571253, 3.570597303, 1, 79, 30, 10, 24, 19.32449788, 1.68039112, 6, -1, 0.6254483081, 1.7, 0.4166666667, 0.09392654335, 0, 0.6645348313, null, 8.532217167, 1.204657692, 0.2738612788, 0.3204244355],
  "asd": [1.681932844, 210.2416055, 0.715, 4.490614837, 2.669913281, 9.542556529, 2.125, 87, 20, 6, 9, 18.03761911, 1.152730923, 11, 4, 0.8662605118, 3.5, 0.6666666667, 0.1441980542, 0, 0.9069263207, null, 2.84131515, 2.436852289, 0.287914461, 0.3815592232],
  "vsr": [1.894881247, 236.8601559, 0.56, 3.666565881, 1.93498452, 8.708093967, 2.375, 69, 30, 13, 21, 15.27314709, 1.033521231, 9, 1, 0.5609601902, 1.692307692, 0.619047619, 0.5648347385, 2, 2.492624211, null, 6.79254865, 1.866120963, 0.2371708245, 0.1785434612],
  "lv-shock": [1.976695603, 247.0869504, 0.49, 3.038153531, 1.536986032, 3.038153531, 1, 67, 31, 9, 24, 19.09054279, 2.304031027, 7, 0, 0.4513443162, 1.777777778, 0.375, 0.5333716603, 2, 2.393797998, null, 6.244599023, 1.538925542, 0.2415229458, 0.1940326098],
  "rv-infarct": [1.858066827, 232.2583533, 0.56, 3.085423685, 1.660555821, 3.085423685, 1, 68, 20, 14, 11, 17.50164824, 2.916941373, 9, 4, 0.4652080058, 0.7857142857, 1.272727273, 0.554877477, 2, 2.473407463, null, 3.311182512, 1.32576839, 0.3295765308, 0.5849062278],
  "acute-mr": [1.931691159, 241.4613949, 0.51, 3.251742551, 1.683365654, 3.251742551, 1, 74, 36, 10, 26, 19.68175493, 3.075274208, 10, 0, 0.533545341, 2.6, 0.3846153846, 0.6376187121, 2, 2.707642023, null, 17.42117153, 1.009276007, 0.2393172106, 0.1861373349],
  "acute-ar": [2.044449807, 255.5562259, 0.63, 4.093877769, 2.002434961, 4.093877769, 1, 71, 27, 7, 19, 15.63309987, 1.954137483, 8, 1, 0.6444907353, 2.571428571, 0.3684210526, 0.5736574577, -2, 2.666674105, null, 1.667183053, null, 0.2461237962, 0.2107992807],
};

function flat(d: Derived): Record<(typeof DERIVE_KEYS)[number], number> {
  return {
    bsa: d.bsa, vo2: d.vo2, mixedVenous: d.mixedVenous, co: d.co, ci: d.ci, qp: d.qp, qpqs: d.qpqs, map: d.map, mpap: d.mpap, rap: d.rap, pawp: d.pawp,
    svr: d.svr, pvr: d.pvr, tpg: d.tpg, dpg: d.dpg, cpo: d.cpo, papi: d.papi, raPawp: d.raPawp,
    aorticMean: d.aortic.mean, aorticP2P: d.aortic.peakToPeak, aorticPeak: d.aortic.peakInstant, ava: d.aortic.ava,
    mitralMean: d.mitral.mean, mva: d.mitral.mva, sep: d.timeline.sep, dfp: d.timeline.dfp,
  };
}

describe("the fifteen original scenarios", () => {
  it("are still the first fifteen, in order", () => {
    expect(HAEMO_SCENARIOS.slice(0, 15).map((s) => s.id)).toEqual(Object.keys(DERIVE_BEFORE));
  });
  it("derive() values are unchanged", () => {
    for (const [id, before] of Object.entries(DERIVE_BEFORE)) {
      const now = flat(derive(S[id]));
      DERIVE_KEYS.forEach((k, i) => {
        const b = before[i];
        const v = now[k];
        if (b === null) expect(Number.isNaN(v), `${id}.${k}`).toBe(true);
        else expect(Math.abs(v - b), `${id}.${k}: ${v} vs ${b}`).toBeLessThanOrEqual(Math.abs(b) * 1e-9 + 1e-12);
      });
    }
  });
  it("have no measurement sets, so withSet returns them as they are", () => {
    for (const id of Object.keys(DERIVE_BEFORE)) {
      expect(S[id].sets).toBeUndefined();
      expect(withSet(S[id], "post")).toBe(S[id]);
    }
  });
});

describe("added scenarios", () => {
  it("pulmonary embolism: right-sided pressures up with a normal wedge, PA systolic below 60 mmHg, hypotensive", () => {
    const s = S["pe-high-risk"];
    const d = derive(s);
    expect(s.events).toEqual(["pulmonary-embolism"]);
    expect(d.rap).toBeGreaterThan(10);
    expect(d.pawp).toBeLessThanOrEqual(12);
    expect(measure(s, "PA").sys).toBeLessThan(60);
    expect(d.map).toBeLessThan(65);
    expect(s.sats.Ao).toBeLessThan(0.92);
  });
  it("shock presets: before PCI CPO below 0.6 W with the PAPi of their profile; the after-PCI set lands on the intended row", () => {
    const pre = (id: string) => derive(withSet(S[id], "pre"));
    const post = (id: string) => derive(withSet(S[id], "post"));
    // LV-predominant: RV coping, then the wean row (CPO > 0.6 and PAPi > 0.9)
    expect(pre("shock-lv").cpo).toBeLessThan(0.6 - 0.05);
    expect(pre("shock-lv").papi).toBeGreaterThan(0.9 + 0.2);
    expect(pre("shock-lv").pawp).toBeGreaterThan(18);
    expect(post("shock-lv").cpo).toBeGreaterThan(0.6 + 0.05);
    expect(post("shock-lv").papi).toBeGreaterThan(0.9 + 0.2);
    // RV-predominant: RA above 12, PAPi below 0.9; after PCI CPO > 0.6 but PAPi still < 0.9
    expect(pre("shock-rv").cpo).toBeLessThan(0.6 - 0.05);
    expect(pre("shock-rv").papi).toBeLessThan(0.9 - 0.2);
    expect(pre("shock-rv").rap).toBeGreaterThan(12);
    expect(post("shock-rv").cpo).toBeGreaterThan(0.6 + 0.05);
    expect(post("shock-rv").papi).toBeLessThan(0.9 - 0.1);
    // biventricular: both failing, and after PCI CPO < 0.6 with PAPi < 0.9 (right-sided support)
    expect(pre("shock-biv").pawp).toBeGreaterThan(18);
    expect(pre("shock-biv").papi).toBeLessThan(0.9 - 0.2);
    expect(post("shock-biv").cpo).toBeLessThan(0.6 - 0.05);
    expect(post("shock-biv").papi).toBeLessThan(0.9 - 0.2);
    // the pre set is the scenario itself
    for (const id of ["shock-lv", "shock-rv", "shock-biv"]) expect(withSet(S[id], "pre").ao).toBe(S[id].ao);
  });
  it("high-risk elective: wedge above 25 mmHg with mixed venous saturation below 50% and a normal blood pressure", () => {
    const d = derive(S["chip-elective"]);
    expect(d.pawp).toBeGreaterThan(25);
    expect(d.mixedVenous).toBeLessThan(0.5);
    expect(d.map).toBeGreaterThan(70);
  });
  it("every scenario's events are names of the tip vocabulary used for haemodynamic conditions", () => {
    const allowed = new Set(["aortic-stenosis", "low-flow-aortic-stenosis", "mitral-stenosis", "hocm", "constriction", "restriction", "pulmonary-embolism", "pulmonary-hypertension", "tricuspid-regurgitation", "tricuspid-stenosis", "pulmonary-stenosis", "atrial-shunt", "ventricular-shunt", "cardiogenic-shock", "tamponade"]);
    for (const s of HAEMO_SCENARIOS) {
      expect(Array.isArray(s.events), s.id).toBe(true);
      for (const e of s.events ?? []) expect(allowed.has(e), `${s.id}: ${e}`).toBe(true);
    }
  });
});

describe("aortic valve studies (haemo-aortic-stenosis-studies)", () => {
  const S2 = SCENARIO_BY_ID;
  const peak = (id: string) => {
    const s = S2[id];
    return gorlinLive(s, s.modifiers![s.modifiers!.length - 1]);
  };
  const base = (id: string) => gorlinLive(S2[id], S2[id].modifiers![0]);

  it("the crossing scenarios are severe on simultaneous traces: mean gradient above 40 mmHg, Gorlin area below 1.0 cm²", () => {
    for (const id of ["as-concordant-echo", "as-discordant-cross"]) {
      const d = derive(S2[id]);
      expect(d.aortic.mean, id).toBeGreaterThan(40);
      expect(d.aortic.ava, id).toBeLessThan(1.0);
      expect(S2[id].modifiers).toBeUndefined();
    }
  });

  it("classical low-flow low-gradient at baseline: area 1.0 cm² or less, mean gradient below 40 mmHg, stroke volume index 35 mL/m² or less", () => {
    for (const id of ["lflg-true", "lflg-pseudo", "lflg-no-reserve"]) {
      const s = S2[id];
      const g = base(id);
      expect(g.ava, id).toBeLessThanOrEqual(1.0);
      expect(g.meanGradient, id).toBeLessThan(40);
      expect(g.sv / bsaDuBois(s.heightCm, s.weightKg), id).toBeLessThanOrEqual(35);
      expect(s.events, id).toEqual(["aortic-stenosis", "low-flow-aortic-stenosis"]);
      // the scenario's own landmarks are its baseline stage, so the main recorder and the stage agree
      const d = derive(s);
      expect(d.aortic.ava, id).toBeCloseTo(g.ava, 6);
      expect(d.co, id).toBeCloseTo(g.co, 6);
      // the doses are the module's stepwise protocol, baseline first
      expect(s.modifiers!.map((m) => m.dose), id).toEqual([0, 5, 10, 15, 20]);
    }
  });

  it("gorlinLive in 'lflg-pseudo' rises above 1.0 cm² at peak dobutamine", () => {
    expect(peak("lflg-pseudo").ava).toBeGreaterThan(1.0);
    expect(peak("lflg-pseudo").meanGradient).toBeLessThan(40);
    expect(peak("lflg-pseudo").sv / base("lflg-pseudo").sv - 1).toBeGreaterThanOrEqual(0.2);
  });

  it("gorlinLive in 'lflg-true' stays at or below 1.0 cm² at peak dobutamine while the gradient exceeds 40 mmHg", () => {
    expect(peak("lflg-true").ava).toBeLessThanOrEqual(1.0);
    expect(peak("lflg-true").meanGradient).toBeGreaterThan(40);
    expect(peak("lflg-true").sv / base("lflg-true").sv - 1).toBeGreaterThanOrEqual(0.2);
    // at every stage the area stays at or below 1.0 cm²
    for (const m of S2["lflg-true"].modifiers!) expect(gorlinLive(S2["lflg-true"], m).ava, m.id).toBeLessThanOrEqual(1.0);
  });

  it("'lflg-no-reserve' stroke volume rises less than 20% at peak dobutamine", () => {
    expect(peak("lflg-no-reserve").sv / base("lflg-no-reserve").sv - 1).toBeLessThan(0.2);
    expect(peak("lflg-no-reserve").map).toBeLessThan(65);
  });

  it("gorlinLive is calc.gorlinAVA of the modified output, heart rate, ejection period and gradient, and moves with flow", () => {
    const s = S2["lflg-pseudo"];
    let prevCo = 0;
    for (const m of s.modifiers!) {
      const g = gorlinLive(s, m.id);
      expect(g.ava).toBeCloseTo(gorlinAVA(g.co, g.hr, g.sep, g.meanGradient), 9);
      expect(g.hr).toBe(m.hr);
      expect(g.sep).toBe(m.sep);
      expect(g.dose).toBe(m.dose);
      // the gradient on the traces is the one flow through the stage's orifice produces
      expect(g.ava).toBeCloseTo(m.orificeCm2, 2);
      expect(g.co).toBeGreaterThan(prevCo);
      prevCo = g.co;
    }
    // without a stage it is the scenario itself
    expect(gorlinLive(S2["aortic-stenosis"]).ava).toBeCloseTo(derive(S2["aortic-stenosis"]).aortic.ava, 9);
  });

  it("applyModifier leaves the scenario untouched and is memoised", () => {
    const s = S2["lflg-true"];
    const before = JSON.stringify(s);
    const m = s.modifiers![3];
    const a = applyModifier(s, m);
    expect(applyModifier(s, m)).toBe(a);
    expect(JSON.stringify(s)).toBe(before);
    expect(a.hr).toBe(m.hr);
    expect(a.ao.sys).toBe(m.ao.sys);
    expect(a.lv.sys).toBeGreaterThan(s.lv.sys);
  });
});
