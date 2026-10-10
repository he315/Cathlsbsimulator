// ---------------------------------------------------------------------------
// Anatomy genome: the per-patient description of the coronary tree and the
// heart it sits on, sampled from population priors.
//
// Every prior below is either taken from a source that was opened (quoted in
// docs/realism/facts/S3.md, abstracts saved in scripts/anatomy_validation/refs/)
// or is named as a model parameter. Case-specified fields always win: the
// case's dominance and variants are respected, and the genome only fills in
// what the case does not say (number of diagonals, wrap-around LAD, ...).
// The genome is derived from the case id, so the same case always gives the
// same patient, and it is stored on the built tree for teaching text.
// ---------------------------------------------------------------------------

import type { AnatomyCase, Dominance } from "../../types";
import { Rng } from "../../utils/random";

export type SaNodalOrigin = "RCA" | "LCx" | "LM" | "both";

export interface AnatomyGenome {
  /** stable key for topology caching */
  key: string;
  seed: string;
  dominance: Dominance;
  sex: "male" | "female";
  lvh: boolean;
  heart: { scale: number; azimuthDeg: number; elevationDeg: number; rollDeg: number; lvWidth: number; rvWidth: number; length: number };
  lm: { lengthMm: number; bifAngleDeg: number; diameterMm: number; separateOstia: boolean };
  ramus: boolean;
  diagonals: number;
  marginals: number;
  septals: number;
  rvBranches: number;
  plBranches: number;
  wrapAround: boolean;
  saNodal: SaNodalOrigin;
  bridge: { vessel: "LAD" | "D1" | "OM1"; startFrac: number; lengthMm: number; depth: number } | null;
  tortuosity: { index: number; rcaIndex: number; corkscrew: boolean; rcaLoops?: boolean };
  /**
   * Near-ostial diameters (mm) of the first diagonal, the (first) obtuse marginal and the ramus, sampled from
   * Divia Paul et al. 2018 relative to the patient's left main. They are lower bounds for the flow law: a named
   * branch that drains too little surface territory near the base is given the extra flow (coronaryGrowth.ts).
   */
  branchDiameterMm?: { d1: number; om1: number; ramus: number };
  /** geometric variants in force (from the case) */
  variants: string[];
  /**
   * Coronary-to-pulmonary-artery fistula (variant fistula-lad-pa, diag-anatomy-variants): where it leaves the LAD
   * (fraction of the LAD's length) and its lumen radius, mm. Absent without the variant.
   */
  fistula?: { from: "LAD"; atFrac: number; radiusMm: number };
}

/** Overrides from the case or a scenario: anything given here is used as is. */
export interface GenomeOverrides {
  dominance?: Dominance;
  variants?: readonly string[];
  sex?: "male" | "female";
  lvh?: boolean;
  ramus?: boolean;
  diagonals?: number;
  marginals?: number;
  wrapAround?: boolean;
  bridge?: AnatomyGenome["bridge"];
  tortuosityIndex?: number;
  heartScale?: number;
}

/**
 * Population priors. Each entry names its source; "model" means a model parameter with no
 * literature value opened (chosen for plausibility or fitted to library measurements).
 */
export const PRIORS = {
  /** Knaapen et al. 2012, doi:10.1016/j.carpath.2012.02.012: 1,453 post-mortem angiograms, right 81.2%, left 9.1%, codominant 9.7% */
  dominance: { right: 0.812, left: 0.091, codominant: 0.097 },
  /** Medrano-Gracia et al. 2017, doi:10.1007/s12265-016-9720-2 (PMC5323506): "approximately 30 %" have an intermediate artery */
  ramus: 0.3,
  /** Manpoong et al. 2023, doi:10.7759/cureus.45023: diagonals single/duplicated/multiple 14/62/24% */
  diagonals: { one: 0.14, two: 0.62, many: 0.24 },
  /** Manpoong et al. 2023: marginal branches single/double/multiple 20/51/29% */
  marginals: { one: 0.2, two: 0.51, many: 0.29 },
  /** "multiple" split between 3 and 4 branches: model parameter */
  manyIsFour: 0.3,
  /**
   * Kobayashi et al. 2015, doi:10.1016/j.amjcard.2015.09.004: wrap-around LAD in 871 of 1,095 (79.5%). This is a
   * selected population (anterior STEMI with an LAD culprit), not a general one; it is used because it is the largest
   * opened cohort and lies between Manpoong 2023 (86% of 100 diagnostic angiograms) and Ilia 2014 (57%).
   */
  wrapAround: 871 / 1095,
  /**
   * Vikse et al. 2016, doi:10.1371/journal.pone.0148331 (meta-analysis, 21,455 hearts): SA-nodal artery from the RCA
   * 68.0%, LCx 22.1%, left coronary artery 2.7%; duplication 4.3%. Duplicated arteries are modelled as one from
   * each coronary; single-origin probabilities are the pooled values renormalised over the single-vessel cases.
   */
  saNodal: { duplicated: 0.043, RCA: 0.68, LCx: 0.221, LM: 0.027 },
  /** Hostiuc et al. 2018, doi:10.1111/1556-4029.13665: bridging 6% at angiography; 82% on the LAD; mean length 19.3 mm; mean thickness 2.47 mm */
  bridge: { prevalence: 0.06, onLad: 0.82, meanLengthMm: 19.3, thicknessMm: 2.47 },
  /** bridge length SD and systolic compression depth: model parameters */
  bridgeLengthSdMm: 4,
  bridgeDepth: [0.35, 0.75] as [number, number],
  /** Medrano-Gracia et al. 2016, doi:10.4244/EIJV12I7A139: LM length 10.5 ± 5.3 mm; LM bifurcation angle 89 ± 21° with and 75 ± 23° without an intermediate artery */
  lmLengthMm: { mean: 10.5, sd: 5.3 },
  lmBifAngleDeg: { withRamus: { mean: 89, sd: 21 }, without: { mean: 75, sd: 23 } },
  /** Dodge et al. 1992, doi:10.1161/01.cir.86.1.232: LM 4.5 ± 0.5 mm; women -9%; LVH +17% */
  lmDiameterMm: { mean: 4.5, sd: 0.5 },
  femaleCalibre: 0.91,
  lvhCalibre: 1.17,
  /**
   * Share of women among simulated patients: model parameter (not a population prior). 0.38 happens to equal the sex
   * mix of the Manpoong 2023 angiography cohort (38 of 100), which is quoted only as a plausibility check.
   */
  female: 0.38,
  /**
   * Divia Paul et al. 2018, doi:10.1016/j.ihj.2018.06.002 (PMC6309284), Table 2, QCA at the point of maximum diameter
   * near the ostium, normal or non-flow-limiting coronaries (253 men, 201 women): LMCA 4.29 ± 0.76 / 3.96 ± 0.73,
   * DIAG 1.83 ± 0.43 / 1.65 ± 0.41, OM 2.19 ± 0.48 / 2.05 ± 0.41, ramus intermedius 2.41 ± 0.59 / 2.16 ± 0.37 mm (men /
   * women). Used as ratios to the cohort's own LMCA so they scale with the genome's left main.
   */
  branchDiameterMm: {
    male: { lm: 4.29, d1: [1.83, 0.43], om1: [2.19, 0.48], ramus: [2.41, 0.59] },
    female: { lm: 3.96, d1: [1.65, 0.41], om1: [2.05, 0.41], ramus: [2.16, 0.37] },
  },
  /**
   * Septal perforators: Kesieme et al. 2024, doi:10.2174/011573403X321942241023112517 (PMC12060931): "averaging about
   * 9 in number (range 6-14)"; sampled uniformly 6-12 (mean 9; the longest tails are left out)
   */
  septals: [6, 12] as [number, number],
  /** RV branches, posterolateral branches: model parameters */
  rvBranches: [1, 3] as [number, number],
  plBranches: [1, 3] as [number, number],
  /**
   * Per-patient tortuosity index: lognormal, median 1, sigma 0.35 (model parameter, chosen so the spread of the
   * projected 8-20 mm band RMS matches the 6.5-22 degree range traced on library cines). Corkscrew when the index is in
   * the top 4% (model parameter).
   */
  tortuositySigma: 0.35,
  corkscrewAbove: 1.8,
  /**
   * Heart size and orientation: model parameters. Mean size fitted to the projected LCA extents measured on the
   * library (scripts/anatomy_validation/reference.json); spreads chosen so the extent IQR is similar.
   */
  heartScaleSd: 0.06,
  femaleHeartScale: 0.95,
  axisSdDeg: { azimuth: 6, elevation: 6, roll: 6 },
  /** mean long-axis orientation (model parameters fitted to the library extents) */
  axisMeanDeg: { azimuth: 50, elevation: 30, roll: -8 },
  /**
   * Mean base-to-apex length factor (heart.ts LEN x this): model parameter fitted with the axis above by
   * scripts/anatomy_validation/fit_axis.ts to the catheter-removed library extents and the traced RAO cranial
   * LM+LAD length (the ventricle is longer than it is wide; the width keeps scale 1). Wave 2 (I2): lowered from 1.22
   * to 1.19 after the LAD course meander lengthened the projected LM+LAD (sim_metrics.ts length, 24 genomes: median
   * 138.8 mm at 1.22, 136.7 at 1.19, library 134.9); 1.17 reached 134.7 mm but put the RAO cranial width below the
   * extents band (anatomy.test).
   */
  heartLengthMean: 1.19,
  /**
   * RV size factor (heart.ts RV ellipsoid): model parameter, set so that the RCA from its ostium to the crux runs
   * about 140-170 mm in the right AV groove with the fitted axis (the RV ellipsoid otherwise makes the right AV
   * ring too wide).
   */
  rvWidthMean: 0.9,
  /** LV short-axis size factor (heart.ts LV ellipsoid): model parameter */
  lvWidthMean: 1,
  /**
   * Coronary-to-pulmonary-artery fistula (variant fistula-lad-pa): origin along the proximal LAD (fraction of its
   * length) and lumen radius (mm). MODEL PARAMETERS: the manuals (pm-interpreting-anomalies; Oxford ch 6, Brilakis)
   * say a fistula usually drains to the pulmonary artery and that the shunt is rarely large, and give no dimensions.
   */
  fistula: { atFrac: [0.06, 0.14] as [number, number], radiusMm: [0.7, 0.95] as [number, number] },
} as const;

function truncNormal(r: Rng, mean: number, sd: number, lo: number, hi: number): number {
  for (let k = 0; k < 16; k++) {
    // Box-Muller
    const u1 = Math.max(1e-12, r.next()),
      u2 = r.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const x = mean + sd * z;
    if (x >= lo && x <= hi) return x;
  }
  return Math.min(hi, Math.max(lo, mean));
}

function gauss(r: Rng): number {
  const u1 = Math.max(1e-12, r.next()),
    u2 = r.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function count3(r: Rng, p: { one: number; two: number; many: number }): number {
  const x = r.next();
  if (x < p.one) return 1;
  if (x < p.one + p.two) return 2;
  return r.next() < PRIORS.manyIsFour ? 4 : 3;
}

/**
 * Sample a genome. Every random draw uses its own named stream, so a change to one prior does not
 * reshuffle the others (cases keep their anatomy when the model is extended).
 */
export function sampleGenome(seed: string, o: GenomeOverrides = {}): AnatomyGenome {
  const R = (name: string) => new Rng(`genome:${seed}:${name}`);
  const variants = [...(o.variants ?? [])].map(String);
  const has = (v: string) => variants.includes(v);

  let dominance: Dominance;
  if (o.dominance) dominance = o.dominance;
  else {
    const x = R("dominance").next();
    dominance = x < PRIORS.dominance.right ? "right" : x < PRIORS.dominance.right + PRIORS.dominance.left ? "left" : "codominant";
  }
  const sex = o.sex ?? (R("sex").next() < PRIORS.female ? "female" : "male");
  const lvh = o.lvh ?? false;
  // the ramus is a case-visible vessel (VesselId RAMUS): present when the case says so; sampled only
  // when the caller asks for a sampled ramus (o.ramus === undefined and no variants list was given)
  const ramus = o.ramus ?? (o.variants ? has("ramus") : R("ramus").next() < PRIORS.ramus);
  // separate LAD and circumflex ostia give way to an anomalous left main or circumflex (simulation/anatomy.ts does the same)
  const separateOstia = has("separate-ostia") && !has("anomalous-lm-right-sinus") && !has("anomalous-lcx-right-sinus") && !has("anomalous-lcx-from-rca");
  let lmLen: number;
  const rl = R("lmLength");
  if (separateOstia) lmLen = 0;
  else if (has("long-lm")) lmLen = truncNormal(rl, 17, 2, 15, 22);
  else if (has("short-lm")) lmLen = truncNormal(rl, 4.5, 1, 3, 6);
  else lmLen = truncNormal(rl, PRIORS.lmLengthMm.mean, PRIORS.lmLengthMm.sd, 5.5, 17);
  const ang = ramus ? PRIORS.lmBifAngleDeg.withRamus : PRIORS.lmBifAngleDeg.without;
  const bifAngleDeg = truncNormal(R("lmAngle"), ang.mean, ang.sd, 40, 130);
  const calibre = (sex === "female" ? PRIORS.femaleCalibre : 1) * (lvh ? PRIORS.lvhCalibre : 1);
  // LM diameter kept within ±1.6 SD so every case has a cannulable adult left main
  const diameterMm = truncNormal(R("lmDiameter"), PRIORS.lmDiameterMm.mean, PRIORS.lmDiameterMm.sd, 3.9, 5.3) * calibre;

  const diagonals = o.diagonals ?? count3(R("diagonals"), PRIORS.diagonals);
  const marginals = o.marginals ?? count3(R("marginals"), PRIORS.marginals);
  const septals = R("septals").int(PRIORS.septals[0], PRIORS.septals[1]);
  const rvBranches = R("rvBranches").int(PRIORS.rvBranches[0], PRIORS.rvBranches[1]);
  const plBranches = R("plBranches").int(PRIORS.plBranches[0], PRIORS.plBranches[1]);
  const wrapAround = o.wrapAround ?? R("wrap").next() < PRIORS.wrapAround;

  const rs = R("saNodal").next();
  const sa = PRIORS.saNodal;
  let saNodal: SaNodalOrigin;
  if (rs < sa.duplicated) saNodal = "both";
  else {
    const x = ((rs - sa.duplicated) / (1 - sa.duplicated)) * (sa.RCA + sa.LCx + sa.LM);
    saNodal = x < sa.RCA ? "RCA" : x < sa.RCA + sa.LCx ? "LCx" : "LM";
  }

  let bridge: AnatomyGenome["bridge"] = null;
  if (o.bridge !== undefined) bridge = o.bridge;
  else {
    const rb = R("bridge");
    const forced = has("myocardial-bridge");
    if (forced || rb.next() < PRIORS.bridge.prevalence) {
      const onLad = forced || rb.next() < PRIORS.bridge.onLad;
      bridge = {
        vessel: onLad ? "LAD" : rb.next() < 0.5 ? "D1" : "OM1",
        startFrac: onLad ? rb.range(0.32, 0.5) : rb.range(0.2, 0.4),
        lengthMm: truncNormal(rb, PRIORS.bridge.meanLengthMm, PRIORS.bridgeLengthSdMm, 10, 30),
        depth: rb.range(PRIORS.bridgeDepth[0], PRIORS.bridgeDepth[1]),
      };
    }
  }

  const ti = o.tortuosityIndex ?? Math.exp(PRIORS.tortuositySigma * gauss(R("tortuosity")));
  // a tortuous RCA undulates more at every scale, most at the longer wavelengths (loops); the curvature
  // limit caps the shortest ones, so the long octave carries the phenotype (model parameters)
  const rcaIndex = ti * (has("tortuous-rca") ? 1.8 : 1);
  const corkscrew = ti > PRIORS.corkscrewAbove;

  // near-ostial side-branch diameters relative to the left main (Divia Paul 2018), truncated at ±1.5 SD
  const bd = PRIORS.branchDiameterMm[sex];
  const rbd = R("branchDiameter");
  const branchD = (m: readonly [number, number]) => (truncNormal(rbd, m[0], m[1], m[0] - 1.5 * m[1], m[0] + 1.5 * m[1]) / bd.lm) * diameterMm;
  const branchDiameterMm = { d1: branchD(bd.d1), om1: branchD(bd.om1), ramus: branchD(bd.ramus) };

  const rh = R("heart");
  const scale =
    o.heartScale ??
    Math.max(0.85, Math.min(1.18, (1 + PRIORS.heartScaleSd * gauss(rh)) * (sex === "female" ? PRIORS.femaleHeartScale : 1) * (lvh ? 1.05 : 1)));
  const heart = {
    scale,
    azimuthDeg: PRIORS.axisMeanDeg.azimuth + PRIORS.axisSdDeg.azimuth * Math.max(-2, Math.min(2, gauss(rh))),
    elevationDeg: PRIORS.axisMeanDeg.elevation + PRIORS.axisSdDeg.elevation * Math.max(-2, Math.min(2, gauss(rh))),
    rollDeg: PRIORS.axisMeanDeg.roll + PRIORS.axisSdDeg.roll * Math.max(-2, Math.min(2, gauss(rh))),
    lvWidth: PRIORS.lvWidthMean * (lvh ? 1.08 : 1),
    rvWidth: PRIORS.rvWidthMean,
    length: PRIORS.heartLengthMean,
  };

  // its own named stream, drawn only with the variant: every other genome is unchanged
  let fistula: AnatomyGenome["fistula"];
  if (has("fistula-lad-pa")) {
    const rf = R("fistula");
    fistula = { from: "LAD", atFrac: rf.range(PRIORS.fistula.atFrac[0], PRIORS.fistula.atFrac[1]), radiusMm: rf.range(PRIORS.fistula.radiusMm[0], PRIORS.fistula.radiusMm[1]) };
  }

  const g: Omit<AnatomyGenome, "key"> = {
    seed,
    dominance,
    sex,
    lvh,
    heart,
    lm: { lengthMm: lmLen, bifAngleDeg, diameterMm, separateOstia },
    ramus,
    diagonals,
    marginals,
    septals,
    rvBranches,
    plBranches,
    wrapAround,
    saNodal,
    bridge,
    tortuosity: { index: ti, rcaIndex, corkscrew, rcaLoops: has("tortuous-rca") },
    branchDiameterMm,
    variants: variants.sort(),
  };
  if (fistula) g.fistula = fistula;
  return { ...g, key: genomeKey(g) };
}

function genomeKey(g: Omit<AnatomyGenome, "key">): string {
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return JSON.stringify([
    g.seed,
    g.dominance,
    g.sex,
    g.lvh,
    Object.values(g.heart).map(r),
    [r(g.lm.lengthMm), r(g.lm.bifAngleDeg), r(g.lm.diameterMm), g.lm.separateOstia],
    g.ramus,
    g.diagonals,
    g.marginals,
    g.septals,
    g.rvBranches,
    g.plBranches,
    g.wrapAround,
    g.saNodal,
    g.bridge ? [g.bridge.vessel, r(g.bridge.startFrac), r(g.bridge.lengthMm), r(g.bridge.depth)] : null,
    [r(g.tortuosity.index), r(g.tortuosity.rcaIndex), g.tortuosity.corkscrew],
    g.branchDiameterMm ? [r(g.branchDiameterMm.d1), r(g.branchDiameterMm.om1), r(g.branchDiameterMm.ramus)] : null,
    g.variants,
    // appended only when present, so the keys of genomes without a fistula are unchanged
    ...(g.fistula ? [[g.fistula.from, r(g.fistula.atFrac), r(g.fistula.radiusMm)]] : []),
  ]);
}

/** The genome for a case: seeded by the case id, respecting its dominance and variants. */
export function genomeForCase(c: Pick<AnatomyCase, "id" | "dominance" | "variants">, extra: GenomeOverrides = {}): AnatomyGenome {
  return sampleGenome(c.id, { dominance: c.dominance, variants: c.variants, ...extra });
}

/** Short teaching description of a genome, e.g. "right dominant; ramus present; wrap-around LAD". */
export function describeGenome(g: AnatomyGenome): string[] {
  const out: string[] = [];
  out.push(g.dominance === "codominant" ? "codominant circulation" : `${g.dominance} dominant`);
  if (g.lm.separateOstia) out.push("separate LAD and circumflex ostia (no left main)");
  else out.push(`left main ${Math.round(g.lm.lengthMm)} mm long, ${g.lm.diameterMm.toFixed(1)} mm diameter`);
  if (g.ramus) out.push("ramus intermedius present");
  out.push(`${g.diagonals} diagonal${g.diagonals > 1 ? "s" : ""}, ${g.marginals} obtuse marginal${g.marginals > 1 ? "s" : ""}`);
  out.push(g.wrapAround ? "wrap-around LAD (reaches the inferior apex)" : "LAD ends at or before the apex");
  out.push(g.saNodal === "both" ? "two sinoatrial nodal arteries" : `sinoatrial nodal artery from the ${g.saNodal === "LM" ? "left main" : g.saNodal}`);
  if (g.bridge) out.push(`myocardial bridge on the ${g.bridge.vessel}, about ${Math.round(g.bridge.lengthMm)} mm long`);
  if (g.tortuosity.corkscrew) out.push("corkscrew tortuosity");
  else if (g.tortuosity.index > 1.4) out.push("tortuous vessels");
  if (g.tortuosity.rcaLoops) out.push("tortuous RCA");
  // origin and course anomalies (diag-anatomy-variants): debrief and teaching text, not a live screen
  const v = new Set(g.variants);
  if (v.has("anomalous-lcx-right-sinus")) out.push("circumflex from its own ostium in the right sinus, running behind the aorta");
  else if (v.has("anomalous-lcx-from-rca")) out.push("circumflex from the proximal RCA, running behind the aorta");
  if (v.has("anomalous-rca-left-sinus")) out.push("RCA from the left sinus, running between the aorta and the pulmonary trunk");
  if (v.has("anomalous-lm-right-sinus")) out.push("left main from the right sinus, running between the aorta and the pulmonary trunk");
  if (v.has("high-ostia")) out.push("both coronary ostia high, at or above the sinotubular junction");
  if (v.has("conus-separate-ostium")) out.push("large conus branch from its own ostium beside the RCA");
  if (g.fistula) out.push("fistula from the proximal LAD to the pulmonary artery");
  if (v.has("very-dilated-root")) out.push("very dilated aortic root");
  return out;
}
