import { create } from "zustand";
import type { CArm } from "../types";
import type { RunQuality } from "../simulation/imaging/runQuality";

// ---------------------------------------------------------------------------
// Stored runs for the reference monitor: every cine run (the cine pedal
// interval) and every "store fluoro" (the last seconds of fluoroscopy). Frames
// are the acquired images, grey 8-bit at STORE_PX square, as the live monitor
// showed them; the reference monitor replays them at their acquisition rate and
// the trainee's QCA measures them. Nothing here is ground truth: a run holds
// only what the beam recorded, its geometry and its dose and contrast.
// ---------------------------------------------------------------------------

/** Stored frame matrix (px, square). Model choice (facts C2, model parameters). */
export const STORE_PX = 512;
/** Memory budget for stored frames (bytes): about 760 frames of 512 x 512. Model parameter (facts C2). */
export const SERIES_BUDGET_BYTES = 200 * 1024 * 1024;

export interface StoredSeries {
  id: string;
  /** run number in this case, 1-based, in acquisition order (cine and stored fluoro share the count) */
  number: number;
  kind: "cine" | "fluoro";
  caseId: string;
  /** wall seconds since the case started, at the first frame */
  startedAt: number;
  /** acquisition rate (frames/s) */
  fps: number;
  w: number;
  h: number;
  frames: Uint8Array[];
  /** C-arm at the first and last frame */
  cArm: CArm;
  cArmEnd: CArm;
  /** detector field (cm) */
  fieldCm: number;
  /** mm per stored pixel at the isocentre (for the record; the trainee's QCA calibrates on the catheter) */
  mmPerPxIso: number;
  durationS: number;
  /** dose booked during the run */
  karMGy: number;
  kapGyCm2: number;
  /** contrast pushed while the run was recording (mL) */
  contrastMl: number;
  /** an injection happened during the run */
  injected: boolean;
  /** the catheter in use */
  catheterId: string;
  /** frames dropped to stay inside the memory budget (oldest runs first) */
  released?: boolean;
  /**
   * How the run was acquired and whether it can be read (diag-injection-run-quality, src/simulation/imaging/
   * runQuality.ts): set by the lab when the run ends. The lab screens show its judgements only as a guided
   * teaching aid; the acquisition facts (frame rate, table, breath-hold) are what the operator did.
   */
  quality?: RunQuality;
  /** the learner declared the run non-diagnostic (the run browser); the study report starts from these declarations */
  declaredNonDiagnostic?: boolean;
}

/**
 * The 'previous study' group (diag-acs-scenarios): runs of an earlier angiogram of the same patient,
 * rendered from the case's own coronary tree with the lesions the patient had then (a culprit
 * study's old film). They are kept apart from `series`, so they never take a run number of this case,
 * never appear among the study report's runs and are never measured as today's; the reference
 * monitor's previous-study view and the report show them under their label. `caseId` is the case they
 * belong to: a reader shows them only for that case.
 */
export interface PreviousStudy {
  caseId: string;
  /** how the monitor and the report name it, e.g. 'Previous study, four years ago' */
  label: string;
  status: "rendering" | "ready" | "failed";
  /** the runs, in filming order (number counts within the previous study) */
  series: StoredSeries[];
  /** why it could not be rendered (status 'failed') */
  error?: string;
}

export interface SeriesStore {
  series: StoredSeries[];
  /** the previous-study group of the current case, if it has one (see PreviousStudy) */
  previousStudy: PreviousStudy | null;
  selectedId: string | null;
  /** frame shown on the reference monitor */
  frame: number;
  playing: boolean;
  /** reference frame chosen per series (for QCA and side-by-side) */
  refFrame: Record<string, number>;
  bytes: number;
  add: (s: StoredSeries) => void;
  select: (id: string | null) => void;
  setFrame: (i: number) => void;
  step: (d: number) => void;
  setPlaying: (on: boolean) => void;
  markReference: (id: string, frame: number) => void;
  /** a new case: forget every stored run (the previous-study group is keyed by its case and kept) */
  clear: () => void;
  /** replace the previous-study group (null removes it) */
  setPreviousStudy: (p: PreviousStudy | null) => void;
  /** next run number */
  nextNumber: () => number;
  /** attach a run's quality (diag-injection-run-quality) */
  setQuality: (id: string, q: RunQuality) => void;
  /** the learner declares a run non-diagnostic, or withdraws the declaration */
  declareNonDiagnostic: (id: string, on: boolean) => void;
}

const bytesOf = (s: StoredSeries) => s.frames.reduce((a, f) => a + f.byteLength, 0);

export const useSeriesStore = create<SeriesStore>((set, get) => ({
  series: [],
  previousStudy: null,
  selectedId: null,
  frame: 0,
  playing: true,
  refFrame: {},
  bytes: 0,

  add: (s) =>
    set((st) => {
      let series = [...st.series, s];
      let bytes = st.bytes + bytesOf(s);
      // over budget: release the frames of the oldest runs (metadata stays in the browser)
      for (let i = 0; i < series.length - 1 && bytes > SERIES_BUDGET_BYTES; i++) {
        const o = series[i];
        if (o.released || !o.frames.length) continue;
        bytes -= bytesOf(o);
        series = series.map((x) => (x.id === o.id ? { ...x, frames: [], released: true } : x));
      }
      // the newest run goes up on the reference monitor, looping from its first frame
      return { series, bytes, selectedId: s.id, frame: 0, playing: true };
    }),

  select: (id) => set((st) => ({ selectedId: id, frame: id && st.refFrame[id] !== undefined ? st.refFrame[id] : 0, playing: id ? st.playing : false })),

  setFrame: (i) =>
    set((st) => {
      const s = st.series.find((x) => x.id === st.selectedId);
      const n = s?.frames.length ?? 0;
      if (!n) return { frame: 0 };
      return { frame: ((Math.round(i) % n) + n) % n };
    }),

  step: (d) => {
    const st = get();
    st.setFrame(st.frame + d);
    set({ playing: false });
  },

  setPlaying: (on) => set(() => ({ playing: on })),

  markReference: (id, frame) => set((st) => ({ refFrame: { ...st.refFrame, [id]: frame } })),

  clear: () => set(() => ({ series: [], selectedId: null, frame: 0, playing: true, refFrame: {}, bytes: 0 })),

  nextNumber: () => get().series.length + 1,

  setPreviousStudy: (p) => set(() => ({ previousStudy: p })),

  setQuality: (id, q) => set((st) => (st.series.some((x) => x.id === id) ? { series: st.series.map((x) => (x.id === id ? { ...x, quality: q } : x)) } : {})),

  declareNonDiagnostic: (id, on) =>
    set((st) => (st.series.some((x) => x.id === id && !!x.declaredNonDiagnostic !== on) ? { series: st.series.map((x) => (x.id === id ? { ...x, declaredNonDiagnostic: on } : x)) } : {})),
}));

/**
 * The run numbers of a case's stored cine runs the learner declared non-diagnostic in the run browser
 * (diag-injection-run-quality), in order: what the study report's non-diagnostic runs start from.
 */
export function declaredNonDiagnosticRuns(st: Pick<SeriesStore, "series">, caseId: string): number[] {
  return st.series.filter((x) => x.caseId === caseId && x.kind === "cine" && x.declaredNonDiagnostic).map((x) => x.number).sort((a, b) => a - b);
}

/** The previous-study group if it belongs to this case (null otherwise). */
export function previousStudyFor(st: Pick<SeriesStore, "previousStudy">, caseId: string): PreviousStudy | null {
  return st.previousStudy && st.previousStudy.caseId === caseId ? st.previousStudy : null;
}

// ---------------------------------------------------------------------------
// Recording (no React): a run in progress, and the fluoroscopy loop buffer.
// ---------------------------------------------------------------------------

export interface RunStart {
  id: string;
  number: number;
  kind: "cine" | "fluoro";
  caseId: string;
  startedAt: number;
  fps: number;
  cArm: CArm;
  fieldCm: number;
  mmPerPxIso: number;
  catheterId: string;
  karMGy0: number;
  kapGyCm20: number;
  contrastMl0: number;
}

/** A cine run being recorded: frames in, a StoredSeries out. */
export class RunRecorder {
  readonly frames: Uint8Array[] = [];
  injected = false;
  constructor(readonly start: RunStart, readonly w = STORE_PX, readonly h = STORE_PX) {}

  push(frame: Uint8Array) {
    this.frames.push(frame);
  }

  finish(end: { cArm: CArm; karMGy: number; kapGyCm2: number; contrastMl: number }): StoredSeries | null {
    if (!this.frames.length) return null;
    const s = this.start;
    return {
      id: s.id,
      number: s.number,
      kind: s.kind,
      caseId: s.caseId,
      startedAt: s.startedAt,
      fps: s.fps,
      w: this.w,
      h: this.h,
      frames: this.frames,
      cArm: s.cArm,
      cArmEnd: end.cArm,
      fieldCm: s.fieldCm,
      mmPerPxIso: s.mmPerPxIso,
      durationS: this.frames.length / s.fps,
      karMGy: Math.max(0, end.karMGy - s.karMGy0),
      kapGyCm2: Math.max(0, end.kapGyCm2 - s.kapGyCm20),
      contrastMl: Math.max(0, end.contrastMl - s.contrastMl0),
      injected: this.injected || end.contrastMl - s.contrastMl0 > 0.05,
      catheterId: s.catheterId,
    };
  }
}

/** Ring buffer of the last `seconds` of fluoroscopy frames (for "store fluoro"). */
export class FluoroLoop {
  private buf: { frame: Uint8Array; t: number; cArm: CArm }[] = [];
  constructor(public seconds = FLUORO_LOOP_S) {}

  push(frame: Uint8Array, tWall: number, cArm: CArm) {
    this.buf.push({ frame, t: tWall, cArm });
    const cut = tWall - this.seconds;
    while (this.buf.length && this.buf[0].t < cut) this.buf.shift();
  }

  /** Frames of the most recent contiguous fluoroscopy (gaps longer than `gapS` end a sequence). */
  last(gapS = 1): { frames: Uint8Array[]; t0: number; t1: number; cArm: CArm; cArmEnd: CArm } | null {
    if (!this.buf.length) return null;
    let i = this.buf.length - 1;
    while (i > 0 && this.buf[i].t - this.buf[i - 1].t <= gapS) i--;
    const seq = this.buf.slice(i);
    return { frames: seq.map((x) => x.frame), t0: seq[0].t, t1: seq[seq.length - 1].t, cArm: seq[0].cArm, cArmEnd: seq[seq.length - 1].cArm };
  }

  get length() {
    return this.buf.length;
  }

  clear() {
    this.buf = [];
  }
}

/** Seconds of fluoroscopy kept for "store fluoro". Model parameter (facts C2). */
export const FLUORO_LOOP_S = 10;
