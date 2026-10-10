import type { AnatomyCase, Graft, GraftProximalSite, Vec3, VesselId } from "../types";
import { V, add, scale, normalize, rotateZ, deg2rad } from "../utils/math";

// ---------------------------------------------------------------------------
// Anatomy model
//
// Coordinate frame (the "aortic frame"):
//   +x = patient left, +y = superior (up the aorta), +z = anterior.
//   The aortic valve plane is at y = 0. The sinuses (root) sit just above it.
//   Below y = 0 is the left-ventricular danger zone.
//
// Engagement math is done entirely in this aortic frame. A separate geometric
// tilt (aortaTiltRad, about the antero-posterior Z axis) is applied only for
// rendering / projection so a "horizontal aorta" also LOOKS horizontal.
// ---------------------------------------------------------------------------

export interface Ostium {
  pos: Vec3;
  dir: Vec3; // coaxial take-off direction (outward)
  /**
   * Azimuth in the aortic frame. For the left main and the RCA this is the azimuth of the sinus the
   * artery usually arises from (the physics root, src/physics/lumen.ts rootGeom, builds its cusps from
   * lm.az and rca.az), which is the ostium's own azimuth in every case except an anomalous origin: an
   * artery arising from the other sinus keeps the usual sinus azimuth here and has its own position and
   * direction in pos and dir (ostiumAz gives the azimuth of pos).
   */
  az: number;
  height: number;
}

/** Azimuth of an ostium's position in the aortic frame (radians). */
export const ostiumAz = (o: Pick<Ostium, "pos">): number => Math.atan2(o.pos.z, o.pos.x);

export interface VesselPath {
  id: VesselId;
  points: Vec3[];
  radius: number; // tube radius for rendering
}

export interface AnatomyModel {
  sinusRadius: number;
  valvePlaneY: number;
  sinusTopY: number;
  lm: Ostium;
  rca: Ostium;
  /** conus branch ostium — the first, most proximal RCA branch, higher & more
   *  anterior than the RCA os; over-selecting and injecting it can cause VF */
  conus: Ostium;
  leftOstium2: Ostium | null; // used for separate LAD/LCx ostia
  vessels: VesselPath[];
  cusps: { id: "LCC" | "RCC" | "NCC"; pos: Vec3 }[];
  aortaTiltRad: number;
  dominance: AnatomyCase["dominance"];
  /** sinus each coronary arises from (differs from the usual with the anomalous-origin variants) */
  sinusOf?: { rca: "right" | "left"; lcx: "left" | "right"; lm?: "left" | "right" };
  /**
   * Azimuths of the centres of the left and right coronary sinuses (radians). With the usual anatomy
   * they equal lm.az and rca.az.
   */
  sinusAz?: { left: number; right: number };
  /**
   * Where the left main and the RCA would arise with the usual anatomy, kept for the anomalous-origin
   * variants so that the render tree grows the displaced artery into its usual bed (diag-anatomy-variants).
   */
  usual?: { lm: Ostium; rca: Ostium };
  /** an anomalous circumflex: from its own ostium in the right sinus, or from the proximal RCA (absent: from the left main or its own left-sinus ostium) */
  lcxOrigin?: "right-sinus" | "rca";
  /**
   * The aortic ostia of the case's bypass grafts (diag-grafts-svg), in the case's graft order; present only when the
   * case has a vein or radial graft sewn onto the ascending aorta (absent on every other case, so it is unchanged).
   */
  grafts?: GraftSite[];
}

/** A bypass graft whose proximal end is on the ascending aorta (diag-grafts-svg). */
export interface GraftSite {
  /** the graft's id within the case (Graft.id, or `<conduit>-<target>` when the case gives none) */
  id: string;
  /** index of the graft in AnatomyCase.grafts */
  index: number;
  graft: Graft;
  /** the aortic anastomosis: position on the anterior ascending aorta and the graft's take-off direction */
  ostium: Ostium;
  /** the coronary system the graft's (first) distal anastomosis lies on */
  side: "left" | "right";
  /** the render tree's and the physics lumen's name for the graft (GRAFT_PREFIX + id) */
  treeName: string;
  /** short teaching label ("vein graft to the posterior descending artery") */
  label: string;
}

/** An ostium a catheter can engage, for the engagement and device code (S7). */
export interface EngagementTarget {
  vessel: VesselId;
  ostium: Ostium;
  sinus: "left" | "right";
  /** short teaching label */
  label: string;
}

/** Every engageable ostium of a model: left main (or separate LAD/LCx ostia, or the circumflex's own ostium in the right sinus), RCA, conus. */
export function engagementTargets(model: AnatomyModel): EngagementTarget[] {
  const out: EngagementTarget[] = [];
  const sep = model.leftOstium2 && model.sinusOf?.lcx !== "right" && !model.vessels.some((v) => v.id === "LM");
  const lmRight = model.sinusOf?.lm === "right";
  out.push({ vessel: sep ? "LAD" : "LM", ostium: model.lm, sinus: lmRight ? "right" : "left", label: sep ? "LAD ostium (separate)" : lmRight ? "Left main ostium in the right sinus (anomalous)" : "Left main ostium" });
  if (model.leftOstium2) {
    const right = model.sinusOf?.lcx === "right";
    out.push({ vessel: "LCx", ostium: model.leftOstium2, sinus: right ? "right" : "left", label: right ? "Circumflex ostium in the right sinus (anomalous)" : "Circumflex ostium (separate)" });
  }
  const rcaLeft = model.sinusOf?.rca === "left";
  out.push({ vessel: "RCA", ostium: model.rca, sinus: rcaLeft ? "left" : "right", label: rcaLeft ? "RCA ostium in the left sinus (anomalous)" : "RCA ostium" });
  // the conus stays in the right sinus with the RCA from the left sinus (buildAnatomy)
  out.push({ vessel: "CONUS", ostium: model.conus, sinus: "right", label: "Conus branch ostium" });
  return out;
}

const ROOT_RADIUS: Record<AnatomyCase["rootSize"], number> = {
  small: 14,
  normal: 18,
  dilated: 24,
};
/**
 * Sinus radius of the 'very-dilated-root' variant, mm (MODEL PARAMETER: a 56 mm root, larger than the
 * dilated root's 48 mm; pm-engaging-fail describes telescoping a 4 Fr diagnostic catheter through a 6 Fr
 * AL3 guide to reach the left main in a very dilated root, and Brilakis's rule of the aortic diameter in
 * centimetres plus one for the JL size, pm-engaging-left).
 */
export const VERY_DILATED_ROOT_RADIUS = 28;

export const VALVE_PLANE_Y = 0;
/** ostial heights above the valve plane, mm (model parameters; LM below RCA per Philip 2015) */
export const LM_OSTIUM_HEIGHT = 13.5;
export const RCA_OSTIUM_HEIGHT = 15;
export const SINUS_TOP_Y = 26;
export const LV_MARGIN = 2;

// ---- anomalous origins (diag-anatomy-variants). Every placement below is a MODEL PARAMETER: the
// manuals (pm-interpreting-anomalies, pm-engaging-fail: Oxford ch 6, Brilakis 5.7) name the anomalies
// and how they show, not their geometry. ----
/** RCA from the left sinus: azimuth past the left main towards the left-right commissure, and height above the left main. */
export const ANOM_RCA_LEFT = { dAzDeg: 55, dHeight: 3 } as const;
/** Left main from the right sinus: azimuth from the RCA ostium towards the left-right commissure, and height relative to the RCA. */
export const ANOM_LM_RIGHT = { dAzDeg: -30, dHeight: -1 } as const;
/** Circumflex from the right sinus: azimuth posterior to the RCA ostium, and height below it. */
export const ANOM_LCX_RIGHT = { dAzDeg: 22, dHeight: -2 } as const;
/** High ostia: both coronary ostia this far above their usual height, at or above the sinotubular junction (mm). */
export const HIGH_OSTIA_LIFT_MM = 10;
/** Conus with its own large ostium right beside the RCA's: azimuth and height offsets from the RCA ostium (the usual conus is 18 degrees and 4 mm away). */
export const CONUS_SEPARATE = { dAzDeg: -10, dHeight: 2.5 } as const;
/** Clearance of an anomalous artery's course round the root, beyond the sinus wall (mm). */
const COURSE_CLEAR_MM = 3;

// ---- bypass graft ostia (diag-grafts-svg). The ORDER is the module text's: vein grafts are sewn onto the front of
// the ascending aorta a short way above the sinuses, circumflex (marginal) grafts highest, LAD and diagonal grafts
// just above the left coronary ostium, RCA grafts lowest, just above and in front of the native RCA (Oxford ch 7,
// as src/content/manual/cath-handbook/10-background.ts and complex-pci/05-prior-cabg.ts quote it; lab requests
// cp-prior-cabg#0 and hb-background#2). Every height and azimuth below is a MODEL PARAMETER. ----
/**
 * Where each aortic proximal site lies: height above the sinotubular junction (the model's sinusTopY, mm) and
 * azimuth in the aortic frame (degrees; 90 is straight anterior, 150 the native RCA's sinus, -30 the left's), before
 * the case's root rotation. All three sites are anterior to the native RCA ostium.
 */
export const GRAFT_OSTIUM: Record<"aorta-high" | "aorta-mid" | "aorta-low", { dHeightMm: number; azDeg: number }> = {
  "aorta-high": { dHeightMm: 16, azDeg: 55 },
  "aorta-mid": { dHeightMm: 10, azDeg: 72 },
  "aorta-low": { dHeightMm: 5, azDeg: 118 },
};
/** A further graft at the same proximal site is sewn beside the first: this azimuth and height offset per graft (MODEL PARAMETER). */
export const GRAFT_SAME_SITE = { dAzDeg: -14, dHeightMm: 3 } as const;
/** Radius of the ascending aorta where the grafts arise, as a share of the sinus radius (MODEL PARAMETER; the same value as the physics, src/physics/lumen.ts ASC_RADIUS_RATIO). */
export const GRAFT_WALL_RATIO = 0.9;
/** Downward component of a vein graft's take-off direction (MODEL PARAMETER: the conduit leaves the aorta forwards and down towards the heart). */
export const GRAFT_TAKEOFF_DOWN = 0.35;
/** Prefix of a graft's name in the render tree and the physics lumens. */
export const GRAFT_PREFIX = "GRAFT:";

const AORTIC_SITES: readonly GraftProximalSite[] = ["aorta-high", "aorta-mid", "aorta-low"];

/** The coronary system a graft target lies on (the PDA and PLV follow the dominance). */
export function graftTargetSide(target: VesselId, dominance: AnatomyCase["dominance"]): "left" | "right" {
  if (target === "RCA" || target === "CONUS" || target === "AM") return "right";
  if (target === "PDA" || target === "PLV") return dominance === "left" ? "left" : "right";
  return "left";
}

/** A graft's id within its case (Graft.id, or `<conduit>-<target>` with a suffix for a repeat). */
export function graftIdOf(grafts: readonly Graft[], i: number): string {
  const g = grafts[i];
  if (g.id) return g.id;
  const base = `${g.conduit}-${g.target.toLowerCase()}`;
  const before = grafts.slice(0, i).filter((x) => !x.id && `${x.conduit}-${x.target.toLowerCase()}` === base).length;
  return before ? `${base}-${before + 1}` : base;
}

const CONDUIT_NAME: Record<Graft["conduit"], string> = { svg: "vein graft", radial: "radial artery graft", lima: "left internal mammary graft", rima: "right internal mammary graft" };

/**
 * The aortic ostia of a case's vein and radial grafts (sites aorta-high, aorta-mid and aorta-low). In situ mammary
 * and composite grafts have no aortic ostium and are left out here (diag-grafts-arterial places them).
 */
export function graftSites(c: Pick<AnatomyCase, "grafts" | "dominance" | "rootRotationDeg">, R: number, sinusTopY: number): GraftSite[] {
  const grafts = c.grafts ?? [];
  const out: GraftSite[] = [];
  const used = new Map<GraftProximalSite, number>();
  const rot = deg2rad(c.rootRotationDeg);
  const r = R * GRAFT_WALL_RATIO;
  grafts.forEach((g, index) => {
    if (!AORTIC_SITES.includes(g.proximalSite) || (g.conduit !== "svg" && g.conduit !== "radial")) return;
    const site = GRAFT_OSTIUM[g.proximalSite as keyof typeof GRAFT_OSTIUM];
    const k = used.get(g.proximalSite) ?? 0;
    used.set(g.proximalSite, k + 1);
    const az = deg2rad(site.azDeg + k * GRAFT_SAME_SITE.dAzDeg) + rot;
    const height = sinusTopY + site.dHeightMm + k * GRAFT_SAME_SITE.dHeightMm;
    const id = graftIdOf(grafts, index);
    out.push({
      id,
      index,
      graft: g,
      ostium: { az, height, pos: add(scale(radial(az), r), axisPoint(height)), dir: normalize(add(radial(az), V(0, -GRAFT_TAKEOFF_DOWN, 0))) },
      side: graftTargetSide(g.target, c.dominance),
      treeName: GRAFT_PREFIX + id,
      label: `${CONDUIT_NAME[g.conduit]} to the ${VESSEL_NAMES[g.target].replace(/^[A-Z]/, (x) => x.toLowerCase())}`,
    });
  });
  return out;
}

/** The graft site a render-tree or physics-lumen name belongs to, or undefined. */
export function graftSiteByName(model: Pick<AnatomyModel, "grafts">, name: string | null | undefined): GraftSite | undefined {
  if (!name || !name.startsWith(GRAFT_PREFIX)) return undefined;
  return model.grafts?.find((g) => g.treeName === name);
}

// ---- searching for a graft (diag-grafts-svg): graft-not-found. MODEL PARAMETERS: the module text says to raise it
// after repeated failed attempts or time spent at a graft the operation note lists (lab request cp-prior-cabg#0) and
// gives no counts; these are a model's choice. ----
export const GRAFT_SEARCH = {
  /**
   * the tip is "at" a graft's level within this height of its ostium (mm), at least nearMm off the aortic axis on the
   * graft's side, and only at the graft whose ostium is nearest it in height (so the bands of neighbouring grafts do
   * not overlap: a sweep at one graft's level is not counted at the next)
   */
  levelMm: 4,
  nearMm: 9,
  /** a new attempt starts when the tip comes back to the level after this long away from it (s) */
  attemptGapS: 2,
  /** and counts once the tip has stayed at the level this long (s): a tip passing through a level on its way up or down, or springing past it, has not tried that graft */
  attemptMinS: 0.5,
  /** attempts at one graft's level without engaging it, or seconds spent there, before graft-not-found */
  attempts: 4,
  dwellS: 60,
  /** the tip must stay in a graft this long for it to count as found (a tip passing through the mouth has not found it), s */
  seatS: 0.5,
} as const;

/**
 * Counts attempts at, and time spent near, each listed aortic graft that the catheter has not engaged, and reports
 * the first graft whose search has failed (graft-not-found). Pure state: the caller steps it with the tip position in
 * the aortic frame and the graft the tip is engaged in (its tree name), if any.
 */
export class GraftSearch {
  private readonly st = new Map<string, { attempts: number; dwell: number; away: number; at: boolean; stay: number; seated: number; engaged: boolean; fired: boolean }>();
  constructor(private readonly sites: readonly GraftSite[]) {
    for (const s of sites) this.st.set(s.treeName, { attempts: 0, dwell: 0, away: Infinity, at: false, stay: 0, seated: 0, engaged: false, fired: false });
  }

  /** Step by dt seconds. Returns the graft sites whose search has just failed (each at most once). */
  step(dt: number, tip: Vec3 | null, engagedGraft: string | null | undefined): GraftSite[] {
    const out: GraftSite[] = [];
    // the graft whose level the tip is at: off the aortic axis towards the wall it arises from (at least nearMm out, on
    // the same half of the aorta), the nearest in height of those grafts (the nearest ostium on a tie), and within
    // levelMm of its height. Each height therefore belongs to one graft's band at most. A tip inside a graft's lumen
    // is at that graft, wherever the lumen runs.
    let at: GraftSite | null = engagedGraft ? this.sites.find((s) => s.treeName === engagedGraft) ?? null : null;
    if (!at && tip && Math.hypot(tip.x, tip.z) >= GRAFT_SEARCH.nearMm) {
      let bestDy = Infinity;
      let bestD = Infinity;
      for (const s of this.sites) {
        const o = s.ostium.pos;
        if (tip.x * o.x + tip.z * o.z <= 0) continue;
        const dy = Math.abs(tip.y - o.y);
        const d = Math.hypot(tip.x - o.x, tip.y - o.y, tip.z - o.z);
        if (dy < bestDy - 1e-9 || (Math.abs(dy - bestDy) <= 1e-9 && d < bestD)) {
          bestDy = dy;
          bestD = d;
          at = s;
        }
      }
      if (bestDy > GRAFT_SEARCH.levelMm) at = null;
    }
    for (const s of this.sites) {
      const st = this.st.get(s.treeName)!;
      st.seated = engagedGraft === s.treeName ? st.seated + dt : 0;
      if (st.seated >= GRAFT_SEARCH.seatS - 1e-9) st.engaged = true;
      const atLevel = at === s;
      if (atLevel) {
        // the tip has come back once it has stayed at the level attemptMinS (a shorter stay leaves the gap running);
        // coming back after the gap is a new attempt
        if (!st.at) st.stay = 0;
        st.stay += dt;
        if (st.stay >= GRAFT_SEARCH.attemptMinS - 1e-9) {
          if (st.away >= GRAFT_SEARCH.attemptGapS) st.attempts++;
          st.away = 0;
        } else st.away += dt;
        st.at = true;
        st.dwell += dt;
      } else {
        st.at = false;
        st.away += dt;
      }
      if (!st.fired && !st.engaged && (st.attempts >= GRAFT_SEARCH.attempts || st.dwell >= GRAFT_SEARCH.dwellS)) {
        st.fired = true;
        out.push(s);
      }
    }
    return out;
  }

  /** Attempts and dwell so far at a graft (tests, the debrief). */
  progress(treeName: string): { attempts: number; dwellS: number; engaged: boolean; fired: boolean } | null {
    const st = this.st.get(treeName);
    return st ? { attempts: st.attempts, dwellS: st.dwell, engaged: st.engaged, fired: st.fired } : null;
  }
}

const radial = (az: number): Vec3 => V(Math.cos(az), 0, Math.sin(az));

const axisPoint = (h: number): Vec3 => V(0, h, 0);

/** Apply the geometric aortic tilt to convert an aortic-frame point to world. */
export const toWorld = (model: AnatomyModel, p: Vec3): Vec3 =>
  rotateZ(p, model.aortaTiltRad);

function branch(from: Vec3, deltas: Vec3[]): Vec3[] {
  const pts = [from];
  let cur = from;
  for (const d of deltas) {
    cur = add(cur, d);
    pts.push(cur);
  }
  return pts;
}

/** Points on an arc round the aortic axis at radius r, from azimuth a0 to a1 (radians, either way round) and height h0 to h1, ends excluded. */
function arcAround(r: number, a0: number, a1: number, h0: number, h1: number, n: number): Vec3[] {
  const out: Vec3[] = [];
  for (let k = 1; k < n; k++) {
    const t = k / n;
    out.push(add(scale(radial(a0 + (a1 - a0) * t), r), axisPoint(h0 + (h1 - h0) * t)));
  }
  return out;
}

const ostiumAt = (R: number, az: number, height: number, down: number): Ostium => ({
  az,
  height,
  pos: add(scale(radial(az), R), axisPoint(height)),
  dir: normalize(add(radial(az), V(0, down, 0))),
});

export function buildAnatomy(c: AnatomyCase): AnatomyModel {
  const has = (v: (typeof c.variants)[number]) => c.variants.includes(v);
  const R = has("very-dilated-root") ? VERY_DILATED_ROOT_RADIUS : ROOT_RADIUS[c.rootSize];
  const rot = deg2rad(c.rootRotationDeg);
  const tilt = deg2rad(c.aortaTiltDeg);

  // Tilt perturbs the effective approach (adds engagement difficulty).
  const tiltAz = tilt * 0.35;
  const tiltH = -c.aortaTiltDeg * 0.12;

  const anomRca = has("anomalous-rca-left-sinus");
  const anomLm = has("anomalous-lm-right-sinus");
  // the two circumflex anomalies exclude each other; from the right sinus wins when both are given
  const anomLcx = has("anomalous-lcx-right-sinus");
  const lcxFromRca = !anomLcx && has("anomalous-lcx-from-rca");
  const separate = has("separate-ostia") && !anomLcx && !lcxFromRca && !anomLm;
  const highLift = has("high-ostia") ? HIGH_OSTIA_LIFT_MM : 0;

  // ---- LM ostium (left coronary sinus, left-posterior ~ -30°) ----
  // Ostial heights: the left main arises closer to the annulus than the RCA (Philip et al. 2015,
  // doi:10.1002/ccd.25948, MDCT of 400 roots: "The mean distance from the aortic annulus to the left main
  // coronary ostium was less than the right coronary ostium"). The values in mm are model parameters.
  const leftSinusAz = deg2rad(-30) + rot + tiltAz;
  const lmHeight0 = LM_OSTIUM_HEIGHT + tiltH + highLift;
  const lmLen = has("short-lm") ? 5 : has("long-lm") ? 16 : 9;

  // ---- RCA ostium (right coronary sinus, right-anterior ~ 150°) ----
  const rightSinusAz = deg2rad(150) + rot + tiltAz;
  let rcaAz = rightSinusAz;
  let rcaHeight = RCA_OSTIUM_HEIGHT + tiltH + highLift;
  if (has("high-rca")) rcaHeight += 6;
  if (has("superior-rca")) {
    rcaHeight += 8;
    rcaAz += deg2rad(10);
  }
  if (has("anterior-rca")) rcaAz -= deg2rad(28);
  if (has("shepherds-crook-rca")) rcaHeight += 5;

  // the ostia of the usual anatomy (an anomalous artery is grown into its usual bed from them)
  const usualLm = ostiumAt(R, leftSinusAz, lmHeight0, -0.2);
  const usualRca = ostiumAt(R, rcaAz, rcaHeight, -0.25);

  let lm: Ostium = usualLm;
  let rca: Ostium = usualRca;
  if (anomRca) {
    // RCA from the left sinus, near the left-right commissure, higher than the left main
    const az = leftSinusAz + deg2rad(ANOM_RCA_LEFT.dAzDeg);
    rca = { ...ostiumAt(R, az, lmHeight0 + ANOM_RCA_LEFT.dHeight, -0.25), az: rcaAz };
  }
  if (anomLm) {
    // left main from the right sinus, anterior to the RCA ostium towards the left-right commissure
    const az = rcaAz + deg2rad(ANOM_LM_RIGHT.dAzDeg);
    lm = { ...ostiumAt(R, az, rcaHeight + ANOM_LM_RIGHT.dHeight, -0.2), az: leftSinusAz };
  }
  // the ostium's own azimuth (computed only where it differs, so the usual anatomy is unchanged to the last bit)
  const rcaOsAz = anomRca ? ostiumAz(rca) : rcaAz;
  const lmOsAz = anomLm ? ostiumAz(lm) : leftSinusAz;

  // Conus branch: first RCA branch, higher & more anterior than the RCA ostium; with its own large
  // ostium right beside the RCA's in the conus-separate-ostium variant. With the RCA from the left sinus
  // the conus keeps its place in the right sinus, opening there on its own (MODEL PARAMETER), so a
  // catheter aimed at the anomalous RCA in the left sinus is not judged against a conus beside it, and a
  // right catheter in the empty right sinus finds only the conus.
  const conusSep = has("conus-separate-ostium");
  const conusOwn = conusSep || anomRca;
  const conusRef = anomRca ? usualRca : rca;
  const conusRefAz = anomRca ? rcaAz : rcaOsAz;
  const conusAz = conusRefAz + deg2rad(conusSep ? CONUS_SEPARATE.dAzDeg : -18);
  const conusHeight = conusRef.height + (conusSep ? CONUS_SEPARATE.dHeight : 4);
  const conus: Ostium = {
    az: conusAz,
    height: conusHeight,
    pos: add(scale(radial(conusAz), R), axisPoint(conusHeight)),
    dir: normalize(add(radial(conusAz), V(0, 0.15, 0))), // points up/anterior
  };

  // Separate LAD/LCx ostia (no true left main), or the circumflex's own ostium in the right sinus
  let leftOstium2: Ostium | null = null;
  if (anomLcx) {
    // circumflex from the right sinus, just posterior to the RCA ostium (retroaortic course)
    const az2 = rcaOsAz + deg2rad(ANOM_LCX_RIGHT.dAzDeg);
    leftOstium2 = ostiumAt(R, az2, rca.height + ANOM_LCX_RIGHT.dHeight, -0.2);
  } else if (separate) {
    const az2 = lmOsAz + deg2rad(18);
    leftOstium2 = ostiumAt(R, az2, lm.height - 2, -0.2);
  }

  // ---- Build vessel polylines (aortic frame) ----
  // built in dependency order, listed in the original order (LM, LAD, branches, LCx, marginals, ramus,
  // RCA, conus, AM, PDA, PLV): the physics lumens and the legacy renderer iterate them in this order
  const built = new Map<VesselId, VesselPath>();
  const vessels = { push: (v: VesselPath) => void built.set(v.id, v) };
  // the left main bifurcation lies where the usual left main would end
  const lmDir = radial(leftSinusAz);
  const bif = add(usualLm.pos, add(scale(lmDir, lmLen), V(0, -3, 0)));
  const Rc = R + COURSE_CLEAR_MM;

  if (!separate) {
    if (anomLm) {
      // from the right sinus forwards between the aorta and the pulmonary trunk (interarterial), then to the bifurcation
      const a0 = lmOsAz;
      const a1 = leftSinusAz + deg2rad(20);
      const arc = arcAround(Rc, a0, a1 > a0 ? a1 - 2 * Math.PI : a1, lm.height, bif.y + 2, 6);
      vessels.push({ id: "LM", points: [lm.pos, ...arc, bif], radius: 1.7 });
    } else vessels.push({ id: "LM", points: [lm.pos, bif], radius: 1.7 });
  }

  // LAD — anterior interventricular groove toward apex
  const ladStart = separate ? lm.pos : bif;
  const lad = branch(ladStart, [
    V(2, -6, 8),
    V(3, -12, 12),
    V(2, -14, 12),
    V(-2, -14, 8),
    V(-4, -12, 2),
  ]);
  vessels.push({ id: "LAD", points: lad, radius: 1.3 });
  // Diagonals
  vessels.push({
    id: "D1",
    points: branch(lad[1], [V(9, -8, 2), V(10, -9, 0)]),
    radius: 0.8,
  });
  vessels.push({
    id: "D2",
    points: branch(lad[2], [V(8, -9, 0), V(8, -10, -2)]),
    radius: 0.7,
  });
  // Septal (into the septum, posterior)
  vessels.push({
    id: "SEPTAL",
    points: branch(lad[1], [V(-2, -6, -6), V(-2, -7, -7)]),
    radius: 0.6,
  });

  // RCA — right AV groove around to the crux (built before the circumflex, which may arise from it)
  const rcaDir = radial(rcaAz);
  const rcaLead: Vec3[] = [];
  let rStart = rca.pos;
  if (anomRca) {
    // interarterial: forwards between the aorta and the pulmonary trunk, round the front of the root to the right sinus
    const a0 = rcaOsAz;
    const arc = arcAround(Rc, a0, rcaAz > a0 ? rcaAz : rcaAz + 2 * Math.PI, rca.height, rcaHeight, 6);
    rcaLead.push(rca.pos, ...arc);
    rStart = add(scale(radial(rcaAz), Rc), axisPoint(rcaHeight));
  }
  const rcaDeltas: Vec3[] = [];
  if (has("shepherds-crook-rca")) {
    rcaDeltas.push(V(rcaDir.x * 4, 6, rcaDir.z * 4)); // rises first (crook)
    rcaDeltas.push(V(rcaDir.x * 4, -8, rcaDir.z * 2));
  } else {
    rcaDeltas.push(add(scale(rcaDir, 6), V(0, -4, 0)));
  }
  rcaDeltas.push(V(3, -12, -6));
  if (has("tortuous-rca")) {
    rcaDeltas.push(V(4, -6, -2), V(-2, -6, -4), V(4, -6, -2));
  } else {
    rcaDeltas.push(V(4, -10, -8));
  }
  const coDominant = c.dominance === "codominant";
  const rightGivesCrux = c.dominance === "right" || coDominant;
  if (rightGivesCrux) rcaDeltas.push(V(2, -6, -6)); // to crux
  const rcaPath = [...rcaLead, ...branch(rStart, rcaDeltas)];
  vessels.push({ id: "RCA", points: rcaPath, radius: 1.2 });
  const rcaMain = rcaLead.length; // index of the first point of the RCA's usual course

  // LCx — left AV groove, posterior/left and down
  let lcxLead: Vec3[] = [];
  let lcxStart = separate && leftOstium2 ? leftOstium2.pos : bif;
  if (anomLcx || lcxFromRca) {
    // retroaortic: from the right sinus (or the proximal RCA) behind the root into the left AV groove
    const from = anomLcx && leftOstium2 ? leftOstium2.pos : rcaPath[Math.min(rcaPath.length - 1, rcaMain + 1)];
    const a0 = Math.atan2(from.z, from.x);
    const a1 = leftSinusAz;
    // the posterior way round: azimuth increasing through 270 degrees (z < 0)
    const end = a1 < a0 ? a1 + 2 * Math.PI : a1;
    lcxLead = [from, ...arcAround(Rc, a0, end, from.y, bif.y, 8)];
    lcxStart = add(scale(radial(a1), Rc), axisPoint(bif.y));
  }
  const lcxDeltas: Vec3[] = [
    V(2, -3, -6),
    V(0, -9, -9),
    V(-4, -10, -6),
  ];
  const leftDominant = c.dominance === "left";
  if (leftDominant) lcxDeltas.push(V(-6, -8, -2), V(-6, -8, 4)); // reaches crux/PDA
  else if (coDominant) lcxDeltas.push(V(-5, -6, -2));
  const lcx = [...lcxLead, ...branch(lcxStart, lcxDeltas)];
  vessels.push({ id: "LCx", points: lcx, radius: 1.1 });
  const lcxMain = lcxLead.length;
  // Obtuse marginals
  vessels.push({
    id: "OM1",
    points: branch(lcx[lcxMain + 1], [V(6, -7, -3), V(7, -8, -2)]),
    radius: 0.8,
  });
  vessels.push({
    id: "OM2",
    points: branch(lcx[lcxMain + 2], [V(4, -8, -2), V(4, -9, 0)]),
    radius: 0.7,
  });

  // Ramus intermedius
  if (has("ramus")) {
    vessels.push({
      id: "RAMUS",
      points: branch(bif, [V(7, -8, 3), V(8, -10, 2)]),
      radius: 0.8,
    });
  }

  // Conus (up, anterior); from its own ostium beside the RCA's in the conus-separate-ostium variant, and
  // from its own ostium in the right sinus when the RCA arises from the left sinus
  vessels.push({
    id: "CONUS",
    points: conusOwn ? branch(conus.pos, [V(2, 3, 5), V(2, 2, 4)]) : branch(rcaPath[rcaMain + 1], [V(2, 4, 4)]),
    radius: conusSep ? 0.7 : 0.5,
  });
  // Acute marginal
  const amIdx = Math.min(rcaMain + 2, rcaPath.length - 1);
  vessels.push({
    id: "AM",
    points: branch(rcaPath[amIdx], [V(4, -8, 6), V(4, -9, 6)]),
    radius: 0.7,
  });

  // PDA & PLV — from whichever vessel reaches the crux
  const cruxSource = rightGivesCrux ? rcaPath : lcx;
  const crux = cruxSource[cruxSource.length - 1];
  vessels.push({
    id: "PDA",
    points: branch(crux, [V(-2, -8, 6), V(-2, -9, 8)]),
    radius: 0.8,
  });
  vessels.push({
    id: "PLV",
    points: branch(crux, [V(-6, -4, 0), V(-7, -5, -2)]),
    radius: 0.7,
  });

  // ---- Cusps (for labels): the sinus centres, wherever the ostia are ----
  const cuspH = 6;
  const cusps: AnatomyModel["cusps"] = [
    { id: "LCC", pos: add(scale(radial(leftSinusAz), R * 0.9), axisPoint(cuspH)) },
    { id: "RCC", pos: add(scale(radial(rcaAz), R * 0.9), axisPoint(cuspH)) },
    {
      id: "NCC",
      pos: add(scale(radial(leftSinusAz + deg2rad(-150)), R * 0.9), axisPoint(cuspH)),
    },
  ];

  // high ostia sit at or above the sinotubular junction: the engageable zone reaches them
  const sinusTopY = highLift > 0 ? Math.max(SINUS_TOP_Y, rca.height + 4, lm.height + 4) : SINUS_TOP_Y;

  const ORDER: VesselId[] = ["LM", "LAD", "D1", "D2", "SEPTAL", "LCx", "OM1", "OM2", "RAMUS", "RCA", "CONUS", "AM", "PDA", "PLV"];
  const vesselList = ORDER.filter((id) => built.has(id)).map((id) => built.get(id)!);
  // a vessel ORDER does not list keeps its place after the listed ones (never dropped)
  for (const [id, v] of built) if (!ORDER.includes(id)) vesselList.push(v);

  const model: AnatomyModel = {
    sinusRadius: R,
    valvePlaneY: VALVE_PLANE_Y,
    sinusTopY,
    lm,
    rca,
    conus,
    leftOstium2,
    vessels: vesselList,
    cusps,
    aortaTiltRad: tilt,
    dominance: c.dominance,
    sinusOf: { rca: anomRca ? "left" : "right", lcx: anomLcx || lcxFromRca ? "right" : "left" },
  };
  // fields of the anomaly work, present only where they say something (cases without them keep their model)
  if (anomLm) model.sinusOf!.lm = "right";
  if (anomRca || anomLm) model.usual = { lm: usualLm, rca: usualRca };
  if (anomRca || anomLm || anomLcx || lcxFromRca) model.sinusAz = { left: leftSinusAz, right: rcaAz };
  if (anomLcx || lcxFromRca) model.lcxOrigin = anomLcx ? "right-sinus" : "rca";
  // bypass grafts on the ascending aorta (diag-grafts-svg): only cases with grafts carry the field
  if (c.grafts?.length) {
    const g = graftSites(c, R, sinusTopY);
    if (g.length) model.grafts = g;
  }
  return model;
}

/** The sinus azimuths of a model (the usual left main and RCA azimuths when the model records none). */
export const sinusAzimuths = (model: AnatomyModel): { left: number; right: number } => model.sinusAz ?? { left: model.lm.az, right: model.rca.az };

/**
 * The anomalous-origin variants (the four origin variants of found-case-model-types): the variants for which the lab's
 * context is to raise 'anomalous-origin' in random cases too (the diag-tip-context follow-up of diag-anatomy-variants;
 * today only the scenario scripts raise it). A subset of caseGenerator.ANOMALY_VARIANTS, which also draws high ostia
 * and the fistula.
 */
export const ANOMALOUS_ORIGIN_VARIANTS = ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca", "anomalous-rca-left-sinus", "anomalous-lm-right-sinus"] as const;

export const LEFT_VESSELS: VesselId[] = [
  "LM",
  "LAD",
  "LCx",
  "D1",
  "D2",
  "OM1",
  "OM2",
  "RAMUS",
  "SEPTAL",
];
export const RIGHT_VESSELS: VesselId[] = ["RCA", "CONUS", "AM", "PDA", "PLV"];

/** The circumflex system: the vessels that follow the circumflex to the side it arises on. */
const LCX_SYSTEM: readonly VesselId[] = ["LCx", "OM1", "OM2"];

/** The circumflex arises on the right (its own ostium in the right sinus, or the proximal RCA). */
export const circumflexOnRight = (model: AnatomyModel): boolean => model.sinusOf?.lcx === "right" || model.lcxOrigin !== undefined;

/**
 * The vessels a selective injection on one side fills, for the analytic fill lists (contrast.ts leftFill and
 * rightFill). With the usual anatomy this is LEFT_VESSELS (plus the PDA and PLV in left dominance) or
 * RIGHT_VESSELS (plus the PDA and PLV when the right gives the crux), as those lists have always been. When the
 * circumflex arises on the right, the circumflex, its marginals and, in left dominance, the PDA and PLV it gives
 * fill from the right injection and not from the left, as the render tree's fillIds do
 * (src/render/xray/coronaryGrowth.ts anomalyFinish), so a left run leaves the lateral wall empty.
 */
export function injectionFill(model: AnatomyModel, side: "left" | "right"): VesselId[] {
  const present = (v: VesselId) => model.vessels.some((x) => x.id === v);
  const lcxRight = circumflexOnRight(model);
  if (side === "left") {
    const base = LEFT_VESSELS.filter((v) => present(v) && !(lcxRight && LCX_SYSTEM.includes(v)));
    if (model.dominance === "left" && !lcxRight) base.push("PDA", "PLV");
    return base;
  }
  const base = RIGHT_VESSELS.filter(present);
  if (lcxRight) for (const v of LCX_SYSTEM) if (present(v)) base.push(v);
  if (model.dominance === "right" || model.dominance === "codominant" || lcxRight) {
    if (!base.includes("PDA")) base.push("PDA", "PLV");
  }
  return base;
}

export const VESSEL_NAMES: Record<VesselId, string> = {
  LM: "Left main",
  LAD: "Left anterior descending",
  LCx: "Left circumflex",
  RCA: "Right coronary artery",
  D1: "First diagonal",
  D2: "Second diagonal",
  OM1: "First obtuse marginal",
  OM2: "Second obtuse marginal",
  RAMUS: "Ramus intermedius",
  SEPTAL: "Septal perforator",
  PDA: "Posterior descending artery",
  PLV: "Posterolateral branch",
  CONUS: "Conus branch",
  AM: "Acute marginal",
};
