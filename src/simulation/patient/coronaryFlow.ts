// ---------------------------------------------------------------------------
// Per-vessel coronary flow from the rendered coronary tree.
//
// coronaryFlowFor(tree, lesions) turns the S3b TreeVessel tree into a flow
// network the patient engine and the contrast transport (S5) share:
//
// 1. Resting flow distribution. Flow at each healthy sample scales with the
//    reference radius to the 7/3 power (Huo-Kassab scaling, as used for side-
//    branch leakage in 1D coronary flow models; facts S9 §flow). The drop in
//    flow along a vessel that is not explained by its explicit children is the
//    flow taken by the myocardium attached to that stretch ("leak"). Leaks are
//    normalised so the whole tree conserves mass and each ostium carries
//    REF_FLOW × (r/1.5 mm)^(7/3). REF_FLOW is the 1.0 mL/s at 3.0 mm already
//    used as RESTING_FLOW in physiology.ts (MODEL PARAMETER).
// 2. Regions. Leaks are grouped into myocardial regions (twigs; 20 mm chunks of
//    named vessels). Each region has a resting demand, a territory, an RV flag
//    and a direction from the heart centre (Frank lead axes), so ischaemia in a
//    region becomes an ST vector that points at the real anatomy of this
//    patient.
// 3. Fixed lesions. Each stenosis gets a CoronaryCase (physiology.ts) built
//    from the TreeVessel reference radius at the lesion, the downstream length
//    and the flow it carries; physiology.flow() gives the resting and maximal
//    flow through it. A region's supply capacity is the product over lesions on
//    its upstream path (serial lesions on different vessels are treated as
//    independent: an approximation).
//    Only an acute (thrombotic) occlusion stops flow. A chronic total or
//    subtotal occlusion and a chronic severe stenosis recruit collaterals, so
//    resting demand is met and ischaemia appears only when demand rises or
//    hyperaemia steals collateral flow (subendocardial, ST depression).
// 4. Dynamic modifiers (balloon occlusion, wedged catheter, spasm, no-reflow)
//    are applied by the engine through supplyFor().
// ---------------------------------------------------------------------------

import type { Lesion, VesselId } from "../../types";
import type { CoronaryTree, TreeVessel } from "../../render/xray/coronaryTree";
import { samplePos } from "../../render/xray/coronaryTree";
import { flow as wireFlow, compression, aorticPressure, type CoronaryCase } from "../physiology";

export type Territory = "LAD" | "LCx" | "RCA";

/** Reference resting flow at a 3.0 mm vessel (MODEL PARAMETER, matches physiology.ts RESTING_FLOW). */
export const REF_FLOW_ML_S = 1.0;
export const REF_RADIUS_MM = 1.5;
/** Huo-Kassab flow-diameter exponent (facts S9 §flow). */
export const HK_EXPONENT = 7 / 3;
/** Default coronary flow reserve of a normal microcirculation (MODEL PARAMETER; physiology.ts cases use 3.2-3.6). */
export const DEFAULT_CFR = 3.5;
/** Region chunk length along named vessels (mm, MODEL PARAMETER). */
const REGION_MM = 20;
/** CTO: collateral supply as a fraction of normal maximal flow (MODEL PARAMETER). Resting flow is held. */
export const CTO_COLLATERAL_HYP = 0.35;
/**
 * Chronic stenosis: collateral recruitment starts at this diameter stenosis (%) and rises linearly
 * to CTO_COLLATERAL_HYP at MP_COLLATERAL_FULL (MODEL PARAMETERS). Collateral flow adds to the
 * antegrade maximal flow through the lesion.
 */
export const MP_COLLATERAL_START = 70;
export const MP_COLLATERAL_FULL = 95;
/**
 * Coronary steal: fraction of the collateral-dependent capacity lost at maximal hyperaemia, because
 * the donor bed dilates and lowers the pressure driving the collaterals (MODEL PARAMETER).
 */
export const MP_COLLATERAL_STEAL = 0.5;
/**
 * Chronic (non-thrombotic) disease never leaves a region with less maximal capacity than this
 * multiple of its resting demand: myocardium behind a chronic flow-limiting lesion has either
 * recruited collaterals or reduced its demand, so a stable patient is not ischaemic at rest
 * (MODEL PARAMETER; the shortfall is credited to collaterals and is subject to steal).
 */
export const MP_CHRONIC_REST_RESERVE = 1.3;

/** Collateral supply (fraction of normal maximal flow) recruited by a chronic lesion. */
export function collateralFor(severity: number, kind?: string): number {
  if (kind === "thrombotic") return 0;
  const x = (severity - MP_COLLATERAL_START) / (MP_COLLATERAL_FULL - MP_COLLATERAL_START);
  return CTO_COLLATERAL_HYP * Math.max(0, Math.min(1, x));
}

/** True when a lesion is an acute occlusion with no antegrade or collateral flow. */
export function isAcuteOcclusion(L: Lesion): boolean {
  return L.kind === "thrombotic" && L.severity >= 99;
}

export interface PathPoint {
  vessel: string;
  /** index on that vessel where flow leaves it towards the region (or the region's first sample) */
  index: number;
  param: number;
}

export interface FlowRegion {
  id: number;
  vessel: string;
  side: "left" | "right";
  territory: Territory;
  /** right-ventricular myocardium (RV branches, proximal RCA, conus, acute marginal) */
  rv: boolean;
  i0: number;
  i1: number;
  /** vessel param at the first and last sample of the region */
  p0: number;
  p1: number;
  /** resting demand, mL/s */
  demand: number;
  /** unit vector from the heart centre to the region, Frank axes (x left, y inferior, z posterior) */
  dir: [number, number, number];
  /** upstream path from the ostium to the region */
  path: PathPoint[];
  /** fraction of resting demand supplied at rest through the fixed lesions (≤ 1) */
  restFactor: number;
  /** maximal (hyperaemic) flow through the fixed lesions as a fraction of normal maximal flow */
  hypFactor: number;
  /** share of the maximal flow that arrives through collaterals (0..1); optional for older callers */
  collateral?: number;
  /** indices (into the lesions passed to the builder) of the fixed lesions upstream of this region */
  lesionIdx?: number[];
}

export interface VesselFlow {
  name: string;
  fillId: VesselId;
  lesionId: VesselId | null;
  side: "left" | "right";
  /** resting flow at each sample with a healthy tree (mL/s) */
  restFlow: number[];
  /** regions fed through this vessel and the index where each leaves it */
  feeds: { region: number; index: number }[];
}

export interface CoronaryFlowMap {
  vessels: Record<string, VesselFlow>;
  regions: FlowRegion[];
  /** LV myocardial mass fraction per territory (resting flow share, RV regions excluded) */
  territoryMass: Record<Territory, number>;
  /** RV share of total resting coronary flow */
  rvFraction: number;
  totalRest: number;
  leftRest: number;
  rightRest: number;
  cfr: number;
  /** mean aortic pressure the lesion factors were computed at */
  map: number;
}

export interface FlowOptions {
  cfr?: number;
  /** mean aortic pressure for the lesion calculations (mmHg) */
  map?: number;
}

const toFrank = (x: number, y: number, z: number): [number, number, number] => [x, -y, -z];

function refR(v: TreeVessel, i: number): number {
  const r = v.refRadii ? v.refRadii[i] : v.radii[i];
  return Math.max(0.05, r);
}

function territoryOf(path: PathPoint[], side: "left" | "right"): Territory {
  for (const p of path) {
    const n = p.vessel;
    if (n === "LAD" || /^D\d+$/.test(n) || /^S\d+$/.test(n) || n === "SEPTAL") return "LAD";
    if (n === "LCx" || /^OM\d+$/.test(n) || n === "RAMUS") return "LCx";
  }
  return side === "right" ? "RCA" : "LAD";
}

/** Build the flow network for a tree and its lesions (the lesions the tree was built with). */
export function coronaryFlowFor(tree: CoronaryTree, lesions: Lesion[] = [], opts: FlowOptions = {}): CoronaryFlowMap {
  const cfr = opts.cfr ?? DEFAULT_CFR;
  const map = opts.map ?? 93;
  const vs = tree.vessels.filter((v) => v.kind !== "collateral" && v.samples.length >= 2);
  const byName = new Map(vs.map((v) => [v.name, v]));
  const children = new Map<string, TreeVessel[]>();
  for (const v of vs) {
    if (v.parent && byName.has(v.parent.name)) {
      const a = children.get(v.parent.name) ?? [];
      a.push(v);
      children.set(v.parent.name, a);
    }
  }
  const roots = vs.filter((v) => !v.parent || !byName.has(v.parent.name));

  // --- 1. leaks from Huo-Kassab taper ---
  const leak = new Map<string, number[]>();
  for (const v of vs) {
    const n = v.samples.length;
    const q = (i: number) => Math.pow(refR(v, i), HK_EXPONENT);
    const childAt = new Array(n).fill(0);
    for (const c of children.get(v.name) ?? []) childAt[Math.min(n - 1, c.parent!.index)] += Math.pow(refR(c, 0), HK_EXPONENT);
    const l = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) l[i] = Math.max(0, q(i) - q(i + 1) - childAt[i]);
    // terminal sample: what reaches the end of the vessel and is not carried on by branches arising there
    l[n - 1] = Math.max(0, q(n - 1) - childAt[n - 1]);
    leak.set(v.name, l);
  }
  // subtree sums and normalisation per root
  const subtree = new Map<string, number>();
  const sumSub = (v: TreeVessel): number => {
    let s = leak.get(v.name)!.reduce((a, b) => a + b, 0);
    for (const c of children.get(v.name) ?? []) s += sumSub(c);
    subtree.set(v.name, s);
    return s;
  };
  const scaleSub = (v: TreeVessel, k: number) => {
    const l = leak.get(v.name)!;
    for (let i = 0; i < l.length; i++) l[i] *= k;
    for (const c of children.get(v.name) ?? []) scaleSub(c, k);
  };
  for (const r of roots) {
    const s = sumSub(r);
    const target = REF_FLOW_ML_S * Math.pow(refR(r, 0) / REF_RADIUS_MM, HK_EXPONENT);
    scaleSub(r, s > 0 ? target / s : 0);
    sumSub(r);
  }

  // resting flow per sample
  const vessels: Record<string, VesselFlow> = {};
  const restFlowOf = (v: TreeVessel): number[] => {
    const n = v.samples.length;
    const l = leak.get(v.name)!;
    const add = new Array(n).fill(0);
    for (const c of children.get(v.name) ?? []) add[Math.min(n - 1, c.parent!.index)] += subtree.get(c.name)!;
    const f = new Array(n).fill(0);
    let acc = 0;
    for (let i = n - 1; i >= 0; i--) {
      acc += l[i] + add[i];
      f[i] = acc;
    }
    return f;
  };
  for (const v of vs) vessels[v.name] = { name: v.name, fillId: v.fillId, lesionId: v.lesionId, side: v.side, restFlow: restFlowOf(v), feeds: [] };

  // --- 2. regions ---
  const H = tree.heart;
  const c0 = H.centre;
  const regions: FlowRegion[] = [];
  const pathTo = (v: TreeVessel, index: number): PathPoint[] => {
    const out: PathPoint[] = [{ vessel: v.name, index, param: v.param[index] }];
    let cur = v;
    while (cur.parent && byName.has(cur.parent.name)) {
      const p = byName.get(cur.parent.name)!;
      const idx = Math.min(p.samples.length - 1, cur.parent.index);
      out.unshift({ vessel: p.name, index: idx, param: p.param[idx] });
      cur = p;
    }
    return out;
  };
  const rvVessel = (v: TreeVessel, path: PathPoint[], i0: number): boolean => {
    if (v.name === "AM" || v.name === "CONUS") return true;
    if (v.side !== "right") return false;
    // proximal and mid RCA (SYNTAX 1 and 2) and their small branches supply the RV free wall
    const onRca = path.find((p) => p.vessel === "RCA");
    if (!onRca) return false;
    const rca = byName.get("RCA");
    const idx = v.name === "RCA" ? i0 : onRca.index;
    const seg = rca?.segment?.[idx];
    return seg === "1" || seg === "2";
  };
  for (const v of vs) {
    const l = leak.get(v.name)!;
    const n = v.samples.length;
    const ranges: [number, number][] = [];
    if (v.kind === "twig" || (v.pathMm[n - 1] - v.pathMm[0]) <= REGION_MM * 1.2) ranges.push([0, n - 1]);
    else {
      let s = 0;
      for (let i = 1; i < n; i++) {
        if (v.pathMm[i] - v.pathMm[s] >= REGION_MM || i === n - 1) {
          ranges.push([s, i]);
          s = i + 1;
        }
      }
      if (s <= n - 1) ranges.push([s, n - 1]);
    }
    for (const [i0, i1] of ranges) {
      let demand = 0;
      let dx = 0,
        dy = 0,
        dz = 0;
      for (let i = i0; i <= i1; i++) {
        if (l[i] <= 0) continue;
        const p = samplePos(H, v.samples[i]);
        const ex = p.x - c0.x,
          ey = p.y - c0.y,
          ez = p.z - c0.z;
        const m = Math.hypot(ex, ey, ez) || 1;
        dx += (l[i] * ex) / m;
        dy += (l[i] * ey) / m;
        dz += (l[i] * ez) / m;
        demand += l[i];
      }
      if (demand <= 1e-6) continue;
      const m = Math.hypot(dx, dy, dz) || 1;
      const path = pathTo(v, i0);
      regions.push({
        id: regions.length,
        vessel: v.name,
        side: v.side,
        territory: territoryOf(path, v.side),
        rv: rvVessel(v, path, i0),
        i0,
        i1,
        p0: v.param[i0],
        p1: v.param[i1],
        demand,
        dir: toFrank(dx / m, dy / m, dz / m),
        path,
        restFactor: 1,
        hypFactor: 1,
      });
    }
  }
  for (const r of regions) for (const p of r.path) vessels[p.vessel].feeds.push({ region: r.id, index: p.index });

  // --- 3. fixed lesions ---
  const lesionVessel = new Map<VesselId, TreeVessel>();
  for (const v of vs) if (v.lesionId && !lesionVessel.has(v.lesionId)) lesionVessel.set(v.lesionId, v);
  const factors: Factor[] = [];
  for (let li = 0; li < lesions.length; li++) {
    const L = lesions[li];
    const v = lesionVessel.get(L.vessel);
    if (!v) continue;
    const i = Math.max(0, v.param.findIndex((t) => t >= L.position));
    const vf = vessels[v.name];
    // (occlusions: a chronic one is collateral-supplied, an acute thrombotic one has no flow; see stenosisFactor)
    const rest = Math.max(1e-3, vf.restFlow[i]);
    const downMm = Math.max(10, v.pathMm[v.pathMm.length - 1] - v.pathMm[i]);
    const f = stenosisFactor(2 * refR(v, i), downMm, rest, L, cfr, map);
    factors.push({ vessel: v.name, param: L.position, rest: f.rest, hyp: f.hyp, coll: f.collateral ?? 0, ante: f.antegrade ?? f.hyp, acute: isAcuteOcclusion(L) || L.kind === "thrombotic", idx: li });
  }
  applyFactors(regions, factors, cfr);
  return finish(vessels, regions, cfr, map);
}

/**
 * Resting and maximal flow through one stenosis as fractions of normal (physiology.ts Gould model),
 * plus collateral supply for chronic lesions. An acute thrombotic occlusion (≥ 99 %) has no flow.
 * A chronic occlusion or subtotal stenosis (≥ 99 %, or a CTO ≥ 95 %) is collateral-supplied: resting
 * flow is held and maximal flow is CTO_COLLATERAL_HYP. A chronic stenosis below that adds
 * collateralFor(severity) to its antegrade maximal flow.
 */
export function stenosisFactor(
  refDiamMm: number,
  downMm: number,
  restFlow: number,
  L: Lesion,
  cfr: number,
  map: number,
): { rest: number; hyp: number; collateral?: number; antegrade?: number } {
  if (isAcuteOcclusion(L)) return { rest: 0, hyp: 0, collateral: 0, antegrade: 0 };
  if (L.severity >= 99 || (L.kind === "cto" && L.severity >= 95)) return { rest: 1, hyp: CTO_COLLATERAL_HYP, collateral: CTO_COLLATERAL_HYP, antegrade: 0 };
  const c: CoronaryCase = {
    id: "stenosis",
    title: "",
    vessel: "",
    brief: "",
    refDiamMm,
    lengthMm: downMm,
    lesions: [{ id: "l", pos: 0.02, ds: Math.min(0.97, L.severity / 100), lengthMm: L.lengthMm ?? 12 }],
    diffuse: 0,
    cfrPotential: cfr,
    map,
    restFlow,
    decision: "treat",
    teaching: "",
  };
  const qr = wireFlow(c, 0).q;
  const qh = wireFlow(c, 1).q;
  const coll = collateralFor(L.severity, L.kind);
  const antegradeHyp = Math.min(1, qh / (restFlow * cfr));
  const hyp = Math.min(1, antegradeHyp + coll);
  // resting flow: autoregulation plus collaterals hold it while the maximal capacity allows
  const rest = Math.min(1, qr / restFlow + coll * cfr);
  return { rest, hyp, collateral: Math.min(coll, hyp), antegrade: antegradeHyp };
}

interface Factor {
  vessel: string;
  param: number;
  rest: number;
  hyp: number;
  coll: number;
  /** antegrade maximal flow fraction through the lesion (without collaterals) */
  ante: number;
  /** acute (thrombotic) lesion: no collateral support distal to it */
  acute: boolean;
  idx: number;
}

/**
 * Combine the lesions upstream of each region. Antegrade capacity is the product over serial
 * lesions; collateral supply enters distal to all of them, so the best collateral contribution is
 * added once (not multiplied through the serial lesions). An acute thrombotic lesion upstream
 * removes collateral support (no time to recruit). Approximation: serial lesions are independent.
 */
function applyFactors(regions: FlowRegion[], factors: Factor[], cfr: number): void {
  for (const r of regions) {
    let rf = 1,
      ante = 1,
      coll = 0,
      acute = false;
    const idx: number[] = [];
    for (const f of factors) {
      const pp = r.path.find((p) => p.vessel === f.vessel);
      if (!pp) continue;
      // the region lies beyond the lesion if the path leaves this vessel distal to it
      const beyond = pp.vessel === r.vessel ? r.p1 > f.param : pp.param > f.param;
      if (!beyond) continue;
      rf *= f.rest;
      ante *= f.ante;
      coll = Math.max(coll, f.coll);
      acute ||= f.acute;
      idx.push(f.idx);
    }
    if (acute) coll = 0;
    else if (idx.length) coll = Math.max(coll, MP_CHRONIC_REST_RESERVE / cfr - ante);
    const hf = Math.min(1, ante + coll);
    r.restFactor = acute ? rf : Math.min(1, Math.max(rf, coll * DEFAULT_CFR));
    r.hypFactor = hf;
    r.collateral = hf > 0 ? Math.min(1, coll / hf) : 0;
    r.lesionIdx = idx;
  }
}

function finish(vessels: Record<string, VesselFlow>, regions: FlowRegion[], cfr: number, map: number): CoronaryFlowMap {
  // --- territory masses ---
  const tm: Record<Territory, number> = { LAD: 0, LCx: 0, RCA: 0 };
  let lvTot = 0,
    rvTot = 0,
    left = 0,
    right = 0;
  for (const r of regions) {
    if (r.rv) rvTot += r.demand;
    else {
      tm[r.territory] += r.demand;
      lvTot += r.demand;
    }
    if (r.side === "left") left += r.demand;
    else right += r.demand;
  }
  for (const k of Object.keys(tm) as Territory[]) tm[k] = lvTot > 0 ? tm[k] / lvTot : 0;
  return { vessels, regions, territoryMass: tm, rvFraction: rvTot / Math.max(1e-9, lvTot + rvTot), totalRest: left + right, leftRest: left, rightRest: right, cfr, map };
}

// ---------------------------------------------------------------------------
// Supply under dynamic conditions
// ---------------------------------------------------------------------------

export interface FlowModifiers {
  /** balloon or device occlusions: tree vessel name, param, fraction of lumen closed (1 = complete) */
  occlusions?: { vessel: string; param: number; fraction: number }[];
  /** ostial supply fraction per side through a catheter in the ostium (1 = unobstructed) */
  ostial?: { left: number; right: number };
  /** epicardial spasm per tree vessel: flow capacity multiplier (1 = none) */
  spasm?: Record<string, number>;
  /** microvascular (no-reflow) capacity multiplier per region id */
  microvascular?: Record<number, number>;
  /** hyperaemia per side (0 rest … 1 maximal) */
  hyperaemia?: { left: number; right: number };
  /** myocardial oxygen demand relative to baseline (rate-pressure product ratio) */
  demand?: number;
  /** perfusion pressure ratio (MAP − Pv) / (MAP0 − Pv) */
  perfusion?: number;
}

export interface RegionSupply {
  /** current mean flow, mL/s */
  q: number;
  /** supply deficit 0..1 relative to metabolic demand */
  deficit: number;
  /**
   * the part of the deficit that would remain at resting demand (supply failure: occlusion, wedged
   * catheter, spasm, steal). A deficit with restDeficit near 0 is demand ischaemia, which stays
   * subendocardial (ST depression); a large restDeficit makes the ischaemia transmural.
   */
  restDeficit: number;
}

/** Dynamic capacity multiplier of a region (occlusions, ostium, spasm, microvasculature). */
export function dynamicFactor(r: FlowRegion, m: FlowModifiers): number {
  let k = 1;
  if (m.ostial) k *= r.side === "left" ? m.ostial.left : m.ostial.right;
  if (m.occlusions) {
    for (const o of m.occlusions) {
      const pp = r.path.find((p) => p.vessel === o.vessel);
      if (!pp) continue;
      // own vessel: every chunk that extends beyond the occlusion; parent vessel: the branch leaves distal to it
      const hit = pp.vessel === r.vessel ? r.p1 >= o.param : pp.param >= o.param;
      if (hit) k *= Math.max(0, 1 - o.fraction);
    }
  }
  if (m.spasm) for (const p of r.path) if (m.spasm[p.vessel] !== undefined) k *= m.spasm[p.vessel];
  if (m.microvascular && m.microvascular[r.id] !== undefined) k *= m.microvascular[r.id];
  return k;
}

/** Supply of one region: flow and the deficit against demand. */
export function supplyFor(r: FlowRegion, fm: CoronaryFlowMap, m: FlowModifiers): RegionSupply {
  const dyn = dynamicFactor(r, m);
  const perf = Math.max(0, m.perfusion ?? 1);
  const need = Math.max(0.3, m.demand ?? 1);
  const h = r.side === "left" ? m.hyperaemia?.left ?? 0 : m.hyperaemia?.right ?? 0;
  // collateral steal: hyperaemia in the donor bed lowers collateral driving pressure
  const steal = 1 - MP_COLLATERAL_STEAL * h * (r.collateral ?? 0);
  // maximal flow available (relative to resting demand): CFR × lesion factor × dynamic × perfusion
  const cap = fm.cfr * r.hypFactor * dyn * perf * steal;
  // autoregulated flow: meets the metabolic need, rising towards capacity with pharmacological hyperaemia
  const want = need + h * Math.max(0, fm.cfr * perf - need);
  const rel = Math.min(want, cap);
  return {
    q: r.demand * Math.max(0, rel),
    deficit: Math.max(0, Math.min(1, 1 - Math.min(cap, need) / need)),
    restDeficit: Math.max(0, Math.min(1, 1 - cap)),
  };
}

/** Mean flow along a vessel (mL/s per sample) for the current region flows. */
export function vesselFlowProfile(fm: CoronaryFlowMap, vessel: string, regionQ: ArrayLike<number>): Float32Array {
  const vf = fm.vessels[vessel];
  if (!vf) return new Float32Array(0);
  const n = vf.restFlow.length;
  const add = new Float32Array(n);
  for (const f of vf.feeds) add[Math.min(n - 1, f.index)] += regionQ[f.region];
  const out = new Float32Array(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) {
    acc += add[i];
    out[i] = acc;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Phasic flow shape
// ---------------------------------------------------------------------------

const PH_N = 128;
let phLeft: Float32Array | null = null;
let phRight: Float32Array | null = null;

/**
 * Normalised phasic coronary flow (mean 1) through the beat: aortic pressure over the
 * intramyocardial compression resistance of physiology.ts. The right coronary sees half the
 * systolic compression (lower RV wall stress; MODEL PARAMETER), so its flow is less diastolic.
 */
export function phasicFlow(phase: number, side: "left" | "right"): number {
  if (!phLeft || !phRight) {
    const mk = (k: number) => {
      const a = new Float32Array(PH_N);
      let s = 0;
      for (let i = 0; i < PH_N; i++) {
        const ph = i / PH_N;
        const comp = 1 + (compression(ph) - 1) * k;
        a[i] = Math.max(0, aorticPressure(93, ph) - 5) / Math.max(0.2, comp);
        s += a[i];
      }
      for (let i = 0; i < PH_N; i++) a[i] *= PH_N / s;
      return a;
    };
    phLeft = mk(1);
    phRight = mk(0.5);
  }
  const t = (((phase % 1) + 1) % 1) * PH_N;
  const i = Math.floor(t);
  const f = t - i;
  const a = side === "left" ? phLeft : phRight;
  return a[i % PH_N] * (1 - f) + a[(i + 1) % PH_N] * f;
}

// ---------------------------------------------------------------------------
// CoronaryCase for the pressure wire (S14) from the same tree
// ---------------------------------------------------------------------------

/**
 * A physiology.ts CoronaryCase for one named vessel of the rendered tree: reference diameter at
 * the ostium of that vessel, its path length, every case lesion on it, and the resting flow it
 * carries in this patient. physiology.reading()/indices()/ffr() then work on the anatomy the
 * trainee is wiring. Upstream lesions on parent vessels are not included (separate cases).
 */
export function coronaryCaseFor(tree: CoronaryTree, fm: CoronaryFlowMap, vessel: VesselId, lesions: Lesion[], opts: { map?: number; cfr?: number; diffuse?: number } = {}): CoronaryCase | null {
  const v = tree.vessels.find((x) => x.lesionId === vessel && x.kind !== "collateral");
  if (!v) return null;
  const vf = fm.vessels[v.name];
  const n = v.samples.length;
  const lengthMm = Math.max(10, v.pathMm[n - 1] - v.pathMm[0]);
  return {
    id: `tree-${v.name}`,
    title: `${v.name} (patient anatomy)`,
    vessel: v.name,
    brief: "",
    refDiamMm: 2 * refR(v, 0),
    lengthMm,
    lesions: lesions
      .filter((l) => l.vessel === vessel && l.severity < 99)
      .map((l, i) => ({ id: `l${i}`, pos: l.position, ds: Math.min(0.97, l.severity / 100), lengthMm: l.lengthMm ?? 12 })),
    diffuse: opts.diffuse ?? 0,
    cfrPotential: opts.cfr ?? fm.cfr,
    map: opts.map ?? fm.map,
    restFlow: vf ? vf.restFlow[0] : undefined,
    decision: "treat",
    teaching: "",
  };
}

// ---------------------------------------------------------------------------
// Tree-less default network
// ---------------------------------------------------------------------------

interface DefVessel {
  name: string;
  id: VesselId;
  side: "left" | "right";
  parent?: { name: string; param: number };
  refDiamMm: number;
  lengthMm: number;
  /** regions along the vessel: param range, resting demand (mL/s), Frank direction, RV flag */
  regions: { p0: number; p1: number; demand: number; dir: Vec3; rv?: boolean }[];
}
type Vec3 = [number, number, number];

const nrm = (v: Vec3): Vec3 => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};

/**
 * A small fixed network for when no rendered tree is available (other labs, tests): named vessels
 * with 1-3 regions each. Demands, diameters and region directions are MODEL PARAMETERS chosen to
 * resemble a typical heart (anterior LAD, lateral LCx, inferior RCA, RV free wall from the
 * proximal RCA). With a tree, coronaryFlowFor() derives all of this from the anatomy instead.
 */
export function defaultFlowMap(lesions: Lesion[] = [], dominance: "right" | "left" | "codominant" = "right", opts: FlowOptions = {}): CoronaryFlowMap {
  const cfr = opts.cfr ?? DEFAULT_CFR;
  const map = opts.map ?? 93;
  const leftDom = dominance === "left";
  const V: DefVessel[] = [
    { name: "LM", id: "LM", side: "left", refDiamMm: 4.4, lengthMm: 10, regions: [] },
    {
      name: "LAD",
      id: "LAD",
      side: "left",
      parent: { name: "LM", param: 1 },
      refDiamMm: 3.3,
      lengthMm: 120,
      regions: [
        { p0: 0, p1: 0.33, demand: 0.42, dir: nrm([0.1, -0.25, -0.95]) },
        { p0: 0.34, p1: 0.66, demand: 0.34, dir: nrm([0.45, 0.2, -0.85]) },
        // apical LAD: left, anterior and only slightly inferior, so a typical mid LAD occlusion gives
        // anterior elevation; a wrap-around (inferior) pattern comes from a rendered tree whose LAD
        // wraps the apex
        { p0: 0.67, p1: 1, demand: 0.24, dir: nrm([0.55, 0.3, -0.78]) },
      ],
    },
    { name: "D1", id: "D1", side: "left", parent: { name: "LAD", param: 0.25 }, refDiamMm: 2.3, lengthMm: 60, regions: [{ p0: 0, p1: 1, demand: 0.2, dir: nrm([0.85, -0.15, -0.5]) }] },
    { name: "D2", id: "D2", side: "left", parent: { name: "LAD", param: 0.5 }, refDiamMm: 2.0, lengthMm: 50, regions: [{ p0: 0, p1: 1, demand: 0.12, dir: nrm([0.85, 0.15, -0.5]) }] },
    {
      name: "LCx",
      id: "LCx",
      side: "left",
      parent: { name: "LM", param: 1 },
      refDiamMm: 3.0,
      lengthMm: 80,
      regions: [
        { p0: 0, p1: 0.4, demand: 0.18, dir: nrm([0.8, -0.35, 0.45]) },
        { p0: 0.41, p1: 1, demand: 0.14, dir: nrm([0.55, 0.2, 0.8]) },
      ],
    },
    { name: "OM1", id: "OM1", side: "left", parent: { name: "LCx", param: 0.35 }, refDiamMm: 2.3, lengthMm: 60, regions: [{ p0: 0, p1: 1, demand: 0.32, dir: nrm([0.95, 0.15, 0.25]) }] },
    {
      name: "RCA",
      id: "RCA",
      side: "right",
      refDiamMm: 3.5,
      lengthMm: 130,
      regions: [
        { p0: 0, p1: 0.3, demand: 0.14, dir: nrm([-0.75, 0.05, -0.6]), rv: true },
        { p0: 0.31, p1: 0.6, demand: 0.14, dir: nrm([-0.6, 0.5, -0.35]), rv: true },
        { p0: 0.61, p1: 1, demand: 0.2, dir: nrm([-0.1, 0.95, 0.25]) },
      ],
    },
    { name: "CONUS", id: "CONUS", side: "right", parent: { name: "RCA", param: 0.02 }, refDiamMm: 1.2, lengthMm: 30, regions: [{ p0: 0, p1: 1, demand: 0.04, dir: nrm([-0.35, -0.45, -0.8]), rv: true }] },
    { name: "AM", id: "AM", side: "right", parent: { name: "RCA", param: 0.45 }, refDiamMm: 1.6, lengthMm: 50, regions: [{ p0: 0, p1: 1, demand: 0.09, dir: nrm([-0.8, 0.4, -0.25]), rv: true }] },
    {
      name: "PDA",
      id: "PDA",
      side: leftDom ? "left" : "right",
      parent: leftDom ? { name: "LCx", param: 1 } : { name: "RCA", param: 1 },
      refDiamMm: 2.2,
      lengthMm: 70,
      regions: [{ p0: 0, p1: 1, demand: 0.28, dir: nrm([0.05, 0.95, -0.1]) }],
    },
    {
      name: "PLV",
      id: "PLV",
      side: leftDom ? "left" : "right",
      parent: leftDom ? { name: "LCx", param: 0.9 } : { name: "RCA", param: 1 },
      refDiamMm: 2.0,
      lengthMm: 50,
      regions: [{ p0: 0, p1: 1, demand: 0.22, dir: nrm([0.45, 0.75, 0.5]) }],
    },
  ];
  const byName = new Map(V.map((v) => [v.name, v]));
  const pathTo = (v: DefVessel, p: number): PathPoint[] => {
    const out: PathPoint[] = [{ vessel: v.name, index: Math.round(p * 100), param: p }];
    let cur = v;
    while (cur.parent) {
      const par = byName.get(cur.parent.name)!;
      out.unshift({ vessel: par.name, index: Math.round(cur.parent.param * 100), param: cur.parent.param });
      cur = par;
    }
    return out;
  };
  const regions: FlowRegion[] = [];
  for (const v of V) {
    for (const r of v.regions) {
      const path = pathTo(v, r.p0);
      regions.push({
        id: regions.length,
        vessel: v.name,
        side: v.side,
        territory: territoryOf(path, v.side),
        rv: !!r.rv,
        i0: Math.round(r.p0 * 100),
        i1: Math.round(r.p1 * 100),
        p0: r.p0,
        p1: r.p1,
        demand: r.demand,
        dir: r.dir,
        path,
        restFactor: 1,
        hypFactor: 1,
      });
    }
  }
  // per-vessel resting flow on a 101-point param grid
  const vessels: Record<string, VesselFlow> = {};
  for (const v of V) vessels[v.name] = { name: v.name, fillId: v.id, lesionId: v.id, side: v.side, restFlow: new Array(101).fill(0), feeds: [] };
  for (const r of regions) for (const p of r.path) vessels[p.vessel].feeds.push({ region: r.id, index: p.index });
  for (const v of V) {
    const vf = vessels[v.name];
    for (let i = 0; i <= 100; i++) vf.restFlow[i] = vf.feeds.filter((f) => f.index >= i).reduce((a, f) => a + regions[f.region].demand, 0);
  }
  const factors: Factor[] = [];
  for (let li = 0; li < lesions.length; li++) {
    const L = lesions[li];
    const v = V.find((x) => x.id === L.vessel);
    if (!v) continue;
    const i = Math.min(100, Math.max(0, Math.round(L.position * 100)));
    const rest = Math.max(1e-3, vessels[v.name].restFlow[i]);
    const f = stenosisFactor(v.refDiamMm, Math.max(10, v.lengthMm * (1 - L.position)), rest, L, cfr, map);
    factors.push({ vessel: v.name, param: L.position, rest: f.rest, hyp: f.hyp, coll: f.collateral ?? 0, ante: f.antegrade ?? f.hyp, acute: isAcuteOcclusion(L) || L.kind === "thrombotic", idx: li });
  }
  applyFactors(regions, factors, cfr);
  return finish(vessels, regions, cfr, map);
}
