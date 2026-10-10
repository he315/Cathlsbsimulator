// ===========================================================================
// TAVI teaching engine: CT planning arithmetic and a deterministic,
// qualitative outcome model.
//
// Everything here is for education only. The sizing chart is an ILLUSTRATIVE
// TEACHING CHART generated from a single stated oversizing rule; it is not any
// manufacturer's chart and must never be used to size a real valve. Risks are
// reported as "low" / "moderate" / "high" with the reasons that produced them;
// the model never produces percentages or event rates.
//
// Conventions
//   - Lengths in mm, areas in mm².
//   - Implant depth: distance from the annular plane (the virtual basal ring
//     through the cusp nadirs) down to the ventricular (inflow) end of the
//     frame, positive below the annulus, negative above it.
//   - Each risk is an additive score from named factors; the score maps to a
//     level with one shared rule (0–1 low, 2–3 moderate, ≥4 high), so every
//     level can be explained by listing its factors.
// ===========================================================================

export type RiskLevel = "low" | "moderate" | "high";
export type CalciumGrade = "none" | "mild" | "moderate" | "severe";
export type LeafletCalcium = "mild" | "moderate" | "severe";
export type ValvePlatform = "balloon-expandable" | "self-expanding";
export type AccessRoute = "transfemoral" | "alternative";

export const PLATFORM_LABEL: Record<ValvePlatform, string> = {
  "balloon-expandable": "Balloon-expandable (intra-annular)",
  "self-expanding": "Self-expanding (supra-annular)",
};

export interface Annulus {
  areaMm2: number;
  perimeterMm: number;
  minDiameterMm: number;
  maxDiameterMm: number;
}

export interface IliofemoralAccess {
  /** minimal luminal diameter along the better iliofemoral axis */
  mldMm: number;
  calcification: CalciumGrade;
  tortuosity: CalciumGrade;
}

export interface TaviScenario {
  id: string;
  title: string;
  /** one-paragraph vignette; every case is synthetic */
  vignette: string;
  age: number;
  sex: "M" | "F";
  bsaM2: number;
  lvefPct: number;
  bicuspid: boolean;
  annulus: Annulus;
  lvotCalcium: CalciumGrade;
  leafletCalcium: LeafletCalcium;
  coronaryHeightLeftMm: number;
  coronaryHeightRightMm: number;
  /** mean sinus of Valsalva diameter */
  sinusDiameterMm: number;
  stjDiameterMm: number;
  membranousSeptumMm: number;
  rbbb: boolean;
  access: IliofemoralAccess;
  /** what the case is designed to teach */
  focus: string;
  teachingPoints: string[];
  /**
   * A case that opens with the valve already deployed (at the assess step): the plan that was
   * carried out. The plan is the scenario's, not the learner's, so the debrief scores only what the
   * learner did from the assess step on (scoreTavi with response.planByLearner false).
   */
  deployed?: TaviPlan;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Perimeter-derived mean diameter: Dp = P / π. */
export function perimeterDerivedDiameter(perimeterMm: number): number {
  return perimeterMm / Math.PI;
}

/** Area-derived mean diameter: Da = 2·√(A / π). */
export function areaDerivedDiameter(areaMm2: number): number {
  return 2 * Math.sqrt(areaMm2 / Math.PI);
}

/** Area of an ellipse from its minimum and maximum diameters. */
export function ellipseArea(minD: number, maxD: number): number {
  return (Math.PI * minD * maxD) / 4;
}

/** Ramanujan's approximation to the perimeter of an ellipse. */
export function ellipsePerimeter(minD: number, maxD: number): number {
  const a = maxD / 2;
  const b = minD / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** Eccentricity index, 1 − Dmin/Dmax (0 = circular). */
export function eccentricityIndex(minD: number, maxD: number): number {
  return 1 - minD / maxD;
}

export function nominalArea(sizeMm: number): number {
  return (Math.PI * sizeMm * sizeMm) / 4;
}

export function nominalPerimeter(sizeMm: number): number {
  return Math.PI * sizeMm;
}

// ---------------------------------------------------------------------------
// Illustrative teaching chart
// ---------------------------------------------------------------------------

export const CHART_LABEL = "Illustrative teaching chart, not a manufacturer's IFU";

export const VALVE_SIZES: Record<ValvePlatform, number[]> = {
  "balloon-expandable": [20, 23, 26, 29],
  "self-expanding": [23, 26, 29, 32],
};

/**
 * The single rule each chart is generated from (oversizing of the valve's
 * nominal area or circumference relative to the measured annulus). The windows
 * were chosen to agree in magnitude with the oversizing implied by current
 * labelled sizing tables (docs/SIM_FACTS.md items 1 and 2) without copying any
 * of them: balloon-expandable tables imply roughly −3% to +23% nominal-area
 * oversizing for most sizes; self-expanding tables roughly +11% to +31%
 * nominal-perimeter oversizing.
 *   balloon-expandable: sized by AREA, nominal-area oversizing −4% to +23%
 *   self-expanding:     sized by PERIMETER, nominal-perimeter oversizing +12% to +30%
 * The balloon-expandable rule leaves a gap between the two smallest sizes;
 * an annulus there is "between sizes" and the anatomy decides.
 */
export const CHART_RULE: Record<
  ValvePlatform,
  { metric: "area" | "perimeter"; minOversizePct: number; maxOversizePct: number; text: string }
> = {
  "balloon-expandable": {
    metric: "area",
    minOversizePct: -4,
    maxOversizePct: 23,
    text: "Sized by annular area. A size is listed where its nominal area is between 4% smaller and 23% larger than the annulus. Between listed sizes, weigh calcium, LVOT shape, sinus width and coronary height.",
  },
  "self-expanding": {
    metric: "perimeter",
    minOversizePct: 12,
    maxOversizePct: 30,
    text: "Sized by annular perimeter. A size is listed where its nominal circumference is 12% to 30% larger than the annulus.",
  },
};

export interface ChartRow {
  sizeMm: number;
  metric: "area" | "perimeter";
  /** inclusive range of the annular metric this size is listed for */
  min: number;
  max: number;
}

export function teachingChart(platform: ValvePlatform): ChartRow[] {
  const rule = CHART_RULE[platform];
  return VALVE_SIZES[platform].map((s) => {
    const nominal = rule.metric === "area" ? nominalArea(s) : nominalPerimeter(s);
    return {
      sizeMm: s,
      metric: rule.metric,
      min: nominal / (1 + rule.maxOversizePct / 100),
      max: nominal / (1 + rule.minOversizePct / 100),
    };
  });
}

export function annulusMetric(platform: ValvePlatform, a: Annulus): number {
  return CHART_RULE[platform].metric === "area" ? a.areaMm2 : a.perimeterMm;
}

/** Sizes whose chart range contains the annulus (two when it falls in an overlap). */
export function suggestedSizes(platform: ValvePlatform, a: Annulus): number[] {
  const m = annulusMetric(platform, a);
  return teachingChart(platform)
    .filter((r) => m >= r.min && m <= r.max)
    .map((r) => r.sizeMm);
}

/**
 * Oversizing in percent: by nominal area for balloon-expandable valves, by
 * nominal circumference for self-expanding valves.
 */
export function oversizingPct(platform: ValvePlatform, sizeMm: number, a: Annulus): number {
  if (platform === "balloon-expandable") return (nominalArea(sizeMm) / a.areaMm2 - 1) * 100;
  return (nominalPerimeter(sizeMm) / a.perimeterMm - 1) * 100;
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/**
 * Generic delivery systems. The minimum vessel diameters follow the pattern of
 * a labelled self-expanding system (5 mm for its 14 Fr-equivalent sheath,
 * 6 mm for the largest size; docs/SIM_FACTS.md item 2) and are applied to both
 * generic platforms as an illustration. Check the IFU of the actual system.
 */
export function deliverySystemFor(platform: ValvePlatform, sizeMm: number): { label: string; minVesselMm: number } {
  const largest = VALVE_SIZES[platform][VALVE_SIZES[platform].length - 1];
  return sizeMm >= largest
    ? { label: "18 Fr-equivalent system", minVesselMm: 6.0 }
    : { label: "14 Fr-equivalent system", minVesselMm: 5.0 };
}

/** Margin between the minimal luminal diameter and the system's minimum vessel diameter (mm). */
export function accessMarginMm(mldMm: number, minVesselMm: number): number {
  return mldMm - minVesselMm;
}

// ---------------------------------------------------------------------------
// Implant depth teaching targets
// ---------------------------------------------------------------------------

export const DEPTH_TARGET: Record<ValvePlatform, { ideal: [number, number]; acceptable: [number, number] }> = {
  "balloon-expandable": { ideal: [2, 4], acceptable: [1, 6] },
  "self-expanding": { ideal: [3, 5], acceptable: [2, 6] },
};

export function depthBand(platform: ValvePlatform, depthMm: number): "too-high" | "high" | "ideal" | "deep" | "too-deep" {
  const t = DEPTH_TARGET[platform];
  if (depthMm < t.acceptable[0]) return "too-high";
  if (depthMm < t.ideal[0]) return "high";
  if (depthMm <= t.ideal[1]) return "ideal";
  if (depthMm <= t.acceptable[1]) return "deep";
  return "too-deep";
}

// ---------------------------------------------------------------------------
// Plan and outcome
// ---------------------------------------------------------------------------

export interface TaviPlan {
  access: AccessRoute;
  platform: ValvePlatform;
  sizeMm: number;
  /** depth the operator planned on CT */
  targetDepthMm: number;
  /** depth actually achieved at release (before any pacing-related jump) */
  finalDepthMm: number;
  predilatation: boolean;
  postDilatation: boolean;
  /** rapid ventricular pacing during balloon-expandable deployment */
  rapidPacing: boolean;
  /** wire (± undeployed stent) parked in the coronary judged at risk */
  coronaryProtection: boolean;
}

export type TaviRiskKey =
  | "pvl"
  | "embolisation"
  | "rupture"
  | "coronary"
  | "conduction"
  | "gradient"
  | "vascular";

export const RISK_ORDER: TaviRiskKey[] = [
  "pvl",
  "embolisation",
  "rupture",
  "coronary",
  "conduction",
  "gradient",
  "vascular",
];

export const RISK_LABEL: Record<TaviRiskKey, string> = {
  pvl: "Paravalvular leak",
  embolisation: "Embolisation or migration",
  rupture: "Annular rupture",
  coronary: "Coronary obstruction",
  conduction: "Conduction disturbance and pacemaker",
  gradient: "High gradient and patient–prosthesis mismatch",
  vascular: "Vascular complication",
};

export interface RiskFactor {
  points: number;
  text: string;
}

export interface RiskItem {
  key: TaviRiskKey;
  label: string;
  level: RiskLevel;
  score: number;
  /** contributing factors (points > 0) and mitigating notes (points ≤ 0) */
  reasons: string[];
  factors: RiskFactor[];
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 4) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

export const LEVEL_VALUE: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2 };

/** Pacing failure during balloon-expandable deployment: the valve is ejected towards the aorta. */
export const UNPACED_JUMP_MM = 3;

export function effectiveDepth(plan: TaviPlan): number {
  if (plan.platform === "balloon-expandable" && !plan.rapidPacing) return plan.finalDepthMm - UNPACED_JUMP_MM;
  return plan.finalDepthMm;
}

/** SCCT 2019 consensus markers (docs/SIM_FACTS.md item 3). */
export const CORONARY_HEIGHT_FLAG_MM = 12;
export const SINUS_FLAG_MM = 30;

/** Teaching definition of a small annulus used by this model (not a guideline value). */
export const SMALL_ANNULUS_AREA = 430;
export const VERY_SMALL_ANNULUS_AREA = 346; // area-derived diameter about 21 mm

function item(key: TaviRiskKey, factors: RiskFactor[]): RiskItem {
  const score = Math.max(0, factors.reduce((s, f) => s + f.points, 0));
  return {
    key,
    label: RISK_LABEL[key],
    level: levelFromScore(score),
    score,
    factors,
    reasons: factors.map((f) => f.text),
  };
}

export interface TaviOutcome {
  oversizingPct: number;
  depthMm: number;
  depthBand: ReturnType<typeof depthBand>;
  /** MLD minus the system's minimum vessel diameter (null for alternative access) */
  accessMarginMm: number | null;
  system: { label: string; minVesselMm: number };
  inChart: boolean;
  risks: Record<TaviRiskKey, RiskItem>;
}

export function minCoronaryHeight(s: TaviScenario): number {
  return Math.min(s.coronaryHeightLeftMm, s.coronaryHeightRightMm);
}

export function lowerCoronary(s: TaviScenario): "left main" | "right coronary" {
  return s.coronaryHeightLeftMm <= s.coronaryHeightRightMm ? "left main" : "right coronary";
}

export function assessTavi(s: TaviScenario, plan: TaviPlan): TaviOutcome {
  const be = plan.platform === "balloon-expandable";
  const os = oversizingPct(plan.platform, plan.sizeMm, s.annulus);
  const depth = effectiveDepth(plan);
  const band = depthBand(plan.platform, depth);
  const t = DEPTH_TARGET[plan.platform];
  const system = deliverySystemFor(plan.platform, plan.sizeMm);
  const margin = plan.access === "transfemoral" ? accessMarginMm(s.access.mldMm, system.minVesselMm) : null;
  const inChart = suggestedSizes(plan.platform, s.annulus).includes(plan.sizeMm);
  const osTxt = `${os >= 0 ? "+" : ""}${os.toFixed(0)}%`;
  const osMetric = be ? "nominal-area oversizing" : "nominal-perimeter oversizing";

  // Sizing contribution shared by PVL and embolisation.
  const under: RiskFactor[] = [];
  if (be) {
    if (os < -8) under.push({ points: 2, text: `Undersized (${osMetric} ${osTxt}): little radial force to seal or anchor.` });
    else if (os < -4) under.push({ points: 1, text: `Below the chart window (${osMetric} ${osTxt}): limited sealing force.` });
  } else {
    if (os < 5) under.push({ points: 2, text: `Undersized (${osMetric} ${osTxt}): a self-expanding frame needs more oversizing to seal and anchor.` });
    else if (os < 12) under.push({ points: 1, text: `Below the chart window (${osMetric} ${osTxt}).` });
  }

  // ---- Paravalvular leak ----
  const pvl: RiskFactor[] = [...under];
  if (s.lvotCalcium === "severe") pvl.push({ points: 2, text: "Severe LVOT/annular calcium prevents frame apposition." });
  else if (s.lvotCalcium === "moderate") pvl.push({ points: 1, text: "Moderate LVOT/annular calcium." });
  if (s.leafletCalcium === "severe") pvl.push({ points: 1, text: "Bulky leaflet calcium leaves gaps around the frame." });
  if (s.bicuspid) pvl.push({ points: 1, text: "Bicuspid anatomy: elliptical annulus and asymmetric calcium." });
  if (depth < 0) pvl.push({ points: 2, text: `Inflow ${Math.abs(depth).toFixed(1)} mm above the annulus: the sealing skirt is above the annular plane.` });
  else if (depth < t.acceptable[0]) pvl.push({ points: 1, text: `High implant (${depth.toFixed(1)} mm): skirt barely covers the annulus.` });
  else if (depth > t.acceptable[1] + 3) pvl.push({ points: 2, text: `Very deep implant (${depth.toFixed(1)} mm): the seal sits in the LVOT, below the annulus.` });
  else if (depth > t.acceptable[1]) pvl.push({ points: 1, text: `Deep implant (${depth.toFixed(1)} mm): seal partly below the annulus.` });
  if (!be && s.leafletCalcium === "severe" && !plan.predilatation)
    pvl.push({ points: 1, text: "Severe leaflet calcium without predilatation: the self-expanding frame may under-expand." });
  if (plan.postDilatation) pvl.push({ points: -2, text: "Post-dilatation improved frame expansion and apposition." });

  // ---- Embolisation / migration ----
  const emb: RiskFactor[] = [...under];
  if (depth < -2) emb.push({ points: 4, text: `Inflow ${Math.abs(depth).toFixed(1)} mm above the annulus: frame can be ejected into the aorta.` });
  else if (depth < 0) emb.push({ points: 2, text: "Inflow above the annular plane: little frame engages the annulus." });
  else if (depth < t.acceptable[0]) emb.push({ points: 1, text: "High implant: short engagement with the annulus." });
  else if (depth > t.acceptable[1] + 4) emb.push({ points: 1, text: "Very deep implant: risk of ventricular migration." });
  if (be && !plan.rapidPacing)
    emb.push({ points: 2, text: `Balloon inflated without rapid pacing: ejection pushed the valve about ${UNPACED_JUMP_MM} mm aortic.` });
  if (s.leafletCalcium === "mild" && under.length > 0)
    emb.push({ points: 1, text: "Little leaflet calcium to anchor an undersized frame." });

  // ---- Annular rupture ----
  const rup: RiskFactor[] = [];
  if (be) {
    if (os > 23) rup.push({ points: 2, text: `Area oversizing ${osTxt}, beyond the chart window, with a balloon-expandable valve.` });
    else if (os >= 15) rup.push({ points: 1, text: `Upper part of the area-oversizing window (${osTxt}) with a balloon-expandable valve.` });
    if (s.lvotCalcium === "severe") rup.push({ points: 2, text: "Severe LVOT calcium concentrates balloon force on the annulus." });
    else if (s.lvotCalcium === "moderate") rup.push({ points: 1, text: "Moderate LVOT calcium." });
  } else {
    if (s.lvotCalcium === "severe") rup.push({ points: 1, text: "Severe LVOT calcium (self-expanding frames apply less force, so risk is lower)." });
  }
  if (plan.postDilatation) {
    rup.push({ points: 1, text: "Post-dilatation adds radial force across the annulus." });
    if (be && (s.lvotCalcium === "severe" || s.lvotCalcium === "moderate"))
      rup.push({ points: 1, text: "Re-inflating a balloon-expandable frame against LVOT calcium." });
  }

  // ---- Coronary obstruction ----
  // SCCT 2019 consensus marker (docs/SIM_FACTS.md item 3): ostial height below
  // 12 mm together with a mean sinus diameter below 30 mm connotes increased
  // risk. No absolute height threshold is used beyond that.
  const cor: RiskFactor[] = [];
  const hMin = minCoronaryHeight(s);
  const which = lowerCoronary(s);
  if (hMin >= CORONARY_HEIGHT_FLAG_MM) {
    cor.push({ points: 0, text: `Coronary heights ≥${CORONARY_HEIGHT_FLAG_MM} mm (lowest ${hMin.toFixed(1)} mm): displaced leaflets are unlikely to reach the ostia.` });
  } else {
    cor.push({ points: 1, text: `Low ${which} height (${hMin.toFixed(1)} mm, below ${CORONARY_HEIGHT_FLAG_MM} mm).` });
    if (s.sinusDiameterMm < SINUS_FLAG_MM)
      cor.push({
        points: 2,
        text: `Narrow sinuses (mean ${s.sinusDiameterMm.toFixed(1)} mm, below ${SINUS_FLAG_MM} mm). A low ostium with narrow sinuses is the consensus marker of increased risk.`,
      });
    if (s.leafletCalcium === "severe") cor.push({ points: 1, text: "Long, bulky calcified leaflet can be pushed up in front of the ostium." });
    if (depth < 2) cor.push({ points: 1, text: "High implant pushes the native leaflet higher towards the ostium." });
    if (plan.predilatation)
      cor.push({ points: 0, text: "Balloon valvuloplasty with a simultaneous root injection shows whether the leaflet approaches the ostium." });
    cor.push({
      points: 0,
      text: "CT concept: VTC (virtual valve-to-coronary distance) models the gap between the displaced leaflet and the ostium. It is used mainly in valve-in-valve planning, where below 4 mm is flagged as high risk.",
    });
  }

  // ---- Conduction ----
  const con: RiskFactor[] = [];
  const dmsid = s.membranousSeptumMm - depth;
  if (depth > s.membranousSeptumMm)
    con.push({ points: 2, text: `Implant depth ${depth.toFixed(1)} mm exceeds membranous septum length ${s.membranousSeptumMm.toFixed(1)} mm (MS minus depth below zero).` });
  else if (dmsid < 2)
    con.push({ points: 1, text: `Depth within 2 mm of the membranous septum length (${s.membranousSeptumMm.toFixed(1)} mm).` });
  if (s.rbbb) con.push({ points: 2, text: "Pre-existing RBBB: a new left bundle injury gives complete heart block." });
  if (!be) con.push({ points: 1, text: "Self-expanding frame: sustained radial force on the conduction tissue." });
  if (depth > t.acceptable[1]) con.push({ points: 1, text: "Deep implant." });
  if ((be && os > 23) || (!be && os > 30)) con.push({ points: 1, text: "Oversizing beyond the chart window compresses the septal conduction tissue." });

  // ---- Gradient / PPM ----
  const gra: RiskFactor[] = [];
  const small = s.annulus.areaMm2 <= SMALL_ANNULUS_AREA;
  if (small && be) gra.push({ points: 2, text: `Small annulus (${s.annulus.areaMm2.toFixed(0)} mm², at or below this model's ${SMALL_ANNULUS_AREA} mm² teaching definition) with intra-annular leaflets.` });
  if (small && !be) gra.push({ points: 0, text: "Supra-annular leaflets sit above the small annulus, giving a larger effective orifice." });
  if (s.annulus.areaMm2 < VERY_SMALL_ANNULUS_AREA) gra.push({ points: 1, text: "Very small annulus (area-derived diameter about 21 mm or less)." });
  if (plan.sizeMm === VALVE_SIZES[plan.platform][0]) gra.push({ points: 1, text: "Smallest valve size of the platform." });
  if (small && s.bsaM2 >= 1.9) gra.push({ points: 1, text: `Large body size (BSA ${s.bsaM2.toFixed(2)} m²) for the annulus: mismatch more likely.` });
  if (!be && s.leafletCalcium === "severe" && !plan.predilatation) gra.push({ points: 1, text: "Possible frame under-expansion without predilatation." });
  if (!be && depth > t.acceptable[1]) gra.push({ points: 1, text: "Deep self-expanding implant loses part of the supra-annular advantage." });

  // ---- Vascular ----
  const vas: RiskFactor[] = [];
  if (plan.access === "alternative") {
    vas.push({ points: 2, text: "Alternative access avoids the iliofemoral axis but carries route-specific risks." });
  } else if (margin !== null) {
    if (margin < 0)
      vas.push({ points: 2, text: `MLD ${s.access.mldMm.toFixed(1)} mm is below the ${system.minVesselMm.toFixed(1)} mm minimum vessel diameter for the ${system.label}.` });
    else if (margin < 0.5)
      vas.push({ points: 1, text: `MLD ${s.access.mldMm.toFixed(1)} mm leaves less than 0.5 mm above the ${system.minVesselMm.toFixed(1)} mm minimum.` });
    if (s.access.calcification === "severe") vas.push({ points: 2, text: "Severe (circumferential) iliofemoral calcium: the vessel cannot stretch." });
    else if (s.access.calcification === "moderate") vas.push({ points: 1, text: "Moderate iliofemoral calcium." });
    if (s.access.tortuosity === "severe") vas.push({ points: 1, text: "Severe tortuosity." });
  }

  const risks: Record<TaviRiskKey, RiskItem> = {
    pvl: item("pvl", pvl),
    embolisation: item("embolisation", emb),
    rupture: item("rupture", rup),
    coronary: item("coronary", cor),
    conduction: item("conduction", con),
    gradient: item("gradient", gra),
    vascular: item("vascular", vas),
  };

  return { oversizingPct: os, depthMm: depth, depthBand: band, accessMarginMm: margin, system, inChart, risks };
}

// ---------------------------------------------------------------------------
// Simulated findings shown at the "assess" step (deterministic from levels)
// ---------------------------------------------------------------------------

export type PvlGrade = "none or trace" | "mild" | "moderate";

export function pvlGrade(level: RiskLevel): PvlGrade {
  return level === "high" ? "moderate" : level === "moderate" ? "mild" : "none or trace";
}

export interface Finding {
  key: TaviRiskKey;
  tone: "good" | "warn" | "danger";
  text: string;
}

export function taviFindings(s: TaviScenario, o: TaviOutcome): Finding[] {
  const r = o.risks;
  const f: Finding[] = [];
  const pg = pvlGrade(r.pvl.level);
  f.push({
    key: "pvl",
    tone: r.pvl.level === "high" ? "danger" : r.pvl.level === "moderate" ? "warn" : "good",
    text: `Root aortogram and TOE/TTE: ${pg} paravalvular regurgitation.`,
  });
  if (r.embolisation.level === "high")
    f.push({ key: "embolisation", tone: "danger", text: "The frame moved towards the aorta during release and sits unstable in the root." });
  else if (r.embolisation.level === "moderate")
    f.push({ key: "embolisation", tone: "warn", text: "The frame is stable but sits at the limit of safe engagement." });
  if (r.coronary.level === "high")
    f.push({ key: "coronary", tone: "danger", text: `ST change and hypotension: the ${lowerCoronary(s)} fills poorly on the root injection.` });
  else if (r.coronary.level === "moderate")
    f.push({ key: "coronary", tone: "warn", text: "Both coronaries fill, but the displaced leaflet lies close to the lower ostium." });
  if (r.rupture.level === "high")
    f.push({ key: "rupture", tone: "danger", text: "Sudden hypotension with a new pericardial effusion after balloon inflation." });
  if (r.conduction.level === "high")
    f.push({
      key: "conduction",
      tone: "danger",
      text: s.rbbb ? "Complete heart block on the monitor: pacing via the temporary wire." : "New LBBB with PR prolongation; high-grade AV block during release.",
    });
  else if (r.conduction.level === "moderate")
    f.push({ key: "conduction", tone: "warn", text: "New LBBB; observe on telemetry." });
  if (r.gradient.level === "high")
    f.push({ key: "gradient", tone: "warn", text: "Transvalvular gradient higher than expected for the valve size." });
  if (r.vascular.level === "high")
    f.push({ key: "vascular", tone: "danger", text: "Iliac dissection with contrast extravasation at sheath removal." });
  return f;
}

// ---------------------------------------------------------------------------
// Best plan search and scoring
// ---------------------------------------------------------------------------

function riskTotal(o: TaviOutcome): { levels: number; raw: number } {
  let levels = 0;
  let raw = 0;
  for (const k of RISK_ORDER) {
    levels += LEVEL_VALUE[o.risks[k].level];
    raw += o.risks[k].score;
  }
  return { levels, raw };
}

const DEPTH_GRID: number[] = Array.from({ length: 17 }, (_, i) => i * 0.5);

/**
 * Exhaustively searches the model for the lowest-risk plan (sum of risk levels,
 * then raw score, transfemoral preferred on ties). Used for the debrief and to
 * avoid penalising risks that the anatomy makes unavoidable.
 */
export function bestTaviPlan(s: TaviScenario): { plan: TaviPlan; outcome: TaviOutcome } {
  let best: { plan: TaviPlan; outcome: TaviOutcome; key: number[] } | null = null;
  for (const access of ["transfemoral", "alternative"] as AccessRoute[]) {
    for (const platform of ["balloon-expandable", "self-expanding"] as ValvePlatform[]) {
      for (const sizeMm of VALVE_SIZES[platform]) {
        for (const d of DEPTH_GRID) {
          for (const predilatation of [false, true]) {
            for (const postDilatation of [false, true]) {
              const plan: TaviPlan = {
                access,
                platform,
                sizeMm,
                targetDepthMm: d,
                finalDepthMm: d,
                predilatation,
                postDilatation,
                rapidPacing: true,
                coronaryProtection: false,
              };
              const outcome = assessTavi(s, plan);
              const t = riskTotal(outcome);
              const key = [
                t.levels,
                t.raw,
                access === "transfemoral" ? 0 : 1,
                outcome.inChart ? 0 : 1,
                predilatation ? 1 : 0,
                postDilatation ? 1 : 0,
                Math.abs(d - DEPTH_TARGET[platform].ideal[0] - 1),
              ];
              if (!best || lexLess(key, best.key)) best = { plan, outcome, key };
            }
          }
        }
      }
    }
  }
  const b = best!;
  b.plan.coronaryProtection = b.outcome.risks.coronary.level === "high";
  return { plan: b.plan, outcome: b.outcome };
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i] - 1e-9) return true;
    if (a[i] > b[i] + 1e-9) return false;
  }
  return false;
}

export interface Deduction {
  points: number;
  reason: string;
}

export interface TaviScore {
  score: number;
  deductions: Deduction[];
}

/** The learner's response to the post-deployment course, scored with the plan (scoreTavi). */
export interface TaviResponse {
  course: TaviCourse;
  actions: CourseActions;
  /** course time at which the learner ended the assess step, s */
  endS: number;
  /** false when the case opened with the valve deployed (TaviScenario.deployed): the plan is not scored */
  planByLearner?: boolean;
}

/**
 * Score 0–100. Risks are penalised only above the lowest level this anatomy
 * allows in the model, so inherent risks are taught rather than punished.
 * `pvlBeforePostDil` is the PVL level seen at assessment, before the decision.
 * `response` adds the deductions for the response to the post-deployment course
 * (scoreTaviCourse): they score only what was done after deployment, so a high
 * coronary risk that the plan already paid for is not penalised again.
 */
export function scoreTavi(s: TaviScenario, plan: TaviPlan, pvlBeforePostDil?: RiskLevel, response?: TaviResponse): TaviScore {
  const o = assessTavi(s, plan);
  const d: Deduction[] = [];
  if (response?.planByLearner !== false) d.push(...planDeductions(s, plan, o));
  if (pvlBeforePostDil) {
    if (plan.postDilatation && pvlBeforePostDil === "low")
      d.push({ points: 5, reason: "Post-dilatation without significant PVL adds rupture risk for no gain." });
    if (!plan.postDilatation && pvlBeforePostDil === "high")
      d.push({ points: 8, reason: "Moderate PVL accepted without considering post-dilatation." });
  }
  if (response) d.push(...scoreTaviCourse(response.course, response.actions, response.endS).deductions);
  const total = d.reduce((a, b) => a + b.points, 0);
  return { score: Math.max(0, Math.min(100, Math.round(100 - total))), deductions: d };
}

/** The deductions for the plan itself: choices made before the valve was released. */
function planDeductions(s: TaviScenario, plan: TaviPlan, o: TaviOutcome): Deduction[] {
  const best = bestTaviPlan(s).outcome;
  const d: Deduction[] = [];
  const excess = riskTotal(o).levels - riskTotal(best).levels;
  if (excess > 0) {
    const higher = RISK_ORDER.filter((k) => LEVEL_VALUE[o.risks[k].level] > LEVEL_VALUE[best.risks[k].level]).map(
      (k) => `${RISK_LABEL[k].toLowerCase()} ${o.risks[k].level} vs ${best.risks[k].level}`
    );
    d.push({
      points: excess * 9,
      reason: `Overall risk above the lowest-risk plan this anatomy allows in the model (${higher.join("; ")}).`,
    });
  }
  if (!o.inChart) d.push({ points: 6, reason: "Valve size outside the teaching chart range for this annulus." });
  if (plan.access === "alternative") {
    const tf = assessTavi(s, { ...plan, access: "transfemoral" });
    if (tf.risks.vascular.level === "low") d.push({ points: 8, reason: "Alternative access chosen although transfemoral access was suitable." });
  }
  if (plan.platform === "balloon-expandable" && !plan.rapidPacing)
    d.push({ points: 10, reason: "Balloon-expandable valve deployed without rapid pacing." });
  if (Math.abs(plan.finalDepthMm - plan.targetDepthMm) > 2)
    d.push({ points: 4, reason: `Final depth ${plan.finalDepthMm.toFixed(1)} mm missed the planned ${plan.targetDepthMm.toFixed(1)} mm by more than 2 mm.` });
  if (o.risks.coronary.level === "high" && !plan.coronaryProtection)
    d.push({ points: 10, reason: "High coronary obstruction risk without planned coronary protection." });
  if (o.risks.coronary.level === "low" && plan.coronaryProtection)
    d.push({ points: 3, reason: "Coronary protection used without a coronary risk: unnecessary instrumentation." });
  return d;
}

// ---------------------------------------------------------------------------
// Teaching cases (synthetic)
// ---------------------------------------------------------------------------

export const TAVI_SCENARIOS: TaviScenario[] = [
  {
    id: "tavi-standard",
    title: "Tricuspid AS, straightforward anatomy",
    vignette:
      "Synthetic teaching case. 81-year-old man, symptomatic severe tricuspid AS, Heart Team recommends transfemoral TAVI. No conduction disease.",
    age: 81,
    sex: "M",
    bsaM2: 1.86,
    lvefPct: 55,
    bicuspid: false,
    annulus: { areaMm2: 467, perimeterMm: 77.6, minDiameterMm: 22.2, maxDiameterMm: 26.8 },
    lvotCalcium: "none",
    leafletCalcium: "moderate",
    coronaryHeightLeftMm: 14.2,
    coronaryHeightRightMm: 16.8,
    sinusDiameterMm: 32.5,
    stjDiameterMm: 28.4,
    membranousSeptumMm: 7.5,
    rbbb: false,
    access: { mldMm: 7.4, calcification: "mild", tortuosity: "mild" },
    focus: "Read area and perimeter, use the right metric for the platform, and land at the ideal depth.",
    teachingPoints: [
      "Balloon-expandable valves are sized by area, self-expanding valves by perimeter.",
      "The perimeter-derived diameter is always at least the area-derived diameter for the same contour.",
      "Aim for the ideal depth band; both too high and too deep cause paravalvular leak.",
    ],
  },
  {
    id: "tavi-small-annulus",
    title: "Small annulus, larger patient",
    vignette:
      "Synthetic teaching case. 78-year-old woman, BSA 1.95 m², severe AS. Small annulus that sits between two balloon-expandable sizes.",
    age: 78,
    sex: "F",
    bsaM2: 1.95,
    lvefPct: 60,
    bicuspid: false,
    annulus: { areaMm2: 341, perimeterMm: 66.3, minDiameterMm: 19.0, maxDiameterMm: 22.8 },
    lvotCalcium: "mild",
    leafletCalcium: "moderate",
    coronaryHeightLeftMm: 12.4,
    coronaryHeightRightMm: 14.0,
    sinusDiameterMm: 29.5,
    stjDiameterMm: 25.6,
    membranousSeptumMm: 6.5,
    rbbb: false,
    access: { mldMm: 5.9, calcification: "mild", tortuosity: "mild" },
    focus: "Patient–prosthesis mismatch: where the leaflets sit matters more than the frame size in a small annulus.",
    teachingPoints: [
      "In a small annulus, supra-annular leaflets give a larger effective orifice and lower gradients.",
      "Stepping up a balloon-expandable size to avoid a high gradient trades one risk for annular rupture.",
      "Mismatch depends on the effective orifice relative to body size, not on the label size alone.",
    ],
  },
  {
    id: "tavi-low-coronary",
    title: "Low left main, narrow sinuses",
    vignette:
      "Synthetic teaching case. 84-year-old woman, severe AS with a long, bulky calcified left coronary leaflet. Left main ostium is low.",
    age: 84,
    sex: "F",
    bsaM2: 1.62,
    lvefPct: 58,
    bicuspid: false,
    annulus: { areaMm2: 398, perimeterMm: 71.6, minDiameterMm: 20.6, maxDiameterMm: 24.6 },
    lvotCalcium: "mild",
    leafletCalcium: "severe",
    coronaryHeightLeftMm: 8.6,
    coronaryHeightRightMm: 12.8,
    sinusDiameterMm: 27.6,
    stjDiameterMm: 25.0,
    membranousSeptumMm: 7.0,
    rbbb: false,
    access: { mldMm: 6.2, calcification: "moderate", tortuosity: "mild" },
    focus: "Coronary obstruction: height, sinus width and leaflet bulk together, and planning protection.",
    teachingPoints: [
      "Low coronary height, narrow sinuses and bulky leaflets together predict obstruction better than any one alone.",
      "When risk remains high, plan protection (a wire, with or without an undeployed stent, in the threatened artery) before deployment.",
      "Leaflet modification techniques and alternative strategies exist for selected anatomy; they are Heart Team decisions.",
    ],
  },
  {
    id: "tavi-bicuspid-lvot",
    title: "Bicuspid valve with LVOT calcium",
    vignette:
      "Synthetic teaching case. 74-year-old man, type 1 bicuspid valve with a calcified raphe and a severe calcium nodule extending into the LVOT. Surgical opinion obtained; TAVI chosen by the Heart Team.",
    age: 74,
    sex: "M",
    bsaM2: 1.98,
    lvefPct: 50,
    bicuspid: true,
    annulus: { areaMm2: 490, perimeterMm: 80.0, minDiameterMm: 21.8, maxDiameterMm: 28.6 },
    lvotCalcium: "severe",
    leafletCalcium: "moderate",
    coronaryHeightLeftMm: 15.0,
    coronaryHeightRightMm: 17.5,
    sinusDiameterMm: 34.0,
    stjDiameterMm: 31.2,
    membranousSeptumMm: 8.0,
    rbbb: false,
    access: { mldMm: 7.0, calcification: "mild", tortuosity: "moderate" },
    focus: "Annular rupture: the interaction between balloon-expandable oversizing, LVOT calcium and post-dilatation.",
    teachingPoints: [
      "LVOT calcium combined with balloon-expandable oversizing is the classical setting for annular rupture.",
      "Post-dilatation reduces paravalvular leak but adds force across the same calcium.",
      "Bicuspid annuli are more elliptical; frames may expand asymmetrically.",
    ],
  },
  {
    id: "tavi-conduction",
    title: "Pre-existing RBBB, short membranous septum",
    vignette:
      "Synthetic teaching case. 82-year-old man with RBBB and first-degree AV block on the baseline ECG, LVEF 40%. Membranous septum is short on CT.",
    age: 82,
    sex: "M",
    bsaM2: 1.92,
    lvefPct: 40,
    bicuspid: false,
    annulus: { areaMm2: 511, perimeterMm: 81.1, minDiameterMm: 23.4, maxDiameterMm: 27.8 },
    lvotCalcium: "mild",
    leafletCalcium: "moderate",
    coronaryHeightLeftMm: 13.6,
    coronaryHeightRightMm: 16.2,
    sinusDiameterMm: 33.4,
    stjDiameterMm: 29.8,
    membranousSeptumMm: 3.0,
    rbbb: true,
    access: { mldMm: 7.1, calcification: "mild", tortuosity: "none" },
    focus: "Conduction: implant depth relative to the membranous septum, and the meaning of pre-existing RBBB.",
    teachingPoints: [
      "The left bundle emerges below the membranous septum; a frame deeper than the septum length compresses it.",
      "With pre-existing RBBB, a new left bundle injury means complete heart block: plan pacing and monitoring.",
      "Shallow implantation lowers conduction risk but too high risks embolisation and leak.",
    ],
  },
  {
    id: "tavi-hostile-access",
    title: "Hostile iliofemoral access",
    vignette:
      "Synthetic teaching case. 76-year-old man with peripheral arterial disease. Narrow, circumferentially calcified external iliac arteries on both sides.",
    age: 76,
    sex: "M",
    bsaM2: 1.80,
    lvefPct: 52,
    bicuspid: false,
    annulus: { areaMm2: 377, perimeterMm: 69.8, minDiameterMm: 20.0, maxDiameterMm: 24.0 },
    lvotCalcium: "mild",
    leafletCalcium: "moderate",
    coronaryHeightLeftMm: 12.6,
    coronaryHeightRightMm: 15.0,
    sinusDiameterMm: 30.4,
    stjDiameterMm: 27.0,
    membranousSeptumMm: 6.0,
    rbbb: false,
    access: { mldMm: 4.6, calcification: "severe", tortuosity: "moderate" },
    focus: "Access: compare the minimal luminal diameter with the delivery system's minimum vessel diameter before the day.",
    teachingPoints: [
      "A sheath larger than a circumferentially calcified vessel risks rupture or dissection.",
      "Change the route, or prepare the vessel, as a planned decision rather than a bail-out.",
      "Transfemoral remains the default when it is feasible.",
    ],
  },
  {
    // hb-tavi#5: the coronary obstruction scenario. It opens at the assess step with a
    // balloon-expandable valve just released in a low, narrow root without protection (the
    // root was misjudged), so the post-deployment course (taviCourse) shows what obstruction does.
    // The features follow lesson hb-tavi-coronary (Ribeiro's registry, Brilakis 29.1): an older
    // woman, no previous bypass grafts, a balloon-expandable valve, a low left ostium and a narrow
    // sinus. The anatomy is synthetic.
    id: "tavi-coronary-obstruction",
    title: "Hypotension after valve deployment",
    vignette:
      "Synthetic teaching case. 83-year-old woman, no previous bypass surgery, severe AS with bulky leaflet calcium. A balloon-expandable valve has just been released under rapid pacing; the pigtail is still in the non-coronary cusp.",
    age: 83,
    sex: "F",
    bsaM2: 1.58,
    lvefPct: 55,
    bicuspid: false,
    annulus: { areaMm2: 380, perimeterMm: 69.8, minDiameterMm: 20.2, maxDiameterMm: 24.0 },
    lvotCalcium: "mild",
    leafletCalcium: "severe",
    coronaryHeightLeftMm: 9.2,
    coronaryHeightRightMm: 13.5,
    sinusDiameterMm: 27.0,
    stjDiameterMm: 24.6,
    membranousSeptumMm: 6.5,
    rbbb: false,
    access: { mldMm: 6.8, calcification: "mild", tortuosity: "mild" },
    focus: "Recognise persistent hypotension with ECG change after deployment, inject the root at once and start the rescue without waiting.",
    teachingPoints: [
      "Persistent hypotension and ECG change after deployment are the commonest presentations of coronary obstruction, usually of the left coronary.",
      "The pigtail is already in the root: a root injection answers the question in seconds. Waiting for 'pacing recovery' loses time.",
      "Say before deployment who injects the root, who opens the PCI kit and who calls the surgeon. Obstruction kills through delay.",
    ],
    deployed: {
      access: "transfemoral",
      platform: "balloon-expandable",
      sizeMm: 23,
      targetDepthMm: 3,
      finalDepthMm: 3,
      predilatation: false,
      postDilatation: false,
      rapidPacing: true,
      coronaryProtection: false,
    },
  },
];

export function taviScenarioById(id: string): TaviScenario | undefined {
  return TAVI_SCENARIOS.find((s) => s.id === id);
}

export function defaultTaviPlan(): TaviPlan {
  return {
    access: "transfemoral",
    platform: "balloon-expandable",
    sizeMm: 26,
    targetDepthMm: 3,
    finalDepthMm: 3,
    predilatation: false,
    postDilatation: false,
    rapidPacing: false,
    coronaryProtection: false,
  };
}

// ---------------------------------------------------------------------------
// Post-deployment course (structural-tips-and-tavi-course)
//
// A LABELLED TEACHING MODEL of the first minutes after the valve is released:
// arterial pressure, heart rate, rhythm and ST shift second by second, driven
// by the outcome's risk levels and by what the operator does. It is not a
// haemodynamic simulation and makes no claim about real time courses.
//
// What it shows, and where that comes from:
//   - coronary obstruction (coronary risk high): the pressure stays low after
//     pacing stops and falls further, ST rises in the territory of the
//     covered coronary, and a root injection shows that coronary not filling.
//     Lesson hb-tavi-coronary (Ribeiro's registry, Brilakis 29.1): obstruction
//     presents as persistent severe hypotension (68.2%) and ECG change (56.8%),
//     the left coronary was involved in 88.6%, and "obstruction kills through
//     delay"; its check question asks for a root injection at once rather than
//     waiting for pacing recovery. Calling the rescue (PCI team and surgeon)
//     restores flow after a delay; until then nothing improves.
//   - complete heart block (conduction risk high with pre-existing RBBB):
//     taviFindings' "complete heart block on the monitor", now shown on the
//     monitor itself; pacing through the temporary wire restores the rate
//     (tip structural-tavi-pacing-wire-decision, Oxford ch 9).
//   - annular rupture (rupture risk high): a falling pressure with both
//     coronaries filling (taviFindings: hypotension with a new effusion). A
//     post-dilatation at the assess step that raises the risk to high starts
//     this course from the moment of the post-dilatation.
// Every number in COURSE is a MODEL PARAMETER chosen for teaching, not a
// value from the sources.
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the post-deployment course (none is from a source). */
export const COURSE = {
  /** length of the modelled course, s */
  durationS: 360,
  /** sampling step, s */
  stepS: 1,
  /** resting mean arterial pressure and pulse pressure, mmHg; resting heart rate, bpm */
  baselineMap: 85,
  baselinePulse: 50,
  baselineHr: 72,
  /** rapid pacing still running when the course starts (balloon-expandable deployment with pacing), s */
  rapidPacingTailS: 5,
  /** rate and mean pressure during rapid pacing */
  rapidPacingHr: 180,
  rapidPacingMap: 45,
  /** mean pressure at release when no pacing was used */
  unpacedStartMap: 70,
  /** time constant of the pressure's return towards its target, s */
  recoveryTauS: 6,
  /** obstruction: plateau of the mean pressure after pacing, its fall per second and its floor, mmHg */
  obstructionMap: 55,
  obstructionFallPerS: 0.05,
  obstructionFloorMap: 35,
  /** obstruction: ST shift reached in the territory of the covered coronary, mm, and its time constant, s */
  obstructionStMm: 2.5,
  stRiseTauS: 15,
  /** after reflow: the mean pressure the patient settles at, its time constant, and the ST resolution time constant, s */
  reflowMap: 78,
  reflowTauS: 20,
  stResolveTauS: 8,
  /** rescue: from calling the PCI team and surgeon to restored flow, s; shorter with a protection wire already in the artery */
  rescueReflowS: 90,
  rescueReflowProtectedS: 45,
  /** complete heart block: onset after pacing stops, escape rate, mean pressure; the paced rate */
  chbOnsetS: 8,
  chbEscapeHr: 38,
  chbMap: 58,
  pacedHr: 70,
  /** atrial rate shown on the monitor in complete heart block, bpm */
  chbAtrialHr: 80,
  /** annular rupture: the falling pressure (start, fall per second, floor), mmHg */
  ruptureMap: 62,
  ruptureFallPerS: 0.08,
  ruptureFloorMap: 40,
  /** beat-to-beat noise on the mean pressure, ± mmHg */
  noiseMmHg: 1,
} as const;

/**
 * Response timings the course scores (MODEL PARAMETERS). The lesson's own wording is "inject the root
 * at once" (hb-tavi-coronary, check question) and the request asks for a root injection within the
 * first minute (hb-tavi#5).
 */
export const COURSE_RESPONSE = {
  /** root injection after pacing stops, s */
  injectWithinS: 60,
  /** rescue called after the injection, s */
  rescueWithinS: 60,
  /** pacing started after the onset of complete heart block, s */
  paceWithinS: 60,
  /** a mean pressure below this counts as hypotension (the same value as hypotensionMapMmHg in src/ui/lab/patientEvents.ts, a MODEL PARAMETER there) */
  lowMapMmHg: 65,
  /** ... held for at least this long, s (the same value as hypotensionHoldS there) */
  lowMapHoldS: 10,
  /** ischaemic time bands for the debrief's outcome text, s */
  ischaemiaRecoveredS: 180,
  ischaemiaImpairedS: 360,
} as const;

export type CourseRhythm = "rapid-pacing" | "sinus" | "chb" | "paced";

/** One moment of the course: what the monitor and a root injection would show. */
export interface CourseSample {
  /** course time, s (0 = the valve released) */
  t: number;
  sys: number;
  dia: number;
  map: number;
  hr: number;
  rhythm: CourseRhythm;
  /** ST shift in the territory of the covered coronary, mm (positive = elevation) */
  stMm: number;
  /** whether each coronary fills on a root injection now */
  leftFills: boolean;
  rightFills: boolean;
}

/** What the operator did during the course, in course time (s); null or absent: not done. */
export interface CourseActions {
  /** the first root injection */
  rootInjectionS?: number | null;
  /** rescue PCI and the surgeon called */
  rescueS?: number | null;
  /** pacing started through the temporary wire */
  pacingS?: number | null;
  /** post-dilatation completed at the assess step (the valve was released without it) */
  postDilatationS?: number | null;
}

export interface TaviCourse {
  durationS: number;
  /** when rapid pacing stops (0 when none was running), s */
  pacingEndS: number;
  /** the coronary the displaced leaflet covers in this course, or null */
  obstruction: "left" | "right" | null;
  /** when flow returns after a rescue, s (null: not in this course) */
  reflowS: number | null;
  /** onset of complete heart block, s (null: none) */
  chbS: number | null;
  rupture: boolean;
  /** when the rupture course begins, s: when pacing stops for a valve released with a high rupture
   *  risk, or when post-dilatation at the assess step raised that risk to high (null: no rupture) */
  ruptureS: number | null;
  /** the monitor lead that carries the ST shift: V5 for the left coronary, II for the right */
  stLead: "II" | "V5";
  samples: CourseSample[];
}

/** A deterministic random source for a course (mulberry32 on the scenario id). */
export function courseRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0 || 0x9e3779b9;
  return () => {
    let t = (state = (state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lag = (x: number, target: number, tauS: number, dt: number) => x + (target - x) * (1 - Math.exp(-dt / tauS));

/**
 * The post-deployment course for a released valve: `plan` as deployed and `outcome` its assessment
 * (assessTavi). `rng` gives the beat-to-beat noise (default: seeded by the scenario id, so the course
 * is reproducible); `actions` are what the operator has done so far. The course is recomputed when an
 * action is added; samples before the action do not change.
 */
export function taviCourse(s: TaviScenario, plan: TaviPlan, outcome: TaviOutcome, rng: () => number = courseRng(s.id), actions: CourseActions = {}): TaviCourse {
  const C = COURSE;
  const pacingEndS = plan.rapidPacing ? C.rapidPacingTailS : 0;
  const obstruction: TaviCourse["obstruction"] = outcome.risks.coronary.level === "high" ? (lowerCoronary(s) === "left main" ? "left" : "right") : null;
  const rescueAt = actions.rescueS ?? null;
  const reflowS = obstruction && rescueAt !== null ? Math.max(rescueAt, pacingEndS) + (plan.coronaryProtection ? C.rescueReflowProtectedS : C.rescueReflowS) : null;
  const chbS = outcome.risks.conduction.level === "high" && s.rbbb ? pacingEndS + C.chbOnsetS : null;
  // a post-dilatation at the assess step that raises the rupture risk to high starts the rupture
  // course from that moment, so the samples before it do not change
  const postDilAt = actions.postDilatationS ?? null;
  const ruptureS =
    outcome.risks.rupture.level === "high"
      ? pacingEndS
      : !plan.postDilatation && postDilAt !== null && assessTavi(s, { ...plan, postDilatation: true }).risks.rupture.level === "high"
      ? Math.max(postDilAt, pacingEndS)
      : null;
  const rupture = ruptureS !== null;
  const pacedAt = actions.pacingS ?? null;

  const samples: CourseSample[] = [];
  let map: number = plan.rapidPacing ? C.rapidPacingMap : C.unpacedStartMap;
  let st = 0;
  const dt = C.stepS;
  for (let t = 0; t <= C.durationS + 1e-9; t += dt) {
    const noise = (rng() * 2 - 1) * C.noiseMmHg;
    let hr: number = C.baselineHr;
    let rhythm: CourseRhythm = "sinus";
    const occluded = !!obstruction && (reflowS === null || t < reflowS);
    if (t < pacingEndS) {
      rhythm = "rapid-pacing";
      hr = C.rapidPacingHr;
      map = C.rapidPacingMap;
    } else {
      const since = t - pacingEndS;
      let target: number = C.baselineMap;
      let tau: number = C.recoveryTauS;
      if (occluded) target = Math.max(C.obstructionFloorMap, C.obstructionMap - C.obstructionFallPerS * since);
      else if (obstruction && reflowS !== null) {
        target = C.reflowMap;
        tau = C.reflowTauS;
      }
      if (chbS !== null && t >= chbS) {
        if (pacedAt !== null && t >= pacedAt) {
          rhythm = "paced";
          hr = C.pacedHr;
        } else {
          rhythm = "chb";
          hr = C.chbEscapeHr;
          target = Math.min(target, C.chbMap);
        }
      }
      if (ruptureS !== null && t >= ruptureS) target = Math.min(target, Math.max(C.ruptureFloorMap, C.ruptureMap - C.ruptureFallPerS * (t - ruptureS)));
      map = lag(map, target, tau, dt);
      st = occluded ? lag(st, C.obstructionStMm, C.stRiseTauS, dt) : lag(st, 0, C.stResolveTauS, dt);
    }
    const m = map + noise;
    const pp = C.baselinePulse * Math.max(0.4, m / C.baselineMap) * (rhythm === "chb" ? 1.3 : 1);
    samples.push({
      t,
      sys: m + (2 * pp) / 3,
      dia: m - pp / 3,
      map: m,
      hr,
      rhythm,
      stMm: st,
      leftFills: !(occluded && obstruction === "left"),
      rightFills: !(occluded && obstruction === "right"),
    });
  }
  return { durationS: C.durationS, pacingEndS, obstruction, reflowS, chbS, rupture, ruptureS, stLead: obstruction === "right" ? "II" : "V5", samples };
}

/** The course at time t (s): the sample at or before t, held after the end of the course. */
export function courseAt(c: TaviCourse, t: number): CourseSample {
  const i = Math.max(0, Math.min(c.samples.length - 1, Math.floor(t / COURSE.stepS + 1e-9)));
  return c.samples[i];
}

/** The ST shift in a monitor lead (the course carries it in one lead, see TaviCourse.stLead). */
export function stInLead(c: TaviCourse, sample: CourseSample, lead: "II" | "V5"): number {
  return lead === c.stLead ? sample.stMm : 0;
}

export interface CourseScore {
  deductions: Deduction[];
  /** from pacing stopping to restored flow (or the end of the case), s; null without obstruction */
  ischaemicS: number | null;
  /** the outcome of the course in this model, for the debrief */
  outcome: string;
}

/**
 * The response to the course, scored on what was done after deployment only (the plan is scored by
 * scoreTavi): in obstruction, a root injection within COURSE_RESPONSE.injectWithinS of pacing
 * stopping and a rescue called within COURSE_RESPONSE.rescueWithinS of it; in complete heart block,
 * pacing through the temporary wire within COURSE_RESPONSE.paceWithinS; a rescue called with the
 * coronaries filling and no hypotension costs a little. `endS` is when the learner left the assess
 * step; actions after it do not count.
 */
export function scoreTaviCourse(c: TaviCourse, actions: CourseActions, endS: number): CourseScore {
  const R = COURSE_RESPONSE;
  const done = (x: number | null | undefined) => (typeof x === "number" && x <= endS ? x : null);
  const inj = done(actions.rootInjectionS);
  const rescue = done(actions.rescueS);
  const paced = done(actions.pacingS);
  const d: Deduction[] = [];
  let ischaemicS: number | null = null;
  let outcome = "The pressure recovered once pacing stopped.";

  if (c.obstruction) {
    const which = c.obstruction === "left" ? "left coronary" : "right coronary";
    if (inj === null) d.push({ points: 15, reason: "No root injection while the pressure stayed low after pacing: the covered coronary was not looked for." });
    else {
      const late = inj - c.pacingEndS;
      if (late > R.injectWithinS) {
        const points = late > 3 * R.injectWithinS ? 15 : late > 2 * R.injectWithinS ? 10 : 5;
        d.push({ points, reason: `Root injection ${Math.round(late)} s after pacing stopped; persistent hypotension with ECG change calls for it at once.` });
      }
    }
    if (rescue === null) d.push({ points: 15, reason: `Rescue PCI and the surgeon were not called for the ${which} that did not fill.` });
    else {
      const from = inj ?? c.pacingEndS;
      if (rescue - from > R.rescueWithinS)
        d.push({ points: 8, reason: `Rescue called ${Math.round(rescue - from)} s after the ${inj !== null ? "root injection" : "pressure fell"}: waiting for pacing recovery loses time.` });
    }
    const reflow = c.reflowS !== null && c.reflowS <= endS ? c.reflowS : null;
    ischaemicS = (reflow ?? endS) - c.pacingEndS;
    outcome =
      reflow === null
        ? `The ${which} was still covered when the case ended: in this model the patient deteriorates towards arrest.`
        : ischaemicS <= R.ischaemiaRecoveredS
        ? `Flow in the ${which} was restored ${Math.round(ischaemicS)} s after pacing stopped: in this model the ventricle recovers.`
        : ischaemicS <= R.ischaemiaImpairedS
        ? `Flow in the ${which} was restored late (${Math.round(ischaemicS)} s): in this model ventricular function is left impaired.`
        : `Flow in the ${which} was restored very late (${Math.round(ischaemicS)} s): in this model the patient arrested before reflow.`;
  } else if (rescue !== null) {
    let since: number | null = null;
    let lowSeen = false;
    for (const x of c.samples) {
      if (x.t < c.pacingEndS || x.t > endS) continue;
      if (x.map >= R.lowMapMmHg) since = null;
      else if ((since ??= x.t) !== null && x.t - since >= R.lowMapHoldS) lowSeen = true;
    }
    if (!lowSeen) d.push({ points: 3, reason: "Rescue PCI called with a stable pressure and no sign of a covered coronary." });
  }

  // the block counts once it has appeared on the monitor: leaving the assess step with it unpaced is
  // a miss, as is pacing later than paceWithinS after its onset
  const chbMissed = c.chbS !== null && endS >= c.chbS && (paced === null || paced - c.chbS > R.paceWithinS);
  if (chbMissed) {
    d.push({ points: 6, reason: "Complete heart block was not paced through the temporary wire within a minute." });
    if (!c.obstruction) outcome = "Complete heart block after release; the rate depended on the temporary wire.";
  }
  if (c.rupture && !c.obstruction) outcome = "The pressure kept falling with both coronaries filling: think of bleeding, including annular rupture and the access site.";
  return { deductions: d, ischaemicS, outcome };
}
