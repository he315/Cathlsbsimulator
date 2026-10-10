// ---------------------------------------------------------------------------
// Hardware and environment seen on real cath-lab frames: sternal wires and
// graft clips after cardiac surgery, pacemaker / ICD / CRT generators and
// leads, prosthetic valves and annuloplasty rings, ECG electrodes, and the
// table top. Geometry is returned as wires (polylines with a material in the
// renderer's three channels), flat cans and solids; thorax.ts turns them into
// exact segments for the thorax segment pass or into ribbon tubes and bone
// primitives for the legacy path.
//
// Metal attenuation per mm at the renderer's effective energy (60 keV, the
// energy at which the steel guidewire's 0.95 /mm in sceneBuilder matches
// NIST iron) is in METAL, with the NIST values in docs/realism/facts/S4.md.
// The B (metal) channel is scaled by the renderer's kV-dependent metal gain.
// Shapes and sizes of devices are generic model parameters, not any
// manufacturer's design.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import type { HeartFrame } from "./heart";
import { surfacePoint } from "./heart";
import type { BonePrim } from "./thorax";
import { prng } from "./pulmonaryTree";

/** Linear attenuation (per mm) at 60 keV, from NIST mass attenuation x density (facts/S4.md). */
export const METAL = {
  /** iron: 1.205 cm2/g x 7.874 g/cm3 */
  steel: 0.949,
  /** titanium: 0.7661 cm2/g x 4.54 g/cm3 */
  titanium: 0.348,
  /** platinum: 4.339 cm2/g x 21.45 g/cm3 */
  platinum: 9.31,
  /**
   * nickel-titanium: mass-weighted NIST Ni (1.512) and Ti (0.7661) at 55/45 % by mass, times an
   * ASSUMED density of 6.45 g/cm3 (model parameter, density not from an opened source)
   */
  nitinol: 0.759,
  /** copper (ECG lead conductors): 1.593 cm2/g x 8.96 g/cm3 */
  copper: 1.427,
};

/** Plastics at 60 keV (NIST, facts/S4.md), per mm; soft/bone channel. */
export const PLASTIC = {
  /** polyvinyl chloride (lead insulation): 0.3325 cm2/g x 1.406 g/cm3 */
  pvc: 0.04675,
  /**
   * foam (mattress, table core): NIST polystyrene 0.187 cm2/g times an ASSUMED foam density of
   * 0.05 g/cm3 (model parameter; the foam density is not from an opened source)
   */
  foam: 0.187 * 0.05 * 0.1,
};

/**
 * Default case probabilities for hardware.
 * - sternotomy 5/36 and pacing 1/36: measured, lower bounds from the image-forensics audit's visual
 *   inspection of 36 randomly sampled CoronaryDominance frames (sternotomy wires in at least 5,
 *   pacing hardware in at least 1).
 * - valve 1/36: MODEL PARAMETER, not measured (the audit gives no valve count); set to the pacing
 *   rate so valves stay rare.
 */
export const HARDWARE_PREVALENCE = { sternotomy: 5 / 36, pacing: 1 / 36, valve: 1 / 36 };

export type DeviceKind = "none" | "pacemaker-single" | "pacemaker-dual" | "icd" | "crt";
export type ValveKind = "none" | "aortic-mechanical" | "aortic-bioprosthetic" | "mitral-ring" | "tavi";

export interface HardwareSpec {
  /** master switch (teaching toggle); false renders nothing */
  enabled?: boolean;
  /** median sternotomy wires (count 0 = none; typical 5-7) */
  sternalWires?: number;
  /** clips along the internal mammary bed after grafting */
  graftClips?: boolean;
  device?: DeviceKind;
  /** generator pocket side */
  deviceSide?: "left" | "right";
  valve?: ValveKind;
  /** ECG electrodes on the chest (snap, sensor disc) with lead wires draping off the field */
  ecg?: boolean;
  /** carbon-fibre table top under the patient, with its rounded edges and the foam mattress */
  table?: boolean;
}

export interface HardwareContext {
  resp: number;
  heart: HeartFrame;
  heartShift: Vec3;
  contraction: number;
  habitus: number;
  /** anterior and posterior body surface z (mm) */
  bodyFront: number;
  bodyBack?: number;
  /** body half-width (mm); default 176 x habitus as thorax.ts */
  bodyHalfX?: number;
  seed: number;
}

export interface HardwareWire {
  pts: Vec3[];
  r: number[];
  /** material in the shell (or the whole cross-section when solid): R soft/bone, G iodine, B metal */
  mu: [number, number, number];
  muIn?: [number, number, number];
  inner?: number;
  flat?: number;
  thin?: Vec3[];
  name: string;
}

export interface HardwareGeometry {
  wires: HardwareWire[];
  /** low-density solids in the soft/bone channel (table top) */
  solids: BonePrim[];
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const add = (a: Vec3, b: Vec3) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Vec3, b: Vec3) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const sc = (a: Vec3, k: number) => v(a.x * k, a.y * k, a.z * k);
const nrm = (a: Vec3) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};
const cross = (p: Vec3, q: Vec3): Vec3 => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
const I3: [Vec3, Vec3, Vec3] = [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)];

/** Smooth polyline through control points (Catmull-Rom), about `step` mm apart. */
export function smoothPath(ctrl: Vec3[], step = 3): Vec3[] {
  if (ctrl.length < 2) return ctrl;
  const out: Vec3[] = [];
  const P = (i: number) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = P(i - 1),
      b = P(i),
      c = P(i + 1),
      d = P(i + 2);
    const n = Math.max(1, Math.ceil(Math.hypot(c.x - b.x, c.y - b.y, c.z - b.z) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n,
        t2 = t * t,
        t3 = t2 * t;
      const f = (p: number, q: number, r: number, s: number) => 0.5 * (2 * q + (-p + r) * t + (2 * p - 5 * q + 4 * r - s) * t2 + (-p + 3 * q - 3 * r + s) * t3);
      out.push(v(f(a.x, b.x, c.x, d.x), f(a.y, b.y, c.y, d.y), f(a.z, b.z, c.z, d.z)));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/**
 * Catenary of length slack x |b - a| from a to b, sagging along `down` (unit), sampled at n + 1
 * points. Solves 2 c sinh(h / 2c) = sqrt(L^2 - dv^2) for the catenary parameter by bisection.
 */
export function catenary(a: Vec3, b: Vec3, slack: number, down: Vec3, n = 48): Vec3[] {
  const ab = sub(b, a);
  const dv = -(ab.x * down.x + ab.y * down.y + ab.z * down.z); // rise of b above a
  const hv = sub(ab, sc(down, -dv)); // horizontal part (perpendicular to down)
  const h = Math.hypot(hv.x, hv.y, hv.z);
  const L = Math.max(slack, 1.0001) * Math.hypot(h, dv);
  if (h < 1e-6) return [a, b];
  const u = sc(hv, 1 / h);
  const target = Math.sqrt(Math.max(1e-9, L * L - dv * dv));
  let lo = 1e-3 * h,
    hi = 1e4 * h;
  for (let i = 0; i < 80; i++) {
    const c = Math.sqrt(lo * hi);
    if (2 * c * Math.sinh(h / (2 * c)) > target) lo = c;
    else hi = c;
  }
  const c = Math.sqrt(lo * hi);
  const x0 = h / 2 - c * Math.asinh(dv / (2 * c * Math.sinh(h / (2 * c))));
  const up = (x: number) => c * Math.cosh((x - x0) / c) - c * Math.cosh(x0 / c);
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * h;
    out.push(add(add(a, sc(u, x)), sc(down, -up(x))));
  }
  return out;
}

/** Closed ring of radius rad around centre c in the plane with normal n (first point repeated at the end). */
function ring(c: Vec3, n: Vec3, rad: number | ((phi: number) => number), seg = 32, lift?: (phi: number) => number): Vec3[] {
  const nn = nrm(n);
  const u = nrm(cross(nn, Math.abs(nn.y) < 0.9 ? v(0, 1, 0) : v(1, 0, 0)));
  const w = cross(nn, u);
  const pts: Vec3[] = [];
  for (let i = 0; i <= seg; i++) {
    const phi = (i / seg) * Math.PI * 2;
    const r = typeof rad === "number" ? rad : rad(phi);
    pts.push(add(add(c, add(sc(u, Math.cos(phi) * r), sc(w, Math.sin(phi) * r))), sc(nn, lift ? lift(phi) : 0)));
  }
  return pts;
}

/** Random case hardware with the library prevalences as probabilities (parameters can be overridden). */
export function sampleHardware(seed: number, p: Partial<typeof HARDWARE_PREVALENCE> = {}): HardwareSpec {
  const q = { ...HARDWARE_PREVALENCE, ...p };
  const r = prng(seed * 48271 + 11);
  const sternotomy = r() < q.sternotomy;
  const pacing = r() < q.pacing;
  const dev: DeviceKind[] = ["pacemaker-single", "pacemaker-dual", "icd", "crt"];
  const valves: ValveKind[] = ["aortic-mechanical", "aortic-bioprosthetic", "mitral-ring", "tavi"];
  return {
    enabled: true,
    sternalWires: sternotomy ? 5 + Math.floor(r() * 3) : 0,
    graftClips: sternotomy && r() < 0.8,
    device: pacing ? dev[Math.floor(r() * dev.length)] : "none",
    deviceSide: r() < 0.85 ? "left" : "right",
    valve: r() < q.valve ? valves[Math.floor(r() * valves.length)] : "none",
    ecg: true,
    table: true,
  };
}

/** Build the hardware for one frame. Chest-wall items move with breathing, intracardiac ones with the heart. */
export function buildHardware(spec: HardwareSpec, ctx: HardwareContext): HardwareGeometry {
  const wires: HardwareWire[] = [];
  const solids: BonePrim[] = [];
  if (spec.enabled === false) return { wires, solids };
  const k = ctx.habitus;
  const r = ctx.resp;
  const rnd = prng(ctx.seed * 69069 + 7);
  const chest = (p: Vec3) => add(p, v(0, 3 * r, 4 * r)); // model parameter: anterior chest wall motion on inspiration
  const stz = ctx.bodyFront - 12;

  // ---- median sternotomy wires: loops around the sternum through the parasternal spaces ----
  const WIRE_R = 0.45;
  const nW = spec.sternalWires ?? 0;
  for (let i = 0; i < nW; i++) {
    const f = nW > 1 ? i / (nW - 1) : 0.5;
    const y = 190 - f * 135;
    const hw = (y > 156 ? 24 : 14) * k + 3.5;
    const c = v((rnd() - 0.5) * 3, y + (rnd() - 0.5) * 4, stz);
    const tilt = nrm(v((rnd() - 0.5) * 0.12, 1, (rnd() - 0.5) * 0.3));
    // flattened loop in a near-transverse plane, a little wider than the sternum
    const loop = ring(c, tilt, (phi) => (hw * 8.5) / Math.hypot(8.5 * Math.cos(phi), hw * Math.sin(phi)), 28).map(chest);
    // model parameter: stainless steel wire of 0.9 mm diameter. Raised from 0.7 mm because the
    // integrated contrast (depth x FWHM) of edge-on loops was about 0.55 of the library's
    // (scripts/thorax/library_scan.py wires on cd-01162/01168/01172 against renderer captures, S4.md)
    wires.push({ pts: loop, r: loop.map(() => WIRE_R), mu: [0, 0, METAL.steel], name: "sternal wire" });
    // twisted tail: two strands wound around each other, pointing anteriorly and to one side
    const side = rnd() < 0.5 ? -1 : 1;
    const base = add(c, v(side * 2, 0, 8.5));
    const dir = nrm(v(side * 0.7, -0.35, 0.6));
    const tail: Vec3[] = [];
    const tail2: Vec3[] = [];
    const u = nrm(cross(dir, v(0, 1, 0))),
      w = cross(dir, u);
    const L = 9 + rnd() * 5;
    for (let s = 0; s <= 24; s++) {
      const t = (s / 24) * L;
      const a = (s / 24) * Math.PI * 2 * 4;
      const p = add(base, sc(dir, t));
      tail.push(chest(add(p, add(sc(u, Math.cos(a) * 0.45), sc(w, Math.sin(a) * 0.45)))));
      tail2.push(chest(add(p, add(sc(u, -Math.cos(a) * 0.45), sc(w, -Math.sin(a) * 0.45)))));
    }
    wires.push({ pts: tail, r: tail.map(() => WIRE_R), mu: [0, 0, METAL.steel], name: "sternal wire twist" });
    wires.push({ pts: tail2, r: tail2.map(() => WIRE_R), mu: [0, 0, METAL.steel], name: "sternal wire twist" });
  }

  // ---- clips along the left internal mammary bed ----
  if (spec.graftClips) {
    const n = 8 + Math.floor(rnd() * 7);
    for (let i = 0; i < n; i++) {
      const y = 170 - rnd() * 140;
      const c = chest(v((14 * k + 18) + (rnd() - 0.5) * 8, y, ctx.bodyFront - 24 + (rnd() - 0.5) * 6));
      const d = nrm(v(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5));
      const u = nrm(cross(d, v(0.3, 0.8, 0.5)));
      // model parameter: V-shaped titanium clip, legs 6 mm, 0.6 mm thick
      const tip = add(c, sc(d, 6));
      wires.push({ pts: [add(c, sc(u, -0.6)), add(tip, sc(u, -1.4))], r: [0.3, 0.3], mu: [0, 0, METAL.titanium], name: "clip" });
      wires.push({ pts: [add(c, sc(u, 0.6)), add(tip, sc(u, 1.4))], r: [0.3, 0.3], mu: [0, 0, METAL.titanium], name: "clip" });
    }
  }

  // ---- heart-relative helpers ----
  const H = ctx.heart;
  const e = ctx.contraction;
  const heartPt = (ell: number, phi: number, h: number) => add(surfacePoint(H, ell, phi, h, { contraction: e }), ctx.heartShift);
  const root = (p: Vec3) => add(p, sc(ctx.heartShift, 0.45)); // the aortic root is tethered (sceneBuilder rootW)

  // ---- pacemaker / ICD / CRT ----
  const dev = spec.device ?? "none";
  if (dev !== "none") {
    const s = spec.deviceSide === "right" ? -1 : 1;
    const pocket = chest(v(s * 78 * k, 168, ctx.bodyFront - 13));
    const icd = dev === "icd" || dev === "crt";
    // model parameters: can about 50 x 44 x 7 mm (ICD larger), titanium shell with dense battery
    const a = icd ? 32 : 24;
    const axis = nrm(v(s * 0.15, 0.1, 1));
    const p0 = add(pocket, sc(axis, -3.5)),
      p1 = add(pocket, sc(axis, 3.5));
    wires.push({ pts: [p0, p1], r: [a, a], mu: [0, 0, 0.11], flat: 0.88, thin: [v(0, 1, 0), v(0, 1, 0)], name: "generator" });
    const bat = add(pocket, v(s * -4, -5, 0));
    wires.push({ pts: [add(bat, sc(axis, -2.5)), add(bat, sc(axis, 2.5))], r: [a * 0.55, a * 0.55], mu: [0, 0, 0.28], flat: 0.7, thin: [v(0, 1, 0), v(0, 1, 0)], name: "battery" });
    // header set screws
    const hdr = add(pocket, v(-s * 4, a * 0.85, 0));
    wires.push({ pts: [add(hdr, v(-3, 0, 0)), add(hdr, v(3, 0, 0))], r: [1.2, 1.2], mu: [0, 0, METAL.steel * 0.6], name: "header" });
    // venous course: subclavian, innominate, SVC, right atrium
    const venous = [hdr, chest(v(s * 52 * k, 176, ctx.bodyFront - 30)), v(s * 30, 160, -34), v(-20, 128, -24), v(-30, 80, -12), add(v(-34, 36, -8), sc(ctx.heartShift, 0.4)), add(v(-38, 0, -6), sc(ctx.heartShift, 0.8))];
    const lead = (end: Vec3[], name: string, coil: boolean) => {
      const pts = smoothPath([...venous, ...end], 3);
      // model parameter: coiled conductor seen as a hollow metal tube about 1.2 mm across
      wires.push({ pts, r: pts.map(() => 0.6), mu: [0, 0, METAL.steel * 0.55], muIn: [0, 0, 0], inner: 0.55, name });
      const tip = pts[pts.length - 1],
        pre = pts[Math.max(0, pts.length - 2)];
      const td = nrm(sub(tip, pre));
      wires.push({ pts: [sub(tip, sc(td, 2)), tip], r: [0.75, 0.6], mu: [0, 0, METAL.platinum * 0.6], name: name + " tip" });
      wires.push({ pts: [sub(tip, sc(td, 11)), sub(tip, sc(td, 9))], r: [0.8, 0.8], mu: [0, 0, METAL.platinum * 0.5], name: name + " ring" });
      if (coil) {
        // shock coil over about 50 mm proximal to the tip
        let acc = 0;
        const seg: Vec3[] = [];
        for (let i = pts.length - 1; i > 0 && acc < 64; i--) {
          acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
          if (acc > 14) seg.unshift(pts[i]);
        }
        if (seg.length > 1) wires.push({ pts: seg, r: seg.map(() => 1.3), mu: [0, 0, METAL.steel * 0.75], muIn: [0, 0, 0], inner: 0.6, name: "shock coil" });
      }
    };
    // RV lead through the tricuspid valve to the apex
    lead([heartPt(-0.85, -110, -18), heartPt(0, -60, -14), heartPt(0.72, -20, -9)], "RV lead", icd);
    if (dev !== "pacemaker-single") lead([add(v(-30, 18, 8), sc(ctx.heartShift, 0.8)), add(v(-22, 26, 14), sc(ctx.heartShift, 0.8))], "RA lead", false);
    if (dev === "crt") lead([heartPt(-0.95, 175, 0), heartPt(-0.75, 130, 2), heartPt(-0.2, 105, 2), heartPt(0.3, 95, 2)], "LV lead", false);
  }

  // ---- prosthetic valves ----
  const valve = spec.valve ?? "none";
  const rootAxis = nrm(v(-0.15, 1, 0.25)); // model parameter: aortic root axis
  if (valve === "aortic-mechanical") {
    const c = root(v(0, 1, 0));
    const pts = ring(c, rootAxis, 12.5, 36);
    wires.push({ pts, r: pts.map(() => 1.4), mu: [0, 0, METAL.titanium], name: "valve ring" });
    // two leaflets: thin discs with a faint radiopaque filler (model parameter)
    const u = nrm(cross(rootAxis, v(1, 0, 0)));
    for (const s of [-1, 1]) {
      const lc = add(c, sc(u, s * 5.5));
      wires.push({ pts: [add(lc, sc(rootAxis, -0.4)), add(lc, sc(rootAxis, 0.4))], r: [11, 11], mu: [0, 0, 0.06], flat: 0.5, thin: [u, u], name: "leaflet" });
    }
  } else if (valve === "aortic-bioprosthetic") {
    const c = root(v(0, -1, 0));
    const crown = ring(c, rootAxis, 12, 48, (phi) => 7 * (0.5 + 0.5 * Math.cos(3 * phi)));
    wires.push({ pts: crown, r: crown.map(() => 0.5), mu: [0, 0, METAL.steel * 0.9], name: "wireform" });
    const base = ring(c, rootAxis, 13, 36);
    wires.push({ pts: base, r: base.map(() => 0.6), mu: [0, 0, METAL.steel * 0.5], name: "sewing ring" });
  } else if (valve === "mitral-ring") {
    const c = add(add(H.base, add(sc(H.S, 10), sc(H.A, -14))), ctx.heartShift);
    const d = ring(c, H.L, (phi) => (Math.sin(phi) > 0 ? 15 : 15 - 6 * Math.abs(Math.sin(phi))), 36);
    wires.push({ pts: d, r: d.map(() => 1.0), mu: [0, 0, METAL.titanium * 1.4], name: "annuloplasty ring" });
  } else if (valve === "tavi") {
    // self-expanding frame: zig-zag rings joined at their crowns (generic diamond lattice)
    const c0 = root(v(0, -6, 0));
    const cells = 15;
    const rows = 5;
    const u = nrm(cross(rootAxis, v(1, 0, 0))),
      w = cross(rootAxis, u);
    const radAt = (h: number) => (h < 12 ? 13 - h * 0.12 : h < 26 ? 11.6 : 11.6 + (h - 26) * 0.2); // model parameters
    for (let row = 0; row < rows; row++) {
      const pts: Vec3[] = [];
      for (let i = 0; i <= cells * 2; i++) {
        const phi = (i / (cells * 2)) * Math.PI * 2;
        const h = row * 9 + (i % 2 ? 9 : 0);
        const rr = radAt(h);
        pts.push(add(c0, add(add(sc(u, Math.cos(phi) * rr), sc(w, Math.sin(phi) * rr)), sc(rootAxis, h))));
      }
      wires.push({ pts, r: pts.map(() => 0.25), mu: [0, 0, METAL.nitinol], name: "frame" });
    }
  }

  // ---- body surface (elliptic cylinder along y, as thorax.ts BODY) ----
  const back = ctx.bodyBack ?? ctx.bodyFront - 252 * k;
  const bz = (ctx.bodyFront + back) / 2,
    hz = (ctx.bodyFront - back) / 2,
    hx = ctx.bodyHalfX ?? 176 * k;
  /** push a point that lies inside the body (or under `gap` mm from its skin) out onto the skin + gap */
  const onSkin = (p: Vec3, gap: number) => {
    const ex = p.x / (hx + gap),
      ez = (p.z - bz) / (hz + gap);
    const q = Math.hypot(ex, ez);
    return q >= 1 || q < 1e-6 ? p : v(p.x / q, p.y, bz + (p.z - bz) / q);
  };

  // ---- ECG electrodes and lead wires ----
  if (spec.ecg) {
    // model parameters: limb-lead positions on the chest (right and left infraclavicular, right and
    // left lower ribcage), a 5 mm hollow steel snap 4 mm tall on a 10 mm sensor disc, lead wires
    // draping to a cable anchor beyond the head end of the field
    const sites: { p: Vec3; anchor: Vec3 }[] = [
      { p: v(-92 * k, 172, ctx.bodyFront - 6), anchor: v(-150 * k, 520, ctx.bodyFront + 60) },
      { p: v(92 * k, 172, ctx.bodyFront - 6), anchor: v(150 * k, 520, ctx.bodyFront + 60) },
      { p: v(118 * k, -104, ctx.bodyFront - 46), anchor: v(190 * k, 540, ctx.bodyFront + 40) },
      { p: v(-118 * k, -110, ctx.bodyFront - 46), anchor: v(-190 * k, 540, ctx.bodyFront + 40) },
    ];
    sites.forEach(({ p, anchor }, idx) => {
      const c = chest(onSkin(p, 0.5));
      // outward skin normal at the snap (cross-section of the elliptic body)
      const nOut = nrm(v(c.x / (hx * hx), 0, (c.z - bz) / (hz * hz)));
      wires.push({ pts: [c, add(c, sc(nOut, 4))], r: [2.5, 2.5], mu: [0, 0, METAL.steel * 0.5], muIn: [0, 0, 0], inner: 0.7, name: "ECG snap" });
      // sensor disc: silver-coated plastic, faint (model parameter: 0.15 of the snap's steel value)
      wires.push({ pts: [add(c, sc(nOut, -0.4)), add(c, sc(nOut, 0.4))], r: [5, 5], mu: [0, 0, METAL.steel * 0.15], flat: 1, name: "ECG sensor" });
      // lead wire: copper conductor (0.35 mm radius bundle) in PVC insulation (1.6 mm outer radius),
      // both model parameters; a catenary with 8 % slack (model parameter) sagging posteriorly
      // (gravity for a supine patient), lying on the skin where it would sag into the chest. The
      // snap moves with breathing and the anchor does not, so the wire shifts and changes its sag.
      const start = add(c, sc(nOut, 4));
      const pts = catenary(start, anchor, 1.08 + 0.03 * ((idx * 7) % 3), v(0, 0, -1), 64).map((q) => onSkin(q, 1.8));
      wires.push({ pts, r: pts.map(() => 1.6), mu: [PLASTIC.pvc, 0, 0], muIn: [0, 0, METAL.copper], inner: 0.35 / 1.6, name: "ECG lead" });
    });
  }

  // ---- table top, its edges and the mattress ----
  if (spec.table) {
    // model parameters: 40 mm foam mattress under the patient with rounded sides (a flattened
    // cylinder, so its edge fades in gradually), then a 460 mm wide carbon-fibre sandwich panel:
    // two 1.5 mm skins 40 mm apart around a foam core, closed at each side by a 1.5 mm end wall
    const mTop = back - 1;
    solids.push({ type: 1, c: v(0, -100, mTop - 20), ax: I3, half: [270, 1200, 20], mu: PLASTIC.foam });
    const tTop = mTop - 41;
    for (const z of [tTop - 0.75, tTop - 40.75]) solids.push({ type: 2, c: v(0, -100, z), ax: I3, half: [230, 1200, 0.75], mu: 0.03 });
    solids.push({ type: 2, c: v(0, -100, tTop - 20.75), ax: I3, half: [228.5, 1200, 19.25], mu: PLASTIC.foam });
    for (const sx of [-1, 1]) solids.push({ type: 2, c: v(sx * 229.25, -100, tTop - 20.75), ax: I3, half: [0.75, 1200, 19.25], mu: 0.03 });
  }
  return { wires, solids };
}
