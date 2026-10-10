// ---------------------------------------------------------------------------
// Ultrasound-guided arterial puncture: needle physics and a synthetic B-mode.
//
// The needle is a straight line from its skin entry, pointing proximally at
// `angleDeg` from the skin with a small sideways `yawDeg`. As it advances it
// meets each vessel's near wall, indents it (tenting), and goes through once
// the indentation passes the wall's limit. The tip is then in the lumen until
// it reaches and punctures the back wall (through-and-through). A small,
// mobile radial artery hit off-centre rolls away instead of puncturing.
// Flashback follows the bevel: pulsatile bright blood only when the bevel is
// inside an arterial lumen, dark and steady blood from a vein, sluggish when
// the bevel straddles the wall. The wire passes only from a bevel fully in the
// lumen at a workable angle; otherwise it meets resistance and, if forced,
// goes subintimal.
//
// At the groin (access-femoral-puncture) the needle meets anterior-wall
// calcium as a hard wall: it tents further and then glances off sideways
// instead of entering (a model of 'puncture clear of calcium'). A needle can
// be plugged (a scenario's scripted hub event): no blood reaches the hub,
// whatever the tip is in, until it is taken out and flushed. Once the
// 0.018 inch micropuncture wire runs free in the common femoral artery it
// takes a course: up the iliac artery, or into the inferior epigastric
// (medially) or lateral circumflex iliac (laterally) when the entry is high
// and the needle aimed that way, or down the leg when a steep needle enters
// just above the bifurcation (MODEL rules, MP_MICRO), or the course a
// scenario scripts for the first wire. The course is seen only on
// fluoroscopy; a wire in a small branch stops after a short run (resistance).
// Pulling the wire back below the branch lets it be re-advanced.
//
// renderBMode() draws the probe's image (short axis = transverse, long axis =
// along the vessel) into an RGBA buffer: speckle locked to the tissue,
// layered skin, fat and muscle, anechoic lumens with bright specular walls,
// posterior enhancement under fluid, bone with its acoustic shadow, the needle
// as a bright reflector with reverberation, tenting of the wall, the wire and
// the sheath in the lumen, and a haematoma as a hypoechoic collection.
//
// Upsizing (access-femoral-upsizing-angiogram): a micropuncture dilator over
// the wire fills the arteriotomy like the sheath and is drawn in the lumen as
// a short sheath; the 0.035 inch wire that replaces the micro-wire runs up the
// iliac artery (exchangeWire). The sequence itself is upsizing.ts.
//
// A prior closure device (proc-chart-planted-problems): an anchor-and-collagen
// plug left in the groin by a recent procedure is drawn when the caller passes
// it (BModeExtras.priorPlug): an echogenic plug on the outer anterior wall of
// the common femoral artery over the old arteriotomy, and the anchor as a thin
// bright bar on the inner wall (MP_PRIOR_PLUG, drawing sizes).
//
// The radial sequence (access-radial-sequence). The local anaesthetic at the
// wrist is a volume infiltrated at the probe (infiltrate): it is drawn as a
// hypoechoic bleb under the skin, and above about 1 mL it presses the radial
// artery flat for a minute or two (blebSquashAt: a tissue-pressure term that
// fades with time and with distance along the artery; MP_LOCAL). The
// artery's tone (radialSpasm.ts, set by the session as `tone` and `spasm`)
// narrows its lumen and slows the flashback; at a poor flash the wire will not
// pass. Both narrow the lumen the needle meets (lumenScale), so a flattened or
// narrowed artery is easier to miss or to transfix. At the needle tip the
// wire meets resistance when the bevel entered the side of the artery (it
// passes once the bevel is turned towards the lumen: rotateBevel) or when the
// wrist is not extended (the bend just past the puncture straightens once it
// is); both from Brilakis 4.3 in pm-access-radial-sheath, step 6.
// ---------------------------------------------------------------------------

import { calcifiedAt, inExtent, tubeAt, tubeRadii, type AccessSite, type LumenScale, type UsTube } from "./site";
import { radialLumenScale, spasmFlash } from "./radialSpasm";

export type ProbeOrient = "short" | "long";

export interface Probe {
  /** probe centre on the skin (mm, site frame) */
  x: number;
  y: number;
  orient: ProbeOrient;
  /** 0 resting on the skin … 1 firm pressure */
  pressure: number;
  /** imaging depth (mm) */
  depthMm: number;
  /** overall gain (1 = default) */
  gain: number;
}

export interface NeedlePose {
  /** skin entry point (mm) */
  entryX: number;
  entryY: number;
  /** angle from the skin surface (deg) */
  angleDeg: number;
  /** sideways deviation of the needle direction (deg, + lateral) */
  yawDeg: number;
}

export interface NeedleState extends NeedlePose {
  /** length inserted beyond the skin (mm) */
  inserted: number;
}

interface WallState {
  frontTent: number;
  frontHole: boolean;
  backTent: number;
  backHole: boolean;
  /** lateral shift of a rolled artery for this pass (mm) */
  roll: number;
  /** the needle glanced off this vessel's calcified wall: it slides past it until redirected or withdrawn */
  glanced?: boolean;
  /**
   * radial: the tented front wall met the back wall and the needle went through both at this needle length (mm): the
   * lumen stays closed to the bevel until the needle is drawn back from it (MP_NEEDLE.transfixReopenMm)
   */
  transfix?: number;
}

export type FlashKind = "none" | "arterial" | "sluggish" | "venous";

export interface Flashback {
  kind: FlashKind;
  /** the vessel the bevel opens into */
  vessel: string | null;
  /** fraction of the bevel opening inside that lumen (0..1) */
  lumenFraction: number;
  /** the needle is plugged: no blood reaches the hub whatever the bevel opens into */
  plugged?: boolean;
  /** the blood comes slowly (a radial artery in spasm; access-radial-sequence) */
  slow?: boolean;
}

/** A bleb of local anaesthetic infiltrated at the wrist (access-radial-sequence). */
export interface LocalBleb {
  /** where it was infiltrated (site frame, mm) */
  x: number;
  y: number;
  /** volume (mL) */
  ml: number;
  /** session time it was given (s) */
  at: number;
}

/** Where a micropuncture wire runs once it is free in the common femoral artery. */
export type MicroWireCourse = "iliac" | "iea" | "lcia" | "down-leg";
export const MICRO_WIRE_COURSES: readonly MicroWireCourse[] = ["iliac", "iea", "lcia", "down-leg"];

export interface WireAtNeedle {
  state: "intraluminal" | "subintimal" | "blocked";
  /** wire length beyond the needle tip (mm) */
  beyondMm: number;
  vessel: string | null;
  /** the wire is held up in the vessel (resistance felt) */
  resistance: number;
}

export interface Hole {
  vessel: string;
  x: number;
  back: boolean;
  /** the skin pass that made it (a hole the needle or wire still fills does not bleed) */
  pass: number;
  /** the hole is occupied by the sheath (does not bleed) */
  plugged: boolean;
}

export interface PunctureState {
  needle: NeedleState | null;
  walls: Record<string, WallState>;
  /** skin entries */
  passes: number;
  /** front-wall punctures of the target artery */
  arterialPunctures: number;
  /** back-wall punctures of any artery */
  backWalls: number;
  veinPunctures: number;
  /** punctures of an artery other than the target (SFA or profunda) */
  otherArteryPunctures: number;
  nerveContacts: number;
  holes: Hole[];
  /** haematoma around the artery (mL), grown by the session from the open holes */
  haematomaMl: number;
  wire: WireAtNeedle | null;
  /** where the wire entered the artery (site x, mm) and through which vessel */
  arteriotomy: { x: number; vessel: string } | null;
  /** the needle has been removed over the wire */
  needleRemoved: boolean;
  /** the sheath is in (drawn in the lumen) */
  sheathFr: number | null;
  /**
   * A micropuncture or exchange dilator is in over the wire (its French size; drawn in the lumen like a short
   * sheath), or null (access-femoral-upsizing-angiogram). Optional so that older snapshots stay valid.
   */
  dilatorFr?: number | null;
  /** the needle is plugged (no flashback) until it is taken out and flushed */
  needlePlugged: boolean;
  /** the micro-wire's course once it runs free in the common femoral artery (null before, or at the wrist) */
  wireCourse: MicroWireCourse | null;
  /** a scripted course for the next free wire (a scenario setting), used once */
  courseScript: MicroWireCourse | null;
  /** resistance has been felt with the wire in a small branch on this course */
  branchResistance: boolean;
  /** radial: blebs of local anaesthetic infiltrated at the wrist (optional: older snapshots have none) */
  blebs?: LocalBleb[];
  /** radial: where the needle entered the target artery on this pass, as a share of its half-width off the centre (+ lateral), or null */
  entryEcc?: number | null;
  /** radial: the bevel has been turned towards the lumen on this pass */
  bevelTurned?: boolean;
}

export type PunctureEvent =
  | { kind: "skin-pass" }
  | { kind: "tenting"; vessel: string }
  | { kind: "front-wall"; vessel: string; artery: boolean; target: boolean }
  | { kind: "back-wall"; vessel: string; artery: boolean }
  | { kind: "rolled"; vessel: string }
  | { kind: "nerve"; vessel: string }
  | { kind: "wire-free"; vessel: string; venous: boolean }
  | { kind: "wire-resistance"; reason: "partial-bevel" | "steep" | "no-lumen" | "back-wall" | "branch" | "plugged" | "bevel-side" | "wrist-flexed" }
  | { kind: "deflected"; vessel: string }
  | { kind: "wire-course"; course: MicroWireCourse }
  | { kind: "wire-subintimal" }
  | { kind: "redirect-blocked" };

/** MODEL PARAMETERS of the needle model (facts/C5.md lists them). */
export const MP_NEEDLE = {
  /** bevel opening length of a 21 G needle (mm) */
  bevelMm: 1.0,
  /** needle length (mm) by site */
  lengthRadial: 38,
  lengthFemoral: 70,
  /** indentation before the wall gives (mm): front, back; radial and femoral; veins */
  tentFrontRadial: 1.3,
  tentBackRadial: 0.8,
  tentFrontFemoral: 2.0,
  tentBackFemoral: 1.3,
  tentVein: 1.6,
  /** a mobile radial artery rolls when hit further off-centre than this share of its radius */
  rollEccentricity: 0.62,
  /** the wire passes freely only from a bevel at least this much in the lumen */
  wireLumenFraction: 0.8,
  /** steeper than this (deg) the wire tends to meet the back wall */
  wireSteepDeg: 58,
  /**
   * the same at the groin (access-femoral-puncture): a deep common femoral artery may be punctured at about
   * 70 degrees (Brilakis 4.2, step 6, his second option), so the wire must pass from a needle that steep;
   * the limit itself is a MODEL PARAMETER
   */
  wireSteepDegFemoral: 75,
  /** forcing more than this length against resistance raises the wire into the wall (mm) */
  wireForceMm: 4,
  /** the needle can only be redirected with its tip in the subcutaneous layer (mm below the fat) */
  redirectDepthMm: 1.5,
  /** elevational beam half-thickness (mm): what lies within this distance of the image plane is seen */
  beamHalfMm: 0.6,
  /** probe footprint (mm) */
  footprintMm: 38,
  /** a calcified anterior wall: indentation before the needle glances off it (mm), and the sideways turn (deg) */
  tentCalcified: 2.6,
  calciumDeflectDeg: 9,
  /** radial: an entry further off the artery's centre than this share of its half-width leaves the bevel facing the side wall */
  bevelSideEcc: 0.35,
  /**
   * radial: the tented front wall of a flattened lumen meets the back wall once its indentation reaches this share of
   * the lumen's height (2 x the vertical semi-axis); the needle then goes through both walls together with no flash on
   * the way in (a squashed artery is 'harder to enter', pm-access-radial-puncture, step 4)
   */
  collapseShare: 1,
  /** radial: the lumen counts as flattened (and can close under the tent) when its height is less than this share of its width */
  collapseFlatness: 0.7,
  /** radial: after both walls went together, the lumen opens to the bevel once the needle is drawn back this far (mm) */
  transfixReopenMm: 0.3,
};

/**
 * The local anaesthetic at the wrist (access-radial-sequence). Brilakis injects about 1 mL and Oxford 1-2 mL; larger
 * volumes squash the artery, which recovers in 1-2 minutes, or the operator moves along it (pm-access-radial-puncture,
 * step 4). The sizes and times here are MODEL PARAMETERS chosen to give that behaviour.
 */
export const MP_LOCAL = {
  /** volume (mL) that presses on nothing: Brilakis's 'about 1 mL' */
  freeMl: 1,
  /** squash of the artery's vertical lumen per mL above freeMl, and its most */
  squashPerMl: 0.25,
  squashMax: 0.85,
  /** the squash fades with this time constant (s): mostly gone by 1-2 minutes */
  squashTauS: 40,
  /** how far along the artery it reaches (mm): base plus per mL (a Gaussian fall-off) */
  spreadBaseMm: 6,
  spreadPerMl: 3,
  /** the bleb drawn on the image disperses with this time constant (s) */
  disperseTauS: 150,
};

/** How much a set of blebs flattens the artery at site x at time nowS (0 none … squashMax). */
export function blebSquashAt(blebs: readonly LocalBleb[] | undefined, x: number, nowS: number): number {
  if (!blebs || !blebs.length) return 0;
  let sq = 0;
  for (const b of blebs) {
    const excess = b.ml - MP_LOCAL.freeMl;
    if (excess <= 0) continue;
    const age = Math.max(0, nowS - b.at);
    const spread = MP_LOCAL.spreadBaseMm + MP_LOCAL.spreadPerMl * b.ml;
    sq += Math.min(MP_LOCAL.squashMax, excess * MP_LOCAL.squashPerMl) * Math.exp(-age / MP_LOCAL.squashTauS) * Math.exp(-((x - b.x) ** 2) / (2 * spread * spread));
  }
  return Math.min(MP_LOCAL.squashMax, sq);
}

/**
 * MODEL PARAMETERS of the micro-wire course (access-femoral-puncture). None is a population value: they
 * set when the model sends the wire into a branch so that the textbook causes (a high entry aimed medially
 * or laterally, a steep entry near the bifurcation; Brilakis 4.2, steps 7 and 8) produce the textbook signs.
 */
export const MP_MICRO = {
  /** the wire can enter a branch whose origin lies up to this far above the entry (mm) */
  branchReachMm: 25,
  /** needle aim at least this far medial (IEA) or lateral (LCIA) (deg) */
  branchYawDeg: 6,
  /** a needle at least this steep (deg) entering within downLegReachMm above the bifurcation sends the wire down the leg */
  downLegAngleDeg: 50,
  downLegReachMm: 8,
  /** a wire runs freely this far into a small branch before it stops (mm) */
  branchFreeMm: 30,
  /** forward progress against the stop (share of the push) */
  branchCreep: 0.15,
};

/**
 * The course a micro-wire takes from an entry into the target artery (pure): the scripted course when
 * there is one; otherwise the model rule (MP_MICRO). The entry vessel must be the common femoral artery;
 * any other entry runs up the vessel it entered.
 */
export function microWireCourse(site: AccessSite, entry: { x: number; vessel: string }, pose: Pick<NeedlePose, "angleDeg" | "yawDeg">, script: MicroWireCourse | null = null): MicroWireCourse | null {
  if (site.kind !== "femoral" || entry.vessel !== site.arteryId || site.arteryId !== "cfa") return null;
  if (script) return script;
  const reach = (id: string) => {
    const b = site.branches.find((t) => t.id === id);
    if (!b) return false;
    const d = b.xFrom - entry.x;
    return d >= 0 && d <= MP_MICRO.branchReachMm;
  };
  if (pose.yawDeg <= -MP_MICRO.branchYawDeg && reach("iea")) return "iea";
  if (pose.yawDeg >= MP_MICRO.branchYawDeg && reach("lcia")) return "lcia";
  const bif = site.landmarks.bifurcationX;
  if (bif !== undefined && pose.angleDeg >= MP_MICRO.downLegAngleDeg && entry.x - bif <= MP_MICRO.downLegReachMm) return "down-leg";
  return "iliac";
}

/** How far the wire runs along the main artery from the entry before a course turns off it (mm); Infinity for the iliac course. */
export function courseTurnMm(site: AccessSite, entryX: number, course: MicroWireCourse | null): number {
  if (!course || course === "iliac") return Infinity;
  if (course === "down-leg") return 0;
  const b = site.branches.find((t) => t.id === course);
  return b ? Math.max(0, b.xFrom - entryX) : Infinity;
}

const deg = Math.PI / 180;

function needleDir(p: NeedlePose): { dx: number; dy: number; dz: number } {
  const th = p.angleDeg * deg;
  const ps = p.yawDeg * deg;
  return { dx: Math.cos(th) * Math.cos(ps), dy: Math.cos(th) * Math.sin(ps), dz: Math.sin(th) };
}

export function needlePoint(p: NeedlePose, L: number): { x: number; y: number; z: number } {
  const d = needleDir(p);
  return { x: p.entryX + d.dx * L, y: p.entryY + d.dy * L, z: d.dz * L };
}

export function needleTip(n: NeedleState): { x: number; y: number; z: number } {
  return needlePoint(n, n.inserted);
}

/** A lumen scale along the limb for one tube (null: none), from PunctureModel.lumenScale. */
type ScaleAt = ((x: number) => LumenScale | null) | null;

/** normalised distance from a tube's centre (1 = on its boundary), with an outward margin `grow` (mm) */
function qTube(t: UsTube, x: number, y: number, z: number, pressure: number, phase: number, grow: number, roll = 0, scaleAt: ScaleAt = null): number {
  if (!inExtent(t, x)) return 99;
  const c = tubeAt(t, x);
  const { ry, rz } = tubeRadii(t, pressure, phase, scaleAt ? scaleAt(x) : null);
  const a = ry + grow;
  const b = rz + grow;
  const dy = y - (c.y + roll);
  const dz = z - c.z;
  return Math.sqrt((dy / a) ** 2 + (dz / b) ** 2);
}

interface Crossing {
  /** first and last needle lengths inside the outer (wall) and inner (lumen) boundaries; null when missed */
  outer: [number, number] | null;
  inner: [number, number] | null;
}

function crossing(t: UsTube, pose: NeedlePose, maxL: number, wall: number, pressure: number, phase: number, roll: number, scaleAt: ScaleAt = null): Crossing {
  const step = 0.05;
  let oa = -1,
    ob = -1,
    ia = -1,
    ib = -1;
  for (let L = 0; L <= maxL; L += step) {
    const p = needlePoint(pose, L);
    const qo = qTube(t, p.x, p.y, p.z, pressure, phase, wall, roll, scaleAt);
    if (qo < 1) {
      if (oa < 0) oa = L;
      ob = L;
      const qi = qTube(t, p.x, p.y, p.z, pressure, phase, 0, roll, scaleAt);
      if (qi < 1) {
        if (ia < 0) ia = L;
        ib = L;
      }
    } else if (oa >= 0) break; // first crossing only
  }
  return { outer: oa >= 0 ? [oa, ob] : null, inner: ia >= 0 ? [ia, ib] : null };
}

export function freshPuncture(): PunctureState {
  return {
    needle: null,
    walls: {},
    passes: 0,
    arterialPunctures: 0,
    backWalls: 0,
    veinPunctures: 0,
    otherArteryPunctures: 0,
    nerveContacts: 0,
    holes: [],
    haematomaMl: 0,
    wire: null,
    arteriotomy: null,
    needleRemoved: false,
    sheathFr: null,
    dilatorFr: null,
    needlePlugged: false,
    wireCourse: null,
    courseScript: null,
    branchResistance: false,
    blebs: [],
    entryEcc: null,
    bevelTurned: false,
  };
}

const newWall = (): WallState => ({ frontTent: 0, frontHole: false, backTent: 0, backHole: false, roll: 0 });

/**
 * The puncture model: one access site, the probe and the needle. Methods mutate `st` and return events for
 * the session (pain, attempts, mentor lines). Deterministic; `st` is plain data (JSON snapshot).
 */
export class PunctureModel {
  st: PunctureState;
  readonly site: AccessSite;
  probe: Probe;
  /** cardiac phase now (0..1), set each frame from the patient clock */
  phase = 0;
  /** radial: the artery's tone now (radialSpasm.ts level, 0..1), set by the session */
  spasm = 0;
  /** session time now (s), set by the session: the blebs of local anaesthetic fade with it */
  nowS = 0;
  constructor(site: AccessSite, st?: PunctureState) {
    this.site = site;
    this.st = st ?? freshPuncture();
    const tgt = site.tubes.find((t) => t.id === site.arteryId)!;
    const mid = (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
    this.probe = { x: mid, y: tubeAt(tgt, mid).y + (site.kind === "radial" ? 3 : 6), orient: "short", pressure: 0.15, depthMm: site.depthMm, gain: 1 };
  }

  get maxLength(): number {
    return this.site.kind === "radial" ? MP_NEEDLE.lengthRadial : MP_NEEDLE.lengthFemoral;
  }

  /**
   * The lumen scale of a tube along the limb now, or null when nothing narrows it: at the wrist the target artery is
   * narrowed by its tone (both axes) and flattened by a bleb of local anaesthetic (the vertical axis).
   */
  lumenScale(t: UsTube): ScaleAt {
    if (this.site.kind !== "radial" || t.id !== this.site.arteryId) return null;
    const tone = radialLumenScale(this.spasm);
    const blebs = this.st.blebs;
    if (tone >= 0.9999 && !(blebs && blebs.some((b) => b.ml > MP_LOCAL.freeMl))) return null;
    const now = this.nowS;
    return (x: number) => ({ ry: tone, rz: tone * (1 - blebSquashAt(blebs, x, now)) });
  }

  /**
   * Infiltrate `ml` of local anaesthetic at the probe over the target artery (access-radial-sequence): a bleb at the
   * probe's position along the artery, beside it under the skin. Radial sites only. Returns the bleb, or null.
   */
  infiltrate(ml: number, atS: number): LocalBleb | null {
    if (this.site.kind !== "radial" || !(ml > 0)) return null;
    const t = this.site.tubes.find((x) => x.id === this.site.arteryId);
    const y = t ? tubeAt(t, this.probe.x).y : this.probe.y;
    const b: LocalBleb = { x: this.probe.x, y, ml, at: atS };
    (this.st.blebs ??= []).push(b);
    return b;
  }

  /** How much the blebs flatten the target artery at site x now (0..MP_LOCAL.squashMax). */
  blebSquash(x: number): number {
    return blebSquashAt(this.st.blebs, x, this.nowS);
  }

  /** Turn the bevel towards the lumen (radial: the wire then passes a side-wall entry). Only with the needle in. */
  rotateBevel(): boolean {
    const n = this.st.needle;
    if (!n || n.inserted <= 0 || this.st.needleRemoved) return false;
    this.st.bevelTurned = true;
    return true;
  }

  /** Place a new needle at the skin (not inserted). Only when no needle is in the skin. */
  placeNeedle(pose: NeedlePose): boolean {
    if (this.st.needle && this.st.needle.inserted > 0) return false;
    if (this.st.wire && !this.st.needleRemoved) return false;
    this.st.needle = { ...pose, inserted: 0 };
    this.st.walls = {};
    this.st.entryEcc = null;
    this.st.bevelTurned = false;
    return true;
  }

  /** Change the needle direction; allowed only with the tip shallow (subcutaneous). */
  redirect(angleDeg: number, yawDeg: number): PunctureEvent[] {
    const n = this.st.needle;
    if (!n) return [];
    const tipZ = needleTip(n).z;
    if (n.inserted > 0 && tipZ > this.site.fatMm + MP_NEEDLE.redirectDepthMm) return [{ kind: "redirect-blocked" }];
    if (this.st.wire) return [{ kind: "redirect-blocked" }];
    n.angleDeg = Math.max(10, Math.min(80, angleDeg));
    n.yawDeg = Math.max(-25, Math.min(25, yawDeg));
    this.st.walls = {};
    return [];
  }

  private wall(id: string): WallState {
    return (this.st.walls[id] ??= newWall());
  }

  private tentLimits(t: UsTube): { front: number; back: number } {
    if (t.kind === "vein") return { front: MP_NEEDLE.tentVein, back: MP_NEEDLE.tentVein };
    return this.site.kind === "radial"
      ? { front: MP_NEEDLE.tentFrontRadial, back: MP_NEEDLE.tentBackRadial }
      : { front: MP_NEEDLE.tentFrontFemoral, back: MP_NEEDLE.tentBackFemoral };
  }

  private crossings(n: NeedlePose): Map<string, Crossing> {
    const m = new Map<string, Crossing>();
    for (const t of this.site.tubes) {
      const w = this.st.walls[t.id];
      const grow = t.kind === "artery" ? this.site.wallMm : t.kind === "vein" ? 0.15 : 0;
      m.set(t.id, crossing(t, n, this.maxLength, grow, this.probe.pressure, this.phase, w?.roll ?? 0, this.lumenScale(t)));
    }
    return m;
  }

  /** Advance (positive) or withdraw (negative) the needle by `mm`. */
  advanceNeedle(mm: number): PunctureEvent[] {
    const n = this.st.needle;
    if (!n || this.st.needleRemoved) return [];
    const ev: PunctureEvent[] = [];
    const target = n.inserted + mm;
    const step = 0.05 * Math.sign(mm || 1);
    const steps = Math.min(4000, Math.ceil(Math.abs(mm) / 0.05));
    if (n.inserted === 0 && mm > 0) {
      this.st.passes++;
      this.st.walls = {};
      this.st.entryEcc = null;
      this.st.bevelTurned = false;
      ev.push({ kind: "skin-pass" });
    }
    const cross = this.crossings(n);
    for (let k = 0; k < steps; k++) {
      const L = Math.max(0, Math.min(this.maxLength, k === steps - 1 ? target : n.inserted + step));
      if (this.st.wire && L < n.inserted) {
        // withdrawing the needle with a wire in it: the wire stays; treat as needle removal at the skin
      }
      const prev = n.inserted;
      n.inserted = L;
      for (const t of this.site.tubes) {
        const c = cross.get(t.id)!;
        if (!c.outer) continue;
        const w = this.wall(t.id);
        if (w.glanced) continue;
        const lim = this.tentLimits(t);
        const [oa] = c.outer;
        const inner = c.inner;
        if (L > prev) {
          // --- advancing ---
          if (t.kind === "nerve" || t.kind === "tendon") {
            if (prev < oa && L >= oa) {
              if (t.kind === "nerve") {
                this.st.nerveContacts++;
                ev.push({ kind: "nerve", vessel: t.id });
              }
            }
            continue;
          }
          if (!w.frontHole && L >= oa) {
            // the needle meets the near wall
            if (w.frontTent === 0) {
              ev.push({ kind: "tenting", vessel: t.id });
              // an off-centre hit on a small mobile artery rolls it away (a narrowed artery is a smaller target)
              if (this.site.kind === "radial" && t.kind === "artery") {
                const p = needlePoint(n, oa);
                const cc = tubeAt(t, p.x);
                const sc = this.lumenScale(t);
                const ecc = (p.y - cc.y) / (t.r * (sc ? sc(p.x)?.ry ?? 1 : 1));
                if (Math.abs(ecc) > MP_NEEDLE.rollEccentricity) {
                  w.roll = -Math.sign(ecc) * t.r * 1.6;
                  ev.push({ kind: "rolled", vessel: t.id });
                  // the artery has moved: recompute this vessel's crossing (now missed)
                  const grow = this.site.wallMm;
                  cross.set(t.id, crossing(t, n, this.maxLength, grow, this.probe.pressure, this.phase, w.roll, sc));
                  continue;
                }
              }
            }
            w.frontTent = L - oa;
            // a calcified anterior wall of the target artery does not give: the needle glances off sideways
            const calcified = t.id === this.site.arteryId && this.site.calcium.length > 0 && calcifiedAt(this.site, needlePoint(n, oa).x);
            if (calcified && w.frontTent <= MP_NEEDLE.tentCalcified) continue;
            if (calcified) {
              const cc = tubeAt(t, needlePoint(n, oa).x);
              const side = needlePoint(n, oa).y >= cc.y ? 1 : -1;
              n.yawDeg = Math.max(-25, Math.min(25, n.yawDeg + side * MP_NEEDLE.calciumDeflectDeg));
              // only the target's wall starts again: a vessel already entered on this pass keeps its holes
              this.st.walls[t.id] = { ...newWall(), glanced: true };
              ev.push({ kind: "deflected", vessel: t.id });
              for (const [id, c2] of this.crossings(n)) cross.set(id, c2);
              break;
            }
            // at the wrist: a flat or narrow lumen closes under the tent, and both walls go together
            if (!w.frontHole && w.frontTent <= lim.front && this.site.kind === "radial" && t.id === this.site.arteryId) {
              const pc = needlePoint(n, oa);
              const sc = this.lumenScale(t);
              const scale = sc ? sc(pc.x) : null;
              const { rz } = tubeRadii(t, this.probe.pressure, this.phase, scale);
              // only a flattened lumen closes so (a bleb pressing on it); a round artery narrowed by its tone does not
              const flat = !!scale && scale.rz < scale.ry * MP_NEEDLE.collapseFlatness;
              if (flat && w.frontTent >= 2 * rz * MP_NEEDLE.collapseShare) {
                w.frontHole = true;
                w.backHole = true;
                w.frontTent = 0;
                w.transfix = L;
                const pb = c.inner ? needlePoint(n, c.inner[1]) : pc;
                this.st.holes.push({ vessel: t.id, x: pc.x, back: false, plugged: false, pass: this.st.passes });
                this.st.holes.push({ vessel: t.id, x: pb.x, back: true, plugged: false, pass: this.st.passes });
                this.st.arterialPunctures++;
                this.st.backWalls++;
                this.st.entryEcc = (pc.y - (tubeAt(t, pc.x).y + w.roll)) / (t.r * (sc ? sc(pc.x)?.ry ?? 1 : 1));
                ev.push({ kind: "front-wall", vessel: t.id, artery: true, target: true }, { kind: "back-wall", vessel: t.id, artery: true });
                continue;
              }
            }
            if (w.frontTent > lim.front) {
              w.frontHole = true;
              w.frontTent = 0;
              const p = needlePoint(n, oa);
              this.st.holes.push({ vessel: t.id, x: p.x, back: false, plugged: false, pass: this.st.passes });
              const artery = t.kind === "artery";
              const isTarget = t.id === this.site.arteryId;
              // at the wrist: how far off the centre the needle entered (the bevel faces the side wall past bevelSideEcc)
              if (artery && isTarget && this.site.kind === "radial") {
                const sc = this.lumenScale(t);
                this.st.entryEcc = (p.y - (tubeAt(t, p.x).y + w.roll)) / (t.r * (sc ? sc(p.x)?.ry ?? 1 : 1));
              }
              if (artery && isTarget) this.st.arterialPunctures++;
              else if (artery) this.st.otherArteryPunctures++;
              else this.st.veinPunctures++;
              ev.push({ kind: "front-wall", vessel: t.id, artery, target: isTarget });
            }
          } else if (w.frontHole && inner && !w.backHole && L > inner[1]) {
            // the tip reaches the far wall from inside the lumen
            w.backTent = L - inner[1];
            if (w.backTent > lim.back) {
              w.backHole = true;
              w.backTent = 0;
              const p = needlePoint(n, inner[1]);
              this.st.holes.push({ vessel: t.id, x: p.x, back: true, plugged: false, pass: this.st.passes });
              if (t.kind === "artery") this.st.backWalls++;
              ev.push({ kind: "back-wall", vessel: t.id, artery: t.kind === "artery" });
            }
          }
        } else {
          // --- withdrawing: the tent relaxes ---
          if (!w.frontHole) w.frontTent = Math.max(0, L - oa);
          if (w.frontHole && inner && !w.backHole) w.backTent = Math.max(0, L - inner[1]);
        }
      }
      if (L === 0) {
        // out of the skin: the next advance is a new pass
        this.st.walls = {};
        if (this.st.wire && !this.st.needleRemoved) this.st.wire = null;
        break;
      }
    }
    if (this.st.wire && this.st.wire.state !== "subintimal") {
      // moving the needle with the wire through it drags the wire tip; re-evaluate the bevel
      const f = this.flashback();
      if (f.lumenFraction < 0.3) this.st.wire.state = "blocked";
    }
    return ev;
  }

  /** The lumen interval (needle lengths) of a vessel on the current pass, accounting for tenting. */
  private lumenRange(t: UsTube, c: Crossing, w: WallState | undefined): [number, number] | null {
    if (!c.inner || !w?.frontHole) return null;
    // both walls went together: the lumen is closed to the bevel until the needle is drawn back
    if (w.transfix !== undefined && (this.st.needle?.inserted ?? 0) > w.transfix - MP_NEEDLE.transfixReopenMm) return null;
    const end = w.backHole ? c.inner[1] : c.inner[1] + w.backTent;
    return [c.inner[0], end];
  }

  /** Flashback in the hub now. */
  flashback(): Flashback {
    const n = this.st.needle;
    if (!n || n.inserted <= 0 || this.st.needleRemoved) return { kind: "none", vessel: null, lumenFraction: 0 };
    const cross = this.crossings(n);
    let best: { t: UsTube; f: number } | null = null;
    for (const t of this.site.tubes) {
      if (t.kind !== "artery" && t.kind !== "vein") continue;
      const r = this.lumenRange(t, cross.get(t.id)!, this.st.walls[t.id]);
      if (!r) continue;
      const a = Math.max(r[0], n.inserted - MP_NEEDLE.bevelMm);
      const b = Math.min(r[1], n.inserted);
      const f = Math.max(0, b - a) / MP_NEEDLE.bevelMm;
      if (f > 0 && (!best || f > best.f)) best = { t, f };
    }
    if (!best) return { kind: "none", vessel: null, lumenFraction: 0, ...(this.st.needlePlugged ? { plugged: true } : {}) };
    // a plugged needle lets no blood through to the hub
    if (this.st.needlePlugged) return { kind: "none", vessel: best.t.id, lumenFraction: best.f, plugged: true };
    // a fully compressed artery gives no flow (a bleb pressing on it counts, at the needle tip)
    const tipX = needleTip(n).x;
    const sc = this.lumenScale(best.t);
    const { rz } = tubeRadii(best.t, this.probe.pressure, this.phase, sc ? sc(tipX) : null);
    if (rz < best.t.r * 0.35) return { kind: "none", vessel: best.t.id, lumenFraction: best.f };
    if (best.t.kind === "vein") return { kind: best.f > 0.3 ? "venous" : "none", vessel: best.t.id, lumenFraction: best.f };
    // the radial artery's tone slows the flash; a poor one is no better than a bevel half in the lumen
    if (this.site.kind === "radial" && best.t.id === this.site.arteryId && best.f >= 0.55) {
      const fl = spasmFlash(this.spasm);
      if (fl === "poor") return { kind: "sluggish", vessel: best.t.id, lumenFraction: best.f, slow: true };
      if (fl === "slow") return { kind: "arterial", vessel: best.t.id, lumenFraction: best.f, slow: true };
    }
    return { kind: best.f >= 0.55 ? "arterial" : "sluggish", vessel: best.t.id, lumenFraction: best.f };
  }

  /** Feed the wire through the needle (mm, positive in). */
  advanceWire(mm: number): PunctureEvent[] {
    const n = this.st.needle;
    if (!n || n.inserted <= 0) return [];
    const ev: PunctureEvent[] = [];
    const f = this.flashback();
    if (!this.st.wire) this.st.wire = { state: "blocked", beyondMm: 0, vessel: f.vessel, resistance: 0 };
    const w = this.st.wire;
    if (mm <= 0) {
      w.beyondMm = Math.max(0, w.beyondMm + mm);
      // pulled back below the branch it turned into: the wire can be re-advanced (the scripted turn is spent)
      const ax = this.st.arteriotomy;
      if (ax && this.st.wireCourse && this.st.wireCourse !== "iliac" && w.beyondMm <= courseTurnMm(this.site, ax.x, this.st.wireCourse)) {
        this.st.wireCourse = null;
        this.st.branchResistance = false;
      }
      if (w.beyondMm === 0 && w.state !== "subintimal") this.st.wire = null;
      return ev;
    }
    if (w.state === "intraluminal") {
      const ax = this.st.arteriotomy;
      if (ax && this.st.wireCourse === null && !this.st.needleRemoved) {
        // re-advanced after a pull-back: the model rule from the needle as it lies now (no script)
        this.st.wireCourse = microWireCourse(this.site, ax, n);
        if (this.st.wireCourse) ev.push({ kind: "wire-course", course: this.st.wireCourse });
      }
      const turn = ax ? courseTurnMm(this.site, ax.x, this.st.wireCourse) : Infinity;
      if (this.st.wireCourse !== "down-leg" && w.beyondMm + mm > turn + MP_MICRO.branchFreeMm) {
        // a small branch: the wire runs a short way and then stops
        const free = Math.max(0, turn + MP_MICRO.branchFreeMm - w.beyondMm);
        w.beyondMm += free + (mm - free) * MP_MICRO.branchCreep;
        w.resistance = 0.75;
        if (!this.st.branchResistance) {
          this.st.branchResistance = true;
          ev.push({ kind: "wire-resistance", reason: "branch" });
        }
        return ev;
      }
      w.beyondMm += mm;
      w.resistance = 0.05;
      return ev;
    }
    if (w.state === "subintimal") {
      w.beyondMm += mm * 0.3;
      w.resistance = 0.9;
      return ev;
    }
    // first advance, or still blocked: what does the bevel open into?
    const t = f.vessel ? this.site.tubes.find((x) => x.id === f.vessel) : undefined;
    // the steeper groin limit is for the target common femoral artery only; a vein or branch keeps the default
    const femArtery = this.site.kind === "femoral" && !!t && t.id === this.site.arteryId;
    const steep = n.angleDeg > (femArtery ? MP_NEEDLE.wireSteepDegFemoral : MP_NEEDLE.wireSteepDeg);
    // at the wrist, with good backflow: the bevel facing the side wall, or the bend of an unextended wrist, stops the wire at the tip
    const radialTarget = this.site.kind === "radial" && !!t && t.id === this.site.arteryId && f.kind === "arterial" && f.lumenFraction >= MP_NEEDLE.wireLumenFraction && !steep;
    const tipBlock: "bevel-side" | "wrist-flexed" | null = !radialTarget
      ? null
      : Math.abs(this.st.entryEcc ?? 0) >= MP_NEEDLE.bevelSideEcc && !this.st.bevelTurned
        ? "bevel-side"
        : this.site.arm && !this.site.arm.wristExtended
          ? "wrist-flexed"
          : null;
    if (t && !tipBlock && f.lumenFraction >= MP_NEEDLE.wireLumenFraction && !steep && (f.kind === "arterial" || f.kind === "venous")) {
      w.state = "intraluminal";
      w.vessel = t.id;
      w.beyondMm += mm;
      w.resistance = 0.05;
      const p = needleTip(n);
      this.st.arteriotomy = { x: p.x, vessel: t.id };
      ev.push({ kind: "wire-free", vessel: t.id, venous: t.kind === "vein" });
      // at the groin the micro-wire takes its course (the script's for the first wire after it is set)
      this.st.wireCourse = microWireCourse(this.site, this.st.arteriotomy, n, this.st.courseScript);
      if (this.st.wireCourse) {
        if (this.st.courseScript) this.st.courseScript = null;
        ev.push({ kind: "wire-course", course: this.st.wireCourse });
      }
      return ev;
    }
    // resistance: the wire is pushed against the wall (or stopped by a plugged needle)
    const reason: "partial-bevel" | "steep" | "no-lumen" | "back-wall" | "plugged" | "bevel-side" | "wrist-flexed" = f.plugged
      ? "plugged"
      : !t
        ? "no-lumen"
        : steep
          ? "steep"
          : tipBlock
            ? tipBlock
            : f.lumenFraction < MP_NEEDLE.wireLumenFraction || f.kind === "sluggish"
              ? "partial-bevel"
              : "back-wall";
    w.resistance = 0.85;
    w.beyondMm += mm * 0.15;
    ev.push({ kind: "wire-resistance", reason });
    if (w.beyondMm * (1 / 0.15) > MP_NEEDLE.wireForceMm && t && reason !== "no-lumen" && reason !== "plugged") {
      w.state = "subintimal";
      ev.push({ kind: "wire-subintimal" });
    }
    return ev;
  }

  /** Remove the needle over an intraluminal wire. */
  removeNeedle(): boolean {
    if (!this.st.wire || this.st.wire.state !== "intraluminal") return false;
    this.st.needleRemoved = true;
    return true;
  }

  /** Pull the wire (and needle) out: start again. Holes stay. */
  abandonPass(): void {
    this.st.wire = null;
    this.st.needle = null;
    this.st.needleRemoved = false;
    this.st.walls = {};
    this.st.entryEcc = null;
    this.st.bevelTurned = false;
    this.st.arteriotomy = null;
    this.st.wireCourse = null;
    this.st.branchResistance = false;
  }

  /**
   * Take the needle out of the skin and flush it (Brilakis 4.2.6.3: no blood return from a plugged
   * needle). The needle keeps its pose at the skin; the next advance is a new pass. Refused with a wire
   * through it.
   */
  flushNeedle(): boolean {
    const n = this.st.needle;
    if (!n || this.st.wire || this.st.needleRemoved) return false;
    n.inserted = 0;
    this.st.walls = {};
    this.st.needlePlugged = false;
    return true;
  }

  /** Scripted events of a scenario: the next needle plugged, the next free micro-wire's course. */
  script(o: { needlePlugged?: boolean; microWireCourse?: MicroWireCourse }): void {
    if (o.needlePlugged) this.st.needlePlugged = true;
    if (o.microWireCourse) this.st.courseScript = o.microWireCourse;
  }

  /** The micro-wire has turned off the main artery into a branch or down the leg (as far as it has run). */
  wireMisdirected(): boolean {
    const w = this.st.wire;
    const ax = this.st.arteriotomy;
    if (!w || w.state !== "intraluminal" || !ax || !this.st.wireCourse || this.st.wireCourse === "iliac") return false;
    return w.beyondMm > courseTurnMm(this.site, ax.x, this.st.wireCourse);
  }

  /** The sheath goes in over the wire; its arteriotomy is plugged. */
  insertSheath(fr: number): boolean {
    if (!this.st.needleRemoved || !this.st.wire || this.st.wire.state !== "intraluminal") return false;
    this.st.sheathFr = fr;
    this.st.dilatorFr = null;
    const ax = this.st.arteriotomy;
    if (ax) {
      // the most recent front hole of that vessel is the one the sheath fills
      for (let i = this.st.holes.length - 1; i >= 0; i--) {
        const h = this.st.holes[i];
        if (h.vessel === ax.vessel && !h.back) {
          h.plugged = true;
          break;
        }
      }
    }
    return true;
  }

  /** The sheath is removed at closure: its arteriotomy is open again (the closure model takes over). */
  removeSheath(): void {
    this.st.sheathFr = null;
  }

  /**
   * A dilator goes in over the wire with the needle out (access-femoral-upsizing-angiogram): it fills the
   * arteriotomy as the sheath does and is drawn in the lumen. Refused without an intraluminal wire.
   */
  insertDilator(fr: number): boolean {
    if (!this.st.needleRemoved || !this.st.wire || this.st.wire.state !== "intraluminal" || this.st.sheathFr) return false;
    this.st.dilatorFr = fr;
    return true;
  }

  /** The dilator comes off the wire. */
  removeDilator(): void {
    this.st.dilatorFr = null;
  }

  /**
   * The 0.035 inch wire replaces the micro-wire through the outer dilator: it runs up the iliac artery to the
   * abdominal aorta (`beyondMm` past the entry). Only with an intraluminal wire and the needle out.
   */
  exchangeWire(beyondMm: number): boolean {
    const w = this.st.wire;
    if (!this.st.needleRemoved || !w || w.state !== "intraluminal") return false;
    w.beyondMm = beyondMm;
    w.resistance = 0.05;
    this.st.wireCourse = this.st.wireCourse === null ? null : "iliac";
    this.st.branchResistance = false;
    return true;
  }

  /** Open (bleeding) holes now: arterial and venous, front and back. */
  openHoles(): { arterial: number; venous: number; back: number } {
    let arterial = 0,
      venous = 0,
      back = 0;
    const filled = (this.st.needle && this.st.needle.inserted > 0) || !!this.st.wire;
    for (const h of this.st.holes) {
      if (h.plugged) continue;
      // the needle or wire of the current pass fills its own holes; a back-wall hole behind the tip still bleeds
      if (filled && h.pass === this.st.passes && !h.back) continue;
      const t = this.site.tubes.find((x) => x.id === h.vessel);
      if (t?.kind === "vein") venous++;
      else arterial++;
      if (h.back) back++;
    }
    return { arterial, venous, back };
  }

  /** Where the needle hit the target artery, relative to the landmarks. */
  arteriotomyClass(): "ok" | "high" | "low" | "distal" | "proximal" | "none" {
    const ax = this.st.arteriotomy;
    if (!ax) return "none";
    const lm = this.site.landmarks;
    if (this.site.kind === "femoral") {
      if (ax.vessel !== this.site.arteryId) return "low";
      if (lm.ligamentX !== undefined && ax.x > lm.ligamentX - 5) return "high";
      if (lm.bifurcationX !== undefined && ax.x < lm.bifurcationX + 3) return "low";
      return "ok";
    }
    if (ax.x < lm.targetFrom - 7) return "distal";
    if (ax.x > lm.targetTo + 25) return "proximal";
    return "ok";
  }
}

// ---------------------------------------------------------------------------
// B-mode rendering
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the B-mode appearance (tuned by eye; no physical claim). */
export const MP_BMODE = {
  /** echogenicity of each layer (0..1 before speckle) */
  skin: 0.8,
  fat: 0.13,
  fatSepta: 0.5,
  muscle: 0.2,
  fascia: 0.7,
  /** intramuscular fascial planes: spacing (mm), thickness (mm), brightness */
  planeMm: 2.6,
  planeThick: 0.2,
  plane: 0.42,
  /** speckle contrast: 0 smooth … 1 fully developed */
  speckleContrast: 0.7,
  tendon: 0.5,
  nerve: 0.5,
  lumen: 0.025,
  wallSpecular: 0.95,
  wallDiffuse: 0.35,
  boneSurface: 1.0,
  shadow: 0.06,
  needle: 1.0,
  haematoma: 0.1,
  /** speckle cell size (mm): lateral, axial, elevational */
  speckleLat: 0.3,
  speckleAx: 0.13,
  speckleElev: 0.5,
  /** posterior enhancement gain per mm of fluid above */
  enhancementPerMm: 0.05,
  /** depth attenuation after time-gain compensation (per mm) */
  residualAttenuation: 0.006,
  /** reverberation spacing below the needle (mm) and decay */
  reverbMm: 0.7,
  reverbDecay: 0.55,
  /** anterior-wall calcium: echogenicity, thickness of the bright arc (mm), and what passes beneath it (share) */
  calcium: 1.0,
  calciumMm: 0.9,
  calciumShadow: 0.12,
};


/** Integer hash of three cell indices (uint32). */
function hashU(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Fully developed speckle: a Rayleigh amplitude per tissue-locked cell, from a lookup table (mean about 1). */
const RAYLEIGH = (() => {
  const t = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) t[i] = Math.sqrt(-2 * Math.log(1 - (i + 0.5) / 1024)) * 0.8;
  return t;
})();

/** Log compression lookup: v in [0, 4) to 0..255. */
const LOG_N = 4096;
const LOG_SCALE = LOG_N / 4;
const LOG_LUT = (() => {
  const t = new Uint8ClampedArray(LOG_N);
  for (let i = 0; i < LOG_N; i++) t[i] = Math.round((Math.log1p(6 * (i / LOG_SCALE)) / Math.log1p(6)) * 255);
  return t;
})();

export interface BModeBuffer {
  width: number;
  height: number;
  /** RGBA */
  data: Uint8ClampedArray;
}

/**
 * An anchor-and-collagen-plug closure device left by a previous femoral procedure (the planning
 * module's record, proc-chart-planted-problems): the collagen plug lies on the anterior wall of the
 * artery over the old arteriotomy and the anchor inside the lumen against that wall.
 */
export interface PriorClosurePlug {
  /** the artery it closed (its tube id) */
  vessel: string;
  /** site x of the old arteriotomy (mm) */
  x: number;
  /** days since the device was placed */
  daysAgo: number;
}

/**
 * MODEL PARAMETERS (drawing sizes and echo levels chosen so the device reads on the image; not the
 * dimensions of any device): the collagen plug as an ellipsoid on the outer anterior wall (length
 * along the artery, width across it, thickness, mm) and the anchor as a thin bright bar on the inner
 * anterior wall.
 */
export const MP_PRIOR_PLUG = {
  plugLenMm: 6,
  plugWidMm: 4,
  plugThickMm: 2.5,
  plugEcho: 0.8,
  anchorLenMm: 10,
  anchorWidMm: 2,
  anchorThickMm: 0.5,
  anchorEcho: 0.95,
};

export interface BModeExtras {
  /** frame counter for the small electronic noise */
  frame?: number;
  /** a closure device left in this groin by a previous procedure, drawn where it lies */
  priorPlug?: PriorClosurePlug | null;
}

/** Where a prior closure device lies in the site frame now (the artery pulses and compresses under the probe). */
export function priorPlugGeometry(site: AccessSite, plug: PriorClosurePlug, pressure: number, phase: number): { plug: { x: number; y: number; z: number }; anchor: { x: number; y: number; z: number } } | null {
  const t = site.tubes.find((x) => x.id === plug.vessel);
  if (!t || !inExtent(t, plug.x)) return null;
  const c = tubeAt(t, plug.x);
  const { rz } = tubeRadii(t, pressure, phase);
  const top = c.z - rz; // inner surface of the anterior wall
  return {
    plug: { x: plug.x, y: c.y, z: top - site.wallMm - MP_PRIOR_PLUG.plugThickMm / 2 },
    anchor: { x: plug.x, y: c.y, z: top + MP_PRIOR_PLUG.anchorThickMm / 2 + 0.1 },
  };
}

/**
 * The blebs of local anaesthetic as drawn now: a lens under the skin centred beside the artery, its size from the
 * volume still there (MP_LOCAL.disperseTauS): an equivalent sphere's radius R, drawn R x 1.3 across and R x 0.35 thick
 * (MODEL drawing proportions), its top just under the skin.
 */
function blebGeometry(blebs: readonly LocalBleb[] | undefined, nowS: number, site: AccessSite): { x: number; y: number; z: number; a: number; c: number }[] {
  if (!blebs || !blebs.length) return [];
  const out: { x: number; y: number; z: number; a: number; c: number }[] = [];
  for (const b of blebs) {
    const v = b.ml * Math.exp(-Math.max(0, nowS - b.at) / MP_LOCAL.disperseTauS);
    if (v < 0.05) continue;
    const R = Math.cbrt((3 * v * 1000) / (4 * Math.PI));
    const c = Math.max(0.4, R * 0.35);
    out.push({ x: b.x, y: b.y, z: 0.9 + c + Math.min(0.5, site.fatMm * 0.2), a: R * 1.3, c });
  }
  return out;
}

/** Map an image pixel to the site frame. */
export function pixelToSite(probe: Probe, u: number, d: number): { x: number; y: number; z: number } {
  return probe.orient === "short" ? { x: probe.x, y: probe.y + u, z: d } : { x: probe.x + u, y: probe.y, z: d };
}

/** Map a site point to image coordinates (u lateral mm, d depth mm) and its distance from the image plane. */
export function siteToImage(probe: Probe, p: { x: number; y: number; z: number }): { u: number; d: number; off: number } {
  return probe.orient === "short" ? { u: p.y - probe.y, d: p.z, off: p.x - probe.x } : { u: p.x - probe.x, d: p.z, off: p.y - probe.y };
}

/**
 * Render the B-mode image for the probe. `pm` gives the needle, wire, sheath and haematoma; the
 * phase (0..1) drives arterial pulsation. Cost: about width x height x (tubes + 4) evaluations.
 */
/** The tubes the B-mode image draws (the vessels and, at the groin, the iliac branches), built once per site. */
const IMAGED_TUBES = new WeakMap<AccessSite, readonly UsTube[]>();
function imagedTubes(site: AccessSite): readonly UsTube[] {
  if (!site.branches.length) return site.tubes;
  let all = IMAGED_TUBES.get(site);
  if (!all) {
    all = [...site.tubes, ...site.branches];
    IMAGED_TUBES.set(site, all);
  }
  return all;
}

export function renderBMode(pm: PunctureModel, out: BModeBuffer, ex: BModeExtras = {}): void {
  const site = pm.site;
  const probe = pm.probe;
  const W = out.width,
    H = out.height;
  const fp = MP_NEEDLE.footprintMm;
  const D = probe.depthMm;
  const phase = pm.phase;
  const data = out.data;
  const frame = ex.frame ?? 0;
  const st = pm.st;
  const mmPerPxU = fp / W;
  const mmPerPxD = D / H;
  // probe pressure pushes the near tissue down a little (model): image structures appear shallower
  const indent = probe.pressure * (site.kind === "radial" ? 0.8 : 3);

  // needle geometry in the image
  const n = st.needle && !st.needleRemoved ? st.needle : null;
  const needleSegs: { u0: number; d0: number; u1: number; d1: number; bright: number }[] = [];
  let needleDot: { u: number; d: number; tip: boolean } | null = null;
  if (n && n.inserted > 0) {
    const tip = needleTip(n);
    if (probe.orient === "long") {
      // the parts of the needle within the beam thickness of the plane are drawn as a line
      const N = 60;
      let prev: { u: number; d: number; inside: boolean } | null = null;
      const th = n.angleDeg * deg;
      const specular = Math.pow(Math.cos(th), 1.6); // a steep needle returns less echo to the probe
      for (let k = 0; k <= N; k++) {
        const p = needlePoint(n, (n.inserted * k) / N);
        const im = siteToImage(probe, p);
        const inside = Math.abs(im.off) < MP_NEEDLE.beamHalfMm;
        if (prev && prev.inside && inside) needleSegs.push({ u0: prev.u, d0: prev.d - indent, u1: im.u, d1: im.d - indent, bright: specular });
        prev = { u: im.u, d: im.d, inside };
      }
    } else {
      // short axis: the needle crosses the plane at one point (the shaft), or the tip lies in the beam
      const d = needleDir(n);
      const imTip = siteToImage(probe, tip);
      if (Math.abs(imTip.off) < MP_NEEDLE.beamHalfMm) needleDot = { u: imTip.u, d: imTip.d - indent, tip: true };
      else if (tip.x > probe.x && d.dx > 1e-3) {
        const L = (probe.x - n.entryX) / d.dx;
        if (L > 0 && L < n.inserted) {
          const p = needlePoint(n, L);
          const im = siteToImage(probe, p);
          needleDot = { u: im.u, d: im.d - indent, tip: false };
        }
      }
    }
  }

  // tenting: indentation of the near wall of each vessel the needle is pushing
  const tents: { id: string; u: number; amount: number }[] = [];
  if (n) {
    for (const [id, w] of Object.entries(st.walls)) {
      if (w.frontTent > 0.05) {
        const tip = needleTip(n);
        const im = siteToImage(probe, tip);
        if (Math.abs(im.off) < 3) tents.push({ id, u: im.u, amount: w.frontTent });
      }
    }
  }

  // wire and sheath in the lumen (drawn along the arteriotomy vessel proximally from the arteriotomy)
  const wireVessel = st.wire && st.wire.state === "intraluminal" && st.arteriotomy ? site.tubes.find((t) => t.id === st.arteriotomy!.vessel) : null;
  const wireFrom = st.arteriotomy?.x ?? 0;
  // a wire that has turned off the main artery is seen in it only as far as the turn
  const wireTo = wireFrom + Math.min(st.wire?.beyondMm ?? 0, courseTurnMm(site, wireFrom, st.wireCourse));
  // a dilator in the lumen is drawn as a short sheath (MODEL drawing lengths: sheath 70 mm, dilator 35 mm into the artery)
  const tubeFr = st.sheathFr ?? st.dilatorFr ?? null;
  const sheathTo = tubeFr ? wireFrom + (st.sheathFr ? 70 : 35) : wireFrom;
  const sheathR = tubeFr ? (tubeFr / 3) * 0.5 : 0;

  // haematoma: hypoechoic collection around the arteriotomy, radius from its volume
  const tgt = site.tubes.find((t) => t.id === site.arteryId)!;
  const hx = st.holes.length ? st.holes[st.holes.length - 1].x : (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
  const hc = tubeAt(tgt, hx);
  const hR = st.haematomaMl > 0.05 ? Math.cbrt((3 * st.haematomaMl * 1000) / (4 * Math.PI)) : 0; // mm

  const rolls: Record<string, number> = {};
  for (const [id, w] of Object.entries(st.walls)) if (w.roll) rolls[id] = w.roll;

  // a prior closure device in this groin: the plug on the anterior wall, the anchor inside it
  const plugGeom = ex.priorPlug ? priorPlugGeometry(site, ex.priorPlug, probe.pressure, phase) : null;
  const PP = MP_PRIOR_PLUG;

  // the target artery's lumen narrowed by its tone and a bleb (access-radial-sequence), and the blebs as drawn
  // (the per-column scale is written into one scratch object rather than allocated for every column)
  const targetNarrowed = pm.lumenScale(tgt) !== null;
  const targetTone = targetNarrowed ? radialLumenScale(pm.spasm) : 1;
  const targetBlebs = targetNarrowed && !!st.blebs?.some((b) => b.ml > MP_LOCAL.freeMl);
  const scaleScratch: LumenScale = { ry: 1, rz: 1 };
  const blebs = blebGeometry(st.blebs, pm.nowS, site);

  // per-column geometry: everything that depends only on the line of sight
  interface ColTube {
    t: UsTube;
    vessel: boolean;
    /** the anterior wall is calcified in this column */
    calc: boolean;
    cz: number;
    czTop: number;
    /** (dy/a)^2 and (dy/(a+wall))^2 in short axis; 0 in long axis */
    qy: number;
    qyW: number;
    b: number;
    bW: number;
    a: number;
    dy: number;
    venousDim: number;
  }
  const colTubes: ColTube[] = [];
  const short = probe.orient === "short";
  // the branches of the external iliac are drawn with the vessels (the needle model does not puncture them)
  const allTubes = imagedTubes(site);
  const calcSite = site.calcium.length > 0;
  let rng = (frame * 2654435761) >>> 0 || 1;
  for (let i = 0; i < W; i++) {
    const u = (i + 0.5) * mmPerPxU - fp / 2;
    const cx = short ? probe.x : probe.x + u;
    const cyy = short ? probe.y + u : probe.y;
    // speckle cells: interpolated along the image's horizontal axis, quantised across the beam (elevation)
    const horiz = short ? cyy : cx;
    const ixSpk = Math.floor((short ? cx : cyy) / MP_BMODE.speckleElev) + (short ? 0 : 7919);
    const iySpk = Math.floor(horiz / MP_BMODE.speckleLat);
    const tySpk = horiz / MP_BMODE.speckleLat - iySpk;
    let fluidAbove = 0; // mm of fluid already traversed in this column (posterior enhancement)
    let shadowed = false;
    let needleShadow = false;
    // depth of the first bone surface in this column
    let boneTop = Infinity;
    for (const bn of site.bones) {
      if (bn.shape === "cylinder") {
        if (!inExtent(bn, cx)) continue;
        const c = tubeAt(bn, cx);
        const off = cyy - c.y;
        if (Math.abs(off) < bn.r) boneTop = Math.min(boneTop, c.z - Math.sqrt(bn.r * bn.r - off * off));
      } else {
        const r2 = bn.r * bn.r - (cx - bn.xRef) ** 2 - (cyy - bn.yRef) ** 2;
        if (r2 > 0) boneTop = Math.min(boneTop, bn.zRef - Math.sqrt(r2));
      }
    }
    // tubes crossing this column
    colTubes.length = 0;
    let calcShadow = false;
    for (const t of allTubes) {
      if (!inExtent(t, cx)) continue;
      const calc = calcSite && t.id === site.arteryId && calcifiedAt(site, cx);
      const c = tubeAt(t, cx);
      let colScale: LumenScale | null = null;
      if (targetNarrowed && t.id === site.arteryId) {
        scaleScratch.ry = targetTone;
        scaleScratch.rz = targetTone * (targetBlebs ? 1 - pm.blebSquash(cx) : 1);
        colScale = scaleScratch;
      }
      const { ry, rz } = tubeRadii(t, probe.pressure, phase, colScale);
      const wall = t.kind === "artery" ? site.wallMm : t.kind === "vein" ? 0.15 : 0;
      const cy = c.y + (rolls[t.id] ?? 0);
      let czTop = c.z;
      for (const tn of tents) if (tn.id === t.id) czTop += tn.amount * Math.exp(-((u - tn.u) ** 2) / (2 * 0.9 * 0.9));
      if (short) {
        const dy = cyy - cy;
        if (Math.abs(dy) >= ry + wall + 0.2) continue;
        colTubes.push({ t, vessel: t.kind === "artery" || t.kind === "vein", calc, cz: c.z, czTop, qy: (dy / ry) ** 2, qyW: (dy / (ry + wall)) ** 2, b: rz, bW: rz + wall, a: ry, dy, venousDim: t.kind === "vein" ? 0.55 : 1 });
      } else {
        const off = probe.y - cy;
        if (Math.abs(off) >= ry + wall) continue;
        const chord = Math.sqrt(Math.max(0, 1 - (off / (ry + wall)) ** 2));
        const b = rz * chord;
        if (b < 0.05) continue;
        colTubes.push({ t, vessel: t.kind === "artery" || t.kind === "vein", calc, cz: c.z, czTop, qy: 0, qyW: 0, b, bW: b + wall * chord, a: 1, dy: 0, venousDim: t.kind === "vein" ? 0.55 : 1 });
      }
    }
    // haematoma in this column
    const dh2 = hR > 0 ? (cx - hx) ** 2 + (cyy - hc.y) ** 2 : Infinity;
    const hz = hc.z - tgt.r - 1;
    // wire and sheath in this column
    let wireZ = NaN,
      wireC: { y: number; z: number } | null = null;
    const inWireX = !!wireVessel && inExtent(wireVessel, cx) && cx > wireFrom - (short ? 0 : 2) && cx < Math.max(wireTo, sheathTo);
    if (inWireX && wireVessel) {
      wireC = tubeAt(wireVessel, cx);
      wireZ = wireC.z + wireVessel.r * 0.35;
    }
    const needleDu = needleDot ? u - needleDot.u : 99;
    // the blebs in this column: the along-and-across part of each lens (>= 1: not in this column)
    let blebQ = 9,
      blebZ = 0,
      blebC = 1;
    for (const b of blebs) {
      const q = ((cx - b.x) / b.a) ** 2 + ((cyy - b.y) / b.a) ** 2;
      if (q < blebQ) {
        blebQ = q;
        blebZ = b.z;
        blebC = b.c;
      }
    }
    // the prior closure device in this column: the along-and-across part of each ellipsoid (>= 1: not in this column)
    const plugQ = plugGeom ? ((cx - plugGeom.plug.x) / (PP.plugLenMm / 2)) ** 2 + ((cyy - plugGeom.plug.y) / (PP.plugWidMm / 2)) ** 2 : 9;
    const anchorQ = plugGeom ? ((cx - plugGeom.anchor.x) / (PP.anchorLenMm / 2)) ** 2 + ((cyy - plugGeom.anchor.y) / (PP.anchorWidMm / 2)) ** 2 : 9;
    // fascial planes undulate gently across the image
    const wob = 0.5 * Math.sin(cx * 0.21 + cyy * 0.17) + 0.35 * Math.sin(cx * 0.53 - cyy * 0.41);
    const planeCell = Math.floor((short ? cyy : cx) / 2.5);
    for (let j = 0; j < H; j++) {
      const dImg = (j + 0.5) * mmPerPxD;
      const dTissue = dImg + indent * (1 - Math.min(1, dImg / (D * 0.8)));
      let echo: number;
      // layers
      if (dImg < 0.9) echo = MP_BMODE.skin;
      else if (dTissue < site.fatMm) echo = hashU(Math.floor(cx / 2), Math.floor(cyy / 1.5), Math.floor(dTissue / 0.35)) > 3693671874 ? MP_BMODE.fatSepta : MP_BMODE.fat;
      else if (dTissue < site.fatMm + 0.5) echo = MP_BMODE.fascia;
      else {
        // muscle: hypoechoic, crossed by bright fascial planes that undulate gently (striations in long axis)
        const zz = (dTissue - site.fatMm + wob) / MP_BMODE.planeMm;
        const row = Math.floor(zz);
        const onPlane = zz - row < MP_BMODE.planeThick / MP_BMODE.planeMm && hashU(row, planeCell, 17) > 1288490188;
        echo = onPlane ? MP_BMODE.plane : !short && hashU(0, Math.floor(cyy), Math.floor(dTissue / 0.45)) > 3006477107 ? MP_BMODE.muscle * 1.35 : MP_BMODE.muscle;
      }
      let fluid = false;
      let calcHere = false;
      for (let k = 0; k < colTubes.length; k++) {
        const ct = colTubes[k];
        const cz = dTissue < ct.cz ? ct.czTop : ct.cz;
        const dz = dTissue - cz;
        const q2 = ct.qy + (dz * dz) / (ct.b * ct.b);
        if (ct.vessel) {
          if (q2 < 1) {
            echo = MP_BMODE.lumen;
            fluid = true;
          } else if (ct.calc && dz < 0 && ct.qyW + (dz * dz) / ((ct.bW + MP_BMODE.calciumMm) * (ct.bW + MP_BMODE.calciumMm)) < 1 && (!short || Math.abs(ct.dy) < ct.a * 0.75)) {
            // calcified anterior wall: a thick bright arc that casts an acoustic shadow
            echo = MP_BMODE.calcium;
            calcHere = true;
          } else if (ct.qyW + (dz * dz) / (ct.bW * ct.bW) < 1 || (ct.t.kind === "vein" && q2 < 1.17)) {
            // specular wall: bright where its normal faces the probe (top and bottom), weak at the sides
            const ny = short ? ct.dy / (ct.a * ct.a) : 0;
            const nz = dz / (ct.b * ct.b);
            const cosI = Math.abs(nz) / Math.max(1e-6, Math.sqrt(ny * ny + nz * nz));
            echo = MP_BMODE.wallDiffuse + (MP_BMODE.wallSpecular - MP_BMODE.wallDiffuse) * cosI * cosI * cosI * ct.venousDim;
          }
        } else if (q2 < 1) {
          if (ct.t.kind === "tendon") echo = MP_BMODE.tendon * (hashU(Math.floor(cyy * 2.5), Math.floor(dTissue * 4), 7) > 2147483648 ? 1.15 : 0.6);
          else echo = hashU(Math.floor(cyy * 1.6), Math.floor(dTissue * 1.6), 11) > 1932735283 ? MP_BMODE.nerve * 1.3 : MP_BMODE.nerve * 0.4;
        }
      }
      // the prior closure device: an echogenic plug over the wall and a bright anchor just inside it
      if (plugGeom) {
        if (plugQ < 1) {
          const dz = (dTissue - plugGeom.plug.z) / (PP.plugThickMm / 2);
          if (plugQ + dz * dz < 1) echo = PP.plugEcho;
        }
        if (anchorQ < 1) {
          const dz = (dTissue - plugGeom.anchor.z) / (PP.anchorThickMm / 2);
          if (anchorQ + dz * dz < 1) echo = PP.anchorEcho;
        }
      }
      // a bleb of local anaesthetic: a hypoechoic lens under the skin (not over a vessel's lumen)
      if (blebQ < 1 && !fluid && dImg >= 0.9) {
        const dz = (dTissue - blebZ) / blebC;
        if (blebQ + dz * dz < 1) echo = MP_BMODE.haematoma * 0.6;
      }
      // haematoma (around the vessel, not through its wall)
      if (dh2 < hR * hR && !fluid && echo < 0.6) {
        const dz = (dTissue - hz) * 1.6;
        const dd2 = dh2 + dz * dz;
        if (dd2 < hR * hR * 0.64) echo = MP_BMODE.haematoma;
      }
      // wire and sheath in the lumen
      if (wireC && fluid && wireVessel) {
        if (short) {
          const dyy = cyy - wireC.y;
          if (cx < wireTo && dyy * dyy + (dTissue - wireZ) ** 2 < 0.0625) echo = 0.95;
          if (tubeFr && cx < sheathTo && Math.abs(Math.sqrt(dyy * dyy + (dTissue - wireC.z) ** 2) - sheathR) < 0.18) echo = 0.9;
        } else if (Math.abs(probe.y - wireC.y) < wireVessel.r) {
          if (cx < wireTo && Math.abs(dTissue - wireZ) < 0.25) echo = 0.95;
          if (tubeFr && cx < sheathTo && (Math.abs(dTissue - (wireC.z - sheathR)) < 0.2 || Math.abs(dTissue - (wireC.z + sheathR)) < 0.2)) echo = 0.9;
        }
      }
      // bone: bright surface and an acoustic shadow beneath
      if (dTissue >= boneTop) {
        if (dTissue < boneTop + 0.9) echo = MP_BMODE.boneSurface;
        else shadowed = true;
      }
      if (shadowed) echo = MP_BMODE.shadow;
      if (calcShadow && !calcHere) echo *= MP_BMODE.calciumShadow;
      if (calcHere) calcShadow = true;
      if (needleShadow) echo *= 0.7;
      // needle (bright, with reverberation beneath)
      if (needleDot) {
        const dd = dImg - needleDot.d;
        const r = needleDot.tip ? 0.45 : 0.38;
        if (needleDu * needleDu + dd * dd < r * r) echo = MP_BMODE.needle;
        else if (Math.abs(needleDu) < r && dd > 0 && dd < 4) {
          const kk = Math.floor(dd / MP_BMODE.reverbMm);
          if (dd / MP_BMODE.reverbMm - kk < 0.35) echo = Math.max(echo, MP_BMODE.needle * Math.pow(MP_BMODE.reverbDecay, kk + 1));
          needleShadow = true;
        }
      } else if (needleSegs.length) {
        for (const sg of needleSegs) {
          const su = sg.u1 - sg.u0,
            sd = sg.d1 - sg.d0;
          const len2 = su * su + sd * sd;
          if (len2 < 1e-9) continue;
          const tt = Math.max(0, Math.min(1, ((u - sg.u0) * su + (dImg - sg.d0) * sd) / len2));
          const pu = sg.u0 + tt * su,
            pd = sg.d0 + tt * sd;
          const dist = Math.hypot(u - pu, dImg - pd);
          if (dist < 0.32) echo = Math.max(echo, MP_BMODE.needle * (0.45 + 0.55 * sg.bright));
          else if (dImg > pd && dist < 4 && sg.bright > 0.4) {
            const kk = Math.floor(dist / MP_BMODE.reverbMm);
            if (dist / MP_BMODE.reverbMm - kk < 0.3 && Math.abs(u - pu) < 0.4 + dist) echo = Math.max(echo, MP_BMODE.needle * sg.bright * Math.pow(MP_BMODE.reverbDecay, kk + 1) * 0.7);
          }
        }
      }
      // posterior enhancement under fluid
      if (!fluid && fluidAbove > 0 && !shadowed) echo *= 1 + MP_BMODE.enhancementPerMm * Math.min(12, fluidAbove);
      if (fluid) fluidAbove += mmPerPxD;
      // speckle (tissue-locked), residual attenuation, small electronic noise, log compression
      const az = dTissue / MP_BMODE.speckleAx;
      const iz = Math.floor(az);
      const tz = az - iz;
      const ty = tySpk;
      const h00 = hashU(ixSpk, iySpk, iz) & 1023,
        h10 = hashU(ixSpk, iySpk + 1, iz) & 1023,
        h01 = hashU(ixSpk, iySpk, iz + 1) & 1023,
        h11 = hashU(ixSpk, iySpk + 1, iz + 1) & 1023;
      const hi = (h00 * (1 - ty) + h10 * ty) * (1 - tz) + (h01 * (1 - ty) + h11 * ty) * tz;
      const sp = 1 - MP_BMODE.speckleContrast + MP_BMODE.speckleContrast * RAYLEIGH[Math.min(1023, Math.round(hi))];
      let v = echo * (echo > 0.9 ? 0.9 + 0.12 * sp : sp) * Math.exp(-MP_BMODE.residualAttenuation * dImg) * probe.gain;
      rng ^= rng << 13;
      rng ^= rng >>> 17;
      rng ^= rng << 5;
      v += 0.015 * ((rng >>> 0) / 4294967296);
      const li = Math.min(LOG_N - 1, Math.max(0, Math.round(v * LOG_SCALE)));
      const g = LOG_LUT[li];
      const o = (j * W + i) * 4;
      data[o] = g;
      data[o + 1] = g;
      data[o + 2] = g;
      data[o + 3] = 255;
    }
  }
}
