import { describe, it, expect } from "vitest";
import { generatePatient, lesionsFromProfile, haemoFingerprint, cockcroftGault, ckdEpi2021, cigarroaMacd, gradeBand, caseWithPatient, vignette, presetPatient, culpritOf, type PatientProfile } from "./patient";
import { ANGIOCAD_MARGINALS, ANGIOCAD_SEGMENTS, ANGIOCAD_SOURCE } from "./angiocadPriors";
import { PatientEngine, thrombusHazardFor, MP_THROMBUS, MP_ADENOSINE_HAZARDS } from "./engine";
import { ADENOSINE, MP_CAFFEINE_ADENOSINE, icAdenosineEffectSiteUg, icAdenosineHyperaemiaOf, ivAdenosineLevelAt, ivAdenosineSteadyLevel } from "./pharmacology";
import { initialPwSession, setUpPwEngine } from "../pci/pwSession";
import { Transducer, TipChamber, MMHG_PER_CM, tipFromEngagement, classifyTip } from "./transducer";
import { Pharmacology, ACT_TARGET, DRUGS, ORAL_ONSET_S, FORMULARY_REFERENCE, HEPARIN_BOLUS_HALF_LIFE_MIN, PDE5_WINDOW_H, heparinHalfLifeS, type DrugId } from "./pharmacology";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Responses, CONTRAST_REACTION } from "./responses";
import { Rhythm } from "./rhythm";
import { SeededRng } from "./rng";
import { coronaryFlowFor, defaultFlowMap, coronaryCaseFor, supplyFor, type Territory } from "./coronaryFlow";
import type { AngioCadSegment } from "./angiocadPriors";
import { LEADS, ventricularVcg, leadsFromVcg, stemiCriteria, DOWER, INVERSE_DOWER, INVERSE_DOWER_LEADS, type Lead } from "../ecg12";
import { pressureFromEngine } from "../pressure";
import { ffr } from "../physiology";
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { CASE_LIBRARY } from "../caseGenerator";
import type { EngagementState, Lesion } from "../../types";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import HaemoMonitor from "../../ui/lab/HaemoMonitor";

/** A patient with no coronary disease (for clean physiology experiments). */
function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
}

function engine(seed = 11, opts: Partial<ConstructorParameters<typeof PatientEngine>[0]> = {}) {
  const e = new PatientEngine({ profile: healthy(seed), lesions: [], ...opts });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(10);
  return e;
}

// ---------------------------------------------------------------------------
describe("seeded patient generator", () => {
  it("reproduces the AngioCAD segment frequencies within 3 percentage points (1,000 patients, n = 376)", () => {
    expect(ANGIOCAD_SOURCE.nWithIndication).toBe(376);
    const N = 1000;
    const abn = new Array(ANGIOCAD_SEGMENTS.length).fill(0);
    for (let s = 1; s <= N; s++) {
      const p = generatePatient(s);
      ANGIOCAD_SEGMENTS.forEach((seg, i) => {
        if (p.angiocad.grades[seg] > 0) abn[i]++;
      });
    }
    ANGIOCAD_SEGMENTS.forEach((seg, i) => {
      const sim = abn[i] / N;
      const real = ANGIOCAD_MARGINALS.all.abnormal[i] / ANGIOCAD_MARGINALS.all.n;
      expect(Math.abs(sim - real), seg).toBeLessThan(0.03);
    });
  });

  it("conditions on indication", () => {
    const N = 400;
    let stemiCulprit = 0;
    for (let s = 1; s <= N; s++) {
      const p = generatePatient(s, { indication: "STEMI" });
      expect(p.indication).toBe("STEMI");
      if (p.culprit && p.culprit.grade >= 5) stemiCulprit++;
    }
    expect(stemiCulprit / N).toBeGreaterThan(0.7);
    const sa = generatePatient(5, { indication: "SA" });
    expect(sa.culprit).toBeNull();
  });

  it("gives no two seeds identical haemodynamics", () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 1000; s++) seen.add(haemoFingerprint(generatePatient(s)));
    expect(seen.size).toBe(1000);
  });

  it("is deterministic per seed", () => {
    expect(generatePatient("abc")).toEqual(generatePatient("abc"));
  });

  it("produces plausible adults", () => {
    for (let s = 1; s <= 300; s++) {
      const p = generatePatient(s);
      expect(p.ageY).toBeGreaterThanOrEqual(21);
      expect(p.weightKg).toBeGreaterThan(35);
      expect(p.baseline.sbp - p.baseline.dbp).toBeGreaterThanOrEqual(28);
      expect(p.lvef).toBeGreaterThanOrEqual(15);
      expect(p.renal.macdMl).toBeLessThanOrEqual(300);
      expect(p.habitus).toBeGreaterThanOrEqual(0.85);
      expect(p.habitus).toBeLessThanOrEqual(1.25);
    }
    expect(vignette(generatePatient(3))).toMatch(/year-old/);
  });

  it("turns graded segments into lesions within the published bands", () => {
    for (let s = 1; s <= 50; s++) {
      const p = generatePatient(s);
      const L = lesionsFromProfile(p);
      const abnormal = ANGIOCAD_SEGMENTS.filter((g) => p.angiocad.grades[g] > 0);
      expect(L.length).toBe(abnormal.length);
      abnormal.forEach((seg, i) => {
        const [lo, hi] = gradeBand(p.angiocad.grades[seg]);
        expect(L[i].severity).toBeGreaterThanOrEqual(lo);
        expect(L[i].severity).toBeLessThanOrEqual(hi);
        expect(L[i].position).toBeGreaterThan(0);
        expect(L[i].position).toBeLessThan(1);
      });
    }
  });
});

// ---------------------------------------------------------------------------
describe("renal function and contrast budget", () => {
  it("uses the sourced formulas", () => {
    // Cockcroft-Gault: (140 − 60) × 80 / (72 × 1.0) = 88.9; × 0.85 female
    expect(cockcroftGault(60, 80, 1.0, "M")).toBeCloseTo(88.89, 1);
    expect(cockcroftGault(60, 80, 1.0, "F")).toBeCloseTo(75.56, 1);
    // 2021 CKD-EPI, 60-year-old man, SCr 1.0 mg/dL ≈ 86
    expect(ckdEpi2021(60, 1.0, "M")).toBeCloseTo(86.2, 0);
    // Cigarroa: 5 × 70 / 1.4 = 250; capped at 300
    expect(cigarroaMacd(70, 1.4)).toBeCloseTo(250, 5);
    expect(cigarroaMacd(100, 0.8)).toBe(300);
  });

  it("tracks delivered contrast against MACD and contrast/CrCl with labelled denominators", () => {
    const e = engine(12);
    const p = e.profile;
    e.drainEvents();
    const ml = Math.ceil(p.renal.macdMl * 0.55);
    e.contrast(ml, "root");
    e.advance(0.1);
    const v = e.vitals();
    expect(v.contrast.totalMl).toBeCloseTo(ml, 6);
    expect(v.contrast.fractionOfMacd).toBeCloseTo(ml / p.renal.macdMl, 6);
    expect(v.contrast.perCrCl).toBeCloseTo(ml / p.renal.crclMlMin, 6);
    const ev = e.drainEvents().filter((x) => x.kind === "renal.threshold");
    const macd50 = ev.find((x) => x.data?.metric === "macd" && x.data?.fraction === 0.5);
    expect(macd50).toBeTruthy();
    expect(String(macd50!.data!.denominator)).toMatch(/Cigarroa/);
    const ratio = ev.find((x) => x.data?.metric === "contrast/CrCl");
    if (ml / p.renal.crclMlMin >= 2) expect(String(ratio!.data!.denominator)).toMatch(/Cockcroft-Gault/);
  });
});

// ---------------------------------------------------------------------------
describe("12-lead ECG", () => {
  const beat = { morph: "normal" as const, qt: 0.38, st: [0, 0, 0] as [number, number, number], tExtra: [0, 0, 0] as [number, number, number] };
  const net = (lead: Lead) => {
    let mx = 0,
      mn = 0;
    const li = LEADS.indexOf(lead);
    for (let t = -0.06; t < 0.06; t += 0.001) {
      const L = leadsFromVcg(ventricularVcg(t, beat));
      mx = Math.max(mx, L[li]);
      mn = Math.min(mn, L[li]);
    }
    return mx + mn;
  };
  it("has the normal pattern", () => {
    expect(net("V1")).toBeLessThan(0); // rS
    expect(net("V6")).toBeGreaterThan(0); // qR
    expect(net("II")).toBeGreaterThan(0);
    expect(net("aVR")).toBeLessThan(0);
  });

  it("applies the ST-elevation criteria with sex- and age-specific V2-V3 thresholds", () => {
    const st = Object.fromEntries(LEADS.map((l) => [l, 0])) as Record<Lead, number>;
    st.V2 = 1.8;
    st.V3 = 1.8;
    expect(stemiCriteria(st, "M", 55).met).toBe(false);
    expect(stemiCriteria(st, "F", 55).met).toBe(true);
    st.II = 1.2;
    st.III = 1.1;
    expect(stemiCriteria(st, "M", 55).groups).toContain("inferior");
  });

  it("LAD occlusion gives ST elevation in the anterior leads; RCA occlusion in the inferior leads", () => {
    const lad = engine(13);
    lad.setOcclusion("b", { vessel: "LAD", param: 0.1, fraction: 1 });
    lad.advance(60);
    const a = lad.vitals();
    for (const l of ["V2", "V3", "V4"] as Lead[]) expect(a.st[l]).toBeGreaterThan(2);
    expect(a.st.aVR).toBeLessThan(0);
    expect(a.stemi.groups).toContain("anterior");
    expect(a.symptoms.chestPain).toBeGreaterThan(5);

    const rca = engine(13);
    rca.setOcclusion("b", { vessel: "RCA", param: 0.35, fraction: 1 });
    rca.advance(60);
    const r = rca.vitals();
    expect(r.st.III).toBeGreaterThan(1.5);
    expect(r.st.aVF).toBeGreaterThan(1.5);
    expect(r.st.III).toBeGreaterThan(r.st.II);
    expect(r.st.aVL).toBeLessThan(-0.5); // reciprocal
    expect(r.stemi.groups).toContain("inferior");

    // reperfusion: ST resolves
    lad.clearOcclusion("b");
    lad.advance(180);
    expect(Math.abs(lad.vitals().st.V3)).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
describe("coronary flow from the rendered tree", () => {
  const c = CASE_LIBRARY[0];
  const model = buildAnatomy(c);
  const lesions = [{ vessel: "LAD" as const, position: 0.35, severity: 72, kind: "severe-stenosis" as const, lengthMm: 12 }];
  const tree = buildCoronaryTree(model, { ...c, lesions });
  const fm = coronaryFlowFor(tree, lesions);

  it("conserves flow and gives plausible territories", () => {
    const sumRegions = fm.regions.reduce((a, r) => a + r.demand, 0);
    expect(sumRegions).toBeCloseTo(fm.totalRest, 6);
    expect(fm.totalRest).toBeGreaterThan(1.5);
    expect(fm.totalRest).toBeLessThan(8);
    expect(fm.territoryMass.LAD).toBeGreaterThan(0.25);
    expect(fm.territoryMass.LAD + fm.territoryMass.LCx + fm.territoryMass.RCA).toBeCloseTo(1, 6);
    // flow decreases along the LAD
    const lad = fm.vessels["LAD"];
    expect(lad.restFlow[0]).toBeGreaterThan(lad.restFlow[lad.restFlow.length - 1]);
  });

  it("points LAD regions anteriorly and PDA regions inferiorly (Frank axes)", () => {
    const meanDir = (pred: (v: string) => boolean) => {
      const d = [0, 0, 0];
      for (const r of fm.regions) if (pred(r.vessel)) for (let k = 0; k < 3; k++) d[k] += r.demand * r.dir[k];
      return d;
    };
    expect(meanDir((v) => v === "LAD")[2]).toBeLessThan(0); // anterior = −z
    expect(meanDir((v) => v === "PDA")[1]).toBeGreaterThan(0); // inferior = +y
  });

  it("limits maximal flow only beyond a stenosis", () => {
    const beyond = fm.regions.filter((r) => r.vessel === "LAD" && r.p0 > 0.4);
    const before = fm.regions.filter((r) => r.vessel === "LAD" && r.p1 < 0.3);
    expect(beyond.length).toBeGreaterThan(0);
    for (const r of beyond) expect(r.hypFactor).toBeLessThan(0.8);
    for (const r of before) expect(r.hypFactor).toBe(1);
    const rca = fm.regions.filter((r) => r.territory === "RCA");
    for (const r of rca) expect(r.hypFactor).toBe(1);
  });

  it("balloon occlusion makes downstream regions ischaemic and leaves the others alone", () => {
    const occ = { occlusions: [{ vessel: "LAD", param: 0.5, fraction: 1 }] };
    for (const r of fm.regions) {
      const s = supplyFor(r, fm, occ);
      if (r.vessel === "LAD" && r.p0 > 0.55) expect(s.deficit).toBe(1);
      if (r.territory === "RCA") expect(s.deficit).toBe(0);
    }
  });

  it("builds a CoronaryCase for the pressure wire from the same anatomy", () => {
    const cc = coronaryCaseFor(tree, fm, "LAD", lesions)!;
    expect(cc.refDiamMm).toBeGreaterThan(2);
    expect(cc.restFlow).toBeGreaterThan(0.3);
    const f = ffr(cc);
    expect(f).toBeLessThan(0.85);
    expect(f).toBeGreaterThan(0.4);
  });

  it("drives anterior ST elevation in an engine on the tree", () => {
    const e = new PatientEngine({ profile: healthy(21), tree: buildCoronaryTree(model, { ...c, lesions: [] }), lesions: [] });
    e.setTip({ location: "aorta" });
    e.transducer.zero();
    e.advance(5);
    e.setOcclusion("b", { vessel: "LAD", param: 0.08, fraction: 1 });
    e.advance(60);
    const v = e.vitals();
    expect(v.st.V2 + v.st.V3 + v.st.V4).toBeGreaterThan(4);
    expect(v.ischaemia.LAD).toBeGreaterThan(0.6);
    expect(v.ischaemia.RCA).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
describe("engine on the shared clock", () => {
  it("keeps the ECG R wave on the clock's beats within 20 ms over 60 s (sinus and AF)", () => {
    for (const rhythm of ["sinus", "af"] as const) {
      const p = healthy(31);
      const e = new PatientEngine({ profile: { ...p, baseline: { ...p.baseline, rhythm } }, lesions: [], monitorSeconds: 70 });
      e.setTip({ location: "aorta" });
      e.drainBeats();
      e.advance(60);
      const beats = e.drainBeats().filter((b) => b.t > e.time - 58);
      const tr = e.trace;
      const li = LEADS.indexOf("II");
      let worst = 0;
      for (const b of beats) {
        // find the lead II peak within ±80 ms of the clock's R wave
        let best = -1e9,
          bt = 0;
        for (let k = 0; k < tr.count; k++) {
          const i = tr.idx(k);
          if (Math.abs(tr.t[i] - b.t) > 0.08) continue;
          if (tr.ecg[li][i] > best) {
            best = tr.ecg[li][i];
            bt = tr.t[i];
          }
        }
        worst = Math.max(worst, Math.abs(bt - b.t));
      }
      expect(beats.length).toBeGreaterThan(40);
      expect(worst).toBeLessThan(0.02);
    }
  });

  it("ejects in the clock's systole every beat", () => {
    // the aortic pressure upstroke (ejection) begins 30-120 ms after each clock R wave
    const e = engine(32);
    e.drainBeats();
    e.advance(30);
    const tr = e.trace;
    const beats = e.drainBeats().filter((b) => b.t > e.time - 11 && b.t < e.time - 1);
    expect(beats.length).toBeGreaterThan(8);
    for (const b of beats) {
      let tMin = 0,
        pMin = 1e9;
      for (let k = 0; k < tr.count; k++) {
        const i = tr.idx(k);
        const dt = tr.t[i] - b.t;
        if (dt < -0.05 || dt > 0.25) continue;
        if (tr.aoTrue[i] < pMin) {
          pMin = tr.aoTrue[i];
          tMin = dt;
        }
      }
      expect(tMin).toBeGreaterThan(0.0);
      expect(tMin).toBeLessThan(0.12);
    }
  });

  it("lowers blood pressure monotonically as the pericardium fills", () => {
    const e = engine(33);
    const maps: number[] = [];
    for (let k = 0; k < 8; k++) {
      e.setPericardialInflow(k === 0 ? 0 : 25 / 6);
      e.advance(6);
      e.setPericardialInflow(0);
      e.advance(6);
      maps.push(e.vitals().aortaTrue.mean);
    }
    for (let k = 1; k < maps.length; k++) expect(maps[k]).toBeLessThan(maps[k - 1]);
    expect(maps[maps.length - 1]).toBeLessThan(maps[0] - 15);
    expect(e.vitals().pericardialMl).toBeCloseTo(175, 0);
  });

  it("restores a snapshot exactly", () => {
    const a = engine(34);
    a.give({ drug: "heparin", dose: 7000, route: "iv" });
    a.setOcclusion("b", { vessel: "LAD", param: 0.2, fraction: 0.7 });
    a.advance(3.3);
    const snap = a.snapshot();
    a.advance(12.7);
    const va = a.vitals();
    const b = new PatientEngine({ profile: a.profile, lesions: [] });
    b.restore(snap);
    // a different split of the same time span gives the same state
    for (let i = 0; i < 127; i++) b.advance(0.1);
    const vb = b.vitals();
    expect(vb.t).toBeCloseTo(va.t, 9);
    expect(vb.aortaTrue.mean).toBeCloseTo(va.aortaTrue.mean, 6);
    expect(vb.st.V3).toBeCloseTo(va.st.V3, 6);
    expect(vb.actTrue).toBeCloseTo(va.actTrue, 6);
    expect(JSON.stringify(b.snapshot())).toBe(JSON.stringify(a.snapshot()));
  });

  it("costs well under a millisecond of CPU per 60 Hz frame", () => {
    const e = engine(35);
    const t0 = performance.now();
    for (let i = 0; i < 600; i++) e.advance(1 / 60);
    const ms = (performance.now() - t0) / 600;
    expect(ms).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
describe("tip pressure and transducer chain", () => {
  it("raising the transducer 10 cm lowers the reading by about 7.4 mmHg", () => {
    expect(MMHG_PER_CM * 10).toBeCloseTo(7.4, 1);
    const tr = new Transducer();
    tr.zero();
    for (let i = 0; i < 5000; i++) tr.step(0.0004, 100);
    const level = tr.step(0.0004, 100);
    tr.setHeight(10);
    for (let i = 0; i < 5000; i++) tr.step(0.0004, 100);
    const raised = tr.step(0.0004, 100);
    expect(level - raised).toBeCloseTo(7.4, 0);
  });

  it("an unzeroed transducer shows its offset; zeroing removes it", () => {
    const tr = new Transducer(undefined, 11);
    for (let i = 0; i < 5000; i++) tr.step(0.0004, 80);
    expect(tr.step(0.0004, 80)).toBeCloseTo(91, 0);
    tr.zero();
    expect(tr.step(0.0004, 80)).toBeCloseTo(80, 0);
  });

  it("an air bubble lowers the natural frequency and raises damping; the fast flush rings at fn", () => {
    const tr = new Transducer();
    const clean = tr.dynamic();
    expect(clean.fnHz).toBeGreaterThan(15);
    tr.setAir(0.02);
    const air = tr.dynamic();
    expect(air.fnHz).toBeLessThan(clean.fnHz * 0.6);
    expect(air.zeta).toBeGreaterThan(clean.zeta);
    // ringing after a fast flush: measure the oscillation period on the clean line
    const t2 = new Transducer();
    t2.zero();
    for (let i = 0; i < 2000; i++) t2.step(0.0002, 0);
    t2.setFlush(true);
    for (let i = 0; i < 2000; i++) t2.step(0.0002, 0);
    t2.setFlush(false);
    const ys: number[] = [];
    for (let i = 0; i < 1500; i++) ys.push(t2.step(0.0002, 0));
    const crossings: number[] = [];
    for (let i = 1; i < ys.length; i++) if (ys[i - 1] < 0 && ys[i] >= 0) crossings.push(i * 0.0002);
    expect(crossings.length).toBeGreaterThanOrEqual(2);
    const period = crossings[1] - crossings[0];
    const fd = clean.fnHz * Math.sqrt(1 - clean.zeta ** 2);
    expect(1 / period).toBeCloseTo(fd, -0.5);
  });

  it("a deep-seated tip loses the dicrotic notch and the diastolic pressure falls", () => {
    const notchCount = (e: PatientEngine, ch: "aoTrue" | "tipTrue") => {
      // a dicrotic notch is a rise of ≥ 0.8 mmHg on the falling limb within 0.3 s of a systolic peak
      const tr = e.trace;
      const n = Math.min(tr.count, 250 * 4);
      const y: number[] = [];
      for (let k = n - 1; k >= 0; k--) y.push(tr[ch][tr.idx(k)]);
      const hi = Math.max(...y);
      let notches = 0;
      for (let i = 2; i < y.length - 76; i++) {
        if (!(y[i] >= y[i - 1] && y[i] > y[i + 1] && y[i] > hi - 15)) continue; // systolic peak
        let runMin = y[i];
        for (let j = i + 1; j < i + 75; j++) {
          runMin = Math.min(runMin, y[j]);
          if (y[j] - runMin > 0.8 && y[j] < y[i] - 3) {
            notches++;
            break;
          }
        }
        i += 75;
      }
      return notches;
    };
    const e = engine(41);
    e.setTip({ location: "ostium", side: "left", gap: 0.8 });
    e.advance(4);
    const free = e.vitals();
    const freeNotches = notchCount(e, "tipTrue");
    e.setTip({ location: "ostium", side: "left", gap: 0.1 });
    e.advance(4);
    const deep = e.vitals();
    expect(freeNotches).toBeGreaterThan(0);
    expect(notchCount(e, "tipTrue")).toBe(0);
    expect(deep.art!.dia).toBeLessThan(free.art!.dia - 10);
    expect(deep.art!.sys).toBeGreaterThan(free.art!.sys * 0.75);
    expect(["ventricularised", "damped"]).toContain(deep.tipState);
    e.setTip({ location: "ostium", side: "left", gap: 0 });
    e.advance(4);
    expect(e.vitals().tipState).toBe("wedged");
    // the wedged tip starves the left coronary
    e.advance(40);
    expect(e.vitals().ischaemia.LAD).toBeGreaterThan(0.5);
  });

  it("maps the legacy engagement classes onto tip states", () => {
    const base: EngagementState = { kind: "selective-rca", target: "right", distanceToLm: 0, distanceToRca: 0, alignmentLm: 0, alignmentRca: 1, tipHeight: 0, depth: 6, isSelective: true, isDeep: true, isDangerous: true, conus: false, quality: 0.8, message: "" };
    expect(tipFromEngagement(base).runoff).toBeGreaterThan(0);
    expect(tipFromEngagement({ ...base, kind: "in-lv", isDeep: false }).location).toBe("lv");
    expect(tipFromEngagement({ ...base, target: "left", isDeep: true, depth: 7 }).gap).toBe(0);
    const ps = pressureFromEngine({ tipState: "ventricularised", art: { sys: 92.4, dia: 21.6 } });
    expect(ps.kind).toBe("ventricularised");
    expect(ps.systolic).toBe(92);
    expect(classifyTip({ location: "ostium" }, 30, 10, 120, 70)).toBe("wedged");
  });

  it("tip chamber reads aortic pressure when the ostium is open", () => {
    const tc = new TipChamber();
    let p = 0;
    for (let i = 0; i < 2000; i++) p = tc.step(0.0004, { location: "ostium", gap: 1 }, { pAo: 90, pLv: 5, pRv: 5, phase: 0.7, rBed: 40, spasm: 0 });
    expect(p).toBeGreaterThan(88);
  });
});

// ---------------------------------------------------------------------------
describe("pharmacology", () => {
  it("heparin 100 U/kg gives an ACT near 320 s at 10 minutes and protamine reverses it", () => {
    const ph = new Pharmacology(80);
    ph.give({ drug: "heparin", dose: 8000, route: "iv" });
    for (let i = 0; i < 600; i++) ph.step(1);
    const act = ph.act(120, 1);
    expect(act).toBeGreaterThan(290);
    expect(act).toBeLessThan(350);
    expect(act).toBeGreaterThan(ACT_TARGET.noGpi.hemotec[0]);
    ph.give({ drug: "protamine", dose: 70, route: "iv" });
    for (let i = 0; i < 300; i++) ph.step(1);
    expect(ph.act(120, 1)).toBeLessThan(160);
  });

  it("intracoronary adenosine gives transient hyperaemia and symptoms", () => {
    const ph = new Pharmacology(75);
    ph.give({ drug: "adenosine", dose: 200, route: "ic", side: "left" });
    let peak = 0,
      tPeak = 0;
    for (let i = 0; i < 600; i++) {
      ph.step(0.1);
      const h = ph.effects().hyperaemia.left;
      if (h > peak) {
        peak = h;
        tPeak = i * 0.1;
      }
    }
    expect(peak).toBeGreaterThan(0.8);
    expect(tPeak).toBeGreaterThan(3);
    expect(tPeak).toBeLessThan(25);
    expect(ph.effects().hyperaemia.left).toBeLessThan(0.05);
    expect(ph.effects().hyperaemia.right).toBe(0);
  });

  it("intracoronary adenosine produces transient AV block, at about the sourced complete-block rate", () => {
    let complete = 0,
      first = 0;
    const N = 160;
    for (let s = 1; s <= N; s++) {
      const e = new PatientEngine({ profile: healthy(1000 + s), lesions: [], calibrate: false });
      e.setTip({ location: "ostium", side: "left", gap: 0.8 });
      e.advance(2);
      e.give({ drug: "adenosine", dose: 200, route: "ic", side: "left" });
      let sawFirst = false,
        sawComplete = false;
      for (let k = 0; k < 40; k++) {
        e.advance(0.5);
        const v = e.vitals();
        if (v.av >= 1) sawFirst = true;
        if (v.av === 3) sawComplete = true;
      }
      e.advance(60);
      expect(e.vitals().av).toBe(0); // transient
      if (sawFirst) first++;
      if (sawComplete) complete++;
    }
    expect(first / N).toBeGreaterThan(0.9);
    expect(complete / N).toBeGreaterThan(0.04);
    expect(complete / N).toBeLessThan(0.22);
  });

  it("IC GTN reverses catheter-tip spasm", () => {
    const e = engine(51);
    e.setTip({ location: "ostium", side: "right", gap: 0.8, wallContact: 1.2 });
    e.advance(90);
    const spasm = e.snapshot().resp.spasm.right;
    expect(spasm).toBeGreaterThan(0.4);
    e.setTip({ location: "ostium", side: "right", gap: 0.8, wallContact: 0.1 });
    e.give({ drug: "gtn", dose: 200, route: "ic", side: "right" });
    e.advance(30);
    expect(e.snapshot().resp.spasm.right).toBeLessThan(spasm * 0.3);
  });

  it("a vasopressor raises and GTN lowers blood pressure; atropine reverses a vagal bradycardia", () => {
    const e = engine(52);
    const map0 = e.vitals().aortaTrue.mean;
    e.give({ drug: "metaraminol", dose: 1, route: "iv" });
    e.advance(120);
    expect(e.vitals().aortaTrue.mean).toBeGreaterThan(map0 + 8);

    const g = engine(53);
    const m0 = g.vitals().aortaTrue.mean;
    g.give({ drug: "gtn", dose: 400, route: "iv" });
    g.advance(90);
    expect(g.vitals().aortaTrue.mean).toBeLessThan(m0 - 3);

    // a very vagal patient and a painful stimulus
    const p = healthy(54);
    const v = new PatientEngine({ profile: { ...p, vagalTone: 1, painSensitivity: 1.5 }, lesions: [] });
    v.setTip({ location: "aorta" });
    v.transducer.zero();
    v.advance(10);
    const hr0 = v.vitals().hr!;
    const bp0 = v.vitals().aortaTrue.mean;
    let vagal = false;
    for (let k = 0; k < 20 && !vagal; k++) {
      v.stimulus("puncture", 1);
      vagal = v.drainEvents().some((x) => x.kind === "patient.vagal");
    }
    expect(vagal).toBe(true);
    v.advance(40);
    const vb = v.vitals();
    expect(vb.hr!).toBeLessThan(hr0 * 0.8);
    expect(vb.aortaTrue.mean).toBeLessThan(bp0 - 8);
    expect(vb.symptoms.nausea).toBeGreaterThan(0.4);
    v.give({ drug: "atropine", dose: 0.6, route: "iv" });
    v.advance(60);
    expect(v.vitals().hr!).toBeGreaterThan(vb.hr! + 10);
  });
});

// ---------------------------------------------------------------------------
describe("arrhythmias and arrest management", () => {
  it("VF does not resolve without a shock; a shock needs a charge", () => {
    const e = engine(61);
    e.forceRhythm("vf");
    e.advance(120);
    expect(e.vitals().rhythmKind).toBe("vf");
    expect(e.vitals().hr).toBeNull();
    expect(e.vitals().aortaTrue.mean).toBeLessThan(25);
    expect(e.vitals().alarms[0]?.id).toBe("vf");
    expect(e.shock()).toBe("not-charged");
  });

  it("charge, clear and shock restore circulation; the delay worsens the outcome", () => {
    const rhythmAfter = (delayS: number, seed: number) => {
      const e = engine(seed);
      e.forceRhythm("vf");
      e.advance(delayS);
      e.charge(200);
      e.advance(6);
      e.clearForShock();
      const out = e.shock();
      e.advance(30);
      return { out, e };
    };
    // probability: a shock after 30 s is likelier to succeed than after 5 minutes without CPR
    const r = new Rhythm("sinus");
    r.startVf(0);
    r.tick(30, 30);
    const pEarly = r.shockSuccessProbability(200);
    r.tick(330, 300);
    const pLate = r.shockSuccessProbability(200);
    expect(pEarly).toBeGreaterThan(0.85);
    expect(pLate).toBeLessThan(pEarly * 0.75);
    // CPR slows the decline
    const c = new Rhythm("sinus");
    c.startVf(0);
    c.setCpr(true);
    c.tick(330, 330);
    expect(c.shockSuccessProbability(200)).toBeGreaterThan(pLate);

    // engine: an early shock converts and the circulation recovers better than after a late one
    let early: ReturnType<typeof rhythmAfter> | null = null;
    for (let s = 70; s < 90 && !early; s++) {
      const x = rhythmAfter(20, s);
      if (x.out === "converted") early = x;
    }
    expect(early).not.toBeNull();
    expect(["sinus", "aivr"]).toContain(early!.e.vitals().rhythmKind); // reperfusion AIVR is allowed
    expect(early!.e.vitals().aortaTrue.mean).toBeGreaterThan(50);
    let late: ReturnType<typeof rhythmAfter> | null = null;
    for (let s = 90; s < 140 && !late; s++) {
      const x = rhythmAfter(240, s);
      if (x.out === "converted") late = x;
    }
    if (late) {
      expect(late.e.snapshot().rhythm.stunning).toBeGreaterThan(early!.e.snapshot().rhythm.stunning);
      expect(late.e.vitals().aortaTrue.mean).toBeLessThan(early!.e.vitals().aortaTrue.mean);
    }
  });

  it("flags a shock delivered without calling clear", () => {
    const e = engine(62);
    e.forceRhythm("vf");
    e.charge(200);
    e.advance(6);
    e.drainEvents();
    e.shock();
    expect(e.drainEvents().some((x) => x.kind === "safety.shock-without-clear")).toBe(true);
  });

  it("injection into the conus branch carries a far higher VF risk than a normal injection", () => {
    let conusVf = 0,
      normalVf = 0;
    for (let s = 1; s <= 120; s++) {
      const a = new PatientEngine({ profile: healthy(2000 + s), lesions: [], calibrate: false });
      a.setTip({ location: "coronary", side: "right", gap: 0.09, conus: true });
      a.advance(3);
      a.contrast(8, "right");
      if (a.vitals().rhythmKind === "vf" || a.drainEvents().some((x) => x.kind === "rhythm.vf")) conusVf++;
      const b = new PatientEngine({ profile: healthy(2000 + s), lesions: [], calibrate: false });
      b.setTip({ location: "ostium", side: "right", gap: 0.8 });
      b.advance(3);
      b.contrast(8, "right");
      if (b.drainEvents().some((x) => x.kind === "rhythm.vf")) normalVf++;
    }
    expect(conusVf).toBeGreaterThan(normalVf + 10);
  });

  it("contrast in the right coronary slows the heart transiently", () => {
    const e = engine(63);
    e.setTip({ location: "ostium", side: "right", gap: 0.8 });
    e.advance(5);
    const hr0 = e.vitals().hr!;
    e.contrast(8, "right");
    e.advance(4);
    const hrLow = e.vitals().hr!;
    e.advance(30);
    expect(hrLow).toBeLessThan(hr0 - 4);
    expect(e.vitals().hr!).toBeGreaterThan(hrLow);
  });

  it("STEMI patients arrive with ST elevation in the culprit territory", () => {
    let found = 0;
    for (let s = 1; s <= 30 && found < 3; s++) {
      const p = generatePatient(s, { indication: "STEMI" });
      if (!p.culprit || p.culprit.grade < 6) continue;
      const e = new PatientEngine({ profile: p, calibrate: false });
      e.setTip({ location: "aorta" });
      e.advance(5);
      const v = e.vitals();
      expect(Math.max(...LEADS.map((l) => v.st[l]))).toBeGreaterThan(1);
      found++;
    }
    expect(found).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
describe("contrast reactions and monitor", () => {
  it("draws reactions at the sourced incidence", () => {
    const rng = new SeededRng(7);
    let any = 0,
      prior = 0;
    const N = 40000;
    for (let i = 0; i < N; i++) {
      const r = new Responses(1);
      r.contrast("root", 10, "aortic", false, rng, 0, "none");
      if (r.st.reaction.kind !== "none") any++;
      const q = new Responses(1);
      q.contrast("root", 10, "aortic", false, rng, 0, "previous-mild");
      if (q.st.reaction.kind !== "none") prior++;
    }
    expect(any / N).toBeGreaterThan(CONTRAST_REACTION.anyAcute * 0.8);
    expect(any / N).toBeLessThan(CONTRAST_REACTION.anyAcute * 1.2);
    expect(prior / N).toBeGreaterThan(0.06);
    expect(prior / N).toBeLessThan(0.085);
  });

  it("raises alarms with sentence-case text and runs an NIBP cycle", () => {
    const e = engine(71);
    e.startNibp();
    e.advance(35);
    const v = e.vitals();
    expect(v.nibp).not.toBeNull();
    expect(Math.abs(v.nibp!.sys - v.aortaTrue.sys)).toBeLessThan(25);
    e.forceRhythm("asystole");
    e.advance(5);
    const a = e.vitals().alarms;
    expect(a.length).toBeGreaterThan(0);
    expect(a[0].level).toBe("high");
    expect(a[0].text[0]).toBe(a[0].text[0].toUpperCase());
  });

  it("an unzeroed transducer raises a technical alarm and shows wrong numbers", () => {
    const p = healthy(72);
    const e = new PatientEngine({ profile: p, lesions: [] });
    e.setTip({ location: "aorta" });
    e.advance(8);
    const v = e.vitals();
    expect(v.alarms.some((a) => a.id === "zero")).toBe(true);
    const offset = e.transducer.st.drift;
    expect(v.art!.mean - v.aortaTrue.mean).toBeCloseTo(offset, 0);
  });

  it("produces the 12-lead snapshot at 250 Hz", () => {
    const e = engine(73);
    const s = e.ecg12(10);
    expect(s.rate).toBe(250);
    expect(s.leads.V1.length).toBeGreaterThanOrEqual(2490);
  });

  it("keeps the default network consistent with the tree-built one", () => {
    const fm = defaultFlowMap([], "right");
    expect(fm.territoryMass.LAD).toBeGreaterThan(fm.territoryMass.RCA);
    const left = defaultFlowMap([], "left");
    expect(left.territoryMass.LCx).toBeGreaterThan(fm.territoryMass.LCx);
    const p = generatePatient(4);
    expect(caseWithPatient(CASE_LIBRARY[0], p).dominance).toBe(p.dominance);
  });

  it("renders the haemodynamic monitor (server markup)", () => {
    const e = engine(80);
    e.startNibp();
    e.advance(32);
    const html = renderToString(createElement(HaemoMonitor, { engine: e }));
    expect(html).toContain("Haemodynamic monitor");
    expect(html).toContain("ART");
    expect(html).toContain("NIBP");
    expect(html).toContain("12-lead");
    // no internal state on the screen: neither the rhythm diagnosis nor the tip class
    expect(html).not.toContain(e.vitals().rhythm);
    expect(html).not.toMatch(/ventricularised|wedged/i);
  });

  it("forced complete heart block persists and slows the ventricles", () => {
    const e = engine(81);
    const hr0 = e.vitals().hr!;
    e.forceRhythm("chb");
    e.advance(20);
    const v = e.vitals();
    expect(v.av).toBe(3);
    expect(v.hr!).toBeLessThan(Math.min(45, hr0));
    expect(v.rhythm).toBe("Complete heart block");
  });
});


// ---------------------------------------------------------------------------
describe("review corrections", () => {
  it("Dower lead vectors: the pseudo-inverse of the 8 independent leads reproduces the printed inverse Dower matrix (Table 4) to 3 decimals", () => {
    const A = INVERSE_DOWER_LEADS.map((l) => DOWER[l]);
    const AtA = [0, 1, 2].map((i) => [0, 1, 2].map((j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
    const [[a, b, c], [d, e, f], [g, h, k]] = AtA;
    const det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
    const inv = [
      [e * k - f * h, c * h - b * k, b * f - c * e],
      [f * g - d * k, a * k - c * g, c * d - a * f],
      [d * h - e * g, b * g - a * h, a * e - b * d],
    ].map((r) => r.map((x) => x / det));
    let worst = 0;
    for (let i = 0; i < 3; i++)
      for (let col = 0; col < 8; col++) {
        const pinv = inv[i][0] * A[col][0] + inv[i][1] * A[col][1] + inv[i][2] * A[col][2];
        worst = Math.max(worst, Math.abs(pinv - INVERSE_DOWER[i][col]));
      }
    // half a unit in the third decimal of the printed table, plus input rounding
    expect(worst).toBeLessThan(0.0006);
  });

  it("V5 is not inflated relative to V4 and V6 in a normal beat", () => {
    const beat = { morph: "normal" as const, qt: 0.38, st: [0, 0, 0] as [number, number, number], tExtra: [0, 0, 0] as [number, number, number] };
    const mx = new Array(12).fill(-9);
    for (let t = -0.06; t < 0.06; t += 0.001) {
      const L = leadsFromVcg(ventricularVcg(t, beat));
      for (let i = 0; i < 12; i++) mx[i] = Math.max(mx[i], L[i]);
    }
    const r = (l: Lead) => mx[LEADS.indexOf(l)];
    expect(r("V5") / r("V4")).toBeLessThan(1.3);
    expect(r("V5") / r("V6")).toBeLessThan(1.3);
    expect(r("V5")).toBeGreaterThan(0.5 * Math.max(r("V4"), r("V6")));
  });

  it("stable angina patients are quiet at rest: no ST shift, no STEMI criteria, no chest pain (24 seeds, 120 s)", () => {
    for (let s = 1; s <= 24; s++) {
      const p = generatePatient(s, { indication: "SA" });
      const e = new PatientEngine({ profile: p });
      e.setTip({ location: "aorta" });
      e.advance(120);
      const v = e.vitals();
      expect(Math.max(...LEADS.map((l) => Math.abs(v.st[l])))).toBeLessThan(1);
      expect(v.stemi.met).toBe(false);
      expect(v.symptoms.chestPain).toBeLessThan(0.5);
      expect(Math.max(v.ischaemia.LAD, v.ischaemia.LCx, v.ischaemia.RCA)).toBeLessThan(0.1);
    }
  });

  it("a chronic occlusion is collateral-supplied; an acute thrombotic one is not", () => {
    const cto = defaultFlowMap([{ vessel: "RCA", position: 0.4, severity: 100, kind: "cto", lengthMm: 18 }]);
    const acute = defaultFlowMap([{ vessel: "RCA", position: 0.4, severity: 100, kind: "thrombotic", lengthMm: 18 }]);
    const sub = defaultFlowMap([{ vessel: "LAD", position: 0.2, severity: 99, kind: "severe-stenosis", lengthMm: 12 }]);
    const beyond = (fm: ReturnType<typeof defaultFlowMap>, v: string, p: number) => fm.regions.filter((r) => r.vessel === v && r.p1 > p);
    for (const r of beyond(cto, "RCA", 0.4)) {
      expect(supplyFor(r, cto, {}).deficit).toBe(0);
      // demand ischaemia only when demand rises, and it is a supply-intact (subendocardial) deficit
      const hi = supplyFor(r, cto, { demand: 2 });
      expect(hi.deficit).toBeGreaterThan(0.2);
      expect(hi.restDeficit).toBe(0);
    }
    for (const r of beyond(acute, "RCA", 0.4)) {
      const s = supplyFor(r, acute, {});
      expect(s.deficit).toBe(1);
      expect(s.restDeficit).toBe(1);
    }
    for (const r of beyond(sub, "LAD", 0.2)) expect(supplyFor(r, sub, {}).deficit).toBe(0);
  });

  it("hyperaemia steals collateral flow: subendocardial ST depression, never elevation, in a CTO territory", () => {
    const p = healthy(91);
    const lesions = [{ vessel: "RCA" as const, position: 0.4, severity: 100, kind: "cto" as const, lengthMm: 18 }];
    const e = new PatientEngine({ profile: p, lesions });
    e.setTip({ location: "aorta" });
    e.advance(20);
    expect(Math.abs(e.vitals().st.III)).toBeLessThan(0.3);
    e.startInfusion({ drug: "adenosine", rate: 140, site: "central" });
    e.advance(90);
    const v = e.vitals();
    expect(v.ischaemia.RCA).toBeGreaterThan(0.05);
    expect(v.stemi.met).toBe(false);
    expect(Math.max(v.st.II, v.st.III, v.st.aVF)).toBeLessThan(0.2);
  });

  it("STEMI patients arrive with elevation in the culprit territory only, and no ischaemia elsewhere", () => {
    const territoryOfSeg = (seg: AngioCadSegment, dom: string): Territory[] => {
      if (seg === "LM") return ["LAD", "LCx"];
      if (/LAD|^D\d/.test(seg)) return ["LAD"];
      if (/LCx|^OM/.test(seg)) return ["LCx"];
      if (seg === "PDA" || seg === "PLB") return dom === "left" ? ["LCx"] : ["RCA"];
      return ["RCA"];
    };
    let checked = 0;
    for (let s = 1; s <= 40; s++) {
      const p = generatePatient(s, { indication: "STEMI" });
      if (!p.culprit) continue;
      const e = new PatientEngine({ profile: p });
      e.setTip({ location: "aorta" });
      e.advance(5);
      const v = e.vitals();
      const culpritT = territoryOfSeg(p.culprit.segment, p.dominance);
      for (const t of ["LAD", "LCx", "RCA"] as Territory[]) if (!culpritT.includes(t)) expect(v.ischaemia[t]).toBeLessThan(0.1);
      if (p.culprit.grade === 6 && /^(Prox|Mid) LAD$/.test(p.culprit.segment)) {
        expect(v.stemi.groups).toContain("anterior");
        expect(v.stemi.groups).not.toContain("inferior");
      }
      if (p.culprit.grade === 6 && /RCA$/.test(p.culprit.segment) && p.dominance !== "left") {
        expect(v.stemi.groups).toContain("inferior");
        expect(v.stemi.groups).not.toContain("anterior");
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("only the culprit total occlusion is thrombotic; other occlusions are chronic", () => {
    let multi = 0;
    for (let s = 1; s <= 400; s++) {
      const p = generatePatient(s);
      const ls = lesionsFromProfile(p);
      const thr = ls.filter((l) => l.kind === "thrombotic");
      expect(thr.length).toBeLessThanOrEqual(1);
      if (p.indication === "SA") expect(thr.length).toBe(0);
      if (ls.filter((l) => l.severity === 100).length > 1) {
        multi++;
        expect(ls.filter((l) => l.severity === 100 && l.kind !== "thrombotic").every((l) => l.kind === "cto")).toBe(true);
      }
    }
    expect(multi).toBeGreaterThan(0);
  });

  it("restores a snapshot across a change of coronary network (rewind after stenting)", () => {
    const c = CASE_LIBRARY[0];
    const model = buildAnatomy(c);
    const pre = [{ vessel: "LAD" as const, position: 0.35, severity: 90, kind: "severe-stenosis" as const, lengthMm: 12 }];
    const treePre = buildCoronaryTree(model, { ...c, lesions: pre });
    const make = () => {
      const e = new PatientEngine({ profile: healthy(92), tree: treePre, lesions: pre });
      e.setTip({ location: "aorta" });
      e.advance(4);
      e.setOcclusion("b", { vessel: "LAD", param: 0.36, fraction: 1 });
      e.advance(20);
      return e;
    };
    const ref = make();
    const a = make();
    const snap = a.snapshot();
    expect(snap.network?.lesions).toEqual(pre);
    // stent: new tree without the lesion
    const treePost = buildCoronaryTree(model, { ...c, lesions: [] });
    a.clearOcclusion("b");
    a.setCoronaryTree(treePost, []);
    a.advance(10);
    expect(a.lesions.length).toBe(0);
    a.restore(snap);
    expect(a.lesions).toEqual(pre);
    expect(a.flow.regions.length).toBe(ref.flow.regions.length);
    expect(a.resp.st.isch.length).toBe(a.flow.regions.length);
    ref.advance(15);
    a.advance(15);
    expect(JSON.stringify(a.snapshot())).toBe(JSON.stringify(ref.snapshot()));

    // a fresh engine without the tree cannot rebuild the network and says so; with it, it can
    const fresh = new PatientEngine({ profile: healthy(92), lesions: [] });
    expect(() => fresh.restore(snap)).toThrow(/coronary tree/);
    const fresh2 = new PatientEngine({ profile: healthy(92), lesions: [] });
    fresh2.restore(snap, { tree: treePre });
    fresh2.advance(15);
    expect(JSON.stringify(fresh2.snapshot())).toBe(JSON.stringify(ref.snapshot()));
  });
});

// ---------------------------------------------------------------------------
// found-patient-formulary acceptance tests
// ---------------------------------------------------------------------------

/** Advance an engine in steps of at most 60 s (advance() caps one call at 120 s). */
function run(e: PatientEngine, s: number) {
  for (let left = s; left > 0; left -= 60) e.advance(Math.min(60, left));
}

function ready(profile: PatientProfile, lesions: Lesion[] = []) {
  const e = new PatientEngine({ profile, lesions });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(10);
  return e;
}

/** Minutes for the plasma heparin to halve after a bolus of u U/kg. */
function heparinHalvingMin(uPerKg: number, kg = 70): number {
  const ph = new Pharmacology(kg);
  ph.give({ drug: "heparin", dose: uPerKg * kg, route: "iv" });
  const u0 = ph.st.heparinU;
  let t = 0;
  while (ph.st.heparinU > u0 / 2 && t < 6 * 3600) {
    ph.step(1);
    t++;
  }
  return t / 60;
}

describe("formulary: heparin kinetics", () => {
  it("heparin half-life is 30 ± 5 min after 25 U/kg and 60 ± 8 min after 100 U/kg (the lesson's figures)", () => {
    const h25 = heparinHalvingMin(25);
    const h100 = heparinHalvingMin(100);
    expect(Math.abs(h25 - 30)).toBeLessThanOrEqual(5);
    expect(Math.abs(h100 - 60)).toBeLessThanOrEqual(8);
    // the third point of the same sentence, and the same result at another weight
    expect(Math.abs(heparinHalvingMin(400) - 150)).toBeLessThanOrEqual(20);
    expect(Math.abs(heparinHalvingMin(100, 95) - 60)).toBeLessThanOrEqual(8);
    expect(HEPARIN_BOLUS_HALF_LIFE_MIN.map((x) => x.min)).toEqual([30, 60, 150]);
    // longer at a higher level
    expect(heparinHalfLifeS(2)).toBeGreaterThan(heparinHalfLifeS(0.5));
  });

  it("the ACT after 100 U/kg still sits near 320 s at 10 minutes and falls faster after a small dose", () => {
    const ph = new Pharmacology(80);
    ph.give({ drug: "heparin", dose: 8000, route: "iv" });
    for (let i = 0; i < 600; i++) ph.step(1);
    const act10 = ph.act(120, 1);
    expect(act10).toBeGreaterThan(290);
    expect(act10).toBeLessThan(350);
    // 60 minutes later the level has about halved again: ACT well below the Hemochron target
    for (let i = 0; i < 3600; i++) ph.step(1);
    expect(ph.act(120, 1)).toBeLessThan(ACT_TARGET.noGpi.hemochron[0]);
  });
});

describe("formulary: pressors and inotropes by mechanism", () => {
  it("noradrenaline raises MAP more in a vasodilated profile than during ongoing bleeding", () => {
    const vd = ready(presetPatient("vasodilated", 61).profile);
    run(vd, 60);
    const a0 = vd.vitals().aortaTrue.mean;
    vd.startInfusion({ drug: "noradrenaline", rate: 10 });
    run(vd, 120);
    const dVaso = vd.vitals().aortaTrue.mean - a0;

    const bl = ready(healthy(61));
    bl.setHaemorrhage(3);
    run(bl, 60);
    const b0 = bl.vitals().aortaTrue.mean;
    bl.startInfusion({ drug: "noradrenaline", rate: 10 });
    run(bl, 120);
    const dBleed = bl.vitals().aortaTrue.mean - b0;

    expect(a0).toBeLessThan(90); // the vasodilated patient is hypotensive at rest
    expect(dVaso).toBeGreaterThan(8);
    expect(dVaso).toBeGreaterThan(dBleed + 8);
    expect(bl.vitals().losses.bloodMl).toBeGreaterThan(400);
  });

  it("dobutamine lowers MAP in the obstructive HCM profile and phenylephrine raises it", () => {
    const hcm = presetPatient("hcm-obstructive", 62).profile;
    const a = ready(hcm);
    const a0 = a.vitals().aortaTrue.mean;
    a.startInfusion({ drug: "dobutamine", rate: 10 });
    run(a, 120);
    expect(a.vitals().aortaTrue.mean).toBeLessThan(a0 - 10);
    expect(a.drainEvents().some((x) => x.kind === "drug.interaction" && x.data?.id === "hocm-inotrope")).toBe(true);

    const b = ready(hcm);
    const b0 = b.vitals().aortaTrue.mean;
    b.give({ drug: "phenylephrine", dose: 100, route: "iv" });
    run(b, 60);
    expect(b.vitals().aortaTrue.mean).toBeGreaterThan(b0 + 4);

    // the same dobutamine in a heart without obstruction does not drop the pressure
    const n = ready(healthy(62));
    const n0 = n.vitals().aortaTrue.mean;
    n.startInfusion({ drug: "dobutamine", rate: 10 });
    run(n, 120);
    expect(n.vitals().aortaTrue.mean).toBeGreaterThan(n0 - 3);
  });

  it("dobutamine, dopamine and vasopressin are infusion-only; giveDrug refuses a bolus without throwing", () => {
    const e = ready(healthy(68));
    for (const d of ["dobutamine", "dopamine", "vasopressin"] as const) {
      const r = e.giveDrug(d, 100, "iv");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe("infusion-only");
    }
    const bad = e.giveDrug("lidocaine", 50, "ia");
    expect(bad.ok).toBe(false);
    expect(e.giveDrug("salbutamol", 5, "neb").ok).toBe(true);
  });

  it("IV adrenaline 1 mg with a pulse gives severe hypertension or VT", () => {
    let vt = 0;
    for (let k = 0; k < 6; k++) {
      const e = ready(healthy(70 + k));
      const sys0 = e.vitals().aortaTrue.sys;
      e.give({ drug: "adrenaline", dose: 1000, route: "iv" });
      run(e, 40);
      const v = e.vitals();
      if (v.rhythmKind === "vt") vt++;
      expect(v.rhythmKind === "vt" || v.aortaTrue.sys > Math.max(180, sys0 + 50)).toBe(true);
    }
    expect(vt).toBeGreaterThan(0);
    // the anaphylaxis dose IM does not do this
    const im = ready(healthy(70));
    im.give({ drug: "adrenaline", dose: 500, route: "im" });
    run(im, 60);
    expect(im.vitals().rhythmKind).not.toBe("vt");
    expect(im.vitals().aortaTrue.sys).toBeLessThan(180);
  });

  it("IV adrenaline 1 mg given during an arrest does not count as 'with a pulse' after return of circulation", () => {
    let converted = 0;
    for (let s = 70; s < 90 && converted < 3; s++) {
      const e = ready(healthy(s));
      e.forceRhythm("vf");
      e.setCpr(true);
      run(e, 5);
      e.give({ drug: "adrenaline", dose: 1000, route: "iv" });
      run(e, 25);
      e.setCpr(false);
      e.charge(200);
      run(e, 6);
      e.clearForShock();
      if (e.shock() !== "converted") continue;
      converted++;
      e.drainEvents();
      run(e, 60);
      expect(e.drainEvents().some((x) => x.kind === "rhythm.vt")).toBe(false);
      expect(e.snapshot().pharm.boluses.filter((b) => b.drug === "adrenaline").every((b) => b.arrest === true)).toBe(true);
      expect(e.vitals().aortaTrue.sys).toBeLessThan(320);
    }
    expect(converted).toBeGreaterThan(0);
  });

  it("furosemide venodilates within minutes and then diureses", () => {
    const p = new Pharmacology(80);
    p.give({ drug: "furosemide", dose: 80, route: "iv" });
    for (let i = 0; i < 60; i++) p.step(1);
    const early = p.effects();
    for (let i = 0; i < 1140; i++) p.step(1);
    const late = p.effects();
    expect(early.venodilationMl).toBeGreaterThan(40);
    expect(late.diuresisMlS).toBeGreaterThan(early.diuresisMlS * 3);
    const e = ready(healthy(67));
    e.give({ drug: "furosemide", dose: 80, route: "iv" });
    run(e, 180);
    expect(e.vitals().losses.urineMl).toBeGreaterThan(3);
  });

  it("rightHeart() gives low filling with low output in bleeding and low filling with high output in vasodilation", () => {
    const base = ready(healthy(66)).rightHeart();
    const bl = ready(healthy(66));
    bl.setHaemorrhage(4);
    run(bl, 120);
    const rb = bl.rightHeart();
    expect(rb.pcwpMmHg).toBeLessThan(base.pcwpMmHg);
    expect(rb.raMmHg).toBeLessThan(base.raMmHg);
    expect(rb.coLMin).toBeLessThan(base.coLMin);
    const vd = ready({ ...healthy(66), vasodilation: 0.4 });
    run(vd, 60);
    const rv = vd.rightHeart();
    expect(rv.svrDyn).toBeLessThan(base.svrDyn * 0.8);
    expect(rv.pcwpMmHg).toBeLessThan(base.pcwpMmHg + 2);
    expect(rv.coLMin).toBeGreaterThan(rb.coLMin);
    expect(base.svrDyn).toBeCloseTo((80 * (base.mapMmHg - base.raMmHg)) / base.coLMin, 6);
  });
});

describe("formulary: sedation, reversal and oxygen", () => {
  it("flumazenil steps reduce midazolam sedation and naloxone does not", () => {
    const p = new Pharmacology(75);
    p.give({ drug: "midazolam", dose: 5, route: "iv" });
    for (let i = 0; i < 600; i++) p.step(1);
    const s0 = p.effects().sedation;
    const q = new Pharmacology(75);
    q.restore(p.snapshot());
    const flu: number[] = [];
    const nal: number[] = [];
    for (let k = 0; k < 5; k++) {
      p.give({ drug: "flumazenil", dose: 0.2, route: "iv" }); // 0.2 mg steps to 1 mg (Brilakis 3.1)
      q.give({ drug: "naloxone", dose: 0.2, route: "iv" });
      for (let i = 0; i < 60; i++) {
        p.step(1);
        q.step(1);
      }
      flu.push(p.effects().sedation);
      nal.push(q.effects().sedation);
    }
    expect(flu[0]).toBeLessThan(s0 * 0.75);
    for (let k = 1; k < 5; k++) expect(flu[k]).toBeLessThan(flu[k - 1]);
    expect(flu[4]).toBeLessThan(s0 * 0.25);
    expect(nal[4]).toBeGreaterThan(s0 * 0.95);
    // naloxone does reverse the opioid's respiratory depression
    const o = new Pharmacology(75);
    o.give({ drug: "fentanyl", dose: 200, route: "iv" });
    for (let i = 0; i < 600; i++) o.step(1);
    const r0 = o.effects().respDepression;
    o.give({ drug: "naloxone", dose: 0.2, route: "iv" });
    for (let i = 0; i < 180; i++) o.step(1);
    expect(o.effects().respDepression).toBeLessThan(r0 * 0.5);
  });

  it("oxygen raises SpO2 under the same respiratory depression", () => {
    const mk = () => {
      const e = ready(healthy(63));
      e.give({ drug: "midazolam", dose: 8, route: "iv" });
      e.give({ drug: "fentanyl", dose: 200, route: "iv" });
      return e;
    };
    const air = mk();
    const o2 = mk();
    o2.setOxygen(4);
    run(air, 300);
    run(o2, 300);
    const va = air.vitals();
    const vo = o2.vitals();
    expect(vo.respiratory.depression).toBeCloseTo(va.respiratory.depression, 6);
    expect(va.respiratory.depression).toBeGreaterThan(0.45);
    expect(va.respiratory.overSedated).toBe(true);
    expect(air.drainEvents().some((x) => x.kind === "patient.over-sedation")).toBe(true);
    expect(vo.respiratory.fio2).toBeGreaterThan(va.respiratory.fio2);
    expect(vo.spo2!).toBeGreaterThan(va.spo2! + 1);
  });

  it("salbutamol relieves the airway component of a reaction, not the skin or the circulation", () => {
    const r = new Responses(4);
    r.st.reaction = { kind: "moderate", drawn: true, onsetAt: 0, level: 0.6 };
    const fx0 = new Pharmacology(70).effects();
    const pS = new Pharmacology(70);
    pS.give({ drug: "salbutamol", dose: 5, route: "neb" });
    for (let i = 0; i < 600; i++) pS.step(1);
    const fxS = pS.effects();
    const c0 = r.reactionComponents(fx0);
    const cS = r.reactionComponents(fxS);
    expect(c0).toEqual({ skin: 0.6, airway: 0.6, circulation: 0.6 });
    expect(cS.airway).toBeLessThan(c0.airway * 0.7);
    expect(cS.skin).toBe(c0.skin);
    expect(cS.circulation).toBe(c0.circulation);
    expect(r.autonomic(fxS).spo2Drop).toBeLessThan(r.autonomic(fx0).spo2Drop);
  });
});

describe("formulary: interactions", () => {
  it("GTN after a PDE-5 inhibitor drops MAP more than without, and the interaction is flagged", () => {
    const plain = ready(healthy(64));
    const pde5 = ready({ ...healthy(64), pde5: { agent: "sildenafil", hoursAgo: 6 } });
    const m1 = plain.vitals().aortaTrue.mean;
    const m2 = pde5.vitals().aortaTrue.mean;
    plain.drainEvents();
    pde5.drainEvents();
    plain.give({ drug: "gtn", dose: 200, route: "ic", side: "left" });
    pde5.give({ drug: "gtn", dose: 200, route: "ic", side: "left" });
    run(plain, 90);
    run(pde5, 90);
    const drop1 = m1 - plain.vitals().aortaTrue.mean;
    const drop2 = m2 - pde5.vitals().aortaTrue.mean;
    expect(drop2).toBeGreaterThan(drop1 + 2);
    expect(pde5.drainEvents().some((x) => x.kind === "drug.interaction" && x.data?.id === "pde5-nitrate")).toBe(true);
    expect(plain.drainEvents().some((x) => x.kind === "drug.interaction")).toBe(false);
    // outside the window (tadalafil 48 h, the others 24 h) there is no interaction
    expect(PDE5_WINDOW_H.tadalafil).toBe(48);
    const late = ready({ ...healthy(64), pde5: { agent: "sildenafil", hoursAgo: 30 } });
    expect(late.interactionFlags("gtn")).toEqual([]);
    expect(ready({ ...healthy(64), pde5: { agent: "tadalafil", hoursAgo: 30 } }).interactionFlags("gtn").map((f) => f.id)).toEqual(["pde5-nitrate"]);
  });

  it("a nitrate infusion blunts a nitrate bolus", () => {
    const a = new Pharmacology(75);
    a.give({ drug: "gtn", dose: 200, route: "ic" });
    for (let i = 0; i < 60; i++) a.step(1);
    const b = new Pharmacology(75);
    b.startInfusion({ drug: "gtn", rate: 50 });
    for (let i = 0; i < 1200; i++) b.step(1);
    const before = b.effects().venodilationMl;
    b.give({ drug: "gtn", dose: 200, route: "ic" });
    for (let i = 0; i < 60; i++) b.step(1);
    expect(b.effects().venodilationMl - before).toBeLessThan(a.effects().venodilationMl);
  });

  it("antiarrhythmics are flagged for long QT, pre-excited AF, high-grade block and poor LV", () => {
    const e = ready({ ...healthy(69), baseline: { ...healthy(69).baseline, qtc: 0.47 }, lvef: 30 });
    expect(e.interactionFlags("amiodarone").map((f) => f.id)).toContain("long-qt-antiarrhythmic");
    expect(e.interactionFlags("verapamil").map((f) => f.id)).toContain("poor-lv-negative-inotrope");
    expect(e.interactionFlags("flecainide").map((f) => f.id)).toContain("poor-lv-negative-inotrope");
    e.forceRhythm("chb");
    expect(e.interactionFlags("amiodarone").map((f) => f.id)).toContain("high-grade-block-av-nodal");
    expect(ready(healthy(69)).interactionFlags("amiodarone")).toEqual([]);
    // pre-excited AF
    const wpw = ready({ ...healthy(69), preExcitation: true, baseline: { ...healthy(69).baseline, rhythm: "af" } });
    expect(wpw.interactionFlags("amiodarone").map((f) => f.id)).toContain("pre-excitation-antiarrhythmic");
    // obstructive HCM: a nitrate is flagged
    expect(ready(presetPatient("hcm-obstructive", 62).profile).interactionFlags("gtn").map((f) => f.id)).toContain("hocm-nitrate");
  });

  it("amiodarone with a long QT leads to VF in some seeds and not all, by bolus or infusion", () => {
    const longQt = (seed: number) => ready({ ...healthy(seed), baseline: { ...healthy(seed).baseline, qtc: 0.47 } });
    const bolus = Array.from({ length: 20 }, (_, k) => {
      const e = longQt(200 + k);
      e.give({ drug: "amiodarone", dose: 300, route: "iv" });
      e.drainEvents();
      run(e, 100); // the effect site passes the 0.3 antiarrhythmic level that releases the armed VF
      return e.drainEvents().some((x) => x.kind === "rhythm.vf" && x.data?.cause === "torsades or VF after amiodarone");
    });
    expect(bolus.some(Boolean)).toBe(true);
    expect(bolus.every(Boolean)).toBe(false);
    // an infusion arms the same chance (150 mg over 10 minutes as a rate)
    const inf = Array.from({ length: 20 }, (_, k) => {
      const e = longQt(200 + k);
      e.startInfusion({ drug: "amiodarone", rate: 15 });
      return e.snapshot().form?.proVfArmed === true;
    });
    expect(inf.some(Boolean)).toBe(true);
    expect(inf.every(Boolean)).toBe(false);
  });

  it("a GTN bolus during a running GTN infusion raises the nitrate-infusion-blunts-bolus event", () => {
    const e = ready(healthy(71));
    e.startInfusion({ drug: "gtn", rate: 20 });
    run(e, 30);
    e.drainEvents();
    e.give({ drug: "gtn", dose: 200, route: "ic", side: "left" });
    const ev = e.drainEvents().filter((x) => x.kind === "drug.interaction");
    expect(ev.map((x) => x.data?.id)).toContain("nitrate-infusion-blunts-bolus");
  });
});

describe("formulary: antithrombotics", () => {
  it("eptifibatide raises the antithrombotic effect and lowers the thrombus hazard", () => {
    const { profile, lesions } = presetPatient("lcx-stemi");
    const none = new Pharmacology(profile.weightKg);
    const ep = new Pharmacology(profile.weightKg);
    ep.give({ drug: "eptifibatide", dose: 180 * profile.weightKg, route: "iv" });
    ep.startInfusion({ drug: "eptifibatide", rate: 2 });
    for (let i = 0; i < 600; i++) {
      ep.step(1);
      none.step(1);
    }
    const f0 = none.effects();
    const f1 = ep.effects();
    expect(f1.gpi).toBeGreaterThan(0.5);
    expect(f1.antithrombotic).toBeGreaterThan(f0.antithrombotic + 0.3);
    const h0 = thrombusHazardFor(profile, lesions, f0);
    const h1 = thrombusHazardFor(profile, lesions, f1);
    expect(h1.ratePerS).toBeLessThan(h0.ratePerS * 0.75);
    // the GP IIb/IIIa effect follows its 2-hour half-life after the infusion stops
    ep.stopInfusion("eptifibatide");
    for (let i = 0; i < 4 * 3600; i++) ep.step(1);
    expect(ep.effects().gpi).toBeLessThan(f1.gpi * 0.6);
  });

  it("ticagrelor 180 mg 30 min before wiring lowers the seeded thrombus-hazard rate of the lcx-stemi profile against no load", () => {
    const { profile, lesions } = presetPatient("lcx-stemi");
    expect(lesions.some((l) => l.kind === "thrombotic" && l.vessel === "LCx")).toBe(true);
    const load = new Pharmacology(profile.weightKg);
    const none = new Pharmacology(profile.weightKg);
    load.give({ drug: "ticagrelor", dose: 180, route: "oral" });
    for (let i = 0; i < 30 * 60; i++) {
      load.step(1);
      none.step(1);
    }
    const h0 = thrombusHazardFor(profile, lesions, none.effects());
    const h1 = thrombusHazardFor(profile, lesions, load.effects());
    expect(h0.baseRatePerS).toBeGreaterThan(0);
    expect(h1.baseRatePerS).toBe(h0.baseRatePerS); // seeded per patient, not per run
    expect(h1.ratePerS).toBeLessThan(h0.ratePerS * 0.9);
    expect(h1.stentThrombosisMult).toBeLessThan(1);
    // seeded: another seed has its own base rate; no thrombotic lesion, no hazard
    const other = presetPatient("lcx-stemi", "other-seed");
    expect(thrombusHazardFor(other.profile, other.lesions, none.effects()).baseRatePerS).not.toBe(h0.baseRatePerS);
    // the anatomy agrees with the culprit and the lesion for every seed, and the STEMI rhythm is kept
    for (const pr of [profile, other.profile, presetPatient("lcx-stemi", 2).profile, presetPatient("lcx-stemi", 3).profile]) {
      expect(culpritOf(pr.angiocad.grades)).toEqual(pr.culprit);
      expect(pr.culprit).toEqual({ segment: "Prox LCx", grade: 5 });
      expect(lesionsFromProfile(pr).every((l) => l.vessel === "LCx")).toBe(true);
    }
    expect(thrombusHazardFor(profile, [], none.effects()).ratePerS).toBe(0);
    expect(MP_THROMBUS.basePerS).toBeGreaterThan(0);
    // the engine reports the same rate for the same drug state
    const e = new PatientEngine({ profile, lesions });
    expect(e.thrombusHazard().baseRatePerS).toBeCloseTo(h0.baseRatePerS, 12);
  });

  it("crushed and whole routes use separate onset parameters; an opioid delays the oral load", () => {
    for (const d of ["aspirin", "clopidogrel", "prasugrel", "ticagrelor"] as const) {
      expect(ORAL_ONSET_S[d].crushed).not.toBe(ORAL_ONSET_S[d].oral);
      expect(ORAL_ONSET_S[d].crushed).toBeLessThan(ORAL_ONSET_S[d].oral);
      expect(DRUGS[d].routes).toEqual(["oral", "crushed"]);
    }
    const at30 = (route: "oral" | "crushed", opioid = false) => {
      const p = new Pharmacology(80);
      if (opioid) {
        p.give({ drug: "fentanyl", dose: 100, route: "iv" });
        for (let i = 0; i < 300; i++) p.step(1);
      }
      p.give({ drug: "ticagrelor", dose: 180, route });
      for (let i = 0; i < 30 * 60; i++) p.step(1);
      return p.effects().p2y12;
    };
    expect(at30("crushed")).toBeGreaterThan(at30("oral") + 0.03);
    expect(at30("oral", true)).toBeLessThan(at30("oral") - 0.1);
  });

  it("nitroprusside given IC lowers MAP less than the same dose IV, and dilates the microcirculation", () => {
    const ic = ready(healthy(65));
    const iv = ready(healthy(65));
    const m0 = ic.vitals().aortaTrue.mean;
    ic.give({ drug: "nitroprusside", dose: 200, route: "ic", side: "left" });
    iv.give({ drug: "nitroprusside", dose: 200, route: "iv" });
    run(ic, 60);
    run(iv, 60);
    const dIc = m0 - ic.vitals().aortaTrue.mean;
    const dIv = m0 - iv.vitals().aortaTrue.mean;
    expect(dIc).toBeGreaterThan(0);
    expect(dIc).toBeLessThan(dIv - 1);
    const p = new Pharmacology(75);
    p.give({ drug: "nitroprusside", dose: 200, route: "ic" });
    for (let i = 0; i < 30; i++) p.step(1);
    expect(p.effects().microvascularDilation).toBeGreaterThan(0.4);
  });

  it("bivalirudin's regimen reaches the ACT goal it shares with heparin; idarucizumab reverses dabigatran", () => {
    const b = new Pharmacology(80);
    b.give({ drug: "bivalirudin", dose: 0.75 * 80, route: "iv" });
    b.startInfusion({ drug: "bivalirudin", rate: 1.75 });
    for (let i = 0; i < 3600; i++) b.step(1);
    expect(b.act(120, 1)).toBeGreaterThan(280);
    expect(b.act(120, 1)).toBeLessThan(360);
    const d = new Pharmacology(80);
    d.setDoac("dabigatran", 1);
    expect(d.effects().doacEffect).toBe(1);
    d.give({ drug: "idarucizumab", dose: 2500, route: "iv" });
    d.give({ drug: "idarucizumab", dose: 2500, route: "iv" });
    for (let i = 0; i < 120; i++) d.step(1);
    expect(d.effects().doacEffect).toBeLessThan(0.1);
    const x = new Pharmacology(80);
    x.setDoac("apixaban", 1);
    x.give({ drug: "idarucizumab", dose: 5000, route: "iv" });
    for (let i = 0; i < 120; i++) x.step(1);
    expect(x.effects().doacEffect).toBeGreaterThan(0.9); // the wrong antidote
  });
});

describe("formulary: data and replay", () => {
  it("every reference dose points at a line of the module text that still says it", () => {
    const root = join(__dirname, "..", "..", "content", "manual");
    let n = 0;
    for (const [drug, refs] of Object.entries(FORMULARY_REFERENCE)) {
      expect(DRUGS[drug as DrugId], drug).toBeDefined();
      for (const r of refs ?? []) {
        const lines = readFileSync(join(root, r.file), "utf8").split("\n");
        expect(lines[r.line - 1] ?? "", `${drug} ${r.file}:${r.line}`).toContain(r.quote);
        n++;
      }
    }
    expect(n).toBeGreaterThan(35);
  });

  it("restores a snapshot exactly with the formulary state (oxygen, bleeding, infusions, oral loads)", () => {
    const a = ready(healthy(71));
    a.setOxygen(2);
    a.setHaemorrhage(1);
    a.give({ drug: "ticagrelor", dose: 180, route: "crushed" });
    a.startInfusion({ drug: "dobutamine", rate: 5 });
    a.advance(5.3);
    const snap = a.snapshot();
    a.advance(9.7);
    const b = new PatientEngine({ profile: a.profile, lesions: [] });
    b.restore(snap);
    for (let i = 0; i < 97; i++) b.advance(0.1);
    expect(JSON.stringify(b.snapshot())).toBe(JSON.stringify(a.snapshot()));
    expect(b.vitals().losses.bloodMl).toBeCloseTo(a.vitals().losses.bloodMl, 9);
  });
});

// --- physiology-hyperaemia-and-adenosine ---------------------------------------------------------

describe("adenosine: dose by vessel, line site, caffeine, hazards and bedside orders (physiology-hyperaemia-and-adenosine)", () => {
  type Inner = { rng: SeededRng; adenosineBlockArmed: boolean };

  /** How many of `runs` seeded IC doses into the RCA arm the engine's transient complete AV block. */
  function armedCount(e: PatientEngine, doseUg: number, runs: number): number {
    const inner = e as unknown as Inner;
    let n = 0;
    for (let i = 0; i < runs; i++) {
      inner.rng = new SeededRng(`avb-run:${i}`);
      inner.adenosineBlockArmed = false;
      const r = e.giveDrug("adenosine", doseUg, "ic", { side: "right" });
      expect(r.ok).toBe(true);
      if (inner.adenosineBlockArmed) n++;
    }
    return n;
  }

  it("an IC RCA dose of 200 µg arms AV block more often than 60 µg over 500 seeded runs (acceptance)", () => {
    const e = ready(healthy(301));
    const hi = armedCount(e, 200, 500);
    const lo = armedCount(e, 60, 500);
    // the engine scales the sourced 11.6% by dose (ADENOSINE.completeAvBlock.ic x min(1.5, dose / 100 µg)): about 17% against 7%
    expect(hi).toBeGreaterThan(lo);
    expect(hi / 500).toBeGreaterThan(0.12);
    expect(lo / 500).toBeLessThan(0.11);
    expect(hi).toBeGreaterThan(1.5 * lo);
  });

  it("a peripheral IV infusion reaches 90% of its effect later than a central one (acceptance), and the closed form agrees with the stepped model", () => {
    const t90 = (site: "central" | "peripheral") => {
      const ph = new Pharmacology(80);
      ph.startInfusion({ drug: "adenosine", rate: ADENOSINE.ivStandardUgKgMin, site });
      const target = ivAdenosineSteadyLevel(ADENOSINE.ivStandardUgKgMin);
      for (let t = 0.05; t < 400; t += 0.05) {
        ph.step(0.05);
        const h = ph.effects().hyperaemia.left;
        expect(h).toBeCloseTo(ivAdenosineLevelAt(ADENOSINE.ivStandardUgKgMin, site, t), 3);
        if (h >= 0.9 * target) return t;
      }
      return Infinity;
    };
    const central = t90("central");
    const peripheral = t90("peripheral");
    expect(peripheral).toBeGreaterThan(central);
    // three time constants is the sourced time to maximal hyperaemia (80 s central, 112 s peripheral); 90% comes at ln 10 of them
    expect(central).toBeCloseTo((ADENOSINE.timeToMaxIvS.central / 3) * Math.LN10, 0);
    expect(peripheral).toBeCloseTo((ADENOSINE.timeToMaxIvS.peripheral / 3) * Math.LN10, 0);
  });

  it("an IC bolus: the closed-form effect site follows the stepped local compartment", () => {
    for (const side of ["left", "right"] as const) {
      const ph = new Pharmacology(80);
      ph.give({ drug: "adenosine", dose: 100, route: "ic", side });
      for (let t = 0.02; t <= 30; t += 0.02) {
        ph.step(0.02);
        if (Math.abs(t - Math.round(t)) < 0.011) expect(ph.effects().hyperaemia[side]).toBeCloseTo(icAdenosineHyperaemiaOf(icAdenosineEffectSiteUg(100, side, t), side), 1);
      }
    }
  });

  it("a tissued line delivers little of the infusion, and recent caffeine lowers every adenosine effect; without either the effect is unchanged", () => {
    const run = (o: { delivered?: number; caffeine?: boolean }) => {
      const ph = new Pharmacology(80);
      if (o.caffeine) ph.setContext({ caffeine: true });
      ph.startInfusion({ drug: "adenosine", rate: 140, site: "central", ...(o.delivered !== undefined ? { delivered: o.delivered } : {}) });
      for (let i = 0; i < 6000; i++) ph.step(0.05);
      return ph.effects();
    };
    const base = run({});
    expect(base.hyperaemia.left).toBeCloseTo(ivAdenosineSteadyLevel(140), 3);
    expect(run({ delivered: 1 }).hyperaemia.left).toBe(base.hyperaemia.left);
    expect(run({ delivered: 0.1 }).hyperaemia.left).toBeLessThan(0.2 * base.hyperaemia.left);
    const caf = run({ caffeine: true });
    expect(caf.hyperaemia.left).toBeCloseTo(base.hyperaemia.left * MP_CAFFEINE_ADENOSINE, 6);
    expect(caf.avBlockDrive).toBeCloseTo(base.avBlockDrive * MP_CAFFEINE_ADENOSINE, 6);
    // a restarted infusion without a delivered fraction delivers all of it again
    const ph = new Pharmacology(80);
    ph.startInfusion({ drug: "adenosine", rate: 140, site: "central", delivered: 0.1 });
    ph.startInfusion({ drug: "adenosine", rate: 140, site: "central" });
    for (let i = 0; i < 6000; i++) ph.step(0.05);
    expect(ph.effects().hyperaemia.left).toBeCloseTo(base.hyperaemia.left, 6);
  });

  it("the hazard model is off by default, and on with no chance it changes nothing: the engine replays exactly", () => {
    const give = (e: PatientEngine) => {
      e.giveDrug("adenosine", 200, "ic", { side: "right", vessel: "RCA", fast: true });
      e.advance(20);
    };
    const off = ready(healthy(302));
    const on = ready(healthy(302));
    on.setAdenosineHazards({ afP: 0, vfP: 0, noEscapeP: 0 });
    give(off);
    give(on);
    const strip = (e: PatientEngine) => JSON.stringify({ ...e.snapshot(), adn: undefined });
    expect(strip(on)).toBe(strip(off));
    expect(off.adenosineHazards()).toBeNull();
    expect(["af", "vf"]).not.toContain(off.vitals().rhythmKind);
  });

  it("'adenosine-vf': the colleague's fast 150 µg into the RCA brings R-on-T VF after the pause, and engine.shock() restores an organised rhythm by the engine's model (acceptance)", () => {
    const e = ready(healthy(303));
    const s = initialPwSession("adenosine-vf");
    setUpPwEngine(e, s);
    expect(e.adenosineHazards()).toMatchObject({ force: null });
    let vfAt = -1;
    for (let i = 0; i < 300 && vfAt < 0; i++) {
      e.advance(0.1);
      if (e.vitals().rhythmKind === "vf") vfAt = i / 10;
    }
    expect(vfAt, "VF never came").toBeGreaterThan(0);
    expect(e.drainEvents().some((x) => x.kind === "rhythm.vf" && String(x.data?.cause).includes("adenosine"))).toBe(true);
    // defibrillate: charge, stand clear, shock; within the first minute a shock succeeds with MP_DEFIB's chance
    expect(e.rhythm.shockSuccessProbability(200)).toBeGreaterThan(0.8);
    let outcome = "";
    for (let k = 0; k < 3 && outcome !== "converted"; k++) {
      e.charge();
      e.advance(5.5);
      e.clearForShock();
      outcome = e.shock();
    }
    expect(outcome).toBe("converted");
    e.advance(5);
    const v = e.vitals();
    expect(["vf", "asystole"]).not.toContain(v.rhythmKind);
    expect(v.hr).not.toBeNull();
  });

  it("forced AF after a high RCA dose: an unsynchronised shock is not the treatment, synchronised cardioversion restores sinus rhythm", () => {
    const e = ready(healthy(304));
    e.setAdenosineHazards({ force: "af" });
    e.giveDrug("adenosine", 150, "ic", { side: "right", vessel: "RCA" });
    let seen = false;
    for (let i = 0; i < 200 && !seen; i++) {
      e.advance(0.1);
      seen = e.vitals().rhythmKind === "af";
    }
    expect(seen).toBe(true);
    // without charge nothing happens
    expect(e.cardiovert()).toBe("not-charged");
    let outcome = "";
    for (let k = 0; k < 3 && outcome !== "converted"; k++) {
      e.charge();
      e.advance(5.5);
      e.clearForShock();
      outcome = e.cardiovert();
    }
    expect(outcome).toBe("converted");
    expect(e.vitals().rhythmKind).toBe("sinus");
    expect(e.drainEvents().some((x) => x.kind === "defib.cardiovert" && x.data?.outcome === "converted")).toBe(true);
  });

  it("a slow dose within the limit is not high risk: the forced arrhythmia waits for a dose that is", () => {
    const e = ready(healthy(305));
    e.setAdenosineHazards({ force: "af" });
    e.giveDrug("adenosine", 80, "ic", { side: "right", vessel: "RCA" });
    for (let i = 0; i < 30; i++) e.advance(1);
    expect(e.vitals().rhythmKind).not.toBe("af");
    expect(e.adenosineHazards()?.force).toBe("af");
    // into a non-dominant circumflex 150 µg is not into the AV nodal artery
    const p = { ...healthy(305), dominance: "right" as const };
    const l = ready(p);
    l.setAdenosineHazards({ force: "af" });
    l.giveDrug("adenosine", 150, "ic", { side: "left", vessel: "LCx" });
    expect(l.adenosineHazards()?.force).toBe("af");
    const d = ready({ ...healthy(305), dominance: "left" as const });
    d.setAdenosineHazards({ force: "af" });
    d.giveDrug("adenosine", 150, "ic", { side: "left", vessel: "LCx" });
    expect(d.adenosineHazards()?.force).toBeNull();
  });

  it("forced block without an escape rhythm: standstill (the rate falls, the pressure with it), pacing captures, coughing is a pressure pulse, and it ends after the drug", () => {
    const e = ready(healthy(306));
    const map0 = e.vitals().aortaTrue.mean;
    e.setAdenosineHazards({ force: "no-escape" });
    e.giveDrug("adenosine", 150, "ic", { side: "right", vessel: "RCA" });
    let minHr = Infinity;
    let minMap = Infinity;
    for (let i = 0; i < 120; i++) {
      e.advance(0.1);
      const v = e.vitals();
      minHr = Math.min(minHr, v.hr ?? Infinity);
      minMap = Math.min(minMap, v.aortaTrue.mean);
    }
    expect(e.vitals().av).toBe(3);
    expect(minHr).toBeLessThan(30);
    expect(minMap).toBeLessThan(map0 - 20);
    e.cough();
    expect(e.drainEvents().some((x) => x.kind === "patient.cough")).toBe(true);
    e.setPacing(70);
    e.advance(8);
    const paced = e.vitals();
    expect(paced.hr).toBeGreaterThan(60);
    expect(paced.aortaTrue.mean).toBeGreaterThan(minMap + 15);
    // the snapshot keeps the pacing and the hazard state
    const snap = e.snapshot();
    expect(snap.adn?.pacingRate).toBe(70);
    e.setPacing(null);
    for (let i = 0; i < 90; i++) e.advance(1);
    const after = e.vitals();
    expect(after.av).toBe(0);
    expect(after.hr).toBeGreaterThan(45);
    expect(MP_ADENOSINE_HAZARDS.highDoseUg).toBe(100);
  });

  it("restores a snapshot exactly with the adenosine hazard state", () => {
    const a = ready(healthy(307));
    a.setAdenosineHazards({ force: "no-escape" });
    a.giveDrug("adenosine", 150, "ic", { side: "right", vessel: "RCA", fast: true });
    a.advance(6.3);
    a.setPacing(70);
    a.advance(1.1);
    const snap = a.snapshot();
    a.advance(9.7);
    const b = new PatientEngine({ profile: a.profile, lesions: [] });
    b.restore(snap);
    for (let i = 0; i < 97; i++) b.advance(0.1);
    expect(JSON.stringify(b.snapshot())).toBe(JSON.stringify(a.snapshot()));
  });

  it("a bolus given in parts is judged whole: the part before the flush carries the bolus, the flush's part draws nothing", () => {
    // 150 µg slowly into the RCA arrives as 90 then 60 µg: neither part is above 100 µg, the bolus is
    const e = ready(healthy(308));
    e.setAdenosineHazards({ force: "af" });
    e.giveDrug("adenosine", 90, "ic", { side: "right", vessel: "RCA", fast: false, bolusUg: 150 });
    expect(e.adenosineHazards()?.force).toBeNull();
    // the flush's part: no hazard draw and no AV block draw, whatever its size
    const f = ready(healthy(308));
    f.setAdenosineHazards({ force: "af" });
    const inner = f as unknown as Inner;
    inner.adenosineBlockArmed = false;
    for (let i = 0; i < 40; i++) f.giveDrug("adenosine", 150, "ic", { side: "right", vessel: "RCA", fast: true, continuation: true });
    expect(f.adenosineHazards()?.force).toBe("af");
    expect(inner.adenosineBlockArmed).toBe(false);
    // the parts as separate doses below the limit, as before: not high risk
    const p = ready(healthy(308));
    p.setAdenosineHazards({ force: "af" });
    p.giveDrug("adenosine", 90, "ic", { side: "right", vessel: "RCA", fast: false });
    expect(p.adenosineHazards()?.force).toBe("af");
  });

  it("an arrhythmia drawn by a fast push that never reaches the AV node is dropped when that injection's effect has passed, not kept for a later dose", () => {
    const e = ready(healthy(309));
    e.setAdenosineHazards({ force: "af" });
    e.giveDrug("adenosine", 20, "ic", { side: "left", vessel: "LAD", fast: true });
    expect(e.adenosineHazards()?.force).toBeNull();
    e.advance(5);
    expect(e.snapshot().adn?.pending).toBe("af");
    let af = false;
    for (let i = 0; i < 60; i++) {
      e.advance(1);
      af ||= e.vitals().rhythmKind === "af";
    }
    expect(af).toBe(false);
    expect(e.snapshot().adn?.pending).toBeNull();
    expect(e.snapshot().adn?.pendingUntil).toBeNull();
    // a later dose that reaches the AV node, with no chance of an arrhythmia of its own: the old draw does not fire
    e.setAdenosineHazards({ afP: 0, vfP: 0, noEscapeP: 0 });
    e.giveDrug("adenosine", 150, "ic", { side: "right", vessel: "RCA" });
    for (let i = 0; i < 300; i++) {
      e.advance(0.1);
      af ||= e.vitals().rhythmKind === "af";
    }
    expect(af).toBe(false);
  });
});
