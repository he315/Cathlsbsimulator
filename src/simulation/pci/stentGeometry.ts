// ---------------------------------------------------------------------------
// Procedural stent geometry: rings of zig-zag struts joined by connectors,
// built in vessel-local coordinates (s along the stent, θ around it) and
// mapped onto the deployed centre line.
//
// Each ring has `crowns` peaks on each side, so 2·crowns struts of length ℓ
// around its circumference. At diameter D a strut spans πD/(2·crowns) around
// and √(ℓ² − (πD/2c)²) along the vessel: opening a ring shortens it, which is
// the stent's geometric foreshortening. Each ring takes its own expanded
// diameter (balloon-limited, or lesion-limited where the wall resists), so an
// under-expanded segment shows as a narrower ring envelope; rings smaller than
// the local lumen are malapposed; a compressed proximal end bunches its rings.
//
// Sourced: strut thickness 0.081 mm, delivery-balloon markers 0.4 mm beyond
// each stent end (FDA P110010). MODEL PARAMETERS: strut width, ring length,
// connector gap, crown counts, connectors per gap, crimped diameter, marker
// band size.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";

export interface StentDesign {
  /** strut thickness (radial, mm) */
  strutMm: number;
  /** strut width (mm) */
  strutWidthMm: number;
  /** axial length of one ring at nominal diameter (mm) */
  ringMm: number;
  /** gap bridged by connectors (mm) */
  gapMm: number;
  /** peaks per ring side by nominal diameter */
  crowns: (nominalD: number) => number;
  connectorsPerGap: number;
  /** crimped outer diameter (mm) */
  crimpedD: number;
  /** delivery-balloon marker bands: distance beyond each stent end and band length (mm) */
  markerBeyondMm: number;
  markerLenMm: number;
  markerD: number;
}

export const THIN_STRUT_DES: StentDesign = {
  strutMm: 0.081,
  strutWidthMm: 0.09,
  ringMm: 0.95,
  gapMm: 0.3,
  crowns: (d) => (d <= 3.0 ? 6 : 9),
  connectorsPerGap: 3,
  crimpedD: 1.05,
  markerBeyondMm: 0.4,
  markerLenMm: 1.0,
  markerD: 0.75,
};

export interface Ring {
  /** start and length along the stent (mm from the stent's proximal end, deployed) */
  s0: number;
  len: number;
  /** expanded diameter (mm) */
  d: number;
  /** local lumen diameter around it (mm) and the strut-to-wall gap (mm, 0 when apposed) */
  lumenD: number;
  gapMm: number;
  /** angular phase of the zig-zag (rad), alternating ring to ring */
  phase: number;
}

export interface StentGeom {
  design: StentDesign;
  nominalD: number;
  labelLengthMm: number;
  crowns: number;
  /** strut length (mm), fixed by the design at nominal diameter */
  strutLen: number;
  rings: Ring[];
  /** deployed length after foreshortening and compression (mm) */
  lengthMm: number;
  /** proximal-end compression (mm) */
  compressionMm: number;
}

/** Number of rings for a labelled length. */
export function ringCount(design: StentDesign, labelLengthMm: number): number {
  return Math.max(2, Math.round((labelLengthMm + design.gapMm) / (design.ringMm + design.gapMm)));
}

/** Strut length for a design at nominal diameter. */
export function strutLength(design: StentDesign, nominalD: number): number {
  const c = design.crowns(nominalD);
  const around = (Math.PI * nominalD) / (2 * c);
  return Math.hypot(design.ringMm, around);
}

/** Axial ring length at diameter d (foreshortening). */
export function ringLengthAt(design: StentDesign, nominalD: number, d: number): number {
  const c = design.crowns(nominalD);
  const l = strutLength(design, nominalD);
  const around = (Math.PI * d) / (2 * c);
  return Math.sqrt(Math.max(0.05 * l * l, l * l - around * around));
}

/**
 * Build the deployed stent: per-ring expanded diameters (`ringD`, one per ring, or a function of the
 * fractional position 0..1) and the local lumen diameters (for apposition).
 */
export function deployStent(
  nominalD: number,
  labelLengthMm: number,
  ringD: (u: number) => number,
  lumenD: (u: number) => number,
  opts: { design?: StentDesign; compressionMm?: number } = {}
): StentGeom {
  const design = opts.design ?? THIN_STRUT_DES;
  const n = ringCount(design, labelLengthMm);
  const crowns = design.crowns(nominalD);
  const strutLen = strutLength(design, nominalD);
  const rings: Ring[] = [];
  let s = 0;
  const comp = Math.max(0, opts.compressionMm ?? 0);
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 0.5;
    const d = Math.max(design.crimpedD, ringD(u));
    let len = ringLengthAt(design, nominalD, d);
    // proximal compression bunches the first rings: their gaps close first, then the rings tilt
    const proxShare = comp > 0 ? Math.max(0, 1 - i / Math.max(2, Math.ceil(comp / (design.gapMm * 0.8)))) : 0;
    const gap = design.gapMm * (1 - 0.85 * proxShare);
    len *= 1 - 0.25 * proxShare;
    const lum = lumenD(u);
    rings.push({ s0: s, len, d, lumenD: lum, gapMm: Math.max(0, (lum - d) / 2), phase: i % 2 === 0 ? 0 : Math.PI / crowns });
    s += len + (i < n - 1 ? gap : 0);
  }
  return { design, nominalD, labelLengthMm, crowns, strutLen, rings, lengthMm: s, compressionMm: comp };
}

/** Largest strut-to-wall gap (mm) and the length of stent with a gap above `thr`. */
export function malapposition(st: StentGeom, thr = 0.4): { maxGapMm: number; lengthOverMm: number } {
  let maxGap = 0,
    over = 0;
  for (const r of st.rings) {
    maxGap = Math.max(maxGap, r.gapMm);
    if (r.gapMm > thr) over += r.len;
  }
  return { maxGapMm: maxGap, lengthOverMm: over };
}

/** Minimal ring diameter and the expansion (min ring area / nominal area). */
export function expansion(st: StentGeom): { minD: number; ratio: number } {
  const minD = Math.min(...st.rings.map((r) => r.d));
  return { minD, ratio: (minD * minD) / (st.nominalD * st.nominalD) };
}

export interface LocalFrame {
  p: Vec3;
  T: Vec3;
  N: Vec3;
  B: Vec3;
}

/**
 * Strut centre lines in world space. `frame(s)` gives the centre-line frame at distance s from the stent's
 * proximal end. Each ring is one closed zig-zag polyline; connectors join a valley of one ring to the
 * next ring's peak.
 */
export function strutPolylines(st: StentGeom, frame: (s: number) => LocalFrame, ptsPerStrut = 2): { rings: Vec3[][]; connectors: Vec3[][] } {
  const c = st.crowns;
  const rings: Vec3[][] = [];
  const connectors: Vec3[][] = [];
  const at = (s: number, theta: number, rad: number): Vec3 => {
    const f = frame(s);
    const cx = Math.cos(theta),
      sx = Math.sin(theta);
    return {
      x: f.p.x + rad * (cx * f.N.x + sx * f.B.x),
      y: f.p.y + rad * (cx * f.N.y + sx * f.B.y),
      z: f.p.z + rad * (cx * f.N.z + sx * f.B.z),
    };
  };
  for (let i = 0; i < st.rings.length; i++) {
    const r = st.rings[i];
    const rad = r.d / 2 + st.design.strutMm / 2;
    const pts: Vec3[] = [];
    const nStruts = 2 * c;
    for (let k = 0; k <= nStruts; k++) {
      for (let q = 0; q < ptsPerStrut; q++) {
        const t = k + q / ptsPerStrut;
        if (t > nStruts) break;
        const theta = r.phase + (Math.PI * 2 * t) / nStruts;
        // zig-zag: even struts end at the distal crown, odd at the proximal crown
        const frac = t % 2;
        const z = frac <= 1 ? frac : 2 - frac;
        pts.push(at(r.s0 + z * r.len, theta, rad));
      }
    }
    rings.push(pts);
    if (i < st.rings.length - 1) {
      const nx = st.rings[i + 1];
      const nRad = nx.d / 2 + st.design.strutMm / 2;
      for (let k = 0; k < st.design.connectorsPerGap; k++) {
        const theta = r.phase + (2 * Math.PI * k) / st.design.connectorsPerGap + Math.PI / (2 * c);
        connectors.push([at(r.s0 + r.len, theta, rad), at(nx.s0, theta, nRad)]);
      }
    }
  }
  return { rings, connectors };
}

/** Marker-band positions (distance from the stent's proximal end, crimped length) on the delivery balloon. */
export function markerPositions(design: StentDesign, labelLengthMm: number): [number, number] {
  return [-design.markerBeyondMm - design.markerLenMm / 2, labelLengthMm + design.markerBeyondMm + design.markerLenMm / 2];
}

// ---------------------------------------------------------------------------
// Platform designs (pci-bench-stent-platforms-sizing). The bench's generic
// platforms (src/simulation/bench/platforms.ts) derive their designs from
// THIN_STRUT_DES, which stays as it is for the PCI lab. Marker placement follows
// cp-ostial-stent (Brilakis 15.1.10): in most drug-eluting stents the stent lies
// just inside the markers, but at least one platform is crimped at the centre of
// each marker.
// ---------------------------------------------------------------------------

/** A design derived from another with some properties changed (the base is not modified). */
export function deriveDesign(base: StentDesign, changes: Partial<StentDesign>): StentDesign {
  return { ...base, ...changes };
}

/** The marker distance that crimps each stent end at the centre of its marker band. */
export function centredMarkerBeyondMm(design: Pick<StentDesign, "markerLenMm">): number {
  return -design.markerLenMm / 2;
}

/** Where the stent's ends sit against the delivery balloon's markers: just inside them, or at their centres. */
export function markerRelation(design: StentDesign): "inside" | "centred" {
  return Math.abs(design.markerBeyondMm - centredMarkerBeyondMm(design)) < 1e-9 ? "centred" : "inside";
}

/** The crimped delivery system along its axis (mm from the stent's proximal end): the stent and the two marker bands. */
export interface DeliveryLayout {
  stent: [number, number];
  markers: [[number, number], [number, number]];
  /** distance from each marker band's centre to the stent end beside it (mm, positive when the stent lies inside) */
  edgeFromMarkerCentreMm: number;
}

export function deliveryLayout(design: StentDesign, labelLengthMm: number): DeliveryLayout {
  const [pc, dc] = markerPositions(design, labelLengthMm);
  const h = design.markerLenMm / 2;
  return {
    stent: [0, labelLengthMm],
    markers: [
      [pc - h, pc + h],
      [dc - h, dc + h],
    ],
    edgeFromMarkerCentreMm: design.markerBeyondMm + h,
  };
}

// ---------------------------------------------------------------------------
// Side-branch ostia under a deployed stent (pci-two-rail-engine): where the
// branch ostium lies along the main vessel, which ring sits over a point, and
// the effective diameter of two kissing balloons.
// ---------------------------------------------------------------------------

/**
 * Finet's coefficient for two balloons inflated side by side (cp-bifurcation-provisional-sb, "Finet's law
 * applied to kissing balloons (Brilakis 16.2)": effective diameter = 0.678 x (sum of the two diameters)).
 */
export const FINET_KISS_COEFF = 0.678;

/** The effective diameter of two kissing balloons (mm), by the module's formula. */
export function kissEffectiveDiameter(dA: number, dB: number): number {
  return FINET_KISS_COEFF * (dA + dB);
}

/**
 * Length of a side-branch ostium along the main vessel (mm): the branch diameter over the sine of its
 * take-off angle, kept between one and two branch diameters (a teaching geometry: an elliptical ostium of a
 * cylinder meeting a cylinder; the clamp is a MODEL PARAMETER, MP_OSTIUM_LEN_MIN and MP_OSTIUM_LEN_MAX in
 * units of the branch diameter).
 */
export const MP_OSTIUM_LEN_MIN = 1;
export const MP_OSTIUM_LEN_MAX = 2;
export function ostiumLengthMm(sbD: number, angleRad: number): number {
  const s = Math.max(1e-3, Math.abs(Math.sin(angleRad)));
  return Math.max(MP_OSTIUM_LEN_MIN * sbD, Math.min(MP_OSTIUM_LEN_MAX * sbD, sbD / s));
}

/** The ostium's span along the main vessel (route mm): proximal edge and carina (its distal edge), centred on the origin. */
export function ostiumSpan(atMm: number, sbD: number, angleRad: number): { proxMm: number; carinaMm: number } {
  const h = ostiumLengthMm(sbD, angleRad) / 2;
  return { proxMm: atMm - h, carinaMm: atMm + h };
}

/** Where a point lies along an ostium: 0 at its proximal edge, 1 at the carina (unclamped). */
export function ostiumFraction(mm: number, o: { proxMm: number; carinaMm: number }): number {
  return (mm - o.proxMm) / Math.max(1e-6, o.carinaMm - o.proxMm);
}

/** The ring of a placed stent (its ringD index, proximal to distal) whose span holds route position `mm`, or -1 outside the stent. */
export function ringIndexAt(p: { fromMm: number; toMm: number; ringD: readonly number[] }, mm: number): number {
  if (mm < p.fromMm || mm > p.toMm || p.ringD.length === 0) return -1;
  const n = p.ringD.length;
  return Math.min(n - 1, Math.max(0, Math.floor(((mm - p.fromMm) / Math.max(1e-6, p.toMm - p.fromMm)) * n)));
}

/** The centre (route mm) of ring `i` of a placed stent, as the deployment spaced them. */
export function ringCentreMm(p: { fromMm: number; toMm: number; ringD: readonly number[] }, i: number): number {
  return p.fromMm + ((p.toMm - p.fromMm) * (i + 0.5)) / Math.max(1, p.ringD.length);
}
