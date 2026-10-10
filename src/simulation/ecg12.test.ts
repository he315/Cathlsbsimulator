// The 12-lead with the right-sided and posterior leads, the culprit's injury vector, the bundle
// branch templates and the pre-brief strip (diag-acs-scenarios).
//   npx vitest run src/simulation/ecg12.test.ts
import { describe, expect, it } from "vitest";
import {
  ALL_LEADS,
  DOWER,
  EXTRA_LEAD_VECTORS,
  LEADS,
  OTHER_LEADS_ST_MM,
  POSTERIOR_ST_MM,
  STRIP_HZ,
  ecgStrip,
  extendedStemi,
  injuryVectorFor,
  leadsFromVcg,
  qrsWindow,
  shareBeyond,
  stMm,
  stMmAll,
  stemiCriteria,
  stripSpecFor,
  ventricularVcg,
  type AnyLead,
  type EcgBeat,
  type Vec3f,
} from "./ecg12";
import { defaultFlowMap } from "./patient/coronaryFlow";
import { ACS_CASES } from "./diagnosticScenarios/acs";

const regions = defaultFlowMap().regions;
const st = (occ: { vessel: string; param: number }[]) => stMmAll(injuryVectorFor(regions, occ));

describe("the right-sided and posterior leads", () => {
  it("a proximal RCA occlusion gives ST elevation in II, III, aVF and V4R (1 mm or more, the module's threshold outside V2-V3), with V3R too", () => {
    const s = st([{ vessel: "RCA", param: 0.05 }]);
    for (const l of ["II", "III", "aVF", "V4R", "V3R"] as const) expect(s[l], l).toBeGreaterThanOrEqual(OTHER_LEADS_ST_MM);
    // reciprocal depression in the high lateral leads
    expect(s.aVL).toBeLessThan(0);
    const x = extendedStemi(s, "F", 67);
    expect(x.standard.groups).toContain("inferior");
    expect(x.rv).toBe(true);
  });

  it("an RCA occlusion beyond its RV branches raises the inferior leads but not V4R", () => {
    const s = st([{ vessel: "RCA", param: 0.65 }]);
    for (const l of ["II", "III", "aVF"] as const) expect(s[l], l).toBeGreaterThanOrEqual(1);
    expect(s.V4R).toBeLessThan(OTHER_LEADS_ST_MM);
    expect(extendedStemi(s, "M", 60).rv).toBe(false);
  });

  it("the posterior scenario (diag-stemi-posterior) gives V1-V3 depression with V7-V9 elevation of at least 0.5 mm, and no classic ST elevation on the 12 standard leads", () => {
    const ecg = ACS_CASES["diag-stemi-posterior"].ecg!;
    const s = stMmAll(stripSpecFor(ecg, regions).st);
    for (const l of ["V1", "V2", "V3"] as const) expect(s[l], l).toBeLessThan(0);
    for (const l of ["V7", "V8", "V9"] as const) expect(s[l], l).toBeGreaterThanOrEqual(POSTERIOR_ST_MM);
    const x = extendedStemi(s, "M", 58);
    expect(x.standard.met).toBe(false);
    expect(x.posterior).toBe(true);
    expect(x.met).toBe(true);
  });

  it("V3R and V4R are V3 and V4 mirrored across the sagittal plane; V7-V9 lie behind V6 on its horizontal plane", () => {
    expect(EXTRA_LEAD_VECTORS.V3R).toEqual([-DOWER.V3[0], DOWER.V3[1], DOWER.V3[2]]);
    expect(EXTRA_LEAD_VECTORS.V4R).toEqual([-DOWER.V4[0], DOWER.V4[1], DOWER.V4[2]]);
    const h = Math.hypot(DOWER.V6[0], DOWER.V6[2]);
    let prevZ = DOWER.V6[2];
    for (const l of ["V7", "V8", "V9"] as const) {
      const v = EXTRA_LEAD_VECTORS[l];
      expect(Math.hypot(v[0], v[2])).toBeCloseTo(h, 6);
      expect(v[1]).toBe(DOWER.V6[1]);
      expect(v[2]).toBeGreaterThan(prevZ);
      prevZ = v[2];
    }
    // the 12 standard leads are unchanged by the extension
    const v: Vec3f = [0.3, -0.2, 0.5];
    const all = stMmAll(v);
    const std = stMm(v);
    for (const l of LEADS) expect(all[l]).toBe(std[l]);
    expect(ALL_LEADS).toEqual([...LEADS, "V3R", "V4R", "V7", "V8", "V9"]);
  });
});

describe("the culprit's injury vector", () => {
  it("counts only the regions beyond the occlusion, with a partial share for the region it sits in", () => {
    const lad = regions.find((r) => r.vessel === "LAD" && r.p0 === 0)!;
    expect(shareBeyond(lad, "LAD", 0)).toBe(1);
    expect(shareBeyond(lad, "LAD", lad.p1)).toBe(0);
    expect(shareBeyond(lad, "LAD", lad.p1 / 2)).toBeCloseTo(0.5, 6);
    const d1 = regions.find((r) => r.vessel === "D1")!;
    expect(shareBeyond(d1, "LAD", 0.1)).toBe(1); // D1 leaves the LAD at 0.25
    expect(shareBeyond(d1, "LAD", 0.4)).toBe(0);
    expect(shareBeyond(d1, "RCA", 0)).toBe(0);
    expect(injuryVectorFor(regions, [])).toEqual([0, 0, 0]);
  });

  it("an anterior occlusion elevates the anterior leads; the scenario ECGs match the territory their answer names", () => {
    const a = st([{ vessel: "LAD", param: 0.05 }]);
    expect(stemiCriteria(a, "M", 61).groups).toContain("anterior");
    for (const [id, c] of Object.entries(ACS_CASES)) {
      if (!c.ecg) continue;
      const s = stMmAll(stripSpecFor(c.ecg, regions).st);
      const x = extendedStemi(s, "M", 60);
      const t = c.ecg.truth.territory;
      if (t === "anterior") expect(x.standard.groups, id).toContain("anterior");
      if (t === "inferior") expect(x.standard.groups.includes("inferior") && !x.rv, id).toBe(true);
      if (t === "inferior-rv") expect(x.rv && x.standard.groups.includes("inferior"), id).toBe(true);
      if (t === "posterior") expect(x.posterior && !x.standard.met, id).toBe(true);
      if (t === "no-st-elevation" || t === "bundle-branch-or-paced") expect(x.met, id).toBe(false);
      // an ECG that activates the pathway shows a STEMI pattern, unless it is a block managed as one
      if (t !== "bundle-branch-or-paced") expect(x.met, id).toBe(c.ecg.truth.activate);
    }
  });
});

describe("the beat templates", () => {
  // values of the dipole before this package added the bundle-branch templates (the engine's beats are unchanged)
  const b = (morph: EcgBeat["morph"]): EcgBeat => ({ morph, qt: 0.38, st: [0.05, 0.1, -0.03], tExtra: [0.02, -0.01, 0.03], qrsScale: 1.1 });
  it("keeps the engine's normal, ectopic and paced dipoles exactly", () => {
    const close = (v: Vec3f, w: number[]) => v.forEach((x, i) => expect(x).toBeCloseTo(w[i], 5));
    close(ventricularVcg(0, b("normal")), [1.009367, 0.790556, 0.401799]);
    close(ventricularVcg(0.3, b("normal")), [0.328966, 0.300524, -0.116238]);
    close(ventricularVcg(0, b("ectopic")), [-0.208673, -0.74688, -0.519654]);
    close(ventricularVcg(0.3, b("vt")), [0.292721, 0.495546, 0.356556]);
    close(ventricularVcg(-0.02, b("paced")), [0.775456, -1.324365, 0.835913]);
    close(ventricularVcg(0.3, b("paced")), [-0.156762, 0.3607, -0.317669]);
    expect(qrsWindow("normal")).toEqual({ onset: -0.045, j: 0.042 });
    expect(qrsWindow("paced")).toEqual({ onset: -0.09, j: 0.1 });
  });

  const lead = (s: Record<AnyLead, Float32Array>, l: AnyLead) => Array.from(s[l]);
  /** the QRS of the first beat: samples from 80 ms before to 110 ms after its R peak (the strip's first R is at 0.35 s) */
  const qrs = (s: Record<AnyLead, Float32Array>, l: AnyLead, from = -0.08, to = 0.11) => lead(s, l).slice(Math.round((0.35 + from) * STRIP_HZ), Math.round((0.35 + to) * STRIP_HZ));

  it("LBBB: a QRS over 120 ms, a monomorphic R in I, V5 and V6, a QS in V1, and the ST displaced opposite to the QRS", () => {
    const w = qrsWindow("lbbb");
    expect((w.j - w.onset) * 1000).toBeGreaterThan(120);
    const s = ecgStrip({ morph: "lbbb", hr: 70, st: [0, 0, 0] });
    for (const l of ["I", "V5", "V6"] as const) {
      const q = qrs(s, l);
      expect(Math.max(...q), l).toBeGreaterThan(0.5);
      // no Q wave: nothing negative before the R
      const peak = q.indexOf(Math.max(...q));
      expect(Math.min(...q.slice(0, peak)), l).toBeGreaterThan(-0.05);
    }
    const v1 = qrs(s, "V1");
    expect(Math.min(...v1)).toBeLessThan(-0.5);
    expect(Math.max(...v1)).toBeLessThan(0.1);
    // the ST segment, 40 ms after the J point: below the baseline in V6 (discordant), above it in V1
    const at = Math.round((0.35 + w.j + 0.04) * STRIP_HZ);
    expect(s.V6[at]).toBeLessThan(0);
    expect(s.V1[at]).toBeGreaterThan(0);
  });

  it("RBBB: a QRS over 120 ms with a late R' in V1 and a slurred S in I and V6", () => {
    const w = qrsWindow("rbbb");
    expect((w.j - w.onset) * 1000).toBeGreaterThan(120);
    const s = ecgStrip({ morph: "rbbb", hr: 70, st: [0, 0, 0] });
    const late = (l: AnyLead) => qrs(s, l, 0.04, 0.08);
    expect(Math.max(...late("V1"))).toBeGreaterThan(0.3);
    expect(Math.min(...late("I"))).toBeLessThan(-0.15);
    expect(Math.min(...late("V6"))).toBeLessThan(-0.1);
  });
});

describe("the pre-brief strip", () => {
  it("is deterministic, covers every lead and is the engine's projection of one dipole", () => {
    const spec = stripSpecFor(ACS_CASES["diag-stemi-inferior-rv"].ecg!, regions);
    const a = ecgStrip(spec);
    const b = ecgStrip(spec);
    expect(Object.keys(a)).toEqual([...ALL_LEADS]);
    for (const l of ALL_LEADS) expect(Array.from(a[l])).toEqual(Array.from(b[l]));
    expect(a.II.length).toBe(Math.round(2.5 * STRIP_HZ));
    // Einthoven: II = I + III at every sample
    for (let i = 0; i < a.II.length; i += 7) expect(a.II[i]).toBeCloseTo(a.I[i] + a.III[i], 2);
    // the ST segment shows the injury: elevated in III and V4R mid-ST of the first beat
    const mid = Math.round((0.35 + 0.12) * STRIP_HZ);
    expect(a.III[mid]).toBeGreaterThan(0.2);
    expect(a.V4R[mid]).toBeGreaterThan(0.05);
    // leadsFromVcg agrees with the strip's projection for the standard leads
    const out = leadsFromVcg([0.1, 0.2, 0.3]);
    expect(out[1]).toBeCloseTo(0.1 * DOWER.II[0] + 0.2 * DOWER.II[1] + 0.3 * DOWER.II[2], 5);
  });
});
