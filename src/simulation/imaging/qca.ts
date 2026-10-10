// ---------------------------------------------------------------------------
// Trainee QCA on a stored frame.
//
// The trainee picks a stored frame, calibrates on the catheter (a known French
// size) and marks a segment from normal to normal. The tool follows the vessel
// between the marks, finds both edges on each perpendicular profile (steepest
// intensity change, sub-pixel), and reports the diameter function, the minimal
// lumen diameter, an interpolated reference and the diameter stenosis.
//
// Nothing here reads the scene's ground truth: it measures pixels. Its error is
// therefore the error of edge detection on a blurred, noisy, low-resolution
// image (it overestimates small widths, as first-generation edge detectors do,
// Hausleiter 1997) plus the calibration error of a catheter a few pixels wide
// (the weakest link of QCA, Liénard 2002). Sources: docs/realism/facts/C2.md.
// The result is labelled as the trainee's own measurement in the UI.
// ---------------------------------------------------------------------------

export interface GrayFrame {
  w: number;
  h: number;
  /** 0 = black … 255 = white, row-major, y down. Contrast-filled vessels and catheters are dark. */
  data: Uint8Array | Uint8ClampedArray | Float32Array;
}

export interface Pt {
  x: number;
  y: number;
}

/** 1 Fr = 1/3 mm (French catheter scale; facts C2 Q1). */
export const MM_PER_FRENCH = 1 / 3;

/** Tool settings. Every value is a MODEL PARAMETER of this tool (facts C2, model parameters). */
export const QCA_PARAMS = {
  /** profile sample step (px) */
  stepPx: 0.25,
  /** profile half-length (px): how far either side of the centre line edges are searched */
  halfLenPx: 16,
  /** Gaussian smoothing of a profile before differentiation (px) */
  smoothPx: 0.7,
  /** spacing of measurement positions along the segment (px) */
  spacingPx: 1,
  /** centre-line re-centring passes */
  recentrePasses: 3,
  /** moving-average window for the centre line (positions) */
  centreSmooth: 5,
  /** share of the segment at each end averaged for the interpolated reference */
  refShare: 0.15,
  /** an edge pair must be at least this many grey levels deep (else no measurement there) */
  minContrast: 12,
  /** share of the positions along a segment that must measure, else the segment is refused */
  minValidShare: 0.6,
  /** lesion extent: contiguous diameters below this fraction of the reference around the MLD */
  lesionFraction: 0.8,
  /** running-median window of the diameter function (positions) */
  medianWin: 5,
};

/** Bilinear sample with clamping at the frame border. */
export function sample(f: GrayFrame, x: number, y: number): number {
  const xi = Math.max(0, Math.min(f.w - 1.001, x));
  const yi = Math.max(0, Math.min(f.h - 1.001, y));
  const x0 = Math.floor(xi);
  const y0 = Math.floor(yi);
  const fx = xi - x0;
  const fy = yi - y0;
  const i = y0 * f.w + x0;
  const d = f.data;
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + f.w] * (1 - fx) + d[i + f.w + 1] * fx) * fy;
}

function gaussSmooth(p: Float64Array, sigmaSamples: number): Float64Array {
  if (sigmaSamples <= 0) return p;
  const r = Math.ceil(sigmaSamples * 3);
  const k: number[] = [];
  let ks = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigmaSamples * sigmaSamples));
    k.push(v);
    ks += v;
  }
  const out = new Float64Array(p.length);
  for (let i = 0; i < p.length; i++) {
    let s = 0;
    for (let j = -r; j <= r; j++) s += p[Math.max(0, Math.min(p.length - 1, i + j))] * k[j + r];
    out[i] = s / ks;
  }
  return out;
}

/** Sub-pixel position of an extremum at index i of array a (parabola through i-1, i, i+1). */
function parabolic(a: Float64Array, i: number): number {
  if (i <= 0 || i >= a.length - 1) return i;
  const y0 = a[i - 1];
  const y1 = a[i];
  const y2 = a[i + 1];
  const den = y0 - 2 * y1 + y2;
  if (Math.abs(den) < 1e-12) return i;
  return i + Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / den));
}

export interface EdgeResult {
  /** signed positions of the edges along the normal (px, from the probe centre) */
  left: number;
  right: number;
  widthPx: number;
  /** contrast of the object: background minus the darkest point (grey levels) */
  depth: number;
}

/**
 * Find a dark object's two edges on the profile through `c` along the unit normal `n`.
 * Edges are the steepest falling and rising slopes either side of the darkest point near the centre.
 */
export function measureProfile(f: GrayFrame, c: Pt, n: Pt, o: Partial<typeof QCA_PARAMS> = {}): EdgeResult | null {
  const P = { ...QCA_PARAMS, ...o };
  const N = Math.round((2 * P.halfLenPx) / P.stepPx) + 1;
  const raw = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const s = -P.halfLenPx + i * P.stepPx;
    raw[i] = sample(f, c.x + n.x * s, c.y + n.y * s);
  }
  const p = gaussSmooth(raw, P.smoothPx / P.stepPx);
  // darkest point within the middle half of the profile
  const mid = (N - 1) / 2;
  const q = Math.round(N / 4);
  let m = Math.round(mid);
  for (let i = Math.round(mid) - q; i <= Math.round(mid) + q; i++) if (p[i] < p[m]) m = i;
  // derivative
  const d = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) d[i] = (p[i + 1] - p[i - 1]) / (2 * P.stepPx);
  // walk out from the minimum until the profile has recovered 90% of the way to its local maximum: bounds the edge search
  let lMax = m;
  for (let i = m; i > 0; i--) if (p[i] > p[lMax]) lMax = i;
  let rMax = m;
  for (let i = m; i < N - 1; i++) if (p[i] > p[rMax]) rMax = i;
  const lBound = (() => {
    const lim = p[m] + 0.9 * (p[lMax] - p[m]);
    for (let i = m; i > 0; i--) if (p[i] >= lim) return i;
    return 1;
  })();
  const rBound = (() => {
    const lim = p[m] + 0.9 * (p[rMax] - p[m]);
    for (let i = m; i < N - 1; i++) if (p[i] >= lim) return i;
    return N - 2;
  })();
  let li = m;
  for (let i = lBound; i <= m; i++) if (d[i] < d[li]) li = i;
  let ri = m;
  for (let i = m; i <= rBound; i++) if (d[i] > d[ri]) ri = i;
  if (li >= m || ri <= m) return null;
  const depth = Math.min(p[lMax], p[rMax]) - p[m];
  if (depth < P.minContrast) return null;
  const left = -P.halfLenPx + parabolic(d, li) * P.stepPx;
  const right = -P.halfLenPx + parabolic(d, ri) * P.stepPx;
  return { left, right, widthPx: right - left, depth };
}

/**
 * Snap a click to the centre of the dark structure under it: the darkest 3 x 3 mean within `radiusPx`.
 * Clinical QCA packages snap marks to the vessel the same way; the radius is a MODEL PARAMETER of the tool.
 */
export function snapToVessel(f: GrayFrame, p: Pt, radiusPx = QCA_SNAP_PX): Pt {
  let best = p;
  let bestV = Infinity;
  const r = Math.max(0, Math.round(radiusPx));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = Math.round(p.x) + dx;
      const y = Math.round(p.y) + dy;
      if (x < 1 || y < 1 || x >= f.w - 1 || y >= f.h - 1) continue;
      let m = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) m += f.data[(y + j) * f.w + x + i];
      if (m < bestV) {
        bestV = m;
        best = { x, y };
      }
    }
  }
  return best;
}

/** Snap radius for marks (px of the stored frame). Model parameter of the tool. */
export const QCA_SNAP_PX = 5;

/** Resample a polyline every `step` px. */
export function resamplePath(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    let s = step - carry;
    while (s <= L + 1e-9) {
      out.push({ x: a.x + ((b.x - a.x) * s) / L, y: a.y + ((b.y - a.y) * s) / L });
      s += step;
    }
    carry = L - (s - step);
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > step * 0.25) out.push(last);
  return out;
}

function tangents(c: Pt[]): Pt[] {
  return c.map((_, i) => {
    const a = c[Math.max(0, i - 2)];
    const b = c[Math.min(c.length - 1, i + 2)];
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
  });
}

function smoothLine(c: Pt[], win: number): Pt[] {
  const h = Math.floor(win / 2);
  return c.map((p, i) => {
    if (i === 0 || i === c.length - 1) return p;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let j = Math.max(0, i - h); j <= Math.min(c.length - 1, i + h); j++) {
      sx += c[j].x;
      sy += c[j].y;
      n++;
    }
    return { x: sx / n, y: sy / n };
  });
}

export interface Trace {
  /** centre line (px) */
  centre: Pt[];
  /** width at each centre point (px), NaN where no edge pair was found */
  widthPx: number[];
  /** edge points for drawing */
  leftEdge: Pt[];
  rightEdge: Pt[];
}

/** Follow a dark tube between user marks: resample, re-centre on the edge midpoints, measure perpendicular widths. */
export function traceVessel(f: GrayFrame, marks: Pt[], o: Partial<typeof QCA_PARAMS> = {}): Trace {
  const P = { ...QCA_PARAMS, ...o };
  let c = resamplePath(marks, P.spacingPx);
  for (let pass = 0; pass < P.recentrePasses; pass++) {
    const t = tangents(c);
    c = c.map((p, i) => {
      if (i === 0 || i === c.length - 1) return p; // the user's end marks stay where they were put
      const n = { x: -t[i].y, y: t[i].x };
      const e = measureProfile(f, p, n, P);
      if (!e) return p;
      const mid = (e.left + e.right) / 2;
      return { x: p.x + n.x * mid, y: p.y + n.y * mid };
    });
    c = resamplePath(smoothLine(c, P.centreSmooth), P.spacingPx);
  }
  const t = tangents(c);
  const widthPx: number[] = [];
  const leftEdge: Pt[] = [];
  const rightEdge: Pt[] = [];
  c.forEach((p, i) => {
    const n = { x: -t[i].y, y: t[i].x };
    const e = measureProfile(f, p, n, P);
    if (!e) {
      widthPx.push(NaN);
      leftEdge.push(p);
      rightEdge.push(p);
      return;
    }
    widthPx.push(e.widthPx);
    leftEdge.push({ x: p.x + n.x * e.left, y: p.y + n.y * e.left });
    rightEdge.push({ x: p.x + n.x * e.right, y: p.y + n.y * e.right });
  });
  return { centre: c, widthPx, leftEdge, rightEdge };
}

export interface Calibration {
  /** mm per stored-frame pixel at the catheter's depth */
  mmPerPx: number;
  /** the catheter's measured width (px) and its spread along the marked length */
  widthPx: number;
  sdPx: number;
  /** positions measured */
  n: number;
  french: number;
}

/** Calibrate on a catheter of known French size between two marks along it. */
export function calibrateOnCatheter(f: GrayFrame, a: Pt, b: Pt, french: number, o: Partial<typeof QCA_PARAMS> = {}): Calibration | null {
  const tr = traceVessel(f, [a, b], o);
  // drop the ends (the user's marks are not re-centred)
  const inner = tr.widthPx.slice(2, -2);
  const w = inner.filter((x) => Number.isFinite(x));
  if (w.length < 3 || w.length < (o.minValidShare ?? QCA_PARAMS.minValidShare) * inner.length) return null;
  const mean = w.reduce((s, x) => s + x, 0) / w.length;
  const sd = Math.sqrt(w.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, w.length - 1));
  if (!(mean > 0.5)) return null;
  return { mmPerPx: (french * MM_PER_FRENCH) / mean, widthPx: mean, sdPx: sd, n: w.length, french };
}

export interface QcaResult {
  /** arc length from the proximal mark (mm) and diameter (mm) per position */
  posMm: number[];
  diamMm: number[];
  /** minimal lumen diameter and where it is */
  mldMm: number;
  mldIndex: number;
  /** index of the MLD position in trace.centre / leftEdge / rightEdge */
  mldTraceIndex: number;
  mldPosMm: number;
  /** interpolated reference at the MLD (mean of the proximal and distal ends, interpolated by position) */
  refMm: number;
  refProxMm: number;
  refDistMm: number;
  /** diameter stenosis (%) against the reference interpolated to the MLD's position (refMm) */
  dsPct: number;
  /**
   * diag-qca-measurement: the average of the proximal and distal references, the diameter stenosis
   * against it (the reported %DS in the diagnostic lab: 100 x (1 - MLD / average of the proximal and
   * distal reference), pm-interpreting-stenosis), the one-ended %DS on either reference alone, and the
   * derived area stenosis against the average (geometric, assuming a circular lumen).
   */
  refAvgMm: number;
  dsAvgPct: number;
  dsProxPct: number;
  dsDistPct: number;
  areaStenosisPct: number;
  /** extent of the narrowing: contiguous positions below lesionFraction x reference around the MLD (mm) */
  lesionLengthMm: number;
  segmentLengthMm: number;
  trace: Trace;
  mmPerPx: number;
}

/** Running median over `win` positions (NaN-aware): one-position dips at crossings and noise are not lesions. */
function medianN(a: number[], win: number): number[] {
  const h = Math.floor(win / 2);
  return a.map((_, i) => {
    const w: number[] = [];
    for (let j = i - h; j <= i + h; j++) if (j >= 0 && j < a.length && Number.isFinite(a[j])) w.push(a[j]);
    if (!w.length) return NaN;
    w.sort((x, y) => x - y);
    return w[Math.floor(w.length / 2)];
  });
}

/** Analyse a segment between the trainee's marks (proximal first) on a calibrated frame. */
export function analyseSegment(f: GrayFrame, marks: Pt[], mmPerPx: number, o: Partial<typeof QCA_PARAMS> = {}): QcaResult | null {
  const P = { ...QCA_PARAMS, ...o };
  if (marks.length < 2 || !(mmPerPx > 0)) return null;
  const tr = traceVessel(f, marks, P);
  const n = tr.centre.length;
  if (n < 8) return null;
  // the user's end marks are not re-centred: measure from the third position to the third last
  const keep = (i: number) => i >= 2 && i < n - 2;
  // the diameter function is smoothed before the MLD is read (running median, model parameter of the tool)
  const wSm = medianN(tr.widthPx, P.medianWin);
  const posMm: number[] = [];
  const diamMm: number[] = [];
  const traceIdx: number[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) acc += Math.hypot(tr.centre[i].x - tr.centre[i - 1].x, tr.centre[i].y - tr.centre[i - 1].y) * mmPerPx;
    if (!keep(i) || !Number.isFinite(wSm[i])) continue;
    posMm.push(acc);
    diamMm.push(wSm[i] * mmPerPx);
    traceIdx.push(i);
  }
  if (diamMm.length < 6 || diamMm.length < P.minValidShare * Math.max(1, n - 4)) return null;
  const k = Math.max(2, Math.round(diamMm.length * P.refShare));
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const refProx = mean(diamMm.slice(0, k));
  const refDist = mean(diamMm.slice(-k));
  let mi = k;
  for (let i = k; i < diamMm.length - k; i++) if (diamMm[i] < diamMm[mi]) mi = i;
  // the MLD may sit inside an end window when the marks are too close to the lesion
  for (let i = 0; i < diamMm.length; i++) if (diamMm[i] < diamMm[mi]) mi = i;
  const L0 = posMm[0];
  const L1 = posMm[posMm.length - 1];
  const fr = L1 > L0 ? (posMm[mi] - L0) / (L1 - L0) : 0.5;
  const ref = refProx + (refDist - refProx) * fr;
  const mld = diamMm[mi];
  let a = mi;
  let b = mi;
  while (a > 0 && diamMm[a - 1] < P.lesionFraction * ref) a--;
  while (b < diamMm.length - 1 && diamMm[b + 1] < P.lesionFraction * ref) b++;
  const lesionLen = mld < P.lesionFraction * ref ? posMm[b] - posMm[a] + P.spacingPx * mmPerPx : 0;
  return {
    posMm,
    diamMm,
    mldMm: mld,
    mldIndex: mi,
    mldTraceIndex: traceIdx[mi],
    mldPosMm: posMm[mi],
    refMm: ref,
    refProxMm: refProx,
    refDistMm: refDist,
    dsPct: Math.max(0, (1 - mld / ref) * 100),
    ...referenceStenosis(mld, refProx, refDist),
    lesionLengthMm: lesionLen,
    segmentLengthMm: L1 - L0,
    trace: tr,
    mmPerPx,
  };
}

// ---------------------------------------------------------------------------
// References, area stenosis, foreshortening and the reported measurement
// (diag-qca-measurement).
//
// The diagnostic lab reports the stenosis against the average of the proximal
// and distal references, as the stenosis lesson gives the formula
// (pm-interpreting-stenosis: %DS = 100 x (1 - MLD / average of the proximal and
// distal reference); its worked example shows the proximal reference alone
// overstating and the distal alone understating a lesion in a tapering
// vessel). The area stenosis is derived from the diameters, 1 - (MLD/ref)^2,
// which assumes a circular lumen (the lesson: 'area stenosis is calculated from
// mathematical assumptions about the lumen's shape').
//
// A reported measurement carries the learner's numbers, the view (the stored
// run's C-arm), the segment the learner names, the foreshortening of that
// segment in that view, and the model's projected %DS of the lesion in that
// segment for that view and for every other stored run of the case. The model
// values are computed when the learner reports and are read only by the
// debrief check (src/mentor/debriefChecks/qca.ts); no live screen shows them.
// ---------------------------------------------------------------------------

/** Diameter stenosis (%) of an MLD against a reference, 0 when the reference is not positive. */
export function diameterStenosisPct(mldMm: number, refMm: number): number {
  return refMm > 0 ? Math.max(0, (1 - mldMm / refMm) * 100) : 0;
}

/** Area stenosis (%) derived from the diameters, assuming a circular lumen: 1 - (MLD/ref)^2. */
export function areaStenosisPct(mldMm: number, refMm: number): number {
  return refMm > 0 ? Math.max(0, (1 - (mldMm / refMm) ** 2) * 100) : 0;
}

/** Both references, their average and the stenoses against each. */
export function referenceStenosis(mldMm: number, refProxMm: number, refDistMm: number): Pick<QcaResult, "refAvgMm" | "dsAvgPct" | "dsProxPct" | "dsDistPct" | "areaStenosisPct"> {
  const refAvgMm = (refProxMm + refDistMm) / 2;
  return {
    refAvgMm,
    dsAvgPct: diameterStenosisPct(mldMm, refAvgMm),
    dsProxPct: diameterStenosisPct(mldMm, refProxMm),
    dsDistPct: diameterStenosisPct(mldMm, refDistMm),
    areaStenosisPct: areaStenosisPct(mldMm, refAvgMm),
  };
}

/**
 * Foreshortening (projected length / true length of the named segment in the run's view) below which
 * a measured frame is flagged as foreshortened. MODEL PARAMETER: the same value as the view coverage's
 * adequacy threshold (src/mentor/coverage.ts DEFAULT_COVERAGE.minForeshortening; qca.test.ts checks the
 * two agree), so a view the debrief calls adequate for a segment is one QCA accepts.
 */
export const QCA_FORESHORTENED_BELOW = 0.8;

/**
 * How far (percentage points) a reported %DS may lie from the model's projected %DS in the same view
 * and still pass, and how much worse another adequate view must show the lesion before the reported
 * view counts as the milder one. The lab request's success criterion (pm-interpreting#0: 'within 5
 * percentage points of the model's true value from the correct view'); it allows for calibration on a
 * 6 Fr catheter a few pixels wide at the stored frame's resolution.
 */
export const QCA_REPORT_TOLERANCE_PCT = 5;

/** Is a measured segment foreshortened in its view (undefined: not known, not flagged)? */
export function isForeshortened(foreshortening: number | undefined): boolean {
  return foreshortening !== undefined && Number.isFinite(foreshortening) && foreshortening < QCA_FORESHORTENED_BELOW;
}

/** A view as the lab's run header names it: 'LAO 30  CAU 25'. */
export function viewText(a: { laoRao: number; cranialCaudal: number }): string {
  const lr = Math.round(a.laoRao);
  const cc = Math.round(a.cranialCaudal);
  return `${lr >= 0 ? "LAO" : "RAO"} ${Math.abs(lr)}  ${cc >= 0 ? "CRA" : "CAU"} ${Math.abs(cc)}`;
}

/** The model's projected %DS of a lesion in one stored run's view, with the segment's foreshortening there. */
export interface QcaViewTruth {
  run: number;
  view: string;
  cArm: { laoRao: number; cranialCaudal: number };
  /** the model's projected %DS in this view (null: the lesion is not drawn) */
  pctDS: number | null;
  foreshortening?: number;
}

/** One measurement the learner reported ('Report this measurement'). */
export interface QcaReport {
  caseId: string;
  /** epoch ms when it was reported (binds it to the procedure record's startedAt) */
  at: number;
  /** lab wall time (s) when it was reported */
  tWall: number;
  /** the stored run (series number) and its view */
  run: number;
  view: string;
  cArm: { laoRao: number; cranialCaudal: number };
  /** the SYNTAX segment the learner named (src/mentor/coverage.ts SEGMENT_NAMES) */
  segment: string;
  /** the learner's numbers (mm, %) */
  mldMm: number;
  refProxMm: number;
  refDistMm: number;
  refAvgMm: number;
  dsPct: number;
  dsProxPct: number;
  dsDistPct: number;
  areaStenosisPct: number;
  lengthMm: number;
  /** foreshortening of the named segment in this view (undefined: the segment is not in the tree) */
  foreshortening?: number;
  foreshortened: boolean;
  /**
   * The model, for the debrief only: the case's lesion in the named segment (its index in
   * caseData.lesions, null when none lies there), its projected %DS in this view, and in the view of
   * every stored cine run of the case at the time of the report.
   */
  truth: { lesionIndex: number | null; pctDS: number | null; byRun: QcaViewTruth[] };
}

/** A report from a QCA result: the learner's numbers with the reference monitor's run, view and named segment. */
export function buildQcaReport(
  r: Pick<QcaResult, "mldMm" | "refProxMm" | "refDistMm" | "refAvgMm" | "dsAvgPct" | "dsProxPct" | "dsDistPct" | "areaStenosisPct" | "segmentLengthMm">,
  o: { caseId: string; at: number; tWall: number; run: number; cArm: { laoRao: number; cranialCaudal: number }; segment: string; foreshortening?: number; truth: QcaReport["truth"] }
): QcaReport {
  return {
    caseId: o.caseId,
    at: o.at,
    tWall: o.tWall,
    run: o.run,
    view: viewText(o.cArm),
    cArm: { laoRao: o.cArm.laoRao, cranialCaudal: o.cArm.cranialCaudal },
    segment: o.segment,
    mldMm: r.mldMm,
    refProxMm: r.refProxMm,
    refDistMm: r.refDistMm,
    refAvgMm: r.refAvgMm,
    dsPct: r.dsAvgPct,
    dsProxPct: r.dsProxPct,
    dsDistPct: r.dsDistPct,
    areaStenosisPct: r.areaStenosisPct,
    // marked from normal segment to normal segment: the segment's length is the lesion's length
    lengthMm: r.segmentLengthMm,
    ...(o.foreshortening !== undefined ? { foreshortening: o.foreshortening } : {}),
    foreshortened: isForeshortened(o.foreshortening),
    truth: o.truth,
  };
}

/** The reported measurements of this page (newest last). In memory only: the debrief reads them when the case ends. */
const REPORTS: QcaReport[] = [];
/** Most reports kept (older ones are dropped). MODEL PARAMETER of the tool (a memory bound). */
export const QCA_REPORTS_MAX = 50;
const listeners = new Set<() => void>();

export function reportQca(r: QcaReport): void {
  REPORTS.push(r);
  while (REPORTS.length > QCA_REPORTS_MAX) REPORTS.shift();
  for (const l of listeners) l();
}

/**
 * The reports of a case made at or after `sinceMs` and, when `untilMs` is given, at or before it (epoch ms),
 * oldest first. A finished record passes its endedAt as `untilMs`, so a later session of the same case does not
 * lend it its reports when it is debriefed again.
 */
export function qcaReportsFor(caseId: string, sinceMs = 0, untilMs = Infinity): QcaReport[] {
  return REPORTS.filter((r) => r.caseId === caseId && r.at >= sinceMs && r.at <= untilMs);
}

/** Forget every report (tests; a new page). */
export function clearQcaReports(): void {
  REPORTS.length = 0;
  for (const l of listeners) l();
}

export function onQcaReports(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** What the debrief makes of the reports of one lesion (the latest report stands; earlier ones are views measured). */
export interface QcaVerdict {
  lesionIndex: number | null;
  segment: string;
  /** the report that stands */
  report: QcaReport;
  /** the views the learner measured this lesion in (run numbers, report order) */
  measuredRuns: number[];
  /** the reported frame foreshortens the segment */
  foreshortened: boolean;
  /** the model's %DS in the reported view */
  truePct: number | null;
  /**
   * the value the report is judged against: the model's %DS in the worse, least foreshortened stored view
   * (the view the lesson says to report), or in the reported view when that is the worse one (within 0.5
   * point), when no adequate view is stored, or when the reported frame is foreshortened
   */
  targetPct: number | null;
  /** the stored run whose model value is the target */
  targetRun: number;
  /** the reported value's distance from the target (points) */
  errorPct: number | null;
  withinTolerance: boolean;
  /** the worse, least foreshortened stored view of the lesion (null: no adequate view stored) */
  worse: QcaViewTruth | null;
  /** the reported view is not the worse one: the worse view shows the lesion more than the tolerance tighter */
  milderView: boolean;
  /** every stored view known at any of this lesion's reports (the latest report's entry wins for a run), run order */
  views: QcaViewTruth[];
  /** the measured runs (measuredRuns) that lay the segment out and show the lesion */
  measuredAdequateRuns: number[];
  /** fewer than two measured views lay the segment out (the lesson's two views) */
  oneView: boolean;
  /** the measurement passes: not foreshortened, within the tolerance, in the worse view */
  pass: boolean;
}

/**
 * The worse view among stored runs: the highest projected %DS among the views that do not foreshorten
 * the segment; ties (within 0.5 point) go to the less foreshortened view.
 */
export function worseView(views: readonly QcaViewTruth[]): QcaViewTruth | null {
  let best: QcaViewTruth | null = null;
  for (const v of views) {
    if (v.pctDS === null || isForeshortened(v.foreshortening)) continue;
    if (!best || v.pctDS > best.pctDS! + 0.5 || (Math.abs(v.pctDS - best.pctDS!) <= 0.5 && (v.foreshortening ?? 0) > (best.foreshortening ?? 0))) best = v;
  }
  return best;
}

/** Judge the reports (grouped by the model's lesion, else by the named segment). */
export function qcaVerdicts(reports: readonly QcaReport[]): QcaVerdict[] {
  const groups = new Map<string, QcaReport[]>();
  for (const r of reports) {
    const k = r.truth.lesionIndex !== null ? `l${r.truth.lesionIndex}` : `s${r.segment}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const out: QcaVerdict[] = [];
  for (const rs of groups.values()) {
    const report = rs[rs.length - 1];
    const measuredRuns = [...new Set(rs.map((r) => r.run))];
    const truePct = report.truth.pctDS;
    // every stored view known at any of this lesion's reports (the latest report's list wins for a run), with each
    // measured view as its report saw it when no list holds it
    const byRun = new Map<number, QcaViewTruth>();
    for (const r of rs) for (const v of r.truth.byRun) byRun.set(v.run, v);
    for (const r of rs) if (!byRun.has(r.run)) byRun.set(r.run, { run: r.run, view: r.view, cArm: r.cArm, pctDS: r.truth.pctDS, ...(r.foreshortening !== undefined ? { foreshortening: r.foreshortening } : {}) });
    const views = [...byRun.values()].sort((a, b) => a.run - b.run);
    const worse = worseView(views);
    const foreshortened = report.foreshortened;
    const milderView = !!worse && worse.run !== report.run && truePct !== null && worse.pctDS! - truePct > QCA_REPORT_TOLERANCE_PCT;
    // judged against the worse view's value (the lesson: report the view in which the lesion looks worse), unless the
    // reported view is that view (or level with it), no adequate view is stored, or the frame is foreshortened
    const inWorse = !worse || foreshortened || worse.run === report.run || (truePct !== null && Math.abs(worse.pctDS! - truePct) <= 0.5);
    const targetPct = inWorse ? truePct : worse!.pctDS;
    const targetRun = inWorse ? report.run : worse!.run;
    const errorPct = targetPct === null ? null : report.dsPct - targetPct;
    const withinTolerance = errorPct !== null && Math.abs(errorPct) <= QCA_REPORT_TOLERANCE_PCT;
    const measuredAdequateRuns = measuredRuns.filter((n) => {
      const v = byRun.get(n);
      return !!v && v.pctDS !== null && !isForeshortened(v.foreshortening);
    });
    out.push({
      lesionIndex: report.truth.lesionIndex,
      segment: report.segment,
      report,
      measuredRuns,
      foreshortened,
      truePct,
      targetPct,
      targetRun,
      errorPct,
      withinTolerance,
      worse,
      milderView,
      views,
      measuredAdequateRuns,
      oneView: measuredAdequateRuns.length < 2,
      pass: !foreshortened && withinTolerance && !milderView,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Synthetic frames (tests and the tool's self-check): dark tubes with a
// path-length profile, Gaussian blur and noise.
// ---------------------------------------------------------------------------

export interface SynthTube {
  /** centre line (px) */
  pts: Pt[];
  /** diameter (px) at each point, or one value */
  diamPx: number | number[];
  /** attenuation per px of path length (log units) */
  mu: number;
}

/** Deterministic generator (mulberry32). */
export function rng32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function synthFrame(w: number, h: number, tubes: SynthTube[], o: { bg?: number; blurPx?: number; noise?: number; seed?: number; supersample?: number } = {}): GrayFrame {
  const bg = o.bg ?? 175;
  const ss = o.supersample ?? 4;
  const path = new Float64Array(w * h);
  const W = w * ss;
  const H = h * ss;
  for (const t of tubes) {
    const dense = resamplePath(t.pts, 0.25);
    const dAt = (i: number) => (Array.isArray(t.diamPx) ? t.diamPx[Math.min(t.diamPx.length - 1, Math.round((i / Math.max(1, dense.length - 1)) * (t.diamPx.length - 1)))] : t.diamPx);
    // nearest centre-line sample per sub-pixel, searched only near the tube
    const best = new Float64Array(W * H).fill(Infinity);
    const rad = new Float64Array(W * H);
    for (let i = 0; i < dense.length; i++) {
      const R = dAt(i) / 2;
      const cx = dense[i].x;
      const cy = dense[i].y;
      const x0 = Math.max(0, Math.floor((cx - R - 1 + 0.5) * ss));
      const x1 = Math.min(W - 1, Math.ceil((cx + R + 1 + 0.5) * ss));
      const y0 = Math.max(0, Math.floor((cy - R - 1 + 0.5) * ss));
      const y1 = Math.min(H - 1, Math.ceil((cy + R + 1 + 0.5) * ss));
      for (let Y = y0; Y <= y1; Y++) {
        const py = (Y + 0.5) / ss - 0.5;
        for (let X = x0; X <= x1; X++) {
          const px = (X + 0.5) / ss - 0.5;
          const d2 = (cx - px) ** 2 + (cy - py) ** 2;
          const k = Y * W + X;
          if (d2 < best[k]) {
            best[k] = d2;
            rad[k] = R;
          }
        }
      }
    }
    for (let Y = 0; Y < H; Y++)
      for (let X = 0; X < W; X++) {
        const k = Y * W + X;
        const R = rad[k];
        if (best[k] < R * R) path[Math.floor(Y / ss) * w + Math.floor(X / ss)] += (2 * Math.sqrt(R * R - best[k]) * t.mu) / (ss * ss);
      }
  }
  let img = new Float64Array(w * h);
  for (let i = 0; i < img.length; i++) img[i] = bg * Math.exp(-path[i]);
  const blur = o.blurPx ?? 0;
  if (blur > 0) {
    const r = Math.ceil(blur * 3);
    const k: number[] = [];
    let ks = 0;
    for (let i = -r; i <= r; i++) {
      const v = Math.exp(-(i * i) / (2 * blur * blur));
      k.push(v);
      ks += v;
    }
    const tmp = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let j = -r; j <= r; j++) s += img[y * w + Math.max(0, Math.min(w - 1, x + j))] * k[j + r];
        tmp[y * w + x] = s / ks;
      }
    const out = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let j = -r; j <= r; j++) s += tmp[Math.max(0, Math.min(h - 1, y + j)) * w + x] * k[j + r];
        out[y * w + x] = s / ks;
      }
    img = out;
  }
  const rnd = rng32(o.seed ?? 1);
  const sd = o.noise ?? 0;
  const data = new Uint8Array(w * h);
  for (let i = 0; i < img.length; i++) {
    // Box-Muller
    const u = Math.max(1e-12, rnd());
    const v = rnd();
    const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    data[i] = Math.max(0, Math.min(255, Math.round(img[i] + g * sd)));
  }
  return { w, h, data };
}
