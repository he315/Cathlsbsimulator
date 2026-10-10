// ===========================================================================
// Expert labels on the real-angiogram library and the label-gated reading drills
// (angio-expert-label-drills).
//
// A named supervising reader (an angiographer the owner chooses) labels library runs in Reader mode
// (Settings, then the Library tab of Real angiograms): TIMI flow and frame count, thrombus grade, calcium,
// NHLBI dissection type, Medina digits with the side-branch size, Rentrop and Werner collateral grades
// with the channel, SYNTAX segment points, and the ACC/AHA lesion features. Reader-mode labels stay in
// this browser and are exported as JSON (never uploaded); the owner places the file as labels.json beside
// the dataset's index.json in the library and declares it there ("labels": "labels.json"), and loadLabels
// merges it into the runs. Folders whose index.json declares no label file are not asked for one.
//
// Rules the drills follow:
//  - only labels served with the library (labels.json) are used for scored drills: labels made or imported
//    in this browser are refused for scoring, so a learner cannot score against their own labels;
//  - held-out exam patients never enter a labelled practice set (labelledRuns leaves them out, and the
//    section passes practice runs only);
//  - a drill is shown only when at least LABEL_GATE_MIN runs carry a usable label for it; until then it
//    says 'not yet labelled' (and 'timi' and 'frame-count' open the simulated-run drill, simFlowDrill.ts);
//  - where two readers labelled the same run and disagree on the drill's field, the run is left out
//    (frame counts agree when they lie within the readers' tolerance; the reference is their median);
//  - every set shows how many readers labelled it and where the labels came from.
// ===========================================================================

import { create } from "zustand";
import { REF_BY_ID } from "../../content/refs";
import type { Reference } from "../../content/schema";
import { TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipVessel } from "../../content/lab/tips";
import { heldOutPatient } from "../../content/mentor/catalogue";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import { loadLabelSources, stratifiedSample, type DatasetName, type LibDataset, type LibRun } from "./library";

// ---------------------------------------------------------------------------
// Label types
// ---------------------------------------------------------------------------

export type TimiValue = 0 | 1 | 2 | 3;
/** TIMI thrombus grade 0-5 (pci-interp-thrombus-grade: 1 possible ... 5 total occlusion; 0 none) */
export type ThrombusGrade = 0 | 1 | 2 | 3 | 4 | 5;
/** Brilakis's calcium grades (pci-interp-calcium-look-first), or none */
export type CalciumGrade = "none" | "moderate" | "severe";
/** NHLBI dissection type (pci-interp-dissection-nhlbi), or none */
export type NhlbiType = "none" | "A" | "B" | "C" | "D" | "E" | "F";
export type RentropGrade = 0 | 1 | 2 | 3;
/** Werner collateral connection grade CC0-CC2 */
export type WernerGrade = 0 | 1 | 2;
export type FrameVessel = "LAD" | "LCx" | "RCA";
/** A collateral donor or recipient (the collateral drill's options). */
export type Artery = "LAD" | "LCx" | "RCA";

export interface FrameCountLabel {
  vessel: FrameVessel;
  /** frames counted at the run's own rate */
  frames: number;
  /** first frame (1-based) with contrast across the origin, and the frame it reaches the landmark */
  fromFrame?: number;
  toFrame?: number;
  /** the distal landmark the reader counted to, in words */
  landmark?: string;
  /** frames either side within which the reader accepts a learner's count (default FRAME_TOLERANCE_DEFAULT) */
  tolerance?: number;
}

export interface MedinaLabel {
  /** 1 for a stenosis of 50% or more (cp-bifurcation-provisional-assess) */
  pmv: 0 | 1;
  dmv: 0 | 1;
  sb: 0 | 1;
  /** side-branch reference diameter (mm), the reader's estimate */
  sideBranchMm?: number;
}

export interface SegmentPoint {
  /** 1-based frame */
  frame: number;
  /** source-image pixels */
  x: number;
  y: number;
  /** SYNTAX segment ("1" ... "16c") */
  segment: string;
}

/** The ACC/AHA lesion features (Oxford Table 8.2 as pm-planning-classification arranges it). */
export interface AccAhaFeatures {
  /** under 10, 10-20 or over 20 mm */
  length: "<10" | "10-20" | ">20";
  eccentric: boolean;
  access: "ready" | "moderate" | "excessive";
  angulation: "none" | "moderate" | "extreme";
  irregular: boolean;
  calcium: "light" | "moderate-heavy";
  branch: "none" | "protected" | "unprotected";
  ostial: boolean;
  occlusion: "none" | "under-3-months" | "over-3-months";
  thrombus: "none" | "some" | "heavy";
  degeneratedSvg: boolean;
}

/** One reader's labels on one run. */
export interface ExpertLabel {
  /** library run id */
  run: string;
  reader: string;
  /** ISO date of labelling */
  date: string;
  timi?: TimiValue;
  /** the bed the flow was compared with */
  comparisonBed?: "proximal" | "opposite";
  frameCount?: FrameCountLabel;
  thrombusGrade?: ThrombusGrade;
  calcium?: CalciumGrade;
  nhlbi?: NhlbiType;
  medina?: MedinaLabel;
  rentrop?: RentropGrade;
  wernerCC?: WernerGrade;
  channel?: "septal" | "epicardial";
  donor?: Artery;
  recipient?: Artery;
  dominance?: "right" | "left";
  segmentPoints?: SegmentPoint[];
  accAha?: AccAhaFeatures;
  note?: string;
}

/** Where a label came from: the library's labels.json (usable for scoring) or this browser (never scored). */
export type LabelSource = "library" | "local";

export interface MergedLabel extends ExpertLabel {
  source: LabelSource;
  /** the file it was read from (library) or "this browser" */
  file: string;
}

/** The labels.json format (also what Reader mode exports). */
export interface LabelFile {
  schema: typeof LABEL_SCHEMA;
  /** the reader who made the labels (a label may name its own reader) */
  reader?: { name: string; qualification?: string };
  exported?: string;
  labels: (Omit<ExpertLabel, "reader"> & { reader?: string })[];
}
export const LABEL_SCHEMA = "cathmaster-angio-labels/1" as const;

/** SYNTAX segments (Brilakis Fig 7.2 as pm-acquiring-anatomy tabulates them) with the dominance they exist in. */
export const SYNTAX_SEGMENTS: readonly { id: string; name: string; dominance: "both" | "right" | "left" }[] = [
  { id: "1", name: "proximal RCA", dominance: "both" },
  { id: "2", name: "mid RCA", dominance: "both" },
  { id: "3", name: "distal RCA", dominance: "both" },
  { id: "4", name: "PDA from the RCA", dominance: "right" },
  { id: "16", name: "right posterolateral", dominance: "right" },
  { id: "16a", name: "right posterolateral a", dominance: "right" },
  { id: "16b", name: "right posterolateral b", dominance: "right" },
  { id: "16c", name: "right posterolateral c", dominance: "right" },
  { id: "5", name: "left main", dominance: "both" },
  { id: "6", name: "proximal LAD", dominance: "both" },
  { id: "7", name: "mid LAD", dominance: "both" },
  { id: "8", name: "apical LAD", dominance: "both" },
  { id: "9", name: "first diagonal", dominance: "both" },
  { id: "9a", name: "first diagonal a", dominance: "both" },
  { id: "10", name: "second diagonal", dominance: "both" },
  { id: "10a", name: "second diagonal a", dominance: "both" },
  { id: "11", name: "proximal circumflex", dominance: "both" },
  { id: "12", name: "intermediate", dominance: "both" },
  { id: "12a", name: "obtuse marginal a", dominance: "both" },
  { id: "12b", name: "obtuse marginal b", dominance: "both" },
  { id: "13", name: "distal circumflex", dominance: "both" },
  { id: "14", name: "left posterolateral", dominance: "both" },
  { id: "14a", name: "left posterolateral a", dominance: "both" },
  { id: "14b", name: "left posterolateral b", dominance: "both" },
  { id: "15", name: "PDA from the circumflex", dominance: "left" },
];
export const SYNTAX_SEGMENT_IDS: readonly string[] = SYNTAX_SEGMENTS.map((s) => s.id);
export const segmentsFor = (dominance: "right" | "left") => SYNTAX_SEGMENTS.filter((s) => s.dominance === "both" || s.dominance === dominance);

// ---------------------------------------------------------------------------
// Parsing and merging
// ---------------------------------------------------------------------------

const isInt = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
const isOneOf = <T extends string>(v: unknown, xs: readonly T[]): v is T => typeof v === "string" && (xs as readonly string[]).includes(v);
export const ARTERIES: readonly Artery[] = ["LAD", "LCx", "RCA"];
const FRAME_VESSELS: readonly FrameVessel[] = ["LAD", "LCx", "RCA"];

/** Check one label; returns the problems (empty = valid). Unknown keys are refused so a typo never passes silently. */
export function labelProblems(l: unknown): string[] {
  const p: string[] = [];
  if (!l || typeof l !== "object") return ["not an object"];
  const x = l as Record<string, unknown>;
  const known = new Set([
    "run", "reader", "date", "timi", "comparisonBed", "frameCount", "thrombusGrade", "calcium", "nhlbi", "medina", "rentrop", "wernerCC", "channel", "donor", "recipient",
    "dominance", "segmentPoints", "accAha", "note",
  ]);
  for (const k of Object.keys(x)) if (!known.has(k)) p.push(`unknown field "${k}"`);
  if (typeof x.run !== "string" || !x.run) p.push("no run id");
  if (x.reader !== undefined && (typeof x.reader !== "string" || !x.reader.trim())) p.push("reader must be a name");
  if (x.date !== undefined && (typeof x.date !== "string" || Number.isNaN(Date.parse(x.date)))) p.push("date is not a date");
  if (x.timi !== undefined && !isInt(x.timi, 0, 3)) p.push("timi must be 0-3");
  if (x.comparisonBed !== undefined && !isOneOf(x.comparisonBed, ["proximal", "opposite"] as const)) p.push("comparisonBed must be proximal or opposite");
  if (x.frameCount !== undefined) {
    const f = x.frameCount as Record<string, unknown>;
    if (!f || typeof f !== "object" || !isOneOf(f.vessel, FRAME_VESSELS) || !isInt(f.frames, 0, 1000)) p.push("frameCount needs a vessel (LAD, LCx, RCA) and a whole number of frames");
    else if (f.tolerance !== undefined && !isInt(f.tolerance, 0, 50)) p.push("frameCount.tolerance must be a whole number of frames");
  }
  if (x.thrombusGrade !== undefined && !isInt(x.thrombusGrade, 0, 5)) p.push("thrombusGrade must be 0-5");
  if (x.calcium !== undefined && !isOneOf(x.calcium, ["none", "moderate", "severe"] as const)) p.push("calcium must be none, moderate or severe");
  if (x.nhlbi !== undefined && !isOneOf(x.nhlbi, ["none", "A", "B", "C", "D", "E", "F"] as const)) p.push("nhlbi must be none or A-F");
  if (x.medina !== undefined) {
    const m = x.medina as Record<string, unknown>;
    if (!m || ![m.pmv, m.dmv, m.sb].every((d) => d === 0 || d === 1)) p.push("medina needs pmv, dmv and sb as 0 or 1");
    else if (m.sideBranchMm !== undefined && !(typeof m.sideBranchMm === "number" && m.sideBranchMm > 0 && m.sideBranchMm < 10)) p.push("medina.sideBranchMm must be a diameter in mm");
  }
  if (x.rentrop !== undefined && !isInt(x.rentrop, 0, 3)) p.push("rentrop must be 0-3");
  if (x.wernerCC !== undefined && !isInt(x.wernerCC, 0, 2)) p.push("wernerCC must be 0-2");
  if (x.channel !== undefined && !isOneOf(x.channel, ["septal", "epicardial"] as const)) p.push("channel must be septal or epicardial");
  if (x.donor !== undefined && !isOneOf(x.donor, ARTERIES)) p.push("donor must be LAD, LCx or RCA");
  if (x.recipient !== undefined && !isOneOf(x.recipient, ARTERIES)) p.push("recipient must be LAD, LCx or RCA");
  if (x.dominance !== undefined && !isOneOf(x.dominance, ["right", "left"] as const)) p.push("dominance must be right or left");
  if (x.segmentPoints !== undefined) {
    const sp = x.segmentPoints;
    if (!Array.isArray(sp) || !sp.every((s) => s && isInt(s.frame, 1, 10000) && typeof s.x === "number" && typeof s.y === "number" && SYNTAX_SEGMENT_IDS.includes(s.segment)))
      p.push("segmentPoints need frame, x, y and a SYNTAX segment");
    else if (!isOneOf(x.dominance, ["right", "left"] as const)) p.push("segmentPoints need the study's dominance");
    else {
      const ok = new Set(segmentsFor(x.dominance).map((s) => s.id));
      const bad = [...new Set((sp as SegmentPoint[]).filter((s) => !ok.has(s.segment)).map((s) => s.segment))];
      if (bad.length) p.push(`segment ${bad.join(", ")} does not exist in ${x.dominance} dominance`);
    }
  }
  if (x.accAha !== undefined && accAhaProblems(x.accAha).length) p.push(...accAhaProblems(x.accAha).map((s) => `accAha: ${s}`));
  if (x.note !== undefined && typeof x.note !== "string") p.push("note must be text");
  return p;
}

function accAhaProblems(a: unknown): string[] {
  if (!a || typeof a !== "object") return ["not an object"];
  const f = a as Record<string, unknown>;
  const p: string[] = [];
  if (!isOneOf(f.length, ["<10", "10-20", ">20"] as const)) p.push("length");
  if (typeof f.eccentric !== "boolean") p.push("eccentric");
  if (!isOneOf(f.access, ["ready", "moderate", "excessive"] as const)) p.push("access");
  if (!isOneOf(f.angulation, ["none", "moderate", "extreme"] as const)) p.push("angulation");
  if (typeof f.irregular !== "boolean") p.push("irregular");
  if (!isOneOf(f.calcium, ["light", "moderate-heavy"] as const)) p.push("calcium");
  if (!isOneOf(f.branch, ["none", "protected", "unprotected"] as const)) p.push("branch");
  if (typeof f.ostial !== "boolean") p.push("ostial");
  if (!isOneOf(f.occlusion, ["none", "under-3-months", "over-3-months"] as const)) p.push("occlusion");
  if (!isOneOf(f.thrombus, ["none", "some", "heavy"] as const)) p.push("thrombus");
  if (typeof f.degeneratedSvg !== "boolean") p.push("degeneratedSvg");
  return p;
}

/** Parse a labels.json (or a Reader-mode export). Invalid labels are left out and reported. */
export function parseLabelFile(json: unknown, where = "labels.json"): { labels: ExpertLabel[]; problems: string[] } {
  const problems: string[] = [];
  const f = json as Partial<LabelFile> | null;
  if (!f || typeof f !== "object" || f.schema !== LABEL_SCHEMA || !Array.isArray(f.labels)) return { labels: [], problems: [`${where}: not a ${LABEL_SCHEMA} file`] };
  const fileReader = typeof f.reader?.name === "string" && f.reader.name.trim() ? f.reader.name.trim() : undefined;
  const labels: ExpertLabel[] = [];
  f.labels.forEach((raw, i) => {
    const ps = labelProblems(raw);
    const reader = (raw as { reader?: string })?.reader ?? fileReader;
    if (!reader) ps.push("no reader named (in the label or the file)");
    if (ps.length) return void problems.push(`${where} label ${i}: ${ps.join("; ")}`);
    labels.push({ ...(raw as ExpertLabel), reader: reader!, date: (raw as ExpertLabel).date ?? f.exported ?? "" });
  });
  return { labels, problems };
}

/**
 * Merge labels into the library: each run gains `expert`, one entry per reader (a later label of the same reader on
 * the same run replaces the earlier one). Pure; returns new datasets and the labels whose run is not in them.
 */
export function mergeLabels(data: LibDataset[], parts: { dataset?: DatasetName; labels: ExpertLabel[]; source: LabelSource; file: string }[]): { data: LibDataset[]; unmatched: string[] } {
  const byRun = new Map<string, MergedLabel[]>();
  const runIds = new Map<string, DatasetName>();
  for (const d of data) for (const p of d.patients) for (const r of p.runs) runIds.set(r.id, d.dataset);
  const unmatched: string[] = [];
  for (const part of parts)
    for (const l of part.labels) {
      const ds = runIds.get(l.run);
      if (!ds || (part.dataset && ds !== part.dataset)) {
        unmatched.push(`${part.file}: run ${l.run}`);
        continue;
      }
      const list = byRun.get(l.run) ?? [];
      const at = list.findIndex((x) => x.reader === l.reader && x.source === part.source);
      const m: MergedLabel = { ...l, source: part.source, file: part.file };
      if (at >= 0) list[at] = m;
      else list.push(m);
      byRun.set(l.run, list);
    }
  const out = data.map((d) => ({
    ...d,
    patients: d.patients.map((p) => ({ ...p, runs: p.runs.map((r) => (byRun.has(r.id) ? { ...r, expert: byRun.get(r.id) } : r)) })),
  }));
  return { data: out, unmatched };
}

/**
 * Fetch the expert labels of every library folder whose index.json declares a label file ("labels": "labels.json");
 * folders that declare none are not asked, and a missing or unreadable file is no labels.
 */
export async function loadLabels(): Promise<{ dataset: DatasetName; labels: ExpertLabel[]; source: "library"; file: string; problems: string[] }[]> {
  const sources = await loadLabelSources();
  const out = await Promise.all(
    sources.map(async (s) => {
      const file = s.file;
      try {
        const r = await fetch(file, { cache: "no-store" });
        if (!r.ok) return null;
        const { labels, problems } = parseLabelFile(await r.json(), file);
        return { dataset: s.name, labels, source: "library" as const, file, problems };
      } catch {
        return null;
      }
    })
  );
  return out.filter((x): x is NonNullable<typeof x> => !!x);
}

// ---------------------------------------------------------------------------
// Reader mode: the supervising reader's labels in this browser (never uploaded)
// ---------------------------------------------------------------------------

export interface ReaderState {
  enabled: boolean;
  name: string;
  qualification: string;
  labels: ExpertLabel[];
}

const READER_KEY = "cathmaster:v1:angio-reader";

function readReader(): ReaderState {
  const empty: ReaderState = { enabled: false, name: "", qualification: "", labels: [] };
  try {
    const raw = globalThis.localStorage?.getItem(READER_KEY);
    if (!raw) return empty;
    const v = JSON.parse(raw) as Partial<ReaderState>;
    return {
      enabled: !!v.enabled,
      name: typeof v.name === "string" ? v.name : "",
      qualification: typeof v.qualification === "string" ? v.qualification : "",
      labels: Array.isArray(v.labels) ? v.labels.filter((l) => labelProblems(l).length === 0) : [],
    };
  } catch {
    return empty;
  }
}

function writeReader(s: ReaderState) {
  try {
    globalThis.localStorage?.setItem(READER_KEY, JSON.stringify(s));
  } catch {
    // storage full or unavailable: the labels last for this session only; export them
  }
}

interface ReaderStore extends ReaderState {
  setEnabled(on: boolean): void;
  setReader(name: string, qualification: string): void;
  /** set (or with null clear) fields of this reader's label on a run */
  setLabel(run: string, patch: Partial<Omit<ExpertLabel, "run" | "reader" | "date">> | null): void;
  /** merge a Reader-mode export or labels.json into this browser's labels; returns what was taken and refused */
  importFile(text: string): { added: number; problems: string[] };
  exportFile(): string;
}

export const useReaderStore = create<ReaderStore>((set, get) => ({
  ...readReader(),
  setEnabled(on) {
    set({ enabled: on });
    writeReader(pickState(get()));
  },
  setReader(name, qualification) {
    set({ name, qualification });
    writeReader(pickState(get()));
  },
  setLabel(run, patch) {
    const s = get();
    if (!s.name.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const rest = s.labels.filter((l) => !(l.run === run && l.reader === s.name));
    const prev = s.labels.find((l) => l.run === run && l.reader === s.name);
    let next: ExpertLabel | null = null;
    if (patch) {
      const merged: ExpertLabel = { ...(prev ?? { run, reader: s.name, date: today }), ...patch, run, reader: s.name, date: today };
      for (const k of Object.keys(merged) as (keyof ExpertLabel)[]) if (merged[k] === undefined) delete merged[k];
      // an invalid change is refused and the run's label kept as it was (never dropped)
      if (labelProblems(merged).length) return;
      next = merged;
    }
    set({ labels: next ? [...rest, next] : rest });
    writeReader(pickState(get()));
  },
  importFile(text) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { added: 0, problems: ["The file is not JSON."] };
    }
    const { labels, problems } = parseLabelFile(json, "imported file");
    const s = get();
    const key = (l: ExpertLabel) => `${l.run}\u0000${l.reader}`;
    const map = new Map(s.labels.map((l) => [key(l), l]));
    for (const l of labels) map.set(key(l), l);
    set({ labels: [...map.values()] });
    writeReader(pickState(get()));
    return { added: labels.length, problems };
  },
  exportFile() {
    return exportLabelFile(get());
  },
}));

const pickState = (s: ReaderState): ReaderState => ({ enabled: s.enabled, name: s.name, qualification: s.qualification, labels: s.labels });

/** The JSON a reader exports (the labels.json format). */
export function exportLabelFile(s: Pick<ReaderState, "name" | "qualification" | "labels">, now = new Date()): string {
  const file: LabelFile = {
    schema: LABEL_SCHEMA,
    reader: { name: s.name, ...(s.qualification ? { qualification: s.qualification } : {}) },
    exported: now.toISOString().slice(0, 10),
    labels: s.labels.map((l) => ({ ...l })),
  };
  return JSON.stringify(file, null, 2);
}

// ---------------------------------------------------------------------------
// The label-gated drills
// ---------------------------------------------------------------------------

export type LabelDrillId = "timi" | "frame-count" | "morphology" | "collateral-grade" | "medina" | "calcium" | "classify" | "segment";
export const LABEL_DRILL_IDS: readonly LabelDrillId[] = ["timi", "frame-count", "morphology", "collateral-grade", "medina", "calcium", "classify", "segment"];
export const isLabelDrillId = (s: unknown): s is LabelDrillId => typeof s === "string" && (LABEL_DRILL_IDS as readonly string[]).includes(s);

/**
 * Labelled runs a drill needs before it is shown: the build plan's rule (at least 20 labelled runs per drill,
 * docs/curriculum/lab-build-plan.json angio-expert-label-drills). A planning parameter, not a source value.
 */
export const LABEL_GATE_MIN = 20;
/** Frames either side of the reader's count accepted when the reader states no tolerance. MODEL PARAMETER. */
export const FRAME_TOLERANCE_DEFAULT = 3;

export interface LabelDrillDef {
  id: LabelDrillId;
  label: string;
  /** the lesson the drill practises */
  lessonId: string;
  /** what the set asks, shown above it */
  blurb: string;
  /** the label field(s) the drill needs, as a key for agreement between readers */
  field: (l: ExpertLabel) => unknown;
  /**
   * The reference label of a run from its library readers' labels (all carrying the field), or null when they
   * disagree. Default: every reader's field key equal, and the first reader's label.
   */
  consensus?: (ls: MergedLabel[]) => MergedLabel | null;
  /** events the reveal adds to the diagnostic views context (tip vocabulary) */
  events: (l: ExpertLabel) => LabEvent[];
  /** the lesson's own tips (ids in LAB_TIPS), shown first in the reveal whatever the context scores */
  tips: string[];
}

const has = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;

/** Whether the target vessel is occluded for the SCAI class: TIMI 0 flow, or an occlusion among the ACC/AHA features. */
export const labelOccluded = (l: Pick<ExpertLabel, "timi" | "accAha">): boolean => l.timi === 0 || (!!l.accAha && l.accAha.occlusion !== "none");

/**
 * Frame counts of several readers agree when they name the same vessel and lie within the smallest tolerance any of
 * them states (FRAME_TOLERANCE_DEFAULT when none does); the reference count is their median, rounded.
 */
function frameCountConsensus(ls: MergedLabel[]): MergedLabel | null {
  const fs = ls.map((l) => l.frameCount!);
  if (new Set(fs.map((f) => f.vessel)).size !== 1) return null;
  const tol = Math.min(...fs.map((f) => f.tolerance ?? FRAME_TOLERANCE_DEFAULT));
  const counts = fs.map((f) => f.frames).sort((a, b) => a - b);
  if (counts[counts.length - 1] - counts[0] > tol) return null;
  if (ls.length === 1) return ls[0];
  const mid = counts.length >> 1;
  const median = counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2;
  const f0 = fs[0];
  return { ...ls[0], frameCount: { vessel: f0.vessel, frames: Math.round(median), tolerance: tol, ...(f0.landmark ? { landmark: f0.landmark } : {}) } };
}

export const LABEL_DRILLS: Record<LabelDrillId, LabelDrillDef> = {
  timi: {
    id: "timi",
    label: "TIMI flow",
    lessonId: "pm-interpreting-flow",
    blurb: "Grade TIMI flow against the proximal segment or the opposite artery and name the bed you compared with.",
    field: (l) => (has(l.timi) ? l.timi : undefined),
    events: (l) => (l.timi === 0 ? ["slow-flow", "total-occlusion"] : ["slow-flow"]),
    tips: ["pci-interp-grade-flow"],
  },
  "frame-count": {
    id: "frame-count",
    label: "Frame count",
    lessonId: "pm-interpreting-flow",
    blurb: "Count the frames from contrast across the origin to the distal landmark at the run's own frame rate; LAD counts are corrected by dividing by 1.7.",
    field: (l) => (l.frameCount ? l.frameCount.vessel : undefined),
    consensus: frameCountConsensus,
    events: () => ["slow-flow"],
    tips: ["pci-interp-grade-flow"],
  },
  morphology: {
    id: "morphology",
    label: "Describe the lesion",
    lessonId: "pm-interpreting-morphology",
    blurb: "Grade the lesion's thrombus, calcium and dissection.",
    field: (l) => (has(l.thrombusGrade) && has(l.calcium) && has(l.nhlbi) ? `${l.thrombusGrade}|${l.calcium}|${l.nhlbi}` : undefined),
    events: () => ["slow-flow", "thrombus", "dissection", "calcified-lesion"],
    tips: ["pci-interp-thrombus-grade", "pci-interp-calcium-look-first", "pci-interp-dissection-nhlbi"],
  },
  "collateral-grade": {
    id: "collateral-grade",
    label: "Grade the collaterals",
    lessonId: "pm-interpreting-collaterals",
    blurb: "Watch to the end of the run, then name donor and recipient, the Rentrop grade, the Werner grade and the channel.",
    field: (l) => (has(l.rentrop) && has(l.wernerCC) && l.channel && l.donor && l.recipient ? `${l.donor}>${l.recipient}|${l.rentrop}|${l.wernerCC}|${l.channel}` : undefined),
    events: () => ["total-occlusion"],
    tips: ["diag-interp-collateral-long-run"],
  },
  medina: {
    id: "medina",
    label: "Medina",
    lessonId: "cp-bifurcation-provisional-assess",
    blurb: "Score the proximal main vessel, distal main vessel and side branch (1 for a stenosis of 50% or more), then size the side branch against 2 mm.",
    field: (l) => (l.medina ? `${l.medina.pmv}${l.medina.dmv}${l.medina.sb}` : undefined),
    events: () => [],
    // no tip in LAB_TIPS teaches the Medina reading itself (cp-bifurcation-provisional-assess has none)
    tips: [],
  },
  calcium: {
    id: "calcium",
    label: "Grade the calcium",
    lessonId: "cp-calcium-recognise",
    blurb: "Scroll to the frames before contrast arrives and grade the calcium as severe, moderate or none.",
    field: (l) => l.calcium,
    events: () => ["calcified-lesion"],
    tips: ["pci-interp-calcium-look-first"],
  },
  classify: {
    id: "classify",
    label: "Classify the lesion",
    lessonId: "pm-planning-classification",
    blurb: "Record the lesion's features; the ACC/AHA type and SCAI class follow from them.",
    field: (l) => (l.accAha ? `${accAhaType(l.accAha)}|${scaiClass(l.accAha, labelOccluded(l))}` : undefined),
    events: () => [],
    tips: ["pci-planning-classify-lesion"],
  },
  segment: {
    id: "segment",
    label: "Name the segment",
    lessonId: "pm-acquiring-anatomy",
    blurb: "Decide dominance, then name the SYNTAX segment of the marked point.",
    // readers never place identical points: they agree on the dominance and the set of segments they marked
    field: (l) => (l.dominance && l.segmentPoints?.length ? `${l.dominance}|${[...new Set(l.segmentPoints.map((s) => s.segment))].sort().join(",")}` : undefined),
    events: () => [],
    tips: ["diag-acq-dominance-follow-pda"],
  },
};

/** A run with the label a drill scores against. */
export interface LabelledRun {
  run: LibRun;
  label: MergedLabel;
  /** readers whose labels agree on the drill's field */
  readers: string[];
  /** the files those labels came from */
  files: string[];
}

const keyConsensus = (def: LabelDrillDef) => (ls: MergedLabel[]): MergedLabel | null =>
  new Set(ls.map((l) => JSON.stringify(def.field(l)))).size === 1 ? ls[0] : null;

/**
 * Runs usable for a drill: a library label (never one made or imported in this browser) for the drill's field,
 * and every library reader who labelled that field agreeing (LabelDrillDef.consensus). Runs of held-out exam
 * patients are left out here as well as by the caller, which passes practice runs only.
 */
export function labelledRuns(drill: LabelDrillId, runs: readonly LibRun[]): LabelledRun[] {
  const def = LABEL_DRILLS[drill];
  const agree = def.consensus ?? keyConsensus(def);
  const out: LabelledRun[] = [];
  for (const run of runs) {
    if (heldOutPatient(run.dataset, run.patientId)) continue;
    const ls = (run.expert ?? []).filter((l) => l.source === "library" && def.field(l) !== undefined);
    if (!ls.length) continue;
    const label = agree(ls);
    if (!label) continue; // readers disagree: left out
    out.push({ run, label, readers: [...new Set(ls.map((l) => l.reader))].sort(), files: [...new Set(ls.map((l) => l.file))].sort() });
  }
  return out;
}

export interface DrillGate {
  drill: LabelDrillId;
  open: boolean;
  labelled: number;
  needed: number;
  /** readers behind the usable labels */
  readers: string[];
  /** the files the usable labels came from */
  files: string[];
  /** labels in this browser for the drill (Reader mode or imported): shown, never scored */
  localOnly: number;
}

/** Whether a drill has enough usable labels to be shown. */
export function drillGate(drill: LabelDrillId, runs: readonly LibRun[], min = LABEL_GATE_MIN): DrillGate {
  const lr = labelledRuns(drill, runs);
  const def = LABEL_DRILLS[drill];
  const localOnly = runs.filter((r) => (r.expert ?? []).some((l) => l.source === "local" && def.field(l) !== undefined)).length;
  return {
    drill,
    open: lr.length >= min,
    labelled: lr.length,
    needed: min,
    readers: [...new Set(lr.flatMap((x) => x.readers))].sort(),
    files: [...new Set(lr.flatMap((x) => x.files))].sort(),
    localOnly,
  };
}

/** The drill the 'timi' and 'frame-count' links open: the real-run drill once its gate is open, else the simulated runs. */
export function flowDrillTarget(drill: "timi" | "frame-count", runs: readonly LibRun[]): "real" | "simulated" {
  return drillGate(drill, runs).open ? "real" : "simulated";
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface LabelPart {
  key: string;
  prompt: string;
  options: string[];
  /** index into options */
  answer: number;
  /** ordered categories (weighted kappa) */
  ordinal?: boolean;
  /** false: asked and shown beside the reader's choice, but not part of the score (default true) */
  scored?: boolean;
}

export interface LabelItem {
  drill: LabelDrillId;
  run: LibRun;
  label: MergedLabel;
  readers: string[];
  question: string;
  /** choice parts; a frame-count item has none and a count instead */
  parts: LabelPart[];
  count?: { frames: number; tolerance: number; vessel: FrameVessel; fps: number };
  /** a marked point the question is about (segment drill): a guided aid, not the answer */
  mark?: { frame: number; x: number; y: number };
  /** class used for stratified sampling */
  stratum: string | number;
}

export const THROMBUS_OPTIONS = ["0 none", "1 possible", "2 up to half a vessel diameter", "3 over half, under two diameters", "4 two diameters or more", "5 total occlusion"];
export const CALCIUM_OPTIONS: CalciumGrade[] = ["none", "moderate", "severe"];
export const NHLBI_OPTIONS: NhlbiType[] = ["none", "A", "B", "C", "D", "E", "F"];
export const TIMI_OPTIONS = ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3"];


/** The items of one labelled run for a drill (one per run; one per segment point for the segment drill). */
export function labelItems(drill: LabelDrillId, lr: LabelledRun): LabelItem[] {
  const { run, label: l, readers } = lr;
  const base = { drill, run, label: l, readers };
  switch (drill) {
    case "timi":
      return [
        {
          ...base,
          question: "Grade the TIMI flow of this run.",
          parts: [
            { key: "timi", prompt: "TIMI flow grade", options: TIMI_OPTIONS, answer: l.timi!, ordinal: true },
            // either bed can be valid (pm-interpreting-flow asks the learner to name the one used), so the bed is not scored
            ...(l.comparisonBed
              ? [{ key: "bed", prompt: "Compared with (not scored)", options: ["the proximal segment", "the opposite artery"], answer: l.comparisonBed === "proximal" ? 0 : 1, scored: false }]
              : []),
          ],
          stratum: l.timi!,
        },
      ];
    case "frame-count": {
      const f = l.frameCount!;
      return [
        {
          ...base,
          question: `Count the frames from contrast across the origin of the ${f.vessel} to ${f.landmark ?? "the distal landmark"}.`,
          parts: [],
          count: { frames: f.frames, tolerance: f.tolerance ?? FRAME_TOLERANCE_DEFAULT, vessel: f.vessel, fps: run.fps },
          stratum: f.vessel,
        },
      ];
    }
    case "morphology":
      return [
        {
          ...base,
          question: "Describe the lesion in order, then grade the thrombus, the calcium and any dissection.",
          parts: [
            { key: "thrombus", prompt: "TIMI thrombus grade", options: THROMBUS_OPTIONS, answer: l.thrombusGrade!, ordinal: true },
            { key: "calcium", prompt: "Calcium", options: CALCIUM_OPTIONS, answer: CALCIUM_OPTIONS.indexOf(l.calcium!), ordinal: true },
            { key: "nhlbi", prompt: "NHLBI dissection type", options: NHLBI_OPTIONS.map((t) => (t === "none" ? "none" : `type ${t}`)), answer: NHLBI_OPTIONS.indexOf(l.nhlbi!) },
          ],
          stratum: l.thrombusGrade! > 0 ? "thrombus" : l.nhlbi !== "none" ? "dissection" : "other",
        },
      ];
    case "collateral-grade": {
      const arteries = [...ARTERIES];
      // validation restricts donor and recipient to the options; a label outside them gives no item rather than a wrong answer
      if (!arteries.includes(l.donor!) || !arteries.includes(l.recipient!)) return [];
      return [
        {
          ...base,
          question: "Watch the run to the end. Name the donor and recipient, grade the filling and the channel, and say whether it is septal or epicardial.",
          parts: [
            { key: "donor", prompt: "Donor artery", options: arteries, answer: arteries.indexOf(l.donor!) },
            { key: "recipient", prompt: "Recipient artery", options: arteries, answer: arteries.indexOf(l.recipient!) },
            { key: "rentrop", prompt: "Rentrop grade", options: ["0", "1", "2", "3"], answer: l.rentrop!, ordinal: true },
            { key: "werner", prompt: "Werner grade", options: ["CC0", "CC1", "CC2"], answer: l.wernerCC!, ordinal: true },
            { key: "channel", prompt: "Channel", options: ["septal", "epicardial"], answer: l.channel === "septal" ? 0 : 1 },
          ],
          stratum: l.rentrop!,
        },
      ];
    }
    case "medina": {
      const m = l.medina!;
      const d = ["0", "1"];
      return [
        {
          ...base,
          question: "Score the bifurcation (1 for a stenosis of 50% or more) in the order proximal main vessel, distal main vessel, side branch.",
          parts: [
            { key: "pmv", prompt: "Proximal main vessel", options: d, answer: m.pmv },
            { key: "dmv", prompt: "Distal main vessel", options: d, answer: m.dmv },
            { key: "sb", prompt: "Side branch", options: d, answer: m.sb },
            ...(m.sideBranchMm !== undefined ? [{ key: "sbsize", prompt: "Side branch against 2 mm", options: ["under 2 mm", "2 mm or more"], answer: m.sideBranchMm >= 2 ? 1 : 0 }] : []),
          ],
          stratum: `${m.pmv}${m.dmv}${m.sb}`,
        },
      ];
    }
    case "calcium":
      return [
        {
          ...base,
          question: "Scroll to the frames before contrast arrives and grade the calcium.",
          parts: [{ key: "calcium", prompt: "Calcium", options: CALCIUM_OPTIONS, answer: CALCIUM_OPTIONS.indexOf(l.calcium!), ordinal: true }],
          stratum: l.calcium!,
        },
      ];
    case "classify": {
      const f = l.accAha!;
      const type = accAhaType(f);
      const scai = scaiClass(f, labelOccluded(l));
      return [
        {
          ...base,
          question: "Record the lesion's features. The ACC/AHA type and SCAI class are derived from what you record.",
          parts: [
            { key: "type", prompt: "ACC/AHA type (derived from your features)", options: [...ACC_AHA_TYPES], answer: ACC_AHA_TYPES.indexOf(type), ordinal: true },
            { key: "scai", prompt: "SCAI class (derived)", options: [...SCAI_CLASSES], answer: SCAI_CLASSES.indexOf(scai) },
          ],
          stratum: type,
        },
      ];
    }
    case "segment": {
      const dom = l.dominance!;
      const opts = segmentsFor(dom);
      // a point whose segment does not exist in the study's dominance gives no item (validation refuses such labels)
      return (l.segmentPoints ?? [])
        .filter((sp) => opts.some((s) => s.id === sp.segment))
        .map((sp) => ({
          ...base,
          question: `In this ${dom}-dominant study, which SYNTAX segment is the marked point in?`,
          parts: [{ key: "segment", prompt: "SYNTAX segment", options: opts.map((s) => `${s.id} ${s.name}`), answer: opts.findIndex((s) => s.id === sp.segment) }],
          mark: { frame: sp.frame, x: sp.x, y: sp.y },
          stratum: sp.segment,
        }));
    }
  }
}

/** Items per stratum in one set. MODEL PARAMETER (a 5-10 minute set). */
export const LABEL_PER_CLASS = 3;

/** A stratified set of a drill's items from the usable labelled runs. */
export function labelSet(drill: LabelDrillId, runs: readonly LibRun[], r: () => number = Math.random, perClass = LABEL_PER_CLASS): LabelItem[] {
  const items = labelledRuns(drill, runs).flatMap((lr) => labelItems(drill, lr));
  return stratifiedSample(items, (it) => it.stratum, perClass, r);
}

/** A learner's answer to a label item: an option index per part, or a frame count (null: does not reach the landmark). */
export interface LabelAnswer {
  parts: Record<string, number>;
  frames?: number | null;
  /** stated confidence (0..1) that the whole answer is right */
  conf: number;
}

export interface LabelScore {
  /** per part: right or wrong */
  parts: Record<string, boolean>;
  /** the count within the reader's tolerance (frame-count items) */
  countCorrect?: boolean;
  countError?: number | null;
  /** every scored part (and the count) right */
  correct: boolean;
  /** the first part's reference and answer, for kappa and the results log */
  ref: number;
  ans: number;
}

/** Score an answer against the reader's label. */
export function scoreLabelItem(item: LabelItem, a: LabelAnswer): LabelScore {
  const parts: Record<string, boolean> = {};
  for (const p of item.parts) parts[p.key] = a.parts[p.key] === p.answer;
  let countCorrect: boolean | undefined;
  let countError: number | null | undefined;
  if (item.count) {
    if (a.frames === null || a.frames === undefined) {
      countCorrect = false;
      countError = null;
    } else {
      countError = a.frames - item.count.frames;
      countCorrect = Math.abs(countError) <= item.count.tolerance;
    }
  }
  const first = item.parts[0];
  return {
    parts,
    countCorrect,
    countError,
    correct: item.parts.every((p) => p.scored === false || parts[p.key]) && countCorrect !== false,
    ref: first ? first.answer : item.count?.frames ?? 0,
    ans: first ? a.parts[first.key] ?? -1 : a.frames ?? -1,
  };
}

// ---------------------------------------------------------------------------
// ACC/AHA type and SCAI class (pm-planning-classification, Oxford Table 8.2; Krone 2000)
// ---------------------------------------------------------------------------

export const ACC_AHA_TYPES = ["A", "B1", "B2", "C"] as const;
export type AccAhaType = (typeof ACC_AHA_TYPES)[number];
export const SCAI_CLASSES = ["I", "II", "III", "IV"] as const;
export type ScaiClass = (typeof SCAI_CLASSES)[number];

/** The type C features present (pm-planning-classification's table, type C column). */
export function typeCFeatures(f: AccAhaFeatures): string[] {
  const c: string[] = [];
  if (f.length === ">20") c.push("diffuse, over 20 mm");
  if (f.access === "excessive") c.push("excessive tortuosity");
  if (f.angulation === "extreme") c.push("extreme angulation, over 90°");
  if (f.branch === "unprotected") c.push("bifurcation with an unprotected side branch");
  if (f.occlusion === "over-3-months") c.push("occlusion over 3 months old");
  if (f.thrombus === "heavy") c.push("heavy thrombus burden");
  if (f.degeneratedSvg) c.push("degenerated saphenous vein graft");
  return c;
}

/** The type B features present (type B column). */
export function typeBFeatures(f: AccAhaFeatures): string[] {
  const b: string[] = [];
  if (f.length === "10-20") b.push("tubular, 10-20 mm");
  if (f.eccentric) b.push("eccentric");
  if (f.access === "moderate") b.push("moderate tortuosity");
  if (f.angulation === "moderate") b.push("moderate angulation, 45-90°");
  if (f.irregular) b.push("irregular contour");
  if (f.calcium === "moderate-heavy") b.push("moderate or heavy calcium");
  if (f.branch === "protected") b.push("bifurcation with a protected side branch");
  if (f.ostial) b.push("ostial");
  if (f.occlusion === "under-3-months") b.push("occlusion under 3 months old");
  if (f.thrombus === "some") b.push("some thrombus");
  return b;
}

/** ACC/AHA type: C with any type C feature; B2 with two or more B features; B1 with one; otherwise A. */
export function accAhaType(f: AccAhaFeatures): AccAhaType {
  if (typeCFeatures(f).length) return "C";
  const b = typeBFeatures(f).length;
  return b >= 2 ? "B2" : b === 1 ? "B1" : "A";
}

/** SCAI class: type C feature (yes or no) by vessel patent or occluded, classes I-IV. */
export function scaiClass(f: AccAhaFeatures, occluded: boolean): ScaiClass {
  const c = typeCFeatures(f).length > 0;
  return occluded ? (c ? "IV" : "III") : c ? "II" : "I";
}

// ---------------------------------------------------------------------------
// Frame counts: correction and published normals
// ---------------------------------------------------------------------------

/** Gibson's LAD correction (pm-interpreting-flow: the LAD count is about 1.7 times the RCA and circumflex mean). */
export const LAD_CORRECTION = 1.7;

/**
 * A frame count scaled from the run's rate to `targetFps` (default: the run's own rate) and, for the LAD,
 * divided by 1.7: the corrected TIMI frame count at the target rate.
 */
export function correctedFrameCount(frames: number, o: { vessel: FrameVessel; runFps: number; targetFps?: number }): number {
  if (!(o.runFps > 0)) throw new Error("correctedFrameCount: the run's frame rate must be positive");
  const scaled = frames * ((o.targetFps ?? o.runFps) / o.runFps);
  return o.vessel === "LAD" ? scaled / LAD_CORRECTION : scaled;
}

/** The reference whose verified values give the published normal counts and the study's frame rate. */
export const FRAME_COUNT_REF = "gibson-tfc-1996";
/**
 * Keys of Reference.verifiedValues that must all be present (checked against the full paper) before a normal
 * count is shown: the study's frame rate and the mean and SD of each vessel's normal count.
 */
export const FRAME_COUNT_VALUE_KEYS = ["tfcStudyFps", "tfcLadMean", "tfcLadSd", "tfcLcxMean", "tfcLcxSd", "tfcRcaMean", "tfcRcaSd"] as const;

export interface FrameCountNormals {
  refId: string;
  studyFps: number;
  /** the published mean and SD at the study's rate */
  normals: Record<FrameVessel, { mean: number; sd: number }>;
  /** a run's count must be multiplied by this to compare it with the normals (studyFps / runFps) */
  scale: number;
  text: string;
}

/**
 * The published normal counts, for comparison with a count made at `runFps`, or null. They show only when the
 * reference is in refs, verified, and carries every value in FRAME_COUNT_VALUE_KEYS (verified from the full
 * paper); otherwise no normal value is shown anywhere in the drills.
 */
export function frameCountNormals(runFps: number, refs: Readonly<Record<string, Reference>> = REF_BY_ID): FrameCountNormals | null {
  const ref = refs[FRAME_COUNT_REF];
  const v = ref?.verifiedValues;
  if (!ref || !ref.verified || !v || !FRAME_COUNT_VALUE_KEYS.every((k) => typeof v[k] === "number" && Number.isFinite(v[k]))) return null;
  const studyFps = v.tfcStudyFps;
  if (!(studyFps > 0) || !(runFps > 0)) return null;
  const normals: FrameCountNormals["normals"] = {
    LAD: { mean: v.tfcLadMean, sd: v.tfcLadSd },
    LCx: { mean: v.tfcLcxMean, sd: v.tfcLcxSd },
    RCA: { mean: v.tfcRcaMean, sd: v.tfcRcaSd },
  };
  const scale = studyFps / runFps;
  return {
    refId: FRAME_COUNT_REF,
    studyFps,
    normals,
    scale,
    text: `Published normal counts at the study's ${studyFps} frames per second: LAD ${normals.LAD.mean} ± ${normals.LAD.sd} (uncorrected), circumflex ${normals.LCx.mean} ± ${normals.LCx.sd}, RCA ${normals.RCA.mean} ± ${normals.RCA.sd}. Multiply a count made at ${runFps} frames per second by ${+scale.toFixed(3)} before comparing.`,
  };
}

// ---------------------------------------------------------------------------
// Tips
// ---------------------------------------------------------------------------

/** How many tips a drill's reveal shows (tipsFor's limit). */
export const REVEAL_TIPS = 4;

/** The tip context of a labelled item's reveal: the diagnostic lab in the views phase with the drill's events. */
export function labelTipContext(item: Pick<LabelItem, "drill" | "label" | "run">): LabContext {
  const ctx: LabContext = { lab: "diagnostic", phase: "views", events: LABEL_DRILLS[item.drill].events(item.label) };
  const v = tipVesselOf(item);
  if (v) ctx.vessel = v;
  return ctx;
}

/**
 * The tips a reveal shows: the lesson's own tips first (`lead`, ids in LAB_TIPS), then, without repeats and up to
 * `limit`, only those tipsFor(ctx) results whose trigger names one of the reveal's events. Generic views-phase tips
 * with no event are not used to fill the remaining slots; with no event match the lead tips show alone.
 */
export function revealTips(ctx: LabContext, lead: readonly string[], limit = REVEAL_TIPS): LabTip[] {
  const out: LabTip[] = [];
  const seen = new Set<string>();
  const add = (t: LabTip | undefined) => {
    if (t && !seen.has(t.id) && out.length < limit) {
      seen.add(t.id);
      out.push(t);
    }
  };
  for (const id of lead) add(TIP_BY_ID[id]);
  const events = ctx.events ?? [];
  for (const t of tipsFor(ctx, limit + lead.length)) if (t.when.event?.some((e) => events.includes(e))) add(t);
  return out;
}

/** The tips a labelled item's reveal shows: the drill's lesson tips, then the diagnostic views tips for its events. */
export function labelRevealTips(item: Pick<LabelItem, "drill" | "label" | "run">, limit = REVEAL_TIPS): LabTip[] {
  return revealTips(labelTipContext(item), LABEL_DRILLS[item.drill].tips, limit);
}

function tipVesselOf(item: Pick<LabelItem, "drill" | "label" | "run">): TipVessel | undefined {
  if (item.drill === "segment") return item.run.artery === "RCA" ? "RCA" : item.label.dominance === "left" ? "LCx" : undefined;
  if (item.drill === "frame-count" && item.label.frameCount) return item.label.frameCount.vessel as TipVessel;
  return undefined;
}

/** What the label drills report to the tip engine (the reveal's contexts; see LABEL_DRILLS[].events). */
export const raises: LabRaises = {
  lab: "diagnostic",
  phases: ["views"],
  events: ["slow-flow", "total-occlusion", "thrombus", "dissection", "calcified-lesion"],
};
