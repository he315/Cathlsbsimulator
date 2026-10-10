// ---------------------------------------------------------------------------
// Haemostasis at the end of the case, and what it leads to.
//
// Radial: a compression band inflated with air (mL). Band pressure rises with
// volume; the puncture bleeds when the band presses less than the bleeding
// threshold (higher with a longer ACT, a bigger sheath and a higher arterial
// pressure) and the radial artery stops flowing when the band presses more
// than the occlusion threshold. Patent haemostasis is the window between the
// two, confirmed with the pulse oximeter on the thumb or index finger while
// the ulnar artery is compressed (plethysmographic Barbeau test). Radial
// artery occlusion is decided at band removal from the case's risk factors.
//
// Femoral: manual compression (after the ACT has fallen) or a closure device.
// Haematoma, pseudoaneurysm and retroperitoneal bleeding come from the
// puncture height, the ACT at sheath removal, the compression and the sheath.
// Delayed events are scheduled so they can present at handover or in recovery.
// Hands-on compression (access-closure-femoral-manual, src/simulation/access/
// compression.ts) adds three optional terms to femoralRisk: the minutes its
// rule asks for, the share of the pressing time with enough pressure at the
// hole (too little pressure raises the pseudoaneurysm most) and the systolic
// pressure at the pull; callers that leave them out are unchanged.
//
// Radial band position, spasm on removal and late radial problems
// (access-closure-radial; lessons pm-closure-radial, pm-engaging-spasm and
// cm-access-complications-radial-*): the arterial hole lies proximal to the
// skin nick by the depth of the artery's near wall over the tangent of the
// needle angle (radialHoleOffsetMm); the band presses the hole only when its
// centre is near it (bandCoverage), so a band centred too distally lets the
// hole bleed into the forearm and one too proximal lets it ooze at the wrist,
// while the artery under the band still closes with enough air
// (radialBandStatus, with a second band against the first). The finger pleth
// is present unless the ulnar artery is compressed and the radial is shut
// (plethNow). A sheath is gripped when the artery's tone (the shared spasm
// model, radialSpasm.ts) is at MP_RADIAL_CLOSURE.gripAt or above; forcing it
// out then avulses the artery and a graded forearm haematoma follows
// (scheduleDelayed's `avulsion`). Late radial problems at follow-up
// (pseudoaneurysm, sterile granuloma) are graded by gradeRadialLate.
//
// Retroperitoneal risk (access-cx-bleeding-retroperitoneal): femoralRisk takes
// four more optional factors that multiply the retroperitoneal probability
// only (an IV antiplatelet infusion, uncontrolled hypertension, an unguided
// puncture, several attempts; retroperitonealMultiplier), and the delayed
// retroperitoneal bleed presents with the lesson's signs (RP_DELAYED_TEXT).
//
// Every probability below names its source in
// docs/realism/facts/pkg-access-closure-femoral-manual.md (its last section) or is
// a MODEL PARAMETER. Combining odds ratios from different studies multiplicatively
// assumes they are independent: that combination is a model choice.
// ---------------------------------------------------------------------------

import { SeededRng } from "../patient/rng";

// ---------------------------------------------------------------------------
// Sheaths
// ---------------------------------------------------------------------------

export type SheathId = "5" | "6" | "6-thin" | "7";

export interface SheathSpec {
  id: SheathId;
  /** French size of the catheter it accepts */
  fr: 5 | 6 | 7;
  /** outer diameter (mm) */
  odMm: number;
  label: string;
}

/**
 * Outer diameters: a standard 6 Fr radial sheath 2.67 mm and a standard 7 Fr 3.02 mm (REDUCE-RAO, Wang 2022,
 * PMC11267382); a thin-walled 6 Fr sheath with "5 Fr (2.46 mm) outer diameter" (Eltelbany 2024, PMC10976582),
 * which also gives the 5 Fr outer diameter.
 */
export const SHEATHS: Record<SheathId, SheathSpec> = {
  "5": { id: "5", fr: 5, odMm: 2.46, label: "5 Fr" },
  "6": { id: "6", fr: 6, odMm: 2.67, label: "6 Fr" },
  "6-thin": { id: "6-thin", fr: 6, odMm: 2.46, label: "6 Fr thin-walled" },
  "7": { id: "7", fr: 7, odMm: 3.02, label: "7 Fr" },
};

// ---------------------------------------------------------------------------
// Radial band
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the band. */
export const MP_BAND = {
  /** band pressure on the artery per mL of air (mmHg/mL) */
  mmHgPerMl: 7.5,
  /** largest inflation (mL) */
  maxMl: 20,
  /** bleeding threshold as a share of the mean arterial pressure: base, plus per ACT above 120 s (per 100 s), per Fr above 5 */
  bleedBase: 0.32,
  bleedPerAct100: 0.12,
  bleedPerFr: 0.04,
  /** an intravenous antiplatelet infusion running (a glycoprotein IIb/IIIa inhibitor or cangrelor; access-closure-radial) */
  bleedAntiplatelet: 0.06,
  /** occlusion threshold as a share of the systolic pressure */
  occludeShareOfSys: 0.72,
  /** oozing rate when under-compressed (mL/min per mmHg of deficit) */
  oozeMlPerMinPerMmHg: 0.04,
  /**
   * the time constant over which the session smooths the mean and systolic pressures the two thresholds are read
   * from (s of patient time; access-closure-radial), so a band near a threshold holds or loses the pleth steadily
   * rather than with each beat
   */
  thresholdSmoothingS: 10,
};

export interface BandThresholds {
  bleedMmHg: number;
  occludeMmHg: number;
}

export function radialThresholds(o: { map: number; sys: number; actS: number; fr: number; antiplatelet?: boolean }): BandThresholds {
  const actTerm = Math.max(0, (o.actS - 120) / 100) * MP_BAND.bleedPerAct100;
  const frTerm = Math.max(0, o.fr - 5) * MP_BAND.bleedPerFr;
  const apTerm = o.antiplatelet ? MP_BAND.bleedAntiplatelet : 0;
  return { bleedMmHg: o.map * (MP_BAND.bleedBase + actTerm + frTerm + apTerm), occludeMmHg: o.sys * MP_BAND.occludeShareOfSys };
}

export const bandPressure = (ml: number) => Math.max(0, ml) * MP_BAND.mmHgPerMl;

export interface BandStatus {
  pressureMmHg: number;
  bleeding: boolean;
  /** radial flow under the band */
  radialFlow: boolean;
  /** oozing rate (mL/min) */
  oozeMlMin: number;
}

export function bandStatus(volumeMl: number, th: BandThresholds, sheathOut: boolean): BandStatus {
  const p = bandPressure(volumeMl);
  const bleeding = sheathOut && p < th.bleedMmHg;
  return {
    pressureMmHg: p,
    bleeding,
    radialFlow: p < th.occludeMmHg,
    oozeMlMin: bleeding ? (th.bleedMmHg - p) * MP_BAND.oozeMlPerMinPerMmHg : 0,
  };
}

export type BarbeauClass = "A" | "B" | "C" | "D";

/**
 * Plethysmography on the thumb with the ulnar artery compressed. With radial flow the trace persists (A);
 * without it the trace is lost (D). B and C are the partial patterns between (here from partial band flow).
 */
export function plethWithUlnarCompression(st: BandStatus | null, radialOccluded: boolean, th?: BandThresholds): { cls: BarbeauClass; amplitude: number } {
  if (radialOccluded) return { cls: "D", amplitude: 0 };
  if (!st) return { cls: "A", amplitude: 1 };
  if (!st.radialFlow) return { cls: "D", amplitude: 0 };
  const margin = th ? (th.occludeMmHg - st.pressureMmHg) / Math.max(1, th.occludeMmHg) : 1;
  if (margin > 0.25) return { cls: "A", amplitude: 1 };
  if (margin > 0.12) return { cls: "B", amplitude: 0.6 };
  return { cls: "C", amplitude: 0.3 };
}

// ---------------------------------------------------------------------------
// Band position, a second band and the pleth now (access-closure-radial)
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETERS of the band's position. The lesson gives the rule, not a size: the band goes 'immediately
 * above the radial puncture' because 'the hole in the artery usually lies proximal to the hole in the skin,
 * particularly when the needle went in at a shallow angle'; 'a band placed too distally lets the artery bleed
 * into the forearm; one placed too proximally gives a haematoma at the wrist' (pm-closure-radial, step 3,
 * Brilakis 11.2; cm-access-complications-radial-bleeding). A second band goes 'against the first' (Oxford ch 3).
 */
export const MP_BAND_POSITION = {
  /** the band presses the artery fully within this distance of its centre (mm) */
  flatHalfMm: 4,
  /** and its pressure on the artery falls to nothing over this further distance (mm) */
  edgeMm: 5,
  /** a second band placed against the proximal edge of the first: its centre this far proximal to the first's (mm) */
  secondBandSpacingMm: 10,
  /** blood under the skin proximal to the band is seen as a swelling from this volume (mL) */
  visibleSwellingMl: 4,
};

/** How far proximal to the skin nick the needle meets the artery's near wall (mm): depth / tan(angle). */
export function radialHoleOffsetMm(nearWallDepthMm: number, angleDeg: number): number {
  const a = Math.max(5, Math.min(85, angleDeg)) * (Math.PI / 180);
  return Math.max(0, nearWallDepthMm) / Math.tan(a);
}

/** The share of a band's pressure that reaches the arterial hole, by the band centre's distance from it (mm). */
export function bandCoverage(offsetMm: number): number {
  const d = Math.abs(offsetMm);
  const { flatHalfMm, edgeMm } = MP_BAND_POSITION;
  if (d <= flatHalfMm) return 1;
  return Math.max(0, 1 - (d - flatHalfMm) / edgeMm);
}

/** One band on the wrist: its air (mL) and its centre against the arterial hole (mm, + proximal to the hole). */
export interface BandOnArm {
  volumeMl: number;
  offsetMm: number;
}

/**
 * Where an under-pressed hole bleeds: under the band at the puncture (the band over it, too little air), into
 * the forearm (the band distal to the hole) or at the wrist (the band proximal to it).
 */
export type BandBleedSite = "none" | "puncture" | "forearm" | "wrist";

export interface RadialBandStatus extends BandStatus {
  /** the pressure reaching the arterial hole (mmHg) */
  pressureAtHoleMmHg: number;
  bleedSite: BandBleedSite;
}

/**
 * The bands on the wrist against the thresholds: the hole bleeds when the best pressure reaching it is below
 * the bleeding threshold; the radial artery stops flowing when any band presses it above the occlusion
 * threshold (it is pressed under the band wherever the band sits). One centred band is bandStatus().
 */
export function radialBandStatus(bands: readonly BandOnArm[], th: BandThresholds, sheathOut: boolean): RadialBandStatus {
  let atHole = 0;
  let best: BandOnArm | null = null;
  let peak = 0;
  for (const b of bands) {
    const p = bandPressure(b.volumeMl);
    peak = Math.max(peak, p);
    const h = p * bandCoverage(b.offsetMm);
    if (!best || h > atHole) {
      atHole = h;
      best = b;
    }
  }
  const bleeding = sheathOut && atHole < th.bleedMmHg;
  let bleedSite: BandBleedSite = "none";
  if (bleeding) bleedSite = !best || bandCoverage(best.offsetMm) >= 0.999 ? "puncture" : best.offsetMm < 0 ? "forearm" : "wrist";
  return {
    pressureMmHg: peak,
    bleeding,
    radialFlow: peak < th.occludeMmHg,
    oozeMlMin: bleeding ? (th.bleedMmHg - atHole) * MP_BAND.oozeMlPerMinPerMmHg : 0,
    pressureAtHoleMmHg: atHole,
    bleedSite,
  };
}

/**
 * The finger plethysmograph now (the pulse oximeter on the index finger). With the ulnar artery open the
 * hand fills through it and the trace stays; with the ulnar artery compressed it shows the radial artery
 * under the band (plethWithUlnarCompression): lost when the band occludes it, back when it is loosened.
 */
export function plethNow(o: { band: BandStatus | null; ulnarCompressed: boolean; radialOccluded: boolean; th?: BandThresholds }): { cls: BarbeauClass; amplitude: number } {
  if (!o.ulnarCompressed) return { cls: "A", amplitude: 1 };
  return plethWithUlnarCompression(o.band, o.radialOccluded, o.th);
}

// ---------------------------------------------------------------------------
// Spasm on sheath removal (access-closure-radial)
// ---------------------------------------------------------------------------

/**
 * Removal through spasm. Sourced: 'Never pull hard: forced removal can avulse the radial artery'; the rescue is
 * more vasodilator (through the side arm, or intravenously if it will not aspirate), more sedation, warmth, a
 * lubricious solution and 'a cuff on the upper arm inflated above systolic for 5 minutes to provoke ischaemic
 * vasodilatation' (pm-closure-radial 'When things go wrong at the wrist', Brilakis 11.2.4 and 29.2.3; Oxford
 * ch 3). The sizes are MODEL PARAMETERS.
 */
export const RADIAL_SPASM_RESCUE = {
  /** the upper-arm cuff above systolic: minutes (module text) */
  cuffMin: 5,
};

export const MP_RADIAL_CLOSURE = {
  /**
   * the sheath is gripped at this tone of the shared spasm model or above: near the top of its scale, so it takes
   * several of the lesson's causes together (a small artery for the sheath, anxiety, exchanges, no fresh vasodilator)
   */
  gripAt: 0.9,
  /** a lubricious solution lets the sheath slide at this much more tone */
  lubricantMargin: 0.05,
  /** warmth over the forearm: a lasting relief, entered as vasodilator effect in the spasm model */
  warmRelief: 0.35,
  /** the cuff let down after its 5 minutes: ischaemic vasodilatation, as vasodilator effect, fading (s) */
  cuffRelief: 0.95,
  cuffTauS: 600,
  /** an avulsed radial artery: the blood it loses into the forearm (mL) and when the swelling is reported (min) */
  avulsionMl: [180, 380] as [number, number],
  avulsionMin: [2, 8] as [number, number],
};

/** Is the sheath gripped at this tone (with or without a lubricious solution)? */
export function sheathGripped(tone: number, lubricated: boolean): boolean {
  return tone >= MP_RADIAL_CLOSURE.gripAt + (lubricated ? MP_RADIAL_CLOSURE.lubricantMargin : 0);
}

// ---------------------------------------------------------------------------
// Late radial problems at follow-up (cm-access-complications-radial-other)
// ---------------------------------------------------------------------------

export type RadialLateKind = "radial-pseudoaneurysm" | "sterile-granuloma";
export type RadialLateDx = "pseudoaneurysm" | "sterile-granuloma" | "infection" | "radial-occlusion";
export type RadialLatePlan = "duplex-compress-thrombin-surgery" | "wait-steroid-excise" | "antibiotics-debride" | "anticoagulate-duplex";

/**
 * What the patient shows at follow-up, and the plan the module gives (Brilakis 29.2.5, in
 * cm-access-complications 'Radial pseudoaneurysm' and 'Sterile granuloma'). The presentation is what is
 * seen and felt; the name of the problem is the learner's to give.
 */
export const RADIAL_LATE: Record<RadialLateKind, { presentation: string; dx: RadialLateDx; plan: RadialLatePlan }> = {
  "radial-pseudoaneurysm": {
    presentation: "Review two weeks after a radial procedure: a lump over the puncture site that pulsates under the fingers. The hand is warm and pink.",
    dx: "pseudoaneurysm",
    plan: "duplex-compress-thrombin-surgery",
  },
  "sterile-granuloma": {
    presentation: "Review three weeks after a radial procedure: a red nodule over the puncture with a slight discharge. She is well and afebrile, cultures of the discharge grow nothing, and the nodule does not pulsate.",
    dx: "sterile-granuloma",
    plan: "wait-steroid-excise",
  },
};

export const RADIAL_LATE_DX_LABEL: Record<RadialLateDx, string> = {
  pseudoaneurysm: "Radial pseudoaneurysm",
  "sterile-granuloma": "Sterile granuloma",
  infection: "Access-site infection",
  "radial-occlusion": "Radial artery occlusion",
};

export const RADIAL_LATE_PLAN_LABEL: Record<RadialLatePlan, string> = {
  "duplex-compress-thrombin-surgery": "Duplex to confirm; most thrombose; ultrasound-guided compression, thrombin or surgery if it persists",
  "wait-steroid-excise": "Let it settle, a steroid cream may help, excise if it persists; watch for a later pseudoaneurysm",
  "antibiotics-debride": "Intravenous antibiotics and surgical debridement",
  "anticoagulate-duplex": "Anticoagulate and arrange a duplex scan",
};

/** Grade a follow-up assessment (pure). */
export function gradeRadialLate(kind: RadialLateKind, dx: RadialLateDx, plan: RadialLatePlan): { dxCorrect: boolean; planCorrect: boolean; expected: string } {
  const t = RADIAL_LATE[kind];
  return { dxCorrect: dx === t.dx, planCorrect: plan === t.plan, expected: `${RADIAL_LATE_DX_LABEL[t.dx]}: ${RADIAL_LATE_PLAN_LABEL[t.plan].toLowerCase()}` };
}

// ---------------------------------------------------------------------------
// Radial artery occlusion risk
// ---------------------------------------------------------------------------

export interface RaoFactors {
  heparinUPerKg: number;
  heparinU: number;
  /** patency was documented during compression (pleth with ulnar compression) */
  patentHaemostasis: boolean;
  /** hours of band compression */
  bandHours: number;
  /** radial artery inner diameter / sheath outer diameter */
  arteryToSheath: number;
  /** prophylactic ipsilateral ulnar compression at band application */
  ulnarCompression: boolean;
  /** clinically relevant spasm during the case */
  spasm: boolean;
  /** front-wall punctures of the radial artery */
  punctures: number;
  warfarin: boolean;
}

export interface RiskTerm {
  factor: string;
  oddsRatio: number;
  basis: string;
}

/** Reference: the patent-haemostasis arm of PROPHET, 24 h: 11/217 (Pancholy 2008, via Rashid 2016). */
export const RAO_BASE = { events: 11, n: 217, basis: "PROPHET patent-haemostasis arm at 24 h, 11/217 (Rashid 2016 table 2)" };

const odds = (p: number) => p / (1 - p);
const orFrom = (a: number, n1: number, b: number, n2: number) => odds(a / n1) / odds(b / n2);

/** Odds ratios from the source arms (all listed in docs/realism/facts/pkg-access-closure-femoral-manual.md). */
export const RAO_OR = {
  /** conventional (occlusive) versus patency-documented haemostasis at 24 h, PROPHET: 27/219 vs 11/217 */
  occlusive: orFrom(27, 219, 11, 217),
  /** 2000 IU versus 5000 IU heparin, early RAO, Bernat 2011: 13/222 vs 7/243 */
  lowHeparin: orFrom(13, 222, 7, 243),
  /** no heparin versus 5000 units, Spaulding 1996: 35/49 vs 9/210 */
  noHeparin: orFrom(35, 49, 9, 210),
  /** 6 h versus 2 h compression, Pancholy 2011: early 24/200 vs 11/200 */
  sixHours: orFrom(24, 200, 11, 200),
  /**
   * artery/sheath < 1 or ≥ 1 against the whole cohort: severe flow reduction 13.0% and 4.0% against 6.8% overall
   * (Saito 1999 abstract), a flow proxy. Relative to the cohort because the reference arm mixed both.
   */
  smallArtery: odds(0.13) / odds(0.068),
  largeArtery: odds(0.04) / odds(0.068),
  /** prophylactic ulnar compression: "nearly 3-fold reduction in RAO" (Eltelbany 2024): odds ratio taken as 1/3 */
  ulnar: 1 / 3,
  /** warfarin versus none, early RAO, Ahmed 2012: 16/86 vs 25/260 */
  warfarin: orFrom(16, 86, 25, 260),
  /** MODEL PARAMETERS: spasm (the review states the direction, not a size) and each extra puncture */
  spasm: 1.5,
  extraPuncture: 1.3,
};

export function raoRisk(f: RaoFactors): { probability: number; terms: RiskTerm[] } {
  const terms: RiskTerm[] = [];
  let o = odds(RAO_BASE.events / RAO_BASE.n);
  const add = (factor: string, or: number, basis: string) => {
    terms.push({ factor, oddsRatio: or, basis });
    o *= or;
  };
  if (f.heparinU <= 0) add("No heparin", RAO_OR.noHeparin, "Spaulding 1996");
  else if (f.heparinU < 5000 && f.heparinUPerKg < 50) add("Heparin below 5000 U and 50 U/kg", RAO_OR.lowHeparin, "Bernat 2011");
  if (!f.patentHaemostasis) add("Patency not documented during compression", RAO_OR.occlusive, "PROPHET, Pancholy 2008");
  if (f.bandHours > 2) add(`Band on ${f.bandHours.toFixed(1)} h`, Math.pow(RAO_OR.sixHours, Math.min(1.5, (f.bandHours - 2) / 4)), "Pancholy 2011 (6 h vs 2 h), interpolated");
  if (f.arteryToSheath < 1) add("Artery smaller than the sheath", RAO_OR.smallArtery, "Saito 1999 (flow reduction, relative to the cohort)");
  else add("Artery at least as large as the sheath", RAO_OR.largeArtery, "Saito 1999 (flow reduction, relative to the cohort)");
  if (f.ulnarCompression) add("Prophylactic ulnar compression", RAO_OR.ulnar, "Eltelbany 2024");
  if (f.warfarin) add("On warfarin", RAO_OR.warfarin, "Ahmed 2012");
  if (f.spasm) add("Spasm during the case", RAO_OR.spasm, "model parameter");
  if (f.punctures > 1) add(`${f.punctures} arterial punctures`, Math.pow(RAO_OR.extraPuncture, f.punctures - 1), "model parameter");
  return { probability: o / (1 + o), terms };
}

// ---------------------------------------------------------------------------
// Femoral haemostasis
// ---------------------------------------------------------------------------

/** Sourced thresholds and rates (docs/realism/facts/pkg-access-closure-femoral-manual.md). */
export const FEMORAL = {
  /** "manual compression ... usually once activated clotting time (ACT) has been less than 160–180 s" (Eltelbany 2024) */
  actForSheathPullS: 180,
  actForSheathPullStrictS: 160,
  /** "compressed by hand for ≥15 minutes or until hemostasis was achieved" (Bochum trial, PMC4829537) */
  manualMinutes: 15,
  /** vascular closure device failure "approximately 3.1%" (meta-analysis, PMC9482152) */
  deviceFailure: 0.031,
  /** manual compression arm after PCI (n = 214): large haematoma 14, pseudoaneurysm 10, AV fistula 2 (PMC4829537) */
  mcLargeHaematoma: 14 / 214,
  mcPseudoaneurysm: 10 / 214,
  mcAvFistula: 2 / 214,
};

/** MODEL PARAMETERS of the femoral outcome model. */
export const MP_FEMORAL = {
  /** the reference rates above come from PCI patients with a sheath pulled at ACT 300-400 s after 2-4 h; this scales them to the case's ACT at removal */
  actScalePer100: 0.55,
  /** puncture above the inguinal ligament: retroperitoneal bleeding probability */
  highStickRetroperitoneal: 0.06,
  baselineRetroperitoneal: 0.002,
  /** puncture below the bifurcation multiplies pseudoaneurysm and haematoma */
  lowStickMultiplier: 3,
  /** compression shorter than recommended (per missing minute, multiplicative) */
  shortCompressionPerMin: 1.12,
  /** compression centred away from the arteriotomy (per mm of error beyond 5 mm) */
  offTargetPerMm: 1.08,
  /** each back-wall puncture */
  backWall: 1.6,
  /** sheath size per Fr above 6 */
  perFr: 1.25,
  /** oral anticoagulation */
  anticoagulated: 1.8,
  /**
   * Hands-on compression (access-closure-femoral-manual): the share of the pressing time without enough
   * pressure at the hole multiplies the haematoma (up to this factor at none) and the pseudoaneurysm
   * ('too little pressure', Brilakis 11.1, as a cause of pseudoaneurysm) by its own factor
   */
  inadequatePressureHaematoma: 3,
  inadequatePressurePseudo: 4,
  /** systolic pressure at the pull above 140 mmHg, per 20 mmHg (hypertension as a cause of bleeding, Brilakis 11.1) */
  perSys20Above140: 1.15,
  /**
   * Retroperitoneal bleeding (access-cx-bleeding-retroperitoneal): the lesson names the direction of each, not a
   * size ('Raise your suspicion further', cm-access-complications-femoral-bleeding, Brilakis 29.1.2): a GP IIb/IIIa
   * inhibitor or cangrelor running, uncontrolled hypertension before or during the puncture, a puncture made
   * without ultrasound or fluoroscopy, and each attempt at the artery beyond the first. They multiply the
   * retroperitoneal probability only.
   */
  rpIvAntiplatelet: 2,
  rpUncontrolledHypertension: 1.5,
  rpUnguided: 1.5,
  rpPerExtraAttempt: 1.2,
};

export interface FemoralFactors {
  method: "manual" | "device";
  actAtPullS: number;
  minutes: number;
  /** distance between where pressure was applied and the arteriotomy (mm) */
  positionErrorMm: number;
  stick: "ok" | "high" | "low";
  backWalls: number;
  fr: number;
  anticoagulated: boolean;
  /** a femoral angiogram was taken before the device (puncture site checked) */
  angiogramBeforeDevice: boolean;
  /**
   * Hands-on compression (access-closure-femoral-manual), all optional so the earlier callers are
   * unchanged: the minutes the learner's rule asks for (default FEMORAL.manualMinutes), the share of the
   * pressing time with enough pressure at the hole (default 1), and the systolic pressure at the pull.
   */
  requiredMinutes?: number;
  pressureAdequacy?: number;
  sysAtPullMmHg?: number;
  /**
   * Retroperitoneal risk (access-cx-bleeding-retroperitoneal), all optional so the earlier callers are unchanged:
   * a GP IIb/IIIa inhibitor or cangrelor infusion at the puncture or the pull, uncontrolled hypertension before or
   * during the puncture, a puncture without ultrasound or fluoroscopic guidance, and the attempts at the artery.
   */
  ivAntiplatelet?: boolean;
  uncontrolledHypertension?: boolean;
  unguided?: boolean;
  attempts?: number;
}

export interface FemoralRisk {
  largeHaematoma: number;
  pseudoaneurysm: number;
  avFistula: number;
  retroperitoneal: number;
  terms: RiskTerm[];
}

export function femoralRisk(f: FemoralFactors): FemoralRisk {
  const terms: RiskTerm[] = [];
  let m = 1;
  const add = (factor: string, mult: number, basis: string) => {
    if (Math.abs(mult - 1) < 1e-3) return;
    terms.push({ factor, oddsRatio: mult, basis });
    m *= mult;
  };
  // the reference arm pulled sheaths at ACT 300-400 s; a lower ACT lowers bleeding (model scaling)
  add(`ACT ${Math.round(f.actAtPullS)} s at sheath removal`, Math.max(0.25, 1 + ((f.actAtPullS - 300) / 100) * MP_FEMORAL.actScalePer100), "model parameter scaled from the reference arm (ACT 300-400 s)");
  let pseudoExtra = 1;
  if (f.method === "manual") {
    const need = f.requiredMinutes ?? FEMORAL.manualMinutes;
    if (f.minutes < need) add(`Compression ${f.minutes} min`, Math.pow(MP_FEMORAL.shortCompressionPerMin, need - f.minutes), "model parameter");
    if (f.positionErrorMm > 5) add(`Pressure ${Math.round(f.positionErrorMm)} mm from the arteriotomy`, Math.pow(MP_FEMORAL.offTargetPerMm, f.positionErrorMm - 5), "model parameter");
    if (f.pressureAdequacy !== undefined && f.pressureAdequacy < 1) {
      const short = 1 - Math.max(0, f.pressureAdequacy);
      add(`Enough pressure at the hole for ${Math.round(f.pressureAdequacy * 100)}% of the time`, 1 + short * (MP_FEMORAL.inadequatePressureHaematoma - 1), "model parameter");
      pseudoExtra = 1 + short * (MP_FEMORAL.inadequatePressurePseudo - 1);
    }
  } else if (!f.angiogramBeforeDevice) add("Closure device without a femoral angiogram", 1.5, "model parameter");
  if (f.sysAtPullMmHg !== undefined && f.sysAtPullMmHg > 140) add(`Systolic ${Math.round(f.sysAtPullMmHg)} mmHg at sheath removal`, Math.pow(MP_FEMORAL.perSys20Above140, (f.sysAtPullMmHg - 140) / 20), "model parameter");
  if (f.stick === "low") add("Puncture below the bifurcation", MP_FEMORAL.lowStickMultiplier, "model parameter");
  if (f.backWalls > 0) add(`${f.backWalls} back-wall puncture(s)`, Math.pow(MP_FEMORAL.backWall, f.backWalls), "model parameter");
  if (f.fr > 6) add(`${f.fr} Fr sheath`, Math.pow(MP_FEMORAL.perFr, f.fr - 6), "model parameter");
  if (f.anticoagulated) add("Oral anticoagulation", MP_FEMORAL.anticoagulated, "model parameter");
  const cap = (p: number) => Math.min(0.9, p);
  const retro = (f.stick === "high" ? MP_FEMORAL.highStickRetroperitoneal : MP_FEMORAL.baselineRetroperitoneal) * retroperitonealMultiplier(f, terms);
  return {
    largeHaematoma: cap(FEMORAL.mcLargeHaematoma * m),
    pseudoaneurysm: cap(FEMORAL.mcPseudoaneurysm * m * pseudoExtra * (f.stick === "low" ? 1 : 0.7)),
    avFistula: cap(FEMORAL.mcAvFistula * (f.stick === "low" ? MP_FEMORAL.lowStickMultiplier : 1)),
    retroperitoneal: cap(retro * Math.max(1, m)),
    terms,
  };
}

/**
 * The retroperitoneal terms of femoralRisk (access-cx-bleeding-retroperitoneal): each optional factor present
 * multiplies the retroperitoneal probability by its MODEL PARAMETER and is listed in `terms` (for the debrief).
 * Without the optional factors the multiplier is 1, so the earlier callers are unchanged.
 */
export function retroperitonealMultiplier(f: Pick<FemoralFactors, "ivAntiplatelet" | "uncontrolledHypertension" | "unguided" | "attempts">, terms?: RiskTerm[]): number {
  let m = 1;
  const add = (factor: string, mult: number) => {
    terms?.push({ factor, oddsRatio: mult, basis: "model parameter (retroperitoneal only; direction from Brilakis 29.1.2)" });
    m *= mult;
  };
  if (f.ivAntiplatelet) add("GP IIb/IIIa inhibitor or cangrelor infusion", MP_FEMORAL.rpIvAntiplatelet);
  if (f.uncontrolledHypertension) add("Uncontrolled hypertension at the puncture", MP_FEMORAL.rpUncontrolledHypertension);
  if (f.unguided) add("Puncture without ultrasound or fluoroscopy", MP_FEMORAL.rpUnguided);
  if (f.attempts !== undefined && f.attempts > 1) add(`${f.attempts} attempts at the artery`, Math.pow(MP_FEMORAL.rpPerExtraAttempt, f.attempts - 1));
  return m;
}

// ---------------------------------------------------------------------------
// Radial haematoma (EASY grades)
// ---------------------------------------------------------------------------

/**
 * EASY grades (Garg 2019, PMC6620468): I < 5 cm; II 5-10 cm; III > 10 cm but distal to the elbow; IV extending
 * above the elbow; V ischaemic threat to the hand. Incidence after transradial PCI: I 4.2%, II 1.7%, III 3.5%,
 * IV 0.8% (520 patients).
 */
export const EASY_INCIDENCE = { I: 0.042, II: 0.017, III: 0.035, IV: 0.008 };

export type EasyGrade = 0 | 1 | 2 | 3 | 4 | 5;

export function easyGradeFromSize(cm: number, aboveElbow: boolean, ischaemic: boolean): EasyGrade {
  if (ischaemic) return 5;
  if (aboveElbow) return 4;
  if (cm <= 0) return 0;
  if (cm < 5) return 1;
  if (cm <= 10) return 2;
  return 3;
}

/**
 * MODEL PARAMETER: a forearm haematoma as a flattened collection holds this many mL per cm² of its diameter
 * squared (haematomaCm; its inverse, haematomaMlForCm, is the forearm haematoma model's, access-cx-forearm).
 */
export const HAEMATOMA_ML_PER_CM2 = 0.6;

/** MODEL PARAMETER: diameter (cm) of a forearm haematoma from its volume (mL), as a flattened collection. */
export function haematomaCm(ml: number): number {
  return ml <= 0 ? 0 : Math.round(Math.sqrt(ml / HAEMATOMA_ML_PER_CM2) * 10) / 10;
}

/** The volume (mL) of a forearm haematoma of this diameter (cm): the inverse of haematomaCm, unrounded. */
export function haematomaMlForCm(cm: number): number {
  return cm <= 0 ? 0 : HAEMATOMA_ML_PER_CM2 * cm * cm;
}

// ---------------------------------------------------------------------------
// Delayed events
// ---------------------------------------------------------------------------

/**
 * What can present after closure. The recovery ward (proc-recovery-ward, src/simulation/session/ward.ts) adds
 * four kinds that only a scenario schedules (scheduleDelayed never draws them): chest pain after PCI (severity
 * major: the stented vessel occludes), a tamponade (bleedMlMin is the pericardial inflow, totalMl its volume), a
 * stroke hours after the case, and a creatinine rise found at the 48-72 hour review.
 */
export type DelayedKind =
  | "radial-occlusion"
  | "forearm-haematoma"
  | "groin-haematoma"
  | "pseudoaneurysm"
  | "av-fistula"
  | "retroperitoneal-bleed"
  | "rebleed"
  | "chest-pain-post-pci"
  | "tamponade"
  | "stroke"
  | "creatinine-rise";

export interface DelayedEvent {
  kind: DelayedKind;
  /** session time at which it can be found (s) */
  atS: number;
  /** blood loss rate while active (mL/min) and total (mL) */
  bleedMlMin: number;
  totalMl: number;
  /** what the nurse or patient reports */
  report: string;
  /** what examination finds */
  finding: string;
  severity: "minor" | "major";
  /** a radial haematoma's EASY grade, for the debrief only: never in the live finding, which the learner grades */
  easyGrade?: number;
}

/**
 * What a retroperitoneal bleed looks like when it presents (cm-access-complications-femoral-bleeding, 'Suspecting
 * it', Brilakis 29.1.2): sweating, pain low in the abdomen or in the back, a low pressure with a pulse that is often
 * slow, and a soft groin. Signs only: the finding never names the bleed.
 */
export const RP_DELAYED_TEXT = {
  report: "Low back and lower abdominal pain; sweating, and feels faint.",
  finding: "Low blood pressure; the groin is soft, with no swelling, and the lower abdomen is tender above the pubis.",
};

/** MODEL PARAMETERS: when delayed events present after closure (min). */
export const MP_DELAY = {
  forearmMin: [15, 60] as [number, number],
  groinMin: [10, 60] as [number, number],
  retroMin: [30, 150] as [number, number],
  pseudoMin: [60, 240] as [number, number],
  retroRateMlMin: [6, 14] as [number, number],
  retroTotalMl: [600, 1400] as [number, number],
};

export interface DelayedInputs {
  route: "radial" | "femoral";
  closedAtS: number;
  seed: string;
  /** radial */
  rao?: { probability: number };
  forearmPerforation?: boolean;
  bandOozeMl?: number;
  radialPunctures?: number;
  /** the radial artery avulsed by a sheath forced out through spasm (access-closure-radial): the forearm bleed follows */
  avulsion?: boolean;
  /** femoral */
  femoral?: FemoralRisk;
}

/** Sample the delayed events of this case (deterministic per seed). */
export function scheduleDelayed(o: DelayedInputs): DelayedEvent[] {
  const rng = new SeededRng(`delayed:${o.seed}`);
  const at = (r: [number, number]) => o.closedAtS + rng.range(r[0], r[1]) * 60;
  const ev: DelayedEvent[] = [];
  if (o.route === "radial") {
    if (o.rao && rng.next() < o.rao.probability) {
      ev.push({ kind: "radial-occlusion", atS: o.closedAtS, bleedMlMin: 0, totalMl: 0, report: "No symptoms.", finding: "No radial pulse; the thumb pleth is lost with the ulnar artery compressed (reverse Barbeau D).", severity: "minor" });
    }
    const ooze = o.bandOozeMl ?? 0;
    // forearm haematoma: from a perforated branch, or from the puncture site when under-compressed
    if (o.forearmPerforation) {
      const total = rng.range(40, 140);
      ev.push({ kind: "forearm-haematoma", atS: at(MP_DELAY.forearmMin), bleedMlMin: total / 30, totalMl: total, report: "Forearm pain and swelling above the band.", finding: `Tense forearm swelling, about ${haematomaCm(total)} cm.`, severity: total > 100 ? "major" : "minor" });
    } else {
      const extra = (o.radialPunctures ?? 1) > 1 ? 2 : 1; // model: repeated punctures double the base incidence
      const pI = (EASY_INCIDENCE.I + EASY_INCIDENCE.II) * extra + Math.min(0.5, ooze / 40);
      if (rng.next() < pI) {
        const total = Math.max(5, ooze + rng.range(3, 25));
        ev.push({ kind: "forearm-haematoma", atS: at(MP_DELAY.forearmMin), bleedMlMin: total / 20, totalMl: total, report: "A swelling at the wrist under the band.", finding: `Swelling about ${haematomaCm(total)} cm at the puncture site.`, severity: "minor" });
      }
    }
    // an avulsed artery bleeds into the forearm within minutes (drawn last, so a case without it draws as before)
    if (o.avulsion) {
      const total = rng.range(MP_RADIAL_CLOSURE.avulsionMl[0], MP_RADIAL_CLOSURE.avulsionMl[1]);
      const cm = haematomaCm(total);
      ev.push({
        kind: "forearm-haematoma",
        atS: at(MP_RADIAL_CLOSURE.avulsionMin),
        bleedMlMin: total / 15,
        totalMl: total,
        report: "Severe forearm pain; the forearm is swelling fast above the band.",
        finding: `Tense forearm swelling about ${cm} cm from the wrist, below the elbow.`,
        severity: "major",
        easyGrade: easyGradeFromSize(cm, false, false),
      });
    }
  } else if (o.femoral) {
    const f = o.femoral;
    if (rng.next() < f.retroperitoneal) {
      const total = rng.range(MP_DELAY.retroTotalMl[0], MP_DELAY.retroTotalMl[1]);
      ev.push({ kind: "retroperitoneal-bleed", atS: at(MP_DELAY.retroMin), bleedMlMin: rng.range(MP_DELAY.retroRateMlMin[0], MP_DELAY.retroRateMlMin[1]), totalMl: total, report: RP_DELAYED_TEXT.report, finding: RP_DELAYED_TEXT.finding, severity: "major" });
    }
    if (rng.next() < f.largeHaematoma) {
      const total = rng.range(80, 300);
      ev.push({ kind: "groin-haematoma", atS: at(MP_DELAY.groinMin), bleedMlMin: total / 25, totalMl: total, report: "Groin swelling and pain.", finding: "A tense groin haematoma larger than 5 cm.", severity: total > 200 ? "major" : "minor" });
    }
    if (rng.next() < f.pseudoaneurysm) ev.push({ kind: "pseudoaneurysm", atS: at(MP_DELAY.pseudoMin), bleedMlMin: 0, totalMl: 0, report: "A tender groin lump.", finding: "A pulsatile groin mass with a bruit.", severity: "minor" });
    if (rng.next() < f.avFistula) ev.push({ kind: "av-fistula", atS: at(MP_DELAY.pseudoMin), bleedMlMin: 0, totalMl: 0, report: "No symptoms.", finding: "A continuous bruit over the groin.", severity: "minor" });
  }
  return ev.sort((a, b) => a.atS - b.atS);
}
