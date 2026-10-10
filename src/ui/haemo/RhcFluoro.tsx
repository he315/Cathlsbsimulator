// Fluoroscopy and ECG for the torque-directed right heart catheter (haemo-rhc-manoeuvre).
//
// The image reuses the pacing lab's schematic (src/ui/bedside/PacingFluoro.tsx: FluoroImage and
// leadPolyline) with the catheter drawn as its lead, until xray-device-fluoro-views can replace it.
// The zones this package adds (a renal vein side branch and the wedge beyond the PA) and what the
// operator sees on screening that the pacing image has no way to draw (a balloon up, a loop that has
// knotted) are drawn on a transparent layer with the same 240 x 240 frame. Nothing is labelled: the
// learner reads the course of the catheter from the picture, as on a real screen.
//
// The ECG strip draws the monitor's rhythm from the catheter's rhythm log with a local morph per
// rhythm (narrow sinus beats, wide premature beats during ectopy, a wide-complex tachycardia, and
// irregular narrow beats without P waves over a fibrillating baseline) until pacing-overdrive-and-tcp
// adds VT to the shared rhythm engine. Shapes are illustrative (MODEL PARAMETERS), not measurements.
import { useRef } from "react";
import { FluoroImage, leadPolyline, type FluoroView } from "../bedside/PacingFluoro";
import { ZONE_LEN, type LeadState } from "../../simulation/pacing";
import { RHC_ZONE_LEN, rhythmAt, type RhcRhythmKind, type RhcState } from "../../simulation/rightHeartCatheter";

type Pt = readonly [number, number];

/** The extra zones' courses in each view, from the end of the lead zone they leave (model drawing coordinates). */
const EXTRA_PATH: Record<FluoroView, Record<"renal" | "wedge", Pt[]>> = {
  ap: {
    renal: [[112, 192], [124, 200], [140, 206]],
    wedge: [[184, 90], [194, 98], [200, 110]],
  },
  lat: {
    renal: [[144, 192], [156, 198], [170, 202]],
    wedge: [[140, 88], [150, 96], [156, 108]],
  },
};

/** The lead the pacing image draws for this catheter (the extra zones draw from the end of the zone they leave). */
export function drawnLead(st: RhcState): LeadState | null {
  if (!st.inserted) return null;
  if (st.extra) return { ...st.lead, pos: ZONE_LEN[st.lead.zone] };
  return st.lead;
}

function partial(pts: readonly Pt[], f: number): Pt[] {
  if (pts.length < 2) return [...pts];
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let want = Math.max(0, Math.min(1, f)) * total;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = segs[i - 1];
    if (want >= d) {
      out.push(pts[i]);
      want -= d;
    } else {
      const r = d > 0 ? want / d : 0;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
      break;
    }
  }
  return out;
}

const pathOf = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

/** The catheter tip on the image (where the overlay draws the balloon or the knot). */
export function tipPoint(st: RhcState, view: FluoroView): Pt | null {
  const lead = drawnLead(st);
  if (!lead) return null;
  if (st.extra) {
    const pts = partial(EXTRA_PATH[view][st.extra], Math.max(0.15, st.extraPos / RHC_ZONE_LEN[st.extra]));
    return pts[pts.length - 1];
  }
  const pts = leadPolyline(lead, view);
  return pts.length ? pts[pts.length - 1] : null;
}

function Overlay({ st, view, live }: { st: RhcState; view: FluoroView; live: boolean }) {
  if (!st.inserted) return null;
  const extra = st.extra ? partial(EXTRA_PATH[view][st.extra], Math.max(0.15, st.extraPos / RHC_ZONE_LEN[st.extra])) : null;
  const tip = tipPoint(st, view);
  const knot = st.knot && !st.knot.resolved;
  const tight = knot && st.knot!.tightAt !== null;
  return (
    <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {/* dimmed on the held image, as FluoroImage dims the lead */}
      <g opacity={live ? 1 : 0.75}>
      {extra && (
        <g>
          <path d={pathOf(extra)} stroke="#1a1d21" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathOf(extra)} stroke="#3a3f45" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {tip && st.balloon && <circle cx={tip[0]} cy={tip[1]} r={3.6} fill="#d9dde2" stroke="#2b3036" strokeWidth={0.8} opacity={0.8} />}
      {tip && knot && (
        <g stroke="#15181b" fill="none" strokeLinecap="round">
          {/* a loop of the shaft crossing itself near the tip */}
          <ellipse cx={tip[0] - 6} cy={tip[1] - 6} rx={tight ? 2.5 : 7} ry={tight ? 2 : 5} strokeWidth={2.6} transform={`rotate(-25 ${tip[0] - 6} ${tip[1] - 6})`} />
          <path d={`M ${tip[0] - 14} ${tip[1] - 2} Q ${tip[0] - 6} ${tip[1] - 14} ${tip[0]} ${tip[1]}`} strokeWidth={2.2} />
        </g>
      )}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ECG strip
// ---------------------------------------------------------------------------

type Wave = readonly [amp: number, centre: number, width: number];
const gauss = (ws: readonly Wave[], u: number) => ws.reduce((s, [a, c, w]) => s + a * Math.exp(-(((u - c) / w) ** 2)), 0);
/** Local morphs, time after the beat in seconds (MODEL PARAMETERS: illustrative shapes). */
const NARROW: Wave[] = [[0.15, -0.16, 0.025], [-0.1, -0.015, 0.008], [1, 0, 0.012], [-0.25, 0.02, 0.01], [0.3, 0.26, 0.05]];
const NARROW_NO_P: Wave[] = NARROW.slice(1);
const WIDE: Wave[] = [[1.1, 0.02, 0.04], [-0.5, 0.09, 0.04], [-0.35, 0.3, 0.07]];
const VT: Wave[] = [[1, 0, 0.05], [-0.8, 0.11, 0.05]];

/** A fixed pseudo-random value in [0, 1) for a beat index. */
const hash = (i: number) => {
  let h = (i * 2654435761) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177) >>> 0;
  return (h >>> 0) / 4294967296;
};

interface Beat {
  t: number;
  kind: RhcRhythmKind;
  wide: boolean;
}

/** Share of beats that are premature wide beats during ectopy. MODEL PARAMETER (illustrative). */
export const ECG_ECTOPIC_SHARE = 0.35;
/** Spread of the RR interval in AF, as multiples of the mean RR. MODEL PARAMETER (illustrative). */
export const ECG_AF_RR_SPREAD: readonly [number, number] = [0.6, 1.4];
/** Most beats generated per rhythm segment (an irregular rhythm is built beat by beat from its start). */
const MAX_SEGMENT_BEATS = 20000;

/**
 * The beats on the monitor from t0 to t1 (from the catheter's rhythm log). Every rhythm segment of the
 * log builds its own beat train from the time it began, so a beat has the same time (and the same
 * premature or irregular choice) in every window that shows it, and the strip does not jump as it scrolls.
 */
export function beats(st: RhcState, t0: number, t1: number, sinusRate: number): Beat[] {
  const out: Beat[] = [];
  const from = t0 - 2;
  const log = st.rhythm.length ? st.rhythm : [{ t: 0, kind: "sinus" as const, rate: 0 }];
  for (let s = 0; s < log.length; s++) {
    const seg = log[s];
    const end = s + 1 < log.length ? log[s + 1].t : Infinity;
    if (end <= from || seg.t >= t1) continue;
    const rate = seg.kind === "sinus" || seg.kind === "ectopy" ? sinusRate : Math.max(30, seg.rate || sinusRate);
    const rr = 60 / Math.max(30, rate);
    const stop = Math.min(end, t1);
    if (seg.kind === "sinus" || seg.kind === "vt" || (s === 0 && from < seg.t)) {
      // a regular train on the segment's own grid (and before the first entry of the log, the first rate)
      const regular = seg.kind === "sinus" || seg.kind === "vt";
      const k0 = Math.floor((from - seg.t) / rr);
      for (let k = k0; ; k++) {
        const t = seg.t + k * rr;
        if (t >= (regular ? stop : Math.min(seg.t, stop))) break;
        if (t >= from) out.push({ t, kind: regular ? seg.kind : "sinus", wide: seg.kind === "vt" });
      }
      if (regular) continue;
    }
    // AF and ectopy: beat by beat from the segment's start, the choices fixed by the beat's index
    const salt = Math.round(seg.t * 1000);
    let t = seg.t;
    for (let i = 0; t < stop && i < MAX_SEGMENT_BEATS; i++) {
      const h = hash(salt + i);
      if (seg.kind === "af") {
        if (t >= from) out.push({ t, kind: "af", wide: false });
        t += rr * (ECG_AF_RR_SPREAD[0] + (ECG_AF_RR_SPREAD[1] - ECG_AF_RR_SPREAD[0]) * h);
      } else if (h < ECG_ECTOPIC_SHARE) {
        // a premature wide beat, then a pause
        const b = t - rr * 0.3;
        if (b >= from) out.push({ t: b, kind: "ectopy", wide: true });
        t += rr * 1.3;
      } else {
        if (t >= from) out.push({ t, kind: "ectopy", wide: false });
        t += rr;
      }
    }
  }
  return out;
}

/** The ECG at time t from the beats around it, mV-like units. */
export function ecgSample(bs: readonly Beat[], t: number, st: RhcState): number {
  let y = 0;
  for (const b of bs) {
    const u = t - b.t;
    if (u < -0.3 || u > 0.6) continue;
    y += b.kind === "vt" ? gauss(VT, u) : b.wide ? gauss(WIDE, u) : b.kind === "af" ? gauss(NARROW_NO_P, u) : gauss(NARROW, u);
  }
  if (rhythmAt(st, t).kind === "af") y += 0.05 * Math.sin(t * 2 * Math.PI * 6.3) + 0.04 * Math.sin(t * 2 * Math.PI * 8.7 + 1);
  return y;
}

export function EcgStrip({ st, now, sinusRate, seconds = 6 }: { st: RhcState; now: number; sinusRate: number; seconds?: number }) {
  const W = 300;
  const H = 54;
  const t0 = now - seconds;
  const bs = beats(st, t0, now, sinusRate);
  const n = 300;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (i / n) * seconds;
    const y = H * 0.62 - ecgSample(bs, t, st) * H * 0.4;
    pts.push(`${i ? "L" : "M"} ${((i / n) * W).toFixed(1)} ${y.toFixed(1)}`);
  }
  const r = rhythmAt(st, now);
  const hr = r.kind === "sinus" || r.kind === "ectopy" ? sinusRate : r.rate;
  return (
    <div className="monitor rounded-md border border-line px-2 py-1">
      <div className="flex items-center justify-between text-[12px] font-mono text-ink-faint">
        <span>ECG II</span>
        <span className="text-ecg">HR {Math.round(hr)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[54px] block" preserveAspectRatio="none" aria-label="ECG rhythm strip">
        <path d={pts.join(" ")} stroke="currentColor" className="text-ecg" strokeWidth={1.2} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The panel's image
// ---------------------------------------------------------------------------

export interface RhcFluoroProps {
  st: RhcState;
  /** lab time now, s (for the ECG strip) */
  now: number;
  sinusRate: number;
  /** screening on (otherwise the last image is held) */
  live: boolean;
}

/**
 * Last-image hold: the frame to draw, given the frame held so far. While screening, the image follows the
 * catheter; without screening the lead and the overlay stay as they were when screening stopped. With the
 * catheter out there is nothing to hold.
 */
export function heldFrame(held: RhcState, st: RhcState, live: boolean): RhcState {
  return live || !st.inserted ? st : held;
}

export default function RhcFluoro({ st, now, sinusRate, live }: RhcFluoroProps) {
  const held = useRef(st);
  held.current = heldFrame(held.current, st, live);
  const shown = held.current;
  const lead = drawnLead(shown);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(["ap", "lat"] as const).map((view) => (
          <div key={view} className="relative">
            <FluoroImage view={view} lead={lead} live={live} label={view === "ap" ? "AP" : "LAT"} />
            <Overlay st={shown} view={view} live={live} />
          </div>
        ))}
      </div>
      <EcgStrip st={st} now={now} sinusRate={sinusRate} />
    </div>
  );
}
