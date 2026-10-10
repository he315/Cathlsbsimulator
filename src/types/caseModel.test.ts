// found-case-model-types: the shared lesion, collateral, graft, anatomy-variant
// and chart types change no existing case. The digests below were taken from
// caseGenerator before src/types/index.ts was edited (8 October 2026); the
// type additions are compile-time only, so the generated JSON must not move.
// When a later package intentionally changes caseGenerator (for example adds a
// variant to VARIANT_POOL with a low prior) or CASE_LIBRARY, regenerate these
// digests in that package and say so in its report.
// diag-anatomy-variants did so: generateRandomCase now draws a rare coronary
// anomaly (ANOMALY_PRIOR) on its own seeded stream. The pre-change digest is
// therefore checked against the same seeds with the prior off, and the cases
// that drew an anomaly are checked against their prior-off twins.
import { describe, expect, it } from "vitest";
import type { AnatomyCase, AnatomyVariant, CaseChart, CollateralChannel, Graft, Lesion } from "./index";
import {
  ANOMALY_VARIANTS,
  CASE_LIBRARY,
  PRESET_ORDER,
  dailyCase,
  generateBatch,
  generateCase,
  generateRandomCase,
} from "../simulation/caseGenerator";

/** Variants that existed before this package. */
const OLD_VARIANTS = [
  "normal-root",
  "small-root",
  "dilated-root",
  "rotated-root",
  "horizontal-aorta",
  "vertical-aorta",
  "high-rca",
  "anterior-rca",
  "superior-rca",
  "shepherds-crook-rca",
  "short-lm",
  "long-lm",
  "separate-ostia",
  "ramus",
  "tortuous-rca",
  "tortuous-iliac",
  "tortuous-subclavian",
  "radial-loop",
] as const satisfies readonly AnatomyVariant[];

/** Variants this package adds. */
const NEW_VARIANTS = [
  "anomalous-lcx-right-sinus",
  "anomalous-lcx-from-rca",
  "anomalous-rca-left-sinus",
  "anomalous-lm-right-sinus",
  "high-ostia",
  "conus-separate-ostium",
  "myocardial-bridge",
  "fistula-lad-pa",
  "very-dilated-root",
  "arteria-lusoria",
  "iliac-stenosis",
  "iliac-stent",
  "iliac-occlusion",
  "aortic-occlusion",
  "aaa",
  "tall-patient",
] as const satisfies readonly AnatomyVariant[];

// Compile-time: the two lists together are exactly the AnatomyVariant union.
type Listed = (typeof OLD_VARIANTS)[number] | (typeof NEW_VARIANTS)[number];
type Unlisted = Exclude<AnatomyVariant, Listed>;
const exhaustive: [Unlisted] extends [never] ? true : false = true;

/** Pre-change SHA-256 of JSON.stringify of the fixed seed sets. */
const PRE_CHANGE = {
  random200: "f5737a38ccc388cbbbd9aab6be5d1093b29bbc8d6d3726c9efdf57ff651bb653",
  first: "248f084496afa7aa887dd4896461be93d808128d0eeddd081fd1f5216a236b88",
  last: "acf00db4b089a43c78c35f0c0aa2478ba208fd69e307d72a20db2fb6196b3cc3",
  library: "ea4a0e94a6343d398c57ad6e8b69274570f7b26778dec60bd25ef1c895f1105c",
};

/** SHA-256 hex of JSON.stringify(v), through WebCrypto (global in Node and the browser). */
async function sha(v: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(v));
  const buf = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
const SEEDS = Array.from({ length: 200 }, (_, i) => `case-model-${i}`);
const randomCases = () => SEEDS.map((s) => generateRandomCase(s));
/** The same seeds through the same spec as generateRandomCase, without the anomaly prior. */
const priorOffCases = () => SEEDS.map((s) => generateCase(s, { minDifficulty: undefined, focus: undefined }, "rand"));

const NEW_SET = new Set<string>(NEW_VARIANTS);
const hasNewVariant = (c: AnatomyCase) => c.variants.some((v) => NEW_SET.has(v));

/** Fields of AnatomyCase and Lesion before this package. */
const CASE_KEYS = [
  "id", "name", "difficulty", "accessRoute", "rootSize", "rootRotationDeg", "aortaTiltDeg", "dominance",
  "variants", "pathology", "lesions", "recommendedCatheters", "acceptableCatheters", "requiredViews",
  "traps", "objectives", "teachingSummary",
];
const LESION_KEYS = new Set(["vessel", "position", "severity", "kind", "lengthMm"]);

describe("shared case model types", () => {
  it("lists every AnatomyVariant once", () => {
    expect(exhaustive).toBe(true);
    expect(new Set([...OLD_VARIANTS, ...NEW_VARIANTS]).size).toBe(OLD_VARIANTS.length + NEW_VARIANTS.length);
    expect(NEW_VARIANTS).toHaveLength(16);
  });

  it("200 random cases carry a new variant only as one rare anomaly", () => {
    const cases = randomCases();
    expect(cases).toHaveLength(200);
    const anomalous = cases.filter(hasNewVariant);
    // ANOMALY_PRIOR is 0.015, so about 3 of 200; the seed set is fixed, so the ids are too
    expect(anomalous.map((c) => c.id)).toEqual(["gen|rand|case-model-53", "gen|rand|case-model-94", "gen|rand|case-model-123"]);
    for (const c of anomalous) {
      const added = c.variants.filter((v) => NEW_SET.has(v));
      expect(added).toHaveLength(1);
      expect(ANOMALY_VARIANTS).toContain(added[0]);
    }
  });

  it("200 random cases equal their pre-change JSON for the fixed seed set, apart from the anomaly", async () => {
    const off = priorOffCases();
    expect(off.filter(hasNewVariant)).toEqual([]);
    expect(await sha(off[0])).toBe(PRE_CHANGE.first);
    expect(await sha(off[199])).toBe(PRE_CHANGE.last);
    expect(await sha(off)).toBe(PRE_CHANGE.random200);
    // a case that drew an anomaly differs from its prior-off twin only in the variant list and what is derived from
    // it: the difficulty, the teaching summary, the traps and the catheter lists
    const on = randomCases();
    on.forEach((c, i) => {
      if (!hasNewVariant(c)) return expect(c).toEqual(off[i]);
      const { variants, difficulty, teachingSummary: _s, traps, acceptableCatheters, recommendedCatheters, ...rest } = c;
      const { variants: v0, difficulty: d0, teachingSummary: _s0, traps: t0, acceptableCatheters: a0, recommendedCatheters: r0, ...rest0 } = off[i];
      expect(rest).toEqual(rest0);
      expect(traps).toEqual(expect.arrayContaining(t0));
      // an anomalous origin changes which catheters fit, so the lists are only required to be there
      for (const list of [acceptableCatheters, recommendedCatheters, a0, r0]) expect(list.length).toBeGreaterThan(0);
      expect(variants.filter((v) => !NEW_SET.has(v))).toEqual(v0);
      expect(difficulty).toBe(Math.min(5, d0 + 1));
    });
  });

  it("the case library is unchanged and carries no new variant or field", async () => {
    expect(CASE_LIBRARY).toHaveLength(100);
    expect(await sha(CASE_LIBRARY)).toBe(PRE_CHANGE.library);
    expect(CASE_LIBRARY.filter(hasNewVariant)).toEqual([]);
  });

  it("generated cases carry no scenario, events, chart, grafts or new lesion fields", () => {
    const pool = [...randomCases(), ...CASE_LIBRARY];
    for (const c of pool) {
      expect(Object.keys(c).sort()).toEqual([...CASE_KEYS].sort());
      for (const l of c.lesions) for (const k of Object.keys(l)) expect(LESION_KEYS.has(k)).toBe(true);
    }
  });

  it("preset batches and daily cases draw no new variant", () => {
    for (const key of PRESET_ORDER) {
      const batch = generateBatch(key, 10, "case-model-preset");
      expect(batch.filter(hasNewVariant).map((c) => c.id)).toEqual([]);
    }
    for (let d = 1; d <= 28; d++) expect(hasNewVariant(dailyCase(new Date(2026, 1, d)))).toBe(false);
  });

  it("accepts a full lesion, graft and chart (compile-time shape check)", () => {
    const channel: CollateralChannel = {
      donor: "LAD",
      recipient: "PDA",
      type: "septal",
      wernerCC: 1,
      rentrop: 3,
      tortuosity: 1,
    };
    const cto: Lesion = {
      vessel: "RCA",
      position: 0.45,
      severity: 100,
      kind: "cto",
      morphology: "cto",
      role: "target",
      sites: ["cto"],
      calcium: 2,
      cto: { stump: "tapered", lengthMm: 20, collaterals: [channel] },
    };
    const bifurcation: Lesion = {
      vessel: "LAD",
      position: 0.3,
      severity: 80,
      kind: "severe-stenosis",
      eccentricity: 0.6,
      orientationDeg: 90,
      taperMm: 0.5,
      branchAt: 0.5,
      medina: [1, 1, 1],
      sideBranch: { vessel: "D1", angleDeg: 50, diameterMm: 2.5 },
      lipid: { arcDeg: 120, capUm: 60 },
      calciumArcDeg: 90,
      thrombusGrade: 0,
      sites: ["bifurcation"],
      role: "non-culprit",
    };
    const scad: Lesion = {
      vessel: "LAD",
      position: 0.7,
      severity: 70,
      kind: "moderate-stenosis",
      morphology: "scad",
      scadType: "2A",
      nitrateResponsive: false,
    };
    const graft: Graft = {
      conduit: "svg",
      target: "OM1",
      position: 0.4,
      proximalSite: "aorta-high",
      status: "diseased",
      ringMarker: true,
      sequential: [{ target: "OM2", position: 0.5 }],
    };
    const chart: CaseChart = {
      ageY: 64,
      sex: "F",
      heightCm: 160,
      weightKg: 70,
      egfr: 30,
      echo: { lvef: 45, valves: [{ valve: "aortic", lesion: "stenosis", severity: "moderate" }] },
      drugs: [{ name: "Apixaban", lastDoseHoursAgo: 12 }],
      allergies: { contrast: "previous-mild" },
      pregnancy: "not-applicable",
      priorFluoroProcedures: [{ procedure: "PCI to RCA", daysAgo: 30 }],
      skinFindings: ["erythema over the right back"],
      operationNote: "SVG to OM1",
      armPressures: { left: { systolic: 120, diastolic: 70 }, right: { systolic: 140, diastolic: 75 } },
      arrestHistory: { rhythm: "vf", witnessed: true },
      ecgId: "ecg-example",
      consentScope: "diagnostic-and-ad-hoc-pci",
      previousCatheters: [{ target: "left", catheterId: "JL4", route: "radial-right" }],
    };
    const base = generateRandomCase("case-model-shape");
    const c: AnatomyCase = {
      ...base,
      variants: [...base.variants, "anomalous-lcx-right-sinus"],
      lesions: [cto, bifurcation, scad],
      scenarioId: "example",
      events: ["cto"],
      chart,
      grafts: [graft],
    };
    expect(c.lesions).toHaveLength(3);
    expect(c.grafts?.[0].sequential?.[0].target).toBe("OM2");
    // the original generated case is not altered by building on it
    expect(base.scenarioId).toBeUndefined();
  });
});
